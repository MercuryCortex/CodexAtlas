# Pantheon-v2 parity audit · 2026-05-16

Auditor: read-only audit agent
Scope: `src/js/views/pantheon-v2.js` vs `VIEWS.pantheon` in `src/js/app.js` (lines ~783–1623). Cleanup verified at `app.js:582–588`. Wiring at `app.js:7754–7774`.
Method: source-only inspection (no runtime). Compared layout math, palettes, interaction handlers, DOM mounting strategy, and live-data edge-type vocabulary.

---

## 1. Parity matrix

| # | Item | Status | Evidence | Notes |
|---|------|--------|----------|-------|
| 1 | Family-wedge polar layout (sqrt-weighted, GAP=0.105 rad) | ✅ shipped | `pantheon-v2.js:31–94` vs `app.js:976–999` | Math is a faithful port: same `GAP=0.105`, same `Math.max(1.1, sqrt(N))` weight floor, same `cursor = -π·0.55` start, same 1/2/3-row rule (N≤4 / N≤9 / else). Row-radius mapping is different though — v2 spreads rows linearly between `Rinner=220` and `Router=540`; production puts row 0 at outer rim, row 1 at midpoint, row 2 at inner rim, plus a `hashStr` jitter (`app.js:1017–1021`). |
| 2 | Family-color fills + sqrt-degree node sizing | ✅ shipped | `pantheon-v2.js:199–212` | Size formula `Math.min(11, 4 + sqrt(deg)*1.3)` is a fair sigma analogue to production's tiered `TIER_RADIUS = [8, 6, 4.5, 3.5]` (`app.js:1374–1376`). Color uses `family_color || tradition_color || '#7a8090'`. |
| 3 | Click → window.selectNode | ✅ shipped | `pantheon-v2.js:291–295` | Calls `window.selectNode(node, true)` — opens detail panel by default. |
| 4 | Hover trail — dim non-neighbors, highlight edges | ✅ shipped | `pantheon-v2.js:247–278, 283–290` | sigma `nodeReducer` + `edgeReducer`; non-neighbors get `#3a3d44` + empty label, non-incident edges get `#2a2c32` + size 0.25. Functional equivalent of production's `.dim` / `.hot` classes (`app.js:1465–1488`). |
| 5 | Colored bezier edges per type | ⚠️ partial | `pantheon-v2.js:97–109` | **Palette is mostly wrong for the deity↔deity slice.** See §2. ~69% of deity↔deity edges fall to grey default. Also sigma's default edge program draws straight lines — there's no bezier program registered. |
| 6 | Tangential family rim labels (DOM overlay synced to camera) | ⚠️ partial | `pantheon-v2.js:124–163` | DOM overlay strategy is sound. But production uses **horizontal-with-tick** family labels with size scaling by wedge arc width (`app.js:1162–1199`), not tangential rotated text. The parity-checklist line item says "tangential rim labels" but the production target is *not* tangential. v2 is solving the wrong problem. |
| 7 | Mode dropdown (deities/authors/symbols/events/monuments) | ❌ missing | n/a | No `#pantheon-mode-select` rendered. v2 hardcodes `NODES.filter(n => n.type === 'deity')` at `pantheon-v2.js:181`. |
| 8 | labels: hub/all/off toggle | ❌ missing | n/a | No `#btn-labels` rendered. sigma's `labelDensity` + `labelRenderedSizeThreshold` give automatic culling but no user-facing mode switch. |
| 9 | Ego-focus button | ❌ missing | n/a | No `#btn-ego` rendered; no `setEgoFocus` analogue. |
| 10 | Family-legend click-to-filter | ❌ missing | n/a | No `legend` rendered. Production builds the family legend at `app.js:1062–1111`. |
| 11 | Family-filter + tier-overlay parity | ❌ missing | n/a | No `window._pantheonApplyFamilyFilter` analogue (`app.js:1542–1568`); no `filter-dim` class; no degree-tier overlay. |
| 12 | Cleanup on view-change (sigma teardown) | ✅ shipped — **but with destructive side-effect** | `app.js:582–588` | Cleanup query DOES include `.pantheon-v2-pane`, kills sigma, then removes the element. **The risk:** v2 calls `rootEl.classList.add('pantheon-v2-pane')` on `#canvas` (the `<main>` element passed via `document.getElementById('canvas')`, `app.js:7761`). So on view-change the cleanup pass would call `document.getElementById('canvas').remove()` — deleting the entire `<main>` (view-header, svg-wrap, codex-graph-pane, atlas-pane). See §4. |

Score: **5 ✅ / 2 ⚠️ / 5 ❌**. Phase A done, Phase B mostly done, **Phase C entirely absent**, plus a latent crash bug.

---

## 2. Visual fidelity

