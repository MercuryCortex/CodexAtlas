# Design pass — the house learns to hold its tongue, and dev gets ONE door
**Date:** 2026-07-30 (filed under the 07-29 isolate series) · **Author:** fable-design (read-only on app code — no `src/`, `index.html`, `data.js` touched)
**Companion toys:** `design/family-tree.html` (edited — labels pass + both geometries first-class) and `design/dev-drawer.html` (new — the one-dev-door mockup), both at `localhost:8742/design/…`. Every arguable call below is clickable there.
**Predecessors:** `AUDIT/2026-07-29-fable-family-tree-isolate.md` (the house), `AUDIT/2026-07-16-fable-design-next-level-plan.md` (alpha surfaces). Same contract: Forge is the only renderer, tokens per `00_meta/app-architecture.md`, rest is still, Safari is the truth.

---

## 0. The diagnosis — three sentences from John, three defects

1. *"I like the logic, but the labels are a mess clutter list on sides."* — With Vedic open, the toy's rails were two ~20-row columns of strings clipped mid-word (`Ācārāṅga Sūtra (First Ā…`), `1500 BCE` printed five times down the left overlapping the scriptorium, and deity names crossing each other and the arcs. Root cause, exactly the bug class the app killed on 07-29: **four text passes that could not see each other** (era captions in `drawTreeEdges`; deity names with a private collision list; rail labels with a density budget but no registry; port labels and crown with none). Two layers placing text independently is how "Tiamat" once landed on "MESOPOTAMIAN".
2. *"i want both cascade and fan, all these display are gold for the app like we have the view modes. but for now we keep it as a dev panel."* — My 07-29 pass ranked Cascade as ship and Fan as runner-up. Overruled, happily: **they are peers**, future view modes; dev-dial for now.
3. *"note we got a LOT of dev panels, consolidate all them into one dev panel that opens the dev panels buttons and open individually."* — The bottom bar carries six entries (`LEGEND · VIEW · FX · STYLE · LAB · ⌗`), four of which are workshop tools, plus a dev item hiding in the ✦ menu and a legacy `?dev=1` drawer. He's right; it's a mess.

---

## 1. TASK 1 — One label law (shipped in the toy)

**What was wrong is structural, so the fix is structural** — not wider columns, not shorter truncation. The toy now mirrors the app's own two-part law:

- **One priority-ordered pass, one collision list** (`renderLabelsCanvas`'s `placed[]`, generalized to rects). Order: **crown** (title + stats — the structural seed, like `syncHulls` publishing `_titleRects`) → **rail columns as obstacles** + rail headers → **ports** (dots blocked, labels placed biggest-flow-first, hover always first — the wedge-size priority from `syncHulls`) → **era captions** → **deity names** (hover first, then degree) → **the library** (hovered member → shelf captions → spine names → proximity titles) → **orphan domain captions**, which yield to everything. A loser **hides** — never nudges, never overlaps.
- **Whole names or nothing.** All `slice(0,17)+'…'` truncation deleted. The app never truncates; collision decides. And every word now draws with a **dark halo** (stroke-then-fill, the `renderLabelsCanvas` move) so a name crossing a lineage arc stays readable — that, not avoidance, is how the wheel has always solved text-over-wires.
- **Era captions dedupe**: a date prints once at the top of its run, not five times (`4000 BCE · 1500 BCE · …`), right-aligned into the gutter between row-edge and rail, claiming its rect like everyone else. Strata lines stay full-width but now stop short of the rail columns.

### The rails are SHELVES, not lists
The rails exist to say *a family is mostly not deities* — mass must stay visible. The old answer (every Nth title, clipped) read as debris. The new answer:

- **The Scriptorium groups its docs into era shelves** (gap-split on the date-sorted list, ≤5 + UNDATED) — Vedic: `1500–450 BCE · 12 → 400 BCE–780 CE · 12 → 800–1574 CE · 12 → 1583–1945 CE · 2`.
- **The Court groups by kind** (the pack carries real vault-type prefixes): `SYMBOLS · 18 → MUSIC · 8 → SACRED PLACES · 6 → PERSONS · 4 → MORE · 16`.
- Each shelf = a **mono caption with a count** + **one spine name** (its highest-degree member — `Rigveda`, `Swastika`), full text, collision-checked; the rest of the mass stays as glyphs. **Titles arrive on approach** — pointer within ~52px of a rail reveals the nearest ~7 names; the hovercard still carries the whole record. The crown gains an honesty line — `38 IN THE SCRIPTORIUM · 52 IN THE COURT · +126 BEYOND THE PACK` — and the right rail closes with `+126 MORE IN THE FAMILY`. Mass is now *countable*, which is more visible than twenty clipped strings, not less.

**Rejected:** widening the columns (moves the mess, keeps the debris); two-column rails (doubles clutter density); tick-marks-only (mass with zero identity — the shelf spine names are what make it a *library*); removing rails from the resting state (hides the very fact the rails exist to prove); per-N budgeting of full titles (still a list, still arbitrary).

*Also fixed in passing: dead ports (0 wires, 1.6px dots) had an 8px hit radius that masked rail glyphs sharing the horizon band — now 4px. And `_ftDebug.settle()` added: hidden panes freeze rAF so a pending tween's guard ate synthetic mousemoves in harnesses (same class as the known idle-skip FPS-probe hang).*

## 2. TASK 2 — Cascade and Fan are peers (and how they become view modes)

The toy no longer has a favourite. Both geometries run the identical label law (fan's ring captions dedupe and claim like the cascade's gutter), the copy declares them peers, and — the tell — **flipping any geometry dial now TWEENS instead of snapping**: Cascade⇄Fan is a morph of one house (same sprites, two position sets, retargetable mid-flight), exactly the isolate's own enter/exit law. Draw-time dials (`labels`, `rest wires`) repaint in place; the spread slider still snaps (it's a scrub).

**The view-mode path:** the app already treats layout as vocabulary — `AtlasEngineLayout.radialWedgeLayout` / `timelineLayout` share the `positions + worldExtent` contract, and the VIEW panel's **Node distribution** radio (`organic / age-bands / vogel`, `DISTRIBUTION_THEMES` in forge.js) is the ratified UI shape for "same substrate, different spread." When the isolate lands as `familytree.js` (07-29 build list), it takes `opts.geometry: 'cascade' | 'fan'` and the recipe records it; the eventual user-facing surface is one more radio group in VIEW — **House layout: Cascade · Fan** — shown only while isolated, riding the identical `applyUxMode` path as distribution. **For now it stays a dev dial** (the toy's chip today; the NODE LAB's recipe keys when the engine build lands) — per John, behind the dev panel until he's played both into a verdict.

## 3. TASK 3 — ONE dev door (spec — main thread lands this)

### 3.0 The inventory (what exists today)

| Surface | Trigger | Module | Built | z | LS | Verdict |
|---|---|---|---|---|---|---|
| FX dials | `FX` (bar) | `src/js/forge/fx-panel.js` | declarative in bottombar template | 235 | `forge.fxParams.v4` | **→ drawer** |
| Style dials | `STYLE` (bar) | `src/js/forge/style-panel.js` | declarative | 235 | `forge.styleParams.v1` | **→ drawer** |
| NODE LAB | `LAB` (bar) | `src/js/forge/lab-panel.js` | JS-built on body | 220 | `forge.labRecipe.v1` + `forge.labPanel.open.v1` | **→ drawer** |
| Engine stats | `⌗` (bar) | `src/js/forge/debug-stats.js` | declarative | 235 | `atlas.debug.pinned` | **→ drawer** |
| Dev Overview | ✦ menu → Dev | `src/js/views/dev-overview.js` | self-installed | — | — | **→ drawer** (✦ item removed) |
| Wire legend + tier filter | `LEGEND` (bar) | `src/js/forge/legend.js` | declarative | 50 | `forge.viewSettings.v7` | **stays canonical** |
| View settings | `VIEW` (bar) | `src/js/forge/view-settings.js` | declarative | 235 | `forge.viewSettings.v7` | **stays canonical** |
| Legacy pantheon tuner | `?dev=1` right-edge tab | `src/js/dev-panel.js` | self-installed | 9000 (!) | `codex-atlas/dev-panel-v1` | **not in the drawer** — it tunes the legacy pantheon-v2 renderer only; stays URL-gated and retires with that view (its z:9000 is an outlaw to delete then) |

