// ============================================================
// CODEX ATLAS — THE NODE LAB PANEL (in-Atlas)
// ============================================================
//
// ROUND-7b (2026-07-26) — Step B of the node-dress mission.
// The design/node-lab.html rig, living INSIDE the real Atlas:
// open the app with `?lab` in the URL and this panel appears,
// driving the live NODE_SHADER recipe (local.params.recipe_*)
// on the real 663-deity wheel.
//
// 2026-07-29 — the dials are grouped into COLLAPSIBLE SECTIONS by
// area of interest (John: "make collapsable each area of interest —
// to easy focus; nodes is nodes related, wires is wires"). The
// section a dial belongs to is declared once, in SECTIONS below;
// there is no second list to keep in sync. Open/closed state is
// remembered per section.
//
// 2026-07-31 — THE HOUSE MOVED OUT. Four house sections had
// accumulated here and John could not find the controls he asked
// for by name: "IN TH ENODE LAB?!?!?!?! ... is SUPER CLUTTED".
// Every house dial now lives behind its own DEV door —
// src/js/forge/house-panel.js. This file is back to the eight
// recipe sections it was built for and holds NO house residue.
//
// The GROUND is NOT here either. It graduated to the canonical
// VIEW panel on 2026-07-29 (John: "these are not dev panel") — see
// src/js/forge/view-settings.js + src/js/forge/ground.js.
//
// THE ROWS ARE NOT BUILT HERE. src/js/forge/panel-kit.js is the ONE
// slider/toggle/radio machine in the tree; this file is a dial
// TABLE plus a recipe string. The house panel drives the same kit.
//
// BOUNDARY CONTRACT:
//   window._forgeLabPanel.attach({ local, api })
//     local — forge.js per-mount state (reads/writes local.params)
//     api.redraw()       — kick the anim loop + draw a frame
//     api.refreshDress() — rebuild per-node dress ids + retarget
//
// DRIFT LAW: this panel owns NO values of its own. Every control
// reads its default from local.params and writes back the same
// key drawFrame reads per frame. The recipe line IS the spec.
// ============================================================
(function () {
  function attach({ local, api }) {
    if (!(window._forgePanelKit && typeof window._forgePanelKit.mount === 'function')) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[lab-panel] window._forgePanelKit not loaded — node lab inert.');
      }
      return;
    }

    const SLIDERS = [
      // [param, label, min, max, step, unit, mode] — mode: 'redraw'
      // (default), 'refocus' (state/palette rebuild), 'rebake' (node
      // radii repack).
      ['recipe_hover_zoom',  'Hover zoom',   1,    2.2,  0.01, '×'],
      ['recipe_click_zoom',  'Click zoom',   1,    3,    0.01, '×'],
      ['recipe_bubble',      'Bubble',       1,    1.5,  0.01, '×'],
      ['recipe_mag',         'Refraction',   1,    1.35, 0.01, '×'],
      ['recipe_frost',       'Frost',        0,    4,    0.1,  'px'],
      ['recipe_depth',       'Depth',        0,    1,    0.01, ''],
      ['recipe_glow',        'Glow',         0,    1,    0.01, ''],
      ['recipe_pulse',       'Glow pulse',   0,    1,    0.01, ''],
      ['recipe_glow_reach',  'Glow reach',   1.5,  4.5,  0.1,  '×'],
      ['recipe_fin_strength','Finish',       0,    1,    0.01, ''],
      ['recipe_wake_radius_px','Wake radius',60,   400,  2,    'px'],
      ['recipe_wake_cap',    'Wake cap',     1,    24,   1,    ''],
      ['recipe_gate_px',     'Dress gate',   0,    24,   1,    'px'],
      ['recipe_ether',       'Ethereal',     0,    1,    0.01, ''],
      ['recipe_chroma_px',   'Chroma spread',0.5,  8,    0.1,  'px'],
      ['recipe_core_white',  'Core white',   0,    1,    0.01, ''],
      ['recipe_core_alpha',  'Core alpha',   0,    1,    0.01, ''],
      ['recipe_ring_alpha',  'Ring alpha',   0.2,  1,    0.01, ''],
      // AUDIT P2-9 — the wire laws (deep-zoom calm + hot-web whisper)
      ['recipe_wire_calm',   'Wire calm',    0,    1,    0.01, '',  'redraw'],
      ['recipe_hot_wire',    'Hot wires',    0.2,  1,    0.01, '',  'refocus'],
      // 2026-07-31 — the wire WIDTH band. min/max were hard-coded and
      // exposed nowhere; with only those two the band is FLAT below
      // ~1.5× fit and idle / boned / hot all clamp to one hairline.
      // Hot px is the width a fully-hot wire is guaranteed to reach;
      // 0 restores the old flat clamp exactly. NOT house-only — these
      // are every wire on the map, so they stay in the LAB.
      ['wire_min_screen_px', 'Wire min',     0.5,  3,    0.1,  'px', 'redraw'],
      ['wire_max_screen_px', 'Wire max',     1,    6,    0.1,  'px', 'redraw'],
      ['wire_hot_screen_px', 'Wire hot',     0,    6,    0.1,  'px', 'redraw'],
      // AUDIT P2-10 — tier-aware max size: hubs stay hubs at deep zoom
      ['node_max_screen_px_hub',   'Hub max size',   24, 48, 1, 'px', 'rebake'],
      ['node_max_screen_px_mid',   'Mid max size',   16, 36, 1, 'px', 'rebake'],
      ['node_max_screen_px_small', 'Small max size', 10, 28, 1, 'px', 'rebake'],
      // THE FILM RAMP (2026-07-29) — John: "WHERE is the FILM RAMP
      // SLIDER???". The bg movie's visibility curve, dialled instead of
      // baked in. Floor = how present it is at working zoom (0 = the
      // original spec: invisible until you zoom out).
      ['film_floor',    'Film floor',   0,  1,  0.01, '',  'bg'],
      ['film_full_pct', 'Film full at', 5,  40, 1,    '%'],
      ['film_fade_pct', 'Film fades by',10, 80, 1,    '%'],
    ];
    const TOGGLES = [
      ['recipe_irid',   'Iridescence'],
      ['recipe_chroma', 'Chroma'],
      ['recipe_label',  'Label'],
    ];
    // The label voice — radio rows like the casts (lab: 3 fonts × 3 motions)
    // 2026-07-29 — plain names, no "voice" jargon (it confused John,
    // fairly). Two INDEPENDENT axes: size and family. Both apply to
    // every name on the map, always.
    const VOICES = [
      ['label_font', 'Label font',   ['mono', 'serif', 'sans']],
      ['label_face', 'Label size',   ['map', 'voice']],
      ['label_anim', 'Reveal motion', ['condense', 'rise', 'unveil']],
    ];
    const DRESSES = ['halo', 'icon', 'orb', 'veil', 'ember'];
    const CASTS = [
      ['dress_hub',   'Hubs'],
      ['dress_mid',   'Mid'],
      ['dress_small', 'Small'],
    ];

    // ── THE SECTIONS ────────────────────────────────────────────
    // One area of interest per section, in the order John reaches
    // for them. `open` is only the FIRST-RUN state — after that his
    // own collapse choices win (the kit persists them). Every slider
    // key must appear exactly once; anything not listed would
    // silently never render, so the kit warns on that.
    const SECTIONS = [
      { id: 'nodes', title: 'Nodes', open: true, items: [
        { k: 'slider', key: 'recipe_hover_zoom' },
        { k: 'slider', key: 'recipe_click_zoom' },
        { k: 'slider', key: 'recipe_bubble' },
        { k: 'slider', key: 'recipe_gate_px' },
        { k: 'slider', key: 'recipe_core_white' },
        { k: 'slider', key: 'recipe_core_alpha' },
        { k: 'slider', key: 'recipe_ring_alpha' },
        { k: 'casts' },
      ] },
      { id: 'light', title: 'Light', open: true, items: [
        { k: 'slider', key: 'recipe_glow' },
        { k: 'slider', key: 'recipe_pulse' },
        { k: 'slider', key: 'recipe_glow_reach' },
        { k: 'slider', key: 'recipe_ether' },
        { k: 'slider', key: 'recipe_fin_strength' },
        { k: 'slider', key: 'recipe_chroma_px' },
        { k: 'toggles', keys: ['recipe_irid', 'recipe_chroma'] },
      ] },
      { id: 'glass', title: 'Glass — the orb lens', open: false, items: [
        { k: 'slider', key: 'recipe_mag' },
        { k: 'slider', key: 'recipe_frost' },
        { k: 'slider', key: 'recipe_depth' },
      ] },
      { id: 'wake', title: 'Wake', open: false, items: [
        { k: 'slider', key: 'recipe_wake_radius_px' },
        { k: 'slider', key: 'recipe_wake_cap' },
      ] },
      { id: 'wires', title: 'Wires', open: false, items: [
        { k: 'slider', key: 'recipe_wire_calm' },
        { k: 'slider', key: 'recipe_hot_wire' },
        { k: 'slider', key: 'wire_min_screen_px' },
        { k: 'slider', key: 'wire_max_screen_px' },
        { k: 'slider', key: 'wire_hot_screen_px' },
      ] },
      { id: 'sizes', title: 'Sizes', open: false, items: [
        { k: 'slider', key: 'node_max_screen_px_hub' },
        { k: 'slider', key: 'node_max_screen_px_mid' },
        { k: 'slider', key: 'node_max_screen_px_small' },
      ] },
      { id: 'labels', title: 'Labels', open: false, items: [
        { k: 'toggles', keys: ['recipe_label'] },
        { k: 'voices' },
      ] },
      { id: 'film', title: 'Film — the bg movie', open: false, items: [
        { k: 'slider', key: 'film_floor' },
        { k: 'slider', key: 'film_full_pct' },
        { k: 'slider', key: 'film_fade_pct' },
      ] },
    ];

    // THE RECIPE LINE — nodes, light, glass, wake, wires, film. The
    // HOUSE terms moved out with the dials: src/js/forge/house-panel.js
    // prints its own line, so neither panel claims the other's spec.
    function recipeStr() {
      const p = local.params;
      const cast = (p.dress_hub === p.dress_mid && p.dress_mid === p.dress_small)
        ? 'dress ' + p.dress_hub
        : 'dress hub:' + p.dress_hub + ' mid:' + p.dress_mid + ' small:' + p.dress_small;
      const fins = [p.recipe_irid ? 'irid' : '', p.recipe_chroma ? 'chroma' : ''].filter(Boolean).join('+') || 'pure';
      return 'NODE RECIPE (live) — ' + cast
        + ' · hover ×' + p.recipe_hover_zoom.toFixed(2) + ' · click ×' + p.recipe_click_zoom.toFixed(2)
        + ' · bubble ' + p.recipe_bubble.toFixed(2)
        + ' · refract ' + (p.recipe_mag || 1).toFixed(2) + ' depth ' + (p.recipe_depth || 0).toFixed(2)
        + ' · frost ' + (p.recipe_frost || 0).toFixed(1)
        + ' · ether ' + p.recipe_ether.toFixed(2)
        + (p.recipe_label ? ' · label ' + (p.label_font || 'sans') + '/' + (p.label_anim || 'rise') : '')
        + ' · glow ' + p.recipe_glow.toFixed(2) + ' pulse ' + p.recipe_pulse.toFixed(2) + ' reach ×' + p.recipe_glow_reach.toFixed(1)
        + ' · finish ' + p.recipe_fin_strength.toFixed(2) + ' [' + fins + '] chroma± ' + p.recipe_chroma_px.toFixed(1) + 'px'
        + ' · wake ' + Math.round(p.recipe_wake_radius_px) + 'px cap ' + Math.round(p.recipe_wake_cap)
        + ' · gate ' + Math.round(p.recipe_gate_px) + 'px'
        + ' · core w ' + p.recipe_core_white.toFixed(2) + ' a ' + p.recipe_core_alpha.toFixed(2)
        + ' · ring a ' + p.recipe_ring_alpha.toFixed(2)
        + ' · WIRE px ' + (+p.wire_min_screen_px || 0).toFixed(1)
        + '/' + (+p.wire_max_screen_px || 0).toFixed(1)
        + ' hot ' + (+p.wire_hot_screen_px || 0).toFixed(1)
        + ' · FILM floor ' + (+p.film_floor || 0).toFixed(2)
        + ' full ' + Math.round(p.film_full_pct || 0) + '%'
        + ' fade ' + Math.round(p.film_fade_pct || 0) + '%';
    }

    window._forgePanelKit.mount({
      id: 'forge-lab-panel',
      title: 'NODE LAB · LIVE',
      local, api,
      sliders: SLIDERS,
      toggles: TOGGLES,
      sections: SECTIONS,
      // The cast + voice rows are radio rows over keys with no dial
      // table of their own; the kit still owns/persists them.
      extraKeys: CASTS.map(c => c[0]).concat(VOICES.map(v => v[0])),
      render: {
        casts(host, ctx) {
          for (const [key, label] of CASTS) {
            ctx.addRadioRow(host, key, 'Cast — ' + label, DRESSES, api.refreshDress);
          }
        },
        voices(host, ctx) {
          for (const [key, label, opts] of VOICES) ctx.addRadioRow(host, key, label, opts);
        },
      },
      storeKey: 'forge.labRecipe.v1',
      openKey:  'forge.labPanel.open.v1',
      recipe: recipeStr,
      // Applied after mount ⇒ radii/dress may be stale — refresh once.
      onRestore() { if (local.mode) { api.refreshDress(); if (api.rebake) api.rebake(); } },
      onReset()   { api.refreshDress(); if (api.rebake) api.rebake(); },
    });
  }

  window._forgeLabPanel = { attach };
})();
