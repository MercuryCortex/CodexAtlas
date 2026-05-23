# Edge-Vocabulary Deep Audit — 2026-05-23

**Scope.** Audit the 9-type edge vocabulary locked into PROTOCOL §3.1 (`same-as`, `cognate`, `interpretatio-*`, `direct-borrowing`, `ancient-identification`, `substrate-influence`, `scholarly-parallel`, `parallel-motif`, `polemic-against`/`polemic-inversion`) plus the in-use extensions (`avatara-of`, `constituent-of`, `folk-syncretism`, `continuous-development`), against academic comparative-religion vocabulary and existing data ontologies. Goal: make sure the schema we lock survives a Wikidata-aligned, scholarship-defensible read.

Verdict in one sentence: **the 9-type core is sound and maps cleanly onto the dominant scholarly frameworks (Smith 2008, Assmann 1996/2008, Parker 2017, Burkert 1992); 4 additions are recommended; 2 renames clarify scholarship intent; 2 bucket-routings should be re-thought.**

---

## 1. Headline findings (actionable)

**Add to catalog (in priority order):**

1. **`functional-equivalent`** (parallel bucket) — Dumézil's trifunctional/role-class equivalence (e.g. Odin/Varuna/Jupiter as sovereignty-class; Thor/Indra as warrior-class). Currently collapsed into `scholarly-parallel`, but it's a *structurally distinct* claim with its own century-long scholarship.
2. **`iconographic-borrowing`** (transmission bucket) — visual-form transmission with no doctrinal or name identity (Apollonian → Gandharan Buddha; horned-god iconography). Parker (2017) and Bonnet/Pirenne-Delforge make this a distinct mechanism from named interpretatio.
3. **`demonization`** (polemic bucket) — distinct from `polemic-inversion`. Demonization preserves the figure as a real-but-evil being (Augustine on pagan gods); polemic-inversion morally flips the *name* of a venerated figure (Marduk → Yaldabaoth). The two get conflated; scholarship keeps them apart.
4. **`manifestation-of`** (kinship bucket) — covers honji-suijaku/gongen, avatara-of, hypostasis, and other "X is a local/temporal manifestation of Y" relations *within or across* traditions. Currently `avatara-of` works only for Vaishnava cases; a generalised type lets Amaterasu-as-suijaku-of-Mahavairocana, Christ-as-incarnation-of-Logos, and the Hindu avatara share a node.

**Rename / clarify:**

