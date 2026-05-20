# Forge robustness audit #05 — GPU pipeline correctness + robustness

**Filed:** 2026-05-20
**Filed by:** READ-ONLY audit goblin (Lane B audit-only, no slot claim)
**Mode:** read-only — no code edits, no commits beyond this doc
**Scope:** GPU pipeline top-to-bottom — all 3 pipelines (node / edge / glyph), depth strategy, pass ordering, bind groups, buffer lifecycle, resize, atlas, known-not-done items, cleanup
**Files inspected:**
- `src/js/engine/renderer/webgpu.js` (the full GPU surface, 1175 lines)
- `src/js/engine/graph/glyph.js`
- `src/js/engine/graph/node.js`
- `src/js/engine/graph/edge.js`
- `src/js/engine/graph/mode.js`
- `src/js/engine/contract.js`
- `src/js/views/forge.js` (glyph wiring + resize path)
- `AUDIT/forge-glyph-migration-handoff-2026-05-20.md`
- `AUDIT/forge-animation-pipeline-2026-05-20.md`

---

## 1. TL;DR — top 3 GPU findings

1. **🔴 Glyph pass binds `nodeStateVbo` but does NOT gate on `nodeStateVboSize` matching `glyphInstanceVbo`'s instance count.** The two buffers are written from independent code paths (node-state on every drawFrame from `nodeCount`; glyph instance buffer once per `rebuildForMode`). After a mode-switch where the new mode has FEWER nodes than the previous mode left in the buffer, the glyph pass can read stale `nodeStateVbo` bytes for instances `[newN..oldN)`. WebGPU's vertex-fetch on out-of-range is implementation-defined; tested-OK on macOS/Metal does not mean safe everywhere. Belt-and-braces fix: write `nodeStateVbo` with `nodeCount * 8` bytes BEFORE the glyph pass dispatches, which is already the order in `drawFrame` — but the **invariant is undocumented and load-bearing.**

2. **🟡 Depth is correct NOW for selected vs focused vs dim, but the glyph-z scheme is fragile by design.** Glyph z = parent disk z EXACTLY (0.0 / 0.3 / 0.6), and glyphs rely on draw-order tiebreak in less-equal depth test. This works because (a) glyph pass comes after node pass in the same render-pass, (b) within a single draw call WebGPU guarantees instance-order rasterization for blend ops on the same primitive. But it depends on no future agent re-ordering passes, no future agent splitting the glyph pass into a separate render pass, and no future agent flipping depthCompare to `less`. The convention is documented in shader comments but not in a hard invariant (e.g., a unit test or a runtime assert). The same class of bug (z direction inverted) was the most recent fix; this is the *exact* place it will reappear.

3. **🟡 Selected-glow discard threshold at 0.15 is a tuned magic number with no automated regression check.** The square-clip artifact bug class was bumped through three thresholds (0.04 → 0.08 → 0.15) over three sessions. The current 0.15 hides any glow pixel with alpha < 0.15, which is correct for the current `selected_glow_strength` range — but if John ever bumps `selected_glow_strength` past ~1.5 in the dev panel, the discard threshold will stop catching the full glow tail and the square clip will return. The threshold should be derived from `selected_glow_strength`, not hardcoded.

---

## 2. Pipeline-by-pipeline correctness review

### 2.1 NODE pipeline (lines 99–216, 568–596)

**Vertex layout vs JS-side packer:**
- JS packer (`node.js` `packNodes`): 8 floats/instance × 32 bytes; layout = `(x, y, r, pad, R, G, B, A)`.
- Pipeline buffer [1]: `arrayStride: 32`, attrs at offset 0 (`float32x4`) and offset 16 (`float32x4`). **MATCH.**
- Pipeline buffer [2]: `arrayStride: 8`, attr at offset 0 (`float32x2`) — the `nodeStateVbo` (state, selected) pairs. JS writes via `frame.nodeStates || new Float32Array(nodeCount * 2)`. **MATCH.**
- Quad VBO [0]: `arrayStride: 8`, single `float32x2` attr. **MATCH.**

