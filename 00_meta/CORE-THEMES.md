# CORE-THEMES — The hunt-list

> **The agent's lens.** When you absorb a primary text, this is what you scan it for. Every pattern below is a node that already exists in the vault — use its **canonical slug** as a ``wikilink`` rather than creating a duplicate. The density column tells you how much cross-tradition weight the pattern already carries; high-density entries are the load-bearing connectors, low-density ones are emerging hooks that your absorption may strengthen.
>
> **Use this AFTER** reading [`ONTOLOGY.md`](ONTOLOGY.md) (structural — **26 lenses** + 7 edge buckets) and [`PROTOCOL.md`](PROTOCOL.md) (the absorb-and-dissect SOP). This file is the **content-side** lens; it tells you what patterns to LOOK FOR; ONTOLOGY tells you which folder each pattern lives in and which YAML field carries the edge.
>
> **Not exhaustive.** 339 themes, 278 symbols, 105 rituals, 12 morals exist; this file curates the load-bearing ~150. Use [`DASHBOARD.md`](DASHBOARD.md) for the full live state. If you find a pattern in your text that isn't on this list, it's still valid — create or extend the node per `PROTOCOL.md`.
>
> **The edge bucket** column tells you which Pantheon V2 bucket the cross-tradition link lands in. Most themes produce **Parallel** edges (structural resemblance, independent emergence); the strongest produce **Transmission** edges (documented chain — these are the MASSIVE WINs).
>
> **⚠️ Two changes from the 2026-05-18 ontology lock that affect this file:**
> 1. **Pending rename: this file → `CORE-MOTIFS.md`.** The folder `06_themes/` is being renamed to `06_motifs/` (academic accuracy per Stith Thompson; what we call "themes" are motifs in the strict sense). The rename is queued for the next Lane B-free window (atomic with `build_data.py` updates). Until then, **keep using `type: theme` and `themes:` YAML fields** — they will be migrated together.
> 2. **Some entries below would now live in newer lenses if created today.** Doctrinal positions (Christology, Tawhid, Trikāya, Apophatic Theology) → now `21_theology/` with `type: doctrine`. Contemplative practices (dhikr, hesychasm, vipassana, neidan) → now `22_practices/` with `type: practice`. Divinatory systems (Yi Jing, Ifá, Tarot) → now `25_divination/` with `type: divination-system`. Sacred substances (soma, haoma, ayahuasca, mercury) → now `24_pharmacology/` with `type: substance`. **Existing nodes in `06_themes/` that match these categories are NOT being migrated automatically** — they stay where they are. New nodes in those categories should go into the appropriate new lens. Cross-link instead of moving. See `00_meta/ONTOLOGY-RATIONALE-2026-05-18.md` §2 for boundary rationale.

---

## §1 — Themes (`06_themes/`)

### Cosmogonic (how the world began)

| Slug | Look for | Traditions usually carrying it | Edge bucket |
|---|---|---|---|
| `creation-by-word` | Cosmos brought into being by speech / divine utterance | Memphite Theology, Genesis 1, John 1, Vāc / Devī Sūkta, Tao Te Ching, Hermetic Poimandres | Parallel (Transmission for Memphite → Logos chain) |
| `primordial-waters` | Pre-creation watery chaos out of which order emerges | Nun (Egyptian), Tehom (Hebrew), Apsu/Tiamat (Mesopotamian), Pacific cosmogonies, Polynesian Te Kore | Parallel |
| `chaoskampf` | Sky-god slays sea/serpent of chaos to found cosmos | Marduk/Tiamat, Baal/Yam, YHWH/Leviathan, Zeus/Typhon, Indra/Vritra, Thor/Jörmungandr | Parallel |
| `cosmic-egg` | Universe hatches from primordial egg | Hiraṇyagarbha (Vedic), Pangu (Chinese), Orphic Phanes, Egyptian variants | Parallel |
| `world-parent-cosmogony` | Sky-father / Earth-mother separation cosmogony | Greek Ouranos/Gaia, Maori Rangi/Papa, Mesopotamian An/Ki | Parallel |
| `cosmic-body-cosmogony` | Cosmos formed from sacrificed primordial body | Puruṣa Sūkta (Vedic), Tiamat (Babylonian), Pangu (Chinese), Ymir (Norse) | Parallel |
| `earth-diver-creation` | Animal dives into primordial water to bring up earth | Indigenous Americas (Iroquois, Algonquian), Siberian, Hindu Varāha avatar | Parallel |
| `genealogical-cosmogony` | Cosmos formed by divine procreation chains | Hesiod's Theogony, Egyptian Heliopolitan Ennead, Sumerian | Parallel |
| `heliopolis-ennead` | Atum self-generates → Shu/Tefnut → Geb/Nut → Osiris/Isis/Set/Nephthys | Egyptian | (Egyptian-internal) |
| `hermopolitan-ogdoad` | Eight pre-creation deities of chaos and potentiality | Egyptian | (Egyptian-internal) |
| `zep-tepi` | "First time" — Egyptian primordial age of the gods | Egyptian, T4 alternative-Egypt theories | Parallel / Polemic |
| `evolutionary-cosmogony` | Stepwise unfolding cosmogony (vs. instantaneous fiat) | Hindu, Hermetic, Stoic, modern science readings | Parallel |
| `divine-emanation` | Levels of being emanate from a transcendent One | Neoplatonism, Kabbalah (Sefirot), Sufi tajalliyāt, Hindu vyūhas | Transmission (Plotinus → Kabbalah documented) |
| `divine-immanence` | The divine pervades the cosmos as ground / substance | Brahman (Advaita), Spinozan Deus sive Natura, Stoic pneuma, Sufi waḥdat al-wujūd | Parallel |
| `cosmic-cycles` | Universe goes through periodic destructions and renewals | Hindu yugas, Stoic ekpyrosis, Maya long count, Norse Ragnarök | Parallel |
| `ma-at-logos-sophia` | Cosmic order as divine principle (truth/word/wisdom) | Egyptian Ma'at, Greek Logos, Hebrew Ḥokhmah, Sanskrit ṛta | Transmission (Egyptian → Stoic → Logos chain) |

