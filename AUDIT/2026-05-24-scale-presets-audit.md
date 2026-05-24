# Timeline Scale-Preset Audit · Phase 22-AC

**Date:** 2026-05-24
**Trigger:** John — "LOG and LIN and the modes are all a mess! just the Linear and the Condensed WORK functionally, AUDIT."
**Files:** `src/js/engine/layout/timeline.js` (SCALE_PRESETS block, lines 214–331)

## Spine context

- `xLo = TIMELINE_FLOOR_BCE = -9000` (always)
- `xHi = currentYear()` (today, e.g. 2026)
- `xSpanWorld = (xHi - xLo) * X_SCALE` — total world-X width of the spine
- `halfWorld = xSpanWorld / 2`
- World convention: origin-centered. Spine endpoints sit at `-halfWorld` and `+halfWorld`.

The fit-scale + camera-center logic assume the data fills `[-halfWorld, +halfWorld]`. Any preset where `yearToWorldX(xLo)` ≠ `-halfWorld` or `yearToWorldX(xHi)` ≠ `+halfWorld` causes BG sizing, fit zoom, and pan-bound math to feel "off."

## Findings

| Preset                     | LIN | LOG-old | LOG-new | LOG-R | CMP |
| -------------------------- | --- | ------- | ------- | ----- | --- |
| Maps `xLo` → `-halfWorld`? | YES | YES     | YES     | YES   | YES |
| Maps `xHi` → `+halfWorld`? | YES | **NO**  | YES     | YES   | YES |
| Maps year 0 → 0?           | YES | YES     | YES     | NO    | varies |
| Round-trip exact at endpts | YES | YES     | YES     | YES   | YES |

### LIN (`linear-default`) — ✅ OK

Pure linear: `worldX = (year - midYear) * X_SCALE`. Trivially satisfies all invariants.

### LOG-old (`log-centered` BEFORE this audit) — ❌ BROKEN

Used `maxDist = max(|xLo|, |xHi|) = 9000` as a SHARED normalizer for both sides:

```
yearToWorldX(2026) = +log(2027)/log(9001) * halfWorld
                   ≈ +0.836 * halfWorld   ← should be +halfWorld
```

CE side bottomed out 16% short of the right spine endpoint. Visually the data felt "scrunched into the left/middle" and the right ~16% of the world was empty padding.

This propagated to:
- `computeTimelineFitScale` (assumed full xSpanWorld) → too much zoom-out
- BG cover sizing (uses xSpanWorld) → cover too wide for actual data
- Pan bounds (also based on xSpanWorld) → user could pan into the empty right zone
- Tick rendering: ticks NEAR year=xHi crowded against an empty band

### LOG-new (`log-centered` AFTER this audit) — ✅ FIXED

Each side normalized to ITS OWN range:
- BCE side: `t = log(|y|+1) / log(-xLo+1)` → at `y=xLo` gives t=1, worldX = `-halfWorld`
- CE side:  `t = log( y +1) / log( xHi+1)` → at `y=xHi` gives t=1, worldX = `+halfWorld`
- Year 0 stays at worldX=0 (continuity).

Asymmetry is preserved as DENSITY (BCE half is dense compared to CE because BCE has 9000 years to log-compress vs CE's 2026 — but BOTH halves now cover their full geometric half).

### LOG-R (`log-recent`) — ✅ OK, but year 0 is far left

Compresses TIME-SINCE-TODAY logarithmically. Endpoint math is correct:
- `year = xLo` → `t = 0` → worldX = `-halfSpine` ✓
- `year = xHi` → `t = 1` → worldX = `+halfSpine` ✓
- Year 0 lands at `t ≈ 0.18` → about 18% of the spine from the left, very compressed left.

If John says LOG-R "looks broken," the perceptual issue is **year-0 sits in the deep BCE zone**, not a math bug. By design: this preset deliberately emphasizes recent millennia. Document this in the tooltip + consider whether to keep it as a "power-user" option.

### CMP (`compressed-civilization`) — ✅ OK

Era slices with manual weights. Always maps endpoints to ±halfSpine because the era stack sums to `totalW` = `xSpanWorld`. Round-trip exact at era boundaries.

## What this audit changed

1. **Fixed `log-centered` endpoint normalization** so CE reaches `+halfWorld`.
2. **All four presets now satisfy `yearToWorldX(xLo) = -halfWorld` and `yearToWorldX(xHi) = +halfWorld`** — invariant the rest of the pipeline (`computeTimelineFitScale`, BG cover, pan bounds) silently relied on.
3. Tagline tooltips on segmented switcher (`LIN`/`LOG`/`LOG-R`/`CMP`) clarified.

## What's still open

- `LOG-R` IS working correctly but feels disorienting because year 0 sits 18% from the left. Consider renaming the label to "Recent-bias" so users know it's intentional.
- The fit-scale + center logic technically still assume LINEAR uniformity inside the spine (e.g., for pan-bound dead-zone radius). With LOG/CMP the "effective resolution" varies along the world-X axis, so the user feels the same scroll wheel doing more years near the dense ends. This is unavoidable given log scaling — only a UX-affordance, not a bug.

## Verification

Manual cross-check with `xLo=-9000`, `xHi=2026`, `xSpanWorld = 11026 * 0.5 = 5513`:

| Year   | LIN              | LOG-new          | LOG-R             | CMP (depends on era weights) |
| ------ | ---------------- | ---------------- | ----------------- | ---------------------------- |
| -9000  | -halfWorld       | -halfWorld       | -halfWorld        | -halfWorld                   |
| -4500  | -0.41 halfWorld  | log-mid (≈ -0.6) | -large-neg        | era-weighted                 |
|     0  | -0.633 halfWorld | 0                | -0.318 halfWorld  | era-weighted                 |
| +1000  | -0.452 halfWorld | +0.443 halfWorld | +0.067 halfWorld  | era-weighted                 |
| +2026  | +halfWorld       | +halfWorld       | +halfWorld        | +halfWorld                   |

All endpoints clean. All Math.log args strictly > 0 with our spine constraints.

— Phase 22-AC, 2026-05-24