**Vertex shader (`NODE_SHADER`):**
- Quad scaling: `quad_vertex * inst_radius * size_mult * quad_scale`. `quad_scale` is 1.5× past `selected_glow.w` only when `inst_selected==1`. ✅ correct — non-selected disks aren't paying for glow headroom.
- `local_pos = quad_vertex * quad_scale` — SDF distance equals 1.0 at the disk edge regardless of `quad_scale`. This is correct because the disk SDF is normalized.
- Depth: `z_focus = mix(0.6, 0.3, 1.0 - inst_state)`. Reads correctly: `state=0` (focused) → z=0.3, `state=1` (dim) → z=0.6. Then `z = mix(z_focus, 0.0, inst_selected)`. Selected anchor at z=0.0. ✅

**Fragment shader:**
- Disk SDF + smoothstep AA: correct.
- Glow ring uses two smoothsteps to fade on both edges. ✅
- Premultiplied composite: `disk_rgb + glow_rgb * (1.0 - disk_a)`. Correct order: disk paints on TOP, glow underneath.
- Discard threshold: 0.15 — see TL;DR #3. Currently safe but brittle.

### 2.2 EDGE pipeline (lines 221–345, 598–642)

**Vertex layout vs JS-side packer:**
- `edge.js` `packEdges`: 12 floats/instance × 48 bytes. Layout = `(sX, sY, tX, tY, R, G, B, A, idleW, curveStr, bucketIdx, hotW)`.
- Pipeline buffer [1]: `arrayStride: 48`, three `float32x4` attrs at 0/16/32. **MATCH.** (endpoints=0, color=16, extra=32). `extra.x=idleW`, `extra.y=curveStr`, `extra.z=bucketIdx`, `extra.w=hotW`.
- Buffer [2]: `arrayStride: 4`, single `float32` attr. **MATCH** with `edgeStates` (one float per edge).
- Ribbon mesh: triangle-strip, `EDGE_RIBBON_COUNT = (32+1)*2 = 66` verts. ✅

**Vertex shader (`EDGE_SHADER`):**
- Bezier control point pull-to-origin: `mid + (vec2(0,0) - mid) * inst_extra.y`. Correct algebraically: when `curveStr=0`, p1=mid (straight line); when `curveStr=1`, p1=origin.
- Width clamp in screen-px: `world_to_fb = v.view_scale.x * v.viewport_px.x * 0.5`. **Verify dimensional analysis:** `view_scale.x = cam.scale * 2 / vp.w` (units 1/world). `viewport_px.x = vp.w * dpr` (units: framebuffer-px). Product `= cam.scale * 2 * dpr / vp.w * vp.w = 2 * cam.scale * dpr`. Times 0.5 = `cam.scale * dpr`. So `world_to_fb = world × cam.scale × dpr` = framebuffer-px per world unit. ✅ correct.
- `select(world_w_raw, fb_w / world_to_fb, world_to_fb > 0.0)` — the guard against div-by-zero when camera is degenerate. ✅
- Depth: `z = mix(0.85, 0.75, inst_state)`. IDLE edges at 0.85 (behind), HOT at 0.75 (slightly forward). Below all nodes (which top out at z=0.6 for dim disks). ✅
- `edge_t = t` (0 at source, 1 at target). Source→target gradient. ✅

