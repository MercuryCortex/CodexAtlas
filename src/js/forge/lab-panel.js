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
// The GROUND is NOT here. It graduated to the canonical VIEW panel
// on 2026-07-29 (John: "these are not dev panel") — see
// src/js/forge/view-settings.js + src/js/forge/ground.js.
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
    // REVIEW P1 — the panel survives forge view remounts on
    // document.body; the old early-return left it wired to a DEAD
    // mount's params (dials inert, persisted recipe silently
    // reverted). Rebuild against the fresh {local, api} instead.
    const stale = document.getElementById('forge-lab-panel');
    if (stale) stale.remove();
    const staleCss = document.getElementById('forge-lab-panel-css');
    if (staleCss) staleCss.remove();

    const SLIDERS = [
      // [param, label, min, max, step, unit, mode] — mode: 'redraw'
      // (default), 'refocus' (state/palette rebuild), 'rebake'
      // (node radii repack).
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
      // 0 restores the old flat clamp exactly.
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
      // THE HOUSE (2026-07-30) — the family-isolate tree. Spread is
      // a scrub (snaps); the tween length applies to the next ramp.
      // BONES: resting visibility of the house's own kinship wires
      // (0 = the old invisible slate idle, 1 = full hover-hot).
      ['house_spread',   'House spread', 0.85, 1.5, 0.01, '×', 'house'],
      ['house_bones',    'House bones',  0,    1,   0.01, '',  'refocus'],
      // THE BONE READS AS AN ARC (2026-07-31). Secondary = how loud a
      // non-primary parent arc is against the spine (1 = the old flat
      // lift). Sag = how far a bone bows off its own chord. Bone px =
      // the primary arc's width floor on screen.
      ['house_bone_secondary', 'Bone secondary', 0, 1,  0.01, '',  'refocus'],
      ['house_arc_sag',  'Arc sag',      0,    0.5, 0.01, '',  'redraw'],
      ['house_bone_px',  'Bone width',   0,    6,   0.1,  'px', 'redraw'],
      ['house_veil',     'House veil',   0,    1,   0.01, ''],
      ['house_tween_ms', 'House tween',  200,  800, 10,   'ms'],
    ];
    // THE HOUSE — layout radios. GEOMETRY GRADUATED (2026-07-30):
    // Cascade | Fan is a CANONICAL view control now — it lives in the
    // VIEW panel ("House layout") and persists with the view
    // settings, per John's toggles-change-the-view ruling. The LAB
    // keeps only the tuning radios; flipping one while isolated
    // TWEENS the house (api.houseMorph), never snaps.
    // [param, caption, options, apiAfter] — apiAfter defaults to the
    // house morph (a layout dial). REST WIRES is not a layout dial:
    // it moves one uniform, so a plain redraw is the whole update.
    const HOUSE_RADIOS = [
      ['house_ranks',      'Ranks',      ['lineage', 'era']],
      ['house_orphans',    'Unparented', ['domain', 'degree']],
      // 2026-07-31 — the isolate drags ~4,400 wires between two OTHER
      // families into the house (plus ~2,000 zero-length ones that
      // draw as solid radial spikes off every port), covering half the
      // tree's own pixels. 'off' is the shipped default: a wire
      // between two families neither of which is this house says
      // nothing about this house. Hover still lights a deity's own.
      ['house_rest_wires', 'Rest wires', ['full', 'stubs', 'off'], 'redraw'],
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
    // own collapse choices win (persisted below). Every slider key
    // must appear exactly once; anything not listed would silently
    // never render, so the builder asserts on that at the end.
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
      { id: 'house', title: 'The House — family isolate', open: false, items: [
        { k: 'house' },
        { k: 'slider', key: 'house_spread' },
        { k: 'slider', key: 'house_bones' },
        { k: 'slider', key: 'house_bone_secondary' },
        { k: 'slider', key: 'house_arc_sag' },
        { k: 'slider', key: 'house_bone_px' },
        { k: 'slider', key: 'house_veil' },
        { k: 'slider', key: 'house_tween_ms' },
      ] },
    ];

    const defaults = {};
    for (const [k] of SLIDERS) defaults[k] = local.params[k];
    for (const [k] of TOGGLES) defaults[k] = local.params[k];
    for (const [k] of CASTS)   defaults[k] = local.params[k];
    for (const [k] of VOICES)  defaults[k] = local.params[k];
    for (const [k] of HOUSE_RADIOS) defaults[k] = local.params[k];
    const ALL_KEYS = Object.keys(defaults);

    // Persistence — John's dials must survive a reload (they reset
    // from PARAM_DEFAULTS every mount otherwise). The recipe line
    // stays the formal spec; this is just working memory.
    const LS_KEY = 'forge.labRecipe.v1';
    function persist() {
      const o = {};
      for (const k of ALL_KEYS) o[k] = local.params[k];
      try { localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch (_) { /* ignore */ }
    }
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (_) { /* ignore */ }
    if (stored && typeof stored === 'object') {
      for (const k of ALL_KEYS) if (k in stored) local.params[k] = stored[k];
      // Applied after mount ⇒ radii/dress may be stale — refresh once.
      if (local.mode) { api.refreshDress(); if (api.rebake) api.rebake(); }
    }
    // Which sections are open — remembered separately from the
    // recipe, because it is workspace state, not a spec value.
    const OPEN_KEY = 'forge.labPanel.open.v1';
    let openState = null;
    try { openState = JSON.parse(localStorage.getItem(OPEN_KEY) || 'null'); } catch (_) { /* ignore */ }
    if (!openState || typeof openState !== 'object') {
      openState = {};
      for (const s of SECTIONS) openState[s.id] = !!s.open;
    }
    function persistOpen() {
      try { localStorage.setItem(OPEN_KEY, JSON.stringify(openState)); } catch (_) { /* ignore */ }
    }

    const css = document.createElement('style');
    css.id = 'forge-lab-panel-css';
    css.textContent = [
      '#forge-lab-panel{position:fixed;top:64px;right:12px;z-index:220;width:240px;max-height:calc(100vh - 140px);',
      'overflow-y:auto;background:rgba(10,8,22,.92);backdrop-filter:blur(10px);border:1px solid rgba(211,184,119,.28);',
      'border-radius:4px;padding:10px 12px;font:10px ui-monospace,"SF Mono",Menlo,monospace;color:#918ab4;',
      'letter-spacing:.06em}',
      '#forge-lab-panel h4{margin:0 0 8px;font-size:10px;letter-spacing:.24em;color:#d3b877;font-weight:600}',
      '#forge-lab-panel .lp-row{margin:7px 0 2px;display:flex;justify-content:space-between;text-transform:uppercase;font-size:8.5px}',
      '#forge-lab-panel .lp-row b{color:#d3b877;font-weight:600}',
      // SAFARI FIX (2026-07-29): Safari ignores accent-color on range
      // inputs and fell back to the fat native white slider — the
      // panel looked broken next to Chromium. Style the track/thumb
      // explicitly; -webkit-appearance:none is what unlocks them.
      '#forge-lab-panel input[type=range]{width:100%;accent-color:#d3b877;height:14px;background:transparent;margin:0;',
      '-webkit-appearance:none;appearance:none}',
      '#forge-lab-panel input[type=range]::-webkit-slider-runnable-track{height:2px;border-radius:1px;',
      'background:rgba(145,138,180,.35)}',
      '#forge-lab-panel input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;',
      'width:10px;height:10px;margin-top:-4px;border-radius:50%;background:#d3b877;border:none}',
      '#forge-lab-panel input[type=range]::-moz-range-track{height:2px;border-radius:1px;background:rgba(145,138,180,.35)}',
      '#forge-lab-panel input[type=range]::-moz-range-thumb{width:10px;height:10px;border-radius:50%;background:#d3b877;border:none}',
      '#forge-lab-panel .lp-chips{display:flex;gap:4px;flex-wrap:wrap;margin:6px 0}',
      '#forge-lab-panel .lp-chip{font:8.5px ui-monospace,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;',
      'padding:4px 7px;border-radius:2px;cursor:pointer;background:transparent;color:#918ab4;border:1px solid rgba(145,138,180,.35)}',
      '#forge-lab-panel .lp-chip.on{color:#231b08;background:#d3b877;border-color:#d3b877}',
      '#forge-lab-panel .lp-cast{margin:4px 0 2px;font-size:8px;text-transform:uppercase;color:#5e5885}',
      // ── collapsible section headers ──
      '#forge-lab-panel .lp-sec{width:100%;display:flex;align-items:center;gap:6px;margin:9px 0 0;padding:5px 0;',
      'background:none;border:none;border-top:1px solid rgba(211,184,119,.16);cursor:pointer;',
      'font:9px ui-monospace,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:#d3b877;text-align:left}',
      '#forge-lab-panel .lp-sec:hover{color:#f0e2bd}',
      '#forge-lab-panel .lp-sec .lp-caret{display:inline-block;width:8px;color:#5e5885;transition:transform .12s ease-out}',
      '#forge-lab-panel .lp-sec.open .lp-caret{transform:rotate(90deg);color:#d3b877}',
      '#forge-lab-panel .lp-secbody{display:none;padding-bottom:2px}',
      '#forge-lab-panel .lp-secbody.open{display:block}',
      '#forge-lab-panel .lp-recipe{margin-top:10px;padding:6px 8px;border:1px dashed rgba(211,184,119,.3);border-radius:3px;',
      'font-size:8.5px;line-height:1.5;color:#918ab4;word-break:break-word;user-select:all}',
      '#forge-lab-panel .lp-btns{display:flex;gap:6px;margin-top:8px}',
      '#forge-lab-panel .lp-btn{flex:1;font:9px ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;',
      'background:transparent;color:#d3b877;border:1px solid rgba(211,184,119,.4);border-radius:2px;padding:5px 0;cursor:pointer}',
      '#forge-lab-panel .lp-x{position:absolute;top:8px;right:10px;cursor:pointer;color:#5e5885;background:none;border:none;font-size:12px}',
    ].join('');
    document.head.appendChild(css);

    const el = document.createElement('div');
    el.id = 'forge-lab-panel';
    el.innerHTML = '<button class="lp-x" title="hide">×</button><h4>NODE LAB · LIVE</h4>';
    document.body.appendChild(el);
    el.querySelector('.lp-x').addEventListener('click', () => { el.style.display = 'none'; });

    const recipeEl = document.createElement('div');

    function fmt(k, v) {
      if (k === 'recipe_wake_cap' || k === 'recipe_gate_px' || k === 'recipe_wake_radius_px'
          || k === 'film_full_pct' || k === 'film_fade_pct'
          || k === 'house_tween_ms') return String(Math.round(v));
      return (+v).toFixed(2);
    }
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
        + ' · FAMILY-TREE layout=' + (p.house_geometry || 'cascade')
        + ' ranks=' + (p.house_ranks === 'era' ? 'era' : 'lineage+era')
        + ' unparented=' + (p.house_orphans || 'domain')
        + ' spread=' + (+p.house_spread || 1.1).toFixed(2)
        + ' tween=' + Math.round(p.house_tween_ms || 450)
        + ' · BONES ' + (+p.house_bones || 0).toFixed(2)
        + '/2nd ' + (+p.house_bone_secondary || 0).toFixed(2)
        + ' sag ' + (+p.house_arc_sag || 0).toFixed(2)
        + ' ' + (+p.house_bone_px || 0).toFixed(1) + 'px'
        + ' · rest-wires ' + (p.house_rest_wires || 'off')
        + ' · WIRE px ' + (+p.wire_min_screen_px || 0).toFixed(1)
        + '/' + (+p.wire_max_screen_px || 0).toFixed(1)
        + ' hot ' + (+p.wire_hot_screen_px || 0).toFixed(1);
    }
    function syncRecipe() { recipeEl.textContent = recipeStr(); }

    // ── builders (unchanged behaviour; they just append into a
    //    section body now instead of straight into the panel) ──
    const SLIDER_BY_KEY = {};
    for (const s of SLIDERS) SLIDER_BY_KEY[s[0]] = s;
    const used = new Set();

    function addSlider(host, key) {
      const spec = SLIDER_BY_KEY[key];
      if (!spec) return;
      used.add(key);
      const [, label, min, max, step, unit, mode] = spec;
      const row = document.createElement('div');
      row.className = 'lp-row';
      row.innerHTML = '<span>' + label + '</span><b></b>';
      const val = row.querySelector('b');
      const inp = document.createElement('input');
      inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step;
      inp.value = local.params[key];
      val.textContent = fmt(key, local.params[key]) + unit;
      inp.addEventListener('input', () => {
        local.params[key] = +inp.value;
        val.textContent = fmt(key, inp.value) + unit;
        syncRecipe();
        persist();
        if (mode === 'rebake' && api.rebake) api.rebake();
        else if (mode === 'refocus' && api.refocus) api.refocus();
        else if (mode === 'house' && api.houseSnap) api.houseSnap();
        else api.redraw();
      });
      host.appendChild(row); host.appendChild(inp);
    }

    function addToggles(host, keys) {
      const tog = document.createElement('div');
      tog.className = 'lp-chips';
      for (const key of keys) {
        const spec = TOGGLES.find(t => t[0] === key);
        if (!spec) continue;
        const b = document.createElement('button');
        b.className = 'lp-chip' + (local.params[key] ? ' on' : '');
        b.textContent = spec[1];
        b.addEventListener('click', () => {
          local.params[key] = local.params[key] ? 0 : 1;
          b.classList.toggle('on', !!local.params[key]);
          syncRecipe();
          persist();
          api.redraw();
        });
        tog.appendChild(b);
      }
      host.appendChild(tog);
    }

    function addRadioRow(host, key, caption, opts, after) {
      const cap = document.createElement('div');
      cap.className = 'lp-cast'; cap.textContent = caption;
      host.appendChild(cap);
      const row = document.createElement('div');
      row.className = 'lp-chips';
      for (const d of opts) {
        const b = document.createElement('button');
        b.className = 'lp-chip' + (local.params[key] === d ? ' on' : '');
        b.dataset.k = key; b.dataset.d = d;
        b.textContent = d;
        b.addEventListener('click', () => {
          local.params[key] = d;
          for (const s of row.children) s.classList.toggle('on', s.dataset.d === d);
          syncRecipe();
          persist();
          if (after) after();
          api.redraw();
        });
        row.appendChild(b);
      }
      host.appendChild(row);
    }

    for (const sec of SECTIONS) {
      const head = document.createElement('button');
      head.className = 'lp-sec' + (openState[sec.id] ? ' open' : '');
      head.innerHTML = '<span class="lp-caret">▸</span><span>' + sec.title + '</span>';
      const body = document.createElement('div');
      body.className = 'lp-secbody' + (openState[sec.id] ? ' open' : '');
      head.addEventListener('click', () => {
        openState[sec.id] = !openState[sec.id];
        head.classList.toggle('open', openState[sec.id]);
        body.classList.toggle('open', openState[sec.id]);
        persistOpen();
      });
      el.appendChild(head); el.appendChild(body);

      for (const it of sec.items) {
        if (it.k === 'slider')  addSlider(body, it.key);
        else if (it.k === 'toggles') addToggles(body, it.keys);
        else if (it.k === 'casts') {
          for (const [key, label] of CASTS) {
            addRadioRow(body, key, 'Cast — ' + label, DRESSES, api.refreshDress);
          }
        } else if (it.k === 'voices') {
          for (const [key, label, opts] of VOICES) addRadioRow(body, key, label, opts);
        } else if (it.k === 'house') {
          for (const [key, label, opts, apiAfter] of HOUSE_RADIOS) {
            addRadioRow(body, key, label, opts, api[apiAfter || 'houseMorph']);
          }
        }
      }
    }
    // A dial that fell out of SECTIONS would vanish from the panel
    // silently — loud in the console instead.
    for (const [k] of SLIDERS) {
      if (!used.has(k)) console.warn('[lab-panel] slider not placed in any section:', k);
    }

    recipeEl.className = 'lp-recipe';
    el.appendChild(recipeEl);
    const btns = document.createElement('div');
    btns.className = 'lp-btns';
    const copyB = document.createElement('button');
    copyB.className = 'lp-btn'; copyB.textContent = 'Copy';
    copyB.addEventListener('click', () => {
      const txt = recipeStr();
      const done = () => { copyB.textContent = 'Copied ✓'; setTimeout(() => { copyB.textContent = 'Copy'; }, 1200); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done, () => window.prompt('Copy the recipe:', txt));
      } else window.prompt('Copy the recipe:', txt);
    });
    const resetB = document.createElement('button');
    resetB.className = 'lp-btn'; resetB.textContent = 'Reset';
    resetB.addEventListener('click', () => {
      try { localStorage.removeItem(LS_KEY); } catch (_) { /* ignore */ }
      Object.assign(local.params, defaults);
      el.remove(); css.remove();
      attach({ local, api });
      api.refreshDress();
      if (api.rebake) api.rebake();
      api.redraw();
    });
    btns.appendChild(copyB); btns.appendChild(resetB);
    el.appendChild(btns);
    syncRecipe();
  }

  window._forgeLabPanel = { attach };
})();
