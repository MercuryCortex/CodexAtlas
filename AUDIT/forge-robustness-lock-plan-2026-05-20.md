# Forge Robustness Lock Plan — synthesis of audits 01–05

**Filed:** 2026-05-20
**Filed by:** opus (lead, audit synthesis)
**Synthesizes:** `AUDIT/forge-robustness-0[1-5]-*-2026-05-20.md`
**Mandate (John):** *"we're not there — must audit from the ground up — robust super solid UI/UX before we continue crafting — this app will have TONS of nodes — decisions need to be made solid at this stage, no little things left."*

**Acceptance bar agreed with John:**
- **Scale:** 10k nodes "feels like deities does today" (663 N / 3033 E). Must NOT break at 50k via adaptive constraints (LOD / culling / buffer caps).
- **Scope:** Forge only. Other views will be rebuilt on Forge later.
- **Quality:** performance + correctness. Visual hierarchy + interaction model are downstream.

---

## 1. Headline — what 5 goblins agree on

| | Audit verdict |
|---|---|
| 🟢 **Pipeline is structurally correct.** | No active correctness bugs in shaders, depth scheme, fade flow, hover coalescing, or state-buffer pattern. The depth-direction fix in `bfc35d2` is verified correct. The convention flip from 2026-05-18 holds. |
| 🟡 **All the residual "not there yet" perf is concentrated in 5 places.** | Hit-test, static-VBO uploads, glyph alpha refresh, label DOM pre-creation, glyph culling. Each is mechanical to fix. Together they buy 10k. |
| 🟡 **Three drift-class families survived the 2026-05-18 patches.** | One-shot Option-B sync, two `default:` tables, missing destroy()-list entries. Plus three half-wired features the panel exposes that the engine ignores (`iconByType`, `glyph_tint`, `fontByScope`). |
| 🔴 **The IDLE-hover-feels-heavier-than-LOCKED gap is a UX-design call, NOT a perf bug.** | Per-frame compute is identical between the two; what differs is the visual mass of change (~600 nodes vs ~10). No engineering fix will close it. Closing it requires picking a dim model. |
| 🔴 **Two structural invariants are load-bearing but undocumented.** | `nodeStateVbo` cross-pipeline reuse + glyph-z=disk-z via draw-order. Both are correct today; both are silent if the next agent refactors wrong. |

**Net:** the foundation is not broken — it is **underspecified**. Lock the invariants explicitly, kill the 5 perf hot-spots, decide the dim model, ship.

---

## 2. Consolidated findings — severity-ranked + deduplicated across audits

### 🔴 TIER 1 — REQUIRED for 10k acceptance (perf foundation)

| ID | Finding | Source | Where | What |
|---|---|---|---|---|
| T1.1 | **Hit-test is O(N) per pointermove, no spatial index** | 01-F1 | `forge.js:1356-1379, 1937-1962` | At 10k, ~3-5ms per move; rAF coalesce doesn't help (it gates `recomputeFocus`, not `hitTestAt`). Fix: uniform grid keyed off `worldExtent`. |
| T1.2 | **Static-instance VBOs uploaded every frame** | 01-F3, 04-#1, 05-I4 | `webgpu.js:1067-1075, 1138-1140` | `nodeInstanceVbo` + `edgeInstanceVbo` + `glyphInstanceVbo` re-uploaded every drawFrame even when contents unchanged. At 10k: ~106 MB/s wasted GPU bandwidth. **Biggest single perf win.** Fix: per-buffer dirty flag. |
| T1.3 | **`refreshGlyphAlphas` short-circuit doc-promised, never implemented** | 01-F2, 04-#2, 05-I4 | `forge.js:1202-1216` | Comment claims settled-fade gate; loop + GPU write are unconditional. Adds ~21 KB/frame at idle at deities scale; ~1.6 MB/frame at 50k. |
| T1.4 | **Label DOM pre-creation scales with N, not visible-labels** | 01-F4 | `forge.js:948-966` | 10k = 150-300ms mode-switch stall. 50k = 1-2s freeze. Cap at `min(N, label_idle_max + label_cap*2)` + lazy-create rest via existing `ensureLabelEl`. |
| T1.5 | **Glyph viewport + min-size cull lost in GPU migration** | 01-F5 | `forge.js:1202-1216` (gate via alpha=0) | DOM-era cull was deleted with the migration; never re-added in GPU path. At 10k zoom-fit, all 10k glyphs run fragment shader. Fix: set `alpha=0` in `refreshGlyphAlphas` for screen-r<4px or off-viewport instances; existing `<0.02 discard` in shader handles the rest. **Pure alpha gating, no pipeline change.** |

