# Forge rebuild — Phase 1A · NODE atom micro-audit

**Filed:** 2026-05-20
**Filed by:** Phase 1A read-only audit goblin (no code edits, no commits beyond this doc, no slot claim)
**Scope:** the NODE atom only — `engine/graph/node.js`, `engine/graph/mode.js` (NODE-filter only), `engine/renderer/webgpu.js` NODE_SHADER + nodePipeline + nodeStateVbo binding, `views/forge.js` PARAM_DEFAULTS NODE entries + rebuildForMode's pack call + rebakeNodes + camera.onChange 5%-drift gate + hitTestAt + hit-grid attach + computeNodeStates/computeSelectedStates/interleavePairs.
**Out of scope (deferred to later phases):** edges (P3), glyphs/atlas/labels (P4), camera/mode-switch orchestration (P5), hover/click/fade behavior (P2). Out-of-scope items flagged inline as "P2/P3/P4/P5" and NOT deep-dived.
**Reads-with:** `forge-rebuild-layered-spec-2026-05-20.md` (§2 Phase 1 contract), `forge-robustness-lock-plan-2026-05-20.md` (§3 findings map), `forge-robustness-01/02/03/05-*-2026-05-20.md`.
**Snapshot commit:** post-Phase-0 (dev panel deleted), at or after `ba78863`.

---

## §1. TL;DR

The NODE atom is **structurally sound and shipping correctly**, but **underspecified in code**: the tier-radii / screen-px-clamp / family-color / GPU-layout / state-channel rules live as folklore split across three files. Two latent traps surfaced — `packedAtScale` is never set on `rebuildForMode`'s pack path (saved today by a falsy `||` fallback in `camera.onChange`), and the destroy() asymmetry on glyph-side resources is structural debt that bites the moment Forge ever keeps the device across view-switches. Phase 1B's job is to bake the spec into inline invariants + add a hit-test grid + a static-VBO dirty flag — not to redesign the atom.

---

## §2. Locked spec — what the NODE atom IS today

