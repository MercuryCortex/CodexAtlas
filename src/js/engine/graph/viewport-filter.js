// ============================================================
// CODEX ATLAS — VIEWPORT FILTER (Phase 24A v1)
// ============================================================
//
// First architectural change toward the Google Maps bar (see
// memory: feedback_google_maps_bar_2026-05-25).
//
// Provides:
//   - viewportWorldBbox(camera, canvas, margin) — world-coord bbox
//     of the visible viewport plus a margin pad (default 25%).
//   - cull(nodes, positions, bbox, capActive) — filters a node list
//     to only those whose layout position is inside the bbox, up
//     to a cap. Returns { nodes, truncated, ms }.
//
// Pure functions. No DOM, no global state, no side effects.
//
// Phase 24A v1: applied once per rebuildForMode call (mode/layout
// switch). Phase 24A v2 will add a camera.onChange hook that
// re-runs cull on debounced pan/zoom without re-running layout.
// ============================================================

(function () {
  'use strict';

  // Compute the world-coord bbox of the currently visible viewport,
  // padded out by `margin` (1.0 = no pad; 1.5 = 25% pad on each side).
  // Camera state shape: { centerX, centerY, scale }. Canvas is a DOM
  // element; we read its CSS dimensions.
  function viewportWorldBbox(camera, canvas, margin) {
    if (margin == null) margin = 1.5;
    const cs = camera && camera.state;
    if (!cs || !canvas || !cs.scale) {
      return { x0: -Infinity, x1: Infinity, y0: -Infinity, y1: Infinity, _degenerate: true };
    }
    const w = canvas.clientWidth  / cs.scale;
    const h = canvas.clientHeight / cs.scale;
    const padW = w * (margin - 1) / 2;
    const padH = h * (margin - 1) / 2;
    return {
      x0: cs.centerX - w/2 - padW,
      x1: cs.centerX + w/2 + padW,
      y0: cs.centerY - h/2 - padH,
      y1: cs.centerY + h/2 + padH,
    };
  }

  // Filter `nodes` to only those whose `positions.get(id)` is inside
  // `bbox`. If the result exceeds `capActive`, downsample deterministi-
  // cally (every Nth by index) and set truncated:true so the UI can
  // show a "zoom in for full detail" hint.
  //
  // Returns { nodes: filtered[], truncated: bool, ms: elapsed, total: int }.
  function cull(nodes, positions, bbox, capActive) {
    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    if (!Array.isArray(nodes) || !positions || !bbox) {
      return { nodes: nodes || [], truncated: false, ms: 0, total: nodes ? nodes.length : 0, kept: nodes ? nodes.length : 0 };
    }
    if (bbox._degenerate) {
      // No camera yet — keep everything.
      return { nodes: nodes.slice(), truncated: false, ms: 0, total: nodes.length, kept: nodes.length };
    }
    const x0 = bbox.x0, x1 = bbox.x1, y0 = bbox.y0, y1 = bbox.y1;
    const out = [];
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const p = positions.get ? positions.get(n.id) : positions[n.id];
      if (!p) continue;
      if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) continue;
      out.push(n);
    }
    const cap = (typeof capActive === 'number' && capActive > 0) ? capActive : Infinity;
    let truncated = false;
    let result = out;
    if (out.length > cap) {
      truncated = true;
      // Deterministic downsample: every Nth by index. Keeps the
      // same set across re-renders so the UI doesn't flicker.
      const stride = out.length / cap;
      result = new Array(Math.floor(cap));
      for (let i = 0; i < result.length; i++) {
        result[i] = out[Math.floor(i * stride)];
      }
    }
    const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    return { nodes: result, truncated, ms: +(t1 - t0).toFixed(2), total: nodes.length, kept: result.length };
  }

  // ── Export ────────────────────────────────────────────
  window.AtlasViewportFilter = Object.freeze({
    viewportWorldBbox,
    cull,
  });
})();
