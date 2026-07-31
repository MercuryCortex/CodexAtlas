#!/usr/bin/env node
// ============================================================
// CHECK — THE HOUSE's three INTERACTION LAWS (2026-07-31 wave 3)
// ============================================================
// John used the live house and sent three rules about what a click
// or a hover MEANS while it stands. This is their acceptance
// harness: it runs headless in node against the REAL data.js — no
// server, no browser, no GPU.
//
//   LAW 1  "Empty click should only work Outside the circle - not
//           inside the circle."
//   LAW 2  "if we are focus mode, hovering the family should only
//           reveal the lines connected to the deities relevant at
//           the center focus"
//   LAW 3  "we must keep the connections of the node selected so we
//           can carry the transmissions from one mode to the other
//           before the next click will remove the connections."
//
// Two halves, the same pattern the other two house checkers use:
//   §A  SOURCE-PINNED assertions — every load-bearing line of each
//       law, matched against the real src/js/views/forge.js. An edit
//       that undoes a law turns this RED instead of quietly shipping
//       the regression back to John.
//   §B  A READ-ONLY PROBE over the real vault: how many wires light
//       when the Roman port is hovered with Greek isolated, BEFORE
//       this change and AFTER it.
//
//   node scripts/check-house-interaction.mjs
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

const forgeSrc = readFileSync(join(root, 'src/js/views/forge.js'), 'utf8');
const cardSrc  = readFileSync(join(root, 'src/js/forge/hover-card.js'), 'utf8');

let failures = 0;
const fail = (m) => { failures++; console.error('  ✗ ' + m); };
const ok   = (m) => console.log('  ✓ ' + m);
const must = (re, what, src) => {
  if (re.test(src)) ok('source still says: ' + what);
  else fail('SOURCE DRIFT — this harness no longer mirrors the code: ' + what);
};
const mustNot = (re, what, src) => {
  if (!re.test(src)) ok('source still does NOT say: ' + what);
  else fail('SOURCE DRIFT — the law has been undone: ' + what);
};

// ════════════════════════════════════════════════════════════
// §A.1  LAW 1 — an empty click only exits from OUTSIDE the circle
// ════════════════════════════════════════════════════════════
console.log('\n── LAW 1 · empty click only counts outside the circle ──');
must(/if \(local\._isolateFamily && local\._house\s*\n\s*&& !houseExitZoneAt\(cssX, cssY\)\) return 'inside-ignored';/,
  'the empty-click gesture RETURNS without doing anything when the pointer is inside the house circle',
  forgeSrc);
must(/if \(hit == null\) \{\s*\n\s*emptyClickAt\(cssX, cssY\);\s*\n\s*return;\s*\n\s*\}/,
  'the canvas click path routes an empty hit through that ONE function', forgeSrc);
must(/emptyClickAt: \(x, y\) => emptyClickAt\(x, y\),/,
  'the live verification surface drives the same function the pointer drives (no second copy)',
  forgeSrc);
must(/function houseExitZoneAt\(cssX, cssY\) \{/,
  'the boundary test exists as one named helper', forgeSrc);
must(/const world = camera\.screenToWorld\(cssX, cssY, vp\);\s*\n\s*const dx = world\.x - c\.x, dy = world\.y - c\.y;\s*\n\s*const lim = Rh \* frac;\s*\n\s*if \(\(dx \* dx \+ dy \* dy\) > \(lim \* lim\)\) return true;/,
  'the test is a WORLD-space distance from the house centre against Rh × the dial (correct mid-flight)',
  forgeSrc);
must(/if \(!outsideCorner\(0, 0\) && !outsideCorner\(vp\.w, 0\)\s*\n\s*&& !outsideCorner\(0, vp\.h\) && !outsideCorner\(vp\.w, vp\.h\)\) return true;/,
  'THE TRAP DOOR — when the circle covers every pixel there is no "outside" to click, '
  + 'so the gesture falls back rather than locking the reader in', forgeSrc);
must(/const h = local\._house;\s*\n\s*if \(!h \|\| !h\.lay \|\| !h\.lay\.house\) return true;\s*\/\/ no house ⇒ no gate/,
  'HONEST ZERO — with no house standing the gate answers "outside", so the wheel keeps today\'s dismiss gesture',
  forgeSrc);
must(/if \(frac <= 0\) return true;\s*\/\/ dialled off/,
  'house_exit_r = 0 restores the pre-wave-3 gesture exactly', forgeSrc);
must(/^\s*house_exit_r:\s*1\.0,/m,
  'the shipped boundary is 1.0 × Rh — the horizon ports themselves', forgeSrc);
// The old unconditional exit must be gone from the click path.
mustNot(/local\._lastClickT\s*=\s*0;\s*\n\s*toggleLock\(null\);\s*\n\s*return;\s*\n\s*\}/,
  'an unconditional toggleLock(null) straight after the empty hit-test (the pre-wave-3 exit)',
  forgeSrc);
