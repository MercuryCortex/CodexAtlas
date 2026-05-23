// Phase TL-1 smoke test — run timelineLayout against real vault data at
// 4 size scenarios (200 / 1000 / 3000 / 4475 nodes) and print pack stats.
//
// Usage:  node scripts/timeline_layout_smoke.js
//
// Reads data.js, mocks window.AtlasEngineLayout via `vm`, runs the
// timeline.js IIFE in that mock context, then invokes timelineLayout
// at each sample size.

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

// ── Load data.js → vault object ──────────────────────────
const dataTxt = fs.readFileSync(path.join(__dirname, '..', 'data.js'), 'utf8');
const m = dataTxt.match(/window\.VAULT_DATA\s*=\s*([\s\S]+);\s*$/);
if (!m) { console.error('Could not parse data.js'); process.exit(1); }
const vault = JSON.parse(m[1]);
const allNodes = vault.nodes || [];
console.log(`Loaded vault: ${allNodes.length} nodes, ${(vault.edges||[]).length} edges`);

// ── Sandbox + load timeline.js into it ───────────────────
const sandbox = { window: {}, console };
vm.createContext(sandbox);
const tlSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'engine', 'layout', 'timeline.js'), 'utf8');
vm.runInContext(tlSrc, sandbox);
const timelineLayout = sandbox.window.AtlasEngineLayout.timelineLayout;
const TC              = sandbox.window.AtlasEngineLayout.timelineConstants;
if (typeof timelineLayout !== 'function') {
  console.error('timelineLayout not exported'); process.exit(1);
}

// ── Build the family-order list (encounter order across all nodes) ──
const familyOrder = [];
const seenFams = new Set();
for (const n of allNodes) {
  const f = (n && n.family) || 'Other';
  if (!seenFams.has(f)) { familyOrder.push(f); seenFams.add(f); }
}

// ── Scenario runner ──────────────────────────────────────
function describeRun(label, nodes) {
  const t0 = Date.now();
  const r = timelineLayout(nodes, familyOrder, { parkUndated: true });
  const t1 = Date.now();
  const numBands  = Object.keys(r.bands).length;
  const numUndated = r.undated.ids.length;
  const numDated  = r.positions.size - numUndated;
  const w = (r.worldExtent.x1 - r.worldExtent.x0).toFixed(1);
  const h = (r.worldExtent.y1 - r.worldExtent.y0).toFixed(1);

  // Largest band by member count
  const sortedBands = Object.values(r.bands)
    .sort((a,b) => b.members.length - a.members.length)
    .slice(0, 3);

  console.log('');
  console.log(`── ${label} ─────────────────────────────────`);
  console.log(`  input nodes        : ${nodes.length}`);
  console.log(`  layout duration    : ${t1-t0} ms`);
  console.log(`  positions emitted  : ${r.positions.size}`);
  console.log(`  bands              : ${numBands}`);
  console.log(`  undated parked     : ${numUndated}`);
  console.log(`  dated placed       : ${numDated}`);
  console.log(`  worldextent (wxh)  : ${w} × ${h} wu`);
  console.log(`  x range (years)    : ${r.xRange.lo} → ${r.xRange.hi}`);
  console.log(`  top 3 bands:`);
  for (const b of sortedBands) {
    console.log(`    - ${b.name.padEnd(28)} ${String(b.members.length).padStart(4)} nodes  h=${b.height.toFixed(1)} wu  color=${b.color}`);
  }

  // Sanity: are positions inside their band y-range?
  let outOfBand = 0;
  for (const [id, pos] of r.positions) {
    if (r.undated.ids.includes(id)) continue;
    const node = nodes.find(n => n.id === id);
    if (!node) continue;
    const band = r.bands[(node.family || 'Other')];
    if (!band) continue;
    if (pos.y < band.y0 - 0.5 || pos.y > band.y1 + 0.5) outOfBand++;
  }
  console.log(`  positions out-of-band: ${outOfBand}  ${outOfBand === 0 ? '✓' : '✗'}`);

  // Determinism check: re-run, compare.
  const r2 = timelineLayout(nodes, familyOrder, { parkUndated: true });
  let drift = 0;
  for (const [id, p] of r.positions) {
    const p2 = r2.positions.get(id);
    if (!p2 || Math.abs(p.x - p2.x) > 1e-9 || Math.abs(p.y - p2.y) > 1e-9) drift++;
  }
  console.log(`  determinism re-run : drift=${drift}  ${drift === 0 ? '✓' : '✗'}`);
}

// ── 4 scenarios ──────────────────────────────────────────
const deities  = allNodes.filter(n => n.type === 'deity');
const persons  = allNodes.filter(n => n.type === 'person');
const allTypes = allNodes;

describeRun('Scenario 1 — small (deities subset, ~200 nodes)', deities.slice(0, 200));
describeRun('Scenario 2 — medium (~1000 mixed nodes)', allTypes.slice(0, 1000));
describeRun('Scenario 3 — heavy (~3000 mixed nodes)', allTypes.slice(0, 3000));
describeRun('Scenario 4 — full vault (all 4475 nodes)', allTypes);
