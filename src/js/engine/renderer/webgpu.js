// ============================================================
// CODEX ATLAS — WEBGPU RENDERER (Phase 2)
// ============================================================
// The ONLY file in the engine that knows about WebGPU APIs.
// Everything above it talks through `engine/contract.js`.
// Everything the portable core-portable lives in `engine/math.js`.
//
// PHASE 2 ADDS:
//   - Instanced disk pipeline → render 660 deities in one draw
//   - Curved-edge pipeline → render 3k edges as quadratic
//     beziers pulled toward the wheel centre, all in one draw
//   - View transform uniform (camera: world → NDC affine)
//   - drawFrame({ nodeInstances, edgeInstances, view }) — one
//     submission paints the full wheel
//
// Phase 1 disk pipeline (drawDisk) is retained as a developer
// utility — useful for debugging shaders on a single primitive.
//
// PIPELINE INDEPENDENCE
//   Each draw-kind owns its own pipeline + bind-group layout.
//   Adding hover overlays / hulls / glyphs in Phase 3 = add
//   another pipeline, doesn't touch the existing ones.
// ============================================================

(function () {
  'use strict';

  // ── Shared geometry: 6-vertex quad in local [-1, 1]² ──
  const QUAD_VERTICES = new Float32Array([
    -1, -1,   1, -1,  -1,  1,
    -1,  1,   1, -1,   1,  1,
  ]);

  // ============================================================
  // Phase 1 single-disk shader (kept for diagnostics).
  // ============================================================
  const DISK_SHADER = /* wgsl */ `
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
      let dist = length(in.local_pos);
      let aa = fwidth(dist);
      let alpha = 1.0 - smoothstep(1.0 - aa, 1.0, dist);
      return vec4<f32>(u.color.rgb * u.color.a * alpha,
                       u.color.a * alpha);
    }
  `;

  // ============================================================
  // Phase 2 INSTANCED NODE shader.
  //
  // Per-frame uniform: view transform mapping world → NDC.
  //   view_scale.xy   — world-units → NDC scaling
  //   view_offset.xy  — world-origin offset in NDC
  // Per-instance attributes: position, radius (world units), color.
  //
  // World → NDC:   ndc = world * view_scale + view_offset
  // ============================================================
  const NODE_SHADER = /* wgsl */ `
    struct View {
      view_scale:  vec2<f32>,
      view_offset: vec2<f32>,
      viewport_px: vec2<f32>,
      _pad:        vec2<f32>,
    };
    @group(0) @binding(0) var<uniform> v: View;

    struct VsOut {
      @builtin(position) position: vec4<f32>,
      @location(0) local_pos:  vec2<f32>,
      @location(1) inst_color: vec4<f32>,
    };

    @vertex
    fn vs_main(
      @location(0) quad_vertex: vec2<f32>,        // [-1, 1]² quad corner
      @location(1) inst_pos_r:  vec4<f32>,        // (x, y, radius, _pad)
      @location(2) inst_color:  vec4<f32>,        // family color
    ) -> VsOut {
      let inst_pos    = inst_pos_r.xy;
      let inst_radius = inst_pos_r.z;

      // World-space position of this quad corner.
      let world = inst_pos + quad_vertex * inst_radius;
      // World → NDC.
      let ndc = world * v.view_scale + v.view_offset;

      var out: VsOut;
      out.position   = vec4<f32>(ndc, 0.0, 1.0);
      out.local_pos  = quad_vertex;
      out.inst_color = inst_color;
      return out;
    }

    @fragment
    fn fs_main(in: VsOut) -> @location(0) vec4<f32> {
      let dist = length(in.local_pos);
      let aa   = fwidth(dist);
      let alpha = 1.0 - smoothstep(1.0 - aa, 1.0, dist);
      let c = in.inst_color;
      // Premultiplied output to match alphaMode 'premultiplied'.
      return vec4<f32>(c.rgb * c.a * alpha, c.a * alpha);
    }
  `;

  // ============================================================
  // Phase 2 INSTANCED EDGE shader.
  //
  // Each edge is rendered as a thin quad oriented along its
  // quadratic-bezier curve. We sample the curve at the quad's
  // X parameter (mapped to t ∈ [0, 1]) and offset perpendicular
  // by the quad's Y parameter × width/2.
  //
  // Curve: P0 = source, P2 = target, P1 = mid + (0 - mid) * curveStrength
  //   → all curves bow toward the wheel centre, creating the
  //     iconic bundled-wire pattern.
  //
  // Per-instance:
  //   inst_endpoints  vec4<f32>  (sx, sy, tx, ty)
  //   inst_color      vec4<f32>
  //   inst_extra      vec4<f32>  (width, curveStrength, bucketIndex, _pad)
  // ============================================================
  const EDGE_SHADER = /* wgsl */ `
    struct View {
      view_scale:  vec2<f32>,
      view_offset: vec2<f32>,
      viewport_px: vec2<f32>,
      _pad:        vec2<f32>,
    };
    @group(0) @binding(0) var<uniform> v: View;

    struct VsOut {
      @builtin(position) position: vec4<f32>,
      @location(0) edge_y:     f32,
      @location(1) edge_color: vec4<f32>,
    };

    fn bezier_pos(p0: vec2<f32>, p1: vec2<f32>, p2: vec2<f32>, t: f32) -> vec2<f32> {
      let it = 1.0 - t;
      return it * it * p0 + 2.0 * it * t * p1 + t * t * p2;
    }
    fn bezier_tan(p0: vec2<f32>, p1: vec2<f32>, p2: vec2<f32>, t: f32) -> vec2<f32> {
      let it = 1.0 - t;
      return 2.0 * it * (p1 - p0) + 2.0 * t * (p2 - p1);
    }

    @vertex
    fn vs_main(
      @location(0) quad_vertex:    vec2<f32>,    // x in [-1,1] → t; y in [-1,1] → perpendicular
      @location(1) inst_endpoints: vec4<f32>,    // (sx, sy, tx, ty)
      @location(2) inst_color:     vec4<f32>,    // (r, g, b, a)
      @location(3) inst_extra:     vec4<f32>,    // (width, curveStrength, bucketIndex, _pad)
    ) -> VsOut {
      let p0   = inst_endpoints.xy;
      let p2   = inst_endpoints.zw;
      let mid  = (p0 + p2) * 0.5;
      // Control point: pull mid toward origin (the wheel centre)
      // by curveStrength. Negative pull would push outward —
      // currently every bucket pulls inward.
      let p1   = mid + (vec2<f32>(0.0, 0.0) - mid) * inst_extra.y;
      // Parametric position on the curve.
      let t    = (quad_vertex.x + 1.0) * 0.5;
      let pos  = bezier_pos(p0, p1, p2, t);
      let tan  = bezier_tan(p0, p1, p2, t);
      // Perpendicular to tangent, unit-length.
      let tnorm = normalize(tan);
      let perp  = vec2<f32>(-tnorm.y, tnorm.x);
      // Final world position: curve + perpendicular offset.
      let half_w = inst_extra.x * 0.5;
      let world  = pos + perp * quad_vertex.y * half_w;
      // World → NDC.
      let ndc = world * v.view_scale + v.view_offset;

      var out: VsOut;
      out.position   = vec4<f32>(ndc, 0.0, 1.0);
      out.edge_y     = quad_vertex.y;
      out.edge_color = inst_color;
      return out;
    }

    @fragment
    fn fs_main(in: VsOut) -> @location(0) vec4<f32> {
      // Cross-edge AA: fade alpha at |y| → 1.
      let aa = fwidth(in.edge_y);
      let alpha_aa = 1.0 - smoothstep(1.0 - aa, 1.0, abs(in.edge_y));
      let c = in.edge_color;
      let a = c.a * alpha_aa;
      // Premultiplied output.
      return vec4<f32>(c.rgb * a, a);
    }
  `;

  // ── Helper: standard premultiplied-alpha blend descriptor ──
  function premultBlend() {
    return {
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
    };
  }

  // ── Renderer factory ───────────────────────────────────
  async function create(canvas) {
    if (!navigator.gpu) {
      throw new Error('WebGPU not available in this browser. '
        + 'Phase 1b will add a WebGL2 fallback; for now Forge '
        + 'requires WebGPU (Chrome 113+, Safari 18+, Firefox '
        + 'Nightly with dom.webgpu.enabled).');
    }

    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });
    if (!adapter) {
      throw new Error('No GPU adapter found. Check Chrome about://gpu '
        + 'for WebGPU status. On macOS the integrated GPU is fine.');
    }

    const device = await adapter.requestDevice();
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

    // ── Shader compilation (all three pipelines share the device) ──
    const diskShaderModule = device.createShaderModule({ label: 'forge-disk-shader', code: DISK_SHADER });
    const nodeShaderModule = device.createShaderModule({ label: 'forge-node-shader', code: NODE_SHADER });
    const edgeShaderModule = device.createShaderModule({ label: 'forge-edge-shader', code: EDGE_SHADER });
    for (const m of [diskShaderModule, nodeShaderModule, edgeShaderModule]) {
      const info = await m.getCompilationInfo();
      for (const msg of (info && info.messages) || []) {
        const where = '[forge.webgpu ' + (m.label || 'shader') + ' ' + msg.lineNum + ':' + msg.linePos + ']';
        if      (msg.type === 'error')   console.error(where, msg.message);
        else if (msg.type === 'warning') console.warn(where, msg.message);
      }
    }

    // ── Shared quad VBO ────────────────────────────────────
    const quadVbo = device.createBuffer({
      label: 'forge-quad-vbo',
      size:  QUAD_VERTICES.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(quadVbo, 0, QUAD_VERTICES);

    // ── Phase 1: single-disk pipeline (diagnostic) ────────
    const diskUbo = device.createBuffer({
      label: 'forge-disk-ubo',
      size:  48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const diskBgl = device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      }],
    });
    const diskPipeline = device.createRenderPipeline({
      label: 'forge-disk-pipeline',
      layout: device.createPipelineLayout({ bindGroupLayouts: [diskBgl] }),
      vertex: {
        module: diskShaderModule, entryPoint: 'vs_main',
        buffers: [{
          arrayStride: 8,
          attributes:  [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
        }],
      },
      fragment: {
        module: diskShaderModule, entryPoint: 'fs_main',
        targets: [{ format, blend: premultBlend() }],
      },
      primitive: { topology: 'triangle-list' },
    });
    const diskBg = device.createBindGroup({
      layout: diskBgl,
      entries: [{ binding: 0, resource: { buffer: diskUbo } }],
    });

    // ── Phase 2: shared view-uniform buffer ───────────────
    // Same uniform layout consumed by both NODE and EDGE shaders.
    // 8 floats = 32 bytes:
    //   view_scale.xy, view_offset.xy, viewport_px.xy, _pad.xy
    const viewUbo = device.createBuffer({
      label: 'forge-view-ubo',
      size:  32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const viewBgl = device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      }],
    });
    const viewBg = device.createBindGroup({
      layout: viewBgl,
      entries: [{ binding: 0, resource: { buffer: viewUbo } }],
    });

    // ── Phase 2: instanced NODE pipeline ──────────────────
    // Per-instance buffer layout matches graph/node.js packer:
    //   8 floats = 32 bytes:
    //     vec4 (x, y, radius, pad)
    //     vec4 (r, g, b, a)
    const nodePipeline = device.createRenderPipeline({
      label: 'forge-node-pipeline',
      layout: device.createPipelineLayout({ bindGroupLayouts: [viewBgl] }),
      vertex: {
        module: nodeShaderModule, entryPoint: 'vs_main',
        buffers: [
          // [0] shared quad VBO
          {
            arrayStride: 8, stepMode: 'vertex',
            attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
          },
          // [1] per-instance attributes
          {
            arrayStride: 32, stepMode: 'instance',
            attributes: [
              { shaderLocation: 1, offset:  0, format: 'float32x4' }, // pos + radius + pad
              { shaderLocation: 2, offset: 16, format: 'float32x4' }, // color
            ],
          },
        ],
      },
      fragment: {
        module: nodeShaderModule, entryPoint: 'fs_main',
        targets: [{ format, blend: premultBlend() }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // ── Phase 2: instanced EDGE pipeline ──────────────────
    // Each edge needs a finer quad mesh (more vertices = better
    // curve approximation). We use a 32-segment strip ribbon
    // instead of a 2-triangle quad: 33 sample points along the
    // curve × 2 sides = 66 vertices per edge instance.
    // The ribbon-mesh stays as a single shared VBO; only the
    // per-instance data changes between edges.
    const EDGE_SEGMENTS = 32;
    const edgeRibbonVerts = new Float32Array((EDGE_SEGMENTS + 1) * 2 * 2);
    for (let i = 0; i <= EDGE_SEGMENTS; i++) {
      const t = i / EDGE_SEGMENTS;   // 0..1
      const x = t * 2 - 1;           // -1..1 (curve parameter)
      const base = i * 4;
      edgeRibbonVerts[base + 0] = x; edgeRibbonVerts[base + 1] = -1;  // bottom side
      edgeRibbonVerts[base + 2] = x; edgeRibbonVerts[base + 3] =  1;  // top side
    }
    const edgeRibbonVbo = device.createBuffer({
      label: 'forge-edge-ribbon-vbo',
      size:  edgeRibbonVerts.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(edgeRibbonVbo, 0, edgeRibbonVerts);
    const EDGE_RIBBON_COUNT = (EDGE_SEGMENTS + 1) * 2;

    const edgePipeline = device.createRenderPipeline({
      label: 'forge-edge-pipeline',
      layout: device.createPipelineLayout({ bindGroupLayouts: [viewBgl] }),
      vertex: {
        module: edgeShaderModule, entryPoint: 'vs_main',
        buffers: [
          // [0] shared ribbon mesh — vec2 per vertex
          {
            arrayStride: 8, stepMode: 'vertex',
            attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
          },
          // [1] per-instance attributes — 12 floats = 48 bytes
          {
            arrayStride: 48, stepMode: 'instance',
            attributes: [
              { shaderLocation: 1, offset:  0, format: 'float32x4' }, // endpoints (sx, sy, tx, ty)
              { shaderLocation: 2, offset: 16, format: 'float32x4' }, // color (r, g, b, a)
              { shaderLocation: 3, offset: 32, format: 'float32x4' }, // extra (w, curve, bucketIdx, pad)
            ],
          },
        ],
      },
      fragment: {
        module: edgeShaderModule, entryPoint: 'fs_main',
        targets: [{ format, blend: premultBlend() }],
      },
      primitive: { topology: 'triangle-strip' },
    });

    // ── Instance buffers — managed by drawFrame() so the
    // renderer can grow them on demand and recycle storage. ──
    let nodeInstanceVbo = null;
    let nodeInstanceVboSize = 0;
    let edgeInstanceVbo = null;
    let edgeInstanceVboSize = 0;

    function ensureInstanceBuffer(currentBuf, currentSize, neededSize, label) {
      if (currentBuf && currentSize >= neededSize) return { buf: currentBuf, size: currentSize };
      // Destroy old (if any) — explicit release > GC for GPU memory.
      if (currentBuf && currentBuf.destroy) { try { currentBuf.destroy(); } catch (e) { /* ignore */ } }
      // Round up to a 4 KB chunk to reduce churn on small growth.
      const size = Math.max(4096, Math.ceil(neededSize / 4096) * 4096);
      const buf = device.createBuffer({
        label,
        size,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      return { buf, size };
    }

    // Clear color — matches --bg-0 (#07090f) in premultiplied alpha.
    const CLEAR_COLOR = { r: 0.0274, g: 0.0353, b: 0.0588, a: 1 };

    // ── Public API ────────────────────────────────────────
    const api = {
      device,
      context,
      format,
      canvas,
      EDGE_SEGMENTS,

      // Resize backing-store to css × DPR; re-configure context.
      resize(cssWidth, cssHeight) {
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(1, Math.floor(cssWidth  * dpr));
        const h = Math.max(1, Math.floor(cssHeight * dpr));
        if (canvas.width === w && canvas.height === h) return;
        canvas.width  = w;
        canvas.height = h;
        context.configure({ device, format, alphaMode: 'premultiplied' });
      },

      // ── Phase 1 diagnostic: single disk ────────────────
      drawDisk(pxX, pxY, pxR, color, viewportCss) {
        const dpr = window.devicePixelRatio || 1;
        const ndcX  = (pxX / viewportCss.w) * 2 - 1;
        const ndcY  = 1 - (pxY / viewportCss.h) * 2;
        const rNdcX = (pxR / viewportCss.w) * 2;
        const rNdcY = (pxR / viewportCss.h) * 2;
        const data = new Float32Array(12);
        data[0] = ndcX; data[1] = ndcY;
        data[2] = rNdcX; data[3] = rNdcY;
        data[4] = color[0]; data[5] = color[1]; data[6] = color[2];
        data[7] = (color[3] === undefined) ? 1 : color[3];
        data[8] = viewportCss.w * dpr; data[9] = viewportCss.h * dpr;
        device.queue.writeBuffer(diskUbo, 0, data);
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: CLEAR_COLOR, loadOp: 'clear', storeOp: 'store',
          }],
        });
        pass.setPipeline(diskPipeline);
        pass.setBindGroup(0, diskBg);
        pass.setVertexBuffer(0, quadVbo);
        pass.draw(6);
        pass.end();
        device.queue.submit([encoder.finish()]);
      },

      // ── Phase 2 hot path: full frame in one submission ─
      // @param frame {
      //   viewportCss:    { w, h }                    canvas CSS pixels
      //   worldExtent:    { x0, y0, x1, y1 }          world-space bbox to fit
      //   nodeInstances:  Float32Array (8 floats × N)
      //   edgeInstances:  Float32Array (12 floats × E)
      // }
      drawFrame(frame) {
        const vp   = frame.viewportCss;
        const ext  = frame.worldExtent;
        const nVB  = frame.nodeInstances;
        const eVB  = frame.edgeInstances;
        const nodeCount = nVB ? Math.floor(nVB.length / 8) : 0;
        const edgeCount = eVB ? Math.floor(eVB.length / 12) : 0;

        // ── View transform: world → NDC ──────────────────
        // Fit `worldExtent` into the viewport with letterbox.
        // NDC has Y up; canvas pixels have Y down → invert Y.
        const worldW = ext.x1 - ext.x0;
        const worldH = ext.y1 - ext.y0;
        const worldCx = (ext.x0 + ext.x1) * 0.5;
        const worldCy = (ext.y0 + ext.y1) * 0.5;
        // Choose uniform scale to fit (preserve aspect ratio).
        const aspect = vp.w / vp.h;
        // World units → NDC units: full NDC range is 2 (-1..1).
        // letterboxScale picks the smaller per-axis scale so the
        // whole worldExtent fits.
        const sxFit = 2 / worldW;
        const syFit = 2 / worldH;
        // Aspect-correct: when canvas is wider than world, shrink
        // X by the ratio so the world doesn't stretch.
        const worldAspect = worldW / worldH;
        let viewScaleX, viewScaleY;
        if (aspect > worldAspect) {
          // canvas wider than world — pillarbox
          viewScaleY = syFit;
          viewScaleX = syFit / aspect * worldAspect;
        } else {
          // canvas taller than world — letterbox
          viewScaleX = sxFit;
          viewScaleY = sxFit * aspect / worldAspect;
        }
        // Flip Y for NDC (canvas-up vs ndc-up).
        viewScaleY = -viewScaleY;
        // Offset: centre world in NDC.
        const viewOffsetX = -worldCx * viewScaleX;
        const viewOffsetY = -worldCy * viewScaleY;

        const viewData = new Float32Array(8);
        viewData[0] = viewScaleX;
        viewData[1] = viewScaleY;
        viewData[2] = viewOffsetX;
        viewData[3] = viewOffsetY;
        viewData[4] = vp.w * (window.devicePixelRatio || 1);
        viewData[5] = vp.h * (window.devicePixelRatio || 1);
        device.queue.writeBuffer(viewUbo, 0, viewData);

        // ── Grow + upload instance buffers ───────────────
        if (nodeCount > 0) {
          const r = ensureInstanceBuffer(nodeInstanceVbo, nodeInstanceVboSize, nVB.byteLength, 'forge-node-inst-vbo');
          nodeInstanceVbo = r.buf;
          nodeInstanceVboSize = r.size;
          device.queue.writeBuffer(nodeInstanceVbo, 0, nVB);
        }
        if (edgeCount > 0) {
          const r = ensureInstanceBuffer(edgeInstanceVbo, edgeInstanceVboSize, eVB.byteLength, 'forge-edge-inst-vbo');
          edgeInstanceVbo = r.buf;
          edgeInstanceVboSize = r.size;
          device.queue.writeBuffer(edgeInstanceVbo, 0, eVB);
        }

        // ── Encode + submit ──────────────────────────────
        const encoder = device.createCommandEncoder({ label: 'forge-frame' });
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: CLEAR_COLOR, loadOp: 'clear', storeOp: 'store',
          }],
        });

        // Edges first — drawn UNDER nodes (so node disks cover
        // edge endpoints cleanly). Premultiplied blending makes
        // overlapping faint edges sum into a softer atmosphere
        // rather than hard-stacking.
        if (edgeCount > 0) {
          pass.setPipeline(edgePipeline);
          pass.setBindGroup(0, viewBg);
          pass.setVertexBuffer(0, edgeRibbonVbo);
          pass.setVertexBuffer(1, edgeInstanceVbo);
          pass.draw(EDGE_RIBBON_COUNT, edgeCount);
        }

        // Nodes on top.
        if (nodeCount > 0) {
          pass.setPipeline(nodePipeline);
          pass.setBindGroup(0, viewBg);
          pass.setVertexBuffer(0, quadVbo);
          pass.setVertexBuffer(1, nodeInstanceVbo);
          pass.draw(6, nodeCount);
        }

        pass.end();
        device.queue.submit([encoder.finish()]);
      },

      destroy() {
        try { quadVbo.destroy(); }            catch (e) { /* ignore */ }
        try { edgeRibbonVbo.destroy(); }      catch (e) { /* ignore */ }
        try { diskUbo.destroy(); }            catch (e) { /* ignore */ }
        try { viewUbo.destroy(); }            catch (e) { /* ignore */ }
        if (nodeInstanceVbo) { try { nodeInstanceVbo.destroy(); } catch (e) { /* ignore */ } }
        if (edgeInstanceVbo) { try { edgeInstanceVbo.destroy(); } catch (e) { /* ignore */ } }
        try { device.destroy(); } catch (e) { /* ignore */ }
      },
    };

    return api;
  }

  window.AtlasEngineWebGPU = Object.freeze({ create });
})();
