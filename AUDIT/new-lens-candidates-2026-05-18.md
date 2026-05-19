# Candidates for the 10 new lenses — backlog from existing vault

**Date:** 2026-05-18 (post-ontology-lock, same evening)
**Author:** opus
**Status:** read-only audit; output is a structured backlog for the next wave of investigation agents.

## Why this audit exists

The 2026-05-18 ontology lock added 10 new lenses (`08_places/`, `18_languages/`, `19_astronomy/`, `20_sacred_architecture/`, `21_theology/`, `22_practices/`, `23_material_culture/`, `24_pharmacology/`, `25_divination/`, `26_calendars/`). They start empty. **Are they speculative additions, or is there latent demand already in the vault?**

This audit answers that by grepping existing content for entities that would belong in the new lenses if they were created today. The answer is: **demand is overwhelming.** Some entities (`mercury`, `soma`, `ifa`, `alexandria`, `rome`, `pyramid`, `axis mundi`, `apophatic`) are mentioned in 50–300+ files but have no dedicated home; they exist as cross-references with nowhere to point.

This file produces a **prioritized backlog** for Lane A investigation agents to pick from.

---

## Methodology

For each new lens, ran `grep -rli <entity>` across the relevant existing content folders (`02_documents/`, `03_deities/`, `04_persons/`, `05_events/`, `06_themes/`, `07_traditions/`, `09_symbols/`, `12_alchemy/`, `14_rituals/`, `15_philosophy/`, `16_mathematics/`, `17_medicine/`) to count how many files mention the entity. The count is a **demand signal** — not exhaustive, but a defensible proxy for how often each candidate is currently a dangling reference.

**Volume thresholds used:**
- **🔴 CRITICAL (50+ files)** — node almost certainly needed; many existing nodes have nowhere to point.
- **🟠 HIGH (15–49 files)** — clear demand; create early.
- **🟡 MEDIUM (5–14 files)** — real but lighter; create when adjacent batches touch the topic.
- **🟢 LOW (1–4 files)** — minor; consider a stub during a related absorption.
- **⚪ ZERO** — not in vault yet but should be (proactive additions).

