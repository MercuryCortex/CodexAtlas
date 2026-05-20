# Forge rebuild — Phase 2A · BEHAVIORS micro-audit

**Filed:** 2026-05-20
**Filed by:** Phase 2A read-only audit goblin (no code edits, no commits except this doc)
**Scope:** the interaction + state-transition layer that sits on top of the locked NODE atom (Phase 1B, commit `2a2b9dd`). Strictly:
- `src/js/views/forge.js`: `setHoverId`, `recomputeFocus`, `toggleLock`, `animTick` + `startAnimLoop`, `tickNodeFades` + `tickEdgeFades`, `wireTimelineScrubber` pointermove, `_engine.destroy`, `rebuildForMode`'s lifecycle ordering.
- `src/js/engine/graph/adjacency.js`: `focusedSetFor` + `computeNodeStates` + `computeSelectedStates` + `computeEdgeStates`. (`interleavePairs` lives in `forge.js:1697`, not `adjacency.js` — flagged separately below.)

**Reads-before (in order):**
1. `AUDIT/forge-rebuild-layered-spec-2026-05-20.md` §2 Phase 2 — contract definitions.
2. `AUDIT/forge-robustness-lock-plan-2026-05-20.md` §3 — findings map for Phase 2 landing.
3. `AUDIT/forge-robustness-04-animation-pipeline-2026-05-20.md` — canonical pipeline review; §5 dim-model verdict.
4. `AUDIT/forge-robustness-03-lifecycle-invariants-2026-05-20.md` — F2/F3/F6 rAF cancellation + scrubber + ORDER block.
5. `AUDIT/forge-animation-pipeline-2026-05-20.md` — historical pipeline log.
6. `AUDIT/forge-rebuild-1A-node-atom-2026-05-20.md` + Phase 1B implementation (commit `2a2b9dd`) — node atom is LOCKED; header block at `forge.js:69-110` is the NODE portion that Phase 2B will extend with a BEHAVIORS section.

**Out of scope** (flagged "deferred to Phase X" wherever encountered): edge geometry / EDGE_SHADER / packEdges (P3); glyphs / atlas / GLYPH_SHADER / `refreshGlyphAlphas` (P4); labels / `syncLabels` (P4); camera math / mode-switch orchestration / scrubber bounds derivation (P5); node-atom GPU layout / pack / hit-grid (P1 — LOCKED).

---

## §1. TL;DR

1. **The BEHAVIORS layer is mechanically correct today** — hover coalesces, fades animate in-place, click-lock + click-empty work, the three-state derivation is pure-functional in `adjacency.js`. Only invariant LOCKING + 4 lifecycle cancellations are needed for Phase 2B; no algorithmic redesign required.
2. **The two CRITICAL defects** are `_engine.destroy()` not cancelling `_hoverRafId` / `idleLabelRaf` (`forge.js:474-489`) and `rebuildForMode` not cancelling `_hoverRafId` before swapping `local.mode` (`forge.js:845-1050`). Both produce use-after-destroy / ghost-hover bugs the moment a defensive `if (local.destroyed) return` guard slips in a future refactor.
3. **The dim-model A1/A2/A3/A4 decision is set up cheaply** — a single dispatcher in `recomputeFocus` (lines 1557-1585) gated by `local._dimModel`, with each option ~5-15 lines of code. Recommendation: ship Phase 2B with safe-default **A4 (accept)** + the `_forgeDebug.setDimModel('AX')` switch + `_forgeDebug.compareDimModels()` comparator helper, then defer the live pick to John.

---

## §2. Locked behavior spec — Phase 2B contract

The table below is the contract Phase 2B implements. Each row records (a) the spec, (b) where it lives, (c) whether it's documented inline today, (d) whether it's enforced by code or convention-only.

### 2.1 Three-state model

| State | Definition | Visual effect | Channel |
|---|---|---|---|
| **IDLE** | `local.focusedSet === null` (no hover AND no lock) | `dim_amount` passed to renderer as 0 → no attenuation; all nodes at full alpha | `nodeStates[i*2] === 0` for every i |
| **FOCUSED** | hover-id present OR locked-set non-empty → `focusedSet` computed as `{hoverId} ∪ 1-hop(hoverId) ∪ ⋃(lockedSet) ∪ 1-hop(lockedSet)` | non-members dim to `(1-dim_amount_nodes)`; depth z=0.6 | `nodeStates[i*2] = 1.0` for non-members; `=0.0` for members |
| **SELECTED** | hover-id ∪ lockedSet (the anchors only — no 1-hop) | size_mult = `selected_size_mult` (1.20); glow ring; depth z=0.0 | `nodeStates[i*2+1] = 1.0` for members |

