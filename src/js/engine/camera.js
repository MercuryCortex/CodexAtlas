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
//   The renderer paints world points using viewScaleY < 0
//   (Y-flip from world to NDC). On the framebuffer this means
//   a world point at the positive-Y end of the layout lands
//   in the LOWER half of the screen. The camera's
//   world↔screen math below MUST match that behavior so
//   hover hit-tests align with what the user is looking at.
//
//   world → CSS px:   px.x = (world.x - center.x) * scale + viewport.w / 2
//                     px.y = (world.y - center.y) * scale + viewport.h / 2
//   CSS px → world:   world.x = (px.x - viewport.w / 2) / scale + center.x
//                     world.y = (px.y - viewport.h / 2) / scale + center.y
//
//   Note: layout positions are math-convention (Y up) — the
//   visible "flip" in screen space is the renderer's job, not
//   the camera's. The camera is a straight world↔screen map.
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

    // Animation state (Phase 4c + 4f). Closure-local so each camera
    // instance has its own in-flight motion. See `tick(dt)`.
    let panAnim   = null;  // { vx, vy }  in CSS px / second
    let zoomAnim  = null;  // { targetScale, worldX, worldY, screenX, screenY, vw, vh }
    let flyToAnim = null;  // { fromX, fromY, fromScale, toX, toY, toScale, duration, elapsed }

    // 2026-05-19 — pan bounds. View-layer sets these via
    // `setPanBounds(x0, y0, x1, y1)` once the world extent is
    // known. `panByScreen` + animation tick clamp centerX/centerY
    // to keep the world-space center inside the bounds — so the
    // user can't infinite-pan away from the wheel and get lost.
    let bounds = null;   // { x0, y0, x1, y1 } in world units, or null = no clamp
    function clampCenter() {
      if (!bounds) return;
      if (state.centerX < bounds.x0) state.centerX = bounds.x0;
      else if (state.centerX > bounds.x1) state.centerX = bounds.x1;
      if (state.centerY < bounds.y0) state.centerY = bounds.y0;
      else if (state.centerY > bounds.y1) state.centerY = bounds.y1;
    }

    // 2026-05-21 (Phase 21I-revised) — per-instance scale bounds.
    // View layer sets these via `setScaleBounds(lo, hi)` to enforce
    // a tighter range than the module-level MIN_SCALE / MAX_SCALE
    // constants. ALL internal scale clamping uses `clampScale(s)`
    // below so any zoom path (setScale / zoomAt / nudgeZoomTarget
    // / flyTo / animation tick) respects the per-instance bounds.
    let scaleLo = MIN_SCALE;
    let scaleHi = MAX_SCALE;
    function clampScale(s) {
      if (s < scaleLo) return scaleLo;
      if (s > scaleHi) return scaleHi;
      return s;
    }

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
        const clamped = clampScale(s);
        if (state.scale === clamped) return;
        state.scale = clamped;
        _emit();
      },
      // Set everything in one go (avoids emitting twice).
      set(c) {
        const cx = (typeof c.centerX === 'number') ? c.centerX : state.centerX;
        const cy = (typeof c.centerY === 'number') ? c.centerY : state.centerY;
        const sc = (typeof c.scale   === 'number') ? clampScale(c.scale) : state.scale;
        if (state.centerX === cx && state.centerY === cy && state.scale === sc) return;
        state.centerX = cx;
        state.centerY = cy;
        state.scale   = sc;
        _emit();
      },

      // ── Coordinate conversions ──────────────────────
      // viewport: { w, h } in CSS pixels (NOT backing-store).

      // Straight world↔screen mapping. The renderer's view-
      // uniform handles the math-Y-up → screen-Y-down flip;
      // the camera stays a simple affine.
      worldToScreen(wx, wy, viewport) {
        return {
          x: (wx - state.centerX) * state.scale + viewport.w / 2,
          y: (wy - state.centerY) * state.scale + viewport.h / 2,
        };
      },

      screenToWorld(sx, sy, viewport) {
        return {
          x: (sx - viewport.w / 2) / state.scale + state.centerX,
          y: (sy - viewport.h / 2) / state.scale + state.centerY,
        };
      },

      // ── Operations ──────────────────────────────────

      // Pan by a CSS-pixel delta. The drag gesture should
      // make the wheel follow the cursor: dragging right
      // moves world content right (camera centre moves left).
      panByScreen(dxPx, dyPx) {
        if (dxPx === 0 && dyPx === 0) return;
        state.centerX -= dxPx / state.scale;
        state.centerY -= dyPx / state.scale;
        clampCenter();
        _emit();
      },

      // View layer calls this after fitToExtent so the camera
      // knows the world span; pan then clamps to keep the wheel
      // within reach. Pass null to clear (no clamping).
      setPanBounds(x0, y0, x1, y1) {
        if (x0 == null) { bounds = null; return; }
        bounds = { x0, y0, x1, y1 };
        clampCenter();
      },

      // 2026-05-21 — per-instance scale bounds. View layer
      // (e.g. forge.js) calls this once after fit so the wheel
      // can't zoom out below `fit × 0.10`. Both arguments are
      // optional: pass `null` to revert to the module-level
      // MIN_SCALE / MAX_SCALE defaults. Any in-flight animation
      // targeting a now-out-of-bounds scale gets re-clamped on
      // next tick; the current state.scale is snap-clamped here
      // so the next emit reflects the new bounds immediately.
      setScaleBounds(lo, hi) {
        scaleLo = (typeof lo === 'number') ? lo : MIN_SCALE;
        scaleHi = (typeof hi === 'number') ? hi : MAX_SCALE;
        // Re-clamp animation targets so a below-floor zoomAnim
        // doesn't keep dragging the current scale past the new
        // floor.
        if (zoomAnim) zoomAnim.targetScale = clampScale(zoomAnim.targetScale);
        if (flyToAnim) flyToAnim.toScale  = clampScale(flyToAnim.toScale);
        const clamped = clampScale(state.scale);
        if (state.scale !== clamped) {
          state.scale = clamped;
          _emit();
        }
      },

      // Zoom toward a viewport anchor point (the mouse cursor).
      // The world point under the anchor stays under the anchor.
      //   factor > 1 → zoom in
      //   factor < 1 → zoom out
      zoomAt(factor, anchorScreenX, anchorScreenY, viewport) {
        const newScale = clampScale(state.scale * factor);
        if (newScale === state.scale) return;
        // World point currently under the anchor (straight map).
        const wAnchorX = (anchorScreenX - viewport.w / 2) / state.scale + state.centerX;
        const wAnchorY = (anchorScreenY - viewport.h / 2) / state.scale + state.centerY;
        // Invariant: same world point stays under anchor.
        state.centerX = wAnchorX - (anchorScreenX - viewport.w / 2) / newScale;
        state.centerY = wAnchorY - (anchorScreenY - viewport.h / 2) / newScale;
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
        const s  = clampScale(Math.min(sx, sy));
        state.centerX = (extent.x0 + extent.x1) / 2;
        state.centerY = (extent.y0 + extent.y1) / 2;
        state.scale   = s;
        // Cancel any in-flight animations — fit-to-extent is a
        // teleport, not an ease.
        panAnim   = null;
        zoomAnim  = null;
        flyToAnim = null;
        _emit();
      },

      // ── ANIMATION (Phase 4c — cinematic camera) ──────
      //
      // Two independent sub-systems both ticked by `tick(dt)`:
      //
      //   panAnim  — pan inertia. Velocity in CSS px / second.
      //              Decays exponentially with time constant
      //              PAN_TAU.  Released by `kickPanVelocity` at
      //              the end of a drag gesture.
      //
      //   zoomAnim — zoom ease. Wheel events accumulate a target
      //              scale + an anchor (world point under the
      //              cursor at wheel time). Each tick eases the
      //              actual scale toward the target and recomputes
      //              center so the anchor stays pinned under the
      //              screen position throughout the ease.
      //
      // `tick(dt)` returns true when motion is still in flight;
      // the view layer's rAF loop uses that to decide whether to
      // schedule another frame.
      //
      // Idle (no pan, no zoom) → tick is never called.

      kickPanVelocity(vxPx, vyPx) {
        // CSS-pixel velocity. Sub-pixel velocities get clamped to
        // zero so a slow drag doesn't trigger a barely-visible drift.
        if (Math.abs(vxPx) < PAN_KICK_THRESHOLD && Math.abs(vyPx) < PAN_KICK_THRESHOLD) {
          panAnim = null;
          return;
        }
        panAnim = { vx: vxPx, vy: vyPx };
      },

      // Bump the zoom target by `factor` while keeping the world
      // point under (anchorSx, anchorSy) pinned. Compounds with
      // previous wheel events that haven't settled yet.
      nudgeZoomTarget(factor, anchorSx, anchorSy, viewport) {
        if (factor === 1 || !factor) return;
        // If a zoom animation is in flight, compound the factor
        // against the EXISTING target (not the current scale) so
        // rapid wheel ticks accumulate cleanly.
        const base = zoomAnim ? zoomAnim.targetScale : state.scale;
        const next = clampScale(base * factor);
        if (next === state.scale && !zoomAnim) return;
        // World anchor — resolve at CURRENT scale (not target),
        // so successive wheel events at the same cursor position
        // walk through world space consistently.
        const wAnchorX = (anchorSx - viewport.w / 2) / state.scale + state.centerX;
        const wAnchorY = (anchorSy - viewport.h / 2) / state.scale + state.centerY;
        zoomAnim = {
          targetScale: next,
          worldX: wAnchorX,
          worldY: wAnchorY,
          screenX: anchorSx,
          screenY: anchorSy,
          vw: viewport.w,
          vh: viewport.h,
        };
      },

      // Cancel in-flight animations — used when starting a new
      // drag (pan inertia from a previous release shouldn't keep
      // adding momentum) or on view teardown.
      stopAnim() {
        panAnim = null;
        zoomAnim = null;
        flyToAnim = null;
      },

      // Cinematic fly-to — animate centre + scale from current
      // state toward (targetCenterX, targetCenterY, targetScale)
      // over `duration` seconds with ease-out-cubic. Used by the
      // search bar in Phase 4f to glide the camera to a hit. Any
      // other in-flight animation (pan inertia, wheel ease) is
      // cancelled — fly-to is a deliberate direction, not a
      // hand-off from momentum.
      flyTo(target, duration) {
        const tx = (typeof target.centerX === 'number') ? target.centerX : state.centerX;
        const ty = (typeof target.centerY === 'number') ? target.centerY : state.centerY;
        const ts = (typeof target.scale   === 'number') ? clampScale(target.scale) : state.scale;
        panAnim  = null;
        zoomAnim = null;
        flyToAnim = {
          fromX: state.centerX, fromY: state.centerY, fromScale: state.scale,
          toX: tx, toY: ty, toScale: ts,
          duration: Math.max(0.05, duration || 0.6),
          elapsed: 0,
        };
      },

      // Returns true if any animation is in flight.
      isAnimating() {
        return !!(panAnim || zoomAnim || flyToAnim);
      },

      // Advance all in-flight animations by `dt` seconds. Returns
      // true if motion is still in flight after this tick.
      tick(dt) {
        if (!panAnim && !zoomAnim && !flyToAnim) return false;
        let changed = false;
        if (dt <= 0) dt = 1 / 60;

        if (flyToAnim) {
          flyToAnim.elapsed += dt;
          const t = Math.min(1, flyToAnim.elapsed / flyToAnim.duration);
          // Ease-out cubic: 1 - (1 - t)^3 — fast start, soft land.
          const e = 1 - Math.pow(1 - t, 3);
          state.centerX = flyToAnim.fromX + (flyToAnim.toX - flyToAnim.fromX) * e;
          state.centerY = flyToAnim.fromY + (flyToAnim.toY - flyToAnim.fromY) * e;
          state.scale   = flyToAnim.fromScale + (flyToAnim.toScale - flyToAnim.fromScale) * e;
          changed = true;
          if (t >= 1) flyToAnim = null;
        }

        if (panAnim) {
          // World delta = (vx * dt) / scale (vx is in CSS px / s).
          const dx = panAnim.vx * dt / state.scale;
          const dy = panAnim.vy * dt / state.scale;
          state.centerX -= dx;
          state.centerY -= dy;
          // Exponential decay. v *= exp(-dt / PAN_TAU).
          const k = Math.exp(-dt / PAN_TAU);
          panAnim.vx *= k;
          panAnim.vy *= k;
          if (Math.abs(panAnim.vx) < PAN_STOP_THRESHOLD &&
              Math.abs(panAnim.vy) < PAN_STOP_THRESHOLD) {
            panAnim = null;
          }
          changed = true;
        }

        if (zoomAnim) {
          // Critically damped ease: scale → target.
          const remaining = zoomAnim.targetScale - state.scale;
          if (Math.abs(remaining) < ZOOM_STOP_THRESHOLD) {
            state.scale = zoomAnim.targetScale;
            // Snap centre to the exact final position so the
            // world anchor sits perfectly on the screen anchor.
            state.centerX = zoomAnim.worldX
              - (zoomAnim.screenX - zoomAnim.vw / 2) / state.scale;
            state.centerY = zoomAnim.worldY
              - (zoomAnim.screenY - zoomAnim.vh / 2) / state.scale;
            zoomAnim = null;
          } else {
            state.scale += remaining * (1 - Math.exp(-dt / ZOOM_TAU));
            state.centerX = zoomAnim.worldX
              - (zoomAnim.screenX - zoomAnim.vw / 2) / state.scale;
            state.centerY = zoomAnim.worldY
              - (zoomAnim.screenY - zoomAnim.vh / 2) / state.scale;
          }
          changed = true;
        }

        if (changed) {
          // Pan-inertia and fly-to can push center outside the
          // bounds set by setPanBounds; clamp once per tick.
          // zoomAnim's anchored math is fine to clamp too — the
          // user's "world point under cursor" invariant only
          // matters mid-zoom-ease and re-establishes itself on
          // each new wheel event.
          clampCenter();
          _emit();
        }
        return !!(panAnim || zoomAnim || flyToAnim);
      },
    };
  }

  // Animation tuning. Time constants τ define the exponential
  // approach rate: ~63 % of the gap closes in one τ.
  //   PAN_TAU  — how quickly pan inertia decays (smaller = snappier)
  //   ZOOM_TAU — how quickly scale eases to target
  // Stop thresholds prevent floating-point drift from keeping the
  // animation loop alive forever.
  const PAN_TAU  = 0.18;
  const ZOOM_TAU = 0.08;
  const PAN_KICK_THRESHOLD = 30;     // CSS px/s — below this, no inertia
  const PAN_STOP_THRESHOLD = 2;      // CSS px/s — animation halts here
  const ZOOM_STOP_THRESHOLD = 0.001;

  // Animation state is closure-local per camera; not exposed on
  // `state` because callers should treat the camera as opaque
  // during motion — read `state` to render, call `tick` to step.
  // Declared inside createCamera to be per-instance.

  window.AtlasEngineCamera = Object.freeze({
    create: createCamera,
    MIN_SCALE,
    MAX_SCALE,
  });
})();
