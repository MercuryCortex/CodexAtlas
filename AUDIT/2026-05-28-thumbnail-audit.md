# Thumbnail Audit — 2026-05-28 (Lane D)

**Filed:** 2026-05-28
**Owner:** `agent-thumbnail-auditor-2026-05-28`
**Mode:** READ-ONLY. This report does NOT modify vault data.
**Source:** `data.js` (window.VAULT_DATA, generated 2026-05-28T05:03:11.694825Z)
**Plan:** `AUDIT/2026-05-28-content-big-push-plan.md` (Lane D)

---

## Summary stats

- **Total nodes in vault:** 4558
- **Nodes with `thumbnail` field:** 3140
- **Flagged as obviously-wrong:** 511 (16.3%)

### Flagged by category

| category | count | meaning |
| --- | ---: | --- |
| `extract-mismatch` | 511 | Wikipedia summary + thumb_title share no significant word with node title — likely wrong page (medium confidence; some false positives from translit / alias mismatches) |
| `tech-mismatch` | 1 | URL/thumb_page contains modern-tech keywords (AMD, CPU, iPhone, etc.) on non-tech nodes — high confidence wrong |

## Pattern table — keyword hits

URL or `thumb_title` keyword → number of flagged nodes
(only includes hits from tech/brand/sports/politics keyword lists — placeholder + extract-mismatch are not in this table).

| keyword | hits |
| --- | ---: |
| `apu` | 1 |

## Top 30 worst cases (high-confidence wrong-image)

Sorted by priority: tech-mismatch > brand > politics > sports > placeholder > extract-mismatch.
Each entry shows the node, the current thumbnail, the Wikipedia page it came from, and a suggested action.

### 1. `phase-1-036-amduat` — Amduat (What Is in the Underworld)

