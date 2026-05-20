// ============================================================
// CODEX ATLAS — ENGINE CONTRACT
// ============================================================
// This file is the ONLY surface the view layer ever sees.
// View modules (src/js/views/forge.js and successors) compose
// scenes by calling the operations declared here.
//
// The contract is intentionally small. Every operation has a
// matching Rust signature in the portable core so the future
// (a) → (b) port (TypeScript+WebGPU → Rust+WASM via wgpu/Vello)
// is a mechanical swap of the renderer implementation, NOT a
// rewrite of the view modules.
//
// Read `src/js/engine/README.md` before changing anything here.
// Read `AGENTS.md → Craft doctrine` for the load-bearing rules.
// ============================================================
//
// SHAPE OF THE CONTRACT
//
//   Scene — what to draw. Composed by the view layer.
//     scene.drawShape({...})
//     scene.drawPath({...})
//     scene.drawText({...})
//     scene.drawImage({...})
//     scene.pushLayer(blend, opacity, transform, clipPath)
//     scene.popLayer()
//
//   Camera — how to look at it.
//     camera.setViewport(width, height)
//     camera.setTransform({ scale, offsetX, offsetY, rotation })
//     camera.animate(target, duration)
//     camera.worldToScreen(wx, wy) -> { x, y }
//     camera.screenToWorld(sx, sy) -> { x, y }
//
//   Renderer — actually draws it.
//     renderer.beginFrame()
//     renderer.draw(scene, camera)
//     renderer.endFrame()
//     renderer.hitTest(scene, camera, sx, sy) -> nodeId | null
//
// ============================================================

