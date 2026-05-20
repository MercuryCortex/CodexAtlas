// ============================================================
// CODEX ATLAS — TYPE-SHAPE GLYPH VOCABULARY
// ============================================================
// One geometric primitive per node type. Painted as inline SVG
// inside a 12×12 unit viewBox; `currentColor` lets the consumer
// drive stroke/fill via CSS color (so the glyph picks up a
// lighter hue of the family color at idle).
//
// Hand-illustrated vectors slot in by replacing the entry —
// the rest of the code (graph/glyph layer in forge.js) is
// invariant.
//
// Source: ported from src/js/views/pantheon-v2.js TYPE_GLYPHS
// (the v2 view's first-pass primitive set) so Forge ships
// visually consistent with the existing Pantheon while we're
// building. The dedicated color/style/dogma batch will revisit
// these as a unified set.
// ============================================================

(function () {
  'use strict';

  // Each value is the INNER markup of an `<svg viewBox="0 0 12 12">`.
  // Stroke / fill uses `currentColor` so the wrapping element's
  // `color` property paints them.
  const TYPE_GLYPHS = Object.freeze({
    deity:       '<circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" stroke-width="0.9"/><circle cx="6" cy="6" r="2.2" fill="currentColor"/>',
    person:      '<circle cx="6" cy="4" r="1.7" fill="currentColor"/><path d="M2.7,10 Q6,6.6 9.3,10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    document:    '<rect x="3.2" y="1.8" width="5.6" height="8.4" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M4.4,4.2 L7.6,4.2 M4.4,6 L7.6,6 M4.4,7.8 L6.6,7.8" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>',
    symbol:      '<path d="M6,1.6 L7.3,5 L10.6,6 L7.3,7 L6,10.4 L4.7,7 L1.4,6 L4.7,5 Z" fill="currentColor"/>',
    event:       '<path d="M6,1.6 L10.4,6 L6,10.4 L1.6,6 Z" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="6" cy="6" r="1.4" fill="currentColor"/>',
    ritual:      '<path d="M6,1.4 L6,10.6 M1.4,6 L10.6,6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    // Music — single quarter-note (head + stem). Matches the `♩`
    // glyph used in the mode dropdown.
    music:       '<path d="M8.6,2 L8.6,8.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><ellipse cx="5.6" cy="8.6" rx="2.4" ry="1.7" fill="currentColor" transform="rotate(-22 5.6 8.6)"/>',
    alphabet:    '<path d="M2.8,10.4 L6,1.8 L9.2,10.4 M4.2,7.6 L7.8,7.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    alchemy:     '<path d="M6,1.6 L10.6,9.8 L1.4,9.8 Z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M3.6,7 L8.4,7" stroke="currentColor" stroke-width="1.1"/>',
    philosophy:  '<circle cx="6" cy="6" r="3.6" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="6" cy="6" r="0.9" fill="currentColor"/>',
    moral:       '<path d="M2.2,3.8 L9.8,3.8 M6,3.8 L6,9.8 M3.5,9.8 L8.5,9.8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none"/><path d="M2.4,3.8 Q1.4,5.8 3.4,5.8 Q5.4,5.8 4.4,3.8 M7.6,3.8 Q6.6,5.8 8.6,5.8 Q10.6,5.8 9.6,3.8" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>',
    medicine:    '<path d="M6,1.6 L6,10.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M3.8,3.6 Q6,2.4 8.2,3.6 M3.8,6 Q6,4.8 8.2,6 M3.8,8.4 Q6,7.2 8.2,8.4" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>',
    mathematics: '<circle cx="6" cy="6" r="3.6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6,2.4 L6,9.6 M2.4,6 L9.6,6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
    monument:    '<rect x="4.2" y="1.8" width="3.6" height="8" fill="currentColor"/><rect x="2.6" y="9" width="6.8" height="1.6" fill="currentColor"/>',
    theme:       '<circle cx="6" cy="6" r="1.6" fill="currentColor"/><circle cx="6" cy="6" r="3.6" fill="none" stroke="currentColor" stroke-width="0.9" stroke-dasharray="1.3 1.3"/>',
    tradition:   '<circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="6" cy="6" r="1" fill="currentColor"/>',
    place:       '<path d="M6,1.6 C8.5,1.6 10,3.4 10,5.4 C10,7.8 6,10.6 6,10.6 C6,10.6 2,7.8 2,5.4 C2,3.4 3.5,1.6 6,1.6 Z" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="6" cy="5.2" r="1.3" fill="currentColor"/>',
  });

  // Some legacy node `type` strings map onto the vocabulary above.
  const TYPE_ALIAS = Object.freeze({
    deities: 'deity', persons: 'person', documents: 'document', symbols: 'symbol',
    events: 'event', rituals: 'ritual', alchemys: 'alchemy', mathematics: 'mathematics',
    monuments: 'monument', themes: 'theme', traditions: 'tradition', places: 'place',
  });

  function typeKey(type) {
    if (!type) return 'theme';
    return TYPE_ALIAS[type] || (TYPE_GLYPHS[type] ? type : 'theme');
  }

  // Return the inner-markup string for a given node type.
  // Caller wraps in `<svg viewBox="0 0 12 12">…</svg>` and sets
  // `color` on the wrapper to drive `currentColor`.
  function glyphMarkup(type) {
    return TYPE_GLYPHS[typeKey(type)] || TYPE_GLYPHS.theme;
  }

  // Convenience: full `<svg>` string at a given pixel size.
  // The renderer doesn't need this (it consumes raw inner markup),
  // but the type-glyph DOM overlay in forge.js does.
  function fullSvg(type, sizePx) {
    return '<svg width="' + sizePx + '" height="' + sizePx + '" viewBox="0 0 12 12" aria-hidden="true" overflow="visible">'
      + glyphMarkup(type)
      + '</svg>';
  }

  // 2026-05-20 — atlas rasterizer. Builds ONE canvas containing
  // every TYPE_GLYPHS entry rasterized at `cellPx` resolution,
  // arranged in a grid. Returns the canvas + per-type UV rects
  // (in [0,1] atlas coords) + a `typeToIdx` Map for shader-side
  // lookup. The atlas uploads to a single WebGPU texture; the
  // glyph render pass then samples it per node instance.
  //
  // Color: glyphs rasterized in WHITE (substituting `currentColor`).
  // The shader multiplies by a per-instance tint so the family
  // color drives the visible color — same logical behavior as the
  // pre-2026-05-20 DOM-overlay approach, just in the GPU pipeline.
  //
  // Async because SVG → Image loading is async. Awaited once at
  // engine boot, then re-used for the lifetime of the page.
  async function buildAtlas(cellPx) {
    const types = Object.keys(TYPE_GLYPHS);
    const cols = Math.ceil(Math.sqrt(types.length));   // 17 → 5
    const rows = Math.ceil(types.length / cols);       // 17/5 = 4
    const atlasW = cols * cellPx;
    const atlasH = rows * cellPx;
    const canvas = document.createElement('canvas');
    canvas.width  = atlasW;
    canvas.height = atlasH;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, atlasW, atlasH);
    const uvRects = new Float32Array(types.length * 4);  // (u0,v0,u1,v1) per type
    const typeToIdx = Object.create(null);
    // Rasterize each SVG into its grid cell.
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const col = i % cols, row = Math.floor(i / cols);
      const x = col * cellPx, y = row * cellPx;
      // Substitute currentColor → white so the rasterized glyph
      // is the "stencil" the shader tints. Stroke + fill alike.
      const inner = TYPE_GLYPHS[type].replace(/currentColor/g, '#ffffff');
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + cellPx
        + '" height="' + cellPx + '" viewBox="0 0 12 12">' + inner + '</svg>';
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url  = URL.createObjectURL(blob);
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
        ctx.drawImage(img, x, y, cellPx, cellPx);
      } finally {
        URL.revokeObjectURL(url);
      }
      uvRects[i * 4 + 0] = x / atlasW;
      uvRects[i * 4 + 1] = y / atlasH;
      uvRects[i * 4 + 2] = (x + cellPx) / atlasW;
      uvRects[i * 4 + 3] = (y + cellPx) / atlasH;
      typeToIdx[type] = i;
    }
    // Aliases route to canonical types (no extra atlas cells).
    for (const [alias, target] of Object.entries(TYPE_ALIAS)) {
      if (target in typeToIdx) typeToIdx[alias] = typeToIdx[target];
    }
    // Phase 4B FX4 (2026-05-20) — generate mip pyramid via
    // browser drawImage downsampling. Each successive level halves
    // both dims (ceil so a 5×4-cell atlas's odd dims still produce
    // a valid chain to 1×1). The browser's scaled drawImage
    // applies a reasonable filter — sharper than naive box average
    // for hand-illustrated SVG content. Used by setGlyphAtlas to
    // upload mip 0..N so the sampler's `mipmapFilter:'linear'`
    // actually has a mip chain to interpolate.
    const mipCanvases = [canvas];
    let prev   = canvas;
    let mipW   = atlasW;
    let mipH   = atlasH;
    while (mipW > 1 || mipH > 1) {
      mipW = Math.max(1, mipW >> 1);
      mipH = Math.max(1, mipH >> 1);
      const mipCanvas = document.createElement('canvas');
      mipCanvas.width  = mipW;
      mipCanvas.height = mipH;
      const mctx = mipCanvas.getContext('2d');
      mctx.imageSmoothingEnabled = true;
      mctx.imageSmoothingQuality = 'high';
      mctx.clearRect(0, 0, mipW, mipH);
      mctx.drawImage(prev, 0, 0, mipW, mipH);
      mipCanvases.push(mipCanvas);
      prev = mipCanvas;
    }
    return { canvas, mipCanvases, uvRects, typeToIdx, cellPx, cols, rows };
  }

  function idxForType(typeToIdx, type) {
    if (!type) return typeToIdx.theme || 0;
    if (type in typeToIdx) return typeToIdx[type];
    const alias = TYPE_ALIAS[type];
    if (alias && (alias in typeToIdx)) return typeToIdx[alias];
    return typeToIdx.theme || 0;
  }

  window.AtlasEngineGlyph = Object.freeze({
    TYPE_GLYPHS,
    typeKey,
    glyphMarkup,
    fullSvg,
    buildAtlas,
    idxForType,
  });
})();
