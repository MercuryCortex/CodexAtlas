# Forge Rebuild — Phase 5A — MANAGEMENT micro-audit

**Filed:** 2026-05-20
**Filed by:** Lane-B audit goblin (read-only, MANAGEMENT scope)
**Reads-with:**
- `AUDIT/forge-rebuild-layered-spec-2026-05-20.md` §2 Phase 5 — contract
- `AUDIT/forge-robustness-lock-plan-2026-05-20.md` §3 routing of T2/T3 items into Phase 5
- `AUDIT/forge-robustness-03-lifecycle-invariants-2026-05-20.md` F4/F5/F6/F7/F12/F13
- `AUDIT/forge-robustness-01-scale-2026-05-20.md` F7/F8 (rebake debounce, search index)
- `AUDIT/forge-robustness-02-state-ownership-2026-05-20.md` F10 / SSOT-5 (persistence)
- Phase 1B/2B/3B/4B spec-lock headers already in `src/js/views/forge.js:69–343`

**Scope:** the orchestration layer that holds NODE / BEHAVIORS / WIRES / FX together — `camera.js`, the `rebuildForMode` prologue / `resizeAndFit` / scrubber-bounds / search / mode-dropdown / persistence / side-nav / Forge mount path in `app.js`.

**Out of scope (already LOCKED):** node atom (P1), hover/click/state/fade/rAF cancellation in BEHAVIORS (P2), edges & bucket palette (P3), glyphs/atlas/labels/glow (P4). Findings cite the locked phase where applicable.

---

## §1. TL;DR

1. **MANAGEMENT is the broadest and least-locked surface.** Camera + resize already have the pack-scale-invariant and the deliberate "no auto-refit on resize" rule baked in (forge.js:1521–1535). What's missing is: scrubber-bounds refresh on mode-switch (F5), the F4 camera-fitToExtent → onChange-rebakeNodes-on-old-mode wasted-work race, runtime persistence (mode + timeline + lockedSet), an N-aware drift threshold, and a cheap search index.
2. **No 🔴 critical findings** — the foundation underneath (Phases 1–4) closed every load-bearing invariant. Phase 5B is a "lock the orchestration spec + ship the residual fixes" pass, not a foundation-rebuild.
3. **Phase 5B IS safe to cast on safe defaults** (see §5). The five open questions are tuning + scope-shape decisions, not blockers. Q1 (persistence shape) is the only one with semantic consequences; Q2/Q3 can defer to Phase 6, Q4/Q5 wave on with the recommended defaults.

---

## §2. Locked MANAGEMENT spec table

Every dimension Phase 5B intends to lock. Same shape as the NODE / BEHAVIORS / WIRES / FX spec tables already in forge.js.

