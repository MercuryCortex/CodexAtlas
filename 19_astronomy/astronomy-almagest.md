---
type: astronomy
id: "astronomy-almagest"
title: "Almagest (Ptolemy's *Mathēmatikḕ Sýntaxis*)"
aka: ["Almagest", "al-Majisṭī (Arabic)", "Mathēmatikḕ Sýntaxis (original Greek title; 'Mathematical Composition')", "Megálē Sýntaxis (Greek alternate title; 'Great Composition' — origin of *al-majisṭī*)"]
category: "astronomical-text"
date-composed: 150
date-earliest: 150
dating-basis: B1
dating-basis-source: "Toomer 1998 *Ptolemy's Almagest* Princeton UP introduction"
dating-basis-notes: "Composed c. 150 CE; observational records in the text date 127-141 CE; the work is generally taken as Ptolemy's mid-career masterwork."
languages-composed-in: "[[koine-greek]]"
author: "[[ptolemy-astronomer]]"
region: "Alexandria, Roman Egypt"
structure: "13 books covering: I (introductory + spherical geometry + chord table), II (spherical astronomy), III (Sun), IV (Moon), V (more lunar + parallax), VI (eclipses), VII-VIII (star catalog, 1022 stars at 48 constellations), IX-XIII (the five planets)"
key-claims:
  - "Geocentric model with epicyclic + deferent + eccentric + equant machinery (the equant is Ptolemy's most-criticized innovation; later Islamic astronomers spend centuries trying to eliminate it while preserving observational accuracy)"
  - "Chord table (the trigonometric chord function, computed for 0.5° intervals — predecessor of the sine function)"
  - "Star catalog of 1022 stars organized into 48 constellations, with magnitudes (1st-6th) — the basis of the Western + Arabic catalogues for the next 1500 years"
  - "Precession of the equinoxes documented (taken from Hipparchus)"
  - "Detailed eclipse-prediction machinery"
syncretic-edges:
  - target: "[[ptolemy-astronomer]]"
    type: "ancient-identification"
    source: "Toomer 1998"
    source-tier: "T1"
  - target: "[[hipparchus-astronomer]]"
    type: "heir-of"
    source: "Toomer 1998; Neugebauer 1975 *A History of Ancient Mathematical Astronomy*"
    source-tier: "T1"
    notes: "The Almagest preserves substantial Hipparchan material as cited content (the star catalog is built on Hipparchus's lost catalog; the precession discovery is Hipparchus's; many observational records are Hipparchus's)."
  - target: "[[astronomy-zij-i-ilkhani]]"
    type: "ancestor-of"
    source: "Saliba 2007; Ragep 1993 *Naṣīr al-Dīn al-Ṭūsī's Memoir on Astronomy*"
    source-tier: "T1"
    notes: "The Almagest is the foundational text for Islamic astronomy; the *Zīj-i Ilkhānī* (Tusi at Maragha, c. 1270) is a major Islamic astronomical handbook composed entirely within the Ptolemaic-Maragha framework with Tusi's mathematical reforms (the *Tūsī couple*) addressing the equant criticism."
  - target: "[[astronomy-aryabhatiya]]"
    type: "parallel-form"
    source: "Pingree 1971 'On the Greek Origin of the Indian Planetary Model' JHA 2"
    source-tier: "T1"
    notes: "The Almagest and the (slightly later) Āryabhaṭīya represent two strongly-related streams of post-classical mathematical astronomy: both work with epicyclic-geocentric machinery; both descend (Indian via Yavanajātaka c. 2nd-3rd c. CE) from a pre-Ptolemaic Hellenistic substrate; both feed into the Islamic-Golden-Age synthesis via 9th-c. Arabic translations."
  - target: "[[astronomy-babylonian-system-a-b]]"
    type: "heir-of"
    source: "Toomer, G. J. (trans.) 1998 *Ptolemy's Almagest* Princeton UP (IV.2, IV.6ff.); Neugebauer, O. 1975 *A History of Ancient Mathematical Astronomy* Springer Part I; Jones, A. 1991 'The Adaptation of Babylonian Methods in Greek Numerical Astronomy' Isis 82: 441-453"
    source-tier: "T1"
    notes: "The Babylonian inheritance is visible on the surface of the text, not inferred. *Almagest* IV.2 states the mean synodic month as 29;31,50,8,20 days — a Babylonian System B value — attributing the period relations to 'the ancients'; IV.6ff. calibrates the lunar theory on 8th-century-BCE Babylonian eclipse observations quoted as data. The geometry of the Almagest is Greek; a large share of its arithmetic, and all of its sexagesimal notation, is Babylonian."
  - target: "[[al-battani-astronomer]]"
    type: "ancestor-of"
    source: "Nallino, C. A. 1899-1907 *Al-Battānī sive Albatenii Opus Astronomicum* Milan; Hartner, W. 1970 'al-Battānī' in *Dictionary of Scientific Biography* vol. I; Swerdlow, N. M. & Neugebauer, O. 1984 *Mathematical Astronomy in Copernicus's De Revolutionibus* Springer"
    source-tier: "T1"
    notes: "The Almagest's most consequential empirical corrector. Al-Battānī, observing at al-Raqqa from 877 to 918, keeps Ptolemy's models and rebuilds his numbers: a much better tropical year and obliquity, a precession constant of about one degree in sixty-six years against Ptolemy's one degree per century, and — the structural result — the demonstration that the solar apogee, which Ptolemy held fixed, in fact moves. This is the form in which the Almagest tradition reached Latin Europe and was cited by name by Copernicus."
  - target: "[[astronomy-toledan-tables]]"
    type: "ancestor-of"
    source: "Toomer, G. J. 1968 'A Survey of the Toledan Tables' Osiris 15: 5-174; Burnett, C. 2001 'The Coherence of the Arabic-Latin Translation Programme in Toledo' Science in Context 14; Chabás, J. & Goldstein, B. R. 2003 *The Alfonsine Tables of Toledo* Kluwer/Springer"
    source-tier: "T1"
    notes: "Theory and tables crossed into Latin through the same Toledo workshop. Gerard of Cremona translated the Almagest itself there in 1175 and also rendered the canons of the Toledan Tables — the practical computational instrument, built on Almagest models with four centuries of Arabic parameter correction. The tables and their Alfonsine successor were what European astronomers actually calculated with until the seventeenth century; the Almagest was what they read."
