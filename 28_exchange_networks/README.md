# 28_exchange_networks — Trade Routes & Commodities

**Lens 28 of 29.** Named trade networks, commodities-as-trade-objects, and trading institutions / peoples — the economic and material substrate that carried religious, philosophical, and cultural transmission across cultures.

**Type field in YAML:** `type: exchange-network`.

Naming chosen academically. "Exchange networks" is the disciplinary term used in archaeology, economic history, and religious studies; "trade routes" is the popular version. Per John's signal during the audit: *"we can future add more than just the routes"* — the lens cleanly hosts routes + commodities + trading-institution-types + trading peoples-as-networks.

## What lives here

### Routes / Networks / Corridors

- **Overland**: Silk Road overland, Trans-Saharan trade routes, Salt Roads of Europe, Amber Road (Baltic → Mediterranean), Tea Horse Road (China → Tibet), Inca *qhapaq ñan* (royal road), Aztec *pochteca* networks
- **Maritime**: Maritime Silk Road, Spice Routes (Indian Ocean), Incense Trade Route (South Arabian → Mediterranean), Indian Ocean trade (Swahili coast ↔ Gujarat ↔ Malacca), Manila Galleon trade, Atlantic triangular trade, Hanseatic trade network

### Commodities (as trade objects)

- **Fibers**: silk, wool, linen, cotton, hemp (cross-link from `27_attire/` for material-fiber)
- **Spices**: cinnamon, cloves, nutmeg, mace, pepper, cardamom, saffron
- **Aromatics**: frankincense, myrrh, sandalwood, agarwood / oud, copal, kyphi (cross-link to `24_pharmacology/`)
- **Beverages / stimulants**: tea, coffee, cocoa, sugar, opium, tobacco
- **Hard goods**: salt, amber, lapis lazuli, jade, ivory, gold, silver, porcelain
- **Dyes**: Tyrian purple, indigo, cochineal, woad
- **Slaves** (the moral horror IS the scholarly subject — historical phenomenon, fully sourced, documented as fabrication-and-system)
- **Books-as-trade-good** (the medieval book trade — cross-link to `02_documents/` and `11_alphabets/`)

### Trading peoples / institutions (as types)

- Phoenicians (already `07_traditions/` as ethnos; their trading-network role lives here as cross-link)
- Sogdians, Radhanites, Sea Peoples
- Hanseatic League, Venice's *Stato da Mar*, Genoese trading colonies
- Portuguese *Carreira da Índia*, Dutch VOC, English East India Company
- Manila Galleon system, Swahili merchant city-states

### Trading infrastructure (as types)

- Caravanserai-as-type (specific caravanserais are buildings → `20_sacred_architecture/` when religiously charged)
- Khan-and-fondaco system
- Factor-and-comptoir
- Port-of-trade
- *Ribāṭ* (straddles spiritual + trade infrastructure)

## What does NOT live here

- Specific cities / ports as places → `08_places/` (Alexandria, Samarkand, Lisbon stay there; their ROLE as trade hub is a cross-link)
- Substances qua substances (chemistry / pharmacology / ritual use) → `24_pharmacology/`
- Specific named ships, relics, objects → `23_material_culture/`
- Specific battles over trade routes → `05_events/`
- Pure secular banking + monetary history (out of vault scope; religiously-mediated banking gets a cross-link from `07_traditions/`)

## Primary YAML fields

### For ROUTE nodes
- `category` — overland-route / maritime-route / network / corridor
- `date-attested-earliest` — first documented activity
- `date-attested-latest` — when route is documented as no longer in use
- `region-span` — geographic extent
- `key-commodities` — `[[silk]], [[lapis-lazuli]], [[frankincense]]` (cross-link to commodity nodes)
- `key-traditions-transmitted` — `[tradition-buddhism-...]` etc.
- `key-hubs` — `[[place-alexandria]], [[place-samarkand]]` (cross-link to `08_places/`)
- `key-trading-peoples` — `[[exchange-network-sogdians]]` etc.
- `parallel-routes` — routes serving structurally analogous functions

### For COMMODITY nodes
- `category` — fiber / spice / aromatic / beverage-stimulant / hard-good / dye / dual-use
- `traded-via` — `[[silk-road-overland]], [[maritime-silk-road]]` (cross-link to route nodes)
- `production-regions` — `[[place-...]]`
- `date-trade-attested-earliest`
- `cultural-meanings` — ``theme-...`` (motif anchors like `theme-silk-as-imperial-monopoly`)
- `also-substance` — `[[substance-...]]` (cross-link to `24_pharmacology/` when applicable)

### For INSTITUTION / PEOPLE nodes
- `category` — trading-people / trading-company / merchant-confederation / port-system
- `date-active-from / date-active-to`
- `routes-operated` — `[[silk-road-overland]]` etc.
- `key-commodities-handled` — `[[silk]], [[spices]]`
- `religious-orders-affiliated` — `[[tradition-knights-templar]]` etc. (Templar banking, Christian missionary patronage)

## MASSIVE-WIN clusters to watch for

1. **Incense Trade Route as religious transmission corridor** — frankincense + myrrh moving Yemen + Oman → Petra → Gaza → Mediterranean carried Sabaean + Minaean religious motifs INTO Hebrew Bible (Magi gifts) + Egyptian + Greco-Roman ritual
2. **Silk Road as Buddhism corridor** — Greco-Buddhist art (Gandhara), kasaya colors, Buddhist sūtras into China → Korea → Japan
3. **Manila Galleon as Catholic-Asian fusion** — silver Potosí + Mexico → Manila → Chinese silk + porcelain back → Catholic Virgin imagery acquires Asian traits
4. **Amber Road into Mediterranean myth** — Baltic amber by Bronze Age; Phaethon-as-amber myth; amber-as-electrum-as-sun
5. **Spice Routes as Portuguese-imperial-theology vehicle** — *Carreira da Índia* carries Padroado missions + Inquisition apparatus alongside pepper + cloves
6. **Trans-Saharan gold-and-Islam** — gold north + salt south, religion traveling both directions
7. **Tyrian purple as priestly-imperial dye** — single Phoenician city's commodity monopoly produces a color that becomes priestly-imperial across Mediterranean for two millennia (Roman senators → Byzantine emperors → Catholic cardinals' vestments)

## See also

- `00_meta/ONTOLOGY-RATIONALE-2026-05-19.md`
- `AUDIT/lens-expansion-audit-2026-05-19.md`