| # | Dimension | Locked spec | Where (file:line) | Doc'd inline today? | Status |
|---|---|---|---|---|---|
| M1 | **Camera pan API** | `panByScreen(dxPx,dyPx)` — CSS-px delta, divides by `state.scale`, clamps to `bounds`, emits. Sub-pixel deltas suppressed via `PAN_KICK_THRESHOLD`. | `camera.js:146-152, 225-233` | ✅ in `camera.js` header | LOCKED today; reaffirm in MANAGEMENT spec block |
| M2 | **Camera zoom API** | `zoomAt(factor, ax, ay, vp)` synchronous + `nudgeZoomTarget(...)` queued ease. Compound against `zoomAnim.targetScale` if in-flight (so rapid wheel accumulates). Clamped to `[MIN_SCALE=0.05, MAX_SCALE=30]`. | `camera.js:163-178, 235-260, 333-353` | ✅ in `camera.js` header | LOCKED today |
| M3 | **`fitToExtent(extent, vp, pad)` semantics** | Teleport (cancels pan/zoom/flyTo anims), aspect-correct letterbox (min of sx/sy), clamps to MIN/MAX_SCALE, emits. No silent flag today. | `camera.js:182-201` | partial | **Phase 5B will document, and address F4 via P3(a) inline `local.packedAtScale =` write at the call site** — see §3 finding M-F1. |
| M4 | **`setPanBounds(x0,y0,x1,y1)` semantics** | View-layer-set; null clears. Clamps center on set. Pan + flyTo tick clamp on every emit. | `camera.js:154-161, 354-364` | ✅ | LOCKED today |
| M5 | **Pan-bounds margin policy** | Half-viewport beyond each edge: `margin = max(extX, extY) × 0.5`. Generous enough that outermost nodes can be brought to center. | `forge.js:1262-1274` | partial | LOCKED today; document in MANAGEMENT block |
| M6 | **`fitToExtent` callers** | Two sites: (a) `resizeAndFit(initial=true)` (mount path), (b) `rebuildForMode` (mode-switch) and `gizmoEl click` (zoom gizmo). NO other callers — pan/wheel never refit. | `forge.js:1121, 1170-1176, 1260, 1259-1261` | partial | LOCKED today |
| M7 | **`resizeAndFit` initial branch** | `rect = stage.getBoundingClientRect()` → clamp w/h with `Math.max(1, floor(...))` → renderer.resize() if changed → `camera.fitToExtent(worldExtent, vp, 0)`. | `forge.js:1509-1523` | partial | **Phase 5B fix: bail when `rect.w < 8 ‖ rect.h < 8`** (audit-03 F13). |
| M8 | **`resizeAndFit` non-initial branch** | DOES NOT refit camera (preserves user zoom/pan). DOES rebake nodes+edges + recomputeFocus (radii depend on scale). Trailing `drawFrame()` either way. | `forge.js:1524-1573` | ✅ (long comment) | LOCKED today; Phase 5B documents in MANAGEMENT block |
| M9 | **`camera.onChange` listener semantics** | (a) Set `glyphInstancesDirty = true` (Phase 4B FX1) so cull recomputes. (b) Compare `camScale / packedAtScale` with `5%` band → if outside, `rebakeNodes()` + return (chain ends in drawFrame via rebakeEdges). (c) Else `drawFrame() + scheduleIdleLabelSync + updateZoomGizmo`. | `forge.js:1140-1164` | partial | **Phase 5B: lock + (RECOMMENDED) make the 5% band N-aware** (audit-01 F7 / lock-plan T3.4). See §3 finding M-F4. |
| M10 | **`rebuildForMode` orchestration order** | (1) `cancelHoverCoalesce()` (LOCKED P2B). (2) `filterNodesByMode → layout → degree`. (3) `camera.stopAnim()` + `fitToExtent(ext, vp)` — BEFORE pack. (4) `setPanBounds(...)`. (5) `packNodes(...)`. (6) `local.packedAtScale = camera.state.scale` (LOCKED P1B N4). (7) build hitNodes + hitGrid. (8) WHOLESALE-REPLACE state buffers (LOCKED P2B B5 exception). (9) reset hoverId/lockedSet/focusedSet. (10) label DOM pre-create. (11) `rebuildGlyphInstanceBuffer + drawFrame`. | `forge.js:1225-1482` | ✅ in BEHAVIORS header lines 159–171 | **Phase 5B adds step (3b): `refreshScrubberBounds()` between fitToExtent and packNodes.** See §3 finding M-F3. |
| M11 | **Scrubber bounds derivation** | `deriveBounds()` scans current `local.mode.nodes` for normalized `date_earliest/_latest` (+ raw YAML fallbacks). Clamps to `[-15000, 3000]`, rounds outward to nearest century. Returns `[lo, hi]` or null. | `forge.js:2454-2493` | partial | LOCKED today |
| M12 | **Scrubber mode-switch refresh** | NOT WIRED — wireTimelineScrubber runs ONCE at boot, lo/hi frozen at first mode's date span. Filter math still works (per-node date check inside `recomputeFocus`); UI is misleading. | `forge.js:1209, 2435` | inline TODO via audit-03 F5 only | **Phase 5B REQUIRED: split into `wireTimelineScrubber` (DOM/handlers, once) + `refreshScrubberBounds()` (re-derive lo/hi + repaint, called from `rebuildForMode`).** Preserve user's IN/OUT/CENTER iff still inside new lo/hi; else clamp. See §3 finding M-F3. |
| M13 | **Scrubber drag rAF coalesce** | LOCKED P2B B4 — `local.scrubRafId` + `local.scrubPendingChange`; `refreshUI` synchronous (UI feedback), `recomputeFocus` deferred to rAF. Cancelled in destroy() via `cancelScrubCoalesce()` (P2B B1). | `forge.js:2585-2595, 2378-2384` | ✅ inline | LOCKED P2B — reaffirm in MANAGEMENT block |
| M14 | **Search index strategy** | `findBestMatch` is O(N × haystacks-per-node), exact > prefix > contains, deg-tiebreak. Walks `local.mode.nodes` every call. No precomputed index. | `forge.js:2391-2420` | no | **Phase 5B RECOMMENDED: precompute a flat lowercase haystack array at `rebuildForMode` end (`local.searchIndex = [{id, deg, lcStrings: [...]}]`); `findBestMatch` walks it instead.** Cheap O(N) build, O(N) lookup but constant per-entry. Audit-01 F8 / lock-plan T3.5. Safe-default: keep eager build (negligible at 10k). See §3 finding M-F5. |
| M15 | **Search submit** | Enter key → `handleSearch(value)`. lockedSet replaced with single hit; `recomputeFocus` synchronous; `flyToFocusedSet()`. Escape clears + blurs. NO live-typing (deliberate — avoids camera lurching). | `forge.js:1191-1205, 2613-2626` | partial | LOCKED today; document in MANAGEMENT block |
| M16 | **Fly-to camera ease** | `flyToFocusedSet` derives bbox of `focusedSet` from `hitNodes` (post-pack world coords + radii), pads 60 world-units, `camera.flyTo({centerX, centerY, scale}, 0.55)`. Ease = `1 - (1-t)^3` (cubic) over 0.55s — see `camera.js:304-313`. | `forge.js:2631-2660`, `camera.js:278-313` | partial | LOCKED today; document in MANAGEMENT block |
| M17 | **Mode dropdown wiring** | `#forge-status-mode` `<select>` populated once from `modemod.MODES`. `change` event → `rebuildForMode(ev.target.value)`. NO LS persistence. | `forge.js:535-538, 548, 1180-1188` | partial | **Phase 5B REQUIRED: hydrate from LS at boot + persist on every change.** See §3 finding M-F2. |
| M18 | **Forge mount path** | `setView('forge')` in `app.js:563-569` tears down prior `.forge-pane._engine.destroy()`, removes pane. `VIEWS.forge.render()` in `app.js:820-832` creates `.forge-pane`, hides `#svg`, calls `window._forge.render(pane)`. | `app.js:563-569, 820-832` | partial | LOCKED today |
| M19 | **Forge resize handler** | Global `window.addEventListener('resize', …)` with 200ms debounce → calls `setView(STATE.view)` for all views EXCEPT Forge, which is short-circuited because Forge owns its own ResizeObserver. | `app.js:10267-10279` | ✅ multi-line comment | LOCKED today; document in MANAGEMENT block |
| M20 | **LS persistence key** | NOT WIRED. Proposal: `codex-atlas/forge-runtime-v1` = `{ mode, timeline: { in, out, center }, lockedSet: [...ids] }`. Hydrated at mount priority order: LS → defaults. Saved on every: mode-switch, scrubber pointerup, lock toggle. | nothing today | no | **Phase 5B REQUIRED.** See §3 finding M-F2 + §5 Q1 for shape decision. |
| M21 | **Hash-router (deep-link)** | NOT WIRED for intra-Forge state. `app.js:575-587` already pushState's `?view=forge` on view-change but DELETES `mode/focus/families/locked` query params. Forge does not read `?mode=...` or `?focus=...` on mount. | `app.js:570-587` | partial | **Phase 5B OPTIONAL** — fold in iff time allows, else defer to Phase 6. See §5 Q2. |
| M22 | **Side-nav Forge marker** | Today: `data-view="forge"` + `forge-nav` class on the side-nav item; gold sym + `p6d4` badge after the label via CSS pseudo. Hidden in collapsed nav. Other tabs NOT collapsed/grouped. | `index.html:28`, `app.css:5545-5562` | partial | **Phase 5B per John (layered-spec §0):** rename badge → active-focus marker, collapse other side-nav items behind a disclosure (or rename Forge prominently). See §3 finding M-F6 + §5 Q3. |
| M23 | **rAF id ownership map** | 4 rAF ids on `local`: `animRafId`, `hoverRafId`, `idleLabelRaf`, `scrubRafId`. All cancelled in destroy() + the relevant cancel-helpers. (LOCKED P2B B1.) | `forge.js:715-721, 761-767, 2362-2384` | ✅ in BEHAVIORS header | LOCKED P2B |
| M24 | **`local.params` lifecycle** | Seeded once from `PARAM_DEFAULTS` at mount; no live-mutation route (dev panel removed P0). CSS vars set once at end of `render()`. | `forge.js:745, 3056-3061`, `PARAM_DEFAULTS` 368-480 | ✅ | LOCKED P0+P1B |
| M25 | **Renderer destroy enumeration** | LOCKED P1B N3 via `owned[]` list. View-side `_engine.destroy` cancels all rAF ids, disconnects resizeObs, destroys renderer, stops camera anim. | `forge.js:750-778` | ✅ | LOCKED P1B+P2B |

