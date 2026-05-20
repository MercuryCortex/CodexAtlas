# Ontology Audit — 2026-05-21

> **Audit goblin: AUDIT-ONLY.** Read-only on everything except this file. No content, schema, script, or `src/` changes recommended *applied* — recommendations only. Dispatched by Lane B agent in flight.
>
> **Scope.** Audit the 29-lens ontology as it stands today, with emphasis on the 12 new lenses (08, 18–26 from 2026-05-18; 27/28/29 from 2026-05-19). The owner is concerned the expansion happened fast and wants overlap / gap / drift surfaced before more content layers on.
>
> **Inputs read in full.** `00_meta/ONTOLOGY.md`, `00_meta/ONTOLOGY-RATIONALE-2026-05-18.md`, `00_meta/ONTOLOGY-RATIONALE-2026-05-19.md`, READMEs of `08_places/`, `18_languages/` through `29_technology/`. Spot-checked `01_timeline/`, `04_persons/`, `06_themes/` (no READMEs in any of the originals). Checked `build_data.py`, `build_dashboard.py`, `lint_yaml.py`, `fetch_thumbnails.py`, `fetch_wikidata_thumbnails.py`, `review_thumbnails.py`, `add_depictions.py`, `linkcheck.py`, `scripts/git-hooks/pre-commit`, and `00_meta/schema-*.md`.

---

## Executive summary

1. **The spine is sound.** The 29-lens framework is internally coherent. Both rationale docs (2026-05-18 + 2026-05-19) hold up under scrutiny: each new lens clears at least one of the three bars, scope IN/OUT is articulated for every new lens README, and the pre-commit hook regex has already been widened to `^(0[1-9]_|1[0-9]_|2[0-9]_)` (verified `scripts/git-hooks/pre-commit:31`). No structural defect requires backing out a lens.
2. **`build_data.py` is current; everything else is not.** `build_data.py:21-54` already lists all 29 lens → type mappings, so new-lens nodes WILL emit edges. But `build_dashboard.py:30-38`, `lint_yaml.py:40-49`, `fetch_thumbnails.py:32`, `fetch_wikidata_thumbnails.py:36-42`, `review_thumbnails.py:35-42`, and `add_depictions.py` are all hardcoded to the original 7-folder set (document/deity/person/event/theme/tradition/symbol). **This is the single highest-priority blocking gap** — the dashboard, lint reports, thumbnail fetch, and review pipelines are blind to roughly 41% of the lens spine. Headlined in ONTOLOGY.md §2 as a known build-script awareness gap, but the gap is wider than that note suggests.
3. **Schema-doc coverage is at 7 of 22 node-bearing types (~32%).** `00_meta/schema-deity.md`, `schema-document.md`, `schema-event.md`, `schema-person.md`, `schema-symbol.md`, `schema-theme.md`, `schema-tradition.md` exist. **No schema docs exist** for `place`, `language`, `astronomy`, `sacred-site`, `doctrine`, `practice`, `relic`, `substance`, `divination-system`, `calendar-system`, `attire`, `exchange-network`, `technology`, `music`, `alphabet`, `alchemy`, `moral`, `ritual`, `philosophy`, `mathematics`, `medicine`. The lens READMEs carry provisional YAML skeletons (good) but no schema docs in the form Lane A's writer-discipline currently consumes.
4. **Existing folders have no README at all.** `01_timeline/`, `02_documents/`, `03_deities/`, `04_persons/`, `05_events/`, `06_themes/`, `07_traditions/`, `09_symbols/`, `10_music/`, `11_alphabets/`, `12_alchemy/`, `13_morals/`, `14_rituals/`, `15_philosophy/`, `16_mathematics/`, `17_medicine/` — **zero have READMEs.** All 13 new lenses do (08 + 18–29). This creates a documentation asymmetry: new lenses have a primer; old lenses don't. New agents landing on a deity question have to bounce back to ONTOLOGY.md §2; new agents landing on attire get a 50-line scope IN/OUT primer in-folder.
5. **Naming drift is real but bounded.** Two queued renames (`06_themes/` → `06_motifs/`, `09_symbols/` → `09_symbology/`) are documented, and `21_theology/` uses `type: doctrine` (folder name and type intentionally diverge by lens design). The slot-08 promotion left "26 lenses" stale wording inside *every* new-lens README (08, 18–29 all say "of the 26-lens ontology"). 27/28/29 correctly say "of 29." Cosmetic but worth a single sweep.
6. **Real overlap risks exist between five lens pairs**, all of which the rationale docs *do* address but only at the prose level — no explicit decision tree. Listed in §3.
7. **At least one misfile already exists in vault** from the 2026-05-20 stub-sweep — `24_pharmacology/spice-routes-portuguese-overlay.md` has `type: substance` but is conceptually an exchange-network. And `28_exchange_networks/` contains both `frankincense.md` AND `frankincense-as-trade-commodity.md` — likely a slug-disambiguation collision born of `[[frankincense]]` wikilinks targeting both substance and commodity senses. The orchestrated initial-wave goblin batch (2026-05-20) auto-created stubs without ontology-routing discipline — these will keep accumulating without a lens-routing rule.

