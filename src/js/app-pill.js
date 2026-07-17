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
  // Phase TL-2 Step 2 (2026-05-24) — Each master view declares its
  // route. Two route types:
  //   - `target: 'forge', layout: 'wheel'|'timeline'`  → calls
  //     setView('forge') if not active, then _forge.setLayout(layout).
  //     Used for in-Forge-engine layouts that share the WebGPU
  //     pipeline + bottom-bar + side-panel.
  //   - `target: '<legacy-view-name>'`  → calls setView(target).
  //     Used for legacy SVG views that have their own engine.
  // The FORGE + TIMELINE entries both route to the Forge engine
  // (target='forge') and differ only in layout. BOARD/MAP/STAR MAP
  // still go to the legacy views until they migrate to the Forge
  // engine in their own builds.
  const MASTER_VIEWS = [
    { id: 'forge',    target: 'forge',          layout: 'wheel',    icon: '⚒', label: 'ATLAS'    },
    { id: 'timeline', target: 'forge',          layout: 'timeline', icon: '⎯', label: 'TIMELINE' },
    // 2026-05-27 — BOARD now routes to the V2 boards view per
    // AUDIT/2026-05-28-boards-v2-new-ux-spec.md (LOCKED).
    // 2026-05-28 — MAP + STAR MAP repointed to V2 skeletons per
    // AUDIT/2026-05-28-legacy-isolation-locked.md (Option A hard
    // partition). Was routing to legacy VIEWS.atlas (MapLibre map
    // dragged in the V01 chrome) and VIEWS.astrology (4-mode astro
    // tab also V01 chrome). Now points at empty V2 skeleton stages.
    // The legacy implementations remain reachable via the V01
    // snapshot at _legacy/index.html.
    { id: 'board',    target: 'boards',                              icon: '⚗', label: 'BOARD'    },
    { id: 'map',      target: 'maps',                                icon: '⌖', label: 'MAP'      },
    { id: 'starmap',  target: 'starmap',                             icon: '♄', label: 'STAR MAP' },
    // 2026-06-10 — ALPHABETS promoted to the master pill (5→6, John-
    // ratified N1 per AUDIT/2026-06-10-alphabets-page-plan.md): a
    // first-class Section like ATLAS/TIMELINE, all writing-systems.
    { id: 'alphabets', target: 'alphabets',                          icon: 'ℵ', label: 'ALPHABETS' },
    // 2026-06-10 — INVESTIGATION Section (John: "all massive wins and
    // STUFF we learn must come to a PAGE section called Investigation").
    // The consumer-facing findings page; 1,252 harvested findings.
    { id: 'investigation', target: 'investigation',                  icon: '◈', label: 'INVESTIGATION' },
  ];

  // Alpha deploy (2026-07-17): the MAP view needs the 185 MB basemap that
  // can't ship to Cloudflare Pages (25 MB/file cap). When the alpha flag is
  // set (dist index.html), hide MAP + STAR MAP. Dev (no flag) shows all.
  if (window.CODEX_ALPHA_HIDE_MAP) {
    for (let i = MASTER_VIEWS.length - 1; i >= 0; i--) {
      if (MASTER_VIEWS[i].id === 'map' || MASTER_VIEWS[i].id === 'starmap') MASTER_VIEWS.splice(i, 1);
    }
  }

  // ── MASTER MENU NARRATION (surface 05, 2026-07-16) ─────────
  // The dropdown groups the SAME MASTER_VIEWS entries under three
  // narrated sections and gives each row one italic-serif line of
  // microcopy. Framing only — targets, routing and the pill face
  // are untouched (AUDIT/2026-07-16-fable-design-next-level-plan.md §4).
  // Any MASTER_VIEWS id missing from MASTER_NARRATION falls through
  // to EXPLORE with no copy line — a working view is never dropped.
  const MASTER_SECTIONS = [
    { id: 'explore', label: 'Explore' },
    { id: 'study',   label: 'Study'   },
    { id: 'yours',   label: 'Yours'   },
  ];
  const MASTER_NARRATION = {
    forge:         { section: 'explore', copy: 'the whole map, every tradition' },
    timeline:      { section: 'explore', copy: 'the same map, laid on time' },
    map:           { section: 'explore', copy: 'where it happened, on the earth' },
    starmap:       { section: 'explore', copy: 'the sky the ancients read' },
    alphabets:     { section: 'study',   copy: 'every writing system, one genealogy' },
    investigation: { section: 'study',   copy: 'documented cross-tradition finds' },
    board:         { section: 'yours',   copy: 'your pinboard — save what you find' },
  };

  // Reverse lookup: (STATE.view, _forge.getLayout()) → master view entry.
  // The Forge engine carries TWO master views (FORGE wheel + TIMELINE
  // layout) so a simple STATE.view → master lookup isn't enough. We
  // resolve in currentMaster() below by checking layoutId too.
  const TARGET_TO_MASTER = (() => {
    const m = Object.create(null);
    for (const mv of MASTER_VIEWS) {
      // FORGE wins the 'forge' target slot in the no-layout case;
      // timeline is resolved by layoutId match in currentMaster.
      if (mv.target === 'forge' && mv.layout === 'wheel') m[mv.target] = mv;
      else if (mv.target !== 'forge') m[mv.target] = mv;
    }
    // legacy view aliases — when a deep-link drops the user on a legacy
    // STATE.view name, the master pill still resolves to the right V2
    // label so the chrome stays coherent.
    m['pantheon']     = MASTER_VIEWS[0];   // pantheon → FORGE
    m['transmission'] = MASTER_VIEWS[2];   // transmission → BOARD
    m['transmutation'] = MASTER_VIEWS[2];  // 2026-05-27: transmutation → BOARD
    m['atlas']        = MASTER_VIEWS[3];   // 2026-05-28: legacy MapLibre → MAP
    m['astrology']    = MASTER_VIEWS[4];   // 2026-05-28: legacy astro → STAR MAP
    return m;
  })();

  const masterBtn   = document.getElementById('app-pill-master');
  const masterMenu  = document.getElementById('app-pill-master-menu');
  const masterLabel = document.getElementById('app-pill-master-label');
  const classBtn    = document.getElementById('app-pill-class');
  const classMenu   = document.getElementById('app-pill-class-menu');
  const classLabel  = document.getElementById('app-pill-class-label');
  if (!masterBtn || !masterMenu) return;   // pill scaffold not present

  // The icon span lives inside masterBtn; grab via class.
  const masterIcon  = masterBtn.querySelector('.app-pill-icon');

  // Surface 05 (2026-07-16) — the master menu renders grouped +
  // narrated rows (wider panel, two-line items). One-time modifier
  // class scopes the CSS so the class menu keeps its compact layout.
  masterMenu.classList.add('app-pill-menu--narrated');

  // ── CLASS SELECTOR (Phase 22-C) ─────────────────────────────
  // The right-side pill lists every CLASS the active master view
  // supports. For FORGE the classes come from
  // window._forge.supportedClasses() — a snapshot of the 28-entry
  // modemod.MODES catalog. Forge's installPublicApi() exposes the
  // selector via window._forge.setClassFilter(modeId). Other master
  // views will register their own _<view>.setClassFilter when they
  // ship (Timeline, Map, etc.); the pill detects which view is
  // active via STATE.view + maps to the corresponding API surface.
  //
  // For master views that don't expose a class API, the right side
  // of the pill hides entirely (CSS `body.no-class-side .app-pill-
  // class, .app-pill-divider { display:none }`).
  function currentClassApi() {
    // Phase 22-Z (2026-05-24) — match by mv.target, not mv.id.
    // Both FORGE (id='forge') and TIMELINE (id='timeline') route
    // to the Forge engine (target='forge') and share its class
    // API. Previously this matched only mv.id === 'forge' →
    // Deities pill disappeared the moment user switched to
    // TIMELINE.
    const mv = currentMaster();
    if (mv.target === 'forge'
        && window._forge
        && typeof window._forge.setClassFilter === 'function') {
      return window._forge;
    }
    // 2026-06-10 — ALPHABETS exposes the same class-API contract:
    // its two classes are GENEALOGY (the zoomable tree) and GLYPHS
    // (the per-letter grid). One Section, two surfaces — "the usual".
    if (mv.target === 'alphabets'
        && window._alphabetsView
        && typeof window._alphabetsView.setClassFilter === 'function') {
      return window._alphabetsView;
    }
    // 2026-06-13 — MAP exposes the same contract: its lenses are the
    // node CLASSES present on the map (Deities / Figures / Documents /
    // …). Filters the plotted nodes WITHIN the Section (left-pick-lock).
    if (mv.target === 'maps'
        && window._mapsView
        && typeof window._mapsView.setClassFilter === 'function') {
      return window._mapsView;
    }
    return null;
  }
  function syncClassPill() {
    const api = currentClassApi();
    if (!api) {
      // Hide the right side + divider for views without a class API.
      document.body.classList.add('app-pill-no-class');
      return;
    }
    document.body.classList.remove('app-pill-no-class');
    const cur = api.getClassFilter();
    const classes = api.supportedClasses();
    const entry = classes.find(c => c.value === cur);
    if (entry && classLabel) classLabel.textContent = entry.label;
    if (classMenu.classList.contains('is-open')) buildClassMenu();
  }
  function buildClassMenu() {
    const api = currentClassApi();
    if (!api) { classMenu.innerHTML = ''; return; }
    const cur = api.getClassFilter();
    const classes = api.supportedClasses();
    classMenu.innerHTML = classes.map(c => (
      '<button class="app-pill-menu-item' + (c.value === cur ? ' is-active' : '') + '"'
      + ' role="menuitem" data-class="' + c.value + '" type="button">'
      +   '<span class="app-pill-menu-icon">' + (c.glyph || '·') + '</span>'
      +   '<span class="app-pill-menu-label">' + c.label + '</span>'
      +   (c.value === cur ? '<span class="app-pill-menu-check">●</span>' : '')
      + '</button>'
    )).join('');
  }

  // ── BUILD MASTER MENU ───────────────────────────────────────
  // Surface 05 (2026-07-16) — grouped + narrated. Same buttons,
  // same data-master ids, same click routing below; the menu only
  // gains EXPLORE / STUDY / YOURS section headers and a one-line
  // italic-serif copy per row.
  function buildMasterMenu() {
    const cur = currentMaster();
    const itemHtml = (mv) => {
      const n = MASTER_NARRATION[mv.id] || {};
      return (
        '<button class="app-pill-menu-item app-pill-menu-item--narrated' + (mv.id === cur.id ? ' is-active' : '') + '"'
        + ' role="menuitem" data-master="' + mv.id + '" type="button">'
        +   '<span class="app-pill-menu-icon">' + mv.icon + '</span>'
        +   '<span class="app-pill-menu-text">'
        +     '<span class="app-pill-menu-label">' + mv.label + '</span>'
        +     (n.copy ? '<span class="app-pill-menu-copy">' + n.copy + '</span>' : '')
        +   '</span>'
        +   (mv.id === cur.id ? '<span class="app-pill-menu-check">●</span>' : '')
        + '</button>'
      );
    };
    const html = MASTER_SECTIONS.map(sec => {
      const views = MASTER_VIEWS.filter(mv => {
        const n = MASTER_NARRATION[mv.id];
        return (n ? n.section : 'explore') === sec.id;   // unmapped id → EXPLORE
      });
      if (!views.length) return '';
      return '<div class="app-pill-menu-section-label">' + sec.label + '</div>'
        + views.map(itemHtml).join('');
    }).join('')
      + '<div class="app-pill-menu-divider"></div>'
      + '<button class="app-pill-menu-item app-pill-menu-item--meta" role="menuitem"'
      +   ' id="app-pill-old-prototypes" type="button"'
      +   ' title="Open the frozen V01 prototype snapshot in a new tab (reference only)">'
      +   '<span class="app-pill-menu-icon">🗄</span>'
      +   '<span class="app-pill-menu-label">V01 prototype</span>'
      +   '<span class="app-pill-menu-hint">(reference · new tab)</span>'
      + '</button>';
    masterMenu.innerHTML = html;
  }

  // ── CURRENT MASTER LOOKUP ───────────────────────────────────
  // Phase TL-2 Step 2 — when STATE.view === 'forge', also consult
  // _forge.getLayout() to distinguish FORGE (wheel) from TIMELINE
  // (timeline layout, same engine, same view).
  function currentMaster() {
    const view = (window.STATE && window.STATE.view) || 'forge';
    if (view === 'forge' && window._forge && typeof window._forge.getLayout === 'function') {
      const lay = window._forge.getLayout();
      // 2026-06-13 — GENEALOGY is a forge layout reached from the
      // ALPHABETS section (not a master-menu entry). Display-only
      // synthetic entry so the pill face reads where the user is.
      if (lay === 'genealogy') {
        return { id: 'genealogy', target: 'forge', layout: 'genealogy', icon: '⌁', label: 'GENEALOGY' };
      }
      const mv = MASTER_VIEWS.find(m => m.target === 'forge' && m.layout === lay);
      if (mv) return mv;
    }
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

  // ── POSITIONING ─────────────────────────────────────────────
  // Anchor each dropdown to its trigger button's bottom-left rect.
  // The pill lives at top:14 left:62 (next to the ✦ trigger), so we
  // can't use any CSS centering math — measure the trigger each open
  // and set position: fixed via inline style. Same pattern the legacy
  // wireModeDropdown used. Reposition on window resize while open.
  function positionMenu(menu, anchorBtn) {
    if (!menu || !anchorBtn) return;
    const r = anchorBtn.getBoundingClientRect();
    const top  = Math.round(r.bottom + 6);
    let left   = Math.round(r.left);
    // Clamp horizontally so the menu never escapes the viewport.
    const margin = 8;
    const menuW = menu.offsetWidth || 220;
    if (left + menuW + margin > window.innerWidth) {
      left = window.innerWidth - menuW - margin;
    }
    if (left < margin) left = margin;
    menu.style.top  = top  + 'px';
    menu.style.left = left + 'px';
  }

  // ── OPEN / CLOSE MENUS ──────────────────────────────────────
  function openMaster() {
    closeClass();              // mutual exclusion
    buildMasterMenu();
    masterMenu.classList.add('is-open');
    masterMenu.setAttribute('aria-hidden', 'false');
    masterBtn.setAttribute('aria-expanded', 'true');
    positionMenu(masterMenu, masterBtn);
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
  function openClass() {
    if (!classMenu || !classBtn) return;
    if (!currentClassApi()) return;       // no-op when view has no class API
    closeMaster();
    buildClassMenu();
    classMenu.classList.add('is-open');
    classMenu.setAttribute('aria-hidden', 'false');
    classBtn.setAttribute('aria-expanded', 'true');
    positionMenu(classMenu, classBtn);
  }
  function toggleMaster() {
    if (masterMenu.classList.contains('is-open')) closeMaster();
    else openMaster();
  }
  function toggleClass() {
    if (classMenu.classList.contains('is-open')) closeClass();
    else openClass();
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
      // 2026-05-28 legacy-isolation: nav-hub-menu is DELETED from V2 shell.
      // "Old prototypes" now opens the frozen V01 snapshot at
      // _legacy/index.html in a new tab — keeps legacy reachable for
      // reference checking without contaminating the V2 foundation.
      // See AUDIT/2026-05-28-legacy-isolation-locked.md.
      try {
        window.open('_legacy/index.html', '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('app-pill old-prototypes window.open failed', e);
      }
      closeMaster();
      return;
    }
    const id = btn.getAttribute('data-master');
    const mv = MASTER_VIEWS.find(x => x.id === id);
    if (!mv) return;
    closeMaster();
    // Phase TL-2 Step 2 — route by master-view contract:
    //   1. setView(mv.target) if STATE.view isn't already there
    //   2. if mv carries a `layout`, also call _forge.setLayout()
    //      so FORGE/TIMELINE swap inside the Forge engine without
    //      a teardown-remount cycle (preserves locks, color theme,
    //      tier toggles, side panel state)
    const curView = (window.STATE && window.STATE.view) || null;
    const needsViewSwitch = (curView !== mv.target);
    if (needsViewSwitch && typeof window.setView === 'function') {
      try { window.setView(mv.target); } catch (e) { console.warn('app-pill setView failed', e); }
    }
    if (mv.layout && mv.target === 'forge') {
      // Defer one tick so setView (if it ran) has time to mount + install
      // the _forge public API. If we were already in forge, this fires
      // immediately and just flips the layout.
      setTimeout(() => {
        if (window._forge && typeof window._forge.setLayout === 'function') {
          try { window._forge.setLayout(mv.layout); }
          catch (e) { console.warn('app-pill setLayout failed', e); }
        }
        // Phase 22-G (2026-05-24) — directly sync the pill label
        // after setLayout. The codex:layout-changed event should
        // also trigger syncPillLabel, but a missed fire (early
        // listener install / cached script) would leave the label
        // stale on FORGE while the layout flipped to TIMELINE.
        // Direct call is belt-and-braces.
        syncPillLabel();
      }, needsViewSwitch ? 50 : 0);
    } else {
      // Phase 22-G — also sync for non-forge master switches.
      syncPillLabel();
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

  // Reposition open menus on resize — the pill is fixed at top:14
  // left:62 (browser-relative), so resize is the only reflow that
  // can move it; same pattern the legacy wireModeDropdown used.
  window.addEventListener('resize', () => {
    if (masterMenu.classList.contains('is-open')) positionMenu(masterMenu, masterBtn);
    if (classMenu && classMenu.classList.contains('is-open')) positionMenu(classMenu, classBtn);
  });

  // ── KEYBOARD NAV (Phase 22-E) ──────────────────────────────
  // When a dropdown is open: ↑/↓ cycle through items, Enter activates
  // the focused item, Tab closes (cooperate with browser focus
  // model). Escape already handled above. Mirrors the nav-hub-menu
  // pattern when we add it there in a future iteration.
  function activeMenu() {
    if (masterMenu.classList.contains('is-open')) return masterMenu;
    if (classMenu && classMenu.classList.contains('is-open')) return classMenu;
    return null;
  }
  function menuItems(menu) {
    return Array.from(menu.querySelectorAll('button[role="menuitem"], button[data-master], button[data-class]'));
  }
  function focusMenuItem(menu, idx) {
    const items = menuItems(menu);
    if (!items.length) return;
    const i = ((idx % items.length) + items.length) % items.length;
    items.forEach(b => b.classList.toggle('is-focused', false));
    items[i].classList.add('is-focused');
    items[i].focus({ preventScroll: true });
  }
  function currentMenuIndex(menu) {
    const items = menuItems(menu);
    const cur = items.findIndex(b => b === document.activeElement || b.classList.contains('is-focused'));
    return cur < 0 ? -1 : cur;
  }
  document.addEventListener('keydown', (ev) => {
    const menu = activeMenu();
    if (!menu) return;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      const i = currentMenuIndex(menu);
      focusMenuItem(menu, i + 1);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      const i = currentMenuIndex(menu);
      focusMenuItem(menu, i < 0 ? menuItems(menu).length - 1 : i - 1);
    } else if (ev.key === 'Enter' && document.activeElement && menu.contains(document.activeElement)) {
      ev.preventDefault();
      document.activeElement.click();
    } else if (ev.key === 'Tab') {
      // Tab closes — let the browser proceed to next focusable.
      closeMaster();
      closeClass();
    }
  });

  // ── SMOKE-TEST DEBUG HELPER (Phase 22-E) ───────────────────
  // window._pillSmoke() cycles through all master views in sequence
  // with a delay between switches, then resets to Forge. Useful for
  // verifying the pill drives every view cleanly. Run from console
  // when validating after Forge mounts.
  // Phase 22-Y (2026-05-24) — guard the assignment. Without this
  // line, `window._appPill.smoke = ...` throws because _appPill
  // was never initialized → the WHOLE script crashes here and the
  // class-button click handler (line 397) never gets attached →
  // clicking Deities does nothing. Bug confirmed by John's console
  // screenshot 2026-05-24: TypeError exactly at this point.
  window._appPill = window._appPill || {};
  window._appPill.smoke = function (delay) {
    delay = delay || 1200;
    const list = MASTER_VIEWS.slice();
    let i = 0;
    function step() {
      if (i >= list.length) {
        console.info('[pill-smoke] complete — returning to FORGE');
        if (typeof window.setView === 'function') window.setView('forge');
        return;
      }
      const mv = list[i++];
      console.info('[pill-smoke] →', mv.label, '(' + mv.target + ')');
      if (typeof window.setView === 'function') window.setView(mv.target);
      setTimeout(step, delay);
    }
    step();
  };

  // ── CLASS BUTTON CLICK HANDLERS ────────────────────────────
  if (classBtn) {
    classBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      toggleClass();
    });
  }
  if (classMenu) {
    classMenu.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button[data-class]');
      if (!btn) return;
      ev.stopPropagation();
      const cls = btn.getAttribute('data-class');
      const api = currentClassApi();
      if (!api) { closeClass(); return; }
      closeClass();
      try { api.setClassFilter(cls); } catch (e) {
        console.warn('app-pill setClassFilter failed', e);
      }
      // syncClassPill will fire via codex:class-changed listener
      // (Forge emits it from syncModeButtonLabel after rebuild).
    });
  }

  // ── REACT TO VIEW + CLASS CHANGES ──────────────────────────
  document.addEventListener('codex:view-changed', () => {
    syncPillLabel();
    // A small delay so the new view has time to mount + install
    // its _<view>.setClassFilter API surface before we read it.
    setTimeout(syncClassPill, 0);
  });
  document.addEventListener('codex:class-changed', syncClassPill);
  // Phase TL-2 Step 2 — when the Forge engine swaps layouts (wheel
  // ↔ timeline), update the pill's master-view label without a
  // setView round-trip.
  document.addEventListener('codex:layout-changed', syncPillLabel);
  // Initial paint — STATE.view may already be set from URL.
  syncPillLabel();
  // Class label needs Forge to be mounted first; small defer so
  // window._forge exists before we read from it.
  setTimeout(syncClassPill, 0);

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
