# Forge late audit — 2026-05-24

Read-only investigation of four user-reported issues. Every claim is anchored to a
file:line. No code was modified.

---

## A — Timeline navigation choking on zoom

**Symptom.** Nodes "gag", hover-card stalls during wheel-zoom in timeline mode;
worse with more on-screen nodes; fine when zoomed close on a few nodes.

**Mechanism — what runs per `camera.onChange`.**
1. `forge.js:2232–2271` — the main listener: `applyZoomFloor()` (cheap), then a
   5%/15%/30% drift check (`N < 1000 ⇒ 0.05`) that fires `rebakeNodes()` whenever
   the wheel crosses a band. `rebakeNodes` is the **heavy** path: re-runs
   `packNodes` (instance-buffer write for every node) + `rebakeEdges`
   (`forge.js:8327–8373`), then triggers a fresh `drawFrame` and `recomputeFocus`.
   Steady wheel-zoom hops the band every ~20 ticks at default densities.
2. `drawFrame` (`forge.js:3075–3303`) also unconditionally runs
   `syncLabelPositions` + `syncHulls` + `syncBackgroundImage` per camera tick.
3. **Timeline-chrome `refresh()`** is the new hot path that wheel mode doesn't
   have. Subscribes at `timeline-chrome.js:527–528` to `camera.onChange`; rAF-
   coalesced but fires every frame during a wheel gesture.
   `refresh()` (`timeline-chrome.js:868–1218`) does the following EVERY tick:
   - `while (bandGroupEl.firstChild) removeChild` + `bandLabelGroupEl` wipe
     (lines 938–939), then re-mints `<defs>` + 10 family `<linearGradient>` +
     10 fill `<rect>` + 10 stroke-gradient + 10 left-edge `<text>` labels
     (lines 942–1009). ~50 `createElementNS` + ~150 `setAttribute` per frame.
   - `while (gridGroupEl.firstChild) removeChild` + `while (tickGroupEl.firstChild)`
     (lines 1054–1055). Then per visible tick (typically 8–40): `<line>` grid
     stripe + `<line>` tick mark + `<text>` label, ~20 `setAttribute` each
     (lines 1116–1163). Wedge: ~40 ticks × 20 attrs = ~800 attrs per frame.
   - The pivot tick block (lines 1170–1217) adds 3 more elements.
4. The wheel-mode `camera.onChange` does NOT have any of the chrome cost — only
   `drawFrame` + `syncHulls`. That structural delta is the answer to the user's
   "wheel feels smoother per tick" observation.
5. **Hover card** (`forge.js:6349–6675`): the image URL is read from
   `_assets/thumbs_cache.json` which is force-cached once at view mount
   (line 6357), so the latency is NOT a network fetch. The `<img>` element's
   own decode + paint is what stalls — `showFor` sets `img.src`, then the
   browser does an off-thread decode; when it lands `onload` (line 6617)
   triggers a layout read (`measure()`) + reposition. If a `refresh()` storm
   is monopolizing the main thread (per item 3), the image decode-callback
   sits in the queue behind it. That is the "thumbnail window stalls" symptom.

**Bug location.**
- DOM thrash in `timeline-chrome.js:894–1009` (band wipe-and-rebuild every
  frame) and `timeline-chrome.js:1054–1163` (grid + tick wipe-and-rebuild).
- Compounded by the rebakeNodes-band-cross at `forge.js:2257–2266` firing
  mid-gesture.

**Proposed fix.**
- Make bands + per-tick DOM persistent. Bands change only when `mode.bands`
  changes (rebuild + family-order swap); during pan/zoom only the projected
  rect `x/y/width/height` need rewriting. Lift `bandGroupEl` rebuild out of
  `refresh()` into a separate `rebuildBands()` called from `mount()` and
  `relayout`. Ticks are harder (count changes with zoom), but a pool that
  keeps existing `<line>` + `<text>` and reuses them across frames instead
  of destroying/creating per refresh would eliminate ~95% of the
  `createElementNS` cost.
- For the rebake-band-cross stutter, widen the `N<1000` band from 0.05 to
  0.10 in `forge.js:2257` — at 663 deities the screen-px-clamp difference
  inside 10% is invisible but the rebake count halves.
- **Universal label cap** is implementable: `local.params.label_idle_max`
  (default 750, see `forge.js:2828`) is already the lever. A safe ceiling
  for "any zoom" is **N = 120** (matches `label_cap`); that's the number
  the focused/hovered set already uses comfortably. The collision-prune
  inside `syncLabels` (`forge.js:3539–3546`) needs no change — the cap is
  pre-prune.

