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
//   [ ] Family-filter + tier-overlay parity
//   [ ] Force-simulation layout (rigid grid still — see brief §5)
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
    iterations = iterations || 150;
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
    const P = new Map();
    deities.forEach(d => {
      const p = positions.get(d.id);
      if (!p) return;
      P.set(d.id, { x: p.x, y: p.y, vx: 0, vy: 0, ax: p.x, ay: p.y });
    });
    // Constants (tuned for V2's 220→540 world scale; production uses 14 px radial pad).
    const ANCHOR_K     = 0.05;   // per-iter pull toward anchor (gentle)
    const CHARGE_K     = -380;   // repulsion coefficient (Coulomb)
    const CHARGE_RANGE = 180;    // max distance for charge to act
    const COLLIDE_PAD  = 1.5;    // gap between node circles
    const DAMP         = 0.55;
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

  // Edge-type color palette — based on real types in data.js (audit caught
  // that ~69% of deity↔deity edges fell through to grey because the map was
  // built from theme.js convention rather than vault reality. Frequency-counts
  // from data.js (deity-relevant subset):
  //   syncretic (586) parallel-motif (1018) parallel-form (329)
  //   influenced-by (506) influences (463) consort (~128)
  //   child-of / parent-of  attests / attested-in / mentioned-in
  const EDGE_COLOR = {
    // SYNCRETIC / PARALLEL family — green to teal
    'syncretic':                       '#6e8c6b',
    'syncretized-with':                '#6e8c6b',
    'syncretic-scholarly-parallel':    '#5a9a8f',
    'syncretic-ancient-identification':'#6e8c6b',
    'syncretic-structural-parallel':   '#5a9a8f',
    'parallel-motif':                  '#5a9a8f',
    'parallel-form':                   '#5a9a8f',
    // INFLUENCE family — red
    'influenced':        '#c25450', 'influenced-by':     '#c25450',
    'influences':        '#c25450',
    // ATTESTATION family — gold
    'attested-in':       '#d4a55a', 'attests':           '#d4a55a',
    'mentioned-in':      '#aabac5',
    'key-figure':        '#d4a55a',
    // AUTHORSHIP family — purple
    'authored':          '#a87bb5', 'attributed-author': '#a87bb5',
    'originated':        '#a87bb5',
    // KINSHIP family — purple-lighter
    'consort':           '#c9a5d4',
    'child-of':          '#c9a5d4', 'parent-of':         '#c9a5d4',
    'sibling-of':        '#c9a5d4',
    // DOCUMENT-AFFECT family — blue
    'documents-affected':'#5a6cc4', 'preserved-by':      '#5a6cc4',
    'affects-tradition': '#5a6cc4',
    // THEME — amber
    'has-theme':         '#e0a850'
  };
  const DEFAULT_EDGE_COLOR = '#7a8090';

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
    relaxPositions(deities, positions, wedges, Rinner, Router, degree, 150);

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
          color: EDGE_COLOR[e.type] || DEFAULT_EDGE_COLOR,
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
        // LABEL MODE — 'off' kills all labels, 'hub' keeps only degree≥threshold, 'all' shows them all.
        // Dev panel can override the threshold live without a full re-render.
        if (_labelsMode === 'off') {
          out.label = '';
        } else if (_labelsMode === 'hub') {
          const _devThresh = window.CODEX_DEV?.settings?.hubThreshold;
          const _isHub = _devThresh != null
            ? (degree.get(id) || 0) >= _devThresh
            : attrs._isHub;
          if (!_isHub) out.label = '';
        }
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
    try { sigma.getCamera().setState({ ratio: 0.78 }); } catch (e) {}

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
    const HULL_CR    = 8;
    const hullEls = [];
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
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('class', 'ph2-edge');
      path.setAttribute('d', `M ${sp.x},${sp.y} Q ${cxp},${cyp} ${tp.x},${tp.y}`);
      // Production discipline: default stroke is a single quiet slate-blue (CSS);
      // the per-type color is stashed as a CSS var and only paints when .hot
      // (hover/select). Keeps the default canvas calm — no rainbow.
      path.style.setProperty('--edge-type-color', EDGE_COLOR[e.type] || DEFAULT_EDGE_COLOR);
      path.dataset.source = e.source;
      path.dataset.target = e.target;
      path.dataset.type   = e.type || '';
      edgesG.appendChild(path);
      edgeEls.push({ el: path, s: e.source, t: e.target });
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
      const o   = sigma.graphToViewport({ x: 0, y: 0 });
      const u   = sigma.graphToViewport({ x: 1, y: 0 });
      // Scale = distance from origin to (1,0) in viewport space.
      const scale = Math.hypot(u.x - o.x, u.y - o.y) || 1;
      // Since the layout coord-system has no rotation, a single uniform scale
      // + translate works. Set transform on each group.
      const transform = `translate(${o.x} ${o.y}) scale(${scale})`;
      hullsG.setAttribute('transform', transform);
      edgesG.setAttribute('transform', transform);
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
      thumbCard.innerHTML = [
        thumb ? `<img class="ph2-thumb-img" src="${thumb}" alt="" onerror="this.remove()"/>` : '',
        `<div class="ph2-thumb-title">${escapeHtml(n.title || n.id || '')}</div>`,
        `<div class="ph2-thumb-meta">${escapeHtml(meta1)}</div>`,
        `<div class="ph2-thumb-meta">${deg} connection${deg === 1 ? '' : 's'}${n.geo && n.geo.label ? ' · ' + escapeHtml(n.geo.label) : ''}</div>`,
        wiki ? `<a class="ph2-thumb-link" href="${escapeAttr(wiki)}" target="_blank" rel="noopener">Wikipedia →</a>` : ''
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
      const attrs = graph.getNodeAttributes(e.node);
      showThumbCard(attrs, e);
    });
    sigma.on('leaveNode', () => {
      _hoverId = null;
      sigma.refresh({ skipIndexation: true });
      applyEdgeHoverState();
      hideThumbCard();
    });
    // Track raw mouse for card positioning — sigma's stage-mousemove fires
    // continuously; cheaper to listen on the root.
    rootEl.addEventListener('mousemove', (mev) => {
      if (thumbCard.style.display === 'block') positionThumbCard(mev);
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

  // DOM overlay for tangential family rim labels — sigma doesn't natively
  // do curved/rotated SVG text, so we place absolutely-positioned divs
  // and sync them to sigma's camera on each render.
  function buildRimLabels(rootEl, wedges, sigmaRenderer, familyFilter) {
    const overlay = document.createElement('div');
    overlay.className = 'ph2-rim-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    rootEl.appendChild(overlay);

    const Router = 540;
    const labelEntries = Object.values(wedges).filter(w => w.members.length);
    labelEntries.forEach(w => {
      const el = document.createElement('div');
      el.className = 'ph2-rim-label';
      el.dataset.family = w.name;
      el.textContent = w.name;
      el.style.color = w.color;
      if (familyFilter && w.name !== familyFilter) el.style.opacity = '0.18';
      // Stash world-space anchor + angle so the sync function can re-position
      const ang = w.center;
      el._wx = (Router + 50) * Math.cos(ang);
      el._wy = (Router + 50) * Math.sin(ang);
      // Tangential rotation: angle in degrees, rotated 90° so text follows the rim
      let rotDeg = (ang * 180 / Math.PI) + 90;
      // Flip 180° on the bottom half so labels read upright
      const normalized = ((rotDeg % 360) + 360) % 360;
      if (normalized > 90 && normalized < 270) rotDeg -= 180;
      el._rot = rotDeg;
      overlay.appendChild(el);
    });

    function sync() {
      // Convert each label's world position to screen position via sigma's camera.
      // Sigma exposes viewportToGraph / graphToViewport.
      const labels = overlay.querySelectorAll('.ph2-rim-label');
      labels.forEach(el => {
        const screen = sigmaRenderer.graphToViewport({ x: el._wx, y: el._wy });
        el.style.left = screen.x + 'px';
        el.style.top  = screen.y + 'px';
        el.style.transform = `translate(-50%, -50%) rotate(${el._rot}deg)`;
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

  window._pantheonV2 = { render };
})();