### Eschatological (how it ends)

| Slug | Look for | Traditions | Edge bucket |
|---|---|---|---|
| `afterlife-judgment` | Soul judged after death; weighed / interrogated / sorted | Egyptian Weighing of the Heart, Zoroastrian Chinvat Bridge, Tibetan bardo, Christian Last Judgment | Transmission (Egyptian → Zoroastrian → Jewish → Christian) |
| `apocalyptic-revelation` | End-times revealed to a seer; cosmic battle, restoration | Daniel, 1 Enoch, Revelation, Zoroastrian Bundahišn, Norse Ragnarök | Transmission (Persian → Jewish apocalyptic → Christian) |
| `frashokereti-cosmic-renovation` | Final renovation/purification of the cosmos | Zoroastrian, influences Jewish-Christian eschatology | Transmission |
| `end-times-judgment` | Final divine sorting at history's close | Christian, Islamic, Zoroastrian | Parallel |
| `resurrection-of-the-dead` | Bodily resurrection at end times | Zoroastrian (origin), Pharisaic Judaism, Christianity, Islam | Transmission |
| `psychostasia-soul-weighing` | Soul literally weighed in scales | Egyptian (canonical), echoed Christian Michael-the-weigher | Transmission |
| `cinvat-bridge-judgment` | Bridge of the Separator — narrows to a razor for the wicked | Zoroastrian; influences Mi'rāj, Sirāt, possibly Christian narrow-gate | Transmission |
| `ragnarok-apocalyptic` | Norse end of the gods + cosmic renewal | Norse | Parallel |
| `theme-zoroastrian-afterlife-geography` | Heaven / hell / limbo geography in Zoroastrian sources | Zoroastrian; influences Jewish/Christian/Islamic | Transmission |
| `messianic-future-savior` | Final savior figure ushers in restoration | Jewish meshiach, Christian Parousia, Zoroastrian Saoshyant, Islamic Mahdi, Buddhist Maitreya, Hindu Kalki | Transmission + Parallel |
| `apokatastasis` | Universal restoration — all souls eventually saved | Origen, Gregory of Nyssa, Iranian roots, Stoic ekpyrosis | Transmission |
| `theme-graduated-afterlife` | Tiered post-mortem destinations (purgatory variants) | Catholic, Zoroastrian, Buddhist, Greek (Hades layers) | Parallel |

### Soteriological (how salvation works)

| Slug | Look for | Traditions | Edge bucket |
|---|---|---|---|
| `gnosis-as-salvation` | Salvation via knowledge / recognition of true self | Gnostic Christianity, Hermetism, Advaita Vedanta, Sufi maʿrifa | Transmission (Hermetic → Gnostic) |
| `ascent-of-the-soul` | Soul's return-journey through cosmic levels | Hermetic Poimandres, Mithraic 7 grades, Merkabah, Sufi mi'rāj, Dante | Transmission |
| `katabasis-and-anabasis` | Hero's descent to underworld and return | Gilgamesh, Inanna, Persephone, Orpheus, Christ's harrowing of hell, Jonah | Parallel + Transmission |
| `dying-rising-god` | Deity dies and rises (Frazerian; tempered) | Osiris, Dumuzi, Attis, Adonis, Dionysus, Christ — disputed framing | Parallel (with Disputes note) |
| `soul-immortality` | Soul persists after bodily death | Platonic, Vedic, Egyptian (Ba/Ka), Pythagorean | Parallel (Platonic → Christian chain) |
| `soul-as-spark` | Soul as a spark of divine light trapped in matter | Gnostic, Manichaean, Kabbalistic Nitzotzot, Hermetic | Transmission |
| `bhakti-devotion` | Salvation through loving devotion to personal god | Hindu (Gītā), Sufism, Christian devotional traditions | Parallel |
| `bodhisattva-vow` | Postpone own liberation to save all beings | Mahāyāna Buddhism, possibly echoed in Boddhisattva-like Christian compassion | (Buddhist) |
| `messianism` | Future anointed-one figure restores righteous order | Jewish, Christian, Islamic, Zoroastrian | Transmission |
| `martyrdom-theology` | Death-for-witness as soteriologically efficacious | Christian, Shia (Karbala / Husayn), Maccabean, Bahá'í | Parallel |
| `executed-divine-claimant` | Charismatic figure executed by political authority becomes founding | Jesus, Husayn, Mansur al-Hallaj, Socrates, Báb | Parallel |
| `crucifixion-theology` | Salvific significance of executed-god's death | Christian; echoes in dying-rising god parallels | (Christian-internal + Parallel) |
| `atonement-reinterpreted` | Sacrificial / substitutionary death reframed soteriologically | Christian (Anselm, Calvin, Girard) | (Christian-internal) |
| `justification-by-faith` | Faith as the operative principle of salvation | Pauline, Lutheran, with Buddhist tariki parallels | Parallel |
| `liberation-theology` | Salvation as historical/political liberation | 20th-c. Catholic, Latin American, Black, Dalit | (modern lens) |
| `progressive-revelation` | Truth unfolds across history through successive prophets | Bahá'í, Shia, Islamic, with Christian dispensationalist echoes | Parallel |
| `henosis` / `neoplatonic-henosis` | Mystical union with the One | Plotinus, later Christian/Sufi/Vedantic mysticism | Transmission |
| `fanaa-annihilation` | Annihilation of the ego in God | Sufi; parallels nirvāṇa, henosis, kenōsis | Parallel |

