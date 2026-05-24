# TYRANT-MODE AUDIT — FINDINGS

**Date:** 2026-05-25
**Triggered by:** John — *"Agent failing hard to be solid, and build the bulletproof tech structure for the project ambition. Get in TYRANT MODE with goblins audit and come back tell me your assessment, 0 tolerance."*
**Method:** Five parallel read-only audit goblins dispatched across five axes:
1. **CORRECTNESS-GOBLIN** — build-pipeline integrity (hook, lint, linkcheck, build_data gates)
2. **CANONICAL-GOBLIN** — UX canonical-primitive respect (SEVERITY DOGMA continuity check)
3. **STRUCTURE-GOBLIN** — ontology + wiring integrity across 18.5k nodes
4. **AMBITION-GOBLIN** — promise-vs-shipped gap (Forge rebuild spec, Premium SaaS bar, HANDOFF freshness)
5. **PROCESS-GOBLIN** — agent + workflow discipline since SEVERITY DOGMA instated 2026-05-24

**Status:** Append-only after sign-off, same convention as `ONTOLOGY-RATIONALE-*` docs (HOW-WE-WORK §9). Future overrides require a NEW dated audit doc, never edits to this one.

**Vault state at audit time:** ~18,517 markdown nodes · 4,646 files scanned by linkcheck · 38,218 LOC `src/js/` · 9,043 LOC `src/styles/app.css`.

---

## Severity table

| # | Finding | P-level | Goblin | Evidence anchor |
|---|---|---|---|---|
| 1 | WIRING LAW shipping violated (594 dead targets / 752–773 occurrences) | **P0** | STRUCTURE | `99_ingest/audit_dead.txt`; `linkcheck.py` output |
| 2 | CODEX §IV source-tier mandate ~0% enforced | **P0** | STRUCTURE | sampled `03_deities/osiris.md`, all 15 sampled `21_theology/` |
| 3 | `lint_yaml.py` validates only 7 of 29 node-type categories | P1 | CORRECTNESS | `lint_yaml.py:40–48` vs `build_data.py:21–62` |
| 4 | Pre-commit hook never runs `lint_yaml.py` or `linkcheck.py` | P1 | CORRECTNESS | `scripts/git-hooks/pre-commit:1–131` |
| 5 | Dup-ID gate is post-commit, not pre-commit; soft escape hatch `ATLAS_ALLOW_DUP_ID=1` | P1 | CORRECTNESS | `build_data.py:1158–1174` (esp. line 1171) |
| 6 | Forge rebuild Phase 6 ("TAIL POLISH") never started — replaced by 41-commit Phase 22 timeline sidetrack | P1 | AMBITION | `AUDIT/forge-rebuild-layered-spec-2026-05-20.md §1`; commits ba78863→bbff608, then 22-M→22-AH |
| 7 | `forge.js` monolith (8,577 LOC) never decomposed per rebuild spec; `app.js` 10,749 LOC; `scripture-texts.js` 11,697 LOC; `app.css` 9,043 LOC | P1 | AMBITION | `src/js/views/forge.js`; `src/js/app.js`; `src/data/scripture-texts.js` |
| 8 | STATUS log silent since SEVERITY DOGMA: **52 commits, 1 STATUS entry** (52:1 ratio) | P1 | PROCESS | `00_meta/STATUS.md` vs `git log --since=2026-05-24` |
| 9 | `HANDOFF.md` stale by 7 days — promises "John tuning Forge map view, next agent bakes JSON into PARAM_DEFAULTS"; actual work pivoted to Phase 22 timeline without documenting pivot | P1 | AMBITION | `00_meta/HANDOFF.md` lines 14–16 |
| 10 | AUDIT/ folder accumulates faster than drains — 72 docs, 8 shipped (11%), 47 unchecked action items, `05_priority_queue.md` 11 days stale | P1 | AMBITION | `ls AUDIT/`; `grep -h "^- \[ \]" AUDIT/*.md` |
| 11 | Phase 22 oscillates not converges: 4 reverts + 4 serial-fix commits in 41-commit window (~19.5% reversal rate); 22-AB-fix→fix4 = the SEVERITY DOGMA forging incident | P1 | PROCESS | commits 70d546d, 1c5c3ac, bc59259; 79e2638→ac2913d→aa4a223→955bba2 |
| 12 | One live SEVERITY DOGMA violation in shipped code: `margin-bottom:14px` inline on canonical `.sr-atlas-btn` | P2 | CANONICAL | `src/js/views/scripture-reader.js:493` vs `src/styles/app.css:5774` |
| 13 | No dead-link baseline / regression detection — count is a snapshot, never compared | P2 | CORRECTNESS | `linkcheck.py` lacks `--baseline` mode |
| 14 | `06_themes/` → `06_motifs/` rename still pending (folder, type field, build_data.py:28, dropdown all on `theme`) | P2 | STRUCTURE | `HOW-WE-WORK.md:96`; `ONTOLOGY.md:10`; `build_data.py:28` |
| 15 | 28× `console.*` calls + 3× `TODO/FIXME` left in shipped `src/js/` — Premium SaaS bar not cleared | P2 | AMBITION | grep on `src/js/` tree |
| 16 | HOW-WE-WORK §6 line 122 lies: "build_data.py does not yet recognize lenses 08 + 18–26" — actually `build_data.py:21–62` recognizes all 29 lenses (the doc is stale, the code is current) | P3 | STRUCTURE | `HOW-WE-WORK.md:122` vs `build_data.py:21–62` |

