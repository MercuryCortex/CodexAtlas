# Forge — Layered Ground-Up Rebuild Spec

**Filed:** 2026-05-20
**Filed by:** opus (lead)
**Supersedes:** §4 of `AUDIT/forge-robustness-lock-plan-2026-05-20.md`
**Reads-with:** the 5 component audits `forge-robustness-0[1-5]-*-2026-05-20.md` + the lock plan synthesis.

---

## 0. John's direction (verbatim, 2026-05-20)

> *"at this stage is a mess, i feel we must audit the component ground up — make a solid proper node, then behaviors, then wires then fx, then management"*
>
> *"we can remove the panel completely and REDO later if needed to avoid bugs if helpful"*
>
> John also confirmed: atlas at 128px ships with the foundation (decision D1); after the rebuild completes, automatically continue into tail polish; mark Forge as the active focus + collapse the other side-nav tabs.

This doc translates that direction into atomic phases. Each phase = one Lane B slot claim = one commit = one acceptance gate. No phase merges into the next without verification.

---

## 1. The layers, in order

```
Phase 0 — REMOVE dev panel + clean slate
   ↓
Phase 1 — NODE atom (the visual + technical primitive)
   ↓
Phase 2 — BEHAVIORS (hover / click / state model / fade pipeline)
   ↓
Phase 3 — WIRES (edges — bucket palette, depth, gradient, fade)
   ↓
Phase 4 — FX (glow, glyphs, labels, atlas — the polish ride on top)
   ↓
Phase 5 — MANAGEMENT (camera, mode-switch, search, scrubber, persistence, nav)
   ↓
Phase 6 — TAIL POLISH (autonomous, runs to backlog exhaustion)
```

**Dependency order matters.** NODE depends on nothing in Forge. BEHAVIORS depends on a solid NODE. WIRES depends on solid NODE (positions, radii). FX depends on NODE + BEHAVIORS + WIRES (fade state, focus state, depth scheme). MANAGEMENT depends on everything underneath. Polish rides on a locked stack.

Each phase has a **micro-audit goblin** (read-only, layer-scoped) that fires before the implementation batch. Findings from the 5 robustness audits route into the layer they belong to (see §3).

---

## 2. Phase contracts

### Phase 0 — REMOVE dev panel + clean slate

**Mandate:** delete the dev panel surface entirely. Visual params live in `PARAM_DEFAULTS` in `src/js/views/forge.js` only. No `dev-panel-forge.js`, no `dev-panel.js` (Forge tab), no panel CSS, no panel mount in `app.js`.

**Why first:** removes the entire drift-class surface (Option-B race, two-defaults divergence, iconByType / glyph_tint / fontByScope ghost features, panel CSS taking space in `app.css`). Cuts ~1500 lines of code. All subsequent phases work against a single source of truth.

