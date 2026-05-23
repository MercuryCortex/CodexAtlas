// ============================================================
// CODEX ATLAS — APP-SHELL TOP-BAR PILL (Phase 22-B + 22-C)
// ============================================================
// The elegant dual-pill that lives at the app shell level on every
// view. LEFT half = master view (Forge / Timeline / Board / Map /
// Star Map). RIGHT half = class subset (Deities / Persons / etc.).
//
// Phase 22-B (this commit) wires the LEFT side — master-view
// dropdown populated, click → setView(), pill label updates on
// view change.
//
// Phase 22-C (next commit) will wire the RIGHT side — class
// selector — and DELETE the legacy Forge bottom-bar pill.
//
// Exposes nothing on window. All state is local; LS persistence
// per CODEX v1.2 schema (forge.viewSettings.v7 stays the canonical
// key for tier/political-risk; this module uses
// `codex-atlas/app-pill-v1` for its own state — currently empty
// since master-view is derived from STATE.view).
// ============================================================
(function () {
  'use strict';

  // ── MASTER VIEW TABLE ───────────────────────────────────────
  // The 5 promoted master views per the topbar refactor audit
  // (AUDIT/topbar-pill-refactor-design-2026-05-23.md §10 D-14).
  // Each entry: pill icon + label + the setView() target name.
  // Other legacy views (Astrology, Philosophy, Scripture Reader,
  // etc.) live in the Preferences drawer under "Old prototypes"
  // and do NOT appear in the master pill — Phase 22-D.
  //
  // STAR MAP currently points at the legacy Astrology view; when
  // a dedicated WebGPU star-map mode ships it'll repoint there.
  // BOARD points at the legacy transmutation board (which IS the
  // V01 free-form pinboard — the "ultimate investigation tool"
  // per John's CODEX framing). MAP points at the MapLibre atlas
  // per the feedback_atlas_is_map memory.
  const MASTER_VIEWS = [
    { id: 'forge',        target: 'forge',        icon: '⚒', label: 'FORGE'    },
    { id: 'timeline',     target: 'timeline',     icon: '⎯', label: 'TIMELINE' },
    { id: 'board',        target: 'transmutation',icon: '⚗', label: 'BOARD'    },
    { id: 'map',          target: 'atlas',        icon: '⌖', label: 'MAP'      },
    { id: 'starmap',      target: 'astrology',    icon: '♄', label: 'STAR MAP' },
  ];

  // Reverse lookup: setView name → master view entry.
  // Multiple legacy views can map to the same master entry (e.g.,
  // both 'pantheon' and 'pantheon-v2' map to FORGE because they're
  // both deity wheels). Anything not in this map renders FORGE as
  // the default — user is "in" an unrelated view but the pill at
  // least shows a stable anchor.
  const TARGET_TO_MASTER = (() => {
    const m = Object.create(null);
    for (const mv of MASTER_VIEWS) m[mv.target] = mv;
    // legacy view aliases:
    m['pantheon']    = MASTER_VIEWS[0];   // both pantheon variants map to FORGE
    m['transmission'] = MASTER_VIEWS[2];  // transmission was an alt board mount
    return m;
  })();

  const masterBtn   = document.getElementById('app-pill-master');
  const masterMenu  = document.getElementById('app-pill-master-menu');
  const masterLabel = document.getElementById('app-pill-master-label');
  const classBtn    = document.getElementById('app-pill-class');
  const classMenu   = document.getElementById('app-pill-class-menu');
  if (!masterBtn || !masterMenu) return;   // pill scaffold not present

  // The icon span lives inside masterBtn; grab via class.
  const masterIcon  = masterBtn.querySelector('.app-pill-icon');

  // ── BUILD MASTER MENU ───────────────────────────────────────
  function buildMasterMenu() {
    const cur = currentMaster();
    const html = MASTER_VIEWS.map(mv => (
      '<button class="app-pill-menu-item' + (mv.id === cur.id ? ' is-active' : '') + '"'
      + ' role="menuitem" data-master="' + mv.id + '" type="button">'
      +   '<span class="app-pill-menu-icon">' + mv.icon + '</span>'
      +   '<span class="app-pill-menu-label">' + mv.label + '</span>'
      +   (mv.id === cur.id ? '<span class="app-pill-menu-check">●</span>' : '')
      + '</button>'
    )).join('')
      + '<div class="app-pill-menu-divider"></div>'
      + '<button class="app-pill-menu-item app-pill-menu-item--meta" role="menuitem"'
      +   ' id="app-pill-old-prototypes" type="button">'
      +   '<span class="app-pill-menu-icon">⋯</span>'
      +   '<span class="app-pill-menu-label">Old prototypes</span>'
      +   '<span class="app-pill-menu-hint">(reference)</span>'
      + '</button>';
    masterMenu.innerHTML = html;
  }

  // ── CURRENT MASTER LOOKUP ───────────────────────────────────
  function currentMaster() {
    const view = (window.STATE && window.STATE.view) || 'forge';
    return TARGET_TO_MASTER[view] || MASTER_VIEWS[0];
  }

  // ── SYNC PILL LABEL ─────────────────────────────────────────
  function syncPillLabel() {
    const mv = currentMaster();
    if (masterLabel) masterLabel.textContent = mv.label;
    if (masterIcon)  masterIcon.textContent  = mv.icon;
    // Rebuild menu so the .is-active marker tracks.
    if (masterMenu.classList.contains('is-open')) buildMasterMenu();
  }

  // ── OPEN / CLOSE MENUS ──────────────────────────────────────
  function openMaster() {
    closeClass();              // mutual exclusion
    buildMasterMenu();
    masterMenu.classList.add('is-open');
    masterMenu.setAttribute('aria-hidden', 'false');
    masterBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMaster() {
    masterMenu.classList.remove('is-open');
    masterMenu.setAttribute('aria-hidden', 'true');
    masterBtn.setAttribute('aria-expanded', 'false');
  }
  function closeClass() {
    if (!classMenu) return;
    classMenu.classList.remove('is-open');
    classMenu.setAttribute('aria-hidden', 'true');
    if (classBtn) classBtn.setAttribute('aria-expanded', 'false');
  }
  function toggleMaster() {
    if (masterMenu.classList.contains('is-open')) closeMaster();
    else openMaster();
  }

  // ── EVENT WIRING ────────────────────────────────────────────
  masterBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    toggleMaster();
  });

  masterMenu.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-master], button#app-pill-old-prototypes');
    if (!btn) return;
    ev.stopPropagation();
    if (btn.id === 'app-pill-old-prototypes') {
      // Phase 22-D will open the Preferences drawer here. For now,
      // fall back to the existing nav-hub menu which already lists
      // every legacy view.
      const navTrigger = document.getElementById('nav-hub-trigger');
      const navMenu    = document.getElementById('nav-hub-menu');
      if (navMenu && navTrigger) {
        if (!navMenu.classList.contains('is-open')) navTrigger.click();
      }
      closeMaster();
      return;
    }
    const id = btn.getAttribute('data-master');
    const mv = MASTER_VIEWS.find(x => x.id === id);
    if (!mv) return;
    closeMaster();
    // Switch view via the existing global setView.
    if (typeof window.setView === 'function') {
      try { window.setView(mv.target); } catch (e) { console.warn('app-pill setView failed', e); }
    } else if (typeof setView === 'function') {
      try { setView(mv.target); } catch (e) { console.warn('app-pill setView failed', e); }
    }
  });

  // Click outside → close any open menu. Same pattern as nav-hub.
  document.addEventListener('click', (ev) => {
    const wrap = document.getElementById('app-pill-wrap');
    if (!wrap) return;
    if (wrap.contains(ev.target)) return;
    closeMaster();
    closeClass();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      closeMaster();
      closeClass();
    }
  });

  // ── REACT TO VIEW CHANGES ───────────────────────────────────
  document.addEventListener('codex:view-changed', syncPillLabel);
  // Initial paint — STATE.view may already be set from URL.
  syncPillLabel();

  // ── EXPOSE A SMALL DEBUG HANDLE ─────────────────────────────
  // No public API. Internal probes for console diagnosis.
  window._appPill = {
    syncPillLabel,
    currentMaster,
    MASTER_VIEWS,
    open:  openMaster,
    close: closeMaster,
  };
})();
