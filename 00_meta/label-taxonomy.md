# Label Taxonomy — Document Types

A document's **label** describes *how the text was received, preserved, and classified by later tradition* — not its evidentiary value. All labels are equal as historical evidence.

## Master label list (for YAML `label:` field)

### Mesopotamian / Egyptian / Canaanite / ancient Near Eastern
- `mythological-narrative` — e.g., Enuma Elish, Baal Cycle
- `mythological-liturgical` — temple hymns (Kesh Temple Hymn, Sumerian temple hymns of Enheduanna)
- `funerary` — Pyramid Texts, Coffin Texts, Book of the Dead
- `royal-inscription` — stelae, building inscriptions with theological content
- `divinatory` — omen series, astrological texts (Enūma Anu Enlil)
- `wisdom-literature` — Instructions of Shuruppak, Egyptian Instructions
- `epic` — Gilgamesh, Atrahasis
- `archaeological-cultic` — Ugaritic ritual texts, Amarna religious correspondence

### Vedic / Hindu
- `śruti-vedic` — Rigveda, Sama, Yajur, Atharva (revealed, beginningless)
- `śruti-upanishadic` — Upanishads (philosophical Vedic)
- `smṛti-epic` — Mahabharata, Ramayana
- `smṛti-puranic` — Puranas
- `tantric` — Tantras, Agamas (Shaiva, Vaishnava, Shakta)
- `darśana` — philosophical-school texts (Yoga Sutras, Vedanta Sutras)

### Iranian / Zoroastrian
- `revealed-gathic` — Gathas of Zarathustra (attributed direct speech)
- `revealed-yashts` — younger Avestan hymns to yazatas
- `liturgical-yasna` — ritual liturgy
- `pahlavi-commentary` — Sasanian-era exegesis (Bundahishn, Denkard)

### Hebrew Bible / Jewish
- `tanakh-torah` — Pentateuch (Genesis–Deuteronomy)
- `tanakh-nevi'im` — Prophets
- `tanakh-ketuvim` — Writings (Psalms, Job, etc.)
- `apocryphal-jewish` — books in Septuagint/Vulgate but outside Tanakh (Tobit, Wisdom of Solomon, 1–2 Maccabees, Sirach, Baruch, Judith)
- `pseudepigraphal-jewish` — attributed to ancient figures, outside both canons (1 Enoch, Jubilees, Testaments of the Twelve Patriarchs, 4 Ezra)
- `sectarian-qumran` — Dead Sea Scrolls community writings (Community Rule, War Scroll, Hodayot)
- `merkavah-hekhalot` — early Jewish mysticism (3 Enoch, Hekhalot Rabbati)
- `rabbinic-mishnah` — Mishnah (~200 CE)
- `rabbinic-talmud` — Babylonian and Jerusalem Talmuds
- `rabbinic-midrash` — Genesis Rabbah, etc.
- `kabbalistic` — Zohar, Bahir, later Lurianic texts

### Christian
- `canonical-nt` — 27 books of the New Testament
- `apocryphal-christian` — early Christian texts not canonized (Infancy Gospel of Thomas, Acts of Paul and Thecla, Protoevangelium of James)
- `gnostic-christian` — Nag Hammadi corpus, Pistis Sophia, Books of Jeu, Berlin Codex texts
- `gnostic-sethian` — sub-class within Gnostic (Apocryphon of John, Gospel of the Egyptians, Three Steles of Seth)
- `gnostic-valentinian` — Gospel of Truth, Gospel of Philip, Tripartite Tractate
- `gnostic-thomasine` — Gospel of Thomas, Book of Thomas the Contender
- `manichaean` — Manichaean scriptures (Kephalaia, Cologne Mani Codex)
- `mandaean` — Ginza Rabba, Book of John, Mandaean liturgy
- `patristic` — Church Fathers (Justin Martyr, Irenaeus, Origen, Augustine)
- `heresiological` — anti-heretical treatises (Irenaeus *Against Heresies*, Hippolytus *Refutation of All Heresies*, Epiphanius *Panarion*) — invaluable because they preserve fragments of suppressed texts
- `liturgical-christian` — early liturgies (Didache, Apostolic Constitutions)
- `conciliar` — ecumenical council decrees (Nicaea, Chalcedon)

