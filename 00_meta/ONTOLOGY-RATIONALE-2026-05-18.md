# ONTOLOGY RATIONALE — Pass 2 (Lock), 2026-05-18

> **Permanent record.** This document captures the reasoning behind every choice in the 26-lens ontology lock of 2026-05-18.
>
> **Rule:** any future proposal to change the lens set, rename a lens, merge two lenses, or split one must **argue against the reasoning recorded here**. If the proposer cannot beat the existing rationale on academic, ontological, or pragmatic grounds, the change is rejected. If they can, the result is a **NEW dated rationale doc** (`ONTOLOGY-RATIONALE-YYYY-MM-DD.md`) that supersedes the relevant sections of this one — never an edit to this file. This file is **append-only after sign-off** (sign-off below).
>
> This rule exists because the ontology is the spine of the entire project. Slug names + folder structure + type semantics propagate into every node, every edge, every build script, every view. Changing them costs vault-wide migrations. They must be locked deliberately and changed only with the same deliberation.

---

## 0. Sign-off

**Conversation:** John ↔ opus, 2026-05-18 evening.
**Pre-existing state:** 16-lens ontology (01–07, 09–17; slot 08 historically empty).
**Locked state:** 26-lens ontology (01–26).
**Outcome:** John reviewed the full proposal (this document's content as conversational drafts), gave explicit greenlight: *"option B of course on calendars. that's your recco and the strongest. all your reccos follow greenlight and please write all this rationale to be followed, any revision in the future will have to redo this rationale again."*

---

## 1. The framing distinction: ontology lenses vs. app tabs

A confusion that came up early in the conversation and needs to stay clear forever:

- **Ontology lens** = a folder on disk under the vault root (`03_deities/`, `14_rituals/`, etc.). Nodes physically live in exactly one lens. The lens determines the node's primary type. Renaming a lens means moving every node + updating every `[[wikilink]]` + updating every YAML field that references its type — a vault-wide migration.
- **App tab** = a surface in the viewer that filters/presents/composes nodes (often cross-lens). Tabs can be added, renamed, retired without touching the vault disk structure.

**Mapping is not 1:1.** The Scripture tab is a *filter view* of `02_documents/` (documents where `is_scripture: true`). The Astrology tab is a *cross-cutting view* that pulls astrology-tagged nodes from many lenses. The Pantheon tab is *one view of* `03_deities/`.

**This rationale doc is exclusively about ontology lenses.** Tab decisions are downstream (deferred to a separate `TABS.md` when John signals it).

---

## 2. The 10 new lenses — each with its case

Each new lens was admitted only when it cleared one of three bars:

- **(a) Distinct ontological category** that scholarship treats separately and that cross-cuts existing lenses in ways tags cannot capture cleanly.
- **(b) MASSIVE-WIN content already flagged in `ONTOLOGY.md` §4** that has no proper home today.
- **(c) Node type already used in code** (e.g. Forge mode dropdown) without a corresponding folder.

### 2.1 `08_places/` — Places & Geographic Loci

**Type:** `place`. **Bars cleared:** (a), (c).

**Rationale:** filled the historic slot-08 gap. The `place` type was already used by the Forge mode dropdown but had no folder. Geographic entities (Alexandria, Jerusalem, Mecca, Varanasi) function as cross-tradition convergence points and deserve first-class node sheets, not just tags scattered across deity/person/document nodes. Standard historical-geography practice (Talbert's *Barrington Atlas*, the Cambridge ancient/medieval histories) treats places as first-class.

**Symmetry note:** `01_timeline/` is *when*. `08_places/` is *where*. This is intentional and aesthetically clean.

**Boundary with `20_sacred_architecture/`:** a place is a geographic locus with broad cultural significance. A sacred site is a specifically religiously-charged location (built or natural). Mecca-as-city is a `place`; the Kaaba (specific sacred structure within Mecca) is a `sacred-site`. Both can exist with an edge between them.

**Rejected alternative:** "keep places as tags on existing types." Rejected because cross-tradition convergence points (Alexandria, Toledo) need narrative space the tag system can't provide.

### 2.2 `18_languages/` — Languages & Linguistic Families

**Type:** `language`. **Bars cleared:** (a).

**Rationale:** a *language* is a linguistic system (Sanskrit, Akkadian, Ge'ez); an *alphabet/script* is the visual symbol set used to encode one or more languages. Devanagari writes Sanskrit + Hindi + Marathi. Arabic script writes Arabic + Persian + Urdu + Ottoman Turkish. Hebrew alphabet writes Hebrew + Yiddish. Conflating language with alphabet is the exact same error as conflating astronomy with astrology (see 2.3) — and was the existing state of the vault.

**Why it matters for the project's mission:** transmissions follow linguistic boundaries. Sanskrit-knowing scholars carried Vedic ideas into Greek-knowing Mediterranean. Arabic-knowing translators (Hunayn ibn Ishaq, Toledo translators) carried Greek philosophy into Latin Europe. The language itself is a transmission medium — currently invisible in the graph.

**Academic anchor:** standard comparative-linguistics taxonomy (Bernard Comrie *The World's Major Languages*; Ethnologue; Glottolog; SIL classification).

**Boundary with `11_alphabets/`:** alphabet/script in 11_; language in 18_. Cross-edged via `script-used:` and `texts-in-language:` fields.

### 2.3 `19_astronomy/` — Astronomy (Observational Science)

**Type:** `astronomy`. **Bars cleared:** (a), (b).

**Rationale:** Astronomy = observational and predictive science. Astrology = symbolic/divinatory interpretation. Conflating them is a 19th-century populist habit; serious scholarship has kept them firmly distinct since Otto Neugebauer (*The Exact Sciences in Antiquity*, 1957), David Pingree (*From Astral Omens to Astrology*, 1997), Francesca Rochberg (*The Heavenly Writing*, 2004).

The two have **overlapping practitioners historically** (Ptolemy wrote both *Almagest* AND *Tetrabiblos*) — expressed via cross-lens edges between the astronomer node here and their astrological work elsewhere. The ontological categories themselves stay distinct.

**John's specific direction:** *"astronomy should be astronomy, astrology should be astrology (even that then we place them under the same tab later)."* The display-layer combination is acceptable; the ontology-layer conflation is not.

**Where astrology lives:** for now, as cross-cutting tags + the existing Astrology UI tab. Astrological divination systems (Hellenistic horary, Vedic Jyotisha, Mesoamerican Tonalpohualli when used divinatorily) live in `25_divination/`. Astrology-as-symbolic-system (zodiac signs, planetary correspondences) can live in `06_themes/` (becoming `06_motifs/`) or `09_symbols/` as appropriate. **If astrology accumulates enough volume to warrant its own folder later, promote it then.** Don't pre-create the folder.

**Boundary with `16_mathematics/`:** Astronomy uses mathematics (Ptolemaic epicycles, Aryabhata's trigonometry, Kepler's geometry) but is observation + prediction first. Mathematical content within an astronomical work cross-links to `16_mathematics/`.

### 2.4 `20_sacred_architecture/` — Sacred Architecture & Sites

**Type:** `sacred-site`. **Bars cleared:** (a), (c).

**Rationale:** religiously-charged sites and structures form a distinct ontological category recognized by the discipline of architectural / spatial religion-studies (Mircea Eliade's *axis mundi*; Lindsay Jones's *The Hermeneutics of Sacred Architecture*; Karen Britt's work on Byzantine basilicas; Holland Cotter's surveys; Wendy Doniger on Hindu temple-as-cosmology).

**Decision: combined lens for built and natural sacred sites.** Splitting into two lenses (built monuments vs natural sacred sites) was considered and rejected because the conceptual category "places of religious significance carrying religious charge through built or natural form" is what scholarship treats unified. Borobudur is both built structure AND embodiment of Mt. Meru cosmology. Mount Sinai is both natural mountain AND locus of the monastery of St. Catherine. The unified lens preserves these cross-form continuities.

**Boundary with `08_places/`:** Place = geographic/cultural locus. Sacred-site = specifically religiously-charged location (built or natural). When a place is also a sacred site (Jerusalem, Varanasi), both nodes can exist and cross-link via edge — the place node carries geography + cultural history, the sacred-site node carries religious-architectural detail.

**Boundary with `09_symbols/`:** Symbol = abstract iconographic unit (the stupa-form as visual concept). Sacred-site = specific physical locus (Sanchi Stupa, Borobudur Stupa). Cross-edged.

### 2.5 `21_theology/` — Theology & Doctrinal Systems

**Type:** `doctrine`. **Bars cleared:** (a).

**Rationale:** **Theology** = systematic reflection *within* a religious tradition on its own claims, operating under that tradition's revelatory authority; outputs are tradition-specific doctrines (Chalcedonian Christology, Tawhid as kalām-formulated, Trikāya). **Philosophy** = rational inquiry that may or may not be religious; operates under non-tradition-specific argumentation; outputs are philosophical positions.

Aquinas wrote both *Summa Theologica* (theology — Catholic doctrinal synthesis) AND his Aristotelian commentaries (philosophy). Plotinus wrote both Neoplatonic metaphysics (philosophy) AND theurgic / mystical-union doctrines (theology-adjacent). Shankara wrote both Vedanta (theology within Hindu tradition) AND general epistemological arguments (philosophy). The outputs are different categories.

Modern academic theology treats this distinction as bedrock: Bernard McGinn, Sarah Coakley, Khaled Anatolios, Lewis Ayres, Jaroslav Pelikan.

**Why also separate from `06_themes/` (becoming `06_motifs/`):** Motifs = recurring narrative or conceptual *units that travel cross-tradition* (the resurrection-of-the-dead motif). Doctrines = specific worked-out positions *within* a tradition (Chalcedonian Christology = specific 5th-c. position from the 451 council). "Resurrection of the dead" is a motif (appears in Zoroastrian, Jewish, Christian, Islamic forms). "Chalcedonian Christology" is a doctrine.

### 2.6 `22_practices/` — Mystical & Contemplative Practices

**Type:** `practice`. **Bars cleared:** (a).

**Rationale:** Rituals (`14_rituals/`) = public/communal performative acts (Eucharist, salat, puja, fire sacrifice, festival). Practices (`22_practices/`) = inner/contemplative disciplines, often private or small-group, aimed at transformation of consciousness or character (dhikr, hesychasm, lectio divina, vipassana, dzogchen, neidan, kabbalistic meditation).

The distinction is canonical in the academic study of mysticism — William James (*Varieties of Religious Experience*), Evelyn Underhill (*Mysticism*), Bernard McGinn (the multi-volume *Presence of God*), Bhaskar Mishra, Robert Forman, Sarah Coakley on *bodily practices*.

**Edge case acknowledged:** dhikr performed in a Sufi *halqa* (circle) is both communal (ritual-shaped) AND contemplative (practice). Two nodes can exist (`dhikr-sufi` as practice, `sufi-halqa-circle` as ritual form) cross-linked.

**Why also separate from `15_philosophy/`:** Practices are *methods*; philosophy includes theory *of* such methods but is not the method. Patañjali's *Yoga Sutras* is a philosophical text *about* yoga; the practice of asana / pranayama / dhyana lives here.

### 2.7 `23_material_culture/` — Material Culture, Relics & Ritual Objects

**Type:** `relic`. **Bars cleared:** (a).

**Rationale:** Symbols (`09_symbols/`) = abstract iconographic units (the cross AS sign). Material culture (`23_material_culture/`) = specific physical instances with provenance, contested authenticity, location history, ritual function (the True Cross AS claimed physical artifact, the Ark of the Covenant AS claimed physical object, the Black Stone of Mecca, the Shroud of Turin, the Tabot).

Academic anchor: material-culture studies (Bruno Latour, Daniel Miller); religious-studies subfield "material religion" (Birgit Meyer, David Morgan); art-historical study of relics (Cynthia Hahn *Strange Beauty*).

Each artifact carries its own bibliography, controversies, claimed authenticity status. Cross-edged with the symbol it embodies (`true-cross-relic —is-instance-of-symbol→ cross-symbol`).

### 2.8 `24_pharmacology/` — Pharmacology, Materia Medica & Sacred Substances

**Type:** `substance`. **Bars cleared:** (a), (b).

**John raised this in conversation:** *"i want to add pharmacology (or if you think its better to use it under medicine? here we should add also herbs or expect that kind of sub sections)."*

**Rationale (why separate from Medicine):** Substances (herbs, sacred plants, minerals, animal products, prepared compounds) are a distinct *ontological category* — they're THINGS, not practitioners, not practices, not texts. They **cross-cut domains** in a way pure-medicine doesn't:

- **Soma** = Vedic ritual + medicine + theology + cosmology
- **Haoma** = Zoroastrian ritual + medicine
- **Kykeon** = Eleusinian mystery + medicine (ergot hypothesis)
- **Ayahuasca** = Amazonian shamanic + medicine + modern psychedelic-therapy literature
- **Mercury / Sulfur / Salt** = alchemy + medicine + metallurgy
- **Mandrake** = Genesis (Reuben/Leah) + medieval European magic + medicine
- **Blue lotus** = Egyptian ritual + cosmology + pharmacology

ONTOLOGY.md §4-B (MASSIVE-WINS) explicitly flags "six independent pharmacopoeia traditions" as headline content — the volume is real and needs a home.

**John's explicit confirmation that herbs go here:** *"here we should add also herbs."*

**What stays in `17_medicine/`:** healing systems, traditions of healing, theory (humoural, dosha, five-phase), specific healers/physicians, the Asklepion / Aesculapian incubation tradition, medical-treatise *literature* (text-as-document goes in `02_documents/`; the substances each text catalogs go here).

**What stays in `12_alchemy/`:** alchemical processes, operations, practitioners, texts, concepts. The alchemical substances (mercury, sulfur, salt, lead, antimony, etc.) move here and are cross-edged back to the alchemist / text that uses them.

### 2.9 `25_divination/` — Divination & Oracular Systems

**Type:** `divination-system`. **Bars cleared:** (a), (b).

**Rationale:** Ritual = a *performative act* done for religious purpose. Divination = a *consultation* of a sign-system to read what is hidden (present-state, future, hidden order, the will of powers). The structural logic is different: ritual = participation/transformation; divination = information extraction.

**MASSIVE-WIN already flagged:** Yi Jing ↔ Ifá is one of the headline cross-tradition findings in ONTOLOGY §4-B — *"Universal binary divination: Yi Jing (64 hexagrams) ↔ Ifá (256 Odù) — both 4,000-year-old binary-permutation systems on opposite sides of the Atlantic."* Today this content has no proper home.

Divination systems are structurally comparable in ways that beg cross-lens analysis (binary vs ternary vs fourfold vs continuous; deterministic vs probabilistic; expert vs lay; mediumic vs textual). Cross-cuts symbols (Tarot trumps), mathematics (Yi Jing binary), traditions, music (some Yoruba divination uses sung verses), psychology (Jung on Yi Jing).

Academic anchor: David Zeitlyn (*Divinatory Logics*), William Sax, Stephan Palmié (*The Cooking of History* on Ifá), Richard Smith (*Fortune-tellers and Philosophers* on Chinese divination), John Skorupski.

### 2.10 `26_calendars/` — Calendars & Time-Reckoning Systems

**Type:** `calendar-system`. **Bars cleared:** (a).

**John raised this in conversation; explicitly chose Option B** (own lens, not distributed): *"option B of course on calendars. that's your recco and the strongest."*

**Rationale:** calendars genuinely cross-cut multiple existing lenses in a way no other entity does at this scale:
- They encode **astronomy** (lunar / solar / synodic observation)
- They encode **mathematics** (intercalation algorithms; cycle calculation; sexagenary arithmetic)
- They encode **ritual** (when festivals fall; when fasts begin; when sacrifices happen)
- They encode **agriculture** (when to plant, harvest, slaughter)
- They encode **cosmology / tradition** (the Vedic yugas; the Mayan world-ages)

Each calendar is therefore a *system* — not reducible to any one of its constituents. Treating it as a first-class node means we can: catalog the system's formal structure (cycle length, intercalation rule, epoch); catalog the tradition's ritual rhythm derived from it; cross-link cleanly (this calendar drives this ritual, uses this astronomical observation, encodes this cosmology).

The alternative — distributing calendar information as ad-hoc text inside tradition or ritual nodes — was the prior state and makes the cross-tradition patterns (lunar vs solar, intercalation strategies, epoch choice, festival-anchoring) invisible.

---

## 3. Naming refinements on existing lenses

### 3.1 `03_deities/` — note about demons

**Before:** "Every named god, divinity, divine figure, principal demon" — flat list, no flag.
**After:** Description now explicitly notes that *demon* is typically a polemic relabeling by a competing tradition, tracked via the Polemic edge bucket. Demonic and "fallen" figures live in `03_deities/` because the polemic-relabeling is itself a transmission/inversion pattern, not an ontological distinction.

**Why:** the original phrasing risked the project appearing to endorse the labeling. Vedic *asura* → Zoroastrian *ahura* (heroic) AND Vedic *deva* → Zoroastrian *daēva* (demonic) is the canonical demonstration that "demon" is a polemic category, not an inherent one. Canaanite Baʿal → Hebrew Bible Baʿal-as-false-god is another. Egyptian Set → late-period demonization is another.

### 3.2 `04_persons/` — "heresiarchs" contextualized

**Before:** "Prophets, scribes, kings, philosophers, redactors, founders, translators, heresiarchs"
**After:** "...dissident teachers. The term-of-art 'heresiarch' is sometimes used in academic literature when describing how a dominant tradition framed dissident figures (Marcion, Arius, Mani, Pelagius, Eckhart). It is itself a polemic label and we use it only with that flag."

**Why:** "heresiarch" unflagged reads as the project endorsing the polemic. Academic-standard practice keeps the term but contextualizes it. The figures themselves go in `04_persons/` as `dissident-teacher` or similar; the framing of them as "heresiarchs" is documented as the polemic-act of the dominant tradition.

### 3.3 `17_medicine/` — "shamanic" expanded

**Before:** "Healing traditions: Ayurveda, Hippocratic, Islamic Golden Age, Asklepion, TCM, shamanic"
**After:** "Healing traditions: Ayurveda, Hippocratic, Islamic Golden Age (Avicenna, al-Razi), Asklepion (incubation healing), TCM, **indigenous healing traditions** (Siberian / Mongolic shamanic in the original sense, Amazonian *ayahuasquero* and *vegetalismo*, sub-Saharan divinatory healing, Aboriginal Australian, Mesoamerican *curandero*)."

**Why:** "Shamanic" as a single umbrella flattens distinct traditions and over-applies a Siberian-Tungusic term. Academic standard (Beatriz Caiuby Labate, Jeremy Narby, Eduardo Viveiros de Castro, Marshall Sahlins) names the specific traditions; keeps "shamanic" for the Siberian context.

### 3.4 Mission statement (§1) — added "mystical"

**Before:** "the entire corpus of humanity's primary religious, philosophical, and scientific texts"
**After:** "...primary religious, philosophical, scientific, and mystical texts"

**Why:** mystical literature (Sufi *masnavi*, Christian apophatic texts, kabbalistic Zohar, Daoist *neidan* manuals, Vedanta non-dual treatises) is a genuine fourth category not cleanly subsumed by the other three. Marking it explicitly aligns the mission with the addition of `21_theology/` and `22_practices/` lenses.

### 3.5 Pending: `06_themes/` → `06_motifs/` (rename, deferred to next Lane B window)

**John's instinct in conversation, confirmed:** *"will motifs be better to use? then we get themes free for another need?"*

**Why rename:** academic distinction.
- **Motif** = a specific recurring narrative or iconographic element that travels (flood, dying-rising god, cosmic dualism, sacred marriage, demiurge). Stith Thompson's *Motif-Index of Folk-Literature*, Wendy Doniger's *The Implied Spider* — both call these motifs.
- **Theme** = a broader unifying idea or concept (redemption, cosmic order). Literary-criticism term, higher-level abstraction.

The folder currently holds motifs in the strict sense, not themes. Renaming is academically more accurate AND frees "theme" terminology for higher-level grouping (today expressed as the `category:` field on each motif).

**Why deferred:** the rename touches `build_data.py` (the hardcoded `NODE_TYPE_MAP`), 5 other Python scripts (`build_dashboard.py`, `lint_yaml.py`, `fetch_thumbnails.py`, `review_thumbnails.py`, `fetch_wikidata_thumbnails.py`), 339 node files (each needs `type: theme` → `type: motif`), every other node's `themes:` YAML field references (vault-wide find-replace), view modules in `src/js/views/`, and the Forge mode dropdown. All of those are Lane B paths. The rename has to ship as one atomic Lane B batch.

**Current state until rename:** keep using `type: theme` and the `06_themes/` folder. The slug stems are unchanged by the rename; only the folder name + type field flip.

---

## 4. Decisions explicitly rejected (kept as-is)

### 4.1 Rituals → Traditions rename — **REJECTED**

**John proposed in conversation:** *"rituals we should change the name to Tradition? then inside we can have the categories including Rituals to be precise?"*

**Conversation outcome:** rejected (John agreed after the explanation).

**Why rejected:** they're different ontological layers and conflating them loses information.
- `07_traditions/` = the *abstract bucket* (Christianity, Sufism, Vedic religion, Yoruba religion) — a "container" identity.
- `14_rituals/` = the *concrete acts* (Eucharist, Wudu, Soma sacrifice, Bembé) — performable practices.

A ritual *belongs to* a tradition via an edge (`Eucharist —attestation-in→ Christianity`). The graph already expresses the hierarchy without losing the distinction.

### 4.2 Scripture as a separate lens — **REJECTED**

**Why rejected:** Scripture is a *filtered view of* `02_documents/`, not a new lens. Scripture-class documents have `is_scripture: true` (or a `scripture` tag). The Scripture tab and Scripture Reader are views that filter to those. Same nodes on disk, different presentation. No ontology change needed.

### 4.3 Geometry as a separate lens — **REJECTED**

**John raised:** *"Geometry is important, should that be under mathematics?"*

**Conversation outcome:** keep under Mathematics.

**Why:** Geometry IS mathematics. Euclid is the canonical geometer. The Sulba Sutras are explicitly mathematical-ritual texts. The Pythagoreans didn't separate "the math" from "the mysticism" — it was one practice. Imposing a modern split distorts the historical reality.

Visual/symbolic sacred-geometry forms (Flower of Life, Sri Yantra, Metatron's Cube, mandala patterns, Islamic geometric tessellations) live in `09_symbols/` (as iconographic units) and cross-link to `16_mathematics/` for the algorithmic/theoretical layer.

### 4.4 Splitting Sacred Architecture into "built" vs "natural sites" — **REJECTED**

See 2.4 above. Eliade's tradition treats them unified; splitting loses the cross-form continuities.

### 4.5 Art / specific artworks as own lens — **DEFERRED**

**Why deferred (not rejected):** harder boundary calls. Illuminated manuscripts are both `document` (the text) and `material-culture` (the physical artifact) and art (the illumination program). Specific paintings (Ghent Altarpiece, Sistine Chapel) sit awkwardly between symbol (iconographic content), material-culture (specific physical object), and document (theological content). For now: tag on existing types. Revisit if volume demands.

### 4.6 Sects / monastic orders as own lens — **REJECTED**

Sub-units of traditions (Franciscans, Cistercians, Sufi *tariqas*, Buddhist sangha lineages, Hindu *sampradayas*) live in `07_traditions/` with `parent-tradition:` linkage. Promotion to own lens is not needed; the parent-tradition field handles hierarchy.

### 4.7 Magic/theurgy systems as own lens — **REJECTED**

Lives distributed: `22_practices/` (the practice of magic, theurgic ascent), `14_rituals/` (specific magical rites), `12_alchemy/` (when alchemical), `25_divination/` (when divinatory), `02_documents/` (grimoires).

### 4.8 Mystery cults as own lens — **REJECTED**

Eleusinian, Orphic, Mithraic, Hermetic, Masonic, Rosicrucian live in `07_traditions/` with `category: mystery-cult` or `category: initiatic-order`. They ARE traditions (just initiatic ones).

### 4.9 Pilgrimage as own lens — **REJECTED**

Hajj, Camino de Santiago, Char Dham, Saigoku, Shikoku live cross-folder: place node (the destination) + ritual node (the pilgrimage act) + practice node (the contemplative dimension if any). Tag as `category: pilgrimage` on rituals. Don't split.

### 4.10 Eschatons / afterlife geographies as own lens — **REJECTED**

Sheol, Hades, Naraka, Heaven/Hell, Pairidaeza/Paradise, Bardo, Aaru live in `06_themes/` (becoming `06_motifs/`) as eschatological motifs, with `category: eschatological-geography`. They're motifs that travel cross-tradition (Persian *pairidaeza* → Greek *paradeisos* → Christian paradise = a documented transmission).

### 4.11 Cosmological systems as own lens — **REJECTED**

Ptolemaic universe, Norse cosmology (Yggdrasil), Buddhist Mt. Meru, Vedic cosmology, Mayan world-ages live in `21_theology/` (when doctrine-formulated) and/or `06_themes/` (when narrative-mythic). They are doctrinal/mythic formulations, not separate entities.

### 4.12 `Morals` → `Ethics` rename — **DEFERRED (no decision needed yet)**

Both terms are defensible. "Morals" is current and accessible. "Ethics" is more strictly academic. No migration urgency; revisit only if a strong reason emerges.

---

## 5. Sub-categories handled via `category:` field (not new lenses)

These concepts are real and worth tracking, but they get a `category:` tag on the most relevant existing lens rather than their own folder. Listed here so the convention is uniform across agents.

| Concept | Home lens | Category tag |
|---|---|---|
| Pilgrimage | `08_places/` + `14_rituals/` | `category: pilgrimage` |
| Sacrifice systems | `14_rituals/` | `category: sacrifice` |
| Rites of passage | `14_rituals/` | `category: rite-of-passage` |
| Mystery cults | `07_traditions/` | `category: mystery-cult` |
| Esoteric orders (Masonic, Rosicrucian, Theosophical Society) | `07_traditions/` | `category: esoteric-order` |
| Sufi orders (*tariqas*) | `07_traditions/` | `category: sufi-tariqa`, `parent-tradition: islam-sufism` |
| Buddhist sangha lineages | `07_traditions/` | `category: sangha-lineage`, `parent-tradition: <tradition>` |
| Hindu *sampradayas* | `07_traditions/` | `category: sampradaya`, `parent-tradition: <tradition>` |
| Monastic orders | `07_traditions/` | `category: monastic-order`, `parent-tradition: <tradition>` |
| Magic / theurgy systems | `22_practices/` + `14_rituals/` | `category: magic` or `category: theurgy` |
| Apocalyptic literature | `02_documents/` | `category: apocalyptic` |
| Liturgical music vs ritual music | `10_music/` | `category: liturgical` / `category: ritual-music` |
| Eschatons / afterlife geographies (Sheol, Naraka, Bardo, Aaru) | `06_themes/` (→ `06_motifs/`) | `category: eschatological-geography` |
| Cosmological systems (doctrinal) | `21_theology/` | `category: cosmological` |
| Cosmological systems (mythic-narrative) | `06_themes/` (→ `06_motifs/`) | `category: cosmogonic` |
| Sacred plants (specific) | `24_pharmacology/` | `category: sacred-plant` or `category: psychoactive-plant` |
| Individual festivals / holy days | `14_rituals/` | `category: festival` |
| Specific historical councils (Nicaea, Chalcedon, Vatican II) | `05_events/` | `category: ecumenical-council` |

---

## 6. Migration discipline (how this lock was applied — for future reference)

The lock shipped in this sequence (commits on `main`, 2026-05-18):

1. **C1 (`4ba1a2b`)** — created 10 new folders + READMEs (Lane A only).
2. **C2 (`f52528c`)** — updated `00_meta/ONTOLOGY.md` to the 26-lens version with all naming refinements (master-file update via explicit decision).
3. **C3 (`febbe6f`)** — updated `00_meta/LANES.md` path-map to recognize the new folders (master-file update via explicit decision).
4. **C4 (this commit)** — this rationale doc.
5. **C5 (next commit)** — STATUS + HANDOFF + memory note + release Lane A claim.

**Deferred to next Lane B window (queued atomically — must ship together):**

- Themes → Motifs rename (`06_themes/` → `06_motifs/`, type field, YAML field references vault-wide)
- `build_data.py` `NODE_TYPE_MAP` updates for all 10 new lens types
- `build_dashboard.py` aware of new types
- `lint_yaml.py`, `fetch_thumbnails.py`, `review_thumbnails.py`, `fetch_wikidata_thumbnails.py` updated for new folders
- Forge mode dropdown (`src/js/engine/graph/mode.js` or equivalent) updated to include new node types as renderable modes
- Pre-commit hook (`scripts/git-hooks/pre-commit`) regex widened from `[01-17]_` to `[01-26]_` and re-installed locally
- `CORE-THEMES.md` → `CORE-MOTIFS.md` rename + content audit

**Why deferred:** every item touches Lane B paths; John was working on Lane B (Forge map DEV) when the lock was applied. The deferred batch ships as one atomic Lane B claim when the slot is next free.

**Investigation agents in the interim:** may begin staging nodes in the 10 new folders today. Use the `type:` value documented in the relevant folder's `README.md`. Nodes will appear in the graph the moment the deferred Lane B batch lands.

---

## 7. How to change the ontology in the future

This is the rule John explicitly asked be recorded:

1. **Read this rationale doc first.** Every choice has reasoning.
2. **If you can beat the reasoning** — on academic, ontological, or pragmatic grounds — write a new dated rationale doc: `00_meta/ONTOLOGY-RATIONALE-YYYY-MM-DD.md`. Do not edit this file or any prior rationale doc.
3. **The new rationale doc must:**
   - Reference this one explicitly.
   - State which sections of this one it overrides.
   - Argue the override on its merits.
   - Carry John's sign-off (a §0 like this one).
4. **Apply the change with the same migration discipline** — atomic commits, build-script updates in the same batch as folder/type changes, the works.
5. **Update `00_meta/ONTOLOGY.md`** to the new state.
6. **Update `00_meta/LANES.md`** if path-map changes.
7. **Memory pin** so future agents know about the new rationale doc.

Rationale docs are append-only. The chain of dated rationales is the project's institutional memory on ontology decisions.

---

## 8. End of pass 2 lock

26 lenses. 10 new. 4 naming refinements. 12 explicit rejections (with reasoning). 1 rename queued for next Lane B window (themes → motifs).

The spine is locked.

— signed: opus, on John's explicit greenlight, 2026-05-18 evening, Brave / macOS / DPR 2 / Forge tab active.
