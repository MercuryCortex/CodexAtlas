#!/usr/bin/env node
// ============================================================
// CHECK — THE HOUSE's wires: the mesh, the bones, the widths
// ============================================================
// The acceptance harness for AUDIT/2026-07-31-house-audit-and-
// build-order.md steps 2 + 3 (the arcs defect). Runs headless in
// node against the REAL data.js — no server, no browser, no GPU.
//
// It mirrors, and CROSS-CHECKS ITSELF AGAINST, three shipped things:
//   1. src/js/views/forge.js buildHouse()  — the external class + the
//      post-layout bone resolution (boneIdx REDO)
//   2. src/js/views/forge.js bakeEdgePosB() — the 6-float house lane
//   3. src/js/engine/renderer/webgpu.js EDGE_SHADER — the state-ridden
//      width band and the perpendicular bone bow
// Each mirror is guarded by a regex assertion against the real source,
// so if someone edits the shader and not this file the run goes RED
// instead of quietly measuring a fiction.
//
//   node scripts/check-house-wires.mjs
// ============================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
globalThis.window = globalThis;

const dataSrc = readFileSync(join(root, 'data.js'), 'utf8');
new Function(dataSrc)();
const NODES = globalThis.VAULT_DATA.nodes, EDGES = globalThis.VAULT_DATA.edges;
new Function(readFileSync(join(root, 'src/js/engine/layout/familytree.js'), 'utf8'))();
const layoutFn = globalThis.AtlasEngineLayout.familyTreeLayout;
new Function(readFileSync(join(root, 'src/js/edge-buckets.js'), 'utf8'))();
const EDGE_BUCKET = globalThis.EDGE_BUCKET;

const forgeSrc = readFileSync(join(root, 'src/js/views/forge.js'), 'utf8');
const gpuSrc   = readFileSync(join(root, 'src/js/engine/renderer/webgpu.js'), 'utf8');
const treeSrc  = readFileSync(join(root, 'src/js/engine/layout/familytree.js'), 'utf8');

let failures = 0;
const fail = (m) => { failures++; console.error('  ✗ ' + m); };
const ok   = (m) => console.log('  ✓ ' + m);
const must = (re, what, src) => {
  if (re.test(src)) ok('source still says: ' + what);
  else fail('SOURCE DRIFT — this harness no longer mirrors the code: ' + what);
};

// ── 0. the mirrors are still true ───────────────────────────
console.log('\n── source mirrors ──');
must(/let w_lo\s*=\s*max\(mix\(v\.wire_min_screen_px,\s*hot_px,\s*st_w\),\s*bone_px\);/,
  'width floor rides the state between wire_min and wire_hot', gpuSrc);
must(/let w_hi\s*=\s*max\(v\.wire_max_screen_px,\s*w_lo\);/,
  'the upper bound can never invert the clamp', gpuSrc);
must(/let hot_px\s*=\s*max\(v\.wire_min_screen_px,\s*v\.glyph_params\.z\);/,
  'hot width comes from glyph_params.z', gpuSrc);
must(/let bone_px\s*=\s*v\.layout_mix\.z\s*\*\s*is_prim\s*\*\s*hx;/,
  'the bone width floor is house-gated and primary-only', gpuSrc);
must(/let bone_p1\s*=\s*mid \+ perp_u \* \(v\.glyph_params\.w \* 2\.0 \* clen \* sign\(inst_house\.x\)\);/,
  'the bone bows perpendicular to its own chord', gpuSrc);
must(/let p1\s*=\s*mix\(origin_p1, bone_p1, is_bone \* hx\);/,
  'the bow multiplies away at layout_mix 0 (honest zeros)', gpuSrc);
must(/step\(v\.layout_mix\.w, in\.ext_class\) \* v\.layout_mix\.x/,
  'rest-wires hides by baked external class × the layout mix', gpuSrc);
must(/let parked\s*=\s*step\(2\.5, in\.ext_class\) \* v\.layout_mix\.x;/,
  'class 3 (parked, no terminus) hides at every chip position and is not exempted by hover', gpuSrc);
