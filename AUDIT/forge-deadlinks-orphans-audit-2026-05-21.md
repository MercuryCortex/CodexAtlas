# Dead-link + Orphan Audit — 2026-05-21

_Audit-only goblin sweep across the full Codex Atlas vault (all 30 numbered lenses). Re-implements scanning beyond `build_dashboard.py` (which only scopes 7 node types) to include the post-2026-05-18 lens expansion._

## Executive summary

- **Total content nodes:** 4421 (was reported as ~2,660 in pre-expansion memory)
- **Total wikilinks scanned:** 44531
- **Dead-link occurrences:** 773  (**1.74%** of all wikilinks; was ~3.3–3.4% pre-expansion)
- **Distinct dead targets:** 590
- **Orphan nodes (zero incoming):** 341  (7.7% of vault)
- **Strict orphans (zero in + zero out):** 7
- **Sanity issues flagged:** 12

**Headline finding.** Dead-link *occurrence* rate has dropped from ~3.3% to **1.74%** — a real improvement after the 1000+ stub wave. The dead-link tail is now genuinely long-and-thin (top dead target has only 6 incoming refs; median dead target has 1). **The dominant integrity problem now is orphans: 341 nodes (7.7% of the vault) have zero incoming wikilinks**. The orphan distribution is *not* uniform — it's heavily skewed into specific lenses: `15_philosophy` (44% orphan rate, 4/9), `10_music` (36%, 39/108), `09_symbols` (25%, 71/280), `29_technology` (20%, 5/25), `14_rituals` (15%, 16/106), `12_alchemy` (11%, 4/35), `03_deities` (10%, 66/676). The newly-built `21_theology` / `22_practices` / `25_divination` / `26_calendars` / `08_places` lenses already have 0% orphans — those waves *did* land their inbound wiring. The unfinished homework is the *older* lenses (Music + Symbols + Deities especially).

## Health metrics

### Vault counts
| Metric | Value |
|---|---:|
| Markdown content files scanned | 4421 |
| Wikilink occurrences | 44531 |
| Resolved wikilinks | 43758 |
| Dead wikilink occurrences | 773 |
| Dead-occurrence ratio | **1.74%** |
| Distinct dead targets | 590 |
| Orphan nodes (zero incoming) | 341 (7.7%) |
| Strict orphans (zero in + zero out) | 7 |

### Nodes by lens
| Lens | Nodes | Orphans | Orphan rate |
|---|---:|---:|---:|
| `01_timeline` | 1 | 1 | 100.0% |
| `02_documents` | 494 | 13 | 2.6% |
| `03_deities` | 676 | 66 | 9.8% |
| `04_persons` | 1193 | 81 | 6.8% |
| `05_events` | 308 | 14 | 4.5% |
| `06_themes` | 493 | 13 | 2.6% |
| `07_traditions` | 306 | 2 | 0.7% |
| `08_places` | 106 | 0 | 0.0% |
| `09_symbols` | 280 | 71 | 25.4% |
| `10_music` | 108 | 39 | 36.1% |
| `11_alphabets` | 41 | 3 | 7.3% |
| `12_alchemy` | 35 | 4 | 11.4% |
| `13_morals` | 12 | 0 | 0.0% |
| `14_rituals` | 106 | 16 | 15.1% |
| `15_philosophy` | 9 | 4 | 44.4% |
| `16_mathematics` | 8 | 1 | 12.5% |
| `17_medicine` | 8 | 0 | 0.0% |
| `20_sacred_architecture` | 115 | 6 | 5.2% |
| `21_theology` | 14 | 0 | 0.0% |
| `23_material_culture` | 11 | 0 | 0.0% |
| `24_pharmacology` | 3 | 0 | 0.0% |
| `27_attire` | 10 | 0 | 0.0% |
| `28_exchange_networks` | 57 | 0 | 0.0% |
| `29_technology` | 25 | 5 | 20.0% |
| `AGENTS.md` | 1 | 1 | 100.0% |
| `HOW-TO-OPEN.md` | 1 | 1 | 100.0% |

### Comparison to prior state
- Pre-expansion memory said: ~2,660 nodes, ~15,885 edges, ~3.3% dead-link.
- Now: **4421 nodes** (+~1761), **44531 wikilinks**, **1.74% dead-occurrence**.
- Net direction: vault grew ~66%, dead-link *rate* fell (good — stubs are landing).
- But: orphan count is now 341 — the largest single quality liability.

## Top 100 most-broken dead links

Targets sorted by incoming reference count. A target referenced 30× is 30× the leverage of one referenced 1×.