### Theological (the nature of the divine)

| Slug | Look for | Traditions | Edge bucket |
|---|---|---|---|
| `logos-cosmic-reason` | Cosmic rational principle / divine intellect | Heraclitus → Stoic → Philo → John → Justin → Origen | Transmission (THE MASSIVE WIN spine) |
| `logos-philonic` | Philo's Logos as intermediary between God and cosmos | Philo of Alexandria | (in the spine) |
| `logos-johannine` | The Logos became flesh — John's prologue | John, Justin | (in the spine) |
| `hidden-god` | Transcendent God beyond all categories | Apophatic theology, Gnostic alien-god, Sufi al-Bāṭin, Kabbalah Ein Sof, Hindu Nirguṇa Brahman | Parallel (with Transmission inside Christian apophatic) |
| `divine-unity` / `divine-name` | One-ness / unique divine identity | Shema, Tawhīd, Advaita, monad-Pythagorean | Parallel |
| `divine-council` | Heavenly assembly of subordinate divine beings | Canaanite, Hebrew (Job, Ps 82), Ugaritic, Greek Olympus, divine council of El | Transmission (Canaanite → Hebrew) |
| `theme-el-yahweh-merger` | El of Canaan and YHWH explicitly merged (Exod 6:2-3 P) | Hebrew Bible, Ugaritic | Transmission |
| `theme-two-powers-in-heaven` | Second-Temple binitarian theology before Christian Trinity | Targums, Philo, Justin, rabbinic polemic | Transmission |
| `theme-holy-spirit-sophia` | Sophia / Ḥokhmah / Holy Spirit feminine principle | Wisdom literature, Gnostic, Russian Sophiology | Transmission |
| `trinitarian-formula` | Three-in-one divine structure | Christian; possibly echoed Trimūrti, Tridosha, Tria Prima | Parallel |
| `demiurge` | Cosmic craftsman / subordinate creator | Platonic Timaeus, Gnostic Yaldabaoth, Hermetic Demiurgos | Transmission |
| `archon-cosmic-ruler` | Hostile cosmic ruler / planetary archon | Gnostic; echoes Persian dualism, astral fatalism | Transmission |
| `divine-feminine` | Feminine divine principle / goddess complex | Isis, Shakti, Sophia, Asherah, Mary-Theotokos, Inanna/Ishtar | Transmission (Isis → Mary documented) |
| `wisdom-personified` | Wisdom as a personified feminine entity | Proverbs 8, Sirach 24, Sophia, Ḥokhmah | Transmission |
| `divine-darkness` | God known through unknowing / darkness | Pseudo-Dionysius, Eckhart, Cloud of Unknowing | (Christian apophatic) |
| `apophatic-mysticism` / `theme-apophatic-theology` | Via negativa — what God is NOT | Christian, Sufi, Vedantic | Parallel |
| `via-negativa` | Same as above, methodologically | Christian | (Christian-internal) |
| `divine-name` | Divine name(s) as theologically loaded | Tetragrammaton, Ineffable Name, 99 Names of Allah, mantric AUM | Parallel |
| `tetragrammaton` (symbol) | YHWH four-letter divine name | Hebrew | (Hebrew-internal) |
| `ground-of-being` | God as ground rather than entity | Tillich, Eckhart, Vedanta | Parallel |
| `apotheosis` | Human becomes divine | Roman emperor cult, Hindu deification, Christian theosis | Parallel |
| `non-duality` | Subject/object distinction collapses | Advaita, Madhyamaka, Sufi, Eckhart, Plotinus | Parallel |
| `monad-pythagorean` | The One as cosmogonic principle | Pythagorean, Platonic, Neoplatonic, Leibniz | Transmission |
| `the-godhead-eckhart` | Eckhart's Gottheit beyond Trinity | Christian apophatic | (Christian-internal) |
| `adam-kadmon` | Primordial cosmic Adam | Kabbalah, Gnostic Anthropos, Vedic Puruṣa | Transmission (Anthropos → Adam Kadmon) |
| `anthropos-myth` | Primordial Human-figure as cosmogony | Gnostic, Hermetic, Kabbalistic, Vedic | Transmission |

### Dualism / cosmic opposition

| Slug | Look for | Traditions | Edge bucket |
|---|---|---|---|
| `dualism-cosmic` | Two opposing cosmic principles | Zoroastrian (canonical), Gnostic, Manichaean, Cathar | Transmission |
| `dualism-spirit-matter` | Spirit good / matter bad | Platonic, Gnostic, some Pauline readings, Manichaean | Transmission |
| `ethical-dualism` | Choice between good and evil at cosmic level | Zoroastrian (origin), Qumran two-spirits, Christian | Transmission |
| `theme-asha-druj-cosmic-opposition` | Aša (truth) vs. Druj (lie) | Zoroastrian | (Zoroastrian-internal) |
| `theme-satan-angra-mainyu-transfer` | Satan figure inherited from Angra Mainyu | Zoroastrian → Jewish → Christian | Transmission |
| `two-spirits-doctrine` | Two-spirit anthropology — each soul holds both | Qumran 1QS, Zoroastrian | Transmission |
| `apocalyptic-cosmic-warfare` | End-times battle between cosmic forces | Zoroastrian, Jewish apocalyptic, Christian Revelation, Norse Ragnarök | Transmission + Parallel |
| `anticosmic` | The cosmos itself is fallen / a prison | Gnostic, some Buddhist, Schopenhauerian | Parallel |
| `alien-god` | True God is alien to this cosmos | Gnostic (Marcionite, Sethian, Valentinian) | (Gnostic-internal) |

