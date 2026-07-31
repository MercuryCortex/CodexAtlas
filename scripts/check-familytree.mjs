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

// ── W6 · THE GUARD IS IDLE EVERYWHERE + THE FAN KEEPS ITS WINDOW ──
// (2026-07-31 — the two build-order fixes finally applied, and the
// two assertion GAPS that let them ship unfixed closed with them:
// cyclesBroken===0 was asserted for Greek alone while Celtic's break
// printed mid-run and the gate still passed; and nothing bounded a
// fan ring's angular extent, so the braid /2 bug shipped 350° closed
// annuli under a declared ±99° window.)
console.log('\n── W6 · cycle guard idle + fan span, every gate family ──');
{
  const W6_FAMS = ['Greek', 'Norse', 'Vedic', 'Christian', 'Chinese', 'Egyptian',
    'Mesopotamian', 'Celtic', 'Mesoamerican', 'Baltic', 'Other', 'Islamic', 'Buddhist'];
  const FAN_SPAN_LIM = Math.PI * 1.10 + 0.03;   // the declared window + rounding air
  let w6cyc = 0, w6span = 0, w6worst = 0;
  for (const fam of W6_FAMS) {
    for (const geo of ['cascade', 'fan']) {
      const lay = houseFor(fam, geo);
      if (!lay || !lay.house) continue;
      const cb = (lay.house.stats && lay.house.stats.cyclesBroken) || 0;
      if (cb !== 0) { w6cyc++; fail(fam + '/' + geo + ': cycle guard fired ' + cb + '× (a real arc was deleted)'); }
      if (geo !== 'fan') continue;
      const ctr = lay.house.center, fy = ctr.y + (lay.house.fanDy || 0);
      for (const row of lay.house.rows) {
        if (!row || row.length < 2) continue;
        let amin = Infinity, amax = -Infinity, all = true;
        for (const id of row) {
          const p = lay.positions.get(id);
          if (!p) { all = false; break; }
          let a = Math.atan2(p.y - fy, p.x - ctr.x) + Math.PI / 2;   // 0 = 12 o'clock
          if (a > Math.PI) a -= 2 * Math.PI;
          if (a < amin) amin = a;
          if (a > amax) amax = a;
        }
        if (!all) continue;   // parked/absent members are not a span question
        const ext = amax - amin;
        if (ext > w6worst) w6worst = ext;
        if (ext > FAN_SPAN_LIM) { w6span++; fail(fam + ': fan ring spans ' + (ext * 180 / Math.PI).toFixed(1) + '° (window is 198°)'); }
      }
    }
  }
  if (w6cyc === 0) ok('cycle guard idle across ' + W6_FAMS.length + ' families × both geometries');
  if (w6span === 0) ok('every fan ring inside its ±99° window (worst ' + (w6worst * 180 / Math.PI).toFixed(1) + '°)');
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
// 2026-07-31 — the house dials moved OUT of the Node Lab into their own
// DEV door (John: "IN TH ENODE LAB?!?!?!?! ... is SUPER CLUTTED / I
// ASKED TO DO ITS OWN CLEAN SIMPLE TO ACESS ONE OPANEL FOR HTIS"). The
// house rows this harness pins live in house-panel.js now; the row
// builders themselves live in the shared panel-kit.js. Live-mount
// coverage of both is §D of check-house-interaction.mjs.
const HOUSE_PANEL_SRC = readFileSync(join(root, 'src/js/forge/house-panel.js'), 'utf8');
const PANEL_KIT_SRC   = readFileSync(join(root, 'src/js/forge/panel-kit.js'), 'utf8');
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
must(/const anchor = houseTitleAnchor\(vp\);\n\s+const cs = \{ x: anchor\.x, y: anchor\.y \};/,
  'the title block rides houseTitleAnchor — CENTER (the ratified toy law) by default, corners as dials');
must(/house_title_slot:\s+'center',/,
  'the DEFAULT slot is center — the postmortem worklist #1, re-ratified 2026-07-31');
must(/const p = camera\.worldToScreen\(house\.center\.x, topWorldY, vp\);/,
  'the centre slot projects the house top through the camera — paint-only, it reserves no world space');
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
// WAVE 5 — the glyph law grew a term. 0.49·minDist is still the
// no-touch backstop (it must stay, or a dial extreme can make two
// slots intersect); on top of it the glyph now gives up
// (minDist − mGlyph)/2 so the CLEARANCE is what the dial buys.
must(/glyphR = Math\.min\(RAIL_R_MAX, pitch \* railFrac, 0\.49 \* minDist,\s*\n?\s*Math\.max\(\(minDist - mGlyph\) \/ 2, RAIL_R_MIN\)\);/,
  '(layout) glyphs still cap at 0.49·minDist AND surrender (minDist−mGlyph)/2 to the margin', treeSrc);
must(/const hasBand = \(docs\.length \+ court\.length\) > 0;/,
  '(layout) no docs + no court ⇒ no band ⇒ pre-ring geometry, byte-identical (honest zero)', treeSrc);
must(/minDist = Math\.min\(BAND_SHELF_GAP,/,
  '(layout) the shelf gap bounds the glyph too, or max-size glyphs touch across shelf borders', treeSrc);
must(/dr = Math\.max\(Math\.min\(pitch \* BAND_SUB_DR, BAND_SUB_DR_MAX\), 2 \* glyphR \+ mSubRow\);/,
  '(layout) the sub-row margin beats the cosmetic dr ceiling — sub-rows can never crowd', treeSrc);
must(/const railSolves = hasBand[\s\S]{0,200}solveRail\(docShelves\(docs\), -1\)/,
  '(layout) the band is SOLVED BEFORE the tree — the tree gets the lane that is left', treeSrc);
must(/const laneCap = hasBand \? Math\.min\(Rt, RtLane\) : Infinity;[\s\S]{0,160}const k = laneCap \/ treeExt;/,
  '(layout) the tree is SCALED into the lane the band left it (marginTree is constructed, not sampled)', treeSrc);
must(/RtLane = Math\.min\(RtLane, rs\.rC - rs\.thick \/ 2 - mTreeBand\);/,
  '(layout) the lane IS the band\'s inner edge less marginTree', treeSrc);
// HONEST ZERO — the clamp must not run at all without a band, or a
// deity-only family (rails off, the degrade branch) stops being
// byte-identical to the 07-30 house. Proven separately against
// HEAD's familytree.js: 72 no-band houses, zero differing positions.
must(/const laneCap = hasBand \? Math\.min\(Rt, RtLane\) : Infinity;/,
  '(layout) with no band the lane clamp is disabled (honest zero)', treeSrc);
{
  let touched = 0, checked = 0;
  for (const fam of ['Baltic', 'Greek', 'Norse']) {
    for (const geom of ['cascade', 'fan']) {
      // deity-only node set ⇒ no docs, no court ⇒ no band
      const lay = houseFor(fam, geom);
      if (lay.house.hasBand) continue;
      checked++;
      if (lay.house.treeR !== lay.house.radius) touched++;
      if ((lay.house.margins.rtCost || 0) > 0) touched++;
    }
  }
  if (!touched) ok('the no-band house keeps the FULL radius and pays no lane cost ('
    + checked + ' houses)');
  else fail(touched + ' no-band houses were touched by the band budget');
}
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
// THE FLAT WRITER'S MIRROR (2026-07-31 — the ratified default;
// house_caption_style='curved' keeps the arc writer as a dial and
// arcRunSim above stays for it). One rect at the bearing, growing
// horizontally AWAY from the circle, mono-advance width.
function flatSim(placed, text, rWu, aRef, sizePx, scale, ctrX, ctrY, vpH, opts) {
  const o = opts || {};
  const rr = rWu * scale + sizePx / 2;
  const gx = ctrX + Math.cos(aRef) * rr;
  const gy = ctrY + Math.sin(aRef) * rr + (o.dy || 0);
  const leftSide = Math.cos(aRef) < 0;
  const w = text.length * sizePx * 0.62 + 6;
  return claimSim(placed, leftSide ? gx - w / 2 : gx + w / 2, gy, w, vpH)
    ? { x: gx, y: gy, leftSide } : null;
}
const RING_VPS = [{ w: 1440, h: 900 }, { w: 1280, h: 800 }, { w: 1000, h: 1000 }, { w: 900, h: 1600 }];
// THE TITLE ANCHOR (re-ratified 2026-07-31) — mirrors forge.js's
// houseTitleAnchor. The DEFAULT slot is 'center': the toy's crown
// law — centred on the house, the stack hanging above the ring's
// 12 o'clock gap (or the crown when no band stands), projected
// through the camera but PAINT-ONLY (no world reservation). The
// wave-4 corners remain as dials and keep their no-camera claim.
const TITLE_PAD = 24, TITLE_TOP = 66;
const titleAnchor = (vp, slot, h, W2S) => {
  if (slot === 'left' || slot === 'right') {
    return {
      right: slot === 'right', center: false,
      x: (slot === 'right') ? Math.max(TITLE_PAD, vp.w - TITLE_PAD) : TITLE_PAD,
      y: TITLE_TOP,
    };
  }
  const stackH = rowOf(T_HEAD) * 3 + 10;
  const rl = h.rails && (h.rails.left || h.rails.right);
  const topWorldY = rl ? (h.center.y - rl.r)
    : (h.geometry === 'fan' ? (h.center.y - h.treeR)
      : (h.crown ? h.crown.y : h.center.y - h.treeR));
  const p = W2S(h.center.x, topWorldY);
  return {
    right: false, center: true,
    x: Math.max(170, Math.min(vp.w - 170, p.x)),
    y: Math.max(TITLE_TOP, Math.min(vp.h - 160, p.y - stackH)),
  };
};
// The family name is SVG (11px mono, letter-spacing .24em, uppercase);
// 0.85em per glyph is the conservative advance for a collision test.
const titleW = (fam) => String(fam).length * 11 * 0.85 + 12;
let titleBlockFail = 0, titleBlockTot = 0;
// The deity names paint in the SANS face at label_size (14 CSS px);
// 0.52em is the conservative average advance for Inter at that size.
const sansW = (str) => String(str).length * 14 * 0.52;
// The wheel's tier percentiles over the DEITIES block, mirroring
// engine/graph/node.js — the rank pass walks names in tier order, and
// label.js's open set feeds it in DEGREE order inside a tier.
const W4_DEITIES = NODES.filter(n => n && n.type === 'deity');
const W4_DIDS = new Set(W4_DEITIES.map(n => n.id));
const W4_DEG = degreeMap(W4_DEITIES, EDGES.filter(e => W4_DIDS.has(e.source) && W4_DIDS.has(e.target)));
const W4_SORTED = W4_DEITIES.map(n => W4_DEG.get(n.id) || 0).sort((a, b) => b - a);
const W4_Q = (p) => W4_SORTED[Math.min(W4_SORTED.length - 1, Math.floor(W4_SORTED.length * p))] || 0;
const W4_CUT = [W4_Q(0.04), W4_Q(0.15), W4_Q(0.40), W4_Q(0.60), W4_Q(0.80)];
const w4TierOf = (id) => {
  const d = W4_DEG.get(id) || 0;
  for (let t = 0; t < 5; t++) if (d >= W4_CUT[t]) return t;
  return 5;
};
for (const fam of ['Greek', 'Christian', 'Norse', 'Egyptian', 'Mesopotamian', 'Other']) {
  const lay = houseUnion(fam, 'cascade');
  const h = lay.house;
  let headerFail = 0, capFail = 0, capTot = 0, spineFail = 0, spineTot = 0, spineLand = 0;
  let footFail = 0, footTot = 0, nameBlocked = 0, nameTot = 0, clampSkip = 0;
  let godTot = 0, godPrinted = 0, godClamped = 0;
  // The rank pass's own order: tier asc, then degree desc, then id.
  const nameOrder = [];
  for (const row of h.rows) for (const id of row) nameOrder.push(id);
  nameOrder.sort((a, b) => (w4TierOf(a) - w4TierOf(b))
    || ((W4_DEG.get(b) || 0) - (W4_DEG.get(a) || 0)) || (a < b ? -1 : 1));
  for (const vp of RING_VPS) {
    const scale = Math.min(vp.w, vp.h) / (2 * (540 + 70));
    const W2S = (x, y) => ({ x: vp.w / 2 + x * scale, y: vp.h / 2 + y * scale });
    const ctrX = vp.w / 2, ctrY = vp.h / 2;
    const placed = [];
    // 1 ▸ THE TITLE BLOCK (HIGH half, first of all) — the family name,
    // both stat lines and the CASCADE/FAN chips, on the locked screen
    // fixture. Width from the real strings this family prints.
    const st = h.stats;
    const anch = titleAnchor(vp, 'center', h, W2S);
    const cs = { x: anch.x, y: anch.y };
    const cenX = (w) => anch.center ? anch.x
      : (anch.right ? (anch.x - w / 2) : (anch.x + w / 2));
    const CROWN_ROW = rowOf(T_HEAD);
    const noun = st.treeKind ? (String(st.treeKind) + 's').replace(/ys$/, 'ies').toUpperCase() : 'MEMBERS';
    const line1 = st.tree + ' ' + noun + ' · ' + st.kinArcs + ' LINEAGE ARCS · ' + st.orphanCount + ' STAND ON THEIR ERA';
    const line2 = st.docs + ' IN THE SCRIPTORIUM · ' + st.court + ' IN THE COURT';
    // MERGED (wave 4) — the REAL paint order is: locked title block →
    // band curved text → band shield → ports → god names → low half.
    // The two agents each rewrote part of this replay; this is the union
    // in the order the view actually paints, not either side alone.
    const tw = titleW(fam);
    const w1 = mw(line1, T_HEAD), w2b = mw(line2, T_CAP);
    // Row 0 is syncHulls' published title rect, seeded into `placed`
    // before the canvas pass — same as local._titleRects.
    const rows4 = [
      claimSim(placed, cenX(tw), cs.y, tw, vp.h),
      claimSim(placed, cenX(w1), cs.y + CROWN_ROW, w1, vp.h),
      claimSim(placed, cenX(w2b), cs.y + CROWN_ROW * 2, w2b, vp.h),
      claimSim(placed, cenX(110), cs.y + CROWN_ROW * 3, 110, vp.h),   // CASCADE/FAN chip reserve
    ];
    for (const r of rows4) { titleBlockTot++; if (!r) titleBlockFail++; }
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
      if (!flatSim(placed, header, rl.capR + rl.capTier, rl.headA, T_HEAD,
                   scale, ctrX, ctrY, vp.h)) headerFail++;
      for (const sh of rl.shelves) {
        const txt = sh.label + ' · ' + ((sh.shown < sh.count) ? (sh.shown + ' OF ' + sh.count) : sh.count);
        capTot++;
        const res = flatSim(placed, txt, sh.capR, sh.capA, T_CAP, scale, ctrX, ctrY, vp.h);
        if (!res) { capFail++; continue; }
        landed.push([sh, res]);
      }
      // the overflow foot — a canonical count, claimed before any
      // spine (wave 4; flat since 2026-07-31)
      if (rl.overflow > 0 && rl.foot) {
        footTot++;
        if (!flatSim(placed, '+' + rl.overflow + ' NOT SHOWN', rl.capR, rl.foot.a,
                     T_CAP, scale, ctrX, ctrY, vp.h)) footFail++;
      }
    }
    for (const [sh] of landed) {
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
      // the view's flat law: one clear row OUTWARD of the caption at
      // the same bearing (up in the top half, down in the bottom).
      const dy = (Math.sin(sh.capA) >= 0 ? 1 : -1) * Math.max(16, Math.round(T_NAME * 1.9));
      if (flatSim(placed, title, sh.capR, sh.capA, T_NAME, scale, ctrX, ctrY, vp.h, { dy })) spineLand++;
      else spineFail++;
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
    // 5b ▸ THE GOD NAMES (2026-07-31 wave 4) — the whole point of the
    // open set, replayed through the REAL registry in the REAL order:
    // title block → band shield → headers → captions/spines → ports →
    // THESE → the low half. PROVE A PROMISED STRING ACTUALLY PRINTS.
    // Position and rect are renderLabelsCanvas's own: centred above the
    // disc at s.y − r·scale − 6 (width = measured + 10, sans 14px),
    // and — house only — the mirrored row at s.y + r·scale + 16 when
    // the row above is taken.
    for (const id of nameOrder) {
      const p = lay.positions.get(id);
      if (!p) continue;
      const s = W2S(p.x, p.y);
      if (s.x < -100 || s.x > vp.w + 100 || s.y < -100 || s.y > vp.h + 100) continue;
      const node = NODE_BY_ID.get(id);
      const title = (node && node.title) || id;
      const wpx = sansW(title) + 10;
      const rBub = (lay.radii.get(id) || 0) * scale;
      const ly = s.y - rBub - 6;
      if (ly < KO_TOP || ly > vp.h - KO_BOT) { godClamped++; continue; }
      godTot++;
      if (claimSim(placed, s.x, ly, wpx, vp.h)) { godPrinted++; continue; }
      const ly2 = s.y + rBub + 16;
      if (claimSim(placed, s.x, ly2, wpx, vp.h)) godPrinted++;
    }
    // 6 ▸ every slot's radially-outboard REACH name vs the shield
    // 6 ▸ every slot's radially-outboard REACH name vs the shield
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
  if (headerFail === 0) ok(fam + ': both headers land at all 4 viewports (flat default)');
  else fail(fam + ': ' + headerFail + ' header placements refused');
  if (capFail === 0) ok(fam + ': all ' + capTot + ' shelf captions land (4 viewports, flat default)');
  else fail(fam + ': ' + capFail + ' of ' + capTot + ' shelf captions refused');
  if (spineTot > 0 && spineLand === 0) {
    fail(fam + ': NO spine name lands at any viewport — the spine mechanism is dead');
  } else {
    ok(fam + ': ' + spineLand + ' of ' + spineTot + ' spine names land'
      + (spineFail ? ' (' + spineFail + ' hide honestly in crowded arcs — whole words or nothing)' : ''));
  }
  if (footTot === 0 || footFail === 0) ok(fam + ': the overflow foot lands (' + footTot + ' placements)');
  else fail(fam + ': ' + footFail + ' of ' + footTot + ' overflow feet refused');
  if (nameBlocked === 0) ok(fam + ': 0 of ' + nameTot + ' slot reach-names blocked by the band shield'
    + (clampSkip ? ' (' + clampSkip + ' viewport-clamped placements excluded)' : ''));
  else fail(fam + ': ' + nameBlocked + ' of ' + nameTot + ' slot reach-names blocked by the shield');
  // WAVE 4 — the gods' names, actually printed through the registry.
  // The floor is deliberately a FRACTION, not a count: a name that
  // loses to another NAME is the collision rule working, but a house
  // where most gods still cannot print would mean the open set never
  // reached the registry (the defect John reported).
  const godPct = godTot ? (100 * godPrinted / godTot) : 100;
  if (godPct >= 62) {
    ok(fam + ': ' + godPrinted + ' of ' + godTot + ' god names PRINT through the real registry ('
      + godPct.toFixed(0) + '%, 4 viewports'
      + (godClamped ? '; ' + godClamped + ' keep-out clamped' : '') + ')');
  } else {
    fail(fam + ': only ' + godPrinted + ' of ' + godTot + ' god names print (' + godPct.toFixed(0) + '%)');
  }
}
if (titleBlockFail === 0) ok('the title block prints all four rows, 6 families × 4 viewports ('
  + titleBlockTot + ' placements)');
else fail(titleBlockFail + ' of ' + titleBlockTot + ' title-block rows refused');
// BOTH SLOTS, and the block never touches the band. The 'right' slot
// is a dial John can reach, so it gets the same proof as the default:
// every row inside the viewport and clear of the keep-outs, and no row
// overlapping the band's on-screen ring at any gate viewport.
{
  let offScreen = 0, onBand = 0, koBad = 0, cases = 0;
  for (const fam of ['Greek', 'Christian', 'Vedic', 'Other']) {
    const lay = houseUnion(fam, 'cascade');
    const h = lay.house;
    const st = h.stats;
    const noun = st.treeKind ? (String(st.treeKind) + 's').replace(/ys$/, 'ies').toUpperCase() : 'MEMBERS';
    const rowsTxt = [
      titleW(fam),
      mw(st.tree + ' ' + noun + ' · ' + st.kinArcs + ' LINEAGE ARCS · ' + st.orphanCount + ' STAND ON THEIR ERA', T_HEAD),
      mw(st.docs + ' IN THE SCRIPTORIUM · ' + st.court + ' IN THE COURT', T_CAP),
      110,
    ];
    for (const slot of ['left', 'right']) {
      for (const vp of RING_VPS) {
        const scale = Math.min(vp.w, vp.h) / (2 * (540 + 70));
        const a = titleAnchor(vp, slot);
        const CR = rowOf(T_HEAD);
        for (let r = 0; r < 4; r++) {
          cases++;
          const w = rowsTxt[r];
          const y = a.y + CR * r;
          const x0 = a.right ? a.x - w : a.x, x1 = a.right ? a.x : a.x + w;
          if (y < KO_TOP || y > vp.h - KO_BOT) koBad++;
          if (x0 < 0 || x1 > vp.w) offScreen++;
          // the band's on-screen ring, sampled: does any point of it
          // fall inside this row's box?
          for (const rl of [h.rails.left, h.rails.right]) {
            if (!rl || !rl.shelves.length) continue;
            for (let k = 0; k <= 720; k++) {
              const ang = rl.a0 + ((rl.a1 - rl.a0) * k) / 720;
              const px = vp.w / 2 + Math.cos(ang) * rl.rOut * scale;
              const py = vp.h / 2 + Math.sin(ang) * rl.rOut * scale;
              if (px >= x0 && px <= x1 && Math.abs(py - y) <= 11) { onBand++; k = 721; }
            }
          }
        }
      }
    }
  }
  if (koBad === 0) ok('both title slots clear the top/bottom keep-outs at every gate viewport (' + cases + ' rows)');
  else fail(koBad + ' title-block rows land in a chrome keep-out');
  if (offScreen === 0) ok('both title slots keep every row inside the viewport');
  else fail(offScreen + ' title-block rows run off the viewport');
  if (onBand === 0) ok('the title block never overlaps the band ring — the 12 o\'clock gap keeps the corners free');
  else fail(onBand + ' title-block rows sit on the band');
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
// 2026-07-31 — the numeral rule MOVED into trueGen() when the dates came
// back (John: "i just want the DATES"). Same four guarantees, one
// expression: a numeral needs members, bones, nobody off-lineage, and a
// single depth — and it is the row's OWN depth. The behavioural
// assertions below are unchanged and still measure the real vault.
must(/const trueGen = \(rm\) => \(rm\.n && hasBones && rm\.offLineage === 0/,
  'a numeral needs members, lineage arcs in the house, and nobody there for a non-lineage reason');
must(/&& rm\.layerMin != null && rm\.layerMin === rm\.layerMax\)/,
  'a row spanning two lineage depths carries no numeral');
must(/\? \('GEN ' \+ romanNum\(rm\.layerMin \+ 1\)\) : null;/,
  "the numeral is the row's own depth, not its index");
// THE DATES ARE BACK on every rank in both geometries (the ratified
// design's own axis) and they print the row's true SPAN — which is what
// keeps a bare year off a row spanning 700 BCE-100 CE.
must(/const d = fmtRangeD\(rm\.dmin, rm\.dmax\);/,
  "the rank caption prints the row's RANGE, not its minimum");
must(/house_rank_caption:    'date',/,
  'the dates ship ON by default — the gutter is the axis the design shipped',
  forgeSrc);
must(/return g \? \(d \+ ' · ' \+ g\) : d;/,
  'the numeral rides WITH the date where it is true, instead of replacing it');
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
must(/claim\(chipX \+ \(wFan - wCas\) \/ 2, chipY/,
  'the CASCADE/FAN registry reserve is centred on the rect the chips actually occupy');
must(/const chipX = anchor\.center \? \(anchor\.x \+ \(wCas - wFan\) \/ 2\)\s*\n\s*: \(anchor\.right \? \(anchor\.x - wFan - 8\) : \(anchor\.x \+ wCas \+ 8\)\);/,
  'the chips centre on the block in the centre slot and ride its edge in the corners');
must(/house_caption_style:\s+'flat',/,
  'FLAT captions are the shipped default — the ratified toy has zero rotated text (postmortem #6)');
must(/const leftSide = Math\.cos\(aRef\) < 0;/,
  'a flat run grows horizontally AWAY from the circle, side chosen by its bearing');
must(/else chipsG\.style\.removeProperty\('--family-color'\);/,
  'a house with no hull colour clears the chip colour instead of keeping the previous family\'s');

// ════════════════════════════════════════════════════════════════
// W4 ▸ THE GODS GET THEIR NAMES BACK
// ════════════════════════════════════════════════════════════════
// John: "the DEities nodes are the most important and NEVER appear,
// i need to OVER to see the names.... even at 100% scale!"
//
// The old rule: a name is eligible when camScale clears the node's
// TIER threshold, tier being a degree percentile over the WHOLE
// wheel. Inside a house that is the wrong question — the house
// re-sizes every member onto its own radius lane, so every god is
// drawn the same and only the top few percent are ever named.
//
// This section measures BOTH rules against the real vault at the
// scale the isolate actually flies to.
console.log('\n── W4 · house names: admitted before vs after (the ladder vs the open set) ──');
const labelSrc = readFileSync(join(root, 'src/js/engine/graph/label.js'), 'utf8');
must(/opts\.openIds\s*=\s*treeIds;/,
  'syncLabels admits the CASCADE to the idle set (the open set)');
must(/if \(openOn && openIds\.has\(n\.id\)\) continue;/,
  '(label.js) an open-set member never also competes in the zoom ladder', labelSrc);
// HONEST ZERO of the ceiling dial, measured (not source-pinned): with
// the ceiling at 0 the function must behave EXACTLY as if the house
// had never handed it an open set — the ladder alone.
{
  globalThis.AtlasEngineGraph = undefined;
  new Function(labelSrc)();
  const fn = globalThis.AtlasEngineGraph.computeIdleLabelVisibility;
  const hn = [];
  for (let i = 0; i < 60; i++) {
    hn.push({ id: 'probe-' + i, x: (i % 10) * 90, y: Math.floor(i / 10) * 70, r: 9, tier: i % 6 });
  }
  const base = { worldToScreen: (x, y) => ({ x: x + 40, y: y + 60 }), viewport: { w: 1000, h: 700 },
    maxLabels: 100, labelSizePx: 14, collisionPaddingPx: 4,
    tierZoomThresholds: [0, 0.8, 1.2, 1.6, 2.0, 2.8] };
  const all = new Set(hn.map(n => n.id));
  const rank = new Map(hn.map((n, i) => [n.id, 60 - i]));
  const key = (s) => Array.from(s).sort().join('|');
  let zeroOK = true, dialOK = true;
  for (const cs of [0.5, 0.7, 1.0, 1.4, 2.0, 3.0]) {
    const ladder = key(fn(hn, cs, Object.assign({}, base)));
    if (ladder !== key(fn(hn, cs, Object.assign({}, base, { openIds: all, openMax: 0, openRank: rank })))) zeroOK = false;
    const opened = fn(hn, cs, Object.assign({}, base, { openIds: all, openMax: 60, openRank: rank }));
    if (opened.size !== 60) dialOK = false;
  }
  if (zeroOK) ok('(label.js) ceiling 0 ⇒ output identical to the plain zoom ladder (honest zero of the dial)');
  else fail('(label.js) ceiling 0 does NOT reduce to the plain ladder');
  if (dialOK) ok('(label.js) ceiling 60 ⇒ all 60 open candidates admitted at every zoom, no ladder gate');
  else fail('(label.js) the open set is still being gated by zoom');
}
must(/const openMax\s*=\s*\(opts && typeof opts\.openMax === 'number'\)/,
  '(label.js) openMax reads by TYPE — an explicit 0 means zero, not "absent"', labelSrc);
must(/\/\/ AND NO AABB PASS OF ITS OWN/,
  '(label.js) the open set runs NO second collision pass — law 5, the view\'s claim() is the ONE registry', labelSrc);
must(/if \(rankTreeIds && !rankTreeIds\.has\(id\)\) continue;/,
  'the RANK pass names the cascade and nothing else (band mass + parked remainder keep the reach path)');
// A CONTROL HE CANNOT FIND IS UNSHIPPED (the standing rule, breached
// four times in three days). Both wave-4 dials must be in the HOUSE
// panel, in a section that DECLARES itself open, and the open-state
// fallback that makes a declared-open NEW section actually open for a
// returning user must still be there — that fallback is the structural
// fix, and without it a section ships invisible exactly like the last
// three did.
{
  const sec = /\{ id: 'words', title: '([^']+)', open: true,/.exec(HOUSE_PANEL_SRC);
  if (sec) ok('the HOUSE panel has a section "' + sec[1] + '", declared OPEN');
  else fail('the wave-4 dials have no open section — the control is unfindable');
  must(/\['house_name_max',\s+'House names'/, 'HOUSE row: House names (the ceiling)', HOUSE_PANEL_SRC);
  must(/\{ k: 'radio',\s+key: 'house_title_slot' \}/, 'HOUSE row: Title corner', HOUSE_PANEL_SRC);
  must(/if \(!Object\.prototype\.hasOwnProperty\.call\(openState, sec\.id\)\) openState\[sec\.id\] = !!sec\.open;/,
    'a NEW section falls back to its DECLARED open state for a returning user', PANEL_KIT_SRC);
  must(/else if \(mode === 'relabel' && api\.relabel\) api\.relabel\(\);/,
    'the dial machine routes a name dial through relabel(), not a redraw the idle-skip swallows', PANEL_KIT_SRC);
  must(/relabel\(\) \{ try \{ syncLabels\(\); \}/,
    'forge.js exposes relabel() — the label SET is rebuilt, so the dial is not dead until the next pan');
  must(/local\._hullsIdleTitle === _hts/,
    'syncHulls\' idle cache carries the title slot, so the corner dial actually moves the block');
}

// The wheel's tier percentiles, exactly as engine/graph/node.js cuts
// them (4 / 15 / 40 / 60 / 80%), taken over the DEITIES wheel — which
// is the block the house pins its percentiles to.
{
  const deities = NODES.filter(n => n && n.type === 'deity');
  const dIds = new Set(deities.map(n => n.id));
  const dEdges = EDGES.filter(e => dIds.has(e.source) && dIds.has(e.target));
  const wheelDeg = degreeMap(deities, dEdges);
  const sorted = deities.map(n => wheelDeg.get(n.id) || 0).sort((a, b) => b - a);
  const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] || 0;
  const cut = [q(0.04), q(0.15), q(0.40), q(0.60), q(0.80)];
  const tierOf = (id) => {
    const d = wheelDeg.get(id) || 0;
    for (let t = 0; t < 5; t++) if (d >= cut[t]) return t;
    return 5;
  };
  const THRESH = [0, 0.8, 1.2, 1.6, 2.0, 2.8];   // label.js tierZoomThresholds
  const NAME_MAX = 120;                          // PARAM_DEFAULTS.house_name_max
  const FIT = 900 / 1220;                        // the isolate's own fit at 1440x900
  let mute = 0;
  console.log('    family        cascade  named@fit  named@1.0  →  admitted (ceiling ' + NAME_MAX + ')');
  for (const fam of ['Greek', 'Norse', 'Vedic', 'Christian', 'Chinese', 'Egyptian', 'Mesopotamian']) {
    const h = houseUnion(fam, 'cascade').house;
    const ids = [];
    for (const row of h.rows) for (const id of row) ids.push(id);
    const eligible = (cs) => ids.filter(id => cs + 1e-6 >= THRESH[tierOf(id)]).length;
    const after = Math.min(ids.length, NAME_MAX);
    if (after <= eligible(FIT)) mute++;
    console.log('    ' + fam.padEnd(14) + String(ids.length).padStart(5)
      + String(eligible(FIT)).padStart(10) + String(eligible(1.0)).padStart(11)
      + '  →  ' + after + ' (' + (after - eligible(FIT)) + ' gods who had no name)');
  }
  if (mute === 0) ok('every family names MORE of its cascade than the zoom ladder did at the isolate fit');
  else fail(mute + ' families gained nothing — the open set is not reaching them');
  // The ceiling has to clear the biggest cascade in the vault, or the
  // default silently truncates a family and John reads it as the bug
  // he already reported.
  let biggest = 0, biggestFam = '';
  for (const fam of new Set(NODES.map(n => (n && n.family) || 'Other'))) {
    const h = houseUnion(fam, 'cascade').house;
    let n = 0;
    for (const row of h.rows) n += row.length;
    if (n > biggest) { biggest = n; biggestFam = fam; }
  }
  if (NAME_MAX >= biggest) {
    ok('the default ceiling ' + NAME_MAX + ' clears the largest cascade in the vault ('
      + biggestFam + ', ' + biggest + ')');
  } else {
    fail('house_name_max ' + NAME_MAX + ' truncates ' + biggestFam + ' (' + biggest + ' members)');
  }
}

// ════════════════════════════════════════════════════════════════
// W5 ▸ ZERO-TOLERANCE MARGINS — MEASURED, NOT DECLARED
// ════════════════════════════════════════════════════════════════
// John: "we keep the other work done with the increased 0 TOLERANCE
// bands margins between nodes NEVER getting close between bands."
//
// This block is the deliverable for that sentence — not the numbers
// themselves, which are dials. It re-derives all four clearances from
// the RAW OUTPUT (positions, radii, rail radii, port radius) rather
// than from house.margins, so it catches the layout mis-reporting its
// own geometry as readily as it catches a real collision:
//
//   1 ▸ gods' outer extent  → band inner edge      (marginTree)
//   2 ▸ outermost caption   → ports ring           (marginPort)
//   3 ▸ band sub-row        → band sub-row         (marginSub)
//   4 ▸ band glyph          → band glyph, any pair (marginGlyph)
//
// across every family below × both PACKS × both GEOMETRIES × the
// dial extremes. MEASURED ON THE SAME FAMILIES BEFORE THIS WAVE, at
// the shipped dials: 4.0 wu / 9.6 wu / 1.15 wu / 2.00 wu — which is
// the picture John is describing.
console.log('\n── W5 · the four clearances, measured on the raw output ──');
// The caption annulus outboard of the band is TEXT, and the layout
// reserves a fixed world allowance for its outer half-height. Pinned
// here: if the layout's reserve moves, this gate's arithmetic is
// wrong and the pin fails first.
must(/const BAND_CAP_TEXT\s*=\s*10;/, '(layout) the caption text reserve is 10 wu', treeSrc);
must(/const BAND_CAP_TIER\s*=\s*30;/, '(layout) the caption tier step is 30 wu', treeSrc);
must(/const M_TREE_BAND\s*=\s*16;/, '(layout) marginTree ships at 16 wu', treeSrc);
must(/const M_BAND_PORT\s*=\s*12;/, '(layout) marginPort ships at 12 wu', treeSrc);
must(/const M_SUB_ROW\s*=\s*3;/, '(layout) marginSub ships at 3 wu', treeSrc);
must(/const M_GLYPH\s*=\s*3;/, '(layout) marginGlyph ships at 3 wu', treeSrc);
must(/house_m_tree:\s*16,/, 'the LAB ships marginTree at 16 wu');
must(/house_m_port:\s*12,/, 'the LAB ships marginPort at 12 wu');
must(/house_m_sub:\s*3,/, 'the LAB ships marginSub at 3 wu');
must(/house_m_glyph:\s*3,/, 'the LAB ships marginGlyph at 3 wu');
must(/marginTree:\s*\(typeof p\.house_m_tree/, 'the view routes house_m_tree into the layout', forgeSrc);
must(/pack:\s*\(p\.house_pack === 'toy'\) \? 'toy' : 'bed',/,
  'the view routes house_pack into the layout', forgeSrc);
const CAP_TEXT_WU = 10, CAP_TIER_WU = 30;

// Re-derive the four clearances from raw output only.
function measureMargins(lay) {
  const h = lay.house;
  const rails = [h.rails.left, h.rails.right].filter(Boolean);
  if (!rails.length) return null;
  // 1 ▸ the gods' true outer extent against the innermost band edge
  let ext = 0;
  for (const row of h.rows) for (const id of row) {
    const p = lay.positions.get(id);
    ext = Math.max(ext, Math.hypot(p.x - h.center.x, p.y - h.center.y) + (lay.radii.get(id) || 0));
  }
  const rIn = Math.min(...rails.map(r => r.rIn));
  // 2 ▸ the outermost text the band puts on screen, against the ports.
  //     The header always rides tier 1 (renderBandCaptions), so the
  //     outer edge of the caption annulus is capR + capTier + text.
  const capOuter = Math.max(...rails.map(r => r.capR + r.capTier + CAP_TEXT_WU));
  // 3 + 4 ▸ inside the band. Sub-row separation is radial (dr less
  //     two glyphs); the glyph clearance is the true minimum over
  //     EVERY pair of slots on a rail, whatever their sub-row — which
  //     is what "never getting close" has to mean.
  let sub = Infinity, glyph = Infinity;
  for (const r of rails) {
    if (r.nSub > 1) sub = Math.min(sub, r.dr - 2 * r.glyphR);
    const pts = [];
    for (const sh of r.shelves) for (const it of sh.items) pts.push(it);
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) - 2 * r.glyphR;
      if (d < glyph) glyph = d;
    }
  }
  return {
    tree: rIn - ext,
    port: h.portR - capOuter,
    sub, glyph,
    // What the layout ADMITS it could not give (see the give-ground
    // order in familytree.js): a declared shortfall is honest, an
    // undeclared one is the bug this gate exists to catch.
    squeezeGlyph: Math.max(...rails.map(r => r.squeeze.glyph)),
    squeezePort:  Math.max(...rails.map(r => r.squeeze.port)),
  };
}

{
  const FAMS = ['Greek', 'Norse', 'Vedic', 'Christian', 'Chinese', 'Egyptian',
    'Mesopotamian', 'Celtic', 'Mesoamerican', 'Other', 'Islamic', 'Buddhist'];
  // The dial extremes the margins have to survive — the same hostile
  // corners W3-HOSTILE uses, plus the margins themselves cranked.
  const DIALS = [
    ['defaults', {}],
    ['margins ×3', { marginTree: 48, marginPort: 36, marginSub: 9, marginGlyph: 9 }],
    ['fat band',  { railMax: 400, bandRows: 4, bandPitch: 30, bandGap: 8, bandGapBot: 2, railGlyph: 0.7 }],
    ['thin arc',  { railMax: 400, bandRows: 4, bandGap: 45, bandGapBot: 45, bandHead: 400, railGlyph: 0.2, capClear: 0 }],
    ['wide beds', { chord: 1.0, bedFill: 1.0, bedCap: 0.32, spread: 1.5 }],
    ['band in',   { bandR: 0.60, treeR: 1.0, portInset: 0.85 }],
  ];
  let runs = 0, bad = 0;
  const worst = { tree: Infinity, port: Infinity, sub: Infinity, glyph: Infinity };
  const worstAt = {};
  for (const [dialName, extra] of DIALS) {
    for (const pack of ['bed', 'toy']) {
      for (const geom of ['cascade', 'fan']) {
        for (const fam of FAMS) {
          const opts = Object.assign({ pack }, extra);
          const lay = houseUnion(fam, geom, opts);
          const m = measureMargins(lay);
          if (!m) continue;
          runs++;
          const want = {
            tree:  (extra.marginTree  != null) ? extra.marginTree  : 16,
            port:  (extra.marginPort  != null) ? extra.marginPort  : 12,
            sub:   (extra.marginSub   != null) ? extra.marginSub   : 3,
            glyph: (extra.marginGlyph != null) ? extra.marginGlyph : 3,
          };
          // A DECLARED shortfall is subtracted from what we demand —
          // the layout said so, in world units, and the report says
          // so too. An UNDECLARED one is a failure.
          const need = {
            tree: want.tree,
            port: want.port - m.squeezePort,
            sub: want.sub,
            glyph: want.glyph - m.squeezeGlyph,
          };
          const tag = fam + '/' + geom + '/' + pack + ' [' + dialName + ']';
          for (const k of ['tree', 'port', 'sub', 'glyph']) {
            if (m[k] === Infinity) continue;           // no sub-rows on this band
            if (m[k] < worst[k]) { worst[k] = m[k]; worstAt[k] = tag; }
            if (m[k] < need[k] - 0.01) {
              bad++;
              fail(tag + ': ' + k + ' clearance ' + m[k].toFixed(2)
                + ' wu is INSIDE the declared minimum ' + need[k].toFixed(2));
            }
          }
        }
      }
    }
  }
  console.log('    tightest measured, over ' + runs + ' layouts:');
  console.log('      gods → band   ' + worst.tree.toFixed(2) + ' wu  (' + worstAt.tree + ')');
  console.log('      band → ports  ' + worst.port.toFixed(2) + ' wu  (' + worstAt.port + ')');
  console.log('      sub-row gap   ' + (worst.sub === Infinity ? '—' : worst.sub.toFixed(2) + ' wu  (' + worstAt.sub + ')'));
  console.log('      glyph gap     ' + worst.glyph.toFixed(2) + ' wu  (' + worstAt.glyph + ')');
  if (!bad) {
    ok('all four clearances hold in every one of the ' + runs
      + ' layouts (' + FAMS.length + ' families × 2 packs × 2 geometries × '
      + DIALS.length + ' dial sets) — before this wave the same probe measured'
      + ' 4.0 / 9.6 / 1.15 / 2.00 wu');
  } else {
    fail(bad + ' clearance violations across ' + runs + ' layouts');
  }
}

// ── W5-PACK ▸ BOTH DISTRIBUTIONS EXIST, AND BOTH ARE REAL ──────
// A toggle that moves nothing is the defect John has named four
// times. So: the flip must actually move gods, both packs must keep
// every invariant, and where a pack CANNOT differ the gate says so
// in numbers instead of implying a difference that is not there.
console.log('\n── W5-PACK · the two distributions, and what each one moves ──');
{
  const FAMS = ['Greek', 'Norse', 'Vedic', 'Christian', 'Chinese', 'Egyptian',
    'Mesopotamian', 'Celtic', 'Mesoamerican', 'Baltic'];
  let movedFams = 0, minDelta = Infinity;
  const line = [];
  for (const fam of FAMS) {
    const A = houseUnion(fam, 'cascade', { pack: 'bed' });
    const B = houseUnion(fam, 'cascade', { pack: 'toy' });
    const ids = [];
    for (const row of A.house.rows) for (const id of row) ids.push(id);
    let maxd = 0;
    for (const id of ids) {
      const a = A.positions.get(id), b = B.positions.get(id);
      maxd = Math.max(maxd, Math.hypot(a.x - b.x, a.y - b.y));
    }
    if (maxd > 1) movedFams++;
    minDelta = Math.min(minDelta, maxd);
    line.push(fam.slice(0, 4) + ' ' + maxd.toFixed(0));
  }
  if (movedFams === FAMS.length) {
    ok('CASCADE: the pack flip moves every one of the ' + FAMS.length
      + ' families (smallest max displacement ' + minDelta.toFixed(0)
      + ' wu) — ' + line.join(' · '));
  } else {
    fail('CASCADE: the pack flip is a dead dial in ' + (FAMS.length - movedFams) + ' families');
  }
  // FAN — stated, not implied. The two files' fans differ in exactly
  // one place: an EMPTY rank advances the ring radius by half a ring
  // pitch under 'toy' and by nothing under 'bed'. So the honest law
  // has two halves, and both are asserted:
  //   · with no empty rank BETWEEN two populated ones, the two fans
  //     must be byte-identical (a dial that moves something here
  //     would mean the diff above is incomplete);
  //   · with one, they MAY differ — the toy's extra radius is
  //     swallowed whenever the next ring is capacity-bound and sets
  //     its own radius anyway (measured: Vedic under ranks='era',
  //     ranks 1-2 empty, rank 3 holds 52 and dictates the radius) —
  //     and where they do differ, the toy's ring never sits TIGHTER
  //     than the bed's, because half a pitch can only push outward.
  let wrong = 0, canMove = 0, mustMatch = 0, didMove = 0;
  for (const fam of FAMS) {
    for (const ranks of ['lineage', 'era']) {
      const A = houseUnion(fam, 'fan', { pack: 'bed', ranks });
      const B = houseUnion(fam, 'fan', { pack: 'toy', ranks });
      const ids = [];
      for (const row of A.house.rows) for (const id of row) ids.push(id);
      let maxd = 0;
      for (const id of ids) {
        const a = A.positions.get(id), b = B.positions.get(id);
        maxd = Math.max(maxd, Math.hypot(a.x - b.x, a.y - b.y));
      }
      const meta = A.house.rowMeta;
      const effective = meta.some((m, i) => !m.n
        && meta.slice(0, i).some(x => x.n) && meta.slice(i + 1).some(x => x.n));
      if (!effective) {
        mustMatch++;
        if (maxd > 1e-9) { wrong++; fail('FAN ' + fam + '/' + ranks
          + ': the packs differ with no empty rank between two populated ones — the diff is incomplete'); }
      } else {
        canMove++;
        if (maxd > 1) {
          didMove++;
          // Compare the ring stack in UNITS (rad / P), not in world
          // units: the toy's extra half-pitch makes the stack taller
          // in units, which the pitch solve then pays for by
          // SHRINKING P — so the world radius can legitimately come
          // out smaller (Greek under ranks='era': 372.6 → 371.0). The
          // unit stack is the thing the empty-rank rule touches.
          const uA = Math.max(...A.house.rowMeta.map(m => (m.rad || 0) / A.house.pitch));
          const uB = Math.max(...B.house.rowMeta.map(m => (m.rad || 0) / B.house.pitch));
          if (uB < uA - 1e-6) { wrong++; fail('FAN ' + fam + '/' + ranks
            + ': the toy pack pulled the outer ring IN (' + uB.toFixed(2)
            + ' < ' + uA.toFixed(2) + ' units) — half a ring pitch can only push out'); }
        }
      }
    }
  }
  if (!wrong) {
    ok('FAN: byte-identical in all ' + mustMatch + ' cases with no empty rank between two'
      + ' populated ones; of the ' + canMove + ' cases that CAN differ, ' + didMove
      + ' do, and none pulls its ring stack inward — the empty-rank rule is the only fan difference');
  }
  // Both packs keep the invariants that matter: determinism and no
  // two gods on top of each other.
  for (const pack of ['bed', 'toy']) {
    for (const geom of ['cascade', 'fan']) {
      let overlaps = 0, worstGap = Infinity;
      for (const fam of ['Greek', 'Vedic', 'Mesopotamian']) {
        const a = houseUnion(fam, geom, { pack });
        const b = houseUnion(fam, geom, { pack });
        if (snapshot(a) !== snapshot(b)) fail(pack + '/' + geom + '/' + fam + ': NON-DETERMINISTIC');
        const pts = [];
        for (const row of a.house.rows) for (const id of row) {
          const p = a.positions.get(id);
          pts.push({ x: p.x, y: p.y, r: a.radii.get(id) || 0 });
        }
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const g = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) - pts[i].r - pts[j].r;
          if (g < worstGap) worstGap = g;
          if (g < -0.01) overlaps++;
        }
      }
      if (!overlaps) ok(pack + '/' + geom + ': zero god overlaps, deterministic (worst gap '
        + worstGap.toFixed(2) + ' wu)');
      else fail(pack + '/' + geom + ': ' + overlaps + ' god overlaps');
    }
  }
}

// ── W5-DATE ▸ THE RANK DATES SURVIVE BOTH DISTRIBUTIONS ────────
// Since 2026-07-31 (postmortem #2) the VIEW anchors every date on ONE
// column — the WIDEST bed's left edge — so the gutter reads as an
// axis, not a stray per row. rowMeta must still be a TRUE description
// of each row under both packs (the axis derives from max(rm.w/2), so
// a lying rm.w moves the whole axis): the per-row assertions below
// keep that honest, and the stratum line now consumes rm.lineY.
console.log('\n── W5-DATE · the rank gutter follows both distributions ──');
must(/let maxHalfW = 0;[\s\S]{0,900}const es = W2S\(house\.center\.x - maxHalfW, rm\.y\);/,
  'every cascade date right-aligns to ONE axis at the widest bed\'s left edge (postmortem #2)', forgeSrc);
must(/const ly = \(rm\.lineY != null\) \? rm\.lineY : rm\.y;/,
  'the stratum line consumes the layout\'s lineY — computed since wave 5, finally drawn', forgeSrc);
must(/house_stratum:\s+0\.07,/,
  'the stratum dial ships at 0.07 — visible, faint, and 0 turns it off', forgeSrc);
must(/const capOff = \(typeof local\.params\.house_rank_cap_off === 'number'\)/,
  'the rank date\'s stand-off is a dial, not a baked 14px', forgeSrc);
must(/house_rank_cap_off:\s*14,/, 'house_rank_cap_off ships at 14px');
must(/\{ k: 'slider', key: 'house_rank_cap_off' \}/, 'HOUSE row: Date offset', HOUSE_PANEL_SRC);
must(/\{ k: 'radio',\s*key: 'house_pack' \}/, 'HOUSE row: Distribution', HOUSE_PANEL_SRC);
must(/id: 'tree', title: 'The tree — the gods', open: true/,
  'the tree section (where Distribution lives) opens by DEFAULT', HOUSE_PANEL_SRC);
must(/id: 'gaps', title: 'The gaps between them', open: true/,
  'the margins section opens by DEFAULT', HOUSE_PANEL_SRC);
{
  let bad = 0, rows = 0;
  const NODE_BY_ID2 = new Map(NODES.map(n => [n.id, n]));
  for (const pack of ['bed', 'toy']) {
    for (const fam of ['Greek', 'Norse', 'Vedic', 'Egyptian', 'Mesopotamian', 'Chinese']) {
      const lay = houseUnion(fam, 'cascade', { pack });
      const h = lay.house;
      for (let ri = 0; ri < h.rowMeta.length; ri++) {
        const rm = h.rowMeta[ri];
        if (rm.y == null || !h.rows[ri].length) continue;
        rows++;
        // (a) the gutter anchor is the row's real left edge
        let lo = Infinity, dlo = Infinity, dhi = -Infinity;
        for (const id of h.rows[ri]) {
          const p = lay.positions.get(id), r = lay.radii.get(id) || 0;
          lo = Math.min(lo, p.x - r);
          const d = NODE_BY_ID2.get(id) && NODE_BY_ID2.get(id).date_earliest;
          if (typeof d === 'number' && isFinite(d)) { dlo = Math.min(dlo, d); dhi = Math.max(dhi, d); }
        }
        const anchor = h.center.x - rm.w / 2;
        // the anchor is the BED's left edge; every god sits inside it
        // by at most one node radius (the bed's own half-slot)
        if (anchor - lo > 40 || lo - anchor > 1e-6) {
          bad++;
          if (bad < 4) fail(pack + '/' + fam + ' row ' + ri + ': gutter anchor ' + anchor.toFixed(1)
            + ' does not sit on the row\'s left edge ' + lo.toFixed(1));
        }
        // (b) the date printed is the row's own true span
        const want = (dlo > dhi) ? null : dlo;
        if ((rm.dmin == null) !== (want == null) || (want != null && rm.dmin !== want)) {
          bad++;
          if (bad < 4) fail(pack + '/' + fam + ' row ' + ri + ': rowMeta.dmin ' + rm.dmin
            + ' is not the row\'s true earliest date ' + want);
        }
      }
    }
  }
  if (!bad) ok('the gutter anchor and the date span are true for all ' + rows
    + ' rows, in BOTH packings (6 families × 2 packs)');
  else fail(bad + ' rows carry a wrong gutter anchor or a wrong date span');
}

// ════════════════════════════════════════════════════════════════
// W4-SPAN ▸ THE CROWN'S RESERVED WORLD SPAN, GIVEN BACK
// ════════════════════════════════════════════════════════════════
// CASCADE_BIAS pushed the whole cascade 0.10·Rt BELOW the house
// centre so a four-row caption stack had a clear column above the
// first rank. The block is a screen fixture now, so the offset is
// SOLVED per family instead. These floors are the MEASURED post-fix
// median god radii minus a hair — a future edit that shrinks the
// gods (the exact regression the symmetric-span variant caused on
// Mesopotamian, −10%) fails here instead of being noticed by eye.
console.log('\n── W4-SPAN · the cascade re-centres, and no family loses size ──');
must(/const solveVOffset = \(P0\) => \{/,
  '(layout) the cascade SOLVES its vertical offset instead of a hard-coded caption bias', treeSrc);
must(/let s = 1;\s*\/\/ clamped: "already fits" is the ceiling/,
  '(layout) the fit objective is clamped at 1, so a house that needs no shift stays CENTRED', treeSrc);
if (!/const\s+CASCADE_BIAS\s*=/.test(treeSrc)) ok('(layout) CASCADE_BIAS is gone — nothing reserves world space for the caption');
else fail('(layout) CASCADE_BIAS still exists: the tree is still being pushed aside by a title');
{
  // Measured 2026-07-31 wave 4 on the real vault, floored at 99%.
  //
  // WAVE 5 KEPT THEM. The four band clearances became CONSTRUCTED
  // this wave (the band solves first, the tree's measured extent is
  // scaled into the lane the band leaves it), and the reason that
  // cost nothing is that the lane binds on the EXTENT, not on the
  // zone: Greek's cascade reaches 382 wu of its 464 wu zone,
  // Christian's 362 — nine of ten families never touch their lane and
  // pay nothing for the guarantee. Measured delta across all ten:
  // −0.1% median god radius, worst case Mesopotamian −0.9% (the one
  // cascade that did reach its lane, in the fan geometry).
  const FLOOR = {
    Greek: 19.0, Norse: 20.8, Vedic: 16.8, Christian: 28.0, Chinese: 22.8,
    // Celtic re-measured 24.0 → 23.0 on 2026-07-31: the aspect
    // reachability guard restored the REAL arianrhod→lleu lineage arc
    // (the old floor was measured on a tree the cycle breaker had
    // silently shallowed by deleting it). One true generation deeper
    // = 3.75% smaller gods. Honest depth beats a flattering number;
    // the god-size dial exists for taste.
    Egyptian: 16.6, Mesopotamian: 16.4, Celtic: 23.0, Mesoamerican: 20.0, Baltic: 32.6,
  };
  let low = 0;
  const line = [];
  for (const fam of Object.keys(FLOOR)) {
    const lay = houseUnion(fam, 'cascade');
    const ids = [];
    for (const row of lay.house.rows) for (const id of row) ids.push(id);
    const rs = ids.map(id => lay.radii.get(id) || 0).sort((a, b) => a - b);
    const med = rs.length ? rs[Math.floor(rs.length / 2)] : 0;
    line.push(fam + ' ' + med.toFixed(1));
    if (med < FLOOR[fam]) { low++; fail(fam + ': median god radius ' + med.toFixed(1)
      + ' wu is UNDER the wave-4 floor ' + FLOOR[fam]); }
  }
  if (!low) ok('median god radius holds or beats the wave-4 floor in all ' + line.length
    + ' families — ' + line.join(' · '));
  // And the tree really is CENTRED now (the visible half of his
  // complaint): the cascade's own vertical mid-point sits near the
  // house centre unless the circle fit genuinely needs otherwise.
  // EXPECT_CENTRED are the families whose circle fit does NOT bind, so
  // the solver's tie-break lands them on the house centre. Egyptian
  // and Mesopotamian are printed but excluded on purpose: their widest
  // bed genuinely wants to sit off-centre, and that offset is what
  // buys Egyptian its +5.8%. A caption is not what moves them.
  const EXPECT_CENTRED = new Set(['Greek', 'Norse', 'Vedic', 'Christian', 'Chinese',
    'Celtic', 'Mesoamerican', 'Baltic']);
  let centred = 0, tot = 0;
  const mids = [];
  for (const fam of [...EXPECT_CENTRED, 'Egyptian', 'Mesopotamian']) {
    const lay = houseUnion(fam, 'cascade');
    let yTop = Infinity, yBot = -Infinity;
    for (const row of lay.house.rows) for (const id of row) {
      const p = lay.positions.get(id), r = lay.radii.get(id) || 0;
      yTop = Math.min(yTop, p.y - r); yBot = Math.max(yBot, p.y + r);
    }
    const mid = (yTop + yBot) / 2;
    mids.push(fam + ' ' + (mid >= 0 ? '+' : '') + mid.toFixed(0));
    if (!EXPECT_CENTRED.has(fam)) continue;
    tot++;
    if (Math.abs(mid) <= 0.04 * lay.house.radius) centred++;
  }
  console.log('    cascade vertical mid-point (wu off the house centre): ' + mids.join(' · '));
  if (centred === tot) ok(tot + ' of ' + tot + ' fit-unbound cascades now sit ON the house centre'
    + ' (every one was +43…+63 wu below it under CASCADE_BIAS)');
  else fail((tot - centred) + ' of ' + tot + ' cascades are still shoved off centre');
  // Determinism of the solver — the whole layout is pinned on this.
  const a = houseUnion('Vedic', 'cascade'), b = houseUnion('Vedic', 'cascade');
  if (snapshot(a) === snapshot(b)) ok('the solved offset is deterministic (Vedic, two runs byte-equal)');
  else fail('the vertical-offset solver is NON-DETERMINISTIC');
}

console.log('');
if (failures) { console.error(failures + ' FAILURE(S)'); process.exit(1); }
console.log('ALL CHECKS PASS');