| Dimension | What the spec IS today | Documented in code? |
|---|---|---|
| **Tier classification** | `buildTierClassifier(nodes, degreeMap)` at `engine/graph/node.js:60-74`. Inputs: `nodes` array + `Map<id, degree>`. Outputs: a function `tierFor(deg) → 0..3`. Quantile cuts at p4 / p15 / p40 of the descending-sorted degree list. Re-derived at every `packNodes` call (line 99) AND independently in `rebuildForMode` (`views/forge.js:790`) and in `rebakeNodes` (`views/forge.js:2085`). Three call sites; same input data; three independent builds per mode rebuild. | Function header comment, no invariant note about "always derive from packNodes' classifier". |
| **Tier radii (world units)** | 4 numbers in `PARAM_DEFAULTS` at `views/forge.js:161-164`: `[8, 7, 6, 5]`. Threaded through `tierRadiiFromParams()` → `nodeOverridesFromParams().tierRadii` → `packNodes(opts)`. Note: `engine/graph/node.js:27` carries a FALLBACK `TIER_RADIUS = [18, 14, 11, 8]` — used only when `opts.tierRadii` is missing. The two arrays are intentionally divergent (forge defaults are ~½ the fallback). | Comment in `node.js:21-27` explains the fallback values; no warning that forge overrides them. The fallback is dead in the active code path. |
| **Screen-px clamp** | `node_min_screen_px=3`, `node_max_screen_px=22` in `PARAM_DEFAULTS` (`views/forge.js:165-166`). Evaluated inside `packNodes` at `engine/graph/node.js:126-131`. Uses `opts.camScale` (= `camera.state.scale` at pack time). Active when `camScale && (minPx !== null || maxPx !== null)`. Formula: `screenR = r * camScale; clamp(minPx, maxPx); r_world = screenR / camScale`. Same for all tiers (no per-tier clamp). | Inline comment in `node.js:121-125` explains the rationale. The cross-reference to `camera.onChange`'s 5%-drift re-pack is implicit. |
| **Family color** | `parseColor(s, fallback)` at `engine/graph/node.js:33-55`. Inputs: `node.family_color \|\| node.tradition_color` hex/rgb string. Cached in module-scope `_colorCache` Map (`node.js:32`) — never evicted. Returns `[r,g,b,a]` in 0..1. Called ONCE per node per `packNodes` call. Note: glyph pipeline calls `mth.lightenColor` on the same hex separately (`views/forge.js:1115`) — **2 distinct color paths**, but this is glyph-side (P4 — out of scope). | Function comment at `node.js:29-31` flags the cache. No mention of "the only family-color authority for nodes." |
| **State channel** | Semantics: `0 = focused (no dim)`, `1 = dim`. Storage: `local.nodeStates` (live, animating) + `local.nodeTargets` (snap-to). Float32, length `nodePack.instanceCount * 2` (interleaved with selected). Pattern: in-place `.set()` updates in `recomputeFocus` (`forge.js:1420`) + `rebakeNodes` (`forge.js:2127`). Wholesale-replace ONLY at `rebuildForMode` (`forge.js:826-827`) — **legitimate exception** (cross-mode instance count differs). | The `rebuildForMode` exception is documented in a comment at `forge.js:822-825`. The "no wholesale-replace outside rebuildForMode" rule is enforced by convention only — `recomputeFocus`'s length-mismatch branch at `forge.js:1422-1423` is a documented anti-pattern that fires defensively if anyone introduces a length-changing path. |
| **Selected channel** | Storage: same `local.nodeStates` buffer, interleaved as `(state, selected)` pairs every 8 bytes. Pattern: `interleavePairs(states, selectFlags)` at `forge.js:1522-1530`. Size multiplier: `selected_size_mult = 1.20` (`PARAM_DEFAULTS` line 155) applied in shader at `webgpu.js:138`. Glow ring: `selected_glow_strength=0.50`, `selected_glow_extent=1.6`, color `#FFE9B0`. Shader paints glow under disk via premultiplied composite at `webgpu.js:195`. | Shader has the most extensive in-file documentation of any node-spec dimension (the square-clip story at `webgpu.js:139-213`). |
| **Depth z** | Three values, in vertex shader at `webgpu.js:159-160`: `z_focus = mix(0.6, 0.3, 1.0 - inst_state)` → `state=0 → z=0.3`, `state=1 → z=0.6`. Then `z = mix(z_focus, 0.0, inst_selected)` → selected pins at `z=0.0`. Sister glyph z = SAME value (depth tiebreak by draw-order). | Inline shader comment at `webgpu.js:155-158` documents the three z values. The "glyph z = disk z" invariant lives at `webgpu.js:448-449` (glyph shader) and is cross-referenced only via prose, not code. |
| **GPU layout** | 8 floats × 32 bytes per instance, defined by `engine/graph/node.js:111` + consumed by node pipeline at `webgpu.js:578-587`. Field order: `[0]=x, [1]=y, [2]=r, [3]=pad, [4]=R, [5]=G, [6]=B, [7]=A`. Separate state VBO: 2 floats × 8 bytes = `(state, selected)`. Pipeline buffer layout matches packer layout. | Comment block at `node.js:8-13` documents the layout. The exact match to `webgpu.js:578-587` is implicit. No "frozen layout — migration required" warning. |
| **Lifecycle invariant** | `rebakeNodes` updates targets in place (lines 2124-2128). `rebuildForMode` wholesale-replaces (lines 826-827) — legitimate exception. `local.packedAtScale` written ONLY in `rebakeNodes` at line 2135. **Gap (Finding 🔴 N4):** `rebuildForMode` packs (line 782) but does NOT set `local.packedAtScale`. Saved today by `lastScale = local.packedAtScale \|\| camScale` at line 658 (undefined → falsy → uses camScale → ratio=1 → no re-pack). | rebakeNodes has a long fade-aware comment at `forge.js:2104-2118`. The rebuildForMode gap is unmarked. |

---

## §3. Findings — NODE-only, severity-ranked

### 🔴 CRITICAL — must land in Phase 1B

**🔴 N1. Hit-test is O(N) on every `pointermove`, no spatial index** *(maps to T1.1 from lock plan)*
- **Where:** `views/forge.js:1289-1311` (`hitTestAt`); called synchronously from pointermove at `forge.js:1937-1962` AND wheel handler at `forge.js:2045-2046`. Hit-grid attach points: `forge.js:792-806` (build in rebuildForMode) and `forge.js:2089-2103` (rebuild in rebakeNodes).
- **Why it bites:** at 10k nodes, 120Hz pointermove = ~1.2M distance checks/sec on the move handler itself. The rAF coalesce on `setHoverId` gates `recomputeFocus`, NOT `hitTestAt` — hit-test runs synchronously every event.
- **Proposed approach:** uniform grid keyed off `local.mode.worldExtent`, cell size = `2 × max(tierRadii)`. Build inside the existing `hitNodesNew[]` loops at `rebuildForMode` (line 794) and `rebakeNodes` (line 2091). Query 1-4 cells in `hitTestAt`. No new state allocations on hot path.

