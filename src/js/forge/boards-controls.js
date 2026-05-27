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
      '        title="Open the Investigation Library — MY BOARDS / MASSIVE WINS / AI PRESETS / TRANSMISSIONS">',
      '  <span class="app-pill-label" id="app-pill-boards-investigation-label">Investigation</span>',
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

  // ── INVESTIGATION MENU: step-5 placeholder ──────────────────
  function buildInvestigationMenu(menuEl) {
    menuEl.innerHTML = [
      '<div class="boards-pill-placeholder">',
      '  <div class="boards-pill-placeholder-title">Investigation Library</div>',
      '  <div class="boards-pill-placeholder-body">',
      '    The 4-category library — <em>MY BOARDS · MASSIVE WINS · AI PRESETS · TRANSMISSIONS</em>',
      '    — ships in step 5 of the carve plan. For now, use <strong>Add node ▾</strong> to drop',
      '    vault nodes onto the board manually.',
      '  </div>',
      '</div>',
    ].join('');
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
    document.getElementById('app-pill-boards-save').addEventListener('click', (ev) => {
      ev.stopPropagation();
      alert('Save tree — LS persistence ships in step 9 of the carve plan.');
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
