# Timeline V1 — Spec

**Date filed:** 2026-05-25 LATE evening
**Filed by:** watcher-claude-lead (TYRANT remediation Phase 4 Option B execution)
**Greenlit by:** John ("B")
**Status:** ACTIVE. V1.0 is what shipped; V1.1+ is the open queue.
**Replaces label:** "Phase 22-*" (retroactively reframed as Timeline V1.0 sub-deliverables).
**Reads-with:** `AUDIT/2026-05-25-foundation-locked-epilogue.md` · `AUDIT/2026-05-25-phase-23-decomposition-spec.md`.

---

## 0. Scope

**Timeline V1** is the user-facing time-axis view of the Atlas. It is a *feature* track, distinct from the Forge engine *foundation* (which is locked) and the `forge.js` monolith *decomposition* (which is Phase 23).

V1 owns:
- Bottom-toolbar canonical architecture (`.forge-fxpanel-btn` reuse + `body.fv-layout-timeline` gating)
- Scale presets (LIN / LOG / CMP / LOG-R)
- Vertical density slider + LOCK toggle
- Calendar registry + per-calendar tooltips + epochs
- Two-tier pivot (Greg-0 always + epoch secondary)
- Tick collision detection + reserved pivot slots
- Side-panel ellipsis + cross-folder click popup
- `dating_basis` B1–B7 framework + 1041-YAML applier + visual-confidence alpha encoding
- DATE IN / DATE OUT / FOCUS group + `_forge.focusTimelineRange()` API

V1 does NOT own:
- Engine primitives (NODE / BEHAVIORS / WIRES / FX / MANAGEMENT — locked Foundation)
- forge.js source structure (Phase 23)
- Pantheon V2 wheel rendering (separate isolated view)

---

## 1. Timeline V1.0 — what shipped (closed)

41 commits 2026-05-19 → 2026-05-25 labeled Phase 22-M through 22-AH + B-DATING-1/2/3 + tyrant-phase-5b (wires regression fix). The full STATUS rolling-window backfill is captured in the `backfill-phase-22-summary` STATUS entry (commit `48a1540` block + subsequent entries).

**Canonical artifacts locked in V1.0** (DO NOT REGRESS — per `00_meta/HANDOFF.md` "What's locked in code"):
- Calendar registry (11 calendars + tooltips + per-calendar epochs)
- Bottom-bar canonical-class architecture (`.forge-fxpanel-btn`)
- Two-tier timeline pivot (Greg-0 + epoch secondary)
- Vertical density slider + LOCK toggle
- DATE IN / DATE OUT / FOCUS group + `_forge.focusTimelineRange()`
- `dating_basis` B1–B7 framework
- Side-panel ellipsis + cross-folder click popup + hideTip-on-render
- All 29 lenses recognized end-to-end
- All baked STYLE-panel defaults
- The SEVERITY DOGMA (HOW-WE-WORK §5.7)

---

## 2. Timeline V1.1 — open candidates (queue, not commitments)

Prioritized by audit signal and observable user-value. Each will get its own sub-spec when work starts.

| # | Candidate | Source / why | Estimated scope |
|---|---|---|---|
| V1.1-A | **Resolve TYRANT Wave 3b scholarly-judgment dead refs** that surface as document-tier nodes on the timeline (e.g. is `phase-2-001-iliad` worth a Timeline-visible node? `phase-7-013-eliade-myth-of-eternal-return`?) | Wave 3a deferred ~24 targets. Some are timeline-relevant docs. | Lane A, 1–2 sessions |
| V1.1-B | **Confidence-tier visual contract audit** — does the current `dating_basis` alpha-encoding actually communicate confidence to viewers at glance, or does it just blend nodes into noise? | Phase B-DATING-2 shipped the contract; no UX audit since | AUDIT-only first |
| V1.1-C | **Calendar-row hover dwell-time tuning** — 500ms dwell is one value across all rows; some calendars (Gregorian) want shorter; some (Bahá'í) want longer | 22-AF shipped 500ms | Lane B small |
| V1.1-D | **Pivot label collision near zoom-extremes** — when two pivots get within 14px the secondary one drops; what happens when BOTH primary and secondary collide on a calendar with a hot anchor? | 22-AG reserved-slot logic | Diagnostic first |
| V1.1-E | **Focus-group keyboard nav** — `_forge.focusTimelineRange()` is API-only; needs keyboard equivalent (arrow keys to step, +/- to scope) | UX completeness | Lane B small |
| V1.1-F | **Performance audit at N≥3000 nodes in timeline mode** — Phase 22 ran on current vault size; vault has been growing | Standing | Read-only audit |

V1.1 sub-phases ship one at a time, each its own commit, each gated on a small acceptance test (preview screenshot or console-clean smoke).

---

## 3. Acceptance discipline (carries from Foundation)

Every Timeline V1.N sub-phase must:
1. Claim ACTIVE-UX slot (Lane B serializes).
2. Reuse canonical primitives (`.forge-fxpanel-btn` etc.) — no inline-style mimicry per SEVERITY DOGMA §5.7.
3. Land in 1–2 commits, not a multi-commit fix-fix-fix chain.
4. Run preview verification (`preview_screenshot` of the timeline view in mounted state).
5. Write a STATUS entry with what shipped + what's locked + what's queued for V1.N+1.
6. Bump the cache-bust in `index.html`.
7. NOT regress any V1.0 canonical artifact listed in §1.

---

## 4. Out-of-scope

- Anything that requires `forge.js` decomposition is Phase 23, not Timeline V1.
- Anything that requires new node *types* (lenses, schema) is Lane A ontology work.
- Anything that affects the rebuild Foundation engine layer is locked — no change without a new dated rationale doc.

---

— Timeline V1 spec, locked 2026-05-25 LATE evening. V1.1 queue is open.
