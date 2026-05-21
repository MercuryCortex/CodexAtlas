# 29_technology — History of Material Technology & Invention

**Lens 29 of 29.** Named material techniques, processes, and the artifact-classes they produce, treated as inventions / discoveries with provenance + transmission history.

**Type field in YAML:** `type: technology`.

Anchors against **History of Science and Technology (HSST)** as an academic discipline. Reference frameworks: Joseph Needham's *Science and Civilisation in China* (multi-volume monument; canonical for cross-cultural HSST), Lynn White Jr. *Medieval Technology and Social Change*, Joel Mokyr *The Gifts of Athena*, David Edgerton *The Shock of the Old*.

## What lives here — seven HSST sub-categories

### 1. Material techniques / metallurgy
Bronze metallurgy, iron smelting, steel (Wootz / Damascus / crucible / Toledo / Japanese folded), gold gilding, glassblowing, ceramic glaze (celadon, lustreware), porcelain-firing.

### 2. Architectural techniques
Post-and-lintel, true arch (Roman), Roman concrete, dome variants (pendentive, squinch, corbelled), pointed arch + flying buttress (Gothic), squinch dome (Persian), corbel-vault (Maya), cantilever, machicolation, *muqarnas* honeycomb vault, *jali* perforated screen, double-shell dome (Brunelleschi).

### 3. Chemistry / preparation
Distillation (alembic — cross-link to `12_alchemy/`), gunpowder, saponification, fermentation systems, pottery firing, papermaking, ink-making, dye-fixing (mordant chemistry), tanning.

### 4. Knowledge / information
Alphabetic writing (cross-link to `11_alphabets/`), paper, woodblock printing, movable type (Bi Sheng → Korean Jikji → Gutenberg), printing press, lithography, the algorithm (al-Khwarizmi), zero-as-positional-numeral (cross-link to `16_mathematics/`).

### 5. Navigation / instruments
Compass (Chinese → Arab → European chain), astrolabe (Greek → Islamic → European), sextant, mechanical clock, water-clock (clepsydra), sundial, quadrant, armillary sphere (cross-link to `19_astronomy/`).

### 6. Hydraulic + agricultural
Qanat (Persian underground canal), terraced agriculture (Andean + East Asian), chinampas (Aztec floating gardens), waterwheels (Vitruvian + noria), windmills (Persian + Dutch), heavy plough, three-field rotation, irrigation systems.

### 7. Military technology
Composite bow, crossbow, longbow, gunpowder weapons (fire arrow → rocket → bomb → cannon), siege technology (trebuchet, ballista, mine), fortification (castrum + concentric castle + trace italienne), naval architecture (trireme → galleon → ship-of-the-line), early firearms.

## What does NOT live here

- Pure mathematical theory → `16_mathematics/` (algebra-the-theory stays there; *al-Khwarizmi's* algorithmic method as a technique cross-links here)
- Specific battles / wars → `05_events/`
- Sacred-symbolic weapons (vajra, trishula, Khanda, Kris, Excalibur, Spear of Longinus) — primary claim is symbolic, so → `09_symbols/`; specific named physical objects → `23_material_culture/`. LIMITED entries here only when the weapon-type is genuinely an invention-moment (composite bow IS a tech invention; Kusanagi-as-imperial-regalia is NOT a tech invention)
- Alchemical processes that were spiritual-soteriological (lapis philosophorum, magnum opus) → `12_alchemy/`. Distillation-as-technique → here. Same person (Geber, Maria Hebraica) cross-links to both
- Astronomical observations themselves → `19_astronomy/`; the astrolabe AS instrument → here

## Primary YAML fields

- `category` — metallurgy / architectural-technique / chemistry / information / navigation / hydraulic-agricultural / military-technology
- `originating-tradition` — ``tradition-...``
- `originating-region` — geographic
- `originating-date` — earliest documented attestation
- `transmission-path` — ordered string of ``wikilinks`` showing the diffusion chain (e.g. compass: `[[china-han]], [[abbasid-caliphate]], [[europe-medieval]], [[europe-renaissance]]`)
- `related-inventors` — ``person-...`` cross-link to `04_persons/`
- `replaced-by` / `built-upon` — within-lens edges for technological succession
- `related-events` — ``event-...`` for events the technology enabled (Reformation enabled by printing press, Age of Discovery enabled by compass)
- `related-doctrines` — `[[doctrine-...]]` for doctrines/movements the technology enabled or constrained (printing press → Sola Scriptura → Reformation; gunpowder → end of feudal knighthood)
- `related-exchange-networks` — `[[exchange-network-...]]` for the routes that carried the technology (cross-link to `28_exchange_networks/`)
- `related-sacred-sites` — `[[sacred-site-...]]` for sites that exemplify the technique (pendentive-dome ↔ Hagia Sophia)

## MASSIVE-WIN clusters to watch for

1. **Gunpowder transmission chain** — Tang Daoist alchemists seeking immortality elixirs → Song military fire-weapons → Mongol corridors → Mamluk + Ottoman + European adoption → end of medieval cavalry warfare → consolidation of nation-state monarchies → printing-press-meets-gunpowder makes the modern world
2. **Printing press chain** — Bi Sheng's movable type (1040 China) → Korean Jikji metal type (1377) → Gutenberg (1450 Europe) → Reformation pamphlets (1517) → Scientific Revolution literature (1600s)
3. **Compass chain** — Han Dynasty south-pointing spoon → Song maritime compass → Arab adoption → European nautical revolution → Age of Discovery → Columbian Exchange
4. **Distillation chain** — Maria Hebraica + Hellenistic Egypt alchemy → Islamic alchemy (Jabir / al-Razi) → European alchemy → industrial chemistry. Sacred-spiritual origin → secular-material technology
5. **Arch / dome / vault chain** — Mesopotamian corbel → Roman true arch → Byzantine pendentive (Hagia Sophia) → Persian + Islamic squinch → Renaissance dome (Brunelleschi) → St Peter's
6. **Papermaking chain** — Han Dynasty (105 CE Cai Lun) → Battle of Talas (751, Arab captives learn from Chinese prisoners — the single most consequential technological transmission event in human history) → Islamic golden age book culture → Spain (Játiva paper mill 1100s) → European paper revolution → enables printing press → enables Reformation
7. **Steel — Damascus + Wootz + Toledo + Japanese** — four great steel-making traditions, each producing a "sword as cultural ideal" + technology + symbolic system

## See also

- `00_meta/ONTOLOGY-RATIONALE-2026-05-19.md`
- `AUDIT/lens-expansion-audit-2026-05-19.md`
