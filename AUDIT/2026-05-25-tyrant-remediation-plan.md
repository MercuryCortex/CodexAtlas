# TYRANT-MODE REMEDIATION PLAN

**Locked against:** `AUDIT/2026-05-25-tyrant-audit-findings.md` (signed 2026-05-25).
**Owner:** Lane B agent (currently me).
**Status:** Phase 1 (audit signoff + plan) = this doc. Phases 2–7 below.

**John's two constraints (locked at plan-time):**
1. **Preserve all work.** Don't destroy functionality. Restyle if needed, but don't lose the calendar registry, the bottom-bar canonical class, the vdensity primitive, the dating_basis framework, the two-tier pivot, etc.
2. **WARN before any rebuild.** If a phase requires destroying-and-re-building existing code, surface that to John BEFORE starting so he can focus.

---

## Phase 1 — Audit signoff + this plan (THIS COMMIT)

- ✅ Sign findings doc.
- ✅ Write this plan.
- ✅ Add LAW/judiciary lens forward-note.
- 🟢 No code-altering work in this phase.

---

## Phase 2 — Lock the safety net (mechanical, additive, NO REBUILD RISK)

**Closes findings:** P0 #1 (partial), P0 #2 (partial), P1 #3, P1 #4, P1 #5, P2 #13.

**Touches:** `scripts/git-hooks/pre-commit`, `lint_yaml.py`, `linkcheck.py`, `build_data.py`, new `AUDIT/dead-link-baseline.txt`.

**Substeps:**
1. **Expand `lint_yaml.py` NODE_DIRS** from 7 to 29 type categories (line 40–48). Every type currently passes through silently → every type now gets schema validation.
2. **Add `linkcheck.py --baseline` mode.** Write `AUDIT/dead-link-baseline.txt` once with the current 594 dead targets. Future runs diff against baseline. Exit non-zero on regression (new dead targets not in baseline). Existing 594 are TOLERATED but FROZEN — they can only shrink, never grow.
3. **Pre-commit hook gains two new gates** (`scripts/git-hooks/pre-commit`):
   - Run `lint_yaml.py` on staged YAML files → fail if any ERROR-level issue.
   - Run `linkcheck.py --baseline` on staged content paths → fail if any new dead target.
   - Both gates skippable ONLY via `--no-verify` (which has zero count in history per audit; SEVERITY DOGMA forbids).
4. **Promote dup-ID gate to pre-commit.** Currently in `build_data.py:1158–1174` (post-commit). Move the check into the hook so dup IDs cannot land. Delete `ATLAS_ALLOW_DUP_ID=1` escape hatch entirely.
5. **Install hook to `.git/hooks/pre-commit`** (existing pattern). Verify with a probe commit.

**Verification:** introduce a deliberate dup-ID or new dead link in a probe commit; confirm the hook refuses. Then revert the probe.

**Risk:** ZERO functional risk — additive gates only. Worst case: a content commit fails the hook and the agent must fix the failing reference before re-committing. That's the GOAL not a regression.

**Estimated lines changed:** ~120 lines across hook + 2 Python files.

---

## Phase 3 — Drain WIRING LAW debt (Lane A content work)

**Closes findings:** P0 #1 (fully).

**Touches:** content folders (`02_documents/`, `03_deities/`, `04_persons/`, etc.) — Lane A.

**Substeps:**
1. **Categorize the 594 dead targets** (~3 hours one-time):
   - Bucket A (~20): typos/malformed placeholders (`[wikilink]`, `[wikilinks]`, `[document-slug]`) — find-replace cleanup.
   - Bucket B (~574): genuine missing nodes that should be stubbed OR backticked.
2. **Bucket A: fix in one Lane A batch.** Mechanical find-replace.
3. **Bucket B: drain in waves.** Each wave reduces baseline by 50–100 dead targets:
   - Wave 1: highest-leverage stubs (referenced by 3+ nodes). Audit identifies: `phase-4-040-quran`, `ra-egyptian`, `muhammad`, `phase-8-002-popol-vuh`, `phase-8-004-florentine-codex-sahagun` (slug fix), `sheikh-farid`, `guru-arjan-dev-ji`, `ammit-devourer`, `tradition-afro-diasporic`.
   - Waves 2–N: remaining targets sorted by ref-count.
