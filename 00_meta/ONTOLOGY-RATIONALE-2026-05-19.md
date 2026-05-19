# ONTOLOGY RATIONALE — Pass 3 (Lock), 2026-05-19

> **Permanent record.** This document captures the reasoning behind the 26 → 29 lens expansion of 2026-05-19. It supersedes the relevant sections of `ONTOLOGY-RATIONALE-2026-05-18.md` only with respect to the three new lenses; everything else from the 2026-05-18 lock remains in force.
>
> Same rule applies: any future change to the 29-lens spine must argue against the reasoning recorded here. If you cannot beat this rationale on academic, ontological, or pragmatic grounds, the change is rejected. If you can, write a NEW dated rationale doc — never edit this one. **Append-only after sign-off.**

---

## 0. Sign-off

**Conversation:** John ↔ opus, 2026-05-19 evening.
**Pre-existing state:** 26-lens ontology (locked 2026-05-18).
**Locked state:** 29-lens ontology (added 27, 28, 29).
**Outcome:** John reviewed `AUDIT/lens-expansion-audit-2026-05-19.md` and gave explicit greenlight: *"this is GREAT !!! exchange networks is cool because we can future add more than just the 'routes'. proceed."* Adopted recommendations from the audit verbatim for naming and numbering.

The audit doc (`AUDIT/lens-expansion-audit-2026-05-19.md`) is the long-form companion to this rationale — it carries the bars-cleared, the scope IN/OUT, the cross-reference architecture, and the MASSIVE-WIN clusters. This rationale doc is the short binding record.

---

## 1. The three new lenses — each with its case

Each new lens cleared the three bars from the 2026-05-18 rationale (existing lens fails it / real demand / bounded scope). Detailed bars-cleared analysis lives in the audit. The summary is:

### `27_attire/` — Religious & Ritual Attire

**Type field:** `attire`.
**Discipline:** religious dress / vestments studies (Religious Studies + Cultural Anthropology). Anchors: Cordwell & Schwarz *The Fabrics of Culture*, Schimmel on Sufi khirqah, Eck on darśana garment codes.
**Scope IN:** garments + ornaments + ritual-functional attire worn on the body for religious / spiritual / sumptuary reasons. Christian vestments, monastic habits, Jewish ritual garments, Muslim ihram + hijab + Sufi khirqah, Sikh Five Ks, Hindu/Buddhist/Jain robes, Daoist priest vestments, Pharaonic regalia, indigenous + African religious dress.
**Scope OUT:** sacred armor as battle-tech (→ `29_technology/`), specific named physical garments with provenance (→ `23_material_culture/`), purely political non-religious regalia.
**Why a separate lens beats tagging:** religious clothing is a primary religious-cultural language with its own MASSIVE-WIN convergence clusters (white-as-purity across non-contacting traditions; saffron-as-renunciation across Indic schools; unstitched-cloth-as-anti-luxury; initiatory clothing ceremony as cross-religious ritual structure). Tags inside `09_symbols/` or `23_material_culture/` flatten these patterns into noise; the lens preserves them as first-class structure.

### `28_exchange_networks/` — Trade Routes & Commodities

**Type field:** `exchange-network`.
**Discipline:** economic history of religion + history of commodities + world-systems analysis. Anchors: Frank *ReOrient*, Abu-Lughod *Before European Hegemony*, Mintz *Sweetness and Power*, Chaudhuri on Indian Ocean trade.
**Naming choice:** `exchange_networks` (academic) chosen over `trade_routes` (popular) because the lens hosts BOTH routes AND commodities AND trading-institution-types AND trading peoples-as-networks. "Trade routes" forces the lens to be route-shaped; "exchange networks" cleanly hosts all four sub-types. Per John's explicit signal: *"exchange networks is cool because we can future add more than just the 'routes'."*
**Scope IN:** named trade NETWORKS / ROUTES / CORRIDORS (Silk Road overland + maritime, Spice Routes, Incense Trade Route, Amber Road, Salt Roads, Trans-Saharan, Tea Horse Road, Manila Galleon, *Carreira da Índia*, etc.); COMMODITIES qua trade objects (silk, spices, incense + aromatics, tea, salt, sugar, amber, dyes, porcelain, etc.); trading peoples / institutions as types (Phoenicians, Sogdians, Radhanites, Hanseatic League, VOC, Manila Galleon system); trading infrastructure (caravanserai-as-type, port-of-trade, ribāṭ).
**Scope OUT:** specific cities/ports (→ `08_places/`, but their role-as-hub is a cross-link); substances qua substances (→ `24_pharmacology/`, with bi-directional `traded-via` cross-link); specific named objects (→ `23_material_culture/`); specific battles (→ `05_events/`); pure secular banking history (out of vault scope).
**Why a separate lens beats tagging:** the entire transmission story of religion + ideas + art moves along trade networks. Without routes-as-first-class nodes, every "Buddhism reaches China via Silk Road" claim is a string in prose with no graph structure. With routes as nodes, the bi-directional cross-link to commodities + pharmacology + traditions creates an auto-context graph John explicitly asked for ("a lot of these things get contextualized automatically").