- **Where the math lives:** `adjacency.js:43-64` (`focusedSetFor`), `adjacency.js:73-80` (`computeNodeStates`), `adjacency.js:110-117` (`computeSelectedStates`), `adjacency.js:95-103` (`computeEdgeStates`), `forge.js:1690-1695` (`computeSelectedSet` — the anchors-only Set).
- **Documented inline today:** YES in `adjacency.js` (header comments at each function). PARTIAL in `forge.js:1547-1552` (3-state comment block above `recomputeFocus`). NO consolidated header block at top of `forge.js` defining the three states authoritatively.
- **Enforcement:** convention. `focusedSet` is a JS Set; nothing prevents a future agent from writing `local.focusedSet = …` outside `recomputeFocus` and shorting the contract.

### 2.2 Hover transition

| Aspect | Spec |
|---|---|
| Trigger | `pointermove` on `canvas` (`forge.js:2045-2070`); `pointerleave` (`forge.js:2071-2074`); `wheel` (`forge.js:2142-2155`). |
| Synchronous part | `local.hoverId` mutation + `canvas.classList.toggle('is-hover-node')` + `#forge-status-hover` text (`forge.js:1737-1749`). |
| Coalesced part | `recomputeFocus()` deferred to next rAF via `_hoverRafId` + `_hoverPendingId` (`forge.js:1731-1759`). |
| Cadence | At most one `recomputeFocus` per frame, regardless of pointer rate (120Hz pointer → 60Hz recompute). |
| Documented inline | YES (`forge.js:1717-1730`, 14 lines of architectural rationale). |
| Enforcement | enforced by the `if (_hoverRafId) return;` guard at `1753`. ✓ |
| **Gap** | `wheel` handler calls `setHoverId(hit)` synchronously on every wheel event — but ALSO calls `hitTestAt` synchronously (`forge.js:2153-2154`). The hit-test is now O(1) via the spatial grid (Phase 1B N1), so this is acceptable at 10k. NOT a Phase 2B finding — flagged for Phase 5/Phase 6. |

### 2.3 Click-lock transition

| Aspect | Spec |
|---|---|
| Trigger | `pointerup` without intermediate `pointermove` (`forge.js:2095-2110`) → `toggleLock(hit)` where `hit` may be `null`. |
| Effect (id) | `lockedSet.add(id)` if absent, else `.delete(id)`. ✓ |
| Effect (null = click-empty) | `lockedSet.clear()` (`forge.js:2024-2027`). Documented inline at `2021-2023`. ✓ |
| State propagation | Synchronous `recomputeFocus()` at end of `toggleLock` (`forge.js:2035`). Click rate is low → no need for coalesce. ✓ |
| HUD update | `#forge-status-lock` text from `lockedSet.size` (`forge.js:2033-2034`). |
| Documented inline | YES at `forge.js:2021-2023` for the click-empty semantics. |
| Enforcement | enforced by the synchronous recompute. ✓ |

### 2.4 Fade pipeline

| Aspect | Spec |
|---|---|
| Constant | `FADE_DURATION = 0.15` (`forge.js:1643`). Tunable history in the inline comment: 0.10 → 0.25 → 0.15. |
| Storage | `local.nodeStates` (live) ↔ `local.nodeTargets` (snap-to); interleaved `(state, selected)` pairs. `local.edgeStates` ↔ `local.edgeTargets`; single float per edge. |
| Advancement | `tickNodeFades(dt)` / `tickEdgeFades(dt)` — IN-PLACE `for i { if c===t continue; advance toward t by dt/FADE_DURATION }` (`forge.js:1644-1688`). |
| Target updates | `recomputeFocus` writes targets via `.set()` (NOT wholesale replace) when length matches; allocates fresh only on length-mismatch (`forge.js:1591-1615`). `rebakeNodes` follows the same pattern (`forge.js:2331-2343`); `rebakeEdges` similarly (`forge.js:2358-2374`). |
| Documented inline | YES at `forge.js:1586-1599` (recomputeFocus) + `2316-2330` (rebakeNodes). The mirror in `rebakeEdges` has the same comment. |
| Enforcement | convention. `rebuildForMode:956-959` LEGITIMATELY wholesale-replaces because cross-mode N differs — this exception is referenced obliquely at `949-960` but lacks an explicit "EXCEPTION to fade-invariant" comment. T2.15 / T3.10 → Phase 2B. |
| **Cross-pipeline** | `nodeStateVbo` reused by glyph pass — Phase 4 invariant, NOT Phase 2B. |

### 2.5 Pointer-event coalescing strategy

