// ============================================================
// CODEX ATLAS — Graph layouts (Phase 1 — WebGL renderer)
// Pre-computes {id → {x, y}} anchor positions per view. Pure functions —
// no DOM, no force-sim. Force-atlas2 polish can be layered on top later
// via sigma's worker plugin if a view needs it.
//
// Coordinate space: sigma's camera defaults to centered (0,0), with x
// increasing right, y INCREASING DOWN (screen convention). Layouts here
// emit world-space coordinates in roughly [-500, +500] — sigma's camera
// auto-fits on first render.
// ============================================================
(function () {

  // POLAR WEDGE — group nodes by a categorical field, assign each group
  // an angular wedge sized by sqrt(count), place members in a grid within.
  // Used by VIEWS.pantheon (group by family) and VIEWS.documents
  // (group by family, but radial = time).
  //
  // opts:
  //   byField:       'family' | 'tradition' | etc. (nodeKey)
  //   familyOrder:   optional explicit ordering array (e.g. FAMILIES list)
  //   innerRadius:   inner annulus radius (default 80)
  //   outerRadius:   outer annulus radius (default 400)
  //   wedgeGap:      radians between adjacent wedges (default 0.04)
  function polarWedge(nodes, opts = {}) {
    const field       = opts.byField || 'family';
    const Rinner      = opts.innerRadius || 80;
    const Router      = opts.outerRadius || 400;
    const GAP         = opts.wedgeGap || 0.04;
    const familyOrder = opts.familyOrder || null;

    // 1) Bucket
    const groups = {};
    nodes.forEach(n => {
      const g = n[field] || 'Other';
      (groups[g] = groups[g] || []).push(n);
    });

    // 2) Group ordering (explicit familyOrder first, then any extras)
    let order = familyOrder
      ? familyOrder.filter(name => groups[name])
      : Object.keys(groups);
    Object.keys(groups).forEach(g => { if (!order.includes(g)) order.push(g); });

    // 3) Angular allocation by sqrt(count)
    const weights = order.map(g => Math.sqrt(groups[g].length));
    const totalW  = weights.reduce((a, b) => a + b, 0);
    const totalGap = GAP * order.length;
    const totalArc = (2 * Math.PI) - totalGap;
    let cursor = -Math.PI / 2; // start at top (12 o'clock)
    const wedges = {};
    order.forEach((name, i) => {
      const arcSize = totalArc * (weights[i] / totalW);
      wedges[name] = { a0: cursor, a1: cursor + arcSize, members: groups[name] };
      cursor += arcSize + GAP;
    });

    // 4) Within each wedge, lay nodes in a polar grid (rows along radial axis,
    //    cols along angular axis). Aspect ratio adapts to wedge width.
    const positions = new Map();
    Object.values(wedges).forEach(w => {
      const N = w.members.length;
      if (!N) return;
      const wedgeWidth = w.a1 - w.a0;
      const wedgePadA  = Math.min(0.04, wedgeWidth * 0.10);
      const aSpan      = wedgeWidth - wedgePadA * 2;
      const rSpan      = (Router - Rinner) * 0.85;
      const rPad       = (Router - Rinner) * 0.075;
      // pick rows/cols to roughly match the visual aspect of the wedge
      const wedgeAspect = (rSpan) / ((w.a0 + w.a1) / 2 * aSpan + 1);
      const cols = Math.max(1, Math.round(Math.sqrt(N / Math.max(0.2, wedgeAspect))));
      const rows = Math.ceil(N / cols);
      // Sort members by date (older nearer center) when applicable; else by id
      const sorted = [...w.members].sort((a, b) => {
        const ad = (typeof a.date_earliest === 'number') ? a.date_earliest : 0;
        const bd = (typeof b.date_earliest === 'number') ? b.date_earliest : 0;
        if (ad !== bd) return ad - bd;
        return a.id.localeCompare(b.id);
      });
      sorted.forEach((node, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const tCol = cols > 1 ? col / (cols - 1) : 0.5;
        const tRow = rows > 1 ? row / (rows - 1) : 0.5;
        const ang = w.a0 + wedgePadA + aSpan * tCol;
        const r   = Rinner + rPad + rSpan * tRow;
        positions.set(node.id, {
          x: r * Math.cos(ang),
          y: r * Math.sin(ang)
        });
      });
    });

    return positions;
  }

  // TIME RADIAL — angular = group field, radial = time (older near centre).
  // Used by VIEWS.documents.
  function timeRadial(nodes, opts = {}) {
    const field       = opts.byField || 'family';
    const Rinner      = opts.innerRadius || 80;
    const Router      = opts.outerRadius || 400;
    const GAP         = opts.wedgeGap || 0.04;
    const familyOrder = opts.familyOrder || null;
    const tMin        = opts.timeMin || -3100;
    const tMax        = opts.timeMax || 700;

    const groups = {};
    nodes.forEach(n => {
      if (typeof n.date_earliest !== 'number') return;
      const g = n[field] || 'Other';
      (groups[g] = groups[g] || []).push(n);
    });
    let order = familyOrder ? familyOrder.filter(name => groups[name]) : Object.keys(groups);
    Object.keys(groups).forEach(g => { if (!order.includes(g)) order.push(g); });

    const weights = order.map(g => Math.sqrt(groups[g].length));
    const totalW = weights.reduce((a, b) => a + b, 0);
    const totalGap = GAP * order.length;
    const totalArc = (2 * Math.PI) - totalGap;
    let cursor = -Math.PI / 2;
    const wedges = {};
    order.forEach((name, i) => {
      const arcSize = totalArc * (weights[i] / totalW);
      wedges[name] = { a0: cursor, a1: cursor + arcSize, members: groups[name] };
      cursor += arcSize + GAP;
    });

    const tRange = tMax - tMin;
    const positions = new Map();
    Object.values(wedges).forEach(w => {
      const N = w.members.length;
      if (!N) return;
      const wedgePadA = Math.min(0.04, (w.a1 - w.a0) * 0.10);
      const aSpan     = (w.a1 - w.a0) - wedgePadA * 2;
      const sorted    = [...w.members].sort((a, b) => a.date_earliest - b.date_earliest);
      sorted.forEach((node, idx) => {
        const t = N > 1 ? idx / (N - 1) : 0.5;
        const ang = w.a0 + wedgePadA + aSpan * t;
        const tNorm = Math.max(0, Math.min(1, (node.date_earliest - tMin) / tRange));
        const r = Rinner + (Router - Rinner) * tNorm;
        positions.set(node.id, {
          x: r * Math.cos(ang),
          y: r * Math.sin(ang)
        });
      });
    });
    return positions;
  }

  // GRID — simple flat grid, k columns wide, used by alchemy/scripture cells.
  function grid(nodes, opts = {}) {
    const cols    = opts.cols || Math.ceil(Math.sqrt(nodes.length));
    const spacing = opts.spacing || 60;
    const positions = new Map();
    nodes.forEach((n, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      positions.set(n.id, {
        x: (c - cols / 2) * spacing,
        y: (r - cols / 2) * spacing
      });
    });
    return positions;
  }

  window._codexGraphLayout = { polarWedge, timeRadial, grid };
})();