### 🔴 TIER 2 — REQUIRED for correctness foundation (drift-class extinction + invariants)

| ID | Finding | Source | Where | What |
|---|---|---|---|---|
| T2.1 | **Two `default:` tables (PARAM_DEFAULTS vs ALL_PARAMS[id].default)** | 02-F2 | `dev-panel-forge.js:570-593`, `forge.js:110-216` | `resetOne` / `resetAll` reset to panel's pre-bake defaults, not engine's tuned `PARAM_DEFAULTS`. Today already diverging on 4+ params. Fix: SSOT-1 — drop `ALL_PARAMS[id].default`; panel hydrates from `window._forge.PARAM_DEFAULTS` only. |
| T2.2 | **Option-B pull is one-shot, module-load-order sensitive** | 02-F1 | `forge.js:457-486` | Same drift family as the 5-session bug, just narrowed. Two one-shot pushes from two directions; lucky script order is the only thing keeping it working. Fix: SSOT-2 — engine fires `forge:mount-ready`; panel always handles via `applyAllToEngine`. |
| T2.3 | **`local.iconByType` loaded but ignored by GPU glyph pipeline** | 02-F4, 03-(scrubber→setIcon), 05-P2 | `forge.js:1150-1190` (no read), `forge.js:2318-2322` (write+rebake) | Panel writes; mount-pull mirrors; GPU pipeline routes `n.type` directly. Active drift between panel UI and rendering. **John decision needed** — see §3.B. |
| T2.4 | **`local.fontByScope` half-wired** | 02-F11 | `forge.js:476-478`, no CSS consumer | Panel stores font IDs; `setFont` writes CSS vars; no CSS rule consumes them. Feature ghost. **John decision needed** — wire or hide. |
| T2.5 | **`glyph_tint` param ignored** | 05-P1 | `forge.js:1182` (hardcoded `0.55`) | Same family as T2.3 — panel surface, engine silent. |
| T2.6 | **Renderer destroy() leaks `atlasTex` / `glyphInstanceVbo` / `glyphUvUbo`** | 02-F6, 03-F1, 05-P3 | `webgpu.js:1156-1167` | `device.destroy()` masks it today, but the moment Forge keeps device across view-switches, this becomes a real leak per mount. Fix: single `owned[]` list at create; iterate on destroy. |
| T2.7 | **`_engine.destroy()` doesn't cancel `_hoverRafId` or `idleLabelRaf`** | 03-F2 | `forge.js:489` | Saved today by in-rAF `if (local.destroyed) return` guards. One missed guard in a refactor = use-after-destroy. Defensive cancellation = one line each. |
| T2.8 | **`nodeStateVbo` cross-pipeline reuse — undocumented load-bearing invariant** | 05-C1 | `webgpu.js:1083-1086, 1148` | Glyph pass reads same buffer node pass writes. Works because writeBuffer is queued before pass-end. The next refactor that reorders these silently desyncs glyph state and gets misdiagnosed as a fade bug — exactly the 2026-05-18 class. Fix: hard inline comment block at both sites. |
| T2.9 | **Glyph-z=disk-z relies on draw-order tiebreak in less-equal depth test** | 05-I1, 04 verdict | `webgpu.js:159-160` (node vs), `448-449` (glyph vs) | Correct today. Breaks silently if anyone re-orders passes, splits glyph into own pass, or flips `depthCompare` to `less`. Same family as the depth-direction bug that just shipped. Fix: hard inline comment + (optional) dev-mode render-to-readback assertion. |
| T2.10 | **`rebuildForMode` doesn't cancel pending `_hoverRafId`** | 03-F3 | `forge.js:807` | Pending rAF fires post-mode-switch, runs `recomputeFocus` on old-mode hover-id against new adjacency. Brief ghost-hover. Cancel-and-clear in `rebuildForMode`. |
| T2.11 | **`camera.fitToExtent` from `rebuildForMode` can fire `onChange`'s 5%-drift rebakeNodes on OLD mode** | 03-F4 | `forge.js:718-746, 807` | `fitToExtent` emits; listener compares against stale `packedAtScale`; can fire `rebakeNodes()` on the old mode being torn down. Wasted today; becomes a stale-radius bug if anyone optimizes the listener. Fix: set `local.packedAtScale = camera.state.scale` immediately after fit, OR add silent-fit option to camera. |
| T2.12 | **`wireTimelineScrubber` runs once at bootstrap, never re-derives on mode-switch** | 03-F5 | `forge.js:1776-1781` | Slider's lo/hi frozen at first mode's date span; filter math is still correct but displayed bounds wrong for subsequent modes. Split into `wireTimelineScrubber` + `refreshScrubberBounds`; call latter from `rebuildForMode`. |
| T2.13 | **Scrubber drag bypasses hover-coalesce** | 03-F6, 04-#3 | `forge.js:1845` | Synchronous `recomputeFocus()` on every scrubber pointermove. Latent stutter; same fix as hover (`_scrubRafId` + pending payload). |
| T2.14 | **`resizeAndFit` falls back to 1×1 viewport on zero-size stage** | 03-F13 | `forge.js:1013` | Camera state corrupts if mount-time stage is `display:none`. Early-return if `rect.w/h < 8`. |
| T2.15 | **Lifecycle ORDER constraints not documented at top of `forge.js`** | 03-P11 | `forge.js` top | Seven order-of-ops invariants live as folklore in commit messages. A header block locking them in prevents the next agent from re-introducing them. |
| T2.16 | **`local.timeline` and `local.mode.id` reset on every view-remount** | 02-F10 | `forge.js:1776, 383` | Same drift-class as params pre-Option-B. User scrubs timeline, switches view, comes back, full range. Fix: persist runtime state in `codex-atlas/forge-runtime-v1` LS key. |

