// ============================================================
// CODEX ATLAS — CAMERA
// ============================================================
// 2D orthographic camera in world-space units. Owns pan/zoom
// state. Pure (no DOM). The view layer drives it from
// pointer/wheel events; the renderer reads it for the
// world→NDC transform.
//
// COORDINATE CONVENTIONS
//   world         arbitrary world units (the radial layout
//                 uses [-540, 540] roughly)
//   viewport CSS  CSS pixels of the canvas element
//   screen px     viewport × devicePixelRatio (the WebGPU
//                 swapchain texture)
//   NDC           [-1, 1]² with Y up
//
// CAMERA STATE
//   centerX, centerY    world point that sits at viewport centre
//   scale               CSS-pixels-per-world-unit
//                         scale = 1   →  1 world unit = 1 css px
//                         scale = 2   →  zoomed in 2× (world is bigger)
//                         scale = 0.5 →  zoomed out 2×
//
// CRITICAL TRANSFORMS
//   World uses math convention (Y up). Screen uses canvas
//   convention (Y down). The renderer's view-uniform flips Y
//   so positive world.y appears at the TOP of the screen. The
//   camera's world↔screen helpers below apply the same flip
//   so hit-tests and any pixel-aware logic stays consistent
//   with what the renderer actually paints.
//
//   world → CSS px:   px.x = (world.x - center.x) * scale + viewport.w / 2
//                     px.y = viewport.h / 2 - (world.y - center.y) * scale
//   CSS px → world:   world.x = (px.x - viewport.w / 2) / scale + center.x
//                     world.y = (viewport.h / 2 - px.y) / scale + center.y
//   world → NDC:      ndc.x =  (world.x - center.x) * scale * 2 / viewport.w
//                     ndc.y = -(world.y - center.y) * scale * 2 / viewport.h
// ============================================================

(function () {
  'use strict';

  // Zoom limits — world units per CSS pixel ratio. Below 0.05
  // the wheel is unreadable; above 30 individual disks fill
  // the viewport, which we'll need for cinematic close-ups
  // later. These bounds can be tuned per-view.
  const MIN_SCALE = 0.05;
  const MAX_SCALE = 30;

  function createCamera(opts) {
    const o = opts || {};
    const state = {
      centerX: typeof o.centerX === 'number' ? o.centerX : 0,
      centerY: typeof o.centerY === 'number' ? o.centerY : 0,
      scale:   typeof o.scale   === 'number' ? o.scale   : 1,
    };

    // Listeners — view layer subscribes to re-draw when the
    // camera moves. Multiple subscribers supported.
    const listeners = new Set();
    const _emit = () => { for (const fn of listeners) fn(state); };

    return {
      get state() {
        return { centerX: state.centerX, centerY: state.centerY, scale: state.scale };
      },

      // Subscribe to camera changes. Returns unsubscribe fn.
      onChange(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },

      // ── Setters ──────────────────────────────────────
      setCenter(x, y) {
        if (state.centerX === x && state.centerY === y) return;
        state.centerX = x;
        state.centerY = y;
        _emit();
      },
      setScale(s) {
        const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
        if (state.scale === clamped) return;
        state.scale = clamped;
        _emit();
      },
      // Set everything in one go (avoids emitting twice).
      set(c) {
        const cx = (typeof c.centerX === 'number') ? c.centerX : state.centerX;
        const cy = (typeof c.centerY === 'number') ? c.centerY : state.centerY;
        const sc = (typeof c.scale   === 'number') ? Math.max(MIN_SCALE, Math.min(MAX_SCALE, c.scale)) : state.scale;
        if (state.centerX === cx && state.centerY === cy && state.scale === sc) return;
        state.centerX = cx;
        state.centerY = cy;
        state.scale   = sc;
        _emit();
      },

      // ── Coordinate conversions ──────────────────────
      // viewport: { w, h } in CSS pixels (NOT backing-store).

      // Y-flipped: world is Y-up (math), screen is Y-down (canvas).
      worldToScreen(wx, wy, viewport) {
        return {
          x: (wx - state.centerX) * state.scale + viewport.w / 2,
          y: viewport.h / 2 - (wy - state.centerY) * state.scale,
        };
      },

      screenToWorld(sx, sy, viewport) {
        return {
          x: (sx - viewport.w / 2) / state.scale + state.centerX,
          y: (viewport.h / 2 - sy) / state.scale + state.centerY,
        };
      },

      // ── Operations ──────────────────────────────────

      // Pan by a CSS-pixel delta (the natural input from a
      // mouse-drag handler). World-space delta is dx/scale on
      // X; on Y the screen is flipped, so a downward drag
      // (dy > 0 in CSS) moves world content DOWN (the camera
      // sees a smaller Y, i.e. center.y increases).
      panByScreen(dxPx, dyPx) {
        if (dxPx === 0 && dyPx === 0) return;
        state.centerX -= dxPx / state.scale;
        state.centerY += dyPx / state.scale;
        _emit();
      },

      // Zoom toward a viewport anchor point (the mouse cursor).
      // The world point under the anchor stays under the anchor.
      //   factor > 1 → zoom in
      //   factor < 1 → zoom out
      zoomAt(factor, anchorScreenX, anchorScreenY, viewport) {
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, state.scale * factor));
        if (newScale === state.scale) return;
        // World point currently under the anchor (Y-flipped).
        const wAnchorX = (anchorScreenX - viewport.w / 2) / state.scale + state.centerX;
        const wAnchorY = (viewport.h / 2 - anchorScreenY) / state.scale + state.centerY;
        // Invariant: after zoom, the same world point maps back
        // to the same anchor. Solve for new center under the
        // Y-flipped worldToScreen.
        state.centerX = wAnchorX - (anchorScreenX - viewport.w / 2) / newScale;
        state.centerY = wAnchorY - (viewport.h / 2 - anchorScreenY) / newScale;
        state.scale   = newScale;
        _emit();
      },

      // Frame the given world-space bounding box into the viewport
      // with margin padding (in world units). Use this on mount.
      fitToExtent(extent, viewport, padding) {
        const pad = typeof padding === 'number' ? padding : 0;
        const w  = (extent.x1 - extent.x0) + pad * 2;
        const h  = (extent.y1 - extent.y0) + pad * 2;
        if (w <= 0 || h <= 0 || viewport.w <= 0 || viewport.h <= 0) return;
        // Pixels-per-world-unit per axis — pick the smaller so
        // both axes fit. (Aspect-correct letterbox.)
        const sx = viewport.w / w;
        const sy = viewport.h / h;
        const s  = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(sx, sy)));
        state.centerX = (extent.x0 + extent.x1) / 2;
        state.centerY = (extent.y0 + extent.y1) / 2;
        state.scale   = s;
        _emit();
      },
    };
  }

  window.AtlasEngineCamera = Object.freeze({
    create: createCamera,
    MIN_SCALE,
    MAX_SCALE,
  });
})();