Tracked separately: **whether an existing node already covers part of the entity** (e.g. Soma the deity in `03_deities/` doesn't cover Soma the substance — both are needed, cross-linked).

---

## §1. `24_pharmacology/` — substance candidates

**Verdict:** **strongly validated.** Substances are the most cross-cutting category in the vault — they appear in deity nodes, ritual nodes, alchemy nodes, medicine nodes, theme nodes, document nodes, simultaneously. Today they have no home of their own.

| Substance | Files mentioning | Signal | Existing coverage | Status / recommended action |
|---|---:|:---:|---|---|
| **mercury** (alchemical) | 87 | 🔴 | `03_deities/mercury-roman.md` (the *deity*) | Critical gap — needs `mercury-alchemical` substance node distinct from the deity. Both exist, cross-link. |
| **soma** | 51 | 🔴 | `03_deities/soma-deity.md` (the *deity*) | Critical gap — needs `soma` substance node (the drink/plant). The Vedic substance is the basis for ~half the Vedic ritual mentions. |
| **haoma** | 23 | 🟠 | (none confirmed) | High demand — needs `haoma` substance node. Cross-link to soma (linguistic cognate + ritual cognate). |
| **amrita** | 13 | 🟡 | (theme-level only) | Medium — divine nectar / immortality drink; needs substance + motif cross-link. |
| **myrrh** | 9 | 🟡 | none | Medium — biblical + Egyptian ritual + medicine. |
| **opium** | 9 | 🟡 | none | Medium — Greek + Islamic medical history + later modern context. |
| **kykeon** | 8 | 🟡 | (mentioned in Eleusinian context only) | Medium — Eleusinian mystery drink; ergot-hypothesis literature attached. |
| **cannabis** | 7 | 🟡 | none | Medium — Scythian funerary + Vedic + Chinese + medical. |
| **frankincense** | 6 | 🟡 | none | Medium — cross-tradition ritual incense. |
| **ergot** | 6 | 🟡 | (Eleusinian context only) | Medium — Eleusinian + medieval St. Anthony's fire. |
| **psilocybin / sacred mushroom** | 4 | 🟢 | none | Low-mid — Mesoamerican + modern psychedelic literature. |
| **peyote** | 4 | 🟢 | none | Low-mid — Mesoamerican + Native American Church + Huichol. |
| **blue lotus** | 4 | 🟢 | (mentioned in Egyptian context) | Low-mid — Egyptian ritual + cosmology + pharmacology. |
| **ginseng** | 3 | 🟢 | none | Low — Chinese medicine staple. |
| **ayahuasca** | 2 | 🟢 | none | Low — Amazonian + modern. |
| **mandrake** | 1 | 🟢 | none | Low — Genesis (Reuben/Leah) + medieval European magic. |
| **iboga** | 1 | 🟢 | none | Low — Bwiti. |
| **silphium** | 0 | ⚪ | none | Proactive — lost-antiquity drug, well-documented; worth a stub. |

**Top 5 picks for first `24_pharmacology/` batch:**
1. `mercury-alchemical` (87 mentions, distinct from deity)
2. `soma` (51 mentions, distinct from deity)
3. `haoma` (23 mentions, cross-link to soma)
4. `amrita` (13 mentions)
5. `kykeon` (8 mentions, anchors Eleusinian-pharmacology MASSIVE-WIN)

---

## §2. `08_places/` — geographic loci candidates

**Verdict:** **extreme validation.** Cities and regions are mentioned in hundreds of files. The vault has been treating them as ambient context but they deserve first-class nodes.

| Place | Files | Signal | Recommended action |
|---|---:|:---:|---|
| **Rome** | 331 | 🔴 | Critical — `rome-place`. The single most-referenced geographic locus in the vault. |
| **Alexandria** | 252 | 🔴 | Critical — `alexandria`. THE cross-tradition crossroads (Greek+Egyptian+Jewish+Christian+Hermetic). |
| **Jerusalem** | 237 | 🔴 | Critical — `jerusalem`. Multi-tradition sacred site + city. |
| **Athens** | 103 | 🔴 | Critical — `athens-place`. Philosophical + religious center. |
| **Constantinople** | 97 | 🔴 | Critical — `constantinople`. Byzantine capital, council site. |
| **Babylon** | 94 | 🔴 | Critical — `babylon`. Mesopotamian metropolis + biblical exile site. |
| **Antioch** | 69 | 🟠 | High — early Christian center, Pauline mission base. |
| **Ephesus** | 53 | 🔴 | Critical — `ephesus`. Council site (431), Pauline mission. |
| **Mecca** | 48 | 🟠 | High — `mecca-place` (the city; Kaaba is sacred-site). |
| **Toledo** | 35 | 🟠 | High — translation-school transmission node. |
| **Thebes** (Egypt) | 34 | 🟠 | High — `thebes-egypt-place`. |
| **Uruk** | 30 | 🟠 | High — earliest urban / temple complex. |
| **Varanasi** | 11 | 🟡 | Medium — Hindu sacred city. |
| **Tenochtitlan** | 11 | 🟡 | Medium — Aztec capital. |
| **Harran** | 10 | 🟡 | Medium — Sabian astrology center, late-antique node. |
| **Cordoba** | 7 | 🟡 | Medium — al-Andalus center. |
| **Ctesiphon** | 4 | 🟢 | Sasanian capital. |
| **Lhasa** | 3 | 🟢 | Tibetan religious center. |
| **Axum** | 2 | 🟢 | Ethiopian Christian capital (low count surprising — Ethiopian wedge work may not reference the place explicitly). |
| **Cuzco** | 2 | 🟢 | Inca capital. |

**Top 5 picks for first `08_places/` batch:**
1. `alexandria` (252; THE crossroads)
2. `jerusalem` (237; multi-tradition)
3. `rome-place` (331; will need disambiguation from `tradition-roman-religion`)
4. `constantinople` (97; council site)
5. `babylon` (94; biblical + Mesopotamian)

---

## §3. `25_divination/` — divination-system candidates

**Verdict:** **strongly validated.** The Ifá ↔ Yi Jing MASSIVE-WIN already drives heavy reference counts; today neither has a `divination-system` node.

| System | Files | Signal | Recommended action |
|---|---:|:---:|---|
| **Ifá** (sum of "ifa" + "ifá") | 154+28 = 182 | 🔴 | Critical — `ifa-odu-divination`. The Yoruba 256-permutation system. Already MASSIVE-WIN flagged in ONTOLOGY §4-B. |
| **Yi Jing / I Ching** | 11 + 11 (overlap) | 🟡 | Medium-but-MASSIVE-WIN — `yi-jing-divination` (distinct from `yi-jing` document). 4000-year-old binary parallel to Ifá. |
| **Augury** | 11 | 🟡 | Medium — `augury-etruscan-roman`. Bird-flight reading. |
| **Babalawo** | 10 | 🟡 | Medium — Ifá priest-diviner (might fit better in `04_persons/` as role, with edge to `ifa-odu-divination`). |
| **Tarot** | 9 | 🟡 | Medium — `tarot-divination-system` (distinct from Tarot symbolism / specific decks). |
| **Oracle bone (scapulimancy)** | 7 | 🟡 | Medium — Chinese Shang-dynasty divination. |
| **Haruspicy** | 6 | 🟡 | Medium — Etruscan/Roman liver-reading. |
| **Geomancy / raml** | 3 | 🟢 | Low — Islamic + European geomantic systems. |
| **Haruspex** (person) | 2 | 🟢 | Could be a `person` role; the *system* is haruspicy. |
| **Feng shui** | 1 | 🟢 | Low — when treated divinatorily. |
| **Oneiromancy** | 1 | 🟢 | Low — dream divination. |
| **Geomancy (specifically `raml`)** | 0 | ⚪ | Proactive — Islamic geomantic system worth a stub. |

**Top 5 picks for first `25_divination/` batch:**
1. `ifa-odu-divination` (182 combined; MASSIVE-WIN anchor)
2. `yi-jing-divination` (22 combined; MASSIVE-WIN parallel)
3. `tarot-divination-system` (9; complete the binary/categorical-permutation trio)
4. `augury-etruscan-roman` (11; Roman-pagan context)
5. `oracle-bone-scapulimancy-shang` (7; ancient Chinese)

**Important:** Ifá's 154-file count is extraordinary. Today every Yoruba/Afro-diasporic node mentioning Ifá has nowhere to point for the *system itself*. This is the single highest-yield new-lens node to create first.

---

## §4. `20_sacred_architecture/` — sacred-site candidates

**Verdict:** **strongly validated.** Many high-count items, all with no dedicated home.

| Site | Files | Signal | Recommended action |
|---|---:|:---:|---|
| **Pyramid** (generic + specific) | 162 | 🔴 | Critical — needs `pyramid-of-khufu`, `pyramid-of-khafre`, `pyramid-of-djoser-step-pyramid`, plus the *form* `pyramid-form-sacred-architecture`. Possibly Mesoamerican pyramids separately. |
| **Axis mundi** | 81 | 🔴 | Critical — `axis-mundi-sacred-architecture-concept` OR keep as theme/motif and cross-link to specific sites. Probably motif + concept. |
| **Solomon's Temple** | 33 | 🟠 | High — `solomons-temple-first` and `solomons-temple-second`. |
| **Karnak** | 32 | 🟠 | High — `karnak-temple-complex`. |
| **Stupa** (generic + specific) | 24 | 🟠 | High — needs `stupa-form` (the architectural form) + specific stupas (Sanchi, Borobudur, Bodhnath). |
| **Mount Meru** | 18 | 🟠 | High — `mount-meru-mythic-sacred-mountain`. Cross-link to Buddhist + Hindu cosmologies. |
| **Kaaba** | 15 | 🟡 | Medium — `kaaba`. Distinct from Mecca-the-city. |
| **Ziggurat** (form + specific) | 14 | 🟡 | Medium — `ziggurat-form` + specific (Ur, Babylon). |
| **Stonehenge** | 14 | 🟡 | Medium — `stonehenge-monument`. |
| **Göbekli Tepe** | 10 | 🟡 | Medium — `gobekli-tepe`. Oldest known monumental sacred architecture. |
| **Hagia Sophia** | 7 | 🟡 | Medium — `hagia-sophia`. |
| **Dome of the Rock** | 6 | 🟡 | Medium — `dome-of-the-rock`. |
| **Angkor Wat** | 6 | 🟡 | Medium — `angkor-wat-temple-complex`. |
| **Borobudur** | 4 | 🟢 | Low — `borobudur-stupa-mandala`. |
| **Mount Sinai** | 4 | 🟢 | Low — sacred mountain node. |
| **Mount Kailash** | 3 | 🟢 | Low — `mount-kailash`. |
| **Chichen Itza** | 2 | 🟢 | Low — Mesoamerican center. |
| **Uluru** | 1 | 🟢 | Low — Aboriginal sacred site. |
| **Western Wall** | 0 | ⚪ | Proactive — surprising zero, given Solomon's Temple count. |

**Top 5 picks for first `20_sacred_architecture/` batch:**
1. `pyramid-of-khufu` + `pyramid-of-khafre` + `pyramid-of-djoser-step-pyramid` (162 mentions of "pyramid" across the vault)
2. `solomons-temple-first` + `solomons-temple-second` (33)
3. `karnak-temple-complex` (32)
4. `kaaba` (15; distinct from Mecca-place)
5. `gobekli-tepe` (10; oldest known)

---

## §5. `21_theology/` — doctrine candidates

**Verdict:** **strongly validated.** Theological positions are everywhere in existing content as ambient terms but have no first-class node.

| Doctrine | Files | Signal | Recommended action |
|---|---:|:---:|---|
| **Apophatic theology** | 109 | 🔴 | Critical — `apophatic-theology`. Via-negativa as cross-tradition convergence (Plotinus/Dionysius/Eckhart/Ibn Arabi/Maimonides/Madhyamaka). |
| **Trinitarian** (theology) | 71 | 🔴 | Critical — `trinitarian-theology-classical` + variants (Augustinian, Cappadocian). |
| **Advaita** (Vedanta) | 69 | 🔴 | Critical — `advaita-vedanta-doctrine` (distinct from Shankara the person). |
| **Arianism** | 54 | 🔴 | Critical — `arianism-doctrine`. The 4th-c. controversy that defined Nicaea. |
| **Chalcedonian** Christology | 33 | 🟠 | High — `chalcedonian-christology`. |
| **Theotokos** | 29 | 🟠 | High — `theotokos-doctrine` (Marian). |
| **Miaphysite** Christology | 28 | 🟠 | High — `miaphysite-christology`. Coptic/Tewahedo/Syriac. |
| **Nestorian** Christology | 21 | 🟠 | High — `nestorian-christology`. |
| **Predestination** | 21 | 🟠 | High — needs splitting: `predestination-calvinist`, `predestination-augustinian`, possibly `predestination-islamic-qadar`. |
| **Vishishtadvaita** | 9 | 🟡 | Medium — `vishishtadvaita-doctrine` (Ramanuja). |
| **Tawhid** | 8 | 🟡 | Medium — `tawhid-doctrine` (in specific kalām formulations). |
| **Sola Scriptura** | 7 | 🟡 | Medium — `sola-scriptura-doctrine`. |
| **Sola Fide** | 7 | 🟡 | Medium — `sola-fide-doctrine`. |
| **Transubstantiation** | 7 | 🟡 | Medium — `transubstantiation-doctrine`. |
| **Filioque** | 5 | 🟢 | Low-mid — `filioque-doctrine`. |
| **Mariology** (broad) | 4 | 🟢 | Low — umbrella; specific doctrines below. |
| **Anatta** (no-self) | 3 | 🟢 | Low — `anatta-doctrine`. |
| **Trikāya** | 2 | 🟢 | Low — `trikaya-doctrine` (despite low count, doctrinally central to Mahayana). |
| **Monothelitism** | 2 | 🟢 | Low — `monothelitism-doctrine` (7th-c. controversy). |
| **Immaculate Conception** | 2 | 🟢 | Low — `immaculate-conception-doctrine`. |
| **Consubstantiation** | 1 | 🟢 | Low — `consubstantiation-doctrine` (Lutheran). |

**Top 5 picks for first `21_theology/` batch:**
1. `apophatic-theology` (109; the cross-tradition mystical convergence)
2. `advaita-vedanta-doctrine` (69)
3. `trinitarian-theology-classical` + variants (71 combined)
4. `arianism-doctrine` + `chalcedonian-christology` + `miaphysite-christology` + `nestorian-christology` (the Christological-controversy cluster — 136 combined)
5. `tawhid-doctrine` (8; underrepresented given Islamic centrality — needs anchor node)

---

## §6. `22_practices/` — practice candidates

**Verdict:** **validated.** Contemplative practices appear scattered across rituals, philosophy, and traditions.

| Practice | Files | Signal | Recommended action |
|---|---:|:---:|---|
| **Japa** (mantra-recitation) | 106 | 🔴 | Critical — `japa-mantra-recitation`. Hindu / Sufi parallel via dhikr. |
| **Mantra** (general practice) | 47 | 🟠 | High — `mantra-practice-general` + specific mantras. |
| **Merkavah** (ascent practice) | 22 | 🟠 | High — `merkavah-ascent-practice`. Distinct from Merkavah literature. |
| **Dhikr** | 10 | 🟡 | Medium — `dhikr-sufi`. |
| **Kundalini** | 10 | 🟡 | Medium — `kundalini-practice`. |
| **Jesus Prayer** | 7 | 🟡 | Medium — `jesus-prayer-hesychast`. |
| **Hesychasm** | 7 | 🟡 | Medium — `hesychasm-prayer-of-the-heart`. |
| **Pranayama** | 6 | 🟡 | Medium — `pranayama-yogic`. |
| **Neidan** | 6 | 🟡 | Medium — `neidan-daoist-internal-alchemy`. |
| **Shikantaza** | 4 | 🟢 | Low — `shikantaza-zen`. |
| **Vipassana** | 3 | 🟢 | Low — `vipassana-insight`. |
| **Samatha** | 3 | 🟢 | Low — `samatha-calm-abiding`. |
| **Tonglen** | 2 | 🟢 | Low — `tonglen-giving-and-taking`. |
| **Centering Prayer** | 1 | 🟢 | Low — `centering-prayer-keating`. |
| **Jhana** | 1 | 🟢 | Low — `jhana-absorption`. |
| **Lectio divina** | 0 | ⚪ | Proactive — central Christian contemplative practice. |
| **Kabbalistic meditation** | 0 | ⚪ | Proactive — central Jewish mystical practice. |

**Top 5 picks for first `22_practices/` batch:**
1. `japa-mantra-recitation` (106)
2. `dhikr-sufi` (10; cross-link to japa as parallel)
3. `hesychasm-prayer-of-the-heart` + `jesus-prayer-hesychast` (14 combined)
4. `merkavah-ascent-practice` (22)
5. `neidan-daoist-internal-alchemy` (6; under-represented but anchors Daoist contemplative tradition)

---

## §7. `18_languages/` — language candidates

**Verdict:** **strongly validated.** Languages are everywhere as ambient context.

| Language | Files | Signal | Recommended action |
|---|---:|:---:|---|
| **Latin** | 429 | 🔴 | Critical — `latin-classical` + `latin-medieval` + `latin-ecclesiastical`. Three nodes minimum. |
| **Hebrew** | 298 | 🔴 | Critical — `hebrew-biblical` + `hebrew-mishnaic` + `hebrew-modern`. Three nodes minimum. |
| **Sanskrit** | 124 | 🔴 | Critical — `sanskrit-vedic` + `sanskrit-classical`. |
| **Coptic** | 112 | 🔴 | Critical — `coptic-language`. Often distinct from Egyptian-religion content. |
| **Aramaic** | 102 | 🔴 | Critical — `aramaic-imperial` + `aramaic-biblical` + `aramaic-syriac`. |
| **Tibetan** | 71 | 🔴 | Critical — `tibetan-classical` + `tibetan-modern`. |
| **Sumerian** | 65 | 🔴 | Critical — `sumerian-language`. Earliest written language. |
| **Akkadian** | 55 | 🔴 | Critical — `akkadian-language` + variants (Old Akkadian / Babylonian / Assyrian). |
| **Pali** | 30 | 🟠 | High — `pali-language`. |
| **Avestan** (total) | 25+10 = 35 | 🟠 | High — `old-avestan` + `younger-avestan`. |
| **Koine Greek** | 19 | 🟠 | High — `koine-greek`. (Note: would expect higher; many texts probably mention "Greek" generically.) |
| **Classical Arabic** | 16 | 🟡 | Medium — `classical-arabic` + `quranic-arabic`. |
| **Old Persian** | 10 | 🟡 | Medium — `old-persian`. |
| **Old Church Slavonic** | 2 | 🟢 | Low. |
| **Ge'ez** (Ethiopic) | 0 (grep miss) | ⚪ | Proactive — actually well-represented in Ethiopian wedge but my regex missed apostrophes. Worth a node. |

**Top 5 picks for first `18_languages/` batch:**
1. `latin-classical` + `latin-medieval` + `latin-ecclesiastical` (429 mentions — must split by period)
2. `hebrew-biblical` + `hebrew-mishnaic` + `hebrew-modern` (298)
3. `sanskrit-vedic` + `sanskrit-classical` (124)
4. `aramaic-imperial` + `aramaic-syriac` (102)
5. `koine-greek` (19) — anchors the Hellenistic-transmission MASSIVE-WINs

**Also proactively:** `indo-european-family`, `afroasiatic-family`, `sino-tibetan-family`, `niger-congo-family` — language-family hubs that everything attaches to.

---

## §8. `19_astronomy/` — astronomy candidates

**Verdict:** **validated** but a smaller initial batch than other lenses.

| Entity | Files | Signal | Recommended action |
|---|---:|:---:|---|
| **Ptolemy** | 45 | 🔴 | Critical — `ptolemy-astronomer` distinct from `ptolemy-geographer` and `ptolemy-as-astrologer-tetrabiblos`. Same person, three roles, three nodes (or one node with role-tags). |
| **Kepler** | 21 | 🟠 | High — `kepler-astronomer`. Cross-link to harmonic-music-theory (Kepler's *Harmonices Mundi*). |
| **Galileo** | 11 | 🟡 | Medium — `galileo-astronomer`. |
| **al-Tusi / al-Ṭūsī** | 7 | 🟡 | Medium — `al-tusi-astronomer`. Maragha. |
| **Tycho** | 5 | 🟢 | Low — `tycho-brahe-astronomer`. |
| **Aryabhata** | 3 | 🟢 | Low — `aryabhata-astronomer`. |
| **Armillary sphere** | 3 | 🟢 | Low — `armillary-sphere-instrument`. |
| **Astrolabe** | 2 | 🟢 | Low — `astrolabe-instrument`. |
| **Almagest** | 2 | 🟢 | Low — `almagest-document` (in `02_documents/`) + as cross-ref from `ptolemy-astronomer`. |
| **Hipparchus** | 2 | 🟢 | Low — `hipparchus-astronomer`. |
| **Eratosthenes** | 1 | 🟢 | Low — `eratosthenes-astronomer-geographer`. |
| **Maragha** | 1 | 🟢 | Low — `maragha-observatory`. |
| **Shen Kuo** | 0 | ⚪ | Proactive — major Chinese astronomer/polymath. |
| **Ulugh Beg** | 0 | ⚪ | Proactive — Samarkand observatory founder. |
| **Antikythera** | 0 | ⚪ | Proactive — ancient analog computer; major artifact. |

**Top 5 picks for first `19_astronomy/` batch:**
1. `ptolemy-astronomer` (45; needs disambiguation node)
2. `kepler-astronomer` (21)
3. `galileo-astronomer` (11)
4. `al-tusi-astronomer` + `maragha-observatory` (7+1; transmission-chain anchors)
5. Proactive: `shen-kuo`, `ulugh-beg`, `antikythera-mechanism` — celebrated absences from the current graph.

---

## §9. `26_calendars/` — calendar-system candidates

**Verdict:** **weakly attested at the system level — high proactive demand.** Calendar systems are referenced obliquely (festivals, dates) but rarely as systems. This is a content gap, not a lens problem.

| System | Files | Signal | Recommended action |
|---|---:|:---:|---|
| **Yuga** | 25 | 🟠 | High — `vedic-yuga-system` (cyclic-cosmic calendar). |
| **Kaliyuga** | 9 | 🟡 | Medium — the current Yuga; sub-node of yuga-system. |
| **Haab** (Mayan) | 6 | 🟡 | Medium — sub-system of Mayan composite. |
| **Intercalation** (general concept) | 4 | 🟢 | Low — concept-level. |
| **Tzolkin** (Mayan) | 3 | 🟢 | Low — sub-system. |
| **Long Count** (Mayan) | 3 | 🟢 | Low — sub-system. |
| **Bahá'í badíʿ** (alt spellings) | 2 | 🟢 | Low. |
| **Julian calendar** | 2 | 🟢 | Low — surprising; the Caesar reform is widely cited. |
| **Metonic cycle** | 1 | 🟢 | Low — central to luni-solar reconciliation. |
| **Gregorian calendar** | 1 | 🟢 | Low — surprising. |
| **Hijri** | 0 | ⚪ | Proactive — Islamic lunar; cited as "Islamic calendar" probably. |
| **Vikram Samvat** | 0 | ⚪ | Proactive. |
| **Saka era** | 0 | ⚪ | Proactive. |
| **Jalali** (Iranian) | 0 | ⚪ | Proactive. |
| **Sexagenary cycle** (Chinese) | 0 | ⚪ | Proactive. |

**Top 5 picks for first `26_calendars/` batch (mostly proactive):**
1. `mayan-calendrical-system-composite` (consolidates Tzolkin + Haab + Long Count + Calendar Round — 12 mentions combined)
2. `vedic-yuga-system` (25 — anchors cosmic-time motifs)
3. `hebrew-calendar` (proactive — surprising absence)
4. `islamic-hijri-calendar` (proactive — surprising absence)
5. `gregorian-calendar` + `julian-calendar` (proactive — civil + historical reform context)

---

## §10. `23_material_culture/` — relic / ritual-object candidates

**Verdict:** **validated.** Specific relics are frequently mentioned but never have dedicated nodes.

| Relic / object | Files | Signal | Recommended action |
|---|---:|:---:|---|
| **Ark of the Covenant** | 33 | 🟠 | High — `ark-of-the-covenant-relic` (the claimed object) distinct from `ark-of-the-covenant-symbol` (already a symbol node likely). |
| **Holy Grail** | 22 | 🟠 | High — `holy-grail-relic-and-legend` (the claimed-object aspect). |
| **Menorah** | 16 | 🟡 | Medium — `menorah-second-temple-relic` (the Second Temple object). |
| **Tabot** | 14 | 🟡 | Medium — `tabot-relic-class` (the class of Ethiopian Tewahedo objects). |
| **Black Stone** (of Mecca) | 7 | 🟡 | Medium — `black-stone-mecca`. |
| **True Cross** | 6 | 🟡 | Medium — `true-cross-relic`. |
| **Dome of the Rock** (overlaps §4) | 6 | (in §4) | Cross-list. |
| **Urim and Thummim** | 4 | 🟢 | Low — `urim-and-thummim-relic` (priestly divinatory artifact; could also link to `25_divination/`). |
| **Spear of Longinus / Holy Lance / Spear of Destiny** | 3 | 🟢 | Low-but-iconic — `holy-lance-relic`. |
| **Buddha relics / Tooth relic** | 1 | 🟢 | Low — surprising; revisit (Sri Lankan Kandy tooth relic etc.) |
| **Shroud of Turin** | 0 | ⚪ | Proactive — among the most-famous Christian relics. |
| **Stone of Scone** | 0 | ⚪ | Proactive. |
| **Veronica's Veil** | 0 | ⚪ | Proactive. |
| **Shroud of Oviedo** | 0 | ⚪ | Proactive. |

**Top 5 picks for first `23_material_culture/` batch:**
1. `ark-of-the-covenant-relic` (33; cross-link to symbol)
2. `holy-grail-relic-and-legend` (22)
3. `menorah-second-temple-relic` (16)
4. `tabot-relic-class` (14; anchors Ethiopian wedge)
5. `black-stone-mecca` + `true-cross-relic` (13 combined; cross-tradition relic anchors)

---

## §11. Summary — top picks across all 10 lenses for the *very first* investigation wave

If a single investigation agent wanted to land 10 stub nodes (one per lens) that immediately validate the lens and resolve the most dangling cross-references, this is the pick:

| Lens | First node | Demand signal |
|---|---|---:|
| `08_places/` | `alexandria` | 252 |
| `18_languages/` | `latin-classical` (or split set) | 429 |
| `19_astronomy/` | `ptolemy-astronomer` | 45 |
| `20_sacred_architecture/` | `pyramid-of-khufu` | 162 (form-level) |
| `21_theology/` | `apophatic-theology` | 109 |
| `22_practices/` | `japa-mantra-recitation` | 106 |
| `23_material_culture/` | `ark-of-the-covenant-relic` | 33 |
| `24_pharmacology/` | `mercury-alchemical` | 87 |
| `25_divination/` | `ifa-odu-divination` | 182 |
| `26_calendars/` | `vedic-yuga-system` | 25 |

**Combined first-wave coverage:** ~1430 file mentions that currently dangle. After this 10-node batch lands, the most-pointed-to cross-references in the vault will resolve.

---

## §12. What this validates

- **All 10 new lenses are demand-driven, not speculative.** Every lens has at least one entity with significant existing file mentions and no current node home.
- **`24_pharmacology/`, `25_divination/`, `22_practices/`, `18_languages/`, `08_places/`, `20_sacred_architecture/`, `21_theology/`** are *overwhelmingly* validated.
- **`19_astronomy/`, `26_calendars/`, `23_material_culture/`** are validated but with smaller initial batches — the demand is real but the existing vault has less raw content on these (yet). Proactive additions will fill out fast.

## §13. What this audit does NOT do

- Does not promote existing nodes from old lenses into new lenses. The 2026-05-18 ontology lock rule stands: existing nodes stay where they are; new nodes go in new lens; cross-link instead of move.
- Does not coin slugs definitively — provisional slug suggestions only. Final slug choice happens when the investigation agent creates the node, per the slug-discipline rules in `ONTOLOGY.md` §7.
- Does not exhaustively enumerate every candidate — only top items per lens. The investigation agent who picks up a lens should grep further within their scope.
- Does not assess source-integrity tier for each candidate — that's done during node creation per the absorb-and-dissect SOP in `PROTOCOL.md`.

## §14. Investigation agent guidance

When you pick a lens-batch from this audit:

1. **Read the lens's README** in the folder (e.g. `24_pharmacology/README.md`) — has the YAML skeleton + slug convention + boundary notes.
2. **Read this audit's section for that lens** to see the priority list + signal levels.
3. **Claim a row in `ACTIVE-CONTENT.md`** with scope (which lens + which top-N nodes).
4. **Verify each candidate doesn't already exist** under a different slug — `grep -rln "^id: \"<candidate-slug>\"" .`.
5. **Stub-sweep at the end** — every `[[wikilink]]` you add must point to a real node, per the WIRING LAW.
6. **Cross-link aggressively** to existing nodes — that's where the demand signal comes from.

**Build-script reminder:** new-folder nodes won't appear in the graph until the deferred Lane B batch updates `build_data.py`'s `NODE_TYPE_MAP`. Disk content is fine to stage; graph integration follows.

— end audit, 2026-05-18 late evening.
