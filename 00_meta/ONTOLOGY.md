# ONTOLOGY — What Codex Atlas is mapping

> **Read this first.** Together with [`PROTOCOL.md`](PROTOCOL.md) (the absorb-and-dissect SOP) and [`LANES.md`](LANES.md) (the two-lane workflow), this is the only mandatory pre-flight for any agent landing in the vault.
>
> **2026-05-18 ontology lock:** the lens count expanded from 16 → 26 (Pass 2). The full rationale for every new lens, every naming choice, and every rejected proposal is in [`ONTOLOGY-RATIONALE-2026-05-18.md`](ONTOLOGY-RATIONALE-2026-05-18.md). **Any future change to the lens set must be argued against that rationale.** If you can't beat the existing reasoning, don't propose the change.
>
> **Pending rename (queued for next Lane B window):** `06_themes/` → `06_motifs/` (academic accuracy — what the folder holds are motifs, not themes). Touches `build_data.py` + 339 nodes + cross-refs; ships as one atomic refactor. Until that batch lands, the folder name + `type: theme` field remain in place. New nodes added to `06_themes/` should use `type: theme` for now; the rename will sweep them.

---

## 1. Mission

Codex Atlas is an **investigation tool**. The goal is to map the entire corpus of humanity's primary religious, philosophical, scientific, and mystical texts — at the level of every named entity inside them — and draw the **transmissions** that connect them across millennia.

The work is one motion: **absorb a primary text 100% AND dissect it into every applicable category at the same time.** When the Bhagavad Gītā lands in the vault, it doesn't just become a `document` node. The same agent, in the same batch, spins out every named entity it contains across the **26 category folders** (deities, persons, places, motifs, symbols, philosophy, theology, rituals, practices, music, alphabets, languages, astronomy, medicine, pharmacology, divination, calendars, sacred architecture, material culture, …) and wires every cross-reference. Investigation IS labelling. Labelling IS data entry.

The **prize** is the **cross-tradition transmission** — the documented chain (or structural parallel) showing how an idea travelled. Christianity → older Egyptian, Mesopotamian, Mystery, Platonic, Persian, Indic sources is the densest hunting ground. The Logos chain, the Avatar typology, the dying-and-rising god, the flood, divine kingship — every one of these has a path that can be traced.

**Posture:** investigation, not advocacy. Every claim cites a source. Tiered source-integrity (T1 primary / T2 scholarly / T3 reputable secondary / T4 controversial-but-catalogued). Equal-weight document rule — a Nag Hammadi codex and a canonical Gospel are both primary early-Christian-era evidence; *why* one has more cross-links than the other is itself a finding.

---

## 2. The 26 Lenses

Every absorbed text gets sliced through these lenses. Not every text touches every lens — but a deep absorption will touch most. **Each lens = a folder under the vault root.** Each folder hosts markdown nodes with YAML frontmatter; the YAML carries the connections; the prose carries the evidence and argument.

**Rationale for the 26-lens choice (every new lens, every naming refinement, every rejected proposal):** see [`ONTOLOGY-RATIONALE-2026-05-18.md`](ONTOLOGY-RATIONALE-2026-05-18.md). Read that before proposing any change.

