# Forge robustness audit — 04. Animation + interaction pipeline (ground-up)

**Filed:** 2026-05-20
**Filed by:** opus, READ-ONLY AUDIT goblin (no code edits, no commits except this doc)
**Reads-before:**
- `AUDIT/forge-animation-pipeline-2026-05-20.md` (the canonical history)
- `AUDIT/forge-glyph-migration-handoff-2026-05-20.md`
- `src/js/views/forge.js`
- `src/js/engine/renderer/webgpu.js`
- `src/js/engine/graph/adjacency.js`
- `src/styles/app.css` §forge-label

**Scope:** end-to-end animation + interaction pipeline after the 8+ commit fix-train (`c70f73b` → `bfc35d2`). John's last words: *"we're not there, the agent took ages could not build this properly — must audit this from the ground up."*

---

## TL;DR — top 3 animation findings

1. 🟡 **Per-frame full-instance VBO re-uploads.** `renderer.drawFrame` unconditionally rewrites `nodeInstanceVbo` + `edgeInstanceVbo` + `glyphInstanceVbo` every frame, regardless of whether any of those static buffers actually changed. At deities mode that's ~5 KB + ~145 KB + ~21 KB = ~170 KB GPU upload per frame = ~10 MB/sec of waste at 60 Hz pan/zoom/fade. This is real perf headroom — and it's the most plausible remaining mechanism for "IDLE-hover feels heavier than LOCKED-hover" because IDLE state has the higher worst-case during ongoing camera motion.
2. 🟡 **`refreshGlyphAlphas` short-circuit doc-promised but never implemented.** The handoff doc + inline comment in `forge.js:1191-1201` claim it short-circuits when nodeStates equals nodeTargets element-wise. Implementation in `forge.js:1202-1216` always loops 663 instances and always returns dirty data, so the renderer always re-uploads `glyphInstanceVbo`. Cost: not the loop itself (~5 µs), but it defeats any "skip GPU write if nothing changed" optimisation downstream.
3. 🟢 **Depth-direction fix (commit `bfc35d2`) is correct.** Verified — see §3 below. Less-equal + same z + draw order produces the right occlusion. No follow-up needed in the shader.

**Plus a clear verdict on the residual "not there yet" (§5 below):** it is a **UX-design call, not a perf bug**. The pipeline is sound; the perceived IDLE-vs-LOCKED asymmetry is the inherent magnitude of dimming 600 nodes vs 10. No more architectural fixes will close that gap. Action John can take is *cosmetic* (less aggressive IDLE dim) or *visual-design* (stagger the dim cascade by ring), not *engineering*.

---

## 1. Frame-by-frame trace — IDLE-hover vs LOCKED-hover (side-by-side)