### Political-theological (sacred power, kingship, polemic)

| Slug | Look for | Traditions | Edge bucket |
|---|---|---|---|
| `divine-kingship` | King as divine or divinely-appointed | Egyptian pharaoh, Mesopotamian, Davidic, Chinese Mandate of Heaven, Roman imperial cult | Parallel |
| `divine-kingship-solar` | King identified with solar deity | Egyptian (Ra), Inca (Inti), Japanese (Amaterasu), Akhenaten | Parallel |
| `sacred-king` | King ritually responsible for cosmic order | Frazerian framework, Mesopotamian Akitu | Parallel |
| `chosen-people` | Tradition claims unique covenantal relationship | Israel, early Christianity, Islam, Inca | Polemic / Parallel |
| `messianic-genealogy` / `solomonic-genealogy` | Royal divine bloodline claim | Davidic line, Solomonic (Ethiopian Kebra Nagast), Bahá'í | Transmission |
| `theme-sacred-bloodline-claim` | Claim to literal divine descent | Egyptian, Roman, modern conspiracy (T4 with discipline) | Parallel / Polemic |
| `ecclesial-authority` | Hierarchical religious authority structure | Catholic, Sunni caliphate, Tibetan tulku lineage, rabbinic semikhah | Parallel |
| `orthodoxy-vs-heresy` | Formation of orthodox vs. heretical sides | Christian councils, Sunni/Shia split, Buddhist schools, Sankara debates | Parallel |
| `apologetic-historiography` | History written to legitimate one's tradition | Eusebius, Josephus, Sira, Buddhist Aśokan chronicles | Parallel |
| `anti-roman-polemic` | Polemic against Roman imperial religion | Revelation, Tertullian, Jewish, some Iranian | Polemic |
| `civic-religion` | State-sponsored religious system | Roman, Confucian, Soviet (analogical), Japanese Shinto Meiji | Parallel |
| `theme-persecution-as-legitimation` | Persecution narrative as authority claim | Christian martyrology, Shia Karbala, Bahá'í | Parallel |
| `crusade-theology-of-malecide` | Theology that legitimates religious violence | Latin crusader, Islamic jihad readings, Aztec | Polemic |
| `salvation-history` | History as theological narrative leading to salvation | Augustine, dispensationalism, Bahá'í, Marxist (analogically) | Parallel |
| `city-of-god-vs-earthly-city` | Two-city / two-kingdom political theology | Augustine, Lutheran, Anabaptist | (Christian-internal) |
| `theme-akhenaten-moses-monotheism-thesis` | Freud-Assmann hypothesis: Mosaic monotheism from Atenism | Egyptian, Hebrew | Transmission (contested) |
| `theme-habiru-hebrew-origins` | Habiru / 'Apiru as Hebrew origin candidates | ANE, Hebrew Bible | (historical) |
| `theme-exodus-hyksos-thesis` | Hyksos expulsion as historical kernel of Exodus | Egyptian, Hebrew | (contested) |

### Anthropological / ethical / experiential

| Slug | Look for | Traditions | Edge bucket |
|---|---|---|---|
| `fall-of-humanity` | Original loss of innocence / cosmic state | Genesis 3, Greek Hesiodic ages, Sumerian, Hindu yugas | Parallel |
| `flood-motif` | Cosmic deluge wiping out humanity | Atrahasis, Utnapishtim, Noah, Manu, Deucalion, Yu the Great, Maya | Parallel (cross-civilizational) |
| `watchers-and-fallen-angels` | Divine beings who fall, cohabit with humans | 1 Enoch, Genesis 6, Quran | Transmission |
| `microcosm-macrocosm` | Human body mirrors cosmic structure | Hermetic, Kabbalistic, Hindu, Sufi, Vitruvian | Transmission |
| `as-above-so-below` | Same principle, Hermetic phrasing | Emerald Tablet, Hermetic Corpus | Transmission |
| `hermetic-correspondences` | Detailed correspondence systems (planets/metals/herbs) | Hermetic, alchemical, astrological | Transmission |
| `reincarnation` | Soul reborn into new body | Hindu, Buddhist, Jain, Pythagorean, Orphic, Druze | Parallel |
| `karma-as-moral-law` (also in morals) | Action-consequence cosmic law | Hindu, Buddhist, Jain | Parallel |
| `monastic-asceticism` | Withdrawal from world as spiritual discipline | Christian desert, Buddhist sangha, Jain, Sufi, Pythagorean | Parallel |
| `apotheosis` | (also above) Human becomes divine | Greek, Roman, Hindu, Christian theosis | Parallel |
| `bridal-mysticism` / `soul-as-bride` | Soul / community as bride to divine bridegroom | Song of Songs, Sufi (Layla/Majnun), Christian mystics, Bhakti gopis | Parallel |
| `non-duality` | (above) | | |
| `apophatic-mysticism` | (above) | | |
| `divine-darkness` | (above) | | |
| `coniunctio` / `alchemical-marriage` | Union of opposites — alchemical & psychological | Alchemy, Jung, Hindu tantra, Christian mysticism | Transmission (hieros gamos → alchemy → Jung) |
| `archetype` | Universal patterns of psyche / mythology | Jung, Eliade, Campbell | (modern) |
| `mystery-initiation` | Mystery-cult initiation pattern | Eleusinian, Mithraic, Isiac, Dionysian, Christian baptism | Transmission |
| `theme-rebel-against-the-divine` | Prometheus / Lucifer / Iblis archetype | Greek, Christian, Islamic, Gnostic | Parallel |

