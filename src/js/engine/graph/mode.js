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
    // Original 16-lens modes (pre-2026-05-18). 2026-05-28: Codex
    // promoted to position 2 (right after Deities) per John —
    // it's the second-most-used class now.
    { value: 'deities',     label: 'Deities',     glyph: '◉',  nodeType: 'deity' },
    { value: 'scriptures',  label: 'Codex',       glyph: '✶',  nodeType: 'document' },
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
    // Scriptures (labeled "Codex") was MOVED to position 2 (right
    // after Deities) on 2026-05-28. See entry above. Its enumeration
    // audit is at AUDIT/2026-05-28-scripture-ids-enumeration.md and
    // its SCRIPTURE_IDS set is defined below.
    // Figures lens added 2026-05-28 — historical religious / political
    // leaders (popes, pharaohs, prophets, founders, caliphs, kings,
    // rabbis, gurus, imams, etc.). Sub-filter of the persons lens:
    // 319 role-curated entries via FIGURES_IDS predicate below.
    // Distinct from Authors (writers of documents) and the broader
    // Persons mode (every person). John's note: 'figures' is
    // intentionally softer than 'rulers' — covers spiritual founders
    // too (Jesus, Buddha, Laozi, Guru Nanak).
    { value: 'figures',             label: 'Figures',             glyph: '⚜', nodeType: 'person' },
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

  // ── Figures sub-filter set ──────────────────────────────────────
  //
  // Curated 2026-05-28 from `data.js` person-type nodes via
  // role-substring match (king, queen, emperor, pharaoh, pope,
  // caliph, sultan, prophet, apostle, founder, rabbi, guru, imam,
  // saint, martyr, etc.). 319 entries. By family distribution:
  //   Christian 75  Israelite 44  Other 38  Islamic 31  Vedic 31
  //   Buddhist 16  Mesopotamian 16  Roman 12  Egyptian 10
  //   Greek 8  Modern-Esoteric 8  Gnostic 5  Chinese 5  ...
  //
  // Heuristic misses nodes whose `role:` is blank (~486 of 1198
  // persons have no role field). Lane A follow-up: backfill role
  // metadata so coverage grows organically — no need to maintain
  // this list by hand once that lands.
  const FIGURES_IDS = new Set([
    'abba-garima', 'abraham-patriarch', 'abu-bakr', 'abya-meqabyan',
    'aeschylus', 'ahmose-i', 'akbar-mughal', 'akhenaten',
    'akiva-ben-yosef', 'al-hakim-bi-amr-allah', 'al-hallaj', 'al-shafii',
    'aleister-crowley', 'ali-al-hadi', 'ali-al-rida', 'ali-ibn-abi-talib',
    'ali-zayn-al-abidin', 'ambedkar', 'amos-prophet', 'ananda-disciple',
    'andal', 'andrew-apostle', 'anselm-of-canterbury', 'antiochus-iv-epiphanes',
    'anton-lavey', 'antony-the-great', 'arganthonius', 'asanga',
    'ashurbanipal', 'asoka-maurya', 'atrahasis-flood-hero', 'aurangzeb-emperor',
    'baal-shem-tov', 'bahaullah', 'barnabas', 'bartholomew-apostle',
    'basava', 'basavanna', 'benedict-of-nursia', 'bernard-raymond-fabre-palaprat',
    'blandina', 'bodhidharma', 'bogomil-priest', 'bonaventure',
    'brigham-young', 'cainan-son-of-arpachshad', 'carl-gustav-jung', 'chaitanya-mahaprabhu',
    'charlemagne', 'charles-taze-russell', 'choe-je-u', 'christian-rosenkreutz',
    'cleopatra-vii', 'constantine-i', 'cyprian-of-carthage', 'cyrus-the-great',
    'daniel-prophet', 'darius-i-the-great', 'david-king', 'dayananda-saraswati',
    'decius-emperor', 'deganawidah-peacemaker', 'dhu-al-qarnayn', 'dinis-i-portugal',
    'diocletian-emperor', 'diodore-of-tarsus', 'dioscorus-of-alexandria', 'dogen',
    'domitian-emperor', 'doreen-valiente', 'edgar-cayce', 'eliezer-ben-hyrcanus',
    'elijah-prophet', 'elisha-prophet', 'enmebaragesi', 'enoch',
    'esau', 'ewostatewos', 'ezana-of-aksum', 'ezekiel',
    'fatima-bint-muhammad', 'fentos-meqabyan', 'flinders-petrie', 'frumentius',
    'g-i-gurdjieff', 'galawdewos-emperor', 'gamaliel-ii', 'gamaliel-the-elder',
    'gerald-gardner', 'gershom-scholem', 'gilgamesh-king', 'goncalo-annes-bandarra',
    'gorakhnath', 'gregory-palamas', 'gregory-the-great', 'gudea-of-lagash',
    'guru-arjan', 'guru-gobind-singh', 'guru-gobind-singh-ji', 'guru-nanak',
    'guru-tegh-bahadur-ji', 'haci-bektas-veli', 'hadrian-emperor', 'hagar-matriarch',
    'hammurabi', 'hamza-ibn-ali', 'hasan-al-askari', 'hasan-ibn-ali',
    'hatshepsut', 'helena-blavatsky', 'hemiunu', 'henry-steel-olcott',
    'henry-the-navigator', 'hermas', 'hermas-of-rome', 'herod-antipas',
    'herod-the-great', 'hiawatha-haudenosaunee', 'hillel-the-elder', 'hippocrates',
    'hippolytus-of-rome', 'hongren', 'hosea-prophet', 'hua-tuo',
    'hud-prophet', 'hugues-de-payens', 'huineng', 'husayn-ibn-ali',
    'ibn-ishaq', 'ibn-tufayl', 'ignatius-of-antioch', 'imhotep',
    'ines-de-castro', 'isaac-patriarch', 'isaiah-first', 'ishmael-ben-elisha',
    'ishmael-son-of-abraham', 'jacob-israel', 'jafar-al-sadiq', 'james-brother-of-jesus',
    'james-hillman', 'james-son-of-alphaeus', 'james-son-of-zebedee', 'jan-hus',
    'jean-francois-champollion', 'jeremiah', 'jesus-of-nazareth', 'john-of-patmos',
    'john-son-of-zebedee', 'john-the-baptist', 'joseph-father-of-jesus', 'joseph-patriarch',
    'joseph-ratzinger-benedict-xvi', 'joseph-smith', 'joshua-ben-hananiah', 'josiah-king',
    'judah-ha-nasi', 'judas-iscariot', 'julian-the-apostate', 'justinian-i',
    'kaleb-of-aksum', 'kanishka', 'karl-gotthelf-von-hund', 'khafre',
    'khufu', 'l-ron-hubbard', 'lal-ded', 'lalibela-king',
    'lanz-von-liebenfels', 'laozi', 'leo-the-great', 'lipit-ishtar',
    'lucian-of-antioch', 'lut', 'madhva', 'mahavira',
    'makeda-queen-of-sheba', 'mani', 'manikkavacakar', 'marcus-aurelius-emperor',
    'marie-laveau', 'marshall-vian-summers', 'mary-baker-eddy', 'mary-mother-of-jesus',
    'matsyendranath', 'matthew-apostle', 'maximus-the-confessor', 'melchizedek',
    'menander-i-soter', 'menelik-i-legendary', 'mes-anepada', 'mirabai',
    'miriam-prophetess', 'montanus', 'moses', 'moses-cordovero',
    'mozi-person', 'muawiya-ibn-abi-sufyan', 'muhammad-al-baqir', 'muhammad-al-jawad',
    'muhammad-al-mahdi-person', 'muhammad-ibn-abdullah', 'musa-al-kazim', 'nagarjuna',
    'nakayama-miki', 'nammalvar', 'naram-sin', 'nathan-of-gaza',
    'nebuchadnezzar-ii', 'nefertiti', 'nero-emperor', 'nestorius',
    'ngo-van-chieu', 'nimbarka', 'noah', 'nund-rishi',
    'onias-iii', 'onias-iv', 'orpheus', 'pachomius',
    'padmasambhava-person', 'paramahansa-yogananda', 'paul-of-tarsus', 'perpetua-and-felicity',
    'peter-apostle', 'peter-j-carroll', 'philip-apostle', 'philip-iv-of-france',
    'pliny-the-younger', 'plotinus', 'polycarp-of-smyrna', 'pope-clement-v',
    'pope-francis', 'pope-innocent-iii', 'pope-urban-ii', 'pothinus-of-lyon',
    'prester-john', 'ptolemy-i-soter', 'ptolemy-ii-philadelphus', 'pyrrho-of-elis',
    'pythagoras', 'quetzalcoatl-historical', 'rabbi-akiva', 'rabbi-judah-loew',
    'rabbi-shimon-bar-yochai', 'ram-mohan-roy', 'ramakrishna', 'rinchen-zangpo',
    'rishabha', 'rowan-williams', 'rudolf-ii-habsburg', 'rudolf-steiner',
    'saladin', 'salih-prophet', 'samuel-prophet', 'sarada-devi',
    'sarah-matriarch', 'sargon-of-akkad', 'sebastian-i-portugal', 'seela-meqabyan',
    'septimius-severus', 'seth', 'severus-of-antioch', 'shammai',
    'shankara', 'shariputra', 'shenxiu', 'shuayb-prophet',
    'shulgi', 'siddhartha-gautama-buddha', 'simeon-the-stylite', 'simon-the-zealot',
    'solomon-king', 'sri-aurobindo', 'sri-yukteswar', 'stephen-mcnallen',
    'stephen-protomartyr', 'sun-myung-moon', 'sun-simiao', 'surdas',
    'swami-vivekananda', 'takla-haymanot', 'thaddaeus-jude-apostle', 'the-bab',
    'thecla', 'theodosius-i', 'thomas-apostle', 'thutmose-iv',
    'tomas-de-torquemada', 'trajan-emperor', 'triptolemus-legendary', 'tsongkhapa',
    'tulsidas', 'tutankhamun', 'umar-ibn-al-khattab', 'unas',
    'ur-bau', 'ur-nammu', 'uthman', 'utnapishtim',
    'utpaladeva', 'valerian-emperor', 'vallabhacharya', 'vasubandhu',
    'vasugupta', 'victor-hugo', 'wang-yangming', 'william-james',
    'william-sinclair-rosslyn', 'wolega-tafari-makonnen-haile-selassie', 'wovoka', 'yared-the-deacon',
    'yohanan-ben-zakkai', 'yu-the-great', 'zadok-priest', 'zara-yaqob-emperor',
    'zarathustra', 'zerubbabel', 'ziusudra',
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

    // Scriptures mode (2026-05-28; extended 2026-05-30):
    //   – Curated SCRIPTURE_IDS set above (the original 108-id whitelist,
    //     hand-picked when SCRIPTURE_CORPORA was thinner), UNION
    //   – Every book.id declared in window.SCRIPTURE_CORPORA[*].sections[*].books[*]
    //     (auto-derived once, cached on first call — kills the
    //     8-of-10-Egyptian-books-hidden bug John screenshot-flagged
    //     2026-05-30: Pyramid Texts / Coffin Texts / Book of the Dead /
    //     Amarna Letters / Manetho / Diodorus / Plutarch / Herodotus
    //     were declared in egyptian-scripture corpus but NOT in the
    //     hand-curated whitelist, so the All-families wheel only
    //     showed Great Hymn to Aten + Memphite Theology).
    //
    //   Lane A follow-up still applies — when each node gets a
    //   `canonical-corpus:` YAML field, both halves dissolve. Until
    //   then this auto-derive keeps the wheel in sync with the
    //   corpus declarations.
    if (mode === 'scriptures') {
      // ── canonical-corpus YAML migration (2026-05-31) ────────────────
      // AUTHORITATIVE source: per-doc YAML `canonical-corpus: [...]`
      // surfaced by build_data.py as `n.canonical_corpus`. Any document
      // with a non-empty array IS in the Codex view. This dissolves the
      // SCRIPTURE_CORPORA-vs-vault drift that was causing endless catch-
      // up passes (audit at AUDIT/2026-05-31-codex-wires-gap.md).
      //
      // DEFENSIVE BACKSTOP (during transition): the legacy SCRIPTURE_
      // CORPORA-derived set still unions in, so a doc that somehow
      // lacks canonical_corpus but IS in SCRIPTURE_CORPORA still
      // surfaces. Once every doc is verified to carry canonical_corpus,
      // the static SCRIPTURE_IDS + SCRIPTURE_CORPORA-union backstop
      // can be deleted.
      if (!filterNodesByMode._scriptureSet) {
        const s = new Set(SCRIPTURE_IDS);
        const C = (typeof window !== 'undefined') ? window.SCRIPTURE_CORPORA : null;
        if (C && typeof C === 'object') {
          for (const corpusKey in C) {
            const corpus = C[corpusKey];
            if (!corpus || !corpus.sections) continue;
            for (const sec of corpus.sections) {
              for (const book of (sec.books || [])) {
                if (book && book.id) s.add(book.id);
              }
            }
          }
        }
        filterNodesByMode._scriptureSet = s;
      }
      const SET = filterNodesByMode._scriptureSet;
      return nodes.filter(n => {
        if (!n || n.type !== 'document') return false;
        // PRIMARY: canonical-corpus YAML field (authoritative).
        const cc = n.canonical_corpus;
        if (Array.isArray(cc) && cc.length > 0) return true;
        // BACKSTOP: legacy SCRIPTURE_CORPORA-derived set.
        return SET.has(n.id);
      });
    }

    // Figures mode (2026-05-28): persons lens, intersected with the
    // curated FIGURES_IDS set above. Historical religious/political
    // leaders — distinct from authors (writers) and the broader
    // persons set.
    if (mode === 'figures') {
      return nodes.filter(n => n && n.type === 'person' && FIGURES_IDS.has(n.id));
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
