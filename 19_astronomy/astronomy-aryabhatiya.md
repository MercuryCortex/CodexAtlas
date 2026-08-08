---
type: astronomy
id: "astronomy-aryabhatiya"
title: "Āryabhaṭīya (Aryabhata's Astronomical Treatise)"
aka: ["Aryabhatiya", "आर्यभटीय"]
category: "astronomical-text"
date-composed: 499
date-earliest: 499
dating-basis: B1
dating-basis-source: "Plofker, K. 2009 *Mathematics in India* Princeton UP ch. 4; Pingree, D. 1981 *Jyotihśāstra* Wiesbaden"
dating-basis-notes: "The Āryabhaṭīya itself states it was composed when Aryabhata was 23 years old in 'Kaliyuga year 3600' = 499 CE in the Indian astronomical reckoning. This is one of the most precisely-dated ancient scientific works in world history."
languages-composed-in: "[[language-sanskrit-classical]]"
author: "[[aryabhata-astronomer]]"
region: "Kusumapura (likely identified with Pataliputra, modern Patna, Bihar; Gupta-era India)"
structure: "118 verses in 4 chapters: Daśagītikāpāda (Ten Giti stanzas, defining the time-system), Gaṇitapāda (Mathematics, 33 verses), Kālakriyāpāda (Time-reckoning, 25 verses), Golapāda (The Sphere, 50 verses)"
key-claims:
  - "Earth rotates on its axis (one of the earliest such proposals in world astronomy; revolutionary against the Hellenistic + Indian Purāṇic geocentric-stationary consensus)"
  - "Earth is spherical (consistent with Hellenistic + earlier Indian Siddhāntic tradition)"
  - "Sine table (jyā / ardhajyā — the trigonometric sine function in computational tabular form, transmitted via this work into Islamic + thence European mathematics)"
  - "π ≈ 62832/20000 = 3.1416 (correct to 4 decimal places; verse 2.10)"
  - "Algorithmic mathematics: kuttaka algorithm for indeterminate equations (precursor of what becomes the Chinese-Remainder-Theorem-style modular-arithmetic toolkit)"
  - "Eclipse computation by geometric model (correct mechanism: lunar eclipse = Earth's shadow falling on Moon; solar eclipse = Moon's shadow on Earth — not Rāhu mythologically)"
syncretic-edges:
  - target: "[[aryabhata-astronomer]]"
    type: "ancient-identification"
    source: "Plofker 2009 ch. 4"
    source-tier: "T1"
  - target: "[[astronomy-almagest]]"
    type: "parallel-form"
    source: "Pingree, D. 1971 'On the Greek Origin of the Indian Planetary Model' JHA 2"
    source-tier: "T1"
    notes: "Pingree's classic 1971 argument: parts of Indian Siddhāntic planetary-model machinery (epicyclic mathematics, specifically) derive from Hellenistic-period Greek transmission via the *Yavanajātaka* and related texts (c. 2nd-3rd c. CE). Aryabhata works in a tradition that has already absorbed Hellenistic + earlier Indian elements; the Āryabhaṭīya represents a major reformulation + extension, not an independent emergence. Some specific Aryabhatan innovations (Earth's axial rotation, the sine function in algebraic-tabular form, the kuttaka algorithm) are not in the Hellenistic predecessor and appear to be Indian-original."
  - target: "[[al-tusi-astronomer]]"
    type: "ancestor-of"
    source: "Plofker 2009 ch. 8; Saliba, G. 2007 *Islamic Science and the Making of the European Renaissance* MIT Press"
    source-tier: "T1"
    notes: "Aryabhata's sine tables + computational machinery transmitted into Arabic astronomy in the early Abbasid period (8th-9th c. CE) — al-Khwarizmi's *Zīj al-Sindhind* explicitly draws on Indian (Siddhāntic) astronomical models. This is one of two principal channels (the other being Hellenistic via Ptolemy) feeding the Islamic Golden-Age astronomy from which al-Tusi later builds. See [[astronomy-zij-i-ilkhani]] for the Maragha-school endpoint."
  - target: "[[astronomy-zij-al-sindhind]]"
    type: "ancestor-of"
    source: "Plofker, K. 2009 *Mathematics in India* Princeton UP ch. 8; Neugebauer, O. 1962 *The Astronomical Tables of al-Khwārizmī* Kgl. Danske Videnskabernes Selskab; Pingree, D. 1970 'The Fragments of the Works of al-Fazārī' JNES 29"
    source-tier: "T1"
    notes: "The Arabic text that carries the Indian trigonometric apparatus west, now wired as its own node. The sine rather than the chord becomes the universal computational primitive of Islamic and then European astronomy through this channel."
  - target: "[[astronomy-brahmasphutasiddhanta]]"
    type: "polemic-against"
    source: "Plofker 2009 ch. 4-5; Pingree, D. 1981 *Jyotiḥśāstra* Harrassowitz; Shukla, K. S. & Sarma, K. V. 1976 *Āryabhaṭīya of Āryabhaṭa* INSA"
    source-tier: "T1"
    notes: "The reciprocal of Brahmagupta's chapter-11 *Tantraparīkṣā*, which attacks this treatise and its author by name — above all the claim that the Earth rotates, which Brahmagupta flatly rejects. A live internal-Indian argument between the Āryapakṣa and the Brāhmapakṣa, and it has downstream consequences: it is the Brāhmapakṣa parameters, not Aryabhata's, that reach Baghdad as the Sindhind."
