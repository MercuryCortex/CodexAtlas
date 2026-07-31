# REVIEW — THE HOUSE, wave 1 (2026-07-31)

20 agents over the merged diff `bf104295..d84718e5`, five lenses, every blocker/major then handed to an independent agent whose only job was to refute it. **23 findings, 19 survived.**

## Surviving findings

### [blocker] `crown-noun-counts-a-different-population` — /Users/redacted-user/Desktop/PRODUCT DEVELOPMENT/Codex Atlas/src/js/views/forge.js:6176
**The crown's first line pairs the MODE's noun with the TREE's count — two different populations in 29 of 30 modes**

**Evidence.** const modeEntry = (modemod.MODES || []).find((x) => x.value === m.id);
const nodeWord = String((modeEntry && modeEntry.label) || m.id || 'NODES').toUpperCase();
const line1 = st.tree + ' ' + nodeWord + ' · ' + st.kinArcs + ' LINEAGE ARCS · '
  + st.orphanCount + ' STAND ON THEIR ERA';

`st.tree` is familytree.js's TREE set, and treeKindOf defaults to deity→tree (familytree.js:161; forge.js's houseOptsFromParams at 6740-6751 passes no treeKindOf). `nodeWord` is the WHEEL mode's label. Before THE RAILS these agreed, because buildHouse was fed the single-type mode.nodes. augmentModeForHouse now folds every non-mode family node in as a guest, so the tree is the family's DEITIES no matter which mode you entered from.

**Failure.** Measured against the real data.js by replaying the union input the view now builds (guests = every family node not in mode):
  Greek, symbols mode  → crown prints "80 SYMBOLS · 96 LINEAGE ARCS · 10 STAND ON THEIR ERA". Greek has 25 symbols. 80 is the deity count.
  Greek, persons mode  → "80 PERSONS". Greek has 57 persons.
  Egyptian, rituals    → "63 RITUALS". Egyptian has 7 rituals.
  Norse, symbols       → "50 SYMBOLS". Norse has 10 symbols.
  Greek, documents mode→ "80 DOCUMENTS" printed 17px directly above "THE SCRIPTORIUM — 24 DOCS" and "24 IN THE SCRIPTORIUM". The crown contradicts itself on the same screen, in the same paint.
The 'scriptures' mode is the only non-deity mode spared, and only because houseGuestsOf bails on m.isolateGroupBy (6823). This is LAW 9 in its worst form: a displayed count that disagrees with the data, on the most prominent string in the house.

**Fix.** Make the crown noun describe the set that `st.tree` counts, and let the layout be the one that says so. familytree.js already knows the answer at line 176-183: extend its stats to carry the tree's own identity (e.g. `treeKind: 'deity' | 'mixed'`, or a `degraded: true` flag set where `if (!tree.length) { tree = members.slice(); … }` fires), and have forge.js:6174-6177 print that word — DEITIES for the default split, a neutral MEMBERS/IN THE LINE when the tree degraded to all members, and the Codex noun for isolateGroupBy houses. Do NOT hard-code "DEITIES" on the assumption that no treeKindOf was passed: a corpus-section house and any deity-less family both take the degrade path and would then be mislabelled. If the mode noun is wanted instead, count the mode's own members inside the house (`m.nodes` members of `modeEntry.nodeType` within memberIds) and print that number with it. Either way add a case to scripts/check-familytree.mjs that builds a union house for a non-deity mode (Greek + symbols is the sharpest: 80 vs 25) and asserts the crown noun and the counted set are the same population.

### [blocker] `CR-1` — src/js/views/forge.js:6175
**Crown line 1 names the wheel's mode but counts the family's DEITIES — "80 DOCUMENTS" over 80 gods, on 28 of 30 modes**

**Evidence.** forge.js:6174-6177 —
  const modeEntry = (modemod.MODES || []).find((x) => x.value === m.id);
  const nodeWord = String((modeEntry && modeEntry.label) || m.id || 'NODES').toUpperCase();
  const line1 = st.tree + ' ' + nodeWord + ' · ' + st.kinArcs + ' LINEAGE ARCS · '
    + st.orphanCount + ' STAND ON THEIR ERA';
`st.tree` is NOT the mode's nodes. familytree.js:161-162 fixes the cascade to deities: `treeKindOf = (n => (n.type === 'deity') ? 'tree' : (n.type === 'document' ? 'doc' : 'court'))`. Before this batch the house only ever held mode nodes, so the degrade branch (familytree.js:181 `if (!tree.length) { tree = members.slice(); ... }`) made the noun true. Agent A's guests (forge.js:6815 houseGuestsOf) now put the family's deities into every house, so `tree` is deities in every mode and the degrade branch never fires. The diff replaced the old vague `(m.id === 'deities') ? 'DEITIES' : 'IN THE LINE'` with a concrete type assertion at exactly the moment that assertion stopped being true.

**Failure.** Measured on the real vault. Switch the wheel to Documents, click the Greek title. Crown line 1 prints "80 DOCUMENTS · 96 LINEAGE ARCS · 10 STAND ON THEIR ERA" while the cascade holds {deity:80} and zero documents — and crown line 2 directly under it prints "24 IN THE SCRIPTORIUM", with the left rail header printing "THE SCRIPTORIUM — 24 DOCS". Two contradictory document counts, 80 and 24, twelve pixels apart. Same defect everywhere: Greek/Places "80 PLACES", Greek/Rituals "80 RITUALS" (Greek has exactly 1 ritual node in the vault), Christian/Documents "12 DOCUMENTS" over 12 deities while its Scriptorium says 125, Egyptian/Symbols "63 SYMBOLS" over 63 deities. Only 'deities' and the two Codex modes (which set isolateGroupBy, so houseGuestsOf returns [] at forge.js:6823) are correct.

**Fix.** Fix at the familytree.js altitude, and keep it data-driven — a hard-coded 'DEITIES' would be a NEW lie. familytree.js is the only place that knows whether the degrade branch at line 183 fired: when guests are absent (house_rails 'off', or the Codex modes where houseGuestsOf returns [] at forge.js:6823) the cascade genuinely IS the mode's nodes and the mode label is correct — measured: Greek/Documents with rails off gives an honest "24 DOCUMENTS". So have familyTreeLayout report the cascade's own composition in `stats` (e.g. `treeType: 'deity'` when treeKindOf sorted it, or the dominant `n.type` / `null` when the degrade branch supplied it), and have forge.js:6175 print the label for THAT type, falling back to the mode label only when the layout says the tree is the mode set. Separately, once line 1 names the cascade, line 2's "IN THE SCRIPTORIUM / IN THE COURT" becomes the only document/court count on the crown, which resolves the 80-vs-24 contradiction rather than papering over it.

### [blocker] `crown-noun-vs-tree-population` — src/js/views/forge.js:6176
**In all 28 non-deity modes the rails put DEITIES in the tree while the crown counts them with the mode's noun — the crown contradicts its own rail header on the same screen**

**Evidence.** forge.js:6174-6177 —
  const modeEntry = (modemod.MODES || []).find((x) => x.value === m.id);
  const nodeWord = String((modeEntry && modeEntry.label) || m.id || 'NODES').toUpperCase();
  const line1 = st.tree + ' ' + nodeWord + ' · ' + st.kinArcs + ' LINEAGE ARCS · '
    + st.orphanCount + ' STAND ON THEIR ERA';

familytree.js:162 (the default, and forge.js never passes treeKindOf) —
  : (n => (n.type === 'deity') ? 'tree' : (n.type === 'document' ? 'doc' : 'court'));
familytree.js:183 —
  if (!tree.length) { tree = members.slice(); docs = []; court = []; }

BEFORE this diff the house held only the mode's own single-type nodes, so treeKindOf sent them all to one kind, line 183's fallback fired, and st.tree WAS the mode's node count — the noun was honest. The rails now fold the family's other types in as guests, so tree/doc/court split by TYPE while nodeWord comes from the MODE. They only agree in `deities`. (`scriptures` is exempt — houseGuestsOf returns [] when mode.isolateGroupBy is set, forge.js:6823 — leaving 28 affected modes.)

**Failure.** Switch class to Documents, click the Greek family title. Measured against the real data.js: tree=80 (Greek deities, guests), docs=24, court=137. The crown prints "80 DOCUMENTS · N LINEAGE ARCS" while the left rail header prints "THE SCRIPTORIUM — 24 DOCS", and the vault holds 24 Greek documents, not 80. Authors mode, Greek: crown "80 AUTHORS" against 57 real Greek persons. Egyptian in Documents mode: crown "63 DOCUMENTS" against 19. Every non-deity mode x every family is a displayed number that disagrees with the data (law 9), and the tree the user is looking at is made of nodes the mode filter excluded.

**Fix.** Fix the NOUN only; do not touch membership (option (a) in the claim would re-empty the Scriptorium in Documents mode: tree = 24 docs, docs = 0, court = 217).