### 🟡 TIER 3 — POLISH at 10k (visual quality, edge cases, dead code)

| ID | Finding | Source | Where |
|---|---|---|---|
| T3.1 | Glyph atlas at 64px, no mipmaps — soft on Retina at deep zoom | 01-P1, 05-I3 | `forge.js:~668` `buildAtlas(64)`; `webgpu.js:setGlyphAtlas` |
| T3.2 | Selected-glow discard threshold `0.15` is a magic number | 05-I2 | `webgpu.js:213` |
| T3.3 | Visible-labels Set / O(N) label sync loops | 01-F6 | `forge.js:1298-1306, 1335-1349` |
| T3.4 | `rebakeNodes → rebakeEdges` chain at 5%-drift = ~10-20ms inside `camera.onChange` at 10k | 01-F7 | `forge.js:726, 2210` |
| T3.5 | `findBestMatch` (search) is O(N × aka.length) | 01-F8 | `forge.js:1659-1688` |
| T3.6 | `new Float32Array(48)` allocated per drawFrame | 01-F9 | `webgpu.js:1045` |
| T3.7 | Adjacency built as `Map<id, Set<id>>` — high overhead at 50k | 01-F10 | `adjacency.js:19-29` |
| T3.8 | Wheel handler does synchronous `hitTestAt + setHoverId` | 03-F9, 01-(throttle) | `forge.js:2045-2046` |
| T3.9 | `bucketPalette` is a second SSOT alongside `local.params.active_color_*` | 02-F3, F7 | `webgpu.js:769-778, 793-803` |
| T3.10 | `recomputeFocus` length-mismatch branch wholesale-replaces (defensive but documented anti-pattern) | 02-F8 | `forge.js:1489-1491, 1504-1507` |
| T3.11 | `rebuildGlyphInstanceBuffer` wholesale-replaces on `glyph_*` param changes | 02-F9 | `forge.js:2268-2270` |
| T3.12 | `attachInteractions` replaces `local.resizeObs` mid-mount | 03-F12 | `forge.js:2056-2063` |
| T3.13 | `recomputeFocus` allocates 4 transient typed arrays per hover (~12 KB GC pressure) | 04-#3 | `forge.js:1483` |
| T3.14 | Dead state cleanup: `glyphEls`, `glyphFamilyColor`, `glyphOverlay`, `syncGlyph*` no-ops, Phase-1 disk pipeline, `forceWriteEdgeState` | 02-§4 polish, 04-#1 polish | various |
| T3.15 | Edge gradient `grad_mult` applied to color but not alpha | 05-P4 | `webgpu.js:343` |
| T3.16 | `ensureBuffer` never shrinks (VRAM stays at high-water mark) | 05-I6 | `webgpu.js:748-759` |
| T3.17 | LOD tier: alpha-fade tier-3 disks at extreme zoom-out | 01-§2.9 LOD | `forge.js:1083-1117` |
| T3.18 | Edge length-in-px cull at zoom-fit (50% of edges sub-pixel at 50k) | 01-§2.9 | `forge.js:854` |

