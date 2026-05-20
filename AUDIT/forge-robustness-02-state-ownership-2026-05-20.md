# Forge — State Ownership + Drift-Class Map (Audit 02)

**Filed:** 2026-05-20
**Filed by:** read-only audit goblin (no code edits, no commits except this doc)
**Scope:** All state owned by the Forge view + its dev panel + the WebGPU renderer. Where it lives, who reads/writes, what lifecycle event resets it, where the next drift bug is waiting to fire.
**Reads-after:** `AUDIT/forge-edge-state-invariant-2026-05-18.md` (the family-of-bugs primer — read its FINAL DIAGNOSIS), `AUDIT/forge-animation-pipeline-2026-05-20.md`, `AUDIT/forge-glyph-migration-handoff-2026-05-20.md`.
**No patches. High-level only.** Five-session bug-class history says: do the map before the next code lands.

---

## 1. TL;DR — top 3 drift-class risks (active or latent)

1. **🔴 Active: Option-B pull is one-shot at MOUNT, but persist→panel→engine sync depends on JS module load order.** `views/forge.js` reads `window.AtlasEngineForgeDevPanel.getState()` *once* during `render()`. The panel's own `tryBoot(retries)` is async (up to 4 seconds of retries) and pushes *its* state via `applyAllToEngine` once when `window._forge` becomes available. Two pushes from two directions, both one-shot, both racing module-load order. **First Forge mount before panel boot completes → engine seeded from PARAM_DEFAULTS, panel may later push (works) OR may have already pushed to a previous mount that's been torn down (lost).** The drift category from 2026-05-18 is structurally narrowed, not eliminated. See finding F1.
2. **🔴 Active: `local.iconByType` (icon overrides) is silently dead in the GPU glyph pipeline.** Read on mount via Option-B from panel state into `local.iconByType`, BUT `rebuildGlyphInstanceBuffer` (line ~1167) routes `n.type` directly through `glyphmod.idxForType` and never consults `local.iconByType`. The dev panel happily lets users pick icons; the engine ignores them. (Already flagged in handoff "What's NOT yet done #2"; restated here because it's a drift between *what the panel thinks is happening* and *what is rendered* — same category as the 2026-05-18 bug.) See finding F4.
3. **🟡 Latent: `local.lockedSet` survives mount lifecycle but `local.hoverId` resets — and `lockedSet` is also reset by `rebuildForMode`.** Cross-mode lock is cleared (correct, IDs don't map). But there is NO hash-router or URL-param round-trip; deep linking a locked view is impossible. More importantly, the `lockedSet` is the ONLY source of truth for "is anything in focus", and the status bar `LOCK —` indicator already burned us once (audit-doc addendum H2: phantom-lock hypothesis). Status strip displays `local.lockedSet.size` directly — fine today, but if anything ever forks (e.g. a "pin" feature or selection-rectangle), the status strip should drive off a derived `selectedSet` not the raw lockedSet. See finding F5.

---

## 2. State inventory table

### A. Params (the 78 dev-panel-controlled values)

| Name | Source of truth | Read sites | Write sites | Reset trigger | Drift risk |
|---|---|---|---|---|---|
| `local.params.*` (all 78) | Engine: `local.params` (per-view-instance). Panel: `state.params` (module-scope, hydrated from LS). | `drawFrame`, `hotPaletteFromParams`, `edgeOverridesFromParams`, `nodeOverridesFromParams`, `labelHierarchyFromParams`, `tierRadiiFromParams`, `rebuildGlyphInstanceBuffer`, `refreshGlyphAlphas`, all the CSS-var writes at end of `render()` | `setParam(name, value)` (engine), `state.params[id] = v` in slider/color handlers (panel) + `persist()` to LS | **Engine:** `render()` re-execution → `local.params = Object.assign({}, PARAM_DEFAULTS)` then Option-B pull. **Panel:** never resets implicitly; only `resetOne` / `resetAll` / module reload. | **Mount-time race window:** Option-B pull works ONLY if `window.AtlasEngineForgeDevPanel` exists at mount. If panel script loads AFTER forge.js mount completes (boot order: forge.js → glyph-atlas async → panel?), the engine sees only PARAM_DEFAULTS. Panel's `tryBoot` retries push via `applyAllToEngine` — but it pushes once and exits. Subsequent remounts (view switch back to forge) re-pull via Option-B, which is now race-free because panel is loaded. **First-mount-before-panel-boot is the surviving drift window.** |
| `PARAM_DEFAULTS` (frozen) | `forge.js` module scope (`Object.freeze`) | Engine `render()` for seed; panel hydration as priority #2 fallback (between LS and ALL_PARAMS[id].default) | Code edits only (the "BAKE" workflow) | Never at runtime | **Asymmetry with panel ALL_PARAMS[id].default values.** Panel still ships its own `default:` per control — `ALL_PARAMS[id].default` is used by `resetOne` / `resetAll`. So clicking "Reset all" in the panel does NOT reset to engine PARAM_DEFAULTS — it resets to the panel's hardcoded defaults which were the *pre-bake* values. See finding F2. |

### B. GPU buffers

| Name | Source of truth | Allocated by | Resized by | Uploaded by | Destroyed by | Drift risk |
|---|---|---|---|---|---|---|
| `nodeInstanceVbo` | `webgpu.js` closure | `ensureBuffer` inside `drawFrame` (lazy) | `ensureBuffer` grow path | `drawFrame` each frame: `device.queue.writeBuffer(...nVB)` (unconditional — uploads even unchanged data) | `api.destroy()` | None — full rewrite per frame masks any stale-data risk. |
| `edgeInstanceVbo` | `webgpu.js` closure | `ensureBuffer` in `drawFrame` | `ensureBuffer` grow | `drawFrame` unconditional | `api.destroy()` | None — full rewrite per frame. |
| `nodeStateVbo` (8 B/instance — state+selected) | `webgpu.js` closure | `ensureBuffer` in `drawFrame` | `ensureBuffer` grow | `drawFrame` from `frame.nodeStates \|\| new Float32Array(nodeCount * 2)` (fallback zeros = safe under current convention: 0=focused = no-dim) | `api.destroy()` | **Safe (convention is symmetric for nodes).** Fallback zeros = "no special treatment" = correct safe default. |
| `edgeStateVbo` (4 B/instance) | `webgpu.js` closure | `ensureBuffer` in `drawFrame` | `ensureBuffer` grow | `drawFrame` from `frame.edgeStates \|\| new Float32Array(edgeCount)` (fallback zeros = IDLE post-flip = correct safe default) | `api.destroy()` | **Safe** post 2026-05-18 convention flip — fallback zeros = IDLE. The `forceWriteEdgeState` belt-and-braces remains as dead-code safety (called from `resizeAndFit`); harmless but obsolete per the audit's note. |
| `glyphInstanceVbo` (32 B/instance) | `webgpu.js` closure | `ensureBuffer` first frame the atlas is live | `ensureBuffer` grow | `drawFrame` only when `frame.glyphInstances` non-null AND `nodeStateVbo` non-null | `api.destroy()` does NOT destroy this — **leak.** See finding F6. |
| `atlasTex` (glyph atlas texture) | `webgpu.js` closure | `create()` initial dummy 1×1; `setGlyphAtlas` replaces with real | `setGlyphAtlas` destroy+re-create | `setGlyphAtlas` via `copyExternalImageToTexture` | `setGlyphAtlas` destroys old; `api.destroy()` does NOT destroy current. **Leak.** See finding F6. |
| `glyphUvUbo` (UV rects uniform, 512 B) | `webgpu.js` closure | `create()` | Never resized | `setGlyphAtlas` writes `uvData` | `api.destroy()` does NOT destroy this. **Leak.** See finding F6. |
| `viewUbo` (192 B) | `webgpu.js` closure | `create()` | Never | `drawFrame` every frame | `api.destroy()` | None. |
| `diskUbo` (48 B — Phase 1 diagnostic) | `webgpu.js` closure | `create()` | Never | `drawDisk` only (legacy) | `api.destroy()` | **Dead code in the active pipeline.** Phase 1 diagnostic disk shader + pipeline + UBO still present, never used outside `drawDisk` (no callers in production code path). 🟢 Polish: delete. |
| `depthTex` (depth24plus) | `webgpu.js` closure | `ensureDepthTex` first `drawFrame`; recreated on FB size change | `ensureDepthTex` destroy+re-create on `(fbW, fbH)` change | (depth attachment cleared each pass) | `api.destroy()` | None — properly tracked and destroyed. |
| `bucketPalette` (JS-side, 32-float palette mirror) | `webgpu.js` closure | `create()` initial slate fill | `setBucketPalette(colors)` | Mirrored INTO viewUbo every `drawFrame` (`viewData.set(bucketPalette, 16)`) | None | None per se — but is a **second source of truth** alongside `local.params.active_color_*`. See finding F7. |

### C. JS-side state buffers (the fade pipeline)

| Name | Source of truth | Read sites | Write sites | Reset trigger | Drift risk |
|---|---|---|---|---|---|
| `local.nodeStates` (live, interleaved state+selected) | `views/forge.js` `local` closure | `drawFrame`, `refreshGlyphAlphas`, `tickNodeFades` (advances toward target) | `tickNodeFades` (in-place `.set`), `recomputeFocus` (allocates fresh on size mismatch, else seeds from new alloc), `rebakeNodes` (same fade-aware pattern) | `rebuildForMode` — `new Float32Array(nodePack.instanceCount * 2)` (wholesale replace) | **Per audit pipeline doc §"Things to NOT do" #1 — wholesale replacement breaks fade continuity.** `rebuildForMode` does the wholesale replace; that's intended (mode switch — IDs don't map, fade meaningless). BUT: `recomputeFocus` has a length-mismatch branch that ALSO wholesale-replaces (`local.nodeStates = new Float32Array(newNodeTargets)`). That branch should only fire post-rebuildForMode when sizes are bedding in — verify the contract. See finding F8. |
| `local.nodeTargets` | same | `tickNodeFades`, `refreshGlyphAlphas` (settled-fade check, removed in current code — uses `states` only) | `recomputeFocus` (in-place `.set` on size match; else replace), `rebakeNodes` (same) | `rebuildForMode` allocates fresh | Same caveat as `nodeStates`. |
| `local.edgeStates` | same | `drawFrame`, `tickEdgeFades` | `tickEdgeFades` (in-place), `recomputeFocus` (in-place .set; else replace), `rebakeEdges` (in-place .set; else replace) | `rebuildForMode` allocates fresh | Same caveat. Symmetric to nodeStates — both already fade-aware. |
| `local.edgeTargets` | same | `tickEdgeFades` | Same pattern as `nodeTargets` | `rebuildForMode` allocates fresh | Same caveat. |
| `local.glyphInstanceData` (32 floats/instance) | same | `drawFrame` (passes to renderer) | `rebuildGlyphInstanceBuffer` (full rewrite — new typed array each call), `refreshGlyphAlphas` (in-place alpha column) | `rebuildForMode` triggers full rewrite via `rebuildGlyphInstanceBuffer` | **The whole buffer is wholesale-replaced on every `rebuildGlyphInstanceBuffer` call.** That's fine for mode-switch but also fires on every `glyph_opacity`/`glyph_scale`/`glyph_tint` setParam call. If the user drags the `glyph_opacity` slider during a fade, the wholesale replace snaps the alpha column. Likely imperceptible (alpha snaps to baseOp before next frame's `refreshGlyphAlphas` re-derives from nodeStates) — but it's the same anti-pattern that bit `rebakeNodes`. See finding F9. |
| `local.labelEls` (Map<id, HTMLDivElement>) | `views/forge.js` `local` closure | `syncLabels`, `syncLabelPositions`, `ensureLabelEl` | `rebuildForMode` (clears + re-populates in a single fragment append) | `rebuildForMode` (full clear + recreate) | None per se; label DOM is correctly pre-created (per pipeline doc). |
| `local.glyphEls` | `views/forge.js` `local` closure | (none — used to be the DOM glyph overlay) | (initialized to `[]`, never written to in current code) | None | **Dead state.** Reference to defunct DOM overlay. 🟢 Polish: delete. |
| `local.glyphFamilyColor` (Map) | `views/forge.js` `local` closure | (none in current code) | (initialized empty, never written) | None | **Dead state.** 🟢 Polish: delete. |
| `glyphOverlay` (const, = null) | `views/forge.js` `render` scope | (none — already null per the comment "kept as null so any straggling reference fails fast") | Never | Never | Dead. 🟢 Polish: delete. |
| `local.glyphAtlas` | same | `setGlyphAtlas` upload, `rebuildGlyphInstanceBuffer` (reads `typeToIdx`) | `glyphmod.buildAtlas` resolve callback | Mount only | None — but module-scope cached atlas means the second mount uses the FIRST mount's atlas. Atlas content is mode-independent so this is correct. Just be aware. |

### D. Sets / scalar state (focus & interaction)

| Name | Source of truth | Read sites | Write sites | Reset trigger | Drift risk |
|---|---|---|---|---|---|
| `local.hoverId` | `views/forge.js` `local` | `recomputeFocus`, status strip, debug API | `setHoverId` (synchronous part) | `rebuildForMode` (set to null), `pointerleave` | None — single owner. Coalesced rAF makes the heavy recompute lag the synchronous DOM-cue update by up to 1 frame; visible only at 120Hz pointer + 60Hz rAF (intentional per audit fix). |
| `local.lockedSet` (Set<id>) | `views/forge.js` `local` | `recomputeFocus`, status strip, `flyToFocusedSet`, debug API | `toggleLock`, `handleSearch`, `rebuildForMode` (clear) | `rebuildForMode` (clear), `toggleLock(null)` (clear-all) | **No URL round-trip** — deep links lose lock state. 🟢 Polish if hash-router lands. |
| `local.focusedSet` (Set<id> \| null) | `views/forge.js` `local` | `drawFrame` (for `hasFocus` check), `tickXxxFades` (indirectly via targets), `syncLabels`, `flyToFocusedSet` | `recomputeFocus` (= `graph.focusedSetFor(hoverId, lockedSet, adjacency)`) | `rebuildForMode` (set to null) | **Derived state, but cached.** `recomputeFocus` is the only writer; `setHoverId` rAF-coalesces into it. If anyone else were to write `local.focusedSet` directly, drift. None today. |
| `local.selectedSet` (Set<id>) | `views/forge.js` `local` | (used inside `recomputeFocus` only?) | `recomputeFocus` | Same | Same derivation as focusedSet but separate set (no 1-hop). |
| `local.timeline` ({lo, hi, inDate, outDate, centerDate} \| undefined) | `views/forge.js` `local` | `recomputeFocus` (scrubber filter), `wireTimelineScrubber.refreshUI` | `wireTimelineScrubber` (on init + on drag) | `wireTimelineScrubber` only init; reset on every mount via re-init | **Reset on every mount.** Same drift category as params before Option-B was added — user-set IN/OUT bounds vanish on view-remount because timeline is recomputed from `deriveBounds()` of the current mode + reset to `{ lo, hi, lo, hi, midpoint }`. No persistence. See finding F10. |
| `local.mode.id` | `views/forge.js` `local` | Everywhere (status strip, rebuildForMode, dropdown) | `rebuildForMode(modeId)` | First mount → `modemod.defaultMode()` | **No URL/hash round-trip.** Switching from deities to documents and reloading: back on deities. Same category as timeline. See finding F10. |
| `local.iconByType` (object: type → iconId) | `views/forge.js` `local`. Mirrored in `state.icons` in panel. | (only on mount/Option-B pull from panel state) | Mount-time pull from panel. `setIcon(nodeType, iconId)` writes BUT `rebuildGlyphInstanceBuffer` doesn't read. | Mount | **🔴 Currently has no read site in the GPU glyph pipeline.** Flagged in handoff. Dead-pull. See finding F4. |
| `local.fontByScope` | `views/forge.js` `local` | (only used by `setFont` to set CSS vars) | Mount Option-B pull, `setFont` | Mount | **Half-implemented.** Panel stores `font ID` (e.g. `"inter"`); `setFont` expects `{ family }`. Code comment admits the gap. The CSS-var path (`--forge-font-{scope}`) is set by `setFont` only — no CSS rule consumes it that I can see. See finding F11. |
| `local.packedAtScale` | `views/forge.js` `local` | `camera.onChange` (5% drift check) | `rebakeNodes` (only) | Mount: undefined → first onChange falls through to scale=camScale | **The wrong-scale bug fixed at `76b252c`** (memory note `feedback_pack_scale_invariant.md`). Currently invariant: every `rebakeNodes` writes `packedAtScale = camera.state.scale`. ResizeAndFit explicitly calls `rebakeNodes` for the resize-no-onChange-trigger case (lines ~1051–1073). Asymmetry: any future code path that mutates `local.mode.nodePacked` without going through `rebakeNodes` won't update `packedAtScale` and will drift. See finding F12. |
| `local.destroyed` | `views/forge.js` `local` | Everywhere (guard) | `rootEl._engine.destroy()` | Set true on destroy | None — single owner. |
| `local.animRafId` | `views/forge.js` `local` | `startAnimLoop` (idempotency), `animTick`, `destroy` | `startAnimLoop`, `animTick` | None other than animTick self-exit | **Conflated semantic.** Pipeline doc §"Things flagged but not fixed" #1 — `animRafId != null` doesn't mean "fade in flight", it could be camera ease. Adding a `local.fadesInFlight` boolean was recommended; not done. 🟡 If a future agent gates pre-warm on `animRafId`, drift. |

---

## 3. Lifecycle transition matrix

Five lifecycle events, every state row → does it survive (✅) or reset (❌) or get re-derived (♻️)?

| State | A. First mount | B. View remount (Pantheon→Forge→back) | C. Window resize (no remount) | D. Mode switch (within mount) | E. Unmount (destroy) |
|---|---|---|---|---|---|
| `local.params` (engine) | ❌ then ♻️ via Option-B pull from panel | ❌ then ♻️ via Option-B (race window: F1) | ✅ survives | ✅ survives | gone |
| `state.params` (panel, module-scope) | ✅ from LS at module init | ✅ persists across remounts (module-scope) | ✅ | ✅ | ✅ (module survives) |
| `PARAM_DEFAULTS` (frozen) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ALL_PARAMS[id].default` (panel) | ✅ | ✅ | ✅ | ✅ | ✅ — but **divergent from PARAM_DEFAULTS**; see F2 |
| GPU `nodeInstanceVbo` | allocated | **NEW renderer instance** (destroy old + create new) — buffer recreated | ✅ same buffer; resized only on count change | ♻️ rewritten | destroyed via `api.destroy()` |
| GPU `nodeStateVbo` | allocated | **NEW renderer** — recreated | ✅ | ♻️ rewritten | destroyed |
| GPU `edgeStateVbo` | allocated | **NEW renderer** — recreated | ✅ (no recompute trigger — would be a bug; saved by `resizeAndFit`'s `rebakeEdges/recomputeFocus/forceWriteEdgeState` chain) | ♻️ rewritten | destroyed |
| GPU `glyphInstanceVbo` | allocated after atlas async resolve | **NEW renderer** — recreated | ✅ (no new data needed; world coords from packed nodes which may be stale post-resize → see F13) | ♻️ rewritten via `rebuildGlyphInstanceBuffer` | **NOT destroyed** by `api.destroy()` — leak |
| GPU `atlasTex` | dummy 1×1 → replaced async by `setGlyphAtlas` | **NEW renderer** — new dummy → new real atlas (atlas built again from scratch via async `buildAtlas`) | ✅ | ✅ | **NOT destroyed** by `api.destroy()` — leak |
| GPU `glyphUvUbo` | allocated | **NEW renderer** — recreated | ✅ | ✅ | **NOT destroyed** — leak |
| GPU `depthTex` | allocated on first draw | **NEW renderer** — recreated on first draw | ♻️ recreated when `(fbW,fbH)` changes | ✅ | destroyed |
| `bucketPalette` (JS mirror) | initial slate fill in `create()` | **NEW renderer** — re-init to slate, then `setBucketPalette` from view boot | ✅ | ✅ | gone with renderer |
| `local.nodeStates` / `edgeStates` / `nodeTargets` / `edgeTargets` | allocated as zero-length, then sized on `rebuildForMode` | ❌ — `local` is per-mount → all reset | ✅ (resize calls `rebakeNodes`+`rebakeEdges`+`recomputeFocus` — fade-aware patterns preserve continuity since sizes unchanged) | ❌ wholesale replace by `rebuildForMode` (intended — IDs don't map) | gone |
| `local.glyphInstanceData` | (none until atlas live + rebuildGlyphInstanceBuffer) | ❌ rebuilt | ✅ (no rebuild triggered on resize — but world coords + radii could be stale if rebakeNodes ran; see F13) | ❌ rebuilt | gone |
| `local.labelEls` | empty | ❌ rebuilt (all DOM divs recreated) | ✅ | ❌ all cleared + recreated | DOM divs orphaned (they live in labelsOverlay which is removed when rootEl.innerHTML = '' next time; ok) |
| `local.hoverId` | null | ❌ reset to null | ✅ (no change; hit-test may yield same id) | ❌ reset (rebuildForMode clears) | gone |
| `local.lockedSet` | empty Set | ❌ reset to empty | ✅ | ❌ cleared (intentional) | gone |
| `local.focusedSet` | null | ❌ | ♻️ recomputed via `recomputeFocus()` in resize path | ❌ reset then recomputed on next hover | gone |
| `local.timeline` | derived from mode bounds | ❌ reset (re-derived from mode) | ✅ | ❌ reset | gone |
| `local.mode.id` | `modemod.defaultMode()` | ❌ reset to default (loses user's mode pick) | ✅ | ♻️ (that's the point) | gone |
| `local.iconByType` | empty, then Option-B pull | ❌ then Option-B pull | ✅ | ✅ | gone |
| `local.fontByScope` | empty, then Option-B pull | ❌ then Option-B pull | ✅ | ✅ | gone |
| `local.packedAtScale` | undefined → set on first `rebakeNodes` | ❌ undefined | ♻️ updated on every `rebakeNodes` (which `resizeAndFit` calls) | ♻️ updated by mode rebuild's pack | gone |
| `state.open` (panel) | from LS | ✅ persists | ✅ | ✅ | ✅ |
| `state.icons` (panel) | from LS | ✅ | ✅ | ✅ | ✅ |
| `state.fonts` (panel) | from LS + defaults | ✅ | ✅ | ✅ | ✅ |

**Reading the matrix:** every ❌ in column B (view remount) is a candidate drift opportunity. Option-B pull addresses params + icons + fonts. **Mode + timeline are NOT addressed** — they reset to defaults on every remount even though the panel has persistent storage. The drift class is identical to the params bug pre-Option-B.

---

## 4. Findings (severity-ranked)

### 🔴 CRITICAL — active drift class, fix soon

#### F1. Option-B pull is one-shot and module-load-order sensitive

**Where:** `views/forge.js:457–486` (`try { panelApi = window.AtlasEngineForgeDevPanel; ... }`).

**The drift:** Forge's Option-B fix from 2026-05-18 was correct *given* the panel module has loaded and hydrated from LS by the time `render()` runs. Examine the script load order in `index.html`: if `dev-panel-forge.js` is loaded AFTER `views/forge.js` (or after the page's first navigate-to-Forge), Option-B falls through silently (the `try` catches the missing `panelApi` and logs a warn, then engine boots with PARAM_DEFAULTS).

**The patched dependency:** `dev-panel-forge.js` then runs `tryBoot(retries)` which polls `window._forge` and calls `applyAllToEngine()` when found. This *re-establishes* sync. But:
- It only fires *once* per panel module load. If Forge has been mounted-and-destroyed before panel boot completes (e.g. user clicks Pantheon → Forge → Pantheon → Forge in <4 s), the second mount may have a torn-down `window._forge` and the push goes to nothing.
- If `window._forge` is already present at panel boot (the common case), Option-B did the pull, AND `applyAllToEngine` does a redundant push. Idempotent today, but couples two systems.

**Severity:** active — same family that cost 5 sessions. Hasn't bit anyone yet only because `index.html` script order is currently lucky.

**High-level proposal:** Make Option-B work via *subscription*, not single-pull. Either:
- Engine fires a `forge:mount-ready` event; panel always handles it with `applyAllToEngine` (in addition to its `tryBoot` initial push).
- OR: panel exposes a `subscribe(callback)` that the engine calls; on every `setParam` from the panel, the callback updates engine state. (Reverses ownership — panel is then the source of truth, engine is read-only.)

#### F2. Two `default:` sources of truth — `PARAM_DEFAULTS` (engine) vs `ALL_PARAMS[id].default` (panel)

**Where:** `dev-panel-forge.js:570–593` — `resetOne(id)` reads `c.default` (= `ALL_PARAMS[id].default`, the hardcoded per-control default from SECTIONS). `views/forge.js:110–216` — `PARAM_DEFAULTS` is the post-bake John-tuned set.

**The drift:** clicking "Reset all" or double-clicking a row resets to the panel's *original* hardcoded default (e.g. `idle_color_transmission: '#3a4a66'` happens to match; but `selected_size_mult: 1.15` in panel vs `1.20` in PARAM_DEFAULTS, `selected_glow_strength: 0.65` vs `0.50`, `glyph_opacity: 0.86` matches but `glyph_tint: 0.55` vs `0.25`, etc — many drift today).

**User-visible:** the user clicks "Reset" expecting their stored config to drop back to "what the wheel ships with" (which is John's tuned PARAM_DEFAULTS), but gets the pre-bake panel defaults. The dev panel's `state.params` hydration ALREADY correctly prefers PARAM_DEFAULTS (panel line 283–293) — but `resetOne` doesn't use the same priority.

**Severity:** active drift between two source-of-truth tables.

**High-level proposal:** `resetOne(id)` should read from `engineDefaults[id]` (= `window._forge.PARAM_DEFAULTS[id]`) FIRST, falling back to `ALL_PARAMS[id].default`. Or eliminate `ALL_PARAMS[id].default` entirely (just keep `min/max/step` for slider range).

#### F3. `bucketPalette` is mirrored in JS, written from `local.params` but not re-pulled if `local.params` mutates

**Where:** `webgpu.js:769–778, 793–803`. `views/forge.js:669` (initial push), `forge.js:2233–2238` (`rebakeBucketPalette` on `active_color_*` / `active_opacity_*` change).

**The path:** When the user drags an `active_color_transmission` slider, `setParam` routes to `rebakeBucketPalette()` which calls `setBucketPalette(hotPaletteFromParams())`. Fine.

**The drift opportunity:** Anyone who mutates `local.params.active_color_*` directly (e.g. a future scripted "demo mode", a hash-router param, a feature flag) bypasses `setParam` and the palette uniform never updates. The shader silently keeps painting in the old palette.

**Severity:** latent. No current code path mutates `local.params` outside `setParam`. But the convention is fragile.

**High-level proposal:** Make `local.params` a `Proxy` so any write triggers the appropriate rebake. OR enforce "params change ONLY via setParam" and document at top of forge.js (banner already exists; add this).

#### F4. `local.iconByType` is loaded but never read by the GPU glyph pipeline

**Where:** Mount-time pull at `views/forge.js:466–470`. `setIcon(nodeType, iconId)` at `views/forge.js:2318–2322` writes it and calls `rebakeGlyphsForMode`. `rebuildGlyphInstanceBuffer` (`views/forge.js:1150–1190`) reads `n.type` directly without consulting `local.iconByType`.

**The drift:** The panel UI lets the user override icons per node-type (Symbol Per Node Type section); selections persist in LS; mount-time Option-B pull populates `local.iconByType` faithfully. AND THEN `rebuildGlyphInstanceBuffer` ignores it entirely.

**Severity:** active — same category as the 2026-05-18 bug (panel UI shows one thing, engine renders another).

**High-level proposal:** Either implement (route `local.iconByType[n.type]` through the icon-library to glyph atlas index; requires either expanding the atlas or treating overrides as deferred) OR remove the panel UI section until atlas-bake catches up. The current silent-ignore is the worst of both. Already flagged in `forge-glyph-migration-handoff-2026-05-20.md` "What's NOT yet done #2".

---

### 🟡 IMPORTANT — potential drift, fix when convenient

#### F5. `lockedSet` is shared with Pantheon V2 by design (per memory `feedback_scripture_view_gotchas.md` … wait, that's a different sharing concept — but the `lockedSet` here is a single `local.lockedSet` per mount, NOT shared cross-view)

**Re-reading:** the Scripture memory's `lockedSet` is a *Pantheon* concept; in Forge it's per-mount. Disregard the cross-view aspect; the finding is narrower:

**The narrow issue:** `local.lockedSet` is the source of truth for both "is anything locked" (status strip) and "what should I dim against" (`focusedSetFor`). The status strip displays raw `local.lockedSet.size`. If a future feature wants a separate "pin-but-don't-dim" or "exclude-from-focus" mode, the conflation between *displayed* lock count and *effective* focus driver will require splitting.

**Severity:** latent. Worth knowing before any selection-related feature lands.

**High-level proposal:** When the next feature lands, derive `effectiveFocusSet = lockedSet ∪ pinnedSet ∪ ...` once in `recomputeFocus` and never read `lockedSet` directly outside `toggleLock` + status strip.

#### F6. Three GPU resources leak on `api.destroy()`: `glyphInstanceVbo`, `atlasTex`, `glyphUvUbo`

**Where:** `webgpu.js:1156–1167` (`destroy()`).

**The leak:** `api.destroy()` destroys `quadVbo`, `edgeRibbonVbo`, `diskUbo`, `viewUbo`, `nodeInstanceVbo`, `edgeInstanceVbo`, `nodeStateVbo`, `edgeStateVbo`, `depthTex`, and `device`. Missing: `glyphInstanceVbo`, `atlasTex` (current handle), `glyphUvUbo`. When `device.destroy()` is called, the GPU driver presumably cleans up everything; this is more of a code-hygiene gap than a functional leak. But it is asymmetric with the rest of the cleanup → an audit-class drift if a future codepath destroys-without-device-destroy.

**Severity:** 🟡 — present-day functionally fine; structurally a drift opportunity.

**High-level proposal:** Add the three missing `try { x.destroy() } catch ()` lines.

#### F7. Bucket palette is a *second source of truth* alongside `local.params.active_color_*`

**Where:** `bucketPalette` in `webgpu.js`. `local.params.active_color_*` in forge.js.

**The duplication:** every dev-panel slider change for `active_color_*` triggers `rebakeBucketPalette` which writes BOTH to `local.params` (via `setParam`'s early-return-after-write) and to the renderer's `bucketPalette` (via `setBucketPalette(hotPaletteFromParams())`). Two sources, kept in sync by convention.

**Severity:** 🟡 — same drift category as F3.

**High-level proposal:** Renderer should expose `setBucketColor(bucketIdx, rgba)` and `setBucketOpacity(bucketIdx, a)`; OR renderer should read `bucketPalette` lazily from a callback. Either eliminates the parallel array.

#### F8. `recomputeFocus` length-mismatch branch wholesale-replaces `nodeStates`

**Where:** `views/forge.js:1489–1491, 1504–1507`.

```js
if (!local.nodeStates || local.nodeStates.length !== newNodeTargets.length) {
  local.nodeStates = new Float32Array(newNodeTargets);   // wholesale replace
}
```

**The risk:** if any code path causes `nodeTargets.length` to mismatch `nodeStates.length` without a clean `rebuildForMode` (the legitimate case), the wholesale-replace kills any in-flight fade. Today: rebuildForMode is the only legitimate driver; the branch is defensive. But if a future "filter mode" or "dynamic node-add" lands, the size mismatch will fire mid-session.

**Severity:** 🟡 — invariant violation IS guarded by audit's "DON'T do this #1" but the guard is "if length matches, .set in place" — the *fallback* still violates the invariant. Documented anti-pattern hiding in defensive code.

**High-level proposal:** Make size-changes explicit (caller must call `resizeStateBuffers(newLen)` which does the wholesale replace deliberately + signals "fade was reset"). Then `recomputeFocus` only ever does in-place updates.

#### F9. `rebuildGlyphInstanceBuffer` wholesale-replaces `local.glyphInstanceData` on every `setParam('glyph_opacity'/'glyph_scale'/'glyph_tint')`

**Where:** `views/forge.js:2268–2270` route, `rebuildGlyphInstanceBuffer` allocates `new Float32Array(N * 8)`.

**The cost:** small (32 floats × N ≈ 21 KB), but the pattern is the same anti-pattern that bit `rebakeNodes` (audit pipeline doc §"rebakeNodes wholesale-replacing nodeStates"). Per-frame `refreshGlyphAlphas` then in-place writes the alpha column. So the wholesale-replace + in-place write is asymmetric: opacity/scale/tint slider drag = wholesale replace; everything else = in-place.

**Severity:** 🟡 — almost certainly imperceptible to users (slider-drag drops are rare and the next `refreshGlyphAlphas` immediately re-derives from current `nodeStates`). But the pattern is the same trap.

**High-level proposal:** Make `rebuildGlyphInstanceBuffer` allocate only on instance-count mismatch; otherwise in-place update (radii, tint, idx). Mirrors the `rebakeEdges` pattern.

#### F10. `local.timeline` and `local.mode.id` reset on every view-remount

**Where:** `views/forge.js:1776–1781` (timeline init), `views/forge.js:383` (mode default).

**The drift:** identical drift category to the params bug pre-Option-B. User scrubs the timeline to 500 BCE–500 CE; switches to Pantheon; switches back to Forge; timeline is reset to full range. User switches Mode dropdown from Deities to Documents; reloads; back to Deities.

**Severity:** 🟡 — no functional bug, but discoverable workflow loss.

**High-level proposal:** Persist `mode.id` + timeline IN/OUT/CENTER to LS via a small key (`codex-atlas/forge-runtime-v1`); hydrate from LS at mount with same priority order as params. Cheap; same pattern as panel state.

#### F11. `local.fontByScope` is half-wired

**Where:** Panel stores `font ID` strings (`"inter"`); `views/forge.js:476–478` stashes them as `{ id: fontId }`; `setFont(scope, font)` expects `{ family }` (the FONTS catalog entry) and writes a `--forge-font-{scope}` CSS variable. There's no CSS rule (in `app.css`) consuming those vars.

**The drift:** Panel UI lets the user pick fonts; selections persist; nothing renders differently. Same family as F4.

**Severity:** 🟡 — feature ghost.

**High-level proposal:** Either wire fully (add CSS rules `font-family: var(--forge-font-label, "Inter", ...);` to `.forge-label`, `.forge-status*`) or hide the Typography section in the panel until ready.

#### F12. `local.packedAtScale` invariant is correct but not enforced

**Where:** `views/forge.js:2200–2202` (`rebakeNodes` updates it), `views/forge.js:723–737` (`camera.onChange` reads it).

**The invariant:** every code path that writes `local.mode.nodePacked` must update `local.packedAtScale = camera.state.scale`. Today only `rebakeNodes` and `rebuildForMode` do that; `rebakeNodes` is explicit, `rebuildForMode` runs `packNodes` then sets `local.mode = { ... }` overwriting `mode.nodePacked` but doesn't set `local.packedAtScale`. **Hmm, that's a real gap — verify:**

Re-reading `rebuildForMode`: it calls `packNodes` AFTER `camera.fitToExtent` (per the 2026-05-19 pack-scale-fix), so the pack uses the correct scale. But it doesn't update `local.packedAtScale`. Next camera change → `camera.onChange` reads `local.packedAtScale || camScale`. Falsy fallback → ratio = 1 → no rebake. So the bug doesn't fire because the fallback masks the missing write.

**Severity:** 🟡 — invariant violated quietly; saved by the `|| camScale` fallback. If anyone removes the fallback in a "clean this up" pass, the wrong-scale bug from memory `feedback_pack_scale_invariant.md` returns.

**High-level proposal:** In `rebuildForMode`, after the camera fit + packNodes block, explicitly set `local.packedAtScale = camera.state.scale`. Belt-and-braces.

#### F13. Window resize triggers `rebakeNodes` + `rebakeEdges` + `recomputeFocus` but NOT `rebuildGlyphInstanceBuffer`

**Where:** `views/forge.js:1051–1074` (resize-no-mount path).

**The drift:** `rebakeNodes` updates `mode.nodePacked` (new world radii baked from new camera scale). `rebakeEdges` updates `mode.edgePacked`. But the glyph instance buffer's `pos.x/y/radius` columns are derived from `np.data[i*NF+0..2]` at `rebuildGlyphInstanceBuffer` time. After resize → rebakeNodes → glyph instance buffer still holds the OLD radii and OLD packed positions. Next `drawFrame` uploads stale glyph instance buffer.

**Wait — verify:** `rebakeNodes` (line 2200+) ends with `rebakeGlyphsForMode()` (line 2203) which calls `rebuildGlyphInstanceBuffer()`. So the chain IS:
- `resizeAndFit` → `rebakeNodes` → calls `rebuildGlyphInstanceBuffer` inside → ✅ correct.

So actually it's wired. **Downgrade severity to 🟢.** The cross-reference is non-obvious (you have to follow `rebakeNodes → rebakeGlyphsForMode → rebuildGlyphInstanceBuffer`) — finding stands as a documentation finding rather than a drift bug.

**High-level proposal:** Add a comment in `resizeAndFit`'s resize branch noting the chain. Cheap.

---

### 🟢 POLISH — dead code, hygiene

- **`local.glyphEls`** initialized to `[]`, never written. Remove.
- **`local.glyphFamilyColor`** initialized to empty Map, never written. Remove.
- **`glyphOverlay`** const set to null, never used. Remove.
- **`syncGlyphPositions` / `syncGlyphFocus`** kept as no-op functions. Remove and clean callers (they only have a handful left after the GPU migration).
- **`rebakeGlyphsForMode`** is currently a 2-line wrapper around `rebuildGlyphInstanceBuffer + drawFrame`. Inline at callers.
- **Phase 1 disk pipeline** (`diskShaderModule`, `diskPipeline`, `diskUbo`, `diskBg`, `api.drawDisk`) — diagnostic-only, no production caller. ~50 lines of dead WebGPU.
- **`forceWriteEdgeState`** — the 2026-05-18 audit said keep "one more session as belt-and-braces"; per its FINAL DIAGNOSIS, the convention flip is the real fix and `forceWriteEdgeState` was never needed. Resize path still calls it. Remove (call site + method).
- **Phase 1 single-disk diagnostic shader** docs at top of webgpu.js — historical; consider trimming or moving to a HISTORY block.

---

## 5. Single-source-of-truth proposals (high level, no patches)

### SSOT-1. One defaults table

**Proposal:** Delete `ALL_PARAMS[id].default` from the panel control catalog. The panel's `ALL_PARAMS` entries keep `kind / id / label / hint / min / max / step / unit` (the things specific to the UI widget) and lose `default`. The single source of truth for default *values* is `window._forge.PARAM_DEFAULTS`. Hydration uses LS → PARAM_DEFAULTS only. `resetOne` reads PARAM_DEFAULTS only.

**Knock-on:** the panel can't render before `views/forge.js` has loaded (so `window._forge.PARAM_DEFAULTS` is defined). Today `index.html` script order already ensures this — formalize as a contract.

### SSOT-2. Subscription, not single-pull, for panel ↔ engine sync

**Proposal:** Forge view exposes `window._forge.subscribe((params) => { … apply … })`. Panel calls `subscribe` once during its init and pushes its full state through it whenever Forge mounts (mount fires the callback registered via subscribe). Eliminates the "did Option-B run before or after panel boot?" race.

Alternative formulation: a `forge:params-needed` CustomEvent on `window`; panel listens; engine dispatches on every `render()`.

### SSOT-3. Renderer reads palette via callback, no JS mirror

**Proposal:** `gpu.create(canvas, { getBucketPalette: () => hotPaletteFromParams() })`. The renderer calls the callback every `drawFrame` to refresh `viewData[16..47]`. No `bucketPalette` array. No `setBucketPalette` method. No `rebakeBucketPalette` route in setParam. `local.params.active_color_*` is the *only* source.

**Cost:** 7 × hex2rgba calls per frame. At 60 fps that's 420 conversions/s — negligible. Or memoize when `active_color_*` doesn't change (use a dirty flag in setParam).

### SSOT-4. Per-instance state buffers in a single shape, owned by `recomputeFocus`

**Proposal:** Treat `local.nodeStates / nodeTargets / edgeStates / edgeTargets / glyphInstanceData` as a single bag with one allocator (`allocateForMode(N, E)`) called from `rebuildForMode` only. After that, EVERY other function MUST update in-place. The length-mismatch branches in `recomputeFocus / rebakeNodes / rebakeEdges` become dead code; failure to size correctly throws (no silent wholesale-replace).

**Eliminates F8 + F9 + an entire family of "wholesale replace breaks fades" gotchas.**

### SSOT-5. Persisted runtime state under one LS key

**Proposal:** `codex-atlas/forge-runtime-v1` = `{ mode, timeline: { in, out, center }, lockedSet: [...ids] }`. Hydrated at mount with same priority order as panel state. Eliminates F10 + opens deep-linking later.

### SSOT-6. `local.iconByType` either wired or removed

Already covered in F4. The SSOT formulation: the icon-library is the registry; the GPU atlas is the rasterization; `local.iconByType` must either feed the atlas builder OR be removed from the data model entirely. The current state (panel writes, engine reads in mount only, GPU ignores) is the worst of all worlds.

---

## 6. Closing notes for the next agent

- **Diagnostic order remains:** rendered pixels → GPU buffer → JS params → panel state → code defaults. Walk it. (Per `feedback_devpanel_engine_drift.md`.)
- **Three patches on one bug = escalate to convention flip.** (Per `feedback_safe_default_conventions.md`.) Apply to every drift surface above before adding a fourth patch.
- **The 5-session bug was a SYNC problem (one-shot push, view remount resets, drift visible).** Every remaining drift opportunity in this audit is structurally that same problem in a different mask. Fixing them piecemeal is whack-a-mole. SSOT-1 + SSOT-2 + SSOT-4 collectively close the family.

— audit goblin closed 2026-05-20.