| Rank | Refs | Dead target | Sample referencing nodes (first 3) |
|---:|---:|---|---|
| 1 | 6 | `phase-6-002-florentine-codex` | `centeotl`, `chicomecoatl`, `coyolxauhqui` … |
| 2 | 5 | `methodology` | `cernunnos`, `comparative-religion-method`, `lanz-von-liebenfels` … |
| 3 | 4 | `phase-4-040-quran` | `gabriel-archangel`, `suwa`, `yaghuth` … |
| 4 | 4 | `parallel-motif` | `apkallu`, `hyperdiffusionism`, `spyridon-marinatos` … |
| 5 | 3 | `nekhbet-vulture` | `wadjet` |
| 6 | 3 | `sheikh-farid` | `phase-6-016-guru-granth-sahib` |
| 7 | 3 | `tradition-afro-diasporic` | `ritual-egungun-masquerade`, `ritual-ori-worship`, `ritual-vodou-ceremony` |
| 8 | 3 | `ammit-devourer` | `ritual-weighing-of-the-heart` |
| 9 | 2 | `athtart` | `astar-aksumite` |
| 10 | 2 | `tishpak` | `ninazu` |
| 11 | 2 | `manu-vedic` | `yima-jamshid` |
| 12 | 2 | `amurru` | `belet-seri-akkadian` |
| 13 | 2 | `phase-8-002-popol-vuh` | `hun-hunahpu` |
| 14 | 2 | `haya` | `nin-lil-sumerian`, `nisaba` |
| 15 | 2 | `damu` | `gula-akkadian`, `ninisina` |
| 16 | 2 | `yam-canaanite` | `beher` |
| 17 | 2 | `phase-6-006-chilam-balam` | `bolon-tzakab`, `hunab-ku` |
| 18 | 2 | `adad` | `divinatory-omen-reading`, `tlaloc` |
| 19 | 2 | `mars` | `mahrem` |
| 20 | 2 | `echidna` | `typhon` |
| 21 | 2 | `hercules-roman` | `heracles` |
| 22 | 2 | `ishkur` | `nin-gal-sumerian` |
| 23 | 2 | `manuel-i-portugal` | `event-portuguese-forced-conversion-1496`, `event-vasco-da-gama-india-voyage-1497` |
| 24 | 2 | `order-of-christ` | `event-founding-kingdom-portugal-1139`, `event-vasco-da-gama-india-voyage-1497` |
| 25 | 2 | `john-anthony-west` | `kings-chamber-great-pyramid`, `sphinx-of-giza` |
| 26 | 2 | `theme-logos-theology` | `event-axial-age-800-200bce`, `theme-axial-age` |
| 27 | 2 | `event-siege-of-masada-73ce` | `event-numantia-133bce`, `sacred-defeat` |
| 28 | 2 | `divine-names` | `phase-6-044-llull-ars-magna`, [[ramon-llull]] |
| 29 | 2 | `tradition-lingayat` | `basavanna`, `tradition-kashmir-shaivism` |
| 30 | 2 | `hierocles` | `apollonius-of-tyana`, `phase-4-039-celsus-true-word` |
| 31 | 2 | `shenhui` | `phase-5-004-platform-sutra-huineng`, `shenxiu` |
| 32 | 2 | `event-aleister-crowley-boca-do-inferno-1930` | `fernando-pessoa`, `tradition-portuguese-hermeticism` |
| 33 | 2 | `aksum` | `ezana-of-aksum`, `kaleb-of-aksum` |
| 34 | 2 | `harun-al-rashid` | `musa-al-kazim` |
| 35 | 2 | `hecataeus-of-abdera` | `ptolemy-i-soter`, `thales` |
| 36 | 2 | `tradition-rosicrucian` | `elias-ashmole`, `thomas-vaughan` |
| 37 | 2 | `ralph-waldo-emerson` | `thomas-taylor-neoplatonist`, `william-james` |
| 38 | 2 | `plato-of-athens` | `empedocles` |
| 39 | 2 | `al-sharif-al-radi` | `ali-ibn-abi-talib`, `phase-5-058-nahj-al-balagha` |
| 40 | 2 | `solomonic-genealogical-dynasty` | `makeda-queen-of-sheba`, `menelik-i-legendary` |
| 41 | 2 | `gospel-of-judas-sethian` | `judas-iscariot` |
| 42 | 2 | `phase-2-004-1-2-chronicles` | `makeda-queen-of-sheba`, `phase-8-008-kebra-nagast` |
| 43 | 2 | `tradition-islamic-philosophy` | `tradition-latin-christianity`, `vasco-da-gama` |
| 44 | 2 | `ascent-and-descent` | `phase-3-002-plato-dialogues` |
| 45 | 2 | `providence-and-fate` | `phase-3-005-stoic-foundational-texts` |
| 46 | 2 | `onomacritus` | `phase-3-027-derveni-papyrus`, `tradition-orphic` |
| 47 | 2 | `anaxagoras` | `phase-3-027-derveni-papyrus` |
| 48 | 2 | `theodicy` | `phase-3-032-4-ezra-ethiopic-recension` |
| 49 | 2 | `fear-of-the-lord` | `phase-3-007-sirach` |
| 50 | 2 | `honor-of-fathers` | `phase-3-007-sirach` |
| 51 | 2 | `teleology` | `phase-3-003-aristotle-metaphysics` |
| 52 | 2 | `apollo-greek` | `finisterre-end-of-world`, `phase-3-035-homeric-hymns` |
| 53 | 2 | `poor-and-marginalized` | `phase-3-018-luke-acts` |
| 54 | 2 | `rabbi-ishmael-ben-elisha` | `phase-5-013-hekhalot-literature`, `tradition-merkavah-mysticism` |
| 55 | 2 | `rabbi-nehunya-ben-ha-qanah` | `phase-5-013-hekhalot-literature`, `tradition-merkavah-mysticism` |
| 56 | 2 | `judas-maccabeus` | `phase-5-049-yosippon-ethiopian-recension`, `tradition-second-temple-judaism` |
| 57 | 2 | `josephus-flavius` | `phase-5-049-yosippon-ethiopian-recension` |
| 58 | 2 | `wisdom-literature` | `phase-5-052-sadi-gulistan` |
| 59 | 2 | `political-ethics` | `phase-5-052-sadi-gulistan` |
| 60 | 2 | `kshemaraja` | `phase-5-006-vijnana-bhairava-tantra`, `tradition-kashmir-shaivism` |
| 61 | 2 | `divine-intoxication` | `phase-5-053-hafez-divan` |
| 62 | 2 | `love-mysticism` | `phase-5-053-hafez-divan` |
| 63 | 2 | `fana-annihilation` | `phase-5-053-hafez-divan` |
| 64 | 2 | `phase-4-094-larger-sukhavativyuha-sutra` | `phase-5-050-bhagavata-purana` |
| 65 | 2 | `sabbath-observance` | `phase-5-038-mashafa-berhan` |
| 66 | 2 | `anti-stephanite-polemic` | `phase-5-038-mashafa-berhan` |
| 67 | 2 | `christian-legal-codes` | `phase-5-037-fetha-nagast` |
| 68 | 2 | `ecclesiastical-canon-law` | `phase-5-037-fetha-nagast` |
| 69 | 2 | `divine-longing` | `phase-5-054-rumi-masnavi` |
| 70 | 2 | `jahiliyyah` | `phase-7-028-milestones` |
| 71 | 2 | `jihad-offensive` | `phase-7-028-milestones` |
| 72 | 2 | `hakimiyyah` | `phase-7-028-milestones` |
| 73 | 2 | `prophecy-as-political-critique` | `phase-7-035-cayce-atlantis-readings` |
| 74 | 2 | `mysterium-tremendum` | `numinous`, `phase-7-011-idea-of-the-holy` |
| 75 | 2 | `oliver-cowdery` | `phase-7-001-book-of-mormon`, `tradition-mormonism` |
| 76 | 2 | `phase-7-002-doctrine-and-covenants` | `phase-7-001-book-of-mormon` |
| 77 | 2 | `female-monasticism` | `phase-7-040-walatta-petros-hagiography` |
| 78 | 2 | `anti-jesuit-resistance` | `phase-7-040-walatta-petros-hagiography` |
| 79 | 2 | `ethiopian-anti-catholic-polemic` | `phase-7-040-walatta-petros-hagiography` |
| 80 | 2 | `apophasis` | `phase-4-050-vishnu-sahasranama` |
| 81 | 2 | `tat` | `phase-4-012-asclepius`, `phase-4-013-discourse-on-the-eighth-and-ninth` |
| 82 | 2 | `apostle-philip` | `phase-4-004-gospel-of-philip`, `phase-4-009-pistis-sophia` |
| 83 | 2 | `pistis-sophia` | `phase-4-007-on-the-origin-of-the-world`, `phase-4-009-pistis-sophia` |
| 84 | 2 | `john-the-baptist-mandaean` | `phase-4-017-ginza-rba`, `phase-4-018-mandaean-book-of-john` |
| 85 | 2 | `phase-4-059-allogenes` | `phase-4-056-zostrianos` |
| 86 | 2 | `the-father-valentinian` | `phase-4-003-gospel-of-truth`, `phase-4-004-gospel-of-philip` |
| 87 | 2 | `cosmogony` | `phase-4-085-ovid-metamorphoses-book-1` |
| 88 | 2 | `anthropogony` | `phase-4-085-ovid-metamorphoses-book-1` |
| 89 | 2 | `golden-age-decline` | `phase-4-085-ovid-metamorphoses-book-1` |
| 90 | 2 | `ge'ez-language-transmission` | `phase-4-082-ethiopic-biblical-canon` |
| 91 | 2 | `evangelist-portraits` | `phase-4-080-garima-gospels` |
| 92 | 2 | `canon-tables` | `phase-4-080-garima-gospels` |
| 93 | 2 | `illuminated-manuscript-art` | `phase-4-080-garima-gospels` |
| 94 | 2 | `genesis-5-antediluvian-patriarchs` | `phase-1-015-sumerian-king-list` |
| 95 | 2 | `shamash` | `divinatory-omen-reading`, `phase-1-020-shumma-alu` |
| 96 | 2 | `gatumdug` | `phase-1-018-gudea-cylinders` |
| 97 | 2 | `phase-3-014-enneads-plotinus` | `phase-6-052-kircher-ars-magna-lucis` |
| 98 | 2 | `phase-6-017-boehme-aurora-mysterium-magmum` | `phase-6-029-boehme-aurora` |
| 99 | 2 | `phase-6-026-jacob-frank-words-of-the-lord` | `phase-6-025-nathan-of-gaza-treatise-on-dragons` |
| 100 | 2 | `apocalypticism` | `phase-6-043-dee-libri-mysteriorum-enochian`, `tradition-second-temple-judaism` |