**Fragment shader:**
- Bucket-hot lookup: `clamp(i32(bidx_raw), 0, 7)` — safe; bucketIndex 0–6 are real, 7 is unused slot.
- `mix(in.edge_color, hot, in.state)` — state=0 idle paints `edge_color` (slate or headline), state=1 hot paints bucket-hot. ✅
- `dim_mult = mix(1.0 - v.dim_amount, 1.0, in.state)` — idle dims when focused, hot stays bright. ✅
- `grad_mult = mix(1.0, 0.25, in.edge_t)` — 75% darken at target. **Note:** this is multiplied INTO the final color but NOT into alpha. Result: dark stub at target, but its alpha is unchanged, so the AA halo is the same width at both ends. Probably fine perceptually; flagging in case it ever looks "muddy at the target end."
- Discard 0.02 — generous threshold for edges. ✅

### 2.3 GLYPH pipeline (lines 365–468, 644–722)

**Vertex layout vs JS-side packer:**
- `forge.js` `rebuildGlyphInstanceBuffer`: 8 floats × 32 bytes. Layout = `(x, y, r, glyphIdx, R, G, B, A)`.
- Pipeline buffer [1]: `arrayStride: 32`, two `float32x4` attrs at offset 0 and 16. **MATCH.**
- Buffer [2]: `arrayStride: 8`, `float32x2` at offset 0 — **same nodeStateVbo as nodes**. See TL;DR #1.
- Quad VBO [0]: shared with node pipeline. ✅

**Vertex shader (`GLYPH_SHADER`):**
- Index clamp: `clamp(i32(floor(idx_f + 0.5)), 0, 31)`. Atlas has 32 UV slots, of which 17 are used. ✅ safe against junk.
- Size: `r = r_base * size_mult` where `size_mult = mix(1.0, v.selected_size_mult, selected)`. **NOTE:** the JS packer already pre-multiplied by `glyph_scale` (line 1175 in forge.js). So the chain is: base node radius × glyph_scale (in JS) × selected_size_mult (in shader, only if selected). That's correct.
- Depth: glyph z exactly matches disk z (0.0/0.3/0.6). Wins by draw-order (glyph after disk in encoder pass). ✅ correct as documented but fragile — see TL;DR #2.
- UV: `mix(u0, u1, (quad_vertex.x + 1.0) * 0.5)`. The Y axis is also `mix(v0, v1, (quad_vertex.y + 1.0) * 0.5)`. **CAUTION:** quad_vertex.y is flipped vs canvas-y in standard WebGPU NDC (positive y = up in NDC, positive y = down in canvas). Combined with `flipY: false` in `copyExternalImageToTexture`, the atlas is in canvas-coords (y-down), so `v0 < v1`. The shader maps `quad_vertex.y = -1` (bottom of quad in NDC = top after Y flip in view_scale) to `v0` (top of atlas cell). **Verify this looks right in browser** — if glyphs render upside-down vs DOM, it's this. (Likely fine; just flag to test deliberately.)

**Fragment shader:**
- `tex.a * in.tint.a` — premultiplies tint alpha by atlas alpha stencil. ✅
- Discard 0.02 — consistent with edges. ✅
- `vec4(in.tint.rgb * a, a)` — premultiplied alpha output. ✅ matches `alphaMode: 'premultiplied'` on the swap-chain.

---

## 3. Depth-direction verification (state explicitly)

**WebGPU clip-space convention (cite this in any future shader change):**
- WebGPU NDC z range: `[0.0, 1.0]`.
- `0.0` = NEAR plane = closest to camera.
- `1.0` = FAR plane = farthest from camera.
- Default `depthClearValue: 1.0` (far) so anything written replaces the clear.
- `depthCompare: 'less-equal'` means: fragment passes if its z ≤ existing z buffer value. With equal-z, **the LATER draw wins** (because at the moment it tests, the existing z equals its z, so ≤ passes, and the new color overwrites).

**Current scheme (`webgpu.js`):**
| Layer | z | Pipeline |
|---|---|---|
| Selected disk + selected glyph | 0.0 | nodePipeline / glyphPipeline |
| Focused disk + focused glyph | 0.3 | nodePipeline / glyphPipeline |
| Dim disk + dim glyph | 0.6 | nodePipeline / glyphPipeline |
| HOT edge | 0.75 | edgePipeline |
| IDLE edge | 0.85 | edgePipeline |
| (Far / clear) | 1.0 | — |

