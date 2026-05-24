// ============================================================
// CODEX ATLAS — TIMELINE LAYOUT (Phase TL-1, 2026-05-24)
// ============================================================
// Sibling layout module to radial.js. Computes X = chronology,
// Y = stacked tradition-family bands via a sweep-line rowed
// packer. Pure function — same `(modeNodes, familyOrder, opts)`
// in → same `positions + bands + worldExtent + xRange + yRange
// + undated` out.
//
// Spec: AUDIT/forge-timeline-mode-design-2026-05-23.md §2.
//
// Return shape is INTENTIONALLY different from radialWedgeLayout
// (which returns wedges + rInner + rOuter — both meaningless on
// a band chart). The CONTRACT both layouts share is:
//   - `positions: Map<id, {x,y}>` — consumed by packNodes / packEdges
//   - `worldExtent: {x0,y0,x1,y1}` — consumed by camera.fitToExtent,
//     buildHitGrid, setPanBounds
// Everything else is mode-specific metadata for the view to render.
//
// Algorithm:
//   1. Group nodes by family. Apply familyOrder + opts.colorOverride.
//   2. Partition undated → parking lane (default-on; opts.parkUndated).
//   3. Derive X range from dated set. Clamp to [TIMELINE_FLOOR_BCE,
//      HIST_HI] to keep YAML-bug outliers (`rishabha-jain` at
//      date_earliest = -999_999_999) from blowing the world span.
//   4. Allocate band heights sqrt-weighted by member count (mirrors
//      the radial wedge-allocation philosophy). Stack top-down.
//   5. Place dots: X = (date - xLo) * X_SCALE; Y = sweep-line rowed
//      packer within each band.
//   6. Compute worldExtent inclusive of padding + undated lane.
//
// Determinism: sweep packer row assignment is order-dependent so
// the input is pre-sorted by (family, date_earliest, id). Same
// input → same positions. LS-restored locks land at the same Y.
// ============================================================