| Step | IDLE → first hover on node X | LOCKED → hover-neighbour change |
|---|---|---|
| **t=0 ms** Pointer enters X | `pointermove` fires. `local.panActive=false`, so skip pan branch. `canvasRect` cache hit → no `getBoundingClientRect` reflow. | Same. |
| **t≈0.05 ms** Hit-test | `hitTestAt(cssX,cssY)`: `camera.screenToWorld` + O(N) loop over `hitNodes` (663 entries). Returns `X`. ~0.04 ms. | Same. |
| **t≈0.10 ms** `setHoverId(X)` synchronous side | `local.hoverId = X`; toggle `is-hover-node` class; write `forge-status-hover` textContent. ~0.02 ms. | Same. |
| **t≈0.10 ms** `setHoverId(X)` coalesce | `_hoverRafId === 0` → schedules `requestAnimationFrame(() => recomputeFocus())`. RETURNS. The recompute is deferred to the next rAF tick. | Same. |
| **t = next rAF** `recomputeFocus()` runs | • `focusedSetFor(X, lockedSet={}, adj)` → returns `{X}` ∪ 1-hop(X). Avg deities-mode 1-hop ≈ 8-15 → set size ~10-16.<br>• `computeNodeStates(idx, focusedSet)` → allocates **fresh Float32Array(663)**, loops 663 times. ~0.03 ms.<br>• `computeSelectedStates(idx, {X})` → allocates **fresh Float32Array(663)**, loops 663. ~0.03 ms.<br>• Scrubber filter loop (if scrubber narrowed): another 663 iterations.<br>• `interleavePairs` → allocates **fresh Float32Array(1326)**, loops 663.<br>• `local.nodeTargets.set(newNodeTargets)` — in-place. ✓ invariant respected.<br>• `local.nodeStates` length matches → NOT reallocated. ✓ fade preserved.<br>• `computeEdgeStates(edges, focusedSet)` → allocates **fresh Float32Array(E≈3033)**, loops E. ~0.10 ms.<br>• `edgeTargets.set` in-place. ✓<br>• `startAnimLoop()` → schedules animTick if not already running.<br>• `syncGlyphFocus()` no-op.<br>• `syncLabels()`: iterates `local.labelEls` (663 entries), attribute-diff against `visible` set (size ≤ label_cap=80). Pure attribute flips, no DOM append. ~0.15 ms. THEN `syncLabelPositions()` writes `left`/`top` on each newly-visible label (~10 visible × style writes). | • `focusedSet = {X, ...lockedSet, ...1-hop expansions}`. **Set size LARGER** than IDLE (locked anchors carry their own 1-hops persistently).<br>• `computeNodeStates` still allocates 663 entries, marks more of them as `0` (focused).<br>• `selectedSet = {X, ...lockedSet}` — also larger.<br>• `interleavePairs`, target writes — **same cost**.<br>• `computeEdgeStates` — **same cost**.<br>• `syncLabels`: locked-tier labels are ALREADY data-visible from the prior lock. Diff is small (a handful of 1-hops fading in / out).<br>• ABSOLUTE cost: same order of magnitude as IDLE recompute (the loops are over the same N/E whether the focused set is small or large). |
| **t = same rAF** `animTick` first iteration | • `camera.tick(dt)` → likely settled, returns false.<br>• `tickEdgeFades(dt)` → iterates 3033 edges, advances each by `dt/0.15`. The first frame has the **largest delta-per-edge** because most edges flipped 0↔1. Returns true.<br>• `tickNodeFades(dt)` → iterates 1326 floats. **Most floats flipping 0↔1** because IDLE → hover dims ~600 nodes. Returns true.<br>• `stillFading && !stillMoving` → `drawFrame()` (see next row).<br>• Schedule next animTick. | • `tickEdgeFades` advances ~tens of edges (the small overlap diff between old + new focused sets). Most edges are already at their target. Returns true (animation in flight for the changing few).<br>• `tickNodeFades` advances ~tens of node floats. Returns true.<br>• `drawFrame()`. |
| **t = same rAF** `drawFrame()` | • Build `viewData` Float32Array(48), write 192 B to `viewUbo`.<br>• Re-upload `nodeInstanceVbo` (full 663×32B = ~21 KB). **STATIC DATA, no change.**<br>• Re-upload `edgeInstanceVbo` (3033×48B = ~146 KB). **STATIC DATA, no change.**<br>• Re-upload `nodeStateVbo` (663×8B = ~5 KB). DYNAMIC, fade frames legitimately need this.<br>• Re-upload `edgeStateVbo` (3033×4B = ~12 KB). DYNAMIC.<br>• `refreshGlyphAlphas()` rewrites alpha column on 663 instances.<br>• Re-upload `glyphInstanceVbo` (663×32B = ~21 KB).<br>• Encode + submit: edge pass (3033 instances), node pass (663), glyph pass (663).<br>• `syncLabelPositions()` iterates 663 labelEls, skips ~603 without `data-visible`, writes `left/top` on ~60 visible.<br>• Total ~221 KB GPU upload + 3 draw calls. ~1-3 ms render time on M1. | Same. Even though only ~tens of edges and nodes need the new state, the WHOLE buffer is uploaded. |
| **Subsequent rAF ticks (~15 frames over 0.15 s)** | Repeat animTick → drawFrame → 221 KB upload × 15 ≈ **3.3 MB GPU upload over the fade window**. | Same — and that's the perceptual key: the per-frame upload cost is IDENTICAL between IDLE and LOCKED, because we always re-upload everything regardless. |

**Per-frame allocation count during a single hover-fade:**
- `recomputeFocus` once: 4 typed-array allocations (~12 KB transient).
- `animTick` per frame: 0 allocations (in-place fade advance).
- `drawFrame` per frame: 1 `Float32Array(48)` for `viewData` (192 B), plus implicit ArrayBuffers inside the renderer for the writeBuffer calls (depends on browser).

