---
type: astronomy
id: "astronomy-babylonian-system-a-b"
title: "Babylonian Mathematical Astronomy (System A / System B)"
aka: ["System A", "System B", "the ACT corpus (Astronomical Cuneiform Texts)", "Babylonian ephemerides", "Late-Babylonian mathematical astronomy", "the step-function and zigzag-function schemes"]
category: "discovery"
date-earliest: -400
date-latest: -50
dating-basis: B3
dating-basis-source: "Neugebauer, O. 1955 *Astronomical Cuneiform Texts* (3 vols.) Lund Humphries; Ossendrijver, M. 2012 *Babylonian Mathematical Astronomy: Procedure Texts* Springer; Steele, J. M. 2008 *A Brief Introduction to Astronomy in the Middle East* Saqi"
dating-basis-notes: "Dated by the tablets themselves. The ~450 surviving ephemerides and procedure texts of the ACT corpus come almost entirely from Babylon and Uruk and carry Seleucid-era colophons; the earliest datable ephemerides are late-Achaemenid (5th-4th c. BCE) and the latest run into the 1st c. BCE. The observational base beneath them — the Astronomical Diaries — is continuous from -652 (Sachs & Hunger). The window -400 to -50 brackets the mature computational system, not its Mesopotamian prehistory."
region: "Babylonia — the temple scribal establishments of Babylon (Esagila) and Uruk (Rēš temple), Achaemenid to Parthian periods"
languages-composed-in: "Akkadian (cuneiform — Late-Babylonian dialect, with heavy logographic and sexagesimal notation)"
domains: ["predictive planetary and lunar theory", "arithmetical (non-geometric) astronomy", "period relations", "ephemeris construction", "the ancestry of Greek mathematical astronomy"]
role: "The world's first mathematical astronomy — a purely arithmetical apparatus for computing the future positions of the Sun, Moon and five planets from period relations, using step functions (System A) and linear zigzag functions (System B). It is the computational substrate that Hipparchus and Ptolemy inherit, and the reason Greek astronomy is stated in degrees, minutes and seconds."
syncretic-edges:
  - target: "[[astronomy-mul-apin]]"
    type: "heir-of"
    source: "Rochberg, F. 2004 *The Heavenly Writing* Cambridge UP; Hunger, H. & Pingree, D. 1999 *Astral Sciences in Mesopotamia* Brill; Steele 2008"
    source-tier: "T1"
    notes: "Same scribal institution, two stages. MUL.APIN (c. -1000) is a descriptive compendium — which stars rise when, roughly how long the planets take to return. System A and System B are what that tradition becomes once a long enough observational baseline exists to extract exact period relations and compute forward from them. The intervening steps (the Astronomical Diaries from -652, the Goal-Year texts, the 'System Zero' schemes) are documented; this is a continuous institutional descent, not a break."
  - target: "[[astronomy-eclipse-prediction-saros]]"
    type: "constituent-of"
    source: "Steele, J. M. 2000 *Observations and Predictions of Eclipse Times in Early Astronomy* Springer; Aaboe, Britton, Henderson, Neugebauer & Sachs 1991 'Saros Cycle Dates and Related Babylonian Astronomical Texts' TAPS 81/6"
    source-tier: "T1"
    notes: "The 223-month Saros is one period relation inside the same apparatus. The System A and System B lunar theories are built to compute the *circumstances* of a syzygy — the exact time, the lunar latitude, the eclipse magnitude — for which the bare Saros only gives the date-slot. The Saros is the entry point; the lunar systems are the machinery behind it."
  - target: "[[astronomy-babylonian-zodiac]]"
    type: "constituent-of"
    source: "Rochberg, F. 1998 *Babylonian Horoscopes* American Philosophical Society; Britton, J. P. 2010 'Studies in Babylonian Lunar Theory: Part III' AHES 64"
    source-tier: "T1"
    notes: "The uniform 12-sign, 30°-per-sign ecliptic is the coordinate system the ephemerides are *written in*, and the two innovations are contemporary and mutually necessary: System A's step functions are defined on arcs of the zodiac, which requires the zodiac to have been made a uniform mathematical division rather than a belt of unequal constellations."
  - target: "[[mathematics-sexagesimal-babylonian]]"
    type: "constituent-of"
    source: "Neugebauer 1955 *Astronomical Cuneiform Texts*; Ossendrijver 2012; Neugebauer, O. 1957 *The Exact Sciences in Antiquity* Brown UP"
    source-tier: "T1"
    notes: "The computation is sexagesimal place-value arithmetic throughout — this is what makes it possible at all. Because Greek astronomy takes over the apparatus it also takes over the notation, which is why celestial longitude, time, and angle are still divided into sixties on every clock and protractor in use today. The base-60 fraction is the single most durable artefact of Babylonian science."
  - target: "[[phase-1-019-enuma-anu-enlil]]"
    type: "successor-to"
    source: "Rochberg 2004 *The Heavenly Writing* CUP; Brown, D. 2000 *Mesopotamian Planetary Astronomy-Astrology* Styx"
    source-tier: "T1"
    notes: "The decisive epistemic shift, inside one institution and one profession. The *Enūma Anu Enlil* celestial-omen series treats a celestial event as a divine sign to be interpreted after it occurs. System A and System B treat the same event as a periodic quantity computable in advance. The same scribes — the *ṭupšar Enūma Anu Enlil* — do both, which is why the vault keeps astronomy and celestial divination as separate lenses joined by wires rather than collapsing them."
  - target: "[[hipparchus-astronomer]]"
    type: "ancestor-of"
    source: "Neugebauer, O. 1975 *A History of Ancient Mathematical Astronomy* Springer (Part I + III); Toomer, G. J. 1988 'Hipparchus and Babylonian Astronomy' in *A Scientific Humanist: Studies in Memory of Abraham Sachs*; Jones, A. 1991 'The Adaptation of Babylonian Methods in Greek Numerical Astronomy' Isis 82: 441-453"
    source-tier: "T1"
    notes: "MECHANISM, not resemblance. Hipparchus adopts specific Babylonian *numbers*: the System B mean synodic month of 29;31,50,8,20 days, the 223-month and 251-month lunar period relations, and the anomalistic-month relation 251 synodic = 269 anomalistic. These are not values a Greek observer could have derived from the short Greek observational record; they require the Babylonian centuries-long baseline. Toomer 1988 is the standard demonstration that Hipparchus had direct access to Babylonian material, plausibly in translation."
  - target: "[[astronomy-almagest]]"
    type: "ancestor-of"
    source: "Toomer, G. J. (trans.) 1998 *Ptolemy's Almagest* Princeton UP (IV.2, IV.6ff.); Neugebauer 1975 Part I; Jones 1991 Isis 82"
    source-tier: "T1"
    notes: "Ptolemy states the Babylonian mean synodic month 29;31,50,8,20 days in *Almagest* IV.2, attributing the period relations to 'the ancients', and calibrates his lunar theory on 8th-century-BCE Babylonian eclipse observations quoted in IV.6ff. The transmission is thus visible on the surface of the foundational text of both Western and Islamic astronomy: the geometry is Greek, a large part of the arithmetic is Babylonian."
  - target: "[[berossus]]"
    type: "parallel-form"
    source: "Vitruvius *De Architectura* IX.6.2; Verbrugghe, G. & Wickersham, J. 1996 *Berossos and Manetho* University of Michigan Press; Rochberg 2004"
    source-tier: "T2"
    notes: "The named-individual channel, and it is weaker than the textual one. Vitruvius reports that the Babylonian priest Berossus founded a school on Cos and taught Babylonian astral science to Greeks; Pliny (*NH* 7.123) says the Athenians honoured him with a statue for his predictions. If true this is a personal Babylonian-to-Greek transmission route c. -280. But the report is late, the *Babyloniaca* survives only in fragments, and nothing in the ACT corpus can be tied to Berossus. Scholarship treats him as evidence that such contact was culturally plausible, not as the proven conduit; the demonstrable transmission is the parameter-level one to Hipparchus and Ptolemy."
  - target: "[[astronomy-antikythera-mechanism]]"
    type: "mechanized-by"
    source: "Freeth, T. et al. 2008 'Calendars with Olympiad display and eclipse prediction on the Antikythera Mechanism' Nature 454: 614-617; Jones, A. 2017 *A Portable Cosmos* Oxford UP"
    source-tier: "T1"
    notes: "The Antikythera Mechanism's dials are Babylonian period relations cut into bronze: the 19-year Metonic cycle, the 76-year Callippic, the 223-month Saros with its 54-year Exeligmos correction. Jones 2017 shows the mechanism's planetary and lunar schemes draw on Babylonian arithmetical parameters. It is the physical proof that the Babylonian apparatus was in working Greek hands by c. -100."
  - target: "[[astronomy-surya-siddhanta]]"
    type: "ancestor-of"
    source: "Pingree, D. 1973 'The Mesopotamian Origin of Early Indian Mathematical Astronomy' JHA 4: 1-12; Pingree, D. 1981 *Jyotiḥśāstra* Harrassowitz; Plofker, K. 2009 *Mathematics in India* Princeton UP ch. 2-3"
    source-tier: "T2"
    notes: "CONTESTED, and flagged as such. Pingree argued that Babylonian arithmetical schemes — linear zigzag functions for day-length and lunar motion, the tithi, ratios like 3:2 for longest-to-shortest day — reached India before any Greek geometrical astronomy did, surfacing in the *Vedāṅga Jyotiṣa* (c. -400) via Achaemenid-period contact. The claim is widely adopted in Western histories of science. It is disputed by scholars who read the *Vedāṅga Jyotiṣa* schemes as indigenous developments and who regard Pingree's diffusionism as over-strong (see Plofker 2009 pp. 27-40 for a careful statement of both positions). The vault records it at T2: a serious, well-argued, non-consensus reconstruction with an identified contact period but no surviving translation, translator or named channel — unlike the Babylonian-to-Greek case, where the numbers themselves are the evidence."
  - target: "[[hebrew-calendar]]"
    type: "ancestor-of"
    source: "Stern, S. 2001 *Calendar and Community: A History of the Jewish Calendar, 2nd Century BCE - 10th Century CE* Oxford UP; Neugebauer 1957 *The Exact Sciences in Antiquity*"
    source-tier: "T1"
    notes: "The most surprising surviving artefact. The rabbinic calendar's *molad* interval — the assumed mean lunation — is 29 days, 12 hours and 793 *ḥalaqim* (1080ths of an hour). Converted to sexagesimal this is exactly 29;31,50,8,20 days: the System B value, still in daily liturgical use to fix Rosh Hashanah and Passover more than two millennia after the tablets that carry it were written. The Babylonian month-names carried in the Jewish calendar (Nisan, Tammuz, Elul, Tishrei, Kislev, Adar) come through the same Babylonian-exile channel."
