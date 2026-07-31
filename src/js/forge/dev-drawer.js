// ============================================================
// CODEX ATLAS — THE DEV DRAWER (one dev door)
// ============================================================
//
// 2026-07-30 — §3 of AUDIT/2026-07-29-fable-dev-drawer-and-tree-
// labels.md, built to the design/dev-drawer.html contract. Six
// bottom-bar cells had accumulated; four were workshop tools.
// Now: ONE `DEV` button + a drop-up launcher of six rows —
// NODE LAB / HOUSE / FX / STYLE / STATS / OVERVIEW. LEGEND · VIEW ·
// ✦ FOLIO stay canonical on the bar (John's ruling, twice over).
// (HOUSE joined 2026-07-31 — the family-isolate dials had grown
// into four sections of the Node Lab and John could not find them.)
//
// THE CONTRACT (every rule clickable in the mockup):
//   1. One editor at a time — LAB, HOUSE, FX, STYLE share the fixed
//      top-right slot (the LAB's spot); opening one closes the
//      others.
//   2. STATS is exempt — a read-only HUD may sit open (or pinned)
//      beside an editor; watching fps while dragging a LAB slider
//      is the point.
//   3. OVERVIEW is a full surface; opening it closes the launcher.
//   4. The launcher is a cockpit remote — it stays open while rows
//      flip panels; click-outside / Esc close the launcher ONLY,
//      never an open panel.
//   5. Panels persist until their × (the LAB idiom). Esc walks it
//      back one step: overview → launcher → open editor; STATS
//      last, via debug-stats' own untouched handler.
//
// HOW IT OWNS WITHOUT TOUCHING: the launcher rows ADOPT the old
// trigger ids (forge-labpanel-btn / forge-fxpanel-btn /
// forge-stylepanel-btn / forge-debug-btn), so lab-panel.js and
// debug-stats.js (zero edits, per the spec's own promise) and the
// lightly-edited fx-panel.js / style-panel.js bind to the rows
// and never notice the move. This module only ORCHESTRATES:
// single-open, the row dots + the DEV gold dot, the Esc cascade.
// Open-state is read from each module's own public contract
// (.is-open / aria-hidden / display) — no second source of truth.
//
// EVENT CHOREOGRAPHY (why capture + bubble on the drawer):
//   · capture on the drawer runs BEFORE a row's own module toggle
//     (capture at an ancestor always precedes target listeners),
//     so the other editors close first — never stopPropagation
//     here, the module's toggle IS the open path;
//   · bubble on the drawer stops propagation so a row click never
//     reaches the document handlers — the launcher stays open
//     (cockpit remote) and an open STATS isn't outside-closed by
//     flipping another row (fx/style already stop their own).
//   · dot-sync is deferred a tick so it reads state AFTER the
//     module toggles ran.
//
// Document-level listeners install ONCE per page (module scope)
// and read the live mount via `cur` — forge re-mounts rebuild the
// bottombar, and per-attach doc listeners would stack into a
// double-step Esc cascade otherwise.
//
// BOUNDARY CONTRACT:
//   window._forgeDevDrawer.attach({ local })
//
// No new LS keys. No open-panel persistence across reloads (dev
// never greets a user). `?lab` boot force-open stays untouched in
// forge.js wireLabPanel.
// ============================================================
(function () {
  'use strict';

  let cur = null;            // { btn, drawer, rows, statsX } of the live mount
  let docInstalled = false;
  let syncTimer = 0;

  // ── state probes — the module's classes/attrs ARE its contract ──
  function labPanel()   { return document.getElementById('forge-lab-panel'); }
  function housePanel() { return document.getElementById('forge-house-panel'); }
  function statsPanel() { return document.getElementById('forge-debug-panel'); }

  function closeAriaPanel(panelId, btnId) {
    const p = document.getElementById(panelId);
    if (p) { p.classList.remove('is-open'); p.setAttribute('aria-hidden', 'true'); }
    const b = document.getElementById(btnId);
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  const EDITORS = {
    lab: {
      isOpen() { const p = labPanel(); return !!p && p.style.display !== 'none'; },
      close() {
        const p = labPanel();
        if (p) p.style.display = 'none';
        const b = document.getElementById('forge-labpanel-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      },
    },
    fx: {
      isOpen() { const p = document.getElementById('forge-fxpanel'); return !!p && p.classList.contains('is-open'); },
      close()  { closeAriaPanel('forge-fxpanel', 'forge-fxpanel-btn'); },
    },
    style: {
      isOpen() { const p = document.getElementById('forge-stylepanel'); return !!p && p.classList.contains('is-open'); },
      close()  { closeAriaPanel('forge-stylepanel', 'forge-stylepanel-btn'); },
    },
    // THE SIXTH DOOR (2026-07-31) — the house got its own panel out of
    // the Node Lab's eleven sections ("is SUPER CLUTTED"). Same display
    // idiom as the LAB, so the one-editor-at-a-time law covers it for
    // free: opening HOUSE closes LAB / FX / STYLE, and vice versa.
    house: {
      isOpen() { const p = housePanel(); return !!p && p.style.display !== 'none'; },
      close() {
        const p = housePanel();
        if (p) p.style.display = 'none';
        const b = document.getElementById('forge-housepanel-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      },
    },
  };
  const EDITOR_KEYS = ['lab', 'house', 'fx', 'style'];

  function statsOpen() {
    // Popover open OR the pinned perf HUD present — both are visible
    // dev chrome; the DEV dot's whole job is that a stray surface is
    // always traceable to the bar.
    const p = statsPanel();
    return !!((p && p.classList.contains('is-open')) || document.getElementById('forge-hud-banner'));
  }
  function overviewOpen() {
    return !!(window._devOverview && window._devOverview.isOpen && window._devOverview.isOpen());
  }
  function launcherOpen() { return !!(cur && cur.drawer.classList.contains('is-open')); }
  function setLauncher(open) {
    if (!cur) return;
    cur.drawer.classList.toggle('is-open', open);
    cur.drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    cur.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  // ── dots + the STATS × berth ─────────────────────────────────
  function sync() {
    if (!cur) return;
    // Derived from EDITOR_KEYS, not a hand-kept list — a sixth editor
    // added to EDITORS lights its dot without a second edit here.
    const open = { stats: statsOpen(), overview: overviewOpen() };
    for (const k of EDITOR_KEYS) open[k] = EDITORS[k].isOpen();
    for (const r of cur.rows) {
      r.classList.toggle('is-open', !!open[r.getAttribute('data-dev-panel')]);
    }
    cur.btn.classList.toggle('has-open', Object.keys(open).some((k) => open[k]));
    // The stats popover is untouchable (zero edits in debug-stats.js)
    // and re-renders its innerHTML every 250ms, so a child × would be
    // wiped. Its × is a fixed SIBLING placed over the header strip
    // that .forge-debug-panel.is-open's padding-top reserves.
    const p = statsPanel();
    const popoverOpen = !!(p && p.classList.contains('is-open'));
    if (popoverOpen) {
      const r = p.getBoundingClientRect();
      cur.statsX.style.display = 'block';
      cur.statsX.style.top = Math.round(r.top + 6) + 'px';
      cur.statsX.style.left = Math.round(r.right - 28) + 'px';
    } else {
      cur.statsX.style.display = 'none';
    }
  }
  function scheduleSync() {
    if (syncTimer) return;
    syncTimer = setTimeout(() => { syncTimer = 0; sync(); }, 0);
  }

  // ── document listeners — installed once, read `cur` ──────────
  function installDocListeners() {
    if (docInstalled) return;
    docInstalled = true;

    // Click-outside closes the LAUNCHER only — never a panel. Also
    // the global dot refresh: any click may have flipped a dev
    // surface (a panel ×, the stats outside-close, the LAB Reset).
    document.addEventListener('click', (ev) => {
      if (cur && launcherOpen()
          && !cur.drawer.contains(ev.target) && !cur.btn.contains(ev.target)) {
        setLauncher(false);
      }
      scheduleSync();
    });

    // Esc walks it back: overview → launcher → open editor. Capture
    // phase so one step consumes the key before the modules' own
    // document-level Esc handlers (debug-stats keeps its own — STATS
    // closes last, once nothing above it consumed the press).
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape' || !cur) return;
      // Esc inside a text field OUTSIDE the dev surfaces belongs to
      // that field (the search box clears itself) — don't steal it.
      const t = ev.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        const inDev = cur.drawer.contains(t)
          || ['forge-fxpanel', 'forge-stylepanel', 'forge-lab-panel', 'forge-house-panel'].some((id) => {
            const p = document.getElementById(id);
            return !!(p && p.contains(t));
          });
        if (!inDev) { scheduleSync(); return; }
      }
      const consume = () => {
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        scheduleSync();
      };
      if (overviewOpen()) {
        try { window._devOverview.close(); } catch (_) { /* never break the map */ }
        consume(); return;
      }
      if (launcherOpen()) { setLauncher(false); consume(); return; }
      for (const k of EDITOR_KEYS) {
        if (EDITORS[k].isOpen()) { EDITORS[k].close(); consume(); return; }
      }
      scheduleSync();   // stats closes itself — refresh the dots after
    }, true);

    window.addEventListener('resize', scheduleSync);
  }

  function attach({ local }) {
    const btn    = document.getElementById('forge-devdrawer-btn');
    const drawer = document.getElementById('forge-devdrawer');
    if (!btn || !drawer) return;
    const rows = Array.from(drawer.querySelectorAll('.forge-devdrawer-row'));

    // The stats × — remount hygiene first (same move as lab-panel.js).
    const staleX = document.getElementById('forge-devdrawer-stats-x');
    if (staleX) staleX.remove();
    const statsX = document.createElement('button');
    statsX.id = 'forge-devdrawer-stats-x';
    statsX.className = 'forge-devpanel-x forge-devpanel-x--stats';
    statsX.type = 'button';
    statsX.title = 'close';
    statsX.textContent = '×';
    statsX.style.display = 'none';
    document.body.appendChild(statsX);
    statsX.addEventListener('click', () => {
      // Proxy the module's own toggle — it clears its 250ms timer.
      const b = document.getElementById('forge-debug-btn');
      const p = statsPanel();
      if (b && p && p.classList.contains('is-open')) b.click();
      scheduleSync();
    });

    cur = { btn, drawer, rows, statsX };

    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      setLauncher(!launcherOpen());
      scheduleSync();
    });

    // CAPTURE — one editor at a time, enforced BEFORE the row's own
    // module toggle runs. Overview (no legacy module) is fully
    // handled here.
    drawer.addEventListener('click', (ev) => {
      const row = ev.target && ev.target.closest
        ? ev.target.closest('.forge-devdrawer-row') : null;
      if (!row) return;
      const kind = row.getAttribute('data-dev-panel');
      if (EDITORS[kind]) {
        for (const k of EDITOR_KEYS) {
          if (k !== kind && EDITORS[k].isOpen()) EDITORS[k].close();
        }
      } else if (kind === 'overview') {
        try {
          if (overviewOpen()) window._devOverview.close();
          else if (window._devOverview && window._devOverview.open) window._devOverview.open();
        } catch (_) { /* overview is a dev tool — never break the map */ }
        setLauncher(false);   // a full surface replaces the cockpit
      }
      scheduleSync();
    }, true);

    // BUBBLE — see the choreography note in the header.
    drawer.addEventListener('click', (ev) => { ev.stopPropagation(); });

    installDocListeners();
    sync();   // ?lab boot / pinned HUD from LS → dots honest at attach
  }

  window._forgeDevDrawer = { attach };
})();