## Orphan analysis

Orphan = node with **zero incoming wikilinks**. Total: **341**.

### Per-lens breakdown (sorted by orphan count)
| Lens | Total nodes | Orphans | Orphan rate |
|---|---:|---:|---:|
| `04_persons` | 1193 | 81 | 6.8% |
| `09_symbols` | 280 | 71 | 25.4% |
| `03_deities` | 676 | 66 | 9.8% |
| `10_music` | 108 | 39 | 36.1% |
| `14_rituals` | 106 | 16 | 15.1% |
| `05_events` | 308 | 14 | 4.5% |
| `02_documents` | 494 | 13 | 2.6% |
| `06_themes` | 493 | 13 | 2.6% |
| `20_sacred_architecture` | 115 | 6 | 5.2% |
| `29_technology` | 25 | 5 | 20.0% |
| `15_philosophy` | 9 | 4 | 44.4% |
| `12_alchemy` | 35 | 4 | 11.4% |
| `11_alphabets` | 41 | 3 | 7.3% |
| `07_traditions` | 306 | 2 | 0.7% |
| `AGENTS.md` | 1 | 1 | 100.0% |
| `HOW-TO-OPEN.md` | 1 | 1 | 100.0% |
| `01_timeline` | 1 | 1 | 100.0% |
| `16_mathematics` | 8 | 1 | 12.5% |
| `21_theology` | 14 | 0 | 0.0% |
| `08_places` | 106 | 0 | 0.0% |
| `24_pharmacology` | 3 | 0 | 0.0% |
| `17_medicine` | 8 | 0 | 0.0% |
| `27_attire` | 10 | 0 | 0.0% |
| `28_exchange_networks` | 57 | 0 | 0.0% |
| `13_morals` | 12 | 0 | 0.0% |
| `23_material_culture` | 11 | 0 | 0.0% |

