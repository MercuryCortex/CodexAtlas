// ============================================================
// CODEX ATLAS — ALPHABETS V2 VIEW
// ============================================================
//
// Filed 2026-06-10 per AUDIT/2026-06-10-alphabets-page-plan.md
// (John ratified N1: ALPHABETS is a first-class master-pill
// Section like ATLAS / TIMELINE, showing ALL alphabets).
//
// Phase 0 — carve-step skeleton (pane mounts + routes, clean dark
//           stage, zero legacy chrome).
// Phase 1 — the genealogy tree (hero): ALL type:alphabet nodes from
//           the live VAULT_DATA, time on X, branch bands on Y,
//           descent edges normalized older→younger (§4.4 of the
//           plan), click-through to the global detail panel via
//           window.selectNode. SVG (few-large elements — the
//           canonical "stay SVG" case).
//
// Single source of truth: window.VAULT_DATA. The legacy
// origin-chain.js hardcoded NODES/EDGES are deliberately NOT
// read (two-sources-of-truth, rule #10).
//
// Boundary contract (public API):
//   window._alphabetsView = { render(pane), unmount() }
//
// VIEWS.alphabets in src/js/app.js delegates to render(pane).
// ============================================================
(function () {
  'use strict';

  let _pane = null;

  // ── Branch bands (display grouping for Phase 1) ─────────────────
  // NOTE: this is a VIEW-side display map, never fed to the layout
  // engine (rule #9 — the wheel's spread gets a declared groupBy when
  // Phase 3 lands; the ratified longer-term home is a `script-family:`
  // YAML field on the 11_alphabets nodes — Lane A backlog).
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
  // yet (render position ONLY — flagged as Lane-A backlog in the plan;
  // standard reference dates, not vault data).
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

  // Descent-edge classification (§4.4 normalization).
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

    // Collect alphabet↔alphabet edges; normalize descent older→younger.
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

  // ── Layout: x = time, y = branch band with greedy sub-rows ───────
  function layout(model, viewW) {
    const PAD_L = 170, PAD_R = 60, ROW_H = 46, BAND_PAD = 26;
    const dates = model.nodes.map(n => n.date).filter(d => d != null);
    const dMin = Math.min.apply(null, dates), dMax = Math.max.apply(null, dates);
    const W = Math.max(viewW, 1500);
    const x = d => PAD_L + ((d - dMin) / (dMax - dMin)) * (W - PAD_L - PAD_R);

    let y = 64; // clear the floating app-pill — first band label must stay readable
    const bandsOut = [];
    BANDS.forEach(band => {
      const members = model.nodes.filter(n => n.band === band.key)
        .sort((a, b) => (a.date ?? 9e9) - (b.date ?? 9e9));
      if (!members.length) return;
      const rows = []; // greedy interval rows to avoid label overlap
      members.forEach(n => {
        n.x = n.date != null ? x(n.date) : W - PAD_R;
        let r = rows.findIndex(last => n.x - last > 185); // gap covers the longest label widths
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
    svg.setAttribute('width', geo.W);
    svg.setAttribute('height', geo.H);
    svg.setAttribute('viewBox', '0 0 ' + geo.W + ' ' + geo.H);

    // Band separators + labels
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

    // Edges under nodes. Descent = solid bézier; sibling = dashed; influence = dotted.
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

    // Node chips: dot + name + date; click → global detail panel.
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

    const hint = document.createElement('div');
    hint.className = 'alphabets-hint';
    hint.textContent = model.nodes.length + ' writing-systems · solid = descent · dashed = sibling · dotted = influence · * = display date pending vault fill · click a script → its node';
    stage.appendChild(hint);
  }

  function render(pane) {
    if (!pane) return;
    _pane = pane;
    pane.classList.add('alphabets-pane');
    pane.innerHTML = '<div class="alphabets-stage" id="alphabets-stage"></div>';
    renderTree(pane.querySelector('#alphabets-stage'));
  }

  function unmount() { _pane = null; }

  window._alphabetsView = { render: render, unmount: unmount };
})();