---

## B — Wires opacity bug

**Symptom 1.** Active wires never reach alpha = 1.0.

**Mechanism.** The wire alpha pipeline:
1. `forge.js:517–523` — `active_opacity_<bucket>` PARAM_DEFAULTS. Values are
   0.74 (attestation), 0.75 (transmission/kinship/fusion), 0.76 (parallel),
   0.78 (association), 0.90 (polemic). **None is 1.0.**
2. `forge.js:8238–8246` — `hotPaletteFromParams()` reads those defaults and
   builds the bucket-hot RGBA palette uploaded via `setBucketPalette`. The
   `HOVER_BOOST_ALPHA = 1.0` block (lines 8237, 8243) ONLY applies when
   `local.hoverId != null`. Lock-only focus (a node clicked, cursor moved
   away) does NOT trigger boost.
3. `webgpu.js:369–404` — final fragment math:
   `vis_state = clamp(state, 0, 1)`; for HOT (state=1) `dim_mult = 1.0`;
   then `a = color.a × alpha_aa × dim_mult × (1 - hidden)`. Maximum `a` is
   `color.a` = the palette baseA — i.e. **the active_opacity_<bucket>**.
4. Therefore:
   - Hover present → palette swapped to baseA-or-1.0 → alpha hits 1.0.
   - Lock-only (no hover) → palette is baseA → alpha caps at 0.90 (polemic)
     or lower per-bucket.
   - There is no clamp killing 1.0 — the PARAMS themselves are below 1.0.
5. `grad_mult` (`webgpu.js:396`) darkens RGB from source to target end by
   ×0.5; it does NOT touch alpha (deliberately — see Phase 3B D2 comment).
   The user may be reading the dimmer-at-target-end visual as "low alpha",
   but it is RGB attenuation, not alpha.

**Symptom 2.** "Show wires" toggle controls the WRONG wires; jump on select.

**Mechanism.**
- `wireViewSettings()` `forge.js:5351`: toggle flips `body.fv-hide-wires`.
- `forge.js:3208–3209`:
  `const wiresHidden = body.has('fv-hide-wires');`
  `const effectiveDim = wiresHidden ? 1.0 : Math.max(focusDim, wireZoomFade);`
- This forces `dim_amount = 1.0`. In the edge shader (`webgpu.js:376`)
  `dim_mult = mix(1 - dim_amount, 1.0, vis_state)`. With dim=1:
  IDLE edges → `dim_mult = 0` → alpha = 0 (invisible).
  HOT edges  → `dim_mult = 1` (vis_state=1) → unaffected.
- Confirmed semantics: **"Show wires" toggles only IDLE wires.** Active wires
  remain visible regardless.

**The "jump on select" mechanic.**
- With nothing selected: `hasFocus = false` (line 3083) ⇒ `focusDim = 0`. So
  effectiveDim = `max(0, wireZoomFade)`. Idle wires at `(1-wireZoomFade) ×
  baseA`. Toggling wires off forces effectiveDim from `wireZoomFade` (~0)
  to `1.0`: idle wires fade smoothly.
- With something selected: `focusDim = local.params.dim_amount` (~0.85). Idle
  alpha is already attenuated to `0.15 × baseA` ≈ 0.015 (near-invisible).
  Toggling wires "off" pushes to 0.0 — visually a very small jump from
  "almost invisible" to "invisible". The user sees a brightness step
  because dim_amount goes from `max(0.85, wireZoomFade)` to `1.0` — but
  the change is asymmetric: when wireZoomFade is also ~0.85 (deep zoom-out)
  the jump is tiny; at gizmo 100% (wireZoomFade=0) it's `0.15 → 0`.

**Bug location.**
- Wire never hits 1.0 alpha → `forge.js:517–523` (PARAM_DEFAULTS), interacting
  with the hover-only boost gate at `forge.js:8240`.
- "Show wires" toggle controls only IDLE → `forge.js:3208–3209`. This was a
  deliberate Phase 21AI choice (the comment at 3200–3207 names it), but it's
  badly LABELED. The toggle reads as "all wires" to the user.
- The selection-jump → `forge.js:3209` — non-commutative composition of
  `focusDim` and the wiresHidden override.

**Same in wheel mode?** Yes — both Symptom 1 and 2 are in `drawFrame` +
shader, not in chrome. Wheel mode produces the same alpha caps and the same
toggle behavior.

