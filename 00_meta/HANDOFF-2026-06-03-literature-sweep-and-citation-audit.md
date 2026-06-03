# HANDOFF — Literature sweep + the citation-integrity discovery (2026-06-03)

**Read this first, then `00_meta/HOW-WE-WORK.md` (operating rules) and the top entry of `00_meta/STATUS.md` (full session log).** This is a clean, fully-resumable state: everything committed (38 commits this session), all gates green, working tree clean, site live at http://localhost:8742.

---

## 0. TL;DR — what to do first

1. **PRIORITY 1 — finish the citation-integrity sweep (D5 below).** A discovery this session: ~5–7% of references in older prior-agent `full` document nodes are *fabricated/conflated* (real scholar, wrong/invented title). 45 of ~116 older nodes audited + ~16 fixed; **~71 older `full` docs remain un-audited.** This is finite, mechanical, fatigue-safe, and **must be done before literature can honestly be called product-grade** (the scorecard checks ref *presence*, not *validity*).
2. **PRIORITY 2 — clear the last ~32 stubs** (worklist in §3). Same proven playbook.
3. Both reach the same milestone: **literature 7/7 product-grade** (the deity layer's 9/9 equivalent). Then → figures.

Run `python3 scripts/audit_document_quality.py` for the live scorecard. As of session end: **full 180, stubs 32, missing-wedge 33, missing-dates 9, unsourced 25, thin 23, dupes 0.** (Up from full 117 / stubs 80 at session start.)

---

## 1. THE ROADMAP (John's north star: *scripture is the root; every chart is a lens on it*)

```
 DEITIES ──► LITERATURE ──► FIGURES ──► THE REST ──► THE READ SURFACE
 (9/9 ✅)    (◄ HERE,        (persons,   (events/      (annotated scripture +
             ~5/7)           1217)       themes…)      cross-tradition parallel
                                                       panel = the MASSIVE-WINS payoff)
```

**Decision points (flag John; don't decide silently):**
- **D1 — literature hits 7/7** → move to figures / keep polishing / build the READ surface.
- **D2 — Jainism's wedge:** Jain texts + deities currently all fold into the **Vedic** family (no Jain family in the engine). Vault-wide structural call.
- **D3 — `black-elk` person-wedge** (in Christian wedge via "Oglala Lakota / Roman Catholicism" multi-tradition string) — figures-phase membership-vs-wire pass.
- **D4 — "full" vs "good-enough":** many nodes are `metadata` (green on the 7 rows but not deep `full`).
- **D5 — the citation sweep** (this session's discovery) — a prerequisite for honest product-grade; see §2.

---

## 2. 🚨 PRIORITY 1 — the citation-integrity sweep (D5)

**The discovery.** Promoting prior-agent "false stubs" surfaced fabricated bibliographies. A read-only audit of 45 nodes found the rate is **~5–7% of references**, with one consistent signature:

> **A REAL scholar welded to a WRONG or non-existent book's title.** Author / series / year are usually right; the *title* is invented or borrowed from a different book. (e.g. Ellwood's real book isn't "A New Religion in Japan"; Kallander's is "Salvation through Dissent"; "The Image of Dumuzi" is Wiggermann's not Alster's; Beaulieu CM23 is "The Pantheon of Uruk" not "The Cult of Inanna at Uruk".)

**Three load-bearing facts about the defect:**
1. **Locus = the YAML `refs:` block.** The body `## Refs` list is often *correct* for the same work → a YAML-title ≠ body-title diff catches a free subset.
2. **Load-bearing critical editions are ALWAYS clean.** The rot is only in *secondary/supporting* refs.
3. **This-session writes + the prior literature-root agent's Pentateuch graded clean.** The defect is specifically in OLDER "goblin-batch" content (the `goblin-*` 2026-05-19/20/25 nodes).

**Completion method (efficient, in order):**
1. **Mechanical pre-filter (cheap, do first):** write a read-only script that, per `02_documents` node, extracts each YAML `refs:` `title:` and compares to the body `## Refs` titles for the same author; flag mismatches. Catches the "Aten Murnane / 4 Maccabees" subset instantly, vault-wide, no grading.
2. **Read-only grader fleet** over the remaining **~71 un-audited older `full` docs** (those NOT touched this session and NOT already audited — see the audited list in STATUS). Batch 8 nodes/grader ≈ **9 runs**. Use the audit-grader brief verbatim (it's in the spawned-agent prompts this session; gist: "verify each ref independently; classify REAL / WRONG-PUBLISHER / CONFLATED / FABRICATED / UNVERIFIABLE; flag the real-scholar-wrong-title signature").
3. **Fix each finding from the grader's verified correction** (mechanical, low-error — exactly what was done this session). Gate (build/linkcheck/lint) + commit per batch.

**Already fixed this session (~16 refs):** the 4 false-stub bibliographies (Mirabai, Bon Kangyur, Ofudesaki, Donggyeong — 10 refs), 4 Maccabees, the Maya Harrison ref (mine), and 4 ANE nodes (Enheduanna-Helle, Aten-Murnane, Inanna-Alster + Inanna-Beaulieu, Memphite-Clifford). Commits `14552e16`, `9762d47b`, `cf05171e`.

**Nodes already audited & clean** (don't re-grade): document-{genesis,exodus,leviticus,numbers,deuteronomy,romans}, phase-1-006-atrahasis, phase-1-008-enuma-elish, phase-1-010-book-of-the-dead (1 soft Lapp flag), phase-1-013-baal-cycle, phase-1-028-kumarbi-cycle, phase-1-036-amduat, phase-2-{003,010,018,022,030,034,043}, phase-3-{003,007,011,015,019,023,028}, phase-4-{011,062,070}, phase-1-{009,016,031}. (Plus the 4 fixed ANE nodes.)

---

## 3. PRIORITY 2 — the last ~32 stubs (worklist by cluster)

Genuine thin stubs needing **fresh writes** (your writes grade clean; the proven playbook below):
- **Buddhist:** mahavamsa, divyavadana, gandavyuha-sutra (note: part of the Avataṃsaka, phase-4-102 — handle as a distinct independently-circulating sūtra, eyeball dup-check), dunhuang-manuscripts, ajanta/ellora/longmen/bagan-stone-inscriptions.
- **Chinese admin/architecture:** da-ming-huidian, da-qing-huidian, ying-zao-fa-shi.
- **Indian:** shilpa-shastra, vastu-shastra, surya-shataka, rajaraja-i-thanjavur-inscriptions, madala-panji.
- **Japanese/Korean:** izumo-no-kuni-fudoki, shoku-nihongi, gukjo-orye-ui.
- **Christian/Byzantine:** gadla-lalibela, procopius-de-aedificiis, sinai-library-corpus, phase-5-021-cusa-de-docta-ignorantia.
- **Andean:** cobo-historia-del-nuevo-mundo.
- **Law:** magna-carta (the forward-queued LAW lens).
- **SE Asian:** karangtengah-inscription-824.
- **Modern religious-studies (status `partial`/`stub` WITH refs — DRAFTS, treat as false-stubs → REBUILD refs + grade, do NOT trust their bibliographies):** phase-7-013-eliade, phase-7-014-bellah, phase-7-022-hick, phase-6-026-jacob-frank, phase-6-051-mylius, phase-7-047-blake.

⚠️ **"False stubs" are NOT free wins.** Content-rich nodes mislabeled stub/partial carry fabricated bibliographies (proven: the 4 promoted ones had 10 fabricated refs). Each promotion needs a ref-rebuild + grade.

---

## 4. THE PROVEN PLAYBOOK (used all session, 0 MAJOR after fixes every batch)

1. **Worklist first** (the scorecard + this handoff = the source of truth).
2. **Write in the MAIN THREAD, ~5 nodes/batch by tradition/corpus.** NEVER dispatch parallel agents to *write* (the 2026-05-29 contamination wipe). Agents are READ-ONLY (graders only).
3. **Per batch, in order:** (a) dupe-guard — enumerate ALL nodes for a text (the detector misses cross-romanization/cross-title synonyms: Tao-Te-Ching==Daodejing, Iliad==Homeric-Epics); (b) verify every `[[wikilink]]` target EXISTS (bare prose ≠ edge; Wiring Law); (c) `python3 build_data.py` (watch KeyError = new family needs FAMILY_COLORS + TRADITION_FAMILY_ORDER); (d) `python3 linkcheck.py --baseline` (exit 0); (e) `python3 lint_yaml.py` (0 errors); (f) machine-verify the **wedge** (family) in `data.js` for edge cases; (g) **commit Lane A immediately**; (h) spawn a **read-only grade agent** (general-purpose, run_in_background) on the committed batch — **0 *factual* MAJOR is the gate**; (i) apply MINORs, decline wrong agent suggestions.
4. **The grade gate is LOAD-BEARING** — it caught ~21 citation errors this session, including in *this agent's own writing* (the Maya Harrison conflation). Grade everything, including promotions.
5. **Membership-vs-wire** (cardinal #12, `MEMBERSHIP-AND-WIRES.md`): singular origin `tradition:` → wedge; cross-tradition reach = `appearance-tier` wires. Scripture exception: singular origin wedge BUT multi-valued `canonical-corpus`. Colonial-source convention: indigenous religion = home wedge, European authorship = qualifier/wire (e.g. Durán → Mesoamerican).
6. **Lane discipline:** content (`0N_*`) = Lane A; `scripts/`/`src/`/`build_*.py`/`index.html` = Lane B. Never mix in one commit (pre-commit hook enforces). `data.js` is gitignored.
7. **Structural-fix mindset (loop-detection):** when the same gap recurs, fix upstream, not per-node. (This session: the `date-composed` → `date-composed-earliest` field-rename greened 13 nodes in one mechanical pass.)

**Ratified standing instructions (don't re-ask):** T1-academic-default · conservative · T3/T4 mark alternatives · max-integrity · execute-don't-menu · never-let-me-pick-if-overlooking. John's cadence preference: **grind autonomously between forks; milestone-ping when a row goes green; STOP and lay out the choice only at a genuine fork (D1–D5).** He dislikes per-batch permission-asking AND silent grinding equally — give a heartbeat + clear forks.

---

## 5. SESSION SUMMARY (what landed, for context)

Onboarded as lead; deities were already 9/9. This session drove **literature** hard:
- **Astrology spine populated** (11 nodes, John-directed — his marquee cross-tradition demo). Mesopotamian→Hellenistic→India→Islam→Latin/Renaissance + the Pico anti-pole.
- **~15 graded literature batches:** Hebrew Bible · the great codices · Buddhist scripture · Mesoamerican/Andean primary sources · major orphaned scriptures (Tipiṭaka etc.) · Greco-Roman classics · early/medieval Christian · East Asian classics · indigenous-American (Iroquois Great Law tier-reframed) · Indian/Tamil/Jain · Maya epigraphy · 4 false-stub promotions.
- **The date-field structural sweep** (13 nodes).
- **The citation-integrity audit** (D5) — the big discovery; 45 nodes audited, ~16 fixed.
- **Fixed a site outage** for John (split IPv4/IPv6 server state on :8742 → one clean serve.py; cache-token bump).

Scorecard: stubs 80→32 · missing-wedge 77→33 · missing-dates 33→9 · unsourced 65→25 · full-status 117→180 · dupes green throughout.

---

## 6. TOOLING / POINTERS

- Live scorecard: `python3 scripts/audit_document_quality.py` (writes `src/data/document-product-grade.json`, surfaced in DEV → Overview).
- Gates: `python3 build_data.py` → `python3 linkcheck.py --baseline` → `python3 lint_yaml.py`.
- Site: `lsof -ti tcp:8742` should be ONE `serve.py`; if a duplicate node/python both bind :8742 → kill both, restart one (`nohup python3 scripts/serve.py 8742 &`), bump cache token in index.html. (Caused John's "can't open the site" this session.) **No git remote exists — local-only; John backs up to hard drive sporadically.**
- Full detail: `00_meta/STATUS.md` top entry (D5 log + completion plan). Rules: `00_meta/HOW-WE-WORK.md`. Membership model: `00_meta/MEMBERSHIP-AND-WIRES.md`.

*Clean break. The engine's warm but the operator's deep — fresh context will run the mechanical citation sweep + remaining stubs at top quality.*
