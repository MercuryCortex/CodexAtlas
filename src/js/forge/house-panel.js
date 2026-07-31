// ============================================================
// CODEX ATLAS — THE HOUSE PANEL (its own dev door)
// ============================================================
//
// 2026-07-31 — John asked for this weeks of work ago, in his own
// words: "it will be easier to dev this if you add also a panel
// just dedicated to the sizes macro of these three sections that
// im proposing?" — a panel JUST DEDICATED to it. It was built as a
// SECTION inside the Node Lab instead. Twice. His verdict today:
//
//   "??????? IN TH ENODE LAB?!?!?!?! WHY>?>???? is SUPER CLUTTED
//    I ASKED TO DO ITS OWN CLEAN SIMPLE TO ACESS ONE OPANEL"
//
// So: the sixth DEV door. Every dial that governs the family
// isolate lives here and NOTHING else does — the Node Lab is back
// to its eight recipe sections and holds no house residue.
//
// GROUPED BY WHAT HE SEES, NOT BY WHAT THE CODE CALLS THINGS.
// Outside in, the way the picture reads:
//   the tree (the gods) · the band (Scriptorium + Court) · the
//   ports (other families) · the gaps between them · the words ·
//   the lines · the feel.
// Every section DECLARES itself open — a control he cannot find is
// unshipped, which has now cost four rounds.
//
// NOT HERE, ON PURPOSE:
//   · Cascade | Fan (house_geometry) is CANONICAL — it changes what
//     the map CLAIMS, so it lives on the VIEW panel, not in dev.
//   · the wire WIDTH dials (wire_min/max/hot_screen_px) are the
//     whole map's wires, not the house's — they stay in the LAB.
//
// BOUNDARY CONTRACT:
//   window._forgeHousePanel.attach({ local, api })
//     api.houseSnap / houseMorph — re-solve the isolate layout
//     api.refocus / relabel / redraw — the shallower refreshes
//
// The rows themselves are built by src/js/forge/panel-kit.js — ONE
// slider machine in the tree, shared with the Node Lab.
// ============================================================
(function () {
  'use strict';

  function attach({ local, api }) {
    if (!(window._forgePanelKit && typeof window._forgePanelKit.mount === 'function')) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[house-panel] window._forgePanelKit not loaded — house panel inert.');
      }
      return;
    }

    // ONE-TIME MIGRATION (2026-07-31): 'left' was never John's choice —
    // wave 4 parked the title in the corner on the agent's own
    // reasoning, and the postmortem ratified CENTER. A stored 'left'
    // from that era would silently veto the ratified default forever
    // (the exact returning-user trap that shipped three invisible
    // controls), so it migrates once — in the panel's own blob AND the
    // LAB donor blob the one-time import reads. A 'left' John picks
    // from the dial AFTER this ships sticks: the marker survives.
    try {
      for (const k of ['forge.housePanel.v1', 'forge.labRecipe.v1']) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        if (obj && typeof obj === 'object'
            && obj.house_title_slot === 'left' && !obj.__titleCenterMigr) {
          obj.house_title_slot = 'center';
          obj.__titleCenterMigr = 1;
          localStorage.setItem(k, JSON.stringify(obj));
        }
      }
    } catch (_) { /* storage unavailable — the default already says center */ }

    // [param, label, min, max, step, unit, mode] — mode names the
    // refresh deep enough for the change to appear: 'house' re-solves
    // the isolate layout, 'refocus' rebuilds per-node state, 'relabel'
    // rebuilds the label SET (the paint compares it by identity),
    // default is a plain redraw.
    const SLIDERS = [
      // ── the tree ──
      // GOD SIZE — the direct control, named as such (postmortem #5:
      // he asked for it BY NAME and was given adjacent P-side terms).
      // Multiplies node radius only; not one position moves.
      ['house_god_size',      'God size',      0.5,  2.0,  0.02,  '×',  'house'],
      ['house_spread',        'Tree spread',   0.85, 1.5,  0.01,  '×',  'house'],
      ['house_tree_r',        'Tree zone',     0.50, 1.00, 0.005, '×',  'house'],
      // THE THREE PITCH TERMS — what decides how big a god is. Chord +
      // fill widen the beds (past ~0.78 / 0.90 Greek's circle fit binds
      // and its cascade leaves the house centre); "Biggest god" is the
      // ceiling that binds on SMALL families — reach for it when a
      // 12-god house looks under-scaled.
      ['house_bed_chord',     'Row width',     0.60, 1.00, 0.01,  '×',  'house'],
      ['house_bed_fill',      'Row fill',      0.60, 1.00, 0.01,  '×',  'house'],
      ['house_bed_cap',       'Biggest god',   0.08, 0.32, 0.005, '×',  'house'],
      // ── the band (Scriptorium + Court) ──
      ['house_band_r',        'Band radius',   0.60, 1.00, 0.005, '×',  'house'],
      ['house_band_rows',     'Band rows',     1,    4,    1,     '',   'house'],
      // Row thickness = how thick a crowded shelf grows (16 → Christian's
      // docs run 3 sub-rows, 9 → the old thin band). Gap at bottom is the
      // 6-o'clock opening (smaller = more arc, John's "push the limit of
      // the rows on the bottom"); Title arc is the top-end reserve the
      // curved SCRIPTORIUM / COURT titles ride.
      ['house_band_pitch',    'Row thickness', 6,    30,   1,     'wu', 'house'],
      ['house_band_gap',      'Gap at top',    8,    45,   1,     '°',  'house'],
      ['house_band_gap_bot',  'Gap at bottom', 2,    45,   1,     '°',  'house'],
      ['house_band_head',     'Title arc',     80,   400,  10,    'wu', 'house'],
      ['house_cap_clear',     'Caption clear', 0,    40,   1,     'wu', 'house'],
      ['house_rail_glyph',    'Item size',     0.2,  0.7,  0.02,  '×',  'house'],
      // Max items = how many slots a shelf may DISPLAY (the family's
      // true count is what the header and the crown claim either way).
      ['house_rail_cap',      'Max items',     20,   400,  10,    '',   'house'],
      ['house_rail_hit',      'Item hit area', 0,    12,   0.5,   'wu', 'house'],
      // ── the ports ──
      ['house_port_inset',    'Ports ring',    0.85, 1.15, 0.005, '×',  'house'],
      ['house_port_hit',      'Port hit area', 0,    24,   1,     'px', 'redraw'],
      // ── the gaps ── guaranteed clearances in WORLD UNITS: drag one up
      // and the band and the tree give ground live (the gate proves no
      // pair ever comes inside them). Measured at these defaults before
      // wave 5: tree→band 4.0, caption→ports 9.6, sub-row 1.15, glyph 2.00.
      ['house_m_tree',        'Gods → band',   0,    60,   1,     'wu', 'house'],
      ['house_m_port',        'Band → ports',  0,    60,   1,     'wu', 'house'],
      ['house_m_sub',         'Sub-row gap',   0,    20,   0.5,   'wu', 'house'],
      ['house_m_glyph',       'Glyph gap',     0,    20,   0.5,   'wu', 'house'],
      // ── the words ──
      // THE GODS GET THEIR NAMES BACK (wave 4). John: "the DEities nodes
      // are the most important and NEVER appear, i need to OVER to see
      // the names.... even at 100% scale!" MEASURED before the fix: 5 of
      // Norse's 50 gods carried a name at camera scale 1.0. This is the
      // CEILING on how many cascade members may be named at once —
      // collision still decides who prints. 120 clears the biggest
      // family in the vault (Vedic, 97); 0 is the honest zero.
      ['house_name_max',      'House names',   0,    200,  5,     '',   'relabel'],
      ['house_type_scale',    'Type scale',    0.8,  1.6,  0.05,  '×',  'house'],
      // The rank DATE's own stand-off from the cascade's left gutter
      // (the fan crest rides the same dial at its 8/14 ratio).
      ['house_rank_cap_off',  'Date offset',   0,    40,   1,     'px', 'redraw'],
      // The wheel-state "CLICK A FAMILY TITLE — THE HOUSE" line. 0 = the
      // wheel paints byte-identical to before the hint existed.
      ['house_hint_line',     'Way-in hint',   0,    1,    1,     '',   'redraw'],
      // ── the lines ──
      // BONES: resting visibility of the house's own kinship wires (0 =
      // the old invisible slate idle, 1 = full hover-hot). Second parent
      // = how loud a non-primary parent arc is against the spine (1 = the
      // old flat lift). Arc sag = how far a bone bows off its own chord.
      ['house_bones',         'Bone strength', 0,    1,    0.01,  '',   'refocus'],
      ['house_bone_secondary','Second parent', 0,    1,    0.01,  '',   'refocus'],
      ['house_arc_sag',       'Arc sag',       0,    0.5,  0.01,  '',   'redraw'],
      ['house_bone_px',       'Bone width',    0,    6,    0.1,   'px', 'redraw'],
      ['house_veil',          'Veil the rest', 0,    1,    0.01,  '',   'redraw'],
      // ── the feel ──
      ['house_tween_ms',      'Morph time',    200,  800,  10,    'ms', 'redraw'],
      // Exit radius: how far out an empty click must land to leave the
      // house, as a fraction of Rh. 0 restores click-anywhere-to-leave.
      ['house_exit_r',        'Exit radius',   0,    1.4,  0.02,  '×',  'redraw'],
    ];

    // [param, caption, options, apiAfter] — apiAfter defaults to the
    // house MORPH (flipping a layout law tweens a standing house,
    // John's law for geometry flips; it never snaps).
    const RADIOS = [
      // WHICH PACKING LAW places the ranks. 'bed' is the app's shipped
      // law, 'toy' is design/family-tree.html's ratified reference. In
      // CASCADE the flip moves every god in every family (33-76 wu
      // measured); in FAN the two laws only differ where a RANK IS
      // EMPTY (2 of 36 families under Ranks=lineage, 11 of 36 under era).
      ['house_pack',         'Distribution', ['bed', 'toy']],
      ['house_ranks',        'Ranks',        ['lineage', 'era']],
      ['house_orphans',      'Unparented',   ['domain', 'degree']],
      // 'off' is the honest zero: the house holds deities only, exactly
      // as it did on 07-30.
      ['house_rails',        'Show the band', ['on', 'off']],
      ['house_rank_caption', 'Rank caption', ['date', 'gen', 'off'], 'redraw'],
      // FLAT is the ratified default (the toy has zero rotated text);
      // 'curved' stays so John can compare the two with one click.
      ['house_caption_style', 'Captions',    ['flat', 'curved'], 'redraw'],
      // The isolate drags ~4,400 wires between two OTHER families into
      // the house (plus ~2,000 zero-length ones that draw as solid
      // radial spikes off every port). 'off' is the shipped default: a
      // wire between two families neither of which is this house says
      // nothing about this house. Hover still lights a deity's own.
      ['house_rest_wires',   'Rest wires',   ['full', 'stubs', 'off'], 'redraw'],
      // THE TITLE SLOT (re-ratified 2026-07-31): 'center' is the toy's
      // law — over the house, above the 12 o'clock gap, paint-only so
      // it can never push a god. The wave-4 corners stay as dials.
      ['house_title_slot',   'Title spot',   ['center', 'left', 'right'], 'relabel'],
    ];

    // ── THE SECTIONS — his eye, outside in. ALL OPEN. ───────────
    const SECTIONS = [
      { id: 'tree', title: 'The tree — the gods', open: true,
        hint: 'who stands where in the middle, and how big they get',
        items: [
          { k: 'radio',  key: 'house_pack' },
          { k: 'radio',  key: 'house_ranks' },
          { k: 'radio',  key: 'house_orphans' },
          { k: 'slider', key: 'house_god_size' },
          { k: 'slider', key: 'house_spread' },
          { k: 'slider', key: 'house_tree_r' },
          { k: 'slider', key: 'house_bed_chord' },
          { k: 'slider', key: 'house_bed_fill' },
          { k: 'slider', key: 'house_bed_cap' },
        ] },
      { id: 'band', title: 'The band — Scriptorium + Court', open: true,
        hint: 'the ring of books and people around the gods',
        items: [
          { k: 'radio',  key: 'house_rails' },
          { k: 'slider', key: 'house_band_r' },
          { k: 'slider', key: 'house_band_rows' },
          { k: 'slider', key: 'house_band_pitch' },
          { k: 'slider', key: 'house_band_gap' },
          { k: 'slider', key: 'house_band_gap_bot' },
          { k: 'slider', key: 'house_band_head' },
          { k: 'slider', key: 'house_cap_clear' },
          { k: 'slider', key: 'house_rail_glyph' },
          { k: 'slider', key: 'house_rail_cap' },
          { k: 'slider', key: 'house_rail_hit' },
        ] },
      { id: 'ports', title: 'The ports — other families', open: true,
        hint: 'the outer ring you click to travel to another house',
        items: [
          { k: 'slider', key: 'house_port_inset' },
          { k: 'slider', key: 'house_port_hit' },
        ] },
      { id: 'gaps', title: 'The gaps between them', open: true,
        hint: 'clearances nothing may cross, in world units',
        items: [
          { k: 'slider', key: 'house_m_tree' },
          { k: 'slider', key: 'house_m_port' },
          { k: 'slider', key: 'house_m_sub' },
          { k: 'slider', key: 'house_m_glyph' },
        ] },
      { id: 'words', title: 'The words — names, dates, titles', open: true,
        hint: 'every word the house prints',
        items: [
          { k: 'slider', key: 'house_name_max' },
          { k: 'slider', key: 'house_type_scale' },
          { k: 'radio',  key: 'house_rank_caption' },
          { k: 'radio',  key: 'house_caption_style' },
          { k: 'slider', key: 'house_rank_cap_off' },
          { k: 'radio',  key: 'house_title_slot' },
          { k: 'slider', key: 'house_hint_line' },
        ] },
      { id: 'lines', title: 'The lines — kinship + transmission', open: true,
        hint: 'the arcs from parent to child, and the wires to other families',
        items: [
          { k: 'slider', key: 'house_bones' },
          { k: 'slider', key: 'house_bone_secondary' },
          { k: 'slider', key: 'house_arc_sag' },
          { k: 'slider', key: 'house_bone_px' },
          { k: 'radio',  key: 'house_rest_wires' },
          { k: 'slider', key: 'house_veil' },
        ] },
      { id: 'feel', title: 'The feel — motion + the way out', open: true,
        hint: 'how the house moves, and where a click leaves it',
        items: [
          { k: 'slider', key: 'house_tween_ms' },
          { k: 'slider', key: 'house_exit_r' },
        ] },
    ];

    // THE RECIPE LINE — the formal spec of a house, copyable in one
    // click. Carved out of the LAB's line with the dials; the LAB's
    // keeps the node / wire / film terms and no house terms at all.
    function recipeStr() {
      const p = local.params;
      const num = (v, d) => (typeof v === 'number' ? v : d);
      return 'HOUSE RECIPE (live) — layout=' + (p.house_geometry || 'cascade')
        + ' pack=' + (p.house_pack === 'toy' ? 'toy' : 'bed')
        + ' ranks=' + (p.house_ranks === 'era' ? 'era' : 'lineage+era')
        + ' unparented=' + (p.house_orphans || 'domain')
        + ' · TREE god ×' + num(p.house_god_size, 1).toFixed(2)
        + ' spread ' + num(p.house_spread, 1.1).toFixed(2)
        + ' zone ' + num(p.house_tree_r, 0.86).toFixed(2)
        + ' bed ' + num(p.house_bed_chord, 0.74).toFixed(2)
        + '/' + num(p.house_bed_fill, 0.86).toFixed(2)
        + '/' + num(p.house_bed_cap, 0.16).toFixed(3)
        + ' · BAND ' + (p.house_rails === 'off' ? 'off' : 'on')
        + ' r ' + num(p.house_band_r, 0.86).toFixed(2)
        + ' rows ' + Math.round(num(p.house_band_rows, 3))
        + ' pitch ' + Math.round(num(p.house_band_pitch, 16))
        + ' gap ' + Math.round(num(p.house_band_gap, 24))
        + '/' + Math.round(num(p.house_band_gap_bot, 12))
        + ' head ' + Math.round(num(p.house_band_head, 230))
        + ' capcl ' + Math.round(num(p.house_cap_clear, 10))
        + ' item ' + num(p.house_rail_glyph, 0.42).toFixed(2)
        + ' cap ' + Math.round(num(p.house_rail_cap, 120))
        + ' hit ' + num(p.house_rail_hit, 0).toFixed(1)
        + ' · PORTS ring ' + num(p.house_port_inset, 1).toFixed(2)
        + ' hit ' + Math.round(num(p.house_port_hit, 0)) + 'px'
        + ' · MARGINS tree ' + Math.round(num(p.house_m_tree, 16))
        + '/port ' + Math.round(num(p.house_m_port, 12))
        + '/sub ' + num(p.house_m_sub, 3).toFixed(1)
        + '/glyph ' + num(p.house_m_glyph, 3).toFixed(1)
        + ' · WORDS names ' + Math.round(num(p.house_name_max, 120))
        + ' type x' + num(p.house_type_scale, 1).toFixed(2)
        + ' caption ' + (p.house_rank_caption || 'date')
        + ' style ' + (p.house_caption_style === 'curved' ? 'curved' : 'flat')
        + ' date off ' + Math.round(num(p.house_rank_cap_off, 14)) + 'px'
        + ' title ' + (p.house_title_slot === 'left' || p.house_title_slot === 'right'
                        ? p.house_title_slot : 'center')
        + ' hint ' + Math.round(num(p.house_hint_line, 1))
        + ' · BONES ' + num(p.house_bones, 0).toFixed(2)
        + '/2nd ' + num(p.house_bone_secondary, 0).toFixed(2)
        + ' sag ' + num(p.house_arc_sag, 0).toFixed(2)
        + ' ' + num(p.house_bone_px, 0).toFixed(1) + 'px'
        + ' rest-wires ' + (p.house_rest_wires || 'off')
        + ' veil ' + num(p.house_veil, 0.55).toFixed(2)
        + ' · FEEL tween ' + Math.round(num(p.house_tween_ms, 450))
        + ' exit ×' + num(p.house_exit_r, 0).toFixed(2);
    }

    window._forgePanelKit.mount({
      id: 'forge-house-panel',
      title: 'THE HOUSE · LIVE',
      local, api,
      sliders: SLIDERS,
      radios: RADIOS,
      sections: SECTIONS,
      radioAfter: 'houseMorph',
      // Its OWN keys — the LAB's blob cannot collide with these. The
      // one-time import carries over the dials John already tuned while
      // these lived in the LAB, instead of snapping to PARAM_DEFAULTS
      // on the day the panel ships.
      storeKey: 'forge.housePanel.v1',
      openKey:  'forge.housePanel.open.v1',
      seedFrom: 'forge.labRecipe.v1',
      recipe: recipeStr,
      // Restored values reach a house that may already be standing (a
      // view remount while isolated) — re-solve it, and rebuild the
      // label set the paint compares by identity.
      onRestore() { if (api.houseSnap) api.houseSnap(); if (api.relabel) api.relabel(); },
      onReset()   { if (api.houseSnap) api.houseSnap(); if (api.relabel) api.relabel(); },
    });
  }

  window._forgeHousePanel = { attach };
})();
