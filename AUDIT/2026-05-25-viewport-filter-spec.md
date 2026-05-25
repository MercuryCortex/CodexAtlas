# Phase 24 — Viewport-aware active filter (spec)

*Filed 2026-05-25 NIGHT after Phase 23.1 a–j retry + bundle landed. Per the Google Maps bar (memory: feedback_google_maps_bar_2026-05-25).*

## The problem, in numbers

Tonight's profiling against the current 4476-node vault revealed:

| Mode | Active nodes | rebuildForMode ms | ms / active node |
|---|---:|---:|---:|
| places | 111 | 16 | 0.15 |
| symbols | 280 | 56 | 0.20 |
| traditions | 307 | 29 | 0.10 |
| events | 309 | 113 | **0.36** (outlier — date math?) |
| themes | 497 | 73 | 0.15 |
| deities | 682 | 82 | 0.12 |

Linear projection at ~0.15 ms/active node:

| Active set size | Mode-switch / layout-switch cost |
|---:|---:|
| 1,000 | 150 ms (~9 frames lost) |
| 5,000 | 750 ms (visible page freeze) |
| 10,000 | 1.5 s (broken) |
| 50,000 | 7.5 s (page hung) |

**Mode/layout switches are the wall.** Pan/zoom/hover do NOT trigger rebuildForMode, so the felt fluidity during normal interaction is bottlenecked elsewhere (TBD via real-browser DevTools profile). But the first time a user opens "Themes" on a 50k-node vault, the page locks up for 7 seconds. That's not a Google Maps experience.

The architecture is otherwise sound: GPU instancing (1 vbo write per rebuild), spatial hit-grid (sub-µs lookups), bounded resource count (12 owned GPU resources). The bottleneck is purely on the JS-side rebuild path — and it's bounded by the **active set**, not by vault size.

So the architectural fix is to keep the active set bounded by the viewport, not by the vault.

## The change — Phase 24A (this spec)

**Add a viewport-cull step to `rebuildForMode` that limits the active set to nodes inside (camera bbox + margin).** The vault stays loaded; the in-memory full-fat node objects stay (Phase 24E will address that). What changes is which nodes enter the active set that downstream pipeline phases (hit-grid, packing, GPU buffer, edge degree, side-panel adjacency cache) iterate over.

### Current pipeline (forge.js:2473–2480)

```
filterNodesByMode(modeId, allNodes, allEdges)  →  modeNodes        // O(N_vault)
filterEdgesByNodes(allEdges, modeNodes)        →  modeEdges        // O(E_vault)
computeDegree(modeNodes, modeEdges)             →  degree           // O(E_active)
layout.run(modeNodes, ...)                      →  positions        // O(N_active)
buildHitGrid + buildRadiiMap + buildSearchIndex                     // O(N_active)
packNodes + rebuildGlyphInstanceBuffer                              // O(N_active)
```

### New pipeline (proposed)

```
filterNodesByMode(modeId, allNodes, allEdges)  →  typeNodes        // O(N_vault), unchanged
layout.run(typeNodes, ...)                      →  layoutPositions  // O(N_typeMatch)
filterByViewport(typeNodes, layoutPositions,
                 camera.bbox(), margin)         →  modeNodes        // O(N_typeMatch), pure cull
filterEdgesByNodes(allEdges, modeNodes)        →  modeEdges
computeDegree(modeNodes, modeEdges)
                                                   ↓
                  [rest of pipeline unchanged but smaller N]
```

The layout pass still does O(typeMatch) work because it has to compute positions before we know what's in view. Phase 24B will pre-bake positions so layout becomes O(1) and viewport-cull becomes the only N-bounded pass. For now, the win is everything DOWNSTREAM of cull is bounded by viewport.

### Viewport bbox

```js
function viewportWorldBbox(camera, canvas, margin = 1.5) {
  const w = canvas.clientWidth  / camera.state.scale;
  const h = canvas.clientHeight / camera.state.scale;
  const cx = camera.state.centerX;
  const cy = camera.state.centerY;
  const padW = w * (margin - 1) / 2;
  const padH = h * (margin - 1) / 2;
  return {
    x0: cx - w/2 - padW,
    x1: cx + w/2 + padW,
    y0: cy - h/2 - padH,
    y1: cy + h/2 + padH,
  };
}
```

`margin = 1.5` = 25% pad on each side, so off-screen-but-near nodes stay in the active set during pan without thrashing the rebuild.

### Camera-change hook (debounced re-cull)

Currently, pan/zoom don't touch the active set. With viewport filtering, pan/zoom must re-cull. Add:

```js
camera.onChange((newState, oldState) => {
  if (significantChange(newState, oldState)) {
    scheduleRecull();   // 100 ms debounce
  }
});

function significantChange(n, o) {
  // Only re-cull when bbox has changed enough that nodes might enter/exit.
  // 25% pan or 20% zoom delta is the threshold.
  const dx = Math.abs(n.centerX - o.centerX);
  const dy = Math.abs(n.centerY - o.centerY);
  const ds = Math.abs(Math.log(n.scale / o.scale));
  const w = canvas.clientWidth  / n.scale;
  const h = canvas.clientHeight / n.scale;
  return dx > 0.25*w || dy > 0.25*h || ds > 0.18;  // log(1.2)
}
```

Debounced re-cull keeps mid-pan smooth (no per-frame rebuild) while ensuring nodes appear/disappear at the right moments.

### Edge filtering with cull

