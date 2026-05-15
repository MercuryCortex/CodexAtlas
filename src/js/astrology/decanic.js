// ============================================================
// CODEX ATLAS — Astrology · Decanic mode
// 36-decan wheel (10° each) with click-to-inspect all 5 cross-tradition cells.
// Reads _assets/data/astrology-decans.json (fetched once, cached).
//
// Visual: a single ring divided into 36 sectors. Outer ring labels = Western
// sign-decan (e.g. "Ari 1"). Sectors colored by face-ruler planet (Mars red,
// Sun gold, Venus green, Mercury cyan, Moon silver, Saturn navy, Jupiter purple
// per the Chaldean order). Hover → highlight. Click → open the cross-tradition
// panel showing Egyptian + Vedic + Arabic + Chinese cells plus vault anchors.
// ============================================================
(function () {
  const DATA_URL = '_assets/data/astrology-decans.json?v=20260515-astro-decanic-1';
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

  function drawWheel(rootEl, payload) {
    const decans = payload.decans;
    const W = rootEl.clientWidth, H = rootEl.clientHeight;
    if (!W || !H) return;
    const cx = W / 2, cy = H / 2;
    const Router = Math.min(W, H) * 0.40;
    const Rinner = Router * 0.55;
    const Rlabel = Router * 1.06;

    // SVG canvas (left two-thirds) + detail side-panel (right third)
    const layout = document.createElement('div');
    layout.className = 'astro-decanic-layout';
    rootEl.appendChild(layout);

    const svgWrap = document.createElement('div');
    svgWrap.className = 'astro-decanic-svg-wrap';
    layout.appendChild(svgWrap);

    const sidePanel = document.createElement('div');
    sidePanel.className = 'astro-decanic-side';
    sidePanel.innerHTML = `
      <h3 class="ads-title">Decanic Atlas</h3>
      <div class="ads-intro">
        ${decans.length} decans · ${payload.sources.length} sources · ayanamsa ${payload.ayanamsa.split(',')[0]}.
        Click any decan sector to inspect its Egyptian / Western / Vedic / Arabic / Chinese cells.
      </div>
      <div class="ads-detail" id="ads-detail"></div>
    `;
    layout.appendChild(sidePanel);

    const svgW = svgWrap.clientWidth, svgH = svgWrap.clientHeight;
    const svgcx = svgW / 2, svgcy = svgH / 2;
    const svgR = Math.min(svgW, svgH) * 0.40;
    const svgRi = svgR * 0.55;
    const svgRl = svgR * 1.08;
    const svgRsign = svgR * 1.20;

    const svg = d3.select(svgWrap).append('svg')
      .attr('class', 'astro-decanic-svg')
      .attr('width', '100%').attr('height', '100%')
      .style('display', 'block');

    // 12-sign labels at the outermost ring
    const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    signs.forEach((sg, i) => {
      // Each sign covers 30°; we orient 0° = Aries at the left (9 o'clock) and go clockwise (astrological convention).
      const angCenter = (i * 30 + 15 - 180) * Math.PI / 180;
      const lx = svgcx + svgRsign * Math.cos(angCenter);
      const ly = svgcy + svgRsign * Math.sin(angCenter);
      svg.append('text').attr('class', 'astro-decanic-sign-label')
        .attr('x', lx).attr('y', ly)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', 'var(--text-1)').attr('font-family', 'var(--serif)').attr('font-size', '13px')
        .text(sg);
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
    });

    const sectors = sectorG.selectAll('path.astro-decan-sector')
      .data(decans).enter().append('path')
      .attr('class', 'astro-decan-sector')
      .attr('d', d => arc({ startAngle: d._startAng, endAngle: d._endAng }))
      .attr('fill', d => PLANET_COLORS[d.western.ruler_chaldean_face] || '#7a8090')
      .attr('fill-opacity', 0.7)
      .attr('stroke', 'var(--bg-0)').attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseenter', function (ev, d) {
        d3.select(this).attr('fill-opacity', 1);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('fill-opacity', 0.7);
      })
      .on('click', function (ev, d) {
        sectors.classed('selected', s => s.n === d.n);
        renderDetail(d);
      });

    // Decan-number labels (1-36) inside each sector
    const labelG = svg.append('g').attr('class', 'astro-decanic-labels');
    decans.forEach(d => {
      const midDeg = ((d.n - 1) * 10 + 5) - 180;
      const mid = midDeg * Math.PI / 180;
      const lx = svgcx + (svgRi + (svgR - svgRi) / 2) * Math.cos(mid);
      const ly = svgcy + (svgRi + (svgR - svgRi) / 2) * Math.sin(mid);
      labelG.append('text').attr('class', 'astro-decan-num')
        .attr('x', lx).attr('y', ly)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', '#fff').attr('font-family', 'var(--mono)').attr('font-size', '10px')
        .attr('opacity', 0.85)
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
      slot.innerHTML = `
        <div class="ads-decan-head">
          <span class="ads-decan-n">Decan ${d.n}</span>
          <span class="ads-decan-deg">${d.western.sign} ${d.western.decan_n} · ${d.western.degrees}</span>
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
