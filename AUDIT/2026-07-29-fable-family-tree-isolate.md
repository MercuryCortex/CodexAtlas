# Design pass — the family isolate becomes a TREE ("The House")
**Date:** 2026-07-29 · **Author:** fable-design (read-only pass — no app code touched)
**Companion toy:** `design/family-tree.html` — self-contained, runs on **real extracted data** (six families from `data.js`), open at `localhost:8742/design/family-tree.html`. Every arguable call below is a dial there; the recipe line is the handoff.
**Contract honored:** Forge is the only renderer (rule #8) — this lands as a layout sibling of `radial.js`/`timeline.js`. Grouping stays a swappable primitive (rule #9) — nothing below hard-codes `n.family`. Rest is still. Safari is the truth.

---

## 0. The diagnosis

What shipped on 07-29 (`setIsolateFamily`, forge.js) is a **camera move**: fly onto the wedge, dim the others, tint the ground. John's rejection is exact — *"if i wanted a zoom i just use the weel."* A zoom shows the same layout closer; the wedge's Vogel scatter is built to be a fair *overview*, not a readable *structure*. What he asked for — *"the zoom eye ISOLATES the family deities and displayes them open in a tree properly"* — is a **re-presentation**: same nodes, a second resting arrangement whose geometry *is* the family's internal logic.

So the design question is: **what IS the tree of a family?** I went into `data.js` (4,746 nodes · 28,798 edges as deployed; 5,586 raw) instead of guessing.

### What the data actually says

**Deity↔deity edge vocabulary (counts):** `syncretic` 1,492 · `syncretic-scholarly-parallel` 949 · **`child-of` 356 · `parent-of` 209 · `consort` 225** · `syncretic-ancient-identification` 329 · `syncretic-constituent-of` 135 · aspect/avatar/manifestation family (`syncretic-avatara-of` 8, `syncretic-manifestation-of` 19, `syncretic-aspect-of` 2, `syncretic-emanation-of` 1, plus constituent) ≈ 165 · sibling edges are effectively absent (46 `syncretic-sibling-*` vault-wide, mostly non-deity). Globally the kinship bucket is `child-of` 478 + `parent-of` 253 + `consort` 225 + `ancestor-of` 284 + `heir-of` 74.

**Kinship per family, normalized to parent→child arcs** (the table that decides everything — full 30-family run behind the toy's extractor):

| Family | deities | kin arcs | kin-covered | unparented | roots | multi-parent | comps | max depth | dated |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Vedic | 97 | 39 | 39 | 58 | 8 | 8 | 5 | 5 | 97 |
| Greek | 80 | 96 | 69 | 11 | 10 | **34** | 3 | 6 | 80 |
| Mesopotamian | 80 | 68 | 48 | 32 | 9 | 18 | 1 | **9** | 80 |
| Egyptian | 63 | 37 | 31 | 32 | 9 | 13 | 3 | 6 | 63 |
| Norse | 50 | 20 | 23 | 27 | 6 | 3 | 4 | 4 | 50 |
| Israelite | 42 | 5 | 9 | 33 | 4 | 0 | 4 | 1 | 42 |
| Buddhist | 35 | 2 | 3 | 32 | 1 | 0 | 1 | 2 | 35 |
| **Chinese** | 32 | **0** | 0 | 32 | 0 | 0 | 0 | 0 | 32 |
| Pre-Islamic-Arabian | 16 | 0 | 0 | 16 | 0 | 0 | 0 | 0 | 16 |

Three facts fall out, and they ARE the design:

1. **Genealogy is a DAG-with-orphans everywhere, never a tree.** Multiple roots (Greek 10), multi-parent nodes (Greek 34/80), disconnected components (Vedic 5), and orphan rates from 14% (Greek) to **100%** (Chinese, Pre-Islamic-Arabian, Islamic, Modern-Esoteric). No directed cycles exist in any family today (verified), but the algorithm still guards. An approach that needs a clean tree is dead on arrival — the brief's warning is confirmed, hard.
2. **`date_earliest` coverage on deities is 100%.** Every single one of the 1,012. This is the universal fallback axis — the wheel already encodes age radially, so age-as-depth *re-projects an encoding John already reads*.
3. **`domains` coverage is 100%** (controlled-ish vocabulary: fertility 63, war 45, wisdom 28…) — a natural grouping key for the unparented. (`role` is also 100% but free-text — unusable for grouping.)

And the wires that leave: **Vedic's 97 deities carry 941 external edges** (512 fusion/syncretic), Greek 1,211 (794 fusion), Norse 405, Chinese 180. Cross-tradition flow isn't a footnote of the family view — it is *most of a family's edge mass*.

---

## 1. What IS the tree — THE HOUSE, four laws

**The tree is generational, not genealogy-only.** One deterministic cascade, total over every family:

1. **Lineage arcs are the bones.** `parent-of`/`child-of` normalized to parent→child. Within each connected component, depth = longest path from that component's roots (DAG layering — the standard Sugiyama move). Guard: if a cycle ever enters the data, break the arc whose parent has the youngest `date_earliest` (deterministic, logged) — today this fires zero times.
2. **Every rank is an era.** Rank count R = max(deepest line + 1, ⌈N/12⌉, 4). A component hangs from the era-rank of its **oldest root** (clamped so the line fits); each child sits max(parent)+1. A deity with no line **stands on its era rank directly**. So Greek reads as genealogy calibrated by time, and Chinese — zero kinship — degrades *continuously* into pure chronological strata, never into a broken layout. The multi-root case isn't an error state; it renders as the elder houses side by side under the crown.
3. **The unparented are a court, not a crowd.** Within their era rank they group by primary domain (dial: by degree instead) with small mono captions — Chinese resolves into readable clusters instead of 32 loose dots.
4. **Laterals never rank.** `consort` draws as the marriage bar when spouses are adjacent (the ordering pass pulls same-rank spouses together), a soft dashed arc otherwise — never affects depth. **Multi-parent is drawn, not pruned:** the highest-degree parent anchors placement; every other lineage arc still draws, lighter. The picture stays honest to the DAG. **Aspect/avatar arcs** (`avatara-of`, `manifestation-of`, `constituent-of` — directionally messy in the wild, so normalized hub = higher-degree endpoint) act as placement-parents *only* for otherwise-unparented deities, drawn dotted: in the toy this pulls Vedic's unparented from 58 down to 30 — Krishna, Rama, Narasimha, Kalki hang beneath Vishnu, which is literally John's example.

Ordering within ranks: parent-barycenter sweeps (2 down, 1 up) for kin, group-cohesion for orphan clusters, consort adjacency last. Deterministic — same family, same house, every time.

## 2. The geometry — Cascade ships, Fan is the runner-up

**Ship: THE CASCADE.** A vertical generational chart — crown (family name, serif, its color as keyline) at top, era-ranked rows beneath, each row a faint stratum with its date at the left. It is *unambiguously a tree*: nobody can mistake it for the wheel at another zoom, which is precisely the failure being corrected. It fills a circular frame chord-aware (rows near the poles narrow), because the frame is not decoration —

**The horizon: the Atlas stays in the room.** The tree grows inside a ghost of the wheel's rim. Every other family collapses to a **port** on that circle *at its true wheel bearing* — a colored sigil sized by wire count, labeled `GREEK · 794`-style with its real aggregate. At rest, ports show only quiet stubs (dial: full ghost wires at 4%, or off). Hover a deity → its actual external wires light to their ports, bucket-colored (fusion gold / parallel / transmission / attestation). Hover a port → the whole flow to that tradition lights. **Click a port → travel:** the house swaps family-to-family without going home first. This is the answer to "what happens to the wires that leave": they become *more* legible than on the wheel, not less — the isolate is a corridor, not a cul-de-sac, and the bearing-true ports keep the user's wheel mental-map warm for the return.

**The court rails (dial, default on).** John said "the family deities," so deities are the cascade — but a family is 60–467 nodes of all types (Vedic 313, Christian 467 with only 12 deities). The family's documents form a left rail — *the scriptorium* — and persons/places/rites a right rail — *the court* — with attestation wires lighting deity→document on hover. This is also the 300+-node answer: **the cascade scales with deity count (6–97, always readable); the rails absorb the rest of the family's mass** (labels budget by available height; hover reaches everything). A 60-node family is one airy medallion; a 300-node family is a genealogy flanked by its library. Deity-density extremes: Vedic's 97 across 9 ranks ≈ 11 per row — labels fit; label dial (hubs/many/all) plus degree-priority collision reservation handles the rest.

**Runner-up: THE FAN** — same ranks as concentric rings, crown at center, lineage as spokes; a family with no genealogy becomes literal tree-rings of time. It's the smoother continuation of the wheel's radial-age law and the prettier tween. I would switch to it if John reads the cascade as "too chart-like / not Codex" — but I won't lead with it, because a circle of rings risks re-triggering the exact "this is just the wheel" rejection. Both are in the toy under one dial; let the toy decide.

## 3. Isolate stays state, not navigation — how the engine does it honestly

The node-lab §04 law survives, with one honest amendment: the tree **is** a re-layout, so "same instanced nodes, zero recompute" becomes "same instanced nodes, **two resident position sets**":

- **New layout module `src/js/engine/layout/familytree.js`** — pure function, sibling of `radial.js`/`timeline.js`, exported as `AtlasEngineLayout.familyTreeLayout(nodes, opts)`. Honors the shared contract (`positions: Map<id,{x,y}>` + `worldExtent`; everything else mode metadata — `timeline.js` lines 12–18 are the precedent). `opts` carries `groupBy` + `groupKey` (membership = `groupBy(n)===groupKey` — **no `n.family` inside**; isolating a Codex corpus-section rides the identical path), the normalized arc list + laterals (the *view* resolves YAML fields → arcs, same as it feeds `degree` today), rank/orphan/spread dials, and the wheel's group bearings. One pass positions **all** nodes: members into the house, non-members onto their ports — so every edge keeps live endpoints and external wires land on ports with no pseudo-node hacks.
- **Transition = a second per-instance position attribute + one `uLayoutMix` uniform** in the node/edge passes (`webgpu.js`). Enter: bake tree positions once (a 60–320-member layout plus port collapse — well under the per-resize rebake budget the pack-scale-invariant work already proved), ramp mix 0→1 over ~450ms. **Exit: ramp back — buffer A was never touched, so back is one click, instant, and pixel-identical.** No hard cut, no per-frame CPU, and at mix 0/1 the loop dies: rest is still, Safari budget untouched (one extra vec2 attribute ≈ 37KB).
- **Input never swallowed:** a click/Escape mid-ramp retargets from the current mix (the toy ships this; it matters — a swallowed Escape reads as a hang).
- Chrome: wedge hulls/dividers hide during isolate; the family's own hull-label — the element John already clicks, with its `is-isolated` state — rides to become the crown; ports render in the same hulls-SVG overlay (`syncHulls` already rewrites it per camera). Hit-grid rebuilds at ramp end. `applyIsolateOverride`'s dim logic stays for the ported non-members.
- In/out **unchanged**: title-click enters, same title / empty space / Escape leaves. The tree adds one affordance, port-click travel, and changes nothing else. The tree **replaces the wedge while isolated** and the wheel remains home — one flag, two resting states, no route, no view.

## 4. What I am NOT proposing

- **Not a new view or master-pill entry** — isolate remains state inside Forge/Atlas.
- **Not a bespoke DOM/SVG graph renderer in the app** (the toy is canvas because design artefacts may be; the ship path is the instanced engine, full stop).
- **Not pruning the data to a tree.** Multi-parent arcs draw; nothing is deleted to satisfy geometry.
- **Not severing the family from the Atlas** — no "focus mode" that hides external wires entirely (the `off` dial exists to prove it wrong interactively).
- **Not inventing hierarchy content.** Where the vault has no lineage, the house says so on its stats line (`0 LINEAGE ARCS · 30 STAND ON THEIR ERA`) — thin genealogy is Lane A work, not an engine problem.
- **Not per-family special-case layouts, not relitigating exit gestures, not touching `computeFitScale`.**

## 5. Ranked build list

1. **`familytree.js`** — the pure layout + determinism tests pinned to the two extremes (Greek: DAG/multi-parent; Chinese: zero-kinship). *Everything else hangs off this.*
2. **Renderer ramp** — position-B attribute + `uLayoutMix` in node/edge passes; the only engine-core change; verify 60fps on Safari 26 with the ~4.7k/21.7k load.
3. **Forge wiring** — bake-on-enter, crown/port chrome in the hulls overlay, retargetable ramp, hit-grid rebake, `applyIsolateOverride` for ported non-members.
4. **Hover flows + port travel** — per-deity wires, port aggregates, click-to-travel.
5. **Court rails** (dial `court=on`) + attestation hover wires.
6. **Later:** fan variant behind a dev dial; corpus-section isolate reuse in Codex views; orphan-grouping refinements after John plays.

**The recipe from the toy is the spec** — whatever John dials (`FAMILY-TREE · layout=cascade · ranks=lineage+era · unparented=domain · court=on · labels=many · rest-wires=stubs · spread=1.10 · tween=450`) becomes the layout defaults, node-lab style.

---

*Toy verification log (this pass): six real families extracted with per-deity external wires (150KB pack); all 24 family×layout×rank combinations compute clean, zero NaN, ports on the horizon, zero console errors; enter/Escape/empty-click/port-travel all verified by real clicks in the pane, including mid-tween. Chromium pane used for geometry only — no gradient/banding judgments made in it (that law stands).*