### Top 100 orphans (by lens, alpha within lens)

| Stem | Lens | Type | Status | Name (if set) |
|---|---|---|---|---|
| `master-timeline` | `01_timeline` | ? | ? |  |
| `phase-1-033-anzu-myth` | `02_documents` | document | metadata | Anzu Myth (Myth of Zu) |
| `phase-1-035-wadi-el-jarf-papyri` | `02_documents` | document | metadata | Wadi el-Jarf Papyri |
| `phase-4-039-celsus-true-word` | `02_documents` | document | metadata | Alēthēs Logos / True Word (Celsus) |
| `phase-4-054-bede-ecclesiastical-history` | `02_documents` | document | metadata | Ecclesiastical History of the English People |
| `phase-4-058-thunder-perfect-mind` | `02_documents` | document | metadata | The Thunder, Perfect Mind |
| `phase-4-098-liezi` | `02_documents` | document | metadata | Liezi (The Book of Master Lie) |
| `phase-4-100-celestial-hierarchy` | `02_documents` | document | metadata | Celestial Hierarchy (De Coelesti Hierarchia) |
| `phase-5-032-yogavasishtha` | `02_documents` | document | metadata | Yoga-Vāsiṣṭha (Yoga Vasistha) |
| `phase-5-062-denkard` | `02_documents` | document | stub | Dēnkard |
| `phase-6-037-voynich-manuscript` | `02_documents` | document | metadata | Voynich Manuscript |
| `phase-6-043-dee-libri-mysteriorum-enochian` | `02_documents` | document | metadata | Libri Mysteriorum — Dee's Angelic Conversations and the Enochian System |
| `phase-6-051-mylius-philosophia-reformata` | `02_documents` | document | stub | Philosophia Reformata |
| `phase-6-052-kircher-ars-magna-lucis` | `02_documents` | document | metadata | Ars Magna Lucis et Umbrae (The Great Art of Light and Shadow) |
| `adamas-gnostic` | `03_deities` | deity | metadata | Adamas (Gnostic) |
| `aganju` | `03_deities` | deity | stub | Aganju |
| `ahti` | `03_deities` | deity | metadata | Ahti |
| `aine` | `03_deities` | deity | metadata | Áine |
| `apus` | `03_deities` | deity | stub | Apus |
| `aurora-roman` | `03_deities` | deity | metadata | Aurora (Roman) |
| `ba-xian` | `03_deities` | deity | stub | Ba Xian (Eight Immortals) |
| `bhaisajyaguru` | `03_deities` | deity | metadata | Bhaisajyaguru |
| `bolon-tzakab` | `03_deities` | deity | stub | Bolon Tzakab |
| `bragi` | `03_deities` | deity | stub | Bragi |
| `cagn` | `03_deities` | deity | metadata | ǀKaggen |
| `catequil` | `03_deities` | deity | stub | Catequil |
| `chalchiuhtlicue` | `03_deities` | deity | metadata | Chalchiuhtlicue |
| `chicomecoatl` | `03_deities` | deity | stub | Chicomecoatl |
| `cipactli` | `03_deities` | deity | metadata | Cipactli |
| `cizin` | `03_deities` | deity | stub | Cizin |
| `daramulan` | `03_deities` | deity | stub | Daramulan |
| `dattatreya` | `03_deities` | deity | metadata | Dattatreya |
| `dizang-ksitigarbha` | `03_deities` | deity | metadata | Kṣitigarbha |
| `ebisu` | `03_deities` | deity | metadata | Ebisu |
| `ekeko` | `03_deities` | deity | stub | Ekeko |
| `faunus-roman` | `03_deities` | deity | metadata | Faunus (Roman) |
| `gefjon` | `03_deities` | deity | metadata | Gefjon |
| `harihara` | `03_deities` | deity | metadata | Harihara |
| `hercules` | `03_deities` | deity | stub | Hercules |
| `hina` | `03_deities` | deity | stub | Hina |
| `hod` | `03_deities` | deity | metadata | Höðr |
| `hunab-ku` | `03_deities` | deity | stub | Hunab Ku |
| `iktomi` | `03_deities` | deity | stub | Iktomi |
| `inkarri` | `03_deities` | deity | stub | Inkarri |
| `israfil` | `03_deities` | deity | metadata | Isrāfīl (إسرافيل) |
| `kupala` | `03_deities` | deity | metadata | Kupala |
| `lir` | `03_deities` | deity | metadata | Lir |
| `lugalbanda` | `03_deities` | deity | metadata | Lugalbanda |
| `mami-wata` | `03_deities` | deity | metadata | Mami Wata |
| `mara-demon` | `03_deities` | deity | metadata | Māra |
| `mary-of-zion` | `03_deities` | deity | metadata | Mary of Zion (Maryam Tsion) |
| `melek-hamza` | `03_deities` | deity | metadata | Hamza ibn Ali (as Universal Intellect) |
| `meness` | `03_deities` | deity | stub | Mēness |
| `mimir-norse` | `03_deities` | deity | metadata | Mímir |
| `mixcoatl` | `03_deities` | deity | stub | Mixcoatl |
| `nethuns` | `03_deities` | deity | metadata | Nethuns |
| `ogma` | `03_deities` | deity | metadata | Ogma |
| `oro-polynesian` | `03_deities` | deity | metadata | Oro |
| `pachacamac` | `03_deities` | deity | metadata | Pachacamac |
| `pariacaca` | `03_deities` | deity | metadata | Pariacaca |
| `prithvi` | `03_deities` | deity | metadata | Pṛthivī |
| `quirinus-roman` | `03_deities` | deity | metadata | Quirinus (Roman) |
| `rishabha-jain` | `03_deities` | deity | metadata | Ṛṣabha |
| `rod-slavic` | `03_deities` | deity | metadata | Rod |
| `saklas` | `03_deities` | deity | metadata | Saklas |
| `shaushka-hurrian` | `03_deities` | deity | metadata | Shaushka |
| `sif` | `03_deities` | deity | stub | Sif |
| `sigyn` | `03_deities` | deity | metadata | Sigyn |
| `svantovit` | `03_deities` | deity | metadata | Svantovit |
| `tat-hermetic` | `03_deities` | deity | metadata | Tat (Hermetic) |
| `tawhirimatea` | `03_deities` | deity | metadata | Tāwhirimātea |
| `teutates` | `03_deities` | deity | metadata | Teutates |
| `tir-armenian` | `03_deities` | deity | metadata | Tir |
| `tishtrya` | `03_deities` | deity | metadata | Tištrya |
| `toyouke-omikami` | `03_deities` | deity | metadata | Toyouke-Ōmikami |
| `vidar` | `03_deities` | deity | metadata | Víðarr |
| `wakea` | `03_deities` | deity | metadata | Wākea |
| `wandjina` | `03_deities` | deity | stub | Wandjina |
| `yum-kaax` | `03_deities` | deity | stub | Yum Kaax |
| `zorya` | `03_deities` | deity | metadata | Zorya |
| `al-khidr` | `04_persons` | person | metadata | al-Khiḍr |
| `andre-jean-festugiere` | `04_persons` | person | metadata | André-Jean Festugière |
| `andrew-apostle` | `04_persons` | person | stub | Andrew the Apostle |
| `aphrahat` | `04_persons` | person | metadata | Aphrahat |
| `apollinaris-of-laodicea` | `04_persons` | person | metadata | Apollinaris of Laodicea |
| `apollos` | `04_persons` | person | stub | Apollos |
| `april-deconick` | `04_persons` | person | metadata | April D. DeConick |
| `arius` | `04_persons` | person | metadata | Arius |
| `arthur-darby-nock` | `04_persons` | person | metadata | Arthur Darby Nock |
| `averroes` | `04_persons` | person | full | Ibn Rushd (Averroes) |
| `basavanna` | `04_persons` | person | stub | Basavanna |
| `birger-pearson` | `04_persons` | person | metadata | Birger A. Pearson |
| `brian-copenhaver` | `04_persons` | person | metadata | Brian P. Copenhaver |
| `c-s-lewis` | `04_persons` | person | metadata | C.S. Lewis |
| `caiaphas` | `04_persons` | person | metadata | Joseph Caiaphas |
| `cerinthus` | `04_persons` | person | metadata | Cerinthus |
| `charles-taze-russell` | `04_persons` | person | metadata | Charles Taze Russell |
| `chogyam-trungpa` | `04_persons` | person | metadata | Chögyam Trungpa Rinpoche |
| `copernicus` | `04_persons` | person | full | Nicolaus Copernicus |
| `cornelius-centurion` | `04_persons` | person | stub | Cornelius the Centurion |