status: "metadata"
refs:
  - title: "Ptolemy's Almagest"
    author: "Toomer, G. J. (trans.)"
    year: 1998
    publisher: "Princeton University Press (rev. ed.)"
    type: "primary-translation"
    tier: 1
  - title: "A History of Ancient Mathematical Astronomy"
    author: "Neugebauer, Otto"
    year: 1975
    publisher: "Springer (3 vols.)"
    type: "monograph"
    tier: 1
  - title: "Islamic Science and the Making of the European Renaissance"
    author: "Saliba, George"
    year: 2007
    publisher: "MIT Press"
    type: "monograph"
    tier: 1
tags: [astronomy, astronomical-text, almagest, ptolemy, hellenistic, geocentric, MASSIVE-WIN, transmission-chain]
---

# Almagest

The canonical Hellenistic astronomical treatise — Ptolemy's 13-book *Mathēmatikḕ Sýntaxis* ("Mathematical Composition") composed c. 150 CE in Alexandria. The Almagest fixed the form of pre-modern Western + Islamic astronomy for the next ~1400 years and is the single most consequential astronomical text in world history before Newton's *Principia*.

## Why "Almagest"

The Greek alternate title *Megálē Sýntaxis* ("Great Composition") became, in Arabic translation (9th c. CE), *al-Majisṭī* — using the Arabic definite article *al-* + a transliteration of the Greek superlative *megístē* ("greatest"). When the Arabic text was retranslated into Latin (Gerard of Cremona, Toledo, 1175), the Arabic *al-Majisṭī* was preserved as *Almagest*. The word's etymology is itself a transmission-chain artifact: Greek → Arabic → Latin → all subsequent European languages, with the Arabic-mediated form winning out even after direct Greek-to-Latin translations became available.

## The 13-book structure

| Books | Content |
|---|---|
| I | Mathematical preliminaries; spherical geometry; chord table |
| II | Spherical astronomy; risings + settings; celestial sphere |
| III | The Sun: solar theory + length of year |
| IV | The Moon: lunar theory + first model |
| V | More lunar: parallax + distance of Moon + Sun |
| VI | Eclipses: prediction machinery |
| VII–VIII | Star catalog (1022 stars in 48 constellations) + precession |
| IX–XIII | The five planets (Mercury, Venus, Mars, Jupiter, Saturn) with epicyclic models |

## The equant — the most consequential technical detail

Ptolemy's geometric machinery uses three principal devices: the **deferent** (the main circle on which a planet's epicycle center moves), the **epicycle** (the small circle on which the planet itself moves), and the **eccentric** (the deferent is centered not on Earth but offset). To these Ptolemy added the **equant** — a fictitious point, offset on the opposite side of the deferent center from Earth, from which the epicycle center moves at *uniform angular speed* (even though its actual linear speed varies).

The equant is a brilliant geometric device for fitting observations — but it violates the ancient principle of uniform circular motion that Ptolemy himself claims to honor (the epicycle center does not move uniformly with respect to its own deferent center). This *philosophical inconsistency* becomes the great motivator of Islamic-astronomy reform: most of the great Maragha-school work ([[al-tusi-astronomer|al-Tusi]], Mu'ayyad al-Din al-'Urdi, Qutb al-Din al-Shirazi, Ibn al-Shatir) is devoted to *replacing the equant* with mathematically-equivalent constructions using only uniform circular motions (the Tūsī couple is the central such device). This is the technical thread that, transmitted to Renaissance Europe, becomes Copernicus's lunar + Mercury models.

## Vault connections

- [[ptolemy-astronomer]] — author
- [[hipparchus-astronomer]] — principal source-precursor
- [[astronomy-aryabhatiya]] / [[astronomy-surya-siddhanta]] — Indian parallel-stream (sister-descendants of common Hellenistic pre-Ptolemaic substrate)
- [[al-tusi-astronomer]] / [[astronomy-zij-i-ilkhani]] — Islamic downstream
- [[copernicus]] — European Renaissance reform
- [[place-alexandria]] — site of composition
- [[koine-greek]] — language

## Refs

- Toomer, G. J. (trans.) 1998. *Ptolemy's Almagest*. Princeton UP.
- Neugebauer, O. 1975. *A History of Ancient Mathematical Astronomy*. Springer.
- Saliba, G. 2007. *Islamic Science and the Making of the European Renaissance*. MIT Press.
