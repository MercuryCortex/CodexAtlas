# Session HANDOFF — 2026-05-25 NIGHT (fresh-agent pickup)

> **⚠️ READ THIS BLOCK FIRST.** A long TYRANT-mode session just closed. **~32 commits total** across two agents. App is **working cleanly**. Dead-link baseline **594 → 490** (−17.5%). Source-tier coverage **~0% → ~99%** on edges-with-source. **Phase 24 Legacy viewer SHIPPED and live.** **Phase 23.1 forge.js decomposition ATTEMPTED + REVERTED** (silent-throw bug; 3 prereqs identified before retry). Zero master-file violations shipped, zero strikes shipped.

---

## TL;DR for the fresh agent in 60 seconds

1. The app works. Open `http://localhost:8742` and everything is interactive (clicks, zoom, panels, the new Legacy viewer at `?view=legacy`).
2. Big TYRANT remediation completed (audit findings doc at `AUDIT/2026-05-25-tyrant-audit-findings.md`). The safety net is real: pre-commit hook runs `linkcheck.py --baseline` + `lint_yaml.py --strict` + dup-id check. Don't bypass.
3. **John picked Option B** on 2026-05-25 for the Forge rebuild ambiguity: declare Foundation locked, formalize Phase 22 work as Timeline V1, separate Phase 23 for forge.js decomposition. 4 specs are locked in `AUDIT/`.
4. **Phase 23.1 was attempted and reverted.** Do NOT retry until the three prereqs are in place (§ "What's blocking Phase 23.1 retry" below).
5. **Active queue** is short and clear (§ "What's open" below).

---

## What's locked in code (DO NOT REGRESS)

Per John 2026-05-25 *"preserve all work"*:

- **Pre-commit safety net** (6 hard gates + 1 STATUS-nudge): `linkcheck.py --baseline` (refuses new dead `[[wikilinks]]` past the 490-target floor) + `lint_yaml.py --strict` (29 type categories, was 7) + `scripts/check_dup_ids.py` (dup-slug refuses commit, was a post-build hard-fail) + Lane A/B mixing refuse + JS syntax + STATUS-touch nudge. `ATLAS_ALLOW_DUP_ID=1` escape hatch DELETED.
- **Forge bootstrap `.catch()` safety net** at `src/js/views/forge.js:2414` — async-IIFE failures now surface to `console.error` instead of silently disappearing as unhandled Promise rejections. This was added 2026-05-25 after the Phase 23.1 carve incident.
- **Phase 24 Legacy viewer** — side-nav pill → list of closed work (specs / audits / archived STATUS / handoffs), markdown render in right pane. Source files: `src/js/views/legacy.js`, `scripts/build_legacy_index.py`, `src/data/legacy-index.json`, CSS in `src/styles/app.css` `.legacy-pane*`. John greenlit "yes" after preview verification.
- **Calendar registry** (11 calendars + per-row tooltips + per-calendar epochs)
- **Bottom-bar canonical class architecture** (`.forge-fxpanel-btn`) — no inline-style mimicry (SEVERITY DOGMA §5.7)
- **Two-tier timeline pivot** (Greg-0 always + epoch secondary)
- **Vertical density slider + LOCK toggle**
- **DATE IN / DATE OUT / FOCUS group** + `_forge.focusTimelineRange()`
- **dating_basis B1–B7 framework** + 1041-YAML applier
- **All 29 lenses** recognized end-to-end (build_data + lint + linkcheck)
- **Source-tier coverage ~99%** on edges-with-source (T1 mostly; 5 T3 + 2 T4 explicit)

---

## What this session shipped (high level, in order)

### TYRANT remediation (the big arc)

The session opened with a "TYRANT mode" zero-tolerance audit of the project. 5 goblins ran in parallel; findings at `AUDIT/2026-05-25-tyrant-audit-findings.md`. 16 findings, severities P0–P3. Remediation:

1. **Audit signoff + remediation plan** locked. Plan at `AUDIT/2026-05-25-tyrant-remediation-plan.md`.
2. **Safety net** locked (6 gates above) — closed findings #3, #4, #5, #13.
3. **Phase 5b wires regression** (Phase 22-AH side effect) traced + fixed; diagnostic at `AUDIT/2026-05-25-wires-regression-trace.md`. Closed finding #11.
4. **Wave 0** (placeholder typo drain) → Wave 1 (case-fold capitalized deities) → Wave 2 (citations + placeholders) → Wave 3a (Python fix-map slug-drift) → Wave 3b (12 tier-1 document stubs) → Wave 3b-tail (5 person stubs) → Wave 3b-tail-2 (8 figure stubs) → Wave-3b flagged-case resolution (4 stubs + wikilink rewrites). Baseline went **594 → 490 dead targets (−17.5%)**. Closes finding #1 partially.
5. **Source-tier pilot** (23 T1 edges across 6 deities) → **full sweep** (2,318 T1 + 5 T3 + 2 T4 across 665 files). Closes finding #2 to ~99% on edges-with-source.
6. **Phase 4 BIG DECISION** resolved by John → Option B. Spec package: `AUDIT/2026-05-25-foundation-locked-epilogue.md` + `AUDIT/2026-05-25-timeline-v1-spec.md` + `AUDIT/2026-05-25-phase-23-decomposition-spec.md` + `AUDIT/2026-05-25-phase-24-legacy-viewer-spec.md`. Closes finding #6.
7. **Phase 24 Legacy viewer V1** built + greenlit by John. Closes finding #10 (AUDIT/ surfacing in viewer).

### Phase 23.1 attempt (failed cleanly)

After Phase 24 shipped, attempted Phase 23.1 = decompose `forge.js` (8,577 LOC) into modules under `src/js/forge/`. Shipped 10 carves in sequence (timeline-scrubber, legend, fx-panel, style-panel, search-autocomplete, hover-card, side-panel, debug-stats, view-settings, public-api), reducing forge.js to 5,959 LOC (−30.5%).

**Each carve preview-verified pixel-identical at boot** but interactions silently broke. Root cause: my auto-dep-detection (regex) missed forge-scope identifiers (BUCKET_ORDER, PARAM_DEFAULTS, modemod, fmtYear, etc.). The first carved module to use one threw inside the `async bootstrap()` IIFE → unhandled Promise rejection → swallowed by browser → `attachInteractions()` never ran → canvas had no event listeners → clicks + zoom dead. Bottom-bar menus still worked because they bound their handlers earlier in the boot chain.

John reported the breakage. I diagnosed + reverted (commit `3c294e2`), then shipped the **bootstrap `.catch()` safety net** (commit `12950d4`) so this entire class of silent failures is now loud.

### Final commit sequence (newest first)

- `2fabbec` STATUS — log Phase 23.1 revert + bootstrap-catch safety net
- `12950d4` forge bootstrap — `.catch()` safety net on the async IIFE
- `3c294e2` REVERT Phase 23.1 carve series — silently broke forge interactions
- `288c9bc`–`f580070` Phase 23.1a–j carve series (REVERTED)
- `8cc2cd9` Phase 24 V1 — SHIPPED (greenlit by John)
- `010b2f7` Phase 24 V1 polish — boot-race fix
- `8ae156b` Phase 24 V1 — Legacy/Archive viewer first ship
- … (TYRANT remediation chain — see `git log` for the full sequence)

---

## What's open (queue, in priority order)

### Implementation that needs your visual / button-press

