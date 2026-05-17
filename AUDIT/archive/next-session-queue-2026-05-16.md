# Next-session queue — paused 2026-05-16 evening

This is the punch list left when John paused after the ELK stellar-arrange batch (commit `202160a`).
Read this top-to-bottom on session resume — most items are connected.

---

## 🔥 1. Pantheon (and Timeline) are laggy — second WebGL attempt

**John:** *"the pantheon tab is getting pretty useless super laggy. should we go for another attempt to build it the proper way ? the map tab is so fast ! maybe we can duplicate the pantheon tab so we rd in one keeping the other safe?"*

**Status:** sigma.js + graphology already vendored (`_assets/vendor/sigma/`) from the first attempt (commit `caa0038`, reverted `6b6087c`). Module skeleton intact (`src/js/graph/{renderer,layout,theme}.js`). The revert was correct — the v1 WebGL Pantheon lost the design language (mode tabs, hulls, hover trails, edge colours). The architectural call was right; the parity work wasn't done.

**Approach this time — the duplicate-for-R&D model John proposed is the right move:**

1. **Add a new nav slot `data-view="pantheon-v2"` next to (or just under) the current Pantheon.** Hidden behind a `?webgl=1` URL flag at first if you want it really safe.
2. **Build `VIEWS['pantheon-v2']`** that calls sigma.js, with FULL parity gate as the precondition for promoting it:
   - Mode dropdown (deities/authors/symbols/events/monuments) wired
   - Family rim-labels rotated tangentially (port from current `_renderPantheonWebGL`)
   - Faint family-color hulls behind each wedge — same alpha as main view
   - `labels: hub/all/off` toggle wired to sigma's `labelDensity`
   - Ego-focus button (sigma node-reducer keyed on selected id)
   - Family legend bottom-left (unchanged — lives outside the canvas)
   - Colored bezier edges per type (theme.js already has the palette)
   - Hover-trail dim+highlight (sigma reducers)
   - Pantheon-style click-empty-to-clear
3. **A/B in-place** — pantheon (SVG) and pantheon-v2 (WebGL) both visible. Eyeball them side-by-side.
4. **Don't flip default until John explicitly approves.** The parity gate failed last time precisely because I flipped the switch on a "technically working" but "design-language-stripped" build. Visual parity is a hard precondition.

**Timeline same playbook:** Timeline is currently D3 SVG (no force-sim). It's not as slow as Pantheon but will get there as the vault grows. Add `timeline-v2` slot, port to sigma.js with the same parity gate. The Timeline date-compression piecewise scale and grow-on-zoom dot sizing have to survive the port — those are John's design language too.

**Bundle cost:** zero new vendor bytes — sigma.js + graphology already loaded for the first attempt. Just need to write the renderer modules.

---

## 🐛 2. Bug — clicking Transmission from Alchemy makes nodes go crazy

**John:** *"theres a bug clicking on the transmission from the alchemy page- it makes the nodes go crazy."*

**Hypothesis:** the Alchemy → Transmission bridge (`sendToTransmission` in `src/js/alchemy/board.js`) pushes the Alchemy card nodeIds into `STATE.alchemyPicks` then calls `setView('transmission')`. The Transmission renderer then runs `alchemyShortestPath` over those picks and inflates the graph with bridge nodes — the force-sim then explodes because it suddenly has many more nodes to lay out than the user expected.

**Reproduce + investigate next session:**
1. Open Alchemy, add 3 cards (e.g. Enlil, Marduk, Enuma Elish).
2. Click "→ Transmission".
3. Observe what `STATE.alchemyPicks` looks like (3 picks) + how many bridges get computed (probably 10-50+).
4. Likely fixes:
   - Cap bridge count or default to `maxHops=1`.
   - Set `STATE.alchemyLayout = 'elk-layered'` AS PART OF the bridge so positions are stable, not force-sim-derived.
   - Or: bypass shortest-path bridge expansion when the user is jumping from Alchemy (the picks ARE the graph; no need to add intermediates).

---

## 🐛 3. Bug — Transmission → Alchemy doesn't transpose

**John:** *"transmission page doesnt transpose when click to alchemy"*

