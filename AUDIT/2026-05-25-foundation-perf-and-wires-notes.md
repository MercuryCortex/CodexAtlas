# Foundation perf + wires regression — notes for parallel agents

**Status:** Phase 22-AH shipped (4 fixes from prior audit). User reports:
1. Timeline STILL gagging on zoom (Phase 22-AH's perf fix wasn't enough)
2. **NEW regression:** clicking a node now shows wires at HALF opacity; only mouse-move boosts to 1.0
3. Architectural concern: "we are a mass-scale node app — why is this happening at all?"

User casting parallel agents to help diagnose. This doc is the brief.

---

## 1. The wires regression (HIGHEST PRIORITY — Phase 22-AH may have introduced it)

### User report (verbatim)
> "now when i click a node the wires are ALWAYS half opaque, THEN when i move it gets full 1"

### My Phase 22-AH intent (commit `0800fa8`)
Active wire alpha should reach 1.0 on **lock OR hover** (was hover-only). Two changes:

1. `forge.js:4358–4369` — `recomputeFocus()` boost trigger:
   ```js
   const wantBoost = (local.hoverId != null) || !!(local.lockedSet && local.lockedSet.size > 0);
   if (local._hoverBoostActive !== wantBoost) {
     local._hoverBoostActive = wantBoost;
     if (local.renderer && local.renderer.setBucketPalette) {
       try { local.renderer.setBucketPalette(hotPaletteFromParams()); }
       catch (_) { /* ignore */ }
     }
   }
   ```

2. `forge.js:8258–8273` — `hotPaletteFromParams()`:
   ```js
   const hasHover = (local.hoverId != null);
   const hasLock  = !!(local.lockedSet && local.lockedSet.size > 0);
   const boost = hasHover || hasLock;
   return BUCKET_ORDER.map(b => {
     const baseA = p['active_opacity_' + b];
     const a = boost ? Math.min(1.0, Math.max(baseA, HOVER_BOOST_ALPHA)) : baseA;
     return hex2rgba(p['active_color_' + b], a);
   });
   ```

### Expected flow on click
1. User hovers node X → `setHoverId(X)` → `hoverId=X` sync → rAF queues `recomputeFocus`
2. Either:
   - Sub-case A: rAF fires first → `recomputeFocus` runs → `wantBoost=true` (hover) → palette upload at 1.0.
   - Sub-case B: User clicks before rAF → `toggleLock(X)` (sync) → `recomputeFocus` (sync) → `wantBoost=true` (hover+lock) → palette upload at 1.0.
3. Either way wires should be at **1.0 after click**.

### What user sees
- Click → wires at half opacity (≈ 0.74–0.90, the per-bucket `active_opacity_*` baseline)
- Move mouse (still on same node) → wires JUMP to 1.0

### Hypotheses worth chasing
1. **Hypothesis A — order-of-fire bug.** Click handler at `forge.js:8160` calls `toggleLock(hit)` SYNCHRONOUSLY. `toggleLock` at `forge.js:8015` calls `recomputeFocus`. But maybe the click handler also fires something AFTER that resets `_hoverBoostActive` or `setHoverId(null)`. Trace `endPan` (line 8114) and `pointerup` (line 7855 etc.) for anything that nulls `hoverId` post-click.

2. **Hypothesis B — `_hoverBoostActive` initial state is wrong.** Check whether `_hoverBoostActive` is `undefined` on first click of a session (it never got initialized). `undefined !== true` is true so the upload SHOULD fire. But if some path sets it to `true` without uploading (e.g. theme refresh at `forge.js:4905` does upload but doesn't update the flag — that's the smoking gun, see point 3).

3. **Hypothesis C — theme-refresh upload bypasses flag.** `forge.js:4904–4906` uploads via `setBucketPalette(hotPaletteFromParams())` BUT does NOT update `local._hoverBoostActive`. If this fires after a click (e.g. via some rebuild path that runs `setColorOverride` or theme change), the palette could reset to baseA WHILE `_hoverBoostActive` stays true. Next recomputeFocus call sees no flag transition → no re-upload. Mouse-move then triggers some other path that DOES re-upload at 1.0.

4. **Hypothesis D — pulse FX touches the palette.** Phase 21AE's `triggerHoverFlash` (forge.js:4789) on `pulse-enabled`. Does the FX system call `setBucketPalette` to do the pulse? Search.

