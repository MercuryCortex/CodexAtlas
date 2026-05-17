// ============================================================
// CODEX ATLAS — ENGINE MATH
// ============================================================
// Pure geometric primitives. Ported from the portable core's
// src/canvasGeometry.ts (2,100 lines) — Phase 0 extracts the
// foundational math; later phases pull more as needed.
//
// Every function here is PURE — no state, no DOM, no closures
// over module-level mutable state. This is what makes the
// future Rust port mechanical: each function maps 1:1 to a
// Rust free function with identical signature.
//
// Read `src/js/engine/README.md` § "Architecture invariants"
// before editing.
// ============================================================

(function () {
  'use strict';

  // ── Numeric helpers ────────────────────────────────────────

  function clamp(v, lo, hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
  }

  function clamp01(v) {
    if (v === undefined || v === null) return 0;
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function deg2rad(d) { return (d * Math.PI) / 180; }
  function rad2deg(r) { return (r * 180) / Math.PI; }

  // ── Affine transforms (2×3 row-major) ──────────────────────
  // Identity layout:  | m00 m01 m02 |
  //                   | m10 m11 m12 |
  // Applied as:  x' = m00*x + m01*y + m02
  //              y' = m10*x + m11*y + m12

  function transformPoint(t, lx, ly) {
    return {
      x: t.m00 * lx + t.m01 * ly + t.m02,
      y: t.m10 * lx + t.m11 * ly + t.m12,
    };
  }

  function multiplyTransform(a, b) {
    // result = a · b — applying b first, then a
    return {
      m00: a.m00 * b.m00 + a.m01 * b.m10,
      m01: a.m00 * b.m01 + a.m01 * b.m11,
      m02: a.m00 * b.m02 + a.m01 * b.m12 + a.m02,
      m10: a.m10 * b.m00 + a.m11 * b.m10,
      m11: a.m10 * b.m01 + a.m11 * b.m11,
      m12: a.m10 * b.m02 + a.m11 * b.m12 + a.m12,
    };
  }

  function invertTransform(t) {
    // For an affine 2×3: det = m00*m11 - m01*m10
    const det = t.m00 * t.m11 - t.m01 * t.m10;
    if (Math.abs(det) < 1e-12) return null;
    const inv = 1 / det;
    return {
      m00:  t.m11 * inv,
      m01: -t.m01 * inv,
      m02:  (t.m01 * t.m12 - t.m11 * t.m02) * inv,
      m10: -t.m10 * inv,
      m11:  t.m00 * inv,
      m12:  (t.m10 * t.m02 - t.m00 * t.m12) * inv,
    };
  }

  function buildTransform(tx, ty, scaleX, scaleY, rotationRad) {
    // Compose translate → rotate → scale (Figma-equivalent order).
    const cos = Math.cos(rotationRad || 0);
    const sin = Math.sin(rotationRad || 0);
    const sx = scaleX !== undefined ? scaleX : 1;
    const sy = scaleY !== undefined ? scaleY : 1;
    return {
      m00:  cos * sx,
      m01: -sin * sy,
      m02:  tx || 0,
      m10:  sin * sx,
      m11:  cos * sy,
      m12:  ty || 0,
    };
  }

  function getRotation(t) {
    // Extract rotation angle (rad) from affine.
    return Math.atan2(t.m10, t.m00);
  }

  // ── Viewport / world↔screen ────────────────────────────────
  // Viewport: { scale, offsetX, offsetY }
  // Screen point (sx, sy) ↔ World point (wx, wy)
  //   wx = (sx - offsetX) / scale
  //   wy = (sy - offsetY) / scale

  function screenToWorld(vp, sx, sy) {
    return {
      x: (sx - vp.offsetX) / vp.scale,
      y: (sy - vp.offsetY) / vp.scale,
    };
  }

  function worldToScreen(vp, wx, wy) {
    return {
      x: wx * vp.scale + vp.offsetX,
      y: wy * vp.scale + vp.offsetY,
    };
  }

  // ── Bounds ─────────────────────────────────────────────────
  // Bounds: { x, y, w, h } — axis-aligned rectangle.

  function boundsContain(b, px, py) {
    return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
  }

  function boundsIntersect(a, b) {
    return !(a.x + a.w < b.x || b.x + b.w < a.x ||
             a.y + a.h < b.y || b.y + b.h < a.y);
  }

  function boundsUnion(a, b) {
    const x  = Math.min(a.x, b.x);
    const y  = Math.min(a.y, b.y);
    const xr = Math.max(a.x + a.w, b.x + b.w);
    const yb = Math.max(a.y + a.h, b.y + b.h);
    return { x, y, w: xr - x, h: yb - y };
  }

  function boundsCenter(b) {
    return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  }

  // ── Polygon / segment hit-tests ────────────────────────────

  function pointInPolygon(px, py, pts) {
    // Ray-casting. pts = [{x, y}, ...].
    let inside = false;
    const n = pts.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = pts[i].x, yi = pts[i].y;
      const xj = pts[j].x, yj = pts[j].y;
      const intersect = ((yi > py) !== (yj > py)) &&
        (px < ((xj - xi) * (py - yi)) / ((yj - yi) || 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) {
      // Degenerate segment: just point-to-point distance.
      const dpx = px - ax, dpy = py - ay;
      return Math.sqrt(dpx * dpx + dpy * dpy);
    }
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = clamp01(t);
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    const dpx = px - cx, dpy = py - cy;
    return Math.sqrt(dpx * dpx + dpy * dpy);
  }

  function pointDist(ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ── Bezier helpers ─────────────────────────────────────────
  // Cubic bezier sample at parameter t ∈ [0, 1]:
  //   B(t) = (1-t)³P0 + 3(1-t)²t·P1 + 3(1-t)t²·P2 + t³·P3
  // Where P0..P3 are { x, y }.

  function cubicSample(p0, p1, p2, p3, t) {
    const it = 1 - t;
    const it2 = it * it;
    const it3 = it2 * it;
    const t2 = t * t;
    const t3 = t2 * t;
    return {
      x: it3 * p0.x + 3 * it2 * t * p1.x + 3 * it * t2 * p2.x + t3 * p3.x,
      y: it3 * p0.y + 3 * it2 * t * p1.y + 3 * it * t2 * p2.y + t3 * p3.y,
    };
  }

  function quadSample(p0, p1, p2, t) {
    const it = 1 - t;
    return {
      x: it * it * p0.x + 2 * it * t * p1.x + t * t * p2.x,
      y: it * it * p0.y + 2 * it * t * p1.y + t * t * p2.y,
    };
  }

  // ── Color helpers ──────────────────────────────────────────
  // Used by the renderer for tint composition. RGB inputs in
  // [0, 255]; output strings in '#rrggbb' or rgba(r,g,b,a).

  function lightenColor(color, amount) {
    // amount ∈ [0, 1]; 0 = unchanged, 1 = white. Ported from
    // pantheon-v2.js lightenColor — same semantics for consistency.
    if (!color || typeof color !== 'string') return '#cccccc';
    let r = 0, g = 0, b = 0;
    if (color[0] === '#' && (color.length === 7 || color.length === 9)) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    } else {
      const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (m) { r = +m[1]; g = +m[2]; b = +m[3]; }
    }
    const t = clamp01(amount);
    r = Math.round(r + (255 - r) * t);
    g = Math.round(g + (255 - g) * t);
    b = Math.round(b + (255 - b) * t);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function withAlpha(color, alpha) {
    if (!color || typeof color !== 'string') return 'rgba(70,75,90,' + alpha + ')';
    let r = 0, g = 0, b = 0;
    if (color[0] === '#' && (color.length === 7 || color.length === 9)) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    } else {
      const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (m) { r = +m[1]; g = +m[2]; b = +m[3]; }
    }
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  // ── Export ─────────────────────────────────────────────────
  window.AtlasEngineMath = Object.freeze({
    // numeric
    clamp,
    clamp01,
    lerp,
    deg2rad,
    rad2deg,

    // transforms
    transformPoint,
    multiplyTransform,
    invertTransform,
    buildTransform,
    getRotation,

    // viewport
    screenToWorld,
    worldToScreen,

    // bounds
    boundsContain,
    boundsIntersect,
    boundsUnion,
    boundsCenter,

    // hit-tests
    pointInPolygon,
    distToSegment,
    pointDist,

    // bezier
    cubicSample,
    quadSample,

    // color
    lightenColor,
    withAlpha,
  });
})();
