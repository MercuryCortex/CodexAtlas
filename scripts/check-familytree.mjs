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

// ── THE RAILS (2026-07-31) — the UNION input ────────────────
// The view no longer hands familyTreeLayout the mode-filtered node
// set. A house resolves its OWN membership: the deities wheel PLUS
// every other vault node of the isolated family (its documents and
// its court). That is the only reason the Scriptorium and the Court
// were empty on every family in every mode — docs.length and
// court.length were 0 by construction. This mirrors forge.js's
// houseGuestsOf() + augmentModeForHouse() exactly.
function houseUnion(fam, geometry, extra) {
  const deities = NODES.filter(n => n && n.type === 'deity');
  const inMode = new Set(deities.map(n => n.id));
  const guests = NODES
    .filter(n => n && n.id && !inMode.has(n.id) && (n.family || 'Other') === fam)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  const nodes = deities.concat(guests);
  const ids = new Set(nodes.map(n => n.id));
  const guestIds = new Set(guests.map(n => n.id));
  const memberIds = new Set(nodes.filter(n => (n.family || 'Other') === fam).map(n => n.id));
  // v1 wire scope: everything the wheel already carried, plus the
  // INTRA-FAMILY wires the guests bring. Port aggregates unchanged.
  const edges = EDGES.filter(e => {
    if (!ids.has(e.source) || !ids.has(e.target)) return false;
    if (!guestIds.has(e.source) && !guestIds.has(e.target)) return true;
    return memberIds.has(e.source) && memberIds.has(e.target);
  });
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
  const lay = layoutFn(nodes, Object.assign({
    groupBy: n => n.family || 'Other',
    groupKey: fam,
    arcs, laterals, aspects,
    degree: degreeMap(nodes, edges),
    bearings, portWeights,
    center: { x: 0, y: 0 }, radius: 540,
    geometry,
  }, extra || {}));
  lay._guests = guests;
  lay._nodes = nodes;
  return lay;
}

