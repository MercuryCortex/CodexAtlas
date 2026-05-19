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
    // Original 16-lens modes (pre-2026-05-18).
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
    // 9 lenses added 2026-05-18 (ontology lock pass 2). `places`
    // was already in the dropdown above (it had been added pre-lock
    // because slot 08 was reserved early). Glyphs chosen distinct
    // from existing ones + evocative of the lens.
    { value: 'languages',           label: 'Languages',           glyph: 'A', nodeType: 'language' },
    { value: 'astronomy',           label: 'Astronomy',           glyph: '✷', nodeType: 'astronomy' },
    { value: 'sacred-architecture', label: 'Sacred architecture', glyph: '▲', nodeType: 'sacred-site' },
    { value: 'theology',            label: 'Theology',            glyph: '✠', nodeType: 'doctrine' },
    { value: 'practices',           label: 'Practices',           glyph: '☸', nodeType: 'practice' },
    { value: 'material-culture',    label: 'Material culture',    glyph: '⌬', nodeType: 'relic' },
    { value: 'pharmacology',        label: 'Pharmacology',        glyph: '⚱', nodeType: 'substance' },
    { value: 'divination',          label: 'Divination',          glyph: '☯', nodeType: 'divination-system' },
    { value: 'calendars',           label: 'Calendars',           glyph: '☉', nodeType: 'calendar-system' },
    // 3 lenses added 2026-05-19 (ontology lock pass 3).
    { value: 'attire',              label: 'Attire',              glyph: '⌘', nodeType: 'attire' },
    { value: 'exchange-networks',   label: 'Exchange networks',   glyph: '⇄', nodeType: 'exchange-network' },
    { value: 'technology',          label: 'Technology',          glyph: '⚙', nodeType: 'technology' },
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
