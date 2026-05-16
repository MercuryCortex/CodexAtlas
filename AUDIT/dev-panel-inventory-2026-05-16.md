# Pantheon-v2 Visual Constants Inventory

**Survey Date:** 2026-05-16  
**Purpose:** Comprehensive audit of all hardcoded numerical constants affecting Pantheon-v2 visual appearance, to populate dev-panel with 20–30 interactive sliders.

---

## Layout Constants

| Constant | File:Line | Current Value | What It Controls | Suggested Range | Group | In v1? |
|----------|-----------|---------------|------------------|-----------------|-------|--------|
| `Rinner` | pantheon-v2.js:210 | 220 | Inner radius of family wedges (layout anchor) | [180, 260] | Layout | No — too risky to adjust; breaks wedge geometry |
| `Router` | pantheon-v2.js:210 | 540 | Outer radius of family wedges | [480, 620] | Layout | No — affects hull padding calculations |
| `GAP` | pantheon-v2.js:189 | 0.105 | Angular gap between wedges (radians, ≈6°) | [0.05, 0.15] | Layout | No — changes wedge spacing; major visual shift |
| `wedgePad` | pantheon-v2.js:215 | 0.05–0.12 of wedge arc | Horizontal padding inside each wedge | [0.02, 0.15] | Layout | No — affects node layout grid |
| `rowCount` logic | pantheon-v2.js:217 | 1–3 rows (N ≤ 4, ≤ 9, > 9) | Concentric rows per family | *read-only* | Layout | No — heuristic; not exposed |

---

## Force-Relaxation Constants (Phase D Bake)

| Constant | File:Line | Current Value | What It Controls | Suggested Range | Group | In v1? |
|----------|-----------|---------------|------------------|-----------------|-------|--------|
| `ANCHOR_K` | pantheon-v2.js:109 | 0.018 | Stiffness of anchor pull to wedge slot | [0.005, 0.050] | Force | **Yes** — weaker = more jitter spread |
| `CHARGE_K` | pantheon-v2.js:110 | -550 | Coulomb repulsion strength (in-wedge only) | [-1000, -200] | Force | **Yes** — stronger = more breathing room |
| `CHARGE_RANGE` | pantheon-v2.js:111 | 180 | Max distance for charge force to act | [80, 280] | Force | No — rarely needs tuning |
| `COLLIDE_PAD` | pantheon-v2.js:112 | 1.5 | Gap between colliding node circles (px) | [0.5, 3.0] | Force | No — affects node overlap tolerance |
| `DAMP` | pantheon-v2.js:113 | 0.55 | Velocity damping (friction) per iteration | [0.30, 0.80] | Force | No — slower = more settling; riskier |
| `RADIAL_PAD` | pantheon-v2.js:114 | 14 | Radial padding inside wedge bounds (px) | [8, 24] | Force | No — prevents edge nodes bleeding out |
| `ANG_PAD_MAX` | pantheon-v2.js:115 | 0.045 | Max angular padding (clamped to ≤22% halfArc) | [0.020, 0.070] | Force | **No — high risk** — edge case padding; unstable |
| Jitter range (x, y) | pantheon-v2.js:104–105 | ±20 px | Initial position randomness (breakssymmetry) | [±10, ±30] | Force | No — deterministic hash-based |
| Relaxation iterations | pantheon-v2.js:435 | 250 | Bake settling passes | [100, 500] | Force | No — higher = slower load, more settling |

---

## Edge Constants

| Constant | File:Line | Current Value | What It Controls | Suggested Range | Group | In v1? |
|----------|-----------|---------------|------------------|-----------------|-------|--------|
| `EDGE_PULL` | pantheon-v2.js:661 | 0.35 | Q-bezier control point pull toward origin (0,0) | [0.10, 0.60] | Edges | **Yes (as edgeCurvature)** |
| Edge stroke-width (CSS) | app.css:1773 | 0.18 | Default edge line thickness (px, non-scaling) | [0.08, 0.50] | Edges | No — ambient baseline |
| Edge stroke color (CSS) | app.css:1772 | `rgba(120,140,182,0.72)` | Default edge color (slate-blue) | *color picker* | Edges | No — quiet ambient; hot color in .edge.hot |
| Edge dim opacity (CSS) | app.css:1778 | 0.02 | Opacity when edge is not incident to hover | [0.005, 0.08] | Edges | No — low visibility for non-neighbors |
| Edge hot opacity (CSS) | app.css:1781 | 0.9 | Opacity when edge is hovered/selected | [0.6, 1.0] | Edges | No — should be bright |
| Edge hot stroke-width (CSS) | app.css:1782 | 1.6 | Line thickness when hot | [0.8, 3.0] | Edges | No — emphasis stroke |

