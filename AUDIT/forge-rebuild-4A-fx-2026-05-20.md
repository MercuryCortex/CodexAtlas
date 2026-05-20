# Forge rebuild — Phase 4A · FX micro-audit

**Filed:** 2026-05-20
**Filed by:** Phase-4A FX goblin (read-only, no code edits, no commits beyond this doc)
**Scope:** FX ornament layer ONLY — selected glow, GPU glyphs (atlas + pipeline + per-frame alpha refresh + culling), and CSS-positioned labels (DOM pre-create + visibility + position sync).
**Out of scope (deferred to other phases):** node atom (Phase 1, LOCKED), hover/click/fade pipeline/rAF coalesce (Phase 2, LOCKED), edges (Phase 3, LOCKED), camera/mode-switch/scrubber/search/persistence (Phase 5).
**Reads-with:** `AUDIT/forge-rebuild-layered-spec-2026-05-20.md` §2 Phase 4; `AUDIT/forge-robustness-lock-plan-2026-05-20.md` §3 findings map; component audits 01 §F4/F5/F6, 04 §2/§6/§7, 05 §2.3/§3 I1/I2/I3.

---

## §1. TL;DR (3 lines)

1. **Phase 1B + 2B already gave the FX layer half the foundation it needs** — depth invariant comment on the disk-side write site, glyph-z read-site is already heavily documented (`webgpu.js:434-455`), nodeStateVbo cross-pipeline reuse comment present, owned-list destroy is symmetric. Phase 4B's job is the four FX-specific items the lock plan promised: atlas 128 + mipmaps, glyph viewport/min-size cull, refreshGlyphAlphas settled-fade short-circuit, label DOM cap + visible-labels Set, plus the selected-glow discard derivation.
2. **The known-not-done list from the glyph migration handoff is still all open** — `glyph_tint` ignored (hardcoded `0.55` at `forge.js:1582`), atlas at 64 not 128 (`forge.js:981`), refreshGlyphAlphas comment promises a short-circuit the code doesn't deliver (`forge.js:1595-1601` vs `1602-1616`), no mipmaps generated despite `mipmapFilter:'linear'` on the sampler (`webgpu.js:700`).
3. **No active correctness bugs in the FX layer.** Risk surface is convention-only — the depth invariant + nodeStateVbo reuse are protected by inline comments but not by code structure; the selected-glow discard threshold is a magic number that already cost three sessions of bumps; pre-create label DOM scales linearly with N, which works today but blows up at 10k. All FX risk is "underspecified, not broken" — same shape as Phase 1B/2B/3B.

---

## §2. Locked FX spec table

Locked spec = the dimension as Phase 4B will encode it. "Code site" = where the rule is enforced today or where Phase 4B will need to encode it. "Doc'd inline?" = is there a comment block at the site that names the invariant. "Enforced vs convention" = is it enforced by code structure (assertions, types, single source) or just by convention (a comment that the next refactor could ignore).