(function () {
  'use strict';

  // ── CONSTANTS ────────────────────────────────────────────
  // World-space convention: 1 year = X_SCALE world units. A 5000-
  // year span at 0.5 wu/yr = 2500 wu wide. Matches the audit's §1.2.
  const X_SCALE       = 0.5;
  // Phase TL-2 Step 4 (2026-05-24) — fit-scale override target.
  // Per John's spec (2026-05-24): "at 20% zoom, the timeline main
  // date range fills 90% of viewport width." Gizmo % = scale /
  // fit_scale, so scale_at_20 = 0.2 × fit_scale. Setting:
  //   fit_scale = (4.5 × viewport_w) / data_range_world
  // gives at gizmo 20%:
  //   data_range_world × 0.2 × fit_scale = 0.9 × viewport_w  ✓
  // At gizmo 100% (default), the data range fills 4.5× viewport —
  // i.e., only ~22% of the timeline is visible at default zoom.
  // TradingView-style: default zoom shows detail, zoom out for the
  // overview. The user pans horizontally to read across eras.
  const FIT_OVERSCAN  = 4.5;
  const PAD           = 60;          // world-edge padding (top/bottom)
  // Phase TL-2 Step 3 (2026-05-24) — 10% horizontal reserve on both
  // sides of the data range so the leftmost (9000 BCE) and rightmost
  // (2026 CE) ticks DON'T kiss the screen edges. The user's spec
  // (2026-05-24) — "keep like 10% on left and right open, so becomes
  // organic and allows the user to center dates when they close to
  // the limits". Implemented by widening worldExtent.x0/x1 by
  // X_PAD_FRAC × span. When camera.fitToExtent fits this widened
  // extent, the actual data sits centered with the reserve visible
  // as empty space on either side.
  const X_PAD_FRAC    = 0.10;
  const TIME_AXIS_PAD = 40;          // extra top space for the time-axis ribbon
  const UNDATED_PAD   = 28;          // gap above + below the parking lane
  // Phase 22-AF (2026-05-24) — SECOND ×1.3 bake. John: "make the
  // current 1.3× the new 1× default". Stacked vs Phase 22-N's
  // already-1.3× baseline: net multiplier vs original Phase 7 =
  // 2.6 × 1.3 ≈ 3.38×. LS key bumped to *_v4 so old saves reset.
  const UNDATED_BAND_H = 203;        // 156 × 1.3 ≈ 203

  // Band height allocation per §1.2.
  const MIN_BAND_H    = 95;          // 73 × 1.3 ≈ 95
  const MAX_BAND_H    = 406;         // 312 × 1.3 ≈ 406
  const BAND_H_BASE   = 25.4;        // 19.5 × 1.3 ≈ 25.4

  // Sweep-line packer (§2.3).
  const ROW_PAD       = 8;           // top inset inside each band before first row
  const ROW_STEP      = 10;          // vertical gap between row centers
  const MIN_X_SPACING = 14;          // 2 * NODE_RADIUS + pad — minimum X gap before a row "frees"

  // Phase TL-2 Step 7d (2026-05-24) — CLUSTER-AWARE distribution.
  // Per John 2026-05-24: random jitter "makes it faker"; we want
  // either 100% real chronology OR an organic pattern that's
  // band-aware + node-aware.
  // Rules:
  //   - 1 node in a cluster        → placed at band centerline
  //   - 2..SMALL_CLUSTER_MAX nodes → evenly spaced vertically,
  //                                   symmetric around centerline
  //                                   (3 nodes → bandH divided in 4,
  //                                    nodes at 1/4, 2/4, 3/4)
  //   - more                        → phyllotaxis sunflower around
  //                                   centerline (Y-dominant, X
  //                                   dampened so chronology stays
  //                                   readable)
  // A cluster = adjacent nodes (by X) within CLUSTER_X_RADIUS of
  // each other. Determinism comes from an id-hash sort, not random
  // offsets — same node id always lands at the same slot.
  const CLUSTER_X_RADIUS    = 21;     // world units — ~MIN_X_SPACING * 1.5
  const SMALL_CLUSTER_MAX   = 7;      // ≤7 → even spread; >7 → sunflower
  const SMALL_X_JIGGLE_WU   = 3.5;    // tiny X variation within small clusters
  const GOLDEN_ANGLE        = 2.3999632297286535;
  // FNV-1a 32-bit hash → [0, 1). Deterministic per id.
  function _idHash01(id) {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 0xFFFFFFFF;
  }
  // Phase B-DATING-3 (2026-05-24) — SECOND hash for X-jiggle.
  // The cluster code sorts by hash AND uses hash for Y index ←
  // if it ALSO uses the same hash for X offset, the result is
  // a monotonic diagonal (cluster slants down-right). Use a
  // salted hash so X jiggle decorrelates from Y position.
  function _idJiggleHash01(id) {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i) + 13;     // salt
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 0xFFFFFFFF;
  }

  // Sanity clamps for the date range. The SPINE always spans
  // [TIMELINE_FLOOR_BCE, currentYear] — independent of what dates
  // actually exist in the data. Per John's spec (2026-05-24): the
  // line ALWAYS ends at 9000 BCE on the left and at today's year
  // on the right, regardless of dataset. Dots populate within that
  // spine based on their actual date_earliest.
  const TIMELINE_FLOOR_BCE = -9000;
  function currentYear() { return new Date().getFullYear(); }
  // HIST_HI is read at call time, not at module-init, so a build
  // crossing the new year doesn't ship a stale upper bound.
  function spineHi() { return currentYear(); }

  // ── SCALE PRESETS (Phase TL-2 Step 6b, 2026-05-24) ───────
  // Each preset is a YEAR → WORLD-X distribution. The registry is
  // the experimentation surface for trying different scale ideas
  // without rewiring the layout each time. Each preset implements:
  //   yearToWorldX(year, ctx) → number
  //   worldXToYear(worldX, ctx) → number   (inverse — needed by
  //                                          chrome for tick math)
  // ctx carries the spine fields the formula may need:
  //   { xRange:{lo,hi}, midYear, halfSpine, xSpanYears, xSpanWorld }
  //
  // Active preset is module-level state, selected via setScalePreset
  // and read by both the layout body AND the chrome's tick code.
  // Switching presets requires a layout rebuild (forge exposes
  // _forge.relayout() for that).
  //
  // Slot 1: 'linear-default' — the original 2026-05-24 distribution.
  // year_t → (year - midYear) × 0.5. Maps the full 9000 BCE→2026 CE
  // spine linearly to ~5500 world units, centered on world X=0.
  // Future slots: log, density-compressed, era-bucketed, etc.
  // Era-weighted compression table (Phase TL-2 Step 8, 2026-05-24).
  // Hand-tuned distribution: deep prehistory is sparse so it
  // compresses; classical + modern eras hold most of the vault's
  // mass so they expand. Total weight is normalized internally; the
  // numbers below are relative. Update freely as the vault evolves.
  //   Era              Years        Weight   % of world-X
  //   ─────────────────────────────────────────────────────────
  //   deep prehistory  -9000..-3000   5      ~6%
  //   ancient civs     -3000..-1000  15      ~19%
  //   classical        -1000..  500  25      ~31%
  //   medieval           500.. 1500  20      ~25%
  //   modern            1500.. 9999  35      ~44% (cap > today)
  const COMPRESSED_ERAS = [
    { lo: -9000, hi: -3000, w:  5 },
    { lo: -3000, hi: -1000, w: 15 },
    { lo: -1000, hi:   500, w: 25 },
    { lo:   500, hi:  1500, w: 20 },
    { lo:  1500, hi:  9999, w: 35 },
  ];
  // Memoize the clipped-and-cumulative era table — same xRange
  // means same table; layout calls yearToWorldX ~4500 times per
  // rebuild so caching matters.
  let _erasCache = null;
  let _erasCacheKey = null;
  function _eraSlices(ctx) {
    const key = ctx.xRange.lo + ':' + ctx.xRange.hi;
    if (key === _erasCacheKey && _erasCache) return _erasCache;
    const xLo = ctx.xRange.lo, xHi = ctx.xRange.hi;
    const clipped = [];
    let totalW = 0;
    for (const e of COMPRESSED_ERAS) {
      const lo = Math.max(e.lo, xLo);
      const hi = Math.min(e.hi, xHi);
      if (hi <= lo) continue;
      // Pro-rate weight by the portion of the original era still
      // inside the spine (so a spine that ends partway through the
      // modern era doesn't give modern its full weight).
      const orig = e.hi - e.lo;
      const portion = (hi - lo) / orig;
      const w = e.w * portion;
      clipped.push({ lo, hi, w, cumStart: 0, cumEnd: 0 });
      totalW += w;
    }
    let cum = 0;
    for (const e of clipped) {
      e.cumStart = cum;
      cum += e.w;
      e.cumEnd = cum;
    }
    _erasCacheKey = key;
    _erasCache = { eras: clipped, totalW };
    return _erasCache;
  }

  const SCALE_PRESETS = {
    'linear-default': {
      id:    'linear-default',
      label: 'Linear · 9K BCE → today',
      tagline: 'Original spine-fixed linear (Step 6 baseline)',
      yearToWorldX: function (year, ctx) {
        return (year - ctx.midYear) * X_SCALE;
      },
      worldXToYear: function (worldX, ctx) {
        return ctx.midYear + worldX / X_SCALE;
      },
    },
    'log-centered': {
      id:    'log-centered',
      label: 'Log · year-0 centered',
      tagline: 'Symmetric log compression — BC/AD pivot at world center',
      // Phase 22-AC (2026-05-24) — AUDIT FIX. The old version used
      // `maxDist = max(|xLo|, |xHi|)` for BOTH sides, which made the
      // CE side bottom-out short of +halfWorld when xLo=-9000 vs
      // xHi=2026 (CE only reached log(2027)/log(9001) ≈ 0.836 of
      // half-spine). Now each side is normalized to ITS OWN range,
      // so:
      //   year = xLo  → worldX = -halfWorld
      //   year = 0    → worldX = 0
      //   year = xHi  → worldX = +halfWorld
      // …and the entire spine fills the world. Fixes the "broken
      // feeling" John flagged on LOG.
      yearToWorldX: function (year, ctx) {
        const xLo = ctx.xRange.lo, xHi = ctx.xRange.hi;
        const y = Math.max(xLo, Math.min(xHi, year));
        const halfWorld = ctx.xSpanWorld / 2;
        if (y >= 0) {
          if (xHi <= 0) return 0;
          const logMax = Math.log(xHi + 1);
          if (logMax <= 0) return 0;
          const t = Math.log(y + 1) / logMax;            // 0..1
          return +t * halfWorld;
        } else {
          if (xLo >= 0) return 0;
          const logMax = Math.log(-xLo + 1);
          if (logMax <= 0) return 0;
          const t = Math.log(-y + 1) / logMax;           // 0..1
          return -t * halfWorld;
        }
      },
      worldXToYear: function (worldX, ctx) {
        const halfWorld = ctx.xSpanWorld / 2;
        if (halfWorld <= 0) return 0;
        const xLo = ctx.xRange.lo, xHi = ctx.xRange.hi;
        if (worldX >= 0) {
          if (xHi <= 0) return 0;
          const t = Math.min(1, worldX / halfWorld);
          const logMax = Math.log(xHi + 1);
          return Math.exp(t * logMax) - 1;
        } else {
          if (xLo >= 0) return 0;
          const t = Math.min(1, -worldX / halfWorld);
          const logMax = Math.log(-xLo + 1);
          return -(Math.exp(t * logMax) - 1);
        }
      },
    },
    'log-recent': {
      id:    'log-recent',
      label: 'Log · recent-emphasis',
      tagline: 'Time-since-today on a log scale; modern era dominates',
      // Pure log compression toward the right (today). years_ago
      // is the distance from xHi (today); log(years_ago + 1)
      // gives a smoothly-tightening compression of the past.
      // Inverted so recent = right, ancient = left.
      yearToWorldX: function (year, ctx) {
        const xLo = ctx.xRange.lo, xHi = ctx.xRange.hi;
        const y = Math.max(xLo, Math.min(xHi, year));
        const span = xHi - xLo;
        const logMax = Math.log(span + 1);
        const t = 1 - Math.log((xHi - y) + 1) / logMax;   // 0..1
        return (t - 0.5) * ctx.xSpanWorld;
      },
      worldXToYear: function (worldX, ctx) {
        const t = worldX / ctx.xSpanWorld + 0.5;
        const span = ctx.xRange.hi - ctx.xRange.lo;
        const logMax = Math.log(span + 1);
        const yearsAgo = Math.exp((1 - t) * logMax) - 1;
        return ctx.xRange.hi - yearsAgo;
      },
    },
    'compressed-civilization': {
      id:    'compressed-civilization',
      label: 'Compressed · era-weighted',
      tagline: 'Recent eras get more space; deep prehistory compresses',
      yearToWorldX: function (year, ctx) {
        const slices = _eraSlices(ctx);
        const xSpanWorld = ctx.xSpanWorld;
        const y = Math.max(ctx.xRange.lo, Math.min(ctx.xRange.hi, year));
        for (const e of slices.eras) {
          if (y >= e.lo && y <= e.hi) {
            const t   = (y - e.lo) / (e.hi - e.lo);
            const cum = e.cumStart + t * e.w;
            const norm = cum / slices.totalW;   // 0..1
            return (norm - 0.5) * xSpanWorld;   // map to -half..+half
          }
        }
        return (y < ctx.xRange.lo) ? -xSpanWorld / 2 : xSpanWorld / 2;
      },
      worldXToYear: function (worldX, ctx) {
        const slices = _eraSlices(ctx);
        const xSpanWorld = ctx.xSpanWorld;
        const norm = worldX / xSpanWorld + 0.5;     // 0..1
        const targetCum = norm * slices.totalW;
        for (const e of slices.eras) {
          if (targetCum >= e.cumStart && targetCum <= e.cumEnd) {
            const t = (e.w > 0) ? (targetCum - e.cumStart) / e.w : 0;
            return e.lo + t * (e.hi - e.lo);
          }
        }
        return (norm < 0) ? ctx.xRange.lo : ctx.xRange.hi;
      },
    },
  };
  let _activePresetId = 'linear-default';

  function _activePreset() {
    return SCALE_PRESETS[_activePresetId] || SCALE_PRESETS['linear-default'];
  }

  // ── BAND HEIGHT SCALE (Phase TL-2 Step 7b, 2026-05-24) ───
  // Vertical density control. Multiplies every band's allocated
  // height (and every dot's Y position within a band) by this
  // factor. UI surfaces it as a vertical slider on the right edge
  // of the timeline view. Persisted in localStorage so the user's
  // density preference survives reloads.
  //   1.0  = baseline (original Step 7 heights)
  //   < 1  = compress vertically, more families fit on screen
  //   > 1  = expand vertically, more breathing room per family
  const BAND_SCALE_MIN = 0.30;
  const BAND_SCALE_MAX = 3.00;
  let _bandHeightScale = 1.0;
  function setBandHeightScale(v) {
    if (typeof v !== 'number' || !isFinite(v)) return false;
    const clamped = Math.max(BAND_SCALE_MIN, Math.min(BAND_SCALE_MAX, v));
    if (Math.abs(clamped - _bandHeightScale) < 0.001) return false;
    _bandHeightScale = clamped;
    return true;
  }
  function getBandHeightScale() { return _bandHeightScale; }
  function _ctxFromRange(xRange) {
    const xLo = xRange.lo, xHi = xRange.hi;
    const xSpanYears = Math.max(1, xHi - xLo);
    const xSpanWorld = xSpanYears * X_SCALE;
    return {
      xRange:     xRange,
      midYear:    (xLo + xHi) / 2,
      halfSpine:  xSpanWorld / 2,
      xSpanYears: xSpanYears,
      xSpanWorld: xSpanWorld
    };
  }

  // ── HELPERS ──────────────────────────────────────────────
  function effectiveDate(n) {
    // Same selection radial.js + scrubber use: date_earliest first,
    // fall back to anything that looks date-shaped.
    const d = (n && typeof n.date_earliest === 'number') ? n.date_earliest : null;
    if (d == null || !isFinite(d)) return null;
    if (d < TIMELINE_FLOOR_BCE)     return null;   // out-of-range bug
    return d;
  }

  function familyOf(n) {
    return (n && n.family) || 'Other';
  }

  // sqrt-weighted band height per §1.2.
  function bandHeightFor(memberCount) {
    if (!memberCount) return MIN_BAND_H;
    return Math.max(MIN_BAND_H, Math.min(MAX_BAND_H, BAND_H_BASE * Math.sqrt(memberCount)));
  }

  // ── MAIN ─────────────────────────────────────────────────
  function timelineLayout(modeNodes, familyOrder, opts) {
    opts = opts || {};
    const parkUndated = (opts.parkUndated !== false);   // default true
    const colorOverride = (typeof opts.colorOverride === 'function') ? opts.colorOverride : null;

    const positions = new Map();
    const bands     = {};
    const undated   = { ids: [], y0: 0, y1: 0 };

    if (!Array.isArray(modeNodes) || modeNodes.length === 0) {
      return {
        bands, positions,
        worldExtent: { x0: 0, y0: 0, x1: 0, y1: 0 },
        xRange:      { lo: 0, hi: 0 },
        yRange:      { lo: 0, hi: 0 },
        undated
      };
    }

    // 1. Group by family + partition undated.
    // Phase B-DATING-3 (2026-05-24) — B7 nodes (genuinely atemporal
    // residue per the dating_basis framework) are NOT shown in the
    // timeline. John's epistemology: "everything has a first-mention
    // date, we just haven't researched it yet." B7 is a staging
    // state, not a permanent home. The undated lane is GONE; B7
    // nodes are skipped entirely.
    const byFamily = Object.create(null);   // family → array of nodes
    const allDated = [];
    for (const n of modeNodes) {
      if (!n || !n.id) continue;
      // Skip B7 entirely — they pollute the timeline visually.
      // They'll be rescued by the data-sweep goblin / content batches.
      if (n.dating_basis === 'B7') continue;
      const d = effectiveDate(n);
      if (d == null) {
        // Anything still undated AT THIS POINT (no date_earliest,
        // no B7 marker) is treated as truly skip-from-timeline.
        // Build pipeline marks everything B7 if it has no date, so
        // this branch should be essentially empty.
        continue;
      }
      const f = familyOf(n);
      if (!byFamily[f]) byFamily[f] = [];
      byFamily[f].push(n);
      allDated.push(n);
    }

    // 2. Family order. Use the caller's explicit order first, then
    //    append unknowns in encounter order. Same pattern radial.js
    //    uses for the wedge ring.
    const orderedFamilies = [];
    const seenFams = new Set();
    if (Array.isArray(familyOrder)) {
      for (const f of familyOrder) {
        if (byFamily[f] && !seenFams.has(f)) {
          orderedFamilies.push(f);
          seenFams.add(f);
        }
      }
    }
    for (const f of Object.keys(byFamily)) {
      if (!seenFams.has(f)) {
        orderedFamilies.push(f);
        seenFams.add(f);
      }
    }

    // 3. SPINE range — ALWAYS [TIMELINE_FLOOR_BCE, currentYear].
    //    Per John's spec the timeline LINE endpoints are spine-fixed
    //    (9000 BCE → today), independent of what dates exist in the
    //    data. Dots populate within the spine; line + ticks + camera
    //    fit + center all key off the spine, not the data range.
    const xLo = TIMELINE_FLOOR_BCE;
    const xHi = spineHi();
    const xSpanYears = Math.max(1, xHi - xLo);
    const xSpanWorld = xSpanYears * X_SCALE;
    // Phase TL-2 Step 6 — origin-centered world. spine midpoint =
    // (xLo+xHi)/2 (year). World-X = 0 at that midpoint year. Half-
    // width = xSpanWorld / 2 = distance from origin to each spine
    // endpoint.
    const midYear   = (xLo + xHi) / 2;
    const halfSpine = xSpanWorld / 2;

    // Phase TL-2 Step 6b — scale preset dispatch. The active preset
    // owns the year→world-X formula. Layout body + chrome both call
    // through this, so swapping presets is a single re-layout away.
    const preset = _activePreset();
    const ctx    = {
      xRange:     { lo: xLo, hi: xHi },
      midYear:    midYear,
      halfSpine:  halfSpine,
      xSpanYears: xSpanYears,
      xSpanWorld: xSpanWorld
    };

    // 4. Allocate band heights. Stack top-down. First-pass uses a
    // raw cursor starting at TIME_AXIS_PAD; we'll re-center the whole
    // stack around world Y=0 at the end so the world is origin-
    // centered (matches the wheel's anchor convention).
    // Phase TL-2 Step 7b — scale every band height by _bandHeightScale
    // (UI slider). Affects band rects AND dot Y placement together.
    const bandScale = _bandHeightScale;
    let yCursor = TIME_AXIS_PAD;
    for (const fam of orderedFamilies) {
      const members = byFamily[fam];
      const h = bandHeightFor(members.length) * bandScale;
      const y0 = yCursor;
      const y1 = yCursor + h;
      // Color resolution: prefer caller's override; otherwise pull
      // from the first member that carries family_color (radial does
      // the same fallback chain).
      let color = '#888';
      if (colorOverride) {
        try { const c = colorOverride(fam, members[0]); if (c) color = c; } catch (_) {}
      }
      if (color === '#888') {
        for (const m of members) {
          if (m.family_color)    { color = m.family_color;    break; }
          if (m.tradition_color) { color = m.tradition_color; break; }
        }
      }
      bands[fam] = {
        name:     fam,
        y0, y1,
        yCenter:  (y0 + y1) / 2,
        height:   h,
        members:  members.map(m => m.id),
        color
      };
      yCursor = y1;
    }
    const bandStackBottom = yCursor;

    // 5. Place dots inside each band — CLUSTER-AWARE distribution
    //    (Phase TL-2 Step 7d, 2026-05-24).
    //    Algorithm per band:
    //      a) compute each member's base world-X via the active preset
    //      b) sort by X, then GROUP adjacent members within
    //         CLUSTER_X_RADIUS into clusters
    //      c) for each cluster, place:
    //           1 node       → band centerline
    //           2..7 nodes   → evenly spaced vertically, symmetric
    //                          around centerline; tiny X jiggle so
    //                          the cluster doesn't form a perfect
    //                          vertical line when MIN_X_SPACING
    //                          exceeds the cluster's natural width
    //           >7 nodes     → phyllotaxis sunflower (Y-dominant,
    //                          X dampened) so chronology stays
    //                          readable while the cluster packs
    //                          densely + organically
    //    Determinism: cluster member order = id-hash ascending, so
    //    "anchor" + spiral indexing is stable across reloads.
    for (const fam of orderedFamilies) {
      const band = bands[fam];
      const bandMidY = (band.y0 + band.y1) / 2;
      const bandInnerHalf = Math.max(1, band.height / 2 - ROW_PAD);

      // (a) base X per member. Two hashes per node: one for SORT
      // ORDER inside the cluster (deterministic), a DIFFERENT one
      // for X-jiggle (so X and Y don't correlate — Phase B-DATING-3
      // fix for the monotonic-diagonal drift bug).
      const items = byFamily[fam].map(function (m) {
        return {
          id:    m.id,
          baseX: preset.yearToWorldX(effectiveDate(m), ctx),
          hash:  _idHash01(m.id),         // for sort order
          jhash: _idJiggleHash01(m.id),   // for X jiggle (decorrelated)
        };
      });
      // Sort by X ascending; id tiebreak for stability.
      items.sort(function (a, b) {
        if (a.baseX !== b.baseX) return a.baseX - b.baseX;
        return (a.id < b.id) ? -1 : (a.id > b.id ? 1 : 0);
      });

      // (b) build clusters by walking left-to-right.
      const clusters = [];
      for (const it of items) {
        const last = clusters.length ? clusters[clusters.length - 1] : null;
        if (last && (it.baseX - last.maxX) <= CLUSTER_X_RADIUS) {
          last.members.push(it);
          last.maxX = it.baseX;
        } else {
          clusters.push({ members: [it], maxX: it.baseX });
        }
      }

      // (c) place each cluster.
      for (const c of clusters) {
        const n = c.members.length;
        if (n === 1) {
          const m = c.members[0];
          positions.set(m.id, { x: m.baseX, y: bandMidY });
          continue;
        }

        // Stable hash sort so anchor/spiral index doesn't shuffle
        // across reloads (otherwise locks would drift).
        const sorted = c.members.slice().sort(function (a, b) {
          if (a.hash !== b.hash) return a.hash - b.hash;
          return (a.id < b.id) ? -1 : 1;
        });

        if (n <= SMALL_CLUSTER_MAX) {
          // Even vertical spread, symmetric around bandMidY.
          // n=2 → -spacing/2, +spacing/2 (or equivalently k=±0.5)
          // n=3 → -spacing, 0, +spacing
          // n=4 → -1.5sp, -0.5sp, +0.5sp, +1.5sp
          // ...
          // Spacing chosen so the OUTERMOST node sits at 90% of
          // band-inner-half (10% headroom inside ROW_PAD).
          const outerExtent = bandInnerHalf * 0.90;
          const spacing = (n === 1) ? 0 : (2 * outerExtent) / (n - 1);
          for (let i = 0; i < n; i++) {
            const m = sorted[i];
            const k = i - (n - 1) / 2;          // -(n-1)/2 .. +(n-1)/2
            const y = bandMidY + k * spacing;
            // Phase B-DATING-3 (2026-05-24) — use the DECORRELATED
            // jiggle-hash (not m.hash, which is the sort-order hash).
            // m.hash sorted ascending → using it for X jiggle made the
            // cluster slant diagonal (lowest hash at top + smallest
            // X offset, highest at bottom + largest X offset).
            const xOff = (m.jhash - 0.5) * 2 * SMALL_X_JIGGLE_WU;
            positions.set(m.id, { x: m.baseX + xOff, y: y });
          }
        } else {
          // Phyllotaxis sunflower around band center. Y-dominant,
          // X dampened (0.4 ratio) so the cluster mostly grows
          // vertically and stays close to its chronological X.
          // Radius scaled so the LAST node (i=n-1) fits inside the
          // band-inner-half on Y.
          const yRadiusCap = bandInnerHalf * 0.95;
          const radiusBase = yRadiusCap / Math.sqrt(n - 1);
          for (let i = 0; i < n; i++) {
            const m = sorted[i];
            const r = radiusBase * Math.sqrt(i);
            const a = i * GOLDEN_ANGLE;
            const xOff = r * Math.cos(a) * 0.4;
            const yOff = r * Math.sin(a);
            positions.set(m.id, { x: m.baseX + xOff, y: bandMidY + yOff });
          }
        }
      }
    }

    // 6. Phase B-DATING-3 (2026-05-24) — Undated lane GONE.
    // B7 nodes are now skipped entirely at the top of this function
    // (John 2026-05-24: "intemporal nodes CANT be in a band spread
    // across the timeline. it ruins the hulls. EVERYTHING has a
    // date of first mentioned or found"). The `undated` return
    // field stays in the contract (empty) so consumers don't break.
    const worldBottom = bandStackBottom;

    // Phase TL-2 Step 6 — Y-CENTER the world. The layout above
    // built everything in [0, worldBottom]; shift it UP by
    // worldBottom/2 so the vertical mid sits at world Y=0. Now
    // BG image (anchored at world 0,0) and timeline (centered at
    // world 0,0) co-align at zoom-out — no caos.
    const yShift = -worldBottom / 2;
    for (const fam of orderedFamilies) {
      const band = bands[fam];
      band.y0 += yShift;
      band.y1 += yShift;
      band.yCenter += yShift;
    }
    if (parkUndated && undated.ids.length) {
      undated.y0 += yShift;
      undated.y1 += yShift;
    }
    for (const [id, p] of positions) {
      positions.set(id, { x: p.x, y: p.y + yShift });
    }
    const yWorldTop    = -worldBottom / 2 - PAD;
    const yWorldBottom =  worldBottom / 2 + PAD;

    // 7. World extent (anisotropic — see §3.2). Symmetric around
    // origin on BOTH axes. 10% reserve on each X side so the date-
    // axis endpoints don't kiss the viewport edges.
    const xPadWorld = xSpanWorld * X_PAD_FRAC;
    const worldExtent = {
      x0: -halfSpine - xPadWorld,
      y0: yWorldTop,
      x1:  halfSpine + xPadWorld,
      y1: yWorldBottom
    };

    return {
      bands,
      positions,
      worldExtent,
      xRange: { lo: xLo, hi: xHi },
      yRange: { lo: yWorldTop, hi: yWorldBottom },
      undated,
      // Phase TL-2 Step 6b — expose active scale preset so the chrome
      // + dev picker can read it without going through the global API.
      scalePreset: { id: preset.id, label: preset.label }
    };
  }

  // ── HELPER: world-X ↔ year conversion ────────────────────
  // Phase TL-2 Step 6 (2026-05-24) — ORIGIN-CENTERED. Phase TL-2
  // Step 6b — dispatched through the active scale preset. Same
  // signature (year, xRange) so callers (timeline-chrome.js) don't
  // need to know about the preset registry — they just call and
  // the active distribution does the math.
  function spineMid(xRange) { return (xRange.lo + xRange.hi) / 2; }
  function yearToWorldX(year, xRange) {
    return _activePreset().yearToWorldX(year, _ctxFromRange(xRange));
  }
  function worldXToYear(worldX, xRange) {
    return _activePreset().worldXToYear(worldX, _ctxFromRange(xRange));
  }

  // Phase TL-2 Step 4 (2026-05-24) — timeline-specific fit-scale
  // override. Returns the camera scale that places the data range
  // at FIT_OVERSCAN × viewport_w pixels wide. Used by forge.js
  // computeFitScale() + the post-fit camera override in
  // rebuildForMode for timeline mode only.
  function computeTimelineFitScale(viewportW, xRange) {
    if (!xRange || !viewportW) return 1;
    const dataWidthWorld = (xRange.hi - xRange.lo) * X_SCALE;
    if (dataWidthWorld <= 0) return 1;
    return (FIT_OVERSCAN * viewportW) / dataWidthWorld;
  }
  function computeTimelineCenter(/* xRange, worldExtent */) {
    // Phase TL-2 Step 6 (2026-05-24) — ORIGIN-CENTERED. Since the
    // layout now positions everything symmetric around world (0,0),
    // the visual center is just the origin. Matches the wheel's
    // deadLockCenter (also 0,0), so BG image + timeline + wheel
    // all share one world-anchor.
    return { x: 0, y: 0 };
  }

  // ── SCALE PRESET API ─────────────────────────────────────
  // Phase TL-2 Step 6b (2026-05-24) — public surface for the dev
  // scale picker. Switching a preset just mutates module state;
  // the next layout call picks it up. To redraw with the new
  // preset, the caller fires window._forge.relayout().
  function setScalePreset(id) {
    // Phase 22-AF (2026-05-24) — LOG (`log-centered`) dropped from
    // the UI; migrate stale runtime/LS values silently to linear.
    if (id === 'log-centered' || id === 'log-recent') id = 'linear-default';
    if (!SCALE_PRESETS[id]) {
      console.warn('[timeline] unknown scale preset:', id);
      return false;
    }
    _activePresetId = id;
    return true;
  }
  function getScalePresetId() { return _activePresetId; }
  function listScalePresets() {
    return Object.values(SCALE_PRESETS).map(function (p) {
      return { id: p.id, label: p.label, tagline: p.tagline || '' };
    });
  }

  // ── EXPORT ───────────────────────────────────────────────
  window.AtlasEngineLayout = window.AtlasEngineLayout || {};
  window.AtlasEngineLayout.timelineLayout = timelineLayout;
  window.AtlasEngineLayout.timelineYearToWorldX = yearToWorldX;
  window.AtlasEngineLayout.timelineWorldXToYear = worldXToYear;
  window.AtlasEngineLayout.computeTimelineFitScale = computeTimelineFitScale;
  window.AtlasEngineLayout.computeTimelineCenter   = computeTimelineCenter;
  // Phase TL-2 Step 6b — scale preset surface.
  window.AtlasEngineLayout.setTimelineScalePreset   = setScalePreset;
  window.AtlasEngineLayout.getTimelineScalePresetId = getScalePresetId;
  window.AtlasEngineLayout.listTimelineScalePresets = listScalePresets;
  // Phase TL-2 Step 7b — band-height scale (vertical density slider).
  window.AtlasEngineLayout.setTimelineBandHeightScale = setBandHeightScale;
  window.AtlasEngineLayout.getTimelineBandHeightScale = getBandHeightScale;
  window.AtlasEngineLayout.timelineBandScaleBounds    = Object.freeze({
    min: BAND_SCALE_MIN, max: BAND_SCALE_MAX
  });
  // Also export the constants so the view layer can use them when
  // rendering the time-axis ribbon + undated lane chrome.
  window.AtlasEngineLayout.timelineConstants = Object.freeze({
    X_SCALE, FIT_OVERSCAN, PAD, X_PAD_FRAC, TIME_AXIS_PAD,
    MIN_BAND_H, MAX_BAND_H, BAND_H_BASE,
    ROW_PAD, ROW_STEP, MIN_X_SPACING,
    UNDATED_PAD, UNDATED_BAND_H,
    TIMELINE_FLOOR_BCE
    // (HIST_HI removed — spine upper bound is now dynamic per
    // currentYear(); use AtlasEngineLayout.timelineSpineHi() instead.)
  });
  window.AtlasEngineLayout.timelineSpineHi = spineHi;
})();
