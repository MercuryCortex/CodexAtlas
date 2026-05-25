# Stubs Quality Audit — 2026-05-21

**Scope.** Read-only inventory and quality audit of every node in the Codex Atlas vault whose YAML frontmatter `status:` is `stub` (any quoting). The vault is ~2,660 nodes across 30 lenses.

**Method.** Files identified with `grep -rli -E '^status:[:space:]*["'\'']?stub["'\'']?[:space:]*$'` against `0?_*/`, `1?_*/`, `2?_*/`, then excluded `00_meta/` (schema docs and PROTOCOL.md contain literal `status: "stub"` examples inside code-fence blocks — they are not real nodes).

---

## Executive summary

- **Total stubs: 1,835** (excluding 5 false positives in `00_meta/` schemas). That is roughly 69% of the vault — the `stub` flag is dramatically over-applied.
- **The status flag is largely meaningless as written.** 590 stubs are ≥30 lines of file, 1,244 are 12–29 lines (rich YAML with attestation, refs, syncretic edges). Only **1** stub (`07_traditions/tradition-elamite.md`) is genuinely empty. The flag does NOT distinguish "true empty stub" from "fleshed-out node that nobody got around to flipping to `metadata`/`full`".
- **Frontmatter integrity is excellent.** Zero filename↔id mismatches across all 1,835 files. Every file has well-formed `---` fences, a `type:` field, an `id:` field, and a label (either `name:` or `title:`).
- **Recent goblin-generated stubs are uniformly minimalist and well-marked** (single-paragraph body + `goblin-*` audit-trail breadcrumb). They are NOT the quality concern; ~80% of the stubs predate the recent waves.
- **17 confirmed semantic mis-filings** detected — mostly places/buildings filed under `04_persons/` (goblin-sacred-architecture-2-A2 wave). One person mis-filed under `08_places/`.
- **3 confirmed in-lens near-duplicate clusters** where a stub and a non-stub exist side-by-side for the same concept (`radha`, `persecution-as-legitimation`, `sacred-geometry-cosmic-proportion`).

**Top-line recommendation.** Do NOT use `status: stub` as a "needs work" signal — at 69% saturation it is non-discriminating. Run a one-shot reclassification pass that downgrades any `status: "stub"` whose file is ≥30 lines and contains structured YAML (`attested-in`, `refs`, `syncretic-edges`, `appearances`) to `status: "metadata"`, leaving only the ~150-200 true breadcrumb stubs as `stub`.

---

## Aggregate counts

**Total stubs across content lenses: 1,835**

| Lens | Stub count | Pct of stub population |
|---|---:|---:|
| 04_persons | 684 | 37.3% |
| 06_themes | 324 | 17.7% |
| 03_deities | 208 | 11.3% |
| 07_traditions | 153 | 8.3% |
| 05_events | 134 | 7.3% |
| 08_places | 106 | 5.8% |
| 02_documents | 84 | 4.6% |
| 28_exchange_networks | 47 | 2.6% |
| 20_sacred_architecture | 44 | 2.4% |
| 29_technology | 15 | 0.8% |
| 21_theology | 14 | 0.8% |
| 23_material_culture | 11 | 0.6% |
| 12_alchemy | 4 | 0.2% |
| 24_pharmacology | 3 | 0.2% |
| 09_symbols | 2 | 0.1% |
| 14_rituals | 1 | <0.1% |
| 11_alphabets | 1 | <0.1% |
| (lenses with 0 stubs) | — | — |

Lenses with zero stubs: `01_timeline`, `10_music`, `13_morals`, `15_philosophy`, `16_mathematics`, `17_medicine`, `18_languages`, `19_astronomy`, `22_practices`, `25_divination`, `26_calendars`, `27_attire`.

### File-size distribution (a key finding)

| Bucket | Count | Meaning |
|---|---:|---|
| ≥30 lines | 590 | These are NOT stubs. They have rich YAML + structured edges + refs. Mis-flagged. |
| 12–29 lines | 1,244 | Headed YAML + 1-3 paragraph context. Probably "partial" or "metadata" in intent. |
| <12 lines | 1 | The only genuine empty stub (`tradition-elamite`). |

