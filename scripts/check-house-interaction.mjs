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
// 2026-07-31 — John refined LAW 1: an inside click must still CLEAR the
// selection, it just must not switch modes. Wave 3's total no-op
// over-corrected. Two assertions now: the mode switch is still gated,
// AND an inside click with a lock standing drops it and stays.
must(/if \(local\._isolateFamily && local\._house\s*\n\s*&& !houseExitZoneAt\(cssX, cssY\)\) \{/,
  'the empty-click gesture is still gated on the house circle before it can leave',
  forgeSrc);
must(/if \(local\.lockedSet\.size === 0\) return 'inside-ignored';\s*\n\s*local\.lockedSet\.clear\(\);/,
  'an INSIDE empty click clears the selection and stays in the house (nothing to clear ⇒ genuine no-op)',
  forgeSrc);
must(/return 'inside-lock-cleared';/,
  'the inside-clear outcome is reported distinctly so the live probe can tell the two apart',
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

// ════════════════════════════════════════════════════════════
// §D  THE HOUSE HAS ITS OWN DOOR (2026-07-31)
// ════════════════════════════════════════════════════════════
// John asked for "a panel just dedicated to" the house's sizes and
// got a SECTION of the Node Lab instead — twice:
//   "??????? IN TH ENODE LAB?!?!?!?! WHY>?>???? is SUPER CLUTTED
//    I ASKED TO DO ITS OWN CLEAN SIMPLE TO ACESS ONE OPANEL"
// A control he cannot find is unshipped, and that had happened four
// times in three days. So this section does NOT settle for grepping
// the source: it MOUNTS both dev panels in a DOM shim and reads back
// what John would read — the sections, the row labels, whether they
// are open, and whether each dial actually calls a refresh.
console.log('\n── §D · the house panel: the sixth dev door ──');

const kitSrc    = readFileSync(join(root, 'src/js/forge/panel-kit.js'), 'utf8');
const houseSrc  = readFileSync(join(root, 'src/js/forge/house-panel.js'), 'utf8');
const labSrc    = readFileSync(join(root, 'src/js/forge/lab-panel.js'), 'utf8');
const drawerSrc = readFileSync(join(root, 'src/js/forge/dev-drawer.js'), 'utf8');
const bundleSrc = readFileSync(join(root, 'scripts/build-forge-bundle.sh'), 'utf8');

// ── D.1  the launcher row exists and the drawer OWNS it ──────
must(/data-dev-panel="house"/, 'the DEV launcher has a sixth row, data-dev-panel="house"', forgeSrc);
must(/id="forge-housepanel-btn"/, 'that row carries its own trigger id', forgeSrc);
must(/house: \{\s*\n\s*isOpen\(\) \{ const p = housePanel\(\);/,
  'dev-drawer registers HOUSE as an EDITOR (so one-editor-at-a-time covers it)', drawerSrc);
must(/const EDITOR_KEYS = \['lab', 'house', 'fx', 'style'\];/,
  'HOUSE is in EDITOR_KEYS — opening it closes the LAB, and vice versa', drawerSrc);
must(/for \(const k of EDITOR_KEYS\) open\[k\] = EDITORS\[k\]\.isOpen\(\);/,
  'the row dots are derived from EDITOR_KEYS, so the sixth dot lights without a second list', drawerSrc);
must(/'forge-lab-panel', 'forge-house-panel'\]/,
  'Esc inside the house panel is treated as dev chrome, like the LAB', drawerSrc);
must(/wireHousePanel\(\);/, 'forge.js wires the house panel before the dev drawer', forgeSrc);
// The modules are shipped as ONE concatenated bundle — a new file that
// is not in this list is a panel that never loads in the real app.
must(/src\/js\/forge\/panel-kit\.js/, 'the bundle list carries panel-kit.js', bundleSrc);
must(/src\/js\/forge\/house-panel\.js/, 'the bundle list carries house-panel.js', bundleSrc);

// ── D.2  DELETE, DON'T HIDE — no house residue in the LAB ────
mustNot(/house_/, 'a house_* dial anywhere in the Node Lab', labSrc);
mustNot(/HOUSE_RADIOS/, 'the house radio table in the Node Lab', labSrc);
{
  const secs = [...labSrc.matchAll(/\{ id: '([a-z]+)', title: '/g)].map(m => m[1]);
  if (secs.length === 8 && !secs.some(s => s.startsWith('house')))
    ok('the Node Lab is back to its original EIGHT sections: ' + secs.join(' · '));
  else fail('the Node Lab has ' + secs.length + ' sections: ' + secs.join(' · '));
}

// ── D.3  ONE dial machine, not two ──────────────────────────
{
  const files = ['src/js/forge/panel-kit.js', 'src/js/forge/lab-panel.js',
    'src/js/forge/house-panel.js', 'src/js/forge/fx-panel.js',
    'src/js/forge/style-panel.js', 'src/js/views/forge.js'];
  let impls = 0;
  for (const f of files) {
    impls += (readFileSync(join(root, f), 'utf8').match(/function addSlider\b/g) || []).length;
  }
  if (impls === 1) ok('there is exactly ONE addSlider implementation in the tree (panel-kit.js)');
  else fail('found ' + impls + ' addSlider implementations — the machine has been copy-pasted');
  must(/window\._forgePanelKit\.mount\(\{/, 'the house panel drives the shared kit', houseSrc);
  must(/window\._forgePanelKit\.mount\(\{/, 'the Node Lab drives the same shared kit', labSrc);
}

// ── D.4  A DOM SHIM — enough to MOUNT a panel and read it back ──
function makeEnv() {
  const store = new Map();
  const byId = new Map();
  class ClassList {
    constructor(el) { this.el = el; }
    _set() { return new Set(String(this.el._cls || '').split(/\s+/).filter(Boolean)); }
    _write(s) { this.el._cls = [...s].join(' '); }
    add(c) { const s = this._set(); s.add(c); this._write(s); }
    remove(c) { const s = this._set(); s.delete(c); this._write(s); }
    contains(c) { return this._set().has(c); }
    toggle(c, on) {
      const s = this._set();
      if (on === undefined) { s.has(c) ? s.delete(c) : s.add(c); }
      else if (on) s.add(c); else s.delete(c);
      this._write(s);
    }
  }
  class El {
    constructor(tag) {
      this.tagName = String(tag).toUpperCase();
      this.children = []; this.style = {}; this.dataset = {};
      this._cls = ''; this._html = ''; this._ev = {}; this._q = {}; this._attr = {};
      this.textContent = ''; this.id = '';
      this.classList = new ClassList(this);
    }
    get className() { return this._cls; }
    set className(v) { this._cls = v; }
    get innerHTML() { return this._html; }
    set innerHTML(v) { this._html = v; }
    appendChild(c) { this.children.push(c); c._parent = this; if (c.id) byId.set(c.id, c); return c; }
    addEventListener(t, f) { (this._ev[t] = this._ev[t] || []).push(f); }
    setAttribute(k, v) { this._attr[k] = v; }
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this._attr, k) ? this._attr[k] : null; }
    querySelector(sel) { if (!this._q[sel]) this._q[sel] = new El('span'); return this._q[sel]; }
    remove() {
      if (this.id) byId.delete(this.id);
      if (this._parent) {
        const i = this._parent.children.indexOf(this);
        if (i >= 0) this._parent.children.splice(i, 1);
      }
    }
    fire(t) { for (const f of (this._ev[t] || []).slice()) f({ target: this, stopPropagation() {}, preventDefault() {} }); }
  }
  const body = new El('body'), head = new El('head');
  return {
    store,
    document: {
      createElement: (t) => new El(t),
      getElementById: (id) => byId.get(id) || null,
      body, head, addEventListener() {},
    },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
  };
}

// PARAM_DEFAULTS is the single source of truth for every dial's value;
// a panel that declares a key that is NOT in it is a dead dial.
function parseParamDefaults(src) {
  const start = src.indexOf('const PARAM_DEFAULTS = Object.freeze({');
  const out = {};
  if (start < 0) return out;
  const body = src.slice(start).split(/\n  \}\);/)[0];
  for (const line of body.split('\n')) {
    const m = /^\s{4}(\w+):\s*(-?\d+(?:\.\d+)?|'[^']*'|"[^"]*"|true|false)\s*,/.exec(line);
    if (!m) continue;
    let v = m[2];
    if (/^-?\d/.test(v)) v = parseFloat(v);
    else if (v === 'true') v = true;
    else if (v === 'false') v = false;
    else v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}
const PD = parseParamDefaults(forgeSrc);

// Read a mounted panel back the way John reads it: group headings,
// row labels, and whether the group is open.
function readPanel(rootEl) {
  const secs = [];
  let cur = null;
  // FINDABILITY (2026-08-02): the sections live inside the kit's
  // .lp-scroll region now (the Copy/Reset foot is pinned on the panel
  // itself) — walk the scroll region when it exists.
  let host = rootEl;
  for (const ch of rootEl.children) {
    if (ch.classList && ch.classList.contains('lp-scroll')) { host = ch; break; }
  }
  for (let ci = 0; ci < host.children.length; ci++) {
    const ch = host.children[ci];
    if (ch.classList.contains('lp-sec')) {
      // the RECIPE disclosure head is an .lp-sec with no .lp-secbody —
      // it is not a dial group, so it is not a section here.
      const nxt = host.children[ci + 1];
      if (!nxt || !nxt.classList || !nxt.classList.contains('lp-secbody')) continue;
      const m = /<span>([^<]+)<\/span>/.exec(ch.innerHTML);
      cur = { title: m ? m[1] : '?', open: ch.classList.contains('open'), rows: [] };
      secs.push(cur);
    } else if (ch.classList.contains('lp-secbody') && cur) {
      cur.bodyOpen = ch.classList.contains('open');
      let cap = null, last = null;
      for (const c of ch.children) {
        if (c.classList.contains('lp-hint')) cur.hint = c.textContent;
        else if (c.classList.contains('lp-row')) {
          const lm = /<span>([^<]*)<\/span>/.exec(c.innerHTML);
          last = { kind: 'slider', label: lm ? lm[1] : '?', input: null, val: c._q['b'] };
          cur.rows.push(last);
        } else if (c.tagName === 'INPUT') { if (last) last.input = c; }
        else if (c.classList.contains('lp-cast')) cap = c.textContent;
        else if (c.classList.contains('lp-chips')) {
          cur.rows.push({
            kind: cap ? 'radio' : 'toggles', label: cap || '(toggles)',
            opts: c.children.map((b) => b.textContent), chips: c.children,
          });
          cap = null;
        }
      }
    }
  }
  return secs;
}

function mountPanel(which, seed) {
  const env = makeEnv();
  if (seed) for (const [k, v] of Object.entries(seed)) env.store.set(k, v);
  globalThis.document = env.document;
  globalThis.localStorage = env.localStorage;
  new Function(kitSrc)();
  new Function(which === 'house' ? houseSrc : labSrc)();
  const touched = new Set();
  const raw = { ...PD };
  const params = new Proxy(raw, {
    get(t, k) { if (typeof k === 'string') touched.add(k); return t[k]; },
    set(t, k, v) { if (typeof k === 'string') touched.add(k); t[k] = v; return true; },
  });
  const calls = [];
  const api = {};
  for (const k of ['redraw', 'refreshDress', 'refocus', 'rebake', 'houseMorph', 'houseSnap', 'relabel']) {
    api[k] = () => calls.push(k);
  }
  const local = { params, mode: null };
  const warns = [];
  const realWarn = console.warn;
  console.warn = (...a) => warns.push(a.join(' '));
  try {
    (which === 'house' ? globalThis.window._forgeHousePanel : globalThis.window._forgeLabPanel)
      .attach({ local, api });
  } finally { console.warn = realWarn; }
  const el = env.document.getElementById(which === 'house' ? 'forge-house-panel' : 'forge-lab-panel');
  return { env, el, secs: el ? readPanel(el) : [], touched, raw, calls, api, warns, local };
}

// ── D.5  the house panel, as John will read it ──────────────
const H = mountPanel('house');
if (H.el) ok('the house panel mounts and puts #forge-house-panel on the page');
else fail('the house panel did not mount');
if (!H.warns.length) ok('every dial the panel declares is placed in a section (no builder warnings)');
else fail('unplaced controls: ' + H.warns.join(' | '));
{
  // FINDABLE BY STRUCTURE, NOT BY SCROLL (2026-08-02): the all-open
  // panel buried 71% of the dials below the fold at John's window.
  // The law now: exactly ONE group open on a first visit (the tree),
  // every head on screen, Reset/Copy pinned in the foot.
  const open = H.secs.filter(s => s.open && s.bodyOpen);
  if (H.secs.length >= 6 && open.length === 1 && /tree/i.test(open[0].title))
    ok('accordion first visit: only "' + open[0].title + '" opens; the other '
      + (H.secs.length - 1) + ' heads are visible, collapsed');
  else fail('accordion default drifted — open groups: ' + open.map(s => s.title).join(', '));
}
{
  // …and OPENING one group CLOSES the rest (the accordion itself).
  const bandSec = H.secs.find(s => /band/i.test(s.title));
  const bandEl = (() => {
    let host = H.el;
    for (const ch of H.el.children) if (ch.classList && ch.classList.contains('lp-scroll')) { host = ch; break; }
    for (const ch of host.children) {
      if (ch.classList.contains('lp-sec') && ch.innerHTML.indexOf(bandSec ? bandSec.title : '∅') >= 0) return ch;
    }
    return null;
  })();
  if (bandEl) {
    bandEl.fire('click');
    const openNow = readPanel(H.el).filter(s => s.open);
    if (openNow.length === 1 && /band/i.test(openNow[0].title))
      ok('accordion: opening "' + openNow[0].title + '" closed the tree — one group open at a time');
    else fail('accordion did not close the others — open: ' + openNow.map(s => s.title).join(', '));
    bandEl.fire('click');   // leave it as found for the row walks below
    const treeEl = (() => {
      let host = H.el;
      for (const ch of H.el.children) if (ch.classList && ch.classList.contains('lp-scroll')) { host = ch; break; }
      for (const ch of host.children) if (ch.classList.contains('lp-sec') && /tree/i.test(ch.innerHTML)) return ch;
      return null;
    })();
    if (treeEl) treeEl.fire('click');
  } else fail('no band section head found to exercise the accordion');
}
console.log('\n  THE PANEL, AS HE READS IT:');
let hRows = 0;
for (const s of H.secs) {
  console.log('    ' + s.title.toUpperCase() + '  — ' + (s.hint || ''));
  for (const r of s.rows) {
    hRows++;
    console.log('      · ' + r.label + (r.kind === 'radio' ? '  [' + r.opts.join(' | ') + ']' : ''));
  }
}
console.log('');
{
  const keys = [...H.touched].filter(k => k.startsWith('house_'));
  const missing = keys.filter(k => !(k in PD));
  if (!missing.length) ok('all ' + keys.length + ' house_* params the panel drives exist in PARAM_DEFAULTS');
  else fail('dials for params that do not exist: ' + missing.join(', '));
  // 39 → 42 on 2026-07-31: +God size (postmortem #5, the direct dial
  // asked for by name), +Captions flat|curved (postmortem #6), and
  // +Era lines (the stratum dial, postmortem #2).
  // 42 → 46 on 2026-08-02: +Fan drop, +Fan width (John's asks by
  // name), +Band fit (shrink|cap), +Title settle (the settle-only
  // title law's dial).
  if (hRows === 46) ok('46 controls — every house dial in the app, in one panel');
  else fail('the panel renders ' + hRows + ' controls (expected 46 — a dial was dropped or double-placed)');
  // house_geometry (CASCADE/FAN) is CANONICAL and lives on the crown.
  if (!H.secs.some(s => s.rows.some(r => r.opts && r.opts.includes('cascade'))))
    ok('Cascade | Fan is NOT here — it is canonical and stays on the VIEW panel');
  else fail('the canonical house_geometry control leaked into the dev panel');
}

// ── D.6  EFFECTS MUST FIRE — no dial reads as dead ──────────
{
  let dead = [];
  for (const s of H.secs) {
    for (const r of s.rows) {
      const before = H.calls.length;
      if (r.kind === 'slider' && r.input) { r.input.value = String(r.input.min); r.input.fire('input'); }
      else if (r.chips && r.chips.length > 1) { r.chips[1].fire('click'); }
      if (H.calls.length === before) dead.push(r.label);
    }
  }
  if (!dead.length) ok('every one of the ' + hRows + ' controls calls a refresh when moved — none is inert');
  else fail('controls that fire NOTHING: ' + dead.join(', '));
}
function fires(label, expected) {
  for (const s of H.secs) for (const r of s.rows) {
    if (r.label !== label) continue;
    const before = H.calls.length;
    if (r.kind === 'slider' && r.input) { r.input.value = String(r.input.max); r.input.fire('input'); }
    else if (r.chips) r.chips[r.chips.length - 1].fire('click');
    const got = H.calls.slice(before);
    if (got.includes(expected)) ok('"' + label + '" routes through ' + expected + '()');
    else fail('"' + label + '" fired [' + got.join(',') + '] — expected ' + expected + '()');
    return;
  }
  fail('no row labelled "' + label + '" — the panel has drifted');
}
// The three refreshes that have silently swallowed a dial before:
fires('House names', 'relabel');   // the label SET is compared BY IDENTITY
fires('Title spot', 'relabel');    // renamed from "Title corner" when center shipped
fires('God size', 'houseSnap');    // the postmortem-#5 dial must re-solve the layout
fires('Band radius', 'houseSnap'); // a size dial must re-solve the layout
fires('Distribution', 'houseMorph');
fires('Bone strength', 'refocus');
fires('Fan drop', 'houseSnap');    // the fan's origin dial re-solves the layout
fires('Fan width', 'houseSnap');   // the fan's cut dial re-solves the layout
fires('Band fit', 'houseMorph');   // shrink|cap flips a layout law — it tweens

// ── D.7  THE OPEN-STATE LAW, tested with a PLANTED LEGACY STATE ──
// This is the structural cause of three unfindable controls in two
// days: defaults were seeded only when the WHOLE key was missing, so
// any section added later was `undefined` ⇒ falsy ⇒ collapsed.
// 2026-08-02: the panel is an ACCORDION now, and every returning
// user's stored open map said all-open forever — the same trap from
// the other side. The one-time __accordionMigr migration rewrites a
// pre-accordion map to tree-only ONCE; choices made AFTER it stick.
{
  // (a) the planted ALL-OPEN legacy map — every returning user today —
  // must arrive at the accordion default, not the buried-fold panel.
  const legacy = mountPanel('house', { 'forge.housePanel.open.v1':
    JSON.stringify({ tree: true, band: true, ports: true, gaps: true, words: true, lines: true, feel: true }) });
  const openL = legacy.secs.filter(s => s.open);
  if (openL.length === 1 && /tree/i.test(openL[0].title))
    ok('a planted ALL-OPEN legacy map migrates ONCE to tree-only (the 71%-below-the-fold panel cannot return)');
  else fail('legacy all-open map survived migration — open: ' + openL.map(s => s.title).join(', '));
  const migrated = JSON.parse(legacy.env.store.get('forge.housePanel.open.v1') || '{}');
  if (migrated.__accordionMigr === 1) ok('…and the __accordionMigr marker is written, so it never re-migrates');
  else fail('no __accordionMigr marker — the migration would run on every mount');
  // (b) a choice made AFTER the migration sticks: a post-migration map
  // that says band-open/tree-closed mounts exactly that way.
  const chosen = mountPanel('house', { 'forge.housePanel.open.v1':
    JSON.stringify({ __accordionMigr: 1, tree: false, band: true }) });
  const openC = chosen.secs.filter(s => s.open);
  if (openC.length === 1 && /band/i.test(openC[0].title))
    ok('a group John opened AFTER the migration stays open for him ("' + openC[0].title + '")');
  else fail('his own post-migration choice was overwritten — open: ' + openC.map(s => s.title).join(', '));
  // (c) the never-stored-id fallback law survives: a section absent
  // from a post-migration map falls back to its DECLARED default.
  const declaredClosed = chosen.secs.filter(s => !/tree|band/i.test(s.title));
  if (declaredClosed.every(s => !s.open))
    ok('the ' + declaredClosed.length + ' groups his stored state has never seen arrive at their DECLARED (collapsed) default');
  else fail('groups absent from the map opened uninvited: '
    + declaredClosed.filter(s => s.open).map(s => s.title).join(', '));
}

// ── D.8  the dials he already tuned come WITH the panel ──────
{
  const donor = JSON.stringify({ house_band_r: 0.77, house_name_max: 55, recipe_glow: 0.9 });
  const m = mountPanel('house', { 'forge.labRecipe.v1': donor });
  if (m.raw.house_band_r === 0.77 && m.raw.house_name_max === 55)
    ok('house dials tuned while they lived in the LAB carry into the new panel');
  else fail('the one-time import dropped his tuning: band_r=' + m.raw.house_band_r);
  const own = JSON.parse(m.env.store.get('forge.housePanel.v1') || '{}');
  if (own.house_band_r === 0.77) ok('and are written to the panel\'s OWN key, so the LAB may forget them');
  else fail('the imported values were not persisted under forge.housePanel.v1');
  if (!('recipe_glow' in own)) ok('nothing that is not a house dial came across');
  else fail('the house panel claimed a LAB key');
  // …and RESET must beat the import: the donor blob still holds the
  // old values, so a naive rebuild re-applies them on the spot and
  // again on the next reload.
  const btns = m.el.children.find(c => c.classList && c.classList.contains('lp-btns'));
  const resetBtn = btns && btns.children[1];
  if (resetBtn) resetBtn.fire('click');
  if (resetBtn && m.raw.house_band_r === PD.house_band_r)
    ok('Reset puts a dial back to its PARAM_DEFAULTS value (' + PD.house_band_r + ')');
  else fail('Reset left house_band_r at ' + m.raw.house_band_r);
  const after = JSON.parse(m.env.store.get('forge.housePanel.v1') || '{}');
  if (after.house_band_r === PD.house_band_r)
    ok('and writes the defaults back, so the import cannot undo the reset on the next reload');
  else fail('after Reset the stored blob says house_band_r=' + after.house_band_r);
}

// ── D.9  the Node Lab still works, and is house-free ─────────
{
  const L = mountPanel('lab');
  if (L.el) ok('the Node Lab still mounts on the shared kit');
  else fail('the Node Lab no longer mounts');
  if (!L.warns.length) ok('every LAB dial is still placed in a section');
  else fail('LAB unplaced controls: ' + L.warns.join(' | '));
  const houseKeys = [...L.touched].filter(k => k.startsWith('house_'));
  if (!houseKeys.length) ok('the Node Lab reads NO house param at all — the move is a deletion, not a hide');
  else fail('the Node Lab still touches: ' + houseKeys.join(', '));
  console.log('  the LAB now reads: ' + L.secs.map(s => s.title).join(' · '));
}

console.log('');
if (failures) { console.error(failures + ' FAILURE(S)'); process.exit(1); }
console.log('ALL HOUSE-INTERACTION CHECKS PASS');