1) src/js/engine/layout/familytree.js — record whether the type split actually happened. At line 183 the fallback is:
     if (!tree.length) { tree = members.slice(); docs = []; court = []; }
   Capture it, e.g. `const treeIsMixed = !tree.length;` immediately BEFORE that line, and add `treeKind: treeIsMixed ? 'mixed' : 'deity',` to the stats object at familytree.js:834-840 (next to `tree: N`).

2) src/js/views/forge.js:6174-6177 — pick the noun from what `tree` holds, not from the mode registry:
     const modeEntry = (modemod.MODES || []).find((x) => x.value === m.id);
     const modeWord = String((modeEntry && modeEntry.label) || m.id || 'NODES').toUpperCase();
     // The cascade is the family's DEITY lineage whenever the rails
     // split by type; only the degraded all-one-kind house is the
     // mode's own nodes, and only there is the mode's noun honest.
     const nodeWord = (st.treeKind === 'deity') ? 'DEITIES'
                    : ((m.id === 'deities') ? 'DEITIES' : modeWord);
   With house_rails off (or scriptures mode) the fallback fires, treeKind is 'mixed', and the mode's own noun is printed — which keeps that path byte-identical to today.

3) scripts/check-familytree.mjs — its houseFor() builds only `NODES.filter(n => n.type === 'deity')`, so no harness case can ever see this. Add a documents-mode union case (mode nodes + same-family guests of every type) asserting stats.tree === (Greek deity count) and stats.docs === (Greek document count), so the crown noun and the rail header are checked against the same layout return.

### [major] `EDGE-2` — src/js/engine/layout/familytree.js:704
**Overflow rail guests parked on the crown make a fan of class-0 wires that terminate on the family-name text, and rest-wires can never hide them**

**Evidence.** familytree.js:704 parks every rail item past the 150 cap on the crown point with no radius:

  704:  positions.set(g.items[k].id, { x: crown.x, y: crown.y });   // parked, no radius

bakeEdgePosB then reads those positions like any other member (forge.js:7016-7028) and, because a parked guest has no entry in `houseRadii` and its buffer-A radius was zeroed in packModeNodes, the 0.92r inset is 0 — the wire lands exactly on the crown point. Both endpoints are family members, so buildHouse classes the wire 0 (`forge.js:7078-7086`: extern[ei] is only set to 1 or 2 when an endpoint is outside memberIds), and the shader's hide is `step(v.layout_mix.w, in.ext_class)` with the chip's lowest threshold = 1 (`webgpu.js:883`, houseRestMinClass at forge.js:7248-7253). A class-0 wire is never hidden at any chip position.

Measured over data.js with railMax=150: 'Other' — 2,317 court + 19 docs, 2,167 parked, ~181 wires from the crown pile to a placed node and 2,187 wires wholly inside the pile; 'Christian' — 467 members, 180 parked, ~194 wires to placed nodes and 180 inside the pile. (Greek, Israelite, Islamic, Norse: 0 overflow, unaffected.)

The acceptance script cannot see this: scripts/check-house-wires.mjs:168 builds its world from `NODES.filter(n => n.type === 'deity')`, i.e. the pre-rails node set, so its check at :256-257 — "all N zero-length wires are external (class >= 1)" / "the hide cannot reach them" — is asserted over exactly the configuration the rails feature replaced.

**Failure.** Open the 'Other' house (or Christian) with the shipped defaults (house_rails on, rest wires off). ~180-195 idle wires converge on a single point behind the crown's four-row text stack where there is no visible and no hittable node — a starburst reading as if the family name were a node with degree ~190. The rest-wires chip at 'stubs' or 'off' does nothing to them because they are class 0. The 2,000+ wholly-internal ones are zero-length and survive only because of the new tangent guard, so the moment anything perturbs the parked coordinates they become the radial-spike defect again, in-house this time.