4. **Each wave updates `AUDIT/dead-link-baseline.txt`** so the gate from Phase 2 tracks progress.

**Risk:** Lane A only. No app-code touched. Phase 2 hook prevents regressions while drain happens.

**Estimated wall time:** ~2–3 Lane A sessions to drain Bucket A + Wave 1 (gets baseline from 594 → ~500). Long tail via investigation agents.

---

## Phase 4 — THE BIG DECISION (REQUIRES JOHN'S EXPLICIT CALL)

**Closes findings:** P1 #6, P1 #7 (partial).

**The choice:**

| Option | What it means | Cost | Pros | Cons |
|---|---|---|---|---|
| **A. Resume Phase 6 layered rebuild** | Decompose `forge.js` (8577 LOC) into `src/js/forge/{node,behaviors,wires,fx,management,timeline}.js`. Phase 6 = "TAIL POLISH" per `AUDIT/forge-rebuild-layered-spec-2026-05-20.md`. | ~2–3 days focused refactor. **DESTROYS the current monolithic file structure** (functionality preserved, file layout changes). | Architecture matches spec. Future work easier. Premium SaaS bar gets closer. | Big risky refactor. Could ship regressions. Slows feature work for ~3 days. |
| **B. Formalize Phase 22 as the active mandate** | Declare Phase 22 timeline polish the canonical work. Write a new ONTOLOGY-RATIONALE-style doc closing the Phase 6 spec officially. `forge.js` stays monolithic. | ~1 hour doc work. NO rebuild. | Keeps shipping velocity. No risk. Honest about what's actually happening. | Monolith stays. Premium SaaS bar stays not-cleared. |
| **C. Hybrid: close Phase 6 spec, queue layered rebuild for Phase 23 after timeline lands** | Accept timeline polish IS the right work now. Formally schedule the layered rebuild as a future named phase, not implicit. | ~1 hour doc work. | Honest + scheduled. Both wins. | None apparent. |

**⚠️ JOHN MUST CHOOSE.** I will not proceed past this phase without explicit instruction. The audit named option (A) as the gap; my honest read is **(C) is correct** — Phase 22 timeline polish has been the actual work and it's been useful; the layered rebuild is the right destination but not the current need. But this is your call.

**Risk:** Option A is the only one that touches functionality. Will WARN with step-by-step plan before any line moves.

---

## Phase 5 — Fix live regressions + DOGMA violation

**Closes findings:** P1 #11 (one instance), P2 #12.

**Touches:** `src/js/views/forge.js`, `src/js/views/scripture-reader.js`.

**Substeps:**
1. **Diagnose the wires regression I shipped in Phase 22-AH.** User reports lock-click → half opacity → mouse-move boosts to 1.0 (opposite of my intent). 5 hypotheses live in `AUDIT/2026-05-25-foundation-perf-and-wires-notes.md` §1. Read-only diagnostic first (find which hypothesis is correct), then surgical fix.
2. **Remove inline `style="margin-bottom:14px"`** at `scripture-reader.js:493`. Add the rule to canonical `.sr-atlas-btn` in `app.css` OR add a `.sr-atlas-btn--spaced` modifier class. SEVERITY DOGMA strike-2 compliance.

**Risk:** Surgical edits. Functionality preserved.

---

## Phase 6 — STATUS + HANDOFF + DASHBOARD discipline restored

**Closes findings:** P1 #8, P1 #9, P1 #10.

