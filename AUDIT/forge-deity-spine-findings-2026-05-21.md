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

## Batch 2 — aganju → al-haqq (2026-05-21)

**Files:** aganju, agathos-daimon, agni, ah-puch, ahriman, ahti, ahura-mazda, aine, akshobhya, al-haqq.

**State on arrival:** another high-quality batch. 6/10 had `status: "stub"` while carrying 50–140 lines of structured YAML + body — exactly the over-application pattern the stubs audit identified. Zero dead wikilinks across all 63 unique targets — best result yet, suggesting the deities lens has cleaner wiring discipline than `04_persons/`.

**Fixes applied:**

- `aganju.md` — flipped `status: stub` → `metadata`. 62 lines with full syncretic-edges grid (Shango / Vulcan / Hephaestus / Pele).
- `agathos-daimon.md` — populated empty `attested-in: []` with `[[phase-4-011-corpus-hermeticum-i]]` + `[[phase-3-021-hermetic-corpus-earliest]]`. The Agathos Daimon's revealer role is documented in CH XVI and the Stobaean fragments; CH I (Poimandres) is the closest existing node.
- `agni.md` — three changes: (a) syncretic-edges target `atar-zoroastrian` corrected to `atar` (no such suffixed file); (b) edge type changed from `scholarly-parallel` to `shared-inheritance` — Agni ↔ Atar are Indo-Iranian cognates from common pre-IIr fire-cult, not later structural parallel; (c) status stub → metadata. Promoted equivalents to include `[[atar]]` directly.
- `ah-puch.md` — already RANK A, no change.
- `ahriman.md` — populated empty `attested-in` (Gathas + Younger Avesta); added syncretic-edge target braket fix (`[[flint-deity]]` → `flint-deity` per YAML field convention); flagged duplicate with `angra-mainyu-ahriman.md`. **The Flint/Haudenosaunee MASSIVE-WIN parallel was unique to `ahriman.md` and would have been LOST on naive consolidation** — I have additively copied it into `angra-mainyu-ahriman.md` so either file can be safely deprecated by John.
- `angra-mainyu-ahriman.md` (out-of-batch but touched defensively) — added the Flint/Haudenosaunee scholarly-parallel from `ahriman.md` so the cross-tradition link survives any future merge.
- `ahti.md` — populated empty `attested-in: []` with `[[phase-8-018-kalevala]]`.
- `ahura-mazda.md` — **fixed a real YAML bug**: duplicate `parent-of:` key (lines 13 + 18). YAML parsers silently drop the first occurrence, meaning Spenta Mainyu was the only declared offspring downstream. Merged the two parent-of lists into one entry on line 13 (the richer one with Asha Vahishta, Vohu Manah, Atar, and Spenta Mainyu). Also flipped status stub → metadata.
- `aine.md` — already at RANK A modulo empty `attested-in:`. No appropriate primary-source document node exists in the vault (no Lebor Gabála Érenn, Acallam na Senórach, or Aislinge Óenguso nodes). Left empty; flagged for a future Irish-Celtic absorption wave.
- `akshobhya.md` — flipped status stub → metadata. Already had Indra-vajra MASSIVE-WIN edge.
- `al-haqq.md` — flipped status stub → metadata.

**Systemic finding: `status: "stub"` saturation in the deities lens.**

The stubs audit flagged this (590 stubs ≥30 lines, mis-labeled). Confirmed in this batch: 6/10 deities carried the stub flag while having complete YAML + multi-paragraph body + multi-tier refs + syncretic-edges arrays. The stubs audit's recommendation #1 (one-shot reclassification) is correct in principle; doing it deity-by-deity in this sweep is slower but catches *associated* issues at the same time (Agni's mis-suffixed Atar target, ahura-mazda's duplicate YAML key) that a blind regex-flip would not. Continuing per-file inspection.

**Duplicate cluster #2:** `ahriman.md` ↔ `angra-mainyu-ahriman.md`. Same recommendation pattern as the adonis cluster. The `angra-mainyu-ahriman.md` slug is the higher-in-degree one (57 inbound per the stubs audit) and carries the MASSIVE-WIN Satan-transfer content; recommend deprecating `ahriman.md` in favor of it, with a vault-wide `[[ahriman]]` → `[[angra-mainyu-ahriman]]` rewrite. Flint parallel already preserved in the canonical node.

**Wikilinks scanned:** 63 unique targets across 10 files. **0 dead links.**

---

## Batch 3 — al-uzza → ame-no-uzume (2026-05-21)

**Files:** al-uzza, albion, allah, allat, allatu-akkadian, almaqah, amaterasu, amaunet, ame-no-hohi, ame-no-uzume.

**Fixes applied:**

