# Phase 4 — THE BIG DECISION: Tradeoff Brief

**Date:** 2026-05-25 LATE evening (autonomous, watcher session)
**Author:** watcher Claude — written under John's "your recco, just go" delegation
**Purpose:** Resolve the layered-rebuild-vs-Phase-22 ambiguity (TYRANT audit finding #6) with concrete evidence + a recommendation. John reads, picks, work fires.
**Status:** Recommendation only. Phase 4 does not start until John signs the chosen option.

---

## TL;DR

|  | **Option A — Resume Phase 6 of layered rebuild** | **Option B — Formalize Phase 22 as "Timeline V1"** |
|---|---|---|
| What it says | Phase 22 is interrupted Phase 6; bring it under the rebuild umbrella | Foundation rebuild is DONE (0–5); Timeline is a new top-level feature track |
| Future tag | Phase 6.1, 6.2… | Timeline V1.1, V1.2… |
| `forge.js` decomposition (finding #7) | Lands naturally inside Phase 6 | Separate paired spec ("Phase 23 — Forge monolith decomposition") |
| Discipline rhythm | Same micro-audit-per-sub-phase as Phases 0–5 | New rhythm (per-feature spec) |
| Honesty about shipped state | Retroactive framing | Direct |

**My recommendation: Option B + paired Phase 23 spec for decomposition.** Rationale at bottom.

---

## Current state (concrete, citation-ready)

- **Rebuild Phases 0–5 shipped 2026-05-20**, commits `ba78863` → `bbff608`. Locked. Acceptance gates passed.
- **Rebuild spec** (`AUDIT/forge-rebuild-layered-spec-2026-05-20.md`) promised **Phase 6 ("TAIL POLISH, runs to backlog exhaustion")** — never started under that label.
- **41 commits 2026-05-19 → 2026-05-25 labeled Phase 22-M → 22-AH** delivered, instead:
  - Timeline mode hardening (canonical bottom-bar `.forge-fxpanel-btn`, LIN / LOG / CMP scale presets, density slider, DATE IN/OUT/FOCUS group, `_forge.focusTimelineRange()` API)
  - Calendar registry: 5 → 11 calendars + per-row 500 ms-dwell tooltips + per-calendar `epochGregYear`
  - Two-tier pivot system (Greg-0 always + calendar-epoch secondary)
  - LOCK toggle for zoom↔density linkage
  - Tick-collision detection with reserved pivot slots
  - Side-panel ellipsis + cross-folder click popup
- **B-DATING-1 / 2 / 3** also landed in this window: full 4-field `dating_basis` schema, 1041-YAML applier, build-pipeline coalesce, B6 family-median synth, visual-tier alpha encoding.
- **`forge.js` still 8,577 LOC monolith.** Rebuild spec promised decomposition into `src/js/forge/{node,behaviors,wires,fx,management}.js`. Never happened.
- **SEVERITY DOGMA** (HOW-WE-WORK §5.7) instated 2026-05-24 — forged by the 22-AB-fix → fix4 incident.
- **Pre-commit safety net** mechanically enforces wiring law + lint + dup-ID + Lane separation (TYRANT Phase 2). 588-target dead-link floor captured.
- **Phase 22-AI wires regression** fixed today (TYRANT Phase 5b, commit `3676637`).

---

## Option A — Resume Phase 6 of the layered rebuild

**What it means concretely:**
- Treat Phase 22 work as "Phase 6 sub-phases that did not get the proper label"
- Write a retroactive **Phase 6.0** spec doc mapping shipped Phase 22 commits to Phase 6 deliverables
- Name what is STILL PROMISED per the original rebuild spec: hull jitter, custom cursor, label hierarchy, camera tuning, monolith decomposition
- Future Forge work tagged Phase 6.1, 6.2 … per the rebuild rhythm
- AUDIT/forge-rebuild-* docs continue as living spec

**Pros:**
- Continues the disciplined micro-audit-per-sub-phase pattern that worked through 0–5
- `forge.js` decomposition (finding #7) lands naturally inside Phase 6
- One coherent narrative; future agents inherit clean spec lineage
- AUDIT/forge-rebuild-* docs become living spec, not historical artifacts

**Cons:**
- **Retroactive framing.** Phase 22 work was not designed under the rebuild spec's contract — calling it "Phase 6 in disguise" is partial fiction.
- Requires a non-trivial retroactive sub-phase spec that maps already-shipped commits to spec items
- Some Phase 22 items (calendar registry, `dating_basis`) aren't in the original rebuild spec at all — would have to be back-fitted
- Slower path forward — phase gates add overhead vs already-fluid timeline iteration

---

## Option B — Formalize Phase 22 as "Timeline V1"; close rebuild Phases 0–5

**What it means concretely:**
- Declare the layered rebuild's **Foundation (Phases 0–5)** COMPLETE in `AUDIT/forge-rebuild-layered-spec-2026-05-20.md` epilogue
- Write new spec: `AUDIT/2026-05-25-timeline-v1-spec.md`
  - Captures what shipped in Phase 22-M → 22-AH as **Timeline V1.0**
  - Queues remaining work as Timeline V1.1, V1.2 …
- Future polish iterations tagged Timeline V1.1 / V1.2 instead of Phase 22-AI-fix-fix-2
- Pair with **Phase 23 — Forge monolith decomposition** spec (separate doc) for `forge.js` carving

**Pros:**
- **Honest.** Phase 22 work was a separate feature track. Calling it that out loud is integrity.
- Clean break — no retroactive renaming or spec-stretching
- New phase counters feel less like the oscillation pattern (V1.1 ≠ 22-AB-fix2-fix3)
- Decouples concerns: Foundation has its spec, Timeline has its spec, Decomposition has its spec
- Matches what John actually does — Timeline iteration, not Foundation iteration

**Cons:**
- `forge.js` decomposition (#7) needs its own placement — not natural to Timeline V1
- Loses the layered-rebuild rhythm for net new engine-level Forge work
- Two specs to maintain (Foundation epilogue + Timeline V1 ongoing) + a decomposition spec

**Mitigation for the decomposition placement:** the paired **Phase 23 spec** carves `forge.js` by concern — renderer, timeline-chrome, glyph atlas, hull system, etc. — one module per sub-phase, with the same acceptance-gate discipline as the original rebuild's Phases 0–5. This treats decomposition as architectural (not featural), which is what it actually is.

---

## My recommendation — Option B + paired Phase 23 spec

**Why:**

1. **Truth over framing.** Phase 22 work has its own scope, acceptance criteria, and metrics (calendar correctness, dating accuracy, timeline UX). Forcing it into the rebuild's hull-jitter-and-cursor checklist doesn't fit reality.
2. **Cleaner cognitive surface for future agents.** "Foundation spec for engine. Timeline V1 spec for time. Phase 23 spec for decomposition." Three small bounded docs > one stretched-thin master doc that mixes engine, feature, and architecture.
3. **Decomposition is architectural, not featural.** Pairing it with Timeline V1 conflates concerns. Giving it its own spec respects the layered-rebuild philosophy (each phase atomic, each acceptance gate concrete).
4. **Matches the work pattern.** John is iterating on Timeline. He is not iterating on the rebuild's engine layer. Naming the work after the work matches reality and keeps the oscillation rate down (one of the audit's P1 findings).
5. **The SEVERITY DOGMA already lives at the right altitude for B.** §5.7 is process-level, not phase-level — it applies to Timeline V1 the same as Phase 6. No tension.

If you pick Option A instead, the work is still doable — just with more retroactive narrative work and a stretched-thin spec.

---

## Pre-written cast briefs — fire the second you pick

### If you pick OPTION A

> **Lane B AUDIT-only agent — "Phase 6.0 spec author".**
> Read: `AUDIT/forge-rebuild-layered-spec-2026-05-20.md`; STATUS entries for Phase 22-M → 22-AH (`tyrant-remediation-phase-6r-and-wires-fix` + `backfill-phase-22-summary` + 22-AH commit `0800fa8`); this tradeoff doc.
> Write: `AUDIT/2026-05-25-phase-6-spec.md` that:
> 1. Maps each Phase 22 commit to a Phase 6 deliverable (or marks "out-of-spec back-fit")
> 2. Lists remaining Phase 6 promises (hull jitter, custom cursor, label hierarchy, camera tuning, `forge.js` decomposition)
> 3. Proposes Phase 6.1's first deliverable + acceptance gate
> Do NOT ship any code — spec only. Confirm-on-cast.

### If you pick OPTION B

> **Lane B AUDIT-only — sequential cast of two agents.**
>
> **Agent 1 — "Timeline V1 spec author".**
> Read: STATUS entries for Phase 22-M → 22-AH + Phase B-DATING-1/2/3; this tradeoff doc.
> Write: `AUDIT/2026-05-25-timeline-v1-spec.md` that:
> 1. Names what shipped as Timeline V1.0 (canonical bottom-bar, calendar registry, two-tier pivot, density / LOCK / FOCUS group, dating_basis 4-field schema)
> 2. Lists open V1.1 candidates (e.g. the Wave 1+ scholarly-judgment items that surface on the timeline)
> 3. Writes a one-paragraph epilogue to `AUDIT/forge-rebuild-layered-spec-2026-05-20.md` declaring Phases 0–5 as locked "Foundation"
> Spec only.
>
> **Agent 2 — "Phase 23 decomposition spec author" (sequential after Agent 1).**
> Read: `src/js/views/forge.js` (all 8,577 LOC, structurally — not for changes); the rebuild spec's original decomposition aim.
> Identify 3–5 carveable modules by concern (e.g. renderer / timeline-chrome / glyph atlas / hull system / event-binding).
> Propose carve order with rationale (which carve has the smallest blast radius? which unblocks the most? which is safest to verify with `preview_screenshot`?).
> Write: `AUDIT/2026-05-25-phase-23-decomposition-spec.md` with the carve order + acceptance gate per sub-phase.
> Spec only.

---

## Either way — what does NOT depend on your call

These can ship in parallel with Phase 4 work, regardless of A/B:

1. **Wave 1+ stub-sweep** (audit finding #1, **P0**). Lane A. ~588 dead-link targets remain. Needs a scholarly-judgment investigation agent who can decide e.g. *"is `phase-2-job` the same node as `phase-2-035-job`?"* Brief on standby.
2. **Source-tier backfill** (audit finding #2, **P0**). Lane A. Sample of 20 high-traffic cross-tradition edges in `03_deities/` + `06_themes/` + `21_theology/`. CODEX §IV discipline. Brief on standby.
3. **Themes → motifs rename** (#14, P2). Atomic Lane B batch. WAIT until A or B is in flight + safety net is settled (don't add structural churn during structural decisions).

---

## Decision aids

If you're undecided between A and B, the cheapest tiebreaker is: **read the first sentence of the rebuild spec out loud** (`AUDIT/forge-rebuild-layered-spec-2026-05-20.md` §1). If the timeline + calendar + dating-basis work feels like it belongs under that sentence's umbrella, pick A. If it feels like a separate effort that should stand on its own, pick B.

---

— end of tradeoff brief, 2026-05-25 LATE evening, written autonomously per John's "your recco, just go" delegation.
