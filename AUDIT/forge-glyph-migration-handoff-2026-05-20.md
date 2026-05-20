# Forge glyph migration — full handoff for fresh agents

**Filed:** 2026-05-20
**Filed by:** opus (Lane B), per John's *"log out for fresh agent"*
**Reads-after:** `AUDIT/forge-animation-pipeline-2026-05-20.md` (the longer pipeline history)
**Latest commits this doc covers:** `1226559`, `286308b`, `<current>`

This is the **handoff doc** for the GPU glyph migration. If you're a fresh agent picking up Forge view work, read this whole thing before touching anything. The architecture is now correct but there are residual visual bugs and a clear next-steps list.

## TL;DR — where things stand

- Glyphs are now rendered by the WebGPU canvas via a texture-atlas instanced quad pass. The DOM glyph overlay (`<span>` × 663) is fully retired. **Massive perf win** — frame time ~0.1ms regardless of zoom; the old DOM-zoom-out cliff is gone.
- Three follow-up bugs have been fixed (sizing, selected size_mult, per-instance z-layering).
- One depth-direction bug is being fixed in the same commit as this doc.
- Per-instance fade still works — glyph alpha refreshes from `nodeStates` per frame, inheriting the same animation as disks.
- **Remaining known issue**: John reports "still not there yet" — some hover states show bigger circle without glyph. This commit's depth-direction fix targets that, but verify in real browser before declaring done.

## The architectural shape (read carefully)

### Three glyph code paths now obsolete (do NOT bring back)

These were all workarounds for the DOM/canvas seam:

1. **Per-glyph DOM positioning** (`syncGlyphPositions`) — was the perf cliff. ~160k DOM writes/sec when zoomed out.
2. **Per-glyph DOM opacity + z-index** (`syncGlyphFocus`) — was the occlusion-zone hack to keep DOM glyphs from painting over canvas-side selected halos.
3. **`rebakeGlyphsForMode` DOM rebuild loop** — was destroying + recreating 663 `<span>`s per mode change.

All three are no-ops or deleted. If you find yourself thinking about a "syncGlyph*" function, STOP — you're solving an obsolete problem.

### Five live components of the GPU pipeline

| Component | File | Role |
|---|---|---|
| Atlas rasterizer | `src/js/engine/graph/glyph.js` (`buildAtlas`) | Async — rasterizes 17 SVG glyphs into one Canvas2D image, returns canvas + UV rects + typeToIdx map |
| WGSL shader | `src/js/engine/renderer/webgpu.js` (`GLYPH_SHADER`) | Instanced textured quads, samples atlas via uniform UV table |
| Pipeline + bindings | `src/js/engine/renderer/webgpu.js` (search "glyphPipeline") | Bind group (view + uvs + texture + sampler), pipeline, atlas texture, sampler |
| Per-frame instance buffer | `src/js/views/forge.js` (`rebuildGlyphInstanceBuffer` + `refreshGlyphAlphas`) | Builds 8-float-per-instance buffer; alpha column refreshed per frame from `nodeStates` |
| Render pass | `src/js/engine/renderer/webgpu.js` (`drawFrame` tail) | Pass appended after disk pass, before pass.end |

### Per-instance data layout (32 bytes)

```
[0..1] pos.x, pos.y       — world coords
[2]    radius             — already pre-multiplied by glyph_scale in JS
[3]    glyphIdx           — atlas slot (0..16)
[4..6] tint.r, tint.g, tint.b — premultiplied by glyph_tint
[7]    alpha              — refreshed per frame: baseOp × (1 - state × dimMul)
```

Plus a third vertex buffer binding: `nodeStateVbo` (8 bytes per instance, `state` + `selected`), REUSED from the node pipeline — zero duplicated data.

## Iteration log — what we tried, what broke, what worked

### Commit `1226559` (the architectural fix)