// Escape must still be the keyboard way out, at any pointer position.
must(/exit: \(\) => setIsolateFamily\(null\)/,
  'the isolate still exposes a pointer-free exit (Escape\'s path)', forgeSrc);

// ── LAW 1, EXECUTED ─────────────────────────────────────────
// Source assertions prove the shape; this RUNS the shipped function
// body, lifted verbatim out of forge.js, against a stub camera. A
// sign error or an inverted comparison dies here, not on John's
// screen. (forge.js is one DOM+WebGPU IIFE and cannot be imported;
// this is the real text of the real function, not a re-derivation.)
console.log('\n── LAW 1 · the shipped function, executed ──');
{
  const body = forgeSrc.match(/\n    function houseExitZoneAt\(cssX, cssY\) \{[\s\S]*?\n    \}\n/);
  if (!body) fail('could not lift houseExitZoneAt out of forge.js');
  else {
    const build = (local, camera) =>
      new Function('local', 'camera', body[0] + '\nreturn houseExitZoneAt;')(local, camera);
    // A camera that maps screen → world linearly about the viewport
    // centre, exactly like the real one at a given scale.
    const cam = (scale, cx, cy) => ({
      state: { scale },
      screenToWorld: (sx, sy, vp) => ({
        x: cx + (sx - vp.w / 2) / scale,
        y: cy + (sy - vp.h / 2) / scale,
      }),
    });
    const HOUSE = { lay: { house: { center: { x: 0, y: 0 }, radius: 540 } } };
    const L = (house, params, vp) => ({ _house: house, params, lastSize: vp });
    const VP = { w: 1600, h: 900 };
    // The camera the house actually flies to: fit 2*(540+70) into 900.
    const fit = 900 / (2 * (540 + 70));
    const f = build(L(HOUSE, { house_exit_r: 1.0 }, VP), cam(fit, 0, 0));
    const at = (wx, wy) => [VP.w / 2 + wx * fit, VP.h / 2 + wy * fit];
    const t = (name, got, want) => {
      if (got === want) ok(name);
      else fail(name + ' — got ' + got + ', expected ' + want);
    };
    t('the house centre is INSIDE (an empty click there does nothing)', f(...at(0, 0)), false);
    t('a point at 0.5·Rh is INSIDE', f(...at(270, 0)), false);
    t('a point just inside the rim (0.99·Rh) is INSIDE', f(...at(534, 0)), false);
    t('a point just outside the rim (1.01·Rh) is OUTSIDE', f(...at(546, 0)), true);
    t('the viewport corner is OUTSIDE', f(0, 0), true);
    t('a diagonal point at 0.9·Rh is INSIDE', f(...at(343, 343)), false);   // r = 485
    t('a diagonal point at 1.1·Rh is OUTSIDE', f(...at(420, 420)), true);   // r = 594
    // The dial.
    const off = build(L(HOUSE, { house_exit_r: 0 }, VP), cam(fit, 0, 0));
    t('house_exit_r = 0 ⇒ the centre of the house exits (the honest zero)', off(...at(0, 0)), true);
    const tight = build(L(HOUSE, { house_exit_r: 0.5 }, VP), cam(fit, 0, 0));
    t('house_exit_r = 0.5 moves the boundary in to 0.5·Rh', tight(...at(300, 0)), true);
    // No house at all — the wheel keeps its own gesture.
    const none = build(L(null, { house_exit_r: 1.0 }, VP), cam(fit, 0, 0));
    t('HONEST ZERO — no house ⇒ every point answers "outside"', none(800, 450), true);
    // THE TRAP DOOR — zoomed in until the circle covers every pixel.
    const deep = build(L(HOUSE, { house_exit_r: 1.0 }, VP), cam(fit * 8, 0, 0));
    t('zoomed in until no corner is outside ⇒ the gesture falls back instead of locking the reader in',
      deep(...at(0, 0)), true);
    // ...but one notch out, where a corner IS outside, the gate is live again.
    const shallow = build(L(HOUSE, { house_exit_r: 1.0 }, VP), cam(fit, 0, 0));
    t('and at the fitted camera (a corner is outside) the gate is live', shallow(...at(0, 0)), false);
  }
}

