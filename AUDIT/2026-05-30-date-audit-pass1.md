# DATE AUDIT — PASS 1 FINDINGS (2026-05-30)

**Mandate from handoff `HANDOFF-2026-05-30-codex-flow-and-timeline-rigor.md`:** multi-agent audit on dates for `03_deities/` + `02_documents/` before any new scripture content ingestion, because B-DATING-5 (Timeline date-range slide-right, commit `1917a00b`) requires honest range endpoints to declutter dense epochs.

**Pass 1 approach:** instead of fanning out blindly across 1,242 files, do cheap manual recon first to calibrate the real problem, then size Pass 2 around findings.

---

## TL;DR — the real audit problem is NOT what the handoff predicted

The handoff predicted the dominant failure mode would be "wrong single-year facts that should be ranges." Pass 1 shows that's a minor problem (~5 fixable docs). The dominant failure mode is:

> **173 of 719 deities (24.1%) have an empty `period-active-latest` field**, and ~150 of those are from currently-active traditions (Hindu, Buddhist, Christian, Islamic, Shinto, Yoruba, Vodou, etc.).

This is what's piling up the Timeline: those 173 nodes have no slide-right range, so they all stack at their `period-active-earliest` date. B-DATING-5 can't help them. The fix is mechanical and high-leverage.

---

## Inventory (numbers)

### 03_deities/ (719 total)

| Field state | Count | % | Action |
|---|---|---|---|
| Both fields present and populated | 509 | 70.8% | (no audit action by default; sample-check ranges in Pass 2) |
| `period-active-latest` empty string `""` | **173** | **24.1%** | **bulk fix needed** |
| Both fields missing | 37 | 5.1% | needs both endpoints |
| `period-active-earliest` empty | 0 | 0% | — |

### 02_documents/ (515 real .md files; excludes `_TODO.md`, `README.md`)

| Field state | Count | Action |
|---|---|---|
| Full schema (`date-composed-earliest` + `date-composed-latest`, both populated) | 402 | sample audit in Pass 2 |
| Stub schema (only `date-earliest`) | 88 | Lane-A content build-out; not a Pass-2 audit problem |
| Undated | 25 | needs dating from scratch |
| `date-composed-latest` empty or missing | **0** | nothing to fix here |
| Single-year docs (earliest == latest) | 31 | **manually triaged; see below** |

---

## Finding 1 — 5 single-year documents are suspect (of 31)

The other 26 are correctly single-year (printed books, single-event documents, dated letters). Five need actual fixes:

| File | Current | Issue | Proposed |
|---|---|---|---|
| `02_documents/_phase-5-medieval/phase-5-046-ibn-rushd-tahafut-al-tahafut.md` | 1180/1180 | Composed late 1170s–early 1180s per Fakhry 2001 and Urvoy 1991 | `date-composed-earliest: 1179`, `date-composed-latest: 1184` |
| `02_documents/_phase-6-early-modern/phase-6-002-ripley-compound-of-alchemy.md` (probable file) | 1471/1471 | Title conflates *Compound of Alchemy* (1471 by George Ripley) with *Ripley Scroll* (later 15th–16th c. illuminated tradition, separate work) | Verify file content; if both works are referenced, split into two nodes or restrict to *Compound of Alchemy* (1471 stays single-year for that work alone) |
| `02_documents/_phase-7-modern/phase-7-041-varieties-of-religious-experience.md` | 1902/1902 | Gifford Lectures delivered 1901–1902; published 1902 | `date-composed-earliest: 1901`, `date-composed-latest: 1902` |
| `02_documents/_phase-6-early-modern/phase-6-035-maier-atalanta-fugiens.md` | 1617/1617 | First edition 1617, expanded edition 1618 (both Oppenheim, de Bry) | `date-composed-earliest: 1617`, `date-composed-latest: 1618` |
| `02_documents/_phase-6-early-modern/phase-6-004-pico-heptaplus.md` + `phase-6-003-pico-oration-900-conclusions.md` | 1489 / 1486 | `phase-6-004-pico-heptaplus.md` title field reads "Heptaplus + Conclusiones Cabalisticae" but Conclusiones Cabalisticae are part of the 900 Conclusions (1486 entry). Either de-conflate the title or include 1486 in range. | Verify by reading both files; remove cross-bleed in title or expand Heptaplus range to `1486–1489` if conjoint treatment is intended. |

These are minor relative to Finding 2.

---

## Finding 2 — 173 deities with empty `period-active-latest` (the headline)

Bucketed by tradition state:

| Bucket | Count | Proposed `latest` |
|---|---|---|
| **DETERMINISTIC**: Currently-active traditions with unbroken continuous cult | **~148** | `2026` |
| **NEEDS SCHOLARSHIP**: Genuinely extinct ancient cults | ~22 | per-node historical end date |
| **EDGE CASES**: Schema-ambiguous (revival movements, literary survival) | ~3 | depends on schema rule |

### The schema decision this audit forces

There are two defensible interpretations of `period-active-latest`:

- **(A) End of unbroken continuous cult under this name/form** — under A, Zeus's latest is ~400 CE (Christianization of the Empire ended state cult; later "Zeus" appearances are literary, not cultic). Modern revivals (Ásatrú for Odin, Hellenismos for Zeus, Kemetic for Ra) don't count. Syncretic continuations (Brigid → St. Brigid, Supay → El Tío) DO count because they're cult-continuous.
- **(B) Last date the deity received any veneration including revivals and literary "active" reception** — under B, Zeus's latest is 2026 (Hellenismos exists), Odin's is 2026 (Ásatrú is a legally-recognized religion in Iceland since 1973), Prometheus is 2026 (live in modern literature and political theology).

**Existing vault values strongly suggest interpretation (A):**
- Ra: `period-active-latest: 500` (last temple closures, not modern Kemetic revival)
- Zeus: `period-active-latest: 400` (Theodosian edicts, not Hellenismos)
- Odin: `period-active-latest: 1100` (Christianization of Scandinavia, not Ásatrú)
- Krishna: `period-active-latest: 2025` (continuous cult, A applies)
- Brahma: `period-active-latest: 2026` (continuous cult — Pushkar temple unbroken, A applies)

**Lead's proposed rule (matches existing values, just makes it explicit):**

> `period-active-latest` = the last year of unbroken continuous cult under this name or its direct syncretic continuation (Christian-syncretized saints count; modern revivals do not).

**John — needs your ratification before I batch-fix 148 files. Reply LGTM / counter-proposal.**

### Under that rule, the deterministic 148 group splits as:

| Tradition cluster | Approx count | Examples |
|---|---|---|
| Hindu / Vedic / Vaishnava / Shaiva / Shakta / Bhakti / Tantric | 18 | vishnu, shiva, parvati, sita, radha, dattatreya, bhairava, garuda, harihara, kubera, matsya-avatar, narayana, the-ashvins, yashoda, nandi, skanda-karthikeya, purusha, yama-vedic |
| Mahāyāna / Vajrayana / Theravāda Buddhism | 11 | akshobhya, amitabha, amoghasiddhi, vairocana, ratnasambhava, maitreya, manjushri, hariti, prajnaparamita-goddess, sakra-buddhist, yamantaka |
| Christian / Trinitarian / Christ + Mary + Holy Spirit | 7 | god-the-father-christian, jesus-christ-deity, holy-spirit, the-trinity, mary-theotokos, mary-of-zion, christ-pantokrator |
| Archangels (Christian/Jewish/Islamic shared) | 9 | gabriel-archangel, michael-archangel, raphael-archangel, uriel-archangel, raguel-archangel, remiel-archangel, saraqael-archangel, head-of-days, israfil |
| Second-Temple Jewish apocalyptic preserved in Ethiopian Orthodox canon | 4 | angel-of-the-presence, the-lady-ecclesia-hermas, the-shepherd-angel-of-repentance, (head-of-days already counted) |
| Shinto | 13 | amaterasu, amenominakanushi, ebisu, fujin, hachiman, inari, izanagi, izanami, okuninushi, raijin, ryujin, susanoo, takamimusubi, takemikazuchi, toyouke-omikami, tsukuyomi |
| Yoruba (continental + Santería + Candomblé continuations) | 8 | eshu, obatala, ogun, olodumare, orunmila, osanyin, oshun, oya, shango, yemoja |
| Haitian Vodou + Fon-Ewe vodun antecedents | 13 | aida-wedo, baron-samedi, bondye-vodou, damballa, dan-aida-hwedo, erzulie, gede-loa, gu-vodun, heviosso, kalfu-vodou, lasiren-vodou, marassa-twins, ogou-vodou, papa-legba |
| Akan / Igbo / Bantu / Khoisan / Maasai / Shona / Zulu / pan-African | 10 | asase-yaa, nyame, ala-igbo, chukwu-igbo, nzambi, kaang-san, ngai-maasai, mwari, unkulunkulu-zulu, simbi-kongo, mami-wata |
| Chinese folk / Daoist (still active) | 10 | jade-emperor, mazu, three-pure-ones, xi-wangmu, fuxi, nuwa, pangu, gonggong, hou-yi, chang-e, leigong |
| Japanese Buddhism (Shichifukujin + Yánluó/Enma) | 2 | benzaiten, enma-japanese |
| Māori (Pacific) | 9 | haumia-tiketike, io-matua-kore, papatuanuku, ranginui, rongo-maori, tane, tangaroa, tawhirimatea, tu-maori |
| Hawaiian / pan-Polynesian | 5 | kane-hawaiian, ku, lono, pele, wakea, maui-polynesian |
| Native American (Lakota / Diné / Haudenosaunee / Anishinaabe / Pacific Northwest / Pueblo / Inuit / Algonquian) | 13 | inyan, wakan-tanka, white-buffalo-calf-woman, wi-sun-lakota, changing-woman, spider-woman-navajo, sun-bearer, flint-deity, sapling-deity, manabozho, gitche-manitou, raven-trickster, sedna-inuit, corn-mother |
| Andean syncretic survivors (Pachamama / Supay→El Tío) | 2 | pachamama, supay |
| Aboriginal Australian (Wiradjuri/etc. + pan) | 2 | baiame, rainbow-serpent |
| Christian saints + Christian demonology (lucifer, beelzebub, asmodeus as ongoing-religious-imagination figures) | 4 | saint-blaise, lucifer, beelzebub, asmodeus |
| Celtic pagan figures with documented Christianized continuation (Brigid → St. Brigid) | 1 | brigid |