**Pass order:** edges → nodes → glyphs (lines 1112–1150). Within each pass, instance draw order is invariant.

**Why same-z glyph-after-disk works:** disk writes z=0.0, depth buffer becomes 0.0. Glyph at z=0.0 tests `0.0 ≤ 0.0` = true, passes, writes color. Across instances at different z (e.g. dim glyph behind selected disk): dim glyph z=0.6 tests against existing z=0.0 (selected disk wrote it earlier in same encoder), `0.6 ≤ 0.0` = false, fails — dim glyph correctly hidden.

This is the correct behaviour for the documented design. The fragility is that draw-order tiebreaking and depth-test tiebreaking BOTH have to agree.

---

## 4. Pass-ordering + bind-group review

### Pass order in `drawFrame` (lines 1097–1153)

```
beginRenderPass (single pass, single depth+color attachment)
  if (edgeCount > 0) drawEdges     // z=0.75/0.85
  if (nodeCount > 0) drawNodes     // z=0.0/0.3/0.6
  if (glyphCount > 0) drawGlyphs   // z=0.0/0.3/0.6 (matches disk z; wins by draw-order)
endRenderPass
```

**Findings:**
- ✅ Single render pass — correct. One depth clear, all three pipelines see the same depth buffer.
- ✅ Order is correct: edges first (farthest), nodes middle, glyphs last (so glyphs at same z as their disk paint on TOP).
- 🟡 **Glyph pass is in the SAME render pass + same depth attachment as disks.** Decoupling glyphs into a separate depth attachment (as the audit brief asked about) would make the "glyph wins via draw-order" reliance unnecessary. Trade-off: extra depth texture allocation (~depth24plus × viewport = ~6 MB at 1920×1080 retina) plus an extra pass-begin/end. Probably not worth it for the current bug class — the current design works — but worth knowing as the escape hatch if a future feature requires glyphs to z-fight differently than disks.
- 🟡 **No conditional skip on no-op frames.** Every `drawFrame` runs all three branches even when nothing changed. Not a correctness issue; perf only. The animation pipeline doc says the rAF loop is gated by "still fading" so this is partially mitigated. Worth measuring at idle to confirm.

### Bind groups

**`viewBg` (used by node + edge):** binding 0 = `viewUbo` (192 bytes). Layout matches: node + edge shaders both declare the same `View` struct. ✅

**`glyphBg` (used by glyph):** four entries:
- 0: `viewUbo` (same buffer) ✅
- 1: `glyphUvUbo` (512 bytes, 32 vec4 UV rects) ✅
- 2: `atlasTex.createView()` ✅
- 3: `atlasSampler` ✅

🟡 **`makeGlyphBindGroup()` is called twice: once at boot with a 1×1 dummy atlas, once in `setGlyphAtlas` after the real atlas is uploaded.** This is correct because the bind group references a TextureView (not the texture handle), and replacing the texture invalidates the view. The pattern is fine. Flag: if anyone ever calls `setGlyphAtlas` mid-frame (e.g., dynamic icon library), it would race against an in-flight render pass. Currently `setGlyphAtlas` is called once at boot, so no race.

### Uniform offsets

`View` struct in WGSL (used by node, edge, glyph):
```
vec2  view_scale         (offset 0)
vec2  view_offset        (offset 8)
vec2  viewport_px        (offset 16)
f32   dim_amount         (offset 24)
f32   wire_min_screen_px (offset 28)
f32   wire_max_screen_px (offset 32)
f32   dim_amount_nodes   (offset 36)
f32   selected_size_mult (offset 40)
f32   selected_glow_strength (offset 44)
vec4  selected_glow      (offset 48)  ← needs 16-byte alignment; 48 ✓
array<vec4, 8> bucket_hot_colors (offset 64)
```
JS-side write (lines 1045–1063) packs 48 floats = 192 bytes. View header → `viewData[0..15]` is 64 bytes; bucket palette starts at index 16 (byte offset 64). ✅ **MATCHES** WGSL layout, including the 16-byte alignment for the `vec4 selected_glow` at offset 48.

