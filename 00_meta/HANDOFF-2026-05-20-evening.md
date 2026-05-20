# HANDOFF — 2026-05-20 evening — Forge node-render bug, post Phase 5C

> **For the fresh agent picking up Forge work.** John asked for this doc explicitly: *"flow nice. but still nodes transparent, just the symbol fainted on top. with a glow with a transparent glow. need fresh agent. JUST inspect again and log out clear with description of your plan and current stage with my status and your clues what could be."*
>
> Read this top-to-bottom before touching any Forge code.

---

## 1. The plan (where we are in the big arc)

Forge is the proprietary WebGPU view. After the prior agent stalled, John asked for a **ground-up audit + layered rebuild**: *"audit the component ground up — make a solid proper node, then behaviors, then wires, then fx, then management."*

Six phases, in this order:

| Phase | Layer | Status | Commit |
|---|---|---|---|
| **0** | dev-panel DELETED | shipped | `ba78863` |
| **1B** | NODE atom (disk geometry, hit-test grid, dirty-flag, owned[]) | shipped | `2a2b9dd` |
| **2B** | BEHAVIORS (hover/click, fade pipeline, rAF ownership, dim-model dispatcher) | shipped | `68a8e2c` |
| **3B** | WIRES (edge buckets, gradient, depth z) | shipped | `2e2c178` |
| **4B** | FX (glow, glyphs/atlas + mipmaps, labels) | shipped | `042b18b` + `bbb1a11` (FX5 floor fix) + `7cdb9b0` (FX2 cull fix) |
| **5B** | MANAGEMENT (rebuildForMode lifecycle, LS persistence, scrubber bounds, side-nav, search index) | shipped | `bbff608` |
| **5C** | unify node + glyph opacity on GPU (post-John critique) | shipped | `5f63dc2` |
| **6** | autonomous polish (T3 backlog) | NOT STARTED | — |

**Foundation rebuild COMPLETE.** ~400 lines of contract-level invariants documented inline at the top of `src/js/views/forge.js`. All 9 Lane B commits this session passed live verification in the preview iframe at commit time. Lane B slot is OPEN.

---

## 2. John's status — the residual bug

After Phase 5C, John reports the perf is fine (*"flow nice"*) but the visual is still wrong on **locked nodes**:

> *"still nodes transparent, just the symbol fainted on top. with a glow with a transparent glow."*

Reference screenshot (from the conversation, not stored): **Toyouke-Ōmikami** locked in Shinto deities mode at moderate zoom. Renders as:
- ✅ A **gold glow halo** ring (correct — locked anchor)
- ❌ The **deity glyph faint** in the middle (expected: full opacity)
- ❌ The **disk fill effectively invisible** (expected: full family-color red)

The pre-5C reports were similar but worse — John listed Mullissu / Mastema / Fujin / Raijin / Ninurta as all displaying the same way. After Phase 5C (which unified opacity onto the GPU), perf is better but the visual symptom persists.

**Important:** John's architectural critique was correct and Phase 5C addressed the right root cause (disk+glyph dual opacity paths). The visual is *closer* than before, but not solved. The next step is **not** another opacity-pipeline rewrite — it is a targeted investigation.

---

## 3. What Phase 5C actually changed (and what it DIDN'T)

**Architecture before 5C:** disk opacity uniform-driven on GPU. Glyph opacity computed per-frame in JS by `refreshGlyphAlphas` and uploaded as the alpha column of the glyph instance buffer. Two paths → drift possible.

**Architecture after 5C:** disk and glyph both compute alpha in their fragment shaders using the same dim formula:
```wgsl
let dim_mult = mix(1.0, 1.0 - dim_amount_{nodes|glyphs}, in.state);
let a        = c.a * coverage * dim_mult;
```
where `in.state` comes from the shared `nodeStateVbo`. One opacity logic, two shaders, no drift possible by construction.

`refreshGlyphAlphas` is DELETED. `glyphInstancesDirty` per-frame flag REMOVED. The glyph buffer's per-instance alpha column is now ONLY a per-instance multiplier baked at rebuild time (today: always 1.0).

