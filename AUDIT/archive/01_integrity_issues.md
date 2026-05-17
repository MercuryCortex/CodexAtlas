# Integrity Issues — concrete bugs and inconsistencies

Found 2026-05-14 by external audit. These are items that are *wrong as currently written* (or structurally inconsistent), as distinct from items that are simply missing. Highest-ROI cleanups are listed first.

---

## 1. Slug drift on document filenames is the largest single source of dead links

The dead-links table shows ~150 dead occurrences caused by document slugs that don't match the actual filename on disk. Examples from [dead-links.md](../00_meta/dead-links.md):

| Referenced as | Actually exists as |
|---|---|
| `phase-1-005-instruction-of-ptahhotep` | `phase-1-005-instructions-of-shuruppak` (different document!) — caller is asking for a doc that *should exist* but doesn't |
| `phase-2-005-davidic-psalms` | not present; closest existing is presumably under a different number |
| `phase-2-021-proverbs` | not present (Phase 2 stops at 021 = shvetashvatara-upanishad) |
| `phase-3-024-suetonius-twelve-caesars` | Phase 3 has `phase-3-024-natyashastra` at that index — number collision |
| `phase-4-021-iamblichus-de-mysteriis` | exists as `phase-4-020-iamblichus-on-the-mysteries` — both number and title drift |
| `phase-4-026-apophthegmata-patrum` | exists as `phase-4-043-apophthegmata-patrum` |
| `phase-4-025-life-of-antony` | exists as `phase-4-041-athanasius-life-of-antony` |
| `phase-5-009-maimonides-guide-perplexed` | exists as `phase-5-019-maimonides-guide-for-the-perplexed` |
| `phase-5-021-cusa-de-docta-ignorantia` | not present (Cusa missing entirely from Phase 5) |
| `phase-6-006-paracelsus-archidoxes` | exists as `phase-6-008-paracelsus-corpus` |
| `phase-7-014-bellah-civil-religion-essay` | exists as `phase-7-010-elementary-forms-religious-life`? — check |
| `phase-7-022-hick-interpretation-of-religion` | exists as `phase-7-022-sacred-and-profane` (Eliade) — number collision |

**Recommended fix.** Write a one-shot script that:

1. Builds a slug-index from all filenames under `02_documents/_phase-*/`.
2. For each dead-link target matching `phase-N-NNN-*`, finds the closest filename match by Levenshtein on the slug stem AND by file-name keyword overlap.
3. Generates a CSV `slug-drift-candidates.csv` with columns `dead-link-target,best-match-file,confidence,suggested-action`.
4. Human (or agent) reviews and accepts; a second pass rewrites incoming wikilinks.