---

## Per-lens findings

Format below: **scope clarity** (1–5; 5 = bulletproof) / **overlap risk** (lenses it can fight with) / **schema status** / **node count today** / **notes**.

### Deep-dive: the 13 new lenses

#### `08_places/` (place)
- **Clarity:** 4/5. README is short (49 lines) but the place-vs-sacred-site rule (Mecca-city in 08, Kaaba in 20) is explicit.
- **Overlap:** with `20_sacred_architecture/` (handled), with `07_traditions/` (place-as-civilization vs. tradition — Mesopotamia, Indus-valley). The civilization/region overlap is **not** addressed in the README — examples listed include "Mesopotamia" + "Indus valley" but `07_traditions/` would also host Sumerian/Akkadian/Vedic-region traditions. **Decision rule needed.**
- **Schema:** none. Lens has 107 nodes — by far the most-populated new lens. Highest schema-doc urgency.
- **Stale boilerplate:** "Lens slot 08 of the 26-lens ontology" — should be 29.

#### `18_languages/` (language)
- **Clarity:** 5/5. Alphabet-vs-language distinction is the cleanest in the new set.
- **Overlap:** with `11_alphabets/` (handled), with `07_traditions/` when a tradition is named for a language community (Quranic Arabic, Vedic Sanskrit) — but cross-link convention is articulated.
- **Schema:** none. **0 content nodes (just README).** Lowest content urgency.
- **Stale boilerplate:** "26-lens ontology."

#### `19_astronomy/` (astronomy)
- **Clarity:** 5/5. Strongest scholarly anchoring in the new set (Neugebauer / Pingree / Rochberg cited).
- **Overlap:** astronomy-vs-astrology decision deferred (astrology lives as cross-cutting tags + UI tab + possible divinatory-astrology in 25). This is fine *today* but the deferred decision is a future debt — if astrology accumulates substantially, the ad-hoc placement (`06_themes/` OR `25_divination/` OR tags) will need a real ruling. The README acknowledges this.
- **Schema:** none. **0 content nodes.**
- **Stale boilerplate:** "26-lens ontology."

