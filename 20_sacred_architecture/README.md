# 20 — Sacred Architecture & Sites

**Lens slot 20** of the 26-lens ontology. New 2026-05-18. Holds nodes of type `sacred-site`.

## What lives here

Religiously-charged sites and structures — both **built** (architecture) and **natural** (sacred geography).

**Built:**
- Pyramids of Giza, Hagia Sophia, Borobudur, Karnak Temple, Angkor Wat, Chichen Itza, Sagrada Família, Göbekli Tepe, Stonehenge, Solomon's Temple, the Kaaba, the Dome of the Rock, St. Peter's Basilica, Notre-Dame de Chartres, the Great Mosque of Mecca, the Great Mosque of Cordoba, Pantheon (Rome), Parthenon (Athens), Stupa of Sanchi, Pashupatinath Temple, Meenakshi Temple, Western Wall, Buland Darwaza, Imam Mosque (Isfahan).

**Natural-but-sacred:**
- Mount Kailash, Uluru / Ayers Rock, Mount Sinai (as sacred site, vs. as place), Mount Olympus, Mount Meru, the Ganges (as sacred river), Lake Titicaca, Mount Fuji, the Black Hills, Sedona, Glastonbury Tor, Lourdes (spring + grotto), Cenotes of Yucatán (Maya), Kaaba environs.

## Why one combined lens (architecture + natural sites)

The conceptual category is "places of religious significance with a built or natural form that carries the religious charge." Mircea Eliade's *axis mundi* framework, Lindsay Jones's *The Hermeneutics of Sacred Architecture* — the discipline of architectural / spatial religion-studies treats both together. Splitting risks losing the cross-connections (Mount Sinai is both the sacred mountain AND the locus of the monastery of St. Catherine; Borobudur is both built structure AND embodiment of Mt. Meru).

## What does NOT live here

- **Place as geographic / cultural / political unit** (Alexandria-as-city, Mecca-as-city) → `08_places/`. Note: Mecca-as-city is in `08_places/`; the Kaaba (specific structure within Mecca) is here. Cross-linked.
- **Symbols / iconographic units** (the cross AS sign, the ankh AS sign, the stupa-form AS visual concept) → `09_symbols/`. Specific stupas (Sanchi, Borobudur) are here.
- **Relics or movable sacred objects** → `23_material_culture/`. The Tabot is a relic; the church housing it is a sacred site.

## YAML skeleton (provisional)

```yaml
id: pyramid-of-khufu
title: Great Pyramid of Khufu (Giza)
type: sacred-site
category: built-monument   # built-monument | natural-sacred-site | sacred-mountain | sacred-river | sacred-grove | temple | mosque | church | stupa | shrine | tomb-complex | ritual-landscape
location-place: giza-egypt
date-built-earliest: -2580
date-built-latest: -2560
tradition: egyptian-religion
function: pharaonic-tomb-and-resurrection-machine
key-figures: [khufu]
themes: [pyramid-as-resurrection-machine, sacred-geometry-of-giza]
cross-tradition-edges:
  - target: ziggurat-form
    type: parallel-form
    note: "Stepped-monumental sacred-architecture parallel; independent emergence"
refs:
  - title: "..."
    tier: 1
status: metadata
```

## Slug convention

Built: `pyramid-of-khufu`, `hagia-sophia`, `borobudur-stupa`, `karnak-temple`, `gobekli-tepe`, `solomons-temple-first`, `solomons-temple-second`.

Natural: `mount-kailash`, `mount-sinai-sacred-site` (to disambiguate from `mount-sinai-place` if both needed), `ganges-river-sacred`, `mount-meru-mythic`.

When in doubt about overlap with `08_places/`, both can exist: `mecca-place` (city) + `kaaba` (specific sacred site within it). Edge `kaaba —located-in→ mecca-place`.
