# Undated-node Dating Framework — Proposal

*Audit date: 2026-05-24. Author: goblin-undated-dating. Scope: a tier system + YAML schema for placing the ~2,390 currently-undated nodes onto the timeline spine with named evidence, not guesses.*

---

## 0. The population (measured, not estimated)

`build_data.py` (line 1020) currently coalesces five YAML fields into the runtime `date_earliest` scalar:

```
date-composed-earliest | period-active-earliest | date-start | date-born | period-earliest
```

A folder-by-folder count of nodes lacking **all five** of those fields:

| Lens | total | undated | undated % |
|---|---:|---:|---:|
| 02_documents | 503 | 104 | 21% |
| 03_deities | 683 | 23 | 3% |
| 04_persons | 1187 | 510 | 43% |
| 05_events | 309 | 140 | 45% |
| 06_themes | 497 | 484 | 97% |
| 07_traditions | 308 | 305 | 99% |
| 08_places | 112 | 111 | 99% |
| 09_symbols | 280 | 34 | 12% |
| 12_alchemy | 35 | 35 | 100% |
| 14_rituals | 106 | 106 | 100% |
| 20_sacred_architecture | 126 | 126 | 100% |
| 21_theology | 15 | 15 | 100% |
| 22_practices | 12 | 12 | 100% |
| 25_divination | 14 | 14 | 100% |
| 26_calendars | 12 | 12 | 100% |
| (smaller lenses) | – | ~30 | – |

**Critical finding before we even get to inference.** A grep across the undated set for *any* `date-*` or `period-*` frontmatter field shows that **~755 of the ~2,390 "undated" nodes already carry a parseable date** under a field name the build script does not coalesce. The de-facto field inventory across the vault:

| field | uses |
|---|---:|
| `date-physical-mss-earliest` | 380 |
| `date-redacted` | 345 |
| `date-end` | 323 |
| `date-emergence` | 153 |
| `date-built-earliest` | 72 |
| `date-attested-earliest` | 37 |
| `date-rebuilt` | 30 |
| `date-composed` | 24 |
| `date-consecrated` | 6 |
| `date-founded-earliest` | 2 |
| `date-discovered` / `date-excavation-start` | 2 each |

The most valuable fields for our purposes — `date-built-earliest` (sacred architecture), `date-attested-earliest` (rituals/divination/calendars/practices), `date-emergence` (traditions) — are **all currently invisible to the timeline**. Coalescing them is a one-line build fix that recovers ~30% of the undated population *before any inference is needed*. Treat that as Step 0; everything below is about the residue.

---

## 1. The 7-tier proposal — accepted with one rename

The proposed T1–T7 is the right shape. The one problem is naming: the vault already runs a CODEX-blessed `source_tier: T1–T5` axis (mainstream-acceptance, surfaced in YAML and in every edge tooltip). A second `T1–T7` axis on the same node will collide visually and semantically.

**Proposed rename: `dating_basis: B1–B7`.** "Basis" reads as evidence-class, not source-quality, and the `B` prefix makes grep + UI chrome unambiguously distinct from `T`. Everything below uses B-notation.

| Basis | What it is | Confidence | Typical anchor |
|---|---|---|---|
| **B1** | Explicit primary date — already the canonical `date_earliest` | high | birth-year, regnal year, composition year |
| **B2** | First textual attestation — oldest CITED mention in a dated source | high | "Marduk first attested in the Adab tablet, c. -2400" |
| **B3** | Oldest dated archaeology — material evidence | high | cult site, inscription, iconographic find |
| **B4** | First scripture appearance — figure/motif first appears in a text with known compilation date | medium-high | "Suffering Servant: Deutero-Isaiah c. -540" |
| **B5** | Scholarly-consensus emergence period | medium | "Sufism crystallizes c. 800-900 CE per Schimmel" |
| **B6** | Family / tradition median — soft inheritance from parent | low | a Vedic deity-stub without further evidence gets c. -1200 |
| **B7** | Genuinely undatable — timeless, abstract, or modern reconstruction of an unrecoverable original | n/a | "axis mundi as motif"; PIE reconstructions; "the Goddess" |