- **type:** `document`
- **family:** Egyptian
- **tradition:** Egyptian New Kingdom funerary literature
- **flagged:** `extract-mismatch`, `tech-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/en/0/02/AMD_A-series_logo.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/AMD_APU
- **thumb_title:** `AMD APU`
- **thumb_extract (first 200ch):** _AMD Accelerated Processing Unit (APU), formerly known as Fusion, is a series of 64-bit microprocessors from Advanced Micro Devices (AMD), combining a general-purpose AMD64 central processing unit (CPU_
- **evidence:** URL/page contains tech keyword 'apu' -> AMD APU; thumb_title='AMD APU' and extract share no significant word with node title 'Amduat (What Is in the Underworld)'
- **suggested action:** **null-out** then re-fetch via Wikipedia search of `Amduat (What Is in the Underworld)` (build_data.py / fetch_thumbnails.py)

### 2. `abathur` — Abathur

- **type:** `deity`
- **family:** Mandaean
- **tradition:** Mandaean
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/MS_DC_8_-_Abatur.jpg/330px-MS_DC_8_-_Abatur.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Abatur
- **thumb_title:** `Abatur`
- **thumb_extract (first 200ch):** _Abatur is an uthra and the second of three subservient emanations created by the Mandaean God Hayyi Rabbi in the Mandaean religion. His name translates as the "father of the Uthras", the Mandaean name_
- **evidence:** thumb_title='Abatur' and extract share no significant word with node title 'Abathur'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 3. `abya-meqabyan` — Abya (Meqabyan I)

- **type:** `person`
- **family:** Christian
- **tradition:** [[tradition-ethiopian-orthodox-tewahedo]] (canonical scripture only here)
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Hasmonean_dynasty_family_tree.svg/330px-Hasmonean_dynasty_family_tree.svg.png
- **thumb_page:** https://en.wikipedia.org/wiki/Maccabees
- **thumb_title:** `Maccabees`
- **thumb_extract (first 200ch):** _The Maccabees, also spelled Machabees, were a group of Jewish rebel warriors who re-took control of Judea, which at the time was occupied by the Seleucid Empire. Its leaders, the Hasmoneans, founded t_
- **evidence:** thumb_title='Maccabees' and extract share no significant word with node title 'Abya (Meqabyan I)'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 4. `adam-kadmon` — Adam Kadmon

- **type:** `theme`
- **family:** Other
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Portae_Lucis_1516.jpg/330px-Portae_Lucis_1516.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
- **thumb_page:** https://en.wikipedia.org/wiki/Kabbalah
- **thumb_title:** `Kabbalah`
- **thumb_extract (first 200ch):** _Kabbalah or Qabalah is an esoteric method, discipline, and school of thought in Jewish mysticism. It forms the foundation of mystical religious interpretations within Judaism. A traditional Kabbalist _
- **evidence:** thumb_title='Kabbalah' and extract share no significant word with node title 'Adam Kadmon'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 5. `aegishjalmr` — Ægishjálmr

- **type:** `symbol`
- **family:** Norse
- **tradition:** Norse
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Aegishjalmr.svg/330px-Aegishjalmr.svg.png
- **thumb_page:** https://en.wikipedia.org/wiki/%C3%86gishj%C3%A1lmur_(occult_symbol)
- **thumb_title:** `Ægishjálmur (occult symbol)`
- **thumb_extract (first 200ch):** _Ægishjálmur in Icelandic, or Helm of Awe in English, is a name given to a number of occult symbols, mainly from Iceland, so called galdrastafir. The name is a borrowing from Norse mythology, where it _
- **evidence:** thumb_title='Ægishjálmur (occult symbol)' and extract share no significant word with node title 'Ægishjálmr'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 6. `aeon-as-emanation` — Aeon as Emanation

- **type:** `theme`
- **family:** Other
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Plotinos.jpg/330px-Plotinos.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
- **thumb_page:** https://en.wikipedia.org/wiki/Plotinus
- **thumb_title:** `Plotinus`
- **thumb_extract (first 200ch):** _Plotinus was a Hellenistic Greek philosopher, born and raised in Roman Egypt. Plotinus is regarded by modern scholarship as the founder of Neoplatonism._
- **evidence:** thumb_title='Plotinus' and extract share no significant word with node title 'Aeon as Emanation'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 7. `aganju` — Aganju

- **type:** `deity`
- **family:** African
- **tradition:** Yoruba religion (Nigeria / Diaspora)
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Obatala_Temple_Ile_Ife.jpg/330px-Obatala_Temple_Ile_Ife.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Yoruba_religion
- **thumb_title:** `Yoruba religion`
- **thumb_extract (first 200ch):** _The Yorùbá religion, West African Orisa, or Isese, comprises the traditional religious and spiritual concepts and practice of the Yoruba people. Its homeland is in what is commonly known as Yorubaland_
- **evidence:** thumb_title='Yoruba religion' and extract share no significant word with node title 'Aganju'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 8. `ah-puch` — Ah Puch

- **type:** `deity`
- **family:** Mesoamerican
- **tradition:** Maya paganism (Popol Vuh; Dresden Codex; Diego de Landa's Relación de las cosas de Yucatán)
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/0/04/Maize_God_and_Itzamn%C3%A1.JPG
- **thumb_page:** https://en.wikipedia.org/wiki/Cizin
- **thumb_title:** `Cizin`
- **thumb_extract (first 200ch):** _Cizin is a Maya god of death and earthquakes. He is the most important Maya death god in the Maya culture. Scholars call him God A._
- **evidence:** thumb_title='Cizin' and extract share no significant word with node title 'Ah Puch'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 9. `al-ghazali` — Al-Ghazali

- **type:** `person`
- **family:** Islamic
- **tradition:** Sunni Islam — Shāfiʿī jurisprudence / Ash'arite theology / Sufism
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Double-leaf_frontispiece_from_%22The_Epistles_of_the_Brethren_of_Purity%22_%28cropped%29.jpg/330px-Double-leaf_frontispiece_from_%22The_Epistles_of_the_Brethren_of_Purity%22_%28cropped%29.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Islamic_philosophy
- **thumb_title:** `Islamic philosophy`
- **thumb_extract (first 200ch):** _Islamic philosophy is philosophy that emerges from the Islamic tradition. Two terms traditionally used in the Islamic world are sometimes translated as philosophy—falsafa, which refers to philosophy a_
- **evidence:** thumb_title='Islamic philosophy' and extract share no significant word with node title 'Al-Ghazali'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 10. `al-haqq` — Al-Haqq (The Real)

- **type:** `deity`
- **family:** Islamic
- **tradition:** Sufi Islam — Akbarī school
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Istanbul%2C_Hagia_Sophia%2C_Allah.jpg/330px-Istanbul%2C_Hagia_Sophia%2C_Allah.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Names_of_God_in_Islam
- **thumb_title:** `Names of God in Islam`
- **thumb_extract (first 200ch):** _
Names of God in Islam are names that each contain attributes of God in Islam, which are implied by the respective names. Some names are known from either the Quran or the hadith, while others can be _
- **evidence:** thumb_title='Names of God in Islam' and extract share no significant word with node title 'Al-Haqq (The Real)'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 11. `allegorical-exegesis` — Allegorical Exegesis

- **type:** `theme`
- **family:** Other
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Pearl_Poet.jpg/330px-Pearl_Poet.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Allegory
- **thumb_title:** `Allegory`
- **thumb_extract (first 200ch):** _As a literary device or artistic form, an allegory is a narrative or visual representation in which a character, place, or event can be interpreted to represent a meaning with moral or political signi_
- **evidence:** thumb_title='Allegory' and extract share no significant word with node title 'Allegorical Exegesis'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 12. `amaunet` — Amaunet

- **type:** `deity`
- **family:** Egyptian
- **tradition:** Egyptian (Hermopolitan theology — the Ogdoad)
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Amunet.svg/330px-Amunet.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
- **thumb_page:** https://en.wikipedia.org/wiki/Amunet
- **thumb_title:** `Amunet`
- **thumb_extract (first 200ch):** _Amunet or Imnt is a primordial goddess in ancient Egyptian religion. Thebes was the center of her worship through the last dynasty, the Ptolemaic Kingdom, in 30 BCE. She is attested in the earliest kn_
- **evidence:** thumb_title='Amunet' and extract share no significant word with node title 'Amaunet'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 13. `ammonius-saccas` — Ammonius Saccas

- **type:** `person`
- **family:** Neoplatonist
- **tradition:** Neoplatonic / Alexandrian synthesis
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Plotin.jpg/330px-Plotin.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
- **thumb_page:** https://en.wikipedia.org/wiki/Neoplatonism
- **thumb_title:** `Neoplatonism`
- **thumb_extract (first 200ch):** _Neoplatonism is a version of Platonic philosophy that emerged in the 3rd century AD against the background of Hellenistic philosophy and religion. The term does not encapsulate a set of distinct ideas_
- **evidence:** thumb_title='Neoplatonism' and extract share no significant word with node title 'Ammonius Saccas'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 14. `analogia-entis` — Analogia entis (analogy of being)

- **type:** `theme`
- **family:** Other
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/St-thomas-aquinasFXD.jpg/330px-St-thomas-aquinasFXD.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
- **thumb_page:** https://en.wikipedia.org/wiki/Thomas_Aquinas
- **thumb_title:** `Thomas Aquinas`
- **thumb_extract (first 200ch):** _Thomas Aquinas was an Italian Dominican friar and priest, theologian, and philosopher. He is considered one of the most influential thinkers in the history of Catholic theology and Western philosophy._
- **evidence:** thumb_title='Thomas Aquinas' and extract share no significant word with node title 'Analogia entis (analogy of being)'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 15. `anatman-no-self` — Anātman (No-Self)

- **type:** `theme`
- **family:** Other
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Kamakura_Budda_Daibutsu_front_1885.jpg/330px-Kamakura_Budda_Daibutsu_front_1885.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Buddhism
- **thumb_title:** `Buddhism`
- **thumb_extract (first 200ch):** _Buddhism, also known as Buddhadharma and Dharmavinaya, is an Indian religion and philosophy based on teachings attributed to the Buddha, a śramaṇa and religious teacher who lived in the 6th or 5th cen_
- **evidence:** thumb_title='Buddhism' and extract share no significant word with node title 'Anātman (No-Self)'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 16. `anekantavada` — Anekāntavāda (Non-Absolutism of Viewpoints)

- **type:** `theme`
- **family:** Other
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Shatrunjay_Adinath_Rishabhdev_Bhagwan.jpg/330px-Shatrunjay_Adinath_Rishabhdev_Bhagwan.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Rishabhanatha
- **thumb_title:** `Rishabhanatha`
- **thumb_extract (first 200ch):** _Rishabhanatha, also Rishabhadeva, Rishabha or Ikshvaku, is the first tirthankara of Jainism. He was the first of twenty-four teachers in the present half-cycle of time in Jain cosmology and called a "_
- **evidence:** thumb_title='Rishabhanatha' and extract share no significant word with node title 'Anekāntavāda (Non-Absolutism of Viewpoints)'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 17. `anshar-kishar` — Anshar and Kishar

- **type:** `deity`
- **family:** Mesopotamian
- **tradition:** Mesopotamian (Sumerian / Akkadian / Babylonian)
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Chaos_Monster_and_Sun_God.png/330px-Chaos_Monster_and_Sun_God.png
- **thumb_page:** https://en.wikipedia.org/wiki/Babylonian_religion
- **thumb_title:** `Babylonian religion`
- **thumb_extract (first 200ch):** _Babylonian religion is the religious practice of Babylonia. Babylonia's mythology was largely influenced by its Sumerian counterparts and was written on clay tablets inscribed with the cuneiform scrip_
- **evidence:** thumb_title='Babylonian religion' and extract share no significant word with node title 'Anshar and Kishar'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 18. `anthropos-myth` — Anthropos Myth

- **type:** `theme`
- **family:** Other
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/WLA_vanda_Vishnu_as_the_Cosmic_Man.jpg/330px-WLA_vanda_Vishnu_as_the_Cosmic_Man.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Macranthropy
- **thumb_title:** `Macranthropy`
- **thumb_extract (first 200ch):** _Macranthropy is an allegorical concept where the universe is portrayed as a giant human body, with various cosmic elements represented as body parts. This concept has historical roots in several ancie_
- **evidence:** thumb_title='Macranthropy' and extract share no significant word with node title 'Anthropos Myth'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 19. `anticosmic` — Anticosmic

- **type:** `theme`
- **family:** Other
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Dualism.svg/330px-Dualism.svg.png
- **thumb_page:** https://en.wikipedia.org/wiki/Dualism
- **thumb_title:** `Dualism`
- **thumb_extract (first 200ch):** _Dualism is a family of views that propose a fundamental division into two separate principles or kinds. It typically emphasizes a sharp distinction between independent or antagonistic sides, but in a _
- **evidence:** thumb_title='Dualism' and extract share no significant word with node title 'Anticosmic'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 20. `apatheia-and-virtue` — Apatheia and Virtue

- **type:** `theme`
- **family:** Other
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Paolo_Monti_-_Servizio_fotografico_%28Napoli%2C_1969%29_-_BEIC_6353768.jpg/330px-Paolo_Monti_-_Servizio_fotografico_%28Napoli%2C_1969%29_-_BEIC_6353768.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Stoicism
- **thumb_title:** `Stoicism`
- **thumb_extract (first 200ch):** _Stoicism is a philosophical movement and practical guide to living, emphasizing daily self-discipline and moral improvement, which originated in the Hellenistic period of ancient Greece and proliferat_
- **evidence:** thumb_title='Stoicism' and extract share no significant word with node title 'Apatheia and Virtue'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 21. `apokatastasis` — Apokatastasis (universal restoration)

- **type:** `theme`
- **family:** Other
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Origen.jpg/330px-Origen.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Origen
- **thumb_title:** `Origen`
- **thumb_extract (first 200ch):** _Origen of Alexandria, also known as Origen Adamantius, was an early Christian scholar, ascetic, and theologian who was born and spent the first half of his career in Alexandria. He was a prolific writ_
- **evidence:** thumb_title='Origen' and extract share no significant word with node title 'Apokatastasis (universal restoration)'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 22. `apollinaris-of-laodicea` — Apollinaris of Laodicea

- **type:** `person`
- **family:** Christian
- **tradition:** Patristic Christian (anti-Arian, condemned for Christology)
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/CouncilOfConstantinople381BnFMSGr510.jpg/330px-CouncilOfConstantinople381BnFMSGr510.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
- **thumb_page:** https://en.wikipedia.org/wiki/First_Council_of_Constantinople
- **thumb_title:** `First Council of Constantinople`
- **thumb_extract (first 200ch):** _The First Council of Constantinople was a council of Christian bishops convened in Constantinople in AD 381 by the Roman Emperor Theodosius I. This second ecumenical council, an effort to attain conse_
- **evidence:** thumb_title='First Council of Constantinople' and extract share no significant word with node title 'Apollinaris of Laodicea'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 23. `apologetic-historiography` — Apologetic Historiography

- **type:** `theme`
- **family:** Other
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Rembrandt_Harmensz._van_Rijn_063.jpg/330px-Rembrandt_Harmensz._van_Rijn_063.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Jewish_history
- **thumb_title:** `Jewish history`
- **thumb_extract (first 200ch):** _Jews originated from the Israelites and Hebrews of historical Israel and Judah, two related kingdoms that emerged in the Levant during the Iron Age. The earliest mention of Israelites is inscribed on _
- **evidence:** thumb_title='Jewish history' and extract share no significant word with node title 'Apologetic Historiography'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 24. `april-deconick` — April D. DeConick

- **type:** `person`
- **family:** Gnostic
- **tradition:** Comparative religion (academic) / Gnostic studies / Coptic Christianity
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Codex_Tchacos_p33.jpg/330px-Codex_Tchacos_p33.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Gospel_of_Judas
- **thumb_title:** `Gospel of Judas`
- **thumb_extract (first 200ch):** _
The Gospel of Judas is a Gnostic religious text that consists of conversations between Jesus and his disciples, especially Judas Iscariot. The only copy of it known to exist is a Coptic language text_
- **evidence:** thumb_title='Gospel of Judas' and extract share no significant word with node title 'April D. DeConick'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 25. `armaros` — Armaros

- **type:** `deity`
- **family:** Israelite
- **tradition:** Second-Temple Jewish apocalyptic (Enochic) / canonical in [[tradition-ethiopian-orthodox-tewahedo]]
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/BL_Or_485_f._102r.png/330px-BL_Or_485_f._102r.png
- **thumb_page:** https://en.wikipedia.org/wiki/Book_of_Enoch
- **thumb_title:** `Book of Enoch`
- **thumb_extract (first 200ch):** _The Book of Enoch is an ancient Jewish apocalyptic religious text, ascribed by tradition to the patriarch Enoch who was the father of Methuselah and the great-grandfather of Noah. The Book of Enoch co_
- **evidence:** thumb_title='Book of Enoch' and extract share no significant word with node title 'Armaros'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 26. `asbeel` — Asbeel

- **type:** `deity`
- **family:** Israelite
- **tradition:** Second-Temple Jewish apocalyptic (Enochic) / canonical in [[tradition-ethiopian-orthodox-tewahedo]]
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/BL_Or_485_f._102r.png/330px-BL_Or_485_f._102r.png
- **thumb_page:** https://en.wikipedia.org/wiki/Book_of_Enoch
- **thumb_title:** `Book of Enoch`
- **thumb_extract (first 200ch):** _The Book of Enoch is an ancient Jewish apocalyptic religious text, ascribed by tradition to the patriarch Enoch who was the father of Methuselah and the great-grandfather of Noah. The Book of Enoch co_
- **evidence:** thumb_title='Book of Enoch' and extract share no significant word with node title 'Asbeel'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 27. `astar-aksumite` — Astar (Aksumite)

- **type:** `deity`
- **family:** African
- **tradition:** South Arabian Sabaean / pre-Christian Aksumite religion
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/KingEndybisEthiopia227-235CE.jpg/330px-KingEndybisEthiopia227-235CE.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Kingdom_of_Aksum
- **thumb_title:** `Kingdom of Aksum`
- **thumb_extract (first 200ch):** _The Kingdom of Aksum, or the Aksumite Empire, was a kingdom in North East Africa and South Arabia from classical antiquity to the Middle Ages, based in what is now Eritrea and Northern Ethiopia, and s_
- **evidence:** thumb_title='Kingdom of Aksum' and extract share no significant word with node title 'Astar (Aksumite)'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 28. `ataecina` — Ataecina (Adaegina)

- **type:** `deity`
- **family:** Celtic
- **tradition:** Lusitanian Religion (pre-Roman Iberian) — Baetica and western Lusitania
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Ataecina._M%C3%A1rmol_del_artista_Pedro_Roque_DSC_0572r1.jpg/330px-Ataecina._M%C3%A1rmol_del_artista_Pedro_Roque_DSC_0572r1.jpg
- **thumb_page:** https://en.wikipedia.org/wiki/Ataegina
- **thumb_title:** `Ataegina`
- **thumb_extract (first 200ch):** _Ataegina was a goddess worshipped by the ancient Iberians, Lusitanians, and Celtiberians of the Iberian Peninsula. She is believed by some to have been a goddess of the underworld or the night, or of _
- **evidence:** thumb_title='Ataegina' and extract share no significant word with node title 'Ataecina (Adaegina)'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 29. `atonement-reinterpreted` — Atonement Reinterpreted (Gnostic & alternative)

- **type:** `theme`
- **family:** Other
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Jesus_Saves_Neon_Cross_Sign_Church_2011_Shankbone.jpg/330px-Jesus_Saves_Neon_Cross_Sign_Church_2011_Shankbone.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
- **thumb_page:** https://en.wikipedia.org/wiki/Salvation_in_Christianity
- **thumb_title:** `Salvation in Christianity`
- **thumb_extract (first 200ch):** _In Christianity, salvation refers to a state that a human being can attain, through the grace of God, by accepting Jesus Christ, in the form of the commitment to His teachings in the Gospels, the beli_
- **evidence:** thumb_title='Salvation in Christianity' and extract share no significant word with node title 'Atonement Reinterpreted (Gnostic & alternative)'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

### 30. `atrahasis-flood-hero` — Atrahasis (the flood-hero)

- **type:** `person`
- **family:** Mesopotamian
- **tradition:** Akkadian / Mesopotamian
- **flagged:** `extract-mismatch`
- **current thumbnail:** https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Chaos_Monster_and_Sun_God.png/330px-Chaos_Monster_and_Sun_God.png
- **thumb_page:** https://en.wikipedia.org/wiki/Atra-Hasis
- **thumb_title:** `Atra-Hasis`
- **thumb_extract (first 200ch):** _Atra-Hasis is an 18th-century BC Akkadian epic, recorded in various versions on clay tablets and named for one of its protagonists, the priest Atra-Hasis. The narrative has its origins in Sumerian his_
- **evidence:** thumb_title='Atra-Hasis' and extract share no significant word with node title 'Atrahasis (the flood-hero)'
- **suggested action:** manual review — likely wrong page; if title has an obvious Wikipedia disambiguation, re-fetch; otherwise null-out

## Full flagged list (machine-readable)

TSV — one row per flagged node. Pipe-delimited columns: `id | type | categories | title | thumb_title | thumbnail`

```
id | type | categories | title | thumb_title | thumbnail
phase-1-036-amduat | document | extract-mismatch,tech-mismatch | Amduat (What Is in the Underworld) | AMD APU | https://upload.wikimedia.org/wikipedia/en/0/02/AMD_A-series_logo.jpg
abathur | deity | extract-mismatch | Abathur | Abatur | https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/MS_DC_8_-_Abatur.jpg/330px-MS_DC_8_-_Abatur.jpg
abya-meqabyan | person | extract-mismatch | Abya (Meqabyan I) | Maccabees | https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Hasmonean_dynasty_family_tree.svg/330px-Hasmonean_dynasty_family_tree.svg.png
adam-kadmon | theme | extract-mismatch | Adam Kadmon | Kabbalah | https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Portae_Lucis_1516.jpg/330px-Portae_Lucis_1516.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
aegishjalmr | symbol | extract-mismatch | Ægishjálmr | Ægishjálmur (occult symbol) | https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Aegishjalmr.svg/330px-Aegishjalmr.svg.png
aeon-as-emanation | theme | extract-mismatch | Aeon as Emanation | Plotinus | https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Plotinos.jpg/330px-Plotinos.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
aganju | deity | extract-mismatch | Aganju | Yoruba religion | https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Obatala_Temple_Ile_Ife.jpg/330px-Obatala_Temple_Ile_Ife.jpg
ah-puch | deity | extract-mismatch | Ah Puch | Cizin | https://upload.wikimedia.org/wikipedia/commons/0/04/Maize_God_and_Itzamn%C3%A1.JPG
al-ghazali | person | extract-mismatch | Al-Ghazali | Islamic philosophy | https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Double-leaf_frontispiece_from_%22The_Epistles_of_the_Brethren_of_Purity%22_%28cropped%29.jpg/330px-Double-leaf_frontispiece_from_%22The_Epistles_of_the_Brethren_of_Purity%22_%28cropped%29.jpg
al-haqq | deity | extract-mismatch | Al-Haqq (The Real) | Names of God in Islam | https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Istanbul%2C_Hagia_Sophia%2C_Allah.jpg/330px-Istanbul%2C_Hagia_Sophia%2C_Allah.jpg
allegorical-exegesis | theme | extract-mismatch | Allegorical Exegesis | Allegory | https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Pearl_Poet.jpg/330px-Pearl_Poet.jpg
amaunet | deity | extract-mismatch | Amaunet | Amunet | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Amunet.svg/330px-Amunet.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
ammonius-saccas | person | extract-mismatch | Ammonius Saccas | Neoplatonism | https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Plotin.jpg/330px-Plotin.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
analogia-entis | theme | extract-mismatch | Analogia entis (analogy of being) | Thomas Aquinas | https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/St-thomas-aquinasFXD.jpg/330px-St-thomas-aquinasFXD.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
anatman-no-self | theme | extract-mismatch | Anātman (No-Self) | Buddhism | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Kamakura_Budda_Daibutsu_front_1885.jpg/330px-Kamakura_Budda_Daibutsu_front_1885.jpg
anekantavada | theme | extract-mismatch | Anekāntavāda (Non-Absolutism of Viewpoints) | Rishabhanatha | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Shatrunjay_Adinath_Rishabhdev_Bhagwan.jpg/330px-Shatrunjay_Adinath_Rishabhdev_Bhagwan.jpg
anshar-kishar | deity | extract-mismatch | Anshar and Kishar | Babylonian religion | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Chaos_Monster_and_Sun_God.png/330px-Chaos_Monster_and_Sun_God.png
anthropos-myth | theme | extract-mismatch | Anthropos Myth | Macranthropy | https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/WLA_vanda_Vishnu_as_the_Cosmic_Man.jpg/330px-WLA_vanda_Vishnu_as_the_Cosmic_Man.jpg
anticosmic | theme | extract-mismatch | Anticosmic | Dualism | https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Dualism.svg/330px-Dualism.svg.png
apatheia-and-virtue | theme | extract-mismatch | Apatheia and Virtue | Stoicism | https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Paolo_Monti_-_Servizio_fotografico_%28Napoli%2C_1969%29_-_BEIC_6353768.jpg/330px-Paolo_Monti_-_Servizio_fotografico_%28Napoli%2C_1969%29_-_BEIC_6353768.jpg
apokatastasis | theme | extract-mismatch | Apokatastasis (universal restoration) | Origen | https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Origen.jpg/330px-Origen.jpg
apollinaris-of-laodicea | person | extract-mismatch | Apollinaris of Laodicea | First Council of Constantinople | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/CouncilOfConstantinople381BnFMSGr510.jpg/330px-CouncilOfConstantinople381BnFMSGr510.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
apologetic-historiography | theme | extract-mismatch | Apologetic Historiography | Jewish history | https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Rembrandt_Harmensz._van_Rijn_063.jpg/330px-Rembrandt_Harmensz._van_Rijn_063.jpg
april-deconick | person | extract-mismatch | April D. DeConick | Gospel of Judas | https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Codex_Tchacos_p33.jpg/330px-Codex_Tchacos_p33.jpg
armaros | deity | extract-mismatch | Armaros | Book of Enoch | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/BL_Or_485_f._102r.png/330px-BL_Or_485_f._102r.png
asbeel | deity | extract-mismatch | Asbeel | Book of Enoch | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/BL_Or_485_f._102r.png/330px-BL_Or_485_f._102r.png
astar-aksumite | deity | extract-mismatch | Astar (Aksumite) | Kingdom of Aksum | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/KingEndybisEthiopia227-235CE.jpg/330px-KingEndybisEthiopia227-235CE.jpg
ataecina | deity | extract-mismatch | Ataecina (Adaegina) | Ataegina | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Ataecina._M%C3%A1rmol_del_artista_Pedro_Roque_DSC_0572r1.jpg/330px-Ataecina._M%C3%A1rmol_del_artista_Pedro_Roque_DSC_0572r1.jpg
atonement-reinterpreted | theme | extract-mismatch | Atonement Reinterpreted (Gnostic & alternative) | Salvation in Christianity | https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Jesus_Saves_Neon_Cross_Sign_Church_2011_Shankbone.jpg/330px-Jesus_Saves_Neon_Cross_Sign_Church_2011_Shankbone.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
atrahasis-flood-hero | person | extract-mismatch | Atrahasis (the flood-hero) | Atra-Hasis | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Chaos_Monster_and_Sun_God.png/330px-Chaos_Monster_and_Sun_God.png
aum-om | symbol | extract-mismatch | Aum / Om (ॐ) | Om | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Om_symbol.svg/330px-Om_symbol.svg.png
bandua | deity | extract-mismatch | Bandua (Bandua Veigebreaego / Bandua Roudeaeco) | Votive offering | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Altoetting-1-WJP.jpg/330px-Altoetting-1-WJP.jpg
baraqel | deity | extract-mismatch | Baraqel | Watcher (angel) | https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Angel_on_the_spire_of_St_Michael%27s_church%2C_Clifton_Hampden_-_geograph.org.uk_-_1573635.jpg/330px-Angel_on_the_spire_of_St_Michael%27s_church%2C_Clifton_Hampden_-_geograph.org.uk_-_1573635.jpg
bardaisan-of-edessa | person | extract-mismatch | Bardaisan of Edessa | Syriac Christianity | https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Jerusalem_Holy-Sepulchre_Jesus-Detail-01.png/330px-Jerusalem_Holy-Sepulchre_Jesus-Detail-01.png
basavanna | person | extract-mismatch | Basavanna | Basava | https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Basava_Gaint_Statue_108_feet%2C_Basava_Kalyana.JPG/330px-Basava_Gaint_Statue_108_feet%2C_Basava_Kalyana.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
basilides | person | extract-mismatch | Basilides | Alexandria | https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/San_Stefano_Grand_Plaza.JPG/330px-San_Stefano_Grand_Plaza.JPG
beauseant | symbol | extract-mismatch | Beauseant (Templar War Banner) | Baucent | https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Baucent.svg/330px-Baucent.svg.png
beher | deity | extract-mismatch | Beher (Aksumite) | Kingdom of Aksum | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/KingEndybisEthiopia227-235CE.jpg/330px-KingEndybisEthiopia227-235CE.jpg
belet-seri-akkadian | deity | extract-mismatch | Belet-Seri | Ereshkigal | https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Relieve_Reina_de_la_Noche_%28ca._1800_a.C%29.jpg/330px-Relieve_Reina_de_la_Noche_%28ca._1800_a.C%29.jpg
bergelmir | deity | extract-mismatch | Bergelmir | Norse mythology | https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Tj%C3%A4ngvide.jpg/330px-Tj%C3%A4ngvide.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
bharatamuni | person | extract-mismatch | Bharatamuni | Natya Shastra | https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Shiva_as_the_Lord_of_Dance_LACMA_edit.jpg/330px-Shiva_as_the_Lord_of_Dance_LACMA_edit.jpg
bindu | symbol | extract-mismatch | Bindu | Sri Yantra | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/A_Yantra_with_Tamil_Om_symbol_in_center%2C_at_a_Mariamman_Temple.jpg/330px-A_Yantra_with_Tamil_Om_symbol_in_center%2C_at_a_Mariamman_Temple.jpg
bogomil-priest | person | extract-mismatch | Bogomil (the priest) | Preslav Literary School | https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Preslav_fortress_7.jpg/330px-Preslav_fortress_7.jpg
bondye-vodou | deity | extract-mismatch | Bondye | Haitian Vodou | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/VoodooValris.jpg/330px-VoodooValris.jpg
brian-copenhaver | person | extract-mismatch | Brian P. Copenhaver | Renaissance philosophy | https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Da_Vinci_Vitruve_Luc_Viatour.jpg/330px-Da_Vinci_Vitruve_Luc_Viatour.jpg
bridal-mysticism | theme | extract-mismatch | Bridal mysticism | Bernard of Clairvaux | https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/San_Bernardo%2C_de_Juan_Correa_de_Vivar_%28Museo_del_Prado%29.jpg/330px-San_Bernardo%2C_de_Juan_Correa_de_Vivar_%28Museo_del_Prado%29.jpg
carpocrates | person | extract-mismatch | Carpocrates | Irenaeus | https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Saint_irenee_saint_irenee.jpg/330px-Saint_irenee_saint_irenee.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
catequil | deity | extract-mismatch | Catequil | Inca mythology | https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Machu_Picchu_Panorama_2025_%28cropped%29.jpg/330px-Machu_Picchu_Panorama_2025_%28cropped%29.jpg
centeotl | deity | extract-mismatch | Centeotl | Centeōtl | https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Cinteotl_2.jpg/330px-Cinteotl_2.jpg
cerdo | person | extract-mismatch | Cerdo | Marcionism | https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/M.Sander_-_Marcion_%C3%B5petamas.jpg/330px-M.Sander_-_Marcion_%C3%B5petamas.jpg
cerinthus | person | extract-mismatch | Cerinthus | Ephesus | https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Ephesus_Celsus_Library_Fa%C3%A7ade.jpg/330px-Ephesus_Celsus_Library_Fa%C3%A7ade.jpg
changing-woman | deity | extract-mismatch | Changing Woman | Navajo Nation | https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Official_design_of_the_Navajo_Nation_flag_as_it_was_adopted_on_May_21%2C_1968.svg/330px-Official_design_of_the_Navajo_Nation_flag_as_it_was_adopted_on_May_21%2C_1968.svg.png
charles-hapgood | person | extract-mismatch | Charles Hutchins Hapgood | Piri Reis map | https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Piri_reis_world_map_01.jpg/330px-Piri_reis_world_map_01.jpg
chicomecoatl | deity | extract-mismatch | Chicomecoatl | Chicomecōātl | https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Chicomecoatl_1.jpg/330px-Chicomecoatl_1.jpg
choe-je-u | person | extract-mismatch | Choe Je-u (최제우) | Ch'oe Cheu | https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Choe_Je-u.jpg/330px-Choe_Je-u.jpg
collective-effervescence | theme | extract-mismatch | Collective Effervescence | Émile Durkheim | https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/%C3%89mile_Durkheim.jpg/330px-%C3%89mile_Durkheim.jpg
commentary-as-genre | theme | extract-mismatch | Commentary as Genre | Exegesis | https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Open_bible_isaiah.jpg/330px-Open_bible_isaiah.jpg
coniraya | deity | extract-mismatch | Coniraya | Inca mythology | https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Machu_Picchu_Panorama_2025_%28cropped%29.jpg/330px-Machu_Picchu_Panorama_2025_%28cropped%29.jpg
coniunctio | theme | extract-mismatch | Coniunctio (Alchemical / Psychological Union) | Unity of opposites | https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Seesaw_with_mean.svg/330px-Seesaw_with_mean.svg.png
cosmic-body-cosmogony | theme | extract-mismatch | Cosmic Body Cosmogony | Ymir | https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Audhumla_by_Abildgaard.jpg/330px-Audhumla_by_Abildgaard.jpg
cosmic-serpent | symbol | extract-mismatch | Cosmic Serpent | Ouroboros | https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Serpiente_alquimica.jpg/330px-Serpiente_alquimica.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
cosmopolitanism | theme | extract-mismatch | Cosmopolitanism (Hellenistic) | Stoicism | https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Paolo_Monti_-_Servizio_fotografico_%28Napoli%2C_1969%29_-_BEIC_6353768.jpg/330px-Paolo_Monti_-_Servizio_fotografico_%28Napoli%2C_1969%29_-_BEIC_6353768.jpg
cow-sacred | symbol | extract-mismatch | Sacred Cow | Cattle in religion and mythology | https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Cow_and_its_calf.jpg/330px-Cow_and_its_calf.jpg
coyolxauhqui | deity | extract-mismatch | Coyolxauhqui | Coyolxāuhqui | https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Mexico-3980_-_Coyolxauhqui_Stone_%282508259597%29.jpg/330px-Mexico-3980_-_Coyolxauhqui_Stone_%282508259597%29.jpg
creation-by-word | theme | extract-mismatch | Creation by word / speech | Let there be light | https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Francisco_de_Holanda%2C_The_First_day_of_Creation.jpg/330px-Francisco_de_Holanda%2C_The_First_day_of_Creation.jpg
critias-younger | person | extract-mismatch | Critias (the speaker in Plato's Timaeus and Critias) | Plato | https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Plato_Silanion_Musei_Capitolini_MC1377.png/330px-Plato_Silanion_Musei_Capitolini_MC1377.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
critique-of-idolatry | theme | extract-mismatch | Critique of Idolatry | Iconoclasm | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Triumph_orthodoxy.jpg/330px-Triumph_orthodoxy.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
dagda | deity | extract-mismatch | The Dagda | Cernunnos | https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Gundestrupkedlen-_00054_%28cropped%29.jpg/330px-Gundestrupkedlen-_00054_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
daramulan | deity | extract-mismatch | Daramulan | Daramulum | https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Engraving_of_Daramulum.svg/330px-Engraving_of_Daramulum.svg.png
david-brakke | person | extract-mismatch | David Brakke | Athanasius of Alexandria | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Hosios_Loukas_Crypt_%28south_east_groin-vault%29_-_Athanasios.jpg/330px-Hosios_Loukas_Crypt_%28south_east_groin-vault%29_-_Athanasios.jpg
deganawidah-peacemaker | person | extract-mismatch | Deganawidah (the Peacemaker) | Haudenosaunee | https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Flag_of_the_Iroquois_Confederacy.svg/330px-Flag_of_the_Iroquois_Confederacy.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
dievas-baltic | deity | extract-mismatch | Dievas | Dievturība | https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Krustu-krusts.svg/330px-Krustu-krusts.svg.png
dioscorus-of-alexandria | person | extract-mismatch | Dioscorus I of Alexandria | Council of Chalcedon | https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Fourth_ecumenical_council_of_chalcedon_-_1876.jpg/330px-Fourth_ecumenical_council_of_chalcedon_-_1876.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
discipleship-failure | theme | extract-mismatch | Discipleship Failure (Markan) | Gospel of Mark | https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Mark_16_first_lines%2C_Codex_Sinaiticus.png/330px-Mark_16_first_lines%2C_Codex_Sinaiticus.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
divinatory-calendar | theme | extract-mismatch | Divinatory Calendar | Divination | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Rhumsiki_crab_sorceror.jpg/330px-Rhumsiki_crab_sorceror.jpg
divine-feminine | theme | extract-mismatch | Divine feminine | Goddess | https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Queen_Nefertari_being_led_by_Isis_MET_DP167142.jpg/330px-Queen_Nefertari_being_led_by_Isis_MET_DP167142.jpg
divine-immanence | theme | extract-mismatch | Divine Immanence | Baruch Spinoza | https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Spinoza.jpg/330px-Spinoza.jpg
divyavadana | document | extract-mismatch | Divyāvadāna | Diyawadana Nilame | https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Flag_of_Buddhism.svg/330px-Flag_of_Buddhism.svg.png
dogen | person | extract-mismatch | Dogen | Dōgen | https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Soto-Zen-Master-Dogen-Zenji-Portrait.png/330px-Soto-Zen-Master-Dogen-Zenji-Portrait.png
dragon-western | symbol | extract-mismatch | Western Dragon (Draco / Leviathan / The Beast) | Leviathan | https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Destruction_of_Leviathan.png/330px-Destruction_of_Leviathan.png
druj | deity | extract-mismatch | Druj | Asha | https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Faravahar.svg/330px-Faravahar.svg.png
dualism-cosmic | theme | extract-mismatch | Cosmic dualism | Zoroastrianism | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Faravahar_on_Fire_Temple%2C_Yazd.jpg/330px-Faravahar_on_Fire_Temple%2C_Yazd.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
dutty-boukman | person | extract-mismatch | Dutty Boukman | Haitian Revolution | https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Incendie_de_la_Plaine_du_Cap._Massacre_des_Blancs_par_les_esclaves_noirs_r%C3%A9volt%C3%A9s._France_militaire._Martinet_et_Masson.jpg/330px-Incendie_de_la_Plaine_du_Cap._Massacre_des_Blancs_par_les_esclaves_noirs_r%C3%A9volt%C3%A9s._France_militaire._Martinet_et_Masson.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
dyaus-pita | deity | extract-mismatch | Dyaus Pita | Proto-Indo-European mythology | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Trundholm_sun_chariot_animation.gif/330px-Trundholm_sun_chariot_animation.gif?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
ecclesial-authority | theme | extract-mismatch | Ecclesial Authority | Catholic Church | https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Saint_Peter%27s_Basilica_facade%2C_Rome%2C_Italy.jpg/330px-Saint_Peter%27s_Basilica_facade%2C_Rome%2C_Italy.jpg
ecclesiology | theme | extract-mismatch | Ecclesiology | Church (building) | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Basilica_cattedrale_di_San_Giusto_Martire_%28IV%29_%2839452708702%29.jpg/330px-Basilica_cattedrale_di_San_Giusto_Martire_%28IV%29_%2839452708702%29.jpg
ein-sof | deity | extract-mismatch | Ein Sof (The Infinite) | Kabbalah | https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Portae_Lucis_1516.jpg/330px-Portae_Lucis_1516.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
el-shaddai | deity | extract-mismatch | El Shaddai | Names of God in Judaism | https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Tetragrammaton_Sefardi.jpg/330px-Tetragrammaton_Sefardi.jpg
eliezer-ben-hyrcanus | person | extract-mismatch | Eliezer ben Hyrcanus | Talmud | https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Talmud-Druck_von_Daniel_Bomberg_und_Ambrosius_Froben.jpg/330px-Talmud-Druck_von_Daniel_Bomberg_und_Ambrosius_Froben.jpg
endovelicus | deity | extract-mismatch | Endovélico | Lusitania | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Roman_Empire_-_Lusitania_%28125_AD%29.svg/330px-Roman_Empire_-_Lusitania_%28125_AD%29.svg.png
engishiki | document | extract-mismatch | Engishiki | English Wikipedia | https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Wikipedia-logo-v2-en-25-alt.svg/330px-Wikipedia-logo-v2-en-25-alt.svg.png
eschatological-imminence | theme | extract-mismatch | Eschatological Imminence | Eschatology | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/The_Four_Horsemen_%28CBL_WEp_0021%29.jpg/330px-The_Four_Horsemen_%28CBL_WEp_0021%29.jpg
eternal-return | theme | extract-mismatch | Eternal Return | Friedrich Nietzsche | https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Nietzsche187a.jpg/330px-Nietzsche187a.jpg
ethical-dualism | theme | extract-mismatch | Ethical dualism | Zoroastrianism | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Faravahar_on_Fire_Temple%2C_Yazd.jpg/330px-Faravahar_on_Fire_Temple%2C_Yazd.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
ethical-monotheism | theme | extract-mismatch | Ethical Monotheism | Amos (prophet) | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Amos-prophet.jpg/330px-Amos-prophet.jpg
event-aksumite-christianization-c330 | event | extract-mismatch | Aksumite Christianization (~330 CE) | Ezana of Axum | https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/AXUM._Ezanas._Circa_330-360.jpg/330px-AXUM._Ezanas._Circa_330-360.jpg
event-amarna-period-1353-1336 | event | extract-mismatch | Amarna Period / Atenist Revolution | Akhenaten | https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/GD-EG-Caire-Mus%C3%A9e061.JPG/330px-GD-EG-Caire-Mus%C3%A9e061.JPG
event-arabic-harranian-hermetica-c800-1000 | event | extract-mismatch | Sabian-Harranian transmission of the Hermetica into Arabic (c. 800–1000 CE) | Harran | https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Harran_2015.jpg/330px-Harran_2015.jpg
event-asokan-dhamma-missions-c-250-bce | event | extract-mismatch | Aśokan dhamma-missions to the Hellenistic kingdoms (~-256 BCE) | Ashoka | https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Ashoka%27s_visit_to_the_Ramagrama_stupa_Sanchi_Stupa_1_Southern_gateway.jpg/330px-Ashoka%27s_visit_to_the_Ramagrama_stupa_Sanchi_Stupa_1_Southern_gateway.jpg
event-azusa-street-revival-1906 | event | extract-mismatch | Azusa Street Revival (1906–1909) | Charles Fox Parham | https://upload.wikimedia.org/wikipedia/commons/c/cf/Charlesparham.png
event-chaco-abandonment-c-1150-1300-ce | event | extract-mismatch | Event Chaco Abandonment C 1150 1300 Ce | Ancestral Puebloans | https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Cliff_Palace%2C_Mesa_Verde_Park%2C_Colorado%2C_US_%2836%29.jpg/330px-Cliff_Palace%2C_Mesa_Verde_Park%2C_Colorado%2C_US_%2836%29.jpg
event-closure-of-pagan-mysteries-392-393 | event | extract-mismatch | Closure of the Pagan Mysteries (Theodosian Edicts 391–393) | Theodosius I | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Bust_of_Theodosius_I.jpg/330px-Bust_of_Theodosius_I.jpg
event-construction-of-st-peters-1506-1626 | event | extract-mismatch | Event Construction Of St Peters 1506 1626 | St. Peter's Basilica | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg/330px-Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg
event-council-of-troyes-1129 | event | extract-mismatch | Council of Troyes | Knights Templar | https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Bandeira_Templ%C3%A1ria.svg/330px-Bandeira_Templ%C3%A1ria.svg.png
event-death-of-hypatia-415 | event | extract-mismatch | Death of Hypatia | Alexandria | https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/San_Stefano_Grand_Plaza.JPG/330px-San_Stefano_Grand_Plaza.JPG
event-discovery-of-pakals-tomb-1952 | event | extract-mismatch | Event Discovery Of Pakals Tomb 1952 | Kʼinich Janaabʼ Pakal | https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/PacalII.svg/330px-PacalII.svg.png
event-edict-of-thessalonica-380 | event | extract-mismatch | Edict of Thessalonica | Theodosius I | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Bust_of_Theodosius_I.jpg/330px-Bust_of_Theodosius_I.jpg
event-george-smith-flood-tablet-1872 | event | extract-mismatch | George Smith Reads the Babylonian Flood Tablet | Epic of Gilgamesh | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/British_Museum_Flood_Tablet.jpg/330px-British_Museum_Flood_Tablet.jpg
event-horyuji-fire-and-rebuild-670-711 | event | extract-mismatch | Event Horyuji Fire And Rebuild 670 711 | Hōryū-ji | https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Horyu-ji11s3200.jpg/330px-Horyu-ji11s3200.jpg
event-horyuji-founding-c-607 | event | extract-mismatch | Event Horyuji Founding C 607 | Hōryū-ji | https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Horyu-ji11s3200.jpg/330px-Horyu-ji11s3200.jpg
event-jamnia-yavneh-90 | event | extract-mismatch | Yavneh / Jamnia Rabbinic Consolidation (c. 70-100 CE) | Yavne | https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Yavne_panoramic_view2.JPG/330px-Yavne_panoramic_view2.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
event-nine-saints-mission-c480 | event | extract-mismatch | Mission of the Nine Saints to Aksum (~480–540 CE) | Ethiopian Orthodox Tewahedo Church | https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg/330px-Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg
event-phoenician-gades-foundation-1100bce | event | extract-mismatch | Phoenician Foundation of Gades (Cádiz) — c. 1100 BCE | Cádiz | https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Cadiz_aerea.jpg/330px-Cadiz_aerea.jpg
event-pittsburgh-platform-1885 | event | extract-mismatch | Pittsburgh Platform (American Reform Judaism) | Reform Judaism | https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Congregation_Emanu-El_of_the_City_New_York.jpg/330px-Congregation_Emanu-El_of_the_City_New_York.jpg
event-ras-shamra-excavation-1928 | event | extract-mismatch | Ras Shamra (Ugarit) Excavation | Cuneiform | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Xerxes_Cuneiform_Van.JPG/330px-Xerxes_Cuneiform_Van.JPG
event-rise-of-political-islamism-1928-present | event | extract-mismatch | Rise of Political Islamism (1928–present) | Muslim Brotherhood | https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Muslim_Brotherhood_Emblem.svg/330px-Muslim_Brotherhood_Emblem.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
event-sabbatean-apostasy-1666 | event | extract-mismatch | Sabbatean Apostasy (Shabbatai Tzvi's conversion to Islam) | Sabbatai Zevi | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/%C5%A0abb%C9%99%E1%B9%AFay_%E1%B9%A2%C9%99%E1%B8%87%C4%AB_1669_V01-1.1_cropped.jpg/330px-%C5%A0abb%C9%99%E1%B9%AFay_%E1%B9%A2%C9%99%E1%B8%87%C4%AB_1669_V01-1.1_cropped.jpg
event-todaiji-daibutsu-casting-745-752 | event | extract-mismatch | Event Todaiji Daibutsu Casting 745 752 | Tōdai-ji | https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/T%C5%8Ddai-ji_Kon-d%C5%8D.jpg/330px-T%C5%8Ddai-ji_Kon-d%C5%8D.jpg
event-todaiji-reconstruction-1190 | event | extract-mismatch | Event Todaiji Reconstruction 1190 | Tōdai-ji | https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/T%C5%8Ddai-ji_Kon-d%C5%8D.jpg/330px-T%C5%8Ddai-ji_Kon-d%C5%8D.jpg
event-wilhelmsbad-convent-1782 | event | extract-mismatch | Convent of Wilhelmsbad (1782) | Freemasonry | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Square_and_Compasses_no_G.svg/330px-Square_and_Compasses_no_G.svg.png
executed-divine-claimant | theme | extract-mismatch | The Executed Divine Claimant — Mystic Martyrdom Pattern | Crucifixion of Jesus | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Cristo_crucificado.jpg/330px-Cristo_crucificado.jpg
fanaa-annihilation | theme | extract-mismatch | Fanāʾ — Mystical Annihilation | Sufi whirling | https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Whirlingdervishes.JPG/330px-Whirlingdervishes.JPG
fazlur-rahman | person | extract-mismatch | Fazlur Rahman Malik | Islamic philosophy | https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Double-leaf_frontispiece_from_%22The_Epistles_of_the_Brethren_of_Purity%22_%28cropped%29.jpg/330px-Double-leaf_frontispiece_from_%22The_Epistles_of_the_Brethren_of_Purity%22_%28cropped%29.jpg
feather-of-maat | symbol | extract-mismatch | Feather of Ma'at (Weighing of the Heart) | Maat | https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Maat.svg/330px-Maat.svg.png
fentos-meqabyan | person | extract-mismatch | Fentos (Meqabyan III) | Maccabees | https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Hasmonean_dynasty_family_tree.svg/330px-Hasmonean_dynasty_family_tree.svg.png
firmicus-maternus | person | extract-mismatch | Firmicus Maternus | Religion in ancient Rome | https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Roma%2C_Museo_Ara_Pacis_-_Calco_di_Roma_con_Vittoria_-_Foto_Giovanni_Dall%27Orto%2C_30-Mar-2008.jpg/330px-Roma%2C_Museo_Ara_Pacis_-_Calco_di_Roma_con_Vittoria_-_Foto_Giovanni_Dall%27Orto%2C_30-Mar-2008.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
fulcanelli | person | extract-mismatch | Fulcanelli (pseudonymous) | Notre-Dame de Paris | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Notre-Dame_de_Paris%2C_4_October_2017.jpg/330px-Notre-Dame_de_Paris%2C_4_October_2017.jpg
fulfillment-of-prophecy | theme | extract-mismatch | Fulfillment of Prophecy | Isaiah 53 | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Great_Isaiah_Scroll_Ch53.jpg/330px-Great_Isaiah_Scroll_Ch53.jpg
gadreel | deity | extract-mismatch | Gadreel | Book of Enoch | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/BL_Or_485_f._102r.png/330px-BL_Or_485_f._102r.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
garth-fowden | person | extract-mismatch | Garth Fowden | Byzantine Empire | https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Eastern_Roman_Empire_565_CE.svg/330px-Eastern_Roman_Empire_565_CE.svg.png
genealogical-cosmogony | theme | extract-mismatch | Genealogical Cosmogony | Theogony | https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Hesiod%2C_Theogony%2C_Venice%2C_Gr._464.jpg/330px-Hesiod%2C_Theogony%2C_Venice%2C_Gr._464.jpg
gentile-inclusion | theme | extract-mismatch | Gentile Inclusion | Council of Jerusalem | https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Norwich_Cathedral%2C_Stained_glass_window_%2848389419571%29.jpg/330px-Norwich_Cathedral%2C_Stained_glass_window_%2848389419571%29.jpg
george-smith-cuneiformist | person | extract-mismatch | George Smith (Babylonian cuneiformist) | Epic of Gilgamesh | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/British_Museum_Flood_Tablet.jpg/330px-British_Museum_Flood_Tablet.jpg
george-starkey | person | extract-mismatch | George Starkey | Alchemy | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/E-codices_zbz-Ms-Rh-0172_044_max_copy.jpg/330px-E-codices_zbz-Ms-Rh-0172_044_max_copy.jpg
giyorgis-of-sagla | person | extract-mismatch | Giyorgis of Sagla (Abba Giyorgis II) | Ethiopian Orthodox Tewahedo Church | https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg/330px-Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg
gnosis-as-salvation | theme | extract-mismatch | Gnosis as salvation | Nag Hammadi library | https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png/330px-El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png
gorgoneion | symbol | extract-mismatch | Gorgoneion | Medusa | https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Gorgona_pushkin.jpg/330px-Gorgona_pushkin.jpg
green-lion | symbol | extract-mismatch | Green Lion (Viridis Leo) | Alchemy | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/E-codices_zbz-Ms-Rh-0172_044_max_copy.jpg/330px-E-codices_zbz-Ms-Rh-0172_044_max_copy.jpg
ground-of-being | theme | extract-mismatch | Ground of Being (Tillich) | Paul Tillich | https://upload.wikimedia.org/wikipedia/en/3/38/Paul_Tillich.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled
gyoki | theme | extract-mismatch | Gyoki | Gyōki | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Gyoki01.JPG/330px-Gyoki01.JPG
hahyah-nephilim | deity | extract-mismatch | Hahyah (Nephilim, son of Shemihazah) | The Book of Giants | https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Paradise_Lost_1.jpg/330px-Paradise_Lost_1.jpg
hamza-ibn-ali | person | extract-mismatch | Hamza ibn ʿAlī | Druze | https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/PikiWiki_Israel_45144_Nabi_Shuayb.JPG/330px-PikiWiki_Israel_45144_Nabi_Shuayb.JPG
hanif-monotheism | theme | extract-mismatch | Ḥanīf monotheism | Pre-Islamic Arabia | https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/NabateensRoutes.png/330px-NabateensRoutes.png
hanullim | deity | extract-mismatch | Hanullim — Lord of Heaven | Haneunim | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Korea-Samseonggung_11-07406.JPG/330px-Korea-Samseonggung_11-07406.JPG
hayyi-rabbi | deity | extract-mismatch | Hayyi Rabbi | Mandaeism | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/%D9%83%D9%86%D8%B2%D8%A7_%D8%B1%D8%A8%D8%A7_.jpg/330px-%D9%83%D9%86%D8%B2%D8%A7_%D8%B1%D8%A8%D8%A7_.jpg
heavenly-tablets | theme | extract-mismatch | Heavenly Tablets | Book of Jubilees | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Bernhard_Beer_Das_Buch_der_Jubil%C3%A4en_und_sein_Verh%C3%A4ltniss_zu_den_Midraschim_1856.jpg/330px-Bernhard_Beer_Das_Buch_der_Jubil%C3%A4en_und_sein_Verh%C3%A4ltniss_zu_den_Midraschim_1856.jpg
hebat | deity | extract-mismatch | Hebat | Ḫepat | https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Chamber_A%2C_Yazilikaya_06.jpg/330px-Chamber_A%2C_Yazilikaya_06.jpg
hekate | deity | extract-mismatch | Hekate | Hecate | https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Relief_triplicate_Hekate_marble%2C_Hadrian_clasicism%2C_Prague_Kinsky%2C_NM-H10_4742%2C_140995.jpg/330px-Relief_triplicate_Hekate_marble%2C_Hadrian_clasicism%2C_Prague_Kinsky%2C_NM-H10_4742%2C_140995.jpg
heliopolis-ennead | theme | extract-mismatch | Heliopolitan Ennead | Heliopolis (ancient Egypt) | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/CairoObeliskSesostris1.jpg/330px-CairoObeliskSesostris1.jpg
henotheism-monolatry | theme | extract-mismatch | Henotheism / monolatry / monotheism transitions | Atenism | https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/La_salle_dAkhenaton_%281356-1340_av_J.C.%29_%28Mus%C3%A9e_du_Caire%29_%282076972086%29.jpg/330px-La_salle_dAkhenaton_%281356-1340_av_J.C.%29_%28Mus%C3%A9e_du_Caire%29_%282076972086%29.jpg
hermogenes-the-painter | person | extract-mismatch | Hermogenes the Painter | Tertullian | https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Tertullian2.png/330px-Tertullian2.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
hermoni | deity | extract-mismatch | Hermoni | Book of Enoch | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/BL_Or_485_f._102r.png/330px-BL_Or_485_f._102r.png
hernan-cortes | person | extract-mismatch | Hernan Cortes | Hernán Cortés | https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Retrato_de_Hern%C3%A1n_Cort%C3%A9s.jpg/330px-Retrato_de_Hern%C3%A1n_Cort%C3%A9s.jpg
hierophany | theme | extract-mismatch | Hierophany | Mircea Eliade | https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Mircea_Eliade_young.jpg/330px-Mircea_Eliade_young.jpg
howard-vyse | person | extract-mismatch | Colonel Richard William Howard Vyse | Great Pyramid of Giza | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Great_Pyramid_of_Giza_-_Pyramid_of_Khufu.jpg/330px-Great_Pyramid_of_Giza_-_Pyramid_of_Khufu.jpg
hwanin | deity | extract-mismatch | Hwanin | Haneunim | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Korea-Samseonggung_11-07406.JPG/330px-Korea-Samseonggung_11-07406.JPG
hwanung | deity | extract-mismatch | Hwanung | Tan'gun | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Portrait_of_Dangun.jpg/330px-Portrait_of_Dangun.jpg
i-am-sayings | theme | extract-mismatch | I-Am Sayings (egō eimi) | I am (biblical term) | https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Saint-Pie_X_%28Vernier%29-18b.jpg/330px-Saint-Pie_X_%28Vernier%29-18b.jpg
ibn-ishaq | person | extract-mismatch | Ibn Isḥāq (Muḥammad ibn Isḥāq ibn Yasār) | Sīrah | https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/PERF_No._665.jpg/330px-PERF_No._665.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
ideal-state-myth | theme | extract-mismatch | Ideal-state myth (Plato's political device) | Atlantis | https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Atlantis_Kircher_Mundus_subterraneus_1678.jpg/330px-Atlantis_Kircher_Mundus_subterraneus_1678.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
idealism-metaphysical | theme | extract-mismatch | Metaphysical Idealism | Plato | https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Plato_Silanion_Musei_Capitolini_MC1377.png/330px-Plato_Silanion_Musei_Capitolini_MC1377.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
illapa | deity | extract-mismatch | Illapa | Inca mythology | https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Machu_Picchu_Panorama_2025_%28cropped%29.jpg/330px-Machu_Picchu_Panorama_2025_%28cropped%29.jpg
individuation | theme | extract-mismatch | Individuation (Jungian) | Carl Jung | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/ETH-BIB-Jung%2C_Carl_Gustav_%281875-1961%29-Portrait-Portr_14163_%28cropped%29.tif/lossy-page1-330px-ETH-BIB-Jung%2C_Carl_Gustav_%281875-1961%29-Portrait-Portr_14163_%28cropped%29.tif.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
io-matua-kore | deity | extract-mismatch | Io-matua-kore | Māori mythology | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Maorigodsymbols.jpg/330px-Maorigodsymbols.jpg
ishara | deity | extract-mismatch | Ishara | Hurrian religion | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hurrian_incense_container.JPG/330px-Hurrian_incense_container.JPG
itinerant-discipleship | theme | extract-mismatch | Itinerant Discipleship | Apostle | https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Mosaic_with_six_of_Jesus%27_apostles_in_Christianity.jpg/330px-Mosaic_with_six_of_Jesus%27_apostles_in_Christianity.jpg
ixbalanque | deity | extract-mismatch | Ixbalanque | Maya Hero Twins | https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Altar_5_from_La_Venta%2C_left_side_%28Ruben_Charles%29.jpg/330px-Altar_5_from_La_Venta%2C_left_side_%28Ruben_Charles%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
jacob-baradaeus | person | extract-mismatch | Jacob Baradaeus | Syriac Christianity | https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Jerusalem_Holy-Sepulchre_Jesus-Detail-01.png/330px-Jerusalem_Holy-Sepulchre_Jesus-Detail-01.png
james-hollis | person | extract-mismatch | James Hollis | Carl Jung | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/ETH-BIB-Jung%2C_Carl_Gustav_%281875-1961%29-Portrait-Portr_14163_%28cropped%29.tif/lossy-page1-330px-ETH-BIB-Jung%2C_Carl_Gustav_%281875-1961%29-Portrait-Portr_14163_%28cropped%29.tif.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
jarilo | deity | extract-mismatch | Jarilo | Yarilo | https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Donetsk_step_04_kudlaenko.jpg/330px-Donetsk_step_04_kudlaenko.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
jeong-do-jeon | person | extract-mismatch | Jeong Do Jeon | Chŏng Tojŏn | https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Korea-Danyang-Dodamsambong_Sam_Bong_statue_3076-07.JPG/330px-Korea-Danyang-Dodamsambong_Sam_Bong_statue_3076-07.JPG
jesus-the-splendor | deity | extract-mismatch | Jesus the Splendor | Manichaeism | https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Seal_of_Mani_%28cleaned_up%29._Seal_with_figure_of_Mani%2C_possibly_3rd_century_CE%2C_possibly_Irak._Cabinet_des_M%C3%A9dailles%2C_Paris.jpg/330px-Seal_of_Mani_%28cleaned_up%29._Seal_with_figure_of_Mani%2C_possibly_3rd_century_CE%2C_possibly_Irak._Cabinet_des_M%C3%A9dailles%2C_Paris.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
john-d-turner | person | extract-mismatch | John D. Turner | Nag Hammadi library | https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png/330px-El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png
joshua-ben-hananiah | person | extract-mismatch | Joshua ben Hananiah | Mishnah | https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Adolf_Behrman_-_Talmudysci.jpg/330px-Adolf_Behrman_-_Talmudysci.jpg
karen-king | person | extract-mismatch | Karen L. King | Gospel of Thomas | https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png/330px-El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png
kasdeja | deity | extract-mismatch | Kasdeja | Azazel | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Detail_of_East_Window%2C_Lincoln_Cathedral_%2814224253959%29.jpg/330px-Detail_of_East_Window%2C_Lincoln_Cathedral_%2814224253959%29.jpg
kevin-van-bladel | person | extract-mismatch | Kevin van Bladel | Harran | https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Harran_2015.jpg/330px-Harran_2015.jpg
kings-chamber-great-pyramid | event | extract-mismatch | King's Chamber (Great Pyramid of Khufu) | Great Pyramid of Giza | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Great_Pyramid_of_Giza_-_Pyramid_of_Khufu.jpg/330px-Great_Pyramid_of_Giza_-_Pyramid_of_Khufu.jpg
kingu | deity | extract-mismatch | Kingu | Enūma Eliš | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Chaos_Monster_and_Sun_God.png/330px-Chaos_Monster_and_Sun_God.png
kokabiel | deity | extract-mismatch | Kokabiel | Fallen angel | https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/El_%C3%81ngel_Ca%C3%ADdo_%28Ricardo_Bellver%29_03.jpg/330px-El_%C3%81ngel_Ca%C3%ADdo_%28Ricardo_Bellver%29_03.jpg
kukulkan | deity | extract-mismatch | Kukulkán | Kukulkan | https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Kukulkan_%28reconstructed%29.jpg/330px-Kukulkan_%28reconstructed%29.jpg
kumarbi | deity | extract-mismatch | Kumarbi | Hittite mythology and religion | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/HittiteSeatedDeityAnatolia13thCenturyBCE.jpg/330px-HittiteSeatedDeityAnatolia13thCenturyBCE.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
laima | deity | extract-mismatch | Laima | Dievturība | https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Krustu-krusts.svg/330px-Krustu-krusts.svg.png
lal-ded | person | extract-mismatch | Lalleshwari | Kashmir Shaivism | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Trident_Yantra_of_Parama_Siva.svg/330px-Trident_Yantra_of_Parama_Siva.svg.png
lanzon-monolith | person | extract-mismatch | Lanzon Monolith | Lanzón | https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Chavin_lanzon_stela2_cyark.jpg/330px-Chavin_lanzon_stela2_cyark.jpg
leigong | deity | extract-mismatch | Léi Gōng (雷公) | Leigong | https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Master_Thunder_%28Lei_Gong%29%2C_dated_1542.jpg/330px-Master_Thunder_%28Lei_Gong%29%2C_dated_1542.jpg
liberation-theology | theme | extract-mismatch | Liberation Theology — religious doctrine as mandate for social emancipation | Óscar Romero | https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Monse%C3%B1or_Romero_%28colour%29.jpg/330px-Monse%C3%B1or_Romero_%28colour%29.jpg
light-and-darkness-dualism | theme | extract-mismatch | Light-and-Darkness Dualism | Yin and yang | https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Yin_and_Yang_symbol.svg/330px-Yin_and_Yang_symbol.svg.png
liturgical-calendar | theme | extract-mismatch | Liturgical Calendar — Sacred Time | Holy Week | https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Folio_173v_-_The_Entry_into_Jerusalem.jpg/330px-Folio_173v_-_The_Entry_into_Jerusalem.jpg
logos-philonic | theme | extract-mismatch | Philonic Logos | Philo | https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/PhiloThevet.jpg/330px-PhiloThevet.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
los | deity | extract-mismatch | Los | William Blake | https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/William_Blake_by_Thomas_Phillips.jpg/330px-William_Blake_by_Thomas_Phillips.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
lost-continent | theme | extract-mismatch | Lost Continent | Atlantis | https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Atlantis_Kircher_Mundus_subterraneus_1678.jpg/330px-Atlantis_Kircher_Mundus_subterraneus_1678.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
louis-komjathy | person | extract-mismatch | Louis Komjathy | Taoism | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/%E6%AD%A6%E5%BD%93%E5%B1%B1%E7%B4%AB%E9%9C%84%E5%AE%AB_%2814739990839%29.jpg/330px-%E6%AD%A6%E5%BD%93%E5%B1%B1%E7%B4%AB%E9%9C%84%E5%AE%AB_%2814739990839%29.jpg
madala-panji | document | extract-mismatch | Madala Panji | Manalapan High School | https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Manalapan_High_School%2C_NJ_%281%29.jpg/330px-Manalapan_High_School%2C_NJ_%281%29.jpg
mahakashyapa | person | extract-mismatch | Mahakashyapa | Mahākāśyapa | https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/China%2C_Hebei_province%2C_Southern_Xiangtangshan_caves%2C_Northern_Qi_dynasty_-_Standing_Disciple_Mahakasyapa_Holding_a_Cylindrical_Reliquary_-_1972.166_-_Cleveland_Museum_of_Art.tif/lossy-page1-330px-thumbnail.tif.jpg
mahamoggallana | person | extract-mismatch | Mahamoggallana | Maudgalyayana | https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/%E7%9B%AE%E9%80%A3%E3%83%90%E3%82%B9%E3%83%88%E3%82%A2%E3%83%83%E3%83%97.jpg/330px-%E7%9B%AE%E9%80%A3%E3%83%90%E3%82%B9%E3%83%88%E3%82%A2%E3%83%83%E3%83%97.jpg
mahavamsa | document | extract-mismatch | Mahavamsa | Mahāvaṃsa | https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/1686_Mallet_Map_of_Ceylon_or_Sri_Lanka_%28Taprobane%29_-_Geographicus_-_Taprobane-mallet-1686.jpg/330px-1686_Mallet_Map_of_Ceylon_or_Sri_Lanka_%28Taprobane%29_-_Geographicus_-_Taprobane-mallet-1686.jpg
mahaway-nephilim | deity | extract-mismatch | Mahaway (Nephilim, the giant-emissary to Enoch) | The Book of Giants | https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Paradise_Lost_1.jpg/330px-Paradise_Lost_1.jpg
mahrem | deity | extract-mismatch | Mahrem (Aksumite war-god) | Kingdom of Aksum | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/KingEndybisEthiopia227-235CE.jpg/330px-KingEndybisEthiopia227-235CE.jpg
mama-sara | deity | extract-mismatch | Mama Sara | Inca mythology | https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Machu_Picchu_Panorama_2025_%28cropped%29.jpg/330px-Machu_Picchu_Panorama_2025_%28cropped%29.jpg
manabozho | deity | extract-mismatch | Manabozho (Nanabozho) | Nanabozho | https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Nanabozho_pictograph%2C_Mazinaw_Rock.jpg/330px-Nanabozho_pictograph%2C_Mazinaw_Rock.jpg
manuel-j-gandra | person | extract-mismatch | Manuel J. Gandra (Manuel José Gandra) | Hermeticism | https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/HermesTrismegistusCaucHighRes.jpg/330px-HermesTrismegistusCaucHighRes.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
marcionite-canon | theme | extract-mismatch | Marcionite canon (first New-Testament-style canon) | Marcion of Sinope | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Apostle_John_and_Marcion_of_Sinope%2C_from_JPM_LIbrary_MS_748%2C_11th_c.jpg/330px-Apostle_John_and_Marcion_of_Sinope%2C_from_JPM_LIbrary_MS_748%2C_11th_c.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
marcus-the-magician | person | extract-mismatch | Marcus the Magician | Irenaeus | https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Saint_irenee_saint_irenee.jpg/330px-Saint_irenee_saint_irenee.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
mark-singleton | person | extract-mismatch | Mark Singleton | Yoga | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Shiva_Bangalore.jpg/330px-Shiva_Bangalore.jpg
marshall-vian-summers | person | extract-mismatch | Marshall Vian Summers | New religious movement | https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Icon-religion.svg/330px-Icon-religion.svg.png
martyrdom-theology | theme | extract-mismatch | Martyrdom Theology | Martyr | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/20%2C000_martyrs_of_Nicomedia_%28Menologion_of_Basil_II%29.jpg/330px-20%2C000_martyrs_of_Nicomedia_%28Menologion_of_Basil_II%29.jpg
mastema | deity | extract-mismatch | Mastema (Prince of Evil Spirits) | Book of Jubilees | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Bernhard_Beer_Das_Buch_der_Jubil%C3%A4en_und_sein_Verh%C3%A4ltniss_zu_den_Midraschim_1856.jpg/330px-Bernhard_Beer_Das_Buch_der_Jubil%C3%A4en_und_sein_Verh%C3%A4ltniss_zu_den_Midraschim_1856.jpg
matsyendranath | person | extract-mismatch | Matsyendranath | Matsyendranatha | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Bunga_dyah_statue.jpg/330px-Bunga_dyah_statue.jpg
meder | deity | extract-mismatch | Meder (Aksumite earth-god) | Kingdom of Aksum | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/KingEndybisEthiopia227-235CE.jpg/330px-KingEndybisEthiopia227-235CE.jpg
menander-of-samaria | person | extract-mismatch | Menander of Samaria | Simon Magus | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Basilica_Saint-Sernin_-_Simon_Magus_%28cropped%29.jpg/330px-Basilica_Saint-Sernin_-_Simon_Magus_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
meness | deity | extract-mismatch | Mēness | Culture of Latvia | https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Dziesmu_un_deju_sv%C4%93tku_pas%C4%81kumi_2018_%2842410779204%29.jpg/330px-Dziesmu_un_deju_sv%C4%93tku_pas%C4%81kumi_2018_%2842410779204%29.jpg
mengzi-person | person | extract-mismatch | Mengzi (Mencius) | Mencius | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Half_Portraits_of_the_Great_Sage_and_Virtuous_Men_of_Old_-_Meng_Ke_%28%E5%AD%9F%E8%BB%BB%29.jpg/330px-Half_Portraits_of_the_Great_Sage_and_Virtuous_Men_of_Old_-_Meng_Ke_%28%E5%AD%9F%E8%BB%BB%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
mesoamerican-cosmogony | theme | extract-mismatch | Mesoamerican Cosmogony | Popol Vuh | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Popol_vuh.jpg/330px-Popol_vuh.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
messianism | theme | extract-mismatch | Messianism | David | https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/King_David%2C_the_King_of_Israel.jpg/330px-King_David%2C_the_King_of_Israel.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
miaphysite-christology | theme | extract-mismatch | Miaphysite Christology (Tewahedo, one united nature) | Ethiopian Orthodox Tewahedo Church | https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg/330px-Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg
mitra-vedic | deity | extract-mismatch | Mitra (Vedic) | Mithraism | https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Mithra_sacrifiant_le_Taureau-005.JPG/330px-Mithra_sacrifiant_le_Taureau-005.JPG
mjolnir | symbol | extract-mismatch | Mjolnir | Mjölnir | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Claes_Kurck_Sk%C3%A5ne_hammer_-_HST_DIG55488_original.jpg/330px-Claes_Kurck_Sk%C3%A5ne_hammer_-_HST_DIG55488_original.jpg
monotheism-strict | theme | extract-mismatch | Strict Monotheism | Schools of Islamic theology | https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Istanbul%2C_Hagia_Sophia%2C_Allah.jpg/330px-Istanbul%2C_Hagia_Sophia%2C_Allah.jpg
mosaic-pavement | symbol | extract-mismatch | Mosaic Pavement | Freemasonry | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Square_and_Compasses_no_G.svg/330px-Square_and_Compasses_no_G.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
mullissu-akkadian | deity | extract-mismatch | Mullissu | Inanna | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Ishtar_on_an_Akkadian_seal.jpg/330px-Ishtar_on_an_Akkadian_seal.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
murugan | deity | extract-mismatch | Murugan | Kartikeya | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Batu_Caves%2C_Lord_Murugan_Statue._2019-12-01_10-49-22.jpg/330px-Batu_Caves%2C_Lord_Murugan_Statue._2019-12-01_10-49-22.jpg
narasimhadeva-i | person | extract-mismatch | Narasimhadeva I | Narasingha Deva I | https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Narasingha_deva.jpg/330px-Narasingha_deva.jpg
nasr-pre-islamic | deity | extract-mismatch | Nasr | Religion in pre-Islamic Arabia | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Antico_yemen%2C_al-jawf%2C_statuette_di_donne_sedute%2C_III-I_sec._ac._03.JPG/330px-Antico_yemen%2C_al-jawf%2C_statuette_di_donne_sedute%2C_III-I_sec._ac._03.JPG
nehushtan | symbol | extract-mismatch | Nehushtan (bronze serpent on a pole) | Moses | https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Rembrandt_Harmensz._van_Rijn_079.jpg/330px-Rembrandt_Harmensz._van_Rijn_079.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
nin-lil-sumerian | deity | extract-mismatch | Ninlil | Enlil | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/God_Enlil%2C_seated%2C_from_Nippur%2C_Iraq._1800-1600_BCE._Iraq_Museum.jpg/330px-God_Enlil%2C_seated%2C_from_Nippur%2C_Iraq._1800-1600_BCE._Iraq_Museum.jpg
ninazu | deity | extract-mismatch | Ninazu | Sumerian religion | https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Wall_plaque_showing_libation_scene_from_Ur%2C_Iraq%2C_2500_BCE._British_Museum_%28adjusted_for_perspective%29.jpg/330px-Wall_plaque_showing_libation_scene_from_Ur%2C_Iraq%2C_2500_BCE._British_Museum_%28adjusted_for_perspective%29.jpg
ninkasi | deity | extract-mismatch | Ninkasi | Sumerian religion | https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Wall_plaque_showing_libation_scene_from_Ur%2C_Iraq%2C_2500_BCE._British_Museum_%28adjusted_for_perspective%29.jpg/330px-Wall_plaque_showing_libation_scene_from_Ur%2C_Iraq%2C_2500_BCE._British_Museum_%28adjusted_for_perspective%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
noetus-of-smyrna | person | extract-mismatch | Noetus of Smyrna | Tertullian | https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Tertullian2.png/330px-Tertullian2.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
non-duality | theme | extract-mismatch | Non-duality | Advaita Vedanta | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Raja_Ravi_Varma_-_Sankaracharya.jpg/330px-Raja_Ravi_Varma_-_Sankaracharya.jpg
numenius-of-apamea | person | extract-mismatch | Numenius of Apamea | Neoplatonism | https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Plotin.jpg/330px-Plotin.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
nur-muhammadi | deity | extract-mismatch | Nur Muhammadi (The Muhammadan Light) | Muhammad | https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Al-Masjid_AL-Nabawi_Door.jpg/330px-Al-Masjid_AL-Nabawi_Door.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
obatala | deity | extract-mismatch | Obàtálá | Ọbatala | https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Oxal%C3%A1.jpg/330px-Oxal%C3%A1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
occasionalism | theme | extract-mismatch | Occasionalism | Nicolas Malebranche | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Portret_van_Nicolas_Malebranche%2C_RP-P-OB-72.656_%28cropped%29.jpg/330px-Portret_van_Nicolas_Malebranche%2C_RP-P-OB-72.656_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
odin | deity | extract-mismatch | Óðinn | Odin | https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Georg_von_Rosen_-_Oden_som_vandringsman%2C_1886_%28Odin%2C_the_Wanderer%29.jpg/330px-Georg_von_Rosen_-_Oden_som_vandringsman%2C_1886_%28Odin%2C_the_Wanderer%29.jpg
ohyah-nephilim | deity | extract-mismatch | Ohyah (Nephilim, son of Shemihazah) | The Book of Giants | https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Paradise_Lost_1.jpg/330px-Paradise_Lost_1.jpg
olodumare | deity | extract-mismatch | Olódùmarè | Ọlọrun | https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Olorun.png/330px-Olorun.png
olokun | deity | extract-mismatch | Olokun | Yoruba religion | https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Obatala_Temple_Ile_Ife.jpg/330px-Obatala_Temple_Ile_Ife.jpg
onias-iv | person | extract-mismatch | Onias IV | Leontopolis | https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Terzo_periodo_intermedio%2C_fine_XXII-inizio_XV_dinastia%2C_rilievo_di_re_iuput_II%2C_754-715_ac_ca._02.JPG/330px-Terzo_periodo_intermedio%2C_fine_XXII-inizio_XV_dinastia%2C_rilievo_di_re_iuput_II%2C_754-715_ac_ca._02.JPG
orthodoxy-vs-heresy | theme | extract-mismatch | Orthodoxy vs Heresy | Irenaeus | https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Saint_irenee_saint_irenee.jpg/330px-Saint_irenee_saint_irenee.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
oshe-shango | symbol | extract-mismatch | Oshé Shangó (Double Axe of Shango) | Shango | https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Representa%C3%A7%C3%A3o_de_Xang%C3%B4_MN_01.jpg/330px-Representa%C3%A7%C3%A3o_de_Xang%C3%B4_MN_01.jpg
pakal-sarcophagus-lid | symbol | extract-mismatch | Pakal Sarcophagus Lid | Palenque | https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Palenque_Collage.jpg/330px-Palenque_Collage.jpg
palongawhoya | deity | extract-mismatch | Palöngawhoya (Younger Twin War God) | Hopi mythology | https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Arizona%2C_hopi%2C_otre_con_testa_di_katsina%2C_1890.jpg/330px-Arizona%2C_hopi%2C_otre_con_testa_di_katsina%2C_1890.jpg
panentheism | theme | extract-mismatch | Panentheism (All-in-God) | Baruch Spinoza | https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Spinoza.jpg/330px-Spinoza.jpg
papatuanuku | deity | extract-mismatch | Papatūānuku | Rangi and Papa | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/WahineTane.jpg/330px-WahineTane.jpg
paraclete-spirit | theme | extract-mismatch | Paraclete / Spirit of Truth | Gospel of John | https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/JRL19060215_%28cropped%29.jpg/330px-JRL19060215_%28cropped%29.jpg
peter-j-carroll | person | extract-mismatch | Peter J. Carroll | Austin Osman Spare | https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Austin_Osman_Spare.jpg/330px-Austin_Osman_Spare.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
pharmakos | theme | extract-mismatch | Pharmakos (Greek Ritual Scapegoat) | Scapegoat | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Detail_of_East_Window%2C_Lincoln_Cathedral_%2814224253959%29.jpg/330px-Detail_of_East_Window%2C_Lincoln_Cathedral_%2814224253959%29.jpg
phase-1-006-atrahasis | document | extract-mismatch | Atrahasis | Atra-Hasis | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Chaos_Monster_and_Sun_God.png/330px-Chaos_Monster_and_Sun_God.png
phase-1-008-enuma-elish | document | extract-mismatch | Enuma Elish | Enūma Eliš | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Chaos_Monster_and_Sun_God.png/330px-Chaos_Monster_and_Sun_God.png
phase-1-020-shumma-alu | document | extract-mismatch | Šumma Ālu (If a City is Set on a Height) | Summilux | https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Leica_50mm_f-1.4_Summilux-M_II_%281962%29_Chrome.jpg/330px-Leica_50mm_f-1.4_Summilux-M_II_%281962%29_Chrome.jpg
phase-1-022-lament-for-ur | document | extract-mismatch | The Lamentation over the Destruction of Ur | Third Dynasty of Ur | https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Ur_III.svg/330px-Ur_III.svg.png
phase-1-025-shujing | document | extract-mismatch | Shujing (Book of Documents / Classic of History) | History of East Africa | https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/LocationEasternAfrica.png/330px-LocationEasternAfrica.png
phase-1-027-memphite-theology-shabaka-stone | document | extract-mismatch | The Memphite Theology (Shabaka Stone) | Shabaka Stone | https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Shabaka_Stone_at_the_British_Museum.jpg/330px-Shabaka_Stone_at_the_British_Museum.jpg
phase-1-028-kumarbi-cycle | document | extract-mismatch | The Kumarbi Cycle (Song of Going Forth / Song of Hedammu / Song of Ullikummi) | Hurrian religion | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hurrian_incense_container.JPG/330px-Hurrian_incense_container.JPG
phase-1-032-babylonian-theodicy | document | extract-mismatch | Babylonian Theodicy | Cuneiform | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Xerxes_Cuneiform_Van.JPG/330px-Xerxes_Cuneiform_Van.JPG
phase-1-035-wadi-el-jarf-papyri | document | extract-mismatch | Wadi el-Jarf Papyri | Old Kingdom of Egypt | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/4th_Dynasty_of_Egypt-03.png/330px-4th_Dynasty_of_Egypt-03.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-2-014-daodejing | document | extract-mismatch | Daodejing (Tao Te Ching) | Tao Te Ching | https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Mawangdui_LaoTsu_Ms2.JPG/330px-Mawangdui_LaoTsu_Ms2.JPG
phase-2-019-deuteronomistic-history | document | extract-mismatch | The Deuteronomistic History (Joshua–Judges–Samuel–Kings) | Book of Deuteronomy | https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Pap_266.jpg/330px-Pap_266.jpg
phase-2-033-shujing | document | extract-mismatch | Shujing (Book of Documents) | Book of Documents | https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Guwen_Shangshu_TNM.jpg/330px-Guwen_Shangshu_TNM.jpg
phase-2-039-sutrakritanga | document | extract-mismatch | Sūtrakṛtāṅga (Second Āṅga of the Jain Canon) | Mahavira | https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Mahavira_sculpture.jpg/330px-Mahavira_sculpture.jpg
phase-2-041-book-of-proverbs | document | extract-mismatch | Book of Proverbs | Wisdom literature | https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Lens_-_Inauguration_du_Louvre-Lens_le_4_d%C3%A9cembre_2012%2C_la_Galerie_du_Temps%2C_n%C2%B0_018.JPG/330px-Lens_-_Inauguration_du_Louvre-Lens_le_4_d%C3%A9cembre_2012%2C_la_Galerie_du_Temps%2C_n%C2%B0_018.JPG
phase-4-008-trimorphic-protennoia | document | extract-mismatch | Trimorphic Protennoia | Nag Hammadi library | https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png/330px-El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png
phase-4-009-pistis-sophia | document | extract-mismatch | Pistis Sophia | Nag Hammadi library | https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png/330px-El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png
phase-4-011-corpus-hermeticum-i | document | extract-mismatch | Corpus Hermeticum I (Poimandres) | Hermetica | https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/HermesTrismegistusCaucHighRes.jpg/330px-HermesTrismegistusCaucHighRes.jpg
phase-4-015-kephalaia-of-the-teacher | document | extract-mismatch | Kephalaia of the Teacher | Manichaeism | https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Seal_of_Mani_%28cleaned_up%29._Seal_with_figure_of_Mani%2C_possibly_3rd_century_CE%2C_possibly_Irak._Cabinet_des_M%C3%A9dailles%2C_Paris.jpg/330px-Seal_of_Mani_%28cleaned_up%29._Seal_with_figure_of_Mani%2C_possibly_3rd_century_CE%2C_possibly_Irak._Cabinet_des_M%C3%A9dailles%2C_Paris.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-4-016-shabuhragan | document | extract-mismatch | Šābuhragān | Mani (prophet) | https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Seal_of_Mani_%28cleaned_up%29._Seal_with_figure_of_Mani%2C_possibly_3rd_century_CE%2C_possibly_Irak._Cabinet_des_M%C3%A9dailles%2C_Paris.jpg/330px-Seal_of_Mani_%28cleaned_up%29._Seal_with_figure_of_Mani%2C_possibly_3rd_century_CE%2C_possibly_Irak._Cabinet_des_M%C3%A9dailles%2C_Paris.jpg
phase-4-024-tertullian-apology | document | extract-mismatch | Apology | Tertullian | https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Tertullian2.png/330px-Tertullian2.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-4-025-clement-stromata | document | extract-mismatch | Stromata | Stromatolite | https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Stromatolithe_Pal%C3%A9oarch%C3%A9en_-_MNHT.PAL.2009.10.1.jpg/330px-Stromatolithe_Pal%C3%A9oarch%C3%A9en_-_MNHT.PAL.2009.10.1.jpg
phase-4-036-passio-perpetuae | document | extract-mismatch | Passio Perpetuae et Felicitatis | Perpetua and Felicity | https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Perpetua%2C_Felicitas%2C_Revocatus%2C_Saturninus_and_Secundulus_%28Menologion_of_Basil_II%29.jpg/330px-Perpetua%2C_Felicitas%2C_Revocatus%2C_Saturninus_and_Secundulus_%28Menologion_of_Basil_II%29.jpg
phase-4-039-celsus-true-word | document | extract-mismatch | Alēthēs Logos / True Word (Celsus) | Origen | https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Origen.jpg/330px-Origen.jpg
phase-4-042-athanasius-on-the-incarnation | document | extract-mismatch | On the Incarnation | Athanasius of Alexandria | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Hosios_Loukas_Crypt_%28south_east_groin-vault%29_-_Athanasios.jpg/330px-Hosios_Loukas_Crypt_%28south_east_groin-vault%29_-_Athanasios.jpg
phase-4-043-apophthegmata-patrum | document | extract-mismatch | Apophthegmata Patrum (Sayings of the Desert Fathers) | Desert Fathers | https://upload.wikimedia.org/wikipedia/commons/8/86/StAnthony.jpg
phase-4-044-basil-on-the-holy-spirit | document | extract-mismatch | On the Holy Spirit | Basil of Caesarea | https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Basil_of_Caesarea.jpg/330px-Basil_of_Caesarea.jpg
phase-4-045-gregory-of-nyssa-life-of-moses | document | extract-mismatch | Life of Moses | Gregory of Nyssa | https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Gregory_of_Nyssa.jpg/330px-Gregory_of_Nyssa.jpg
phase-4-046-john-of-damascus-exposition-orthodox-faith | document | extract-mismatch | Exposition of the Orthodox Faith | John of Damascus | https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Athonite_Fresco_Icon_of_Saint_John_of_Damascus.jpg/330px-Athonite_Fresco_Icon_of_Saint_John_of_Damascus.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-4-050-leo-tome-to-flavian | document | extract-mismatch | Tome of Leo (Letter 28 to Flavian of Constantinople) | Eternal Darkness | https://upload.wikimedia.org/wikipedia/en/8/8d/Eternal_Darkness_box.jpg
phase-4-052-gregory-dialogues | document | extract-mismatch | Dialogues on the Miracles of the Italian Fathers | Pope Gregory I | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Gregory_the_Great_with_the_Holy_Spirit.jpg/330px-Gregory_the_Great_with_the_Holy_Spirit.jpg
phase-4-055-ephrem-hymns-on-paradise | document | extract-mismatch | Hymns on Paradise (Madrāšē dᵉ-Pardayšā) | Ephrem the Syrian | https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Ephrem_the_Syrian_%28mosaic_in_Nea_Moni%29.jpg/330px-Ephrem_the_Syrian_%28mosaic_in_Nea_Moni%29.jpg
phase-4-057-allogenes | document | extract-mismatch | Allogenes the Stranger | Nag Hammadi library | https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png/330px-El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png
phase-4-072-plutarch-de-iside-et-osiride | document | extract-mismatch | De Iside et Osiride (On Isis and Osiris) | Plutarch | https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Portrait_of_a_philosopher%2C_maybe_Plutarch%2C_2nd_century_BC%2C_AM_Delphi%2C_0135.jpg/330px-Portrait_of_a_philosopher%2C_maybe_Plutarch%2C_2nd_century_BC%2C_AM_Delphi%2C_0135.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-4-075-mulamadhyamakakarika | document | extract-mismatch | Mūlamadhyamakakārikā (Root Verses on the Middle Way) | Nagarjuna | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Nagarjuna_with_84_mahasiddha_cropped.jpg/330px-Nagarjuna_with_84_mahasiddha_cropped.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-4-076-stobaean-hermetica-kore-kosmou | document | extract-mismatch | Stobaean Hermetica (including Kore Kosmou — 'Daughter of the Cosmos') | Stobaeus | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Stobaeus_Eklogai_apophthegmaton_1536_page_1.jpg/330px-Stobaeus_Eklogai_apophthegmaton_1536_page_1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-4-076-visuddhimagga | document | extract-mismatch | Visuddhimagga (Path of Purification) | Buddhaghosa | https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/1686_Mallet_Map_of_Ceylon_or_Sri_Lanka_%28Taprobane%29_-_Geographicus_-_Taprobane-mallet-1686.jpg/330px-1686_Mallet_Map_of_Ceylon_or_Sri_Lanka_%28Taprobane%29_-_Geographicus_-_Taprobane-mallet-1686.jpg
phase-4-077-abhidharmakosa | document | extract-mismatch | Abhidharmakośa (Treasury of Abhidharma) | Vasubandhu | https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Vasubandhu.png/330px-Vasubandhu.png
phase-4-078-prayer-of-thanksgiving-nhc-vi-7 | document | extract-mismatch | Hermetic Prayer of Thanksgiving (NHC VI,7) | Nag Hammadi library | https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png/330px-El_Evangelio_de_Tom%C3%A1s-Gospel_of_Thomas-_Codex_II_Manuscritos_de_Nag_Hammadi-The_Nag_Hammadi_manuscripts.png
phase-4-081-mashafa-henok-geez-1-enoch | document | extract-mismatch | Mashafa Henok (Ge'ez 1 Enoch — the Ethiopic recension) | Book of Enoch | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/BL_Or_485_f._102r.png/330px-BL_Or_485_f._102r.png
phase-4-082-ethiopic-biblical-canon | document | extract-mismatch | Ethiopic Biblical Canon (the 81-book Ge'ez Bible) | Ethiopian Orthodox Tewahedo Church | https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg/330px-Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg
phase-4-083-mashafa-kidan-testament-of-our-lord | document | extract-mismatch | Mashafa Kidan (Testament of Our Lord) | Syriac Christianity | https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Jerusalem_Holy-Sepulchre_Jesus-Detail-01.png/330px-Jerusalem_Holy-Sepulchre_Jesus-Detail-01.png
phase-4-095-new-testament-canon | document | extract-mismatch | New Testament Canon — Formation | Eusebius | https://upload.wikimedia.org/wikipedia/commons/7/70/Eusebius_of_Caesarea_Rabbula_Gospels_Icon.jpg
phase-4-096-cantong-qi | document | extract-mismatch | Cantong Qi (The Kinship of the Three) | Canton, Michigan | https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Canton_township_municipal_complex.JPG/330px-Canton_township_municipal_complex.JPG
phase-4-099-shangqing-corpus | document | extract-mismatch | Shangqing Corpus (Supreme Clarity Revelations) | Taoism | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/%E6%AD%A6%E5%BD%93%E5%B1%B1%E7%B4%AB%E9%9C%84%E5%AE%AB_%2814739990839%29.jpg/330px-%E6%AD%A6%E5%BD%93%E5%B1%B1%E7%B4%AB%E9%9C%84%E5%AE%AB_%2814739990839%29.jpg
phase-4-celestial-hierarchy | document | extract-mismatch | Celestial Hierarchy (De Coelesti Hierarchia) | De Coelesti Hierarchia | https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Dionysius_Areopagita%2C_De_coelesti_hierarchia_%28Latin%29.jpg/330px-Dionysius_Areopagita%2C_De_coelesti_hierarchia_%28Latin%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-5-003-maximus-confessor-ambigua | document | extract-mismatch | Ambigua and Mystagogia (Maximus the Confessor) | Maximus the Confessor | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Athonite_Fresco_Icon_of_Saint_Maximos_the_Confessor_2.jpg/330px-Athonite_Fresco_Icon_of_Saint_Maximos_the_Confessor_2.jpg
phase-5-005-shankara-brahma-sutra-bhasya | document | extract-mismatch | Brahma-Sutra-Bhasya (Śaṅkara) | Adi Shankara | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Raja_Ravi_Varma_-_Sankaracharya.jpg/330px-Raja_Ravi_Varma_-_Sankaracharya.jpg
phase-5-008-eriugena-periphyseon | document | extract-mismatch | Periphyseon (On the Division of Nature) | Periphyton | https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Periphyton.jpg/330px-Periphyton.jpg
phase-5-010-saadia-emunot-ve-deot | document | extract-mismatch | Emunot ve-Deot (The Book of Beliefs and Opinions) | Saadia Gaon | https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Guide_for_the_Perplexed_by_Maimonides.jpg/330px-Guide_for_the_Perplexed_by_Maimonides.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-5-011-rasail-ikhwan-al-safa | document | extract-mismatch | Rasāʾil Ikhwān al-Ṣafāʾ (Epistles of the Brethren of Purity) | Brethren of Purity | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Double-leaf_frontispiece_from_%22The_Epistles_of_the_Brethren_of_Purity%22.jpg/330px-Double-leaf_frontispiece_from_%22The_Epistles_of_the_Brethren_of_Purity%22.jpg
phase-5-012-sefer-yetzirah | document | extract-mismatch | Sefer Yetzirah (Book of Formation) | Abraham | https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Guercino_Abramo_ripudia_Agar_%28cropped_2%29.jpg/330px-Guercino_Abramo_ripudia_Agar_%28cropped_2%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-5-014-abhinavagupta-tantraloka | document | extract-mismatch | Tantrāloka (Light on the Tantras) | Abhinavagupta | https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/SaivismFlag.svg/330px-SaivismFlag.svg.png
phase-5-018-suhrawardi-hikmat-al-ishraq | document | extract-mismatch | Ḥikmat al-Ishrāq (The Philosophy of Illumination) | Shihab al-Din Yahya ibn Habash Suhrawardi | https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Shihab_al-Din_Abu_al-Futuh_Ahmad_bin_Habbash_%28Ya%27ish%29_bin_Amirak_al-Suhrawardi_al-Maqtuli_%28d._1191-92%29%3B_Hikmat_al-Ishraq%2C_copied_by_Shams_bin_Jamal_al-Hatani%2C_post-Seljuq_Iran%2C_dated_Tuesday_13_October_1220.jpg/330px-thumbnail.jpg
phase-5-020-interrogatio-iohannis | document | extract-mismatch | Interrogatio Iohannis (The Secret Book of John of the Bogomils) | Montségur | https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Montsegur.p%C3%B2g1.jpg/330px-Montsegur.p%C3%B2g1.jpg
phase-5-021-ibn-arabi-fusus-al-hikam | document | extract-mismatch | Fuṣūṣ al-Ḥikam (The Bezels of Wisdom) | Ibn Arabi | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/%D9%82%D8%A8%D8%B1_%D8%A7%D9%84%D8%B4%D9%8A%D8%AE_%D9%85%D8%AD%D9%8A%D9%8A_%D8%A7%D9%84%D8%AF%D9%8A%D9%86_%D8%A8%D9%86_%D8%B9%D8%B1%D8%A8%D9%8A.jpg/330px-%D9%82%D8%A8%D8%B1_%D8%A7%D9%84%D8%B4%D9%8A%D8%AE_%D9%85%D8%AD%D9%8A%D9%8A_%D8%A7%D9%84%D8%AF%D9%8A%D9%86_%D8%A8%D9%86_%D8%B9%D8%B1%D8%A8%D9%8A.jpg
phase-5-022-madhva-brahma-sutra-bhasya | document | extract-mismatch | Brahma-Sūtra-Bhāṣya (Madhva) | Madhvacharya | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Shri_Madhvacharya_Vigraha%2C_Pajaka%2C_Udupi.jpg/330px-Shri_Madhvacharya_Vigraha%2C_Pajaka%2C_Udupi.jpg
phase-5-023-liber-de-duobus-principiis | document | extract-mismatch | Liber de Duobus Principiis (The Book of the Two Principles) | Albigensian Crusade | https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Le_massacre_des_Albigeois.jpg/330px-Le_massacre_des_Albigeois.jpg
phase-5-026-sefer-ha-bahir | document | extract-mismatch | Sefer ha-Bahir (The Book of Brightness) | Kabbalah | https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Portae_Lucis_1516.jpg/330px-Portae_Lucis_1516.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-5-030-palamas-triads | document | extract-mismatch | The Triads (In Defense of the Holy Hesychasts) | The Trial of the Chicago 7 | https://upload.wikimedia.org/wikipedia/en/c/c2/TrialChicago7poster.jpeg
phase-5-032-yogavasishtha | document | extract-mismatch | Yoga-Vāsiṣṭha (Yoga Vasistha) | Advaita Vedanta | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Raja_Ravi_Varma_-_Sankaracharya.jpg/330px-Raja_Ravi_Varma_-_Sankaracharya.jpg
phase-5-034-vivekachudamani | document | extract-mismatch | Vivekacūḍāmaṇi (Crest-Jewel of Discrimination) | Adi Shankara | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Raja_Ravi_Varma_-_Sankaracharya.jpg/330px-Raja_Ravi_Varma_-_Sankaracharya.jpg
phase-5-036-mashafa-mistir-giyorgis | document | extract-mismatch | Mashafa Mistir (Book of the Mystery) — Giyorgis of Sagla | Ethiopian Orthodox Tewahedo Church | https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg/330px-Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg
phase-5-036-rule-of-templars-latin | document | extract-mismatch | Latin Rule of the Templars | Knights Templar | https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Bandeira_Templ%C3%A1ria.svg/330px-Bandeira_Templ%C3%A1ria.svg.png
phase-5-037-bernard-de-laude-novae-militiae | document | extract-mismatch | De Laude Novae Militiae (In Praise of the New Knighthood) | Bernard of Clairvaux | https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/San_Bernardo%2C_de_Juan_Correa_de_Vivar_%28Museo_del_Prado%29.jpg/330px-San_Bernardo%2C_de_Juan_Correa_de_Vivar_%28Museo_del_Prado%29.jpg
phase-5-037-fetha-nagast | document | extract-mismatch | Fetha Nagast (Law of the Kings) | Ethiopian Orthodox Tewahedo Church | https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg/330px-Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg
phase-5-038-mashafa-berhan | document | extract-mismatch | Mashafa Berhan (Book of Light) — Zar'a Ya'qob | Ethiopian Orthodox Tewahedo Church | https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg/330px-Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg
phase-5-039-sinkessar-synaxarium | document | extract-mismatch | Sinkessar (Ethiopian Synaxarium) | Ethiopian Orthodox Tewahedo Church | https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg/330px-Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg
phase-5-040-meqabyan-ethiopian-maccabees | document | extract-mismatch | Meqabyan I–III (Ethiopian Maccabees) | Maccabees | https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Hasmonean_dynasty_family_tree.svg/330px-Hasmonean_dynasty_family_tree.svg.png
phase-5-043-ibn-ishaq-sirat-rasul-allah | document | extract-mismatch | Sirat Rasul Allah (Life of the Messenger of God — Ibn Isḥāq, recension by Ibn Hisham) | Muhammad | https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Al-Masjid_AL-Nabawi_Door.jpg/330px-Al-Masjid_AL-Nabawi_Door.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-5-044-ibn-sina-kitab-al-shifa | document | extract-mismatch | Kitāb al-Shifāʾ (The Book of Healing — Avicenna's encyclopedic philosophical *summa*) | Avicenna | https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Avicenna_Bust%2C_left_profile_%28cropped%29.jpg/330px-Avicenna_Bust%2C_left_profile_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-5-045-al-ghazali-tahafut-al-falasifa | document | extract-mismatch | Tahāfut al-Falāsifa (The Incoherence of the Philosophers) | Islamic Golden Age | https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Al-Idrisi%27s_world_map.JPG/330px-Al-Idrisi%27s_world_map.JPG
phase-5-046-ibn-rushd-tahafut-al-tahafut | document | extract-mismatch | Tahāfut al-Tahāfut (The Incoherence of the Incoherence) | Averroes | https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Andrea_di_bonaiuto%2C_apotesosi_di_san_tommaso_d%27aquino%2C_11_averro%C3%A8.jpg/330px-Andrea_di_bonaiuto%2C_apotesosi_di_san_tommaso_d%27aquino%2C_11_averro%C3%A8.jpg
phase-5-049-bodhicaryavatara | document | extract-mismatch | Bodhicaryāvatāra (Way of the Bodhisattva) | Shantideva | https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Shantideva.jpg/330px-Shantideva.jpg
phase-5-049-yosippon-ethiopian-recension | document | extract-mismatch | Yosippon / Joseph ben Gurion (Ethiopian recension — Zena Ayhud) | Josippon | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Brockhaus_and_Efron_Jewish_Encyclopedia_e8_843-0.jpg/330px-Brockhaus_and_Efron_Jewish_Encyclopedia_e8_843-0.jpg
phase-5-051-attar-conference-of-birds | document | extract-mismatch | Manṭiq al-Ṭayr (The Conference of the Birds / The Speech of Birds) | Attar of Nishapur | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Miniature_of_Attar_by_Hossein_Behzad.jpg/330px-Miniature_of_Attar_by_Hossein_Behzad.jpg
phase-5-052-sadi-gulistan | document | extract-mismatch | Gulistān (The Rose Garden) | Persian literature | https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Kelileh_va_Demneh.jpg/330px-Kelileh_va_Demneh.jpg
phase-5-056-divine-comedy | document | extract-mismatch | Divina Commedia (Divine Comedy) | Divine Comedy | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Dante_Domenico_di_Michelino.jpg/330px-Dante_Domenico_di_Michelino.jpg
phase-5-059-rasail-al-hikma | document | extract-mismatch | Rasāʾil al-Ḥikma | Druze | https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/PikiWiki_Israel_45144_Nabi_Shuayb.JPG/330px-PikiWiki_Israel_45144_Nabi_Shuayb.JPG
phase-5-060-bon-kangyur | document | extract-mismatch | Bön Kanjur | Jure Bogdan | https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Coat_of_arms_of_Jure_Bogdan.svg/330px-Coat_of_arms_of_Jure_Bogdan.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-5-061-kiteba-cilwe | document | extract-mismatch | Kitêba Cilwe and Mishefa Reş | Yazidis | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Ezidis_celebrating_Ezidi_New_Year_in_April_2018_at_Lalish_01.jpg/330px-Ezidis_celebrating_Ezidi_New_Year_in_April_2018_at_Lalish_01.jpg
phase-6-001-ficino-pimander | document | extract-mismatch | Pimander (Ficino's Latin translation of the Corpus Hermeticum) | Poimandres | https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/HermesTrismegistusCaucHighRes.jpg/330px-HermesTrismegistusCaucHighRes.jpg
phase-6-002-ficino-theologia-platonica | document | extract-mismatch | Theologia Platonica de immortalitate animorum | Marsilio Ficino | https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Portrait_of_Marsilio_Ficino.jpg/330px-Portrait_of_Marsilio_Ficino.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-6-004-pico-heptaplus-conclusiones-cabalisticae | document | extract-mismatch | Heptaplus + Conclusiones Cabalisticae | Giovanni Pico della Mirandola | https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pico1.jpg/330px-Pico1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-6-006-reuchlin-de-arte-cabalistica | document | extract-mismatch | De Arte Cabalistica | Johann Reuchlin | https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Johannes-Reuchlin-1516.jpg/330px-Johannes-Reuchlin-1516.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-6-007-luther-bondage-of-will | document | extract-mismatch | De Servo Arbitrio (On the Bondage of the Will) | Martin Luther | https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Lucas_Cranach_d.%C3%84._-_Martin_Luther%2C_1528_%28Veste_Coburg%29.jpg/330px-Lucas_Cranach_d.%C3%84._-_Martin_Luther%2C_1528_%28Veste_Coburg%29.jpg
phase-6-009-agrippa-de-occulta-philosophia | document | extract-mismatch | De Occulta Philosophia Libri Tres | Heinrich Cornelius Agrippa | https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Portrait_of_Agrippa_Wellcome_L0000100.jpg/330px-Portrait_of_Agrippa_Wellcome_L0000100.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-6-011-cordovero-pardes-rimmonim | document | extract-mismatch | Pardes Rimmonim (Orchard of Pomegranates) | Safed | https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Safed1.jpg/330px-Safed1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-6-015-luria-vital-etz-chayyim | document | extract-mismatch | Etz Chayyim (Tree of Life) — Lurianic Kabbalah transmitted via Chaim Vital | Isaac Luria | https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/%D7%A8%D7%91%D7%99_%D7%9E%D7%A9%D7%94.JPG/330px-%D7%A8%D7%91%D7%99_%D7%9E%D7%A9%D7%94.JPG
phase-6-018-rosicrucian-manifestos | document | extract-mismatch | Fama Fraternitatis + Confessio Fraternitatis | Rosicrucianism | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Rose_Cross.png/330px-Rose_Cross.png
phase-6-022-fludd-utriusque-cosmi-historia | document | extract-mismatch | Utriusque Cosmi Historia | Robert Fludd | https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Robert_Fludd.jpg/330px-Robert_Fludd.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-6-023-mulla-sadra-asfar | document | extract-mismatch | Al-Asfar al-Arba'a (The Four Journeys) | Mulla Sadra | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/%D9%85%D8%AC%D8%B3%D9%85%D9%87_%D9%85%D9%84%D8%A7%D8%B5%D8%AF%D8%B1%D8%A7.jpg/330px-%D9%85%D8%AC%D8%B3%D9%85%D9%87_%D9%85%D9%84%D8%A7%D8%B5%D8%AF%D8%B1%D8%A7.jpg
phase-6-025-nathan-of-gaza-treatise-on-dragons | document | extract-mismatch | Drush ha-Tanninim (Treatise on the Dragons) + Sabbatean writings | Nathan of Gaza | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Nathan_of_Gaza.jpg/330px-Nathan_of_Gaza.jpg
phase-6-034-khunrath-amphitheatrum-sapientiae | document | extract-mismatch | Amphitheatrum Sapientiae Aeternae (Amphitheatre of Eternal Wisdom) | Heinrich Khunrath | https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Portrait_of_Heinrich_Khunrath._Amphitheatrum_sapientiae_aeternae_Wellcome_L0050107_%28cropped%29.jpg/330px-Portrait_of_Heinrich_Khunrath._Amphitheatrum_sapientiae_aeternae_Wellcome_L0050107_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-6-038-teresa-interior-castle | document | extract-mismatch | Interior Castle (Castillo Interior / Las Moradas) | Teresa of Ávila | https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Santa_Teresa_de_Jes%C3%BAs_%28Museo_del_Prado%29.jpg/330px-Santa_Teresa_de_Jes%C3%BAs_%28Museo_del_Prado%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-6-040-bandarra-trovas | document | extract-mismatch | Trovas do Bandarra | Sebastianism | https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Don_Sebastian_de_Portugal.JPG/330px-Don_Sebastian_de_Portugal.JPG
phase-6-045-sendivogius-novum-lumen-chymicum | document | extract-mismatch | Novum Lumen Chymicum (New Light of Alchemy) | Michael Sendivogius | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/POL_Micha%C5%82_S%C4%99dziw%C3%B3j.jpg/330px-POL_Micha%C5%82_S%C4%99dziw%C3%B3j.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-6-048-basil-valentine-twelve-keys | document | extract-mismatch | Zwölf Schlüssel / Les Douze Clefs de Philosophie (Twelve Keys) | Basil Valentine | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Peterskirche_Erfurt_1.jpg/330px-Peterskirche_Erfurt_1.jpg
phase-6-049-starkey-secrets-revealed | document | extract-mismatch | Secrets Reveal'd / Introitus Apertus ad Occlusum Regis Palatium | Alchemy | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/E-codices_zbz-Ms-Rh-0172_044_max_copy.jpg/330px-E-codices_zbz-Ms-Rh-0172_044_max_copy.jpg
phase-6-050-thomas-vaughan-anthroposophia | document | extract-mismatch | Anthroposophia Theomagica / Lumen de Lumine / Aula Lucis | Rosicrucianism | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Rose_Cross.png/330px-Rose_Cross.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-6-051-mylius-philosophia-reformata | document | extract-mismatch | Philosophia Reformata | German Romanticism | https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Caspar_David_Friedrich_-_Mondaufgang_am_Meer_-_Google_Art_Project.jpg/330px-Caspar_David_Friedrich_-_Mondaufgang_am_Meer_-_Google_Art_Project.jpg
phase-7-013-gnostic-religion | document | extract-mismatch | The Gnostic Religion | Hans Jonas | https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Hans_Jonas_an_der_Universit%C3%A4t_St._Gallen_%281983%29_HSGH_022-001945_%28cropped_2%29.jpg/330px-Hans_Jonas_an_der_Universit%C3%A4t_St._Gallen_%281983%29_HSGH_022-001945_%28cropped_2%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-7-016-magick-in-theory-and-practice | document | extract-mismatch | Magick in Theory and Practice | Aleister Crowley | https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Aleister_Crowley%2C_thinker.jpg/330px-Aleister_Crowley%2C_thinker.jpg
phase-7-018-aion | document | extract-mismatch | Aion: Researches into the Phenomenology of the Self | The Collected Works of C. G. Jung | https://upload.wikimedia.org/wikipedia/en/8/8d/Cover_image_of_%28The%29_Spirit_in_Man%2C_Art%2C_and_Literature%2C_by_C.G._Jung.jpg
phase-7-019-mysterium-coniunctionis | document | extract-mismatch | Mysterium Coniunctionis | Carl Jung | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/ETH-BIB-Jung%2C_Carl_Gustav_%281875-1961%29-Portrait-Portr_14163_%28cropped%29.tif/lossy-page1-330px-ETH-BIB-Jung%2C_Carl_Gustav_%281875-1961%29-Portrait-Portr_14163_%28cropped%29.tif.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-7-022-sacred-and-profane | document | extract-mismatch | The Sacred and the Profane | Mircea Eliade | https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Mircea_Eliade_young.jpg/330px-Mircea_Eliade_young.jpg
phase-7-027-life-divine | document | extract-mismatch | The Life Divine | Sri Aurobindo | https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Sri_aurobindo.jpg/330px-Sri_aurobindo.jpg
phase-7-039-gandra-da-face-oculta-2009 | document | extract-mismatch | Da Face Oculta do Rosto da Europa: Prolegómenos a uma História Mítica de Portugal | Hermeticism | https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/HermesTrismegistusCaucHighRes.jpg/330px-HermesTrismegistusCaucHighRes.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
phase-7-042-donggyeong-daejeon | document | extract-mismatch | Donggyeong Daejeon | Tonghak | https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Flag_of_Donghak_Peasant_Revolution_%28small%29.svg/330px-Flag_of_Donghak_Peasant_Revolution_%28small%29.svg.png
phase-8-010-kumulipo | document | extract-mismatch | Kumulipo | Hawaiian religion | https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Jean-Pierre_Norblin_de_La_Gourdaine_%28after_Louis_Choris%29%2C_Temple_du_Roi_dans_la_baie_Tiritat%C3%A9a_%28c._1816%2C_published_1822%29.jpg/330px-Jean-Pierre_Norblin_de_La_Gourdaine_%28after_Louis_Choris%29%2C_Temple_du_Roi_dans_la_baie_Tiritat%C3%A9a_%28c._1816%2C_published_1822%29.jpg
phase-8-011-maori-cosmogonic-chants | document | extract-mismatch | Maori Cosmogonic Chants (Te Kore / Te Pō / Te Ao) | Māori mythology | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Maorigodsymbols.jpg/330px-Maorigodsymbols.jpg
phoebe | person | extract-mismatch | Phoebe | Epistle to the Romans | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Uncial_0220_Rom-4.23-5.3.jpg/330px-Uncial_0220_Rom-4.23-5.3.jpg
pillars-jachin-boaz | symbol | extract-mismatch | Pillars of Jachin and Boaz | Solomon's Temple | https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Francois_Vatable%2C_reconstructie_van_de_tempel_van_Salomo_%28detail%29.jpg/330px-Francois_Vatable%2C_reconstructie_van_de_tempel_van_Salomo_%28detail%29.jpg
pontos-riscados | symbol | extract-mismatch | Pontos Riscados | Umbanda | https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Mam%27etu_Sia_Vanju.jpg/330px-Mam%27etu_Sia_Vanju.jpg
poqanghoya | deity | extract-mismatch | Pöqánghoya (Elder Twin War God) | Hopi mythology | https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Arizona%2C_hopi%2C_otre_con_testa_di_katsina%2C_1890.jpg/330px-Arizona%2C_hopi%2C_otre_con_testa_di_katsina%2C_1890.jpg
pratyabhijna | theme | extract-mismatch | Pratyabhijñā (Recognition-Liberation) | Trika | https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/SaivismFlag.svg/330px-SaivismFlag.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
praxeas | person | extract-mismatch | Praxeas | Trinity | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Shield-Trinity-Scutum-Fidei-English.svg/330px-Shield-Trinity-Scutum-Fidei-English.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
predestination-protestant | theme | extract-mismatch | Predestination (Protestant Reformation) | Reformed Christianity | https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/ReformationsdenkmalGenf1.jpg/330px-ReformationsdenkmalGenf1.jpg
primordial-waters | theme | extract-mismatch | Primordial waters | Magmatic water | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/MAMMOTH_HOT_SPRINGS_-_EXTREMOPHILES.jpg/330px-MAMMOTH_HOT_SPRINGS_-_EXTREMOPHILES.jpg
prince-of-darkness-manichaean | deity | extract-mismatch | Prince of Darkness (Manichaean) | Manichaeism | https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Seal_of_Mani_%28cleaned_up%29._Seal_with_figure_of_Mani%2C_possibly_3rd_century_CE%2C_possibly_Irak._Cabinet_des_M%C3%A9dailles%2C_Paris.jpg/330px-Seal_of_Mani_%28cleaned_up%29._Seal_with_figure_of_Mani%2C_possibly_3rd_century_CE%2C_possibly_Irak._Cabinet_des_M%C3%A9dailles%2C_Paris.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
prisca-theologia | theme | extract-mismatch | Prisca Theologia (Ancient Theology) | Giovanni Pico della Mirandola | https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pico1.jpg/330px-Pico1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
priscilla-and-maximilla | person | extract-mismatch | Priscilla and Maximilla | Montanism | https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Acts-2.jpg/330px-Acts-2.jpg
priscillian | person | extract-mismatch | Priscillian | Hispania | https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Conquista_Hispania.svg/330px-Conquista_Hispania.svg.png
progressive-revelation | theme | extract-mismatch | Progressive Revelation | Baháʼí Faith | https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Seat_of_the_House_of_Justice.jpg/330px-Seat_of_the_House_of_Justice.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
prophet-and-king | theme | extract-mismatch | Prophet and King | Hebrew Bible | https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Tanach.jpg/330px-Tanach.jpg
pseudoarchaeology | theme | extract-mismatch | Pseudoarchaeology | Ancient astronauts | https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Antropomorfi_detti_astronauti_%28b%29_-_R_1_-_Area_di_Zurla_-_Nadro_%28ph_Luca_Giarelli%29.jpg/330px-Antropomorfi_detti_astronauti_%28b%29_-_R_1_-_Area_di_Zurla_-_Nadro_%28ph_Luca_Giarelli%29.jpg
pseudonymity-as-strategy | theme | extract-mismatch | Pseudonymity as Strategy | Pseudepigrapha | https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Denis_Areopagite.jpg/330px-Denis_Areopagite.jpg
ptolemaeus | person | extract-mismatch | Ptolemaeus (Valentinian) | Ptolemy | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Ptolemy_1476_with_armillary_sphere_model.jpg/330px-Ptolemy_1476_with_armillary_sphere_model.jpg
queens-chamber-great-pyramid | event | extract-mismatch | Queen's Chamber & Shaft Doors (Great Pyramid of Khufu) | Great Pyramid of Giza | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Great_Pyramid_of_Giza_-_Pyramid_of_Khufu.jpg/330px-Great_Pyramid_of_Giza_-_Pyramid_of_Khufu.jpg
raguel-archangel | deity | extract-mismatch | Raguel (Archangel) | Raphael (archangel) | https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Saint_Raphael.JPG/330px-Saint_Raphael.JPG
ramses-ii | person | extract-mismatch | Ramses Ii | Ramesses II | https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Ramses_II_British_Museum.jpg/330px-Ramses_II_British_Museum.jpg
ranginui | deity | extract-mismatch | Ranginui | Rangi and Papa | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/WahineTane.jpg/330px-WahineTane.jpg
realized-eschatology | theme | extract-mismatch | Realized Eschatology | Second Coming | https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Second_Coming_of_Christ_window.jpg/330px-Second_Coming_of_Christ_window.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
reason-over-passion | theme | extract-mismatch | Reason over Passion | Stoicism | https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Paolo_Monti_-_Servizio_fotografico_%28Napoli%2C_1969%29_-_BEIC_6353768.jpg/330px-Paolo_Monti_-_Servizio_fotografico_%28Napoli%2C_1969%29_-_BEIC_6353768.jpg
remiel-archangel | deity | extract-mismatch | Remiel (= Jeremiel in 4 Ezra) | Archangel | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/GuidoReni_MichaelDefeatsSatan.jpg/330px-GuidoReni_MichaelDefeatsSatan.jpg
restorationism | theme | extract-mismatch | Restorationism | Restoration Movement | https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Pioneers_in_the_great_religious_reformation_of_the_nineteenth_century%2C_eng._by_J.C._Buttre.tif/lossy-page1-330px-Pioneers_in_the_great_religious_reformation_of_the_nineteenth_century%2C_eng._by_J.C._Buttre.tif.jpg
reue-lusitanian | deity | extract-mismatch | Reue (Lusitanian Thunder-God) | Lusitanian language | https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Lusitano2.jpg/330px-Lusitano2.jpg
righteous-suffering-vindication | theme | extract-mismatch | Righteous Sufferer / Vindication | Book of Job | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/POxy_n3522.jpg/330px-POxy_n3522.jpg
roben | theme | extract-mismatch | Roben | Rōben | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/R%C5%8Dben_%28Todaiji%29.jpg/330px-R%C5%8Dben_%28Todaiji%29.jpg
robert-schoch | person | extract-mismatch | Robert M. Schoch | Sphinx | https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Sphinx_CdM_Paris_DeRidder865_n2.jpg/330px-Sphinx_CdM_Paris_DeRidder865_n2.jpg
royal-hymn | theme | extract-mismatch | Royal Hymn | Psalms | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Psalms_scroll.PNG/330px-Psalms_scroll.PNG
ruha | deity | extract-mismatch | Ruha | Mandaeism | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/%D9%83%D9%86%D8%B2%D8%A7_%D8%B1%D8%A8%D8%A7_.jpg/330px-%D9%83%D9%86%D8%B2%D8%A7_%D8%B1%D8%A8%D8%A7_.jpg
sabellius | person | extract-mismatch | Sabellius | Origen | https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Origen.jpg/330px-Origen.jpg
sacred-and-profane | theme | extract-mismatch | Sacred and Profane | Mircea Eliade | https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Mircea_Eliade_young.jpg/330px-Mircea_Eliade_young.jpg
sacred-cat | symbol | extract-mismatch | Sacred Cat | Bastet | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Bastet.svg/330px-Bastet.svg.png
sacred-defeat | theme | extract-mismatch | The Sacred Defeat — Founding Trauma as National Identity | Martyr | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/20%2C000_martyrs_of_Nicomedia_%28Menologion_of_Basil_II%29.jpg/330px-20%2C000_martyrs_of_Nicomedia_%28Menologion_of_Basil_II%29.jpg
sacred-fire | symbol | extract-mismatch | Sacred Fire | Zoroaster | https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Yazd%2C_Templo_del_Fuego_%282000%29_02_%28cropped%29.jpg/330px-Yazd%2C_Templo_del_Fuego_%282000%29_02_%28cropped%29.jpg
sacred-king | theme | extract-mismatch | Sacred King | James George Frazer | https://upload.wikimedia.org/wikipedia/commons/7/7a/JamesGeorgeFrazer.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled
sacred-number-forty | symbol | extract-mismatch | Sacred Number Forty | Lent | https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Altar_Dom_Greifswald.JPG/330px-Altar_Dom_Greifswald.JPG
sacred-number-two | symbol | extract-mismatch | Sacred Number Two | Yin and yang | https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Yin_and_Yang_symbol.svg/330px-Yin_and_Yang_symbol.svg.png
sacred-number-zero | symbol | extract-mismatch | Zero / The Void | Śūnyatā | https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/SeatedBuddha.jpg/330px-SeatedBuddha.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
sacred-scepter | symbol | extract-mismatch | Sacred Scepter | Sceptre | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Darius_the_Great.jpg/330px-Darius_the_Great.jpg
sacred-stag | symbol | extract-mismatch | Sacred Stag | Cernunnos | https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Gundestrupkedlen-_00054_%28cropped%29.jpg/330px-Gundestrupkedlen-_00054_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
sacred-threshold | symbol | extract-mismatch | Sacred Threshold | Liminality | https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Initiation_ritual_of_boys_in_Malawi.jpg/330px-Initiation_ritual_of_boys_in_Malawi.jpg
sacred-void | symbol | extract-mismatch | Sacred Void | Śūnyatā | https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/SeatedBuddha.jpg/330px-SeatedBuddha.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
sacrifice-substitution | symbol | extract-mismatch | Sacrifice by Substitution | Scapegoat | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Detail_of_East_Window%2C_Lincoln_Cathedral_%2814224253959%29.jpg/330px-Detail_of_East_Window%2C_Lincoln_Cathedral_%2814224253959%29.jpg
saklas | deity | extract-mismatch | Saklas | Yaldabaoth | https://upload.wikimedia.org/wikipedia/commons/d/d2/Lion-faced_deity.jpg
saoshyant | deity | extract-mismatch | Saoshyant | Frashokereti | https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Faravahar.svg/330px-Faravahar.svg.png
sapling-deity | deity | extract-mismatch | Sapling (Good Mind Twin) | Tree | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Usamljeni_jasen_-_panoramio_%28cropped%29.jpg/330px-Usamljeni_jasen_-_panoramio_%28cropped%29.jpg
saraqael-archangel | deity | extract-mismatch | Saraqael (Archangel) | Archangel | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/GuidoReni_MichaelDefeatsSatan.jpg/330px-GuidoReni_MichaelDefeatsSatan.jpg
sariputta | person | extract-mismatch | Sariputta | Śāriputra | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Standing_%C5%9A%C4%81riputra.png/330px-Standing_%C5%9A%C4%81riputra.png
satanael | deity | extract-mismatch | Satanael (Bogomil Satan-Demiurge) | Lucifer | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Alexandre_Cabanel_-_Fallen_Angel.jpg/330px-Alexandre_Cabanel_-_Fallen_Angel.jpg
secular-spirituality | theme | extract-mismatch | Secular Spirituality | New Age | https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/7_Chakras.JPG/330px-7_Chakras.JPG
seela-meqabyan | person | extract-mismatch | Seela (Meqabyan II) | Maccabees | https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Hasmonean_dynasty_family_tree.svg/330px-Hasmonean_dynasty_family_tree.svg.png
selket | deity | extract-mismatch | Selket | Serket | https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Serket.svg/330px-Serket.svg.png
semyaza | deity | extract-mismatch | Semyaza (Shemihazah) | Samyaza | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/The_Sons_of_God_Saw_the_Daughters_of_Men_That_They_Were_Fair%2C_by_Daniel_Chester_French%2C_modeled_by_1918%2C_carved_1923_-_Corcoran_Gallery_of_Art_-_DSC01065.JPG/330px-The_Sons_of_God_Saw_the_Daughters_of_Men_That_They_Were_Fair%2C_by_Daniel_Chester_French%2C_modeled_by_1918%2C_carved_1923_-_Corcoran_Gallery_of_Art_-_DSC01065.JPG
serpent-dual-nature | theme | extract-mismatch | Serpent Dual Nature (Enemy and Wisdom) | Ouroboros | https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Serpiente_alquimica.jpg/330px-Serpiente_alquimica.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
shah-wali-allah | person | extract-mismatch | Shah Wali Allah | Delhi | https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Jama_Masjid_2011.jpg/330px-Jama_Masjid_2011.jpg
shango | deity | extract-mismatch | Ṣàngó | Shango | https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Representa%C3%A7%C3%A3o_de_Xang%C3%B4_MN_01.jpg/330px-Representa%C3%A7%C3%A3o_de_Xang%C3%B4_MN_01.jpg
shekhinah | deity | extract-mismatch | Shekhinah (Divine Presence) | Kabbalah | https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Portae_Lucis_1516.jpg/330px-Portae_Lucis_1516.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
shevirat-hakelim | theme | extract-mismatch | Shevirat ha-Kelim (Breaking of the Vessels) | Isaac Luria | https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/%D7%A8%D7%91%D7%99_%D7%9E%D7%A9%D7%94.JPG/330px-%D7%A8%D7%91%D7%99_%D7%9E%D7%A9%D7%94.JPG
shosoin-treasury | person | extract-mismatch | Shosoin Treasury | Shōsōin | https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Shoso-in.jpg/330px-Shoso-in.jpg
siris-akkadian | deity | extract-mismatch | Siris | Sinis (mythology) | https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Theseus_Sinis_Staatliche_Antikensammlungen_8771.jpg/330px-Theseus_Sinis_Staatliche_Antikensammlungen_8771.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
sky-woman-haudenosaunee | deity | extract-mismatch | Sky Woman (Ataensic) | Haudenosaunee | https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Flag_of_the_Iroquois_Confederacy.svg/330px-Flag_of_the_Iroquois_Confederacy.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
son-of-man | theme | extract-mismatch | Son of Man | Ancient of Days | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Europe_a_Prophecy%2C_copy_D%2C_object_1_%28Bentley_1%2C_Erdman_i%2C_Keynes_i%29_British_Museum.jpg/330px-Europe_a_Prophecy%2C_copy_D%2C_object_1_%28Bentley_1%2C_Erdman_i%2C_Keynes_i%29_British_Museum.jpg
sotaesan | person | extract-mismatch | Sotaesan — 少太山 | Iksan | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Iksan_-_Young_Deung_Dong.jpg/330px-Iksan_-_Young_Deung_Dong.jpg
soul-as-bride | theme | extract-mismatch | Soul as Bride | Bernard of Clairvaux | https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/San_Bernardo%2C_de_Juan_Correa_de_Vivar_%28Museo_del_Prado%29.jpg/330px-San_Bernardo%2C_de_Juan_Correa_de_Vivar_%28Museo_del_Prado%29.jpg
soul-exile-longing | theme | extract-mismatch | Soul-Exile Longing — The Luminous Self Mourning Its Separation | Neoplatonism | https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Plotin.jpg/330px-Plotin.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
stribog | deity | extract-mismatch | Stribog | Slavic paganism | https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Steinrelief_Pfarrkirche_Altenkirchen.jpg/330px-Steinrelief_Pfarrkirche_Altenkirchen.jpg
suffering-servant | theme | extract-mismatch | Suffering Servant | Isaiah 53 | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Great_Isaiah_Scroll_Ch53.jpg/330px-Great_Isaiah_Scroll_Ch53.jpg
sulphur-mercury-salt | symbol | extract-mismatch | Sulphur, Mercury, Salt (Tria Prima) | Paracelsus | https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Aureolus_Theophrastus_Bombastus_von_Hohenheim_%28Paracelsus%29._Wellcome_V0004455.jpg/330px-Aureolus_Theophrastus_Bombastus_von_Hohenheim_%28Paracelsus%29._Wellcome_V0004455.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
sun-bearer | deity | extract-mismatch | Sun Bearer (Jóhonaa'éí) | Navajo | https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Manuelito.jpg/330px-Manuelito.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
svarog | deity | extract-mismatch | Svarog | Slavic paganism | https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Steinrelief_Pfarrkirche_Altenkirchen.jpg/330px-Steinrelief_Pfarrkirche_Altenkirchen.jpg
sympathetic-magic | theme | extract-mismatch | Sympathetic Magic | James George Frazer | https://upload.wikimedia.org/wikipedia/commons/7/7a/JamesGeorgeFrazer.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled
syncretism-egyptian-greek | theme | extract-mismatch | Egyptian-Greek Syncretism | Greco-Roman mysteries | https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Eleusinian_hydria_Antikensammlung_Berlin_1984.46.jpg/330px-Eleusinian_hydria_Antikensammlung_Berlin_1984.46.jpg
t-g-h-strehlow | person | extract-mismatch | Theodor George Henry Strehlow | Arrernte people | https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Walter_Baldwin_Spencer_and_Francis_J_Gillen_-_Arrernte_welcoming_dance%2C_entrance_of_the_strangers%2C_Alice_Springs%2C_Central_Australia%2C_9_May_1901_-_Google_Art_Project.jpg/330px-thumbnail.jpg
tangaroa | deity | extract-mismatch | Tangaroa | Polynesian mythology | https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/HivaOa_Takii.jpg/330px-HivaOa_Takii.jpg
tangun | deity | extract-mismatch | Tangun | Tan'gun | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Portrait_of_Dangun.jpg/330px-Portrait_of_Dangun.jpg
tat-hermetic | deity | extract-mismatch | Tat (Hermetic) | Hermes Trismegistus | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Hermes_Trismegistus_Sienna_Cathedral_Mosaic.jpg/330px-Hermes_Trismegistus_Sienna_Cathedral_Mosaic.jpg
tat-hermetic-disciple | person | extract-mismatch | Tat (Hermetic disciple) | Hermeticism | https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/HermesTrismegistusCaucHighRes.jpg/330px-HermesTrismegistusCaucHighRes.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
tauroctony-as-cosmic-icon | theme | extract-mismatch | Tauroctony as cosmic icon (Ulansey-Beck thesis) | Mithraism | https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Mithra_sacrifiant_le_Taureau-005.JPG/330px-Mithra_sacrifiant_le_Taureau-005.JPG
tawantinsuyu | tradition | extract-mismatch | Tawantinsuyu | Inca Empire | https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Suntur_Paucar.svg/330px-Suntur_Paucar.svg.png
telipinu | deity | extract-mismatch | Telipinu | Hittite mythology and religion | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/HittiteSeatedDeityAnatolia13thCenturyBCE.jpg/330px-HittiteSeatedDeityAnatolia13thCenturyBCE.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
the-godhead-eckhart | theme | extract-mismatch | The Godhead (Eckhart's Gottheit) | Meister Eckhart | https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Meister_Eckhart_base_copie.jpg/330px-Meister_Eckhart_base_copie.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
the-good-god-cathar | deity | extract-mismatch | The Good God (Cathar) | Montségur | https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Montsegur.p%C3%B2g1.jpg/330px-Montsegur.p%C3%B2g1.jpg
the-lady-ecclesia-hermas | deity | extract-mismatch | The Lady / Ecclesia (Hermas) | The Shepherd of Hermas | https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Codex_Tchacos_p33.jpg/330px-Codex_Tchacos_p33.jpg
the-nine-saints | person | extract-mismatch | The Nine Saints (Tisseatu Kidusan) | Ethiopian Orthodox Tewahedo Church | https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg/330px-Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg
the-one-plotinus | deity | extract-mismatch | The One (Plotinus) | Plotinus | https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Plotinos.jpg/330px-Plotinos.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
the-world-soul | deity | extract-mismatch | The World Soul | Neoplatonism | https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Plotin.jpg/330px-Plotin.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
theme-axial-age | theme | extract-mismatch | Axial Age | Karl Jaspers | https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Karl_Jaspers_1946.jpg/330px-Karl_Jaspers_1946.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
theme-dying-founder-paradigm | theme | extract-mismatch | The Dying Founder Paradigm — executed originators and the traditions they generate | Martyr | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/20%2C000_martyrs_of_Nicomedia_%28Menologion_of_Basil_II%29.jpg/330px-20%2C000_martyrs_of_Nicomedia_%28Menologion_of_Basil_II%29.jpg
theme-el-yahweh-merger | theme | extract-mismatch | El/Yahweh Convergence — The Canaanite Roots of Israelite Monotheism | El (deity) | https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/%E3%82%A4%E3%83%AB%E7%A5%9E%E3%81%AE%E5%9D%90%E5%83%8F.jpg/330px-%E3%82%A4%E3%83%AB%E7%A5%9E%E3%81%AE%E5%9D%90%E5%83%8F.jpg
theme-graduated-afterlife | theme | extract-mismatch | Graduated Afterlife (Sin-Matched Judgment) | Heaven | https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Paradiso_Canto_31_%28148200393%29.jpg/330px-Paradiso_Canto_31_%28148200393%29.jpg
theme-heroes-paradise-island | theme | extract-mismatch | Heroes' Paradise Island (Divine Reward as Sacred Realm) | Elysium | https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Henryk_Siemiradzki_-_Orfeusz_w_podziemnym_kr%C3%B3lestwie.jpg/330px-Henryk_Siemiradzki_-_Orfeusz_w_podziemnym_kr%C3%B3lestwie.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
theme-rebel-against-the-divine | theme | extract-mismatch | Rebel Against the Divine | Prometheus | https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Prometheus_and_Atlas%2C_Laconian_black-figure_kylix%2C_by_the_Arkesilas_Painter%2C_560-550_BC%2C_inv._16592_-_Museo_Gregoriano_Etrusco_-_Vatican_Museums_-_DSC01069.jpg/330px-Prometheus_and_Atlas%2C_Laconian_black-figure_kylix%2C_by_the_Arkesilas_Painter%2C_560-550_BC%2C_inv._16592_-_Museo_Gregoriano_Etrusco_-_Vatican_Museums_-_DSC01069.jpg
theme-two-powers-in-heaven | theme | extract-mismatch | Two Powers in Heaven | Metatron | https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/MetatronInIslamicArts.jpg/330px-MetatronInIslamicArts.jpg
theodore-strehlow | person | extract-mismatch | Carl Friedrich Theodor Strehlow | Arrernte people | https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Walter_Baldwin_Spencer_and_Francis_J_Gillen_-_Arrernte_welcoming_dance%2C_entrance_of_the_strangers%2C_Alice_Springs%2C_Central_Australia%2C_9_May_1901_-_Google_Art_Project.jpg/330px-thumbnail.jpg
theodotus-valentinian | person | extract-mismatch | Theodotus the Valentinian | Clement of Alexandria | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Clement_alexandrin.jpg/330px-Clement_alexandrin.jpg
theurgy | theme | extract-mismatch | Theurgy | Iamblichus | https://upload.wikimedia.org/wikipedia/commons/8/8a/Iamblichus.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled
thich-nhat-hanh | person | extract-mismatch | Thich Nhat Hanh | Thích Nhất Hạnh | https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/%E4%B8%80%E8%A1%8C%E7%A6%AA%E5%B8%AB_%E8%B6%8A%E5%8D%97%E4%BD%9B%E6%95%99%E8%87%A8%E6%BF%9F%E5%AE%97%E7%AC%AC%E5%9B%9B%E5%8D%81%E4%BA%8C%E4%BB%A3%E6%B3%95%E5%97%A3.jpg/330px-%E4%B8%80%E8%A1%8C%E7%A6%AA%E5%B8%AB_%E8%B6%8A%E5%8D%97%E4%BD%9B%E6%95%99%E8%87%A8%E6%BF%9F%E5%AE%97%E7%AC%AC%E5%9B%9B%E5%8D%81%E4%BA%8C%E4%BB%A3%E6%B3%95%E5%97%A3.jpg
thomas-vaughan | person | extract-mismatch | Thomas Vaughan | Rosicrucianism | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Rose_Cross.png/330px-Rose_Cross.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
tikkun-olam | theme | extract-mismatch | Tikkun Olam (Cosmic Repair) | Kabbalah | https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Portae_Lucis_1516.jpg/330px-Portae_Lucis_1516.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
timothy | person | extract-mismatch | Timothy | Ephesus | https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Ephesus_Celsus_Library_Fa%C3%A7ade.jpg/330px-Ephesus_Celsus_Library_Fa%C3%A7ade.jpg
tipitaka | document | extract-mismatch | Tipitaka | Tipitakadhara Tipitakakovida Selection Examinations | https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Tipitakadhara_Tipitakakovida_Examinations%2C_Mahapasana_Guha_Cave%2C_Yangon.JPG/330px-Tipitakadhara_Tipitakakovida_Examinations%2C_Mahapasana_Guha_Cave%2C_Yangon.JPG
tlaloc | deity | extract-mismatch | Tlaloc | Tláloc | https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Tlaloc_glyph.svg/330px-Tlaloc_glyph.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
tlazolteotl | deity | extract-mismatch | Tlazolteotl | Tlazōlteōtl | https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Tlazoteotl_7.jpg/330px-Tlazoteotl_7.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
totemism | theme | extract-mismatch | Totemism | Totem | https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Kwakiutl1.jpg/330px-Kwakiutl1.jpg
tradition-andean | tradition | extract-mismatch | Tradition Andean | Religion in the Inca Empire | https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Pachacuteckoricancha.jpg/330px-Pachacuteckoricancha.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
tradition-anthroposophy | tradition | extract-mismatch | Anthroposophy | Rudolf Steiner | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Steiner_um_1905.jpg/330px-Steiner_um_1905.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
tradition-asatru | tradition | extract-mismatch | Ásatrú / Heathenry | Germanic paganism | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Bracteate_from_Funen%2C_Denmark_%28DR_BR42%29.jpg/330px-Bracteate_from_Funen%2C_Denmark_%28DR_BR42%29.jpg
tradition-byzantine-christianity | tradition | extract-mismatch | Tradition Byzantine Christianity | Eastern Orthodox Church | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/St._George%27s_Cathedral_2022_%286%29.jpg/330px-St._George%27s_Cathedral_2022_%286%29.jpg
tradition-chavin | tradition | extract-mismatch | Tradition Chavin | Chavín culture | https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/ChavinMap.svg/330px-ChavinMap.svg.png
tradition-chishtiyya | tradition | extract-mismatch | Tradition Chishtiyya | Chishti Order | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Talisman_Louvre_MAO905.jpg/330px-Talisman_Louvre_MAO905.jpg
tradition-donghak | tradition | extract-mismatch | Donghak — Eastern Learning | Tonghak | https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Flag_of_Donghak_Peasant_Revolution_%28small%29.svg/330px-Flag_of_Donghak_Peasant_Revolution_%28small%29.svg.png
tradition-elamite | tradition | extract-mismatch | Elamite Religion | Elam | https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Elam_Map-en.svg/330px-Elam_Map-en.svg.png
tradition-essenes | tradition | extract-mismatch | Essenes | Qumran | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Kumeran4.jpg/330px-Kumeran4.jpg
tradition-french-monarchy | tradition | extract-mismatch | Tradition French Monarchy | Kingdom of France | https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Royal_Standard_of_the_King_of_France.svg/330px-Royal_Standard_of_the_King_of_France.svg.png
tradition-jainism | tradition | extract-mismatch | Jainism | Mahavira | https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Mahavira_sculpture.jpg/330px-Mahavira_sculpture.jpg
tradition-jyotisha-indian-astrology | tradition | extract-mismatch | Jyotisha (Vedic / Indian Astrology) | Navagraha | https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Navagraha.jpg/330px-Navagraha.jpg
tradition-maori | tradition | extract-mismatch | Maori Religion | Māori mythology | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Maorigodsymbols.jpg/330px-Maorigodsymbols.jpg
tradition-naqshbandiyya | tradition | extract-mismatch | Tradition Naqshbandiyya | Naqshbandi Order | https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Bahauddin_Naqshband_Memorial_Complex._Bukhara.jpg/330px-Bahauddin_Naqshband_Memorial_Complex._Bukhara.jpg
tradition-nestorian-christianity | tradition | extract-mismatch | Tradition Nestorian Christianity | Church of the East | https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/An_epitaph_of_a_Nestorian_Christian.jpg/330px-An_epitaph_of_a_Nestorian_Christian.jpg
tradition-ordo-novi-templi | tradition | extract-mismatch | Ordo Novi Templi (Order of the New Templars; ONT) | Ariosophy | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/WernervonB%C3%BClowsWorldRuneClock.JPG/330px-WernervonB%C3%BClowsWorldRuneClock.JPG
tradition-pentecostalism | tradition | extract-mismatch | Pentecostalism | Holy Spirit in Christianity | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Rom%2C_Vatikan%2C_Basilika_St._Peter%2C_Die_Taube_des_Heiligen_Geistes_%28Cathedra_Petri%2C_Bernini%29.jpg/330px-Rom%2C_Vatikan%2C_Basilika_St._Peter%2C_Die_Taube_des_Heiligen_Geistes_%28Cathedra_Petri%2C_Bernini%29.jpg
tradition-sanjiao | tradition | extract-mismatch | Sanjiao (三教 — The Three Teachings) | Three teachings | https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Sakyamuni%2C_Lao_Tzu%2C_and_Confucius_-_Google_Art_ProjectFXD.jpg/330px-Sakyamuni%2C_Lao_Tzu%2C_and_Confucius_-_Google_Art_ProjectFXD.jpg
tradition-theravada-buddhism | tradition | extract-mismatch | Theravāda Buddhism | Wat Pho | https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%9E%E0%B8%B8%E0%B8%97%E0%B8%98%E0%B9%84%E0%B8%AA%E0%B8%A2%E0%B8%B2%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B9%80%E0%B8%8A%E0%B8%95%E0%B8%B8%E0%B8%9E%E0%B8%99.jpg/330px-%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%9E%E0%B8%B8%E0%B8%97%E0%B8%98%E0%B9%84%E0%B8%AA%E0%B8%A2%E0%B8%B2%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B9%80%E0%B8%8A%E0%B8%95%E0%B8%B8%E0%B8%9E%E0%B8%99.jpg
tradition-western-astrology | tradition | extract-mismatch | Western Astrology (Mesopotamian–Hellenistic–Islamic–Latin continuous transmission) | Zodiac | https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Ecliptic_path.jpg/330px-Ecliptic_path.jpg
translation-as-theology | theme | extract-mismatch | Translation as Theology | Bible translations | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Modern_English_Bible_translations.jpg/330px-Modern_English_Bible_translations.jpg
trebaruna | deity | extract-mismatch | Trebaruna | Lusitania | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Roman_Empire_-_Lusitania_%28125_AD%29.svg/330px-Roman_Empire_-_Lusitania_%28125_AD%29.svg.png
true-will | theme | extract-mismatch | True Will (Thelema) | Thelema | https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Aleister_Crowley%2C_Golden_Dawn.jpg/330px-Aleister_Crowley%2C_Golden_Dawn.jpg
tummal-chronicle | document | extract-mismatch | Tummal Chronicle | Nippur | https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Ruins_from_a_temple_in_Naffur.jpg/330px-Ruins_from_a_temple_in_Naffur.jpg
turks | person | extract-mismatch | Turks | Turkic peoples | https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Turkic_Languages_distribution_map.png/330px-Turkic_Languages_distribution_map.png
two-principles | theme | extract-mismatch | Two Principles (Manichaean Light/Darkness) | Manichaeism | https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Seal_of_Mani_%28cleaned_up%29._Seal_with_figure_of_Mani%2C_possibly_3rd_century_CE%2C_possibly_Irak._Cabinet_des_M%C3%A9dailles%2C_Paris.jpg/330px-Seal_of_Mani_%28cleaned_up%29._Seal_with_figure_of_Mani%2C_possibly_3rd_century_CE%2C_possibly_Irak._Cabinet_des_M%C3%A9dailles%2C_Paris.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
two-spirits-doctrine | theme | extract-mismatch | Two-Spirits Doctrine | Zoroastrianism | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Faravahar_on_Fire_Temple%2C_Yazd.jpg/330px-Faravahar_on_Fire_Temple%2C_Yazd.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
tzimtzum | theme | extract-mismatch | Tzimtzum (Divine Contraction) | Isaac Luria | https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/%D7%A8%D7%91%D7%99_%D7%9E%D7%A9%D7%94.JPG/330px-%D7%A8%D7%91%D7%99_%D7%9E%D7%A9%D7%94.JPG
ungrund | theme | extract-mismatch | Ungrund (Boehme's Groundless) | Jakob Böhme | https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Jacob-B%C3%B6hme.jpg/330px-Jacob-B%C3%B6hme.jpg
universal-reformation | theme | extract-mismatch | Universal Reformation | Rosicrucianism | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Rose_Cross.png/330px-Rose_Cross.png
utpaladeva | person | extract-mismatch | Utpaladeva | Trika | https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/SaivismFlag.svg/330px-SaivismFlag.svg.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
uzayr | person | extract-mismatch | ʿUzayr | Uzair | https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Chester_Beatty_T_414_fol_92v_Uzair_sleeping_next_to_Qods.jpg/330px-Chester_Beatty_T_414_fol_92v_Uzair_sleeping_next_to_Qods.jpg
vallabhacharya | person | extract-mismatch | Vallabhacharya | Vallabha | https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Shri_mahaprabhuji.jpg/330px-Shri_mahaprabhuji.jpg
velinas | deity | extract-mismatch | Velinas / Velnias | Veles (god) | https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Symbol_of_Veles.svg/330px-Symbol_of_Veles.svg.png
viracocha | deity | extract-mismatch | Viracocha | Tiwanaku | https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/PUERTA_DEL_SOL_TIWANAKU.jpg/330px-PUERTA_DEL_SOL_TIWANAKU.jpg
viriato | person | extract-mismatch | Viriato (Viriathus) | Viriathus | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Viriato.JPG/330px-Viriato.JPG
vritra | deity | extract-mismatch | Vṛtra | Indra | https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Indra%2C_Chief_of_the_Gods_LACMA_M.69.13.4_%281_of_5%29.jpg/330px-Indra%2C_Chief_of_the_Gods_LACMA_M.69.13.4_%281_of_5%29.jpg
wadd | deity | extract-mismatch | Wadd | Religion in pre-Islamic Arabia | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Antico_yemen%2C_al-jawf%2C_statuette_di_donne_sedute%2C_III-I_sec._ac._03.JPG/330px-Antico_yemen%2C_al-jawf%2C_statuette_di_donne_sedute%2C_III-I_sec._ac._03.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
wakan-tanka | deity | extract-mismatch | Wakan Tanka | Lakota people | https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/En-chief-sitting-bull.jpg/330px-En-chief-sitting-bull.jpg
was-scepter | symbol | extract-mismatch | Was Scepter | Was-sceptre | https://upload.wikimedia.org/wikipedia/commons/7/71/Egypt.Mythology.Set.jpg
xunzi-person | person | extract-mismatch | Xunzi (Xun Kuang) | Confucianism | https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/%E6%9C%A8%E9%90%B8_---_Confucian_wooden-clapper_bell.svg/330px-%E6%9C%A8%E9%90%B8_---_Confucian_wooden-clapper_bell.svg.png
yahweh | deity | extract-mismatch | YHWH (Yahweh) | Yahweh | https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Zeus_Yahweh.jpg/330px-Zeus_Yahweh.jpg
yam | deity | extract-mismatch | Yam | List of Ugaritic deities | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/P1050759_Louvre_st%C3%A8le_du_Baal_au_foudre_rwk.JPG/330px-P1050759_Louvre_st%C3%A8le_du_Baal_au_foudre_rwk.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail
yi-songgye | person | extract-mismatch | Yi Songgye | Taejo of Joseon | https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/King_Taejo_Yi_02.jpg/330px-King_Taejo_Yi_02.jpg
zarathustra | person | extract-mismatch | Zarathustra | Zoroaster | https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Yazd%2C_Templo_del_Fuego_%282000%29_02_%28cropped%29.jpg/330px-Yazd%2C_Templo_del_Fuego_%282000%29_02_%28cropped%29.jpg
zemyna | deity | extract-mismatch | Žemyna | Romuva (temple) | https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Romuva_sanctuary.jpg/330px-Romuva_sanctuary.jpg
zep-tepi | theme | extract-mismatch | Zep Tepi — The First Time | Ancient Egyptian creation myths | https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Sunrise_at_Creation.jpg/330px-Sunrise_at_Creation.jpg
```

## Recommended fix script outline

**Do not run in this audit commit.** Sketch only.

```python
# scripts/fix_thumbnails_2026_05_28.py
# Reads AUDIT/2026-05-28-thumbnail-audit.md flagged list,
# patches the corresponding .md vault files' YAML front-matter,
# then re-runs build_data.py to regenerate data.js.
#
# Step 1: parse the TSV block from the audit doc
# Step 2: for each node id, locate the markdown file via
#         a recursive walk of folders 00..31 matching
#         either filename stem == id OR a 'slug:' / 'id:' field
#         in the YAML front-matter.
# Step 3: actions:
#   - 'null-out'    -> delete thumbnail/thumb_* keys from YAML
#   - 'refetch'     -> queue node.id into a refetch list that
#                       scripts/fetch_thumbnails.py picks up
#                       (it already has an OVERRIDES pattern;
#                       see project_thumbnail_system memory).
# Step 4: rebuild data.js via scripts/build_data.py
# Step 5: git diff data.js  ->  human review  ->  commit
```

**Heuristics' false-positive rate** — the `extract-mismatch` category has the highest FP risk because:

- transliterated names (e.g. `Qoheleth` vs `Ecclesiastes`)
- alias-titled Wikipedia pages
- pages whose summary leads with context, not the topic

John should sample-spot ~10 from each category before any bulk-fix runs. The tech / brand / politics / sports / placeholder categories are nearly all true positives.

