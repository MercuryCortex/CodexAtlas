// ============================================================
// CODEX ATLAS — ENGINE TYPES
// ============================================================
// Visual style vocabulary. Hand-ported from the portable core's src/types.ts
// which itself hand-mirrors the portable core's Rust structs.
//
// Every shape declared here corresponds to a Rust struct in
// the portable core. The future Rust+WASM port replaces this file's
// constants/helpers with WASM bindings — the field names and
// semantics MUST match the portable core. When fields are added/removed
// here, the intent must align with the portable core's intent.
//
// Read `src/js/engine/README.md` § "Architecture invariants"
// before editing.
// ============================================================

(function () {
  'use strict';

  // ── Stroke / fill enums ────────────────────────────────────
  // Match the portable core string-literal enums exactly.

  const STROKE_ALIGN = Object.freeze({
    CENTER:  'center',   // half outside, half inside the path
    INSIDE:  'inside',   // entirely inside
    OUTSIDE: 'outside',  // entirely outside
  });

  const STROKE_CAP = Object.freeze({
    BUTT:   'butt',     // flat at endpoint
    ROUND:  'round',
    SQUARE: 'square',
  });

  const STROKE_JOIN = Object.freeze({
    MITER: 'miter',
    ROUND: 'round',
    BEVEL: 'bevel',
  });

  const ARROW_STYLE = Object.freeze({
    NONE:     'none',
    ARROW:    'arrow',
    TRIANGLE: 'triangle',
    DOT:      'dot',
    DIAMOND:  'diamond',
  });

  // ── Blend modes (Canvas2D / Porter-Duff / advanced) ────────
  // Identical set to CSS / Canvas globalCompositeOperation /
  // WebGPU blend states. The WebGPU implementation maps these
  // to BlendComponent descriptors per Porter-Duff equations.

  const BLEND_MODE = Object.freeze({
    NORMAL:      'normal',
    MULTIPLY:    'multiply',
    SCREEN:      'screen',
    OVERLAY:     'overlay',
    DARKEN:      'darken',
    LIGHTEN:     'lighten',
    COLOR_DODGE: 'color-dodge',
    COLOR_BURN:  'color-burn',
    HARD_LIGHT:  'hard-light',
    SOFT_LIGHT:  'soft-light',
    DIFFERENCE:  'difference',
    EXCLUSION:   'exclusion',
    HUE:         'hue',
    SATURATION:  'saturation',
    COLOR:       'color',
    LUMINOSITY:  'luminosity',
  });

  // ── Gradient kinds ─────────────────────────────────────────
  // Linear: (x1, y1) → (x2, y2) plus stops.
  // Radial: center (cx, cy) + radius r + optional focal (fx, fy).
  // Conic:  center (cx, cy) + start angle (rad).
  // Diamond: center (cx, cy) + radius + rotation (rad).
  //
  // GradientStop: { offset: 0..1, color: '#rrggbb' | rgba(...), opacity?: 0..1 }
  //
  // Constructed via the helper factories below so the renderer
  // can rely on shape invariants without defensive checks.

  const GRADIENT_KIND = Object.freeze({
    LINEAR:  'linear',
    RADIAL:  'radial',
    CONIC:   'conic',
    DIAMOND: 'diamond',
  });

  function linearGradient(x1, y1, x2, y2, stops) {
    return { type: GRADIENT_KIND.LINEAR, x1, y1, x2, y2, stops };
  }
  function radialGradient(cx, cy, r, stops, fx, fy) {
    const g = { type: GRADIENT_KIND.RADIAL, cx, cy, r, stops };
    if (fx !== undefined) g.fx = fx;
    if (fy !== undefined) g.fy = fy;
    return g;
  }
  function conicGradient(cx, cy, angle, stops) {
    return { type: GRADIENT_KIND.CONIC, cx, cy, angle, stops };
  }
  function diamondGradient(cx, cy, r, angle, stops) {
    return { type: GRADIENT_KIND.DIAMOND, cx, cy, r, angle, stops };
  }

  // ── Transform (affine 2×3) ─────────────────────────────────
  // Row-major:    | m00  m01  m02 |
  //               | m10  m11  m12 |
  // Identity = { m00:1, m01:0, m02:0, m10:0, m11:1, m12:0 }
  //
  // This is exactly the shape the portable core's Transform struct uses,
  // so a future WASM port reads these fields directly without
  // a wrapping conversion.

  function identity() {
    return { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 };
  }

  // ── Style (the visual vocabulary every shape can carry) ────
  // Mirrors the portable core's Style struct verbatim. Optional fields
  // are nullable to match Rust's Option<T>.
  //
  // Most callers want the helpers below (solidFill, withStroke,
  // etc.) rather than constructing the whole record by hand.

  function defaultStyle() {
    return {
      fill:               null,                      // string | null (solid hex / rgba)
      stroke:             null,                      // string | null
      stroke_width:       0,                         // world-space pixels
      opacity:            1,                         // overall, multiplied with fill_/stroke_opacity
      fill_opacity:       1,
      stroke_opacity:     1,
      stroke_align:       STROKE_ALIGN.CENTER,
      stroke_cap:         STROKE_CAP.BUTT,
      stroke_join:        STROKE_JOIN.MITER,
      fill_gradient:      null,                      // Gradient | null
      stroke_gradient:    null,
      fill_image:         null,                      // FillImage | null
      shadows:            null,                      // Shadow[] | null
      blur:               0,                         // world-space pixels
      background_blur:    0,
      stroke_dash:        null,                      // number[] | null  [dash, gap, ...]
      arrow_start:        ARROW_STYLE.NONE,
      arrow_end:          ARROW_STYLE.NONE,
      blend_mode:         BLEND_MODE.NORMAL,
      mask_gradient:      null,
      stroke_scaling:     true,                      // stroke width scales with transform
    };
  }

  // Convenience constructors — the renderer's hot path expects
  // a fully-formed Style record. These helpers avoid `defaultStyle`
  // boilerplate at every call site.

  function solidFill(color, opacity) {
    const s = defaultStyle();
    s.fill = color;
    if (opacity !== undefined) s.fill_opacity = opacity;
    return s;
  }
  function solidStroke(color, width, opacity) {
    const s = defaultStyle();
    s.stroke = color;
    s.stroke_width = width;
    if (opacity !== undefined) s.stroke_opacity = opacity;
    return s;
  }
  function fillAndStroke(fillColor, strokeColor, strokeWidth) {
    const s = defaultStyle();
    s.fill = fillColor;
    s.stroke = strokeColor;
    s.stroke_width = strokeWidth;
    return s;
  }

  // ── Shadow ─────────────────────────────────────────────────
  // Drop shadow OR inner shadow per `inset`. Multiple shadows
  // render in declaration order.

  function shadow(offsetX, offsetY, blur, color, opacity, inset, spread) {
    return {
      offset_x: offsetX,
      offset_y: offsetY,
      blur:     blur,
      spread:   spread || 0,
      color:    color,
      opacity:  opacity !== undefined ? opacity : 1,
      inset:    !!inset,
    };
  }

  // ── Path-node types (bezier vertex roles) ──────────────────
  // PathNode discrimination:
  //   corner       — handles independent; sharp corners
  //   smooth       — handles co-linear, equal length; G2 continuous
  //   anglelocked  — handles co-linear, independent lengths; G1 continuous

  const PATH_NODE_TYPE = Object.freeze({
    CORNER:      'corner',
    SMOOTH:      'smooth',
    ANGLELOCKED: 'anglelocked',
  });

  // ── Fill rule for compound paths ───────────────────────────
  const FILL_RULE = Object.freeze({
    NONZERO: 'nonzero',
    EVENODD: 'evenodd',
  });

  // ── Text alignment / autoresize ────────────────────────────
  const TEXT_ALIGN = Object.freeze({
    LEFT:   'left',
    CENTER: 'center',
    RIGHT:  'right',
  });
  const VERTICAL_ALIGN = Object.freeze({
    TOP:    'top',
    MIDDLE: 'middle',
    BOTTOM: 'bottom',
  });
  const TEXT_DECORATION = Object.freeze({
    NONE:          'none',
    UNDERLINE:     'underline',
    STRIKETHROUGH: 'strikethrough',
  });

  // ── Export ─────────────────────────────────────────────────
  window.AtlasEngineTypes = Object.freeze({
    STROKE_ALIGN,
    STROKE_CAP,
    STROKE_JOIN,
    ARROW_STYLE,
    BLEND_MODE,
    GRADIENT_KIND,
    PATH_NODE_TYPE,
    FILL_RULE,
    TEXT_ALIGN,
    VERTICAL_ALIGN,
    TEXT_DECORATION,

    // factories
    identity,
    linearGradient,
    radialGradient,
    conicGradient,
    diamondGradient,
    defaultStyle,
    solidFill,
    solidStroke,
    fillAndStroke,
    shadow,
  });
})();
