# SCRIPTURE_IDS — V1 Enumeration

**Filed:** 2026-05-28
**Step:** Scripture mode carve plan, Step 1 (per `AUDIT/2026-05-28-scripture-mode-spec.md` §3.2)
**Status:** SHIPPED — embedded as `SCRIPTURE_IDS` Set in `src/js/engine/graph/mode.js`

---

## Method

1. Scanned all 510 `type: "document"` nodes in `data.js`.
2. Applied 65 regex patterns matching canonical scripture-name fragments (`sutra`, `upanishad`, `veda`, `gospel`, `quran`, `yasna`, `tipitaka`, etc.).
3. Cross-checked with `family` field for sanity (Israelite/Vedic/Christian/Buddhist/Islamic/Egyptian/Mesopotamian/Zoroastrian/Norse/Shinto/Mesoamerican).
4. Manual review pass — excluded 7 false positives (commentaries, medical texts, philosophy treatises), added 13 nodes the heuristic missed.

**Final set: 109 entries.**

## Excluded (manual review — heuristic flagged but NOT scripture)

| Node | Reason |
|---|---|
| `phase-7-020-answer-to-job` | Jung's psychological commentary, not a sacred text |
| `phase-4-066-polycarp-philippians` | Post-apostolic letter, not canonical in any tradition |
| `phase-4-046-john-of-damascus-exposition-orthodox-faith` | Theological treatise, not scripture |
| `phase-5-022-madhva-brahma-sutra-bhasya` | Commentary on the Brahma Sutras |
| `phase-5-005-shankara-brahma-sutra-bhasya` | Commentary on the Brahma Sutras |
| `phase-3-036-charaka-samhita` | Ayurvedic medical text, not religious |
| `phase-5-018-suhrawardi-hikmat-al-ishraq` | Philosophical treatise on Illuminationist epistemology |

## Added (missed by heuristic — found via target-list grep)

`tipitaka` · `phase-4-031-mishnah` · `phase-4-032-jerusalem-talmud` · `phase-4-033-babylonian-talmud` · `phase-3-023-yoga-sutras-of-patanjali` · `phase-7-002-kitab-i-iqan` · `phase-7-003-kitab-i-aqdas` · `phase-5-001-devi-mahatmya` · `phase-5-033-shiva-sutras` · `phase-1-031-rigveda` · `phase-8-005-chilam-balam` · `phase-3-011-dead-sea-scrolls` · `phase-3-033-book-of-giants-qumran-manichaean`

## Distribution by family

| Family | Count | Notes |
|---|---|---|
| Vedic | 16 | Vedas, Upanishads, Bhagavad Gita, Yoga Sutras, Puranas |
| Christian | 11 | Gospels, Epistles, Mormon, Kebra Nagast |
| Israelite | 14 | J/E/D/P sources, Prophets, Daniel, Job, Sefer Yetzirah, Zohar, Bahir, Mishnah, Talmuds |
| Buddhist | 9 | Pali canon, major Mahayana sutras, Bardo Thodol, Diamond Sutra |
| Islamic | 5 | Quran, Sufi corpus (Rumi, Ibn Arabi) |
| Mesopotamian | 6 | Enuma Elish, Atrahasis, Gilgamesh, Eridu Genesis |
| Gnostic | 5 | Nag Hammadi corpus |
| Hermetic | 2 | Corpus Hermeticum I + XIII |
| Egyptian | 2 | Hymn to Aten, Memphite Theology |
| Chinese | 3 | Analects, Zhuangzi, I Ching |
| Mesoamerican | 2 | Popol Vuh, Chilam Balam |
| Norse | 2 | Poetic Edda, Prose Edda |
| Shinto | 2 | Kojiki, Nihon Shoki |
| Zoroastrian | 3 | Avesta, Gathas, Yasna |
| Mandaean | 1 | Book of John |
| Sikh | 1 | Guru Granth Sahib (filed under Vedic family in vault — followup: re-family) |
| Bahá'í | 2 | Kitab-i-Iqan, Kitab-i-Aqdas |
| LDS | 1 | Book of Mormon |
| Other (uncategorized in vault) | 22 | Mostly duplicate canonical-name slugs (`tao-te-ching`, `mahabharata`, `ramayana`, `kojiki`, `codex-sinaiticus`, etc.) — Lane A follow-up should reconcile vs `phase-*` versions |

## Open follow-ups (Lane A — separate batches, NOT in this step)

1. **Duplicate slug reconciliation** — `mahabharata` + `phase-3-095-mahabharata` are two nodes for the same text. Same for `kojiki` + `phase-8-019-kojiki`, `lotus-sutra` + `phase-4-101-lotus-sutra`, `rumi-masnavi` appears as `phase-5-025` and `phase-5-054`. Wheel renders both — one needs to be deprecated or merged.
2. **Missing scriptures audit** — 109 entries feels low for a 510-document vault. Likely-missing: Mishnayot, Targums, Apocrypha (Tobit, Judith, Sirach, Wisdom of Solomon), Persian Avestan books (Vendidad, Visperad), Tibetan Kangyur/Tengyur, full Pali nikayas, Sikh Dasam Granth, Bahá'í Hidden Words / Seven Valleys, Druze Epistles of Wisdom, Yazidi Black Book.
3. **`canonical-corpus` YAML frontmatter** — once the set stabilizes, migrate from a hardcoded Set in `mode.js` to a field on each scripture node's YAML. Then the predicate becomes `n.canonicalCorpus != null` and the list lives where the node lives.
4. **`document-*` stubs** — `document-exodus`/`document-leviticus`/etc. are minimal-data stubs. Either flesh them out as full nodes or merge into proper phase-prefixed nodes.

## V1 acceptance

When user picks "✶ Scriptures" in the Forge mode pill, the wheel should render exactly 109 nodes (modulo any commits that delete or add document-type nodes between now and reload). Verifiable in DevTools console:
```js
window.AtlasEngineMode.filterNodesByMode('scriptures', window.VAULT_DATA.nodes, window.VAULT_DATA.edges).length
// → 109
```