### Wave attribution (rough)

Stubs were tallied by audit-trail markers in their bodies:

| Wave / marker | Stubs carrying the marker | Notes |
|---|---:|---|
| `goblin-sacred-architecture-2-A2` (2026-05-19) | 647 | Auto-created during A2 expansion of `20_sacred_architecture/`. Many landed in `04_persons/` (see mis-filings). |
| `goblin-sacred-architecture-1` (2026-05-19) | 159 | The original sacred-architecture wave. |
| `goblin-attire-1` + `goblin-exchange-networks-1` + `goblin-technology-1` (2026-05-20) | 397 | Triple-marked — same set of stubs dropped by the orchestrated initial-wave for lenses 27/28/29. |
| Older / unmarked stubs | ~632 | No `goblin-*` breadcrumb. Pre-goblin organic creation (e.g. deity-flesh nodes mis-flagged as stubs from day one). |
| Carries `2026-05-19` date | 806 | Confirms the bulk of recent stub mass. |
| Carries `2026-05-20` date | 397 | Confirms the 27/28/29 triple-wave. |

(Sum > total because some files carry multiple markers; the 397 triple-wave files contribute to all three goblin counts.)

---

## Top 50 promotion priorities

Stubs ranked by **in-degree** (how many vault files contain `[<stub-id>]`). All counts derived from the full wikilink index built by scanning every `.md` under `0?_*/`, `1?_*/`, `2?_*/`. Self-references excluded from "who-cites-it sample".

