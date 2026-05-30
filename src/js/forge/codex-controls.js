// ============================================================
// CODEX ATLAS — ATLAS CODEX CONTROLS (Family + Lens dropdowns)
// ============================================================
//
// Filed: 2026-05-28 per AUDIT/2026-05-28-scripture-mode-spec.md
//
// Step 4 — contextual top-bar filters that ONLY appear when the
// class pill is set to ✶ Codex (modeId === 'scriptures').
//
// AST-VALIDATED DEPS: { local, rebuildForMode }
// BOUNDARY CONTRACT:
//   window._forgeCodexControls.attach({ local, rebuildForMode })
//
// CANONICAL PRIMITIVES (SEVERITY DOGMA #2 — re-fix 2026-05-28):
// This module uses the existing `.app-pill` / `.app-pill-side` /
// `.app-pill-divider` / `.app-pill-menu` / `.app-pill-menu-item`
// classes from app.css. It mounts a SECOND `.app-pill` group
// inside `#app-pill-wrap` so it inherits the correct z-index
// (245) + stacking context + pointer-events behavior + visual
// chrome the master/class pill already establishes. Two rules
// added to app.css (`.app-pill--codex` margin + body-class
// hide) — no inline styles, no parallel primitives.
//
// Visibility: toggled by `body.app-pill-codex-visible` class
// (added when class === scriptures, removed otherwise). Sibling
// pattern to `body.app-pill-no-class` already in app.css.
// ============================================================
(function () {
  'use strict';

  // 2026-05-27 — workflow restructure (per John): the Codex pill is now
  // a 5-step cascade  Religion → Codex → Books → Lens → ✠ Read  (was
  // 4-step Family → Books → Lens → Read where "Family" actually meant
  // "Codex/corpus"). LS bumped to v2; v1 keys are auto-migrated below.
  const LS_KEY    = 'atlas.codex.v2';
  const LS_KEY_V1 = 'atlas.codex.v1';

  // RELIGION → CORPORA grouping. Each religion bundles the canonical
  // scripture-collections the tradition recognises (or that scholarship
  // groups under it). Some assignments are deliberate scholarly calls
  // — e.g. nag-hammadi placed under Christianity (Christian-Gnostic),
  // mandaean-manichaean under Gnostic/Dualist (distinct family-tree),
  // samaritan-corpus under Judaism (Samaritan-Pentateuch is a Hebrew
  // Bible variant), bon-corpus under Buddhism (Tibetan religious
  // landscape). Single-canon religions still get a row each.
  const SCRIPTURE_RELIGIONS = {
    'christianity':       { label: 'Christianity',          corpora: ['bible', 'ethiopic-tewahedo-canon', 'kebra-nagast', 'reformation', 'spanish-mystical', 'cathar-bogomil', 'nag-hammadi', 'patristic-corpus', 'byzantine-orthodox', 'latin-catholic-medieval', 'apostolic-fathers', 'syriac-christianity', 'hesychast-philokalia-corpus', 'christian-theosophy', 'christian-apocrypha', 'swedenborgian-new-church', 'new-thought-corpus'] },
    'judaism':            { label: 'Judaism',               corpora: ['tanakh', 'rabbinic-corpus', 'kabbalistic-corpus', 'samaritan-corpus', 'polish-frankism-sabbatean-corpus'] },
    'islam':              { label: 'Islam',                 corpora: ['quran', 'quran-manzil', 'hadith-corpus', 'islamic-theological', 'sufi-persian', 'shia-corpus', 'alevi-corpus', 'ismaili-corpus', 'ishraqi-corpus', 'school-of-isfahan', 'tafsir-corpus', 'arabic-neoplatonism', 'south-asian-sufi-reform', 'islamism-corpus', 'twelver-shia-hadith-corpus'] },
    'hinduism':           { label: 'Hinduism',              corpora: ['vedas', 'vaishnava-canon', 'shaiva-tantric-canon', 'advaita-vedanta-corpus', 'shakta-canon', 'sant-nirguna-corpus', 'hindu-modernism-corpus'] },
    'buddhism':           { label: 'Buddhism',              corpora: ['tipitaka', 'bon-corpus', 'tibetan-vajrayana-corpus', 'pure-land-buddhist-corpus', 'madhyamaka-prajnaparamita-corpus', 'yogacara-corpus', 'chinese-mahayana-chan-huayan-tiantai', 'zen-japanese-canon', 'theravada-jataka-corpus'] },
    'zoroastrianism':     { label: 'Zoroastrianism',        corpora: ['avesta'] },
    'jainism':            { label: 'Jainism',               corpora: ['jain-agamas'] },
    'sikhism':            { label: 'Sikhism',               corpora: ['guru-granth'] },
    'bahai':              { label: 'Bahá\'í',               corpora: ['bahai-corpus'] },
    'mormon':             { label: 'Mormon (LDS)',          corpora: ['mormon'] },
    // ancient near east — NEW: israelite, canaanite, hurro-hittite distinct from mesopotamian
    'israelite-religion': { label: 'Israelite (pre-exilic)', corpora: ['israelite-religion'] },
    'canaanite':          { label: 'Canaanite / Ugaritic',  corpora: ['canaanite-ugaritic'] },
    'hurro-hittite':      { label: 'Hurro-Hittite',         corpora: ['hurro-hittite'] },
    'egyptian':           { label: 'Egyptian (ancient)',    corpora: ['egyptian-scripture'] },
    'greek':              { label: 'Greek (ancient)',       corpora: ['greek-scripture'] },
    'mesopotamian':       { label: 'Mesopotamian (ancient)',corpora: ['mesopotamian'] },
    'mystery-cults':      { label: 'Mystery Cults',         corpora: ['mystery-cults-corpus'] },
    'neoplatonism':       { label: 'Neoplatonism',          corpora: ['neoplatonist-corpus'] },
    'norse':              { label: 'Norse / Finno-Ugric',   corpora: ['norse-eddic', 'finno-karelian-corpus'] },
    'mesoamerican':       { label: 'Mesoamerican',          corpora: ['mesoamerican-sacred', 'maya-corpus', 'aztec-mexica-corpus'] },
    'shinto':             { label: 'Shintō',                corpora: ['kojiki-nihongi', 'shinto-engishiki'] },
    'chinese':            { label: 'Chinese',               corpora: ['confucian-classics', 'tao-corpus'] },
    'gnostic-dualist':    { label: 'Gnostic / Dualist',     corpora: ['mandaean-manichaean'] },
    'hermetic':           { label: 'Hermetic',              corpora: ['hermetica'] },
    'druze':              { label: 'Druze',                 corpora: ['druze-corpus'] },
    'yazidi':             { label: 'Yazidi',                corpora: ['yazidi-corpus'] },
    'modern-syncretic':   { label: 'Modern syncretic',      corpora: ['cheondogyo-corpus', 'tenrikyo-corpus', 'cao-dai-corpus', 'south-asian-modernism'] },
    // Indigenous / oral textual canons — NEW
    'yoruba':             { label: 'Yoruba (Ifá)',          corpora: ['yoruba-ifa-corpus'] },
    'afro-diasporic':     { label: 'Afro-Diasporic',        corpora: ['afro-diasporic-liturgical'] },
    'andean':             { label: 'Andean (Quechua)',      corpora: ['andean-quechua-corpus'] },
    'polynesian':         { label: 'Polynesian',            corpora: ['polynesian-corpus'] },
    'indigenous-na':      { label: 'Indigenous N. American',corpora: ['indigenous-north-american-corpus'] },
    'aboriginal':         { label: 'Aboriginal Australian', corpora: ['aboriginal-dreaming-corpus'] },
    'rastafari':          { label: 'Rastafari',             corpora: ['rastafari-corpus'] },
    // Esoteric / occult orders with text canons — NEW (bundled as one religion-wedge)
    'esoteric-occult':    { label: 'Esoteric / Occult',     corpora: ['theosophy-corpus', 'thelema-corpus', 'wicca-corpus', 'rosicrucian-corpus', 'freemasonry-corpus', 'anthroposophy-corpus', 'renaissance-magic-corpus', 'western-alchemy-corpus'] },
    'modern-religions':   { label: 'Modern religions',      corpora: ['scientology-corpus', 'laveyan-satanism-corpus'] },
  };

  // Reverse lookup: corpus-id → religion-id. Computed once on first call.
  let _corpusToReligion = null;
  function corpusToReligion(corpusId) {
    if (!_corpusToReligion) {
      _corpusToReligion = Object.create(null);
      Object.keys(SCRIPTURE_RELIGIONS).forEach(rId => {
        SCRIPTURE_RELIGIONS[rId].corpora.forEach(cId => {
          if (!_corpusToReligion[cId]) _corpusToReligion[cId] = rId;
        });
      });
    }
    return _corpusToReligion[corpusId] || null;
  }

  // Expose the religion map to window so the forge.js engine-side
  // filter (rebuildForMode) can resolve a religion → its corpora →
  // their docNodes when filtering the wheel.
  window.SCRIPTURE_RELIGIONS = SCRIPTURE_RELIGIONS;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Lens definitions. Books is the V1-enabled lens. Personae /
  // Authors / Deities ship as visible-but-disabled rows so the
  // user sees the roadmap; activation comes in a later batch
  // (needs Lane A edge backfill from each scripture → its
  // personae/authors/deities).
  // The 3 wheel-filter lenses available AFTER a book is picked.
  // (Books itself isn't a lens any more — picking a book IS the
  // input, the Lens dropdown filters the wheel to entities of
  // that book.) 2026-05-28 restructured per John's workflow brief.
  const LENSES = [
    { id: 'personae', label: 'Personae', defaultHint: 'Named figures in this book' },
    { id: 'authors',  label: 'Authors',  defaultHint: 'Source / scribes of this book' },
    { id: 'deities',  label: 'Deities',  defaultHint: 'Divine figures invoked' },
  ];

  // Compute lens-entity counts for ONE picked book (not whole
  // family). Used to enable/disable Lens rows + show live counts.
  function computeLensCountsForBook(bookTextKey) {
    const empty = { personae: 0, authors: 0, deities: 0 };
    const T = window.SCRIPTURE_TEXTS || {};
    const vault = window.VAULT_DATA;
    if (!bookTextKey || !vault) return empty;
    const t = T[bookTextKey];
    if (!t) return empty;

    const personae = new Set();
    const deities  = new Set();
    for (const sec of (t.sections || [])) {
      for (const v of (sec.verses || [])) {
        for (const e of (v.entities || [])) {
          if (!e || !e.node || !e.type) continue;
          if (e.type === 'person' || e.type === 'character' || e.type === 'figure') personae.add(e.node);
          else if (e.type === 'deity') deities.add(e.node);
        }
      }
    }
    empty.personae = personae.size;
    empty.deities  = deities.size;

    // Authors: vault edges → this book's docNode
    if (t.docNode) {
      for (const e of (vault.edges || [])) {
        if (!e) continue;
        if (e.type !== 'authored' && e.type !== 'attributed-author') continue;
        if (e.target === t.docNode) empty.authors++;
      }
    }
    return empty;
  }

  // Short-label map for the Family dropdown. Replaces the broken
  // `label.split('·')[0]` truncation which mid-cut multi-text
  // corpora ("Persian Sufi corpus (Rumi" instead of "Persian Sufi")
  // and collapsed the two Qurʾān corpora to identical labels
  // (now differentiated as Nöldeke vs Manzil). Mirrors the legacy
  // SCRIPTURE_CORPUS_SHORT object that lived inside VIEWS.scripture.
  const SHORT_LABELS = {
    'bible':                   'Bible',
    'egyptian-scripture':      'Egyptian',
    'greek-scripture':         'Greek',
    'tanakh':                  'Tanakh',
    'quran':                   'Qurʾān (Nöldeke)',
    'quran-manzil':            'Qurʾān (Manzil)',
    'vedas':                   'Vedas',
    'tipitaka':                'Buddhist',
    'avesta':                  'Avesta',
    'kojiki-nihongi':          'Kojiki / Nihon Shoki',
    'guru-granth':             'Gurū Granth',
    'mormon':                  'Mormon',
    'kebra-nagast':            'Kebra Nagast',
    'ethiopic-tewahedo-canon': 'Tewahedo',
    'tao-corpus':              'Dao',
    'confucian-classics':      'Confucian',
    'nag-hammadi':             'Nag Hammadi',
    'hermetica':               'Hermetica',
    'mesopotamian':            'Mesopotamian',
    'rabbinic-corpus':         'Rabbinic',
    'jain-agamas':             'Jain',
    'norse-eddic':             'Norse Edda',
    'cathar-bogomil':          'Cathar / Bogomil',
    'bahai-corpus':            'Baháʼí',
    'spanish-mystical':        'Spanish Mystics',
    'shia-corpus':             'Shīʿa',
    'druze-corpus':            'Druze',
    'bon-corpus':              'Bön',
    'yazidi-corpus':           'Yazidi',
    'reformation':             'Reformation',
    'samaritan-corpus':        'Samaritan',
    'alevi-corpus':            'Alevi',
    'cheondogyo-corpus':       'Cheondogyo',
    'tenrikyo-corpus':         'Tenrikyo',
    'cao-dai-corpus':          'Cao Dai',
    'south-asian-modernism':   'S. Asia Modern',
    'hadith-corpus':           'Hadith',
    'mandaean-manichaean':     'Mandaean / Manichaean',
    'islamic-theological':     'Islamic Mystic',
    'sufi-persian':            'Persian Sufi',
    'mesoamerican-sacred':     'Mesoamerican',
  };
  function shortLabelFor(key, corpus) {
    if (SHORT_LABELS[key]) return SHORT_LABELS[key];
    // Fallback for any future corpus key without a hand-curated short
    // label: take the first segment before either '·' or '(' so we
    // never cut mid-list like the old logic did.
    const full = (corpus && corpus.label) || key;
    return full.split(/[·(]/)[0].trim();
  }

  function attach(deps) {
    const local           = deps.local;
    const rebuildForMode  = deps.rebuildForMode;

    if (!local) return;
    if (local.codexControls && local.codexControls._installed) return;

    const wrap = document.getElementById('app-pill-wrap');
    if (!wrap) {
      if (console && console.warn) console.warn('[codex-controls] #app-pill-wrap not found; codex inert');
      return;
    }

    // DOM-side idempotency: if the view-mount cycle re-ran attach()
    // (local resets between mounts), make sure we don't leave a
    // stale codex pill in the DOM. Remove any existing instance
    // before building a fresh one.
    const stalePill = document.getElementById('app-pill-codex');
    if (stalePill && stalePill.parentNode) stalePill.parentNode.removeChild(stalePill);
    // 2026-05-27 — the religion menu is the NEW outer step; family-
    // menu remains (now semantically the "Codex" picker — the corpus
    // canon within the picked religion).
    ['app-pill-codex-religion-menu', 'app-pill-codex-family-menu', 'app-pill-codex-books-menu', 'app-pill-codex-lens-menu'].forEach(id => {
      const stale = document.getElementById(id);
      if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
    });

    // ── Hydrate state from LS (v2 with v1 migration) ─────────
    // v2 state shape: { religionId, corpusId, bookTextKey, lensId }
    // v1 was         : { familyId,  bookTextKey, lensId }       — familyId == corpusId.
    let state = { religionId: null, corpusId: null, bookTextKey: null, lensId: null };
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.religionId === null || typeof parsed.religionId === 'string') state.religionId = parsed.religionId;
          if (parsed.corpusId   === null || typeof parsed.corpusId   === 'string') state.corpusId   = parsed.corpusId;
          if (typeof parsed.bookTextKey === 'string') state.bookTextKey = parsed.bookTextKey;
          if (typeof parsed.lensId === 'string' && ['personae','authors','deities'].indexOf(parsed.lensId) !== -1) state.lensId = parsed.lensId;
        }
      } else {
        // Try v1 migration
        const v1raw = localStorage.getItem(LS_KEY_V1);
        if (v1raw) {
          const v1 = JSON.parse(v1raw);
          if (v1 && typeof v1 === 'object') {
            if (typeof v1.familyId === 'string') {
              state.corpusId = v1.familyId;
              state.religionId = corpusToReligion(v1.familyId);
            }
            if (typeof v1.bookTextKey === 'string') state.bookTextKey = v1.bookTextKey;
            if (typeof v1.lensId === 'string' && ['personae','authors','deities'].indexOf(v1.lensId) !== -1) state.lensId = v1.lensId;
          }
        }
      }
    } catch (_) { /* fall back to defaults */ }
    function saveState() {
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (_) {}
    }

    // Mirror onto local so the engine-side filter (in forge.js
    // rebuildForMode) reads it without going through the module.
    // codexFamily is kept as an alias for codexCorpus so existing
    // rebuildForMode logic (which reads local.codexFamily) keeps
    // working without any forge.js-side change.
    local.codexReligion = state.religionId;
    local.codexCorpus   = state.corpusId;
    local.codexFamily   = state.corpusId;   // legacy alias
    local.codexBookKey  = state.bookTextKey;
    local.codexLens     = state.lensId;
    // 2026-05-30 — belt-and-braces: invalidate the wheel layout cache
    // whenever local.codex* state changes. The forge.js layout cache
    // key now includes codex segments (workflow audit wf_93b13f27-020),
    // but clearing here also covers any future filter that mutates
    // modeNodes without touching the cache-key inputs.
    if (local._layoutCache && typeof local._layoutCache.clear === 'function') {
      local._layoutCache.clear();
    }

    // ── Build DOM (canonical .app-pill primitives) ───────────
    // Second .app-pill group inside the existing .app-pill-wrap.
    // The wrap is position:fixed z-index:245 pointer-events:none
    // — the inner .app-pill is pointer-events:auto. Two .app-pill
    // groups side-by-side inside the wrap = no new stacking ctx
    // needed, no z-index tricks needed.
    const pill = document.createElement('div');
    pill.className = 'app-pill app-pill--codex';
    pill.setAttribute('role', 'group');
    pill.id = 'app-pill-codex';
    // Progressive disclosure workflow (2026-05-27 restructure to 5 steps
    // per John: "FAMILIES (RELIGIONS NOT BOOKS DROP DOWN), then CODEX,
    // then BOOKS, then PERSONAE etc..., then ✠ READ"):
    //   1. Family ▾  — RELIGION picker (Christianity / Islam / Judaism /
    //                  Hinduism / Buddhism / Egyptian / etc.). Always
    //                  enabled. "All families" = no religion filter.
    //   2. Codex ▾   — the specific canon WITHIN that religion (Bible /
    //                  Tewahedo / Reformation / etc. when religion is
    //                  Christianity). Always enabled — when religion is
    //                  "All families" shows the full codex list grouped
    //                  by religion.
    //   3. Books ▾   — locked until a codex is picked. Lists the codex's
    //                  books grouped by canonical section.
    //   4. Lens ▾    — locked until a book is picked. Filters the wheel
    //                  to entities NAMED IN that one book (Personae /
    //                  Authors / Deities).
    //   5. ✠ Read    — locked until a book is picked. Opens the reader.
    pill.innerHTML = [
      '<button class="app-pill-side app-pill-codex-religion" id="app-pill-codex-religion"',
      '        type="button" aria-haspopup="menu" aria-expanded="false"',
      '        aria-controls="app-pill-codex-religion-menu"',
      '        title="Religion / family — Christianity / Islam / Hinduism / etc.">',
      '  <span class="app-pill-label" id="app-pill-codex-religion-label">All families</span>',
      '  <span class="app-pill-caret" aria-hidden="true">▾</span>',
      '</button>',
      '<span class="app-pill-divider" aria-hidden="true"></span>',
      '<button class="app-pill-side app-pill-codex-family" id="app-pill-codex-family"',
      '        type="button" aria-haspopup="menu" aria-expanded="false"',
      '        aria-controls="app-pill-codex-family-menu"',
      '        title="Codex — Bible / Tewahedo / Qurʾān / Vedas / etc.">',
      '  <span class="app-pill-label" id="app-pill-codex-family-label">Codex</span>',
      '  <span class="app-pill-caret" aria-hidden="true">▾</span>',
      '</button>',
      '<span class="app-pill-divider" aria-hidden="true"></span>',
      '<button class="app-pill-side app-pill-codex-books" id="app-pill-codex-books"',
      '        type="button" aria-haspopup="menu" aria-expanded="false"',
      '        aria-controls="app-pill-codex-books-menu"',
      '        title="Pick a book to read or analyse">',
      '  <span class="app-pill-label" id="app-pill-codex-books-label">Books</span>',
      '  <span class="app-pill-caret" aria-hidden="true">▾</span>',
      '</button>',
      '<span class="app-pill-divider" aria-hidden="true"></span>',
      '<button class="app-pill-side app-pill-codex-lens" id="app-pill-codex-lens"',
      '        type="button" aria-haspopup="menu" aria-expanded="false"',
      '        aria-controls="app-pill-codex-lens-menu"',
      '        title="Filter the wheel to entities of the picked book">',
      '  <span class="app-pill-label" id="app-pill-codex-lens-label">Lens</span>',
      '  <span class="app-pill-caret" aria-hidden="true">▾</span>',
      '</button>',
      '<span class="app-pill-divider" aria-hidden="true"></span>',
      '<button class="app-pill-side app-pill-codex-read" id="app-pill-codex-read"',
      '        type="button"',
      '        title="Open the picked book in the reader">',
      '  <span class="app-pill-label" id="app-pill-codex-read-label">✠ Read</span>',
      '</button>',
    ].join('\n');
    // Insert right after the existing .app-pill group (the
    // master/class pill) but BEFORE the menu divs. The existing
    // menus already live at the end of .app-pill-wrap; new pill
    // sits as a sibling to the first .app-pill group.
    const firstPill = wrap.querySelector('.app-pill');
    if (firstPill && firstPill.nextSibling) {
      wrap.insertBefore(pill, firstPill.nextSibling);
    } else {
      wrap.appendChild(pill);
    }

    // Menus — canonical .app-pill-menu primitive (z-index:246,
    // position:fixed, JS-positioned on open). Live as siblings
    // alongside the existing master + class menus.
    // 2026-05-27 — religionMenu is the new outer menu added for the
    // 5-step workflow. familyMenu is the Codex (corpus) picker.
    const religionMenu = document.createElement('div');
    religionMenu.className = 'app-pill-menu app-pill-menu--codex-religion';
    religionMenu.id        = 'app-pill-codex-religion-menu';
    religionMenu.setAttribute('role', 'menu');
    religionMenu.setAttribute('aria-hidden', 'true');
    wrap.appendChild(religionMenu);

    const familyMenu = document.createElement('div');
    familyMenu.className = 'app-pill-menu app-pill-menu--codex-family';
    familyMenu.id        = 'app-pill-codex-family-menu';
    familyMenu.setAttribute('role', 'menu');
    familyMenu.setAttribute('aria-hidden', 'true');
    wrap.appendChild(familyMenu);

    // Books menu (was "Read" picker): canonical-section-grouped
    // list of every book in the picked family. Clicking a row
    // sets state.bookTextKey + unlocks Lens + Read.
    const booksMenu = document.createElement('div');
    booksMenu.className = 'app-pill-menu app-pill-menu--codex-books';
    booksMenu.id        = 'app-pill-codex-books-menu';
    booksMenu.setAttribute('role', 'menu');
    booksMenu.setAttribute('aria-hidden', 'true');
    wrap.appendChild(booksMenu);

    // Lens menu: Personae / Authors / Deities — scoped to the
    // currently-picked book (state.bookTextKey).
    const lensMenu = document.createElement('div');
    lensMenu.className = 'app-pill-menu app-pill-menu--codex-lens';
    lensMenu.id        = 'app-pill-codex-lens-menu';
    lensMenu.setAttribute('role', 'menu');
    lensMenu.setAttribute('aria-hidden', 'true');
    wrap.appendChild(lensMenu);

    // ── Build menu contents ──────────────────────────────────

    // Religion menu — the new outer step. Lists each religion in the
    // SCRIPTURE_RELIGIONS map plus an "All families" sentinel meaning
    // "no religion filter — show all codices in the next step."
    function buildReligionMenu() {
      const rows = [];
      rows.push(
        '<button class="app-pill-menu-item' + (state.religionId === null ? ' is-active' : '') + '"' +
        ' role="menuitem" data-religion="" type="button">' +
        '<span class="app-pill-menu-label">All families</span>' +
        '<span class="app-pill-menu-hint">no religion filter</span>' +
        (state.religionId === null ? '<span class="app-pill-menu-check">●</span>' : '') +
        '</button>'
      );
      Object.keys(SCRIPTURE_RELIGIONS).forEach(rId => {
        const R = SCRIPTURE_RELIGIONS[rId];
        const nCorpora = (R.corpora || []).length;
        rows.push(
          '<button class="app-pill-menu-item' + (state.religionId === rId ? ' is-active' : '') + '"' +
          ' role="menuitem" data-religion="' + esc(rId) + '" type="button">' +
          '<span class="app-pill-menu-label">' + esc(R.label) + '</span>' +
          '<span class="app-pill-menu-hint">' + nCorpora + ' code' + (nCorpora === 1 ? 'x' : 'xes') + '</span>' +
          (state.religionId === rId ? '<span class="app-pill-menu-check">●</span>' : '') +
          '</button>'
        );
      });
      religionMenu.innerHTML = rows.join('');
    }

    // Codex menu (internal id #app-pill-codex-family preserved from
    // the 4-step era). Lists the corpora available — filtered to the
    // picked religion, or grouped-by-religion if "All families".
    //
    // 2026-05-27 — added "All corpora" sentinel at the top of both
    // paths (symmetric with "All families" in the Religion menu).
    // Picking it clears state.corpusId + downstream book + lens.
    function buildFamilyMenu() {
      const corpora = window.SCRIPTURE_CORPORA || {};
      const rows = [];

      // "All corpora" sentinel — always present at the top of the
      // codex menu (whether religion is picked or not).
      const allScripturesHint = state.religionId
        ? ('all ' + (SCRIPTURE_RELIGIONS[state.religionId]?.label || '') + ' scriptures').toLowerCase()
        : 'no codex filter';
      rows.push(
        '<button class="app-pill-menu-item' + (state.corpusId === null ? ' is-active' : '') + '"' +
        ' role="menuitem" data-family="" type="button">' +
        '<span class="app-pill-menu-label">All corpora</span>' +
        '<span class="app-pill-menu-hint">' + esc(allScripturesHint) + '</span>' +
        (state.corpusId === null ? '<span class="app-pill-menu-check">●</span>' : '') +
        '</button>'
      );

      if (!state.religionId) {
        // "All families" mode: show all corpora, grouped by religion.
        // Each religion is a section header; its corpora listed under.
        Object.keys(SCRIPTURE_RELIGIONS).forEach(rId => {
          const R = SCRIPTURE_RELIGIONS[rId];
          const items = (R.corpora || [])
            .filter(cId => corpora[cId] && corpora[cId].available !== false);
          if (!items.length) return;
          rows.push('<div class="app-pill-menu-section-label">' + esc(R.label) + '</div>');
          items.forEach(k => {
            const c = corpora[k];
            const nBooks = (c.sections || []).reduce((sum, sec) => sum + ((sec.books || []).length), 0);
            const shortLabel = shortLabelFor(k, c);
            rows.push(
              '<button class="app-pill-menu-item' + (state.corpusId === k ? ' is-active' : '') + '"' +
              ' role="menuitem" data-family="' + esc(k) + '" type="button">' +
              '<span class="app-pill-menu-label">' + esc(shortLabel) + '</span>' +
              '<span class="app-pill-menu-hint">' + nBooks + ' book' + (nBooks === 1 ? '' : 's') + '</span>' +
              (state.corpusId === k ? '<span class="app-pill-menu-check">●</span>' : '') +
              '</button>'
            );
          });
        });
        familyMenu.innerHTML = rows.join('') || '<div class="app-pill-menu-section-label">No codices available</div>';
        return;
      }

      // Religion picked: show only that religion's corpora (flat — no
      // section header needed since there's only one religion shown).
      const R = SCRIPTURE_RELIGIONS[state.religionId];
      if (!R) {
        familyMenu.innerHTML = '<div class="app-pill-menu-section-label">Religion not recognised</div>';
        return;
      }
      const items = (R.corpora || []).filter(cId => corpora[cId] && corpora[cId].available !== false);
      if (!items.length) {
        familyMenu.innerHTML = '<div class="app-pill-menu-section-label">No codices yet for ' + esc(R.label) + '</div>';
        return;
      }
      items.forEach(k => {
        const c = corpora[k];
        const nBooks = (c.sections || []).reduce((sum, sec) => sum + ((sec.books || []).length), 0);
        const shortLabel = shortLabelFor(k, c);
        rows.push(
          '<button class="app-pill-menu-item' + (state.corpusId === k ? ' is-active' : '') + '"' +
          ' role="menuitem" data-family="' + esc(k) + '" type="button">' +
          '<span class="app-pill-menu-label">' + esc(shortLabel) + '</span>' +
          '<span class="app-pill-menu-hint">' + nBooks + ' book' + (nBooks === 1 ? '' : 's') + '</span>' +
          (state.corpusId === k ? '<span class="app-pill-menu-check">●</span>' : '') +
          '</button>'
        );
      });
      familyMenu.innerHTML = rows.join('');
    }

    function buildLensMenu() {
      const counts = computeLensCountsForBook(state.bookTextKey);
      const T = window.SCRIPTURE_TEXTS || {};
      const bookTitle = (state.bookTextKey && T[state.bookTextKey])
        ? (T[state.bookTextKey].shortTitle || T[state.bookTextKey].title || state.bookTextKey)
        : null;
      const rows = [];
      if (bookTitle) {
        rows.push('<div class="app-pill-menu-section-label">filtering ' + esc(bookTitle) + '</div>');
      }
      LENSES.forEach(L => {
        const isActive = state.lensId === L.id;
        const n = counts[L.id] || 0;
        const enabled = n > 0;
        const hint = enabled ? (n + ' ' + L.id) : 'no entries in this book';
        rows.push(
          '<button class="app-pill-menu-item' + (isActive && enabled ? ' is-active' : '') + (enabled ? '' : ' is-stub') + '"' +
          ' role="menuitem" data-lens="' + esc(L.id) + '"' +
          (enabled ? '' : ' disabled') +
          ' type="button">' +
          '<span class="app-pill-menu-label">' + esc(L.label) + '</span>' +
          '<span class="app-pill-menu-hint">' + esc(hint) + '</span>' +
          (isActive && enabled ? '<span class="app-pill-menu-check">●</span>' : '') +
          '</button>'
        );
      });
      lensMenu.innerHTML = rows.join('');
    }

    // Build the docNode → textKey reverse index from SCRIPTURE_TEXTS
    // (cached on local; same primitive the side-panel uses).
    function getDocnodeToTextKey() {
      if (local._docnodeToTextKey) return local._docnodeToTextKey;
      const map = Object.create(null);
      const T = window.SCRIPTURE_TEXTS || {};
      for (const k in T) {
        const t = T[k];
        if (t && t.docNode && typeof t.docNode === 'string') {
          if (!map[t.docNode]) map[t.docNode] = k;
        }
      }
      local._docnodeToTextKey = map;
      return map;
    }

    function buildBooksMenu() {
      const corpora = window.SCRIPTURE_CORPORA || {};
      const dn2tk = getDocnodeToTextKey();
      const rows = [];

      // 2026-05-27 — Books pill is now locked until a codex (corpus) is
      // picked (per the 5-step workflow). If somehow opened without a
      // corpus pick, show a prompt to pick a codex first. The flat-
      // grouped fallback that used to appear when "no family picked"
      // is no longer reachable since the lock cascade blocks it.
      if (!state.corpusId) {
        booksMenu.innerHTML = '<div class="app-pill-menu-section-label">Pick a codex first</div>';
        return;
      }

      // Codex-focused path: walk corpus.sections, group books by
      // canonical section, show only the codex's books. Books with
      // a SCRIPTURE_TEXTS entry are clickable; books without are
      // shown disabled with a "no reader text yet" hint.
      const corpus = corpora[state.corpusId];
      if (!corpus) {
        booksMenu.innerHTML = '<div class="app-pill-menu-section-label">Codex not found</div>';
        return;
      }
      const sections = corpus.sections || [];
      if (!sections.length) {
        booksMenu.innerHTML = '<div class="app-pill-menu-section-label">No sections defined for this canon</div>';
        return;
      }
      sections.forEach(sec => {
        const books = sec.books || [];
        if (!books.length) return;
        rows.push('<div class="app-pill-menu-section-label">' + esc(sec.label || '') + '</div>');
        books.forEach(book => {
          const tk = dn2tk[book.id];
          const ready = !!tk;
          const isActive = ready && state.bookTextKey === tk;
          rows.push(
            '<button class="app-pill-menu-item' + (ready ? '' : ' is-stub') + (isActive ? ' is-active' : '') + '"' +
            ' role="menuitem"' +
            (ready ? ' data-textkey="' + esc(tk) + '"' : ' disabled') +
            ' type="button">' +
            '<span class="app-pill-menu-label">' + esc(book.label || book.id) + '</span>' +
            '<span class="app-pill-menu-hint">' + (ready ? 'pick' : 'reader text not yet written') + '</span>' +
            (isActive ? '<span class="app-pill-menu-check">●</span>' : '') +
            '</button>'
          );
        });
      });
      booksMenu.innerHTML = rows.join('');
    }

    // ── Sync trigger labels + lock states ────────────────────
    function syncLabels() {
      const religionLabel = document.getElementById('app-pill-codex-religion-label');
      const familyLabel   = document.getElementById('app-pill-codex-family-label');
      const booksLabel    = document.getElementById('app-pill-codex-books-label');
      const lensLabel     = document.getElementById('app-pill-codex-lens-label');
      if (religionLabel) {
        if (state.religionId && SCRIPTURE_RELIGIONS[state.religionId]) {
          religionLabel.textContent = SCRIPTURE_RELIGIONS[state.religionId].label;
        } else {
          religionLabel.textContent = 'All families';
        }
      }
      if (familyLabel) {
        if (state.corpusId && window.SCRIPTURE_CORPORA && window.SCRIPTURE_CORPORA[state.corpusId]) {
          familyLabel.textContent = shortLabelFor(state.corpusId, window.SCRIPTURE_CORPORA[state.corpusId]);
        } else {
          // 2026-05-27 — was "Codex"; now "All corpora" so the
          // sentinel state is symmetric with the Religion pill's
          // "All families" default.
          familyLabel.textContent = 'All corpora';
        }
      }
      if (booksLabel) {
        if (state.bookTextKey && window.SCRIPTURE_TEXTS && window.SCRIPTURE_TEXTS[state.bookTextKey]) {
          const t = window.SCRIPTURE_TEXTS[state.bookTextKey];
          booksLabel.textContent = t.shortTitle || t.title || state.bookTextKey;
        } else {
          booksLabel.textContent = 'Books';
        }
      }
      if (lensLabel) {
        const L = LENSES.find(x => x.id === state.lensId);
        lensLabel.textContent = L ? L.label : 'Lens';
      }
    }

    // Progressive-disclosure lock cascade (2026-05-27, 5-step):
    //   Religion → always enabled (it's the outer step)
    //   Codex   → always enabled (with religion=null it shows all)
    //   Books   → locked until a codex (corpus) is picked
    //   Lens    → locked until a book is picked
    //   Read    → locked until a book is picked
    function syncLocks() {
      const familyBtn2 = document.getElementById('app-pill-codex-family');
      const booksBtn   = document.getElementById('app-pill-codex-books');
      const lensBtn2   = document.getElementById('app-pill-codex-lens');
      const readBtn2   = document.getElementById('app-pill-codex-read');
      // Codex (family) pill: always enabled. The picker shows either
      // the full grouped list (religion=null) or the picked religion's
      // corpora.
      if (familyBtn2) { familyBtn2.classList.remove('is-locked'); familyBtn2.disabled = false; }
      // Books pill: locked until a codex is picked.
      const corpusPicked = !!state.corpusId;
      if (booksBtn) { booksBtn.classList.toggle('is-locked', !corpusPicked); booksBtn.disabled = !corpusPicked; }
      // Lens + Read unlock together based on bookTextKey.
      const bookPicked = !!state.bookTextKey;
      if (lensBtn2) { lensBtn2.classList.toggle('is-locked', !bookPicked); lensBtn2.disabled = !bookPicked; }
      if (readBtn2) { readBtn2.classList.toggle('is-locked', !bookPicked); readBtn2.disabled = !bookPicked; }
    }

    // ── Menu positioning (same pattern as app-pill.js) ───────
    function positionMenu(menu, anchorBtn) {
      const rect = anchorBtn.getBoundingClientRect();
      menu.style.left = rect.left + 'px';
      menu.style.top  = (rect.bottom + 6) + 'px';
    }

    const religionBtn = document.getElementById('app-pill-codex-religion');
    const familyBtn   = document.getElementById('app-pill-codex-family');
    const booksBtn    = document.getElementById('app-pill-codex-books');
    const lensBtn     = document.getElementById('app-pill-codex-lens');
    const readBtn     = document.getElementById('app-pill-codex-read');

    function closeAllMenus() {
      religionMenu.classList.remove('is-open');
      familyMenu.classList.remove('is-open');
      booksMenu.classList.remove('is-open');
      lensMenu.classList.remove('is-open');
      religionMenu.setAttribute('aria-hidden', 'true');
      familyMenu.setAttribute('aria-hidden', 'true');
      booksMenu.setAttribute('aria-hidden', 'true');
      lensMenu.setAttribute('aria-hidden', 'true');
      religionBtn.setAttribute('aria-expanded', 'false');
      familyBtn.setAttribute('aria-expanded', 'false');
      booksBtn.setAttribute('aria-expanded', 'false');
      lensBtn.setAttribute('aria-expanded', 'false');
    }

    function openMenu(menu, btn, build) {
      build();
      positionMenu(menu, btn);
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
    }

    religionBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      const isOpen = religionMenu.classList.contains('is-open');
      closeAllMenus();
      if (!isOpen) openMenu(religionMenu, religionBtn, buildReligionMenu);
    });
    familyBtn.addEventListener('click', function (ev) {
      if (familyBtn.disabled) return;
      ev.stopPropagation();
      const isOpen = familyMenu.classList.contains('is-open');
      closeAllMenus();
      if (!isOpen) openMenu(familyMenu, familyBtn, buildFamilyMenu);
    });
    booksBtn.addEventListener('click', function (ev) {
      if (booksBtn.disabled) return;
      ev.stopPropagation();
      const isOpen = booksMenu.classList.contains('is-open');
      closeAllMenus();
      if (!isOpen) openMenu(booksMenu, booksBtn, buildBooksMenu);
    });
    lensBtn.addEventListener('click', function (ev) {
      if (lensBtn.disabled) return;
      ev.stopPropagation();
      const isOpen = lensMenu.classList.contains('is-open');
      closeAllMenus();
      if (!isOpen) openMenu(lensMenu, lensBtn, buildLensMenu);
    });
    // Read button is now a SINGLE-ACTION click (no dropdown) —
    // opens the reader for the currently-picked book.
    readBtn.addEventListener('click', function (ev) {
      if (readBtn.disabled) return;
      ev.stopPropagation();
      closeAllMenus();
      if (state.bookTextKey && window._forge && typeof window._forge.openReader === 'function') {
        window._forge.openReader(state.bookTextKey);
      }
    });

    // ── Menu pick handlers (event delegation) ────────────────

    // RELIGION menu — outer step. Any pick (including "All families")
    // cascade-resets the downstream corpus + book + lens. 2026-05-27
    // John feedback: "when we click all families needs to rest to All
    // scriptures on the next box by default ... now is just left
    // hanging." Previous behaviour preserved corpus on "All families"
    // pick — now we always reset the downstream cascade so the user
    // gets a clean starting point after every religion change.
    religionMenu.addEventListener('click', function (ev) {
      const btn = ev.target.closest('.app-pill-menu-item');
      if (!btn) return;
      ev.stopPropagation();
      const newReligion = btn.dataset.religion || null;
      closeAllMenus();
      if (newReligion === state.religionId) return;
      state.religionId = newReligion;
      // Always clear the downstream cascade. The Codex pill resets to
      // its "All corpora" sentinel state; Books/Lens/Read re-lock.
      if (newReligion) {
        // For a specific religion pick: preserve the corpus only if
        // it actually belongs to the new religion.
        const R = SCRIPTURE_RELIGIONS[newReligion];
        const corpusInReligion = R && state.corpusId && R.corpora.indexOf(state.corpusId) !== -1;
        if (!corpusInReligion) {
          state.corpusId    = null;
          state.bookTextKey = null;
          state.lensId      = null;
        }
      } else {
        // "All families" picked → cascade-reset everything downstream.
        state.corpusId    = null;
        state.bookTextKey = null;
        state.lensId      = null;
      }
      local.codexReligion = state.religionId;
      local.codexCorpus   = state.corpusId;
      local.codexFamily   = state.corpusId;   // legacy alias
      local.codexBookKey  = state.bookTextKey;
      local.codexLens     = state.lensId;
      local._codexFilterAppliedFor = null;
      // 2026-05-30 — invalidate stale layout cache on codex state change.
      if (local._layoutCache && typeof local._layoutCache.clear === 'function') local._layoutCache.clear();
      saveState();
      syncLabels();
      syncLocks();
      if (typeof rebuildForMode === 'function' && local.mode && local.mode.id) {
        try { rebuildForMode(local.mode.id, { preserveLocks: true, preserveZoom: false }); }
        catch (e) { console.warn('[codex-controls] religion rebuild failed', e); }
      }
    });

    // CODEX (family) menu — picks a specific corpus, or the
    // "All corpora" sentinel (empty data-family) to clear corpus.
    // Resets the picked book + lens (downstream workflow reset).
    familyMenu.addEventListener('click', function (ev) {
      const btn = ev.target.closest('.app-pill-menu-item');
      if (!btn) return;
      ev.stopPropagation();
      const newCorpus = btn.dataset.family || null;
      closeAllMenus();
      if (newCorpus === state.corpusId) return;
      state.corpusId = newCorpus;
      // Corpus change clears the picked book + lens (workflow reset)
      state.bookTextKey = null;
      state.lensId = null;
      // If religionId is null but the picked corpus belongs to one
      // specific religion, auto-set religionId to match (so the
      // Religion pill label reflects the implied context). User can
      // explicitly re-pick "All families" if they want to clear it.
      // Skip inference for the "All corpora" pick (newCorpus null).
      if (newCorpus && !state.religionId) {
        const implied = corpusToReligion(newCorpus);
        if (implied) {
          state.religionId = implied;
          local.codexReligion = implied;
        }
      }
      local.codexCorpus  = newCorpus;
      local.codexFamily  = newCorpus;   // legacy alias
      local.codexBookKey = null;
      local.codexLens    = null;
      local._codexFilterAppliedFor = null;
      // 2026-05-30 — invalidate stale layout cache on codex state change.
      if (local._layoutCache && typeof local._layoutCache.clear === 'function') local._layoutCache.clear();
      saveState();
      syncLabels();
      syncLocks();
      // 2026-05-29 — When user picks a specific corpus (Bible, Vedas,
      // etc.) and there's no specific book yet, route to the scripture-
      // radial sunburst view instead of the Forge wheel. The wheel
      // under-populates with ~5 dots because its layout was built for
      // 700 deities; the radial paints all books always. Mirrors the
      // routing already in setCorpus() (the inline pill-click handler
      // here bypasses setCorpus, so it needs its own copy).
      if (newCorpus && typeof window.setView === 'function') {
        try {
          if (typeof window.STATE === 'object') window.STATE.scriptureCorpus = newCorpus;
          window.setView('scripture');
          return;   // skip the wheel rebuild below — the radial owns this state now
        } catch (_) { /* fall through to wheel rebuild on error */ }
      }
      if (typeof rebuildForMode === 'function' && local.mode && local.mode.id) {
        try { rebuildForMode(local.mode.id, { preserveLocks: true, preserveZoom: false }); }
        catch (e) { console.warn('[codex-controls] codex rebuild failed', e); }
      }
    });

    // BOOKS menu picks a specific book — sets state.bookTextKey,
    // unlocks Lens + Read. Picking a book does NOT auto-open the
    // reader (that's what the Read button is for); it just selects
    // the book as the active INPUT for downstream filters.
    booksMenu.addEventListener('click', function (ev) {
      const btn = ev.target.closest('.app-pill-menu-item');
      if (!btn || btn.disabled) return;
      ev.stopPropagation();
      const tk = btn.dataset.textkey;
      closeAllMenus();
      if (!tk) return;
      if (tk === state.bookTextKey) return;
      state.bookTextKey = tk;
      // Picking a new book resets the previously-active Lens since
      // the entity counts will be different per-book.
      state.lensId = null;
      local.codexBookKey = tk;
      local.codexLens    = null;
      local._codexFilterAppliedFor = null;
      // 2026-05-30 — invalidate stale layout cache on codex state change.
      if (local._layoutCache && typeof local._layoutCache.clear === 'function') local._layoutCache.clear();
      saveState();
      syncLabels();
      syncLocks();
      if (typeof rebuildForMode === 'function' && local.mode && local.mode.id) {
        try { rebuildForMode(local.mode.id, { preserveLocks: true, preserveZoom: false }); }
        catch (e) { console.warn('[codex-controls] book rebuild failed', e); }
      }
    });
    lensMenu.addEventListener('click', function (ev) {
      const btn = ev.target.closest('.app-pill-menu-item');
      if (!btn || btn.disabled) return;
      ev.stopPropagation();
      const newLens = btn.dataset.lens;
      closeAllMenus();
      if (!newLens) return;
      // Toggle off if same lens re-picked
      const finalLens = (newLens === state.lensId) ? null : newLens;
      state.lensId = finalLens;
      local.codexLens = finalLens;
      local._codexFilterAppliedFor = null;
      // 2026-05-30 — invalidate stale layout cache on codex state change.
      if (local._layoutCache && typeof local._layoutCache.clear === 'function') local._layoutCache.clear();
      saveState();
      syncLabels();
      syncLocks();
      if (typeof rebuildForMode === 'function' && local.mode && local.mode.id) {
        try { rebuildForMode(local.mode.id, { preserveLocks: true, preserveZoom: false }); }
        catch (e) { console.warn('[codex-controls] lens rebuild failed', e); }
      }
    });

    // Outside-click + ESC close
    document.addEventListener('click', function (ev) {
      if (ev.target.closest('.app-pill-menu')) return;
      if (ev.target.closest('#app-pill-codex')) return;
      closeAllMenus();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeAllMenus();
    });

    // ── Visibility — body class flip, sibling to app-pill-no-class
    function syncVisibility() {
      const isCodex = local.mode && local.mode.id === 'scriptures';
      document.body.classList.toggle('app-pill-codex-visible', !!isCodex);
      if (!isCodex) closeAllMenus();
    }

    syncVisibility();
    syncLabels();
    syncLocks();

    // REMOUNT FILTER FIX (2026-05-28 v2) — fires the family filter
    // exactly once after the engine settles into scriptures mode.
    // Why this is needed: on view-swap (Map → Forge), the initial
    // rebuildForMode fires BEFORE codex-controls.attach() runs, so
    // local.codexFamily is undefined at filter time → all 109
    // scriptures render unfiltered, even though the LS-hydrated
    // family-pill label shows the persisted family.
    //
    // Hook strategy: combine syncVisibility with a one-shot rebuild
    // gate. Every time the class-label mutates, syncVisibility re-
    // runs; if we now see (mode === scriptures) AND (state.familyId
    // is set) AND (we haven't already applied this combination),
    // fire a rebuild. The latched _codexFilterAppliedFor key
    // prevents repeat-firing on every observer tick.
    local._codexFilterAppliedFor = local._codexFilterAppliedFor || null;
    function tryApplyFilter() {
      // 2026-05-27 — fire on either religion-only OR corpus-picked
      // state. Previously this latch only ran when corpusId was set,
      // which left a page-reload-with-religion-only state showing
      // the unfiltered SCRIPTURE_IDS view (e.g. Heart Sutra still
      // visible when religion=Christianity post-reload).
      if (!state.religionId && !state.corpusId) return;
      if (!local.mode || local.mode.id !== 'scriptures') return;
      const key = (state.corpusId || ('religion:' + state.religionId)) + '|' + (local.mode.id || '');
      if (local._codexFilterAppliedFor === key) return;
      local._codexFilterAppliedFor = key;
      if (typeof rebuildForMode === 'function') {
        try {
          rebuildForMode('scriptures', { preserveLocks: true, preserveZoom: true });
        } catch (_) { /* best-effort */ }
      }
    }
    // Run NOW (in case mode is already scriptures at attach time),
    // and on every classLabel mutation (when user picks Codex).
    tryApplyFilter();
    // Also retry after a short delay — the initial rebuild may set
    // local.mode.id asynchronously.
    setTimeout(tryApplyFilter, 100);
    setTimeout(tryApplyFilter, 400);

    function syncAndMaybeFilter() {
      syncVisibility();
      tryApplyFilter();
    }

    // Re-check on class-pill label change (proxy for class swap).
    const classLabel = document.getElementById('app-pill-class-label');
    if (classLabel) {
      const mo = new MutationObserver(syncAndMaybeFilter);
      mo.observe(classLabel, { childList: true, characterData: true, subtree: true });
    }
    // Also on layout swaps (FORGE wheel ↔ TIMELINE).
    document.addEventListener('codex:layout-changed', syncAndMaybeFilter);

    // Reset the latch whenever user explicitly changes family — the
    // family-click handler already calls rebuildForMode directly, so
    // this just ensures a subsequent view-swap re-runs the filter.
    // (We hook this by adding a second listener on familyMenu clicks
    // higher up — the existing one already triggers a rebuild.)

    local.codexControls = {
      getState: function () { return { religionId: state.religionId, corpusId: state.corpusId, bookTextKey: state.bookTextKey, lensId: state.lensId, familyId: state.corpusId /* legacy alias */ }; },
      setFamily: function (id) {
        // Legacy alias for setCorpus — older external callers may still
        // use setFamily expecting the 4-step semantics.
        return this.setCorpus(id);
      },
      setCorpus: function (id) {
        if (id !== null && (!window.SCRIPTURE_CORPORA || !window.SCRIPTURE_CORPORA[id])) return false;
        state.corpusId = id;
        if (id) {
          const implied = corpusToReligion(id);
          if (implied && !state.religionId) {
            state.religionId = implied;
            local.codexReligion = implied;
          }
        }
        local.codexCorpus = id;
        local.codexFamily = id;   // legacy alias
        saveState();
        syncLabels();
        if (typeof syncLocks === 'function') syncLocks();
        // 2026-05-29 — When a corpus is picked but no specific book yet
        // (the natural "show me all books in this corpus" state), route
        // to the canonical scripture-radial sunburst view instead of the
        // Forge wheel. The wheel under-populates with only ~33 books
        // because its family-clustering layout was built for 700 deities;
        // the radial sunburst always paints all books and their cross-
        // book trails. Picking a SPECIFIC book later (setBook) re-routes
        // back to the Forge wheel for the entity-grid drill-in.
        if (id && !state.bookTextKey) {
          try {
            if (typeof window.STATE === 'object') window.STATE.scriptureCorpus = id;
            if (typeof window.setView === 'function') {
              window.setView('scripture');
              return true;
            }
          } catch (_) { /* fall through to the wheel rebuild */ }
        }
        if (typeof rebuildForMode === 'function' && local.mode && local.mode.id === 'scriptures') {
          try { rebuildForMode('scriptures', { preserveLocks: true, preserveZoom: false }); } catch (_) {}
        }
        return true;
      },
      setReligion: function (id) {
        if (id !== null && !SCRIPTURE_RELIGIONS[id]) return false;
        state.religionId = id;
        local.codexReligion = id;
        // If the picked religion no longer contains the current corpus,
        // clear the downstream cascade.
        if (id) {
          const R = SCRIPTURE_RELIGIONS[id];
          if (state.corpusId && R.corpora.indexOf(state.corpusId) === -1) {
            state.corpusId = null;
            state.bookTextKey = null;
            state.lensId = null;
            local.codexCorpus  = null;
            local.codexFamily  = null;
            local.codexBookKey = null;
            local.codexLens    = null;
          }
        }
        saveState();
        syncLabels();
        if (typeof syncLocks === 'function') syncLocks();
        return true;
      },
      // 2026-05-27 — programmatic book-pick. Called by forge.js when
      // the user clicks a scripture-book dot on the wheel, so the
      // Codex pill state stays in sync with the reader. Also infers
      // religion + corpus from the picked book when the user clicks
      // directly without using the full pill workflow.
      setBook: function (textKey) {
        if (textKey != null && (!window.SCRIPTURE_TEXTS || !window.SCRIPTURE_TEXTS[textKey])) return false;
        if (state.bookTextKey === textKey) return true;
        state.bookTextKey = textKey;
        state.lensId = null;
        // Infer corpus + religion from the picked book's docNode if not
        // already aligned with the user's current cascade.
        if (textKey) {
          const t = window.SCRIPTURE_TEXTS[textKey];
          const docNode = t && t.docNode;
          if (docNode) {
            // Find any corpus that lists this docNode.
            const corpora = window.SCRIPTURE_CORPORA || {};
            for (const cId in corpora) {
              const c = corpora[cId];
              if (!c || !c.sections) continue;
              const found = c.sections.some(sec => (sec.books || []).some(b => b.id === docNode));
              if (found) {
                if (state.corpusId !== cId) {
                  state.corpusId = cId;
                  local.codexCorpus = cId;
                  local.codexFamily = cId;
                }
                if (!state.religionId) {
                  const r = corpusToReligion(cId);
                  if (r) { state.religionId = r; local.codexReligion = r; }
                }
                break;
              }
            }
          }
        }
        local.codexBookKey = textKey;
        local.codexLens   = null;
        saveState();
        syncLabels();
        if (typeof syncLocks === 'function') syncLocks();
        // 2026-05-29 — paired with the corpus-pick → scripture-radial
        // routing above: when a specific book IS picked, route BACK to
        // the Forge wheel so the entity-grid + drill-in pipeline kicks
        // in. Without this the user would stay on the radial sunburst
        // even after picking a single book.
        if (textKey) {
          try {
            if (typeof window.setView === 'function'
                && typeof window.STATE === 'object'
                && window.STATE.view !== 'forge') {
              window.setView('forge');
            }
            if (typeof rebuildForMode === 'function'
                && local.mode && local.mode.id === 'scriptures') {
              rebuildForMode('scriptures', { preserveLocks: true, preserveZoom: false });
            }
          } catch (_) { /* non-fatal */ }
        }
        return true;
      },
      // 2026-05-27 — docNode → textKey resolver, exposed so forge.js
      // can check whether a clicked wheel-node is a reader-ready book.
      docNodeToTextKey: function (docNodeId) {
        const dn2tk = getDocnodeToTextKey();
        return dn2tk[docNodeId] || null;
      },
      _installed: true,
    };
  }

  window._forgeCodexControls = { attach: attach };
})();