**🔴 N2. Static node-instance VBO uploaded every frame** *(maps to T1.2, node-portion)*
- **Where:** `webgpu.js:1066-1070`. `device.queue.writeBuffer(nodeInstanceVbo, 0, nVB)` runs every `drawFrame`, unconditional.
- **Why it bites:** at 10k nodes, 320 KB GPU write × 60fps = ~19 MB/s wasted. `nodeInstanceVbo` only changes on `rebakeNodes` / `rebuildForMode`.
- **Proposed approach:** dirty flag on the renderer side. View signals `frame.nodeInstancesDirty=true` on every `rebakeNodes`/`rebuildForMode` pack; renderer skips `writeBuffer` when dirty=false. The state VBO (`nodeStateVbo`) STAYS unconditional — it's actually animating per frame via `tickNodeFades`. (Edge & glyph VBO dirty flags belong to P3/P4 respectively — keep node-only here.)

**🔴 N3. Asymmetric `destroy()` — no `owned[]` list pattern** *(maps to T2.6, node-side)*
- **Where:** `webgpu.js:1155-1167`. Lists `quadVbo`, `edgeRibbonVbo`, `diskUbo`, `viewUbo`, `nodeInstanceVbo`, `edgeInstanceVbo`, `nodeStateVbo`, `edgeStateVbo`, `depthTex` — but the **node side is missing nothing today; the leak is glyph-side** (`glyphInstanceVbo`, `atlasTex`, `glyphUvUbo`). However, Phase 1 is the moment to land the `owned[]` pattern for node resources so Phase 3/4 can extend it.
- **Why it bites:** the moment Forge keeps the device across view-switches (a likely future optimization), every missing destroy is a per-mount leak.
- **Proposed approach:** at top of `create()`, declare `const owned = []; const own = (o) => { owned.push(o); return o; };`. Wrap each `device.createX(...)` for the node pipeline's resources. Phase 1B lands the pattern + node resources; Phase 3/4 extend to edge/glyph.

**🔴 N4. `packedAtScale` is NEVER set on `rebuildForMode`'s pack path** *(maps to T2.11)*
- **Where:** `views/forge.js:782` (`packNodes` call inside `rebuildForMode`). `local.packedAtScale` is only written at `rebakeNodes:2135`. `camera.onChange`'s 5%-drift gate at line 658 reads `local.packedAtScale || camScale` — the `||` fallback masks the missing write (undefined → falsy → ratio=1 → no re-pack).
- **Why it bites today:** wasted no-op re-pack of OLD-mode data if a 5%-drift listener fires post-fit (`camera.fitToExtent` during `rebuildForMode` emits onChange).
- **Why it bites tomorrow:** any future "clean up the listener" pass that drops the `||` fallback OR optimizes to "skip pack when packedAtScale === currentScale" silently brings back the pack-scale invariant bug from `feedback_pack_scale_invariant.md`.
- **Proposed approach:** explicit `local.packedAtScale = camera.state.scale;` immediately after the `packNodes` call in `rebuildForMode` (line 782). One line.

### 🟡 IMPORTANT — recommend landing in Phase 1B if time allows

**🟡 N5. `nodeStateVbo` cross-pipeline reuse is undocumented load-bearing** *(maps to T2.8 / 05-C1)*
- **Where:** `webgpu.js:1082-1086` (node pass writes), `webgpu.js:1147` (glyph pass reads same buffer). Same-frame queue-order makes this correct today.
- **In-scope-for-Phase-1B because:** the WRITE-side belongs to the node pipeline. The READ-side belongs to glyphs (P4). Phase 1B should add the inline comment AT THE WRITE SITE noting "this buffer is read by the glyph pass later in the same encoder — DO NOT reorder writes or splits passes without revisiting the glyph contract." Phase 4 adds the matching comment on the read side.
- **Approach:** comment block + a `// CROSS-PIPELINE INVARIANT:` marker that grep-finds easily.

