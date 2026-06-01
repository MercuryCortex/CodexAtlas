# CODEX WIRES GAP — 2026-05-31

**Trigger:** Pass-3 date audit closed; next architectural deliverable per handoff = *"wire-rendering pass into V2 Codex view so cross-tradition edges visible like legacy unified canvas"*. Investigation finds the gap is upstream (corpus declarations), not downstream (rendering).

---

## TL;DR

- **953 doc↔doc `parallel-motif` wires exist in `data.js`** (extracted from YAML `parallels:` fields by `build_data.py`).
- **Only 738 (77.4%) survive the Codex view's node filter.** 215 wires (22.6%) drop because at least one endpoint isn't declared in `SCRIPTURE_CORPORA` (auto-derived live set = 567 ids).
- **66 distinct documents** are parallel-motif endpoints with full vault YAML nodes BUT no corpus declaration. Adding them to `SCRIPTURE_CORPORA` brings wire coverage from 77.4% → ~95%+ with no engine changes.
- This is **Lane-A taxonomy work** (extending `SCRIPTURE_CORPORA` in `src/js/app.js`), not a Lane-B engine fix.

---

## Methodology

```python
# Loaded data.js (4902 nodes, 22988 edges)
# Filtered to edges where type='parallel-motif' AND both endpoints are type='document'
# → 953 doc↔doc wires

# Live SCRIPTURE_IDS = static set (109) ∪ auto-derived from SCRIPTURE_CORPORA book IDs (458)
# → live union = 567 ids

# Counted wires where BOTH endpoints in live set → kept
#                  AT LEAST ONE endpoint outside → dropped (Codex view invisible)
```

Results in this commit's batch report (above).

---

## The 66 missing endpoint documents — grouped by recommended corpus fit

### Group A: Canonical-scripture additions to existing religion-corpus trees (high-confidence, ~28 docs)

These fit cleanly into existing corpora; the corpora-taxonomy campaign added their religions/sections but skipped these specific books.

**Mesopotamian → existing corpus(es):**
- `phase-1-005-instructions-of-shuruppak` (Sumerian wisdom)
- `phase-1-007-code-of-hammurabi` (Old Babylonian royal law)
- `phase-1-015-sumerian-king-list` (Sumerian chronographic)
- `phase-1-018-gudea-cylinders` (Sumerian royal-cultic, Lagash)
- `phase-1-020-shumma-alu`, `phase-1-021-shumma-izbu` (Babylonian-Assyrian omen lit)
- `phase-1-022-lament-for-ur` (Sumerian city-lament)
- `phase-1-023-shulgi-hymns` (Ur III royal hymnography)
- `phase-1-032-babylonian-theodicy` (Babylonian wisdom)
- `phase-1-033-anzu-myth`, `phase-1-034-adapa-myth` (Sumero-Akkadian myth)

**Egyptian → existing corpus:**
- `phase-1-036-amduat` (Royal solar/Duat geography — completes the Pyramid Texts / Coffin Texts / Book of the Dead / Amduat funerary set)

**Greek/Confucian — sub-canon additions:**
- `phase-2-031-aeschylus-oresteia` (Athenian dramatic-ritual; could fit a "Greek dramatic religion" corpus or merge into Hellenic-religion)
- `phase-2-032-shijing`, `phase-2-033-shujing` (Confucian Five Classics — existing Confucian corpus should contain these)
- `phase-2-043-great-learning-daxue`, `phase-2-044-doctrine-of-the-mean-zhongyong` (Neo-Confucian Four Books — Zhu Xi 1190 compilation)

**Hellenistic Jewish + Hellenistic philosophy → existing corpora:**
- `phase-3-005-stoic-foundational-texts` (Stoic — Chrysippus → Seneca → Epictetus)
- `phase-3-013-philo-of-alexandria` (Middle Platonist Hellenistic Judaism)
- `phase-3-014-enneads-plotinus` (Neoplatonic — already in pilot, confirmed dates correct)
- `phase-3-032-4-ezra-ethiopic-recension` (Ethiopian Orthodox canonical; pairs with the Tewahedo corpus addition)
- `phase-3-096-baruch` (Catholic+Orthodox deuterocanon)
- `phase-4-069-josephus-jewish-war`, `phase-4-070-josephus-antiquities`, `phase-4-071-josephus-against-apion` (Hellenistic-Jewish historiography)
- `phase-4-085-ovid-metamorphoses-book-1` (Latin myth → Roman religion corpus)
- `phase-4-095-new-testament-canon` (formation document → Christianity)

**Christian → existing corpora:**
- `phase-4-celestial-hierarchy` (Pseudo-Dionysian)
- `phase-5-008-eriugena-periphyseon` (Carolingian Christian Platonist)
- `phase-5-040-mirror-of-simple-souls` (apophatic mystical / Free-Spirit)
- `document-2-chronicles` (Hebrew Bible / OT)

**Jewish → existing corpora:**
- `phase-5-010-saadia-emunot-ve-deot` (Geonic / Kalām-influenced rationalist)
- `phase-5-019-maimonides-guide-for-the-perplexed` (Jewish Aristotelianism)
- `phase-5-049-yosippon-ethiopian-recension` (Ethiopian-canonical recension)
- `phase-6-011-cordovero-pardes-rimmonim` (Safed-school Cordoveran Kabbalah)
- `phase-6-015-luria-vital-etz-chayyim` (Lurianic — Chaim Vital transmission)

