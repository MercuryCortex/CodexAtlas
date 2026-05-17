# ONTOLOGY — What Codex Atlas is mapping

> **Read this first.** Together with [`PROTOCOL.md`](PROTOCOL.md) (the absorb-and-dissect SOP) and [`LANES.md`](LANES.md) (the two-lane workflow), this is the only mandatory pre-flight for any agent landing in the vault.

---

## 1. Mission

Codex Atlas is an **investigation tool**. The goal is to map the entire corpus of humanity's primary religious, philosophical, and scientific texts — at the level of every named entity inside them — and draw the **transmissions** that connect them across millennia.

The work is one motion: **absorb a primary text 100% AND dissect it into every applicable category at the same time.** When the Bhagavad Gītā lands in the vault, it doesn't just become a `document` node. The same agent, in the same batch, spins out every named entity it contains across the **17 category folders** (deities, persons, themes, symbols, philosophy, rituals, music, alphabets, medicine, …) and wires every cross-reference. Investigation IS labelling. Labelling IS data entry.

The **prize** is the **cross-tradition transmission** — the documented chain (or structural parallel) showing how an idea travelled. Christianity → older Egyptian, Mesopotamian, Mystery, Platonic, Persian, Indic sources is the densest hunting ground. The Logos chain, the Avatar typology, the dying-and-rising god, the flood, divine kingship — every one of these has a path that can be traced.

**Posture:** investigation, not advocacy. Every claim cites a source. Tiered source-integrity (T1 primary / T2 scholarly / T3 reputable secondary / T4 controversial-but-catalogued). Equal-weight document rule — a Nag Hammadi codex and a canonical Gospel are both primary early-Christian-era evidence; *why* one has more cross-links than the other is itself a finding.

---

## 2. The 17 Lenses

Every absorbed text gets sliced through these lenses. Not every text touches every lens — but a deep absorption will touch most. **Each lens = a folder under the vault root.** Each folder hosts markdown nodes with YAML frontmatter; the YAML carries the connections; the prose carries the evidence and argument.

| # | Folder | Type | Lives here | Connects to | Primary YAML fields |
|---|---|---|---|---|---|
| 1 | `01_timeline/` | timeline | Master chronological index | Documents, events | (index file; not per-node) |
| 2 | `02_documents/_phase-N-*/` | **document** | Primary texts: scriptures, codices, treatises, edicts | Deities, persons, themes, events, parallel documents | `deities-mentioned`, `key-figures`, `themes`, `parallels`, `influences`, `influenced-by`, `authorship`, `date-composed-earliest/latest`, `date-physical-mss-earliest`, `language`, `region` |
| 3 | `03_deities/` | **deity** | Every named god, divinity, divine figure, principal demon | Other deities (parent/child/consort/syncretic), documents (attestation), traditions | `aka`, `domains`, `parent-of`, `child-of`, `consort`, `attested-in`, `equivalents`, `syncretic-edges`, `attributes`, `tradition`, `region` |
| 4 | `04_persons/` | **person** | Prophets, scribes, kings, philosophers, redactors, founders, translators, heresiarchs | Documents (authored / attributed / mentioned), events, themes (originator-of) | `role`, `historicity`, `texts-authored`, `texts-attributed-to`, `originator-of`, `mentioned-in`, `events-participated`, `connects-to` |
| 5 | `05_events/` | **event** | Conquests, exiles, councils, persecutions, discoveries, eruptions | Participants (persons), documents-affected / produced, traditions-affected | `date-start`, `date-end`, `participants`, `traditions-affected`, `documents-affected`, `documents-produced`, `region` |
| 6 | `06_themes/` | **theme** | Recurring motifs: flood, dualism, demiurge, messianism, dying-rising god, sacred marriage, … | Documents (appearances), deities (instances), other themes (cross-tradition-parallels) | `category` (cosmogonic/eschatological/soteriological/…), `appearances`, `deity-instances`, `cross-tradition-parallels` |
| 7 | `07_traditions/` | **tradition** | Per-tradition overview hubs: Christianity-Latin, Egyptian, Vedic, Zoroastrian, Hermeticism, … | Parent tradition, sister traditions, key deities/persons/documents | `parent-tradition`, `sister-traditions`, `key-deities`, `key-persons`, `key-documents`, `date-emergence` |
| 8 | `09_symbols/` | **symbol** | Iconographic units: geometric (cross, ankh, swastika), theriomorphic (eagle, serpent), astral (sun-disk), mystery (undeciphered) | Deities (instances), documents (appearances), other symbols (cross-symbol-edges) | `families`, `category`, `appearances`, `deity-instances`, `tradition-context`, `cross-symbol-edges`, `mystery-status` |
| 9 | `10_music/` | **music** | Sacred sound, cosmological music, ritual chant, hymn corpora | Traditions, philosophies of sound, instruments, parallel music nodes | `tradition`, `instrument`, `cross-music-edges` |
| 10 | `11_alphabets/` | **alphabet** | Scripts, glyph systems, divine-origin stories of writing | Source scripts, daughter scripts, traditions, mystical letter-number systems | `parent-script`, `descendant-scripts`, `cross-alphabet-edges`, `glyph-count` |
| 11 | `12_alchemy/` | **alchemy** | Practitioners, texts, processes, substances, concepts in alchemical traditions | Other alchemical nodes, persons, traditions | `alchemy-type` (practitioner/text/process/substance/concept), `cross-alchemy-edges` |
| 12 | `13_morals/` | **moral** | Cross-tradition ethical positions: Golden Rule variants, prohibitions, virtues | Documents (attestation), traditions, parallel morals | `category`, `cross-moral-edges` |
| 13 | `14_rituals/` | **ritual** | Rites, ceremonies, sacrifices, festivals, divinatory practices | Traditions, deities (target of), documents (prescribing) | `tradition`, `category`, `cross-ritual-edges` |
| 14 | `15_philosophy/` | **philosophy** | Schools of thought: Neoplatonism, Madhyamaka, Stoicism, Falsafa, Confucianism | Persons (founders/figures), other schools (heir-of / parallel) | `school-type`, `cross-tradition-edges`, `cross-music-edges` |
| 15 | `16_mathematics/` | **mathematics** | Sacred number, ritual geometry, scientific roots: Babylonian, Sulba Sūtras, Pythagorean, House of Wisdom, India zero | Traditions, philosophies, mathematicians (persons) | `math-type` (origin/ritual-geometry/sacred-number/transmission/concept), `cross-tradition-edges` |
| 16 | `17_medicine/` | **medicine** | Healing traditions: Ayurveda, Hippocratic, Islamic Golden Age, Asklepion, TCM, shamanic | Deities (healer), persons, documents (pharmacopoeia), parallels | `tradition`, `category`, `cross-tradition-edges` |
| — | `99_ingest/` | (raw) | Unprocessed material (screenshots, dumps, PDFs awaiting absorption) | — | Not part of the graph; staging zone before a node exists. |

**The graph emerges from the YAML fields.** Most fields above are arrays of `[[wikilinks]]` (with the kebab-case slug between the brackets). `build_data.py` walks every node, parses these fields, and emits edges. See §3 below for which fields produce which edge types.

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

The prize is the **cross-tradition transmission**. When you absorb a primary text, hunt for the older-tradition source and write it as an explicit Transmission edge with a Tier-1 or Tier-2 source. The full catalog (with vault-node links) lives in [`MASSIVE-WINS-INDEX.md`](MASSIVE-WINS-INDEX.md). The categories:

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