5. **Hypothesis E — the click triggers a `rebuildForMode` somewhere.** Mount-time upload at `forge.js:2157` is unconditional baseA. If a rebuild fires on click (e.g. through `local._onLockChange` at `toggleLock`:8021 → side-panel render → some downstream path) and re-runs mount-time init, palette goes to baseA. Then mouse-move's `recomputeFocus` runs, sees `_hoverBoostActive` is still `true`, doesn't re-upload — BUT the user reports mouse-move FIXES it, which means mouse-move IS re-uploading at 1.0. So this hypothesis needs the flag to also have been reset.

### Quick diagnostic (paste in DevTools console)
```js
// Watch every palette upload to console.
const orig = window._forge && window._forge.__r && window._forge.__r.setBucketPalette;
// Or wrap at site: temporarily edit setBucketPalette to console.log.
// Easier: instrument the helper.
```
Actually the cleanest diagnostic: add a `console.log` at line 4366 logging `[before/after]` flag + `wantBoost` + alpha values, then click + observe.

### Proposed fix (still hypothesis-stage)
Make every palette-upload site go through ONE helper that takes a reason:
```js
function uploadBucketPalette(reason) {
  const pal = hotPaletteFromParams();
  if (local.renderer && local.renderer.setBucketPalette) {
    try { local.renderer.setBucketPalette(pal); } catch (_) {}
  }
  local._hoverBoostActive = (local.hoverId != null) || !!(local.lockedSet && local.lockedSet.size > 0);
  if (LOG) console.log('[palette]', reason, 'boost=' + local._hoverBoostActive);
}
```
Call it from mount, theme-refresh, AND the boost-transition site. Flag becomes a DERIVED state, not a separate truth.

---

## 2. Timeline performance — the structural issue

### User report (verbatim)
> "its STILL GAGGING, and the most annoying is that TAKES A SECOND to hover it because the animation DOESN'T PLAY so its stop until frees it - but once selected a node things flow like butter."

### The "smooth once selected" diagnostic
This is a useful clue. Why does smoothness return after lock?
- Selection adds a node to `lockedSet`. `lockedSet` non-empty → `wantBoost=true` flag pinned.
- After selection, the user is probably no longer wheel-zooming. The drift-band crossings stop firing. Chrome refresh still runs but the bottleneck is wheel-zoom-during-gesture, not steady-state.

### The actual perf bottleneck (audit `AUDIT/2026-05-24-forge-late-audit.md` §A)
`timeline-chrome.js refresh()` wipes + rebuilds ALL SVG every frame:
- Lines 938–1009: while-loop deletes all band rects + labels, then re-mints `<defs>` + 10 `<linearGradient>` + 10 fill `<rect>` + 10 stroke `<rect>` + 10 left-edge `<text>`. **~50 `createElementNS` + ~150 `setAttribute` per frame.**
- Lines 1054–1163: while-loop deletes all grid + tick + label SVG, then per visible tick (8–40): `<line>` grid + `<line>` tick + `<text>` label. **~800 `setAttribute` per frame at wide zoom.**

At 60 fps during a wheel-zoom gesture → **3000 element creations + 48,000 attribute sets per second.**

This is the architectural issue John flagged. A mass-scale node app should not be doing this.

### Phase 22-AH's partial fix (commit `0800fa8`)
- Widened drift band 0.05 → 0.10 (forge.js:2264). Halves `rebakeNodes` frequency.
- Added `TICK_LABEL_CAP = 120` in chrome refresh tick loop. Caps text labels but not tick marks.

**These help marginally but don't address the wipe-and-rebuild pattern.** That's why it still gags.

### The Phase 22-AI plan I wrote but DIDN'T ship

**Why I deferred it:** "real refactor — 150–200 lines, object pools are bug-prone if you forget to reset state."

**Why John pushed back:** "we are a Mass scale node app? Why is this happening at all? I thought we had this fundamentally strong foundation BUT feels we're VERY OFF!!!"

**He's right.** The pool-based pattern is standard for D3.js / Cytoscape / any graph viz. We have it already in the WebGPU instance-buffer code (Phase 1B M-F1 + Phase 3B R1 — packedAtScale + edgeInstancesDirty). The chrome SVG code is the only subsystem still using wipe-and-rebuild.

