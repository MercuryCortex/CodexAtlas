// ============================================================
// CODEX ATLAS — BOARDS V2 CONTEXTUAL PILL (step 4 of 10)
// ============================================================
//
// Filed 2026-05-28 per AUDIT/2026-05-28-boards-v2-new-ux-spec.md.
//
// Sister module to src/js/forge/codex-controls.js — same architectural
// pattern (second .app-pill group inside the existing .app-pill-wrap,
// body-class visibility toggle, hard-guard CSS rule against showing
// outside its view).
//
// Pill shape (left → right):
//   [ Investigation ▾ ] | [ Add node ▾ ] | [ Save tree ]
//
//   Investigation ▾ — opens the Investigation Library (4 categories:
//                     MY BOARDS · MASSIVE WINS · AI PRESETS ·
//                     TRANSMISSIONS). Step 5 wires the actual library.
//   Add node ▾      — opens a vault search picker. Click a result →
//                     addCard() drops it on the board. THIS IS THE
//                     PRIMARY USER FLOW in step 4 — gives John an
//                     interactive way to populate the board without
//                     relying on seedTest().
//   Save tree       — placeholder until step 9 (LS persistence).
//
// Visibility:
//   · Body class `app-pill-boards-visible` is added by VIEWS.boards
//     render() and removed by setView() on view-swap.
//   · Hard CSS guard: body:not(.view-boards) .app-pill--boards
//     {display:none !important} — belt + braces so the boards pill
//     can NEVER leak into another view (same pattern the codex pill
//     uses for app-pill--codex against non-forge views).
// ============================================================
(function () {
  'use strict';

  // ── BUILD THE PILL DOM ───────────────────────────────────────
  function installPill() {
    const wrap = document.getElementById('app-pill-wrap');
    if (!wrap) {
      if (console && console.warn) console.warn('[boards-controls] #app-pill-wrap not found; boards pill inert');
      return null;
    }
    if (document.getElementById('app-pill-boards')) return; // already installed

    const pill = document.createElement('div');
    pill.className = 'app-pill app-pill--boards';
    pill.setAttribute('role', 'group');
    pill.id = 'app-pill-boards';
    pill.innerHTML = [
      '<button class="app-pill-side app-pill-boards-investigation" id="app-pill-boards-investigation"',
      '        type="button" aria-haspopup="menu" aria-expanded="false"',
      '        aria-controls="app-pill-boards-investigation-menu"',
      '        title="Open the Transmission Library — MY BOARDS / MASSIVE WINS / AI PRESETS / DOCUMENTED">',
      '  <span class="app-pill-label" id="app-pill-boards-investigation-label">Transmission</span>',
      '  <span class="app-pill-caret" aria-hidden="true">▾</span>',
      '</button>',
      '<span class="app-pill-divider" aria-hidden="true"></span>',
      '<button class="app-pill-side app-pill-boards-addnode" id="app-pill-boards-addnode"',
      '        type="button" aria-haspopup="menu" aria-expanded="false"',
      '        aria-controls="app-pill-boards-addnode-menu"',
      '        title="Search the vault and drop a node onto the board as a card">',
      '  <span class="app-pill-label" id="app-pill-boards-addnode-label">Add node</span>',
      '  <span class="app-pill-caret" aria-hidden="true">▾</span>',
      '</button>',
      // 2026-05-29 — Edges toggle moved OUT of the top pill into the
      // boards-bottombar canonical-toolbar pattern (matches Atlas chart's
      // bottom view-options strip). The top pill keeps only the
      // creative-action buttons (Transmission library / Add node /
      // Save tree); view-option toggles belong at the bottom.
      '<span class="app-pill-divider" aria-hidden="true"></span>',
      '<button class="app-pill-side app-pill-boards-save" id="app-pill-boards-save"',
      '        type="button"',
      '        title="Save the current board (LS persistence lands in step 9)">',
      '  <span class="app-pill-label" id="app-pill-boards-save-label">Save tree</span>',
      '</button>',
    ].join('\n');

    // Insert right after the master/class pill (sibling to .app-pill--codex
    // which the forge view installs into the same wrap when active).
    const firstPill = wrap.querySelector('.app-pill');
    if (firstPill && firstPill.nextSibling) {
      wrap.insertBefore(pill, firstPill.nextSibling);
    } else {
      wrap.appendChild(pill);
    }

    // Investigation menu (placeholder; step 5 populates content).
    const investigationMenu = document.createElement('div');
    investigationMenu.className = 'app-pill-menu app-pill-menu--boards-investigation';
    investigationMenu.id = 'app-pill-boards-investigation-menu';
    investigationMenu.setAttribute('role', 'menu');
    investigationMenu.setAttribute('aria-hidden', 'true');
    wrap.appendChild(investigationMenu);

    // Add-node menu (functional in step 4 — vault search picker).
    const addNodeMenu = document.createElement('div');
    addNodeMenu.className = 'app-pill-menu app-pill-menu--boards-addnode';
    addNodeMenu.id = 'app-pill-boards-addnode-menu';
    addNodeMenu.setAttribute('role', 'menu');
    addNodeMenu.setAttribute('aria-hidden', 'true');
    wrap.appendChild(addNodeMenu);

    return { pill, investigationMenu, addNodeMenu };
  }

  // ── POSITIONING (matches app-pill.js / codex-controls.js pattern) ──
  function positionMenu(menu, anchorBtn) {
    if (!menu || !anchorBtn) return;
    const r = anchorBtn.getBoundingClientRect();
    const top  = Math.round(r.bottom + 6);
    let left   = Math.round(r.left);
    const margin = 8;
    const menuW = menu.offsetWidth || 280;
    if (left + menuW + margin > window.innerWidth) left = window.innerWidth - menuW - margin;
    if (left < margin) left = margin;
    menu.style.top  = top  + 'px';
    menu.style.left = left + 'px';
  }

  // ── ADD-NODE MENU: vault search picker ──────────────────────
  // Reads window.VAULT_DATA.nodes (the universal vault — the live
  // `DATA` const is top-level in app.js but not on window, while
  // VAULT_DATA is the window-mirrored alias other modules consume).
  // Filters by title substring as the user types. Limits results to
  // 60 so big vaults don't choke the DOM. Click → addCard, close
  // menu, defer focus.
  function buildAddNodeMenu(menuEl, btnEl) {
    const vault = window.VAULT_DATA || window.DATA || null;
    const allNodes = (vault && Array.isArray(vault.nodes)) ? vault.nodes : [];
    menuEl.innerHTML = [
      '<div class="boards-pill-search">',
      '  <input class="boards-pill-search-input" id="boards-pill-search-input"',
      '         type="text" placeholder="Search vault — title / id..." autocomplete="off" />',
      '  <div class="boards-pill-search-hint" id="boards-pill-search-hint">',
      '    ' + (allNodes.length || 0) + ' nodes · type to filter',
      '  </div>',
      '</div>',
      '<div class="boards-pill-results" id="boards-pill-results" role="listbox"></div>',
    ].join('');

    const inputEl   = menuEl.querySelector('#boards-pill-search-input');
    const resultsEl = menuEl.querySelector('#boards-pill-results');
    const hintEl    = menuEl.querySelector('#boards-pill-search-hint');

    function render(filter) {
      const q = (filter || '').trim().toLowerCase();
      const pool = q
        ? allNodes.filter(n => {
            if (!n) return false;
            const t = (n.title || '').toLowerCase();
            const i = (n.id || '').toLowerCase();
            return t.includes(q) || i.includes(q);
          })
        : allNodes.slice(0, 60);   // show first 60 by default
      const shown = pool.slice(0, 60);
      hintEl.textContent = q
        ? (pool.length + ' match' + (pool.length === 1 ? '' : 'es') + (pool.length > 60 ? ' · showing first 60' : ''))
        : (allNodes.length + ' nodes · type to filter · showing first 60');
      resultsEl.innerHTML = shown.map(n => (
        '<button class="boards-pill-result" role="option" data-node-id="' + encodeURIComponent(n.id) + '" type="button">'
        +   '<span class="boards-pill-result-title">' + escapeHtml(n.title || n.id) + '</span>'
        +   (n.type ? '<span class="boards-pill-result-type">' + escapeHtml(n.type) + '</span>' : '')
        + '</button>'
      )).join('');
    }
    render('');

    // Type → re-filter.
    inputEl.addEventListener('input', () => render(inputEl.value));

    // Click a result → add card. Position the new card at the current
    // viewport center in WORLD coords. _boardsView.addCard handles the
    // duplicate-id case by returning the existing card.
    resultsEl.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button[data-node-id]');
      if (!btn) return;
      const nodeId = decodeURIComponent(btn.getAttribute('data-node-id'));
      const node = allNodes.find(n => n.id === nodeId);
      if (!node) return;

      // Center of the boards-stage in WORLD coords. Boards stores
      // pan/zoom in module scope — read via getState().
      const stage = document.getElementById('boards-stage');
      let wx = 100, wy = 100;
      if (stage && window._boardsView && window._boardsView.getState) {
        const r = stage.getBoundingClientRect();
        const st = window._boardsView.getState();
        wx = Math.round((r.width  / 2 - st.pan.x) / st.zoom - 100);
        wy = Math.round((r.height / 2 - st.pan.y) / st.zoom - 20);
      }
      if (window._boardsView && window._boardsView.addCard) {
        window._boardsView.addCard({
          id:    node.id,
          label: node.title || node.id,
          x:     wx, y: wy,
        });
      }
      closeAll();
    });

    // Focus the input on open so the user can just start typing.
    setTimeout(() => inputEl.focus(), 0);
  }

  // ── INVESTIGATION MENU: step 5 — 4-category library ─────────
  // Categories:
  //   MY BOARDS    — user's saved boards (step 9 LS-rehydrates this list;
  //                  stub for now)
  //   MASSIVE WINS — 32 boards generated from MASSIVE-WINS-INDEX.md
  //                  (sections II-IV: structural parallels, inversions,
  //                  shared substrates)
  //   AI PRESETS   — 71 curated investigation chains from the legacy
  //                  ALCHEMY_PRESETS list, grouped by PRESET_CATEGORY_ORDER
  //   TRANSMISSIONS — 11 documented transmission chains from section I
  //                   of MASSIVE-WINS-INDEX.md
  //
  // Each entry click → window._boardsView.loadPreset({name, picks, replace:true}).
  function buildInvestigationMenu(menuEl) {
    const lib   = window.BOARDS_LIBRARY || { massiveWins: [], transmissions: [] };
    // ALCHEMY_PRESETS + PRESET_CATEGORY_ORDER are top-level const in app.js —
    // accessible by bare name from any script loaded after app.js (in the
    // global lexical scope), but NOT on window. Wrap in try/catch in case
    // of future refactors that move them.
    let presets = [], presetCats = [];
    try { if (typeof ALCHEMY_PRESETS !== 'undefined' && Array.isArray(ALCHEMY_PRESETS)) presets = ALCHEMY_PRESETS; } catch (_) {}
    try { if (typeof PRESET_CATEGORY_ORDER !== 'undefined' && Array.isArray(PRESET_CATEGORY_ORDER)) presetCats = PRESET_CATEGORY_ORDER; } catch (_) {}

    // Load saved boards. Step 9 — the data is now live; saving a tree
    // populates this list, loading replaces the current board, delete
    // removes from LS. listBoards() is the canonical source.
    const myBoards = (window._boardsView && window._boardsView.listBoards)
      ? window._boardsView.listBoards()
      : [];
    const curId = (window._boardsView && window._boardsView.currentBoardId)
      ? window._boardsView.currentBoardId()
      : null;

    function sectionRow(label, count) {
      return (
        '<div class="boards-lib-section-label">'
        +   '<span class="boards-lib-section-name">' + escapeHtml(label) + '</span>'
        +   '<span class="boards-lib-section-count">' + count + '</span>'
        + '</div>'
      );
    }
    function entryRow(entry, kind) {
      const name = entry.name || entry.id;
      const headline = entry.headline || '';
      const picksCount = Array.isArray(entry.picks) ? entry.picks.length : 0;
      return (
        '<button class="boards-lib-entry" role="menuitem" type="button"'
        +   ' data-kind="' + kind + '" data-id="' + encodeURIComponent(entry.id) + '">'
        +   '<div class="boards-lib-entry-title">' + escapeHtml(name) + '</div>'
        +   (headline ? '<div class="boards-lib-entry-headline">' + escapeHtml(headline) + '</div>' : '')
        +   '<div class="boards-lib-entry-meta">' + picksCount + ' nodes</div>'
        + '</button>'
      );
    }

    const html = [];
    html.push('<div class="boards-lib-scroll">');

    // ── MY BOARDS ─────────────────────────────────────────────
    html.push(sectionRow('★ My boards', myBoards.length));
    if (myBoards.length) {
      myBoards.forEach(b => {
        const isCurrent = b.id === curId;
        const dateStr = (() => {
          try { return new Date(b.updatedAt || b.createdAt).toISOString().slice(0, 10); }
          catch (_) { return ''; }
        })();
        html.push(
          '<div class="boards-lib-entry-row' + (isCurrent ? ' is-current' : '') + '">'
          +   '<button class="boards-lib-entry boards-lib-entry--mine"'
          +     ' role="menuitem" type="button"'
          +     ' data-kind="mine" data-id="' + encodeURIComponent(b.id) + '">'
          +     '<div class="boards-lib-entry-title">'
          +       (isCurrent ? '<span class="boards-lib-current-marker">●</span> ' : '')
          +       escapeHtml(b.name || b.id)
          +     '</div>'
          +     '<div class="boards-lib-entry-meta">'
          +       (b.cards ? b.cards.length : 0) + ' cards'
          +       (dateStr ? ' · ' + dateStr : '')
          +     '</div>'
          +   '</button>'
          +   '<button class="boards-lib-entry-delete" type="button"'
          +     ' data-delete="' + encodeURIComponent(b.id) + '"'
          +     ' title="Delete this saved board" aria-label="Delete board">×</button>'
          + '</div>'
        );
      });
    } else {
      html.push(
        '<div class="boards-lib-empty">'
        + 'Add nodes, arrange them, then <strong>Save tree</strong>. '
        + 'Saved investigations appear here.'
        + '</div>'
      );
    }

    // ── MASSIVE WINS ──────────────────────────────────────────
    html.push(sectionRow('◇ Massive wins', lib.massiveWins.length));
    lib.massiveWins.forEach(b => html.push(entryRow(b, 'massive-win')));

    // ── AI PRESETS — sub-grouped by PRESET_CATEGORY_ORDER ────
    html.push(sectionRow('☿ AI presets', presets.length));
    presetCats.forEach(cat => {
      const items = presets.filter(p => p.category === cat.key);
      if (!items.length) return;
      html.push(
        '<div class="boards-lib-subsection-label">'
        +   escapeHtml(cat.label) + ' <span class="boards-lib-subsection-count">' + items.length + '</span>'
        + '</div>'
      );
      items.forEach(p => html.push(entryRow(p, 'ai-preset')));
    });

    // ── DOCUMENTED ────────────────────────────────────────────
    // Section I of MASSIVE-WINS-INDEX.md = documented transmission chains.
    // Renamed from "Transmissions" 2026-05-28 to avoid collision with the
    // top-level pill button label which is now "Transmission".
    html.push(sectionRow('→ Documented', lib.transmissions.length));
    lib.transmissions.forEach(b => html.push(entryRow(b, 'transmission')));

    html.push('</div>');
    menuEl.innerHTML = html.join('');

    // Click wiring — dispatch by kind. MY BOARDS uses loadBoardById
    // (restores exact pan/zoom/cards). Other kinds use loadPreset
    // (grid layout from a list of vault IDs).
    menuEl.addEventListener('click', (ev) => {
      // Delete button on a My-boards row.
      const delBtn = ev.target.closest('button[data-delete]');
      if (delBtn) {
        ev.stopPropagation();
        const id = decodeURIComponent(delBtn.getAttribute('data-delete'));
        const target = myBoards.find(b => b.id === id);
        const ok = confirm('Delete saved board “' + (target && target.name || id) + '”?');
        if (ok && window._boardsView && window._boardsView.deleteBoardById) {
          window._boardsView.deleteBoardById(id);
          // Re-render menu in place so the row vanishes without re-opening.
          buildInvestigationMenu(menuEl);
        }
        return;
      }
      const btn = ev.target.closest('button[data-kind][data-id]');
      if (!btn) return;
      ev.stopPropagation();
      const kind = btn.getAttribute('data-kind');
      const id   = decodeURIComponent(btn.getAttribute('data-id'));

      if (kind === 'mine') {
        // Load saved board verbatim (pan/zoom/cards restored).
        if (window._boardsView && window._boardsView.loadBoardById) {
          window._boardsView.loadBoardById(id);
        }
        closeAll();
        return;
      }

      let entry = null;
      if (kind === 'massive-win')      entry = lib.massiveWins.find(b => b.id === id);
      else if (kind === 'transmission') entry = lib.transmissions.find(b => b.id === id);
      else if (kind === 'ai-preset')    entry = presets.find(p => p.id === id);
      if (!entry) return;
      if (window._boardsView && window._boardsView.loadPreset) {
        const n = window._boardsView.loadPreset({
          name: entry.name,
          picks: entry.picks,
          replace: true,
        });
        if (console && console.info) console.info('[boards] loaded preset:', entry.name, '→', n, 'cards');
      }
      closeAll();
    });
  }

  // ── OPEN / CLOSE LOGIC ──────────────────────────────────────
  let _openMenu = null;     // 'investigation' | 'addnode' | null

  function closeAll() {
    document.querySelectorAll('#app-pill-boards-investigation-menu, #app-pill-boards-addnode-menu')
      .forEach(m => {
        m.classList.remove('is-open');
        m.setAttribute('aria-hidden', 'true');
      });
    document.querySelectorAll('#app-pill-boards-investigation, #app-pill-boards-addnode')
      .forEach(b => b.setAttribute('aria-expanded', 'false'));
    _openMenu = null;
  }
  function openInvestigation() {
    closeAll();
    const menu = document.getElementById('app-pill-boards-investigation-menu');
    const btn  = document.getElementById('app-pill-boards-investigation');
    if (!menu || !btn) return;
    buildInvestigationMenu(menu);
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    positionMenu(menu, btn);
    _openMenu = 'investigation';
  }
  function openAddNode() {
    closeAll();
    const menu = document.getElementById('app-pill-boards-addnode-menu');
    const btn  = document.getElementById('app-pill-boards-addnode');
    if (!menu || !btn) return;
    buildAddNodeMenu(menu, btn);
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    positionMenu(menu, btn);
    _openMenu = 'addnode';
  }

  // 2026-05-29 — public API for cross-module use (specifically the
  // right-click context menu on the empty boards-stage in
  // VIEWS.boards.render → needs to invoke openAddNode() without
  // going through the trigger.click() indirection that races with
  // the document-click outside-handler).
  window._boardsControls = {
    openAddNode:       openAddNode,
    openInvestigation: openInvestigation,
    closeAll:          closeAll,
  };

  // ── HELPERS ─────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // ── INIT ────────────────────────────────────────────────────
  function init() {
    if (window._boardsControls) return;   // idempotent
    const built = installPill();
    if (!built) return;

    document.getElementById('app-pill-boards-investigation').addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (_openMenu === 'investigation') closeAll(); else openInvestigation();
    });
    document.getElementById('app-pill-boards-addnode').addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (_openMenu === 'addnode') closeAll(); else openAddNode();
    });
    // 2026-05-29 — Edges toggle was moved out of this top pill into the
    // canonical bottom toolbar (.boards-bottombar, built and wired by
    // VIEWS.boards.render in src/js/app.js). The top-pill button no
    // longer exists; this handler block is intentionally a no-op.

    document.getElementById('app-pill-boards-save').addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (!window._boardsView) return;
      const state = window._boardsView.getState();
      if (!state.cards.length) {
        alert('Add nodes to the board first, then Save tree.');
        return;
      }
      // If we have a currentBoardId (loaded earlier), offer to UPDATE.
      const curId = window._boardsView.currentBoardId && window._boardsView.currentBoardId();
      const existing = curId
        ? window._boardsView.listBoards().find(b => b.id === curId)
        : null;
      const defaultName = existing
        ? existing.name
        : ('Board · ' + new Date().toISOString().slice(0, 10));
      const name = prompt(
        existing
          ? 'Update “' + existing.name + '” — change the name or keep it?'
          : 'Name this board (' + state.cards.length + ' cards):',
        defaultName
      );
      if (name == null) return;   // cancelled
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      if (existing) {
        const ok = confirm(
          'Update existing “' + existing.name + '” (cards + pan + zoom replaced)?\n\n'
          + 'Cancel = save as a NEW board instead.'
        );
        if (ok) window._boardsView.updateBoard(curId, trimmed);
        else window._boardsView.saveCurrentBoard(trimmed);
      } else {
        window._boardsView.saveCurrentBoard(trimmed);
      }
    });

    // Click outside → close.
    document.addEventListener('click', (ev) => {
      if (!_openMenu) return;
      const wrap = document.getElementById('app-pill-wrap');
      if (wrap && wrap.contains(ev.target)) return;
      closeAll();
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') closeAll();
    });
    window.addEventListener('resize', () => {
      if (_openMenu === 'investigation') {
        positionMenu(
          document.getElementById('app-pill-boards-investigation-menu'),
          document.getElementById('app-pill-boards-investigation')
        );
      } else if (_openMenu === 'addnode') {
        positionMenu(
          document.getElementById('app-pill-boards-addnode-menu'),
          document.getElementById('app-pill-boards-addnode')
        );
      }
    });

    // Visibility — toggle the body class based on the current view.
    function syncVisibility() {
      const v = (window.STATE && window.STATE.view) || '';
      document.body.classList.toggle('app-pill-boards-visible', v === 'boards');
      if (v !== 'boards') closeAll();
    }
    document.addEventListener('codex:view-changed', syncVisibility);
    syncVisibility();

    window._boardsControls = {
      open:  openAddNode,    // most common entry — surfaces the picker
      close: closeAll,
    };
  }

  // App-shell DOM is parsed by the time this loads (script tag is after
  // body), and the master pill is already in the DOM since app-pill.js
  // loads earlier. Init immediately.
  init();
})();
