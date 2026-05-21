# Forge Deity Spine — Sentinel Findings Log

Lane A live audit running alongside the deity spine sweep (handle `deity-spine-sentinel`, started 2026-05-21). Scope: `03_deities/*` (676 files), batches of 10. This file is appended to per batch — most batches will produce a one-paragraph note; **systemic findings get their own section**.

---

## Batch 1 — abathur → aeshma (2026-05-21)

**Files:** abathur, abrasax, adamas-gnostic, adamastor, aditi, adonis, adonis-hellenistic, aegir-norse, aengus-og, aeshma.

**State on arrival:** 9 of 10 already at RANK A or close. Bodies rich, YAML well-populated, syncretic edges present and cited. Only ~5% of work in this batch was content-creation; ~95% was wikilink correctness and field-name discipline.

**Fixes applied:**

- `adamastor.md` — fixed `[[os-lusiadas]]` → `[[phase-6-041-camoes-os-lusiadas]]` (2 occurrences: YAML syncretic-edges target + body prose). The bare `os-lusiadas` slug would never resolve against `build_data.py`'s exact-id matcher; this was a silent dead link.
- `adonis.md` — three changes: (a) field name `domain:` → `domains:` (schema canonical is plural); (b) `date-earliest: -1400` → `period-active-earliest: -1400` + new `period-active-latest: 400` (schema canonical fields); (c) `[[persephone]]` → `[[persephone-greek]]` (persephone has no un-suffixed node); (d) added empty `attested-in:` populated with `[[phase-3-035-homeric-hymns]]` + `[[document-ezekiel]]`. NOTE: Adonis is barely in the Homeric Hymns; the canonical literary primary sources are Ovid *Metamorphoses* 10 (vault has only book 1 node), Theocritus *Idyll* 15, and Lucian *De Dea Syria* — none of which have dedicated nodes yet. The Ezekiel reference attests Tammuz (the Semitic name for the same figure) in 1st-millennium-BCE Israelite practice, so it is a legitimate cross-tradition attestation.
- `adonis-hellenistic.md` — populated empty `attested-in: []` with `[[document-ezekiel]]`.

**Flagged for John's decision: duplicate cluster.**

`adonis.md` (115 lines, status: metadata) and `adonis-hellenistic.md` (107 lines, status: metadata) cover effectively the same deity. The vault convention for ancient-Mediterranean dying-god clusters has been **per-tradition suffix** (e.g. `inanna-sumerian` ↔ `ishtar-akkadian` ↔ `astarte-canaanite` ↔ `aphrodite-greek`). Adonis is the Greek-Hellenistic reception of Tammuz; there is no separate "Phoenician Adonis" node distinct from "Greek Adonis" because the Greek cult name **IS** the Phoenician epithet (`ʾădōn` "lord"). The un-suffixed `adonis.md` and the suffixed `adonis-hellenistic.md` are therefore content-overlapping. Three options for resolution:

1. **Keep `adonis.md`, delete `adonis-hellenistic.md`** — un-suffixed slug matches `aphrodite-greek`'s convention only loosely (no `-greek` suffix). Lots of inbound wikilinks already point to `[[adonis]]`.
2. **Keep `adonis-hellenistic.md`, delete `adonis.md`** — suffixed slug clearer ontologically, but `-hellenistic` is an idiosyncratic suffix not used elsewhere in the vault.
3. **Rename `adonis.md` → `adonis-greek.md`** (matching `aphrodite-greek` convention), merge in any unique content from `adonis-hellenistic.md`, then delete `adonis-hellenistic.md`.

Recommendation: option 3. But this requires a vault-wide wikilink rewrite (`[[adonis]]` → `[[adonis-greek]]`), so it's an atomic batch that belongs to a dedicated rename pass rather than a sentinel-touch. Both files carry a YAML comment pointing here for downstream agents.

**Wikilinks scanned:** 79 unique targets across 10 files. 1 dead (now fixed) + 1 mis-pointed (now fixed) = 2 issues / 79 targets = **2.5% local dead-link rate**, comparable to the global 1.74% baseline.

**MASSIVE-WIN candidates flagged but not wired this pass** (would expand scope beyond batch):

- `aditi` is currently equated with `[[ein-sof]]` and `[[the-one-plotinus]]` — that is *exactly* the cross-tradition Hindu↔Kabbalistic↔Neoplatonic Infinite-Ground triangle the audit flagged as anemic. Worth confirming there's a reciprocal edge from `ein-sof.md` and `the-one-plotinus.md` back to Aditi. (Out-of-scope for this batch; will check when those deity slugs come up.)
- `abrasax` already wires the gematria-as-cosmology grid across 5 traditions in the body. Excellent template for what RANK A looks like.

---