| Rank | In-deg | Stub id | Lens | Who-cites-it (sample) |
|---:|---:|---|---|---|
| 1 | 152 | `divine-kingship` | 06_themes | phase-2-034-books-of-kings ; phase-2-014-daodejing ; phase-5-007-sahih-al-bukhari |
| 2 | 114 | `zeus` | 03_deities | dyaus-pita ; apocalyptic-thunderer-vs-serpent ; heracles |
| 3 | 114 | `yahweh` | 03_deities | ethical-monotheism ; gonggong ; phase-5-003-maximus-confessor-ambigua |
| 4 | 111 | `hidden-god` | 06_themes | phase-6-024-kircher-oedipus-aegyptiacus ; phase-4-025-clement-stromata ; phase-6-001-ficino-pimander |
| 5 | 103 | `inanna-sumerian` | 03_deities | venus-roman ; xochiquetzal ; ixbalanque |
| 6 | 100 | `gnosis-as-salvation` | 06_themes | phase-4-025-clement-stromata ; phase-4-028-augustine-confessions ; phase-4-038-hippolytus-refutation |
| 7 | 96 | `vishnu` | 03_deities | ritual-kumbh-mela-pilgrimage ; pazuzu ; kalki |
| 8 | 93 | `jesus-christ-deity` | 03_deities | event-crucifixion-of-jesus-c30ce ; tat-hermetic ; divine-child |
| 9 | 86 | `indra` | 03_deities | dyaus-pita ; apocalyptic-thunderer-vs-serpent ; vahagn |
| 10 | 85 | `tiamat` | 03_deities | nuwa ; apocalyptic-thunderer-vs-serpent ; yoni |
| 11 | 82 | `apollo` | 03_deities | panacea ; music-orpheus-tradition ; murugan |
| 12 | 81 | `dionysus` | 03_deities | divine-child ; ritual-egungun-masquerade ; music-orpheus-tradition |
| 13 | 79 | `non-duality` | 06_themes | phase-5-032-yogavasishtha ; phase-5-016-ramanuja-sribhasya ; phase-5-021-ibn-arabi-fusus-al-hikam |
| 14 | 77 | `tradition-hinduism` | 07_traditions | ritual-kumbh-mela-pilgrimage ; ritual-navjote-zoroastrian-initiation ; tattoo-sacred |
| 15 | 71 | `enki-ea` | 03_deities | gonggong ; ninkasi ; nanshe-sumerian |
| 16 | 69 | `demeter` | 03_deities | event-eleusinian-mysteries-c1500-bce-396-ce ; toyouke-omikami ; phase-2-030-euripides-bacchae |
| 17 | 68 | `marduk` | 03_deities | apocalyptic-thunderer-vs-serpent ; pazuzu ; phase-1-020-shumma-alu |
| 18 | 65 | `ahura-mazda` | 03_deities | ritual-navjote-zoroastrian-initiation ; haoma ; music-zoroastrian-sacred-sound |
| 19 | 61 | `soul-immortality` | 06_themes | phase-4-099-shangqing-corpus ; phase-5-003-maximus-confessor-ambigua ; ritual-taoist-inner-alchemy |
| 20 | 61 | `mary-theotokos` | 03_deities | jesus-christ-deity ; divine-feminine ; mazu |
| 21 | 60 | `enlil` | 03_deities | gonggong ; pazuzu ; nergal |
| 22 | 59 | `microcosm-macrocosm` | 06_themes | phase-4-099-shangqing-corpus ; phase-6-024-kircher-oedipus-aegyptiacus ; as-above-so-below |
| 23 | 57 | `ascent-of-the-soul` | 06_themes | phase-4-099-shangqing-corpus ; phase-3-013-philo-of-alexandria ; phase-5-048-theology-of-aristotle-arabic |
| 24 | 57 | `angra-mainyu-ahriman` | 03_deities | haoma ; satan-christian ; theme-asha-druj-cosmic-opposition |
| 25 | 56 | `dualism-cosmic` | 06_themes | theme-asha-druj-cosmic-opposition ; phase-2-004-yasna-younger-avesta ; zarathustra |
| 26 | 55 | `chaoskampf` | 06_themes | apocalyptic-thunderer-vs-serpent ; phase-1-028-kumarbi-cycle ; kumarbi |
| 27 | 55 | `afterlife-judgment` | 06_themes | end-times-judgment ; phase-5-007-sahih-al-bukhari ; phase-2-003-atharva-veda |
| 28 | 54 | `theme-cosmic-mountain-as-temple-form` | 06_themes | templo-mayor-tenochtitlan ; chavin-de-huantar ; eridu-temple-of-enki |
| 29 | 52 | `ishtar-akkadian` | 03_deities | venus-roman ; phase-1-020-shumma-alu ; xochiquetzal |
| 30 | 51 | `soul-as-spark` | 06_themes | phase-4-028-augustine-confessions ; phase-6-001-ficino-pimander ; phase-3-005-stoic-foundational-texts |
| 31 | 49 | `dumuzi-tammuz` | 03_deities | hunahpu ; geshtinanna ; hieros-gamos |
| 32 | 49 | `apocalyptic-revelation` | 06_themes | phase-3-004-1-enoch ; phase-2-031-aeschylus-oresteia ; phase-4-065-shepherd-of-hermas |
| 33 | 47 | `persephone-greek` | 03_deities | event-eleusinian-mysteries-c1500-bce-396-ce ; ixbalanque ; ataecina |
| 34 | 47 | `gaia` | 03_deities | nuwa ; yoni ; phase-2-031-aeschylus-oresteia |
| 35 | 46 | `an-sumerian` | 03_deities | ninhursag-nintud ; kumarbi ; phase-1-003-enheduanna-hymns |
| 36 | 45 | `poseidon` | 03_deities | event-parthenon-construction-447-432-bce ; trishula ; pachacamac |
| 37 | 45 | `ibn-arabi` | 04_persons | phase-5-021-ibn-arabi-fusus-al-hikam ; mulla-sadra ; soul-exile-longing |
| 38 | 44 | `primordial-waters` | 06_themes | phase-2-014-daodejing ; earth-diver-creation ; phase-2-003-atharva-veda |
| 39 | 43 | `world-axis` | 06_themes | eridu-temple-of-enki ; phase-7-038-guenon-symbols-sacred-science ; theme-ziggurat-as-stairway-to-heaven |
| 40 | 42 | `messianism` | 06_themes | suffering-servant ; frashokereti-cosmic-renovation ; fulfillment-of-prophecy |
| 41 | 41 | `divine-council` | 06_themes | theme-el-yahweh-merger ; phase-1-028-kumarbi-cycle ; phase-1-033-anzu-myth |
| 42 | 39 | `chosen-people` | 06_themes | phase-2-034-books-of-kings ; phase-5-016-ramanuja-sribhasya ; phase-4-033-babylonian-talmud |
| 43 | 38 | `emptiness-sunyata` | 06_themes | nagarjuna ; tradition-madhyamaka ; prajnaparamita-goddess |
| 44 | 38 | `apotheosis` | 06_themes | tradition-zen ; tradition-bon ; phase-4-079-coptic-asclepius-nhc-vi-8 |
| 45 | 36 | `saraswati` | 03_deities | alphabet-devanagari-sacred ; menvra-etruscan ; sri-yantra |
| 46 | 36 | `divine-immanence` | 06_themes | ritual-opening-of-the-mouth ; phase-4-079-coptic-asclepius-nhc-vi-8 ; tradition-donghak |
| 47 | 36 | `aphrodite-greek` | 03_deities | venus-roman ; yemoja ; sacred-dove |
| 48 | 35 | `thomas-aquinas` | 04_persons | phase-4-100-celestial-hierarchy ; event-toledo-translations-1085-1150 ; meister-eckhart |
| 49 | 35 | `nun` | 03_deities | kek-egyptian ; sobek ; phase-1-002-pyramid-texts |
| 50 | 35 | `ethical-dualism` | 06_themes | phase-5-007-sahih-al-bukhari ; phase-2-031-aeschylus-oresteia ; phase-4-065-shepherd-of-hermas |