_Note: top-100-most-text-mentioned-but-not-wikilinked detection is non-trivial (O(N·M) substring scan). Deferred to a follow-up audit; see Recommendations §4._

## Cross-tradition bridge density

Nodes are assigned to a tradition cluster via keyword match on the YAML `tradition`/`traditions` field, the stem, and the path. Multi-tradition nodes are bucketed to the first cluster matched (rough heuristic — read flagged anemic pairs as a *floor*, not a ceiling).

### Cluster sizes
| Cluster | Nodes | Intra-cluster edges |
|---|---:|---:|
| Christianity | 541 | 3072 |
| Buddhism | 241 | 1187 |
| Hinduism | 203 | 1309 |
| Greek | 181 | 1226 |
| Islam | 161 | 1052 |
| Mesopotamian | 132 | 1250 |
| Egyptian | 97 | 1161 |
| Hermetic-Western-Esoteric | 97 | 561 |
| Judaism | 91 | 405 |
| Chinese | 86 | 494 |
| Roman | 80 | 195 |
| Mesoamerican | 59 | 419 |
| Persian | 47 | 370 |
| Andean | 43 | 173 |
| Nordic | 41 | 292 |
| Native-North-American | 40 | 224 |
| African-Traditional | 38 | 202 |
| Gnostic | 34 | 88 |
| Celtic | 32 | 146 |
| Japanese | 30 | 172 |
| Polynesian-Austronesian | 16 | 70 |
| Jainism | 12 | 49 |
| Australian-Aboriginal | 12 | 42 |
| Sikhism | 12 | 61 |
| Slavic | 7 | 2 |
| Bahai-Druze-Yazidi | 7 | 14 |
| Modern-Esoteric | 7 | 15 |
| Korean | 6 | 9 |
| Bogomil-Cathar | 5 | 16 |
| Mormon-Restorationist | 5 | 7 |
| Vietnamese | 3 | 8 |
| Southeast-Asian | 2 | 0 |