### `29_technology/` — History of Material Technology & Invention

**Type field:** `technology`.
**Discipline:** History of Science and Technology (HSST). Anchors: Needham *Science and Civilisation in China* (multi-volume monument), Lynn White Jr. *Medieval Technology and Social Change*, Mokyr *The Gifts of Athena*, Edgerton *The Shock of the Old*. The discipline is mature, has its own journals (*Technology and Culture*, *Isis*).
**Naming choice:** `technology` chosen over John's initial "military tech" framing because military weapons are ONE of seven HSST sub-categories — restricting the lens to military would lose six others. Per John's reframe: *"maybe its not military but is just Technology - this seems important, moments these cultures find stuff, can be inventing the system, or a weapon, or powder, or a building technique, wtver."*
**Scope IN (seven sub-categories from HSST):**
1. **Material techniques / metallurgy** — bronze, iron, steel (Wootz / Damascus / crucible), glass, ceramic glaze, porcelain
2. **Architectural techniques** — true arch, Roman concrete, dome variants (pendentive / squinch / corbelled), pointed arch + flying buttress, *muqarnas*, *jali*
3. **Chemistry / preparation** — distillation, gunpowder, saponification, papermaking, ink, dye-fixing
4. **Knowledge / information** — alphabetic writing, paper, woodblock + movable type, printing press, the algorithm, zero-as-positional
5. **Navigation / instruments** — compass, astrolabe, sextant, mechanical clock, sundial, armillary sphere
6. **Hydraulic + agricultural** — qanat, terraced agriculture, chinampas, waterwheels, windmills, plow types
7. **Military technology** — composite bow, crossbow, longbow, gunpowder weapons, siege technology, fortification, naval architecture, early firearms

**Scope OUT:** pure mathematical theory (→ `16_mathematics/`); specific battles/wars (→ `05_events/`); sacred-symbolic weapons (vajra, trishula, Khanda — primary claim is symbolic → `09_symbols/`); specific named physical objects (Excalibur, Spear of Longinus → `23_material_culture/`); alchemical processes that are spiritual-soteriological (→ `12_alchemy/`); astronomical observations themselves (→ `19_astronomy/`, with cross-link from the astrolabe-as-instrument).

**Why a separate lens beats existing homes:** invention-moments have no current first-class home — distributed across events, alchemy, philosophy, mathematics or falling through cracks. A printing press is not an event (the event is "Gutenberg prints Bible 1450"), not alchemy, not pure mathematics — it's a TECHNOLOGY, a class HSST owns. Without a tech lens, every cross-cultural transmission chain (gunpowder Tang → Mongol → Europe; papermaking Han → Battle of Talas → Islamic → Europe; compass Han → Arab → European) lives only as prose, with no graph structure.

---

## 2. The cross-lens triangulation (27 + 28 + 29 + existing)

The three new lenses are deliberately designed to form a cross-reference triad with the most-touched existing lenses. The graph effect:

- **Attire (27) ↔ Exchange Networks (28)** via `material-fiber` — every vestment carries its fiber (silk / linen / wool), every fiber is a commodity in 28 → click any vestment, see its trade network.
- **Exchange Networks (28) ↔ Pharmacology (24)** via `traded-via` / `key-commodities` — every commodity that is also a substance (frankincense, soma, opium, tea) carries bi-directional links to both lenses. Click any substance, see its trade route and its trading peoples.
- **Technology (29) ↔ Exchange Networks (28)** via `transmission-path` — every technology that transmitted across distance (compass, papermaking, gunpowder, distillation) has its route as a cross-link. Click any invention, see which trade corridor carried it.
- **Technology (29) ↔ Sacred Architecture (20)** via architectural-technique fields — every domed sacred site (Hagia Sophia, St Peter's, the Dome of the Rock, Brunelleschi's Florence) cross-links to the technique that made it possible (pendentive, true arch, double-shell dome).
- **Technology (29) ↔ Events (05)** via `related-events` — Battle of Talas → papermaking transmission. Voyage of da Gama → spice-trade route activation. Battle of Mohács → Ottoman gunpowder dominance demonstrated. Trinity test → atomic age threshold.