### Cross-tradition transmission patterns (the MASSIVE-WIN spines)

These are the documented chains. When your text touches any node in one of these spines, write the chain edges explicitly.

| Slug | The chain | Source tier |
|---|---|---|
| `theme-vedic-avestan-split` | Common Proto-Indo-Iranian religion → Vedic (devas heroic, asuras demonic) and Avestan (daevas demonic, ahuras heroic) split | T1 (philological) |
| `theme-proto-indo-iranian-religion` | The pre-split substrate | T1 |
| `theme-zoroastrian-jewish-exchange` | Persian-period injection of Zoroastrian dualism, eschatology, angelology into post-Exilic Judaism | T2 |
| `persian-period-injection` | Same axis, second-Temple specific | T2 |
| `theme-soma-haoma-eucharist` | Vedic soma + Avestan haoma + ritual entheogen → Eucharistic substance | T2 / T4 boundary |
| `prisca-theologia` | Renaissance hypothesis: one ancient wisdom underlying all traditions | T2 |
| `perennial-philosophy` | Modern variant (Huxley) | T2 |
| `hermetic-transmission-chain` | Hermetic Corpus → Clement / Origen → Renaissance Ficino → modern esotericism | T1 |
| `zeus-pantokrator-transmission` | Zeus iconography → Christ Pantokrator iconography (beard, throne, bookgesture) | T1 (iconographic) |
| `theme-zoroastrian-cosmogony` | Bundahišn cosmogony as influence on Jewish/Christian | T1 |
| `theme-manichaeism-synthesis` | Mani's deliberate world-religion synthesis | T1 |
| `theme-gandharan-buddhism` | Greco-Buddhist syncretism Bactria/Gandhāra | T1 |
| `theme-axial-age` | Jaspers's thesis of simultaneous 800-200 BCE religious revolution | T2 (Jaspers contested) |
| `bronze-age-substrate-of-greek-religion` | Mycenaean and Near-Eastern roots of "Greek" pantheon | T1 |
| `christian-pagan-site-overlay` | Pattern of churches built over pagan sites (Pantheon → Maria Rotonda) | T2 |
| `syncretism-egyptian-greek` | Hellenistic-Egyptian fusion (Serapis, Hermes Trismegistus, Isis-Hellenistic) | T1 |
| `afro-diasporic-syncretism` | Yoruba orishas masked as Catholic saints in the Americas | T1 |
| `templar-gnostic-transmission-hypothesis` | Templar → Masonic → modern esoteric transmission (contested) | T3 / T4 boundary — handle with tiered discipline |
| `theme-solomonic-transmission-spine` | Solomonic legend chain — Ethiopian Kebra Nagast, Solomonic grimoire tradition | T2 |
| `merkabah-miraj-ascent-chain` | Hekhalot ascent → Muhammad's mi'rāj → Dante's Paradiso | T2 |

### Subject-matter clusters worth knowing (lower density, still useful)

- `dualism-cosmic`, `dualism-spirit-matter`, `ethical-dualism` (above)
- `henotheism-monolatry` — single-god worship within polytheist framework
- `ethical-monotheism` — Smith / Albright framework
- `prisca-theologia`, `perennial-philosophy` — meta-frameworks
- `lost-continent`, `atlantis-myth`, `theme-hall-of-records-hypothesis`, `theme-orion-correlation-theory`, `theme-pyramid-as-resurrection-machine` — T4 catalog (note carefully — see ONTOLOGY §5 for tier discipline)
- `sebastianism-quinto-imperio` / `fifth-empire-quinto-imperio` — Iberian apocalyptic political-theology
- `essence-energies-distinction` — Palamite Orthodox doctrine
- `apocalyptic-thunderer-vs-serpent` — Indo-European storm-god-vs-serpent
- `cattle-raid-myth` — Indo-European Heracles / Indra cattle-rescue pattern
- `divine-twins` — Indo-European Ashvins/Dioskouroi/Romulus & Remus
- `dumezil-trifunctional` — Dumézil's tripartite Indo-European framework

---

## §2 — Symbols (`09_symbols/`)

The most load-bearing iconographic patterns. Use the canonical slug; cross-tradition appearances go in `families[]`; documented transmission via `cross-symbol-edges[]` with `type: ancestor-of` (T1 required).

### Cosmological / structural

| Slug | What | Traditions |
|---|---|---|
| `axis-mundi` | World axis / pillar / tree connecting realms | Universal (>110 refs) |
| `world-tree` / `yggdrasil` / `tree-of-life` / `sefirot-tree-of-life` | Cosmic tree — same archetype, named variants | Norse, Kabbalah, Mesoamerican, Vedic |
| `cosmic-egg` | Universe-egg cosmogony | Hindu, Chinese, Orphic, Egyptian |
| `cosmic-ocean` / `nun-primordial-waters` | Pre-creation waters | Egyptian, Mesopotamian, Polynesian |
| `cosmic-serpent` | Serpent at cosmic foundations | Egyptian Apep, Mesopotamian Tiamat, Hindu Vāsuki, Norse Jörmungandr |
| `world-mountain` | Cosmic mountain — Meru, Olympus, Hara Berezaiti, Zion | Universal |
| `four-corners-of-the-earth` (look for via mandalas/orientations) | Four-direction cosmology | Universal |
| `zodiac-wheel` | Twelve-sign cosmic clock | Babylonian → Greek → Indian/Vedic Jyotisha → modern |
| `mayan-calendar` | Long count + tzolkin + haab interlocking calendars | Maya |
| `mandala-circle` | Sacred circle as cosmogram | Hindu, Buddhist, Christian, Pueblo, Jungian |
| `sri-yantra` | Specific 9-triangle mandala | Hindu Tantra |
| `flower-of-life` / `metatrons-cube` / `sacred-geometry-cosmic-proportion` | Geometric cosmograms | Hermetic, Pythagorean, Islamic |
| `golden-ratio` | φ as sacred proportion | Greek, Renaissance, modern |

