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
  //   selected_size_mult       f32      — Phase 7: ×r for SELECTED instances
  //   selected_stroke_w        f32      — Phase 7: stroke band thickness (fraction of r)
  //   selected_stroke          vec4     — Phase 7: stroke RGBA (gold ring for SELECTED)
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
  // ============================================================
  //  NODE_SHADER  —  Phase 7 (2026-05-20)  —  HARD-CORE SIMPLE.
  // ============================================================
  //
  //  A node is ONE shape: a colored disk. Anti-aliased at the edge.
  //  ALWAYS OPAQUE inside the disk. No glow. No alpha tricks. No
  //  composited masks. No discard threshold catching dim disks.
  //
  //  Per-instance attributes drive everything:
  //
  //    state    in [0..1]   0 = focused, 1 = dim
  //    selected in [0..1]   1 = anchor (hovered or locked)
  //
  //  State table (4 visual states, 3 attributes):
  //
  //                    size           fill_rgb                  stroke
  //    IDLE      base           family_color                 none
  //    FOCUSED   base           family_color                 none
  //    SELECTED  base × 1.5     family_color                 gold ring
  //    DIM       base           family_color × (1 - dim)     none
  //
  //  Animation: state + selected animate as floats 0..1 in JS via
  //  tickNodeFades. The shader interpolates fill_rgb and the
  //  stroke mask along those floats; no pop-out at any threshold
  //  because nothing here is conditional on alpha crossing a value.
  //  The disk's alpha is 1.0 inside, with a single AA pixel at the
  //  edge — that's the only fractional alpha anywhere in the node.
  //
  //  What was deleted:
  //   - Glow halo (annulus, glow_a, glow_rgb, composite math)
  //   - Quad headroom (quad_scale = 1.5 × glow_outer) — quad is 1.0
  //   - discard_t threshold (no more "below 0.15 → vanish")
  //   - Alpha-based dim (dim_mult applied to alpha → killed disks)
  //
  //  What replaced them:
  //   - Color-based dim: dim_mult multiplies RGB; alpha stays 1.0
  //   - Selected stroke: solid ring drawn inside the disk's SDF
  //   - Single AA edge: smoothstep(1-aa, 1, dist) at the rim only
  // ============================================================
  const NODE_SHADER = /* wgsl */ `
    struct View {
      view_scale:             vec2<f32>,
      view_offset:            vec2<f32>,
      viewport_px:            vec2<f32>,
      dim_amount:             f32,
      wire_min_screen_px:     f32,
      wire_max_screen_px:     f32,
      dim_amount_nodes:       f32,    // Phase 7: darkens RGB, not alpha
      selected_size_mult:     f32,    // disk grows for selected
      selected_stroke_w:      f32,    // stroke band thickness, fraction of radius
      selected_stroke:        vec4<f32>,  // stroke RGBA (gold ring)
      bucket_hot_colors:      array<vec4<f32>, 7>,
      glyph_params:           vec4<f32>,
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
      // Quad matches the disk exactly. Selected disks grow by size_mult.
      // No glow → no headroom → no quad_scale. ONE shape, ONE radius.
      let size_mult = mix(1.0, v.selected_size_mult, inst_selected);
      let world     = inst_pos + quad_vertex * inst_radius * size_mult;
      let ndc       = world * v.view_scale + v.view_offset;
      // Depth: selected on top, focused middle, dim back.
      let z_focus = mix(0.3, 0.6, inst_state);
      let z       = mix(z_focus, 0.0, inst_selected);
      var out: VsOut;
      out.position   = vec4<f32>(ndc, z, 1.0);
      out.local_pos  = quad_vertex;
      out.inst_color = inst_color;
      out.state      = inst_state;
      out.sel        = inst_selected;
      return out;
    }

    @fragment
    fn fs_main(in: VsOut) -> @location(0) vec4<f32> {
      // SDF disk: alpha 1 inside, 0 outside, single AA pixel at edge.
      let dist       = length(in.local_pos);
      let aa         = fwidth(dist);
      let disk_alpha = 1.0 - smoothstep(1.0 - aa, 1.0, dist);
      if (disk_alpha < 0.01) { discard; }

      // ── State → alpha (Phase 9, 2026-05-20) ─────────────────
      //   IDLE  (state=0): alpha = 1.0          (full opaque)
      //   FADED (state=1): alpha = 1 - dim_amount_nodes  (e.g. 0.25)
      // Color stays the same in BOTH states. The family color is
      // the family color is the family color. Only the opacity
      // changes between IDLE and FADED. No RGB darkening. No mask
      // tricks. No discard threshold catching faded disks (the
      // discard floor was deleted in Phase 7).
      let state_alpha = mix(1.0, 1.0 - v.dim_amount_nodes, in.state);
      let rgb_fill    = in.inst_color.rgb;

      // Selected stroke (only painted when sel = 1).
      // The stroke band sits inside the disk's outer edge,
      // thickness = selected_stroke_w as a fraction of radius.
      let stroke_inner = 1.0 - v.selected_stroke_w;
      let stroke_band  = smoothstep(stroke_inner - aa, stroke_inner, dist);
      let stroke_mix   = in.sel * stroke_band;
      let rgb          = mix(rgb_fill, v.selected_stroke.rgb, stroke_mix);

      // Final alpha = state_alpha × disk_alpha.
      //   - state_alpha: 1.0 (idle/over) or 0.25 (faded)
      //   - disk_alpha:  1.0 inside, fades only at the 1-px AA edge
      let final_a = state_alpha * disk_alpha;
      // Premultiplied alpha output.
      return vec4<f32>(rgb * final_a, final_a);
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
      selected_stroke_w:      f32,
      selected_stroke:        vec4<f32>,
      bucket_hot_colors:      array<vec4<f32>, 7>,
      // Phase 5C (2026-05-20) — node-unified opacity. Both disk
      // and glyph share the same dim formula now (uniform-driven,
      // state-derived), so glyph opacity no longer needs CPU per-
      // frame computation. xy carries glyph_opacity + dim_amount_glyphs;
      // zw spare. Lives in the slot freed by collapsing the unused
      // 8th bucket entry (only 7 buckets are real).
      glyph_params:           vec4<f32>,
    };
    @group(0) @binding(0) var<uniform> v: View;

    struct VsOut {
      @builtin(position) position: vec4<f32>,
      @location(0) edge_y:       f32,
      @location(1) edge_color:   vec4<f32>,
      @location(2) state:        f32,
      @location(3) bucket_index: f32,    // interpolated; floor() in fs
      @location(4) edge_t:       f32,    // 0 at source, 1 at target — gradient direction
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
      // inst_extra.w = hot width.
      // Phase 6d4 — convention flip: state=0 → IDLE, state=1 → HOT.
      // mix(a, b, t) → a*(1-t) + b*t. So mix(idle, hot, state).
      let world_w_raw = mix(inst_extra.x, inst_extra.w, inst_state);
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
      // Phase 6d4 convention flip: state=0 IDLE → behind (z=0.85),
      // state=1 HOT → slightly forward (z=0.75) so a focused
      // incident edge isn't masked by a dimmed neighbour.
      let z = mix(0.85, 0.75, inst_state);
      out.position     = vec4<f32>(ndc, z, 1.0);
      out.edge_y       = quad_vertex.y;
      out.edge_color   = inst_color;
      out.state        = inst_state;
      out.bucket_index = inst_extra.z;
      out.edge_t       = t;
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
      // Phase 5C (2026-05-20) — clamp to 6 (was 7). The 8th vec4
      // slot in the View uniform was repurposed for glyph_params;
      // bucket count is now 7 (real bucket count anyway).
      let bidx     = clamp(i32(bidx_raw), 0, 6);
      let hot      = v.bucket_hot_colors[bidx];

      // Phase 6d4 convention flip:
      //   state=0 → IDLE (instance color = slate or headline-bucket idle).
      //   state=1 → HOT  (bucket hex at hot alpha).
      // Linear blend in between for any future fractional state.
      let color    = mix(in.edge_color, hot, in.state);
      // Dim multiplier: idle (state=0) is dimmed by dim_amount
      // when a focus is active. The view layer passes
      // dim_amount = 0 when no focus is active, so the idle
      // constellation isn't attenuated in the no-focus case.
      let dim_mult = mix(1.0 - v.dim_amount, 1.0, in.state);
      // 2026-05-19 — directional gradient. Every wire darkens
      // from source (in.edge_t=0) toward target (in.edge_t=1).
      // Eye-readable cue for edge direction + helps separate
      // wires that overlap or share endpoints. Multiplier mixes
      // 1.0 (no change at source) → 0.25 (75% darker at target).
      // First iteration shipped at 0.55 — John couldn't see the
      // darken on faint idle wires. Cranked to make the
      // direction unmissable; tunable from here.
      // Applies equally to IDLE and HOT — gradient is universal,
      // not state-dependent.
      // Phase 3B D2 (2026-05-20) — gradient applied to color RGB,
      // NOT alpha. Keeps the AA footprint constant from source to
      // target end while the visible color darkens. Intentional —
      // see AUDIT/forge-robustness-05-gpu-pipeline-2026-05-20.md
      // §P4: makes the wire-end blunt against the disk it
      // terminates into. DO NOT extend grad_mult to alpha.
      let grad_mult = mix(1.0, 0.25, in.edge_t);
      let a        = color.a * alpha_aa * dim_mult;
      // Phase 6d — same discard logic as nodes: AA halo fragments
      // shouldn't write depth, else they block disks behind them.
      if (a < 0.02) { discard; }
      return vec4<f32>(color.rgb * grad_mult * a, a);
    }
  `;

  // ============================================================
  // 2026-05-20 — GLYPH SHADER (instanced texture-atlas sample).
  // ============================================================
  // Replaces the old DOM-overlay glyph layer (~663 SVG spans
  // positioned every frame via JS — the perf cliff John discovered
  // when zooming out). One textured quad per node, sampled from a
  // pre-rasterized atlas containing all 17 type-glyph variants.
  //
  // Per-instance attrs:
  //   inst_pos_r_idx  vec4   xy=world center, z=disk radius, w=glyphIdx (0..16)
  //   inst_tint_alpha vec4   rgba — family tint × base alpha (× dim mult)
  //   inst_state      vec2   x=state(0=focused,1=dim), y=selected flag
  //                          REUSES nodeStateVbo — CROSS-PIPELINE
  //                          INVARIANT documented at the write site
  //                          (search "CROSS-PIPELINE INVARIANT" in
  //                          this file). DO NOT split the glyph pass
  //                          into a separate render pass.
  //
  // Uniform: a 32-entry array of vec4 UV rects (u0,v0,u1,v1) —
  // padded for headroom; only 17 used today.
  //
  // Depth (Phase 1B `bfc35d2` + Phase 4A doc-lock):
  //   - Glyph z = parent disk z EXACTLY.
  //   - selected glyph @ z=0.0; focused @ z=0.3; dim @ z=0.6.
  //   - Glyph pass draws AFTER nodes in the SAME render pass; at
  //     equal z, `depthCompare:'less-equal'` lets the later draw
  //     win. Across instances at different z, depth test correctly
  //     hides a dim glyph behind a focused-disk halo.
  //   - Relies on (a) pass order edges→nodes→glyphs, (b) all three
  //     in the same render pass, (c) `less-equal` not flipping to
  //     `less`. Each is a "convention not enforcement" — see the
  //     audit at AUDIT/forge-robustness-05-gpu-pipeline-2026-05-20.md
  //     §3 I1.
  //
  // Atlas (Phase 4B FX4): 128 px cell, full mip chain via
  // setGlyphAtlas; `mipmapFilter:'linear'` sampler now has a chain
  // to interpolate so Retina deep-zoom is sharp.
  // ============================================================
  const GLYPH_SHADER = /* wgsl */ `
    struct View {
      view_scale:             vec2<f32>,
      view_offset:            vec2<f32>,
      viewport_px:            vec2<f32>,
      dim_amount:             f32,
      wire_min_screen_px:     f32,
      wire_max_screen_px:     f32,
      dim_amount_nodes:       f32,
      selected_size_mult:     f32,
      selected_stroke_w:      f32,
      selected_stroke:        vec4<f32>,
      bucket_hot_colors:      array<vec4<f32>, 7>,
      // Phase 5C (2026-05-20) — node-unified opacity. Both disk
      // and glyph share the same dim formula now (uniform-driven,
      // state-derived), so glyph opacity no longer needs CPU per-
      // frame computation. xy carries glyph_opacity + dim_amount_glyphs;
      // zw spare. Lives in the slot freed by collapsing the unused
      // 8th bucket entry (only 7 buckets are real).
      glyph_params:           vec4<f32>,
    };
    @group(0) @binding(0) var<uniform> v: View;
    // 17 UV rects in atlas space — (u0,v0,u1,v1) per glyph type.
    struct GlyphUVs {
      rects: array<vec4<f32>, 32>,
    };
    @group(0) @binding(1) var<uniform> g: GlyphUVs;
    @group(0) @binding(2) var atlasTex: texture_2d<f32>;
    @group(0) @binding(3) var atlasSamp: sampler;

    struct VsOut {
      @builtin(position) position: vec4<f32>,
      @location(0) uv:    vec2<f32>,
      @location(1) tint:  vec4<f32>,
      // state (0 = focused/selected, 1 = dim) — drives the same
      // dim formula as the disk shader. Carried for color dim only;
      // no independent visibility rules (Phase 6A screen-size fade
      // and Phase 6B focus rule both DELETED in Phase 8).
      @location(2) state: f32,
    };

    // ============================================================
    //  Phase 8 (2026-05-20) — GLYPH NESTED WITH DISK.
    // ============================================================
    //  Glyph quad sits INSIDE the disk quad, sized at disk_radius
    //  × selected_size_mult (matches disk size growth) × glyph_scale
    //  (the constant 0.85 already baked into r_base in JS).
    //
    //  No independent visibility rules. If the disk renders, the
    //  glyph renders. Same family-color dim, same fade pipeline.
    //  No screen-size cutoff (Phase 6A DELETED). No focus rule
    //  (Phase 6B DELETED).
    //
    //  Tint: WHITE. The stencil reads as a clean white symbol
    //  inside the colored disk — Apple-icon style, universal
    //  contrast against any family color. No more pastel wash.
    //
    //  Dim follows the disk: when state=1, fill_rgb = white ×
    //  (1 - dim_amount_nodes), same shape as the disk. Glyph
    //  alpha stays 1.0 inside the stencil; only the color darkens.
    // ============================================================
    @vertex
    fn vs_main(
      @location(0) quad_vertex:     vec2<f32>,     // [-1, +1] per axis
      @location(1) inst_pos_r_idx:  vec4<f32>,     // xy=center, z=glyph_radius, w=glyphIdx
      @location(2) inst_tint_alpha: vec4<f32>,     // rgba (carried but unused — see fragment)
      @location(3) inst_state_sel:  vec2<f32>,     // .x = state, .y = selected
    ) -> VsOut {
      let center   = inst_pos_r_idx.xy;
      let r_base   = inst_pos_r_idx.z;            // already × glyph_scale in JS
      let idx_f    = inst_pos_r_idx.w;
      let idx      = clamp(i32(floor(idx_f + 0.5)), 0, 31);
      let state    = inst_state_sel.x;
      let selected = inst_state_sel.y;
      // Same size_mult as the disk → glyph grows with the disk
      // when selected. ONE growth rule shared with the disk.
      let size_mult = mix(1.0, v.selected_size_mult, selected);
      let r         = r_base * size_mult;
      let world     = center + quad_vertex * r;
      let ndc       = world * v.view_scale + v.view_offset;
      // Atlas UV from this type's rect.
      let rect = g.rects[idx];
      let uvX  = mix(rect.x, rect.z, (quad_vertex.x + 1.0) * 0.5);
      let uvY  = mix(rect.y, rect.w, (quad_vertex.y + 1.0) * 0.5);
      // Per-instance z = parent disk z exactly. Drawn AFTER disks
      // so equal-z passes less-equal depth test → glyph on top.
      let z_focus = mix(0.3, 0.6, state);
      let z       = mix(z_focus, 0.0, selected);
      var out: VsOut;
      out.position = vec4<f32>(ndc, z, 1.0);
      out.uv       = vec2<f32>(uvX, uvY);
      out.tint     = inst_tint_alpha;
      out.state    = state;
      return out;
    }

    @fragment
    fn fs_main(in: VsOut) -> @location(0) vec4<f32> {
      // Stencil alpha from the atlas. Where stencil is opaque,
      // tex.a ≈ 1; where transparent, tex.a ≈ 0.
      let tex = textureSample(atlasTex, atlasSamp, in.uv);
      if (tex.a < 0.02) { discard; }

      // Phase 9 (2026-05-20) — WHITE glyph, alpha-based fade.
      //   IDLE  (state=0): alpha = tex.a × 1.0    (full white symbol)
      //   FADED (state=1): alpha = tex.a × 0.25   (translucent symbol)
      // Same shape as the disk fragment: alpha changes, color stays
      // the same. No RGB darkening of the white symbol — just
      // opacity drop. Same family-color disk, same white symbol;
      // both fade together.
      let dim_g       = v.glyph_params.y;
      let state_alpha = mix(1.0, 1.0 - dim_g, in.state);
      let a           = tex.a * state_alpha;

      // Premultiplied alpha output. White symbol carved into the disk.
      return vec4<f32>(vec3<f32>(1.0, 1.0, 1.0) * a, a);
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

    // N3 (Phase 1B, 2026-05-20) — single OWNED resource list. Every
    // GPUBuffer + GPUTexture the renderer creates is registered via
    // own(). destroy() iterates this list before device.destroy()
    // so the cleanup is symmetric with creation. disown() removes
    // an entry — used by ensureBuffer + ensureDepthTex when an old
    // resource is being torn down to make room for a larger one.
    // Phase 3/4 will keep using this pattern as they add their own
    // resources; nothing here is layer-specific.
    const owned = [];
    const own    = (o) => { if (o) owned.push(o); return o; };
    const disown = (o) => {
      if (!o) return;
      const i = owned.indexOf(o);
      if (i >= 0) owned.splice(i, 1);
    };

    // N2 (Phase 1B, 2026-05-20) — write counter for the static node-
    // instance VBO. Exposed via api.debugCountNodeVboWrites(). With
    // the dirty-flag gate in place, this should increment only on
    // mode-switch / rebake / first-frame — NOT every drawFrame.
    let nodeInstanceWrites = 0;
    // Phase 3B F3 (2026-05-20) — matching counter for the edge
    // instance VBO. Same shape; verified via debugCountEdgeVboWrites().
    let edgeInstanceWrites = 0;
    // Phase 4B FX1 (2026-05-20) — matching counter for the glyph
    // instance VBO. Should equal rebake-count + fade-frame-count
    // + camera-change count (cull may shift) — NOT every drawFrame.
    let glyphInstanceWrites = 0;
    // Phase 4B FX4 (2026-05-20) — atlas diagnostic surface,
    // populated by setGlyphAtlas. Exposed via debugAtlasInfo().
    let atlasInfo = null;

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
    const quadVbo = own(device.createBuffer({
      label: 'forge-quad-vbo',
      size:  QUAD_VERTICES.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    }));
    device.queue.writeBuffer(quadVbo, 0, QUAD_VERTICES);

    // ── Phase 1 disk pipeline (diagnostic) ─────────────
    const diskUbo = own(device.createBuffer({
      label: 'forge-disk-ubo', size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }));
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
    // Phase 7 (2026-05-20) — same 192-byte layout, the trailing
    // SELECTED slot is now (size_mult, stroke_w, stroke RGBA) instead
    // of (size_mult, glow_strength, glow RGB + extent). Identical
    // binary layout — only the meaning of the values changed when
    // the glow halo was deleted and replaced by a solid stroke ring.
    const VIEW_UBO_SIZE = 192;
    const viewUbo = own(device.createBuffer({
      label: 'forge-view-ubo', size: VIEW_UBO_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }));
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
    const edgeRibbonVbo = own(device.createBuffer({
      label: 'forge-edge-ribbon-vbo',
      size:  edgeRibbonVerts.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    }));
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

    // ── Phase 7: GLYPH pipeline (2026-05-20) ──────────
    // Replaces the DOM glyph overlay with a textured-quad GPU
    // pass. Atlas of all 17 type-glyph variants sampled per
    // instance. See GLYPH_SHADER comment block for the depth
    // strategy + uniform layout.
    const glyphShaderModule = device.createShaderModule({ label: 'forge-glyph-shader', code: GLYPH_SHADER });
    // UV uniform: 32 vec4 rects × 16 bytes = 512 bytes (room for
    // 32 types; we use 17 today, headroom for future additions).
    const GLYPH_UV_UBO_SIZE = 512;
    const glyphUvUbo = own(device.createBuffer({
      label: 'forge-glyph-uv-ubo', size: GLYPH_UV_UBO_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }));
    // Dummy 1×1 atlas texture so the pipeline can bind before
    // setGlyphAtlas is called. Replaced by the real atlas at boot.
    let atlasTex = own(device.createTexture({
      label: 'forge-glyph-atlas',
      size: { width: 1, height: 1, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    }));
    const atlasSampler = device.createSampler({
      label: 'forge-glyph-sampler',
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });
    const glyphBgl = device.createBindGroupLayout({
      label: 'forge-glyph-bgl',
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.VERTEX,                            buffer: { type: 'uniform' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });
    function makeGlyphBindGroup() {
      return device.createBindGroup({
        label: 'forge-glyph-bg',
        layout: glyphBgl,
        entries: [
          { binding: 0, resource: { buffer: viewUbo } },
          { binding: 1, resource: { buffer: glyphUvUbo } },
          { binding: 2, resource: atlasTex.createView() },
          { binding: 3, resource: atlasSampler },
        ],
      });
    }
    let glyphBg = makeGlyphBindGroup();
    const glyphPipeline = device.createRenderPipeline({
      label: 'forge-glyph-pipeline',
      layout: device.createPipelineLayout({ bindGroupLayouts: [glyphBgl] }),
      vertex: {
        module: glyphShaderModule, entryPoint: 'vs_main',
        buffers: [
          // [0] shared quad mesh
          { arrayStride: 8, stepMode: 'vertex', attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] },
          // [1] per-instance: pos.xy, radius, glyphIdx | tint.rgba (32 bytes)
          { arrayStride: 32, stepMode: 'instance', attributes: [
              { shaderLocation: 1, offset:  0, format: 'float32x4' },
              { shaderLocation: 2, offset: 16, format: 'float32x4' },
          ] },
          // [2] per-instance state — SAME buffer as the node
          // pipeline's nodeStateVbo (state, selected) pairs.
          // 8 bytes per instance.
          { arrayStride: 8, stepMode: 'instance', attributes: [
              { shaderLocation: 3, offset: 0, format: 'float32x2' },
          ] },
        ],
      },
      fragment: {
        module: glyphShaderModule, entryPoint: 'fs_main',
        targets: [{ format, blend: premultBlend() }],
      },
      primitive: { topology: 'triangle-list' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less-equal' },
    });
    let glyphInstanceVbo = null, glyphInstanceVboSize = 0;

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
      if (depthTex) {
        disown(depthTex);
        try { depthTex.destroy(); } catch (e) { /* ignore */ }
      }
      depthTex = own(device.createTexture({
        label: 'forge-depth',
        size:  { width: fbW, height: fbH },
        format: 'depth24plus',
        usage:  GPUTextureUsage.RENDER_ATTACHMENT,
      }));
      depthTexW = fbW; depthTexH = fbH;
      return depthTex;
    }

    function ensureBuffer(current, currentSize, neededSize, label) {
      if (current && currentSize >= neededSize) return { buf: current, size: currentSize, grew: false };
      if (current && current.destroy) {
        disown(current);
        try { current.destroy(); } catch (e) { /* ignore */ }
      }
      const size = Math.max(4096, Math.ceil(neededSize / 4096) * 4096);
      // Phase 6d5 — COPY_SRC added so the debug readback methods
      // (debugReadEdgeStates / debugReadNodeStates) can use this
      // buffer as the source of a copyBufferToBuffer into a
      // MAP_READ staging buffer. Adding the flag is free for
      // non-readback usage.
      const buf = own(device.createBuffer({ label, size, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC }));
      return { buf, size, grew: true };
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

      // N2 (Phase 1B) — read-only counter for the static node-VBO
      // upload count since renderer creation. With the dirty-flag
      // gate, this should be ≈ rebake-count, not frame-count.
      debugCountNodeVboWrites() { return nodeInstanceWrites; },
      // Phase 3B F3 (2026-05-20) — same shape for edges.
      debugCountEdgeVboWrites() { return edgeInstanceWrites; },
      // Phase 4B FX1 (2026-05-20) — same shape for glyphs.
      debugCountGlyphVboWrites() { return glyphInstanceWrites; },
      // Phase 4B FX4 (2026-05-20) — atlas dimensions + mip count.
      // Returns null until setGlyphAtlas runs at boot.
      debugAtlasInfo() { return atlasInfo; },
      // Phase 1B — sanity-check the owned[] list. Returns the
      // count of live GPU resources tracked for cleanup.
      debugOwnedCount() { return owned.length; },

      // Write the 7-bucket hot-color palette into the renderer.
      // @param colors  Array of 7 [r, g, b, a] in [0, 1].
      //                Order MUST match the BUCKET_INDEX in
      //                src/js/engine/graph/edge.js:
      //                0:transmission 1:parallel 2:association
      //                3:kinship 4:attestation 5:polemic 6:fusion
      // Effect is immediate — applied on next drawFrame.
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

      // Phase 3B F2 (2026-05-20) — `forceWriteEdgeState` deleted.
      // It was a 2026-05-18 belt-and-braces hammer added before
      // the convention flip (`adjacency.js:87-94`) made zero-init
      // safe. With the flip, `recomputeFocus` writes JS-side
      // `local.edgeStates`; the next drawFrame uploads via the
      // standard path. No race-mitigation needed. See AUDIT/
      // forge-rebuild-3A-wires-2026-05-20.md §3 F2.

      // ── Phase 6d5 — GPU READBACK PROBE ────────────────────
      // Read the actual bytes currently sitting in the edge-state
      // VBO. This is the ground-truth probe for the recurring
      // "wires light up after resize" bug. The JS-side
      // `local.edgeStates` has been verified correct by every
      // prior fix attempt; the question is whether the GPU buffer
      // agrees. If JS says all-0 but GPU says all-1, we have a
      // write race / pipeline-state corruption. If both say all-0
      // and wires are still HOT, the bug is in the shader path
      // (uniform palette, bucket index, dim_amount, etc.).
      //
      // Uses a MAP_READ staging buffer + copyBufferToBuffer +
      // mapAsync. Async; returns a Promise<{ length, zeros, ones,
      // other, first20, last20, sampleHash }>.
      //
      // @param maxFloats  Optional cap on bytes copied (default = full buffer).
      //                   Useful if the buffer is huge and you only want a sample.
      async debugReadEdgeStates(maxFloats) {
        if (!edgeStateVbo) return { error: 'edgeStateVbo not yet allocated' };
        const floats = Math.min(
          (typeof maxFloats === 'number' && maxFloats > 0) ? maxFloats : 1e9,
          Math.floor(edgeStateVboSize / 4),
        );
        const bytes  = floats * 4;
        const staging = device.createBuffer({
          label: 'forge-edge-state-readback',
          size:  bytes,
          usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });
        const enc = device.createCommandEncoder({ label: 'forge-edge-state-readback-enc' });
        enc.copyBufferToBuffer(edgeStateVbo, 0, staging, 0, bytes);
        device.queue.submit([enc.finish()]);
        await staging.mapAsync(GPUMapMode.READ, 0, bytes);
        const view = new Float32Array(staging.getMappedRange(0, bytes).slice(0));
        staging.unmap();
        try { staging.destroy(); } catch (e) { /* ignore */ }
        let zeros = 0, ones = 0, other = 0;
        for (let i = 0; i < view.length; i++) {
          if      (view[i] === 0) zeros++;
          else if (view[i] === 1) ones++;
          else                    other++;
        }
        const first20 = Array.from(view.slice(0, 20));
        const last20  = Array.from(view.slice(Math.max(0, view.length - 20)));
        let h = 2166136261;     // FNV-1a sample hash so consecutive reads can be diffed
        for (let i = 0; i < view.length; i++) {
          h ^= Math.floor(view[i] * 1000);
          h = Math.imul(h, 16777619);
        }
        return {
          length: view.length,
          zeros, ones, other,
          first20, last20,
          sampleHash: (h >>> 0).toString(16),
          bufferSize: edgeStateVboSize,
        };
      },

      // ── Phase 6d5 — node-state readback (vec2 per instance) ──
      // Same pattern as debugReadEdgeStates, but for the node-state
      // VBO. Returns counts split by .x (state: 0=focused, 1=dimmed)
      // and .y (selected: 0/1). Helpful for diagnosing whether the
      // bug touches nodes too or is edges-only.
      async debugReadNodeStates(maxPairs) {
        if (!nodeStateVbo) return { error: 'nodeStateVbo not yet allocated' };
        const pairs = Math.min(
          (typeof maxPairs === 'number' && maxPairs > 0) ? maxPairs : 1e9,
          Math.floor(nodeStateVboSize / 8),
        );
        const bytes = pairs * 8;
        const staging = device.createBuffer({
          label: 'forge-node-state-readback',
          size:  bytes,
          usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });
        const enc = device.createCommandEncoder({ label: 'forge-node-state-readback-enc' });
        enc.copyBufferToBuffer(nodeStateVbo, 0, staging, 0, bytes);
        device.queue.submit([enc.finish()]);
        await staging.mapAsync(GPUMapMode.READ, 0, bytes);
        const view = new Float32Array(staging.getMappedRange(0, bytes).slice(0));
        staging.unmap();
        try { staging.destroy(); } catch (e) { /* ignore */ }
        let stateZ = 0, stateO = 0, stateX = 0, selZ = 0, selO = 0, selX = 0;
        for (let i = 0; i < view.length; i += 2) {
          const s = view[i], sl = view[i + 1];
          if      (s === 0) stateZ++; else if (s === 1) stateO++; else stateX++;
          if      (sl === 0) selZ++;  else if (sl === 1) selO++;  else selX++;
        }
        return {
          pairs: view.length / 2,
          state: { zeros: stateZ, ones: stateO, other: stateX },
          selected: { zeros: selZ, ones: selO, other: selX },
        };
      },

      // ── Phase 6d5 — bucket palette uniform readback ──
      // The view-uniform is what the edge fragment shader uses for
      // the HOT color lookup. If the wires render in HOT color but
      // the state buffer is all-0, the palette uniform itself must
      // hold the suspect values — read them here to compare against
      // `local.params.active_color_*`.
      bucketHotPalette() {
        // bucketPalette is a JS-side Float32Array kept in sync with
        // every setBucketPalette() call; we don't need a GPU readback.
        const out = [];
        for (let i = 0; i < 7; i++) {
          out.push([
            bucketPalette[i * 4 + 0],
            bucketPalette[i * 4 + 1],
            bucketPalette[i * 4 + 2],
            bucketPalette[i * 4 + 3],
          ]);
        }
        return out;
      },

      // 2026-05-20 — upload the glyph atlas to the GPU. Called
      // once at engine boot by the view layer after
      // `AtlasEngineGlyph.buildAtlas` resolves. `atlasCanvas` is
      // the mip-0 canvas; `mipCanvases` (Phase 4B FX4) is an array
      // of per-mip canvases at successively halved dimensions.
      // `uvRects` is a Float32Array of (u0,v0,u1,v1) tuples in
      // atlas-space [0,1] per glyph index.
      //
      // Phase 4B FX4 (2026-05-20) — mipmap support. The sampler
      // declares `mipmapFilter:'linear'` (`webgpu.js:700` area).
      // Without a mip chain that was a silent no-op; minification
      // fell back to bilinear, producing visible blur at deep
      // zoom on DPR=2/3 displays. We now allocate the texture
      // with `mipLevelCount = ceil(log2(maxDim)) + 1` and upload
      // each level from `mipCanvases`. Atlas-builder downsamples
      // via browser drawImage at high quality. Cost: ~280 KB
      // total vs ~70 KB pre-fix.
      setGlyphAtlas(atlasCanvas, uvRects, mipCanvases) {
        // Use the provided mip chain if given; fall back to the
        // single mip-0 atlas canvas (for older callers).
        const mips = (Array.isArray(mipCanvases) && mipCanvases.length)
          ? mipCanvases : [atlasCanvas];
        const w = atlasCanvas.width;
        const h = atlasCanvas.height;
        const mipLevelCount = mips.length;
        // Reallocate the texture at the actual atlas size, then
        // copy each mip level in.
        disown(atlasTex);
        try { atlasTex.destroy(); } catch (e) { /* ignore */ }
        atlasTex = own(device.createTexture({
          label: 'forge-glyph-atlas',
          size: { width: w, height: h, depthOrArrayLayers: 1 },
          format: 'rgba8unorm',
          mipLevelCount,
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        }));
        // Upload each mip level. copyExternalImageToTexture
        // handles rgba premultiply for each.
        for (let level = 0; level < mips.length; level++) {
          const mc = mips[level];
          device.queue.copyExternalImageToTexture(
            { source: mc, flipY: false },
            { texture: atlasTex, premultipliedAlpha: true, mipLevel: level },
            { width: mc.width, height: mc.height },
          );
        }
        // Upload UV rects to the uniform buffer (padded to 512 bytes).
        const uvData = new Float32Array(GLYPH_UV_UBO_SIZE / 4);
        uvData.set(uvRects.subarray(0, Math.min(uvRects.length, uvData.length)));
        device.queue.writeBuffer(glyphUvUbo, 0, uvData);
        // Re-bind the group since the texture handle changed.
        glyphBg = makeGlyphBindGroup();
        // Diagnostic surface for _forgeDebug.dumpAtlasInfo().
        atlasInfo = { width: w, height: h, mipLevelCount };
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
        // Phase 7 (2026-05-20) — SELECTED-state uniforms.
        //   size_mult   — disk grows for selected (e.g. 1.5×)
        //   stroke_w    — stroke band thickness, fraction of radius (e.g. 0.12)
        //   stroke_col  — gold stroke RGB. Replaces the deleted glow halo;
        //                 the disk now carries a solid ring at its edge.
        //   stroke_a    — alpha of the stroke (1.0 = fully opaque)
        const selSize    = (typeof frame.selectedSizeMult     === 'number') ? frame.selectedSizeMult     : 1.0;
        const selStrokeW = (typeof frame.selectedStrokeWidth  === 'number') ? frame.selectedStrokeWidth  : 0.12;
        const selStrokeC = frame.selectedStrokeColorRgb || [1, 0.91, 0.69];
        const selStrokeA = (typeof frame.selectedStrokeAlpha  === 'number') ? frame.selectedStrokeAlpha  : 1.0;
        // Phase 5C (2026-05-20) — glyph opacity uniforms. Same
        // role for glyphs that dim_amount_nodes plays for disks.
        // Caller (forge.js drawFrame) passes from local.params.
        const glyphOp   = (typeof frame.glyphOpacity     === 'number') ? frame.glyphOpacity     : 0.85;
        const glyphDim  = (typeof frame.dimAmountGlyphs  === 'number') ? frame.dimAmountGlyphs  : 0.7;

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
        // Phase 7 (2026-05-20) — selected slot now carries
        // (size_mult, stroke_w, stroke RGBA) instead of glow uniforms.
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
        viewData[11] = selStrokeW;
        viewData[12] = selStrokeC[0];
        viewData[13] = selStrokeC[1];
        viewData[14] = selStrokeC[2];
        viewData[15] = selStrokeA;
        // Bucket palette (7 × 4 floats = 28 floats) starts at
        // offset 16 (64 bytes). Phase 5C (2026-05-20) — the 8th
        // bucket slot was repurposed as glyph_params (slot 7 in
        // the bucketPalette mirror = floats 28..31). We write the
        // first 28 floats from the palette + override the last 4
        // with the glyph uniforms.
        viewData.set(bucketPalette, 16);
        viewData[44] = glyphOp;
        viewData[45] = glyphDim;
        viewData[46] = 0;
        viewData[47] = 0;
        device.queue.writeBuffer(viewUbo, 0, viewData);

        // ── Instance buffers (static geometry) ──────
        if (nodeCount > 0) {
          const r = ensureBuffer(nodeInstanceVbo, nodeInstanceVboSize, nVB.byteLength, 'forge-node-inst-vbo');
          nodeInstanceVbo = r.buf; nodeInstanceVboSize = r.size;
          // N2 (Phase 1B, 2026-05-20) — gate on the dirty flag
          // OR on a fresh allocation (r.grew). Static geometry
          // only changes on rebake / mode-switch; gating cuts a
          // ~21 KB upload at 663 nodes / ~106 MB/s saved at 10k.
          if (frame.nodeInstancesDirty || r.grew) {
            device.queue.writeBuffer(nodeInstanceVbo, 0, nVB);
            nodeInstanceWrites++;
          }
        }
        if (edgeCount > 0) {
          const r = ensureBuffer(edgeInstanceVbo, edgeInstanceVboSize, eVB.byteLength, 'forge-edge-inst-vbo');
          edgeInstanceVbo = r.buf; edgeInstanceVboSize = r.size;
          // Phase 3B F3 (2026-05-20) — gate on the dirty flag (or
          // grew). Mirrors the node-instance gate above. ~145 KB
          // upload at 3033 edges / ~2.16 MB at 45k edges per frame
          // saved when geometry is stable.
          if (frame.edgeInstancesDirty || r.grew) {
            device.queue.writeBuffer(edgeInstanceVbo, 0, eVB);
            edgeInstanceWrites++;
          }
        }

        // ── State buffers (dynamic) ──
        // Phase 6c: node state is now (state, selected) per
        // instance — 2 floats × 4 bytes = 8 bytes/instance.
        // ════════════════════════════════════════════════════════
        // CROSS-PIPELINE INVARIANT (Phase 1B / N5, 2026-05-20):
        // The glyph pass (later in this same encoder, search for
        // "setVertexBuffer(2, nodeStateVbo)" in the glyph dispatch
        // block) reads THIS buffer as its third vertex buffer so
        // glyphs inherit (state, selected) per node without a
        // duplicate VBO. The contract:
        //   1. nodeStateVbo must be allocated BEFORE the glyph
        //      pass tries to bind it (the `if (glyphCount > 0 &&
        //      nodeStateVbo)` guard handles this).
        //   2. nodeStateVbo must be WRITTEN above (this block) so
        //      the glyph pass reads correct data. WebGPU queue
        //      order: writeBuffer is enqueued before pass-encode,
        //      so this is sequenced correctly.
        //   3. nodeStateVbo length must be >= max(nodeCount,
        //      glyphCount) × 8 bytes. They're 1:1 today, so
        //      growing for nodeCount automatically suffices for
        //      glyphCount.
        // DO NOT split the glyph pass into a separate render pass,
        // re-order writes, or stop writing this buffer when nodes
        // are absent — every one of those silently breaks the
        // glyph (state, selected) channel and gets misdiagnosed
        // as a "fade animation bug." See AUDIT/forge-robustness-
        // 05-gpu-pipeline-2026-05-20.md §C1 + AUDIT/forge-rebuild-
        // 1A-node-atom-2026-05-20.md §3 N5.
        // ════════════════════════════════════════════════════════
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
        // 2026-05-20 — GPU glyph pass. Replaces the DOM glyph
        // overlay (which was the perf cliff John discovered when
        // zooming out). Each instance is 32 bytes (vec4 pos+r+idx,
        // vec4 tint+alpha). Atlas sampled per fragment, tinted by
        // instance attr. Renders AFTER disks so glyph paints on
        // top of its parent disk; z=0.02 in shader keeps it in
        // front of all disk z-layers (0.0 / 0.3 / 0.6).
        const glyphVB = frame.glyphInstances;
        const glyphCount = glyphVB ? Math.floor(glyphVB.length / 8) : 0;
        if (glyphCount > 0 && nodeStateVbo) {
          const r = ensureBuffer(glyphInstanceVbo, glyphInstanceVboSize, glyphVB.byteLength, 'forge-glyph-inst-vbo');
          glyphInstanceVbo = r.buf; glyphInstanceVboSize = r.size;
          // Phase 4B FX1 (2026-05-20) — gate on the dirty flag
          // (or grew). Mirrors node + edge gates above. Caller
          // sets glyphInstancesDirty=true after rebake / focus
          // change / fade tick / camera move; false at idle.
          // Saves ~21 KB/frame at deities / ~1.6 MB at 50k.
          if (frame.glyphInstancesDirty || r.grew) {
            device.queue.writeBuffer(glyphInstanceVbo, 0, glyphVB);
            glyphInstanceWrites++;
          }
          pass.setPipeline(glyphPipeline);
          pass.setBindGroup(0, glyphBg);
          pass.setVertexBuffer(0, quadVbo);
          pass.setVertexBuffer(1, glyphInstanceVbo);
          // [2] = same nodeStateVbo the node pipeline uses, so
          // glyphs get the same (state, selected) per instance
          // without duplicating data.
          pass.setVertexBuffer(2, nodeStateVbo);
          pass.draw(6, glyphCount);
        }

        pass.end();
        device.queue.submit([encoder.finish()]);
      },

      // N3 (Phase 1B, 2026-05-20) — symmetric destroy via the
      // owned[] list. Every device.createBuffer / createTexture
      // above was registered via own(); ensureBuffer + ensureDepthTex
      // disown the old before creating new on grow. So this single
      // loop covers every GPU resource the renderer has alive
      // (including atlasTex / glyphUvUbo / glyphInstanceVbo which
      // the prior explicit list silently leaked). device.destroy()
      // is still called after as a final hammer.
      destroy() {
        for (let i = 0; i < owned.length; i++) {
          const r = owned[i];
          if (r && r.destroy) {
            try { r.destroy(); } catch (e) { /* ignore */ }
          }
        }
        owned.length = 0;
        try { device.destroy(); } catch (e) { /* ignore */ }
      },
    };

    return api;
  }

  window.AtlasEngineWebGPU = Object.freeze({ create });
})();
