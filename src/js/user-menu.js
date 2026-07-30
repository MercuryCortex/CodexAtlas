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
        { id: 'signin',  glyph: '↦', label: 'Sign in',  hint: '(email link)', action: 'signin'  },
      ],
    },
    {
      label: 'Atlas',
      items: [
        { id: 'welcome',   glyph: '✦', label: 'Welcome',  hint: '(the threshold)', action: 'welcome' },
        { id: 'statement', glyph: '§', label: 'Atlas Statement',           action: 'statement' },
        { id: 'shop',      glyph: '⛀', label: 'Codex Shop',  hint: '(soon)', action: null      },
      ],
    },
    {
      label: 'Project',
      items: [
        { id: 'about',    glyph: 'ⓘ',  label: 'About',                action: 'about'    },
      ],
    },
    // The Dev → Overview item moved 2026-07-30 into the ONE DEV door
    // (the forge bottom bar's DEV launcher, src/js/forge/dev-drawer.js)
    // — one home for dev, per AUDIT/2026-07-29-fable-dev-drawer-and-
    // tree-labels.md §3.2 step 4. The ✦ drawer stays canonical-only.
  ];

  // ── FOLIO IDENTITY (surface 05, 2026-07-16) ─────────────────
  // The drawer opens with the tester's own mark: illuminated-initial
  // avatar in a gold ring + Folio display name (serif) + a mono
  // "View folio ↦" link. The whole strip is ONE button with
  // data-action="folio", so the existing click router opens the
  // Folio (window._folio.open) — avatar, name and link all work.
  // Name is read live from LS on every open (buildMenu runs on
  // open), so a rename in the Folio pane shows up immediately.
  const FOLIO_LS_KEY = 'codex-atlas/folio-v1';
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
  function readFolioName() {
    try {
      const p = JSON.parse(localStorage.getItem(FOLIO_LS_KEY) || 'null');
      if (p && typeof p.name === 'string' && p.name.trim()) {
        return p.name.trim().slice(0, 40);   // same 40-char cap as folio.js
      }
    } catch (e) { /* corrupted LS → default */ }
    return 'Seeker';   // folio.js default display name
  }

  // ── BUILD ────────────────────────────────────────────────────
  function buildMenu() {
    const html = [];
    const folioName = readFolioName();
    html.push('<button class="user-menu-identity" type="button" data-action="folio" title="Open your Folio">');
    // Avatar = the chosen Folio badge behind a frosted-glass disc + the initial
    // (glass makes the letter readable over the busy badge).
    var badgeHtml = '';
    try { if (window._folio && window._folio.badgeSvg) badgeHtml = window._folio.badgeSvg(window._folio.badgeIndex(), false); } catch (e) {}
    html.push(  '<span class="user-menu-identity-avatar">');
    html.push(    '<span class="uma-badge">' + badgeHtml + '</span>');
    html.push(    '<span class="uma-letter">' + escapeHtml(folioName.charAt(0).toUpperCase()) + '</span>');
    html.push(  '</span>');
    html.push(  '<span class="user-menu-identity-text">');
    html.push(    '<span class="user-menu-identity-name">' + escapeHtml(folioName) + '</span>');
    html.push(    '<span class="user-menu-identity-link">View folio ↦</span>');
    html.push(  '</span>');
    html.push('</button>');
    html.push('<div class="user-menu-divider"></div>');
    html.push('<div class="user-menu-header">');
    html.push(  '<span class="user-menu-brand-glyph">✦</span>');
    html.push(  '<span class="user-menu-brand-text">Codex Atlas</span>');
    html.push('</div>');
    SECTIONS.forEach((sec, si) => {
      if (si > 0) html.push('<div class="user-menu-divider"></div>');
      html.push('<div class="user-menu-section">');
      html.push(  '<div class="user-menu-section-label">' + sec.label + '</div>');
      sec.items.forEach(rawItem => {
        // Auth-aware: the "Sign in" slot becomes "Sign out (email)" when signed in.
        let item = rawItem;
        if (rawItem.id === 'signin' && window._auth && window._auth.isSignedIn && window._auth.isSignedIn()) {
          const u = (window._auth.getUser && window._auth.getUser()) || {};
          item = { id: 'signout', glyph: '↤', label: 'Sign out',
                   hint: u.email ? '(' + escapeHtml(u.email) + ')' : '', action: 'signout' };
        }
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
        // Phase B (2026-07-17): the real magic-link modal.
        if (window._signin && window._signin.open) window._signin.open();
        else console.warn('user-menu: _signin not loaded');
        break;
      case 'signout':
        if (window._auth && window._auth.signOut) window._auth.signOut();
        break;
      case 'folio':
        if (window._folio && typeof window._folio.open === 'function') {
          window._folio.open();
        } else {
          console.warn('user-menu: _folio not loaded');
        }
        break;
      case 'welcome':
        if (window._threshold && typeof window._threshold.open === 'function') {
          window._threshold.open();
        } else {
          console.warn('user-menu: _threshold not loaded');
        }
        break;
      case 'statement':
        alert('Atlas Statement — coming soon.\n\nThe cross-tradition investigation premise lives in the project README + AUDIT folder for now. A polished public-facing statement page is on the roadmap.');
        break;
      case 'about':
        alert('Codex Atlas — cross-tradition investigation vault.\n\n4746 nodes · 21,757 edges across every religious tradition that has left a documentary trace. Built ground-up as an investigation tool for spotting the connections between traditions.');
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