| Path | Coalesced? | Where |
|---|---|---|
| `pointermove` hover | ✓ rAF via `_hoverRafId` | `forge.js:1733-1760` |
| `pointerleave` | ✓ same path (calls `setHoverId(null)`) | `forge.js:2071-2074` |
| `wheel` | ✓ same path (calls `setHoverId(hit)` after hit-test) | `forge.js:2153-2154` |
| `click` (pointerup-without-move) | not needed — discrete, low-rate | `forge.js:2024-2036` |
| **Scrubber `pointermove`** | ✗ **SYNCHRONOUS `recomputeFocus()` per move** | `forge.js:1929-1953` — see §3 finding B2 |
| Pan `pointermove` (camera) | indirect via `camera.onChange` → drawFrame | `forge.js:2050-2066` + `756-784` |

### 2.6 rAF ownership map

| rAF id | Owner | Schedules | Cancelled on `destroy()`? | Cancelled on `rebuildForMode`? |
|---|---|---|---|---|
| `local.animRafId` | the fade + camera-motion loop | `animTick` (`forge.js:1496-1531`) | ✓ YES (`forge.js:476-479`) | ✗ NO — but self-exits next tick when `local.destroyed === true` |
| `_hoverRafId` (closure-local, NOT on `local`) | hover coalesce | one-shot rAF in `setHoverId` (`forge.js:1733-1759`) | ✗ **NO** — F2 / 03-F2 | ✗ **NO** — F3 / 03-F3 / T2.10 |
| `local.idleLabelRaf` | label visibility (idle-tier) | one-shot rAF in `scheduleIdleLabelSync` (`forge.js:1396-1403`) | ✗ **NO** — F2 / 03-F2 | ✗ NO — but mostly self-bails via `local.destroyed` check inside |

**Documented inline today:** the dirty-flag pattern at `forge.js:431` documents `nodeInstancesDirty` (Phase 1B N2) but the rAF ownership map is undocumented. Phase 2B should add a 3-row comment block above the `destroy()` definition or in the lifecycle ORDER header.

**Enforcement:** convention. Each rAF callback has an internal `if (local.destroyed) return;` belt-and-braces guard (`1502`, `1400`, `1757`). The defence-in-depth is real but the audit cited in Phase 2 contract (`destroy()` cancels all 3 rAF ids — belt-and-braces, not load-bearing) is NOT implemented today for `_hoverRafId` + `idleLabelRaf`.

### 2.7 `destroy()` cancellation policy