For dead-links that point to a *missing document* (not slug drift — the document genuinely doesn't exist), promote them to the priority queue and stub them.

The [canonical-slugs.md](../00_meta/canonical-slugs.md) file exists precisely to prevent this. It is not being consulted before file creation. Either enforce via pre-commit hook (lint each new wikilink target against the registry) or build the slug-resolution into `build_dashboard.py` so drift is caught the next time the dashboard rebuilds.

---

## 2. Tradition-string normalisation is broken

`grep -h "^tradition:" 03_deities/*.md | sort | uniq -c` reveals at least these variants for the **same** Mesopotamian cluster:

- `"Sumerian"` (10)
- `"Sumerian / Mesopotamian"` (4)
- `"Sumerian / Akkadian"` (2)
- `"Sumerian / Babylonian"` (2)
- `"Sumerian / Akkadian / Babylonian"` (2)

Same drift for `"Vedic / Hindu"` vs `"Vedic / Vaishnava Hinduism"` vs `"Vaishnavism"` vs `"Hindu — Vaiṣṇava"`.

This breaks Pantheon-clustering in `build_data.py` because the cluster key is presumably the raw string.

**Recommended fix.** Add a controlled vocabulary in `00_meta/`:

```yaml
# 00_meta/tradition-vocabulary.yaml
canonical-traditions:
  - id: "mesopotamian"
    display: "Mesopotamian"
    aliases: ["Sumerian", "Akkadian", "Babylonian", "Sumerian / Mesopotamian",
              "Sumerian / Akkadian", "Sumerian / Babylonian",
              "Sumerian / Akkadian / Babylonian"]
    cluster: "ane"
  - id: "vaishnavism"
    display: "Vaishnavism"
    aliases: ["Vedic / Vaishnava Hinduism", "Vaiṣṇava", "Hindu — Vaiṣṇava"]
    cluster: "indic"
```

Either rewrite all node YAML to the canonical `id`, or extend `build_data.py` to consult the vocabulary on every node-tradition read and cluster by `id`. The first is cleaner; the second is faster to ship.

---

## 3. Date-vs-role mismatch (sample case: `allah.md`)

[03_deities/allah.md](../03_deities/allah.md) sets:

- `period-active-earliest: -500`
- `role: "the one God; supreme and exclusive divinity in Islamic theology"`

These contradict. Islamic theology of *tawḥīd* doesn't exist in 500 BCE. The 500 BCE date is defensible only for "al-Ilāh as Semitic high-god / pre-Islamic Hijazi cult," but then the role field should say that.

**Recommended fix.** Either:

- Change `period-active-earliest` to `-100` or `500` (range of meaningful pre-Islamic *al-Ilāh* attestation through Islamic emergence) — but then change `role` to acknowledge the pre-Islamic continuity.
- Or keep `role` Islamic-monotheistic and set `period-active-earliest: 600` (CE), with the pre-Islamic backdrop carried in the prose under a "Pre-Islamic context" section.

Either approach is defensible; the current state is internally contradictory.

**Sweep.** Run a check across all deities whose tradition has a "pre-X" backdrop (Yahweh's pre-Israelite Shasu layer, Allah's pre-Islamic al-Ilāh, Shangdi's Shang vs. Zhou layer, Krishna's Vedic vs. Bhagavata layer, Vishnu's Vedic vs. Vaishnava layer). Verify that `period-active-earliest` and `role` belong to the same historical layer.

---

## 4. Phase 8 is conceptually muddled

`02_documents/_phase-8-non-western-traditional/` contains **Poetic Edda**, **Prose Edda**, and **Kalevala** alongside Popol Vuh, Maori chants, Ifá corpus, Dreaming narratives, Vodou, Lucumi.

Norse and Finno-Karelian are pre-Christian European, not non-Western. The Eddas were composed and redacted by Snorri Sturluson (13th-c. Iceland) — they're medieval *European* texts about pre-Christian European religion.

This will look incoherent on the timeline view (the Eddas plotted in the "non-Western" lane next to Maori chants is a category error).

**Recommended fix options (pick one):**

1. **Rename Phase 8** to something that actually fits its contents: "Phase 8 — Oral / Indigenous / Pre-Imperial Canon" or "Phase 8 — Non-Latin/Non-Greek/Non-Sanskrit Canon."
2. **Split Phase 8**: 8a = Indigenous (Americas, Australia, Pacific, sub-Saharan Africa); 8b = Pre-Christian European retrieved late (Eddas, Kalevala).
3. **Move the Eddas and Kalevala into Phase 4 or 5** with `tradition: norse` / `tradition: finno-karelian` tags. The composition dates are medieval anyway; the *content* being pre-Christian doesn't require placement in a "non-Western" phase.

Option 3 is cleanest from a chronological-timeline perspective; option 1 is cheapest.

---

## 5. Phase 4/5 boundary is undocumented

Bede (~730 CE) is in Phase 4. Eriugena (~860 CE) is in Phase 5. There is no documented boundary criterion in [methodology.md](../00_meta/methodology.md).

Possible boundaries:
- Charlemagne's coronation 800 CE
- The fall of the Western Empire 476 CE (but then Bede is wrongly placed)
- The Carolingian Renaissance
- The death of Bede / closure of Patristic age

**Recommended fix.** Pick a boundary, document it, and sanity-check the Phase 4 docs from ~600 onward (Gregory I, Isidore, Bede, John of Damascus) against it. John of Damascus (d. 749) is currently Phase 4; if the boundary is Charlemagne 800 that's coherent.

---

## 6. Zero-reference metadata-status nodes (representativeness problem)

Several Phase 7 figures are marked `status: metadata` with **zero refs**. From [quality-issues.md](../00_meta/quality-issues.md):

- `joseph-smith`, `helena-blavatsky`, `aleister-crowley`, `l-ron-hubbard`, `anton-lavey`, `sun-myung-moon`, `helen-schucman`, `bahaullah`, `annie-besant`, `the-bab`, `marshall-vian-summers`, `c-s-lewis`, `gerald-gardner`, `dalai-lama-14`, `karen-armstrong`, `bart-ehrman`, `dietrich-bonhoeffer`, `paul-tillich`, `wendy-doniger`, `karen-king`, `elaine-pagels` (1 ref), `frances-yates`, `chogyam-trungpa`, `swami-vivekananda`, `paramahansa-yogananda`, `ramakrishna`, `sri-aurobindo`, `nisargadatta-maharaj`, `ramana-maharshi`, `d-t-suzuki`, `thich-nhat-hanh`, `mary-baker-eddy`, `charles-taze-russell`, `brigham-young`, `rashid-rida`, `muhammad-abduh`, `fazlur-rahman`, `sayyid-qutb` (...).

These are *exactly* the figures where "we catalog them honestly, no advocacy" is tested most. Zero-ref'd Helena Blavatsky leaves a public reader unable to verify any claim made about her.

**Recommended fix.** Either down-status these to `stub` (honest), or do a single batch pass adding the canonical biography for each. Suggested baseline references (one each is enough to clear the bar):

- Joseph Smith — Richard Bushman, *Rough Stone Rolling* (Knopf, 2005)
- Helena Blavatsky — Nicholas Goodrick-Clarke, *Helena Blavatsky* (North Atlantic, 2004)
- Aleister Crowley — Lawrence Sutin, *Do What Thou Wilt* (St. Martin's, 2000)
- L. Ron Hubbard — Jon Atack, *A Piece of Blue Sky* (Lyle Stuart, 1990) [Tier 4 — Atack is critical] + Hugh B. Urban, *The Church of Scientology* (Princeton UP, 2011) [Tier 2]
- Anton LaVey — Gavin Baddeley, *Lucifer Rising* (Plexus, 1999) [Tier 3]
- Bahá'u'lláh — Juan Cole, *Modernity and the Millennium* (Columbia UP, 1998) [Tier 1]
- Annie Besant — Anne Taylor, *Annie Besant: A Biography* (Oxford UP, 1992) [Tier 2]
- C.S. Lewis — Alan Jacobs, *The Narnian* (HarperOne, 2005) [Tier 2-3]
- Bart Ehrman — direct cite to *Misquoting Jesus* (HarperOne, 2005) [Tier 2]
- Karen King — direct cite to *What Is Gnosticism?* (Harvard UP, 2003) [Tier 1]
- Elaine Pagels — direct cite to *The Gnostic Gospels* (Random House, 1979) [Tier 2]
- Wendy Doniger — direct cite to *The Hindus: An Alternative History* (Penguin, 2009) [Tier 1]
- Vivekananda — Amiya P. Sen, *Swami Vivekananda* (Oxford UP, 2000) [Tier 1]
- Ramakrishna — Jeffrey Kripal, *Kali's Child* (U Chicago Press, 1995) [Tier 1, controversial]
- Sri Aurobindo — Peter Heehs, *The Lives of Sri Aurobindo* (Columbia UP, 2008) [Tier 1, controversial inside the Aurobindo movement]
- D.T. Suzuki — Robert Sharf, "The Zen of Japanese Nationalism" (*History of Religions* 33, 1993) [Tier 1]
- Thich Nhat Hanh — Sallie King, *Socially Engaged Buddhism* (U Hawaii Press, 2009) [Tier 2]
- Sayyid Qutb — John Calvert, *Sayyid Qutb and the Origins of Radical Islamism* (Oxford UP, 2010) [Tier 1]
- Muhammad Abduh / Rashid Rida — Albert Hourani, *Arabic Thought in the Liberal Age* (Cambridge UP, 1962) [Tier 1]
- Fazlur Rahman — Ebrahim Moosa's introduction to Rahman's *Major Themes of the Qur'an* (U Chicago Press reprint, 2009) [Tier 1]

---

## 7. Roman-counterpart deity nodes are inconsistent

Dead-link table contains: `pluto-roman`, `caelus-roman`, `tellus-roman`, `vulcan-roman`, `minerva-roman`, `juno-roman`, `diana-roman`, `apollo-roman`, `ceres-roman`, `jupiter-roman`, `bacchus-roman`, `terra-roman`, `dis-pater-roman`, `neptune-roman`.

But `mars-roman`, `mercury-roman`, `saturn-roman`, `venus-roman`, `vesta-roman` *do* exist as separate deity nodes (per the file listing).

**Recommended fix.** Decide a policy and apply uniformly.

- **Policy A** (split-by-tradition, per the methodology's anti-collapse rule): every Roman counterpart is its own node with a `syncretic-identification` edge to the Greek source. This is the more consistent reading of the methodology.
- **Policy B** (Roman names redirect to Greek): only Roman gods *without* a clear Greek source (Janus, Quirinus, Faunus, Terminus, Mithras-Roman) get their own nodes; the rest are aliases in canonical-slugs.

Whichever is chosen, the existing split-some / merge-others state should be resolved this batch.

---

## 8. Sumerian/Akkadian dyad sometimes only half-stubbed

The methodology says deity dyads (e.g. Inanna/Ishtar, El-Canaanite/El-Hebrew) get separate nodes with `syncretic-identification` edges. This is happening for the major dyads but breaks down for the second-tier ones. Dead-link table shows incomplete dyads:

- `gula-akkadian` ← linked from `bau-sumerian` (4 refs) — should exist as Akkadian counterpart of Bau
- `erra-akkadian` ← linked from `nergal` (4 refs) — Erra is its own Akkadian god but is unstubbed
- `belet-seri-akkadian` ← linked from `geshtinanna`
- `siris-akkadian` ← linked from `ninkasi`
- `mullissu-akkadian` ← linked from `nin-lil-sumerian`
- `nikkal-akkadian` ← linked from `nin-gal-sumerian`
- `allatu-akkadian` ← linked from `ereshkigal`
- `ningal` ← linked from many (5 refs!) — high priority

**Recommended fix.** Single-batch pass: create stubs for each of the above (5 refs from existing nodes is excellent priority signal — these stubs will immediately become well-connected).

---

## 9. Themes Tier-A and merge-candidate items haven't moved

[themes-audit.md](../00_meta/themes-audit.md) flagged 10 Tier-A themes for expansion and one explicit MERGE (`final-judgment` → `end-times-judgment`). These don't appear to have been acted on. Either:

- Execute the merge (replace `final-judgment.md` body with a 3-line "see [[end-times-judgment]]" disambiguation; rewrite incoming links).
- Or annotate the audit file as deferred with reason.

---

## 10. `themes-to-create.md` has finished, ready-to-deploy theme drafts that haven't been promoted

[themes-to-create.md](../00_meta/themes-to-create.md) explicitly states it contains "finished, exemplar-grade drafts of new theme nodes" that the themes-quality agent couldn't write to `06_themes/` due to scope restriction. These should be split out into their own files at `06_themes/<slug>.md` and the staging file deleted.

Themes in the staging file include `temple-economy`, `divinatory-omen-reading`, and others (the file is ~62k tokens — sample the first two via the audit log). Each should already have full YAML + body + refs + manifestations — ready to move with minimal review.
