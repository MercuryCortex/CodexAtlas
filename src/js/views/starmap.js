// ============================================================
// CODEX ATLAS — STAR MAP V2 VIEW (skeleton)
// ============================================================
//
// Filed 2026-05-28 per the legacy-isolation lock
// (AUDIT/2026-05-28-legacy-isolation-locked.md).
//
// Mirror of `src/js/views/maps.js` — empty V2 skeleton for the STAR
// MAP master-pill slot. The legacy astrology stack (VIEWS.astrology
// with its 4 modes: spine / decanic / wheel / now) is too tied to
// the V01 chrome to land here directly; the V2 star-map will be a
// dedicated WebGPU constellation/decan view in a future build.
//
// The legacy 4-mode astrology tab remains reachable via the V01
// prototype snapshot at `_legacy/index.html` for reference.
//
// Boundary contract (public API):
//   window._starmapView = { render(pane), unmount() }
//
// VIEWS.starmap in src/js/app.js delegates to render(pane).
// ============================================================
(function () {
  'use strict';

  let _pane = null;

  function render(pane) {
    if (!pane) return;
    _pane = pane;
    pane.classList.add('starmap-pane');
    pane.innerHTML = [
      '<div class="starmap-shell" id="starmap-shell">',
      '  <div class="starmap-stage" id="starmap-stage"></div>',
      '</div>',
    ].join('\n');
  }

  function unmount() { _pane = null; }

  window._starmapView = { render: render, unmount: unmount };
})();