Moved everything from DOM to WebGPU. Shipped:
- Atlas builder (cellPx=64, 4×5 grid)
- WGSL glyph shader with per-instance pos+r+idx and tint+alpha
- Renderer pipeline + bind group + atlas upload
- View layer wiring (atlas at boot, instance buffer at mode load, alpha refresh per frame)
- Deletion of all DOM glyph machinery

**John's reaction:** "substantially better!" but flagged three issues.

### Commit `286308b` (three audit fixes)

John flagged:
1. **Glyph sizes felt different** — DOM glyph had a `glyph_scale` (0.85) multiplier the GPU pack was missing → glyphs 18% bigger. Fixed by `data[off+2] = np.data[i*NF+2] * glyphScale` in `rebuildGlyphInstanceBuffer`.
2. **Selected node's glyph appeared missing** — disk grows by `selected_size_mult` but glyph didn't. Fixed by binding `nodeStateVbo` to the glyph pipeline as a third vertex buffer + shader applies `selected_size_mult` per instance.
3. **Overlapping glyphs looked chaotic** — all at fixed z=0.02, last-drawn wins. "Fixed" with per-instance z values 0.01/0.10/0.50.

**John's reaction:** "better but not there yet — lots of nodes hover without the symbol just a bigger circle."

### Commit `<current>` (depth-direction fix)

The "per-instance z" values from `286308b` were **backwards**. In WebGPU clip space, **smaller z = closer to camera = wins the less-equal depth test**. Disk depths:
- selected disk: z=0.0
- focused disk: z=0.3
- dim disk: z=0.6

Glyphs at z=0.01/0.10/0.50 had LARGER z than their parent disks, meaning the depth test rejected them — the bigger selected disk paints over its own glyph. Bug visible across many nodes because EVERY hover briefly selects a node (selected = lockedSet ∪ {hoverId}).

**Fix this commit:** glyph z = parent disk z EXACTLY. Since glyphs draw AFTER disks in the encoder pass, less-equal test (z <= existing-z) passes for same-z, and glyph wins via draw order. For overlapping instances at different z, depth test correctly hides dim glyph behind focused/selected disk halos — exactly what the old occlusion-zone hack approximated.

Updated z mapping:
```wgsl
let z_focus = mix(0.3, 0.6, state);  // 0.3 if focused, 0.6 if dim
let z       = mix(z_focus, 0.0, selected);  // 0.0 if selected anchor
```

**Verify in real browser before declaring done.**

## Things to verify (and likely-future-bugs to watch for)

1. **Selected glyph now appears on top of its disk.** Click a node, the glyph should be clearly visible inside the (grown) disk.
2. **Hovering scrubs cleanly.** No more "bigger circle no glyph" flashing.
3. **Overlap layering correct.** Dense areas — dim glyphs hide behind focused/selected, not the other way.
4. **Fade still works.** Hover from idle, glyphs should ease toward dim alpha smoothly (refreshGlyphAlphas pulls from nodeStates which animates).
5. **Glyph SIZE matches prior behavior.** glyph_scale should produce same visual size as DOM glyphs did.

If any of those fail, the bug is in one of these places:

- `rebuildGlyphInstanceBuffer` — wrong tint, wrong radius multiplier, wrong glyphIdx mapping
- `GLYPH_SHADER` vertex code — wrong z, wrong size_mult application
- Atlas rasterization — currentColor → white substitution may have missed a glyph type
- `nodeStateVbo` binding — if the order of nodes in `nodeStateVbo` doesn't match `glyphInstanceVbo`, the per-instance data is misaligned (BOTH should be in `nodePack.idIndex` order — verify)

## What's NOT yet done (next agent picks up)

1. **`glyph_tint` param doesn't propagate** correctly. The `mth.lightenColor(fc, 0.55)` in `rebuildGlyphInstanceBuffer` uses a hardcoded 0.55, ignoring `local.params.glyph_tint`. Fix: read the param.