**🟡 N6. Tier classifier built three times per mode rebuild** *(latent perf; latent drift)*
- **Where:** `node.js:99` (inside `packNodes`), `forge.js:790` (in `rebuildForMode` to populate `hitNodes.tier`), `forge.js:2085` (in `rebakeNodes`).
- **Why it matters:** O(N log N) sort × 3 per mode rebuild. At 10k that's ~30ms of redundant work. More importantly: if any future change to the classifier (e.g. cutoffs from PARAM_DEFAULTS) is made in one site and not the others, the hit-test tier diverges from the pack tier. **Drift class.**
- **Approach:** `packNodes` could optionally return its internal `tierFor` function (or `tiers[]` array) so callers don't rebuild. Cheap; backward compatible.

**🟡 N7. `_colorCache` is module-scope and never evicted** *(05-P3 noted, restated in NODE scope)*
- **Where:** `node.js:32`.
- **In practice:** bounded by ~100 distinct family/tradition colors across the vault — not a leak risk at any plausible scale. But it survives view-remount (module-scope), which is good for performance but worth documenting so the next refactor doesn't "fix" it by moving into `local`.
- **Approach:** one-line comment "module-scope by design — bounded ~100 entries, survives remount for cross-mount perf."

### 🟢 POLISH — defer to Phase 6 or out of scope

**🟢 N8.** `engine/graph/node.js:27` carries the legacy `TIER_RADIUS = [18, 14, 11, 8]` fallback — dead in active code path (forge always overrides). Keep or delete? Keep is safer (defensive). Polish: document "fallback only — forge overrides via PARAM_DEFAULTS."

**🟢 N9.** Hex-color parsing at `node.js:38-50` only handles `#` + `rgb()/rgba()`. Doesn't handle `hsl()`, named colors, or modern `color()`. Fine for vault data (which is hex-only by convention), but worth a `// NOTE: hex + rgb() only — vault convention` line.

**🟢 N10.** `parseColor` uses `Array<number>` not a typed array; tiny GC churn on cache miss. Not measurable. Skip.

### Out-of-scope-but-noted (NOT Phase 1B)

- **GLYPH-side `mth.lightenColor` call** at `forge.js:1115` — out of scope (P4 — FX layer).
- **`refreshGlyphAlphas` per-frame loop** at `forge.js:1135-1149` — out of scope (P4).
- **`recomputeFocus` length-mismatch wholesale-replace** at `forge.js:1417-1424` — out of scope (P2 — behavior/fade pipeline).
- **`tickNodeFades`** at `forge.js:1493-1513` — out of scope (P2).
- **`setHoverId` rAF coalesce** at `forge.js:1556-1585` — out of scope (P2).
- **Mode-switch orchestration** at `forge.js:741-920` — out of scope (P5); only the `packNodes` call (line 782) is in scope here.
- **camera.fitToExtent → onChange race (T2.11)** — the WRITE-side fix (set `packedAtScale` after pack) is N4 above (in-scope). The READ-side / silent-fit camera flag belongs to P5.

---

## §4. Phase 1B implementation checklist

In rough atomic-commit order:

- **[required] N1 — hit-test spatial index.** Build a uniform grid keyed off `local.mode.worldExtent`, cell size = `2 × max(tierRadii)`. Attach points: extend the `hitNodesNew[]` loops at `forge.js:792-806` and `forge.js:2089-2103` to also populate a `local.mode.hitGrid` object (`{ cellSize, cols, rows, x0, y0, buckets: Array<Array<HitNode>> }`). Replace `hitTestAt`'s inner loop at `forge.js:1300-1310` with a bucket lookup. Re-test: confirm hit accuracy on overlapping tier-0 / tier-3 disks (rare but possible per existing comment at line 1297).
- **[required] N2 — static-VBO dirty flag (node only).** Add `frame.nodeInstancesDirty` (default false; set true by view on rebake / rebuildForMode). In `webgpu.js:1066-1070`, skip the `writeBuffer` when not dirty. Leave the state-VBO write unconditional. Edges + glyphs come in their own phases.
- **[required] N3 — `owned[]` list pattern for node-pipeline resources.** At top of `webgpu.js create()`, declare `const owned = []; const own = (o) => { owned.push(o); return o; };`. Wrap node-pipeline-side creations: `nodeShaderModule`, `nodePipeline`, `viewBgl`, `viewBg`, `viewUbo`, `quadVbo`, `depthTex` (lazy-created — handle in `ensureDepthTex`). Then `destroy()` iterates `owned` first, then `device.destroy()`. Phase 3/4 will extend to edge/glyph; the pattern lands here.
- **[required] N4 — set `packedAtScale` after every node pack.** One line after `forge.js:782`: `local.packedAtScale = camera.state.scale;`. Mirror in any other future pack call sites.
- **[required] N5 — inline cross-pipeline invariant comment.** At `webgpu.js:1082` (write site), 4-6 line comment block explaining: "nodeStateVbo is read by the glyph pass later in the same encoder via setVertexBuffer(2,...) — DO NOT split into separate render passes / reorder writes / shrink without revisiting glyph contract." Use a `// CROSS-PIPELINE INVARIANT:` marker grep-findable.
- **[required] Inline NODE-spec lock comment block at top of `views/forge.js`.** Add a header comment immediately above `PARAM_DEFAULTS` documenting (a) NODE spec is locked at commit-hash-X — see `AUDIT/forge-rebuild-1A-node-atom-2026-05-20.md`; (b) the rebuildForMode ORDER for the parts in scope: `fitToExtent → packNodes → packedAtScale write → buildHitGrid → state buffer allocation`; (c) the cross-pipeline note: "node pipeline's nodeStateVbo is read by the glyph pass — see webgpu.js:1082."
- **[recommended] N6 — tier classifier deduplication.** `packNodes` should optionally return `tierFor` so callers can reuse instead of rebuilding. Backward-compatible (no breaking change to current API).
- **[recommended] N7 — `_colorCache` documentation comment.** One line at `node.js:32`.
- **[optional / polish] N8 — `TIER_RADIUS` fallback comment.** One line at `node.js:27`.

**What Phase 1B does NOT do:**
- Does not collapse / promote tier count (still 4 — pending §5 question).
- Does not touch the family-color path (leave glyph-side lightenColor for P4).
- Does not touch fade pipeline patterns (P2).
- Does not extend `owned[]` to edge/glyph resources (P3/P4 each own that step).

---

## §5. Open questions for John / lead synthesizer

Each blocks at least one Phase 1B decision.