### Solar / astral / fire

| Slug | What | Traditions |
|---|---|---|
| `sun-disk` / `aten-disk` / `winged-disk` | Solar iconography | Egyptian, Mesopotamian, Zoroastrian, Christian halo origins |
| `eye-of-ra` / `eye-of-the-heart` | Solar eye / inner eye | Egyptian, Sufi, Hermetic |
| `all-seeing-eye` | Eye-in-triangle | Christian providence, Masonic, conspiracy lore |
| `ajna-third-eye` | Forehead chakra eye | Hindu, Buddhist, Western occult |
| `north-star` | Polaris as cosmic axis-marker | Universal navigational + cosmic |
| `sacred-fire` | Eternal-flame iconography | Zoroastrian, Roman Vestals, Jewish ner tamid, Hindu akhand jyoti |

### Theriomorphic / animal symbols

| Slug | What | Traditions |
|---|---|---|
| `dragon-eastern` | Benevolent, scaled, atmospheric | Chinese, Japanese, Korean |
| `dragon-western` | Hoarding adversary | Indo-European, Germanic, Christian saint-slays-dragon |
| `eagle-symbol` / `garuda` / `thunderbird` / `double-headed-eagle` | Solar bird / sky-power | Universal |
| `tetramorph` | Four-faced/four-creature symbol | Ezekiel, Christian evangelists, Egyptian Sons of Horus |
| `sacred-bull` | Bull as cosmic / fertility / sacrificial | Mesopotamian, Indus, Mithraic, Cretan, Hindu Nandi |
| `cow-sacred` | Sacred cow specifically | Hindu, Egyptian Hathor |
| `sacred-stag` / `unicorn` / `griffin-symbol` / `sphinx-symbol` | Composite or noble animals | Various |
| `lamassu` | Winged-bull human-headed guardian | Mesopotamian |
| `cosmic-serpent` / `ouroboros` | Self-devouring snake | Egyptian, Greek, Hermetic, Gnostic |
| `rainbow-serpent` | Aboriginal Australian creator serpent | Aboriginal Australian |
| `nataraja` | Shiva dancing in ring of fire | Hindu |
| `sacred-cat` / `sacred-horse` / `scorpion` | Per tradition | |

### Vegetal / plant symbols