**Why LEGEND is not dev, defended:** the legend is the map key *and* the source-tier filter (T1–T5 + political-risk). It changes **what the map claims** — content scope, source criticism, the product's spine — not how pixels are tuned. Dev = dials that tune the rendering; canonical = controls that change meaning. This is the same ruling John already made on the ground colours (*"these are not dev panel"*), and tier filtering is more user-facing than a background hue. VIEW likewise (layers/theme/order/distribution are reader settings). ✦ FOLIO untouched — Theme/Badge/Ground/Boards remain the canonical account surface.

### 3.1 The shape (all clickable in `design/dev-drawer.html`)

- **One `DEV` button**, right cluster of the bottom bar, exactly where `FX STYLE LAB ⌗` sit today (left of the timeline-only segment). Canonical `.forge-fxpanel-btn` class, `aria-expanded` for the launcher, plus a small **gold dot when any dev surface is open** — a stray panel is always traceable to the bar. Six bar cells become three (`LEGEND · VIEW · … · DEV`).
- **The launcher** — a drop-up card anchored above DEV (right-aligned, z **235**, the 200–300 overlay tier; no new tiers): five mono rows, each `name + italic hint + open-dot` — **NODE LAB / FX / STYLE / STATS / OVERVIEW** — and a footer line `VIEW · LEGEND · ✦ FOLIO STAY CANONICAL`. Declarative HTML in the bottombar template per the ratified menu pattern (forge.js ~line 1349: JS attaches handlers, never builds DOM).
- **Open/close/stack — the contract:**
  1. **One editor at a time.** LAB, FX, STYLE share one fixed slot — **top-right, `top:64px right:12px`, where the LAB lives today** (under the app pill, clear of the bottom bar and its keep-outs). Opening one closes the others.
  2. **STATS is exempt** — a read-only HUD in its own geometry (today's popover + its existing PIN-as-top-bar mode, `atlas.debug.pinned`); it may sit open beside an editor, because watching fps while dragging a LAB slider is the point.
  3. **OVERVIEW is a full surface**; opening it closes the launcher.
  4. **The launcher is a cockpit remote**: it stays open while rows toggle panels (switching = one click); click-outside and Esc close the launcher **only** — never a panel.
  5. **Panels persist until closed** (the LAB idiom John called closest to right): every dev panel gets an ×; **FX and STYLE lose close-on-outside-click** — a tuning panel that vanishes when you click the canvas to test the effect is broken. Esc walks it back: overview → launcher → open editor.
- **State:** all dial LS keys unchanged; `?lab` still force-opens the LAB at boot; no open-panel persistence across reloads (dev never greets a user); no new LS keys.

### 3.2 Migration order — never a broken half-state

Each step ships green on its own; rollback = revert that step's files. Zero edits inside `lab-panel.js` and `debug-stats.js` throughout.

1. **Add the door (additive).** New `forge-devdrawer-wrap` in the bottombar template: DEV button + launcher card, rows carrying `data-dev-panel`. New module `src/js/forge/dev-drawer.js` (`window._forgeDevDrawer.attach({local})`, self-installing IIFE like its siblings, loaded with the other forge/* scripts). Rows proxy-`click()` the four existing buttons + `_devOverview.open()`. Old buttons still present and functional — two routes, both work.
2. **Free the panels from their wraps (CSS only).** `#forge-fxpanel`, `#forge-stylepanel` gain a `position:fixed; top:64px; right:12px; max-height:calc(100vh - 140px)` variant class; lab panel's inline z 220 → 235 (tier-align). Verify open/close from both routes; panels no longer depend on wrap anchoring.
3. **Enforce the contract.** dev-drawer.js owns single-open (before opening an editor, closes the others via their existing toggles), the launcher-stays-open rule, row dots + DEV dot. Small edits to `fx-panel.js` / `style-panel.js`: drop the document-click close handler, add the × header button (~12 lines each — explicitly a behaviour change, wanted).
4. **Remove the old cells.** Delete the four buttons/wraps from the template; the launcher rows **adopt the old ids** (`forge-fxpanel-btn`, `forge-stylepanel-btn`, `forge-labpanel-btn`, `forge-debug-btn`) so every module keeps working byte-identically; the two panel divs move to loose children of the bottombar (fixed-position — the legend tooltip is precedent). Same commit: remove ✦ menu → Dev (user-menu.js ~219) — one home for dev. `?lab` handling in `wireLabPanel` untouched.
5. **Sweep.** `KEEPOUT_BOTTOM` unchanged (bar height identical); app-architecture §3 gains the launcher as a primitive row; STATUS log; smoke the timeline-mode bar (the `fv-timeline-only` segment must still butt against DEV).

## 4. What I am NOT proposing

- **Not sweeping VIEW, LEGEND, or FOLIO into the drawer** — canonical stays canonical (§3.0 defense).
- **Not merging the four panels into one mega-panel.** John asked for one *door*, panels opening individually — the modules, dials, recipes and LS keys all survive untouched.
- **Not persisting open dev panels across reloads**, and not auto-opening the drawer for any user tier.
- **Not adopting the legacy `?dev=1` pantheon tuner** into the launcher — wrong renderer, marked for retirement with pantheon-v2.
- **Not a new z-index tier, not a new font, not new hexes** — launcher and panels live at 235 in the documented 200–300 band, Codex tokens only.
- **In the toy: not a second label system for the rails** — one registry for every word on the stage, no exceptions (exceptions are how the two-system bug returns).

## 5. Ranked build list

1. **Dev drawer steps 1–4** (§3.2) — pure chrome, one evening, removes the daily mess John named; the mockup is the acceptance test.
2. **Label law into `familytree.js`'s view layer** when the isolate lands (07-29 build list items 3–5): the tree's crown/ports/era/shelf text renders through `renderLabelsCanvas`'s existing registry (seed rects the way `syncHulls` publishes `_titleRects`) — the toy's pass is the reference implementation, including shelf grouping and the proximity reveal.
3. **Geometry as recipe key** — `opts.geometry` in `familytree.js` + NODE LAB dial; the VIEW-panel "House layout" radio waits for John's verdict after play (§2).
4. **Drawer step 5 sweep** + architecture-doc row.
5. **Later:** retire `dev-panel.js` with pantheon-v2 (kills the z:9000 outlaw); OVERVIEW deep-link (`?dev-overview`) if John asks.

---

*Verification log (this pass, Chromium pane for geometry/occupancy only — no gradient judgments, that law stands): family-tree.html — 6 families × 2 geometries compute clean, 2,489 sprites/scene, zero NaN; era captions dedupe (Vedic: 5×`1500 BCE` → 1); shelves group correctly on real pack kinds; full-rail pointer rides, every-6th-deity + every-port hovers, labels dial sweep, port-travel chain and empty-click/Esc exits — zero console errors. Two fixes found by the harness: dead-port hit radius masking rail glyphs, and crown stats shading row 0's names (crown now clears by its full height). dev-drawer.html — every contract rule proven by real clicks (one-editor, stats coexists + pins, launcher survives panel flips, outside-click closes launcher not panels, Esc cascade, canonical VIEW/LEGEND keep today's behaviour, DEV dot syncs); zero console errors. Both script blocks parse under `new Function` (no-build check).*
