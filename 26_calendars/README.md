# 26 — Calendars & Time-Reckoning Systems

**Lens slot 26** of the 26-lens ontology. New 2026-05-18. Holds nodes of type `calendar-system`.

## What lives here

Systems for reckoning, dividing, and ritualizing time — calendars, with all their cosmological, agricultural, ritual, and astronomical dimensions.

**Examples:**
- **Babylonian luni-solar** (the ancestor of most Mesopotamian and Levantine calendars)
- **Egyptian civil 365-day** (the first solar calendar with regular intercalation absent), **Egyptian Sothic cycle**
- **Hebrew calendar** (luni-solar with Metonic 19-year cycle; molad calculation)
- **Islamic Hijri** (pure lunar; 354/355-day year; no intercalation)
- **Julian calendar** (Caesar 46 BCE; 365.25 day year)
- **Gregorian calendar** (1582 reform; current civil global)
- **Coptic calendar** (modified Egyptian; Tewahedo-shared)
- **Ge'ez / Ethiopian calendar** (13-month with Pagumē; 7-8 year offset from Gregorian)
- **Mayan calendrical system** (Long Count + Tzolkin 260-day + Haab 365-day + Calendar Round; Lords of the Night)
- **Aztec calendar** (Xiuhpohualli 365-day + Tonalpohualli 260-day)
- **Chinese sexagenary cycle** (stem-branch; 60-year cycle), **Chinese lunisolar** (with leap months)
- **Tibetan calendar** (Phugpa school + Tsurphu school — variant calculations; based on Kalachakra)
- **Vedic / Hindu calendars** (Yuga system at cosmic scale; tithi-lunar-day at ritual scale; multiple regional variants — Vikram Samvat / Saka / Tamil / Bengali / Malayalam)
- **Iranian Jalali calendar** (Omar Khayyam reform, 1079 CE; basis of modern Iranian / Afghan calendars)
- **Bahá'í Badíʿ calendar** (19 × 19 months + intercalary days)
- **French Revolutionary calendar** (decimal; failed)
- **Zoroastrian calendars** (Yazdegerd + variations)
- **Pre-Islamic Arabian luni-solar** (with intercalation; abolished by Muhammad)

## Why a separate lens

Calendars genuinely cross-cut multiple existing lenses and don't sit cleanly in any one of them:
- They encode **astronomy** (lunar / solar / synodic observation)
- They encode **mathematics** (intercalation algorithms; cycle calculation; sexagenary arithmetic)
- They encode **ritual** (when festivals fall; when fasts begin; when sacrifices happen)
- They encode **agriculture** (when to plant, harvest, slaughter)
- They encode **cosmology / tradition** (the Vedic yugas; the Mayan world-ages)

Each calendar is therefore a *system* — not reducible to any one of its constituents. Treating it as a first-class node with its own sheet means we can:
- Catalog the system's formal structure (cycle length, intercalation rule, epoch)
- Catalog the tradition's ritual rhythm derived from it
- Cross-link cleanly: this calendar drives this ritual, uses this astronomical observation, encodes this cosmology.

Currently calendar information is scattered as ad-hoc text in tradition or ritual nodes. Centralizing makes the cross-tradition patterns (lunar vs solar, intercalation strategies, year-zero choice / epoch, festival-anchoring) legible.

## YAML skeleton (provisional)

```yaml
id: mayan-calendrical-system
title: Mayan Calendrical System (Long Count + Tzolkin + Haab + Calendar Round)
type: calendar-system
category: composite-calendar-system   # luni-solar | lunar-pure | solar-pure | composite-calendar-system | cyclic-cosmic | sexagenary | decimal
tradition: maya-religion
date-attested-earliest: -700
date-attested-latest: 1500
epoch: 3114-BCE-Long-Count-base-date
cycle-lengths: [13.0.0.0.0-baktun, 260-tzolkin, 365-haab, 18980-calendar-round, 1872000-long-count-great-cycle]
intercalation-rule: none-haab-drifts-with-solar-year
astronomical-basis: [venus-cycle, solar-year-approximate, lunar-month-sidereal]
related-mathematics: [maya-vigesimal-base-20-number-system, maya-positional-notation-with-zero]
related-astronomy: [venus-observation-maya, lunar-eclipse-prediction-dresden-codex]
related-rituals: [tzolkin-day-naming-and-prophecy, world-age-end-rituals]
related-documents: [dresden-codex, madrid-codex, paris-codex, popol-vuh-references]
key-figures: [maya-day-keepers-aj-kij]
related-doctrines: [maya-world-age-cosmology, four-world-ages-creation]
parallel-calendars: [chinese-lunisolar-calendar, vedic-yuga-system]
parallel-relation: independent-cosmic-cycle-cosmology
controversies: [2012-end-of-world-misinterpretation-T4]
refs:
  - title: "..."
    tier: 1
status: metadata
```

## Slug convention

`mayan-calendrical-system`, `aztec-calendar-system`, `chinese-lunisolar-calendar`, `chinese-sexagenary-cycle`, `hebrew-calendar`, `islamic-hijri-calendar`, `julian-calendar`, `gregorian-calendar`, `egyptian-civil-calendar`, `coptic-calendar`, `geez-ethiopian-calendar`, `iranian-jalali-calendar`, `vedic-yuga-system`, `tibetan-phugpa-calendar`, `bahai-badi-calendar`.

When a tradition has multiple calendrical traditions (Hindu Tamil vs Vikram Samvat vs Saka), each gets its own node, cross-linked under the tradition.

## What does NOT live here

- **Individual festivals / holy days** → `14_rituals/` (Passover, Ramadan, Diwali, Vesak). Cross-link the festival to the calendar that defines it.
- **Astronomical phenomena** (precession, eclipses, planetary cycles) → `19_astronomy/`
- **Cosmological doctrines** (world-ages-as-doctrine, eternal-return-as-doctrine) → `21_theology/` or `06_themes/`
- **Mathematical / arithmetical methods** in calendar computation → `16_mathematics/` (cross-linked)
