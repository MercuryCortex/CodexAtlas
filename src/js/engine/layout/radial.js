// ============================================================
// CODEX ATLAS — RADIAL WEDGE LAYOUT
// ============================================================
// Pure function: takes a list of nodes + a family ordering,
// returns wedge geometry + per-node positions.
//
// Same algorithm as src/js/views/pantheon-v2.js's
// computeWedgePositions (proven in production). Ported clean
// with no DOM/state — testable, portable, ready for a future
// Rust port via the portable core.
//
// LAYOUT STRATEGY
//   1. Group nodes by family.
//   2. Allocate angular wedge per family proportional to
//      sqrt(member count) — keeps small families visible
//      without crowding large ones.
//   3. Inside each wedge, place nodes by Fermat spiral
//      (golden-angle Vogel pattern). Top-degree node lands
//      at wedge center; subsequent nodes spiral outward.
//   4. Result: deterministic, dense, no overlap relaxation
//      needed for first-pass rendering. (Relaxation iterations
//      can be layered on later as a polish pass.)
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

  // Golden angle — Vogel pattern divergence. Produces visually
  // even distribution without clustering or banding.
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.39996 rad

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
    // Fermat-spiral / Vogel pattern. Top-degree node lands at
    // the wedge's angular + radial centre; subsequent nodes
    // spiral outward in a (u, v) ∈ [-1, 1]² wedge-local box
    // that gets mapped to (angle, radius) inside the annulus.
    const rMid      = (rInner + rOuter) / 2;
    const radHalf   = (rOuter - rInner) / 2;
    const positions = new Map();

    Object.keys(wedges).forEach(famName => {
      const w = wedges[famName];
      const N = w.members.length;
      if (!N) return;

      // Sort by degree DESC. Ties broken alphabetically so
      // layout is deterministic across runs / reloads.
      const sorted = w.members.slice().sort((a, b) => {
        const da = degree.get(a.id) || 0;
        const db = degree.get(b.id) || 0;
        if (da !== db) return db - da;
        return String(a.id || '').localeCompare(String(b.id || ''));
      });

      // Scale spiral tightness with sqrt(N) — small wedges
      // bunch toward centre, large wedges spread fully.
      const scale = Math.min(1, Math.sqrt(N) / Math.sqrt(Math.max(N, 8)));
      const arc   = w.a1 - w.a0;
      const halfArc = arc / 2;

      sorted.forEach((d, i) => {
        if (i === 0) {
          // Top deity lands EXACTLY at wedge centre.
          positions.set(d.id, {
            x: rMid * Math.cos(w.center),
            y: rMid * Math.sin(w.center),
          });
          return;
        }
        // Vogel pattern: i nodes at angle i·φ on a sqrt(i/N) radius.
        const theta = i * GOLDEN_ANGLE;
        const rho   = Math.sqrt(i / N) * scale;
        // (u, v) ∈ approx [-1, 1]², scaled to keep nodes off
        // the wedge edges (the 0.92 / 0.85 multipliers).
        const u = rho * Math.cos(theta) * 0.92;
        const v = rho * Math.sin(theta) * 0.85;

        // Angular padding so disks don't kiss the wedge boundary.
        const padA = Math.min(0.05, halfArc * 0.18);
        const ang  = w.center + u * (halfArc - padA);
        // Radial padding so disks stay inside the annulus.
        const padR = 14;
        const r    = rMid + v * (radHalf - padR);

        positions.set(d.id, {
          x: r * Math.cos(ang),
          y: r * Math.sin(ang),
        });
      });
    });

    return { wedges, positions, rInner, rOuter };
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
