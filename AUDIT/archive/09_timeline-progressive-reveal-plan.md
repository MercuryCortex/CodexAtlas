# Timeline Progressive Reveal — Planning Document

_Design produced 2026-05-14 by the Plan-agent in response to the user's "ITS TOO CLUTTERED" complaint. Implementation-only plan; awaiting user sign-off before edits land in `src/js/app.js`._

## 0. TL;DR

Replace the **global degree-tier** label gate (currently 4 hard thresholds keyed on `currentK`) with a **per-bucket, density-aware** gate keyed on **local `pixelsPerYear`**. Dots stay generous; labels become the scarce resource. The collision-resolution second pass is preserved; it just receives fewer candidates and so has less work to do. Zoom presets feed the gate a `K`-per-bucket budget directly. Implementation is a surgical ~30-line swap inside `drawEvents` (lines ~1857–1903 of `src/js/app.js`) plus ~25 new lines of helper code. No CSS changes are strictly required, but one optional new class (`.tl-dot-hidden`) would let low-importance dots fade smoothly at extreme zoom-out if we decide they need to.

---

## 1. The model — what we're computing

For each datable node `n` in the current viewport, we want a single decision:

```
revealLevel(n, viewport) -> { showDot: bool, showLabel: bool, dotSize: px }
```

Then `drawEvents` toggles `.tl-hidden` on the label (existing fade), optionally `.tl-dot-hidden` on the shape (new fade), and `dotSize` is fed to `shapePath` exactly as today.

### 1.1 Inputs

- **`pixelsPerYear(realYear)` — LOCAL.** The current `currentK` is a *global* zoom factor (`fullRange / visibleRange` in *compressed* space). It does not tell us how dense a given segment of real years is on screen, because the compressor squashes empty centuries. The new logic needs a function that, given a real year, returns how many screen pixels one real year occupies *at that year*. This is computed by sampling the compressor:

  ```
  pxPerYear(yr) = ( x(compressor.compress(yr + 0.5)) - x(compressor.compress(yr - 0.5)) )
  ```

  Cached once per redraw at uniform real-year samples — see §2.2 for the cached form.

- **`importance(node)` — a single scalar.** Today's proxy is `DEGREE.get(node.id)`. Proposed enriched form:

  ```
  importance(n) =
        log2(1 + DEGREE.get(n.id))            // base: graph centrality
      + statusBonus(n.status)                  // metadata vs stub vs empty
      + typeBonus(n.type)                      // events read coarser; persons read fine
      + phaseBoost(n.phase)                    // optional, see §10 open question
      + selectionBonus(n.id)                   // selected/locked → +infinity
  ```

  Specifics:
  - `statusBonus`: `metadata` = +1.0, `stub` = +0.0, missing = -0.5
  - `typeBonus`: `event` = +0.6 (events anchor era memory; user wants them readable), `document` = +0.3, `person` = 0
  - `phaseBoost`: optional — gives sparse-phase nodes a relative lift so prehistory isn't shut out at "all" zoom. See open question Q3.
  - `selectionBonus`: `+Infinity` if `n.id === STATE.selected` or `STATE.lockedSet.has(n.id)`. Selected/locked nodes ALWAYS show label regardless of bucket budget. See §8 edge case and Q2.

- **`localDensity(yr, window)`** — count of datable nodes within `[yr - window/2, yr + window/2]` of real years. Used (a) to know how aggressive bucketing needs to be in a given region, (b) for diagnostic logging. The bucket logic in §2 implicitly handles density; explicit `localDensity` is only needed for the dot-thinning rule in §5.

- **`activePreset`** — `'10y' | '50y' | '100y' | '500y' | '2000y' | 'all' | 'free'`. Tracked as a new module-local variable; updated whenever a preset button is clicked, and set back to `'free'` by wheel-zoom / drag-pan / brush. Feeds the K-table in §9 either as a HARD cap or a HINT — recommendation: HINT (see §4).

### 1.2 Outputs

