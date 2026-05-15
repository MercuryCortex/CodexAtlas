// ============================================================
// CODEX ATLAS — Astrology · Decanic mode
// 36-decan wheel (10° each) with click-to-inspect all 5 cross-tradition cells.
// Reads _assets/data/astrology-decans.json (fetched once, cached).
//
// Visual: a single ring divided into 36 sectors. Each sector carries the
// Chaldean face-ruler planet glyph (☉ ☽ ☿ ♀ ♂ ♃ ♄) plus a small decan
// number 1–36 at the inner radius. A thin sign-name ribbon sits between
// the wheel and the outer sign-glyphs, and sectors emit a hover tooltip
// summarising decan number + sign + degree range + ruler. The side panel
// renders the full 5-tradition detail on click + a generated "what is
// this decan?" lead.
// ============================================================
(function () {
  const DATA_URL = '_assets/data/astrology-decans.json?v=20260515-decanic-clarity';
  let _cached = null;

  // Chaldean face-ruler color palette — matches Codex Atlas tradition tokens.
  const PLANET_COLORS = {
    Mars:    '#c25450',
    Sun:     '#e0a850',
    Venus:   '#6e8c6b',
    Mercury: '#5a9a8f',
    Moon:    '#aabac5',
    Saturn:  '#5a6cc4',
    Jupiter: '#a87bb5'
  };

  // Unicode planet glyphs (classical seven). Used inside each sector.
  const PLANET_GLYPHS = {
    Sun:     '☉',
    Moon:    '☽',
    Mercury: '☿',
    Venus:   '♀',
    Mars:    '♂',
    Jupiter: '♃',
    Saturn:  '♄'
  };

  // Sign metadata for the ribbon and tooltip.
  const SIGNS = [
    { name: 'Aries',       glyph: '♈' },
    { name: 'Taurus',      glyph: '♉' },
    { name: 'Gemini',      glyph: '♊' },
    { name: 'Cancer',      glyph: '♋' },
    { name: 'Leo',         glyph: '♌' },
    { name: 'Virgo',       glyph: '♍' },
    { name: 'Libra',       glyph: '♎' },
    { name: 'Scorpio',     glyph: '♏' },
    { name: 'Sagittarius', glyph: '♐' },
    { name: 'Capricorn',   glyph: '♑' },
    { name: 'Aquarius',    glyph: '♒' },
    { name: 'Pisces',      glyph: '♓' }
  ];

  function fetchDecans() {
    if (_cached) return Promise.resolve(_cached);
    return fetch(DATA_URL).then(r => r.json()).then(j => { _cached = j; return j; });
  }

  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';
    rootEl.classList.add('astrology-pane-decanic');

    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'astro-decanic-loading';
    loadingMsg.textContent = 'Loading decanic data…';
    rootEl.appendChild(loadingMsg);

    fetchDecans().then(payload => {
      rootEl.innerHTML = '';
      drawWheel(rootEl, payload);
    }).catch(err => {
      rootEl.innerHTML = `<div class="astro-decanic-error">Failed to load decanic data: ${err.message}</div>`;
    });
  }

  // Build a one-line "what is this decan?" lead from the data fields.
  function buildDecanLead(d) {
    const sign = d.western.sign;
    const decanN = d.western.decan_n;
    const ruler = d.western.ruler_chaldean_face;
    const eg = d.egyptian || {};
    const egName = eg.name || '';
    const egDeity = eg.deity_association || '';
    const ord = (decanN === 1) ? 'first' : decanN === 2 ? 'second' : 'third';
    const degRange = d.western.degrees || '';
    let lead = `The ${ord} 10° of ${sign} (${degRange}): ${ruler}-ruled`;
    if (egName) {
      lead += `, anchored by the Egyptian decan <b>${egName}</b>`;
      if (eg.rising_star && eg.rising_star !== egName) {
        lead += ` (rising star ${eg.rising_star})`;
      }
    }
    if (egDeity) {
      lead += `, associated with ${egDeity}`;
    }
    lead += '.';
    return lead;
  }

  function drawWheel(rootEl, payload) {
    const decans = payload.decans;

    // SVG canvas (left two-thirds) + detail side-panel (right third)
    const layout = document.createElement('div');
    layout.className = 'astro-decanic-layout';
    rootEl.appendChild(layout);

    const svgWrap = document.createElement('div');
    svgWrap.className = 'astro-decanic-svg-wrap';
    layout.appendChild(svgWrap);

    // Hover tooltip (positioned absolutely inside svgWrap).
    const tooltip = document.createElement('div');
    tooltip.className = 'astro-decanic-tooltip';
    tooltip.style.display = 'none';
    svgWrap.appendChild(tooltip);

    const sidePanel = document.createElement('div');
    sidePanel.className = 'astro-decanic-side';
    sidePanel.innerHTML = `
      <h3 class="ads-title">Decanic Wheel</h3>
      <div class="ads-intro-body">
        A <b>decan</b> is a 10° slice of the zodiac — 36 of them tile the full 360° circle of the sky.
        The system began in Egypt c. 2100 BCE as 36 ten-day "weeks" (each marked by a rising star),
        was absorbed by Hellenistic astrology, and is now a <b>cross-tradition Rosetta Stone</b>: the
        same 10° patch of sky carries a different name in Western, Egyptian, Vedic, Arabic, and Chinese
        star-lore. This view lets you click any decan and see all five names side-by-side.
      </div>
      <div class="ads-howto">
        <div class="ads-howto-title">How to read this view</div>
        <ol class="ads-howto-list">
          <li><b>Click any sector</b> → the side panel shows that decan's 5 cross-tradition cells.</li>
          <li><b>Sector colour = Chaldean face-ruler planet</b> (see legend below).</li>
          <li><b>Decan 1 = Aries 0°</b> sits at the 9 o'clock position; the wheel runs clockwise.</li>
        </ol>
      </div>
      <div class="ads-legend">
        <div class="ads-legend-title">Face-ruler planets</div>
        <div class="ads-legend-grid">
          <span class="ads-legend-swatch" style="background:${PLANET_COLORS.Mars}"></span><span class="ads-legend-label">${PLANET_GLYPHS.Mars} Mars</span>
          <span class="ads-legend-swatch" style="background:${PLANET_COLORS.Sun}"></span><span class="ads-legend-label">${PLANET_GLYPHS.Sun} Sun</span>
          <span class="ads-legend-swatch" style="background:${PLANET_COLORS.Venus}"></span><span class="ads-legend-label">${PLANET_GLYPHS.Venus} Venus</span>
          <span class="ads-legend-swatch" style="background:${PLANET_COLORS.Mercury}"></span><span class="ads-legend-label">${PLANET_GLYPHS.Mercury} Mercury</span>
          <span class="ads-legend-swatch" style="background:${PLANET_COLORS.Moon}"></span><span class="ads-legend-label">${PLANET_GLYPHS.Moon} Moon</span>
          <span class="ads-legend-swatch" style="background:${PLANET_COLORS.Saturn}"></span><span class="ads-legend-label">${PLANET_GLYPHS.Saturn} Saturn</span>
          <span class="ads-legend-swatch" style="background:${PLANET_COLORS.Jupiter}"></span><span class="ads-legend-label">${PLANET_GLYPHS.Jupiter} Jupiter</span>
        </div>
        <div class="ads-legend-foot">
          ${decans.length} decans · ${payload.sources.length} sources · ayanamsa ${payload.ayanamsa.split(',')[0]}
        </div>
      </div>
      <div class="ads-detail" id="ads-detail"></div>
    `;
    layout.appendChild(sidePanel);

    const svgW = svgWrap.clientWidth, svgH = svgWrap.clientHeight;
    const svgcx = svgW / 2, svgcy = svgH / 2;
    const svgR = Math.min(svgW, svgH) * 0.40;
    const svgRi = svgR * 0.55;
    // Ribbon (sign names) sits just outside the wheel; sign-glyphs further out.
    const svgRribbonInner = svgR * 1.015;
    const svgRribbonOuter = svgR * 1.11;
    const svgRribbonMid = (svgRribbonInner + svgRribbonOuter) / 2;
    const svgRsign = svgR * 1.22;

    const svg = d3.select(svgWrap).append('svg')
      .attr('class', 'astro-decanic-svg')
      .attr('width', '100%').attr('height', '100%')
      .style('display', 'block');

    // Sign-name ribbon: a thin annular band between wheel and sign-glyphs,
    // divided into 12 wedges, each carrying the sign NAME and degree range.
    // Aries 0° anchored at 9 o'clock; wheel runs clockwise (matches sectors).
    const ribbonArc = d3.arc()
      .innerRadius(svgRribbonInner)
      .outerRadius(svgRribbonOuter)
      .padAngle(0.002);

    const ribbonG = svg.append('g')
      .attr('class', 'astro-decanic-ribbon')
      .attr('transform', `translate(${svgcx}, ${svgcy}) rotate(-90)`);

    SIGNS.forEach((sg, i) => {
      const startDeg = i * 30 - 180;
      const endDeg = (i + 1) * 30 - 180;
      const startAng = (startDeg + 90) * Math.PI / 180;
      const endAng = (endDeg + 90) * Math.PI / 180;
      ribbonG.append('path')
        .attr('class', 'astro-decanic-ribbon-seg')
        .attr('d', ribbonArc({ startAngle: startAng, endAngle: endAng }));
    });

    // Curved-text labels along the ribbon midline. Use a dedicated path per
    // sign so SVG textPath can flow the name along the arc.
    SIGNS.forEach((sg, i) => {
      // Each sign's centre angle (in our wheel where 0° Aries = 9 o'clock,
      // clockwise). Convert to SVG XY space (no rotation applied here).
      const centerDeg = i * 30 + 15 - 180;
      const centerRad = centerDeg * Math.PI / 180;

      // Build a path that runs along the ribbon midline through this sign's
      // 30° span. To make the text read upright on both halves of the wheel,
      // we flip the path direction when the sign sits on the bottom half.
      const half1Deg = i * 30 - 180;
      const half2Deg = (i + 1) * 30 - 180;
      const onTopHalf = Math.sin(centerRad) < 0; // y<0 in SVG = top

      const a0 = (onTopHalf ? half1Deg : half2Deg) * Math.PI / 180;
      const a1 = (onTopHalf ? half2Deg : half1Deg) * Math.PI / 180;

      const x0 = svgcx + svgRribbonMid * Math.cos(a0);
      const y0 = svgcy + svgRribbonMid * Math.sin(a0);
      const x1 = svgcx + svgRribbonMid * Math.cos(a1);
      const y1 = svgcy + svgRribbonMid * Math.sin(a1);
      const sweep = onTopHalf ? 1 : 0;

      const pathId = `astro-decanic-ribbon-path-${i}`;
      svg.append('defs').append('path')
        .attr('id', pathId)
        .attr('d', `M ${x0} ${y0} A ${svgRribbonMid} ${svgRribbonMid} 0 0 ${sweep} ${x1} ${y1}`)
        .attr('fill', 'none');

      svg.append('text')
        .attr('class', 'astro-decanic-ribbon-text')
        .append('textPath')
        .attr('href', `#${pathId}`)
        .attr('startOffset', '50%')
        .attr('text-anchor', 'middle')
        .text(`${sg.name} · ${i * 30}°–${(i + 1) * 30}°`);
    });

    // 12-sign glyphs at the outermost ring
    SIGNS.forEach((sg, i) => {
      const angCenter = (i * 30 + 15 - 180) * Math.PI / 180;
      const lx = svgcx + svgRsign * Math.cos(angCenter);
      const ly = svgcy + svgRsign * Math.sin(angCenter);
      svg.append('text').attr('class', 'astro-decanic-sign-label')
        .attr('x', lx).attr('y', ly)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', 'var(--text-1)').attr('font-family', 'var(--serif)').attr('font-size', '15px')
        .text(sg.glyph);
    });

    // 36 decan sectors
    const arc = d3.arc().innerRadius(svgRi).outerRadius(svgR).padAngle(0.004);
    const sectorG = svg.append('g').attr('class', 'astro-decanic-sectors')
      .attr('transform', `translate(${svgcx}, ${svgcy}) rotate(-90)`);
    // The rotate(-90) puts 0° at the top; but astrological wheels conventionally place
    // Aries 0° at the 9-o'clock position. We compensate by computing the per-decan start
    // angle directly in degrees from Aries 0° clockwise.

    // Compute start/end angle (radians) for each decan, with Aries 0° at the 9-o'clock
    // position (i.e., -180° from the SVG default). Each decan is 10°.
    decans.forEach((d, i) => {
      const startDeg = i * 10 - 180;
      const endDeg = (i + 1) * 10 - 180;
      d._startAng = (startDeg + 90) * Math.PI / 180; // +90 because we rotated -90
      d._endAng   = (endDeg + 90) * Math.PI / 180;
      d._midDeg   = (i * 10 + 5) - 180; // for label positioning in untransformed SVG space
    });

    const sectors = sectorG.selectAll('path.astro-decan-sector')
      .data(decans).enter().append('path')
      .attr('class', 'astro-decan-sector')
      .attr('d', d => arc({ startAngle: d._startAng, endAngle: d._endAng }))
      .attr('fill', d => PLANET_COLORS[d.western.ruler_chaldean_face] || '#7a8090')
      .attr('fill-opacity', 0.78)
      .attr('stroke', 'var(--bg-0)').attr('stroke-width', 1.2)
      .style('cursor', 'pointer')
      .on('mouseenter', function (ev, d) {
        d3.select(this).attr('fill-opacity', 1);
        const ruler = d.western.ruler_chaldean_face;
        const glyph = PLANET_GLYPHS[ruler] || '';
        tooltip.innerHTML = `
          <div class="adt-row1">Decan ${d.n} · ${d.western.sign} ${d.western.decan_n}</div>
          <div class="adt-row2">${d.western.degrees}</div>
          <div class="adt-row3"><span class="adt-glyph" style="color:${PLANET_COLORS[ruler] || '#fff'}">${glyph}</span> ${ruler}</div>
        `;
        tooltip.style.display = 'block';
      })
      .on('mousemove', function (ev) {
        const rect = svgWrap.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        // Offset so tooltip doesn't sit under cursor; flip side near right edge.
        const tw = tooltip.offsetWidth || 160;
        const px = (x + tw + 18 > rect.width) ? (x - tw - 14) : (x + 14);
        const py = Math.max(6, y - 18);
        tooltip.style.left = px + 'px';
        tooltip.style.top  = py + 'px';
      })
      .on('mouseleave', function () {
        d3.select(this).attr('fill-opacity', 0.78);
        tooltip.style.display = 'none';
      })
      .on('click', function (ev, d) {
        sectors.classed('selected', s => s.n === d.n);
        renderDetail(d);
      });

    // Per-sector glyph + number labels.
    //   - Outer ring (closer to wheel rim): the planet glyph (high-contrast white).
    //   - Inner ring (closer to centre): the small decan number 1–36.
    const labelG = svg.append('g').attr('class', 'astro-decanic-labels');
    const rMid = (svgRi + svgR) / 2;
    const rGlyph = rMid + (svgR - rMid) * 0.40;   // outer-ish
    const rNum   = rMid - (rMid - svgRi) * 0.55;  // inner-ish
    decans.forEach(d => {
      const mid = d._midDeg * Math.PI / 180;
      const gx = svgcx + rGlyph * Math.cos(mid);
      const gy = svgcy + rGlyph * Math.sin(mid);
      const nx = svgcx + rNum   * Math.cos(mid);
      const ny = svgcy + rNum   * Math.sin(mid);
      const ruler = d.western.ruler_chaldean_face;
      const glyph = PLANET_GLYPHS[ruler] || '';

      labelG.append('text').attr('class', 'astro-decan-glyph')
        .attr('x', gx).attr('y', gy)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .text(glyph);

      labelG.append('text').attr('class', 'astro-decan-num')
        .attr('x', nx).attr('y', ny)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .text(d.n);
    });

    // Western face-ruler tick marks at sign boundaries (every 30°)
    for (let i = 0; i < 12; i++) {
      const a = (i * 30 - 180) * Math.PI / 180;
      const x1 = svgcx + svgRi * Math.cos(a), y1 = svgcy + svgRi * Math.sin(a);
      const x2 = svgcx + svgR  * Math.cos(a), y2 = svgcy + svgR  * Math.sin(a);
      svg.append('line').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
        .attr('stroke', 'var(--gold-soft)').attr('stroke-opacity', 0.6).attr('stroke-width', 1);
    }

    // Centerpiece — small caption
    svg.append('text').attr('class', 'astro-decanic-center')
      .attr('x', svgcx).attr('y', svgcy - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--gold-soft)').attr('font-family', 'var(--serif)').attr('font-size', '14px')
      .text('Decanic Wheel');
    svg.append('text').attr('class', 'astro-decanic-center-sub')
      .attr('x', svgcx).attr('y', svgcy + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-3)').attr('font-family', 'var(--mono)').attr('font-size', '10px')
      .text('36 × 5 cross-tradition');

    // Default: render decan 1 in side panel
    renderDetail(decans[0]);
    sectors.classed('selected', d => d.n === 1);

    function renderDetail(d) {
      const slot = document.getElementById('ads-detail');
      if (!slot) return;
      const vaultLinks = (d.vault_node_ids || []).map(id => `<a href="#" data-node-id="${id}" class="ads-vault-link">${id}</a>`).join(' · ') || '<span class="ads-empty">— no vault anchors yet —</span>';
      const lead = buildDecanLead(d);
      const ruler = d.western.ruler_chaldean_face;
      const rulerGlyph = PLANET_GLYPHS[ruler] || '';
      slot.innerHTML = `
        <div class="ads-decan-lead">${lead}</div>

        <div class="ads-decan-head">
          <span class="ads-decan-n">Decan ${d.n}</span>
          <span class="ads-decan-deg">${d.western.sign} ${d.western.decan_n} · ${d.western.degrees}</span>
          <span class="ads-decan-ruler" style="color:${PLANET_COLORS[ruler] || 'var(--text-1)'}">${rulerGlyph} ${ruler}</span>
          ${d.uncertain ? '<span class="ads-uncertain" title="' + (d.caveat || 'flagged uncertain') + '">⚠ uncertain</span>' : ''}
        </div>

        <div class="ads-cell ads-cell-western" style="--cell-accent:${PLANET_COLORS[d.western.ruler_chaldean_face] || '#7a8090'}">
          <div class="ads-cell-head">Western (Picatrix / Chaldean)</div>
          <div class="ads-cell-body">
            <div><b>Face-ruler:</b> ${d.western.ruler_chaldean_face} · <b>Triplicity:</b> ${d.western.ruler_triplicity}</div>
            <div class="ads-image">${d.western.picatrix_image}</div>
          </div>
        </div>

        <div class="ads-cell ads-cell-egyptian">
          <div class="ads-cell-head">Egyptian (Senenmut decan)</div>
          <div class="ads-cell-body">
            <div><b>${d.egyptian.name}</b> <span class="ads-alt">${(d.egyptian.name_alt || []).join(', ')}</span></div>
            <div class="ads-meta">Rising star: ${d.egyptian.rising_star} · ${d.egyptian.season}</div>
            ${d.egyptian.deity_association ? `<div class="ads-meta">Deity: ${d.egyptian.deity_association}</div>` : ''}
          </div>
        </div>

        <div class="ads-cell ads-cell-vedic">
          <div class="ads-cell-head">Vedic (Nakshatra, Lahiri)</div>
          <div class="ads-cell-body">
            <div><b>${d.vedic.nakshatra}</b>${d.vedic.n ? ' · n=' + d.vedic.n : ''}</div>
            ${d.vedic.degrees_sidereal ? `<div class="ads-meta">${d.vedic.degrees_sidereal}</div>` : ''}
            ${d.vedic.deity ? `<div class="ads-meta">Lord: ${d.vedic.lord || '—'} · Deity: ${d.vedic.deity}</div>` : ''}
            ${d.vedic.symbol ? `<div class="ads-meta">Symbol: ${d.vedic.symbol}</div>` : ''}
          </div>
        </div>

        <div class="ads-cell ads-cell-arabic">
          <div class="ads-cell-head">Arabic Manzil al-Qamar</div>
          <div class="ads-cell-body">
            <div><b>${d.arabic_manzil.name}</b> · n=${d.arabic_manzil.n}</div>
            <div class="ads-meta">${d.arabic_manzil.translation}</div>
            ${d.arabic_manzil.stars ? `<div class="ads-meta">Stars: ${d.arabic_manzil.stars}</div>` : ''}
            ${d.arabic_manzil.category ? `<div class="ads-meta">${d.arabic_manzil.category}</div>` : ''}
          </div>
        </div>

        <div class="ads-cell ads-cell-chinese">
          <div class="ads-cell-head">Chinese Xiu</div>
          <div class="ads-cell-body">
            <div><b>${d.chinese_xiu.name}</b> · n=${d.chinese_xiu.n}</div>
            <div class="ads-meta">${d.chinese_xiu.translation}</div>
            ${d.chinese_xiu.constellation ? `<div class="ads-meta">${d.chinese_xiu.constellation}</div>` : ''}
            ${d.chinese_xiu.palace ? `<div class="ads-meta">Palace: ${d.chinese_xiu.palace} · Element: ${d.chinese_xiu.element}</div>` : ''}
          </div>
        </div>

        <div class="ads-notes"><b>Cross-tradition notes:</b> ${d.cross_tradition_notes}</div>
        ${d.caveat ? `<div class="ads-caveat">⚠ ${d.caveat}</div>` : ''}

        <div class="ads-vault-anchors">
          <div class="ads-cell-head">Vault anchors</div>
          <div class="ads-vault-list">${vaultLinks}</div>
        </div>
      `;
      slot.querySelectorAll('.ads-vault-link').forEach(a => {
        a.onclick = (ev) => { ev.preventDefault(); if (window.selectNode) window.selectNode(a.dataset.nodeId, true); };
      });
    }
  }

  window._astroDecanic = { render: render };
})();