5. **`scholarly-parallel` → `comparative-parallel`** — "scholarly" reads as a quality grade; "comparative" names the actual category (J.Z. Smith's *analogical comparison* in *Drudgery Divine* 1990).
6. **`same-as` → `tradition-internal-identity`** (or keep `same-as` but document it explicitly is *internal-claim only*) — current label could be read as a scholarly identity assertion. The intended meaning is "the tradition claims X *IS* Y" (Nicene Father = YHWH); the term needs to make clear it is a *first-person dogmatic* claim, not our editorial claim.

**Bucket-routing corrections:**

7. **`interpretatio-*` should be split**: name-only translation (Tacitus calling Wōden "Mercury") is fundamentally *Translation* in Assmann's sense — closer to **parallel** than **fusion**. Reserve **fusion** for cases where a *new* combined cult/figure emerges (Sarapis, Hermes-Thoth, Hermes Trismegistus). Recommend: `interpretatio-*` → **parallel** (translation), reserve **fusion** for `folk-syncretism` + a new `composite-deity` type (see §6).
8. **`ancient-identification` is awkwardly placed** in fusion — Herodotus saying Apollo = Horus is `interpretatio-graeca` performed by a named ancient. Either fold it into `interpretatio-graeca` with a `source:` qualifier, or rename to make clear it's an *attested* identification (which routes to **attestation** bucket as a meta-claim *about* an interpretatio).

**Add one composite/fusion-bucket type:**

9. **`composite-deity`** (fusion bucket) — Sarapis (Osiris+Apis+Hades+Dionysos elements), Hermes Trismegistus (Hermes+Thoth), Amun-Re. Distinct from `folk-syncretism` (folk-level merger) and `interpretatio` (translation, not fusion). Egyptian theology explicitly treated these as a "new entity along with the two older gods" (Hornung; standard Egyptology).

---

## 2. Per-source survey

### Mark S. Smith, *God in Translation* (Eerdmans 2008)

**Directly on-topic.** Smith's framework distinguishes:

- **Horizontal translatability** — "the recognition of others' divinity across (and even despite) cultural and geographic boundaries" (across cultures).
- **Vertical translatability** — "translation of divinity through time within a particular culture" (within a tradition, over time).

Our catalog handles horizontal well, but `continuous-development` (Rudra → Shiva) is exactly Smith's *vertical translatability* — and the schema doesn't currently flag it as a distinct epistemic class. Recommend keeping `continuous-development` as a primary type and aligning its documentation to Smith's vocabulary.

### Jan Assmann, *Moses the Egyptian* (1997), *Of God and Gods* (2008), *Translating Gods* (1996)

Assmann's *translatio deorum* / *cosmotheism* frame: ancient polytheism treated gods as **internationally translatable** because they were **cosmic**. Different names → "the differentiated potencies of a single divine substance." Two big takeaways for us:

- **Interpretatio is *translation*, not *fusion*.** Assmann is explicit: the source culture's deity is unchanged, only the *name* is mapped. This is structurally a `parallel`/`scholarly-equivalence` relation, not a merger. **Recommend re-routing `interpretatio-*` to the parallel bucket** (or a new top-level "translation" sub-bucket).
- The *Mosaic distinction* (the move that ends translatability) is itself a typed event. Our `polemic-against` partially captures this, but the "rejection of translatability" is broader — it's what made YHWH-monotheism *categorically refuse* equivalents. Worth a documentation note on `polemic-against` even if no new edge-type.

### Walter Burkert, *Orientalizing Revolution* (1992) and *Structure and History in Greek Mythology and Ritual* (1979)

Burkert distinguishes **transmission carriers**: migrant craftsmen, wandering seers, scribal-poetic borrowing, raw-material trade. Our `direct-borrowing` and `substrate-influence` cover this, but Burkert's vocabulary distinguishes the *carrier mechanism* (craftsman vs. seer vs. text). Worth carrying as a `notes:` field convention, not a new type.

### Robert Parker, *Greek Gods Abroad* (UC Press 2017)

Parker's framework is the **modern gold standard** for interpretatio. He explicitly distinguishes:

- **Naming/onomastic** identification (theonymic mapping — Zeus-Ammon, Zeus-Hypsistos)
- **Iconographic** identification (visual form transfer — see Gandharan Buddha)
- **Cultic** identification (shared ritual practice)
- **Hierarchic categories**: supreme / ancestral / personal gods as Parker's typological axis

Parker also warns: *"iconographical identity does not necessarily mean theological identity or even ritual homogeneity"* — i.e. the three planes (name / image / cult) can decouple. **This is the strongest argument for adding `iconographic-borrowing` as a distinct type.**

### Jonathan Z. Smith, *Drudgery Divine* (1990), *Imagining Religion* (1982)

Smith reactivates Owen's distinction:

- **Homological / genealogical** comparison — resemblances explained by common historical descent (filiation, diffusion).
- **Analogical** comparison — postulated structural similarity without descent claim.

Smith argues *analogy* is the proper paradigm for comparative religion. **This maps directly onto our `transmission` vs `parallel` bucket split.** `cognate` and `substrate-influence` are *homological*; `parallel-motif` and `scholarly-parallel` are *analogical*. Recommend documenting the buckets in Smith's terms in PROTOCOL §3.1 so any reader can map our wires to canonical methodology.

### Wendy Doniger, *The Implied Spider* (1998)

Doniger's *microscope vs telescope* method: close cross-cultural detail-comparison (microscope) vs broad universal-pattern claims (telescope). Both legitimate at different scales. Practical implication: our `parallel-motif` is *telescope*-scale; our `cognate` and `direct-borrowing` are *microscope*. Worth noting in PROTOCOL prose but not a new edge-type.

### Mircea Eliade, *Patterns in Comparative Religion* (1958)

Eliade's *hierophany* + *morphology of the sacred* are phenomenological, not transmission-historical. Most modern scholarship treats his categories as suspect (J.Z. Smith's main target). Recommend: **do NOT add Eliadean "phenomenological identification"** as a type — it would silently authorise telescope-scale identity claims our schema rightly forbids. Note in PROTOCOL that we explicitly *reject* hierophany-style "all sun gods are X" identification.