must(/let ext\s*=\s*max\(parked,/, 'the parked hide is OR-ed onto the chip hide', gpuSrc);
must(/if \(parkedIds\.has\(e\.source\) \|\| parkedIds\.has\(e\.target\)\) extern\[ei\] = 3;/,
  'buildHouse bakes class 3 for wires touching the rail overflow', forgeSrc);
must(/parkedIds, shelves: \[\] \};/, '(layout) placeRail returns the ids it parked', treeSrc);
must(/arrayStride:\s*24,\s*stepMode:\s*'instance'/, 'edgePosB stride is 24 (6 floats)', gpuSrc);
must(/frame\.edgePosB,\s*0,\s*edgeCount \* 6/, 'edgePosB uploads 6 floats per instance', gpuSrc);
must(/const out = new Float32Array\(E \* 6\);/, 'bakeEdgePosB emits 6 floats per instance', forgeSrc);
must(/if \(mode === 'off'\)\s+return 1;/, "rest-wires 'off' hides class >= 1", forgeSrc);
must(/if \(mode === 'stubs'\) return 2;/, "rest-wires 'stubs' hides class >= 2", forgeSrc);
must(/house_rest_wires:\s*'off',/, "the shipped rest-wires default is 'off'", forgeSrc);
must(/for \(const \[ei, w\] of h\.bones\.arc\)/, 'the bones lift iterates the LAYOUT arcs', forgeSrc);
must(/applyEdgeHiddenFilters\(newTargets\);[\s\S]{0,400}applyHouseBonesOverride\(newTargets\);[\s\S]*applyEdgeHiddenFilters\(newTargets\);[\s\S]{0,500}applyHouseBonesOverride\(newTargets\);/,
  'the tier/political filter runs at BOTH edge-target sites, before the bones', forgeSrc);

const P = (() => {                                   // shipped defaults
  const grab = (k) => {
    const m = forgeSrc.match(new RegExp('^\\s*' + k + ':\\s*([-\\d.]+),', 'm'));
    if (!m) { fail('PARAM_DEFAULTS is missing ' + k); return 0; }
    return parseFloat(m[1]);
  };
  return {
    wire_min: grab('wire_min_screen_px'), wire_max: grab('wire_max_screen_px'),
    wire_hot: grab('wire_hot_screen_px'), bones: grab('house_bones'),
    secondary: grab('house_bone_secondary'), sag: grab('house_arc_sag'),
    bone_px: grab('house_bone_px'), spread: grab('house_spread'),
  };
})();
console.log('  shipped: wire ' + P.wire_min + '/' + P.wire_max + ' hot ' + P.wire_hot
  + ' · bones ' + P.bones + ' 2nd ' + P.secondary + ' · sag ' + P.sag + ' bone ' + P.bone_px + 'px');

// ── 1. THE WIDTH CHANNEL IS ALIVE ───────────────────────────
// The house camera the audit measured: camScale 0.672, dpr 2, and
// world_to_fb = cam.scale × dpr exactly (webgpu.js:756 reduces to it).
console.log('\n── 1. the width channel at the house camera ──');
const CAM = 0.672, DPR = 2, W2FB = CAM * DPR;
const IDLE_W = 0.30, HOT_W = 0.51;                    // kinship bucket idle/hot × ...
const STROKE = 2.2;                                   // ... the engine's world-width factor
const bandOld = (world) => Math.min(Math.max(world * STROKE * W2FB, P.wire_min * DPR), P.wire_max * DPR);
const bandNew = (world, st, primaryBone, hx) => {
  const raw   = world * STROKE * W2FB;
  const hotPx = Math.max(P.wire_min * DPR, P.wire_hot * DPR);
  const bone  = P.bone_px * DPR * (primaryBone ? 1 : 0) * hx;
  const lo    = Math.max(P.wire_min * DPR + (hotPx - P.wire_min * DPR) * st, bone);
  const hi    = Math.max(P.wire_max * DPR, lo);
  return Math.min(Math.max(raw, lo), hi);
};
const mixw = (t) => IDLE_W + (HOT_W - IDLE_W) * t;
const before = [bandOld(IDLE_W), bandOld(mixw(P.bones)), bandOld(HOT_W)];
const after  = [bandNew(IDLE_W, 0, false, 1), bandNew(mixw(P.bones), P.bones, true, 1), bandNew(HOT_W, 1, false, 1)];
const f3 = (a) => '[' + a.map(x => x.toFixed(3)).join(', ') + ']';
console.log('  world widths      idle ' + IDLE_W + ' / bone ' + mixw(P.bones).toFixed(4) + ' / hot ' + HOT_W);
console.log('  BEFORE (FB px)    ' + f3(before));
console.log('  AFTER  (FB px)    ' + f3(after));
if (before[0] === before[1] && before[1] === before[2])
  ok('before: all three collapsed to ' + before[0] + ' FB px — the channel WAS dead');