✅ No layout bugs detected.

---

## 5. Findings list (severity-ranked)

### 🔴 CRITICAL (active correctness risk)

**C1. `nodeStateVbo` cross-pipeline reuse has an undocumented load-bearing invariant.**
*Location:* `webgpu.js` lines 1083–1086, 1148.
*Issue:* The glyph pass uses the same `nodeStateVbo` that the node pass writes. `nodeStateVbo` is sized to `nodeCount * 8`. On a mode switch from a high-N mode (e.g., deities, 676) to a low-N mode (e.g., authors, ~50), the buffer is NOT shrunk (`ensureBuffer` only grows). The glyph pass dispatches `glyphCount` instances, which matches `nodeCount`. So in practice the instance count is correct. **But** the buffer's first `glyphCount * 8` bytes get overwritten by the node-state write before the glyph pass reads them, so the reuse is safe — IF the order of `device.queue.writeBuffer(nodeStateVbo, ...)` (line 1086) and the glyph `setVertexBuffer(2, nodeStateVbo)` (line 1148) is guaranteed in WebGPU semantics. It is, because `writeBuffer` is queued and the pass commands are encoded after. **No bug today.** But this is the kind of thing a refactor breaks. Recommend a comment block at line 1083 stating the invariant, and a comment at line 1148 referencing it.
*Severity: CRITICAL* not because it's broken, but because the next refactor will silently break it and the resulting glyph dim/select desync will be diagnosed as a "fade animation bug" again.

### 🟡 IMPORTANT (perf or robustness)

**I1. Glyph z = disk z by-design relies on draw-order tiebreak.**
*Location:* `webgpu.js` lines 448–449 (glyph vs) vs lines 159–160 (node vs).
*Issue:* See TL;DR #2. Encoded the convention in shader comments but not in a regression test. A future pass-reorder, pass-split, or depthCompare flip silently breaks it. Worth adding a self-test (e.g., a tiny render-to-readback in dev mode that asserts a known glyph paints on top of its disk).

**I2. Selected-glow discard threshold (0.15) is a tuned magic number.**
*Location:* `webgpu.js` line 213.
*Issue:* See TL;DR #3. Three sessions of bumps. Should be `final_a < (0.05 + max(0, selected_glow_strength - 1.0) * 0.1)` or similar — derive from the strength uniform so the discard always catches the alpha tail regardless of slider position. Or: cap `selected_glow_strength` in the dev panel at 1.5.

**I3. Atlas at 64px hard-coded; not Retina-aware.**
*Location:* `forge.js` ~line 668 (where `buildAtlas(64)` is called).
*Issue:* On DPR=2 displays (most retina), a 64×64 cell sampled at deep zoom shows pixelation. `mipmapFilter: 'linear'` is set on the sampler but **the texture is created without mipmaps** (no `mipLevelCount` in `setGlyphAtlas`). So mipmap interpolation is a no-op; only bilinear minification applies. At default zoom, the glyph is sampled at ~12–18 px on screen, mapped from a 64 px cell — so we're texture-magnifying or near-1:1, which is fine. At deep zoom (cam.scale ~10), a glyph at world radius 14 × cam.scale 10 × DPR 2 = 280 px on screen, sampled from 64 px = ~4× magnification → bilinear blur. 128 px atlas would help. Cost: 4× texture memory (currently 64×64×17 = ~70 KB → 280 KB) — negligible.
*Handoff flags this as known-not-done; concur.*