**Reading the table.** Many of these (e.g. `melqart` at lower rank, `zeus`, `yahweh`, `vishnu`) are already 50–100-line files with structured YAML — they do NOT need new content authoring, they need a status-flag flip and a paragraph or two of body prose. The 06_themes cluster (`divine-kingship`, `hidden-god`, `gnosis-as-salvation`, `non-duality`, `chaoskampf`, etc.) IS the real promotion target: these are the cross-tradition motifs that earn their high in-degree precisely because they are the "spine" themes John has been targeting.

---

## Quality issues found

### Malformed YAML

**None.** Every one of the 1,835 stubs has well-formed `---` fences and a parseable `type:`+`id:` header. Random spot-check of 30 files across 7 lenses also found no indentation or quoting bugs.

### Missing required fields

- `type:` missing — 0 files.
- `id:` missing — 0 files.
- `name:` OR `title:` missing — 0 files. (12_documents stubs use `title:` per documents-schema convention; non-document stubs use `name:` per the other schemas. 22 stubs use `title:` instead of `name:`; that is correct convention for documents.)
- Filename ↔ `id:` mismatches — 0 files.

### Mis-typed stubs (wrong lens)

Confirmed semantic mis-filings (stubs whose subject does not fit the lens):

**Places/buildings filed under `04_persons/` (16 cases — likely from `goblin-sacred-architecture-2-A2`):**

- `04_persons/ollantaytambo-town.md` — town/site, belongs in `08_places/` or `20_sacred_architecture/`
- `04_persons/pyramid-of-the-moon-teotihuacan.md` — sacred architecture
- `04_persons/plans-of-cologne-cathedral-medieval-and-19th-c.md` — architectural-plans document, belongs in `02_documents/` or `20_sacred_architecture/`
- `04_persons/new-temple-chavin.md` — sacred architecture
- `04_persons/old-temple-chavin.md` — sacred architecture
- `04_persons/gyeongbokgung-palace.md` — sacred/political architecture
- `04_persons/tikal-temple-ii.md` — sacred architecture
- `04_persons/temple-of-the-three-windows-machu-picchu.md` — sacred architecture
- `04_persons/sun-temple-ollantaytambo.md` — sacred architecture
- `04_persons/temple-of-the-warriors-chichen-itza.md` — sacred architecture
- `04_persons/cahokia-grand-plaza.md` — site
- `04_persons/masada-fortress.md` — site/fortress, belongs in `08_places/`
- `04_persons/valley-of-the-kings.md` — necropolis site, belongs in `08_places/`
- `04_persons/salmon-ruin.md` — site
- `04_persons/baekje-kingdom.md` — historical state/polity, belongs in `05_events/` or `08_places/`
- `04_persons/etruscan-civilization.md` — civilization, belongs in `07_traditions/`