else fail('before: expected all three equal (the bug) — got ' + f3(before));
if (after[0] !== after[1] && after[1] !== after[2] && after[0] !== after[2])
  ok('after: three DIFFERENT widths (' + after.map(x => (x / DPR).toFixed(2) + ' CSS px').join(' · ') + ')');
else fail('after: widths still collapse — ' + f3(after));
if (after[0] < after[1] && after[1] > after[2] * 0.99)
  ok('the primary bone is the widest stroke in the house');
else if (after[0] < after[1]) ok('bone is wider than idle (bone ' + after[1].toFixed(2) + ' vs hot ' + after[2].toFixed(2) + ')');
else fail('the bone is not wider than an idle wire');

// ── 2. HONEST ZEROS on the width band ───────────────────────
console.log('\n── 2. honest zeros ──');
// The four named guards. With no isolate every dial position below
// must produce a byte-identical frame — asserted here as source, and
// reasoned in AUDIT/2026-07-31 step 2 acceptance (5).
must(/if \(!local\._isolateFamily \|\| !h \|\| !h\.bones\) return;/,
  'GUARD 1 — the bones lift touches no edge target without an isolate', forgeSrc);
must(/const lm = \(frame\.nodePosB && \(frame\.edgePosB \|\| edgeCount === 0\)\)\s*\?[\s\S]{0,60}: 0;/,
  'GUARD 2 — layout_mix is forced to 0 unless BOTH position-B arrays exist', gpuSrc);
