// ============================================================
// CODEX ATLAS — WEBGPU RENDERER (Phase 1)
// ============================================================
// The ONLY file in the engine that knows about WebGPU APIs.
// Everything above it talks through `engine/contract.js`.
// Everything the portable core-portable lives in `engine/math.js`.
//
// PHASE 1 SCOPE — first colored disk, anti-aliased, on the
// Forge canvas. Proves the pipeline end-to-end:
//   - Adapter + device acquisition
//   - Context configuration with the preferred format
//   - WGSL shader compilation
//   - Vertex buffer + uniform buffer + bind group
//   - Render pipeline with premultiplied-alpha blend
//   - Single-disk render via signed-distance field with screen-
//     space-derivative anti-aliasing
//
// Phase 2 will extend this to instanced rendering of N nodes.
// Phase 3 will add gradient edges as a second pipeline.
// ============================================================
//
// SDF DISK RENDERING — why this approach
// --------------------------------------
// A disk is one of two primitives WebGPU graph renderers use
// (the other is a rounded line for edges). We render the disk
// as a fullscreen quad clipped to its bounding box, and let the
// fragment shader compute "is this pixel inside the disk?"
// using a signed-distance field. The advantages:
//   - Perfect sub-pixel anti-aliasing at any zoom level
//   - Zero polygon-count regardless of disk size
//   - Stroke + glow + halo effects all derive from the SDF
//     in the same fragment — trivial to extend in Phase 3
//   - GPU does the work; CPU just writes a 12-float uniform
// ============================================================