1. **Phase 23.1 retry** — gated on the three prereqs below. Specs already locked. Don't retry without prereqs (2) and (3).
2. **Phase 23.2** (mode-dispatch carve) and **23.3** (animation loop carve) — same prereqs as 23.1.
3. **Timeline V1.1** picks — 6 candidates queued in `AUDIT/2026-05-25-timeline-v1-spec.md`.
4. **`themes/` → `motifs/` atomic rename** (audit finding #14, P2) — atomic Lane B batch when calm.
5. **HOW-WE-WORK.md `[ARTHURIAN-CYCLE]` 1-char single-bracket fix** — master file, pending explicit John sign-off.
6. **3 proposed cardinal rules** (#8 safety-net / #9 spec-faithfulness / #10 log-or-don't-commit) for HOW-WE-WORK §5 — pending John sign-off.

### What's blocking Phase 23.1 retry

The carve pattern itself is sound (it's lift-and-shift of pure-DOM/event helper functions). The bug was tooling, not architecture. Three prereqs:

1. **✅ Async-IIFE `.catch()`** — SHIPPED `12950d4`. Future silent failures will be loud.
2. **⬜ AST-based dep scanner** — replace the regex heuristic. Use `acorn` or `esprima` to walk the function body, mark every free identifier, output the complete deps list. Standalone script under `scripts/`. Test against `wireLegend`/`wireSidePanel`/etc. as known regression cases. Task #10.
3. **⬜ Interactive smoke test harness** — go beyond pixel-identical screenshot. Click + drag + zoom + open every panel programmatically via `Claude_Preview`. Pass/fail report. Task #11.

When (2) and (3) exist, Phase 23.1 retry is bullet-proof.

### Lane A autonomous (no John needed)

1. **Wave 4 dead-link cleanup** — ~490 baseline targets remaining. Diminishing returns; need targeted cluster (e.g., "Ismaili philosophy", "Ethiopic tradition") rather than alphabetical grinding. Task #2.
2. **Source-tier T2 review pass** — go through T1-defaulted edges (2,311 of them) for ones that should be T2 (academic minority). Tedious; pay-off scattered. Task #9.
3. **More edges-without-source backfill** — many cross-tradition edges lack any `source:` field. Each needs research. Task #9.

---

## Pickup instructions for the fresh agent

1. **Read this block.** Verify state with `git log --oneline -10` + `wc -l src/js/views/forge.js` (should be 8577) + `ls src/js/forge/` (should NOT exist).
2. **If John has indicated direction** → execute it. Lane B work needs ACTIVE-UX slot claim.
3. **If John hasn't said** → pick from "Lane A autonomous" above, OR start the Phase 23.1 retry prereqs (tasks #10 + #11) — both are AUDIT-only / tooling work, no Lane B contention.
4. **DO NOT retry Phase 23.1 carves** without prereqs (2) and (3) in place. The architecture is sound; the tooling was the bug.
5. **DO NOT edit master files** (`ONTOLOGY.md`, `PROTOCOL.md`, `LANES.md`, `HOW-WE-WORK.md`, `VIEW-CONTRACT.md`) without explicit John greenlight (HOW-WE-WORK §9).

---

## Tasks tracked

```
#1 [✓] Wave 2 — citation/placeholder dead-link sweep
#2 [✓] Wave 3 — tradition/phase slug-drift recon + fix
#3 [✓] Source-tier backfill pilot
#4 [○] themes → motifs atomic rename (Phase 7 cleanup, Lane B)
#5 [✓] Phase 4 Option B execution — 4 specs shipped
#6 [○] Phase 23 forge.js decomposition — ATTEMPTED + REVERTED; prereqs identified
#7 [✓] Wave 3b — scholarly-judgment dead-link stubs
#8 [✓] Phase 24 Legacy/Archive viewer V1 — SHIPPED
#9 [○] Source-tier expansion remainder — T2 review + source backfill
#10 [○] Phase 23.1 retry prereq — AST-based dep scanner
#11 [○] Phase 23.1 retry prereq — interactive smoke test harness
```

---

## Lessons baked into commit messages + this doc

- **Closure carves of large stateful functions are unsafe with regex dep detection.** Use AST.
- **`async` IIFEs silently swallow synchronous throws.** Always `.catch()` them or the next bug will hide for hours.
- **Pixel-identical preview is necessary but not sufficient.** Interactions are a separate verification surface. Test them.
- **Revert fast when you ship a runtime bug.** Diagnosis is helpful but not required for the revert; user-facing work comes first.

---

## Last commit at handoff: `2fabbec` — clean repo state, slot OPEN, all gates green, app interactive.
