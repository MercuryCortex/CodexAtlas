// ============================================================
// CODEX ATLAS — Astrology · Spine mode
// 3,500-year horizontal time-spine of every astrology-tagged dated node.
// Cross-tradition transmission edges drawn as Bezier arcs between dots
// when BOTH endpoints are astrology-tagged. The MASSIVE-WIN view: Babylonian
// 36-star → Egyptian decans → Greek decans → Picatrix → modern visible left-to-right.
//
// Exposed as window._astroSpine.render(rootEl). Reads window.VAULT_DATA + window.selectNode
// (the only stable cross-script API). All other helpers are private to this file.
// ============================================================
(function () {
  const VAULT = () => window.VAULT_DATA || { nodes: [], edges: [] };

  function isAstroTagged(n) {
    return Array.isArray(n.tags) && n.tags.some(t => /^astrology/.test(String(t)));
  }
  function hashStr(s) {
    let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function fmtYr(y) {
    if (y === undefined || y === null || !isFinite(y)) return '—';
    if (y < 0) return Math.abs(y).toLocaleString() + ' BCE';
    return y.toLocaleString() + ' CE';
  }
  function fmtRange(a, b) {
    if (a === undefined || a === null) return '—';
    if (b === undefined || b === null || b === a) return fmtYr(a);
    return fmtYr(a) + ' → ' + fmtYr(b);
  }

  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';
    const data = VAULT();
    const nodes = data.nodes.filter(n => isAstroTagged(n) && typeof n.date_earliest === 'number');
    const idSet = new Set(nodes.map(n => n.id));
    const edges = data.edges.filter(e => idSet.has(e.source) && idSet.has(e.target));

    // degree map (used for circle size + hub-label selection)
    const degree = new Map();
    edges.forEach(e => {
      degree.set(e.source, (degree.get(e.source) || 0) + 1);
      degree.set(e.target, (degree.get(e.target) || 0) + 1);
    });

    // sizing
    const W = rootEl.clientWidth, H = rootEl.clientHeight;
    if (!W || !H) return; // not yet mounted
    const padL = 36, padR = 36, padT = 36, padB = 56;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const cy = padT + plotH / 2;

    // scales
    const x = d3.scaleLinear().domain([-3500, 2050]).range([padL, W - padR]);
    // y jitter: 7 deterministic bands so cluster of same-year nodes spread vertically
    const bands = 7;
    const bandH = Math.min(28, plotH / (bands + 2));
    const nodeById = new Map(nodes.map(n => [n.id, n]));
    nodes.forEach(n => {
      const b = hashStr(n.id) % bands;
      n._spineY = cy + (b - (bands - 1) / 2) * bandH;
    });

    // SVG
    const svg = d3.select(rootEl).append('svg').attr('class', 'astro-spine-svg')
      .attr('width', '100%').attr('height', '100%')
      .style('display', 'block');
    const root = svg.append('g').attr('class', 'astro-spine-root');

    // BACKGROUND era bands (BCE → CE distinction + millennia tinting)
    const eraGroup = svg.append('g').attr('class', 'astro-spine-eras');
    const eraTicks = [-3000, -2000, -1000, 0, 1000, 2000];
    const eraColors = ['rgba(194,84,80,0.04)', 'rgba(224,138,58,0.04)', 'rgba(90,108,196,0.04)',
                       'rgba(107,58,138,0.04)', 'rgba(154,165,90,0.04)', 'rgba(212,165,90,0.04)'];
    for (let i = 0; i < eraTicks.length - 1; i++) {
      const x0 = x(eraTicks[i]), x1 = x(eraTicks[i + 1]);
      eraGroup.append('rect').attr('class', 'astro-era-band')
        .attr('x', x0).attr('y', padT).attr('width', x1 - x0).attr('height', plotH)
        .attr('fill', eraColors[i]);
    }
    // 0 CE divider line
    svg.append('line').attr('class', 'astro-spine-zero')
      .attr('x1', x(0)).attr('x2', x(0)).attr('y1', padT).attr('y2', padT + plotH)
      .attr('stroke', 'var(--gold-soft)').attr('stroke-opacity', 0.35).attr('stroke-dasharray', '2 3');

    // x-axis tick group (will be rescaled on zoom)
    const axisG = svg.append('g').attr('class', 'astro-spine-axis').attr('transform', `translate(0, ${padT + plotH + 12})`);
    function drawAxis(scale) {
      axisG.selectAll('*').remove();
      const ticks = scale.ticks(10);
      ticks.forEach(t => {
        axisG.append('line').attr('x1', scale(t)).attr('x2', scale(t)).attr('y1', -4).attr('y2', 2)
          .attr('stroke', 'var(--text-3)').attr('stroke-opacity', 0.5);
        axisG.append('text').attr('x', scale(t)).attr('y', 14).attr('text-anchor', 'middle')
          .attr('fill', 'var(--text-3)').attr('font-family', 'var(--mono)').attr('font-size', '10.5px')
          .text(t === 0 ? '0' : t < 0 ? Math.abs(t) + ' BCE' : t + ' CE');
      });
    }
    drawAxis(x);

    // EDGE arcs — quadratic Bezier, control point above midpoint
    const edgeG = root.append('g').attr('class', 'astro-spine-edges');
    const edgeSel = edgeG.selectAll('path').data(edges).enter().append('path')
      .attr('class', 'astro-spine-edge')
      .attr('fill', 'none')
      .attr('stroke', 'var(--text-3)')
      .attr('stroke-opacity', 0.22)
      .attr('stroke-width', 1)
      .attr('d', d => {
        const s = nodeById.get(d.source), t = nodeById.get(d.target);
        if (!s || !t) return '';
        const sx = x(s.date_earliest), sy = s._spineY;
        const tx = x(t.date_earliest), ty = t._spineY;
        const mx = (sx + tx) / 2;
        const arch = Math.min(plotH * 0.45, Math.abs(tx - sx) * 0.25);
        const my = Math.min(sy, ty) - arch;
        return `M ${sx},${sy} Q ${mx},${my} ${tx},${ty}`;
      });

    // NODE dots
    const nodeG = root.append('g').attr('class', 'astro-spine-nodes');
    const nodeSel = nodeG.selectAll('g.astro-spine-node').data(nodes, d => d.id).enter().append('g')
      .attr('class', 'astro-spine-node')
      .attr('transform', d => `translate(${x(d.date_earliest)},${d._spineY})`)
      .style('cursor', 'pointer')
      .on('mouseenter', function (ev, d) {
        showTip(d, ev);
        edgeSel.attr('stroke-opacity', e => (e.source === d.id || e.target === d.id) ? 0.85 : 0.06)
               .attr('stroke', e => (e.source === d.id || e.target === d.id) ? (d.family_color || d.tradition_color || 'var(--gold)') : 'var(--text-3)');
        nodeSel.select('circle')
               .attr('opacity', n => (n.id === d.id || edges.some(e => (e.source === d.id && e.target === n.id) || (e.target === d.id && e.source === n.id))) ? 1 : 0.18);
      })
      .on('mousemove', moveTip)
      .on('mouseleave', () => { hideTip(); edgeSel.attr('stroke-opacity', 0.22).attr('stroke', 'var(--text-3)'); nodeSel.select('circle').attr('opacity', 1); })
      .on('click', (ev, d) => { if (window.selectNode) window.selectNode(d.id, true); });

    nodeSel.append('circle')
      .attr('r', d => Math.min(11, 4 + Math.sqrt(degree.get(d.id) || 0) * 1.4))
      .attr('fill', d => d.family_color || d.tradition_color || '#7a8090')
      .attr('stroke', 'var(--bg-0)').attr('stroke-width', 1.25);

    // HUB labels — top 12 by degree, always visible
    const hubLimit = 12;
    const hubs = [...nodes].sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0)).slice(0, hubLimit);
    const hubSet = new Set(hubs.map(h => h.id));
    nodeSel.filter(d => hubSet.has(d.id))
      .append('text')
      .attr('class', 'astro-spine-hub-label')
      .attr('y', d => -(Math.min(11, 4 + Math.sqrt(degree.get(d.id) || 0) * 1.4) + 5))
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-1)')
      .attr('font-family', 'var(--serif)').attr('font-size', '11px')
      .text(d => d.title.length > 26 ? d.title.slice(0, 24) + '…' : d.title);

    // META — small count line bottom-left
    svg.append('text').attr('class', 'astro-spine-meta')
      .attr('x', padL).attr('y', H - 12)
      .attr('fill', 'var(--text-3)')
      .attr('font-family', 'var(--mono)').attr('font-size', '10.5px')
      .text(`${nodes.length} astrology-tagged dated nodes · ${edges.length} cross-tradition edges`);

    // ZOOM — x-only pan/zoom
    const zoom = d3.zoom().scaleExtent([0.6, 12])
      .translateExtent([[-W * 4, 0], [W * 5, H]])
      .on('zoom', (ev) => {
        const tr = ev.transform;
        const xz = tr.rescaleX(x);
        root.selectAll('.astro-spine-node').attr('transform', d => `translate(${xz(d.date_earliest)},${d._spineY})`);
        root.selectAll('.astro-spine-edge').attr('d', d => {
          const s = nodeById.get(d.source), t = nodeById.get(d.target);
          if (!s || !t) return '';
          const sx = xz(s.date_earliest), sy = s._spineY;
          const tx = xz(t.date_earliest), ty = t._spineY;
          const mx = (sx + tx) / 2;
          const arch = Math.min(plotH * 0.45, Math.abs(tx - sx) * 0.25);
          const my = Math.min(sy, ty) - arch;
          return `M ${sx},${sy} Q ${mx},${my} ${tx},${ty}`;
        });
        svg.select('.astro-spine-zero').attr('x1', xz(0)).attr('x2', xz(0));
        eraGroup.selectAll('rect.astro-era-band').each(function (_, i) {
          const x0 = xz(eraTicks[i]), x1 = xz(eraTicks[i + 1]);
          d3.select(this).attr('x', x0).attr('width', x1 - x0);
        });
        drawAxis(xz);
      });
    svg.call(zoom);

    // TOOLTIP — uses the existing #tooltip element from index.html
    const tipEl = document.getElementById('tooltip');
    function showTip(d, ev) {
      if (!tipEl) return;
      tipEl.innerHTML = `<div class="ttitle">${d.title}</div>
        <div class="tmeta">${d.tradition || d.family || '—'}</div>
        <div class="tmeta">${fmtRange(d.date_earliest, d.date_latest)}</div>`;
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

  window._astroSpine = { render: render };
})();