1. **Tier count — keep 4, collapse to 3, or promote to 5?** Today: top-4% / next-11% / next-25% / rest. Phase 1B can lock whichever; default = keep 4. (Affects only the magic numbers in `buildTierClassifier`'s quantile cuts at `node.js:64-66` — trivial mechanically.) **Recommendation: keep 4** unless John has a visual reason to change.

2. **Tier-radii values — `[8, 7, 6, 5]` (current forge default) confirmed authoritative?** The legacy `[18, 14, 11, 8]` in `node.js:27` is dead. Phase 1B should delete it OR keep as a "no-clamp pre-tuned" fallback for non-forge callers (Pantheon V2 et al). **Recommendation: keep the legacy fallback** since `node.js` is a shared engine module.

3. **Hit-grid cell size — `2 × max(tierRadii)`, or something else?** A node with center near a cell boundary needs 4 cells queried. Larger cells → more candidates per query but fewer total cells. Smaller → fewer candidates but more cell-iteration overhead. At wheel layout with rOuter ~300-500 world units and max radius 8, cell size 16 → ~30×30 grid = ~900 cells, ~10 nodes/cell average at 10k. Feels right. **Recommendation: `2 × max(tierRadii)` unless benchmark shows otherwise.**

4. **`_colorCache` eviction — bounded by family count (today ~100), but a vault-content explosion could grow it unbounded.** Worth an LRU cap? **Recommendation: no cap. Add a comment explaining the bound. Revisit only if heap profiling shows a problem.**

5. **Renderer `owned[]` pattern — extend `engine/contract.js` or keep as private extension on WebGPU renderer?** The contract is for scene description, not internal renderer cleanup. **Recommendation: private extension (F1 from lock-plan §3.F).** Phase 1B doesn't touch `contract.js`.

6. **NODE-only test mode — `_forgeDebug.nodeOnly()` or a permanent flag?** See §6 below. Phase 1B can either add a debug method or thread a permanent `frame.skipEdges/skipGlyphs` flag through the renderer. **Recommendation: debug method (cheap, no contract change).**

7. **Inline-comment / header style for the NODE-spec lock comment block.** A ~30-line block at top of `forge.js`? Or a separate `// === NODE SPEC LOCK ===` section that lives just above `PARAM_DEFAULTS`? **Recommendation: above `PARAM_DEFAULTS`** — that's where the values live.

None of §5 questions are blockers in the strict sense. All have safe defaults; John can answer or wave on with the recommendation.

---

## §6. Acceptance test ideas — proving Phase 1B works

### Node-only test mode (the spec asked about)

Cheapest wiring: add `_forgeDebug.nodeOnly()` that flips a local boolean. In `drawFrame`, gate `edgeInstances` / `glyphInstances` on that boolean (pass `null`/empty when off). Renderer already early-returns at `webgpu.js:1111` / `:1136` when count is 0. **Cost: ~5 lines.** No pipeline / contract change.

Alternative permanent: thread `frame.skipEdges` / `frame.skipGlyphs` flags through `local.renderer.drawFrame({...})`. Renderer reads, skips passes. Slightly more invasive but ships as a real feature (also useful for printing / screenshot modes).

### Acceptance scenarios

| Scenario | Test | Pass criterion |
|---|---|---|
| **663-node deities (today's baseline)** | `_forgeDebug.nodeOnly()` then visual inspect | Disks at correct positions, correct family colors, correct tier sizes. No edges, no glyphs, no labels. Hover still hit-tests correctly. |
| **10k synthetic mode** | A synthetic mode that fabricates 10k nodes (deities × 15, e.g.) → load → `_forgeDebug.nodeOnly()` | Mount <100ms (excluding edge/glyph pack). Hover at 120Hz pointer rate stays in frame budget — measured by `performance.mark` around `hitTestAt`. Frame time at idle: <2ms (sub-baseline because no edges/glyphs running). |
| **50k synthetic mode** | Same as above, 50k | Mounts gracefully. Hit-test still O(1) buckets — measurable by `console.time` wrap of `hitTestAt`. No frame stalls. |
| **N4 invariant (packedAtScale)** | `_forgeDebug.dumpPackedAtScale()` after every `rebuildForMode` | Returns `camera.state.scale`. Always defined, never stale. |
| **N2 dirty-flag invariant** | Add a `_forgeDebug.countNodeVboWrites()` counter that increments in webgpu's writeBuffer path. After settled IDLE for 5s, counter delta should be 0. After one `rebakeNodes`, counter delta = 1. | Confirmed reduction from `frames * 1` to `rebakes * 1`. |
| **N1 hit-grid correctness** | Mouse over every node in `deities` mode programmatically (synthesize pointer events) | `hitTestAt` returns the same id as the pre-grid implementation for 100% of test points. **Critical** — grid must not silently miss hits at cell boundaries. |
| **Renderer `owned[]` symmetry** | Mount Forge → switch to Pantheon → switch back → repeat 50× | Browser perf-tools GPU memory stays flat (within noise). No browser-console "destroyed buffer used" warnings. |

### Debug surfaces to add (cheap)

- `_forgeDebug.nodeOnly()` — toggle node-only render.
- `_forgeDebug.dumpHitGrid()` — returns `{ cellSize, cols, rows, bucketSizes: [...] }` for sanity.
- `_forgeDebug.dumpPackedAtScale()` — returns `local.packedAtScale`.
- `_forgeDebug.countNodeVboWrites()` — reads a renderer-side counter that Phase 1B threads through the dirty-flag plumbing.

---

## Closing notes

The NODE atom's spec is already correct on a running build. Phase 1B is **codification work**, not redesign:

- N1 + N2 are mechanical perf wins, no design risk.
- N3 is a structural cleanup that pays back the moment device-lifecycle changes.
- N4 closes a latent footgun documented in a memory file (`feedback_pack_scale_invariant.md`).
- N5 / N6 / N7 are inline-documentation work the next agent will thank us for.

**Is Phase 1B ready to cast?** **Yes, with the §5 questions noted but not blocking** — every §5 has a safe-default recommendation. John can wave-on with defaults (recommendation) or pick alternatives without changing the implementation shape.

— audit goblin, Phase 1A, read-only, 2026-05-20.
