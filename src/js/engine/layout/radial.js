// ============================================================
// CODEX ATLAS — RADIAL WEDGE LAYOUT (Phase 20D, 2026-05-21)
// ============================================================
// Pure function: takes a list of nodes + a family ordering,
// returns wedge geometry + per-node positions.
//
// LAYOUT STRATEGY
//   1. Group nodes by family.
//   2. Allocate angular wedge per family proportional to
//      sqrt(member count) — keeps small families visible
//      without crowding large ones.
//   3. Inside each wedge, place nodes in age-stratified
//      bands across the annulus: OLDEST deities (most
//      negative `date_earliest`) land at the OUTER radius;
//      NEWEST at the INNER radius. Bands are sized to the
//      wedge width so dense families pack into more bands,
//      sparse ones into fewer, but every family fills its
//      wedge cleanly from outer to inner.
//   4. Within a band, members fan across the wedge arc
//      (alternate stagger between rows so the visual feel
//      is organic, not grid-like).
//
// AGE-RADIAL RATIONALE
//   The wheel becomes a TIMELINE radially: outer = ancient
//   (Neolithic / Bronze-Age substrate), inner = modern
//   (medieval / contemporary). Reading inward = traversing
//   time. Reading angularly = traversing tradition. This
//   doubles the information density of the diagram for free.
//
//   Members without `date_earliest` ("undated" deities) sort
//   to the inner end (treated as "newest" / unknown) so the
//   outer rim is reserved for confidently-old material.
//
// Ported clean with no DOM/state — testable, portable, ready
// for a future Rust port via the portable core.
// ============================================================