must(/if \(bn\) \{\s*\n\s*const b = bn\.arc\.get\(ei\);/,
  'GUARD 3 — the house lane is only written when a house map exists', forgeSrc);
must(/edgePosB:\s*local\._house \? local\._house\.edgePosB : null,/,
  'GUARD 4 — no house ⇒ edgePosB is null ⇒ the zero-filled VBO stands', forgeSrc);
// And the rest-wires chip is provably target-free: houseRestMinClass()
// is read ONLY into the frame uniform, never into an edge target.
{
  const uses = forgeSrc.match(/houseRestMinClass\(\)/g) || [];
  const inTargets = /houseRestMinClass\(\)[^\n]*targets/.test(forgeSrc);
  if (uses.length >= 2 && !inTargets)
    ok('GUARD 5 — the rest-wires chip writes a uniform only; it never touches an edge target,'
      + ' so all three chip positions give byte-identical target arrays');
  else fail('the rest-wires chip has leaked into the edge-target path');
}
{
  let worst = 0;
  const bandNewOff = (world, st) => {                 // wire_hot 0, no house lane
    const raw = world * STROKE * W2FB;
    const hotPx = Math.max(P.wire_min * DPR, 0);
    const lo = Math.max(P.wire_min * DPR + (hotPx - P.wire_min * DPR) * st, 0);
    const hi = Math.max(P.wire_max * DPR, lo);
    return Math.min(Math.max(raw, lo), hi);
  };
  for (let s = 0; s <= 1.0001; s += 0.05) {
    for (const w of [0.02, 0.1, 0.22, 0.3, 0.34, 0.46, 0.51, 0.8, 3.0]) {
      worst = Math.max(worst, Math.abs(bandNewOff(w, s) - bandOld(w)));
    }
  }
  if (worst === 0) ok('wire_hot_screen_px = 0 + zero house lane ⇒ the new clamp is EXACTLY the old clamp (189 samples)');
  else fail('honest zeros broken on the width band, worst delta ' + worst);
}

// ── 3. THE MESH CENSUS + THE BONE POPULATION ────────────────
// Mirrors buildHouse: deities mode (mode.js "simple type match"),
// external class per raw edge, bones resolved from lay.house.arcs.
const ASPECT_RE = /(avatara-of|manifestation-of|aspect-of|emanation-of|constituent-of)$/;
const nodes = NODES.filter(n => n && n.type === 'deity');
const ids   = new Set(nodes.map(n => n.id));
const edges = EDGES.filter(e => ids.has(e.source) && ids.has(e.target));
const famOf = new Map(nodes.map(n => [n.id, n.family || 'Other']));
const DEG = (() => { const d = new Map();
  for (const e of edges) { d.set(e.source, (d.get(e.source) || 0) + 1); d.set(e.target, (d.get(e.target) || 0) + 1); }
  return d; })();
const BEARINGS = (() => { const b = {}; let i = 0;
  for (const f of new Set(famOf.values())) b[f] = (i++) * 0.21; return b; })();
const KEY = (a, b) => (a < b) ? (a + ' ' + b) : (b + ' ' + a);

function house(fam, geometry) {
  const memberIds = new Set(nodes.filter(n => (n.family || 'Other') === fam).map(n => n.id));
  const arcs = [], laterals = [], aspects = [], portWeights = {};
  const extern = new Uint8Array(edges.length);
  const arcPairEi = new Map(), latPairEi = new Map();
  const push = (m, k, ei) => { const l = m.get(k); if (l) l.push(ei); else m.set(k, [ei]); };
  for (let ei = 0; ei < edges.length; ei++) {
    const e = edges[ei];
    const sIn = memberIds.has(e.source), tIn = memberIds.has(e.target);
    if (sIn !== tIn) {
      extern[ei] = 1;
      const g = famOf.get(sIn ? e.target : e.source);
      portWeights[g] = (portWeights[g] || 0) + 1;
      continue;
    }
    if (!sIn) { extern[ei] = 2; continue; }
    const k = KEY(e.source, e.target);
    if (e.type === 'parent-of')      { arcs.push([e.source, e.target]); push(arcPairEi, k, ei); }
    else if (e.type === 'child-of')  { arcs.push([e.target, e.source]); push(arcPairEi, k, ei); }
    else if (e.type === 'consort')   { laterals.push([e.source, e.target]); push(latPairEi, k, ei); }
    else if (ASPECT_RE.test(e.type || '')) { aspects.push([e.source, e.target]); push(latPairEi, k, ei); }
  }
  const lay = layoutFn(nodes, {
    groupBy: n => n.family || 'Other', groupKey: fam,
    arcs, laterals, aspects, degree: DEG, bearings: BEARINGS, portWeights,
    center: { x: 0, y: 0 }, radius: 540, geometry,
    spread: P.spread, ranks: 'lineage', orphans: 'domain',
  });
  const H = lay.house;
  const bones = { arc: new Map(), lat: new Set(), extern, arcPairs: 0, latPairs: 0, primary: 0 };
  for (const a of (H.arcs || [])) {
    const l = arcPairEi.get(KEY(a.parent, a.child));
    if (!l) continue;
    bones.arcPairs++;
    for (const ei of l) {
      bones.arc.set(ei, ((edges[ei].source === a.parent) ? 1 : -1) * (a.primary ? 1.0 : 0.5));
      if (a.primary) bones.primary++;
    }
  }
  for (const c of (H.consorts || [])) {
    const l = latPairEi.get(KEY(c.a, c.b)); if (!l) continue;
    bones.latPairs++; for (const ei of l) bones.lat.add(ei);
  }
  for (const a of (H.aspectArcs || [])) {
    const l = latPairEi.get(KEY(a.hub, a.aspect)); if (!l) continue;
    bones.latPairs++; for (const ei of l) bones.lat.add(ei);
  }
  return { fam, geometry, lay, H, memberIds, bones, extern };
}

console.log('\n── 3. the mesh census (deities mode: ' + nodes.length + ' nodes · ' + edges.length + ' edges) ──');
for (const fam of ['Greek', 'Norse']) {
  const h = house(fam, 'cascade');
  const cls = [0, 0, 0];
  for (let i = 0; i < h.extern.length; i++) cls[h.extern[i]]++;
  let degen = 0, degenExternal = 0;
  for (let ei = 0; ei < edges.length; ei++) {
    const sp = h.lay.positions.get(edges[ei].source), tp = h.lay.positions.get(edges[ei].target);
    if (!sp || !tp) continue;
    if (Math.hypot(tp.x - sp.x, tp.y - sp.y) <= 1e-4) { degen++; if (h.extern[ei] >= 1) degenExternal++; }
  }
  console.log('\n  ' + fam + ': ' + h.memberIds.size + ' members · crown "'
    + h.H.stats.kinArcs + ' LINEAGE ARCS"');
  console.log('    member↔member kinship wires : ' + (h.bones.arc.size + h.bones.lat.size)
    + '  (' + h.bones.arc.size + ' lineage + ' + h.bones.lat.size + ' lateral)');
  console.log('    member↔port  wires          : ' + cls[1]);
  console.log('    port↔port    wires          : ' + cls[2]);
  console.log('    same-point degenerate wires : ' + degen);
  if (h.bones.arcPairs === h.H.stats.kinArcs)
    ok('every one of the crown\'s ' + h.H.stats.kinArcs + ' arcs resolves to a real vault wire'
      + ' (lifted ' + h.bones.arc.size + ' rows — ' + (h.bones.arc.size - h.bones.arcPairs)
      + ' pairs the vault states BOTH ways)');
  else fail(fam + ': crown says ' + h.H.stats.kinArcs + ' arcs, only ' + h.bones.arcPairs + ' have a wire');
  if (h.bones.primary > 0 && h.bones.primary < h.bones.arc.size)
    ok('primary/secondary split is available: ' + h.bones.primary + ' primary · '
      + (h.bones.arc.size - h.bones.primary) + ' secondary');
  else fail(fam + ': no usable primary/secondary split (' + h.bones.primary + '/' + h.bones.arc.size + ')');
  if (degen === degenExternal) ok('all ' + degen + ' zero-length wires are external (class >= 1)');
  else fail((degen - degenExternal) + ' zero-length wires are member↔member — the hide cannot reach them');
  // the shipped default, 'off' ⇒ hide class >= 1
  for (const [mode, minC] of [['full', 3], ['stubs', 2], ['off', 1]]) {
    let drawnPort = 0, drawnStub = 0, drawnDegen = 0, drawnBones = 0;
    for (let ei = 0; ei < edges.length; ei++) {
      if (h.extern[ei] >= minC) continue;             // hidden by the chip
      if (h.extern[ei] === 2) drawnPort++;
      if (h.extern[ei] === 1) drawnStub++;
      if (h.bones.arc.has(ei) || h.bones.lat.has(ei)) drawnBones++;
      const sp = h.lay.positions.get(edges[ei].source), tp = h.lay.positions.get(edges[ei].target);
      if (sp && tp && Math.hypot(tp.x - sp.x, tp.y - sp.y) <= 1e-4) drawnDegen++;
    }
    console.log('    rest-wires=' + mode.padEnd(5) + ' → port↔port ' + String(drawnPort).padStart(4)
      + ' · stubs ' + String(drawnStub).padStart(3) + ' · degenerate ' + String(drawnDegen).padStart(4)
      + ' · bones ' + drawnBones);
    if (mode === 'off' && (drawnPort || drawnStub || drawnDegen))
      fail("rest-wires='off' still draws externals");
    if (mode === 'stubs' && (drawnPort || drawnDegen))
      fail("rest-wires='stubs' still draws the port↔port mesh");
    if (mode === 'off' && drawnBones !== h.bones.arc.size + h.bones.lat.size)
      fail("rest-wires='off' ate a bone");
  }
}

// ── 4. THE BONES ARE ONE HUE ────────────────────────────────
console.log('\n── 4. one hue for the skeleton ──');
for (const fam of ['Greek', 'Norse', 'Vedic', 'Egyptian', 'Shinto', 'Celtic']) {
  const h = house(fam, 'cascade');
  const hues = new Map(), lateralHues = new Map();
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const ei of h.bones.arc.keys()) bump(hues, EDGE_BUCKET[edges[ei].type] || 'association');
  for (const ei of h.bones.lat)        bump(lateralHues, EDGE_BUCKET[edges[ei].type] || 'association');
  const desc = (m) => [...m].map(([k, v]) => k + ':' + v).join(' · ') || '—';
  if (hues.size <= 1) ok(fam.padEnd(10) + ' lineage bones: ' + desc(hues));
  else fail(fam + ' lineage bones paint in ' + hues.size + ' hues: ' + desc(hues));
  console.log('    ' + ' '.repeat(9) + ' laterals    : ' + desc(lateralHues));
}