**I4. `refreshGlyphAlphas` is unconditional per frame.**
*Location:* `forge.js` lines 1202–1216.
*Issue:* Recomputes all glyph alphas every frame even when `nodeStates === nodeTargets` (fade settled). Cost: O(N) loop + ~21 KB GPU buffer write at idle. The doc says short-circuit was planned but not done; verified absent in current code. Adds one element-wise equality check; saves the write when settled.
*Handoff flags this; concur.*

**I5. Resize destroys + recreates `depthTex` on every actual size change.**
*Location:* `webgpu.js` lines 735–746.
*Issue:* `ensureDepthTex` is called every `drawFrame`. The early-out `depthTex && depthTexW === fbW && depthTexH === fbH` handles the no-resize case correctly. On resize, the old texture is destroyed and a new one created. **Race risk:** if `device.queue.submit` was called in a previous frame with a command buffer that still references the old `depthTex`, destroying it before that command is finished is technically undefined. In practice the GPU consumes the previous frame before the next `drawFrame` runs (rAF synchronization). But under heavy compositor pressure or tab-throttling, this isn't guaranteed. Safer pattern: track depthTex by frame index and destroy lazily. Low-prio because it's never been observed; flagging as a "this is the kind of race that surfaces under tab-throttle."

**I6. `ensureBuffer` doesn't shrink; potential VRAM bloat on large→small mode switch.**
*Location:* `webgpu.js` lines 748–759.
*Issue:* Only grows. After a session of switching between high-N modes (deities 676) and low-N modes (alphabets ~50), the VBOs sit at the high-water mark forever. For Atlas's expected node counts (≤10k target), this is bounded at ~few MB — not a real leak. Flagging only because it's a violation of "match needed size" expectations.

**I7. `setGlyphAtlas` doesn't synchronize with in-flight frames.**
*Location:* `webgpu.js` lines 951–973.
*Issue:* If called while a render pass referencing the old `atlasTex` is in flight on the GPU, the destroy could race. Currently only called once at boot before any frame is encoded, so no live bug. Mark as "do not call mid-session" or queue the swap to next frame boundary.

### 🟢 POLISH

**P1. `glyph_tint` param ignored.**
*Location:* `forge.js` line 1182 (hardcoded `0.55`).
*Issue:* `mth.lightenColor(fc, 0.55)` ignores `local.params.glyph_tint`. Per the handoff doc, known-not-done. Read the param.

**P2. `setIcon` / `iconByType` overrides silently ignored.**
*Location:* `forge.js` `rebuildGlyphInstanceBuffer` line 1177 (uses `n.type` only).
*Issue:* The old DOM path honored `local.iconByType[n.type]` to swap glyphs per node-type. New GPU path doesn't. Handoff flags this. If the icon library glyphs aren't in the atlas, the only correct fix is either (a) bake them into the atlas (atlas grows from 17 to ~47 cells = 7×7 grid), or (b) explicitly mark as deferred V2.

**P3. `destroy()` doesn't release glyph-specific resources individually.**
*Location:* `webgpu.js` lines 1156–1167.
*Issue:* `destroy()` releases `quadVbo`, `edgeRibbonVbo`, `diskUbo`, `viewUbo`, `nodeInstanceVbo`, `edgeInstanceVbo`, `nodeStateVbo`, `edgeStateVbo`, `depthTex`, and then `device.destroy()`. Missing from the explicit cleanup: `glyphUvUbo`, `atlasTex`, `atlasSampler`, `glyphInstanceVbo`. `device.destroy()` releases all device-owned resources, so this isn't a leak in practice — but the asymmetry is a code-smell that bites the next agent who adds a fourth pipeline and forgets to add it to both the create-list and the destroy-list. Add the four missing destroy calls.

**P4. Edge gradient `grad_mult` applied to color RGB but not alpha.**
*Location:* `webgpu.js` line 343.
*Issue:* `vec4(color.rgb * grad_mult * a, a)`. The alpha output is `a` (unchanged), but the rgb is scaled by `grad_mult` × `a`. Because output is premultiplied alpha, this means the visible color darkens but the alpha (and therefore the AA footprint) stays constant. Probably the intended behavior — keeps the wire-end blunt against the disk it terminates into. Flag for awareness only.