**Net new locks Phase 5B will add** to the table (i.e. items NOT already enforced today): M3 (silent-fit or explicit packedAtScale write at the fit site), M7 (zero-size bail), M9 (N-aware drift), M10 (the new step 3b), M12 (scrubber refreshBounds), M14 (search index — RECOMMENDED), M17 (mode LS), M20 (LS key shape), M21 (hash-router — OPTIONAL), M22 (side-nav).

---

## §3. Findings — severity-ranked

### 🔴 CRITICAL

_None._ The foundation under Phases 1–4 closed every load-bearing invariant. MANAGEMENT-level findings below are all 🟡 or 🟢.

### 🟡 IMPORTANT

#### M-F1. `camera.fitToExtent` from `rebuildForMode` fires `onChange`'s 5%-drift `rebakeNodes` on the OLD mode

**Where:** `forge.js:1140-1164` (the listener), `forge.js:1258-1261` (the fit call inside `rebuildForMode`).

**Mechanism:** `fitToExtent` emits → listener computes `ratio = camScale / packedAtScale` against the OLD mode's `packedAtScale` → if drift > 5%, calls `rebakeNodes()` which packs `local.mode.*` — but `local.mode` STILL points at the previous mode (the new `local.mode = {...}` assignment is later, at line 1321). Result: a wasted pack of the OLD mode at the NEW scale, immediately discarded.

