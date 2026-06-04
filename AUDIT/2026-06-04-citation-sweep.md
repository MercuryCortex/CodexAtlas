# Citation-integrity sweep — full-docs pass COMPLETE (2026-06-04)

Closes **PRIORITY 1 / D5** from `00_meta/HANDOFF-2026-06-03-literature-sweep-and-citation-audit.md`.
The scorecard checks ref *presence*, not *validity*; this sweep audited validity.

## Method
1. **Read-only mechanical pre-filter** (`scripts/audit_ref_title_consistency.py`, commit `7b2834ec`/`404e7145`) — per node, compares each YAML `refs:` title to the body `## Refs` title for the same author; flags same-author title-divergence (the real-scholar-wrong-title signature). A coarse prioritizer (116/461 nodes flagged) — NOT a verdict (can't distinguish a fabrication from an author legitimately cited for two real works).
2. **Read-only grader fleet** — 10 general-purpose background agents, ~8 nodes each, web-verifying every secondary/supporting ref over the **80 un-audited older `full` docs** (handoff estimated ~71). Classified REAL / WRONG-PUBLISHER / WRONG-YEAR / CONFLATED / FABRICATED / UNVERIFIABLE. Critical editions confirmed always-clean; rot only in secondary refs, exactly as predicted.
3. **Fixes from grader-VERIFIED corrections only** (exact-string scripts w/ per-edit count assertions; body `## Refs` corrected alongside YAML where the rot was consistent). Gates green each batch; committed Lane A.

## Result
**33 fabricated/conflated refs fixed across 25 full-doc nodes** (~5% of refs — matches the handoff's 5–7% prediction). Commits `cf510106` (batches 1–6, 17 fixes) + `a9165773` (batches 7–10, 16 fixes).

| node | author | wrong title (YAML) | verdict | correct |
|---|---|---|---|---|
| rig-veda-family-books | Witzel→Jamison | The Rigveda Between Two Worlds | CONFLATED | author is Jamison (2007) |
| rig-veda-family-books | Oberlies | Indra and the Origins of Vedic Sacrifice | FABRICATED | Die Religion des Ṛgveda (1998) |
| yasna-younger-avesta | Cantera | Avestan Liturgies and the Yasna | CONFLATED | The Transmission of the Avesta (Iranica 20, 2012) |
| hebrew-bible-j-source | Carr | The Yahwist's Primeval History | FABRICATED | Reading the Fractures of Genesis (WJK 1996) |
| brahmanas-aranyakas | Gonda | Brāhmaṇa and Āraṇyaka Literature | CONFLATED | Vedic Literature (Saṃhitās and Brāhmaṇas) (1975) |
| brahmanas-aranyakas | Witzel | Religion and Society in the Veda | CONFLATED | Inside the Texts, Beyond the Texts (1997) |
| hebrew-bible-d-source | Kugel | How to Read the Jewish Bible | CONFLATED | How to Read the Bible (Free Press 2007) |
| xunzi | Lee→Stalnaker | Xunzi and Augustine on Human Nature | CONFLATED | Stalnaker, Overcoming Our Evil (Georgetown 2006) |
| shvetashvatara-upanishad | Witzel | The Sanskrit Sources of Yoga | FABRICATED | REMOVED (no such work) |
| bhagavad-gita | van Buitenen | Hindu Scriptures | CONFLATED | phantom dup of real next entry — REMOVED |
| aeschylus-oresteia | Lebeck | Aeschylus' Oresteia: A Reading | CONFLATED | The Oresteia: A Study in Language and Structure (1971) |
| dhammapada | Norman | The Dhammapada: Verses on the Way | CONFLATED | The Word of the Doctrine (PTS 1997) |
| book-of-daniel | Hultgård | Persian Apocalypticism and the Book of Daniel | CONFLATED | Forms and Origins of Iranian Apocalypticism (1983) |
| jubilees | Boccaccini & Ibba | Heavenly Tablets… | CONFLATED | Enoch and the Mosaic Torah (Eerdmans 2009) |
| wisdom-of-solomon | Hays | The Hellenistic Background of the Letter to the Romans | FABRICATED | Echoes of Scripture in the Letters of Paul (Yale 1989) |
| wisdom-of-solomon | Collins | Wisdom and the Wise… | FABRICATED+pub | Jewish Wisdom in the Hellenistic Age (WJK 1997) |
| philo-of-alexandria | Niehoff | Philo of Alexandria: A Thinker in the Jewish Diaspora | CONFLATED | …An Intellectual Biography (Yale 2018) |
| gospel-of-john | Hengel | The Gospel of John in the Light of the OT | CONFLATED | The Johannine Question (SCM/Trinity 1989) |
| plato-timaeus-critias | Welliver | Plato's Critias: A Commentary | CONFLATED | Character, Plot and Thought in Plato's Timaeus-Critias (Brill 1977) |
| manetho-aegyptiaca | Verbrugghe & Wickersham | Manetho's Aigyptiaka and Egyptian Historiography | CONFLATED | Berossos and Manetho, Introduced and Translated (2001) |
| manetho-aegyptiaca | Dillery | Manetho and the History of Egypt (OUP) | CONFLATED | Clio's Other Sons: Berossus and Manetho (U Michigan 2015) — propagated through 6 locations |
| plotinus-enneads | Narbonne | Plotinus and the Gnostics | CONFLATED | Plotinus in Dialogue with the Gnostics (Brill 2011) |
| ignatius-letters | Brent | Ignatius of Antioch and the Parting of the Ways | CONFLATED | …A Martyr Bishop and the Origin of Episcopacy (T&T Clark 2007) |
| ignatius-letters | Foster | Ignatius and His Time (Brill) | FABRICATED | The Writings of the Apostolic Fathers (T&T Clark 2007) |
| ibn-arabi-fusus | Knysh | Mystical Astrologies… (Brill) | CONFLATED | Ibn ʿArabī in the Later Islamic Tradition (SUNY 1999) |
| avatamsaka-sutra | Hamar | The Avataṃsaka Sūtra: Its Origin and Influence | CONFLATED | Reflecting Mirrors: Perspectives on Huayan Buddhism (2007) |
| lotus-sutra | Kim | Buddhist Cosmologies and the Lotus Sutra's… | FABRICATED | Tao-sheng's Commentary on the Lotus Sūtra (SUNY 1990) |
| lankavatara-sutra | Faure | Bodhidharma: The Greatest Zen Master (=Osho's title) | CONFLATED | "Bodhidharma as Textual and Religious Paradigm" (Hist. of Religions 25, 1986) |
| sukhavativyuha-larger | Schroeder→Curley | Pure Land, Real World… | CONFLATED | wrong AUTHOR — Curley (U Hawaii 2017) |
| apuleius-metamorphoses | Witt | Isis in the Ancient World (year 1971) | WRONG-YEAR | the 1997 JHU reissue (1971 ed = Isis in the Graeco-Roman World) |
| luria-vital-etz-chayyim | Avivi | Kabbalah Le-Lurianic Yetsirat ha-Olamot | FABRICATED | Kabbalat Ha-Ari (Ben-Zvi 2008) |
| luria-vital-etz-chayyim | Magid | Beginning of Wisdom… (Stanford) | CONFLATED | From Metaphysics to Midrash (Indiana 2008) |
| luria-vital-etz-chayyim | Faierstein | Hayyim Vital: A Kabbalistic Autobiography | CONFLATED | Jewish Mystical Autobiographies (Paulist 1999) |

Graders correctly **declined false positives**: Fitzmyer's real Luke+Acts commentaries, Scholem's two real works, Loeb spine-titles (Most/Hesiod), Irenaeus Adv.Haer.=Against Heresies, Larson's two works, Leibniz/publisher-field artifacts, etc.

## OPEN DECISION — the metadata layer (John's call)
The pre-filter flagged **~86 metadata-status nodes** the full-docs fleet did NOT cover. The defect reaches them too — **`document-kuntillet-ajrud-inscriptions`** (metadata) carried a confirmed Hadley fabrication ("The Sacred Marriage of Yahweh and Asherah" → her real *The Cult of Asherah in Ancient Israel and Judah*), **fixed this commit** as proof. The handoff scoped P1 to *full* docs; whether to extend the sweep to the metadata layer is a genuine scope decision:
- **(A)** Full grader sweep over the ~86 flagged metadata nodes (~11 more grader batches; expect ~5% real defect rate buried in many author-cited-twice false positives).
- **(B)** Targeted pass — grade ONLY the specific pre-filter-flagged refs in metadata nodes (cheaper; catches kuntillet-class fabrications without holistic re-grading).
- **(C)** Defer metadata-layer audit; proceed to P2 stubs + figures.

## Still open from the handoff
- **P2 — the ~32 thin stubs** (worklist in the 2026-06-03 handoff §3). Unstarted.