**Verdict on IDLE-vs-LOCKED latency difference (real or perceptual?):** **mostly perceptual**, with one real but small contributor:
- The `recomputeFocus` work itself is O(N+E) regardless of focused-set size → identical cost.
- The `animTick` per-frame fade advance is O(N+E) regardless → identical cost.
- The GPU upload is O(N+E) regardless (because we naively upload everything) → identical cost.
- **What differs:** the *amount of pixel change* between consecutive frames. IDLE→hover changes ~600 disks' alpha + ~all edges' color. LOCKED→neighbour-shift changes ~10 disks + ~10 edges. The eye reads the bigger change as "more is happening" → "feels heavier" even though per-frame compute is identical.
- **Real but tiny contributor:** scrubber filter loop is O(N) and runs only when scrubber is narrow. Negligible (<0.1 ms).

---

## 2. Verification of the depth-direction fix (`bfc35d2`)

**Setup:**
- Depth buffer: `format: depth24plus`, `depthClearValue: 1.0`, `depthLoadOp: 'clear'`. ✓
- Pipelines: all three (node, edge, glyph) declare `depthStencil: { depthWriteEnabled: true, depthCompare: 'less-equal' }`. ✓
- Clip-space z convention: WebGPU is `[0, 1]` with smaller z = closer. ✓

**Z values in shaders:**
- Node: `let z_focus = mix(0.6, 0.3, 1.0 - inst_state);` → state=0 (focused) → z=0.3; state=1 (dim) → z=0.6. Then `let z = mix(z_focus, 0.0, inst_selected);` → selected → 0.0. ✓
- Glyph: `let z_focus = mix(0.3, 0.6, state); let z = mix(z_focus, 0.0, selected);` → state=0 (focused) → 0.3; state=1 (dim) → 0.6; selected → 0.0. **Same as disk.** ✓
- Edge: `let z = mix(0.85, 0.75, inst_state);` → idle=0.85 (back), hot=0.75 (front). Both behind nodes. ✓

**Less-equal depth test analysis:**
- Selected disk at z=0.0 paints first (within disk pipeline pass). depth buffer at those pixels = 0.0.
- Selected glyph at z=0.0 paints in glyph pass AFTER nodes. Test: `0.0 <= 0.0` = TRUE → glyph passes. Draws on top of disk via blend. ✓
- Focused 1-hop disk at z=0.3 (different node, no overlap with selected) → buffer = 0.3 there.
- Dim glyph at z=0.6 trying to paint over focused disk: `0.6 <= 0.3` = FALSE → glyph rejected. ✓ (correct: a dim glyph from a behind-node hides behind a focused disk halo).
- Selected disk halo (alpha 0.15–1.0) writes depth at z=0.0. Behind disks (z=0.3 or 0.6) are masked from painting in that halo region — except the `final_a < 0.15` discard in the node shader prevents the AA + outer glow tail from writing depth, so disks behind THAT outer band still paint cleanly. ✓ (This is the artifact-bump iterated to 0.15 in commit `e52b3ea`/`536f9cb`.)

**Selected disk grow + glyph grow:**
- Disk: `size_mult = mix(1.0, v.selected_size_mult, inst_selected)` then `quad_scale = mix(1.0, v.selected_glow.w * 1.5, inst_selected)`. World vertex = `inst_pos + qv * inst_radius * size_mult * quad_scale`. ✓
- Glyph: `let size_mult = mix(1.0, v.selected_size_mult, selected); let r = r_base * size_mult; let world = center + qv * r;` — `r_base` is the already-glyph-scaled radius from JS (`np.data[i*NF+2] * glyphScale`). So selected glyph world radius = `inst_radius_disk * 0.85 * selected_size_mult`. Disk world radius (sans glow padding) = `inst_radius_disk * selected_size_mult`. **Glyph is 85% of disk size — correct, matches old DOM glyph sizing.** ✓

**Verdict:** the depth-direction fix is correct. Glyph z equal to parent disk z + glyph drawn after disks + less-equal compare = glyph wins via draw order on own disk, depth-test correctly hides dim-glyph behind focused-disk. No issues. The "lots of nodes hover without symbol, just bigger circle" symptom is genuinely resolved by this commit.

**One footnote:** the GLYPH_SHADER comment block (lines 357–363 of webgpu.js) still describes the OLD strategy (`z slightly in front of parent disk`). Stale doc. Cosmetic — doesn't affect correctness.

---

## 3. Buffer-pattern review (state vs target)

Walked every code path that touches `local.nodeStates / nodeTargets / edgeStates / edgeTargets`:

| Site | Mutation | Pattern | OK? |
|---|---|---|---|
| `rebuildForMode` (line 892-895) | `local.nodeStates = new Float32Array(...)` — **wholesale replace** | Mode-switch only. hover/lock cleared first. Targets reset, fade pipeline restarts from settled zero. | ✓ Acceptable — mode switch is a hard cut by design. |
| `recomputeFocus` (line 1484-1490) | targets via `.set()`; states re-allocated only on length mismatch (first run / mode change) | Honours invariant #1. | ✓ |
| `recomputeFocus` (line 1499-1506) | same for edges | | ✓ |
| `rebakeNodes` (line 2191-2197) | targets via `.set()`; states re-allocated only on length mismatch | Honours invariant #1. (Fixed in commit `27de121` per audit recommendation.) | ✓ |
| `rebakeEdges` (line 2222-2228) | same for edges | | ✓ |
| `tickNodeFades` / `tickEdgeFades` | in-place increment toward targets | | ✓ |
| `renderer.drawFrame` writeBuffer (`webgpu.js` 1086, 1093) | uploads `frame.nodeStates / edgeStates` byte-for-byte | Renderer doesn't mutate JS arrays. | ✓ |

**No remaining wholesale-replace bugs.** The fade-aware buffer pattern is fully consistent across every code path.

---

## 4. Hover coalesce — confirmed 1-per-rAF, but two synchronous bypass paths exist

`setHoverId(newId)` (forge.js:1625-1652) correctly coalesces via `_hoverRafId`. One rAF callback per pointer-burst, no matter how many pointermove events fire. ✓

**Synchronous `recomputeFocus()` callers that bypass the coalesce:**
- `toggleLock` (line 1927) — click handler. Fires once per click; click rate is low → fine.
- `wireTimelineScrubber` (line 1845) — scrubber drag. Can fire at pointermove rate (potentially 120 Hz) **without coalescing**. Verified: `if (rangeChanged) recomputeFocus()` inside scrubber's pointermove handler. Heavy hand. Scrubber drag while hovering = 120 Hz recomputeFocus.
- `rebuildForMode` (called from mode dropdown — line 768) — one-shot, fine.
- `setView('forge')` initial mount — one-shot, fine.

**Recommendation (no patch, just flag):** scrubber drag handler should rAF-coalesce just like setHoverId. Low priority — scrubber drag isn't the IDLE-hover bug under discussion, but it'll bite if/when John ships scrubber+hover-while-dragging interactions.

---

## 5. Redundant drawFrame paths — none, but one near-miss

Commit `98bc609` removed the trailing `drawFrame()` from `recomputeFocus`. Verified gone. ✓

Audit of remaining `drawFrame()` callers:
- `animTick` — only when `stillFading && !stillMoving`. ✓ (cleanly gated)
- `camera.onChange` callback (line 718) — primary draw driver for camera motion. ✓
- `rebakeEdges` (line 2231) — ends in drawFrame. Called from setParam paths.
- `rebakeNodes` calls `rebakeEdges` (line 2210), `rebakeEdges` calls drawFrame. ✓ (single draw)
- `resizeAndFit` calls drawFrame (line 1073 + 1079) — TWO drawFrames in the resize-changed branch. Line 1073 is the hard-stop after `forceWriteEdgeState`; line 1079 is the unconditional tail. Both fire on every resize that changes size. Minor — resize is rare.
- `rebuildForMode` calls drawFrame (line 985). Then engine-boot path also calls drawFrame (line 685) after atlas upload. Both fire on first mount. Minor.
- setParam — calls drawFrame on each param tweak. Fine.

**Net:** each interaction produces exactly 1 drawFrame per rAF in steady state. The double-draws are limited to one-shot transition events (resize, mount, mode switch).

---

## 6. Label fade — pre-creation works; CSS transition path is healthy

Pre-creation at `rebuildForMode` (forge.js:948-966) uses one `DocumentFragment` → one `appendChild` → one reflow. ✓
- 663 `<div>` allocations are heavy but one-shot per mode. ~5-15 ms on mode switch only.
- Zero perf cost during hover — `getBoundingClientRect`, `appendChild`, and any `display`-toggle are absent from the hover path.

CSS (`app.css:5894-5925`):
- `.forge-label { opacity: 0; transition: opacity 0.15s ease-out; pointer-events: none; }`
- `.forge-label[data-visible="1"] { opacity: 1; }`

**Question raised in audit prompt:** does the CSS transition actually animate, or does the browser optimise the very first attribute-flip into a no-transition paint?

