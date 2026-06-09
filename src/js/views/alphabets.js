// ============================================================
// CODEX ATLAS — ALPHABETS V2 VIEW
// ============================================================
//
// Filed 2026-06-10 per AUDIT/2026-06-10-alphabets-page-plan.md
// (John ratified N1: ALPHABETS is a first-class master-pill
// Section like ATLAS / TIMELINE, showing ALL alphabets).
//
// TWO CLASSES on one Section (the pill's right side, "the usual"):
//   · GENEALOGY — the time-on-X tree of ALL type:alphabet nodes
//     read LIVE from VAULT_DATA, wheel-zoom + drag-pan (2026-06-10
//     per John: "I can't zoom in or out like the timeline").
//   · GLYPHS — the REAL alphabets (per John: "like the PROTOTYPE
//     one"): the 22-letter grid + per-script lead view + the
//     5-step transmission-chain card. CONTENT harvested from the
//     legacy ALPHA_GLYPH_DATA (the 412 KB hand-curated table);
//     the legacy AESTHETIC is not copied (V2 tokens throughout).
//
// Single source of truth: window.VAULT_DATA for the tree;
// window.ALPHA_GLYPH_DATA (data-only module) for the letters.
// The legacy origin-chain hardcoded graph is NOT read (rule #10).
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
  let _mode = 'genealogy';            // 'genealogy' | 'glyphs'
  let _script = 'hieroglyph';         // GLYPHS lead script
  let _expandedName = null;           // GLYPHS expanded letter

  // ── Branch bands (display grouping for the tree) ─────────────────
  // VIEW-side display map, never fed to the layout engine (rule #9;
  // the ratified longer-term home is a `script-family:` YAML field).
  const BANDS = [
    { key: 'origins',   label: 'ORIGINS & UNDECIPHERED' },
    { key: 'semitic',   label: 'SEMITIC LINE' },
    { key: 'greek',     label: 'GREEK → EUROPE' },
    { key: 'arabic',    label: 'ARAMAIC → ARABIC & PERSIA' },
    { key: 'asia',      label: 'ASIA' },
    { key: 'americas',  label: 'AMERICAS & PACIFIC' },
    { key: 'mysticism', label: 'LETTER MYSTICISM & FINDINGS' },
  ];
  const BAND_OF = {
    'alphabet-cuneiform-sacred': 'origins',
    'alphabet-medu-netjer': 'origins',
    'alphabet-indus-valley-script': 'origins',
    'alphabet-proto-elamite': 'origins',
    'alphabet-linear-a': 'origins',
    'alphabet-proto-sinaitic': 'semitic',
    'alphabet-ugaritic': 'semitic',
    'alphabet-phoenician': 'semitic',
    'alphabet-hebrew-aleph-bet': 'semitic',
    'alphabet-aramaic': 'semitic',
    'alphabet-syriac': 'semitic',
    'alphabet-south-arabian': 'semitic',
    'alphabet-geez-ethiopic': 'semitic',
    'alphabet-greek-vowel-revolution': 'greek',
    'alphabet-latin': 'greek',
    'alphabet-coptic': 'greek',
    'alphabet-glagolitic-cyrillic': 'greek',
    'alphabet-elder-futhark': 'greek',
    'alphabet-ogham': 'greek',
    'alphabet-armenian': 'greek',
    'alphabet-georgian': 'greek',
    'alphabet-arabic-quran': 'arabic',
    'alphabet-arabic-calligraphy': 'arabic',
    'alphabet-quran-sacred-language': 'arabic',
    'alphabet-huruf-muqattaat': 'arabic',
    'alphabet-avestan': 'arabic',
    'alphabet-brahmi-origin': 'asia',
    'alphabet-devanagari-sacred': 'asia',
    'alphabet-tibetan-tantric': 'asia',
    'alphabet-chinese-oracle-bones': 'asia',
    'alphabet-hangul': 'asia',
    'alphabet-mayan-glyphs': 'americas',
    'alphabet-cherokee': 'americas',
    'alphabet-rongorongo': 'americas',
    'alphabet-creation-by-word': 'mysticism',
    'alphabet-letter-as-cosmos': 'mysticism',
    'alphabet-sacred-language-convergence': 'mysticism',
    'alphabet-isopsephy-greek': 'mysticism',
    'alphabet-gematria-hebrew': 'mysticism',
    'alphabet-sefer-yetzirah': 'mysticism',
    'alphabet-ilm-al-huruf': 'mysticism',
    'alphabet-masoretes': 'mysticism',
  };

  // Display-position fallbacks for nodes whose vault YAML has no date
  // yet (render position ONLY — Lane-A backlog; standard reference dates).
  const DATE_FALLBACK = {
    'alphabet-proto-elamite': -3100,
    'alphabet-linear-a': -1800,
    'alphabet-aramaic': -900,
    'alphabet-syriac': 100,
    'alphabet-armenian': 405,
    'alphabet-georgian': 430,
    'alphabet-glagolitic-cyrillic': 863,
    'alphabet-hangul': 1443,
    'alphabet-rongorongo': 1700,
    'alphabet-cherokee': 1821,
  };

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

  // ════════════════════════════════════════════════════════════════
  // CLASS 1 — GENEALOGY (the tree)
  // ════════════════════════════════════════════════════════════════
  function buildModel() {
    const D = window.VAULT_DATA;
    if (!D || !D.nodes) return null;
    const nodes = D.nodes.filter(n => n.type === 'alphabet').map(n => ({
      id: n.id,
      title: (n.title || n.id).split('—')[0].trim(),
      full: n.title || n.id,
      date: (n.date_earliest != null) ? n.date_earliest : (DATE_FALLBACK[n.id] != null ? DATE_FALLBACK[n.id] : null),
      dateIsFallback: n.date_earliest == null && DATE_FALLBACK[n.id] != null,
      band: BAND_OF[n.id] || 'origins',
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
      else return; // parallel-form / convergence etc. → later phases
      const key = cls === 'descent' ? (s.id + '→' + t.id) : [s.id, t.id].sort().join('~') + cls;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ s: s, t: t, cls: cls, type: e.type });
    });
    return { nodes: nodes, edges: edges };
  }

  function layout(model, viewW) {
    const PAD_L = 170, PAD_R = 60, ROW_H = 46, BAND_PAD = 26;
    const dates = model.nodes.map(n => n.date).filter(d => d != null);
    const dMin = Math.min.apply(null, dates), dMax = Math.max.apply(null, dates);
    const W = Math.max(viewW, 1500);
    const x = d => PAD_L + ((d - dMin) / (dMax - dMin)) * (W - PAD_L - PAD_R);

    let y = 64; // clear the floating app-pill — first band label stays readable
    const bandsOut = [];
    BANDS.forEach(band => {
      const members = model.nodes.filter(n => n.band === band.key)
        .sort((a, b) => (a.date ?? 9e9) - (b.date ?? 9e9));
      if (!members.length) return;
      const rows = [];
      members.forEach(n => {
        n.x = n.date != null ? x(n.date) : W - PAD_R;
        let r = rows.findIndex(last => n.x - last > 185); // gap covers the longest labels
        if (r === -1) { rows.push(n.x); r = rows.length - 1; }
        else rows[r] = n.x;
        n.y = y + 22 + r * ROW_H;
      });
      const h = 22 + rows.length * ROW_H + BAND_PAD;
      bandsOut.push({ label: band.label, y: y, h: h });
      y += h;
    });
    return { W: W, H: y + 20, bands: bandsOut };
  }

  // Wheel-zoom (to cursor) + drag-pan + dblclick-reset on the tree svg —
  // the TIMELINE-style camera John asked for (2026-06-10).
  function wireZoom(svg, W, H) {
    const vb = { x: 0, y: 0, w: W, h: H };
    const apply = () => svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
    apply();

    svg.addEventListener('wheel', e => {
      e.preventDefault();
      const f = Math.exp(e.deltaY * 0.002);                  // >1 = zoom out
      const newW = Math.min(W * 1.25, Math.max(W / 10, vb.w * f));
      const scale = newW / vb.w;
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;                     // degenerate viewport guard
      const cx = vb.x + ((e.clientX - r.left) / r.width) * vb.w;
      const cy = vb.y + ((e.clientY - r.top) / r.height) * vb.h;
      vb.x = cx - (cx - vb.x) * scale;
      vb.y = cy - (cy - vb.y) * scale;
      vb.w = newW; vb.h = vb.h * scale;
      apply();
    }, { passive: false });

    let drag = null;
    svg.addEventListener('pointerdown', e => {
      if (e.target.closest('.alphabets-node')) return;       // node clicks stay clicks
      drag = { px: e.clientX, py: e.clientY, x: vb.x, y: vb.y };
      svg.setPointerCapture(e.pointerId);
      svg.classList.add('is-panning');
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      const r = svg.getBoundingClientRect();
      vb.x = drag.x - (e.clientX - drag.px) * (vb.w / r.width);
      vb.y = drag.y - (e.clientY - drag.py) * (vb.h / r.height);
      apply();
    });
    const end = e => { drag = null; svg.classList.remove('is-panning'); };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('dblclick', () => { vb.x = 0; vb.y = 0; vb.w = W; vb.h = H; apply(); });
  }

  function renderTree(stage) {
    const model = buildModel();
    if (!model) {
      stage.innerHTML = '<div class="alphabets-empty">VAULT_DATA not loaded.</div>';
      return;
    }
    const geo = layout(model, stage.clientWidth || 1500);
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
      t2.textContent = fmtDate(n.date) + (n.dateIsFallback ? ' *' : '');
      g.appendChild(t2);
      const ti = document.createElementNS(NS, 'title');
      ti.textContent = n.full + '\n' + fmtDate(n.date) + (n.dateIsFallback ? ' (display fallback — vault date pending)' : '');
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
    hint.textContent = model.nodes.length + ' writing-systems · scroll = zoom · drag = pan · double-click = reset · solid = descent · dashed = sibling · dotted = influence · * = display date pending vault fill · click a script → its node';
    stage.appendChild(hint);
  }

  // ════════════════════════════════════════════════════════════════
  // CLASS 2 — GLYPHS (the REAL alphabets; data = ALPHA_GLYPH_DATA)
  // ════════════════════════════════════════════════════════════════
  const SCRIPTS = [
    { id: 'hieroglyph', label: 'Hieroglyph' },
    { id: 'phoenician', label: 'Phoenician' },
    { id: 'hebrew',     label: 'Hebrew' },
    { id: 'arabic',     label: 'Arabic' },
    { id: 'greek',      label: 'Greek' },
    { id: 'latin',      label: 'Latin' },
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
  const STANDALONE = { chinese: 1, japanese: 1, devanagari: 1, hangul: 1, aztec: 1, maya: 1, quipu: 1 };
  const HIER_FONT = "'Noto Sans Egyptian Hieroglyphs', serif";

  function glyphChar(g, scriptId) {
    switch (scriptId) {
      case 'hieroglyph': return g.unicode ? String.fromCodePoint(g.unicode) : '';
      case 'phoenician': return g.phoenician || '';
      case 'hebrew':     return g.hebrew || '';
      case 'arabic':     return g.arabic || '';
      case 'greek':      return (g.greek || '').split(' ')[0];
      case 'latin':      return g.letter || '';
      default:           return g.unicode ? String.fromCodePoint(g.unicode) : '';
    }
  }
  function glyphFont(scriptId) {
    return scriptId === 'hieroglyph' ? HIER_FONT : 'inherit';
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

    const chips = '<div class="alphabets-script-row">' + SCRIPTS.map(s =>
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

    stage.innerHTML = chips + latinNote + '<div class="alphabets-glyph-expand-slot"></div>' + grid
      + '<div class="alphabets-hint">' + rows.length + ' letters · lead script: ' + esc(_script) + ' · click a letter for its transmission chain</div>';

    stage.querySelectorAll('.alphabets-script-chip').forEach(b => {
      b.addEventListener('click', () => { _script = b.dataset.script; _expandedName = null; renderGlyphs(stage); });
    });
    stage.querySelectorAll('.alphabets-glyph-cell').forEach(b => {
      b.addEventListener('click', () => {
        _expandedName = (_expandedName === b.dataset.name) ? null : b.dataset.name;
        renderGlyphs(stage);
        if (_expandedName) renderExpanded(stage, DATA.find(g => g.name === _expandedName));
      });
    });
    if (_expandedName) {
      const g = DATA.find(x => x.name === _expandedName);
      if (g) renderExpanded(stage, g);
    }
  }

  function renderExpanded(stage, g) {
    if (!g) return;
    const slot = stage.querySelector('.alphabets-glyph-expand-slot');
    if (!slot) return;
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

    slot.innerHTML =
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
            + '<div class="alphabets-exp-invtext">' + esc(g.investigationHighlight) + '</div>'
            + (related ? '<div class="alphabets-exp-nodes">' + related + '</div>' : '')
          : '')
      + '</div>'
      + '</div>';

    slot.querySelector('.alphabets-exp-close').addEventListener('click', () => {
      _expandedName = null;
      renderGlyphs(stage);
    });
    slot.querySelectorAll('.alphabets-exp-node[data-id]').forEach(chip => {
      chip.addEventListener('click', e => {
        e.stopPropagation();
        if (window.selectNode) window.selectNode(chip.dataset.id, true);
      });
    });
    slot.scrollIntoView({ block: 'nearest' });
  }

  // ════════════════════════════════════════════════════════════════
  // Mode plumbing + app-pill class API (same contract as _forge)
  // ════════════════════════════════════════════════════════════════
  function renderMode() {
    if (!_pane) return;
    _pane.classList.toggle('is-glyphs', _mode === 'glyphs');
    const stage = _pane.querySelector('#alphabets-stage');
    if (!stage) return;
    stage.innerHTML = '';
    if (_mode === 'glyphs') renderGlyphs(stage);
    else renderTree(stage);
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
    supportedClasses: function () {
      return [
        { value: 'genealogy', label: 'Genealogy', glyph: '⌁' },
        { value: 'glyphs',    label: 'Glyphs',    glyph: 'ℵ' },
      ];
    },
    getClassFilter: function () { return _mode; },
    setClassFilter: function (v) {
      if (v !== 'genealogy' && v !== 'glyphs') return;
      _mode = v;
      renderMode();
      // the pill listens for this to refresh its class label
      try { document.dispatchEvent(new CustomEvent('codex:class-changed')); } catch (e) { /* ignore */ }
    },
  };
})();