status: "metadata"
refs:
  - title: "Astronomical Cuneiform Texts (3 vols.)"
    author: "Neugebauer, Otto"
    year: 1955
    publisher: "Lund Humphries (London)"
    type: "critical-edition-with-translation"
    tier: 1
    notes: "The foundational edition of the ephemeris corpus, from which the labels 'System A' and 'System B' come. Still the reference point for all later work."
  - title: "Babylonian Mathematical Astronomy: Procedure Texts"
    author: "Ossendrijver, Mathieu"
    year: 2012
    publisher: "Springer"
    type: "critical-edition-with-commentary"
    tier: 1
    notes: "The modern successor to ACT: edits the *procedure* texts — the instructions for constructing the ephemerides — and so reconstructs how the schemes were actually used rather than only what they produced."
  - title: "The Heavenly Writing: Divination, Horoscopy, and Astronomy in Mesopotamian Culture"
    author: "Rochberg, Francesca"
    year: 2004
    publisher: "Cambridge University Press"
    type: "monograph"
    tier: 1
    notes: "The standard study of the relation between Babylonian celestial divination and Babylonian predictive astronomy."
  - title: "The Adaptation of Babylonian Methods in Greek Numerical Astronomy"
    author: "Jones, Alexander"
    year: 1991
    publisher: "Isis 82: 441-453"
    type: "journal-article"
    tier: 1
    notes: "Demonstrates from the Oxyrhynchus astronomical papyri that Babylonian arithmetical methods were in continuous working use in Greco-Roman Egypt alongside Ptolemaic geometrical astronomy."
  - title: "Astronomical Diaries and Related Texts from Babylonia"
    author: "Sachs, Abraham & Hunger, Hermann"
    year: 1988
    publisher: "Österreichische Akademie der Wissenschaften (multi-volume, 1988-)"
    type: "critical-edition-with-translation"
    tier: 1
    notes: "The observational record beneath the computation: a near-continuous night-by-night programme from -652 to -61, the longest sustained scientific observation project in human history."
  - title: "Ancient Babylonian astronomers calculated Jupiter's position from the area under a time-velocity graph"
    author: "Ossendrijver, Mathieu"
    year: 2016
    publisher: "Science 351: 482-484"
    type: "journal-article"
    tier: 1
    notes: "Shows Babylonian scribes computing Jupiter's displacement as the area of a trapezoid under a velocity-vs-time graph — a geometrical-abstraction technique otherwise first attested in 14th-century Oxford and Paris."
