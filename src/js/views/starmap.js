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
    // 2026-06-13 — construction note; the design for this Section
    // (sky \u00d7 timeline, scrubbable) is at
    // AUDIT/2026-06-13-starmap-design.md. Deleted when the build lands.
    pane.innerHTML = [
      '<div class="starmap-shell" id="starmap-shell">',
      '  <div class="starmap-stage" id="starmap-stage">',
      '    <div class="construction-note">',
      '      <div class="construction-glyph">\u2644</div>',
      '      <div class="construction-title">STAR MAP</div>',
      '      <div class="construction-sub">Under construction \u2014 the night sky crossed with the timeline: scrub through the eras and watch the heavens move. In design.</div>',
      '    </div>',
      '  </div>',
      '</div>',
    ].join('\n');
  }

  function unmount() { _pane = null; }

  window._starmapView = { render: render, unmount: unmount };
})();
