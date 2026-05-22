# Forge — Zoom, World-Units & Backdrop Architecture

**Phase 21J–K consolidation • 2026-05-21**

This document is the reference for any future agent touching the Forge view's coordinate system, zoom behaviour, panning, or backdrop image / video. It also applies — with adaptations — to any other graph-style view we build on the same engine (different charts, different BGs, different scales).

If you're about to add a new chart, swap the BG, redesign the zoom UI, or change the camera limits — **read this first.** It will save you from re-deriving the math five times like Phases 20F → 21K did.

---

## 1. The canonical metric: **world units (wu)**

The engine has exactly one fixed metric: **world units**, defined inside `src/js/engine/layout/radial.js`:

```
R_INNER       = 220 wu   (inner rim of the wheel — innermost deities sit here)
R_OUTER       = 540 wu   (outer rim of the wheel)
WORLD_PAD     =  24 wu   (extra margin around the wheel for the camera)
WORLD_EXTENT  = ±(R_OUTER + WORLD_PAD) = ±564 wu  (camera fit-target)
```

So the **wheel is 1128 wu wide**, the same on a phone and on a billboard. The world coordinates never change. Every pie slice, every deity dot, every divider line is positioned in wu.

> **For new charts:** declare your own `R_OUTER` / `R_INNER` / `WORLD_PAD` constants. Pick numbers that read naturally for your layout. The CAMERA + BG behaviour described below cares about `WORLD_EXTENT` (the span the camera fits to), not the specific numbers.

---

## 2. The camera: **px/wu**

`camera.state.scale` is the conversion factor: **screen pixels per world unit**. Nothing else.

* `scale = 1.0` → 1 wu = 1 px (small wheel on big monitor)
* `scale = 2.0` → 1 wu = 2 px (zoomed in)
* `scale = 0.5` → 1 wu = 0.5 px (zoomed out)

The camera's engine-level bounds (in `src/js/engine/camera.js`):

```js
const MIN_SCALE = 0.05;   // absolute floor — module-wide
const MAX_SCALE = 30;     // absolute ceiling
```

These are the hardware limits. View-layer policies can tighten them via `camera.setScaleBounds(lo, hi)` (added 2026-05-21 in Phase 21J). All internal scale writes in `camera.js` route through `clampScale(s)` which respects the per-instance bounds — so every path (setScale, set, zoomAt, nudgeZoomTarget, fitToExtent, flyTo, animation tick) honours the same wall.

> **Critical: NEVER add a new scale-mutator to camera.js without routing it through `clampScale()`.** If you bypass it, view-layer floors can be drilled through and you'll re-introduce the Phase 21I drift bug.

---

## 3. `fit_scale`: viewport-dependent reference point

For UI purposes (the gizmo % display, BG opacity ramps, label fade ramps, etc.) we need a relative "zoomed-out vs zoomed-in" concept. That reference is `fit_scale`:

```js
fit_scale = min(viewport.w / world_extent, viewport.h / world_extent)
         = the camera.scale at which the world JUST FITS the viewport
```

* On phone (400×800): `fit_scale ≈ 400/1128 = 0.35` — 1 wu = 0.35 px when wheel fills screen.
* On laptop (1920×1080): `fit_scale ≈ 1080/1128 = 0.96`.
* On house-sized (5000×3000): `fit_scale ≈ 3000/1128 = 2.66`.

`fit_scale` depends on viewport. Same monitor, same fit. Resize, fit changes.

> **Important:** `fit_scale` is bound by the **smaller** viewport axis (`min(...)`). On a 16:9 monitor (wider than tall), fit is height-bound. This matters for BG sizing — see §5.

The forge view's `computeFitScale()` (in `src/js/views/forge.js`) returns this value live.

---

## 4. The "gizmo %" UI label

The zoom-gizmo button at the bottom-bar displays:

```
displayPct = round((camera.state.scale / fit_scale) × 100)
```

So:

* `gizmo 100%` = `camera.scale = fit_scale` (wheel just fits viewport)
* `gizmo 200%` = `camera.scale = 2 × fit_scale` (zoomed in)
* `gizmo 10%`  = `camera.scale = 0.10 × fit_scale` (zoomed out, current view floor)

**Gizmo % is a label, not a metric.** It re-defines "0%" / "100%" relative to viewport. It's NOT the canonical zoom anchor — that role belongs to world units + `camera.scale`.

When you see `0.10`, `0.25`, `0.50` constants in the view code (BG opacity ramps, label fade, etc.) — those are **gizmo-percentage thresholds**, applied via `zoomPct = camera.state.scale / fit_scale`, not raw `camera.state.scale`.

