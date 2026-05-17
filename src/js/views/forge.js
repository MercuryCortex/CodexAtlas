// ============================================================
// CODEX ATLAS — FORGE VIEW (Phase 0 scaffold)
// ============================================================
// Forge is the isolated parallel build of the proprietary
// WebGPU rendering engine that will eventually replace
// Pantheon V2. Same isolation pattern V2 used: own pane,
// own state, zero shared mutable state with the rest of the
// app. Read-only access to `window.VAULT_DATA`.
//
// Read these before editing:
//   - AGENTS.md → "Craft doctrine" (load-bearing rules)
//   - src/js/engine/README.md  (engine architecture)
//   - src/js/engine/contract.js (the API surface)
//
// Phase 0 scope (this commit): scaffold only.
//   - Mounts a dedicated pane (.forge-pane) when ?view=forge
//   - Reports its phase + the data it can see + WebGPU support
//   - NO rendering yet — that's Phase 1.
//
// Subsequent phases:
//   Phase 1: WebGPU bootstrap + first colored disk rendered
//   Phase 2: All 660 deities + 3k edges rendered, 60fps target
//   Phase 3: Hover / focus / family hulls / type-glyphs
//   Phase 4: Timeline-forge using the same engine
// ============================================================

(function () {
  'use strict';

  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';

    // Engine sanity check — refuse to mount if the contract /
    // types / math modules failed to load (script order issue).
    const eng = window.AtlasEngine;
    const tps = window.AtlasEngineTypes;
    const mth = window.AtlasEngineMath;
    if (!eng || !tps || !mth) {
      rootEl.innerHTML =
        '<div class="forge-error">Engine modules missing. ' +
        'Check index.html loads engine/contract.js + types.js + math.js before forge.js.</div>';
      return;
    }

    // Probe WebGPU support. (Phase 1 will actually create a
    // device; Phase 0 just reports.)
    const hasWebGPU = !!(navigator.gpu && typeof navigator.gpu.requestAdapter === 'function');

    // Snapshot what's in the data — Forge will read this
    // read-only the same way Pantheon V2 does.
    const data = window.VAULT_DATA || { nodes: [], edges: [] };
    const nodeCount = (data.nodes || []).length;
    const edgeCount = (data.edges || []).length;
    const deityCount = (data.nodes || []).filter(n => n && n.type === 'deity').length;

    // Phase 0 pane content — informational only. No engine
    // instantiation yet; that's deferred to Phase 1 so this
    // scaffold commits cleanly without GPU surface side effects.
    rootEl.innerHTML = [
      '<div class="forge-shell">',
        '<div class="forge-header">',
          '<h2 class="forge-h">FORGE</h2>',
          '<span class="forge-sub">proprietary engine · phase 0 scaffold</span>',
        '</div>',
        '<div class="forge-grid">',
          '<div class="forge-card">',
            '<div class="forge-card-label">Engine modules</div>',
            '<div class="forge-card-rows">',
              '<div class="forge-row"><span class="forge-k">contract.js</span><span class="forge-v ok">loaded</span></div>',
              '<div class="forge-row"><span class="forge-k">types.js</span><span class="forge-v ok">loaded</span></div>',
              '<div class="forge-row"><span class="forge-k">math.js</span><span class="forge-v ok">loaded</span></div>',
              '<div class="forge-row"><span class="forge-k">renderer/webgpu.js</span><span class="forge-v pending">phase 1</span></div>',
            '</div>',
          '</div>',
          '<div class="forge-card">',
            '<div class="forge-card-label">Platform</div>',
            '<div class="forge-card-rows">',
              '<div class="forge-row"><span class="forge-k">WebGPU</span><span class="forge-v ' + (hasWebGPU ? 'ok">available' : 'fail">unavailable') + '</span></div>',
              '<div class="forge-row"><span class="forge-k">WebGL2 fallback</span><span class="forge-v pending">phase 1</span></div>',
              '<div class="forge-row"><span class="forge-k">device pixel ratio</span><span class="forge-v">' + (window.devicePixelRatio || 1) + '×</span></div>',
            '</div>',
          '</div>',
          '<div class="forge-card">',
            '<div class="forge-card-label">Data visible</div>',
            '<div class="forge-card-rows">',
              '<div class="forge-row"><span class="forge-k">total nodes</span><span class="forge-v">' + nodeCount + '</span></div>',
              '<div class="forge-row"><span class="forge-k">deities</span><span class="forge-v">' + deityCount + '</span></div>',
              '<div class="forge-row"><span class="forge-k">edges</span><span class="forge-v">' + edgeCount + '</span></div>',
            '</div>',
          '</div>',
          '<div class="forge-card forge-card-full">',
            '<div class="forge-card-label">Phase roadmap</div>',
            '<ol class="forge-phases">',
              '<li class="forge-phase done"><span class="forge-phase-tag">0</span>Scaffold — nav tab, engine contract, types + math ported from the portable core</li>',
              '<li class="forge-phase next"><span class="forge-phase-tag">1</span>WebGPU bootstrap — first colored disk rendered by the engine</li>',
              '<li class="forge-phase"><span class="forge-phase-tag">2</span>Full wheel — all 660 deities + 3k edges, 60 fps, no SVG anywhere</li>',
              '<li class="forge-phase"><span class="forge-phase-tag">3</span>Visual parity — hover, focus, family hulls, type-glyphs, cinematic camera</li>',
              '<li class="forge-phase"><span class="forge-phase-tag">4</span>Timeline-forge — same engine, second view, proves multi-view extensibility</li>',
              '<li class="forge-phase"><span class="forge-phase-tag">→</span>Graduation — Forge replaces Pantheon V2 when visual parity + perf are met</li>',
            '</ol>',
          '</div>',
        '</div>',
        '<div class="forge-footnote">',
          '<span class="forge-k">doctrine:</span> craft-not-ship-fast · proprietary, not rented · re-evaluate tech at every friction signal. ',
          'See <code>AGENTS.md</code> § Craft doctrine and <code>src/js/engine/README.md</code>.',
        '</div>',
      '</div>'
    ].join('');
  }

  // Expose on window so the VIEWS dispatch can route to us.
  // Same pattern as window._pantheonV2.
  window._forge = { render: render };
})();
