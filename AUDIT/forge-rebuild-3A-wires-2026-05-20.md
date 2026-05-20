# Forge rebuild — Phase 3A · WIRES micro-audit

**Filed:** 2026-05-20
**Filed by:** Phase 3A read-only audit goblin (no code edits, no commits except this doc)
**Scope:** the edge primitive that connects nodes. Strictly:
- `src/js/engine/graph/edge.js` — packer + 7-bucket palette + bezier control-pull + offset-to-disk-perimeter.
- `src/js/engine/graph/adjacency.js` — `computeEdgeStates` only (per-edge `state` channel).
- `src/js/engine/renderer/webgpu.js` — `EDGE_SHADER` + `edgePipeline` + `edgeRibbonVbo` + `edgeInstanceVbo` + `edgeStateVbo` + `bucketPalette` + `setBucketPalette` + `forceWriteEdgeState`.
- `src/js/views/forge.js` — WIRE portions only: `PARAM_DEFAULTS` (`idle_*`/`active_*`/`curve_*`/`wire_min_screen_px`/`wire_max_screen_px`); `rebakeEdges`, `buildRadiiMap`, `rebakeBucketPalette`, `edgeOverridesFromParams`, `hotPaletteFromParams`; the `setBucketPalette` call sites; the `forceWriteEdgeState` call site in `resizeAndFit`.

**Reads-before (in order):**
1. `AUDIT/forge-rebuild-layered-spec-2026-05-20.md` §2 Phase 3 — locked WIRES dimension table.
2. `AUDIT/forge-robustness-lock-plan-2026-05-20.md` §3 — findings-map row for Phase 3 (T1.2 edge-portion, T3.9, T3.15, T2.5 confirmation, plus T3.14 polish edge: `forceWriteEdgeState`).
3. `AUDIT/forge-robustness-01-scale-2026-05-20.md` §2.5 + F3/F7 — edge-system scale cost + static-VBO dirty-flag gap (edge portion).
4. `AUDIT/forge-robustness-02-state-ownership-2026-05-20.md` §2 + F3/F7 — `bucketPalette` second-SSOT.
5. `AUDIT/forge-robustness-05-gpu-pipeline-2026-05-20.md` §2.2 + I2/P4 — EDGE pipeline review (gradient/alpha).
6. `forge.js` post-Phase-2B header block (commit `68a8e2c`) — NODE + BEHAVIORS sections locked; the FADE-PIPELINE INVARIANT — EXCEPTION SITE block at `forge.js:1115-1145` documents the sole wholesale-replace site.

**Out of scope** (flagged "deferred to Phase X" wherever encountered): node-atom internals (P1 — LOCKED); hover/click/state-model/fade pipeline (P2 — LOCKED); glyphs/atlas/labels/glow (P4); camera/mode-switch/scrubber bounds/search/persistence/side-nav (P5).

---

## §1. TL;DR

1. **The WIRES layer is mechanically correct today** — gradient + width clamp + endpoint offset + depth-z + state-channel convention are all already in place per the layered spec. Phase 3B is mostly *locking* (inline invariants + header section) plus three small surgical fixes (edge-VBO dirty flag; remove the `rebakeBucketPalette` dead-route; remove or defer `forceWriteEdgeState`).
2. **The two structural drift surfaces** are (a) `bucketPalette` being a JS-side mirror written once at boot via `setBucketPalette(hotPaletteFromParams())` with `rebakeBucketPalette` now a dead-code re-write path (`forge.js:2703-2706`), and (b) `forceWriteEdgeState` being a 2026-05-18 belt-and-braces hammer that's now redundant after the convention flip (`forge.js:1324-1326`, `webgpu.js:856-862`).
3. **No algorithmic redesign required.** Phase 3B contract is: lock invariants + extend the Phase 1B `nodeInstancesDirty` pattern to `edgeInstancesDirty` + delete dead-code drift surfaces + add `_forgeDebug` helpers for the acceptance gate.

---

## §2. Locked wire spec — Phase 3B contract