### Georges Dumézil, *Mitra-Varuna* (1948), *Mythe et Épopée* (1968-73)

The **trifunctional hypothesis** — sovereignty / warrior / agrarian-fertility classes recur across IE pantheons (Odin–Thor–Freyr; Mitra-Varuna / Indra / Aśvins; Jupiter–Mars–Quirinus). Dumézil's claim is that the *function-class* matches across IE, not the individual figure. This is a *structural* not a *genealogical* claim. Our catalog collapses it into `scholarly-parallel`. **Recommend adding `functional-equivalent` as its own type** so a reader can tell "these are linguistically cognate" (`cognate`) from "these occupy the same structural slot in their respective IE pantheons" (`functional-equivalent`).

### Stewart & Shaw, *Syncretism/Anti-Syncretism* (Routledge 1994); Michael Pye 1971

Stewart & Shaw demarcate *syncretism* (politics of synthesis) vs *anti-syncretism* (boundary-defense). This maps to our fusion vs polemic split. Pye (Numen 1971) proposed *accretion → fusion → identification* as a process-typology — useful for explaining the *direction* of syncretism over time, but probably not a node-level edge type; better as a `process-stage:` qualifier.

### Carsten Colpe (multiple, 1975+)

Colpe distinguished *historical-genetic* vs *structural-phenomenological* determinations of syncretism — same Smith/Owen homology/analogy split. Already covered.

### Maijastina Kahlos, *Forbearance and Compulsion* (Duckworth 2009)

Kahlos distinguishes **tolerance** (no change required) from **concord** (unity-aiming). For our edges, this matters because `interpretatio-romana` and `polemic-against` are both *power-coded* claims — they say something about the *enframing* tradition. Recommend a `direction:` qualifier on polemic/interpretatio edges to make clear *who* is doing the claiming.

### Bruce Lincoln, *Theorizing Myth* (1999)

Lincoln treats classification itself as ideologically loaded. Practical implication: every edge-type IS a claim about power/authority. Our PROTOCOL should explicitly note the agent (source tradition; scholar; ancient writer) on every cross-tradition edge — already partially handled by `source:`, but worth tightening.

### Eusebius, *Praeparatio Evangelica*; Justin Martyr, 1st Apology (*logos spermatikos*)

The Christian apologetic move — "pagan philosophers possessed seeds of the Logos" — is a *positive* anti-syncretism: it identifies pagan thought as *prefiguring* the truth without merging traditions. **This is not captured anywhere in our catalog.** Recommend a `prefiguration-claim` type (polemic bucket — it is polemic in being one-directional and from-above) for cases like Justin's claim that Heraclitus and Socrates were "Christians before Christ", or for "Old Testament prefigures Christ" typological readings (Adam-as-type-of-Christ).

### Honji-Suijaku scholarship (Teeuwen, Rambelli 2003)

The Japanese honji-suijaku framework gives us a fully-developed alternative non-Greco-Roman vocabulary:

- `honji` (本地) = original ground
- `suijaku` (垂迹) = trace/local manifestation
- `gongen` (権現) = provisional manifestation
- `wakō dōjin` (和光同塵) = dimming-radiance mode
- `han-honji-suijaku` (反本地垂迹) = inverted form

Scholarship treats honji-suijaku as **structurally analogous to but distinct from interpretatio** because honji-suijaku is *deliberately unsystematized* and allows simultaneous contradictory identifications (Teeuwen & Rambelli, *Buddhas and Kami in Japan*, RoutledgeCurzon 2003). This is the cleanest case for adding **`manifestation-of`** as a separate edge type (kinship bucket) — works for honji-suijaku, Hindu avatara, Christian incarnation, Sufi/Ismaili imam-as-manifestation, all sharing a single ontological pattern.

### Vajrayāna *upāya* and dharmapāla absorption

Vajrayāna systematically absorbs local deities by re-classifying them as *dharmapāla* (Dharma-protectors) — distinguishing **lokapāla** (worldly, still in saṃsāra, ritually converted) from **lokottara** (supramundane, fully enlightened forms). This is structurally distinct from interpretatio: the local deity is *kept* but *subordinated and reframed* (Davidson, *Indian Esoteric Buddhism*, Columbia 2002). Maps onto our `substrate-influence`, but with the absorbing-tradition *acknowledging* the absorbed figure rather than denying it. Could be a `subordinating-absorption` sub-type; probably handle in `notes:` rather than a new top-level type.