---

## Findings (full evidence)

### P0 — THE GRAPH IS LYING

#### 1. WIRING LAW is shipping violated, not enforced

- **`linkcheck.py`** reports 594 distinct dead targets across 752 occurrences in 4,646 files (PROCESS-GOBLIN ran the same scan in a later window and saw 773 — the count drifts because nothing pins it).
- **`lint_yaml.py`** reports 806 unresolved-wikilink warnings + 1 ERROR + 8 schema/date warnings.
- Tier-1 missing-node sample (genuine, not template-noise):
  - `phase-4-040-quran` — 4 refs
  - `ra-egyptian` — 4 refs
  - `muhammad` — 3 refs
  - `phase-8-002-popol-vuh` — referenced not stubbed
  - `phase-6-002-florentine-codex` — **mis-slugged**; the real document is `phase-8-004-florentine-codex-sahagun`
  - `sheikh-farid` — 3 refs
  - `guru-arjan-dev-ji` — 3 refs
  - `ammit-devourer` — 3 refs
  - `tradition-afro-diasporic` — 3 refs
- Bucket breakdown (STRUCTURE-GOBLIN):
  - (a) Typos/malformed placeholders (`[wikilink]`, `[wikilinks]`, `[document-slug]`): **20 occurrences** — build-fixable
  - (b) Genuinely missing nodes that should be stubbed: **732 occurrences across 574 targets**
  - (c) Decorative prose wikilinks needing backtick conversion: 0 identified
- **The lie:** HOW-WE-WORK §5 cardinal rule #4: *"every `[wikilink]` must point to a real node before commit."* The pre-commit hook does not enforce this. Dead wikilinks ship at will.

#### 2. CODEX §IV source-tier mandate is unenforced (~0% compliance)

- CODEX requires every cross-tradition edge carry `type:` + `source:` + `source-tier:` (T1/T2/T3/T4) + `notes:`.
- Reality: only ~5 `source-tier:` occurrences in the entire vault, mostly in AUDIT docs not active nodes.
- Sampled `03_deities/osiris.md` syncretic-edges: zero tier metadata.
- Sampled all 15 `21_theology/` doctrine nodes: zero tier metadata.
- **The lie:** the disclaimer-machine CODEX promises to future readers/subscribers does not function. Cross-tradition claims ship without provenance. Premium SaaS pivot cannot honor this.

---

### P1 — THE SAFETY NET HAS HOLES

#### 3. `lint_yaml.py` validates only 7 of 29 node-type categories

- `lint_yaml.py:40–48` NODE_DIRS hardcoded to original 16 lenses' 7 types.
- `build_data.py:21–62` recognizes 29 types — the 10 new lenses (2026-05-18) at lines 40–49, the 3 lenses (2026-05-19) at 51–53, consciousness-figure at 61.
- **22 type categories silently pass through lint:** alchemy, alphabet, astronomy, attire, calendar-system, consciousness-figure, divination-system, doctrine, exchange-network, language, mathematics, medicine, moral, music, philosophy, place, practice, relic, ritual, sacred-site, substance, technology.
- **The lie:** `lint_yaml.py` docstring claims to enforce schema invariants for "Codex Atlas vault nodes." It only covers 24% of the type surface.

#### 4. Pre-commit hook never runs `lint_yaml.py` or `linkcheck.py`

- `scripts/git-hooks/pre-commit:1–131` — checks JS syntax + Lane A/B mixing. **No invocation of `lint_yaml.py`, `linkcheck.py`, or `validate_*.py` anywhere.**
- The 806 wikilink warnings landed in the most recent commit without the hook firing.
- **The lie:** HOW-WE-WORK §5.4 promises the wiring law as a cardinal rule. The mechanism that would enforce it does not exist.

#### 5. Dup-ID check is post-commit, not pre-commit; soft escape hatch

- `build_data.py:1158–1174` raises `SystemExit` on duplicate slug — but this fires at build time, not in the hook.
- `build_data.py:1171` reads `ATLAS_ALLOW_DUP_ID=1` and downgrades the hard-fail to a warning. Undocumented in HOW-WE-WORK or AGENTS. No audit log when used.
- **The lie:** HOW-WE-WORK §5.3 says *"the pre-commit hook will refuse"* dup-IDs. It will not — the build script does, after the commit has already landed.