**Touches:** `00_meta/STATUS.md`, `00_meta/HANDOFF.md`, `00_meta/DASHBOARD.md` (or whatever's the index), maybe `scripts/git-hooks/pre-commit`.

**Substeps:**
1. **Rewrite HANDOFF.md** to reflect current state (Phase 22-AH shipped, Phase 22-AI deferred pending wires diagnosis, tyrant audit signed, remediation underway).
2. **Backfill STATUS.md** with the missing 51 batch entries from Phase 22-AB-fix → Phase 22-AH (one-liner each).
3. **Mechanism for STATUS discipline:** add a pre-commit hook line that warns (not blocks) if a Lane B commit doesn't touch `00_meta/STATUS.md`. Soft nudge, not gate.
4. **DASHBOARD-surfaces-AUDIT pattern:** at minimum, write a section header in DASHBOARD that points to `AUDIT/` priority queue with the live count of unchecked action items. Better: a script that scans AUDIT for `- [ ]` and counts open vs done.

**Risk:** Documentation work + one soft hook line. Zero functional risk.

---

## Phase 7 — Cleanup pass

**Closes findings:** P1 #7 (cosmetic — if Phase 4 = option B/C, monolith stays but cleanup still happens), P2 #14, P2 #15, P3 #16.

**Substeps:**
1. **`06_themes/` → `06_motifs/` rename** in an atomic batch (folder rename + `type:` field rewrite + build script update + dropdown labels). Per HOW-WE-WORK §6 this is queued; ship it.
2. **Remove `console.*` from happy-path handlers** in `src/js/` (~28 calls). Keep diagnostic ones gated behind `_forgeDebug.LOG` flag. Premium SaaS bar.
3. **Resolve or remove the 3 TODO/FIXME markers** in `src/js/` (`app.js` x2, `forge.js` x1).
4. **Fix HOW-WE-WORK §6 line 122** stale claim about build_data.py lens awareness. One-line edit.

**Risk:** Mostly cosmetic. The motifs rename is the largest blast radius — done atomically with the build script update.

---

## What's explicitly NOT in this plan (preserve list)

Per John's constraint #1:

- ✅ Calendar registry (11 calendars)
- ✅ Bottom-bar canonical-class architecture
- ✅ Two-tier pivot (Greg-0 always + epoch secondary)
- ✅ Vertical density slider primitive
- ✅ LOCK toggle (zoom-density linkage)
- ✅ DATE IN / DATE OUT / FOCUS group
- ✅ dating_basis B1–B7 framework
- ✅ Side-panel ellipsis fix
- ✅ Cross-folder click popup
- ✅ Side-panel hideTip-on-render fix
- ✅ All baked STYLE-panel defaults
- ✅ All 26+ existing lenses

These are FOUNDATION work that lands stays.

---

## LAW / JUDICIARY lens — forward note (added per John 2026-05-25)

John raised during plan signoff: *"i want to add 'judiciary or LAW' to our lenses — meaning absorbing law books the same way we will do (did before) with all scriptures, this crossover will be gold."*

**Forward note (not actioned in this remediation):**
- The lens fits the existing pattern (numbered folder, `type: ` schema, build_data.py entry, type-aware dropdown).
- Likely lens number: 30 or 32 (depending on whether 31 = consciousness-figure is locked).
- Type candidates: `legal-code`, `law-tradition`, or just `law` (consistent with `philosophy` / `mathematics` / `medicine` already in the 29 types).
- Cross-tradition crossover sources to investigate at ingest time: Code of Hammurabi (~1750 BCE) · Mosaic Law (Torah) · Manusmṛti · Twelve Tables · Roman jus civile · Justinian Codex · Sharia / fiqh schools · canon law (CIC) · common law / Magna Carta · the US Constitution · UDHR · contemporary international human rights instruments.
- **Action:** queued for an ONTOLOGY-RATIONALE doc once the layered-rebuild question (Phase 4) is decided and Phase 2–3 foundation is locked. New rationale doc dated whenever it ships; existing `00_meta/ONTOLOGY-RATIONALE-2026-05-18.md` and `2026-05-19.md` remain append-only.

---

## Execution order locked

```
Phase 1 (this commit)
 ↓
Phase 2 (safety net — additive, low risk, ship NOW)
 ↓
Phase 5 (live regressions + DOGMA violation — small surgical fixes)
 ↓
Phase 6 (STATUS / HANDOFF / DASHBOARD discipline)
 ↓
Phase 3 (Lane A content drain — runs alongside, lower urgency)
 ↓
⚠️ Phase 4 — REQUIRES JOHN DECISION (do not start without explicit go)
 ↓
Phase 7 (cleanup pass)
 ↓
LAW lens (forward — separate, after Phase 4 settles)
```

Phases 2, 5, 6 are non-destructive and can ship back-to-back this session.
Phase 3 is Lane A and runs as content batches.
Phase 4 is the only phase that requires John's explicit call before starting.
Phase 7 ships when 2/5/6 are stable.

— end of plan, locked 2026-05-25.