| Dimension | Spec | Where in code (file:line) | Documented inline? | Enforced vs convention |
|---|---|---|---|---|
| **7-bucket palette** | 7 buckets: Transmission/Parallel/Association/Kinship/Attestation/Polemic/Fusion. Slot 7 (`bidx=7`) unused, slate-init. Single source of truth: `local.params.active_color_{bucket}` + `local.params.active_opacity_{bucket}`. | Order: `edge.js:28-36` (`BUCKET_INDEX`); shader array `webgpu.js:233`; cache `webgpu.js:797-806`; writer `webgpu.js:828-838`; reader `forge.js:2580-2586` (`hotPaletteFromParams`). | Edge.js has a "MUST match" comment at `:25-27`. webgpu.js `setBucketPalette` has it at `:823-826`. **No invariant lock comment in `forge.js` yet.** | Convention (sync by hand). 🟡 finding F1 — addressable in 3B by removing the cache mirror or by making it explicit-init-only (no live mutation possible since panel removed). |
| **Edge state channel** | 0 = IDLE (slate / instance-color), 1 = HOT (bucket-hex). Float. Source: `local.edgeStates`, snap-to `local.edgeTargets`. In-place `.set()` everywhere except the documented wholesale-replace at `forge.js:1148-1149`. | `adjacency.js:95-103` (`computeEdgeStates`); `forge.js:510-511` (init), `:1148-1149` (wholesale-replace SITE), `:1864-1873` (recomputeFocus), `:1898-1922` (`tickEdgeFades`), `:2685-2700` (rebakeEdges fade-aware). Shader read `webgpu.js:296-322`. | Yes — `adjacency.js:87-94` convention-flip docstring; `webgpu.js:275-296` shader comments; `forge.js:1115-1145` FADE-PIPELINE INVARIANT block covers edges too. | Enforced by convention-flip (2026-05-18 — zero-init = IDLE). The `forceWriteEdgeState` hammer (see §3 F2) is now belt-and-braces and dead. |
| **Gradient** | `mix(1.0, 0.25, edge_t)` on color RGB only, NOT alpha. Universal — applies to IDLE + HOT alike. | `webgpu.js:328-343` (`grad_mult` and the final `vec4(color.rgb * grad_mult * a, a)` write). | Yes — `webgpu.js:328-338` explicit comment with the 0.55→0.25 tuning history. The "applies to IDLE and HOT — gradient is universal, not state-dependent" note is at `:336-337`. | Enforced (shader-baked). Lock-plan T3.15 / 05-P4 (gradient-on-alpha decision) — current behavior is intentional per `05-P4` ("keeps wire-end blunt against the disk it terminates into"). Recommend keeping as-is + locking with an explicit "DO NOT extend grad_mult to alpha — see 05-P4" comment. |
| **Width clamp (screen-px)** | `clamp(world_w × scale × DPR × viewport.x × 0.5, wire_min_screen_px, wire_max_screen_px)` in framebuffer-px, then back to world-units. Defaults: `wire_min_screen_px=1`, `wire_max_screen_px=2`. | World values from `edge.js:84` (`WIDTH_SCALE=2.2`), per-bucket `idleWidths` + `hotWidths` from `forge.js:221-250`. Clamp shader-side `webgpu.js:283-287`. Uniforms baked `forge.js:1388-1389` (CSS-px) → `webgpu.js:1059-1060` (× DPR). | Yes — `webgpu.js:278-282` documents the FB-px → world-units round-trip; `forge.js:281-283` documents "narrower band than pre-bake". | Enforced (shader-baked). 🟢 — works as specified. |
| **Endpoint offset (disk perimeter)** | Wires emerge from disk perimeter via `packEdges(..., { nodeRadii: Map<id,r> })`. Inset 0.92r so the AA halo covers the bezier start/end. Falls back to centers when partners coincide (`dist < 1e-4`). | Logic `edge.js:196-220`. Map builder `forge.js:2510-2521` (`buildRadiiMap`). Threaded `forge.js:1062` (rebuildForMode) + `:2684` (rebakeEdges). | Yes — `edge.js:146-153` documents the option; `:196-200` documents the perimeter offset; `:211-214` documents the 0.92 inset rationale. | Enforced (data flow). 🟢 — only risk is if a future call site forgets `nodeRadii` (degrades silently to center-bundle). Recommend a defensive console.warn if `radii` is falsy when packEdges is called from inside the forge view (allowed for headless tests, not for live forge frames). |
| **Depth z** | IDLE = 0.85, HOT = 0.75. Both BEHIND every node layer (0.6 max). `mix(0.85, 0.75, inst_state)`. | `webgpu.js:296`. NODE z values for cross-check: `webgpu.js:448-449` (glyph z=0.0/0.3/0.6 — same range as node disks). | Yes — `webgpu.js:292-296` documents the depth strategy; comment ties to layered-spec table. | Enforced (shader-baked). 🟢 — locked. |
| **GPU instance layout** | 12 floats × 48 bytes per instance. Slot 4 = `inst_state` (separate VBO, 4 bytes/inst). | Packer header `edge.js:8-19`; pipeline layout `webgpu.js:647-655`; per-instance write `edge.js:222-235`. | Yes — `edge.js:8-19` documents every slot; `webgpu.js:647-655` matches; lock-plan layered-spec §2 row pins 12×48 as frozen. | Enforced (layout). 🟢 — frozen; future changes need a documented migration per the spec. |
| **`edgeInstanceVbo` dirty flag** | Static geometry — uploaded ONLY on rebake/mode-switch, NOT every drawFrame. Mirror Phase 1B's `nodeInstancesDirty` pattern. | **GAP today.** `webgpu.js:1115-1119` re-uploads every frame unconditionally. Compare `webgpu.js:1103-1113` (node side, which IS gated since Phase 1B). | No — comment block at `:1102-1109` is node-only. | **Not enforced.** 🔴 finding F3 below — Phase 3B implementation. |
| **`forceWriteEdgeState` hammer** | Removed (dead-code per convention-flip). | Method `webgpu.js:850-862`; sole call site `forge.js:1318-1326`. | The method has a multi-line "hard-stop against pipeline-state corruption" docstring; the call site has a "final hard-stop" comment. None mention the convention flip made it obsolete. | Dead — see §3 F2. Robustness-lock-plan T3.14 + robustness-01 P6 already flag it for removal. |

