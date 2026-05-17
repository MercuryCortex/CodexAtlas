// ============================================================
// CODEX ATLAS — ICON LIBRARY
// ============================================================
// Curated SVG icon primitives for the dev panel's per-node-type
// picker. Each icon is inner `<svg viewBox="0 0 12 12">` markup
// using `currentColor` so the wrapper element drives the paint.
//
// First-pass curation: ~50 icons across 6 categories. Hand-
// crafted to read clearly at 12×12 unit scale. When John picks
// a richer commercial set (or hand-illustrated vectors arrive),
// just replace the entries in ICONS — the picker code is
// invariant.
//
// Source inspiration (not copied — all reproduced fresh in our
// 12×12 viewBox vocabulary): geometric / sacred / natural /
// objects / architectural / abstract families that recur across
// historical iconography. Compatible with the public icones.js.org
// taxonomy John pointed at; we can ingest their packs later via
// the same registry shape.
// ============================================================

(function () {
  'use strict';

  // Each entry:
  //   id        stable identifier (used by setIcon mapping)
  //   label     human-readable name (shown on hover in the picker)
  //   category  group for the picker UI
  //   markup    inner SVG (string) — wrapped by the consumer in
  //             <svg viewBox="0 0 12 12">…</svg>
  const ICONS = Object.freeze({

    // ── GEOMETRIC ───────────────────────────────────────
    'circle-filled':   { label: 'Filled circle',        category: 'geometric', markup: '<circle cx="6" cy="6" r="4.5" fill="currentColor"/>' },
    'ring':            { label: 'Ring',                  category: 'geometric', markup: '<circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" stroke-width="1.2"/>' },
    'ring-dot':        { label: 'Ring with inner dot',   category: 'geometric', markup: '<circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" stroke-width="0.9"/><circle cx="6" cy="6" r="2.2" fill="currentColor"/>' },
    'ring-double':     { label: 'Concentric rings',      category: 'geometric', markup: '<circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" stroke-width="0.9"/><circle cx="6" cy="6" r="2.6" fill="none" stroke="currentColor" stroke-width="0.9"/>' },
    'triangle':        { label: 'Triangle',              category: 'geometric', markup: '<path d="M6,1.6 L10.6,9.8 L1.4,9.8 Z" fill="none" stroke="currentColor" stroke-width="1.3"/>' },
    'triangle-down':   { label: 'Inverted triangle',     category: 'geometric', markup: '<path d="M1.4,2.2 L10.6,2.2 L6,10.4 Z" fill="none" stroke="currentColor" stroke-width="1.3"/>' },
    'square':          { label: 'Square outline',        category: 'geometric', markup: '<rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.2"/>' },
    'square-filled':   { label: 'Filled square',         category: 'geometric', markup: '<rect x="2" y="2" width="8" height="8" fill="currentColor"/>' },
    'diamond':         { label: 'Diamond',               category: 'geometric', markup: '<path d="M6,1.6 L10.4,6 L6,10.4 L1.6,6 Z" fill="none" stroke="currentColor" stroke-width="1.3"/>' },
    'diamond-dot':     { label: 'Diamond with dot',      category: 'geometric', markup: '<path d="M6,1.6 L10.4,6 L6,10.4 L1.6,6 Z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="6" cy="6" r="1.3" fill="currentColor"/>' },
    'hexagon':         { label: 'Hexagon',               category: 'geometric', markup: '<path d="M6,1.6 L10.2,3.8 L10.2,8.2 L6,10.4 L1.8,8.2 L1.8,3.8 Z" fill="none" stroke="currentColor" stroke-width="1.2"/>' },
    'pentagon':        { label: 'Pentagon',              category: 'geometric', markup: '<path d="M6,1.6 L10.4,5 L8.6,10.4 L3.4,10.4 L1.6,5 Z" fill="none" stroke="currentColor" stroke-width="1.2"/>' },

    // ── STARS ───────────────────────────────────────────
    'star-3':          { label: '3-point star',          category: 'stars',     markup: '<path d="M6,1.6 L7.6,7.4 L10.6,8.5 L6,10.4 L1.4,8.5 L4.4,7.4 Z" fill="currentColor"/>' },
    'star-4':          { label: '4-point star',          category: 'stars',     markup: '<path d="M6,1.6 L7.3,5 L10.6,6 L7.3,7 L6,10.4 L4.7,7 L1.4,6 L4.7,5 Z" fill="currentColor"/>' },
    'star-5':          { label: '5-point star',          category: 'stars',     markup: '<path d="M6,1.4 L7.4,4.8 L11,4.9 L8.2,7.2 L9.2,10.6 L6,8.6 L2.8,10.6 L3.8,7.2 L1,4.9 L4.6,4.8 Z" fill="currentColor"/>' },
    'star-6':          { label: '6-point star',          category: 'stars',     markup: '<path d="M6,1.4 L7.3,4.4 L10.6,4.7 L8.1,6.7 L9,9.8 L6,8.1 L3,9.8 L3.9,6.7 L1.4,4.7 L4.7,4.4 Z" fill="currentColor"/>' },
    'star-8':          { label: '8-point star',          category: 'stars',     markup: '<path d="M6,1.4 L7,4 L9.4,2.6 L9.4,5.4 L11,6 L9.4,6.6 L9.4,9.4 L7,8 L6,10.6 L5,8 L2.6,9.4 L2.6,6.6 L1,6 L2.6,5.4 L2.6,2.6 L5,4 Z" fill="currentColor"/>' },
    'sparkle':         { label: 'Sparkle',               category: 'stars',     markup: '<path d="M6,1 L6.7,5.3 L11,6 L6.7,6.7 L6,11 L5.3,6.7 L1,6 L5.3,5.3 Z" fill="currentColor"/>' },
    'asterisk':        { label: 'Asterisk',              category: 'stars',     markup: '<path d="M6,1.4 L6,10.6 M1.4,3.7 L10.6,8.3 M1.4,8.3 L10.6,3.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },

    // ── SACRED / RELIGIOUS ──────────────────────────────
    'cross-latin':     { label: 'Latin cross',           category: 'sacred',    markup: '<path d="M6,1.6 L6,10.6 M3.2,4.4 L8.8,4.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
    'cross-greek':     { label: 'Greek cross',           category: 'sacred',    markup: '<path d="M6,1.6 L6,10.4 M1.6,6 L10.4,6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' },
    'cross-orthodox':  { label: 'Orthodox cross',        category: 'sacred',    markup: '<path d="M6,1.4 L6,10.6 M3.6,3.2 L8.4,3.2 M2.6,5.4 L9.4,5.4 M3.4,8.6 L8.6,7.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>' },
    'cross-coptic':    { label: 'Coptic cross',          category: 'sacred',    markup: '<path d="M6,1.4 L6,10.6 M1.4,6 L10.6,6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="6" cy="6" r="2.4" fill="none" stroke="currentColor" stroke-width="1.1"/>' },
    'ankh':            { label: 'Ankh',                  category: 'sacred',    markup: '<ellipse cx="6" cy="4" rx="2.2" ry="2.4" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6,6.4 L6,10.6 M3.4,7.8 L8.6,7.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' },
    'star-david':      { label: 'Star of David',         category: 'sacred',    markup: '<path d="M6,1.4 L10.4,8.8 L1.6,8.8 Z M6,10.6 L1.6,3.2 L10.4,3.2 Z" fill="none" stroke="currentColor" stroke-width="1.1"/>' },
    'pentagram':       { label: 'Pentagram',             category: 'sacred',    markup: '<path d="M6,1.4 L7.4,8.5 L1.4,4.6 L10.6,4.6 L4.6,8.5 Z" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>' },
    'crescent':        { label: 'Crescent moon',         category: 'sacred',    markup: '<path d="M9,2 A 4.4 4.4 0 1 0 9,10 A 3.5 3.5 0 1 1 9,2 Z" fill="currentColor"/>' },
    'taijitu':         { label: 'Taijitu (yin–yang)',    category: 'sacred',    markup: '<circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" stroke-width="0.9"/><path d="M6 1.4 A 4.6 4.6 0 0 0 6 10.6 A 2.3 2.3 0 0 0 6 6 A 2.3 2.3 0 0 1 6 1.4 Z" fill="currentColor"/><circle cx="6" cy="3.7" r="0.6" fill="none" stroke="currentColor" stroke-width="0.5"/><circle cx="6" cy="8.3" r="0.6" fill="currentColor"/>' },
    'om':              { label: 'Om (simplified)',       category: 'sacred',    markup: '<path d="M2.5,6.5 Q2.5,4 5,4 Q7.4,4 7.4,6.5 Q7.4,9 5,9 Q3.5,9 3.2,7.4 M7.6,4 Q9.5,4 9.5,6 Q9.5,9 7.4,9 M9.4,2.5 A 0.7 0.7 0 1 0 9.4,2.6" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>' },
    'lotus':           { label: 'Lotus',                 category: 'sacred',    markup: '<path d="M6,3 Q4,5 6,8 Q8,5 6,3 M3,5 Q3,7 6,8 Q5,6 4,5 Z M9,5 Q9,7 6,8 Q7,6 8,5 Z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>' },

    // ── NATURE ──────────────────────────────────────────
    'sun-rays':        { label: 'Sun with rays',         category: 'nature',    markup: '<circle cx="6" cy="6" r="2.4" fill="currentColor"/><path d="M6,1 L6,2.6 M6,9.4 L6,11 M1,6 L2.6,6 M9.4,6 L11,6 M2.5,2.5 L3.7,3.7 M8.3,8.3 L9.5,9.5 M2.5,9.5 L3.7,8.3 M8.3,3.7 L9.5,2.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>' },
    'sun-disc':        { label: 'Sun disc',              category: 'nature',    markup: '<circle cx="6" cy="6" r="3.8" fill="currentColor"/>' },
    'moon-full':       { label: 'Full moon',             category: 'nature',    markup: '<circle cx="6" cy="6" r="3.8" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="4.6" cy="5" r="0.5" fill="currentColor"/><circle cx="7.2" cy="6.8" r="0.4" fill="currentColor"/><circle cx="5.6" cy="7.6" r="0.3" fill="currentColor"/>' },
    'flame':           { label: 'Flame',                 category: 'nature',    markup: '<path d="M6,1.4 Q3.2,4 4.4,7 Q5.4,8.4 6,10.4 Q6.6,8.4 7.6,7 Q9,4 6,1.4 Z M5.2,6 Q5.6,7.2 6,8 Q6.4,7.2 6.8,6" fill="currentColor"/>' },
    'water-drop':      { label: 'Water drop',            category: 'nature',    markup: '<path d="M6,1.4 Q3,5 3,7.5 A 3 3 0 0 0 9,7.5 Q9,5 6,1.4 Z" fill="currentColor"/>' },
    'leaf':            { label: 'Leaf',                  category: 'nature',    markup: '<path d="M2,10 Q2,2 10,2 Q10,10 2,10 Z M3,9 Q6,6 9,3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>' },
    'tree':            { label: 'Tree',                  category: 'nature',    markup: '<circle cx="6" cy="4.5" r="2.8" fill="currentColor"/><path d="M6,7 L6,10.6 M4.4,10.6 L7.6,10.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>' },
    'mountain':        { label: 'Mountain',              category: 'nature',    markup: '<path d="M1.4,10 L4.6,4 L6.6,7 L8.4,5 L10.6,10 Z" fill="currentColor"/>' },

    // ── OBJECT / ARTEFACT ───────────────────────────────
    'scroll':          { label: 'Scroll',                category: 'object',    markup: '<path d="M3,3 Q3,2 4,2 L9,2 Q10,2 10,3 L10,9 Q10,10 9,10 L4,10 Q3,10 3,9 Z" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M5,4.5 L8,4.5 M5,6 L8,6 M5,7.5 L7,7.5" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>' },
    'book':            { label: 'Book',                  category: 'object',    markup: '<rect x="2.4" y="2" width="7.2" height="8" rx="0.4" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M6,2 L6,10" stroke="currentColor" stroke-width="0.8"/>' },
    'page':            { label: 'Page with lines',       category: 'object',    markup: '<rect x="3.2" y="1.8" width="5.6" height="8.4" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M4.4,4.2 L7.6,4.2 M4.4,6 L7.6,6 M4.4,7.8 L6.6,7.8" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>' },
    'tablet':          { label: 'Stone tablet',          category: 'object',    markup: '<path d="M3,2.5 Q3,1.5 6,1.5 Q9,1.5 9,2.5 L9,10.5 L3,10.5 Z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M4.4,5 L7.6,5 M4.4,7 L7.6,7" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>' },
    'eye':             { label: 'Eye',                   category: 'object',    markup: '<path d="M1.4,6 Q6,2 10.6,6 Q6,10 1.4,6 Z" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="6" cy="6" r="1.4" fill="currentColor"/>' },
    'hand':            { label: 'Hand',                  category: 'object',    markup: '<path d="M4.4,10.6 L4.4,5 Q4.4,4 5,4 Q5.6,4 5.6,5 L5.6,2 Q5.6,1 6.2,1 Q6.8,1 6.8,2 L6.8,4.5 L7.2,2.5 Q7.4,1.8 8,2 Q8.6,2.2 8.4,3 L7.7,6 L7.6,10.6 Z" fill="none" stroke="currentColor" stroke-width="0.9" stroke-linejoin="round"/>' },
    'key':             { label: 'Key',                   category: 'object',    markup: '<circle cx="3.5" cy="6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M5.7,6 L10.6,6 M8.4,6 L8.4,7.6 M9.6,6 L9.6,8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>' },

    // ── ARCHITECTURAL ───────────────────────────────────
    'pillar':          { label: 'Pillar',                category: 'architectural', markup: '<rect x="4.2" y="1.8" width="3.6" height="8" fill="currentColor"/><rect x="2.6" y="9" width="6.8" height="1.6" fill="currentColor"/>' },
    'pyramid':         { label: 'Pyramid',               category: 'architectural', markup: '<path d="M6,1.6 L10.6,10 L1.4,10 Z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6,1.6 L6,10" stroke="currentColor" stroke-width="0.7" stroke-dasharray="0.6 0.6"/>' },
    'dome':            { label: 'Dome',                  category: 'architectural', markup: '<path d="M2,9 Q2,3 6,3 Q10,3 10,9 Z M5.7,3 L5.7,1.4 L6.3,1.4 L6.3,3" fill="none" stroke="currentColor" stroke-width="1.1"/>' },
    'arch':            { label: 'Arch',                  category: 'architectural', markup: '<path d="M2,10 L2,5 Q2,1.6 6,1.6 Q10,1.6 10,5 L10,10" fill="none" stroke="currentColor" stroke-width="1.2"/>' },

    // ── ABSTRACT ────────────────────────────────────────
    'spiral':          { label: 'Spiral',                category: 'abstract',  markup: '<path d="M6,6 Q6,4.5 7.5,4.5 Q9,4.5 9,7 Q9,9.5 5,9.5 Q1.5,9.5 1.5,5 Q1.5,1.6 6,1.6" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>' },
    'wave':            { label: 'Wave',                  category: 'abstract',  markup: '<path d="M1,5 Q3,2 5,5 T9,5 T11,5 M1,8 Q3,5 5,8 T9,8 T11,8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>' },
    'plus':            { label: 'Plus',                  category: 'abstract',  markup: '<path d="M6,1.4 L6,10.6 M1.4,6 L10.6,6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' },
    'circle-cross':    { label: 'Circle with cross',     category: 'abstract',  markup: '<circle cx="6" cy="6" r="3.6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6,2.4 L6,9.6 M2.4,6 L9.6,6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>' },
    'infinity':        { label: 'Infinity',              category: 'abstract',  markup: '<path d="M3.4,6 Q3.4,4 5,4 Q6.5,4 6,6 Q5.5,8 7,8 Q8.6,8 8.6,6 Q8.6,4 7,4 Q5.5,4 6,6 Q6.5,8 5,8 Q3.4,8 3.4,6 Z" fill="none" stroke="currentColor" stroke-width="1.1"/>' },
    'dot':             { label: 'Dot',                   category: 'abstract',  markup: '<circle cx="6" cy="6" r="1.6" fill="currentColor"/>' },
  });

  // Category ordering for the picker UI.
  const CATEGORY_ORDER = Object.freeze([
    'geometric', 'stars', 'sacred', 'nature', 'object', 'architectural', 'abstract',
  ]);
  const CATEGORY_LABEL = Object.freeze({
    geometric:     'Geometric',
    stars:         'Stars',
    sacred:        'Sacred',
    nature:        'Nature',
    object:        'Object',
    architectural: 'Architectural',
    abstract:      'Abstract',
  });

  // Helpers
  function fullSvg(iconId, sizePx) {
    const entry = ICONS[iconId];
    if (!entry) return '';
    return '<svg width="' + sizePx + '" height="' + sizePx + '" viewBox="0 0 12 12" aria-hidden="true" overflow="visible">' + entry.markup + '</svg>';
  }
  function iconsByCategory() {
    const out = {};
    for (const cat of CATEGORY_ORDER) out[cat] = [];
    for (const id of Object.keys(ICONS)) {
      const entry = ICONS[id];
      const cat = entry.category || 'abstract';
      if (!out[cat]) out[cat] = [];
      out[cat].push({ id, ...entry });
    }
    return out;
  }

  window.AtlasEngineIconLibrary = Object.freeze({
    ICONS,
    CATEGORY_ORDER,
    CATEGORY_LABEL,
    fullSvg,
    iconsByCategory,
  });
})();
