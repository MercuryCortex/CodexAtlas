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
  function buildFamilyHulls(nodePacked, nodesById) {
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
      out.push({
        family,
        color: data.color,
        polygon,
        centroid,
        centroidAngle,
        count: data.points.length,
      });
    }
    // Largest first for layering — but compute dividers by angular
    // order, not by count.
    out.sort((a, b) => b.count - a.count);
    // Order families angularly to find adjacent neighbours on the
    // wheel rim. Wrap-around handled by repeating the first at the
    // end.
    const byAngle = out.slice().sort((a, b) => a.centroidAngle - b.centroidAngle);
    const dividers = [];
    for (let i = 0; i < byAngle.length; i++) {
      const cur = byAngle[i];
      const next = byAngle[(i + 1) % byAngle.length];
      // Bisector between the two centroids. Handle wrap-around
      // (the gap crosses -π/+π) by adding 2π to the smaller value
      // when their gap exceeds π.
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
    return { hulls: out, center, innerRadius, outerRadius, dividers };
  }

  // ── Export ────────────────────────────────────────────
  window.AtlasEngineGraph = window.AtlasEngineGraph || {};
  window.AtlasEngineGraph.buildFamilyHulls = buildFamilyHulls;
  window.AtlasEngineGraph.convexHull       = convexHull;
})();
