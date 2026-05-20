# Forge robustness audit · 01 · SCALE + ADAPTIVE-CONSTRAINT READINESS

**Filed:** 2026-05-20
**Filed by:** goblin-forge-scale-1 (read-only audit, no code edits)
**Scope:** PERFORMANCE + CORRECTNESS only — visual polish + interaction model are out of scope.
**Target design point:** 10k nodes "feels like deities does today" (663 N / 3,033 E).
**Adaptive design point:** must not BREAK at 50k; LOD / culling / caps are the relief valves.
**Reads-after:** `AUDIT/forge-animation-pipeline-2026-05-20.md`, `AUDIT/forge-glyph-migration-handoff-2026-05-20.md`, `feedback_pack_scale_invariant.md` (memory).

---

## 1. TL;DR — top 3 scale findings

1. **🔴 Hit-test is unindexed O(N) per pointermove and the result is the input to a 120Hz rAF coalesce.** At 10k nodes it's ~120k distance checks/sec for free-roaming pointer; at 50k it's ~600k/sec. The hover-coalesce in `setHoverId` does not help — `hitTestAt` runs synchronously in `pointermove` BEFORE the coalesce, and feeds the new id in. Insertion point for a grid index already exists (`local.mode.hitNodes`). `src/js/views/forge.js:1356-1379`, `1937-1962`.
2. **🔴 `refreshGlyphAlphas` writes the full glyph instance buffer to the GPU every drawFrame, unconditionally, even when the fade is settled.** The handoff doc lists this as known but unfixed. At 10k nodes this is a 320 KB GPU write per frame (~19 MB/s at 60Hz); at 50k it's a 1.6 MB write per frame (~96 MB/s). The settled-fade short-circuit is one element-wise compare loop. `src/js/views/forge.js:1116, 1202-1216`.
3. **🟡 `rebuildForMode` pre-creates one label `<div>` per node in the mode, regardless of how many will ever be visible.** At 10k it is 10,000 DOM nodes paid up-front to fix a 47-node first-hover stall. At 50k it is 50k DOM nodes — Safari/Chrome will struggle on view-mount alone. The cap `label_cap=120` and `label_idle_max=750` already exist; pre-creation should be bounded by `min(N, label_idle_max + label_cap)`. `src/js/views/forge.js:948-966`.

---

## 2. Per-subsystem analysis

### 2.1 Hit-test path

**Flow:** `canvas.pointermove` (`forge.js:1937`) → `hitTestAt(cssX, cssY)` (`forge.js:1356-1379`) → `setHoverId(hit)` (`forge.js:1625-1652`) → `requestAnimationFrame` coalesce → `recomputeFocus()`.

**Cost model:**

| N | hitTestAt per move (distance checks) | At 120Hz pointermove | Notes |
|---|---|---|---|
| 663 (deities now) | 663 | ~80k checks/s | Cheap — no problem. |
| 2,000 | 2,000 | ~240k checks/s | Borderline; still <1ms total. |
| 10,000 | 10,000 | ~1.2M checks/s | Each check is a few ops; ~3-5ms on the move event itself. Pointermove starts to miss frames. |
| 50,000 | 50,000 | ~6M checks/s | Will exceed pointer-event budget on most CPUs. JS thread starves rAF. |

**Why setHoverId's rAF coalesce does NOT save us:** the coalesce gates `recomputeFocus`, not `hitTestAt`. The hit-test runs on every pointermove (potentially 120Hz). On a fast pointer cross the JS thread does N distance ops × every pointer event.

**Spatial index possible?** Yes — `local.mode.hitNodes` already carries `{id, x, y, r}` in world space. The world extent is bounded by `local.mode.worldExtent`. A uniform grid (cell size ≈ max tier radius × 2) is the right primitive — ~O(1) buckets to test per query, build cost O(N) once per `rebuildForMode` / `rebakeNodes`. Quadtree is overkill; grid suffices given the radial layout's density distribution.

---

### 2.2 Pack stages