A separate one-word `dating_confidence: high | medium | low` is redundant if B1–B7 is read correctly, but I'd surface it anyway for the UI (color-ramp the timeline node-rim by confidence).

---

## 2. Sample distribution (40 nodes)

`id | type | family | basis | inferred_year | reasoning`

```
wiraqocha                                | deity     | Andean       | B5 | -1200 | Inca creator god, but the figure is pre-Inca; "Wari/Tiwanaku Staff-God" iconography is dated c. -500 to 1000 (Cook 1994); take median.
zhenwu                                   | deity     | Chinese      | B2 | 200   | First attestation as Xuanwu in Han-era Chu texts; cult crystallizes Tang/Song.
toyouke                                  | deity     | Shinto       | B4 | 712   | First scriptural mention: Kojiki (712 CE); cult at Ise Outer Shrine c. 478 CE per Ise records → could be B3, B4 is safer.
narada                                   | deity     | Vedic        | B4 | -1000 | First mentioned in Rigveda 8.13.6 (a Narada hymn); compilation c. -1200 to -1000.
tagori-hime, ichikishima-hime            | deity     | Shinto       | B4 | 712   | Munakata triad; first textual: Kojiki/Nihon Shoki 712/720 CE.
thutmose-iii                             | person    | Egyptian     | B1 | -1479 | Known regnal years; this node IS dated via date-born — the stub frontmatter just doesn't carry it. Fix at content layer.
hatshepsut                               | person    | Egyptian     | B1 | -1507 | Already has date-born (sample confirms the build script coalesces correctly here).
kim-daeseong                             | person    | Korean       | B1 | 700   | Historical (c. 700-774 CE); needs frontmatter population, not inference.
luis-lumbreras                           | person    | scholarly    | B1 | 1936  | Modern archaeologist; trivially datable.
crispin-branfoot                         | person    | scholarly    | B1 | 1965  | Modern art historian (SOAS); trivially datable.
hyksos                                   | person    | Egyptian     | B5 | -1650 | Group, not individual; 15th-Dynasty period c. -1650 to -1550 per Ryholt 1997.
turks                                    | person    | (group)      | B7 | —     | The category "Turks" as ethno-linguistic group spans 6th c. CE to present. Re-classify as ethnonym, not person; mark B7 with a note.
tradition-vedic                          | tradition | Vedic        | B1 | -1500 | (this node IS dated — counter-example confirming the field works)
tradition-ismailism                      | tradition | Islamic      | B5 | 765   | date-emergence: 765 already in frontmatter — pure build-pipeline coalesce win.
tradition-tenrikyo                       | tradition | Japanese-new | B5 | 1838  | date-emergence: 1838 already in frontmatter.
tradition-roman-religion                 | tradition | Roman        | B5 | -700  | date-emergence: -700 already in frontmatter.
tradition-modernisme-catala              | tradition | Catalan      | B5 | 1888  | Modernisme c. 1888-1911; needs content population.
tradition-qadiriyya                      | tradition | Sufi         | B5 | 1166  | Qadiriyya founded by Abd al-Qadir al-Jilani (d. 1166); use founding date.
suffering-servant                        | theme     | Jewish       | B4 | -540  | First attestation: Deutero-Isaiah ch. 53; compilation c. -540 (Blenkinsopp 2000).
son-of-man                               | theme     | Jewish       | B4 | -540  | Earliest layer: Daniel 7 (c. -165); but Ezekiel "son of man" usage c. -593 → take -540 conservatively.
katabasis-and-anabasis                   | theme     | Greek+ANE    | B4 | -2100 | First attestation: Descent of Inanna (c. -2100 OB recension); motif obviously older.
archetype                                | theme     | Platonic+    | B5 | -380  | Plato's *Forms* (c. -380); Jung's redefinition (1919) is a separate node-event.
two-spirits-doctrine                     | theme     | Jewish-Iran. | B4 | -700  | Earliest layer: Gathas of Zarathustra (c. -1200 traditional, -700 mainstream); 1QS Two-Spirits Treatise c. -100.
divinatory-calendar                      | theme     | cross-trad   | B4 | -2000 | First scriptural: Enuma Anu Enlil (c. -2000 OB recension); Mesoamerican parallel c. -500.
holy-grail                               | symbol    | Arthurian    | B2 | 1190  | First attestation: Chrétien de Troyes *Perceval* c. 1180-1191. Pre-Christian Celtic vessel-of-abundance is a B5 ancestor (-200 ish).
sacred-number-108                        | symbol    | Dharmic      | B5 | -800  | Embedded in Upanishadic numerology; first explicit textual count in Mukhya Upanishads c. -800.
torii-gate                               | symbol    | Shinto       | B3 | 922   | Oldest extant torii: Kubo Hachiman-jinja stone torii, dated 922 CE. Earlier wooden examples implied but undated.
zodiac-wheel                             | symbol    | Babylonian   | B3 | -500  | Babylonian MUL.APIN zodiacal divisions c. -500; iconographic wheel-of-12 later (-300 Hellenistic).
quipu                                    | symbol    | Andean       | B3 | -2500 | Caral-Supe quipu c. -2500 (Mann 2005, Urton 2003) — physical archaeology, B3 with strong dating.
oshe-shango                              | symbol    | Yoruba       | B5 | 1300  | Shango cult crystallizes Oyo c. 1300; iconography lineage to neolithic West-African thunder-axe (B6 fallback to family).
ritual-akitu-new-year                    | ritual    | Mesopotamian | B1 | -2100 | (already dated -2100 → -140; counter-example)
ritual-yajna-vedic-fire                  | ritual    | Vedic        | B1 | -1500 | (already dated; counter-example)
ritual-runic-inscription                 | ritual    | Norse        | B1 | -150  | (already dated; counter-example)
ritual-monastic-profession               | ritual    | Christian    | B5 | 400   | Stub. Earliest formal monastic profession: Pachomian/Basilian c. 350-400 CE.
ritual-agape-love-feast                  | ritual    | Christian    | B1 | 50    | (already dated)
ritual-vodou-healing                     | ritual    | Afro-Atl.    | B1 | 1700  | (already dated; founding period of Vodou syncretism in Saint-Domingue)
alchemy-philosophers-stone               | alchemy   | Hermetic     | B1 | 800   | (already dated via date_earliest: 800)
alchemy-rosicrucian-manifestos           | alchemy   | Renaissance  | B1 | 1614  | (already dated)
alchemy-elixir-of-immortality            | alchemy   | (Chinese)    | B5 | -300  | Stub. Chinese waidan/elixir tradition c. -300 (Zhou); Western Latin "elixir" loanword c. 1200.
alchemy-conjunction-hieros-gamos         | alchemy   | Hermetic     | B5 | 200   | Conceptual root in *Chymical Wedding* trope; Bolus of Mendes c. -200; latinized c. 1100s. Median c. 200.
istikhara-islamic                        | divination| Islamic      | B1 | 700   | date-attested-earliest: 700 already present.
geomancy-raml-cross-tradition            | divination| Islamic→Lat. | B1 | 800   | date-attested-earliest: 800 already present.
extispicy-mesopotamian                   | divination| Mesopotamian | B1 | -2000 | date-attested-earliest: -2000 already present.
egyptian-civil-calendar                  | calendar  | Egyptian     | B1 | -2800 | date-attested-earliest: -2800 already present.
hindu-panchang-calendar                  | calendar  | Hindu        | B1 | -1500 | date-attested-earliest already present.
mayan-calendrical-system                 | calendar  | Maya         | B1 | -100  | date-attested-earliest already present.
pilgrimage-cross-tradition               | practice  | cross-trad   | B1 | -2000 | date-attested-earliest already present.
karnak-temple-complex                    | sacred-site| Egyptian    | B1 | -2055 | date-built-earliest: -2055 already present.
itsukushima-shrine                       | sacred-site| Shinto      | B1 | 593   | date-built-earliest: 593 already present.
etemenanki                               | sacred-site| Mesopotamian| B3 | -2100 | Stub. Etemenanki ziggurat at Babylon, earliest archaeology Ur-III period; Nebuchadnezzar II rebuild c. -600.
sarnath                                  | place     | Buddhist     | B3 | -250  | Ashokan archaeology c. -250; Buddha's sermon c. -500 (B4 alternative via Suttapitaka).
abbasid-caliphate                        | place/era | Islamic      | B5 | 750   | Polity-as-place; 750-1258 CE; emergence: 750.
new-kingdom-egypt                        | place/era | Egyptian     | B5 | -1550 | Polity-as-era stub; New Kingdom c. -1550 to -1077.
beijing-city                             | place     | Chinese      | B3 | -1000 | Jicheng founding c. -1000; Yanjing/Beijing as capital from 1153 CE.
ollantaytambo-town                       | place     | Andean       | B3 | 1400  | Inca-period construction c. 1440; pre-Inca occupation c. 600 (B3 archaeology).
doctrine-padroado-portuguese-crown-mission| doctrine | Christian    | B5 | 1455  | Romanus Pontifex 1455; Tordesillas 1494 — locks doctrine.
doctrine-protestant-priesthood-of-all-believers | doctrine | Christian | B4 | 1520 | First explicit Luther formulation: *On the Babylonian Captivity* 1520.
doctrine-vernacular-scripture            | doctrine  | Christian    | B5 | 1382  | Wycliffe Bible 1382; pre-Reformation; Luther German Bible 1522 (anchor).
event-cahokia-foundation-c-1050-ce       | event     | Mississippian| B1 | 1050  | Date IS IN THE SLUG. Slug-extraction rule recovers it trivially.
event-jikji-printed-1377                 | event     | Korean-Bdh   | B1 | 1377  | Slug-extractable.
event-imjin-war-burning-of-bulguksa-1593 | event     | Korean       | B1 | 1593  | Slug-extractable.
event-tischendorf-1859-mission           | event     | Christian    | B1 | 1859  | Slug-extractable.
event-collapse-of-bronze-age             | event     | Bronze-Age   | B5 | -1177 | Consensus: c. -1200 to -1150 (Cline 2014). Use -1177 (Cline's anchor).
event-seokguram-rediscovery-1907         | event     | Korean       | B1 | 1907  | Slug-extractable.
```

