#!/usr/bin/env node
// ============================================================
// CHECK — familyTreeLayout determinism + invariants (THE HOUSE)
// ============================================================
// Build-list item 1's "determinism tests pinned to the two
// extremes" (AUDIT/2026-07-29-fable-family-tree-isolate.md §5):
//   Greek   — DAG / multi-parent / multi-root
//   Chinese — zero kinship (pure era strata)
// Runs headless in node against the REAL data.js. No framework:
// exits non-zero on any failure, prints measured numbers.
//
//   node scripts/check-familytree.mjs
// ============================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
globalThis.window = globalThis;   // the layout registers on window.*

// data.js assigns window.VAULT_DATA = { nodes, edges, ... }.
const dataSrc = readFileSync(join(root, 'data.js'), 'utf8');
new Function(dataSrc)();
const NODES = globalThis.VAULT_DATA.nodes, EDGES = globalThis.VAULT_DATA.edges;
new Function(readFileSync(join(root, 'src/js/engine/layout/familytree.js'), 'utf8'))();
const layoutFn = globalThis.AtlasEngineLayout.familyTreeLayout;

let failures = 0;
const fail = (msg) => { failures++; console.error('  ✗ ' + msg); };
const ok   = (msg) => console.log('  ✓ ' + msg);

function degreeMap(nodes, edges) {
  const present = new Set(nodes.map(n => n.id));
  const deg = new Map();
  for (const e of edges) {
    if (!present.has(e.source) || !present.has(e.target)) continue;
    deg.set(e.source, (deg.get(e.source) || 0) + 1);
    deg.set(e.target, (deg.get(e.target) || 0) + 1);
  }
  return deg;
}

const ASPECT_RE = /(avatara-of|manifestation-of|aspect-of|emanation-of|constituent-of)$/;

function houseFor(fam, geometry, extra) {
  // Mirror the view's resolution: deities-mode node set, kin arcs
  // among members, deterministic bearings for the other families.
  const nodes = NODES.filter(n => n && n.type === 'deity');
  const ids = new Set(nodes.map(n => n.id));
  const edges = EDGES.filter(e => ids.has(e.source) && ids.has(e.target));
  const memberIds = new Set(nodes.filter(n => (n.family || 'Other') === fam).map(n => n.id));
  const arcs = [], laterals = [], aspects = [];
  const portWeights = {};
  const famOf = new Map(nodes.map(n => [n.id, n.family || 'Other']));
  for (const e of edges) {
    const sIn = memberIds.has(e.source), tIn = memberIds.has(e.target);
    if (sIn !== tIn) {
      const g = famOf.get(sIn ? e.target : e.source);
      portWeights[g] = (portWeights[g] || 0) + 1;
      continue;
    }
    if (!sIn) continue;
    if (e.type === 'parent-of') arcs.push([e.source, e.target]);
    else if (e.type === 'child-of') arcs.push([e.target, e.source]);
    else if (e.type === 'consort') laterals.push([e.source, e.target]);
    else if (ASPECT_RE.test(e.type || '')) aspects.push([e.source, e.target]);
  }
  const bearings = {};
  let i = 0;
  for (const f of new Set(nodes.map(n => n.family || 'Other'))) bearings[f] = (i++) * 0.21;
  return layoutFn(nodes, Object.assign({
    groupBy: n => n.family || 'Other',
    groupKey: fam,
    arcs, laterals, aspects,
    degree: degreeMap(nodes, edges),
    bearings, portWeights,
    center: { x: 0, y: 0 }, radius: 540,
    geometry,
  }, extra || {}));
}

function snapshot(r) {
  const pos = [];
  for (const [id, p] of r.positions) pos.push(id + ':' + p.x.toFixed(6) + ',' + p.y.toFixed(6));
  pos.sort();
  return pos.join('|');
}

