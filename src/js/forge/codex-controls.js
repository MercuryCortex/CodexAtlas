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

  // Lens definitions. Books is the V1-enabled lens. Characters /
  // Authors / Deities ship as visible-but-disabled rows so the
  // user sees the roadmap; activation comes in a later batch
  // (needs Lane A edge backfill from each scripture → its
  // characters/authors/deities).
  const LENSES = [
    { id: 'books',    label: 'Books',    enabled: true,  hint: 'Sacred texts of this canon' },
    { id: 'personae', label: 'Personae', enabled: false, hint: 'Named figures in this canon — historical, allegorical, angelic — coming soon' },
    { id: 'authors',  label: 'Authors',  enabled: false, hint: 'Sources / scribes — coming soon' },
    { id: 'deities',  label: 'Deities',  enabled: false, hint: 'Divine figures invoked — coming soon' },
  ];

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
      '        title="Codex lens — Books / Characters / Authors / Deities">',
      '  <span class="app-pill-label" id="app-pill-codex-lens-label">Books</span>',
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
        const label = c.label || k;
        const nBooks = (c.sections || []).reduce((sum, sec) => sum + ((sec.books || []).length), 0);
        const shortLabel = label.split('·')[0].trim();
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

    // ── Sync trigger labels ──────────────────────────────────
    function syncLabels() {
      const familyLabel = document.getElementById('app-pill-codex-family-label');
      const lensLabel   = document.getElementById('app-pill-codex-lens-label');
      if (familyLabel) {
        if (state.familyId && window.SCRIPTURE_CORPORA && window.SCRIPTURE_CORPORA[state.familyId]) {
          const lbl = window.SCRIPTURE_CORPORA[state.familyId].label || state.familyId;
          familyLabel.textContent = lbl.split('·')[0].trim();
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

    function closeAllMenus() {
      familyMenu.classList.remove('is-open');
      lensMenu.classList.remove('is-open');
      familyMenu.setAttribute('aria-hidden', 'true');
      lensMenu.setAttribute('aria-hidden', 'true');
      familyBtn.setAttribute('aria-expanded', 'false');
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
    lensBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      const isOpen = lensMenu.classList.contains('is-open');
      closeAllMenus();
      if (!isOpen) openMenu(lensMenu, lensBtn, buildLensMenu);
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
      // filter purposes until Characters/Authors/Deities ship.
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

    // Re-check on class-pill label change (proxy for class swap).
    const classLabel = document.getElementById('app-pill-class-label');
    if (classLabel) {
      const mo = new MutationObserver(syncVisibility);
      mo.observe(classLabel, { childList: true, characterData: true, subtree: true });
    }
    // Also on layout swaps (FORGE wheel ↔ TIMELINE).
    document.addEventListener('codex:layout-changed', syncVisibility);

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
