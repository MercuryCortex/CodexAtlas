---
id: mathematics-sexagesimal-babylonian
type: mathematics
title: "Sexagesimal (base-60) Babylonian numeration"
math-type: numeral-system
tradition: tradition-mesopotamian
also-in-traditions:
  - tradition-canaanite-ugaritic
date_earliest: -3000
date_latest: 2026
date-earliest: -3000
dating-basis: B5
dating-basis-source: "Robson, E. 2008 *Mathematics in Ancient Iraq*; Friberg, J. 2007 *A Remarkable Collection of Babylonian Mathematical Texts*"
dating-basis-notes: "Sexagesimal numeration appears in Sumerian administrative cuneiform from c. -3000; the system reaches full positional sophistication (including placeholder-zero) in the Old Babylonian period (c. -1900 to -1600). The 60-second minute and 60-minute hour and 360-degree circle survive in modern measurement as direct inheritances."
tags: [mathematics, sexagesimal, base-60, babylonian, sumerian, place-value, plimpton-322]
cross-tradition-edges:
  - target: "[[astronomy-mul-apin]]"
    type: "computational-substrate-of"
    source: "Robson, E. 2008 *Mathematics in Ancient Iraq* Princeton; Hunger, H. & Pingree, D. 1989 *MUL.APIN*"
    source-tier: T1
    note: "Babylonian astronomy is computed ENTIRELY in sexagesimal: the MUL.APIN intercalation rules, rising-time and shadow-length tables, and the 360° / 12×30 ideal-year scheme (ancestor of the zodiac and the 360-degree circle) are base-60 arithmetic. The number system is the computational substrate of the celestial order the Enuma Elish cosmogony establishes."
refs:
  - title: "Mathematics in Ancient Iraq"
    author: "Robson, Eleanor"
    year: 2008
    publisher: "Princeton University Press"
    type: "monograph"
    tier: 1
  - title: "A Remarkable Collection of Babylonian Mathematical Texts"
    author: "Friberg, Jöran"
    year: 2007
    publisher: "Springer"
    type: "monograph"
    tier: 1
---

# Sexagesimal numeration

The base-60 place-value numeral system of Sumerian and Babylonian mathematics — the oldest fully developed positional numeration in human history. The system survives in modern measurement: 60 seconds per minute, 60 minutes per hour, 360 degrees per circle, 360 minutes-of-arc per six-degree arc, etc. The choice of 60 is highly composite (60 = 2²×3×5 has 12 divisors: 1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60) — making division by small integers exact and arithmetic efficient.

## The notation

The basic glyphs are two cuneiform wedge-forms: a vertical wedge for 1 and a corner-wedge for 10. The numbers 1-59 are written with combinations of these (𒁹 = 1, 𒁹𒁹 = 2, ..., 𒌋 = 10, 𒌋𒌋 = 20, ..., 𒌋𒌋𒌋𒁹𒁹𒁹𒁹𒁹𒁹𒁹𒁹𒁹 = 39, ..., up to 59). Numbers 60 and above use place-value: the leftmost group of 1s and 10s represents the 60⁰ place, the next leftward group represents the 60¹ place (multiplied by 60), the next represents 60² = 3600, and so on. A placeholder (sometimes a separated space, later a dedicated double-wedge sign) marked empty positions; this is not a *true* mathematical zero (it cannot be operated on as a number), but it is a working zero-placeholder predating the [[mathematics-zero-india|Indian śūnya]] by two millennia.

## Plimpton 322

The Old Babylonian tablet Plimpton 322 (c. -1800) is one of the most-discussed mathematical artifacts in history. The tablet preserves a table of fifteen rows, each containing what appear to be Pythagorean triples — sets of three integers (*a*, *b*, *c*) satisfying *a*² + *b*² = *c*² — given in sexagesimal notation a millennium before Pythagoras. The interpretation has been contested (Neugebauer + Sachs 1945 read it as Pythagorean-triple table; Robson 2002 read it as a teacher's exercise on reciprocal pairs that incidentally produces Pythagorean-shaped numbers). Whatever the original purpose, the tablet preserves precise sexagesimal arithmetic at a sophistication unmatched in the world until classical Greek geometry.

## The astronomical inheritance

Babylonian sexagesimal astronomy ([[astronomy-mul-apin]] and later) used the base-60 system for tracking lunar and planetary periods with high precision. Greek astronomy (Hipparchus, Ptolemy) inherited the Babylonian sexagesimal fractions and used them for angular measurement; the survival of 60-minute-degree-arc and 360°-circle in modern use is the direct descent. The modern 24-hour day with 60-minute hours is the same inheritance through medieval Islamic and Latin astronomy.

## Cross-tradition connections

- **[[mathematics-babylonian-temple]]**: the broader Mesopotamian mathematical context.
- **[[mathematics-zero-india]]**: the structurally later Indian positional system with true zero — base 10, not base 60.
- **[[mathematics-mayan-vigesimal]]**: parallel native-American positional system with true zero — base 20, not base 60.
- **[[astronomy-mul-apin]]**: the principal Babylonian astronomical tradition using sexagesimal precision.

## Refs

- Robson, E. 2008. *Mathematics in Ancient Iraq*. Princeton.
- Friberg, J. 2007. *A Remarkable Collection of Babylonian Mathematical Texts*. Springer.
