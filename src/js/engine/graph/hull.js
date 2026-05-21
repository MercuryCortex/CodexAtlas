// ============================================================
// CODEX ATLAS — FAMILY HULLS (Phase 20, 2026-05-21)
// ============================================================
// Convex hulls per family, computed in WORLD space. The view
// module updates the SVG polygon positions on each camera change
// using its existing worldToScreen function.
//
// Why convex hulls and not concave: cheap (one Andrew's monotone-
// chain pass per family, O(n log n)), visually clean ("this is a
// region"), and concave isn't needed at the wheel densities we
// have. If we ever want tighter wraps we can swap in alpha-shapes
// here without touching the renderer.
//
// Hulls live in world space; the SVG layer in the view module
// renders them in screen space.
// ============================================================

(function () {
  'use strict';

  // Andrew's monotone-chain convex hull. Input: array of {x, y}.
  // Returns the hull as an ordered array of {x, y} points
  // (counter-clockwise, no duplicate endpoint).
  //   - Skips degenerate inputs (< 3 points → returns the input).
  //   - Stable: same input → same output order.
  function convexHull(points) {
    const n = points.length;
    if (n < 3) return points.slice();
    // Sort by x, then y.
    const pts = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (O, A, B) =>
      (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
    // Lower hull.
    const lower = [];
    for (let i = 0; i < n; i++) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pts[i]) <= 0) {
        lower.pop();
      }
      lower.push(pts[i]);
    }
    // Upper hull.
    const upper = [];
    for (let i = n - 1; i >= 0; i--) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pts[i]) <= 0) {
        upper.pop();
      }
      upper.push(pts[i]);
    }
    // Concatenate, drop duplicate endpoints.
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  // Centroid of a polygon. Uses the area-weighted formula so the
  // label sits at the visual middle of the cluster, not the
  // average of vertex coords (which would skew toward dense edges).
  function polygonCentroid(poly) {
    if (poly.length === 0) return { x: 0, y: 0 };
    if (poly.length === 1) return { x: poly[0].x, y: poly[0].y };
    if (poly.length === 2) return { x: (poly[0].x + poly[1].x) / 2, y: (poly[0].y + poly[1].y) / 2 };
    let area = 0, cx = 0, cy = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const f = a.x * b.y - b.x * a.y;
      area += f;
      cx += (a.x + b.x) * f;
      cy += (a.y + b.y) * f;
    }
    area *= 0.5;
    // Degenerate (collinear) — fall back to vertex average.
    if (Math.abs(area) < 1e-9) {
      let sx = 0, sy = 0;
      for (const p of poly) { sx += p.x; sy += p.y; }
      return { x: sx / poly.length, y: sy / poly.length };
    }
    return { x: cx / (6 * area), y: cy / (6 * area) };
  }

  // Build hulls from a packed nodes array + nodesById Map.
  // Groups by `family`. Also computes wheel ring metrics
  // (world center + inner / outer radii) and a per-family
  // centroid angle so the view layer can place labels OUTSIDE
  // the outer ring at angle=centroidAngle, radius=outer+pad.
  //
  // Returns: {
  //   hulls: Array<{ family, color, polygon, centroid, count,
  //                  centroidAngle }>,
  //   center: { x, y },          // world centre of the wheel
  //   innerRadius: number,       // min(distance(node, center))
  //   outerRadius: number,       // max(distance(node, center))
  //   dividers: Array<{          // radial separators between
  //                              // adjacent families on the ring
  //     angle:  number,          // radians (atan2 convention)
  //     family: string,          // family on the +ω side
  //     prevFamily: string,      // family on the -ω side
  //   }>
  // }
  // @param wedgeData (optional) — the `wedges` object from
  //   radialWedgeLayout. Each entry has { name, a0, a1, center,
  //   members, color }. When supplied, dividers are computed
  //   from the EXACT wedge boundaries (a1[i] → a0[i+1] mid-
  //   point) instead of from the placed-member centroids.
  //   That matters when the layout's relaxation pass has
  //   drifted member positions: centroid-based dividers wander
  //   off the family wedge boundary, but a0/a1 boundaries
  //   never move. Use this path for "PERFECT RADIAL" dividers.
  function buildFamilyHulls(nodePacked, nodesById, wedgeData) {
    if (!nodePacked || !nodePacked.idIndex) {
      return { hulls: [], center: { x: 0, y: 0 }, innerRadius: 0, outerRadius: 0, dividers: [] };
    }
    const NF = 8;
    const families = new Map();
    let sumX = 0, sumY = 0, count = 0;
    for (let i = 0; i < nodePacked.instanceCount; i++) {
      const id = nodePacked.idIndex[i];
      const node = nodesById && nodesById.get ? nodesById.get(id) : null;
      if (!node) continue;
      const family = (node.family && String(node.family).trim()) || 'Other';
      const x = nodePacked.data[i * NF + 0];
      const y = nodePacked.data[i * NF + 1];
      sumX += x; sumY += y; count++;
      if (!families.has(family)) {
        families.set(family, {
          color: node.family_color || node.tradition_color || '#888888',
          points: [],
        });
      }
      families.get(family).points.push({ x, y });
    }
    const center = count > 0
      ? { x: sumX / count, y: sumY / count }
      : { x: 0, y: 0 };
    let innerRadius = Infinity, outerRadius = 0;
    const angleSums = new Map();   // family → { sx, sy, n } for circular-mean
    for (const [family, data] of families.entries()) {
      let sx = 0, sy = 0;
      for (const p of data.points) {
        const dx = p.x - center.x, dy = p.y - center.y;
        const r = Math.hypot(dx, dy);
        if (r < innerRadius) innerRadius = r;
        if (r > outerRadius) outerRadius = r;
        // Circular mean: sum of unit vectors → atan2 of sum gives
        // the angle robust to the -π/+π wrap.
        const inv = r > 1e-6 ? 1 / r : 0;
        sx += dx * inv;
        sy += dy * inv;
      }
      angleSums.set(family, { sx, sy, n: data.points.length });
    }
    if (!isFinite(innerRadius)) innerRadius = 0;
    const out = [];
    for (const [family, data] of families.entries()) {
      if (data.points.length < 2) continue;
      const polygon = convexHull(data.points);
      const centroid = polygonCentroid(polygon);
      const ang = angleSums.get(family);
      const centroidAngle = (ang && (ang.sx !== 0 || ang.sy !== 0))
        ? Math.atan2(ang.sy, ang.sx)
        : Math.atan2(centroid.y - center.y, centroid.x - center.x);
      // Phase 20E (2026-05-21) — also stamp the wedge's exact
      // angular bounds + centre angle onto the hull record. The
      // renderer uses these to draw an ANNULAR SECTOR ("pie
      // slice") for the family instead of a convex polygon — so
      // family zones become perfect chart-pie shapes with
      // circular inner / outer edges, regardless of where the
      // individual deity positions drifted during relaxation.
      const wd = wedgeData && wedgeData[family];
      out.push({
        family,
        color:         data.color,
        polygon,
        centroid,
        centroidAngle,
        count:         data.points.length,
        a0:            wd ? wd.a0     : null,
        a1:            wd ? wd.a1     : null,
        wedgeCenter:   wd ? wd.center : centroidAngle,
      });
    }
    // Largest first for layering.
    out.sort((a, b) => b.count - a.count);

    // ── Dividers ────────────────────────────────────────
    // PREFERRED path: use the layout's exact wedge boundaries
    // (wedgeData.a1 → next.a0 mid-point). These boundaries
    // are immutable across the layout's relaxation passes, so
    // the dividers ALWAYS sit between adjacent families even
    // when members have drifted across the family centroid.
    //
    // FALLBACK path (no wedgeData passed): use centroid-bisector,
    // which works but can drift off-boundary after relaxation —
    // that's the bug John reported in Phase 20D-3 ("shinto
    // over the line", "pacific over the line").
    let dividers;
    if (wedgeData && typeof wedgeData === 'object') {
      const wedgeList = [];
      for (const name in wedgeData) {
        const w = wedgeData[name];
        if (!w || typeof w.a0 !== 'number' || typeof w.a1 !== 'number') continue;
        wedgeList.push(w);
      }
      // Sort by wedge centre angle so adjacency = list order.
      wedgeList.sort((a, b) => a.center - b.center);
      dividers = [];
      const W = wedgeList.length;
      for (let i = 0; i < W; i++) {
        const cur  = wedgeList[i];
        const next = wedgeList[(i + 1) % W];
        // Divider sits in the middle of the gap between cur.a1
        // and next.a0. Wrap-around: next.a0 may have already
        // wrapped past -π, so we add 2π when next.a0 < cur.a1.
        let a = cur.a1;
        let b = next.a0;
        if (b < a) b += 2 * Math.PI;
        let mid = (a + b) / 2;
        while (mid > Math.PI)  mid -= 2 * Math.PI;
        while (mid < -Math.PI) mid += 2 * Math.PI;
        dividers.push({
          angle: mid,
          family: next.name,
          prevFamily: cur.name,
        });
      }
    } else {
      // Legacy fallback — centroid-bisector dividers.
      const byAngle = out.slice().sort((a, b) => a.centroidAngle - b.centroidAngle);
      dividers = [];
      for (let i = 0; i < byAngle.length; i++) {
        const cur = byAngle[i];
        const next = byAngle[(i + 1) % byAngle.length];
        let a = cur.centroidAngle;
        let b = next.centroidAngle;
        if (b < a) b += 2 * Math.PI;
        let mid = (a + b) / 2;
        while (mid > Math.PI)  mid -= 2 * Math.PI;
        while (mid < -Math.PI) mid += 2 * Math.PI;
        dividers.push({
          angle: mid,
          family: next.family,
          prevFamily: cur.family,
        });
      }
    }
    return { hulls: out, center, innerRadius, outerRadius, dividers };
  }

  // ── Export ────────────────────────────────────────────
  window.AtlasEngineGraph = window.AtlasEngineGraph || {};
  window.AtlasEngineGraph.buildFamilyHulls = buildFamilyHulls;
  window.AtlasEngineGraph.convexHull       = convexHull;
})();