**Fix.** Bake a third external class for the parked remainder into the existing house lane (edgePosB float [5]) — e.g. extern = 3 when either endpoint is parked overflow. The lane and the uniform already exist, so this costs no new CPU state: `step(v.layout_mix.w, in.ext_class)` with layout_mix.w = 3 at the chip's 'full' position gives step(3,3) = 1, so a class-3 wire is hidden at ALL THREE chip positions whenever the mix is up, and `* v.layout_mix.x` keeps it byte-identically inert on the wheel. That is the correct semantics: a parked guest is deliberately invisible and unhittable (forge.js:7359), so its wire has no endpoint to point at — this is not a rest-wires preference, it is a wire with no visible terminus. Do NOT use the claim's alternative of collapsing both endpoints to one point: a zero-length wire is not a zero-area quad in this shader (origin_p1 = mid + (0 - mid) * curve, webgpu.js:769), it is a spike toward world origin — which is the very defect this commit fixed at the ports. buildHouse needs the parked-id set from the layout to bake the class; familytree.js already knows it inside buildRail, so return it on lay.house (e.g. rails.left/right.parkedIds) rather than re-deriving it in the view. Then point scripts/check-house-wires.mjs at the union node set (reuse check-familytree.mjs's houseUnion) so the zero-length / external-class assertions at :256-257 test the shipped configuration, and add Christian and Other to its family list — with the deities-only world at :168 this whole class of defect is invisible to the gate.

### [major] `CR-3` — src/js/engine/layout/familytree.js:701
**The 150-slot rail cap deletes whole shelves, not just tails — "THE COURT — 330 OF ALL KINDS" draws exactly one kind, and `overflow` is computed but never rendered anywhere**

**Evidence.** buildRail spends the cap greedily in shelf order (familytree.js:696-706):
  for (const g of groups) {
    const take = Math.max(0, Math.min(room, g.items.length));
    if (take > 0) { shown.push({ label: g.label, count: g.items.length, items: g.items.slice(0, take) }); }
    for (let k = take; k < g.items.length; k++) positions.set(g.items[k].id, { x: crown.x, y: crown.y });
    room -= take;
  }
A shelf that gets `take === 0` is never pushed into `shown`, so it has no caption and no ladder — it does not exist on screen. The honest remainder IS computed — familytree.js:716 `const rail = { x, side, count: T, shown: S, overflow: T - S, ... }` — but grep for `overflow` across src/js/views/forge.js, src/js/forge/_bundle.js and src/styles/app.css returns zero rendering sites. The only reference is forge.js:7359, a comment about hit-testing.

**Failure.** Measured. Christian court: the true kind shelves are PERSONS·199, SYMBOLS·25, DOCTRINES·18, RITUALS·11, MORE·77. Under a header reading "THE COURT — 330 OF ALL KINDS" the screen draws ONE shelf — PERSONS — and 150 dots. Four kinds and 131 members are gone with nothing on screen indicating it, and the phrase "OF ALL KINDS" is the exact claim being contradicted. 'Other' is worse: header "THE COURT — 2317 OF ALL KINDS", true shelves PERSONS·555 / THEMES·513 / TRADITIONS·333 / EVENTS·322 / MORE·594, screen draws one shelf and 150 dots — a reader counting the rail sees 6.5% of the stated mass with no overflow marker. Vedic degrades correctly (all five shelves survive, only MORE truncates 66→48), which is why the case was easy to miss.

**Fix.** Two changes, both small. (1) Render the remainder that is already returned: in renderHouseChromeLow (src/js/views/forge.js:6367-6403), after the shelf-caption loop, emit one low-priority gold line at the rail foot when `rl.overflow > 0` — e.g. `'+' + rl.overflow + ' NOT SHOWN'` at `W2S(rl.x, rl.shelves[rl.shelves.length-1].y1 + 10)` through the same claim()/halo() path, so it obeys the one label registry and yields to everything above it. (2) Stop whole shelves from vanishing: in buildRail (src/js/engine/layout/familytree.js:696-707), reserve one slot per group before the greedy fill — `let room = cap - Math.min(cap, groups.length);` then `const take = Math.max(groups.length ? 1 : 0, Math.min(room + 1, g.items.length))` (decrementing the reserve as it is spent). Both docShelves and kindShelves cap at <=6 groups, so this costs at most 6 slots and every kind the header counts keeps its caption, while preserving the documented biggest-first ordering at line 694-695. Additionally make the per-shelf caption self-consistent when truncated: at forge.js:6374 print `sh.shown + ' OF ' + sh.count` instead of bare `sh.count` whenever `sh.shown < sh.count`, so `PERSONS · 150 OF 199` never sits above a 150-glyph ladder claiming 199. The 'OF ALL KINDS' header wording needs no change — rl.count is the true court mass.

### [major] `CR-4` — src/js/views/forge.js:6313
**GEN I..GEN N asserts a generation the rank is not — 12 parentless Greek deities are captioned GEN II or lower, Vedic garuda has zero lineage edges and prints under GEN IV**

**Evidence.** forge.js:6311-6314 —
  const capFor = (rm, ri) => {
    if (ranksEra) return (rm.dmin == null) ? null : fmtD(rm.dmin);
    return (rm.n > 0) ? ('GEN ' + romanNum(ri + 1)) : null;
  };
`ri` is the ROW index, and under ranks='lineage' the row index is not the generation depth. familytree.js:363-368:
  const isolated = parents[i].length === 0 && children[i].length === 0;
  if (isolated) { rank[i] = eraRank(i); continue; }
  const rootEra = (compRootEra[comp[i]] === Infinity) ? 0 : compRootEra[comp[i]];
  const base = Math.min(rootEra, RK - 1 - compDepth[comp[i]]);
  rank[i] = Math.max(0, Math.min(RK - 1, base + layer[i]));
A connected node's row is `era offset + generation depth`; an unconnected node's row is a pure ERA bucket. Neither is a generation number. The commit message for b566b57 justified the change as canonical honesty — it swapped a false date claim for a false genealogy claim.

**Failure.** Measured against the vault's own lineage edges. Greek: 17 of 80 members sit in a row whose numeral is not their true generation; 12 of them have no parent at all (generation 1) yet are captioned GEN II or below — `adonis` carries zero parent-of / child-of / aspect edges in data.js and prints under GEN II. Norse: 35/50 mismatched, 27 parentless members below GEN I. Vedic: 44/97 mismatched, 36 parentless below GEN I — `garuda` has zero lineage or aspect edges in the vault and prints under GEN IV, telling the reader it is a fourth-generation descendant of something. Christian: 6/12, all six parentless. The very population the crown separately calls out as "N STAND ON THEIR ERA" is the population being handed a generation numeral.

**Fix.** The view cannot fix this alone — rowMeta must carry the truth. In familytree.js, add `layerMin`, `layerMax` and `eraPlaced` (count of members in the row placed by eraRank rather than by lineage) to both rowMeta.push sites (line 540 cascade, line 607 fan). Then in forge.js capFor, print `'GEN ' + romanNum(rm.layerMin + 1)` ONLY when `rm.eraPlaced === 0 && rm.layerMin === rm.layerMax`; return null otherwise, so a mixed or era-placed row simply carries no numeral. Additionally short-circuit the numeral entirely when `house.stats.kinArcs === 0` — a house with no bones has no generations to number, and that single check alone would have caught the Chinese case where the crown prints "0 LINEAGE ARCS" beside a GEN III caption. Do not fall back to the date caption for suppressed rows; that reintroduces the fake-timeline the commit was fixing.

### [major] `edgeposb-stale-length-on-augmented-repack` — src/js/views/forge.js:9589
**rebakeNodes re-bakes edgePosB against the OLD edge count and then re-packs the edges — travelling into a family with more intra-family edges uploads past the end of the array**

**Evidence.** forge.js:9586-9605, inside rebakeNodes and BEFORE the rebakeEdges() at 9656:
  if (local._house) {
    try {
      const nb = bakeNodePosB(local._house.lay.positions, local._house.lay.radii);
      const eb = bakeEdgePosB(local._house.lay.positions, local._house.lay.radii);
      const grew = (local._house.nodePosB.length !== nb.length)
                || (local._house.edgePosB.length !== eb.length);
      ...
      if (local._house.edgePosB.length === eb.length) local._house.edgePosB.set(eb);
      else local._house.edgePosB = eb;

bakeEdgePosB sizes itself from the CURRENT pack — forge.js:7010 `const E = m.edgePacked.instanceCount;` and `const out = new Float32Array(E * 6);` — but rebakeEdges (which re-packs m.edgePacked over the newly augmented m.edges) does not run until forge.js:9656, at the very end of rebakeNodes, and it ends in drawFrame(). So `grew` is computed against a stale edge count, the edge branch takes .set(), and the length never moves. The node side is safe (bakeNodePosB reads m.nodePacked, already refreshed by packModeNodes at the top of the same function) — which is why the crash the main thread found showed up on the node array first.

webgpu.js:2170-2171 has no length guard:
  if (frame.edgePosB && (frame.edgePosBDirty || r.grew)) {
    device.queue.writeBuffer(edgePosBVbo, 0, frame.edgePosB, 0, edgeCount * 6);
  }
and `local._housePosBDirty = true` is set at forge.js:9605, so the write is always taken. The startHouseTravel guard added at forge.js:7398-7403 runs LATER (setIsolateFamily calls rebakeNodes at 7508, startHouseTravel at 7524) so it cannot protect this frame.

Measured over data.js (deities mode, intra-family guest edges added per house): Norse +107, Greek +526, Egyptian +491, Vedic +779, Christian +1103, Other +2385.

**Failure.** Stand in the Norse house (m.edgePacked ~4849 instances, local._house.edgePosB = 4849*6 floats). Click the Greek port: augmentModeForHouse returns true, rebakeNodes bakes eb at 4849 and .set()s it into the same-length array, then rebakeEdges re-packs to ~5268 and calls drawFrame with edgeCount 5268 → writeBuffer(..., 0, edgePosB[29094], 0, 31608) → OperationError "Number of bytes to write is too large", thrown out of an unguarded chain, aborting setIsolateFamily with _isolateFamily already Greek and _house still Norse. Reachable without travel too: stand in any house and flip LAB > The House > Rails from 'off' back to 'on' — refreshHouse (forge.js:7437-7439) runs the identical augment-then-rebakeNodes sequence with local._house standing, and that path is not in the tour the commit verified. CAVEAT: d84718e5 claims a live tour including Norse→Greek with no throw; if that reproduces, the window is narrower than static reading shows — but the `grew` test at 9595-9596 is measuring a stale edge count either way, and the shrinking direction silently uploads one frame of the previous family's wire geometry.

**Fix.** Make bakeEdgePosB self-consistent instead of trusting the pack: in src/js/views/forge.js:7010, replace `const E = m.edgePacked.instanceCount;` with a renderable count computed over m.edges / m.positions using packEdges' own law (both endpoints in positions). This is byte-identical whenever the pack is fresh and correct when it is not, and it fixes every caller at once — no reordering of rebakeNodes required. Alternatively move the `if (local._house) {...}` block at forge.js:9586-9608 to after rebakeEdges() (deferring rebakeEdges' trailing drawFrame one step), but that is the riskier edit. Belt-and-braces in src/js/engine/renderer/webgpu.js:2159-2172: skip the write when `frame.nodePosB.length < nodeCount * 4` / `frame.edgePosB.length < edgeCount * 6` so a length skew degrades to one stale frame instead of an uncaught OperationError that strands _isolateFamily and _house out of sync.

### [minor] `GUEST-2` — src/js/engine/layout/familytree.js:704
**Rail overflow parks nodes 'at no radius' — but only guests have a zero wheel radius; in person/theme/tradition/event modes it stacks hundreds of full-size discs on the crown**

**Evidence.** buildRail parks everything past the cap on the crown and deliberately gives it no `radii` entry:

  704:  positions.set(g.items[k].id, { x: crown.x, y: crown.y });   // parked, no radius

But 'no radius entry' is not 'radius zero'. The view's bake falls back to the WHEEL radius:

  forge.js:6981  const hr = houseRadii ? houseRadii.get(np.idIndex[i]) : null;
  forge.js:6982  out[i * 4 + 2] = (typeof hr === 'number' && hr > 0) ? hr : wheelR;

The invariant only holds for GUESTS, whose buffer-A radius packModeNodes explicitly zeroes (forge.js:6941). A rail item that is a MODE MEMBER keeps its full tier radius, so it renders — and is hittable, since rebakeHitPositions takes r straight from posB z (forge.js:7372) and its guard `if (guestIds && hn.r > 0 && hn.r < railHit && guestIds.has(hn.id))` (7375) only ever touches guests. Which rails hold mode members is decided by treeKindOf (familytree.js:162): documents → the scriptorium, everything not deity/document → the court. Probed against the real data.js for rails whose items are mode members and exceed the default RAIL_MAX of 150: person/Other 555, theme/Other 513, tradition/Other 333, event/Other 322, person/Christian 199. None of those modes sets isolateGroupBy (forge.js:3813 — that is Codex-only), so all of them can be isolated by clicking a family title.

**Failure.** Switch to the Figures/Authors mode (nodeType 'person'), click the 'Other' family title. The court rail draws 150 glyphs; the remaining 405+ person nodes are parked at exactly (crown.x, crown.y) at their full wheel radius — an opaque pile of overlapping discs sitting on the family name, the two crown stat lines and the CASCADE/FAN chips, each one hit-testable, so a click anywhere on the crown locks an arbitrary one of them. Themes (513), Traditions (333) and Events (322) on 'Other' are the same, and Christian in person mode (199) too. Also reachable in any mode by dragging the LAB 'Rail cap' slider down to its 20 minimum.

**Fix.** The proposed two-part fix is at the right altitude but is INCOMPLETE — it fixes the draw and leaves an invisible click-stealer. Three edits, not two:

1. familytree.js:704 — make the park honest at the source:
     positions.set(g.items[k].id, { x: crown.x, y: crown.y });
     radii.set(g.items[k].id, 0);   // parked: no mass, no hit
2. forge.js:6982 — let an explicit 0 survive the bake:
     out[i * 4 + 2] = (typeof hr === 'number') ? hr : wheelR;
   (safe: every other `radii.set` in familytree.js writes a positive value — 533, 600, 726 — so `hr > 0` is doing no other work.)
3. forge.js:7372 — REQUIRED, and missing from the proposal. `hn.r = local._house.nodePosB[i * 4 + 2] || np.data[i * NODE_FLOATS + 2];` uses `||`, so an explicit 0 from posB is falsy and falls straight back to the wheel radius (11 wu). With only edits 1+2 the parked node stops rendering but stays hit-testable at 11 wu on the crown — strictly worse than today, because the click-steal becomes invisible. Read the z lane once and only fall back when the layout supplied nothing:
     const pz = local._house.nodePosB[i * 4 + 2];
     const laid = local._house.lay && local._house.lay.radii && local._house.lay.radii.has(hn.id);
     hn.r = (laid || pz > 0) ? pz : np.data[i * NODE_FLOATS + 2];
Then the existing guest-only slack at 7375 can drop its `guestIds.has(hn.id)` clause, since a rail glyph is a rail glyph whether its node is a guest or a mode member — today a MODE-MEMBER rail glyph (e.g. a Christian person on the court rail in Figures mode) gets a 1.69 wu hit disc with no 5 wu slack, which is the same class of miss the comment at 7355-7358 calls "the worst possible misread of intent".

Do not "scatter the overflow instead": that would invent positions the vault does not support. Zero radius is what familytree.js:87 and 125-131 already promise.

### [minor] `GUEST-3` — src/js/views/forge.js:6251
**The rails silently truncate: the header claims the family's full mass, 150 items are drawn, and the `overflow` the layout computes is never shown to the reader**

**Evidence.** The layout computes the honest remainder:

  familytree.js:716  const rail = { x, side, count: T, shown: S, overflow: T - S, pitch, glyphR, shelves: [] };

and the shelves carry both numbers (`count: g.count, shown: g.items.length`, familytree.js:713). The chrome renders only the true totals and never the remainder:

  forge.js:6251  ? ('THE SCRIPTORIUM — ' + rl.count + ' DOCS')
  forge.js:6252  : ('THE COURT — ' + rl.count + ' OF ALL KINDS')
  forge.js:6375  const txt = sh.label + ' · ' + sh.count;

`grep -n "overflow\|\.shown\b" src/js/views/forge.js` returns nothing but a comment at 7359 — `rail.overflow` and `shelf.shown` are consumed only by scripts/check-familytree.mjs (lines 189-194, 336-367), never by the app. The layout's own comment (familytree.js:84-87) states the contract — 'count stays the family's TRUE mass … and overflow is the honest remainder' — but the honest remainder has no renderer.

**Failure.** Deities mode, enter the 'Other' house. The right rail header reads 'THE COURT — 2317 OF ALL KINDS' and the topmost shelf caption reads e.g. 'PERSONS · 555' over a column of at most 150 glyphs (measured: railMax 150, so shown 150, overflow 2167). The reader counts the column, finds 150, and has no way to learn that 2,167 court members and 405 of the 555 persons in that shelf are off-stage — the map states a number it is not showing and never says it is showing a head. Christian's court (330) and Vedic's (168) truncate the same way at the shipped default.

**Fix.** Leave both rail headers alone — they are canonical (rl.count is the vault's true mass) and lengthening them risks claim() refusing the line the main thread just rescued. Fix only the caption that labels a specific drawn column: at src/js/views/forge.js:6375 change `const txt = sh.label + ' · ' + sh.count;` to render the head when it is a head, e.g. `const txt = sh.label + ' · ' + (sh.shown < sh.count ? sh.shown + ' OF ' + sh.count : sh.count);` — same width class, no new claim() pressure, and it closes the one mute case (Vedic's `MORE · 66` over 48 glyphs). Optionally add a single low-priority line under the right rail's last shelf reading `+ N MORE ON THE CROWN` gated on `rl.overflow`, so the remainder gets a voice without touching the header's collision budget.

### [minor] `GUEST-4` — src/js/views/forge.js:2025
**leaveHouseState() tears down the house without restoring the guest snapshot — the 'restored exactly once' invariant survives only because rebuildForMode happens to replace local.mode wholesale**

**Evidence.** The single documented exit from house state clears the five house fields and none of the four guest fields:

  2025:  function leaveHouseState() {
  2026:    local._isolateFamily = null;
  2027:    local._house = null;
  2028:    local._layoutMix = null;
  2029:    local._houseTravel = null;
  2030:    local._housePosBDirty = false;
  2031:    local._housePortCounts = null;

`_houseModeSnapshot`, `_houseGuests`, `_houseGuestIds` and `_houseGuestSig` are left set and `local.mode` is left AUGMENTED. It is called from destroy() (2098) and from rebuildForMode's preamble (2962) — and in the rebuildForMode case `local.mode` is not replaced until line 3782, ~800 lines later, after `camera.fitToExtent` has emitted onChange (which the file's own comment at 3652 notes can fire a rebakeNodes on the old mode). During that window packModeNodes still sees a live snapshot (houseGuestState's `s.mode !== local.mode` guard is still satisfied) and still packs the guests. `local._houseRepackPending` is likewise never cleared here, so a pending flag can survive into the next mode and fire one spurious rebake from tickLayoutMix.

**Failure.** Not corruption today — the wasted rebake is discarded when local.mode is swapped at 3782, and the identity guard drops the stale snapshot on the next houseGuestState() call. It is a latent hazard and a memory retention: after leaving the Forge view from inside 'Other', `local._houseGuests` pins 2,336 node objects and `_houseModeSnapshot` pins the whole previous nodes/edges/positions/adjacency set until a house is entered again. The moment anyone makes a relayout path mutate local.mode in place instead of replacing it (a viewport-cull v2 re-cull, a preserveZoom relayout), the wheel is rebuilt from an augmented node list and the guests become permanent wheel residents.

**Fix.** Add `try { restoreModeSnapshot(); } catch (_) {}` and `local._houseRepackPending = false;` to leaveHouseState() before the tint clear, so the one documented exit really is one exit. restoreModeSnapshot is already idempotent (it nulls the snapshot first), so this cannot double-restore against the settleHouse path.

### [minor] `EDGE-3` — src/js/views/forge.js:7403
**startHouseTravel's new guard tests array LENGTH, not instance identity — two same-sized families still lerp mismatched instances, now including the bone and external-class lanes**

**Evidence.**   7403:  if (cur.nodePosB.length !== next.nodePosB.length
  7404:      || cur.edgePosB.length !== next.edgePosB.length) {
         ... take the new house whole ...

The commit's own reasoning is identity-based — "index i is a different node on each side, so there was never anything to lerp" — but the implemented test is equal length. Measured over data.js: Rabbinic and Mystery each have 11 guests and 7 guest edges, so both give nodePosB 1023*4 and edgePosB 4749*6 floats while appending completely different guest ids. The guard passes and the per-instance lerp at forge.js:7301-7305 runs across the mismatch. That lerp now also walks the two new lanes: lane 4 (bone weight, ±1.0/±0.5) crosses through 0, and lane 5 (external class, integer 0/1/2) passes through fractional values that `step(v.layout_mix.w, in.ext_class)` reads as real thresholds.

**Failure.** Isolated in the Rabbinic house, click the Mystery title (or its port). Lengths match, so the tween runs: for 450 ms each guest instance is dragged between two unrelated nodes' positions, an arc that is primary on one side and absent on the other bows through flat, and a wire whose class goes 0→2 passes through 1, so with rest wires at 'off' (threshold 1) an in-house wire is briefly hidden and a foreign wire briefly shown. Transient and family-specific, but it is the same wrong-mapping bug the length guard was added to prevent.

**Fix.** Compare identity, not size: keep the wheel's instance signature on the house object (e.g. the guest signature `local._houseGuestSig` already computed in augmentModeForHouse, or `next.fam === cur.fam`) and lerp only when the pack is genuinely the same instance→id mapping — in practice, only for a same-family dial morph. Any family change should take the new house whole, which is what the layout_mix ramp is for.

### [minor] `court-spine-names-can-never-print` — /Users/redacted-user/Desktop/PRODUCT DEVELOPMENT/Codex Atlas/src/js/views/forge.js:6398
**Every COURT shelf's spine name is refused by the shelf caption the same function placed 7px earlier**

**Evidence.** // captions, first loop:
if (claim(cx0, cp.y, w + 4)) {          // cp = W2S(rl.x, sh.capY)
// spine names, second loop over the SAME shelves:
const it = sh.items.find(x => x.id === sh.spineId) || sh.items[0];
const sp = W2S(rl.x, it.y);
if (claim(cx0, sp.y, w + 4)) {

familytree.js:723-731 lays a shelf out as capY = y + capH/2, then y += capH + pad, then the first item — so item[0] sits capH/2 + pad = 10.5 WORLD UNITS below its own caption. At the house camera (camScale ~0.66-0.74, the fit onto worldExtent 2*(540+70)) that is 6.9-7.7 SCREEN px, and claim() refuses anything within 15px. The x test always passes: caption cx0 and spine cx0 differ by |1 + (Wcap-Wspine)/2|, which is always < (Wcap+Wspine)/2 + 4.
kindShelves (familytree.js:658-662) sorts each kind descending by degree and the spine picker is `if (d > bd)` — so on the COURT the spine is ALWAYS items[0].

**Failure.** Measured on the real data.js at three viewports (min-dim 800 / 900 / 1000 px):
  Greek COURT — PERSONS(57), SYMBOLS(25), MUSICS(14), PHILOSOPHIES(14), MORE(27): spineIdx=0 on all five, gap 10.5wu = 6.9-8.6px. All five suppressed at every viewport.
  Same for Norse COURT (4/4), Egyptian COURT (5/5), Mesopotamian COURT (5/5), Christian COURT (1/1).
  SCRIPTORIUM is hit too wherever the spine lands at index 0 or 1: Greek 3/3 suppressed at 900px, Norse 1/1, Egyptian 2/3, Mesopotamian 2/4, Christian 1/5.
So 'one spine name per shelf (its highest-degree member, whole title)' — the comment at 6357-6359 — has never rendered on any COURT rail, on any family, at any viewport. It needs a min-dim of ~1744px to clear 15px for an index-0 spine. Same defect class as the two the main thread fixed this session (crown line 2 at 13px, rail headers at 14px), and invisible for the same reason: the promised string had no data behind it until this batch.

**Fix.** Use the same remedy the main thread already applied twice in this batch - a SCREEN-space row pitch, not world geometry (precedents: `const CROWN_ROW = 17` at forge.js:6186 and `const hy = top.y - 22` at forge.js:6262). The spine name has no leader line and does not point at its glyph, so it does not need to sit at the item's world y. Two options at that altitude: (i) fold the spine into the caption string the loop already draws - `PERSONS · 57 · ZEUS` - one claim, one row, zero new collision surface; or (ii) keep two rows and anchor the spine at `cp.y + 17` (the caption's own screen y plus one clear row) instead of `W2S(rl.x, it.y).y`, which clears the 15px band by construction at every zoom and every viewport. While in there, widen the spine's x offset from 9 to at least 11 so its clearance from the obstacle column (forge.js:6244, `claim(top.x, y, 14)`) stops being an exact tie decided by float rounding - `9 + w/2` vs threshold `w/2 + 9` - and comment both that constant and the caption's 10. Then add the assertion to scripts/check-familytree.mjs: for every shelf on both rails, at the house fit scale `min(vp)/(2*(Rh+70))`, the caption->spine screen gap must exceed 15px.

### [minor] `rail-obstacle-column-blocks-the-rails-own-names` — /Users/redacted-user/Desktop/PRODUCT DEVELOPMENT/Codex Atlas/src/js/views/forge.js:6248
**The rail obstacle column blocks the REACH/wake name of every rail item — 0 of 463 slots can ever show a title**

**Evidence.** for (let y = oy0; y <= oy1; y += 22) claim(top.x, y, 14);

`top.x` is W2S(rl.x, ...).x — the rail's screen x. A rail item's world x IS rl.x (familytree.js:726 `positions.set(n.id, { x, y })`), so its screen x from camera.worldToScreen is byte-identical to top.x. The name pass tests `Math.abs(s.x - P[0]) < (wpx + P[2]) / 2` (5978) → |0| < (wpx+14)/2, always true; and `Math.abs(ly - P[1]) < 15` against obstacles spaced 22px apart → the worst case is 11px. The obstacles are claimed in the HIGH half, before every name.
The RAILS commit states the opposite: 'Guests are excluded from RANK candidates … and stay in the REACH/wake path, which is the toy's "titles arrive when the pointer approaches the rail", for free.' rankSkip (5883-5885) removes them from RANK, so REACH is their ONLY label path — and REACH is the path the obstacle column closes.

**Failure.** Replayed the exact placement arithmetic over the real data.js at 1440x900 (r floor 5wu from house_rail_hit, bubble 1.05, KEEPOUT 52/58):
  Greek SCRIPTORIUM  24 slots, 10 obstacles → 24 blocked, 0 can print
  Greek COURT       137 slots, 23 obstacles → 137 blocked, 0 can print
  Christian SCRIPTORIUM 125 → 125 blocked;  Christian COURT 150 → 150 blocked
  Norse SCRIPTORIUM   2 → 2 blocked;        Norse COURT 25 → 25 blocked
463 of 463 rail slots, zero names. Hovering a rail glyph shows nothing either: priority (hovered = 4000+3000) only reorders the candidate list, it does not let a name beat a rect already in `placed`. So the rails are 463 anonymous dots plus, per shelf, a caption and a spine name that itself never prints (see court-spine-names-can-never-print). The user's stated promise — pointer approaches the rail, titles arrive — is unreachable.

**Fix.** The proposed fix is at roughly the right altitude but option (2) is wrong: "claim only the gaps between shelves" re-opens the column to the deity names the obstacles exist to exclude. Option (1) — tag the obstacle rects and skip them when the candidate is in houseGuestIdSet() (forge.js:6809) — works but then the name lands centred ON the column of glyphs it belongs to, overprinting its neighbours' dots.

The cheaper fix already has a proof in the same file: give a woken rail guest the OUTBOARD name position its spine sibling uses (renderHouseChromeLow, forge.js:6392-6396 — lx = sp.x ∓ 9, rect centre offset 9 + w/2, which clears the 14-wide obstacle at exactly the strict inequality). I.e. in the name pass at forge.js:5969-5970, when the candidate is a rail guest, place the name beside the rail (side = rl.side) instead of above the glyph. That keeps the obstacle column intact for deity names, needs no rect tagging, and lets the existing 15 px y-rule thin the woken column naturally (~1 name per 15 px, which is the readable density anyway).

Either way the acceptance test the claim asks for is the right one, with one addition: assert BOTH that a woken Greek rail guest can claim a rect AND that the wheel's placed-rect fingerprint outside a house is byte-identical (law 3).

### [minor] `CR-5` — src/js/views/forge.js:6375
**Shelf caption prints the shelf's true count over a truncated glyph run — "PERSONS · 199" above 150 dots**

**Evidence.** forge.js:6374-6375 —
  for (const sh of rl.shelves) {
    const cp = W2S(rl.x, sh.capY);
    const txt = sh.label + ' · ' + sh.count;
familytree.js:718-721 sets `count: g.count` (the FULL group size) alongside `shown: g.items.length` (the truncated one), and the chrome prints `count`. `shown` is available on the same object and never used by the renderer.

**Failure.** Christian court: the caption "PERSONS · 199" sits directly above a ladder of exactly 150 glyphs. Other: "PERSONS · 555" above 150 glyphs. Vedic: "MORE · 66" above 48. The count is true of the vault but false of the thing it labels, and it is the one number a reader can check by eye. It also silently changes what the shelf's spine name means: for a capped shelf, `spineId` is the highest-degree of the SHOWN items only (familytree.js:726-730 iterates `g.items` after the slice), so "jesus-of-nazareth" is the head of 150, not of 199.

**Fix.** Print `sh.shown` when it differs from `sh.count`, e.g. `PERSONS · 150 of 199`. Same object, no new data.

### [minor] `CR-6` — src/js/views/forge.js:6312
**Era-rank caption prints a single year for a bucket spanning up to 800 years**

**Evidence.** forge.js:6312 — `if (ranksEra) return (rm.dmin == null) ? null : fmtD(rm.dmin);`
rowMeta carries both bounds (familytree.js:605-610 sets `dmin` and `dmax`), and the layout already ships a range formatter — `fmtRange(a, b)` at familytree.js:625 — which the doc shelves use. The rank captions use only the minimum. The commit message defends the era branch as the honest one ("dates are reserved for ranks='era' where rank IS monotone in date"); monotone across rows is true, but the caption presents a bucket as a point.

**Failure.** With house_ranks = 'era' (a shipped LAB dial): Vedic row 5 captions "200 CE" over 16 deities dated 200 CE to 1000 CE; Vedic row 4 captions "700 CE" over 26 deities spanning 700 BCE to 100 CE — an 800-year band labelled with one year. Norse row 3 "400 CE" spans 400–700 CE. A reader tracing the gutter reads a date axis with 800 years of error per row.

**Fix.** Use the existing `fmtRange(rm.dmin, rm.dmax)` for the era caption, exactly as the Scriptorium shelves already do.

### [minor] `mode-nodes-mutation-leaks-into-search` — src/js/views/forge.js:6907
**Entering a house mutates local.mode.nodes in place, so the search corpus silently changes with the isolate**

**Evidence.** augmentModeForHouse writes the union straight onto the shared mode object — forge.js:6907-6913:
  m.nodes = nodes;
  m.positions = positions;
  m.nodesById = nodesById;
  m.edges = base.edges.concat(extra);
  m.adjacency = graph.buildAdjacency(m.edges);

src/js/forge/search-autocomplete.js:17-19 reads that object live:
  function modeNodes() {
    return (local.mode && local.mode.nodes) || [];
  }
The timeline scrubber was already hardened against exactly this (timeline-scrubber.js:72 reads window.VAULT_DATA.nodes, comment: 'bounds are now VAULT-WIDE, not mode-specific'); search was not.

**Failure.** In Deities mode, search 'derveni' on the wheel: no result (it is a document, outside the mode). Enter the Greek house and search again: it now appears, and picking it locks a node that is either a ~4-world-unit rail glyph or — if it fell past the 150-slot rail cap — a radius-0 node parked at the crown, so the camera flies to the crown and there is nothing there. In 'Other' the mutation adds 2,336 nodes to the search corpus for as long as the house stands.

**Fix.** Give the guests their own lane instead of mutating the shared mode object — keep m.nodes canonical and hand the union only to packModeNodes / buildHouse — or, cheapest for now, make search-autocomplete read the un-augmented set via the snapshot (`local._houseModeSnapshot ? local._houseModeSnapshot.nodes : local.mode.nodes`), the same way the scrubber was fixed.

### [polish] `chip-reserve-miscentred` — /Users/redacted-user/Desktop/PRODUCT DEVELOPMENT/Codex Atlas/src/js/views/forge.js:6224
**The CASCADE/FAN registry reserve is centred on the crown but the chips are not, so the left ~7px of CASCADE is unprotected**

**Evidence.** const wCas = ctx.measureText('CASCADE').width + 12;
const wFan = ctx.measureText('FAN').width + 12;
claim(cs.x, chipY, wCas + wFan + 22);   // best-effort reserve; the control shows regardless
...
chips[ci].setAttribute('x', (isCas ? cs.x - 8 : cs.x + 8).toFixed(1));

CASCADE is text-anchor:end at cs.x-8, FAN is text-anchor:start at cs.x+8, so the pair's real bounding box runs [cs.x-8-Wcas, cs.x+8+Wfan] — centred at cs.x + (Wfan-Wcas)/2, roughly 17px LEFT of cs.x. The reserve is centred on cs.x. The measurement also uses ui-monospace/SF Mono/Menlo on the canvas while the chips render in var(--mono, 'JetBrains Mono') at 0.18em tracking (app.css:8001-8013) — a different typeface from the one being measured.

**Failure.** At 600 9px mono, CASCADE measures ~38px (+12 = 50) and FAN ~16px (+12 = 28); the reserve spans cs.x±50. The rendered CASCADE actually starts at cs.x-57, so ~7px of its first glyph sits outside the reserved rect and a deity name or a GEN caption placed later in the same pass can legally land on it, while ~21px of empty space to the right of FAN is reserved for nothing. Cosmetic today because the crown region is usually empty, but it is the one place in the house where painted text is not fully covered by the registry.

**Fix.** Reserve the rect the chips actually occupy: centre at cs.x + (wFan - wCas) / 2 with width wCas + wFan + 16 + pad. Better still, measure once against the chips' own CSS font (or read getComputedTextLength off the SVG text nodes after the first paint and cache it) instead of approximating the tracking with a +12 constant.

### [polish] `chip-family-colour-goes-stale` — /Users/redacted-user/Desktop/PRODUCT DEVELOPMENT/Codex Atlas/src/js/views/forge.js:6215
**The crown chips keep the previous family's colour when the new house's hull has no colour**

**Evidence.** for (const h of (hd0.hulls || [])) {
  if (h.family === house.groupKey) {
    if (h.color) chipsG.style.setProperty('--family-color', h.color);
    break;
  }
}

**Failure.** Both guards are silent no-ops: if the isolated group is absent from m.hullData.hulls (a grouping whose key space differs from the hull key space — isolateGroupOf routes through local.mode.isolateGroupBy, forge.js:6721) or its hull carries no colour, the inline --family-color set for the PREVIOUS house stays on the group. Port travel from a coloured family into such a house leaves CASCADE/FAN wearing the wrong family's colour, which on this crown reads as 'you are still in the old house'. The CSS fallback var(--family-color, #888) cannot help — the property is already set inline.

**Fix.** Make the miss explicit: resolve the colour into a local, then either setProperty it or removeProperty('--family-color') so the #888 fallback takes over. One line, and it turns a silent wrong-colour into a visible neutral.

### [polish] `hint-line-second-collision-implementation` — src/js/views/forge.js:6465
**renderHintLine re-implements claim() instead of using it — a second copy of the collision math outside the one registry**

**Evidence.** The exit line used to go through the shared `claim` closure inside renderHouseChrome. It now open-codes it (forge.js:6464-6474):
  let ok = true;
  for (let k = 0; k < placed.length; k++) {
    const P = placed[k];
    if (Math.abs(vp.w / 2 - P[0]) < (w + P[2]) / 2 && Math.abs(hy - P[1]) < 15) { ok = false; break; }
  }
  if (ok) {
    placed.push([vp.w / 2, hy, w]);
houseChromeEnv's claim (forge.js:6088-6096) uses the same 15px rule but ALSO enforces yOK (the KEEPOUT_TOP / KEEPOUT_BOTTOM bands). The hint's y sits inside the bands today, so the two agree — but there are now two definitions of 'does this rect collide', and only one will be updated when the keep-out law changes.

**Failure.** Someone tunes the 15px separation or the keep-out bands in houseChromeEnv (the crown pitch fix in this very diff was exactly that kind of edit) and the hint line silently keeps the old rule — overlapping a name, or refusing a slot no other label would refuse — with no test catching it, because lastPlacedRects only asserts the final list.

**Fix.** Hoist claim/halo out of houseChromeEnv into one helper that both chrome halves and renderHintLine call, so the 15px rule and the keep-out bands have exactly one definition (law 5's actual point).

## Refuted

- **GUEST-1** — rebakeNodes bakes edgePosB against the STALE edge pack, so travelling into a larger house overruns the GPU buffer — the same crash the commit claims to have fixed, one layer up
  - The code citation is accurate — bakeEdgePosB (forge.js:7010) sizes E from m.edgePacked.instanceCount, and rebakeNodes bakes at 9589 while the pack is only replaced at 9661 (rebakeEdges, called from 9656). I also independently reproduced the claim's data numbers against the real data.js (base 4,742; Norse 4,849; Greek 5,268; Christian 5,845; Other 7,127), which match the commit's own live counts. B

- **EDGE-1** — Travelling into a house with more guest edges throws `writeBuffer: bytes to write is too large` — the same crash class the main thread fixed, at a second site
  - The claim's code reading is accurate and its edge-count arithmetic reproduces exactly against the real data.js (I computed base renderable 4742; Norse 4849 / Greek 5268 / Vedic 5521 / Christian 5845 / Other 7127 via filterNodesByMode('deities') + augmentModeForHouse's own `extra` law). forge.js:7010 does read `m.edgePacked.instanceCount`, m.edgePacked is assigned only at forge.js:9661 inside rebak

- **CR-2** — Horizon port counts are computed over the wheel-mode edge set, not over the 241-member house the crown claims — Greek shows 30.5% of its real external wires, and the number changes with the mode you entered from
  - The claim's code reading is accurate and its measurements reproduce (I ran a read-only probe over the real data.js: Greek/deities horizon = 774, vault boundary of the 241 members = 2,536; Other 1/772, Egyptian 80/236, Roman 107/138, Hermetic 6/83, Islamic 1/83). One numeric slip: Roman DOES get a port in Documents mode (count 7), it is simply outside the top-6.

But the failure it alleges is not e

- **wire-hot-px-not-house-gated** — wire_hot_screen_px ships at 2.5 and is NOT house-gated, so hovered wires on the plain wheel got 25% wider and the wire_max_screen_px dial no longer caps them
  - The claim's code reading is accurate — webgpu.js:816 `let hot_px = max(v.wire_min_screen_px, v.glyph_params.z);` carries no `hx` term while bone_px does, viewData[46] (webgpu.js:2005-2006) is written unconditionally, forge.js:4455 passes it unconditionally, and forge.js:591 ships `wire_hot_screen_px: 2.5`. So hovered wheel wires do gain a 2.5 CSS px floor. But that is the RATIFIED behavior, ruled 

## Lens notes (what was checked and found clean)

### rails-correctness
CLEAN — verified from source, not asserted:

· STATE LEAKS: none. Every writer of the snapshotted fields allocates fresh containers — `nodes = base.nodes.concat(guests)` (forge.js:6891), `positions = new Map(base.positions)` (6892), `nodesById = new Map(base.nodesById)` (6894), `m.edges = base.edges.concat(extra)` (6909), `m.adjacency = graph.buildAdjacency(m.edges)` (6910). Nothing in the app mutates `mode.positions` / `mode.adjacency` / `mode.nodes` / `mode.edges` in place while a house stands (the only other writer in the file is `local.mode.nodesById = modeNodeById` at 3962, inside rebuildForMode which replaces `local.mode` wholesale). adjacency.js only ever builds a new Map. So `restoreModeSnapshot()` returns the pre-enter wheel by reference, uncorrupted.

· DOUBLE AUGMENT: correct. `const base = prev || {...}` (forge.js:6868) takes the snapshot from the LAST snapshot when one exists, so A→B re-stores A's original, never A-augmented. `houseGuestsOf` builds its `inMode` set from `s ? s.nodes : m.nodes` (6822), so B's guest set is resolved against the un-augmented wheel too. Entering B from A cannot bake A's guests into the wheel.

· STALE-SNAPSHOT GUARD: `houseGuestState()` (6796) compares `s.mode !== local.mode` and self-clears. `local.mode` is assigned in exactly one place (3782), a fresh object per rebuild, so the identity check is sound — a mode/class/lens/timeline-layout switch can never restore a snapshot onto the wrong wheel.

· DOUBLE RESTORE: impossible. `restoreModeSnapshot()` nulls `_houseModeSnapshot` before returning, so a second call returns false and is a no-op. settleHouse's restore is additionally gated on `value===0 && target===0 && !_isolateFamily` (7320).

· TIER PERCENTILES: the claim holds. `packModeNodes` (6924) calls `graph.packNodes(s.nodes, s.positions, degBase, …)` where `degBase = layout.computeDegree(s.nodes, s.edges)` — packNodes builds its classifier with `buildTierClassifier(nodes, degree)` over exactly that list (node.js:136), and the exported `tierFor: npBase.tierFor` (6957) is the wheel's ladder. Guests are a second `packNodes(guests, …)` block appended after, with `npG.data[i*8+2] = 0` (6941) — offset 2 is the radius lane (node.js:210). The disk vertex shader scales the quad by `inst_radius` (webgpu.js:248), so r=0 is a degenerate quad: genuinely nothing on screen.
  One nit, not a defect: `const deg = new Map(degAll); for (const [id,d] of degBase) deg.set(id,d);` (6949-6950) — computeDegree omits zero-degree nodes (radial.js:823), so a wheel node with degree 0 on the wheel that gains a guest edge keeps the AUGMENTED degree in `deg`, and its `hitNode.tier` (label rank) shifts while the house stands. Radii are unaffected (they come from npBase) and the exit re-pack is clean, so this is inside-the-house only.

· EXIT PATHS: empty click (8911), Escape (4868 via _houseEscRef), family-title click (4856), port travel (9074), destroy (2098), mode/class/lens switch (2962) all converge on either `setIsolateFamily(null)` → mix ramp → settleHouse → restore-once, or on `leaveHouseState()` + a wholesale `local.mode` replacement. Resize (4231) and the zoom-drift re-pack (2740) call rebakeNodes with the count unchanged and are safe. `_houseRepackPending` (7285/7338) correctly defers the final wheel pack until the camera lands, which is what makes the exit byte-identical.

· DETERMINISM: `houseGuestsOf` sorts by id (6832); packNodes/computeDegree/buildAdjacency are pure functions of their inputs; the exit re-pack is the plain single-block branch with the same node list, position map and camScale. Byte-identical exit holds.

Findings below are the four places the lens did NOT come back clean.

### wires-shader
WHAT I CHECKED AND FOUND CLEAN

BUFFER LAYOUT (4→6 floats). Verified end to end and it agrees everywhere: the sole producer is bakeEdgePosB (`src/js/views/forge.js:7011` `const out = new Float32Array(E * 6);`, lanes written at `:7029-7034`); the pipeline stride is 24 with attributes at offset 0 (float32x4, loc 5) and offset 16 (float32x2, loc 6) (`src/js/engine/renderer/webgpu.js:1399-1402`); vs_main's parameter list is in the same order with no duplicated or skipped shaderLocation (`webgpu.js:733-741`, locations 0..6); ensureBuffer is asked for `edgeCount * 24` and writeBuffer for `edgeCount * 6` elements (`webgpu.js:2167-2172`). No other pipeline binds edgePosBVbo (only `webgpu.js:2191`). The View UBO is still coherent: `new Float32Array(76)` = 304 bytes = `VIEW_UBO_SIZE` (`webgpu.js:1223`, `:1976`) and matches the WGSL struct (64 header + 112 palette + 16 glyph_params + 96 recipe pads + 16 layout_mix); the two newly-live lanes are 46/47 and 74/75, which were previously written as zeros.

HONEST ZEROS. With no isolate `layout_mix.x` is 0 and every new term collapses exactly: `p1 = mix(origin_p1, bone_p1, is_bone * hx)` with t=0 returns origin_p1 bit-exactly because bone_p1 is always finite (perp_u is select-guarded, so no NaN/Inf can be multiplied by 0); `bone_px = layout_mix.z * is_prim * hx` = 0; `ext = ... * v.layout_mix.x` = 0, so `hidden` reduces to the pre-07-31 `step(1.5, in.state)`. The idle width path is also unchanged: at `st_w = 0`, `w_lo = wire_min` and `w_hi = max(wire_max, wire_min) = wire_max`, i.e. the old clamp. The lane itself is zero-filled (`new Float32Array(E*6)`, lanes only written when `bn` exists), and stale lane data left in the VBO after an exit is neutralised by mix 0.

WGSL CORRECTNESS. Both `select()`s take genuine bool conditions (`clen > 1e-6`, `tlen > 1e-9`) and both fall back to defined constants, so the ~2,000 zero-length isolate wires degenerate to zero area instead of NaN. No uninitialised reads. `st_w = clamp(inst_state, 0, 1)` before the width mix, so a HIDDEN state (2.0) cannot extrapolate the width band. `w_hi = max(v.wire_max_screen_px, w_lo)` makes an inverted clamp impossible at any dial setting. Units are consistent: wire_min/wire_max/wire_hot/house_bone_px are all multiplied by dpr (FB px), house_arc_sag deliberately is not (a world-space chord fraction).

CONTENT SAFETY. The tier / political-risk filter is not resurrected: `hidden = max(step(1.5, in.state), ext)` (`webgpu.js:885`) can only ADD hiding, never remove it, and `ext` is independent of edge state ordering. `applyEdgeHiddenFilters` is faithful to the block it replaced (`if (!tierFilterOn && showPolitical) return;` is the exact negation of the old `if (tierFilterOn || !showPolitical)`), and it now runs before `applyHouseBonesOverride` at BOTH edge-target sites (`forge.js:7744`/`:7748` and `:9677`/`:9680`); `put()` refuses any target already ≥ 1.5. The third target site (`forge.js:3900`) is an all-zeros alloc in rebuildForMode, unchanged by this batch.

HOVER REACH WITH rest-wires=off. Safe. `computeEdgeStates` (`src/js/engine/graph/adjacency.js:100`) marks an edge hot when BOTH endpoints are in focusedSet, and focusedSet is hover ∪ 1-hop, so a member's own external wire is hot on hover; `ext` is multiplied by `(1.0 - smoothstep(0.55, 0.95, vis_state))`, which reaches 0 before the wire is fully hot. A member↔non-member wire is therefore hidden at rest and handed back on hover, as claimed.

ONE DESIGN NOTE, NOT A FINDING. `wire_hot_screen_px` ships at 2.5 CSS px = 5 FB px at dpr 2, which is above `wire_max_screen_px` (2 CSS = 4 FB). Because `w_hi = max(wire_max, w_lo)`, every fully-hot wire ON THE WHEEL is now pinned to exactly 2.5 CSS px at all zooms instead of clamping into [1, 2]. Idle is byte-identical, so this is not a Law-3 violation, but the change is wheel-wide while the commit message justifies it from the house camera — worth John seeing on the wheel, not only in a house.

### chrome-registry
CLEAN, verified by reading and by measuring against the real data.js:

- LAW 5 (ONE REGISTRY) holds as a law. renderHouseChrome / renderHouseChromeLow are called from renderLabelsCanvas only (forge.js:5955, 5991), with its live `placed` array, and houseChromeEnv's claim() (forge.js:6091-6098) is byte-identical collision math to the name pass (forge.js:5978) and the leaving-name pass (forge.js:6011). No second canvas, no second collision list. Every push into `placed` in the house path goes through a collision test — I checked all five push sites (5933 seed, 5981, 6015, 6096, 6464); the audit's `lastPlacedRects-overlap-invariant-broken` is genuinely fixed, the rail obstacles now route through claim() (6248). With populated rails the published list has no overlapping pairs.
- ctx STATE: houseChromeEnv saves font/textAlign/textBaseline/lineWidth/fillStyle/globalAlpha (6082-6086) AFTER the only early return, and both halves have exactly ONE exit through env.restore() (6355, 6417). I grepped every ctx mutation between those lines: strokeStyle and letterSpacing are never touched by house chrome, and renderLabelsCanvas' own letterSpacing set/reset brackets every `continue`. renderHintLine captures `saved` after its `if (!txt) return`, before any mutation (6444-6451). Clean.
- THE CROWN STACK arithmetic is now correct on every rung, and I re-derived all of it: syncHulls publishes exactly ONE title rect in the house, at the crown point (forge.js:5311-5314), so line1 at +17 clears the title by 17, line2 at +34 clears line1 by 17, the chip reserve at +51 clears line2 by 17. Both rail headers at top.y-22 clear the first obstacle at top.y by 22. Shelf captions clear the obstacle column by exactly 1px in x, spine names by exactly 0px (`<` is strict) — both pass, but they are one-pixel constants with no comment saying so.
- CHIPS: click handler is bound once per group creation, and the only thing that detaches the group is rebuildHullElements' `hullLabelsG.innerHTML = ''` (4911), after which ensureHouseChips (6486) rebuilds it — old node and old listener are collected together, no leak, no per-paint rebind. syncHulls' label loop is bounded by `i < data.hulls.length` so it never walks into the chips group appended after the labels. CSS gating is correct: `.forge-hull-label:not(.is-isolated)` cannot match `.forge-house-chip`; fv-house-flight kills the whole overlay mid-flight; leaveHouseState (2025-2034) clears fv-isolated on both exits so the chips die with the house.
- PERSISTENCE: forge.viewSettings.v7 key unchanged, no migration, no schema bump. setHouseGeometry (view-settings.js:271-279) writes the same `state` object with the same JSON.stringify(state) call the old radio path used via applyState (191). Deleting `map` from the defaults is harmless — no consumer survives. LAW 8 satisfied: the VIEW House rows, the `map` toggle and fv-hide-map are deleted from the live tree, not hidden (forge.js:1261-1264, 1300-1307; view-settings.js:85-87).
- The hint line's wheel string is correctly gated on house_hint_line (LAW 3) and the house's exit string is correctly ungated.

Scratch scripts used (read-only, in the session scratchpad, nothing written to the repo): spine.mjs, mode.mjs, reach.mjs — each loads the real data.js + familytree.js and replays the placement arithmetic.

### canonical-honesty
Probes (read-only, over the real 47MB data.js, mirroring forge.js's houseGuestsOf/augmentModeForHouse/buildHouse exactly): /private/tmp/claude-501/-Users-redacted-user-Desktop-PRODUCT-DEVELOPMENT-Codex-Atlas/f9d10bcf-51bf-4d55-934f-699d1ffb5d8a/scratchpad/canon-probe-lensC.mjs, canon-probe2-lensC.mjs, canon-probe3-lensC.mjs.

CLEAN — verified equal to the vault:
· Crown line 2. `st.docs`/`st.court` = the family's true document / non-deity-non-document member counts. Greek 24/137, Christian 125/330, Norse 2/25, Vedic 48/168, Other 19/2317, Chinese 24/66. Query: NODES.filter(family===F && type==='document'|else). Matches on every family tested.
· Rail header counts. `rails.left.count === stats.docs` and `rails.right.count === stats.court` on all six families — the cap never touches `count` (familytree.js:716 `count: T`), exactly as the commit claims. shown + overflow === count everywhere.
· stats.tree + stats.docs + stats.court === stats.members on every family.
· `kinArcs` — 96 Greek / 20 Norse / 3 Christian / 0 Chinese; every one resolves to a real `parent-of`/`child-of` vault row between two tree members, post-dedupe and post-cycle-break (cycle guard fires 0 times). The crown's arc count and the lifted bones are now the same population — that part of commit f0de897 holds up.
· `orphanCount` ("N STAND ON THEIR ERA") — counts tree members with zero parents AND zero children after aspect augmentation, and those are exactly the members whose rank is set by `rank[i] = eraRank(i)` (familytree.js:365). The wording is true.
· Port label vs port disc: `housePortVisibleCounts()` and the layout's `portWeights` agree exactly with no LEGEND filter (Roman 107/107, Egyptian 80/80, …) — the two are consistent with each other. (Whether they agree with the *vault* is finding CR-2.)
· Shelf spine really is the highest-degree member of the items on its shelf — zero mismatches across Greek / Christian / Other, both rails. (Caveat folded into CR-5 for capped shelves.)
· "THE SCRIPTORIUM — N DOCS": N is genuinely `type==='document'`, and the shelf ladder's era-range captions (`fmtRange`) match their items' first/last date.
· Guest overflow parked on the crown is genuinely invisible in the deities wheel: no radii entry ⇒ bakeNodePosB (forge.js:6982) falls back to the wheel radius, which packModeNodes zeroed for guests. Measured 0 parked items with a nonzero radius on Christian(180), Vedic(18), Other(2167).

NOT REPORTED (pre-existing, untouched by this diff): orphan domain captions produce zero captions on Greek/Vedic/Egyptian because `domains[0]` is free text ("childbirth and midwifery"), so three orphans in one row never share a key — the feature is inert rather than wrong.

### regression-and-laws
SCOPE READ: full diff of src/js/views/forge.js (1685 lines), engine/renderer/webgpu.js, engine/layout/familytree.js, forge/view-settings.js, forge/lab-panel.js, edge-buckets.js, styles/app.css, index.html, scripts/*. Ran both new harnesses (check-familytree.mjs, check-house-wires.mjs) — ALL CHECKS PASS. Ran three read-only node scripts over the real data.js to quantify guest/edge counts per family and per mode.

CLEAN — REST IS STILL (law 4). The only new loop-keeper-shaped code is the deferred re-pack at forge.js:7285-7288. It cannot keep the loop alive: `alive` is never set by it, it self-clears `_houseRepackPending` on the first hit, and `camera.tick()` runs BEFORE `tickLayoutMix()` in animTick (forge.js:6628 vs 6663), so the frame the fly lands is the frame it fires. It also gets its repaint for free — rebakeNodes ends in rebakeEdges (forge.js:9656) which ends in drawFrame — and the `startAnimLoop()` inside rebakeEdges is a no-op mid-tick because `local.animRafId` is still non-null during animTick. `startHouseTravel`'s new snap branch (forge.js:7402) calls startAnimLoop but is immediately followed by a real `setLayoutMixTarget(1)` ramp. No new `alive = true` path.

CLEAN — deleted VIEW rows / "coming soon" row (law 8). No dangling callsites anywhere: `fv-hide-map` survives only in three explanatory comments (view-settings.js:85, _bundle.js:2912, forge.js:8518); no `data-toggle="map"` markup, no `data-house` VIEW rows, the `map:false` default key is gone from view-settings.js and the toggle handler is generic so a stale persisted `map` key in forge.viewSettings.v7 is inert. `setHouseGeometry` persists to the same LS_KEY, so the ONE-owner contract holds.

CLEAN — leaveHouseState(). Both callsites (destroy at forge.js:2094, rebuildForMode preamble at 2953) are gated on `houseStateDirty()`, which also self-heals a stale body class; running it twice is idempotent and the ground `setTint(null)` repaint cannot fire on a plain mode change with no house. `_houseEscRef` is set per mount inside ensureHullStructure (whose `hullDefs` guard is a per-mount `let` inside render, so the body does run once per mount) and nulled in destroy. It does not clear `_houseModeSnapshot`, but `houseGuestState()` self-invalidates on mode identity (forge.js:6797), so no stale snapshot can be restored onto a new wheel.

CLEAN — shader honest zeros for the two new lanes. `p1 = mix(origin_p1, bone_p1, is_bone * hx)` and `ext = step(...) * v.layout_mix.x` both multiply by layout_mix, edgePosB is zero-filled and never uploaded with no house, and the `normalize(tan)` → `select(...)` swap is value-identical wherever the tangent is real. `houseRestMinClass` is passed unconditionally but is inert at mix 0.

CLEAN — bundle. I regenerated src/js/forge/_bundle.js from its 15 sources into the scratchpad with the exact byte sequence of scripts/build-forge-bundle.sh and diffed: BUNDLE IDENTICAL.

CLEAN — performance. Nothing on the enter path is O(n^2): houseGuestsOf is O(V) + O(G log G), augmentModeForHouse is O(E), buildAdjacency O(E), packModeNodes O(N log N) in two blocks, buildHitGrid O(N), rebakeHitPositions O(N) and it DOES rebuild the grid (forge.js:7383) so the house hit world is not stale. One note, not a finding: all parked overflow guests share one grid cell at the crown (2,036 of them in 'Other'), so a pointermove near the crown — where the CASCADE/FAN chips now live — iterates ~2k zero-radius nodes. Measurable but far under budget. Also, the comment at forge.js:7436 claiming a spread-slider scrub is "free" is an overstatement: augmentModeForHouse always runs houseGuestsOf (full-vault scan + id sort) before the signature early-out, so every slider input event pays it.

CLEAN — law 7 (computeFitScale untouched, the isolate computes its own fit inline), law 2 (isolateGroupOf routes through mode.isolateGroupBy; familytree takes groupBy), law 1 (the chips are SVG text in the EXISTING hulls overlay, not a graph layer), edge-buckets has no duplicate keys (134 unique).

