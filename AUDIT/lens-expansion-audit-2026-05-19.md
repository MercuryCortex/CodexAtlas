# Lens expansion audit — three proposed additions

**Filed:** 2026-05-19
**Filed by:** opus (Lane B agent, but this is a Lane-A-shaped investigation — read-only audit, recommendations only, no lens folders created until John signs off)
**Audited against:** `00_meta/ONTOLOGY.md` (the 26-lens table), `00_meta/ONTOLOGY-RATIONALE-2026-05-18.md` (the bars-cleared rationale for the existing 26)

This audit evaluates three proposed new lenses against the existing 26-lens spine. Per the 2026-05-18 ontology lock, any expansion needs a NEW dated rationale doc + bars-cleared per lens + redundancy check + cross-reference architecture worked out. This is that work.

## TL;DR

| Proposal | Verdict | Recommended name | Number |
|---|---|---|---|
| Attire / Clothing | **GREEN-LIGHT** | `27_attire/` | 27 |
| Trade & Resources (was: Perfumery) | **GREEN-LIGHT — reframed** | `28_exchange_networks/` | 28 |
| Military tech (was: Armory) | **GREEN-LIGHT — reframed broader** | `29_technology/` | 29 |

Plus one orthogonal naming refinement surfaced during audit:
- `09_symbols/` → `09_symbology/` — **DEFER**. Already encodes the right scope; rename costs build-script + view + folder + YAML field sweep. Worth doing eventually but bundle with the `06_themes/` → `06_motifs/` rename in one atomic "academic-naming pass" later.

## How to read this audit

Per the lock rationale procedure, every new lens has to clear three bars:
1. **Existing lens fails it** — the entity has no clean home in the current 26.
2. **Real demand signal** — entities of this type are already mentioned across the vault and currently have nowhere to land.
3. **Bounded scope** — the lens is one coherent thing, not a grab-bag.

Each section below explicitly clears those bars + lists what's IN and what's OUT + names the academic discipline that owns the scope.

---

## Lens 27 — `27_attire/` (Religious & Ritual Attire)

### Bars cleared

**Bar 1 — existing lens fails it.** Religious clothing has nowhere coherent to land today. Specific garments are not symbols (`09_symbols/` is iconographic units like cross or ankh, not wearables), not relics (`23_material_culture/` is named physical objects with provenance, not garment-classes), not rituals (`14_rituals/` is performative acts, the kasaya itself is an object). Currently a Buddhist monk's robe gets squeezed into `tradition-active` tags with no first-class node.

**Bar 2 — real demand signal.** Vault grep across the existing corpus turns up references to: tallit + tzitzit, kasaya / cīvara, ihram, hijab + niqab + chador, kachera / kesh / kanga (Sikh Five Ks, with kara the bracelet straddling material-culture), papal tiara, ferraiolo, surplice, chasuble, mitre, vestments, sannyāsin saffron, Jain digambara nakedness, Crown of Thorns (which has a relic-instance in 23 + a clothing-class node here), kingly purple, the Magi's gold-frankincense-myrrh as gift-types but also gift-bearing-attire. Estimated 100–150 candidate nodes immediately, much more if you count regional variations.

**Bar 3 — bounded scope.** Clearly bounded: garments + ornaments + ritual-functional attire worn on the body for religious / spiritual / sumptuary reasons. Excludes sacred armor as battle-tech (that goes to 29), excludes regalia of state when purely political (still includes coronation-ritual regalia where the political IS the religious — papal tiara, imperial orb, Pharaonic crowns).

### Academic anchor

The field is **religious dress** / **vestments studies** within Religious Studies + Cultural Anthropology of clothing. Key reference works: Cordwell & Schwarz (eds.), *The Fabrics of Culture: The Anthropology of Clothing and Adornment* (1979); Geoffrey Wainwright + Karen Westerfield Tucker, *Oxford History of Christian Worship* (vestments sections); Annemarie Schimmel on Sufi khirqah + futuwwa garments; Diana Eck on darśana-related garment codes. The discipline exists and is mature.

### Scope (what's IN)

