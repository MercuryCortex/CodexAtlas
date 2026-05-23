# Forge — Timeline Mode Design Spec

**Filed:** 2026-05-23
**Filed by:** opus (lead)
**Status:** SCOPE / GREENLIGHT — design only, no implementation.
**Reads-with:**
- `AUDIT/forge-rebuild-layered-spec-2026-05-20.md` (the 6-phase rebuild that this mode rides on top of).
- `AUDIT/forge-rebuild-1A-node-atom-2026-05-20.md` … `5A-management-*` (per-layer spec locks).
- `00_meta/PROTOCOL.md` §3.1 (21-type edge vocabulary, 5/7 bucket palette).
- `00_meta/CODEX.md` (charter — tier vocabulary, harm-risk axis WIP).
- `00_meta/HOW-WE-WORK.md` (routing — this is a Lane B / NODE-BEHAVIOR-LAYOUT slot claim).

---

## 0. John's brief (verbatim, 2026-05-23)

> *"horizontal timeline view with similar style and efficiency as a horizontal-band chart; will need to handle and manage MORE nodes aggressively because the timeline covers ALL types not just deities; toggled the same way deity-modes are toggled (mode dropdown on the Forge bar)."*

Target N — `~3,000–5,000 nodes`. Vault as of 2026-05-23 generated_at_utc payload reports per-type counts:

```
document:495 · deity:682 · person:1187 · event:309 · theme:497 · tradition:307
symbol:280  · music:108 · alphabet:41 · alchemy:35 · moral:12 · ritual:106
philosophy:9 · math:8  · medicine:8  · place:111 · sacred-site:125 · doctrine:14
practice:11 · relic:11 · substance:3 · divination-system:13 · calendar-system:11
attire:10  · exchange-network:57 · technology:25 · edges:21,400
```

Summed all-types ≈ **4,373 nodes**. The largest single existing mode (`deities`) renders **682**; the timeline mode is asking the engine to render **~6.4× more nodes** at once. This is the central engineering constraint.

This doc translates the brief into a layered build plan modeled on `forge-rebuild-layered-spec-2026-05-20.md`. Each phase = one Lane B slot claim = one commit = one acceptance gate.

---

## 1. Visual specification

### 1.1 Axis system

```
              ┌──────────────────── TIME-AXIS (top) ────────────────────┐
              │  -3000 BCE     -1000     0     500    1500   2025 CE   │
              ├─────────────────────────────────────────────────────────┤
TRADITION ──> │ Egyptian       ●●  ● ●●●●●     ●●                       │
BANDS         │ Vedic-Hindu        ●●●●● ●●●● ●●●●●● ●●●●  ●●           │
(stacked Y)   │ Greek                ●● ●●●●●●●●●●● ●●                  │
              │ Roman                       ●●●●●●●●● ●                 │
              │ Abrahamic                ●● ●●●●●●●●●●●●●●●●●●●●●●●●●  │
              │ Christianity                       ●●●●●●●●●●●●●●●●●●  │
              │ Islam                                  ●●●●●●●●●●●●●●  │
              │ ... 36 family bands ...                                 │
              │ Undated                  ◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌  │ ← parking lane
              └─────────────────────────────────────────────────────────┘
```

