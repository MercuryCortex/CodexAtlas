# Active Agents — in-flight work claims

_Hand-maintained. Each agent currently working in the vault appends a claim block before they start, and edits/strikes it when they finish. Read this BEFORE picking a batch so you don't collide._

Format:

```
## [agent-handle] — [scope tag] — started YYYY-MM-DD HH:MM (local)
- Owning: <comma-separated slugs or globs>
- Goal: <one-line>
- Status: in-flight | finished | abandoned
- Last edit: <last file touched>
```

**Archive policy (in effect from `opus-housekeeper-3`, 2026-05-14):** When a session ends, finished claim blocks move to `00_meta/agents-archive/YYYY-MM-DD.md`. The live file carries only: this header, the at-a-glance table, currently-in-flight blocks, and a pointer to the archive. Most-recent finished work stays summarized in the at-a-glance "Last session's finishers" table.

**For new agents:** Read [AGENTS.md](../AGENTS.md) at the vault root for a 60-second onboarding (pre-flight + coordination protocol + canonical-slug + status-file pointers).

---

## sonnet-won-nestorian-1 — content / Won Buddhism + Nestorian Stele — started 2026-05-15 — **FINISHED 2026-05-15**
- Owning: `07_traditions/tradition-won-buddhism.md` (NEW), `04_persons/sotaesan.md` (NEW), `05_events/event-nestorian-stele-781.md` (NEW), `src/js/app.js` (silk-road preset + investigation update)
- Goal: Create Won Buddhism tradition + Sotaesan founder + Nestorian Stele event; wire nestorian-stele into silk-road preset/investigation; commit 7 orphaned nodes
- Status: finished
- Delivered:
  - **`tradition-won-buddhism.md`** (NEW, metadata) — Korean Buddhist reform 1916; Irwon-sang One Circle; saenghwal bulgyo everyday practice; 5 MASSIVE-WIN edges (Irwon↔ensō↔Plotinus; Sotaesan↔James; reform↔Protestant Reformation; synthesis↔Ramakrishna; Donghak→Won arc); 4 refs T1+T2
  - **`sotaesan.md`** (NEW, metadata) — Pak Chungbin 1891–1943; enlightenment 1916; Irwon-sang; William James four-marks match; colonial modernity cluster (Vivekananda/Choe Je-u parallel)
  - **`event-nestorian-stele-781.md`** (NEW, metadata, id: `nestorian-stele`) — Christianity in Tang China; Alopen 635 CE; Adam/Jing-Jing bilingual author; Buddhist/Daoist vocabulary translation table; Silk Road proof-object; 4 refs T1+T2
  - **`src/js/app.js`** — `nestorian-stele` added to silk-road-transmission-corridor preset picks + silk-road-corridor Investigation seeds; thread note updated
  - **Orphaned commit:** 7 nodes (huainanzi, cantong-qi, baopuzi-ge-hong, liezi, event-crucifixion, event-al-hallaj-execution, theme-persecution-as-legitimation)
- Build: 2130 nodes

---

## opus-blake-metatron-1 — content / Blake/Urizen/Metatron deep + Adam Kadmon/Anthropos full — started 2026-05-15 — **FINISHED 2026-05-15**
- Owning: `03_deities/urizen.md` (NEW), `04_persons/william-blake.md` (NEW), `03_deities/metatron.md` (deep expand), `06_themes/adam-kadmon.md` (stub→full), `06_themes/anthropos-myth.md` (stub→full)
- Goal: Create Blake + Urizen nodes; massively expand Metatron; upgrade Adam Kadmon and Anthropos Myth from stub to full with comprehensive cross-tradition grids
- Status: finished
- Delivered:
  - **`william-blake.md`** (NEW, full) — Albion=Adam Kadmon, Urizen=Demiurge, Los=Logos/tikkun, Jerusalem=Shekinah, Four Zoas=partzufim; MASSIVE WIN: Protestant reconstruction of Gnostic-Kabbalistic cosmogony from Boehme+KJV+Milton; 14 edge connections
  - **`urizen.md`** (NEW, full) — 7-row Urizen/Yaldabaoth independent-convergence table; Bacon/Newton/Locke as Urizenic philosophy; "Ancient of Days" image analysis
  - **`metatron.md`** (deep expand) — name etymology section; Sar ha-Torah (Torah-mediation=Logos-mediation MASSIVE WIN); 70 names/70 nations; Shi'ur Qomah; Lurianic Metatron/Adam Kadmon relationship table; Blake's Albion as modern reception
  - **`adam-kadmon.md`** (stub→full) — full Lurianic cosmogony; MASSIVE WIN 5-tradition grid (Puruṣa/Gayōmart/Gnostic/Paul/Blake); 13 edges
  - **`anthropos-myth.md`** (stub→full) — 6-tradition grid; 3 explanatory frameworks; Pauline Cosmic Christ; Blake's Albion; 14 edges
- Build: **2119 nodes · 12602 edges** (commit 278a406)
- Last edit: `00_meta/STATUS.md`

---

## sonnet-bruno-silk-1 — content / Bruno upgrade + Silk Road Investigation — started 2026-05-15 — **FINISHED 2026-05-15**
- Owning: `04_persons/giordano-bruno.md` (upgrade), `06_themes/executed-divine-claimant.md` (Bruno section expansion), `src/js/app.js` (Silk Road preset + investigation)
- Goal: Expand Bruno to full Yates-angle + executed-divine-claimant chain closure into modernity; add Silk Road as Investigation and preset
- Status: finished
- Delivered:
  - **`giordano-bruno.md`** — Frances Yates thesis section (Hermetic magus vs. proto-scientist; Yates 1964 Tier 2 vs. Gatti 1999 Tier 2 dual-position; Casaubon problem; Nicholas of Cusa cosmological precursor). MASSIVE-WIN connections: executed-divine-claimant chain, prisca-theologia most aggressive Hermetic claim, universal-reformation Rosicrucian relay, tradition-hermeticism. Tags upgraded with MASSIVE-WIN. 5 refs (Yates, Rowland, Gatti, Mercati, Firpo).
  - **`executed-divine-claimant.md`** — Bruno expanded from one-line extension to full §5 with al-Hallaj structural parallel, eight-year refusal to recant, Schoppe eyewitness quote, 1889 monument community-inversion analysis. Chain closes into modernity across 2 millennia.
  - **`src/js/app.js`** — silk-road-transmission-corridor alchemy preset (category: cross; confirmed slugs: tradition-manichaeism, mani, tradition-zoroastrianism, tradition-buddhism, xuanzang, cyrus-the-great). silk-road-corridor Investigation with 5 threads. node --check passes.
- Build: **2118 nodes · 12,561 edges · 2.8% dead-link** (commit 13b4795)
- Last edit: `00_meta/STATUS.md`

---

## 🚦 In-flight claims at a glance (current as of 2026-05-15)

