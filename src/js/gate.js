// ============================================================
// CODEX ATLAS — ✦ ALPHA GATE (sign-in wall)
// ============================================================
// Filed 2026-07-17. For the closed alpha: on a real host the whole app is
// blocked behind the "Enter the Codex" sign-in box until the visitor is
// signed in (allow-listed). LOCALHOST STAYS OPEN so John's dev isn't gated.
//
// Overrides:
//   · localhost / 127.0.0.1        → gate OFF (dev)
//   · ?gate=1 in the URL           → force gate ON (test it locally)
//   · localStorage 'codex-atlas/gate' = 'off'  → gate OFF (escape hatch)
//
// NOTE: this is a UI/app-level gate (keeps casual visitors out + cloud data
// is RLS-protected). It is not a cryptographic wall over the static files —
// a true host-level wall (Cloudflare Access) can be layered later if wanted.
//
// Loads LAST (after auth.js + signin.js). No public API.
// ============================================================

(function () {
  'use strict';

  var GATE = (function () {
    try {
      if (localStorage.getItem('codex-atlas/gate') === 'off') return false;
      if (/[?&]gate=1/.test(location.search)) return true;
      var h = location.hostname;
      return !(h === 'localhost' || h === '127.0.0.1' || h === '' || h === '::1');
    } catch (_) { return false; }
  })();

  if (!GATE) return;

  document.body.classList.add('alpha-gated');

  function signedIn() { return !!(window._auth && window._auth.isSignedIn && window._auth.isSignedIn()); }

  function enforce() {
    if (signedIn()) {
      document.body.classList.remove('alpha-gated');
      if (window._signin && window._signin.close) window._signin.close();
    } else {
      document.body.classList.add('alpha-gated');
      if (window._threshold && window._threshold.close) window._threshold.close(); // no threshold before the door
      if (window._signin && window._signin.open) window._signin.open({ gate: true });
    }
  }

  document.addEventListener('codex:auth-changed', enforce);
  if (window._auth && window._auth.ready) window._auth.ready().then(enforce);
  else if (document.readyState !== 'loading') enforce();
  else document.addEventListener('DOMContentLoaded', enforce);
})();