// ════════════════════════════════════════════════════════════
// §A.2  LAW 2 — a port hover lights only THIS house's transmission
// ════════════════════════════════════════════════════════════
console.log('\n── LAW 2 · hovering a family port only lights what is relevant ──');
must(/function houseHoverResolve\(cssX, cssY\) \{/,
  'there is ONE hover resolver for the canvas', forgeSrc);
must(/const hit = houseHoverResolve\(cssX, cssY\);\s*\n\s*setHoverId\(hit\);/,
  'pointermove goes through it (the ports are tested before the nodes)', forgeSrc);
must(/const pt = housePortAt\(cssX, cssY\);\s*\n\s*if \(pt && pt\.group !== local\._isolateFamily\) \{\s*\n\s*setPortHover\(pt\.group\);\s*\n\s*return null;/,
  'a port under the pointer resolves to the PORT and to no node at all', forgeSrc);
must(/return houseIsPortedId\(hit\) \? null : hit;/,
  'a node collapsed onto a port is not individually hoverable', forgeSrc);
must(/if \(hit != null && local\._isolateFamily && local\._house\s*\n\s*&& houseIsPortedId\(hit\)\) hit = null;/,
  'a node collapsed onto a port is not individually clickable either', forgeSrc);
must(/const slackPx = \(typeof local\.params\.house_port_hit === 'number'\)/,
  'the port hit target is its DRAWN radius plus a dialled slack, not an arbitrary node\'s disc',
  forgeSrc);
must(/^\s*house_port_hit:\s*10,/m,
  'the shipped port slack is 10 screen px — the pre-wave-3 constant', forgeSrc);
// The focus split.
must(/const portRec\s*=\s*housePortFocusRec\(\);/, 'recomputeFocus asks whether a port is hovered', forgeSrc);
must(/local\.focusedEdgeSet = baseFocus;\s*\n\s*local\.focusedSet\s*=\s*nodeFocus;/,
  'the WIRES answer to hover+lock only; the port adds NODES to the highlight, never edges',
  forgeSrc);
must(/graph\.computeEdgeStates\(local\.mode\.edges, local\.focusedEdgeSet\)/,
  'recomputeFocus computes edge targets from the edge focus set', forgeSrc);
must(/const newTargets = graph\.computeEdgeStates\(m\.edges, edgeFocus\);/,
  'rebakeEdges (the zoom re-pack site) uses the same set', forgeSrc);
must(/applyPortHoverOverride\(newTargets\);\s*\n\s*applyEdgeHiddenFilters\(newTargets\);[\s\S]*applyPortHoverOverride\(newTargets\);\s*\n\s*applyEdgeHiddenFilters\(newTargets\);/,
  'the port lift is applied at BOTH edge-target sites, BEFORE the hidden filters (hidden still wins)',
  forgeSrc);
// The population: class 1 only, class 3 counted but never lit,
// class 2 unreachable by construction.
must(/if \(cls !== 1 && cls !== 3\) continue;/,
  'only class 1 (member↔port) and class 3 (parked) wires are even considered', forgeSrc);
must(/if \(cls === 3\) \{ r\.parked\+\+; continue; \}/,
  'a wire whose house end is PARKED is counted honestly and never lit (it has no terminus)',
  forgeSrc);
{
  // The one thing that must be structurally impossible: a port↔port
  // wire (class 2) entering the lift. It cannot, because the only
  // writer of rec.edges is inside the cls-1 branch.
  const m = forgeSrc.match(/function housePortFocusMap\(\)[\s\S]*?\n    \}\n/);
  if (!m) fail('housePortFocusMap not found');
  else if (/r\.edges\.push\(ei\);/.test(m[0]) && (m[0].match(/r\.edges\.push\(ei\)/g) || []).length === 1)
    ok('rec.edges has exactly ONE writer, and it is past the class-1 gate — a port↔port wire cannot be resurrected');
  else fail('housePortFocusMap has more than one edges writer — the class-2 guard is not structural');
}
must(/function housePortFocusRec\(\) \{\s*\n\s*if \(!local\._isolateFamily \|\| !local\._house \|\| !local\._portHoverGroup\) return null;/,
  'HONEST ZERO — no house or no hovered port ⇒ every port consumer sees null', forgeSrc);
must(/local\._portHoverGroup = null;/, 'entering / leaving / travelling clears the hovered port', forgeSrc);
must(/local\._onPortHoverChange/, 'the port has its own hovercard hook (a port is not a node)', forgeSrc);
must(/local\._onPortHoverChange = function \(info\) \{/, 'the hover card installs it', cardSrc);
must(/tradEl\.textContent = 'HORIZON PORT';/, 'the card says what the pointer is actually on', cardSrc);
must(/if \(!id && local\._portHoverGroup\) return;\s*\n\s*if \(showId\) \{ clearTimeout\(showId\); showId = 0; \}/,
  'the node card yields the shared element AND the shared timer to the port card '
  + '(an unguarded clearTimeout here would cancel the port card before it painted)', cardSrc);

// ════════════════════════════════════════════════════════════
// §A.3  LAW 3 — leaving a house carries the selection home
// ════════════════════════════════════════════════════════════
console.log('\n── LAW 3 · leaving a house keeps the selected node\'s connections ──');
must(/if \(local\._isolateFamily\) \{\s*\n\s*setIsolateFamily\(null\);\s*\n\s*return;\s*\n\s*\}/,
  'the exit returns UNCONDITIONALLY — click 1 leaves the house and keeps the lock', forgeSrc);
mustNot(/setIsolateFamily\(null\);\s*\n\s*if \(local\.lockedSet\.size === 0\) return;\s*\n\s*\}/,
  'the pre-wave-3 fall-through that exited AND cleared the lock in one click', forgeSrc);
must(/function pruneLockToMode\(\) \{/, 'the carried lock is checked against the mode it lands on', forgeSrc);
must(/for \(const id of local\.lockedSet\) if \(!byId\.has\(id\)\) gone\.push\(id\);/,
  'a locked id the restored mode cannot show is dropped, not left dangling', forgeSrc);
must(/local\._onLockChange\(id, 'remove'\)/, 'the tab strip is told about every dropped lock', forgeSrc);
must(/local\._houseRepackPending = camera\.isAnimating\(\);\s*\n[\s\S]{0,900}?pruneLockToMode\(\);/,
  'the prune runs in settleHouse\'s RESTORE branch — after the guests have actually been evicted',
  forgeSrc);
must(/if \(!local\.lockedSet\.size\) return;/,
  'HONEST ZERO — no lock carried ⇒ the prune is a no-op', forgeSrc);

// ════════════════════════════════════════════════════════════
// §B  THE PROBE — LAW 2 over the real vault
// ════════════════════════════════════════════════════════════
// Mirrors the shipped path for the DEFAULT wheel (deities mode) with
// THE RAILS on: local.mode = every deity + Greek's own guests, and
// buildHouse's external class per raw edge index.
console.log('\n── LAW 2 · the probe: Greek isolated, the ROMAN port hovered ──');
const HOUSE = 'Greek', PORT = 'Roman';
const ASPECT_RE = /(avatara-of|manifestation-of|aspect-of|emanation-of|constituent-of)$/;
const famOf = (n) => (n && n.family) || 'Other';

// mode.nodes / mode.edges exactly as augmentModeForHouse leaves them.
const wheelNodes = NODES.filter(n => n && n.type === 'deity');
const wheelIds   = new Set(wheelNodes.map(n => n.id));
const wheelEdges = EDGES.filter(e => wheelIds.has(e.source) && wheelIds.has(e.target));
const guests     = NODES.filter(n => n && n.id && !wheelIds.has(n.id) && famOf(n) === HOUSE)
                        .sort((a, b) => (a.id < b.id ? -1 : 1));
const guestIds   = new Set(guests.map(n => n.id));
const mNodes     = wheelNodes.concat(guests);
const memberIds  = new Set(mNodes.filter(n => famOf(n) === HOUSE).map(n => n.id));
const extraEdges = EDGES.filter(e => (guestIds.has(e.source) || guestIds.has(e.target))
                                  && memberIds.has(e.source) && memberIds.has(e.target));
const mEdges     = wheelEdges.concat(extraEdges);
const byId       = new Map(mNodes.map(n => [n.id, n]));

// buildHouse's sweep: the external class + the layout inputs.
const extern = new Uint8Array(mEdges.length);
const arcs = [], laterals = [], aspects = [], portWeights = {};
for (let ei = 0; ei < mEdges.length; ei++) {
  const e = mEdges[ei];
  const sIn = memberIds.has(e.source), tIn = memberIds.has(e.target);
  if (sIn !== tIn) {
    extern[ei] = 1;
    const other = byId.get(sIn ? e.target : e.source);
    if (other) { const g = famOf(other); portWeights[g] = (portWeights[g] || 0) + 1; }
    continue;
  }
  if (!sIn) { extern[ei] = 2; continue; }
  if (e.type === 'parent-of')      arcs.push([e.source, e.target]);
  else if (e.type === 'child-of')  arcs.push([e.target, e.source]);
  else if (e.type === 'consort')   laterals.push([e.source, e.target]);
  else if (ASPECT_RE.test(e.type || '')) aspects.push([e.source, e.target]);
}
const DEG = (() => { const d = new Map();
  for (const e of mEdges) { d.set(e.source, (d.get(e.source) || 0) + 1); d.set(e.target, (d.get(e.target) || 0) + 1); }
  return d; })();
const BEARINGS = (() => { const b = {}; let i = 0;
  for (const f of new Set(mNodes.map(famOf))) b[f] = (i++) * 0.21; return b; })();
const grab = (k, dflt) => {
  const m = forgeSrc.match(new RegExp('^\\s*' + k + ':\\s*([-\\d.]+),', 'm'));
  return m ? parseFloat(m[1]) : dflt;
};
const lay = layoutFn(mNodes, {
  groupBy: famOf, groupKey: HOUSE,
  arcs, laterals, aspects, degree: DEG, bearings: BEARINGS, portWeights,
  center: { x: 0, y: 0 }, radius: 540,
  geometry: 'cascade', spread: grab('house_spread', 1.10),
  ranks: 'lineage', orphans: 'domain',
  railMax: grab('house_rail_cap', 150), railGlyph: grab('house_rail_glyph', 0.40),
});
// class 3 — the rail's parked remainder has no terminus.
{
  const parked = new Set();
  for (const rl of [lay.house.rails.left, lay.house.rails.right])
    if (rl && rl.parkedIds) for (const id of rl.parkedIds) parked.add(id);
  for (let ei = 0; ei < mEdges.length; ei++) {
    const e = mEdges[ei];
    if (parked.has(e.source) || parked.has(e.target)) extern[ei] = 3;
  }
}
const portNode = (lay.ports || []).find(p => p.group === PORT) || null;
console.log('  house       : ' + HOUSE + ' — ' + memberIds.size + ' members ('
  + (memberIds.size - guests.length) + ' on the wheel + ' + guests.length + ' guests)');
console.log('  mode        : ' + mNodes.length + ' nodes · ' + mEdges.length + ' edges');
console.log('  the port    : ' + PORT + ' — ' + (portNode ? portNode.members : 0)
  + ' nodes collapsed onto ONE point at r=' + (portNode ? portNode.r.toFixed(1) : '—') + ' world units');

// ── BEFORE ── the pointer resolves to ONE of the piled nodes and the
// engine lights its whole 1-hop neighbourhood: every wire with BOTH
// endpoints in {X} ∪ nbrs(X), wherever in the vault they run.
const adj = new Map();
for (const e of mEdges) {
  if (!adj.has(e.source)) adj.set(e.source, new Set());
  if (!adj.has(e.target)) adj.set(e.target, new Set());
  adj.get(e.source).add(e.target);
  adj.get(e.target).add(e.source);
}
// Is this edge the thing John asked to be shown — a wire between the
// family at the centre and the family under the pointer?
const isTransmission = (ei) => {
  const e = mEdges[ei];
  if (extern[ei] !== 1) return false;
  const sIn = memberIds.has(e.source);
  const other = byId.get(sIn ? e.target : e.source);
  return !!other && famOf(other) === PORT;
};
const litFor = (focus) => {
  let total = 0, relevant = 0, cls = [0, 0, 0, 0];
  for (let ei = 0; ei < mEdges.length; ei++) {
    const e = mEdges[ei];
    if (focus.has(e.source) && focus.has(e.target)) {
      total++; cls[extern[ei]]++;
      if (isTransmission(ei)) relevant++;
    }
  }
  return { total, relevant, cls };
};
const portMembers = mNodes.filter(n => famOf(n) === PORT).map(n => n.id);
const perNode = portMembers.map((id) => {
  const f = new Set([id]);
  const nb = adj.get(id); if (nb) for (const x of nb) f.add(x);
  return { id, ...litFor(f) };
}).sort((a, b) => a.total - b.total);
const whole = (() => {
  const f = new Set(portMembers);
  for (const id of portMembers) { const nb = adj.get(id); if (nb) for (const x of nb) f.add(x); }
  return litFor(f);
})();
const med  = perNode[Math.floor(perNode.length / 2)];
const worst = perNode[perNode.length - 1];
const bestRelevant = perNode.reduce((a, b) => (b.relevant > a.relevant ? b : a), perNode[0]);
const row = (label, r) => '             ' + label.padEnd(7) + String(r.total).padStart(4)
  + ' lit · ' + String(r.relevant).padStart(3) + ' of them Greek↔Roman · '
  + String(r.cls[2]).padStart(3) + ' port↔port  (' + r.id + ')';
console.log('\n  BEFORE — the pointer resolves to whichever piled disc the hit grid returns first,');
console.log('           and that node\'s ENTIRE 1-hop neighbourhood lights:');
console.log(row('min', perNode[0]));
console.log(row('median', med));
console.log(row('max', worst));
console.log('           A port↔port wire runs between two families that are NEITHER Greek nor');
console.log('           Roman, and BOTH its ends sit on single dots — those are the "broken lines".');
console.log('           if the whole pile were taken as the focus: ' + whole.total
  + ' lit · ' + whole.relevant + ' Greek↔Roman · ' + whole.cls[2] + ' port↔port.');

// ── AFTER ── exactly the transmission between the two families.
const after = [];
let afterParked = 0;
for (let ei = 0; ei < mEdges.length; ei++) {
  const cls = extern[ei];
  if (cls !== 1 && cls !== 3) continue;
  const e = mEdges[ei];
  const sIn = memberIds.has(e.source), tIn = memberIds.has(e.target);
  if (sIn === tIn) continue;
  const other = byId.get(sIn ? e.target : e.source);
  if (!other || famOf(other) !== PORT) continue;
  if (cls === 3) { afterParked++; continue; }
  after.push(ei);
}
const touched = new Set();
for (const ei of after) {
  const e = mEdges[ei];
  touched.add(memberIds.has(e.source) ? e.source : e.target);
}
console.log('\n  AFTER  — only the transmission between the family at the centre and the family');
console.log('           under the pointer:');
console.log('             ' + after.length + ' wires, landing on ' + touched.size
  + ' of the ' + memberIds.size + ' members of the house');
console.log('             ' + afterParked + ' further Greek↔Roman wires reach a PARKED member'
  + ' (no terminus) — counted on the card, never drawn');
console.log('             0 port↔port wires, by construction (class 2 is not class 1)');

// The verdict is about RELEVANCE, not volume. The old behaviour lit
// fewer wires only because it could reach one arbitrary node; what it
// could never do is show the transmission the port stands for, and
// most of what it did show was about other families entirely.
if (after.length > 0) ok('the Roman port has a real transmission to light: ' + after.length + ' wires');
else fail('the probe found no Greek↔Roman wires — the fixture has drifted');
{
  let bad = 0;
  for (const ei of after) if (!isTransmission(ei)) bad++;
  if (!bad) ok('100% of the lit wires connect the family at the centre to the family under the pointer');
  else fail(bad + ' of the lit wires are not Greek↔Roman');
}
if (worst.relevant / worst.total < 0.5)
  ok('the old worst case was ' + (100 * worst.relevant / worst.total).toFixed(0)
    + '% relevant (' + worst.relevant + ' of ' + worst.total + '); the new rule is 100%');
else fail('the old worst case was already mostly relevant — re-read the probe before trusting it');
if (bestRelevant.relevant < after.length)
  ok('no single node-hover could EVER show the transmission: the best one reached '
    + bestRelevant.relevant + ' of the ' + after.length + ' Greek↔Roman wires ('
    + bestRelevant.id + '); the port now shows all ' + after.length);
else fail('a single node hover already showed the whole transmission — the premise is wrong');
if (whole.cls[2] > 0)
  ok('the pile-as-focus reading John described would light ' + whole.cls[2]
    + ' port↔port wires; the new rule lights 0 by construction');
else fail('expected port↔port wires in the pile focus — the fixture has drifted');

// ════════════════════════════════════════════════════════════
// §C  THE PROBE — LAW 3: what survives the walk home
// ════════════════════════════════════════════════════════════
// The carried lock lands on the RESTORED mode (guests evicted). This
// is the census of what that means, from the real vault.
console.log('\n── LAW 3 · the probe: what a carried lock lands on ──');
{
  const deityLock = wheelNodes.find(n => famOf(n) === HOUSE);
  const guestLock = guests[0] || null;
  console.log('  the wheel after the walk home : ' + wheelNodes.length + ' deities');
  console.log('  Greek in the house            : ' + memberIds.size
    + ' (' + (memberIds.size - guests.length) + ' survive the exit, '
    + guests.length + ' are guests and cannot)');
  if (deityLock && wheelIds.has(deityLock.id))
    ok('a locked DEITY carries home intact — e.g. "' + deityLock.id
      + '" is still on the wheel, so its wires re-light there (John\'s case)');
  else fail('no Greek deity on the wheel — the fixture has drifted');
  if (guestLock && !wheelIds.has(guestLock.id))
    ok('a locked GUEST cannot carry home — e.g. "' + guestLock.id + '" (' + guestLock.type
      + ') is not on the deities wheel, which is why pruneLockToMode exists');
  else fail('the Greek house has no guest — the fixture has drifted');
  // How big the silent-ghost risk was: every rail item is lockable.
  const guestTypes = new Map();
  for (const g of guests) guestTypes.set(g.type, (guestTypes.get(g.type) || 0) + 1);
  console.log('  lockable guests by type       : '
    + [...guestTypes].sort((a, b) => b[1] - a[1]).map(([t, n]) => t + ' ' + n).join(' · '));
}

console.log('');
if (failures) { console.error(failures + ' FAILURE(S)'); process.exit(1); }
console.log('ALL HOUSE-INTERACTION CHECKS PASS');
