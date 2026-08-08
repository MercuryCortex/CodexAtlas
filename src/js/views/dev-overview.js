// ============================================================
// CODEX ATLAS — DEV OVERVIEW PANEL
// ============================================================
// Operator-facing macro view of vault coverage. Surfaces:
//   • per-lens count vs scholarly baseline + health band
//   • per-family count vs scholarly baseline + health band
//   • methodology + caveats inline
//   • top unmatched-tradition values (data-hygiene signal)
//
// ⚠️ LAUNCHED FROM: the DEV drawer → "Overview" (bottom-right of the
// map → DEV → Overview). This comment used to say `✦ user-menu → Dev →
// Overview`, which is where it lived BEFORE the dev-drawer refactor —
// and that stale line cost a real search on 2026-08-07 when John could
// not find this panel and neither could an agent reading this file.
// The wiring is in src/js/forge/dev-drawer.js (data-dev-panel="overview").
// IF YOU MOVE A SURFACE, MOVE ITS "how do I get here" LINE IN THE SAME
// COMMIT — see 00_meta/WHERE-THINGS-LIVE.md.
// Self-contained overlay. Reuses canonical theme CSS vars
// (--bg-1, --text-1, --gold, --mono, etc) per SEVERITY DOGMA.
// ESC + click-outside + close-button all close.
//
// Data source: `src/data/health-index.json`, rebuilt via
// `python3 scripts/build_health_index.py`. The build script
// is the SSOT — never duplicate baseline numbers here.
//
// Health bands (matched in build_health_index.py):
//   anemic        ratio < 25%       red
//   developing    ratio 25%–60%     amber
//   rich          ratio 60%–150%    green
//   over-baseline ratio > 150%      blue (Atlas-original)
// ============================================================
(function () {
  'use strict';

  const STATE = { cache: null, bench: null, docBench: null, host: null, isOpen: false };

  window._devOverview = {
    open:  openPanel,
    close: closePanel,
    isOpen: () => STATE.isOpen,
  };

  function openPanel() {
    if (STATE.isOpen) return;
    STATE.isOpen = true;
    if (!STATE.host) buildHost();
    STATE.host.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    // Always re-fetch on open. The vault is mutated by background goblin
    // fleets between opens; in-memory caching would surface stale numbers.
    // If we already have a cache, render it immediately as a placeholder
    // so the panel isn't blank during the re-fetch round-trip.
    if (STATE.cache) render(STATE.cache); else renderLoading();
    fetchData().then(render).catch(err => { if (!STATE.cache) renderError(err); });
  }
  function closePanel() {
    if (!STATE.isOpen) return;
    STATE.isOpen = false;
    if (STATE.host) STATE.host.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function buildHost() {
    const host = document.createElement('div');
    host.id = 'dev-overview-host';
    host.className = 'dev-overview-host';
    host.innerHTML = [
      '<div class="dev-overview-backdrop" data-action="close"></div>',
      '<div class="dev-overview-pane" role="dialog" aria-label="Codex Atlas — Dev Overview">',
        '<div class="dev-overview-topbar">',
          '<div class="dev-overview-title">',
            '<span class="dev-overview-title-glyph">⚙</span>',
            '<span class="dev-overview-title-text">DEV OVERVIEW</span>',
            '<span class="dev-overview-title-hint">vault coverage · scholarly ballpark</span>',
          '</div>',
          '<button class="dev-overview-close" type="button" data-action="close" aria-label="Close">✕</button>',
        '</div>',
        '<div class="dev-overview-body"></div>',
      '</div>',
    ].join('');
    document.body.appendChild(host);
    STATE.host = host;

    host.addEventListener('click', (ev) => {
      const t = ev.target.closest('[data-action]');
      if (t && t.getAttribute('data-action') === 'close') closePanel();
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && STATE.isOpen) closePanel();
    });
  }

  function fetchData() {
    const health = fetch('src/data/health-index.json?_=' + Date.now(), { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    // Benchmark is optional — never let its absence break the panel.
    const bench = fetch('src/data/deity-product-grade.json?_=' + Date.now(), { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    const docBench = fetch('src/data/document-product-grade.json?_=' + Date.now(), { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    // The COMPLETENESS bar — wire-endpoint coverage (does the investigation's
    // wiring have both ends?). Distinct from the product-grade QUALITY bars
    // above, which are blind to a missing node. Rebuilt via
    // `python3 scripts/audit_wire_coverage.py`.
    const wireCov = fetch('src/data/wire-coverage.json?_=' + Date.now(), { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    // The SCRIPTURE completeness bar — per-canon book coverage (is the canon
    // WHOLE, or a curated selection?). Sibling of wire-coverage; the quality
    // scorecards are blind to a missing book. Rebuilt via
    // `python3 scripts/audit_scripture_coverage.py`.
    const scriptureCov = fetch('src/data/scripture-coverage.json?_=' + Date.now(), { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    // Deity transmission ranking + civilization-lens reach heatmap. Rebuilt via
    // `python3 scripts/build_transmission_ranking.py`.
    const transmission = fetch('src/data/transmission-ranking.json?_=' + Date.now(), { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    return Promise.all([health, bench, docBench, wireCov, scriptureCov, transmission]).then(([d, b, db, wc, sc, tr]) => {
      STATE.cache = d; STATE.bench = b; STATE.docBench = db; STATE.wireCov = wc; STATE.scriptureCov = sc; STATE.transmission = tr; return d;
    });
  }

  function renderLoading() {
    STATE.host.querySelector('.dev-overview-body').innerHTML =
      '<div class="dev-overview-loading">Loading vault coverage data…</div>';
  }
  function renderError(err) {
    STATE.host.querySelector('.dev-overview-body').innerHTML =
      '<div class="dev-overview-error">'
      + '<h3>Couldn\'t load health index</h3>'
      + '<p>' + escapeHtml(err && err.message || String(err)) + '</p>'
      + '<p>Rebuild via <code>python3 scripts/build_health_index.py</code>.</p>'
      + '</div>';
  }

  function render(d) {
    const body = STATE.host.querySelector('.dev-overview-body');
    const totalBaseline = d.lenses.reduce((s, L) => s + (L.baseline || 0), 0);
    const overallPct = totalBaseline ? Math.round(d.vault.totalNodes / totalBaseline * 100) : 0;
    const lensBands = countBands(d.lenses);
    body.innerHTML = [
      renderTransmissionRanking(STATE.transmission),
      renderDeityBenchmark(STATE.bench),
      renderDocumentBenchmark(STATE.docBench),
      renderWireCoverage(STATE.wireCov),
      renderScriptureCoverage(STATE.scriptureCov),
      renderSummary(d, overallPct, totalBaseline, lensBands),
      renderLenses(d.lenses),
      renderFamilies(d.families),
      renderMethodology(d.methodology, d.unmatchedTraditionsTop || []),
      renderFooter(d),
    ].join('');
  }

  // ── DEITY TRANSMISSION RANKING (civilization-lens reach heatmap) ────────
  // The top-10 deities by transmission score, and how far each root's branch
  // reaches into the 9 "civilization" lenses (law/phil/math/med/astr/div/cal/
  // mus/alch) — the lenses that discriminate (the mythology spine is dense for
  // all). Reach = mention-count LOWER BOUND. Data: src/data/transmission-ranking.json
  // (rebuilt via `python3 scripts/build_transmission_ranking.py`).
  function renderTransmissionRanking(t) {
    if (!t || !Array.isArray(t.roots) || !t.roots.length) return '';
    const keys = t.lensKeys || ['law','phil','math','med','astr','div','cal','mus','alch'];
    // heatmap cell — blue sequential ramp, bucketed. Fills are light so dark
    // text reads; the two darkest buckets flip to white text.
    const cell = (n) => {
      n = n || 0;
      let bg, fg;
      if (n === 0)      { bg = 'transparent';        fg = 'var(--text-3, #7a756a)'; }
      else if (n <= 2)  { bg = '#E6F1FB'; fg = '#0C447C'; }
      else if (n <= 6)  { bg = '#B5D4F4'; fg = '#042C53'; }
      else if (n <= 14) { bg = '#378ADD'; fg = '#ffffff'; }
      else              { bg = '#185FA5'; fg = '#ffffff'; }
      return '<td style="background:' + bg + ';color:' + fg + ';text-align:center;'
        + 'font-variant-numeric:tabular-nums;padding:6px 0;border-radius:3px;font-size:12px;">'
        + (n === 0 ? '·' : n) + '</td>';
    };
    const head = '<tr>'
      + '<th style="text-align:left;">root</th>'
      + '<th style="text-align:center;" title="rank by transmission score">t-rank</th>'
      + '<th style="text-align:center;" title="sum of the 9 civilization-lens reach counts">civ</th>'
      + keys.map(k => '<th style="text-align:center;">' + escapeHtml(k) + '</th>').join('')
      + '</tr>';
    const rows = t.roots.map((r, i) => {
      const nm = String(r.name || r.slug).replace(/\s*\(.*$/, '');
      const lead = i === 0;
      return '<tr>'
        + '<td style="text-align:left;white-space:nowrap;' + (lead ? 'font-weight:500;' : '') + '">'
        +   escapeHtml(nm)
        +   '<span class="dev-overview-cell-sub"> ' + escapeHtml(String(r.tradition || '').split(/[(—;,/]/)[0].trim()) + '</span>'
        + '</td>'
        + '<td style="text-align:center;color:var(--text-2,#a89);font-variant-numeric:tabular-nums;">#' + (r.transmissionRank || (i + 1)) + '</td>'
        + '<td style="text-align:center;font-weight:500;font-variant-numeric:tabular-nums;">' + (r.civScore || 0) + '</td>'
        + keys.map(k => cell(r.lenses && r.lenses[k])).join('')
        + '</tr>';
    }).join('');
    const legend = ['0','1–2','3–6','7–14','15+'];
    const legBg = ['transparent','#E6F1FB','#B5D4F4','#378ADD','#185FA5'];
    const legendHtml = legend.map((lb, i) =>
      '<span style="display:inline-flex;align-items:center;gap:5px;margin-right:12px;">'
      + '<span style="width:13px;height:13px;border-radius:3px;background:' + legBg[i]
      + (i === 0 ? ';border:1px solid var(--line,#443)' : '') + ';display:inline-block;"></span>'
      + escapeHtml(lb) + '</span>').join('');
    return ''
      + '<section class="dev-overview-section dev-overview-summary">'
      +   '<h2 class="dev-overview-section-h">🧬 Deity transmission ranking '
      +     '<span class="dev-overview-h-hint">top-10 roots · civilization-lens reach</span></h2>'
      +   '<div class="dev-overview-cell-sub" style="margin:0 0 10px;line-height:1.6;">'
      +     'Each cell = how many nodes in that lens the root&rsquo;s branch reaches (grep-verified mention count; a lower bound). '
      +     'The mythology spine (deities, themes, symbols) is dense for every root and omitted — this shows only where the branches differ. '
      +     'Sorted by civilization-lens reach. Three roots (Indra, Hermes, Jesus) carry the exact sciences; the rest are mostly spine.'
      +   '</div>'
      +   '<div style="font-size:11px;color:var(--text-2,#a89);margin:0 0 10px;">reach: ' + legendHtml + '</div>'
      +   '<div class="dev-overview-table-wrap">'
      +     '<table class="dev-overview-table dev-overview-heatmap" style="border-collapse:separate;border-spacing:3px;">'
      +       '<thead>' + head + '</thead>'
      +       '<tbody>' + rows + '</tbody>'
      +     '</table>'
      +   '</div>'
      +   '<div class="dev-overview-cell-sub" style="margin-top:8px;">'
      +     'transmission score = sourced cross-tradition edges + 1.5&times;distinct-traditions-reached + 0.5&times;equivalents. '
      +     'As of ' + escapeHtml(t.generatedAt || '') + ' · rebuild: <code>python3 scripts/build_transmission_ranking.py</code>'
      +   '</div>'
      + '</section>';
  }

  // ── DEITY PRODUCT-GRADE BENCHMARK ──────────────────────────────────────
  // The current north-star bar: deities are the root layer; everything stems
  // from here. Each row must go green (target met) before the layer is
  // "product-grade". Data: src/data/deity-product-grade.json
  // (rebuilt via `python3 scripts/audit_deity_quality.py`).
  function renderDeityBenchmark(b) {
    if (!b || !b.rows) return '';
    const pass = b.passCount, total = b.rowCount;
    const pg = !!b.productGrade;
    const barW = total ? Math.round(pass / total * 100) : 0;
    const baseline = b.baseline || {};
    const rows = b.rows.map(r => {
      const band = r.ok ? 'rich' : 'anemic';
      const traj = (baseline[r.key] != null && !r.ok)
        ? '<span class="dev-overview-cell-sub">was ' + escapeHtml(String(baseline[r.key])) + ' → now ' + escapeHtml(r.current) + '</span>'
        : (baseline[r.key] != null && r.ok)
          ? '<span class="dev-overview-cell-sub">' + escapeHtml(String(baseline[r.key])) + ' → ' + escapeHtml(r.current) + '</span>'
          : '';
      return ''
        + '<tr class="dev-overview-row dev-overview-row--' + band + '">'
        +   '<td class="dev-overview-col-label">'
        +     '<div class="dev-overview-cell-main">' + escapeHtml(r.label) + '</div>'
        +     (r.detail ? '<div class="dev-overview-cell-sub">' + escapeHtml(r.detail) + '</div>' : '')
        +   '</td>'
        +   '<td class="dev-overview-col-num">' + escapeHtml(r.current) + '</td>'
        +   '<td class="dev-overview-col-num dev-overview-col-base">' + escapeHtml(r.target) + '</td>'
        +   '<td class="dev-overview-col-statuses">' + traj + '</td>'
        +   '<td class="dev-overview-col-band">'
        +     '<span class="dev-overview-band-pill" data-band="' + band + '">' + (r.ok ? 'PASS' : 'OPEN') + '</span>'
        +   '</td>'
        + '</tr>';
    }).join('');
    return ''
      + '<section class="dev-overview-section dev-overview-summary">'
      +   '<h2 class="dev-overview-section-h">🎯 Deity product-grade benchmark '
      +     '<span class="dev-overview-h-hint">the root layer — everything stems from here</span></h2>'
      +   '<div class="dev-overview-stat-grid">'
      +     stat(pass + '<span class="dev-overview-stat-unit">/' + total + '</span>', pg ? 'ROWS GREEN — PRODUCT-GRADE ✓' : 'rows green (target ' + total + '/' + total + ')')
      +     stat(num(b.totalDeities), 'Deities')
      +     stat(escapeHtml(b.generatedAt || ''), 'As of')
      +   '</div>'
      +   '<div class="dev-overview-band-strip">'
      +     '<div class="dev-overview-bar" data-band="' + (pg ? 'rich' : 'developing') + '" style="flex:1">'
      +       '<div class="dev-overview-bar-fill" style="width:' + barW + '%"></div>'
      +       '<div class="dev-overview-bar-100"></div>'
      +     '</div>'
      +     '<span class="dev-overview-band-strip-lbl">' + (pg ? 'all rows green' : (total - pass) + ' rows still open') + '</span>'
      +   '</div>'
      +   '<div class="dev-overview-table-wrap">'
      +     '<table class="dev-overview-table">'
      +       '<thead><tr>'
      +         '<th>Quality dimension</th>'
      +         '<th class="dev-overview-col-num">Current</th>'
      +         '<th class="dev-overview-col-num">Target</th>'
      +         '<th>Trajectory</th>'
      +         '<th>Status</th>'
      +       '</tr></thead>'
      +       '<tbody>' + rows + '</tbody>'
      +     '</table>'
      +   '</div>'
      + '</section>';
  }

  // ── COMPLETENESS — WIRE-ENDPOINT COVERAGE ──────────────────────────────
  // The SECOND bar. The product-grade benchmarks grade the nodes that EXIST and
  // are blind to a MISSING node — so a cross-tradition wire can be unbuildable
  // (one endpoint absent) while everything reads green. This measures whether
  // the investigation's wiring has both ends. Data: src/data/wire-coverage.json
  // (rebuilt via `python3 scripts/audit_wire_coverage.py`).
  function renderWireCoverage(w) {
    if (!w || !w.neighborhoods) return '';
    const whole = w.neighborhoods.filter(n => n.whole).length;
    const total = w.neighborhoods.length;
    const allWhole = !!w.neighborhoodsWhole;
    const rows = w.neighborhoods.map(n => {
      const band = n.whole ? 'rich' : 'anemic';
      const missTxt = n.whole ? '' : Object.keys(n.missing || {})
        .map(k => k + ': ' + n.missing[k].join(', ')).join(' · ');
      return ''
        + '<tr class="dev-overview-row dev-overview-row--' + band + '">'
        +   '<td class="dev-overview-col-label">'
        +     '<div class="dev-overview-cell-main">' + escapeHtml(n.label) + '</div>'
        +     (missTxt ? '<div class="dev-overview-cell-sub">missing — ' + escapeHtml(missTxt) + '</div>' : '')
        +   '</td>'
        +   '<td class="dev-overview-col-num">' + n.present
        +     '<span class="dev-overview-stat-unit">/' + n.total + '</span></td>'
        +   '<td class="dev-overview-col-band">'
        +     '<span class="dev-overview-band-pill" data-band="' + band + '">'
        +       (n.whole ? 'WHOLE' : 'BROKEN') + '</span>'
        +   '</td>'
        + '</tr>';
    }).join('');
    const demand = (w.topDemand || []).slice(0, 12).map(x =>
      '<li class="dev-overview-cell-sub"><strong>' + x.refs + '×</strong> '
      + escapeHtml(x.target) + '</li>').join('');
    const rosterRows = (w.rosters || []).map(r => {
      const band = r.pct >= 100 ? 'rich' : (r.pct >= 80 ? 'developing' : 'anemic');
      return ''
        + '<tr class="dev-overview-row dev-overview-row--' + band + '">'
        +   '<td class="dev-overview-col-label">'
        +     '<div class="dev-overview-cell-main">' + escapeHtml(r.tradition) + '</div>'
        +     (r.missing && r.missing.length
              ? '<div class="dev-overview-cell-sub">missing — ' + escapeHtml(r.missing.join(', ')) + '</div>' : '')
        +   '</td>'
        +   '<td class="dev-overview-col-num">' + r.present + '<span class="dev-overview-stat-unit">/' + r.total + '</span></td>'
        +   '<td class="dev-overview-col-num">' + r.pct + '%</td>'
        +   '<td class="dev-overview-col-band">'
        +     '<span class="dev-overview-band-pill" data-band="' + band + '">' + (r.pct >= 100 ? 'COMPLETE' : r.pct + '%') + '</span>'
        +   '</td>'
        + '</tr>';
    }).join('');
    return ''
      + '<section class="dev-overview-section dev-overview-summary">'
      +   '<h2 class="dev-overview-section-h">🔗 Completeness — wire-endpoint coverage '
      +     '<span class="dev-overview-h-hint">does the investigation\'s wiring have both ends? — not catalogue bookkeeping</span></h2>'
      +   '<div class="dev-overview-stat-grid">'
      +     stat(whole + '<span class="dev-overview-stat-unit">/' + total + '</span>', allWhole ? 'NEIGHBORHOODS WHOLE ✓' : 'neighborhoods whole')
      +     stat(num(w.indexedSlugs), 'Node slugs indexed')
      +     stat(escapeHtml(w.generatedAt || ''), 'As of')
      +   '</div>'
      +   '<div class="dev-overview-table-wrap">'
      +     '<table class="dev-overview-table">'
      +       '<thead><tr>'
      +         '<th>Cross-tradition neighborhood</th>'
      +         '<th class="dev-overview-col-num">Endpoints</th>'
      +         '<th>Status</th>'
      +       '</tr></thead>'
      +       '<tbody>' + rows + '</tbody>'
      +     '</table>'
      +   '</div>'
      +   (rosterRows
        ? '<div class="dev-overview-cell-sub"><strong>Pantheon roster coverage</strong> — authoritative deity lists, headwaters first (the only bar that sees a god nobody has linked yet):</div>'
          + '<div class="dev-overview-table-wrap"><table class="dev-overview-table">'
          + '<thead><tr><th>Tradition pantheon</th>'
          + '<th class="dev-overview-col-num">Present</th>'
          + '<th class="dev-overview-col-num">%</th><th>Status</th></tr></thead>'
          + '<tbody>' + rosterRows + '</tbody></table></div>'
        : '')
      +   (demand
        ? '<div class="dev-overview-cell-sub"><strong>Top demand</strong> — referenced but missing (the investigation\'s most-wanted next nodes):</div>'
          + '<ul class="dev-overview-demand-list">' + demand + '</ul>'
        : '')
      + '</section>';
  }

  // ── SCRIPTURE COMPLETENESS — per-canon book coverage ───────────────────
  // The scripture sibling of wire-coverage: holds the AUTHORITATIVE canon
  // book-list as external truth and reports DEDICATED / FOLDED / ABSENT per
  // book. The quality scorecards grade nodes that EXIST and are blind to a
  // missing book — this is the bar that sees the Bible is (was) half-empty.
  // Data: src/data/scripture-coverage.json (rebuilt via
  // `python3 scripts/audit_scripture_coverage.py`).
  function renderScriptureCoverage(s) {
    if (!s || !s.canons || !s.canons.length) return '';
    const CANON_DEFS = [
      ['P', 'Protestant (66)'], ['C', 'Catholic (73)'],
      ['O', 'Eastern Orthodox (78)'], ['E', 'Ethiopian (81, broader)'],
      ['Q', 'Quran (114 suras)'],
    ];
    const sections = s.canons.map(c => {
      const books = c.books || [];
      const overallPct = c.total ? Math.round(c.dedicated / c.total * 100) : 0;
      const canonRows = CANON_DEFS.map(function (def) {
        const letter = def[0], label = def[1];
        const inCanon = books.filter(b => (b.canons || []).indexOf(letter) >= 0);
        if (!inCanon.length) return '';
        const ded = inCanon.filter(b => b.status === 'DEDICATED').length;
        const fold = inCanon.filter(b => b.status === 'FOLDED').length;
        const absentBooks = inCanon.filter(b => b.status === 'ABSENT').map(b => b.book);
        const foldBooks = inCanon.filter(b => b.status === 'FOLDED').map(b => b.book);
        const pct = Math.round(ded / inCanon.length * 100);
        const band = (absentBooks.length === 0 && fold === 0) ? 'rich' : (pct >= 80 ? 'developing' : 'anemic');
        const cap = function (arr) {
          return arr.length > 6 ? arr.slice(0, 6).join(', ') + ' …+' + (arr.length - 6) + ' more' : arr.join(', ');
        };
        const sub = absentBooks.length ? 'absent — ' + cap(absentBooks)
          : (fold ? fold + ' folded into the grouped node — ' + cap(foldBooks) : '');
        return ''
          + '<tr class="dev-overview-row dev-overview-row--' + band + '">'
          +   '<td class="dev-overview-col-label">'
          +     '<div class="dev-overview-cell-main">' + escapeHtml(label) + '</div>'
          +     (sub ? '<div class="dev-overview-cell-sub">' + escapeHtml(sub) + '</div>' : '')
          +   '</td>'
          +   '<td class="dev-overview-col-num">' + ded + '<span class="dev-overview-stat-unit">/' + inCanon.length + '</span></td>'
          +   '<td class="dev-overview-col-num">' + pct + '%</td>'
          +   '<td class="dev-overview-col-band">'
          +     '<span class="dev-overview-band-pill" data-band="' + band + '">'
          +       ((absentBooks.length === 0 && fold === 0) ? 'COMPLETE' : pct + '%') + '</span>'
          +   '</td>'
          + '</tr>';
      }).join('');
      return ''
        + '<div class="dev-overview-cell-sub"><strong>' + escapeHtml(c.canon) + '</strong> — '
        +   c.dedicated + ' dedicated · ' + c.folded + ' folded · ' + c.absent + ' absent '
        +   '(of ' + c.total + ' books — ' + overallPct + '% distinguished):</div>'
        + '<div class="dev-overview-table-wrap"><table class="dev-overview-table">'
        +   '<thead><tr><th>Canon</th>'
        +   '<th class="dev-overview-col-num">Dedicated</th>'
        +   '<th class="dev-overview-col-num">%</th><th>Status</th></tr></thead>'
        +   '<tbody>' + canonRows + '</tbody></table></div>';
    }).join('');
    const totalDed = s.canons.reduce((n, c) => n + (c.dedicated || 0), 0);
    const totalAll = s.canons.reduce((n, c) => n + (c.total || 0), 0);
    const totalAbsent = s.canons.reduce((n, c) => n + (c.absent || 0), 0);
    // All scripture corpora — document-node count per canonical-corpus tag.
    const corpora = (s.corpora || []).filter(c => c.docs >= 4).slice(0, 32);
    const corporaRows = corpora.map(function (c) {
      const band = c.docs >= 15 ? 'rich' : (c.docs >= 8 ? 'developing' : 'anemic');
      return '<tr class="dev-overview-row dev-overview-row--' + band + '">'
        + '<td class="dev-overview-col-label"><div class="dev-overview-cell-main">' + escapeHtml(c.label) + '</div></td>'
        + '<td class="dev-overview-col-num">' + c.docs + '<span class="dev-overview-stat-unit"> docs</span></td>'
        + '</tr>';
    }).join('');
    const corporaBlock = corpora.length
      ? '<div class="dev-overview-cell-sub"><strong>All scripture corpora</strong> — document nodes per corpus (top '
        + corpora.length + ' of ' + (s.corpora || []).length + '; canonical-corpus tag):</div>'
        + '<div class="dev-overview-table-wrap"><table class="dev-overview-table">'
        + '<thead><tr><th>Corpus</th><th class="dev-overview-col-num">Docs</th></tr></thead>'
        + '<tbody>' + corporaRows + '</tbody></table></div>'
      : '';
    return ''
      + '<section class="dev-overview-section dev-overview-summary">'
      +   '<h2 class="dev-overview-section-h">📖 Completeness — scripture canon coverage '
      +     '<span class="dev-overview-h-hint">is the canon WHOLE? — every book a node, not a curated selection</span></h2>'
      +   '<div class="dev-overview-stat-grid">'
      +     stat(totalDed + '<span class="dev-overview-stat-unit">/' + totalAll + '</span>', totalAbsent === 0 ? 'BOOKS DEDICATED ✓' : 'books dedicated')
      +     stat(num(s.indexedDocs), 'Document nodes indexed')
      +     stat(escapeHtml(s.generatedAt || ''), 'As of')
      +   '</div>'
      +   sections
      +   corporaBlock
      + '</section>';
  }

  // ── LITERATURE PRODUCT-GRADE BENCHMARK ─────────────────────────────────
  // The scripture corpus — the root of the Atlas; the deities hang from it.
  // Duplicate detection here is AUTOMATIC (normalized-title clustering), so a
  // fill can never silently create a dup. Data: src/data/document-product-grade.json
  // (rebuilt via `python3 scripts/audit_document_quality.py`).
  function renderDocumentBenchmark(b) {
    if (!b || !b.rows) return '';
    const pass = b.passCount, total = b.rowCount;
    const pg = !!b.productGrade;
    const barW = total ? Math.round(pass / total * 100) : 0;
    const rows = b.rows.map(r => {
      const band = r.ok ? 'rich' : 'anemic';
      return ''
        + '<tr class="dev-overview-row dev-overview-row--' + band + '">'
        +   '<td class="dev-overview-col-label">'
        +     '<div class="dev-overview-cell-main">' + escapeHtml(r.label) + '</div>'
        +     (r.detail ? '<div class="dev-overview-cell-sub">' + escapeHtml(r.detail) + '</div>' : '')
        +   '</td>'
        +   '<td class="dev-overview-col-num">' + escapeHtml(r.current) + '</td>'
        +   '<td class="dev-overview-col-num dev-overview-col-base">' + escapeHtml(r.target) + '</td>'
        +   '<td class="dev-overview-col-statuses"></td>'
        +   '<td class="dev-overview-col-band">'
        +     '<span class="dev-overview-band-pill" data-band="' + band + '">' + (r.ok ? 'PASS' : 'OPEN') + '</span>'
        +   '</td>'
        + '</tr>';
    }).join('');
    return ''
      + '<section class="dev-overview-section dev-overview-summary">'
      +   '<h2 class="dev-overview-section-h">📖 Literature product-grade benchmark '
      +     '<span class="dev-overview-h-hint">the scripture corpus — the root the deities hang from</span></h2>'
      +   '<div class="dev-overview-stat-grid">'
      +     stat(pass + '<span class="dev-overview-stat-unit">/' + total + '</span>', pg ? 'ROWS GREEN — PRODUCT-GRADE ✓' : 'rows green (target ' + total + '/' + total + ')')
      +     stat(num(b.totalDocuments), 'Documents')
      +     stat((b.citationAudit ? num(b.citationAudit.count) : '0') + '<span class="dev-overview-stat-unit"> docs</span>', 'Citations verified' + (b.citationAudit && b.citationAudit.lastSweep ? ' · ' + escapeHtml(b.citationAudit.lastSweep) : ''))
      +     stat(escapeHtml(b.generatedAt || ''), 'As of')
      +   '</div>'
      +   '<div class="dev-overview-band-strip">'
      +     '<div class="dev-overview-bar" data-band="' + (pg ? 'rich' : 'developing') + '" style="flex:1">'
      +       '<div class="dev-overview-bar-fill" style="width:' + barW + '%"></div>'
      +       '<div class="dev-overview-bar-100"></div>'
      +     '</div>'
      +     '<span class="dev-overview-band-strip-lbl">' + (pg ? 'all rows green' : (total - pass) + ' rows still open') + '</span>'
      +   '</div>'
      +   '<div class="dev-overview-table-wrap">'
      +     '<table class="dev-overview-table">'
      +       '<thead><tr>'
      +         '<th>Quality dimension</th>'
      +         '<th class="dev-overview-col-num">Current</th>'
      +         '<th class="dev-overview-col-num">Target</th>'
      +         '<th>Trajectory</th>'
      +         '<th>Status</th>'
      +       '</tr></thead>'
      +       '<tbody>' + rows + '</tbody>'
      +     '</table>'
      +   '</div>'
      + '</section>';
  }

  function renderSummary(d, pct, totalBase, lensBands) {
    // The two unclassified buckets are different in kind:
    // `unmatchedTradNodes` = classifier-gap accidents → must be zero.
    // `intentionallyCrossTradition` = explicitly allow-listed cross-
    // tradition / comparative / pre-tradition entries → expected.
    // Showing both keeps the integrity signal visible.
    const acc = d.vault.unmatchedTradNodes || 0;
    const intent = d.vault.intentionallyCrossTradition || 0;
    return ''
      + '<section class="dev-overview-section dev-overview-summary">'
      +   '<h2 class="dev-overview-section-h">Vault summary</h2>'
      +   '<div class="dev-overview-stat-grid">'
      +     stat(num(d.vault.totalNodes),  'Total nodes')
      +     stat(d.vault.lensCount,        'Lenses')
      +     stat(d.vault.familyCount,      'Families')
      +     stat(pct + '<span class="dev-overview-stat-unit">%</span>', 'Overall vs baseline (' + num(totalBase) + ')')
      +     stat(num(acc),    'Classifier gaps · should be 0')
      +     stat(num(intent), 'Intentional cross-tradition')
      +   '</div>'
      +   '<div class="dev-overview-band-strip">'
      +     bandPip('anemic',        lensBands.anemic,        'anemic')
      +     bandPip('developing',    lensBands.developing,    'developing')
      +     bandPip('rich',          lensBands.rich,          'rich')
      +     bandPip('over-baseline', lensBands['over-baseline'], 'over-baseline')
      +     '<span class="dev-overview-band-strip-lbl">across ' + d.lenses.length + ' lenses</span>'
      +   '</div>'
      + '</section>';
  }

  function renderLenses(lenses) {
    const rows = lenses.map(L => {
      const pct = L.ratio == null ? '—' : Math.round(L.ratio * 100) + '%';
      const barWidth = L.ratio == null ? 0 : Math.round(Math.min(1.5, L.ratio) / 1.5 * 100);
      const statusBreakdown = L.statuses
        ? Object.entries(L.statuses).sort((a, b) => b[1] - a[1])
            .map(([k, v]) => escapeHtml(k) + ':' + v).join(' · ')
        : '';
      return ''
        + '<tr class="dev-overview-row dev-overview-row--' + L.band + '">'
        +   '<td class="dev-overview-col-label">'
        +     '<div class="dev-overview-cell-main">' + escapeHtml(L.label) + '</div>'
        +     '<div class="dev-overview-cell-sub">' + escapeHtml(L.folder) + '</div>'
        +   '</td>'
        +   '<td class="dev-overview-col-num">' + num(L.count) + '</td>'
        +   '<td class="dev-overview-col-num dev-overview-col-base" title="' + escapeAttr(L.baselineNote || '') + '">' + num(L.baseline) + '</td>'
        +   '<td class="dev-overview-col-bar">'
        +     '<div class="dev-overview-bar" data-band="' + L.band + '">'
        +       '<div class="dev-overview-bar-fill" style="width:' + barWidth + '%"></div>'
        +       '<div class="dev-overview-bar-100" title="baseline target (100%)"></div>'
        +     '</div>'
        +   '</td>'
        +   '<td class="dev-overview-col-pct">' + pct + '</td>'
        +   '<td class="dev-overview-col-band">'
        +     '<span class="dev-overview-band-pill" data-band="' + L.band + '">' + L.band + '</span>'
        +   '</td>'
        +   '<td class="dev-overview-col-statuses">' + statusBreakdown + '</td>'
        + '</tr>';
    }).join('');
    return ''
      + '<section class="dev-overview-section">'
      +   '<h2 class="dev-overview-section-h">Per-lens coverage <span class="dev-overview-h-hint">(content folders 01–31)</span></h2>'
      +   '<div class="dev-overview-table-wrap">'
      +     '<table class="dev-overview-table">'
      +       '<thead><tr>'
      +         '<th>Lens</th>'
      +         '<th class="dev-overview-col-num">Count</th>'
      +         '<th class="dev-overview-col-num">Baseline</th>'
      +         '<th>Progress</th>'
      +         '<th class="dev-overview-col-pct">%</th>'
      +         '<th>Band</th>'
      +         '<th>Status breakdown</th>'
      +       '</tr></thead>'
      +       '<tbody>' + rows + '</tbody>'
      +     '</table>'
      +   '</div>'
      + '</section>';
  }

  function renderFamilies(families) {
    const rows = families.map(F => {
      const pct = Math.round((F.ratio || 0) * 100) + '%';
      const barWidth = Math.round(Math.min(1.5, F.ratio || 0) / 1.5 * 100);
      const topLenses = Object.entries(F.perLens || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([k, v]) => k.replace(/^\d+_/, '') + ':' + v)
        .join(' · ');
      return ''
        + '<tr class="dev-overview-row dev-overview-row--' + F.band + '">'
        +   '<td class="dev-overview-col-label">'
        +     '<div class="dev-overview-cell-main">' + escapeHtml(F.label) + '</div>'
        +     '<div class="dev-overview-cell-sub">' + escapeHtml(F.key) + '</div>'
        +   '</td>'
        +   '<td class="dev-overview-col-num">' + num(F.count) + '</td>'
        +   '<td class="dev-overview-col-num">' + num(F.baseline) + '</td>'
        +   '<td class="dev-overview-col-bar">'
        +     '<div class="dev-overview-bar" data-band="' + F.band + '">'
        +       '<div class="dev-overview-bar-fill" style="width:' + barWidth + '%"></div>'
        +       '<div class="dev-overview-bar-100"></div>'
        +     '</div>'
        +   '</td>'
        +   '<td class="dev-overview-col-pct">' + pct + '</td>'
        +   '<td class="dev-overview-col-band">'
        +     '<span class="dev-overview-band-pill" data-band="' + F.band + '">' + F.band + '</span>'
        +   '</td>'
        +   '<td class="dev-overview-col-statuses">' + escapeHtml(topLenses) + '</td>'
        + '</tr>';
    }).join('');
    return ''
      + '<section class="dev-overview-section">'
      +   '<h2 class="dev-overview-section-h">Per-family coverage <span class="dev-overview-h-hint">(14 curated families · tradition substring-match)</span></h2>'
      +   '<div class="dev-overview-table-wrap">'
      +     '<table class="dev-overview-table">'
      +       '<thead><tr>'
      +         '<th>Family</th>'
      +         '<th class="dev-overview-col-num">Count</th>'
      +         '<th class="dev-overview-col-num">Baseline</th>'
      +         '<th>Progress</th>'
      +         '<th class="dev-overview-col-pct">%</th>'
      +         '<th>Band</th>'
      +         '<th>Top contributing lenses</th>'
      +       '</tr></thead>'
      +       '<tbody>' + rows + '</tbody>'
      +     '</table>'
      +   '</div>'
      + '</section>';
  }

  function renderMethodology(M, unmatched) {
    if (!M) return '';
    const bandLines = Object.entries(M.bands || {})
      .map(([k, v]) =>
        '<li><span class="dev-overview-band-pill" data-band="' + k + '">' + k + '</span>'
        + ' <span class="dev-overview-band-desc">' + escapeHtml(v) + '</span></li>')
      .join('');
    const caveats = (M.caveats || []).map(c => '<li>' + escapeHtml(c) + '</li>').join('');
    const unmatchedRows = unmatched.length
      ? unmatched.map(u =>
          '<li><code class="dev-overview-unmatched-trad">' + escapeHtml(u.tradition) + '</code>'
          + '<span class="dev-overview-unmatched-count">' + u.count + '</span></li>').join('')
      : '<li><em>(none)</em></li>';
    return ''
      + '<section class="dev-overview-section dev-overview-method">'
      +   '<h2 class="dev-overview-section-h">Methodology</h2>'
      +   '<div class="dev-overview-method-grid">'
      +     '<div>'
      +       '<h4>Baseline reference</h4>'
      +       '<p>' + escapeHtml(M.baselineSource || '') + '</p>'
      +       '<h4>Health bands</h4>'
      +       '<ul class="dev-overview-band-list">' + bandLines + '</ul>'
      +     '</div>'
      +     '<div>'
      +       '<h4>Family classification</h4>'
      +       '<p>' + escapeHtml(M.familyClassification || '') + '</p>'
      +       '<h4>Caveats</h4>'
      +       '<ul class="dev-overview-caveats">' + caveats + '</ul>'
      +     '</div>'
      +   '</div>'
      +   '<details class="dev-overview-unmatched">'
      +     '<summary>Top unclassified <code>tradition:</code> values'
      +       ' <span class="dev-overview-h-hint">(' + unmatched.length + ' shown · data-hygiene signal)</span>'
      +     '</summary>'
      +     '<ul class="dev-overview-unmatched-list">' + unmatchedRows + '</ul>'
      +   '</details>'
      + '</section>';
  }

  function renderFooter(d) {
    return ''
      + '<section class="dev-overview-footer">'
      +   '<span>Generated ' + escapeHtml(d.generatedAt || '') + '</span>'
      +   '<span>·</span>'
      +   '<span>Regenerate: <code>python3 scripts/build_health_index.py</code></span>'
      + '</section>';
  }

  function stat(value, label) {
    return ''
      + '<div class="dev-overview-stat">'
      +   '<div class="dev-overview-stat-num">' + value + '</div>'
      +   '<div class="dev-overview-stat-lbl">' + escapeHtml(label) + '</div>'
      + '</div>';
  }
  function bandPip(key, n, label) {
    return ''
      + '<span class="dev-overview-band-strip-pip" data-band="' + key + '">'
      +   '<span class="dev-overview-band-strip-n">' + n + '</span>'
      +   '<span class="dev-overview-band-strip-l">' + escapeHtml(label) + '</span>'
      + '</span>';
  }
  function num(n) {
    return (n == null) ? '—' : Number(n).toLocaleString('en-US');
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function countBands(rows) {
    const c = { anemic: 0, developing: 0, rich: 0, 'over-baseline': 0, index: 0 };
    rows.forEach(r => { if (c[r.band] != null) c[r.band]++; });
    return c;
  }
})();