| Dimension | Locked spec | Code site (file:line) | Doc'd inline? | Enforced vs convention |
|---|---|---|---|---|
| **Selected glow quad scale** | `quad_scale = mix(1.0, selected_glow.w × 1.5, inst_selected)` — 1.5× headroom past glow extent so smoothstep completes well inside the quad. | `webgpu.js:152` (NODE_SHADER vs) | ✅ Long inline block at `webgpu.js:139-151` explaining the bite-out-of-background artifact this fixes. | **Convention** — a future agent who removes the 1.5 will silently bring back the square artifact. No regression test. |
| **Selected glow discard threshold** | Derive from `selected_glow_strength` uniform (proposal: `if (final_a < (0.05 + max(0.0, v.selected_glow_strength - 1.0) * 0.1)) discard;`) so the discard adapts as the slider moves. **Phase 4B target.** | `webgpu.js:213` (hardcoded `0.15`) | ✅ Long inline block at `webgpu.js:197-212` documenting the bump history (0.04 → 0.08 → 0.15) and trade-off. | **Convention** — magic number; bumped three times in three sessions; will re-bite if `selected_glow_strength` ever exceeds ~1.5. |
| **Glyph z = parent disk z** | Selected → 0.0; focused → 0.3; dim → 0.6. Glyph drawn after disk in same render-pass; wins by draw-order tiebreak in `less-equal` depth test. | `webgpu.js:454-455` (glyph vs); mirrors `webgpu.js:159-160` (node vs). | ✅ Excellent inline block at `webgpu.js:434-453` — covers the depth-direction reasoning + cross-instance occlusion behaviour. Phase 1B added the disk-side write-site comment; the glyph-side read-site comment is also already in place. **No work needed in Phase 4B for this item — it's already documented at both sites.** | **Convention** — relies on (a) pass order edges→nodes→glyphs not changing, (b) `depthCompare:'less-equal'` not flipping to `less`, (c) all three pipelines in the same render pass. |
| **nodeStateVbo cross-pipeline reuse** | Same VBO drives node disk + glyph state/selected per instance. WebGPU queue order guarantees write enqueued before pass-encode is visible to the pass. | `webgpu.js:1136-1167` (write site, with invariant block); `webgpu.js:1226-1229` (glyph read site). | ✅ Large inline block at `webgpu.js:1136-1161` ("CROSS-PIPELINE INVARIANT") plus comment at the glyph setVertexBuffer call. Phase 1B locked this. | **Convention** — protected by a comment; refactor that splits the glyph pass into a separate render pass silently breaks it. |
| **Glyph atlas cell size** | 128 px (per D1, John greenlit). 17 cells in a 5×4 grid → 640×512 atlas → ~1.3 MB rgba8unorm. **Phase 4B target.** | `forge.js:981` (`glyphmod.buildAtlas(64)` today); `glyph.js:90` (atlas builder accepts `cellPx` param — already parameterised, just called with 64). | ❌ No inline doc that ties cellPx to the Retina-DPR=2/3 sharpness target. | **Convention** — the parameter is already plumbed; only the caller needs updating + a comment block locking the value. |
| **Glyph atlas mipmaps** | Generate mipmaps so `mipmapFilter:'linear'` on the sampler (`webgpu.js:700`) is actually used. Currently the sampler is set but the texture has `mipLevelCount: undefined` → no mip chain → mipmap filter is a no-op. **Phase 4B target.** | `webgpu.js:996-1007` (`setGlyphAtlas`) — creates texture without `mipLevelCount`; `copyExternalImageToTexture` only fills mip 0. | ❌ Not documented anywhere that mipmaps are missing. | **Not enforced.** Sampler claims mipmap filtering, texture has no mips → silent visual softness at deep zoom. |
| **Glyph instance layout** | 8 floats × 32 bytes per instance — `(x, y, r, glyphIdx, R, G, B, A)`. Radius pre-multiplied by `glyph_scale` in JS; size_mult on top in shader (only when selected). | `forge.js:1567-1588` (packer); `webgpu.js:735-738` (pipeline buffer attrs). | ✅ Doc comment at `forge.js:1540-1549` enumerates the 8-float layout. | **Convention** — single packer site, single pipeline declaration. Frozen layout. |
| **Glyph alpha premultiplied** | Atlas uploaded with `premultipliedAlpha: true` (`webgpu.js:1005`); fragment outputs `vec4(in.tint.rgb * a, a)` premultiplied (`webgpu.js:472`); swap-chain `alphaMode:'premultiplied'` (`webgpu.js:529`). | `webgpu.js:472, 1005, 529` | ✅ Comment at `webgpu.js:471` "Premultiplied alpha output." Also at the upload site. | **Enforced** — the three coupled sites are consistent. |
| **Glyph alpha refresh — settled-fade short-circuit** | When `nodeStates === nodeTargets` element-wise (no fade in flight), skip the O(N) loop AND skip the renderer's glyph VBO write by passing `null` for `glyphInstances`. **Phase 4B target.** | `forge.js:1602-1616` (the function); `forge.js:1493-1495` (caller); `webgpu.js:1216-1230` (renderer write site). | ❌ **Lies in code** — comment at `forge.js:1595-1601` claims short-circuit, function body unconditionally loops + writes. Direct equivalent of the "doc-promised, never implemented" finding from audit 01 F2 / 04 #2 / 05 I4. | **Convention** — gating needs (a) element-wise compare or a `local.fadesInFlight` boolean (B5 from Phase 2B already touches this territory), (b) caller passes `glyphInstances:null` when not dirty, (c) renderer skips `writeBuffer` for glyph VBO when null. |
| **Glyph viewport + min-size cull** | In `refreshGlyphAlphas`, set `alpha=0` when `screen_r < 4px` OR world position is outside the viewport bounds. Existing `if (a < 0.02) discard;` (`webgpu.js:470`) handles GPU-side. Pure alpha gating; no pipeline change. **Phase 4B target.** | `forge.js:1602-1616` (where the cull should live). | ❌ Comment at `forge.js:1136-1138` notes DOM-era cull was deleted on migration; no replacement. | **Not enforced.** All N glyph instances run the vertex shader every frame regardless of viewport / screen size. |
| **Glyph tint factor** | Read `local.params.glyph_tint` instead of hardcoded `0.55`. Handoff doc flags this as known-not-done since Phase 0. | `forge.js:1582` (`mth.lightenColor(fc, 0.55)`). | ❌ The hardcoded `0.55` predates the migration; the param is in `PARAM_DEFAULTS` (`forge.js:375` = `0.25`) but unread. | **Not enforced.** Param ghost — same family as `iconByType` (deleted in Phase 0) and `fontByScope` (Phase 0). Either wire it OR delete the param from `PARAM_DEFAULTS`. (See §5 Q4.) |
| **Label DOM pre-create cap** | `pre-create = min(N, label_idle_max + label_cap × 2)` (≈1k today). Lazy-create the rest via `ensureLabelEl` on first reveal. **Phase 4B target.** | `forge.js:1316-1334` (the unconditional `for i < nodePack.instanceCount` pre-create); `forge.js:1628-1661` (`ensureLabelEl` — already supports lazy creation, just isn't being deferred to). | ❌ Comment at `forge.js:1270-1283` explains WHY pre-create exists (kill the first-hover stall) but doesn't cap. | **Not enforced.** At 10k = 10k DOM nodes paid on every mode-switch (~150-300ms stall). At 50k = ~1-2s freeze. |
| **Label opacity transition** | `.forge-label { opacity: 0; transition: opacity 0.15s ease-out; }` + `.forge-label[data-visible="1"] { opacity: 1; }`. CSS-driven fade; JS only flips the data-attribute on diff. | `src/styles/app.css:5873-5904`. | ✅ Long CSS comment at `app.css:5894-5899`. | **Enforced** — CSS is the single source. JS path is pure attribute-diff (`forge.js:1698-1706`). |
| **Visible-labels Set for position loop** | Maintain `local.visibleLabelEls` Set updated only when `data-visible` flips. Position loop iterates the Set, not the full `local.labelEls` Map. **Phase 4B target.** | `forge.js:1727-1751` (position loop walks full Map, skips via `!hasAttribute('data-visible')`). | ❌ Comment at `forge.js:1736-1741` acknowledges the skip but doesn't add the Set. | **Not enforced.** O(N) Map walk per `syncLabelPositions` call. At 10k it's 10k attribute reads per camera tick. |
| **Idle-label hierarchy** | Computed in `label.js` `computeIdleLabelVisibility` — per-tier soft budget (40/30/20% + tier-3 uncapped), top-down AABB collision pruning, tier-3 skips collision check. | `label.js:47-129`. | ✅ Excellent header comments at `label.js:1-22, 27-46, 73-103`. | **Enforced** — pure function, single call site. Phase 4B doesn't touch this. |
| **labelsOverlay z-stack** | `position: absolute`, `pointer-events: none`, `z-index: 5` on the overlay; same on labels. Above canvas, below toolbar/status chrome. | `app.css:5863-5872`. | ✅ Comment at `app.css:5870`. | **Enforced** — single CSS source. |

---

## §3. Findings — severity-ranked, FX-only

### 🔴 CRITICAL — required for Phase 4B acceptance

**FX1. `refreshGlyphAlphas` settled-fade short-circuit is doc-promised, not implemented.**
- **Where:** `forge.js:1595-1601` (the lying comment block) vs `forge.js:1602-1616` (unconditional implementation).
- **Symptom:** At idle (no fade in flight), the function still runs the O(N) loop + the caller still hands a non-null `glyphInstanceData` to the renderer + the renderer still uploads ~21 KB per frame at deities, ~1.6 MB at 50k. The comment claims this is gated; the code says otherwise. Three audits cite this (01 F2, 04 #2, 05 I4) plus the handoff doc #3.
- **Phase 4B fix:** (a) element-wise `nodeStates === nodeTargets` check at top — returns false / unchanged when settled. (b) Caller `forge.js:1495` passes `null` when nothing changed. (c) Renderer skips `writeBuffer(glyphInstanceVbo, …)` when `frame.glyphInstances === null`. Mirror N2/F3 acceptance: per-frame upload count == fade-frame count, not 60.
- **Lock-plan ID:** T1.3 / 05-I4 / 04-#2.

**FX2. Glyph viewport + min-size cull is missing from the GPU pipeline.**
- **Where:** `forge.js:1602-1616` is where the alpha gate belongs; the DOM-era cull (`forge.js:1136` no-op stub) was deleted with the migration.
- **Symptom:** At 10k zoom-fit, all 10k glyph instances run the vertex shader every frame even though most are <1 px on screen. At 50k it's all 50k. The GPU survives because the fragment discard (`if (a < 0.02) discard;`) catches sub-pixel work, but vertex-shader cost still climbs linearly with N.
- **Phase 4B fix:** in `refreshGlyphAlphas`, project each instance's world (x, y, r) to screen via `camera.scale + viewport`; set the alpha column to 0 when `screen_r < 4 px` OR center is more than ~one-screen-width outside the viewport. Existing `<0.02 discard` in the fragment shader handles the GPU side. Pure alpha gating; zero pipeline change.
- **Lock-plan ID:** T1.5 / 01-F5.

**FX3. Label DOM pre-creation scales with N, not visible-labels.**
- **Where:** `forge.js:1316-1334` (the `for (let i = 0; i < nodePack.instanceCount; i++)` pre-create loop with batch fragment append).
- **Symptom:** At 10k → 10k `<div>` allocations on every mode-switch (~150-300 ms Chrome/Safari stall). At 50k → ~1-2 s freeze. The pre-create exists to kill a 47-div first-hover stall; capping it at the idle-tier headroom restores the win without paying the N tax.
- **Phase 4B fix:** Cap the loop at `min(N, label_idle_max + label_cap × 2)` ≈ 1000 today. Lazy-create the rest via existing `ensureLabelEl` (`forge.js:1628`) — which already does the title-resolution + appendChild + Map set work. First-hover of a never-shown label pays a single appendChild (fast enough to be invisible).
- **Lock-plan ID:** T1.4 / 01-F4.

### 🟡 IMPORTANT — required for FX polish + Retina sharpness + selected-glow robustness

**FX4. Atlas at 64 px, no mipmaps — soft on Retina at deep zoom.**
- **Where:** `forge.js:981` (`glyphmod.buildAtlas(64)`); `webgpu.js:996-1007` (`setGlyphAtlas` creates texture with no `mipLevelCount`, copies only mip 0); `webgpu.js:696-703` (sampler set to `mipmapFilter:'linear'` but the texture has no mip chain — silent no-op).
- **Symptom:** At DPR=2 + zoom-in, a 64 px atlas cell magnified to ~280 px on screen is 4× bilinear blur. `mipmapFilter:'linear'` claims to mitigate but the texture has only mip 0, so it doesn't.
- **Phase 4B fix:** (a) `buildAtlas(128)` — atlas builder already parameterised at `glyph.js:90`. (b) Extend `setGlyphAtlas` to allocate `mipLevelCount` = `floor(log2(max(W, H))) + 1` AND generate mips via a small `device.queue.copyTextureToTexture` chain (or a one-shot compute / render pass). (c) Optionally: add `mipmapOption` flag to `buildAtlas` so the atlas builder generates downsampled canvases at each mip level (more accurate than GPU box-filter; CPU cost is amortised at boot). Cost: ~280 KB texture vs ~70 KB today (still tiny). One-shot at boot — no per-frame impact.
- **Lock-plan ID:** T3.1 / 05-I3 / 01-P1.

**FX5. Selected-glow discard threshold (0.15) is a tuned magic number.**
- **Where:** `webgpu.js:213` (hardcoded `if (final_a < 0.15) discard;`).
- **Symptom:** Three sessions of bumps (0.04 → 0.08 → 0.15) because `selected_glow_strength` can outrun the discard threshold and reintroduce the square clip. Today (`PARAM_DEFAULTS.selected_glow_strength = 0.50`) it's safe. If John ever turns the slider up past ~1.5 the artifact returns.
- **Phase 4B fix:** Derive threshold from the uniform: `let discard_t = 0.05 + max(0.0, v.selected_glow_strength - 1.0) * 0.1; if (final_a < discard_t) { discard; }`. Replace the magic number with a derived value that adapts to the slider. Add an inline comment block citing the strength→threshold relationship and citing the 1.5× quad headroom that makes the safe range work.
- **Lock-plan ID:** T3.2 / 05-I2.

**FX6. No visible-labels Set; position loop walks full label Map.**
- **Where:** `forge.js:1727-1751` (`syncLabelPositions`) walks the full `local.labelEls` Map; skip-check is `!el.hasAttribute('data-visible')` — an O(1) DOM attribute read per entry but still O(N) total.
- **Symptom:** At 10k → 10k attribute reads per camera tick (every frame during pan/zoom). At 50k → 50k. Diff loop in `syncLabels` (`forge.js:1698-1706`) walks the full Map too.
- **Phase 4B fix:** Maintain `local.visibleLabelEls = new Set()` updated only when `setAttribute('data-visible', '1')` or `removeAttribute('data-visible')` runs (centralise the flip in a helper so the Set stays consistent). Position loop iterates the Set. Diff loop can use a symmetric-difference against a "previously visible" Set instead of a full walk.
- **Lock-plan ID:** T3.3 / 01-F6.

### 🟢 POLISH — small wins or pre-existing handoff items

**FX7. `glyph_tint` param ignored — hardcoded 0.55.**
- **Where:** `forge.js:1582` (`mth.lightenColor(fc, 0.55)`). `PARAM_DEFAULTS.glyph_tint = 0.25` (`forge.js:375`) is unread.
- **Phase 4B fix:** either read the param (`mth.lightenColor(fc, 1 - local.params.glyph_tint)` or whatever convention matches the prior DOM-era semantics) OR delete `glyph_tint` from `PARAM_DEFAULTS`. The latter is consistent with Phase 0's "delete features that don't ship" — `iconByType` + `fontByScope` were deleted there, `glyph_tint` should follow the same logic if not wired. See §5 Q4 for John's call.
- **Lock-plan ID:** 05-P1 (handoff item #1).

**FX8. Stale GLYPH_SHADER header comment.**
- **Where:** `webgpu.js:357-369` — the GLYPH_SHADER block comment still describes the OLD "z slightly in FRONT of parent disk" strategy (`0.05/0.25/0.55`). Actual code uses glyph z = parent disk z exactly.
- **Phase 4B fix:** rewrite the header comment to match the current strategy + cite Phase 1B's depth fix at `bfc35d2` + cite this audit. Cosmetic; cited in audit 04 §2 footnote and 05 I1.
- **Lock-plan ID:** 04-§2 footnote.

**FX9. `syncGlyphFocus` + `syncGlyphPositions` no-ops still in place.**
- **Where:** `forge.js:1536-1537` (one liner stub), plus `forge.js:1037` and `forge.js:1046` (still-called sites in `camera.onChange`).
- **Phase 4B fix:** delete the no-op functions + their caller sites. Already flagged in audit 04 §Polish #1 and audit 02 dead-state cleanup (T3.14). Tiny — but if Phase 4B is touching glyph code, the deletion belongs here.
- **Lock-plan ID:** T3.14.

**FX10. Per-frame `glyphRgb` parse in drawFrame caller path is fine; the hex-parse inside `rebuildGlyphInstanceBuffer` (`forge.js:1582-1583`) is per-N at mode-switch only.**
- Not a hot path. Flagging only for completeness — no Phase 4B action.

### Cross-layer, deferred to other phases (flagged for awareness)

- **Bind group re-creation on `setGlyphAtlas`** — `webgpu.js:1013` calls `makeGlyphBindGroup()` after texture swap. Correct (TextureView is created fresh), and `setGlyphAtlas` is one-shot at boot. Audit 05 I7 flags it as "do not call mid-session". **Deferred to Phase 5** (renderer lifecycle / mode-switch orchestration territory).
- **Renderer destroy() symmetry** — Phase 1B's `owned[]` list already covers glyphUvUbo / atlasTex / glyphInstanceVbo (audit 05 P3 closed). No Phase 4B work.
- **nodeStateVbo + glyph-z invariant comments** — already in place at both sites (`webgpu.js:1136-1161` write site, `webgpu.js:434-453` glyph read site, `webgpu.js:139-151` node read site). No Phase 4B work needed — Phase 1B + the depth-fix commit already locked these.

---

## §4. Phase 4B implementation checklist

### REQUIRED — blocks Phase 4 acceptance gate

1. **FX1 — refreshGlyphAlphas settled-fade short-circuit.** Element-wise compare nodeStates vs nodeTargets at top; return false / unchanged when settled. Caller passes `null` for `frame.glyphInstances` when not dirty. Renderer gates `writeBuffer(glyphInstanceVbo, …)` on non-null. (Mirror Phase 1B N2 + Phase 3B F3 dirty-flag pattern.)
2. **FX2 — glyph viewport + min-size cull.** Inside `refreshGlyphAlphas`, screen-project each instance via `camera.scale` + viewport; set `data[i*8+7] = 0` when `screen_r < 4` OR outside expanded viewport bounds. Existing fragment-discard handles the rest. No pipeline change.
3. **FX3 — label DOM pre-create cap.** Replace `for (let i = 0; i < nodePack.instanceCount; i++)` at `forge.js:1317` with `const preCap = Math.min(N, p.label_idle_max + p.label_cap * 2);` + loop to preCap. Defer the rest to `ensureLabelEl`.
4. **FX4 — atlas 128 px + mipmaps.** Change `buildAtlas(64)` → `buildAtlas(128)` at `forge.js:981`. Extend `setGlyphAtlas` in `webgpu.js:991` to compute `mipLevelCount`, allocate texture with that many mips, and generate them (either via successive `copyExternalImageToTexture` from downsampled canvases — preferred, sharper text — or a small render-pass chain).
5. **FX5 — selected-glow discard derived from uniform.** Replace `if (final_a < 0.15) discard;` at `webgpu.js:213` with the derived expression cited in FX5 above; inline a doc block explaining the strength→threshold relationship.
6. **FX section header in `forge.js` top.** Mirror NODE/BEHAVIORS/WIRES headers (Phase 1B/2B/3B style). Lock the 5 dimensions above + the existing depth invariants + the cross-pipeline VBO reuse, and reference this audit doc.

### RECOMMENDED — strongly worth doing in the same batch

7. **FX6 — visible-labels Set.** Centralise the data-visible flip in a helper that also updates `local.visibleLabelEls`. Position loop iterates the Set.
8. **FX9 — delete `syncGlyphPositions` / `syncGlyphFocus` no-ops + their callers.** Tiny cleanup; Phase 4B is the moment.
9. **FX8 — rewrite stale GLYPH_SHADER header comment** to match the current z = disk z + draw-order strategy.

### OPTIONAL — fold in if time, else defer to L5/Phase 6 polish

10. **FX7 — `glyph_tint` decision.** Either wire it or delete it from `PARAM_DEFAULTS`. Bundle with John's §5 Q4 answer.
11. **Glyph-z runtime assertion (audit 05 I1 / 04 §2).** Optional dev-mode render-to-readback test that confirms a known-selected glyph paints over its disk. Useful as a tripwire but not blocking. Defer if time pressure.

---

## §5. Open questions for John — with safe-default recommendations

**Q1. Atlas 128 vs 64.** D1 from the lock plan already greenlit by John ("ship 128 with foundation"). **Recommended default:** 128 px + mipmaps + downsampled-canvas generation (sharper than GPU box filter for hand-illustrated SVGs). **Cost:** ~280 KB vs ~70 KB; one-shot at boot. **Confirm pre-cast:** any change of mind, or proceed with 128?

**Q2. Selected-glow discard threshold — derive from uniform vs keep hardcoded with comment.** **Recommended default:** derive (`final_a < 0.05 + max(0, strength - 1.0) * 0.1`) — removes the entire "square clip is back when I crank the slider" bug class. Trade-off: a tiny bit of glow tail clipped at high strength values; matches the trade-off John already accepted at 0.15. Alternative: clamp `selected_glow_strength` in PARAM_DEFAULTS' implied range (currently 0.50; if max is 1.5 then 0.15 is provably safe forever). **Recommend the derive option.**

**Q3. Label DOM pre-create cap — fixed cap (`min(N, 1000)`) vs N-aware (`min(N, label_idle_max + label_cap × 2)`).** **Recommended default:** N-aware (`min(N, 750 + 240) = min(N, 990)`) so the cap tracks the user's tuned `label_idle_max` + `label_cap` rather than a hardcoded number. Reads cleaner; the params already exist; the formula is self-documenting. **Fallback:** if Phase 4B sees scope creep, hardcode 1000 + inline comment citing the formula — defer the N-aware version to L5.

**Q4. `glyph_tint` — wire or delete?** Phase 0 deleted `iconByType` + `fontByScope` as half-wired param ghosts; `glyph_tint` is the same shape. **Recommended default:** delete from `PARAM_DEFAULTS` (line 375) AND from any UI surface that mentions it (dev panel is gone, so this is just the PARAM_DEFAULTS line). The hardcoded `0.55` becomes the locked value. Alternative: wire it (`mth.lightenColor(fc, 1 - local.params.glyph_tint)` or matching convention) — costs ~5 LOC + rebuildGlyphInstanceBuffer call on setParam. **Recommend delete** for Phase 0 consistency.

**Q5. Stagger of FX5 vs FX1/FX2/FX3.** All 5 REQUIRED items can ship in one Phase 4B commit. FX5 (selected-glow discard derivation) is the smallest diff (1 line + comment). FX4 (atlas 128 + mipmaps) is the largest (texture lifecycle + mip generation). **Recommend:** single atomic Phase 4B commit covering all 5 + the FX header — matches the Phase 1B/2B/3B cadence.

---

## §6. Acceptance test ideas

Concrete probes to verify Phase 4B is correct. Mirror the existing `_forgeDebug` + `debugCount*` style.

**FX1 / FX2 — glyph alpha refresh + cull:**
- `await window._forgeDebug.dumpBugState()` at IDLE — confirm fade settled.
- Add `_forgeDebug.countGlyphVboWrites()` (mirror `debugCountNodeVboWrites` / `debugCountEdgeVboWrites` already in `webgpu.js:825-827`). Idle for 5 s; count should be 0 (or 1 if first frame). Trigger a hover; count should equal fade-frame count (~9 at 60 fps × 0.15 s), then plateau.
- Zoom out until all glyphs are <4 px on screen. `_forgeDebug.countCulledGlyphs()` (new helper that counts entries where `glyphInstanceData[i*8+7] === 0`) should equal nodeCount. Hover-fade in; cull state should update only on `camera.onChange`, not every frame.

**FX3 — label DOM cap after mode-switch:**
- Switch to a high-N synthetic mode at N=10k. `document.querySelectorAll('.forge-label').length` should equal `min(10000, label_idle_max + label_cap × 2)` ≈ 990 — NOT 10000.
- First-hover of a node whose label was NOT pre-created: `ensureLabelEl` runs; the new `<div>` appears; opacity transitions normally. No visible stall.

**FX4 — atlas 128 + mipmaps:**
- Zoom in until a disk fills ~280 px on screen. Visually inspect a deity glyph; should be sharp, no bilinear blur.
- `_forgeDebug.dumpAtlasInfo()` (new helper) returns `{ width: 640, height: 512, mipLevels: 10, cellPx: 128 }` (or whatever the computed mip count is).

**FX5 — selected-glow no square clip at any strength:**
- Lock a node with default `selected_glow_strength = 0.5`. No square outline visible — passing.
- Programmatically bump `local.params.selected_glow_strength = 2.0` + drawFrame. Should STILL be circular — the derived discard catches the tail. Hardcoded-0.15 version would show the square clip.

**FX6 — visible-labels Set updates on hover:**
- Confirm `local.visibleLabelEls.size` matches the count of DOM elements with `data-visible` attribute. Hover a node; Set grows by ~focus-cap entries. Move pointer to empty space; Set shrinks back.

**Cross-cutting:** mode-switch wall time at N=10k should be <50 ms (from current ~200-350 ms) with FX3 in place. Idle GPU upload bandwidth (per `debugCountGlyphVboWrites` + matching node + edge counters) should be ~0 MB/s once fades settle.

---

— Phase 4A FX micro-audit, read-only, 2026-05-20. Phase 4B is **ready to cast with safe defaults** once John confirms Q1-Q4 (defaults above). No code touched; this doc is the only deliverable.
