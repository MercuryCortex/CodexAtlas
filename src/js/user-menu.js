// ============================================================
// CODEX ATLAS — ✦ USER MENU (account drawer) · V2-native
// ============================================================
// Filed 2026-05-28 per the legacy-isolation lock
// (AUDIT/2026-05-28-legacy-isolation-locked.md).
//
// The legacy `#nav-hub-trigger` + `#nav-hub-menu` were deleted with
// the rest of the V01 chrome. They wore two hats — the V01 chrome
// hat (mirror of the legacy `<nav class="side">`'s 32 view links)
// AND the V2 user-drawer hat (Account · Atlas Statement · Codex
// Shop · About). The view-switcher half belongs to the app-pill
// now; this module rebuilds the user-drawer half V2-native.
//
// Self-installing IIFE. Exposes nothing on window (no public API).
// Built to mirror the app-pill open/close + click-outside + Escape
// + reposition-on-resize patterns so future hooks stay consistent.
// ============================================================

(function () {
  'use strict';

  const trigger = document.getElementById('user-menu-trigger');
  const menu    = document.getElementById('user-menu');
  if (!trigger || !menu) return;

  // ── MENU CONTENT ────────────────────────────────────────────
  // Sections + items. `action` is dispatched to the click handler
  // below; null actions render disabled "soon" items. New items
  // can be added here without touching the build/event code.
  const SECTIONS = [
    {
      label: 'Account',
      items: [
        { id: 'signin',  glyph: '↦', label: 'Sign in',  hint: '(stub · SaaS pivot WIP)', action: 'signin'  },
        { id: 'signup',  glyph: '＋', label: 'Sign up',  hint: '(stub · SaaS pivot WIP)', action: 'signup'  },
      ],
    },
    {
      label: 'Atlas',
      items: [
        { id: 'statement', glyph: '§', label: 'Atlas Statement',           action: 'statement' },
        { id: 'shop',      glyph: '⛀', label: 'Codex Shop',  hint: '(soon)', action: null      },
      ],
    },
    {
      label: 'Project',
      items: [
        { id: 'about',    glyph: 'ⓘ',  label: 'About',                action: 'about'    },
        { id: 'legacy',   glyph: '🗄', label: 'V01 prototype',        hint: '(reference · new tab)', action: 'legacy' },
      ],
    },
    {
      // Operator-facing tools — visible pre-SaaS per existing
      // dev-panel.js precedent. Will gate behind auth at SaaS launch.
      label: 'Dev',
      items: [
        { id: 'overview', glyph: '⚙',  label: 'Overview',  hint: '(vault coverage)', action: 'overview' },
      ],
    },
  ];

  // ── BUILD ────────────────────────────────────────────────────
  function buildMenu() {
    const html = [];
    html.push('<div class="user-menu-header">');
    html.push(  '<span class="user-menu-brand-glyph">✦</span>');
    html.push(  '<span class="user-menu-brand-text">Codex Atlas</span>');
    html.push('</div>');
    SECTIONS.forEach((sec, si) => {
      if (si > 0) html.push('<div class="user-menu-divider"></div>');
      html.push('<div class="user-menu-section">');
      html.push(  '<div class="user-menu-section-label">' + sec.label + '</div>');
      sec.items.forEach(item => {
        const disabled = !item.action;
        html.push(
          '<button class="user-menu-item' + (disabled ? ' is-disabled' : '') + '"'
          + ' role="menuitem" type="button"'
          + ' data-action="' + (item.action || '') + '"'
          + (disabled ? ' aria-disabled="true" tabindex="-1"' : '')
          + '>'
          +   '<span class="user-menu-item-glyph">' + item.glyph + '</span>'
          +   '<span class="user-menu-item-label">' + item.label + '</span>'
          +   (item.hint ? '<span class="user-menu-item-hint">' + item.hint + '</span>' : '')
          + '</button>'
        );
      });
      html.push('</div>');
    });
    menu.innerHTML = html.join('');
  }

  // ── POSITION (matches app-pill pattern) ─────────────────────
  function positionMenu() {
    const r = trigger.getBoundingClientRect();
    const top  = Math.round(r.bottom + 6);
    let left   = Math.round(r.left);
    const menuW = menu.offsetWidth || 260;
    const margin = 8;
    if (left + menuW + margin > window.innerWidth) left = window.innerWidth - menuW - margin;
    if (left < margin) left = margin;
    menu.style.top  = top + 'px';
    menu.style.left = left + 'px';
  }

  // ── OPEN / CLOSE ────────────────────────────────────────────
  function open() {
    buildMenu();
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    positionMenu();
  }
  function close() {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
  }
  function toggle() {
    if (menu.classList.contains('is-open')) close(); else open();
  }

  // ── EVENT WIRING ────────────────────────────────────────────
  trigger.addEventListener('click', (ev) => {
    ev.stopPropagation();
    toggle();
  });

  menu.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-action]');
    if (!btn) return;
    ev.stopPropagation();
    const action = btn.getAttribute('data-action');
    if (!action) return;   // disabled / "soon" stub
    routeAction(action);
    close();
  });

  function routeAction(action) {
    switch (action) {
      case 'legacy':
        try { window.open('_legacy/index.html', '_blank', 'noopener,noreferrer'); }
        catch (e) { console.warn('user-menu legacy open failed', e); }
        break;
      case 'signin':
      case 'signup':
        // Premium SaaS pivot WIP — see memory `project_premium_saas_shift`.
        // For now, surface a clear stub message so the slot is honest
        // rather than silently swallowing the click.
        alert('Sign in / Sign up — coming with the SaaS launch.\n\nCodex Atlas is in active development; account features ship with the premium viewer rollout.');
        break;
      case 'statement':
        alert('Atlas Statement — coming soon.\n\nThe cross-tradition investigation premise lives in the project README + AUDIT folder for now. A polished public-facing statement page is on the roadmap.');
        break;
      case 'about':
        alert('Codex Atlas — cross-tradition investigation vault.\n\n4746 nodes · 21,757 edges across every religious tradition that has left a documentary trace. Built ground-up as an investigation tool for spotting the connections between traditions.');
        break;
      case 'overview':
        if (window._devOverview && typeof window._devOverview.open === 'function') {
          window._devOverview.open();
        } else {
          console.warn('user-menu: _devOverview not loaded');
          alert('Dev Overview module not available — check that src/js/views/dev-overview.js loaded.');
        }
        break;
      default:
        console.warn('user-menu unknown action', action);
    }
  }

  // Click outside → close (same pattern as app-pill).
  document.addEventListener('click', (ev) => {
    if (!menu.classList.contains('is-open')) return;
    if (trigger.contains(ev.target) || menu.contains(ev.target)) return;
    close();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') close();
  });
  window.addEventListener('resize', () => {
    if (menu.classList.contains('is-open')) positionMenu();
  });
})();