**Proposed fix.**
- Bump `active_opacity_*` defaults to 1.0 (or 0.95) in `forge.js:517–523`, OR
  drop the `boost = (local.hoverId != null)` gate in `forge.js:8240` so the
  palette always uses `max(baseA, 1.0)` whenever ANY focus is active
  (hover OR lock). Per-bucket alpha differentiation can survive via lower
  baseA values that the boost can clamp up.
- Rename the toggle label. Current: "Show wires" → should be "Show idle
  wires" (the literal mechanic) or, better, split into two checkboxes:
  "Idle wires" + "Active wires". A single "Show wires" toggle that also
  killed ACTIVE wires would require gating the bucket palette upload (set
  alpha = 0 when hidden), not the dim_amount path.

---

## C — Side-panel transmission click doesn't highlight deity

**Symptom.** Clicking a Transmission (or any bucket) row in the side panel
used to light the target deity on the wheel/timeline. Now it doesn't.

**Mechanism — click path.**
- Click handler: `forge.js:7261–7308` (event-delegated on `inner`).
- Gate at `forge.js:7302`:
  `if (item.getAttribute('data-in-mode') !== '1') return;`
- For an in-mode target NOT yet locked: `toggleLock(targetId)` at line 7305
  → `forge.js:7867–7893` adds id to `lockedSet`, calls `recomputeFocus()`,
  which derives `focusedSet` via `focusedSetFor(hoverId, lockedSet, adjacency)`
  (`adjacency.js:43–64`) — the target IS added with its 1-hop neighbors.
  Animation loop kicks via `startAnimLoop`. **This path is intact and
  should highlight.**