// ── 5. THE BONE ACTUALLY BOWS ───────────────────────────────
// Max deviation of a quadratic Bézier from its chord is |p1-mid|/2,
// and the shader sets p1 = mid + perp_unit × (sag × 2 × |chord|), so
// bow/chord == sag exactly — at EVERY orientation, which is the whole
// point (the old origin-pull gave 0 on a radial pair).
console.log('\n── 5. the bow ──');
{
  const h = house('Greek', 'cascade');
  const ratios = [];
  const oldRatios = [];
  // the SHIPPED kinship curve strength (PARAM_DEFAULTS curve_kinship →
  // packEdges inst_extra.y), read from source so it cannot drift here.
  const CURVE = (() => {
    const m = forgeSrc.match(/^\s*curve_kinship:\s*([\d.]+),/m);
    if (!m) { fail('PARAM_DEFAULTS is missing curve_kinship'); return 0; }
    return parseFloat(m[1]);
  })();
  for (const ei of h.bones.arc.keys()) {
    const e = edges[ei];
    const p0 = h.lay.positions.get(e.source), p2 = h.lay.positions.get(e.target);
    if (!p0 || !p2) continue;
    const clen = Math.hypot(p2.x - p0.x, p2.y - p0.y);
    if (clen < 1e-6) continue;
    ratios.push(P.sag);                                   // exact, by construction
    // the OLD control point: p1 = mid + (origin - mid) * curve
    const mx = (p0.x + p2.x) / 2, my = (p0.y + p2.y) / 2;
    const p1x = mx + (0 - mx) * CURVE, p1y = my + (0 - my) * CURVE;
    // deviation of p1 from the chord line, halved (Bézier midpoint)
    const ux = (p2.x - p0.x) / clen, uy = (p2.y - p0.y) / clen;
    const vx = p1x - p0.x, vy = p1y - p0.y;
    oldRatios.push(Math.abs(vx * -uy + vy * ux) / 2 / clen);
  }
  oldRatios.sort((a, b) => a - b);
  const med = oldRatios[Math.floor(oldRatios.length / 2)] || 0;
  console.log('  Greek bones measured: ' + ratios.length
    + ' · OLD bow/chord median ' + med.toFixed(3)
    + ' · NEW bow/chord ' + P.sag.toFixed(3) + ' (orientation-independent)');
  if (P.sag >= 0.15) ok('shipped sag clears the ≥0.15 bow/chord acceptance bar');
  else fail('shipped house_arc_sag ' + P.sag + ' bows less than the 0.15 bar');
  if (med < 0.15) ok('the old origin-pull did NOT (median ' + med.toFixed(3) + ')');
}