`filterEdgesByNodes` currently keeps an edge if both endpoints are in `modeNodes`. With viewport-cull this becomes: keep if both endpoints are in `modeNodes` (in-view + margin). That naturally culls long off-screen edges. Side-panel adjacency is unaffected because it queries `vaultEdges` directly (see side-panel.js).

### LOD fallback (out of scope for 24A, queued as 24C)

At extreme zoom-out where 10k+ nodes fall inside bbox, the cull alone doesn't help. Need: replace dense regions with cluster glyphs (one per ~100-node cell). 24C will own that. For 24A: just cap the active set at, say, 5000 nodes — if cull would return more, do a deterministic sample (every Nth node by id-hash) and tag the state `truncated: true` so the UI can show a "zoom in for full detail" hint.

## Public API changes

`window._forge` gets:

```js
window._forge.setViewportFilter(enabled, opts)
// opts = { margin: 1.5, capActive: 5000, debounceMs: 100 }
// Default state on mount: ENABLED. opts.margin = 1.5. opts.capActive = 5000.

window._forge.getViewportFilterState()
// → { enabled, margin, capActive, lastBbox, lastCullCount, lastCullDurationMs }
```

Hidden behind an explicit setter so it can be toggled off for A/B comparison during development.

## Risk list

1. **Cull thrashing during pan** — debounce + margin handle the common case but a fast pan can fire multiple re-culls. Mitigation: debounce to 100 ms minimum; cap re-cull rate to 5/sec.

2. **Edge stub-end visible** — an edge whose source is in-view and target is off-view will render as a stub ending at the viewport edge. Acceptable (Google Maps does this with roads). The hover-card still shows the off-screen target name on hover.

3. **Side-panel adjacency surprises** — clicking a node currently shows ALL connections in the side panel (queried from `vaultEdges`). That stays — viewport filter is render-only, not data-model. Cross-folder rows behave as today.

4. **Hit-test consistency** — hitTestAt only returns active-set nodes. Off-view nodes are unreachable. Correct, but the search box (`forge-status-search`) needs to bypass viewport filter so search-jump-to-deity still works on off-view nodes. Search → flyTo (centers camera on the node) → cull re-runs naturally.

5. **Camera-default on mount** — default zoom must show enough nodes to feel populated. Phase 21 set a 20% scan-view default; verify that gives 50–500 active nodes at the current vault.

## Test plan

1. **Unit:** `viewportWorldBbox` returns correct bbox for known camera states.
2. **Unit:** `filterByViewport` keeps every node inside bbox + margin, drops every node outside.
3. **Integration:** at current vault, deities mode, default zoom — measure rebuild ms. Should drop from 82 ms toward ~10–20 ms (less work per pass).
4. **Stress:** inject 25k synthetic nodes, deities mode, default zoom — verify rebuild stays under 50 ms (viewport cuts active down to a few hundred regardless of vault).
5. **Pan stress:** 1-second continuous pan, count re-culls fired. Should be ≤ 10 (debounced).
6. **Zoom-out stress:** zoom to extreme out — verify activeSet caps at 5000 with `truncated: true`.
7. **Search:** search a node guaranteed to be off-view at default zoom — verify flyTo centers it and rebuild brings it into active set.
8. **Hover/click:** off-view nodes can't be hit-tested. Confirm.

## What 24A does NOT do (queued)

- **24B — pre-baked world positions.** Layout becomes O(1) lookup instead of O(N_typeMatch). Real scale work.
- **24C — LOD cluster glyphs.** At extreme zoom-out, render aggregate cells, not individual nodes.
- **24D — edge culling refinement.** Visibility-cone culling (don't draw edges whose midpoint is off-screen).
- **24E — slim render data model.** Split per-node into `{render: ~50 bytes}` + `{detail: lazy on click}`. Solves the 27 MB-of-node-JSON-for-no-reason problem.

24A alone projects to maybe 20–30% better mode-switch latency at current vault — modest. The compounding wins come at scale: at 25k vault, current architecture = 7.5 s freeze, post-24A = ~30–60 ms (whatever cull returns). At 100k vault, the difference is "broken" → "fluid."

## Implementation outline

Files touched:
- `src/js/engine/graph/mode.js` — no change (filterNodesByMode stays pure).
- New: `src/js/engine/graph/viewport-filter.js` — exports `filterByViewport(nodes, positions, bbox)` and `viewportWorldBbox(camera, canvas, margin)`.
- `src/js/views/forge.js`:
  - rebuildForMode (line ~2473) — insert cull step after layout.run.
  - camera mount (line ~1534) — add `camera.onChange(handleCameraChange)`.
  - new local function `handleCameraChange` — debounced re-cull.
  - extend `local` with `_viewportFilterState` (enabled, opts, lastCullCount).
- `src/js/forge/install-public-api.js` — add `setViewportFilter` + `getViewportFilterState`.

Estimated LOC: ~150 net add (viewport-filter.js ~100, integration ~50).
Estimated risk: medium (touches rebuildForMode hot path + camera change pipeline; both are well-defined; smoke test gate covers it).

## What I want from John before coding

1. **Greenlight 24A** as scoped above, or push back on anything.
2. **Optional:** the real-browser DevTools profile (5 min, you'd record 5s of pan+zoom+click on current state, share the flame chart). Gives us the per-frame bottleneck info for prioritizing 24D vs 24E vs others. Not blocking — 24A's value doesn't depend on it.
3. **Camera-default sanity check:** at default zoom on a fresh forge mount, how many nodes do you SEE on screen? That's our target for "active set at idle." Want to land somewhere around 100–500.
