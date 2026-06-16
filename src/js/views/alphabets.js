// ============================================================
// CODEX ATLAS — ALPHABETS V2 VIEW
// ============================================================
//
// Filed 2026-06-10 per AUDIT/2026-06-10-alphabets-page-plan.md
// (John ratified N1: ALPHABETS is a first-class master-pill
// Section like ATLAS / TIMELINE, showing ALL alphabets).
//
// THREE CLASSES on one Section (the pill's right side, "the usual"):
//   · GLYPHS (default) — the REAL alphabets (per John: "like the
//     PROTOTYPE one"): the 22-letter grid + per-script lead view +
//     the 5-step transmission-chain card. CONTENT harvested from
//     the legacy ALPHA_GLYPH_DATA (the 412 KB hand-curated table);
//     the legacy AESTHETIC is not copied (V2 tokens throughout).
//   · GENEALOGY — the VERTICAL genealogy page (John, 2026-06-10:
//     "the timeline that was before I liked a lot? VERTICAL …
//     JUST BUILD IT properly LIKE we have" — an explicit owner
//     ratification of this bespoke curated surface; it is an
//     ALPHABETS-section page, NOT the global TIMELINE). Stacked
//     writing-system bands, every script a labeled chip, descent
//     béziers, wheel-zoom + drag-pan. Built properly: bands read
//     from the ENGINE's single-source lane map (mode.js
//     ALPHABET_TIMELINE_BANDS — no duplicated grouping, rule #10);
//     dates read live from VAULT_DATA (the 2026-06-10 pipeline
//     rescue feeds all 42).
//   · TIMELINE — hands off to the canonical Forge engine
//     (TIMELINE|Alphabets, dataFit lanes). "KEEP this one as well —
//     this one is a TIMELINE, that's it" (John).
//
// Single source of truth: window.ALPHA_GLYPH_DATA (data-only
// module) for the letters; VAULT_DATA for the genealogy nodes +
// edges; mode.js for the lane map. The legacy origin-chain
// hardcoded graph is NOT read (rule #10).
//
// Boundary contract (public API):
//   window._alphabetsView = {
//     render(pane), unmount(),
//     // app-pill class API (same contract as window._forge):
//     supportedClasses(), getClassFilter(), setClassFilter(v),
//   }
// ============================================================
(function () {
  'use strict';

  let _pane = null;
  let _mode = 'glyphs';               // 'glyphs' | 'genealogy'
  let _script = 'hieroglyph';         // GLYPHS lead script
  let _expandedName = null;           // GLYPHS expanded letter

  // ════════════════════════════════════════════════════════════════
  // GENEALOGY — the vertical page (John-ratified bespoke surface)
  // ════════════════════════════════════════════════════════════════
  // Lanes come from the ENGINE's single source (mode.js
  // ALPHABET_TIMELINE_BANDS) — never duplicated here (rule #10).
  function laneConfig() {
    const M = window.AtlasEngineMode;
    const entry = M && Array.isArray(M.MODES) ? M.MODES.find(m => m.value === 'alphabet') : null;
    const tb = entry && entry.timelineBands;
    if (tb && tb.order && tb.laneOf) return tb;
    return { order: ['WRITING SYSTEMS'], byField: 'script_family', laneOf: {} };
  }

  const DESCENT_TYPES = {
    'ancestor-of': 'fwd', 'parent': 'fwd', 'ancestor': 'fwd',
    'descendant': 'fwd', 'child': 'fwd',
    'descended-from': 'rev', 'adapted-from': 'rev',
  };
  const DASHED_TYPES = { 'sibling': 1, 'sibling-branch': 1, 'parallel-development': 1 };
  const DOTTED_TYPES = { 'influenced-by': 1 };

  function fmtDate(y) {
    if (y == null) return 'undated';
    return y < 0 ? (-y) + ' BCE' : y + ' CE';
  }

  function buildModel() {
    const D = window.VAULT_DATA;
    if (!D || !D.nodes) return null;
    const tb = laneConfig();
    const nodes = D.nodes.filter(n => n.type === 'alphabet').map(n => ({
      id: n.id,
      title: (n.title || n.id).split('—')[0].trim(),
      full: n.title || n.id,
      date: (n.date_earliest != null) ? n.date_earliest : null,
      // single source: the vault-declared script-family token → lane label
      band: tb.laneOf[n[tb.byField || 'script_family']] || 'OTHER',
      color: n.family_color || 'var(--gold)',
    }));
    const byId = {};
    nodes.forEach(n => { byId[n.id] = n; });

    const seen = new Set();
    const edges = [];
    (D.edges || []).forEach(e => {
      const a = byId[e.source], b = byId[e.target];
      if (!a || !b || a === b) return;
      let cls = null, s = a, t = b;
      if (DESCENT_TYPES[e.type]) {
        cls = 'descent';
        if (DESCENT_TYPES[e.type] === 'rev') { s = b; t = a; }
        // Date is the final arbiter (the live data mixes directions).
        if (s.date != null && t.date != null && s.date > t.date) { const tmp = s; s = t; t = tmp; }
      } else if (DASHED_TYPES[e.type]) cls = 'sibling';
      else if (DOTTED_TYPES[e.type]) cls = 'influence';
      else return; // parallel-form / convergence stay off the hero tree
      const key = cls === 'descent' ? (s.id + '→' + t.id) : [s.id, t.id].sort().join('~') + cls;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ s: s, t: t, cls: cls, type: e.type });
    });
    return { nodes: nodes, edges: edges, laneOrder: tb.order.slice() };
  }

  function layoutTree(model, viewW) {
    const PAD_L = 170, PAD_R = 60, ROW_H = 46, BAND_PAD = 26;
    const dates = model.nodes.map(n => n.date).filter(d => d != null);
    const dMin = Math.min.apply(null, dates), dMax = Math.max.apply(null, dates);
    const W = Math.max(viewW, 1500);
    const x = d => PAD_L + ((d - dMin) / (dMax - dMin)) * (W - PAD_L - PAD_R);

    // Fixed lane order from the engine map + any unknown bands appended
    // (future scripts auto-land instead of vanishing).
    const order = model.laneOrder.slice();
    for (const n of model.nodes) if (order.indexOf(n.band) === -1) order.push(n.band);

    let y = 64; // clear the floating app-pill
    const bandsOut = [];
    order.forEach(label => {
      const members = model.nodes.filter(n => n.band === label)
        .sort((a, b) => (a.date ?? 9e9) - (b.date ?? 9e9));
      if (!members.length) return;
      const rows = [];
      members.forEach(n => {
        n.x = n.date != null ? x(n.date) : W - PAD_R;
        let r = rows.findIndex(last => n.x - last > 185);
        if (r === -1) { rows.push(n.x); r = rows.length - 1; }
        else rows[r] = n.x;
        n.y = y + 22 + r * ROW_H;
      });
      const h = 22 + rows.length * ROW_H + BAND_PAD;
      bandsOut.push({ label: label, y: y, h: h });
      y += h;
    });
    return { W: W, H: y + 20, bands: bandsOut };
  }

  // Wheel-zoom (to cursor) + drag-pan + dblclick-reset.
  function wireZoom(svg, W, H) {
    const vb = { x: 0, y: 0, w: W, h: H };
    const apply = () => svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
    apply();

    svg.addEventListener('wheel', e => {
      e.preventDefault();
      const f = Math.exp(e.deltaY * 0.002);
      const newW = Math.min(W * 1.25, Math.max(W / 10, vb.w * f));
      const scale = newW / vb.w;
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;               // degenerate guard
      const cx = vb.x + ((e.clientX - r.left) / r.width) * vb.w;
      const cy = vb.y + ((e.clientY - r.top) / r.height) * vb.h;
      vb.x = cx - (cx - vb.x) * scale;
      vb.y = cy - (cy - vb.y) * scale;
      vb.w = newW; vb.h = vb.h * scale;
      apply();
    }, { passive: false });

    let drag = null;
    svg.addEventListener('pointerdown', e => {
      if (e.target.closest('.alphabets-node')) return;
      drag = { px: e.clientX, py: e.clientY, x: vb.x, y: vb.y };
      svg.setPointerCapture(e.pointerId);
      svg.classList.add('is-panning');
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      vb.x = drag.x - (e.clientX - drag.px) * (vb.w / r.width);
      vb.y = drag.y - (e.clientY - drag.py) * (vb.h / r.height);
      apply();
    });
    const end = () => { drag = null; svg.classList.remove('is-panning'); };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('dblclick', () => { vb.x = 0; vb.y = 0; vb.w = W; vb.h = H; apply(); });
  }

  // ══════════════════════════════════════════════════════════════
  // THE VERTICAL GENEALOGY PAGE — owner-ratified TWICE (2026-06-10
  // "which was BEAUTIFUL layed out" restore a148515b; 2026-06-13 the
  // engine-cascade replacement ac911420 FAILED John's sight test —
  // "the Page that i loved... disappeared? now i got 2 Timelines?" —
  // and this page was restored same day). This bespoke SVG renderer
  // IS the GENEALOGY class surface. Do NOT delete or reroute it to
  // the engine unless an engine version reproduces THIS page's look
  // (portrait descent flow, quiet styling, no timeline chrome) AND
  // John approves it on sight FIRST.
  // ══════════════════════════════════════════════════════════════
  function renderTree(stage) {
    const model = buildModel();
    if (!model) {
      stage.innerHTML = '<div class="alphabets-empty">VAULT_DATA not loaded.</div>';
      return;
    }
    const geo = layoutTree(model, stage.clientWidth || 1500);
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'alphabets-svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    geo.bands.forEach(b => {
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', 0); line.setAttribute('x2', geo.W);
      line.setAttribute('y1', b.y); line.setAttribute('y2', b.y);
      line.setAttribute('class', 'alphabets-band-line');
      svg.appendChild(line);
      const lab = document.createElementNS(NS, 'text');
      lab.setAttribute('x', 14); lab.setAttribute('y', b.y + 16);
      lab.setAttribute('class', 'alphabets-band-label');
      lab.textContent = b.label;
      svg.appendChild(lab);
    });

    model.edges.forEach(e => {
      if (e.s.x == null || e.t.x == null) return;
      const p = document.createElementNS(NS, 'path');
      const mx = (e.s.x + e.t.x) / 2;
      p.setAttribute('d', 'M' + e.s.x + ',' + e.s.y + ' C' + mx + ',' + e.s.y + ' ' + mx + ',' + e.t.y + ' ' + e.t.x + ',' + e.t.y);
      p.setAttribute('class', 'alphabets-edge alphabets-edge-' + e.cls);
      const ti = document.createElementNS(NS, 'title');
      ti.textContent = e.s.title + ' — ' + e.type + ' → ' + e.t.title;
      p.appendChild(ti);
      svg.appendChild(p);
    });

    model.nodes.forEach(n => {
      if (n.x == null) return;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'alphabets-node');
      g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')');
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', 6.5);
      c.setAttribute('style', 'fill:' + n.color);
      g.appendChild(c);
      const t1 = document.createElementNS(NS, 'text');
      t1.setAttribute('class', 'alphabets-node-name');
      t1.setAttribute('x', 10); t1.setAttribute('y', 1);
      t1.textContent = n.title;
      g.appendChild(t1);
      const t2 = document.createElementNS(NS, 'text');
      t2.setAttribute('class', 'alphabets-node-date');
      t2.setAttribute('x', 10); t2.setAttribute('y', 13);
      t2.textContent = fmtDate(n.date);
      g.appendChild(t2);
      const ti = document.createElementNS(NS, 'title');
      ti.textContent = n.full + '\n' + fmtDate(n.date);
      g.appendChild(ti);
      g.addEventListener('click', function () {
        if (window.selectNode) window.selectNode(n.id, true);
      });
      svg.appendChild(g);
    });

    stage.appendChild(svg);
    wireZoom(svg, geo.W, geo.H);

    const hint = document.createElement('div');
    hint.className = 'alphabets-hint';
    hint.textContent = model.nodes.length + ' writing-systems · scroll = zoom · drag = pan · double-click = reset · solid = descent · dashed = sibling · dotted = influence · click a script → its node';
    stage.appendChild(hint);
  }

  // ════════════════════════════════════════════════════════════════
  // GLYPHS (the REAL alphabets; data = ALPHA_GLYPH_DATA)
  // ════════════════════════════════════════════════════════════════
  const SCRIPTS = [
    { id: 'hieroglyph', label: 'Hieroglyph' },
    { id: 'phoenician', label: 'Phoenician' },
    { id: 'hebrew',     label: 'Hebrew' },
    { id: 'arabic',     label: 'Arabic' },
    { id: 'syriac',     label: 'Syriac' },
    { id: 'aramaic',    label: 'Aramaic' },
    { id: 'samaritan',  label: 'Samaritan' },
    { id: 'ugaritic',   label: 'Ugaritic' },
    { id: 'south-arabian', label: 'S. Arabian' },
    { id: 'nabataean',  label: 'Nabataean' },
    { id: 'sogdian',    label: 'Sogdian' },
    { id: 'greek',      label: 'Greek' },
    { id: 'coptic',     label: 'Coptic' },
    { id: 'etruscan',   label: 'Etruscan' },
    { id: 'latin',      label: 'Latin' },
    { id: 'armenian',   label: 'Armenian' },
    { id: 'georgian',   label: 'Georgian' },
    { id: 'glagolitic', label: 'Glagolitic' },
    { id: 'geez',       label: 'Geʿez' },
    { id: 'avestan',    label: 'Avestan' },
    { id: 'brahmi',     label: 'Brahmi' },
    { id: 'tibetan',    label: 'Tibetan' },
    { id: 'mongolian',  label: 'Mongolian' },
    { id: 'cherokee',   label: 'Cherokee' },
    { id: 'ogham',      label: 'Ogham' },
    { id: 'futhark',    label: 'Futhark' },
    { id: 'chinese',    label: 'Chinese' },
    { id: 'japanese',   label: 'Japanese' },
    { id: 'devanagari', label: 'Devanagari' },
    { id: 'hangul',     label: 'Hangul' },
    { id: 'aztec',      label: 'Aztec' },
    { id: 'maya',       label: 'Maya' },
    { id: 'quipu',      label: 'Quipu' },
  ];
  // STANDALONE scripts render ONLY their own scriptOnly records — they do
  // NOT inherit the 22-letter Proto-Sinaitic/Phoenician spine. Ogham and
  // Elder Futhark are independent traditions (Ogham has no Phoenician descent
  // at all; the runic order/forms are their own), so showing the Semitic
  // spine under their chips was inaccurate — they belong here, not on the
  // chain-derived side (hieroglyph/phoenician/hebrew/arabic/greek/latin).
  const STANDALONE = { ogham: 1, futhark: 1, chinese: 1, japanese: 1, devanagari: 1, hangul: 1, aztec: 1, maya: 1, quipu: 1, coptic: 1, georgian: 1, armenian: 1, geez: 1, cherokee: 1, etruscan: 1, ugaritic: 1, glagolitic: 1, avestan: 1, brahmi: 1, tibetan: 1, 'south-arabian': 1, nabataean: 1, sogdian: 1, mongolian: 1 };
  const HIER_FONT = "'Noto Sans Egyptian Hieroglyphs', serif";
  // Syriac (Estrangela) — the Aramaic-branch abjad, 1:1 with the 22-letter spine.
  const SYRIAC = { Aleph:'ܐ', Beth:'ܒ', Gimel:'ܓ', Daleth:'ܕ', He:'ܗ', Waw:'ܘ', Zayin:'ܙ', Heth:'ܚ', Teth:'ܛ', Yod:'ܝ', Kaph:'ܟ', Lamedh:'ܠ', Mem:'ܡ', Nun:'ܢ', Samekh:'ܣ', Ayin:'ܥ', Pe:'ܦ', Tsade:'ܨ', Qoph:'ܩ', Resh:'ܪ', Shin:'ܫ', Taw:'ܬ' };
  // Imperial Aramaic (U+10840) + Samaritan (U+0800) — contiguous abjad blocks, 1:1 with
  // the spine; generated by offset so the codepoints are exact (not hand-typed).
  const SEM_ORDER = ['Aleph','Beth','Gimel','Daleth','He','Waw','Zayin','Heth','Teth','Yod','Kaph','Lamedh','Mem','Nun','Samekh','Ayin','Pe','Tsade','Qoph','Resh','Shin','Taw'];
  function semBlock(base) { const m = {}; SEM_ORDER.forEach((n, i) => { m[n] = String.fromCodePoint(base + i); }); return m; }
  const ARAMAIC = semBlock(0x10840), SAMARITAN = semBlock(0x0800);

  function glyphChar(g, scriptId) {
    switch (scriptId) {
      case 'hieroglyph': return g.unicode ? String.fromCodePoint(g.unicode) : '';
      case 'phoenician': return g.phoenician || '';
      case 'hebrew':     return g.hebrew || '';
      case 'arabic':     return g.arabic || '';
      case 'syriac':     return SYRIAC[g.name] || '';
      case 'aramaic':    return ARAMAIC[g.name] || '';
      case 'samaritan':  return SAMARITAN[g.name] || '';
      case 'greek':      return (g.greek || '').split(' ')[0];
      case 'latin':      return g.letter || '';
      default:           return g.unicode ? String.fromCodePoint(g.unicode) : '';
    }
  }
  function glyphFont(scriptId) {
    switch (scriptId) {
      case 'hieroglyph': return HIER_FONT;
      case 'syriac':     return "'Noto Sans Syriac', serif";
      case 'aramaic':    return "'Noto Sans Imperial Aramaic', serif";
      case 'samaritan':  return "'Noto Sans Samaritan', serif";
      case 'coptic':     return "'Noto Sans Coptic', serif";
      case 'georgian':   return "'Noto Sans Georgian', sans-serif";
      case 'armenian':   return "'Noto Sans Armenian', sans-serif";
      case 'geez':       return "'Noto Sans Ethiopic', serif";
      case 'cherokee':   return "'Noto Sans Cherokee', sans-serif";
      case 'etruscan':   return "'Noto Sans Old Italic', serif";
      case 'ugaritic':   return "'Noto Sans Ugaritic', serif";
      case 'glagolitic': return "'Noto Sans Glagolitic', serif";
      case 'avestan':    return "'Noto Sans Avestan', serif";
      case 'brahmi':     return "'Noto Sans Brahmi', serif";
      case 'tibetan':    return "'Noto Sans Tibetan', serif";
      case 'south-arabian': return "'Noto Sans Old South Arabian', serif";
      case 'nabataean':  return "'Noto Sans Nabataean', serif";
      case 'sogdian':    return "'Noto Sans Sogdian', serif";
      case 'mongolian':  return "'Noto Sans Mongolian', sans-serif";
      default:           return 'inherit';
    }
  }
  function svgGlyph(g, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5">' + g.glyphSVG + '</svg>';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function renderGlyphs(stage) {
    const DATA = window.ALPHA_GLYPH_DATA;
    if (!DATA) {
      stage.innerHTML = '<div class="alphabets-empty">ALPHA_GLYPH_DATA not loaded.</div>';
      return;
    }

    // 2026-06-10 — visible GENEALOGY entry point (John couldn't find it
    // behind the pill's class side). One in-pane chip, same handoff as
    // the pill: the canonical TIMELINE scoped to alphabets with the
    // writing-system lanes.
    const chips = '<div class="alphabets-script-row">'
      + '<button type="button" class="alphabets-script-chip alphabets-genealogy-chip" data-genealogy="1" title="The writing-system genealogy — the vertical descent map of every script">⌁ GENEALOGY</button>'
      + '<span class="alphabets-script-sep" aria-hidden="true"></span>'
      + SCRIPTS.map(s =>
      '<button type="button" class="alphabets-script-chip' + (s.id === _script ? ' is-active' : '') + '" data-script="' + s.id + '">' + s.label + '</button>'
    ).join('') + '</div>';

    const isStandalone = !!STANDALONE[_script];
    let rows = DATA.filter(g => {
      if (isStandalone) return g.scriptOnly && g.scriptOnly.includes(_script);
      if (!g.scriptOnly) return true;
      return g.scriptOnly.includes(_script);
    });
    if (_script === 'latin') {
      rows = rows.filter(g => g.letter && g.letter.trim() !== '')
                 .sort((a, b) => a.letter.localeCompare(b.letter));
    }

    const latinNote = _script === 'latin'
      ? '<div class="alphabets-glyph-note"><b>Latin kept 19 of 22 Phoenician letters.</b> Dropped: Teth, Tsade, Qoph as redundant sounds — added: G (from C), Y + Z (re-borrowed from Greek for loanwords).</div>'
      : '';

    const grid = '<div class="alphabets-glyph-grid">' + rows.map(g => {
      const main = g.glyphSVG ? svgGlyph(g, 'alphabets-glyph-svg') : esc(glyphChar(g, _script));
      return '<button type="button" class="alphabets-glyph-cell' + (g.name === _expandedName ? ' is-open' : '') + '" data-name="' + esc(g.name) + '">'
        + '<span class="alphabets-glyph-char" style="font-family:' + glyphFont(_script) + '">' + main + '</span>'
        + '<span class="alphabets-glyph-name">' + esc(g.name) + '</span>'
        + '<span class="alphabets-glyph-meaning">' + esc(g.meaning) + '</span>'
        + '</button>';
    }).join('') + '</div>';

    stage.innerHTML = chips + latinNote + grid
      + '<div class="alphabets-hint">' + rows.length + ' letters · lead script: ' + esc(_script) + ' · click a letter for its transmission chain</div>';

    stage.querySelectorAll('.alphabets-script-chip[data-script]').forEach(b => {
      b.addEventListener('click', () => { _script = b.dataset.script; _expandedName = null; renderGlyphs(stage); });
    });
    const gen = stage.querySelector('[data-genealogy]');
    if (gen) gen.addEventListener('click', () => {
      if (window._alphabetsView) window._alphabetsView.setClassFilter('genealogy');
    });
    // 2026-06-10 — IN-PLACE expansion (John: "everytime i click it pushes
    // me back to the top of the page losing my path"). The card inserts
    // directly after the clicked cell as a full-width grid row — no grid
    // re-render, no scroll reset.
    function openCard(cell) {
      const old = stage.querySelector('.alphabets-glyph-expanded');
      if (old) old.remove();
      stage.querySelectorAll('.alphabets-glyph-cell.is-open').forEach(c => c.classList.remove('is-open'));
      const name = cell.dataset.name;
      if (_expandedName === name) { _expandedName = null; return; }
      const g = DATA.find(x => x.name === name);
      if (!g) { _expandedName = null; return; }
      _expandedName = name;
      cell.classList.add('is-open');
      const card = buildExpanded(g, () => { _expandedName = null; cell.classList.remove('is-open'); });
      cell.insertAdjacentElement('afterend', card);
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    stage.querySelectorAll('.alphabets-glyph-cell').forEach(b => {
      b.addEventListener('click', () => openCard(b));
    });
    // Restore a previously-open card (e.g. re-entering the view).
    if (_expandedName) {
      const cell = [...stage.querySelectorAll('.alphabets-glyph-cell')].find(c => c.dataset.name === _expandedName);
      if (cell) { _expandedName = null; openCard(cell); }
      else _expandedName = null;
    }
  }

  // Builds + RETURNS the expanded letter-card element. The caller inserts
  // it directly after the clicked cell (full-width grid row) — in-place,
  // no grid re-render, no scroll jump.
  function buildExpanded(g, onClose) {
    const isHier = g.unicode != null && g.unicode >= 0x13000 && g.unicode <= 0x1342F;
    const isScriptOnly = !!(g.scriptOnly && g.scriptOnly.length);
    const safe = v => (!v || v === '(none)') ? '' : v;
    const big = g.glyphSVG ? svgGlyph(g, 'alphabets-glyph-svg alphabets-exp-bigsvg')
      : '<span style="font-family:' + (isHier ? HIER_FONT : 'inherit') + '">'
        + esc(isHier || isScriptOnly ? String.fromCodePoint(g.unicode) : (g.arabic || g.hebrew || g.phoenician || g.letter || '')) + '</span>';
    const gard = g.gardiner ? 'Gardiner ' + esc(g.gardiner) + ' · U+' + (g.unicode || 0).toString(16).toUpperCase()
               : (g.unicode ? 'U+' + g.unicode.toString(16).toUpperCase() : '');

    const chainStep = (ch, label, sub, hier) =>
      '<div class="alphabets-chain-step">'
      + '<span class="alphabets-chain-glyph"' + (hier ? ' style="font-family:' + HIER_FONT + '"' : '') + '>' + esc(ch) + '</span>'
      + '<span class="alphabets-chain-label">' + label + '</span>'
      + '<span class="alphabets-chain-sub">' + sub + '</span></div>';
    const arrow = '<span class="alphabets-chain-arrow">→</span>';
    const hierChar = isHier ? String.fromCodePoint(g.unicode) : '';
    const chain = isScriptOnly
      ? '<div class="alphabets-exp-chainlabel">PICTOGRAPHIC ORIGIN</div>'
      : '<div class="alphabets-exp-chainlabel">TRANSMISSION CHAIN</div>'
        + '<div class="alphabets-chain">'
        + chainStep(hierChar, 'Egyptian', 'c. 2000 BCE', true) + arrow
        + chainStep(hierChar, 'Proto-Sinaitic', 'c. 1850 BCE', true) + arrow
        + chainStep(g.phoenician || '', 'Phoenician', 'c. 1050 BCE') + arrow
        + chainStep((g.greek || '').split(' ')[0], 'Greek', 'c. 800 BCE') + arrow
        + chainStep((g.latin || g.letter || '').split(' ')[0], 'Latin', 'c. 600 BCE+')
        + '</div>';

    const desc = [['Hebrew', g.hebrew], ['Arabic', g.arabic], ['Greek', g.greek], ['Latin', g.latin], ['Sound', g.phoneme]]
      .filter(p => safe(p[1]))
      .map(p => '<span class="alphabets-exp-desc"><b>' + p[0] + '</b> ' + esc(p[1]) + '</span>').join('');

    const related = (g.relatedNodes || []).map(id =>
      '<button type="button" class="alphabets-exp-node" data-id="' + esc(id) + '">' + esc(id.replace(/^alphabet-/, '').replace(/-/g, ' ')) + '</button>'
    ).join('');

    const holder = document.createElement('div');
    holder.innerHTML =
      '<div class="alphabets-glyph-expanded">'
      + '<button type="button" class="alphabets-exp-close" title="Close">✕</button>'
      + '<div class="alphabets-exp-letter">'
      +   '<div class="alphabets-exp-big">' + big + '</div>'
      +   '<div class="alphabets-exp-name">' + esc(g.name) + ' — “' + esc(g.meaning) + '”</div>'
      +   (gard ? '<div class="alphabets-exp-gardiner">' + gard + '</div>' : '')
      +   (desc ? '<div class="alphabets-exp-descs">' + desc + '</div>' : '')
      + '</div>'
      + '<div class="alphabets-exp-chain">' + chain
      +   (g.note ? '<div class="alphabets-exp-note">' + esc(g.note) + '</div>' : '')
      + '</div>'
      + '<div class="alphabets-exp-inv">'
      +   (g.investigationHighlight
          ? '<div class="alphabets-exp-invlabel">WHAT THE INVESTIGATION FOUND</div>'
            + '<div class="alphabets-exp-invtext">' + esc(String(g.investigationHighlight).replace(/^\s*MASSIVE WIN\s*[—–-]\s*/i, '')) + '</div>'
            + (related ? '<div class="alphabets-exp-nodes">' + related + '</div>' : '')
          : '')
      + '</div>'
      + '</div>';

    const card = holder.firstElementChild;
    card.querySelector('.alphabets-exp-close').addEventListener('click', () => {
      card.remove();
      if (onClose) onClose();
    });
    card.querySelectorAll('.alphabets-exp-node[data-id]').forEach(chip => {
      chip.addEventListener('click', e => {
        e.stopPropagation();
        if (window.selectNode) window.selectNode(chip.dataset.id, true);
      });
    });
    return card;
  }

  // ════════════════════════════════════════════════════════════════
  // Mode plumbing + app-pill class API (same contract as _forge)
  // ════════════════════════════════════════════════════════════════
  function renderMode() {
    if (!_pane) return;
    _pane.classList.toggle('is-glyphs', _mode === 'glyphs');
    _pane.classList.toggle('is-genealogy', _mode === 'genealogy');
    const stage = _pane.querySelector('#alphabets-stage');
    if (!stage) return;
    stage.innerHTML = '';
    if (_mode === 'genealogy') renderTree(stage);
    else renderGlyphs(stage);
  }

  function render(pane) {
    if (!pane) return;
    _pane = pane;
    pane.classList.add('alphabets-pane');
    pane.innerHTML = '<div class="alphabets-stage" id="alphabets-stage"></div>';
    renderMode();
  }

  function unmount() { _pane = null; _expandedName = null; }

  window._alphabetsView = {
    render: render,
    unmount: unmount,
    // 2026-06-13 — THE LEFT-PICK IS A LOCK (John): "when you LOCK on
    // the left option it only filters to the right, DOESN'T go back."
    // The right side of a Section NEVER navigates out of it. The
    // 'Timeline' class was REMOVED here for two violations at once:
    // it jumped the master (ALPHABETS → TIMELINE), and it duplicated
    // a page that already exists at TIMELINE → Alphabets/Languages
    // ("if there's a page that is the same then it's a problem").
    // ALPHABETS carries only its own surfaces: Glyphs + Genealogy,
    // both rendered INSIDE this Section. GENEALOGY history: the
    // engine-cascade replacement (ac911420) failed John's sight test
    // ("2 Timelines?") — the bespoke vertical page is the surface,
    // owner-ratified twice; see the banner above renderTree().
    supportedClasses: function () {
      return [
        { value: 'glyphs',    label: 'Glyphs',    glyph: 'ℵ' },
        { value: 'genealogy', label: 'Genealogy', glyph: '⌁' },
      ];
    },
    getClassFilter: function () { return _mode; },
    setClassFilter: function (v) {
      if (v !== 'glyphs' && v !== 'genealogy') return;
      _mode = v;
      renderMode();
      // the pill listens for this to refresh its class label
      try { document.dispatchEvent(new CustomEvent('codex:class-changed')); } catch (e) { /* ignore */ }
    },
  };
})();
