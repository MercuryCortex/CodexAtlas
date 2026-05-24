# PROTOCOL — Absorb-and-Dissect SOP

> **Read this when running a full absorb-and-dissect batch on a primary text.** It is no longer pre-flight for every cast — see [`HOW-WE-WORK.md`](HOW-WE-WORK.md) for the slim cast-and-go routing.
>
> [`ONTOLOGY.md`](ONTOLOGY.md) tells you *what* we're mapping (the 26 lenses + 7 edge buckets). This file tells you *how* to map it: claim → absorb → dissect → wire → hunt transmissions → stub-sweep → build → commit.

---

## 1. The unit of work

**One unit = one primary document, fully absorbed and dissected.**

When you absorb the Bhagavad Gītā, the same batch:
- Creates / extends `02_documents/_phase-2-axial-age/phase-2-027-bhagavad-gita.md` with the document node.
- Spins out every named entity into the right category folder (post-2026-05-18 ontology lock; 26 lenses available):
  - Krishna, Arjuna → `03_deities/`, `04_persons/`
  - Avatar doctrine, dharma → `06_themes/` (pending rename → `06_motifs/`), `13_morals/`
  - Avatar *as Vaishnava doctrine* → `21_theology/` (new lens — distinct from the cross-tradition motif)
  - Sānkhya / Yoga frameworks → `15_philosophy/`
  - Vedic ritual references → `14_rituals/`
  - Kurukshetra battlefield → `08_places/` (new lens — was previously homeless)
  - OM, cosmic sound → `09_symbols/`, `10_music/`
  - Devanāgarī (script) → `11_alphabets/`; Sanskrit (language) → `18_languages/` (new lens — script and language are distinct)
  - Pranayama as *practice* → `22_practices/` (new lens — distinct from public ritual)
  - Ayurvedic / pharmacological references → `17_medicine/` for the system, `24_pharmacology/` for any named substances (new lens)
  - Sacred sites referenced (Kurukshetra-as-sacred-site, sacred Indian geography) → `20_sacred_architecture/` (new lens)
  - Vedic vs Indian calendars / Yuga system referenced → `26_calendars/` (new lens) and `15_philosophy/` for cosmological-doctrinal layer