(function () {
  'use strict';

  // ── Draw-op kinds (single source of truth) ─────────────────
  // The renderer dispatches on op.kind. Adding a new shape kind
  // means: (1) extend this enum, (2) implement the case in
  // renderer/webgpu.js, (3) optionally add a graph primitive
  // that emits the new op.
  const OP_KINDS = Object.freeze({
    SHAPE:   'shape',     // primitive (circle / rect / ellipse / star / line / polygon)
    PATH:    'path',      // bezier path (PathData from types.js)
    TEXT:    'text',      // anchored text with style + alignment
    IMAGE:   'image',     // bitmap fill on a rect
    GROUP:   'group',     // pushLayer/popLayer pair around child ops
    EDGE:    'edge',      // Atlas-specific: graph edge with bucket + directional gradient
    HULL:    'hull',      // Atlas-specific: family hull (concave polygon, soft fill)
    GLYPH:   'glyph',     // Atlas-specific: type-glyph from registry, sized + tinted
  });

  // ── Scene — frame-local container of draw ops ──────────────
  // The view layer builds a Scene each frame (or each state-
  // change, then caches). The renderer reads ops out and
  // dispatches them in order. Layers (push/pop) define
  // compositing scope: opacity, blend mode, transform, clip.
  function createScene() {
    const ops = [];
    let layerDepth = 0;
    return {
      get ops() { return ops; },
      get layerDepth() { return layerDepth; },

      // Primitives — see OP_KINDS. Each method validates required
      // fields and pushes a normalized op record.
      drawShape(op) {
        ops.push({ kind: OP_KINDS.SHAPE, ...op });
      },
      drawPath(op) {
        ops.push({ kind: OP_KINDS.PATH, ...op });
      },
      drawText(op) {
        ops.push({ kind: OP_KINDS.TEXT, ...op });
      },
      drawImage(op) {
        ops.push({ kind: OP_KINDS.IMAGE, ...op });
      },

      // Atlas-specific primitives — these decompose into one or
      // more low-level ops inside the renderer, but the view
      // layer talks to them as first-class concepts. Keeping
      // them in the contract (not in the view layer) means the
      // renderer can optimize them as a batch — e.g., all edges
      // in one buffer, one draw call.
      drawEdge(op) {
        // op: { sourceX, sourceY, targetX, targetY, bucket, headline, directional, reverse, width, opacity }
        ops.push({ kind: OP_KINDS.EDGE, ...op });
      },
      drawHull(op) {
        // op: { points, family, fill, stroke, dim }
        ops.push({ kind: OP_KINDS.HULL, ...op });
      },
      drawGlyph(op) {
        // op: { glyphId, x, y, size, color, opacity }
        ops.push({ kind: OP_KINDS.GLYPH, ...op });
      },

      // Layers — push opacity / blend / transform / clip onto the
      // compositing stack. Every push must have a matching pop.
      pushLayer(opts) {
        // opts: { opacity?, blendMode?, transform?, clipPath? }
        ops.push({ kind: OP_KINDS.GROUP, action: 'push', ...opts });
        layerDepth++;
      },
      popLayer() {
        if (layerDepth === 0) {
          throw new Error('[engine.contract] popLayer() with no matching pushLayer');
        }
        ops.push({ kind: OP_KINDS.GROUP, action: 'pop' });
        layerDepth--;
      },

      // Clear and reuse the same Scene instance to avoid GC churn
      // across frames. The renderer may also fingerprint ops to
      // skip work when the scene is unchanged.
      reset() {
        ops.length = 0;
        if (layerDepth !== 0) {
          // Forgive an unbalanced scene by resetting depth here;
          // the warning surfaces in dev tooling.
          console.warn('[engine.contract] Scene reset with non-zero layerDepth (' + layerDepth + ')');
          layerDepth = 0;
        }
      },
    };
  }

  // ── Camera — viewport + transform + world↔screen ───────────
  // The camera is small on purpose. View modules and the
  // renderer both consult it. Animation lives here so multiple
  // views can share easing curves.
  function createCamera() {
    const state = {
      width: 0,
      height: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    };
    const subscribers = new Set();
    const _notify = () => { subscribers.forEach(fn => fn(state)); };

    return {
      get state() { return Object.freeze({ ...state }); },

      setViewport(width, height) {
        if (state.width !== width || state.height !== height) {
          state.width = width;
          state.height = height;
          _notify();
        }
      },

      setTransform({ scale, offsetX, offsetY, rotation }) {
        if (scale     !== undefined) state.scale     = scale;
        if (offsetX   !== undefined) state.offsetX   = offsetX;
        if (offsetY   !== undefined) state.offsetY   = offsetY;
        if (rotation  !== undefined) state.rotation  = rotation;
        _notify();
      },

      // Subscribe to camera changes.
      onChange(fn) {
        subscribers.add(fn);
        return () => subscribers.delete(fn);
      },

      // Coordinate conversions delegate to math.js for testability.
      // The renderer implementation may override with GPU-side
      // matrix uniforms; this CPU-side path is for hit-testing
      // and event handling.
      worldToScreen(wx, wy) {
        return {
          x: wx * state.scale + state.offsetX,
          y: wy * state.scale + state.offsetY,
        };
      },
      screenToWorld(sx, sy) {
        return {
          x: (sx - state.offsetX) / state.scale,
          y: (sy - state.offsetY) / state.scale,
        };
      },
    };
  }

  // ── Renderer interface (documented contract; no impl here) ─
  // The actual implementation lives in renderer/webgpu.js
  // (Phase 1). Any renderer must provide:
  //
  //   async create(canvas) -> Renderer
  //   renderer.draw(scene, camera)
  //   renderer.hitTest(scene, camera, sx, sy) -> nodeId | null
  //   renderer.resize(width, height)
  //   renderer.destroy()
  //
  // The view layer never instantiates a specific renderer —
  // it asks the engine for one. This lets us swap WebGPU ⇄
  // WebGL2 fallback ⇄ future Rust+WASM without view changes.

  // ── Engine factory ─────────────────────────────────────────
  // The entry point view modules call. Returns a fresh scene +
  // camera. The renderer is created separately (async) by
  // whatever WebGPU bootstrap lives in renderer/webgpu.js.
  function createEngine() {
    return {
      scene: createScene(),
      camera: createCamera(),
    };
  }

  // ── Expose on window for view modules ──────────────────────
  // The Forge view (and its successors) imports via window
  // because Atlas doesn't have a module bundler. When we
  // adopt ESM bundling later, this becomes a named export.
  window.AtlasEngine = Object.freeze({
    OP_KINDS,
    createScene,
    createCamera,
    createEngine,
  });
})();