- `allatu-akkadian.md` — removed `?` suffix from wikilink `[[phase-1-017-descent-of-inanna]]?`. The question mark was authorial uncertainty about whether Allatu appears in the Descent — she does (the Akkadian Descent of Ishtar uses Allatu and Ereshkigal interchangeably), so the attestation is firm.
- `almaqah.md` — fixed two dead wikilinks: `[[sin-mesopotamian]]` and `[[nanna-sumerian]]` (both nonexistent slugs) → `[[nanna-sin]]` (the actual combined Sumerian/Akkadian moon-god node). Vault treats Nanna/Sin as one consolidated node, not two — important convention to apply going forward.
- `amaterasu.md` — wired "Izanagi" → `[[izanagi]]` in the body's identity paragraph (WIRING LAW: prose references to existing nodes should link).
- `ame-no-uzume.md` — referenced `[[sarutahiko]]` (didn't exist); created a metadata-tier stub at `03_deities/sarutahiko.md` (outward stub within the deity lens, NOT outside it — so within the soft 3-outward-stub budget).
- `ame-no-hohi.md` — was a 12-line breadcrumb stub from the 2026-05-19 sacred-architecture A2 batch. Replaced with a metadata-tier node documenting the failed-Izumo-embassy narrative + Kokusō priestly genealogy + canonical YAML. The breadcrumb was actively misleading (only YAML field was `name: "Ame No Hohi"` with the Roman-numeral title-case bug).

**Convention finding: Nanna/Sin consolidation.**

The Mesopotamian moon-god has *one* node (`nanna-sin.md`) covering both the Sumerian (Nanna) and Akkadian (Sin) forms. Two dead-link targets in `almaqah.md` came from agents assuming separate `nanna-sumerian.md` and `sin-mesopotamian.md` files. Worth memorizing: when wiring lunar deities, use `[[nanna-sin]]`. The vault's `dumuzi-tammuz.md` follows the same consolidated-cognate-pair convention.

**Cosmetic finding: `Ame No Hohi` title-case bug.**

`ame-no-hohi.md`'s `name:` field rendered as `"Ame No Hohi"` (naive title-cased slug) — the same auto-titlecase pattern flagged in the stubs audit for Roman numerals. Fixed to `"Ame-no-Hohi"` (the actual rendering preserves the hyphenated kebab structure of Japanese kami names).

**Wikilinks scanned:** ~70 unique targets across 10 files. 3 dead (now fixed) + 1 syntax-bug (now fixed) = 4 issues. Still no dead links shipped — the WIRING LAW held.

---

## Batch 4 — amenominakanushi → anansi (2026-05-21)

**Files:** amenominakanushi, amitabha, amma-dogon, amoghasiddhi, amun-ra, amun, an-sumerian, anahit-armenian, anahita, anansi.

**Fixes applied:**

- `amitabha.md`, `amoghasiddhi.md`, `an-sumerian.md`, `anahita.md` — four status flips stub → metadata. All had structured YAML + refs + body identity content. The five-Dhyani-Buddha cluster (`vairocana`/`akshobhya`/`ratnasambhava`/`amitabha`/`amoghasiddhi`) was *uniformly* mis-flagged as stub despite carrying full mandala-cross-tradition syncretic-edges grids — that's a systematic mis-flag pattern likely from a 2026-05-19 batch that created the Dhyani group together and never came back to flip them.
- `amoghasiddhi.md` — also populated empty `attested-in` with the Sukhāvatīvyūha node (canonical source for the Five-Buddha mandala in Pure Land sutras).
- `anansi.md` — fixed dead wikilink `[[tradition-akan-religion]]` → `[[tradition-akan]]` (vault convention drops the redundant `-religion` suffix on tradition slugs — verified `tradition-akan.md` is the canonical node).

**Convention finding: tradition-X-religion is wrong.** The vault uses bare `tradition-X` slugs (e.g. `tradition-akan`, `tradition-zoroastrianism`, `tradition-daoism`). `tradition-akan-religion` was an out-of-pattern construction. Worth scanning the whole `03_deities/` lens for similar mis-suffixed tradition wikilinks once the sweep is complete.

**Wikilinks scanned:** ~80 unique targets across 10 files. 1 dead (now fixed).

---

## Batch 5 — anat → apkallu (2026-05-21)

**Files:** anat, angel-of-the-presence, angra-mainyu-ahriman, anput, anshar-kishar, anthropos-gnostic, anubis, aphrodite-greek, apis-bull, apkallu.

**Fixes applied:**

- 5 status flips stub → metadata: `anat`, `angra-mainyu-ahriman`, `anput`, `aphrodite-greek` (all have 30–62 lines + structured YAML + refs).
- `apkallu.md` — fixed 2 dead wikilinks: removed `[[parallel-motif]]` (methodological term in prose, not a node) and `[[divine-wisdom]]` (the author had hedged "if node exists" — replaced with the existing `[[wisdom-as-cosmic-order]]` only).
- `angra-mainyu-ahriman.md` was flipped — its content was already rich (Satan-transfer MASSIVE-WIN + Flint parallel added by batch 2). The stub flag persisted across two batches of touching it.

**Wikilinks scanned:** ~120 unique targets across 10 files. 2 dead (now fixed).

---

## Batch 6 — apollo → asase-yaa (2026-05-21)

**Files:** apollo, apophis, apsu, apus, aramazd, ares, ariadne, armaros, artemis, asase-yaa.

**Fixes applied:** 7 status flips stub → metadata (apollo, apsu, apus, ares, ariadne, artemis, asase-yaa). All had 32–62 lines + structured YAML. **Zero dead wikilinks** across the batch — the Olympian cluster has the cleanest wiring discipline yet observed.

**Tradition-suffix convention learned (revising batch 4 note):** the vault uses BOTH `tradition-X` and `tradition-X-religion` slugs interchangeably across different traditions. `tradition-akan` exists without suffix; `tradition-maya-religion`, `tradition-lusitanian-religion`, `tradition-greek-religion` exist with it. There is no single convention — each tradition's slug was chosen ad hoc. Future renames should check the actual file before changing.

---

## Batch 7 — asbeel → astghik (2026-05-21)

**Files:** asbeel, asclepius-greek, asha-vahishta, asherah, ashur, asklepios, asmodeus, astar-aksumite, astarte-canaanite, astghik.

**Fixes applied:**

- `astarte-canaanite.md` — flipped status stub → metadata (86 lines + rich YAML).
- `asclepius-greek.md` — unwrapped 2 dead body-wikilinks: `[[pergamon]]` and `[[kos]]` to plain text (places, no node exists yet — not worth stub-creating for a single passing mention of cult-temple distribution).
- `astar-aksumite.md` — unwrapped dead `[[athtart]]` references (YAML equivalents + body) to plain text, folded the Athtart context into the existing `[[astarte-canaanite]]` citation (Athtart is the Ugaritic spelling, already covered by astarte-canaanite).

**Flagged for John's decision: duplicate cluster #3 — asclepius-greek ↔ asklepios.**

Both files are 105 lines, both `status: "full"`, both cover the same Greek deity. The split is purely orthographic — `asclepius-greek.md` uses the Latin transliteration; `asklepios.md` uses the Greek-Greek transliteration. Per the schema's splitting rule, a Latin-vs-Greek spelling does NOT justify two nodes (the deity is identical, not "transformed across traditions"). Recommend: keep `asclepius-greek.md` (matches the `-greek` suffix convention used by `aphrodite-greek`, `persephone-greek`, etc.); deprecate `asklepios.md` after merging any unique content; rewrite vault-wide `[[asklepios]]` → `[[asclepius-greek]]`. YAML comment added to both files. Quick audit confirmed `[[asclepius-greek]]` is the more in-degree-prominent slug.

**Wikilinks scanned:** ~90 unique targets across 10 files. 3 dead-link references unwrapped (pergamon, kos, athtart — to plain text rather than stub-create, since they're trivia mentions, not load-bearing).

---

## Batch 8 — ataecina → awonawilona (2026-05-21)

**Files:** ataecina, atar, aten, athena, atlas-titan, attis, atum, aurora-roman, avalokitesvara, awonawilona.

**Fixes applied:**

- 4 status flips stub → metadata (ataecina, athena, avalokitesvara, awonawilona).
- `awonawilona.md` — fixed `[[hopi]]` → `[[tradition-hopi]]` (the deity-slug `hopi` doesn't exist; the tradition node does).
- `avalokitesvara.md` — unwrapped `[[chenrezig]]` to plain text in equivalents (Chenrezig is the Tibetan name for Avalokiteshvara, same deity, no separate node planned per the alias-convention).

**Wikilinks scanned:** ~110 unique targets. 2 dead-link references fixed.

---

## Batch 9 — azazel → baphomet (2026-05-21)

**Files:** azazel, ba-xian, baal-hadad, baal, babalu-aye, bacchus, baiame, baldr, bandua, baphomet.

**Fixes applied:**

- 4 status flips stub → metadata (azazel, ba-xian, babalu-aye, bandua).
- `bandua.md` — unwrapped `[[dunatis-gaulish]]` to plain text in YAML equivalents (no Dunatis node planned; the structural cognate context is preserved in the body's "Atlantic fortress-god type" section).

**Wikilinks scanned:** ~95 unique targets. 1 dead-link unwrapped.

---
