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
  // 4 ▸ no band slot may sit on top of another (2D — the rails are a
  // ring since wave 3: sub-rows + stagger, so a 1D y-sort would both
  // miss real overlaps and invent false ones)
  {
    const pts = [];
    for (const rail of [rl, rr]) {
      if (!rail) continue;
      for (const sh of rail.shelves) for (const it of sh.items) pts.push({ x: it.x, y: it.y, r: rail.glyphR });
    }
    let railOverlap = 0, worstGap = Infinity;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const g = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) - pts[i].r - pts[j].r;
      if (g < worstGap) worstGap = g;
      if (g < -0.01) railOverlap++;
    }
    if (railOverlap === 0) ok('zero overlapping band slots (' + pts.length + ' slots, worst gap '
      + (worstGap === Infinity ? '—' : worstGap.toFixed(2) + ' wu') + ')');
    else fail(railOverlap + ' overlapping band slots (worst gap ' + worstGap.toFixed(2) + ')');
  }
  // 5 ▸ THE RING'S OWN GEOMETRY (wave 3): every slot inside its
  // rail's annulus, on its own side, outside the 12/6 o'clock gaps;
  // the cascade fully inside the band's inner edge.
  {
    let annBad = 0, sideBad = 0, gapBad = 0;
    for (const rail of [rl, rr]) {
      if (!rail) continue;
      for (const sh of rail.shelves) for (const it of sh.items) {
        const rr2 = Math.hypot(it.x, it.y);
        if (rr2 + rail.glyphR > rail.rOut + 0.01 || rr2 - rail.glyphR < rail.rIn - 0.01) annBad++;
        if (Math.sign(it.x) !== Math.sign(rail.side)) sideBad++;
        // bearing distance from the vertical axis must beat the gap —
        // the TOP gap above the horizontal axis, the (wave-4, smaller)
        // BOTTOM gap below it
        const fromVert = Math.abs(Math.abs(Math.atan2(it.y, it.x)) - Math.PI / 2);
        const gapHere = (it.y < 0) ? rail.gapRad : rail.gapBotRad;
        if (fromVert < gapHere - 1e-6) gapBad++;
      }
    }
    if (annBad === 0) ok('every band slot inside its annulus [rIn, rOut]');
    else fail(annBad + ' band slots leave their annulus');
    if (sideBad === 0) ok('every slot on its own side (docs left, court right)');
    else fail(sideBad + ' slots crossed to the wrong side');
    if (gapBad === 0) ok('the 12 & 6 o\'clock gaps hold — no slot under the crown or the foot');
    else fail(gapBad + ' slots inside the crown/foot gaps');
    let maxExt = 0;
    for (const row of h.rows) for (const id of row) {
      const p = a.positions.get(id);
      const e = Math.hypot(p.x, p.y) + (a.radii.get(id) || 0);
      if (e > maxExt) maxExt = e;
    }
    const rIn = Math.min(rl ? rl.rIn : Infinity, rr ? rr.rIn : Infinity);
    if (rIn === Infinity || maxExt < rIn) {
      ok('cascade stays inside the band (max member extent ' + maxExt.toFixed(0)
        + ' wu < band inner ' + (rIn === Infinity ? '—' : rIn.toFixed(0)) + ')');
    } else {
      fail('cascade pokes into the band: extent ' + maxExt.toFixed(0) + ' vs rIn ' + rIn.toFixed(0));
    }
  }
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
    if (!Array.isArray(rl.parkedIds)) {
      fail(fam + '/' + modeType + ': the rail reports no parkedIds — the view cannot bake an honest class for the overflow');
      continue;
    }
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

// ── W4 ▸ THE RING WRITES ON ITS OWN CURVE — every promised string
// can land (2026-07-31 wave 4 — supersedes the W3 horizontal-anchor
// replay: the header, every shelf caption and every spine name are
// now written glyph-by-glyph ALONG the arc, and they claim BEFORE
// the band's obstacle shield, so a canonical count can never lose
// its spot to its own shield).
//
// HOW A CURVED RUN CLAIMS (mirrored from renderBandCaptions, pinned
// below): every glyph centre is bucketed into 16px screen y-bands
// (16 = the smallest integer pitch that clears claim()'s 15px rule,
// so two buckets of the SAME run can never refuse each other), each
// bucket becomes one [cx, y=bucket·16, w] rect, and all of a run's
// rects claim atomically — any refusal rolls the run back and the
// whole string hides. PROVE A PROMISED STRING ACTUALLY PRINTS — the
// standing law that bit four times.
console.log('\n── W4 · THE RING\'S CURVED TEXT — every promised string can land ──');
// the view's laws, pinned so this mirror cannot drift silently
must(/const TYPE = \{ head: 11 \* ts, name: 10 \* ts, cap: 9\.5 \* ts \};/,
  'the type scale steps are HEAD 11 / NAME 10 / CAP 9.5 CSS px');