---

## §3. Findings — severity-ranked, WIRES-scoped

### 🔴 F1. `bucketPalette` is a JS-side mirror of `local.params.active_color_*` — two sources, no live sync now that panel is gone

**Where:** `webgpu.js:797-806` (initial slate fill), `:828-838` (`setBucketPalette` writer), `:1099` (per-frame copy into `viewData`). Reader: `forge.js:2580-2586` (`hotPaletteFromParams`).

**The duplication:** `local.params.active_color_*` + `local.params.active_opacity_*` are John's tuned palette in `PARAM_DEFAULTS` (`forge.js:230-243`). The renderer holds a parallel `bucketPalette: Float32Array(32)` initialised to slate. They're connected by exactly one push at boot: `forge.js:862` (`renderer.setBucketPalette(hotPaletteFromParams())`).

**Why this was a hazard pre-Phase-0:** `rebakeBucketPalette` (`forge.js:2703-2706`) was wired to dev-panel slider changes; if the panel updated `local.params.active_color_*` without routing through `rebakeBucketPalette`, the engine kept the stale palette. That's documented as 02-F3 / 02-F7 / SSOT-3.

**Why this is now (post Phase 0) just a 🔴-by-protocol-not-by-runtime hazard:** dev panel is deleted. `PARAM_DEFAULTS` is `Object.freeze`'d (`forge.js:205`). `local.params` is seeded once at mount (`:559`) and never mutated. So the two SSOTs *cannot* drift in practice today. **But the cache + setter API is still drift-surface waiting for a future re-introduction.**

**Severity rationale:** 🔴 because every robustness audit (01/02/05) flagged this and the lock-plan named it T3.9. Phase 3B is the right window to close it before someone re-introduces a live mutation route.