| Slug | What | Traditions |
|---|---|---|
| `tree-of-life` | Cosmic tree (also above) | Universal |
| `bodhi-tree` | Buddha's enlightenment tree | Buddhist |
| `sacred-oak` | Druidic, Norse Donar oak | Celtic, Germanic, Greek (Zeus's Dodona oak) |
| `lotus` | Egyptian/Buddhist/Hindu cosmic flower | Egyptian, Hindu, Buddhist |
| `vine-grape` | Eucharistic vine, Dionysian | Christian, Greek, Egyptian |
| `acacia` | Egyptian + Masonic + Tabernacle wood | Egyptian, Hebrew, Masonic |
| `green-man` / `cauldron-of-rebirth` | Celtic vegetation god | Celtic, English medieval |
| `amanita-muscaria` / `peyote` / `ayahuasca` / `eleusinian-kykeon` / `haoma` | Sacred entheogens | Various — T2/T4 evidence varies |

### Architectural / inscribed symbols

| Slug | What | Traditions |
|---|---|---|
| `djed-pillar` | Egyptian pillar of Osiris / stability | Egyptian |
| `obelisk` / `ben-ben` / `pillars-jachin-boaz` | Standing-stone cosmic axis | Egyptian, Hebrew, Masonic |
| `kaaba-black-stone` | Cubic shrine + meteoric stone | Islamic |
| `stupa` | Buddhist relic-mound | Buddhist |
| `gothic-cathedral` | Sacred-geometry-encoded architecture | Christian medieval |
| `pyramid-triangle` / `gobekli-tepe-pillars` | Sacred constructed forms | Egyptian, Mesoamerican, Anatolian |
| `serpent-mound` / `nazca-lines` / `stonehenge` | Geoglyphic / megalithic sacred sites | Indigenous Americas, Andean, European Neolithic |

### Cross / cruciform / hybrid

| Slug | What | Traditions |
|---|---|---|
| `latin-cross` / `inverted-cross` / `coptic-cross` | Crucifix variants | Christian |
| `ankh` | Egyptian "key of life" — Coptic cross origin candidate | Egyptian |
| `swastika` (look for in symbols folder) | Cross with rotation | Pre-modern: Hindu, Buddhist, Jain, Greek; modern: contaminated by Nazi use |
| `chi-rho` (look for) | Greek monogram for Christ | Christian |
| `tau-cross` (look for) | T-shape; Egyptian, Franciscan, Hebrew | |

### Geometric / numerical

| Slug | What | Traditions |
|---|---|---|
| `sacred-number-three`, `seven`, `twelve`, `forty`, `eight`, `five`, `four`, `nine`, `two`, `108`, `zero` | Sacred-number nodes | Universal |
| `monad-pythagorean` | The One | Pythagorean |
| `triquetra` / `vesica-piscis` | Geometric symbols | Christian, Celtic |
| `hexagram` / `pentagram` (look for) | Six- and five-pointed stars | Hebrew, Western occult |
| `enneagram` | Nine-pointed Gurdjieff/Sufi diagram | Modern esoteric / Sufi roots claimed |
| `yin-yang` / `ba-gua` | Chinese binary / 8-trigram cosmology | Daoist |

### Mystery / occult / esoteric

| Slug | What | Traditions |
|---|---|---|
| `philosophers-stone` / `prima-materia` / `azoth` / `rebis` / `green-lion` / `sol-niger` / `sulphur-mercury-salt` / `solve-et-coagula` | Alchemical symbols | Alchemy (East & West) |
| `emerald-tablet` | Hermetic origin text-symbol | Hermetic |
| `caduceus` / `rod-of-asclepius` (latter look for) | Twin-serpent rod | Greek, Egyptian, Mesopotamian |
| `pillars-jachin-boaz` / `royal-arch` / `square-and-compass` / `blazing-star` / `mosaic-pavement` | Masonic | Masonic |
| `tarot` | Late-medieval through occult deck | Western occult |
| `voynich-glyphs` | Undeciphered manuscript | Mystery (T4-watch) |
| `phaistos-disc` / `rongorongo` / `pakal-sarcophagus-lid` | Undeciphered or contested artifacts | Mystery (handle tier discipline) |
| `baphomet` / `inverted-cross` | Templar / occult / inversion symbols | Templar lore / Western occult — see [`feedback_deviant_bridges.md`] for tiering |

### African / Indigenous / Pacific

| Slug | What | Traditions |
|---|---|---|
| `adinkra` | Akan symbol system | West African (Akan) |
| `sankofa` | "Go back and get it" Adinkra symbol | Akan |
| `nsibidi` | Igbo / Ekoi ideographic system | West African |
| `veve` / `pontos-riscados` / `oshe-shango` | Vodou / Candomblé / Yoruba ritual marks | Afro-diasporic |
| `ifa-divination` | Ifá divination corpus & marks | Yoruba |
| `dreamcatcher` / `medicine-wheel` / `totem-pole` / `wampum` / `shamanic-drum` | Indigenous North American | Indigenous Americas |
| `quipu` | Inca knotted-cord recording | Inca |
| `ollin` | Aztec movement-glyph | Aztec |
| `aegishjalmr` / `valknut` / `runes` | Norse symbols | Norse / Germanic |

---

## §3 — Rituals (`14_rituals/`)

Patterns to look for in a text describing or prescribing ritual.

### Sacrifice & offering

- `ritual-sacrifice` — generic; the densest ritual node (>38 refs)
- `ritual-yajna-vedic-fire` — Vedic fire ritual (>21 refs)
- `ritual-eucharist-communion` — Christian sacrament rooted in sacrifice (>17 refs)
- `ritual-eid-sacrifice-qurban` — Islamic Abrahamic sacrifice
- `ritual-aztec-autosacrifice` — bloodletting cosmic-renewal
- `ritual-inca-capacocha` — child sacrifice for cosmic continuity
- `ritual-blot` — Norse blood-sacrifice
- `ritual-akitu-new-year` — Mesopotamian annual sacrifice + Enuma Elish recitation

### Initiation & mystery

- `ritual-initiation-mystery` — generic mystery-cult initiation (>21 refs)
- `ritual-eleusinian-mysteries` — paradigmatic Greek
- `ritual-mithraic-mysteries` — 7-grade Mithraic
- `ritual-baptism` — Christian + parallels (>14 refs)
- `ritual-mikveh-immersion` — Jewish purification immersion
- `ritual-misogi-purification` — Shinto cold-water purification
- `ritual-navjote-zoroastrian-initiation`
- `ritual-amrit-sanchar` — Sikh initiation
- `ritual-upanayana-sacred-thread` — Hindu thread-investiture
- `ritual-confirmation-chrismation` — Christian initiation completion
- `ritual-rites-of-passage` — Van Gennep's framework (>18 refs)

### Mortuary

- `ritual-funeral-rites` — generic
- `ritual-embalming-mummification` — Egyptian
- `ritual-norse-funeral-ship`
- `ritual-tibetan-sky-burial`
- `ritual-zoroastrian-tower-of-silence`
- `ritual-kaddish-mourning`
- `ritual-shraddha-ancestor` — Hindu ancestral rites
- `ritual-extreme-unction` — Catholic last rites

### Calendar / festival

- `ritual-passover-seder` / `ritual-passover-haggadah`
- `ritual-yom-kippur-atonement`
- `ritual-diwali-festival-light`
- `ritual-christmas-nativity`
- `ritual-roman-saturnalia` — hierarchy-inversion festival (cross-tradition parallel to Purim/Holi/Carnival)
- `ritual-opet-festival` — Egyptian
- `ritual-sed-festival` — pharaonic jubilee
- `ritual-chinese-new-year`
- `ritual-samhain` — Celtic dead-return
- `ritual-egungun-masquerade` — Yoruba dead-return (parallel to Samhain)
- `ritual-advent-lent-liturgical-year`
- `ritual-buddhist-uposatha`

### Pilgrimage

- `ritual-pilgrimage-cross-tradition` — generic
- `ritual-hajj-pilgrimage` / `ritual-hajj-kaaba-origins`
- `ritual-kumbh-mela-pilgrimage`

### Divination & possession

- `ritual-divination-mesopotamian` — first state-divination apparatus
- `ritual-ifa-divination` — Yoruba 256-Odù binary
- `ritual-bori-spirit-possession` — Hausa
- `ritual-vodou-ceremony` / `ritual-vodou-healing`
- `ritual-seidr` — Norse shamanic-trance
- `ritual-glossolalia-speaking-tongues` — Pentecostal & cross-tradition

### Daily / prayer

- `ritual-daily-prayer` — generic
- `ritual-adhan-call-to-prayer`
- `ritual-salat-five-prayers`
- `ritual-dhikr-remembrance`
- `ritual-christian-liturgy-of-hours`
- `ritual-sabbath-observance` / `ritual-shabbat-havdalah`
- `ritual-torah-reading-synagogue`

### Ascetic / contemplative

- `ritual-fasting-cross-tradition`
- `ritual-ramadan-sawm`
- `ritual-vision-quest` — Indigenous N. American
- `ritual-sweat-lodge`
- `ritual-zen-sesshin`
- `ritual-theravada-ordination`
- `ritual-yoga-as-ritual`
- `ritual-taoist-inner-alchemy`
- `ritual-sallekhana` — Jain ritual fast-to-death
- `ritual-paryushana` — Jain annual purification

### Imperial / civic

- `ritual-olympic-games` — Zeus sacrifice festival
- `ritual-roman-triumph` — apotheosis-management
- `ritual-vestal-virgins` — eternal flame
- `ritual-thing-assembly` — Norse legal assembly
- `ritual-potlatch` — Pacific Northwest economic ritual

---

## §4 — Morals (`13_morals/`)

Small set; treat each as a cross-tradition lens.

| Slug | What to look for | Edge bucket |
|---|---|---|
| `moral-golden-rule-cross-tradition` | "Treat others as…" — appears in Confucian Analects, Hillel, Mahābhārata, Gospels, Zoroastrian | Parallel (very strong cross-tradition convergence) |
| `moral-ahimsa-nonviolence` | Non-harm doctrine | Jain (most rigorous), Buddhist, Hindu, Gandhi → MLK chain |
| `moral-karma-as-moral-law` | Action-consequence cosmic law | Hindu, Buddhist, Jain |
| `moral-natural-law` | Right action knowable by reason | Stoic, Christian (Aquinas), Confucian Mengzi, Islamic ʿaql |
| `moral-stoic-virtue-ethics` | Eudaimonia via four virtues | Stoic, Christian appropriation, Buddhist appropriation |
| `moral-buddhist-five-precepts` | Pañcasīla | Buddhist; parallel to Decalogue |
| `moral-ten-commandments` | Decalogue + ANE precedents | Hebrew Bible, ANE law codes (Hammurabi, Hittite) |
| `moral-zoroastrian-asha` | Truth/right order as ethical foundation | Zoroastrian |
| `moral-confucian-ren` | Humaneness as cardinal virtue | Confucian |
| `moral-islamic-sharia` | Divine law as moral system | Islamic |
| `moral-euthyphro-dilemma` | "Good because God commands, or commanded because good?" — meta-ethical | Greek, Christian Scholastic, modern |
| `moral-divine-command-theory` | Morality grounded in divine fiat | Islamic, some Reformed, Ash'arite |

---

## §5 — How an investigation agent uses this file

When you absorb a primary text:

1. **Open ONTOLOGY.md → §2 (the 17 lenses)** — that's the folder mapping.
2. **Open this file (CORE-THEMES.md)** — for each lens that applies, scan the section. When the text touches a pattern, use the canonical slug.
3. **Open ONTOLOGY.md → §3 (the 7 edge buckets)** — to decide which YAML field carries the edge.
4. **Open ONTOLOGY.md → §4 (MASSIVE-WIN patterns)** — to write the explicit transmission edges where applicable.

**Example.** You absorb the Gospel of John:
- §2 cosmogonic → `creation-by-word`, `logos-cosmic-reason`, `logos-johannine`, `logos-philonic` (chain)
- §2 soteriological → `gnosis-as-salvation`, `dying-rising-god` (with Disputes), `executed-divine-claimant`
- §2 theological → `divine-emanation`, `theme-two-powers-in-heaven`, `theme-holy-spirit-sophia`, `divine-name`
- §3 symbols → `vine-grape`, `lamb-of-god` (look for / create), `latin-cross`
- §3 rituals → `ritual-eucharist-communion`, `ritual-baptism`, `ritual-passover-seder` (Last Supper)
- §4 morals → `moral-golden-rule-cross-tradition` (John 13:34 variant)
- §1 MASSIVE-WIN spine → `logos-cosmic-reason` (Heraclitus → Stoic → Philo → John): write `cross-tradition-edges` with `type: ancestor-of` and Tier-1 source.

That's the dissection. The 17-lens batch absorbs the text + spins out / extends every node + writes the chain edge.

---

## §6 — Maintenance

- This file is **hand-curated**. Update when a new cluster of investigation reveals a load-bearing pattern not yet listed, OR when a pattern's inbound-link density crosses ~20 and it belongs in the top tier.
- The density ranking is auto-derivable via `python3 -c "..."` against the vault — see the script used to generate this file (in `00_meta/scripts/` or inline).
- When you promote a stub theme to `metadata` and it should join the hunt-list, add a row in the right section. The cost of adding a row is low; the benefit (future agents see the canonical slug) is high.
- **Do not** delete entries from this file even if a node gets renamed; instead, update the slug. Removing kills future agents' ability to find the canonical anchor.
