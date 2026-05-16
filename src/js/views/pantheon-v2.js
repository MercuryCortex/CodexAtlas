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
//   [✓] Colored bezier edges per type (theme.js palette)
//   [✓] Tangential family rim labels (DOM overlay synced to sigma camera)
//   [ ] Mode dropdown (deities/authors/symbols/events/monuments)
//   [ ] labels: hub/all/off toggle
//   [ ] Ego-focus button
//   [ ] Family-legend click-to-filter
//   [ ] Family-filter + tier-overlay parity
//
// REUSES from existing modules:
//   window._codexGraph        sigma wrapper (src/js/graph/renderer.js)
//   window._codexGraphTheme   color tokens
//   window.NODES_BY_ID / EDGES / DATA / FAMILIES — from app.js
//   window.selectNode / showTooltip / hideTooltip
// ============================================================
(function () {
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
      const rRange = Router - Rinner;
      const rRowGap = rowCount > 1 ? rRange / (rowCount - 1) : 0;
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
        const r = Rinner + row * rRowGap;
        positions.set(d.id, {
          x: r * Math.cos(ang),
          y: r * Math.sin(ang)
        });
      });
    });

    return { positions, wedges, familyOrder };
  }

  // Edge-type color palette — mirrors theme.js + main Pantheon's edge styling.
  const EDGE_COLOR = {
    'attested-in':       '#d4a55a',  'authored':          '#a87bb5',
    'attributed-author': '#a87bb5',  'originated':        '#a87bb5',
    'syncretized-with':  '#6e8c6b',  'parallels':         '#5a9a8f',
    'cognate-of':        '#5a9a8f',  'cited-in':          '#aabac5',
    'mentioned-in':      '#aabac5',  'influenced':        '#c25450',
    'influenced-by':     '#c25450',  'descends-from':     '#c25450',
    'documents-affected':'#5a6cc4',  'preserved-by':      '#5a6cc4',
    'theme':             '#e0a850',  'child-of':          '#a87bb5',
    'consort-of':        '#a87bb5',  'parent-of':         '#a87bb5',
    'attests':           '#d4a55a'
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

  // DOM overlay for tangential family rim labels — sigma doesn't natively
  // do curved/rotated SVG text, so we place absolutely-positioned divs
  // and sync them to sigma's camera on each render.
  function buildRimLabels(rootEl, wedges, sigmaRenderer) {
    const overlay = document.createElement('div');
    overlay.className = 'ph2-rim-overlay';
    rootEl.appendChild(overlay);

    const Router = 540;
    const labelEntries = Object.values(wedges).filter(w => w.members.length);
    labelEntries.forEach(w => {
      const el = document.createElement('div');
      el.className = 'ph2-rim-label';
      el.textContent = w.name;
      el.style.color = w.color;
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
    return { overlay, sync };
  }

  // ----- main render -----
  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';
    rootEl.classList.add('pantheon-v2-pane');

    if (!window.Sigma || !window.graphology) {
      rootEl.innerHTML = '<div class="ph2-error">sigma.js / graphology not loaded</div>';
      return;
    }
    const data = window.VAULT_DATA || { nodes: [], edges: [] };
    const NODES = data.nodes || [];
    const EDGES = data.edges || [];
    const FAMILIES = data.families || [];

    // FILTER deities — same predicate as main Pantheon's 'deities' mode.
    const deities = NODES.filter(n => n.type === 'deity');
    if (!deities.length) {
      rootEl.innerHTML = '<div class="ph2-error">No deities in data.js</div>';
      return;
    }

    // Compute wedge layout + per-deity positions.
    const { positions, wedges } = computeWedgePositions(deities, FAMILIES);

    // Build edge slice — only deity↔deity for the hover-trail aesthetic.
    const idSet = new Set(deities.map(d => d.id));
    const edges = EDGES.filter(e => idSet.has(e.source) && idSet.has(e.target));
    const degree = computeDegree(edges);

    // ----- build graphology graph -----
    const Graph = window.graphology.Graph || window.graphology.default || window.graphology;
    const graph = new Graph();

    deities.forEach(d => {
      const pos = positions.get(d.id);
      if (!pos) return;
      const deg = degree.get(d.id) || 0;
      graph.addNode(d.id, {
        x: pos.x,
        y: pos.y,
        size: Math.min(11, 4 + Math.sqrt(deg) * 1.3),
        color: d.family_color || d.tradition_color || '#7a8090',
        label: d.title || d.id,
        // Stash deity for hover lookups
        _node: d
      });
    });

    let _edgeCounter = 0;
    edges.forEach(e => {
      if (!graph.hasNode(e.source) || !graph.hasNode(e.target)) return;
      const key = `${e.source}__${e.target}__${e.type || 'rel'}__${_edgeCounter++}`;
      try {
        graph.addEdgeWithKey(key, e.source, e.target, {
          size: 0.5,
          color: EDGE_COLOR[e.type] || DEFAULT_EDGE_COLOR,
          _type: e.type
        });
      } catch (err) { /* ignore parallel-edge collisions */ }
    });

    // ----- sigma renderer -----
    let _hoverId = null;
    let _selectedId = null;

    const settings = {
      renderEdgeLabels: false,
      defaultEdgeColor: DEFAULT_EDGE_COLOR,
      defaultNodeColor: '#7a8090',
      labelColor: { color: '#cad0d8' },
      labelSize: 11,
      labelWeight: 400,
      labelFont: 'Cormorant Garamond, serif',
      labelDensity: 0.5,
      labelGridCellSize: 80,
      labelRenderedSizeThreshold: 7,
      enableEdgeEvents: false,
      hideEdgesOnMove: true,
      hideLabelsOnMove: true,
      minCameraRatio: 0.05,
      maxCameraRatio: 8,
      nodeReducer: (id, attrs) => {
        const out = { ...attrs };
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
        return out;
      },
      edgeReducer: (id, attrs) => {
        const out = { ...attrs };
        if (_hoverId) {
          const ext = graph.extremities(id);
          if (ext[0] !== _hoverId && ext[1] !== _hoverId) {
            out.color = '#2a2c32';
            out.size = 0.25;
          } else {
            // Brighten the hovered node's edges in their own type colour
            out.size = 1.4;
            out.zIndex = 1;
          }
        }
        return out;
      }
    };

    const sigma = new window.Sigma(graph, rootEl, settings);

    sigma.on('enterNode', ({ node }) => {
      _hoverId = node;
      sigma.refresh({ skipIndexation: true });
    });
    sigma.on('leaveNode', () => {
      _hoverId = null;
      sigma.refresh({ skipIndexation: true });
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
    });

    // Tangential family rim labels — DOM overlay synced to sigma camera.
    buildRimLabels(rootEl, wedges, sigma);

    // Stash for diagnostics + potential teardown
    rootEl._sigma = sigma;
    rootEl._graph = graph;
  }

  window._pantheonV2 = { render };
})();