**People filed under `08_places/` (1 case):**

- `08_places/king-louis-vii-of-france.md` — historical person, belongs in `04_persons/`

### "Out-degree" — body wikilinks in stubs

A stub is conceptually empty, so should have minimal outgoing links. Findings:

- 623 stubs have ≥1 wikilink in body — almost all are the goblin-stub pattern (a single context sentence with 1–3 inline links naming the parent node that introduced them). This is acceptable and useful breadcrumb context, not a violation.
- **132 stubs have >5 body wikilinks** — these are mis-flagged as stub. Spot-check: `03_deities/melqart.md` is 100 lines with rich `attested-in`, `equivalents`, `syncretic-edges`, and `refs` blocks. Marking it `stub` is misleading. Similar examples: `03_deities/jesus-christ-deity.md` (70 lines), `03_deities/izanagi.md` (57 lines), `03_deities/the-trinity.md`, `03_deities/krishna-deity-vaishnava.md`, `03_deities/bondye-vodou.md`, plus 126 others.
- **590 stubs are ≥30 lines** total — most overlap with the >5-wikilink set. These should be reclassified `status: "metadata"` (or `"partial"`) en masse.

### Near-duplicate clusters (stub + non-stub for same concept)

Three confirmed clusters where both nodes are in the same lens:

1. **`radha`** (deity)
   - `03_deities/radha-deity.md` (status: metadata)
   - `03_deities/radha.md` (status: stub)
   - Action: merge stub into the `metadata` node; delete the stub or convert it to a redirect.

2. **`persecution-as-legitimation`** (theme)
   - `06_themes/theme-persecution-as-legitimation.md` (status: metadata)
   - `06_themes/persecution-as-legitimation.md` (status: stub)
   - Action: keep the `theme-` prefixed one (matches the prefix convention used by `theme-cosmic-mountain-as-temple-form` etc.); delete or redirect the un-prefixed stub.

3. **`sacred-geometry-cosmic-proportion`** (theme)
   - `06_themes/theme-sacred-geometry-cosmic-proportion.md` (status: stub)
   - `06_themes/sacred-geometry-cosmic-proportion.md` (status: metadata)
   - Action: opposite of #2 — here the un-prefixed version has metadata. Pick a convention for `06_themes/` (mixed `theme-` prefix usage is itself a minor concern) and consolidate.

Additionally, one cross-lens cluster worth flagging (not a clean duplicate, but a potential edge case):

- `cherokee` — `07_traditions/tradition-cherokee.md` (stub) and `11_alphabets/alphabet-cherokee.md` (full). Different concepts (people vs. their syllabary), correctly separated. NO action needed; included only because the auto-tool flagged it.

- `malta-temples-c-3600-2500-bce` — `05_events/event-malta-temples-c-3600-2500-bce.md` (metadata) and `20_sacred_architecture/malta-temples-c-3600-2500-bce.md` (stub). Borderline: the event of construction and the architectural complex are arguably distinct. Leave alone unless John wants a merge.

### Truly-empty stubs

Only **one** stub has <50 chars of body content:

- `07_traditions/tradition-elamite.md` — entirely blank below frontmatter.

### Cosmetic: auto-titlecased `name:` fields

36 stubs have `name:` strings that were generated by naive title-casing of the slug, producing artifacts like `"Thutmose Iii"`, `"Pope Boniface Viii"`, `"Murad Iv"`, `"Plans Of Cologne Cathedral Medieval And 19Th C"`. Not a bug per se (the slug-id is correct), but if `name:` is ever surfaced in the Atlas Map UI the Roman numerals will render lowercase-cased. Cheap to fix in a sweep.

Examples:
- `04_persons/thutmose-iii.md` → `"Thutmose Iii"` (should be "Thutmose III")
- `04_persons/pope-boniface-viii.md` → `"Pope Boniface Viii"`
- `04_persons/archbishop-makarios-iii-of-sinai.md`
- `04_persons/jayavarman-vii.md`
- `04_persons/king-henry-iii-of-england.md`
- `04_persons/murad-iv.md`
- `04_persons/pope-boniface-iv.md`
- `04_persons/amenhotep-iii.md`
- `04_persons/pope-alexander-iii.md`
- `04_persons/plans-of-cologne-cathedral-medieval-and-19th-c.md`