2. **Icon overrides via `setIcon` are silently ignored.** The old `rebakeGlyphsForMode` honored `local.iconByType[n.type]` to swap glyph types per node-type. The new GPU pipeline doesn't read it. Fix: in `rebuildGlyphInstanceBuffer`, check `local.iconByType[n.type]` and route to the icon-library's glyph index. Note: the icon-library glyphs aren't in the atlas. Either bake them into a richer atlas (adds ~30 more cells) or treat icon overrides as a deferred V2 feature.

3. **Per-frame alpha refresh is unconditional.** `refreshGlyphAlphas` runs every drawFrame even when nothing animated. Optimization: short-circuit when `nodeStates === nodeTargets` element-wise (a settled-fade check). Adds maybe 1 line; saves a 21KB GPU buffer write at idle.

4. **Atlas is built once at boot at 64px cells.** For Retina (DPR=2) displays it would look sharper at 128px. Trade-off: 4x texture memory. Not urgent; current looks fine.

5. **No support yet for HULLS** — the family-color annular wedges from `AUDIT/forge-hulls-integration-plan-2026-05-20.md` are still queued. Hulls are John's stated "last big piece of the puzzle" and we should ship them next. Plan is clean SVG-overlay approach.

## Three "don't do this" lessons from this batch

1. **Don't defer architectural fixes for ~2hr "small fixes" 5 times in a row.** John was right to call out the deferral pattern. Each workaround compounded — occlusion-zone hack, label-pre-create, fade-aware rebakes, hover-coalesce, glyph culling — five commits the architectural fix made obsolete.

2. **Don't trust your memory of clip-space conventions.** I had z-direction backwards on the first try. Always double-check: WebGPU clip space z is `[0, 1]`, smaller = closer, less-equal = closer-wins.

3. **Don't conflate "fade animation broken" with "rendering broken".** Most of John's "fade is slow / no animation" reports across this session were actually downstream of DOM-thrash, not the fade pipeline itself. The fade pipeline (tickEdgeFades, tickNodeFades, refreshGlyphAlphas) is correct; the slowness was always the DOM tax.

## File map

- `src/js/engine/graph/glyph.js` — SVG vocabulary + atlas rasterizer (`buildAtlas`, `idxForType`)
- `src/js/engine/renderer/webgpu.js` — `GLYPH_SHADER`, glyph pipeline + bindings, `setGlyphAtlas`, glyph draw pass in `drawFrame`
- `src/js/views/forge.js`:
  - Engine boot (~line 668): `glyphmod.buildAtlas(64).then(...)` upload
  - `rebuildGlyphInstanceBuffer` (~line 1135): packs 8-float-per-instance buffer
  - `refreshGlyphAlphas` (~line 1170): per-frame alpha update from nodeStates
  - `drawFrame` (~line 1115): passes `glyphInstances` to renderer
  - `rebuildForMode` (~line 935): calls `rebuildGlyphInstanceBuffer` after node pack
  - DOM glyph no-ops (~line 1130, ~1583, ~2225): `syncGlyphPositions`, `syncGlyphFocus`, `rebakeGlyphsForMode` are kept as no-ops to not break old callers
  - `setParam` glyph routes (~line 2265): glyph_opacity/scale/tint trigger rebuildGlyphInstanceBuffer + drawFrame
- `src/styles/app.css` — `.forge-glyph` + `.forge-glyphs-overlay` rules REMOVED
- This doc — handoff for whoever picks up next

## How to verify with the existing debug API

```js
// In browser console at http://localhost:8742/?view=forge :
await window._forgeDebug.dumpBugState();
// Returns: js.nodeStates / nodeTargets (bucket counts), env.frame (ms),
// js.timeline, js.animRafActive — sufficient to diagnose fade state
// AND verify GPU pipeline is firing without errors.

// Count DOM glyphs (should be 0 always):
document.querySelectorAll('.forge-glyph').length;

// Toggle lock for visual check:
window._forgeDebug.toggleLock('zeus');
```

— opus, Lane B agent, 2026-05-20.