**Wedge math (item 1).** Faithful port at the family-allocation level — same `GAP`, same sqrt-weighted arc lengths, same wedge ordering driven by `FAMILIES`. Per-deity radial placement differs: production has row 0 hugging the rim (`Router - 14`), row 1 mid-annulus, row 2 hugging inside (`Rinner + 14`), plus a 10-unit hash-jitter for organic feel. v2 spreads rows linearly across the annulus and omits jitter. Result: v2 will look more "geometric" — a giveaway. Also v2 lacks the production force simulation (`d3.forceSimulation` with anchor + collide forces at `app.js:1315–1325`) and the hard wedge-clamp in the tick handler — so nodes sit exactly on their analytic anchors. Cleaner, but loses the lived-in feel.

**Edge palette (item 5).** This is the largest single visual gap. v2's `EDGE_COLOR` map names 17 edge types; only 4 of them (`attested-in`, `child-of`, `parent-of`, `attests`) match types that appear in the deity↔deity slice. Tallying the live data on this slice (`data.js`, 1259 edges):

```
525  syncretic                         → DEFAULT grey
191  child-of                          → mapped
145  parent-of                         → mapped
128  consort                           → DEFAULT grey  (v2 has 'consort-of', wrong key)
100  syncretic-scholarly-parallel      → DEFAULT grey
 89  syncretic-ancient-identification  → DEFAULT grey
 33  syncretic-structural-parallel     → DEFAULT grey
 12  attested-in                       → mapped
```

That's 877 / 1259 edges (≈ **69.7%**) rendering as grey. Compare to the production `EDGE_STYLE` map (`app.js:196–241`) which covers `syncretic`, `syncretic-*`, `consort`, `parent-of`, `child-of`, `parallel-motif`, the full `syncretic-*` family, etc. v2's palette also invents keys that aren't in the schema at all (`parallels`, `cognate-of`, `cited-in`, `theme`, `descends-from`).

Also: sigma's stock edge program draws straight line segments, not beziers. The parity-checklist item says "colored bezier edges per type" — production curves edges via `pantheonEdgePath` pulling each chord 35% toward center (`app.js:1202–1209`). v2 will have straight chord-spaghetti through the wedge interior. To get curves the renderer needs `EdgeCurveProgram` from `@sigma/edge-curve` registered as the default edge program — that registration is not present.

**Node sizing.** v2 uses a flat `4 + sqrt(deg)·1.3`, capped at 11. Production tiers by computed degree quartiles (top 8% / next 22% / next 35% / rest) with explicit radii `[8, 6, 4.5, 3.5]` and matching font tiers. Functionally similar; visually a touch flatter in v2.

**Rim labels (item 6).** v2's tangential-rotated overlay is a different design language from production's horizontal-with-leader-tick labels. The production design exists *because* horizontal labels read cleaner against the radial layout (per the in-source comment at `app.js:1156–1158`). Choosing tangential is a regression unless John has specifically asked for it — worth confirming before promoting.

---

## 3. Bugs / risks

**B1. `_codexGraph.unmount()` runs on every view change (`app.js:571`).** v2 doesn't register itself with `window._codexGraph` — it manages its own sigma instance stashed on `rootEl._sigma`. That's fine, but means the existing `_codexGraph` teardown machinery is bypassed; only the explicit `.pantheon-v2-pane` query in cleanup saves the day. Brittle.

**B2. Edge-key suffix uses a closure counter `_edgeCounter` (`pantheon-v2.js:214–217`).** Counter resets each render. If the user toggles to v2, then to another view, then back, parallel edges will get reset keys — fine in isolation but unhygienic.

**B3. `enableEdgeEvents: false` + `hideEdgesOnMove: true` + `hideLabelsOnMove: true` (`pantheon-v2.js:242–244`).** Reasonable, but `hideEdgesOnMove` hides edges during hover-trail refreshes because `sigma.refresh()` is called inside `enterNode` / `leaveNode`. Hover may flicker.

**B4. Mounting on `#canvas` consumes the view-header.** `render(rootEl)` calls `rootEl.innerHTML = ''` (`pantheon-v2.js:168`). `rootEl` is `document.getElementById('canvas')` (`app.js:7761`), which is the `<main class="canvas">` element holding `view-header`, `svg-wrap`, `codex-graph-pane`, `atlas-pane`. v2 blows them all away on first render. The setView() pass at line 580–581 immediately rewrites `view-controls` and the title — but those elements no longer exist after v2 has wiped `#canvas`. Switching from v2 back to any other view will then crash on `getElementById('view-title')` / `getElementById('svg')` — every other VIEW.render reads them. See B5.

**B5. Cleanup deletes `<main id="canvas">` entirely.** Item 12 cleanup does `el.remove()` after `kill()`-ing sigma. Because `pantheon-v2-pane` was added to `#canvas` itself, that `.remove()` detaches the whole main column. Every subsequent view-render will throw. **This is a guaranteed crash on the first nav-away from Pantheon v2.** (Has anyone actually tested view-switching? It would be obvious within five seconds.)

