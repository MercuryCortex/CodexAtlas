// ============================================================
// CODEX ATLAS — Pantheon v2 (WebGL R&D track)
// ============================================================
//
// SECOND ATTEMPT at the WebGL Pantheon. Sigma.js + graphology renderer
// targeting visual + interaction parity with the production D3 SVG
// Pantheon. Hidden behind ?webgl=1 URL flag.
//
// PARITY GATE (must all be ✓ before promoting to default):
//   [✓] Family-wedge polar layout (sqrt-weighted arcs, GAP=0.105 rad)
//   [✓] Family-color node fills + sqrt-degree node sizing
//   [✓] Click → window.selectNode (detail panel)
//   [✓] Hover trail — dim non-neighbors, highlight edges (sigma reducer)
//   [✓] Translucent family hulls (SVG overlay, annular wedge geometry,
//       same d3.arc-equivalent path as production .sector-hull)
//   [✓] Curved Q-bezier edges (SVG overlay, control pulled 35% toward
//       center — exact production formula; sigma's stock edges are
//       hidden via size 0)
//   [✓] Tangential family rim labels (DOM overlay synced to camera)
//   [✓] More deity labels — degree≥6 threshold + labelDensity 1.0
//   [✓] Thumbnail hover card — image + title + family · tradition +
//       connection count + wikipedia link
//   [✓] Mode dropdown (deities/authors/symbols/events/monuments)
//   [✓] labels: hub/all/off toggle
//   [✓] Ego-focus button
//   [✓] Family-legend click-to-filter
//   [✓] Family-filter + tier-overlay parity
//   [✓] Force-simulation layout (jitter + weaker anchor = organic spread)
//
// EDGE-CURVE NOTE: brief recommended vendoring `@sigma/edge-curve` and
// registering an EdgeCurveProgram. That package only ships CJS/ESM
// (no UMD bundle) and imports from `sigma`, which cannot resolve in
// browser without a bundler. We use option (b) instead — SVG overlay
// path elements with the exact `Q ${cxp},${cyp}` formula production
// uses. Sigma's stock straight-line edges are sized to 0 so only the
// curved overlay paints. At ~1000 edges this is fine perf-wise; if
// the slice grows past ~5k we can revisit by adding a bundler step.
//
// REUSES from existing modules:
//   window.VAULT_DATA / NODES_BY_ID / EDGES / DATA / FAMILIES — from app.js
//   window.selectNode
// ============================================================
(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  // Module-level state: persists across render calls so mode/label choices
  // survive filter changes (legend clicks, mode dropdown changes).
  let _currentMode  = 'deities'; // 'deities'|'authors'|'symbols'|'events'|'monuments'

  // Deterministic per-id hash (djb2) — used for radial jitter so the wedge
  // grid doesn't look mechanical. Matches production's hashStr usage.
  function hashStr(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  // ============================================================
  // PHASE D — FORCE-RELAXATION BAKE
  // ============================================================
  // One-shot pre-paint relaxation pass. Mirrors production's
  // d3.forceSimulation (app.js:1322-1361) but bakes settled positions
  // before sigma ever paints — no live loop, zero render-perf cost.
  //
  // Three forces:
  //   anchor  — pull each node toward its computed wedge-slot (the
  //             radial-row position from computeWedgePositions)
  //   charge  — gentle Coulomb repulsion from neighbours WITHIN the
  //             same wedge (other wedges are angularly clamped out)
  //   collide — non-overlap constraint (radius ∝ √degree)
  //
  // Hard wedge clamp every iteration:
  //   radial   ∈ [Rinner + 14,  Router - 14]
  //   angular  ∈ [center - halfArc + padA,  center + halfArc - padA]
  //
  // O(Σ wedge_size²) per iter ≈ O(10k) — finishes in ~50 ms for 500 nodes.
  function relaxPositions(deities, positions, wedges, Rinner, Router, degree, iterations) {
    iterations = iterations || 250;
    // Group nodes by wedge for fast per-wedge pairwise force evaluation.
    const wedgeMembers = new Map();
    const wedgeByNode  = new Map();
    deities.forEach(d => {
      const w = wedges[d.family || 'Other'];
      if (!w) return;
      wedgeByNode.set(d.id, w);
      if (!wedgeMembers.has(w.name)) wedgeMembers.set(w.name, []);
      wedgeMembers.get(w.name).push(d.id);
    });
    // Per-node radius for collide (slightly larger than visual size for breathing).
    const radius = new Map();
    deities.forEach(d => {
      const deg = degree.get(d.id) || 0;
      radius.set(d.id, 9 + Math.sqrt(deg) * 1.5);
    });
    // Working state: { x, y, vx, vy, ax, ay } where (ax,ay) is the static anchor.
    // Initial positions are jittered ±20 px from the slot center so the bake breaks
    // the regular grid symmetry — without jitter the charge forces perfectly cancel
    // between equally-spaced neighbours and nodes barely move from their grid slots.
    // Jitter is derived from hashStr so it's deterministic across renders.
    const P = new Map();
    deities.forEach(d => {
      const p = positions.get(d.id);
      if (!p) return;
      const h = hashStr(d.id + '_jit');
      const jx = ((h % 41) - 20);
      const jy = (((h >> 6) % 41) - 20);
      P.set(d.id, { x: p.x + jx, y: p.y + jy, vx: 0, vy: 0, ax: p.x, ay: p.y });
    });
    // Constants (tuned for V2's 220→540 world scale; production uses 14 px radial pad).
    // Dev panel may override anchorK / chargeK / chargeRange / damp live via
    // window.CODEX_DEV.settings (re-render is triggered on slider release).
    const D = window.CODEX_DEV?.settings || {};
    const ANCHOR_K     = D.anchorK     != null ? D.anchorK     : 0.018;
    const CHARGE_K     = D.chargeK     != null ? D.chargeK     : -550;
    const CHARGE_RANGE = D.chargeRange != null ? D.chargeRange : 180;
    const DAMP         = D.damp        != null ? D.damp        : 0.55;
    const COLLIDE_PAD  = 1.5;
    const RADIAL_PAD   = 14;
    const ANG_PAD_MAX  = 0.045;
    for (let iter = 0; iter < iterations; iter++) {
      // 1) anchor force
      P.forEach(p => {
        p.vx += (p.ax - p.x) * ANCHOR_K;
        p.vy += (p.ay - p.y) * ANCHOR_K;
      });
      // 2) per-wedge pairwise charge + collide
      wedgeMembers.forEach(ids => {
        for (let i = 0; i < ids.length; i++) {
          const pi = P.get(ids[i]); if (!pi) continue;
          const ri = radius.get(ids[i]);
          for (let j = i + 1; j < ids.length; j++) {
            const pj = P.get(ids[j]); if (!pj) continue;
            const dx = pi.x - pj.x, dy = pi.y - pj.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 0.001) continue;
            const dist = Math.sqrt(d2);
            // CHARGE — inverse-square, capped range
            if (dist < CHARGE_RANGE) {
              const fmag = CHARGE_K / d2;
              const fx = (dx / dist) * fmag, fy = (dy / dist) * fmag;
              pi.vx -= fx; pi.vy -= fy;
              pj.vx += fx; pj.vy += fy;
            }
            // COLLIDE — positional resolve if overlapping
            const rj = radius.get(ids[j]);
            const minDist = ri + rj + COLLIDE_PAD;
            if (dist < minDist) {
              const push = (minDist - dist) * 0.35;
              const ux = dx / dist, uy = dy / dist;
              pi.x += ux * push; pi.y += uy * push;
              pj.x -= ux * push; pj.y -= uy * push;
            }
          }
        }
      });
      // 3) integrate + hard wedge clamp
      P.forEach((p, id) => {
        p.vx *= DAMP; p.vy *= DAMP;
        p.x += p.vx; p.y += p.vy;
        const w = wedgeByNode.get(id); if (!w) return;
        let r = Math.hypot(p.x, p.y) || 0.0001;
        let ang = Math.atan2(p.y, p.x);
        // angular clamp — signed shortest delta from wedge center
        let delta = ((ang - w.center + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const halfArc = (w.a1 - w.a0) / 2;
        const padA = Math.min(ANG_PAD_MAX, halfArc * 0.22);
        const maxDelta = Math.max(0, halfArc - padA);
        if (delta >  maxDelta) ang = w.center + maxDelta;
        if (delta < -maxDelta) ang = w.center - maxDelta;
        // radial clamp
        if (r < Rinner + RADIAL_PAD) r = Rinner + RADIAL_PAD;
        if (r > Router - RADIAL_PAD) r = Router - RADIAL_PAD;
        p.x = r * Math.cos(ang);
        p.y = r * Math.sin(ang);
      });
    }
    // Write settled positions back
    P.forEach((p, id) => positions.set(id, { x: p.x, y: p.y }));
  }

  // FAMILY-WEDGE polar layout — same math as the main D3 Pantheon
  // (app.js around line 975), so the angular allocation is identical.
  function computeWedgePositions(deities, families) {
    const famByName = {};
    deities.forEach(d => {
      const f = d.family || 'Other';
      if (!famByName[f]) famByName[f] = { name: f, members: [], color: d.family_color || '#7a8090' };
      famByName[f].members.push(d);
    });
    const familyOrder = (families || []).map(f => f.name).filter(n => famByName[n]);
    Object.keys(famByName).forEach(n => { if (!familyOrder.includes(n)) familyOrder.push(n); });

    const GAP = 0.105; // ~6° gap between wedges (matches main Pantheon)
    const totalGap = GAP * familyOrder.length;
    const totalArc = 2 * Math.PI - totalGap;
    const weights = familyOrder.map(n => Math.max(1.1, Math.sqrt(famByName[n].members.length)));
    const totalW = weights.reduce((a, b) => a + b, 0);
    let cursor = -Math.PI * 0.55; // start near 9 o'clock so labels read naturally
    const wedges = {};
    familyOrder.forEach((name, i) => {
      const arcSize = totalArc * (weights[i] / totalW);
      wedges[name] = {
        name,
        a0: cursor,
        a1: cursor + arcSize,
        center: cursor + arcSize / 2,
        members: famByName[name].members,
        color: famByName[name].color
      };
      cursor += arcSize + GAP;
    });

    // Per-deity anchors: 1-3 concentric rows depending on family size
    const Rinner = 220, Router = 540;
    const positions = new Map();
    Object.values(wedges).forEach(w => {
      const N = w.members.length;
      if (!N) return;
      const wedgePad = Math.min(0.05, (w.a1 - w.a0) * 0.12);
      const aSpan = (w.a1 - w.a0) - wedgePad * 2;
      const rowCount = N <= 4 ? 1 : N <= 9 ? 2 : 3;
      // Sort members by date_earliest (oldest first) so the wedge reads chronologically.
      const sorted = [...w.members].sort((a, b) => {
        const ad = (typeof a.date_earliest === 'number') ? a.date_earliest : 999999;
        const bd = (typeof b.date_earliest === 'number') ? b.date_earliest : 999999;
        if (ad !== bd) return ad - bd;
        return (a.id || '').localeCompare(b.id || '');
      });
      sorted.forEach((d, idx) => {
        const row = idx % rowCount;
        const col = Math.floor(idx / rowCount);
        const colsInRow = Math.ceil((N - row) / rowCount);
        const t = colsInRow > 1 ? col / (colsInRow - 1) : 0.5;
        const ang = w.a0 + wedgePad + aSpan * t;
        // Production row-radii (app.js:1023-1026): keep nodes BUFFERED inside the
        // radial band (hull extends Rinner-22 → Router+22, so nodes must not touch
        // Rinner or Router). 1-row: mid. 2-row: Router-14 / Rinner+14. 3-row: 8 px.
        let r;
        if (rowCount === 1) r = (Rinner + Router) / 2;
        else if (rowCount === 2) r = row === 0 ? Router - 14 : Rinner + 14;
        else r = row === 0 ? Router - 8 : row === 1 ? (Rinner + Router) / 2 : Rinner + 8;
        // Deterministic radial jitter (±5 px) so the grid doesn't look mechanical
        r += ((hashStr(d.id) % 10) - 5);
        positions.set(d.id, {
          x: r * Math.cos(ang),
          y: r * Math.sin(ang)
        });
      });
    });

    return { positions, wedges, familyOrder, famByName, Rinner, Router };
  }

  // EDGE_STYLE — verbatim copy of production app.js:196-241 EDGE_STYLE table.
  // No bucket abstraction, no headline class, no invented per-type colors.
  // Each edge type carries its hand-tuned (color, width, opacity).
  // Idle stroke color is always the slate-blue from CSS (.ph2-edge); these
  // hex values only paint when the edge is .hot (hover/select) via the
  // --edge-type-color CSS var.
  const EDGE_STYLE = {
    // syncretic / kin — gold-brown-green tints
    'syncretic-identification':         { c: '#b08840', w: 0.42, op: 0.36 },
    'syncretic-ancient-identification': { c: '#b08840', w: 0.38, op: 0.30 },
    'syncretic-scholarly-parallel':     { c: '#947030', w: 0.34, op: 0.24 },
    'syncretic-folk-syncretism':        { c: '#7d5e28', w: 0.30, op: 0.20 },
    'syncretic':                        { c: '#b08840', w: 0.36, op: 0.28 },
    'parent-of':                        { c: '#5a7458', w: 0.34, op: 0.30 },
    'child-of':                         { c: '#5a7458', w: 0.34, op: 0.24 },
    'consort':                          { c: '#a85e44', w: 0.36, op: 0.30 },
    // textual / scholarly — slate-teal-blue
    'polemic-against':                  { c: '#a83e4a', w: 0.38, op: 0.32 },
    'direct-quote':                     { c: '#4a8a86', w: 0.34, op: 0.28 },
    'redaction-of':                     { c: '#8a6a30', w: 0.32, op: 0.24 },
    'commentary-on':                    { c: '#8a6a8a', w: 0.30, op: 0.22 },
    'parallel-motif':                   { c: '#5a6a82', w: 0.28, op: 0.22 },
    'shared-milieu':                    { c: '#4a5aa4', w: 0.28, op: 0.20 },
    'shared-tradition':                 { c: '#4a5aa4', w: 0.28, op: 0.18 },
    'manuscript-transmission':          { c: '#6a5a40', w: 0.28, op: 0.20 },
    'influenced-by':                    { c: '#4a8a86', w: 0.30, op: 0.24 },
    'influences':                       { c: '#4a8a86', w: 0.30, op: 0.24 },
    // ambient / structural — barely-visible (flood types)
    'attests':                          { c: '#3a4a66', w: 0.22, op: 0.12 },
    'attested-in':                      { c: '#3a4a66', w: 0.22, op: 0.12 },
    'has-theme':                        { c: '#3a5a3e', w: 0.22, op: 0.12 },
    'context':                          { c: '#3a3e48', w: 0.22, op: 0.12 },
    'tradition-deity':                  { c: '#2f3a4e', w: 0.18, op: 0.10 },
    'tradition-doc':                    { c: '#2f3a4e', w: 0.18, op: 0.10 },
    'tradition-person':                 { c: '#2f3a4e', w: 0.18, op: 0.10 },
    'authored':                         { c: '#8a6a30', w: 0.30, op: 0.24 },
    // cross-symbol — color does the work; width 0.46 / op up to 0.55 for headline
    'ancestor-of':                      { c: '#d4a55a', w: 0.46, op: 0.55 },
    'parallel-form':                    { c: '#a08a5a', w: 0.34, op: 0.36 },
    'syncretic-fusion':                 { c: '#c47a3a', w: 0.42, op: 0.50 },
    'appropriated-by':                  { c: '#c4a05a', w: 0.42, op: 0.50 },
    'polemic-inversion':                { c: '#a83e4a', w: 0.46, op: 0.55 },
    'visual-cognate':                   { c: '#7a8090', w: 0.30, op: 0.28 },
    // symbol → other-node — high volume, nearly invisible
    'symbol-attests-in':                { c: '#6a7a90', w: 0.26, op: 0.16 },
    'symbol-iconography-of':            { c: '#8a6a5a', w: 0.28, op: 0.20 },
    'symbol-in-tradition':              { c: '#5a7080', w: 0.24, op: 0.14 }
  };
  const EDGE_DEFAULT = { c: '#3a4a66', w: 0.25, op: 0.13 };
  // Cross-symbol edge types — mirror of production SYMBOL_CROSS_EDGE_TYPES.
  const SYMBOL_CROSS_EDGE_TYPES = new Set([
    'ancestor-of', 'parallel-form', 'syncretic-fusion',
    'appropriated-by', 'polemic-inversion', 'visual-cognate'
  ]);
  function edgeStyleFor(type) { return EDGE_STYLE[type] || EDGE_DEFAULT; }
  const DEFAULT_EDGE_COLOR = EDGE_DEFAULT.c;

  // SOURCE-INTEGRITY TIER FILL COLORS — matches production CSS vars (app.css:59-63).
  // Used when _tierOverlay is active; replaces family-color fill on each node.
  const TIER_FILL = {
    '1':    '#d4a55a',  // T1: primary sources (deep gold)
    '2':    '#b8c3d0',  // T2: scholarly (silver)
    '3':    '#8a8a82',  // T3: reputable secondary (warm grey)
    '4':    '#a85a5a',  // T4: controversial-but-catalogued (muted crimson)
    'none': '#3e424a',  // no refs yet (faint near-black)
  };

  // Build a degree map from edges — used for sqrt-degree node sizing.
  function computeDegree(edges) {
    const d = new Map();
    edges.forEach(e => {
      d.set(e.source, (d.get(e.source) || 0) + 1);
      d.set(e.target, (d.get(e.target) || 0) + 1);
    });
    return d;
  }

  // ----- ANNULAR-WEDGE PATH GENERATOR -----
  // Mirror of d3.arc() with cornerRadius — produces a rounded annular wedge
  // matching production's .sector-hull geometry exactly. Returns SVG path d.
  //   a0, a1   start/end angles (radians)
  //   rIn,rOut inner / outer radius
  //   cr       corner radius (rounded "extruded-rect" look)
  //   pad      padAngle equivalent — angular padding subtracted from each side
  // NOTE: production polarXY convention is `x = r*sin(a), y = -r*cos(a)`
  // (12 o'clock = a=0). The wedge-positions function above uses the standard
  // math convention (`x=r*cos, y=r*sin`). To keep the hull paths aligned with
  // sigma's coordinate space, we use the SAME math convention here.
  function annularWedgePath(a0, a1, rIn, rOut, cr, pad) {
    const _pad = pad || 0;
    a0 += _pad; a1 -= _pad;
    if (a1 <= a0) return '';
    // Cap corner radius so it never exceeds half the radial span or arc gap.
    const maxByRadial = (rOut - rIn) / 2;
    const _cr = Math.max(0, Math.min(cr || 0, maxByRadial));
    // Math.cos/sin convention (x = r*cos(a), y = r*sin(a))
    const px = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
    // Inset angles for the corner-radius arc on inner/outer rims
    const dOut = _cr / Math.max(rOut, 1e-6);
    const dIn  = _cr / Math.max(rIn,  1e-6);
    const a0o = a0 + dOut, a1o = a1 - dOut;
    const a0i = a0 + dIn,  a1i = a1 - dIn;
    if (a1o <= a0o || a1i <= a0i) {
      // Wedge too narrow for rounded corners — fall back to plain arc.
      const [x0o, y0o] = px(rOut, a0);
      const [x1o, y1o] = px(rOut, a1);
      const [x1i, y1i] = px(rIn,  a1);
      const [x0i, y0i] = px(rIn,  a0);
      const large = (a1 - a0) > Math.PI ? 1 : 0;
      return `M ${x0o},${y0o} A ${rOut},${rOut} 0 ${large} 1 ${x1o},${y1o} L ${x1i},${y1i} A ${rIn},${rIn} 0 ${large} 0 ${x0i},${y0i} Z`;
    }
    // Corner-tangent points (where the corner arcs join the rim arcs / radial lines)
    const [x0oT, y0oT] = px(rOut, a0o);
    const [x1oT, y1oT] = px(rOut, a1o);
    const [x1iT, y1iT] = px(rIn,  a1i);
    const [x0iT, y0iT] = px(rIn,  a0i);
    // Corner-end points on the radial sides
    const [x0oR, y0oR] = px(rOut - _cr, a0);
    const [x1oR, y1oR] = px(rOut - _cr, a1);
    const [x1iR, y1iR] = px(rIn  + _cr, a1);
    const [x0iR, y0iR] = px(rIn  + _cr, a0);
    const large = (a1o - a0o) > Math.PI ? 1 : 0;
    // Build path: outer-rim arc → outer-end corner → end-radial → inner-end corner →
    // inner-rim arc (reversed) → inner-start corner → start-radial → outer-start corner → close
    return [
      `M ${x0oT},${y0oT}`,
      `A ${rOut},${rOut} 0 ${large} 1 ${x1oT},${y1oT}`,
      `A ${_cr},${_cr} 0 0 1 ${x1oR},${y1oR}`,
      `L ${x1iR},${y1iR}`,
      `A ${_cr},${_cr} 0 0 1 ${x1iT},${y1iT}`,
      `A ${rIn},${rIn} 0 ${large} 0 ${x0iT},${y0iT}`,
      `A ${_cr},${_cr} 0 0 1 ${x0iR},${y0iR}`,
      `L ${x0oR},${y0oR}`,
      `A ${_cr},${_cr} 0 0 1 ${x0oT},${y0oT}`,
      'Z'
    ].join(' ');
  }

  // ----- node filter by mode -----
  function filterNodesByMode(mode) {
    const DATA     = window.VAULT_DATA || { nodes: [], edges: [] };
    const EDGES    = DATA.edges || [];
    const NODES_BY_ID = window.NODES_BY_ID || {};
    let authorSet = null;
    if (mode === 'authors') {
      authorSet = new Set();
      const authorEdgeTypes = new Set(['authored', 'attributed-author', 'originated', 'key-figure']);
      EDGES.forEach(e => {
        if (!authorEdgeTypes.has(e.type)) return;
        const candidateId = (e.type === 'key-figure') ? e.target : e.source;
        const cand = NODES_BY_ID[candidateId];
        if (cand && cand.type === 'person') authorSet.add(candidateId);
      });
    }
    return (DATA.nodes || []).filter(n => {
      if (mode === 'deities')   return n.type === 'deity';
      if (mode === 'authors')   return n.type === 'person' && authorSet && authorSet.has(n.id);
      if (mode === 'symbols')   return n.type === 'symbol';
      if (mode === 'events')    return n.type === 'event';
      if (mode === 'monuments') {
        const tags = Array.isArray(n.tags) ? n.tags
          : (typeof n.tags === 'string' ? n.tags.split(/[,\s]+/) : []);
        return tags.includes('monument') || (n.category || '').toLowerCase() === 'monument';
      }
      return false;
    });
  }

  // ----- main render -----
  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';

    if (!window.Sigma || !window.graphology) {
      rootEl.innerHTML = '<div class="ph2-error">sigma.js / graphology not loaded</div>';
      return;
    }
    const data = window.VAULT_DATA || { nodes: [], edges: [] };
    const EDGES = data.edges || [];
    const FAMILIES = data.families || [];

    // Filter nodes for the current mode.
    const deities = filterNodesByMode(_currentMode);
    if (!deities.length) {
      const msgs = { deities: 'No deities in data.', authors: 'No authors found.',
        symbols: 'No symbols found.', events: 'No events found.',
        monuments: 'Monuments — add `tags: [monument]` to site nodes to populate this view.' };
      rootEl.innerHTML = `<div class="ph2-error">${msgs[_currentMode] || 'No nodes.'}</div>`;
      return;
    }

    // Compute wedge layout + per-node positions.
    const { positions, wedges, familyOrder, famByName, Rinner, Router } =
      computeWedgePositions(deities, FAMILIES);

    // Build edge slice — only same-type↔same-type edges.
    const idSet = new Set(deities.map(d => d.id));
    const edges = EDGES.filter(e => idSet.has(e.source) && idSet.has(e.target));
    const degree = computeDegree(edges);

    // Phase D — bake settled positions (force-relaxation pre-paint pass).
    // Lets siblings within a wedge nudge tangentially / radially around each
    // other for breathing room; hubs push minor deities sideways. Hard-clamped
    // to the wedge so nothing escapes. ~50 ms one-shot, zero ongoing perf cost.
    relaxPositions(deities, positions, wedges, Rinner, Router, degree, 250);

    // ----- build graphology graph -----
    const Graph = window.graphology.Graph || window.graphology.default || window.graphology;
    const graph = new Graph();

    // LABEL DENSITY (priority 2 of the parity brief) — production paints every
    // major-degree deity name (~50+ labels: Shiva, Indra, Krishna, Isis, Horus,
    // Zeus, Demeter, Athena, YHWH, Allah, Enlil, Ishtar, Mary, Jesus, …). We
    // mark a node as "hub" if its degree ≥ HUB_DEGREE_THRESHOLD so the label
    // mode 'hub' shows that wider set. Falls back to top-12 if the threshold
    // would yield fewer than 12 (small slices, e.g. monuments).
    const HUB_DEGREE_THRESHOLD = 6;
    const _sortedByDeg = [...degree.entries()].sort((a, b) => b[1] - a[1]);
    const aboveThreshold = _sortedByDeg.filter(e => e[1] >= HUB_DEGREE_THRESHOLD);
    const _hubIdSet = new Set(
      (aboveThreshold.length >= 12 ? aboveThreshold : _sortedByDeg.slice(0, 12))
        .map(e => e[0])
    );

    deities.forEach(d => {
      const pos = positions.get(d.id);
      if (!pos) return;
      const deg = degree.get(d.id) || 0;
      graph.addNode(d.id, {
        x:       pos.x,
        y:       pos.y,
        // Production formula (app.js:1296): radius = 5 + √degree × 1.8, no cap.
        // Hubs get visibly bigger; low-degree nodes stay readable.
        size:    5 + Math.sqrt(deg) * 1.8,
        color:   d.family_color || d.tradition_color || '#7a8090',
        label:   d.title || d.id,
        _isHub:  _hubIdSet.has(d.id),
        _family: d.family || 'Other',
        _node:   d
      });
    });

    let _edgeCounter = 0;
    edges.forEach(e => {
      if (!graph.hasNode(e.source) || !graph.hasNode(e.target)) return;
      const key = `${e.source}__${e.target}__${e.type || 'rel'}__${_edgeCounter++}`;
      try {
        // size: 0 — sigma's straight-line edge program is suppressed.
        // The curved SVG overlay below paints the visible edge.
        graph.addEdgeWithKey(key, e.source, e.target, {
          size: 0,
          color: edgeStyleFor(e.type).hex,
          _type: e.type
        });
      } catch (err) { /* ignore parallel-edge collisions */ }
    });

    // ----- sigma renderer -----
    let _hoverId = null;
    let _selectedId = null;

    // INTERACTIVITY STATE — drives the reducers below.
    //   _labelsMode:  'hub' (degree≥HUB_DEGREE_THRESHOLD, default) | 'all' | 'off'
    //   _egoFocus:    when true + a node is selected, ONLY its 1-hop neighbourhood renders
    //   _familyFilter: family name string (null = no filter) — set by family-legend clicks
    let _labelsMode = 'hub';
    let _egoFocus = false;
    let _familyFilter = null;
    let _tierOverlay = false;

    const settings = {
      renderEdgeLabels: false,
      defaultEdgeColor: DEFAULT_EDGE_COLOR,
      defaultNodeColor: '#7a8090',
      labelColor: { color: '#cad0d8' },
      labelSize: 11,
      labelWeight: 400,
      labelFont: 'Cormorant Garamond, serif',
      // Density bumped from 0.5 → 1.0 + threshold from 7 → 4 (per brief priority 2)
      // so the 40-60 hub labels actually paint simultaneously.
      labelDensity: 1.0,
      labelGridCellSize: 60,
      labelRenderedSizeThreshold: 4,
      enableEdgeEvents: false,
      hideEdgesOnMove: true,
      hideLabelsOnMove: true,
      minCameraRatio: 0.05,
      maxCameraRatio: 8,
      nodeReducer: (id, attrs) => {
        const out = { ...attrs };

        // DEV PANEL — live node-size multiplier
        const _devMult = window.CODEX_DEV?.settings?.nodeSizeMult;
        if (_devMult && _devMult !== 1) out.size = (attrs.size || 4) * _devMult;

        // EGO FOCUS — when active + a node is selected, hide everything outside the 1-hop neighbourhood.
        if (_egoFocus && _selectedId) {
          const inNeighbourhood = (id === _selectedId) ||
            graph.hasEdge(id, _selectedId) || graph.hasEdge(_selectedId, id) ||
            graph.areNeighbors(id, _selectedId);
          if (!inNeighbourhood) { out.hidden = true; return out; }
        }
        // FAMILY FILTER — when set, dim every node not in that family.
        if (_familyFilter && attrs._family !== _familyFilter) {
          out.color = '#2a2c32';
          out.label = '';
          return out;
        }
        // TIER OVERLAY — replace family-color fill with source-integrity tier color.
        // Only fires when _tierOverlay is true and the node has NOT been early-returned
        // by EGO FOCUS or FAMILY FILTER (those paths already set a specific dim color).
        if (_tierOverlay) {
          const tierKey = String((attrs._node || {})._tier ?? 'none');
          out.color = TIER_FILL[tierKey] || TIER_FILL.none;
        }

        // HOVER / SELECT highlighting.
        if (_hoverId === id || _selectedId === id) {
          out.highlighted = true;
          out.zIndex = 2;
        } else if (_hoverId) {
          const isNeighbor =
            graph.hasEdge(id, _hoverId) ||
            graph.hasEdge(_hoverId, id) ||
            graph.areNeighbors(id, _hoverId);
          if (!isNeighbor) {
            out.color = '#3a3d44';
            out.label = '';
          }
        }
        // Phase E — DOM overlay handles ALL node labels (production-style: text
        // above each node, with a halo, plus a degree-priority deconfliction pass).
        // Sigma's built-in labels are fully suppressed here.
        out.label = '';
        return out;
      },
      edgeReducer: (id, attrs) => {
        // Sigma edges are size 0 (curved overlay paints them) — reducer just
        // tracks visibility for hover state, used by overlay-sync below.
        return attrs;
      }
    };

    const sigma = new window.Sigma(graph, rootEl, settings);
    // Zoom camera in so the diagram fills the viewport like production does.
    // Sigma's default fit leaves ~25% padding on each side — too sparse for
    // 500-node deity rings. Ratio 0.78 keeps a small margin without cropping
    // family rim labels (which sit at Router+50).
    try {
      const r = window.CODEX_DEV?.settings?.cameraRatio;
      sigma.getCamera().setState({ ratio: typeof r === 'number' ? r : 0.78 });
    } catch (e) {}

    // ============================================================
    // SVG OVERLAY — hulls (under canvas) + curved edges (under canvas).
    // Sigma's canvas sits ON TOP of this SVG via z-index, so dots paint
    // above edges and edges paint above hulls.
    // ============================================================
    const overlay = document.createElementNS(SVG_NS, 'svg');
    overlay.setAttribute('class', 'ph2-svg-overlay');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.width  = '100%';
    overlay.style.height = '100%';
    // The overlay must sit BEHIND sigma's canvas children. sigma adds canvases
    // with z-index that defaults to auto; setting z-index:0 on the SVG plus
    // letting canvases stay at auto (which paints over earlier siblings) keeps
    // them above the SVG. To be safe we insert the SVG as the FIRST child of
    // rootEl, so it's the lowest in the stacking order.
    if (rootEl.firstChild) rootEl.insertBefore(overlay, rootEl.firstChild);
    else rootEl.appendChild(overlay);

    // Two groups inside the overlay: hulls first (painted bottom), edges on top.
    const hullsG = document.createElementNS(SVG_NS, 'g');
    hullsG.setAttribute('class', 'ph2-hulls-g');
    overlay.appendChild(hullsG);
    const edgesG = document.createElementNS(SVG_NS, 'g');
    edgesG.setAttribute('class', 'ph2-edges-g');
    overlay.appendChild(edgesG);
    // Phase F — radial tick lines from hull outer rim to just inside each
    // family-rim label, matching production (app.js:1169-1177). Painted on
    // TOP of hulls + edges so they read as ownership cues for the labels.
    const ticksG = document.createElementNS(SVG_NS, 'g');
    ticksG.setAttribute('class', 'ph2-ticks-g');
    overlay.appendChild(ticksG);
    // (Phase H gradients removed — P1 doesn't have them; we copy P1 verbatim now.)

    // ----- HULLS (priority 1) -----
    // For each family, draw a rounded annular wedge at the same geometry as
    // production's `.sector-hull` (Rinner-22 → Router+22, padAngle 0.014,
    // cornerRadius 8). The path is drawn in WORLD coordinates (centered on
    // origin, same coord-space as graph nodes). On every sigma camera change
    // we re-project to screen coords by computing the viewport position of
    // origin + a unit reference and applying the resulting translate+scale
    // to the SVG `<g>`'s transform.
    const HULL_INNER = Rinner - 22;
    const HULL_OUTER = Router + 22;
    const HULL_PAD   = 0.014;
    // Was 8 — narrow wedges fell back to plain arc (no rounding), making the
    // ring read as inconsistent (some round, some sharp). 4 fits inside every
    // wedge so all of them get rounded corners.
    const HULL_CR    = 4;
    const hullEls = [];
    const tickEls = [];
    Object.values(wedges).forEach(w => {
      if (!w.members.length) return;
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('class', 'ph2-hull');
      path.setAttribute('d', annularWedgePath(w.a0, w.a1, HULL_INNER, HULL_OUTER, HULL_CR, HULL_PAD));
      path.setAttribute('fill', w.color);
      path.setAttribute('stroke', w.color);
      path.dataset.family = w.name;
      hullsG.appendChild(path);
      hullEls.push(path);
      // Phase F — radial tick line: from inside the hull's outer rim out
      // toward the family label. Production geometry (app.js:1169-1177):
      // Router+6 → Router+38 (hull outer is Router+22, label is at +56).
      const tick = document.createElementNS(SVG_NS, 'line');
      const cx0 = (Router +  6) * Math.cos(w.center);
      const cy0 = (Router +  6) * Math.sin(w.center);
      const cx1 = (Router + 38) * Math.cos(w.center);
      const cy1 = (Router + 38) * Math.sin(w.center);
      tick.setAttribute('x1', cx0); tick.setAttribute('y1', cy0);
      tick.setAttribute('x2', cx1); tick.setAttribute('y2', cy1);
      tick.setAttribute('stroke', w.color);
      tick.setAttribute('class', 'ph2-rim-tick');
      tick.dataset.family = w.name;
      ticksG.appendChild(tick);
      tickEls.push(tick);
    });

    // ----- CURVED EDGES (priority 3) -----
    // Q-bezier with control point pulled 35% from chord midpoint toward
    // origin (0,0 = ring center). Exact production formula from
    // pantheonEdgePath() at app.js:1209-1216.
    const EDGE_PULL = 0.35;
    const edgeEls = [];
    edges.forEach(e => {
      const sp = positions.get(e.source);
      const tp = positions.get(e.target);
      if (!sp || !tp) return;
      const mx = (sp.x + tp.x) / 2;
      const my = (sp.y + tp.y) / 2;
      // center is (0,0) in world coords — pull control point that direction
      const cxp = mx + (0 - mx) * EDGE_PULL;
      const cyp = my + (0 - my) * EDGE_PULL;
      // Verbatim copy of production .edge-line pattern (app.js:1235-1252):
      // - Class: ph2-edge (plus xsym / xsym-xfamily for cross-symbol types in symbols mode)
      // - Inline `stroke-width` and `stroke-opacity` SVG attrs per edge from EDGE_STYLE
      // - --edge-type-color CSS var holds the hot-state color; idle stroke is slate-blue from CSS
      const st = edgeStyleFor(e.type);
      const path = document.createElementNS(SVG_NS, 'path');
      let cls = 'ph2-edge';
      if (_currentMode === 'symbols' && SYMBOL_CROSS_EDGE_TYPES.has(e.type)) {
        cls += ' xsym';
        const sNode = window.NODES_BY_ID && window.NODES_BY_ID[e.source];
        const tNode = window.NODES_BY_ID && window.NODES_BY_ID[e.target];
        if (sNode && tNode && (sNode.family || 'Other') !== (tNode.family || 'Other')) cls += ' xsym-xfamily';
      }
      path.setAttribute('class', cls);
      path.setAttribute('d', `M ${sp.x},${sp.y} Q ${cxp},${cyp} ${tp.x},${tp.y}`);
      path.style.setProperty('--edge-type-color', st.c);
      // V2 needs to dim P1's values uniformly. P1's live force-sim bundles
      // edges (connected nodes pull together → shorter, less-overlapping chords).
      // V2's static bake produces longer cross-canvas chords that pile up
      // through the centre, making the same width/opacity feel ~2× louder.
      // 0.6× scale brings perceived density in line with P1 while preserving
      // P1's per-type RANKING (ambient still ambient, headlines still loud).
      path.setAttribute('stroke-width',   (st.w  * 0.6).toFixed(3));
      path.setAttribute('stroke-opacity', (st.op * 0.6).toFixed(3));
      path.setAttribute('fill', 'none');
      path.dataset.source = e.source;
      path.dataset.target = e.target;
      path.dataset.type   = e.type || '';
      edgesG.appendChild(path);
      edgeEls.push({ el: path, s: e.source, t: e.target, st });
    });

    // Dev panel hook — expose sigma + overlay data for live-tweaking.
    if (window.CODEX_DEV) {
      window.CODEX_DEV._sigma     = sigma;
      window.CODEX_DEV._edgeEls   = edgeEls;
      window.CODEX_DEV._positions = positions;
    }

    // Build neighbour index for fast hover dim/highlight on the edge overlay.
    const neighborIdx = new Map();
    edges.forEach(e => {
      if (!neighborIdx.has(e.source)) neighborIdx.set(e.source, new Set());
      if (!neighborIdx.has(e.target)) neighborIdx.set(e.target, new Set());
      neighborIdx.get(e.source).add(e.target);
      neighborIdx.get(e.target).add(e.source);
    });

    // ----- CAMERA → SVG SYNC -----
    // Compute a 2D affine transform mapping world coords → screen coords by
    // probing two reference points via sigma.graphToViewport.
    function syncOverlay() {
      // Probe sigma's world→viewport mapping on BOTH axes. Sigma uses math
      // convention (Y up) internally; SVG uses canvas convention (Y down).
      // Sample (0,0), (1,0), (0,1) to recover sx and sy separately — sy will
      // be negative when sigma flips Y. Without this flip, every hull and
      // edge in the overlay paints mirrored across the horizontal axis from
      // where sigma renders its nodes (the bug observed in opus-pantheon-v2-
      // labels-1 — nodes upper-right, hulls lower-right).
      const o = sigma.graphToViewport({ x: 0, y: 0 });
      const ux = sigma.graphToViewport({ x: 1, y: 0 });
      const uy = sigma.graphToViewport({ x: 0, y: 1 });
      const sx = (ux.x - o.x) || 1;
      const sy = (uy.y - o.y) || 1;
      const transform = `translate(${o.x} ${o.y}) scale(${sx} ${sy})`;
      hullsG.setAttribute('transform', transform);
      edgesG.setAttribute('transform', transform);
      ticksG.setAttribute('transform', transform);
    }

    // ----- HOVER DIM ON EDGES (mirrors sigma's reducer behavior) -----
    function applyEdgeHoverState() {
      if (_hoverId) {
        edgeEls.forEach(({ el, s, t }) => {
          const incident = (s === _hoverId || t === _hoverId);
          el.classList.toggle('dim', !incident);
          el.classList.toggle('hot', incident);
        });
      } else {
        edgeEls.forEach(({ el }) => {
          el.classList.remove('dim');
          el.classList.remove('hot');
        });
      }
    }
    function applyHullFilterState() {
      hullEls.forEach(el => {
        const fam = el.dataset.family;
        el.classList.toggle('dim', !!(_familyFilter && fam !== _familyFilter));
        el.classList.toggle('hot', !!(_familyFilter && fam === _familyFilter));
      });
      tickEls.forEach(el => {
        const fam = el.dataset.family;
        el.classList.toggle('dim', !!(_familyFilter && fam !== _familyFilter));
      });
    }

    syncOverlay();
    sigma.on('afterRender', syncOverlay);

    // ----- THUMBNAIL HOVER CARD (priority 4) -----
    // Production uses showTooltip() with tooltipThumb() — a unified card with
    // image, title, family·tradition, connection-count, and an optional
    // wikipedia link. We build a dedicated card so the global #tooltip stays
    // owned by the production views.
    const thumbCard = document.createElement('div');
    thumbCard.className = 'ph2-thumb-card';
    thumbCard.style.display = 'none';
    rootEl.appendChild(thumbCard);

    function wikiUrlFromRefs(refs) {
      if (!Array.isArray(refs)) return null;
      for (const r of refs) {
        if (!r) continue;
        const url = (typeof r === 'string') ? r : (r.url || r.href || '');
        if (typeof url === 'string' && /wikipedia\.org\/wiki\//.test(url)) return url;
      }
      return null;
    }
    function showThumbCard(nodeAttrs, evt) {
      const n = nodeAttrs._node || {};
      const thumb = n.thumbnail || (Array.isArray(n.depictions) && n.depictions[0] && n.depictions[0].src);
      const deg = graph.degree(n.id || '') || 0;
      const wiki = wikiUrlFromRefs(n.refs);
      const family = nodeAttrs._family || n.family || '—';
      const tradition = n.tradition || '';
      const meta1 = family + (tradition ? ' · ' + tradition : '');
      // Horizontal card layout — circular avatar + .ph2-thumb-body text column.
      const meta2 = deg + ' connection' + (deg === 1 ? '' : 's') +
                    (n.geo && n.geo.label ? ' · ' + escapeHtml(n.geo.label) : '');
      thumbCard.innerHTML = [
        thumb ? `<img class="ph2-thumb-img" src="${escapeAttr(thumb)}" alt="" onerror="this.remove()"/>` : '',
        '<div class="ph2-thumb-body">',
          `<div class="ph2-thumb-title">${escapeHtml(n.title || n.id || '')}</div>`,
          `<div class="ph2-thumb-meta">${escapeHtml(meta1)}</div>`,
          `<div class="ph2-thumb-meta">${meta2}</div>`,
          wiki ? `<a class="ph2-thumb-link" href="${escapeAttr(wiki)}" target="_blank" rel="noopener">Wikipedia →</a>` : '',
        '</div>'
      ].join('');
      thumbCard.style.display = 'block';
      positionThumbCard(evt);
    }
    function positionThumbCard(evt) {
      if (!evt) return;
      // evt may be a sigma event with .event.original (a MouseEvent) or a
      // direct MouseEvent passed from a DOM listener.
      const mouse = (evt && evt.event && evt.event.original) ? evt.event.original
                  : (evt && evt.clientX !== undefined ? evt : null);
      if (!mouse) return;
      // Position relative to the viewport; the card is position:fixed in CSS.
      const x = (mouse.clientX || 0) + 14;
      const y = (mouse.clientY || 0) + 14;
      thumbCard.style.left = x + 'px';
      thumbCard.style.top  = y + 'px';
    }
    function hideThumbCard() { thumbCard.style.display = 'none'; }

    // ----- SIGMA EVENTS -----
    sigma.on('enterNode', (e) => {
      _hoverId = e.node;
      sigma.refresh({ skipIndexation: true });
      applyEdgeHoverState();
      if (typeof applyLabelHoverDim === 'function') applyLabelHoverDim();
      const attrs = graph.getNodeAttributes(e.node);
      showThumbCard(attrs, e);
    });
    sigma.on('leaveNode', () => {
      _hoverId = null;
      sigma.refresh({ skipIndexation: true });
      applyEdgeHoverState();
      if (typeof applyLabelHoverDim === 'function') applyLabelHoverDim();
      hideThumbCard();
    });
    // Track raw mouse for card positioning — sigma's stage-mousemove fires
    // continuously; cheaper to listen on the root.
    // PREMIUM LIVENESS — Cosmograph's `simulationRepulsionFromMouse` trick:
    // nearby nodes gently push away from the cursor. Adds "alive" feel
    // without a live force-simulation. See AUDIT/premium-dynamics-research.
    let _mouseWorld = null;    // {x, y} in graph coords, or null when cursor off-canvas
    const _nudges = new Map(); // nodeId → {dx, dy} current displacement from anchor
    // Tuned subtle — was "magnet" (NUDGE_MAX 6, RADIUS 110); user could not click nodes.
    // Now: only the OUTER ring of neighbours nudges; closest stays put for clickability.
    const NUDGE_RADIUS  = 70;  // world-units: smaller proximity window
    const NUDGE_DEAD    = 14;  // world-units: nodes inside this stay still (clickable)
    const NUDGE_MAX     = 1.2; // world-units: max displacement (subtle breathe, not push)
    const NUDGE_LERP    = 0.12;// per-frame approach (slower = more damped)
    const NUDGE_DECAY   = 0.90;
    let _rafId = null;
    function tickLiveness() {
      let anyChange = false;
      // Compute target nudge per node + lerp current toward target
      positions.forEach((p, id) => {
        let tx = 0, ty = 0;
        if (_mouseWorld) {
          const dx = p.x - _mouseWorld.x;
          const dy = p.y - _mouseWorld.y;
          const dist = Math.hypot(dx, dy);
          // Dead zone — the closest node(s) MUST stay clickable
          if (dist > NUDGE_DEAD && dist < NUDGE_RADIUS) {
            const span = NUDGE_RADIUS - NUDGE_DEAD;
            const fall = 1 - ((dist - NUDGE_DEAD) / span);   // 1 just outside dead zone, 0 at radius
            const mag  = NUDGE_MAX * fall * fall;            // quadratic falloff
            tx = (dx / dist) * mag;
            ty = (dy / dist) * mag;
          }
        }
        const cur = _nudges.get(id) || { dx: 0, dy: 0 };
        // Lerp toward target; if no mouse, target=0 with stronger decay
        if (_mouseWorld) {
          cur.dx += (tx - cur.dx) * NUDGE_LERP;
          cur.dy += (ty - cur.dy) * NUDGE_LERP;
        } else {
          cur.dx *= NUDGE_DECAY;
          cur.dy *= NUDGE_DECAY;
        }
        if (Math.abs(cur.dx) < 0.02 && Math.abs(cur.dy) < 0.02) {
          if (_nudges.has(id)) { _nudges.delete(id); anyChange = true; }
        } else {
          _nudges.set(id, cur);
          anyChange = true;
          // Push the displacement into the live graph node so sigma paints it.
          if (graph.hasNode(id)) {
            graph.setNodeAttribute(id, 'x', p.x + cur.dx);
            graph.setNodeAttribute(id, 'y', p.y + cur.dy);
          }
        }
      });
      if (anyChange) sigma.refresh({ skipIndexation: true });
      // Stop the loop when nothing's moving and cursor is gone
      if (_nudges.size === 0 && !_mouseWorld) { _rafId = null; return; }
      _rafId = requestAnimationFrame(tickLiveness);
    }
    function kickLiveness() {
      if (_rafId == null) _rafId = requestAnimationFrame(tickLiveness);
    }
    rootEl.addEventListener('mousemove', (mev) => {
      if (thumbCard.style.display === 'block') positionThumbCard(mev);
      // Translate viewport (relative to container) → world coords via sigma camera.
      const rect = rootEl.getBoundingClientRect();
      const vx = mev.clientX - rect.left;
      const vy = mev.clientY - rect.top;
      try { _mouseWorld = sigma.viewportToGraph({ x: vx, y: vy }); } catch (e) { _mouseWorld = null; }
      kickLiveness();
    });
    rootEl.addEventListener('mouseleave', () => {
      _mouseWorld = null;
      kickLiveness();
    });
    sigma.on('clickNode', ({ node }) => {
      _selectedId = node;
      sigma.refresh({ skipIndexation: true });
      if (window.selectNode) window.selectNode(node, true);
    });
    sigma.on('clickStage', () => {
      _selectedId = null;
      _hoverId = null;
      sigma.refresh({ skipIndexation: true });
      applyEdgeHoverState();
      hideThumbCard();
    });

    // Tangential family rim labels — DOM overlay synced to sigma camera.
    const rimOverlay = buildRimLabels(rootEl, wedges, sigma, _familyFilter);

    // ============================================================
    // PHASE E — DOM NODE LABELS + DECONFLICTION
    // ============================================================
    // Sigma's stock labels paint at each node's center and de-overlap via a
    // grid — but the grid just *hides* collisions, it doesn't move labels
    // out of the way. Result: 40-60 labels piled up on the inner ring.
    //
    // Production uses SVG <text> in a dedicated layer, positioned ABOVE each
    // node (dy = -(7 + √deg × 1.8)), with a stroke-paint halo, and runs a
    // greedy-by-degree deconfliction pass at the end of the force-sim.
    //
    // V2 mirror: a DOM overlay (one <div> per deity) synced to sigma's
    // camera on every afterRender. Label IS centered above its node by
    // CSS transform; halo is text-shadow. Deconflict runs ~60 ms after
    // each sync settles, hiding lower-degree labels that overlap higher-
    // degree ones.
    const nodeLabelOverlay = document.createElement('div');
    nodeLabelOverlay.className = 'ph2-node-labels-overlay';
    nodeLabelOverlay.setAttribute('aria-hidden', 'true');
    rootEl.appendChild(nodeLabelOverlay);

    const nodeLabelEntries = [];
    deities.forEach(d => {
      const pos = positions.get(d.id);
      if (!pos) return;
      const deg = degree.get(d.id) || 0;
      const el = document.createElement('div');
      el.className = 'ph2-node-label' + (_hubIdSet.has(d.id) ? ' hub' : '');
      el.dataset.nodeId = d.id;
      el.dataset.family = d.family || 'Other';
      // Two-line stacking for slashed double-names ("Enki / Ea", "Inanna / Ishtar")
      const title = d.title || d.id || '';
      if (/\s+\/\s+/.test(title) && title.length < 32) {
        const parts = title.split(/\s+\/\s+/);
        el.innerHTML = '<span>' + escapeHtml(parts[0]) + '</span>' +
                       '<br><span>' + escapeHtml(parts.slice(1).join(' / ')) + '</span>';
      } else {
        el.textContent = title;
      }
      nodeLabelOverlay.appendChild(el);
      nodeLabelEntries.push({
        el, id: d.id, family: d.family || 'Other',
        wx: pos.x, wy: pos.y,
        deg,
        dy: 7 + Math.sqrt(deg) * 1.5  // pixels above the node, scales with size
      });
    });

    function updateNodeLabelVisibility() {
      const devThresh = window.CODEX_DEV?.settings?.hubThreshold;
      nodeLabelEntries.forEach(L => {
        let show = true;
        if (_labelsMode === 'off') show = false;
        else if (_labelsMode === 'hub') {
          const isHub = devThresh != null ? (L.deg >= devThresh) : _hubIdSet.has(L.id);
          show = isHub;
        }
        if (_familyFilter && L.family !== _familyFilter) show = false;
        L.el.style.display = show ? '' : 'none';
        if (show) L.el.style.visibility = '';
      });
      scheduleDeconflict();
    }

    function syncNodeLabels() {
      // Re-project visible label world-positions to screen-space via sigma camera.
      const len = nodeLabelEntries.length;
      for (let i = 0; i < len; i++) {
        const L = nodeLabelEntries[i];
        if (L.el.style.display === 'none') continue;
        const screen = sigma.graphToViewport({ x: L.wx, y: L.wy });
        L.el.style.left = screen.x + 'px';
        L.el.style.top  = (screen.y - L.dy) + 'px';
      }
      scheduleDeconflict();
    }

    let _deconflictTimer = null;
    function scheduleDeconflict() {
      clearTimeout(_deconflictTimer);
      _deconflictTimer = setTimeout(deconflictNodeLabels, 60);
    }

    // Greedy first-fit by degree (production's exact algorithm, app.js:1444).
    // Reset visibility on candidates → measure bb → sort by deg desc →
    // walk through and claim screen-space rects; hide labels that conflict.
    function deconflictNodeLabels() {
      const cands = [];
      for (let i = 0; i < nodeLabelEntries.length; i++) {
        const L = nodeLabelEntries[i];
        if (L.el.style.display === 'none') continue;
        L.el.style.visibility = '';
        cands.push(L);
      }
      if (!cands.length) return;
      // Measure AFTER visibility reset
      const items = [];
      for (const L of cands) {
        const bb = L.el.getBoundingClientRect();
        if (!bb.width || !bb.height) continue;
        items.push({ L, bb, deg: L.deg });
      }
      items.sort((a, b) => b.deg - a.deg);
      const claimed = [];
      const PAD = 2;
      for (const it of items) {
        const bb = it.bb;
        const x0 = bb.left - PAD, x1 = bb.right + PAD;
        const y0 = bb.top  - PAD, y1 = bb.bottom + PAD;
        let conflict = false;
        for (const c of claimed) {
          if (!(x1 < c.x0 || c.x1 < x0 || y1 < c.y0 || c.y1 < y0)) { conflict = true; break; }
        }
        if (conflict) it.L.el.style.visibility = 'hidden';
        else claimed.push({ x0, x1, y0, y1 });
      }
    }

    function applyLabelHoverDim() {
      if (!_hoverId) {
        for (const L of nodeLabelEntries) L.el.classList.remove('dim');
        return;
      }
      for (const L of nodeLabelEntries) {
        const isNeighbor = (L.id === _hoverId) ||
          graph.hasEdge(L.id, _hoverId) || graph.hasEdge(_hoverId, L.id);
        L.el.classList.toggle('dim', !isNeighbor);
      }
    }

    // Initial paint + bind camera sync
    updateNodeLabelVisibility();
    syncNodeLabels();
    sigma.on('afterRender', syncNodeLabels);

    // ----- TOOLBAR — mode dropdown + labels toggle + ego focus + recenter -----
    const toolbar = document.createElement('div');
    toolbar.className = 'ph2-toolbar';
    toolbar.innerHTML = `
      <select class="ph2-btn ph2-mode-select" title="What the wedges show">
        <option value="deities"   ${_currentMode === 'deities'   ? 'selected' : ''}>◯ Deities</option>
        <option value="authors"   ${_currentMode === 'authors'   ? 'selected' : ''}>✎ Authors</option>
        <option value="symbols"   ${_currentMode === 'symbols'   ? 'selected' : ''}>✦ Symbols</option>
        <option value="events"    ${_currentMode === 'events'    ? 'selected' : ''}>★ Events</option>
        <option value="monuments" ${_currentMode === 'monuments' ? 'selected' : ''}>⛬ Monuments</option>
      </select>
      <button class="ph2-btn" id="ph2-labels" title="Toggle label density">labels: ${_labelsMode}</button>
      <button class="ph2-btn${_tierOverlay ? ' ph2-btn-on' : ''}" id="ph2-tier" title="Color nodes by source-integrity tier (T1=gold T2=silver T3=grey T4=crimson)">tier: ${_tierOverlay ? 'on' : 'off'}</button>
      <button class="ph2-btn${_egoFocus ? ' ph2-btn-on' : ''}" id="ph2-ego" title="Show 1-hop neighbourhood of selected node">ego focus</button>
      <button class="ph2-btn" id="ph2-recenter" title="Re-fit camera to all nodes">recenter</button>
    `;
    rootEl.appendChild(toolbar);

    // Mode dropdown — rebuilds entire graph for the new mode
    toolbar.querySelector('.ph2-mode-select').onchange = (ev) => {
      _currentMode  = ev.target.value;
      _familyFilter = null;
      _egoFocus     = false;
      _labelsMode   = 'hub';
      render(rootEl);
    };

    toolbar.querySelector('#ph2-labels').onclick = (ev) => {
      _labelsMode = _labelsMode === 'hub' ? 'all' : _labelsMode === 'all' ? 'off' : 'hub';
      ev.target.textContent = 'labels: ' + _labelsMode;
      updateNodeLabelVisibility();
      sigma.refresh({ skipIndexation: true });
    };
    toolbar.querySelector('#ph2-tier').onclick = (ev) => {
      _tierOverlay = !_tierOverlay;
      ev.target.textContent = 'tier: ' + (_tierOverlay ? 'on' : 'off');
      ev.target.classList.toggle('ph2-btn-on', _tierOverlay);
      sigma.refresh({ skipIndexation: true });
    };
    toolbar.querySelector('#ph2-ego').onclick = (ev) => {
      _egoFocus = !_egoFocus;
      ev.target.classList.toggle('ph2-btn-on', _egoFocus);
      if (!_egoFocus) _selectedId = null;
      sigma.refresh({ skipIndexation: true });
    };
    toolbar.querySelector('#ph2-recenter').onclick = () => {
      try { sigma.getCamera().animatedReset({ duration: 400 }); } catch (e) { /* ignore */ }
      _egoFocus = false;
      toolbar.querySelector('#ph2-ego').classList.remove('ph2-btn-on');
      sigma.refresh({ skipIndexation: true });
    };

    // ----- FAMILY LEGEND (bottom-left) — click to filter wheel to one family -----
    const legendStartCollapsed = (() => {
      try { return localStorage.getItem('legend-collapsed') === '1'; } catch (e) { return false; }
    })();
    const legend = document.createElement('div');
    legend.className = 'ph2-legend' + (legendStartCollapsed ? ' collapsed' : '');
    const familyOrderForLegend = (familyOrder || []).filter(name => famByName && famByName[name] && famByName[name].members.length);
    legend.innerHTML =
      '<div class="ph2-legend-head">' +
        '<div class="ph2-legend-title">Families · click to filter</div>' +
        '<button class="ph2-legend-burger" title="Collapse">≡</button>' +
      '</div>' +
      '<div class="ph2-legend-body">' +
        familyOrderForLegend.map(name => {
          const w = wedges[name] || {};
          const color = (w.color) || '#7a8090';
          const count = (w.members || []).length;
          return `<div class="ph2-legend-row${_familyFilter === name ? ' ph2-legend-active' : ''}" data-family="${escapeAttr(name)}">
            <span class="ph2-legend-swatch" style="background:${color}"></span>
            <span class="ph2-legend-name">${escapeHtml(name)}</span>
            <span class="ph2-legend-count">${count}</span>
          </div>`;
        }).join('') +
      '</div>';
    rootEl.appendChild(legend);

    legend.querySelectorAll('.ph2-legend-row').forEach(row => {
      row.onclick = () => {
        const fam = row.dataset.family;
        _familyFilter = (_familyFilter === fam) ? null : fam;
        legend.querySelectorAll('.ph2-legend-row').forEach(r => {
          r.classList.toggle('ph2-legend-active', r.dataset.family === _familyFilter);
        });
        // Sync rim-label opacity
        rimOverlay.querySelectorAll('.ph2-rim-label').forEach(el => {
          el.style.opacity = (_familyFilter && el.dataset.family !== _familyFilter) ? '0.18' : '0.85';
        });
        applyHullFilterState();
        updateNodeLabelVisibility();
        sigma.refresh({ skipIndexation: true });
      };
      // Hover preview
      row.addEventListener('mouseenter', () => {
        if (_familyFilter) return;
        const fam = row.dataset.family;
        rimOverlay.querySelectorAll('.ph2-rim-label').forEach(el => {
          el.style.opacity = el.dataset.family !== fam ? '0.18' : '0.85';
        });
        hullEls.forEach(el => {
          el.classList.toggle('preview-fade', el.dataset.family !== fam);
        });
      });
      row.addEventListener('mouseleave', () => {
        if (_familyFilter) return;
        rimOverlay.querySelectorAll('.ph2-rim-label').forEach(el => {
          el.style.opacity = '0.85';
        });
        hullEls.forEach(el => el.classList.remove('preview-fade'));
      });
    });

    legend.querySelector('.ph2-legend-burger').onclick = (ev) => {
      ev.stopPropagation();
      const willCollapse = !legend.classList.contains('collapsed');
      legend.classList.toggle('collapsed', willCollapse);
      try { localStorage.setItem('legend-collapsed', willCollapse ? '1' : '0'); } catch (e) {}
    };

    // Stash for diagnostics + setView() teardown
    rootEl._sigma = sigma;
    rootEl._graph = graph;
  }

  // PHASE F — DOM overlay for HORIZONTAL family rim labels.
  //
  // Previously tangential (rotated to follow rim) at Router+50. Production
  // (app.js:1162-1206) uses HORIZONTAL text at Router+56 with text-anchor +
  // dy computed from the angle so each label reads naturally regardless of
  // where it sits around the ring, plus a tick line from hull rim to label.
  //
  // For DOM divs we translate via CSS percentages rather than SVG text-anchor:
  //   cos(a) > 0.35       → anchor at LEFT  edge   (tx =    0%)
  //   cos(a) < -0.35      → anchor at RIGHT edge   (tx = -100%)
  //   else                 → centered horizontally (tx =  -50%)
  //   sin(a) > 0.55       → label is ABOVE anchor  (ty = -100%)   (top of ring)
  //   sin(a) < -0.55      → label is BELOW anchor  (ty =    0%)   (bottom)
  //   else                 → centered vertically   (ty =  -50%)
  //
  // V2 uses math-convention angle (cos = x, sin = y) post-Y-flip. Sigma flips
  // Y when rendering, so sin > 0 = screen-up = top half (matches production).
  //
  // Font size scales with wedge angular size (narrower wedge → smaller font),
  // production formula: max(9, min(14, 8 + arc × 11)).
  function buildRimLabels(rootEl, wedges, sigmaRenderer, familyFilter) {
    const overlay = document.createElement('div');
    overlay.className = 'ph2-rim-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    rootEl.appendChild(overlay);

    const Router = 540;
    const labelR = Router + 56;
    const entries = Object.values(wedges).filter(w => w.members.length);
    entries.forEach(w => {
      const el = document.createElement('div');
      el.className = 'ph2-rim-label' + (w.members.length >= 6 ? ' ph2-rim-label-bright' : '');
      el.dataset.family = w.name;
      el.textContent = w.name;
      if (familyFilter && w.name !== familyFilter) el.style.opacity = '0.30';
      const ang = w.center;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      // Stash world-space label anchor
      el._wx = labelR * c;
      el._wy = labelR * s;
      // CSS translate percentages (anchor position WITHIN the label box)
      const tx = c >  0.35 ?    '0%' : c < -0.35 ? '-100%' : '-50%';
      const ty = s >  0.55 ? '-100%' : s < -0.55 ?    '0%' : '-50%';
      el._tx = tx; el._ty = ty;
      // Font size scales with wedge arc — production formula
      const arc = w.a1 - w.a0;
      el.style.fontSize = Math.max(9, Math.min(14, 8 + arc * 11)).toFixed(1) + 'px';
      overlay.appendChild(el);
    });

    function sync() {
      const labels = overlay.querySelectorAll('.ph2-rim-label');
      labels.forEach(el => {
        const screen = sigmaRenderer.graphToViewport({ x: el._wx, y: el._wy });
        el.style.left = screen.x + 'px';
        el.style.top  = screen.y + 'px';
        el.style.transform = `translate(${el._tx}, ${el._ty})`;
      });
    }
    sync();
    sigmaRenderer.on('afterRender', sync);
    return overlay;
  }

  // --- escape helpers (kept private to this module) ---
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  }
  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/["'&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  window._pantheonV2 = {
    render,
    // Convenience for the dev panel — re-render the live pane after changing
    // any setting (force constants, camera ratio, etc.) that requires a full
    // bake + paint rather than a CSS-var swap or sigma.refresh.
    rerender: function () {
      const pane = document.querySelector('.pantheon-v2-pane');
      if (pane) render(pane);
    }
  };
})();