#### 6. Forge rebuild Phase 6 abandoned for 41-commit Phase 22 sidetrack

- `AUDIT/forge-rebuild-layered-spec-2026-05-20.md §1` promises six phases: Panel-delete → NODE → BEHAVIORS → WIRES → FX → MANAGEMENT → **TAIL POLISH ("runs to backlog exhaustion")**.
- Phases 0–5 shipped 2026-05-20 (commits ba78863 → bbff608). Acceptance gates passed.
- **Phase 6 never started.** The next 41 commits (Phase 22-M through 22-AH, 2026-05-19 → 2026-05-25) are timeline-chrome polish: bottom-bar height, BG sizing, calendar tick density. None close the rebuild spec's Phase 6 deliverables (hull jitter, custom cursor, label hierarchy, camera tuning).
- **The lie:** the project is running two overlapping specs under two labels. No agent knows which is the active mandate.

#### 7. Monoliths never decomposed — Premium SaaS bar not cleared

- `src/js/views/forge.js`: **8,577 LOC** single file. The layered-rebuild spec promised decomposition into `src/js/forge/{node,behaviors,wires,fx,management}.js`. Never happened.
- `src/js/app.js`: 10,749 LOC.
- `src/data/scripture-texts.js`: 11,697 LOC.
- `src/styles/app.css`: 9,043 LOC.
- `src/js/views/pantheon-v2.js`: 2,676 LOC.
- Per `project_premium_saas_shift.md` (2026-05-15), "app code must clear a higher bar." It does not.

#### 8. STATUS log silent since SEVERITY DOGMA — 52:1 ratio

- Commits since 2026-05-24 SEVERITY DOGMA instated: **52**.
- STATUS.md entries dated 2026-05-24 or later: **1** (the dogma memo itself).
- Expected per HOW-WE-WORK §11: ~52 (one per batch).
- Last 3 batches scored by PROCESS-GOBLIN against §11 checklist: 22-AH = 5/7, 22-AG = 5/7, 22-AF = 5/7. All three missed the STATUS entry.
- **The lie:** §11 promises "every batch summarized at the top of STATUS.md." The mechanism collapsed within 24 hours of the dogma being instated. Soft-discipline failed; this is how slow collapse begins.

#### 9. HANDOFF.md is stale by 7 days

- `00_meta/HANDOFF.md` lines 14–16: *"John is working on the Forge map view (visual tuning, dev panel). When ready, he will EXPORT the tuned JSON from the dev panel. The next agent's job: Bake the EXPORT JSON into PARAM_DEFAULTS in src/js/views/forge.js (Lane B)."*
- Written 2026-05-18. No subsequent commit references `PARAM_DEFAULTS` bake. Instead, 41× Phase 22 timeline commits 2026-05-19 → 2026-05-25.
- **The lie:** next-session pickup (per HOW-WE-WORK §8 table) reads this file and acts on stale instructions.

#### 10. AUDIT/ accumulates faster than drains

- 72 audit documents total.
- 8 marked shipped/applied/done (11% completion).
- 47 unchecked `- [ ]` action items across the folder.
- 49 of 72 filed in last 7 days (rate: ~7 docs/day).
- `AUDIT/05_priority_queue.md`: 11 days stale.
- `AUDIT/forge-robustness-01..05-2026-05-20.md`: lockdown analysis filed, not actioned, not visible in DASHBOARD.
- **The lie:** DASHBOARD does not surface AUDIT issues. Investigation agents never see them. Audits become a write-only graveyard.

#### 11. Phase 22 oscillates, doesn't converge

- 41-commit window (22-M → 22-AH):
  - **4 reverts:** 70d546d (22-Q BG cover-floor), 1c5c3ac + bc59259 (21Y/21Z label-aware fit re-attempted), one in BG sizing chain.
  - **4 serial-fix commits:** 79e2638 → ac2913d → aa4a223 → 955bba2 (Phase 22-AB-fix through fix4 — same toolbar-height problem).
  - **Reversal rate: 8/41 ≈ 19.5%.**
- Phase 22-AB-fix series **is** the SEVERITY DOGMA forging incident:
  - Strike 1 (`79e2638`): defending the model against John's screenshot instead of re-deriving.
  - Strike 2 (`ac2913d`): inline `height: 23px` patch mimicking canonical `.forge-fxpanel-btn`.
  - Strike 3 (`aa4a223`): same root cause repeated; `padding: 5px 10px` inline patch instead of canonical class edit.
  - Termination fired. Fix4 (`955bba2`) by a fresh agent shipped the canonical fix (declarative HTML + `body.fv-layout-timeline` + `.fv-timeline-only` gates + canonical `.forge-fxpanel-btn`). **The dogma worked.**
