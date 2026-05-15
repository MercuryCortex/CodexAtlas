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
    showTrails: false
  };

  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';
    rootEl.classList.add('astrology-pane-live');

    const layout = document.createElement('div');
    layout.className = 'astro-now-layout';
    rootEl.appendChild(layout);

    // Top: zodiac strip
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
      <div class="anw-positions" id="anw-positions"></div>
      <div class="anw-footer">Tropical · geocentric · click any planet → mythological node · drag scrubber → watch precession + transits</div>
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

  function drawStrip(wrap, date, sideEl) {
    wrap.innerHTML = '';
    if (!window.Astronomy) {
      wrap.innerHTML = '<div class="astro-now-error">astronomy-engine not loaded</div>';
      return;
    }
    const W = wrap.clientWidth, H = wrap.clientHeight;
    if (!W || !H) return;
    const padL = 40, padR = 40, padT = 40, padB = 56;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const stripY = padT + plotH / 2;
    const stripH = Math.min(120, plotH * 0.5);

    const svg = d3.select(wrap).append('svg')
      .attr('class', 'astro-now-svg')
      .attr('width', '100%').attr('height', '100%').style('display', 'block');

    const x = d3.scaleLinear().domain([0, 360]).range([padL, W - padR]);

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

    // Degree axis at bottom
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
        .on('mouseleave', hideDecanTip);
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
  function hideDecanTip() { const t = document.getElementById('tooltip'); if (t) t.classList.remove('show'); }

  window._astroNow = { render: render };
})();