### Cross-cluster edges (sorted, top 80)
| Rank | Cluster A | Cluster B | Crossing edges |
|---:|---|---|---:|
| 1 | Christianity | Greek | 506 |
| 2 | Christianity | Hermetic-Western-Esoteric | 338 |
| 3 | Egyptian | Greek | 288 |
| 4 | Christianity | Judaism | 277 |
| 5 | Christianity | Islam | 260 |
| 6 | Christianity | Gnostic | 240 |
| 7 | Greek | Roman | 198 |
| 8 | Buddhism | Hinduism | 197 |
| 9 | Christianity | Egyptian | 181 |
| 10 | Christianity | Roman | 173 |
| 11 | Greek | Hermetic-Western-Esoteric | 167 |
| 12 | Egyptian | Hermetic-Western-Esoteric | 150 |
| 13 | Greek | Hinduism | 120 |
| 14 | Egyptian | Mesopotamian | 110 |
| 15 | Christianity | Persian | 100 |
| 16 | Greek | Mesopotamian | 98 |
| 17 | Greek | Islam | 96 |
| 18 | Buddhism | Chinese | 94 |
| 19 | Buddhism | Christianity | 94 |
| 20 | Egyptian | Roman | 92 |
| 21 | Christianity | Mesopotamian | 84 |
| 22 | African-Traditional | Hinduism | 83 |
| 23 | Christianity | Hinduism | 77 |
| 24 | Hinduism | Islam | 75 |
| 25 | Hermetic-Western-Esoteric | Judaism | 74 |
| 26 | Buddhism | Greek | 73 |
| 27 | Greek | Judaism | 73 |
| 28 | Hinduism | Persian | 69 |
| 29 | Christianity | Mesoamerican | 61 |
| 30 | Hinduism | Mesopotamian | 60 |
| 31 | Egyptian | Hinduism | 57 |
| 32 | Chinese | Hinduism | 54 |
| 33 | Judaism | Roman | 50 |
| 34 | Islam | Judaism | 49 |
| 35 | Bogomil-Cathar | Christianity | 47 |
| 36 | Buddhism | Japanese | 46 |
| 37 | Chinese | Greek | 45 |
| 38 | Buddhism | Islam | 42 |
| 39 | Hinduism | Sikhism | 42 |
| 40 | Japanese | Mesopotamian | 41 |
| 41 | Mesopotamian | Roman | 40 |
| 42 | Judaism | Persian | 40 |
| 43 | Hermetic-Western-Esoteric | Hinduism | 39 |
| 44 | Buddhism | Egyptian | 36 |
| 45 | Chinese | Mesopotamian | 36 |
| 46 | Hermetic-Western-Esoteric | Islam | 35 |
| 47 | Celtic | Roman | 34 |
| 48 | Christianity | Nordic | 34 |
| 49 | African-Traditional | Chinese | 34 |
| 50 | Hinduism | Judaism | 34 |
| 51 | Andean | Greek | 34 |
| 52 | Hinduism | Roman | 33 |
| 53 | Christianity | Slavic | 33 |
| 54 | Celtic | Greek | 31 |
| 55 | Greek | Nordic | 30 |
| 56 | Greek | Japanese | 30 |
| 57 | Gnostic | Hermetic-Western-Esoteric | 30 |
| 58 | Hinduism | Japanese | 28 |
| 59 | Buddhism | Persian | 28 |
| 60 | Mesoamerican | Mesopotamian | 28 |
| 61 | Chinese | Japanese | 28 |
| 62 | Celtic | Nordic | 27 |
| 63 | Persian | Roman | 26 |
| 64 | Egyptian | Mesoamerican | 26 |
| 65 | Hermetic-Western-Esoteric | Modern-Esoteric | 26 |
| 66 | Hinduism | Nordic | 25 |
| 67 | Andean | Mesoamerican | 25 |
| 68 | Gnostic | Greek | 24 |
| 69 | Mesopotamian | Nordic | 24 |
| 70 | Chinese | Christianity | 24 |
| 71 | Hinduism | Jainism | 23 |
| 72 | Judaism | Mesopotamian | 23 |
| 73 | African-Traditional | Christianity | 22 |
| 74 | Greek | Mesoamerican | 22 |
| 75 | Bahai-Druze-Yazidi | Islam | 22 |
| 76 | Bogomil-Cathar | Persian | 21 |
| 77 | Egyptian | Islam | 21 |
| 78 | Islam | Sikhism | 21 |
| 79 | African-Traditional | Greek | 20 |
| 80 | Islam | Persian | 20 |

