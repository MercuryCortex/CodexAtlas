# Forge chart bugs — diagnosis (2026-06-03)

John reported three live chart behaviors. I diagnosed all three precisely but
**reverted my fix attempts** (commits `11e88590` + revert `bfee2dcc`) because
I could not verify them in the headless preview and one fix sat in a code path
that is **dead on mount**. The chart is back to its pristine working state.
This doc records the root causes so the fix can be done correctly — ideally
iterating in **Safari** (the project's truth), where the bugs actually repro.

Key files: `src/js/views/forge.js` (the live defs; `_bundle.js` is just carved
aux modules — no rebundle needed for these functions).

---

## BUG 1 — reload zoom = "100%", not fit-view (CONFIRMED root cause)

**What John sees:** on reload the wheel opens at gizmo **100%**, with the
family-name labels at the rim (VEDIC, HERMETIC, WESTERN-ESOTERIC…) **clipping**
against the viewport edge. He wants it to open at "fit view".

**Root cause:** gizmo 100% = `computeFitScale()` (forge.js:3653) = the *pure
geometric* fit where the wheel exactly fills the viewport — which clips the
labels that sit OUTSIDE the rim. The codebase already has the right target:
`computeNiceFitScale()` (forge.js:3698) subtracts a **140px label-band** per
side (gizmo reads ~85%) — and the **zoom-gizmo CLICK already flies to it**
(title: "click to reset to fit"). So "fit view" = computeNiceFitScale; the
initial/reload fit should target it, not computeFitScale. *Do NOT modify
computeFitScale* (sacred — see AUDIT/forge-zoom-world-system-2026-05-21.md).

**Why my fix failed — the real complication:** I added the nice-fit in
`rebuildForMode`'s fit-block (after `camera.fitToExtent`, ~forge.js:3175). A
debug flag proved that block is **SKIPPED on mount**: at the initial
`rebuildForMode(local.mode.id)` call (forge.js:~2321) `local.lastSize = {0,0}`
(`guardPass:false, layoutId:"wheel"`), so the `if (local.lastSize.w &&
local.lastSize.h)` guard fails and neither fitToExtent nor my code runs. The
**actual on-mount fit happens via a different, later path** (resizeAndFit
bailed at mount with rect<8; the eventual fit/size-set was not fully traced).
**The fix must live in whatever path does the real on-mount fit** — trace it:
add a temp flag in `resizeAndFit` (forge.js:3745) `initial` branch and in any
deferred re-fit, find which one actually frames the wheel, and apply the
nice-fit there (set `camera.scale = computeNiceFitScale()` keeping center).

---

## BUG 2 — zoom resets to 100% on style/colour change (CONFIRMED, fix likely correct)

**Root cause:** style/colour/family-order changes go through `applyUxMode()`
(forge.js:5811) → `rebuildForMode(id, {preserveZoom:true})`. rebuildForMode
saves `savedCamState` (forge.js:2563) and calls `fitToExtent` (resets to fit),
but the **restore** `camera.set(savedCamState)` only runs inside the
`if (local.layoutId === 'timeline')` branch (forge.js:3191-3194). The **wheel/
scripture view has no restore**, so it snaps to fit.

**Fix (probably correct, unlike Bug 1):** add a non-timeline restore right
after the timeline block: `if (local.layoutId !== 'timeline' && preserveZoom &&
savedCamState) camera.set(savedCamState);`. On a style/colour change (unlike
mount) `lastSize` IS set, so the fit-block runs and this restore executes.
I bundled this with the dead Bug-1 code and reverted both; this half should be
re-applied on its own and verified in Safari. CAVEAT: a relayout test showed a
gizmo-% drift (preserves absolute scale; relative % shifts if fitScale changed)
— may be fine, John's feel decides.

---

## BUG 3 — hulls disappear in scripture/lenses until pan/zoom (PLAUSIBLE, unverified)

**Observation:** in the deities atlas the hulls (coloured family wedges) render
fine on load. The bug is specific to **scripture/lenses** views, which I could
NOT switch to in the headless preview, so this is unverified.

**Candidate root cause:** `rebuildHullElements()` (forge.js:4326) recreates the
hull `<path>`s EMPTY (no `d`); geometry is filled by `syncHulls()` (forge.js:
4428) which is called from the per-frame `drawFrame()` (forge.js:4031). That
draw loop is **camera-idle-skipped**, and `syncHulls` itself has a camera-idle
cache (forge.js:4435-4443). So after a static rebuild (no camera change), the
emptied hulls may never get geometry until interaction.

**Fix candidate:** at the end of `rebuildHullElements()`, (a) invalidate the
idle cache (`local._hullsIdleData = null`) and (b) force one synchronous
`syncHulls()`. NOTE: must run AFTER `local.lastSize` is valid (same mount-timing
trap as Bug 1) or it early-returns at `if (!vp.w || !vp.h) return`. Verify in
the actual scripture/lenses view in Safari.

---

## Method note (why headless verification failed)

The Claude-preview (Chromium) cannot reliably drive this WebGPU+SVG chart:
simulated wheel events never reached the zoom handler, the gizmo text only
updates on a (idle-skipped) drawFrame so it reads stale, the `.forge-hull-poly`
paths are template elements (the visible hulls are the wedge backgrounds), and
the preview server kept dying between calls. Per memory `feedback_safari_is_
the_truth` + `feedback_describe_what_human_sees`, these fixes need iteration in
John's Safari with the screenshot as the success criterion.