> **Critical:** if you compare against raw `camera.state.scale`, you've baked an absolute zoom level into the code, which means the threshold is at a different gizmo % on every screen size. Always use `zoomPct = camera.state.scale / fit_scale` when reasoning about UI zoom thresholds. (See Phases 20F → 20I for the multi-iteration debugging that landed on this rule.)

---

## 4.5. `nice_fit` — the click-to-fit UX preset (Phase 21AA, 2026-05-22)

The family-name labels sit OUTSIDE the wheel rim (`LABEL_OUTSIDE_PAD = 44 px` + label text up to ~80 px on either side). At pure `fit_scale`, the wheel's outer rim touches the smaller viewport axis exactly — so the wider labels (`Pre-Islamic-Arabian`, `Modern-Esoteric`) crop at the viewport edge.

The fix is a SEPARATE preset, **not** a redefinition of `fit_scale`:

```js
function computeNiceFitScale() {
  const LABEL_BAND_PX = 140;                    // outside-pad + half label text + breathing
  const effectiveW    = vp.w - 2 * LABEL_BAND_PX;
  const effectiveH    = vp.h - 2 * LABEL_BAND_PX;
  return Math.min(effectiveW / world_w, effectiveH / world_h);
}
```

`nice_fit < fit_scale`. The ratio is viewport-dependent — typically ~0.80–0.90 on common monitors.

**`nice_fit` is used by EXACTLY ONE caller: the zoom-gizmo's click handler.** It feeds `camera.flyTo({ ..., scale: niceFit })`. Everything else (gizmo % readout, zoom floor at 11% of fit, BG opacity ramp, label fade, pan-bound collapse) continues to read `fit_scale` unchanged. After the click, the gizmo displays roughly **85%** (i.e. `niceFit / fit_scale × 100`) — that's intended: "you're at a comfortable viewing zoom, not the math-max fit."

> **HISTORICAL LESSON (Phases 21Y, 21Z — both reverted, 2026-05-22):**
> The first two attempts modified `computeFitScale` itself to be label-aware. The cascade was catastrophic:
> - 11% floor moved from `0.11 × pure_fit ≈ 0.105` to `0.11 × nice_fit ≈ 0.078`
> - Wheel diameter at the floor shrank from ~120 px to ~88 px
> - BG video kept its `max(world-scaled, viewport×1.5)` floor → wheel disappeared inside a viewport-filling nebula
> - The gizmo % displayed 100% at the click position because the click target AND the denominator were both the new value — leaving the user no way to read the system state honestly
>
> **NEVER add a label-band buffer (or any UX preset) into `computeFitScale`.** Define a new function. Use it from one place. Don't cascade.

---

## 5. Backdrop image (BG) — anchored in world units

The BG image is a world object, same as the wheel. It has a declared world size in `src/js/views/forge.js`:

```js
const BG_WORLD_WIDTH = 18000;  // wu — about 16× the wheel's 1128 wu extent
                                // (current value; may be tuned for ultrawide monitors)
```

