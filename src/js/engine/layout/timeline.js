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
  const PAD           = 60;          // world-edge padding (top/bottom/sides)
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

  // Sanity clamps for the date range. The scrubber clamps to
  // TIMELINE_FLOOR_BCE (= -9000) in forge.js; the upper bound is
  // 2025 (HIST_HI matching scrubber's cosmetic ceiling).
  const TIMELINE_FLOOR_BCE = -9000;
  const HIST_HI            = 2025;

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

    // 3. X range from the dated set.
    let xLoRaw = +Infinity, xHiRaw = -Infinity;
    for (const n of allDated) {
      const d = effectiveDate(n);
      if (d < xLoRaw) xLoRaw = d;
      if (d > xHiRaw) xHiRaw = d;
    }
    if (!isFinite(xLoRaw)) { xLoRaw = -1000; xHiRaw = 2000; }   // pure-undated dataset edge case
    const xLo = Math.max(xLoRaw, TIMELINE_FLOOR_BCE);
    const xHi = Math.min(xHiRaw, HIST_HI);
    const xSpanYears = Math.max(1, xHi - xLo);
    const xSpanWorld = xSpanYears * X_SCALE;

    // 4. Allocate band heights. Stack top-down, leaving TIME_AXIS_PAD
    //    at the top for the axis ribbon.
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
        const x = (effectiveDate(m) - xLo) * X_SCALE;
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
      // Spread the undated dots evenly across the X range so they
      // don't clump at x=0. Use deterministic index-based X.
      const N = undated.ids.length;
      const sortedIds = undated.ids.slice().sort();
      for (let i = 0; i < N; i++) {
        const t = (i + 0.5) / N;
        const x = t * xSpanWorld;
        const row = i % 5;     // 5-row stripe for visual breathing
        const y = laneY0 + ROW_PAD + row * 8;
        positions.set(sortedIds[i], { x, y });
      }
      worldBottom = laneY1 + UNDATED_PAD;
    }

    // 7. World extent (anisotropic — see §3.2). Inclusive of side pad.
    const worldExtent = {
      x0: -PAD,
      y0: 0,
      x1: xSpanWorld + PAD,
      y1: worldBottom + PAD
    };

    return {
      bands,
      positions,
      worldExtent,
      xRange: { lo: xLo, hi: xHi },
      yRange: { lo: 0, hi: worldBottom },
      undated
    };
  }

  // ── EXPORT ───────────────────────────────────────────────
  window.AtlasEngineLayout = window.AtlasEngineLayout || {};
  window.AtlasEngineLayout.timelineLayout = timelineLayout;
  // Also export the constants so the view layer can use them when
  // rendering the time-axis ribbon + undated lane chrome.
  window.AtlasEngineLayout.timelineConstants = Object.freeze({
    X_SCALE, PAD, TIME_AXIS_PAD,
    MIN_BAND_H, MAX_BAND_H, BAND_H_BASE,
    ROW_PAD, ROW_STEP, MIN_X_SPACING,
    UNDATED_PAD, UNDATED_BAND_H,
    TIMELINE_FLOOR_BCE, HIST_HI
  });
})();