**P5. `bucket_hot_colors` slot 7 is unused but written.**
*Location:* `webgpu.js` lines 769–778 + line 1063.
*Issue:* The palette is 8 vec4s = 32 floats but only 7 buckets exist. Slot 7 is initialized to slate and stays at slate. Harmless; just notable when reading the code that "bucket 7 = unused."

---

## 6. Recommendations (high-level, no patches)

In rough priority order:

1. **Document the `nodeStateVbo` cross-pipeline reuse invariant inline.** Two short comment blocks (one at the write site, one at the glyph-pass set site) referencing each other. Cost: minutes. Prevents the next "fade desync" misdiagnosis.

2. **Derive the selected-glow discard threshold from `selected_glow_strength` instead of hardcoding 0.15.** Removes one whole class of "square-clip is back when I crank the glow slider" bugs from the future. Or alternatively, clamp `selected_glow_strength` in the dev panel so the current threshold is provably safe.

3. **Add the `refreshGlyphAlphas` settled-fade short-circuit.** One element-wise check, saves a per-frame 21 KB GPU write at idle. Handoff doc already flags this; mechanical fix.

4. **Wire `glyph_tint` param + decide on `setIcon` overrides.** Both are flagged in the handoff. The `setIcon` decision is the bigger call — either bake icon-library glyphs into the atlas (and grow it from 17 cells to ~47) or formally deprecate the feature in V1.

5. **Upgrade atlas to 128 px cells with mipmaps generated.** `cellPx=128` + an extra `device.queue.copyTextureToTexture` mipmap pass (or use `createMipmaps` from a utility). Sharper at deep zoom. Cost: 4× texture memory (still under 300 KB). Not urgent.

6. **Add explicit destroy calls for the four glyph resources** (`glyphUvUbo`, `atlasTex`, `atlasSampler`, `glyphInstanceVbo`) in `destroy()`. Defensive; not a real leak today because `device.destroy()` covers it.

7. **Decouple depth attachment for the glyph pass** — DO NOT do this. The current single-pass design is correct and simpler. Flagging because the audit brief asked. Only reason to split would be a future feature like "glyphs render with their own z-order independent of disks" — no such feature is on the roadmap.

8. **(Long-term) Add a render-to-readback dev assertion** that confirms a known-selected glyph paints on top of its disk. Locks in the depth convention so the next agent who flips it will trip the test. Not in current dev tooling; could grow from the existing `debugReadEdgeStates` / `debugReadNodeStates` probes.

9. **Atlas y-flip — verify in browser.** UV math looks correct but the interplay of NDC-y-up vs canvas-y-down vs `flipY:false` is the kind of thing that ships wrong without a deliberate test. Click a node, verify the glyph is right-side-up.

10. **Per-frame readback debug probes** (`debugReadEdgeStates`, `debugReadNodeStates`) are excellent and should be kept. They're the right shape for diagnosing the next class of state-buffer bugs.

---

## Closing notes

The pipeline is in good shape after the glyph migration. Layouts match, depth scheme is correct, bind groups are right, premultiplied-alpha math is consistent across all three pipelines. The two real risks are both **cross-pipeline coupling not encoded as a hard invariant**:
- The `nodeStateVbo` reuse (silent if refactored wrong).
- The glyph-z = disk-z + draw-order tiebreak (silent if pass order changes).

Both are documented in shader comments but not in code structure. The remaining items (atlas resolution, glyph_tint, refresh short-circuit, threshold derivation) are well-understood polish from the handoff doc.

No active correctness bugs were found. The current shipping state is correct; the risks are structural.

— audit goblin, 2026-05-20, read-only Lane B
