# Forge hulls integration plan

**Filed:** 2026-05-20
**Filed by:** opus (Lane B agent, prep doc — no code shipped in this audit)
**Trigger:** John, 2026-05-20: *"prepare to add the Hulls section, we should incorporate that, its the last big piece of the puzzle for the charts to have that styled decided"*

This is the implementation plan. Read it before scheduling the build. Once John greenlights the approach, the implementation is one focused Lane B batch (estimated ~2 hours).

## What hulls are

**Family hulls** = translucent annular wedges drawn underneath the node disks, one per family/tradition, colored by the family's signature color. They make the radial-wedge layout legible at a glance — you SEE which sector is Greek, Egyptian, Vedic, Christian, etc. before reading any label. They are the visual scaffolding that turns a constellation of dots into a structured cosmology.

Pantheon V2 has them; Forge currently does not. John's framing of "the last big piece of the puzzle for the charts to have that styled decided" places hulls as the final visual primitive needed to lock the Forge style.

## How Pantheon V2 does it (the reference)

`src/js/views/pantheon-v2.js`, function `annularWedgePath` (line 570). The pattern:

- For each family wedge: compute `(a0, a1)` start/end angles (radians) + `(rIn, rOut)` inner / outer radius
- Generate an SVG `<path>` with rounded annular-wedge geometry (mirrors `d3.arc().cornerRadius()`)
- Insert into a hulls `<g>` group at z-index BELOW the disks (sigma canvas)
- Fill with family color at low alpha (atmospheric)
- Optional: per-family hover / focus state changes opacity / stroke

The geometry is precise enough that hull edges align with the outermost node disks per family — the hull is a "container" the dots sit inside.

Tradition-color mapping is already canonical in the vault (read from `n.family_color` / `n.tradition_color`).

## Forge integration — proposed approach

**Approach: SVG overlay layer between canvas and labels.**

Rejected alternatives:
- **WebGPU shader for hulls** — would unify hulls into the same pipeline as disks, but custom triangulation of annular wedges in WGSL is non-trivial and the visual win is zero (hulls are static, no per-fragment effects needed). Defer.
- **Canvas2D overlay** — would require maintaining a third canvas + manual redraw on camera change. SVG path geometry survives transforms natively. Defer.

The SVG-overlay choice matches Pantheon V2's pattern + keeps the door open for future WebGPU port if needed.

## DOM layer order (z-stack)

Current Forge layer order, bottom → top:
1. WebGPU canvas (disks + edges)
2. `.forge-glyphs-overlay` (z-index 4 — per-disk SVG glyphs)
3. `.forge-labels-overlay` (z-index 5 — label divs)
4. `.forge-bottombar` (z-index 12 — search + scrubber + zoom)

**Insert hulls layer at z-index 1** — between the canvas (auto/2) and the glyph overlay (z-index 4). Hulls paint behind the disks/glyphs but above the bg.

Actually — even better placement: hulls live IN THE CANVAS. The canvas's WebGPU edge shader uses depth z=0.85 for idle edges, z=0.75 for hot. Disks are at z=0.0 / 0.3 / 0.6. Hulls could live at z=0.9 (behind everything in canvas) IF they were rendered in WebGPU. Since we're going SVG, we need them physically below the canvas in DOM — but the WebGPU canvas has its own background that fully covers anything beneath.

**The constraint:** the WebGPU canvas's alphaMode is `premultiplied`, so canvas pixels can be transparent. The transparent regions between disks let DOM elements behind show through.