The image is positioned at world `(0, 0)` (the wheel's centre) and rendered at:

```
widthPx  = BG_WORLD_WIDTH × camera.state.scale
heightPx = widthPx / imageAspect
```

This makes the BG behave exactly like every other world object — pan moves it with the wheel, zoom scales it with the wheel, no special-case math. The only JS code per frame is the transform write.

### Cover-fit on every aspect ratio

There's a subtle gotcha. `BG_pixel_size_at_floor = BG_WORLD_WIDTH × fit_scale × 0.10`. Because `fit_scale` is bound by the **smaller** viewport axis, the BG pixel size at the camera floor is proportional to the smaller axis. For wide monitors (16:9, 21:9, 32:9), the larger axis is longer than the BG's pixel width — gaps appear at the floor.

Two sizing strategies, max()'d together (see `syncBackgroundImage()`):

* **Rule A — world-scaled:** `BG_WORLD_WIDTH × camera.scale`. Behaves as a world object.
* **Rule B — viewport floor:** `max(window.innerWidth, window.innerHeight) × 1.5`. Always at least 1.5× the larger viewport axis, regardless of aspect.

The MAX of the two wins. Rule B engages on ultrawide monitors at the camera floor where Rule A would leave gaps.

> **For new BG images:** the BG must extend visibly into all four corners at the camera floor. If you increase `BG_WORLD_WIDTH`, Rule A becomes more dominant; if you shrink it, Rule B takes over more often. Tune `BG_WORLD_WIDTH` so Rule A wins on common aspect ratios (16:9) — Rule B is the safety net for outliers.

### Opacity ramp

`syncBackgroundImage()` computes `zoomPct = camera.scale / fit_scale` then:

* `zoomPct ≥ 0.50` → opacity 0 (wheel is the focus, BG invisible)
* `zoomPct ≤ 0.10` → opacity 1 (BG fully visible, we're zoomed all the way out)
* between → linear interpolation

These are **gizmo-relative thresholds**. They mean the same UX on every screen.

### Positioning

```js
centerCanvas = camera.worldToScreen(0, 0, viewport)   // wheel centre in canvas-coords
canvasOffset = canvas.getBoundingClientRect()         // canvas top-left in viewport-coords
centerVp     = (canvasOffset + centerCanvas)          // wheel centre in viewport-coords
dx, dy       = centerVp - (window centre)             // offset from window centre
```

CSS:

```css
.forge-bg-image {
  position: fixed;
  top: 50%; left: 50%;
  transform-origin: 50% 50%;
  z-index: 0;
  /* width, height, transform set by JS */
}
```

JS each tick writes:

```js
bgImage.style.width  = widthPx + 'px';
bgImage.style.height = heightPx + 'px';
bgImage.style.transform = 'translate(-50%, -50%) translate(<dx>px, <dy>px)';
bgImage.style.opacity = opacity;
```

`translate(-50%, -50%)` shifts the IMG's top-left from `(50vw, 50vh)` to its own centre at `(50vw, 50vh)`. Additional `translate(dx, dy)` moves the centre to wherever world (0, 0) projects in viewport coords. `transform-origin: 50% 50%` keeps any future `scale()` we add growing from the centre.

> **CRITICAL:** the BG element must be appended at `document.body` root (not inside `.forge-stage`) and the stage's CSS background must be transparent for view-forge (see `body.view-forge main.canvas / .forge-pane / .forge-stage` rules). Otherwise the stage's gradient paints over the BG. See Phase 21B for the history.

---

## 6. Replacing the BG image (or upgrading to video)

### Recommended image specs

* **Aspect ratio:** match the layout's natural aspect for least cropping. Currently `BG A02` is 4:3 (2668 × 2000). 16:9 backdrops work too — the cover-fit rule handles the mismatch.
* **Resolution:** the image is rendered at `BG_WORLD_WIDTH × camera.scale` pixels. At `gizmo 100%` (fit) on a 4K monitor that's around `18000 × 1.4 ≈ 25000` px wide. We never SEE that resolution (the BG is invisible at gizmo > 50%), but if you zoom-out from gizmo 100% to gizmo 10%, the visible window of the image goes from 25k-wide rendering down to ~5000 px. **Source the image at 4000–5000 px on the larger axis.** Anything larger is wasted; anything smaller may pixelate at the floor.
* **Content composition:** the image's NATURAL DARK CORNERS (if any) will be the corners of the viewport at floor zoom. If you want bright content reaching the screen corners, design the image with bright content reaching its own corners. (Phase 20F was misdiagnosed for hours because we assumed the image's dark corners were "gaps" — they were the image.)
* **Format:** JPEG (file size). For the nebula-style content with no hard edges, q=85 looks identical to q=95 and saves bandwidth.

### Replacing image with VIDEO

Yes, you can. Same DOM element type changes from `<img>` to `<video>`. CSS already supports object-fit on `<video>`. JS sizing math is identical. Set `<video autoplay muted loop playsinline>`.

* **Codec:** H.264 baseline profile (max compatibility). For smaller file: H.265/HEVC or WebM/VP9. AV1 if you want the smallest file but want users on Safari 16+ / Chrome 70+ only.
* **Resolution:** **3840 × 2160 (4K)** for desktop / large viewports. The BG is invisible at gizmo > 50%, so you mostly see it zoomed-out — peak per-pixel rendering is around `viewport × 1.5`, not 4K. But 4K source gives you headroom for ultra-wide monitors.
* **Frame rate:** **24 fps** for slow nebula drift. 30 fps if there's discernible movement. **Don't ship 60 fps for a backdrop** — wasted bytes, no perceptible benefit.
* **Duration:** **loop length 8–15 s.** Long enough that the loop point is hard to notice; short enough to keep file size sane. Crossfade the loop seam with `ffmpeg -filter_complex` to avoid the visible "jump-cut" most CSS-looped videos suffer from.
* **Bitrate:** **3–6 Mbps** at 4K 24fps with H.264. **1.5–3 Mbps** with H.265 / VP9. Higher rates are wasted for noise-textured nebula content.
* **File size budget:** target **8–25 MB** total. The video is a one-time download, cached by the browser.
* **Audio:** **strip it.** `<video muted>` will still ship audio tracks if they exist in the file. `ffmpeg -an` removes them.
* **Aspect ratio:** prefer **2:1 or 16:9** so it covers both landscape and portrait viewports with minimal cropping. Avoid 1:1 (lots of cropping on landscape) and 21:9 (cropping on portrait).

Sample ffmpeg command for a 4K H.264 backdrop:

```
ffmpeg -i source.mov \
  -vf "scale=3840:2160,fps=24" \
  -c:v libx264 -profile:v baseline -level 4.1 \
  -b:v 4500k -maxrate 6000k -bufsize 9000k \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -an \
  bg-nebula.mp4
```

---

## 7. Pan bounds = zoom-linked

The Forge view enforces a "no pan when zoomed-out" rule. `applyZoomFloor()` in `src/js/views/forge.js`:

```
t = (camera.scale - floor) / (fit - floor)        ∈ [0, 1]
x0 = (worldExtent.x0 - maxMargin) × t
y0 = (worldExtent.y0 - maxMargin) × t
x1 = (worldExtent.x1 + maxMargin) × t
y1 = (worldExtent.y1 + maxMargin) × t
camera.setPanBounds(x0, y0, x1, y1)
```

* At `t = 0` (floor): bounds = `(0, 0, 0, 0)` — single point at world origin → **no pan possible**.
* At `t = 1` (fit): bounds = full worldExtent ± half-span margin → **full pan freedom**.
* Between: linear interpolation.

`applyZoomFloor()` is called from `camera.onChange` (so bounds track current scale), `rebuildForMode` (when worldExtent gets set), and `resizeAndFit` (when viewport size changes the fit_scale).

The `setScaleBounds(floor)` call inside `applyZoomFloor` is what enforces the hard zoom-floor wall — it's a hard limit IN THE CAMERA MODULE itself, not a reactive snap-back. Previous attempts (Phase 20K, 21I) tried reactive clamping in `camera.onChange` and produced visible drift / catch-up because animations had already accepted below-floor targets.

> **For new charts with different limits:** call `camera.setScaleBounds(yourFloor, yourCeiling)` from your view-mount. The same drift issue will bite you if you reactive-clamp.

---

## 8. Hull / label fade

In `syncHulls()`:

```
lowZoomFade  = 1.0 at gizmo ≥ 50%; 0 at gizmo ≤ 25%; linear between
deepZoomFade = 1.0 at scale ≤ 2.0; 0 at scale ≥ 3.0; linear between  (engine-absolute, not gizmo)
overlayFade  = min(lowZoomFade, deepZoomFade)
```

The hull overlay (pie slices + dividers + family labels) fades out when zoomed too far in OR too far out. The labels share the same fade — they're inside the same overlay element now.

> **deep-zoom fade uses absolute camera.scale**, not gizmo %. This is a deliberate exception: deep-zoom is about absolute pixel density per world unit, not about a relative-to-fit ratio.

---

## 9. Quick reference table

| Concept | Lives in | Value(s) |
|---|---|---|
| Wheel radial extent | `radial.js` | `R_OUTER = 540`, `R_INNER = 220` wu |
| Camera fit padding | `forge.js` | `WORLD_PAD = 24` wu |
| Engine scale clamps | `camera.js` | `MIN_SCALE = 0.05`, `MAX_SCALE = 30` |
| View-level zoom floor | `forge.js` `applyZoomFloor()` | `fit_scale × 0.10` |
| BG world size | `forge.js` | `BG_WORLD_WIDTH = 18000` wu |
| BG opacity full | gizmo % | `≤ 0.10` (= 10%) |
| BG opacity gone | gizmo % | `≥ 0.50` (= 50%) |
| Hull-overlay fade window | gizmo % | `0.50` (start) → `0.25` (gone) |
| Deep-zoom hull fade | absolute scale | `2.0` (start) → `3.0` (gone) |
| 6-tier label thresholds | absolute scale | `0.10, 1.20, 1.65, 2.00, 2.50, 3.50` |

---

## 10. Patterns for future agents

* **Always reason in world units when laying things out.** Pixels change with viewport; world units don't.
* **Always reason in `zoomPct = scale / fit_scale` when designing UI thresholds.** Bare `scale` values give you different UX on different screens.
* **Always route new scale mutators through `clampScale()`** (in `camera.js`). Don't add a method that writes to `state.scale` without it.
* **Pan bounds are zoom-linked.** If you add a new view, decide whether your bounds tighten at the floor (use `applyZoomFloor` pattern) or stay constant.
* **Backdrop assets** belong at `_assets/bg/*`. Declare their world size with a single constant; let CSS handle position via fixed + transform; let JS update transform per camera tick.
* **The BG element must be a body-root child**, not inside the stage. Stage backgrounds will paint over it otherwise.

This system was assembled across Phases 20F through 21K (May 2026). The phase commits document every wrong turn — read them if a behaviour seems weird.

---

*— Forge engine, 2026-05-21*
