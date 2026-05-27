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
    pane.innerHTML = [
      '<div class="maps-shell" id="maps-shell">',
      '  <div class="maps-stage" id="maps-stage"></div>',
      '</div>',
    ].join('\n');
  }

  function unmount() { _pane = null; }

  window._mapsView = { render: render, unmount: unmount };
})();