tags: [astronomy, discovery, babylonian, system-a, system-b, mathematical-astronomy, ephemerides, seleucid, sexagesimal, MASSIVE-WIN, transmission-chain]
---

# Babylonian Mathematical Astronomy (System A / System B)

The first mathematical astronomy in the history of the world, and the head of the transmission chain that runs Babylon → Greece → India → the Islamic world → Latin Europe. Roughly 450 clay tablets from Babylon and Uruk, most of them Seleucid-era, contain **ephemerides** — tables giving the computed positions and times of lunar and planetary phenomena, month by month, into the future — together with the **procedure texts** that explain how to build them.

What makes them epochal is not accuracy but *method*. These are not records of what was seen. They are calculations of what will happen, produced from period relations by pure arithmetic, with no geometry, no spheres, no physical model of the heavens at all.

## The two systems

Both systems compute the same thing — the position and timing of a celestial event at each successive occurrence — and both work by describing how a quantity *changes* from one occurrence to the next. They differ in the shape of that change.

**System A — the step function.** A quantity takes one constant value over one arc of the zodiac and a different constant value over another, jumping discontinuously at the boundary. In the standard solar scheme the Sun advances 30° per synodic month through one zodiacal arc and 28;7,30° per month through the complementary arc. The zodiac is divided into velocity zones; the computation is a bookkeeping walk through those zones.