- `showDot`: nearly always `true`. Only false in pathological cases (>300 visible nodes AND low importance AND in a hyper-dense cluster). See §5.
- `showLabel`: gated by the per-bucket K-quota. Selected/locked override.
- `dotSize`: same as today's `dotR`, but slightly modulated by importance — see §5 for the gentle exponent.

---

## 2. The reveal curve — when do things appear

### 2.1 The core idea — per-region bucket quotas

Instead of asking *"is this node in the global top-X% by degree?"* we ask *"is this node in the local top-K of its horizontal bucket?"*

Divide the visible main-chart width into `M = ceil((W - margin.left - margin.right) / BUCKET_PX)` horizontal buckets, with `BUCKET_PX = 220` (≈ average label width budget). Each bucket gets a label-quota `K`, sourced from the K-table in §9. Inside each bucket, take the top-K nodes by `importance(n)` and mark THOSE for `showLabel = true`. All other labels in that bucket are gated off.

This directly fixes the global-tier complaint:
- **Roman Empire bucket at "all" zoom**: 60 datable nodes compete for 2 label slots → only Augustus, Constantine survive. Aggressive filtering, as required.
- **Prehistory bucket at "all" zoom**: 2 datable nodes compete for 2 label slots → both survive. Lenient filtering, also as required.

Density-awareness is intrinsic — denser buckets self-prune.

### 2.2 Pseudocode

```js
// Computed once per redraw, after `x` is set and before drawEvents paints.
function buildBuckets(viewport) {
  const { x, xFull, compressor, W, margin, placed, activePreset } = viewport;

  // 1. Bucket count + pixel boundaries.
  const chartLeft = margin.left;
  const chartRight = W - margin.right;
  const BUCKET_PX = 220;
  const M = Math.max(1, Math.ceil((chartRight - chartLeft) / BUCKET_PX));
  const bucketWidthPx = (chartRight - chartLeft) / M;

  // 2. Pick K — base from the local pxPerYear, multiplied by an activePreset hint.
  //    pxPerYear here is the AVERAGE across the visible compressed domain; per-bucket
  //    refinement happens implicitly through the bucket assignment.
  const dom = x.domain();
  const visYears = compressor.decompress(dom[1]) - compressor.decompress(dom[0]);
  const pxPerYearAvg = (chartRight - chartLeft) / Math.max(1, visYears);
  let K = kFromPxPerYear(pxPerYearAvg);          // see §9 table
  K = applyPresetHint(K, activePreset);          // see §4

  // 3. Assign each placed node to a bucket.
  const buckets = Array.from({ length: M }, () => []);
  placed.forEach(p => {
    const bi = Math.max(0, Math.min(M - 1,
      Math.floor((p.xi - chartLeft) / bucketWidthPx)
    ));
    buckets[bi].push(p);
  });

  // 4. For each bucket, rank by importance, mark top-K as label-eligible.
  //    Selected / locked override the quota — they always get +Infinity importance.
  const labelEligible = new Set();
  buckets.forEach(bucket => {
    bucket.sort((a, b) => importance(b.d) - importance(a.d));
    bucket.slice(0, K).forEach(p => labelEligible.add(p.d.id));
    // Also: any selected/locked in this bucket get added regardless of K (importance was +Inf).
  });

  return { labelEligible, K, M, bucketWidthPx, pxPerYearAvg };
}

function revealLevel(node, p, viewport, bucketResult) {
  const eligible = bucketResult.labelEligible.has(node.id);
  const imp = importance(node);

  // Dots almost always show. Only hide at extreme zoom-out + extreme density (§5).
  const showDot = shouldShowDot(node, p, viewport, bucketResult);
  // Labels only if the bucket says so.
  const showLabel = eligible;
  // Dot size — current dotR, modulated by importance (more important = slightly bigger).
  const dotSize = computeDotSize(node, imp, viewport.currentK);

  return { showDot, showLabel, dotSize };
}
```

### 2.3 Why the existing tier-thresholds get deleted

Lines ~1857–1882 of `src/js/app.js` build `degVals`, `cut0`, `cut1`, `cut2`, and the `tierOf` / `tierVisible` functions. All five constructs go away. Replace with two calls:

```js
const bucketResult = buildBuckets({ x, xFull, compressor, W, margin, placed, activePreset });
labels.classed('tl-hidden', p => !bucketResult.labelEligible.has(p.d.id));
```

That's the entire tier replacement: 3 lines in, 26 lines out. Net negative.

---

## 3. Interaction with the existing collision-resolution

The second greedy pass (lines ~1884–1903) does label-vs-label width-based hiding *after* tier-gating. It must stay — even after the bucket pass, two equally-eligible labels in adjacent buckets can still horizontally overlap (a node near a bucket boundary + a node near the next bucket's boundary).

**Change:** none. The greedy pass already loops `labels.each(this.classList.contains('tl-hidden'))` to skip already-hidden labels. With bucketing applied first, ~80–95% of labels are pre-hidden, so the greedy pass sees a tiny candidate set — fast, and likely to produce zero additional hides in 50/100/500/2000y/all zoom levels. At 10y zoom, the bucket K is so high that many candidates survive and the collision pass earns its keep.

Effectively: bucket pass is the strategic filter, collision pass is the tactical mop-up. Order matters and stays the same.

---

## 4. Interaction with the zoom presets

### 4.1 Recommendation: presets are a HINT, not a HARD cap

Rationale: the bucket logic is already density-aware via `pxPerYearAvg`. A 10y preset at the Roman peak already produces a small visible domain, and `kFromPxPerYear` correctly returns the largest K. If we instead made the preset a HARD cap (e.g., "10y always shows K=14 per bucket"), the user who zooms to 10y in prehistory (mostly empty) would see... nothing extra, because there are only 2 nodes there anyway. The hint approach degrades gracefully.

### 4.2 The hint function

```js
function applyPresetHint(K, preset) {
  // Multiplier > 1 → preset INCREASES label density (more labels than pxPerYearAvg alone would suggest).
  // Multiplier < 1 → preset DECREASES it (cleaner read at zoomed-out presets).
  const mult = {
    '10y':   1.4,   // strongly prefer "show almost everything"
    '50y':   1.2,
    '100y':  1.1,
    '500y':  1.0,   // neutral
    '2000y': 0.9,
    'all':   0.85,  // strongly prefer "lead figures only"
    'free':  1.0,   // wheel-zoom / drag-pan / brush — pure pxPerYear logic
  }[preset] || 1.0;
  return Math.max(1, Math.round(K * mult));
}
```

### 4.3 Tracking `activePreset`

Currently the preset buttons just toggle `.active` CSS. Add:

```js
let activePreset = 'free';
// Inside the preset button onclick:
activePreset = b.dataset.yr === 'all' ? 'all' : (b.dataset.yr + 'y');
```

And reset it in three places:

```js
// Wheel zoom:
svg.on('wheel', ev => {
  ...
  activePreset = 'free';
  presetsEl.querySelectorAll('button').forEach(o => o.classList.remove('active'));
  ...
});
// Drag pan 'start':
activePreset = 'free';
// Brush 'brush end':
activePreset = 'free';
```

Why this matters: the user reads the preset button as "I'm in 10y mode now." If we silently kept the K-multiplier from a previous click after they wheel-zoomed away, the density wouldn't match their mental model. Resetting to `'free'` keeps the contract clean.

---

## 5. Symbol-only mode — the user's specific insight

User: *"its fine that nodes symbols appear with a earlier threshold since they dont clutter if they not displaying the text label when tight"*

Translation: dots cheap, labels expensive.

### 5.1 The rule

- **Dots: visible by default at ALL zoom levels** for any importance. They form a useful "density texture" so the user perceives where history is dense without reading text.
- **Dots get hidden only when the visible bucket count exceeds a hard ceiling**, AND only the lowest-importance dots within over-stuffed buckets. Recommendation: hide dots only when a bucket holds >40 nodes AND only the bottom-half by importance, AND only at `pxPerYearAvg ≤ 0.05` (i.e. "all" zoom or wider). In practice this triggers only on the "all" preset in the Roman/Late-Antiquity bucket where 80+ nodes pile into 220 px. Without thinning, the dots literally smear into a vertical stripe. Thinning leaves ~20 dots per bucket → still reads as "dense", still visually informative.

### 5.2 Pseudocode

```js
function shouldShowDot(node, p, viewport, bucketResult) {
  // Always show selected/locked.
  if (node.id === STATE.selected) return true;
  if (STATE.lockedSet?.has(node.id)) return true;
  // Cheap case: most zoom levels show all dots.
  if (bucketResult.pxPerYearAvg > 0.05) return true;
  // Far-zoom case: thin dots in over-stuffed buckets.
  const bi = bucketIndexOf(p.xi, viewport);
  const bucket = bucketResult.buckets[bi];
  if (bucket.length <= 40) return true;
  // Keep top-20 by importance in this bucket. Drop the rest.
  // (Compute once per redraw, cache on bucketResult.)
  return bucketResult.dotEligible.has(node.id);
}
```

This requires storing `bucketResult.buckets` and a pre-computed `dotEligible: Set` alongside `labelEligible: Set`. Cheap.

### 5.3 Recommended thresholds (concrete numbers)

| State                                | Action                                                                                  |
|--------------------------------------|-----------------------------------------------------------------------------------------|
| `pxPerYearAvg > 0.05` (all zooms except deepest-out) | Show every dot. No filtering.                                                  |
| `pxPerYearAvg ≤ 0.05` AND bucket has ≤ 40 nodes      | Show every dot in that bucket.                                                 |
| `pxPerYearAvg ≤ 0.05` AND bucket has > 40 nodes      | Show top-20-by-importance dots in that bucket. Hide rest with `.tl-dot-hidden`. |

In the current vault (~500 datable nodes), this rule fires only at the global "all" preset and only in the Roman / Late-Antiquity buckets. As the vault grows to 1,500+ datable nodes the rule scales naturally.

---

## 6. Smooth transitions

### 6.1 No caching of `revealLevel` between frames

`revealLevel` runs every redraw. With ~500 datable nodes and `M` buckets, that's `O(N log N)` per bucket sort, called once per zoom step or pan tick. At 60fps during a smooth-zoom animation that's ~33 calls per ~220ms animation × ~500 nodes = trivial work. No caching needed.

### 6.2 Existing fade is preserved

`.tl-hidden` already has `transition: opacity 240ms cubic-bezier(0.2,0.8,0.2,1)` on `.tl-event-label` (line 906–907 of `src/styles/app.css`). Adding/removing the class via `labels.classed('tl-hidden', ...)` triggers the transition. No CSS work needed for labels.

### 6.3 Optional new class for dot fading

If we adopt §5's dot-thinning rule, we add to `src/styles/app.css`:

```css
/* Symbol fade — gentler than label fade, slower to avoid flicker on rapid zoom. */
.tl-event.tl-dot-hidden path.tl-event-shape,
.tl-event.tl-dot-hidden circle.tl-event-dot {
  opacity: 0;
  pointer-events: none;
  transition: opacity 320ms cubic-bezier(0.2,0.8,0.2,1);
}
```

320ms (slightly longer than label 240ms) because dot disappearance is structurally more disruptive — it changes the "density texture" — and a slower fade reads as "the cluster is settling" rather than "things popped out." This is optional; ship without it first and add only if §5's thinning is enabled.

### 6.4 Mid-fade zoom changes

The existing class-based fade already handles "label A is fading out when zoom changes again and now wants to be visible again." Removing the class while the opacity-transition is still in flight just causes the transition to reverse smoothly. No flicker, no extra logic. Confirmed by the user's recent feedback that the current label-fade feels good — bucket-driven class toggling preserves exactly that behavior.

---

## 7. Migration plan — what code changes, exactly

### 7.1 The surgical swap

**Target file:** `src/js/app.js`
**Target view:** `VIEWS.timeline`, function `drawEvents` (defined at ~line 1747)

- **DELETE lines ~1857–1882** (the tier definitions: `degVals`, `cut0`, `cut1`, `cut2`, `tierOf`, `tierVisible`, and the line `labels.classed('tl-hidden', p => !tierVisible(...))`).
- **PRESERVE lines ~1884–1903** (the collision-resolution greedy fit).

That's a 26-line deletion.

**Lines to INSERT (in place of 1857–1882):** approximately 12 lines invoking the new helpers:

```js
// Per-region bucket reveal — replaces the old degree-tier global threshold.
// See AUDIT/09_timeline-progressive-reveal-plan.md for the design.
const bucketResult = buildBuckets({
  placed,
  chartLeft: margin.left,
  chartRight: W - margin.right,
  domain: x.domain(),
  compressor,
  activePreset,
});
labels.classed('tl-hidden', p => !bucketResult.labelEligible.has(p.d.id));
// Optional: dot fading at extreme zoom-out (gated by pxPerYearAvg ≤ 0.05).
if (bucketResult.dotEligible) {
  bMerged.classed('tl-dot-hidden', p => !bucketResult.dotEligible.has(p.d.id));
}
```

**New helpers to ADD** (somewhere above `VIEWS.timeline.render`, or as nested functions inside `render`):

- `importance(node)` — ~12 lines
- `kFromPxPerYear(pxPerYear)` — ~10 lines (the §9 table as a switch / if-chain)
- `applyPresetHint(K, preset)` — ~10 lines
- `buildBuckets(args)` — ~30 lines
- `shouldShowDot` helper (only if §5 thinning is enabled) — ~10 lines

Plus the `activePreset` state variable + 3 reset sites in the existing zoom/pan/brush/preset handlers — ~6 lines scattered.

**Total net code delta**: roughly +50 lines, -26 lines = **+24 lines net** in `src/js/app.js`. Well-bounded.

### 7.2 What does NOT change

- The `placed` array construction (lines 1764–1794) — row assignment, label-width measurement, symmetric row offsets — all preserved as-is.
- The `bubblesG` / `labelsG` split (lines 1796–1802).
- The shape/path drawing (lines 1804–1844).
- The greedy collision-fit (lines 1884–1903).
- Axis, era markers, compression breaks, brush, smooth-zoom, drag-pan, wheel-zoom — all untouched.
- The CSS for `.tl-event-label.tl-hidden` — unchanged. Optionally ADD `.tl-event.tl-dot-hidden` (one block, ~5 lines).

### 7.3 Validation pass after implementation

1. Default zoom (`k=1`, no preset): roughly 25–40 labels visible across the canvas, distributed by region (not all clustered in Rome).
2. Click 10y preset near 30 CE: every label in that 10-year window visible.
3. Click 10y preset near -45000 (prehistory): the 1–2 prehistory nodes visible, labels shown.
4. Click "all" preset: ~15–25 labels total, all leads (Plato, Augustus, Muhammad, Constantine, Buddha, Jesus, Confucius, etc.).
5. Wheel-zoom into Roman cluster: more labels reveal smoothly, no popping.
6. Select a low-degree node from the right panel: its label stays visible at any zoom.
7. Drag-pan: labels re-bucket as the viewport moves; no flicker.
8. Mini overview at the bottom: unchanged. Dots only, no labels.

---

## 8. Edge cases

### 8.1 Very-low-zoom view (e.g. fit-to-data on extreme prehistory + modern)

Currently `pxPerYearAvg` for the full ~52,000-year range across ~1200 px ≈ 0.023 px/yr. Falls into the lowest K-table band (K=2). With `M ≈ 5` buckets (1200/220), total visible labels ≈ 10. Lead figures only. Matches the user's "only LEAD figures on zoom out" requirement.

### 8.2 Mouse position vs. canvas midpoint as "center of interest"

Two options for what counts as "the focus" when assigning bucket budgets:

- **Option A (recommended)**: ignore mouse position, use a uniform K per bucket. Simpler, predictable, no flicker on cursor movement.
- **Option B**: give the bucket under the cursor (+ its 1-neighbor) a K-boost (e.g., +50%). Labels appear "around" wherever the user is looking. Cool, but flickery if the user pans rapidly. See open question Q4.

Recommend Option A for v1. Can layer Option B on top later if the user asks.

### 8.3 Mid-drag-pan re-bucketing

During pan, the buckets are recomputed on every brush/drag tick (which already drives `redraw()` → `drawEvents()` → bucket pass). This is correct: as the viewport shifts, different nodes enter / exist buckets, and the K-quota is re-evaluated. No special "lock buckets during pan" logic — and re-bucketing on every frame keeps the experience consistent.

### 8.4 Mid-fade-out + zoom change

Solved by §6.4. The class-toggling drives CSS opacity transitions; reversing a transition mid-flight is natively smooth. No flicker.

### 8.5 Mini overview at the bottom

Recommend: NO progressive-reveal logic in the mini. The mini exists to be an "overview map" — every dot present at all times so the user can see the temporal extent and density of the full corpus at a glance. The mini already has zero labels (line 1759: `const fontSize = isMini ? 0 : ...`) and its dot size is tiny (1.6 px). Confirm by reading `drawEvents(..., isMini=true)` — the new bucket-call should be guarded by `if (!isMini)`, just like the existing label-gating block is.

### 8.6 Compressed gaps and bucket boundaries

The compressor squashes long empty intervals to 160 visual years. Buckets operate on PIXELS, not years, so a bucket may straddle a compression break (e.g., one bucket contains both ~-3000 BCE and ~-1500 BCE if those two years compress to nearby pixel positions). That's fine — the bucket logic doesn't care about real years for grouping. Labels in such a bucket compete on importance regardless of how far apart their real years are. Verified by inspection of `xc(realDate)` (line 1564) and `placed[i].xi`.

### 8.7 Buckets with zero datable nodes

A 220-px-wide stretch of empty canvas (e.g., the visible portion of a compressed gap) produces an empty bucket. `buckets[bi]` is `[]`, `slice(0, K)` is `[]`, no contribution to `labelEligible`. No bug, just a no-op.

### 8.8 Very-narrow viewport (W < 250 px)

`M = ceil(W / 220)` = 1 bucket. Effectively no per-region logic — the K-table alone decides label count. Still correct, just degraded to "global top-K by importance." Tolerable for narrow side panels or unusual window sizes.

### 8.9 Selection cross-view

If the user selects a node in Pantheon and `STATE.crossViewFilter` restricts the timeline to that node's neighborhood (~lines 1479), the bucket logic operates on the filtered set. Fewer candidates → bigger fraction visible → user sees the neighborhood clearly. No special case needed; it falls out for free.

---

## 9. Recommended K-per-bucket table

```js
// pxPerYearAvg → base K (labels per 220-px bucket). Applied BEFORE preset hint.
function kFromPxPerYear(p) {
  if (p <= 0.10)  return 2;   // "all" / 2000y / wider
  if (p <= 0.25)  return 3;   // ~500y range
  if (p <= 0.60)  return 5;   // ~100y–200y range
  if (p <= 1.20)  return 8;   // ~50y range
  if (p <= 3.00)  return 14;  // ~10–25y range
  return 20;                   // <10y range (deeply zoomed)
}
```

### 9.1 Worked examples

| Preset | Visible real-years | `pxPerYearAvg` (1200px chart) | Base K | Preset hint | Effective K | Buckets M | Total labels |
|---|---:|---:|---:|---:|---:|---:|---:|
| `10y`   | 10     | 120.0 | 20 | × 1.4   | 28 | 1 | ~28  |
| `50y`   | 50     | 24.0  | 20 | × 1.2   | 24 | 1 | ~24  |
| `100y`  | 100    | 12.0  | 20 | × 1.1   | 22 | 1 | ~22  |
| `500y`  | 500    | 2.4   | 14 | × 1.0   | 14 | 2 | ~28  |
| `2000y` | 2000   | 0.6   | 5  | × 0.9   | 5  | 5–6 | ~25–30 |
| `all`   | ~52000 | 0.023 | 2  | × 0.85  | 2  | 5–6 | ~10–12 |
| free, fit-to-data (Phase 4 only ≈ 600 yr) | 600 | 2.0 | 14 | × 1.0 | 14 | 5–6 | ~70–84, then trimmed by collision pass |

The "all" case yields ~10–12 labels across the full corpus — exactly the user's "only LEAD figures" intent. The 10y case yields ~28 — effectively "show everything in this window."

### 9.2 Tuning protocol

These numbers are first-principles estimates. After implementation:
1. Open at default zoom; eyeball whether ~25–40 labels feels right.
2. Click each preset in sequence; verify the densities feel natural.
3. If "all" feels too sparse, bump the multiplier from 0.85 → 0.95.
4. If "10y" feels too cluttered, drop the multiplier from 1.4 → 1.2.
5. If "free" wheel-zoom at mid-zoom feels uneven, adjust the table thresholds (e.g., move the `p ≤ 0.60` → K=5 break to `p ≤ 0.50` → K=4).

Three rounds of tuning should converge. Document final values inline in the file.

---

## 10. Open questions for the user

**Q1 — Dot disappearance at extreme zoom-out.** Should dots ever fully disappear (the §5.1 thinning rule that hides low-importance dots in buckets > 40 nodes), or should we keep ALL dots always-visible no matter how dense, accepting that the Roman bucket at "all" zoom will smear into a vertical stripe? Recommendation: enable the thinning rule, since the smear hurts legibility. But this is a judgment call — some users prefer the "density texture."

**Q2 — Selected/locked nodes override.** When the user has a node selected (via right-panel detail or click), should its label *always* show regardless of bucket budget? Recommendation: YES. The user clicked it; they want to see it. Adds 3 lines to `importance(node)` (return `+Infinity` if selected/locked).

**Q3 — Phase-density boost in `importance()`.** A prehistory document has ~3 connections; a Roman emperor has ~30. Pure-degree importance underweights prehistory at all zoom levels. Should `importance()` divide degree by `meanDegreeOfPhase(node.phase)`, giving prehistory a relative boost so each phase has fair representation at zoomed-out views? Recommendation: YES at "all" / "2000y" presets; NO at tight zooms. Implementable as a phase-boost term that's strong at low `pxPerYearAvg` and decays to 0 at high `pxPerYearAvg`. But this adds complexity — open to "no, just use raw degree."

**Q4 — Cursor-focused label budget.** Should the bucket containing the mouse cursor get a K-boost (more labels near where the user is looking)? Recommendation: NO for v1 — flickers as the cursor moves. Could add later as a 250-ms-debounced "focus follows cursor" mode. Want it now or save for v2?

**Q5 — "all" preset label count.** With the proposed K-table, the "all" preset shows ~10–12 labels for the 52,000-year span. Is that the right count? Plato, Augustus, Constantine, Muhammad, Jesus, Buddha, Confucius, Luther, Aquinas, Avicenna, Newton — about 10 lead figures across world history feels right per the user's framing, but you may want 6 (more austere) or 18 (a denser overview).

---

## Appendix A — files touched (path → expected delta)

- `src/js/app.js` — net +24 lines inside `VIEWS.timeline.render` and its helpers. Surgical, isolated, no cross-cutting changes.
- `src/styles/app.css` — optional +5 lines for `.tl-event.tl-dot-hidden` (only if Q1 = YES enable thinning). Otherwise zero changes.

No other files affected. Vault content (`02_documents/`, `03_deities/`, etc.) is untouched — this is renderer-only.

## Appendix B — non-goals

- Not redesigning the row-assignment / vertical-stacking logic — that already works.
- Not changing the compressor — already correct.
- Not redesigning the mini overview — stays "all dots, no labels."
- Not refactoring `drawEvents` into smaller functions (worth doing eventually, but out of scope here; bucket addition is surgical enough to defer).
- Not adding analytics / telemetry on label visibility — out of scope.