**TOTAL ~148** (some overlap because the same node may belong to two traditions; final count after dedup ~145–150).

### Under proposed rule (A), the NEEDS SCHOLARSHIP group (~22):

These need per-node end-date research because revivals don't count:

- **Greek religion**: atlas-titan, iapetus, mnemosyne, prometheus, rhea, the-erinyes, the-moirai, themis (8) — likely all `period-active-latest: 400` (Theodosian closures, matching Zeus)
- **Roman religion**: fortuna (1) — likely `400` (matching Mars/Jupiter/Apollo at 400)
- **Maya extinct**: ah-puch, ixbalanque (2) — likely `1697` (fall of Itza, last independent Maya polity), confirm with Restall 1998
- **Inca/Andean extinct**: coniraya, pariacaca (2) — likely `1572` (Tupac Amaru I execution) or `1608` (Huarochirí Manuscript closing date), needs Andean studies source
- **Norse pre-revival**: bergelmir (1) — likely `1100` (matching Odin/Thor/Freyja/Loki at 1100)
- **Celtic Gaelic without continuation**: cernunnos, dagda, lugh, manannan-mac-lir, nuada, the-morrigan (6) — Brigid has Christian continuation but these do not; likely `600–800` (Christianization of Ireland/Wales)
- **Slavic pre-revival**: jarilo (1) — likely `988` (Christianization of Kievan Rus')
- **Finno-Karelian**: ukko, vainamoinen (2) — runic singing tradition documented through 19th c.; Kalevala redaction 1849. Likely `1900` or thereabouts.

These 22 are the natural Pass-2 workflow scope: 4 goblins by region (Mediterranean / Mesoamerican-Andean / Northern-European / Other), each returning proposed end dates with Tier-1 sources.

### The 3 EDGE CASES:

| File | Issue | Lead's call |
|---|---|---|
| `bergelmir.md` (Norse) | uses `[[tradition-norse]]` tag — listed once but groups with the other extinct-Norse-pre-revival set | treat as NEEDS-SCHOLARSHIP (latest = 1100, matching Odin) |
| `jarilo.md` (Slavic pre-Christian) | Rodnovery revival is significant in modern Russia/Ukraine/Poland — but under rule (A) it doesn't count | NEEDS-SCHOLARSHIP, latest = 988 |
| `lucifer.md` | Christianity (post-Jerome Vulgate) → Romantic reception → Modern Satanism — covers ~1600 years of religious-imagination veneration; Modern Satanism (LaVey 1969) IS continuous cult | DETERMINISTIC `2026` |

---

## Finding 3 — 37 deities missing both date fields entirely

Separate from the 173 empties. These need both endpoints, not just latest. Run `find ~/Desktop/Codex\ Atlas/03_deities -name '*.md' | xargs grep -L '^period-active-earliest:'` to list. Pass-2 scope.

---

## Recommended action sequence

1. **John ratifies the schema rule** (or counter-proposes). 1-line reply.
2. **Bulk-fix the ~148 DETERMINISTIC empties** → `period-active-latest: 2026`. Lane-A content batch, deterministic per-tradition. Single commit. Estimated <30 min.
3. **Pass-2 workflow on the 22 NEEDS-SCHOLARSHIP extinct cults.** 4 goblins by region, returns proposed YAML patches with Tier-1 sources. Estimated 4 agents × ~20K tokens each = ~80K total.
4. **Pass-2 workflow on the 37 missing-both-fields deities.** Same fan-out shape.
5. **Pass-3** (separate session): sample audit on the 402 documents with full schemas + 509 deities with full schemas. Random-stratified 30 nodes per tradition cluster; spot-check ranges. Only run if Pass-1/2 fixes don't visibly declutter the Timeline.
6. **Fix 5 single-year-document issues** (Finding 1). Lane-A. Tiny.
7. **Refresh 44 stale `2025` values to `2026`** for consistency. (Lower priority; consider an annual rollover script.)

After steps 2–4, the Timeline B-DATING-5 slide should fire correctly for every deity, decluttering the pile-up the handoff identified.

---

## What I'm NOT doing without your ratification

- Mass-editing 148 deity YAML files
- Running a workflow (per ops doctrine, multi-agent fan-out needs explicit opt-in even with the handoff pre-authorization)
- Touching the 22 extinct-cult dates (those need scholarship I can produce in Pass 2, not guess inline)

Ready to execute steps 2 and 3 the moment you ratify rule (A) or hand me a counter-rule.