**System B — the linear zigzag function.** The quantity increases by a constant difference each step until it reaches a maximum, then decreases by the same constant difference until it reaches a minimum, and turns again. Plotted, it is a triangular wave. It approximates the same physical periodicity with a smoothly varying rather than a zoned rule.

Neither is "more correct". They are two arithmetical idioms for the same problem, developed and used in parallel — sometimes in the same archive, occasionally by the same scribe — and applied to the Moon and to all five visible planets. Ancient Greek sources name two Babylonian astronomers, **Naburianos** and **Kidenas** (Nabû-rīmannu and Kidinnu); Neugebauer's tentative association of them with System A and System B respectively is traditional but not securely established.

## Why it is arithmetic and not geometry

This is the deep contrast with the Greek tradition, and the reason the two fit together so productively. Greek astronomy asks *what mechanism in space produces this appearance* and answers with circles: eccentrics, epicycles, deferents. Babylonian astronomy asks *what number comes next in this sequence* and answers with functions.

The Greek approach yields a picture of the cosmos; the Babylonian approach yields the numbers to put in it. Hipparchus and Ptolemy take the Babylonian parameters and hang Greek geometry on them, and that composite — Babylonian numbers inside Greek circles, written in Babylonian sexagesimal notation — is what the *Almagest* is.

