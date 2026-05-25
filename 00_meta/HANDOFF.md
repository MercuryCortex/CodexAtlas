# Session HANDOFF — 2026-05-27 (Safari perf mission accomplished)

> **⚠️ READ THIS BLOCK FIRST.** 49-commit session that took the Forge view from **24fps in Safari → consistent 60fps in Safari** at vault scale (4476 nodes / 682 active deities). Brave at 60fps with headroom. The architecture is now READY to receive content growth toward the real scale targets. The MISSION (Google Maps bar at hundreds of thousands of nodes) is NOT done — perf foundation is now sound, the next phase is data architecture + content ingestion. See § "Roadmap state" below.

---

## 60-second TL;DR for the fresh agent

1. **Forge view is buttery in BOTH Safari AND Brave at the current 4476-node vault.** No further perf work needed at this scale.
2. **Phase 25 (canvas labels)** was the big architectural unlock — DOM labels were Safari's compositor cliff.
3. **The pattern that WORKED for Safari specifically:** camera-idle skip (any per-frame render function) + minimal stroke widths + canvas for many-small elements + SVG for few-large elements. Full checklist saved at `memory/feedback_safari_perf_unlocks_2026-05-27.md`.
4. **The pattern that DIDN'T work:** canvas for hulls (tried + reverted). Few-large-elements stay SVG.
5. **The mission isn't finished.** Current vault is 4476 nodes; real target is hundreds of thousands → millions. The next architectural phase is data (slim render data split, lazy load by viewport, LOD clusters). See § "Roadmap state".

---

## What landed tonight (49 commits, all on main)

### Phase 23.1 — forge.js decomposition (the carve series RETRY, validated)

After last session's revert, retried the carve cleanly with the AST-scanner + smoke-gate + bootstrap-catch safety net. 10 carves a → j:

| Commit | Module | LOC out |
|---|---|---:|
| `6299e2a` | timeline-scrubber | −340 |
| `a5745c8` | legend | −273 |
| `15e6ee7` | fx-panel (fresh — cherry-pick of `renderer` over-declare failed) | −139 |
| `844307d` | style-panel | −112 |
| `cae7f22` | search-autocomplete | −103 |
| `e0e01e6` | hover-card | −311 |
| `469948c` | side-panel **THE BIG ONE** + fixed latent `safeAttr` sibling-scope bug | −854 |
| `d27ee32` | debug-stats | −50 |
| `78dbe84` | view-settings | −301 |
| `6889192` | install-public-api ★ SERIES COMPLETE ★ | −103 |
| `d39afb8` | bundle (10 modules → 1 script tag) | — |
| `6b3eddf` | HOTFIX — modemod was forge.js-scope, not window global | bug fix |

**Net: forge.js 8590 → 6011 LOC (−30%).** Beat last session's failed series by 5pp AND fixed 3 latent bugs as bonus.

### Phase 24 — viewport-aware architecture

| Commit | What |
|---|---|
| `d63d1c0` | AUDIT spec filed for viewport-filter |
| `79a2d7a` | Phase 24A v1 — viewport cull primitive (mechanism only — NOT a perf win on its own) |
| `e0a20c6` | **Phase 24B v1 — layout-position cache (6–10× mode-switch speedup)** |
| `016271e` | Phase 24C v1 — viewport-cull labels (off-screen labels skipped) |
| `148be33` | Phase 24-CENTER-WEIGHT — center-weighted label density + smoother tier curve |

### Phase 25 — DOM → canvas migration (the Safari unlock)

| Commit | What |
|---|---|
| `3195a61` | **Phase 25 — CANVAS LABELS (the cliff-breaker for Safari)** |
| `c0f1892`+revert | Phase 25b canvas hulls — TRIED + REVERTED. Wrong shape of problem (few large elements should stay SVG). |

### Primitive fixes (1-line API choices that broke compositor budget)

| Commit | What |
|---|---|
| `61c658d` | labels: `style.left/top` → `translate3d` |
| `79d5390` | BG image: `width/height` → `transform scale` |
| `2eb7099` | hover-card: `display:none` → opacity-fade |
| `492a676` | pulse FX: `void offsetWidth` → `getAnimations().cancel()` |

