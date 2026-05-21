# 27_attire — Religious & Ritual Attire

**Lens 27 of 29.** Garments + ornaments + ritual-functional attire worn on the body for religious / spiritual / sumptuary reasons.

**Type field in YAML:** `type: attire`.

## What lives here

- **Christian vestments** — chasuble, alb, stole, dalmatic, cope, surplice, biretta, mitre, papal tiara, ferraiolo, cassock, simar, zucchetto
- **Monastic habits** — Benedictine + Franciscan + Dominican + Cistercian habits, Trappist cowl, Carthusian white, Coptic black, Eastern Orthodox rason / mantya / schema
- **Jewish ritual garments** — tallit + tzitzit, kippah, tefillin (straddles material culture; primary home here when treated as type), kittel, Cohen + Levite vestments per Exodus 28
- **Muslim** — ihram, hijab, niqab, burqa, chador, abaya, kufi, taqiyah, imamah (turban), Sufi khirqah + futuwwa garments
- **Sikh Five Ks** — kesh, kara, kachera, kangha, kirpan (the kirpan-as-symbol cross-links to `09_symbols/`; the kirpan-as-physical-object cross-links to `23_material_culture/`)
- **Hindu / Jain / Buddhist** — kasaya (Buddhist robe), saffron renunciate robes, white widow's sari, dhoti, sannyāsin orange, Jain shvetambara white vs digambara nakedness, Tibetan zen + chuba
- **Daoist / Confucian** — Daoist priest gao + fa fu, Confucian scholar robes
- **Egyptian** — pharaonic linen robe + nemes headdress + uraeus + double crown (pschent), sem-priest leopard skin
- **Mesoamerican / Andean** — feathered cloaks (Quetzalcoatl iconography), Aztec priestly black, Inca royal vicuña
- **African religious dress** — Yoruba ọrìṣà initiate garments, Ifá babalawo white, kente cloth ceremonial use, Coptic Ethiopian kaba + netela

## What does NOT live here

- Sacred armor as battle-tech → `29_technology/` (military-technology sub-category)
- Specific named physical garments with provenance (Shroud of Turin) → `23_material_culture/`
- Sacred-symbolic garments where the symbol IS the primary claim — partial overlap with `09_symbols/`; attire-as-type lives here, the iconographic claim cross-links to 09

## Primary YAML fields

- `aka` — alternative names / spellings
- `category` — vestment / monastic-habit / ritual-garment / ornament / regalia / mourning-garment / initiatory-cloak / pilgrim-garment / ascetic-anti-luxury
- `tradition` — ``tradition-...``
- `key-figures-worn-by` — ``person-...`` lay or clerical figures historically wearing this attire
- `liturgical-occasion` — when the attire is required (Mass, Hajj, ordination, Yom Kippur, etc.)
- `parallel-attire` — cross-tradition resemblance (white-as-purity across ihram + alb + Daoist gao)
- `related-symbols` — ``symbol-...`` for garments carrying iconographic content
- `related-rituals` — `[[ritual-...]]` for rituals requiring this attire
- `material-fiber` — silk / linen / wool / cotton / hemp (cross-link to `28_exchange_networks/` commodity nodes)
- `region` — geographic origin
- `date-attested-earliest`
- `themes` — ``theme-...`` (motif anchors like `theme-white-garment-as-purity`)

## MASSIVE-WIN clusters to watch for

1. **White-as-purity garment** — ihram + Christian alb + Daoist gao + Sufi khirqah + Brahmin dhoti + Jain shvetambara
2. **Saffron / orange as renunciation** — Buddhist kasaya + Hindu sannyāsin + Jain saffron
3. **Head covering as gender + sacred-space marker** — hijab + niqab + Christian veil (1 Cor 11) + tallit-over-head + kippah + Sikh patka + Coptic nun's veil
4. **Unstitched cloth as anti-luxury** — ihram + Brahmin dhoti + ascetic langoti + Jain shvetambara
5. **Initiatory garment** — Sufi khirqah ceremony + Christian baptismal white + monastic clothing ceremony + ordination vestments
6. **Color symbolism convergence + divergence** — black for clergy (Catholic + Coptic + Daoist) vs black for mourning (Roman + Hellenic); saffron for renunciation Indic vs imperial Chinese

## See also

- `00_meta/ONTOLOGY-RATIONALE-2026-05-19.md` — full rationale for this lens
- `AUDIT/lens-expansion-audit-2026-05-19.md` — bars-cleared analysis + scope IN/OUT