function checkUnion(fam, geometry, expect) {
  console.log('\n── UNION · ' + fam + ' · ' + geometry + ' ──');
  const a = houseUnion(fam, geometry);
  const b = houseUnion(fam, geometry);
  const h = a.house;
  const rl = h.rails.left, rr = h.rails.right;
  console.log('  guests=' + a._guests.length
    + '  stats {tree:' + h.stats.tree + ', docs:' + h.stats.docs + ', court:' + h.stats.court + '}'
    + '  railL=' + (rl ? rl.count : 0) + ' (shown ' + (rl ? rl.shown : 0) + ', overflow ' + (rl ? rl.overflow : 0) + ')'
    + '  railR=' + (rr ? rr.count : 0) + ' (shown ' + (rr ? rr.shown : 0) + ', overflow ' + (rr ? rr.overflow : 0) + ')');
  if (snapshot(a) === snapshot(b)) ok('deterministic (two runs byte-equal, ' + a.positions.size + ' positions)');
  else fail('NON-DETERMINISTIC — two identical union runs differ');
  // 1 ▸ the crown may only claim what the layout actually holds
  if (h.stats.docs + h.stats.court + h.stats.tree === h.stats.members) {
    ok('tree + docs + court === members (' + h.stats.members + ')');
  } else {
    fail('stats do not add up: ' + h.stats.tree + '+' + h.stats.docs + '+' + h.stats.court
      + ' != ' + h.stats.members);
  }
  if (rl && rl.count === h.stats.docs) ok('left rail count === stats.docs (' + rl.count + ')');
  else fail('left rail ' + (rl ? rl.count : 'MISSING') + ' != stats.docs ' + h.stats.docs);
  if (rr && rr.count === h.stats.court) ok('right rail count === stats.court (' + rr.count + ')');
  else fail('right rail ' + (rr ? rr.count : 'MISSING') + ' != stats.court ' + h.stats.court);
  // 2 ▸ every guest is placed, every DISPLAYED rail item has a radius
  let noPos = 0, noR = 0, shown = 0, outside = 0;
  const ext = a.worldExtent;
  for (const g of a._guests) if (!a.positions.has(g.id)) noPos++;
  for (const rail of [rl, rr]) {
    if (!rail) continue;
    for (const sh of rail.shelves) {
      for (const it of sh.items) {
        shown++;
        const r = a.radii.get(it.id);
        if (!(r > 0)) noR++;
        const p = a.positions.get(it.id);
        if (!p || p.x < ext.x0 || p.x > ext.x1 || p.y < ext.y0 || p.y > ext.y1) outside++;
      }
    }
  }
  if (noPos === 0) ok('every one of the ' + a._guests.length + ' guests carries a position');
  else fail(noPos + ' guests have no position (they would render at the wheel spot)');
  if (noR === 0) ok('every displayed rail item has a radius (' + shown + ' slots)');
  else fail(noR + ' displayed rail items have no radius');
  if (outside === 0) ok('every rail slot inside worldExtent');
  else fail(outside + ' rail slots outside worldExtent');
  // 3 ▸ the cap is a display cap, never a count lie
  for (const rail of [rl, rr]) {
    if (!rail) continue;
    const side = rail.side < 0 ? 'left' : 'right';
    if (rail.shown + rail.overflow === rail.count) ok(side + ' rail: shown + overflow === count');
    else fail(side + ' rail: ' + rail.shown + '+' + rail.overflow + ' != ' + rail.count);
    let shelfSum = 0;
    for (const sh of rail.shelves) shelfSum += sh.shown;
    if (shelfSum === rail.shown) ok(side + ' rail: shelf slots sum to shown (' + shelfSum + ')');
    else fail(side + ' rail: shelves hold ' + shelfSum + ' but shown says ' + rail.shown);
  }
  // 4 ▸ no rail slot may sit on top of another
  let railOverlap = 0;
  for (const rail of [rl, rr]) {
    if (!rail) continue;
    const ys = [];
    for (const sh of rail.shelves) for (const it of sh.items) ys.push(it.y);
    ys.sort((x, y) => x - y);
    for (let i = 1; i < ys.length; i++) if (ys[i] - ys[i - 1] < 2 * rail.glyphR - 0.01) railOverlap++;
  }
  if (railOverlap === 0) ok('zero overlapping rail slots');
  else fail(railOverlap + ' overlapping rail slots');
  if (expect) expect(a, h);
  return a;
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

// THE RAILS (2026-07-31) — the union input the view now feeds.
// Greek is the reference family: 241 vault nodes = 80 deities +
// 24 documents + 137 court. If any of these three numbers moves,
// the crown and both rail headers are lying.
checkUnion('Greek', 'cascade', (r, h) => {
  const want = { tree: 80, docs: 24, court: 137 };
  if (h.stats.tree === want.tree && h.stats.docs === want.docs && h.stats.court === want.court) {
    ok('Greek splits {tree:80, docs:24, court:137} — the vault\'s real composition');
  } else {
    fail('Greek split is {tree:' + h.stats.tree + ', docs:' + h.stats.docs
      + ', court:' + h.stats.court + '}, expected {80, 24, 137}');
  }
  if (h.rails.left && h.rails.left.count === 24) ok('rails.left.count === 24 (THE SCRIPTORIUM — 24 DOCS)');
  else fail('rails.left.count is ' + (h.rails.left ? h.rails.left.count : 'null') + ', expected 24');
  if (h.rails.right && h.rails.right.count === 137) ok('rails.right.count === 137 (THE COURT — 137 OF ALL KINDS)');
  else fail('rails.right.count is ' + (h.rails.right ? h.rails.right.count : 'null') + ', expected 137');
  if (!h.rails.left.overflow && !h.rails.right.overflow) ok('Greek fits under the cap — nothing off-stage');
  else fail('Greek should not overflow the default cap');
});
checkUnion('Greek', 'fan');
// Christian is the CAP case: 125 docs + 330 court, so the court rail
// must truncate to the cap and report the remainder honestly.
checkUnion('Christian', 'cascade', (r, h) => {
  if (h.stats.docs === 125 && h.stats.court === 330) ok('Christian splits {docs:125, court:330}');
  else fail('Christian split is {docs:' + h.stats.docs + ', court:' + h.stats.court + '}, expected {125, 330}');
  const rr = h.rails.right;
  if (rr && rr.shown <= 150 && rr.overflow === rr.count - rr.shown && rr.overflow > 0) {
    ok('court rail capped at ' + rr.shown + ' with ' + rr.overflow + ' honestly parked');
  } else {
    fail('court rail cap/overflow wrong: shown=' + (rr && rr.shown) + ' overflow=' + (rr && rr.overflow));
  }
});
// Norse is the small case John will click second: 2 docs, 25 court.
checkUnion('Norse', 'cascade', (r, h) => {
  if (h.stats.docs === 2 && h.stats.court === 25) ok('Norse splits {docs:2, court:25}');
  else fail('Norse split is {docs:' + h.stats.docs + ', court:' + h.stats.court + '}, expected {2, 25}');
});
// Chinese keeps the degrade path honest with guests present.
checkUnion('Chinese', 'cascade', (r, h) => {
  if (h.stats.tree === 32) ok('Chinese tree still 32 deities with 90 guests resident');
  else fail('Chinese tree moved to ' + h.stats.tree + ' — guests leaked into the cascade');
});
// 'Other' is the pathological family: 2,336 guests. Both rails must
// stay capped, nothing may go non-finite, and it must not hang.
checkUnion('Other', 'cascade', (r, h) => {
  const rr = h.rails.right;
  if (rr && rr.count === 2317 && rr.shown <= 150) ok('Other: 2,317 in the court, ' + rr.shown + ' on stage');
  else fail('Other court rail: count=' + (rr && rr.count) + ' shown=' + (rr && rr.shown));
  let bad = 0;
  for (const [, p] of r.positions) if (!isFinite(p.x) || !isFinite(p.y)) bad++;
  if (bad === 0) ok('Other: all ' + r.positions.size + ' positions finite');
  else fail('Other: ' + bad + ' non-finite positions');
});

// ════════════════════════════════════════════════════════════
// WAVE 2 (2026-07-31) — THE CLAIMS THE CHROME PRINTS
// ════════════════════════════════════════════════════════════
// The wave-1 review found four defects that a headless probe could
// have caught and did not, because nothing here ever looked at what
// the VIEW does with the layout's return. These sections mirror the
// view's own laws and CROSS-CHECK EACH MIRROR against the real
// forge.js source (the pattern check-house-wires.mjs established), so
// editing the view without editing this file goes RED instead of
// quietly measuring a fiction.
const forgeSrc = readFileSync(join(root, 'src/js/views/forge.js'), 'utf8');
const treeSrc  = readFileSync(join(root, 'src/js/engine/layout/familytree.js'), 'utf8');
const must = (re, what, src) => {
  if (re.test(src || forgeSrc)) ok('source still says: ' + what);
  else fail('SOURCE DRIFT — the code no longer says: ' + what);
};
const MODE_LABEL = {   // the wheel-mode nouns the crown used to print
  deity: 'DEITIES', document: 'DOCUMENTS', person: 'AUTHORS',
  symbol: 'SYMBOLS', ritual: 'RITUALS', place: 'PLACES', theme: 'THEMES',
};

// A union house for an ARBITRARY wheel mode (houseUnion above is
// deities-only, which is exactly why no harness case could ever see
// the crown-noun defect: in deities mode the noun happened to be true).
function houseUnionMode(fam, modeType, extra) {
  const inModeArr = NODES.filter(n => n && n.type === modeType);
  const inMode = new Set(inModeArr.map(n => n.id));
  const guests = NODES
    .filter(n => n && n.id && !inMode.has(n.id) && (n.family || 'Other') === fam)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  const nodes = inModeArr.concat(guests);
  const ids = new Set(nodes.map(n => n.id));
  const guestIds = new Set(guests.map(n => n.id));
  const memberIds = new Set(nodes.filter(n => (n.family || 'Other') === fam).map(n => n.id));
  const edges = EDGES.filter(e => {
    if (!ids.has(e.source) || !ids.has(e.target)) return false;
    if (!guestIds.has(e.source) && !guestIds.has(e.target)) return true;
    return memberIds.has(e.source) && memberIds.has(e.target);
  });
  const arcs = [], laterals = [], aspects = [], portWeights = {};
  const famOf = new Map(nodes.map(n => [n.id, n.family || 'Other']));
  for (const e of edges) {
    const sIn = memberIds.has(e.source), tIn = memberIds.has(e.target);
    if (sIn !== tIn) { const g = famOf.get(sIn ? e.target : e.source); portWeights[g] = (portWeights[g] || 0) + 1; continue; }
    if (!sIn) continue;
    if (e.type === 'parent-of') arcs.push([e.source, e.target]);
    else if (e.type === 'child-of') arcs.push([e.target, e.source]);
    else if (e.type === 'consort') laterals.push([e.source, e.target]);
    else if (ASPECT_RE.test(e.type || '')) aspects.push([e.source, e.target]);
  }
  const bearings = {}; let i = 0;
  for (const f of new Set(famOf.values())) bearings[f] = (i++) * 0.21;
  const lay = layoutFn(nodes, Object.assign({
    groupBy: n => n.family || 'Other', groupKey: fam,
    arcs, laterals, aspects, degree: degreeMap(nodes, edges),
    bearings, portWeights, center: { x: 0, y: 0 }, radius: 540,
  }, extra || {}));
  lay._memberIds = memberIds;
  return lay;
}

const NODE_BY_ID = new Map(NODES.map(n => [n.id, n]));

// ── W2-A ▸ THE CROWN NOUN NAMES THE POPULATION IT COUNTS ────
// Crown line 1 is `stats.tree + ' ' + noun`. Before wave 2 the noun
// came from the WHEEL MODE, so 28 of 30 modes printed a word for a
// population the cascade does not hold — Greek/Documents said
// "80 DOCUMENTS" over 80 gods, 12px above a rail header reading
// "THE SCRIPTORIUM — 24 DOCS".
console.log('\n── W2-A · the crown noun vs the cascade\'s real composition ──');
must(/const nodeWord = st\.treeKind[\s\S]{0,120}'MEMBERS';/,
  'the crown noun comes from stats.treeKind, not the mode registry');
must(/const line1 = st\.tree \+ ' ' \+ nodeWord/, 'crown line 1 counts stats.tree with that noun');
// the view's law, mirrored verbatim (kindShelves' pluralisation)
const crownNoun = (treeKind) => treeKind
  ? (String(treeKind) + 's').replace(/ys$/, 'ies').toUpperCase()
  : 'MEMBERS';
for (const [fam, modeType] of [['Greek', 'document'], ['Greek', 'symbol'], ['Greek', 'person'],
                               ['Greek', 'deity'], ['Egyptian', 'ritual'], ['Norse', 'symbol'],
                               ['Christian', 'document'], ['Other', 'theme']]) {
  const lay = houseUnionMode(fam, modeType);
  const h = lay.house, st = h.stats;
  // what the cascade ACTUALLY holds, counted from the rows the layout
  // returned — independent of stats.treeKind, so this can catch the
  // layout lying to the view as well as the view lying to the reader.
  const seenTypes = new Map();
  for (const row of h.rows) for (const id of row) {
    const t = String((NODE_BY_ID.get(id) || {}).type || '?');
    seenTypes.set(t, (seenTypes.get(t) || 0) + 1);
  }
  const kinds = [...seenTypes.keys()];
  const noun = crownNoun(st.treeKind);
  const label = fam + '/' + modeType;
  let counted = 0;
  for (const v of seenTypes.values()) counted += v;
  if (counted !== st.tree) { fail(label + ': stats.tree ' + st.tree + ' != ' + counted + ' rowed members'); continue; }
  if (kinds.length === 1) {
    if (st.treeKind === kinds[0] && noun === crownNoun(kinds[0])) {
      ok(label + ': crown prints "' + st.tree + ' ' + noun + '" over ' + st.tree + ' ' + kinds[0] + ' nodes');
    } else {
      fail(label + ': cascade is all ' + kinds[0] + ' but treeKind=' + JSON.stringify(st.treeKind));
    }
    // the old rule, kept as a regression tripwire
    const oldWord = MODE_LABEL[modeType];
    if (oldWord && oldWord !== noun && kinds[0] !== modeType) {
      const real = NODES.filter(n => (n.family || 'Other') === fam && n.type === modeType).length;
      ok('   …and NOT the old "' + st.tree + ' ' + oldWord + '" (the vault holds ' + real + ' ' + modeType + ')');
    }
  } else {
    if (st.treeKind === null && noun === 'MEMBERS') {
      ok(label + ': mixed cascade (' + kinds.join('+') + ') prints the neutral "' + st.tree + ' MEMBERS"');
    } else {
      fail(label + ': cascade holds ' + kinds.join('+') + ' but treeKind=' + JSON.stringify(st.treeKind));
    }
  }
}

// ── W2-B ▸ THE CAP MAY SHORTEN A SHELF, NEVER DELETE ONE ────
// The cap used to be spent greedily in shelf order over a
// biggest-kind-first list, so the largest kind ate all 150 slots and
// four of Christian's five court kinds vanished with nothing on screen
// saying so — under a header reading "THE COURT — 330 OF ALL KINDS".
// The law-free test: the shelves' own counts must still add up to the
// rail's true mass. A deleted shelf takes its count with it.
console.log('\n── W2-B · every kind survives the display cap ──');
must(/const takes = spendCap\(groups\.map/, '(layout) the cap is spent by spendCap, not greedily', treeSrc);
for (const fam of ['Christian', 'Other', 'Vedic', 'Greek', 'Norse']) {
  const h = houseUnion(fam, 'cascade').house;
  for (const rl of [h.rails.left, h.rails.right]) {
    if (!rl) continue;
    const side = rl.side < 0 ? 'SCRIPTORIUM' : 'COURT';
    let sum = 0, starved = 0;
    for (const sh of rl.shelves) { sum += sh.count; if (sh.shown < 1) starved++; }
    if (sum === rl.count && starved === 0) {
      ok(fam + ' ' + side + ': all ' + rl.shelves.length + ' shelves on stage, counts sum to '
        + rl.count + ' (' + rl.shelves.map(s => s.label + ' ' + s.shown + '/' + s.count).join(' · ') + ')');
    } else {
      fail(fam + ' ' + side + ': shelves account for ' + sum + ' of ' + rl.count
        + ' (' + starved + ' shelves with zero slots) — a kind the header counts is off screen with no caption');
    }
  }
}
// and the caption above a truncated column must say so
must(/sh\.label \+ ' · '\s*\+ \(\(sh\.shown < sh\.count\) \? \(sh\.shown \+ ' OF ' \+ sh\.count\) : sh\.count\)/,
  'a truncated shelf caption prints "N OF M", not the vault total');
must(/'\+' \+ rl\.overflow \+ ' NOT SHOWN'/, 'the rail remainder is rendered, not just computed');

// ── W2-C ▸ PARKED OVERFLOW IS RADIUS ZERO ───────────────────
// "No radius entry" was not "radius zero": bakeNodePosB fell back to
// the WHEEL radius, which is only harmless for guests (whose buffer-A
// radius is explicitly zeroed). In person/theme/tradition/event modes
// rail items are MODE MEMBERS with a full tier radius, so hundreds of
// hit-testable discs stacked on the family name.
console.log('\n── W2-C · the parked remainder has no mass and no hit ──');
must(/out\[i \* 4 \+ 2\] = \(typeof hr === 'number'\) \? hr : wheelR;/,
  'bakeNodePosB lets an explicit radius 0 survive');
must(/hn\.r = \(laid \|\| pz > 0\) \? pz : np\.data\[i \* NODE_FLOATS \+ 2\];/,
  'rebakeHitPositions reads the z lane instead of `|| wheelR`');
for (const [fam, modeType] of [['Christian', 'deity'], ['Other', 'deity'], ['Other', 'person'], ['Christian', 'person']]) {
  const lay = houseUnionMode(fam, modeType);
  const h = lay.house;
  let parked = 0, badR = 0, offCrown = 0;
  for (const rl of [h.rails.left, h.rails.right]) {
    if (!rl) continue;
    if (rl.parkedIds.length !== rl.overflow) {
      fail(fam + '/' + modeType + ': parkedIds ' + rl.parkedIds.length + ' != overflow ' + rl.overflow);
    }
    for (const id of rl.parkedIds) {
      parked++;
      const r = lay.radii.get(id);
      if (r !== 0) badR++;                       // undefined would bake the WHEEL radius
      const p = lay.positions.get(id);
      if (!p || p.x !== h.crown.x || p.y !== h.crown.y) offCrown++;
    }
  }
  if (!parked) { ok(fam + '/' + modeType + ': nothing overflows the cap'); continue; }
  if (badR === 0 && offCrown === 0) {
    ok(fam + '/' + modeType + ': all ' + parked + ' parked items are radius 0 on the crown (baked z = 0 ⇒ no draw, no hit)');
  } else {
    fail(fam + '/' + modeType + ': ' + badR + ' parked items lack an explicit radius 0, ' + offCrown + ' are off the crown');
  }
}

// ── W2-D ▸ EVERY PROMISED STRING CAN ACTUALLY LAND ──────────
// claim() refuses a rect whose centre is within 15px of one already
// placed. Two rail strings were geometrically unable to clear it at
// any viewport: the shelf spine name (10.5 WORLD units under its own
// caption = 6.9-8.6 screen px) and every rail item's REACH name (the
// obstacle column sits at the rail's own screen x).
console.log('\n── W2-D · the rails\' own names can land (the 15px rule) ──');
must(/const RAIL_ROW = 17;/, 'the rail row pitch is SCREEN px, not world geometry');
must(/const RAIL_CAP_DX = 10, RAIL_NAME_DX = 11;/, 'the outboard x offsets clear the 14-wide obstacle');
must(/lx = s\.x \+ rs \* \(rBub \+ 9 \+ wpx \/ 2\);/, 'a rail item\'s name is placed OUTBOARD of the rail');
const RAIL_ROW = 17, RAIL_CAP_DX = 10, RAIL_NAME_DX = 11;
const OBST_W = 14, OBST_PITCH = 22, KEEPOUT_TOP = 52, KEEPOUT_BOTTOM = 58;
for (const fam of ['Greek', 'Norse', 'Egyptian', 'Mesopotamian', 'Christian']) {
  const h = houseUnion(fam, 'cascade').house;
  let spineBad = 0, spineTot = 0, nameBlocked = 0, nameTot = 0;
  for (const vp of [{ w: 1440, h: 900 }, { w: 1280, h: 800 }, { w: 1000, h: 1000 }, { w: 900, h: 1600 }]) {
    const camScale = Math.min(vp.w / (2 * (540 + 70)), vp.h / (2 * (540 + 70)));
    const W2S = (x, y) => ({ x: vp.w / 2 + x * camScale, y: vp.h / 2 + y * camScale });
    for (const rl of [h.rails.left, h.rails.right]) {
      if (!rl || !rl.shelves.length) continue;
      // the obstacle column, exactly as renderHouseChrome claims it
      const top = W2S(rl.x, rl.shelves[0].capY - 10);
      const bot = W2S(rl.x, rl.shelves[rl.shelves.length - 1].y1 + 8);
      const obst = [];
      for (let y = Math.max(top.y, KEEPOUT_TOP); y <= Math.min(bot.y, vp.h - KEEPOUT_BOTTOM); y += OBST_PITCH) {
        obst.push([top.x, y, OBST_W]);
      }
      // 1 ▸ the spine name vs its OWN caption (the measured defect)
      for (const sh of rl.shelves) {
        if (!sh.spineId) continue;
        spineTot++;
        const cp = W2S(rl.x, sh.capY);
        const w = 70;                       // representative title width
        const capCx = rl.side < 0 ? cp.x - RAIL_CAP_DX - w / 2 : cp.x + RAIL_CAP_DX + w / 2;
        const spCx  = rl.side < 0 ? cp.x - RAIL_NAME_DX - w / 2 : cp.x + RAIL_NAME_DX + w / 2;
        const sy = cp.y + RAIL_ROW;
        if (Math.abs(spCx - capCx) < (w + w + 4) / 2 && Math.abs(sy - cp.y) < 15) spineBad++;
        for (const P of obst) {
          if (Math.abs(spCx - P[0]) < (w + P[2]) / 2 && Math.abs(sy - P[1]) < 15) { spineBad++; break; }
        }
      }
      // 2 ▸ every rail item's REACH name, placed outboard. A name that
      //     does not FIT beside the rail (a narrow viewport puts the
      //     rail ~100px from the edge) is a geometric loss, not this
      //     defect — the defect was that a name which fits was blocked
      //     by the column anyway, 463 of 463 slots at 1440x900.
      for (const sh of rl.shelves) for (const it of sh.items) {
        const s = W2S(rl.x, it.y);
        const wpx = 90, rBub = 5 * camScale;      // house_rail_hit floor
        const want = s.x + rl.side * (rBub + 9 + wpx / 2);
        if (want - wpx / 2 < 6 || want + wpx / 2 > vp.w - 6) continue;   // off-viewport
        nameTot++;
        const ly = s.y + 4;
        for (const P of obst) {
          if (Math.abs(want - P[0]) < (wpx + P[2]) / 2 && Math.abs(ly - P[1]) < 15) { nameBlocked++; break; }
        }
      }
    }
  }
  if (spineBad === 0) ok(fam + ': all ' + spineTot + ' shelf spine names clear their caption AND the obstacle column (4 viewports)');
  else fail(fam + ': ' + spineBad + ' of ' + spineTot + ' spine names are still refused');
  if (nameBlocked === 0) ok(fam + ': 0 of ' + nameTot + ' rail slots are blocked by the obstacle column (4 viewports)');
  else fail(fam + ': ' + nameBlocked + ' of ' + nameTot + ' rail names still cannot print');
}

// ── W2-E ▸ A ROW NUMERAL IS A GENERATION OR NOTHING ─────────
// The row index absorbs component era offsets, cycle breaks and bed
// packing, so it is a LAYOUT rank. Measured before wave 2: 15
// parentless Greek deities, 30 Norse and 62 Vedic printed under GEN II
// or lower; `adonis` carries zero lineage edges and was captioned a
// second-generation descendant.
console.log('\n── W2-E · GEN numerals only where the row IS one generation ──');
must(/if \(rm\.offLineage !== 0\) return null;/, 'a row holding a member who is not there by lineage carries no numeral');
must(/if \(rm\.layerMin == null \|\| rm\.layerMin !== rm\.layerMax\) return null;/,
  'a row spanning two lineage depths carries no numeral');
must(/return 'GEN ' \+ romanNum\(rm\.layerMin \+ 1\);/, 'the numeral is the row\'s own depth, not its index');
must(/if \(!rm\.n \|\| !hasBones\) return null;/, 'a house with zero lineage arcs numbers nothing');
must(/return \(rm\.dmin == null\) \? null : fmtRangeD\(rm\.dmin, rm\.dmax\);/,
  'the era caption prints the row\'s RANGE, not its minimum');
for (const fam of ['Greek', 'Norse', 'Vedic', 'Christian', 'Chinese']) {
  const lay = houseUnion(fam, 'cascade');
  const h = lay.house;
  const hasBones = (h.stats.kinArcs || 0) > 0;
  const parentOf = new Map();
  for (const a of h.arcs) parentOf.set(a.child, true);
  let printed = 0, wrong = 0, parentlessUnderNumeral = 0;
  for (let ri = 0; ri < h.rowMeta.length; ri++) {
    const rm = h.rowMeta[ri];
    if (!rm || !rm.n || !hasBones) continue;
    if (rm.offLineage !== 0) continue;
    if (rm.layerMin == null || rm.layerMin !== rm.layerMax) continue;
    printed++;
    // cross-check against the vault, not against rowMeta: every member
    // of a row captioned GEN N must genuinely sit at depth N-1, and a
    // member with no parent at all can only ever be GEN I.
    for (const id of h.rows[ri]) {
      if (!parentOf.has(id)) { parentlessUnderNumeral++; if (rm.layerMin > 0) wrong++; }
    }
  }
  if (wrong === 0) {
    ok(fam + ': ' + printed + ' of ' + h.rowMeta.filter(r => r && r.n).length
      + ' rows carry a numeral, and no parentless member sits under GEN II or lower'
      + (parentlessUnderNumeral ? ' (' + parentlessUnderNumeral + ' parentless members, all under GEN I)' : ''));
  } else {
    fail(fam + ': ' + wrong + ' parentless members print under GEN II or lower');
  }
}
// the era caption really does carry both bounds where they differ
for (const fam of ['Vedic', 'Norse']) {
  const h = houseUnion(fam, 'cascade', { ranks: 'era' }).house;
  let spans = 0, bounded = 0;
  for (const rm of h.rowMeta) {
    if (!rm || !rm.n || rm.dmin == null || rm.dmin === rm.dmax) continue;
    spans++;
    if (rm.dmax != null) bounded++;
  }
  if (spans === bounded) ok(fam + ' (ranks=era): all ' + spans + ' multi-year rows carry BOTH bounds for the caption');
  else fail(fam + ': ' + (spans - bounded) + ' rows have no dmax to caption with');
}

console.log('');
if (failures) { console.error(failures + ' FAILURE(S)'); process.exit(1); }
console.log('ALL CHECKS PASS');