**What 5C did NOT change:**
- The disk fragment formula
- The state buffer (`nodeStateVbo`) and its writers
- The selectedSet / focusedSet logic
- The fade pipeline (`tickNodeFades`)
- `recomputeFocus`
- The depth z scheme

So if Toyouke's disk is "transparent" today, the same disk-shader path would have been transparent before 5C too — but the symptom wasn't dominant before because there was a faint glyph in front masking it. Now the glyph also follows state-derived dim and the disk's transparency is unmasked.

---

## 4. Clues — hypotheses ranked by likelihood

### H1 — Locked node's `state` is being driven to ≥0 (dim) instead of 0 (focused)  [HIGHEST]

`focusedSetFor(hoverId, lockedSet, adjacency)` in [adjacency.js:43](src/js/engine/graph/adjacency.js#L43) adds the locked node + 1-hop neighbors to focusedSet. `computeNodeStates` then writes 0 for in-set, 1 for out-of-set ([adjacency.js:73](src/js/engine/graph/adjacency.js#L73)). So a locked Toyouke SHOULD be state=0.

But: if state is 0 the disk renders with `dim_mult = mix(1, 1 - dim_amount_nodes, 0) = 1.0` → FULL opacity. If John sees transparency, the actual rendered `in.state` for Toyouke isn't 0.

**Test:**
1. Lock Toyouke.
2. `_forgeDebug.dumpBugState()` → look at `nodeStates` array — find Toyouke's index in `idIndex` and read `nodeStates[i*2]` (dim column). If it's 0.0 the hypothesis is wrong; if it's >0 the hypothesis is confirmed and the bug is in the writers.
3. Likely writers to check if state ≠ 0:
   - `recomputeFocus` — does it run after LS restore? ([forge.js:1376-1387](src/js/views/forge.js#L1376))
   - `tickNodeFades` — could the fade not have arrived at target yet? (FADE_DURATION is short, but a paused tab or stalled rAF could leave state mid-fade)
   - The B5 exception sites in `rebuildForMode` — wholesale-replace allocates fresh `Float32Array(N*2)` which is zero-init → state=0 → should be GOOD by default

### H2 — Glyph atlas mip-bleed washing the disk to white  [MEDIUM]

After FX4 (Phase 4B), the atlas was bumped to 128 px cells with a 10-level mipmap chain generated via `drawImage` at `imageSmoothingQuality='high'`. The glyphs are rasterized white-on-transparent. At mid mip levels (4-6) the downsampled cell may carry a faint white halo extending well past the stencil interior.

The glyph quad is `2r × 2r` (covers entire disk plus selected-grow). At the right zoom, the mip sampler picks a level where the cell is 8-16 px and the white halo spills onto the disk area. Premultiplied alpha:
- `a = tex.a × in.tint.a × glyph_op × dim_mult`
- output = `tint.rgb × a, a`
- if `a > 0.02` (the discard floor), white-tinted-with-family-hue color writes over the disk

For a locked node at z=0.0, the glyph is drawn AFTER the disk. So a subtle whole-quad whitewash from glyph mip-bleed would VISUALLY look like the disk has become semitransparent (its red showing through the white). That matches John's *"transparent, just the symbol fainted on top"* — the "symbol fainted on top" is the dim of the stencil interior; the "transparent" is the mip-halo washing the rest.

**Test:** in `_forgeDebug`, call `edgesAndNodesOnly()` to disable the glyph pass entirely while a node is locked. If the disk fill returns to opaque red → confirmed: mip atlas is bleeding white over the disk area.

**Possible fix shape:** keep the atlas at 128 but disable mipmap generation (single level) — at the cost of slight aliasing at deep zoom-out. Or shrink the glyph quad to `1.0r × 1.0r` (the SDF stencil is centered within `±0.5` so the quad doesn't need to be `±1`). Or rebuild the atlas with pre-multiplied black background instead of transparent to prevent halo bleed.

### H3 — Selected size_mult expanding the glyph quad past the disk SDF edge  [MEDIUM]

Selected glyph quad uses `r = r_base * mix(1.0, v.selected_size_mult, selected)`. With `selected_size_mult > 1`, the glyph quad lifts beyond `±r`. The disk SDF still ends at `dist=1.0` in unit-circle space (it does not grow with the disk; only the QUAD scales — see [webgpu.js:182](src/js/engine/renderer/webgpu.js#L182)).

So for a selected disk with `size_mult=1.5`, the quad spans `±1.5r`, but the disk's filled region (dist < 1.0) covers only `±1.0r` — the OUTER `0.5r` annulus of the quad is glow-only territory + glyph in the center. If the glyph quad is now ALSO `1.5×` (Phase 4B FX5/FX8), its bounding region extends to the edge of the disk's quad, painting in the glow annulus where the SDF disk has `disk_alpha=0`.

This is by design for the selected-glow blend, but if the glyph mip-bleed wraps to the full quad, and the quad extends to the glow annulus, the glyph wash covers the entire 1.5r region — which visually masks the disk that only fills the inner 1.0r.

**Test:** lock a node and read its disk's quad scale on screen (via `dumpBugState`). Compare to the perceived "transparent" region — does it match the OUTER ring of the disk-quad (the glow annulus) vs the INNER filled disk?

### H4 — `nodeStateVbo` length / glyph instance count mismatch  [LOW]

The glyph pipeline binds `nodeStateVbo` as its third vertex buffer ([webgpu.js around setVertexBuffer(2,...)](src/js/engine/renderer/webgpu.js)). If `nodeStates` and `glyphInstanceData` have different N (e.g., glyph N was sized off a stale mode), the glyph at index `i` reads state from `nodeStates[i*2]` — but `i` may be the WRONG instance index, attaching state from an unrelated node.

After 5C this is more dangerous because the glyph's opacity NOW depends on its `state` attribute. Pre-5C the alpha column was JS-computed per-glyph, masking the misalignment.

**Test:** add a sentinel — `dumpBugState` should report `nodeStates.length / 2 === idIndex.length === glyphInstanceData.length / 8`. If they differ → confirmed misalignment.

### H5 — `tickNodeFades` stuck mid-transition  [LOW]

The fade pipeline advances `nodeStates` toward `nodeTargets` at a rate set by FADE_DURATION. If `tickNodeFades` returns early due to `stillFading=false` while a state hasn't fully converged (numerical floor edge case), the state could sit at e.g. 0.05 instead of 0.0. `dim_mult = 1 - 0.05 × dim_amount_nodes` ≈ 1 - 0.05×0.85 ≈ 0.96 — barely perceptible. **Probably not the cause** for John's "very transparent" report.

### H6 — `recomputeFocus` not running after LS lockedSet restore  [LOW BUT WORTH 30s CHECK]

LS restore at [forge.js:1376-1387](src/js/views/forge.js#L1376) calls `recomputeFocus()` after rebuilding lockedSet. Good.

BUT: there's also a click-empty path that clears lockedSet and calls recomputeFocus. And there's a fade pipeline that runs continuously after. So this should be OK. Quick check anyway: in the dumpBugState read, confirm `focusedSet.size > 0` and Toyouke is in it.

### H7 — Family color `#c85050` parsed incorrectly  [LOWEST, but cheap to verify]

The Shinto family color (#c85050) and the failing nodes' colors are 6-hex with no alpha. `hex2rgba(fc, 1)` should produce `[0.78, 0.31, 0.31, 1.0]`. Highly unlikely to mis-parse, but the dumpBugState reports `nodeInstanceData[i*7+3..6]` (the color column) — confirm it's not `[0,0,0,0]` for Toyouke.

---

## 5. The first 4 commands a fresh agent should run

```
# 1. Boot the preview server
ls start-atlas.command && open start-atlas.command || python3 -m http.server 8742
# Open http://localhost:8742/?view=forge

# 2. In the page console (or via preview_eval):
await _forgeDebug.dumpBugState()
# Read: are nodeStates / glyphInstanceData / idIndex lengths consistent?

# 3. Lock toyouke-omikami in deities mode, then:
_forgeDebug.edgesAndNodesOnly(true)
# If the disk now appears red and solid → bug is in glyph pipeline (H2/H3/H4).
# If the disk is still transparent → bug is in disk pipeline / state (H1/H5/H6).

# 4. Toggle back, then run a hit-test:
_forgeDebug.edgesAndNodesOnly(false)
const idx = local.mode.nodePacked.idIndex.indexOf('toyouke-omikami')
const stateDim = local.nodeStates[idx*2]
const stateSel = local.nodeStates[idx*2+1]
// stateDim should be 0.0 (focused), stateSel should be 1.0 (anchor)
```

After step 3 you've split H1/H5/H6 from H2/H3/H4 — start the deeper investigation in the half that survived.

---

## 6. File map for the bug investigation

| File | Lines | What lives here |
|---|---|---|
| `src/js/engine/renderer/webgpu.js` | 99–233 | NODE_SHADER (disk fragment formula at 178–232) |
| `src/js/engine/renderer/webgpu.js` | 418–555 | GLYPH_SHADER (vertex at 460–522, fragment at 524–554) |
| `src/js/engine/renderer/webgpu.js` | ~1080–1100 | nodeStateVbo write site + cross-pipeline INVARIANT comment |
| `src/js/views/forge.js` | 1906–1959 | rebuildGlyphInstanceBuffer (the alpha=1.0 baseline) |
| `src/js/views/forge.js` | 2255–2310 | recomputeFocus (state computation entry) |
| `src/js/engine/graph/adjacency.js` | 43–80 | focusedSetFor + computeNodeStates |
| `src/js/engine/graph/glyph.js` | (top) | buildAtlas — atlas raster + mip chain generation |
| `src/js/views/forge.js` | 1547–1582 | The B5 EXCEPTION SITE comment block + the 4 wholesale-replace lines (don't break this) |

---

## 7. Rules of engagement for the next agent

- **Do not iterate on numeric thresholds without first confirming what state Toyouke is actually rendering at.** The Phase 4B FX5 + FX2 audit-derived numbers BOTH regressed because I trusted the formulas without checking the default-value endpoint. Saved as `feedback_audit_formulas_need_default_check.md` in memory.
- **Do not delete spec-lock comments at the top of forge.js or webgpu.js.** They encode invariants from 5 audits worth of work and the FADE-PIPELINE EXCEPTION SITE annotation prevents a known bug-class from recurring.
- **Do not touch app code while a Lane A content agent is running.** Pre-commit hook enforces. Saved as `feedback_content_agents_dont_touch_appcode.md`.
- **Stay on `main`.** Solo local repo. No worktree branches. See `feedback_work_on_main.md`.
- **Commit in tight cycles.** Other parallel agents periodically sweep uncommitted work. See `feedback_parallel_agent_sweeps.md`.
- **Cache-bust slug.** Bump the slug in `index.html` script tags when shipping any change to `forge.js` / `webgpu.js` / `glyph.js` so John's browser reloads cleanly.
- **Don't tell John to "open index.html".** Use `start-atlas.command` or http://localhost:8742. PMTiles needs Range. See `feedback_atlas_needs_http_server.md`.
- **One STATUS.md entry per batch.** Append to the top, no silent finishes.

---

## 8. Open follow-ups (deferred, not blockers for this bug)

- Phase 6 (autonomous polish) — T3.1-T3.18 backlog in `AUDIT/forge-robustness-lock-plan-2026-05-20.md`
- `06_themes/` → `06_motifs/` rename — still queued, atomic Lane B batch with build script updates
- Hulls integration — plan at `AUDIT/forge-hulls-integration-plan-2026-05-20.md`
- the portable core sibling-product handoff — DO NOT consult yet; trigger conditions in `feedback_vektor_sibling_handoff.md`

---

## 9. Last-known good state

- Commit: `5f63dc2` (Phase 5C)
- Working tree: clean
- Mode tested: deities (676 nodes / 3033 edges)
- Atlas: 640×512, 10 mip levels
- LS key `codex-atlas/forge-runtime-v1`: round-trips correctly (lock Zeus → reload → restored)
- Cache-bust: `20260520-rebuild-phase-5c`
- All previous phase invariants pass (countNodeVboWrites / countEdgeVboWrites / countGlyphVboWrites stable at idle; A4 dim model default; rAF state at rest clean; ownedCount() = 12)

The thing that's NOT correct is what John sees on his screen for locked Shinto deities. Start there.

---

_Written 2026-05-20 evening by the agent finishing Phases 0–5C, on John's explicit request to log out cleanly for a fresh agent._