Current state (`forge.js:474-489`):
- ✓ Cancels `local.animRafId`.
- ✓ Disconnects `local.resizeObs`.
- ✓ Calls `local.renderer.destroy()` (Phase 1B owned[] pattern enumerates GPU resources).
- ✓ Calls `camera.stopAnim()`.
- ✗ **Does NOT cancel `_hoverRafId`.**
- ✗ **Does NOT cancel `local.idleLabelRaf`.**
- ✗ Does NOT clear `window._forgeDebug` / `window._forge.setParam` (latter doesn't exist anymore post-Phase-0). 03-F11 latent.
- ✗ Does NOT explicitly null out `local.labelEls` DOM nodes — `local.destroyed = true` plus the rootEl unmount handles this via DOM removal, so today benign.

### 2.8 Lifecycle ORDER constants

Today the NODE portion is locked at `forge.js:69-110` (Phase 1B). It documents up to step 7 (allocate state buffers) of the rebuild ORDER. The BEHAVIORS portion is implicit:

| Order step | Site | Documented? |
|---|---|---|
| 1. `gpu.create` → `setBucketPalette` → fire-and-forget `buildAtlas` | `forge.js:682-727` | partial (inline comments) |
| 2. `resizeAndFit(initial=true)` BEFORE `rebuildForMode` | `forge.js:737-742` | YES (comment at 739-741) |
| 3. Inside `rebuildForMode`: `fitToExtent` BEFORE `packNodes` | `forge.js:864-891` | YES (pack-scale invariant comment) |
| 4. `setPanBounds` AFTER `fitToExtent` | `forge.js:877-884` | YES |
| 5. `ResizeObserver.observe(stage)` AFTER `rebuildForMode` | `forge.js:744-748` | NO |
| 6. `camera.onChange` listener AFTER `rebuildForMode` | `forge.js:756-784` | NO |
| 7. `attachInteractions()` LAST | `forge.js:832` | NO |

Phase 2B needs to extend the header block at `forge.js:69-110` with a "BEHAVIORS ORDER" subsection covering steps 5/6/7 + the destroy() cancellation policy.

---

## §3. Findings — severity-ranked

Each finding is **strictly BEHAVIORS-scope**. Out-of-scope items are flagged "deferred to Phase X".

### CRITICAL (active correctness / load-bearing)

#### B1. `_engine.destroy()` does not cancel `_hoverRafId` or `local.idleLabelRaf`
- **Where:** `forge.js:474-489`.
- **What:** `destroy()` cancels `local.animRafId` but leaves `_hoverRafId` (closure-local at `1732`) and `local.idleLabelRaf` (`1397`) outstanding. The internal `if (local.destroyed) return;` guards at `1502`, `1400`, `1757` save us today, but they are belt-and-braces. A single missed guard in a refactor produces use-after-destroy on stale `local.mode`. Lock-plan T2.7 / 03-F2 land here.
- **Proposed approach (NO patch):** In `destroy()`, after the `animRafId` cancel block, add equivalent cancellations for both ids (with try/catch + null-set, mirroring the existing animRafId pattern). `_hoverRafId` requires either lifting the closure-local var onto `local`, or exposing a `cancelHoverCoalesce()` helper from the `setHoverId` closure scope.

#### B2. `rebuildForMode` does not cancel pending `_hoverRafId` before swapping `local.mode`
- **Where:** `forge.js:845` (entry) through `1050` (end). The mode-swap happens at `931-943`; the hoverId is reset to `null` at `963` but the pending rAF (with the OLD `_hoverPendingId`) is not cancelled.
- **What:** If the user has a pending hover at the moment they switch modes, the rAF callback fires AFTER mode-swap, calls `recomputeFocus()` which reads the new mode's `nodePacked.idIndex` + adjacency but with `local.hoverId === null` (cleared at 963). Net effect today: a single recompute with empty hover state — usually harmless. **But:** if mode-switch is ever made async, or if the rAF callback's `_hoverPendingId` is ever consulted before reading `local.hoverId`, this becomes a ghost-hover bug. Lock-plan T2.10 / 03-F3 land here.
- **Proposed approach (NO patch):** At top of `rebuildForMode`, before the `local.mode = …` swap, cancel `_hoverRafId` + clear `_hoverPendingId` (same pattern as B1, ideally factored into a single helper).

### IMPORTANT (perf or perception)

#### B3. `recomputeFocus` allocates 4 transient typed-arrays per hover
- **Where:** `forge.js:1557` (`computeNodeStates` → fresh Float32Array), `1558-1560` (`computeSelectedStates` → fresh Float32Array), `1591` (`interleavePairs` output Float32Array), `1606` (`computeEdgeStates` → fresh Float32Array).
- **What:** At 60Hz hover that's 240 transient typed-array allocs/sec (~12 KB). Lock-plan T3.13 / 04-#3-polish-#3 land here. Negligible at deities scale; at 10k it's still <100 KB/sec — under GC pressure threshold.
- **Severity in BEHAVIORS scope:** IMPORTANT but not blocking. Phase 2B can fold it in via a `local.scratch.{nodeStateArr, selectedArr, edgeStateArr}` pool that `adjacency.js` writes into via additional `*Into(out, ...)` variants. Optional within Phase 2B; can defer to Phase 6.

#### B4. Scrubber pointermove fires synchronous `recomputeFocus` per move
- **Where:** `forge.js:1929-1953` — `onPointerMove` handler in `wireTimelineScrubber`, specifically the `if (rangeChanged) recomputeFocus();` at line 1953.
- **What:** At 120Hz drag rate the scrubber re-derives `focusedSet` + writes both fade target buffers 120×/sec. Same anti-pattern that was fixed for hover in commit `98bc609`. Lock-plan T2.13 / 03-F6 / 04-#3 land here.
- **Severity in Phase 2B scope:** the scrubber's date-bounds derivation is Phase 5; but the rAF-coalesce on its pointermove is **BEHAVIORS-scope** because it touches the same recomputeFocus / fade-target pipeline that Phase 2B locks. Phase 2B should add a `_scrubRafId` + `_pendingScrubRange` coalesce mirroring `setHoverId`'s pattern — without redesigning bounds derivation.
- **Proposed approach (NO patch):** lift the `_scrubRafId` closure-local + pending payload; in the pointermove handler, mutate `t.inDate / t.outDate` + `refreshUI()` synchronously (cheap, visible feedback), schedule the recompute via rAF identical to setHoverId.

#### B5. `rebuildForMode`'s wholesale-replace of state buffers is the SOLE legitimate exception — not commented as such
- **Where:** `forge.js:956-959` (`local.nodeStates = new Float32Array(...)` × 4 lines).
- **What:** This IS the right behavior for cross-mode switches (instance counts differ; preserving old fade buffers would corrupt the new mode). But there's no inline comment marking it as the SOLE legitimate wholesale-replace site. A future agent who "harmonizes" `rebuildForMode` with `rebakeNodes`'s fade-aware pattern would break cross-mode hover. Lock-plan T3.10 / 03-F10 land here.
- **Proposed approach (NO patch):** add a 6-line "EXCEPTION to fade pipeline invariant" comment block immediately above the four state-buffer assignments, referencing this audit + the rebakeNodes/Edges pattern for contrast.

#### B6. IDLE-vs-LOCKED hover dim model — needs `setDimModel('AX')` setup
- **Where:** `forge.js:1553-1634` (`recomputeFocus`) + `1668-1688` (`tickNodeFades`).
- **What:** Per audit 04 §5 verdict the IDLE-vs-LOCKED feel asymmetry is a UX-design call, not a perf bug. Phase 2 contract (`layered-spec` line 116) calls for `_forgeDebug.setDimModel('A1'|'A2'|'A3'|'A4')` so John can compare live against a clean stack. Today no such mechanism exists.
- **Proposed approach (NO patch — see §5 for sketches of each option):** add `local._dimModel = 'A4'` (default), `_forgeDebug.setDimModel(s) = { local._dimModel = s; recomputeFocus(); drawFrame(); }`, and dispatch in `recomputeFocus` based on `local._dimModel`. Each option is ~5-15 lines as detailed in §5.

### POLISH (latent / convention-only)

#### B7. `interleavePairs` lives in `forge.js`, not `adjacency.js`
- **Where:** `forge.js:1697-1705`.
- **What:** The Phase 2 contract names `interleavePairs` alongside `focusedSetFor`/`computeNodeStates`/etc. — but in code it's a private helper inside `forge.js`'s `render()` closure. Move-to-adjacency would simplify the contract surface AND let it write into a caller-provided typed array (addresses B3).
- **Severity:** POLISH — convention-only. Phase 2B can either move it (~10 lines incl. into-variant) or document its location explicitly in the BEHAVIORS header block.

#### B8. `_hoverPendingId` is captured as closure-local but its READ inside the rAF is unused
- **Where:** `forge.js:1752-1759`. `setHoverId` writes `_hoverPendingId = newId`, but the rAF callback at `1754-1759` reads `local.hoverId` (set synchronously earlier in the same call). `_hoverPendingId` is reset to `undefined` at 1756 but never consumed.
- **What:** Dead-state. The original design probably intended the rAF callback to read `_hoverPendingId` (to handle the case where multiple `setHoverId` calls land in one frame). The current shape works because the synchronous mutation at 1737-1738 has already updated `local.hoverId` to the LATEST value. Confusing but correct.
- **Proposed approach (NO patch):** either remove `_hoverPendingId` entirely (the synchronous mutation already gives the rAF the right state) OR document explicitly that it exists for the `setHoverId(X)` → `setHoverId(X)` short-circuit at line 1734.

#### B9. `computeNodeStates` returns a fresh Float32Array on every call — same for `computeSelectedStates` / `computeEdgeStates`
- **Where:** `adjacency.js:74`, `:97`, `:111`.
- **What:** Same as B3 (the BEHAVIORS-side allocation pressure). Phase 2B may extend the API with `*Into(out, …)` siblings that write into a caller-provided typed array — preserves the pure-function shape while letting recomputeFocus reuse buffers.
- **Severity:** POLISH — paired with B3.

#### B10. Lifecycle ORDER constants (BEHAVIORS portion) undocumented at top of `forge.js`
- **Where:** `forge.js:69-110` has the NODE portion (Phase 1B). The BEHAVIORS portion is implicit.
- **What:** Steps 5 (ResizeObserver observe), 6 (camera.onChange listener), 7 (attachInteractions) plus the destroy() cancellation policy are not in the header block. Lock-plan T2.15 / 03-P11 land here.
- **Proposed approach (NO patch):** extend the existing NODE spec-lock block with a "BEHAVIORS ORDER + INVARIANTS" subsection — 20-30 lines covering the rAF map (§2.6), destroy policy (§2.7), and the wholesale-replace exception note (B5).

---

## §4. Phase 2B implementation checklist

Derived from §3 + Phase 2 contract + lock-plan §3 findings map. Required = blocks acceptance gate; recommended = strongly preferred; optional = can fold into Phase 6.

### REQUIRED

- [ ] **B1** — `_engine.destroy()` cancels `_hoverRafId` + `local.idleLabelRaf` (with try/catch + null-set). Lift `_hoverRafId`/`_hoverPendingId` onto `local`, OR expose a `cancelHoverCoalesce()` helper from the inner scope.
- [ ] **B2** — `rebuildForMode` calls the same `cancelHoverCoalesce()` before swapping `local.mode`. Recommended placement: top of the function, before `modemod.isValidMode` check fails (so an invalid id still drains pending hover).
- [ ] **B5** — Inline "EXCEPTION to fade pipeline invariant" comment above the 4 `local.{nodeStates,nodeTargets,edgeStates,edgeTargets} = new Float32Array(...)` lines at `forge.js:956-959`.
- [ ] **B10** — Extend the spec-lock header block (`forge.js:69-110`) with a BEHAVIORS ORDER + INVARIANTS subsection: 3-state model authoritative definitions, hover transition + coalesce contract, click-lock + click-empty semantics, FADE_DURATION + in-place advance invariant + the SOLE wholesale-replace exception, rAF ownership map (3 rows), destroy() cancellation policy.
- [ ] **B6** — `local._dimModel = 'A4'` default + `_forgeDebug.setDimModel('A1'|'A2'|'A3'|'A4')` switch + dispatcher in `recomputeFocus`. Bodies of A1/A2/A3 land but are dormant under A4. Acceptance proof: `_forgeDebug.setDimModel('A1'); hover; setDimModel('A2'); hover; …` visibly swaps strategy.

### RECOMMENDED

- [ ] **B4** — Scrubber pointermove rAF-coalesce. `_scrubRafId` + `_pendingScrubChanged` boolean; UI feedback (`refreshUI()`) stays synchronous; the `recomputeFocus()` call is the only thing deferred to rAF.
- [ ] **B8** — Either remove unused `_hoverPendingId` OR explicitly document its role at lines 1731-1734.
- [ ] **B9 + B3** — `adjacency.js` exports `computeNodeStatesInto(out, idIndex, focusedSet)` + selected/edge siblings; `recomputeFocus` allocates a scratch pool once on `local.scratch.*` and reuses. Pair with B7.

### OPTIONAL (can defer to Phase 6)

- [ ] **B7** — Move `interleavePairs` from `forge.js` to `adjacency.js` (or `forge.js` → keep but add explicit JSDoc that says it's a BEHAVIORS helper). Defer if B9 lands and the new `*Into` API obsoletes the standalone interleave path.

---

## §5. Open questions for John / lead

The dim-model A1/A2/A3/A4 choice (per Phase 2 contract / lock-plan §3.A) is the only Phase 2B-blocking question. Phase 2B itself can ship with safe-default A4 + the switch in place; the actual choice is John's to make at end of Phase 2 against a clean stack.

### Q1. Dim model — pick one to be the DEFAULT after Phase 2B lands

Each option, sketched as a code change relative to current `recomputeFocus` at `forge.js:1553-1634`:

#### A1 — Softer IDLE dim
**Change shape:** `recomputeFocus` reads `local._dimModel === 'A1'` and, when computing `effectiveDimN` (currently in `drawFrame:1157`), substitutes a HALVED `dim_amount_nodes` when `local.lockedSet.size === 0` (i.e., IDLE-hover). LOCKED-hover keeps full dim.
**Code lines:** 3-5 in `drawFrame`'s dim-amount computation + a `local._dimModel` read.
**Code:**
```js
const isIdleHover = !local.lockedSet || local.lockedSet.size === 0;
const dimMul = (local._dimModel === 'A1' && isIdleHover) ? 0.5 : 1.0;
const effectiveDimN = hasFocus ? local.params.dim_amount_nodes * dimMul : 0;
```
**Net effect:** IDLE-hover dims to ~45% instead of 90%. Scene stays focused but the mass-flip is gentler. **Safest experimental default.**

#### A2 — Split semantics: IDLE = boundary only, LOCKED = full mass-dim
**Change shape:** `focusedSetFor` already includes 1-hop; A2 changes IDLE-hover to dim everything OUTSIDE the 1-hop + the hover-id itself — which is what it does today. The TRUE split is that LOCKED-hover dims aggressively while IDLE-hover dims SOFTLY (basically A1) + lock anchors render with a visual badge so the user can read "I'm exploring" vs "I'm reading."
**Realised as:** A1's dim halving + a CSS treatment on `.is-locked` indicator (Phase 4 / Phase 5 territory).
**Code lines:** 3-5 (same as A1) + Phase-4-deferred CSS.
**Net effect:** semantic story is clearer but the visible difference vs A1 is mostly the lock indicator. **In Phase 2B scope, A2 collapses to A1 + a TODO for Phase 4 CSS.**

#### A3 — Staggered cascade by ring
**Change shape:** `recomputeFocus` precomputes a per-node `ringDist` (0 = hover, 1 = 1-hop, 2 = 2-hop, ∞ = beyond) once per hover. `tickNodeFades` reads ringDist and offsets each node's fade-start by `ringDist * 0.05s` so the dim "ripples outward." Requires a new state-channel (or a third interleaved float in `nodeTargets`) OR a pre-stored delay map (`local.fadeDelayByIdx Float32Array(N)`).
**Code lines:** ~25 — new BFS in `recomputeFocus` (~10 lines), per-node delay tracking in `tickNodeFades` (~10 lines), buffer allocation/resize at rebuildForMode (~5 lines).
**Code (sketch):**
```js
// In recomputeFocus, when _dimModel === 'A3':
// compute ringDist via BFS from hoverId (max depth 2):
const ringDist = local.scratch.ringDist || (local.scratch.ringDist = new Uint8Array(idx.length));
ringDist.fill(255);
// ... BFS from hoverId, write ringDist[i] = 0/1/2 for hover/1hop/beyond
// In tickNodeFades: use `step * (1 - ringDist[i]*0.3)` for non-hover ramp.
```
**Net effect:** Eye reads ripple motion as intentional rather than busy. Highest visual polish; largest code change in Phase 2B.

#### A4 — Accept asymmetry (DEFAULT)
**Change shape:** none. Current behavior.
**Code lines:** 0.
**Net effect:** IDLE-hover *should* feel like the whole scene reacts; LOCKED *should* feel surgical. The two modes carry different semantic load. **Recommended Phase 2B default; ships zero-risk; John picks live.**

#### The comparator helper

```js
_forgeDebug.setDimModel = (s) => {
  if (!['A1','A2','A3','A4'].includes(s)) return null;
  local._dimModel = s;
  if (local.hoverId || (local.lockedSet && local.lockedSet.size)) recomputeFocus();
  drawFrame();
  return s;
};
_forgeDebug.compareDimModels = () => ({
  current: local._dimModel || 'A4',
  hoverId: local.hoverId,
  lockedSize: local.lockedSet ? local.lockedSet.size : 0,
  focusedSize: local.focusedSet ? local.focusedSet.size : 0,
  // Caller can `setDimModel('A1')` → snap a screenshot → `setDimModel('A2')` → snap → compare.
  // Returns the values that change WITHOUT changing the model so John can capture before/after.
});
```

### Q2. Move `interleavePairs` to `adjacency.js`? (Phase 2B optional)

**Recommendation:** YES if B9 lands (the `*Into` variants), because the natural home for "BEHAVIORS-state-derivation" is `adjacency.js`. NO if B9 is deferred — leave it in `forge.js` and document its location.

### Q3. Lift `_hoverRafId` / `_hoverPendingId` onto `local`, or expose a `cancelHoverCoalesce()` helper?

**Recommendation:** lift onto `local.hoverRafId` + `local.hoverPendingId`. Symmetric with `local.animRafId` and `local.idleLabelRaf`; makes the rAF ownership map (§2.6) literal. The closure-local choice in the original commit was probably reflex; no semantic reason to keep it closure-local.

### Q4. Should Phase 2B also fold in B4 (scrubber rAF-coalesce), or defer to Phase 5?

**Recommendation:** fold in. The fix is mechanical (~15 lines, same pattern as setHoverId), it touches the same `recomputeFocus` pipeline Phase 2B locks, and lock-plan §3 explicitly lands T2.13 in Phase 5 — but the BEHAVIORS-side coalesce IS Phase 2B's responsibility. Phase 5 owns the bounds-derivation split; Phase 2B owns the rAF coalesce.

---

## §6. Acceptance test ideas

Concrete `_forgeDebug.*` calls + interaction sequences that prove Phase 2B is correct.

### T1. Hover at 120Hz pointer rate stays in rAF budget

```
_forgeDebug.setDimModel('A4');   // default
// In DevTools Performance panel, start recording.
// Simulate 120Hz pointermove across the canvas for 5s
// (use Chrome's Synthetic events panel OR just shake the cursor).
_forgeDebug.cameraState();       // sanity check still responsive
// Acceptance: zero recomputeFocus calls per frame above 1
// (verified by adding a counter inside recomputeFocus that
//  _forgeDebug exposes; counter increments at <= 60Hz during the test).
```

Pass criterion: `recomputeFocus` invocation count ≤ frame count over the 5s window (i.e., ≤ 300 calls for a 60Hz tab).

### T2. LOCKED → hover-neighbour-change does NOT snap the fade

```
// Lock node A:
_forgeDebug.toggleLock('node-a-id');
// Pre-record fade state mid-transition:
const states0 = Array.from(_forgeDebug.cameraState && {}); // placeholder for nodeStates snapshot via dumpBugState
const dump1 = await _forgeDebug.dumpBugState();
// Move hover to a neighbour of A (B):
// (programmatically via _forgeDebug.hitTestAt + setHoverId equivalent — or
//  use a synthetic pointermove via DOM event dispatching)
// Take a second dump after ~50ms (mid-fade):
const dump2 = await _forgeDebug.dumpBugState();
// Acceptance: dump1 and dump2 show nodeStates values in the
// half-advanced range (not all 0/1 — actual interpolation
// values like 0.33, 0.67, etc.).
```

Pass criterion: between the two dumps, no node-state value jumps from one binary to the other binary in a single frame interval — the fade interpolation is visible.

### T3. Mode-switch with pending `_hoverRafId` does NOT produce ghost-hover

```
// Hover a node in mode 'deities':
// (programmatic pointermove → setHoverId; do NOT wait for the rAF)
// Immediately switch mode:
document.getElementById('forge-status-mode').value = 'documents';
document.getElementById('forge-status-mode').dispatchEvent(new Event('change'));
// Wait one rAF, then snapshot:
await new Promise(r => requestAnimationFrame(r));
const dump = await _forgeDebug.dumpBugState();
// Acceptance: dump.js.hoverId === null AND
// dump.js.focusedSetSize === null (or 0) — no stale focus from the prior mode's hover.
```

Pass criterion: `hoverId === null` AND `focusedSetSize === null|0` after the mode-switch.

### T4. `destroy()` leaves zero outstanding rAFs

```
// Trigger interactions to schedule all 3 rAF ids:
// 1. setHoverId → _hoverRafId pending
// 2. scheduleIdleLabelSync → local.idleLabelRaf pending
// 3. startAnimLoop → local.animRafId pending
// (Hover a node then scroll; this schedules all three.)
// Then destroy:
document.querySelector('.forge-pane')._engine.destroy();
// Snapshot after one rAF:
await new Promise(r => requestAnimationFrame(r));
// Acceptance: no console errors. No further drawFrame calls.
// (Easiest assertion: instrument recomputeFocus / animTick /
//  syncLabels to console.error if they fire post-destroy.)
```

Pass criterion: zero post-destroy invocations of `animTick`, `recomputeFocus`, or `syncLabels`. (Today, `animTick` is safe because its rAF is cancelled; `_hoverRafId` + `idleLabelRaf` rely on the internal `local.destroyed` guard. Phase 2B B1 makes the cancellation explicit + load-bearing.)

### T5. `setDimModel('AX')` visibly swaps strategy

```
// Hover a node so we have something to compare:
// (programmatic setHoverId equivalent)
_forgeDebug.setDimModel('A4'); await new Promise(r => requestAnimationFrame(r));
// Screenshot or snapshot: nodeStates values for non-focused nodes ≈ 1.0
const dumpA4 = await _forgeDebug.dumpBugState();
_forgeDebug.setDimModel('A1'); await new Promise(r => requestAnimationFrame(r));
const dumpA1 = await _forgeDebug.dumpBugState();
// Acceptance: dumpA1 shows the SAME nodeStates values
// (the JS-side state doesn't change — only the dim_amount multiplier
//  passed to drawFrame does). Visually the canvas dims at 45% vs 90%.
// For A3 (cascade): nodeStates values for non-focused nodes show a
// per-ring delay pattern, not all at 1.0 simultaneously.
```

Pass criterion: visual confirmation against screenshots, OR (for A3) the per-frame nodeStates show a temporal cascade pattern.

### T6. Click-empty clears (regression)

```
_forgeDebug.toggleLock('node-a-id');     // lock A
_forgeDebug.toggleLock('node-b-id');     // lock B too
console.assert(_forgeDebug.lockedIds().length === 2);
// Click on empty canvas (no hit):
_forgeDebug.toggleLock(null);            // simulates click-empty
console.assert(_forgeDebug.lockedIds().length === 0);
console.assert(_forgeDebug.hoverId() === null || typeof _forgeDebug.hoverId() === 'string');
// Acceptance: lockedSet empty; recomputeFocus has run; focusedSet === null.
const dump = await _forgeDebug.dumpBugState();
console.assert(dump.js.focusedSetSize === null || dump.js.focusedSetSize === 0);
```

Pass criterion: lockedSet empties and focusedSet returns to null.

### T7. Scrubber drag does NOT stutter under 120Hz pointer rate (if B4 lands)

```
// Programmatic 120Hz pointermove over the scrubber's IN handle for 3s.
// Acceptance: <= 180 recomputeFocus calls in the 3s window (60Hz cap).
```

Pass criterion: `recomputeFocus` counter under 180 invocations over 3 seconds. (Today this would be ~360.)

---

## §7. Recap for the implementing agent

**Phase 2B is safe to cast with A4 default + the comparison switch.** The dim-model decision can be deferred to John's live comparison at end of Phase 2; nothing in §3 BLOCKS implementation behind that decision.

**Order of edits in Phase 2B (suggested):**
1. Lift `_hoverRafId` / `_hoverPendingId` onto `local` (Q3 + prerequisite for B1/B2).
2. Add `cancelHoverCoalesce()` + `cancelIdleLabelRaf()` helpers.
3. Wire B1 (destroy()) + B2 (rebuildForMode()).
4. Add `local._dimModel = 'A4'` + `_forgeDebug.setDimModel` + `compareDimModels` + the dispatcher in `recomputeFocus` (A4 default = current behavior; A1 implemented; A2 = A1 + Phase-4 TODO; A3 implemented with scratch ringDist buffer).
5. Wire B4 (scrubber rAF coalesce) — same pattern as setHoverId.
6. Inline comments: B5 (wholesale-replace exception note), B10 (extend the header block at lines 69-110 with the BEHAVIORS subsection).
7. Optional: B9 (`*Into` variants in adjacency.js) + B7 (move interleavePairs).
8. Verify against §6 T1-T7.

— audit closed 2026-05-20. Phase 2A goblin. No code changes.
