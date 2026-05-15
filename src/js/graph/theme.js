// ============================================================
// CODEX ATLAS — Graph theme tokens (Phase 1 — WebGL renderer)
// Maps the existing CSS design tokens + edge-style families into the
// concrete hex codes sigma.js needs. CSS vars don't work inside WebGL
// shaders — sigma needs real hex strings at render time.
// ============================================================
(function () {
  // Background of the WebGL canvas. Matches --bg-0 in :root.
  const BACKGROUND = '#0a0a0e';

  // Edge type → color hex. Mirrors edgeStyle() in app.js (which returns
  // CSS-var-keyed colors); we resolve to concrete hex per type here so the
  // WebGL programs can use them directly.
  const EDGE_COLOR = {
    'attested-in':       '#d4a55a',  // gold
    'authored':          '#a87bb5',  // purple
    'attributed-author': '#a87bb5',
    'originated':        '#a87bb5',
    'syncretized-with':  '#6e8c6b',  // green
    'parallels':         '#5a9a8f',  // teal
    'cognate-of':        '#5a9a8f',
    'cited-in':          '#aabac5',  // silver
    'mentioned-in':      '#aabac5',
    'influenced':        '#c25450',  // red
    'influenced-by':     '#c25450',
    'descends-from':     '#c25450',
    'documents-affected':'#5a6cc4',  // blue
    'preserved-by':      '#5a6cc4',
    'theme':             '#e0a850',  // amber
    'child-of':          '#a87bb5',
    'consort-of':        '#a87bb5',
    'related-to':        '#7a8090'   // grey (default)
  };
  const DEFAULT_EDGE_COLOR = '#7a8090';

  function edgeColor(type) {
    return EDGE_COLOR[type] || DEFAULT_EDGE_COLOR;
  }

  // Resolve a node's color from its family_color / tradition_color metadata.
  // Falls back to neutral grey if neither is set.
  function nodeColor(node) {
    return node.family_color || node.tradition_color || '#7a8090';
  }

  // Node size curve — same shape as the SVG render path used (radius =
  // 4 + sqrt(degree) * 1.5) but expressed in sigma's "size" unit (which is
  // already a px radius in default settings).
  function nodeSize(degree) {
    return Math.min(14, 4 + Math.sqrt(degree || 0) * 1.5);
  }

  // Selected / hot / dim states — used by the renderer when a node is
  // hovered, clicked, or filtered out. Sigma reducers consume these.
  const HOVER_NODE_BORDER = '#d4a55a';
  const SELECTED_NODE_BORDER = '#f0c878';
  const DIM_OPACITY = 0.18;
  const HOT_OPACITY = 1;

  window._codexGraphTheme = {
    BACKGROUND,
    edgeColor,
    nodeColor,
    nodeSize,
    HOVER_NODE_BORDER,
    SELECTED_NODE_BORDER,
    DIM_OPACITY,
    HOT_OPACITY
  };
})();
