// ============================================================
// CODEX ATLAS — Pantheon v2 (WebGL R&D track)
// ============================================================
//
// SECOND ATTEMPT at the WebGL Pantheon. First attempt (commit caa0038,
// reverted in 6b6087c) failed parity — shipped a "technically working"
// sigma.js render that lost the design language (mode dropdown,
// tangential family-rim labels, family hulls, hover trails, edge
// colours, ego-focus, labels:hub/all/off toggle, family-legend
// click-to-filter). The architectural call (sigma.js + WebGL) was
// right; the execution discipline (visual parity gate) was wrong.
//
// THIS FILE IS R&D. Default nav doesn't expose it. Add ?webgl=1 to the
// URL to unlock the "Pantheon v2" slot in the sidebar.
//
// ════════════════════════════════════════════════════════════
//   HARD PARITY GATE — every checkbox must be 'yes' + screenshot-
//   compared against the SVG Pantheon BEFORE swapping default.
//   See AUDIT/next-session-queue-2026-05-16.md for the full reasoning.
// ════════════════════════════════════════════════════════════
//
//  [ ] Mode dropdown wired (deities / authors / symbols / events / monuments)
//  [ ] Family rim-labels — tangentially rotated, just outside the wheel
//  [ ] Faint family-color hulls behind each wedge
//  [ ] Family-legend click-to-filter (bottom-left panel)
//  [ ] labels: hub / all / off  toggle (sigma labelDensity + per-node displayLabel)
//  [ ] Ego-focus button (sigma node-reducer keyed on selected id)
//  [ ] Colored bezier edges per type (theme.js palette)
//  [ ] Hover-trail dim/highlight (sigma node + edge reducer)
//  [ ] Click-empty-to-clear (clear hover + selection state)
//  [ ] Sticky-select (clicked node stays highlighted until empty-click)
//  [ ] view-controls Source-tier toggle still works
//  [ ] Family-filter dropdown still works
//
// EXISTING ASSETS to reuse (don't rebuild):
//  - window._codexGraph        (sigma wrapper, src/js/graph/renderer.js)
//  - window._codexGraphLayout  (polarWedge, src/js/graph/layout.js)
//  - window._codexGraphTheme   (color tokens, src/js/graph/theme.js)
//  - window._codexLayout       (ELK fallback if you want force-relaxed polish)
//  - DATA, NODES_BY_ID, EDGES, FAMILIES — global from app.js
//  - matchesFilter(), selectNode(), showTooltip(), hideTooltip()
//  - The main D3 Pantheon's family-label tangent-rotation math at
//    src/js/app.js inside VIEWS.pantheon's family-label-layer block — port it.
//
// ============================================================
(function () {
  // Skeleton — fills in incrementally per the parity gate above.
  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';
    rootEl.classList.add('pantheon-v2-pane');

    // Placeholder so the R&D track is visibly distinct from production.
    const placeholder = document.createElement('div');
    placeholder.className = 'pantheon-v2-placeholder';
    placeholder.innerHTML = `
      <h2 class="ph2-title">Pantheon v2 · WebGL R&D</h2>
      <p class="ph2-desc">
        Second WebGL attempt, behind <code>?webgl=1</code>. Build target: visual
        + interaction parity with the SVG Pantheon, GPU-rendered for the
        massive-vault future.
      </p>
      <ul class="ph2-checklist">
        <li>☐ mode dropdown (deities/authors/symbols/events/monuments)</li>
        <li>☐ tangential family rim-labels</li>
        <li>☐ family-color hulls</li>
        <li>☐ labels: hub/all/off toggle</li>
        <li>☐ ego-focus button</li>
        <li>☐ colored bezier edges</li>
        <li>☐ hover-trail dim/highlight</li>
        <li>☐ family-legend click-to-filter</li>
        <li>☐ family-filter + tier-overlay parity</li>
      </ul>
      <p class="ph2-footer">
        Until every box is ticked + screenshot-verified, this view does NOT
        replace the production Pantheon. Iterate here, A/B against the SVG
        tab, then promote.
      </p>
    `;
    rootEl.appendChild(placeholder);

    // TODO(next-batch): mount sigma.js + start ticking the parity boxes.
    // Use window._codexGraph.mount(rootEl, { nodes, edges, positions, onClick, onHover })
    // and port the main Pantheon's wedge / label / hull / hover patterns.
  }

  window._pantheonV2 = { render };
})();
