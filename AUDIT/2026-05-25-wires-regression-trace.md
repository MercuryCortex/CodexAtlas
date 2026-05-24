# Wires-regression trace — 2026-05-25

**Symptom (John, verbatim):** "now when I click a node the wires are ALWAYS half opaque, THEN when I move it gets full 1."

## TL;DR

The throttle introduced in Phase 22-AH (`forge.js:4364`) is the bug. It gates
the boosted-palette upload on a JS-side flag (`local._hoverBoostActive`)
that goes out of sync with what the renderer's `bucketPalette` actually
holds. After certain sequences the flag reads `true` while the renderer
still has the baseline palette uploaded — so the throttle wrongly skips
the upload that would push wires to 1.0.

The cheapest, most defensive fix is to **delete the throttle**:
re-build + upload the palette on every `recomputeFocus`. The cost is
trivial (32 floats, one JS-side memcpy per hover/lock change — never
per frame). The throttle was premature.

---

## Audit responses

### 2 — All `setBucketPalette` upload sites (`grep -rn setBucketPalette src/`)

Exactly three writers in the JS view, plus the renderer's own definition:

- `forge.js:2157` — mount, with hover=null + lockedSet=∅ → BASELINE palette
  uploaded once on bootstrap.
- `forge.js:4367` — `recomputeFocus()` boost trigger (Phase 22-AH).
  Gated by `_hoverBoostActive !== wantBoost` (line 4364).
- `forge.js:4905` — `applyUxMode()` (theme/order swap). Unconditional
  re-upload. Does NOT touch `_hoverBoostActive`.

Renderer storage: `webgpu.js:914` (`bucketPalette = new Float32Array(32)`),
default-filled with slate + 0.85 alpha at lines 918–923; setter at
`webgpu.js:952`. The renderer's `drawFrame` copies this array into the
view-uniform every frame (`webgpu.js:1258`). The renderer has NO other
mutator.

### 3 — Every `_hoverBoostActive` assignment

Only one writer: `forge.js:4365`. Initial value = `undefined` (never
seeded in `local = { ... }` at line 1617). So the very first
`recomputeFocus` triggers an upload regardless of `wantBoost`.

### 4 — Click-flow side effects after `toggleLock`

`endPan` at `forge.js:8114` → `toggleLock(hit)` at `:8160` (sync) →
`recomputeFocus()` at `:8015` (sync) → `saveRuntimeState()` at `:8017` →
`_onLockChange` at `:8021`. `_onLockChange` (defined at `:6820`) only
mutates `local.deityTabs / openTabId`, calls `renderTabs / setPanelOpen /
triggerClickPulse / pulseTab / render`. None of these touch the renderer
palette or call `setBucketPalette`. Confirmed clean.

### 5 — Re-entry into `recomputeFocus`

`focusedSetFor` and `computeSelectedSet` (`:4356`–`:4357`) are pure
reads against `graph.adjacency`; they do not mutate `local.hoverId`
or `local.lockedSet`. Confirmed clean.

### 6 — `rebakeNodes` palette interaction

`rebakeNodes` (`forge.js:8428`) does NOT call `setBucketPalette`. It
re-packs node instance data + tier classifier + hit grid + label
sync + `rebakeEdges()` (which is also palette-clean). Camera-onChange
firing rebakeNodes mid-zoom cannot itself cause the symptom.

### 1 — The actual path

The flag desync occurs across this sequence (verified against the
synchronous/rAF interleave in `setHoverId` at `:4775` and `endPan` at
`:8114`):

1. Hover node A → `setHoverId(A)` (`:8082`) sets `local.hoverId=A` SYNC,
   schedules rAF.
2. rAF fires → `recomputeFocus()` (`:4816`) → `wantBoost=true`,
   `_hoverBoostActive` flips `false→true`, **boosted palette uploaded**.
3. Cursor leaves canvas, OR moves to empty space, OR layout shift moves
   the canvas under the cursor (`pointerleave` at `:8086` calls
   `setHoverId(null)`) → `_hoverBoostActive` flips back to `false`,
   **baseline palette uploaded**.
4. Layout shifts back / cursor returns onto node A. The next
   `pointermove` calls `setHoverId(A)` which sets `hoverId=A` sync +
   schedules rAF.
5. **Before the rAF fires**, user clicks. `pointerdown` (`:8090`) does
   not setHoverId. `pointerup` → `endPan` → `toggleLock(A)` →
   `recomputeFocus()` runs SYNC. At this moment: `hoverId=A`,
   `lockedSet={A}`, `wantBoost=true`. `_hoverBoostActive` is still
   `false` from step 3 → check passes → upload should fire.
