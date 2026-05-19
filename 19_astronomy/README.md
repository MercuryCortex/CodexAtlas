# 19 — Astronomy (Observational Science)

**Lens slot 19** of the 26-lens ontology. New 2026-05-18. Holds nodes of type `astronomy`.

## What lives here

Astronomy as observational and predictive science — *distinct* from astrology (symbolic / divinatory interpretation).

**Examples:**
- **Astronomical texts:** *Almagest* (Ptolemy), *Surya Siddhanta*, MUL.APIN (Babylonian), *De revolutionibus* (Copernicus), *Astronomia Nova* (Kepler), *Sidereus Nuncius* (Galileo), *Zij-i Ilkhani* (al-Tusi), *Aryabhatiya* (Aryabhata), *Mathematical Treatise in Nine Sections* (Qin Jiushao).
- **Astronomers (as a specialty):** Ptolemy (as astronomer), Aryabhata, al-Tusi, Ulugh Beg, Tycho Brahe, Johannes Kepler, Galileo Galilei, Shen Kuo, Ibn al-Shatir, Hipparchus, Eratosthenes.
- **Observatories:** Maragha, Samarkand, Uraniborg (Tycho), Beijing Ancient Observatory, Jantar Mantar (Jaipur).
- **Astronomical instruments:** armillary sphere, astrolabe (as instrument — distinct from astrolabe-as-symbol), gnomon, water clock, Antikythera mechanism, quadrant, sextant.
- **Astronomical discoveries / phenomena understood:** precession of the equinoxes (Hipparchus), heliocentric model, Kepler's laws, lunar parallax.

## Why a separate lens from Astrology

Astronomy = observational and predictive science. Astrology = symbolic/divinatory interpretation. Conflating them is a 19th-century populist habit; serious scholarship has kept them firmly distinct since Otto Neugebauer (*The Exact Sciences in Antiquity*, 1957), David Pingree (*From Astral Omens to Astrology*, 1997), Francesca Rochberg (*The Heavenly Writing*, 2004).

The two have **overlapping practitioners historically** (Ptolemy wrote both *Almagest* AND *Tetrabiblos*) — express this via cross-lens edges between the astronomer node here and their astrological work elsewhere. The ontological categories themselves stay distinct.

## Where astrology lives

For now: cross-cutting tags on existing nodes + the existing Astrology UI tab. Promote to its own folder if volume demands it. Specific astrological systems (Hellenistic / Vedic / Chinese / Mesoamerican) can go in `25_divination/` if treated divinatorily, or `06_themes/` (eventually `06_motifs/`) if treated symbolically.

## What does NOT live here

- **Cosmology as theology** (Ptolemaic universe as theological claim, Norse Yggdrasil cosmology, Buddhist Mt. Meru) → `21_theology/` or `06_themes/`
- **Calendars** → `26_calendars/` (calendars use astronomical observation but are their own system)
- **Mathematical / geometric content within astronomy** → primary node here, cross-edge to `16_mathematics/`

## YAML skeleton (provisional)

```yaml
id: ptolemy-astronomer
title: Ptolemy (as astronomer)
type: astronomy
category: astronomer    # astronomer | observatory | instrument | astronomical-text | phenomenon | discovery
date-birth: 100
date-death: 170
region: Alexandria-Egypt
languages-worked-in: [koine-greek]
texts-authored: [almagest, geographia, tetrabiblos]
cross-tradition-edges:
  - target: aryabhata
    type: parallel-form
    note: "Independent late-antiquity / early-medieval planetary models"
refs:
  - title: "..."
    tier: 1
status: metadata
```

## Slug convention

`ptolemy-astronomer` (disambiguating from other Ptolemys), `almagest`, `surya-siddhanta`, `maragha-observatory`, `armillary-sphere-instrument`, `precession-of-equinoxes`.