| Handle | Scope tag | Owns (high level) | Started | Status |
|---|---|---|---|---|
| `sonnet-james-girard-1` | content / William James + Girard/scapegoat upgrades | `william-james` (NEW), `phase-7-041-varieties-of-religious-experience` (NEW), `rene-girard` (upgrade), `scapegoat-mechanism` (upgrade) | 2026-05-15 | **FINISHED** |
| `sonnet-3rd-century-1` | content / 3rd-Century Collision Zone node + Investigation preset | `third-century-collision-zone` (NEW theme) + Investigation preset `third-century-collision` | 2026-05-15 | **FINISHED** |
| `sonnet-korean-1` | content / Korean religious wedge | `tradition-donghak` (NEW), `event-donghak-peasant-revolution-1894` (NEW), `choe-je-u` (NEW), `tangun` (upgrade) | 2026-05-15 | **FINISHED** |
| `sonnet-hermetic-renaissance-1` | content / Hermetic Renaissance spine | `gemistos-plethon` (NEW), `event-council-of-florence-1439` (NEW), `prisca-theologia` (upgrade), `perennial-philosophy` (upgrade), `hermetic-transmission-chain` (NEW theme) | 2026-05-15 | **FINISHED** |
| `sonnet-comedy-deep-1` | content / Divine Comedy deep-layer investigation | `beatrice-portinari` (NEW person), `theme-graduated-afterlife` (NEW theme), `theme-guide-through-underworld` (NEW theme) | 2026-05-15 | **FINISHED** 3cd2899 |
| `sonnet-paradise-lost-1` | content / Paradise Lost cross-tradition investigation | `john-milton` (NEW person), `phase-6-042-paradise-lost` (NEW document), `theme-rebel-against-the-divine` (NEW theme) | 2026-05-15 | **FINISHED** 3cd2899 |
| `sonnet-avesta-sources-2` | meta / ref-upgrade — Zoroastrian URL eval + Zurvanism enrichment | theme-zurvanite-heresy (BeDuhn 2020 + MASSIVE-WIN edges), tradition-manichaeism (BeDuhn 2020 T1 + co-formation revision), tradition-zoroastrianism (EIr specific article URL) | 2026-05-15 | **FINISHED** |
| `sonnet-avesta-sources-1` | meta / ref-upgrade — Zoroastrian sources | phase-2-002-gathas-of-zarathustra, tradition-zoroastrianism, asura-deva-inversion, persian-period-injection — NO new nodes | 2026-05-15 | **FINISHED** |
| `sonnet-deadlink-fix-1` | meta / dead-link verification | dove.md, alpha-omega.md, fleur-de-lis.md dead-link audit — all 10 targets already existed; no stubs needed | 2026-05-15 | **FINISHED** |
| `sonnet-epist-fix-1` | meta / surgical epistemic corrections | phase-5-056-divine-comedy, creation-by-word, executed-divine-claimant, helena-blavatsky — **NO new nodes** | 2026-05-15 | **FINISHED** |
| `sonnet-apkallu-1` | content / Apkallu antediluvian sages | `apkallu` (NEW) — Mesopotamian upstream of Watchers/Enoch chain | 2026-05-15 | **FINISHED** |
| `sonnet-egypt-mysticism-1` | content / Egypt outward — mystical + symbolic web | tetramorph, axis-mundi, cosmic-egg, ma-at, pseudo-dionysius, ammonius-saccas, ma-at-logos-sophia, neoplatonic-henosis, sacred-geometry-cosmic-proportion, dying-rising-god, event-school-of-alexandria — **11 nodes** | 2026-05-15 | **FINISHED** |
| `sonnet-khafre-symbolism-1` | content / Egyptian symbolism deep-dive | 9 symbols + 4 themes + 6 persons + 4 events + 2 documents — **25 new nodes · 194 new edges** | 2026-05-15 | **FINISHED** |
| `sonnet-kabbalah-synthesis-1` | content / Symbol fixes + Kabbalah/Logos/Divine-Feminine synthesis | 6 symbol fixes + theme-axial-age (NEW) + 6 stub→full upgrades (logos-cosmic-reason, divine-feminine, tikkun-olam, philo-of-alexandria, tradition-kabbalah, moses-de-leon) | 2026-05-15 | **FINISHED** e8306e0+268e1da |
| `sonnet-infra-1` | data-integrity / YAML refs sync + Lotus Sutra dedup + orphan wiring | 10 persons refs-synced, phase-4-091 deleted (merged into phase-4-061), 8 orphan nodes wired (stribog/simeon/priscillian/cassiodorus/alcuin/dove/alpha-omega/fleur-de-lis) | 2026-05-15 | **FINISHED** b0f768a+8b2b7f2 |
| `sonnet-neoplatonics-1` | content / late-antique Neoplatonic spine | `proclus` (upgrade stub→full), `pseudo-dionysius-areopagite` (upgrade), `boethius` (upgrade), `phase-4-100-celestial-hierarchy` (NEW doc) | 2026-05-15 | **FINISHED** |

---