---

## Hull Constants

| Constant | File:Line | Current Value | What It Controls | Suggested Range | Group | In v1? |
|----------|-----------|---------------|------------------|-----------------|-------|--------|
| `HULL_INNER` | pantheon-v2.js:624 | Rinner - 22 (= 198) | Inner radius of hull annulus (px) | Derived; tied to Rinner | Hulls | No |
| `HULL_OUTER` | pantheon-v2.js:625 | Router + 22 (= 562) | Outer radius of hull annulus | Derived; tied to Router | Hulls | No |
| `HULL_PAD` | pantheon-v2.js:626 | 0.014 | Angular padding on each side of wedge (radians) | [0.005, 0.030] | Hulls | No — affects hull geometry slightly |
| `HULL_CR` (corner radius) | pantheon-v2.js:627 | 8 | Rounded-rectangle corner radius (px) | [2, 16] | Hulls | **Yes** — visible smoothness control |
| Hull fill-opacity (CSS var) | app.css:1752 | `--ph2-hull-opacity` (default 0.12) | Translucency of family hull fill | [0.02, 0.40] | Hulls | **Yes (as hullOpacity)** |
| Hull stroke-opacity (CSS var) | app.css:1753 | `--ph2-hull-stroke-opacity` (= hullOpacity × 2.5) | Stroke opacity, derived from fill | Derived | Hulls | No — auto-computed |
| Hull stroke-width (CSS) | app.css:1754 | 0.8 | Border line thickness (non-scaling) | [0.4, 1.8] | Hulls | No — subtle outline |
| Hull dim fill-opacity (CSS) | app.css:1758 | 0.025 | Fill opacity when family not filtered | [0.01, 0.08] | Hulls | No — state-driven |
| Hull dim stroke-opacity (CSS) | app.css:1758 | 0.08 | Stroke opacity when filtered out | [0.02, 0.20] | Hulls | No — state-driven |
| Hull hot fill-opacity (CSS) | app.css:1759 | 0.20 | Fill opacity when family IS filtered | [0.12, 0.40] | Hulls | No — state-driven |
| Hull hot stroke-opacity (CSS) | app.css:1759 | 0.60 | Stroke opacity when active | [0.40, 0.95] | Hulls | No — state-driven |

---

## Tick Constants (Family Rim Ticks)

| Constant | File:Line | Current Value | What It Controls | Suggested Range | Group | In v1? |
|----------|-----------|---------------|------------------|-----------------|-------|--------|
| Tick inner radius | pantheon-v2.js:644 | Router + 6 (= 546) | Start of radial tick line (px from origin) | [Router+2, Router+12] | Labels | No — minor offset |
| Tick outer radius | pantheon-v2.js:646 | Router + 38 (= 578) | End of radial tick line | [Router+30, Router+50] | Labels | No — extends toward rim label |
| Tick stroke-width (CSS) | app.css:1891 | 0.8 | Line thickness (non-scaling) | [0.3, 1.6] | Labels | No — subtle connector |
| Tick stroke-opacity (CSS) | app.css:1892 | 0.45 | Visibility of tick line | [0.15, 0.80] | Labels | **Possible** — control tick visibility |
| Tick dim opacity (CSS) | app.css:1896 | 0.06 | Opacity when family filtered out | [0.02, 0.15] | Labels | No — state-driven |

---

## Label Constants

### Node Labels (deity names above nodes)