- **Christian vestments**: chasuble, alb, stole, dalmatic, cope, surplice, biretta, mitre, papal tiara, ferraiolo, cassock, simar, zucchetto
- **Monastic habits**: Benedictine + Franciscan + Dominican + Cistercian habits, Trappist cowl, Carthusian white, Coptic black, Eastern Orthodox monastic schemas (rason / mantya / schema)
- **Jewish ritual garments**: tallit + tzitzit, kippah, tefillin (straddles material-culture), kittel, prayer shawl colors, Cohen + Levite vestments per Exodus 28
- **Muslim**: ihram (the two unstitched white cloths for Hajj), hijab, niqab, burqa, chador, abaya, kufi, taqiyah, imamah (turban), Sufi khirqah (initiatory cloak) + futuwwa garments
- **Sikh Five Ks**: kesh (uncut hair, partly attire-as-covenant), kara (steel bracelet — material-culture cross-link), kachera (undergarment), kangha (comb), kirpan (small sword — cross-link to 29 sacred weapons)
- **Hindu / Jain / Buddhist**: kasaya (Buddhist robe), saffron renunciate robes, white widow's sari, dhoti, sannyāsin orange, Jain shvetambara white vs digambara nakedness, Tibetan zen + chuba
- **Daoist / Confucian**: Daoist priest *gao* + *fa fu* ritual vestments, Confucian scholar robes
- **Egyptian**: pharaonic linen robe + nemes headdress + uraeus + double crown (pschent), priestly leopard skin (sem-priest)
- **Mesoamerican / Andean**: feathered cloaks (Quetzalcoatl iconography), Aztec priestly black, Inca royal vicuña + kemkam
- **African religious dress**: Yoruba ọrìṣà initiate garments, Ifá babalawo white, kente cloth ceremonial use, Coptic Ethiopian *kaba* + *netela*

### Scope (what's OUT)

- Sacred armor / battle gear → `29_technology/` (sacred-weapon subset) or `09_symbols/` if the symbolic claim dominates the physical
- Specific named physical garments with provenance (Shroud of Turin) → `23_material_culture/` (relic)
- Hair as practice (Nazirite vow, Sikh kesh-as-covenant) — borderline; kesh is a practice that produces an attire-state. Cross-link to `22_practices/`.
- General regalia of state (non-religious crowns, secular military medals)

### Cross-reference architecture

Every attire node should carry: `tradition` + `category` + `key-figures-worn-by` + `liturgical-occasion` + `parallel-attire` (cross-tradition resemblance like "white-as-purity-garment" linking ihram + alb + Daoist gao + Sufi khirqah) + `related-symbols` (back-link to 09 where the garment carries iconographic content) + `related-rituals` (when the garment is required by a ritual) + `material-fiber` (silk, linen, wool, cotton, hemp — these become commodity links to 28).

**MASSIVE-WIN cross-tradition clusters this lens unlocks:**
1. **White-as-purity garment** — ihram + Christian alb + Daoist gao + Sufi khirqah + Brahmin's dhoti + Jain shvetambara → convergent religious-aesthetic claim across non-contacting traditions
2. **Saffron / orange as renunciation** — Buddhist kasaya + Hindu sannyāsin + Jain → shared Indic complex
3. **Head covering as gender + sacred-space marker** — hijab + niqab + Christian veil (1 Cor 11) + tallit-over-head + kippah + Sikh patka + Coptic nun's veil → comparative gender + sacrality study
4. **Unstitched cloth as anti-luxury** — ihram + Brahmin's dhoti + ascetic langoti + Jain shvetambara → "no seams, no individuality" theology
5. **Color symbolism** — black for clergy (Catholic, Coptic, Daoist) vs black for mourning (Roman, Hellenic) — same color, different valences; saffron for renunciation Indic vs imperial Chinese
6. **Initiatory garment** — Sufi khirqah ceremony + Christian baptismal white + monastic clothing ceremony + ordination vestments → the across-traditions "you are clothed into your new identity" ritual structure

### Suggested initial wave (10 nodes)

`vestment-chasuble`, `monastic-habit-benedictine`, `tallit-with-tzitzit`, `ihram-pilgrim-garment`, `sufi-khirqah`, `kasaya-buddhist-robe`, `sannyasin-saffron`, `papal-tiara`, `pharaonic-nemes-and-uraeus`, `sikh-five-ks`. Plus three motif anchors in `06_themes/` (pending → `06_motifs/`): `theme-white-garment-as-purity`, `theme-unstitched-cloth-as-anti-luxury`, `theme-initiatory-clothing-ceremony`.