### Cosmetic: diacritic-bearing slugs

Five stubs have non-ASCII characters in their filenames:

- `camões`
- `bishop-renaud-de-mouçon`
- `gyōshin`
- `mōri-motonari`
- `kūkai`

The vault is otherwise uniformly ASCII-slug; if there is a tooling reason for ASCII-only (Obsidian URL handling, build scripts), these are minor outliers. Otherwise harmless.

---

## Recommendations

1. **Reclassify, do not re-write.** Roughly 1,650 of the 1,835 stubs are already substantive. Run a one-shot script that for every `status: "stub"` file:
   - If body length ≥30 lines AND frontmatter contains any of `attested-in:`, `refs:`, `syncretic-edges:`, `appearances:`, `key-deities:`, `key-persons:` → flip to `status: "metadata"`.
   - If body contains a `goblin-*` audit-trail breadcrumb AND body is <20 lines → leave as `stub`.
   - Result: the `stub` flag becomes meaningful again (~150–300 true breadcrumbs) and the Atlas Map / Forge can color/filter them honestly.

2. **Promote the top-50 themes/deities to full nodes first.** The 06_themes spine (`divine-kingship`, `hidden-god`, `gnosis-as-salvation`, `non-duality`, `chaoskampf`, `microcosm-macrocosm`, `world-axis`, `chosen-people`, `messianism`, `ascent-of-the-soul`, `dualism-cosmic`, `divine-council`, `primordial-waters`, `apocalyptic-revelation`) is the highest-leverage promotion queue — each one is cited by 40–150 other nodes and currently anchors broad cross-tradition edges with thin bodies.

3. **Fix the 17 confirmed mis-filings in one move.** Auto-move place/architecture/civilization slugs out of `04_persons/` into `08_places/`, `20_sacred_architecture/`, `07_traditions/`, or `05_events/` per the list above. Update their `type:` field to match. Re-wire wikilinks via a vault-wide rewrite (no rename necessary if the slug is preserved across the move, but the type must be updated). Move `king-louis-vii-of-france` from `08_places/` to `04_persons/`.

4. **Resolve the 3 in-lens duplicates** (`radha` / `persecution-as-legitimation` / `sacred-geometry-cosmic-proportion`). For 06_themes specifically, also decide whether the `theme-` prefix is mandatory or optional and enforce one direction. The current mix invites future duplicates.

5. **Decide on the truly-empty `tradition-elamite` stub** — either author 10 lines of context (it has nontrivial wikilink-target value) or delete it and let the dead-link audit flag the orphans.

6. **Cosmetic name-case sweep.** Run a regex pass over the 36 auto-titlecased `name:` fields to fix Roman numerals (`Iii` → `III`, etc.) and ordinals (`19Th` → `19th`). One-time, low-risk.

7. **Add a stub-creation contract to AGENTS.md.** New stubs from future goblin waves should set `status: "stub"` ONLY for true breadcrumb cases (<20 lines, no structured edges). When a goblin promotes a stub to a partial node mid-batch, it must flip the status — otherwise the count will rebuild to its current 69% saturation.

8. **De-prioritize duplicate-detection rework.** With only 3 confirmed in-lens duplicates against a population of 1,835, the slug discipline is already very good. No systemic problem here.

---

## Appendix: files & artefacts

- Stub file list: `/tmp/stub_real.txt` (1,835 paths, transient).
- All wikilink targets across vault: 45,967 occurrences.
- Top-50 in-degree queue: `/tmp/top50_stubs.txt` (transient).
- Lens that absorbed the most goblin-generated stubs: `04_persons/` (684 — most from the sacred-architecture A2 wave; significant contamination from mis-filings).
- Lens with healthiest stub-to-non-stub ratio: `02_documents/` (only 84 stubs against a much larger document population), `28_exchange_networks/` (47 stubs, mostly goblin-marked and small).
- Lens with worst ratio: `06_themes/` and `03_deities/` — but in these lenses "stub" is largely a mis-label for "partial-metadata", not a content vacuum.
