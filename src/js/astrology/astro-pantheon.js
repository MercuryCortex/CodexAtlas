// ============================================================
// CODEX ATLAS — Astrology · Pantheon mode (cross-tradition planet-deity wheel)
// 7 wedges, one per classical planet. Inside each wedge: the deities from
// every tradition associated with that planet (Sun = Ra + Helios + Sūrya +
// Amaterasu + …). The investigative payoff: see at a glance which cultures
// share a Mars-archetype, a Venus-archetype, etc.
//
// VISUAL IDIOM — sonnet-astro-pantheon-style-1 (2026-05-15):
// Ports the main Pantheon's visual grammar onto the 7-planet constraint so this
// view feels coherent with the rest of the atlas. Tangential family-style labels
// (rotated to follow each wedge's midpoint angle), a thin family-color outer
// rim, a leader-tick from outer hull to label, deity-dots sized by their
// graph degree (sqrt scale), and Pantheon-style hover trails: hovering a deity
// lights up its cross-tradition edges (visible inside the wheel as soft beziers)
// while dimming every other deity + wedge in the field.
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
    const edges = (window.VAULT_DATA && window.VAULT_DATA.edges) || [];

    // For each planet, filter to deities actually in the vault, preserve order.
    const planets = PLANET_ORDER.map(key => {
      const p = payload.planets[key];
      if (!p) return null;
      const present = (p.deities || []).filter(d => nodesById[d.id]);
      const missing = (p.deities || []).filter(d => !nodesById[d.id]);
      return { key, ...p, deities: present, missingCount: missing.length };
    }).filter(Boolean);

    // Build an id → planet map so a hovered deity can ask "what wedge do I live in?"
    const idToPlanet = {};
    planets.forEach(p => p.deities.forEach(d => { idToPlanet[d.id] = p; }));
    const deityIdSet = new Set(Object.keys(idToPlanet));

    // DEGREE map — mirrors the main app's DEGREE Map so dot-size carries connection
    // weight. The main app builds this from EDGES but doesn't expose it on window, so
    // we recompute locally (cheap — single pass).
    const degree = new Map();
    edges.forEach(e => {
      degree.set(e.source, (degree.get(e.source) || 0) + 1);
      degree.set(e.target, (degree.get(e.target) || 0) + 1);
    });

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
          <li><b>Dot size</b> tracks how many vault connections a deity has — Ra, Zeus, and Hermes loom larger than minor figures.</li>
          <li><b>Hover any deity</b> → its cross-tradition edges light up; non-related dots dim.</li>
          <li><b>Click any deity</b> → detail panel. <b>Click a planet label</b> → side panel shows that planet's full list.</li>
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
    const Router = Math.min(W, H) * 0.40;
    const Rinner = Router * 0.22;
    const Rrim   = Router + 6;        // outer family-colour rim
    const Rtick  = Router + 18;       // leader-tick inner end (just outside rim)
    const Rtick2 = Router + 36;       // leader-tick outer end (toward label)
    const Rlabel = Router + 52;       // tangential planet label
    const RglyphOuter = Router - 4;   // glyph anchor radius (just inside outer arc)

    const svg = d3.select(wheelWrap).append('svg')
      .attr('class', 'astro-pantheon-svg')
      .attr('width', '100%').attr('height', '100%')
      .style('display', 'block');

    // Background click clears hover trail (parity with main Pantheon's click-empty behaviour).
    svg.on('click', () => clearHoverTrail());

    // Tooltip (reuses the global one).
    const tipEl = document.getElementById('tooltip');

    // Compute wedge angles — 7 equal sectors. Wider GAP than the previous version so the
    // gutter between wedges reads as deliberately as the main Pantheon's 6° gap.
    const TAU = Math.PI * 2;
    const GAP = 0.038;
    const sectorAng = (TAU - GAP * planets.length) / planets.length;
    let cursor = -Math.PI / 2 - sectorAng / 2; // 12 o'clock as the centre of the FIRST wedge (Sun)

    planets.forEach(p => {
      p.a0 = cursor;
      p.a1 = cursor + sectorAng;
      p.aMid = (p.a0 + p.a1) / 2;
      cursor += sectorAng + GAP;
    });

    // ----- wedge backgrounds (faint family-tinted fills) -----
    const wedgeG = svg.append('g').attr('class', 'aph-wedges');
    planets.forEach(p => {
      const path = describeArc(cx, cy, Rinner, Router, p.a0, p.a1);
      wedgeG.append('path').attr('d', path)
        .attr('class', 'aph-wedge')
        .attr('fill', p.color).attr('fill-opacity', 0.12)
        .attr('stroke', p.color).attr('stroke-opacity', 0.55).attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('click', (ev) => { ev.stopPropagation(); renderPlanetDetail(p); });

      // Family-colour outer rim — a thin arc just outside the wedge that hammers home
      // "this whole sector is X colour". Mirrors the main Pantheon's sector-hull outer edge.
      const rimPath = describeArc(cx, cy, Router + 1, Rrim, p.a0, p.a1);
      wedgeG.append('path').attr('d', rimPath)
        .attr('class', 'aph-wedge-rim')
        .attr('fill', p.color).attr('fill-opacity', 0.85)
        .attr('stroke', 'none')
        .style('pointer-events', 'none');
    });

    // ----- leader-tick from outer rim to label (mirrors main Pantheon's .family-tick) -----
    const tickG = svg.append('g').attr('class', 'aph-tick-layer');
    planets.forEach(p => {
      const [x1, y1] = polar(cx, cy, Rtick, p.aMid);
      const [x2, y2] = polar(cx, cy, Rtick2, p.aMid);
      tickG.append('line').attr('class', 'aph-family-tick')
        .attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
        .attr('stroke', p.color).attr('stroke-opacity', 0.55).attr('stroke-width', 0.9);
    });

    // ----- tangential planet labels (outside the rim, rotated along the wedge midpoint) -----
    // The main Pantheon uses HORIZONTAL labels anchored at the wedge centre with smart
    // text-anchor switching. Astro-Pantheon has only 7 wedges so we can afford the more
    // visually-distinctive TANGENTIAL placement (label rotates with the wheel). The angle
    // is the perpendicular of the radius vector, with a flip when the label would otherwise
    // be upside-down — the same rotation rule used by all D3 radial-label patterns.
    const labelG = svg.append('g').attr('class', 'aph-label-layer');
    planets.forEach(p => {
      const [lx, ly] = polar(cx, cy, Rlabel, p.aMid);
      // Tangential rotation: midpoint-angle + 90°. Flip 180° on the bottom half so text reads
      // left-to-right rather than upside-down. Standard radial-text convention.
      let rot = (p.aMid * 180 / Math.PI) + 90;
      const flipped = (rot > 90 && rot < 270);
      if (flipped) rot += 180;

      const g = labelG.append('g')
        .attr('class', 'aph-planet-label')
        .attr('transform', `translate(${lx},${ly}) rotate(${rot})`)
        .style('cursor', 'pointer')
        .on('click', (ev) => { ev.stopPropagation(); renderPlanetDetail(p); });

      // Glyph + name on one tangential baseline. Count goes underneath in mono.
      // Vertical centring needs different dy depending on flipped state so the text always
      // sits ABOVE the baseline relative to the wheel centre.
      const dyMain = flipped ? '1em' : '-0.35em';
      const dyMeta = flipped ? '-0.35em' : '1em';

      g.append('text')
        .attr('class', 'aph-planet-label-text')
        .attr('text-anchor', 'middle').attr('dy', dyMain)
        .attr('fill', p.color)
        .text(`${p.glyph}  ${p.name.toUpperCase()}`);
      g.append('text')
        .attr('class', 'aph-planet-label-count')
        .attr('text-anchor', 'middle').attr('dy', dyMeta)
        .text(`${p.deities.length} deities`);
    });

    // ----- centre planet-glyph anchors inside each wedge (kept from prior version) -----
    // These sit just inside the outer arc as a quiet secondary anchor; the loud label
    // lives outside. Subtle so they don't fight the deity dots.
    const glyphG = svg.append('g').attr('class', 'aph-inner-glyph-layer');
    planets.forEach(p => {
      const [gx, gy] = polar(cx, cy, Rinner + 22, p.aMid);
      glyphG.append('text')
        .attr('class', 'aph-inner-glyph')
        .attr('x', gx).attr('y', gy)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', p.color)
        .text(p.glyph);
    });

    // ----- deity nodes inside each wedge -----
    // Layout strategy: rows × cols sized by sqrt(N), each deity placed on a polar grid
    // with a small deterministic jitter (hashStr-style) so it doesn't look mechanical.
    // Dot RADIUS scales with that deity's graph degree (sqrt) — same formula as the main
    // Pantheon's `5 + sqrt(deg)*1.8`, capped here to fit the smaller wheel.
    const deityG = svg.append('g').attr('class', 'aph-deity-layer');
    const allDeityNodes = [];   // refs to {p, d, node, sel, x, y, r}

    planets.forEach(p => {
      const N = p.deities.length;
      if (!N) return;
      const wedgePadA = sectorAng * 0.10;
      const aSpan = sectorAng - wedgePadA * 2;
      // rows × cols from sqrt(N) so deity field stays roughly square per wedge.
      const rows = N <= 4 ? 1 : N <= 9 ? 2 : 3;
      const cols = Math.ceil(N / rows);
      // Inner / outer ring boundaries for this wedge's deity grid (pulled in from the
      // outer arc so dots don't bump the rim, and out from the inner arc so they don't
      // crowd the centre glyph).
      const rOuter = Router * 0.86;
      const rInner = Rinner + 36;

      p.deities.forEach((d, idx) => {
        const row = idx % rows;
        const col = Math.floor(idx / rows);
        const colsInThisRow = Math.ceil((N - row) / rows);
        const tCol = colsInThisRow > 1 ? col / (colsInThisRow - 1) : 0.5;
        const a = p.a0 + wedgePadA + aSpan * tCol;
        let r;
        if (rows === 1) r = (rInner + rOuter) / 2;
        else if (rows === 2) r = row === 0 ? rOuter - 6 : rInner + 6;
        else r = row === 0 ? rOuter - 4 : row === 1 ? (rInner + rOuter) / 2 : rInner + 4;
        // tiny deterministic jitter so the grid doesn't look mechanical
        r += ((hashStr(d.id) % 10) - 5);

        const [x, y] = polar(cx, cy, r, a);
        const node = nodesById[d.id];
        const nodeColor = (node && (node.family_color || node.tradition_color)) || p.color;
        const deg = degree.get(d.id) || 0;
        // sqrt scaling — mirrors main Pantheon's tier sizing. Floor at 4, ceiling at 11
        // so even the smallest wedge (Saturn, 6 deities) reads at a glance and the
        // biggest hubs (Ra deg≈70, Zeus deg≈60) don't crash into each other.
        const dotR = Math.max(4, Math.min(11, 4 + Math.sqrt(deg) * 1.2));

        const g = deityG.append('g').attr('class', 'aph-deity').attr('transform', `translate(${x},${y})`)
          .style('cursor', 'pointer')
          .on('click', (ev) => { ev.stopPropagation(); if (window.selectNode) window.selectNode(d.id, true); })
          .on('mouseenter', (ev) => { showTip(d, p, node, ev); applyHoverTrail(d.id); })
          .on('mousemove', moveTip)
          .on('mouseleave', () => { hideTip(); clearHoverTrail(); });

        g.append('circle').attr('class', 'aph-deity-dot')
          .attr('r', dotR).attr('fill', nodeColor)
          .attr('fill-opacity', 0.9).attr('stroke', 'var(--bg-0)').attr('stroke-width', 1.25);

        // Short label (deity name, truncated). Position above the dot — distance scaled
        // by the dot's own radius so big hubs don't overlap their own label.
        const label = (node && node.title) || d.id;
        const shortLabel = label.length > 14 ? label.slice(0, 12) + '…' : label;
        g.append('text').attr('class', 'aph-deity-label')
          .attr('y', -(dotR + 4)).attr('text-anchor', 'middle')
          .text(shortLabel);

        allDeityNodes.push({ id: d.id, sel: g, planet: p, x, y, dotR });
      });
    });

    // ----- hover-trail edge layer (drawn ABOVE wedges, BELOW deity dots) -----
    // Edges between two deities in the wheel are drawn as soft beziers pulled toward the
    // centre — same shape function as the main Pantheon's `pantheonEdgePath`. They render
    // only when a deity is hovered (no hover = empty layer). This is what "feels alive"
    // about the main Pantheon: the cross-tradition connections only reveal themselves
    // when you ask for them.
    const trailLayer = svg.insert('g', '.aph-deity-layer').attr('class', 'aph-trail-layer');

    // Pre-build per-deity edge index { id → [ { targetId, type } ] } filtered to
    // OTHER deities in the wheel. Avoids walking all 12k edges on every hover.
    const deityEdgeIndex = {};
    edges.forEach(e => {
      const aIn = deityIdSet.has(e.source);
      const bIn = deityIdSet.has(e.target);
      if (aIn && bIn && e.source !== e.target) {
        (deityEdgeIndex[e.source] = deityEdgeIndex[e.source] || []).push({ other: e.target, type: e.type });
        (deityEdgeIndex[e.target] = deityEdgeIndex[e.target] || []).push({ other: e.source, type: e.type });
      }
    });

    // Quick map id → {x,y} for trail-drawing
    const idToXY = {};
    allDeityNodes.forEach(n => { idToXY[n.id] = { x: n.x, y: n.y }; });

    function trailEdgePath(sx, sy, tx, ty) {
      const mx = (sx + tx) / 2, my = (sy + ty) / 2;
      const k = 0.45;  // pull toward centre — stronger than main Pantheon's 0.35 because
                       // the astro wheel is smaller and we want a clear chord-curl
      const cxp = mx + (cx - mx) * k, cyp = my + (cy - my) * k;
      return `M ${sx},${sy} Q ${cxp},${cyp} ${tx},${ty}`;
    }

    function applyHoverTrail(id) {
      const conns = deityEdgeIndex[id] || [];
      const lit = new Set([id]);
      conns.forEach(c => lit.add(c.other));

      // Draw the lit edges.
      trailLayer.selectAll('path').remove();
      const here = idToXY[id];
      if (!here) return;
      conns.forEach(c => {
        const there = idToXY[c.other];
        if (!there) return;
        trailLayer.append('path')
          .attr('class', 'aph-trail-line')
          .attr('d', trailEdgePath(here.x, here.y, there.x, there.y))
          .attr('fill', 'none');
      });

      // Dim every deity not in the lit set; highlight the lit set.
      allDeityNodes.forEach(n => {
        n.sel.classed('aph-deity-dim', !lit.has(n.id));
        n.sel.classed('aph-deity-lit', lit.has(n.id));
      });
      // Also dim wedges that have zero lit deities (so the eye finds the active families).
      const litPlanets = new Set();
      allDeityNodes.forEach(n => { if (lit.has(n.id)) litPlanets.add(n.planet.key); });
      wedgeG.selectAll('.aph-wedge').classed('aph-wedge-dim', function () {
        // Map back to planet via index — we don't have planet on the path; just always
        // dim and re-lift via a paired selector. Cleaner: tag wedges with planet key.
        return true;
      });
      // Cleanly handled by re-tagging below — see wedge data-key annotation in render-time.
      wedgeG.selectAll('.aph-wedge').each(function (_, i) {
        const key = planets[i] && planets[i].key;
        d3.select(this).classed('aph-wedge-dim', !litPlanets.has(key));
      });
    }
    function clearHoverTrail() {
      trailLayer.selectAll('path').remove();
      allDeityNodes.forEach(n => { n.sel.classed('aph-deity-dim', false).classed('aph-deity-lit', false); });
      wedgeG.selectAll('.aph-wedge').classed('aph-wedge-dim', false);
    }

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
      const deg = degree.get(d.id) || 0;
      tipEl.innerHTML = `<div class="ttitle" style="color:${p.color}">${p.glyph} ${escapeHtml(title)}</div>
        <div class="tmeta">${escapeHtml(d.tradition || node?.tradition || '')} · ${deg} connections</div>
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

  // Lightweight deterministic hash — same shape as the main app's hashStr (used
  // for jitter so a given deity's position is stable across renders).
  function hashStr(s) {
    let h = 0;
    s = String(s);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  }
  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/["'&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  window._astroPantheon = { render: render };
})();