**Severity:** 🟡 wasted work today, becomes a stale-radius bug the moment anyone optimises the listener to skip on `packedAtScale === scale`.

**Phase 5B fix (REQUIRED):** P3(a) from audit-03 §5 — at the top of `rebuildForMode`, IMMEDIATELY after `camera.fitToExtent(ext, local.lastSize, 0)` (line 1260), write `local.packedAtScale = camera.state.scale;` so the listener-emit sees ratio === 1. Subsequent `packNodes` is at the same scale, and the line 1281 write becomes belt-and-braces (and stays).

**Optional alternative:** add a `silent: true` flag to `camera.fitToExtent` and use it from `rebuildForMode`. Cleaner shape long-term; one extra arg. NOT required for Phase 5B.

#### M-F2. Mode + timeline + lockedSet do not survive remount

**Where:** `forge.js:382-383` (default mode), `forge.js:1209` (scrubber wired but `local.timeline` recomputed every mount), `forge.js:1383` (lockedSet reset on every `rebuildForMode`).

**Mechanism:** identical drift category to params before Phase 0's PARAM_DEFAULTS SSOT. User scrubs timeline to [500 BCE, 500 CE], switches to Pantheon, switches back to Forge → full range. Switches Mode dropdown to Documents → reload → back on Deities.

**Severity:** 🟡 discoverable workflow loss, no functional bug.

**Phase 5B fix (REQUIRED):** SSOT-5 (audit-02). Single LS key `codex-atlas/forge-runtime-v1` = `{ mode, timeline: { in, out, center }, lockedSet: [...ids] }`. Hydrate at mount (priority: LS → defaults). Save on: mode-change (line 1186), scrubber pointerup (`forge.js:2597-2601` add a save), lock toggle (line 2666 add a save).

**Open question** (see §5 Q1): does `lockedSet` belong in the LS key, or only `mode + timeline`? Safe default: all three.

#### M-F3. `wireTimelineScrubber` is bootstrap-only; lo/hi frozen at first mode

**Where:** `forge.js:1209` (one-shot wire), `forge.js:2435-2493` (`wireTimelineScrubber` + `deriveBounds`).

**Mechanism:** `deriveBounds` runs once at boot against the first mode's date range. Mode-switch to a wildly different date span (deities → documents) leaves the slider's lo/hi frozen. Filter math is still correct (`recomputeFocus` reads `local.timeline.{inDate,outDate}` and per-node dates), but the IN/OUT box readouts + thumb positions are misleading.

**Severity:** 🟡 UI integrity bug — user sees the wrong year boundaries.

