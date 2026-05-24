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
  const UNDATED_BAND_H = 60;         // parking lane height

  // Band height allocation per §1.2.
  const MIN_BAND_H    = 28;          // small families don't compress below this
  const MAX_BAND_H    = 120;         // P1+P2 hybrid ceiling (§2.4)
  const BAND_H_BASE   = 7.5;         // tune so sqrt(280) * 7.5 ≈ 125 → clamped to MAX

  // Sweep-line packer (§2.3).
  const ROW_PAD       = 8;           // top inset inside each band before first row
  const ROW_STEP      = 10;          // vertical gap between row centers
  const MIN_X_SPACING = 14;          // 2 * NODE_RADIUS + pad — minimum X gap before a row "frees"

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
  };
  let _activePresetId = 'linear-default';

  function _activePreset() {
    return SCALE_PRESETS[_activePresetId] || SCALE_PRESETS['linear-default'];
  }
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
    const byFamily = Object.create(null);   // family → array of nodes
    const allDated = [];
    for (const n of modeNodes) {
      if (!n || !n.id) continue;
      const d = effectiveDate(n);
      if (d == null) {
        if (parkUndated) undated.ids.push(n.id);
        // else: skip silently — caller asked to ignore undated
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
    let yCursor = TIME_AXIS_PAD;
    for (const fam of orderedFamilies) {
      const members = byFamily[fam];
      const h = bandHeightFor(members.length);
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

    // 5. Place dots inside each band via the sweep-line rowed packer.
    //    Per-band local determinism: sort by (date_earliest, id).
    for (const fam of orderedFamilies) {
      const band = bands[fam];
      const members = byFamily[fam].slice();
      members.sort((a, b) => {
        const da = effectiveDate(a), db = effectiveDate(b);
        if (da !== db) return da - db;
        return (a.id < b.id) ? -1 : (a.id > b.id ? 1 : 0);
      });
      // rows[r] = rightmost X coordinate placed in row r. New nodes
      // try each row in order; first row with enough gap accepts them.
      const rows = [];
      // Compute band-local ROW_STEP — compress if natural row count
      // would overflow the band's allocated height (P1 fallback §2.4).
      // We don't know maxRowsActual until we pack; first pass uses
      // ROW_STEP, then we measure + scale Y down if needed.
      const localPlacements = [];   // [{ id, x, rowIndex }]
      for (const m of members) {
        // Phase TL-2 Step 6 — origin-centered. Phase TL-2 Step 6b —
        // dispatched through the active scale preset so the year→X
        // distribution is swappable at runtime.
        const x = preset.yearToWorldX(effectiveDate(m), ctx);
        let placedRow = -1;
        for (let r = 0; r < rows.length; r++) {
          if (x - rows[r] >= MIN_X_SPACING) {
            rows[r] = x;
            placedRow = r;
            break;
          }
        }
        if (placedRow === -1) {
          rows.push(x);
          placedRow = rows.length - 1;
        }
        localPlacements.push({ id: m.id, x, rowIndex: placedRow });
      }
      // Map rowIndex → Y. Compress ROW_STEP if needed (P1).
      const usableH = band.height - 2 * ROW_PAD;
      const naturalH = Math.max(1, rows.length) * ROW_STEP;
      const rowStep = (naturalH > usableH && rows.length > 1)
        ? Math.max(2, usableH / (rows.length - 1))
        : ROW_STEP;
      for (const p of localPlacements) {
        const y = band.y0 + ROW_PAD + p.rowIndex * rowStep;
        positions.set(p.id, { x: p.x, y });
      }
    }

    // 6. Undated parking lane (visually distinct band at the bottom).
    let worldBottom = bandStackBottom;
    if (parkUndated && undated.ids.length) {
      const laneY0 = bandStackBottom + UNDATED_PAD;
      const laneY1 = laneY0 + UNDATED_BAND_H;
      undated.y0 = laneY0;
      undated.y1 = laneY1;
      // Spread the undated dots evenly across the SPINE — origin-
      // centered, so x ranges from -halfSpine to +halfSpine. Used
      // to be `t * xSpanWorld` (0..xSpanWorld), which clumped them
      // right of the new origin.
      const N = undated.ids.length;
      const sortedIds = undated.ids.slice().sort();
      for (let i = 0; i < N; i++) {
        const t = (i + 0.5) / N;
        const x = (t - 0.5) * xSpanWorld;
        const row = i % 5;     // 5-row stripe for visual breathing
        const y = laneY0 + ROW_PAD + row * 8;
        positions.set(sortedIds[i], { x, y });
      }
      worldBottom = laneY1 + UNDATED_PAD;
    }

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