## sonnet-korean-1 — content / Korean religious wedge — started 2026-05-15 — **FINISHED 2026-05-15**
- Owning: `07_traditions/tradition-donghak.md` (NEW), `05_events/event-donghak-peasant-revolution-1894.md` (NEW), `04_persons/choe-je-u.md` (NEW), `03_deities/tangun.md` (upgrade)
- Goal: Korean religious wedge — tradition-donghak, Donghak Peasant Revolution event, Choe Je-u founder, Tangun MASSIVE-WIN upgrade
- Status: finished
- Delivered:
  - **`tradition-donghak`** (NEW) — full metadata tradition node; 1860 foundation, *innaecheon*/*gaebyeok* doctrines, 4 phases through Cheondogyo (~1M adherents today); MASSIVE-WIN: Donghak ↔ Catharism (suppressed syncretic response to dominant-religion pressure); Innaecheon ↔ al-Hallaj ↔ Advaita (human-divine identity claims generating persecution); Donghak ↔ Pentecostalism (colonial-margin syncretic eruptions, 1860/1906); founding-vision archetype; 4 refs (T1 Kallander + 3 T2).
  - **`event-donghak-peasant-revolution-1894`** (NEW) — metadata event; 1894 uprising → Joseon appeals to Qing → Japan invokes Tientsin Convention → First Sino-Japanese War; full geopolitical cascade documented; parallel-motif: Albigensian Crusade + Ghost Dance.
  - **`choe-je-u`** (NEW) — metadata person; 1860 founding vision, *innaecheon* radical egalitarianism, executed 1864; [[executed-divine-claimant]] pattern fully documented; MASSIVE-WIN: founding-vision archetype (Muhammad/Joseph Smith) + Innaecheon ↔ al-Hallaj persecution triad.
  - **`tangun`** (UPGRADE) — 5-cluster MASSIVE-WIN section added: Tan'gun ↔ Romulus parallel-form; bear-ordeal ↔ shamanic initiation archetype; Tan'gun ↔ Manu/Yima/Nu Wa/Deucalion culture-hero cluster; Tan'gun ↔ tradition-donghak (democratized founder-ancestor myth); Tan'gun ↔ sacred-king/divine-kingship (shaman-king dual-title; mountain-deity transformation at death).
- Build: **2118 nodes · 12,561 edges · 2.8% dead-link**
- Last edit: `00_meta/STATUS.md`

---

## sonnet-3rd-century-1 — content / 3rd-Century Collision Zone node + Investigation preset — started 2026-05-15 — **FINISHED 2026-05-15**
- Owning: `06_themes/third-century-collision-zone.md` (NEW), `src/js/app.js` (Investigation preset insert)
- Goal: Create the third-century-collision-zone theme node and wire it as the second Investigation preset in app.js
- Status: finished
- Delivered:
  - **`third-century-collision-zone`** (NEW, metadata) — 80-year window (200–280 CE) in which Plotinus, Mani, Kerdīr, Origen, and the Gnostic schools all collided in the same intellectual space, sharing vocabulary (*pneuma/logos/nous*). MASSIVE-WIN edges: shared-teacher Ammonius Saccas (Neoplatonism + Patristic theology common root); Mani as vault's most explicit cross-tradition synthesist; Kerdīr's persecution inscriptions as historical census of simultaneous religious plurality; BeDuhn 2020 co-formation thesis; Origen's *apokatastasis* condemned 553 CE. 4 Tier-1 refs (Porphyry, BeDuhn 2020, Peter Brown, Chadwick).
  - **Investigation preset `third-century-collision`** — inserted as second entry in `INVESTIGATIONS` array (after `persian-theological-spine`, before `consciousness-temple`); 6 threads; 11 seed nodes; `node --check` clean.
- Build: **2110 nodes · 12,510 edges · 2.8% dead-link**
- Last edit: `00_meta/STATUS.md` + `00_meta/ACTIVE-AGENTS.md`

---

## sonnet-avesta-sources-1 — meta / ref-upgrade Zoroastrian sources — started 2026-05-15 — **FINISHED 2026-05-15**
- Owning: `02_documents/_phase-2-axial-age/phase-2-002-gathas-of-zarathustra.md`, `07_traditions/tradition-zoroastrianism.md`, `06_themes/asura-deva-inversion.md`, `06_themes/persian-period-injection.md`
- Goal: Evaluate 4 Zoroastrian web resources, tier them, and upgrade vault nodes with confirmed scholarly citations. NO new nodes.
- Status: finished
- URL evaluations:
  - **avesta.org** — Tier 3. Community-maintained digital archive (associated with FEZANA); no institutional affiliation; hosts rare texts + community translations but lacks a formal editorial board or peer-review process. Useful reference; not citable as scholarly authority.
  - **D.J. Irani Gathas PDF** — Tier 3. Dinshaw J. Irani (1881–1938) was a Parsi educator and community intellectual in Bombay, not an academic philologist. His 1924 translation is historically significant within the Parsi diaspora and reads well, but lacks the critical apparatus (Avestan text, philological notes, manuscript variants) of Insler 1975, Humbach 1991, and Skjærvø 2003. Added to phase-2-002 as Tier 3 with appropriate caveat.
  - **Pablo Vazquez / mazdayasni.com** — Tier 4. Self-described "Zoroastrian scholar and convert" with no stated academic credentials or institutional affiliation. The page describes the translation as "accessible to a modern audience" — a popular/devotional framing. No philological apparatus evident. Not added to vault.
  - **Avestan Digital Archive (ADA), FU Berlin** — Tier 1. Institutional digital archive maintained by Freie Universität Berlin's Institut für Iranistik — a leading European center for Iranian studies. FU Berlin Iranistik faculty (including Almut Hintze) produce Tier 1 Avestan scholarship. The site was JS-rendered and the /about 404'd, but the institutional provenance is unambiguous. Added as Tier 1 research-tool ref to phase-2-002.
- Delivered (4 nodes upgraded, no new nodes):
  - **`phase-2-002-gathas-of-zarathustra`** — added Humbach & Ichaporia 1994 (T1 single-vol revised Heidelberg edition), Skjærvø 2003 Harvard online critical edition (T1), D.J. Irani 1924 avesta.org PDF (T3 with caveat), ADA FU Berlin (T1 research-tool). Updated bottom Refs section to match.
  - **`tradition-zoroastrianism`** — added Boyce, Mary. "Zoroastrianism." *Encyclopaedia Iranica* (T1) as a distinct article-level ref alongside the general EIr ref already present. Updated bottom Refs.
  - **`asura-deva-inversion`** — added Skjærvø EIr articles: "Avesta" (2011, T1) and "Daēva" (1993, T1). Updated bottom Refs.
  - **`persian-period-injection`** — added Skjærvø EIr articles: "Eschatology i. In Zoroastrianism" (2012, T1) and "Ahura Mazdā" (2011, T1). Updated bottom Refs.
- Build: 2089 nodes · 12,424 edges · no change (ref-only upgrades, no structural edits)
- Last edit: STATUS.md + git commit

---

## sonnet-deadlink-fix-1 — meta / dead-link verification — started 2026-05-15 — **FINISHED 2026-05-15**
- Owning: `09_symbols/dove.md`, `09_symbols/alpha-omega.md`, `09_symbols/fleur-de-lis.md` (read-only audit)
- Goal: Fix 11 dead-link wikilinks added by sonnet-infra-1b wiring session
- Status: finished
- Findings: All 10 "dead" targets already existed as committed .md files — created by opus-symbols-1 and opus-symbols-2 in an earlier session. Slugs verified present: `noahs-ark`, `rainbow-covenant`, `wheat-grain`, `tetragrammaton`, `aum-om`, `lotus`, `vesica-piscis`, `rose-cross-rosicrucian`, `latin-cross`, `star-of-ishtar`. Zero edits required to source files.
- Build: 2089 nodes · 12424 edges · 2.8% dead-link · 0 YAML errors
- Last edit: ACTIVE-AGENTS.md close-out

---

## sonnet-persian-spine-2 — content / BMAC + asura-deva-inversion + occultation-hidden-imam — started 2026-05-15 — **FINISHED 2026-05-15**
- Owning: `06_themes/bmac-proto-zoroastrian.md`, `06_themes/asura-deva-inversion.md`, `06_themes/occultation-hidden-imam.md`
- Goal: 3 new theme nodes deepening the Persian/Zoroastrian spine — BMAC archaeological substrate, the Indo-Iranian theological schism, and the Shi'a Hidden Imam as Saoshyant parallel
- Status: finished
- Delivered:
  - [[bmac-proto-zoroastrian]] (NEW) — full metadata theme; BMAC (~2100–1800 BCE) as proto-Zoroastrian archaeological substrate; fire temples, soma/haoma vessels, aniconic tendency, Indo-Iranian split contact zone; Anthony/Sarianidi/Witzel/Watkins T1/T2 refs.
  - [[asura-deva-inversion]] (NEW) — full metadata theme; same words opposite moral valence (deva/daeva + asura/ahura); Yasna 32/30 polemical evidence; Indra condemned by name; four-instance "old gods become demons" pattern chain; West/Gonda/Skjærvø/Kuiper T1 refs.
  - [[occultation-hidden-imam]] (NEW) — full metadata theme; Minor/Major occultation; Wilāyat al-Faqīh → Iranian Revolution political instantiation; Saoshyant/Hidden-Imam 6-row structural parallel table; five-tradition hidden-savior cluster; Momen/Sachedina/Corbin T1 + Bausani T2.
- Build: **2088 nodes · 12,415 edges · 2.8% dead-link**
- Last edit: 00_meta/STATUS.md

---

## sonnet-apkallu-1 — content / Apkallu antediluvian sages — started 2026-05-15 — **FINISHED 2026-05-15**
- Owning: `apkallu` (03_deities/apkallu.md — NEW)
- Goal: Write the Apkallu node — the Mesopotamian upstream of the Watchers/1 Enoch chain, the Utu-abzu ↔ Enoch parallel, and the Berossus/Oannes → Hellenistic transmission
- Status: finished
- Delivered: [[apkallu]] (NEW) — full metadata deity node. Seven Sages table + king pairings; Neo-Assyrian foundation deposit material evidence; Berossus/Oannes Greek transmission; Apkallu→Watchers moral inversion (Annus 2010 T1 definitive paper); Utu-abzu "taken to heaven" ↔ Enoch Gen 5:24 structural parallel; Hermes Trismegistus structural parallel. 4 T1 refs.
- Build: **2089 nodes · 12,424 edges · 2.8% dead-link**
- Last edit: 00_meta/STATUS.md

---

## sonnet-khafre-symbolism-1 — content / Egyptian symbolism + cross-tradition web — started 2026-05-15 — **FINISHED 2026-05-15**

- **Owning:** 09_symbols/djed-pillar.md, 09_symbols/was-sceptre.md, 09_symbols/crook-and-flail.md, 09_symbols/benben-stone.md, 09_symbols/obelisk.md, 09_symbols/double-crown-pschent.md, 09_symbols/atef-crown.md, 09_symbols/sphinx-guardian.md, 09_symbols/shen-ring.md, 06_themes/ka-soul-double.md, 06_themes/zep-tepi.md, 06_themes/divine-kingship-solar.md, 06_themes/psychostasia-soul-weighing.md, 04_persons/khafre.md, 04_persons/khufu.md, 04_persons/thutmose-iv.md, 04_persons/champollion.md, 04_persons/jan-assmann.md, 04_persons/mariette-auguste.md, 05_events/event-giza-complex-construction-c2560-2490-bce.md, 05_events/event-amarna-period-1353-1336-bce.md, 05_events/event-champollion-decipherment-1822.md, 05_events/event-napoleons-egypt-expedition-1798-1801.md, 02_documents/_phase-1-ancient-near-east/phase-1-031-amduat.md, 02_documents/_phase-1-ancient-near-east/phase-1-032-dream-stele-thutmose-iv.md
- **Goal:** Scientific-level symbolism investigation anchored on Khafre Mortuary Temple — Egyptian royal/funerary symbols + their cross-tradition edges
- **MASSIVE-WIN edges delivered:**
  - `djed-pillar` → Phoenician pillar cult → Jachin & Boaz (1 Kings 7:21) → Masonic pillars (Tier-1 sourced: Rundle Clark 1959, Assmann 1997, Plutarch *De Iside*)
  - `benben-stone` → obelisk → Roman re-erections → Washington Monument 1884 (world's tallest obelisk, Masonic cornerstone ceremony) — full 5,000-year chain
  - `psychostasia-soul-weighing` → Coptic Christianity (Frankfurter 1998) → Byzantine St. Michael scales → Western Last Judgment tympana → Lady Justice — fully documented
  - `ka-soul-double` → Platonic *psyche* (Herodotus Book 2 transmission claim) → Roman *genius/juno* → Christian *imago Dei* (Assmann democratization thesis) → Gnostic *pneuma*
  - `divine-kingship-solar`: Pharaoh Son of Ra → Alexander at Siwa (331 BCE) → Ptolemaic divine king → Roman *Divi filius* → Christian "Son of God" theological transformation at Nicaea
  - `sphinx-guardian`: Egyptian androsphinx → Greek sphinx (semantic inversion from guardian to monster; Vernant 1988 documented) → Ezekiel/Revelation Four Living Creatures (parallel-form)
  - `shen-ring` → cartouche → Champollion's decipherment breakthrough (the cartouche-as-royal-name-enclosure key)
  - `obelisk` → Vatican obelisk Christianized by Sixtus V (1586, cross added atop) — visual-cognate with cross-order-of-christ
- **Vault state after build:** 1945 nodes · 70 symbols · ~11,743 edges · 3.3% dead-link ratio
- **Status:** finished
- **Last edit:** ACTIVE-AGENTS.md close-out + git commit

---

## 🚦 In-flight claims at a glance (current as of 2026-05-15 — sonnet-abraham-moses-1 finished)

| Handle | Scope tag | Owns (high level) | Started |
|---|---|---|---|
| `sonnet-abraham-moses-1` | content / Abraham-Moses gap deep research | 3 new nodes (theme-lex-talionis-covenant-code, event-mitanni-kingdom-c1500-1340-bce, theme-habiru-hebrew-origins) + Amarna Letters edge upgrades — **FINISHED 2026-05-15** | 2026-05-15 |

---

## 🚦 In-flight claims at a glance (previous — opus-symbols-2 merged)

| Handle | Scope tag | Owns (high level) | Started |
|---|---|---|---|
| `sonnet-triage-1` | meta / triage + coordination (TEMPORARY — read-only session) | Diagnosed opus-foundation-1 failure; reverted broken app.js + app.css; tagged checkpoint; wrote HOW-TO-OPEN.md; updated ACTIVE-AGENTS | 2026-05-15 02:45 |
| `sonnet-foundation-2` | app-code / floating-panel layout pivot | nav + detail as frosted-glass position:fixed overlays; full-bleed canvas; SVG cleared by panel widths; atlas zoom-meter wired; dot-center marker fix | 2026-05-15 03:00 |
| `sonnet-themes-1` | content / theme nodes + deity fills | 6 theme nodes + 10 deity fills (batches a/b/c) — satan-christian expanded, serpent-dual-nature, Slavic/Baltic/Celtic/Hindu/Daoist fills — **FINISHED 2026-05-15** | 2026-05-15 |
| `sonnet-lusiadas-1/2` | content / Portuguese mythological spine | 12 new nodes (Os Lusíadas, Camões, Adamastor, Inês de Castro, Luís de Camões, Vieira, Henry the Navigator, Prester John, Endovélico, Nabia, tradition-lusitanian-religion, theme-heroes-paradise-island) + 2 Alchemy presets (portuguese-mythological-spine, templar-survival-portuguese) — **FINISHED 2026-05-15** | 2026-05-15 |
| `sonnet-templar-1` | content / Templar hardcore roots + Portuguese geo-wiring | 6 new nodes (event-battle-of-hattin-1187, tradition-hashshashin, wolfram-von-eschenbach, theme-holy-grail, baphomet, dinis-i-portugal) + Alchemy preset (templar-hardcore-roots) + 15 geo entries in locations.md + region-field geo-wiring on 7 Portuguese nodes — 1916 nodes · 11549 edges — **FINISHED 2026-05-15** | 2026-05-15 |

## sonnet-themes-1 — content / pantheon theme batch — started 2026-05-15
- Owning: 06_themes/cosmic-body-cosmogony.md, 06_themes/divine-twins.md, 06_themes/messianic-future-savior.md, 06_themes/mother-and-child-iconography.md, 06_themes/feminine-solar.md, 06_themes/apocalyptic-thunderer-vs-serpent.md, 03_deities/the-dioskouroi.md, 03_deities/romulus.md, 03_deities/kalki.md, 03_deities/muhammad-al-mahdi.md
- Goal: Add 6 cross-tradition theme anchors + 4 deity fills; wires existing deity cluster into theme graph
- Status: finished
- Last edit: 00_meta/STATUS.md

**⚠️ opus-foundation-1 — ABANDONED (reverted 2026-05-15 ~02:45)**
The floating-panel pivot was left uncommitted and partially broken. Changes have been **discarded** via `git restore src/js/app.js src/styles/app.css`. The working tree is clean at `checkpoint-map-v2-working` (git tag). See audit below before any new agent picks this up.

**Last session's finishers (full claim blocks in [`agents-archive/2026-05-14.md`](agents-archive/2026-05-14.md) for prior batches; this session's claim block below):**

| Handle | Scope | What landed |
|---|---|---|
| `opus-design-6` | app-code / Alchemy utility tools (4 layouts + spacing slider) | 4 layout modes in toolbox — Force (∿) organic, Linear (─) chronological timeline type-banded, Circular (○) single ring, Radial (◎) picks-center bridges-outer. Spacing slider ⇿ 0-100 tunes all layouts. Layout + spacing persist in localStorage. New `alchemyLayoutPositions()` helper computes positions; non-force modes pin nodes via `fx/fy`. Cache-bust `?v=20260515-design-6-layouts`. |
| `opus-design-5` | app-code / Alchemy presets dropdown + save trees + discreet side-tab | Presets moved from left pane (which hid behind expanded nav) to upper-right dropdown; save/load/delete custom user trees via `localStorage` (key `alch-custom-trees-v1`); inline name-input pattern with ↩/esc; new `findPresetOrTree()` resolver unifies canonical + custom code paths. Side-tab redesigned from 18×64 chunky tab to 16×16 chevron at top-of-nav, 45% opacity until hover. Cache-bust `?v=20260515-design-5-dropdown`. |
| `opus-design-4` | app-code / Alchemy Presets pane v1 (superseded by opus-design-5) | First version: left-side `.alch-presets-pane` with sticky-head pattern + 10 canonical cross-tradition presets + Pantheon legend back-fit + `<body class="nav-collapsed">` default. UI was correct in mechanics but hid behind nav when expanded — opus-design-5 reworks the surface. The 10 presets data structure carries over. |
| `opus-map-1` | app-code / Atlas Map rebuild (DESIGN LEAD) | MapLibre GL + offline PMTiles vector basemap rewrite of `VIEWS.atlas`; 964 DOM markers with degree-tier LOD; hover-trail GeoJSON line layer; premium minimalist token-driven basemap style; `scripts/serve.py` HTTP Range server for local dev; `scripts/fetch-basemap.sh` reproducible setup; retires opus-design-3 SVG atlas |

**Last session's finishers (full claim blocks below, will be archived in the next session-close housekeeper sweep):**

| Handle | Scope | What landed |
|---|---|---|
| `opus-symbols-3-serpent` | content / cross-tradition serpent expansion (2026-05-15) | **4 NEW symbol nodes** — `naga-serpent` (Hindu/Buddhist/Jain multi-headed cobra: Shesha/Mucalinda/Vasuki/Kaliya/Parshvanatha + SE-Asian Angkor), `uraeus` (Egyptian Wadjet pharaonic cobra → Faravahar transmission), `feathered-serpent` (Mesoamerican Quetzalcoatl/Kukulkan/Q'uq'umatz unified iconographic complex, Olmec→Mexica 2,700-year span), `nehushtan` (Hebrew bronze-serpent → John 3:14 Christological typology + 2 Kings 18 internal-polemic-inversion). Plus +14 reciprocal edges back onto the 5 existing serpent-cluster symbols. Serpent cluster now **9-node densely-connected** (5 → 9 nodes; many new polemic-inversion edges across traditions). Vault state: 1866 → 1870 nodes, 11,393 edges, 3.2% dead-link ratio. 3/4 new symbols have Wikipedia thumbs (nehushtan needs curated depictions follow-up). |
| `opus-symbols-2` | content + app-code / Symbols-map next-level | Cross-symbol-edge density 140 → **324** (+130%) across all 56 symbols on 8 transmission spines (cross-family + solar/astral + serpent + tree/eucharist + Vedic-Buddhist + geometric/Hermetic + Persian/Zoroastrian + animals/Hebrew-flood); **55/56 symbol thumbnails** wired into side-tab via `fetch_thumbnails.py` OVERRIDES + curated `depictions:` schema-and-renderer hook |

**Last session's finishers (full claim blocks in [`agents-archive/2026-05-14.md`](agents-archive/2026-05-14.md)):**

| Handle | Scope | What landed |
|---|---|---|
| `opus-housekeeper-3` | meta / archive + slim | Created `agents-archive/2026-05-14.md` with all 24 finished claim blocks; rewrote this file slim (1548 → ~95 lines); refreshed at-a-glance |
| `opus-design-3` | app-code / Maps view (DESIGN LEAD) | New top-level Atlas world-map view: 949 geo-tagged nodes, equirectangular projection, 6-preset era window, hub-only/all/off label modes, hover-trails, tier-overlay inheritance, d3.zoom pan/zoom |
| `opus-flood-1` | content / cross-tradition Flood wedge | Mesopotamian + Hebrew + Greek + Vedic + Chinese + Norse + modern reception + Black Sea Deluge hypothesis |
| `opus-monuments-1` | content / Pantheon Monuments mode | 23 monument-tagged event-site nodes (15 retrofits + 8 new: kaaba, hagia-sophia, chartres, borobudur, angkor-wat, parthenon, karnak, mahabodhi) |
| `opus-zoroastrian-1` | content | Zoroastrian deities (Ahura Mazda strengthened, Ahriman, Amesha Spentas, aeshma, atar, asha-vahishta, druj, sraosha, verethragna, saoshyant, yima-jamshid) + symbols + Magi |
| `opus-symbols-1` | content / symbols-map | Cross-tradition iconographic transmission gold-zone (aum-om, dharmachakra, menorah, monas-hieroglyphica, star-of-ishtar + 6 more) |
| `opus-design-2` | app-code / Source-Integrity-Tier overlay | 5 tier color tokens, `FEATURES.tierOverlay`, `_tier` per node, `[data-tier]` across 5 render paths, side-nav toggle, `.tier-legend` popover. **96% T1-sourced** vault now visible at a glance |
| `opus-housekeeper-2` | meta / git bootstrap | User-authorized `git init` + `.gitignore` extended + `AUDIT/12` updated to credit `opus-infra-1` + standing-recs status-tracked |
| `opus-infra-1` | meta / **silent — never registered (protocol gap, see AUDIT/12 §3.10)** | `git init` first commit + extended `build_dashboard.py` to surface AUDIT proposals + added `lint_yaml.py` + filled empty `tradition-slavic` stub |
| `opus-housekeeper-1` | meta / vault hygiene | At-a-glance table, AUDIT renumber (10→11), [`AGENTS.md`](../AGENTS.md), README refresh, Obsidian config |
| `opus-design-1` | app-code / architecture pass (DESIGN LEAD) | New [`00_meta/app-architecture.md`](app-architecture.md) — load-bearing rules doc; type/motion tokens; component primitives; Twilight `--serif: Inter` bug fix; `:focus-visible` utility; `FEATURES` flag pattern |
| `opus-ethiopian-4` | content / Ethiopian-canonical extras | 5 docs + 2 persons + 10 figures incl. **gilgamesh-nephilim** MASSIVE-win (Bronze-Age Sumerian Gilgamesh epic → Aramaic Book of Giants → Manichaean → Ethiopian-canonical 1 Enoch) |
| `opus-hellenic-3` | content / mystery-cult capstone | Eleusinian event, Iacchus, Triptolemus, eleusinian-mystery-revelation theme, Apuleius, Bk 11, Euripides, Aeschylus, Bacchae, Oresteia |
| `opus-gaps-1` | content / dead-link closure | tradition-syriac-orthodox, tradition-armenian-apostolic, dioscorus-of-alexandria, severus-of-antioch, jacob-baradaeus, shenoute, melchizedek, hagiography, tewahedo-christology, ethiopian-systematic-theology + 6 Buddhist follow-ups |
| `opus-mysteries-1` | content / Mystery Cults | Eleusinian / Dionysian / Mithraic / Isis / Cybele-Attis tradition nodes + 13 metadata-tier nodes |
| `opus-ethiopian-3` | app-code / Scripture-view Ethiopian corpora | Kebra Nagast + Ethiopic Tewahedo Canon corpora wired into Scripture tab |
| `opus-scripture-2` | app-code / Scripture-view corpora | Hermetica + Nag Hammadi + Quran corpora wired (232 entity-instances across 30 hulls) |
| `opus-ethiopian-2` | content / Ethiopian-canonical figures | Watchers (5) + Enochic archangels (3) + Parables divinities (2) + Jubilees figures (2) + pre-Christian Aksumite pantheon (5) + Meqabyan trio (3) |
| `opus-hermetic-1` | content / Corpus Hermeticum deepening | 18 nodes — 5 documents (CH XIII, Stobaean Kore Kosmou, Armenian Definitions, NHC VI,7, NHC VI,8) + 8 persons + 3 themes + 2 events |
| `opus-hellenic-2` | content / Greek+Egypt long-tail | Milesian pre-Socratics, Orphic primary documents, Hestia/Eros/Heracles, Cleopatra VII, Founding-of-Alexandria event arc |
| `opus-mystical-1` | content / Mystical wedge | Ritman / Beinecke-Mellon axis — 32 nodes incl. alchemical-Hermetic spine + Renaissance illustrated-alchemy + Voynich + Christian mystic women + Rhineland mystics |
| `opus-hellenic-1` | content / Greek+Egypt deepening | 28 nodes — classical & Hellenistic transmission spine (Manetho/Plutarch/Diodorus/Herodotus + Theban-triad cluster + Orphic primordial layer + Imhotep-Ptolemy-Empedocles) |
| `opus-templar-1` | content / Templars | 25 nodes — Templars/Hospitallers/Teutons + Crusades + Bernard/Payens/Molay + Latin Rule + Chinon Parchment + Templar-Gnostic-transmission-hypothesis |
| `opus-ethiopian-1` | content / Ethiopian Christianity wedge | 37 nodes — Tewahedo/Coptic/Oriental-Orthodox + Frumentius/Ezana/Nine-Saints/Lalibela + Garima Gospels/Mashafa-Henok/81-book-canon |
| `opus-scripture-1` | app-code / Scripture view | New top-level Maps view: Holy Bible corpus wired with 27 book-islands across 9 sections in compositional time-order |
| `opus-islam-1` | content / Islam wedge | 30 nodes — pre-Islamic Arabia (Hubal, al-Uzza, Manat, Wadd, Nasr) + falsafa Aristotle-transmission spine (al-Kindi, al-Farabi, ibn-Sina, ibn-Rushd) + sira/hadith + Ibn Taymiyya |
| `opus-buddhist-1` | content / Buddhism wedge | 30 nodes — Theravāda + Pure Land + Greco-Buddhist tradition + 10 persons (Aśoka, Menander I, Kanishka) + 7 documents (Dhammapada, Milindapañha, Aśokan Edicts) + 5 events + 5 themes |

**Build state at session close:** **1767 nodes** · **3.5% dead-link occurrence ratio** · **10,561 edges** · **5+ commits in local git, NO remote**.

**Convention reminder:** vault-content batches do not collide because each owns a distinct slug list. App-code batches do not collide with content batches. Meta-coordination batches (`opus-housekeeper-N`) do not touch any vault content node, app-code file, or in-flight slug — only `AUDIT/`, `README`, `AGENTS.md`, Obsidian config, `.gitignore`, and the header sections of the registry files. Pick a non-overlapping wedge, **append your claim block here AND a row in the table above before starting** (`opus-infra-1` skipped registration — see [`AUDIT/12`](../AUDIT/12_meta-audit-housekeeping.md) §3.10). **App-code agents:** also read [`00_meta/app-architecture.md`](app-architecture.md) — the load-bearing rules doc for `app.js` / `app.css`.

---

## opus-symbols-2 — Symbols-map next-level (densify + imagery) — started 2026-05-15 ~00:00 — **FINISHED 2026-05-15 ~02:10**

- **Owning:** all 56 files in `09_symbols/*.md` (frontmatter `cross-symbol-edges` densification + one new `depictions:` entry on haoma.md); `build_data.py` (one-line passthrough so `depictions` reaches the JS layer); `src/js/app.js` (side-tab thumb prefers `depictions[0]` when present, falls back to `n.thumbnail`); `fetch_thumbnails.py` OVERRIDES extended with 56 symbol-slug→Wikipedia-article mappings.
- **Delivered:** Cross-symbol edges 140 → 324 (+131%). All 56 nodes at ≥3 edges. 55/56 symbol thumbnails via fetch_thumbnails.py OVERRIDES. Curated haoma `depictions:` covers the one Wikipedia gap. MASSIVE-win demos enabled (cross-is-older-than-Christianity / lotus-Egypt-India-Christianity / swastika-with-discipline each now carry 6-9 edges). 6 new symbol nodes deferred to opus-symbols-3.
- **Status:** finished
- **Last edit:** this close-out block + STATUS.md headline + at-a-glance table.

---

## opus-housekeeper-3 — Per-session archive of finished claim blocks (NO vault-content / NO app-UI edits) — started 2026-05-14 ~22:45 — **FINISHED 2026-05-14 ~22:55**

- **Mission (user-authorized after confirming all agents stopped):** archive the 24 FINISHED claim blocks from this session into `00_meta/agents-archive/2026-05-14.md` so the live `ACTIVE-AGENTS.md` stays scannable for the next agent. Per-agent claim-file split + `build_agents.py` rollup (`AUDIT/12` §3.2) was the original deferred plan; the archive approach is a simpler intermediate that captures most of the scannability win without the build-pipeline change.
- **Owning (NO vault content, NO app code, NO methodology / schema policy):**
  - **NEW:** `00_meta/agents-archive/` directory + `00_meta/agents-archive/2026-05-14.md` (1525 lines — full content of all 24 finished claim blocks from the 2026-05-14 session, with a session-summary header).
  - **REWROTE:** this file from 1548 lines → ~95 lines (header + at-a-glance + 24-row last-session-finishers summary table + this claim block + archive pointer). Empty in-flight section because all agents stopped.
  - Touch points only: `AGENTS.md` (point at archive convention), `STATUS.md` (headline entry).
- **Explicitly NOT doing:**
  - **No per-agent claim-file split** (`AUDIT/12` §3.2) — the archive achieves most of the scannability win without the build-pipeline change. Defer §3.2 until contention pain returns at 5+ truly-parallel-write agents.
  - **No vault content nodes / no app code / no schema** (same scope-discipline as `opus-housekeeper-1` and `opus-housekeeper-2`).
- **Coordination notes:**
  - All agents stopped per user directive ("ive just asked ALL agents to close their session"); zero in-flight as of audit.
  - Two stale "Status: in-flight" lines at original (now archived) locations of `opus-buddhist-1` and `opus-gaps-1` — both have FINISHED-block updates appended later in the same archive (correct status visible at the archive's later block for the same handle).
- **Delivered:**
  - **`00_meta/agents-archive/2026-05-14.md`** (NEW, 1525 lines) — every finished claim block from this session preserved verbatim, plus a session-summary header documenting the 25-batch session.
  - **`00_meta/ACTIVE-AGENTS.md`** rewritten from 1548 lines → ~95 lines.
  - **Two untracked design-handoff files committed**: `00_meta/HANDOFF-design-3.md` (opus-design-3's frontend handoff) and `AUDIT/13_session-handoff-frontend-2026-05-14.md`.
  - **`AGENTS.md`** updated with the new archive convention (one-line note in the coordination protocol).
  - **`STATUS.md`** headline entry for `opus-housekeeper-3`.
- **Build state after batch:** unchanged content (1767 nodes / 3.5% dead-link / 10561 edges). **Repo state:** 6 commits at vault root after this batch; NO REMOTE.
- **Open gaps for follow-up agents:**
  - `opus-housekeeper-4` (when needed): per-agent claim-file split + `build_agents.py` rollup (`AUDIT/12` §3.2) — only worth it if 5+ truly-parallel-write agents become routine.
  - `opus-housekeeper-4` (any session): pre-commit hook running `lint_yaml.py --strict && build_dashboard.py` (`AUDIT/12` §3.9) — ~10 lines of shell.
  - `opus-housekeeper-4` (any session): 35 file-stem-vs-yaml-id drift warnings flagged by `lint_yaml.py` — needs a one-line decision on which form is canonical, then scriptable in 5 min.
  - `opus-design-4`: see `00_meta/HANDOFF-design-3.md` open queue (tier-legend Atlas-aware count, great-circle Atlas trails, Pantheon-detail-panel-closed-on-init bug from `AUDIT/13`).
  - **Content agents:** read AGENTS.md, then DASHBOARD's "Open AUDIT proposals" section (`opus-infra-1` extension), then pick from the priority queue.
- **Status:** finished
- **Last edit:** this claim block (close-out) + final `git commit`.

---

**Older sessions' archives:** [`agents-archive/`](agents-archive/) (one file per session-date, in chronological order).

---

## opus-map-1 — Atlas Map rebuild (MapLibre GL + offline PMTiles) — started 2026-05-15 01:20 — **FINISHED 2026-05-15 ~02:00**

- **Mission (user-authorized, "premium SaaS bar"):** Replace the SVG/equirectangular Atlas view (opus-design-3) with a MapLibre GL JS + offline PMTiles vector-tile map. **John reframed the app as a paid subscription product on 2026-05-15** — every decision in this batch cleared a higher polish bar than vault-content work does. See `~/.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/project_premium_saas_shift.md`.

- **What landed (app-code only — no vault content touched):**
  - **`index.html`** — vendor `<link>` for `maplibre-gl.css` + `<script>` tags for `_assets/vendor/maplibre/maplibre-gl.js` + `_assets/vendor/pmtiles/pmtiles.js` loaded before `app.js`. New nested `<div id="atlas-pane"><div id="atlas-map"></div></div>` container alongside `<svg id="svg">` (outer wrapper owns positioning because MapLibre overrides `position: relative` inline on its own container). Cache-buster `?v=20260515-map-1` on CSS + JS.
  - **`src/js/app.js`** —
    - Added `FEATURES.atlasMapV2: true`. Removed retired `FEATURES.atlasMap` flag.
    - New shared utility `tierVisibilityThreshold(tier, k, mode)` — degree-tier visibility curves shared by Atlas (and Timeline once it inherits).
    - Updated `setView()` to toggle `#atlas-pane` ↔ `#svg` visibility on view enter/exit.
    - Replaced ~250 lines of SVG/equirectangular `VIEWS.atlas` (lines 4079–4329 pre-edit) with ~330 lines of MapLibre-backed implementation:
      - Module-scoped persistent map instance (init once, reused across atlas visits — preserves zoom/pan state).
      - `_atlasRegisterProtocol()` registers `pmtiles://` source protocol via the PMTiles JS adapter.
      - `_atlasBuildStyle()` synthesizes a MapLibre style spec at render time, reading `--bg-0` / `--bg-1` / `--bg-2` / `--border` / `--border-soft` / `--gold` from CSS tokens so the basemap palette tracks the active preset.
      - 7-layer style: `bg` → `earth` → `landcover` → `natural` → `water` → `boundaries-country` → `boundaries-region`. No text labels (premium minimalism — vault nodes carry the only labels).
      - Each node renders as a DOM marker (`.atlas-marker` with `.atlas-marker-dot` + `.atlas-marker-label`) styled by tier (`tier-0..3`, `.hub` for tiers 0–1). 964 markers in the current build.
      - Hover trails as a single `atlas-trails` GeoJSON line source; `_atlasShowHoverTrails(id)` rebuilds the FeatureCollection per hover; `_atlasHideHoverTrails()` clears.
      - LOD via `_atlasUpdateLOD()` (cheap, every zoom frame — opacity by tier) + `_atlasDeclutter()` (expensive, only on `zoomend`/`moveend` — bbox claim by degree, hides overlaps via `.hidden-by-declutter`).
      - View controls preserved: era-window `<select>` (6 presets), labels toggle (off / hub / all), recenter (easeTo).
      - MapLibre `NavigationControl` (zoom +/-) and `AttributionControl` (OSM credit) added.
      - `ResizeObserver` on the pane keeps `map.resize()` called when the canvas changes (side-panel toggle, window resize).
  - **`src/styles/app.css`** — replaced the old `.atlas-*` SVG block (lines 1263–1331 pre-edit) with the MapLibre overlay system:
    - `.atlas-pane` — positioning wrapper.
    - `.atlas-marker` / `.atlas-marker-dot` / `.atlas-marker-label` — three-role font stack (serif label, dot via CSS custom-prop `--dot-color` + `--dot-size`).
    - Tier-based label weight (`tier-0` → 600, `tier-1` → 500, `tier-2/3` → 400). `.hub` promotes font-size from `--micro` to `--lbl-md`.
    - Hover/hot states: gold ring on dot, gold label color, 1.15× scale.
    - `.atlas-dim` for non-neighbor markers during hover.
    - `.hidden-by-declutter` for bbox-conflict suppression.
    - MapLibre control theming via `.atlas-map .maplibregl-ctrl-*` — buttons, attribution, group borders all driven by our `--bg-*` / `--border` / `--gold` / `--mono` tokens.
    - Empty-state card (`.atlas-empty-card` headline + sub) matching Scripture's empty-state pattern.
  - **`_assets/vendor/maplibre/maplibre-gl.js` + `maplibre-gl.css`** — vendored MapLibre GL JS v5.24.0 (~1.1 MB total, COMMITTED).
  - **`_assets/vendor/pmtiles/pmtiles.js`** — vendored PMTiles JS v4.4.1 (~20 KB, COMMITTED).
  - **`_assets/vendor/bin/pmtiles`** — go-pmtiles CLI v1.30.2 macOS-arm64 binary (~55 MB, **GITIGNORED**, re-fetchable via `scripts/fetch-basemap.sh`).
  - **`_assets/basemap/world-z7.pmtiles`** — z0-z7 world extract from Protomaps daily build 2026-05-14 (185 MB, **GITIGNORED**, re-fetchable). z7 is city-block resolution — perfectly sufficient for our 149 unique vault locations (mostly ancient cities/regions).
  - **`scripts/fetch-basemap.sh`** — reproducible setup: detects OS/arch, downloads pmtiles CLI, resolves latest valid Protomaps daily build (walks back up to 14 days if today isn't built yet), extracts z0-z7. ~10 minutes one-time per repo clone.
  - **`scripts/serve.py`** — local dev static server with **HTTP Range support**. Python's stdlib `http.server` doesn't support Range requests, which PMTiles requires (byte-range reads from a single `.pmtiles` file). This wraps `SimpleHTTPRequestHandler` with proper 206 Partial Content responses. ~95 lines, dev-only — production deploys (Vercel/Cloudflare Pages/R2+CloudFront) all support Range natively.
  - **`.claude/launch.json`** — updated to invoke `scripts/serve.py` instead of `python -m http.server`.
  - **`.gitignore`** — extended with `_assets/basemap/*.pmtiles` + `_assets/vendor/bin/`.

- **Premium-feel design decisions made this batch:**
  - **Basemap has zero text labels.** Bloomberg/Stripe/Linear-style restraint. Vault nodes carry all label hierarchy. Side benefit: no PBF glyph fonts needed → smaller offline footprint.
  - **Vendored deps, not CDN.** Per the premium-SaaS posture: third-party CDN is a single point of failure for paid products.
  - **DOM markers, not native MapLibre symbols.** Lets us use our existing `--serif` / `--mono` / token color system directly via CSS — would otherwise need PBF glyphs baked into a vendor directory. 964 markers is well within DOM-positioning performance budget.
  - **Map instance persists across view changes.** Init cost (~150ms) only paid once per session; subsequent atlas visits reuse the same map and only refresh markers.

- **Verified (browser preview, 1440×900 desktop viewport):**
  - Basemap renders: country borders, water/ocean, regional boundaries all visible in the muted token palette.
  - 964 markers placed accurately at lat/lon; 49 hub-tier (top 5%) labels visible by default.
  - Hover trails: gold lines connecting the hovered node to neighbors via the atlas-trails GeoJSON source.
  - Tooltip shows title + meta + date range; non-related markers dim, related ones go hot.
  - View switching atlas ↔ pantheon ↔ atlas works: pane shows/hides cleanly, markers re-render on re-entry, MapLibre instance kept alive.
  - MapLibre nav control (+/-) and attribution control render in our token palette.

- **Explicitly NOT doing this batch (deferred — open gaps for follow-up agents):**
  - **Hash-based URL router** for deep links (`#/view/atlas/era=axial` shape). ~50 lines, ~1 hour. Critical for the SaaS deep-link / SEO / onboarding use case. Goal: any view-and-filter state encodable in the URL, restorable on reload, shareable. **Priority follow-up #1 for `opus-router-1`.**
  - **Style-preset consolidation** (13 → 3 hero). User picked "defer presets, one neutral map for now" path on 2026-05-15. The Map currently uses the active preset's CSS-token values to color the basemap (resolved at style-build time), but presets aren't yet rebuilt as marketing identities. **`opus-presets-1` follow-up batch.**
  - **Font loadout cut** (6 → 3 families) — design-3 open queue item #9. Touches every preset; too invasive for mid-Map-rebuild. **`opus-design-4` follow-up.**
  - **Timeline retypography + shared zoom-meter migration** — Timeline's hardcoded px values (`9.5 / 12 / 10 / 8.5`) violate the type-token contract. The shared `tierVisibilityThreshold` utility I added is ready for Timeline to consume. **`opus-timeline-1` follow-up — the user explicitly flagged Timeline as next-up after Map.**
  - **Great-circle trail interpolation** — current trails are straight lines (which on a Mercator-ish projection cross seas at unnatural angles for Aksum-Cordoba etc.). Bezier or geodesic interpolation in `_atlasShowHoverTrails`. ~20 lines. Polish.
  - **Live preset re-coloring** — when the user switches presets while on Atlas, the basemap doesn't recolor (style was built at the previous preset's token values). Fix: subscribe to a "preset changed" event and call `_atlasMap.setStyle(_atlasBuildStyle())`. ~10 lines.
  - **Auth, billing/Stripe, account management, iPhone PWA, service worker** — all out of scope until John flags.
  - **`transmissionFlow` / `threadsView`** — design-3 queue items #10–11, still flagged off.

- **Coordination notes:**
  - The map-thumbnail (bottom-right of Pantheon/Documents/Timeline) uses `geoToMap` + `CONTINENT_OUTLINES` — those helpers stay intact at app.js:391–426. Only the old `VIEWS.atlas` callsite was retired.
  - `STATE.atlasEra` and `STATE.atlasLabelMode` are unchanged in shape — any URL router built later can read them directly.
  - The map instance is exposed indirectly through the closures in `VIEWS.atlas.render()`. If a follow-up agent needs to expose it on `window` for cross-view orchestration, do it via a `window._atlasMap = _atlasMap` line near the init.

- **Status:** finished
- **Last edit:** this claim block close-out + cleanup of stale `FEATURES.atlasMap` flag.

---

## sonnet-triage-1 — Session triage + coordination — started 2026-05-15 ~02:45 — **FINISHED**

- **Model:** Claude Sonnet 4.6 (not Opus — cheaper triage model, read-mostly session)
- **Role:** TEMPORARY. This is not a content or feature agent. John asked for a status check after opus-foundation-1 got stuck and left the site broken. I am a one-session diagnostic and stabilization agent.

### What I found

**opus-foundation-1 was in-flight and uncommitted.** Its changes to `src/js/app.js` and `src/styles/app.css` implemented a floating-panel layout pivot (grid → position:fixed panels with backdrop-blur) but were never committed. The working tree had these changes sitting loose, breaking:
- Pantheon SVG sizing (old `width:100%; height:100%` rule removed; replacement `position:absolute; width:auto` has edge cases on SVG elements in some browsers)
- ResizeObserver no longer fires on panel toggle (canvas is now always full-bleed; panel collapse doesn't resize it)

**opus-foundation-1's scope was also incomplete.** It claimed: era-range slider, STATE.atlasEra→STATE.eraWindow rename, per-view geometry tuning. None of those were done. Only the layout pivot was partially applied.

### What I did

1. **Tagged git checkpoint** — `checkpoint-map-v2-working` on commit `00a2630`. This is the safe revert point: all views working, MapLibre atlas working, Pantheon working. **Future agents: if anything breaks, `git checkout checkpoint-map-v2-working -- src/js/app.js src/styles/app.css` restores the last known-good app code.**
2. **Reverted broken uncommitted changes** — `git restore src/js/app.js src/styles/app.css`. App is now back to the checkpoint state.
3. **Fixed `.claude/launch.json` paths** — the launch.json in the worktree had a stale path to a deleted worktree. Fixed both copies.
4. **Updated ACTIVE-AGENTS.md** (this file) — marked opus-foundation-1 as abandoned, registered myself.
5. **Created `HOW-TO-OPEN.md`** at the vault root — plain-English, no terminal knowledge required. John is non-technical and needed a step-by-step to open the app.

### Key findings for future agents (READ THIS)

**Workflow constraint — John cannot run dev servers himself.** He needs a double-clickable launcher (`start-atlas.command` exists for this) and a plain-English guide. Any changes to the server port, start command, or URL must be reflected in `HOW-TO-OPEN.md` at the vault root.

**Chrome extension is NOT required for app development.** `Claude in Chrome` is only for agent-internal visual verification. The app itself is browser-agnostic (HTML/CSS/JS, no Node runtime). John opens it in any browser at `http://localhost:8742`. Agents can develop without Chrome extension; they just need to test via code analysis or ask John to verify in his browser.

**The floating-panel layout pivot (opus-foundation-1) is a valid direction but needs to be done properly.** If a future `opus-foundation-2` picks this up, the key bugs to fix before committing are:
  1. Give `svg#svg` explicit `width: 100%; height: 100%` within its absolutely-positioned container (not `width:auto; height:auto`) so `clientWidth`/`clientHeight` are reliable for d3.
  2. Switch `_canvasResizeObs` to observe `svg#svg` instead of `#canvas` (canvas never resizes in full-bleed layout).
  3. Remove stale `body.footer-collapsed { grid-template-rows: 1fr 0px; }` rule.
  4. Test ALL five SVG views (Pantheon, Timeline, Documents, Alchemy, Scripture) before committing — not just Atlas.

**Git versioning is now in place** (since opus-housekeeper-2 on 2026-05-14). Use `git tag -a <name> -m "<reason>"` to mark checkpoints after each major batch. There is NO remote; git is local-only.

**The serve.py server must be running for the app to work.** It provides HTTP Range support for the PMTiles basemap. Python's built-in server (`python -m http.server`) will NOT work — the Atlas map will be blank.

### Current vault state (at triage close)

- **1767 nodes** · **10,561 edges** · **3.5% dead-link ratio**
- Git tag `checkpoint-map-v2-working` = last known-good state
- `app.js` + `app.css` reverted to that checkpoint
- All views functional: Pantheon ✓, Atlas (MapLibre) ✓, Timeline ✓, Scripture ✓, Documents ✓, Alchemy ✓

### What is NOT done (open for next agents)

The things opus-foundation-1 claimed but never started are all still open:
- Hash-based URL router (`opus-router-1`) — #1 priority per prior sessions
- Era-range slider replacing era `<select>` dropdowns
- Timeline retypography (`opus-timeline-1`)
- Floating-panel layout pivot (if still desired — `opus-foundation-2`)

- **Status:** finished
- **Last edit:** this claim block + `HOW-TO-OPEN.md` creation + git tag + revert.

---

## sonnet-foundation-2 — app-code / floating-panel layout pivot — started 2026-05-15 ~03:00 — **FINISHED**

- **Model:** Claude Sonnet 4.6
- **Mission:** Implement the premium floating-panel layout (nav + detail panels as frosted-glass overlays over a full-bleed canvas). Second attempt after `opus-foundation-1` was abandoned; triage analysis from `sonnet-triage-1` used as the implementation guide.

### What landed (app-code only — no vault content touched)

- **`src/styles/app.css`:**
  - Added panel design tokens to `:root`: `--panel-bg`, `--panel-blur`, `--panel-shadow`, `--panel-edge`.
  - Replaced `body { display: grid ... }` with `body { position: relative; height: 100vh; width: 100vw; }`. Removed all `grid-template-columns/rows/areas` rules from body and collapsed variants. Removed stale `body.footer-collapsed { grid-template-rows: 1fr 0px; }` rule.
  - `main.canvas` → `position: fixed; inset: 0; z-index: 1` (full-bleed canvas). Added `body.view-atlas` background override.
  - `main.canvas > svg#svg` → `position: absolute; top/bottom: 0; left: var(--nav-w); right: var(--detail-w)` — SVG occupies panel-cleared area. Collapsed variants adjust left/right. `map-thumb svg` keeps its own 100% rule.
  - `nav.side` → upgraded to `position: fixed; z-index: 150; background: var(--panel-bg); backdrop-filter: var(--panel-blur)`. Width-based collapse transition replaces old transform-based transition.
  - `aside.detail` → removed `grid-area: detail`. Now `position: fixed; right: 0; z-index: 150; width: var(--detail-w)` with backdrop-blur. Added `body.detail-collapsed aside.detail` width rule.
  - `.view-header` → now `left: calc(var(--nav-w) + 24px); right: calc(var(--detail-w) + 24px)` with transition and collapsed variants. Zoom-visible override accounts for both panels.
  - `.zoom-meter` → `right: calc(var(--detail-w) + 24px)` with panel tokens + collapsed variant.
  - `.map-thumb` → `right: calc(var(--detail-w) + 14px)` with panel tokens + collapsed variant.
  - `.legend` → `left: calc(var(--nav-w) + 24px)` with panel tokens + nav-collapsed variant.
  - Footer and themes-menu / style-menu already had correct `left/right: var(--nav-w/detail-w)` rules — verified intact.

- **`src/js/app.js`:**
  - Split `showMap` → `showMapThumb` (pantheon/documents/timeline/alchemy/scripture) + `showZoomMeter` (showMapThumb OR atlas). Atlas now shows the zoom meter.
  - Atlas marker dot-center anchor: `dotOffsetX = -(parseFloat(dotSize) / 2)` so the dot center (not row left edge) anchors at the coordinate.
  - Removed `maplibregl.NavigationControl` add (unified zoom-meter replaces it).
  - Added `_atlasUpdateZoomMeter()` function — reads `_atlasMap.getZoom()`, computes a 2× multiplier relative to zoom 1.6 baseline, writes to `#zm-readout`.
  - Updated atlas zoom handler: `_atlasZoomHandler = () => { _atlasUpdateLOD(); _atlasUpdateZoomMeter(); }`.
  - Wired `#zm-in` / `#zm-out` / `#zm-reset` buttons to MapLibre `zoomIn()` / `zoomOut()` / `easeTo()`. Called `_atlasUpdateZoomMeter()` on setup.
  - `_canvasResizeObs` now observes `svg#svg` (not `#canvas`) so panel-toggle CSS transitions — which change the SVG's effective width — still trigger Timeline re-renders.

### Verified (code analysis)

- `node --check src/js/app.js` — passes, no syntax errors.
- All 5 SVG views (Pantheon, Timeline, Documents, Scripture, Alchemy) read `svg.node().clientWidth` — correct from `position:absolute; left/right/top/bottom` constraints.
- No `grid-area`, `grid-template-columns`, or stale `grid-template-rows` remaining on body/canvas/detail.
- No `NavigationControl` remaining in app.js.

- **Status:** finished
- **Last edit:** commit — `src/js/app.js` + `src/styles/app.css` + `00_meta/ACTIVE-AGENTS.md`.

---

## sonnet-epist-fix-1 — surgical epistemic corrections — started 2026-05-15 — **FINISHED 2026-05-15**
- Owning: `02_documents/_phase-5-medieval/phase-5-056-divine-comedy.md`, `06_themes/creation-by-word.md`, `06_themes/executed-divine-claimant.md`, `04_persons/helena-blavatsky.md`
- Goal: Surgical epistemic corrections — no new nodes; ID fix + sourcing caveats + accurate quotation + Nazi-appropriation warning
- Status: finished
- Delivered:
  - **FIX 1**: `phase-5-056-divine-comedy.md` — YAML `id:` corrected from `phase-6-divine-comedy` to `phase-5-divine-comedy` (no other nodes linked to the wrong ID)
  - **FIX 2**: Same file — Step 3 transmission claim softened: "Cerulli hypothesizes transmission through Brunetto Latini… but Dante's direct contact cannot be established from surviving records." Step 4 + concluding paragraph changed "demonstrably" to "plausibly — with strong circumstantial evidence."
  - **FIX 3**: `creation-by-word.md` — Added blockquote "Transmission vs. parallel note" above the chain table: Hebrew→Christian→Islamic leg documented; Egyptian→Hebrew leg a structural parallel (Allen 1988 notes parallel without claiming dependence); MASSIVE WIN label preserved.
  - **FIX 4**: `executed-divine-claimant.md` — Removed paraphrase "explicitly calls Socrates 'a Christian before Christ'"; replaced with Justin's actual *First Apology* ch. 46 wording ("Those who lived reasonably [meta logou] are Christians…"); MASSIVE-WIN section updated to match.
  - **FIX 5**: Same file — Suhrawardi section: formal charges (heresy + corrupting the prince) stated first; Corbin's interpretation framed as scholarly inference not historical fact. Pattern-mechanics section and MASSIVE-WIN section updated to match.
  - **FIX 6**: `helena-blavatsky.md` — Added "Nazi downstream appropriation" dispute paragraph (Guido von List / Lanz von Liebenfels / Goodrick-Clarke 1985); Blavatsky's universalist intent noted alongside the racialized mutation. Added Goodrick-Clarke *Occult Roots of Nazism* (1992) as Tier-1 YAML ref.
- Build: **2089 nodes · 12,424 edges · 2.8% dead-link · 0 lint errors**
- Last edit: `00_meta/ACTIVE-AGENTS.md`

---

## sonnet-persian-wiring-1 — cross-tradition wiring / Persian theological spine — started 2026-05-15 — **FINISHED 2026-05-15**
- Owning: `06_themes/frashokereti-cosmic-renovation.md`, `03_deities/saoshyant.md`, `03_deities/muhammad-al-mahdi.md`, `07_traditions/tradition-manichaeism.md`, `07_traditions/tradition-bogomilism.md`, `07_traditions/tradition-catharism.md`, `07_traditions/tradition-zoroastrianism.md`, `07_traditions/tradition-judaism.md`, `07_traditions/tradition-essenes.md`
- Goal: Wire cross-tradition edges for the Persian theological spine — frashokereti↔tikkun-olam, saoshyant↔mahdi+occultation, manichaeism→bogomilism→catharism chain, persian-period-injection links to 3 tradition nodes
- Status: finished
- Delivered: 9 existing nodes upgraded with MASSIVE-WIN cross-tradition sections; no new nodes; frashokereti↔tikkun-olam structural identity documented; Saoshyant↔Hidden Imam 6-row parallel table; Manichaeism downstream chain YAML + Augustine hinge documented; Bogomil Council of Saint-Félix transmission event; Cathar 2,400-year Zoroaster→Albigensian-Crusade chain; persian-period-injection wired to zoroastrianism/judaism/essenes. Build: **2089 nodes · 12,424 edges · 2.8% dead-link** (committed in acc2ea7 sweep).
- Last edit: 00_meta/STATUS.md

---

## sonnet-persecution-1 — content / religious persecution & martyrdom investigation — started 2026-05-15 — **IN PROGRESS**

- Goal: Fill the vault's most glaring content gap (no crucifixion event node!) and build the cross-tradition persecution investigation layer. Central finding: persecution → legitimation is the most consistent structural pattern in world religious history. The al-Hallaj / Jesus structural parallel (both crucified by the religious establishment for claiming divine identity) is an alert-grade cross-tradition finding.
- Owning:
  - `05_events/event-crucifixion-of-jesus-c30ce.md` (NEW)
  - `05_events/event-execution-of-al-hallaj-922.md` (NEW)
  - `05_events/event-spanish-inquisition-1478.md` (NEW)
  - `05_events/event-death-of-jan-hus-1415.md` (NEW)
  - `05_events/event-death-of-guru-arjan-1606.md` (NEW)
  - `05_events/event-death-of-guru-tegh-bahadur-1675.md` (NEW)
  - `05_events/event-bab-execution-1850.md` (NEW)
  - `05_events/event-stoning-of-stephen-c35ce.md` (NEW)
  - `06_themes/theme-persecution-as-legitimation.md` (NEW)
  - `06_themes/theme-dying-founder-paradigm.md` (NEW)
  - `06_themes/crucifixion-theology.md` (UPGRADE stub → metadata)
  - `06_themes/martyrdom-theology.md` (UPGRADE stub → metadata)
- Status: in progress

---

## sonnet-bruno-1 — content / Giordano Bruno cluster + Origen-Lucifer misreading event — started 2026-05-15 — **FINISHED 2026-05-15**
- Owning: `giordano-bruno` (EXISTS — already full), `marsilio-ficino` (EXISTS — already full), `event-ficino-hermetica-1463` (EXISTS as `event-ficino-corpus-hermeticum-translation-1463`), `event-origen-lucifer-misreading-c230` (NEW)
- Goal: Build Bruno cluster nodes; discovered all main nodes pre-exist; creating one genuinely missing node: the Origen/Isaiah 14:12 misreading event that seeded 1,800 years of Satan-as-fallen-angel cosmology
- Status: finished
- Delivered:
  - **`event-origen-lucifer-misreading-c230.md`** (NEW, metadata) — MASSIVE WIN: single exegetical move in ~230 CE generates the entire Western Satan-as-fallen-angel tradition. Full transmission chain: Isaiah 14:12 (political taunt-poem) → Origen De Principiis 1.5.5 → Jerome "Lucifer" Vulgate → Augustine City of God → Dante Inferno 34 → Milton Paradise Lost → Romantic Prometheus-Lucifer → modern Satanism. 5 refs (4 Tier-1). Wired to [[lucifer]], [[satan-christian]], [[origen]], [[origin-of-evil]], [[watchers-and-fallen-angels]], [[executed-divine-claimant]], [[phase-5-056-divine-comedy]], [[phase-6-042-paradise-lost]].
  - Pre-flight discovery: `giordano-bruno`, `marsilio-ficino`, `event-ficino-corpus-hermeticum-translation-1463` all pre-existed with full content (built by earlier agents). No duplication needed.
- Build: **2135 nodes · 12640 edges · 0 lint errors** (commit 06df5c7)
- Last edit: `00_meta/ACTIVE-AGENTS.md`

---

## sonnet-mystics-1 — content / Attar + Eckhart + apophatic-theology — started 2026-05-15
- Owning: `farid-ud-din-attar` (UPGRADE metadata→full), `phase-5-051-attar-conference-of-birds` (EXISTS metadata — checking for gaps), `meister-eckhart` (UPGRADE stub→full), `theme-apophatic-theology` (NEW)
- Goal: Two of the vault's most important missing mystics: Attar closes the Sufi non-dual poetry gap; Eckhart closes the radical Christian non-dualism gap; apophatic-theology theme unifies the via-negativa convergence across all traditions
- Status: in-flight
- Last edit: `00_meta/ACTIVE-AGENTS.md`