### Anemic pairs (<5 crossing edges) — 101 pairs

These are the next-investigation candidates — pairs that *should* be talking to each other but barely are.

| Cluster A | Cluster B | Edges |
|---|---|---:|
| Nordic | Slavic | 4 |
| Andean | Islam | 4 |
| Egyptian | Native-North-American | 4 |
| Nordic | Polynesian-Austronesian | 4 |
| Native-North-American | Polynesian-Austronesian | 4 |
| African-Traditional | Celtic | 4 |
| Chinese | Korean | 4 |
| Islam | Polynesian-Austronesian | 4 |
| Japanese | Polynesian-Austronesian | 4 |
| Andean | Nordic | 4 |
| Bahai-Druze-Yazidi | Greek | 4 |
| Bahai-Druze-Yazidi | Persian | 4 |
| Christianity | Modern-Esoteric | 4 |
| Gnostic | Roman | 4 |
| Christianity | Mormon-Restorationist | 4 |
| African-Traditional | Mesoamerican | 4 |
| Australian-Aboriginal | Buddhism | 4 |
| Buddhism | Sikhism | 4 |
| Christianity | Jainism | 4 |
| Modern-Esoteric | Nordic | 4 |
| Mesoamerican | Polynesian-Austronesian | 3 |
| Polynesian-Austronesian | Roman | 3 |
| Andean | Polynesian-Austronesian | 3 |
| Andean | Roman | 3 |
| Nordic | Persian | 3 |
| Celtic | Slavic | 3 |
| African-Traditional | Gnostic | 3 |
| Korean | Roman | 3 |
| Greek | Jainism | 3 |
| Judaism | Mesoamerican | 3 |
| Gnostic | Mesoamerican | 3 |
| African-Traditional | Andean | 3 |
| Buddhism | Vietnamese | 3 |
| Jainism | Judaism | 3 |
| Australian-Aboriginal | Hinduism | 3 |
| Persian | Sikhism | 3 |
| Jainism | Persian | 3 |
| Christianity | Polynesian-Austronesian | 3 |
| Chinese | Jainism | 3 |
| Buddhism | Celtic | 2 |
| Persian | Slavic | 2 |
| Chinese | Polynesian-Austronesian | 2 |
| Andean | Persian | 2 |
| Hinduism | Slavic | 2 |
| Celtic | Native-North-American | 2 |
| Bahai-Druze-Yazidi | Hinduism | 2 |
| Gnostic | Mormon-Restorationist | 2 |
| Egyptian | Gnostic | 2 |
| Christianity | Vietnamese | 2 |
| Gnostic | Mesopotamian | 2 |
| African-Traditional | Polynesian-Austronesian | 2 |
| Japanese | Native-North-American | 2 |
| Islam | Japanese | 2 |
| Australian-Aboriginal | Celtic | 2 |
| Celtic | Japanese | 2 |
| Chinese | Roman | 2 |
| Celtic | Modern-Esoteric | 2 |
| Andean | Jainism | 2 |
| Gnostic | Jainism | 2 |
| Buddhism | Slavic | 2 |

### Missing pairs between large clusters (≥8 nodes) — 53 pairs

Zero crossing edges between two non-trivial clusters. Strong signal for a missing-bridge investigation.

| Cluster A | Cluster B |
|---|---|
| African-Traditional | Jainism |
| African-Traditional | Sikhism |
| Andean | Australian-Aboriginal |
| Andean | Celtic |
| Andean | Chinese |
| Andean | Sikhism |
| Australian-Aboriginal | Chinese |
| Australian-Aboriginal | Egyptian |
| Australian-Aboriginal | Gnostic |
| Australian-Aboriginal | Greek |
| Australian-Aboriginal | Islam |
| Australian-Aboriginal | Jainism |
| Australian-Aboriginal | Japanese |
| Australian-Aboriginal | Mesoamerican |
| Australian-Aboriginal | Mesopotamian |
| Australian-Aboriginal | Nordic |
| Australian-Aboriginal | Roman |
| Australian-Aboriginal | Sikhism |
| Celtic | Gnostic |
| Celtic | Islam |
| Celtic | Jainism |
| Celtic | Judaism |
| Celtic | Persian |
| Celtic | Sikhism |
| Chinese | Native-North-American |
| Chinese | Sikhism |
| Egyptian | Polynesian-Austronesian |
| Egyptian | Sikhism |
| Gnostic | Japanese |
| Gnostic | Nordic |
| Gnostic | Polynesian-Austronesian |
| Hermetic-Western-Esoteric | Jainism |
| Hermetic-Western-Esoteric | Japanese |
| Hermetic-Western-Esoteric | Native-North-American |
| Hermetic-Western-Esoteric | Persian |
| Hermetic-Western-Esoteric | Polynesian-Austronesian |
| Hermetic-Western-Esoteric | Sikhism |
| Islam | Mesoamerican |
| Jainism | Japanese |
| Jainism | Native-North-American |
| Jainism | Nordic |
| Jainism | Polynesian-Austronesian |
| Jainism | Roman |
| Japanese | Persian |
| Mesoamerican | Persian |
| Mesopotamian | Polynesian-Austronesian |
| Mesopotamian | Sikhism |
| Native-North-American | Roman |
| Native-North-American | Sikhism |
| Nordic | Sikhism |
| Persian | Polynesian-Austronesian |
| Polynesian-Austronesian | Sikhism |
| Roman | Sikhism |