6. BUT: between steps 4 and 5 a hover-rAF from a stale prior frame can
   have already fired and bumped `_hoverBoostActive=true` while the
   renderer's palette is still at baseline (steps 3→5 with an
   intervening `applyUxMode` at `:4905` re-upload of the baseline palette,
   which writes the renderer's bucketPalette to baseline but does NOT
   reset `_hoverBoostActive`).

**The asymmetry at `forge.js:4905` is the load-bearing flaw:** that
site can write the renderer palette without updating the JS-side
mirror flag. From that moment on the throttle's invariant
(`_hoverBoostActive` reflects the renderer's current palette) is broken,
and every subsequent `recomputeFocus` that matches `wantBoost ===
_hoverBoostActive` skips an upload it should have made.

Even without `applyUxMode`, the **initial value is `undefined`** and the
**baseline mount upload at `:2157`** establishes the renderer in
"baseline" while the JS flag is "undefined" — a desync at boot that
only the first hover-transition coincidentally corrects.

### Move → 1.0 path

`pointermove` (`:8082`) → `setHoverId(B)` → rAF → `recomputeFocus` →
`wantBoost` toggles because the prior `setHoverId(null)` between
moves had flipped `_hoverBoostActive=false` somewhere → upload fires.
The "move fixes it" is the throttle accidentally re-aligning.

## Proposed surgical fix

Remove the throttle. Re-upload on every `recomputeFocus`. Keep the
JS-side `_hoverBoostActive` flag deletion symmetric so future code
can't reintroduce the desync.

```diff
--- a/src/js/views/forge.js
+++ b/src/js/views/forge.js
@@ -4355,16 +4355,16 @@ function recomputeFocus() {
       const idx       = local.mode.nodePacked.idIndex;
       local.focusedSet  = graph.focusedSetFor(local.hoverId, local.lockedSet, local.mode.adjacency);
       local.selectedSet = computeSelectedSet(local.hoverId, local.lockedSet);
-      // Phase 21R → 22-AH (2026-05-25) — palette boost trigger.
-      // Re-upload on EITHER hover-state transition OR lock-set
-      // empty/non-empty transition so steady-state focus reads at
-      // 1.0 alpha. Boost lives in hotPaletteFromParams(); this
-      // site is the throttled trigger.
-      const wantBoost = (local.hoverId != null) || !!(local.lockedSet && local.lockedSet.size > 0);
-      if (local._hoverBoostActive !== wantBoost) {
-        local._hoverBoostActive = wantBoost;
-        if (local.renderer && local.renderer.setBucketPalette) {
-          try { local.renderer.setBucketPalette(hotPaletteFromParams()); }
-          catch (_) { /* ignore — renderer may be tearing down */ }
-        }
+      // Phase 22-AI (2026-05-25) — palette upload, unthrottled.
+      // The 22-AH `_hoverBoostActive` throttle desynced from the
+      // renderer's actual bucketPalette via the asymmetric write
+      // at applyUxMode (forge.js:4905) which uploads but does not
+      // touch the JS flag. Symptom: click → wires stay at baseline,
+      // move → wires jump to 1.0. Re-upload unconditionally; cost
+      // is 32 floats + one memcpy per hover/lock change (≤60Hz),
+      // not per frame.
+      if (local.renderer && local.renderer.setBucketPalette) {
+        try { local.renderer.setBucketPalette(hotPaletteFromParams()); }
+        catch (_) { /* ignore — renderer may be tearing down */ }
       }
```

Additionally, the redundant `applyUxMode` re-upload at `forge.js:4905`
can be deleted: `applyUxMode → rebuildForMode → ... → recomputeFocus`
now uploads on every entry, so the belt-and-braces "refresh to be safe"
becomes a duplicate.

## Files / line cites

- Bug live: `src/js/views/forge.js:4358–4370`
- Asymmetric writer: `src/js/views/forge.js:4900–4907`
- Mount upload: `src/js/views/forge.js:2157`
- Renderer setter: `src/js/engine/renderer/webgpu.js:952–962`
- Renderer storage / default: `src/js/engine/renderer/webgpu.js:914–923`
- Click flow: `src/js/views/forge.js:8114–8180` (endPan) →
  `:7998–8024` (toggleLock) → `:4354–4370` (recomputeFocus)
- Hover flow: `src/js/views/forge.js:4775–4818` (setHoverId rAF) →
  `:4354–4370`