must(/const row = \(px\) => Math\.max\(16, Math\.round\(px \* 1\.9\)\);/,
  'row pitch DERIVES from the step size and always clears the 15px rule');
must(/const CROWN_ROW = row\(TYPE\.head\);/, 'the crown stack pitch derives from the HEAD step');
must(/const aStep = 22 \/ Math\.max\(1e-6, rl\.r \* camS\);/,
  'the band obstacle shield follows the ARC at 22px screen pitch');
must(/const bi = Math\.round\(gy \/ 16\);/,
  'curved-run glyphs bucket into 16px y-bands (the 15px rule, derived not hand-picked)');
must(/placed\.length = mark;\s*\n\s*return null;/,
  'a curved run claims ATOMICALLY — any refusal rolls the whole run back');
must(/const flip = \(o\.flip != null\) \? o\.flip : Math\.sin\(aRef\) > 0;/,
  'a lower-half run flips to stay upright (and a follower can inherit its leader\'s flip)');
must(/arcRun\(header, rl\.capR \+ rl\.capTier, rl\.headA, TYPE\.head/,
  'the header rides tier 1 of the caption ring over the reserved top arc');
must(/arcRun\(txt, sh\.capR, sh\.capA, TYPE\.cap/,
  'a shelf caption rides its own shelf\'s arc segment at its layout tier');
must(/arcRun\(title, sh\.capR, res\.aEnd, TYPE\.name/,
  'the spine name FOLLOWS its caption along the arc, on the same tier');
must(/\{ edge: true, flip: res\.flip, gap: gapPx \}/,
  'the spine inherits its caption\'s flip so the pair cannot fold at 3/9 o\'clock');
must(/const gapPx = Math\.min\(48, 17 \/ Math\.max\(0\.36, Math\.abs\(Math\.cos\(res\.aEnd\)\)\)\);/,
  'the follower gap DERIVES from the bucket law (a vertical-arc spine must clear a full y-band)');
must(/const txt = g\.label \+ ' · '\s*\n?\s*\+ \(\(g\.items\.length < g\.count\) \? \(g\.items\.length \+ ' OF ' \+ g\.count\) : g\.count\);/,
  '(layout) the caption arc allowance measures the SAME string the view prints', treeSrc);
must(/renderBandCaptions\(ctx, placed, claim, W2S, TYPE, font, house, vp\);[\s\S]{0,2600}const aStep = 22/,
  'the band text claims BEFORE the band shield (canonical counts outrank their own shield)');
must(/const step = Math\.max\(rBub \+ 32, bandPx - ul \+ 32\);/,
  'a rail slot\'s reach name steps RADIALLY outboard, 32px off the glyph OR the band centreline, whichever is farther');
must(/const glyphR = Math\.min\(RAIL_R_MAX, Math\.max\(0\.8, pitch \* rFrac\), 0\.49 \* minDist\);/,
  '(layout) glyphs cap at 0.49·minDist — no dial position can make two slots touch', treeSrc);
must(/const hasBand = \(docs\.length \+ court\.length\) > 0;/,
  '(layout) no docs + no court ⇒ no band ⇒ pre-ring geometry, byte-identical (honest zero)', treeSrc);
must(/const minDist = Math\.min\(BAND_SHELF_GAP,/,
  '(layout) the shelf gap bounds the glyph too, or max-size glyphs touch across shelf borders', treeSrc);
// the four wave-4 dials exist with the shipped defaults (the union
// runs below exercise the layout's own constants, so the two files
// must agree or this gate measures a fiction)
must(/house_band_gap_bot:\s*12,/, 'house_band_gap_bot ships at 12°');
must(/house_band_pitch:\s*16,/, 'house_band_pitch ships at 16 wu');
must(/house_band_head:\s*230,/, 'house_band_head ships at 230 wu');
must(/house_cap_clear:\s*10,/, 'house_cap_clear ships at 10 wu');
must(/const BAND_GAP_BOT_DEG = 12;/, '(layout) BAND_GAP_BOT_DEG default matches the dial', treeSrc);
must(/const BAND_PITCH_TGT =  16;/, '(layout) BAND_PITCH_TGT default matches the dial', treeSrc);
must(/const BAND_HEAD_ARC  =  230;/, '(layout) BAND_HEAD_ARC default matches the dial', treeSrc);
must(/const BAND_CAP_CLEAR =  10;/, '(layout) BAND_CAP_CLEAR default matches the dial', treeSrc);

// The mirror. Mono advance ≈ 0.6em; 0.62 is the conservative bound.
const T_HEAD = 11, T_NAME = 10, T_CAP = 9.5;
const rowOf = (px) => Math.max(16, Math.round(px * 1.9));
const mw = (str, px) => String(str).length * px * 0.62 + 8;
const KO_TOP = 52, KO_BOT = 58;
function claimSim(placed, cx0, y, w, vpH) {
  if (y < KO_TOP || y > vpH - KO_BOT) return false;
  for (const P of placed) {
    if (Math.abs(cx0 - P[0]) < (w + P[2]) / 2 && Math.abs(y - P[1]) < 15) return false;
  }
  placed.push([cx0, y, w]);
  return true;
}
// renderBandCaptions' curved-run writer, mirrored: same bucket law,
// same atomic rollback, mono advance 0.62·size per glyph.
function arcRunSim(placed, text, rWu, aRef, sizePx, scale, ctrX, ctrY, vpH, opts) {
  const o = opts || {};
  const rMid = rWu * scale + sizePx / 2;
  if (!(rMid > 40) || !text) return null;
  const chars = [...String(text)];
  const gw = sizePx * 0.62;
  const total = chars.length * gw;
  if (!(total > 0)) return null;
  const flip = (o.flip != null) ? o.flip : Math.sin(aRef) > 0;
  const dir = flip ? -1 : 1;
  const a0 = o.edge ? (aRef + dir * (o.gap || 8) / rMid) : (aRef - dir * (total / 2) / rMid);
  const buckets = new Map();
  let adv = 0;
  for (let i = 0; i < chars.length; i++) {
    const a = a0 + dir * (adv + gw / 2) / rMid;
    adv += gw;
    const gx = ctrX + Math.cos(a) * rMid;
    const gy = ctrY + Math.sin(a) * rMid;
    // the glyph's honest x-extent for its rotation (view law)
    const half = (gw * Math.abs(Math.sin(a)) + sizePx * Math.abs(Math.cos(a))) / 2 + 1;
    const bi = Math.round(gy / 16);
    const b = buckets.get(bi);
    if (b) {
      if (gx - half < b[0]) b[0] = gx - half;
      if (gx + half > b[1]) b[1] = gx + half;
    } else buckets.set(bi, [gx - half, gx + half]);
  }
  const mark = placed.length;
  for (const [bi, b] of buckets) {
    if (!claimSim(placed, (b[0] + b[1]) / 2, bi * 16, b[1] - b[0], vpH)) {
      placed.length = mark;
      return null;
    }
  }
  return { dir, flip, aEnd: a0 + dir * total / rMid };
}
const RING_VPS = [{ w: 1440, h: 900 }, { w: 1280, h: 800 }, { w: 1000, h: 1000 }, { w: 900, h: 1600 }];
for (const fam of ['Greek', 'Christian', 'Norse', 'Egyptian', 'Mesopotamian', 'Other']) {
  const lay = houseUnion(fam, 'cascade');
  const h = lay.house;
  let headerFail = 0, capFail = 0, capTot = 0, spineFail = 0, spineTot = 0, spineLand = 0;
  let footFail = 0, footTot = 0, nameBlocked = 0, nameTot = 0, clampSkip = 0;
  for (const vp of RING_VPS) {
    const scale = Math.min(vp.w, vp.h) / (2 * (540 + 70));
    const W2S = (x, y) => ({ x: vp.w / 2 + x * scale, y: vp.h / 2 + y * scale });
    const ctrX = vp.w / 2, ctrY = vp.h / 2;
    const placed = [];
    // 1 ▸ the crown stack (HIGH half, before the rails) — width from
    // the real strings the crown prints for this family.
    const st = h.stats;
    const cs = W2S(h.crown.x, h.crown.y);
    const CROWN_ROW = rowOf(T_HEAD);
    const noun = st.treeKind ? (String(st.treeKind) + 's').replace(/ys$/, 'ies').toUpperCase() : 'MEMBERS';
    const line1 = st.tree + ' ' + noun + ' · ' + st.kinArcs + ' LINEAGE ARCS · ' + st.orphanCount + ' STAND ON THEIR ERA';
    const line2 = st.docs + ' IN THE SCRIPTORIUM · ' + st.court + ' IN THE COURT';
    claimSim(placed, cs.x, cs.y + CROWN_ROW, mw(line1, T_HEAD), vp.h);
    claimSim(placed, cs.x, cs.y + CROWN_ROW * 2, mw(line2, T_CAP), vp.h);
    claimSim(placed, cs.x, cs.y + CROWN_ROW * 3, 110, vp.h);          // CASCADE/FAN chip reserve
    // 2 ▸ the band's curved text, in the view's real order: headers,
    // then shelf captions, then the overflow feet (pass 1 — the
    // canonical counts, ALL of which MUST land), then spine names
    // (pass 2 — they follow, and only ever yield). All BEFORE the
    // shield, exactly as the view claims them since wave 4.
    const landed = [];
    for (const rl of [h.rails.left, h.rails.right]) {
      if (!rl || !rl.shelves.length) continue;
      const header = rl.side < 0
        ? ('THE SCRIPTORIUM — ' + rl.count + ' DOCS')
        : ('THE COURT — ' + rl.count + ' OF ALL KINDS');
      if (!arcRunSim(placed, header, rl.capR + rl.capTier, rl.headA, T_HEAD,
                     scale, ctrX, ctrY, vp.h)) headerFail++;
      for (const sh of rl.shelves) {
        const txt = sh.label + ' · ' + ((sh.shown < sh.count) ? (sh.shown + ' OF ' + sh.count) : sh.count);
        capTot++;
        const res = arcRunSim(placed, txt, sh.capR, sh.capA, T_CAP, scale, ctrX, ctrY, vp.h);
        if (!res) { capFail++; continue; }
        landed.push([sh, res]);
      }
      // the overflow foot rides the curve at the foot bearing — a
      // canonical count, claimed before any spine (wave 4)
      if (rl.overflow > 0 && rl.foot) {
        footTot++;
        if (!arcRunSim(placed, '+' + rl.overflow + ' NOT SHOWN', rl.capR, rl.foot.a,
                       T_CAP, scale, ctrX, ctrY, vp.h)) footFail++;
      }
    }
    for (const [sh, res] of landed) {
      if (!sh.spineId) continue;
      const node = NODE_BY_ID.get(sh.spineId);
      let title = (node && node.title) || sh.spineId;
      // the view's ellipsis cap (min of quarter-viewport and 170px),
      // in mono-advance terms
      const capW = Math.min(vp.w * 0.25, 170);
      if (title.length * T_NAME * 0.62 > capW) {
        title = title.slice(0, Math.max(4, Math.floor(capW / (T_NAME * 0.62)) - 1)) + '…';
      }
      spineTot++;
      // the view's dynamic follower gap (derived from the bucket law)
      const gapPx = Math.min(48, 17 / Math.max(0.36, Math.abs(Math.cos(res.aEnd))));
      // A spine is ENTITLED to print when caption + gap + spine fit
      // inside the shelf's own items arc: a crowded court (five
      // shelves, one arc) cannot carry every long title, and a spine
      // hiding THERE is the whole-words-or-nothing law working — but
      // a spine refused despite room is a placement bug.
      const capTxt = sh.label + ' · ' + ((sh.shown < sh.count) ? (sh.shown + ' OF ' + sh.count) : sh.count);
      const rMidPx = sh.capR * scale + T_NAME / 2;
      const shelfArcPx = Math.abs(sh.a1 - sh.a0) * rMidPx;
      const entitled = (capTxt.length * T_CAP * 0.62 + gapPx + title.length * T_NAME * 0.62 + 8) <= shelfArcPx;
      const okSpine = !!arcRunSim(placed, title, sh.capR, res.aEnd, T_NAME, scale, ctrX, ctrY, vp.h,
                                  { edge: true, flip: res.flip, gap: gapPx });
      if (okSpine) spineLand++;
      else if (entitled) spineFail++;
    }
    // 3 ▸ the band shield, exactly as renderHouseChrome claims it —
    // AFTER the curved text since wave 4.
    for (const rl of [h.rails.left, h.rails.right]) {
      if (!rl || !rl.shelves.length) continue;
      const aStep = 22 / Math.max(1e-6, rl.r * scale);
      const aA = Math.min(rl.runA0, rl.runA1) - aStep * 0.5;
      const aB = Math.max(rl.runA0, rl.runA1) + aStep * 0.5;
      for (let ang = aA; ang <= aB; ang += aStep) {
        const p = W2S(Math.cos(ang) * rl.r, Math.sin(ang) * rl.r);
        claimSim(placed, p.x, p.y, 14, vp.h);
      }
    }
    // 4 ▸ the port labels claim between the captions and the names
    // in the real paint — replayed so nothing passes here and loses
    // to a port in the app.
    for (const pt of lay.ports) {
      const ps = W2S(pt.x, pt.y);
      if (ps.x < -60 || ps.x > vp.w + 60 || ps.y < -60 || ps.y > vp.h + 60) continue;
      const left = Math.cos(pt.ang) < 0;
      const txt = String(pt.group).toUpperCase() + (pt.count ? ' · ' + pt.count : '');
      const w = mw(txt, T_NAME);
      let lx = ps.x + Math.cos(pt.ang) * 13;
      let ly = ps.y + Math.sin(pt.ang) * 13;
      lx = left ? Math.max(lx, 6 + w) : Math.min(lx, vp.w - 6 - w);
      ly = Math.max(KO_TOP + 2, Math.min(vp.h - KO_BOT - 2, ly));
      claimSim(placed, left ? lx - w / 2 : lx + w / 2, ly, w + 8, vp.h);
    }
    // 5 ▸ every slot's radially-outboard REACH name vs the shield
    // (the wave-2 standard: a name that FITS beside the band must not
    // be blocked by the shield; a name clamped by the viewport edge
    // is a geometric loss, not this defect).
    for (const rl of [h.rails.left, h.rails.right]) {
      if (!rl) continue;
      for (const sh of rl.shelves) for (const it of sh.items) {
        const s = W2S(it.x, it.y);
        const wpx = 90, rBub = 5 * scale;
        let ux = it.x - h.center.x, uy = it.y - h.center.y;
        const ulWu = Math.hypot(ux, uy) || 1; ux /= ulWu; uy /= ulWu;
        // the view's wave-4 step law: off the glyph OR the band
        // centreline, whichever is farther (screen px)
        const ulPx = ulWu * scale;
        const step = Math.max(rBub + 32, rl.r * scale - ulPx + 32);
        const lx = s.x + ux * (step + wpx / 2);
        const ly = s.y + uy * step;
        if (lx - wpx / 2 < 6 || lx + wpx / 2 > vp.w - 6) { clampSkip++; continue; }
        if (ly < KO_TOP || ly > vp.h - KO_BOT) { clampSkip++; continue; }
        nameTot++;
        for (const P of placed) {
          if (P[2] !== 14) continue;               // vs the shield only
          if (Math.abs(lx - P[0]) < (wpx + P[2]) / 2 && Math.abs(ly - P[1]) < 15) { nameBlocked++; break; }
        }
      }
    }
    // 6 ▸ the zero-overlapping-pairs invariant of the final list —
    // the curved runs push their rects by hand after the atomic
    // test, so prove no pair violates the claim() metric.
    let pairBad = 0;
    for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
      const A = placed[i], B = placed[j];
      if (Math.abs(A[0] - B[0]) < (A[2] + B[2]) / 2 && Math.abs(A[1] - B[1]) < 15) pairBad++;
    }
    if (pairBad) fail(fam + ' @' + vp.w + 'x' + vp.h + ': ' + pairBad
      + ' overlapping pairs in the final placed list — the registry invariant broke');
  }
  if (headerFail === 0) ok(fam + ': both curved headers land at all 4 viewports');
  else fail(fam + ': ' + headerFail + ' curved header placements refused');
  if (capFail === 0) ok(fam + ': all ' + capTot + ' curved shelf captions land (4 viewports)');
  else fail(fam + ': ' + capFail + ' of ' + capTot + ' curved shelf captions refused');
  if (spineTot > 0 && spineLand === 0) {
    fail(fam + ': NO spine name lands at any viewport — the follower mechanism is dead');
  } else if (spineFail === 0) {
    ok(fam + ': ' + spineLand + ' of ' + spineTot + ' spine names land, and every spine'
      + ' whose shelf has room for it lands (the rest hide honestly — whole words or nothing)');
  } else {
    fail(fam + ': ' + spineFail + ' spine names refused DESPITE their shelf having room');
  }
  if (footTot === 0 || footFail === 0) ok(fam + ': the overflow foot lands (' + footTot + ' placements)');
  else fail(fam + ': ' + footFail + ' of ' + footTot + ' overflow feet refused');
  if (nameBlocked === 0) ok(fam + ': 0 of ' + nameTot + ' slot reach-names blocked by the band shield'
    + (clampSkip ? ' (' + clampSkip + ' viewport-clamped placements excluded)' : ''));
  else fail(fam + ': ' + nameBlocked + ' of ' + nameTot + ' slot reach-names blocked by the shield');
}
// John's wave-4 ask, pinned: "3 rows of docs" — Christian's 125
// documents must thicken to 3 sub-rows at the shipped defaults.
{
  const h = houseUnion('Christian', 'cascade').house;
  const rl = h.rails.left;
  if (rl && rl.nSub === 3) ok('Christian SCRIPTORIUM runs 3 sub-rows at the defaults (125 docs use the room)');
  else fail('Christian SCRIPTORIUM nSub=' + (rl && rl.nSub) + ', expected 3 — the band is not using its space');
}

// ── W3-HOSTILE ▸ the dial extremes can never make slots touch ──
// The overlap that survived first contact: 4 sub-rows at a tight
// pitch — an INNER sub-row rides a smaller circle, so its chord is
// rInner/bandR of the centreline pitch, and glyphs sized off the
// centreline pitch overlapped by exactly that factor (Christian,
// railMax 400 · rows 4 · gap 8° · glyph 0.7: 107 pairs at −0.01 wu).
console.log('\n── W3-HOSTILE · dial extremes: zero slot overlaps, zero NaN ──');
for (const [fam, extra] of [
  ['Christian', { railMax: 400, bandRows: 4, bandGap: 8, railGlyph: 0.7 }],
  ['Other',     { railMax: 400, bandRows: 1, bandGap: 45, railGlyph: 0.7, bandR: 1.0, treeR: 0.5 }],
  ['Other',     { railMax: 20,  bandRows: 4, bandGap: 45, railGlyph: 0.2, bandR: 0.6, treeR: 0.95 }],
  // wave-4 dials at their extremes: widest arc + fattest pitch +
  // no header reserve, then narrowest arc + max reserve + max rows
  ['Christian', { railMax: 400, bandRows: 4, bandGap: 8, bandGapBot: 2, bandPitch: 30, bandHead: 0, railGlyph: 0.7 }],
  ['Other',     { railMax: 400, bandRows: 4, bandGap: 45, bandGapBot: 45, bandPitch: 30, bandHead: 400, railGlyph: 0.7 }],
  ['Greek',     { railMax: 400, bandRows: 4, bandGap: 8,  bandGapBot: 60, bandPitch: 6,  bandHead: 400, railGlyph: 0.2, capClear: 0 }],
]) {
  const lay = houseUnion(fam, 'cascade', extra);
  const h = lay.house;
  let nan = 0;
  for (const [, p] of lay.positions) if (!isFinite(p.x) || !isFinite(p.y)) nan++;
  let overlap = 0, worst = Infinity;
  for (const rl of [h.rails.left, h.rails.right]) {
    if (!rl) continue;
    const pts = [];
    for (const sh of rl.shelves) for (const it of sh.items) pts.push(it);
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) - 2 * rl.glyphR;
      if (d < worst) worst = d;
      if (d < -0.01) overlap++;
    }
  }
  const tag = fam + ' ' + JSON.stringify(extra);
  if (nan === 0 && overlap === 0) ok(tag + ' → 0 overlaps, 0 NaN (worst gap '
    + (worst === Infinity ? '—' : worst.toFixed(2) + ' wu') + ')');
  else fail(tag + ' → ' + overlap + ' overlaps, ' + nan + ' NaN');
}

// ── W3-PROBE ▸ the acceptance numbers, printed from the real data ──
// Band radii, glyph size in wu AND CSS px at the isolate's own fit
// scale, per-shelf arc, worst slot gap — the numbers John's round is
// judged by.
console.log('\n── W3-PROBE · the ring, measured (fit scale 1440x900 = '
  + (900 / 1220).toFixed(4) + ') ──');
for (const fam of ['Greek', 'Christian', 'Norse', 'Other']) {
  const lay = houseUnion(fam, 'cascade');
  const h = lay.house;
  const fit = 900 / 1220;
  let maxExt = 0;
  for (const row of h.rows) for (const id of row) {
    const p = lay.positions.get(id);
    const e = Math.hypot(p.x, p.y) + (lay.radii.get(id) || 0);
    if (e > maxExt) maxExt = e;
  }
  console.log('  ' + fam + ': treeR=' + h.treeR.toFixed(0) + 'wu portR=' + h.portR.toFixed(0)
    + 'wu cascadeExtent=' + maxExt.toFixed(0) + 'wu');
  for (const [nm, rl] of [['SCRIPTORIUM', h.rails.left], ['COURT', h.rails.right]]) {
    if (!rl) { console.log('    ' + nm + ': —'); continue; }
    const pts = [];
    for (const sh of rl.shelves) for (const it of sh.items) pts.push(it);
    let worst = Infinity;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) - 2 * rl.glyphR;
      if (d < worst) worst = d;
    }
    console.log('    ' + nm + ': r=' + rl.r.toFixed(0) + ' [' + rl.rIn.toFixed(0) + ',' + rl.rOut.toFixed(0)
      + '] nSub=' + rl.nSub + ' pitch=' + rl.pitch.toFixed(1) + 'wu glyphR=' + rl.glyphR.toFixed(2)
      + 'wu = ' + (rl.glyphR * fit).toFixed(2) + 'px r (' + (2 * rl.glyphR * fit).toFixed(1)
      + 'px dia) capR=' + rl.capR.toFixed(0) + '+' + rl.capTier
      + ' worstGap=' + (worst === Infinity ? '—' : worst.toFixed(2) + 'wu'));
    const dg = (a) => (a * 180 / Math.PI).toFixed(0) + '°';
    console.log('      ' + rl.shelves.map(s => s.label + ' ' + s.shown + '/' + s.count
      + ' [' + dg(s.a0) + '→' + dg(s.a1) + ']').join(' · '));
  }
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

