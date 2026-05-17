// ============================================================
// CODEX ATLAS — MODE FILTER
// ============================================================
// Resolves "which nodes belong to a mode" — the wheel becomes
// 17 different wheels, one per category lens. Single source of
// truth for the filter so the Forge view stays mode-agnostic.
//
// Pure function. No DOM, no global state.
// ============================================================

(function () {
  'use strict';

  // Master list of modes the Forge view exposes. Order = the
  // display order in the mode dropdown.  The first mode is the
  // default-on-mount.
  //
  // Each entry:
  //   value    — programmatic ID (matches a node type when 1:1)
  //   label    — human-readable label for the dropdown
  //   glyph    — Unicode glyph for the dropdown row (UI only)
  //   nodeType — `n.type` value(s) this mode renders; null for
  //              non-type predicates (handled in filterNodesByMode)
  const MODES = Object.freeze([
    { value: 'deities',     label: 'Deities',     glyph: '◉',  nodeType: 'deity' },
    { value: 'authors',     label: 'Authors',     glyph: '✎',  nodeType: 'person' },
    { value: 'documents',   label: 'Documents',   glyph: '❡',  nodeType: 'document' },
    { value: 'symbols',     label: 'Symbols',     glyph: '✦',  nodeType: 'symbol' },
    { value: 'events',      label: 'Events',      glyph: '◆',  nodeType: 'event' },
    { value: 'rituals',     label: 'Rituals',     glyph: '✚',  nodeType: 'ritual' },
    { value: 'music',       label: 'Music',       glyph: '♩',  nodeType: 'music' },
    { value: 'alphabet',    label: 'Alphabets',   glyph: 'ℵ',  nodeType: 'alphabet' },
    { value: 'alchemy',     label: 'Alchemy',     glyph: '△',  nodeType: 'alchemy' },
    { value: 'philosophy',  label: 'Philosophy',  glyph: '○',  nodeType: 'philosophy' },
    { value: 'morals',      label: 'Morals',      glyph: '⚖',  nodeType: 'moral' },
    { value: 'medicine',    label: 'Medicine',    glyph: '⚕',  nodeType: 'medicine' },
    { value: 'mathematics', label: 'Mathematics', glyph: '∑',  nodeType: 'mathematics' },
    { value: 'monuments',   label: 'Monuments',   glyph: '▮',  nodeType: 'monument' },
    { value: 'themes',      label: 'Themes',      glyph: '◇',  nodeType: 'theme' },
    { value: 'traditions',  label: 'Traditions',  glyph: '⊙',  nodeType: 'tradition' },
    { value: 'places',      label: 'Places',      glyph: '◐',  nodeType: 'place' },
  ]);

  const MODE_INDEX = Object.create(null);
  for (const m of MODES) MODE_INDEX[m.value] = m;

  // Filter the full node list to the active mode.
  //
  // @param mode    Mode value (e.g., 'deities'); falls back to 'deities'.
  // @param nodes   Full array of VAULT_DATA nodes.
  // @param edges   Full array of VAULT_DATA edges (only used for the
  //                'authors' resolver — see below).
  // @returns       Filtered node array.
  //
  // The `authors` mode is special: it returns persons who actually
  // AUTHORED at least one document (edge type 'authored'). Without
  // this gate, every historical figure ends up in the wheel,
  // including monarchs and prophets who weren't text-authors.
  function filterNodesByMode(mode, nodes, edges) {
    const entry = MODE_INDEX[mode];
    if (!entry || !Array.isArray(nodes)) return [];

    if (mode === 'authors') {
      const authorSet = new Set();
      for (const e of (edges || [])) {
        if (!e) continue;
        if (e.type === 'authored' || e.type === 'attributed-author') {
          // The edge source is the author, target is the document.
          authorSet.add(e.source);
        }
      }
      return nodes.filter(n => n && n.type === 'person' && authorSet.has(n.id));
    }

    // Default: simple type match.
    const t = entry.nodeType;
    return nodes.filter(n => n && n.type === t);
  }

  // Default mode = first entry in MODES.
  function defaultMode() { return MODES[0].value; }

  // Validate a mode id (used by URL-router code that reads `?mode=...`).
  function isValidMode(mode) { return !!MODE_INDEX[mode]; }

  // ── Export ────────────────────────────────────────────
  window.AtlasEngineMode = Object.freeze({
    MODES,
    filterNodesByMode,
    defaultMode,
    isValidMode,
  });
})();