- For an in-mode target ALREADY in lockedSet: lines 7306–7310 set
  `openTabId = targetId; render(); renderTabs();` — NO `recomputeFocus`,
  NO visual change (because lockedSet didn't change). The user clicking
  an already-locked row gets a silent panel-switch only.

**The actual regression — Phase 21AV (commit b7c79a1, 2026-05-23).**
- Before 21AV the side panel iterated `local.mode.edges` (deity-only edges).
  Every visible row had `inMode=true` and was clickable.
- After 21AV (`forge.js:6909–6953`) the panel iterates the FULL
  `window.VAULT_DATA.edges`. Many edges target themes / events / persons /
  traditions / symbols — all cross-folder ids that are NOT in the active
  mode's `nodesById`. Those rows get `inMode=false` (line 6939) and the
  click handler at 7302 EARLY-RETURNS.
- Result: a huge fraction of rows now look identical but do nothing on
  click. The "Click to lock + inspect" hint at line 7385 is conditional on
  `inMode`, so non-clickable rows show "Not on the deity wheel — view-only"
  IN THE TOOLTIP, but the row chrome (button class, dot, tier pill) makes
  them look just as clickable as the working ones. Visual evidence: the
  `is-cross-folder` class at line 7092 is added but the CSS treatment is
  subtle; users with mostly cross-folder neighbors perceive the click as
  broken.

**Bug location.**
- `forge.js:7302` early-return + `forge.js:7086–7095` per-row class +
  data-attr writes.
- Combined with `forge.js:7304` — already-locked targets don't re-highlight
  on click (different sub-bug; lower confidence whether this is what John
  hit).

**Proposed fix.**
- For Transmission specifically, the source-tradition / target-deity case is
  the prize. The cross-folder targets that aren't on the wheel can still
  be highlighted by FIRST switching the mode (e.g., to themes / persons)
  then locking. A minimum fix: for `inMode=false` rows, instead of
  returning, navigate to that node's natural view (or pop a toast "this
  target lives in the <subtype> folder — switch mode to see it"). At
  minimum, restyle non-clickable rows so they read as disabled (greyed,
  no cursor:pointer).
- For the already-locked case: drop the `if (!lockedSet.has)` guard at
  7304 — `toggleLock` is a no-op when the id is already there, but calling
  it once to refresh selection isn't enough. Better: on every in-mode
  click, also force `recomputeFocus()` (cheap idempotent if state hasn't
  changed; redundant but visible).

---

## D — Stuck top-left popup

**Symptom.** Side-panel hover tooltip stays visible (top-left of viewport),
no dismiss path.

**Component.** `forge-side-tip` — `forge.js:7324–7331` (element creation,
appended to `document.body`). HTML template at `forge.js:7341–7387`
(`buildTipHtml`). CSS at `app.css:7491–7610`. Element is `position: fixed`,
`pointer-events: none`, z-index 280.

The screenshot's content layout — `← Ra (Re)` + tier pill + `TYPE Ancestor of`
+ `SOURCE Akhenaten's Aten...` + `CLICK TO LOCK + INSPECT` — is the exact
output of `buildTipHtml`. Match is conclusive.

**Dismiss path (intended).** `forge.js:7423–7455`:
- `mouseout` from a `.forge-side-panel-wire-item` row → 80 ms timer → `hideTip()`.
- `inner.scroll` (capture) → `hideTip()` immediately.
- `inner.click` (capture) → `hideTip()` immediately.

**The bug — why it sticks.**
1. **The DOMINANT cause: row removed via innerHTML reassignment.**
   The side panel re-renders by `inner.innerHTML = '<div ...>'` (e.g.,
   `forge.js:7209`, `forge.js:6856`). Re-render triggers in many flows:
   tier-filter changes (line 5450–5451), political-risk toggle (6226–6227),
   tab switch (line 7305 → `render()`), thumbnail carousel click (7290),
   bucket-section disclosure (`<details>` open/close re-render). When
   `innerHTML` replaces the element under the cursor, **browsers do NOT
   fire `mouseout`** for the detached node. Result: `tipShowTimer` /
   `tipHideTimer` never trip; the tip persists.
2. **`tipCurrentRow` becomes a dangling reference.** `forge.js:7411` stores
   the row element. After re-render, the row is detached but `tipCurrentRow`
   still holds it. The mouseover handler (line 7430) checks
   `row === tipCurrentRow` to skip re-showing; if the next hovered row is
   different, mouseover fires `setTimeout(showTipFor, 500)` — but a new
   tip showing doesn't HIDE the old; `showTipFor` overwrites `innerHTML`
   on the SAME `tipEl` (line 7412), so the visible tip is replaced by the
   new one. However, if the user moves the cursor OUTSIDE the panel before
   500 ms, the old tip lingers. The `mouseout` exiting the panel would
   only fire if the cursor leaves the original (now-removed) row — which
   already happened invisibly.
3. **The top-left position.** `positionTip` reads `row.getBoundingClientRect()`
   at line 7390. For a row detached from DOM, `rRow` has zeros (left=0,
   top=0, width=0, height=0). `left = rRow.left - rTip.width - margin` =
   negative → clamped at `margin` (line 7406). `top = rRow.top = 0` →
   clamped at `margin = 10`. **That is exactly the top-left position
   the screenshot shows.** This confirms scenario 1: the row was removed,
   then a re-position call ran with the detached row's zeros.

**Bug location.**
- `forge.js:7411` — `tipCurrentRow` is not cleared on side-panel re-render.
- `forge.js:7438–7449` — mouseout listener can't catch the
  innerHTML-removal case.
- `forge.js:7388–7409` — `positionTip` doesn't validate `row.isConnected`
  before reading rect; reads zeros for detached rows.

**Proposed fix.**
- Inside `wireSidePanel`'s `render()` (`forge.js:6815-ish` to `7245`),
  call `hideTip()` at the top of every re-render — symmetric with the
  `inner.click` hide listener. The render path knows it's about to wipe
  rows; the tip must die with them.
- Defensive: in `positionTip`, early-return + `hideTip()` if
  `!row.isConnected || rRow.width === 0`. Stops the stuck-at-(10, 10)
  artifact even if a future code path forgets to call `hideTip` first.
- Also hide on the document-level `pointerleave` of `panelEl` (one extra
  listener) so cursor leaving the side panel always clears the tip.

---

## Summary table

| Issue | File:line | Mechanism in one phrase |
|-------|-----------|-------------------------|
| A | `timeline-chrome.js:894–1009`, `1054–1163` | Bands + ticks DOM wiped + rebuilt every camera tick. |
| A | `forge.js:2257–2266` | rebakeNodes fires mid-gesture on 5% drift crossings at N<1000. |
| B (alpha) | `forge.js:517–523`, `forge.js:8240` | active_opacity defaults are <1.0; the 1.0 boost is hover-only. |
| B (toggle) | `forge.js:3208–3209` | "Show wires" forces dim_amount=1.0; affects IDLE only by design. |
| C | `forge.js:7302`, `6939` | Cross-folder rows after Phase 21AV gate the click to no-op. |
| D | `forge.js:7411`, `7388–7409` | Tip not cleared when side-panel re-renders; positionTip reads zero-rect from detached row → (10, 10). |
