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
      // ROUND-7 DRESS (2026-07-26) — the node-lab recipe as uniforms.
      // recipe_b.x (hover_zoom) >= 1 is the "recipe active" switch:
      // when the view does not send a recipe, all four vec4s are 0
      // and every dress term multiplies away (honest zeros) — the
      // shader renders the legacy Phase-7 look exactly.
      recipe_a:               vec4<f32>,  // glow, pulse, glow_reach, gate_px (FB px)
      recipe_b:               vec4<f32>,  // hover_zoom, click_zoom, bubble, ether
      recipe_c:               vec4<f32>,  // time_sec, fin_strength, cursor_world.xy
      recipe_d:               vec4<f32>,  // irid_on, chroma_on, chroma_px (FB), gate_slope_px (FB)
      recipe_e:               vec4<f32>,  // core_white, core_alpha, ring_alpha, dpr
      // FULL-TRANSCRIPTION (2026-07-27) — the lens recipe. .w is the
      // needsBackdrop flag: 0 unless an orb cast is live AND the
      // backdrop texture holds this frame's ground+wires.
      recipe_f:               vec4<f32>,  // mag, frost_fb_px, depth, backdrop_live
      // THE HOUSE (2026-07-30) — family-isolate layout ramp. .x is
      // the ONLY live channel (yzw spare, vec4 for alignment). Every
      // instance carries a second position (buffer B, the tree);
      // world = mix(posA, posB, layout_mix.x). HONEST ZEROS: with no
      // isolate the uniform is 0 and mix(a,b,0)=a·1+b·0 — buffer A
      // (the wheel) renders exactly; B is a zero-initialized buffer.
      layout_mix:             vec4<f32>,
    };
    @group(0) @binding(0) var<uniform> v: View;
    // Bound only by the BODY pipeline (the orb lens samples the
    // backdrop = ground + wires, never rings — the lab's O contract).
    // fs_glow/vs_glow never reference these, so the glow pipeline's
    // ubo-only layout stays valid (static-usage is per entry point).
    @group(0) @binding(1) var backdrop_tex:  texture_2d<f32>;
    @group(0) @binding(2) var backdrop_samp: sampler;

    // ── THE LIGHT-ALPHA LAW (2026-07-29) ────────────────────────
    // The forge canvas is TRANSPARENT (Phase 20G: clear alpha 0, the
    // page ground sits behind it). A premultiplied pixel with rgb > a
    // is INVALID: at the canvas -> page composite the browser clamps
    // it, so pure light emitted with alpha 0 was ERASED wherever
    // nothing opaque had been drawn beneath. That is why glow only
    // ever appeared ON the wires/rings and vanished over the void.
    // Every added photon must therefore carry its own coverage:
    // alpha accumulates screen-wise from the light's luminance, so
    // light floats on emptiness and never double-counts where it
    // overlaps material already drawn.
    fn add_light(acc: vec4<f32>, x: vec3<f32>) -> vec4<f32> {
      let l = clamp(max(max(x.r, x.g), x.b), 0.0, 1.0);
      return vec4<f32>(acc.rgb + x, acc.a + l * (1.0 - acc.a));
    }

    struct VsOut {
      @builtin(position) position: vec4<f32>,
      @location(0) local_pos:  vec2<f32>,
      @location(1) inst_color: vec4<f32>,
      @location(2) state:      f32,
      @location(3) sel:        f32,
      @location(4) wake:       f32,
      @location(5) dmeta:      vec4<f32>,  // quad_scale, grown radius in FB px, dress_id, locked ('meta' is WGSL-reserved)
      @location(6) world_pos:  vec2<f32>,
      @location(7) center_fb:  vec2<f32>,  // node center in framebuffer px (lens sampling)
    };

    @vertex
    fn vs_main(
      @location(0) quad_vertex:    vec2<f32>,
      @location(1) inst_pos_r:     vec4<f32>,
      @location(2) inst_color:     vec4<f32>,
      @location(3) inst_sswd:      vec4<f32>,
      @location(4) inst_pos_b:     vec4<f32>,
    ) -> VsOut {
      // THE HOUSE — mix() is exact at both ends (t=0 → a·1+b·0 = a;
      // t=1 → a·0+b·1 = b), so rest states are bit-true positions.
      // 2026-07-30 SCALE pass: position-B carries a RADIUS lane too
      // (xy = tree position, z = house radius) — gods GROW as the
      // layout ramps in. At mix 0 the B term multiplies away exactly:
      // the wheel renders byte-identically (honest zeros).
      let inst_pos      = mix(inst_pos_r.xy, inst_pos_b.xy, v.layout_mix.x);
      let inst_radius   = mix(inst_pos_r.z, inst_pos_b.z, v.layout_mix.x);
      let inst_state    = inst_sswd.x;
      let inst_selected = inst_sswd.y;
      let wake          = clamp(inst_sswd.z, 0.0, 1.0);
      // .w packs dress_id (0..4) + 8*locked — one float, two facts.
      let packed        = inst_sswd.w;
      let locked        = select(0.0, 1.0, packed >= 8.0);
      let dress_id      = packed - locked * 8.0;
      // Zoom: the recipe's hover/click zooms ride the anchor (selected)
      // flag — wake neighbors glow but do not zoom (lab law). When no
      // recipe is active, fall back to the legacy selected_size_mult.
      let use_recipe = step(1.0, v.recipe_b.x);
      let hz   = max(v.recipe_b.x, 1.0);
      let cz   = max(v.recipe_b.y, hz);
      let zoom = 1.0 + (mix(hz, cz, locked) - 1.0) * inst_selected * wake;
      let legacy_grow = mix(1.0, v.selected_size_mult, inst_selected);
      let grow = mix(legacy_grow, zoom, use_recipe);
      // Quad headroom (REVIEW-corrected): veil truly reaches
      // 1.61×bubble (bubble ≤1.5 ⇒ 2.42) and chroma lobes extend past
      // the bubble — 2.75 covers the worst lab-legal recipe. Rest
      // nodes get 1.15 under the recipe so tiny rings don't clip on
      // 4 sides (legacy rest stays exactly 1.0 — honest zeros).
      let quad_scale = mix(1.0 + 0.15 * use_recipe, 2.75, clamp(wake * 4.0, 0.0, 1.0) * use_recipe);
      let world     = inst_pos + quad_vertex * inst_radius * grow * quad_scale;
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
      out.wake       = wake * use_recipe;
      let r_px_fb    = inst_radius * grow * (v.view_scale.x * v.viewport_px.x * 0.5);
      out.dmeta      = vec4<f32>(quad_scale, r_px_fb, dress_id, locked);
      out.world_pos  = inst_pos;
      // node center in FB px (y flips: ndc is y-up, frag coords y-down)
      let c_ndc = inst_pos * v.view_scale + v.view_offset;
      out.center_fb = vec2<f32>((c_ndc.x * 0.5 + 0.5) * v.viewport_px.x,
                                (0.5 - c_ndc.y * 0.5) * v.viewport_px.y);
      return out;
    }

    // ── ROUND-7 DRESS fragment (2026-07-26) ─────────────────────
    // The node is the CANONICAL RING (ring band at 0.86r + core dot
    // at 0.32r — the lab's drawRing), wearing one of five full-body
    // light dresses while awake: 0 HALO · 1 ICON · 2 ORB(→halo for
    // now, tier-b later) · 3 VEIL · 4 EMBER. NO dress strokes — the
    // only lines on a node are the symbol's own (John 2026-07-23).
    // Everything scales by wake×gate so rest & legacy are untouched.
    @fragment
    fn fs_main(in: VsOut) -> @location(0) vec4<f32> {
      let qs   = in.dmeta.x;
      let rpx  = max(in.dmeta.y, 0.5);
      let dId  = clamp(i32(in.dmeta.z + 0.5), 0, 4);
      let lockedF = in.dmeta.w;
      // d is in units of the (grown) symbol radius: 1.0 = ring edge.
      let d    = length(in.local_pos) * qs;
      let aa   = fwidth(d);

      // State dim (Phase 11 piecewise) — unchanged law.
      let segA        = mix(1.0, 1.0 - v.dim_amount_nodes, min(in.state, 1.0));
      let segB_factor = 1.0 - clamp(in.state - 1.0, 0.0, 1.0);
      let state_alpha = segA * segB_factor;
      if (state_alpha < 0.005) { discard; }

      let col = in.inst_color.rgb;
      let white = vec3<f32>(1.0, 1.0, 1.0);
      let use_recipe = step(1.0, v.recipe_b.x);
      let w = in.wake;
      // Dress gate: material only past gate_px on screen (FB px).
      let g  = clamp((rpx - v.recipe_a.w) / max(v.recipe_d.w, 1.0), 0.0, 1.0);
      let wg = w * g;
      let t  = v.recipe_c.x;
      let seedx = in.world_pos.x;
      // REVIEW FIX (bubble law verbatim): br = r·(1+(bubble−1)·wake)
      // + 2.5 CSS px·wake — the engine had dropped both the wake
      // ramp and the pixel term (dresses ran 30-45% undersized).
      let dprv0 = max(v.recipe_e.w, 1.0);
      let bub = (1.0 + (max(v.recipe_b.z, 1.0) - 1.0) * w) + 2.5 * dprv0 * w / rpx;

      // Accumulate premultiplied back-to-front: acc = L + acc*(1-L.a).
      // (The breathing glow + the HALO star body render in fs_glow —
      //  their light must never depth-occlude symbols behind it.)
      var acc = vec4<f32>(0.0);

      // 2 ▸ the dress body (full circle of material, stroke-free).
      //     FULL-TRANSCRIPTION (2026-07-27): every gradient below is
      //     the lab's piecewise-linear canvas stops VERBATIM — no
      //     curve approximations (John's law).
      if (wg > 0.01) {
        let db = clamp(d / bub, 0.0, 1.0);
        let dprv2 = max(v.recipe_e.w, 1.0);
        if (dId == 1) {
          // ICON — gold-leaf disc (lab stops: plateau .52→.44 to u=.72, then →0)
          // REVIEW P0: normalize from the UNCLAMPED ratio — the clamped
          // db froze the tail at 0.089 and lit a gold square to the quad edge.
          let leaf = mix(col, vec3<f32>(0.827, 0.722, 0.467), 0.45);
          let ui = clamp(d / (1.06 * bub), 0.0, 1.0);
          var ia: f32;
          if (ui <= 0.72) { ia = mix(0.52, 0.44, ui / 0.72); }
          else            { ia = 0.44 * (1.0 - (ui - 0.72) / 0.28); }
          acc = add_light(acc, leaf * (ia * wg));
        } else if (dId == 2) {
          // ORB — THE DEWDROP, real at last: the world bends through
          // the whole drop (backdrop = ground + wires, the O contract).
          let mag_core = 1.0 + (max(v.recipe_f.x, 1.0) - 1.0) * wg;
          let frost_fb = v.recipe_f.y * wg;
          let dep = v.recipe_f.z;
          if (v.recipe_f.w > 0.5 && (mag_core > 1.004 || frost_fb > 0.05 * dprv2)) {
            let p = in.position.xy;
            // REVIEW: the lab's refraction is UNIFORM — depth drives
            // only the body-density stops (the limb-bend was invented).
            let q2 = in.center_fb + (p - in.center_fb) / mag_core;
            let uv = q2 / v.viewport_px;
            // frost — disc blur, radius = the lab's blur px (tap
            // pattern is implementation freedom; radius is lab-true)
            var smp = textureSampleLevel(backdrop_tex, backdrop_samp, uv, 0.0);
            if (frost_fb > 0.3) {
              let fr = frost_fb / v.viewport_px;
              var sum = smp;
              sum = sum + textureSampleLevel(backdrop_tex, backdrop_samp, uv + vec2<f32>( fr.x,  0.0), 0.0);
              sum = sum + textureSampleLevel(backdrop_tex, backdrop_samp, uv + vec2<f32>(-fr.x,  0.0), 0.0);
              sum = sum + textureSampleLevel(backdrop_tex, backdrop_samp, uv + vec2<f32>( 0.0,  fr.y), 0.0);
              sum = sum + textureSampleLevel(backdrop_tex, backdrop_samp, uv + vec2<f32>( 0.0, -fr.y), 0.0);
              sum = sum + textureSampleLevel(backdrop_tex, backdrop_samp, uv + vec2<f32>( fr.x * 0.7,  fr.y * 0.7), 0.0);
              sum = sum + textureSampleLevel(backdrop_tex, backdrop_samp, uv + vec2<f32>(-fr.x * 0.7,  fr.y * 0.7), 0.0);
              sum = sum + textureSampleLevel(backdrop_tex, backdrop_samp, uv + vec2<f32>( fr.x * 0.7, -fr.y * 0.7), 0.0);
              sum = sum + textureSampleLevel(backdrop_tex, backdrop_samp, uv + vec2<f32>(-fr.x * 0.7, -fr.y * 0.7), 0.0);
              smp = sum / 9.0;
            }
            // the lens REPLACES what's behind, inside the bubble (lab
            // drawImage). REVIEW: coverage rides the sampled alpha so
            // an EMPTY backdrop stays transparent through the drop
            // (page ground shows through — no black hole); the
            // invented R/B ghost is gone — chroma is the lab's
            // warm/cool split like every other dress.
            let lg = wg * (1.0 - smoothstep(0.92, 1.0, db));
            let la = lg * smp.a;
            acc = vec4<f32>(smp.rgb * lg + acc.rgb * (1.0 - la), acc.a * (1.0 - la) + la);
            // the glow, seen THROUGH the drop — lab stops verbatim,
            // radius magnified; bubble-clipped so it can never flood
            if (v.recipe_a.x > 0.02) {
              let pa2 = v.recipe_a.x * w * (1.0 - 0.5 * v.recipe_a.y + 0.5 * v.recipe_a.y * sin(t * 1.7 + seedx * 0.05));
              let rg2 = max(v.recipe_a.z, 1.2) * mag_core;
              let u2 = clamp(d / rg2, 0.0, 1.0);
              var gp: f32;
              if (u2 < 0.35)     { gp = mix(0.75, 0.34, u2 / 0.35); }
              else if (u2 < 0.7) { gp = mix(0.34, 0.10, (u2 - 0.35) / 0.35); }
              else               { gp = mix(0.10, 0.0,  (u2 - 0.7) / 0.3); }
              // REVIEW: same 7C conservation as the outer glow — no
              // brightness step at the bubble edge at high reach.
              acc = add_light(acc, col * (pa2 * gp * (1.0 - smoothstep(0.96, 1.0, db))));
            }
          }
          // body density o1 — transparent heart, color deepening at the
          // limb; depth = curvature (lab stops verbatim)
          var da: f32; var dcol2: vec3<f32>;
          if (db < 0.62) {
            da = mix(0.06, 0.10 + 0.10 * dep, db / 0.62);
            dcol2 = col;
          } else if (db < 0.9) {
            let u3 = (db - 0.62) / 0.28;
            da = mix(0.10 + 0.10 * dep, 0.22 + 0.25 * dep, u3);
            dcol2 = mix(col, mix(col, vec3<f32>(0.0), 0.35), u3);
          } else {
            let u3 = (db - 0.9) / 0.1;
            da = mix(0.22 + 0.25 * dep, 0.05 + 0.15 * dep, u3);
            dcol2 = mix(mix(col, vec3<f32>(0.0), 0.35), mix(col, vec3<f32>(0.0), 0.5), u3);
          }
          // REVIEW P1: db clamps at 1.0 — the old (0.98,1.02) fade
          // froze half-done and left a dark film square past the rim.
          da = da * wg * (1.0 - smoothstep(0.96, 1.0, db));
          acc = vec4<f32>(dcol2 * da + acc.rgb * (1.0 - da), acc.a * (1.0 - da) + da);
          // gathered light — collected low in the drop (additive)
          let glc = vec2<f32>(0.0, 0.42 * bub);
          let dgl = clamp(length(in.local_pos * qs - glc) / (0.75 * bub), 0.0, 1.0);
          let gla = 0.30 * wg * (1.0 - dgl) * (1.0 - smoothstep(0.96, 1.0, db));
          acc = add_light(acc, mix(col, white, 0.65) * gla);
        } else if (dId == 3) {
          // VEIL — luminous mist: FOUR breaths, lab radii, linear falloff
          let pv = in.local_pos * qs;
          var va = 0.0;
          for (var k = 0; k < 4; k++) {
            let fk = f32(k);
            let ang = seedx * 0.13 + in.world_pos.y * 0.07 + fk * 2.1 + t * 0.15;
            let off = vec2<f32>(cos(ang) * 0.22 * bub, sin(ang * 0.8) * 0.20 * bub);
            let dk = clamp(length(pv - off) / (bub * (0.55 + 0.28 * fk)), 0.0, 1.0);
            va = va + 0.17 * wg * (1.0 - dk);
          }
          // min() saturation stands in for the lab's screen compositing
          acc = add_light(acc, mix(col, white, 0.25) * min(va, 0.6));
        } else if (dId == 4) {
          // EMBER — obsidian body (lab stops: .10 center → .55 at .75 → 0)
          var ba: f32;
          if (db <= 0.75) { ba = mix(0.10, 0.55, db / 0.75); }
          else            { ba = 0.55 * (1.0 - (db - 0.75) / 0.25); }
          let body_a = ba * wg;
          let dark = vec3<f32>(0.024, 0.020, 0.055);
          acc = vec4<f32>(dark * body_a + acc.rgb * (1.0 - body_a), acc.a * (1.0 - body_a) + body_a);
          // molten heart — white core, FAMILY-COLOR mid band, then dark
          let em = 0.5 + 0.5 * sin(t * 2.1 + seedx * 0.07);
          let u4 = clamp(d / 0.5, 0.0, 1.0);
          var hcol: vec3<f32>; var ha2: f32;
          if (u4 < 0.5) {
            hcol = mix(mix(col, white, 0.6), col, u4 / 0.5);
            ha2 = mix(0.5 + 0.3 * em, 0.30 + 0.2 * em, u4 / 0.5);
          } else {
            hcol = col;
            ha2 = (0.30 + 0.2 * em) * (1.0 - (u4 - 0.5) / 0.5);
          }
          acc = add_light(acc, hcol * (ha2 * wg));
        }
        // 3 ▸ iridescence — the FAM-palette conic film lit by the
        //     cursor angle (lab palette, NOT a rainbow), hard aa edge
        if (v.recipe_d.x > 0.5 && v.recipe_c.y * wg > 0.01 && db < 1.0) {
          let pv2 = in.local_pos * qs;
          let dirc = v.recipe_c.zw - in.world_pos;
          let frac0 = (atan2(pv2.y, pv2.x) - atan2(dirc.y, dirc.x)) / 6.28318;
          let fseg = (frac0 - floor(frac0)) * 4.0;
          let si = min(i32(fseg), 3);   // REVIEW: fseg can hit exactly 4.0
          let ft = fseg - f32(si);
          var stops = array<vec3<f32>, 5>(
            vec3<f32>(0.878, 0.478, 0.541),   // rose
            vec3<f32>(0.851, 0.753, 0.541),   // sand
            vec3<f32>(0.435, 0.816, 0.765),   // teal
            vec3<f32>(0.616, 0.561, 0.878),   // lav
            vec3<f32>(0.878, 0.478, 0.541));  // rose (wrap)
          let film = mix(stops[si], stops[si + 1], ft);
          let aa_db = aa / bub;
          let fa = 0.18 * v.recipe_c.y * wg * (1.0 - smoothstep(1.0 - aa_db, 1.0, db));
          acc = add_light(acc, film * fa);
        }
        // 4 ▸ chroma — warm/cool light split (lab: 0.16, LINEAR falloff)
        if (v.recipe_d.y > 0.5 && v.recipe_c.y * wg > 0.01) {
          let offr = v.recipe_d.z / rpx * 2.0;
          let pvx = in.local_pos.x * qs;
          let ca = 0.16 * v.recipe_c.y * wg;
          let dwarm = clamp(length(vec2<f32>(pvx + offr, in.local_pos.y * qs)) / bub, 0.0, 1.0);
          let dcool = clamp(length(vec2<f32>(pvx - offr, in.local_pos.y * qs)) / bub, 0.0, 1.0);
          acc = add_light(acc,
              vec3<f32>(1.0, 0.549, 0.353) * (ca * (1.0 - dwarm))
            + vec3<f32>(0.431, 0.627, 1.0) * (ca * (1.0 - dcool)));
        }
      }

      // 5 ▸ THE SYMBOL — canonical ring + core dot, over everything.
      //     AUDIT P0-2 (2026-07-27): LIGHT dims fully under focus (the
      //     lab law — life is added light only); the SYMBOL never
      //     alpha-fades to grey. It tints toward the lab's slate
      //     (st=3 recipe: 55% toward #3a3752). Ink floor 45% is a
      //     RATIFIED divergence from the lab's 32% (AUDIT P0-2 chose
      //     more presence for the dimmed field — not a transcription slip).
      acc = acc * state_alpha;
      let dimf = min(in.state, 1.0) * use_recipe;
      let symDim = mix(1.0, 0.45, dimf) * segB_factor;
      let colSym = mix(col, vec3<f32>(0.23, 0.22, 0.32), 0.55 * dimf);
      var symTab = array<f32, 5>(0.62, 1.0, 1.0, 0.55, 0.92);
      let sa = (1.0 - (1.0 - symTab[dId]) * wg) * symDim;
      let E = v.recipe_b.w * lockedF * in.sel * use_recipe;
      let breath = 0.5 + 0.5 * sin(t * 1.4 + seedx * 0.03);
      // REVIEW: hairline floor scales with dpr (lab: 1.1 CSS px).
      let hw   = max(0.05, 0.55 * dprv0 / rpx);
      // Symbol voice dials (recipe_e) — John tunes the whiteness here.
      let cw = mix(0.25, v.recipe_e.x, use_recipe);
      let cal = mix(0.92, v.recipe_e.y, use_recipe);
      let ral = mix(0.95, v.recipe_e.z, use_recipe);
      let dprv = max(v.recipe_e.w, 1.0);
      // AUDIT P0-3 — the lab's ethereal is THREE layers, never a smear:
      // (1) a SOFT family-colored copy UNDER, blur capped in SCREEN px
      //     (1.2-3.4 CSS px) so big locked nodes do not dissolve;
      // REVIEW: the blur radius scales with the ether dial (lab E·(1.2+2.2·ep))
      let widen = clamp(E * (1.2 + 2.2 * breath) * dprv / rpx, 0.0, 0.25) * step(0.02, E);
      if (widen > 0.001) {
        let f1 = smoothstep(0.86 - hw - widen - aa, 0.86 - hw + widen + aa, d);
        let f2 = 1.0 - smoothstep(0.86 + hw - widen - aa, 0.86 + hw + widen + aa, d);
        let soft_a = ral * sa * (f1 * f2) * 0.55 * E * breath;
        acc = vec4<f32>(colSym * soft_a + acc.rgb * (1.0 - soft_a), acc.a * (1.0 - soft_a) + soft_a);
      }
      // (2) the CRISP ring always on top — aa-sharp, color intact,
      //     ink never below 45% during the breath (identity anchor);
      let s1 = smoothstep(0.86 - hw - aa, 0.86 - hw + aa, d);
      let s2 = 1.0 - smoothstep(0.86 + hw - aa, 0.86 + hw + aa, d);
      let ring_mask = s1 * s2;
      let ring_a = ral * sa * ring_mask * (1.0 - 0.55 * E * breath);
      acc = vec4<f32>(colSym * ring_a + acc.rgb * (1.0 - ring_a), acc.a * (1.0 - ring_a) + ring_a);
      // core dot — AUDIT P1-5: the FILL is frozen at core_white; the
      // pulse rides on top as capped added light (never to white).
      let cp = 0.5 + 0.5 * sin(t * 2.1 + seedx * 0.07);
      let core_mask = 1.0 - smoothstep(0.32 - aa, 0.32 + aa, d);
      let core_a = cal * sa * core_mask;
      let core_rgb = mix(colSym, white, cw);
      acc = vec4<f32>(core_rgb * core_a + acc.rgb * (1.0 - core_a), acc.a * (1.0 - core_a) + core_a);
      // (3) accents — pure added light (breath stroke + core pulse),
      //     dimmed under the LIGHT law like every other photon.
      //     REVIEW: the breath stroke gets the lab's WIDER band
      //     (lineWidth max(1.4, .16r)) and accents drop the dress
      //     symbol-alpha table (lab applies neither).
      let hw_b = max(0.08, 0.7 * dprv0 / rpx);
      let b1 = smoothstep(0.86 - hw_b - aa, 0.86 - hw_b + aa, d);
      let b2 = 1.0 - smoothstep(0.86 + hw_b - aa, 0.86 + hw_b + aa, d);
      let accent = (mix(col, white, 0.6) * (0.30 * E * breath) * (b1 * b2)
                  + mix(col, white, 0.5) * (0.26 * w * cp * use_recipe) * core_mask)
                  * symDim * state_alpha;
      acc = add_light(acc, accent);

      // Legacy compatibility: with no recipe active, the node must
      // render the Phase-7 FILLED DISK + gold selected stroke exactly.
      if (use_recipe < 0.5) {
        let disk_alpha = 1.0 - smoothstep(1.0 - aa, 1.0, d);
        if (disk_alpha < 0.01) { discard; }
        let stroke_inner = 1.0 - v.selected_stroke_w;
        let stroke_band  = smoothstep(stroke_inner - aa, stroke_inner, d);
        let rgb = mix(col, v.selected_stroke.rgb, in.sel * stroke_band);
        let fa = state_alpha * disk_alpha;
        if (fa < 0.005) { discard; }
        return vec4<f32>(rgb * fa, fa);
      }

      if (acc.r + acc.g + acc.b + acc.a < 0.006) { discard; }
      return acc;
    }

    // ── ROUND-7b LIGHT PASS (2026-07-26) ────────────────────────
    // The breathing glow + the HALO star body render in their OWN
    // draw, BEFORE the node bodies, with depth writes OFF and depth
    // test 'always' — light can never occlude a symbol behind it
    // (fixes the rounded-square clipping John circled in red).
    // Rest nodes collapse to a zero-area quad here: zero fragments.
    @vertex
    fn vs_glow(
      @location(0) quad_vertex:    vec2<f32>,
      @location(1) inst_pos_r:     vec4<f32>,
      @location(2) inst_color:     vec4<f32>,
      @location(3) inst_sswd:      vec4<f32>,
      @location(4) inst_pos_b:     vec4<f32>,
    ) -> VsOut {
      // THE HOUSE — glow rides the same layout ramp AND radius lane
      // as the body (2026-07-30: pos_b.z = house radius; exact at 0).
      let inst_pos      = mix(inst_pos_r.xy, inst_pos_b.xy, v.layout_mix.x);
      let inst_radius   = mix(inst_pos_r.z, inst_pos_b.z, v.layout_mix.x);
      let inst_state    = inst_sswd.x;
      let inst_selected = inst_sswd.y;
      let wake          = clamp(inst_sswd.z, 0.0, 1.0);
      let packed        = inst_sswd.w;
      let locked        = select(0.0, 1.0, packed >= 8.0);
      let dress_id      = packed - locked * 8.0;
      let use_recipe = step(1.0, v.recipe_b.x);
      let hz   = max(v.recipe_b.x, 1.0);
      let cz   = max(v.recipe_b.y, hz);
      let zoom = 1.0 + (mix(hz, cz, locked) - 1.0) * inst_selected * wake;
      let bub  = max(v.recipe_b.z, 1.0);
      // Envelope covers the glow reach (no bubble term — P1-6) AND
      // the halo body (1.5×bub_eff; +0.6 margin covers the wake-ramp
      // bubble law's pixel term at small radii — REVIEW).
      let reach = max(v.recipe_a.z, 1.5 * bub + 0.6);
      // FULL-TRANSCRIPTION: orb no longer borrows the halo body — it
      // has its real lens in the body pass. Outer glow still emits.
      let is_halo = select(0.0, 1.0, dress_id < 0.5);
      let emits = max(step(0.02, v.recipe_a.x), is_halo);
      let live  = step(0.004, wake) * use_recipe * emits;
      let world = inst_pos + quad_vertex * inst_radius * zoom * reach * live;
      let ndc   = world * v.view_scale + v.view_offset;
      var out: VsOut;
      out.position   = vec4<f32>(ndc, 0.5, 1.0);
      out.local_pos  = quad_vertex;
      out.inst_color = inst_color;
      out.state      = inst_state;
      out.sel        = inst_selected;
      out.wake       = wake * use_recipe;
      let r_px_fb    = inst_radius * zoom * (v.view_scale.x * v.viewport_px.x * 0.5);
      out.dmeta      = vec4<f32>(reach, r_px_fb, dress_id, locked);
      out.world_pos  = inst_pos;
      return out;
    }

    @fragment
    fn fs_glow(in: VsOut) -> @location(0) vec4<f32> {
      let qs  = in.dmeta.x;              // quad envelope in grown-radius units
      let rpx = max(in.dmeta.y, 0.5);
      let dId = clamp(i32(in.dmeta.z + 0.5), 0, 4);
      let d   = length(in.local_pos) * qs;
      let segA        = mix(1.0, 1.0 - v.dim_amount_nodes, min(in.state, 1.0));
      let segB_factor = 1.0 - clamp(in.state - 1.0, 0.0, 1.0);
      let state_alpha = segA * segB_factor;
      if (state_alpha < 0.005) { discard; }
      let col = in.inst_color.rgb;
      let w   = in.wake;
      let g   = clamp((rpx - v.recipe_a.w) / max(v.recipe_d.w, 1.0), 0.0, 1.0);
      let wg  = w * g;
      // AUDIT P1-6 — the breathing glow gates on WAKE alone (the lab
      // guards glow only by glow>0.02): a woken 5px node must glow.
      // Only the DRESS (halo body below) respects the size gate.
      if (w < 0.004) { discard; }
      let t   = v.recipe_c.x;
      // Bubble law verbatim (REVIEW) — same wake ramp + px term as fs_main.
      let dprg = max(v.recipe_e.w, 1.0);
      let bub = (1.0 + (max(v.recipe_b.z, 1.0) - 1.0) * w) + 2.5 * dprg * w / rpx;
      var light = vec3<f32>(0.0);
      // the breathing glow — LAB STOPS VERBATIM. The 7C energy-
      // conservation law is RETIRED (2026-07-28, John: "NOW there is
      // NO GLOW" at reach 4.5): it existed to stop the glow flood-
      // lighting the wires, and the Wire-calm law now solves that at
      // the source. Reach behaves exactly like the bench again.
      if (v.recipe_a.x > 0.02) {
        let pulse = v.recipe_a.y;
        let pa = v.recipe_a.x * w * (1.0 - 0.5 * pulse + 0.5 * pulse * sin(t * 1.7 + in.world_pos.x * 0.05));
        // AUDIT P1-6 sibling: the lab has no bubble term on reach.
        let reach_g = max(v.recipe_a.z, 1.2);
        let dg = clamp(d / reach_g, 0.0, 1.0);
        var gp0: f32;
        if (dg < 0.35)     { gp0 = mix(0.75, 0.34, dg / 0.35); }
        else if (dg < 0.7) { gp0 = mix(0.34, 0.10, (dg - 0.35) / 0.35); }
        else               { gp0 = mix(0.10, 0.0,  (dg - 0.7) / 0.3); }
        light = light + col * (pa * gp0);
      }
      // HALO (and ORB until tier-b) — the star body IS light.
      // AUDIT P0-4a: white lives ONLY at the heart — the lab ramps the
      // white-mix 0.55→0 across dh 0→0.3; the mid-body is pure family
      // color (the old full-body whitening made locked hubs cream).
      if (dId == 0) {
        // lab stops verbatim: (0,.80)(0.3,.42)(0.65,.14)(1,0) × wg
        let dh = clamp(d / (1.5 * bub), 0.0, 1.0);
        var hp: f32;
        if (dh < 0.3)       { hp = mix(0.80, 0.42, dh / 0.3); }
        else if (dh < 0.65) { hp = mix(0.42, 0.14, (dh - 0.3) / 0.35); }
        else                { hp = mix(0.14, 0.0,  (dh - 0.65) / 0.35); }
        light = light + mix(col, vec3<f32>(1.0, 1.0, 1.0), 0.55 * max(1.0 - dh / 0.3, 0.0)) * (hp * wg);
      }
      light = light * state_alpha;
      if (light.r + light.g + light.b < 0.004) { discard; }
      // LIGHT-ALPHA LAW: the glow must carry coverage or the
      // transparent-canvas composite clamps it away over the void.
      // The pipeline's alpha blend is one / one-minus-src-alpha and
      // its colour factors never read src alpha, so screen stays screen.
      return vec4<f32>(light, clamp(max(max(light.r, light.g), light.b), 0.0, 1.0));
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
      // frame computation. xy carries glyph_opacity + dim_amount_glyphs.
      // 2026-07-31 THE BONE — the two spare lanes are now live for the
      // EDGE pipeline only (the node/glyph shaders still ignore them):
      //   z = wire_hot_screen_px  (FB px; the width a fully-HOT wire
      //       is guaranteed to reach — 0 restores the pre-07-31 clamp
      //       exactly, which is this feature's honest-zero position)
      //   w = house_arc_sag       (bone bow as a fraction of its own
      //       chord; only reaches geometry through the house lane)
      // Lives in the slot freed by collapsing the unused 8th bucket
      // entry (only 7 buckets are real).
      glyph_params:           vec4<f32>,
      // THE HOUSE (2026-07-30) — pad through the node shader's six
      // recipe vec4s (unused here) so layout_mix lands at the same
      // byte offset (288) in the ONE shared view UBO.
      recipe_pad_a:           vec4<f32>,
      recipe_pad_b:           vec4<f32>,
      recipe_pad_c:           vec4<f32>,
      recipe_pad_d:           vec4<f32>,
      recipe_pad_e:           vec4<f32>,
      recipe_pad_f:           vec4<f32>,
      // x = layout ramp 0..1 · y = glyph_scale (glyph pipeline) ·
      // 2026-07-31: z = house_bone_px (FB px floor for a PRIMARY
      // lineage bone) · w = rest-wires min external class (3 = hide
      // nothing). Both z and w only bite through the per-instance
      // house lane, which is zero-filled with no isolate.
      layout_mix:             vec4<f32>,
      // 2026-08-02 WIRING FLAIR — edge-only trailing vec4 (byte 304).
      // x = flow strength 0..1 (0 = today, bit-true)
      // y = flow speed, FB px/sec (JS pre-multiplies dpr)
      // z = flow wavelength, FB px   w = reserved (type-signature)
      // NODE/GLYPH structs stay 304 bytes - binding the larger buffer
      // is valid (min-binding-size is per pipeline). If the node
      // shader ever grows past 304, it must mirror this vec4 first.
      wire_flair:             vec4<f32>,
    };
    @group(0) @binding(0) var<uniform> v: View;

    struct VsOut {
      @builtin(position) position: vec4<f32>,
      @location(0) edge_y:       f32,
      @location(1) edge_color:   vec4<f32>,
      @location(2) state:        f32,
      @location(3) bucket_index: f32,    // interpolated; floor() in fs
      @location(4) edge_t:       f32,    // 0 at source, 1 at target — gradient direction
      @location(5) ext_class:    f32,    // instance-constant; 0 in-house, 1 member↔port, 2 port↔port, 3 parked (no terminus)
      @location(6) arc_fb:       f32,   // FB px from the SEMANTIC origin
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
      @location(5) inst_endpoints_b: vec4<f32>,
      @location(6) inst_house:     vec2<f32>,
    ) -> VsOut {
      // THE HOUSE — endpoints ride the layout ramp; external wires
      // land on their group's horizon port because the ported nodes
      // themselves moved there (one pass positions ALL nodes).
      let p0   = mix(inst_endpoints.xy, inst_endpoints_b.xy, v.layout_mix.x);
      let p2   = mix(inst_endpoints.zw, inst_endpoints_b.zw, v.layout_mix.x);
      let mid  = (p0 + p2) * 0.5;
      // ── THE BONE (2026-07-31) ──────────────────────────────────
      // inst_house.x is the house lane: 0 for every wire that is not
      // a lineage arc of the standing house, ±1.0 for a PRIMARY
      // parent arc, ±0.5 for a secondary one. The sign is which side
      // of its own chord the arc bows to (baked so parent→child is
      // consistent whichever way the raw vault edge points).
      //
      // The legacy control point pulls every wire toward WORLD ORIGIN,
      // which for a radial parent→child pair inside a house is ALONG
      // the chord — measured bow/chord 0.10, i.e. a straight tick. A
      // bone instead bows PERPENDICULAR to its own chord by
      // house_arc_sag × chord length, so it reads as an arc at any
      // orientation. HONEST ZEROS: lane 0 or layout_mix 0 ⇒ the mix
      // collapses to the original expression, bit for bit.
      let hx        = v.layout_mix.x;
      let bmag      = abs(inst_house.x);
      let is_bone   = step(0.25, bmag);
      let is_prim   = step(0.75, bmag);
      let origin_p1 = mid + (vec2<f32>(0.0, 0.0) - mid) * inst_extra.y;
      let chord     = p2 - p0;
      let clen      = length(chord);
      let perp_u    = select(vec2<f32>(0.0, 0.0), vec2<f32>(-chord.y, chord.x) / clen, clen > 1e-6);
      let bone_p1   = mid + perp_u * (v.glyph_params.w * 2.0 * clen * sign(inst_house.x));
      let p1        = mix(origin_p1, bone_p1, is_bone * hx);
      let t    = (quad_vertex.x + 1.0) * 0.5;
      let pos  = bezier_pos(p0, p1, p2, t);
      let tan  = bezier_tan(p0, p1, p2, t);
      // A zero-length wire (both endpoints on one horizon port — the
      // isolate makes ~2,000 of them) gives a zero tangent at t=0.5,
      // and normalize(0) is NaN. Same value as normalize() wherever
      // the tangent is real; a defined direction where it is not, so
      // the quad degenerates to zero area instead of producing NaN.
      let tlen  = length(tan);
      let tnorm = select(vec2<f32>(1.0, 0.0), tan / tlen, tlen > 1e-9);
      let perp  = vec2<f32>(-tnorm.y, tnorm.x);
      // Phase 6: per-bucket idle + hot stroke widths are baked
      // into the instance attribute. inst_extra.x = idle width,
      // inst_extra.w = hot width.
      // Phase 6d4 — convention flip: state=0 → IDLE, state=1 → HOT.
      // mix(a, b, t) → a*(1-t) + b*t. So mix(idle, hot, state).
      // Phase 21AU (2026-05-23) — also clamp here so HIDDEN (state>=1.5)
      // doesn't extrapolate the width past hot. Hidden alpha is zeroed
      // in fs_main, but the geometry still rasterizes — keep widths sane.
      let world_w_raw = mix(inst_extra.x, inst_extra.w, clamp(inst_state, 0.0, 1.0));
      // Phase 6b: zoom-aware clamp. Convert world width →
      // framebuffer-px (= cam.scale × DPR × world), clamp to
      // [wire_min_screen_px, wire_max_screen_px] (also in FB px),
      // then convert back to world units. Keeps strokes legible
      // at zoom-out + stops them bloating at zoom-in.
      let world_to_fb = v.view_scale.x * v.viewport_px.x * 0.5;
      let fb_w_raw    = world_w_raw * world_to_fb;
      // ── THE DEAD WIDTH CHANNEL (fixed 2026-07-31) ──────────────
      // The old line was clamp(fb_w_raw, wire_min, wire_max). At the
      // house camera (camScale 0.672, dpr 2) the idle wire computes
      // 0.887 FB px, a boned wire 1.353 and a fully-HOT wire 1.508 —
      // ALL THREE below wire_min (2 FB px), so all three clamped to
      // the identical hairline and the entire idle→hot width channel
      // was dead at every zoom below ~1.5× fit. The floor now RIDES
      // the state: idle keeps wire_min, a hot wire is guaranteed
      // glyph_params.z (wire_hot_screen_px), and a PRIMARY lineage
      // bone gets its own floor on top (layout_mix.z, house-gated).
      // The max() on every bound makes an inverted clamp impossible
      // whatever John dials. HONEST ZEROS: glyph_params.z = 0 and a
      // zero house lane reduce this to clamp(raw, wire_min, wire_max).
      let st_w    = clamp(inst_state, 0.0, 1.0);
      let hot_px  = max(v.wire_min_screen_px, v.glyph_params.z);
      let bone_px = v.layout_mix.z * is_prim * hx;
      let w_lo    = max(mix(v.wire_min_screen_px, hot_px, st_w), bone_px);
      let w_hi    = max(v.wire_max_screen_px, w_lo);
      let fb_w    = clamp(fb_w_raw, w_lo, w_hi);
      let world_w     = select(world_w_raw, fb_w / world_to_fb, world_to_fb > 0.0);
      let half_w      = world_w * 0.5;
      let world  = pos + perp * quad_vertex.y * half_w;
      let ndc = world * v.view_scale + v.view_offset;

      var out: VsOut;
      // Phase 6d — edges always paint BEHIND all nodes (z=0.8).
      // Phase 6d4 convention flip: state=0 IDLE → behind (z=0.85),
      // state=1 HOT → slightly forward (z=0.75) so a focused
      // incident edge isn't masked by a dimmed neighbour.
      // Phase 21AU (2026-05-23) — clamp state to [0,1] for z (state
      // values >= 1.5 are the new HIDDEN sentinel; their z must not
      // be extrapolated past the HOT plane).
      let z_state = clamp(inst_state, 0.0, 1.0);
      let z = mix(0.85, 0.75, z_state);
      out.position     = vec4<f32>(ndc, z, 1.0);
      out.edge_y       = quad_vertex.y;
      out.edge_color   = inst_color;
      out.state        = inst_state;
      out.bucket_index = inst_extra.z;
      out.edge_t       = t;
      out.ext_class    = inst_house.y;
      // WIRING FLAIR - arc-length proxy measured from the semantic
      // origin (dirMode 2 flips). clen and world_to_fb already exist.
      let fl_raw  = floor(inst_extra.z + 0.5);
      let fl_dm   = floor(fl_raw / 8.0);
      let fl_t    = select(t, 1.0 - t, fl_dm > 1.5);
      out.arc_fb  = fl_t * clen * world_to_fb;
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
      // 2026-08-02 WIRING FLAIR - the raw float is bucket + 8*dirMode
      // (0 symmetric / 1 data-order / 2 reversed); strip the direction
      // before the palette lookup.
      let dmode    = floor(bidx_raw / 8.0);
      // Phase 5C (2026-05-20) — clamp to 6 (was 7). The 8th vec4
      // slot in the View uniform was repurposed for glyph_params;
      // bucket count is now 7 (real bucket count anyway).
      let bidx     = clamp(i32(bidx_raw - dmode * 8.0), 0, 6);
      let hot      = v.bucket_hot_colors[bidx];

      // Phase 6d4 convention flip:
      //   state=0 → IDLE (instance color = slate or headline-bucket idle).
      //   state=1 → HOT  (bucket hex at hot alpha).
      //   state=2 → HIDDEN (alpha = 0, fragment discarded).
      // Phase 21AU (2026-05-23) — clamp the state used by the color
      // and dim mix so values >= 1.5 don't extrapolate past HOT and
      // produce over-saturated wires. Separately we test state>=1.5
      // and zero the alpha so the fragment is discarded; this is
      // the same HIDDEN convention the node shader already uses.
      let vis_state = clamp(in.state, 0.0, 1.0);
      // ── REST WIRES (2026-07-31) ────────────────────────────────
      // The isolate drags the whole rest of the wheel into the house:
      // ~4,400 wires between two OTHER families, collapsed onto two
      // horizon points, plus ~2,000 zero-length ones that render as
      // solid radial spikes. A wire between two families neither of
      // which is this house encodes NOTHING about this house, so
      // hiding it is honest, not cosmetic. ext_class is baked per
      // instance (0 = both endpoints in the house, 1 = one endpoint,
      // 2 = neither); layout_mix.w is the LAB chip's threshold
      // (3 = hide nothing). Hovering a deity still lights its own
      // external wires because the focus pass drives their state to
      // 1 and the ramp below hands them back.
      // CLASS 3 = PARKED (2026-07-31 wave 2, EDGE-2). The rail's
      // display cap parks its remainder ON THE CROWN at radius 0 —
      // deliberately invisible and unhittable — so a wire to one of
      // them points at nothing and lands on the family name. Both
      // endpoints are house members, so it was class 0, which no chip
      // threshold can reach: ~180-195 idle wires converged on the crown
      // as a starburst. Class 3 hides UNCONDITIONALLY while the mix is
      // up — not via the chip and not exempted by hover, because this
      // is not a rest-wires preference, it is a wire with no terminus.
      // HONEST ZEROS: layout_mix.x is 0 with no isolate ⇒ both terms
      // are 0 ⇒ 'hidden' is exactly the pre-07-31 step(1.5, state).
      let parked    = step(2.5, in.ext_class) * v.layout_mix.x;
      let ext       = max(parked,
                      step(v.layout_mix.w, in.ext_class) * v.layout_mix.x
                      * (1.0 - smoothstep(0.55, 0.95, vis_state)));
      let hidden    = max(step(1.5, in.state), ext);  // 1.0 if HIDDEN, else 0.0
      let color    = mix(in.edge_color, hot, vis_state);
      // Dim multiplier: idle (state=0) is dimmed by dim_amount
      // when a focus is active. The view layer passes
      // dim_amount = 0 when no focus is active, so the idle
      // constellation isn't attenuated in the no-focus case.
      let dim_mult = mix(1.0 - v.dim_amount, 1.0, vis_state);
      // Directional gradient. Every wire darkens from source
      // (in.edge_t=0) toward target (in.edge_t=1). Eye-readable
      // cue for edge direction; helps separate wires that
      // overlap or share endpoints.
      //
      // Tuning history:
      //   0.55 (2026-05-19)  — John couldn't see darken on idle wires.
      //   0.25 (2026-05-19)  — too aggressive; target end nearly black.
      //   0.50 (2026-05-21)  — readable but balanced. Target end is
      //                        50% of source RGB; clear direction
      //                        cue without crushing the target end.
      //
      // Applies equally to IDLE and HOT — gradient is universal,
      // not state-dependent.
      // Phase 3B D2 (2026-05-20) — gradient applied to color RGB,
      // NOT alpha. Keeps the AA footprint constant from source to
      // target end while the visible color darkens. Intentional —
      // makes the wire-end blunt against the disk it terminates
      // into. DO NOT extend grad_mult to alpha.
      let grad_mult = mix(1.0, 0.50, in.edge_t);
      // WIRING FLAIR (2026-08-02) - a light crest drifts origin ->
      // destination on DIRECTIONAL wires only, and only when the wire
      // is fully HOT (house bones at 0.75 stay solemn and steady, and
      // a dead rAF loop can never leave a frozen half-wave visible).
      // RGB ONLY - same law as grad_mult; alpha and AA are untouched.
      // Honest zeros: wire_flair.x = 0 OR recipe off => mult == 1.0.
      let flow_on   = v.wire_flair.x * step(0.5, dmode) * step(1.0, v.recipe_pad_b.x);
      let flow_gate = smoothstep(0.8, 1.0, vis_state);
      let fl_wl     = max(v.wire_flair.z, 4.0);
      let fl_ph     = fract((in.arc_fb - v.recipe_pad_c.x * v.wire_flair.y) / fl_wl);
      let fl_wave   = smoothstep(0.0, 0.45, fl_ph) * (1.0 - smoothstep(0.55, 1.0, fl_ph));
      let flow_mult = 1.0 + flow_on * flow_gate * (fl_wave - 0.5) * 0.9;
      // Phase 21AU (2026-05-23) — multiply alpha by (1 - hidden) so
      // state >= 1.5 (HIDDEN, set by the source-tier filter in
      // forge.js recomputeFocus) goes to alpha=0 and is discarded.
      let a        = color.a * alpha_aa * dim_mult * (1.0 - hidden);
      // Phase 6d — same discard logic as nodes: AA halo fragments
      // shouldn't write depth, else they block disks behind them.
      if (a < 0.02) { discard; }
      return vec4<f32>(color.rgb * grad_mult * flow_mult * a, a);
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
      // THE HOUSE (2026-07-30) — same padding as the edge shader so
      // layout_mix reads byte offset 288 of the shared view UBO.
      recipe_pad_a:           vec4<f32>,
      recipe_pad_b:           vec4<f32>,
      recipe_pad_c:           vec4<f32>,
      recipe_pad_d:           vec4<f32>,
      recipe_pad_e:           vec4<f32>,
      recipe_pad_f:           vec4<f32>,
      layout_mix:             vec4<f32>,
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
      @location(4) inst_pos_b:      vec4<f32>,     // THE HOUSE — shared node posB VBO (1:1 instances)
    ) -> VsOut {
      let center   = mix(inst_pos_r_idx.xy, inst_pos_b.xy, v.layout_mix.x);
      // 2026-07-30 SCALE pass — pos_b.z is the house DISK radius;
      // layout_mix.y carries glyph_scale so the sigil grows with its
      // disk. At mix 0 the whole B term multiplies away exactly.
      let r_base   = mix(inst_pos_r_idx.z, inst_pos_b.z * v.layout_mix.y, v.layout_mix.x);
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

      // Phase 11 (2026-05-20) — WHITE glyph, alpha follows disk:
      //   IDLE   (state=0): alpha = tex.a × 1.0    (full white symbol)
      //   FADED  (state=1): alpha = tex.a × 0.25
      //   HIDDEN (state=2): alpha = 0   → discarded
      // Same piecewise formula as the disk fragment so the glyph
      // and its parent disk stay in lockstep through the IDLE →
      // FADED → HIDDEN animation.
      let dim_g       = v.glyph_params.y;
      let segA        = mix(1.0, 1.0 - dim_g, min(in.state, 1.0));
      let segB_factor = 1.0 - clamp(in.state - 1.0, 0.0, 1.0);
      let state_alpha = segA * segB_factor;
      let a           = tex.a * state_alpha;
      if (a < 0.005) { discard; }

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
    // ROUND-7 DRESS (2026-07-26) — grew 192 → 272: five recipe vec4s
    // appended AFTER glyph_params, so every pre-existing offset is
    // untouched. Edge + glyph shaders still declare the 192-byte
    // struct; binding a larger buffer is valid (min-binding-size).
    // FULL-TRANSCRIPTION (2026-07-27) — 272 → 288: recipe_f (lens).
    // THE HOUSE (2026-07-30) — 288 → 304: layout_mix vec4 appended
    // (only .x live). Edge + glyph shaders pad their structs to the
    // same offset so ONE buffer serves all passes.
    // WIRING FLAIR (2026-08-02) — 304 → 320: wire_flair vec4 appended,
    // declared by the EDGE struct ONLY (node/glyph stay 304 — binding
    // the larger buffer is valid; min-binding-size is per pipeline).
    const VIEW_UBO_SIZE = 320;
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

    // ── FULL-TRANSCRIPTION (2026-07-27): the backdrop the orb lens
    // looks through — ground + wires rendered offscreen (the lab's
    // O canvas). Dummy 1×1 at init (atlasTex pattern) so the node
    // bind group is always valid even with no orb cast.
    let backdropTex = own(device.createTexture({
      label: 'forge-backdrop',
      size: { width: 1, height: 1, depthOrArrayLayers: 1 },
      format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    }));
    let backdropW = 1, backdropH = 1;
    const backdropSampler = device.createSampler({
      label: 'forge-backdrop-sampler',
      magFilter: 'linear', minFilter: 'linear',
      addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
    });
    const nodeBgl = device.createBindGroupLayout({
      label: 'forge-node-bgl',
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });
    function makeNodeBindGroup() {
      return device.createBindGroup({
        label: 'forge-node-bg',
        layout: nodeBgl,
        entries: [
          { binding: 0, resource: { buffer: viewUbo } },
          { binding: 1, resource: backdropTex.createView() },
          { binding: 2, resource: backdropSampler },
        ],
      });
    }
    let nodeBg = makeNodeBindGroup();
    // Declared HERE (not at the blit block) so ensureBackdropTex's
    // closure state is fully initialized before any possible call —
    // REVIEW caught the latent TDZ.
    let blitBg = null;
    function ensureBackdropTex(fbW, fbH) {
      if (backdropW === fbW && backdropH === fbH) return;
      disown(backdropTex);
      try { backdropTex.destroy(); } catch (e) { /* ignore */ }
      backdropTex = own(device.createTexture({
        label: 'forge-backdrop',
        size: { width: fbW, height: fbH, depthOrArrayLayers: 1 },
        format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      }));
      backdropW = fbW; backdropH = fbH;
      nodeBg = makeNodeBindGroup();
      blitBg = makeBlitBindGroup();
    }

    // ── Phase 3: NODE pipeline with state attribute ──
    // FULL-TRANSCRIPTION: the BODY pipeline binds the backdrop
    // texture (orb lens). Glow/edge/glyph keep their old layouts.
    const nodePipeline = device.createRenderPipeline({
      label: 'forge-node-pipeline',
      layout: device.createPipelineLayout({ bindGroupLayouts: [nodeBgl] }),
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
          // [2] per-instance (state, selected, wake, dress+lock) —
          // ROUND-7 DRESS bumped the vec2 to a vec4: state in .x,
          // selected in .y, wake 0..1 in .z, dress_id+8*locked in .w.
          { arrayStride: 16, stepMode: 'instance', attributes: [
              { shaderLocation: 3, offset: 0, format: 'float32x4' },
          ] },
          // [3] THE HOUSE — per-instance position B (the tree):
          // xy = tree position, z = house radius, w = pad (2026-07-30).
          { arrayStride: 16, stepMode: 'instance', attributes: [
              { shaderLocation: 4, offset: 0, format: 'float32x4' },
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
    // REVIEW P1 — under the recipe, translucent dress light was
    // WRITING DEPTH and erasing overlapping neighbor rings (the same
    // failure class 7B fixed for glow). The recipe path uses this
    // no-depth-write twin: painter order, which is exactly the lab's
    // canvas model. Legacy keeps the z-layered pipeline above.
    const nodePipelineNoZ = device.createRenderPipeline({
      label: 'forge-node-pipeline-noz',
      layout: device.createPipelineLayout({ bindGroupLayouts: [nodeBgl] }),
      vertex: {
        module: nodeShaderModule, entryPoint: 'vs_main',
        buffers: [
          { arrayStride: 8, stepMode: 'vertex', attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] },
          { arrayStride: 32, stepMode: 'instance', attributes: [
              { shaderLocation: 1, offset:  0, format: 'float32x4' },
              { shaderLocation: 2, offset: 16, format: 'float32x4' },
          ] },
          { arrayStride: 16, stepMode: 'instance', attributes: [
              { shaderLocation: 3, offset: 0, format: 'float32x4' },
          ] },
          { arrayStride: 16, stepMode: 'instance', attributes: [
              { shaderLocation: 4, offset: 0, format: 'float32x4' },
          ] },
        ],
      },
      fragment: {
        module: nodeShaderModule, entryPoint: 'fs_main',
        targets: [{ format, blend: premultBlend() }],
      },
      primitive: { topology: 'triangle-list' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'always' },
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
          // [3] THE HOUSE — per-instance endpoints B (p0b, p2b) plus
          // the 2026-07-31 house lane (bone weight+side, external
          // class). 6 floats / 24 bytes per instance; zero-filled and
          // never uploaded while no house has been entered.
          { arrayStride: 24, stepMode: 'instance', attributes: [
              { shaderLocation: 5, offset:  0, format: 'float32x4' },
              { shaderLocation: 6, offset: 16, format: 'float32x2' },
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
          // pipeline's nodeStateVbo. ROUND-7 DRESS: that buffer is
          // now vec4 (state, selected, wake, dress) per instance —
          // 16-byte stride; glyphs still read only (state, selected).
          { arrayStride: 16, stepMode: 'instance', attributes: [
              { shaderLocation: 3, offset: 0, format: 'float32x2' },
          ] },
          // [3] THE HOUSE — SAME nodePosBVbo as the node pipeline
          // (glyph instances are 1:1 with node instances), so glyphs
          // ride the layout ramp — and the radius lane — with their
          // parent disks (vec4: xy pos, z house radius, w pad).
          { arrayStride: 16, stepMode: 'instance', attributes: [
              { shaderLocation: 4, offset: 0, format: 'float32x4' },
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

    // ── ROUND-7b: node LIGHT pipeline (2026-07-26) ──
    // Same shader module + buffers as the node pass, different
    // entries (vs_glow/fs_glow). Depth: never writes, always
    // passes — pure additive light that cannot occlude anything.
    const nodeGlowPipeline = device.createRenderPipeline({
      label: 'forge-node-glow-pipeline',
      layout: device.createPipelineLayout({ bindGroupLayouts: [viewBgl] }),
      vertex: {
        module: nodeShaderModule, entryPoint: 'vs_glow',
        buffers: [
          { arrayStride: 8, stepMode: 'vertex', attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] },
          { arrayStride: 32, stepMode: 'instance', attributes: [
              { shaderLocation: 1, offset:  0, format: 'float32x4' },
              { shaderLocation: 2, offset: 16, format: 'float32x4' },
          ] },
          { arrayStride: 16, stepMode: 'instance', attributes: [
              { shaderLocation: 3, offset: 0, format: 'float32x4' },
          ] },
          { arrayStride: 16, stepMode: 'instance', attributes: [
              { shaderLocation: 4, offset: 0, format: 'float32x4' },
          ] },
        ],
      },
      fragment: {
        module: nodeShaderModule, entryPoint: 'fs_glow',
        // AUDIT P0-4b — SCREEN blend (src + dst·(1−src)), the lab's
        // compositeOperation for its light: self-limiting, saturates
        // asymptotically, never clips to white the way pure ADD did.
        targets: [{ format, blend: {
          color: { srcFactor: 'one', dstFactor: 'one-minus-src', operation: 'add' },
          alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        } }],
      },
      primitive: { topology: 'triangle-list' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'always' },
    });

    // ── FULL-TRANSCRIPTION: blit — paints the backdrop into the
    // main pass as its bottom layer (by sampling — never
    // copyTextureToTexture into the swapchain; Safari-safe).
    const BLIT_SHADER = /* wgsl */ `
      @group(0) @binding(0) var src_tex:  texture_2d<f32>;
      @group(0) @binding(1) var src_samp: sampler;
      struct BlitOut {
        @builtin(position) position: vec4<f32>,
        @location(0) uv: vec2<f32>,
      };
      @vertex
      fn vs_main(@builtin(vertex_index) vi: u32) -> BlitOut {
        var out: BlitOut;
        let x = f32(i32(vi) / 2) * 4.0 - 1.0;
        let y = f32(i32(vi) % 2) * 4.0 - 1.0;
        out.position = vec4<f32>(x, y, 0.999, 1.0);
        out.uv = vec2<f32>((x + 1.0) * 0.5, (1.0 - y) * 0.5);
        return out;
      }
      @fragment
      fn fs_main(in: BlitOut) -> @location(0) vec4<f32> {
        return textureSampleLevel(src_tex, src_samp, in.uv, 0.0);
      }
    `;
    const blitModule = device.createShaderModule({ label: 'forge-blit-shader', code: BLIT_SHADER });
    const blitBgl = device.createBindGroupLayout({
      label: 'forge-blit-bgl',
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });
    const blitPipeline = device.createRenderPipeline({
      label: 'forge-blit-pipeline',
      layout: device.createPipelineLayout({ bindGroupLayouts: [blitBgl] }),
      vertex: { module: blitModule, entryPoint: 'vs_main' },
      fragment: { module: blitModule, entryPoint: 'fs_main', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'always' },
    });
    function makeBlitBindGroup() {
      return device.createBindGroup({
        label: 'forge-blit-bg',
        layout: blitBgl,
        entries: [
          { binding: 0, resource: backdropTex.createView() },
          { binding: 1, resource: backdropSampler },
        ],
      });
    }
    blitBg = makeBlitBindGroup();

    // ── Instance buffers ─────────────────────────────
    let nodeInstanceVbo     = null, nodeInstanceVboSize     = 0;
    let nodeStateVbo        = null, nodeStateVboSize        = 0;
    let edgeInstanceVbo     = null, edgeInstanceVboSize     = 0;
    let edgeStateVbo        = null, edgeStateVboSize        = 0;
    // THE HOUSE (2026-07-30) — position-B buffers. Always bound
    // (the pipelines declare the attribute); fresh GPUBuffers are
    // zero-initialized per spec, and layout_mix=0 multiplies the B
    // term away, so with no isolate these cost one attribute fetch
    // and change nothing — honest zeros.
    let nodePosBVbo         = null, nodePosBVboSize         = 0;
    let edgePosBVbo         = null, edgePosBVboSize         = 0;
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

    // Phase 20G (2026-05-21) — transparent clear (a = 0) so the
    // .forge-bg-image element placed beneath the canvas can show
    // through the empty areas of the wheel. With alphaMode
    // 'premultiplied' a (0, 0, 0, 0) clear leaves the canvas alpha
    // at zero where nothing is drawn, letting the page composite
    // the BG image through. Disk / edge / glyph shaders all write
    // their own alpha for opaque-where-drawn coverage.
    const CLEAR_COLOR = { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };

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
        const viewData = new Float32Array(80);  // 320 / 4
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
        // 2026-07-31 — the two spare glyph_params lanes go live for
        // the EDGE pipeline. Absent ⇒ 0 ⇒ the pre-07-31 clamp and a
        // dead-flat bone, i.e. the honest-zero position for both.
        viewData[46] = (typeof frame.wireHotScreenPx === 'number')
          ? Math.max(0, frame.wireHotScreenPx) * dpr : 0;   // hot-wire FB px floor
        viewData[47] = (typeof frame.houseArcSag === 'number')
          ? frame.houseArcSag : 0;                          // bone bow / chord
        // ROUND-7 DRESS — recipe uniforms (floats 48..63). Absent
        // recipe ⇒ all zeros ⇒ the shader's honest-zero legacy path.
        const rc = frame.recipe || null;
        if (rc) {
          viewData[48] = rc.glow        || 0;
          viewData[49] = rc.pulse       || 0;
          viewData[50] = rc.glowReach   || 0;
          viewData[51] = (rc.gatePx     || 0) * dpr;
          viewData[52] = rc.hoverZoom   || 0;
          viewData[53] = rc.clickZoom   || 0;
          viewData[54] = rc.bubble      || 0;
          viewData[55] = rc.ether       || 0;
          viewData[56] = rc.timeSec     || 0;
          viewData[57] = rc.finStrength || 0;
          viewData[58] = (typeof rc.cursorX === 'number') ? rc.cursorX : -1e9;
          viewData[59] = (typeof rc.cursorY === 'number') ? rc.cursorY : -1e9;
          viewData[60] = rc.irid   ? 1 : 0;
          viewData[61] = rc.chroma ? 1 : 0;
          viewData[62] = (rc.chromaPx || 0) * dpr;
          viewData[63] = 6 * dpr;   // dress-gate ramp width (FB px)
          viewData[64] = (typeof rc.coreWhite === 'number') ? rc.coreWhite : 0.25;
          viewData[65] = (typeof rc.coreAlpha === 'number') ? rc.coreAlpha : 0.92;
          viewData[66] = (typeof rc.ringAlpha === 'number') ? rc.ringAlpha : 0.95;
          viewData[67] = dpr;   // P0-3: the ethereal blur is capped in CSS px
          // FULL-TRANSCRIPTION — the lens recipe (honest zeros hold:
          // absent values ⇒ 0 ⇒ the orb draws body density only).
          viewData[68] = rc.mag   || 0;
          viewData[69] = (rc.frostPx || 0) * dpr;
          viewData[70] = rc.depth || 0;
          viewData[71] = rc.needsBackdrop ? 1 : 0;
        }
        // THE HOUSE — layout ramp (float 72 = byte 288). HONEST LAW:
        // the mix can only be non-zero when BOTH position-B arrays
        // are supplied (or there are no edges) — otherwise a lone
        // node array would blend edges toward the zero-filled B
        // buffer and collapse them onto the origin.
        const lmRaw = (typeof frame.layoutMix === 'number') ? frame.layoutMix : 0;
        const lm = (frame.nodePosB && (frame.edgePosB || edgeCount === 0))
          ? Math.max(0, Math.min(1, lmRaw)) : 0;
        viewData[72] = lm;
        // layout_mix.y = glyph_scale — the glyph shader derives its
        // house radius from the shared pos_b.z (disk radius) × this.
        // Multiplied by the mix term, so it is inert at mix 0.
        viewData[73] = (typeof frame.glyphScale === 'number') ? frame.glyphScale : 0.85;
        // layout_mix.z = the PRIMARY lineage bone's width floor in FB
        // px; .w = the rest-wires threshold (an external class >= this
        // is hidden at rest). 3 hides nothing — and both only reach a
        // pixel through the per-instance house lane, which is zero
        // with no isolate, so the wheel is untouched either way.
        viewData[74] = (typeof frame.houseBonePx === 'number')
          ? Math.max(0, frame.houseBonePx) * dpr : 0;
        viewData[75] = (typeof frame.houseRestMinClass === 'number')
          ? frame.houseRestMinClass : 3;
        // 2026-08-02 WIRING FLAIR - floats 76..79 (bytes 304..319).
        // Read by the EDGE shader only. Absent => 0 => today exactly.
        viewData[76] = (typeof frame.wireFlow === 'number')
          ? Math.max(0, Math.min(1, frame.wireFlow)) : 0;
        viewData[77] = ((typeof frame.wireFlowSpeed === 'number') ? frame.wireFlowSpeed : 0) * dpr;
        viewData[78] = ((typeof frame.wireFlowLen === 'number') ? frame.wireFlowLen : 24) * dpr;
        viewData[79] = 0;   // reserved: candidate-B signature strength
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
          // ROUND-7 DRESS: 4 floats per instance. A legacy vec2
          // array (state, selected) is expanded in place so older
          // callers keep working — wake 0 / dress 0 = no dress.
          const stateBytes = nodeCount * 16;
          const r = ensureBuffer(nodeStateVbo, nodeStateVboSize, stateBytes, 'forge-node-state-vbo');
          nodeStateVbo = r.buf; nodeStateVboSize = r.size;
          let stateData = frame.nodeStates;
          if (!stateData) {
            stateData = new Float32Array(nodeCount * 4);
          } else if (stateData.length === nodeCount * 2) {
            const wide = new Float32Array(nodeCount * 4);
            for (let i = 0; i < nodeCount; i++) {
              wide[i * 4]     = stateData[i * 2];
              wide[i * 4 + 1] = stateData[i * 2 + 1];
            }
            stateData = wide;
          }
          device.queue.writeBuffer(nodeStateVbo, 0, stateData, 0, Math.floor(stateBytes / 4));
        }
        if (edgeCount > 0) {
          const stateBytes = edgeCount * 4;
          const r = ensureBuffer(edgeStateVbo, edgeStateVboSize, stateBytes, 'forge-edge-state-vbo');
          edgeStateVbo = r.buf; edgeStateVboSize = r.size;
          const stateData = frame.edgeStates || new Float32Array(edgeCount);
          device.queue.writeBuffer(edgeStateVbo, 0, stateData, 0, Math.floor(stateBytes / 4));
        }

        // ── THE HOUSE — position-B buffers (2026-07-30) ──
        // Always allocated so the pipelines' [3] slot has a buffer to
        // bind. New GPUBuffers are zero-initialized (WebGPU spec), and
        // the upload is gated on the caller actually supplying B data,
        // so the no-isolate path never uploads and never changes.
        if (nodeCount > 0) {
          // 2026-07-30 — 4 floats/instance (xy tree pos, z house
          // radius, w pad). Fresh buffers stay zero-initialized; the
          // z lane only matters when layout_mix > 0.
          const bytes = nodeCount * 16;
          const r = ensureBuffer(nodePosBVbo, nodePosBVboSize, bytes, 'forge-node-posb-vbo');
          nodePosBVbo = r.buf; nodePosBVboSize = r.size;
          // The length test is BELT AND BRACES (2026-07-31 wave 2). The
          // caller sizes both B arrays from its own live edge/node
          // lists now, so a skew should be impossible; if one ever
          // returns, a stale frame is a far cheaper failure than an
          // uncaught OperationError thrown mid-rebake, which strands
          // _isolateFamily and _house pointing at different families.
          if (frame.nodePosB && frame.nodePosB.length >= nodeCount * 4
              && (frame.nodePosBDirty || r.grew)) {
            device.queue.writeBuffer(nodePosBVbo, 0, frame.nodePosB, 0, nodeCount * 4);
          }
        }
        if (edgeCount > 0) {
          // 2026-07-31 — 6 floats/instance: p0b.xy, p2b.xy, then the
          // house lane (bone weight×side, external class). Widened
          // from 4; the caller's array grew with it.
          const bytes = edgeCount * 24;
          const r = ensureBuffer(edgePosBVbo, edgePosBVboSize, bytes, 'forge-edge-posb-vbo');
          edgePosBVbo = r.buf; edgePosBVboSize = r.size;
          if (frame.edgePosB && frame.edgePosB.length >= edgeCount * 6
              && (frame.edgePosBDirty || r.grew)) {
            device.queue.writeBuffer(edgePosBVbo, 0, frame.edgePosB, 0, edgeCount * 6);
          }
        }

        // ── Encode + submit ───────────────────────────
        const encoder = device.createCommandEncoder({ label: 'forge-frame' });
        const dTex = ensureDepthTex(canvas.width, canvas.height);
        // FULL-TRANSCRIPTION — when an orb cast is live, ground +
        // wires render OFFSCREEN first (the lab's O: no rings, no
        // glow, no symbols) and the main pass starts from a blit of
        // that backdrop. ONE edge-draw recorder either way — the two
        // paths can never drift.
        const needsBackdrop = !!(frame.recipe && frame.recipe.needsBackdrop);
        const drawEdgesInto = (p) => {
          if (edgeCount <= 0) return;
          p.setPipeline(edgePipeline);
          p.setBindGroup(0, viewBg);
          p.setVertexBuffer(0, edgeRibbonVbo);
          p.setVertexBuffer(1, edgeInstanceVbo);
          p.setVertexBuffer(2, edgeStateVbo);
          p.setVertexBuffer(3, edgePosBVbo);
          p.draw(EDGE_RIBBON_COUNT, edgeCount);
        };
        if (needsBackdrop) {
          ensureBackdropTex(canvas.width, canvas.height);
          const bpass = encoder.beginRenderPass({
            colorAttachments: [{
              view: backdropTex.createView(),
              clearValue: CLEAR_COLOR, loadOp: 'clear', storeOp: 'store',
            }],
            depthStencilAttachment: {
              view: dTex.createView(),
              depthClearValue: 1.0, depthLoadOp: 'clear', depthStoreOp: 'store',
            },
          });
          drawEdgesInto(bpass);
          bpass.end();
        }
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

        if (needsBackdrop) {
          // bottom layer = the backdrop (ground + wires), blitted
          pass.setPipeline(blitPipeline);
          pass.setBindGroup(0, blitBg);
          pass.draw(3);
        } else {
          drawEdgesInto(pass);
        }
        // ROUND-7b — the light pass first: glow + halo BEHIND all
        // symbols, no depth writes (fixes the glow-quad clipping).
        if (nodeCount > 0 && frame.recipe) {
          pass.setPipeline(nodeGlowPipeline);
          pass.setBindGroup(0, viewBg);
          pass.setVertexBuffer(0, quadVbo);
          pass.setVertexBuffer(1, nodeInstanceVbo);
          pass.setVertexBuffer(2, nodeStateVbo);
          pass.setVertexBuffer(3, nodePosBVbo);
          pass.draw(6, nodeCount);
        }
        if (nodeCount > 0) {
          // recipe ⇒ painter-order twin (no depth writes — light can
          // never erase a neighbor's ring); legacy ⇒ z-layered.
          pass.setPipeline(frame.recipe ? nodePipelineNoZ : nodePipeline);
          pass.setBindGroup(0, nodeBg);   // ubo + backdrop (orb lens)
          pass.setVertexBuffer(0, quadVbo);
          pass.setVertexBuffer(1, nodeInstanceVbo);
          pass.setVertexBuffer(2, nodeStateVbo);
          pass.setVertexBuffer(3, nodePosBVbo);
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
          // [3] = same nodePosBVbo — glyph instances are 1:1 with
          // node instances, so glyphs ride the layout ramp too.
          pass.setVertexBuffer(3, nodePosBVbo);
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
