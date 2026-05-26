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
    // Scriptures lens added 2026-05-28 (scripture-mode carve, step 1).
    // Sub-filter of the documents lens: 109 hand-curated sacred-text
    // nodes (see AUDIT/2026-05-28-scripture-ids-enumeration.md). Uses
    // its own predicate via SCRIPTURE_IDS below — does NOT match a
    // unique `node.type` (every scripture is `type: "document"`).
    { value: 'scriptures',          label: 'Codex',               glyph: '✶', nodeType: 'document' },
  ]);

  // ── Scripture sub-filter set ──────────────────────────────────────
  //
  // Curated 2026-05-28 from `data.js` document-type nodes.
  // 109 entries. Method + rationale in
  // AUDIT/2026-05-28-scripture-ids-enumeration.md.
  //
  // To add/remove a scripture: edit this set + bump the enumeration
  // audit doc. Lane A follow-up will migrate to a per-node YAML
  // frontmatter field (`canonical-corpus:`) so this list dissolves.
  const SCRIPTURE_IDS = new Set([
    'avatamsaka-sutra',
    'avesta',
    'bhagavata-purana',
    'codex-sinaiticus',
    'codex-vaticanus',
    'corpus-hermeticum',
    'diamond-sutra-868',
    'divyavadana',
    'document-exodus',
    'document-ezekiel',
    'document-leviticus',
    'document-matthew',
    'document-numbers',
    'gandavyuha-sutra',
    'gospel-of-judas-sethian',
    'jataka-tales',
    'kojiki',
    'lotus-sutra',
    'mahabharata',
    'mahaparinibbana-sutta',
    'nihon-shoki',
    'phase-1-004-gilgamesh-old-babylonian',
    'phase-1-006-atrahasis',
    'phase-1-008-enuma-elish',
    'phase-1-011-great-hymn-to-aten',
    'phase-1-016-eridu-genesis-flood',
    'phase-1-017-descent-of-inanna',
    'phase-1-019-enuma-anu-enlil',
    'phase-1-027-memphite-theology-shabaka-stone',
    'phase-1-031-rigveda',
    'phase-2-001-rig-veda-family-books',
    'phase-2-002-gathas-of-zarathustra',
    'phase-2-003-atharva-veda',
    'phase-2-004-yasna-younger-avesta',
    'phase-2-005-davidic-psalms',
    'phase-2-012-brihadaranyaka-upanishad',
    'phase-2-013-chandogya-upanishad',
    'phase-2-015-analects-of-confucius',
    'phase-2-017-mahabharata-ramayana-oral-layers',
    'phase-2-021-shvetashvatara-upanishad',
    'phase-2-022-zhuangzi',
    'phase-2-027-bhagavad-gita',
    'phase-2-029-dhammapada',
    'phase-2-038-acharanga-sutra',
    'phase-2-042-yi-jing-i-ching',
    'phase-2-job',
    'phase-3-001-second-third-isaiah',
    'phase-3-008-book-of-daniel',
    'phase-3-011-dead-sea-scrolls',
    'phase-3-016-gospel-of-mark',
    'phase-3-017-gospel-of-matthew',
    'phase-3-018-luke-acts',
    'phase-3-020-gospel-of-john',
    'phase-3-023-yoga-sutras-of-patanjali',
    'phase-3-033-book-of-giants-qumran-manichaean',
    'phase-3-095-mahabharata',
    'phase-4-001-gospel-of-thomas',
    'phase-4-002-apocryphon-of-john',
    'phase-4-003-gospel-of-truth',
    'phase-4-004-gospel-of-philip',
    'phase-4-005-gospel-of-mary',
    'phase-4-009-pistis-sophia',
    'phase-4-011-corpus-hermeticum-i',
    'phase-4-018-mandaean-book-of-john',
    'phase-4-031-mishnah',
    'phase-4-032-jerusalem-talmud',
    'phase-4-033-babylonian-talmud',
    'phase-4-034-quran',
    'phase-4-035-acts-of-paul-and-thecla',
    'phase-4-058-thunder-perfect-mind',
    'phase-4-064-epistle-of-barnabas',
    'phase-4-075-corpus-hermeticum-xiii-rebirth',
    'phase-4-101-lotus-sutra',
    'phase-4-102-avatamsaka-sutra',
    'phase-4-103-lankavatara-sutra',
    'phase-4-109-vishnu-purana',
    'phase-5-001-devi-mahatmya',
    'phase-5-002-heart-sutra',
    'phase-5-002b-diamond-sutra',
    'phase-5-004-platform-sutra-huineng',
    'phase-5-006-vijnana-bhairava-tantra',
    'phase-5-012-sefer-yetzirah',
    'phase-5-021-ibn-arabi-fusus-al-hikam',
    'phase-5-025-rumi-masnavi',
    'phase-5-026-sefer-ha-bahir',
    'phase-5-027-sefer-ha-zohar',
    'phase-5-029-bardo-thodol',
    'phase-5-033-shiva-sutras',
    'phase-5-050-bhagavata-purana',
    'phase-5-054-rumi-masnavi',
    'phase-5-064-zohar',
    'phase-6-016-guru-granth-sahib',
    'phase-6-030-vinaya-patrika',
    'phase-7-001-book-of-mormon',
    'phase-7-002-kitab-i-iqan',
    'phase-7-003-kitab-i-aqdas',
    'phase-7-030-satanic-bible',
    'phase-8-001-popol-vuh',
    'phase-8-005-chilam-balam',
    'phase-8-008-kebra-nagast',
    'phase-8-014-poetic-edda',
    'phase-8-015-prose-edda-snorri',
    'phase-8-019-kojiki',
    'phase-8-020-nihon-shoki',
    'ramayana',
    'shoku-nihongi',
    'tao-te-ching',
    'tipitaka',
    'vimalakirti-sutra',
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

    // Scriptures mode (2026-05-28): documents lens, intersected with
    // the curated SCRIPTURE_IDS set above. See enumeration audit doc
    // for inclusion rationale.
    if (mode === 'scriptures') {
      return nodes.filter(n => n && n.type === 'document' && SCRIPTURE_IDS.has(n.id));
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
