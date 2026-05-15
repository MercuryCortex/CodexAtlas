// ============================================================
// CODEX ATLAS — viewer
// Pantheon (radial-wedge deity graph) · Documents (polar time-by-tradition)
// Timeline (drag-pan + grow-on-zoom + compressed-gap breaks)
// Visual family-filter · cross-family hover-reveal · multi-palette theming
// ============================================================

if (!window.VAULT_DATA) document.getElementById('missing-data').style.display = 'flex';

// ============================================================
// FEATURE FLAGS — gate half-built modes/views here, per architecture §8.
// Visible affordances must work. A `false` flag hides the option entirely from
// dropdowns/menus until the implementation lands.
// ============================================================
const FEATURES = {
  pantheonMonuments: true,  // 23 monument-tagged events live (opus-monuments-1, 2026-05-14)
  atlasMapV2:        true,  // opus-map-1, 2026-05-15 — MapLibre GL + offline PMTiles vector basemap
  transmissionFlow:  false, // proposed: cross-tradition Sankey
  threadsView:       false, // proposed: bridge-figure ladder
  tierOverlay:       true,  // opus-design-2 — Source-Integrity-Tier overlay
};

// ============================================================
// SHARED ZOOM-LOD UTILITY (opus-map-1) — degree-tier visibility thresholds used by
// Atlas (and Timeline once it inherits). Returns smooth 0..1 opacity given a zoom k.
// Tier 0 = top ~1% hubs (always visible), tier 3 = leaves (only at deep zoom).
// ============================================================
function smoothstep01(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function tierVisibilityThreshold(tier, k, mode = 'hub') {
  if (mode === 'off') return 0;
  if (mode === 'all') {
    if (tier === 0 || tier === 1) return 1;
    if (tier === 2) return smoothstep01(0.8, 1.2, k);
    return smoothstep01(1.0, 1.5, k);
  }
  if (tier === 0) return 1;
  if (tier === 1) return smoothstep01(0.85, 1.15, k);
  if (tier === 2) return smoothstep01(1.65, 2.20, k);
  return smoothstep01(3.20, 4.20, k);
}

const DATA = window.VAULT_DATA || { nodes: [], edges: [], counts: {}, traditions: [], families: [] };

// SOURCE-INTEGRITY TIER COMPUTATION (opus-design-2) — each node gets:
//   _tier      : 1..4 (best/lowest tier among refs) or null if no refs
//   _refCount  : count of refs (any tier)
// Rendering is gated by body.tier-overlay-on; render paths set data-tier on shapes.
DATA.nodes.forEach(n => {
  const refs = Array.isArray(n.refs) ? n.refs : [];
  n._refCount = refs.length;
  let best = null;
  for (const r of refs) {
    const t = +(r && r.tier);
    if (t >= 1 && t <= 4 && (best === null || t < best)) best = t;
  }
  n._tier = best;
});

const NODES_BY_ID = Object.fromEntries(DATA.nodes.map(n => [n.id, n]));

// Slug-drift resolver — applied at the EDGES pipeline at app init so drifted edges get
// canonicalized once for all views to use, rather than dropped. The vault has inconsistent
// ID conventions: tradition nodes sometimes use `tradition-X`, sometimes plain `X`
// (christianity-canonical, egyptian, greek-religion, buddhism); documents use `PX-NNN-*`
// but wikilinks often write `phase-X-NNN-*`. Edges land on the drifted form. Resolving
// at this layer means every view (Pantheon family-derivation, Connections, Detail panel,
// edge rendering) all see the same canonical IDs. ~4800 previously-dropped edges return.
function _resolveNodeId(id) {
  if (NODES_BY_ID[id]) return id;
  if (typeof id !== 'string') return null;
  if (id.startsWith('tradition-') && NODES_BY_ID[id.slice(10)]) return id.slice(10);
  if (NODES_BY_ID['tradition-' + id]) return 'tradition-' + id;
  const m = id.match(/^phase-(\d+)-(\d+)([a-z]?)-(.+)$/);
  if (m) {
    const alt = `P${m[1]}-${m[2]}${m[3]}-${m[4]}`;
    if (NODES_BY_ID[alt]) return alt;
  }
  return null;
}
const EDGES = DATA.edges.map(e => {
  const s = _resolveNodeId(e.source);
  const t = _resolveNodeId(e.target);
  if (!s || !t) return null;
  if (s === e.source && t === e.target) return e;       // already canonical — pass through
  return Object.assign({}, e, { source: s, target: t }); // rewrite source/target only
}).filter(Boolean);
const TRADITIONS = DATA.traditions || [];
const FAMILIES = DATA.families || [];

// degree + neighbor maps
const DEGREE = new Map();
const NEIGHBORS = new Map();
EDGES.forEach(e => {
  DEGREE.set(e.source, (DEGREE.get(e.source) || 0) + 1);
  DEGREE.set(e.target, (DEGREE.get(e.target) || 0) + 1);
  if (!NEIGHBORS.has(e.source)) NEIGHBORS.set(e.source, new Set());
  if (!NEIGHBORS.has(e.target)) NEIGHBORS.set(e.target, new Set());
  NEIGHBORS.get(e.source).add(e.target);
  NEIGHBORS.get(e.target).add(e.source);
});

function computeHubSet(nodes, percentile = 0.15) {
  if (!nodes.length) return new Set();
  const sorted = [...nodes].sort((a, b) => (DEGREE.get(b.id) || 0) - (DEGREE.get(a.id) || 0));
  const cutoff = Math.max(1, Math.ceil(sorted.length * percentile));
  return new Set(sorted.slice(0, cutoff).map(n => n.id));
}

// stats
document.getElementById('s-docs').textContent    = DATA.counts.document || 0;
document.getElementById('s-deities').textContent = DATA.counts.deity || 0;
document.getElementById('s-themes').textContent  = DATA.counts.theme || 0;
document.getElementById('s-edges').textContent   = EDGES.length;

// family filter populator
const famSel = document.getElementById('filter-family');
FAMILIES.forEach(f => {
  const o = document.createElement('option');
  o.value = f.name; o.textContent = `${f.name} (${f.count})`;
  famSel.appendChild(o);
});

// state
const STATE = {
  view: 'pantheon',
  selected: null,
  filter: { family: '', type: '', search: '', theme: '' },
  focusId: null,
  // Sticky/additive selection. When non-empty, the listed IDs are "locked" highlighted.
  // Clicking a connected node adds to the set; clicking an unrelated node resets it;
  // clicking empty space clears it. Implemented per-view in render().
  lockedSet: new Set(),
  // Cross-view filter — a Set of node IDs. When set, every view restricts to these IDs.
  // Triggered by the pantheon "view in timeline" button; cleared by the timeline reset chip.
  crossViewFilter: null,
  // Alchemy view state — user-picked node IDs. Bridge nodes are computed from these.
  alchemyPicks: [],
  // Active preset ID (or null). Persists across renders so the preset card stays highlighted
  // and the headline keeps showing while the user is exploring the loaded preset.
  alchemyActivePreset: null,
  // Layout mode for the Alchemy canvas: 'force' (default organic clustering),
  // 'linear' (chronological left→right, type-banded), 'circular' (single ring),
  // 'radial' (picks center cluster, bridges in outer ring).
  alchemyLayout: 'force',
  // Spacing slider 0-100 (default 50). Affects all layouts uniformly.
  alchemySpacing: 50,
  // Pantheon mode toggle — 'deities' (default), 'authors' (persons with authorship/originator
  // edges), or 'symbols' (09_symbols/ nodes clustered by origin family with cross-family
  // symbol edges drawn prominently — the user's "MASSIVE wins" view).
  pantheonMode: 'deities',
};

// ============================================================
// COLOR HELPERS
// ============================================================

// Edge type → color/width. **Thin lines by default everywhere.** Color carries the
// edge-type distinction (gold for transmission, red for polemic, blue for milieu/parallel,
// green for kin, etc.) — width does NOT. Highlighted state lives in CSS (.edge-line.hot
// at 1.6px). User explicitly: "I HATE BIG THICK LINES, except when highlighted."
//
// Width-ceiling discipline:
//   - 0.50 hard ceiling for any baseline (non-highlighted) edge
//   - 0.20–0.32 = "ambient" edges (tradition membership, has-theme, context — these
//     get rendered in dense quantity so they must stay nearly invisible by default)
//   - 0.32–0.50 = "named" edges (transmission, polemic, syncretic-identification — the
//     ones that ARE the story; color makes them distinguishable; width keeps them subtle)
//
// `vector-effect: non-scaling-stroke` in CSS pins these widths regardless of zoom.
const EDGE_STYLE = {
  // ------- Syncretic / lineage / kin (gold–brown–green tints) -------
  'syncretic-identification':         { c: '#b08840', w: 0.42, op: 0.36 },  // muted gold
  'syncretic-ancient-identification': { c: '#b08840', w: 0.38, op: 0.30 },
  'syncretic-scholarly-parallel':     { c: '#947030', w: 0.34, op: 0.24 },
  'syncretic-folk-syncretism':        { c: '#7d5e28', w: 0.30, op: 0.20 },
  'syncretic':                        { c: '#b08840', w: 0.36, op: 0.28 },
  'parent-of':                        { c: '#5a7458', w: 0.34, op: 0.30 },
  'child-of':                         { c: '#5a7458', w: 0.34, op: 0.24 },
  'consort':                          { c: '#a85e44', w: 0.36, op: 0.30 },
  // ------- Textual / scholarly (slate-teal-blue) -------
  'polemic-against':                  { c: '#a83e4a', w: 0.38, op: 0.32 },  // red — clear semantic
  'direct-quote':                     { c: '#4a8a86', w: 0.34, op: 0.28 },
  'redaction-of':                     { c: '#8a6a30', w: 0.32, op: 0.24 },
  'commentary-on':                    { c: '#8a6a8a', w: 0.30, op: 0.22 },
  'parallel-motif':                   { c: '#5a6a82', w: 0.28, op: 0.22 },
  'shared-milieu':                    { c: '#4a5aa4', w: 0.28, op: 0.20 },  // ★ the pleasant blue the user liked
  'shared-tradition':                 { c: '#4a5aa4', w: 0.28, op: 0.18 },
  'manuscript-transmission':          { c: '#6a5a40', w: 0.28, op: 0.20 },
  'influenced-by':                    { c: '#4a8a86', w: 0.30, op: 0.24 },
  'influences':                       { c: '#4a8a86', w: 0.30, op: 0.24 },
  // ------- Ambient / structural (kept barely-visible — these flood the graph in volume) -------
  'attests':                          { c: '#3a4a66', w: 0.22, op: 0.12 },
  'attested-in':                      { c: '#3a4a66', w: 0.22, op: 0.12 },
  'has-theme':                        { c: '#3a5a3e', w: 0.22, op: 0.12 },
  'context':                          { c: '#3a3e48', w: 0.22, op: 0.12 },
  'tradition-deity':                  { c: '#2f3a4e', w: 0.18, op: 0.10 },
  'tradition-doc':                    { c: '#2f3a4e', w: 0.18, op: 0.10 },
  'tradition-person':                 { c: '#2f3a4e', w: 0.18, op: 0.10 },
  'authored':                         { c: '#8a6a30', w: 0.30, op: 0.24 },
  // ------- Cross-symbol edge types (09_symbols/) -------
  // PREVIOUSLY these were force-loud at w ≥ 0.95 per the "MASSIVE wins" demand. User has
  // since seen the result and asked for everything thin. Color now does ALL the work:
  // gold = transmission, red = polemic-inversion, amber = merger/appropriation, grey =
  // weakest claim. Hover/.hot in CSS still bumps to 1.6px when highlighted.
  'ancestor-of':                      { c: '#d4a55a', w: 0.46, op: 0.55 },  // bright gold, directional, primary
  'parallel-form':                    { c: '#a08a5a', w: 0.34, op: 0.36 },  // muted gold — resemblance, not transmission
  'syncretic-fusion':                 { c: '#c47a3a', w: 0.42, op: 0.50 },  // amber — two-into-one merger
  'appropriated-by':                  { c: '#c4a05a', w: 0.42, op: 0.50 },  // adoption across traditions
  'polemic-inversion':                { c: '#a83e4a', w: 0.46, op: 0.55 },  // red — swastika-Nazi case
  'visual-cognate':                   { c: '#7a8090', w: 0.30, op: 0.28 },  // grey — weakest claim
  // Symbol → other-node edges. High volume → kept nearly invisible.
  'symbol-attests-in':                { c: '#6a7a90', w: 0.26, op: 0.16 },
  'symbol-iconography-of':            { c: '#8a6a5a', w: 0.28, op: 0.20 },
  'symbol-in-tradition':              { c: '#5a7080', w: 0.24, op: 0.14 },
};
// Set of edge types that count as "cross-family connections between symbols" — used by
// the Pantheon Symbols mode to surface those edges with prominent styling. The user's
// MASSIVE-win demos (ankh → coptic-cross, swastika polemic-inversion) live here.
const SYMBOL_CROSS_EDGE_TYPES = new Set([
  'ancestor-of', 'parallel-form', 'syncretic-fusion',
  'appropriated-by', 'polemic-inversion', 'visual-cognate',
]);
const EDGE_DEFAULT = { c: '#3a4a66', w: 0.25, op: 0.13 };  // very subtle baseline
function edgeStyle(t) { return EDGE_STYLE[t] || EDGE_DEFAULT; }

// String hash → 0..2^31
function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 16777619); } return h >>> 0; }

// per-node color: slight HSL shift on family color, deterministic by subtradition+title
function nodeColor(n) {
  const base = d3.hsl(n.family_color || n.tradition_color || '#7a8090');
  if (!isFinite(base.h)) base.h = 30;
  const h = hashStr((n.tradition || '') + '|' + (n.title || '') + (n.role || ''));
  // Subtle per-deity variation — keeps family identity strong while still distinguishing individuals.
  // Hue is held tight (±5°) so a wedge reads as one color; lightness/saturation vary a bit more.
  const dh = ((h % 10) - 5);              // ±5° hue
  const ds = (((h >> 8) % 18) - 9) / 100; // ±9% saturation
  const dl = (((h >> 16) % 16) - 8) / 100; // ±8% lightness
  base.h = (base.h + dh + 360) % 360;
  base.s = Math.max(0.30, Math.min(0.85, base.s + ds));
  base.l = Math.max(0.38, Math.min(0.70, base.l + dl));
  return base.formatHex();
}

// polar coordinates in d3-arc convention: 0 = top (12 o'clock), increasing clockwise
function polarXY(angle, r) { return [r * Math.sin(angle), -r * Math.cos(angle)]; }

// Custom d3 symbol: equilateral 45°-rotated square (all 4 points equidistant from center).
// d3.symbolDiamond produces a TALL lozenge (1:tan30° aspect ≈ 1.73:1) — that's not what
// Scripture's render uses for persons, and not what the user wants for "author shape."
// Scripture inlines this exact geometry at its render site (~line 3107). Defining it as
// a real d3 symbol lets shapeFor() return it directly so every view that calls shapePath
// (Pantheon, Timeline, Alchemy) gets the same equilateral diamond.
//   Area of an equilateral diamond with diagonals 2r × 2r = 2r²  →  r = √(size/2)
const symbolDiamondEqual = {
  draw(context, size) {
    const r = Math.sqrt(size / 2);
    context.moveTo(0, -r);
    context.lineTo(r, 0);
    context.lineTo(0, r);
    context.lineTo(-r, 0);
    context.closePath();
  },
};

// Defensive accessor for node tags. ~17 nodes in the vault have `tags` serialized as a
// STRING by build_data.py (multi-line YAML array truncation bug) instead of an array,
// which throws when callers do `n.tags.map/some/includes`. This normalizes any shape —
// array, string, undefined, null — into a string[] for safe iteration.
function tagsOf(n) {
  const t = n && n.tags;
  if (!t) return [];
  if (Array.isArray(t)) return t.map(x => String(x).toLowerCase());
  if (typeof t === 'string') return t.replace(/[\[\]"']/g, '').split(/[,\s]+/).filter(Boolean).map(x => x.toLowerCase());
  return [];
}

// Custom symbol for monuments — a small "temple" silhouette: a triangle pediment over
// a rectangular base. Reads as built architecture (church, temple, mosque, stupa).
// Designed to fit a bounding box of ~2r × ~2r so it sizes the same as a circle.
const symbolMonument = {
  draw(context, size) {
    // r ≈ half the bounding-box side. Total area ≈ 2.5r² (triangle ~r² + rect ~1.5r²),
    // so r = √(size / 2.5).
    const r = Math.sqrt(size / 2.5);
    const baseW = r * 1.6;     // rectangular base width
    const baseH = r * 0.95;    // rectangular base height
    const pediH = r * 0.95;    // triangle pediment height
    // Triangle pediment (apex up, base aligned with top of rectangle)
    context.moveTo(0, -pediH);
    context.lineTo(baseW / 2 + 1, 0);
    context.lineTo(-baseW / 2 - 1, 0);
    context.closePath();
    // Rectangular base below the triangle
    context.moveTo(-baseW / 2, 0);
    context.lineTo( baseW / 2, 0);
    context.lineTo( baseW / 2, baseH);
    context.lineTo(-baseW / 2, baseH);
    context.closePath();
  },
};

// Shape-per-type — each node category gets a distinct silhouette so a mixed-type view
// (Alchemy, Timeline) reads at a glance. Pantheon's Authors mode also benefits: deities
// stay as circles, persons render as equilateral diamonds, etc.
// For SYMBOLS specifically, shape varies by the symbol's category (geometric vs.
// theriomorphic vs. phytomorphic, etc.) — see schema-symbol.md.
function shapeFor(n) {
  if (!n) return d3.symbolCircle;
  switch (n.type) {
    case 'deity':     return d3.symbolCircle;
    // person/author = EQUILATERAL diamond (Scripture-matching geometry). All 4 points
    // equidistant from center — visually a square rotated 45°. Distinct from documents
    // (axis-aligned square) and from d3.symbolDiamond (tall lozenge).
    case 'person':    return symbolDiamondEqual;
    case 'event':
      // Events tagged as `monument` render as a temple silhouette (pediment+base), not
      // the standard star. Lets the Pantheon Monuments mode read at a glance — discovery
      // sites, churches, temples, mosques all share this little-building icon.
      if (tagsOf(n).includes('monument')) return symbolMonument;
      return d3.symbolStar;
    case 'document':  return d3.symbolSquare;
    case 'theme':     return d3.symbolTriangle;
    case 'tradition': return d3.symbolWye;
    case 'symbol':
      // Map symbol category → d3 shape. Falls through to symbolStar (the generic
      // symbol-ish shape) if category is missing or unrecognized.
      switch ((n.category || '').toLowerCase()) {
        case 'geometric':       return d3.symbolStar;
        case 'theriomorphic':   return d3.symbolDiamond;
        case 'phytomorphic':    return d3.symbolTriangle;
        case 'anthropomorphic': return d3.symbolWye;
        case 'astral':          return d3.symbolCircle;
        case 'cosmological':    return d3.symbolSquare;
        case 'mystery':         return d3.symbolCross;
        default:                return d3.symbolStar;
      }
    default:          return d3.symbolCircle;
  }
}
// d3.symbol().size() is a BOUNDING-BOX AREA. Convert a desired visual radius to size.
// We over-area slightly for non-circular shapes so they don't read smaller than the circle.
function shapeSizeFor(n, r) {
  const base = Math.PI * r * r;
  switch (n && n.type) {
    case 'diamond':
    case 'person':    return base * 1.5;     // diamond looks small at equal area → bump
    case 'event':     return base * 1.4;     // star
    case 'theme':     return base * 1.6;     // triangle
    case 'document':  return base * 1.1;
    case 'tradition': return base * 1.3;     // wye
    case 'symbol':    return base * 1.5;     // shapes vary by category — bump uniformly so symbols read
    default:          return base;
  }
}
const _shapeGen = d3.symbol();
function shapePath(n, r) {
  return _shapeGen.type(shapeFor(n)).size(shapeSizeFor(n, r))();
}

// ============================================================
// UTILS
// ============================================================
function fmtDate(y) {
  if (y === undefined || y === null || y === "") return '—';
  if (typeof y !== 'number') return String(y);
  if (y < 0) return Math.abs(y) + ' BCE';
  return y + ' CE';
}
function fmtDateRange(a, b) {
  if (a == null && b == null) return '';
  if (a != null && b != null && a !== b) return fmtDate(a) + ' – ' + fmtDate(b);
  return fmtDate(a ?? b);
}
function matchesFilter(n) {
  const f = STATE.filter;
  if (f.family && (n.family || 'Other') !== f.family) return false;
  if (f.type && n.type !== f.type) return false;
  if (f.theme) {
    // a node matches the theme if it links to that theme id
    const tied = NEIGHBORS.get(n.id);
    if (!tied || !tied.has(f.theme)) return false;
  }
  if (f.search) {
    const q = f.search.toLowerCase();
    // Hay now includes aka (alternative names) and the full body prose so search
    // hits body content (was: only metadata fields, which missed e.g. "nomad").
    const hay = (
      n.title + ' ' + n.id + ' ' +
      tagsOf({ tags: n.aka }).join(' ') + ' ' +
      tagsOf(n).join(' ') + ' ' +
      tagsOf({ tags: n.themes }).join(' ') + ' ' +
      (n.tradition || '') + ' ' +
      (n.body || '')
    ).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}
function neighborsOf(id, hops = 1) {
  const out = new Set([id]);
  let frontier = [id];
  for (let h = 0; h < hops; h++) {
    const next = [];
    frontier.forEach(x => {
      const nbs = NEIGHBORS.get(x);
      if (nbs) nbs.forEach(n => { if (!out.has(n)) { out.add(n); next.push(n); } });
    });
    frontier = next;
  }
  return out;
}

// ============================================================
// MAP THUMBNAIL — small world map bottom-right, highlights the deity/doc/event's region.
// Uses inline minimal continent outlines (equirectangular projection so the math is trivial).
// On hover or sticky-lock, .setMapTarget(node) shows the geo dot.
// ============================================================
const MAP_W = 360, MAP_H = 180;
// equirectangular projection: lon ∈ [-180,180] → x ∈ [0,360]; lat ∈ [-90,90] → y ∈ [180,0]
function geoToMap(lat, lon) {
  return [
    (lon + 180) * (MAP_W / 360),
    (90 - lat) * (MAP_H / 180),
  ];
}
// Minimal continent outlines (very simplified — enough to recognize continents at thumbnail size).
// Each path is an array of [lat, lon] pairs traced clockwise.
const CONTINENT_OUTLINES = [
  // Europe (very rough)
  [[58,-9],[68,5],[71,25],[60,40],[45,40],[38,28],[36,15],[43,-4],[50,-9],[58,-9]],
  // Africa (rough)
  [[36,-7],[34,11],[31,33],[12,42],[-12,40],[-34,18],[-35,20],[-22,14],[-7,9],[6,3],[14,-17],[22,-17],[34,-9],[36,-7]],
  // Asia (rough)
  [[71,30],[78,60],[78,100],[72,140],[55,135],[40,140],[25,122],[12,108],[8,80],[20,68],[26,60],[36,46],[43,40],[60,40],[71,25],[71,30]],
  // North America (rough)
  [[70,-160],[72,-90],[70,-60],[50,-55],[30,-78],[18,-95],[20,-105],[35,-120],[55,-135],[70,-160]],
  // South America (rough)
  [[12,-72],[8,-50],[-10,-35],[-30,-50],[-55,-70],[-40,-75],[-15,-78],[-2,-80],[12,-72]],
  // Australia (rough)
  [[-12,130],[-12,144],[-30,153],[-38,146],[-35,120],[-25,113],[-15,123],[-12,130]],
  // Greenland (rough)
  [[83,-30],[78,-20],[70,-22],[60,-44],[78,-58],[83,-30]],
  // British Isles (very rough)
  [[59,-7],[58,-2],[50,-5],[52,-10],[59,-7]],
  // Indonesia / Philippines / SE Asia archipelago (rough sweep)
  [[6,95],[2,110],[-7,108],[-9,118],[-2,128],[8,124],[18,121],[6,95]],
  // Japan (rough)
  [[44,141],[36,141],[33,131],[35,130],[40,140],[44,141]],
  // Madagascar (rough)
  [[-12,49],[-15,50],[-25,47],[-25,44],[-15,46],[-12,49]],
  // New Zealand (rough)
  [[-35,173],[-41,176],[-47,168],[-41,170],[-35,173]],
];
function projectOutlines() {
  const pathsEl = document.getElementById('map-thumb-paths');
  if (!pathsEl) return;
  pathsEl.innerHTML = CONTINENT_OUTLINES.map(poly => {
    const pts = poly.map(([lat, lon]) => geoToMap(lat, lon).map(v => v.toFixed(1)).join(',')).join(' ');
    return `<polygon points="${pts}" />`;
  }).join('');
}
projectOutlines();

let mapThumbVisible = false;
function setMapTarget(node) {
  const thumb = document.getElementById('map-thumb');
  const marker = document.getElementById('map-thumb-marker');
  const label = document.getElementById('map-thumb-label');
  if (!node || !node.geo) {
    if (mapThumbVisible) {
      thumb.style.opacity = '0.45';
      label.textContent = '— ' + (node ? '(no region)' : 'hover a node');
      marker.innerHTML = '';
    } else {
      thumb.style.display = 'none';
    }
    return;
  }
  thumb.style.display = 'block';
  thumb.style.opacity = '1';
  const [x, y] = geoToMap(node.geo.lat, node.geo.lon);
  marker.innerHTML = `
    <circle cx="${x}" cy="${y}" r="6" fill="none" stroke="var(--gold)" stroke-width="0.8" stroke-opacity="0.5"/>
    <circle class="pulse" cx="${x}" cy="${y}" r="2.6"/>
  `;
  label.textContent = node.geo.label || node.region || '';
  mapThumbVisible = true;
}
function clearMapTarget() {
  const thumb = document.getElementById('map-thumb');
  thumb.style.display = 'none';
  mapThumbVisible = false;
}
window.setMapTarget = setMapTarget;
window.clearMapTarget = clearMapTarget;

const tooltip = d3.select('#tooltip');
function showTooltip(html, ev) {
  tooltip.html(html).classed('show', true)
    .style('left', (ev.clientX + 14) + 'px')
    .style('top', (ev.clientY + 14) + 'px');
}
function hideTooltip() { tooltip.classed('show', false); }

// Small Wikipedia thumbnail inline in tooltip (when one is cached for the node).
function tooltipThumb(d) {
  return d && d.thumbnail
    ? `<img class="tt-thumb" src="${d.thumbnail}" onerror="this.remove()" alt="" />`
    : '';
}

// ============================================================
// VIEW DISPATCH
// ============================================================
const VIEWS = {};
const svg = d3.select('#svg');
const legend = d3.select('#legend');

function setView(name) {
  // Track whether this is a view CHANGE vs a re-render of the same view (driven by
  // ResizeObserver or window resize). On a re-render, we must NOT touch the detail-panel
  // collapse state — that would close the panel a user just opened by clicking a node.
  // The ResizeObserver fires ~220ms after a node click because the panel-open animation
  // changes the SVG width; without this guard, the panel would slam shut.
  const _isViewChange = STATE.view !== name;
  STATE.view = name; STATE.focusId = null;
  // Body class for view-specific styling hooks (e.g., timeline gets uniform bg, no radial gradient).
  document.body.className = document.body.className.replace(/\bview-\S+\b/g, '').trim() + ' view-' + name;
  document.querySelectorAll('nav.side .item').forEach(el => el.classList.toggle('active', el.dataset.view === name));
  svg.selectAll('*').remove();
  // clear any view-specific event bindings on the svg root so they don't leak between views
  svg.on('wheel', null).on('wheel.zoom', null).on('mousedown.zoom', null)
     .on('.drag', null).on('click', null);
  svg.style('cursor', 'default');
  // Atlas-map container: shown only on `atlas` view; SVG is hidden in that case.
  // The MapLibre map instance is kept alive across visits (init once, reuse).
  // We toggle the OUTER pane — MapLibre overrides position:relative on its own
  // container element, so the outer wrapper owns positioning + display.
  const _atlasPaneEl = document.getElementById('atlas-pane');
  if (name === 'atlas' && FEATURES.atlasMapV2) {
    svg.node().style.display = 'none';
    if (_atlasPaneEl) _atlasPaneEl.style.display = 'block';
  } else {
    svg.node().style.display = '';
    if (_atlasPaneEl) _atlasPaneEl.style.display = 'none';
  }
  document.getElementById('view-controls').innerHTML = '';
  legend.style('display', 'none').html('');
  document.querySelectorAll('.list-pane,.about-pane,.alch-toolbox,.alch-palette,.tl-zoom-presets').forEach(el => el.remove());
  hideTooltip();
  // Map thumbnail only on geo-relevant views; hide elsewhere.
  // Atlas view uses MapLibre (no SVG map-thumb); zoom meter shown separately.
  const showMapThumb = (name === 'pantheon' || name === 'documents' || name === 'timeline' || name === 'alchemy' || name === 'scripture');
  const showZoomMeter = showMapThumb || name === 'atlas';
  // Default-collapse the detail panel ONLY on a view CHANGE (e.g., Pantheon → Timeline),
  // not on a re-render of the same view. Re-renders are triggered by ResizeObserver and
  // window-resize listeners — if we collapsed on those, clicking a Timeline event would
  // open the panel briefly and then snap shut ~220ms later when the ResizeObserver fires
  // (because opening the panel changes the SVG width, which trips the observer).
  if (showMapThumb && _isViewChange) {
    document.body.classList.add('detail-collapsed');
    const dt = document.getElementById('detail-toggle');
    if (dt) dt.textContent = '‹';
  }
  document.getElementById('map-thumb').style.display = showMapThumb ? 'block' : 'none';
  if (showMapThumb) {
    document.getElementById('map-thumb').style.opacity = '0.45';
    document.getElementById('map-thumb-label').textContent = '— hover a node';
    document.getElementById('map-thumb-marker').innerHTML = '';
    mapThumbVisible = true;
  }
  // Zoom meter — visible on zoomable views (including atlas); its handlers are rewired per-view by the renderer.
  document.getElementById('zoom-meter').style.display = showZoomMeter ? 'inline-flex' : 'none';
  // Body flag so the view-header can reserve top-right space for the meter.
  document.body.classList.toggle('zoom-visible', showZoomMeter);
  const v = VIEWS[name];
  document.getElementById('view-title').textContent = v.title;
  document.getElementById('view-subtitle').textContent = v.subtitle;
  v.render();
}
function selectNode(id, opensDetail) {
  STATE.selected = id; renderDetail();
  // Default behavior: clicking a node opens the detail panel. Pass `opensDetail: false`
  // only to update selection without uncollapsing the panel. Previously the default was the
  // opposite — only index-view callers passed `true`, graph clicks left the panel state
  // untouched. User: "when we click on a event the side panel should open to show info".
  if (opensDetail !== false) {
    document.body.classList.remove('detail-collapsed');
    const dt = document.getElementById('detail-toggle');
    if (dt) dt.textContent = '›';
  }
  d3.selectAll('.node-circle').classed('selected', d => d && d.id === id);
}
window.selectNode = selectNode;

// ============================================================
// DETAIL
// ============================================================
function renderDetail() {
  const el = document.getElementById('detail-inner');
  const id = STATE.selected;
  if (!id || !NODES_BY_ID[id]) { el.innerHTML = '<div class="empty">Select a node to inspect.</div>'; return; }
  const n = NODES_BY_ID[id];
  const dateStr = fmtDateRange(n.date_earliest, n.date_latest);
  const outEdges = EDGES.filter(e => e.source === id).slice(0, 80);
  const inEdges  = EDGES.filter(e => e.target === id).slice(0, 80);

  const bodyHTML = n.body
    ? marked.parse(n.body.replace(/\[\[([^\]\|]+)(?:\|[^\]]*)?\]\]/g, (m, link) => {
        const target = link.trim().replace(/^.*\//, '').replace(/\.md$/, '');
        const targetNode = NODES_BY_ID[target];
        if (targetNode) return `<a href="#" onclick="event.preventDefault(); selectNode('${target}'); return false;">${targetNode.title}</a>`;
        return `<span style="color:var(--text-3)">${link}</span>`;
      }))
    : '<p style="color:var(--text-3)"><em>No body content (stub).</em></p>';

  const refsHTML = (n.refs && n.refs.length)
    ? '<h4 style="font-family: var(--serif); color: var(--gold); margin-top: 1.4em;">References</h4>' +
      '<ol style="padding-left: 18px; font-size: 12px;">' +
      n.refs.map(r => {
        if (typeof r === 'string') return `<li>${r}</li>`;
        const title = r.title || ''; const author = r.author || '';
        const year = r.year ? ` (${r.year})` : ''; const pub = r.publisher ? `, ${r.publisher}` : '';
        const url = r.url ? ` <a href="${r.url}" target="_blank">→</a>` : '';
        const tier = r.tier ? ` <span style="color:var(--text-3); font-family: var(--mono); font-size: 10px;">T${r.tier}</span>` : '';
        return `<li>${author}${year}. <em>${title}</em>${pub}.${url}${tier}</li>`;
      }).join('') + '</ol>'
    : '';

  // Thumbnail: curated `depictions[0]` from YAML takes precedence (lets agents
  // override the auto-fetched Wikipedia thumb without touching the cache), then
  // fall back to the Wikipedia thumb from fetch_thumbnails.py's cache.
  const curatedDep = (n.depictions && n.depictions[0]) || null;
  const thumbSrc = (curatedDep && curatedDep.src) || n.thumbnail || '';
  const thumbCaption = curatedDep ? (curatedDep.caption || '') : (n.thumb_title || '');
  const thumbSource = curatedDep ? (curatedDep.source || '') : '';
  const thumbLicense = curatedDep ? (curatedDep.license || '') : '';
  const thumbHTML = thumbSrc
    ? `<img class="thumb" src="${thumbSrc}" alt="${n.title}" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='none'" />
       <div class="thumb-attribution">
         <span>${thumbCaption}${thumbSource ? ' — ' + thumbSource : ''}${thumbLicense ? ' (' + thumbLicense + ')' : ''}</span>
         ${(!curatedDep && n.thumb_page) ? `<a href="${n.thumb_page}" target="_blank">wikipedia →</a>` : ''}
       </div>`
    : '';

  el.innerHTML = `
    ${thumbHTML}
    <h3>${n.title}</h3>
    <div class="meta">
      <span class="pill" style="color:${n.family_color || n.tradition_color}; border-color:${n.family_color || n.tradition_color}">${n.type}</span>
      ${n.family ? `<span class="pill family">${n.family}</span>` : ''}
      ${n.tradition && n.tradition !== n.family ? `<span class="pill" style="color: var(--text-2)">${n.tradition}</span>` : ''}
      ${dateStr ? `<span class="pill date">${dateStr}</span>` : ''}
      ${n.status ? `<span class="pill status">${n.status}</span>` : ''}
      ${n.label ? `<span class="pill">${n.label}</span>` : ''}
    </div>
    <div class="body-md">${bodyHTML}</div>
    ${refsHTML}
    ${(outEdges.length || inEdges.length) ? `
      <div class="links-out">
        ${outEdges.length ? `
          <h4>Outgoing edges (${outEdges.length})</h4>
          ${outEdges.map(e => {
            const t = NODES_BY_ID[e.target];
            return `<div class="link-edge" onclick="selectNode('${e.target}')">
              <span class="etype">${e.type}</span>
              <span class="etarget">${t ? t.title : e.target}</span>
            </div>`;
          }).join('')}` : ''}
        ${inEdges.length ? `
          <h4 style="margin-top:14px;">Incoming edges (${inEdges.length})</h4>
          ${inEdges.map(e => {
            const t = NODES_BY_ID[e.source];
            return `<div class="link-edge" onclick="selectNode('${e.source}')">
              <span class="etype">${e.type}</span>
              <span class="etarget">${t ? t.title : e.source}</span>
            </div>`;
          }).join('')}` : ''}
      </div>` : ''}
    <div style="margin-top: 16px; font-family: var(--mono); font-size: 10px; color: var(--text-3);">
      ${n.path || ''}
    </div>
  `;
}

// ============================================================
// PANTHEON — radial wedge layout
// Each family gets an angular wedge proportional to sqrt(memberCount).
// Family labels sit OUTSIDE the ring, rotated tangentially.
// ============================================================
VIEWS.pantheon = {
  title: 'Pantheon',
  subtitle: '',
  render() {
    // Mode: 'deities' (gods clustered by family) | 'authors' (persons who authored, were
    // attributed-to, originated a concept, or are listed as a doc's key-figure) | 'symbols'
    // (iconographic units clustered by origin family with cross-family edges loud) |
    // 'events' (historical events clustered by tradition/region) | 'monuments' (placeholder
    // — discovery sites / temples / churches; node type not yet in vault).
    // 'scripture' is intercepted in the dropdown handler and redirects to the Scripture view.
    const mode = STATE.pantheonMode || 'deities';
    const titleByMode = {
      'deities':   'Pantheon',
      'authors':   'Authors of the Pantheon',
      'symbols':   'Symbols of the Pantheon',
      'events':    'Events of the Pantheon',
      'monuments': 'Monuments of the Pantheon',
    };
    document.getElementById('view-title').textContent = titleByMode[mode] || 'Pantheon';

    // Precompute "is-author" set for the authors mode — uses authorship-bearing edges.
    let authorSet = null;
    if (mode === 'authors') {
      authorSet = new Set();
      const authorEdgeTypes = new Set(['authored', 'attributed-author', 'originated', 'key-figure']);
      EDGES.forEach(e => {
        if (!authorEdgeTypes.has(e.type)) return;
        // For 'key-figure' edges (source = document → person), the PERSON is the author-figure.
        // For other types (source = person → work/concept), the SOURCE is the author-figure.
        const candidateId = (e.type === 'key-figure') ? e.target : e.source;
        const cand = NODES_BY_ID[candidateId];
        if (cand && cand.type === 'person') authorSet.add(candidateId);
      });
    }

    // In Pantheon, family filter is applied VISUALLY (not by removing nodes) — so wedges
    // and positions stay stable when you focus a family. Other filters still apply at data level.
    let deities = DATA.nodes.filter(n => {
      if (mode === 'deities') {
        if (n.type !== 'deity') return false;
      } else if (mode === 'authors') {
        if (n.type !== 'person') return false;
        if (!authorSet.has(n.id)) return false;
      } else if (mode === 'symbols') {
        if (n.type !== 'symbol') return false;
      } else if (mode === 'events') {
        if (n.type !== 'event') return false;
      } else if (mode === 'monuments') {
        // No 'monument' node type exists yet — see AUDIT/ for future work. For now,
        // anything tagged `monument` or with a `monument` category passes; in practice
        // this filter returns ~zero nodes and the empty-state card below explains.
        const tags = tagsOf(n);
        if (!tags.includes('monument') && (n.category || '').toLowerCase() !== 'monument') return false;
      }
      const f = STATE.filter;
      if (f.type && n.type !== f.type) return false;
      if (f.theme) {
        const tied = NEIGHBORS.get(n.id);
        if (!tied || !tied.has(f.theme)) return false;
      }
      if (f.search) {
        const q = f.search.toLowerCase();
        const hay = (n.title + ' ' + n.id + ' ' + tagsOf({tags:n.aka}).join(' ') + ' ' + tagsOf(n).join(' ') + ' ' + tagsOf({tags:n.themes}).join(' ') + ' ' + (n.tradition||'') + ' ' + (n.body||'')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // EVENTS + MONUMENTS MODES — both ship with `family: "Other"` from the build pipeline
    // because they don't have a single tradition. So we derive each one's family at render-
    // time from its neighborhood: walk all edges incident on the node, tally the families
    // of adjacent non-event / non-Other nodes, and assign the majority family. This makes
    // the wedge clustering meaningful — Council of Nicaea lands in Christian, Hegira in
    // Islamic, Borobudur in Buddhist, Chartres Cathedral in Christian, etc. Cross-family
    // events / monuments (battles, polemics, syncretic sites) draw natural edges between
    // wedges. Monuments are events with `tags: [monument]` per the v1 data model.
    if (mode === 'events' || mode === 'monuments') {
      // Slug-drift resolver: the vault has inconsistent ID conventions. Some tradition
      // nodes use `tradition-X`, others use plain `X` (christianity-canonical, egyptian,
      // greek-religion, buddhism). Documents use `PX-NNN-*` but wikilinks often write
      // `phase-X-NNN-*`. Many edges therefore land on un-resolvable target IDs. Probe
      // alternates so drifted edges still contribute to family voting.
      function resolveAlias(id) {
        if (NODES_BY_ID[id]) return NODES_BY_ID[id];
        if (id.startsWith('tradition-') && NODES_BY_ID[id.slice(10)]) return NODES_BY_ID[id.slice(10)];
        if (NODES_BY_ID['tradition-' + id]) return NODES_BY_ID['tradition-' + id];
        const m = id.match(/^phase-(\d+)-(\d+)([a-z]?)-(.+)$/);
        if (m) {
          const alt = `P${m[1]}-${m[2]}${m[3]}-${m[4]}`;
          if (NODES_BY_ID[alt]) return NODES_BY_ID[alt];
        }
        return null;
      }
      // Mirror of build_data.py's tradition_family() — tradition nodes themselves carry
      // family:"Other" in the build output (the function only runs on deity/document
      // nodes' tradition fields, not on tradition nodes themselves). So when a vote
      // resolves to a tradition, fall back to deriving the family from the tradition's
      // slug or title. Without this, Parthenon's only edge (to `tradition-greek-religion`)
      // contributes no vote; with it, Greek wins.
      function familyFromTraditionSlug(slug) {
        const s = String(slug || '').toLowerCase();
        if (!s) return null;
        if (/gnostic|sethian|valentinian|thomasine/.test(s))                                return 'Gnostic';
        if (/mandae/.test(s))                                                                return 'Mandaean';
        if (/manichae/.test(s))                                                              return 'Manichaean';
        if (/neoplaton|plotin|iambl|procl/.test(s))                                          return 'Neoplatonist';
        if (/hermetic|hermetism/.test(s))                                                    return 'Hermetic';
        if (/mystery|mithra|orphic|eleusin|phrygian|bacchic/.test(s))                        return 'Mystery';
        if (/christian|patristic|coptic|byzantine|lutheran|calvinist|reformed|protestant|catholic|anglican|rosicrucian|freemason|mormon|baha|scientology|spiritualist|new-age|wicca|rastafari/.test(s)) return 'Christian';
        if (/rabbinic|mishnah|talmud|midrash|kabbal|hasidic|hasidism|merkavah|hekhalot|sabbatean|frankist/.test(s)) return 'Rabbinic';
        if (/islam|qur|sufi|shia|ismaili|alevi|druze|yazidi|muslim/.test(s))                 return 'Islamic';
        if (/buddh|theravada|mahayana|zen|chan|vajra|pure-land|dzogchen|bon\b/.test(s))      return 'Buddhist';
        if (/sikh|vedic|hindu|upanish|brahman|tantric|vaishnav|shakta|shaiv|bhakti|vedanta|jain|hindutva/.test(s)) return 'Vedic';
        if (/zoroastr|mazda|parsi/.test(s))                                                  return 'Zoroastrian';
        if (/greek-religion|hellenistic-philosophy|stoic|pythagor|platon\b|aristotel/.test(s)) return 'Greek';
        if (/roman-religion|etruscan|italic/.test(s))                                        return 'Roman';
        if (/egyptian|kemetic/.test(s))                                                      return 'Egyptian';
        if (/mesopotam|sumer|akkad|babylonian|assyrian|canaanite|ugarit|phoeni/.test(s))     return 'Mesopotamian';
        if (/norse|germanic|asatru/.test(s))                                                 return 'Norse';
        if (/celt|druid/.test(s))                                                            return 'Celtic';
        if (/slavic|finno|finn|karel/.test(s))                                               return 'Slavic-Finnic';
        if (/yoruba|ifa|vodou|santeria|lucumi|african|akan|dogon|zulu/.test(s))              return 'African';
        if (/aztec|maya|mexica|inca|andean|mesoamerican/.test(s))                            return 'Mesoamerican';
        if (/polynesian|maori|hawaiian|pacific|aboriginal|melanesian/.test(s))               return 'Pacific';
        if (/native-american|navajo|hopi|iroquois|lakota/.test(s))                           return 'Native-American';
        if (/confucian|daoist|chinese|tao\b/.test(s))                                        return 'Chinese';
        return null;
      }
      function familyOf(node) {
        if (node.family && node.family !== 'Other') return node.family;
        // Tradition nodes default to "Other" in the build output — recover via slug.
        if (node.type === 'tradition') return familyFromTraditionSlug(node.id) || familyFromTraditionSlug(node.title);
        return null;
      }
      // Build a family → color lookup from any existing typed node (deities have it set).
      const famColor = {};
      DATA.nodes.forEach(n => {
        if (n.family && n.family !== 'Other' && n.family_color && !famColor[n.family]) {
          famColor[n.family] = n.family_color;
        }
      });
      // Vote tally for each event.
      const votes = {};
      EDGES.forEach(e => {
        const s = resolveAlias(e.source);
        const t = resolveAlias(e.target);
        if (!s || !t) return;
        let evId = null, other = null;
        if (s.type === 'event') { evId = s.id; other = t; }
        else if (t.type === 'event') { evId = t.id; other = s; }
        else return;
        const fam = familyOf(other);
        if (!fam) return;
        votes[evId] = votes[evId] || {};
        votes[evId][fam] = (votes[evId][fam] || 0) + 1;
      });
      // Map to derived-family copies so we don't mutate the originals (shared across views).
      deities = deities.map(ev => {
        const v = votes[ev.id];
        if (!v) return ev;
        const top = Object.entries(v).sort((a, b) => b[1] - a[1])[0];
        if (!top) return ev;
        return Object.assign({}, ev, {
          family: top[0],
          family_color: famColor[top[0]] || ev.family_color,
        });
      });
    }

    if (deities.length === 0) {
      const emptyMsg =
          mode === 'monuments' ? 'Monuments — coming soon. Add `tags: [monument]` to event/site nodes (Göbekli Tepe, Chartres, the Kaaba, etc.) to populate this view.'
        : mode === 'deities'   ? 'No deities match the current filter.'
        : mode === 'authors'   ? 'No authors match the current filter.'
        : mode === 'symbols'   ? 'No symbols match the current filter.'
        : mode === 'events'    ? 'No events match the current filter.'
                               : 'No nodes match the current filter.';
      svg.append('text').attr('x', '50%').attr('y', '50%')
        .attr('text-anchor', 'middle').attr('fill', 'var(--text-3)')
        .style('font-family', 'var(--serif)').style('font-size', '18px')
        .style('max-width', '500px')
        .text(emptyMsg);
      return;
    }

    const W = svg.node().clientWidth, H = svg.node().clientHeight;
    const cx = W / 2, cy = H / 2;
    // Generous ring with deep wedges for breathing room
    const Router = Math.min(W, H) * 0.46;
    const Rinner = Router * 0.34;
    const labelR = Router + 56;  // labels pushed further out

    // group by family in adjacency order
    const famByName = {};
    deities.forEach(d => {
      const f = d.family || 'Other';
      if (!famByName[f]) famByName[f] = { name: f, members: [], color: d.family_color || '#7a8090' };
      famByName[f].members.push(d);
    });
    const ringOrder = FAMILIES.map(f => f.name).filter(n => famByName[n]);
    Object.keys(famByName).forEach(n => { if (!ringOrder.includes(n)) ringOrder.push(n); });

    // angular allocation with generous gap between wedges
    const GAP = 0.105;  // ~6.0° between wedges — wide visual gutter
    const totalGap = GAP * ringOrder.length;
    const totalArc = 2 * Math.PI - totalGap;
    // Minimum-weight floor so tiny families (Christian, Celtic with 1–2 deities) still get a visible wedge.
    const weights = ringOrder.map(n => Math.max(1.1, Math.sqrt(famByName[n].members.length)));
    const totalW = d3.sum(weights);
    let cursor = -Math.PI * 0.55;
    const wedges = {};
    ringOrder.forEach((name, i) => {
      const arcSize = totalArc * (weights[i] / totalW);
      wedges[name] = { a0: cursor, a1: cursor + arcSize, center: cursor + arcSize / 2, members: famByName[name].members };
      cursor += arcSize + GAP;
    });

    // anchor positions: 1, 2, or 3 concentric rows within each wedge depending on size
    deities.forEach(d => {
      const w = wedges[d.family || 'Other'];
      if (!w) return;
      const N = w.members.length;
      const idx = w.members.indexOf(d);
      const wedgePad = Math.min(0.05, (w.a1 - w.a0) * 0.12);
      const aSpan = (w.a1 - w.a0) - wedgePad * 2;
      const rowCount = N <= 4 ? 1 : N <= 9 ? 2 : 3;
      const row = idx % rowCount;
      const indexInRow = Math.floor(idx / rowCount);
      // count members in this row exactly
      const inThisRow = Math.ceil((N - row) / rowCount);
      const tA = inThisRow > 1 ? (indexInRow / (inThisRow - 1)) : 0.5;
      const a = w.a0 + wedgePad + aSpan * tA;
      // radial positions
      let r;
      if (rowCount === 1) r = (Rinner + Router) / 2;
      else if (rowCount === 2) r = row === 0 ? Router - 14 : Rinner + 14;
      else r = row === 0 ? Router - 8 : row === 1 ? (Rinner + Router) / 2 : Rinner + 8;
      // tiny deterministic jitter so it doesn't look mechanical
      r += ((hashStr(d.id) % 10) - 5);
      const [ax, ay] = polarXY(a, r);
      d._ax = cx + ax; d._ay = cy + ay;
      d.x = d._ax; d.y = d._ay;
    });

    const hubs = computeHubSet(deities);

    // Pantheon mode selector — was 3 toggle buttons (deities | authors | symbols), now a
    // dropdown supporting 6 modes per user request: + EVENTS (important events), + SCRIPTURE
    // (shortcut to the Scripture view), + MONUMENTS (sites / temples / churches — placeholder
    // until that node type lands in the vault). The dropdown form scales — more modes can be
    // added without crowding the toolbar.
    document.getElementById('view-controls').innerHTML = `
      <select class="btn btn-mini pantheon-mode-select" id="pantheon-mode-select" title="What the wedges show">
        <option value="deities"   ${mode === 'deities'   ? 'selected' : ''}>◯ Deities</option>
        <option value="authors"   ${mode === 'authors'   ? 'selected' : ''}>✎ Authors</option>
        <option value="symbols"   ${mode === 'symbols'   ? 'selected' : ''}>✦ Symbols</option>
        <option value="events"    ${mode === 'events'    ? 'selected' : ''}>★ Events</option>
        <option value="scripture" ${mode === 'scripture' ? 'selected' : ''}>✠ Scripture →</option>
        ${FEATURES.pantheonMonuments ? `<option value="monuments" ${mode === 'monuments' ? 'selected' : ''}>⛬ Monuments</option>` : ''}
      </select>
      <button class="btn btn-mini" id="btn-labels">labels: hub</button>
      <button class="btn btn-mini active" id="btn-hulls">hulls</button>
      <button class="btn btn-mini" id="btn-ego">ego focus</button>
      <button class="btn btn-mini" id="btn-view-in-timeline" style="display:none">view in timeline →</button>
      <button class="btn btn-mini" id="btn-recenter">recenter</button>
    `;
    document.getElementById('pantheon-mode-select').onchange = (ev) => {
      const next = ev.target.value;
      // 'scripture' is a shortcut — the Scripture view already exists as its own top-level
      // map. Jumping straight to it keeps users' mental model simple.
      if (next === 'scripture') { setView('scripture'); return; }
      if (STATE.pantheonMode === next) return;
      STATE.pantheonMode = next;
      setView('pantheon');
    };

    const legendStartCollapsed = (() => { try { return localStorage.getItem('legend-collapsed') === '1'; } catch (e) { return false; } })();
    // Sticky-head pattern: legend-head doesn't scroll (toggle always reachable);
    // legend-body scrolls independently. Fixes the prior scroll-hides-burger bug.
    legend.style('display', 'block')
      .classed('collapsed', legendStartCollapsed)
      .html(
        '<div class="legend-head">' +
          '<div class="ltitle">Families · click to filter</div>' +
          '<button class="legend-burger" id="legend-burger" title="Collapse families">≡</button>' +
        '</div>' +
        '<div class="legend-body">' +
          ringOrder.map(name => {
            const f = famByName[name];
            return `<div class="lrow${STATE.filter.family === name ? ' active' : ''}" data-family="${name}">
              <span class="lswatch" style="background:${f.color}"></span>
              <span>${name}</span>
              <span class="lcount">${f.members.length}</span>
            </div>`;
          }).join('') +
        '</div>'
      );
    legend.selectAll('.lrow').on('click', function (ev) {
      const name = this.dataset.family;
      STATE.filter.family = (STATE.filter.family === name) ? '' : name;
      document.getElementById('filter-family').value = STATE.filter.family;
      applyVisualFamilyFilter();
      if (typeof updateResetButton === 'function') updateResetButton();
    });
    // Hover-preview: while pointer is on a legend row (and no filter is locked),
    // ghost-highlight that family on the canvas. Mouseleave reverts.
    legend.selectAll('.lrow')
      .on('mouseenter', function () {
        if (STATE.filter.family) return;   // a real filter is already locked → no preview interference
        const fam = this.dataset.family;
        nodeSel.select('.node-circle').classed('preview-fade', d => (d.family || 'Other') !== fam);
        labelSel.classed('preview-fade', d => (d.family || 'Other') !== fam);
        hullSel.classed('preview-fade', name => name !== fam);
        famLabelSel.classed('preview-fade', name => name !== fam);
      })
      .on('mouseleave', function () {
        if (STATE.filter.family) return;
        nodeSel.select('.node-circle').classed('preview-fade', false);
        labelSel.classed('preview-fade', false);
        hullSel.classed('preview-fade', false);
        famLabelSel.classed('preview-fade', false);
      });
    document.getElementById('legend-burger').addEventListener('click', (ev) => {
      ev.stopPropagation();
      const node = legend.node();
      const willCollapse = !node.classList.contains('collapsed');
      node.classList.toggle('collapsed', willCollapse);
      try { localStorage.setItem('legend-collapsed', willCollapse ? '1' : '0'); } catch (e) {}
    });

    const deityIds = new Set(deities.map(d => d.id));
    const links = EDGES
      .filter(e => deityIds.has(e.source) && deityIds.has(e.target))
      .map(e => ({ source: e.source, target: e.target, type: e.type }));

    const g = svg.append('g');
    let currentK = 1;
    const zoom = d3.zoom().scaleExtent([0.35, 4.5]).on('zoom', (ev) => {
      g.attr('transform', ev.transform);
      currentK = ev.transform.k;
      updateLOD(currentK);
      updateZoomMeter(currentK);
    });
    svg.call(zoom);

    // Zoom meter wiring (pantheon-scoped). Buttons step by 1.4× and the baseline returns to identity.
    function updateZoomMeter(k) {
      const ro = document.getElementById('zm-readout');
      if (ro) ro.textContent = k.toFixed(2) + '×';
      const baseline = document.getElementById('zm-reset');
      if (baseline) baseline.style.color = Math.abs(k - 1) < 0.02 ? 'var(--gold)' : 'var(--gold-soft)';
    }
    document.getElementById('zm-in').onclick = () => svg.transition().duration(220).call(zoom.scaleBy, 1.4);
    document.getElementById('zm-out').onclick = () => svg.transition().duration(220).call(zoom.scaleBy, 1 / 1.4);
    document.getElementById('zm-reset').onclick = () => svg.transition().duration(380).call(zoom.transform, d3.zoomIdentity);
    updateZoomMeter(1);

    // SECTOR HULLS
    const sectorArc = d3.arc()
      .innerRadius(Rinner - 22)
      .outerRadius(Router + 22)
      .padAngle(0.014)
      .cornerRadius(8);
    let hullsOn = true;
    const hullGroup = g.append('g').attr('class', 'hull-layer').attr('transform', `translate(${cx},${cy})`);
    const hullSel = hullGroup.selectAll('path.sector-hull')
      .data(ringOrder, n => n).enter().append('path')
      .attr('class', 'sector-hull')
      .attr('d', name => sectorArc({ startAngle: wedges[name].a0, endAngle: wedges[name].a1 }))
      .attr('fill', name => famByName[name].color)
      .attr('stroke', name => famByName[name].color);

    // FAMILY LABELS — HORIZONTAL, anchored on each wedge's pie axis at a consistent radius.
    // To make label-to-wedge ownership unambiguous when wedges are narrow, a short radial
    // tick is drawn from the outer hull edge to the label baseline. Font size scales with
    // wedge angular size so small wedges get small labels that won't overlap neighbors.
    const famLabelG = g.append('g').attr('class', 'family-label-layer');

    // Leader-line tick: thin radial segment from just outside the hull to just inside the label.
    famLabelG.selectAll('line.family-tick').data(ringOrder, n => n).enter().append('line')
      .attr('class', 'family-tick')
      .attr('x1', name => cx + polarXY(wedges[name].center, Router + 6)[0])
      .attr('y1', name => cy + polarXY(wedges[name].center, Router + 6)[1])
      .attr('x2', name => cx + polarXY(wedges[name].center, Router + 38)[0])
      .attr('y2', name => cy + polarXY(wedges[name].center, Router + 38)[1])
      .attr('stroke', name => famByName[name].color)
      .attr('stroke-width', 0.8)
      .attr('stroke-opacity', 0.45);

    function familyLabelFontSize(name) {
      // narrower wedge → smaller label. arc in radians.
      const arc = wedges[name].a1 - wedges[name].a0;
      // arc of 0.5 rad (~28°, big family) → 13.5px; arc of 0.06 rad (~3.5°, tiny family) → 9px floor
      return Math.max(9, Math.min(14, 8 + arc * 11));
    }

    const famLabelSel = famLabelG.selectAll('text.family-label')
      .data(ringOrder, n => n).enter().append('text')
      .attr('class', name => 'family-label' + (famByName[name].members.length >= 6 ? ' bright' : ''))
      .attr('text-anchor', name => {
        const a = wedges[name].center;
        const dx = Math.sin(a);
        if (dx >  0.35) return 'start';
        if (dx < -0.35) return 'end';
        return 'middle';
      })
      .attr('dy', name => {
        const a = wedges[name].center;
        const dy = -Math.cos(a);
        if (dy < -0.55) return '0em';      // top — baseline above text
        if (dy >  0.55) return '0.85em';   // bottom — baseline below text
        return '0.35em';                    // sides — vertical centre
      })
      .attr('x', name => cx + polarXY(wedges[name].center, labelR)[0])
      .attr('y', name => cy + polarXY(wedges[name].center, labelR)[1])
      .style('font-size', name => familyLabelFontSize(name) + 'px')
      .text(name => name);

    // EDGE LAYER — curved paths pulled toward centre to reduce chord-spaghetti
    function pantheonEdgePath(d) {
      const s = d.source, t = d.target;
      const sx = s.x, sy = s.y, tx = t.x, ty = t.y;
      const mx = (sx + tx) / 2, my = (sy + ty) / 2;
      const k = 0.35;  // strength of pull toward centre
      const cxp = mx + (cx - mx) * k, cyp = my + (cy - my) * k;
      return `M ${sx},${sy} Q ${cxp},${cyp} ${tx},${ty}`;
    }

    // In symbols mode, identify cross-symbol-edge types so we can mark them with an extra
    // CSS class for prominent rendering. Cross-FAMILY edges (where source.family !==
    // target.family AND the edge is one of our cross-symbol types) are the user's
    // "MASSIVE wins" — the ankh→coptic-cross, swastika-polemic-inversion graphic.
    const linkSel = g.append('g').attr('class', 'edge-layer').selectAll('path')
      .data(links).enter().append('path')
      .attr('class', d => {
        let cls = 'edge-line';
        if (mode === 'symbols' && SYMBOL_CROSS_EDGE_TYPES.has(d.type)) {
          cls += ' xsym';
          const s = NODES_BY_ID[d.source], t = NODES_BY_ID[d.target];
          if (s && t && (s.family || 'Other') !== (t.family || 'Other')) cls += ' xsym-xfamily';
        }
        return cls;
      })
      .each(function (d) {
        const st = edgeStyle(d.type);
        // Thin lines everywhere by default — color carries the semantic distinction (gold
        // for transmission, red for polemic-inversion, blue for shared milieu, grey for
        // weakest visual-cognate). Highlighting is handled by .edge-line.hot in CSS (1.6px).
        // The previous "cross-family symbol edges get force-bumped to ≥1.4px" behavior was
        // overwhelming once symbols mode had its full 32 nodes; removed in favor of the
        // .xsym-xfamily CSS class which adds a subtle gold drop-shadow without thickening.
        // Stash the type color as a CSS variable on the element. The actual stroke color
        // is set in CSS — default state shows a quiet slate-blue, .hot state pulls the
        // type-color from the var. This keeps the default canvas calm (no orange/red in
        // unlit state) while preserving per-type color on hover/selection.
        d3.select(this)
          .style('--edge-type-color', st.c)
          .attr('stroke-width', st.w)
          .attr('stroke-opacity', st.op)
          .attr('fill', 'none');
      });

    // NODE + LABEL LAYERS — split so every label is drawn AFTER every circle.
    // This guarantees a node's name is never covered by another node's bubble (SVG sibling order = paint order).
    const nodeLayer  = g.append('g').attr('class', 'node-layer');
    const labelLayer = g.append('g').attr('class', 'label-layer');
    const nodeSel = nodeLayer.selectAll('g.node')
      .data(deities, d => d.id).enter().append('g').attr('class', 'node')
      .call(d3.drag()
        .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }))
      .on('mouseenter', function (ev, d) {
        showTooltip(`${tooltipThumb(d)}<div class="ttitle">${d.title}</div>
          <div class="tmeta">${d.family || '—'} · ${d.tradition || ''}</div>
          <div class="tmeta">${DEGREE.get(d.id) || 0} connections${d.geo ? ' · ' + d.geo.label : ''}</div>`, ev);
        setMapTarget(d);
        if (egoMode) return;
        hoverFocus(d.id);
      })
      .on('mousemove', (ev) => tooltip.style('left', (ev.clientX + 14) + 'px').style('top', (ev.clientY + 14) + 'px'))
      .on('mouseleave', () => { hideTooltip(); if (!egoMode) clearHoverFocus(); })
      .on('click', (ev, d) => {
        ev.stopPropagation();
        selectNode(d.id);
        if (egoMode) { setEgoFocus(d.id); return; }
        // Sticky / additive selection logic
        const nbrs = neighborsOf(d.id, 1);
        const cur = STATE.lockedSet;
        let touchesLock = false;
        if (cur.size > 0) {
          for (const id of nbrs) { if (cur.has(id)) { touchesLock = true; break; } }
        }
        if (cur.size === 0 || !touchesLock) {
          STATE.lockedSet = new Set(nbrs);     // reset to this node + its neighbors
        } else {
          nbrs.forEach(id => cur.add(id));      // additive: extend the locked subgraph
        }
        applyLock();
      });

    // Shape-per-type (deity = circle, person = diamond, event = star, theme = triangle, …).
    // We use <path> with d3.symbol() instead of <circle>, but keep the class .node-circle so
    // every existing CSS rule (hover, dim, filter-dim, hot, selected, preview-fade) still applies.
    nodeSel.append('path')
      .attr('class', 'node-circle')
      .attr('d', d => shapePath(d, 5 + Math.sqrt(DEGREE.get(d.id) || 0) * 1.8))
      .attr('fill', d => nodeColor(d))
      .attr('data-tier', d => d._tier ?? 'none');

    // Labels live in a sibling layer drawn AFTER the node layer. They never catch pointer events
    // (pointer-events: none in CSS), so hover/click still routes to the underlying circles.
    const labelSel = labelLayer.selectAll('text.node-label')
      .data(deities, d => d.id).enter().append('text')
      .attr('class', d => 'node-label' + (hubs.has(d.id) ? ' hub' : ''))
      .attr('dy', d => -(7 + Math.sqrt(DEGREE.get(d.id) || 0) * 1.8));
    // Two-line stacking for slashed double-names like "Enki / Ea", "Inanna / Ishtar", "Hermes / Thoth".
    // Single-name labels keep their full title (collision pruning still hides what doesn't fit).
    labelSel.each(function (d) {
      const sel = d3.select(this);
      const parts = d.title.split(/\s+\/\s+/);
      d._lineCount = (parts.length >= 2 && d.title.length < 32) ? 2 : 1;
      sel.text(null);   // clear any previous content
      if (d._lineCount === 2) {
        sel.append('tspan').attr('x', 0).text(parts[0]);
        sel.append('tspan').attr('x', 0).attr('dy', '1em').text(parts.slice(1).join(' / '));
      } else {
        sel.append('tspan').attr('x', 0).text(d.title);
      }
    });

    // FORCE SIMULATION — strong positional anchor + hard wedge clamp keeps families separated.
    const sim = d3.forceSimulation(deities)
      .alphaDecay(0.05)
      .force('link', d3.forceLink(links).id(d => d.id).distance(95).strength(0.02))
      .force('charge', d3.forceManyBody().strength(-22).distanceMax(140))
      .force('x', d3.forceX(d => d._ax).strength(0.55))
      .force('y', d3.forceY(d => d._ay).strength(0.55))
      // Collide capped so high-degree hubs don't bulldoze siblings out of the wedge.
      .force('collide', d3.forceCollide().radius(d => Math.min(17, 9 + Math.sqrt(DEGREE.get(d.id) || 0) * 1.5)).iterations(2))
      .on('tick', tick)
      .on('end', () => deconflictNodeLabels());

    // Wedge clamp parameters — keep each node inside its family's angular sector and the radial annulus.
    const radialPadIn = 14, radialPadOut = 14;
    function tick() {
      // Hard clamp BEFORE drawing — angular: project node back inside [a0+padA, a1-padA]; radial: into [Rinner+pad, Router-pad].
      for (let i = 0; i < deities.length; i++) {
        const d = deities[i];
        const w = wedges[d.family || 'Other'];
        if (!w) continue;
        const dx = d.x - cx, dy = d.y - cy;
        let r = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        // polarXY convention: x = r*sin(a), y = -r*cos(a)  →  a = atan2(x, -y)
        let a = Math.atan2(dx, -dy);
        // Signed shortest delta from wedge center, in (-π, π]
        let delta = ((a - w.center + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const halfArc = (w.a1 - w.a0) / 2;
        const padA = Math.min(0.045, halfArc * 0.22);
        const maxDelta = Math.max(0, halfArc - padA);
        if (delta >  maxDelta) a = w.center + maxDelta;
        if (delta < -maxDelta) a = w.center - maxDelta;
        if (r < Rinner + radialPadIn)  r = Rinner + radialPadIn;
        if (r > Router - radialPadOut) r = Router - radialPadOut;
        d.x = cx + r * Math.sin(a);
        d.y = cy - r * Math.cos(a);
      }
      linkSel.attr('d', pantheonEdgePath);
      nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
      labelSel.attr('transform', d => `translate(${d.x},${d.y})`);
    }

    // Compute degree tiers ONCE per render — high-degree gods get larger labels.
    // Tier 0 (top 8%): major hubs — Yaldabaoth, Yahweh, Marduk, Zeus, etc.
    // Tier 1 (next 22%): well-connected secondary deities
    // Tier 2 (next 35%): typical deities
    // Tier 3 (rest): minor / peripheral
    const degVals = deities.map(d => DEGREE.get(d.id) || 0).sort((a, b) => b - a);
    const tierCutoffs = [
      degVals[Math.floor(degVals.length * 0.08)] || 0,
      degVals[Math.floor(degVals.length * 0.30)] || 0,
      degVals[Math.floor(degVals.length * 0.65)] || 0,
    ];
    function degreeTier(d) {
      const deg = DEGREE.get(d.id) || 0;
      if (deg >= tierCutoffs[0]) return 0;
      if (deg >= tierCutoffs[1]) return 1;
      if (deg >= tierCutoffs[2]) return 2;
      return 3;
    }
    // Per-tier font / circle sizing — smaller bubbles so labels read clearly.
    const TIER_FONT = [12, 10.5, 9, 8.5];
    const TIER_RADIUS = [8, 6, 4.5, 3.5];

    // Smoothstep helper — eases from 0 to 1 across [a, b], so labels fade rather than pop.
    function smoothstep(a, b, x) {
      const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    }

    function updateLOD(k) {
      const labelMode = currentLabelMode;
      const sizeScale = 1 / Math.pow(k, 0.7);          // gentler shrink → easier to click
      nodeSel.select('.node-circle')
        .attr('d', d => shapePath(d, TIER_RADIUS[degreeTier(d)] * sizeScale));
      labelSel
        .attr('dy', d => {
          const r = TIER_RADIUS[degreeTier(d)] * sizeScale;
          const base = TIER_FONT[degreeTier(d)];
          // Two-line labels need an extra line of vertical lift so both lines sit above the circle.
          return -(r + 4 + (d._lineCount === 2 ? base : 0));
        })
        .style('opacity', d => {
          if (labelMode === 'off') return 0;
          if (labelMode === 'all') return 1;
          // When a family filter is active, every label in THAT family is fully eligible
          // regardless of tier — collision pruning still applies so they don't overlap.
          // This is how mid-tier Sumerians like Apsu / Ereshkigal become visible: filter to Mesopotamian.
          const f = STATE.filter.family;
          if (f && (d.family || 'Other') === f) return 1;
          const t = degreeTier(d);
          // Tier 0 + 1 always full. Tier 2 fades in across k∈[1.30, 1.65]. Tier 3 across k∈[2.10, 2.55].
          if (t <= 1) return 1;
          if (t === 2) return smoothstep(1.30, 1.65, k);
          return smoothstep(2.10, 2.55, k);
        })
        // Font size: past 100% zoom the visible size grows gradually from 1.0× base at k=1
        // to 1.5× base at k=4, then locks. Below 100% it shrinks naturally with the SVG transform.
        //   growth(k) = 1 + 0.5 · clamp((k-1) / 3, 0, 1)
        //   font_size = base · growth(k) / max(1, k)
        //   visible   = font_size · k = base · growth(k)  (for k ≥ 1)
        .style('font-size', d => {
          const base = TIER_FONT[degreeTier(d)];
          const growth = 1 + 0.5 * Math.max(0, Math.min(1, (k - 1) / 3));
          const eff = Math.max(1, k);
          return (base * growth / eff).toFixed(2) + 'px';
        })
        .style('font-weight', d => degreeTier(d) <= 1 ? '600' : '400')
        .style('visibility', '');
      // Past 100% zoom, family labels grow gradually from 1.0× to 1.5× (locked at k≥4).
      const _famGrowth = 1 + 0.5 * Math.max(0, Math.min(1, (k - 1) / 3));
      const famZoomScale = _famGrowth / Math.max(1, k);
      famLabelSel
        .style('opacity', k < 3.5 ? 1 : 0.25)
        .style('font-size', name => (familyLabelFontSize(name) * famZoomScale).toFixed(2) + 'px');
      // Debounced collision pass — hides lower-degree labels that overlap higher-degree ones
      clearTimeout(updateLOD._t);
      updateLOD._t = setTimeout(deconflictNodeLabels, 80);
    }

    // NODE-LABEL DECONFLICTION: greedy claim by degree.
    // Visible labels are sorted high-degree first; each claims a bbox; later labels that
    // conflict are hidden (visibility:hidden, so they re-appear on hover via hover-reveal/CSS).
    function deconflictNodeLabels() {
      const items = [];
      labelSel.each(function (d) {
        const txt = this;
        const opa = parseFloat(txt.style.opacity || '1');
        if (opa <= 0.05) { txt.style.visibility = ''; return; }
        items.push({ d, txt, deg: DEGREE.get(d.id) || 0 });
      });
      // measure after the reset above
      items.forEach(it => { it.bb = it.txt.getBoundingClientRect(); });
      items.sort((a, b) => b.deg - a.deg);
      const claimed = [];
      const PAD = 2;
      items.forEach(it => {
        const bb = it.bb;
        if (!bb.width || !bb.height) { it.txt.style.visibility = ''; return; }
        const x0 = bb.left - PAD, x1 = bb.right + PAD;
        const y0 = bb.top - PAD, y1 = bb.bottom + PAD;
        const conflict = claimed.some(c => !(x1 < c.x0 || c.x1 < x0 || y1 < c.y0 || c.y1 < y0));
        if (conflict) {
          it.txt.style.visibility = 'hidden';
        } else {
          it.txt.style.visibility = '';
          claimed.push({ x0, x1, y0, y1 });
        }
      });
    }

    function hoverFocus(id) {
      const nbrs = neighborsOf(id, 1);
      const filterActive = !!STATE.filter.family;
      // Standard focus dimming (only when no filter is active)
      if (!filterActive) {
        nodeSel.select('.node-circle').classed('dim', d => !nbrs.has(d.id)).classed('hot', d => d.id === id);
        labelSel.classed('dim', d => !nbrs.has(d.id));
        linkSel.classed('dim', d => !(nbrs.has(d.source.id || d.source) && nbrs.has(d.target.id || d.target)))
               .classed('hot', d => (d.source.id || d.source) === id || (d.target.id || d.target) === id);
        hullSel.classed('dim', name => !famByName[name].members.some(m => nbrs.has(m.id)));
        famLabelSel.classed('dim', name => !famByName[name].members.some(m => nbrs.has(m.id)));
      } else {
        // Filter is active: don't fight filter-dim with .dim. Mark the hovered node hot,
        // and use .hover-reveal to override .filter-dim on the hovered node + its neighbors.
        nodeSel.select('.node-circle').classed('hot', d => d.id === id)
          .classed('hover-reveal', d => nbrs.has(d.id));
        labelSel.classed('hover-reveal', d => nbrs.has(d.id));
        linkSel.classed('hot', d => (d.source.id || d.source) === id || (d.target.id || d.target) === id)
               .classed('hover-reveal', d => (d.source.id || d.source) === id || (d.target.id || d.target) === id);
        // Reveal hulls / family labels of the families the hovered node connects to
        hullSel.classed('hover-reveal', name => famByName[name].members.some(m => nbrs.has(m.id)));
        famLabelSel.classed('hover-reveal', name => famByName[name].members.some(m => nbrs.has(m.id)));
      }
    }
    function clearHoverFocus() {
      // If user has locked a selection, revert to the locked state instead of full clear.
      if (STATE.lockedSet && STATE.lockedSet.size > 0) {
        applyLock();
        return;
      }
      nodeSel.select('.node-circle').classed('dim', false).classed('hot', false).classed('hover-reveal', false);
      labelSel.classed('dim', false).classed('hover-reveal', false);
      linkSel.classed('dim', false).classed('hot', false).classed('hover-reveal', false);
      hullSel.classed('dim', false).classed('hover-reveal', false);
      famLabelSel.classed('dim', false).classed('hover-reveal', false);
    }

    // "View in timeline" — surfaces only when a sticky selection is active. Snapshots the
    // current locked set as a cross-view filter and jumps to the timeline.
    const btnViewInTimeline = document.getElementById('btn-view-in-timeline');
    if (btnViewInTimeline) btnViewInTimeline.onclick = () => {
      if (!STATE.lockedSet || STATE.lockedSet.size === 0) return;
      STATE.crossViewFilter = new Set(STATE.lockedSet);
      setView('timeline');
    };
    function syncCrossViewBtn() {
      if (!btnViewInTimeline) return;
      const n = STATE.lockedSet ? STATE.lockedSet.size : 0;
      btnViewInTimeline.style.display = n > 0 ? '' : 'none';
      btnViewInTimeline.textContent = n > 0 ? `view ${n} in timeline →` : 'view in timeline →';
    }
    syncCrossViewBtn();   // initial state — reflects any preexisting lock when returning to this view

    // Sticky-lock highlighter: shows STATE.lockedSet as the persistent focus.
    function applyLock() {
      syncCrossViewBtn();
      const locked = STATE.lockedSet;
      if (!locked || locked.size === 0) {
        nodeSel.select('.node-circle').classed('dim', false).classed('hot', false);
        labelSel.classed('dim', false);
        linkSel.classed('dim', false).classed('hot', false);
        hullSel.classed('dim', false);
        famLabelSel.classed('dim', false);
        return;
      }
      nodeSel.select('.node-circle')
        .classed('dim', d => !locked.has(d.id))
        .classed('hot', d => locked.has(d.id));
      labelSel.classed('dim', d => !locked.has(d.id));
      linkSel
        .classed('dim', d => !(locked.has(d.source.id || d.source) && locked.has(d.target.id || d.target)))
        .classed('hot', d => locked.has(d.source.id || d.source) && locked.has(d.target.id || d.target));
      hullSel.classed('dim', name => !famByName[name].members.some(m => locked.has(m.id)));
      famLabelSel.classed('dim', name => !famByName[name].members.some(m => locked.has(m.id)));
    }

    // Visual family filter — keeps wedge layout, dims non-matching deities/edges
    function applyVisualFamilyFilter() {
      const fam = STATE.filter.family;
      legend.selectAll('.lrow').classed('active', function() { return this.dataset.family === fam; });
      if (!fam) {
        nodeSel.select('.node-circle').classed('filter-dim', false);
        labelSel.classed('filter-dim', false);
        linkSel.classed('filter-dim', false);
        hullSel.classed('filter-dim', false);
        famLabelSel.classed('filter-dim', false);
        return;
      }
      nodeSel.select('.node-circle').classed('filter-dim', d => (d.family || 'Other') !== fam);
      labelSel.classed('filter-dim', d => (d.family || 'Other') !== fam);
      linkSel.classed('filter-dim', d => {
        const s = (d.source && typeof d.source === 'object') ? d.source : (NODES_BY_ID[d.source] || {});
        const t = (d.target && typeof d.target === 'object') ? d.target : (NODES_BY_ID[d.target] || {});
        const sf = s.family || 'Other', tf = t.family || 'Other';
        return sf !== fam && tf !== fam;
      });
      hullSel.classed('filter-dim', name => name !== fam);
      famLabelSel.classed('filter-dim', name => name !== fam);
      // After filter changes, redo label collision pass — many labels are now hidden,
      // freeing space for the remaining ones to potentially show again.
      setTimeout(deconflictNodeLabels, 60);
    }
    // Expose so the global filter dropdown can call it without a full re-render
    window._pantheonApplyFamilyFilter = applyVisualFamilyFilter;

    let egoMode = false;
    function setEgoFocus(id) {
      STATE.focusId = id;
      const nbrs = neighborsOf(id, 1);
      nodeSel.style('display', d => nbrs.has(d.id) ? null : 'none');
      labelSel.style('display', d => nbrs.has(d.id) ? null : 'none');
      linkSel.style('display', d => (nbrs.has(d.source.id || d.source) && nbrs.has(d.target.id || d.target)) ? null : 'none');
      sim.alpha(0.3).restart();
    }
    function clearEgoFocus() {
      STATE.focusId = null;
      nodeSel.style('display', null);
      labelSel.style('display', null);
      linkSel.style('display', null);
      sim.alpha(0.25).restart();
    }

    let currentLabelMode = 'hub';
    document.getElementById('btn-labels').onclick = (ev) => {
      currentLabelMode = currentLabelMode === 'hub' ? 'all' : currentLabelMode === 'all' ? 'off' : 'hub';
      ev.target.textContent = 'labels: ' + currentLabelMode;
      updateLOD(1);
    };
    document.getElementById('btn-hulls').onclick = (ev) => {
      hullsOn = !hullsOn;
      ev.target.classList.toggle('active', hullsOn);
      hullSel.style('display', hullsOn ? null : 'none');
    };
    document.getElementById('btn-ego').onclick = (ev) => {
      egoMode = !egoMode;
      ev.target.classList.toggle('active', egoMode);
      if (!egoMode) clearEgoFocus();
      else if (STATE.selected) setEgoFocus(STATE.selected);
    };
    document.getElementById('btn-recenter').onclick = () => {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
      clearEgoFocus(); clearHoverFocus(); egoMode = false;
      document.getElementById('btn-ego').classList.remove('active');
    };
    svg.on('click', (ev) => {
      if (ev.target.tagName === 'svg' || ev.target === svg.node()) {
        if (egoMode) clearEgoFocus();
        // Click on empty space: clear sticky/additive lock
        if (STATE.lockedSet && STATE.lockedSet.size > 0) {
          STATE.lockedSet = new Set();
          applyLock();
        }
      }
    });

    updateLOD(1);
    // If a family filter is already set when entering the view, apply it visually now
    applyVisualFamilyFilter();
  }
};

// ============================================================
// DOCUMENTS — polar time-by-family
// angular = family wedge; radial = chronological (older → outer-→-newer toward inner)
// flipped: actually use older near center, newer outside, so newest texts at the rim
// ============================================================
VIEWS.documents = {
  title: 'Documents',
  subtitle: 'angular = tradition family · radial = time · older near centre',
  render() {
    const docs = DATA.nodes.filter(n => n.type === 'document' && typeof n.date_earliest === 'number' && matchesFilter(n));
    if (!docs.length) {
      svg.append('text').attr('x', '50%').attr('y', '50%')
        .attr('text-anchor', 'middle').attr('fill', 'var(--text-3)')
        .style('font-family', 'var(--serif)').style('font-size', '18px')
        .text('No documents match the current filter.');
      return;
    }
    const W = svg.node().clientWidth, H = svg.node().clientHeight;
    const cx = W / 2, cy = H / 2;
    const Router = Math.min(W, H) * 0.44;
    const Rinner = Router * 0.20;

    // time scale: square root for nicer distribution since ANE texts span huge range
    const minDate = -3100, maxDate = 700;
    const timeR = d3.scaleLinear().domain([minDate, maxDate]).range([Rinner, Router]);

    // angular allocation by family among docs
    const famByName = {};
    docs.forEach(d => {
      const f = d.family || 'Other';
      if (!famByName[f]) famByName[f] = { name: f, members: [], color: d.family_color || '#7a8090' };
      famByName[f].members.push(d);
    });
    const ringOrder = FAMILIES.map(f => f.name).filter(n => famByName[n]);
    Object.keys(famByName).forEach(n => { if (!ringOrder.includes(n)) ringOrder.push(n); });
    const GAP = 0.025;
    const totalGap = GAP * ringOrder.length;
    const totalArc = 2 * Math.PI - totalGap;
    const weights = ringOrder.map(n => Math.sqrt(famByName[n].members.length));
    const totalW = d3.sum(weights);
    let cursor = -Math.PI * 0.55;
    const wedges = {};
    ringOrder.forEach((name, i) => {
      const arcSize = totalArc * (weights[i] / totalW);
      wedges[name] = { a0: cursor, a1: cursor + arcSize, center: cursor + arcSize / 2, members: famByName[name].members };
      cursor += arcSize + GAP;
    });

    // anchor each doc at (familyWedgeCenter ± small spread, timeRadius)
    docs.forEach(d => {
      const w = wedges[d.family || 'Other'];
      if (!w) return;
      // angular: small jitter around wedge center, ordered by date within wedge
      const sortedMembers = [...w.members].sort((a,b) => a.date_earliest - b.date_earliest);
      const idx = sortedMembers.indexOf(d);
      const N = w.members.length;
      const wedgePad = Math.min(0.04, (w.a1 - w.a0) * 0.10);
      const aSpan = (w.a1 - w.a0) - wedgePad * 2;
      const t = N > 1 ? idx / (N - 1) : 0.5;
      const a = w.a0 + wedgePad + aSpan * t;
      const r = timeR(d.date_earliest);
      const [ax, ay] = polarXY(a, r);
      d._ax = cx + ax; d._ay = cy + ay; d.x = d._ax; d.y = d._ay;
    });

    document.getElementById('view-controls').innerHTML = `
      <button class="btn btn-mini" id="btn-doc-labels">labels: hub</button>
      <button class="btn btn-mini active" id="btn-doc-rings">phase rings</button>
      <button class="btn btn-mini" id="btn-doc-recenter">recenter</button>
    `;

    legend.style('display', 'block').html(
      '<div class="ltitle">Phases (rings)</div>' +
      `<div class="lrow"><span class="lswatch" style="background:#c25450"></span><span>P1 · ANE & Egypt</span><span class="lcount">−3100 to −1500</span></div>` +
      `<div class="lrow"><span class="lswatch" style="background:#e08a3a"></span><span>P2 · Axial Age</span><span class="lcount">−1500 to −500</span></div>` +
      `<div class="lrow"><span class="lswatch" style="background:#5a6cc4"></span><span>P3 · Hellenistic / 2nd Temple</span><span class="lcount">−500 to 100</span></div>` +
      `<div class="lrow"><span class="lswatch" style="background:#6b3a8a"></span><span>P4 · Late Antiquity</span><span class="lcount">100 to 700</span></div>`
    );

    const g = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.4, 4]).on('zoom', ev => { g.attr('transform', ev.transform); updateLOD(ev.transform.k); });
    svg.call(zoom);

    // PHASE RINGS at boundaries
    const phaseBoundaries = [-1500, -500, 100, 700];
    const phaseColors = ['#c25450', '#e08a3a', '#5a6cc4', '#6b3a8a'];
    let ringsOn = true;
    const ringG = g.append('g').attr('class', 'phase-rings');
    phaseBoundaries.forEach((d, i) => {
      ringG.append('circle').attr('class', 'phase-ring')
        .attr('cx', cx).attr('cy', cy).attr('r', timeR(d));
      ringG.append('text').attr('class', 'phase-ring-label')
        .attr('x', cx).attr('y', cy - timeR(d) - 4)
        .attr('text-anchor', 'middle')
        .text(d < 0 ? Math.abs(d) + ' BCE' : d + ' CE');
    });

    // family labels on outer rim — HORIZONTAL with smart text-anchor
    const famLabelG = g.append('g').attr('class', 'family-label-layer');
    famLabelG.selectAll('text.family-label')
      .data(ringOrder, n => n).enter().append('text')
      .attr('class', name => 'family-label' + (famByName[name].members.length >= 5 ? ' bright' : ''))
      .attr('text-anchor', name => {
        const a = wedges[name].center;
        const dx = Math.sin(a);
        if (dx >  0.35) return 'start';
        if (dx < -0.35) return 'end';
        return 'middle';
      })
      .attr('dy', name => {
        const a = wedges[name].center;
        const dy = -Math.cos(a);
        if (dy < -0.55) return '0em';
        if (dy >  0.55) return '0.85em';
        return '0.35em';
      })
      .attr('x', name => {
        const a = wedges[name].center;
        const [lx, ly] = polarXY(a, Router + 36);
        return cx + lx;
      })
      .attr('y', name => {
        const a = wedges[name].center;
        const [lx, ly] = polarXY(a, Router + 36);
        return cy + ly;
      })
      .text(name => name);

    // edges among docs + doc↔theme (theme nodes are positioned outside the wedges, in a faint cloud)
    const docIds = new Set(docs.map(d => d.id));
    const links = EDGES.filter(e => docIds.has(e.source) && docIds.has(e.target))
      .map(e => ({ source: e.source, target: e.target, type: e.type }));

    const linkSel = g.append('g').attr('class', 'edge-layer').selectAll('path')
      .data(links).enter().append('path').attr('class', 'edge-line')
      .each(function (d) {
        const st = edgeStyle(d.type);
        // Type color → CSS var. Default stroke = quiet blue in CSS; .hot pulls the var.
        d3.select(this).style('--edge-type-color', st.c)
          .attr('stroke-width', st.w).attr('stroke-opacity', st.op);
      });

    const hubs = computeHubSet(docs, 0.12);

    const nodeSel = g.append('g').attr('class', 'node-layer').selectAll('g.node')
      .data(docs, d => d.id).enter().append('g').attr('class', 'node')
      .call(d3.drag()
        .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.18).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }))
      .on('mouseenter', function (ev, d) {
        showTooltip(`${tooltipThumb(d)}<div class="ttitle">${d.title}</div>
          <div class="tmeta">${d.family || '—'} · ${fmtDateRange(d.date_earliest, d.date_latest)}</div>
          <div class="tmeta">${d.label || d.tradition || ''}</div>`, ev);
        hoverFocus(d.id);
      })
      .on('mousemove', (ev) => tooltip.style('left', (ev.clientX + 14) + 'px').style('top', (ev.clientY + 14) + 'px'))
      .on('mouseleave', () => { hideTooltip(); clearHoverFocus(); })
      .on('click', (ev, d) => selectNode(d.id));

    nodeSel.append('circle').attr('class', 'node-circle')
      .attr('r', d => 4 + Math.sqrt(DEGREE.get(d.id) || 0) * 1.5)
      .attr('fill', d => nodeColor(d))
      .attr('data-tier', d => d._tier ?? 'none');

    nodeSel.append('text').attr('class', d => 'node-label' + (hubs.has(d.id) ? ' hub' : ''))
      .attr('dy', d => -(6 + Math.sqrt(DEGREE.get(d.id) || 0) * 1.5))
      .text(d => d.title.length > 24 ? d.title.slice(0, 22) + '…' : d.title);

    // Bezier-curved edges — toward the center to evoke radial reading
    function curvedPath(d) {
      const s = d.source, t = d.target;
      const sx = s.x || s._ax, sy = s.y || s._ay;
      const tx = t.x || t._ax, ty = t.y || t._ay;
      const mx = (sx + tx) / 2, my = (sy + ty) / 2;
      // pull control point toward center for inner curve
      const k = 0.18;
      const cxp = mx + (cx - mx) * k, cyp = my + (cy - my) * k;
      return `M ${sx},${sy} Q ${cxp},${cyp} ${tx},${ty}`;
    }

    const sim = d3.forceSimulation(docs)
      .alphaDecay(0.06)
      .force('charge', d3.forceManyBody().strength(-14).distanceMax(80))
      .force('x', d3.forceX(d => d._ax).strength(0.55))
      .force('y', d3.forceY(d => d._ay).strength(0.55))
      .force('collide', d3.forceCollide().radius(d => 8 + Math.sqrt(DEGREE.get(d.id) || 0) * 1.5))
      .on('tick', tick);

    function tick() {
      linkSel.attr('d', curvedPath);
      nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
    }

    let currentLabelMode = 'hub';
    function updateLOD(k) {
      nodeSel.select('text.node-label').style('opacity', d => {
        if (currentLabelMode === 'off') return 0;
        if (currentLabelMode === 'all') return 1;
        if (k >= 1.5) return 1;
        return hubs.has(d.id) ? 1 : 0;
      }).style('font-size', () => {
        // Past 100% zoom, grow gradually from 1.0× to 1.5× by k=4, then lock.
        const growth = 1 + 0.5 * Math.max(0, Math.min(1, (k - 1) / 3));
        const eff = Math.max(1, k);
        return (10 * growth / eff).toFixed(2) + 'px';
      });
    }

    function hoverFocus(id) {
      const nbrs = neighborsOf(id, 1);
      nodeSel.select('.node-circle').classed('dim', d => !nbrs.has(d.id)).classed('hot', d => d.id === id);
      nodeSel.select('text').classed('dim', d => !nbrs.has(d.id));
      linkSel.classed('dim', d => !(nbrs.has(d.source.id || d.source) && nbrs.has(d.target.id || d.target)))
             .classed('hot', d => (d.source.id || d.source) === id || (d.target.id || d.target) === id);
    }
    function clearHoverFocus() {
      nodeSel.select('.node-circle').classed('dim', false).classed('hot', false);
      nodeSel.select('text').classed('dim', false);
      linkSel.classed('dim', false).classed('hot', false);
    }

    document.getElementById('btn-doc-labels').onclick = (ev) => {
      currentLabelMode = currentLabelMode === 'hub' ? 'all' : currentLabelMode === 'all' ? 'off' : 'hub';
      ev.target.textContent = 'labels: ' + currentLabelMode;
      updateLOD(1);
    };
    document.getElementById('btn-doc-rings').onclick = (ev) => {
      ringsOn = !ringsOn;
      ev.target.classList.toggle('active', ringsOn);
      ringG.style('display', ringsOn ? null : 'none');
    };
    document.getElementById('btn-doc-recenter').onclick = () => {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    };

    updateLOD(1);
  }
};

// ============================================================
// TIMELINE — drag-pan, wheel-zoom, grow-on-zoom for dots and labels
// ============================================================
VIEWS.timeline = {
  title: 'Timeline',
  // Subtitle intentionally empty per user request — header clutter removed.
  subtitle: '',
  render() {
    const datable = DATA.nodes.filter(n => {
      if (!(n.type === 'document' || n.type === 'event' || n.type === 'person')) return false;
      if (typeof n.date_earliest !== 'number') return false;
      if (STATE.crossViewFilter && !STATE.crossViewFilter.has(n.id)) return false;
      return matchesFilter(n);
    });
    if (!datable.length) {
      svg.append('text').attr('x', '50%').attr('y', '50%')
        .attr('text-anchor', 'middle').attr('fill', 'var(--text-3)')
        .style('font-family', 'var(--serif)').style('font-size', '18px')
        .text('No datable nodes match the filter.');
      return;
    }

    const W = svg.node().clientWidth, H = svg.node().clientHeight;
    // Tightened margins — events claim ~34px more vertical Y. Top dropped 60→50 (clears the
    // view-header text cleanly), bottom dropped 120→96 (still fits the mini overview + axis).
    const margin = { top: 50, right: 30, bottom: 96, left: 30 };
    const miniH = 56;

    const dates = datable.map(n => n.date_earliest);
    const realMin = Math.min(...dates) - 200;
    // Extend to at least 2050 so Phase 6/7 events have horizontal room
    const realMax = Math.max(...dates, 2050) + 50;

    // ---------- DATE COMPRESSION ----------
    // Gaps > 400 years between adjacent dated nodes get compressed to ~80 years of visual
    // space. A clear break marker is drawn at each compressed gap so the reader knows
    // time has been "cut". The underlying data still carries real years; only the X-axis
    // position is compressed.
    const COMPRESS_GAP_THRESHOLD = 600;   // only compress gaps > 600 years (was 400)
    const COMPRESSED_GAP_YEARS = 160;     // squished gap reads as 160 visual years (was 80) — keeps a clear break, less brutal
    function buildCompressor(allDates) {
      const sorted = [...new Set(allDates.filter(d => typeof d === 'number'))].sort((a, b) => a - b);
      const breaks = [];
      let cumulativeSavings = 0;
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i] - sorted[i - 1];
        if (gap > COMPRESS_GAP_THRESHOLD) {
          breaks.push({
            realStart: sorted[i - 1],
            realEnd: sorted[i],
            realSize: gap,
            cumBefore: cumulativeSavings,
            cumAfter: cumulativeSavings + (gap - COMPRESSED_GAP_YEARS),
          });
          cumulativeSavings += gap - COMPRESSED_GAP_YEARS;
        }
      }
      function compress(d) {
        for (let i = breaks.length - 1; i >= 0; i--) {
          const br = breaks[i];
          if (d >= br.realEnd) return d - br.cumAfter;
          if (d > br.realStart && d < br.realEnd) {
            const t = (d - br.realStart) / (br.realEnd - br.realStart);
            return br.realStart - br.cumBefore + t * COMPRESSED_GAP_YEARS;
          }
        }
        return d;
      }
      function decompress(c) {
        for (let i = breaks.length - 1; i >= 0; i--) {
          const br = breaks[i];
          const cStart = br.realStart - br.cumBefore;
          const cEnd = cStart + COMPRESSED_GAP_YEARS;
          if (c >= cEnd) return c + br.cumAfter;
          if (c >= cStart && c < cEnd) {
            const t = (c - cStart) / COMPRESSED_GAP_YEARS;
            return br.realStart + t * (br.realEnd - br.realStart);
          }
        }
        return c;
      }
      return { breaks, compress, decompress };
    }

    // Build the compressor from ALL date points we render — events, phase boundaries, era markers.
    // We'll define `eraMarkers` and `phases` next; the compressor uses them via the closure on rebuild.
    let compressor = buildCompressor(dates);

    // The scale operates on COMPRESSED date space. Helper wrappers below convert real years to pixels.
    const xMin = compressor.compress(realMin);
    const xMax = compressor.compress(realMax);
    const xFull = d3.scaleLinear().domain([xMin, xMax]).range([margin.left, W - margin.right]);
    let x = xFull.copy();
    let currentK = 1;

    // Apply compression: real-year → pixel-x using the current zoom scale `x`.
    function xc(realDate)      { return x(compressor.compress(realDate)); }
    function xcFull(realDate)  { return xFull(compressor.compress(realDate)); }

    // Families present in the current data — populates the inline filter dropdown.
    const _famsHere = Array.from(new Set(datable.map(n => n.family).filter(Boolean))).sort();
    const _crossOn = !!(STATE.crossViewFilter && STATE.crossViewFilter.size);
    document.getElementById('view-controls').innerHTML = `
      ${_crossOn ? `<button class="btn btn-mini active" id="btn-tl-clear-cross" title="Drop the cross-view filter from the pantheon and show all datable nodes">↺ reset view (${STATE.crossViewFilter.size})</button>` : ''}
      <select class="btn btn-mini tl-family-select" id="tl-family-filter" title="Filter by family (also reflected in the footer dropdown)">
        <option value="">all families</option>
        ${_famsHere.map(f => `<option value="${f}"${STATE.filter.family === f ? ' selected' : ''}>${f}</option>`).join('')}
      </select>
      <button class="btn btn-mini" id="btn-tl-reset">reset zoom</button>
      <button class="btn btn-mini" id="btn-tl-fit">fit data</button>
    `;
    document.getElementById('tl-family-filter').onchange = (ev) => {
      STATE.filter.family = ev.target.value;
      document.getElementById('filter-family').value = STATE.filter.family;
      if (typeof updateResetButton === 'function') updateResetButton();
      setView('timeline');   // full re-render so datable + axis recompute against the new filter
    };
    if (_crossOn) {
      document.getElementById('btn-tl-clear-cross').onclick = () => {
        STATE.crossViewFilter = null;
        setView('timeline');
      };
    }

    const phases = [
      { label: 'Phase 1 · Ancient Near East & Egypt', a: -3100, b: -1500 },
      { label: 'Phase 2 · Axial Age',                  a: -1500, b: -500 },
      { label: 'Phase 3 · Hellenistic & 2nd Temple',   a: -500,  b: 100 },
      { label: 'Phase 4 · Late Antiquity',             a: 100,   b: 700 },
      { label: 'Phase 5 · Medieval',                   a: 700,   b: 1500 },
      { label: 'Phase 6 · Early Modern / Renaissance', a: 1500,  b: 1800 },
      { label: 'Phase 7 · Modern',                     a: 1800,  b: 2100 },
    ];
    // Secondary era markers — thin faded vertical lines for visual context at major turning points.
    // These complement the colored phase bands by marking key sub-period boundaries.
    const eraMarkers = [
      { x: -2000, label: 'Bronze Age' },
      { x: -1200, label: 'Iron Age / Bronze collapse' },
      { x: -539,  label: 'Cyrus · Persian period' },
      { x: -332,  label: 'Alexander · Hellenization' },
      { x: 70,    label: '2nd Temple destroyed' },
      { x: 325,   label: 'Nicaea' },
      { x: 622,   label: 'Hegira' },
      { x: 1054,  label: 'Great Schism' },
      { x: 1453,  label: 'Fall of Constantinople' },
      { x: 1517,  label: 'Reformation' },
      { x: 1789,  label: 'French Revolution' },
      { x: 1945,  label: 'Nag Hammadi' },
    ];

    // Rebuild the compressor now that we have phases + era markers in scope.
    // Include phase boundaries and era marker years as anchor points so they stay visible
    // even when they fall in otherwise-empty regions.
    compressor = buildCompressor(dates.concat(phases.flatMap(p => [p.a, p.b])).concat(eraMarkers.map(e => e.x)));
    // Reassign scale domains to the (possibly updated) compressed range.
    const xMinNew = compressor.compress(realMin);
    const xMaxNew = compressor.compress(realMax);
    xFull.domain([xMinNew, xMaxNew]);
    x = xFull.copy();

    const mainG = svg.append('g');
    // Chart-area background — a subtle slate-blue overlay so the timeline reads as a
    // "drawn surface" rather than the void-black canvas. Especially fixes the user's
    // complaint about the LEFT compression zone looking like a black gap. Sits beneath
    // bands / breaks / events.
    mainG.append('rect').attr('class', 'tl-chart-bg')
      .attr('x', margin.left).attr('y', margin.top - 30)
      .attr('width',  Math.max(0, W - margin.left - margin.right))
      .attr('height', H - margin.bottom - miniH - 24 - margin.top + 30);
    const bandG = mainG.append('g').attr('class', 'tl-bands');
    const breakG = mainG.append('g').attr('class', 'tl-breaks');
    const eventG = mainG.append('g').attr('class', 'tl-events');
    const axisG = mainG.append('g').attr('class', 'tl-axis');

    const miniY = H - miniH - 20;
    const miniG = svg.append('g').attr('class', 'tl-mini').attr('transform', `translate(0,${miniY})`);
    const miniBandG = miniG.append('g');
    const miniBreakG = miniG.append('g');
    const miniEventG = miniG.append('g');
    const miniAxisG = miniG.append('g');
    const miniBrushG = miniG.append('g').attr('class', 'tl-brush');

    // sc(realYear) returns pixel-x via the supplied scale, applying compression.
    function sc(scale, realDate) { return scale(compressor.compress(realDate)); }

    function drawCompressionBreaks(scale, group, height) {
      const sel = group.selectAll('g.tl-break').data(compressor.breaks);
      sel.exit().remove();
      const enter = sel.enter().append('g').attr('class', 'tl-break');
      enter.append('rect').attr('class', 'tl-break-fill');
      enter.append('path').attr('class', 'tl-break-zigzag');

      enter.merge(sel).each(function (d) {
        const cStart = d.realStart - d.cumBefore;
        const cEnd = cStart + COMPRESSED_GAP_YEARS;
        const xStart = scale(cStart);
        const xEnd = scale(cEnd);
        const midX = (xStart + xEnd) / 2;
        const w = xEnd - xStart;
        const sel = d3.select(this);
        // Compressed-gap zone gets a slightly darker fill than the chart background so the
        // cut reads as "time skipped" visually, not just a thin zigzag in empty space. The
        // chart-bg rect tints the surrounding area; this rect darkens the cut on top.
        sel.select('rect.tl-break-fill')
          .attr('x', xStart).attr('y', 0)
          .attr('width', w).attr('height', height);
        // Dark zigzag, slightly opaque — registers as a gap-marker without screaming.
        const N = Math.max(6, Math.floor(height / 14));
        const stepY = height / N;
        const halfW = Math.min(5, w / 3);
        let zig = `M ${midX - halfW},0 `;
        for (let i = 1; i <= N; i++) {
          zig += `L ${midX + (i % 2 === 0 ? -halfW : halfW)},${stepY * i} `;
        }
        sel.select('path.tl-break-zigzag')
          .attr('d', zig)
          .attr('stroke', 'rgba(0,0,0,0.55)')
          .attr('stroke-width', 1)
          .attr('stroke-opacity', 1)
          .attr('fill', 'none');
      });
      // Remove any pre-existing year-cut labels left over from older renders.
      group.selectAll('text.tl-break-label').remove();
    }

    function drawEraLines(scale, group, height) {
      // Phase boundary lines (major)
      const phaseBoundaries = [];
      phases.forEach((p, i) => {
        if (i > 0) phaseBoundaries.push(p.a);
      });
      const majorSel = group.selectAll('line.tl-era-line.major').data(phaseBoundaries);
      majorSel.exit().remove();
      majorSel.enter().append('line').attr('class', 'tl-era-line major')
        .merge(majorSel)
        .attr('x1', d => sc(scale, d)).attr('x2', d => sc(scale, d))
        .attr('y1', 0).attr('y2', height);

      // Sub-era markers (secondary, dashed)
      const minorSel = group.selectAll('line.tl-era-line.minor').data(eraMarkers);
      minorSel.exit().remove();
      minorSel.enter().append('line').attr('class', 'tl-era-line minor')
        .merge(minorSel)
        .attr('x1', d => sc(scale, d.x)).attr('x2', d => sc(scale, d.x))
        .attr('y1', 0).attr('y2', height);

      // Sub-era labels (tiny, near top, rotated 90°)
      const lbl = group.selectAll('text.tl-era-label').data(eraMarkers);
      lbl.exit().remove();
      lbl.enter().append('text').attr('class', 'tl-era-label')
        .merge(lbl)
        .attr('transform', d => `translate(${sc(scale, d.x) + 3}, 36) rotate(0)`)
        .text(d => d.label);
    }

    function drawBands(scale, group, height, withLabels) {
      const sel = group.selectAll('rect.tl-band').data(phases);
      sel.exit().remove();
      const enter = sel.enter().append('rect').attr('class', 'tl-band');
      enter.merge(sel)
        .attr('x', d => sc(scale, d.a)).attr('y', 0)
        .attr('width', d => Math.max(1, sc(scale, d.b) - sc(scale, d.a)))
        .attr('height', height)
        // Bands are now fully transparent — phase BOUNDARY lines from drawEraLines provide the
        // only visual separation. Previously a 1.5%-white fill was applied per phase, but phases
        // only cover -3100 to 2100, so prehistory events (e.g. -65000) sat on UN-BANDED canvas
        // which looked darker than the banded region. Removing the fill gives a truly uniform bg.
        .attr('fill', 'transparent');
      if (withLabels) {
        const lbl = group.selectAll('text.tl-band-label').data(phases);
        lbl.exit().remove();
        const lEnter = lbl.enter().append('text').attr('class', 'tl-band-label');
        lEnter.merge(lbl)
          .attr('x', d => (scale(d.a) + scale(d.b)) / 2)
          .attr('y', 18).attr('text-anchor', 'middle')
          .text(d => d.label);
      }
    }

    function drawEvents(scale, group, isMini) {
      const chartTop = margin.top - 30;
      const chartBottom = H - margin.bottom;
      const center = isMini ? (miniH / 2) : ((chartTop + chartBottom) / 2);
      const half = isMini ? (miniH / 2 - 4) : ((chartBottom - chartTop) / 2 - 16);

      // Dots and labels grow gently with zoom. Capped tightly so they don't crowd.
      const k = currentK;
      const dotR = isMini ? 1.6 : Math.min(5.5, 3.0 + (k - 1) * 0.20);
      const rowH = isMini ? 4 : 48;         // generous vertical spacing — labels need room
      // Past 100% zoom, grow gradually from 9.5px at k=1 to 14.25px at k=4 (1.5×), then lock.
      const _tlGrowth = 1 + 0.5 * Math.max(0, Math.min(1, (k - 1) / 3));
      const fontSize = isMini ? 0 : 9.5 * _tlGrowth;
      // Auto-cap rows by actually-available vertical space (don't waste rowMax slots that exceed `half`).
      const rowMax = isMini ? 6 : Math.max(6, Math.floor(half / rowH));

      const occupied = [];
      const placed = datable.map(d => ({ d, xi: sc(scale, d.date_earliest), yi: 0 }));
      // Pre-compute each event's approx label width — used so nodes whose LABELS would
      // collide get bumped to different rows even though their DOTS are far apart.
      // Average glyph ≈ 0.55 × font-size in sans-serif at this scale; pad for breathing room.
      const labelW = new Map();
      placed.forEach(p => {
        const w = isMini ? 8 : (p.d.title.length * fontSize * 0.55 + 18);
        labelW.set(p.d.id, w);
      });
      // Higher-degree first wins the center
      placed.sort((a, b) => (DEGREE.get(b.d.id) || 0) - (DEGREE.get(a.d.id) || 0));
      // Symmetric expanding rows around center: 0, +rowH, -rowH, +2·rowH, -2·rowH, …
      const rowOffsets = [0];
      for (let i = 1; i < rowMax; i++) { rowOffsets.push(+i * rowH); rowOffsets.push(-i * rowH); }
      placed.forEach(p => {
        let placedThis = false;
        const myW = labelW.get(p.d.id);
        for (const off of rowOffsets) {
          if (Math.abs(off) > half) continue;
          // Label-aware horizontal collision: two events on the same row need
          // (labelW(a) + labelW(b)) / 2 of horizontal pixels between them so their text doesn't overlap.
          const conflict = occupied.some(o => {
            const requiredDx = (myW + (o.w || 8)) / 2;
            return Math.abs(o.x - p.xi) < requiredDx && Math.abs(o.y - off) < rowH * 0.75;
          });
          if (!conflict) { p.yi = off; occupied.push({ x: p.xi, y: off, w: myW }); placedThis = true; break; }
        }
        if (!placedThis) p.yi = 0;
      });
      // restore date order for stable rendering
      placed.sort((a, b) => a.xi - b.xi);

      // Two stable sub-groups so labels always paint on top of bubbles (SVG sibling-order = paint-order).
      let bubblesG = group.select('g.tl-bubbles');
      let labelsG  = group.select('g.tl-labels');
      if (bubblesG.empty()) bubblesG = group.append('g').attr('class', 'tl-bubbles');
      if (labelsG.empty())  labelsG  = group.append('g').attr('class', 'tl-labels');
      // Ensure labelsG always sits after bubblesG in DOM order, even if a re-render reordered them.
      labelsG.raise();

      const bubbleSel = bubblesG.selectAll('g.tl-event').data(placed, p => p.d.id);
      bubbleSel.exit().remove();
      const bEnter = bubbleSel.enter().append('g').attr('class', 'tl-event');
      bEnter.append('line').attr('class', 'tl-stem').attr('stroke-width', 0.5).attr('stroke-opacity', 0.45);
      // Main pass uses per-type SVG paths (document = square, person = squared-diamond
      // via symbolSquare2, event = star). Mini overview uses tiny circles — at
      // dotR ≈ 1.6px shapes don't read, so a uniform circle is cleaner there.
      if (isMini) {
        bEnter.append('circle').attr('class', 'tl-event-dot')
          .attr('data-tier', p => p.d._tier ?? 'none');
      } else {
        bEnter.append('path').attr('class', 'tl-event-shape')
          .attr('data-tier', p => p.d._tier ?? 'none');
      }
      bEnter.on('click', (ev, p) => {
              // stopPropagation: keep the click from bubbling to the SVG-level
              // empty-click handler (which would otherwise immediately close the
              // detail panel that selectNode just opened). Matches Pantheon's pattern.
              ev.stopPropagation();
              selectNode(p.d.id);
            })
            .on('mouseenter', (ev, p) => {
              showTooltip(
                `${tooltipThumb(p.d)}<div class="ttitle">${p.d.title}</div>
                 <div class="tmeta">${p.d.family || '—'} · ${fmtDateRange(p.d.date_earliest, p.d.date_latest)}</div>
                 <div class="tmeta">${p.d.type}${p.d.status ? ' · ' + p.d.status : ''}${p.d.geo ? ' · ' + p.d.geo.label : ''}</div>`, ev);
              setMapTarget(p.d);   // hover an event → world-map thumb pulses on its geo location
            })
            .on('mousemove', (ev) => tooltip.style('left', (ev.clientX + 14) + 'px').style('top', (ev.clientY + 14) + 'px'))
            .on('mouseleave', hideTooltip);

      const bMerged = bEnter.merge(bubbleSel).attr('transform', p => `translate(${p.xi}, ${center + p.yi})`);
      bMerged.select('line.tl-stem')
        .attr('y1', p => -p.yi).attr('y2', 0)
        .attr('stroke', p => nodeColor(p.d));
      if (isMini) {
        bMerged.select('circle.tl-event-dot')
          .attr('r', dotR)
          .attr('fill', p => nodeColor(p.d))
          .attr('stroke', 'rgba(255,255,255,0.14)').attr('stroke-width', 0.6);
      } else {
        // shapePath() pulls the per-type d3 symbol (defined in shapeFor() at top of file).
        // dotR governs the visual radius; shapeSizeFor() converts to d3.symbol().size()'s
        // bounding-box-area units per shape.
        bMerged.select('path.tl-event-shape')
          .attr('d', p => shapePath(p.d, dotR))
          .attr('fill', p => nodeColor(p.d))
          .attr('stroke', 'rgba(255,255,255,0.14)').attr('stroke-width', 0.8);
      }

      if (!isMini) {
        const labelDataSel = labelsG.selectAll('text.tl-event-label').data(placed, p => p.d.id);
        labelDataSel.exit().remove();
        const lEnter = labelDataSel.enter().append('text').attr('class', 'tl-event-label').attr('text-anchor', 'middle');
        const labels = lEnter.merge(labelDataSel)
          .attr('transform', p => `translate(${p.xi}, ${center + p.yi})`);
        // Full titles — no ellipsis truncation. Labels that don't fit get hidden entirely.
        labels.style('font-size', fontSize + 'px')
          .attr('dy', p => p.yi < 0 ? -(dotR + 5) : (dotR + fontSize + 1))
          .text(p => p.d.title);

        // Degree-tier thresholds: only the top tier shows at default zoom (k=1).
        // Lower tiers fade in as the user zooms in.
        //   tier 0 (top 8%): always visible
        //   tier 1 (next 22%): visible from k ≥ 1.30
        //   tier 2 (next 35%): visible from k ≥ 1.85
        //   tier 3 (rest):     visible from k ≥ 2.55
        const degVals = placed.map(p => DEGREE.get(p.d.id) || 0).sort((a, b) => b - a);
        const cut0 = degVals[Math.floor(degVals.length * 0.08)] || 0;
        const cut1 = degVals[Math.floor(degVals.length * 0.30)] || 0;
        const cut2 = degVals[Math.floor(degVals.length * 0.65)] || 0;
        function tierOf(deg) {
          if (deg >= cut0) return 0;
          if (deg >= cut1) return 1;
          if (deg >= cut2) return 2;
          return 3;
        }
        function tierVisible(t, k) {
          if (t === 0) return true;
          if (t === 1) return k >= 1.30;
          if (t === 2) return k >= 1.85;
          return k >= 2.55;
        }
        // First pass: gate by tier × zoom. Uses class-based .tl-hidden (opacity fade)
        // instead of display:none so the transition in app.css can animate the
        // tier-in / tier-out visual smoothly with zoom.
        labels.classed('tl-hidden', p => !tierVisible(tierOf(DEGREE.get(p.d.id) || 0), k));

        // Second pass: greedy fit-by-width. Higher-degree labels win placement.
        const visible = [];
        labels.each(function (p) {
          if (this.classList.contains('tl-hidden')) return;
          // Approximate text width (avg glyph ≈ 0.55 × font-size for sans-serif at this scale).
          const w = p.d.title.length * (fontSize * 0.55);
          visible.push({ p, w, el: this });
        });
        visible.sort((a, b) => (DEGREE.get(b.p.d.id) || 0) - (DEGREE.get(a.p.d.id) || 0));
        const claimed = [];
        visible.forEach(m => {
          const xi = m.p.xi;
          const y = (m.p.yi < 0 ? m.p.yi - (dotR + 5) : m.p.yi + (dotR + fontSize + 1));
          const x0 = xi - m.w / 2, x1 = xi + m.w / 2;
          // If the FULL title doesn't fit without overlapping a higher-priority label, hide
          // it via .tl-hidden (smooth fade-out). No ellipsis cropping.
          const conflict = claimed.some(c => Math.abs(c.y - y) < fontSize + 3 && !(x1 < c.x0 - 4 || x0 > c.x1 + 4));
          if (conflict) m.el.classList.add('tl-hidden');
          else claimed.push({ x0, x1, y });
        });
      }
    }

    // Real-year tick generator: returns nice round REAL years within [realMin, realMax].
    // The values are then compressed for X-positioning, but the labels show real years.
    function generateRealTicks(realLo, realHi) {
      const range = realHi - realLo;
      let step;
      if (range > 4000) step = 500;
      else if (range > 2000) step = 250;
      else if (range > 1000) step = 100;
      else if (range > 400) step = 50;
      else if (range > 200) step = 25;
      else step = 10;
      const ticks = [];
      const start = Math.ceil(realLo / step) * step;
      for (let v = start; v <= realHi; v += step) {
        if (v !== 0) ticks.push(v);   // year 0 doesn't exist in BC/AD
      }
      return ticks;
    }

    function makeCompressedAxis(scale, realLo, realHi, maxTicks) {
      const realTicks = generateRealTicks(realLo, realHi);
      // Drop ticks that fall STRICTLY INSIDE a compressed gap — those years aren't visible
      // on the axis and rendering them stacks garbled labels in the cut zone.
      const insideAnyCut = (yr) => compressor.breaks.some(br => yr > br.realStart && yr < br.realEnd);
      const candidate = realTicks.filter(yr => !insideAnyCut(yr));

      // Boundary years (just before + just after each cut) are mandatory anchors — they
      // flank the zigzag so the reader has explicit dates on each side. Mark them protected.
      const protected_ = new Set();
      compressor.breaks.forEach(br => { protected_.add(br.realStart); protected_.add(br.realEnd); });
      const all = Array.from(new Set(candidate.concat(Array.from(protected_)))).sort((a, b) => a - b);

      // Pixel-collision filter — guarantees no two labels overlap. Each label needs
      // MIN_TICK_GAP_PX of horizontal room. Protected boundary years are kept first;
      // remaining ticks are added greedily in priority order (round-most-first), and
      // any tick whose pixel position lands too close to an already-claimed one is dropped.
      const MIN_TICK_GAP_PX = 64;

      function tickPriority(yr) {
        // Lower number = higher priority. Protected boundaries win first, then nice round years.
        if (protected_.has(yr)) return -1;
        const a = Math.abs(yr);
        if (a % 5000 === 0) return 0;
        if (a % 1000 === 0) return 1;
        if (a % 500 === 0)  return 2;
        if (a % 100 === 0)  return 3;
        if (a % 50 === 0)   return 4;
        if (a % 25 === 0)   return 5;
        if (a % 10 === 0)   return 6;
        return 7;
      }
      const ranked = all.slice().sort((a, b) => {
        const dp = tickPriority(a) - tickPriority(b);
        return dp !== 0 ? dp : a - b;
      });

      const claimedPx = [];
      const kept = [];
      ranked.forEach(yr => {
        const px = scale(compressor.compress(yr));
        if (claimedPx.some(c => Math.abs(c - px) < MIN_TICK_GAP_PX)) return;
        claimedPx.push(px);
        kept.push(yr);
      });
      kept.sort((a, b) => a - b);

      const compressedTicks = kept.map(compressor.compress);
      return d3.axisBottom(scale)
        .tickValues(compressedTicks)
        .tickFormat((v, i) => {
          const real = kept[i];
          return real < 0 ? Math.abs(real) + ' BCE' : real + ' CE';
        });
    }

    function redraw() {
      const mainBandH = H - margin.bottom - miniH - 24 - margin.top + 30;
      drawBands(x, bandG, mainBandH, true);
      bandG.attr('transform', `translate(0,${margin.top - 30})`);
      drawEraLines(x, bandG, mainBandH);
      drawCompressionBreaks(x, breakG, mainBandH);
      breakG.attr('transform', `translate(0,${margin.top - 30})`);
      drawEvents(x, eventG, false);
      // DYNAMIC date resolution: when zoomed in, the visible real-year range is smaller,
      // so generateRealTicks selects a finer step (50 yr or 25 yr or even 10 yr). When
      // zoomed out, coarse 500-year steps. Resolution increases automatically with zoom.
      const dom = x.domain();
      const visibleLo = compressor.decompress(dom[0]);
      const visibleHi = compressor.decompress(dom[1]);
      const axis = makeCompressedAxis(x, visibleLo, visibleHi, Math.max(6, Math.floor(W / 95)));
      axisG.attr('transform', `translate(0,${H - margin.bottom - miniH - 24})`).call(axis);

      drawBands(xFull, miniBandG, miniH, false);
      drawCompressionBreaks(xFull, miniBreakG, miniH);
      drawEvents(xFull, miniEventG, true);
      const miniAxis = makeCompressedAxis(xFull, realMin, realMax, 8);
      miniAxisG.attr('transform', `translate(0, ${miniH + 2})`).call(miniAxis);
    }

    const brush = d3.brushX()
      .extent([[margin.left, 0], [W - margin.right, miniH]])
      .on('brush end', (ev) => {
        if (!ev.selection) { x = xFull.copy(); }
        else {
          const [x0, x1] = ev.selection;
          x = d3.scaleLinear().domain([xFull.invert(x0), xFull.invert(x1)]).range([margin.left, W - margin.right]);
        }
        const fullDom = xFull.domain();
        const curDom = x.domain();
        currentK = (fullDom[1] - fullDom[0]) / (curDom[1] - curDom[0]);
        redraw();
      });
    miniBrushG.call(brush);

    // SMOOTH ZOOM — drives the brush via rAF so wheel zoom + zoom-meter buttons animate
    // toward their target instead of jumping. Each rAF tick reassigns the brush selection,
    // which fires the brush handler (above), which reassigns x and redraws. ~220ms ease-out-cubic
    // feels responsive but visibly smooth. cancels any in-flight animation so rapid wheel
    // events chain without queuing — `start` is always the CURRENT (interpolated) domain.
    let _zoomRAF = null;
    function smoothZoomTo(loTarget, hiTarget, ms) {
      if (_zoomRAF) cancelAnimationFrame(_zoomRAF);
      ms = ms == null ? 220 : ms;
      const startDom = x.domain();
      const t0 = performance.now();
      function tick(now) {
        const u = Math.min(1, (now - t0) / ms);
        const e = 1 - Math.pow(1 - u, 3);   // ease-out-cubic
        const lo = startDom[0] + (loTarget - startDom[0]) * e;
        const hi = startDom[1] + (hiTarget - startDom[1]) * e;
        miniBrushG.call(brush.move, [xFull(lo), xFull(hi)]);
        if (u < 1) _zoomRAF = requestAnimationFrame(tick);
        else _zoomRAF = null;
      }
      _zoomRAF = requestAnimationFrame(tick);
    }

    // wheel zoom — listen on SVG, ignore over mini area. Anchors zoom at the cursor so the
    // year under the pointer stays fixed while the visible range shrinks/expands around it.
    svg.on('wheel', (ev) => {
      const [, my] = d3.pointer(ev, svg.node());
      if (my > miniY - 4) return;          // hands off the mini overview
      ev.preventDefault();
      const mx = d3.pointer(ev, svg.node())[0];
      const cur = x.invert(mx);
      const dom = x.domain();
      // Smaller per-tick factor (1.12 / 0.89) feels nicer with rAF interpolation than the
      // previous chunky 1.18 / 0.85 — the animation smooths the rest.
      const factor = ev.deltaY > 0 ? 1.12 : 0.89;
      let lo = cur - (cur - dom[0]) * factor;
      let hi = cur + (dom[1] - cur) * factor;
      lo = Math.max(lo, xFull.domain()[0]);
      hi = Math.min(hi, xFull.domain()[1]);
      if (hi - lo < 50) return;
      smoothZoomTo(lo, hi, 200);
    });

    // DRAG TO PAN — listen on SVG, skip drag start when on an event circle or in mini
    let panAnchor = null;
    svg.call(d3.drag()
      .filter((ev) => {
        if (ev.button) return false;                                  // left mouse only
        if (ev.target && ev.target.closest('g.tl-event')) return false;
        if (ev.target && ev.target.closest('.tl-brush'))   return false;
        const [, my] = d3.pointer(ev, svg.node());
        if (my > miniY - 4) return false;
        return true;
      })
      .on('start', (ev) => { panAnchor = { mx: ev.x, dom: x.domain() }; svg.style('cursor', 'grabbing'); })
      .on('drag', (ev) => {
        if (!panAnchor) return;
        const pxPerUnit = (W - margin.left - margin.right) / (panAnchor.dom[1] - panAnchor.dom[0]);
        const dxUnits = (ev.x - panAnchor.mx) / pxPerUnit;
        let lo = panAnchor.dom[0] - dxUnits;
        let hi = panAnchor.dom[1] - dxUnits;
        const fullD = xFull.domain();
        if (lo < fullD[0]) { hi += (fullD[0] - lo); lo = fullD[0]; }
        if (hi > fullD[1]) { lo -= (hi - fullD[1]); hi = fullD[1]; }
        x = d3.scaleLinear().domain([lo, hi]).range([margin.left, W - margin.right]);
        miniBrushG.call(brush.move, [xFull(lo), xFull(hi)]);
      })
      .on('end', () => { panAnchor = null; svg.style('cursor', 'grab'); }));
    svg.style('cursor', 'grab');

    document.getElementById('btn-tl-reset').onclick = () => {
      // Smooth back to full range. 320ms is slightly longer than wheel-zoom to communicate
      // that this is a larger, intentional jump back to "all data."
      const fullD = xFull.domain();
      smoothZoomTo(fullD[0], fullD[1], 320);
    };
    document.getElementById('btn-tl-fit').onclick = () => {
      // dates are REAL years — convert through the compressor for the smooth-zoom target
      const lo = compressor.compress(Math.min(...dates) - 50);
      const hi = compressor.compress(Math.max(...dates) + 50);
      smoothZoomTo(lo, hi, 320);
    };

    // ===== Bottom zoom-preset toolbar — quick-jump to common temporal scales =====
    // User request: "quicktoggle zoom to scale to 100 year, 50 year, 10 year, 500 year".
    // Each preset zooms to a window of that real-year width, centered on the current
    // viewport midpoint (in real-year space, NOT compressed-year space — so a "100yr"
    // window always shows 100 years of actual history regardless of where you are).
    // The presets give a defined target zoom-tier the renderer can lean on for label
    // density (see the tier-aware label-fade logic in drawEvents).
    const presetsEl = document.createElement('div');
    presetsEl.className = 'tl-zoom-presets';
    presetsEl.innerHTML = `
      <span class="lbl">scale</span>
      <button data-yr="10">10y</button>
      <button data-yr="50">50y</button>
      <button data-yr="100">100y</button>
      <button data-yr="200">200y</button>
      <button data-yr="500">500y</button>
      <button data-yr="1000">1000y</button>
      <button data-yr="2000">2000y</button>
      <button data-yr="all">all</button>
      <span class="sep"></span>
      <span class="lbl">go to</span>
      <input type="text" class="yr-input" placeholder="-44 / 622 / 1517"
             title="Type a year (negative for BCE, positive for CE) and press Enter. Centers that year in view, preserves current zoom width." />
    `;
    document.getElementById('canvas').appendChild(presetsEl);
    function applyPreset(yr) {
      const fullD = xFull.domain();
      if (yr === 'all') { smoothZoomTo(fullD[0], fullD[1], 380); return; }
      // Find the real-year midpoint of the current view, then build a target window of
      // ±yr/2 real years around it. Convert to compressed-space for the scale domain.
      const dom = x.domain();
      const cMid = (dom[0] + dom[1]) / 2;
      const realMid = compressor.decompress(cMid);
      const yrNum = +yr;
      let realLo = realMid - yrNum / 2;
      let realHi = realMid + yrNum / 2;
      // Clamp to the real-year range available.
      if (realLo < realMin) { realHi += (realMin - realLo); realLo = realMin; }
      if (realHi > realMax) { realLo -= (realHi - realMax); realHi = realMax; }
      const lo = compressor.compress(realLo);
      const hi = compressor.compress(realHi);
      smoothZoomTo(lo, hi, 380);
    }
    // Year-input: type a year (e.g. -44 for 44 BCE, 622 for the Hegira, 1517 for Luther),
    // press Enter. The view re-centers on that year while preserving current zoom width.
    function goToYear(yearStr) {
      const yr = parseInt(String(yearStr).replace(/[^-0-9]/g, ''), 10);
      if (!isFinite(yr)) return;
      const dom = x.domain();
      const widthCompressed = dom[1] - dom[0];   // preserve zoom width in compressed space
      const cTarget = compressor.compress(Math.max(realMin, Math.min(realMax, yr)));
      let lo = cTarget - widthCompressed / 2;
      let hi = cTarget + widthCompressed / 2;
      const fullD = xFull.domain();
      if (lo < fullD[0]) { hi += (fullD[0] - lo); lo = fullD[0]; }
      if (hi > fullD[1]) { lo -= (hi - fullD[1]); hi = fullD[1]; }
      smoothZoomTo(lo, hi, 320);
    }
    const yrInput = presetsEl.querySelector('.yr-input');
    if (yrInput) {
      yrInput.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); goToYear(ev.target.value); }
        // Prevent the global keyboard shortcuts (e.g. [ for nav-collapse) from firing
        // when the user is typing in this field.
        ev.stopPropagation();
      });
    }
    presetsEl.querySelectorAll('button').forEach(b => {
      b.onclick = () => {
        applyPreset(b.dataset.yr);
        presetsEl.querySelectorAll('button').forEach(o => o.classList.toggle('active', o === b));
      };
    });

    // ===== Zoom meter wiring (timeline-specific) =====
    // The timeline doesn't use an SVG transform — it remaps the x-domain. The meter shows
    // currentK (full_range / visible_range). +/- buttons zoom in/out around the midpoint.
    // The 100% button restores the full-data view.
    function zmTimelineReadout() {
      const ro = document.getElementById('zm-readout');
      if (ro) ro.textContent = currentK.toFixed(2) + '×';
      const baseline = document.getElementById('zm-reset');
      if (baseline) baseline.style.color = Math.abs(currentK - 1) < 0.02 ? 'var(--gold)' : 'var(--gold-soft)';
    }
    function zmTimelineStep(factor) {
      const dom = x.domain();
      const mid = (dom[0] + dom[1]) / 2;
      let lo = mid - (mid - dom[0]) * factor;
      let hi = mid + (dom[1] - mid) * factor;
      const fullD = xFull.domain();
      lo = Math.max(lo, fullD[0]);
      hi = Math.min(hi, fullD[1]);
      if (hi - lo < 50) return;
      // Smooth animate — matches the wheel-zoom feel.
      smoothZoomTo(lo, hi, 240);
    }
    const zmIn = document.getElementById('zm-in');
    const zmOut = document.getElementById('zm-out');
    const zmBase = document.getElementById('zm-reset');
    if (zmIn)   zmIn.onclick   = () => zmTimelineStep(1 / 1.4);   // narrow the visible range → zoom in
    if (zmOut)  zmOut.onclick  = () => zmTimelineStep(1.4);
    if (zmBase) zmBase.onclick = () => {
      // 100% button — smooth animate back to full range.
      const fullD = xFull.domain();
      smoothZoomTo(fullD[0], fullD[1], 320);
    };
    zmTimelineReadout();
    // Update readout on every brush/wheel-driven redraw.
    const _origRedraw = redraw;
    redraw = function() { _origRedraw.apply(this, arguments); zmTimelineReadout(); };

    redraw();
  }
};

// ============================================================
// SCRIPTURE — one holy corpus per dropdown selection; book-islands (hulls)
// laid out as Pantheon-style wedges around the canvas, sections (Pentateuch,
// Prophets, Gospels, …) grouped together; inside each hull, the named
// entities — deities, persons, events — that appear in / authored that
// book. The same entity duplicated across multiple book-islands draws a
// faint trail-curve between its instances (visible on entity hover).
// User-stated priority: clarity + hygiene + small clean typography.
// ============================================================

// Corpus registry. Bible is fully wired; other holy-corpus entries are
// placeholders that surface in the dropdown with a "(coming soon)" tag.
// SECTIONS are listed roughly in canonical / compositional time-order so
// the ring reads clockwise as the canon's evolution. Each book id maps to
// a document node already present in the vault.
const SCRIPTURE_CORPORA = {
  'bible': {
    label: 'Holy Bible (Christian canons)',
    available: true,
    sections: [
      { id: 'pentateuch-sources', label: 'Pentateuch · source-critical strata', color: '#9aa55a', books: [
        { id: 'phase-2-005-hebrew-bible-j-source',    label: 'J · Yahwist source' },
        { id: 'phase-2-007-hebrew-bible-e-source',    label: 'E · Elohist source' },
        { id: 'phase-2-011-hebrew-bible-d-source',    label: 'D · Deuteronomist' },
        { id: 'phase-2-018-hebrew-bible-p-source',    label: 'P · Priestly source' },
      ]},
      { id: 'former-prophets', label: 'Former Prophets · Deuteronomistic History', color: '#8aa07a', books: [
        { id: 'phase-2-010-hebrew-bible-early-prophets', label: 'Former Prophets' },
        { id: 'phase-2-019-deuteronomistic-history',     label: 'Deuteronomistic History' },
      ]},
      { id: 'latter-prophets', label: 'Latter Prophets · Exilic poetry', color: '#7a9580', books: [
        { id: 'phase-3-001-second-third-isaiah', label: 'Second & Third Isaiah' },
        { id: 'phase-2-020-lamentations',        label: 'Lamentations' },
      ]},
      { id: 'wisdom-writings', label: 'Wisdom & later writings', color: '#c4a05a', books: [
        { id: 'phase-3-007-sirach',            label: 'Sirach (Ben Sira)' },
        { id: 'phase-3-008-book-of-daniel',    label: 'Daniel' },
        { id: 'phase-3-012-wisdom-of-solomon', label: 'Wisdom of Solomon' },
        { id: 'phase-3-019-4-maccabees',       label: '4 Maccabees' },
      ]},
      { id: 'apocrypha-pseudepigrapha', label: 'Apocrypha & pseudepigrapha', color: '#a08850', books: [
        { id: 'phase-3-004-1-enoch',           label: '1 Enoch' },
        { id: 'phase-3-009-jubilees',          label: 'Jubilees' },
        { id: 'phase-3-010-sibylline-oracles', label: 'Sibylline Oracles' },
        { id: 'phase-3-011-dead-sea-scrolls',  label: 'Dead Sea Scrolls' },
      ]},
      { id: 'canonical-translations', label: 'Canonical translations & recensions', color: '#a8a3b8', books: [
        { id: 'phase-3-006-septuagint',                 label: 'Septuagint (LXX)' },
        { id: 'phase-4-080-garima-gospels',             label: 'Garima Gospels (Geʿez)' },
        { id: 'phase-4-081-mashafa-henok-geez-1-enoch', label: 'Mashafa Henok (Geʿez 1 Enoch)' },
        { id: 'phase-4-082-ethiopic-biblical-canon',    label: 'Ethiopic 81-book canon' },
      ]},
      { id: 'pre-gospel', label: 'Pre-Gospel sources', color: '#d06868', books: [
        { id: 'phase-3-014-q-source', label: 'Q source' },
      ]},
      { id: 'gospels', label: 'Gospels & harmony', color: '#c44a5a', books: [
        { id: 'phase-3-016-gospel-of-mark',    label: 'Mark' },
        { id: 'phase-3-017-gospel-of-matthew', label: 'Matthew' },
        { id: 'phase-3-018-luke-acts',         label: 'Luke–Acts' },
        { id: 'phase-3-020-gospel-of-john',    label: 'John' },
        { id: 'phase-4-037-diatessaron',       label: 'Diatessaron (harmony)' },
      ]},
      { id: 'pauline', label: 'Pauline corpus', color: '#a83e4a', books: [
        { id: 'phase-3-015-pauline-epistles', label: 'Undisputed Paulines' },
      ]},
    ],
  },
  // Greco-Egyptian scripture-class corpora (wired by opus-hellenic-2).
  // The Egyptian funerary corpus is the longest-running sacred-textual tradition
  // in human history (~2400 BCE – 400 CE). Homer + Hesiod were functionally
  // scripture for the Greek world — Plato Rep. X 606e calls Homer "the educator
  // of the Hellenes." The Hermetica corpus is wired separately below
  // (by opus-scripture-2 / opus-hermetic-1) with a richer NHC-VI + Coptic +
  // Stobaean + Armenian + Alchemical structure.
  'egyptian-scripture': {
    label: 'Egyptian sacred-textual tradition (2400 BCE → 400 CE)',
    available: true,
    sections: [
      { id: 'egyptian-old-kingdom', label: 'Old Kingdom · royal funerary corpus', color: '#c89a3a', books: [
        { id: 'phase-1-002-pyramid-texts', label: 'Pyramid Texts' },
      ]},
      { id: 'egyptian-middle-kingdom', label: 'Middle Kingdom · democratized afterlife', color: '#9a7240', books: [
        { id: 'phase-1-009-coffin-texts', label: 'Coffin Texts' },
      ]},
      { id: 'egyptian-new-kingdom', label: 'New Kingdom · Book of the Dead + Amarna', color: '#6e8a5a', books: [
        { id: 'phase-1-010-book-of-the-dead',     label: 'Book of the Dead' },
        { id: 'phase-1-011-great-hymn-to-aten',   label: 'Great Hymn to Aten' },
        { id: 'phase-1-012-amarna-letters',       label: 'Amarna Letters' },
      ]},
      { id: 'egyptian-theological-cosmological', label: 'Theological-cosmological inscriptions', color: '#4a6a7a', books: [
        { id: 'phase-1-027-memphite-theology-shabaka-stone', label: 'Memphite Theology (Shabaka Stone)' },
      ]},
      { id: 'egyptian-greek-transmission', label: 'Greek-Egyptian transmission (Ptolemaic-Roman)', color: '#80604a', books: [
        { id: 'phase-3-025-manetho-aegyptiaca',           label: 'Manetho · Aegyptiaca' },
        { id: 'phase-3-026-diodorus-bibliotheca-book-1',  label: 'Diodorus · Bibliotheca Bk 1' },
        { id: 'phase-4-072-plutarch-de-iside-et-osiride', label: 'Plutarch · De Iside et Osiride' },
        { id: 'phase-2-028-herodotus-histories-book-2',   label: 'Herodotus · Histories Bk 2' },
      ]},
    ],
  },
  'greek-scripture': {
    label: 'Greek sacred-textual tradition (Homer → Orphic)',
    available: true,
    sections: [
      { id: 'greek-pan-hellenic', label: 'Pan-Hellenic foundational (Homer + Hesiod)', color: '#b07a45', books: [
        { id: 'phase-2-008-homeric-epics',                  label: 'Homer · Iliad + Odyssey' },
        { id: 'phase-2-009-hesiod-theogony-works-and-days', label: 'Hesiod · Theogony + Works' },
      ]},
      { id: 'greek-orphic-mystery', label: 'Orphic-mystery revealed corpus', color: '#6a8a9c', books: [
        { id: 'phase-3-027-derveni-papyrus', label: 'Derveni Papyrus' },
        { id: 'phase-3-028-orphic-hymns',    label: 'Orphic Hymns' },
      ]},
      { id: 'greek-philosophical-theology', label: 'Philosophical theology (Plato-Aristotle)', color: '#5a7a8c', books: [
        { id: 'phase-3-002-plato-dialogues',                label: 'Plato · Dialogues' },
        { id: 'phase-3-022-plato-timaeus-critias-atlantis', label: 'Plato · Timaeus + Critias' },
        { id: 'phase-3-003-aristotle-metaphysics',          label: 'Aristotle · Metaphysics' },
      ]},
      { id: 'greek-ethnographic-theological', label: 'Ethnographic-theological (Greek-Egyptian)', color: '#4f6d80', books: [
        { id: 'phase-2-028-herodotus-histories-book-2', label: 'Herodotus · Histories Bk 2 (Egypt)' },
      ]},
    ],
  },
  // Placeholders — surface in the dropdown, render an empty-state card when picked.
  // ----- Tanakh — Jewish canonical TaNaKh organization (Torah/Neviʼim/Ketuvim),
  // deliberately distinct from the Christian-Bible corpus view. Shares the same
  // source documents but excludes the NT, deutero-canonical books (Wisdom-of-
  // Solomon / Sirach / 4 Maccabees etc.), and Christian apocrypha. -----
  'tanakh': {
    label: 'Tanakh · Hebrew Bible (Jewish canonical order)',
    available: true,
    sections: [
      { id: 'tanakh-torah', label: 'Torah · source-critical strata', color: '#9aa55a', books: [
        { id: 'phase-2-005-hebrew-bible-j-source', label: 'J · Yahwist source' },
        { id: 'phase-2-007-hebrew-bible-e-source', label: 'E · Elohist source' },
        { id: 'phase-2-011-hebrew-bible-d-source', label: 'D · Deuteronomist' },
        { id: 'phase-2-018-hebrew-bible-p-source', label: 'P · Priestly source' },
      ]},
      { id: 'tanakh-nevi-im-rishonim', label: 'Neviʼim Rishonim · Former Prophets', color: '#8aa07a', books: [
        { id: 'phase-2-010-hebrew-bible-early-prophets', label: 'Former Prophets' },
        { id: 'phase-2-019-deuteronomistic-history',     label: 'Deuteronomistic History' },
      ]},
      { id: 'tanakh-nevi-im-aharonim', label: 'Neviʼim Aharonim · Latter Prophets', color: '#7a9580', books: [
        { id: 'phase-3-001-second-third-isaiah', label: 'Second & Third Isaiah' },
      ]},
      { id: 'tanakh-ketuvim', label: 'Ketuvim · Writings', color: '#a09a78', books: [
        { id: 'phase-3-008-book-of-daniel', label: 'Daniel' },
        { id: 'phase-2-020-lamentations',   label: 'Lamentations' },
      ]},
      { id: 'tanakh-qumran-matrix', label: 'Qumran textual matrix', color: '#a8a3b8', books: [
        { id: 'phase-3-011-dead-sea-scrolls', label: 'Dead Sea Scrolls' },
      ]},
    ],
  },
  // ----- Qurʾān corpus (wired by opus-scripture-2 — single-island starter) -----
  // The entire Qurʾān as one document until split by sura into Meccan / Medinan groups
  // by a future agent. Cross-tradition payoff (Moses / Abraham / Mary / Jesus / Joseph
  // / Solomon trail-arcs into the Bible canvas) is real even with a single hull, since
  // the Qurʾān document's edges into those entity nodes are already in the vault.
  'quran': {
    label: 'Qurʾān',
    available: true,
    sections: [
      { id: 'quran-canonical', label: 'Qurʾān · canonical text', color: '#5a7a5a', books: [
        { id: 'phase-4-034-quran',                             label: 'Qurʾān (entire codex)' },
      ]},
    ],
  },
  // ----- Vedic corpus — Indic sacred-textual tradition clockwise in roughly
  // compositional order: Saṃhitās → Brāhmaṇas / Āraṇyakas → Upaniṣads → epic-Smṛti
  // → Darśana → Purāṇas → medieval Vedānta → Tantric. Cross-corpus trail-arcs
  // on hover: Krishna across Bhagavad Gītā + Bhagavata Purāṇa + Mahābhārata;
  // Indra / Agni / Soma across Ṛg-Veda + Atharva-Veda + Upaniṣads; Yājñavalkya
  // across Brihadaranyaka + adjacent Upaniṣads. -----
  'vedas': {
    label: 'Vedic corpus (Ṛg-Veda → medieval Vedānta + Tantra)',
    available: true,
    sections: [
      { id: 'vedic-samhitas', label: 'Saṃhitās · Vedic hymns (1500–900 BCE)', color: '#e08a3a', books: [
        { id: 'phase-2-001-rig-veda-family-books', label: 'Ṛg-Veda · family books' },
        { id: 'phase-2-003-atharva-veda',          label: 'Atharva-Veda' },
      ]},
      { id: 'vedic-brahmanas-aranyakas', label: 'Brāhmaṇas / Āraṇyakas · ritual + forest texts', color: '#c47453', books: [
        { id: 'phase-2-006-brahmanas-aranyakas', label: 'Brāhmaṇas / Āraṇyakas (overview)' },
      ]},
      { id: 'vedic-upanishads', label: 'Upaniṣads · philosophical end of the Veda', color: '#a85e44', books: [
        { id: 'phase-2-012-brihadaranyaka-upanishad', label: 'Brihadāraṇyaka Upaniṣad' },
        { id: 'phase-2-013-chandogya-upanishad',      label: 'Chāndogya Upaniṣad' },
        { id: 'phase-2-021-shvetashvatara-upanishad', label: 'Śvetāśvatara Upaniṣad' },
      ]},
      { id: 'vedic-epic-smriti', label: 'Epic + Smṛti', color: '#c89a3a', books: [
        { id: 'phase-2-017-mahabharata-ramayana-oral-layers', label: 'Mahābhārata + Rāmāyaṇa (oral layers)' },
        { id: 'phase-2-027-bhagavad-gita',                    label: 'Bhagavad Gītā' },
      ]},
      { id: 'vedic-darsana', label: 'Darśana · classical philosophy', color: '#9a8550', books: [
        { id: 'phase-3-023-yoga-sutras-of-patanjali', label: 'Yoga-Sūtras of Patañjali' },
        { id: 'phase-3-024-natyashastra',             label: 'Nāṭyaśāstra (Bharata)' },
      ]},
      { id: 'vedic-purana', label: 'Purāṇa · devotional theology', color: '#b8845a', books: [
        { id: 'phase-4-065-bhagavata-purana', label: 'Bhāgavata Purāṇa' },
      ]},
      { id: 'vedic-vedanta-exegesis', label: 'Medieval Vedānta exegesis', color: '#a07050', books: [
        { id: 'phase-5-016-ramanuja-sribhasya', label: 'Rāmānuja · Śrī-Bhāṣya' },
      ]},
      { id: 'vedic-tantra', label: 'Tantra · Kashmir Śaiva + later esoteric', color: '#80604a', books: [
        { id: 'phase-5-006-vijnana-bhairava-tantra', label: 'Vijñāna-Bhairava Tantra' },
        { id: 'phase-5-014-abhinavagupta-tantraloka', label: 'Abhinavagupta · Tantrāloka' },
      ]},
    ],
  },
  // ----- Buddhist canon (wired by opus-buddhist-1) -----
  // Spans Theravāda Pali + Mahāyāna sūtras + Madhyamaka + Chan/Zen + Vajrayāna in
  // compositional/canonical-reception order so the ring reads clockwise as the canon's
  // evolution from the Buddha's lifetime (~-450) through Tibetan terma (~+1326).
  // Cross-corpus trail-arcs visible on hover: Siddhartha Gautama Buddha across nearly
  // every Buddhist document; Avalokiteśvara across Heart + Lotus + Sukhāvatī; Mañjuśrī
  // + Samantabhadra across Lotus + Avatamsaka; Subhūti across Asthasāhasrikā + Diamond;
  // Śāriputra across Heart + Asthasāhasrikā; Nāgārjuna across MMK + Heart. Aśokan
  // Edicts and Milindapañha give the Greco-Buddhist contact-zone hull. Vault `key-figures`
  // and `deities-mentioned` arrays drive entity placement automatically.
  'tipitaka': {
    label: 'Buddhist canon (Pāli Tipiṭaka + Mahāyāna sūtras + Vajrayāna)',
    available: true,
    sections: [
      { id: 'buddhist-pali-earliest', label: 'Pāli earliest stratum (~-450 to -250)', color: '#c89a3a', books: [
        { id: 'phase-2-016-early-buddhist-suttas', label: 'Sutta Nipāta · Aṭṭhakavagga + Pārāyanavagga' },
        { id: 'phase-2-029-dhammapada',            label: 'Dhammapada' },
      ]},
      { id: 'buddhist-indo-greek', label: 'Indo-Greek frontier dialogue (~-150 to +100)', color: '#a07050', books: [
        { id: 'phase-3-029-milindapanha',          label: 'Milindapañha · Questions of King Milinda' },
      ]},
      { id: 'buddhist-prajnaparamita', label: 'Prajñāpāramitā corpus (~-100 to +700)', color: '#b06850', books: [
        { id: 'phase-3-031-asthasahasrika-prajnaparamita', label: 'Aṣṭasāhasrikā · earliest Mahāyāna sūtra' },
        { id: 'phase-5-002b-diamond-sutra',                label: 'Diamond Sūtra (Vajracchedikā)' },
        { id: 'phase-5-002-heart-sutra',                   label: 'Heart Sūtra' },
      ]},
      { id: 'buddhist-mahayana-cosmic', label: 'Mahāyāna sūtras · cosmic + devotional + idealist (~+100 to +400)', color: '#b05060', books: [
        { id: 'phase-4-061-lotus-sutra',           label: 'Lotus Sūtra' },
        { id: 'phase-4-062-avatamsaka-sutra',      label: 'Avataṃsaka (Flower-Ornament) Sūtra' },
        { id: 'phase-4-064-sukhavativyuha-larger', label: 'Larger Sukhāvatī-vyūha (Pure Land)' },
        { id: 'phase-4-063-lankavatara-sutra',     label: 'Laṅkāvatāra Sūtra' },
      ]},
      { id: 'buddhist-madhyamika', label: 'Mādhyamika philosophical (~+200)', color: '#5a7a90', books: [
        { id: 'phase-4-075-mulamadhyamakakarika',  label: 'Mūlamadhyamakakārikā · Nāgārjuna' },
      ]},
      { id: 'buddhist-theravada-synthesis', label: 'Theravāda systematic synthesis (~+430)', color: '#8a6a40', books: [
        { id: 'phase-4-076-visuddhimagga',         label: 'Visuddhimagga · Buddhaghosa' },
      ]},
      { id: 'buddhist-chan', label: 'East Asian Chan / Zen (~+780)', color: '#4a7060', books: [
        { id: 'phase-5-004-platform-sutra-huineng', label: 'Platform Sūtra of Huineng' },
      ]},
      { id: 'buddhist-vajrayana', label: 'Tibetan Vajrayāna terma (~+1326)', color: '#6a4a80', books: [
        { id: 'phase-5-029-bardo-thodol',          label: 'Bardo Thödol · Tibetan Book of the Dead' },
      ]},
    ],
  },
  // ----- Avesta — Zoroastrian sacred corpus. Old Avestan Gathic stratum is
  // the earliest layer (traditionally attributed to Zarathustra himself,
  // ~1200–1000 BCE per the most defensible linguistic dating). Younger Avesta
  // (Yasna body, Yashts, Vendidad) accreted over ~700 BCE – 300 CE. Hāošyaŋha
  // / Yima / Mithra / Anāhitā / Vərəθraγna anchor the cross-corpus mythology. -----
  'avesta': {
    label: 'Avesta · Zoroastrian sacred corpus',
    available: true,
    sections: [
      { id: 'avesta-old-gathic', label: 'Old Avestan · Gāthās of Zarathustra', color: '#5a6cc4', books: [
        { id: 'phase-2-002-gathas-of-zarathustra', label: 'Gāthās of Zarathustra' },
      ]},
      { id: 'avesta-younger', label: 'Younger Avesta · Yasna corpus', color: '#4a5aa0', books: [
        { id: 'phase-2-004-yasna-younger-avesta', label: 'Yasna · Younger Avesta' },
      ]},
    ],
  },
  'kojiki-nihongi': { label: 'Kojiki / Nihon Shoki (Shintō)',                available: false },
  // ----- Sikh canonical scripture. The Ādi Granth (compiled 1604 by Guru
  // Arjan, expanded 1678 into the Gurū Granth Sāhib by Guru Gobind Singh)
  // is the eleventh and eternal Guru of Sikhism — uniquely a SCRIPTURE
  // installed as a living teacher. Bhakti-mystic poets (Kabīr, Ravidās, Namdev,
  // Farīd) are co-canonical authors alongside the Gurus. -----
  'guru-granth': {
    label: 'Gurū Granth Sāhib · Sikh canonical scripture',
    available: true,
    sections: [
      { id: 'sikh-canonical', label: 'Ādi Granth / Gurū Granth Sāhib (1604 / 1678)', color: '#5a6cc4', books: [
        { id: 'phase-6-016-guru-granth-sahib', label: 'Gurū Granth Sāhib' },
      ]},
    ],
  },
  // ----- The Book of Mormon (1830, Joseph Smith) — the keystone LDS/Latter-
  // day Saint scripture, claimed translation from golden plates of the Nephite
  // and Lamanite peoples (pre-Columbian Israelite migration in the LDS narrative).
  // Single-document corpus for now; could expand to include the Doctrine and
  // Covenants, the Pearl of Great Price, and the Book of Abraham. -----
  'mormon': {
    label: 'Book of Mormon · LDS keystone scripture (1830)',
    available: true,
    sections: [
      { id: 'lds-keystone', label: 'Keystone scripture · LDS canon', color: '#a87040', books: [
        { id: 'phase-7-001-book-of-mormon', label: 'The Book of Mormon (1830)' },
      ]},
    ],
  },
  // ----- Confucian classics — pre-Confucian Five-Classics roots (Shijing /
  // Shujing, ~10th–6th c. BCE), the foundational Confucian and rival-school
  // Spring-and-Autumn-period texts (Analects → Mengzi → Xunzi, Mozi, Han Feizi).
  // The Confucian canon was the orthodox state-examination curriculum of
  // imperial China from the Han through Qing dynasties — the longest-lived
  // state-orthodox scriptural canon in world history. -----
  'confucian-classics': {
    label: 'Confucian classics + Hundred-Schools rivals',
    available: true,
    sections: [
      { id: 'pre-confucian-classics', label: 'Pre-Confucian classical roots', color: '#a87045', books: [
        { id: 'phase-1-024-shijing', label: 'Shijing · Classic of Poetry' },
        { id: 'phase-1-025-shujing', label: 'Shujing · Classic of Documents' },
      ]},
      { id: 'confucian-foundational', label: 'Foundational Confucian · Analects → Mengzi → Xunzi', color: '#8a6c5a', books: [
        { id: 'phase-2-015-analects-of-confucius', label: 'Analects of Confucius' },
        { id: 'phase-2-023-mengzi',                label: 'Mengzi' },
        { id: 'phase-2-024-xunzi',                 label: 'Xunzi' },
      ]},
      { id: 'rival-schools', label: 'Rival schools · Mohist + Legalist', color: '#6a5a4a', books: [
        { id: 'phase-2-025-mozi',     label: 'Mozi (Mohist)' },
        { id: 'phase-2-026-han-feizi', label: 'Han Feizi (Legalist)' },
      ]},
    ],
  },

  'kebra-nagast': {
    label: 'Kebra Nagast (Glory of the Kings — Ethiopian / Rastafari foundational)',
    available: true,
    sections: [
      { id: 'kebra-nagast-core', label: 'Kebra Nagast · Solomonic-genealogical national epic (Geʼez redaction 1314–1322)', color: '#b89255', books: [
        { id: 'phase-8-008-kebra-nagast', label: 'Kebra Nagast' },
      ]},
    ],
  },
  // Ethiopic Tewahedo broader canon — the full distinctively-Ethiopian scriptural-and-canonical world.
  // Documents arranged in roughly compositional / canonical-reception sequence: Aksumite foundational →
  // Second-Temple Jewish material canonical only in Ethiopia → Solomonic medieval theological →
  // hagiographic-liturgical → national-religious-foundational → Jesuit-period hagiography.
  // Entities populate each hull via existing vault `deities-mentioned` / `key-figures` /
  // `mentioned-in` / `events-context` edges established by opus-ethiopian-1 and opus-ethiopian-2.
  'ethiopic-tewahedo-canon': {
    label: 'Ethiopic Tewahedo Broader Canon (the distinctive Ethiopian scriptural world)',
    available: true,
    sections: [
      { id: 'ethiopic-aksumite-foundational', label: 'Aksumite foundational (4th–7th c.)', color: '#a08850', books: [
        { id: 'phase-4-080-garima-gospels',             label: 'Garima Gospels (Geʼez illuminated, RC 330–660 CE)' },
        { id: 'phase-4-082-ethiopic-biblical-canon',    label: 'Ethiopic 81-book canon (overview)' },
      ]},
      { id: 'ethiopic-second-temple-canonical', label: 'Second-Temple Jewish material canonical only in Ethiopia', color: '#9a6f3a', books: [
        { id: 'phase-4-081-mashafa-henok-geez-1-enoch', label: 'Mashafa Henok (Geʼez 1 Enoch)' },
        { id: 'phase-3-009-jubilees',                    label: 'Jubilees (Mashafa Kufale)' },
        { id: 'phase-5-040-meqabyan-ethiopian-maccabees', label: 'Meqabyan I–III (uniquely Ethiopian)' },
      ]},
      { id: 'ethiopic-solomonic-medieval-theology', label: 'Solomonic-era theological systematization (14th–15th c.)', color: '#7a8590', books: [
        { id: 'phase-5-036-mashafa-mistir-giyorgis',     label: 'Mashafa Mistir (Giyorgis of Sagla)' },
        { id: 'phase-5-038-mashafa-berhan',              label: 'Mashafa Berhan (Zarʼa Yaʼqob)' },
        { id: 'phase-5-037-fetha-nagast',                label: 'Fetha Nagast (Law of the Kings)' },
      ]},
      { id: 'ethiopic-hagiographic-liturgical', label: 'Hagiographic-liturgical', color: '#8a7a90', books: [
        { id: 'phase-5-039-sinkessar-synaxarium',        label: 'Sinkessar (Ethiopian Synaxarium)' },
      ]},
      { id: 'ethiopic-national-religious', label: 'National-religious-foundational', color: '#b89255', books: [
        { id: 'phase-8-008-kebra-nagast',                label: 'Kebra Nagast (Glory of the Kings)' },
      ]},
      { id: 'ethiopic-jesuit-period', label: 'Post-Jesuit hagiography (17th c.)', color: '#8a5a4a', books: [
        { id: 'phase-7-040-walatta-petros-hagiography',  label: 'Gadla Walatta Petros (Galawdewos, 1672)' },
      ]},
    ],
  },
  // ----- Dao corpus — foundational Daoist philosophical-mystical texts.
  // Daodejing (the *Lǎozǐ*, ~6th–4th c. BCE) sets the metaphysical baseline;
  // Zhuāngzǐ (~4th c. BCE) develops it through paradox and dream-logic. Later
  // Daoist religious-scriptural corpora (the Daozang, Highest Clarity, Numinous
  // Treasure, Celestial Master traditions) are not yet wired as documents. -----
  'tao-corpus': {
    label: 'Dao corpus · Daoist philosophical mysticism',
    available: true,
    sections: [
      { id: 'dao-foundational', label: 'Foundational · Daodejing (Lǎozǐ)', color: '#5a9a8f', books: [
        { id: 'phase-2-014-daodejing', label: 'Daodejing (Lǎozǐ)' },
      ]},
      { id: 'dao-inner-chapters', label: 'Inner Chapters · Zhuāngzǐ', color: '#4a857a', books: [
        { id: 'phase-2-022-zhuangzi', label: 'Zhuāngzǐ' },
      ]},
    ],
  },
  // ----- Nag Hammadi corpus (wired by opus-scripture-2) -----
  // Organized by codex (Codex I = Jung Codex; II/III/VI = densest; VIII/XI/XIII =
  // Sethian Platonist registers; BG 8502 = Berlin Codex, related-but-not-NHC).
  // Within each codex section, books are ordered by tractate number so the ring mirrors
  // the physical bound order of the manuscript. Hermetic and Sethian and Thomasine and
  // Valentinian texts share the same physical codices — the cross-codex trails of
  // Sophia / Yaldabaoth / Norea / Mary Magdalene make this visible at a glance.
  'nag-hammadi': {
    label: 'Nag Hammadi codices (Coptic · 4th c.)',
    available: true,
    sections: [
      { id: 'nhc-i-jung', label: 'Codex I · Jung Codex', color: '#a87a4a', books: [
        { id: 'phase-4-003-gospel-of-truth',                   label: 'I,3 · Gospel of Truth' },
        { id: 'phase-4-059-tripartite-tractate',               label: 'I,5 · Tripartite Tractate' },
      ]},
      { id: 'nhc-ii', label: 'Codex II', color: '#b87850', books: [
        { id: 'phase-4-002-apocryphon-of-john',                label: 'II,1 · Apocryphon of John' },
        { id: 'phase-4-001-gospel-of-thomas',                  label: 'II,2 · Gospel of Thomas' },
        { id: 'phase-4-004-gospel-of-philip',                  label: 'II,3 · Gospel of Philip' },
        { id: 'phase-4-006-hypostasis-of-the-archons',         label: 'II,4 · Hypostasis of the Archons' },
        { id: 'phase-4-007-on-the-origin-of-the-world',        label: 'II,5 · Origin of the World' },
      ]},
      { id: 'nhc-iii', label: 'Codex III', color: '#a86a48', books: [
        { id: 'phase-4-010-sophia-of-jesus-christ',            label: 'III,4 · Sophia of Jesus Christ' },
      ]},
      { id: 'nhc-vi', label: 'Codex VI · Hermetic + Thunder cluster', color: '#9a8550', books: [
        { id: 'phase-4-058-thunder-perfect-mind',              label: 'VI,2 · Thunder, Perfect Mind' },
        { id: 'phase-4-013-discourse-on-the-eighth-and-ninth', label: 'VI,6 · Eighth & Ninth' },
        { id: 'phase-4-078-prayer-of-thanksgiving-nhc-vi-7',   label: 'VI,7 · Prayer of Thanksgiving' },
        { id: 'phase-4-079-coptic-asclepius-nhc-vi-8',         label: 'VI,8 · Coptic Asclepius' },
      ]},
      { id: 'nhc-viii', label: 'Codex VIII · Sethian Platonist', color: '#7a8a8a', books: [
        { id: 'phase-4-056-zostrianos',                        label: 'VIII,1 · Zostrianos' },
      ]},
      { id: 'nhc-xi', label: 'Codex XI · Sethian Platonist', color: '#6a8a90', books: [
        { id: 'phase-4-057-allogenes',                         label: 'XI,3 · Allogenes' },
      ]},
      { id: 'nhc-xiii', label: 'Codex XIII', color: '#7a7a90', books: [
        { id: 'phase-4-008-trimorphic-protennoia',             label: 'XIII,1 · Trimorphic Protennoia' },
      ]},
      { id: 'bg-8502', label: 'BG 8502 · Berlin Codex (related)', color: '#a87aa0', books: [
        { id: 'phase-4-005-gospel-of-mary',                    label: 'BG 8502,1 · Gospel of Mary' },
      ]},
    ],
  },
  // ----- Hermetica corpus (wired by opus-scripture-2 after opus-hermetic-1) -----
  // Sections trace the Hermetic transmission spine clockwise: Greek Corpus (1st-3rd c.)
  // → Coptic NHC VI cluster → Latin + Stobaean Greek + Armenian late-antique transmission
  // → Alchemical Hermetica → Renaissance Latin (Ficino) → Modern Hermetic. Reading the
  // ring clockwise reads the Hermetic literary history. Hermes Trismegistus, Tat,
  // Asclepius, Poimandres make cross-book trail-arcs across the entire corpus on hover.
  'hermetica': {
    label: 'Corpus Hermeticum (philosophical + technical Hermetica)',
    available: true,
    sections: [
      { id: 'hermetica-greek-corpus', label: 'Greek Corpus Hermeticum', color: '#b08a3a', books: [
        { id: 'phase-3-021-hermetic-corpus-earliest',          label: 'Hermetica · earliest stratum (overview)' },
        { id: 'phase-4-011-corpus-hermeticum-i',               label: 'CH I · Poimandres' },
        { id: 'phase-4-075-corpus-hermeticum-xiii-rebirth',    label: 'CH XIII · Rebirth dialogue' },
      ]},
      { id: 'hermetica-coptic-nhc-vi', label: 'Coptic Hermetica · NHC VI cluster', color: '#a89060', books: [
        { id: 'phase-4-013-discourse-on-the-eighth-and-ninth', label: 'NHC VI,6 · Eighth & Ninth' },
        { id: 'phase-4-078-prayer-of-thanksgiving-nhc-vi-7',   label: 'NHC VI,7 · Prayer of Thanksgiving' },
        { id: 'phase-4-079-coptic-asclepius-nhc-vi-8',         label: 'NHC VI,8 · Coptic Asclepius' },
      ]},
      { id: 'hermetica-late-antique-transmission', label: 'Latin · Stobaean Greek · Armenian', color: '#9a7a4a', books: [
        { id: 'phase-4-012-asclepius',                            label: 'Latin Asclepius (Logos Teleios)' },
        { id: 'phase-4-076-stobaean-hermetica-kore-kosmou',       label: 'Stobaean Hermetica (Kore Kosmou)' },
        { id: 'phase-4-077-definitions-hermes-asclepius-armenian', label: 'Armenian Definitions (DH)' },
      ]},
      { id: 'hermetica-alchemical', label: 'Alchemical Hermetica', color: '#8c6a44', books: [
        { id: 'phase-4-073-tabula-smaragdina',                 label: 'Tabula Smaragdina (Emerald Tablet)' },
        { id: 'phase-4-074-zosimos-of-panopolis-corpus',       label: 'Zosimos of Panopolis corpus' },
      ]},
      { id: 'hermetica-renaissance-latin', label: 'Renaissance Latin recovery', color: '#c4a05a', books: [
        { id: 'phase-6-001-ficino-pimander',                   label: 'Ficino · Pimander 1471' },
      ]},
      { id: 'hermetica-modern', label: 'Modern Hermetic reception', color: '#a89880', books: [
        { id: 'phase-7-032-kybalion',                          label: 'The Kybalion (1908)' },
      ]},
    ],
  },
};

// Edge types that bind a person/deity/event to a document for the Scripture view.
// `attests` → deity mentioned in the doc (from doc's `deities-mentioned`).
// `attested-in` → reverse direction: deity/person/event lists the doc in its own
//                  `attested-in` array. The Egyptian corpus carries most of its
//                  deity→doc links this way (Nephthys / Geb / Anubis all list
//                  Pyramid Texts + Coffin Texts + Book of the Dead in their
//                  `attested-in` rather than those docs listing them).
// `context` → event in doc's context-set.
// `key-figure` → doc's named author/redactor/protagonist/addressee.
// `mentioned-in` → person whose YAML names the doc in its mentioned-in field.
// `authored`, `attributed-author` → the doc's author / disputed author.
const SCRIPTURE_BIND_TYPES = new Set([
  'attests', 'attested-in', 'context', 'key-figure', 'mentioned-in', 'authored', 'attributed-author',
]);

// Vault-wide id-form mismatch shim: document nodes sometimes carry a YAML `id`
// like "P2-005-hebrew-bible-j-source" while ~every other node references them
// by file-stem form "phase-2-005-hebrew-bible-j-source". The dashboard's
// dead-link tracker counts these as misses, but in this view we just need both
// forms to resolve. Returns the actual NODES_BY_ID key if either form resolves;
// returns null if neither does.
function scriptureResolveBookId(rawId) {
  if (NODES_BY_ID[rawId]) return rawId;
  const m1 = rawId.match(/^phase-(\d+)-(.*)$/);
  if (m1) {
    const alt = `P${m1[1]}-${m1[2]}`;
    if (NODES_BY_ID[alt]) return alt;
  }
  const m2 = rawId.match(/^P(\d+)-(.*)$/);
  if (m2) {
    const alt = `phase-${m2[1]}-${m2[2]}`;
    if (NODES_BY_ID[alt]) return alt;
  }
  return null;
}

// Set of every id form pointing at the same document — used to match edges
// regardless of which form the edge ended up using.
function scriptureBookAliases(rawId) {
  const out = new Set([rawId]);
  const m1 = rawId.match(/^phase-(\d+)-(.*)$/);
  if (m1) out.add(`P${m1[1]}-${m1[2]}`);
  const m2 = rawId.match(/^P(\d+)-(.*)$/);
  if (m2) out.add(`phase-${m2[1]}-${m2[2]}`);
  return out;
}

// For a given book document, return the set of node ids that count as
// "named entities appearing in that book" — deities, persons, events only.
// Matches edges against ALL id-form aliases of the book.
function scriptureEntitiesForBook(rawBookId) {
  const aliases = scriptureBookAliases(rawBookId);
  const out = new Set();
  EDGES.forEach(e => {
    if (!SCRIPTURE_BIND_TYPES.has(e.type)) return;
    // Doc → entity
    if (aliases.has(e.source)) {
      const n = NODES_BY_ID[e.target];
      if (n && (n.type === 'deity' || n.type === 'person' || n.type === 'event')) {
        out.add(e.target);
      }
    }
    // Entity → doc
    if (aliases.has(e.target)) {
      const n = NODES_BY_ID[e.source];
      if (n && (n.type === 'deity' || n.type === 'person' || n.type === 'event')) {
        out.add(e.source);
      }
    }
  });
  return out;
}

VIEWS.scripture = {
  title: 'Scripture',
  subtitle: 'pick a holy corpus · each book is its own island of named entities · cross-book trails on hover',
  render() {
    // ----- Currently-selected corpus key (state on STATE.scriptureCorpus) -----
    if (!STATE.scriptureCorpus) STATE.scriptureCorpus = 'bible';
    let corpusKey = STATE.scriptureCorpus;
    if (!SCRIPTURE_CORPORA[corpusKey]) corpusKey = 'bible';
    const corpus = SCRIPTURE_CORPORA[corpusKey];

    // ----- Top-of-canvas corpus dropdown -----
    const corpusOptions = Object.entries(SCRIPTURE_CORPORA).map(([key, c]) => {
      const tag = c.available ? '' : '  (coming soon)';
      const sel = key === corpusKey ? ' selected' : '';
      return `<option value="${key}"${sel}>${c.label}${tag}</option>`;
    }).join('');
    // Short corpus labels for the narrow dropdown button. Full `corpus.label`
    // remains the source-of-truth description shown when the dropdown is OPEN.
    const SCRIPTURE_CORPUS_SHORT = {
      'bible': 'Bible',
      'egyptian-scripture': 'Egyptian',
      'greek-scripture': 'Greek',
      'tanakh': 'Tanakh',
      'quran': 'Qurʾān',
      'vedas': 'Vedas',
      'tipitaka': 'Buddhist',
      'avesta': 'Avesta',
      'kojiki-nihongi': 'Kojiki',
      'guru-granth': 'Gurū Granth',
      'mormon': 'Mormon',
      'kebra-nagast': 'Kebra Nagast',
      'ethiopic-tewahedo-canon': 'Tewahedo',
      'tao-corpus': 'Dao',
      'confucian-classics': 'Confucian',
      'nag-hammadi': 'Nag Hammadi',
      'hermetica': 'Hermetica',
    };
    const shortLabelFor = (k, c) => SCRIPTURE_CORPUS_SHORT[k]
      || (c && c.label ? c.label.split(/[(·—/]|\s—\s/)[0].trim().slice(0, 14) : k);

    const currentShort = shortLabelFor(corpusKey, corpus);
    // Build the dropdown popup rows. Available corpora first, then "coming soon" ones,
    // each showing short label + full description so the user picks accurately.
    const corpusEntries = Object.entries(SCRIPTURE_CORPORA);
    const sortedKeys = corpusEntries
      .map(([k, c]) => ({ k, c, available: !!c.available }))
      .sort((a, b) => (b.available - a.available));
    const popupRows = sortedKeys.map(({ k, c, available }) => `
      <div class="scripture-corpus-option${k === corpusKey ? ' active' : ''}${available ? '' : ' soon'}" data-key="${k}">
        <span class="sc-short">${shortLabelFor(k, c)}</span>
        <span class="sc-desc">${c.label}${available ? '' : ' · coming soon'}</span>
      </div>`).join('');

    document.getElementById('view-controls').innerHTML = `
      <div class="scripture-corpus-wrap">
        <button class="scripture-corpus-btn" id="scripture-corpus-btn" title="Pick a holy corpus">
          <span class="scb-name" id="scripture-corpus-btn-label">${currentShort}</span>
          <span class="scb-caret">▾</span>
        </button>
        <div class="scripture-corpus-popup" id="scripture-corpus-popup">${popupRows}</div>
      </div>
      <button class="btn btn-mini" id="btn-scripture-labels">labels: all</button>
      <button class="btn btn-mini" id="btn-scripture-trails">entity trails: on</button>
      <button class="btn btn-mini" id="btn-scripture-recenter">recenter</button>
      <button class="btn btn-mini scripture-lock-chip" id="btn-scripture-lock-clear" style="display:none">↺ clear lock <span class="lock-count" id="scripture-lock-count">0</span></button>
    `;

    // Wire the custom dropdown — button toggles popup; row click picks corpus; outside click closes.
    const corpusBtn = document.getElementById('scripture-corpus-btn');
    const corpusPopup = document.getElementById('scripture-corpus-popup');
    const closeCorpusPopup = () => {
      corpusBtn.classList.remove('open');
      corpusPopup.classList.remove('open');
    };
    const openCorpusPopup = () => {
      corpusBtn.classList.add('open');
      corpusPopup.classList.add('open');
    };
    corpusBtn.onclick = (ev) => {
      ev.stopPropagation();
      if (corpusPopup.classList.contains('open')) closeCorpusPopup(); else openCorpusPopup();
    };
    corpusPopup.querySelectorAll('.scripture-corpus-option').forEach(row => {
      row.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const key = row.dataset.key;
        STATE.scriptureCorpus = key;
        closeCorpusPopup();
        setView('scripture');
      });
    });
    // One-shot outside-click + Esc close binding (only bind once per session).
    if (!window._scriptureCorpusOutsideBound) {
      window._scriptureCorpusOutsideBound = true;
      document.addEventListener('click', (ev) => {
        const popup = document.getElementById('scripture-corpus-popup');
        if (!popup || !popup.classList.contains('open')) return;
        const btn = document.getElementById('scripture-corpus-btn');
        if (popup.contains(ev.target) || (btn && btn.contains(ev.target))) return;
        popup.classList.remove('open');
        if (btn) btn.classList.remove('open');
      });
      document.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Escape') return;
        const popup = document.getElementById('scripture-corpus-popup');
        if (popup && popup.classList.contains('open')) {
          popup.classList.remove('open');
          const btn = document.getElementById('scripture-corpus-btn');
          if (btn) btn.classList.remove('open');
        }
      });
    }

    const W = svg.node().clientWidth, H = svg.node().clientHeight;
    const cx = W / 2, cy = H / 2;

    // Corpora that aren't wired up yet render an empty-state card and bail.
    if (!corpus.available) {
      const g = svg.append('g');
      g.append('text').attr('class', 'scripture-empty')
        .attr('x', cx).attr('y', cy - 14).attr('text-anchor', 'middle')
        .text(corpus.label);
      g.append('text').attr('class', 'scripture-empty sub')
        .attr('x', cx).attr('y', cy + 14).attr('text-anchor', 'middle')
        .text('corpus not yet wired up — pick Holy Bible to start');
      return;
    }

    // ----- Compute the per-book entity sets -----
    // For each book, we collect the (deity/person/event) ids that bind to it via
    // the SCRIPTURE_BIND_TYPES edge set. An entity that appears in multiple books
    // becomes multiple node *instances* (one per book), connected later by faint
    // trail-curves.
    const allBookIds = new Set();
    corpus.sections.forEach(s => s.books.forEach(b => allBookIds.add(b.id)));

    // entityId → array of bookIds it appears in (for trail edges).
    const entityBookMap = new Map();
    // Per book, sorted entity-id list (deterministic ordering).
    const bookEntities = new Map();   // bookId → [{entityId, entityNode}]
    let missingBookCount = 0;
    corpus.sections.forEach(section => {
      section.books.forEach(b => {
        // Cache the resolved id so click + detail-panel selection target the real
        // node regardless of which id-form it's stored under in data.js.
        b.resolvedId = scriptureResolveBookId(b.id);
        if (!b.resolvedId) { missingBookCount++; bookEntities.set(b.id, []); return; }
        const ents = [...scriptureEntitiesForBook(b.id)]
          .map(eid => ({ entityId: eid, entityNode: NODES_BY_ID[eid] }))
          .filter(x => x.entityNode);
        // Stable order: hub entities (high vault-degree) first so the eye finds
        // famous figures quickly inside crowded hulls.
        ents.sort((a, b) => (DEGREE.get(b.entityId) || 0) - (DEGREE.get(a.entityId) || 0));
        bookEntities.set(b.id, ents);
        ents.forEach(e => {
          if (!entityBookMap.has(e.entityId)) entityBookMap.set(e.entityId, []);
          entityBookMap.get(e.entityId).push(b.id);
        });
      });
    });

    // ----- Layout: book wedges grouped by section -----
    // Pie-section hulls: each book occupies an annular sector from Rinner to Router
    // bounded by the book's [a0, a1]. Entities are placed in a polar grid INSIDE
    // the sector with enough padding from each boundary that they have room to grow.
    const Router = Math.min(W, H) * 0.43;
    const Rinner = Router * 0.20;
    const bookOuterR = Router;              // book-label ring sits just outside
    const sectionLabelR = Router + 56;     // section super-labels (outermost)

    // Weight per book = sqrt(entity count + 1) so books w/ many entities get more arc,
    // but a book w/ 0 entities still occupies a tiny slice.
    const SECTION_GAP = 0.055;             // ~3.2° gap between sections
    const BOOK_GAP    = 0.018;             // ~1.0° gap between books inside a section
    const allBooks = corpus.sections.flatMap(s => s.books.map(b => ({ ...b, sectionId: s.id, sectionColor: s.color })));
    const bookWeights = allBooks.map(b => Math.sqrt((bookEntities.get(b.id) || []).length + 1));
    const totalWeight = d3.sum(bookWeights);
    const numSections = corpus.sections.length;
    const numInterBookGaps = allBooks.length - numSections;
    const totalGap = SECTION_GAP * numSections + BOOK_GAP * Math.max(0, numInterBookGaps);
    const arcBudget = (2 * Math.PI) - totalGap;

    // Cursor starts at 12 o'clock and rotates clockwise.
    let cursor = -Math.PI;   // -π is 12 o'clock in our polarXY convention; rotate clockwise from there
    // Actually with polarXY(angle, r) = [r*sin(angle), -r*cos(angle)]:
    //   angle=0     → (0, -r)  = TOP (12 o'clock)
    //   angle=π/2   → (r, 0)   = RIGHT (3 o'clock)
    // So cursor should start at 0 to begin at 12 o'clock and increment clockwise.
    cursor = 0;

    const bookLayout = {};   // bookId → { a0, a1, center, sectionId, sectionColor, label, members }
    const sectionRanges = {}; // sectionId → { a0, a1, label, color }

    corpus.sections.forEach(section => {
      const sStart = cursor;
      section.books.forEach((b, i) => {
        const w = Math.sqrt((bookEntities.get(b.id) || []).length + 1);
        const arc = (w / totalWeight) * arcBudget;
        bookLayout[b.id] = {
          a0: cursor,
          a1: cursor + arc,
          center: cursor + arc / 2,
          sectionId: section.id,
          sectionColor: section.color,
          label: b.label,
        };
        cursor += arc;
        if (i < section.books.length - 1) cursor += BOOK_GAP;
      });
      sectionRanges[section.id] = { a0: sStart, a1: cursor, label: section.label, color: section.color };
      cursor += SECTION_GAP;
    });

    // ----- SVG root + zoom -----
    const g = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.4, 4]).on('zoom', ev => {
      g.attr('transform', ev.transform);
      const ro = document.getElementById('zm-readout');
      if (ro) ro.textContent = ev.transform.k.toFixed(2) + '×';
      updateLOD(ev.transform.k);
    });
    svg.call(zoom);
    const _zmIn = document.getElementById('zm-in');
    const _zmOut = document.getElementById('zm-out');
    const _zmBase = document.getElementById('zm-reset');
    if (_zmIn)   _zmIn.onclick   = () => svg.transition().duration(220).call(zoom.scaleBy, 1.4);
    if (_zmOut)  _zmOut.onclick  = () => svg.transition().duration(220).call(zoom.scaleBy, 1 / 1.4);
    if (_zmBase) _zmBase.onclick = () => svg.transition().duration(380).call(zoom.transform, d3.zoomIdentity);

    const hullLayer     = g.append('g').attr('class', 'scripture-hull-layer');
    const sectionLayer  = g.append('g').attr('class', 'scripture-section-layer');
    const trailLayer    = g.append('g').attr('class', 'scripture-trail-layer');
    const lockEdgeLayer = g.append('g').attr('class', 'scripture-lock-edge-layer');
    const nodeLayer     = g.append('g').attr('class', 'scripture-node-layer');
    const labelLayer    = g.append('g').attr('class', 'scripture-label-layer');

    // ----- Section super-arcs + labels (outermost) -----
    const sectionArc = d3.arc()
      .innerRadius(Router + 28)
      .outerRadius(Router + 29);
    Object.entries(sectionRanges).forEach(([sid, s]) => {
      sectionLayer.append('path').attr('class', 'scripture-section-arc')
        .attr('d', sectionArc({ startAngle: s.a0, endAngle: s.a1 }))
        .attr('transform', `translate(${cx},${cy})`)
        .attr('stroke', s.color);

      // Section label — placed at the section's center angle, rotated tangentially.
      const cAng = (s.a0 + s.a1) / 2;
      const [lx, ly] = polarXY(cAng, sectionLabelR);
      const x = cx + lx, y = cy + ly;
      // Smart text-anchor + dy mirroring Documents view's family-label code.
      const dx = Math.sin(cAng);
      const dy = -Math.cos(cAng);
      const anchor = dx > 0.35 ? 'start' : dx < -0.35 ? 'end' : 'middle';
      const baseline = dy < -0.55 ? '0em' : dy > 0.55 ? '0.85em' : '0.35em';
      sectionLayer.append('text').attr('class', 'scripture-section-label')
        .attr('x', x).attr('y', y)
        .attr('text-anchor', anchor).attr('dy', baseline)
        .text(s.label);
    });

    // ----- Book labels (per-book, on outer ring) -----
    const bookLabelSel = labelLayer.selectAll('text.scripture-book-label')
      .data(allBooks, b => b.id).enter().append('text')
      .attr('class', 'scripture-book-label')
      .attr('text-anchor', b => {
        const a = bookLayout[b.id].center;
        const dx = Math.sin(a);
        if (dx >  0.35) return 'start';
        if (dx < -0.35) return 'end';
        return 'middle';
      })
      .attr('dy', b => {
        const a = bookLayout[b.id].center;
        const dy = -Math.cos(a);
        if (dy < -0.55) return '0em';
        if (dy >  0.55) return '0.85em';
        return '0.35em';
      })
      .attr('x', b => {
        const a = bookLayout[b.id].center;
        const [lx] = polarXY(a, bookOuterR + 18);
        return cx + lx;
      })
      .attr('y', b => {
        const a = bookLayout[b.id].center;
        const [, ly] = polarXY(a, bookOuterR + 18);
        return cy + ly;
      })
      .text(b => b.label);

    // ----- Build node instances: one instance per (book, entity), distributed in a
    // polar grid INSIDE the book's pie sector so the entities fill the wedge instead
    // of clumping at a single radius. Force sim then just refines spacing + handles
    // hover. The grid aspect is matched to the wedge aspect so a tall-thin wedge gets
    // few-cols / many-rows and a fat wedge gets many-cols / few-rows.
    const allInstances = [];
    const RAD_PAD = 16;    // px of clearance from the inner / outer radial walls
    const ANG_PAD = 0.014; // rad of clearance from the angular walls of each wedge
    allBooks.forEach(b => {
      const ents = bookEntities.get(b.id) || [];
      const layout = bookLayout[b.id];
      const N = ents.length;
      if (N === 0) return;

      const r0 = Rinner + RAD_PAD;
      const r1 = Router - RAD_PAD;
      const a0 = layout.a0 + ANG_PAD;
      const a1 = layout.a1 - ANG_PAD;
      const rSpan = Math.max(12, r1 - r0);
      const aSpan = Math.max(0.012, a1 - a0);
      // Mean tangential arc-length at the radial midpoint, used to size the grid.
      const tangSpan = ((r0 + r1) / 2) * aSpan;
      const aspect = tangSpan / rSpan;
      // Pick cols/rows so each cell is roughly square in angular-radial terms.
      const cols = Math.max(1, Math.min(N, Math.round(Math.sqrt(N * aspect))));
      const rows = Math.ceil(N / cols);

      ents.forEach((e, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        // Use cell centers so each entity sits in the middle of its grid slot.
        const colT = (col + 0.5) / cols;
        const rowT = (row + 0.5) / rows;
        const ang = a0 + aSpan * colT;
        const r = r0 + rSpan * rowT;
        const [bx, by] = polarXY(ang, r);
        const anchorX = cx + bx, anchorY = cy + by;
        allInstances.push({
          id: `${b.id}::${e.entityId}`,
          entityId: e.entityId,
          bookId: b.id,
          sectionId: layout.sectionId,
          sectionColor: layout.sectionColor,
          d: e.entityNode,
          x: anchorX, y: anchorY,
          anchorX, anchorY,
        });
      });
    });

    // Trails — only for entities present in ≥2 books.
    const trailPairs = [];
    entityBookMap.forEach((bookIds, entityId) => {
      if (bookIds.length < 2) return;
      // Connect consecutive books in canonical order (i.e., the section/book ring order),
      // which gives a clean polyline rather than a hairball.
      const orderedBookIds = bookIds.slice().sort((a, b) => bookLayout[a].center - bookLayout[b].center);
      for (let i = 0; i < orderedBookIds.length - 1; i++) {
        trailPairs.push({
          entityId,
          sourceInstanceId: `${orderedBookIds[i]}::${entityId}`,
          targetInstanceId: `${orderedBookIds[i + 1]}::${entityId}`,
        });
      }
    });
    const instanceById = new Map(allInstances.map(inst => [inst.id, inst]));

    // ----- Hub set (per entity) for label-LOD: top 12% by vault-degree across the corpus -----
    const uniqueEntityIds = [...new Set(allInstances.map(i => i.entityId))];
    const entityHubSet = new Set(
      [...uniqueEntityIds]
        .map(eid => ({ id: eid, deg: DEGREE.get(eid) || 0 }))
        .sort((a, b) => b.deg - a.deg)
        .slice(0, Math.max(1, Math.ceil(uniqueEntityIds.length * 0.12)))
        .map(x => x.id)
    );

    // ----- Pie-section hulls: each book = one annular sector [Rinner..Router] × [a0..a1] -----
    // This gives a visible Pantheon-style boundary that bounds its entities and leaves
    // space for them to grow. Static path — no force-sim update needed.
    const sectorArc = d3.arc()
      .innerRadius(Rinner)
      .outerRadius(Router)
      .padAngle(0.0)
      .cornerRadius(2);
    const hullSel = hullLayer.selectAll('path.scripture-hull')
      .data(allBooks, b => b.id).enter().append('path')
      .attr('class', 'scripture-hull')
      .attr('d', b => sectorArc({ startAngle: bookLayout[b.id].a0, endAngle: bookLayout[b.id].a1 }))
      .attr('transform', `translate(${cx},${cy})`)
      .attr('fill', b => bookLayout[b.id].sectionColor)
      .attr('stroke', b => bookLayout[b.id].sectionColor)
      .attr('data-book-id', b => b.id)
      .on('mouseenter', function (ev, b) {
        showTooltip(
          `<div class="ttitle">${b.label}</div>
           <div class="tmeta">${(bookEntities.get(b.id) || []).length} named entities · ${corpus.label}</div>`, ev);
        d3.select(this).classed('active', true);
      })
      .on('mousemove', (ev) => tooltip.style('left', (ev.clientX + 14) + 'px').style('top', (ev.clientY + 14) + 'px'))
      .on('mouseleave', function () {
        hideTooltip();
        d3.select(this).classed('active', false);
      })
      .on('click', function (ev, b) {
        // Selecting the hull opens the underlying document node in the detail panel.
        // stopPropagation so the SVG-background-click handler doesn't fire and
        // clear the sticky lock — opening a book's detail should not destroy the
        // user's investigation pinboard.
        ev.stopPropagation();
        if (b.resolvedId) selectNode(b.resolvedId, true);
      });

    // ----- Trail curves -----
    const trailSel = trailLayer.selectAll('path.scripture-trail')
      .data(trailPairs, t => t.entityId + '::' + t.sourceInstanceId + '::' + t.targetInstanceId)
      .enter().append('path')
      .attr('class', 'scripture-trail')
      .attr('data-entity-id', t => t.entityId);

    // ----- Node instances -----
    const nodeSel = nodeLayer.selectAll('g.scripture-node-wrap')
      .data(allInstances, n => n.id).enter().append('g')
      .attr('class', 'scripture-node-wrap')
      .on('mouseenter', function (ev, n) {
        showTooltip(
          `${tooltipThumb(n.d)}<div class="ttitle">${n.d.title}</div>
           <div class="tmeta">${n.d.type} · ${bookLayout[n.bookId].label}</div>
           ${(entityBookMap.get(n.entityId) || []).length > 1
              ? `<div class="tmeta">appears in ${(entityBookMap.get(n.entityId) || []).length} books across this corpus</div>`
              : ''}`, ev);
        hoverEntityFocus(n.entityId);
      })
      .on('mousemove', (ev) => tooltip.style('left', (ev.clientX + 14) + 'px').style('top', (ev.clientY + 14) + 'px'))
      .on('mouseleave', () => { hideTooltip(); clearHoverFocus(); })
      .on('click', (ev, n) => {
        // Pantheon-style sticky / additive selection: clicking a node locks its
        // entity + its 1-hop vault-graph neighbors. Clicking another connected
        // entity EXTENDS the lock; clicking an unrelated entity RESETS the lock.
        // Click on empty SVG background clears the lock entirely. The locked
        // set lights up all instances of each entity across all books, all
        // trail-arcs between them, and the hulls that carry them — a persistent
        // investigation pinboard you build by clicking.
        ev.stopPropagation();
        selectNode(n.entityId, true);
        const nbrs = neighborsOf(n.entityId, 1);
        if (!STATE.lockedSet) STATE.lockedSet = new Set();
        const cur = STATE.lockedSet;
        let touchesLock = false;
        if (cur.size > 0) {
          for (const id of nbrs) { if (cur.has(id)) { touchesLock = true; break; } }
        }
        if (cur.size === 0 || !touchesLock) {
          STATE.lockedSet = new Set(nbrs);
        } else {
          nbrs.forEach(id => cur.add(id));
        }
        applyLock();
      });

    nodeSel.append('path').attr('class', 'scripture-node')
      .attr('data-tier', n => n.d._tier ?? 'none')
      .attr('d', n => {
        const r = 3.0 + Math.min(2.2, Math.sqrt(DEGREE.get(n.entityId) || 0) * 0.5);
        // Scripture-specific shape override: persons render as an EQUAL-ASPECT 45°
        // rotated square (visual diagonal = 2r, same bounding box as the deity circle)
        // instead of d3.symbolDiamond which is a tall lozenge. This keeps the
        // shape silhouettes deity-circle vs. person-diamond legibly distinct while
        // making them read at the same visual size.
        if (n.d.type === 'person') {
          return `M 0,${-r} L ${r},0 L 0,${r} L ${-r},0 Z`;
        }
        return d3.symbol().type(shapeFor(n.d)).size(shapeSizeFor(n.d, r))();
      })
      .attr('fill', n => nodeColor(n.d));

    const nodeLabelSel = nodeLayer.selectAll('g.scripture-node-wrap').append('text')
      .attr('class', n => 'scripture-node-label' + (entityHubSet.has(n.entityId) ? ' hub' : ''))
      .attr('dy', -7)
      .text(n => n.d.title.length > 22 ? n.d.title.slice(0, 20) + '…' : n.d.title);

    // ----- Force simulation -----
    // The polar grid already separates entities by design; the sim now just adds
    // tiny micro-separation when two grid cells are close enough that node + label
    // would visually crowd. Strong anchor pull keeps entities at their cell.
    const sim = d3.forceSimulation(allInstances)
      .alphaDecay(0.06)
      .force('x', d3.forceX(d => d.anchorX).strength(0.55))
      .force('y', d3.forceY(d => d.anchorY).strength(0.55))
      .force('charge', d3.forceManyBody().strength(-2).distanceMax(40))
      .force('collide', d3.forceCollide().radius(d => 6 + Math.sqrt(DEGREE.get(d.entityId) || 0) * 0.4).iterations(1))
      .on('tick', tick);

    let lockEdgeSel = lockEdgeLayer.selectAll('path');   // populated by applyLock()

    function tick() {
      nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
      trailSel.attr('d', t => {
        const s = instanceById.get(t.sourceInstanceId);
        const u = instanceById.get(t.targetInstanceId);
        if (!s || !u) return null;
        // Bezier curve bent toward the center — keeps long cross-canvas trails readable.
        const mx = (s.x + u.x) / 2, my = (s.y + u.y) / 2;
        const k = 0.32;
        const cxp = mx + (cx - mx) * k, cyp = my + (cy - my) * k;
        return `M ${s.x},${s.y} Q ${cxp},${cyp} ${u.x},${u.y}`;
      });
      // Within-wedge lock-edges follow live entity positions on every tick.
      if (lockEdgeSel && !lockEdgeSel.empty()) {
        lockEdgeSel.attr('d', d => `M ${d.s.x},${d.s.y} L ${d.t.x},${d.t.y}`);
      }
    }

    // ----- LOD / hover-focus / control-button wiring -----
    // Default to 'all' — with the new polar-grid layout entities are already
    // distributed across the pie sector so showing every label by default
    // reads cleanly. User can toggle to 'hub' or 'off' if a particular corpus
    // gets too dense.
    let labelMode = 'all';      // 'all' | 'hub' | 'off'
    let trailsOn  = true;

    function updateLOD(k) {
      nodeLabelSel.style('opacity', d => {
        if (labelMode === 'off') return 0;
        if (labelMode === 'all') return 1;
        if (k >= 1.6) return 1;
        return entityHubSet.has(d.entityId) ? 1 : 0;
      }).style('font-size', () => {
        // Past 100% zoom, grow gently. Past 200%, lock so labels don't bloat.
        const growth = 1 + 0.4 * Math.max(0, Math.min(1, (k - 1) / 2));
        const eff = Math.max(1, k);
        return (9.2 * growth / eff).toFixed(2) + 'px';
      });
      trailSel.style('display', trailsOn ? null : 'none');
    }

    function hoverEntityFocus(entityId) {
      // While a sticky lock is active, hover should AUGMENT the lock (light up the
      // hovered entity on top of the locked subgraph), not override it. The cleanest
      // way is to compute the union and treat it as a transient lock-state for the
      // hover. We use a separate set of CSS classes — the `hot` class stays for
      // locked items; the hovered entity gets `hover-hot` and dimming is computed
      // against (locked ∪ hovered).
      const locked = STATE.lockedSet || new Set();
      const transient = new Set(locked);
      transient.add(entityId);
      nodeSel.select('path.scripture-node')
        .classed('hot', d => locked.has(d.entityId) || d.entityId === entityId)
        .classed('dim', d => !transient.has(d.entityId));
      nodeLabelSel
        .classed('hot', d => locked.has(d.entityId) || d.entityId === entityId)
        .classed('dim', d => !transient.has(d.entityId));
      trailSel
        .classed('hot', t => transient.has(t.entityId))
        .classed('dim', t => !transient.has(t.entityId));
      const carriers = new Set();
      allInstances.forEach(i => { if (transient.has(i.entityId)) carriers.add(i.bookId); });
      hullSel.classed('dim', b => !carriers.has(b.id));
      bookLabelSel
        .classed('active', b => carriers.has(b.id))
        .classed('dim', b => !carriers.has(b.id));
    }
    function clearHoverFocus() {
      // If a sticky lock is active, leaving hover should snap BACK to the lock
      // state — not blank everything. If no lock, fully clear.
      if (STATE.lockedSet && STATE.lockedSet.size > 0) {
        applyLock();
        return;
      }
      nodeSel.select('path.scripture-node').classed('hot', false).classed('dim', false);
      nodeLabelSel.classed('hot', false).classed('dim', false);
      trailSel.classed('hot', false).classed('dim', false);
      hullSel.classed('dim', false);
      bookLabelSel.classed('active', false).classed('dim', false);
    }

    // Sticky-lock highlighter (Pantheon parity). The lockedSet is entity-id keyed;
    // every per-book INSTANCE of a locked entity lights up, every trail-arc whose
    // entity is locked lights up, every hull carrying any locked entity is active.
    // Plus: every VAULT EDGE between two locked entities is drawn as a within-wedge
    // line wherever they share a book — so clicking Nephthys actually draws the
    // visible line into Geb's instance in the same hull (and equally for Geb→Osiris,
    // Geb→Isis, Geb→Set, etc., as the user extends the lock).
    function applyLock() {
      syncLockChip();
      const locked = STATE.lockedSet || new Set();
      if (locked.size === 0) {
        nodeSel.select('path.scripture-node').classed('hot', false).classed('dim', false);
        nodeLabelSel.classed('hot', false).classed('dim', false);
        trailSel.classed('hot', false).classed('dim', false);
        hullSel.classed('dim', false);
        bookLabelSel.classed('active', false).classed('dim', false);
        renderLockEdges([]);
        return;
      }
      nodeSel.select('path.scripture-node')
        .classed('hot', d => locked.has(d.entityId))
        .classed('dim', d => !locked.has(d.entityId));
      nodeLabelSel
        .classed('hot', d => locked.has(d.entityId))
        .classed('dim', d => !locked.has(d.entityId));
      trailSel
        .classed('hot', t => locked.has(t.entityId))
        .classed('dim', t => !locked.has(t.entityId));
      const carriers = new Set();
      allInstances.forEach(i => { if (locked.has(i.entityId)) carriers.add(i.bookId); });
      hullSel.classed('dim', b => !carriers.has(b.id));
      bookLabelSel
        .classed('active', b => carriers.has(b.id))
        .classed('dim', b => !carriers.has(b.id));
      renderLockEdges(computeLockEdges(locked));
    }

    // For every vault edge whose BOTH endpoints are locked entities AND both have
    // instances in the same book, produce a within-wedge line spec
    // {s: srcInstance, t: tgtInstance, type: edgeType}. Pairs are deduped (parent-of
    // ↔ child-of round-trips fold to one line). Non-entity endpoints (documents,
    // themes, traditions) are filtered out so the canvas stays readable — entity-
    // to-entity edges are the meaningful ones for biographical investigation.
    function computeLockEdges(locked) {
      if (!locked || locked.size < 2) return [];
      const ENT = new Set(['deity', 'person', 'event']);
      // Index instances by entityId for fast pair-finding.
      const byEntity = new Map();
      allInstances.forEach(i => {
        if (!byEntity.has(i.entityId)) byEntity.set(i.entityId, []);
        byEntity.get(i.entityId).push(i);
      });
      const out = [];
      const seen = new Set();
      EDGES.forEach(e => {
        if (e.source === e.target) return;
        if (!locked.has(e.source) || !locked.has(e.target)) return;
        const sN = NODES_BY_ID[e.source];
        const tN = NODES_BY_ID[e.target];
        if (!sN || !tN || !ENT.has(sN.type) || !ENT.has(tN.type)) return;
        // Pair-dedupe (regardless of direction).
        const pairKey = e.source < e.target
          ? `${e.source}|${e.target}` : `${e.target}|${e.source}`;
        if (seen.has(pairKey)) return;
        seen.add(pairKey);
        const sIns = byEntity.get(e.source) || [];
        const tIns = byEntity.get(e.target) || [];
        // Connect ALL within-book pairs (handles same-book multi-instance edge cases).
        sIns.forEach(s => tIns.forEach(t => {
          if (s.bookId === t.bookId) out.push({ s, t, type: e.type });
        }));
      });
      return out;
    }

    function renderLockEdges(edges) {
      const sel = lockEdgeLayer.selectAll('path.scripture-lock-edge').data(edges);
      sel.exit().remove();
      lockEdgeSel = sel.enter().append('path')
        .attr('class', 'scripture-lock-edge')
        .attr('fill', 'none')
        .merge(sel)
        .attr('stroke', d => (EDGE_STYLE[d.type] || EDGE_DEFAULT).c)
        .attr('data-edge-type', d => d.type)
        .attr('d', d => `M ${d.s.x},${d.s.y} L ${d.t.x},${d.t.y}`);
    }

    function syncLockChip() {
      const chip = document.getElementById('btn-scripture-lock-clear');
      const count = document.getElementById('scripture-lock-count');
      if (!chip || !count) return;
      // Show only the count of entity-ids in the lock that actually correspond
      // to Scripture entity instances on this canvas — otherwise leaking-in lock
      // items from Pantheon (e.g., deities with no Bible book) would inflate
      // the chip count and confuse the user.
      const locked = STATE.lockedSet || new Set();
      const visibleEntityIds = new Set(allInstances.map(i => i.entityId));
      let n = 0;
      locked.forEach(id => { if (visibleEntityIds.has(id)) n++; });
      chip.style.display = n > 0 ? '' : 'none';
      count.textContent = n;
    }

    document.getElementById('btn-scripture-labels').onclick = (ev) => {
      labelMode = labelMode === 'all' ? 'hub' : labelMode === 'hub' ? 'off' : 'all';
      ev.target.textContent = 'labels: ' + labelMode;
      updateLOD(1);
    };
    document.getElementById('btn-scripture-trails').onclick = (ev) => {
      trailsOn = !trailsOn;
      ev.target.textContent = 'entity trails: ' + (trailsOn ? 'on' : 'off');
      ev.target.classList.toggle('active', trailsOn);
      updateLOD(1);
    };
    document.getElementById('btn-scripture-recenter').onclick = () => {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    };
    document.getElementById('btn-scripture-lock-clear').onclick = () => {
      STATE.lockedSet = new Set();
      applyLock();
    };

    // Background click on the canvas (truly empty SVG area — not a node or hull)
    // clears the sticky lock. Node click handlers stopPropagation so they don't
    // hit this; the hull click handlers also stop propagation so the user can
    // open a book's detail panel without losing their lock.
    svg.on('click', (ev) => {
      const tag = ev.target.tagName;
      if (tag === 'svg' || ev.target === svg.node()) {
        if (STATE.lockedSet && STATE.lockedSet.size > 0) {
          STATE.lockedSet = new Set();
          applyLock();
        }
      }
    });

    // ----- Legend (left side, mirroring Documents view) -----
    legend.style('display', 'block').html(
      `<div class="ltitle">Sections · ${corpus.label}</div>` +
      corpus.sections.map(s =>
        `<div class="lrow"><span class="lswatch" style="background:${s.color}"></span><span>${s.label}</span><span class="lcount">${s.books.length}</span></div>`
      ).join('') +
      (missingBookCount ? `<div class="lrow" style="opacity:0.6"><span>· ${missingBookCount} book(s) not yet in vault</span></div>` : '')
    );

    updateLOD(1);
    // Restore any pre-existing sticky lock (preserves the investigation pinboard
    // across view re-renders triggered by corpus-dropdown switches, label-toggle
    // clicks, window resizes, etc.).
    applyLock();
  }
};

// ============================================================
// ============================================================
// ALCHEMY — empty canvas. User adds nodes by name; bridges between them appear
// automatically as the shortest path in the edge graph (capped at 5 hops to stay readable).
// User-picked nodes are draggable + deletable; bridge nodes are clickable but ephemeral.
// ============================================================

// ALCHEMY PRESETS — curated cross-tradition starting constellations. Each preset is a list
// of endpoint+waypoint node IDs that get pushed into STATE.alchemyPicks; the existing
// shortest-path renderer auto-discovers the bridge nodes between them via the vault's
// edge graph. So a 12-pick preset typically surfaces ~20-30 nodes on canvas with the
// connective transmission edges drawn between them. This is the visual mechanism that
// realizes the "MASSIVE-win cross-tradition transmission spine" demos.
//
// All 78 node IDs verified against vault canonical-slugs. See AUDIT/14 for design rationale.
const ALCHEMY_PRESETS = [
  {
    id: 'astrology-3500-year-spine',
    name: '3,500-Year Astrology Spine',
    headline: 'The longest continuously-attested intellectual tradition in the vault — longer than Judaism, Christianity, or Islam. Documented institutional and textual transmission step-by-step across Mesopotamia, Egypt, Greece, Rome, Persia, Islam, Latin Renaissance, and modern occult revival.',
    picks: [
      'phase-1-019-enuma-anu-enlil', 'berossus',
      'hermes-trismegistus-pseudepigraphic-author', 'firmicus-maternus',
      'al-kindi', 'event-arabic-harranian-hermetica-c800-1000',
      'cornelius-agrippa', 'john-dee',
      'helena-blavatsky', 'aleister-crowley',
      'fernando-pessoa', 'manuel-j-gandra',
    ],
  },
  {
    id: 'cross-tradition-flood',
    name: 'Cross-Tradition Flood',
    headline: 'The flood narrative across nine Old- and New-World traditions, with the 1872 George Smith decipherment as the modern reception node that triggered the entire comparative-religion field.',
    picks: [
      'atrahasis-flood-hero', 'utnapishtim', 'noah', 'deucalion',
      'matsya-avatar', 'yu-the-great', 'bergelmir', 'gonggong',
      'george-smith-cuneiformist',
      'phase-1-006-atrahasis', 'phase-1-016-eridu-genesis-flood',
    ],
  },
  {
    id: 'hermetic-corpus-reception',
    name: 'Hermetic Corpus Reception',
    headline: 'The pseudonymous Hermetic Corpus from its Hellenistic-Egyptian origin (c. 100-300 CE) through Ficino\'s 1463 translation that launched the Renaissance, Casaubon\'s 1614 redating that demolished it, and the modern theosophical reception that resurrected it.',
    picks: [
      'hermes-trismegistus-pseudepigraphic-author',
      'phase-4-011-corpus-hermeticum-i', 'phase-4-073-tabula-smaragdina',
      'marsilio-ficino', 'event-ficino-corpus-hermeticum-translation-1463',
      'event-casaubon-redates-hermetica-1614', 'isaac-casaubon',
      'helena-blavatsky', 'fernando-pessoa',
    ],
  },
  {
    id: 'isis-mary-theotokos',
    name: 'Isis → Mary Theotokos',
    headline: 'The Hellenistic Isis cult\'s iconographic transmission into early-Christian Marian devotion, formalized at the Council of Ephesus 431 — one of the most-cited Christianity-from-older-tradition transmission edges.',
    picks: [
      'isis', 'isis-hellenistic',
      'event-council-of-ephesus-431',
      'mary-theotokos', 'mary-mother-of-jesus', 'cyril-of-alexandria',
    ],
  },
  {
    id: 'templar-survival-portuguese',
    name: 'Templar Survival → Portuguese Caravels',
    headline: 'The 200-year documented institutional Templar-survival via the Portuguese Order of Christ (1319). The cross of Christ on Vasco da Gama\'s caravel sails is the iconographic endpoint — distinct from speculative Templar-survival fabrications.',
    picks: [
      'hugues-de-payens', 'event-council-of-troyes-1129',
      'jacques-de-molay', 'event-trial-of-templars-1307-1314',
      'phase-5-038-chinon-parchment-1308',
      'event-order-of-christ-foundation-1319',
      'tradition-order-of-christ', 'cross-order-of-christ',
    ],
  },
  {
    id: 'pessoa-esoteric-network',
    name: 'Pessoa\'s Esoteric Network',
    headline: 'Fernando Pessoa as the modernist-literary endpoint of multiple esoteric traditions: Sebastianismo (Bandarra), Thelema (Crowley + the 1930 Boca do Inferno hoax), Theosophy (Blavatsky, whom he translated), and Portuguese hermeticism (Carvalho Monteiro\'s Regaleira → Gandra\'s contemporary scholarship).',
    picks: [
      'fernando-pessoa', 'phase-7-037-pessoa-mensagem',
      'goncalo-annes-bandarra', 'phase-6-040-bandarra-trovas',
      'aleister-crowley', 'helena-blavatsky',
      'antonio-carvalho-monteiro', 'manuel-j-gandra',
    ],
  },
  {
    id: 'watchers-forbidden-knowledge',
    name: 'Watchers — Forbidden Knowledge',
    headline: 'The Enochic narrative of fallen-angel teaching — astrology, metallurgy, and magic as transgressive forbidden knowledge. The principal pre-Christian Jewish anti-astrology framing, and the doctrinal counter-pole to the integration-tradition.',
    picks: [
      'phase-3-004-1-enoch', 'phase-4-081-mashafa-henok-geez-1-enoch',
      'kokabiel', 'baraqel', 'kasdeja', 'penemue', 'semyaza',
      'watchers-and-fallen-angels',
    ],
  },
  {
    id: 'demiurge-cross-tradition',
    name: 'Demiurge Cross-Tradition',
    headline: 'The demiurge concept from Plato\'s Timaeus through Gnostic appropriation (Valentinus, the Apocryphon of John) to Marcion\'s anti-cosmic canon — the principal Platonic philosophy → 2nd-century Christianity transmission edge.',
    picks: [
      'plato', 'phase-3-022-plato-timaeus-critias-atlantis',
      'valentinus', 'phase-4-002-apocryphon-of-john', 'marcion-of-sinope',
      'demiurge-gnostic', 'demiurge-platonic', 'demiurge',
    ],
  },
  {
    id: 'greco-buddhist',
    name: 'Greco-Buddhist Wedge',
    headline: 'The Hellenistic encounter with Buddhism: Alexander\'s campaigns, Aśoka\'s 3rd-c.-BCE Dhamma missions, Menander I, the Milindapañha, and the Kanishka-era iconographic synthesis that gave us the first images of the Buddha.',
    picks: [
      'asoka-maurya', 'menander-i-soter', 'kanishka',
      'phase-3-029-milindapanha', 'phase-3-030-asokan-edicts',
      'event-asokan-dhamma-missions-c-250-bce', 'tradition-greco-buddhism',
    ],
  },
  {
    id: 'aristotle-avicenna-aquinas',
    name: 'Aristotle → Avicenna → Aquinas',
    headline: 'The 600-year Aristotelian transmission through the Islamic Golden Age (al-Farabi, Avicenna, Averroes) into 13th-century Latin scholastic synthesis under Aquinas — the philosophical spine of medieval Christian and Islamic intellectual life.',
    picks: [
      'aristotle', 'phase-3-003-aristotle-metaphysics',
      'al-farabi', 'ibn-sina', 'phase-5-044-ibn-sina-kitab-al-shifa',
      'ibn-rushd', 'thomas-aquinas', 'phase-5-024-aquinas-summa-theologiae',
    ],
  },
];

// Custom user-saved trees live in localStorage under this key. Shape: an array of
// {id, name, picks, created} — same structure as ALCHEMY_PRESETS minus the headline
// (custom trees don't have rhetorical payload, just the user's name for them).
const ALCHEMY_CUSTOM_KEY = 'alch-custom-trees-v1';

function loadCustomTrees() {
  try {
    const raw = localStorage.getItem(ALCHEMY_CUSTOM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
}

function saveCustomTrees(trees) {
  try { localStorage.setItem(ALCHEMY_CUSTOM_KEY, JSON.stringify(trees)); } catch (e) {}
}

// Save the current STATE.alchemyPicks as a new custom tree under `name`.
// Returns the new tree's id, or null if the name is empty or no picks exist.
function saveCustomTree(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;
  if (!STATE.alchemyPicks || STATE.alchemyPicks.length === 0) return null;
  const trees = loadCustomTrees();
  const id = 'user-' + Date.now();
  trees.push({
    id, name: trimmed,
    picks: STATE.alchemyPicks.slice(),
    created: Date.now(),
  });
  saveCustomTrees(trees);
  return id;
}

function deleteCustomTree(id) {
  const trees = loadCustomTrees().filter(t => t.id !== id);
  saveCustomTrees(trees);
}

// Resolve a preset id to its definition. Works for canonical presets and for
// custom user-saved trees (which start with "user-").
function findPresetOrTree(presetId) {
  return ALCHEMY_PRESETS.find(p => p.id === presetId)
    || loadCustomTrees().find(t => t.id === presetId)
    || null;
}

// Load a preset (canonical) or custom tree into the Alchemy canvas.
// `mode` is 'replace' (default) or 'append'.
function alchemyLoadPreset(presetId, mode) {
  const preset = findPresetOrTree(presetId);
  if (!preset) return;
  const valid = preset.picks.filter(id => NODES_BY_ID[id]);
  if (mode === 'append') {
    const existing = new Set(STATE.alchemyPicks || []);
    valid.forEach(id => existing.add(id));
    STATE.alchemyPicks = Array.from(existing);
  } else {
    STATE.alchemyPicks = valid;
  }
  STATE.alchemyActivePreset = presetId;
  setView('alchemy');
}

// ALCHEMY LAYOUT POSITIONS — compute (x,y) for each node based on the active layout.
// Returns a Map<id, {x, y, fx, fy}>. For 'force' returns an empty Map (the d3 force
// simulation handles positioning organically). For non-force modes, returns positions
// to be pinned via fx/fy so the simulation respects the layout while still allowing
// link force and user drag interactions.
//
// `spacing` is 0-100; controls how spread out the layout is. The TYPE_BANDS table
// stratifies nodes vertically by type in linear mode so the timeline reads as
// multi-track (deities on top, traditions on bottom).
function alchemyLayoutPositions(nodes, picks, mode, spacing, W, H) {
  const cx = W / 2, cy = H / 2;
  const positions = new Map();
  if (mode === 'force' || nodes.length === 0) return positions;

  // Spacing factor: 0 → 0.5 (tight); 50 → 1.0 (default); 100 → 1.7 (loose).
  const sf = 0.5 + (spacing / 100) * 1.2;

  if (mode === 'linear') {
    // Sort by date_earliest. Nodes without a date go to the right edge.
    const TYPE_BANDS = {
      symbol:    0.18, deity:     0.30, theme:     0.40,
      person:    0.52, event:     0.62, document:  0.74,
      tradition: 0.86,
    };
    const withDate = nodes.filter(n => n.d && typeof n.d.date_earliest === 'number');
    const undated  = nodes.filter(n => !n.d || typeof n.d.date_earliest !== 'number');
    let dateMin = Infinity, dateMax = -Infinity;
    withDate.forEach(n => {
      if (n.d.date_earliest < dateMin) dateMin = n.d.date_earliest;
      if (n.d.date_earliest > dateMax) dateMax = n.d.date_earliest;
    });
    const dateRange = Math.max(1, dateMax - dateMin);
    const leftPad = 60, rightPad = 60;
    const usable = (W - leftPad - rightPad) * Math.min(1, sf);
    const offsetX = (W - usable) / 2 - (W - usable) / 2;   // center
    withDate.forEach(n => {
      const x = leftPad + ((n.d.date_earliest - dateMin) / dateRange) * usable + offsetX;
      const band = TYPE_BANDS[n.d.type] ?? 0.5;
      const y = H * band;
      positions.set(n.id, { x, y, fx: x, fy: y });
    });
    // Undated nodes: stack on the far right by type-band.
    const farRightX = W - 30;
    undated.forEach((n, i) => {
      const band = TYPE_BANDS[n.d?.type] ?? 0.5;
      const y = H * band + (i % 3 - 1) * 16;
      positions.set(n.id, { x: farRightX, y, fx: farRightX, fy: y });
    });
    return positions;
  }

  if (mode === 'circular') {
    // All nodes on one ring, sorted by type then title for predictable order.
    const typeOrder = { deity: 0, person: 1, document: 2, event: 3, theme: 4, tradition: 5, symbol: 6 };
    const sorted = nodes.slice().sort((a, b) => {
      const ta = typeOrder[a.d?.type] ?? 9, tb = typeOrder[b.d?.type] ?? 9;
      if (ta !== tb) return ta - tb;
      return (a.d?.title || '').localeCompare(b.d?.title || '');
    });
    const maxR = Math.min(W, H) / 2 - 80;
    const r = maxR * Math.max(0.3, sf * 0.7);
    sorted.forEach((n, i) => {
      const angle = (i / sorted.length) * Math.PI * 2 - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      positions.set(n.id, { x, y, fx: x, fy: y });
    });
    return positions;
  }

  if (mode === 'radial') {
    // Picks cluster on inner ring (or center if only one); bridges on outer ring(s).
    const pickSet = new Set(picks);
    const pickNodes = nodes.filter(n => pickSet.has(n.id));
    const bridgeNodes = nodes.filter(n => !pickSet.has(n.id));
    const maxR = Math.min(W, H) / 2 - 80;
    const innerR = maxR * 0.18 * sf;
    const outerR = maxR * Math.max(0.5, 0.55 * sf);

    if (pickNodes.length === 1) {
      // Single pick: place at center.
      positions.set(pickNodes[0].id, { x: cx, y: cy, fx: cx, fy: cy });
    } else {
      pickNodes.forEach((n, i) => {
        const angle = (i / pickNodes.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + innerR * Math.cos(angle);
        const y = cy + innerR * Math.sin(angle);
        positions.set(n.id, { x, y, fx: x, fy: y });
      });
    }
    bridgeNodes.forEach((n, i) => {
      const angle = (i / Math.max(1, bridgeNodes.length)) * Math.PI * 2 - Math.PI / 2;
      const x = cx + outerR * Math.cos(angle);
      const y = cy + outerR * Math.sin(angle);
      positions.set(n.id, { x, y, fx: x, fy: y });
    });
    return positions;
  }

  return positions;   // unknown mode → force fallback
}

// BFS shortest path between two node IDs using the NEIGHBORS adjacency map.
// Caps at maxHops to keep paths readable. Returns null if no path within the cap.
function alchemyShortestPath(srcId, dstId, maxHops) {
  if (srcId === dstId) return [srcId];
  const visited = new Set([srcId]);
  const parent = new Map();
  let frontier = [srcId];
  for (let depth = 0; depth < maxHops; depth++) {
    const next = [];
    for (const cur of frontier) {
      const nbrs = NEIGHBORS.get(cur);
      if (!nbrs) continue;
      for (const n of nbrs) {
        if (visited.has(n)) continue;
        visited.add(n);
        parent.set(n, cur);
        if (n === dstId) {
          const path = [dstId];
          let p = parent.get(dstId);
          while (p) { path.push(p); p = parent.get(p); }
          return path.reverse();
        }
        next.push(n);
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return null;
}

VIEWS.alchemy = {
  title: 'Alchemy',
  subtitle: 'pick deities, persons, or themes · the shortest path between them appears as bridges',
  render() {
    // Restore layout + spacing prefs from localStorage on first render (idempotent).
    try {
      const storedLayout = localStorage.getItem('alch-layout');
      if (storedLayout && ['force', 'linear', 'circular', 'radial'].includes(storedLayout)) {
        STATE.alchemyLayout = storedLayout;
      }
      const storedSpacing = parseInt(localStorage.getItem('alch-spacing'), 10);
      if (!isNaN(storedSpacing)) STATE.alchemySpacing = Math.max(0, Math.min(100, storedSpacing));
    } catch (e) {}
    const W = svg.node().clientWidth, H = svg.node().clientHeight;
    const cx = W / 2, cy = H / 2;

    // ---- Compute the displayed-node set: user picks + bridge path-nodes ----
    const picks = (STATE.alchemyPicks || []).filter(id => NODES_BY_ID[id]);
    STATE.alchemyPicks = picks;   // dedupe any orphaned ids

    const displayed = new Map();        // id → {node, isPick}
    picks.forEach(id => displayed.set(id, { node: NODES_BY_ID[id], isPick: true }));

    // For every ordered pair of picks, compute shortest path (max 5 hops). Union the path nodes.
    const bridgeEdges = [];   // {source, target, type}
    if (picks.length >= 2) {
      for (let i = 0; i < picks.length; i++) {
        for (let j = i + 1; j < picks.length; j++) {
          const path = alchemyShortestPath(picks[i], picks[j], 5);
          if (!path) continue;
          for (let k = 0; k < path.length; k++) {
            const nid = path[k];
            if (!displayed.has(nid)) displayed.set(nid, { node: NODES_BY_ID[nid], isPick: false });
            if (k > 0) {
              // Find the actual edge between path[k-1] and path[k] to grab its type.
              const e = EDGES.find(ed =>
                (ed.source === path[k - 1] && ed.target === path[k]) ||
                (ed.target === path[k - 1] && ed.source === path[k])
              );
              bridgeEdges.push({ source: path[k - 1], target: path[k], type: e ? e.type : 'connection' });
            }
          }
        }
      }
    }

    // Compute layout positions before instantiating nodes. For 'force' this returns an
    // empty Map and nodes get random-jittered initial positions (then the sim settles
    // them). For other layouts, positions include fx/fy to pin nodes in their slots.
    // W/H already in scope from the top of render().
    const rawNodesList = Array.from(displayed.values()).map(({ node, isPick }) => ({ id: node.id, d: node, isPick }));
    const layoutPositions = alchemyLayoutPositions(rawNodesList, picks, STATE.alchemyLayout, STATE.alchemySpacing, W, H);
    const nodes = rawNodesList.map(n => {
      const pos = layoutPositions.get(n.id);
      return {
        ...n,
        x: pos ? pos.x : cx + (Math.random() - 0.5) * 40,
        y: pos ? pos.y : cy + (Math.random() - 0.5) * 40,
        fx: pos ? pos.fx : null,
        fy: pos ? pos.fy : null,
      };
    });
    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const links = bridgeEdges
      .filter(e => nodeById.has(e.source) && nodeById.has(e.target))
      .map(e => ({ source: e.source, target: e.target, type: e.type }));

    // ---- View-controls (top-right): Presets dropdown trigger + save tree + count + clear ----
    const activePreset = STATE.alchemyActivePreset
      ? findPresetOrTree(STATE.alchemyActivePreset)
      : null;
    const canSave = picks.length > 0;
    document.getElementById('view-controls').innerHTML = `
      <button class="btn btn-mini alch-presets-trigger" id="alch-presets-trigger" title="Load a curated cross-tradition exploration">
        <span class="alch-presets-trigger-label">${activePreset ? activePreset.name : 'Presets'}</span>
        <span class="caret">▾</span>
      </button>
      <span class="alch-save-wrap" id="alch-save-wrap">
        <button class="btn btn-mini" id="btn-alch-save" ${canSave ? '' : 'disabled'} title="${canSave ? 'Save the current exploration as a custom preset' : 'Add at least one node to enable saving'}">save tree</button>
      </span>
      <span class="alch-count">${picks.length} picked · ${nodes.length - picks.length} bridge${nodes.length - picks.length === 1 ? '' : 's'}</span>
      <button class="btn btn-mini" id="btn-alch-clear">clear</button>
    `;
    document.getElementById('btn-alch-clear').onclick = () => {
      STATE.alchemyPicks = [];
      STATE.alchemyActivePreset = null;
      setView('alchemy');
    };

    // Toolbox + palette + dropdown injected into canvas as siblings of the SVG.
    document.querySelectorAll('.alch-toolbox, .alch-palette, .alch-presets-dropdown, .alch-presets-pane').forEach(el => el.remove());
    const canvas = document.getElementById('canvas');

    // ---- Presets dropdown — absolutely positioned, anchored to top-right under the trigger.
    // Lives in the canvas so it's clipped only by the viewport, not the nav.
    const customTrees = loadCustomTrees();
    const dropdown = document.createElement('div');
    dropdown.className = 'alch-presets-dropdown';
    dropdown.style.display = 'none';
    const renderPresetCard = (p, isCustom) => {
      const isActive = STATE.alchemyActivePreset === p.id;
      const blurb = isCustom
        ? `${p.picks.length} node${p.picks.length === 1 ? '' : 's'}`
        : (p.headline ? p.headline.split('—')[0].trim() + '.' : '');
      return `
        <div class="alch-preset-card${isActive ? ' active' : ''}${isCustom ? ' custom' : ''}" data-preset="${p.id}">
          <div class="alch-preset-name">${p.name}${isCustom ? `<button class="alch-preset-delete" data-preset="${p.id}" title="Delete this saved tree">×</button>` : ''}</div>
          ${blurb ? `<div class="alch-preset-headline">${blurb}</div>` : ''}
          <div class="alch-preset-action-row" data-mode="initial">
            <button class="alch-preset-load" data-preset="${p.id}">${isActive ? 'reload' : 'load'}</button>
            <span class="alch-preset-meta">${p.picks.length} seeds</span>
          </div>
          <div class="alch-preset-confirm-row" data-mode="confirm" style="display:none">
            <span class="alch-preset-confirm-q">Replace your ${picks.length} pick${picks.length === 1 ? '' : 's'}?</span>
            <button class="alch-preset-confirm alch-preset-append" data-preset="${p.id}">append</button>
            <button class="alch-preset-confirm alch-preset-replace" data-preset="${p.id}">replace</button>
            <button class="alch-preset-confirm alch-preset-cancel">cancel</button>
          </div>
        </div>
      `;
    };
    dropdown.innerHTML = `
      ${activePreset ? `
        <div class="alch-presets-active">
          <div class="alch-presets-active-name">${activePreset.name}</div>
          ${activePreset.headline ? `<div class="alch-presets-active-headline">${activePreset.headline}</div>` : ''}
        </div>
      ` : `
        <div class="alch-presets-intro">Curated cross-tradition explorations. Click one to load — bridge nodes appear automatically between the seeded nodes via the shortest-path BFS through the vault's edges.</div>
      `}
      <div class="alch-presets-section-label">Curated</div>
      <div class="alch-presets-list">
        ${ALCHEMY_PRESETS.map(p => renderPresetCard(p, false)).join('')}
      </div>
      ${customTrees.length > 0 ? `
        <div class="alch-presets-section-label">Your saved trees</div>
        <div class="alch-presets-list">
          ${customTrees.slice().reverse().map(t => renderPresetCard(t, true)).join('')}
        </div>
      ` : `
        <div class="alch-presets-empty-custom">Save the current exploration as a custom tree from the toolbar →</div>
      `}
    `;
    canvas.appendChild(dropdown);

    // Position the dropdown under the trigger button each time it opens (so resize/scroll-safe).
    function positionDropdown() {
      const trigger = document.getElementById('alch-presets-trigger');
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      // Right-align the dropdown with the trigger so it doesn't overflow off-canvas.
      dropdown.style.top = (rect.bottom - canvasRect.top + 6) + 'px';
      dropdown.style.right = (canvasRect.right - rect.right) + 'px';
      dropdown.style.left = 'auto';
    }
    function openDropdown() {
      positionDropdown();
      dropdown.style.display = '';
      setTimeout(() => document.addEventListener('click', closeOnOutside), 0);
    }
    function closeDropdown() {
      dropdown.style.display = 'none';
      document.removeEventListener('click', closeOnOutside);
    }
    function closeOnOutside(ev) {
      if (dropdown.contains(ev.target)) return;
      const trigger = document.getElementById('alch-presets-trigger');
      if (trigger && trigger.contains(ev.target)) return;
      closeDropdown();
    }
    document.getElementById('alch-presets-trigger').onclick = (ev) => {
      ev.stopPropagation();
      if (dropdown.style.display === 'none') openDropdown(); else closeDropdown();
    };

    // Save tree button → reveal inline name input + confirm/cancel. Press Enter to save.
    function showSaveInput() {
      if (picks.length === 0) return;
      const wrap = document.getElementById('alch-save-wrap');
      wrap.innerHTML = `
        <input type="text" class="alch-save-input" id="alch-save-input" placeholder="name your tree…" autocomplete="off" maxlength="60" />
        <button class="btn btn-mini alch-save-confirm" id="alch-save-confirm" title="Save">✓</button>
        <button class="btn btn-mini alch-save-cancel" id="alch-save-cancel" title="Cancel">×</button>
      `;
      const input = document.getElementById('alch-save-input');
      input.focus();
      const commit = () => {
        const name = input.value.trim();
        if (!name) { input.classList.add('invalid'); input.focus(); return; }
        saveCustomTree(name);
        setView('alchemy');   // re-render so the new tree appears in the dropdown
      };
      const cancel = () => { setView('alchemy'); };
      document.getElementById('alch-save-confirm').onclick = (e) => { e.stopPropagation(); commit(); };
      document.getElementById('alch-save-cancel').onclick = (e) => { e.stopPropagation(); cancel(); };
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        else input.classList.remove('invalid');
      });
    }
    const saveBtn = document.getElementById('btn-alch-save');
    if (saveBtn) saveBtn.onclick = (ev) => { ev.stopPropagation(); showSaveInput(); };

    // Load buttons — same append/replace inline pattern as before, scoped to dropdown.
    dropdown.querySelectorAll('.alch-preset-load').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const presetId = btn.dataset.preset;
        if (picks.length === 0) {
          alchemyLoadPreset(presetId, 'replace');
          closeDropdown();
          return;
        }
        dropdown.querySelectorAll('.alch-preset-action-row').forEach(r => r.style.display = '');
        dropdown.querySelectorAll('.alch-preset-confirm-row').forEach(r => r.style.display = 'none');
        const card = btn.closest('.alch-preset-card');
        card.querySelector('.alch-preset-action-row').style.display = 'none';
        card.querySelector('.alch-preset-confirm-row').style.display = '';
      });
    });
    dropdown.querySelectorAll('.alch-preset-append').forEach(btn => {
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); alchemyLoadPreset(btn.dataset.preset, 'append'); closeDropdown(); });
    });
    dropdown.querySelectorAll('.alch-preset-replace').forEach(btn => {
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); alchemyLoadPreset(btn.dataset.preset, 'replace'); closeDropdown(); });
    });
    dropdown.querySelectorAll('.alch-preset-cancel').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const card = btn.closest('.alch-preset-card');
        card.querySelector('.alch-preset-confirm-row').style.display = 'none';
        card.querySelector('.alch-preset-action-row').style.display = '';
      });
    });
    // Custom tree delete buttons.
    dropdown.querySelectorAll('.alch-preset-delete').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const id = btn.dataset.preset;
        deleteCustomTree(id);
        if (STATE.alchemyActivePreset === id) STATE.alchemyActivePreset = null;
        setView('alchemy');
      });
    });

    const toolbox = document.createElement('div');
    toolbox.className = 'alch-toolbox';
    const L = STATE.alchemyLayout;
    toolbox.innerHTML = `
      <button class="alch-add-btn" id="alch-add" title="Add a node">＋ add node</button>
      <span class="alch-tools-divider"></span>
      <div class="alch-layout-group" role="group" aria-label="Layout">
        <button class="alch-layout-btn ${L === 'force' ? 'active' : ''}" data-layout="force" title="Force-directed (organic clustering)">∿</button>
        <button class="alch-layout-btn ${L === 'linear' ? 'active' : ''}" data-layout="linear" title="Linear (chronological timeline, type-banded)">─</button>
        <button class="alch-layout-btn ${L === 'circular' ? 'active' : ''}" data-layout="circular" title="Circular (single ring, type-sorted)">○</button>
        <button class="alch-layout-btn ${L === 'radial' ? 'active' : ''}" data-layout="radial" title="Radial (picks center, bridges outer)">◎</button>
      </div>
      <span class="alch-tools-divider"></span>
      <label class="alch-spacing-label" title="Adjust spacing for the active layout">
        <span class="alch-spacing-icon" aria-hidden="true">⇿</span>
        <input type="range" id="alch-spacing-slider" min="0" max="100" value="${STATE.alchemySpacing}" />
      </label>
      ${picks.length === 0 ? '<span class="alch-hint">pick any node to start — or load a preset</span>' : ''}
    `;
    canvas.appendChild(toolbox);

    // Wire layout buttons.
    toolbox.querySelectorAll('.alch-layout-btn').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        STATE.alchemyLayout = btn.dataset.layout;
        try { localStorage.setItem('alch-layout', STATE.alchemyLayout); } catch (e) {}
        setView('alchemy');
      });
    });
    // Wire spacing slider with debounce so re-render doesn't fire on every pixel of drag.
    const _spacingSlider = document.getElementById('alch-spacing-slider');
    if (_spacingSlider) {
      let _spacingDebounce;
      _spacingSlider.addEventListener('input', (ev) => {
        STATE.alchemySpacing = parseInt(ev.target.value, 10) || 50;
        try { localStorage.setItem('alch-spacing', String(STATE.alchemySpacing)); } catch (e) {}
        clearTimeout(_spacingDebounce);
        _spacingDebounce = setTimeout(() => setView('alchemy'), 140);
      });
    }

    const palette = document.createElement('div');
    palette.className = 'alch-palette';
    palette.style.display = 'none';
    palette.innerHTML = `
      <input type="text" id="alch-search" placeholder="type a name…" autocomplete="off" />
      <div class="alch-results" id="alch-results"></div>
      <div class="alch-hint-row">↑↓ navigate · ⏎ add · esc close</div>
    `;
    canvas.appendChild(palette);

    const searchInput = palette.querySelector('#alch-search');
    const resultsEl = palette.querySelector('#alch-results');
    let activeIdx = 0;
    let currentResults = [];

    function renderResults(q) {
      const query = (q || '').trim().toLowerCase();
      if (!query) { resultsEl.innerHTML = '<div class="alch-empty">start typing…</div>'; currentResults = []; return; }
      const matches = DATA.nodes
        .filter(n => n.type === 'deity' || n.type === 'person' || n.type === 'theme' || n.type === 'document' || n.type === 'event')
        .filter(n => !STATE.alchemyPicks.includes(n.id))
        .filter(n => (n.title + ' ' + (n.aka || []).join(' ')).toLowerCase().includes(query))
        .slice(0, 20);
      currentResults = matches;
      if (matches.length === 0) { resultsEl.innerHTML = '<div class="alch-empty">no match</div>'; return; }
      activeIdx = 0;
      resultsEl.innerHTML = matches.map((m, i) => `
        <div class="alch-result${i === 0 ? ' active' : ''}" data-id="${m.id}">
          <span class="alch-r-swatch" style="background:${m.family_color || m.tradition_color || '#7a8090'}"></span>
          <span class="alch-r-title">${m.title}</span>
          <span class="alch-r-meta">${m.type}${m.family ? ' · ' + m.family : ''}</span>
        </div>
      `).join('');
    }

    function openPalette() {
      palette.style.display = '';
      searchInput.value = '';
      renderResults('');
      setTimeout(() => searchInput.focus(), 30);
    }
    function closePalette() {
      palette.style.display = 'none';
      searchInput.blur();
    }
    function pickResult(id) {
      if (!id) return;
      STATE.alchemyPicks = (STATE.alchemyPicks || []).concat([id]);
      closePalette();
      setView('alchemy');   // re-render the canvas to show the new node + recomputed bridges
    }

    document.getElementById('alch-add').onclick = openPalette;
    searchInput.addEventListener('input', e => renderResults(e.target.value));
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closePalette(); return; }
      if (!currentResults.length) return;
      if (e.key === 'ArrowDown') {
        activeIdx = Math.min(activeIdx + 1, currentResults.length - 1);
        resultsEl.querySelectorAll('.alch-result').forEach((el, i) => el.classList.toggle('active', i === activeIdx));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        activeIdx = Math.max(activeIdx - 1, 0);
        resultsEl.querySelectorAll('.alch-result').forEach((el, i) => el.classList.toggle('active', i === activeIdx));
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (currentResults[activeIdx]) pickResult(currentResults[activeIdx].id);
        e.preventDefault();
      }
    });
    resultsEl.addEventListener('click', e => {
      const row = e.target.closest('.alch-result');
      if (row) pickResult(row.dataset.id);
    });
    // Click outside the palette closes it. Bind only ONCE across all alchemy renders
    // (module-level flag) so handlers don't accumulate.
    if (!window._alchOutsideBound) {
      window._alchOutsideBound = true;
      document.addEventListener('click', (ev) => {
        const p = document.querySelector('.alch-palette');
        if (!p || p.style.display === 'none') return;
        if (p.contains(ev.target)) return;
        const addBtn = document.getElementById('alch-add');
        if (addBtn && addBtn.contains(ev.target)) return;
        p.style.display = 'none';
      });
    }

    if (nodes.length === 0) return;   // empty canvas — toolbox prompt does the work

    // ---- SVG render ----
    const g = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.4, 4]).on('zoom', ev => {
      g.attr('transform', ev.transform);
      const ro = document.getElementById('zm-readout');
      if (ro) ro.textContent = ev.transform.k.toFixed(2) + '×';
    });
    svg.call(zoom);
    // Zoom-meter wiring (Alchemy-specific) — overrides the previous view's handlers.
    const _zmIn = document.getElementById('zm-in');
    const _zmOut = document.getElementById('zm-out');
    const _zmBase = document.getElementById('zm-reset');
    const _zmReadout = document.getElementById('zm-readout');
    if (_zmIn)   _zmIn.onclick   = () => svg.transition().duration(220).call(zoom.scaleBy, 1.4);
    if (_zmOut)  _zmOut.onclick  = () => svg.transition().duration(220).call(zoom.scaleBy, 1 / 1.4);
    if (_zmBase) _zmBase.onclick = () => svg.transition().duration(380).call(zoom.transform, d3.zoomIdentity);
    if (_zmReadout) _zmReadout.textContent = '1.00×';

    const linkLayer = g.append('g').attr('class', 'alch-link-layer');
    const nodeLayer = g.append('g').attr('class', 'alch-node-layer');
    const labelLayer = g.append('g').attr('class', 'alch-label-layer');

    const linkSel = linkLayer.selectAll('line').data(links).enter().append('line')
      .attr('class', 'alch-link')
      .each(function (d) {
        // Use the canonical EDGE_STYLE width/opacity. Type color goes on a CSS variable;
        // .alch-link CSS uses quiet blue default + .hot reveals the type color.
        const st = edgeStyle(d.type);
        d3.select(this)
          .style('--edge-type-color', st.c)
          .attr('stroke-width', st.w)
          .attr('stroke-opacity', st.op);
      });

    const linkLabelSel = linkLayer.selectAll('text.alch-link-label').data(links).enter().append('text')
      .attr('class', 'alch-link-label')
      .attr('text-anchor', 'middle')
      .text(d => d.type);

    const nodeSel = nodeLayer.selectAll('g.alch-node').data(nodes, n => n.id).enter().append('g')
      .attr('class', n => 'alch-node' + (n.isPick ? ' pick' : ' bridge'))
      .call(d3.drag()
        .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); /* keep fx/fy → manual lock */ }))
      .on('click', (ev, n) => {
        ev.stopPropagation();
        if (ev.target && ev.target.classList.contains('alch-remove')) return;
        selectNode(n.id);
        document.body.classList.remove('detail-collapsed');
      })
      .on('mouseenter', (ev, n) => showTooltip(
        `${tooltipThumb(n.d)}<div class="ttitle">${n.d.title}</div>
         <div class="tmeta">${n.d.type}${n.d.family ? ' · ' + n.d.family : ''}${n.isPick ? ' · picked' : ' · bridge'}</div>`, ev))
      .on('mousemove', ev => tooltip.style('left', (ev.clientX + 14) + 'px').style('top', (ev.clientY + 14) + 'px'))
      .on('mouseleave', hideTooltip);

    // Shape-per-type — deity = circle, person = diamond, event = star, etc. User-picked
    // nodes are larger (radius 14) than bridge nodes (radius 7) so the eye reads them as primary.
    nodeSel.append('path')
      .attr('class', 'alch-circle')
      .attr('data-tier', n => n.d._tier ?? 'none')
      .attr('d', n => shapePath(n.d, n.isPick ? 14 : 7))
      .attr('fill', n => nodeColor(n.d))
      .attr('stroke', n => n.isPick ? 'var(--gold)' : 'rgba(255,255,255,0.18)')
      .attr('stroke-width', n => n.isPick ? 2 : 1);

    // × badge on pick-nodes for removal.
    const removeSel = nodeSel.filter(n => n.isPick).append('g').attr('class', 'alch-remove-wrap');
    removeSel.append('circle')
      .attr('class', 'alch-remove')
      .attr('cx', 14).attr('cy', -14).attr('r', 7)
      .attr('fill', 'var(--bg-2)').attr('stroke', 'var(--gold-soft)').attr('stroke-width', 1);
    removeSel.append('text')
      .attr('class', 'alch-remove')
      .attr('x', 14).attr('y', -11)
      .attr('text-anchor', 'middle')
      .text('×');
    removeSel.on('click', (ev, n) => {
      ev.stopPropagation();
      STATE.alchemyPicks = STATE.alchemyPicks.filter(id => id !== n.id);
      setView('alchemy');
    });

    const labelSel = labelLayer.selectAll('text.alch-node-label').data(nodes, n => n.id).enter().append('text')
      .attr('class', n => 'alch-node-label' + (n.isPick ? ' pick' : ' bridge'))
      .attr('text-anchor', 'middle')
      .attr('dy', n => -(n.isPick ? 22 : 14))
      .text(n => n.d.title);

    // ---- Force simulation ----
    // Spacing factor (0.5 → 1.7) tunes link distance / repulsion / collide radius.
    // When layout is non-force, nodes carry fx/fy pins so the sim respects the layout
    // while still adjusting link positions naturally. We drop forceCenter for pinned
    // layouts since nodes are already positioned away from center.
    const _sf = 0.5 + (STATE.alchemySpacing / 100) * 1.2;
    const _isForce = STATE.alchemyLayout === 'force';
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(120 * _sf).strength(_isForce ? 0.4 : 0.05))
      .force('charge', d3.forceManyBody().strength(_isForce ? -340 * _sf : -60))
      .force('center', _isForce ? d3.forceCenter(cx, cy) : null)
      .force('collide', d3.forceCollide().radius(n => (n.isPick ? 36 : 24) * (_isForce ? _sf : 1)).iterations(2))
      .on('tick', () => {
        linkSel
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        linkLabelSel
          .attr('x', d => (d.source.x + d.target.x) / 2)
          .attr('y', d => (d.source.y + d.target.y) / 2);
        nodeSel.attr('transform', n => `translate(${n.x},${n.y})`);
        labelSel.attr('transform', n => `translate(${n.x},${n.y})`);
      });
  }
};

// ============================================================
// ATLAS — vault world map (opus-map-1, 2026-05-15).
// MapLibre GL JS rendering an offline Protomaps vector basemap (z0-z7 world,
// 185 MB, in _assets/basemap/world-z7.pmtiles; gitignored, re-fetchable via
// scripts/fetch-basemap.sh). The basemap is a label-free quiet backdrop in
// our token palette (premium minimalism — Bloomberg/Stripe-style restraint).
// Vault nodes ride above it as CSS-styled DOM markers with degree-tier
// semantic-zoom LOD (shared with Pantheon/Timeline) and bbox declutter.
//
// Replaces opus-design-3's SVG/equirectangular atlas. The old geoToMap +
// CONTINENT_OUTLINES helpers stay (the bottom-right map-thumbnail still uses
// them) — only the old VIEWS.atlas SVG render path is gone.
// ============================================================

// Module-scoped state — the MapLibre instance and DOM markers persist across
// atlas visits to avoid reinit cost. Render() updates filtered data in place.
let _atlasMap = null;
let _atlasMarkers = new Map();       // (legacy, kept for back-compat; unused by circle-layer path)
let _atlasNodesById = new Map();     // node-id → vault node (for hover-trail neighbor lookup)
let _atlasHoveredId = null;          // currently-hovered node id (debounce trail rebuild)
let _atlasClusterPopup = null;       // (legacy) cluster-list popup — replaced by spiderfy
let _atlasSpiderActive = null;       // cluster center [lng,lat] when a spider is open, else null
let _atlasSpiderRecentering = false; // true while map is auto-easing to center a cluster for spider
let _atlasLockedId = null;           // node id whose trails/highlight stay visible across hover (sticky-select via click)
let _atlasPreSpiderState = null;     // {center, zoom} snapshot when a spider was opened — used by empty-click "ease back to natural state"
let _atlasZoomHandler = null;
let _atlasEndHandler = null;
let _atlasResizeObs = null;
let _atlasProtocolRegistered = false;

function _atlasRegisterProtocol() {
  if (_atlasProtocolRegistered) return;
  if (typeof maplibregl === 'undefined' || typeof pmtiles === 'undefined') {
    console.warn('[atlas] MapLibre or PMTiles not loaded — basemap unavailable.');
    return;
  }
  const proto = new pmtiles.Protocol();
  maplibregl.addProtocol('pmtiles', proto.tile);
  _atlasProtocolRegistered = true;
}

// Resolve a CSS token at runtime so basemap colors track the active style preset.
function _atlasToken(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// Premium minimalist basemap style — no text labels, just land/water/borders
// drawn in our token palette. Colors are resolved at style-build time; the
// preset-switch handler in app.js can call _atlasMap.setStyle(_atlasBuildStyle())
// to recolor live (TODO: wire when preset consolidation lands).
function _atlasBuildStyle() {
  return {
    version: 8,
    // Glyphs for symbol-layer text rendering (cluster counts, future place labels).
    // Vendored offline at _assets/vendor/glyphs/<fontstack>/<range>.pbf — Noto Sans
    // Regular range 0-255 covers digits + Latin (76 KB, fetched once via curl).
    // MapLibre URL-encodes spaces in {fontstack} → '%20' so the path resolves to the
    // real on-disk file. Add more ranges later if non-Latin labels are needed.
    glyphs: '_assets/vendor/glyphs/{fontstack}/{range}.pbf',
    sources: {
      protomaps: {
        type: 'vector',
        // Use tiles array directly — avoids a TileJSON metadata fetch through the pmtiles://
        // protocol handler, which hangs in MapLibre v5 when the source URL form is used.
        tiles: ['pmtiles://_assets/basemap/world-z7.pmtiles/{z}/{x}/{y}'],
        minzoom: 0,
        maxzoom: 7,
        bounds: [-180, -85.05, 180, 85.05],
        attribution: '© <a href="https://openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
      }
    },
    layers: [
      { id: 'bg', type: 'background',
        paint: { 'background-color': _atlasToken('--bg-0', '#07090f') } },
      { id: 'earth', source: 'protomaps', 'source-layer': 'earth', type: 'fill',
        paint: { 'fill-color': _atlasToken('--bg-3', '#1c2333') } },
      { id: 'landcover', source: 'protomaps', 'source-layer': 'landcover', type: 'fill',
        paint: { 'fill-color': _atlasToken('--bg-2', '#141a26'), 'fill-opacity': 0.22 } },
      { id: 'natural', source: 'protomaps', 'source-layer': 'natural', type: 'fill',
        paint: { 'fill-color': _atlasToken('--bg-2', '#141a26'), 'fill-opacity': 0.30 } },
      { id: 'water', source: 'protomaps', 'source-layer': 'water', type: 'fill',
        paint: { 'fill-color': _atlasToken('--bg-0', '#07090f') } },
      { id: 'boundaries-country', source: 'protomaps', 'source-layer': 'boundaries', type: 'line',
        filter: ['<=', ['coalesce', ['get', 'kind_detail'], 2], 2],
        paint: {
          'line-color': _atlasToken('--border', '#232b3d'),
          'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.35, 4, 0.85, 7, 1.4],
          'line-opacity': 0.85
        }
      },
      { id: 'boundaries-region', source: 'protomaps', 'source-layer': 'boundaries', type: 'line',
        filter: ['>', ['coalesce', ['get', 'kind_detail'], 0], 2],
        paint: {
          'line-color': _atlasToken('--border-soft', '#1a2030'),
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.25, 7, 0.55],
          'line-opacity': 0.55
        }
      }
      // Note: basemap place-name labels are added DYNAMICALLY in setup() (wrapped
      // in try/catch), not here — putting them in the style spec means any glyph
      // or filter validation error blocks the whole basemap from loading.
    ]
  };
}

VIEWS.atlas = {
  title: 'Atlas',
  subtitle: 'geography of the vault · vector basemap · semantic-zoom labels · drag to pan · scroll to zoom',
  render() {
    _atlasRegisterProtocol();
    const paneEl = document.getElementById('atlas-pane');
    const mapEl  = document.getElementById('atlas-map');

    // --- state ---
    const era = STATE.atlasEra || { lo: -3500, hi: 2050 };
    if (!STATE.atlasEra) STATE.atlasEra = era;
    const labelMode = STATE.atlasLabelMode || 'hub';
    if (!STATE.atlasLabelMode) STATE.atlasLabelMode = labelMode;

    // --- filter geo-tagged nodes ---
    const geoNodes = DATA.nodes.filter(n => {
      if (!n.geo || typeof n.geo.lat !== 'number' || typeof n.geo.lon !== 'number') return false;
      if (!matchesFilter(n)) return false;
      if (typeof n.date_earliest === 'number') {
        if (n.date_earliest < era.lo || n.date_earliest > era.hi) return false;
      }
      return true;
    });

    // --- view-controls toolbar (always — even when empty) ---
    document.getElementById('view-controls').innerHTML = `
      <button class="btn btn-mini" id="btn-atlas-labels">labels: ${labelMode}</button>
      <button class="btn btn-mini" id="btn-atlas-recenter">recenter</button>
    `;
    document.getElementById('btn-atlas-labels').onclick = () => {
      const order = ['off', 'hub', 'all'];
      STATE.atlasLabelMode = order[(order.indexOf(labelMode) + 1) % order.length];
      setView('atlas');
    };
    document.getElementById('btn-atlas-recenter').onclick = () => {
      if (_atlasMap) _atlasMap.easeTo({ center: [40, 28], zoom: 2.2, duration: 600 });
    };

    // --- era-range slider (bottom of atlas pane, user 2026-05-15) ---
    // Replaces the 6-preset <select> with a dual-handle range slider that lets
    // the user freely trim the era window left/right. Phase-band gradient under
    // the track shows BCE/CE/Axial/Late-Antique/Medieval/Modern at a glance.
    _renderAtlasEraSlider(paneEl, era);

    // --- empty state ---
    const oldEmpty = paneEl.querySelector('.atlas-empty-card');
    if (oldEmpty) oldEmpty.remove();
    if (!geoNodes.length) {
      paneEl.classList.add('atlas-empty-mode');
      mapEl.style.display = 'none';
      const card = document.createElement('div');
      card.className = 'atlas-empty-card';
      card.innerHTML = `
        <div class="atlas-empty-headline">No geo-tagged nodes match the filter.</div>
        <div class="atlas-empty-sub">LOOSEN FILTERS · WIDEN THE ERA WINDOW · TRY A DIFFERENT FAMILY</div>`;
      paneEl.appendChild(card);
      // Clear any leftover markers from a previous non-empty render
      _atlasMarkers.forEach(m => m.marker.remove());
      _atlasMarkers.clear();
      return;
    }
    paneEl.classList.remove('atlas-empty-mode');
    mapEl.style.display = '';

    // --- tier classification (top 1% / 5% / 18% / rest) ---
    const sortedByDegree = [...geoNodes].sort((a, b) => (DEGREE.get(b.id) || 0) - (DEGREE.get(a.id) || 0));
    const N = sortedByDegree.length;
    const tierEdges = [
      Math.max(1, Math.ceil(N * 0.012)),
      Math.max(2, Math.ceil(N * 0.05)),
      Math.max(4, Math.ceil(N * 0.18))
    ];
    const tierById = new Map();
    sortedByDegree.forEach((n, i) => {
      tierById.set(n.id, i < tierEdges[0] ? 0 : i < tierEdges[1] ? 1 : i < tierEdges[2] ? 2 : 3);
    });

    // --- init MapLibre map once ---
    if (!_atlasMap) {
      _atlasMap = new maplibregl.Map({
        container: 'atlas-map',
        style: _atlasBuildStyle(),
        center: [40, 28],
        zoom: 2.2,
        minZoom: 0.6,
        // maxZoom 7 — matches PMTiles native max (no basemap blur past z7).
        // User 2026-05-15: "we don't have to zoom so much, limit at the current
        // ~200%". Cluster-click now opens a spider with labels instead of
        // zooming deep, so we don't need extreme zoom levels anymore.
        maxZoom: 7,
        // Single-world view (no horizontal wrap). The previous `true` value
        // caused the user-reported "infinite scrolling repeating tile" — markers
        // render only in the canonical world copy, so panning into duplicates
        // showed basemap-without-markers, creating an illusion of marker drift.
        // (Map-drift fix, 2026-05-15.)
        renderWorldCopies: false,
        attributionControl: false,
        fadeDuration: 220,
        bearing: 0,
        pitch: 0
      });
      _atlasMap.dragRotate.disable();
      _atlasMap.touchZoomRotate.disableRotation();
      _atlasMap.keyboard.disableRotation();
      _atlasMap.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

      _atlasResizeObs = new ResizeObserver(() => {
        if (paneEl.style.display !== 'none' && _atlasMap) _atlasMap.resize();
      });
      _atlasResizeObs.observe(paneEl);
    } else {
      // Re-shown after a view switch — canvas may have new dimensions.
      requestAnimationFrame(() => _atlasMap && _atlasMap.resize());
    }

    // --- setup callback (runs after style + sources load) ---
    const setup = () => {
      // Trail source/layer — singleton, lives across renders.
      if (!_atlasMap.getSource('atlas-trails')) {
        _atlasMap.addSource('atlas-trails', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
        _atlasMap.addLayer({
          id: 'atlas-trail-line',
          source: 'atlas-trails',
          type: 'line',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            // Brighter, thicker trails (user 2026-05-15: "can we bring back the
            // connections?"). Was line-opacity 0.6 + width 0.9-1.9 — too faint
            // on the dark basemap. Now opacity 0.85 + width 1.6-3.2.
            'line-color': _atlasToken('--gold', '#d4a55a'),
            'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.6, 4, 2.4, 7, 3.2],
            'line-opacity': 0.85,
            'line-blur': 0.2
          }
        });
      }

      // ---- NATIVE CIRCLE LAYER (replaces DOM markers; opus-foundation, 2026-05-15) ----
      // Build a GeoJSON FeatureCollection from the filtered geoNodes. Each feature
      // carries family_color, dotSize, tier, etc. as `properties` so the circle
      // layer's paint expressions can data-drive everything. This eliminates the
      // DOM-marker positioning bug (markers appearing offset / drifting from their
      // basemap location) by using MapLibre's GPU projection.
      //
      // CO-LOCATION JITTER (2026-05-15 fix): the vault has many docs sharing the
      // EXACT same geocoded coord (e.g. ~99 texts all at Rome's 41.9°N 12.5°E).
      // Without jitter, even at max zoom these stack into a single visible dot and
      // the user can't reach the individual nodes. We group features by their exact
      // coord and spread each group on a small spiral around the centroid. The
      // spiral radius is in DEGREES so it scales naturally with zoom: invisible at
      // z 1-3 (still clusters together), clearly visible at z 5+ (individual dots).
      // Original coord preserved in properties.origLng / origLat for reference.
      const coordGroups = new Map();
      geoNodes.forEach(n => {
        const key = `${n.geo.lon.toFixed(4)},${n.geo.lat.toFixed(4)}`;
        if (!coordGroups.has(key)) coordGroups.set(key, []);
        coordGroups.get(key).push(n.id);
      });
      // Jitter spiral parameters — bumped 2026-05-15 ("they need to grow apart
      // more and maintain this size"). 0.040° ≈ 4.4 km at lat 40, ≈ 4 km along
      // the meridian. Big enough to be visibly separated by ~z 4-5.
      const JITTER_R0  = 0.040;
      const JITTER_STEP = 0.045;
      const ITEMS_PER_RING = 8;

      const featureCollection = {
        type: 'FeatureCollection',
        features: geoNodes.map(n => {
          const key = `${n.geo.lon.toFixed(4)},${n.geo.lat.toFixed(4)}`;
          const group = coordGroups.get(key);
          let lng = n.geo.lon;
          let lat = n.geo.lat;
          if (group.length > 1) {
            const pos    = group.indexOf(n.id);
            const ring   = Math.floor(pos / ITEMS_PER_RING);
            const inRing = pos % ITEMS_PER_RING;
            const perRing = (ring === 0 && group.length < ITEMS_PER_RING)
              ? group.length : ITEMS_PER_RING;
            // Stagger alternating rings by half-step so outer ring sits in inner gaps.
            const angleOff = (ring % 2) ? (Math.PI / perRing) : 0;
            const angle = (inRing / perRing) * 2 * Math.PI - Math.PI / 2 + angleOff;
            const r = JITTER_R0 + ring * JITTER_STEP;
            // Adjust lon for latitude (degrees of longitude shrink toward poles).
            const latRad = (n.geo.lat * Math.PI) / 180;
            const lonFactor = 1 / Math.max(0.2, Math.cos(latRad));
            lng += r * Math.cos(angle) * lonFactor;
            lat += r * Math.sin(angle);
          }
          return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: {
              id: n.id,
              title: n.title || '',
              family_color: n.family_color || n.tradition_color || '#7a8090',
              tier: tierById.get(n.id),
              deg: DEGREE.get(n.id) || 0,
              dotSize: 5 + Math.sqrt(DEGREE.get(n.id) || 0) * 1.2,
              origLng: n.geo.lon,
              origLat: n.geo.lat,
              coGroupSize: group.length
            }
          };
        })
      };

      // Lookup map for hover-trail neighbor resolution (replaces _atlasMarkers).
      _atlasNodesById = new Map();
      geoNodes.forEach(n => _atlasNodesById.set(n.id, n));

      if (_atlasMap.getSource('atlas-nodes')) {
        _atlasMap.getSource('atlas-nodes').setData(featureCollection);
      } else {
        // Basemap place-name labels (added here, not in the style spec, so a
        // glyph/filter validation error can't block the whole basemap from
        // rendering). Reads from the PMTiles `places` source-layer.
        try {
          _atlasMap.addLayer({
            id: 'basemap-place-labels',
            source: 'protomaps',
            'source-layer': 'places',
            type: 'symbol',
            layout: {
              'text-field': ['coalesce', ['get', 'name'], ''],
              'text-font': ['Noto Sans Regular'],
              'text-size': ['interpolate', ['linear'], ['zoom'], 2, 9, 6, 11, 10, 13, 12, 15],
              'text-allow-overlap': false,
              'text-letter-spacing': 0.05,
              'text-transform': 'uppercase',
              'symbol-sort-key': ['coalesce', ['get', 'min_zoom'], 12]
            },
            paint: {
              'text-color': _atlasToken('--text-2', '#8b8e98'),
              'text-halo-color': _atlasToken('--bg-0', '#07090f'),
              'text-halo-width': 1.5,
              'text-opacity': [
                'case',
                ['<=', ['coalesce', ['get', 'min_zoom'], 12], ['zoom']], 0.7,
                0
              ]
            }
          });
        } catch (e) {
          console.warn('[atlas] basemap place labels skipped:', e.message);
        }

        // CLUSTERED source — at low zoom, co-located points group into a single
        // "stack" circle. Click a cluster to zoom in and expand. Pattern from
        // https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/
        _atlasMap.addSource('atlas-nodes', {
          type: 'geojson',
          data: featureCollection,
          cluster: true,
          clusterRadius: 36,
          clusterMaxZoom: 5
        });

        // Cluster layer — gold ringed circles sized by # of points inside.
        _atlasMap.addLayer({
          id: 'atlas-clusters',
          type: 'circle',
          source: 'atlas-nodes',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': _atlasToken('--gold-soft', '#a87f3e'),
            'circle-radius': [
              'step', ['get', 'point_count'],
              12,
              5, 16,
              10, 22,
              25, 28
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': _atlasToken('--gold', '#d4a55a'),
            'circle-opacity': 0.85
          }
        });

        // Cluster-count labels (numeric). Symbol layer needs PBF glyphs; if the
        // style has none configured this layer is added but produces a console
        // warning at render time — harmless, the cluster circle alone reads.
        try {
          _atlasMap.addLayer({
            id: 'atlas-cluster-counts',
            type: 'symbol',
            source: 'atlas-nodes',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              // Font name must match a vendored glyph stack — Noto Sans Regular is
              // the one we have under _assets/vendor/glyphs/. Add to that dir to expand.
              'text-font': ['Noto Sans Regular'],
              'text-size': 12,
              'text-allow-overlap': true,
              'text-ignore-placement': true
            },
            paint: {
              'text-color': _atlasToken('--bg-0', '#07090f'),
              'text-halo-color': _atlasToken('--gold', '#d4a55a'),
              'text-halo-width': 0.5
            }
          });
        } catch (e) {
          console.warn('[atlas] cluster-count labels unavailable (no glyphs):', e.message);
        }

        // Individual (unclustered) point layer.
        _atlasMap.addLayer({
          id: 'atlas-nodes-circles',
          type: 'circle',
          source: 'atlas-nodes',
          filter: ['!', ['has', 'point_count']],
          paint: {
            // Bubbles tuned for the new maxZoom 7 — they reach their full size
            // earlier (around z 4-5) and HOLD it past that, since we don't want
            // them to keep growing into giant balloons when we already have
            // plenty of space (user 2026-05-15: "redo the bubbles now to fit
            // here, they need to grow apart more and maintain this size").
            'circle-radius': [
              'interpolate', ['exponential', 1.4], ['zoom'],
              1, ['*', ['get', 'dotSize'], 1.5],
              4, ['*', ['get', 'dotSize'], 2.2],
              7, ['*', ['get', 'dotSize'], 2.8]
            ],
            'circle-color': ['get', 'family_color'],
            'circle-stroke-width': 1,
            'circle-stroke-color': 'rgba(255,255,255,0.20)',
            'circle-opacity': 0.95,
            'circle-stroke-color-transition': { duration: 140 },
            'circle-opacity-transition': { duration: 140 }
          }
        });

        // Node labels (user 2026-05-15: "name label to appear as soon as it's
        // spacious, and if not display always the main ones most important").
        // - Hub-tier (tier 0-1, top ~5%): ALWAYS visible (opacity 1 from z 1).
        // - Tier 2: fades in around z 5.
        // - Tier 3: fades in around z 7.
        // Declutter via text-allow-overlap:false + symbol-sort-key=−deg (high-
        // degree nodes render first, claim placement, lower-degree drop if they
        // would overlap). Halo on bg-0 for contrast over any basemap tone.
        try {
          _atlasMap.addLayer({
            id: 'atlas-node-labels',
            type: 'symbol',
            source: 'atlas-nodes',
            filter: ['!', ['has', 'point_count']],
            layout: {
              'text-field': ['get', 'title'],
              'text-font': ['Noto Sans Regular'],
              'text-size': [
                'interpolate', ['linear'], ['zoom'],
                3, 10, 7, 12, 11, 14
              ],
              'text-anchor': 'left',
              'text-offset': [0.8, 0],
              'text-allow-overlap': false,
              'text-ignore-placement': false,
              'text-optional': true,
              // Lower sort-key renders first → claims space first. We want HIGH-
              // degree (hub) and HIGH-tier (lower number) to win the declutter race.
              'symbol-sort-key': ['+', ['get', 'tier'], ['*', -0.001, ['get', 'deg']]]
            },
            paint: {
              'text-color': _atlasToken('--text-1', '#c8c4b8'),
              'text-halo-color': _atlasToken('--bg-0', '#07090f'),
              'text-halo-width': 1.2,
              'text-opacity': [
                'interpolate', ['linear'], ['zoom'],
                1, ['case', ['<=', ['get', 'tier'], 1], 1, 0],
                4, ['case', ['<=', ['get', 'tier'], 1], 1, 0],
                5, ['case', ['<=', ['get', 'tier'], 2], 1, 0],
                7, 1
              ]
            }
          });
        } catch (e) {
          console.warn('[atlas] node labels unavailable:', e.message);
        }

        // --- Hover/click on individual circles ---
        _atlasMap.on('mousemove', 'atlas-nodes-circles', (ev) => {
          if (!ev.features || !ev.features.length) return;
          const f  = ev.features[0];
          const id = f.properties.id;
          const n  = _atlasNodesById.get(id);
          if (!n) return;
          _atlasMap.getCanvas().style.cursor = 'pointer';
          if (_atlasHoveredId !== id) {
            _atlasHoveredId = id;
            _atlasShowHoverTrails(id);
          }
          showTooltip(
            `${tooltipThumb(n)}<div class="ttitle">${n.title}</div>
             <div class="tmeta">${n.type}${n.family ? ' · ' + n.family : ''}${n.geo.label ? ' · ' + n.geo.label : ''}</div>
             <div class="tmeta">${fmtDateRange(n.date_earliest, n.date_latest) || '—'}</div>`, ev.originalEvent);
        });
        _atlasMap.on('mouseleave', 'atlas-nodes-circles', () => {
          _atlasMap.getCanvas().style.cursor = '';
          _atlasHoveredId = null;
          hideTooltip();
          // Sticky-select: if a node was click-locked, restore its trails on
          // mouseleave instead of clearing. Empty-click on the map clears the lock.
          if (_atlasLockedId) _atlasShowHoverTrails(_atlasLockedId);
          else _atlasHideHoverTrails();
        });
        _atlasMap.on('click', 'atlas-nodes-circles', (ev) => {
          if (!ev.features || !ev.features.length) return;
          const id = ev.features[0].properties.id;
          selectNode(id, true);
          _atlasLockedId = id;          // lock this selection visually
          _atlasShowHoverTrails(id);    // keep trails visible
        });

        // --- Hover/click on clusters: cursor pointer, click zooms in ---
        _atlasMap.on('mouseenter', 'atlas-clusters', () => {
          _atlasMap.getCanvas().style.cursor = 'pointer';
        });
        _atlasMap.on('mouseleave', 'atlas-clusters', () => {
          _atlasMap.getCanvas().style.cursor = '';
        });
        _atlasMap.on('click', 'atlas-clusters', (ev) => {
          const features = _atlasMap.queryRenderedFeatures(ev.point, { layers: ['atlas-clusters'] });
          if (!features.length) return;
          const clusterId    = features[0].properties.cluster_id;
          const pointCount   = features[0].properties.point_count;
          const clusterCoord = features[0].geometry.coordinates;
          const source       = _atlasMap.getSource('atlas-nodes');
          const currentZoom  = _atlasMap.getZoom();
          // Strategy: try to zoom in until the cluster expands. If the points share
          // identical coords (which our vault has — many docs at the same city),
          // expansion zoom returns current+epsilon and zooming forever wouldn't help.
          // In that case: SPIDERFY — fan the points out around the click center as
          // offset markers connected by leader lines back to the center. (User's
          // explicit ask 2026-05-15: "the nodes expand, even if you need to spread
          // them from the same position by X position".)
          // SPIDER-ON-CLICK with simultaneous zoom-IN (user 2026-05-15: "the
          // zoom needs to go BIG like almost full zoom"). Target maxZoom − 0.5
          // so we're nearly fully zoomed in: basemap shows city-level detail,
          // the spider's pixel-fixed radius has the most room to spread, and
          // labels are big enough to read from a comfortable distance. On the
          // readout this is ~34× (mult = 2^(k − 1.6)).
          //
          // MapLibre v5 changed getClusterLeaves from callback to Promise;
          // wrap both styles defensively so we work either way.
          const TARGET_SPIDER_ZOOM = _atlasMap.getMaxZoom() - 0.5;
          const onLeaves = (leaves) => {
            if (!leaves || !leaves.length) return;
            _atlasPreSpiderState = { center: _atlasMap.getCenter(), zoom: currentZoom };
            const targetZ = Math.max(currentZoom, TARGET_SPIDER_ZOOM);
            const willMove = Math.abs(targetZ - currentZoom) > 0.1
                          || _atlasMap.getCenter().distanceTo(new maplibregl.LngLat(clusterCoord[0], clusterCoord[1])) > 100;
            if (willMove) {
              _atlasSpiderRecentering = true;
              _atlasMap.easeTo({ center: clusterCoord, zoom: targetZ, duration: 420 });
              _atlasMap.once('moveend', () => {
                _atlasSpiderRecentering = false;
                _atlasShowSpider(clusterCoord, leaves);
              });
            } else {
              _atlasShowSpider(clusterCoord, leaves);
            }
          };
          const result = source.getClusterLeaves(clusterId, pointCount, 0, (err, leaves) => {
            // v4-style callback (still supported by MapLibre v5 for back-compat)
            if (err) { console.warn('[atlas] getClusterLeaves cb err:', err); return; }
            onLeaves(leaves);
          });
          // v5-style Promise (preferred). If both fire we just call onLeaves twice;
          // it's idempotent because _atlasShowSpider re-sets the spider source data.
          if (result && typeof result.then === 'function') {
            result.then(onLeaves).catch(err => console.warn('[atlas] getClusterLeaves promise err:', err));
          }
        });

        // ---- SPIDER (expanded-cluster) source + layers ----
        // Created once, kept empty until a cluster is spider-expanded.
        _atlasMap.addSource('atlas-spider-lines', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
        _atlasMap.addSource('atlas-spider-points', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
        // Leader lines (rendered UNDER spider points). Gold-soft, slim.
        _atlasMap.addLayer({
          id: 'atlas-spider-leaders',
          source: 'atlas-spider-lines',
          type: 'line',
          layout: { 'line-cap': 'round' },
          paint: {
            'line-color': _atlasToken('--gold-soft', '#a87f3e'),
            'line-width': 1.1,
            'line-opacity': 0.6,
            'line-blur': 0.3
          }
        });
        // Spider points — small dots, generous gold ring so they read as
        // "expanded cluster member". Kept compact so the labels can breathe.
        _atlasMap.addLayer({
          id: 'atlas-spider-circles',
          source: 'atlas-spider-points',
          type: 'circle',
          paint: {
            'circle-radius': ['+', 4, ['*', 0.6, ['sqrt', ['coalesce', ['get', 'deg'], 0]]]],
            'circle-color': ['get', 'family_color'],
            'circle-stroke-width': 1.5,
            'circle-stroke-color': _atlasToken('--gold', '#d4a55a'),
            'circle-opacity': 0.95
          }
        });
        // Spider TEXT LABELS — every spider point shows its title (user 2026-05-15:
        // "displaying text — so we can select pick and zoom out easily"). Hub-tier
        // labels render first via symbol-sort-key so they win declutter.
        try {
          _atlasMap.addLayer({
            id: 'atlas-spider-labels',
            source: 'atlas-spider-points',
            type: 'symbol',
            layout: {
              'text-field': ['get', 'title'],
              'text-font': ['Noto Sans Regular'],
              'text-size': 11,
              'text-anchor': 'left',
              'text-offset': [0.9, 0],
              'text-allow-overlap': true,        // spider items are spaced; we WANT all labels visible
              'text-ignore-placement': true,
              'symbol-sort-key': ['+', ['coalesce', ['get', 'tier'], 3], ['*', -0.001, ['get', 'deg']]]
            },
            paint: {
              'text-color': _atlasToken('--text-0', '#f1ede2'),
              'text-halo-color': _atlasToken('--bg-0', '#07090f'),
              'text-halo-width': 1.6
            }
          });
        } catch (e) {
          console.warn('[atlas] spider labels skipped:', e.message);
        }

        // Spider hover/click — same UX as the underlying circles.
        _atlasMap.on('mousemove', 'atlas-spider-circles', (ev) => {
          if (!ev.features || !ev.features.length) return;
          const f  = ev.features[0];
          const id = f.properties.id;
          const n  = _atlasNodesById.get(id);
          if (!n) return;
          _atlasMap.getCanvas().style.cursor = 'pointer';
          if (_atlasHoveredId !== id) {
            _atlasHoveredId = id;
            _atlasShowHoverTrails(id);  // also dims/highlights underneath circle + spider layers
          }
          showTooltip(
            `${tooltipThumb(n)}<div class="ttitle">${n.title}</div>
             <div class="tmeta">${n.type}${n.family ? ' · ' + n.family : ''}${n.geo.label ? ' · ' + n.geo.label : ''}</div>
             <div class="tmeta">${fmtDateRange(n.date_earliest, n.date_latest) || '—'}</div>`, ev.originalEvent);
        });
        _atlasMap.on('mouseleave', 'atlas-spider-circles', () => {
          _atlasMap.getCanvas().style.cursor = '';
          _atlasHoveredId = null;
          hideTooltip();
          // Same sticky-selection logic as on the main circle layer.
          if (_atlasLockedId) _atlasShowHoverTrails(_atlasLockedId);
          else _atlasHideHoverTrails();
        });
        _atlasMap.on('click', 'atlas-spider-circles', (ev) => {
          if (!ev.features || !ev.features.length) return;
          const id = ev.features[0].properties.id;
          selectNode(id, true);
          _atlasLockedId = id;          // lock through the spider too
          _atlasHideSpider();           // close the spider; locked trails stay on main layer
          _atlasShowHoverTrails(id);
        });

        // Background click (anywhere off a feature) clears EVERYTHING and eases
        // back to the natural state the user was viewing BEFORE they opened the
        // spider (user 2026-05-15: "if after zoom once we click empty the
        // bubbles zoom back to their natural state").
        _atlasMap.on('click', (ev) => {
          const onFeature = _atlasMap.queryRenderedFeatures(ev.point, {
            layers: ['atlas-nodes-circles', 'atlas-spider-circles', 'atlas-clusters']
          });
          if (onFeature.length) return;
          const hadSpider = !!_atlasSpiderActive;
          if (_atlasSpiderActive) _atlasHideSpider();
          if (_atlasLockedId) {
            _atlasLockedId = null;
            _atlasHideHoverTrails();
          }
          // Ease back to the pre-spider vantage so the user resumes scanning
          // the overview without manually zooming out.
          if (hadSpider && _atlasPreSpiderState) {
            const { center, zoom } = _atlasPreSpiderState;
            _atlasSpiderRecentering = true;   // suppress hide-on-zoomstart
            _atlasMap.easeTo({ center, zoom, duration: 500 });
            _atlasMap.once('moveend', () => { _atlasSpiderRecentering = false; });
            _atlasPreSpiderState = null;
          }
        });
        // Ignore the synthetic zoom/move events that fire while we're auto-recentering
        // a cluster to make room for the spider expansion (item 3 polish, 2026-05-15).
        _atlasMap.on('zoomstart', () => { if (_atlasSpiderActive && !_atlasSpiderRecentering) _atlasHideSpider(); });
        _atlasMap.on('dragstart', () => { if (_atlasSpiderActive && !_atlasSpiderRecentering) _atlasHideSpider(); });
      }
    };

    if (_atlasMap.isStyleLoaded()) {
      setup();
    } else {
      // In MapLibre v5, 'load' may not fire when using custom pmtiles:// protocol.
      // 'idle' fires once the map is fully rendered for the first time.
      // setTimeout is the final fallback if neither event fires within 5s.
      let setupDone = false;
      const runSetup = () => { if (!setupDone && _atlasMap) { setupDone = true; setup(); } };
      _atlasMap.once('load', runSetup);
      _atlasMap.once('idle', runSetup);
      setTimeout(runSetup, 5000);
    }

    // Rewire zoom / end handlers (remove old, add fresh — labelMode lives in closure via STATE).
    if (_atlasZoomHandler) _atlasMap.off('zoom', _atlasZoomHandler);
    if (_atlasEndHandler) {
      _atlasMap.off('zoomend', _atlasEndHandler);
      _atlasMap.off('moveend', _atlasEndHandler);
    }
    _atlasZoomHandler = () => { _atlasUpdateLOD(); _atlasUpdateZoomMeter(); };
    _atlasEndHandler  = () => _atlasDeclutter();
    _atlasMap.on('zoom', _atlasZoomHandler);
    _atlasMap.on('zoomend', _atlasEndHandler);
    _atlasMap.on('moveend', _atlasEndHandler);

    // Wire zoom-meter buttons to MapLibre
    const zmIn    = document.getElementById('zm-in');
    const zmOut   = document.getElementById('zm-out');
    const zmReset = document.getElementById('zm-reset');
    if (zmIn)    zmIn.onclick    = () => _atlasMap && _atlasMap.zoomIn({ duration: 260 });
    if (zmOut)   zmOut.onclick   = () => _atlasMap && _atlasMap.zoomOut({ duration: 260 });
    if (zmReset) zmReset.onclick = () => _atlasMap && _atlasMap.easeTo({ center: [40, 28], zoom: 2.2, duration: 600 });
    _atlasUpdateZoomMeter();
  }
};

// ---- Cheap LOD pass — opacity by tier + zoom (runs every zoom frame) ----
function _atlasUpdateLOD() {
  if (!_atlasMap) return;
  const k = _atlasMap.getZoom();
  const mode = STATE.atlasLabelMode || 'hub';
  // MapLibre zoom domain [0.6, 7.5] remapped into shared [0.5, 12] tier-space so
  // the shared tierVisibilityThreshold curves behave consistently across views.
  const kRemap = 0.5 + (Math.max(0.6, Math.min(7.5, k)) - 0.6) * (11.5 / 6.9);
  _atlasMarkers.forEach(m => {
    const op = tierVisibilityThreshold(m.tier, kRemap, mode);
    m.el.style.opacity = op.toFixed(2);
    m.el.style.pointerEvents = op > 0.05 ? 'auto' : 'none';
    m.el.classList.toggle('dim', op < 0.5);
  });
}

// ---- Expensive declutter pass — bbox conflict, runs on zoomend/moveend ----
function _atlasDeclutter() {
  if (!_atlasMap) return;
  const items = [];
  _atlasMarkers.forEach(m => {
    const op = parseFloat(m.el.style.opacity || '1');
    if (op <= 0.1) { m.el.classList.remove('hidden-by-declutter'); return; }
    m.el.classList.remove('hidden-by-declutter');
    items.push({ m, deg: m.deg, bb: m.el.getBoundingClientRect() });
  });
  items.sort((a, b) => b.deg - a.deg);
  const claimed = [];
  const PAD = 2;
  items.forEach(it => {
    const bb = it.bb;
    if (!bb.width || !bb.height) return;
    const x0 = bb.left - PAD, x1 = bb.right + PAD;
    const y0 = bb.top - PAD,  y1 = bb.bottom + PAD;
    const conflict = claimed.some(c => !(x1 < c.x0 || c.x1 < x0 || y1 < c.y0 || c.y1 < y0));
    if (conflict) it.m.el.classList.add('hidden-by-declutter');
    else claimed.push({ x0, x1, y0, y1 });
  });
}

// ---- Zoom meter readout for Atlas MapLibre map ----
function _atlasUpdateZoomMeter() {
  if (!_atlasMap) return;
  const readout = document.getElementById('zm-readout');
  if (!readout) return;
  const mult = Math.pow(2, _atlasMap.getZoom() - 2.2);
  readout.textContent = mult.toFixed(2) + '×';
}

// ---- Hover trails: GeoJSON line source updated on the fly.
// Also drives circle-layer dim/highlight via setPaintProperty (no DOM classes
// — markers are native MapLibre features now, not DOM elements). ----
function _atlasShowHoverTrails(id) {
  if (!_atlasMap) return;
  const source = _atlasMap.getSource('atlas-trails');
  if (!source) return;
  const me = _atlasNodesById.get(id);
  if (!me || !me.geo) return;
  const meLngLat = [me.geo.lon, me.geo.lat];
  const nbrs = NEIGHBORS.get(id);
  const features = [];
  const neighborIds = [];
  if (nbrs) {
    nbrs.forEach(nbId => {
      const them = _atlasNodesById.get(nbId);
      if (!them || !them.geo) return;
      neighborIds.push(nbId);
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [meLngLat, [them.geo.lon, them.geo.lat]] },
        properties: { from: id, to: nbId }
      });
    });
  }
  source.setData({ type: 'FeatureCollection', features });
  // Dim non-related circles on BOTH the main node layer AND the spider layer (when
  // the spider is open) via data-driven paint expressions. This makes the hover
  // behave consistently whether you're hovering a regular dot or a spider point.
  const hotIds = [id, ...neighborIds];
  const opacityExpr = ['case', ['in', ['get', 'id'], ['literal', hotIds]], 1, 0.18];
  const strokeExpr  = [
    'case',
    ['==', ['get', 'id'], id], _atlasToken('--gold', '#d4a55a'),
    ['in', ['get', 'id'], ['literal', neighborIds]], _atlasToken('--gold-soft', '#a87f3e'),
    'rgba(255,255,255,0.20)'
  ];
  if (_atlasMap.getLayer && _atlasMap.getLayer('atlas-nodes-circles')) {
    _atlasMap.setPaintProperty('atlas-nodes-circles', 'circle-opacity', opacityExpr);
    _atlasMap.setPaintProperty('atlas-nodes-circles', 'circle-stroke-color', strokeExpr);
  }
  if (_atlasMap.getLayer && _atlasMap.getLayer('atlas-spider-circles')) {
    _atlasMap.setPaintProperty('atlas-spider-circles', 'circle-opacity', opacityExpr);
    // Spider layer already uses --gold as default stroke; brighten further on hover.
    _atlasMap.setPaintProperty('atlas-spider-circles', 'circle-stroke-color', strokeExpr);
  }
}
function _atlasHideHoverTrails() {
  if (!_atlasMap) return;
  const source = _atlasMap.getSource('atlas-trails');
  if (source) source.setData({ type: 'FeatureCollection', features: [] });
  if (_atlasMap.getLayer && _atlasMap.getLayer('atlas-nodes-circles')) {
    _atlasMap.setPaintProperty('atlas-nodes-circles', 'circle-opacity', 0.95);
    _atlasMap.setPaintProperty('atlas-nodes-circles', 'circle-stroke-color', 'rgba(255,255,255,0.20)');
  }
  if (_atlasMap.getLayer && _atlasMap.getLayer('atlas-spider-circles')) {
    _atlasMap.setPaintProperty('atlas-spider-circles', 'circle-opacity', 0.95);
    _atlasMap.setPaintProperty('atlas-spider-circles', 'circle-stroke-color', _atlasToken('--gold', '#d4a55a'));
  }
}

// ---- SPIDERFY: fan a cluster's leaves around the click center as offset markers.
// Replaces the prior cluster-list popup; gives spatial separation that lets the
// user click individual nodes even when their geocoded coords are identical.
// Layout: ring(s) of N items around centerLngLat. Pixel-radius constant per zoom
// (computed via map.project / map.unproject) so the spread feels right at any
// zoom. Multi-ring spiral when N > 8 to avoid overlap. ----
function _atlasShowSpider(centerLngLat, leaves) {
  if (!_atlasMap) return;
  const pointsSrc = _atlasMap.getSource('atlas-spider-points');
  const linesSrc  = _atlasMap.getSource('atlas-spider-lines');
  if (!pointsSrc || !linesSrc) return;

  const N = leaves.length;
  // Compute layout constants up-front so we know the outer-ring pixel-radius
  // (used both for layout below AND for the viewport-edge check at the top).
  const baseRadius   = N <= 6 ? 46 : 56;
  const radiusStep   = 38;
  const itemsPerRing = N <= 8 ? N : 10;
  const ringCount    = Math.ceil(N / itemsPerRing);
  const outerRadius  = baseRadius + (ringCount - 1) * radiusStep;

  // Item 3 polish: if the cluster sits within `outerRadius + margin` pixels of any
  // viewport edge, smoothly recenter the map on it first — otherwise the spider
  // ring would overflow off-screen. The recenter is gated by _atlasSpiderRecentering
  // so the zoomstart/dragstart hide-handlers don't fire during the animation.
  const margin   = 24;
  const centerPx = _atlasMap.project(centerLngLat);
  const rect     = _atlasMap.getContainer().getBoundingClientRect();
  const needsRecenter =
    centerPx.x < outerRadius + margin ||
    centerPx.x > rect.width  - outerRadius - margin ||
    centerPx.y < outerRadius + margin ||
    centerPx.y > rect.height - outerRadius - margin;
  if (needsRecenter && !_atlasSpiderRecentering) {
    _atlasSpiderRecentering = true;
    _atlasMap.once('moveend', () => {
      _atlasSpiderRecentering = false;
      // Recompute after the move (the projected center is now the viewport center).
      _atlasShowSpider(centerLngLat, leaves);
    });
    _atlasMap.easeTo({ center: centerLngLat, duration: 380 });
    return;
  }

  const pointFeatures = [];
  const lineFeatures  = [];

  leaves.forEach((leaf, i) => {
    const ringIdx  = Math.floor(i / itemsPerRing);
    const inRing   = i % itemsPerRing;
    const perRing  = (ringIdx === 0 && N < itemsPerRing) ? N : itemsPerRing;
    const ringR    = baseRadius + ringIdx * radiusStep;
    // Stagger alternating rings by half-step so the second ring sits between gaps.
    const angleOff = (ringIdx % 2) ? (Math.PI / perRing) : 0;
    const angle    = (inRing / perRing) * 2 * Math.PI - Math.PI / 2 + angleOff;
    const px = centerPx.x + ringR * Math.cos(angle);
    const py = centerPx.y + ringR * Math.sin(angle);
    const ll = _atlasMap.unproject([px, py]);
    const coord = [ll.lng, ll.lat];

    pointFeatures.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coord },
      properties: { ...leaf.properties }
    });
    lineFeatures.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [centerLngLat, coord] }
    });
  });

  pointsSrc.setData({ type: 'FeatureCollection', features: pointFeatures });
  linesSrc.setData({ type: 'FeatureCollection', features: lineFeatures });
  _atlasSpiderActive = centerLngLat;
}
function _atlasHideSpider() {
  if (!_atlasMap) return;
  const pointsSrc = _atlasMap.getSource('atlas-spider-points');
  const linesSrc  = _atlasMap.getSource('atlas-spider-lines');
  if (pointsSrc) pointsSrc.setData({ type: 'FeatureCollection', features: [] });
  if (linesSrc)  linesSrc.setData({ type: 'FeatureCollection', features: [] });
  _atlasSpiderActive = null;
}

// ============================================================
// ERA-RANGE SLIDER (opus-map-era, 2026-05-15)
// Dual-handle horizontal slider docked at the bottom of the atlas pane. Drag
// either end to trim the era window; release commits the new STATE.atlasEra
// and triggers a re-render (which re-filters the GeoJSON node source). Phase
// bands under the track give visual context for ANE / Axial / Late-Antique /
// Medieval / Modern.
// ============================================================
const _ERA_MIN = -3500;
const _ERA_MAX =  2050;
const _ERA_PHASES = [
  // [from, to, color-token, label]
  [-3500, -1000, '--era-phase-anc',   'ANE'],
  [-1000,   100, '--era-phase-axial', 'Axial'],
  [  100,   800, '--era-phase-late',  'Late Ant.'],
  [  800,  1500, '--era-phase-med',   'Medieval'],
  [ 1500,  2050, '--era-phase-mod',   'Modern'],
];

function _eraFmt(year) {
  return year < 0 ? `${-year} BCE` : year < 100 ? `+${year} CE` : `${year} CE`;
}

function _renderAtlasEraSlider(paneEl, era) {
  // Clear any prior slider (each setView('atlas') re-creates it).
  const existing = paneEl.querySelector('.atlas-era-bar');
  if (existing) existing.remove();

  // Phase-band gradient stops (computed as % of the full range).
  const span = _ERA_MAX - _ERA_MIN;
  const pct  = (y) => `${((y - _ERA_MIN) / span * 100).toFixed(2)}%`;
  const bandStops = _ERA_PHASES.map(([a, b, tok]) =>
    `var(${tok}) ${pct(a)}, var(${tok}) ${pct(b)}`
  ).join(', ');

  const bar = document.createElement('div');
  bar.className = 'atlas-era-bar';
  bar.innerHTML = `
    <div class="atlas-era-readout"><span id="atlas-era-lo">${_eraFmt(era.lo)}</span></div>
    <div class="atlas-era-track" id="atlas-era-track">
      <div class="atlas-era-bands" style="background: linear-gradient(to right, ${bandStops});"></div>
      <div class="atlas-era-fill" id="atlas-era-fill"></div>
      <div class="atlas-era-tick atlas-era-tick-zero" style="left: ${pct(0)};" title="0 / Common Era"></div>
      <button class="atlas-era-handle atlas-era-handle-lo" id="atlas-era-handle-lo" data-handle="lo" title="Drag to trim the left edge"></button>
      <button class="atlas-era-handle atlas-era-handle-hi" id="atlas-era-handle-hi" data-handle="hi" title="Drag to trim the right edge"></button>
    </div>
    <div class="atlas-era-readout"><span id="atlas-era-hi">${_eraFmt(era.hi)}</span></div>
    <button class="atlas-era-reset btn btn-mini" id="atlas-era-reset" title="Reset to all eras">↺</button>
  `;
  paneEl.appendChild(bar);

  const track   = bar.querySelector('#atlas-era-track');
  const fillEl  = bar.querySelector('#atlas-era-fill');
  const loHand  = bar.querySelector('#atlas-era-handle-lo');
  const hiHand  = bar.querySelector('#atlas-era-handle-hi');
  const loRead  = bar.querySelector('#atlas-era-lo');
  const hiRead  = bar.querySelector('#atlas-era-hi');

  function yearToPct(y) { return ((y - _ERA_MIN) / span) * 100; }
  function pxToYear(px, trackRect) {
    const x = Math.max(0, Math.min(trackRect.width, px));
    return Math.round(_ERA_MIN + (x / trackRect.width) * span);
  }
  function paintFromState() {
    const lo = era.lo, hi = era.hi;
    loHand.style.left = `${yearToPct(lo)}%`;
    hiHand.style.left = `${yearToPct(hi)}%`;
    fillEl.style.left  = `${yearToPct(lo)}%`;
    fillEl.style.right = `${100 - yearToPct(hi)}%`;
    loRead.textContent = _eraFmt(lo);
    hiRead.textContent = _eraFmt(hi);
  }
  paintFromState();

  // Drag logic — pointer events so it works on touch too.
  let dragging = null;   // 'lo' or 'hi' or null
  let dragRect = null;

  function startDrag(which, ev) {
    dragging = which;
    dragRect = track.getBoundingClientRect();
    document.body.style.cursor = 'grabbing';
    (which === 'lo' ? loHand : hiHand).setPointerCapture?.(ev.pointerId);
    ev.preventDefault();
  }
  function moveDrag(ev) {
    if (!dragging) return;
    const px = ev.clientX - dragRect.left;
    let y = pxToYear(px, dragRect);
    // Clamp so handles don't cross (min 50-year gap).
    if (dragging === 'lo') y = Math.min(y, era.hi - 50);
    else                   y = Math.max(y, era.lo + 50);
    era[dragging] = y;
    paintFromState();
  }
  function endDrag() {
    if (!dragging) return;
    dragging = null;
    document.body.style.cursor = '';
    STATE.atlasEra = { lo: era.lo, hi: era.hi };
    // Re-filter map without a full setView re-render (cheaper). The atlas-nodes
    // source needs a fresh FeatureCollection because the era-filter runs in
    // the geoNodes computation upstream; easiest is just setView('atlas').
    setView('atlas');
  }

  loHand.addEventListener('pointerdown', (ev) => startDrag('lo', ev));
  hiHand.addEventListener('pointerdown', (ev) => startDrag('hi', ev));
  // Remove any prior window-level listeners (each setView('atlas') re-creates
  // them; without removal they accumulate and slow drags after many renders).
  if (window._atlasEraMove) window.removeEventListener('pointermove', window._atlasEraMove);
  if (window._atlasEraUp)   window.removeEventListener('pointerup',   window._atlasEraUp);
  if (window._atlasEraUp)   window.removeEventListener('pointercancel', window._atlasEraUp);
  window._atlasEraMove = moveDrag;
  window._atlasEraUp   = endDrag;
  window.addEventListener('pointermove', moveDrag);
  window.addEventListener('pointerup',   endDrag);
  window.addEventListener('pointercancel', endDrag);

  // Click anywhere on the track jumps the nearest handle.
  track.addEventListener('pointerdown', (ev) => {
    if (ev.target.classList.contains('atlas-era-handle')) return;
    const rect = track.getBoundingClientRect();
    const y    = pxToYear(ev.clientX - rect.left, rect);
    const which = (Math.abs(y - era.lo) < Math.abs(y - era.hi)) ? 'lo' : 'hi';
    era[which] = y;
    paintFromState();
    startDrag(which, ev);
  });

  // Reset button restores all-eras.
  bar.querySelector('#atlas-era-reset').addEventListener('click', () => {
    STATE.atlasEra = { lo: _ERA_MIN, hi: _ERA_MAX };
    setView('atlas');
  });
}

// Helpers for the era-window dropdown (kept local to Atlas).
function eraVal(era) {
  if (!era) return 'all';
  const k = era.lo + ':' + era.hi;
  return ({
    '-3500:2050': 'all',
    '-3500:-1000': 'prehistory',
    '-1000:100':   'axial',
    '100:800':     'late-ant',
    '800:1500':    'medieval',
    '1500:2050':   'modern',
  })[k] || 'all';
}
function eraFromVal(v) {
  return ({
    'all':        { lo: -3500, hi: 2050 },
    'prehistory': { lo: -3500, hi: -1000 },
    'axial':      { lo: -1000, hi: 100  },
    'late-ant':   { lo: 100,   hi: 800  },
    'medieval':   { lo: 800,   hi: 1500 },
    'modern':     { lo: 1500,  hi: 2050 },
  })[v] || { lo: -3500, hi: 2050 };
}

// ============================================================
// AUTHORS — three distinct signals, kept separate so investigation rigor isn't lost.
//   • authored          (texts-authored)        — defensible authorship
//   • attributed-author (texts-attributed-to)   — tradition/disputed/pseudonymous
//   • originated        (originator-of)         — concept/theme origination, not text authorship
// Two modes: WORKS (texts-by-person, with attribution badges) and ORIGINATORS (concepts-by-person).
// ============================================================
VIEWS.authors = {
  title: 'Authors',
  subtitle: 'every named voice — what they wrote, what was attributed to them, what they originated',
  render() {
    // ----- Build the three signal maps -----
    const worksByAuthor = new Map();          // pid → [{node, status: 'authored'|'attributed'}]
    const conceptsByOriginator = new Map();   // pid → [theme/doc node]
    EDGES.forEach(e => {
      if (e.type !== 'authored' && e.type !== 'attributed-author' && e.type !== 'originated') return;
      const src = NODES_BY_ID[e.source];
      const tgt = NODES_BY_ID[e.target];
      if (!src || src.type !== 'person' || !tgt) return;
      if (e.type === 'originated') {
        if (!conceptsByOriginator.has(src.id)) conceptsByOriginator.set(src.id, []);
        conceptsByOriginator.get(src.id).push(tgt);
        return;
      }
      if (!worksByAuthor.has(src.id)) worksByAuthor.set(src.id, []);
      worksByAuthor.get(src.id).push({ node: tgt, status: e.type === 'authored' ? 'authored' : 'attributed' });
    });
    // Deduplicate: if a person both `authored` and was `attributed` the same work, prefer authored.
    worksByAuthor.forEach((arr, pid) => {
      const byId = new Map();
      arr.forEach(w => {
        const prev = byId.get(w.node.id);
        if (!prev || (prev.status === 'attributed' && w.status === 'authored')) byId.set(w.node.id, w);
      });
      worksByAuthor.set(pid, Array.from(byId.values()));
    });

    // ----- Era bands -----
    const ERAS = [
      { id: 'p1', label: 'Phase 1 · Ancient Near East & Egypt', a: -10000, b: -1500 },
      { id: 'p2', label: 'Phase 2 · Axial Age',                  a: -1500,  b: -500 },
      { id: 'p3', label: 'Phase 3 · Hellenistic & 2nd Temple',   a: -500,   b: 100 },
      { id: 'p4', label: 'Phase 4 · Late Antiquity',             a: 100,    b: 700 },
      { id: 'p5', label: 'Phase 5 · Medieval',                   a: 700,    b: 1500 },
      { id: 'p6', label: 'Phase 6 · Early Modern',               a: 1500,   b: 1800 },
      { id: 'p7', label: 'Phase 7 · Modern',                     a: 1800,   b: 2100 },
      { id: 'unk', label: 'Undated / Pseudepigraphic',           a: 99000,  b: 99999 },
    ];
    function eraOf(year) {
      if (typeof year !== 'number') return ERAS[ERAS.length - 1];
      for (const e of ERAS) if (year >= e.a && year < e.b) return e;
      return ERAS[ERAS.length - 1];
    }

    // ----- View state -----
    let mode = 'works';      // works | originators
    let sortMode = 'date';   // date | name | works | degree

    function collectRows() {
      const src = (mode === 'works') ? worksByAuthor : conceptsByOriginator;
      const rows = [];
      src.forEach((items, pid) => {
        const p = NODES_BY_ID[pid];
        if (!p || !matchesFilter(p)) return;
        const dateKey = (typeof p.date_earliest === 'number') ? p.date_earliest : 99999;
        rows.push({ p, items, dateKey, degree: DEGREE.get(p.id) || 0 });
      });
      return rows;
    }
    function applySort(rows) {
      const cmp = {
        date:   (a, b) => a.dateKey - b.dateKey || a.p.title.localeCompare(b.p.title),
        name:   (a, b) => a.p.title.localeCompare(b.p.title),
        works:  (a, b) => b.items.length - a.items.length || a.p.title.localeCompare(b.p.title),
        degree: (a, b) => b.degree - a.degree || a.p.title.localeCompare(b.p.title),
      }[sortMode];
      rows.sort(cmp);
    }

    const pane = document.createElement('div');
    pane.className = 'list-pane authors-pane';
    document.getElementById('canvas').appendChild(pane);

    function render() {
      const rows = collectRows();
      applySort(rows);

      const authoredCount   = EDGES.filter(e => e.type === 'authored').length;
      const attributedCount = EDGES.filter(e => e.type === 'attributed-author').length;
      const originatedCount = EDGES.filter(e => e.type === 'originated').length;

      const headerCount = (mode === 'works')
        ? `${rows.length} authors · ${authoredCount} authored · ${attributedCount} attributed`
        : `${rows.length} originators · ${originatedCount} concepts originated`;

      const toolbar = `<div class="authors-toolbar">
        <span class="at-count">${headerCount}</span>
        <span class="at-spacer"></span>
        <span class="at-lbl">mode</span>
        <button class="at-sort${mode === 'works' ? ' active' : ''}" data-mode="works">works</button>
        <button class="at-sort${mode === 'originators' ? ' active' : ''}" data-mode="originators">originators</button>
        <span class="at-divider">·</span>
        <span class="at-lbl">sort</span>
        ${['date','name','works','degree'].map(k =>
          `<button class="at-sort${sortMode === k ? ' active' : ''}" data-sort="${k}">${k === 'works' && mode === 'originators' ? 'count' : k}</button>`
        ).join('')}
      </div>`;

      function workSample(items) {
        return items.slice(0, 4).map(w => {
          if (mode === 'works') {
            const badge = w.status === 'attributed' ? '<span class="at-attrib">attrib.</span> ' : '';
            return `${badge}${w.node.title}`;
          }
          return w.title;
        }).join(' · ');
      }
      function rowHTML(r) {
        const p = r.p;
        const dateLabel = (typeof p.date_earliest === 'number')
          ? fmtDateRange(p.date_earliest, p.date_latest) || '—'
          : '—';
        const tradPill = p.tradition ? `<span class="row-trad">${p.tradition}</span>` : '';
        const sample = workSample(r.items);
        const overflow = r.items.length > 4 ? ` <span style="color:var(--text-3)">+${r.items.length - 4}</span>` : '';
        const noun = mode === 'works'
          ? `${r.items.length} work${r.items.length === 1 ? '' : 's'}`
          : `${r.items.length} concept${r.items.length === 1 ? '' : 's'}`;
        return `<div class="row" data-id="${p.id}">
          <span class="swatch" style="background:${p.family_color || p.tradition_color || '#7a8090'}"></span>
          <div>
            <div class="row-title">${p.title}</div>
            <div class="row-meta">${noun} · ${sample}${overflow}</div>
          </div>
          <div class="row-meta authors-date">${dateLabel}</div>
          ${tradPill}
          <div class="row-meta">→</div>
        </div>`;
      }

      let body = '';
      if (sortMode === 'date') {
        const buckets = new Map();
        ERAS.forEach(e => buckets.set(e.id, []));
        rows.forEach(r => buckets.get(eraOf(r.dateKey).id).push(r));
        body = ERAS.map(e => {
          const list = buckets.get(e.id);
          if (!list.length) return '';
          return `<div class="authors-era">${e.label} <span class="at-era-count">· ${list.length}</span></div>
                  ${list.map(rowHTML).join('')}`;
        }).join('');
      } else {
        body = rows.map(rowHTML).join('');
      }

      const empty = mode === 'works'
        ? 'No authored or attributed works yet.'
        : 'No originator-of-concept claims wired yet. Add <code>originator-of: [[theme]]</code> to a person\'s YAML to populate this view (e.g. <code>plato.md → originator-of: [[demiurge]]</code>).';

      pane.innerHTML = toolbar + (body || `<div style="color:var(--text-3); padding: 24px; font-style: italic;">${empty}</div>`);
    }

    pane.addEventListener('click', (ev) => {
      const modeBtn = ev.target.closest('[data-mode]');
      if (modeBtn) { mode = modeBtn.dataset.mode; render(); return; }
      const sortBtn = ev.target.closest('[data-sort]');
      if (sortBtn) { sortMode = sortBtn.dataset.sort; render(); return; }
      const r = ev.target.closest('.row');
      if (r && r.dataset.id) selectNode(r.dataset.id, true);
    });
    render();
  }
};

// ============================================================
// THEMES list, CONNECTIONS, TRADITIONS, ALL, ABOUT  — preserved
// ============================================================
VIEWS.themes = {
  title: 'Themes (list)',
  subtitle: 'recurring motifs across traditions',
  render() {
    const pane = document.createElement('div'); pane.className = 'list-pane';
    const themes = DATA.nodes.filter(n => n.type === 'theme' && matchesFilter(n));
    themes.sort((a, b) => a.title.localeCompare(b.title));
    pane.innerHTML = themes.map(t => {
      const inLinks = EDGES.filter(e => e.target === t.id).length;
      return `<div class="row" data-id="${t.id}">
        <span class="swatch" style="background:#6e8c6b"></span>
        <div>
          <div class="row-title">${t.title}</div>
          <div class="row-meta">${t.category || ''} · ${inLinks} attestations</div>
        </div>
        <div class="row-trad">${t.status || ''}</div>
        <div class="row-meta">→</div>
      </div>`;
    }).join('') || '<div class="list-pane-empty">No themes match the filter.</div>';
    pane.addEventListener('click', (ev) => { const r = ev.target.closest('.row'); if (r && r.dataset.id) selectNode(r.dataset.id, true); });
    document.getElementById('canvas').appendChild(pane);
  }
};

VIEWS.edges = {
  title: 'Connections',
  subtitle: 'every claimed edge between nodes, by type',
  render() {
    const pane = document.createElement('div'); pane.className = 'list-pane';
    const byType = {};
    EDGES.forEach(e => { (byType[e.type] = byType[e.type] || []).push(e); });
    const types = Object.keys(byType).sort();
    pane.innerHTML = types.map(t => {
      const st = edgeStyle(t);
      return `
      <div class="list-pane-header" style="--lph-accent: ${st.c}">
        <span class="lph-rule"></span>${t}<span class="lph-count">· ${byType[t].length}</span>
      </div>
      ${byType[t].slice(0, 150).map(e => {
        const s = NODES_BY_ID[e.source], tg = NODES_BY_ID[e.target];
        return `<div class="row" data-target-id="${e.target}">
          <span class="swatch" style="background:${s.family_color || s.tradition_color || '#7a8090'}"></span>
          <div>
            <div class="row-title">${s.title} <span style="color:var(--text-3)">→</span> ${tg.title}</div>
            <div class="row-meta">${s.family || s.type} → ${tg.family || tg.type}</div>
          </div>
          <div class="row-meta">${e.field || e.from || ''}</div>
          <div class="row-meta">→</div>
        </div>`;
      }).join('')}
    `;}).join('');
    pane.addEventListener('click', (ev) => { const r = ev.target.closest('.row'); if (r && r.dataset.targetId) selectNode(r.dataset.targetId, true); });
    document.getElementById('canvas').appendChild(pane);
  }
};

VIEWS.traditions = {
  title: 'Tradition families',
  subtitle: 'roll-up by family · click to filter all views',
  render() {
    const pane = document.createElement('div'); pane.className = 'list-pane';
    const map = {};
    DATA.nodes.forEach(n => {
      const f = n.family || 'Other';
      if (!map[f]) map[f] = { deity: 0, document: 0, person: 0, theme: 0, event: 0, color: n.family_color };
      map[f][n.type] = (map[f][n.type] || 0) + 1;
    });
    const ordered = (FAMILIES.length ? FAMILIES.map(f => f.name) : Object.keys(map)).filter(k => map[k]);
    pane.innerHTML = ordered.map(f => {
      const m = map[f];
      const total = (m.deity||0)+(m.document||0)+(m.person||0)+(m.theme||0)+(m.event||0);
      return `<div class="row" data-family="${f}">
        <span class="swatch" style="background:${m.color || '#7a8090'}"></span>
        <div>
          <div class="row-title">${f}</div>
          <div class="row-meta">${m.document||0} docs · ${m.deity||0} deities · ${m.person||0} persons · ${m.theme||0} themes${m.event ? ' · ' + m.event + ' events' : ''}</div>
        </div>
        <div class="row-meta">${total}</div>
        <div class="row-meta">→</div>
      </div>`;
    }).join('');
    pane.addEventListener('click', (ev) => {
      const r = ev.target.closest('.row');
      if (r && r.dataset.family) {
        STATE.filter.family = r.dataset.family;
        document.getElementById('filter-family').value = STATE.filter.family;
        setView('pantheon');
      }
    });
    document.getElementById('canvas').appendChild(pane);
  }
};

VIEWS.all = {
  title: 'All nodes',
  subtitle: 'flat searchable index, date-sorted',
  render() {
    const pane = document.createElement('div'); pane.className = 'list-pane';
    const nodes = DATA.nodes.filter(matchesFilter);
    nodes.sort((a, b) => (a.date_earliest ?? 999999) - (b.date_earliest ?? 999999));
    pane.innerHTML = nodes.map(n => `
      <div class="row" data-id="${n.id}">
        <span class="swatch" style="background:${n.family_color || n.tradition_color || '#7a8090'}"></span>
        <div>
          <div class="row-title">${n.title}</div>
          <div class="row-meta">${n.type} · ${n.family || '—'} · ${fmtDateRange(n.date_earliest, n.date_latest) || '—'}</div>
        </div>
        <div class="row-trad">${n.status || ''}</div>
        <div class="row-meta">→</div>
      </div>
    `).join('') || '<div style="color:var(--text-3); padding: 24px; font-style: italic;">Nothing matches the filter.</div>';
    pane.addEventListener('click', (ev) => { const r = ev.target.closest('.row'); if (r && r.dataset.id) selectNode(r.dataset.id, true); });
    document.getElementById('canvas').appendChild(pane);
  }
};

VIEWS.about = {
  title: 'About this atlas',
  subtitle: 'posture, schema, sources',
  render() {
    const pane = document.createElement('div'); pane.className = 'about-pane';
    pane.innerHTML = `
      <h3>Posture</h3>
      <p>This is an investigation, not a devotional library. Every primary document is treated as equal historical evidence regardless of canonical status. The label distinguishes form and reception, not value.</p>

      <h3>Pantheon</h3>
      <p>Deities are clustered by <strong>tradition family</strong> (a coarser grouping than the raw <code>tradition</code> field). Families are arranged around a ring in adjacency order so that historically related families sit next to each other — syncretic edges become short arcs rather than chords across the diagram. Each family fills an annular wedge with low-opacity color, sized by sqrt(member count). Family labels float just outside the ring, rotated tangentially.</p>

      <h3>Documents map</h3>
      <p>Polar coordinates: <strong>angle = family wedge</strong>, <strong>radius = chronology</strong>. Oldest texts cluster near the center, newest at the rim. Phase rings (P1 → P4) mark the period boundaries. Edges between documents (shared themes, mutual influence) curve gently toward the center.</p>

      <h3>Edge palette</h3>
      <ul>
        <li><span style="color:#d4a55a">syncretic-identification</span> — gold</li>
        <li><span style="color:#6e8c6b">parent-of / child-of</span> — sage</li>
        <li><span style="color:#c47453">consort</span> — copper</li>
        <li><span style="color:#c44a5a">polemic-against</span> — crimson</li>
        <li><span style="color:#5aaca8">direct-quote / influenced-by</span> — teal</li>
        <li><span style="color:#5a6cc4">shared-milieu</span> — indigo</li>
        <li><span style="color:#7a8aa8">parallel-motif</span> — slate</li>
        <li><span style="color:#4a5a7a">attests / has-theme</span> — faint slate (membership, not influence)</li>
      </ul>

      <h3>Source tiers</h3>
      <p><strong>T1</strong> primary editions · <strong>T2</strong> peer-reviewed scholarship · <strong>T3</strong> reputable secondary · <strong>T4</strong> controversial / heterodox (never stand alone).</p>

      <p style="margin-top: 32px; color: var(--text-3); font-style: italic; font-size: 12px;">
        Generated: ${DATA.generated_at_utc || 'unknown'} · ${(DATA.nodes||[]).length} nodes · ${EDGES.length} edges
      </p>
    `;
    document.getElementById('canvas').appendChild(pane);
  }
};

// ============================================================
// THEMES DROPDOWN
// ============================================================
function buildThemesDropdown() {
  const themes = DATA.nodes.filter(n => n.type === 'theme');
  // group by category
  const byCat = {};
  themes.forEach(t => {
    const c = t.category || 'uncategorized';
    if (!byCat[c]) byCat[c] = [];
    byCat[c].push(t);
  });
  const catOrder = ['cosmogonic','eschatological','soteriological','theological','political-theological','anthropological','ritual','uncategorized'];
  const orderedCats = catOrder.filter(c => byCat[c]).concat(Object.keys(byCat).filter(c => !catOrder.includes(c)));

  // theme color: palette by category
  const catColors = {
    cosmogonic: '#5a6cc4', eschatological: '#c44a5a', soteriological: '#d4a55a',
    theological: '#6b3a8a', 'political-theological': '#c47453', anthropological: '#5aaca8',
    ritual: '#6e8c6b', uncategorized: '#7a8090',
  };

  const grid = document.getElementById('themes-grid');
  grid.innerHTML = '';
  orderedCats.forEach(cat => {
    const head = document.createElement('div');
    head.className = 'themes-cat';
    head.textContent = cat;
    grid.appendChild(head);
    byCat[cat].sort((a,b) => a.title.localeCompare(b.title)).forEach(t => {
      const count = EDGES.filter(e => e.target === t.id || e.source === t.id).length;
      const card = document.createElement('div');
      card.className = 'theme-card';
      if (STATE.filter.theme === t.id) card.classList.add('active');
      card.style.setProperty('--theme-color', catColors[cat] || '#d4a55a');
      card.innerHTML = `
        <div class="tc-swatch"></div>
        <div class="tc-name">${t.title}</div>
        <div class="tc-count">${count} attestations · ${cat}</div>
      `;
      card.onclick = () => {
        STATE.filter.theme = (STATE.filter.theme === t.id) ? '' : t.id;
        renderActiveTheme();
        closeThemesMenu();
        setView(STATE.view);
      };
      grid.appendChild(card);
    });
  });
}

function renderActiveTheme() {
  const wrap = document.getElementById('active-theme-wrap');
  const clearBtn = document.getElementById('themes-clear');
  if (!STATE.filter.theme) {
    wrap.style.display = 'none'; wrap.innerHTML = '';
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }
  const t = NODES_BY_ID[STATE.filter.theme];
  if (!t) { wrap.style.display = 'none'; if (clearBtn) clearBtn.style.display = 'none'; return; }
  wrap.style.display = 'flex';
  wrap.innerHTML = `<span class="active-filter">theme: ${t.title} <span class="x">×</span></span>`;
  wrap.querySelector('.x').onclick = () => {
    STATE.filter.theme = '';
    renderActiveTheme();
    buildThemesDropdown();   // refresh drawer cards so the active highlight drops
    setView(STATE.view);
  };
  if (clearBtn) clearBtn.style.display = '';
}

// Themes drawer "clear theme" button (header). Mirrors the footer chip's × but is reachable from inside the drawer.
document.addEventListener('click', (ev) => {
  if (ev.target && ev.target.id === 'themes-clear') {
    STATE.filter.theme = '';
    renderActiveTheme();
    buildThemesDropdown();
    setView(STATE.view);
  }
});

function openThemesMenu() {
  document.getElementById('themes-menu').classList.add('open');
  document.getElementById('themes-button').classList.add('open');
}
function closeThemesMenu() {
  document.getElementById('themes-menu').classList.remove('open');
  document.getElementById('themes-button').classList.remove('open');
}

document.getElementById('themes-button').addEventListener('click', () => {
  const menu = document.getElementById('themes-menu');
  if (menu.classList.contains('open')) closeThemesMenu(); else openThemesMenu();
});
document.getElementById('themes-close').addEventListener('click', closeThemesMenu);
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') closeThemesMenu();
});

// ============================================================
// SOURCE-INTEGRITY TIER OVERLAY (opus-design-2)
// Toggle: body.tier-overlay-on. Legend populated from filtered node set.
// Distribution is computed over nodes that survive the current filter — so the
// legend reflects what the user is actually looking at, not the whole vault.
// ============================================================
function computeTierDistribution() {
  const filtered = DATA.nodes.filter(matchesFilter);
  const buckets = { 1: 0, 2: 0, 3: 0, 4: 0, none: 0 };
  filtered.forEach(n => { buckets[n._tier ?? 'none']++; });
  return { buckets, total: filtered.length };
}
function renderTierLegend() {
  const el = document.getElementById('tier-legend');
  if (!el) return;
  const { buckets, total } = computeTierDistribution();
  const labels = {
    1: 'T1 · primary',
    2: 'T2 · scholarly',
    3: 'T3 · reputable secondary',
    4: 'T4 · catalogued',
    none: 'no refs',
  };
  const max = Math.max(1, ...Object.values(buckets));
  const rows = ['1','2','3','4','none'].map(k => {
    const n = buckets[k] || 0;
    const pct = total ? Math.round(n / total * 100) : 0;
    const w   = Math.round(n / max * 100);
    return `<div class="tl-row" data-t="${k}">
      <span class="tl-swatch"></span>
      <span class="tl-name">${labels[k]}</span>
      <span class="tl-bar"><span class="tl-bar-fill" style="width:${w}%"></span></span>
      <span class="tl-count">${n}<span class="tl-pct">${pct}%</span></span>
    </div>`;
  }).join('');
  el.innerHTML = `
    <div class="tl-header">
      <span class="tl-title">Source integrity</span>
      <span class="tl-total">${total} nodes</span>
    </div>
    ${rows}
    <div class="tl-foot">Stroke color on every node = best available source tier. Toggle off via the side-nav button.</div>
  `;
}
function setTierOverlay(on) {
  document.body.classList.toggle('tier-overlay-on', !!on);
  document.getElementById('tier-button')?.classList.toggle('active', !!on);
  if (on) renderTierLegend();
}
document.getElementById('tier-button')?.addEventListener('click', () => {
  setTierOverlay(!document.body.classList.contains('tier-overlay-on'));
});
// Keep the legend's filtered counts honest when filters or view change.
// setView is the single funnel every filter / nav click goes through, so wrapping
// it covers every re-render path without us having to find each filter listener.
const _origSetView = setView;
setView = function patchedSetView(...args) {
  const r = _origSetView.apply(this, args);
  if (document.body.classList.contains('tier-overlay-on')) renderTierLegend();
  return r;
};

// ============================================================
// WIRING
// ============================================================
document.querySelectorAll('nav.side .item').forEach(el => {
  el.addEventListener('click', () => setView(el.dataset.view));
});

['family', 'type'].forEach(k => {
  document.getElementById('filter-' + k).addEventListener('change', e => {
    STATE.filter[k] = e.target.value;
    // Pantheon's family filter is visual — apply without a destructive re-render
    if (STATE.view === 'pantheon' && k === 'family' && typeof window._pantheonApplyFamilyFilter === 'function') {
      window._pantheonApplyFamilyFilter();
    } else {
      setView(STATE.view);
    }
  });
});
let searchTimer;
document.getElementById('filter-search').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { STATE.filter.search = e.target.value; setView(STATE.view); updateResetButton(); }, 220);
});

// Reset-all-filters button — clears family/type/search/theme in one click.
function updateResetButton() {
  const btn = document.getElementById('btn-reset-filters');
  if (!btn) return;
  const f = STATE.filter;
  const active = !!(f.family || f.type || f.search || f.theme);
  btn.classList.toggle('active', active);
}
document.getElementById('btn-reset-filters').addEventListener('click', () => {
  STATE.filter = { family: '', type: '', theme: '', search: '' };
  document.getElementById('filter-family').value = '';
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-search').value = '';
  renderActiveTheme();
  updateResetButton();
  setView(STATE.view);
});
// Also re-wire the existing family/type dropdown handlers so they call updateResetButton
['family', 'type'].forEach(k => {
  document.getElementById('filter-' + k).addEventListener('change', updateResetButton);
});

// Footer collapse toggle — pops the filter bar down, restores it via the floating ▾ chip.
const _footerToggleEl = document.getElementById('footer-toggle');
if (_footerToggleEl) _footerToggleEl.addEventListener('click', () => {
  document.body.classList.toggle('footer-collapsed');
});

// Panel toggles: keep the view state intact (no setView re-render). The sidebar is now
// a FIXED overlay — toggling it neither resizes nor re-layouts the canvas. The detail
// panel is still in the grid (it owns its column).
const _sideTabEl = document.getElementById('side-tab');
if (_sideTabEl) _sideTabEl.addEventListener('click', () => {
  document.body.classList.toggle('nav-collapsed');
  _sideTabEl.textContent = document.body.classList.contains('nav-collapsed') ? '›' : '‹';
});
document.getElementById('detail-toggle').addEventListener('click', () => {
  document.body.classList.toggle('detail-collapsed');
  document.getElementById('detail-toggle').textContent = document.body.classList.contains('detail-collapsed') ? '‹' : '›';
});

// CLICK-EMPTY-TO-CLOSE — clicking the empty SVG canvas (not a node, not a legend row,
// not a control) collapses the detail panel. Pairs with selectNode's auto-open behavior:
// click a node → panel opens; click empty → panel closes. Single global handler, attached
// once; setView's per-view `svg.on('click', null)` clears d3 handlers but not raw
// addEventListener listeners, so this persists across all views.
document.getElementById('svg').addEventListener('click', (ev) => {
  // Bail if the click bubbled from anything clickable: a node-group, label, legend row,
  // mode dropdown, button, etc. If `closest()` finds any of these ancestors, we treat the
  // click as "on a thing" and let that thing's own handler manage state.
  const tgt = ev.target;
  if (tgt.closest && tgt.closest([
    'g.node', 'g.tl-event', 'g.alch-node', 'g.scripture-node-wrap', 'g.tl-break',
    '.node-circle', '.tl-event-shape', '.tl-event-dot', '.scripture-node',
    '.legend', '.lrow', '.legend-burger',
    '.zoom-meter', '.map-thumb', '.tl-zoom-presets',
    '.btn', 'button', 'select', 'input', 'a',
  ].join(','))) return;
  // Empty canvas click. Close the detail panel if it's open.
  if (!document.body.classList.contains('detail-collapsed')) {
    document.body.classList.add('detail-collapsed');
    const dt = document.getElementById('detail-toggle');
    if (dt) dt.textContent = '‹';
  }
});

document.addEventListener('keydown', (ev) => {
  if (ev.target.tagName === 'INPUT') return;
  if (ev.key === '[' && _sideTabEl) _sideTabEl.click();
  if (ev.key === ']') document.getElementById('detail-toggle').click();
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => setView(STATE.view), 200);
});

// ============================================================
// STYLE PRESET SWITCHER (palette + typography bundled)
// ============================================================
const STYLES = ['codex', 'crypt', 'mystic', 'twilight', 'technical', 'parchment', 'vatican', 'nag-hammadi', 'passion', 'orthodox', 'atlantis', 'eye', 'hermes'];
const STYLE_LABELS = {
  'codex':       'Codex',
  'crypt':       'Crypt',
  'mystic':      'Mystic',
  'twilight':    'Twilight',
  'technical':   'Technical',
  'parchment':   'Parchment',
  'vatican':     'Vatican',
  'nag-hammadi': 'Nag Hammadi',
  'passion':     'Passion',
  'orthodox':    'Orthodox',
  'atlantis':    'Atlantis',
  'eye':         'All-Seeing Eye',
  'hermes':      'Hermes',
};
function applyStyle(name) {
  if (!STYLES.includes(name)) name = 'codex';
  STYLES.forEach(s => document.body.classList.remove('style-' + s));
  // codex = default (no class); others add a body class
  if (name !== 'codex') document.body.classList.add('style-' + name);
  document.querySelectorAll('.style-option').forEach(el => {
    el.classList.toggle('active', el.dataset.style === name);
  });
  const labelEl = document.getElementById('style-button-label');
  if (labelEl) labelEl.textContent = STYLE_LABELS[name] || name;
  try { localStorage.setItem('codex-style', name); } catch (e) {}
}
document.querySelectorAll('.style-option').forEach(el => {
  el.addEventListener('click', () => {
    applyStyle(el.dataset.style);
    closeStyleMenu();
  });
});

// Dropdown open/close
const styleButton = document.getElementById('style-button');
const styleMenu = document.getElementById('style-menu');
function openStyleMenu()  { styleButton.classList.add('open');    styleMenu.classList.add('open'); }
function closeStyleMenu() { styleButton.classList.remove('open'); styleMenu.classList.remove('open'); }
function toggleStyleMenu() { styleMenu.classList.contains('open') ? closeStyleMenu() : openStyleMenu(); }
if (styleButton) styleButton.addEventListener('click', (e) => { e.stopPropagation(); toggleStyleMenu(); });
if (styleMenu)   styleMenu.addEventListener('click', (e) => e.stopPropagation());
document.addEventListener('click', () => { if (styleMenu && styleMenu.classList.contains('open')) closeStyleMenu(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeStyleMenu(); });

// Initial: load saved style, with one-shot migration from the old two-key system.
const savedStyle = (() => {
  try {
    const direct = localStorage.getItem('codex-style');
    if (direct && STYLES.includes(direct)) return direct;
    // Migrate from legacy gp-palette (eclipse/crypt/mystic/twilight)
    const legacy = localStorage.getItem('gp-palette');
    if (legacy === 'eclipse') return 'codex';
    if (legacy && STYLES.includes(legacy)) return legacy;
  } catch (e) {}
  return null;
})();
applyStyle(savedStyle || 'codex');

// SVG width-change observer — fixes the "timeline doesn't go all the way to the right
// until window resize" bug. When entering Timeline (or any Map view) the detail panel
// auto-collapses, but the CSS transition takes ~240ms to finish, during which clientWidth
// is still the pre-collapse value. The ResizeObserver fires when the CSS transition
// settles and triggers a re-render of the affected view. Debounced 220ms so transition
// frames don't each trigger a re-render. Limited to views that read clientWidth at mount
// (timeline is the most affected; others use d3 force layouts that adapt continuously).
let _canvasResizeTimer = null;
let _lastCanvasW = 0;
const _canvasResizeObs = new ResizeObserver(() => {
  clearTimeout(_canvasResizeTimer);
  _canvasResizeTimer = setTimeout(() => {
    const newW = svg.node().clientWidth;
    if (Math.abs(newW - _lastCanvasW) < 30) return;     // ignore micro-jitters
    _lastCanvasW = newW;
    if (STATE.view === 'timeline') setView('timeline');
  }, 220);
});
_canvasResizeObs.observe(document.getElementById('svg'));

// initial
buildThemesDropdown();
renderActiveTheme();
updateResetButton();
setView('pantheon');
document.getElementById('footer-status').textContent =
  `gen ${(DATA.generated_at_utc || '').slice(0, 10)} · build_data.py to refresh`;