### Islamic
- `revealed-quran` — the Qur'an
- `hadith` — sayings/traditions of Muhammad (Bukhari, Muslim, Tirmidhi, etc.)
- `sira` — biography of Muhammad (Ibn Ishaq, Ibn Hisham)
- `tafsir` — Quranic exegesis (Tabari, Ibn Kathir)
- `shi'a` — Nahj al-Balagha, Shi'a hadith collections
- `sufi` — mystical poetry and treatises (Rumi, Ibn Arabi, al-Ghazali)
- `ismaili` — Ismaili esoteric writings

### Buddhist
- `pali-canon-vinaya` — monastic discipline
- `pali-canon-sutta` — discourses
- `pali-canon-abhidhamma` — analytical/scholastic
- `mahayana-sutra` — Lotus, Heart, Diamond, Avatamsaka, etc.
- `vajrayana-tantra` — tantric Buddhist scriptures
- `zen-koan` — koan collections (Mumonkan, Blue Cliff Record)
- `commentarial` — Nagarjuna, Asanga, Vasubandhu, etc.

### Chinese / East Asian
- `daoist-classical` — Tao Te Ching, Zhuangzi, Liezi
- `daoist-canonical` — Daozang corpus
- `confucian-classical` — Analects, Mencius, Doctrine of the Mean, Great Learning
- `confucian-canonical` — Five Classics
- `shinto` — Kojiki, Nihon Shoki, Engishiki

### Other major
- `jain-agamic` — Jain Agamas (Shvetambara), Digambara texts
- `sikh-gurbani` — Guru Granth Sahib, Dasam Granth
- `bahai` — Kitáb-i-Aqdas, Kitáb-i-Íqán

### Greco-Roman / Hellenistic
- `epic-greek` — Homer's Iliad, Odyssey
- `theogonic` — Hesiod's Theogony, Works and Days
- `orphic` — Orphic hymns, fragments, Derveni Papyrus
- `mystery-cult` — fragments and inscriptions from Eleusinian, Dionysian, Mithraic cults
- `hermetic` — Corpus Hermeticum, Asclepius, Stobaean fragments
- `neoplatonist` — Plotinus, Porphyry, Iamblichus, Proclus
- `chaldean-oracles` — fragments
- `philosophical` — Plato's theological/cosmological dialogues (Timaeus, Republic Book X), Stoic theology

### Cross-tradition / esoteric (later)
- `alchemical` — Zosimos, later Arabic and Latin alchemy
- `magical-papyri` — Greek Magical Papyri (PGM), Coptic magical texts
- `theosophical` — Blavatsky, Steiner, later movements
- `new-religious-movement` — Mormon (Book of Mormon, D&C, Pearl of Great Price), Scientology Dianetics, etc.

## Note on equality

The label `gnostic-christian` and the label `canonical-nt` carry **zero hierarchical weight** in this vault. Both are early-Christian-era textual evidence. The canonical group is bigger because Constantine and the bishops won. The gnostic group is smaller and buried at Nag Hammadi because they lost. **Who won and who lost is a research finding, not a verdict on the texts.**

The same applies to:
- `tanakh-*` vs `pseudepigraphal-jewish` vs `sectarian-qumran`
- `patristic` vs `gnostic-*` vs `manichaean` vs `mandaean`
- `revealed-quran` vs `shi'a` vs `sufi` vs `ismaili`
- `pali-canon-*` vs `mahayana-sutra` vs `vajrayana-tantra`

Every group is a window onto its time.