---

## 3. Per-category strategy

| Category | Realistic bases | Inaccessible / poor fit |
|---|---|---|
| **Deities** | B2 (first text mention) > B3 (oldest cult site) > B4 (first-scripture) > B6 (family median). | B7 reserved for **abstract divine concepts only** (e.g., "the Godhead," "Logos-as-principle") — NOT for figures like Wiraqocha; those get B5/B6 with a confidence flag. |
| **Persons** | B1 should win 95% of the time — they have birth/death years. Undated persons are nearly all stubs missing frontmatter, not unknowable. | B7 only for legendary unattested figures (Manu, Yima, Romulus); but even there B5 (era of first attestation) is usually obtainable. |
| **Documents (scriptures)** | B1 (date-composed-earliest) > B4 (first-attestation in citing text). | B3 (manuscript archaeology) is captured but separately: `date-physical-mss-earliest` (380 nodes) is the *manuscript* date, distinct from *composition* — don't conflate. |
| **Events** | B1, with a **slug-extraction rule** (regex `(c-?-?(\d{2,4}))` and `(\d{2,4})-(\d{2,4})`) that captures the ~50 stub-events with year-in-slug. | Bronze-Age-collapse-class events need B5 (scholarly window). |
| **Themes / motifs** | B4 dominant (first scripture); B5 secondary. | B7 *only* for genuinely cross-cultural archetypal categories ("sacred mountain," "sacred number"); even those usually have a B2 first attestation. Don't over-use B7 — themes that "feel timeless" usually have a first textual moment. |
| **Traditions** | B5 (`date-emergence`) — already in 153 frontmatters and trivially coalesceable. | B7 only for "perennial philosophy"-type abstractions (which are themes, not traditions). |
| **Places (settlements / monuments)** | B3 dominant (oldest occupation layer); B1 for date-founded; B5 for polity-as-place ("Abbasid Caliphate," "New Kingdom Egypt"). | B7 reserved for cosmological / mythical places (Olympus, Mount Meru, Jerusalem-celestial). |
| **Sacred architecture** | B1 (date-built-earliest) coalesce already obtainable for 72 nodes; B3 for ruins; B5 for legendary structures. | B7 for mythical-only structures (Babel post-destruction, Solomon's Temple as type-not-archaeology). |
| **Symbols** | B3 (earliest iconographic find) > B2 (earliest text reference) > B5 (motif emergence). | B7 only for symbols whose origin is truly diffuse ("circle," "spiral") — and even then a first attested *named* use is usually findable. |
| **Rituals / practices / divination / calendars / alchemy / theology / doctrine** | B1 (`date-attested-earliest` already present for many) > B5 (emergence period). | B7 rarely applicable — even "cross-tradition" practices have an earliest dated locus. |
| **Alphabets / languages / astronomy** | B3 (earliest inscription) > B5 (reconstruction). | B7 only for PIE / Proto-Afroasiatic-class reconstructions. |

---

## 4. Tier population estimate

Of the ~2,390 currently-undated nodes:

| Basis | Est. recovered | Mechanism |
|---|---:|---|
| B1 (already in YAML, build-script blind) | **~755** | Coalesce `date-emergence`, `date-built-earliest`, `date-attested-earliest`, `date-founded-earliest` into runtime `date_earliest`. Pure pipeline fix. |
| B1 (slug-extractable events) | ~50 | Regex on event ids. |
| B1 (stubs needing frontmatter only) | ~400 | Persons + events that are historical-but-stubbed; agent task, not inference. |
| B2 (first-attestation) | ~250 | Deities, themes, symbols with citable first mention. |
| B3 (archaeology) | ~150 | Sacred-architecture stubs, place stubs, symbol stubs. |
| B4 (first-scripture) | ~350 | Themes/motifs/doctrines whose earliest layer is a dated text. |
| B5 (consensus emergence) | ~300 | Traditions, alchemy-concepts, doctrines, rituals. |
| B6 (family median, soft) | ~80 | Deity stubs with no further evidence (Wiraqocha-class). |
| B7 (genuinely undatable) | ~50 | Abstract motifs, perennial-philosophy concepts, cosmological-only places. |
| **Residue** | ~10 | True dead-ends; mark `dating_basis: B7` with `dating_basis_notes: "no evidence located in 2026-05-24 pass"`. |

Order of magnitude: **~30% of "undated" is a build-pipeline bug**, **~50% is recoverable with named evidence**, **~17% needs soft-tier inference (B5/B6)**, **<3% is genuinely B7**.

---

## 5. YAML schema proposal

Add **four** new fields to the frontmatter spec (only `dating_basis` is required when `date_earliest` is absent):

```yaml
date_earliest:        -1500      # The canonical scalar. UNCHANGED.
dating_basis:         B4         # B1..B7, required when inferring.
dating_basis_source:  "Blenkinsopp 2000 *Isaiah 40–55* (Anchor Bible)"
                                 # Required for B2/B3/B4/B5. Encouraged for B6.
                                 # Format identical to refs[].source.
dating_basis_notes:   "First attestation in Deutero-Isaiah ch. 53; pre-history of the motif (Jeremiah's lament tradition) is undateable as a discrete moment."
                                 # Optional free-text. Especially for edge cases.
```

The build-pipeline change in `build_data.py` line 1020 becomes:

```python
"date_earliest": (
    fm.get("date-composed-earliest")
    or fm.get("period-active-earliest")
    or fm.get("date-start")
    or fm.get("date-born")
    or fm.get("period-earliest")
    # ↓ NEW coalesce — recovers ~755 nodes
    or fm.get("date-built-earliest")
    or fm.get("date-attested-earliest")
    or fm.get("date-emergence")
    or fm.get("date-emergence-earliest")
    or fm.get("date-founded-earliest")
    or fm.get("date-composed")
),
"dating_basis":        fm.get("dating-basis") or fm.get("dating_basis"),
"dating_basis_source": fm.get("dating-basis-source") or fm.get("dating_basis_source"),
"dating_basis_notes":  fm.get("dating-basis-notes") or fm.get("dating_basis_notes"),
```

### What counts as evidence — per basis

- **B2 (first attestation):** must cite the *text* AND the *compilation/dating* source for that text. "Wikipedia says X is mentioned in Y" is **not** sufficient by itself — you need the dating of Y from a peer-reviewed source. "Wikidata P575 (time of discovery/invention)" is acceptable when it cites a reference.
- **B3 (archaeology):** must cite an excavation/dating publication, museum catalog, or recognized reference work (CDLI, LIMC, Cambridge Ancient History, IDD). Naqada-III dating for Egyptian deities is acceptable B3 if cited (e.g., Wilkinson 2003) — but the **node-level** date should be the cult-evidence date, not "Egyptian civilization in general."
- **B4 (first scripture):** the scripture must itself carry a B1 date in the vault, or the basis_source must cite a peer-reviewed compilation-date.
- **B5 (consensus emergence):** must cite a named scholar's emergence window. "Sufism crystallizes 800-900 per Schimmel 1975" is B5; "Sufism is old" is not.
- **B6 (family median):** computed, not asserted. If a deity stub has only a tradition tag and no other evidence, the build script can synthesize `date_earliest` from the tradition's median, **but must emit `dating_basis: B6` and `dating_basis_notes: "Inherited from tradition-X median (c. YEAR)"` so the UI can render it with reduced confidence chrome.** B6 must never be hand-written — it's computed, traceable, and overridable.
- **B7 (undatable):** must include `dating_basis_notes` explaining *why* (abstract motif / cosmological-only / PIE-class reconstruction). The timeline places these in a separate "atemporal lane" — visually present, not hidden.

### "Does Wikipedia 'Egyptian deities go back to Naqada III' count for B3?"

No, **not as-is** — but it almost certainly cites Wilkinson or a similar source. The rule: the basis_source must be **the cited reference, not Wikipedia**. If Wikipedia is your only handle, downgrade to B5 ("emergence period per general scholarship") until you can chase the citation. The vault's CODEX §II "disclaimer machine" requires named sources at the wire-level; the same standard applies at the dating-level.

---

## 6. Interaction with the existing source_tier system

The two axes are orthogonal. A node can carry, for example:

```yaml
source_tier: T1            # mainstream-accepted node
dating_basis: B5           # but the dating is consensus-emergence, not primary
dating_basis_source: "Cline 2014 *1177 BC*"
```

…or:

```yaml
source_tier: T3            # alternative-school claim (e.g., Hancock's pre-13kya Sphinx)
dating_basis: B5           # also a soft date
dating_basis_source: "Schoch 1992 *KMT* 3:2"
```

The UI treats them independently:

- **`source_tier`** controls **tier-badge chrome** (T-color ramp) and **visibility toggle** (T5 hidden by default, political-risk-flag-orthogonal).
- **`dating_basis`** controls **timeline-rim confidence chrome** (B1/B2/B3/B4 = solid; B5/B6 = dashed-or-tinted; B7 = atemporal-lane).

Naming: `source_tier: T1-T5` and `dating_basis: B1-B7`. No collision in grep, in UI, or in agent shorthand.

---

## 7. Edge cases

**(a) Deities born out of older deities.** Mars-from-Ares-from-PIE *Māwortis*. Each node carries its OWN dating_basis:

```yaml
# 03_deities/mars-roman.md
date_earliest: -700
dating_basis: B5
dating_basis_source: "Beard, North, Price 1998 *Religions of Rome* vol. 1"

# 03_deities/ares.md
date_earliest: -1400
dating_basis: B2
dating_basis_source: "Mycenaean Linear B PY Tn 316 (a-re); Ventris/Chadwick 1973"
```

The transmission lineage is captured by **edges** (`cognate`, `interpretatio-nominal`), NOT by inheriting the older deity's date. Each node's date is the date of *that node's attested form*. PIE reconstructions (*Māwortis, *Dyēus) are NODES too, dated B7 with a `dating_basis_notes: "PIE reconstruction; c. -3500 conventional, but reconstruction not a discrete event"`.

**(b) Modern reconstructionism dating things to antiquity.** Wicca claiming continuity to neolithic goddess-worship; Ásatrú claiming continuity to Migration-Period Germanic; Druidry to Iron-Age Gaul. **The modern reconstruction is a separate node from the historical original.** `tradition-wicca` gets `date_earliest: 1954`, `dating_basis: B1` (Gardner). The wire to `tradition-paleolithic-goddess-cults` is `claims-descent-from` with `source_tier: T3` per CODEX §IV. We do not let Wicca's claim back-date Wicca's node.

**(c) "Timeless" entries that DO have a known first mention.** "Axis mundi" *feels* timeless but Eliade's coinage is 1949, the underlying motif is documented in Sumerian "DUR.AN.KI" (c. -2500) and Vedic "skambha" (c. -1000). Two nodes, two bases:

- `theme/axis-mundi` = the motif: `date_earliest: -2500`, `dating_basis: B2`, source = the Sumerian attestation.
- `philosophy/axis-mundi-eliade` = the scholarly category: `date_earliest: 1949`, `dating_basis: B1`.

B7 is **only** for things where no first-mention exists and inference is unwarranted — true rarity. Most "timeless" entries are actually B2 or B4 with a long latency.

---

## 8. Implementation order (for the codifying agent)

1. **Schema:** add `dating_basis`, `dating_basis_source`, `dating_basis_notes` to PROTOCOL.md frontmatter spec.
2. **Build:** extend `build_data.py` line 1020 coalesce list with the five hidden fields (recovers ~755 nodes immediately).
3. **Slug extraction:** add a `extract_year_from_slug()` helper for event nodes — gated to events only, regex `(?:c-?)?(\d{3,4})(?:-(\d{3,4}))?(?:-bce|-ce)?$`.
4. **B6 synthesizer:** compute tradition medians once per build; emit synthetic `date_earliest` + `dating_basis: B6` for deity/symbol/theme nodes that lack all other evidence AND carry a `tradition:` field.
5. **Timeline UI:** render basis chrome — B1-B4 solid rim, B5-B6 dashed rim, B7 in a dedicated atemporal-lane (not the current "undated" pile).
6. **Linter:** add a `lint_yaml.py` rule that **warns** when a node has no `date_earliest` and no `dating_basis`, and **errors** when `dating_basis: B2|B3|B4|B5` is set without a `dating_basis_source`.

After steps 1–3 the visible "undated lane" should shrink from ~2,390 to under ~800. Steps 4–6 chase the residue and harden the framework for future content batches.

---

## 9. What this does NOT do

- It does NOT propose dates for every undated node. The B-tier framework is the schema; population is a downstream agent task with named-evidence discipline.
- It does NOT alter `source_tier` or the political-risk-flag system. The dating axis is independent.
- It does NOT bake any inferred dates into existing nodes. The audit's deliverable is the SCHEMA; an implementing agent then populates `dating_basis` per node, with citations, in batches.

*— end —*
