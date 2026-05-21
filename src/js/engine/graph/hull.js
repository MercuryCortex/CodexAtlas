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
  // Groups by `family` (the coarsest visual cluster — ~34 buckets
  // across the deity mode; matches the family_color the disks use).
  //
  // Returns: Array<{
  //   family:   string,       // e.g. 'Greek'
  //   color:    string,       // hex from family_color (or fallback)
  //   polygon:  [{x, y}, ...] // hull vertices in WORLD space
  //   centroid: {x, y}        // for the title label
  //   count:    number        // node count for this family
  // }>
  //
  // Families with fewer than 2 nodes are skipped (can't draw a
  // useful hull). Families with 2 nodes get a degenerate 2-point
  // "hull" — the SVG layer rounds the stroke so it reads as a
  // soft segment rather than a polygon.
  function buildFamilyHulls(nodePacked, nodesById) {
    if (!nodePacked || !nodePacked.idIndex) return [];
    const NF = 8;   // floats per instance — must match graph/node.js packNodes
    const families = new Map();   // family → { color, points: [] }
    for (let i = 0; i < nodePacked.instanceCount; i++) {
      const id = nodePacked.idIndex[i];
      const node = nodesById && nodesById.get ? nodesById.get(id) : null;
      if (!node) continue;
      const family = (node.family && String(node.family).trim()) || 'Other';
      if (!families.has(family)) {
        families.set(family, {
          color: node.family_color || node.tradition_color || '#888888',
          points: [],
        });
      }
      families.get(family).points.push({
        x: nodePacked.data[i * NF + 0],
        y: nodePacked.data[i * NF + 1],
      });
    }
    const out = [];
    for (const [family, data] of families.entries()) {
      if (data.points.length < 2) continue;
      const polygon = convexHull(data.points);
      const centroid = polygonCentroid(polygon);
      out.push({
        family,
        color: data.color,
        polygon,
        centroid,
        count: data.points.length,
      });
    }
    // Larger clusters first so smaller hulls layer on top (less
    // chance of a big hull's stroke crossing through a small one).
    out.sort((a, b) => b.count - a.count);
    return out;
  }

  // ── Export ────────────────────────────────────────────
  window.AtlasEngineGraph = window.AtlasEngineGraph || {};
  window.AtlasEngineGraph.buildFamilyHulls = buildFamilyHulls;
  window.AtlasEngineGraph.convexHull       = convexHull;
})();
