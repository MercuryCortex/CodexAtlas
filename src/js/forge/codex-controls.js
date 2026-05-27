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
  const LENSES = [
    { id: 'books',    label: 'Books',    enabled: true,  hint: 'Sacred texts of this canon' },
    { id: 'personae', label: 'Personae', enabled: false, hint: 'Named figures in this canon — historical, allegorical, angelic — coming soon' },
    { id: 'authors',  label: 'Authors',  enabled: false, hint: 'Sources / scribes — coming soon' },
    { id: 'deities',  label: 'Deities',  enabled: false, hint: 'Divine figures invoked — coming soon' },
  ];

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
    let state = { familyId: null, lensId: 'books' };
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.familyId === null || typeof parsed.familyId === 'string') state.familyId = parsed.familyId;
          if (typeof parsed.lensId === 'string') state.lensId = parsed.lensId;
        }
      }
    } catch (_) { /* fall back to defaults */ }
    function saveState() {
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (_) {}
    }

    // Mirror onto local so the engine-side filter (in forge.js
    // rebuildForMode) reads it without going through the module.
    local.codexFamily = state.familyId;
    local.codexLens   = state.lensId;

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
    pill.innerHTML = [
      '<button class="app-pill-side app-pill-codex-family" id="app-pill-codex-family"',
      '        type="button" aria-haspopup="menu" aria-expanded="false"',
      '        aria-controls="app-pill-codex-family-menu"',
      '        title="Codex family — Bible / Egyptian / Vedas / etc.">',
      '  <span class="app-pill-label" id="app-pill-codex-family-label">All families</span>',
      '  <span class="app-pill-caret" aria-hidden="true">▾</span>',
      '</button>',
      '<span class="app-pill-divider" aria-hidden="true"></span>',
      '<button class="app-pill-side app-pill-codex-lens" id="app-pill-codex-lens"',
      '        type="button" aria-haspopup="menu" aria-expanded="false"',
      '        aria-controls="app-pill-codex-lens-menu"',
      '        title="Codex lens — Books / Personae / Authors / Deities">',
      '  <span class="app-pill-label" id="app-pill-codex-lens-label">Books</span>',
      '  <span class="app-pill-caret" aria-hidden="true">▾</span>',
      '</button>',
      '<span class="app-pill-divider" aria-hidden="true"></span>',
      '<button class="app-pill-side app-pill-codex-read" id="app-pill-codex-read"',
      '        type="button" aria-haspopup="menu" aria-expanded="false"',
      '        aria-controls="app-pill-codex-read-menu"',
      '        title="Open a book in the reader">',
      '  <span class="app-pill-label" id="app-pill-codex-read-label">✠ Read</span>',
      '  <span class="app-pill-caret" aria-hidden="true">▾</span>',
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

    const lensMenu = document.createElement('div');
    lensMenu.className = 'app-pill-menu app-pill-menu--codex-lens';
    lensMenu.id        = 'app-pill-codex-lens-menu';
    lensMenu.setAttribute('role', 'menu');
    lensMenu.setAttribute('aria-hidden', 'true');
    wrap.appendChild(lensMenu);

    const readMenu = document.createElement('div');
    readMenu.className = 'app-pill-menu app-pill-menu--codex-read';
    readMenu.id        = 'app-pill-codex-read-menu';
    readMenu.setAttribute('role', 'menu');
    readMenu.setAttribute('aria-hidden', 'true');
    wrap.appendChild(readMenu);

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
      const rows = LENSES.map(L => {
        const isActive = state.lensId === L.id;
        return (
          '<button class="app-pill-menu-item' + (isActive ? ' is-active' : '') + '"' +
          ' role="menuitem" data-lens="' + esc(L.id) + '"' +
          (L.enabled ? '' : ' disabled') +
          ' type="button">' +
          '<span class="app-pill-menu-label">' + esc(L.label) + '</span>' +
          '<span class="app-pill-menu-hint">' + esc(L.hint) + '</span>' +
          (isActive ? '<span class="app-pill-menu-check">●</span>' : '') +
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

    function buildReadMenu() {
      const corpora = window.SCRIPTURE_CORPORA || {};
      const dn2tk = getDocnodeToTextKey();
      const rows = [];

      // "All families" path: list every reader-ready scripture
      // (every SCRIPTURE_TEXTS entry whose docNode points at a real
      // vault node), grouped by tradition. ~130 entries total.
      if (!state.familyId) {
        rows.push(
          '<div class="app-pill-menu-section-label">All reader-ready scriptures · pick a family above for a focused list</div>'
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
          rows.push(
            '<button class="app-pill-menu-item" role="menuitem" data-textkey="' + esc(it.textKey) + '" type="button">' +
            '<span class="app-pill-menu-label">' + esc(it.label) + '</span>' +
            (it.corpus ? '<span class="app-pill-menu-hint">' + esc(it.corpus.split('·')[0].trim()) + '</span>' : '') +
            '</button>'
          );
        });
        readMenu.innerHTML = rows.join('') || '<div class="app-pill-menu-section-label">No reader-ready texts yet</div>';
        return;
      }

      // Family-focused path: walk corpus.sections, group books by
      // canonical section, show only the family's books. Books with
      // a SCRIPTURE_TEXTS entry are clickable; books without are
      // shown disabled with a "no reader text yet" hint.
      const corpus = corpora[state.familyId];
      if (!corpus) {
        readMenu.innerHTML = '<div class="app-pill-menu-section-label">Pick a family first</div>';
        return;
      }
      const sections = corpus.sections || [];
      if (!sections.length) {
        readMenu.innerHTML = '<div class="app-pill-menu-section-label">No sections defined for this canon</div>';
        return;
      }
      sections.forEach(sec => {
        const books = sec.books || [];
        if (!books.length) return;
        rows.push('<div class="app-pill-menu-section-label">' + esc(sec.label || '') + '</div>');
        books.forEach(book => {
          const tk = dn2tk[book.id];
          const ready = !!tk;
          rows.push(
            '<button class="app-pill-menu-item' + (ready ? '' : ' is-stub') + '"' +
            ' role="menuitem"' +
            (ready ? ' data-textkey="' + esc(tk) + '"' : ' disabled') +
            ' type="button">' +
            '<span class="app-pill-menu-label">' + esc(book.label || book.id) + '</span>' +
            '<span class="app-pill-menu-hint">' + (ready ? 'open in reader →' : 'reader text not yet written') + '</span>' +
            '</button>'
          );
        });
      });
      readMenu.innerHTML = rows.join('');
    }

    // ── Sync trigger labels ──────────────────────────────────
    function syncLabels() {
      const familyLabel = document.getElementById('app-pill-codex-family-label');
      const lensLabel   = document.getElementById('app-pill-codex-lens-label');
      if (familyLabel) {
        if (state.familyId && window.SCRIPTURE_CORPORA && window.SCRIPTURE_CORPORA[state.familyId]) {
          familyLabel.textContent = shortLabelFor(state.familyId, window.SCRIPTURE_CORPORA[state.familyId]);
        } else {
          familyLabel.textContent = 'All families';
        }
      }
      if (lensLabel) {
        const L = LENSES.find(x => x.id === state.lensId);
        lensLabel.textContent = L ? L.label : 'Books';
      }
    }

    // ── Menu positioning (same pattern as app-pill.js) ───────
    function positionMenu(menu, anchorBtn) {
      const rect = anchorBtn.getBoundingClientRect();
      menu.style.left = rect.left + 'px';
      menu.style.top  = (rect.bottom + 6) + 'px';
    }

    const familyBtn = document.getElementById('app-pill-codex-family');
    const lensBtn   = document.getElementById('app-pill-codex-lens');
    const readBtn   = document.getElementById('app-pill-codex-read');

    function closeAllMenus() {
      familyMenu.classList.remove('is-open');
      lensMenu.classList.remove('is-open');
      readMenu.classList.remove('is-open');
      familyMenu.setAttribute('aria-hidden', 'true');
      lensMenu.setAttribute('aria-hidden', 'true');
      readMenu.setAttribute('aria-hidden', 'true');
      familyBtn.setAttribute('aria-expanded', 'false');
      lensBtn.setAttribute('aria-expanded', 'false');
      readBtn.setAttribute('aria-expanded', 'false');
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
    lensBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      const isOpen = lensMenu.classList.contains('is-open');
      closeAllMenus();
      if (!isOpen) openMenu(lensMenu, lensBtn, buildLensMenu);
    });
    readBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      const isOpen = readMenu.classList.contains('is-open');
      closeAllMenus();
      if (!isOpen) openMenu(readMenu, readBtn, buildReadMenu);
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
      local.codexFamily = newFamily;
      // Reset the remount-filter latch so the new family triggers
      // a fresh rebuild via the same code path on next view-swap.
      local._codexFilterAppliedFor = null;
      saveState();
      syncLabels();
      if (typeof rebuildForMode === 'function' && local.mode && local.mode.id) {
        try { rebuildForMode(local.mode.id, { preserveLocks: true, preserveZoom: false }); }
        catch (e) { console.warn('[codex-controls] rebuildForMode failed', e); }
      }
    });
    lensMenu.addEventListener('click', function (ev) {
      const btn = ev.target.closest('.app-pill-menu-item');
      if (!btn || btn.disabled) return;
      ev.stopPropagation();
      const newLens = btn.dataset.lens || 'books';
      closeAllMenus();
      if (newLens === state.lensId) return;
      state.lensId = newLens;
      local.codexLens = newLens;
      saveState();
      syncLabels();
      // V1 — Books-only is active; switching lens is a no-op for
      // filter purposes until Personae/Authors/Deities ship.
    });
    readMenu.addEventListener('click', function (ev) {
      const btn = ev.target.closest('.app-pill-menu-item');
      if (!btn || btn.disabled) return;
      ev.stopPropagation();
      const tk = btn.dataset.textkey;
      closeAllMenus();
      if (tk && window._forge && typeof window._forge.openReader === 'function') {
        window._forge.openReader(tk);
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
