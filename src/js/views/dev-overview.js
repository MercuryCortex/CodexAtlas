// ============================================================
// CODEX ATLAS — DEV OVERVIEW PANEL
// ============================================================
// Operator-facing macro view of vault coverage. Surfaces:
//   • per-lens count vs scholarly baseline + health band
//   • per-family count vs scholarly baseline + health band
//   • methodology + caveats inline
//   • top unmatched-tradition values (data-hygiene signal)
//
// Launched from `✦ user-menu` → Dev → Overview.
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
    return Promise.all([health, bench, docBench]).then(([d, b, db]) => {
      STATE.cache = d; STATE.bench = b; STATE.docBench = db; return d;
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
      renderDeityBenchmark(STATE.bench),
      renderDocumentBenchmark(STATE.docBench),
      renderSummary(d, overallPct, totalBaseline, lensBands),
      renderLenses(d.lenses),
      renderFamilies(d.families),
      renderMethodology(d.methodology, d.unmatchedTraditionsTop || []),
      renderFooter(d),
    ].join('');
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