---

## 3. Existing-ontology survey

### Wikidata

The properties most relevant to our edges (verified against Wikidata):

| Property | Label | Maps to our type |
|---|---|---|
| **P460** | "said to be the same as" (symmetric; uncertain/disputed identity) | `same-as` (with the caveat that Wikidata treats it as *uncertain* — our `same-as` is *first-person-traditional-claim*, semantically tighter) |
| **P2888** | "exact match" (skos:exactMatch) | Not used for deity-deity; cross-ontology only |
| **P1889** | "different from" | Not currently used by us; consider for explicit `polemic-against` reciprocal |
| **P144** | "based on" | `direct-borrowing` |
| **P138** | "named after" | Some `cognate` cases (theophoric naming) |
| **P461** | "opposite of" | `polemic-inversion` (Marduk ↔ Yaldabaoth) |
| **P527** | "has part" / **P361** "part of" | `constituent-of` (Trinity) |
| **P1049** | "worshipped by" | Tradition-to-deity, not deity-to-deity |
| **P5800** | "narrative role" (rare) | Could carry function-class (sovereignty/warrior/fertility) |

**Recommendation:** add a comment in PROTOCOL §3.1 mapping each of our edge types to its Wikidata-property equivalent. This makes future linked-data export trivial and aligns us with the largest public KG. P460 ("said to be the same as") is intentionally weaker than our `same-as`; we should keep `same-as` but document the asymmetry.

### CIDOC-CRM / FRBRoo / LRMoo

CIDOC-CRM (ISO 21127) is the cultural-heritage gold standard but **deity-relationship semantics live in extensions, not core**. No existing CIDOC extension formalises deity-to-deity relations. If we ever export to CIDOC, our edges would attach to E1 CRM Entity actors via P130 "shows features of" (closest analogue to syncretism). Not blocking for us; CIDOC alignment is a future-ship concern, not a foundation-lock concern.

### DBpedia

Has a `Deity` class but no specialised deity-deity property; uses generic `owl:sameAs`, `dbo:influencedBy`, `dbo:religion`. Strictly weaker than what we are building. No conflict to resolve.

### Pleiades / PNYX / ORACC

These geo/text gazetteers do not carry deity-relationship semantics at the edge level. No conflict.

### Conclusion

**No existing public ontology covers the deity-relationship space at the typological depth we are building.** Our 9-type vocabulary (plus the 4 recommended additions) would be *the most granular cross-tradition deity-edge taxonomy in any open knowledge graph.* We should align labels to Wikidata properties where they map (P144, P460, P461, P138) and document the gaps.

---

## 4. Recommended additions

| New type | Bucket | Citation | Captures |
|---|---|---|---|
| `functional-equivalent` | parallel | Dumézil, *Mythe et Épopée* (1968); Puhvel, *Comparative Mythology* (Johns Hopkins 1987) | Trifunctional/role-class matching (Odin = Varuna = Jupiter in sovereignty function) |
| `iconographic-borrowing` | transmission | Parker, *Greek Gods Abroad* (UC Press 2017), pp. 33-76; Boardman, *The Diffusion of Classical Art in Antiquity* (Princeton 1994) | Visual-form transfer without name or doctrine (Apollonian → Gandharan Buddha) |
| `demonization` | polemic | Augustine, *De civitate Dei* II.4, II.10; Stuckrad, "Demonization" in *Brill DDD*; cf. distinct from `polemic-inversion` | Reframing pagan god as a *real demonic being* — preserves figure-class, flips morality |
| `manifestation-of` | kinship | Teeuwen & Rambelli, *Buddhas and Kami in Japan* (RoutledgeCurzon 2003); Bassuk, *Incarnation in Hinduism and Christianity* (Macmillan 1987) | Honji-suijaku / avatara / hypostasis / gongen — one being manifesting locally/temporarily as another |
| `composite-deity` | fusion | Hornung, *Conceptions of God in Ancient Egypt* (Cornell 1982); Smith *God in Translation* §3 on Sarapis | Genuine new entity from merger — Sarapis, Hermes Trismegistus, Amun-Re |
| `prefiguration-claim` | polemic | Justin Martyr *1 Apol.* 46; Eusebius *Praeparatio Evangelica*; de Lubac, *Medieval Exegesis* (Eerdmans 1998) on typological reading | "X anticipates/prefigures Y" — *logos spermatikos*; Adam-as-type-of-Christ |