(function () {
  'use strict';

  // Quad geometry — two triangles, vertices in local space [-1..1].
  // Reused across every disk via per-disk uniform transforms.
  const QUAD_VERTICES = new Float32Array([
    -1, -1,   1, -1,  -1,  1,
    -1,  1,   1, -1,   1,  1,
  ]);

  // WGSL shader. Inlined as a template string — Phase 1 has one
  // shader; when more land we'll move them to `shaders/` files
  // and fetch at load time. For now inlining beats a runtime
  // fetch round-trip.
  //
  // Uniform struct layout (must match the writeBuffer Float32Array):
  //   center_ndc:  vec2<f32>   bytes  0..7
  //   radius_ndc:  vec2<f32>   bytes  8..15
  //   color:       vec4<f32>   bytes 16..31
  //   viewport_px: vec2<f32>   bytes 32..39
  //   _pad:        vec2<f32>   bytes 40..47  (alignment)
  // Total: 48 bytes.
  const SHADER = /* wgsl */ `
    struct Uniforms {
      center_ndc:  vec2<f32>,
      radius_ndc:  vec2<f32>,
      color:       vec4<f32>,
      viewport_px: vec2<f32>,
      _pad:        vec2<f32>,
    };

    @group(0) @binding(0) var<uniform> u: Uniforms;

    struct VsOut {
      @builtin(position) position: vec4<f32>,
      @location(0) local_pos: vec2<f32>,
    };

    @vertex
    fn vs_main(@location(0) quad_vertex: vec2<f32>) -> VsOut {
      // The quad spans the disk's bounding box in NDC space.
      // local_pos stays in [-1..1] so the fragment shader can
      // compute the SDF without re-deriving the disk centre.
      var out: VsOut;
      out.position = vec4<f32>(
        u.center_ndc.x + quad_vertex.x * u.radius_ndc.x,
        u.center_ndc.y + quad_vertex.y * u.radius_ndc.y,
        0.0, 1.0
      );
      out.local_pos = quad_vertex;
      return out;
    }

    @fragment
    fn fs_main(in: VsOut) -> @location(0) vec4<f32> {
      // SDF: distance from disk centre in local-space units.
      // The disk has radius = 1 in local space (quad goes -1..1).
      let dist = length(in.local_pos);

      // Anti-alias width derived from screen-space derivatives.
      // fwidth() returns |dFdx| + |dFdy| — one pixel wide in
      // screen space, automatically scaled by zoom + DPR.
      let aa = fwidth(dist);

      // smoothstep over the antialias band gives a perfectly
      // smooth edge regardless of disk size or zoom.
      let alpha = 1.0 - smoothstep(1.0 - aa, 1.0, dist);

      // Premultiplied alpha output — matches the canvas context
      // alphaMode = 'premultiplied' configured on the context.
      return vec4<f32>(u.color.rgb * u.color.a * alpha,
                       u.color.a * alpha);
    }
  `;

  // ── Renderer factory ───────────────────────────────────────
  // Async because adapter / device acquisition is async. The
  // view layer awaits this once at mount, then keeps the
  // returned object for the life of the pane.
  async function create(canvas) {
    if (!navigator.gpu) {
      throw new Error('WebGPU not available in this browser. '
        + 'Phase 1b will add a WebGL2 fallback; for now Forge '
        + 'requires WebGPU (Chrome 113+, Safari 18+, Firefox '
        + 'Nightly with dom.webgpu.enabled).');
    }

    const adapter = await navigator.gpu.requestAdapter({
      // High-performance preference — Atlas is a creative tool,
      // we want the discrete GPU when available.
      powerPreference: 'high-performance',
    });
    if (!adapter) {
      throw new Error('No GPU adapter found. Check Chrome about://gpu '
        + 'for WebGPU status. On macOS the integrated GPU is fine.');
    }

    const device = await adapter.requestDevice();
    // Uncaught GPU errors surface here, with stack traces.
    device.addEventListener('uncapturederror', (e) => {
      console.error('[forge.webgpu] uncaptured GPU error:', e.error);
    });

    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format,
      alphaMode: 'premultiplied',
    });

    // Compile shader. Surface compilation errors with file:line.
    const shaderModule = device.createShaderModule({
      label: 'forge-disk-shader',
      code: SHADER,
    });
    // Surface compilation diagnostics (best-effort; not all
    // browsers expose them).
    const compInfo = await shaderModule.getCompilationInfo();
    for (const m of (compInfo && compInfo.messages) || []) {
      const where = '[forge.webgpu shader ' + m.lineNum + ':' + m.linePos + ']';
      if (m.type === 'error')   console.error(where, m.message);
      else if (m.type === 'warning') console.warn(where, m.message);
    }

    // Vertex buffer — uploaded once, reused forever (the quad).
    const vertexBuffer = device.createBuffer({
      label: 'forge-quad-vbuf',
      size:  QUAD_VERTICES.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, QUAD_VERTICES);

    // Uniform buffer — rewritten every frame. 48 bytes per the
    // struct layout documented above.
    const uniformBuffer = device.createBuffer({
      label: 'forge-uniforms',
      size:  48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Bind group layout — uniform buffer at binding 0,
    // accessible from both vertex (for transform) and fragment
    // (for color + viewport) stages.
    const bindGroupLayout = device.createBindGroupLayout({
      label: 'forge-bgl',
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      }],
    });

    const pipeline = device.createRenderPipeline({
      label: 'forge-disk-pipeline',
      layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [{
          arrayStride: 8,  // vec2<f32> = 8 bytes
          attributes:  [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
        }],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{
          format,
          // Premultiplied-alpha blending — matches context alphaMode.
          blend: {
            color: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
          },
        }],
      },
      primitive: { topology: 'triangle-list' },
    });

    const bindGroup = device.createBindGroup({
      label:  'forge-bg',
      layout: bindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    // Clear color — matches --bg-0 (#07090f). Premultiplied so
    // the framebuffer stays consistent with the alphaMode.
    const CLEAR_COLOR = { r: 0.0274, g: 0.0353, b: 0.0588, a: 1 };

    // ── Public renderer API ─────────────────────────────────
    // This is the surface `forge.js` (and the engine contract
    // implementation) will talk to. Phase 1 has one method
    // (`drawDisk`); Phase 2 swaps it for `draw(scene, camera)`
    // dispatching on op.kind.

    const api = {
      device,
      context,
      format,
      canvas,

      // Resize the backing canvas to match CSS pixel size × DPR.
      // Re-configures the context (required after a canvas
      // resize in WebGPU per spec).
      resize(cssWidth, cssHeight) {
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(1, Math.floor(cssWidth  * dpr));
        const h = Math.max(1, Math.floor(cssHeight * dpr));
        if (canvas.width === w && canvas.height === h) return;
        canvas.width  = w;
        canvas.height = h;
        // Context re-configure is required when the canvas
        // texture size changes. Re-using the same format and
        // device — only the implicit current-texture size moves.
        context.configure({ device, format, alphaMode: 'premultiplied' });
      },

      // Phase 1 primitive: draw one disk.
      // pxX, pxY   — disk centre in CSS pixels (canvas-local)
      // pxR        — disk radius in CSS pixels
      // color      — [r, g, b, a] each in [0, 1]
      // viewportCss — { w, h } canvas CSS-pixel dimensions
      drawDisk(pxX, pxY, pxR, color, viewportCss) {
        const dpr = window.devicePixelRatio || 1;

        // CSS px → NDC. NDC.x = (px / w) * 2 - 1.
        // NDC.y is FLIPPED — WebGPU NDC has Y up, screen Y is down.
        const ndcX  = (pxX / viewportCss.w) * 2 - 1;
        const ndcY  = 1 - (pxY / viewportCss.h) * 2;
        const rNdcX = (pxR / viewportCss.w) * 2;
        const rNdcY = (pxR / viewportCss.h) * 2;

        // Build the uniform record — must match WGSL struct.
        const data = new Float32Array(12);
        data[0] = ndcX;
        data[1] = ndcY;
        data[2] = rNdcX;
        data[3] = rNdcY;
        data[4] = color[0];
        data[5] = color[1];
        data[6] = color[2];
        data[7] = (color[3] === undefined) ? 1 : color[3];
        data[8] = viewportCss.w * dpr;   // pixel-space viewport
        data[9] = viewportCss.h * dpr;
        // [10], [11] are padding to round up to 16-byte alignment.
        device.queue.writeBuffer(uniformBuffer, 0, data);

        const encoder = device.createCommandEncoder({ label: 'forge-frame' });
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view:       context.getCurrentTexture().createView(),
            clearValue: CLEAR_COLOR,
            loadOp:     'clear',
            storeOp:    'store',
          }],
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.draw(6);
        pass.end();
        device.queue.submit([encoder.finish()]);
      },

      destroy() {
        // Best-effort release. WebGPU resources are GC'd, but
        // an explicit destroy() releases backing memory on most
        // implementations and surfaces "use after destroy" bugs
        // in dev. Wrap in try blocks — some browsers (older
        // Safari) don't implement .destroy() on every resource.
        try { uniformBuffer.destroy(); } catch (e) { /* ignore */ }
        try { vertexBuffer.destroy();  } catch (e) { /* ignore */ }
        try { device.destroy();        } catch (e) { /* ignore */ }
      },
    };

    return api;
  }

  window.AtlasEngineWebGPU = Object.freeze({ create });
})();