**B6. No empty-edge-type fallback styling.** Items with unknown types get `DEFAULT_EDGE_COLOR='#7a8090'` — that's the same color as the default node color. Edges become near-invisible on default-colored nodes.

**B7. `graphToViewport` called per-render in `sync()` for every label (`pantheon-v2.js:149–158`).** Fine at family-label count (~20), but `afterRender` fires on every camera move. Acceptable, but consider throttling if more labels are added.

**B8. Force-simulation absence.** Production restarts the simulation on hover/ego/drag. v2 has no simulation, so dragging is impossible and no collision-resolution post-render. Minor.

**B9. The `colored bezier` parity claim is checked off in the file header but it's actually straight lines + 30% color coverage.** Whoever wrote the [✓] for item 5 hadn't verified against `data.js` edge-type frequency.

---

## 4. Cleanup concern (item 12) — specific

The cleanup query at `app.js:585–588`:

```js
document.querySelectorAll('.pantheon-v2-pane').forEach(el => {
  if (el._sigma) { try { el._sigma.kill(); } catch (e) { /* ignore */ } el._sigma = null; }
  el.remove();
});
```

Sigma teardown: correct.
DOM teardown: **wrong target**. Because `pantheon-v2.js:169` adds the class to `rootEl` (which is `#canvas` itself), `el.remove()` ejects the `<main>`. The fix is one of:

1. v2 should mount into a child `div` it creates inside `rootEl`, set the class on that div, stash it on `rootEl._ph2Pane`, and reset by removing only the child.
2. Cleanup should skip removal and instead empty the pane: `el.innerHTML = ''; el.classList.remove('pantheon-v2-pane');` — but this also nukes `view-header`.
3. Best: v2 should be given a dedicated DOM mount point in `index.html` (sibling of `#codex-graph-pane`), `display:none` by default, shown only on `pantheon-v2`. Then cleanup just hides + tears down sigma; no `.remove()` needed.

The production SVG Pantheon path uses `svg.selectAll('*').remove()` (`app.js:557`) which clears children of `#svg` but leaves `#svg` itself intact — that's the contract v2 must match, and currently does not.

---

## 5. Recommendations (priority order, blockers first)

1. **BLOCK: fix the `#canvas` mount.** Either add a dedicated `#pantheon-v2-pane` element to `index.html` (sibling of `#codex-graph-pane`, same positioning rules), or have `pantheon-v2.js` create + own a child div. The current implementation crashes the entire app on first view-change away from pantheon-v2. Verify by clicking Pantheon v2, then any other nav item.
2. **BLOCK: fix the edge palette.** Add `syncretic`, `syncretic-scholarly-parallel`, `syncretic-ancient-identification`, `syncretic-structural-parallel`, `consort` (not `consort-of`), and `parallel-motif` to `EDGE_COLOR`. Better: import `EDGE_STYLE` from `app.js` and use the same map (same colors, same widths). Remove the fabricated keys (`parallels`, `cognate-of`, `cited-in`, `theme`, `descends-from`) — they're noise.
3. **BLOCK: register an edge-curve program** (`@sigma/edge-curve` `EdgeCurveProgram`) and set it as `defaultEdgeType`. Without it the "bezier" parity item is just untrue. If we ship straight edges the wedge interior turns into a chord-spaghetti hairball at 1259 edges.
4. **Reconsider item 6** — tangential rim labels are a different design from production. Either get John's blessing on the new look or port the horizontal-with-tick rendering (`app.js:1162–1199`).
5. **Phase C items (7–11) need to be built before promotion.** Pantheon without the mode dropdown is a different view, not a re-skin. Same for the legend and the family-filter — they're how users navigate the 488 deities. Order of difficulty: legend (cheap) → family-filter (cheap, mostly DOM + a reducer change) → labels-mode toggle (cheap) → ego-focus (needs hide/show pass on sigma graph) → mode dropdown (the heaviest — drags in authors / symbols / events / monuments derivation logic at `app.js:810–957`).
6. **Match the production row-radius placement** (`app.js:1016–1021`) and re-introduce the hash-jitter — costs five lines, restores the production "feel".
7. **Add a force-simulation step** (or at least a one-shot post-layout collision pass) so high-degree hubs don't overlap siblings.
8. After 1–3 land, do an A/B screenshot at the same window size for John to compare. The visual gap is bigger than the [✓] marks suggest.

**Verdict: do NOT flip default.** Phase A+B math is solid, but the live-data palette coverage is broken (69% of deity-deity edges grey), the rim labels diverge from production, and there is a guaranteed crash bug on view-change. Phase C entirely unbuilt.