- **X-axis:** `date_earliest` (the canonical chronology field used today by the radial wheel's age-stratified packer and by the scrubber). BCE on the left, CE on the right. Zero is the cosmetic mid-marker.
- **Y-axis:** stacked tradition / family bands, one row per `n.family`. Same 36 families the radial wheel uses (see `currentFamilyOrder()` in `forge.js`); same family colors (via `currentColorOverride()`).
- **Time-axis labels at top.** Level-of-detail by camera scale (see §1.4).
- **Within-band Y-jitter** keeps members of the same family from overlapping at dense time-ranges (the same problem the radial wheel solves with VdC + anti-collision; in timeline mode we have a free Y-degree-of-freedom inside the band height).

### 1.2 Band height & overall layout

Total **world height** is the sum of band heights, top-padded for the time-axis ribbon and bottom-padded for the undated parking lane. Each band's height is **proportional to its member count, sqrt-weighted**, matching the radial wheel's wedge-allocation philosophy:

```
bandHeight[fam] = max(MIN_BAND_H, BAND_H_BASE * sqrt(memberCount[fam]))
```

A small family (Hittite, 4 nodes) gets the floor `MIN_BAND_H` (≈ 28 wu) so its dots stay visible; a heavy family (Christianity, ~280 nodes) gets ≈ 80 wu and uses the room for vertical jitter.

**Total world width** = X-axis span. Recommended **world-space convention**: 1 year = 0.5 wu, so a 5000-year span → 2500 wu wide. Total world height for ~36 family bands at average 45 wu each + chrome ≈ 1800 wu tall. Worldextent box is therefore **highly anisotropic** (≈ 2500 × 1800) — see §3.2 for the implications.

### 1.3 Node form: dots vs bars

Two render modes are needed because the vault contains both:
1. **Point-in-time entities** (e.g. `event-council-of-nicaea` at 325 CE, `person-rumi` 1207–1273) — render as DOT at `date_earliest`.
2. **Long-lived entities** (e.g. `language-aramaic` ≈ -1500 to +1500, `tradition-vedic-religion`, the cosmic-scale outliers — note `rishabha-jain` has a YAML bug at date_earliest = -999,999,999 that the scrubber already cosmetic-clamps via `TIMELINE_FLOOR_BCE`) — these need a HORIZONTAL BAR to read honestly.

**Recommendation (Decision D2 in §10):** ship TL-1 with **dot-only** rendering (every node placed at `date_earliest`, with `date_latest` ignored). Then add **bar mode** in Phase TL-5 as a layer on top once dot-mode is locked. Reasons:
- Dot-mode reuses `packNodes()` unchanged.
- Bar-mode needs either a new render pipeline (instanced rounded-rect with two endpoint floats) OR a clever trick where bars are drawn as **wide edges** in the existing curved-edge pipeline (set `curveStrength = 0`, paint same family color, paint at z above edges and below dots). The wide-edge trick has surprising integration cost (state pipeline, bucket palette, hit-test).
- Bar/dot ambiguity creates classification edge-cases (a person who lived 800–873 CE is "short" by big-picture scale but a "long bar" by century-scale).

**Heuristic when bar mode lands (TL-5):** `span = date_latest - date_earliest`. If `span > 500` years → render as bar with rounded caps. Else → dot at midpoint of span. Spans < 50 years just use `date_earliest`.

### 1.4 Time-axis label LOD

Three zoom regimes — drive off the same `computeFitScale()` reading already used by every other zoom threshold (per memory: `feedback_fit_scale_is_sacred.md` — DO NOT modify `computeFitScale`; READ it to compute a local LOD threshold).

| Zoom regime | Tick density | Example labels |
|---|---|---|
| Overview (z ≤ 0.7× fit) | Era ticks | "Bronze Age", "Iron Age", "Classical", "Medieval", "Modern" |
| Mid (0.7×–2.5× fit) | Millennium + century ticks | -2000, -1000, 0, 500, 1000, 1500, 2000 |
| Deep (z > 2.5× fit) | Century + decade ticks | 1850, 1860, 1870… 1900, 1910… |

Era ribbon (deep zoom-out) doubles as a sectioning device: faint vertical separators at `-3000, -1200, -500, 500, 1500` plus subtle labels "Bronze / Iron / Classical / Medieval / Modern". These are **layout sugar** — they paint into a dedicated HTML overlay (like `labelsOverlay`) so the GPU pipeline doesn't grow a new pass. No new shader.

### 1.5 Wires: horizontal arcs

Cross-tradition edges are the headline feature of the atlas — they MUST survive into timeline mode unchanged. The existing curved-edge pipeline in `webgpu.js` paints a cubic-bezier curve pulled toward `(0, 0)` by `curveStrength` per bucket. That centripetal pull is **wheel-specific** — in timeline mode, pulling every edge toward the world origin produces a downward bow that visually competes with the band stratification.

**Recommendation:** in timeline mode, override the curve target. Two minimal-touch options:

- **(A) Vertical-bow override.** Pull edges toward `(midX, midY - bowAmount)` where `midX` is the midpoint X of the edge endpoints and `bowAmount` is ~30% of the |y2-y1| vertical separation. Cross-tradition edges (different bands) bow up; same-band edges (same family) stay nearly-straight. This is the band-chart visual.
- **(B) Symmetric arc.** Pull toward `(midX, min(y1,y2) - arcHeight)` — every arc curves UP from a common baseline. More legible for Sankey-style storytelling but heavier visually.

Both are achievable inside the existing `packEdges` interface by extending `opts` with a `curveTarget: 'origin' | 'vertical-bow' | 'symmetric-arc'` switch. The shader stays untouched if we precompute a **per-instance control point** instead of "pull toward origin scaled by curveStrength" — that requires a 12 → 14 float per-instance change in the GPU layout (see §4.1 for cost analysis).

**Cheaper path:** keep the existing GPU layout (12 floats), continue to pull toward `(0,0)`, but **translate the world so (0,0) sits at the desired curve target** for the timeline mode's chrome rendering. NOT a viable trick — `(0,0)` is shared by all edges in a frame.

**Decision (D3):** ship TL-1 wires using **option A** with a per-instance curve target. Accept the GPU layout migration to 14 floats. Document as a one-time migration in the WIRES spec-lock header.

### 1.6 ASCII mockups at three zoom levels

#### Overview (z ≤ 0.7× fit) — "all of history"

```
┌─────────────────────────────────────────────────────────────────────┐
│   Bronze  │  Iron  │  Classical  │  Medieval  │   Modern             │
│           │        │             │            │                      │
│ Egyptian   ▓▓▓▓▓▓▓░░░                                                │
│ Vedic       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░             │
│ Greek            ▓▓▓▓▓▓▓▓▓▓░░░                                       │
│ Roman                  ▓▓▓▓▓▓▓▓▓▓░                                   │
│ Abrahamic        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░         │
│ Christianity              ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░               │
│ Islam                              ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░                 │
│ (... 30+ bands ...)                                                  │
│ Undated  ◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌◌       │
└─────────────────────────────────────────────────────────────────────┘
                                ↕ glow ribbons = cross-tradition wires
```

Disks are tier-clamped to `node_min_screen_px` (currently 2.5 px) so even 5000 nodes resolve as visible specks. Labels are HIDDEN — too dense.

#### Mid zoom (~1.5× fit) — "Classical antiquity"

```
┌─────────────────────────────────────────────────────────────────────┐
│   -500    -400   -300   -200   -100    0    100    200    300       │
│                                                                     │
│ Greek     ● Thales                                                  │
│           ●●● Pre-socratics                                         │
│            ● Pythagoras  ● Plato  ● Aristotle      ● Plotinus       │
│                                                                     │
│ Roman                              ● Cicero   ●Virgil ●Augustus     │
│                                                                     │
│ Abrahamic         ●Cyrus  ● Ezra   ● Hillel  ●Yeshua-of-Naz...      │
│                                                                     │
│ Christianity                              ● Paul  ● Origen          │
└─────────────────────────────────────────────────────────────────────┘
```

Disks visible; T0-T3 labels showing per `label_idle_max` cap. Wires legible.

#### Deep zoom (~6× fit) — "1st century CE"

```
┌─────────────────────────────────────────────────────────────────────┐
│   0    10    20    30    40    50    60    70    80    90    100   │
│                                                                     │
│ Abrahamic                                                           │
│   ● Hillel                                                          │
│      ● Shammai                                                      │
│        ● Yeshua-of-Nazareth ── paralleled-with ──→                  │
│                              ● Apollonius-of-Tyana                  │
│                                                                     │
│ Christianity                                                        │
│              ● James-the-Just   ● Paul   ● Mark    ● Luke           │
│                          ● Council-of-Jerusalem  ● Council-...      │
└─────────────────────────────────────────────────────────────────────┘
```

Per-node labels visible. Decade-scale ticks. Bar-mode entities (when shipped) render as rounded rectangles between bands' lanes.

---

## 2. Layout function specification

### 2.1 New file: `src/js/engine/layout/timeline.js`

Mirrors the shape of `radial.js`. Exports:

```js
window.AtlasEngineLayout.timelineLayout(modeNodes, familyOrder, opts) → {
  bands:       { [familyName]: { name, y0, y1, yCenter, members, color, height } },
  positions:   Map<nodeId, { x, y }>,
  worldExtent: { x0, y0, x1, y1 },     // anisotropic — see §3.2
  xRange:      { lo, hi },             // year span [lo, hi] in years
  yRange:      { lo, hi },             // band stack [topPx, bottomPx]
  undated:     { ids: [...], y0, y1 }  // parking-lane metadata, present iff opts.parkUndated
}
```

The return is intentionally NOT the same shape as `radialWedgeLayout` — that one returns `wedges + rInner + rOuter`, both meaningless for a band chart. **What MUST be shape-compatible:** the `positions` Map (consumed by `packNodes()`, `packEdges()`, `buildAdjacency()`) and the `worldExtent` (consumed by `camera.fitToExtent()`, `buildHitGrid()`, `setPanBounds()`). Those are the contract. The rest is timeline-specific metadata.

### 2.2 Algorithm

1. **Group nodes by family.** Same `n.family || 'Other'` fallback as radial. Apply `opts.colorOverride` per the Phase 21S contract.
2. **Sort families.** Use the explicit `familyOrder` first (so the user's chosen ordering from view-settings persists across mode-switch — see §6.4), then append unknown families in encounter order.
3. **Partition undated.** `opts.parkUndated` (default `true`). Any node with `date_earliest == null` OR `!isFinite(date_earliest)` OR `date_earliest < -999_000` (the YAML-bug clamp) lands in an `undated[]` lane drawn at the bottom of the world with a visually distinct background tint. Skipping these would lose ~12-18% of the vault to nowhere; rendering them in-band at a fake year would mislead. The parking lane is the correct ontology call.
4. **Derive X range** from the dated set:
   ```
   xLo = min(date_earliest) clamped to TIMELINE_FLOOR_BCE (= -9000)
   xHi = max(date_earliest) clamped to 2025 (HIST_HI, matching scrubber)
   ```
5. **Allocate band heights** sqrt-weighted by family size (see §1.2). Stack bands top-down. Each band gets `y0, y1, yCenter, height`.
6. **Place dots inside each band:**
   - **X:** `world_x = (date_earliest - xLo) * X_SCALE`. (`X_SCALE` ≈ 0.5 wu/yr.)
   - **Y:** the per-band internal Y is the interesting question. See §2.3.
7. **Worldextent:** `{ x0: -PAD, y0: -PAD, x1: xSpan * X_SCALE + PAD, y1: bandStackHeight + undatedHeight + PAD }`.

### 2.3 Within-band Y-packing

The radial wheel does this with VdC + 2D anti-collision relaxation. In timeline mode we have **one free dimension** (Y inside the band) — the X is fixed by chronology. So the packer is one-dimensional anti-collision on Y, applied within each (X-window, band) cell.

Recommended algorithm — **sweep-line rowed packer**:

```
For each band f with N_f members sorted by date_earliest ASC:
  rows = []                                       // each row holds the rightmost-x placed
  For each member m:
    placed = false
    x_m = (m.date_earliest - xLo) * X_SCALE
    For r in rows:
      if x_m - rows[r] >= MIN_X_SPACING:           // 2 * NODE_RADIUS + pad
        rows[r] = x_m + r_visualRadius
        y = band.y0 + ROW_PAD + r * ROW_STEP
        positions.set(m.id, { x: x_m, y })
        placed = true; break
    if not placed:
      rows.push(x_m + r_visualRadius)
      y = band.y0 + ROW_PAD + (rows.length - 1) * ROW_STEP
      positions.set(m.id, { x: x_m, y })
  if rows.length * ROW_STEP > band.height:
      // overflow — see §2.4 below
```

This is O(N · maxRows) per band ≈ O(N · 8) in practice. For 5000 nodes total split across 36 bands, average ~140/band; rowed packer runs in <5 ms. The result is the classic Gantt-style cascade: members at the same date stack vertically; later members fill earlier rows. No need for global relaxation (the Y axis is fully owned by the band; X is fixed by data, never relaxed).

### 2.4 Band overflow policy

When a band's natural row count exceeds the allocated height (e.g. 280 Christian persons cluster around 100–500 CE Patristic period at unprecedented density), the rowed packer overflows. Three policy options:

- **(P1) Compress rows.** Reduce `ROW_STEP` for that band until rows fit. Disks overlap visually but every node renders. **Default for TL-1.**
- **(P2) Stretch band.** Grow `bandHeight[fam]` to fit. Cascades into the global stack — every other band shifts down. Acceptable; needs a single layout pass.
- **(P3) Cluster mode.** Detect overflow and switch the band to per-decade dot-stacks (count-stack), losing per-node hit-test in favor of legibility. Strategic; defer to TL-5.

**Recommendation (Decision D4):** TL-1 ships with **P1 + P2 hybrid** — grow the band up to a `MAX_BAND_H` ceiling (≈ 120 wu), then compress rows within. The visual signal "this band is crammed = high density era" is informative; compression past the ceiling is the correct fallback.

### 2.5 Date-range handling (precursor to bar-mode TL-5)

For TL-1: ignore `date_latest`, place at `date_earliest`. The radial wheel does the same today.

For TL-5: per §1.3 heuristic — `span > 500` → bar; else → dot at `(date_earliest + date_latest) / 2`. Bars need: `(x0, y_band_center, x1, height, color)`. New render path is required (see §4.3).

### 2.6 Deterministic re-layout

Layout function must be **pure** — same `(modeNodes, familyOrder, opts)` in → same `positions` out. The sweep packer's row assignment is order-dependent so the input nodes are pre-sorted by `(family, date_earliest, id)` to lock determinism. (This matters because `local.lockedSet` round-trips through LS — if a node lands at a different Y on reload, the user's lock visually jumps.)

---

## 3. Node-pack reuse

### 3.1 Does `packNodes()` work unchanged?

**Yes, with one caveat.** `packNodes()` reads `(id, family_color, tradition_color)` from each node and pulls `(x, y)` from the `positions` Map plus `tier` from a degree-classifier. None of that depends on layout topology — it's strictly position-driven. Timeline `positions` Map is the same Map shape; `packNodes()` will produce a valid Float32Array with no code changes.

The caveat: the **screen-px clamp** (lines 158-164 in `node.js`) applies `targetScreen = clamp(min, max, screenR)` based on a *single* `camScale`. In a horizontal timeline whose worldextent is roughly 2500 × 1800, the camera's `fitToExtent` will pick a scale that fits the LONGER dimension (X). At that fit-scale, the Y-resolution of the canvas is way smaller than X — so a node radius that reads as 6 px wide also reads as 6 px tall, but vertical neighbor spacing might only be 4 px. Overlap is inevitable at fit-scale.

The clamp doesn't malfunction; it just isn't *aware* that timeline mode has more vertical neighbor pressure. See §3.4 for the recommended treatment.

### 3.2 Anisotropic worldextent

`camera.fitToExtent({x0,y0,x1,y1}, viewportSize)` picks `scale = min(viewportW/worldW, viewportH/worldH)`. For an anisotropic timeline (≈ 2500 × 1800 world ÷ a ~1600 × 900 viewport):
- `viewportW/worldW ≈ 0.64`
- `viewportH/worldH ≈ 0.50` → this wins; fit scale ≈ 0.50.
- Resulting **screen width** of the world ≈ 1250 px. Viewport is 1600 px wide → 350 px of horizontal whitespace on the sides.

This is fine for visual breathing room but means the timeline doesn't fill the screen edge-to-edge at default fit. **Pan bounds (see §5.4)** prevent escape; **default-fit centering** (already done by camera) sits the timeline centered.

**Decision (D5):** accept the centered-with-air visual at fit; offer a "Snap to full-width" gesture (double-click axis ribbon) that overrides fit-Y in favor of fit-X with vertical scroll → see §6 for UI surface.

### 3.3 Tier classification: shared or mode-local?

`buildTierClassifier(nodes, degreeMap)` computes percentile cuts on the degree distribution of the **mode's own nodes**. In deities mode, T0 = top 4% of deities (~27 nodes). In timeline mode where N = 4,373, T0 = top 4% of *all* nodes (~175 nodes). The two are computed off **the same degree map** (degree is dataset-relative — count of edges between renderable nodes) but the **percentile cuts differ**.

The user-visible consequence: a deity that's tier 1 in deities-mode (say `deity-zeus`, ~30 connected deities) might be tier 0 in timeline-mode (compared against the long tail of obscure events that have 1-2 edges each).

**Recommendation (Decision D6):** keep the per-mode classifier — it's already the contract, and the visual "this is a hub in this view" reading is the more useful semantic. The tier-filter UI (T1/T2/T3/T4/T5 toggles, Phase 21AS) continues to filter edges where the **edge's source-tier ∉ activeTiers**. Source-tier is per CODEX §VII (tier of the SOURCE under the edge) — that's a tier-of-the-claim semantic, NOT a node-degree-tier. Both axes are orthogonal. Document the distinction in the spec-lock header.

### 3.4 Min/max screen-px clamp in timeline

At fit-zoom, ~4,373 nodes × ~7 wu radius = ~3.5 px screen radius. Below `node_min_screen_px` (PARAM_DEFAULTS = 2.5 px), the clamp will **widen** disks so they stay legible. But widening to 2.5 px in a band ~50 wu tall = 25 px screen means each band has room for ~20 dots vertically — for a band of 280 members at one dense century, that's **14× row overflow**.

Two options:
- **Lower `node_min_screen_px` for timeline** (e.g. 1.5 px). Acceptable visually at this density — humans read horizontal-band density as "ribbon of dots" not "individual dots". The hit-grid still resolves clicks within ~1 cell.
- **Cap `node_max_screen_px` more aggressively** to prevent any one node ballooning. Useful at deep zoom-in (deities mode has it at 64 px today; timeline should keep around 32 px).

**Recommendation (D7):** TL-1 ships with timeline-mode-specific overrides:
```
timelineNodeOverrides = {
  minScreenPx: 1.5,     // override PARAM_DEFAULTS at fit
  maxScreenPx: 28,      // tighter cap to keep deep-zoom legible
  tierRadii:   [16, 12, 9, 7, 7, 7],  // unchanged
}
```
Stored as `PARAM_DEFAULTS.timeline_node_min_screen_px` etc. — same PARAM_DEFAULTS source of truth. Selected at pack time when `local.mode.id === 'timeline'`.

---

## 4. Edge handling

### 4.1 Per-instance curve target — GPU layout migration

Per §1.5 decision D3: edges in timeline mode bow vertically, not toward `(0,0)`. The clean way to express this is a per-instance control point. Today's edge instance is 12 floats; the migration adds 2 floats for `(ctrlX, ctrlY)`:

```
NEW edge layout (14 floats × 56 bytes):
  [0,1]   sourceX, sourceY
  [2,3]   targetX, targetY
  [4..7]  R, G, B, A
  [8]     idleWidth
  [9]     curveStrength      ← kept for back-compat
  [10]    bucketIndex
  [11]    hotWidth
  [12,13] ctrlX, ctrlY       ← NEW (used by shader instead of `pull-toward-origin`
                                 when curveStrength sign is negative; OR a new flag
                                 in a free bit of bucketIndex. Recommend: reuse
                                 bucketIndex as bucketIndex + 8 to flag "use ctrlXY".)
```

Cost analysis: 21,400 edges × 14 floats × 4 bytes = **1.20 MB** edge VBO (was 1.03 MB). Single ~150 KB upload increase per mode-switch. Not a perf issue.

The WGSL shader needs a one-line change to read the new control point. EDGE_SHADER is short — see `webgpu.js` for the existing bezier midpoint computation. The migration is **the most invasive single change** in this design. It's documented as a one-time event in the WIRES spec-lock header.

**Alternative (cheaper, ships in TL-1):** keep 12-float layout, set the world ORIGIN for timeline mode to `(xRange.center, 0)` so the natural curve-toward-origin pull bows edges toward the time-axis midpoint. Edges between nearby bands stay nearly-flat; edges across the full canvas bow significantly downward. NOT the ideal arc visual but **zero pipeline cost**.

**Recommendation (D8):** ship TL-1 with the cheap origin-translation trick. Migrate to per-instance control points in **TL-4 polish** when the visual debt is felt. Document both options in the WIRES spec-lock header.

### 4.2 Edge culling at deep zoom

Long-span edges (e.g. `deity-osiris` [-2500] paralleled-with `figure-christ` [+30]) span the full canvas width. At deep zoom on either endpoint, the OTHER endpoint is far off-viewport. Two concerns:

- **GPU vertex shader still processes ALL edges every frame.** Today the engine doesn't viewport-cull edges. At 21,400 edges that's fine; at >100k it would matter. Timeline doesn't push past 21,400. **No action needed.**
- **AA pixel-clamp bias.** The shader's `clamp(world_w × scale, wire_min_screen_px, wire_max_screen_px)` widens thin lines for legibility. For full-canvas edges at deep zoom, the line is mostly off-viewport but the rendered segment in-viewport may sit at a single pixel. Clamping to `wire_min_screen_px` (default ~1.0) is correct.

**Decision (D9):** no change. Existing pixel-clamp works in timeline mode.

### 4.3 Tier-filter HIDDEN mechanism

Phase 21AS / 21AU shipped the tier-filter — edges whose source-tier ∉ active tiers get state HIDDEN. The mechanism is pure CPU-side `edgeStates` manipulation in `recomputeFocus`; the shader reads state and discards. **Zero change for timeline mode.**

The tier vocabulary surfaces in:
- Side panel (Phase 21AT — always-on pills + Phase 21AV — reads full vault edges).
- Legend (Phase 21AT).
- Toggle UI (Phase 21AS).

All three are mode-agnostic. They keep working unchanged.

### 4.4 Bar mode wires (TL-5 only)

When bar-mode lands (TL-5), a bar's endpoints aren't single (x,y) points — they're (x0, x1, yCenter). An edge from a dot to a bar needs to land at the bar's centroid OR a smart point on the bar's body. For TL-5: land at `((x0+x1)/2, yCenter)`. Acceptable visual.

---

## 5. Aggressive node management

### 5.1 Hit-grid scaling

`buildHitGrid` (forge.js line ~7485) uses uniform-cell bucketing with `cellSize = 2 * maxRadius`. Query is 3×3 neighborhood = O(neighborhood) ≈ 2-10 candidates regardless of N. **Scales fine** to 5k.

The catch: `maxRadius` is the max world-radius across all nodes. In timeline mode at fit-scale, the min-px clamp will *widen* the smallest tier from r=7 wu to r=~15 wu (so it reads as 1.5 px on screen). Result: `cellSize = 2 * 15 = 30 wu`. Worldextent ≈ 2500 × 1800 wu. Grid = 84 × 60 cells = **5040 buckets**. Average bucket density at 4,373 nodes ≈ 0.9 nodes/bucket. **Optimal.** No change needed.

**Audit anchor — forge.js line 7485 (buildHitGrid):** confirm `maxRadius` is correctly computed from the *clamped* radii. Today it walks `nodePack.data[off+2]` which IS the clamped radius. ✅

### 5.2 Label DOM cap

`label_idle_max` = 750 + `label_cap` × 2 = +240 → **990 pre-created DOM divs** at mode-switch. In deities mode (676 nodes), that pre-creates all 676 + some headroom. In timeline mode (4,373 nodes), pre-create caps at 990 (the `min(N, ...)` clamp). The remaining ~3,383 nodes lazy-create via `ensureLabelEl` on first reveal.

At deep zoom-in to a dense century, the visible-label set could exceed 990 momentarily. `ensureLabelEl` is a single appendChild — invisible cost. Should be fine.

**Concern:** `syncLabels` iterates visible-label set every frame. If the user pans rapidly across a dense century, lazy-create-fire-rate could spike. Mitigate by **idleLabelRaf coalesce** (already exists per Phase 4B FX). **No change needed but ADD an audit step in TL-3 to measure label-create rate during pan-stress test.**

**Audit anchor — forge.js lines 2555-2578 (pre-create loop) and 3123-3155 (ensureLabelEl):** verify lazy-create doesn't allocate during steady-state frames; only during reveal transitions. ✅ already correct architecture.

### 5.3 GPU instance buffers at 5k nodes

```
Nodes:  5000 × 8 floats × 4 bytes  = 160 KB    (was 21 KB at 676)
Edges:  21400 × 12 floats × 4 bytes = 1.03 MB  (unchanged)
States: 5000 × 2 floats × 4 bytes  = 40 KB     (was 5 KB)
Glyphs: 5000 × 8 floats × 4 bytes  = 160 KB    (was 21 KB)
Total per-frame upload (steady-state): 0 KB (instances dirty-flagged, states only)
States dirty per frame:                40 KB (constant, no batch upload)
Pack-time upload (mode-switch):        ~1.4 MB
```

All fine. WebGPU comfortably handles 100k+ instances of this layout. No GPU-side concern.

### 5.4 Pan bounds + zoom floor

`applyZoomFloor()` (called after every `rebuildForMode`) reads `local.mode.worldExtent` and sets pan bounds. The current implementation is wheel-aware — it tightens at zoom-floor and widens at fit. The math assumes square-ish worldextent. For an anisotropic timeline:
- **Zoom-floor:** keep at fit-scale or slightly tighter; don't allow pan beyond half-viewport past either time-axis edge.
- **Zoom-ceiling:** generous — users want to zoom into a single year. Today's max-zoom is fine.

**Audit anchor — forge.js applyZoomFloor:** test at TL-3 with timeline worldextent. Likely needs a one-line tweak to use `Math.min(scaleX, scaleY)` instead of assuming worldextent is square. **Add to TL-3 acceptance checklist.**

### 5.5 Edge state buffers + tickEdgeFades

`tickEdgeFades` walks the full edge state array each frame. At 21,400 edges, that's a ~85 KB walk every rAF tick. Already tight; profile post-TL-3 to confirm no surprise. **No code change pre-implementation.**

### 5.6 `recomputeFocus` cost

On hover/click, `recomputeFocus` rebuilds `focusedSet` by walking adjacency for the hover/lock nodes, then writes new targets to `nodeTargets` and `edgeTargets`. At 5k nodes + 21k edges, the targets write is ~100 KB. Hover rate at 120 Hz × 100 KB = 12 MB/s memory writes. Fine. The CPU walk is bounded by edge count + adjacency lookup — already O(degree-of-hovered-node) per Phase 1B.

**Concern:** the `applyTimelineHiddenOverride` path (Phase 11) walks every node and reads `nodesById.get(id)` to check date range. At 5k nodes, that's 5k Map.get() per recompute. Acceptable but on the edge. **Audit anchor — forge.js applyTimelineHiddenOverride:** consider hoisting `nodesById` walk to a precomputed "nodes hidden by current scrubber range" Set rebuilt only on scrubber drag-end. Adds to TL-3 polish list.

### 5.7 Search index

`buildSearchIndex()` runs once per mode-switch. For 5k nodes vs 676, it's ~7× the work — still <10 ms one-shot at boot. **Fine.**

### 5.8 Specific forge.js audit points (collected)

| Line | Concern | TL-phase to verify |
|---|---|---|
| 7485 (buildHitGrid) | maxRadius from clamped pack — already correct | TL-1 verification only |
| 2555-2578 (label pre-create) | min(N, cap) clamp protects timeline | TL-3 stress test |
| applyZoomFloor | square-worldextent assumption | TL-3 verify + likely patch |
| applyTimelineHiddenOverride | per-recompute Map walk | TL-4 polish if profile flags |
| recomputeFocus | adjacency-bound, scales OK | TL-3 profile only |
| tickEdgeFades | linear in edges; 21k acceptable | TL-3 profile only |
| edgeInstancesDirty flag | already in place per Phase 3B F3 | TL-1 verify only |
| nodeInstancesDirty flag | already in place per Phase 1B N2 | TL-1 verify only |
| `_fxBelowFifteen` hit-test gate | hides nodes < 15% gizmo zoom; timeline at fit-scale ≈ 50% which is well above. ✅ | TL-2 confirm |

---

## 6. UI integration — mode dropdown as sibling-mode picker

### 6.1 Today's state

`wireModeDropdown()` (forge.js ~line 4739) renders a popup at the FORGE-pill click target. Items are the 30 entries from `modemod.MODES`. Each item is `{ value, label, glyph, nodeType }`. Click → `rebuildForMode(value)`. LS-persisted via `forge-runtime-v1.mode`.

### 6.2 Recommended: two-level dropdown, NOT flat 31-item

The flat list already has 30 entries. Adding "Timeline" as a 31st makes the dropdown taller and conflates "deities (filter by node type)" with "timeline (different layout)". They're **orthogonal concerns**. The fix is to introduce two ordering primitives:

```
FORGE | Timeline                        ←  the button label

Click opens:
┌─────────────────────────────┐
│ LAYOUT                      │   ←  primary mode group
│   ◉ Wheel                   │
│   ☐ Timeline                │
│ ────────                    │
│ NODES (within layout)       │   ←  filter group (existing 30 items)
│   ●  Deities                │
│   ✎  Authors                │
│   ⊙  Traditions             │
│   ...                       │
│   ⊙  All types              │  ← NEW item: render all 4,373 nodes
└─────────────────────────────┘
```

The vocabulary becomes orthogonal: **LAYOUT** (wheel | timeline) × **NODES** (one of 30 filters | all-types). Combinations:
- Wheel × Deities → today's default.
- Wheel × Authors → today's authors-wheel.
- Timeline × Deities → 682-dot horizontal timeline.
- Timeline × All-types → the 4,373-dot timeline (the headline new view).

This requires:
1. `modemod` gains a `LAYOUTS = [{value:'wheel',label:'Wheel'}, {value:'timeline',label:'Timeline'}]` table.
2. `local.mode.layoutId` ← new field, default `'wheel'`.
3. `local.mode.id` ← retained as the existing filter (`deities`, `traditions`, etc.) PLUS one new entry `all-types` that has `nodeType: null` and a special-cased `filterNodesByMode` branch returning every node.
4. The dropdown UI becomes the two-group menu shown above.
5. `rebuildForMode(modeId, opts)` signature extends to `rebuildForMode({ layoutId, modeId }, opts)` — see §6.3.

### 6.3 `rebuildForMode` signature evolution

Cleanest path: keep the existing `rebuildForMode(modeId, opts)` signature for back-compat. Add a `opts.layoutId` field. Internally:

```js
function rebuildForMode(modeId, opts) {
  const layoutId = (opts && opts.layoutId)
                 || (local.mode && local.mode.layoutId)
                 || 'wheel';
  ...
  const lay = (layoutId === 'timeline')
    ? layout.timelineLayout(modeNodes, currentFamilyOrder(), { ... })
    : layout.radialWedgeLayout(modeNodes, currentFamilyOrder(), { ... });
  ...
  local.mode = {
    id: modeId,
    layoutId,             // ← NEW
    nodes: modeNodes,
    edges: modeEdges,
    positions: lay.positions,
    ...
    worldExtent: lay.worldExtent || /* derive from rOuter for wheel */ ext,
    // wheel-only fields (hullData, etc.) skipped or zeroed in timeline mode
  };
}
```

The wheel-specific `local.mode.hullData` (Phase 20) is unused in timeline mode — `rebuildHullElements()` is a no-op when `layoutId !== 'wheel'`. Same for divider computations.

### 6.4 LS persistence

`saveRuntimeState()` already writes `{ mode, timeline, lockedSet, uxMode }`. Extend with `layoutId`:

```js
state = {
  layoutId:  local.mode.layoutId,        // ← NEW
  mode:      local.mode.id,
  timeline:  { in, out, center },
  lockedSet: [...],
  uxMode:    { colorMode, orderMode, distributionMode, timelineDistribution? },
}
```

Hydrate at mount: if `savedRuntime.layoutId === 'timeline' && modemod.isValidLayout(savedRuntime.layoutId)` → pass to first `rebuildForMode`.

The schema version key (`forge-runtime-v1`) bumps to `v2` IF the hydration must be lossless. Safer: keep `v1` and treat absent `layoutId` as `'wheel'` (back-compat default).

### 6.5 Tier toggles, color themes, family orders — preserved

Tier toggles (`forge.viewSettings.v6`), FX params (`forge.fxParams.v4`), style params (`forge.styleParams.v1`) are mode-agnostic and orthogonal to layout. **No change.** Cross-checking:

- **Tier toggles** apply to edge state in `recomputeFocus` — pure CPU, layout-agnostic. ✅
- **Color themes** override `family_color` per node — read in `packNodes`, layout-agnostic. ✅
- **Family orders** drive band stacking in timeline (replaces wedge ordering in wheel). Same `currentFamilyOrder()` source. ✅
- **Distribution radios** (Organic/Age-bands/Vogel) — wheel-only. Hidden when `layoutId === 'timeline'`. The timeline gets its OWN distribution radios (see §7).

### 6.6 Side-panel + legend — unchanged

Per Phase 21AV, the side panel reads `window.VAULT_DATA.edges` directly, not `local.mode.edges`. So the side panel surfaces ALL of a node's edges regardless of layout. **No change.** Same for the tier vocabulary pills, legend, custom tooltip.

---

## 7. Timeline-specific distribution patterns

The wheel has `Organic / Age-bands / Vogel sunflower` distribution radios. Timeline has its own family of distribution choices. **Recommendation: ship TL-1 with two; queue two more for TL-5.**

### Ship in TL-1:

#### (T-1) **Strict** — pure time-on-X + family-on-Y
- X = `(date_earliest - xLo) * X_SCALE`.
- Y = sweep-line rowed packer within band (§2.3).
- **Default.** The canonical "horizontal-band chart" John described.

#### (T-2) **Era-band** — mega-era column dividers
- Same X/Y as Strict, but the world has explicit **vertical divider lines** at era boundaries (Bronze | Iron | Classical | Medieval | Modern, plus user-tunable sub-eras like Pre-Socratic, Hellenistic, Late-Antique).
- Era labels paint into the same `labelsOverlay` HTML layer as time-axis ticks.
- Useful as a teaching/orienting view.

### Queue for TL-5:

#### (T-3) **Decade-bucket** — quantize X, count-stack vertically
- X quantized to nearest decade (snap to multiples of 10 years).
- Multiple members of the same band landing in the same decade stack vertically within the band height.
- Visual signal: dense decades become tall stacks. Empty decades become gaps.
- Sacrifices precise-date readability; gains density-as-signal.

#### (T-4) **Fan-radial** — hybrid timeline + radial
- X = chronology, Y = polar angle relative to a Bronze-Age anchor point.
- Oldest members fan out from bottom-left, newest crowd top-right.
- Visual experiment — high gimmick risk, defer.

**Decision (D10):** ship T-1 + T-2 in TL-1. T-3 + T-4 in TL-5 if user demand surfaces. LS-persist user's choice under `uxMode.timelineDistribution`.

---

## 8. Layered build plan

Strictly sequential. Each phase = one Lane B slot claim = one commit = one acceptance gate.

### Phase TL-0 — SCOPE + greenlight

**This document.** John reviews §10 decision checklist, vetoes or approves item-by-item. No code touched.

- **SHIP:** this document, committed under `AUDIT/`.
- **VERIFY:** John reads §10 and responds to each numbered item.
- **FOLLOW:** TL-1 starts after John's greenlight.

### Phase TL-1 — LAYOUT

**Mandate:** implement `timelineLayout()` standalone in `src/js/engine/layout/timeline.js` as a pure function. Validate at three scenarios: 200 / 1000 / 3000 / 4373 nodes.

**Sub-audit (Phase TL-1A — read-only goblin):** scan how `radialWedgeLayout` is called from `rebuildForMode` (forge.js line 2281). Surface every assumption the caller makes about the return shape (`rOuter`, `wedges`, `positions`). Output: `AUDIT/forge-timeline-1A-layout-audit-<date>.md`.

**Implementation (TL-1B):**

1. Create `src/js/engine/layout/timeline.js` — pure function `timelineLayout(modeNodes, familyOrder, opts) → { bands, positions, worldExtent, xRange, yRange, undated }`.
2. Implement sweep-line rowed Y-packer per §2.3.
3. Implement undated parking lane per §2.3 step 3.
4. Implement band sqrt-weighted heights per §1.2.
5. NO integration with forge.js yet — exported, tested via a standalone harness (`_forgeDebug.runTimelineLayout(N)` returns positions Map).
6. Visual harness: simple `<canvas>` 2D scatter that draws the returned positions in family colors. Confirm the layout looks like §1.6 mockups at three N scales.

**Acceptance for TL-1:**
- `timelineLayout(deities)` (682 nodes) renders 36 bands, dots in correct chronological order on X.
- `timelineLayout(all-types)` (4,373 nodes) renders without overflow beyond the visual ceiling for any band.
- Layout time < 50 ms at 4,373 nodes (measure via `performance.now`).
- Positions Map is the same shape `packNodes()` expects (verified by passing through unchanged `packNodes(modeNodes, lay.positions, degree, opts)` and checking the returned Float32Array).
- Undated nodes render in the parking lane.
- Deterministic: two consecutive calls with the same input produce byte-identical position Maps.

**Risk:** medium — first true test of anisotropic worldextent through the camera/pan bounds. If `fitToExtent` produces unexpected scale, TL-1 ships the layout function but flags the integration risk for TL-2.

### Phase TL-2 — MODE-SWITCH

**Mandate:** wire `rebuildForMode` for layout-id-aware dispatch + extend the FORGE dropdown UI per §6.2.

**Sub-audit (TL-2A):** behaviors-only goblin. Walk every `rebuildForMode` call site (today there are ~6 in forge.js) and confirm they all pass through the new layout-id pathway without breaking. Output: `AUDIT/forge-timeline-2A-mode-switch-audit-<date>.md`.

**Implementation (TL-2B):**

1. Extend `modemod` (`src/js/engine/graph/mode.js`):
   - Add `LAYOUTS = [{value:'wheel',label:'Wheel'}, {value:'timeline',label:'Timeline'}]`.
   - Add `isValidLayout(id)`.
   - Add `'all-types'` entry to MODES (nodeType: null), and special-case in `filterNodesByMode`.
2. Extend `rebuildForMode(modeId, opts)` (forge.js ~line 2255):
   - Read `opts.layoutId` or fall back to `local.mode.layoutId` or `'wheel'`.
   - Dispatch to `timelineLayout` or `radialWedgeLayout`.
   - Store `layoutId` on `local.mode`.
   - Skip `rebuildHullElements()` when `layoutId !== 'wheel'`.
3. Extend `wireModeDropdown()` (forge.js ~line 4739):
   - Two-group dropdown per §6.2.
   - On selection: pass `{ layoutId, modeId }` to `rebuildForMode`.
4. Extend `saveRuntimeState` / hydration to write/read `layoutId`.
5. Confirm `preserveLocks` (Phase 21S) flows through both layouts (locks should survive a Wheel↔Timeline switch when the same `modeId` is selected and node ids remain valid).

**Acceptance for TL-2:**
- Dropdown shows the two-group layout per §6.2.
- Wheel ↔ Timeline switch at the same modeId completes in <80 ms.
- Locks preserved on layout switch (e.g. lock `deity-zeus` in Wheel × Deities, switch to Timeline × Deities, Zeus stays highlighted).
- Tier-filter state preserved across switch.
- Color theme + family order preserved across switch.
- LS round-trip: load Timeline × All-types, reload, comes back in same state.
- Side panel still works (tier vocabulary pills, custom tooltip, all from Phase 21AV).

**Risk:** medium — the two-group dropdown UX needs care (today's single-list dropdown has muscle memory).

### Phase TL-3 — AGGRESSIVE-CULL

**Mandate:** verify hit-grid + label cap + edge cull at 4,373 nodes. Profile and fix any regression.

**Sub-audit (TL-3A):** management-only goblin. Stress-test scenarios:
- Steady-state idle at 4,373 nodes: FPS, frame time, GPU bandwidth.
- Hover-stress at 120 Hz pointer rate.
- Rapid pan across dense centuries (4th-cent CE Patristic, 12th-cent Scholastic).
- Mode-switch from Timeline × All-types to Wheel × Deities and back.

Output: `AUDIT/forge-timeline-3A-cull-audit-<date>.md`.

**Implementation (TL-3B):**

1. Audit + fix any spec-lock violations from TL-3A. Specific anchors per §5.8:
   - `applyZoomFloor` square-worldextent assumption → likely patch to `Math.min(scaleX, scaleY)`.
   - Pan-bounds need timeline-aware tightening.
   - `applyTimelineHiddenOverride` profile under timeline mode (scrubber drag stress).
2. Add `PARAM_DEFAULTS.timeline_node_min_screen_px` and `_max_screen_px` (per §3.4).
3. Confirm label DOM cap behaves at 4,373 — lazy-create rate should stay under 20/sec during pan-stress.
4. Add `_forgeDebug.profileTimeline()` — captures all the above metrics in one diagnostic call.

**Acceptance for TL-3:**
- 4,373-node timeline: FPS ≥ 60 steady-state on macOS dev hardware.
- Frame time < 5 ms steady-state.
- Mode-switch wheel ↔ timeline < 80 ms.
- Hover at 120 Hz pointer rate stays smooth (rAF budget green).
- Pan-stress: no GC pauses > 50 ms.
- Memory: GPU buffer growth ≤ 2 MB beyond wheel-mode baseline.

**Risk:** medium-high — this is where surprises surface. Phase plan reserves time for one round of patching + re-verification.

### Phase TL-4 — POLISH

**Mandate:** time-axis labels, era ribbons, hover-card adaptations, optional per-instance edge control point.

**Sub-audit (TL-4A):** FX-only goblin. Walk the time-axis label rendering, the side-panel date display, the tooltip in timeline mode. Output: `AUDIT/forge-timeline-4A-polish-audit-<date>.md`.

**Implementation (TL-4B):**

1. **Time-axis ticks** — paint into a new HTML overlay layer (`timelineAxisOverlay`) above the canvas. Era labels at overview zoom, decade labels at deep zoom. Drives off `computeFitScale()` ratio.
2. **Era ribbon** — faint vertical dividers + small labels at -3000, -1200, -500, 500, 1500. CSS-only; no shader.
3. **Hover card** (Phase 17 anchor-once positioning) — confirm it still works above timeline mode. Date readout already handles ranges per line 5816 (`fmtYear(e) + ' – ' + fmtYear(l)`). ✅
4. **Side-panel** — confirm the "neighbors by tier" sections (Phase 21AV) read fine for non-deity types. They should — section is type-agnostic by design.
5. **(Optional) Per-instance edge control point** — execute the 12 → 14 float migration per §4.1 D3 if visual debt from the cheap origin trick is felt. **Decision deferred to inside TL-4 based on John's eye.**

**Acceptance for TL-4:**
- Era ribbon legible at overview zoom.
- Decade ticks legible at deep zoom.
- Time-axis labels don't compete visually with band labels.
- No regression in hover card, side panel, tooltip.

**Risk:** low — pure polish; visual iteration.

### Phase TL-5 — BAR-MODE (deferred)

**Mandate:** long-lived nodes render as horizontal bars instead of dots.

**Only runs if** TL-4 ships clean AND John confirms bar-mode is a priority (vs. other vault work).

**Implementation outline:**

1. New per-instance bar pipeline OR repurpose curved-edge pipeline with `curveStrength=0` (per §1.3 analysis).
2. Heuristic per §2.5: `span > 500` → bar. Span 50-500 → midpoint dot. Span < 50 → `date_earliest` dot.
3. Edge endpoints from/to a bar land at `((x0+x1)/2, yCenter)`.
4. Distribution radio T-3 (Decade-bucket) + T-4 (Fan-radial) if user demand surfaces.

**Acceptance for TL-5:** bar entities (Aramaic, Vedic-religion, etc.) render as legible bars. Dot/bar boundary at 500-yr span is visually clean.

**Risk:** medium — new render pipeline OR pipeline-repurpose. Both have surprises.

### Phase TL-6 — TAIL POLISH (autonomous)

Consume remaining backlog: any flagged audit items from TL-1A through TL-5A that didn't make their phase's commit. Each ships as a small atomic commit. Stops when backlog empties.

---

## 9. Acceptance gates (cumulative — what's true at the end)

After TL-0 → TL-4 ship in sequence (TL-5 + TL-6 optional):

- **Layout primitive locked.** `timelineLayout()` is a single pure function with a documented return shape. Spec-lock header in `src/js/engine/layout/timeline.js`.
- **Mode-switch atomic.** Wheel ↔ Timeline preserves all orthogonal state (locks, tier toggles, color theme, family order, scrubber position) per §6.4.
- **4,373-node benchmark passes.** FPS ≥ 60, frame time < 5 ms, mode-switch < 80 ms.
- **Tier-filter mechanism (Phase 21AS/AU/AV) unchanged.** Same edge-state HIDDEN path. Verified in TL-2.
- **Side panel works without modification** per Phase 21AV's reading of `window.VAULT_DATA.edges`. Verified in TL-2.
- **Boot clean, zero console errors** at every (layout × mode) combo. Specifically check: Wheel×All-types, Timeline×Deities, Timeline×Authors, Timeline×All-types.
- **LS persistence round-trips.** Mode + layout + timeline + locks + uxMode survive reload at v1 schema (with `layoutId` defaulting to `wheel` for absent legacy keys).
- **Spec-lock headers updated:**
  - NODE atom header (line 70 of forge.js) — note that `local.mode.layoutId` exists.
  - WIRES header (line 183) — document the GPU layout migration if TL-4 ships the 14-float edge.
  - MANAGEMENT header (line 372) — extend the rebuildForMode ORDER block with the layout-dispatch line.

### Measurement methodology

| Metric | How to measure |
|---|---|
| FPS | Existing `_forgeDebug.stats()` (Phase 1B-introduced) — 1-second rolling average |
| Frame time | `performance.now()` deltas across drawFrame; capture p50/p95/p99 |
| Mode-switch wall time | Wrap `rebuildForMode` in `performance.now()` before/after |
| GPU bandwidth | DevTools Performance recording; eyeball the GPU process row |
| Memory growth | DevTools Memory snapshot before/after mode-switch; diff |
| Hit-grid query | Add `_forgeDebug.profileHitTest()` that fires 1000 random world-coord lookups |
| Label create rate | Counter incremented in `ensureLabelEl`; sampled per second |

---

## 10. Decision checklist for John

Greenlight/veto each. TL-1 does not start until **D1 + D2 + D5 + D8 + D10 + D14** are answered (the hard fork-points). Others can be deferred to inside-phase decisions.

1. **D1 — Target N for TL-1.** Confirm ~4,373 nodes (the full vault, all types). Alternatives: cap at 3,000 (drop people-mode tail); aim higher (project growth to 6,000 by mid-2026).
   - Recommendation: **4,373 — the whole vault as the headline visual.**

2. **D2 — Dot-only for TL-1; bar-mode for TL-5.** Recommended. Alternative: ship bar-mode in TL-1 (riskier, slower TL-1 ship).
   - Recommendation: **dot-only TL-1.**

3. **D3 — Edge curve target: per-instance vs origin-translation trick.** Per §4.1 D8.
   - Recommendation: **origin-translation trick in TL-1, optional migration to per-instance control point in TL-4 if visual debt is felt.**

4. **D4 — Band overflow policy P1+P2 hybrid (grow up to ceiling, then compress).** Per §2.4.
   - Recommendation: **P1+P2. Defer P3 (cluster mode) to TL-5.**

5. **D5 — Anisotropic worldextent: centered with horizontal air vs auto-snap to fill-width.** Per §3.2.
   - Recommendation: **centered at fit by default; offer "snap-fill" gesture (double-click axis ribbon).**

6. **D6 — Tier classifier per-mode (degree-based, mode-relative).** Per §3.3. Already how it works; just confirming.
   - Recommendation: **keep as-is.** Document distinction from CODEX §VII source-tier.

7. **D7 — Timeline-specific `node_min_screen_px` (1.5 px) + `node_max_screen_px` (28 px) overrides.** Per §3.4.
   - Recommendation: **adopt; store in PARAM_DEFAULTS as `timeline_node_*`.**

8. **D8 — Curve mechanism in TL-1: cheap origin-translation, accept visual debt.** Same as D3.
   - Recommendation: **yes.** See D3.

9. **D9 — Undated nodes: parking lane (default) vs skip vs render at xLo edge.** Per §2.2 step 3.
   - Recommendation: **parking lane.** Skipping loses ~12-18% of vault; rendering at xLo edge misleads.

10. **D10 — Distribution radios for TL-1: Strict (T-1) + Era-band (T-2).** Per §7.
    - Recommendation: **ship both.**

11. **D11 — Two-group dropdown UX per §6.2.** Adds `LAYOUT` section above existing `NODES`.
    - Recommendation: **adopt.** Alternative: flat 31-item list (worse).

12. **D12 — `all-types` mode entry.** New entry in `modemod.MODES` that returns every node.
    - Recommendation: **adopt.** Required to render the 4,373-node timeline.

13. **D13 — Apply Phase 21AS tier-filter to timeline mode unchanged.** Per §4.3.
    - Recommendation: **yes — zero code change needed.**

14. **D14 — LS schema bump: stay at `v1` with `layoutId` defaulting to `wheel`** OR bump to `v2`.
    - Recommendation: **stay at v1.** Back-compat default is clean.

15. **D15 — Family-band ordering: reuse `currentFamilyOrder()` as-is** (today's wheel family-order picker drives timeline band order too).
    - Recommendation: **adopt.** Orthogonal concern; same source of truth.

---

## 11. Risk register (flagged for the build)

| Risk | Severity | Phase exposed | Mitigation |
|---|---|---|---|
| **Anisotropic worldextent breaks `applyZoomFloor`** | medium | TL-3 | Pre-emptively audit; likely one-line `Math.min(scaleX, scaleY)` patch |
| **Pan-bounds compute square-aware; needs tightening for timeline** | medium | TL-3 | Audit in TL-3A; patch in TL-3B |
| **Label DOM cap (~990) may thrash at 4,373** | low | TL-3 | Measure lazy-create rate during pan-stress; raise cap if needed |
| **Edge curve trick (origin translation) bows ALL edges, not just cross-band** | medium | TL-2 visual | If felt, escalate to per-instance ctrl point in TL-4 (12→14 float migration) |
| **`packedAtScale` invariant** breaks if `fitToExtent` for anisotropic extent emits onChange while local.mode is still mid-swap | medium | TL-2 | Already mitigated by Phase 5B M-F1 synchronous `local.packedAtScale =` write; verify holds for timeline |
| **`applyTimelineHiddenOverride` cost** at 4,373 × Map.get per recompute | low | TL-3 | Profile; consider precomputed hidden-set |
| **Lock-preservation across layout switch** if node id IS still valid but its layout-position is wildly different (e.g. Wheel→Timeline) | low | TL-2 | Acceptable — locks survive, the visual repositioning is expected |
| **Dropdown UX regression** — users familiar with flat 30-item list need to learn two-group | low | TL-2 | Visual chrome makes grouping clear; A/B if needed |
| **GPU buffer mid-frame race** during a mode-switch — already covered by Phase 2B B2 (hover cancellation BEFORE swap) and Phase 5B M-F1 (atomic swap). | low | TL-2 | Verify the existing cancellation paths cover the new layout dispatch |
| **TL-5 bar-mode rendering pipeline cost** if implemented as new pass vs repurpose | medium | TL-5 only | Defer; not on TL-1 critical path |

---

## 12. What we DON'T do during this build

- **Don't change `computeFitScale`.** Per memory `feedback_fit_scale_is_sacred.md`. If timeline needs a different fit, define a new `computeTimelineFitScale` used by ONE caller.
- **Don't modify the dev-panel surface.** Per Phase 0 of the layered rebuild — there is no dev panel; PARAM_DEFAULTS is the single source.
- **Don't introduce a new shader pass** in TL-1. All visual chrome (axis ticks, era ribbon) lives in DOM overlays.
- **Don't touch Lane A vault content.** Pure code change. No node creation, no edge changes.
- **Don't restructure the side panel.** Phase 21AV is the contract; timeline mode rides it unchanged.
- **Don't migrate the 12 → 14 float edge layout in TL-1.** That's TL-4 polish, conditional on visual debt.
- **Don't pre-bake or ship imagery changes.** Per memory `feedback_release_offline_and_snapshots.md`. Imagery baking is RELEASE-time only.
- **Don't ship bar-mode in TL-1.** That's TL-5.
- **Don't optimize speculatively.** Measure in TL-3; patch only what profiles flag.

---

## 13. Estimated budget

| Phase | Sub-audit | Implementation | Verification |
|---|---|---|---|
| TL-0 | — (this doc) | — | John's reads + decision response |
| TL-1 | 1 goblin ~5 min | 3–5 h | 1 h |
| TL-2 | 1 goblin ~5 min | 3–4 h | 1 h |
| TL-3 | 1 goblin ~15 min (stress test) | 2–4 h | 1 h |
| TL-4 | 1 goblin ~5 min | 2–4 h | 30 min |
| TL-5 (optional) | 1 goblin ~5 min | 4–6 h | 1 h |
| TL-6 | — | autonomous, runs to backlog exhaustion | — |

**Total focused Lane B for TL-0 → TL-4:** ~14–20 hours. TL-5 adds ~5–7 h if greenlit.

Each phase commits atomically. If acceptance fails, iterate within the phase — do NOT cascade unfinished work into the next phase.

---

— Timeline mode design spec, 2026-05-23. Awaits John's §10 greenlight before TL-1 begins.