// ── 6. THE UNION WORLD — WHERE THE STARBURST LIVED ──────────
// Sections 1-5 build their world from `NODES.filter(type === 'deity')`
// — the PRE-RAILS node set. So the class-census above is measured over
// exactly the configuration THE RAILS replaced, and it could not see
// the wave-1 defect: past the 150-slot display cap the rail's
// remainder is parked ON THE CROWN, both endpoints of its wires are
// house members, so those wires were class 0 — the one class no chip
// threshold can ever reach — and ~180-195 of them converged on the
// family name as a starburst with no node under it.
console.log('\n── 6. the union world: the parked remainder has no wire ──');
function houseUnionW(fam, modeType) {
  const inModeArr = NODES.filter(n => n && n.type === modeType);
  const inMode = new Set(inModeArr.map(n => n.id));
  const guests = NODES
    .filter(n => n && n.id && !inMode.has(n.id) && (n.family || 'Other') === fam)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  const uNodes = inModeArr.concat(guests);
  const uIds = new Set(uNodes.map(n => n.id));
  const guestIds = new Set(guests.map(n => n.id));
  const memberIds = new Set(uNodes.filter(n => (n.family || 'Other') === fam).map(n => n.id));
  const uEdges = EDGES.filter(e => {
    if (!uIds.has(e.source) || !uIds.has(e.target)) return false;
    if (!guestIds.has(e.source) && !guestIds.has(e.target)) return true;
    return memberIds.has(e.source) && memberIds.has(e.target);
  });
  const uFam = new Map(uNodes.map(n => [n.id, n.family || 'Other']));
  const deg = new Map();
  for (const e of uEdges) { deg.set(e.source, (deg.get(e.source) || 0) + 1); deg.set(e.target, (deg.get(e.target) || 0) + 1); }
  const arcs = [], laterals = [], aspects = [], portWeights = {};
  const extern = new Uint8Array(uEdges.length);
  for (let ei = 0; ei < uEdges.length; ei++) {
    const e = uEdges[ei];
    const sIn = memberIds.has(e.source), tIn = memberIds.has(e.target);
    if (sIn !== tIn) {
      extern[ei] = 1;
      const g = uFam.get(sIn ? e.target : e.source);
      portWeights[g] = (portWeights[g] || 0) + 1;
      continue;
    }
    if (!sIn) { extern[ei] = 2; continue; }
    if (e.type === 'parent-of') arcs.push([e.source, e.target]);
    else if (e.type === 'child-of') arcs.push([e.target, e.source]);
    else if (e.type === 'consort') laterals.push([e.source, e.target]);
    else if (ASPECT_RE.test(e.type || '')) aspects.push([e.source, e.target]);
  }
  const bearings = {}; let i = 0;
  for (const f of new Set(uFam.values())) bearings[f] = (i++) * 0.21;
  const lay = layoutFn(uNodes, {
    groupBy: n => n.family || 'Other', groupKey: fam,
    arcs, laterals, aspects, degree: deg, bearings, portWeights,
    center: { x: 0, y: 0 }, radius: 540, geometry: 'cascade',
    spread: P.spread, ranks: 'lineage', orphans: 'domain',
  });
  // buildHouse's own post-layout pass: class 3 for anything touching a
  // parked id, written LAST so it wins over 0/1/2.
  const parkedIds = new Set();
  for (const rl of [lay.house.rails.left, lay.house.rails.right]) {
    if (rl && rl.parkedIds) for (const id of rl.parkedIds) parkedIds.add(id);
  }
  if (parkedIds.size) {
    for (let ei = 0; ei < uEdges.length; ei++) {
      const e = uEdges[ei];
      if (parkedIds.has(e.source) || parkedIds.has(e.target)) extern[ei] = 3;
    }
  }
  return { lay, uEdges, extern, parkedIds, memberIds };
}
for (const [fam, modeType] of [['Christian', 'deity'], ['Other', 'deity'],
                               ['Christian', 'person'], ['Other', 'person'], ['Greek', 'deity']]) {
  const u = houseUnionW(fam, modeType);
  const crown = u.lay.house.crown;
  const cls = [0, 0, 0, 0];
  for (let i = 0; i < u.extern.length; i++) cls[u.extern[i]]++;
  // every wire that LANDS ON THE CROWN with no node there
  let onCrown = 0, onCrownHidden = 0;
  for (let ei = 0; ei < u.uEdges.length; ei++) {
    const e = u.uEdges[ei];
    const sp = u.lay.positions.get(e.source), tp = u.lay.positions.get(e.target);
    if (!sp || !tp) continue;
    const sOn = (sp.x === crown.x && sp.y === crown.y);
    const tOn = (tp.x === crown.x && tp.y === crown.y);
    if (!sOn && !tOn) continue;
    onCrown++;
    if (u.extern[ei] >= 3) onCrownHidden++;    // the unconditional parked hide
  }
  console.log('  ' + fam + '/' + modeType + ': ' + u.parkedIds.size + ' parked · classes '
    + '{0:' + cls[0] + ' 1:' + cls[1] + ' 2:' + cls[2] + ' 3:' + cls[3] + '}'
    + ' · wires landing on the crown ' + onCrown);
  if (!u.parkedIds.size) { ok(fam + '/' + modeType + ': nothing overflows the cap — no crown wires possible'); continue; }
  if (onCrown === onCrownHidden) {
    ok(fam + '/' + modeType + ': all ' + onCrown + ' crown-landing wires are class 3 — hidden at rest-wires full/stubs/off alike');
  } else {
    fail(fam + '/' + modeType + ': ' + (onCrown - onCrownHidden)
      + ' wires terminate on the family name and no chip position can hide them');
  }
  // and the chip must still be able to reach classes 1 and 2
  for (const [mode, minC] of [['full', 3], ['stubs', 2], ['off', 1]]) {
    let drawn = 0;
    for (let ei = 0; ei < u.extern.length; ei++) {
      if (u.extern[ei] >= 3) continue;             // parked: hidden unconditionally
      if (u.extern[ei] >= minC) continue;          // hidden by the chip
      const e = u.uEdges[ei];
      const sp = u.lay.positions.get(e.source), tp = u.lay.positions.get(e.target);
      if (sp && tp && sp.x === crown.x && sp.y === crown.y) drawn++;
    }
    if (drawn) fail(fam + '/' + modeType + ": rest-wires='" + mode + "' still draws " + drawn + ' crown wires');
  }
}