**Plan:** SVG layer at z-index 1 (below the canvas's effective paint), with `pointer-events: none`. The hull paths show through wherever the canvas is transparent, which is everywhere except where disks + edges paint. Same effective z-layering as Pantheon V2.

## The implementation steps (rough sequence)

### Step 1 — Family-wedge geometry helper

Port (don't copy — port + clean up) Pantheon V2's `annularWedgePath` to a new module `src/js/engine/graph/hull.js`. Pure function:

```js
hull.annularWedgePath(a0, a1, rIn, rOut, cornerRadius, padAngle) → svg path d
```

The radial-wedge layout (`src/js/engine/layout/radial.js`) already computes per-family angular ranges. Surface them: every layout result should now also expose `wedgeBounds: Map<familyId, {a0, a1, rIn, rOut}>`.

### Step 2 — Hull packing function

Mirror `packNodes` / `packEdges`. `packHulls(modeNodes, layout)`:

- For each family with at least one node in the mode: compute the wedge bounds + family color + label string (the family name)
- Return `{paths: [{d, fill, stroke, opacity, family}], familyIndex: Map<familyId, idx>}`

### Step 3 — SVG overlay layer

In `views/forge.js` setup():

```js
const hullsOverlay = document.createElementNS(SVG_NS, 'svg');
hullsOverlay.className = 'forge-hulls-overlay';
stage.appendChild(hullsOverlay);  // before canvas? above? - test
```

CSS:
```css
.forge-hulls-overlay {
  position: absolute; inset: 0;
  pointer-events: none;
  z-index: 1;     /* below canvas paint regions, above bg */
  overflow: visible;
}
.forge-hulls-overlay path {
  transition: opacity 0.15s ease-out;
}
```

### Step 4 — Camera-aware sync

Hulls live in world coordinates but render to screen. Two options:
- **Per-frame transform** — set `<svg viewBox>` based on camera state (cheaper)
- **Per-frame path regeneration** — recompute paths each camera change (more expensive but cleaner)

Recommend: **per-frame viewBox transform**. The hull paths stay constant; only the SVG's `viewBox` changes with camera. ~1 line per drawFrame:

```js
const vp = local.lastSize;
const cam = camera.state;
const worldW = vp.w / cam.scale;
const worldH = vp.h / cam.scale;
hullsOverlay.setAttribute('viewBox',
  `${cam.centerX - worldW/2} ${cam.centerY - worldH/2} ${worldW} ${worldH}`);
```

### Step 5 — Family focus + dim state

When a node is selected, the focused families (anchor + 1-hop neighbors' families) should stay bright; other families' hulls dim to the same level as the dim_amount applied to nodes.

Implementation: each `<path>` element gets `data-family` attribute. On `syncGlyphFocus` (or sister sync fn), iterate hull paths and set opacity per family-in-focus:
- Family fully in focus → opacity 1.0
- Family partially in focus → opacity 0.5
- Family entirely dim → opacity 0.1

### Step 6 — Dev panel params

Add a HULLS section to `dev-panel-forge.js`:
- `hull_opacity_idle` — default 0.12 (faint atmospheric)
- `hull_opacity_focused` — default 0.20
- `hull_opacity_dim` — default 0.04
- `hull_corner_radius` — default 8
- `hull_pad_angle` — default 0.02 (radians, ~1.1°)
- `hull_stroke_opacity` — default 0 (off by default)
- `hull_inner_radius_factor` — default 0.55 (fraction of layout's rOuter)

Per-family color overrides can come later if needed; for now use the data's `family_color` directly.

### Step 7 — Labels on hulls (optional v2)

Pantheon V2 puts a small text label per family at the hull's mid-arc-outer-edge ("Greek", "Egyptian", "Hindu"). Useful for users who don't know color codes yet. Defer to a follow-up (hulls without labels first; labels next).

## Estimated effort

- Step 1-3 (geometry + packer + overlay): ~45 min
- Step 4 (camera sync): ~15 min
- Step 5 (focus/dim state): ~30 min
- Step 6 (dev panel): ~20 min
- Total: ~2 hours, single Lane B batch

## Cross-references

- `src/js/views/pantheon-v2.js` lines 555-610 — reference annular-wedge path generator
- `src/js/views/pantheon-v2.js` lines 1019-1090 — reference SVG overlay layer setup
- `src/js/engine/layout/radial.js` — per-family wedge bounds (already exists, may need to surface)

## Open design question for John

The current Forge wheel has wedges that are visually implied by node clustering but not explicitly bordered. Adding hulls is a SIGNIFICANT visual change — it makes the structure more legible but also more "boxed-in". Recommend shipping with hull opacity defaulted LOW (0.10-0.15) so the hulls are a subtle atmospheric scaffold, not an aggressive frame. John can crank via dev panel.

## What this audit does NOT cover

- Specific color values per family (pulled from data, John has already tuned via Pantheon V2)
- Per-family hover behavior on hull itself (defer)
- Hull labels (defer to v2)
- Animation on hulls (defer — they should be steady)

— opus, Lane B agent, 2026-05-20.