**Hypothesis:** the "→ Alchemy cards" button in Transmission (`btn-alch-to-cards`, src/js/app.js around line 5035) calls `setView('alchemy')` then in `queueMicrotask` runs `_alchemyBoard.clearBoard()` + `addCard` for each node. Two failure modes:

1. **`window._alchemyBoard` not loaded yet** if the user has never visited Alchemy in this session → the `queueMicrotask` no-ops. Fix: lazy-mount the board on `setView('alchemy')` then call addCard via a callback or a small retry.
2. **Cards add but board pan/zoom is wrong** so cards land off-screen. Fix: call `_alchemyBoard.zoomToFit()` after all cards are added.

**Investigate next session:** open Transmission with picks, click "→ Alchemy cards", check `document.querySelectorAll('.alch-card').length` + `state.cards.length` + visual position.

---

## ✨ 4. Alchemy needs click-drag (marquee) multi-select

**John:** *"alchemy page needs a click drag to select."*

Right now: shift-click toggles selection on individual cards. Missing: marquee select — drag from an empty point on the board, see a translucent rectangle, every card inside gets selected on release.

**Sketch:**
- In `board.js` pointerdown on `rootEl` (not on a card): if no card target, start marquee mode instead of pan mode (or trigger marquee on shift+drag from empty).
- Append a `.alch-marquee` rect to the SVG overlay, update on pointermove.
- On pointerup: for each card, test if its bounding-box intersects the marquee rect; if so, add to `state.selected`.
- Clear marquee + `refreshSelection()`.

CSS: thin gold dashed rect with 8% gold fill.

---

## 🏷️ 5. ✅ Sidebar tooltips when collapsed — SHIPPED

Done this session. Hovering any nav item when the sidebar is collapsed shows the label as a small tooltip popping to the right of the icon strip.

---

## 🧬 6. Notes on the the portable core R&D reference John pointed at

John dropped a copy of his vector-graphics R&D project (`the portable core`, pre-alpha, Tauri 2 + Rust + React + TypeScript + WebGPU planned) into `99_ingest/the portable core/`. Read the headers — useful patterns if Codex Atlas ever outgrows sigma.js:

- **`Technical Docs/02_Engineering/the portable core_RENDERING_REFERENCE.md`** — RendererTrait abstraction + planned WebGPU backend. The right pattern for a 10×-scale graph renderer if sigma.js stops scaling.
- **`Technical Docs/02_Engineering/the portable core_SCENE_GRAPH.md`** — scene-graph contract. Different domain but the layering is similar to what a node-graph editor would want.
- **`the portable core/src/`** — the Rust core (`render`, `scene`, `geom`, `hit`).

**Bottom line:** we don't need WebGPU yet. sigma.js + ELK.js handles 10k+ nodes at 60fps per the sigma benchmarks. The Pantheon problem is rendering technique (SVG vs WebGL), not algorithm. Stick with sigma.js for the v2 attempt.

---

## Order I'd recommend tackling these

1. **The two bridge bugs** (#2 + #3) — quick wins, hopefully <1 batch combined.
2. **Marquee select** (#4) — focused, ~1 batch.
3. **Pantheon-v2 R&D** (#1) — biggest, multi-batch. Start with the parity-checklist (mode dropdown, hulls, hover trails, edge colours, ego-focus). Don't flip default until John signs off.
4. **Timeline-v2** — same playbook as Pantheon, lower priority.

The hygiene infrastructure from yesterday (pre-commit hook + canary checks + AGENTS.md rule) means content agents can't accidentally break the new R&D views by sweeping stale app.js. Spawn parallel agents freely when the file scopes are clean.

---

## Tags / state at pause

- Last commit on main: `202160a` (ELK stellar arrange)
- Vault: 2050+ nodes, ~13000 edges
- All views render; the Pantheon (D3 SVG) is the slow one. Atlas (MapLibre WebGL) is fast. Astro modes (sigma.js / D3) are fast at current scale.
- Sub-agents shipped today: edges-v2, decanic-clarity, now-events-1, astro-pantheon-style-1, scorpion-1.
- Permission dogma + pre-commit hook + canary checks are live; subagents work without prompts in worktrees.