// ── W2-F ▸ THE STATE FIXES ──────────────────────────────────
// These four are lifecycle, not geometry — nothing here can measure
// them without a browser, so they are pinned as source mirrors so a
// revert cannot pass the gate silently. Each names the defect it
// closes; the live probes the main thread should run are listed in the
// wave-2 handoff.
console.log('\n── W2-F · the lifecycle fixes (source-pinned; not measurable headless) ──');
must(/if \(cur\.fam !== next\.fam\s*\n\s*\|\| cur\.nodePosB\.length/,
  'startHouseTravel lerps only a SAME-FAMILY morph (EDGE-3: two 11-guest families both gave 1023*4 floats and lerped mismatched instances)');
must(/function leaveHouseState\(\)[\s\S]{0,1400}restoreModeSnapshot\(\);[\s\S]{0,120}_houseRepackPending = false;/,
  'leaveHouseState puts the guests back and clears the pending repack (GUEST-4)');
must(/const snap = local\._houseModeSnapshot;[\s\S]{0,160}return snap\.nodes;/,
  'the search corpus reads the UN-augmented wheel (mode-nodes-mutation-leaks-into-search)',
  readFileSync(join(root, 'src/js/forge/search-autocomplete.js'), 'utf8'));
must(/const env = houseChromeEnv\(ctx, placed, vp\);[\s\S]{0,300}if \(env\.claim\(vp\.w \/ 2, hy, w\)\)/,
  'renderHintLine goes through the ONE claim(), not a second copy of the collision math (law 5)');
must(/claim\(cs\.x \+ \(wFan - wCas\) \/ 2, chipY/,
  'the CASCADE/FAN registry reserve is centred on the rect the chips actually occupy');
must(/else chipsG\.style\.removeProperty\('--family-color'\);/,
  'a house with no hull colour clears the chip colour instead of keeping the previous family\'s');

console.log('');
if (failures) { console.error(failures + ' FAILURE(S)'); process.exit(1); }
console.log('ALL CHECKS PASS');