### Safari-specific workarounds (10 commits tagged SAFARI-WORKAROUND)

The catalog is at `memory/feedback_safari_perf_unlocks_2026-05-27.md`. Highlights:
- `c40544b` — cached no-op setAttribute writes in syncHulls
- `8e1807b` — `text-stroke` halo (vs 5-shadow), selective will-change
- `ab0b20c` — throttle scheduleIdleLabelSync 60Hz → 10Hz
- `fe6cf2e` — SVG syncHulls camera-idle skip
- `8605d2f` — labels canvas camera-idle skip + 2px halo (the final unlock)

### Instrumentation (kept, removable later)

| Commit | What |
|---|---|
| `fac2bd8` + `aa247bc` + `e408228` | Live perf HUD overlay (rAF interval, frame time, hover time, longtask count, color-coded) |
| `8f3c393` + `580a1f3` + `4973618` | `?debug-cap=N` URL param for active-set bisection |

### UX polish (after the perf win)

| Commit | What |
|---|---|
| `3ebf7ec` | halo 4px restored (canvas idle-skip carries the win) |
| `ae04c00` | label size 12 → 14, wired canvas font to `params.label_size` |

---

## Memories saved tonight (read on session start)

| File | Purpose |
|---|---|
| `feedback_safari_is_the_truth_2026-05-26.md` | CARDINAL: Safari is the perf truth-teller; Brave is the canary. When they diverge, it's a Safari quirk. Don't conflate. |
| `feedback_execute_dont_menu_2026-05-26.md` | Workflow correction: in fix mode the plan exists; agent executes; John reviews outputs. Stop using AskUserQuestion as a progress check-in. |
| `feedback_safari_perf_unlocks_2026-05-27.md` | The full checklist of 10 fixes that compounded to crack Safari 60fps + the 2-pattern playbook for future per-frame work + what DIDN'T work. |

(Plus the existing `feedback_google_maps_bar_2026-05-25.md` cardinal still in force.)

---

## Roadmap state — WHERE WE ARE on the mission

**The mission:** Codex Atlas at Google Maps fluidity, scaling to hundreds of thousands → millions of nodes. Mac users (Safari primary), Brave fine.

```
PHASE STATUS                                       SCALE TARGET
─────────────────────────────────────────────────  ─────────────
✅ Phase 23.1 — forge.js decomposition              (any vault)
✅ Phase 24A — viewport cull (active set)           (any vault)
✅ Phase 24B — layout-position cache                (any vault)
✅ Phase 24C — label viewport-cull + center weight  (any vault)
✅ Phase 25  — canvas labels                        (any vault)
✅ Safari perf — 60fps consistent                   ≤ ~10k nodes ← WE ARE HERE
─────────────────────────────────────────────────
🚧 Phase 24E — slim render data (next)              10k–100k
   (Split node JSON: render fields ~50 bytes stay
    loaded, detail fields ~6 KB lazy on hover/click.
    Currently every node loads 35 fields × ~6 KB ≈
    27 MB upfront for the 4476-node vault. At 100k
    nodes that becomes ~600 MB — past browser heap.
    Spec: forge.js loads slim records into a flat
    array; on hover/click, fetch detail for the
    specific node from a per-node JSON file or a
    chunked endpoint.)

⏳ Phase 24D — LOD cluster glyphs at extreme zoom-out  100k+
   (Replace dense node regions with aggregate cluster
    glyphs. Already kinda happens with hulls; needs to
    formalize as a proper LOD ladder.)

⏳ Phase 26 — viewport-driven data loading            500k+
   (Tile-based quadtree fetch — only load nodes whose
    world position intersects current viewport bbox +
    margin. Standard "Google Maps style" technique.)

⏳ Phase 27 — worker-thread layout                    1M+
   (Move layout compute off main thread. Pre-bake
    positions in a Web Worker so even mode-switch is
    instant.)
```

**You are at the ✅ line.** The architecture handles the current 4476-node vault buttery in both browsers. The next 3 phases (24E, 24D, 26) are what unlocks growth toward your real ambition. Each is a multi-session focused project.

**Important framing:** finishing tonight's perf push is NOT mission complete. It's the FOUNDATION done. The runway is cleared. Content ingestion can resume in parallel with the next architectural phase.