**Phase 5B fix (REQUIRED):** P4 from audit-03 §5. Split `wireTimelineScrubber` into:
- `wireTimelineScrubber()` — DOM + event handlers, called ONCE at boot (current line 1209).
- `refreshScrubberBounds()` — re-derive lo/hi via `deriveBounds()`, update `local.timeline = {lo, hi, inDate: clamp(old.inDate, lo, hi) | lo, outDate: clamp(old.outDate, lo, hi) | hi, centerDate: clamp(old.centerDate, ...) | midpoint}`, update thumb positions + box readouts. Called from `rebuildForMode` step (3b) per M10.

**Preserve-or-clamp policy:** keep user's IN/OUT/CENTER iff they're inside the new lo/hi; otherwise clamp to the closest valid bound. Loses no information, never produces an empty range.

#### M-F4. `camera.onChange` 5% drift threshold is N-independent → stutter at 10k+

**Where:** `forge.js:1153-1159`.

**Mechanism:** at 10k N / 30k E, `rebakeNodes → rebakeEdges` together is ~10–20 ms. Zoom through 2–3 drift crossings back-to-back (rapid wheel scroll) = three rebakes in ~50 ms = visible stutter. Audit-01 F7 / lock-plan T3.4.

**Severity:** 🟡 at deities-scale this is invisible; at 10k+ it's the dominant zoom-stutter source.

**Phase 5B fix (RECOMMENDED, not REQUIRED):** two options:
- **(a)** N-aware threshold: `const driftBand = N < 1000 ? 0.05 : N < 10000 ? 0.15 : 0.30;` (5%/15%/30%). Sacrifices a little clamp accuracy for huge wall-time savings.
- **(b)** rAF-debounce the rebake chain so successive crossings inside one frame coalesce.

Recommendation: (a) — one constant change, no new rAF id, fits the existing pattern. See §5 Q4 for "tune now or defer to Phase 6".

#### M-F5. Search is O(N × haystacks) — fine at 663, slow at 50k

**Where:** `forge.js:2391-2420`.

**Mechanism:** every keystroke (or Enter) walks `local.mode.nodes` and builds a fresh haystack `[title, id, ...aka]` per node. At 50k with avg 2 aka entries that's 200k string-comparisons per submit, plus the `local.mode.adjacency.get(n.id).size` lookup per node.

**Severity:** 🟡 at 10k it's ~20–30 ms (acceptable for an Enter-press); at 50k it's ~150–300 ms (noticeable).

**Phase 5B fix (RECOMMENDED):** precompute a `local.searchIndex` array at the end of `rebuildForMode`:
```
local.searchIndex = nodePack.idIndex.map((id, i) => {
  const n = nodesById.get(id);
  const haystacks = [String(n?.title || '').toLowerCase(), String(id).toLowerCase()];
  for (const a of (n?.aka || [])) haystacks.push(String(a).toLowerCase());
  return { id, deg: adj.get(id)?.size ?? 0, haystacks };
});
```
`findBestMatch` walks `local.searchIndex` instead. Same algorithm, ~5× faster (no per-call lowercase, no adjacency map-get).

Defer to Phase 6 polish iff Phase 5B is tight on time. See §5 Q5.

#### M-F6. Side-nav has a `p6d4` badge but no "Forge-is-the-focus" marker; other tabs not demoted

**Where:** `index.html:28` (`<div class="item forge-nav" data-view="forge">`), `app.css:5545-5562`.

**Mechanism:** John's layered-spec §0 directs: "mark Forge as the active focus + collapse the other side-nav tabs." Today the `forge-nav` rule paints the symbol gold + appends a `p6d4` build-stamp badge — which signals UNDER CONSTRUCTION, not "primary entry point". The other 25+ side-nav items render exactly as before.

**Severity:** 🟡 UX-shape decision, blocks the Phase 5 acceptance bar "Side-nav reflects Forge-is-the-focus workflow" (lock-plan §7).