(function () {
  'use strict';

  // Wedge-to-wedge angular gap (radians). 0.045 ≈ 2.6° —
  // tuned in pantheon-v2 to keep sparse families breathable.
  const GAP = 0.045;

  // Default annulus. Phase 2 uses these as world-space radii;
  // the camera fit-to-viewport later maps them into screen px.
  // Tuned wider than pantheon-v2's (220–540) so dense wedges
  // (Vedic, Egyptian, Greek) have room to spiral fully.
  const R_INNER = 220;
  const R_OUTER = 540;

  // (Phase 20D, 2026-05-21 — the previous Vogel/golden-angle
  // spiral was replaced by AGE-RADIAL BAND PACKING. See the
  // comment block above and inside `radialWedgeLayout`. The
  // GOLDEN_ANGLE constant is retired — its old value
  // π · (3 − √5) ≈ 2.39996 rad is preserved here as a comment
  // for archival reference only.)

  // Compute the radial wedge layout.
  //
  // @param nodes        Array of node records ({ id, family, family_color, ... }).
  // @param familyOrder  Array of family-name strings in display order.
  //                     Missing families get appended in encounter order.
  // @param opts         { rInner, rOuter, gap, degree (Map<id,degree>) }
  //
  // @returns { wedges, positions, rInner, rOuter }
  //          wedges:    { [familyName]: { name, a0, a1, center, members, color } }
  //          positions: Map<nodeId, { x, y }>  (world space)
  //          rInner, rOuter: copies of the radii used (for hull/edge layout)
  function radialWedgeLayout(nodes, familyOrder, opts) {
    const o      = opts || {};
    const rInner = (typeof o.rInner === 'number') ? o.rInner : R_INNER;
    const rOuter = (typeof o.rOuter === 'number') ? o.rOuter : R_OUTER;
    const gap    = (typeof o.gap    === 'number') ? o.gap    : GAP;
    const degree = o.degree instanceof Map ? o.degree : new Map();

    // ── 1. Group nodes by family ──────────────────────────
    const famByName = Object.create(null);
    nodes.forEach(n => {
      const fam = n.family || 'Other';
      if (!famByName[fam]) {
        famByName[fam] = {
          name:    fam,
          members: [],
          color:   n.family_color || n.tradition_color || '#7a8090',
        };
      }
      famByName[fam].members.push(n);
    });

    // Build ordered family list — explicit order first, then
    // append any unknown families in encounter order.
    const order = (familyOrder || []).filter(name => famByName[name]).slice();
    Object.keys(famByName).forEach(name => { if (!order.includes(name)) order.push(name); });

    // Skip empty input case — return well-formed empty result.
    if (!order.length) {
      return { wedges: {}, positions: new Map(), rInner, rOuter };
    }

    // ── 2. Allocate angular wedges ────────────────────────
    // Weights: sqrt(memberCount) clamped to ≥ 1.1 so sparse
    // families don't collapse to slivers. Total available arc
    // is 2π minus the inter-wedge gaps.
    const weights  = order.map(name => Math.max(1.1, Math.sqrt(famByName[name].members.length)));
    const totalW   = weights.reduce((s, w) => s + w, 0);
    const totalGap = gap * order.length;
    const totalArc = 2 * Math.PI - totalGap;

    // Start cursor near 9 o'clock so the family-rim labels
    // read left-to-right around the top half of the wheel.
    // -0.55π = ~-99° from x-axis (9 o'clock = -π/2 = -90°, so
    // we're slightly above the horizontal at the start).
    let cursor = -Math.PI * 0.55;
    const wedges = Object.create(null);
    order.forEach((name, i) => {
      const arcSize = totalArc * (weights[i] / totalW);
      wedges[name] = {
        name,
        a0:      cursor,
        a1:      cursor + arcSize,
        center:  cursor + arcSize / 2,
        members: famByName[name].members,
        color:   famByName[name].color,
      };
      cursor += arcSize + gap;
    });

    // ── 3. Place nodes inside each wedge ──────────────────
    // AGE-RADIAL BAND PACKING (Phase 20D, 2026-05-21).
    //
    // Each wedge spans the full annulus from rInner to rOuter.
    // Members are SORTED by date_earliest ascending so the
    // oldest deity lands at the OUTER radius, the newest at
    // the INNER radius. Members without a date sort to the
    // very inner end (treated as "newest / unknown").
    //
    // Inside the wedge we pack into BANDS — concentric arcs.
    // Band count adapts to wedge angular width: a wide wedge
    // (Vedic ~60, Greek ~48) gets ~4-5 members per band so
    // the family ring fills its arc with room to breathe;
    // a narrow wedge (Manichaean 4, Mandaean 5) gets 1-2
    // members per band so it still spans outer→inner.
    //
    // Within a band, members fan across the wedge arc, with
    // alternating-row STAGGER so the layout reads organic
    // rather than gridded.
    const positions = new Map();

    Object.keys(wedges).forEach(famName => {
      const w = wedges[famName];
      const N = w.members.length;
      if (!N) return;

      // Sort by date_earliest ASC (oldest first). Undated
      // members (NaN / null / undefined) sink to the end.
      // Tie-break by degree DESC (more-connected first), then
      // alphabetically so layout is deterministic across loads.
      const sorted = w.members.slice().sort((a, b) => {
        const da = ageOrZero(a.date_earliest);
        const db = ageOrZero(b.date_earliest);
        if (da !== db) return da - db;     // older (more negative) first
        const ga = degree.get(a.id) || 0;
        const gb = degree.get(b.id) || 0;
        if (ga !== gb) return gb - ga;
        return String(a.id || '').localeCompare(String(b.id || ''));
      });

      // Wedge geometry.
      const arc       = w.a1 - w.a0;
      const padA      = Math.min(0.04, (arc / 2) * 0.14);
      const arcUsable = arc - 2 * padA;

      // Decide band capacity from wedge arc width. We want
      // a member spaced every ~52 world units along the band's
      // mean radius so disks (radius ~14 at default scale)
      // don't kiss neighbours.
      const meanR = (rInner + rOuter) / 2;
      const targetSpacing = 52;
      const rawCap = Math.floor((arcUsable * meanR) / targetSpacing);
      // Clamp: at least 1 per band; never wider than ~6 in
      // small wedges so small families still span the annulus.
      const bandCap = Math.max(1, Math.min(rawCap, 6, N));
      const bands   = Math.max(1, Math.ceil(N / bandCap));

      // Radial padding so disks don't graze the inner/outer
      // ring borders. Outer is the "anchor" radius for
      // oldest; inner is for newest. We pull both in slightly
      // so very-old / very-new deities don't sit ON the rim.
      const padR    = 18;
      const rOut    = rOuter - padR;
      const rIn     = rInner + padR;

      sorted.forEach((d, i) => {
        const band      = Math.floor(i / bandCap);
        const colInBand = i % bandCap;
        // Members in THIS band (last band may be partial).
        const remaining = N - band * bandCap;
        const colCount  = Math.min(bandCap, remaining);

        // Band → radius. Band 0 = oldest = rOut. Last band = newest = rIn.
        // Use the radial-density formula so bands distribute
        // EVENLY around the annulus (equal arc-area per band)
        // rather than equal radial step — that keeps node
        // density visually balanced inner vs outer.
        //
        // For equal-area concentric bands between r0 and r1,
        // band k of K has mean radius sqrt( r0² + (k+0.5)/K * (r1² - r0²) ).
        // We invert so band 0 (oldest) is at OUTER (k=K-1 of the formula).
        let r;
        if (bands === 1) {
          r = (rOut + rIn) / 2;
        } else {
          const k = bands - 1 - band; // flip: band 0 → outermost
          const t = (k + 0.5) / bands;
          r = Math.sqrt(rIn * rIn + t * (rOut * rOut - rIn * rIn));
        }

        // Column → angle inside the wedge. Each band's
        // colCount members fan EVENLY across the usable arc.
        // Alternate bands are shifted half a sub-slot so two
        // adjacent radial bands don't share the same angular
        // columns (avoids a "rectangular grid" look — gives
        // the brick-row stagger that reads organic).
        const baseSlot  = (colCount > 1) ? (colInBand + 0.5) / colCount : 0.5;
        const slotShift = (band % 2 === 0) ? 0 : (0.5 / Math.max(1, colCount));
        const tCol      = clamp01(baseSlot + slotShift);
        const ang       = w.a0 + padA + tCol * arcUsable;

        // Tiny deterministic perturbation so members at the
        // same band don't sit on a perfectly clean ring —
        // hash the id to a stable jitter in [-1, 1].
        const h = strHash(d.id);
        const angJit = ((h         & 0xffff) / 0xffff - 0.5) * Math.min(0.012, arcUsable / Math.max(1, colCount) * 0.18);
        const radJit = (((h >>> 16) & 0xffff) / 0xffff - 0.5) * Math.min(12, (rOut - rIn) / Math.max(1, bands) * 0.20);

        const finalAng = ang + angJit;
        const finalR   = r   + radJit;

        positions.set(d.id, {
          x: finalR * Math.cos(finalAng),
          y: finalR * Math.sin(finalAng),
        });
      });
    });

    return { wedges, positions, rInner, rOuter };
  }

  // Numeric coercion for sort. Undated → +Infinity (sinks to
  // newest end of the wedge). Negative numbers (BCE) stay
  // negative; smaller (more negative) = older = sorts earlier.
  function ageOrZero(v) {
    if (v == null) return Infinity;
    const n = Number(v);
    if (!isFinite(n)) return Infinity;
    return n;
  }

  function clamp01(t) { return t < 0 ? 0 : (t > 1 ? 1 : t); }

  // Cheap deterministic string hash (FNV-1a). Used only for
  // tiny jitter — no security / distribution guarantees needed.
  function strHash(s) {
    let h = 2166136261 >>> 0;
    const str = String(s || '');
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  // Compute degree map from edges. Useful pre-layout helper —
  // pantheon-v2 builds the degree map separately, but for the
  // Forge view we want everything from data.js→layout in one path.
  function computeDegree(nodes, edges) {
    const deg = new Map();
    const present = new Set(nodes.map(n => n.id));
    edges.forEach(e => {
      if (!present.has(e.source) || !present.has(e.target)) return;
      deg.set(e.source, (deg.get(e.source) || 0) + 1);
      deg.set(e.target, (deg.get(e.target) || 0) + 1);
    });
    return deg;
  }

  // Helper: filter edges to those whose both endpoints are in
  // the current node set. Pantheon-v2 does this implicitly via
  // sigma's graph.hasEdge / addEdge; we do it explicitly so
  // the Forge engine doesn't need a separate graph library.
  function filterEdgesByNodes(edges, nodes) {
    const present = new Set(nodes.map(n => n.id));
    return edges.filter(e => present.has(e.source) && present.has(e.target));
  }

  // ── Export ─────────────────────────────────────────────
  window.AtlasEngineLayout = window.AtlasEngineLayout || {};
  window.AtlasEngineLayout.radialWedgeLayout = radialWedgeLayout;
  window.AtlasEngineLayout.computeDegree     = computeDegree;
  window.AtlasEngineLayout.filterEdgesByNodes = filterEdgesByNodes;
})();