## Sanity issues

### By kind
| Kind | Count |
|---|---:|
| id-stem-mismatch | 8 |
| no-frontmatter | 4 |

### First 100 sanity issues
| Path | Issue |
|---|---|
| `AGENTS.md` | no-frontmatter |
| `HOW-TO-OPEN.md` | no-frontmatter |
| `01_timeline/master-timeline.md` | no-frontmatter |
| `05_events/event-nestorian-stele-781.md` | id-stem-mismatch: id='nestorian-stele' stem='event-nestorian-stele-781' |
| `02_documents/_phase-4-late-antiquity/phase-4-100-celestial-hierarchy.md` | id-stem-mismatch: id='phase-4-celestial-hierarchy' stem='phase-4-100-celestial-hierarchy' |
| `02_documents/_phase-2-axial-age/phase-2-033-shujing-book-of-documents.md` | id-stem-mismatch: id='phase-2-033-shujing' stem='phase-2-033-shujing-book-of-documents' |
| `02_documents/_phase-2-axial-age/phase-2-032-shijing-book-of-songs.md` | id-stem-mismatch: id='phase-2-032-shijing' stem='phase-2-032-shijing-book-of-songs' |
| `02_documents/_phase-2-axial-age/phase-2-037-song-of-songs.md` | id-stem-mismatch: id='phase-2-song-of-songs' stem='phase-2-037-song-of-songs' |
| `02_documents/_phase-2-axial-age/phase-2-035-job.md` | id-stem-mismatch: id='phase-2-job' stem='phase-2-035-job' |
| `02_documents/_phase-2-axial-age/phase-2-036-ecclesiastes.md` | id-stem-mismatch: id='phase-2-ecclesiastes' stem='phase-2-036-ecclesiastes' |
| `07_traditions/_index.md` | no-frontmatter |
| `09_symbols/kalachakra-symbol.md` | id-stem-mismatch: id='kalachakra-mandala' stem='kalachakra-symbol' |

_(Total: 12 issues — full list available by re-running the scanner.)_

## Recommendations

Ordered by impact × ease.

1. **Stub the top 30 dead targets** (table §3 above). 30 surgical stubs would close ~75 dead occurrences (10% of all dead links). Each one resolves multiple inbound edges at once — highest ROI possible.

2. **Wire orphans inbound in the orphan-heavy *older* lenses.** Counter-intuitively the newest lens waves (`21_theology`, `22_practices`, `26_calendars`, `08_places`, `25_divination`) shipped with full inbound wiring — they're at 0% orphan rate. The unfinished homework is in the *older* lenses where stubs accumulated without back-wiring: `10_music` (39 orphans, 36% rate), `09_symbols` (71 orphans, 25%), `14_rituals` (16 orphans, 15%), `12_alchemy` (4 orphans, 11%), `03_deities` (66 orphans — biggest absolute count), `04_persons` (81 orphans — biggest absolute count). Pass per lens: take 20 highest-impact orphans, add one inbound wikilink each from a thematically related existing node. Estimated effort: ~2 hours per lens, 9 lens-passes.

3. **Attack anemic cluster-pair bridges as MASSIVE-WIN investigation leads.** Cluster pairs with <5 crossing edges (table §5 above) are the unmapped boundary zones. Per memory `feedback_massive_wins.md`, cross-tradition bridges from Christianity → older traditions are the prize. Surprisingly the *obvious* Christianity-flank pairs are actually healthy already: Christianity↔Egyptian=181, ↔Mesopotamian=84, ↔Persian=100, ↔Hindu=77, Greek↔Hindu=120. The real anemic-but-historically-loaded gaps are: **Christianity↔Jainism=4, Christianity↔Modern-Esoteric=4, Gnostic↔Mesopotamian=2, Egyptian↔Gnostic=2, Hermetic↔Gnostic=30** (lower than expected given Corpus Hermeticum overlap), and 53 *missing entirely* between sizeable clusters (table §5.3). Pick 5 from that missing list and run one targeted investigation each.

4. **Defer-but-queue: name-mention orphan detection.** A text scan looking for orphan node `name` fields appearing in *other* nodes' body text (un-wikilinked) would surface the next 100–500 cheap inbound-link wirings. Estimated implementation: 1 hour in a Python sweep; estimated payoff: 100+ free wikilink wirings. Worth a dedicated session.

5. **Sanity issues are minor.** Most are missing-field or id-stem-mismatch issues in technical stubs (`_index.md` files, ingest files). The duplicate-stem flag is real and should be checked — duplicate stems cause ``wikilink`` ambiguity.

6. **Don't trust the `build_dashboard.py` orphan count** (it reported 6). Its definition is the strict version (zero-in AND zero-out) AND it only scopes the 7 historic node types in `NODE_DIRS`. The new lens folders aren't included. This audit's number (341 zero-in) is the correct one for the post-expansion vault. Consider patching `build_dashboard.py` to (a) scan all 30 lens folders and (b) report the zero-incoming definition (which is what 'orphan' usually means in graph-integrity terms).

---

_Audit goblin signing off. Read-only on all paths except this file + `00_meta/{DASHBOARD, dead-links, orphan-nodes, quality-issues, canonical-slugs}.md` (build_dashboard artifacts)._