// ── 7. bakeEdgePosB SIZES ITSELF, NOT THE STALE PACK ────────
// rebakeNodes bakes position-B and only THEN calls rebakeEdges, which
// re-packs m.edgePacked. Sizing the bake from m.edgePacked.instanceCount
// therefore measured the PREVIOUS family's pack on every path that
// grows the edge set while a house stands, and drawFrame then uploaded
// the new, larger edgeCount out of the short array:
// `writeBuffer: Number of bytes to write is too large`.
console.log('\n── 7. the edge-B array is sized by the edges, not by a stale pack ──');
must(/let E = 0;[\s\S]{0,400}if \(wheelPos\.has\(e\.source\) && wheelPos\.has\(e\.target\)\) E\+\+;/,
  'bakeEdgePosB counts renderable edges itself', forgeSrc);
must(/frame\.edgePosB\.length >= edgeCount \* 6/, 'the renderer skips a short edgePosB upload', gpuSrc);
must(/frame\.nodePosB\.length >= nodeCount \* 4/, 'the renderer skips a short nodePosB upload', gpuSrc);
{
  // packEdges' own renderable law, and the count the bake now derives.
  const renderable = (es, pos) => {
    let n = 0;
    for (const e of es) if (pos.has(e.source) && pos.has(e.target)) n++;
    return n;
  };
  const deities = NODES.filter(n => n && n.type === 'deity');
  const dIds = new Set(deities.map(n => n.id));
  const basePos = new Map(deities.map(n => [n.id, { x: 0, y: 0 }]));
  const baseEdges = EDGES.filter(e => dIds.has(e.source) && dIds.has(e.target));
  const base = renderable(baseEdges, basePos);
  const counts = {};
  for (const fam of ['Norse', 'Greek', 'Vedic', 'Christian', 'Other']) {
    const guests = NODES.filter(n => n && n.id && !dIds.has(n.id) && (n.family || 'Other') === fam);
    const gIds = new Set(guests.map(n => n.id));
    const memberIds = new Set(deities.concat(guests)
      .filter(n => (n.family || 'Other') === fam).map(n => n.id));
    const pos = new Map(basePos);
    for (const n of guests) pos.set(n.id, { x: 0, y: 0 });
    const extra = EDGES.filter(e => (gIds.has(e.source) || gIds.has(e.target))
      && memberIds.has(e.source) && memberIds.has(e.target));
    counts[fam] = renderable(baseEdges.concat(extra), pos);
  }
  console.log('  renderable wires — wheel ' + base + ' · '
    + Object.entries(counts).map(([f, c]) => f + ' ' + c).join(' · '));
  // The crash window, stated as a number: standing in the smaller
  // house, the OLD sizing baked the smaller family's count while the
  // very next rebakeEdges re-packed to the larger one.
  const bad = [];
  for (const [a, b] of [['Norse', 'Greek'], ['Greek', 'Vedic'], ['Vedic', 'Christian'], ['Christian', 'Other']]) {
    if (counts[b] > counts[a]) bad.push(a + '→' + b + ' (+' + (counts[b] - counts[a]) + ')');
  }
  if (bad.length) {
    ok('travels that used to upload past the end of the array: ' + bad.join(', ')
      + ' — now impossible, the bake counts its own edges');
  } else {
    fail('expected at least one growing travel in the vault — the fixture has drifted');
  }
}

console.log('');
if (failures) { console.error(failures + ' FAILURE(S)'); process.exit(1); }
console.log('ALL HOUSE-WIRE CHECKS PASS');
