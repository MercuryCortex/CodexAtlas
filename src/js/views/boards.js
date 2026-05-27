// ============================================================
// CODEX ATLAS — BOARDS V2 VIEW (skeleton, step 2 of 10)
// ============================================================
//
// Filed: 2026-05-27 per AUDIT/2026-05-28-boards-v2-new-ux-spec.md (LOCKED).
//
// Step 2 of 10 — SKELETON only. This file establishes the .boards-pane
// shell (stage + bottombar) and the public mount API. No interactions,
// no cards, no LS, no Investigation Library yet. The point is to prove:
//
//   1. ⚗ BOARD on the master pill routes to a NEW empty surface,
//      distinct from the legacy transmutation board.
//   2. The DOM shell matches the spec's canonical structure so the
//      subsequent steps (3 = pan/zoom/drag, 4 = contextual pill, 5 =
//      Investigation Library, 6 = auto-edges, 7 = right-click menu,
//      8 = side-panel/reader wire, 9 = marquee, 10 = LS + cutover)
//      can each land as one focused commit.
//
// Boundary contract (public API):
//   window._boardsView = { render(pane), unmount() }
//
// VIEWS.boards in src/js/app.js delegates to render(pane).
// On view-swap-out, app.js removes the .boards-pane element entirely;
// unmount() is for callers who want to clean up persistent state
// (none yet in V1 skeleton).
// ============================================================
(function () {
  'use strict';

  // The single mounted pane reference, so subsequent steps can find
  // their root without re-querying.
  let _pane = null;

  function render(pane) {
    if (!pane) return;
    _pane = pane;
    pane.classList.add('boards-pane');
    // 2026-05-27 — clean skeleton, NO legacy aesthetic. Just an empty
    // stage. The previous skeleton had a centered alchemy glyph + BOARDS
    // title + legacy-style bottombar with zoom%/LEGEND/search — that was
    // copying the prototype V01 visual language, which is precisely
    // what V2 exists to replace. The actual chrome the user will use
    // is the contextual app-pill (step 4) at the top of the screen,
    // matching the Codex pill pattern. The stage is just the surface
    // cards will live on — empty when no board is loaded.
    pane.innerHTML = [
      '<div class="boards-shell" id="boards-shell">',
      '  <div class="boards-stage" id="boards-stage"></div>',
      '</div>',
    ].join('\n');
  }

  function unmount() {
    _pane = null;
    // Body class cleanup will be wired in step 4 (contextual pill
    // visibility); skeleton has nothing to tear down.
  }

  window._boardsView = {
    render: render,
    unmount: unmount,
  };
})();