**Touches:** delete `src/js/engine/dev-panel-forge.js`, `src/js/dev-panel.js` (Forge-related). Remove dev-panel script tags from `index.html`. Remove dev-panel CSS from `src/styles/app.css`. Remove `state.params` hydration / `tryBoot` / `applyAllToEngine` from forge boot. Remove Option-B pull from `views/forge.js:render()`. Keep all current `PARAM_DEFAULTS` values exactly as they are (John's tuned set baked in).

**Acceptance:**
- No "Dev panel" tab in the side rail.
- No keyboard shortcut (`D` or `F`) opens a panel.
- No `window.AtlasEngineForgeDevPanel` exists.
- Forge mounts cleanly, looks identical to today's `PARAM_DEFAULTS` baseline.
- `grep -ri "dev-panel" src/` returns zero hits.

**Risk:** low (it's deletion). Verify visually that Forge boot still works at the same baseline.

---

### Phase 1 — NODE atom

**Mandate:** lock the node primitive. A node has unambiguous specifications for every visual + technical dimension.

**Sub-audit (Phase 1A — micro-audit goblin, read-only):**
Audit just the NODE atom across `views/forge.js`, `engine/graph/node.js`, `engine/graph/mode.js`, `engine/renderer/webgpu.js` (NODE_SHADER + node pipeline only). Surface every spec ambiguity, every magic number, every per-N risk. Output: `AUDIT/forge-rebuild-1A-node-atom-2026-05-20.md`.

**Implementation (Phase 1B):**
Bake the node atom's spec into code as the single source of truth:

| Dimension | Locked spec |
|---|---|
| **Tier classification** | One function in `node.js`. Inputs: degree (or other ranking signal). Outputs: tier index. No call site re-derives. |
| **Tier radii (world units)** | 4 numbers, defined once. Today `[16, 12, 9, 7]` per `forge.js` PARAM_DEFAULTS. Confirmed authoritative. |
| **Screen-px clamp** | Min/max screen-px per tier, evaluated at pack time using current `camera.scale`. Already exists; reconfirm + document. |
| **Family color** | One function, inputs: node.family. Cached. Returns hex. Same call in node packer + glyph packer + label color (if any). No second cache. |
| **State channel** | 0 = focused / 1 = dim. Float. Single source of truth: `local.nodeStates` (live), `local.nodeTargets` (snap-to). Buffer pattern: in-place update only; wholesale replace ONLY at `rebuildForMode` (documented exception). |
| **Selected channel** | 0 / 1 float. Separate from state. Selected adds size_mult + glow ring. |
| **Depth z** | Three values: selected=0.0, focused=0.3, dim=0.6. Inline shader comment locks this in. Sister glyph z = same value. |
| **GPU layout** | 8 floats × 32 bytes = `(x, y, r, _pad, R, G, B, A)`. Frozen layout — any future change requires a documented migration. |
| **Lifecycle invariant** | `rebakeNodes` updates `nodeTargets` in place; reallocates `nodeStates` only on length change. `packedAtScale` updated by every code path that mutates `nodePacked`. |

**Acceptance for Phase 1:**
- A "node-only" test mode (or `_forgeDebug.nodeOnly()`) renders nodes alone at 663 / 10k / 50k. Disks at correct positions, correct family colors, correct tier sizes. No edges, no glyphs, no labels.
- Hit-test spatial index built (uniform grid keyed off `worldExtent`). `hitTestAt` runs O(1) buckets instead of O(N) hitNodes loop. Tested at 10k pointer-move rate.
- `nodeInstanceVbo` and `nodeStateVbo` have dirty flags (instance buffer marked dirty only on rebake / mode-switch; state buffer updated every frame because of fades).
- Symmetric renderer destroy enumerates all node resources via the `owned[]` list.
- Inline invariant comment at top of `forge.js`: "Node spec is locked at <commit-hash>. See `AUDIT/forge-rebuild-1B-node-spec.md`. Do not change tier radii / state channels / depth z without writing a dated rationale doc."

**Findings from robustness audits landing in Phase 1:** T1.1 (hit-test grid), T1.2 (static-VBO dirty flag, node portion), T2.6 (renderer destroy enumerates owned), T2.8 (nodeStateVbo invariant comment), T2.11 (packedAtScale post-fit), T3.10 (recomputeFocus wholesale-replace doc).

---

### Phase 2 — BEHAVIORS

**Mandate:** lock the interaction + state model.

**Sub-audit (Phase 2A):** behaviors-only goblin. Walks every input handler (pointerdown/move/up, wheel, click, keyboard), every state transition (IDLE → FOCUSED → SELECTED and back), every rAF id, every coalesce point. Output: `AUDIT/forge-rebuild-2A-behaviors-2026-05-20.md`.

**Implementation (Phase 2B):**

| Behavior | Locked spec |
|---|---|
| **Three-state model** | IDLE: nothing hovered or locked. FOCUSED: a node has hover OR is in lockedSet's 1-hop. SELECTED: a node is hover OR is in lockedSet. Definitions are written down once in a header block. |
| **Hover** | Single `setHoverId(id)`. Synchronous part: id assignment + cursor class + status text. Coalesced via rAF: `recomputeFocus`. Spatial grid drives `hitTestAt`. Never bypassed. |
| **Click-lock** | `toggleLock(id)` mutates `lockedSet`. Click-empty clears lockedSet (current behavior — preserved). `recomputeFocus` synchronous (clicks are low-frequency). |
| **Fade pipeline** | `nodeStates → nodeTargets` advanced by `tickNodeFades(dt)` over `FADE_DURATION`. Same shape for edges. NEVER wholesale-replaced outside `rebuildForMode`. `rebake*` paths use in-place `.set()`. |
| **rAF ownership** | Three rAF ids: `_hoverRafId` (hover coalesce), `local.animRafId` (fade + camera tick), `local.idleLabelRaf` (label compute). All three cancelled on `destroy()`, on `rebuildForMode`. |
| **Lifecycle ORDER constants (top of forge.js)** | Locked: (1) gpu.create → setBucketPalette → buildAtlas. (2) resizeAndFit(initial) BEFORE rebuildForMode. (3) Inside rebuildForMode: fitToExtent → packNodes → setPanBounds. (4) ResizeObserver.observe AFTER initial rebuildForMode. (5) camera.onChange listener AFTER initial rebuildForMode. (6) attachInteractions LAST. |
| **IDLE-hover dim model — DECISION DEFERRED until end of Phase 2** | The dim model is a behavior, but it's also the residual "not there yet" item. Resolution: after node atom + behaviors are locked, John can see the dim alternatives side-by-side with `_forgeDebug.setDimModel('A1' \| 'A2' \| 'A3' \| 'A4')` and decide live, against a clean stack. Default during the rebuild = A4 (accept asymmetry — informative). |

**Acceptance for Phase 2:**
- Hover at 120Hz pointer rate stays smooth at 10k (rAF budget green).
- Click-lock works; click-empty clears.
- Fade flow: settled → hover → settled cycles cleanly. No snap. No jump. No stutter.
- `destroy()` cancels all 3 rAF ids; subsequent `if (local.destroyed) return` guards are belt-and-braces, not load-bearing.
- Lifecycle ORDER block at top of `forge.js` matches reality.

**Findings landing in Phase 2:** T1.3 (refreshGlyphAlphas settled-fade short-circuit), T2.7 (destroy cancels rAF ids), T2.10 (rebuildForMode cancels hover), T2.15 (lifecycle invariant block), T3.13 (recomputeFocus allocation pool), T3.10 (wholesale-replace doc).

---

### Phase 3 — WIRES

**Mandate:** lock the edge primitive.

**Sub-audit (Phase 3A):** wires-only goblin. Walks `edge.js`, EDGE_SHADER, every code path that writes `edgeStates / edgeTargets`, bucket-palette flow. Output: `AUDIT/forge-rebuild-3A-wires-2026-05-20.md`.

**Implementation (Phase 3B):**

| Dimension | Locked spec |
|---|---|
| **Bucket palette** | 7 buckets: Transmission / Parallel / Association / Kinship / Attestation / Polemic / Fusion. Slot 7 unused. Source of truth: `local.params.active_color_{bucket}` (or successor). Renderer reads via callback or uniform — no JS mirror. |
| **Edge state channel** | 0 = IDLE (slate), 1 = HOT (bucket color). Float. Single source: `local.edgeStates`. Same in-place pattern as nodes. |
| **Gradient** | Source → target darken. `mix(1.0, 0.25, edge_t)` on color, not alpha. Locked in shader comment. |
| **Width clamp** | `clamp(world_w × scale, wire_min_screen_px, wire_max_screen_px)` in screen px. World width frozen at pack time. |
| **Endpoint offset** | Wires emerge from disk perimeter, not center. `packEdges` accepts `nodeRadii: Map<id,r>`. Updated in `rebakeEdges`. |
| **Depth z** | IDLE = 0.85, HOT = 0.75. Both behind every node layer (0.6 max). |
| **GPU layout** | 12 floats × 48 bytes per instance. Frozen. |

**Acceptance for Phase 3:**
- Edge-only test (`_forgeDebug.nodesAndEdgesOnly()`) renders 3033 deities edges, 45k synthetic edges at 10k, 225k at 50k. Correct color, gradient, width clamp.
- `edgeInstanceVbo` dirty flag working (uploaded only on pack/rebake).
- Hot/idle edge fade smooth on hover changes.
- Bucket palette is single-sourced (no JS mirror).

**Findings landing in Phase 3:** T1.2 (edge portion of static-VBO dirty flag), T2.5 (glyph_tint removed via Phase 0; here we confirm no edge equivalent slipped in), T3.9 (bucketPalette SSOT), T3.15 (edge gradient alpha decision).

---

### Phase 4 — FX

**Mandate:** lock the ornament layer.

**Sub-audit (Phase 4A):** FX-only goblin. Glow, glyphs, labels, atlas. Walks every shader + buffer touched by these. Output: `AUDIT/forge-rebuild-4A-fx-2026-05-20.md`.

**Implementation (Phase 4B):**

| Sub-system | Locked spec |
|---|---|
| **Selected glow** | Quad scale = `selected_glow.w × 1.5` (headroom past smoothstep). Discard threshold = derived from `selected_glow_strength` uniform, not hardcoded. No square clip ever. |
| **Glyphs** | Atlas at 128px cells, mipmaps generated. Texture-atlas instanced quad pass. Pre-multiplied alpha. Glyph z = parent disk z (locked inline). Per-instance state from `nodeStateVbo` (reused — documented invariant). |
| **Glyph cull** | Alpha-gated in `refreshGlyphAlphas`: screen-r < 4px OR off-viewport → alpha=0. Existing `<0.02 discard` handles GPU side. Pure alpha — no pipeline change. |
| **Labels** | Pre-create capped at `min(N, label_idle_max + label_cap × 2)`. Lazy-create the rest in `ensureLabelEl`. `opacity` transition via `[data-visible]` attribute. Visible-labels Set drives position loop (no full-Map iteration). |
| **Atlas builder** | `buildAtlas(128)` async. Rasterizes 17 glyphs. Returns canvas + UV rects + typeToIdx. Mipmaps via separate `device.queue.copyTextureToTexture` chain or `createMipmaps` utility. |

**Acceptance for Phase 4:**
- At 10k: glyphs sharp at deep zoom, no pixelation. Glow has no square outline at any `selected_glow_strength`. Labels appear/disappear smoothly. Mode-switch <50ms.
- At 50k: glyphs cull below 4px screen-r — fragment cost stays bounded. Labels lazy-create.
- Atlas at 128px adds ~280 KB texture; no measurable cost on boot.

**Findings landing in Phase 4:** T1.3 (refreshGlyphAlphas — implementation lands here), T1.4 (label DOM cap), T1.5 (glyph viewport cull), T3.1 (atlas 128px + mipmaps), T3.2 (glow discard from uniform), T2.9 (glyph-z invariant comment).

---

### Phase 5 — MANAGEMENT

**Mandate:** lock the orchestration layer.

**Sub-audit (Phase 5A):** management-only goblin. Camera, mode-switch, search, scrubber, persistence, side-nav. Output: `AUDIT/forge-rebuild-5A-management-2026-05-20.md`.

**Implementation (Phase 5B):**

| Sub-system | Locked spec |
|---|---|
| **Camera** | Pan bounds clamped after every `fitToExtent`. Drift threshold N-aware (5% at 1k, 15% at 10k, 30% at 50k). `fitToExtent` accepts silent flag to suppress `onChange` emit (avoids redundant rebakes). |
| **Mode-switch** | Atomic: build new `local.mode` into a temp, swap in one synchronous block, then `drawFrame`. Cancel pending `_hoverRafId` first. Update `packedAtScale` immediately after `fitToExtent`. Refresh scrubber bounds. Save mode to LS. |
| **Search** | Lowercase index built at `rebuildForMode`. Lookup O(1) average. Fly-to with critically-damped ease. |
| **Scrubber** | rAF-coalesce on drag. `refreshScrubberBounds()` called from `rebuildForMode` so lo/hi reflect the new mode's date span. Save IN/OUT/CENTER to LS. |
| **Persistence** | One LS key: `codex-atlas/forge-runtime-v1` = `{ mode, timeline: { in, out, center }, lockedSet: [...ids] }`. Hydrated at mount. |
| **Side-nav (per John)** | Forge marked as the active focus (badge or banner). Other tabs collapsed behind a "More views" disclosure or similar — they're not deleted, just demoted. Forge is the dominant entry. |
| **Hash-router (optional)** | `?view=forge&mode=deities&focus=zeus` round-trips. Deep links work. Lower priority — fold into Phase 5 if time allows; else defer to L5 polish phase. |

**Acceptance for Phase 5:**
- Mode-switch at 10k <50ms total wall time.
- Scrubber drag at 120Hz pointer rate stays smooth at 10k.
- Reload preserves mode + timeline state.
- Side-nav reflects Forge-is-the-focus workflow.

**Findings landing in Phase 5:** T2.12 (scrubber refreshBounds), T2.13 (scrubber rAF coalesce), T2.14 (resizeAndFit zero-size bail), T2.16 (LS persistence), T3.4 (rebake debounce / N-aware drift), T3.5 (search index), T3.8 (wheel hit-test gate).

---

### Phase 6 — TAIL POLISH (autonomous per John)

**Mandate:** consume the remaining T3 backlog without further confirmation.

Items: T3.3, T3.6, T3.7, T3.12, T3.14, T3.16, T3.17, T3.18, plus anything new the layer audits surface. Each one ships as a small commit. Stops when backlog is empty or John intervenes.

---

## 3. Findings → layers map (cross-reference)

Every finding from the 5 robustness audits routes to exactly one phase. No finding is dropped.

| Audit ID | Lands in | Why |
|---|---|---|
| 01-F1 hit-test grid | Phase 1 | NODE primitive (hit = node-level) |
| 01-F2 / 04-#2 / 05-I4 glyph alpha gate | Phase 2 (gate logic) + Phase 4 (glyph specifics) | Behavior of fade pipeline → FX consumer |
| 01-F3 / 04-#1 static-VBO dirty flag | Phase 1 (node) + Phase 3 (edge) + Phase 4 (glyph) | Per-layer responsibility |
| 01-F4 label DOM cap | Phase 4 | FX/labels |
| 01-F5 glyph cull | Phase 4 | FX/glyphs |
| 01-F6 visible-labels Set | Phase 4 | FX/labels |
| 01-F7 rebake debounce | Phase 5 | Camera/management |
| 01-F8 search index | Phase 5 | Management |
| 01-F9 typed-array hoists | Phase 6 | Polish |
| 01-F10 CSR adjacency | Phase 6 | Polish |
| 02-F1 / SSOT-2 panel subscription | Phase 0 | Panel removed — moot |
| 02-F2 / SSOT-1 two-defaults | Phase 0 | Panel removed — single source is `PARAM_DEFAULTS` |
| 02-F4 iconByType | Phase 0 | Panel removed |
| 02-F6 / 03-F1 / 05-P3 destroy() leaks | Phase 1 | Renderer cleanup for node resources first (atlas+glyph come in Phase 4) |
| 02-F8 / F9 wholesale-replace | Phase 2 | Fade pipeline invariant |
| 02-F10 timeline/mode LS persistence | Phase 5 | Management |
| 02-F11 fontByScope | Phase 0 | Panel removed |
| 03-F2 destroy cancels rAFs | Phase 2 | Behavior lifecycle |
| 03-F3 rebuildForMode cancels hover | Phase 2 | Behavior |
| 03-F4 fitToExtent → onChange race | Phase 5 | Camera orchestration |
| 03-F5 scrubber refresh bounds | Phase 5 | Scrubber management |
| 03-F6 scrubber rAF coalesce | Phase 5 | Scrubber management |
| 03-F11 _forgeDebug staleness | Phase 6 | Polish |
| 03-F13 resizeAndFit zero-size | Phase 5 | Management/resize |
| 03-P11 lifecycle ORDER block | Phase 2 | Behavior lifecycle (top of forge.js header) |
| 05-C1 nodeStateVbo invariant | Phase 1 | Node GPU |
| 05-I1 glyph-z invariant | Phase 4 | FX/glyph |
| 05-I2 glow discard derived | Phase 4 | FX/glow |
| 05-I3 atlas 128px + mipmaps | Phase 4 | FX/glyph atlas |
| 05-P1 glyph_tint | Phase 0 | Panel removed |
| 05-P2 setIcon | Phase 0 | Panel removed |
| 05-P4 edge gradient alpha | Phase 3 | Wires |

---

## 4. Order-of-ops

Phases run **strictly sequentially**. Each is one Lane B slot claim, one commit, one verification gate.

Sub-audits (Phase NA) and implementations (Phase NB) within a phase can pipeline: while Phase 1B implements, Phase 2A's micro-audit goblin runs in parallel as long as it stays read-only.

Lane A (content investigation) runs unaffected throughout. Pre-commit hook enforces the split.

---

## 5. Acceptance bar (cumulative — what's true at the end)

After Phase 0 → 5 ship in sequence:

- **Drift surface = zero.** No dev panel. `PARAM_DEFAULTS` is the only source of visual params. No half-wired UI.
- **Foundation = locked.** Every primitive (node, behavior, wire, FX, management) has a written spec with inline invariant comments. A fresh agent reading `forge.js` for the first time can pick up the contract without folklore.
- **10k benchmark = passed.** Mode-switch < 50ms, hover at 120Hz stays in rAF budget, IDLE GPU bandwidth < 2 MB/s, frame time < 2ms.
- **50k benchmark = graceful degradation.** Labels capped, glyphs culled below 4px, no errors. Visibly slower but functional.
- **Dim model = chosen.** John picks A1/A2/A3/A4 live against the clean stack at end of Phase 2.
- **Side-nav = Forge-focused.** Other views collapsed; Forge prominent and marked.
- **Persistence = round-trips.** Mode + timeline survive reload. Optionally lockedSet too.

After Phase 6 (autonomous polish): every T3 item in the lock plan either ships or is documented as not-worth-it.

---

## 6. What we DON'T do during the rebuild

- Don't introduce hulls (queued separately in `AUDIT/forge-hulls-integration-plan-2026-05-20.md`).
- Don't migrate other views to Forge yet (per John's scope direction).
- Don't restore the dev panel — V2 panel design happens after foundation is locked, not during.
- Don't ship visual changes inside phases 0-3. Visible UX changes are concentrated in Phase 4 (glyphs/labels) and Phase 5 (side-nav).
- Don't pick the dim model speculatively. Phase 2 sets up the comparison; John picks at the end.

---

## 7. Estimated budget

| Phase | Sub-audit (read-only) | Implementation | Verification |
|---|---|---|---|
| 0 | — (just deletion) | 1-2 h | 30 min |
| 1 | 1 goblin parallel ~5 min | 3-4 h | 1 h |
| 2 | 1 goblin parallel ~5 min | 4-5 h | 1 h |
| 3 | 1 goblin parallel ~5 min | 2-3 h | 30 min |
| 4 | 1 goblin parallel ~5 min | 4-5 h | 1 h |
| 5 | 1 goblin parallel ~5 min | 4-5 h | 1 h |
| 6 | — | autonomous, runs to backlog exhaustion | — |

**Total foundation work (Phases 0–5):** ~18–24 h focused Lane B. Polish (Phase 6) is open-ended.

Each phase's commit is atomic. If a phase doesn't pass its acceptance gate, it does NOT ship — we iterate within the phase until it does.

---

— layered rebuild spec, 2026-05-20.
