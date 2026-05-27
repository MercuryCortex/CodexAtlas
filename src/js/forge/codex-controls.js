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

  const LS_KEY = 'atlas.codex.v1';

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
    const staleFamilyMenu = document.getElementById('app-pill-codex-family-menu');
    if (staleFamilyMenu && staleFamilyMenu.parentNode) staleFamilyMenu.parentNode.removeChild(staleFamilyMenu);
    const staleLensMenu = document.getElementById('app-pill-codex-lens-menu');
    if (staleLensMenu && staleLensMenu.parentNode) staleLensMenu.parentNode.removeChild(staleLensMenu);

    // ── Hydrate state from LS ────────────────────────────────
    let state = { familyId: null, bookTextKey: null, lensId: null };
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.familyId === null || typeof parsed.familyId === 'string') state.familyId = parsed.familyId;
          if (typeof parsed.bookTextKey === 'string') state.bookTextKey = parsed.bookTextKey;
          if (typeof parsed.lensId === 'string' && ['personae','authors','deities'].indexOf(parsed.lensId) !== -1) state.lensId = parsed.lensId;
        }
      }
    } catch (_) { /* fall back to defaults */ }
    function saveState() {
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (_) {}
    }

    // Mirror onto local so the engine-side filter (in forge.js
    // rebuildForMode) reads it without going through the module.
    local.codexFamily   = state.familyId;
    local.codexBookKey  = state.bookTextKey;
    local.codexLens     = state.lensId;

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
    // Progressive disclosure workflow (2026-05-28 restructure):
    //   1. Family ▾  — always enabled when codex is the active class
    //   2. Books ▾   — locked until a family is picked. Lists the
    //                  canon's books grouped by canonical section.
    //                  Picking a book = the INPUT for steps 3 + 4.
    //   3. Lens ▾    — locked until a book is picked. Filters the
    //                  wheel to entities NAMED IN that one book
    //                  (Personae / Authors / Deities).
    //   4. ✠ Read    — locked until a book is picked. Single button
    //                  (no dropdown) — click opens the reader for
    //                  the currently-picked book.
    pill.innerHTML = [
      '<button class="app-pill-side app-pill-codex-family" id="app-pill-codex-family"',
      '        type="button" aria-haspopup="menu" aria-expanded="false"',
      '        aria-controls="app-pill-codex-family-menu"',
      '        title="Codex family — Bible / Egyptian / Vedas / etc.">',
      '  <span class="app-pill-label" id="app-pill-codex-family-label">All families</span>',
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
    function buildFamilyMenu() {
      const corpora = window.SCRIPTURE_CORPORA || {};
      const rows = [];
      // "All families" sentinel — clears the family filter and
      // returns to the default 109-node SCRIPTURE_IDS view.
      rows.push(
        '<button class="app-pill-menu-item' + (state.familyId === null ? ' is-active' : '') + '"' +
        ' role="menuitem" data-family="" type="button">' +
        '<span class="app-pill-menu-label">All families</span>' +
        '<span class="app-pill-menu-hint">109 sacred texts</span>' +
        (state.familyId === null ? '<span class="app-pill-menu-check">●</span>' : '') +
        '</button>'
      );
      const keys = Object.keys(corpora);
      keys.forEach(k => {
        const c = corpora[k];
        if (!c || c.available === false) return;
        const nBooks = (c.sections || []).reduce((sum, sec) => sum + ((sec.books || []).length), 0);
        const shortLabel = shortLabelFor(k, c);
        rows.push(
          '<button class="app-pill-menu-item' + (state.familyId === k ? ' is-active' : '') + '"' +
          ' role="menuitem" data-family="' + esc(k) + '" type="button">' +
          '<span class="app-pill-menu-label">' + esc(shortLabel) + '</span>' +
          '<span class="app-pill-menu-hint">' + nBooks + ' book' + (nBooks === 1 ? '' : 's') + '</span>' +
          (state.familyId === k ? '<span class="app-pill-menu-check">●</span>' : '') +
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

      // "All families" path: list every reader-ready scripture
      // (every SCRIPTURE_TEXTS entry whose docNode points at a real
      // vault node), grouped by tradition. ~130 entries total.
      if (!state.familyId) {
        rows.push(
          '<div class="app-pill-menu-section-label">Pick a family first for the focused list — or pick any reader-ready book below</div>'
        );
        // Flat alphabetical of every text entry that has a docNode.
        const items = [];
        for (const k in (window.SCRIPTURE_TEXTS || {})) {
          const t = window.SCRIPTURE_TEXTS[k];
          if (!t) continue;
          items.push({
            textKey: k,
            label: t.shortTitle || t.title || k,
            corpus: t.corpus || '',
          });
        }
        items.sort((a, b) => a.label.localeCompare(b.label));
        items.forEach(it => {
          const isActive = state.bookTextKey === it.textKey;
          rows.push(
            '<button class="app-pill-menu-item' + (isActive ? ' is-active' : '') + '" role="menuitem" data-textkey="' + esc(it.textKey) + '" type="button">' +
            '<span class="app-pill-menu-label">' + esc(it.label) + '</span>' +
            (it.corpus ? '<span class="app-pill-menu-hint">' + esc(it.corpus.split('·')[0].trim()) + '</span>' : '') +
            (isActive ? '<span class="app-pill-menu-check">●</span>' : '') +
            '</button>'
          );
        });
        booksMenu.innerHTML = rows.join('') || '<div class="app-pill-menu-section-label">No reader-ready texts yet</div>';
        return;
      }

      // Family-focused path: walk corpus.sections, group books by
      // canonical section, show only the family's books. Books with
      // a SCRIPTURE_TEXTS entry are clickable; books without are
      // shown disabled with a "no reader text yet" hint.
      const corpus = corpora[state.familyId];
      if (!corpus) {
        booksMenu.innerHTML = '<div class="app-pill-menu-section-label">Pick a family first</div>';
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
      const familyLabel = document.getElementById('app-pill-codex-family-label');
      const booksLabel  = document.getElementById('app-pill-codex-books-label');
      const lensLabel   = document.getElementById('app-pill-codex-lens-label');
      if (familyLabel) {
        if (state.familyId && window.SCRIPTURE_CORPORA && window.SCRIPTURE_CORPORA[state.familyId]) {
          familyLabel.textContent = shortLabelFor(state.familyId, window.SCRIPTURE_CORPORA[state.familyId]);
        } else {
          familyLabel.textContent = 'All families';
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

    // Progressive-disclosure lock states (2026-05-28).
    // - Books pill: locked until family picked (unless "All families")
    // - Lens pill: locked until book picked
    // - Read button: locked until book picked
    function syncLocks() {
      const booksBtn = document.getElementById('app-pill-codex-books');
      const lensBtn2 = document.getElementById('app-pill-codex-lens');
      const readBtn2 = document.getElementById('app-pill-codex-read');
      // Books is enabled when family is picked OR when "all families"
      // (state.familyId === null) — user can always pick a book from
      // the global list. So Books is essentially always enabled.
      if (booksBtn) booksBtn.classList.remove('is-locked');
      // Lens + Read unlock together based on bookTextKey.
      const bookPicked = !!state.bookTextKey;
      if (lensBtn2) lensBtn2.classList.toggle('is-locked', !bookPicked);
      if (readBtn2) readBtn2.classList.toggle('is-locked', !bookPicked);
      if (lensBtn2) lensBtn2.disabled = !bookPicked;
      if (readBtn2) readBtn2.disabled = !bookPicked;
    }

    // ── Menu positioning (same pattern as app-pill.js) ───────
    function positionMenu(menu, anchorBtn) {
      const rect = anchorBtn.getBoundingClientRect();
      menu.style.left = rect.left + 'px';
      menu.style.top  = (rect.bottom + 6) + 'px';
    }

    const familyBtn = document.getElementById('app-pill-codex-family');
    const booksBtn  = document.getElementById('app-pill-codex-books');
    const lensBtn   = document.getElementById('app-pill-codex-lens');
    const readBtn   = document.getElementById('app-pill-codex-read');

    function closeAllMenus() {
      familyMenu.classList.remove('is-open');
      booksMenu.classList.remove('is-open');
      lensMenu.classList.remove('is-open');
      familyMenu.setAttribute('aria-hidden', 'true');
      booksMenu.setAttribute('aria-hidden', 'true');
      lensMenu.setAttribute('aria-hidden', 'true');
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

    familyBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      const isOpen = familyMenu.classList.contains('is-open');
      closeAllMenus();
      if (!isOpen) openMenu(familyMenu, familyBtn, buildFamilyMenu);
    });
    booksBtn.addEventListener('click', function (ev) {
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
    familyMenu.addEventListener('click', function (ev) {
      const btn = ev.target.closest('.app-pill-menu-item');
      if (!btn) return;
      ev.stopPropagation();
      const newFamily = btn.dataset.family || null;
      closeAllMenus();
      if (newFamily === state.familyId) return;
      state.familyId = newFamily;
      // Family change clears the picked book + lens (workflow reset)
      state.bookTextKey = null;
      state.lensId = null;
      local.codexFamily  = newFamily;
      local.codexBookKey = null;
      local.codexLens    = null;
      local._codexFilterAppliedFor = null;
      saveState();
      syncLabels();
      syncLocks();
      if (typeof rebuildForMode === 'function' && local.mode && local.mode.id) {
        try { rebuildForMode(local.mode.id, { preserveLocks: true, preserveZoom: false }); }
        catch (e) { console.warn('[codex-controls] rebuildForMode failed', e); }
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
      if (!state.familyId) return;
      if (!local.mode || local.mode.id !== 'scriptures') return;
      const key = state.familyId + '|' + (local.mode.id || '');
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
      getState: function () { return { familyId: state.familyId, lensId: state.lensId }; },
      setFamily: function (id) {
        if (id !== null && (!window.SCRIPTURE_CORPORA || !window.SCRIPTURE_CORPORA[id])) return false;
        state.familyId = id;
        local.codexFamily = id;
        saveState();
        syncLabels();
        if (typeof rebuildForMode === 'function' && local.mode && local.mode.id === 'scriptures') {
          try { rebuildForMode('scriptures', { preserveLocks: true, preserveZoom: false }); } catch (_) {}
        }
        return true;
      },
      _installed: true,
    };
  }

  window._forgeCodexControls = { attach: attach };
})();