**Recommendation (3B):** SSOT-3 from 02 — replace the cache with a `getBucketPalette` callback passed into `gpu.create(canvas, { getBucketPalette })` and called per-frame OR (safer-default, since `PARAM_DEFAULTS` can't change live) keep the cache but add an invariant comment: *"bucketPalette is the renderer-side cache; `local.params.active_color_*` is the ONLY source. Re-push via `setBucketPalette(hotPaletteFromParams())` after ANY mutation of `local.params.active_color_*` or `local.params.active_opacity_*` — there is no live mutation route today (panel deleted), so the boot push at `forge.js:862` is the only writer. Do not introduce a new mutation route without re-pushing here."*. Cross-link from `forge.js:2580` (`hotPaletteFromParams`) and `forge.js:2703-2706` (`rebakeBucketPalette` — confirm whether to delete; see §5 Q2).

---

### 🔴 F2. `forceWriteEdgeState` is dead-code belt-and-braces from the 2026-05-18 panic-fix

**Where:** Method `webgpu.js:850-862`. Sole call site `forge.js:1318-1326` (inside `resizeAndFit`'s defensive "REBUILD EVERY GPU-side per-instance buffer from scratch" branch).

**Why it exists:** added 2026-05-18 to defeat the recurring "wires light up after resize" bug class. At the time, the convention was state=0 → HOT (zero-init was unsafe). A swap-chain reconfigure or sync race could leave the GPU buffer holding stale-HOT values; the hammer forced a re-upload of the JS-side `edgeStates` to guarantee correctness.

**Why it's now dead:** the 2026-05-18 PM convention flip (`adjacency.js:87-94` docstring) made state=0 → IDLE the safe default. Zero-init is now correct by construction. `rebakeEdges` (`forge.js:2682-2701`) calls `drawFrame()` which writes `edgeStateVbo` from `local.edgeStates` (`webgpu.js:1157-1163`). The hammer's *only* effect today is one extra `device.queue.writeBuffer` of the same bytes the very-next drawFrame is about to write anyway.

**Severity rationale:** 🔴 because it's a load-bearing-looking comment ("final hard-stop") that's actually dead. Anyone reading `resizeAndFit` will believe it's load-bearing and propagate the pattern elsewhere. Two prior session-handoffs have already done variants of this.

**Recommendation (3B):** delete `forceWriteEdgeState` from `webgpu.js` AND the call site in `forge.js:1324-1326`. Add a one-line comment at the resizeAndFit site: *"// `recomputeFocus` writes `local.edgeStates`; the chained `drawFrame()` uploads it. No belt-and-braces needed — see AUDIT/forge-edge-state-invariant-2026-05-18.md convention flip + 3A audit §3 F2."* Robustness-lock-plan tracks this as T3.14; robustness-01 P6 confirms it's a perf cost at 50k (600KB extra write per resize). See §5 Q2 for the defer-vs-now decision.

---

### 🔴 F3. `edgeInstanceVbo` re-uploaded every drawFrame even when contents unchanged

**Where:** `webgpu.js:1115-1119`. Node side has been gated since Phase 1B (`:1103-1113` — `frame.nodeInstancesDirty || r.grew`); edge side has not.

**Cost** (per robustness-01 §2.4 + 2.5): 12 floats × 4 bytes × E. At 3033 edges: 145 KB/frame × 60fps = ~8.7 MB/s. At 45k edges (10k deities mode): 2.16 MB/frame × 60fps = ~130 MB/s. At 225k edges (50k mode): 10.8 MB/frame × 60fps = ~648 MB/s — past streaming bandwidth on integrated GPUs.

**Severity rationale:** 🔴 — this is lock-plan T1.2's edge-portion and the biggest per-frame perf win Phase 3B can ship. Mirrors the node fix exactly.

**Recommendation (3B):** add `local.edgeInstancesDirty = true` init at `forge.js:~512` (next to `edgeStates`/`edgeTargets`). Set true in every `packEdges` call site: `rebuildForMode` (after `:1062`), `rebakeEdges` (after `:2684`). Drawframe sends `edgeInstancesDirty` (`:1395-1396` neighborhood). Renderer gates the write at `webgpu.js:1115-1119` on `frame.edgeInstancesDirty || r.grew` — identical pattern to nodes. Reset to false at end of drawFrame mirror.

---

### 🟡 F4. `BUCKET_INDEX` lives in 3 places; only `edge.js` is canonical

**Where:** Canonical: `edge.js:28-36`. Mirror in shader docstring: `webgpu.js:823-826`. Implicit ordering in `forge.js:2500` (`BUCKET_ORDER`). Slot count 8 baked into shader array size at `webgpu.js:233`, palette array size at `:797`.

**Severity:** 🟡 — same pattern as 02-F7. Reordering a bucket today requires three coordinated edits. No automated check.

**Recommendation (3B):** import `BUCKET_INDEX` directly into `forge.js` instead of redeclaring `BUCKET_ORDER`. e.g., `const BUCKET_ORDER = Object.keys(window.AtlasEngineGraph.BUCKET_INDEX).sort((a,b) => BUCKET_INDEX[a] - BUCKET_INDEX[b]);`. Cheap; closes the drift surface. The shader-side mirror at `webgpu.js:823-826` is informational; lock with a `// MUST match edge.js BUCKET_INDEX — single source.` comment.

---

### 🟡 F5. `rebakeBucketPalette` is dead-code post-Phase-0

**Where:** Definition `forge.js:2703-2706`. Callers: grep returns zero (the prior dev-panel route was deleted in Phase 0).

**Severity:** 🟡 — orphan function; calls `drawFrame()` so it's safe but it can never run.

**Recommendation (3B):** delete it. Or, per Phase 0's "keep no-op stubs as breadcrumbs" pattern (`syncGlyphPositions` etc.), convert to `/* deleted in Phase 3B — no callers; PARAM_DEFAULTS is frozen, palette is single-pushed at boot via the line at forge.js:862. */` and remove the body. Recommend deletion outright — Phase 0 kept stubs because their callers were many and scattered; this one has zero callers. See §5 Q2.

---

### 🟡 F6. WIRES PARAM_DEFAULTS has 42 individual per-bucket entries; no per-bucket helper

**Where:** `forge.js:207-259`. 7 buckets × 6 params (idle_color/opacity/stroke + active_color/opacity/stroke + curve) = 42 keys, plus 2 zoom-clamp params.

**Severity:** 🟡 — readability/maintainability, not correctness. Adding an 8th bucket requires 6 new keys; renaming a bucket requires 6 renames.

**Recommendation (3B):** OPTIONAL — defer. The flat layout makes John's tuning history grep-able (`git show 4976623:src/js/views/forge.js | grep active_color_polemic`) and the freeze-at-mount + dev-panel-deleted state means the keys are touched at most twice (PARAM_DEFAULTS → `local.params` seed → renderer push). Leave flat unless John asks for restructure.

---

### 🟡 F7. `edge_t` gradient direction depends on packEdges endpoint order

**Where:** Shader `webgpu.js:267` (`let t = (quad_vertex.x + 1.0) * 0.5;`) defines `edge_t=0` at source endpoint, `=1` at target endpoint. Pack-time order: `edge.js:223-226` writes `srcX/Y` from `e.source` (vault edge.source), `tgtX/Y` from `e.target`.

**Severity:** 🟡 — the gradient direction is meaningful (source → target darken) but VAULT_DATA edge directionality is per-edge-type semantics, not always "natural reading direction." Some edge buckets (e.g., `transmission`) have semantic direction (transmitter → receiver); others (e.g., `kinship`, `parallel`, `association`) are symmetric and the source/target ordering is whichever the JSON happens to list first.

**Recommendation (3B):** document the convention inline at `edge.js:223-226`: *"// Gradient direction (in shader: edge_t 0→1) follows the vault edge's natural source→target order. Bucket-asymmetric buckets (transmission, polemic, fusion) carry semantic direction; symmetric buckets (parallel, kinship, association, attestation) carry no direction but the gradient is still applied. This is intentional per AUDIT/forge-rebuild-3A §3 F7 — universal gradient as a visual cue, not a semantic claim."* No code change.

---

### 🟢 F8. Slot 7 of the bucket array is unused; defaults to slate

**Where:** Array `webgpu.js:233` (`array<vec4<f32>, 8>`) — 8 slots even though we use 7. Slate-init covers slot 7 at `:801-806`. Shader clamps to `[0, 7]` at `:315`.

**Severity:** 🟢 — defensive; harmless. Useful headroom.

**Recommendation:** keep. Document at `webgpu.js:233` with a one-liner: *"// slot 7 reserved — slate-init, never indexed by BUCKET_INDEX (0..6)."*

---

### 🟢 F9. `edge.js` defaults to bucket `'association'` if `EDGE_BUCKET` mapping missing

**Where:** `edge.js:119-124` (`bucketFor`).

**Severity:** 🟢 — graceful degradation; expected. Already documented.

**Recommendation:** none.

---

### 🟢 F10. `forge.js` `params.idle_color_*` use the SAME slate hex (`#3a4a66`) for every bucket today

**Where:** `forge.js:207-213`. Compare `active_color_*` (`:230-236`) which are all distinct.

**Severity:** 🟢 — by John's design (slate atmosphere idle; bucket-hue only on focus). Headline-bucket idle (polemic/fusion) is overridden in `edge.js:184` to use the bucket hex, but PARAM_DEFAULTS still passes slate via `idleColors`, so the explicit-override path (`edge.js:182-183`) gates the polemic/fusion atmospheric hue OFF — i.e., today *all* idle wires are slate. This is intentional per the comment at `forge.js:206` ("slate atmospheric across all buckets").

**Recommendation:** none. If John ever wants polemic/fusion back to headline-bucket idle, change the 7 `idle_color_*` defaults; the path through `bucketColor()` in `edge.js:182-188` is already correct.

---

### Cross-layer flags (deferred per scope)

- **Deferred to Phase 4 / FX:** glyph fade pipeline shares `nodeStateVbo` (`webgpu.js:1217`). Edges have their own `edgeStateVbo`. Not a WIRES issue.
- **Deferred to Phase 5 / management:** the `resizeAndFit` defensive block (`forge.js:1294-1328`) does `rebakeNodes() + rebakeEdges() + recomputeFocus()` on every size change. The block predates the convention flip + Phase 1B's pack-scale-invariant + Phase 2B's hover cancellation. Likely over-broad now — but the simplification belongs to Phase 5 (camera/resize orchestration), not Phase 3. Only the `forceWriteEdgeState` line inside it is Phase-3-scoped (F2 above).
- **Deferred to Phase 6 / polish:** edge length-in-px cull at extreme zoom-out (robustness-01 mitigation table line 192). Optional; not a Phase 3B blocker.
- **Deferred to Phase 6 / polish:** adaptive bezier segment count (robustness-01 P4 line 273). 32 segments × 225k edges at 50k = 7M vert-shader invocations.

---

## §4. Phase 3B implementation checklist

### REQUIRED (Phase 3B must ship)

- **R1.** `edgeInstancesDirty` flag pattern (F3) — mirror `nodeInstancesDirty` from Phase 1B. Files: `forge.js` (init + every packEdges site + drawFrame send + reset), `webgpu.js:1115-1119` (gate the write).
- **R2.** Delete `forceWriteEdgeState` method + its sole call site (F2). Files: `webgpu.js:850-862` (delete), `forge.js:1318-1326` (delete the call + replace with a 1-line "fade-pipeline guarantees correctness" comment). Lock-plan T3.14.
- **R3.** Delete or stub `rebakeBucketPalette` (F5). Recommend deletion outright since callers are zero (was a dev-panel route; panel gone).
- **R4.** Add a WIRES section to the `forge.js` header invariant block (currently has NODE at `:69-110` + BEHAVIORS at `:111-180`). Cover: the 7-bucket palette SSOT (with note "panel deleted → single source is `PARAM_DEFAULTS` + `local.params`, push at `:862`"); edge state convention (0=IDLE, 1=HOT, zero-init safe); gradient direction; depth-z; GPU layout 12×48 frozen; endpoint-offset to 0.92r perimeter; rAF ownership not extended (edges share `animRafId` with nodes via `tickEdgeFades`).
- **R5.** Add `_forgeDebug.edgesAndNodesOnly()` (mirror `nodeOnly()` from Phase 1B) — sets a `local._edgesAndNodesOnly` flag; `drawFrame` zeros `frameGVB` (glyphs) when set. Useful for the acceptance gate.
- **R6.** Add `_forgeDebug.countEdgeVboWrites()` — mirror `countNodeVboWrites()`. Renderer side: a `let edgeInstanceWrites = 0` counter incremented when the gated `writeBuffer` actually fires. Verifies R1 in the acceptance gate.

### RECOMMENDED (Phase 3B should ship)

- **D1.** `BUCKET_INDEX` import dedup (F4) — `forge.js` reads `window.AtlasEngineGraph.BUCKET_INDEX` and derives `BUCKET_ORDER` from it instead of redeclaring at `forge.js:2500`.
- **D2.** Inline gradient comment lock — `webgpu.js:343` explicitly call out "DO NOT extend grad_mult to alpha — see AUDIT/forge-robustness-05-gpu-pipeline §P4".
- **D3.** Inline endpoint-offset comment lock — `edge.js:196-220` is well-documented today; add a one-line confirmation: *"// Phase 3B locked: nodeRadii is REQUIRED for forge-view callers; only headless tests may omit it. Center-fallback is for the same-pixel edge case, not for missing radii."*
- **D4.** Inline `edge_t` gradient-direction docstring (F7) — explain that the gradient runs source→target and is intentional even for symmetric buckets.

### OPTIONAL (Phase 3B may ship; defer otherwise)

- **O1.** Replace `bucketPalette` cache with a `getBucketPalette` callback into `gpu.create` (02-SSOT-3). Closes F1 structurally rather than by convention. **Safe-default recommendation: defer** — see §5 Q1 — since `PARAM_DEFAULTS` is frozen + dev panel removed, the cache cannot drift today. Add the lock-comment instead (F1 recommendation).
- **O2.** Edge length-in-px cull (robustness-01 mitigation table) — defer to Phase 6 polish.
- **O3.** Adaptive bezier segment count — defer to Phase 6 polish.
- **O4.** Collapse `wire_min_screen_px` + `wire_max_screen_px` to a single `wire_screen_px: [1, 2]` range param. **Recommend defer** (§5 Q3) — current naming is parallel to `node_min_screen_px` / `node_max_screen_px` and changing only WIRES breaks the symmetry. If we collapse, do nodes too in Phase 6.

---

## §5. Open questions for John

### Q1. `bucketPalette` SSOT — callback or cached-with-invariant-comment?

**Options:**
- **(A)** Convert to a `getBucketPalette` callback called per-frame inside `drawFrame` (02-SSOT-3, lock-plan T3.9). Structurally eliminates the second SSOT. Cost: one Function call per frame.
- **(B)** Keep the cached `bucketPalette` array + the existing `setBucketPalette` writer; add an invariant comment that nothing live can change `local.params.active_color_*` (panel deleted, `PARAM_DEFAULTS` frozen). Closes the drift surface by convention, not structurally.

**Safe-default recommendation: (B).** PARAM_DEFAULTS is `Object.freeze`'d (`forge.js:205`) and `local.params` is seeded once at `:559`. There is no live-mutation route. The cache cannot drift today. A callback adds runtime cost for a problem that no longer exists. If a future V2 panel is ever built (per project_paused_2026-05-16.md / the portable core-HANDOFF), it must subscribe via the SSOT-2 pattern + push to renderer on change — but that's a future-phase concern, not a Phase 3B blocker.

### Q2. `forceWriteEdgeState` — delete in Phase 3B or defer to Phase 6 polish?

**Options:**
- **(A)** Delete now (Phase 3B). It's a load-bearing-looking comment that's actually dead. Phase 3B is the right window because we're locking the WIRES contract — leaving a confusing "hard-stop" hammer in place contradicts the lock.
- **(B)** Defer to Phase 6 polish per lock-plan T3.14 categorization.

**Safe-default recommendation: (A) — delete now.** Same logic as `rebakeBucketPalette` (F5). The convention-flip docstring at `adjacency.js:87-94` says zero-init is now safe; a stale hammer contradicts that. Removing it tightens the WIRES contract Phase 3B is meant to lock.

### Q3. Wire-width zoom-clamp — `wire_min_screen_px` + `wire_max_screen_px` as separate params, or collapse to a single `wire_screen_px` range param?

**Options:**
- **(A)** Keep separate (current). Parallel to `node_min_screen_px` + `node_max_screen_px`.
- **(B)** Collapse to `wire_screen_px: [1, 2]`. Cleaner; one logical concept.

**Safe-default recommendation: (A) — keep separate.** Changing only WIRES breaks symmetry with NODES, and there's no live UI bound to these names (panel deleted). If a future cleanup pass collapses NODE clamps too, do both atomically. Phase 3B is not the right window for cross-layer param renaming.

### Q4 (bonus — flag-only). Should the `resizeAndFit` defensive block (`forge.js:1294-1328`) be simplified now that the convention flip + Phase 1B + Phase 2B have closed every bug it was defending against?

**Recommendation: defer to Phase 5 / management.** The simplification belongs to camera/resize orchestration, not WIRES. Phase 3B only touches the one `forceWriteEdgeState` line inside it (Q2). The rest of the block can be revisited when Phase 5 locks the resize contract.

---

## §6. Acceptance test ideas — Phase 3B verification

### Acceptance gate (sequence — must all pass)

1. **A1. Wires render in current mode (deities, 3033 edges).** Mount Forge; confirm wires visible idle + slate-colored. `_forgeDebug.edgesAndNodesOnly()` (R5) hides glyphs cleanly; switch back via `_forgeDebug.edgesAndNodesOnly()` again.
2. **A2. HOT vs IDLE distinguishable.** Hover Zeus (or any high-degree node); wires incident-to-Zeus AND to its 1-hop neighbors paint in their bucket-hex hot color (violet/teal/green/sage/etc per bucket); non-incident wires stay slate at low alpha. Click-to-lock Zeus; verify the bucket coloring persists when cursor moves away. Lock-plan A2 (acceptance for Phase 3).
3. **A3. Gradient visible source→target.** Pick a long transmission edge (e.g., Greek deity → Roman counterpart). Confirm visible darken from source-end (full color) to target-end (~25% color). Should be visible at both IDLE and HOT states.
4. **A4. Width clamp at zoom-out.** Zoom to fit (`_forgeDebug.cameraState()`); confirm wires don't drop below 1 screen-px (no disappearance). Zoom in 4x; confirm wires don't exceed 2 screen-px (no bloat). At default DPR this means widths stay visually consistent.
5. **A5. Edge instance VBO uploads only on rebake.** Mirrors Phase 1B's N2 acceptance: `_forgeDebug.countEdgeVboWrites()` after mount = 1. After 30 seconds of idle hover (no mode-switch, no resize) = still 1. After mode-switch to documents = 2. After resize → fit chain triggering rebakeEdges = 3. **NOT incrementing per drawFrame.**
6. **A6. Hover settles smoothly at 10k stub (or current deities mode as proxy).** Hover-in, hover-out, settle. Use `_forgeDebug.dumpBugState()` to confirm `js.edgeStates.zeros + ones === modeEdges.length` and `gpu.edges.zeros + ones === modeEdges.length` (no `other` — all values fully advanced, no in-flight floats).
7. **A7. Locked anchor's wires get bucket-colored.** Click any deity to lock; pan + zoom; wires incident to the locked node retain bucket color through camera changes. Verify via `_forgeDebug.dumpBugState().js.edgeTargets.ones > 0`.
8. **A8. Endpoint offset visible at small disks.** Find a tier-4 node (smallest disk); zoom in; confirm wires emerge from disk perimeter, not center. Compare with a tier-1 hub: wires fan out around the circumference, not bundled at center.

### Regression checks (must NOT have regressed from Phase 2B)

- **R-A.** `_forgeDebug.countNodeVboWrites()` still ≈ 1-3 after the same idle hover sequence (Phase 1B N2 still passes).
- **R-B.** `_forgeDebug.rafIds()` returns `{anim: null, hover: 0, idle: 0, scrub: 0}` after settle (Phase 2B B1 still passes).
- **R-C.** Fade smooth on hover-change (Phase 2B B5 fade-pipeline invariant still holds — edges in `tickEdgeFades` keep animating; no snap).
- **R-D.** `_forgeDebug.compareDimModels()` returns coherent counts across A1/A2/A3/A4 (Phase 2B B6 dispatcher unaffected).

### Bug-replay checks (must NOT reproduce known historical bugs)

- **B-A.** "Wires turn orange after resize" — resize the window 5x; `_forgeDebug.dumpBugState().js.edgeStates.ones === 0` when no hover/lock; `gpu.edges.ones === 0` too. (This is the convention-flip + `forceWriteEdgeState` story; deleting the hammer in R2 should not reproduce the bug because zero-init is now correct.)
- **B-B.** "Wires bundle at hub center after zoom" — zoom in 4x on Zeus; wires should still fan around the disk perimeter (Phase 3A endpoint-offset locked in `edge.js:196-220`; rebakeEdges + radii rebuild path verified).

---

— Phase 3A WIRES micro-audit · 2026-05-20