The single graph-traversal that the three new lenses unlock together (the audit's closing example, with edges named):
> Daoist alchemists (`12`) → `inventor-of` → gunpowder (`29`). Gunpowder → `transmitted-via` → Mongol-conquest-corridor + Silk Road (`28`). Silk Road → `corridor-for` → kasaya-fiber-silk (`27`) → `garment-of-tradition` → Buddhism (`07`). Buddhism → `transmitted-along` → Silk Road (`28`) — loop closure.

---

## 3. Rejected alternatives (for the record)

**Rejected: `27_perfumery/`** as a separate lens. John's original framing.
*Reasoning:* perfumery-the-substances belongs in `24_pharmacology/` (frankincense, myrrh, sandalwood, agarwood, copal are pharmacological substances first); perfumery-the-ritual-use belongs in `14_rituals/` (incense at the altar, kyphi at the temple); perfumery-as-trade-commodity belongs in `28_exchange_networks/` (the Incense Trade Route). A separate perfumery lens would either duplicate or scatter the same content. Solution: enrich the three existing lenses with `perfumery` / `aromatic` tags + ensure cross-links between substance nodes and trade-route nodes. Same content coverage, cleaner ontology.

**Rejected: `28_military/` or `28_warfare/`** as a separate lens. John's original framing.
*Reasoning:* military technology is ONE sub-category of a larger HSST discipline. A military-only lens would scope-creep into events (battles), persons (commanders), and material culture (weapon-relics) — none cleanly resolvable. Solution: military technology is a sub-category within `29_technology/`. Specific battles stay in `05_events/`. Commanders stay in `04_persons/`. Sacred-symbolic weapons stay in `09_symbols/`. Weapon-relics (Excalibur, Spear of Longinus) stay in `23_material_culture/`.

**Rejected: `30_economy/` or `30_finance/`** as a future lens.
*Reasoning:* pure secular banking + monetary history is out of this vault's mission (religious / philosophical / scientific / mystical investigation tool). Religiously-mediated banking (Templar banking, *zakat* infrastructure, Buddhist temple economies) is captured via cross-links from `07_traditions/` + `21_theology/` + `05_events/`. If a future demand signal emerges from vault-grep showing scattered banking-religion content, the bars can be re-evaluated then.

**Rejected: standalone clothing-relic split.**
*Reasoning:* the Shroud of Turin (specific named physical object) goes to `23_material_culture/`; the type "burial shroud as religious garment-class" goes to `27_attire/`. Bi-directional cross-link captures the dual nature without lens duplication.

---

## 4. Naming refinement queued for the next "academic-naming pass"

Audit surfaced one orthogonal observation: `09_symbols/` is slightly casual — `09_symbology/` is the discipline name (semiotic study of religious + cultural sign-systems). The folder's content is already aligned with symbology-the-discipline's scope.

**Recommendation:** DEFER. Bundle this rename with the existing queued `06_themes/` → `06_motifs/` rename in one atomic "academic-naming pass" Lane B batch. Doing all the corrections in ONE batch (build_data.py + view code + YAML field sweep + pre-commit hook regex) is much cheaper than doing them serially. The pending pass:

- `06_themes/` → `06_motifs/` (queued from 2026-05-18 lock)
- `09_symbols/` → `09_symbology/` (queued from this audit)
- Any others surfaced before the pass ships

**Not rolled into this 2026-05-19 rationale.** Will require its own rationale doc when it ships (per the lock rule).

---

## 5. Procedural notes

**Build-script awareness gap (continuing):** `build_data.py`'s `NODE_TYPE_MAP` already needs updating for the 10 lenses from the 2026-05-18 lock (08, 18-26). This new pass adds three more (27, 28, 29). The unified update is queued in the existing "deferred Lane B batch" runbook (`AUDIT/deferred-laneb-batch-spec-2026-05-18.md`). Nodes added to 27/28/29 will not appear in the graph until that batch ships.

**Pre-commit hook regex widening:** the current `LANE_A` regex matches `^(0[1-9]_|1[0-7]_)`. The next hook update widens to `^(0[1-9]_|1[0-9]_|2[0-9]_)` to cover all 29 lenses. Queued in the same deferred batch.

**Forge mode dropdown:** the wheel's mode dropdown (`src/js/engine/graph/mode.js`) needs entries for the new types. Same deferred batch.

**Tag system for `perfumery` / `aromatic` / `military-technology`:** these become YAML tags within the existing structure (`tags: [perfumery, ...]` on pharmacology nodes; `tags: [military-technology, ...]` on technology nodes). Tags are a free addition — no schema change needed.

---

## 6. How to change the 29-lens spine in the future

Per the rule established 2026-05-18 and reaffirmed here:

1. **Argue against the reasoning recorded in this doc AND `ONTOLOGY-RATIONALE-2026-05-18.md`.** Both are in force. Subsequent dated docs that supersede sections are also in force.
2. **Beat all bars.** New lens must clear (a) existing lens fails it, (b) real demand signal, (c) bounded scope. New rationale must address every rejected alternative recorded here and explain why they're now wrong.
3. **Write a NEW dated rationale doc**, never edit this one or its 2026-05-18 ancestor.
4. **Audit doc first.** Like `AUDIT/lens-expansion-audit-2026-05-19.md`, the long-form companion lives in `AUDIT/`; the binding rationale lives in `00_meta/`.
5. **John signs off explicitly before any folder is created.**

— opus, Lane B agent, 2026-05-19. Signed off by John verbally in conversation; this file is the permanent record.
