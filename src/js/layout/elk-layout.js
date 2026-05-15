// ============================================================
// CODEX ATLAS — Shared ELK.js layout wrapper
//
// Single async API used by every node-graph view in the atlas
// (Alchemy card pinboard, Transmission graph, future graph views).
// Takes a node + edge list and a chosen layout algorithm, returns a
// Map<id, {x, y}> of absolute positions. Callers translate to their
// coordinate space.
//
// Algorithms exposed:
//   layered    — Sugiyama hierarchical (great for timelines / transmission chains)
//   force      — organic spring-layout
//   stress     — minimize edge-length (compact organic)
//   radial     — radial tree (hub + spokes)
//   mrtree     — strict tree (parent-child hierarchy)
//   rectpacking — pack nodes by size, ignore edges (compaction)
//   grid       — flat grid (no edge awareness; fast)
//
// Usage:
//   const pos = await window._codexLayout.compute(nodes, edges, {
//     algorithm: 'layered',
//     nodeWidth: 260, nodeHeight: 320,
//     direction: 'RIGHT',
//     spacing: 80
//   });
//   pos.get('enlil') => { x: 240, y: 0 }
// ============================================================
(function () {
  const _elk = window.ELK ? new window.ELK() : null;

  const ALGORITHMS = {
    layered:     { label: 'Layered (timeline)',  needsEdges: true,  description: 'Sugiyama-style left-to-right hierarchy. Best for showing transmission chains and influence flow.' },
    force:       { label: 'Force (organic)',     needsEdges: true,  description: 'Spring-layout, organic clustering. Highly-connected nodes pull together.' },
    stress:      { label: 'Stress (compact)',    needsEdges: true,  description: 'Minimum-edge-length stress-majorization. Tightest organic layout.' },
    radial:      { label: 'Radial (hub-spoke)',  needsEdges: true,  description: 'Tree-radial: central root with branches fanning out.' },
    mrtree:      { label: 'Tree (strict)',       needsEdges: true,  description: 'Strict hierarchical tree, top-down.' },
    rectpacking: { label: 'Pack (compact tile)', needsEdges: false, description: 'Tile cards by size, ignore edges. Fastest, no edge-aware spacing.' },
    grid:        { label: 'Grid (simple)',       needsEdges: false, description: 'Flat NxN grid. No ELK; the fastest fallback.' }
  };

  // Build the ELK layoutOptions object for a given algorithm + opts.
  function buildLayoutOptions(algorithm, opts) {
    const direction = opts.direction || 'RIGHT';
    const spacing = opts.spacing || 80;
    const lo = {
      'elk.algorithm': algorithm,
      'elk.direction': direction,
      'elk.spacing.nodeNode': String(spacing),
      'elk.padding': '[top=40,left=40,right=40,bottom=40]'
    };
    if (algorithm === 'layered') {
      lo['elk.layered.spacing.nodeNodeBetweenLayers'] = String(spacing * 1.5);
      lo['elk.layered.crossingMinimization.semiInteractive'] = 'true';
      lo['elk.layered.cycleBreaking.strategy'] = 'GREEDY';
    } else if (algorithm === 'force') {
      lo['elk.force.iterations'] = '300';
      lo['elk.force.repulsivePower'] = '1';
    } else if (algorithm === 'radial') {
      lo['elk.radial.compactor'] = 'WEDGE_COMPACTION';
    } else if (algorithm === 'mrtree') {
      lo['elk.mrtree.searchOrder'] = 'DFS';
    } else if (algorithm === 'rectpacking') {
      lo['elk.rectpacking.aspectRatio'] = String(opts.aspectRatio || 1.5);
    }
    return lo;
  }

  // Plain-JS grid layout — used when algorithm = 'grid' or as fallback if ELK fails.
  function gridLayout(nodes, opts) {
    const W = opts.nodeWidth || 180;
    const H = opts.nodeHeight || 60;
    const spacing = opts.spacing || 80;
    const cols = Math.ceil(Math.sqrt(nodes.length)) || 1;
    const positions = new Map();
    nodes.forEach((n, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      positions.set(n.id, {
        x: c * (W + spacing) - (cols * (W + spacing)) / 2,
        y: r * (H + spacing) - (cols * (H + spacing)) / 2
      });
    });
    return positions;
  }

  // Main compute — returns a Promise of a position map.
  function compute(nodes, edges, opts = {}) {
    const algorithm = opts.algorithm || 'layered';

    if (!nodes || !nodes.length) return Promise.resolve(new Map());

    // Pure-JS fast path for grid (no ELK needed)
    if (algorithm === 'grid') return Promise.resolve(gridLayout(nodes, opts));

    if (!_elk) {
      console.warn('[codex-layout] ELK not loaded; falling back to grid layout.');
      return Promise.resolve(gridLayout(nodes, opts));
    }

    const W = opts.nodeWidth || 180;
    const H = opts.nodeHeight || 60;
    const algoMeta = ALGORITHMS[algorithm];

    // Some algorithms work better when we strip the edges entirely (rectpacking).
    const usableEdges = (algoMeta && algoMeta.needsEdges) ? edges : [];

    const graph = {
      id: 'root',
      layoutOptions: buildLayoutOptions(algorithm, opts),
      children: nodes.map(n => ({
        id: String(n.id),
        width: opts.perNodeSize ? (opts.perNodeSize(n).w || W) : W,
        height: opts.perNodeSize ? (opts.perNodeSize(n).h || H) : H
      })),
      edges: (usableEdges || []).map((e, i) => ({
        id: 'e' + i,
        sources: [String(e.source)],
        targets: [String(e.target)]
      }))
    };

    return _elk.layout(graph).then(result => {
      const positions = new Map();
      (result.children || []).forEach(c => {
        positions.set(c.id, { x: c.x || 0, y: c.y || 0 });
      });
      // Centre the layout: shift so its midpoint sits at origin (0,0).
      if (positions.size) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        positions.forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        });
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        positions.forEach(p => { p.x -= cx; p.y -= cy; });
      }
      return positions;
    }).catch(err => {
      console.warn('[codex-layout] ELK layout failed, falling back to grid:', err);
      return gridLayout(nodes, opts);
    });
  }

  window._codexLayout = { compute, ALGORITHMS };
})();
