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
- Wires every cross-reference with `[[wikilinks]]` + structured `cross-*-edges`.
- Hunts the MASSIVE-WIN cross-tradition transmissions for this text (Krishna ↔ Christ avatar typology; OM ↔ Logos ↔ Memra ↔ Tao; Gandhi's reception → MLK).
- Closes by running a **stub-sweep**: every dead `[[wikilink]]` becomes a minimum-viable stub. Build passes. One commit. Done.

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

You're free to write `[[wikilinks]]` to non-existent nodes **during** the dissection — don't context-switch mid-sentence to create stubs. **At close**, before you build:

1. Scan every `[[wikilink]]` you wrote this batch (or run `python3 linkcheck.py` for the full sweep).
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

> **The objective of this vault is to CONNECT. A wikilink that points to nothing is a broken promise. You may not finish a batch having created dead links.**

Every `[[wikilink]]` you write must point to a real node by the time you commit. If the target doesn't exist, you create it — minimum a stub with the correct YAML skeleton — before you close. No exceptions.

**This applies at batch close, not at sentence-write time.** Write the prose; then sweep stubs; then build; then commit.

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
equivalents: []                     # cross-tradition syncretic identifications
syncretic-edges:                    # structured form (preferred when source-citing)
  - target: ""
    type: ""                        # ancient-identification | scholarly-parallel | folk-syncretism
    source: ""                      # ref ID or short citation
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
Brief, link-heavy. One bullet per major motif with [[wikilinks]] to theme nodes.

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