**Early modern Christian/esoteric → existing corpora:**
- `phase-6-002-ficino-theologia-platonica` (Florentine Platonic Academy → Esoteric Christianity / Renaissance Esotericism)
- `phase-6-005-luther-95-theses` (Lutheran → Protestant)
- `phase-6-014-bruno-de-la-causa-eroici-furori` (Brunian → Renaissance Esotericism)
- `phase-6-017-boehme-aurora-mysterium-magnum` (Boehmian theosophy → Renaissance/Modern Occult)
- `phase-6-044-llull-ars-magna` (Lullism — combinatorial divine-names → Christian-mystical)

### Group B: Modern religious-studies scholarship — schema decision needed (~30 docs)

These are 19th–21st-c. **academic studies OF religion**, not scripture. Frazer's *Golden Bough* is foundational for comparative religion; Jung's alchemical/Aion/Mysterium texts are foundational for psychology-of-religion. They sit in `phase-7-*` and have rich parallel-motif edges to actual scripture, but they aren't *canonical scripture* in any tradition.

**Schema fork to decide:**
- (A) Add a `Modern religious-studies scholarship` pseudo-corpus under a new religion-key like `comparative-religion-academic` — surfaces these in Codex view with appropriate styling/distinction.
- (B) Add to existing Esoteric-Occult / Renaissance Esotericism corpora where lineage applies (Yates → Renaissance Esotericism; Jung → Western Esotericism / depth psychology).
- (C) Exclude from Codex view (Codex stays scripture-only); their parallel-motif edges to scripture won't show in Codex but appear in Deities/All-modes views.

The 30 docs in this bucket: Frazer (Golden Bough); Durkheim (Elementary Forms); Otto (Idea of the Holy); Scholem (Major Trends in Jewish Mysticism); Jonas (Gnostic Religion); Pagels (Gnostic Gospels, Beyond Belief); Jung (Psychology and Alchemy, Aion, Mysterium Coniunctionis, Answer to Job); Eliade (Patterns in Comparative Religion, Sacred and Profane); Yates (Bruno and the Hermetic Tradition); James (Varieties of Religious Experience).

### Group C: Iberian Hermetic + cataclysm-genre + Bahá'í + Paradise Lost (single-corpus oddities, ~8 docs)

- `phase-6-040-bandarra-trovas` (Portuguese vernacular prophetic) — fits Sebastianist/Portuguese-Hermetic corpus (already in vault per memory `project_portuguese_hermetic_wedge`)
- `phase-6-041-camoes-os-lusiadas` (Portuguese Renaissance epic) — same corpus
- `phase-7-037-pessoa-mensagem` (Sebastianist-Hermetic-Rosicrucian modernism) — same
- `phase-7-038-guenon-symbols-sacred-science` (Guénonian Traditionalism)
- `phase-7-039-gandra-da-face-oculta-2009` (21st-c. Portuguese hermetic — John's teacher per memory)
- `phase-7-033-donnelly-atlantis-antediluvian-world`, `phase-7-035-cayce-atlantis-readings`, `phase-7-036-hancock-fingerprints-of-the-gods` — these are the "deviant-bridge tier" per memory feedback; ARE actively referenced in syncretic-imagination discourse and have edges to scripture. Probably belong in a "Lost-civilization / hyperdiffusionism" corpus with explicit Tier-4 sourcing per `feedback_deviant_bridges` memory.
- `phase-6-042-paradise-lost` (Milton, Christian epic poetry) — could fit Protestant/Christian-literary corpus.
- `phase-7-048-bahai-hidden-words` (Bahá'í foundational scripture, Baghdad period) — Bahá'í corpus needs a section for the Baghdad mystical writings.

---

## Recommended sequence

1. **Apply Group A (~28 docs) mechanically** — these are unambiguous corpus additions. Most go into existing corpora's existing sections; a few need new section-headers (e.g. Mesopotamian "Wisdom literature" section, Confucian "Five Classics" section if not present). Expected wire-coverage lift: 77.4% → ~88%.
2. **Apply Group C (~8 docs)** — needs corpus-key decisions on Portuguese Hermetic + Lost-civilization + Bahá'í sub-corpus; can be done file-by-file as each gets a corpus home.
3. **Schema decision on Group B** — John picks (A) pseudo-corpus / (B) merge-into-esoteric / (C) exclude. Affects ~30 docs.

After (1) + (2) the wire-rendering pass is effectively done — the engine doesn't need code changes; the YAML data already has the wires; expanding `SCRIPTURE_CORPORA` lets the existing filter pass them through.

---

## Why this is the actual "wire-rendering pass"

Initial hypothesis: V2 Codex view's renderer suppresses edges (Lane-B engine fix).

Reality: the engine renders edges fine. The data-mode filter `filterNodesByMode('scriptures', ...)` correctly intersects with `SCRIPTURE_CORPORA`. The bug is **`SCRIPTURE_CORPORA` is incomplete** — 66 of the 377 distinct parallel-motif endpoint documents have full vault YAML but no corpus declaration. The "wire-rendering pass" is in fact a Lane-A taxonomy extension.

This matches the corpora-taxonomy campaign pattern (commits `a3183c87` / `30898027` / `16150668`) — every campaign iteration added a batch of corpus-declarations, each iteration finds more gaps. Pass-3 of the date audit follows the same shape: each pass surfaces the next layer of issues to fix.

---

## Awaiting ratification on

- Group A application sequence (file-by-file or bulk per existing corpus)
- Group B schema fork: (A) pseudo-corpus / (B) merge / (C) exclude
- Group C: per-doc corpus assignment (some already have memory entries — Gandra is John's teacher, Bandarra/Pessoa are documented in `project_portuguese_hermetic_wedge`)