Ossendrijver's 2016 finding complicates the clean division: at least one Babylonian procedure computes Jupiter's displacement as the **area under a velocity-versus-time graph**, treating a trapezoid in an abstract time-velocity space. That is a geometrical abstraction of exactly the kind otherwise credited to the 14th-century Oxford Calculators.

## The parameters that prove the transmission

The Babylon-to-Greece link is not argued from resemblance. It is argued from identical numbers that only one of the two traditions was in a position to measure.

- **The mean synodic month, 29;31,50,8,20 days.** A System B value. It appears in Hipparchus, is stated by Ptolemy in *Almagest* IV.2, and — through the Babylonian exile — is still the *molad* interval of the Jewish calendar, where it is expressed as 29 days, 12 hours, 793 *ḥalaqim*.
- **The 223-month eclipse period** and the related 251-month and 269-month anomalistic relations, all Babylonian, all adopted wholesale into Greek lunar theory.
- **Eighth-century-BCE Babylonian eclipse observations**, quoted as data in *Almagest* IV.6ff. Ptolemy is openly using a record that predates Greek astronomy by four centuries.
- **The sexagesimal degree.** Greek astronomy divides the circle into 360 parts and each part into sixtieths because Babylonian astronomy did, and modern astronomy still does.

Alexander Jones's work on the Oxyrhynchus papyri closes the loop: Babylonian-style arithmetical schemes were still being used by working astronomers in Roman Egypt centuries after Ptolemy, in parallel with his geometrical models, not superseded by them.

## What the vault does *not* claim here

The India wire on this node is deliberately tiered down to **T2**. Pingree's case that Babylonian zigzag arithmetic reached India before Greek geometry is serious, influential, and reconstructed from real textual features of the *Vedāṅga Jyotiṣa* — but it has no named translator, no surviving translation, and no institution behind it, and it is contested by specialists who read those features as indigenous. That is a different evidentiary situation from the Greek case, where the Babylonian numbers are sitting in the Greek text. The tiers record the difference.

## Vault connections

- [[astronomy-mul-apin]] — the descriptive compendium this apparatus grows out of
- [[astronomy-eclipse-prediction-saros]] — the eclipse period relation inside it
- [[astronomy-babylonian-zodiac]] — the coordinate system it computes in
- [[phase-1-019-enuma-anu-enlil]] — the omen tradition it emerges from and departs from
- [[mathematics-sexagesimal-babylonian]] — the notation that carried worldwide
- [[hipparchus-astronomer]] · [[astronomy-almagest]] — the Greek inheritors
- [[astronomy-antikythera-mechanism]] — the parameters in bronze
- [[berossus]] — the reported personal Babylonian-to-Greek channel
- [[hebrew-calendar]] · [[babylonian-calendar]] · [[calendar-metonic-cycle]] — the calendrical afterlife
- [[tradition-neo-babylonian]] — the institutional setting

## Refs

- Neugebauer, O. 1955. *Astronomical Cuneiform Texts*. Lund Humphries.
- Ossendrijver, M. 2012. *Babylonian Mathematical Astronomy: Procedure Texts*. Springer.
- Rochberg, F. 2004. *The Heavenly Writing*. Cambridge UP.
- Jones, A. 1991. "The Adaptation of Babylonian Methods in Greek Numerical Astronomy." *Isis* 82.
- Sachs, A. & Hunger, H. 1988–. *Astronomical Diaries and Related Texts from Babylonia*. ÖAW.
- Ossendrijver, M. 2016. "Ancient Babylonian astronomers calculated Jupiter's position from the area under a time-velocity graph." *Science* 351.