- Wires every cross-reference with ``wikilinks`` + structured `cross-*-edges`.
- Hunts the MASSIVE-WIN cross-tradition transmissions for this text (Krishna ↔ Christ avatar typology; OM ↔ Logos ↔ Memra ↔ Tao; Gandhi's reception → MLK).
- Closes by running a **stub-sweep**: every dead ``wikilink`` becomes a minimum-viable stub. Build passes. One commit. Done.

Not every text touches all 26 lenses — but a deep absorption will touch most relevant ones. A liturgical text might be heavy on rituals + music + alphabets + languages + practices; a philosophical treatise might be heavy on philosophy + theology + persons + transmissions. A medical text might span medicine + pharmacology + practices + traditions. Trust the text.

**⚠️ Build-script awareness gap (as of 2026-05-18):** lenses 08 + 18–26 exist on disk and are documented but `build_data.py` `NODE_TYPE_MAP` does not yet recognize them. Nodes you stage in those folders will not appear in the graph until the deferred Lane B batch updates the build script. That update is atomic with the `06_themes/` → `06_motifs/` rename + Forge mode dropdown + pre-commit hook regex; see `00_meta/HANDOFF.md` "Deferred to next Lane B window."

---

## 2. The walkthrough

### Step 1 — Pick + claim

1. Open [`ABSORPTION-QUEUE.md`](ABSORPTION-QUEUE.md) for high-value primary texts not yet absorbed. Pick one.
2. Alternatively: pick from [`DASHBOARD.md`](DASHBOARD.md)'s priority queue (top unstubbed wikilink targets), [`AUDIT/05_priority_queue.md`](../AUDIT/05_priority_queue.md), or your own hunt.
3. Open [`ACTIVE-CONTENT.md`](ACTIVE-CONTENT.md). Verify no other agent has claimed the same document. Append your row:
   ```
   | your-handle | phase-2-027-bhagavad-gita | 02_documents/_phase-2*/p027*, 03_deities/krish*, 04_persons/arjuna* | 2026-05-17 14:30 | started |
   ```
4. The handle convention: `opus-<scope>-<n>` (e.g. `opus-gita-1`, `sonnet-yijing-2`). Pick the next free number for your scope.

### Step 2 — Read the lens (5 min)

If this is your first session, read [`ONTOLOGY.md`](ONTOLOGY.md) end-to-end. After that, only refresh on §3 (the 7 edge buckets) and §4 (MASSIVE-WIN patterns).

### Step 3 — Absorb

1. Create the document node in the correct phase folder. Use the YAML skeleton in §6 of this file.
2. Pull the **full text** (or the canonical excerpt range, for very long corpora) into the body under a `## Text` section. Public-domain translations preferred; cite the translation explicitly.
3. Write a `## What it is` paragraph (factual). `## Context` paragraph (political / religious milieu). `## Themes and motifs` (link-heavy bullet list). `## Connections (provisional)` (one bullet per outgoing edge with reasoning).
4. Promote the node's `status:` to `partial` (excerpts) or `full-text` (complete).

### Step 4 — Dissect across the 17 lenses

Open [`CORE-THEMES.md`](CORE-THEMES.md) alongside your text — it's the curated hunt-list of ~150 cross-tradition patterns with canonical slugs. When the text touches a pattern, use the canonical slug; do not coin a duplicate.

Walk the text and ask, **for each entity that appears**:

- Is this a divinity? → create / extend a node in `03_deities/`.
- Is this a historical (or pseudo-historical) person? → `04_persons/`.
- Is this a recurring motif that cuts across traditions? → `06_themes/`.
- Is this a ritual / rite / festival? → `14_rituals/`.
- Is this an iconographic / symbolic unit? → `09_symbols/`.
- Is this a moral teaching with cross-tradition resonance? → `13_morals/`.
- Is this a philosophical framework (school of thought, named position)? → `15_philosophy/`.
- Is this a piece of cosmological / sacred music or sound theory? → `10_music/`.
- Is this a script / alphabet / mystical-letter system? → `11_alphabets/`.
- Is this an alchemical practitioner / text / process / substance? → `12_alchemy/`.
- Is this a mathematical idea (ritual geometry, sacred number, transmission)? → `16_mathematics/`.
- Is this a healing tradition / pharmacology / divine physician? → `17_medicine/`.
- Is this an event (council, persecution, discovery, exile)? → `05_events/`.
- Is this a tradition's overview hub itself? → `07_traditions/`.

**Cadence:** create stubs as you go for entities you don't have time to flesh out; promote 1–3 entities to `metadata` or `full` per batch where the connection density justifies it.

### Step 5 — Wire connections

Every YAML field in §3 of ONTOLOGY.md routes to one of the 7 edge buckets. Use the right field for the right semantic.

Quick reference:
- **"X is documented as the source of Y"** → `influences[]` / `influenced-by[]` / `cross-*-edges[]` with `type: ancestor-of`. **Transmission** bucket. **This is where the MASSIVE WINs live.**
- **"X resembles Y but independent emergence"** → `parallels[]` / `cross-*-edges[]` with `type: parallel-form`. **Parallel** bucket.
- **"X IS Y (full identification)"** → `equivalents[]` or `syncretic-edges[]`. **Fusion** bucket.
- **"X appears in document Y"** → `attested-in[]` (on deity) or `deities-mentioned[]` (on document). **Attestation** bucket.
- **"X is the father / consort of Y"** (actual divine genealogy) → `parent-of[]` / `consort[]`. **Kinship** bucket.
- **"X rewrites Y's god as evil"** → `cross-*-edges[]` with `type: polemic-inversion`. **Polemic** bucket.
- **"X carries theme Y"** → `themes[]` (on document) or `cross-tradition-parallels[]` (on theme). **Association** bucket.

**Wikilink format:** `[[kebab-case-slug]]`. Never bare slugs in prose; never raw URLs in YAML fields meant for slugs.

### Step 6 — Hunt the MASSIVE-WIN transmission

For your document, the question is: **what older tradition does this connect back to, and can I source it at T1 or T2?**

Re-read [`ONTOLOGY.md`](ONTOLOGY.md) §4 for the categorized patterns. Then ask:
- Is there a documented transmission chain into or out of this text? Write it as a Transmission edge with a Tier-1/2 ref.
- Is there a structural parallel in another tradition with zero contact? Write it as a Parallel edge.
- Is there a fusion / syncretic identification? Write it as a Fusion edge.
- Is there a polemic inversion (god → demon)? Write it as a Polemic edge.

Add a `## MASSIVE WIN` prose section to your node summarising the transmission with the source quoted. Future agents and the viewer's findings tabs both read these sections.

### Step 7 — Stub-sweep (THE WIRING LAW, applied at close, not mid-sentence)

You're free to write ``wikilinks`` to non-existent nodes **during** the dissection — don't context-switch mid-sentence to create stubs. **At close**, before you build:

1. Scan every ``wikilink`` you wrote this batch (or run `python3 linkcheck.py` for the full sweep).
2. For each unresolved target: create a minimum-viable stub in the right folder. The stub needs at least:
   ```yaml
   ---
   type: <type>
   id: "<slug>"
   name: "<Display Name>"
   status: "stub"
   ---
   # <Display Name>
   _Stubbed by <your-handle> during absorption of [[phase-N-NNN-source-doc]]. Awaiting full treatment._
   ```
3. For MASSIVE-WIN-target stubs (Logos figures, Cosmic Human variants, divine feminine manifestations, demiurge variants, primary cross-tradition figures), upgrade to `metadata` rather than leaving as stub — at least one context paragraph + 3 refs (≥1 T1). A stub signals existence; a metadata node carries the edge's meaning.
4. Re-run `python3 linkcheck.py`. **Zero new dead links** is the close-bar.

### Step 8 — Build

```bash
python3 build_data.py        # regenerates data.js (10 sec)
python3 build_dashboard.py   # regenerates DASHBOARD + dead-links + orphans + quality-issues
```

If `build_data.py` raises `SystemExit: duplicate id`: see §3.2 (INTEGRITY LAW) — do **not** set `ATLAS_ALLOW_DUP_ID=1`. Rename one of the conflict pair instead.

### Step 9 — Log + commit

1. Append a one-line entry to the **top** of [`STATUS.md`](STATUS.md):
   ```
   > **`your-handle` — <document slug> absorbed + <N> nodes spun out — FINISHED 2026-05-17.** Highlights: <2-3 MASSIVE-WIN edges>. Build: <node count> · <edge count> · 0 new dead links. Commit <hash>.
   ```
2. Mark your row in [`ACTIVE-CONTENT.md`](ACTIVE-CONTENT.md) as `FINISHED YYYY-MM-DD HH:MM`. The next rotation moves finished rows out.
3. Stage your edits + the regenerated `DASHBOARD.md` + `dead-links.md` + `canonical-slugs.md`. **Do not stage `data.js`** — it's `.gitignore`d.
4. `git commit -m "<handle>: <one-line summary>"`. The pre-commit hook syntax-checks any `src/js/*.js` you touched (you shouldn't be touching any in Lane A) and refuses cross-lane commits.
5. Done.

---

## 3. The four laws

### 3.1 THE WIRING LAW (apply at batch close, not mid-sentence)

> **The objective of this vault is to CONNECT. A wikilink that points to nothing is a broken promise. A figure named in prose but absent from the structured edge fields is a hidden promise — equally broken.**

The law has FOUR sub-rules. All four must hold by commit time.

**(a) No dead wikilinks.** Every ``wikilink`` you write must point to a real node when you commit. If the target doesn't exist, you create it — minimum a stub with the correct YAML skeleton — before you close. Run `python3 linkcheck.py`; zero new dead links is the close-bar.

**(b) Targets must BE wikilinks.** When you write a `syncretic-edges:` entry, its `target:` field MUST be a `[wikilink]`, never a raw prose string. Same for `equivalents:` — every entry MUST be a `[wikilink]`. The graph can only traverse wikilinks. Scholarship nuance goes in the `notes:` field, not in the target.

```yaml
# ❌ WRONG — the graph can't follow this
syncretic-edges:
  - target: "Mercury / Hermes (Roman interpretatio germanica)"
    type: "interpretatio"

# ✓ RIGHT — wikilink target + nuance in notes
syncretic-edges:
  - target: "[[mercury-roman]]"
    type: "interpretatio-germanica"
    source: "Tacitus, Germania 9; West 2007 ch. 4"
    notes: "Wednesday/Wōdnesdæg = Mercurii dies; the weekday calque is the load-bearing evidence for the Roman→Germanic interpretatio identification"
```

**(c) Body prose must be wired.** Every cross-tradition figure you name in body prose ("through Buddhist transmission she became Benzaiten in Japan", "the Roman interpretatio identified Odin with Mercury") MUST also appear as a structured `[wikilink]` entry in `equivalents:` or `syncretic-edges:`. Body prose is for human readers; the graph reads only the structured fields. Both must agree.

**(d) Reciprocity.** When you add A→B in A's file, add B→A in B's file (or in the case of an asymmetric relationship like `polemic-inversion`, document the asymmetry in the `notes:` of A's edge). Asymmetric back-links accumulate into the audit problem documented in `AUDIT/cross-tradition-deity-bridges-2026-05-23.md`.

**Sweep order at batch close:**
1. Body-prose sweep — re-read every cross-tradition figure named in your prose; ensure each has a `[wikilink]` entry in the right structured field.
2. Stub sweep — `python3 linkcheck.py` then create stubs for every unresolved target.
3. Reciprocity sweep — for every new A→B edge, open B's file and add B→A.
4. Build — `python3 build_data.py`.

#### Edge types — the 21-type cross-tradition vocabulary (locked 2026-05-23)

These 21 types route into the 5 active wire-color buckets. Use exactly ONE
of these in `type:`. Do not invent new types without writing a precedent
into ONTOLOGY first. Each type maps to a Wikidata property where applicable
(linked-data interop). Edges live in `syncretic-edges:` with the canonical
6-field shape:

```yaml
syncretic-edges:
  - target: "[wikilink]"            # REQUIRED — never raw prose
    type: "<one-of-21-types>"          # REQUIRED — per the table below
    source: "Author Year Work, page"   # REQUIRED — who is making the claim
    source-tier: "T1"|"T2"|"T3"|"T4"|"T5"  # REQUIRED — per CODEX §IV
    political-risk-flag: false         # OPTIONAL — true only for T5 cases per CODEX
    notes: ""                          # OPTIONAL — scholarship nuance + rebuttal-stack for T3/T4/T5
```

**`source-tier:` is mandatory** (per CODEX v1.1 §IV — the disclaimer
machine cannot run without it):

| Tier | Default visibility | Meaning |
|---|---|---|
| `T1` | ON | mainstream peer-reviewed |
| `T2` | ON | academic minority |
| `T3` | ON | alternative-school (Hancock, Bauval, Schwaller) |
| `T4` | ON | popular-claim-rejected (Sitchin, Däniken, Cayce) |
| `T5` | OFF (opt-in) | disclaimer-required, political-risk (Icke, Evola) |

`equivalents:` is a flat-list convenience field carrying the strongest
identifications (`same-as`, `cognate`, `composite-deity`). Entries are
just `[wikilinks]`; the type-source-tier metadata lives in
`syncretic-edges:` of the same node.

##### Methodological pluralism — read this FIRST

This catalog deliberately accommodates **multiple academic frameworks** for
cross-tradition deity relationships. We do NOT adopt any one school as
authoritative:

- **J.Z. Smith** (*Drudgery Divine* 1990) — homological/genealogical vs
  analogical comparison ≈ our **transmission** vs **parallel** bucket
  boundary.
- **Jan Assmann** (*Moses the Egyptian* 1997; *Of God and Gods* 2008) —
  *translatio deorum* / cosmotheism ≈ our `interpretatio-nominal` (a
  parallel-bucket relation, NOT a fusion).
- **Robert Parker** (*Greek Gods Abroad* 2017) — three-axis interpretatio
  (nominal / iconographic / cultic) ≈ our `interpretatio-nominal`
  (parallel) + `iconographic-borrowing` (transmission) +
  `interpretatio-cultic` (fusion) splits.
- **Georges Dumézil** (*Mythe et Épopée* 1968-73) — trifunctional
  hypothesis (sovereignty / warrior / fertility classes) ≈ our
  `functional-equivalent` type.
- **Mark S. Smith** (*God in Translation* 2008) — horizontal vs vertical
  translatability ≈ our cross-tradition edges (horizontal) vs
  `continuous-development` (vertical, within-tradition).
- **Carsten Colpe**, **Stewart & Shaw** (*Syncretism / Anti-Syncretism*
  1994), **Michael Pye** — the syncretism-as-process literature
  ≈ our fusion vs polemic bucket split.

We **reject** Eliade-style telescope-scale "all sun-gods are X"
identification (Smith 1990 dismantles it; Doniger keeps it firewalled).
If a source makes such a claim, route via `scholarly-parallel` with a
notes-flag.

Each wire surfaces (a) the `type:` (what KIND of claim), (b) the
`source:` (who is making it — Tacitus, Doniger, the Nicene Creed,
Sponberg/Hardacre, etc), and (c) the `notes:` (the scholarship nuance).
The reader sees all three and judges. The schema serves investigation,
not orthodoxy.

##### TRANSMISSION (bronze) — 5 types
*Smith's homological / genealogical comparison. The two figures share descent.*

| Type | Meaning | Example | Wikidata |
|---|---|---|---|
| `cognate` | Shared etymological/PIE ancestor | Dyaus → Zeus → Jupiter → Týr (PIE *Dyḗus) | P138 |
| `direct-borrowing` | Explicit re-use of a named figure | Iblis ← Christian Satan (Quran 2:34) | P144 |
| `iconographic-borrowing` | Visual-form transfer with no name/cult identity | Apollonian → Gandharan Buddha image (Parker 2017) | — |
| `substrate-influence` | Structural absorption, no name-identity required | Christian Satan ← Zoroastrian Angra Mainyu | P144 (weak) |
| `continuous-development` | Within-tradition deity evolution (Smith's "vertical translatability") | Rudra → Shiva via Śvetāśvatara Upaniṣad | — |

##### PARALLEL (teal) — 4 types
*Smith's analogical comparison. Structures resemble; no descent claim.*

| Type | Meaning | Example | Wikidata |
|---|---|---|---|
| `scholarly-parallel` | Modern comparative-religion finding, contested by source traditions | Shiva ↔ Dionysus (Doniger, Daniélou 1979) | — |
| `parallel-motif` | Shared mythic pattern, no transmission claim | chaoskampf serpents (Tiamat / Typhon / Vritra / Apophis) | — |
| `functional-equivalent` | Dumézilian trifunctional class-match | Odin / Varuna / Jupiter (sovereignty class) | P5800 |
| `interpretatio-nominal` | Pure name-translation (Assmann's *translatio deorum*; Parker's nominal mode) | Wōden = Mercury per Tacitus (Wōdnesdæg = Mercurii dies) | P460 |

##### FUSION (orange) — 5 types
*A new third entity emerges, OR a doctrinal-identity claim merges two figures.*

| Type | Meaning | Example | Wikidata |
|---|---|---|---|
| `same-as` | **First-person dogmatic claim by the source tradition itself**. NOT a scholarly identity claim. | God the Father IS YHWH per Nicene Creed (Christianity's own doctrine) | P460 (stronger sense) |
| `interpretatio-cultic` | Parker's cultic-mode interpretatio — shared cult/ritual emerges | Greco-Egyptian Hermes-Anubis cult | — |
| `ancient-identification` | A NAMED ancient writer attests an identification | Apollo = Horus per Herodotus 2.144 | — |
| `composite-deity` | Genuinely new merged entity emerges from synthesis | Sarapis (Osiris+Apis+Hades+Dionysos); Hermes Trismegistus; Amun-Re | — |
| `folk-syncretism` | Folk-level merger (popular religion, not doctrine) | Yoruba Eshu ↔ Catholic Saint Lazarus (Cuban Lukumí); Perun ↔ Saint Elijah (Slavic dvoeverie) | — |

##### KINSHIP (lilac) — 2 types
*Mythic family / aspect / part-of relations.*

| Type | Meaning | Example | Wikidata |
|---|---|---|---|
| `manifestation-of` | "X is a local/temporal manifestation of Y" — generalised across honji-suijaku, avatara, hypostasis, incarnation | Amaterasu = suijaku of Mahavairocana; Krishna = avatara of Vishnu; Christ = incarnation of Logos. Tradition-specific subtype carried in `notes:` (avatara/suijaku/gongen/etc) | P361 (weak) |
| `constituent-of` | Part-of-whole within a tradition | Christ is constituent-of the Trinity | P361 |

##### POLEMIC (red) — 5 types
*One tradition reframes / rejects / contests another.*

| Type | Meaning | Example | Wikidata |
|---|---|---|---|
| `polemic-against` | One tradition rejects another's claim generally | Islam vs Trinity ("they say three"); Reformation iconoclasm | — |
| `polemic-inversion` | Venerated figure morally flipped in another tradition | Marduk → Yaldabaoth (Sethian Gnostic inversion of Babylonian cosmogony) | P461 |
| `demonization` | Pagan god preserved AS A REAL DEMONIC BEING (Augustine *City of God* II.4) — distinct from polemic-inversion; here the *figure-class* is real, the *morality* is inverted | Augustine on pagan gods as "real demons"; Christian saints' polemic against folk-deities | — |
| `prefiguration-claim` | "X anticipates / prefigures Y" (one-directional, claimed by the later tradition about the earlier) | Justin Martyr's *logos spermatikos* (Heraclitus + Socrates were Christians before Christ); OT-prefigures-Christ typological reading | — |
| `negative-identification` | Explicit "X is NOT Y" claim | Marcion: OT-God ≠ Christian Father; Islamic critique of Trinity-as-shirk | P1889 |

##### The 21 types in summary

```
TRANSMISSION (bronze): cognate, direct-borrowing, iconographic-borrowing,
                       substrate-influence, continuous-development
PARALLEL (teal):       scholarly-parallel, parallel-motif,
                       functional-equivalent, interpretatio-nominal
FUSION (orange):       same-as, interpretatio-cultic, ancient-identification,
                       composite-deity, folk-syncretism
KINSHIP (lilac):       manifestation-of, constituent-of
POLEMIC (red):         polemic-against, polemic-inversion, demonization,
                       prefiguration-claim, negative-identification
```

##### Tradition variants on interpretatio + manifestation

When you write an interpretatio or manifestation edge, encode the
tradition-specific variant in `notes:`:

```yaml
# interpretatio
- target: "[[mercury-roman]]"
  type: "interpretatio-nominal"
  source: "Tacitus, Germania 9; West 2007 ch. 4"
  notes: "interpretatio-romana — Roman writers identify the chief Germanic god as Mercury. Wednesday/Wōdnesdæg = Mercurii dies = the load-bearing calendric calque"

# manifestation-of
- target: "[[mahavairocana]]"
  type: "manifestation-of"
  source: "Teeuwen & Rambelli 2003 *Buddhas and Kami in Japan*"
  notes: "honji-suijaku — Amaterasu treated as the local/Japanese suijaku of the cosmic Buddha Mahavairocana in medieval shinbutsu shūgō"

# avatara variant of manifestation-of
- target: "[[vishnu]]"
  type: "manifestation-of"
  source: "Bhāgavata Purāṇa 1.3.28"
  notes: "avatara — Krishna is the pūrṇa avatāra (complete descent) of Vishnu in Vaishnava theology"
```

The five primary interpretatio sub-variants by source-tradition (carried
in `notes:`): `interpretatio-romana`, `-graeca`, `-germanica`,
`-aegyptia`, `-egyptiaca-greca` (Herodotus's Greco-Egyptian). The
type-level distinction (`-nominal` vs `-cultic`) is Parker's *axis* of
interpretatio (what KIND of identification — name only vs new ritual);
the variant in notes is *whose interpretatio* (which tradition's writer
is making the claim).

##### Hard cap

We hold this vocabulary at **≤21 cross-tradition types**. Adding a 22nd
requires an AUDIT/ doc justifying the new category with peer-reviewed
scholarship + bucket-assignment + Wikidata mapping. Document drift past
21 types degrades the legend's scannability.

### 3.2 THE INTEGRITY LAW

> **Every node must have a globally unique slug. The build will hard-fail on duplicates. Do not "fix" the failure by silencing it; resolve the conflict.**

`build_data.py` raises `SystemExit` on any duplicate-id at build time. Before this guard, deity nodes were silently overwritten by same-slug symbol / person files in the build race.

- **Do not set `ATLAS_ALLOW_DUP_ID=1`** to bypass. Rename one file instead.
- **Convention** for cross-folder collisions: deity keeps the bare slug; symbol gets `-symbol` suffix; person gets `-person` suffix; theme keeps bare for cross-temporal motifs. Cross-link the renamed pair via `syncretic-edges`.
- **Grep before naming**: `grep -rn "^id: \"<slug>\"" .` finds conflicts before the build does.

### 3.3 THE GOBLIN-AUDIT ETHIC

> **When iterative one-line fixes stop closing a problem, dispatch parallel read-only audits — three at a time, one per dimension.**

If the user says "this isn't bulletproof" or you've been patching for hours and still finding bugs in the same class:
- **Goblin A — correctness** (does every record have the right value?)
- **Goblin B — rule-engine fragility** (substring collisions, order-dependencies, latent bugs?)
- **Goblin C — structural integrity** (duplicates, empty fields, orphans, dangling references?)

Run them **in parallel** (single message, multiple Agent tool calls), **read-only** (they report; you fix), and **with judgment authority** (give them the goal, not the script).

Don't dispatch goblins for: isolated reproducible bugs, single-file scope, or anything you can verify with one grep.

### 3.4 APP-CODE SERIALIZES

> **Two agents on `src/js/` or `src/styles/` collide. The UX lane has one slot. Period.**

Lane B (UX) is single-slot — see [`LANES.md`](LANES.md). Content agents may not stage anything under `src/`, `index.html`, `build_data.py`, `build_dashboard.py`, `_assets/`, or `.claude/`. The pre-commit hook refuses cross-lane commits.

**If you see app-code paths in `git status` and you're a content agent**:
1. `git diff <path>` to see what changed.
2. If you didn't deliberately edit it → `git checkout HEAD -- <path>` to revert.
3. If you did edit it → you're not a content agent for this batch; switch lanes via `ACTIVE-UX.md` (if the slot is open) or stop.

---

## 4. Common moves and where they go

| You want to | Edit / create |
|---|---|
| Absorb a primary text full | `02_documents/_phase-N-*/<slug>.md` |
| Add a new deity | `03_deities/<slug>.md` |
| Add a person who isn't a deity | `04_persons/<slug>.md` |
| Stub a missing target during stub-sweep | The right type folder; status `stub` |
| Promote a stub to metadata | Edit YAML in place; add context + ≥3 refs (≥1 T1); change `status:` |
| Add a cross-tradition transmission edge | The appropriate `cross-*-edges[]` field with `type: ancestor-of` and a `source:` ref |
| Add a structural-parallel edge | `parallels[]` (documents) or `cross-*-edges[]` with `type: parallel-form` |
| Add a syncretic identification | `equivalents[]` or `syncretic-edges[]` |
| Note a polemic rewriting | `cross-*-edges[]` with `type: polemic-inversion` |
| Override a Wikipedia thumbnail | Add `depictions[]` array (do NOT write `thumbnail:` — `fetch_thumbnails.py` injects that) |
| Override the Wikipedia search title | Edit `OVERRIDES` in `fetch_thumbnails.py` (Lane B; coordinate via `ACTIVE-UX.md`) |

---

## 5. Date conventions

- Always **BCE/CE**, never AD/BC.
- Negative integers in YAML for BCE (e.g. `date-composed-earliest: -1500` means 1500 BCE).
- For oral-then-written texts: both `date-composed-earliest` (presumed oral origin) and `date-redacted` (writing / canonization).
- Use absolute dates when converting relative-time mentions ("Thursday" → `2026-03-05`).

### 5.1 Dating basis — B1-B7 (2026-05-24)

When a node has no explicit primary date (`date-composed-earliest`,
`date-born`, etc.), we still want it on the timeline spine. The
`dating_basis` field records WHICH evidence-class anchors the node's
year, on a 7-tier scale **orthogonal** to `source-tier` (which is
about mainstream acceptance, not dating evidence).

| Basis | What | Confidence | Typical anchor |
|---|---|---|---|
| **B1** | Primary date — the canonical `date-earliest` | high | birth-year, regnal year, composition year |
| **B2** | First textual attestation in a cited source | high | "Marduk first attested in the Adab tablet, c. -2400" |
| **B3** | Oldest dated archaeology | high | cult site, inscription, iconographic find |
| **B4** | First scripture appearance in a dated text | medium-high | "Suffering Servant: Deutero-Isaiah c. -540" |
| **B5** | Scholarly-consensus emergence period | medium | "Sufism c. 800-900 per Schimmel 1975" |
| **B6** | Family / tradition median (SYNTHESIZED) | low | auto from tradition median when no other evidence |
| **B7** | Genuinely undatable / atemporal | n/a | abstract motifs, PIE reconstructions, cosmological-only places |

Schema:

```yaml
date-earliest:        -1500          # the canonical scalar (UNCHANGED)
dating-basis:         B4             # B1..B7; required when inferring
dating-basis-source:  "Blenkinsopp 2000 *Isaiah 40-55* (Anchor)"
                                     # REQUIRED for B2/B3/B4/B5
                                     # OPTIONAL for B1 (already cited via refs[]) + B6
dating-basis-notes:   "..."          # OPTIONAL free-text
```

**Rules.** B2/B3/B4/B5 require `dating-basis-source` (the cited
reference, not "Wikipedia"). B6 is **computed by build, never
hand-written** — emitted automatically when a node lacks other
evidence but carries a `tradition:` field. B7 must explain WHY in
notes; the timeline puts B7 nodes in a dedicated atemporal lane
rather than the main spine.

**Build coalesce.** `date-earliest` falls through (in order):
`date-composed-earliest` · `period-active-earliest` · `date-start` ·
`date-born` · `period-earliest` · `date-built-earliest` ·
`date-attested-earliest` · `date-emergence` · `date-emergence-earliest` ·
`date-founded-earliest` · `date-composed` ·
slug-extracted year (events only) · tradition median (B6 synth).

See `AUDIT/2026-05-24-undated-dating-proposal.md` for the full
framework, per-category strategy, and edge cases.

---

## 6. YAML skeletons (the 17 node types)

All node files start with `---` … `---` YAML frontmatter, then a markdown body. Every node has at minimum: `type`, `id`, `name`, `status`, `refs[]`, `tags[]`. Folder-specific fields below.

### 6.1 `document` (in `02_documents/_phase-N-*/`)

```yaml
---
type: document
id: ""                              # phase-N-NNN-slug, e.g., phase-2-027-bhagavad-gita
title: ""
aka: []                             # alternative titles, transliterations
tradition: ""                       # e.g., "Vedic Hindu", "Christian", "Sumerian / Mesopotamian"
sub-tradition: ""                   # e.g., "Sethian Gnostic", "Theravada"
label: ""                           # see 00_meta/label-taxonomy.md
date-composed-earliest:             # integer (BCE negative)
date-composed-latest:               # integer
date-redacted:                      # if oral-then-written
date-physical-mss-earliest:         # oldest surviving manuscript
language: []                        # ["Sanskrit"] or ["Sumerian", "Akkadian"]
script: ""                          # "Devanagari", "Cuneiform", "Greek uncial"
region: ""
city-of-origin: ""
authorship: ""                      # known | attributed | anonymous | redacted | school | revealed
key-figures: []                     # links to 04_persons/
themes: []                          # links to 06_themes/
parallels: []                       # links to other 02_documents/
influenced-by: []                   # provisional; flag uncertain with "?" suffix
influences: []                      # provisional
deities-mentioned: []               # links to 03_deities/
events-context: []                  # links to 05_events/
status: "stub"                      # stub | metadata | partial | full-text
preservation: ""                    # cuneiform tablets / papyri / medieval mss / oral / etc.
refs:
  - title: ""
    author: ""
    year:
    publisher: ""
    url: ""
    type: ""                        # see ONTOLOGY.md §5
    tier:                           # 1 | 2 | 3 | 4
    notes: ""
tags: []                            # [phase-2, vedic, axial-age]
---
```

### 6.2 `deity` (in `03_deities/`)

```yaml
---
type: deity
id: ""                              # e.g., "el-canaanite"
name: ""
aka: []                             # transliterations, epithets, alternate names
tradition: ""
region: ""
period-active-earliest:             # integer (BCE negative)
period-active-latest:
domains: []                         # ["storm", "kingship", "creator"]
gender: ""                          # masculine | feminine | androgynous | non-gendered | varies
role: ""                            # creator | high-god | warrior | underworld | trickster | demiurge | psychopomp | savior
parent-of: []                       # other deities
child-of: []
consort: []
attributes: []                      # iconographic — bull, double-axe, ankh, halo
attested-in: []                     # links to 02_documents/
equivalents: []                     # cross-tradition syncretic identifications — MUST be [wikilinks], never raw prose
                                    # Example: ["[[jupiter]]", "[[dyaus-pita]]", "[[tyr]]"]
syncretic-edges:                    # structured form — use when you need type/source/notes
                                    # `target:` MUST be a [wikilink]; nuance goes in `notes:` (see PROTOCOL §3.1)
  - target: "[[other-deity-slug]]"
    type: ""                        # same-as | cognate | interpretatio-romana/graeca/germanica | direct-borrowing |
                                    # ancient-identification | substrate-influence | scholarly-parallel |
                                    # parallel-motif | polemic-against | polemic-inversion
                                    # (See PROTOCOL §3.1 edge-types table — do NOT invent new types ad-hoc.)
    source: ""                      # T1/T2 citation: author + year + work + page if specific
    notes: ""                       # the scholarship nuance that doesn't fit in `type:` alone
cross-tradition-edges: []           # for documented Transmission claims (ancestor-of, heir-of, distant-heir)
status: "stub"
refs: []
tags: []
---
```

### 6.3 `person` (in `04_persons/`)

```yaml
---
type: person
id: ""                              # e.g., "thomas-aquinas"
name: ""
aka: []
role: ""                            # prophet | scribe | king | philosopher | priest | redactor | heresiarch | translator | reformer | mystic | founder | scholar
tradition: ""
region: ""
date-born:                          # integer (BCE negative)
date-died:
floruit-earliest:                   # if dates uncertain
floruit-latest:
historicity: ""                     # documented | likely-historical | legendary | mythologized | disputed
texts-authored: []                  # links to 02_documents/ — defensibly authentic
texts-attributed-to: []             # traditionally attributed but disputed / pseudonymous
originator-of: []                   # concepts/themes credited (links to 06_themes/)
events-participated: []             # links to 05_events/
mentioned-in: []                    # documents that reference this person
connects-to: []                     # structured: [{target: "", relation: ""}]
cross-tradition-edges: []           # for documented Transmission claims
status: "stub"
refs: []
tags: []
---
```

### 6.4 `event` (in `05_events/`)

```yaml
---
type: event
id: ""                              # e.g., "council-of-nicaea-325"
name: ""
date-start:                         # integer (BCE negative)
date-end:
duration-years:
region: ""
event-type: ""                      # conquest | exile | council | persecution | discovery | reformation | schism | founding | destruction
participants: []                    # links to 04_persons/
traditions-affected: []             # links to 07_traditions/
documents-produced: []              # links to 02_documents/
documents-affected: []              # texts edited / canonized / banned because of this
status: "stub"
refs: []
tags: []
---
```

### 6.5 `theme` (in `06_themes/`)

```yaml
---
type: theme
id: ""                              # e.g., "flood-motif", "demiurge", "dying-rising-god"
name: ""
category: ""                        # cosmogonic | eschatological | soteriological | ethical | ritual | political-theological | anthropological
appearances: []                     # links to 02_documents/
deity-instances: []                 # links to 03_deities/
cross-tradition-parallels: []       # explicit cross-tradition theme parallels
status: "stub"
refs: []
tags: []
---
```

### 6.6 `tradition` (in `07_traditions/`)

```yaml
---
type: tradition
id: ""                              # e.g., "zoroastrianism", "gnostic-christianity"
name: ""
parent-tradition: ""                # if a sub-branch
date-emergence:                     # integer BCE negative
date-end:                           # "" if still extant
region-origin: ""
regions-spread: []
key-deities: []                     # links to 03_deities/
key-persons: []                     # links to 04_persons/
key-documents: []                   # links to 02_documents/
sister-traditions: []               # links to other 07_traditions/
cross-tradition-edges: []           # documented transmissions to/from this tradition
status: "stub"
refs: []
tags: []
---
```

### 6.7 `symbol` (in `09_symbols/`)

```yaml
---
type: symbol
id: ""                              # e.g., "ankh", "swastika", "latin-cross"
name: ""
aka: []
category: ""                        # geometric | theriomorphic | phytomorphic | anthropomorphic | astral | cosmological | mystery
families: []                        # ["Egyptian"], ["Hindu", "Buddhist", "Norse"] — primary first
period-earliest:                    # integer (BCE negative)
period-latest:                      # integer (use 2026 for "present")
region: ""
variants:                           # sub-forms within the same family
  - id: ""
    description: ""
    became-symbol: ""               # if the variant migrated to its own node
appearances: []                     # links to 02_documents/
deity-instances: []                 # links to 03_deities/
tradition-context: []               # links to 07_traditions/
depictions:                         # image refs
  - src: ""                         # local or Wikimedia URL
    caption: ""
    source: ""
    license: ""
cross-symbol-edges:                 # structured — load-bearing
  - target: ""
    type: ""                        # ancestor-of (Transmission; requires T1) | parallel-form (Parallel) | syncretic-fusion (Fusion) | appropriated-by (Fusion or Polemic) | polemic-inversion (Polemic) | visual-cognate (Fusion default)
    source: ""                      # ref
mystery-status: ""                  # "" | "undeciphered" | "partially-deciphered"
status: "stub"
refs: []
tags: []
---
```

### 6.8 — 6.17 Extended types (music / alphabet / alchemy / moral / ritual / philosophy / mathematics / medicine)

The extended types follow a common template — type-specific category fields + a structured cross-edge array. The build pipeline picks them up identically.

```yaml
---
type: <music | alphabet | alchemy | moral | ritual | philosophy | mathematics | medicine>
id: ""                              # kebab-case slug; no folder prefix for these types
name: ""
aka: []
tradition: ""                       # primary tradition
region: ""
date-earliest:                      # integer
date-latest:                        # integer or 2026 for present
category: ""                        # type-specific (see below)
appearances: []                     # links to 02_documents/ (where this is attested)
tradition-context: []               # links to 07_traditions/
cross-<type>-edges:                 # structured — the load-bearing cross-tradition layer
  - target: ""
    type: ""                        # parallel-form (default) | ancestor-of (T1 required) | syncretic-fusion | polemic-inversion
    source: ""
status: "stub"
refs: []
tags: []
---
```

**Type-specific `category:` values:**

- `music`: cosmological | liturgical-chant | hymn-corpus | sacred-instrument | music-theory | sound-cosmology
- `alphabet`: pictographic | logographic | syllabary | abjad | abugida | alphabetic | featural
- `alchemy`: practitioner | text | process | substance | concept
- `moral`: prohibition | virtue | golden-rule-variant | natural-law | karmic | absolute | situational
- `ritual`: rite-of-passage | sacrifice | festival | divination | purification | ancestor-veneration | possession | pilgrimage | mortuary
- `philosophy`: cosmology | epistemology | ethics | metaphysics | logic | political | mystical
- `mathematics`: origin | ritual-geometry | sacred-number | transmission | concept | cross-tradition
- `medicine`: tradition-hub | divine-physician | pharmacopoeia | technique | hospital-institution

**Cross-edge field naming:** `cross-music-edges`, `cross-alphabet-edges`, `cross-alchemy-edges`, `cross-moral-edges`, `cross-ritual-edges`, `cross-tradition-edges` (used by philosophy, mathematics, medicine, and any tradition node).

---

## 7. Body conventions

Below the YAML, the body follows a recognizable shape. Not every section is required for every type; let the content drive.

```markdown
# <Display Name>

## Identity / What it is
One factual paragraph: who or what this is in its primary tradition.

## Earliest attestation
- First documentary appearance: [[doc-node]], date.
- Iconographic / inscriptional attestations if relevant.

## Context
The political / religious / social milieu. Who was behind it. Why it survived (or didn't).

## Themes and motifs
Brief, link-heavy. One bullet per major motif with `wikilinks` to theme nodes.

## Cross-tradition connections / MASSIVE WIN
- **[[other-node]]** — *transmission* (with T1/T2 source) | *parallel* (independent convergence) | *fusion* (syncretic identification) | *polemic* (inversion).

## Disputes (when sources disagree)
- **Topic.** Position A [ref-1] vs. position B [ref-2]. Vault carries the range; prose names the debate.

## Refs
Either inline `refs[]` in YAML, or expanded prose citations here.
```

For `document` type with `status: partial` or `full-text`, add a `## Text` section with the absorbed text (and translator credit).

---

## 8. Build / verify commands

```bash
# After writing nodes + stub-sweep:
python3 build_data.py             # regenerates data.js (~10 sec) — DO NOT stage data.js
python3 build_dashboard.py        # regenerates DASHBOARD + dead-links + orphans + quality-issues + canonical-slugs

# Optional but recommended before final commit:
python3 lint_yaml.py --strict     # catches malformed YAML / slug drift / date inversions
python3 linkcheck.py              # catches dead wikilinks — zero new is the close-bar
```

Pre-commit hook will:
- Refuse cross-lane commits (any `src/` + any `0*/` in the same commit).
- `node --check` on any `src/js/*.js` you stage (you shouldn't be staging any in Lane A).

---

## 9. Anti-patterns (what NOT to do)

- **Do NOT** stage `data.js` — it's `.gitignore`d. Regenerate from source.
- **Do NOT** create a duplicate node for a concept that already has a canonical slug. Check [`canonical-slugs.md`](canonical-slugs.md). If the existing slug is wrong, propose a rename in `AUDIT/`.
- **Do NOT** collapse syncretic identifications into one node prematurely. El-Canaanite + El-Hebrew stay separate; Inanna + Ishtar + Astarte + Aphrodite stay separate. The **edges** between them carry the syncretic claim.
- **Do NOT** assert "X is just Y renamed" without a Tier 1–2 source. Default to `parallel-form` (resemblance only); reserve `ancestor-of` for documented transmission with a T1 source.
- **Do NOT** hand-edit auto-generated files: `DASHBOARD.md`, `dead-links.md`, `orphan-nodes.md`, `quality-issues.md`, per-phase `_TODO.md`, `canonical-slugs.md`. Re-run `build_dashboard.py`.
- **Do NOT** delete sourced material because a newer source contradicts it. Add the new source and reconcile in a `## Disputes` section.
- **Do NOT** use AD/BC; always BCE/CE. Negative integers in YAML for BCE.
- **Do NOT** `git add -A` or `git add .` — sweep specific paths. The 2026-05-15 incidents (twice) were caused by content agents sweeping stale `src/js/app.js` into their commits.
- **Do NOT** pass `--no-verify` to `git commit` unless John explicitly says so. The pre-commit hook catches real failures.
- **Do NOT** set `ATLAS_ALLOW_DUP_ID=1` to silence the build's dup-id hard-fail. Rename one of the conflict pair.

---

## 10. Quick-reference: a clean batch close

```
1. python3 linkcheck.py     → 0 new dead links
2. python3 build_data.py    → 0 YAML errors, 0 warnings, dup-id check passes
3. python3 build_dashboard.py
4. Append one-line entry to top of STATUS.md
5. Mark ACTIVE-CONTENT.md row FINISHED <timestamp>
6. git add <your-node-files> 00_meta/DASHBOARD.md 00_meta/dead-links.md 00_meta/canonical-slugs.md 00_meta/STATUS.md 00_meta/ACTIVE-CONTENT.md
7. git commit -m "<handle>: <one-line summary>"
```

If any step fails: fix the cause; do **not** silence the check.
