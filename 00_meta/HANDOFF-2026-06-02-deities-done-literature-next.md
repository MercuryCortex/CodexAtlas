# HANDOFF — Deity layer is PRODUCT-GRADE (9/9). Next: LITERATURE (the ROOT).

**Date:** 2026-06-02
**Status:** Deity layer CLOSED at 9/9 product-grade. The sweep advances to **literature** (`02_documents/`), per John's ratified order: *deities → literature (the ROOT) → figures → the rest flows.*

---

## 1. What "product-grade" means now (the bar to re-hit for every future layer)

The deity layer passes all 9 rows of the objective scorecard
(`scripts/audit_deity_quality.py` → `src/data/deity-product-grade.json`,
surfaced live in **DEV → Overview**):

1. **Graph-connected** — every node has ≥1 structured edge in or out (0 orphans)
2. **Has home tradition** — 100%, and it is **SINGULAR** (one origin family)
3. **Has dates** — 100%
4. **Sourced** — 0 unsourced (every node has ≥1 T1 ref block)
5. **Metadata depth** — 0 stubs/partials
6. **Complete schema** — 0 missing domains/gender/role
7. **No thin bodies** — every body ≥400 chars of real prose
8. **No duplicates**
9. **Coverage** — the curated worklist is empty

Deities: **889 nodes, 23,463 edges.** All 718→889 grew this session-arc with zero loosening of the bar.

---

## 2. THE PROVEN PLAYBOOK (use this verbatim for literature + persons)

This is the method that filled 71 moderate deities at **0 MAJOR across every batch**. It is contamination-safe and audit-clean. Do not deviate.

1. **Build the worklist first.** A curated roster (per T1 scholarship) checked against the vault = the single source of truth for coverage. Keep ONE such file; do not maintain a parallel hand-list (loop-detection rule #10).
2. **Write in the MAIN THREAD, batch by batch** (~8–16 nodes per batch, grouped by tradition/corpus). **Never** dispatch parallel agents to *write* files — the 2026-05-29 contamination incident (concurrent agents wipe untracked new files) is why. Agents are READ-ONLY here.
3. **Per batch, in order:**
   a. Dupe-guard: confirm no slug already exists.
   b. Verify every `[[wikilink]]` wire-target EXISTS before writing (a target that's bare prose or a non-existent slug → either a dead link or a graph-orphan). Bare-prose targets like `"Chloris (Greek)"` do NOT count as edges — if a node's *only* wire is bare prose, it becomes a graph-orphan.
   c. `python3 build_data.py` — watch for KeyError (a new family/wedge needs `FAMILY_COLORS` + `TRADITION_FAMILY_ORDER` entries).
   d. `python3 linkcheck.py --baseline` — must hold (exit 0).
   e. `python3 lint_yaml.py` — 0 errors.
   f. Machine-verify the **wedge** (family) for any edge-case node (read it back from `data.js`) — membership-vs-wire correctness is non-negotiable.
   g. **Commit Lane A immediately** (tracked files survive; untracked do not).
   h. Spawn a **read-only fact-check agent** (general-purpose, `run_in_background`) on the just-committed batch. Continue writing the next batch while it grades.
   i. Apply its MINOR fixes; **decline agent suggestions that are themselves wrong** (e.g. the "Karl J. Trübner" case — verify before applying). 0 MAJOR is the gate.
4. **Lane discipline:** content (`02_documents/`, `03_deities/`, `AUDIT/`) = Lane A; `scripts/`, `src/`, `build_data.py`, `index.html` = Lane B. Never mix in one commit. `data.js` is gitignored (build artifact).
5. **Commit message ends with:** `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

The read-only grade agent is the keystone — it caught real errors (Dumuzi parentage, Ares double-encoding, ordinal checks) and validated the hard membership calls, while never touching the tree.

---

## 3. MEMBERSHIP-VS-WIRE — how it was applied to deities (carry forward)

Per `00_meta/MEMBERSHIP-AND-WIRES.md` (cardinal rule #12):

- **`tradition:` is SINGULAR = the ORIGIN family. It sets the wedge.** Period.
- **Cross-tradition reach = WIRES** (`syncretic-edges` with `appearance-tier` / `role-in-context`), carried by the transmitting doc/author. The 21-type edge vocab already covers it (`direct-borrowing`, `interpretatio-nominal`, `scholarly-parallel`, `constituent-of`, …).
- **The hard syncretic cases proved the model.** Daikokuten's home = **Japanese Buddhism** (origin: the esoteric Mahākāla cult), with his Shinto Ōkuninushi identity as a WIRE — a fact-check agent explicitly confirmed "do not reclassify to Shinto." Sakpata = Babalú-Ayé is **wired, not merged**. When origin is genuinely where a *distinct named figure crystallized*, that is home; everything downstream is wire.
- **Thin/reconstructed material gets HEDGED, not asserted** (Belobog flagged largely-reconstructed; Khors/Simargl Iranian-loan tiered T2). Graders reward this; it is the integrity-maximizing default.

---

## 4. LITERATURE PHASE — the ratified rules (start here)

Target: `02_documents/` (scripture + texts). Same playbook (§2), same product-grade bar (§1) adapted to documents, PLUS:

- **SCRIPTURE EXCEPTION (ratified by John, in MEMBERSHIP-AND-WIRES.md):** a scripture/text gets a **SINGULAR origin tradition** for its wedge (the tradition that PRODUCED it) — BUT **`canonical-corpus:` stays MULTI-VALUED** (a separate axis: a book CAN be canon in several living canons). Origin ≠ canon-membership. Do NOT collapse canonical-corpus into singular.
- Scripture is the **ROOT of the Atlas** (project north-star, 2026-05-30): the `family → corpus → book → LENS → READ` drilldown is the primary navigation, and every other chart (Pantheon/Timeline/Events/Personae) is a LENS on the scripture corpus. The deity layer we just finished is one such lens. Treat the literature layer as the substrate the deities hang from.
- Expand toward what scholarship recognizes (apocrypha, recensions, source-critical strata), **not** toward a Protestant 66-book canon.
- The cross-tradition wiring (e.g. Genesis-1 `the deep` → Tiamat · Nun · Ginnungagap) is the MASSIVE-WINS payload — surface it as READ-surface parallels, carried as wires.

---

## 5. Known deferred (non-blocking) items

- **Edge-type cosmetic:** ~12 African/genealogy edges use `constituent-of` where `associated-with` (independent-deity association) would be tighter. Three separate grade agents flagged this as "a metadata-typing nicety, not a factual error." Deferred to a future controlled-vocab pass; it does not affect wedge, connectivity, or product-grade. Logged here so it is not silently dropped.
- **Step-B appearance-wire construction** from the `tradition-appearances:` worklists (the singularized cross-family nodes left a reversible breadcrumb) — build `appearance-tier`/`role-in-context` edges. Can run in parallel with literature.
- **Full `tradition_family()→dict` cut** stays LAST, once every layer's tradition is singular.

---

*The deity layer is the most robust thing in the vault. Hold this bar for literature and figures, and the rest flows.*
