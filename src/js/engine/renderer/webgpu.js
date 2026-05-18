// ============================================================
// CODEX ATLAS — WEBGPU RENDERER (Phase 3)
// ============================================================
// The ONLY file in the engine that knows about WebGPU APIs.
// Everything above it talks through `engine/contract.js`.
//
// PHASE 3 ADDS
//   - Camera-driven world→NDC transform (per-frame view-uniform).
//     drawFrame now takes a camera state {centerX, centerY, scale}
//     instead of fitting to a worldExtent. The view layer drives
//     pan/zoom via the new src/js/engine/camera.js.
//   - Per-instance state attribute (one float per node + per edge).
//     0.0 = focused (full alpha), 1.0 = dimmed.
//     Updated on hover/lock change; uploaded as a small dynamic
//     buffer each frame. Fragment shaders attenuate alpha by
//     (1 - state * dimAmount).
//
// Earlier-phase primitives kept:
//   - Phase 1 single-disk pipeline (developer diagnostic).
//   - Phase 2 instanced disk + curved-edge pipelines.
// ============================================================

(function () {
  'use strict';

  // Shared 6-vertex quad for instanced disks.
  const QUAD_VERTICES = new Float32Array([
    -1, -1,   1, -1,  -1,  1,
    -1,  1,   1, -1,   1,  1,
  ]);

  // ============================================================
  // Phase 1: single-disk diagnostic shader (unchanged).
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
  // Shared view-uniform layout (consumed by NODE + EDGE shaders).
  //   view_scale          vec2     — (cam.scale*2/vp.w, -cam.scale*2/vp.h)
  //   view_offset         vec2     — (-cam.centerX*view_scale.x, -cam.centerY*view_scale.y)
  //   viewport_px              vec2     — backing-store dimensions (for AA)
  //   dim_amount               f32      — 0..1: edge dim
  //   wire_min_screen_px       f32      — Phase 6b: clamp stroke widths in FB px
  //   wire_max_screen_px       f32
  //   dim_amount_nodes         f32      — Phase 6c: separate node dim channel
  //   selected_size_mult       f32      — Phase 6c: ×r for SELECTED instances
  //   selected_glow_strength   f32      — Phase 6c: outer-ring alpha
  //   selected_glow            vec4     — xyz = glow color, w = glow extent (×r)
  //   bucket_hot_colors        [8]vec4  — bucket-hex at hot alpha, indexed by
  //                                       bucket_index 0..6 (slot 7 unused).
  //                                       0:transmission 1:parallel 2:association
  //                                       3:kinship 4:attestation 5:polemic 6:fusion
  // Total: 64 + 128 = 192 bytes (vec4-aligned).
  //
  // Phase 4a: bucket_hot_colors enables the edge fragment shader
  // to mix the per-instance idle color with the bucket-hot color
  // based on the per-instance focus state. Without this, focused
  // edges stay slate; with it, they light up in their bucket hue
  // when a user hovers a 1-hop neighborhood.
  // ============================================================

  // ============================================================
  // Phase 2 → 3: INSTANCED NODE shader with state attribute.
  // ============================================================
  const NODE_SHADER = /* wgsl */ `
    struct View {
      view_scale:             vec2<f32>,
      view_offset:            vec2<f32>,
      viewport_px:            vec2<f32>,
      dim_amount:             f32,    // edges
      wire_min_screen_px:     f32,
      wire_max_screen_px:     f32,
      dim_amount_nodes:       f32,    // Phase 6c
      selected_size_mult:     f32,
      selected_glow_strength: f32,
      selected_glow:          vec4<f32>,  // xyz = color, w = extent (×r)
      bucket_hot_colors:      array<vec4<f32>, 8>,
    };
    @group(0) @binding(0) var<uniform> v: View;

    struct VsOut {
      @builtin(position) position: vec4<f32>,
      @location(0) local_pos:  vec2<f32>,
      @location(1) inst_color: vec4<f32>,
      @location(2) state:      f32,
      @location(3) sel:        f32,
    };

    @vertex
    fn vs_main(
      @location(0) quad_vertex:    vec2<f32>,
      @location(1) inst_pos_r:     vec4<f32>,
      @location(2) inst_color:     vec4<f32>,
      @location(3) inst_state_sel: vec2<f32>,
    ) -> VsOut {
      let inst_pos      = inst_pos_r.xy;
      let inst_radius   = inst_pos_r.z;
      let inst_state    = inst_state_sel.x;
      let inst_selected = inst_state_sel.y;
      // Phase 6c — selected nodes grow + need quad room for the
      // glow ring. The quad spans local_pos ∈ [-quad_scale, quad_scale]
      // so the SDF distance equals 1 at the disk edge and equals
      // glow_extent at the glow's outer edge.
      let size_mult  = mix(1.0, v.selected_size_mult, inst_selected);
      let quad_scale = mix(1.0, v.selected_glow.w, inst_selected);
      let world      = inst_pos + quad_vertex * inst_radius * size_mult * quad_scale;
      let ndc        = world * v.view_scale + v.view_offset;
      // Phase 6d — depth-layer:
      //   selected (sel=1)   → z = 0.0  (closest, paints on top)
      //   highlighted (state=0)→ z = 0.3
      //   dimmed (state=1)   → z = 0.6
      let z_focus = mix(0.6, 0.3, 1.0 - inst_state);
      let z       = mix(z_focus, 0.0, inst_selected);
      var out: VsOut;
      out.position   = vec4<f32>(ndc, z, 1.0);
      out.local_pos  = quad_vertex * quad_scale;
      out.inst_color = inst_color;
      out.state      = inst_state;
      out.sel        = inst_selected;
      return out;
    }

    @fragment
    fn fs_main(in: VsOut) -> @location(0) vec4<f32> {
      let dist  = length(in.local_pos);
      let aa    = fwidth(dist);
      // Disk: SDF edge at dist=1.0 (independent of quad_scale —
      // the vs lifts local_pos into the same normalised frame).
      let disk_alpha = 1.0 - smoothstep(1.0 - aa, 1.0, dist);
      let c = in.inst_color;
      // Background dim — separate channel from edges so the user
      // can fade nodes harder than the wire constellation.
      let dim_mult = mix(1.0, 1.0 - v.dim_amount_nodes, in.state);
      let disk_a   = c.a * disk_alpha * dim_mult;
      let disk_rgb = c.rgb * disk_a;

      // Glow ring — only painted for SELECTED instances, only in
      // the annulus dist ∈ (1.0, glow_extent). Smooth fade on both
      // edges so it integrates with the disk's anti-aliasing.
      let glow_outer  = v.selected_glow.w;
      let glow_inner  = 1.0;
      let glow_fade   = (1.0 - smoothstep(glow_inner, glow_outer, dist))
                      * smoothstep(glow_inner - aa, glow_inner, dist);
      let glow_a      = in.sel * v.selected_glow_strength * glow_fade;
      let glow_rgb    = v.selected_glow.xyz * glow_a;

      // Composite the glow UNDER the disk (premultiplied alpha).
      let final_rgb = disk_rgb + glow_rgb * (1.0 - disk_a);
      let final_a   = disk_a   + glow_a   * (1.0 - disk_a);
      // Phase 6d — discard near-transparent fragments so they
      // don't write depth. Without this, the SDF anti-alias
      // halo of a dimmed disk would block focused disks behind
      // it (depth test less-equal). Threshold 0.04 = ~10/255.
      if (final_a < 0.04) { discard; }
      return vec4<f32>(final_rgb, final_a);
    }
  `;

  // ============================================================
  // Phase 2 → 3: INSTANCED EDGE shader with state attribute.
  // ============================================================
  const EDGE_SHADER = /* wgsl */ `
    struct View {
      view_scale:             vec2<f32>,
      view_offset:            vec2<f32>,
      viewport_px:            vec2<f32>,
      dim_amount:             f32,
      wire_min_screen_px:     f32,
      wire_max_screen_px:     f32,
      dim_amount_nodes:       f32,
      selected_size_mult:     f32,
      selected_glow_strength: f32,
      selected_glow:          vec4<f32>,
      bucket_hot_colors:      array<vec4<f32>, 8>,
    };
    @group(0) @binding(0) var<uniform> v: View;

    struct VsOut {
      @builtin(position) position: vec4<f32>,
      @location(0) edge_y:       f32,
      @location(1) edge_color:   vec4<f32>,
      @location(2) state:        f32,
      @location(3) bucket_index: f32,    // interpolated; floor() in fs
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
      @location(0) quad_vertex:    vec2<f32>,
      @location(1) inst_endpoints: vec4<f32>,
      @location(2) inst_color:     vec4<f32>,
      @location(3) inst_extra:     vec4<f32>,
      @location(4) inst_state:     f32,
    ) -> VsOut {
      let p0   = inst_endpoints.xy;
      let p2   = inst_endpoints.zw;
      let mid  = (p0 + p2) * 0.5;
      let p1   = mid + (vec2<f32>(0.0, 0.0) - mid) * inst_extra.y;
      let t    = (quad_vertex.x + 1.0) * 0.5;
      let pos  = bezier_pos(p0, p1, p2, t);
      let tan  = bezier_tan(p0, p1, p2, t);
      let tnorm = normalize(tan);
      let perp  = vec2<f32>(-tnorm.y, tnorm.x);
      // Phase 6: per-bucket idle + hot stroke widths are baked
      // into the instance attribute. inst_extra.x = idle width,
      // inst_extra.w = hot width. state=0 (focused) → use hot;
      // state=1 (idle) → use idle.
      let world_w_raw = mix(inst_extra.w, inst_extra.x, inst_state);
      // Phase 6b: zoom-aware clamp. Convert world width →
      // framebuffer-px (= cam.scale × DPR × world), clamp to
      // [wire_min_screen_px, wire_max_screen_px] (also in FB px),
      // then convert back to world units. Keeps strokes legible
      // at zoom-out + stops them bloating at zoom-in.
      let world_to_fb = v.view_scale.x * v.viewport_px.x * 0.5;
      let fb_w_raw    = world_w_raw * world_to_fb;
      let fb_w        = clamp(fb_w_raw, v.wire_min_screen_px, v.wire_max_screen_px);
      let world_w     = select(world_w_raw, fb_w / world_to_fb, world_to_fb > 0.0);
      let half_w      = world_w * 0.5;
      let world  = pos + perp * quad_vertex.y * half_w;
      let ndc = world * v.view_scale + v.view_offset;

      var out: VsOut;
      // Phase 6d — edges always paint BEHIND all nodes (z=0.8).
      // Within edges, hot (state=0) sits slightly forward of
      // idle (state=1) so a focused incident edge isn't masked
      // by a stale dimmed one in the same pass.
      let z = mix(0.75, 0.85, inst_state);
      out.position     = vec4<f32>(ndc, z, 1.0);
      out.edge_y       = quad_vertex.y;
      out.edge_color   = inst_color;
      out.state        = inst_state;
      out.bucket_index = inst_extra.z;
      return out;
    }

    @fragment
    fn fs_main(in: VsOut) -> @location(0) vec4<f32> {
      let aa = fwidth(in.edge_y);
      let alpha_aa = 1.0 - smoothstep(1.0 - aa, 1.0, abs(in.edge_y));

      // Bucket-hot color lookup. The bucket_index varies per-instance
      // (not per-vertex) so interpolation is exact; floor + clamp for
      // safety against float drift at instance boundaries.
      let bidx_raw = floor(in.bucket_index + 0.5);
      let bidx     = clamp(i32(bidx_raw), 0, 7);
      let hot      = v.bucket_hot_colors[bidx];

      // state=0 → fully hot (bucket hex at hot alpha).
      // state=1 → idle (instance color = slate or headline-bucket at idle alpha).
      // Linear blend in between for any future fractional state.
      let color    = mix(hot, in.edge_color, in.state);
      let dim_mult = mix(1.0, 1.0 - v.dim_amount, in.state);
      let a        = color.a * alpha_aa * dim_mult;
      // Phase 6d — same discard logic as nodes: AA halo fragments
      // shouldn't write depth, else they block disks behind them.
      if (a < 0.02) { discard; }
      return vec4<f32>(color.rgb * a, a);
    }
  `;

  function premultBlend() {
    return {
      color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
      alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    };
  }

  async function create(canvas) {
    if (!navigator.gpu) {
      throw new Error('WebGPU not available in this browser. '
        + 'Phase 1b will add a WebGL2 fallback; for now Forge '
        + 'requires WebGPU (Chrome 113+, Safari 18+, Firefox '
        + 'Nightly with dom.webgpu.enabled).');
    }

    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) {
      throw new Error('No GPU adapter found. Check Chrome about://gpu '
        + 'for WebGPU status. On macOS the integrated GPU is fine.');
    }

    const device  = await adapter.requestDevice();
    device.addEventListener('uncapturederror', (e) => {
      console.error('[forge.webgpu] uncaptured GPU error:', e.error);
    });

    const context = canvas.getContext('webgpu');
    const format  = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'premultiplied' });

    // ── Shader compilation ────────────────────────────────
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

    // ── Shared quad VBO ─────────────────────────────────
    const quadVbo = device.createBuffer({
      label: 'forge-quad-vbo',
      size:  QUAD_VERTICES.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(quadVbo, 0, QUAD_VERTICES);

    // ── Phase 1 disk pipeline (diagnostic) ─────────────
    const diskUbo = device.createBuffer({
      label: 'forge-disk-ubo', size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const diskBgl = device.createBindGroupLayout({
      entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }],
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

    // ── Shared view-uniform ────────────────────────────
    // 192 bytes: 64-byte view header + 128-byte bucket palette (8 × vec4).
    // Phase 6c grew the header 176→192: added dim_amount_nodes,
    // selected_size_mult, selected_glow_strength + selected_glow
    // (vec4 = rgb + extent).
    const VIEW_UBO_SIZE = 192;
    const viewUbo = device.createBuffer({
      label: 'forge-view-ubo', size: VIEW_UBO_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const viewBgl = device.createBindGroupLayout({
      entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }],
    });
    const viewBg = device.createBindGroup({
      layout: viewBgl,
      entries: [{ binding: 0, resource: { buffer: viewUbo } }],
    });

    // ── Phase 3: NODE pipeline with state attribute ──
    const nodePipeline = device.createRenderPipeline({
      label: 'forge-node-pipeline',
      layout: device.createPipelineLayout({ bindGroupLayouts: [viewBgl] }),
      vertex: {
        module: nodeShaderModule, entryPoint: 'vs_main',
        buffers: [
          // [0] shared quad
          { arrayStride: 8, stepMode: 'vertex', attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] },
          // [1] per-instance (pos+radius+pad, color)
          { arrayStride: 32, stepMode: 'instance', attributes: [
              { shaderLocation: 1, offset:  0, format: 'float32x4' },
              { shaderLocation: 2, offset: 16, format: 'float32x4' },
          ] },
          // [2] per-instance (state, selected) — Phase 6c bumped
          // from a single f32 (state only) to a vec2: state in .x,
          // selected flag in .y. Same VBO, just twice as wide.
          { arrayStride: 8, stepMode: 'instance', attributes: [
              { shaderLocation: 3, offset: 0, format: 'float32x2' },
          ] },
        ],
      },
      fragment: {
        module: nodeShaderModule, entryPoint: 'fs_main',
        targets: [{ format, blend: premultBlend() }],
      },
      primitive: { topology: 'triangle-list' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less-equal' },
    });

    // ── Phase 3: EDGE pipeline with state attribute ──
    const EDGE_SEGMENTS = 32;
    const edgeRibbonVerts = new Float32Array((EDGE_SEGMENTS + 1) * 2 * 2);
    for (let i = 0; i <= EDGE_SEGMENTS; i++) {
      const t = i / EDGE_SEGMENTS;
      const x = t * 2 - 1;
      const base = i * 4;
      edgeRibbonVerts[base + 0] = x; edgeRibbonVerts[base + 1] = -1;
      edgeRibbonVerts[base + 2] = x; edgeRibbonVerts[base + 3] =  1;
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
          // [0] ribbon mesh
          { arrayStride: 8, stepMode: 'vertex', attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] },
          // [1] per-instance (endpoints, color, extra)
          { arrayStride: 48, stepMode: 'instance', attributes: [
              { shaderLocation: 1, offset:  0, format: 'float32x4' },
              { shaderLocation: 2, offset: 16, format: 'float32x4' },
              { shaderLocation: 3, offset: 32, format: 'float32x4' },
          ] },
          // [2] per-instance state (single float)
          { arrayStride: 4, stepMode: 'instance', attributes: [
              { shaderLocation: 4, offset: 0, format: 'float32' },
          ] },
        ],
      },
      fragment: {
        module: edgeShaderModule, entryPoint: 'fs_main',
        targets: [{ format, blend: premultBlend() }],
      },
      primitive: { topology: 'triangle-strip' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less-equal' },
    });

    // ── Instance buffers ─────────────────────────────
    let nodeInstanceVbo     = null, nodeInstanceVboSize     = 0;
    let nodeStateVbo        = null, nodeStateVboSize        = 0;
    let edgeInstanceVbo     = null, edgeInstanceVboSize     = 0;
    let edgeStateVbo        = null, edgeStateVboSize        = 0;
    // Phase 6d — depth attachment for z-layering. Selected
    // nodes paint on top of highlighted on top of dimmed; edges
    // paint behind all nodes. See vs_main z-writes per shader.
    let depthTex = null;
    let depthTexW = 0, depthTexH = 0;
    function ensureDepthTex(fbW, fbH) {
      if (depthTex && depthTexW === fbW && depthTexH === fbH) return depthTex;
      if (depthTex) { try { depthTex.destroy(); } catch (e) { /* ignore */ } }
      depthTex = device.createTexture({
        label: 'forge-depth',
        size:  { width: fbW, height: fbH },
        format: 'depth24plus',
        usage:  GPUTextureUsage.RENDER_ATTACHMENT,
      });
      depthTexW = fbW; depthTexH = fbH;
      return depthTex;
    }

    function ensureBuffer(current, currentSize, neededSize, label) {
      if (current && currentSize >= neededSize) return { buf: current, size: currentSize };
      if (current && current.destroy) { try { current.destroy(); } catch (e) { /* ignore */ } }
      const size = Math.max(4096, Math.ceil(neededSize / 4096) * 4096);
      const buf = device.createBuffer({ label, size, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
      return { buf, size };
    }

    const CLEAR_COLOR = { r: 0.0274, g: 0.0353, b: 0.0588, a: 1 };

    // ── Bucket palette storage (Phase 4a hot-edge brighten) ─
    // Float32Array of 8 × 4 = 32 floats. Indexed at the bucket-
    // hot-colors offset (32 bytes into the view-uniform). The
    // view module writes this once via setBucketPalette() during
    // bootstrap; drawFrame copies it into the view-uniform along
    // with the per-frame camera data.
    const bucketPalette = new Float32Array(32);
    // Default: slate for all (safe fallback if the view forgets
    // to call setBucketPalette before drawFrame). 0.85 alpha so
    // a focused edge is at least clearly visible.
    for (let i = 0; i < 8; i++) {
      bucketPalette[i * 4 + 0] = 80 / 255;
      bucketPalette[i * 4 + 1] = 95 / 255;
      bucketPalette[i * 4 + 2] = 130 / 255;
      bucketPalette[i * 4 + 3] = 0.85;
    }

    // ── Public API ──────────────────────────────────
    const api = {
      device, context, format, canvas,
      EDGE_SEGMENTS,

      // Write the 7-bucket hot-color palette into the renderer.
      // @param colors  Array of 7 [r, g, b, a] in [0, 1].
      //                Order MUST match the BUCKET_INDEX in
      //                src/js/engine/graph/edge.js:
      //                0:transmission 1:parallel 2:association
      //                3:kinship 4:attestation 5:polemic 6:fusion
      // Effect is immediate — applied on next drawFrame. Safe to
      // call from a dev-panel slider without bouncing the renderer.
      setBucketPalette(colors) {
        if (!Array.isArray(colors)) return;
        for (let i = 0; i < Math.min(colors.length, 7); i++) {
          const c = colors[i];
          if (!c) continue;
          bucketPalette[i * 4 + 0] = +c[0] || 0;
          bucketPalette[i * 4 + 1] = +c[1] || 0;
          bucketPalette[i * 4 + 2] = +c[2] || 0;
          bucketPalette[i * 4 + 3] = (c[3] === undefined) ? 0.9 : +c[3];
        }
      },

      resize(cssW, cssH) {
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(1, Math.floor(cssW * dpr));
        const h = Math.max(1, Math.floor(cssH * dpr));
        if (canvas.width === w && canvas.height === h) return;
        canvas.width  = w;
        canvas.height = h;
        context.configure({ device, format, alphaMode: 'premultiplied' });
      },

      // Phase 6d3 — guarantee the edge-state VBO holds exactly
      // `stateData` (an N-length Float32Array, one float per
      // edge). Called from the view layer's resize path as a
      // hard-stop against any pipeline-state corruption that
      // might leave non-focused wires painting in their ACTIVE
      // (hot) colour. No-op if buffer not yet allocated.
      forceWriteEdgeState(stateData) {
        if (!edgeStateVbo || !stateData || !stateData.length) return;
        const stateBytes = stateData.length * 4;
        const r = ensureBuffer(edgeStateVbo, edgeStateVboSize, stateBytes, 'forge-edge-state-vbo');
        edgeStateVbo = r.buf; edgeStateVboSize = r.size;
        device.queue.writeBuffer(edgeStateVbo, 0, stateData, 0, stateData.length);
      },

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

      // ── Hot path: camera-driven frame render ──────
      // @param frame {
      //   viewportCss:    { w, h }
      //   camera:         { centerX, centerY, scale }
      //   dimAmount:      0..1 (default 0.85)
      //   nodeInstances:  Float32Array — 8 floats × N (static)
      //   edgeInstances:  Float32Array — 12 floats × E (static)
      //   nodeStates:     Float32Array — 1 float × N  (dynamic; null = all zeros)
      //   edgeStates:     Float32Array — 1 float × E  (dynamic; null = all zeros)
      // }
      drawFrame(frame) {
        const vp   = frame.viewportCss;
        const cam  = frame.camera;
        const dimA = (typeof frame.dimAmount       === 'number') ? frame.dimAmount       : 0.85;
        const dimN = (typeof frame.dimAmountNodes  === 'number') ? frame.dimAmountNodes  : dimA;
        // Phase 6b: wire-width zoom clamp. JS-side values are
        // CSS px; the uniform stores framebuffer px so the shader
        // can compare against the world×view-scale projection
        // (which is also FB px).
        const dpr  = window.devicePixelRatio || 1;
        const wMin = (typeof frame.wireMinScreenPx === 'number') ? frame.wireMinScreenPx * dpr : 0;
        const wMax = (typeof frame.wireMaxScreenPx === 'number') ? frame.wireMaxScreenPx * dpr : 1e9;
        // Phase 6c — SELECTED-state uniforms.
        const selSize = (typeof frame.selectedSizeMult     === 'number') ? frame.selectedSizeMult     : 1.0;
        const selStr  = (typeof frame.selectedGlowStrength === 'number') ? frame.selectedGlowStrength : 0.0;
        const selExt  = (typeof frame.selectedGlowExtent   === 'number') ? frame.selectedGlowExtent   : 1.5;
        const selCol  = frame.selectedGlowColorRgb || [1, 1, 1];

        const nVB  = frame.nodeInstances;
        const eVB  = frame.edgeInstances;
        const nodeCount = nVB ? Math.floor(nVB.length / 8) : 0;
        const edgeCount = eVB ? Math.floor(eVB.length / 12) : 0;

        // ── View transform from camera ─────────────
        const viewScaleX =  cam.scale * 2 / vp.w;
        const viewScaleY = -cam.scale * 2 / vp.h;  // Y flip
        const viewOffsetX = -cam.centerX * viewScaleX;
        const viewOffsetY = -cam.centerY * viewScaleY;

        // 192-byte view-uniform: 64-byte header + 128-byte bucket palette.
        // Phase 6c grew the header 176→192 (added dim_nodes,
        // selected_size_mult, selected_glow_strength + vec4 glow).
        const viewData = new Float32Array(48);  // 192 / 4
        viewData[0]  = viewScaleX;
        viewData[1]  = viewScaleY;
        viewData[2]  = viewOffsetX;
        viewData[3]  = viewOffsetY;
        viewData[4]  = vp.w * dpr;
        viewData[5]  = vp.h * dpr;
        viewData[6]  = dimA;
        viewData[7]  = wMin;
        viewData[8]  = wMax;
        viewData[9]  = dimN;
        viewData[10] = selSize;
        viewData[11] = selStr;
        viewData[12] = selCol[0];
        viewData[13] = selCol[1];
        viewData[14] = selCol[2];
        viewData[15] = selExt;
        // Bucket palette (8 × 4 floats) starts at offset 16 (64 bytes).
        viewData.set(bucketPalette, 16);
        device.queue.writeBuffer(viewUbo, 0, viewData);

        // ── Instance buffers (static geometry) ──────
        if (nodeCount > 0) {
          const r = ensureBuffer(nodeInstanceVbo, nodeInstanceVboSize, nVB.byteLength, 'forge-node-inst-vbo');
          nodeInstanceVbo = r.buf; nodeInstanceVboSize = r.size;
          device.queue.writeBuffer(nodeInstanceVbo, 0, nVB);
        }
        if (edgeCount > 0) {
          const r = ensureBuffer(edgeInstanceVbo, edgeInstanceVboSize, eVB.byteLength, 'forge-edge-inst-vbo');
          edgeInstanceVbo = r.buf; edgeInstanceVboSize = r.size;
          device.queue.writeBuffer(edgeInstanceVbo, 0, eVB);
        }

        // ── State buffers (dynamic) ──
        // Phase 6c: node state is now (state, selected) per
        // instance — 2 floats × 4 bytes = 8 bytes/instance.
        if (nodeCount > 0) {
          const stateBytes = nodeCount * 8;
          const r = ensureBuffer(nodeStateVbo, nodeStateVboSize, stateBytes, 'forge-node-state-vbo');
          nodeStateVbo = r.buf; nodeStateVboSize = r.size;
          const stateData = frame.nodeStates || new Float32Array(nodeCount * 2);
          device.queue.writeBuffer(nodeStateVbo, 0, stateData, 0, Math.floor(stateBytes / 4));
        }
        if (edgeCount > 0) {
          const stateBytes = edgeCount * 4;
          const r = ensureBuffer(edgeStateVbo, edgeStateVboSize, stateBytes, 'forge-edge-state-vbo');
          edgeStateVbo = r.buf; edgeStateVboSize = r.size;
          const stateData = frame.edgeStates || new Float32Array(edgeCount);
          device.queue.writeBuffer(edgeStateVbo, 0, stateData, 0, Math.floor(stateBytes / 4));
        }

        // ── Encode + submit ───────────────────────────
        const encoder = device.createCommandEncoder({ label: 'forge-frame' });
        const dTex = ensureDepthTex(canvas.width, canvas.height);
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: CLEAR_COLOR, loadOp: 'clear', storeOp: 'store',
          }],
          depthStencilAttachment: {
            view: dTex.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
          },
        });

        if (edgeCount > 0) {
          pass.setPipeline(edgePipeline);
          pass.setBindGroup(0, viewBg);
          pass.setVertexBuffer(0, edgeRibbonVbo);
          pass.setVertexBuffer(1, edgeInstanceVbo);
          pass.setVertexBuffer(2, edgeStateVbo);
          pass.draw(EDGE_RIBBON_COUNT, edgeCount);
        }
        if (nodeCount > 0) {
          pass.setPipeline(nodePipeline);
          pass.setBindGroup(0, viewBg);
          pass.setVertexBuffer(0, quadVbo);
          pass.setVertexBuffer(1, nodeInstanceVbo);
          pass.setVertexBuffer(2, nodeStateVbo);
          pass.draw(6, nodeCount);
        }

        pass.end();
        device.queue.submit([encoder.finish()]);
      },

      destroy() {
        try { quadVbo.destroy(); }          catch (e) { /* ignore */ }
        try { edgeRibbonVbo.destroy(); }    catch (e) { /* ignore */ }
        try { diskUbo.destroy(); }          catch (e) { /* ignore */ }
        try { viewUbo.destroy(); }          catch (e) { /* ignore */ }
        if (nodeInstanceVbo) { try { nodeInstanceVbo.destroy(); } catch (e) { /* ignore */ } }
        if (edgeInstanceVbo) { try { edgeInstanceVbo.destroy(); } catch (e) { /* ignore */ } }
        if (nodeStateVbo)    { try { nodeStateVbo.destroy(); }    catch (e) { /* ignore */ } }
        if (edgeStateVbo)    { try { edgeStateVbo.destroy(); }    catch (e) { /* ignore */ } }
        if (depthTex)        { try { depthTex.destroy(); }        catch (e) { /* ignore */ } }
        try { device.destroy(); } catch (e) { /* ignore */ }
      },
    };

    return api;
  }

  window.AtlasEngineWebGPU = Object.freeze({ create });
})();