**Answer:** the transition fires correctly. The label is in the DOM from `rebuildForMode` time → the browser has resolved `opacity: 0` in styles → the attribute-flip to `opacity: 1` (via `data-visible="1"`) is a transitionable property change. The 9917be7 fade-flicker fix (which forced a layout-flush before the flip) addressed a different bug (the legacy display:none → display:block path that bypassed the transition). The current attribute-flip path doesn't hit that bug. ✓

**Hidden labels' resting cost:** 663 `<div>` with `position: absolute`, `opacity: 0`, `pointer-events: none`, no `data-visible` → `left`/`top` style not set → browser still creates a `LayoutBlock` for each. The labels-overlay is a single absolutely-positioned container. Render thread cost: minimal because `opacity: 0` short-circuits paint (browsers skip compositing layers at opacity 0). Style-recalc cost on transition: scoped to the labels whose data-visible attribute actually changed → small. ✓

---

## 7. Glyph alpha refresh — runs unconditionally per frame

`refreshGlyphAlphas` (forge.js:1202-1216):
- The handoff doc and inline comment claim a settled-fade short-circuit. **Not implemented in code.** The function always runs the 663-iteration loop and always writes the alpha column.
- Cost of the loop itself: ~5 µs. Negligible.
- Cost of the downstream `device.queue.writeBuffer(glyphInstanceVbo, ...)` in `drawFrame`: ~21 KB GPU upload **per frame**. Not free at 60 Hz, but also not the dominant cost (see Finding #1).
- **Severity:** 🟢 polish. The optimisation is real but small.

---

## 8. IDLE vs LOCKED magnitude — math + verdict

Per-frame fade-tick cost is independent of focused-set size — both loops iterate the full N (or E) regardless.

Concretely at deities mode (N=663, E=3033):
- IDLE → hover: ~600 node floats flip 0→1 in `nodeTargets` (everything except the focused set of ~15). Edges: ~2900 flip in `edgeTargets`.
- LOCKED → neighbour-shift: ~10-30 node floats change in `nodeTargets`. Edges: ~10-30.
- `tickNodeFades` loop body in both cases checks `if (c === t) continue;` then advances. The 600 flipping ones each run the advance branch; the 26 non-flipping ones short-circuit. Difference: ~600 vs ~26 iterations of the advance branch = ~10 µs vs <1 µs. **Imperceptible.**
- GPU upload of the full state buffer: identical 5 KB regardless.

**The thing the eye reads:** the *visual amount of change* between consecutive frames. IDLE→hover transitions the entire scene's appearance (600 alphas + all edge colors + the mass dim multiplier kicking in from 0 to `dim_amount`). LOCKED→neighbour-shift transitions a couple of labels and a couple of edges.

That is **not a perf bug**. It's the literal definition of what the dim pipeline is *designed to do* on IDLE-hover. The fade animation timing is the same; the *visual mass* is what differs.

---

## Findings list — severity-ranked

### 🔴 CRITICAL (active correctness bug)
**None.** The pipeline is correct. The depth-direction fix landed cleanly, no fade-buffer wholesale-replace bugs remain, the hover coalesce works, no redundant drawFrames in steady state.

### 🟡 IMPORTANT (perf or perception)

1. **Per-frame full-instance VBO re-uploads (`webgpu.js:1067-1075` + `1138-1140`).** `nodeInstanceVbo`, `edgeInstanceVbo`, and `glyphInstanceVbo` are STATIC data (rebuilt only on mode-switch / param-rebake) but uploaded on every `drawFrame`. At deities mode: ~170 KB upload × 60 Hz ≈ **10 MB/sec of wasted GPU bandwidth during any animation**. The fix is "track a dirty flag per buffer, only re-upload when dirty." This is the biggest single perf win on the table. It will not be visible at low-end frame counts but it's the leading suspect for "feels sluggish" under sustained interaction.

2. **`refreshGlyphAlphas` missing the documented short-circuit (`forge.js:1202-1216`).** Comment promises an element-wise settled-fade check; code always runs the full loop and signals "buffer changed" downstream. The function's loop cost is small (~5 µs) but the downstream glyph VBO upload cost is bundled into Finding #1.

3. **Scrubber drag bypasses the hover-rate-coalesce (`forge.js:1845`).** Scrubber's `if (rangeChanged) recomputeFocus()` fires synchronously at pointermove rate. Not the IDLE-hover bug, but a latent stutter source whenever John drags the scrubber over many nodes' lifespans simultaneously.

### 🟢 POLISH

1. **`syncGlyphFocus` + `syncGlyphPositions` are no-ops left in place.** Comments say "kept as no-ops so existing callers don't break — single follow-up cleanup batch will delete them." Inline-able next time someone touches the area.

2. **Stale shader comment in `GLYPH_SHADER` header (`webgpu.js:357-363`).** Describes the old "z slightly in front of parent disk" strategy. The actual code uses `z = parent_disk_z`. Cosmetic.

3. **`recomputeFocus`'s 4 transient allocations per hover (~12 KB).** Three `Float32Array` allocs (`computeNodeStates`, `computeSelectedStates`, `interleavePairs` output) + one `computeEdgeStates`. Could pool these in `local.scratch.*` to skip GC pressure during sustained hover. Micro-optimisation.

4. **`updateZoomGizmo` runs inside camera.onChange (forge.js:735, 745).** DOM textContent + classList write per camera tick. Cheap but more than zero. Could be rAF-coalesced.

5. **Resize path double-draws (`forge.js:1073` + `1079`).** Fires `drawFrame()` twice when size changed. Resize is rare; the redundancy is harmless but visible to the audit.

---

## Recommendations (HIGH LEVEL, no patches)

### What to do
1. **Implement instance-VBO dirty flagging in the renderer.** Add three booleans inside the renderer state (`nodeInstanceDirty`, `edgeInstanceDirty`, `glyphInstanceDirty`); set true from the JS side when the static buffer's contents actually change (rebakeNodes / rebakeEdges / rebuildGlyphInstanceBuffer); the writeBuffer calls in drawFrame check the flag and skip when clean. This is the single biggest improvement available.
2. **Implement the documented `refreshGlyphAlphas` short-circuit.** Either via the element-wise check the comment describes, OR by gating on a `local.fadesInFlight` boolean updated by `tickNodeFades` / `tickEdgeFades`. Same outcome.
3. **Stop polishing the IDLE-vs-LOCKED hover asymmetry as if it's a bug.** It isn't. See verdict below.

### What NOT to do
1. **Don't reintroduce pre-warm.** It's been tried twice (commits `536f9cb`, the uncommitted experiment in the transcript) and both times broke LOCKED-hover smoothness. The animation pipeline log invariant explicitly forbids it without a correct settled-fade gate. Even with the gate, John has expressed a clear preference for "buttery flow" over "snappy start."
2. **Don't add another label-DOM optimisation pass.** The pre-create at rebuildForMode is the right shape and is working. Further DOM perf gains are diminishing returns.
3. **Don't reorder the encoder pass.** The current edge → node → glyph order is correct for the depth strategy.

### Verdict on the residual "not there yet"
**This is a UX-design call, not a perf bug.**

Every metric an audit can pull says the animation pipeline is doing exactly what it's been asked to do. The fade runs at 0.15 s in both modes; the state buffer animates in place; the GPU sees coherent data every frame; the depth test composites correctly; labels fade cleanly; glyphs follow their disks. There is no remaining mechanism by which IDLE-hover can be made to *feel* like LOCKED-hover while the IDLE-hover dim affects 600 nodes and LOCKED-hover affects 10.

If John wants the perception gap closed, the options are visual-design choices he must make:

- **Option A.** Reduce `dim_amount_nodes` so IDLE-hover dimming is less mass-perceptible. The scene stays focused but the contrast hit is gentler.
- **Option B.** On IDLE-hover, dim only the *direct 1-hop boundary* (not the entire non-focused set). Reserve the full mass-dim for LOCKED. This changes what a hover *means* — currently IDLE-hover and LOCKED-hover do the same thing visually; this would split them.
- **Option C.** Stagger the dim cascade — animate the dim "outward" from the hovered node in a 2-3 ring sequence over 0.3 s instead of all-at-once over 0.15 s. The eye reads ripple motion as intentional rather than busy.
- **Option D.** Accept the asymmetry as informative — IDLE-hover *should* feel like the whole scene reacts because that's the cue that you're navigating. LOCKED-hover *should* feel surgical because you've committed.

The Finding #1 perf win (dirty-flag VBOs) is independently worth implementing — it'll shave a real ~5-10% off frame budget during sustained interaction — but it will NOT close the IDLE-vs-LOCKED perception gap by itself. The gap is structural to the current dim model.

— audit goblin, 2026-05-20.