---

## What's open (uncommitted on disk, NOT touched tonight)

These were uncommitted at session start and stayed so:

- `M 00_meta/MASSIVE-WIN-essays/executed-divine-claimant.md` — has malformed YAML (double-escaped quotes from a prior dating-sweep agent)
- `M 00_meta/MASSIVE-WIN-essays/soul-exile-longing.md` — same
- `M 00_meta/lint-report.md` — auto-regenerated; harmless
- `?? AUDIT/2026-05-24-dating-sweep-proposals.tsv` — 1357 dating-basis proposals; has 40 dup IDs per the earlier audit; NOT safe to batch-apply
- `?? AUDIT/2026-05-24-dating-sweep-summary.md` — companion; misframes a "304-node pipeline bug" that's already fixed

**Recommendation:** clean these up in a dedicated dating-sweep follow-up session. They're unrelated to perf.

---

## What's queued / not done yet

1. **Phase 24E (slim render data)** — the next big architectural unlock. ~1–2 hour focused refactor with a clear spec. Doesn't affect current felt perf but unlocks 10k+ node growth.
2. **Timeline view canvas-idle-skip** — timeline chrome (date axis SVG) hasn't gotten the camera-idle skip pattern. Timeline view is "a bit less than 60fps" per the user. Apply the same pattern from `syncHulls` to it. ~15 min.
3. **FX panel slider for `label_idle_max`** — currently hardcoded 100. User asked about higher density; a slider would let them dial without code edits. ~30 min.
4. **Dating-sweep cleanup** (the open items above) — separate workstream, content-side.
5. **Remove instrumentation when no longer useful** — HUD overlay, debug-cap URL param, _profileRebuild hooks. Keep them for now as live diagnostics; remove before release.

---

## Tools live for next session

- `scripts/forge_carve_deps.py` — AST dep scanner. SAFE_GLOBALS list now correctly excludes the forge.js-scope aliases (`gpu`, `glyphmod`, `modemod`, `edgemod`) — those were the hotfix that broke 23.1j.
- `scripts/smoke-test-forge.js` — 10-check interactive smoke harness.
- `scripts/build-forge-bundle.sh` — concatenates the 10 carved modules into `src/js/forge/_bundle.js`. Re-run after editing any module.
- HUD overlay (inline in index.html) — live rAF interval, frame time, hover time, longtask count.
- `?debug-cap=N` URL param — hard-cap active set for perf bisection.
- `window._forge.profileRebuild(true)` + `getLastRebuildPhases()` — per-phase rebuildForMode timing.

---

## Cardinal rules in force

1. **THE GOOGLE MAPS BAR** — must feel like Google Maps at scale. Less = wrong path. (`feedback_google_maps_bar_2026-05-25.md`)
2. **SAFARI IS THE TRUTH** — build for Safari (Mac users). Brave is the canary; when they diverge, write a SAFARI-WORKAROUND, don't refactor blindly. (`feedback_safari_is_the_truth_2026-05-26.md`)
3. **EXECUTE, DON'T MENU-PICK** — in fix mode, the plan exists; agent executes; John reviews outputs. (`feedback_execute_dont_menu_2026-05-26.md`)
4. **SEVERITY DOGMA** — three strikes = agent terminated. Missing the actual problem counts. (`feedback_severity_dogma_2026-05-24.md`)
5. **Canvas for many-small elements; SVG for few-large elements.** (`feedback_safari_perf_unlocks_2026-05-27.md`)

---

## Session-end state

- **Branch:** `main`
- **HEAD:** `ae04c00` (Label size 12 → 14)
- **Working tree:** clean except for the dating-sweep open items above (none touched tonight)
- **App live at:** http://localhost:8742/?view=forge (preview server can be restarted via `mcp__Claude_Preview__preview_start` if dropped)
- **Vault:** 4476 nodes / 21405 edges (unchanged tonight)
- **Felt fluidity:** ✅ Safari ~60fps, ✅ Brave ~60fps

**Pickup for next session:** read this doc + `memory/MEMORY.md` + the three new memory files cited above. Then ask John whether to push Phase 24E (real-scale architecture) or do something different.

**Mission status: foundation complete. Scale runway cleared. Content + architecture growth is the next chapter.**