---

## Lens 28 — `28_exchange_networks/` (Trade Routes & Commodities)

### Bars cleared

**Bar 1 — existing lens fails it.** Trade routes have no first-class home today. Silk Road, Spice Routes, Incense Trade, Amber Road etc. currently appear ONLY as mentions inside tradition / event / place nodes. Trading hubs (Alexandria, Samarkand, Lisbon) live in `08_places/` correctly, but the ROUTES connecting them — the actual networks of exchange — are not nodes at all. Commodities (frankincense, silk, lapis) appear scattered across `24_pharmacology/` (frankincense as substance), `23_material_culture/` (as named objects), or nowhere (silk has no home — neither substance nor relic).

**Bar 2 — real demand signal.** Without doing the full grep: every Hellenistic / late-antique node references trade routes; every Phoenician / Sogdian / Genoese / Portuguese expansion event would link to a route node if it existed; every transmission claim across distance ("Buddhism via Silk Road", "Christianity to Ethiopia via Red Sea") is implicitly invoking a route. Easy 80–120 candidate nodes (routes + major commodities + trading hubs as roles + trading peoples) in first wave; long tail of regional sub-routes.

**Bar 3 — bounded scope.** Bounded as: (a) named trade NETWORKS / ROUTES / CORRIDORS, (b) the COMMODITIES that flowed along them when treated as economic-cultural objects (not as substances-with-pharmacology — that's still 24), (c) the institutions of trade (caravanserai-as-type, trading-companies-as-institutions). This is **economic & material exchange history**, a real and mature discipline.

### Academic anchor

The field is **economic history of religion** + **history of commodities** + **world-systems analysis** (Wallerstein-adjacent but not theory-bound). Key reference works: Andre Gunder Frank, *ReOrient* (1998); Janet Abu-Lughod, *Before European Hegemony: The World System A.D. 1250-1350* (1989); Sidney Mintz, *Sweetness and Power* (sugar history); Marlow on commodity histories; Chaudhuri on Indian Ocean trade. **Most precise academic term: "exchange networks"** or "long-distance trade networks" — used in archaeology + economic history + religious studies for exactly this scope. "Trade routes" is the popular term; "exchange networks" is the disciplinary term.

I recommend `28_exchange_networks/` because it cleanly hosts routes + commodities + trading-institution-types without the term forcing the lens to be narrowly Silk-Road-shaped.

### Scope (what's IN)

- **Major routes**: Silk Road (overland), Maritime Silk Road, Spice Routes (Indian Ocean), Incense Trade Route (South Arabian → Mediterranean), Amber Road (Baltic → Mediterranean), Salt Roads (Trans-Saharan + Salt Roads of Europe), Tea Horse Road (China → Tibet), Trans-Saharan trade routes, Indian Ocean trade (Swahili coast ↔ Gujarat ↔ Malacca), Manila Galleon trade, the Atlantic triangular trade, Hanseatic trade, Inca *qhapaq ñan* (royal road), Aztec *pochteca* networks
- **Commodities (as trade objects)**: silk, spices (cinnamon, cloves, nutmeg, mace, pepper, cardamom), incense + aromatics (frankincense, myrrh, sandalwood, agarwood/oud, copal — cross-link to 24), tea, coffee, cocoa, sugar, salt, amber, lapis lazuli, jade, ivory, gold, silver, dyes (Tyrian purple, indigo, cochineal, woad), porcelain, slaves (the moral horror IS the scholarly subject), opium, tobacco, cotton, wool, linen, hemp, fur, books-as-trade-good
- **Trading peoples / institutions** (as types — specific individuals stay in 04): Phoenicians (already 07), Sogdians, Radhanites, Sea Peoples, Hanseatic League, Venice's *Stato da Mar*, Genoese trading colonies, Portuguese *Carreira da Índia*, Dutch VOC, English East India Company, Manila Galleon system, Swahili merchant city-states
- **Trading institutions / infrastructure**: caravanserai (as type, not specific buildings — those go to 20), khan-and-fondaco system, factor-and-comptoir, port-of-trade, ribāṭ as both spiritual + trade institution
- **Tariff / customs / port-religion intersections**: trade-as-vehicle for religious transmission

### Scope (what's OUT)

- Specific cities / ports as places → `08_places/` (Alexandria, Samarkand stay there; their ROLE as trade hub is a tag)
- Frankincense / soma / specific substances qua substances → `24_pharmacology/`; their role as TRADE COMMODITIES is cross-linked here
- Specific named ships, relics, objects → `23_material_culture/`
- Banking + monetary history as pure economic theory → would need a separate audit; for now, religiously-mediated banking (Templar banking, Knights of Malta finance, *zakat* infrastructure, Buddhist temple economies) cross-links to 07_traditions + 21_theology + 05_events; pure secular banking history isn't this vault's mission
- Specific battles over trade routes → `05_events/`

### Cross-reference architecture (your "spices auto-link" ask)

The cross-reference design is the value-multiplier here. Two-direction edges:

- A trade-route node (`silk-road-overland`) carries `key-commodities: [[silk]], [[lapis-lazuli]], [[jade]], [[porcelain]], [[buddhism]], [[manichaeism]], [[christianity-east-syrian]]` — and the commodity/tradition nodes back-link.
- A commodity node (`silk` as new node in 28, NOT in 24 because silk isn't pharmacology) carries `traded-via: [[silk-road-overland]], [[maritime-silk-road]], [[manila-galleon-trade]]` and `production-regions: [[china-tang]], [[byzantine-empire]], [[lyon]]` (places) and `cultural-meanings: [[theme-silk-as-imperial-monopoly]], [[theme-sericulture-secrecy]]`.
- A pharmacology node (`frankincense` in 24) ALSO carries `traded-via: [[incense-trade-route]]` — bi-directional cross-link.
- An attire node (`vestment-chasuble` in 27) carries `material-fiber: [[silk]], [[linen]], [[wool]]` — commodities show up as the material substrate of religious dress.

**The graph effect**: silk → silk-road → buddhism → kasaya → kasaya-fiber-silk → silk. A loop of mutually-reinforcing context. Click on the Chasuble node and you see the full economic + religious + material network it sits in.

### MASSIVE-WIN cross-tradition clusters

1. **Incense Trade Route as religious transmission corridor** — frankincense + myrrh moving from Yemen + Oman → Petra → Gaza → Mediterranean carried Sabaean + Minaean + South Arabian religious motifs INTO the Hebrew Bible (Magi gifts) + Egyptian + Greco-Roman ritual. Trade IS theology-transport.
2. **Silk Road as Buddhism corridor** — overland + maritime networks carried the Buddha image, the kasaya colors, the Greco-Buddhist art (Gandhara), Buddhist sūtras into China then Korea then Japan. Documented multi-wave.
3. **Manila Galleon as Catholic-Asian fusion** — silver from Potosí + Mexico → Manila → Chinese silk + porcelain back to Acapulco → Spanish missions in California. The first true planet-scale exchange. Catholic Virgin imagery acquires Asian iconographic traits (Our Lady of Guadalupe pre-dates but parallel pattern).
4. **Amber Road into Mediterranean myth** — Baltic amber reaches Greek hands by Bronze Age; Phaethon-as-amber myth; amber-as-electrum-as-sun connection.
5. **Spice Routes as Portuguese-imperial-theology vehicle** — the *Carreira da Índia* carries Padroado missions + Inquisition apparatus alongside pepper + cloves. Trade route + Crown patronage of religion are inseparable. (Wedge with John's existing Portuguese hermetic batch.)
6. **Trans-Saharan gold-and-Islam** — gold from Mali + Ghana up to North Africa carried Islam down; salt down to West Africa carried it the other way. Religion follows the trade route in both directions.
7. **Tyrian purple as priestly-imperial dye** — single Phoenician city's commodity monopoly produces a color that becomes priestly-imperial across Mediterranean for two millennia (Roman senators, Byzantine emperors, Catholic cardinals' vestments — direct chain).

### Suggested initial wave (10 nodes)

Routes (4): `silk-road-overland`, `incense-trade-route-south-arabian`, `maritime-silk-road`, `trans-saharan-gold-and-salt-trade`. Commodities (4): `silk-as-commodity`, `frankincense-as-trade-commodity` (cross-link to existing `frankincense` in 24), `lapis-lazuli-trade`, `tyrian-purple-dye`. Institutions (2): `sogdian-trading-network`, `carreira-da-india-portuguese`. Plus 2 motif anchors: `theme-trade-as-religious-transmission-vehicle`, `theme-commodity-monopoly-and-sacrality`.

---

## Lens 29 — `29_technology/` (History of Material Technology & Invention)

### Bars cleared

**Bar 1 — existing lens fails it.** Invention moments — gunpowder, paper, the arch, distillation, the compass, the printing press, iron-smelting, zero-as-positional, alphabetic writing — currently have NO single home. They're distributed across: `05_events/` (when discussed as an event), `12_alchemy/` (when the inventor was a proto-chemist), `15_philosophy/` (when the inventor was also a thinker), `16_mathematics/` (when the invention is theoretical), or they fall through the cracks. **There is no current first-class node for "the technology itself."** Composite bow + crossbow + gunpowder + cannon + printing press + arch + dome + Damascus steel + papermaking + qanat — every one of these is a primary historical phenomenon with no slot.

**Bar 2 — real demand signal.** Every transmission story implicitly invokes a technology. "Printing press lets Lutheran Reformation reach mass audience" — the technology IS the precondition. "Gunpowder reaches Europe via Mongol corridor" — the technology IS the event. Estimated 200+ candidate nodes (techniques + key inventors + foundational artifacts of technique) in first wave, easily.

**Bar 3 — bounded scope.** Bounded as: **named material techniques, processes, and the artifact-classes they produce, treated as inventions/discoveries with provenance + transmission history.** This is **history of science and technology (HSST)** as an academic discipline — a major field. Distinguishes from: 12 alchemy (alchemy is proto-chemistry-AND-soteriology; technology is the secular material side), 16 mathematics (mathematics is pure form; technology is application), 15 philosophy (theory of mind/world; technology is practice on world).

### Academic anchor

**History of Science and Technology (HSST)** is the discipline. Reference frameworks: Joseph Needham, *Science and Civilisation in China* (multi-volume monument, defines the field for cross-cultural HSST); Lynn White Jr., *Medieval Technology and Social Change*; Joel Mokyr, *The Gifts of Athena*; David Edgerton, *The Shock of the Old*. The discipline is mature, has its own journals (*Technology and Culture*, *Isis*), academic departments. We can adopt its categorical structure directly.

### Scope (what's IN)

**By category** (this is where your "military fits as subset" intuition lands cleanly — military tech is one of seven sub-categories):

1. **Material techniques / metallurgy**: bronze metallurgy, iron smelting, steel (Wootz / Damascus / crucible), gold gilding, glassblowing, ceramic glaze (celadon, lustreware), porcelain-firing
2. **Architectural techniques**: post-and-lintel, true arch (Roman), Roman concrete, dome (pendentive vs squinch vs corbelled), pointed arch + flying buttress (Gothic), squinch dome (Persian), corbel-vault (Maya), cantilever, machicolation, *muqarnas* honeycomb vault, *jali* perforated screen
3. **Chemistry / preparation**: distillation (alembic — cross-link to alchemy), gunpowder, saponification, fermentation systems, pottery firing, papermaking, ink-making, dye-fixing (mordant chemistry), tanning
4. **Knowledge / information**: alphabetic writing (cross-link to 11_alphabets), paper, woodblock printing, movable type (Bi Sheng → Gutenberg), printing press, lithography, the algorithm (al-Khwarizmi), zero-as-positional-numeral (cross-link to 16_mathematics)
5. **Navigation / instruments**: compass (Chinese → Arab → European chain), astrolabe (Greek → Islamic → European), sextant, mechanical clock, water-clock (clepsydra), sundial, quadrant, armillary sphere (cross-link to 19_astronomy)
6. **Hydraulic + agricultural**: qanat (Persian underground canal), terraced agriculture (Andean + East Asian), chinampas (Aztec floating gardens), waterwheels (Vitruvian + noria), windmills (Persian + Dutch), heavy plough, three-field rotation, irrigation systems
7. **Military technology**: composite bow, crossbow, longbow, gunpowder weapons (fire arrow → rocket → bomb → cannon), siege technology (trebuchet, ballista, mine), fortification (castrum + concentric castle + trace italienne), naval (trireme → galleon → ship-of-the-line), early firearms

### Scope (what's OUT)

- Pure mathematical theory → `16_mathematics/` (algebra-the-theory stays there; *al-Khwarizmi's* algorithmic method as a technique cross-links here)
- Specific battles / wars → `05_events/`
- Sacred weapons (vajra, trishula, Khanda, Kris, Excalibur, Spear of Longinus) → mostly `09_symbols/` (for the symbolic claim) + `23_material_culture/` (for the specific named physical objects); LIMITED entries here only when the weapon-type is genuinely an invention-moment (composite bow IS a tech invention; Kusanagi-as-imperial-regalia is NOT a tech invention even though it's a sword)
- Alchemical processes that were spiritual-soteriological (lapis philosophorum, magnum opus) → `12_alchemy/`. Distillation-as-technique → here. The same person (Geber, Maria Hebraica) cross-links to both.
- Astronomical observations themselves → `19_astronomy/`; the astrolabe AS instrument → here.

### Cross-reference architecture

Every technology node carries: `category` (one of seven above) + `originating-tradition` + `originating-region` + `originating-date` + `transmission-path` (e.g. compass: China-Han → Arab-Abbasid → European-medieval → European-Renaissance, as a string of `wikilinks` in transmission order) + `related-inventors` (cross-link to 04_persons) + `replaced-by` / `built-upon` (within-lens edges for technological succession) + `related-events` (the battles, councils, voyages enabled) + `related-doctrines` (technology that enabled or constrained theology — the printing press for the Reformation, gunpowder for the breakdown of feudal-knight ideology, the compass for Age of Discovery missions).

**The graph effect** John asked for: a technology like "gunpowder" becomes a hub linking China-Tang (origin) ↔ Mongol-conquest-routes (transmission corridor — cross-link to 28 exchange networks!) ↔ European-medieval-warfare (event-impact) ↔ end-of-feudal-knightly-class (social-impact, cross-link to traditions/events) ↔ Renaissance siege-warfare-and-fortification (Italian trace italienne — architectural technology cascade). Trade routes (28), inventions (29), and material culture (23) form a tight three-lens triad for any cross-cultural technological transmission.

### MASSIVE-WIN cross-tradition clusters

1. **Gunpowder transmission chain** — Tang Dynasty Daoist alchemists seeking immortality elixirs accidentally produce gunpowder → military fire-weapons by Song → Mongol conquests carry westward → Mamluk + Ottoman + European adoption → end of medieval cavalry warfare → consolidation of nation-state monarchies → printing-press-meets-gunpowder makes the modern world. One technology's diffusion reshaping global geopolitics over 800 years.
2. **Printing press chain** — Bi Sheng's movable type (1040 China) → Korean Jikji metal type (1377) → Gutenberg (1450 Europe) → Reformation pamphlets (1517) → Scientific Revolution literature (1600s). Same technology, three independent inventions / re-inventions, each unlocks a different cultural rupture.
3. **Compass chain** — Han Dynasty south-pointing spoon → Song Dynasty maritime compass → Arab adoption → European nautical revolution → Age of Discovery → Columbian Exchange (cross-link to 28!) → globalization.
4. **Distillation chain** — Maria Hebraica + Hellenistic Egypt alchemy → Islamic alchemy (Jabir / al-Razi) → European alchemy (perfumes, medicines, alcohol-spirits) → industrial chemistry. Sacred-spiritual origin produces secular-material technology.
5. **Arch / dome / vault chain** — Mesopotamian corbel → Roman true arch → Byzantine pendentive dome (Hagia Sophia) → Persian + Islamic squinch dome → Renaissance dome (Brunelleschi) → St Peter's. Architecture-as-technology drives sacred-architecture (cross-link to 20).
6. **Papermaking chain** — Han Dynasty (105 CE Cai Lun) → Battle of Talas (751 — Arab captives learn from Chinese prisoners — the technology transmits at a literal battle, cross-link to 05) → Islamic golden age book culture → Spain (Játiva paper mill 1100s) → European paper revolution → enables printing press → enables Reformation. The Battle of Talas is the single most consequential technological transmission event in human history; it deserves its own audit.
7. **Steel — Damascus + Wootz + Toledo + Japanese** — the four great steel-making traditions, each producing a "sword as cultural ideal" + technology + symbolic system. Cross-lens triangulation (29 tech + 09 symbols + 23 material culture).

### Suggested initial wave (10 nodes)

Across the seven categories: `metallurgy-iron-smelting`, `architectural-arch-true-roman`, `architectural-pendentive-dome`, `chemistry-distillation-alembic`, `information-paper-and-papermaking`, `information-movable-type-printing`, `navigation-compass`, `hydraulic-qanat-persian`, `military-gunpowder-fire-weapons`, `military-composite-bow`. Plus 1 event-level node for `05_events/`: `battle-of-talas-papermaking-transmission`. Plus 2 motif anchors: `theme-technology-as-religious-transmission-vehicle`, `theme-alchemy-births-secular-technology`.

---

## Cross-lens diagnostic — redundancy check

Quick pass through the existing 26 to confirm no painful overlap:

| Existing lens | Overlap with 27/28/29? | How resolved |
|---|---|---|
| `03_deities/` | None |  |
| `04_persons/` | Trading peoples (Phoenicians as ethnos vs. trading-people-type) | Phoenicians-as-tradition lives in 07; their *role as trading network* lives in 28 as a cross-link. Specific named merchants (Marco Polo, Ibn Battuta as traveler-traders) stay in 04 with `originator-of: [[silk-road-overland]]` cross-links. |
| `05_events/` | Battle of Talas, conquests opening trade routes | Battle stays in 05 as event; the TECH transmission (papermaking) it caused lives in 29; the TRADE-NETWORK shift (post-Talas Arab papermaking) cross-links to 28. Clean. |
| `08_places/` | Trading hubs | Alexandria stays in 08; its role-as-hub becomes a tag/edge on 28 routes that pass through. |
| `09_symbols/` | Sacred weapons (vajra, trishula) | Stay in 09 when the SYMBOL is the primary claim. Technology-as-invention (composite bow) goes to 29. A weapon can have BOTH (Khanda is both a symbolic + technological object — gets a node in each lens, cross-linked). |
| `12_alchemy/` | Distillation, transmutation | Spiritual / soteriological alchemy stays in 12. Material technology (distillation-the-process) goes to 29 with cross-link. |
| `15_philosophy/` | Inventor-philosophers | The philosopher's school stays in 15; their invention gets a tech node in 29. Same person, two cross-linked nodes. |
| `16_mathematics/` | Algorithms, zero | Pure form stays in 16; application as technology (al-Khwarizmi's *al-jabr* method as algorithmic technique) gets a 29 node only if the technique is treated as an invention-event. Light overlap, easy to resolve by tagging. |
| `17_medicine/` | Medical techniques (cauterization, surgery, distilled medicines) | Healing traditions + theory stay in 17. Specific techniques (Avicenna's surgery techniques, mercury-distillation-for-syphilis) cross-link to 29 when they're technology-as-invention. |
| `20_sacred_architecture/` | Architectural techniques | Specific sacred sites stay in 20 (Hagia Sophia). The architectural TECHNIQUE that built it (pendentive dome) lives in 29. Hagia Sophia's "uses pendentive dome" is a cross-link, not a duplicate. |
| `23_material_culture/` | Specific objects | Specific named objects (Shroud, Excalibur) stay in 23. The technique that produced their class (Damascus-steel-making, Byzantine relic-reliquary-craftsmanship) lives in 29. |
| `24_pharmacology/` | Substances vs commodities | Substances qua substances (chemistry, ritual use) stay in 24. The same substance qua trade good (frankincense-as-Roman-luxury-import) cross-links to 28. Same node, two roles via cross-link fields. |
| Other lenses | No meaningful overlap |  |

**Verdict: no painful overlap.** Every cross-link case has a clean rule: which lens owns the *primary* claim, which lenses cross-link.

---

## Note surfaced during audit — `09_symbols/` → `09_symbology/` rename

While auditing the sacred-weapons sub-case, I noticed `09_symbols/` is a slight misnomer. "Symbols" is the popular term; "symbology" is the academic discipline (semiotic study of religious + cultural sign-systems). The lens contains iconographic UNITS already — that's correctly symbology-the-discipline's scope. The folder name is just a tad casual.

**Recommendation**: NOT NOW. Bundle this rename with the queued `06_themes/` → `06_motifs/` rename in one atomic "academic-naming pass" Lane B batch, after John signs off on 27/28/29. Reason: every rename costs `build_data.py` updates + view code (Forge mode dropdown, Pantheon glyph map) + 200+ YAML field sweeps + pre-commit hook regex. Doing all the naming corrections in ONE batch is much cheaper than doing them serially.

The full "academic-naming pass" candidate list (for John to sign off on later):
- `06_themes/` → `06_motifs/` (already queued)
- `09_symbols/` → `09_symbology/` (this audit)
- Any others surfaced over time

---

## Procedure for shipping these lenses

Per the 2026-05-18 ontology lock, this is the protocol:

### Step 1 — John signs off

This audit is the proposal. John reads it, says yes/no/modify per lens. Without explicit green-light no folders get created.

### Step 2 — Lane A: write the rationale doc

A Lane A agent (could be me with permission, more naturally a goblin-lens-expansion-2026 batch) writes `00_meta/ONTOLOGY-RATIONALE-2026-05-19.md` — append-only, mirroring the structure of the 2026-05-18 doc. Includes:
- Bars-cleared per new lens
- Rejected alternative names + why
- Rejected alternative scopes + why
- Cross-reference architecture spec
- This audit cited as the source

### Step 3 — Lane A: create folders + READMEs

`27_attire/README.md`, `28_exchange_networks/README.md`, `29_technology/README.md` — each one a one-pager mirroring the existing 26 READMEs.

### Step 4 — Lane A: stage initial-wave nodes

10 nodes per lens (30 total) + 5–8 motif anchors. This is real investigation work — would naturally split into three parallel sub-agents (Attire, Exchange, Technology).

### Step 5 — Lane A: update ONTOLOGY.md + LANES.md

Add rows 27 / 28 / 29 to the lens table in ONTOLOGY.md. Update LANES.md path-map regex from `[01-26]_` to `[01-29]_`.

### Step 6 — Lane B (deferred): build script + view + hook

This rides on the existing `00_meta/STATUS.md` "deferred Lane B batch" runbook entry. Add 27/28/29 to:
- `build_data.py` `NODE_TYPE_MAP`
- Forge mode dropdown (`src/js/engine/graph/mode.js`)
- pre-commit hook regex (`scripts/git-hooks/pre-commit`)
- Doc cleanup (remove "⚠️ pending" markers as resolved)

Once Step 6 ships, the new lens nodes appear in the graph.

### Step 7 — Memory pointer

Add a memory entry pointing to the new rationale doc so future agents discover the 29-lens spine on cast.

---

## Recommendation summary for John

**GREEN-LIGHT all three with the names and numbering above.** The audit clears the bars for each, the cross-reference architecture is worked out, the redundancy is mapped, and the procedure is well-defined.

**My favorite cluster across the three new lenses:**

> Tang Daoist alchemists (12) seeking immortality elixirs discover gunpowder (29). Mongol cavalry carries it along the Silk Road (28). Damascus steel-makers (29) couldn't stop the cannon. The Catholic Church (07) loses the medieval-knight class (29 + 05). Gutenberg (29) prints the Bible. Luther (04) hammers theses (05). Spanish *conquistadores* in obsidian armor (27 + 23) defeat Aztec quetzal-feather-cloaked warriors (27) with gunpowder (29). Manila Galleon (28) carries silver to Manila + silk back to Acapulco. Brunelleschi (29 + 04) builds the Florence dome (20). Pendentive technology runs from Hagia Sophia (20) to St. Peter's (20) on the same chain.

That's the kind of dense cross-lens transmission the three new lenses unlock. They're worth doing.

— opus, Lane B agent, 2026-05-19.