- The system caught a bad batch; the system did not prevent the oscillating polish-iteration pattern that produced it. That pattern lives on in the BG-sizing chain (22-Q → 22-R → 22-S → 22-T → 22-U → 22-V = 6 commits trying 4 different rules, restoring, branching off, restoring again).

---

### P2 — REMAINING DRIFT

#### 12. One live SEVERITY DOGMA violation in shipped code

- `src/js/views/scripture-reader.js:493`: `` <button class="sr-atlas-btn" style="margin-bottom:14px"> ``
- Canonical `.sr-atlas-btn` declared at `src/styles/app.css:5774` with full padding/border/font/color/hover — but margin-bottom is forked inline.
- Strike category: duplicating canonical primitives with inline styles (DOGMA strike #2).
- **Otherwise the dogma pattern is correctly applied.** The CANONICAL-GOBLIN verified `timeline-chrome.js:714–715` (ephemeral tooltip math — acceptable), `forge.js:3025–3026` (canvas/WebGPU dynamic sizing — acceptable). The toolbar fix (Phase 22-AB-fix4) was clean and canonical.

#### 13. No dead-link baseline / regression detection

- `linkcheck.py` writes `99_ingest/audit_dead.txt` as a moment-in-time snapshot.
- No baseline file, no CI diff, no regression check.
- A future commit could add 50 dead links without triggering any failure.

#### 14. `06_themes/` → `06_motifs/` rename still pending

- Folder: still `06_themes/`.
- YAML `type:` field: still `theme`.
- `build_data.py:28`: `"theme": ["06_themes"]`.
- `HOW-WE-WORK.md:96` flags the pending rename.
- `ONTOLOGY.md:10` flags it.
- No commit scheduled.

#### 15. Premium SaaS quality bar — `console.*` + TODO/FIXME residue

- 28× `console.log|warn|error` in `src/js/` tree. 7+ in happy-path handlers (should not fire in production).
- 3× `TODO|FIXME|HACK|XXX` markers in `src/js/`:
  - `app.js`: "Phase 2 TODO: drop legacy"
  - `app.js`: "TODO: wire when preset consolidation lands"
  - `forge.js`: dim-model A2 side note
- Plus dead branches and commented-out blocks (CANONICAL-GOBLIN did not enumerate; AMBITION-GOBLIN flagged the pattern).

---

### P3 — STALE DOCUMENTATION

#### 16. HOW-WE-WORK §6 line 122 lies

- The line claims: *"⚠️ Build-script awareness gap: lenses 08 + 18–26 are real on disk but build_data.py does not yet recognize them."*
- Reality: `build_data.py:21–62` recognizes all 29 lenses including 08, 18–26, 27 (attire), 28 (exchange-networks), 29 (technology), 31 (consciousness-figure).
- The doc is stale; the code is current. This is the inverse of the more common pattern, but it still misleads agents on cast.

---

## What does hold (load-bearing facts the next agent must not regress)

- **Lane separation is enforced.** `scripts/git-hooks/pre-commit` refuses Lane A↔B mixing.
- **`--no-verify` count across all history: ZERO.** The hook has never been bypassed.
- **Slug uniqueness holds.** `grep "^id:" -r | sort | uniq -d` returns nothing.
- **Slot hygiene is clean.** `ACTIVE-UX.md` and `ACTIVE-CONTENT.md` show no stale claims; last in-flight row timestamped 2026-05-21 FINISHED.
- **Lens type-field compliance is 100%** in sampled folders (`08_*`, `18_*`, `21_*`, `24_*`, `06_*`). The 29-lens spine is ontologically sound at the type level.
- **`build_data.py` is NOT lagging.** All 29 lenses are recognized (this contradicts the stale HOW-WE-WORK §6 warning — see finding 16).
- **No duplicate-ID violations in the live vault.**
- **SEVERITY DOGMA was invoked correctly on the 22-AB agent.** Three strikes counted, agent terminated, fresh agent shipped canonical fix. The protocol worked once.
- **Bucket routing is correct** where edge fields are present (sampled `parallels:`, `influences:`, `equivalents:`, `attested-in:`).

---

## Sign-off

This document is **draft** until John signs off. Once signed (line below filled in), it becomes append-only per HOW-WE-WORK §9. Future findings that supersede it require a new dated audit doc, not edits here.

```
Signed off by John: ✓ approved via chat 2026-05-25 — "sure do everything"
Date: 2026-05-25
```

**Status post-signoff:** APPEND-ONLY per HOW-WE-WORK §9. Future findings that supersede this require a NEW dated audit doc, never edits here.

Remediation plan locked against this evidence base: see `AUDIT/2026-05-25-tyrant-remediation-plan.md`.