---

## 3. Decisions John needs to make

Each one blocks a tier-2 batch. None can be inferred.

### A. IDLE-hover dim model (the residual "not there yet")

Audit 04 verdict: **no perf fix closes this** — IDLE-hover dims ~600 nodes; LOCKED-hover dims ~10. The eye reads the bigger change as "heavier." Pipeline does exactly what it was asked.

Options:
- **A1.** **Reduce `dim_amount_nodes` for IDLE-hover only** (LOCKED keeps full dim). Cheapest. Preserves the existing semantics but softens the visual mass-flip.
- **A2.** **Split semantics: IDLE-hover dims only direct 1-hop boundary; full mass-dim reserved for LOCKED.** Bigger semantic change; means hover and lock now *mean* different things visually. The right call if Forge is meant to feel "I'm exploring" vs "I'm reading."
- **A3.** **Stagger the dim cascade** — ripple outward from the hovered node over 0.3 s in 2-3 rings. Eye reads ripple motion as intentional. Adds an animation knob; perceived complexity is up to you.
- **A4.** **Accept the asymmetry as informative.** IDLE-hover *should* feel like "the whole scene reacts because you're navigating"; LOCKED *should* feel surgical. No code change.

### B. `iconByType` / `setIcon` — wire or remove?

Currently the panel surfaces it; the engine ignores it. Three honest options:

- **B1.** **Bake icon-library glyphs into the atlas** (~47 cells = 7×7 grid, ~280 KB texture vs ~70 KB today). Atlas builder gains a "merge external glyph set" call. Mid-effort. Feature works as promised.
- **B2.** **Remove the panel section entirely.** V1 doesn't support icon overrides. Clean. Avoids the half-wired surface.
- **B3.** **Defer + flag in panel.** Keep the UI but show a "coming in V2" tag on the section. Cheapest. Visual debt remains.

### C. `glyph_tint` and `fontByScope` — same shape as B

Both are panel-exposed, engine-silent. Either wire them (small) or hide them (smaller). My read: bundle the decision with B above. **Cleanest is "if we ship V1 without atlas extension, hide all three sections."**

### D. Glyph atlas 128px + mipmaps — ship with the foundation or defer?

Cost: ~280 KB texture (vs ~70 KB today). One-shot at boot.
Win: sharp glyphs at deep zoom + DPR=2/3 Retina.

- **D1.** Ship with foundation (most coherent with "lock it solid before crafting more").
- **D2.** Defer to a visual-polish pass.

### E. Subscription model for panel ↔ engine sync (SSOT-2)

The fix for the surviving drift-class. Mechanically straightforward but it changes the contract between modules.

- **E1.** **Event-based** — engine fires `forge:mount-ready`; panel always responds with `applyAllToEngine`. Lowest invasiveness.
- **E2.** **Subscription** — engine exposes `window._forge.subscribe(fn)`; panel registers once; engine calls on every mount. Same effect, more explicit ownership.