**Phase 5B fix (REQUIRED — but needs §5 Q3 decision on shape):** three viable shapes —
- **(a) Disclosure group:** wrap the non-Forge items in a `<details>` collapsed by default with a "More views" summary. Forge becomes the only visible item by default; user can expand to reach the legacy views.
- **(b) Hidden entirely:** delete (or `display:none`) non-Forge items. Cleanest. Burns the bridge to other views (they're still reachable via `setView('xxx')` from the console, per the `_legacyPantheon` precedent at `app.js:836`).
- **(c) Banner / rename:** keep all items, rename "Forge" to something more prominent + add an active-focus pill instead of the construction badge. Lightest touch.

Recommendation: **(a) disclosure group** — preserves the views (other Lane B work can still reach them) but immediately signals that Forge is the dominant entry.

### 🟢 POLISH

#### M-F7. `resizeAndFit` falls back to `1×1` viewport when stage is zero-size

**Where:** `forge.js:1511-1513`.

**Mechanism:** `rect = stage.getBoundingClientRect()`. If `rect.width === 0` (the view is `display:none` at mount, or detached, or the route fires very early), `Math.max(1, floor(0)) = 1`. Camera fits to 1×1 viewport → tiny world → garbage state. Recovers on the next real resize.

**Severity:** 🟢 latent — not currently reproducible because `setView('forge')` makes the pane visible before render. But the moment a user installs a route guard that mounts Forge in a hidden tab, this fires.

**Phase 5B fix (RECOMMENDED):** P9 from audit-03 §5. Early-return: `if (w < 8 || h < 8) return;`. One line. Cleanest spot is right after the `w = Math.max(1, ...)` line — but instead of clamping to 1, bail.

#### M-F8. `attachInteractions` replaces `local.resizeObs` mid-mount

**Where:** `forge.js:2800-2814`.

**Mechanism:** `bootstrap()` creates resizeObs at line 1128, observes stage at 1132. Later, `attachInteractions()` disconnects the original and attaches a new wrapped one. Two observers exist for one rAF tick. Cosmetic; sizeChanged check in `resizeAndFit` makes any double-fire a no-op.

**Severity:** 🟢 hygiene.

**Phase 5B fix (OPTIONAL):** P10 from audit-03 §5. Hoist the wrapped observer into bootstrap from the start; don't disconnect/replace.

#### M-F9. Wheel handler does synchronous `hitTestAt + setHoverId` per wheel event

**Where:** `forge.js:2784-2797`.

**Mechanism:** every wheel tick calls `hitTestAt(cssX, cssY)` (now O(1) via the P1B N1 spatial grid) → `setHoverId(hit)` (now rAF-coalesced via P2B). Net cost at 60 Hz wheel is negligible at 10k post-P1B, but the hit-test mid-zoom-ease is misleading anyway (the cursor's world position is moving continuously).

**Severity:** 🟢 deferred to Phase 6 polish (lock-plan T3.8).

**Phase 5B action:** none required. Document as Phase 6 polish item.

#### M-F10. `local._forgeDebug` reassigned on every render without cleanup

**Where:** `forge.js:783-...` (the `window._forgeDebug = {...}` site).

**Mechanism:** console-stored refs to the old `_forgeDebug` become stale on view-switch — their closures reference the destroyed renderer + closure-local `local`.

**Severity:** 🟢 dev-tooling hygiene only.

**Phase 5B action:** none required. Lock-plan T3.11 — Phase 6 polish.

### Cross-layer flags (deferred; not Phase 5B's scope)

- **glyph atlas resolve × first resize race** (audit-03 F7) — Phase 4 already mitigated by `glyphAtlas !== null` guard; the remaining ordering issue is renderer-lifecycle, lock-plan T3.16 territory. Phase 6 polish.
- **`recomputeFocus` per-call typed-array allocations** (audit-03 F14 / lock-plan T3.13) — BEHAVIORS-scope, deferred from Phase 2B to Phase 6 polish per audit-2A §5.
- **CSR adjacency representation** (lock-plan T3.7) — Phase 6 polish, content-graph layer, not MANAGEMENT.

---

## §4. Phase 5B implementation checklist

### REQUIRED — Phase 5B must ship these

- [ ] **M-F1 packedAtScale write at fit site.** In `rebuildForMode`, immediately after `camera.fitToExtent(ext, local.lastSize, 0)` (line 1260), add `local.packedAtScale = camera.state.scale;`. One line. Closes audit-03 F4 / lock-plan T2.11.
- [ ] **M-F3 scrubber refreshBounds split.** Split `wireTimelineScrubber` into the boot-time DOM/handler attach + the per-mode `refreshScrubberBounds()`; call latter from `rebuildForMode` step (3b) [between `setPanBounds` and `packNodes`, or after the `local.mode = {...}` swap — see Q1 / safe default below]. Preserve-or-clamp policy for in/out/center. Closes audit-03 F5 / lock-plan T2.12.
- [ ] **M-F2 + M-F2-prime LS persistence (mode + timeline; optionally lockedSet).** Hydrate at mount priority LS → defaults. Save on mode-change, scrubber pointerup, lock toggle. SSOT-5 key shape `codex-atlas/forge-runtime-v1`. Closes audit-02 F10 / lock-plan T2.16.
- [ ] **M-F7 resizeAndFit zero-size bail.** `if (w < 8 || h < 8) return;` at top of `resizeAndFit`. Closes audit-03 F13 / lock-plan T2.14.
- [ ] **M-F6 side-nav marker + demote-other-tabs.** Shape per Q3 (recommended: disclosure group). Active-focus pill replacing the construction badge.
- [ ] **MANAGEMENT spec-lock header block.** Append a new section (mirrors NODE / BEHAVIORS / WIRES / FX style) at top of `forge.js` after line 343 documenting: M3 + M7/M8 + M9 + M10 (the post-Phase-5B order) + M11/M12 + M14 + M16 + M17 + M20 + M22. Plus inline invariant comment at the LS hydrate site + at each save site. Plus P11 ORDER block from audit-03 §5 (the 7-point lifecycle invariant list — partially already in BEHAVIORS header, finalize here).

### RECOMMENDED — Phase 5B should ship if scope allows

- [ ] **M-F4 N-aware drift threshold.** Replace the literal `0.95 / 1.05` band with `const driftLo, driftHi` derived from `N`. Defer iff §5 Q4 says "tune later".
- [ ] **M-F5 eager search index at rebuildForMode.** Precompute `local.searchIndex`; switch `findBestMatch` to walk it. Defer iff §5 Q5 says "lazy".

### OPTIONAL — Phase 5B may ship; else defer to Phase 6

- [ ] **M21 hash-router round-trip.** `?view=forge&mode=deities&focus=zeus` — read on mount, write on mode-change + lock-set-change. Per §5 Q2: recommend defer to Phase 6 unless John actively uses deep links.
- [ ] **M-F8 hoist wrapped ResizeObserver.** Audit-03 P10. Optional hygiene.
- [ ] **M3 silent-fit flag on `camera.fitToExtent`.** Cleaner long-term shape than the packedAtScale-write workaround (which Phase 5B is REQUIRED to ship regardless). Defer to Phase 6 unless John wants the camera API cleaned now.

---

## §5. Open questions for John — with safe-default recommendations

### Q1. LS persistence key shape — what survives across reloads?

**Recommendation (safe default for cast):** `codex-atlas/forge-runtime-v1` = `{ mode, timeline: { in, out, center }, lockedSet: [...ids] }` — all three. Per audit-02 SSOT-5.

**Tradeoffs:**
- **A.** All three (mode + timeline + lockedSet). Maximum continuity. Tiny risk: a `lockedSet` member id might not exist in a future vault state, causing a "ghost lock" on hydrate (silently ignored by `recomputeFocus` when the id isn't in adjacency).
- **B.** Mode + timeline only (no lockedSet). Locks reset on remount/reload — consistent with the existing "rebuildForMode clears lockedSet" cross-mode behavior, but loses the "I locked Zeus, switched to Pantheon, came back" continuity.
- **C.** Mode only. Minimum surface. Loses timeline continuity.

**Phase 5B BLOCKER?** Soft. Safe default (A) is fine to ship; if John picks B/C later, drop the relevant key+save calls.

### Q2. Hash-router round-trip — Phase 5B or defer to Phase 6?

**Recommendation:** **Defer to Phase 6.** `app.js:575-587` already pushes `?view=forge` on view-change; adding `?mode=...&focus=...` requires intra-Forge query parsing on mount + a save hook on every state change. Phase 5B's LS persistence already covers the "reload preserves state" goal; deep links are a separate "share a URL" feature that John has not asked for yet.

**Phase 5B BLOCKER?** No.

### Q3. Side-nav shape — disclosure group / hide entirely / rename + marker?

**Recommendation (safe default for cast):** **(a) disclosure group** — wrap non-Forge items in `<details>` with "More views" summary. Forge stays prominent + the construction badge becomes an active-focus pill. Other views still reachable, just demoted.

**Tradeoffs:**
- **A.** Disclosure group. Reversible. Other lane work still reaches views.
- **B.** Hide entirely. Cleanest. Other views only reachable via console / hash.
- **C.** Rename + marker only, keep all items visible. Lightest; doesn't really demote.

**Phase 5B BLOCKER?** Soft. Safe default (A) is castable; John can pick B/C later by toggling CSS.

### Q4. M-F4 N-aware drift threshold — tune now or defer?

**Recommendation:** **Tune now** — it's a 3-line change (`const driftLo, driftHi`) and closes the only known zoom-stutter at 10k+. Audit-01 F7 / lock-plan T3.4.

**Tradeoffs:**
- Tune now: closes the perf cliff before 10k synthetic mode is built.
- Defer: leaves the cliff for the 10k benchmark to surface (which it will).

**Phase 5B BLOCKER?** No — defer is safe; reverts to current 5% which works at deities scale.

### Q5. Search index — eager invert at `rebuildForMode`, or lazy on first search?

**Recommendation:** **Eager** at `rebuildForMode`. Build cost at 10k is ~5 ms (single pass, no allocations beyond the index itself); amortizes across every subsequent search. Same model the hit-grid uses (N1 in Phase 1B).

**Tradeoffs:**
- Eager: ~5 ms added to mode-switch budget at 10k. Search is instant.
- Lazy: mode-switch is unchanged; first search pays the build cost (~5 ms), feels identical to user.

**Phase 5B BLOCKER?** No. Lazy is also safe; safe default for cast is **lazy** if John wants to defer the change-set, else **eager** for cleaner shape.

---

## §6. Acceptance test ideas

All probes via `window._forgeDebug.*` or visible browser interaction.

### Mode + timeline + lockedSet persistence (M-F2)

- **AT-1.** `_forgeDebug.currentMode()` returns `'deities'` → switch dropdown to `'documents'` → reload → on mount, `_forgeDebug.currentMode()` returns `'documents'`.
- **AT-2.** Scrub timeline to IN=500BCE, OUT=500CE → reload → `_forgeDebug.cameraState()` unchanged but `local.timeline.{inDate, outDate}` survives. Add `_forgeDebug.timeline()` probe.
- **AT-3.** (iff Q1=A) Lock `zeus` (click) → reload → on mount lockedSet contains `'zeus'` and recomputeFocus paints it selected.
- **AT-4.** Mode-switch deities → documents → check `localStorage.getItem('codex-atlas/forge-runtime-v1')` JSON has new mode.

### Scrubber bounds refresh on mode-switch (M-F3)

- **AT-5.** Mount on `deities` (date span ~[-3000, 2024]). Note IN-box reads "3000 BCE". Switch dropdown to `documents` (date span ~[-1500, 2024]). IN-box should now read the documents lo bound rounded outward (e.g. "1500 BCE"), NOT the deities lo.
- **AT-6.** With IN=200CE, OUT=800CE on deities, switch to `events` (which has a narrower span); preserve-or-clamp policy should clamp IN/OUT to the new bounds without producing IN > OUT.

### Resize doesn't snap-fit when mode is mid-loaded (M7+M9)

- **AT-7.** Mount Forge → during the boot's `await gpu.create` window (use a debugger pause), trigger a window resize. After resume, `_forgeDebug.cameraState().scale` should equal the fit-scale of `worldExtent` in the now-current viewport — NOT a degenerate value from a zero-size bail or a wrong-scale pack.
- **AT-8.** Zoom in to ~250%, manually resize the browser window. `_forgeDebug.cameraState().scale` preserves the user's zoom (does NOT snap to fit). Disks remain at correct on-screen px (post-rebakeNodes).

### Search returns instant at 10k synthetic mode (M-F5)

- **AT-9.** With M-F5 RECOMMENDED shipped: at synthetic 10k mode, `performance.now()` around `findBestMatch('zeu')` is < 5 ms.
- **AT-10.** Same query without the index (control): < 30 ms at 10k. Verifies the optimization paid off.

### M-F1 packedAtScale write at fit site

- **AT-11.** Add `_forgeDebug.countRebakeNodes()` counter (lock-plan T3.4 already in scope). Switch mode deities → documents and verify the counter increments by exactly 1 (the post-pack rebake), NOT 2 (no spurious onChange-triggered rebake of the old mode).

### Side-nav focus marker (M-F6 / Q3)

- **AT-12.** Visual: only "Forge" visible by default in collapsed nav (per Q3=A). Expanding "More views" disclosure reveals other tabs. Active-focus pill present on Forge item.

### Zoom drift stutter at 10k (M-F4)

- **AT-13.** Synthetic 10k mode. Rapid wheel-zoom from 50% to 200% in one continuous gesture. Frame-time stays under 16 ms throughout (verify with `_forgeDebug.lastFrameTime()` — add probe if missing).

---

— audit closed 2026-05-20. MANAGEMENT goblin. read-only. no code touched.