function checkFamily(fam, geometry, expect) {
  console.log('\n── ' + fam + ' · ' + geometry + ' ──');
  const a = houseFor(fam, geometry);
  const b = houseFor(fam, geometry);
  const h = a.house;
  console.log('  tree=' + h.stats.tree + ' kinArcs=' + h.stats.kinArcs
    + ' orphans=' + h.stats.orphanCount + ' comps=' + h.stats.components
    + ' maxDepth=' + h.stats.maxDepth + ' RK=' + h.RK
    + ' ports=' + a.ports.length + ' cyclesBroken=' + h.stats.cyclesBroken);
  if (snapshot(a) === snapshot(b)) ok('deterministic (two runs byte-equal, '
    + a.positions.size + ' positions)');
  else fail('NON-DETERMINISTIC — two identical runs differ');
  // every node positioned, every position finite
  let bad = 0;
  for (const [, p] of a.positions) if (!isFinite(p.x) || !isFinite(p.y)) bad++;
  if (bad === 0) ok('all ' + a.positions.size + ' positions finite (zero NaN)');
  else fail(bad + ' non-finite positions');
  // members inside the circle (+pad), ports on the horizon
  let out = 0;
  for (const row of h.rows) for (const id of row) {
    const p = a.positions.get(id);
    if (Math.hypot(p.x, p.y) > 540 + 1) out++;
  }
  if (out === 0) ok('every tree member inside the house circle');
  else fail(out + ' tree members outside the circle');
  let portBad = 0;
  for (const pt of a.ports) if (Math.abs(Math.hypot(pt.x, pt.y) - 540) > 0.5) portBad++;
  if (portBad === 0) ok(a.ports.length + ' ports exactly on the horizon ring');
  else fail(portBad + ' ports off the horizon');
  // rank sanity: parent rank < child rank for every arc
  let rankBad = 0;
  for (const arc of h.arcs) {
    if (!(h.rankOf.get(arc.parent) < h.rankOf.get(arc.child))) rankBad++;
  }
  if (rankBad === 0) ok('every lineage arc points down a rank (' + h.arcs.length + ' arcs)');
  else fail(rankBad + ' arcs violate rank order');
  // 2026-07-30 SCALE pass — the bundle invariants:
  //  1. every member carries a HOUSE radius (the view bakes it into
  //     position-B; a missing one would render a wheel-sized dot)
  //  2. no two members overlap (bed/braid spacing law)
  //  3. gods are BIG — the median house radius must beat the wheel's
  //     tier radii (8/7/6/5) by a clear margin, or Task 1 regressed
  {
    const members = [];
    for (const row of h.rows) for (const id of row) members.push(id);
    let noR = 0;
    const rs = [];
    for (const id of members) {
      const r = a.radii && a.radii.get(id);
      if (!(r > 0)) noR++; else rs.push(r);
    }
    if (noR === 0) ok('every member has a house radius');
    else fail(noR + ' members missing a house radius');
    rs.sort((x, y) => x - y);
    const med = rs.length ? rs[Math.floor(rs.length / 2)] : 0;
    if (med >= 10) ok('median house radius ' + med.toFixed(1) + ' world-units (wheel tiers are 5–8)');
    else fail('median house radius only ' + med.toFixed(1) + ' — gods are not BIG');
    let overlaps = 0, worstGap = Infinity;
    for (let i = 0; i < members.length; i++) {
      const pi = a.positions.get(members[i]), ri = a.radii.get(members[i]) || 0;
      for (let j = i + 1; j < members.length; j++) {
        const pj = a.positions.get(members[j]), rj = a.radii.get(members[j]) || 0;
        const g = Math.hypot(pi.x - pj.x, pi.y - pj.y) - ri - rj;
        if (g < worstGap) worstGap = g;
        if (g < -0.01) overlaps++;
      }
    }
    if (overlaps === 0) ok('zero member overlaps (worst gap ' + worstGap.toFixed(1) + ')');
    else fail(overlaps + ' overlapping member pairs (worst gap ' + worstGap.toFixed(1) + ')');
  }
  if (expect) expect(a, h);
  return a;
}

console.log('familyTreeLayout — determinism + invariants');
console.log('vault: ' + NODES.length + ' nodes · ' + EDGES.length + ' edges');

// THE TWO EXTREMES
checkFamily('Greek', 'cascade', (r, h) => {
  if (h.stats.kinArcs > 50) ok('Greek carries a real DAG (' + h.stats.kinArcs + ' kin arcs)');
  else fail('Greek kin arcs suspiciously low: ' + h.stats.kinArcs);
  if (h.stats.cyclesBroken === 0) ok('zero cycles broken (the guard is idle today, as measured)');
  else fail('cycle guard fired ' + h.stats.cyclesBroken + ' times on Greek');
});
checkFamily('Greek', 'fan');
checkFamily('Chinese', 'cascade', (r, h) => {
  if (h.stats.kinArcs === 0) ok('Chinese has zero kinship — degrades to pure era strata');
  else console.log('  (note: Chinese now has ' + h.stats.kinArcs + ' kin arcs — data grew)');
  // 2026-07-30 — floor dropped 4 → 3: beds absorb density, fewer
  // ranks = compact house = big gods (the Task-1 scale law).
  if (h.RK >= 3) ok('rank count floor holds (RK=' + h.RK + ')');
  else fail('RK below floor: ' + h.RK);
});
checkFamily('Chinese', 'fan');
// geometry is a dial on ONE house — same ranks either way
{
  const c = houseFor('Norse', 'cascade'), f = houseFor('Norse', 'fan');
  const rc = JSON.stringify(c.house.rows), rf = JSON.stringify(f.house.rows);
  if (rc === rf) ok('\nNorse: cascade and fan share identical ranks/ordering (geometry is presentation only)');
  else { console.log(''); fail('cascade vs fan changed rank membership'); }
}

console.log('');
if (failures) { console.error(failures + ' FAILURE(S)'); process.exit(1); }
console.log('ALL CHECKS PASS');