| Constant | File:Line | Current Value | What It Controls | Suggested Range | Group | In v1? |
|----------|-----------|---------------|------------------|-----------------|-------|--------|
| `HUB_DEGREE_THRESHOLD` | pantheon-v2.js:447 | 6 | Minimum degree to show as hub label (default) | [3, 12] | Labels | **Yes (as hubThreshold)** |
| Node label font-size (CSS) | app.css:1837 | 10px | Default deity label size | [8, 13] | Labels | **Possible** — readability control |
| Node label hub font-size (CSS) | app.css:1855 | 11px | Hub (major deity) label size | [9, 14] | Labels | **Possible** — emphasis multiplier |
| Node label color (CSS) | app.css:1839 | `var(--text-2)` | Regular label text color (grey) | [inherited] | Labels | No — theme var |
| Node label hub color (CSS) | app.css:1853 | `var(--text-0)` | Hub label color (lighter) | [inherited] | Labels | No — theme var |
| Node label halo (CSS text-shadow) | app.css:1843–1848 | `0 0 2px + 4×cardinal` | Stroke halo around glyphs | *adjust blur/spread* | Labels | **Possible** — halo strength |
| Node label dim opacity (CSS) | app.css:1857 | 0.15 | Opacity when non-neighbor during hover | [0.05, 0.40] | Labels | No — state-driven |
| Label dy (vert offset) | pantheon-v2.js:887 | `7 + √deg × 1.5` | Distance above node (scales with degree) | Coefficient: [1.0, 2.5] | Labels | No — heuristic |
| Label deconflict PAD (CSS) | pantheon-v2.js:947 | 2 | Padding around label bbox for collision detection (px) | [0, 4] | Labels | No — overlap tolerance |

### Family Rim Labels (family names around the ring)

| Constant | File:Line | Current Value | What It Controls | Suggested Range | Group | In v1? |
|----------|-----------|---------------|------------------|-----------------|-------|--------|
| `labelR` | pantheon-v2.js:1130 | Router + 56 (= 596) | Radial distance for family label placement | [Router+40, Router+80] | Labels | No — affects label radius |
| Font size formula (CSS) | pantheon-v2.js:1150 | `8 + arc × 11, clamped [9, 14]` | Scales with wedge width | Coefficients: [6, 16] | Labels | No — formula-based |
| Rim label font-size (CSS) | app.css:1867 | 13px | Base serif label size | [10, 16] | Labels | **Possible** — readability |
| Rim label letter-spacing (CSS) | app.css:1868 | 0.22em | Uppercase letter spacing | [0.10em, 0.35em] | Labels | No — aesthetic choice |
| Rim label color (CSS) | app.css:1871 | `var(--text-2)` | Regular family label color | [inherited] | Labels | No — theme var |
| Rim label bright color (CSS) | app.css:1884 | `var(--text-0)` | Bright family (≥6 members) label color | [inherited] | Labels | No — theme var |
| Rim label opacity (CSS) | app.css:1872 | 0.92 | Default visibility | [0.60, 1.0] | Labels | **Possible** — visibility control |
| Rim label halo (CSS text-shadow) | app.css:1875–1880 | `0 0 2px + 4×cardinal` | Stroke halo | *adjust blur/spread* | Labels | **Possible** — halo strength |

---

## Camera Constants

| Constant | File:Line | Current Value | What It Controls | Suggested Range | Group | In v1? |
|----------|-----------|---------------|------------------|-----------------|-------|--------|
| Camera ratio | pantheon-v2.js:579 | 0.78 | Zoom level (fit diagram to viewport) | [0.50, 1.20] | Camera | **Yes** — controls diagram scale |

---

## Node Sizing Constants

| Constant | File:Line | Current Value | What It Controls | Suggested Range | Group | In v1? |
|----------|-----------|---------------|------------------|-----------------|-------|--------|
| Node radius formula (sigma) | pantheon-v2.js:464 | `5 + √deg × 1.8` | Base + degree-dependent size | Coefficients: [3, 8] + [1.0, 2.5] | Nodes | **Yes (as nodeSizeMult)** — multiplier only |
| Radius for collide | pantheon-v2.js:92 | `9 + √deg × 1.5` | Collision radius (larger than visual) | Coefficients: [6, 12] + [1.0, 2.0] | Nodes | No — physics parameter |

---

## Current Dev Panel (5 controls)

From `src/js/dev-panel.js`:

1. **edgeOpacity** [0, 1, step 0.01] — `--ph2-edge-opacity` CSS var
2. **edgeCurvature** [0, 0.6, step 0.01] — rebuilds SVG edge paths (EDGE_PULL)
3. **nodeSizeMult** [0.5, 2.5, step 0.1] — multiplies node size, triggers sigma refresh
4. **hubThreshold** [1, 20, step 1] — label visibility threshold, triggers sigma refresh
5. **hullOpacity** [0, 0.4, step 0.01] — `--ph2-hull-opacity` CSS var (hull stroke derived)

---

## Recommended Panel Structure (24 controls, organized into 7 sections)

### Section: Edges (5 sliders)
- **Edge opacity** (existing) — `--ph2-edge-opacity` [0, 1]
- **Edge stroke-width** (new) — CSS `.ph2-edge` stroke-width [0.08, 0.50]
- **Edge curvature** (existing) — EDGE_PULL [0, 0.6]
- **Edge hot opacity** (new) — `.ph2-edge.hot` stroke-opacity [0.6, 1.0]
- **Edge hot stroke-width** (new) — `.ph2-edge.hot` stroke-width [0.8, 3.0]

### Section: Nodes (3 sliders)
- **Node size ×** (existing) — nodeSizeMult [0.5, 2.5]
- **Node label font-size** (new) — `.ph2-node-label` font-size [8, 13]
- **Node hub label font-size** (new) — `.ph2-node-label.hub` font-size [9, 14]

### Section: Labels (4 sliders)
- **Label threshold (deg ≥)** (existing) — hubThreshold [1, 20]
- **Rim label font-size** (new) — `.ph2-rim-label` font-size [10, 16]
- **Rim label opacity** (new) — `.ph2-rim-label` opacity [0.60, 1.0]
- **Rim label letter-spacing** (new) — `.ph2-rim-label` letter-spacing [0.10em, 0.35em]

### Section: Hulls (5 sliders)
- **Hull opacity** (existing) — `--ph2-hull-opacity` [0, 0.4]
- **Hull corner radius** (new) — HULL_CR [2, 16]
- **Hull stroke-width** (new) — `.ph2-hull` stroke-width [0.4, 1.8]
- **Hull hot fill-opacity** (new) — `.ph2-hull.hot` fill-opacity [0.12, 0.40]
- **Hull dim fill-opacity** (new) — `.ph2-hull.dim` fill-opacity [0.01, 0.08]

### Section: Force Bake (4 sliders)
- **Anchor stiffness (K)** (new) — ANCHOR_K [0.005, 0.050]
- **Charge repulsion (K)** (new) — CHARGE_K [-1000, -200]
- **Charge range** (new) — CHARGE_RANGE [80, 280]
- **Velocity damping** (new) — DAMP [0.30, 0.80]

### Section: Camera & Layout (2 sliders)
- **Camera zoom ratio** (new) — camera ratio [0.50, 1.20]
- **Wedge angular gap** (new) — GAP [0.05, 0.15]

### Section: UI Refinements (1 slider)
- **Tick line opacity** (new) — `.ph2-rim-tick` stroke-opacity [0.15, 0.80]

---

## Notes on Control Grouping

**High Priority (always expose):**
- Edges: opacity, curvature (already have)
- Nodes: size multiplier (already have)
- Labels: hub threshold (already have)
- Hulls: opacity (already have)

**Medium Priority (add these next):**
- Edge hot state (visual emphasis)
- Hull corner radius (geometry smoothness)
- Force constants (interaction feel)
- Rim label visibility (readability)

**Lower Priority (avoid for now):**
- Rinner, Router — breaks wedge calculations
- GAP — major layout shift
- ANG_PAD_MAX — edge-case instability
- Jitter range — deterministic; not user-controlled
- Collide mechanics — too risky

---

## Summary

**Total Constants Found:** 60+ (layout, force, edge, hull, label, camera, node sizing)  
**Currently Exposed:** 5 controls  
**Recommended Add:** 19 new controls (24 total)  
**Organized Into:** 7 sections with clear visual/interaction purpose  
**Estimated Panel Size:** ~880px height (fits comfortably in right drawer)  

The expansion maintains the existing 5 controls and adds depth in force-simulation tuning, edge/hull visual refinement, and label readability. The grouping mirrors the rendering pipeline so users can understand cause-and-effect.

---

*Generated 2026-05-16 for Codex Atlas dev panel expansion.*