---

## 5. Recommended renames / clarifications

- **`scholarly-parallel` → `comparative-parallel`** (J.Z. Smith *analogical* comparison; avoids "scholarly = better" misreading)
- **`same-as`**: keep label, but tighten PROTOCOL gloss to *"first-person dogmatic-identity claim made by the source tradition itself"* — not a scholarly identity claim. Add an explicit example showing the difference between `same-as` (Nicene Father = YHWH, claimed by Christianity) and `comparative-parallel` (Shiva ↔ Dionysus, claimed by Doniger/Daniélou not by either tradition).
- **`ancient-identification`**: rename to **`attested-interpretatio`** or fold into the `interpretatio-*` family with `source:` carrying the ancient writer. The current name suggests "ancient = more reliable", which mis-frames the epistemic situation.
- **`polemic-against` vs `polemic-inversion`**: document the distinction in PROTOCOL — `polemic-against` is "X rejects Y" (Islam vs Trinity); `polemic-inversion` is "X reframes Y as morally inverted" (Marduk → Yaldabaoth). Currently the catalog lumps them.

---

## 6. Recommended bucket-routing corrections

Following Assmann's translation-vs-fusion distinction:

| Type | Current bucket | Recommended bucket | Reason |
|---|---|---|---|
| `interpretatio-romana/graeca/germanica` | fusion | **parallel** (or new "translation" sub-cluster of transmission) | Assmann: interpretatio is *translation*, not merger. Source deity unchanged. |
| `ancient-identification` | fusion | **parallel** (treat as attested-interpretatio) | Same as above; Herodotus *translates*, doesn't *merge*. |
| `folk-syncretism` | fusion | **fusion** ✓ (KEEP — this IS merger; orisha-saint pairs are new functional units) | Correct as-is. |
| `composite-deity` (new) | fusion | **fusion** ✓ | Sarapis IS a new merged entity. |
| `manifestation-of` (new) | kinship | **kinship** ✓ | Mythic-family-style relation. |
| `functional-equivalent` (new) | parallel | **parallel** ✓ | Structural, not historical. |
| `iconographic-borrowing` (new) | transmission | **transmission** ✓ | Form is transmitted, even when name/cult is not. |
| `demonization` (new) | polemic | **polemic** ✓ | |
| `prefiguration-claim` (new) | polemic | **polemic** (one-directional, claimant-frame) or **association** if seen as positive — recommend **polemic** since it is always a claim *by* the later tradition *about* the earlier | |

The key conceptual move: **`fusion` should be reserved for cases that produce a new third entity** (Sarapis, folk-syncretism, the Trinity-as-composite). Pure translation (interpretatio) leaves both parents intact and so belongs with `parallel`.

---

## 7. Open questions / things to resolve with John

