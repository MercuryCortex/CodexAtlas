---
type: astronomy
id: "hipparchus-astronomer"
title: "Hipparchus of Nicaea"
aka: ["Hípparkhos", "Ἵππαρχος"]
category: "astronomer"
date-born: -190
date-died: -120
date-earliest: -147
dating-basis: B1
dating-basis-source: "Toomer, G. J. 1988 'Hipparchus' in DSB; Neugebauer 1975 *A History of Ancient Mathematical Astronomy* part III; Jones, A. 1991 'Hipparchus's Computations of Solar Longitudes' JHA 22"
dating-basis-notes: "Observational records preserved in Ptolemy's Almagest date Hipparchus's active period c. -147 to -127. Birth + death dates conventional but uncertain; sometimes given as -190 to -120."
region: "Nicaea (Bithynia, modern İznik in Turkey) + Rhodes (where he made most of his observations) + Alexandria (where he visited the library)"
languages-worked-in: "[[koine-greek]]"
texts-authored:
  - "Commentary on the *Phaenomena* of Aratus and Eudoxus — his only surviving complete work"
  - "Star catalog (lost; preserved as the basis for Ptolemy's Almagest catalog)"
  - "Chord table (lost; mentioned by Theon of Alexandria as a precursor of Ptolemy's table)"
  - "Numerous lost works including *On the Length of the Year*, *On the Precession of the Solstitial and Equinoctial Points*"
syncretic-edges:
  - target: "[[ptolemy-astronomer]]"
    type: "ancestor-of"
    source: "Toomer 1998 *Ptolemy's Almagest* introduction"
    source-tier: "T1"
    notes: "Ptolemy's Almagest preserves substantial Hipparchan material as cited content — the star catalog, the chord table, many observational records, the precession discovery, the lunar theory. Without the Almagest we would know very little of Hipparchus directly."
  - target: "[[astronomy-almagest]]"
    type: "ancestor-of"
    source: "Toomer 1998; Neugebauer 1975"
    source-tier: "T1"
    notes: "The Almagest is built on Hipparchan foundations + extended with three centuries of subsequent observations + Ptolemy's own models."
  - target: "[[aryabhata-astronomer]]"
    type: "parallel-form"
    source: "Pingree 1971 'On the Greek Origin of the Indian Planetary Model' JHA 2; Pingree 1981 *Jyotihśāstra*"
    source-tier: "T1"
    notes: "Hipparchus's chord function (the geometric primitive for spherical-astronomical computation) is the Hellenistic predecessor of the Indian *jyā* / half-chord = sine function tabulated in Aryabhata's *Āryabhaṭīya*. The transmission runs Greek-chord → Indian-half-chord (= sine) → Arabic *jiba* → Latin *sinus* — one of the most-cited examples of cross-tradition technical-vocabulary transmission."
status: "metadata"
refs:
  - title: "Hipparchus"
    author: "Toomer, G. J."
    year: 1988
    publisher: "in *Dictionary of Scientific Biography* vol. XV Supplement"
    type: "encyclopedia-article"
    tier: 1
    notes: "Standard reference biography."
  - title: "A History of Ancient Mathematical Astronomy"
    author: "Neugebauer, Otto"
    year: 1975
    publisher: "Springer"
    type: "monograph"
    tier: 1
    notes: "Part III on Hipparchus is the standard scholarly treatment."
  - title: "Hipparchus's Computations of Solar Longitudes"
    author: "Jones, Alexander"
    year: 1991
    publisher: "Journal for the History of Astronomy 22: 101-125"
    type: "journal-article"
    tier: 1
tags: [astronomy, astronomer, hipparchus, hellenistic, precession, chord-table, star-catalog, MASSIVE-WIN]
---

# Hipparchus of Nicaea

The greatest astronomer of the Hellenistic period and the principal source-precursor of [[ptolemy-astronomer|Ptolemy]] — without whom the [[astronomy-almagest|Almagest]] would not have been possible. Hipparchus is the discoverer of the **precession of the equinoxes**, the originator of the **star-catalog tradition** that runs through Ptolemy + Ulugh Beg into the modern era, and the constructor of the first systematic **chord table** that becomes the geometric primitive for spherical-astronomical computation across the Greek + Indian + Islamic + European traditions.

## The three load-bearing achievements

**1. The precession of the equinoxes.** By comparing his own observations with those of Timocharis + Aristyllus (c. -270, ~150 years earlier), Hipparchus showed that the celestial latitudes of stars near the ecliptic remained constant while their celestial longitudes had shifted — implying that the equinoctial points were precessing westward along the ecliptic at a rate he estimated as 1° per century (modern value: ~1° per 72 years, so Hipparchus was conservative by about 30%). This is one of the genuinely deep observational discoveries of pre-modern astronomy — it identifies a slow large-scale motion of the celestial coordinate system itself, not the stars individually.

**2. The star catalog.** Hipparchus catalogued ~850 stars with positions + magnitudes. The catalog is lost; what survives is Ptolemy's catalog in the Almagest, which is based on Hipparchus's. Long-running controversy over whether Ptolemy's catalog is *substantially* Hipparchus's (with mere date-correction for precession added) or independently reobserved by Ptolemy — see Newton 1977, Graßhoff 1990, Duke 2002.

**3. The chord table.** A table of the chord function *crd(θ) = 2R sin(θ/2)* — the spherical-astronomy primitive for computing planet + star positions. Hipparchus's table (lost) was the predecessor of Ptolemy's chord table (preserved in Almagest I.11) and through the Indian *jyā* / sine reformulation became the trigonometric sine of medieval Arabic + European astronomy.

## Vault connections

- [[ptolemy-astronomer]] — direct successor
- [[astronomy-almagest]] — preserves much of Hipparchus
- [[aryabhata-astronomer]] / [[astronomy-aryabhatiya]] — Indian downstream (jyā/sine)
- [[al-tusi-astronomer]] — Islamic downstream
- [[koine-greek]] — language

## Refs

- Toomer, G. J. 1988. "Hipparchus." *DSB* XV Suppl.
- Neugebauer, O. 1975. *A History of Ancient Mathematical Astronomy*. Springer, pt. III.
- Jones, A. 1991. "Hipparchus's Computations of Solar Longitudes." *JHA* 22.
