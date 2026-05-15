// ============================================================
// CODEX ATLAS — Shared WebGL graph renderer (Phase 1)
// Thin wrapper over sigma.js v3 + graphology. Exposes a single mount()
// function each view calls with its config:
//
//   window._codexGraph.mount(rootEl, {
//     nodes:     [...DATA.nodes (filtered)],
//     edges:     [...EDGES (filtered)],
//     positions: Map<id, {x,y}>,
//     onClick:   (id) => {...},
//     onHover:   (id|null) => {...}
//   });
//
// Returns the sigma renderer so the caller can drive the camera, e.g.
// renderer.getCamera().animatedReset() after a filter change.
// ============================================================
(function () {
  let _current = null; // active sigma instance
  let _currentGraph = null;
  let _hoverId = null;
  let _selectedId = null;

  function unmount() {
    if (_current) {
      try { _current.kill(); } catch (e) { /* ignore */ }
      _current = null;
      _currentGraph = null;
      _hoverId = null;
      _selectedId = null;
    }
  }

  // Compute degree map from edges (used for node size).
  function computeDegree(edges) {
    const d = new Map();
    edges.forEach(e => {
      d.set(e.source, (d.get(e.source) || 0) + 1);
      d.set(e.target, (d.get(e.target) || 0) + 1);
    });
    return d;
  }

  function mount(rootEl, config) {
    if (!window.Sigma || !window.graphology) {
      console.error('[codex-graph] sigma + graphology must be loaded before mount()');
      return null;
    }
    unmount();
    if (!rootEl) return null;

    const theme = window._codexGraphTheme;
    const { nodes, edges, positions, onClick, onHover } = config;
    const degree = computeDegree(edges);
    const nodeIdSet = new Set(nodes.map(n => n.id));

    // Build graphology graph
    const Graph = window.graphology.Graph || window.graphology.default || window.graphology;
    const graph = new Graph();

    nodes.forEach(n => {
      const pos = positions.get(n.id);
      if (!pos) return; // skip nodes without a layout slot
      graph.addNode(n.id, {
        x: pos.x,
        y: pos.y,
        size: theme.nodeSize(degree.get(n.id) || 0),
        color: theme.nodeColor(n),
        label: n.title || n.id,
        // Stash the original node for tooltips / hover meta
        _node: n
      });
    });

    edges.forEach((e, i) => {
      // Both endpoints must be present (caller is supposed to filter, but
      // belt-and-suspenders).
      if (!graph.hasNode(e.source) || !graph.hasNode(e.target)) return;
      const edgeKey = `${e.source}__${e.target}__${e.type || 'rel'}__${i}`;
      if (graph.hasEdge(edgeKey)) return;
      try {
        graph.addEdgeWithKey(edgeKey, e.source, e.target, {
          size: 0.6,
          color: theme.edgeColor(e.type),
          _edge: e
        });
      } catch (err) { /* parallel edges between same pair are fine to skip */ }
    });

    // sigma settings — tuned for our look-and-feel + good mobile defaults
    const settings = {
      renderEdgeLabels: false,
      defaultEdgeColor: '#7a8090',
      defaultNodeColor: '#7a8090',
      labelColor: { color: '#cad0d8' },
      labelSize: 11,
      labelWeight: 400,
      labelFont: 'Cormorant Garamond, serif',
      labelDensity: 0.5,
      labelGridCellSize: 80,
      labelRenderedSizeThreshold: 7, // only label nodes large enough
      enableEdgeEvents: false,
      hideEdgesOnMove: nodes.length > 800,    // mobile-friendly: drop edges while panning huge graphs
      hideLabelsOnMove: true,
      allowInvalidContainer: false,
      minCameraRatio: 0.05,
      maxCameraRatio: 8,
      // Reducers — let us light up hover state without rebuilding the graph
      nodeReducer: (id, attrs) => {
        const out = { ...attrs };
        if (_hoverId === id || _selectedId === id) {
          out.highlighted = true;
          out.zIndex = 2;
        } else if (_hoverId) {
          const isNeighbor = graph.hasEdge(id, _hoverId) || graph.hasEdge(_hoverId, id) || graph.areNeighbors(id, _hoverId);
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
            out.size = 0.3;
          } else {
            out.color = '#d4a55a';
            out.size = 1.2;
            out.zIndex = 1;
          }
        }
        return out;
      }
    };

    const renderer = new window.Sigma(graph, rootEl, settings);

    // hover / click
    renderer.on('enterNode', ({ node, event }) => {
      _hoverId = node;
      renderer.refresh({ skipIndexation: true });
      if (onHover) onHover(node, event && event.original ? event.original : event);
    });
    renderer.on('leaveNode', () => {
      _hoverId = null;
      renderer.refresh({ skipIndexation: true });
      if (onHover) onHover(null);
    });
    renderer.on('clickNode', ({ node }) => {
      _selectedId = node;
      renderer.refresh({ skipIndexation: true });
      if (onClick) onClick(node);
    });
    renderer.on('clickStage', () => {
      _selectedId = null;
      _hoverId = null;
      renderer.refresh({ skipIndexation: true });
    });

    _current = renderer;
    _currentGraph = graph;
    return renderer;
  }

  function setSelected(id) {
    _selectedId = id;
    if (_current) _current.refresh({ skipIndexation: true });
  }

  function getRenderer() { return _current; }

  window._codexGraph = { mount, unmount, setSelected, getRenderer };
})();