#### `20_sacred_architecture/` (sacred-site)
- **Clarity:** 4/5. The "built + natural-but-sacred unified" decision is defended (Eliade lineage); the boundary with `08_places/` is articulated.
- **Overlap:** with `08_places/` (handled), with `09_symbols/` (handled — stupa-form-as-symbol vs Sanchi-Stupa-as-site), with `06_themes/` (Mt-Meru-as-mythic-mountain vs Mt-Meru as natural sacred site — the README's `mount-meru-mythic` slug example is in 20 but Mt Meru is a mythic-mountain not a physical mountain; arguably belongs in `06_themes/` as `cosmological-geography`). **Mythic-vs-physical sacred-site decision rule needed.**
- **Schema:** none. **116 nodes** — second-most populated new lens. High schema-doc urgency.
- **Stale boilerplate:** "26-lens ontology."

#### `21_theology/` (doctrine)
- **Clarity:** 5/5. Theology-vs-philosophy distinction is well-defended (McGinn / Coakley / Anatolios / Pelikan). Theology-vs-motif boundary is explicit and useful (Chalcedonian Christology is a doctrine; resurrection-of-the-dead is a motif).
- **Overlap:** with `15_philosophy/` (handled), with `06_themes/` (handled), with `22_practices/` (handled by example — fana-as-doctrine vs fana-as-practice in the 22 README), with `12_alchemy/` (alchemy-as-soteriology already showing up as a doctrine — `21_theology/doctrine-alchemy-as-soteriology.md` exists as a stub).
- **Folder-name vs type-name drift:** folder is `21_theology` but type is `doctrine`. **Intentional** per rationale (§2.5 — theology is the discipline; doctrines are the nodes). Other lenses do this too (`20_sacred_architecture` / `sacred-site`; `25_divination` / `divination-system`; `26_calendars` / `calendar-system`; `28_exchange_networks` / `exchange-network`). The convention is consistent but undocumented as a *convention* — worth a single line in ONTOLOGY §2 noting "folder name = discipline; type = node-kind."
- **Schema:** none. 15 nodes.
- **Stale boilerplate:** "26-lens ontology."

#### `22_practices/` (practice)
- **Clarity:** 4/5. Practice-vs-ritual distinction is canonical (James / Underhill / McGinn). Edge cases acknowledged (dhikr-in-halqa is both).
- **Overlap:** with `14_rituals/` (handled via two-node convention), with `15_philosophy/` (handled — Yoga Sutras is text, asana is practice), with `25_divination/` (Asklepian incubation is divinatory AND a contemplative practice — not addressed).
- **Schema:** none. **0 content nodes.**
- **Stale boilerplate:** "26-lens ontology."

#### `23_material_culture/` (relic)
- **Clarity:** 4/5. Relic-as-physical-instance vs symbol-as-abstract-form is clear.
- **Overlap:** with `09_symbols/` (handled — cross-edged via `is-instance-of-symbol`), with `02_documents/` (handled — Codex Sinaiticus AS physical manuscript-codex is here, AS text-document is in 02), with `27_attire/` (sacred-named-garment-with-provenance is in 23; garment-class is in 27 — articulated in 27's README), with `20_sacred_architecture/` (handled — Tabot is relic, church housing it is site).
- **Schema:** none. 12 nodes.
- **Stale boilerplate:** "26-lens ontology."

#### `24_pharmacology/` (substance)
- **Clarity:** 5/5. The substances-vs-medicine-systems split is well-defended (Soma cross-cuts 5 lenses; pharmacopoeia as MASSIVE-WIN per ONTOLOGY §4).
- **Overlap:** with `12_alchemy/` (handled — substances-here, processes-there), with `17_medicine/` (handled), with `06_themes/` (handled), with `28_exchange_networks/` (frankincense / myrrh / silk — substance vs trade-commodity). The 24 README ends without explaining the substance-vs-commodity rule; the 28 README handles it via `also-substance` cross-link. **Asymmetric — only 28 documents the cross-link.**
- **Schema:** none. 4 nodes — and **one is misfiled** (`spice-routes-portuguese-overlay.md` should be in 28, has `type: substance` but is conceptually a route).
- **Stale boilerplate:** "26-lens ontology."

#### `25_divination/` (divination-system)
- **Clarity:** 5/5. Ritual-vs-divination distinction is sharp (Zeitlyn / Sax / Palmié / Smith cited). Yi Jing / Ifá as MASSIVE-WIN justifies the lens.
- **Overlap:** with `14_rituals/` (handled — system here, ritual-frame in 14), with `02_documents/` (handled — Yi Jing text vs Yi Jing divination), with `09_symbols/` (handled — Tarot trumps), with `19_astronomy/` (astrology-as-divination handled implicitly — Hellenistic horary lives here, observation-astronomy in 19).
- **Schema:** none. **0 content nodes.**
- **Stale boilerplate:** "26-lens ontology."

#### `26_calendars/` (calendar-system)
- **Clarity:** 5/5. Cross-cuts astronomy + mathematics + ritual + tradition + cosmology — defended as a system-level lens.
- **Overlap:** with `14_rituals/` (handled — calendar drives festival), with `19_astronomy/` (handled — calendar uses observation), with `16_mathematics/` (handled — intercalation algorithms), with `06_themes/` (Yuga-cycle-cosmology, Mayan-world-ages — cosmological motifs that calendar encodes — split is "doctrine in 21, motif in 06, calendar-system in 26").
- **Schema:** none. **0 content nodes.**
- **Stale boilerplate:** "26-lens ontology."

#### `27_attire/` (attire)
- **Clarity:** 5/5. Tight scope IN/OUT (vestment / habit / regalia in; relic-garment in 23; sacred-armor in 29-military). MASSIVE-WIN clusters listed (white-as-purity convergence, saffron-as-renunciation, head-covering as marker).
- **Overlap:** with `23_material_culture/` (handled — Shroud of Turin in 23, ihram-as-class in 27), with `09_symbols/` (kirpan-as-symbol cross-link), with `29_technology/` (sacred armor → 29 military-tech). Edge case: ritual fiber + commodity-fiber (silk-for-kasaya) — cross-link to `28` via `material-fiber` — well-articulated.
- **Schema:** none. 11 nodes (10 + README).
- **Boilerplate:** correctly says "Lens 27 of 29."

#### `28_exchange_networks/` (exchange-network)
- **Clarity:** 4/5. The lens cleanly hosts FOUR sub-types (routes / commodities / trading-peoples / infrastructure) — but that breadth is also the lens's biggest overlap risk.
- **Overlap:** with `24_pharmacology/` (handled in 28 README; **not** handled in 24 README), with `07_traditions/` (Phoenicians-as-ethnos in 07, Phoenicians-as-network in 28 — articulated), with `08_places/` (port-of-trade-as-type here vs Alexandria-as-place in 08), with `23_material_culture/` (specific ship in 23 vs galleon-system here), with `27_attire/` (silk fiber, cotton fiber — material-fiber cross-link).
- **Slug-collision risk:** observed in vault. `28_exchange_networks/frankincense.md` AND `28_exchange_networks/frankincense-as-trade-commodity.md` both exist, both with `type: exchange-network`. Likely a stub-resolution accident — when `[[frankincense]]` and `[[frankincense-as-trade-commodity]]` were both wikilinked, the goblin auto-created both. **A naming convention rule needed:** when a substance is also a commodity, the substance lives in 24 with the canonical slug, and the 28 node is `<slug>-as-trade-commodity`. Two-slug-discipline applied consistently would eliminate this.
- **Schema:** none. 58 nodes — third-largest new lens.
- **Boilerplate:** correctly says "Lens 28 of 29."

#### `29_technology/` (technology)
- **Clarity:** 5/5. Seven HSST sub-categories (metallurgy / architectural-technique / chemistry / information / navigation / hydraulic-agricultural / military-technology) each well-scoped. Anchored in Needham / White / Mokyr / Edgerton.
- **Overlap:** with `16_mathematics/` (algorithm-as-tech vs algebra-as-theory — articulated), with `19_astronomy/` (astrolabe-as-instrument here vs astronomy-the-observation in 19 — articulated), with `12_alchemy/` (distillation-as-technique here vs alchemy-as-soteriology in 12 — articulated), with `05_events/` (papermaking-tech here vs Battle-of-Talas-event in 05 — articulated), with `09_symbols/` + `23_material_culture/` for sacred-symbolic-weapons (well-articulated decision tree). Strongest overlap-mitigation in the new set.
- **Schema:** none. 26 nodes.
- **Boilerplate:** correctly says "Lens 29 of 29."

### Spot-checks of three original lenses

#### `01_timeline/`
No README. One file (`master-timeline.md`) acts as an index. Type semantics: the lens is *index-only*, not per-node. ONTOLOGY.md §2 row 1 explicitly says "(index file; not per-node)" — so this is by design. No defect.

#### `04_persons/` (person)
No README. 1,193 nodes (largest in vault). ONTOLOGY.md §2 row 4 + `schema-person.md` (the most up-to-date schema doc in `00_meta/`) are the *only* in-tree authority. Many writer-conventions (when to suffix `-person`, when to use `historicity`, the `heresiarch`-as-polemic flag) live ONLY in ONTOLOGY.md prose, not in any folder-local primer.

#### `06_themes/` (theme — pending rename to motif)
No README. 493 nodes. The 06 → 06_motifs rename is queued in BOTH rationale docs. Today every node carries `type: theme`. The rename is the largest planned migration in the deferred-Lane-B batch — it touches 493 type-field flips + every other node's `themes:[]` YAML field references + folder rename + 5 build scripts. A folder README explaining "type:theme today, type:motif after the academic-naming-pass batch" would help future agents not accidentally pre-flip.

---

## Cross-cutting concerns

### C1 — Decision rules that exist only as prose

The following overlap pairs have a documented rule but no compact decision tree an agent can consult in 5 seconds:

| Pair | Where to put X? | Currently documented at |
|---|---|---|
| place ↔ sacred-site | city = 08, religiously-charged-structure = 20 | 08 README §What does NOT, 20 README §What does NOT |
| place ↔ tradition (civilization vs religion) | civilization = 08, religion-of-civilization = 07 | **Not explicitly documented anywhere** — Mesopotamia / Indus-Valley could legitimately live in either |
| relic ↔ symbol | specific-physical-object = 23, abstract-iconographic-unit = 09 | 23 README + 09 cross-link convention |
| relic ↔ attire | named-garment-with-provenance = 23, garment-class = 27 | 27 README only |
| substance ↔ commodity | substance-qua-substance = 24, substance-qua-trade-object = 28 | 28 README only — 24 doesn't mention 28 |
| ritual ↔ practice | communal-performative-act = 14, inner-contemplative-method = 22 | 22 README + rationale §2.6 |
| ritual ↔ divination-system | performative-act-for-religious-purpose = 14, consultation-of-sign-system = 25 | 25 README |
| astronomy ↔ astrology | observational-science = 19, divinatory-interpretation = 25 OR tags OR motifs OR (future) own folder | 19 README acknowledges astrology placement is deferred |
| sacred-site (physical) ↔ theme (mythic) | physical-sacred-mountain = 20, mythic-sacred-mountain (Mt Meru without physical instance) = 06 | **Not explicitly documented** — 20 README example slug `mount-meru-mythic` straddles this; the README puts it in 20 |
| substance ↔ deity (Soma) | substance = 24, deity = 03 | 24 README — two-node convention |
| event ↔ technology | invention-moment-with-provenance = 29, event-in-which-tech-deployed = 05 | 29 README |

**Recommendation:** consolidate into a one-page "where does X live?" table in ONTOLOGY.md or a new `00_meta/lens-decision-tree.md`. Cross-link from every new-lens README.

### C2 — The folder-name / type-field divergence convention is unstated

Lenses whose folder name ≠ type field:

| Folder | Type |
|---|---|
| `20_sacred_architecture/` | `sacred-site` |
| `21_theology/` | `doctrine` |
| `22_practices/` | `practice` (matches stem) |
| `23_material_culture/` | `relic` |
| `24_pharmacology/` | `substance` |
| `25_divination/` | `divination-system` |
| `26_calendars/` | `calendar-system` |
| `27_attire/` | `attire` (matches) |
| `28_exchange_networks/` | `exchange-network` |
| `29_technology/` | `technology` (matches) |

The pattern is "folder = discipline; type = node-kind." It's consistent and intentional but undocumented as a convention. Add a single line to ONTOLOGY §2 noting this.

### C3 — Stale "26-lens" wording in 10 of 13 new-lens READMEs

Every new-lens README from `08_places/` and `18_languages/` through `26_calendars/` opens with "Lens slot N of the 26-lens ontology" (10 READMEs). 27/28/29 correctly say "Lens N of 29." Single-line sweep when the academic-naming-pass batch ships.

### C4 — Coverage gaps (nodes with no clear home today)

I could not surface a *single hard gap*. The 29-lens spine plus the seven edge buckets plus the `category:` tag system covers everything I tested. Edge cases I checked:

- **Diaspora / migration as type** — accommodated as `exchange-network` category `trading-people` for trade-mediated diasporas; covered as `event` for forced migration; covered as `tradition` for resulting religious community. Adequate.
- **Heresy / schism** — covered: dissident teacher in 04 (with `heresiarch` polemic flag), opposed-doctrine in 21, schism-event in 05, sect-as-sub-tradition in 07.
- **Translation events** (Septuagint, Latin Vulgate, House-of-Wisdom Greco-Arabic) — covered: translation in 02 with `translation-of` edge to original document + `attested-in` for the translator-person in 04.
- **Modern movements** (Theosophy, Bahá'í, New Age) — covered: `07_traditions/` with `category: esoteric-order` or `category: new-religious-movement`.
- **Cosmological systems** — explicitly addressed in rationale §5 (theme + theology + calendar split).

**One soft gap:** **named scholars-of-religion / orientalists** (Eliade, Max Müller, Frazer, Smith, Mary Boyce, Doniger). These currently land in `04_persons/` with `role: scholar`. Fine, but their school-of-thought (Frazerian comparativism, Religionswissenschaft, the History-of-Religions school) has no clean home — `15_philosophy/` is rational inquiry-of-traditions, not academic-study-of-religion. **Not blocking.** Could be a `category: academic-school-of-religion` on `07_traditions/` if it accumulates.

### C5 — The auto-stub goblin pattern is creating ontology debt

Confirmed by inspection:
- `24_pharmacology/spice-routes-portuguese-overlay.md` has `type: substance` but is a trade-route concept → belongs in 28.
- `24_pharmacology/balm-of-gilead.md` has `type: substance` — defensible (it IS a substance) but the only context is `Referenced from: 'incense-trade-route-south-arabian'`, so the wikilink originator was probably treating it as a commodity in 28 too.
- `28_exchange_networks/frankincense.md` + `frankincense-as-trade-commodity.md` — slug collision.
- `21_theology/doctrine-alchemy-as-soteriology.md` — defensible placement but stub auto-creation gives the node no rationale doc; future agents may upgrade it wrongly.

The orchestrated initial-wave goblin batch (per the auto-stub note in each file: `goblin-attire-1` + `goblin-exchange-networks-1` + `goblin-technology-1`, 2026-05-20) created stubs *in whichever folder the calling agent assumed*, with no ontology-routing check. **Recommendation:** the next stub-sweep tool needs a lens-routing rule (or, simpler, a "create-only-as-{type}-in-{folder}" flag) so stubs land in the right lens by construction.

---

## Build-pipeline + tooling readiness

| Script | Knows about new lenses? | Where | Severity |
|---|---|---|---|
| `build_data.py` | **YES** — full 29-lens `NODE_DIRS` at lines 21–54 | up to date with 2026-05-19 lock | OK |
| `scripts/git-hooks/pre-commit` | **YES** — regex widened at line 31 to `^(0[1-9]_|1[0-9]_|2[0-9]_)` | up to date | OK |
| `00_meta/LANES.md` | **YES** — explicit per-lens list at lines 25–27 | up to date | OK |
| `build_dashboard.py` | **NO** — `NODE_DIRS` at lines 30–38 lists 7 types only (document/deity/person/event/theme/tradition/symbol) | original 7 only | **BLOCKING for dashboard** |
| `lint_yaml.py` | **NO** — `NODE_DIRS` at lines 40–47 lists 7 types only | original 7 only | **BLOCKING for lint** |
| `fetch_thumbnails.py` | **NO** — `NODE_DIRS = ["02_documents", "03_deities", ...]` at line 32 lists 7 folders | original 7 only | **HIGH — affects thumbs for ~600+ new-lens-eligible nodes** |
| `fetch_wikidata_thumbnails.py` | **NO** — `NODE_DIRS` at lines 36–42 + line 37 references `01_traditions` (broken; should be `07_traditions`) | original 7 only **and** has a pre-existing typo | **HIGH + bug** |
| `review_thumbnails.py` | **NO** — `NODE_DIRS` at lines 35–42 lists 7 types only | original 7 only | MEDIUM |
| `add_depictions.py` | **PARTIAL/UNCLEAR** — no `NODE_DIRS` constant; appears to operate via slug lookup, so lens-agnostic | likely OK | OK (verify in deferred batch) |
| `linkcheck.py` | Not folder-list-driven (no `NODE_DIRS` block found via grep) | likely OK | OK (verify) |

### Schema-doc coverage

`00_meta/schema-*.md` exists for: `deity`, `document`, `event`, `person`, `symbol`, `theme`, `tradition` (7 of 22 node-bearing types — **32%**).

Missing schemas, ranked by urgency (node count + already-staging-content):

| Priority | Type | Folder | Node count | Why urgent |
|---|---|---|---|---|
| 1 | `sacred-site` | 20 | 116 | Largest new lens; in active production |
| 2 | `place` | 08 | 107 | Second-largest; in active production |
| 3 | `exchange-network` | 28 | 58 | New, John explicitly opened the lens |
| 4 | `technology` | 29 | 26 | New, complex 7-subcategory schema |
| 5 | `doctrine` | 21 | 15 | Distinguishes from theme + philosophy — needs sharp schema |
| 6 | `relic` | 23 | 12 | Authenticity-status field unique to this type |
| 7 | `attire` | 27 | 11 | New |
| 8 | `substance` | 24 | 4 | One misfile already; schema would prevent more |
| 9 | `music` / `alphabet` / `alchemy` / `moral` / `ritual` / `philosophy` / `mathematics` / `medicine` | 10–17 | various | Older lenses with no schema doc — **existing-lens debt not addressed by the new-lens push** |
| 10 | `language` / `astronomy` / `practice` / `divination-system` / `calendar-system` | 18/19/22/25/26 | 0 each | Schema before first node lands prevents drift |

---

## Prioritized recommendations

### P0 — Blocking before more content lands

**P0.1 — Update `build_dashboard.py`, `lint_yaml.py`, `fetch_thumbnails.py`, `fetch_wikidata_thumbnails.py`, `review_thumbnails.py` to know all 29 lenses.**
- **Where:** the `NODE_DIRS` constant in each file (line 30 / 40 / 32 / 36 / 35 respectively).
- **Effort:** ~15 minutes total — pure constant updates. Mirror `build_data.py:21-54`.
- **Urgency:** every dashboard regeneration, lint report, and thumbnail fetch since 2026-05-18 has silently missed 22 node types. ~600+ nodes are invisible to these pipelines today.
- **Lane:** B. Should ride with the deferred Lane B batch, NOT be deferred further.
- **Side-fix:** `fetch_wikidata_thumbnails.py:37` has `("01_traditions", "tradition")` — should be `("07_traditions", "tradition")`. Pre-existing bug, ride along.

**P0.2 — Fix the misfiled `24_pharmacology/spice-routes-portuguese-overlay.md` and the duplicate `28_exchange_networks/frankincense*` pair.**
- **Where:** move `spice-routes-portuguese-overlay` to `28_exchange_networks/` with `type: exchange-network`. Decide whether `28/frankincense.md` and `28/frankincense-as-trade-commodity.md` are duplicates (likely) → keep one, redirect the other.
- **Effort:** ~10 minutes. Risk: confirm no other wikilinks target the wrong slug.
- **Urgency:** these will compound if more goblin stubs land alongside them.
- **Lane:** A.

### P1 — High priority, ship in the deferred Lane B batch

**P1.1 — Write schema docs for the top-7 most-populated new types.**
- **Files to create:** `00_meta/schema-place.md`, `schema-sacred-site.md`, `schema-exchange-network.md`, `schema-technology.md`, `schema-doctrine.md`, `schema-relic.md`, `schema-attire.md`.
- **Effort:** ~20 minutes each = ~2.5 hours. Each schema can be derived from the YAML skeleton already in the lens README + a few writer-discipline rules.
- **Urgency:** Lane A is staging content into all of these today without a schema authority. Drift will be 10× cheaper to prevent than to clean up.
- **Lane:** A or B (schemas are meta files; LANES.md treats `00_meta/` as Lane B per §6, but `build_dashboard.py` regenerates several `00_meta/*.md` files. Schemas are hand-written — Lane A or solo opus.).

**P1.2 — Consolidate the cross-lens decision rules into one table.**
- **File:** new `00_meta/lens-decision-tree.md`, or a single new §10 in `00_meta/ONTOLOGY.md`. Lift the 11 rows from §C1 above + the substance/commodity and place/civilization rules + the folder-name vs type-name convention.
- **Effort:** ~30 minutes.
- **Urgency:** today an agent classifying a new node has to read 13 READMEs + ONTOLOGY §2 + both rationale docs to find the rule. One table = one lookup.
- **Lane:** B (meta file).

**P1.3 — Update `00_meta/ONTOLOGY.md` §2 row 1 wording.**
- The "26-lens" wording in the table caption is updated, but the README sweep on the 13 new-lens READMEs has not happened.
- **Where:** every README from `08_places/` and `18_languages/` through `26_calendars/`, first line: "of the 26-lens ontology" → "of the 29-lens ontology."
- **Effort:** ~5 minutes.
- **Urgency:** cosmetic but ships with any sweep.
- **Lane:** A or B (READMEs are Lane A path; trivially atomic).

### P2 — Medium priority, before the next ontology pass

**P2.1 — Write the substance ↔ commodity slug-collision convention.**
- **Rule (proposed):** the canonical slug lives in the *primary lens*. For substances, that's 24. The 28 node is `<slug>-as-trade-commodity`. For commodities-that-are-not-substances (silk, amber, lapis lazuli), the canonical slug lives in 28 with no suffix.
- **Where:** add to ONTOLOGY §7 (slug discipline) and the 28 README.
- **Effort:** ~10 minutes.
- **Lane:** B.

**P2.2 — Add a place ↔ civilization-vs-tradition decision rule.**
- **Rule (proposed, for review):** geographic civilizations (Mesopotamia, Indus Valley) live in 08 with `category: civilization`. The *religion of* the civilization (Vedic religion, Mesopotamian religion) lives in 07 with edge `practiced-in: <place>`.
- **Where:** 08 README + 07 ONTOLOGY description (if needed).
- **Effort:** ~10 minutes.
- **Lane:** A or B.

**P2.3 — Backfill READMEs for old lenses, even minimal ones.**
- The asymmetry where new lenses get rich READMEs and old lenses get nothing pushes new agents to ONTOLOGY.md for everything about deities/symbols/themes.
- **Effort:** ~15 minutes per old-lens README × 16 = ~4 hours. Could be reduced by templating from the ONTOLOGY §2 row.
- **Urgency:** not blocking; pure agent-onboarding ergonomics.
- **Lane:** A or B.

**P2.4 — Write schemas for the remaining 14 node-bearing types.**
- After P1.1's top-7, finish: `music`, `alphabet`, `alchemy`, `moral`, `ritual`, `philosophy`, `mathematics`, `medicine`, `language`, `astronomy`, `practice`, `substance`, `divination-system`, `calendar-system`.
- **Effort:** ~20 minutes each = ~5 hours. Lower urgency than P1.1 because these lenses are less actively staged today.
- **Lane:** A or B.

### P3 — Cosmetic / future-debt

**P3.1 — Goblin-stub creation discipline.**
- Add a lens-routing check to whatever tooling created the 2026-05-20 stub-sweep auto-stubs. At minimum: require an explicit `--target-lens <folder>` flag; refuse to create a stub if the slug matches a folder it doesn't get routed to.
- **Where:** wherever those goblins live (likely `99_ingest/` or an unrecorded script).
- **Effort:** depends on tooling location.
- **Urgency:** prevents future ontology debt.
- **Lane:** A (the goblin tooling) or B.

**P3.2 — Decide the astrology-lens promotion criterion now.**
- The 19 README says "if astrology accumulates enough volume to warrant its own folder later, promote it then." This is a future-decision tax. Naming the threshold (e.g. "≥30 astrology nodes scattered across 06/25/tags → promote to 30_astrology") removes the future debate.
- **Effort:** ~5 minutes to pin the threshold in 19 README + ONTOLOGY §2.
- **Urgency:** very low; current astrology content is well-served by tags + UI tab.
- **Lane:** B.

**P3.3 — Decide the academic-school-of-religion home.**
- Per §C4, Eliade / Frazer / Müller as scholars-of-religion sit in 04_persons but their *school* has no clean lens. If volume accumulates, add `category: academic-school-of-religion` to 07_traditions.
- **Urgency:** very low; no demand signal today.

---

## Closing assessment

The 29-lens ontology is **fundamentally sound**. The two rationale docs hold up; the rejections are well-reasoned; the new-lens READMEs are rich (richer than the old lenses' missing READMEs); the cross-lens edge story for 27+28+29 is genuinely powerful (the gunpowder/Silk-Road/kasaya graph-traversal in `ONTOLOGY-RATIONALE-2026-05-19.md` §2 is real, not theoretical).

The **risks are tooling, not ontology**. The 29-lens spine works on disk and in the head; it does not yet work in `build_dashboard.py`, `lint_yaml.py`, or the thumbnail pipeline. Until those catch up, the dashboard and lint reports are silently incomplete and the new-lens nodes have no thumbnail discipline.

**Single highest-leverage recommendation: ship P0.1 (update the 5 hardcoded `NODE_DIRS` constants) in the next Lane B window, alongside the 06_themes→06_motifs rename.** That is ~20 minutes of mechanical work with vault-wide payoff.

— audit goblin, 2026-05-21