1. **Vertical translatability** (Smith): do we want a distinct `vertical-development` edge type for within-tradition deity evolution (Rudra → Shiva; El → YHWH; Dionysus → Christ-as-resurrected-god in Frazer-style claims)? Currently `continuous-development` exists informally. Recommend formalising.
2. **Negative identification**: "X is NOT Y" (Marcion's OT-God ≠ Father; Islamic Trinity-critique). Currently routes through `polemic-against`. Should this be its own type `negative-identification` for clarity, or stay folded in polemic? Wikidata has P1889 "different from" as a precedent.
3. **Conditional identity** ("X = Y only in festival/liturgy/region Z"). Edge case (Inanna-Ishtar in specific Old Babylonian liturgies). Probably handle as a `notes:` qualifier rather than a new type — too niche for legend-level visibility.
4. **Bucket cardinality**: with 4 new types we're at 13 edge types in 7 buckets. Still legend-renderable. Going past 16 would start to break the visual scan; recommend hard-capping at 16.
5. **Sectarian re-identification** (Sikh Waheguru = Hindu/Muslim God): is this `same-as`, `comparative-parallel`, or its own thing? Probably `same-as` with `notes:` flagging it as a *third-party-claim of equivalence between two other traditions* — the Sikh tradition is the claimant. Document the pattern in PROTOCOL.
6. **Calendric calque** (Wednesday = Wōdnesdæg = Mercurii dies): currently filed under `interpretatio-germanica`. Strong case for keeping it there — Wikipedia/Tacitus scholarship treats the day-name calque as the *load-bearing evidence* for the interpretatio, not a separate mechanism. No new type needed.

---

## Sources

**Books / monographs**
- Assmann, Jan. *Moses the Egyptian.* Harvard UP, 1997.
- Assmann, Jan. *Of God and Gods: Egypt, Israel, and the Rise of Monotheism.* Wisconsin UP, 2008.
- Boardman, John. *The Diffusion of Classical Art in Antiquity.* Princeton UP, 1994.
- Burkert, Walter. *The Orientalizing Revolution.* Harvard UP, 1992.
- Davidson, Ronald M. *Indian Esoteric Buddhism.* Columbia UP, 2002.
- Doniger, Wendy. *The Implied Spider: Politics and Theology in Myth.* Columbia UP, 1998.
- Dumézil, Georges. *Mythe et Épopée.* Gallimard, 1968-73.
- Eliade, Mircea. *Patterns in Comparative Religion.* Sheed & Ward, 1958.
- Hornung, Erik. *Conceptions of God in Ancient Egypt: The One and the Many.* Cornell UP, 1982.
- Kahlos, Maijastina. *Forbearance and Compulsion.* Duckworth, 2009.
- Lincoln, Bruce. *Theorizing Myth: Narrative, Ideology, and Scholarship.* Chicago UP, 1999.
- Parker, Robert. *Greek Gods Abroad: Names, Natures, and Transformations.* UC Press, 2017.
- Puhvel, Jaan. *Comparative Mythology.* Johns Hopkins UP, 1987.
- Smith, Jonathan Z. *Drudgery Divine.* Chicago UP, 1990.
- Smith, Mark S. *God in Translation: Deities in Cross-Cultural Discourse in the Biblical World.* Eerdmans, 2008.
- Stewart, Charles & Shaw, Rosalind, eds. *Syncretism/Anti-Syncretism: The Politics of Religious Synthesis.* Routledge, 1994.
- Teeuwen, Mark & Rambelli, Fabio, eds. *Buddhas and Kami in Japan: Honji Suijaku as a Combinatory Paradigm.* RoutledgeCurzon, 2003.

**Reference / web (consulted)**
- [Wikidata P460 "said to be the same as"](https://www.wikidata.org/wiki/Property:P460)
- [Wikidata WikiProject Religions Ontology](https://www.wikidata.org/wiki/Wikidata:WikiProject_Religions/Ontology)
- [DBpedia Deity class](https://dbpedia.org/ontology/Deity)
- [CIDOC-CRM Wikipedia](https://en.wikipedia.org/wiki/CIDOC_Conceptual_Reference_Model)
- [Interpretatio graeca — Wikipedia](https://en.wikipedia.org/wiki/Interpretatio_graeca)
- [Honji suijaku — Wikipedia](https://en.wikipedia.org/wiki/Honji_suijaku)
- [*Dyēus — Wikipedia](https://en.wikipedia.org/wiki/*Dyēus)
- [Trifunctional hypothesis — Wikipedia](https://en.wikipedia.org/wiki/Trifunctional_hypothesis)
- [Smith, *God in Translation* — review (JHS)](https://jhsonline.org/index.php/jhs/article/view/11563/8881)
- [Assmann, "Counter-Religion and Religious Translatability"](https://orphicplatonism.wordpress.com/2014/04/10/counter-religion-and-religious-translatability-in-the-ancient-world-by-jan-assman/)

---

**Action items for John to greenlight or veto before locking the schema:**

- [ ] Add 4 priority types (`functional-equivalent`, `iconographic-borrowing`, `demonization`, `manifestation-of`).
- [ ] Add 2 supporting types (`composite-deity`, `prefiguration-claim`).
- [ ] Rename `scholarly-parallel` → `comparative-parallel`.
- [ ] Tighten `same-as` PROTOCOL gloss to "first-person dogmatic claim".
- [ ] Re-route `interpretatio-*` from fusion → parallel.
- [ ] Fold or rename `ancient-identification`.
- [ ] Formalise `continuous-development` / `vertical-development` (Smith).
- [ ] Document Wikidata-property mapping in PROTOCOL §3.1.
- [ ] Hard-cap edge-type count at 16.