| Stage | File:line | Walltime estimate (back-of-envelope, modern laptop) | Per-frame or one-shot |
|---|---|---|---|
| `radialWedgeLayout` (in `layout/radial.js`, called from `rebuildForMode`) | `forge.js:813` | O(N log N) sort + O(N) place. ~1ms at 663, ~10ms at 10k, ~80ms at 50k. | One-shot per mode switch. |
| `packNodes` | `forge.js:848`, `node.js:93-148` | O(N): one tier-classifier sort + one pass. Allocates `Float32Array(N*8)`. ~0.3ms at 663, ~3-5ms at 10k, ~20-30ms at 50k. | One-shot per mode switch + per rebake. |
| `packEdges` | `forge.js:854`, `edge.js:140-238` | O(E): allocates `Float32Array(E*12)`. ~1ms at 3033, ~5ms at 15k edges, ~25ms at 75k edges. | One-shot per mode switch + on every edge param change. |
| `buildAdjacency` | `adjacency.js:19-29` | O(E). Allocates a Map<id, Set<id>>. ~1-2ms at 3k edges; ~10ms at 30k edges; ~50ms at 150k edges. | One-shot per mode. |
| `buildTierClassifier` | `node.js:60-74` | O(N log N) sort. <1ms even at 50k. | One-shot per mode + per rebake. |
| `rebuildGlyphInstanceBuffer` | `forge.js:1150-1190` | O(N): one alloc, one pass. ~0.2ms at 663, ~3ms at 10k, ~15ms at 50k. Calls `mth.lightenColor` per node — uncached but cheap. | One-shot per mode + per glyph-param change. |
| `rebakeNodes` | `forge.js:2145-2211` | Same cost as packNodes + buildAdjacency + a hitNode loop. Triggered by 5% camera-scale drift. | **Per camera zoom step (after threshold).** At deep-zoom oscillation this fires repeatedly. |
| `rebakeEdges` | `forge.js:2213-2232` | Same cost as packEdges. | Per param change + chain from rebakeNodes (radii change → edge offset depends on radii). |

**The compound hazard at 10k+:** `rebakeNodes` calls `rebakeEdges` at line 2210. Together at 10k N / 30k E that's ~10-20ms walltime. The 5%-drift zoom guard fires this on the rAF camera onChange path. **Wheel-zooming through a few drift thresholds back-to-back will fire 2-3 rebakes inside ~50ms** — a visible stutter.

**Pack-scale invariant** (memory file `feedback_pack_scale_invariant.md`): the rebuildForMode order (fit-before-pack) is correct, and resize calls `rebakeNodes` — both invariants currently satisfied (`forge.js:830-848`, `forge.js:1061`). No regression detected, but the invariant remains a tripwire for any future packer change.

---

### 2.3 Per-frame work (`animTick` → drawFrame)

`animTick` (`forge.js:1393-1423`) runs:

| Step | Cost | Allocations | Notes |
|---|---|---|---|
| `camera.tick(dt)` (`camera.js:299-366`) | O(1) | None | Pure math. |
| `tickEdgeFades(dt)` (`forge.js:1536-1556`) | O(E) | None | Loop over `local.edgeStates` (E floats). At 30k edges = 30k ops/frame = trivial. At 150k edges = 150k ops × 60fps = 9M ops/s — measurable. |
| `tickNodeFades(dt)` (`forge.js:1560-1580`) | O(2N) | None | Same shape, on `nodeStates` (2N floats). |
| `drawFrame()` → `refreshGlyphAlphas()` (`forge.js:1202-1216`) | O(N) | None | But **GPU buffer write of glyphInstanceData is unconditional** (see finding #2). |
| `drawFrame()` → `local.renderer.drawFrame({...})` | See 2.3a | **One `new Float32Array(48)` for viewData each frame** (`webgpu.js:1045`) | 192-byte per-frame alloc — fine at 60Hz, a minor GC contributor. |
| `syncLabelPositions()` (`forge.js:1327-1351`) | O(visible labels) | None | Iterates `local.labelEls`, skips non-visible via `hasAttribute`. But the iteration cost is O(total labels) because the skip check still walks the Map. |

**2.3a — Inside renderer.drawFrame (`webgpu.js:1013-1154`):**

GPU writes per frame:

| Buffer | Bytes at 10k N / 30k E | Bytes at 50k N / 150k E | Conditional? |
|---|---|---|---|
| viewUbo | 192 | 192 | every frame |
| nodeInstanceVbo | 320,000 | 1,600,000 | every frame (even if static) — see 🔴 finding #4 |
| edgeInstanceVbo | 1,440,000 | 7,200,000 | every frame (even if static) — see 🔴 finding #4 |
| nodeStateVbo | 80,000 | 400,000 | every frame |
| edgeStateVbo | 120,000 | 600,000 | every frame |
| glyphInstanceVbo | 320,000 | 1,600,000 | every frame (when glyphs present) |

**At 10k N / 30k E** that's ~2.3 MB per frame, ~140 MB/s of GPU traffic at 60fps. **At 50k / 150k** that's ~11.4 MB/frame, ~684 MB/s — past the practical streaming bandwidth on integrated GPUs. The static instance buffers (`nodeInstanceVbo`, `edgeInstanceVbo`, `glyphInstanceVbo`) are uploaded every drawFrame even though they only change on rebake. This is the highest-impact unfixed waste.

---

### 2.4 Label system

`syncLabels` (`forge.js:1262-1314`):

- Computes `visible` set from focus + idle-tier hierarchy.
- Iterates `local.labelEls` (full mode size) attribute-diffing — O(N) DOM attribute lookups per call.
- `computeIdleLabelVisibility` (`label.js:47-129`) is O(N) per tier walk + O(K²) collision (K = `cap`). At `cap=120` that's 14k AABB checks per syncLabels.

**DOM pre-creation cost** (`forge.js:948-966`): one `DocumentFragment` append of N `<div>`s.

| N | DOM nodes created at mount | Approximate cost on Chrome/Safari |
|---|---|---|
| 663 (deities) | 676 (idIndex includes some extra) | ~10ms one-shot, never seen again |
| 2,000 | 2,000 | ~30ms |
| 10,000 | 10,000 | ~150-300ms — visible "blank tab" on mode switch |
| 50,000 | 50,000 | Safari likely 1-2s; could trigger a layout freeze |

**Memory:** each `.forge-label` div is ~200-400 bytes resident (DOM internals + CSS). 50k = ~15-20 MB just in DOM. Not catastrophic, but a needless tax.

**Cap analysis:**
- `label_idle_max = 750` (idle-tier cap) — fine for any N (it's a screen-density cap, not an N-cap).
- `label_cap = 120` (focused-set cap) — at 10k a hub may have 100-200 1-hop neighbors; 120 is OK. At 50k it might clip.
- **Visible-at-fit target for 10k:** roughly 200-400 labels reads clearly at typical wheel-zoom; the per-tier soft budgets (`label.js:90`: 40%/30%/20% + tier-3 unlimited) handle this gracefully.

**Cost of pre-creating ALL labels:** the audit (`forge-animation-pipeline-2026-05-20.md` § #5 Attempt D) solved a 47-div appendChild stall by paying it up-front at mode-switch. At 10k this trade goes negative: we pay 10k DOM nodes to avoid the first-hover stall, but mode-switch itself becomes the stall. **Pre-create only the labels that the idle-tier might show, plus a focused-set headroom buffer.**

---

### 2.5 Edge system

**Edge counts at scale** (rough — extrapolating from 663 deities → 3033 edges, ~4.5 edges/node):

| Mode N | Estimated E | Edge instance VBO size | Tick cost (O(E)) per frame |
|---|---|---|---|
| 663 (deities) | 3,033 | 145 KB | ~0.03ms |
| 2,000 | ~9,000 | 432 KB | ~0.1ms |
| 10,000 | ~45,000 | 2.16 MB | ~0.5ms |
| 50,000 | ~225,000 | 10.8 MB | ~2.5ms |

**Bezier pack cost** (`edge.js:170-235`): O(E) one-shot. Cheap.

**Idle edge rendering at 10k+:** the edge fragment shader runs per pixel of every ribbon. At 10k zoomed-to-fit, 45k edges cross most of the viewport — pixel fill becomes dominant. The `wire_min_screen_px = 1` clamp keeps them ≥1px wide. With `dim_amount = 0.80`, idle alpha at zoom-fit is ~0.10 × 0.20 = 0.02 — most fragments will hit the `if (a < 0.02) { discard; }` (`webgpu.js:342`) bail. **This is the saving grace at zoom-fit** — but with zoom-in the discard saves less and overdraw climbs.

---

### 2.6 Glyph system

**Atlas size:** 64px cells × 17 glyphs in a 5×4 grid = 320×256 atlas → ~328 KB texture (rgba8unorm). One-time. (`glyph.js:90-134`, `webgpu.js:951-973`).

**Retina sharpness:** at DPR=2 + zoom-in where a node disk fills 100px on screen, glyph at 0.85× = ~85px sampled from 64px atlas = ~1.3px per atlas texel = noticeably soft. Bump to 128px atlas → 4× memory (~1.3 MB) for crisp Retina. Handoff doc flags this as deferred-not-urgent — agree, but flag for the 10k visual-polish pass.

**Per-instance buffer cost at 10k:** 320 KB (8 floats × 4 bytes × 10k). Re-built only on mode switch / glyph param change. Not a hot path.

**Per-frame alpha refresh:** finding #2 above — currently unconditional. **At 10k**, gating on settled-fade saves 320 KB/frame (~19 MB/s of avoided GPU traffic). **At 50k**, saves 1.6 MB/frame (~96 MB/s).

---

### 2.7 Mode switch (`rebuildForMode`)

| Phase | Cost @ 10k | Cost @ 50k |
|---|---|---|
| `filterNodesByMode` (mode.js:77) | O(allNodes) ≈ ~4k vault total, trivial | trivial |
| `filterEdgesByNodes` (layout) | O(allEdges) ~10k total | trivial |
| `radialWedgeLayout` | ~10ms | ~80ms |
| `packNodes` + `buildRadiiMap` + `packEdges` | ~10ms | ~50ms |
| `buildAdjacency` | ~10ms | ~50ms |
| hitNodes index build (lines 858-872) | ~3ms | ~15ms |
| Label DOM pre-creation (lines 948-966) | ~150-300ms (DOM-bound) | ~1-2s (DOM-bound) |
| `rebuildGlyphInstanceBuffer` | ~3ms | ~15ms |
| `drawFrame` | ~5ms | ~20ms |

**At 10k a mode switch is ~200-350ms — borderline acceptable but visibly laggy.** At 50k it's 1.5-2.5s which is unacceptable. **The DOM pre-creation dominates.** Trim that to the idle-tier estimate and mode-switch returns to ~30ms territory.

Note **modes WILL grow at 10k**: `04_persons/` already has 1,193 nodes on disk; once `filterNodesByMode('authors')` admits all of them (currently gated to `authored` edge presence which keeps the set smaller), the authors mode alone is N≈1.2k today. `documents` 502, `themes` 493, `deities` 676, `traditions` 306 are the current populated lenses. None at 10k yet — **but 10k is the design target, not a future estimate**. Plan for it.

---

### 2.8 Camera

- `fitToExtent` (`camera.js:182-201`) — O(1). Fine.
- `tick(dt)` (`camera.js:299-366`) — O(1). Fine.
- `camera.onChange` fires on every state mutation; the listener (`forge.js:718-746`) gates `rebakeNodes` behind a 5% drift threshold. **Correct invariant** per memory `feedback_pack_scale_invariant.md`. No regression detected.
- Pan-bounds clamping (`camera.js:72-78`) — O(1). Fine.

**One concern at 10k:** every `camera.onChange` calls `syncGlyphFocus()` (no-op since glyph migration), `scheduleIdleLabelSync()` (rAF debounced — fine), `updateZoomGizmo()` (one DOM text write — fine). The 5%-drift `rebakeNodes` path is the only heavy work, and it's already gated.

**Pack-scale invariant verified:** `rebuildForMode` fits BEFORE pack (line 832 before line 848). `resizeAndFit` calls `rebakeNodes()` on size change (line 1061). Both required by the invariant. **Do not break.**

---

### 2.9 Adaptive constraint hooks — proposed attach points

Identified for future implementation — not designing the full system, just where each hook attaches.

| Hook | File:line attach point | Why |
|---|---|---|
| **Hit-test spatial index** | `forge.js:858-872` (build), `forge.js:1356-1379` (query), `forge.js:2156-2170` (rebuild on rebake) | Build a uniform grid keyed off `worldExtent` + max tier radius during the hitNodes loop in `rebuildForMode` + `rebakeNodes`. Replace the `for i in hitNodes` loop in `hitTestAt` with bucket lookup. |
| **Settled-fade glyph alpha gate** | `forge.js:1202-1216` | Add an `if (nodeStates === nodeTargets element-wise) return false; else { update + return true }` short-circuit. Caller (`drawFrame` at line 1116) checks return and skips the buffer write when nothing changed. Will require renderer to also accept a `glyphAlphasChanged` flag. |
| **Static-buffer dirty flag (node/edge/glyph instance VBOs)** | `webgpu.js:1067-1077` and `:1138-1140` | Add a `frame.staticBuffersDirty` flag; the renderer skips `writeBuffer` for the static instance VBOs when the flag is false. View layer sets dirty=true on rebake/mode-switch, false otherwise. Massive GPU-bandwidth saving. |
| **Label DOM pre-creation cap by N** | `forge.js:948-966` | Limit the pre-create loop to `Math.min(N, label_idle_max + label_cap × 2)` to bound mode-switch cost. Lazy-create the rest in `ensureLabelEl`. |
| **Label visibility iteration optimization** | `forge.js:1298-1306` | At 10k+, iterating `local.labelEls` on every syncLabels (whether for diff or position) is expensive. Maintain `local.visibleLabelEls` Set so position/diff loops walk only visible elements. |
| **Glyph cull by viewport + min-size** | already implemented in old DOM path; needs **re-implementation in GPU path** by setting alpha=0 on culled instances in `rebuildGlyphInstanceBuffer` + `refreshGlyphAlphas` (`forge.js:1150-1216`) | The previous DOM cull was deleted with the migration. GPU glyphs need an equivalent: skip rendering instances whose screen-projected radius < 4px OR whose screen position is outside the viewport. Cheapest = mark alpha=0; depth+blend will discard via the existing `if (a < 0.02) discard;` (`webgpu.js:464`). |
| **Edge cull at extreme zoom-out** | `forge.js:854` (pack) or render-time filter | At 50k / 225k edges, even discarded fragments cost vertex shader work. Add a per-edge length-in-px filter at pack: if `dist_screen < 1px` (both endpoints project to same pixel), skip the instance. Saves 30-50% of edges at zoom-fit. |
| **LOD tier — collapse tier-3 disks at zoom-out** | `forge.js:1083-1117` (drawFrame param threading) | At low scale, multiply per-instance alpha to fade tier-3 to zero so the GPU pipeline can keep rendering them (no count change) but fragment cost drops via discard. Cleaner: pre-filter `nodeInstances` into LOD groups at pack time and only upload the active LOD count. |
| **Mode-switch label-budget cap** | `forge.js:948-966` (see above) and `forge.js:1267-1276` (focus cap reads `label_cap`) | Tie `label_cap` and `label_idle_max` to N — at 50k, scale them down proportional to viewport area / disk size. |
| **Pointermove throttle** | `forge.js:1937-1962` | At 120Hz pointer events, throttle `hitTestAt` to ≤60Hz by gating on the same rAF the hover-coalesce uses. Reduces hit-test work 2× regardless of spatial index. |
| **Adjacency build deferral** | `forge.js:855` (`buildAdjacency` call) | At 50k+, defer adjacency to first-hover via a lazy build. Or build incrementally if user hovers before the first deferred build completes. Recovers ~50ms from mode-switch hot path. |

---

## 3. Findings list — severity-ranked

### 🔴 CRITICAL — breaks or visibly degrades at 10k

**🔴 F1 — Hit-test is O(N) on every pointermove, with no spatial index.**
- **Where:** `forge.js:1356-1379` (`hitTestAt`), called from `forge.js:1960` (pointermove handler).
- **At 10k:** ~3-5ms per pointermove → frame-budget pressure during cursor sweeps. Hover-coalesce does NOT mitigate (it gates `recomputeFocus`, not `hitTestAt`).
- **At 50k:** unworkable without an index.
- **Proposed approach:** uniform grid over `worldExtent` with cell size = 2 × max tier radius. Build during the hitNodes loop in `rebuildForMode` (line 858) + `rebakeNodes` (line 2156). Lookup queries 1-4 cells in `hitTestAt`. Build cost O(N) added to pack stages.

**🔴 F2 — `refreshGlyphAlphas` writes the full glyph VBO every frame, even when fade is settled.**
- **Where:** `forge.js:1116` (in drawFrame), `forge.js:1202-1216` (the function), `webgpu.js:1136-1150` (the unconditional GPU write).
- **At 10k:** 320 KB GPU write per frame × 60fps = ~19 MB/s of wasted bandwidth at IDLE.
- **At 50k:** 1.6 MB × 60 = ~96 MB/s.
- **Already flagged in handoff doc as known/unfixed**, with the proposed approach.
- **Proposed approach:** element-wise compare nodeStates vs nodeTargets at top of `refreshGlyphAlphas`; return early if equal. Plumb a dirty flag through `frame.glyphInstances` (null if not dirty) so renderer skips the buffer write.

**🔴 F3 — Static instance VBOs (node/edge/glyph) re-uploaded every frame.**
- **Where:** `webgpu.js:1067-1077` (node + edge), `webgpu.js:1138-1140` (glyph).
- **At 10k N / 30k E:** ~1.76 MB GPU upload per frame just for static geometry × 60fps = ~106 MB/s.
- **At 50k:** ~8.8 MB/frame ≈ 530 MB/s — past integrated-GPU streaming budget.
- **Proposed approach:** add a `frame.staticDirty` flag (or per-buffer dirty flags). View layer sets dirty on rebake/mode-switch. Renderer skips `device.queue.writeBuffer` for static VBOs when not dirty. Estimated saving at 10k: 90%+ of GPU bandwidth — frame time drop measurable in the dev panel.

**🔴 F4 — Label DOM pre-creation at `rebuildForMode` scales with N, not with visible labels.**
- **Where:** `forge.js:948-966`.
- **At 10k:** 10k `<div>`s appended on mode-switch — 150-300ms DOM stall.
- **At 50k:** ~1-2s DOM freeze.
- **Proposed approach:** cap pre-creation at `min(N, label_idle_max + label_cap × 2)` (≈ 1k today). Lazy-create the rest via the existing `ensureLabelEl` (line 1228). Restores mode-switch to ~30ms; first hover of a never-shown label adds a single `appendChild`, fast enough to be invisible.

---

### 🟡 IMPORTANT — degrades at 10k or edge case

**🟡 F5 — Glyph viewport / min-size cull is NOT in the GPU pipeline.**
- **Where:** the DOM-era `syncGlyphPositions` cull was deleted with the migration. `forge.js:1136` is the no-op stub; `rebuildGlyphInstanceBuffer` (line 1150) writes ALL N instances unconditionally.
- **At 10k zoom-fit:** all 10k glyphs paint every frame even though most are <1px. Fragment shader pays a per-pixel cost on each.
- **Proposed approach:** in `refreshGlyphAlphas` (already O(N) per frame), check screen-projected radius via `camera.scale * radius` and viewport bounds; set alpha=0 for culled. Existing fragment discard at `webgpu.js:464` handles the rest. Zero pipeline change — pure alpha gating.

**🟡 F6 — `syncLabels` and `syncLabelPositions` iterate the full label map at 10k.**
- **Where:** `forge.js:1298-1306` (diff loop), `forge.js:1335-1349` (position loop).
- **At 10k:** each is 10k Map iterations + 10k DOM attribute reads per camera change. Position loop iterates skips early but still walks the Map.
- **Proposed approach:** maintain `local.visibleLabelEls` Set updated only when visibility changes; position loop iterates it directly. Diff loop can use a small "previously visible" Set + symmetric-difference instead of a full walk.

**🟡 F7 — `rebakeNodes` chains `rebakeEdges` on 5% camera-scale drift; at 10k this is ~10-20ms inside `camera.onChange`.**
- **Where:** `forge.js:2210-2211` (chain), `forge.js:726-737` (drift gate).
- **At 10k:** zooming through a few drift thresholds in rapid succession back-to-back fires the chain repeatedly. Visible stutter.
- **Proposed approach:** debounce rebake via rAF (one rebake per frame max); coalesce successive drift crossings. Or: increase the drift threshold from 5% to N-dependent (15% at 10k, 30% at 50k) — sacrifices a tiny bit of clamp accuracy for huge savings.

**🟡 F8 — `findBestMatch` (search) is O(N × haystack-count) — fine at 663, slow at 50k.**
- **Where:** `forge.js:1659-1688`.
- **At 50k:** with average aka.length = 1, ~100k string comparisons per Enter. Each comparison is fast, total ~50-100ms — perceptible search latency.
- **Proposed approach:** build a lowercase title+id+aka index at `rebuildForMode` time. Or use a Trie for prefix matching. Not blocking for 10k.

**🟡 F9 — `new Float32Array(48)` allocated per drawFrame for viewData.**
- **Where:** `webgpu.js:1045`.
- **At 60fps:** 192 bytes × 60 = ~11 KB/s of GC pressure. Trivial individually; cumulative with other per-frame allocs.
- **Proposed approach:** hoist the typed array to a closure-level constant in `create()`; reuse across frames. Same pattern for `glyphRgb` parsing at `forge.js:1095-1100`.

**🟡 F10 — Adjacency built as `Map<id, Set<id>>` — high overhead per entry.**
- **Where:** `adjacency.js:19-29`.
- **At 50k N / 225k E:** ~100k Map entries + ~450k Set entries → ~30-50 MB heap, ~50-100ms build.
- **Proposed approach:** flat CSR-style adjacency (`offsets: Int32Array(N+1)`, `neighbors: Int32Array(2E)`) keyed by node-index, not id. ~3-5× smaller, ~3× faster build. Requires id→index resolution upstream in `focusedSetFor`.

---

### 🟢 POLISH — only matters at 50k or for visual quality

**🟢 P1 — Glyph atlas at 64px is soft on Retina past ~50px disks.** Bump to 128px atlas (×4 memory, ~1.3 MB). `glyph.js:90`. Defer until visual-polish pass.

**🟢 P2 — `mth.lightenColor` (called per node in `rebuildGlyphInstanceBuffer` at `forge.js:1182`) is uncached.** Same family-color repeats ~30× per family. Cache hit-rate ≈ 95%. `forge.js:1181-1182`.

**🟢 P3 — `_colorCache` in `node.js:32` is module-level, never evicted.** Fine in practice (bounded by ~100 distinct family colors), but document the assumption.

**🟢 P4 — Edge bezier uses fixed 32 segments per edge.** `webgpu.js:599`. At very thin/short edges this is overkill; at 50k edges that's 50k × 33 vertices = 1.65M vertex-shader invocations per frame. Adaptive segment count by edge length would save here. Low priority.

**🟢 P5 — `handleSearch` clears `lockedSet` then adds the hit — `recomputeFocus` then runs once.** OK at 663, OK at 50k. No issue.

**🟢 P6 — `forceWriteEdgeState` (`webgpu.js:821-827`) is a defensive hard-stop for a bug that was diagnosed as dev-panel drift.** Not a perf hazard, but at 50k edges it adds a 600 KB GPU write on every resize. Consider gating to debug-only.

---

## 4. Adaptive-constraint hooks needed — summary table

(Reproduced from §2.9 for quick reference; details there.)

| Hook | File:line | Why |
|---|---|---|
| Hit-test spatial index | `forge.js:858, 1356, 2156` | F1 — O(1) hover at any N |
| Settled-fade glyph alpha gate | `forge.js:1202` | F2 — kill idle GPU bandwidth |
| Static-VBO dirty flag (node/edge/glyph) | `webgpu.js:1067, 1073, 1138` | F3 — biggest perf win at 10k+ |
| Label DOM pre-create N-cap | `forge.js:948` | F4 — restore mode-switch time |
| Glyph cull (viewport + min-size) | `forge.js:1202` (alpha=0 gating) | F5 — fragment-cost reduction at zoom-fit |
| Visible-labels Set | `forge.js:1298, 1335` | F6 — kill O(N) loops in label sync |
| Rebake debounce (N-aware drift threshold) | `forge.js:726, 2210` | F7 — no stutter on zoom |
| Search index | `forge.js:1659` | F8 — instant search at 50k |
| Hoist drawFrame allocations | `webgpu.js:1045`, `forge.js:1095` | F9 — minor GC win |
| CSR adjacency | `adjacency.js:19` | F10 — heap reduction at 50k |
| Pointermove rAF-throttle | `forge.js:1937` | F1 mitigation when index can't deploy yet |
| LOD tier (alpha-fade tier-3 at zoom-out) | `forge.js:1083` | Coarse LOD at 10k-50k |
| Edge length-in-px cull | `forge.js:854` or render-time | Cut sub-pixel edges at zoom-fit |

---

## 5. Open questions for John / lead synthesizer

1. **Static-VBO dirty flag (F3)** is the single highest-impact change. Confirm the renderer API can grow a `frame.staticDirty` flag (or per-buffer flags) without breaking the the portable core-port contract documented in `engine/contract.js`. The contract there talks about scene ops, not buffer-dirty semantics — but the proprietary forge view doesn't currently use the contract's scene API anyway. Should the contract be extended, or should this stay as a private extension on the WebGPU renderer's `drawFrame`?

2. **What is the 50k mode actually?** The 10k design target is plausibly the deities + persons union or "all-nodes" mode. The 50k seems aspirational — is there a planned mode that hits 50k (e.g., a full-vault wheel), or is 50k purely a "don't break" stretch? Affects whether F10 (CSR adjacency) is must-have or polish.

3. **Visible labels at zoom-fit for 10k** — is the target ~200, ~500, or ~1000? Drives the `label_idle_max` tuning and the F6 visible-set sizing. Current `label_idle_max = 750` is the limit; soft-budget tiers cap it lower in practice.

4. **Modes that grow most at 10k** — `04_persons/` already has 1,193 files. If `authors` mode is expanded to include all attested-person nodes (not just those with an `authored` edge), it could be the first mode to ship at 1k+. Same with `themes` (493), `documents` (502), `deities` (676). **Pinning down which mode is the first to cross 1k tells us where to instrument first.**

5. **Pointer event rate** — is John's hardware emitting 120Hz pointermoves? If 60Hz, F1 is much less urgent (no extra over-firing relative to rAF). Worth a 1-line `console.log` instrumentation before committing to the spatial index.

6. **Adaptive label cap** — currently fixed at `label_cap=120` regardless of N. Should it scale down at 50k (when 120 hub labels would overflow even a fully zoomed-in viewport)? Or stay fixed and rely on collision pruning?

7. **Mode-switch latency budget** — what feels OK to John? 300ms is the current rough estimate at 10k. Sub-100ms requires the F4 fix (label pre-create cap) + may need async pack stages.

8. **Glyph atlas at 128px (P1)** — defer to visual-polish pass, or fold into the 10k readiness work? The atlas is one-shot at boot, so the cost is amortized; the question is just memory (~1 MB more).

---

— goblin-forge-scale-1, read-only audit, 2026-05-20.
