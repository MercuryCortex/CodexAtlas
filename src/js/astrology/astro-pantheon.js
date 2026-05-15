// ============================================================
// CODEX ATLAS — Astrology · Pantheon mode (cross-tradition planet-deity wheel)
// 7 wedges, one per classical planet. Inside each wedge: the deities from
// every tradition associated with that planet (Sun = Ra + Helios + Sūrya +
// Amaterasu + …). The investigative payoff: see at a glance which cultures
// share a Mars-archetype, a Venus-archetype, etc.
//
// Reads _assets/data/astrology-planet-deities.json (curated mapping table)
// and graciously skips any deity id not present in window.VAULT_DATA.
// Click any node → window.selectNode opens the detail panel.
// ============================================================
(function () {
  const DATA_URL = '_assets/data/astrology-planet-deities.json?v=20260515-astro-pantheon-1';
  let _cached = null;

  function fetchTable() {
    if (_cached) return Promise.resolve(_cached);
    return fetch(DATA_URL).then(r => r.json()).then(j => { _cached = j; return j; });
  }

  // Planet order around the wedge — Chaldean order works well visually
  // (slow → fast → slow) but for cross-tradition pantheon the user expects
  // the classical 7-planet order Sun · Moon · Mercury · Venus · Mars · Jupiter · Saturn.
  const PLANET_ORDER = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';
    rootEl.classList.add('astrology-pane-astro-pantheon');

    const loading = document.createElement('div');
    loading.className = 'astro-decanic-loading';
    loading.textContent = 'Loading cross-tradition planet-deity table…';
    rootEl.appendChild(loading);

    fetchTable().then(payload => {
      rootEl.innerHTML = '';
      drawWheel(rootEl, payload);
    }).catch(err => {
      rootEl.innerHTML = `<div class="astro-decanic-error">Failed to load: ${err.message}</div>`;
    });
  }

  function drawWheel(rootEl, payload) {
    const nodesById = window.NODES_BY_ID || {};
    // For each planet, filter to deities actually in the vault, preserve order.
    const planets = PLANET_ORDER.map(key => {
      const p = payload.planets[key];
      if (!p) return null;
      const present = (p.deities || []).filter(d => nodesById[d.id]);
      const missing = (p.deities || []).filter(d => !nodesById[d.id]);
      return { key, ...p, deities: present, missingCount: missing.length };
    }).filter(Boolean);

    // Two-pane layout: wheel on the left, side panel on the right.
    const layout = document.createElement('div');
    layout.className = 'astro-pantheon-layout';
    rootEl.appendChild(layout);

    const wheelWrap = document.createElement('div');
    wheelWrap.className = 'astro-pantheon-svg-wrap';
    layout.appendChild(wheelWrap);

    const side = document.createElement('div');
    side.className = 'astro-pantheon-side';
    side.innerHTML = `
      <h3 class="aph-title">Astro-Pantheon</h3>
      <div class="aph-intro">
        Seven wedges — one per classical planet. Inside each wedge are the deities from every tradition
        in the vault that share that planet's archetype. The investigative payoff: see at a glance
        which cultures share a <b>Mars-warrior</b>, a <b>Venus-eros</b>, a <b>Saturn-lawgiver</b>,
        a <b>Hermes-messenger</b>, etc.
      </div>
      <div class="aph-howto">
        <div class="aph-howto-title">How to read this view</div>
        <ol class="aph-howto-list">
          <li>Each <b>wedge colour</b> matches the planet's traditional metal/temperament colour.</li>
          <li><b>Hover any node</b> → tooltip with tradition + one-line note from the mapping table.</li>
          <li><b>Click any node</b> → detail panel opens. <b>Click a wedge label</b> → side panel shows the full list for that planet.</li>
        </ol>
      </div>
      <div class="aph-detail" id="aph-detail"></div>
      <div class="aph-foot">
        ${planets.reduce((s, p) => s + p.deities.length, 0)} deities mapped across 7 planets · curated from
        Picatrix · Manilius · Tacitus's <i>interpretatio</i> · Frawley · Wilkinson · Sahagún
      </div>
    `;
    layout.appendChild(side);

    const W = wheelWrap.clientWidth, H = wheelWrap.clientHeight;
    if (!W || !H) return;
    const cx = W / 2, cy = H / 2;
    const Router = Math.min(W, H) * 0.42;
    const Rinner = Router * 0.22;
    const Rlabel = Router * 1.08;
    const Rdeity = Router * 0.78;       // outer ring where deity nodes orbit
    const RdeityInner = Router * 0.40;  // inner ring (compact 2-row layout for small wedges)

    const svg = d3.select(wheelWrap).append('svg')
      .attr('class', 'astro-pantheon-svg')
      .attr('width', '100%').attr('height', '100%')
      .style('display', 'block');

    // Tooltip (reuses the global one).
    const tipEl = document.getElementById('tooltip');

    // Compute wedge angles — 7 equal sectors.
    const TAU = Math.PI * 2;
    const GAP = 0.012;
    const sectorAng = (TAU - GAP * planets.length) / planets.length;
    let cursor = -Math.PI / 2 - sectorAng / 2; // 12 o'clock as the centre of the FIRST wedge (Sun)

    planets.forEach(p => {
      p.a0 = cursor;
      p.a1 = cursor + sectorAng;
      p.aMid = (p.a0 + p.a1) / 2;
      cursor += sectorAng + GAP;
    });

    // ----- wedge backgrounds -----
    const wedgeG = svg.append('g').attr('class', 'aph-wedges');
    planets.forEach(p => {
      const path = describeArc(cx, cy, Rinner, Router, p.a0, p.a1);
      wedgeG.append('path').attr('d', path)
        .attr('fill', p.color).attr('fill-opacity', 0.08)
        .attr('stroke', p.color).attr('stroke-opacity', 0.45).attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('click', () => renderPlanetDetail(p));
    });

    // ----- wedge labels (outside the ring) -----
    planets.forEach(p => {
      const [lx, ly] = polar(cx, cy, Rlabel, p.aMid);
      const g = svg.append('g').attr('class', 'aph-wedge-label').attr('transform', `translate(${lx},${ly})`)
        .style('cursor', 'pointer')
        .on('click', () => renderPlanetDetail(p));
      g.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', p.color).attr('font-family', 'var(--serif)').attr('font-size', '28px')
        .text(p.glyph);
      g.append('text').attr('y', 26).attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-1)').attr('font-family', 'var(--serif)').attr('font-size', '13px')
        .attr('letter-spacing', '0.04em')
        .text(p.name);
      g.append('text').attr('y', 42).attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-3)').attr('font-family', 'var(--mono)').attr('font-size', '9.5px')
        .text(`${p.deities.length} deities`);
    });

    // ----- deity nodes inside each wedge -----
    planets.forEach(p => {
      const N = p.deities.length;
      if (!N) return;
      // Lay deities along an arc inside the wedge, with vertical rows if many.
      const wedgePadA = sectorAng * 0.08;
      const aSpan = sectorAng - wedgePadA * 2;
      const cols = N > 5 ? Math.ceil(N / 2) : N;
      const rows = N > 5 ? 2 : 1;
      p.deities.forEach((d, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const tCol = cols > 1 ? col / (cols - 1) : 0.5;
        const a = p.a0 + wedgePadA + aSpan * tCol;
        const r = rows === 1 ? Rdeity : (row === 0 ? Rdeity : Rdeity - 36);
        const [x, y] = polar(cx, cy, r, a);
        const node = nodesById[d.id];
        const nodeColor = (node && (node.family_color || node.tradition_color)) || p.color;

        const g = svg.append('g').attr('class', 'aph-deity').attr('transform', `translate(${x},${y})`)
          .style('cursor', 'pointer')
          .on('click', () => { if (window.selectNode) window.selectNode(d.id, true); })
          .on('mouseenter', (ev) => showTip(d, p, node, ev))
          .on('mousemove', moveTip)
          .on('mouseleave', hideTip);

        g.append('circle').attr('r', 10).attr('fill', nodeColor)
          .attr('fill-opacity', 0.85).attr('stroke', 'var(--bg-0)').attr('stroke-width', 1.25);

        // Short label (deity name, truncated)
        const label = (node && node.title) || d.id;
        const shortLabel = label.length > 14 ? label.slice(0, 12) + '…' : label;
        g.append('text').attr('y', -14).attr('text-anchor', 'middle')
          .attr('fill', 'var(--text-1)').attr('font-family', 'var(--serif)').attr('font-size', '11px')
          .text(shortLabel);
      });
    });

    // ----- centre legend -----
    svg.append('text').attr('x', cx).attr('y', cy - 10).attr('text-anchor', 'middle')
      .attr('fill', 'var(--gold-soft)').attr('font-family', 'var(--serif)').attr('font-size', '17px')
      .text('Astro-Pantheon');
    svg.append('text').attr('x', cx).attr('y', cy + 14).attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-3)').attr('font-family', 'var(--mono)').attr('font-size', '10.5px')
      .attr('letter-spacing', '0.08em')
      .text('seven planets · every tradition');

    // ----- default detail = Sun (first planet) -----
    renderPlanetDetail(planets[0]);

    // ----- helpers -----
    function renderPlanetDetail(p) {
      const slot = document.getElementById('aph-detail');
      if (!slot) return;
      slot.innerHTML = `
        <div class="aph-planet-head" style="--p-accent:${p.color}">
          <span class="aph-planet-glyph" style="color:${p.color}">${p.glyph}</span>
          <span class="aph-planet-name">${p.name}</span>
        </div>
        <div class="aph-planet-ruler">${p.rulerships}</div>
        <div class="aph-deity-list">
          ${p.deities.map(d => {
            const node = nodesById[d.id];
            const color = (node && (node.family_color || node.tradition_color)) || p.color;
            const title = (node && node.title) || d.id;
            return `<div class="aph-deity-row" data-id="${escapeAttr(d.id)}">
              <span class="aph-deity-swatch" style="background:${color}"></span>
              <span class="aph-deity-title">${escapeHtml(title)}</span>
              <span class="aph-deity-trad">${escapeHtml(d.tradition || '')}</span>
              <span class="aph-deity-note">${escapeHtml(d.note || '')}</span>
            </div>`;
          }).join('')}
        </div>
        ${p.missingCount ? `<div class="aph-missing">${p.missingCount} additional deity${p.missingCount === 1 ? '' : 'ies'} in the curated table not yet stubbed in the vault.</div>` : ''}
      `;
      slot.querySelectorAll('.aph-deity-row').forEach(r => {
        r.onclick = () => { if (window.selectNode) window.selectNode(r.dataset.id, true); };
      });
    }

    function showTip(d, p, node, ev) {
      if (!tipEl) return;
      const title = (node && node.title) || d.id;
      tipEl.innerHTML = `<div class="ttitle" style="color:${p.color}">${p.glyph} ${escapeHtml(title)}</div>
        <div class="tmeta">${escapeHtml(d.tradition || node?.tradition || '')}</div>
        <div class="tmeta">${escapeHtml(d.note || '')}</div>`;
      tipEl.classList.add('show');
      moveTip(ev);
    }
    function moveTip(ev) {
      if (!tipEl) return;
      tipEl.style.left = (ev.clientX + 14) + 'px';
      tipEl.style.top = (ev.clientY + 14) + 'px';
    }
    function hideTip() { if (tipEl) tipEl.classList.remove('show'); }
  }

  // SVG arc helpers — describe a wedge from radii (inner, outer) and angles (a0, a1).
  function polar(cx, cy, r, a) {
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  function describeArc(cx, cy, rInner, rOuter, a0, a1) {
    const [x0o, y0o] = polar(cx, cy, rOuter, a0);
    const [x1o, y1o] = polar(cx, cy, rOuter, a1);
    const [x0i, y0i] = polar(cx, cy, rInner, a0);
    const [x1i, y1i] = polar(cx, cy, rInner, a1);
    const largeArc = (a1 - a0) > Math.PI ? 1 : 0;
    return `M ${x0o},${y0o}
            A ${rOuter},${rOuter} 0 ${largeArc} 1 ${x1o},${y1o}
            L ${x1i},${y1i}
            A ${rInner},${rInner} 0 ${largeArc} 0 ${x0i},${y0i}
            Z`;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  }
  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/["'&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  window._astroPantheon = { render: render };
})();
