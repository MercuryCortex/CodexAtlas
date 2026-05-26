// ============================================================
// CODEX ATLAS — ATLAS CODEX CONTROLS (Family + Lens dropdowns)
// ============================================================
//
// Filed: 2026-05-28 per AUDIT/2026-05-28-scripture-mode-spec.md
// Step 4 — contextual top-bar filters that ONLY appear when the
// class pill is set to ✶ Codex (modeId === 'scriptures').
//
// AST-VALIDATED DEPS: { local, rebuildForMode }
// BOUNDARY CONTRACT:
//   window._forgeCodexControls.attach({ local, rebuildForMode })
//
// On attach:
//   - injects DOM (pill-shaped Family ▾ + Lens ▾ buttons) right
//     after #app-pill-wrap
//   - injects scoped CSS (single <style id="forge-codex-style">)
//   - populates Family from window.SCRIPTURE_CORPORA (42 corpora)
//   - populates Lens with Books (active) + 3 disabled placeholders
//   - listens for class-pill changes via codex:class-changed event
//     emitted by app-pill.js, OR by polling local.mode.id
//   - shows/hides itself based on local.mode.id === 'scriptures'
//   - on Family pick: stash local.codexFamily, rebuildForMode to
//     refilter the wheel
//
// State persists to LocalStorage at key `atlas.codex.v1` so the
// user's family/lens choice survives reload.
// ============================================================
(function () {
  'use strict';

  const LS_KEY = 'atlas.codex.v1';

  const CSS = [
    '.app-codex-pill {',
    '  display: none;',
    '  align-items: center;',
    '  gap: 0;',
    '  margin-left: 8px;',
    '  background: rgba(255,255,255,0.04);',
    '  border: 1px solid rgba(255,255,255,0.08);',
    '  border-radius: 14px;',
    '  padding: 0;',
    '  font: 11px/1 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;',
    '  letter-spacing: 0.04em;',
    '}',
    '.app-codex-pill.is-active { display: inline-flex; }',
    '.app-codex-btn {',
    '  appearance: none;',
    '  background: transparent;',
    '  border: 0;',
    '  color: #d4d8de;',
    '  padding: 6px 12px;',
    '  font: inherit;',
    '  text-transform: uppercase;',
    '  letter-spacing: 0.06em;',
    '  cursor: pointer;',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 6px;',
    '  border-radius: 14px;',
    '  transition: background 120ms ease;',
    '}',
    '.app-codex-btn:hover { background: rgba(255,255,255,0.06); }',
    '.app-codex-btn.is-open { background: rgba(255,255,255,0.08); color: #fff; }',
    '.app-codex-btn-sep {',
    '  width: 1px;',
    '  height: 14px;',
    '  background: rgba(255,255,255,0.08);',
    '}',
    '.app-codex-btn-value { color: #fff; font-weight: 600; text-transform: none; letter-spacing: 0.01em; }',
    '.app-codex-btn-caret { opacity: 0.6; font-size: 9px; }',
    '.app-codex-menu {',
    '  position: fixed;',
    '  top: 56px;',
    '  background: #1a1e22;',
    '  border: 1px solid #2a2e34;',
    '  border-radius: 6px;',
    '  padding: 6px 0;',
    '  min-width: 260px;',
    '  max-height: 70vh;',
    '  overflow-y: auto;',
    '  box-shadow: 0 8px 24px rgba(0,0,0,0.4);',
    '  z-index: 1000;',
    '  display: none;',
    '  font: 13px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;',
    '}',
    '.app-codex-menu.is-open { display: block; }',
    '.app-codex-item {',
    '  display: block;',
    '  width: 100%;',
    '  text-align: left;',
    '  background: transparent;',
    '  border: 0;',
    '  color: #d4d8de;',
    '  padding: 7px 14px;',
    '  font: inherit;',
    '  cursor: pointer;',
    '}',
    '.app-codex-item:hover:not(:disabled) { background: rgba(255,255,255,0.06); color: #fff; }',
    '.app-codex-item.is-active { background: rgba(212,165,90,0.12); color: #d4a55a; }',
    '.app-codex-item:disabled {',
    '  color: #5a626d;',
    '  cursor: not-allowed;',
    '}',
    '.app-codex-item-hint {',
    '  display: block;',
    '  font-size: 11px;',
    '  color: #8a929c;',
    '  margin-top: 2px;',
    '  font-style: italic;',
    '}',
    '.app-codex-item:disabled .app-codex-item-hint { color: #4a525d; }',
  ].join('\n');

  function injectStyleOnce() {
    if (document.getElementById('forge-codex-style')) return;
    const style = document.createElement('style');
    style.id = 'forge-codex-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Lens definitions. Books is the V1-enabled lens. Characters/
  // Authors/Deities ship as visible-but-disabled rows so the user
  // sees the roadmap; activation comes in a later batch (needs
  // Lane A edge backfill from each scripture → its entities).
  const LENSES = [
    { id: 'books',      label: 'Books',      enabled: true,  hint: 'Sacred texts of this canon' },
    { id: 'characters', label: 'Characters', enabled: false, hint: 'People named in this canon — coming soon' },
    { id: 'authors',    label: 'Authors',    enabled: false, hint: 'Sources / scribes of this canon — coming soon' },
    { id: 'deities',    label: 'Deities',    enabled: false, hint: 'Divine figures invoked in this canon — coming soon' },
  ];

  function attach(deps) {
    const local           = deps.local;
    const rebuildForMode  = deps.rebuildForMode;

    if (!local) return;
    if (local.codexControls && local.codexControls._installed) return;

    injectStyleOnce();

    // Find anchor — we mount right after the #app-pill-wrap.
    const wrap = document.getElementById('app-pill-wrap');
    if (!wrap || !wrap.parentNode) {
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
    // rebuildForMode) can read it without going through the module.
    local.codexFamily = state.familyId;
    local.codexLens   = state.lensId;

    // ── Build DOM ────────────────────────────────────────────
    const pill = document.createElement('div');
    pill.className = 'app-codex-pill';
    pill.id        = 'app-codex-pill';
    pill.innerHTML = [
      '<button class="app-codex-btn" id="app-codex-family-btn" type="button">',
      '  <span>Family</span>',
      '  <span class="app-codex-btn-value" id="app-codex-family-value">All</span>',
      '  <span class="app-codex-btn-caret">▾</span>',
      '</button>',
      '<span class="app-codex-btn-sep" aria-hidden="true"></span>',
      '<button class="app-codex-btn" id="app-codex-lens-btn" type="button">',
      '  <span>Lens</span>',
      '  <span class="app-codex-btn-value" id="app-codex-lens-value">Books</span>',
      '  <span class="app-codex-btn-caret">▾</span>',
      '</button>',
    ].join('\n');
    wrap.parentNode.insertBefore(pill, wrap.nextSibling);

    const familyMenu = document.createElement('div');
    familyMenu.className = 'app-codex-menu';
    familyMenu.id        = 'app-codex-family-menu';
    document.body.appendChild(familyMenu);

    const lensMenu = document.createElement('div');
    lensMenu.className = 'app-codex-menu';
    lensMenu.id        = 'app-codex-lens-menu';
    document.body.appendChild(lensMenu);

    // ── Build menu contents ──────────────────────────────────
    function buildFamilyMenu() {
      const corpora = window.SCRIPTURE_CORPORA || {};
      const rows = [];
      // "All families" sentinel — clears the family filter, returns
      // to the default 109-node SCRIPTURE_IDS view.
      rows.push(
        '<button class="app-codex-item' + (state.familyId === null ? ' is-active' : '') + '"' +
        ' data-family="" type="button">All families' +
        '<span class="app-codex-item-hint">Every canon &middot; 109 sacred texts</span></button>'
      );
      const keys = Object.keys(corpora);
      keys.forEach(k => {
        const c = corpora[k];
        if (!c || c.available === false) return;
        const label = c.label || k;
        const nBooks = (c.sections || []).reduce((sum, sec) => sum + ((sec.books || []).length), 0);
        rows.push(
          '<button class="app-codex-item' + (state.familyId === k ? ' is-active' : '') + '"' +
          ' data-family="' + esc(k) + '" type="button">' + esc(label.split('·')[0].trim()) +
          '<span class="app-codex-item-hint">' + nBooks + ' book' + (nBooks === 1 ? '' : 's') + '</span></button>'
        );
      });
      familyMenu.innerHTML = rows.join('');
    }

    function buildLensMenu() {
      const rows = LENSES.map(L => {
        const isActive = state.lensId === L.id;
        return (
          '<button class="app-codex-item' + (isActive ? ' is-active' : '') + '"' +
          ' data-lens="' + esc(L.id) + '"' +
          (L.enabled ? '' : ' disabled') +
          ' type="button">' + esc(L.label) +
          '<span class="app-codex-item-hint">' + esc(L.hint) + '</span></button>'
        );
      });
      lensMenu.innerHTML = rows.join('');
    }

    // ── Sync button labels ───────────────────────────────────
    function syncLabels() {
      const familyValue = document.getElementById('app-codex-family-value');
      const lensValue   = document.getElementById('app-codex-lens-value');
      if (familyValue) {
        if (state.familyId && window.SCRIPTURE_CORPORA && window.SCRIPTURE_CORPORA[state.familyId]) {
          const lbl = window.SCRIPTURE_CORPORA[state.familyId].label || state.familyId;
          familyValue.textContent = lbl.split('·')[0].trim();
        } else {
          familyValue.textContent = 'All';
        }
      }
      if (lensValue) {
        const L = LENSES.find(x => x.id === state.lensId);
        lensValue.textContent = L ? L.label : 'Books';
      }
    }

    // ── Menu positioning ─────────────────────────────────────
    function positionMenu(menu, anchorBtn) {
      const rect = anchorBtn.getBoundingClientRect();
      menu.style.left = rect.left + 'px';
      menu.style.top  = (rect.bottom + 6) + 'px';
    }

    function closeAllMenus() {
      familyMenu.classList.remove('is-open');
      lensMenu.classList.remove('is-open');
      document.getElementById('app-codex-family-btn').classList.remove('is-open');
      document.getElementById('app-codex-lens-btn').classList.remove('is-open');
    }

    // ── Wire button clicks ───────────────────────────────────
    const familyBtn = document.getElementById('app-codex-family-btn');
    const lensBtn   = document.getElementById('app-codex-lens-btn');

    familyBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      const isOpen = familyMenu.classList.contains('is-open');
      closeAllMenus();
      if (!isOpen) {
        buildFamilyMenu();
        positionMenu(familyMenu, familyBtn);
        familyMenu.classList.add('is-open');
        familyBtn.classList.add('is-open');
      }
    });
    lensBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      const isOpen = lensMenu.classList.contains('is-open');
      closeAllMenus();
      if (!isOpen) {
        buildLensMenu();
        positionMenu(lensMenu, lensBtn);
        lensMenu.classList.add('is-open');
        lensBtn.classList.add('is-open');
      }
    });

    // ── Wire menu picks (event delegation) ───────────────────
    familyMenu.addEventListener('click', function (ev) {
      const btn = ev.target.closest('.app-codex-item');
      if (!btn) return;
      ev.stopPropagation();
      const newFamily = btn.dataset.family || null;
      if (newFamily === state.familyId) { closeAllMenus(); return; }
      state.familyId = newFamily;
      local.codexFamily = newFamily;
      saveState();
      syncLabels();
      closeAllMenus();
      // Re-filter the wheel at the current mode.
      if (typeof rebuildForMode === 'function' && local.mode && local.mode.id) {
        try { rebuildForMode(local.mode.id, { preserveLocks: true, preserveZoom: false }); }
        catch (e) { console.warn('[codex-controls] rebuildForMode failed', e); }
      }
    });
    lensMenu.addEventListener('click', function (ev) {
      const btn = ev.target.closest('.app-codex-item');
      if (!btn || btn.disabled) return;
      ev.stopPropagation();
      const newLens = btn.dataset.lens || 'books';
      if (newLens === state.lensId) { closeAllMenus(); return; }
      state.lensId = newLens;
      local.codexLens = newLens;
      saveState();
      syncLabels();
      closeAllMenus();
      // V1 — books-only is active; switching lens is a no-op for
      // filter purposes until characters/authors/deities ship.
    });

    // Outside-click + ESC close
    document.addEventListener('click', function (ev) {
      if (ev.target.closest('.app-codex-menu')) return;
      if (ev.target.closest('.app-codex-btn')) return;
      closeAllMenus();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeAllMenus();
    });

    // ── Visibility — show only when class === 'scriptures' ──
    function syncVisibility() {
      const isCodex = local.mode && local.mode.id === 'scriptures';
      pill.classList.toggle('is-active', !!isCodex);
      if (!isCodex) closeAllMenus();
    }

    // Initial sync + observe class changes. There's no central event
    // for class changes today; app-pill.js does its own internal sync.
    // We piggyback on the codex:layout-changed event that fires on
    // layout swaps AND poll briefly on a MutationObserver of the
    // class-pill label text.
    syncVisibility();
    syncLabels();

    const classLabel = document.getElementById('app-pill-class-label');
    if (classLabel) {
      const mo = new MutationObserver(syncVisibility);
      mo.observe(classLabel, { childList: true, characterData: true, subtree: true });
    }

    // Also re-check after any rebuildForMode (class swaps trigger it).
    document.addEventListener('codex:layout-changed', syncVisibility);

    local.codexControls = {
      getState:    function () { return { familyId: state.familyId, lensId: state.lensId }; },
      setFamily:   function (id) {
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