| # | Folder | Type | Lives here | Primary YAML fields |
|---|---|---|---|---|
| 1 | `01_timeline/` | (index) | Master chronological index | (index file; not per-node) |
| 2 | `02_documents/_phase-N-*/` | **document** | Primary texts: scriptures, codices, treatises, edicts | `deities-mentioned`, `key-figures`, `themes`, `parallels`, `influences`, `influenced-by`, `authorship`, `date-composed-earliest/latest`, `language`, `region` |
| 3 | `03_deities/` | **deity** | Every named god, goddess, divinity, divine being. *Demonic and "fallen" figures live here too — `demon` is typically a polemic relabeling by a competing tradition (a Vedic deva → Zoroastrian daēva, a Canaanite Baʿal → Hebrew Bible "false god"). These reframings are tracked via the **Polemic** edge bucket, not by sorting figures into a separate folder.* | `aka`, `domains`, `parent-of`, `child-of`, `consort`, `attested-in`, `equivalents`, `syncretic-edges`, `attributes`, `tradition`, `region` |
| 4 | `04_persons/` | **person** | Prophets, scribes, kings, philosophers, redactors, founders, translators, dissident teachers. *The term-of-art "heresiarch" is sometimes used in academic literature when describing how a dominant tradition framed dissident figures (Marcion, Arius, Mani, Pelagius, Eckhart). It is itself a polemic label and we use it only with that flag.* | `role`, `historicity`, `texts-authored`, `texts-attributed-to`, `originator-of`, `mentioned-in`, `events-participated`, `connects-to` |
| 5 | `05_events/` | **event** | Conquests, exiles, councils, persecutions, discoveries, eruptions | `date-start`, `date-end`, `participants`, `traditions-affected`, `documents-affected`, `documents-produced`, `region` |
| 6 | `06_themes/` ⚠️ | **theme** | Recurring motifs: flood, dualism, demiurge, messianism, dying-rising god, sacred marriage, chaoskampf, axis mundi. **⚠️ Pending rename to `06_motifs/` with `type: motif` (academic accuracy — what this folder holds are motifs in the Stith-Thompson sense, not themes in the literary-criticism sense). Until the rename lands, keep using `type: theme`. Slug stems unchanged.** | `category` (cosmogonic/eschatological/soteriological/…), `appearances`, `deity-instances`, `cross-tradition-parallels` |
| 7 | `07_traditions/` | **tradition** | Per-tradition overview hubs: Christianity-Latin, Egyptian, Vedic, Zoroastrian, Hermeticism, Sufism, … | `parent-tradition`, `sister-traditions`, `key-deities`, `key-persons`, `key-documents`, `date-emergence` |
| 8 | **`08_places/`** | **place** | Cities, regions, civilizations, valleys, rivers — geographic loci with religious/philosophical/cultural significance. *Alexandria, Jerusalem, Mecca, Varanasi, Mount Sinai (as geographic locus — sacred-architectural detail lives in `20_`).* | `category` (city/region/civilization/etc.), `region`, `lat`/`lon`, `date-founded`, `traditions-active`, `key-events`, `key-figures`, `key-documents` |
| 9 | `09_symbols/` | **symbol** | Iconographic units: geometric (cross, ankh, swastika), theriomorphic (eagle, serpent), astral (sun-disk), mystery (undeciphered) | `families`, `category`, `appearances`, `deity-instances`, `tradition-context`, `cross-symbol-edges`, `mystery-status` |
| 10 | `10_music/` | **music** | Sacred sound, cosmological music, ritual chant, hymn corpora | `tradition`, `instrument`, `cross-music-edges` |
| 11 | `11_alphabets/` | **alphabet** | Scripts, glyph systems, divine-origin stories of writing. *Distinct from `18_languages/` — an alphabet is the visual script (Devanagari, Arabic script, Hebrew alphabet); a language is the linguistic system written in it (Sanskrit, Persian, Hebrew).* | `parent-script`, `descendant-scripts`, `cross-alphabet-edges`, `glyph-count` |
| 12 | `12_alchemy/` | **alchemy** | Practitioners, texts, processes, concepts in alchemical traditions. *Substances themselves now live in `24_pharmacology/`; cross-link practitioners and processes to substances they use.* | `alchemy-type` (practitioner/text/process/concept), `cross-alchemy-edges` |
| 13 | `13_morals/` | **moral** | Cross-tradition ethical positions: Golden Rule variants, prohibitions, virtues | `category`, `cross-moral-edges` |
| 14 | `14_rituals/` | **ritual** | Public/communal performative acts: rites, ceremonies, sacrifices, festivals, initiations, rites of passage, pilgrimage. *Divinatory practices have moved to `25_divination/`; inner/contemplative practices have moved to `22_practices/`.* | `tradition`, `category`, `cross-ritual-edges` |
| 15 | `15_philosophy/` | **philosophy** | Schools of thought: Neoplatonism, Madhyamaka, Stoicism, Falsafa, Confucianism. *Distinct from `21_theology/` — philosophy is rational inquiry that may or may not be religious; theology is systematic reflection **within** a tradition on its own claims using that tradition's revelatory authority.* | `school-type`, `cross-tradition-edges`, `cross-music-edges` |
| 16 | `16_mathematics/` | **mathematics** | Sacred number, ritual geometry, scientific roots: Babylonian, Sulba Sūtras, Pythagorean, House of Wisdom, India zero. **Includes geometry** (Euclid, sacred-geometry-as-mathematical-form). *Visual/symbolic sacred-geometry forms (Flower of Life, Sri Yantra) primarily live in `09_symbols/`; this folder gets the algorithmic/theoretical/computational layer.* | `math-type` (origin/ritual-geometry/sacred-number/transmission/concept), `cross-tradition-edges` |
| 17 | `17_medicine/` | **medicine** | Healing traditions, theory (humoural, dosha, five-phase), specific healers/physicians, medical literature (Hippocratic / Ayurvedic / Islamic Golden Age / Asklepion / TCM / **indigenous healing traditions** including Siberian shamanic in the original sense, Amazonian *ayahuasquero* + *vegetalismo*, sub-Saharan divinatory healing, Aboriginal Australian, Mesoamerican *curandero*). *Substances (herbs, sacred plants, minerals, prepared compounds) live in `24_pharmacology/`; specific divinatory healing methods (when treated as divination-system) cross-link to `25_divination/`.* | `tradition`, `category`, `cross-tradition-edges` |
| 18 | **`18_languages/`** | **language** | Language families (Indo-European, Afroasiatic, Sino-Tibetan, …), specific languages (Sanskrit, Akkadian, Koine Greek, Classical Arabic, Ge'ez, Pali, Aramaic, Coptic), comparative linguistic findings (cognates, sound shifts). | `category`, `family`, `parent-language`, `descendant-languages`, `script-used`, `date-attested-earliest/latest`, `liturgical-tradition`, `texts-in-language` |
| 19 | **`19_astronomy/`** | **astronomy** | Observational and predictive astronomy — astronomical texts (*Almagest*, *Surya Siddhanta*, MUL.APIN), astronomers (Ptolemy, Aryabhata, al-Tusi, Kepler, Galileo, Shen Kuo), observatories (Maragha, Samarkand, Uraniborg), astronomical instruments. **Distinct from astrology** (symbolic/divinatory interpretation; for now astrology lives as cross-cutting tags + the Astrology UI tab; divinatory astrological systems can live in `25_divination/`). | `category` (astronomer/observatory/instrument/astronomical-text/phenomenon/discovery), `date-birth/death`, `region`, `languages-worked-in`, `texts-authored`, `cross-tradition-edges` |
| 20 | **`20_sacred_architecture/`** | **sacred-site** | Religiously-charged sites and structures — both **built** (pyramids, cathedrals, temples, mosques, stupas, Göbekli Tepe) and **natural-but-sacred** (Mount Kailash, Uluru, Mount Sinai as sacred mountain, sacred rivers). | `category` (built-monument/natural-sacred-site/sacred-mountain/sacred-river/temple/mosque/church/stupa/shrine/tomb-complex/ritual-landscape), `location-place`, `date-built-earliest/latest`, `tradition`, `function`, `key-figures`, `themes`, `cross-tradition-edges` |
| 21 | **`21_theology/`** | **doctrine** | Specific worked-out doctrinal positions formulated *within* a tradition: Christology (Chalcedonian / Miaphysite / Nestorian), Trinitarian theology, Tawhid (specific kalām formulations), Trikāya, Anatta, Apophatic theology, Sola Scriptura, etc. *Distinct from `06_themes/` (motifs that travel cross-tradition) and from `15_philosophy/` (non-tradition-specific rational inquiry).* | `category` (christology/trinitarian/mariology/atonement/soteriology/eschatology/ecclesiology/scriptural-authority/mystical/cosmological), `tradition`, `date-formulated`, `council-of-origin`, `key-figures`, `opposed-by`, `parent-doctrine`, `descendant-doctrines`, `key-documents`, `themes` |
| 22 | **`22_practices/`** | **practice** | Inner/contemplative methods — dhikr (Sufi), hesychasm (Eastern Orthodox), lectio divina, vipassana / samatha / jhana, pranayama / kundalini, neidan (Daoist internal alchemy), kabbalistic meditation, centering prayer, tonglen, mantra-japa. *Distinct from `14_rituals/` (public/communal performative acts).* | `category` (contemplative-recitation/meditation/breath-discipline/body-discipline/visualization/imageless-contemplation/service-as-practice/ascetic-discipline/initiatic-rite-of-practice/psychophysical-discipline), `tradition`, `parent-practice`, `key-figures`, `key-orders-using`, `texts-prescribing`, `techniques`, `related-doctrines`, `cross-tradition-edges` |
| 23 | **`23_material_culture/`** | **relic** | Specific named physical artifacts — True Cross, Spear of Longinus, Shroud of Turin, Ark of the Covenant (the claimed physical object, distinct from the symbol of the Ark which lives in `09_symbols/`), Black Stone of Mecca, Tabot, Buddha relics (sariras), Stone of Scone, ritual objects (specific notable Torah scrolls, reliquaries, monstrances). | `category` (relic-bone/relic-clothing/sacred-container/ritual-implement/reliquary/sacred-stone/sacred-image-murti/manuscript-codex/regalia/weapon-relic), `tradition`, `related-tradition`, `date-claimed-construction`, `date-last-attested`, `authenticity-status`, `related-symbols`, `related-sites`, `related-documents`, `key-figures`, `controversies` |
| 24 | **`24_pharmacology/`** | **substance** | The substances themselves — sacred plants (soma, haoma, ayahuasca, peyote, blue lotus, mandrake, kykeon, kava, salvia, iboga), alchemical substances (mercury, sulfur, salt, lead, lapis), medicinal staples (ginseng, turmeric, willow bark, cinchona, frankincense, myrrh, silphium, theriac), animal products (bezoar, ambergris, dragon's-blood resin), minerals in pharmacy (cinnabar, realgar). | `category` (sacred-plant/botanical/mineral/animal-product/prepared-compound/sacrament-substance/psychoactive-plant/alchemical-substance/ritual-incense), `botanical-candidates`, `status-identification`, `traditions-using`, `parallel-substance`, `key-documents`, `key-rituals`, `related-deities`, `themes`, `controversies` |
| 25 | **`25_divination/`** | **divination-system** | Sign-systems consulted to read what is hidden — Yi Jing, Ifá Odù, Tarot, raml (geomancy), augury, haruspicy, scapulimancy (oracle bones), oneiromancy, runes-divination, sangoma cowries, *mo* (Tibetan dice), astrological divination systems (Hellenistic horary / Vedic Jyotisha / Mesoamerican Tonalpohualli when used divinatorily). *Distinct from `14_rituals/` (ritual = performative act; divination = consultation of a sign-system for information).* | `category` (binary-permutation-system/astrological-divination/geomantic/bone-reading/oracle-bone/throwing-cast/bibliomancy/dream-divination/medium-channeling/bodily-omen-reading/natural-omen-reading), `tradition`, `parallel-system`, `parallel-system-relation`, `formal-structure`, `methods`, `key-documents`, `key-figures`, `date-attested-earliest`, `themes`, `related-mathematics` |
| 26 | **`26_calendars/`** | **calendar-system** | Systems for reckoning, dividing, ritualizing time — Babylonian luni-solar, Egyptian civil, Hebrew, Islamic Hijri, Julian, Gregorian, Coptic, Ge'ez, Mayan composite (Long Count + Tzolkin + Haab), Aztec, Chinese sexagenary + lunisolar, Tibetan (Phugpa / Tsurphu), Vedic Yuga + tithi, Iranian Jalali, Bahá'í Badíʿ. *Calendars cross-cut astronomy + mathematics + ritual + tradition; treating them as first-class nodes makes the patterns legible.* | `category` (luni-solar/lunar-pure/solar-pure/composite-calendar-system/cyclic-cosmic/sexagenary/decimal), `tradition`, `date-attested-earliest/latest`, `epoch`, `cycle-lengths`, `intercalation-rule`, `astronomical-basis`, `related-mathematics`, `related-astronomy`, `related-rituals`, `related-documents`, `parallel-calendars` |
| — | `99_ingest/` | (raw) | Unprocessed material (screenshots, dumps, PDFs awaiting absorption) | Not part of the graph; staging zone before a node exists. |

**The graph emerges from the YAML fields.** Most fields above are arrays of `[[wikilinks]]` (with the kebab-case slug between the brackets). `build_data.py` walks every node, parses these fields, and emits edges. See §3 below for which fields produce which edge types.

**⚠️ Build-script awareness gap (as of 2026-05-18 ontology lock):** `build_data.py`'s `NODE_TYPE_MAP` currently knows the original 16 types only. Nodes added to the 10 new lenses (`08_places/`, `18_languages/` through `26_calendars/`) will not appear in the graph until `build_data.py` is updated to know their type → folder mappings. That update is queued for the next Lane B-free window. Investigation agents may begin staging nodes in the new folders today; they'll integrate the moment the build script catches up.

---

## 3. The 7 Edge Buckets

Every edge in the graph belongs to one of seven semantic buckets. The buckets are inherited from the Pantheon V2 view's color palette and are the **canonical** edge taxonomy across the vault — content and viewer agree.

| Bucket | Color | Semantics | Directional? | Example edge types |
|---|---|---|---|---|
| **Transmission** | terracotta `#C9743A` | Historical causality. A → B means "A is documented as the source / ancestor of B." The hunt for transmissions is the project's prize. | YES (gradient: bright at origin, dim at terminus) | `influences`, `influenced-by`, `ancestor-of`, `heir-of`, `distant-heir`, `parent-of` (deity lineage), `descendant-script` |
| **Parallel** | teal `#5A9A8F` | Structural resemblance with no proven contact. "Same form, independent emergence" — the convergence claim. | NO | `parallel-motif`, `parallel-form`, `scholarly-parallel`, `structural-parallel`, `parallel-music`, `parallel-symbol` |
| **Association** | slate-indigo `#4A5AA4` | Ambient context. "X lives in tradition Y" / "Theme T appears in document D." The noise floor — high count, low headline. | NO | `has-theme`, `tradition-deity`, `tradition-doc`, `tradition-person`, `member-of`, `shared-milieu` |
| **Kinship** | lilac `#C9A5D4` | Family relationships among deities (and analogous "father / mother / son" claims in syncretic theology). | PARTIAL (parent-of is directional; consort is not) | `parent-of`, `child-of`, `consort`, `sibling-of` |
| **Attestation** | gold `#D4A55A` | Documentary evidence. "Deity X is attested in document Y." Person → text authorship belongs here too. | YES (text → entity, or entity → text depending on direction) | `attests`, `attested-in`, `authored`, `attributed-author`, `primary-source`, `translation-of`, `documents-affected` |
| **Polemic** | crimson `#A83E4A` | Hostile reframing. "Tradition A rewrites tradition B's god as a demon." Headline — always visible even at idle. | NO | `polemic-against`, `polemic-inversion`, `appropriated-by` (with polemic intent) |
| **Fusion** | amber `#C4783A` | Genuine syncretic merger — two entities collapse into one or are explicitly identified. Headline — always visible even at idle. | PARTIAL | `syncretic`, `syncretic-fusion`, `syncretic-ancient-identification`, `syncretic-folk-syncretism`, `visual-cognate` |

### YAML field → bucket routing

This table tells you which bucket your edge will land in, depending on the YAML field you use.

| YAML field (in any node) | Default edge type | Bucket |
|---|---|---|
| `themes[]` | `has-theme` | Association |
| `parallels[]` | `parallel-motif` | Parallel |
| `influenced-by[]` | `influenced-by` | Transmission (reversed) |
| `influences[]` | `influences` | Transmission |
| `deities-mentioned[]` | `attests` | Attestation |
| `attested-in[]` | `attested-in` | Attestation (reversed) |
| `equivalents[]` | `syncretic` | Fusion |
| `parent-of[]` | `parent-of` | Kinship |
| `child-of[]` | `child-of` | Kinship (reversed) |
| `consort[]` | `consort` | Kinship |
| `key-deities[]` (on tradition) | `tradition-deity` | Association |
| `key-documents[]` (on tradition) | `tradition-doc` | Association |
| `key-persons[]` (on tradition) | `tradition-person` | Association |
| `texts-authored[]` (on person) | `authored` | Attestation |
| `texts-attributed-to[]` (on person) | `attributed-author` | Attestation |
| `originator-of[]` (on person) | `originated` | Transmission |
| `mentioned-in[]` (on person) | `mentioned-in` | Attestation |
| `events-participated[]` (on person) | `participated-in` | Association |
| `events-context[]` (on document) | `context` | Association |
| `syncretic-edges[]` (structured; `type:` modifier) | `syncretic-{ancient-identification\|scholarly-parallel\|folk-syncretism}` | Fusion |
| `cross-symbol-edges[]` (structured) | `visual-cognate` or `type:` value (`ancestor-of`, `parallel-form`, `syncretic-fusion`, `appropriated-by`, `polemic-inversion`) | Fusion / Transmission / Parallel / Polemic by `type` |
| `cross-music-edges[]`, `cross-alchemy-edges[]`, `cross-ritual-edges[]`, `cross-moral-edges[]`, `cross-alphabet-edges[]` | `parallel-form` (default; `type:` overrides) | Parallel by default |
| `cross-tradition-edges[]` (structured) | `parallel-form` (default; `type:` overrides) | Parallel by default |
| `cross-tradition-parallels[]` (on theme) | `parallel-motif` | Parallel |
| `cross-links[]` (on deity) | `ancestor-of` | Transmission |
| `connects-to[]` (on person, with `relation:`) | per `relation:` value | depends |
| `_graph/influences.md` raw list (`` `[type] source → target` ``) | `type` from bracket | per type |

**Choosing the right field:**

- Use `equivalents[]` or `syncretic-edges[]` for "X IS Y" claims (Fusion).
- Use `parallels[]` or `cross-*-edges[]` for "X RESEMBLES Y but independently" (Parallel).
- Use `influences[]` / `influenced-by[]` or `cross-*-edges[]` with `type: ancestor-of` for documented transmission (Transmission). This is where the MASSIVE WINs live.
- Use `parent-of[]` / `consort[]` only for actual divine genealogy (Kinship).
- Use `attested-in[]` for "this deity/person appears in this text" (Attestation).
- Use `polemic-inversion` deliberately when one tradition is documented as rewriting another's figures as evil (Polemic).

---

## 4. MASSIVE-WIN transmission patterns we hunt

The prize is the **cross-tradition transmission**. When you absorb a primary text, hunt for the older-tradition source and write it as an explicit Transmission edge with a Tier-1 or Tier-2 source.

**Two companion files are mandatory reading alongside this section:**
- [`CORE-THEMES.md`](CORE-THEMES.md) — the curated hunt-list of ~150 cross-tradition patterns (themes / symbols / rituals / morals) with canonical slugs. **Use it as your lens** when dissecting a text; never coin a new slug for a pattern that already has a canonical entry.
- [`MASSIVE-WINS-INDEX.md`](MASSIVE-WINS-INDEX.md) — full catalog with vault-node pointers and source citations.

The categories below summarise the transmission patterns; CORE-THEMES.md §1 has each pattern as a row with traditions + edge bucket.

### A. Documented transmissions (historical chain, evidenced)
The strongest claims. A primary source explicitly attests A → B, or a scholarly consensus is built on textual/manuscript evidence.

- **Hurrian → Greek**: Kumarbi Cycle → Hesiod's Theogony (succession-myth narrative is Hurrian, not Greek).
- **Greco-Egyptian → Christianity**: Stoic logos → Philo of Alexandria → Gospel of John → Justin Martyr → Clement & Origen.
- **Platonic → Christianity**: Plato (Timaeus) → Justin / Clement / Origen / Valentinus.
- **Hermetic → Christianity**: Hermetic Corpus → Clement + Origen (the strongest 0–300 CE edge).
- **Mesopotamian → Hellenistic Mystery**: Sumerian/Akkadian descent myths → Eleusinian / Orphic.
- **Persian → Second-Temple Judaism**: Zoroastrian dualism, eschatology, angelology → apocalyptic Judaism → Christianity.
- **Indic → Hellenistic**: Aśokan edicts, Greco-Buddhist Gandhāra, possible Pyrrho influence.
- **Aristotle → Aquinas**: Aristotle → House of Wisdom → al-Fārābī → Avicenna → Averroes → Toledo translations → Aquinas. The most consequential intellectual transmission in Western history.
- **Egyptian → Marian iconography**: Isis-Hellenistic → Mary-Theotokos (visual + theological).
- **Ethiopian preservation**: Ge'ez 1 Enoch is the only complete witness; Tewahedo OT canon retains books rejected by every other branch.
- **Vedic → Mithraic → Roman**: Mitra-Vedic → Mithra-Zoroastrian → Mithras-Roman.
- **Chinese → European Enlightenment**: Confucianism via Ricci / Couplet / Leibniz / Voltaire / Quesnay → modern meritocratic bureaucracy.
- **Yi Jing ↔ Leibniz binary**: documented by Leibniz himself (1701 Bouvet correspondence).
- **Jain ahimsa → Gandhi → MLK**: 20th-century non-violent resistance traced to Gujarati Jain merchant culture.
- **Bhagavad Gītā → Emerson / Oppenheimer / Gandhi**: most-translated Hindu text in global circulation.
- **Avataṃsaka → Huayan → Zhu Xi**: Buddhist metaphysics absorbed into Neo-Confucian *li-qi* without acknowledgment.
- **Optics chain**: Ibn al-Haytham → Roger Bacon / Witelo → Kepler → Descartes → Newton.

### B. Structural parallels (independent convergence)
Equally important when contact is implausible. The hypothesis is "human mind under similar conditions reaches the same architecture."

- **Five Phases (TCM) ↔ Four Humors (Hippocratic)**: simultaneous axial-age medical canonization with zero contact.
- **Six independent pharmacopeia traditions**: Sumerian → Ebers Papyrus → Atharva Veda → Hippocratic Corpus → Charaka Saṃhitā → Shennong Bencao Jing.
- **Confucian + Platonic music-as-state-concern**: two most developed ancient theories of music's political function; zero contact.
- **Saturnalia / Purim / Holi / Carnival**: scheduled hierarchy inversion across five civilizations.
- **Eternal flame**: Roman Vestals / Zoroastrian Atash Bahram / Jewish ner tamid / Hindu akhand jyoti.
- **Annual cosmic reset rituals**: Akitu / Rosh Hashanah / Nowruz / Chinese New Year.
- **Five-tradition chaoskampf**: Baal/Yam = Marduk/Tiamat = Yahweh/Leviathan = Zeus/Typhon = Indra/Vritra.
- **Dying-and-rising god**: Osiris / Dumuzi / Attis / Adonis / Dionysus / Christ — with Frazer's hypothesis tempered by Smith's critique.
- **Flood narratives**: Atrahasis / Utnapishtim / Noah / Manu / Deucalion / Yu the Great.
- **Universal binary divination**: Yi Jing (64 hexagrams) ↔ Ifá (256 Odù) — both 4,000-year-old binary-permutation systems on opposite sides of the Atlantic.

### C. Polemic inversions (one tradition's god becomes another's demon)
- Vedic *asura* → Zoroastrian *ahura* (heroic); Vedic *deva* → Zoroastrian *daēva* (demonic). Same words, opposite valence.
- Canaanite Baal → Hebrew Bible Baʿal as the archetypal false god.
- Egyptian Set → late demonization after early dynastic primacy.
- Gnostic readings of Genesis: Yahweh/Yaldabaoth as the deluded demiurge.

### D. Fusion mergers (two entities collapse into one)
- El-Canaanite + YHWH (Exodus 6:2-3 P-source: explicit textual merger).
- Inanna / Ishtar / Astarte / Aphrodite / Isis-Hellenistic.
- Hermes Trismegistus = Thoth + Hermes.
- Sino-Japanese Buddhist syncretism: Avalokiteśvara → Guanyin → Kannon.

**When you hunt a transmission**, you are making one of these four claims. Write it explicitly:
- `cross-tradition-edges[]` with `type: ancestor-of` and a Tier-1/2 `source:` ref for **Transmission**.
- `parallels[]` or `cross-*-edges[]` with `type: parallel-form` for **Parallel**.
- `equivalents[]` or `syncretic-edges[]` for **Fusion**.
- `cross-symbol-edges[]` (or any cross-edge) with `type: polemic-inversion` for **Polemic**.

---

## 5. Source-integrity tiers (T1 → T4)

Every claim must trace to a referenceable source. No claim hangs in the air.

| Tier | Name | What | Examples |
|---|---|---|---|
| **T1** | Primary | Direct access to source text in original language or critical translation. The actual evidence. | ETCSL (Oxford), CDLI, Sefaria, Perseus, Nag Hammadi Library (Robinson ed.), ANET (Pritchard), Loeb Classical Library, Dead Sea Scrolls Digital Library, Study Quran (Nasr et al.) |
| **T2** | Scholarly | Peer-reviewed academic; university-press monographs; named experts citing primaries. | Mark S. Smith, Bart Ehrman (academic line), Elaine Pagels, Mary Boyce, Wendy Doniger, April DeConick, journals: *JBL*, *Vigiliae Christianae*, *JNES*, *Numen*, *History of Religions* |
| **T3** | Reputable secondary | Encyclopedias, vetted summaries, trade books by credentialed authors. | Stanford Encyclopedia of Philosophy, Britannica, *Encyclopædia Iranica*, World History Encyclopedia, Catholic Encyclopedia (with bias note), Jewish Encyclopedia (1906, with date note) |
| **T4** | Controversial / heterodox | Useful for completeness, history of ideas, alternative hypotheses, popular discourse. **Always tagged `type: controversial`.** May not stand alone — must be balanced by T1–2 on the same claim, or the claim must be marked `[contested]`. | von Däniken, Sitchin, Eisenman (some claims), Murdock, Manly P. Hall, Blavatsky, Hancock, Biglino |

**Required `refs` entry shape:**
```yaml
refs:
  - title: "Full citation or article title"
    author: "Last, First (if known)"
    year: 2008
    publisher: "Oxford University Press"      # or journal name
    url: "https://..."                         # direct URL where possible (prefer DOI / archive.org / Wayback)
    type: "primary-translation"                # see below
    tier: 1                                    # 1 | 2 | 3 | 4
    notes: "optional — translation date, edition, controversy flag"
```

**Allowed `type` values:** `primary-translation`, `critical-edition`, `monograph`, `journal-article`, `encyclopedia`, `university-repository`, `documentary`, `lecture`, `controversial`, `popular`.

**For `metadata` status:** ≥3 refs total, ≥1 T1.

**Disputes:** when reputable sources disagree (common for ancient dates, authorship), carry the **range** in YAML and describe the **debate** in a `## Disputes` prose section. Show both sides.

---

## 6. Node status tiers

Every node carries a `status:` field in its YAML.

| Status | Bar |
|---|---|
| `stub` | Title + provisional date range + minimal YAML skeleton. Created during a wiring-law stub-sweep so the `[[wikilink]]` resolves. |
| `metadata` | Full YAML + ≥1 context paragraph + ≥3 refs (≥1 T1). The connection-carrying node. |
| `partial` | Selected excerpts of the source text (for `document` type). |
| `full-text` | Complete public-domain or licensed text ingested (for `document` type). |
| `full` | For non-document types: complete biographical / mythological / contextual treatment with cross-tradition edges + MASSIVE-WIN section. |

**Status promotion is incremental.** Most batches add stubs (to satisfy wiring law) and one or two `metadata` / `full` upgrades. That's healthy. Don't promote prematurely — `metadata` claims that don't meet the bar surface as quality issues in DASHBOARD.

---

## 7. Slug discipline

The slug is the node's stable identity across the graph. **Globally unique** (build hard-fails on duplicates).

- **Format:** `lowercase-kebab-case`. ASCII only. No spaces, no underscores, no diacritics in the slug (keep them in `name:`).
- **Document prefix:** `phase-N-NNN-slug` (e.g. `phase-2-027-bhagavad-gita`). Phase 1–8 are the time bands.
- **Deity / person / etc.:** unprefixed kebab-case (e.g. `el-canaanite`, `thomas-aquinas`).
- **Conflicts across folders** (same entity-name in deity + symbol + person): distinct slugs, cross-linked via `syncretic-edges`. Convention:
  - deity keeps the bare slug
  - symbol gets `-symbol` suffix (e.g. `ark-of-the-covenant-symbol`)
  - person gets `-person` suffix (e.g. `michael-archangel-person`)
  - theme keeps the bare slug if it's a cross-temporal motif
- **Before creating a node, grep:** `grep -rn "^id: \"<slug>\"" .`. If a conflict exists, decide the rename **before** running the build.
- **Slug registry:** `canonical-slugs.md` (auto-regenerated by `build_dashboard.py`).

---

## 8. What the viewer renders (so you know what your edges look like)

The atlas viewer (`index.html` + `src/js/`) reads `data.js` (generated by `build_data.py`) and renders ~25 views: **Pantheon** (deity ring, 7-bucket edges, family hulls), **Documents** (radial polar — angular = tradition family, radial = time), **Timeline**, **Scripture Reader**, **Transmission** (shortest-path bridges), **Atlas** (geographic map), **Astrology** (5 modes: spine / wheel / now / decanic / pantheon), **Alphabets** (6 modes incl. glyph viewer), **Alchemy**, **Morals**, **Rituals**, **Philosophy**, **Mathematics**, **Music**, **Medicine**, **Patterns**, **Observations**, **Chains**, plus list views (Authors, Themes, Connections, Traditions, All-nodes, About).

The Pantheon V2 view (`src/js/views/pantheon-v2.js`) is the **design prototype** the project is extrapolating from — its 7-bucket edge palette + premultiplied-alpha opacity tiers + family hulls + state machine are the canonical visual grammar. The other views are being migrated to consume the same primitives. UX work happens in Lane B and is serialized (one agent at a time); see [`LANES.md`](LANES.md).

**What every content node contributes to the viewer:** its `id`, `type`, `title`, `tradition`, family color (derived), date range, region, themes, refs, body — plus every edge field. The thumbnail comes from `fetch_thumbnails.py` (Wikipedia REST API) and is injected at build time; don't write `thumbnail:` into YAML, use `depictions[]` to override.

---

## 9. What's NOT in this file

For SOP and workflow, read:
- [`CORE-THEMES.md`](CORE-THEMES.md) — the canonical hunt-list (themes / symbols / rituals / morals) with slugs and edge buckets. Use as the dissection lens.
- [`PROTOCOL.md`](PROTOCOL.md) — the absorb-and-dissect SOP, the four laws (WIRING / INTEGRITY / GOBLIN-AUDIT / APP-CODE-SERIALIZES), the YAML skeletons.
- [`LANES.md`](LANES.md) — the two-lane workflow + path map + pre-commit hook behavior.
- [`ACTIVE-CONTENT.md`](ACTIVE-CONTENT.md) — investigation lane in-flight claims.
- [`ACTIVE-UX.md`](ACTIVE-UX.md) — UX lane (single slot).
- [`ABSORPTION-QUEUE.md`](ABSORPTION-QUEUE.md) — high-value primary texts not yet absorbed.
- [`DASHBOARD.md`](DASHBOARD.md) — auto-generated live state.
- [`MASSIVE-WINS-INDEX.md`](MASSIVE-WINS-INDEX.md) — full catalog of cross-tradition findings with vault-node pointers.

For reference (deeper but optional):
- [`canonical-slugs.md`](canonical-slugs.md) — slug registry.
- [`label-taxonomy.md`](label-taxonomy.md) — document-label conventions.
- [`tradition-vocabulary.yaml`](tradition-vocabulary.yaml) — tradition canonical names + family classifier.
