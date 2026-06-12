// ============================================================
// CODEX ATLAS — MAP V2 VIEW (skeleton)
// ============================================================
//
// Filed 2026-05-28 per the legacy-isolation lock
// (AUDIT/2026-05-28-legacy-isolation-locked.md).
//
// Mirror of `src/js/views/boards.js` — empty V2 skeleton that proves
// the MAP master-pill slot routes to a NEW canonical surface (NOT
// the legacy MapLibre VIEWS.atlas view, which inherited the V01
// chrome). The actual world-map implementation is a future step;
// for now this is a clean dark stage with the radial gradient, ready
// to build into.
//
// The legacy MapLibre map (VIEWS.atlas) remains reachable via the
// V01 prototype snapshot at `_legacy/index.html` for reference.
//
// Boundary contract (public API):
//   window._mapsView = { render(pane), unmount() }
//
// VIEWS.maps in src/js/app.js delegates to render(pane).
// ============================================================
(function () {
  'use strict';

  let _pane = null;

  function render(pane) {
    if (!pane) return;
    _pane = pane;
    pane.classList.add('maps-pane');
    // 2026-06-13 — construction note (John: "feel free to add — it's
    // self-explanatory"). A dead-silent black pane reads as broken.
    // Deleted with the skeleton when the real Map build lands.
    pane.innerHTML = [
      '<div class="maps-shell" id="maps-shell">',
      '  <div class="maps-stage" id="maps-stage">',
      '    <div class="construction-note">',
      '      <div class="construction-glyph">\u2316</div>',
      '      <div class="construction-title">MAP</div>',
      '      <div class="construction-sub">Under construction \u2014 cross-tradition geography lands here.</div>',
      '    </div>',
      '  </div>',
      '</div>',
    ].join('\n');
  }

  function unmount() { _pane = null; }

  window._mapsView = { render: render, unmount: unmount };
})();