Pick one — they're equivalent in outcome; E1 is the smaller diff.

### F. Static-VBO dirty flag — extend `engine/contract.js`?

The renderer contract (mirrors the portable core's `types.ts`, eventual the portable core Rust port) currently doesn't have buffer-dirty semantics.

- **F1.** **Keep as private extension on the WebGPU renderer.** Doesn't bloat the contract. Future Rust port treats this as an implementation detail.
- **F2.** **Extend the contract.** Documents the optimization at the boundary. May force the eventual Rust renderer to expose the same primitive.

My recommendation: **F1** (private). The contract is for scene description, not internal renderer optimizations.

---

## 4. Execution sequence — atomic batches with explicit boundaries

Each batch is one Lane B slot claim, one commit, one verification cycle. No batch may be split; no two batches may overlap.

### Batch L1 — Drift-class extinction (correctness foundation)

**Blocked by:** John's decisions B, C, D, E.
**Touches:** `src/js/views/forge.js`, `src/js/engine/dev-panel-forge.js`.
**Items:** T2.1, T2.2, T2.3 (per B), T2.4 (per C), T2.5 (per C), T2.16, plus dead-state cleanup from T3.14.
**No visible UI change** (or minimal, depending on B+C — if "remove panel sections" wins, those sections vanish).
**Acceptance:**
- `resetOne` / `resetAll` reset to engine `PARAM_DEFAULTS` (verifiable via dev panel + dump).
- Mount sequence is race-free regardless of script order.
- Either `iconByType` works end-to-end OR the panel surface is gone.
- `localStorage.codex-atlas/forge-runtime-v1` round-trips mode + timeline.

### Batch L2 — Renderer + lifecycle invariants (correctness foundation)

**Blocked by:** L1 (because L1 touches forge.js shape and L2 needs that finalized).
**Touches:** `src/js/engine/renderer/webgpu.js`, `src/js/views/forge.js`, `src/js/engine/camera.js`.
**Items:** T2.6, T2.7, T2.8 (comment), T2.9 (comment + optional dev assert), T2.10, T2.11, T2.12, T2.13, T2.14, T2.15.
**No visible UI change.**
**Acceptance:**
- View-switch Forge↔other 50× shows flat GPU memory in browser perf tools.
- Mode-switch from a high-N mode to a low-N mode with hover in flight: no ghost-hover.
- Scrubber drag at 120 Hz pointer rate: smooth; no stutter under sustained move.
- `forge.js` opens with a 30-line header block that locks the 7 order-of-ops invariants + lifecycle phase contracts.
- Renderer `destroy()` is symmetric with `create()` via a single `owned[]` list.

### Batch L3 — Perf foundation for 10k (the big perf wins)

**Blocked by:** L2.
**Touches:** `src/js/views/forge.js`, `src/js/engine/renderer/webgpu.js`, `src/js/engine/graph/adjacency.js` (optional CSR), spatial-index code.
**Items:** T1.1, T1.2, T1.3, T1.4, T1.5.
**Acceptance bar (the 10k benchmark):**
- Synthetic mode at N=10k / E≈45k mounts in <100ms.
- Hover at 120Hz pointer rate stays within rAF budget (no missed frames in dev tools perf flame).
- IDLE animation steady-state shows <2 MB/s GPU upload bandwidth (per browser perf API).
- Mode-switch under N=10k completes in <50ms wall-time excluding the first rAF.
- Frame-time at IDLE: <2 ms (matches today's deities benchmark).
- Frame-time at 50k (sub-set adaptive constraints in play): degrades gracefully — labels capped, glyphs culled below 4px, no hard error.
**No visible UI change** (except things being faster).

### Batch L4 — Visual decisions land + side items

**Blocked by:** L3 + John's decisions A, D.
**Touches:** `src/js/views/forge.js`, `src/js/engine/renderer/webgpu.js` (atlas), `src/js/app.js` (side-nav), `src/styles/app.css`, `index.html`.
**Items:**
- IDLE-hover dim model per decision A.
- Atlas 128px + mipmaps per decision D (if D1).
- T3.2 (glow discard derived from uniform).
- **Side items John asked for:** mark Forge as the active focus (badge/banner in side nav), collapse the other side-nav tabs.
- T3.15 if it ships (edge gradient on alpha).
**This is the first visibly-different batch.** UX changes here.

### Batch L5 — Tail polish (deferred)

**Blocked by:** L4. Optional — can ship later.
**Items:** T3.3, T3.4, T3.5, T3.6, T3.7, T3.8, T3.9, T3.10, T3.11, T3.12, T3.13, T3.16, T3.17, T3.18.
**No new acceptance bar.** Each item ships independently if it crosses a perceptible threshold; otherwise lives as a backlog.

---

## 5. What this plan deliberately does NOT do

- **Does not ship Hulls.** The Hulls integration plan (`AUDIT/forge-hulls-integration-plan-2026-05-20.md`) stays queued. John can request it as a separate Lane B batch after L4 lands. Hulls add complexity to the focus-state visual hierarchy that is better tuned against a locked foundation.
- **Does not migrate other views to Forge.** That's the entire point of locking Forge first.
- **Does not touch Lane A.** No content changes. No new lens work. Investigation goblins can run in parallel throughout the entire L1–L5 sequence.
- **Does not re-investigate closed bug classes.** Edge-state-invariant + dev-panel/engine drift + pack-scale invariant are closed. The audits cite them as protected territory, not active surface.
- **Does not "ship to test."** Per AGENTS.md Craft doctrine §1, we are NOT shipping until 100% done. Each batch verifies against its acceptance bar before release.

---

## 6. Open questions for John — copy-paste-back ready

Listed in priority order. Each one blocks at least one batch.

1. **IDLE-hover dim model — A1 / A2 / A3 / A4?** (blocks L4)
2. **`iconByType` / `glyph_tint` / `fontByScope` — B1 / B2 / B3?** (blocks L1)
3. **Glyph atlas 128px + mipmaps — D1 / D2?** (blocks L4 if D1, else can defer)
4. **Subscription model shape — E1 (event) / E2 (subscribe)?** (blocks L1; minor)
5. **Confirm:** stop work after L4 lands, hand back to John for craft decisions, OR continue into L5 polish automatically? (default = stop after L4)
6. **Mark-Forge-as-focus side item — badge in nav? top header? specific text/icon?** (blocks L4; you said "should be marked?" — confirming what marking)
7. **Collapse-other-tabs side item — collapsible group? hide entirely behind a "more views" disclosure? rename "Forge" to be more prominent?** (blocks L4)

---

## 7. What ships at the end

After L1 + L2 + L3 + L4:

- **Forge runs deities-equivalent FX at 10k nodes / ~45k edges.** Hover, click-lock, zoom, mode-switch, scrubber, search, fly-to: all sub-frame at 10k.
- **Forge degrades gracefully at 50k** via adaptive caps (label budget, glyph cull, edge cull at zoom-fit). Does not break; does not error.
- **Three drift classes that survived 2026-05-18 are extinct.** Single source of truth for params; subscription-based sync; symmetric renderer destroy.
- **Every load-bearing invariant is documented inline.** A fresh agent reading `forge.js` for the first time sees the 7 order-of-ops constraints, the cross-pipeline VBO reuse, and the depth scheme as comments + assertions, not folklore.
- **The dim model is the one John picked.** No ambiguity, no perceived bug.
- **Side nav reflects the Forge-is-the-focus workflow.** Other tabs collapsed; Forge prominent + marked.
- **Foundation is locked.** Future Lane B work on Forge is feature-add, not foundation-revisit. Other views can be rebuilt on top with confidence.

**Estimated batch budget:** L1 ~2-3h, L2 ~3-4h, L3 ~4-5h (the big one), L4 ~2-3h. Total ~12-15h of focused Lane B work, gated on John's decisions in §3.

---

— synthesis closed 2026-05-20. Five goblins + lead. No code touched.