status: "metadata"
refs:
  - title: "Mathematics in India"
    author: "Plofker, Kim"
    year: 2009
    publisher: "Princeton University Press"
    type: "monograph"
    tier: 1
    notes: "Standard modern history; chapter 4 on Aryabhata + Āryabhaṭīya."
  - title: "Aryabhatiya of Aryabhata"
    author: "Shukla, K. S. & Sarma, K. V. (eds., trans.)"
    year: 1976
    publisher: "Indian National Science Academy"
    type: "primary-translation-critical-edition"
    tier: 1
  - title: "On the Greek Origin of the Indian Planetary Model Employing a Double Epicycle"
    author: "Pingree, David"
    year: 1971
    publisher: "Journal for the History of Astronomy 2: 80-85"
    type: "journal-article"
    tier: 1
  - title: "Jyotihśāstra: Astral and Mathematical Literature"
    author: "Pingree, David"
    year: 1981
    publisher: "Otto Harrassowitz"
    type: "monograph"
    tier: 1
tags: [astronomy, astronomical-text, aryabhata, aryabhatiya, sanskrit-science, indian-astronomy, sine-table, kuttaka, MASSIVE-WIN, transmission-chain]
---

# Āryabhaṭīya

The 499 CE astronomical-mathematical treatise of [[aryabhata-astronomer|Aryabhata]] — 118 verses in [[language-sanskrit-classical|Sanskrit]] that compactly state most of the mathematical-astronomical knowledge of late-Gupta India + several major original innovations. The Āryabhaṭīya is the principal node through which Indian astronomical content flows downstream into Islamic and ultimately European mathematics.

## The four chapters

1. **Daśagītikā** — defines the time-system + planetary-revolution counts (one Kaliyuga = 1,080,000 years; planetary periods).
2. **Gaṇitapāda** (Mathematics) — π ≈ 62832/20000 = 3.1416 (verse 2.10, the famous "approximation" that is actually said to be *āsannaḥ* "approached"); arithmetic + geometric sequences; quadratic equations; the indeterminate-equation *kuttaka* algorithm; geometric formulae.
3. **Kālakriyā** (Time-reckoning) — calendrical calculations, mean planetary positions.
4. **Gola** (The Sphere) — spherical-trigonometry computations for planetary positions, the sine function as algebraic table.

## Three load-bearing innovations

**Earth's rotation.** Verse 4.9 has Aryabhata claim that the apparent westward motion of the stars is due to the Earth's eastward rotation — a heretical position against both Hellenistic + Indian Purāṇic stationary-Earth tradition. Later Indian commentators (Brahmagupta especially) reject it; it does not become mainstream Indian astronomy. The proposal is closer in spirit to Aristarchus of Samos (3rd c. BCE Hellenistic Greek who proposed heliocentrism) than to subsequent Indian or medieval European astronomy.

**The sine function.** Aryabhata's *jyā* (sine) and *ardhajyā* (half-chord) tables, tabulated at 3.75° intervals, are one of the earliest computational sine tables. The function is transmitted via Arabic translation (the Sanskrit *jyā* becomes Arabic *jiba* → misread as *jaib* "bay/pocket" → Latin *sinus* "bay/fold" → English *sine* — one of the most-cited examples of mis-translation preserving a technical term).

**The *kuttaka* algorithm.** A systematic procedure for solving linear indeterminate equations *ax + by = c* — i.e. finding integer (x, y) solutions. This is the Indian precursor of the modular-arithmetic / Chinese-Remainder-Theorem family of algorithms that becomes central to medieval Islamic + then European number theory.

## The cross-tradition transmission chain (MASSIVE-WIN)

The Āryabhaṭīya sits at the center of a long documented transmission chain:

**Hellenistic Greek astronomy (Hipparchus + Ptolemy) → Greco-Indian transmission via the *Yavanajātaka* (c. 2nd-3rd c. CE) → Indian Siddhāntic tradition (Āryabhaṭīya 499) → Arabic transmission via al-Khwarizmi's *Zīj al-Sindhind* (early 9th c.) → [[al-tusi-astronomer|al-Tusi]] + the Maragha school (13th c.) → European Renaissance astronomy (Copernicus's lunar model is structurally identical to Ibn al-Shatir's, transmitted via Maragha; documented by Saliba 2007 + Roberts 1957).**

This is one of the most thoroughly-documented cross-tradition scientific-transmission chains in world history. The Āryabhaṭīya is the Indian middle of the chain.

## Vault connections

- [[aryabhata-astronomer]] — the author
- [[astronomy-almagest]] — Hellenistic predecessor in the transmission chain
- [[astronomy-surya-siddhanta]] — contemporary / slightly earlier Indian Siddhāntic work
- [[al-tusi-astronomer]] / [[astronomy-zij-i-ilkhani]] — Islamic downstream
- [[language-sanskrit-classical]] — language
- [[copernicus]] — distant European downstream (via Maragha)

## Refs

- Plofker, K. 2009. *Mathematics in India*. Princeton UP, ch. 4.
- Shukla, K. S. & Sarma, K. V. 1976. *Aryabhatiya of Aryabhata*. INSA.
- Pingree, D. 1971. "On the Greek Origin of the Indian Planetary Model." *JHA* 2.
- Pingree, D. 1981. *Jyotihśāstra*. Otto Harrassowitz.
