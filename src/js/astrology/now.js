// ============================================================
// CODEX ATLAS — Astrology · Now mode
// Unrolled zodiac strip — horizontal x-axis = ecliptic longitude (0° Aries
// → 360°), 7 planets plotted at their current geocentric longitudes for
// the chosen date. Time-scrubber 3000 BCE ↔ 2100 CE lets you watch
// precession + planetary motion. Click planet → mythological node.
//
// Hovers cross-reference the decanic-cross-tradition JSON to show
// which Egyptian decan / Vedic nakshatra / Arabic manzil / Chinese xiu
// each planet is currently in.
//
// PARALLEL EVENTS TIMELINE (sonnet-now-events-1, 2026-05-15)
// A SECOND strip beneath the zodiac strip plots vault events (nodes with
// type === 'event' + numeric date_earliest) on a year axis centered on
// the scrubber date, ±N years (default 200). Lets the user check the
// astrological state of the sky in 1453 against what was actually
// happening on Earth in 1453.
// ============================================================
(function () {
  const BODIES = [
    { key: 'Sun',     glyph: '☉', color: '#e0a850', deity: 'sun-disk' },
    { key: 'Moon',    glyph: '☽', color: '#aabac5', deity: 'soma' },
    { key: 'Mercury', glyph: '☿', color: '#5a9a8f', deity: 'mercury-roman' },
    { key: 'Venus',   glyph: '♀', color: '#6e8c6b', deity: 'venus-roman' },
    { key: 'Mars',    glyph: '♂', color: '#c25450', deity: 'mars-roman' },
    { key: 'Jupiter', glyph: '♃', color: '#a87bb5', deity: 'jupiter' },
    { key: 'Saturn',  glyph: '♄', color: '#5a6cc4', deity: 'saturn-roman' }
  ];
  const SIGNS = [
    { name: 'Aries',       glyph: '♈', element: 'fire' },
    { name: 'Taurus',      glyph: '♉', element: 'earth' },
    { name: 'Gemini',      glyph: '♊', element: 'air' },
    { name: 'Cancer',      glyph: '♋', element: 'water' },
    { name: 'Leo',         glyph: '♌', element: 'fire' },
    { name: 'Virgo',       glyph: '♍', element: 'earth' },
    { name: 'Libra',       glyph: '♎', element: 'air' },
    { name: 'Scorpio',     glyph: '♏', element: 'water' },
    { name: 'Sagittarius', glyph: '♐', element: 'fire' },
    { name: 'Capricorn',   glyph: '♑', element: 'earth' },
    { name: 'Aquarius',    glyph: '♒', element: 'air' },
    { name: 'Pisces',      glyph: '♓', element: 'water' }
  ];
  const ELEMENT_TINT = { fire: 'rgba(194,84,80,0.10)', earth: 'rgba(154,165,90,0.10)', air: 'rgba(168,123,181,0.10)', water: 'rgba(90,108,196,0.10)' };
  const DECANS_URL = '_assets/data/astrology-decans.json?v=20260515-astro-now-1';
  let _decans = null;

  // Cached event index — built lazily on first draw, keyed by node id.
  // Entry shape: { id, year, title, color, degree }
  let _eventsIndex = null;

  function eclipticLongitude(bodyKey, date) {
    const A = window.Astronomy; if (!A) return 0;
    const time = A.MakeTime(date);
    const vec = A.GeoVector(A.Body[bodyKey], time, true);
    const ecl = A.Ecliptic(vec);
    return ((ecl.elon % 360) + 360) % 360;
  }
  function decanForLongitude(lon) {
    return Math.min(35, Math.floor(lon / 10));
  }

  function julianYear(date) {
    // Approximate fractional year for display + scrubber-bind.
    const ms = date.getTime();
    const ms2000 = Date.UTC(2000, 0, 1);
    return 2000 + (ms - ms2000) / (365.2422 * 86400000);
  }
  function dateFromYear(year) {
    const ms2000 = Date.UTC(2000, 0, 1);
    const ms = ms2000 + (year - 2000) * 365.2422 * 86400000;
    const d = new Date(ms);
    return d;
  }

  const state = {
    date: new Date(),
    showTrails: false,
    eventsRangeYears: 200
  };

  function buildEventsIndex() {
    if (_eventsIndex) return _eventsIndex;
    const VD = window.VAULT_DATA;
    if (!VD || !Array.isArray(VD.nodes)) { _eventsIndex = []; return _eventsIndex; }
    // Pre-tally edge degree per id so we can rank "most-cited" events for
    // label-density triage.
    const degree = Object.create(null);
    if (Array.isArray(VD.edges)) {
      for (let i = 0; i < VD.edges.length; i++) {
        const e = VD.edges[i];
        if (e.source) degree[e.source] = (degree[e.source] || 0) + 1;
        if (e.target) degree[e.target] = (degree[e.target] || 0) + 1;
      }
    }
    const out = [];
    for (let i = 0; i < VD.nodes.length; i++) {
      const n = VD.nodes[i];
      if (n.type !== 'event') continue;
      const y = n.date_earliest;
      if (typeof y !== 'number' || !isFinite(y)) continue;
      out.push({
        id: n.id,
        year: y,
        title: n.title || n.label || n.id,
        color: n.family_color || n.tradition_color || '#aabac5',
        degree: degree[n.id] || 0
      });
    }
    out.sort((a, b) => a.year - b.year);
    _eventsIndex = out;
    return out;
  }

  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';
    rootEl.classList.add('astrology-pane-live');

    const layout = document.createElement('div');
    layout.className = 'astro-now-layout';
    rootEl.appendChild(layout);

    // Top: zodiac strip + events strip (single SVG, two stacked regions)
    const stripWrap = document.createElement('div');
    stripWrap.className = 'astro-now-strip-wrap';
    layout.appendChild(stripWrap);

    // Bottom: scrubber
    const scrubWrap = document.createElement('div');
    scrubWrap.className = 'astro-now-scrub-wrap';
    scrubWrap.innerHTML = `
      <div class="anw-scrub-row">
        <button class="btn btn-mini anw-jump" data-y="-3000">−3000</button>
        <button class="btn btn-mini anw-jump" data-y="-2000">−2000</button>
        <button class="btn btn-mini anw-jump" data-y="-1000">−1000</button>
        <button class="btn btn-mini anw-jump" data-y="0">0 CE</button>
        <button class="btn btn-mini anw-jump" data-y="1000">1000</button>
        <button class="btn btn-mini anw-jump" data-y="2000">2000</button>
        <button class="btn btn-mini anw-jump anw-now" data-y="now">now</button>
        <input type="range" id="anw-scrubber" min="-3000" max="2100" step="0.1" value="${julianYear(state.date).toFixed(2)}" class="anw-scrubber">
        <span class="anw-year" id="anw-year-label">${fmtYear(state.date)}</span>
      </div>
      <div class="anw-range-row">
        <span class="anw-range-label">Events window:</span>
        <button class="btn btn-mini anw-range" data-r="50">±50y</button>
        <button class="btn btn-mini anw-range" data-r="100">±100y</button>
        <button class="btn btn-mini anw-range" data-r="200">±200y</button>
        <button class="btn btn-mini anw-range" data-r="500">±500y</button>
        <span class="anw-range-count" id="anw-range-count"></span>
      </div>
      <div class="anw-positions" id="anw-positions"></div>
      <div class="anw-footer">Tropical · geocentric · click any planet → mythological node · scrub to see what was happening on Earth · click event dot to open</div>
    `;
    layout.appendChild(scrubWrap);

    scrubWrap.querySelectorAll('.anw-jump').forEach(b => {
      b.onclick = () => {
        if (b.dataset.y === 'now') state.date = new Date();
        else state.date = dateFromYear(parseFloat(b.dataset.y));
        document.getElementById('anw-scrubber').value = julianYear(state.date).toFixed(2);
        drawStrip(stripWrap, state.date, scrubWrap);
      };
    });
    scrubWrap.querySelectorAll('.anw-range').forEach(b => {
      b.onclick = () => {
        state.eventsRangeYears = parseInt(b.dataset.r, 10) || 200;
        // Mark active button
        scrubWrap.querySelectorAll('.anw-range').forEach(x => x.classList.toggle('active', x === b));
        drawStrip(stripWrap, state.date, scrubWrap);
      };
    });
    // Mark default-active range button
    const defaultBtn = scrubWrap.querySelector(`.anw-range[data-r="${state.eventsRangeYears}"]`);
    if (defaultBtn) defaultBtn.classList.add('active');

    document.getElementById('anw-scrubber').addEventListener('input', (ev) => {
      state.date = dateFromYear(parseFloat(ev.target.value));
      drawStrip(stripWrap, state.date, scrubWrap);
    });

    drawStrip(stripWrap, state.date, scrubWrap);

    // Load decans (async) so hovers can show cross-tradition cells
    if (!_decans) {
      fetch(DECANS_URL).then(r => r.json()).then(j => { _decans = j; })
        .catch(() => { /* graceful — strip works without */ });
    }
  }

  function fmtYear(date) {
    const y = date.getUTCFullYear();
    return y < 0 ? Math.abs(y) + ' BCE' : y + ' CE';
  }

  function fmtYearNum(y) {
    // Integer-year formatter for the events axis. Uses 0 → "0", negatives → BCE.
    const yi = Math.round(y);
    if (yi < 0) return Math.abs(yi) + ' BCE';
    return yi + ' CE';
  }

  function drawStrip(wrap, date, sideEl) {
    wrap.innerHTML = '';
    if (!window.Astronomy) {
      wrap.innerHTML = '<div class="astro-now-error">astronomy-engine not loaded</div>';
      return;
    }
    const W = wrap.clientWidth, H = wrap.clientHeight;
    if (!W || !H) return;

    // Layout: single SVG spanning the full wrap. Top region = zodiac strip,
    // bottom region (~110 px) = events strip. Divider line in between.
    const padL = 40, padR = 40, padT = 36, padB = 24;
    // Grow the events strip — user feedback "make the events timeline larger so we can read".
    // Was: Math.min(120, Math.max(96, H * 0.32)). Now: ~45% of available height, min 180.
    const eventsRegionH = Math.max(180, H * 0.45);
    const zodiacBottomY = H - padB - eventsRegionH - 12; // 12 px gap for divider
    const plotH = zodiacBottomY - padT;
    const stripY = padT + plotH / 2;
    const stripH = Math.min(110, plotH * 0.55);

    const svg = d3.select(wrap).append('svg')
      .attr('class', 'astro-now-svg')
      .attr('width', '100%').attr('height', '100%').style('display', 'block');

    const x = d3.scaleLinear().domain([0, 360]).range([padL, W - padR]);

    // ----- ZODIAC STRIP -----------------------------------------------------
    // 12 sign segments
    SIGNS.forEach((sg, i) => {
      const x0 = x(i * 30), x1 = x((i + 1) * 30);
      svg.append('rect')
        .attr('x', x0).attr('y', stripY - stripH / 2)
        .attr('width', x1 - x0).attr('height', stripH)
        .attr('fill', ELEMENT_TINT[sg.element])
        .attr('stroke', 'var(--border-soft)').attr('stroke-width', 1);
      svg.append('text')
        .attr('x', (x0 + x1) / 2).attr('y', stripY - stripH / 2 - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--gold-soft)').attr('font-family', 'var(--serif)').attr('font-size', '16px')
        .text(sg.glyph);
      svg.append('text')
        .attr('x', (x0 + x1) / 2).attr('y', stripY + stripH / 2 + 16)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-3)').attr('font-family', 'var(--mono)').attr('font-size', '9.5px')
        .text(sg.name);
    });

    // Decan tick marks every 10° (between signs the boundary already there)
    for (let d = 10; d < 360; d += 10) {
      if (d % 30 === 0) continue;
      svg.append('line')
        .attr('x1', x(d)).attr('x2', x(d))
        .attr('y1', stripY - stripH / 2).attr('y2', stripY - stripH / 2 + 6)
        .attr('stroke', 'var(--text-3)').attr('stroke-opacity', 0.5);
      svg.append('line')
        .attr('x1', x(d)).attr('x2', x(d))
        .attr('y1', stripY + stripH / 2 - 6).attr('y2', stripY + stripH / 2)
        .attr('stroke', 'var(--text-3)').attr('stroke-opacity', 0.5);
    }

    // Degree axis at bottom of zodiac strip
    for (let d = 0; d <= 360; d += 30) {
      svg.append('text')
        .attr('x', x(d)).attr('y', stripY + stripH / 2 + 30)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-3)').attr('font-family', 'var(--mono)').attr('font-size', '9px')
        .text(d + '°');
    }

    // Title
    svg.append('text')
      .attr('x', padL).attr('y', padT - 12)
      .attr('fill', 'var(--text-1)').attr('font-family', 'var(--serif)').attr('font-size', '14px')
      .text(`Sky · ${fmtFullDate(date)}`);

    // 7 planets
    const positions = BODIES.map(b => ({ ...b, lon: eclipticLongitude(b.key, date) }));
    // Cluster-aware y-offset: planets within 6° of each other stack vertically
    positions.sort((a, b) => a.lon - b.lon);
    const lanes = []; // each lane: { lon-of-last, y-offset }
    positions.forEach(p => {
      let lane = 0;
      for (let i = 0; i < lanes.length; i++) {
        if (Math.abs(p.lon - lanes[i]) > 6) { lane = i; break; }
        lane = i + 1;
      }
      p._lane = lane;
      lanes[lane] = p.lon;
    });

    const planetG = svg.append('g').attr('class', 'astro-now-planets');
    positions.forEach(p => {
      const px = x(p.lon);
      const py = stripY + (p._lane - 1) * 18;
      const g = planetG.append('g').attr('transform', `translate(${px},${py})`)
        .style('cursor', 'pointer')
        .on('click', () => { if (window.selectNode && p.deity) window.selectNode(p.deity, true); })
        .on('mouseenter', (ev) => showDecanTip(ev, p))
        .on('mouseleave', hideTip);
      g.append('circle').attr('r', 12).attr('fill', p.color).attr('fill-opacity', 0.15)
        .attr('stroke', p.color).attr('stroke-width', 1.5);
      g.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', p.color).attr('font-family', 'var(--serif)').attr('font-size', '16px')
        .text(p.glyph);
      // tick on strip rim
      svg.append('line').attr('x1', x(p.lon)).attr('x2', x(p.lon))
        .attr('y1', stripY - stripH / 2).attr('y2', stripY + stripH / 2)
        .attr('stroke', p.color).attr('stroke-opacity', 0.5).attr('stroke-width', 1.5);
    });

    // ----- DIVIDER ---------------------------------------------------------
    const divY = zodiacBottomY + 6;
    svg.append('line')
      .attr('x1', padL).attr('x2', W - padR)
      .attr('y1', divY).attr('y2', divY)
      .attr('stroke', 'var(--border-soft)').attr('stroke-width', 1).attr('stroke-dasharray', '2 4');

    // ----- EVENTS STRIP ----------------------------------------------------
    drawEventsStrip(svg, W, padL, padR, divY + 6, eventsRegionH - 6, date, sideEl);

    // Update side-panel positions table
    const slot = document.getElementById('anw-positions');
    if (slot) {
      slot.innerHTML = positions.map(p => {
        const di = decanForLongitude(p.lon);
        const decan = (_decans && _decans.decans && _decans.decans[di]) ? _decans.decans[di] : null;
        const signIdx = Math.floor(p.lon / 30);
        const within = p.lon - signIdx * 30;
        return `<div class="anw-row" data-deity="${p.deity}">
          <span class="anw-glyph" style="color:${p.color}">${p.glyph}</span>
          <span class="anw-name">${p.key}</span>
          <span class="anw-loc">${SIGNS[signIdx].glyph} ${within.toFixed(1)}°</span>
          <span class="anw-decan">${decan ? `D${decan.n} · ${decan.vedic.nakshatra}` : ''}</span>
        </div>`;
      }).join('');
      slot.querySelectorAll('.anw-row').forEach(row => {
        row.onclick = () => { if (window.selectNode && row.dataset.deity) window.selectNode(row.dataset.deity, true); };
      });
    }
    // Year label
    const yl = document.getElementById('anw-year-label');
    if (yl) yl.textContent = fmtYear(date);
  }

  function drawEventsStrip(svg, W, padL, padR, regionTop, regionH, date, sideEl) {
    // Year axis is centered on the scrubber date, spans ±state.eventsRangeYears.
    const events = buildEventsIndex();
    const centerYear = julianYear(date);
    const range = state.eventsRangeYears;
    const yMin = centerYear - range;
    const yMax = centerYear + range;
    const xYear = d3.scaleLinear().domain([yMin, yMax]).range([padL, W - padR]);

    // Strip background (subtle band)
    svg.append('rect')
      .attr('x', padL).attr('y', regionTop)
      .attr('width', W - padR - padL).attr('height', regionH)
      .attr('fill', 'rgba(255,255,255,0.015)')
      .attr('stroke', 'none');

    // Axis baseline (where dots sit on average)
    const axisY = regionTop + regionH * 0.55;
    svg.append('line')
      .attr('x1', padL).attr('x2', W - padR)
      .attr('y1', axisY).attr('y2', axisY)
      .attr('stroke', 'var(--border-soft)').attr('stroke-opacity', 0.6).attr('stroke-width', 1);

    // Tick interval — adaptive: ≥100y range → 50-year ticks; ≤50y → 10-year.
    let tickStep;
    if (range >= 100) tickStep = 50;
    else tickStep = 10;
    // For ±500y, drop to 100-year ticks to avoid crowding
    if (range >= 500) tickStep = 100;

    const firstTick = Math.ceil(yMin / tickStep) * tickStep;
    for (let y = firstTick; y <= yMax; y += tickStep) {
      const tx = xYear(y);
      svg.append('line')
        .attr('x1', tx).attr('x2', tx)
        .attr('y1', axisY - 4).attr('y2', axisY + 4)
        .attr('stroke', 'var(--text-3)').attr('stroke-opacity', 0.5);
      svg.append('text')
        .attr('x', tx).attr('y', axisY + 16)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-3)').attr('font-family', 'var(--mono)').attr('font-size', '9px')
        .text(fmtYearNum(y));
    }

    // Strip title (left edge)
    svg.append('text')
      .attr('x', padL).attr('y', regionTop + 12)
      .attr('fill', 'var(--text-2)').attr('font-family', 'var(--serif)').attr('font-size', '11px').attr('font-style', 'italic')
      .text(`Earth · events within ±${range}y of ${fmtYearNum(centerYear)}`);

    // Scrubber-position marker — vertical gold line at the center year
    const cx = xYear(centerYear);
    svg.append('line')
      .attr('x1', cx).attr('x2', cx)
      .attr('y1', regionTop + 2).attr('y2', regionTop + regionH - 2)
      .attr('stroke', 'var(--gold, #d4a55a)').attr('stroke-opacity', 0.85).attr('stroke-width', 1.5);
    svg.append('text')
      .attr('x', cx).attr('y', regionTop + regionH - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--gold, #d4a55a)').attr('font-family', 'var(--mono)').attr('font-size', '9px')
      .text('▲ now');

    // Filter events to visible window
    let visible = events.filter(e => e.year >= yMin && e.year <= yMax);

    // Density cap — keep top 80 by edge degree if oversaturated (1939+ node
    // graphs can crowd ±500y windows). Sorting preserves rank stability.
    const HARD_CAP = 80;
    if (visible.length > HARD_CAP) {
      visible = visible.slice().sort((a, b) => b.degree - a.degree).slice(0, HARD_CAP);
    }

    // Update count label in scrubber UI
    const countEl = sideEl && sideEl.querySelector ? sideEl.querySelector('#anw-range-count') : null;
    if (countEl) countEl.textContent = visible.length ? `${visible.length} event${visible.length === 1 ? '' : 's'} in view` : 'no events in view';

    if (!visible.length) return;

    // Vertical jitter — 4 deterministic bands derived from id-hash. Keeps dots
    // from stacking on tight clusters (e.g. 1450–1470 Renaissance density).
    const BANDS = 4;
    const bandSpread = Math.min(36, regionH * 0.32);
    function hash(id) {
      let h = 0; for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
      return Math.abs(h);
    }

    // Label policy: ALL events if visible count ≤ 18; otherwise top-N by degree
    // PLUS anything within ±20y of the scrubber date.
    const labelAll = visible.length <= 18;
    const labelable = new Set();
    if (labelAll) {
      visible.forEach(e => labelable.add(e.id));
    } else {
      // top-N by degree
      const N = Math.min(14, visible.length);
      const ranked = visible.slice().sort((a, b) => b.degree - a.degree).slice(0, N);
      ranked.forEach(e => labelable.add(e.id));
      // plus anything close to the scrubber
      visible.forEach(e => {
        if (Math.abs(e.year - centerYear) <= 20) labelable.add(e.id);
      });
    }

    const g = svg.append('g').attr('class', 'astro-now-events');
    visible.forEach(e => {
      const ex = xYear(e.year);
      const band = hash(e.id) % BANDS;
      const ey = axisY - bandSpread * 0.55 + band * (bandSpread / (BANDS - 1));
      const close = Math.abs(e.year - centerYear) <= 5;
      const dot = g.append('g')
        .attr('transform', `translate(${ex},${ey})`)
        .attr('class', 'astro-now-event-dot')
        .style('cursor', 'pointer')
        .on('click', () => { if (window.selectNode) window.selectNode(e.id, true); })
        .on('mouseenter', (ev) => showEventTip(ev, e))
        .on('mouseleave', hideTip);
      dot.append('circle')
        .attr('r', close ? 4 : 3)
        .attr('fill', e.color)
        .attr('fill-opacity', close ? 0.95 : 0.78)
        .attr('stroke', e.color)
        .attr('stroke-width', close ? 1 : 0.5);
      // Connector line from dot to axis when labeled — visually anchors label to year
      if (labelable.has(e.id)) {
        const dy = ey < axisY ? 2 : -2;
        g.append('line')
          .attr('x1', ex).attr('x2', ex)
          .attr('y1', ey + dy).attr('y2', axisY)
          .attr('stroke', e.color).attr('stroke-opacity', 0.35).attr('stroke-width', 0.8);
        // label — title truncated for narrow strips
        const maxChars = range <= 100 ? 28 : range <= 200 ? 22 : 18;
        const tt = e.title.length > maxChars ? e.title.slice(0, maxChars - 1) + '…' : e.title;
        g.append('text')
          .attr('x', ex + 5).attr('y', ey - 5)
          .attr('fill', 'var(--text-2)').attr('font-family', 'var(--serif)').attr('font-size', '10px')
          .attr('pointer-events', 'none')
          .text(tt);
      }
    });
  }

  function fmtFullDate(date) {
    const y = date.getUTCFullYear();
    const yStr = y < 0 ? Math.abs(y) + ' BCE' : y + ' CE';
    const mo = date.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
    return `${mo} ${date.getUTCDate()} · ${yStr}`;
  }

  // Decan tooltip — reuses existing #tooltip element
  function showDecanTip(ev, p) {
    const t = document.getElementById('tooltip');
    if (!t) return;
    const di = decanForLongitude(p.lon);
    const decan = (_decans && _decans.decans && _decans.decans[di]) ? _decans.decans[di] : null;
    const signIdx = Math.floor(p.lon / 30);
    const within = (p.lon - signIdx * 30).toFixed(2);
    let body = `<div class="ttitle" style="color:${p.color}">${p.glyph} ${p.key}</div>
      <div class="tmeta">${SIGNS[signIdx].name} ${within}°</div>`;
    if (decan) {
      body += `<div class="tmeta">Decan ${decan.n} · ${decan.egyptian.name}</div>
        <div class="tmeta">${decan.vedic.nakshatra} · ${decan.arabic_manzil.name} · ${decan.chinese_xiu.name}</div>`;
    }
    t.innerHTML = body;
    t.classList.add('show');
    t.style.left = (ev.clientX + 14) + 'px';
    t.style.top = (ev.clientY + 14) + 'px';
  }

  function showEventTip(ev, e) {
    const t = document.getElementById('tooltip');
    if (!t) return;
    t.innerHTML = `<div class="ttitle" style="color:${e.color}">${e.title}</div>
      <div class="tmeta">${fmtYearNum(e.year)}</div>
      <div class="tmeta">click to open</div>`;
    t.classList.add('show');
    t.style.left = (ev.clientX + 14) + 'px';
    t.style.top = (ev.clientY + 14) + 'px';
  }

  function hideTip() { const t = document.getElementById('tooltip'); if (t) t.classList.remove('show'); }
  // Back-compat alias for the prior decan-only handler name.
  const hideDecanTip = hideTip;

  window._astroNow = { render: render };
})();