### Phase 22-AI proper plan

1. **Bands persistent.** Build the 10 family-band `<rect>` + label `<text>` ONCE in `mount()`. Store refs in `local.bandEls = { famName: { rect, label, grad } }`. On `refresh()` only update positions + opacity. Rebuild only when `mode.bands` keys change (band-density slider drag OR family-order swap).

2. **Tick + grid pool.** Pre-allocate 200 `<line>` + 200 `<text>` elements at mount. Pool API:
   ```js
   const pool = { lines: [], texts: [], lineIdx: 0, textIdx: 0 };
   function acquireLine() { return pool.lines[pool.lineIdx++] || (...createNew()); }
   function resetPool() { pool.lineIdx = 0; pool.textIdx = 0; }
   ```
   On refresh:
   - `resetPool()` at top
   - For each visible tick: `acquireLine()` + update attrs, `acquireText()` + update attrs
   - At end: hide unused elements (set `display: none` from index `pool.lineIdx` onward)

3. **Memoize `band.color` → `<linearGradient>`.** Don't re-mint the gradient stops every frame; only on theme change.

4. **Coalesce camera-change to throttled rAF.** Currently rAF-coalesced but each frame still does full work. Add a "settled" detector — if no camera change in 50ms, do a single quality redraw; during active zoom, do minimal-cost redraw (positions only, no axis-gradient recompute).

### Expected gain
- DOM creates per frame: ~50 → ~0 (only at mode swap)
- DOM creates per minute of active zoom: ~180,000 → ~0
- Main-thread work per zoom-tick: estimated 40–60% reduction
- Hover-card stalls: gone (no longer queued behind chrome rebuild)

---

## 3. What the parallel agents should do

Suggested split:

**Agent 1 — wires regression diagnostic.** Read-only. Trace every code path that touches `setBucketPalette` or `_hoverBoostActive`. Run the hypotheses A–E above to ground. Report: which hypothesis is correct, with file:line evidence.

**Agent 2 — Phase 22-AI design audit.** Read-only. Review the proposed band-persistent + tick-pool design above. Surface any subtleties:
- What about the per-band gradient `<defs>`? Pool or rebuild on theme change?
- The collision-detection loop walks ticks L→R and tracks `lastLabelRight` — does that survive pooling?
- The reserved-slots for pivots (Phase 22-AG) — do they still work?
- Is there a case where pool size N=200 isn't enough (zoomed out, very fine cadence)?

**Agent 3 — broader perf scan.** Read-only. Beyond chrome `refresh()`, is there other waste? Check `drawFrame` (`forge.js:3075–3303`), `syncLabelPositions`, `syncHulls`, `syncBackgroundImage`. Any of those doing wipe-and-rebuild instead of incremental updates? Report ranked by main-thread cost.

---

## 4. Files agents should read

- `~/Desktop/Codex Atlas/AUDIT/2026-05-24-forge-late-audit.md` — prior audit (§A perf, §B wires, §C side panel, §D popup)
- `src/js/views/forge.js` — main view, especially:
  - 4354–4380 — recomputeFocus + my Phase 22-AH boost trigger
  - 8258–8273 — hotPaletteFromParams
  - 8094–8195 — pointer handlers + click → toggleLock
  - 2200–2280 — camera.onChange handler + drift-band rebake
- `src/js/views/timeline-chrome.js` — chrome refresh hot path:
  - 868–1218 — `refresh()` function (wipe-and-rebuild every frame)
  - 938–1009 — band wipe + rebuild
  - 1054–1163 — grid + tick wipe + rebuild
- `src/js/engine/graph/edge.js` — bucket palette upload + edge state buffers
- `src/js/engine/webgpu.js` — fragment shader for edges (alpha math)

---

## 5. What to NOT change

- The dating_basis framework (Phase B-DATING-* in memory)
- The bottombar canonical-class architecture (Phase 22-AB-fix4)
- The two-tier pivot system (Phase 22-AG)
- The vertical density slider primitive (Phase 22-AD)
- Anything in `00_meta/` content files

---

— Filed 2026-05-25 by Phase 22-AH agent for Phase 22-AI parallel work.
