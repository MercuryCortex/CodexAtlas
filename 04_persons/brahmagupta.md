---
type: person
id: "brahmagupta"
name: "Brahmagupta"
aka: ["Brahmagupta of Bhillamala", "Brahmagupta of Bhillamāla"]
role: "mathematician / astronomer"
tradition: "Vedic / Gupta-period Indian mathematics"
region: "Bhillamala (modern Bhinmal, Rajasthan, India)"
date-born: 598
date-died: 668
floruit-earliest: 628
floruit-latest: 665
historicity: "historical"
originator-of: ["first arithmetic rules for zero", "Brahmagupta's theorem (cyclic quadrilaterals)", "first systematic treatment of negative numbers in India"]
texts-authored:
  - "Brahmasphutasiddhanta (628 CE) — Correctly Established Doctrine of Brahma; 25-chapter astronomical treatise containing the arithmetic of zero and negative numbers"
  - "Khandakhadyaka (665 CE) — astronomical handbook; tables used by al-Khwarizmi"
status: full
tier: 1
tags:
  - mathematics
  - india
  - zero
  - astronomy
  - gupta-period
  - algebra
  - negative-numbers

cross-tradition-edges:
  - target: astronomy-brahmasphutasiddhanta
    type: ancient-identification
    source: "Plofker, K. 2009 *Mathematics in India* Princeton UP ch. 5; Colebrooke, H. T. (trans.) 1817 *Algebra, with Arithmetic and Mensuration, from the Sanscrit of Brahmegupta and Bháscara* John Murray; Pingree, D. 1981 *Jyotiḥśāstra* Harrassowitz"
    source-tier: "T1"
    notes: "His treatise of 628 CE, now a node in the astronomy lens. Self-dated in the text: composed in Śaka 550 at Bhillamāla under the Cāpa king Vyāghramukha, when the author was thirty. Twenty-four chapters, of which chapter 11 attacks Āryabhaṭa by name, chapter 12 is arithmetic and mensuration, and chapter 18 gives the first surviving arithmetic of zero and of negative quantities anywhere in the world."
  - target: astronomy-zij-al-sindhind
    type: ancestor-of
    source: "Pingree, D. 1970 'The Fragments of the Works of al-Fazārī' JNES 29: 103-123; Neugebauer, O. 1962 *The Astronomical Tables of al-Khwārizmī* Kgl. Danske Videnskabernes Selskab; Plofker 2009 ch. 8"
    source-tier: "T1"
    notes: "The named mechanism of the transfer, with a date and a city. An Indian delegation reaching Baghdad in 771/773 brought a Sanskrit *siddhānta* to the caliph al-Manṣūr; al-Fazārī and Yaʿqūb ibn Ṭāriq rendered it as the *Zīj al-Sindhind al-kabīr*, which al-Khwārizmī then rewrote as his own zīj a generation later. Indian astronomy therefore reaches Baghdad BEFORE the great Greek-to-Arabic translation wave — Islamic astronomy is Indian before it is Greek."
  - target: mathematics-zero-india
    type: parent-of
    note: Brahmagupta's Brahmasphutasiddhanta (Chapter 18, 628 CE) contains the first written arithmetic rules for zero as a number — not a placeholder but an operand. His rules (n + 0 = n; n − 0 = n; n × 0 = 0) are correct and foundational. His rule for 0 ÷ 0 = 0 was wrong and would not be correctly addressed until Bhaskara II (12th c.) and rigorously until the 19th century. Before Brahmagupta, zero existed as a scribal placeholder; he made it mathematics.
  - target: mathematics-sulba-sutras
    type: heir-of
    note: Brahmagupta is the heir of the Vedic mathematical tradition the Sulba Sutras represent, now 1,400 years on. Where the Sulba Sutras applied geometry to fire-altar construction, Brahmagupta applies algebra and arithmetic to astronomical computation. Both emerge from the same Vedic tradition's sustained mathematical culture.
  - target: mathematics-house-of-wisdom
    type: ancestor-of
    note: The Brahmasphutasiddhanta was translated into Arabic c. 773-775 CE under Caliph al-Mansur — one of the very first Indian scientific texts to reach Baghdad. Al-Khwarizmi's Kitab al-Hisab al-Hindi (c. 825 CE) draws directly from this translation. The chain Brahmagupta (628) → Arabic translation (c. 775) → al-Khwarizmi (c. 825) → Latin translation (c. 1126) → Fibonacci (1202) → European mathematics is the clearest single transmission chain in mathematical history.
  - target: al-khwarizmi
    type: ancestor-of
    note: Al-Khwarizmi's transmission of Indian numerals and zero arithmetic is a direct continuation of Brahmagupta's work through Arabic translation. Al-Khwarizmi explicitly credits Hindu mathematical sources. The transmission gap is 50 years — Brahmagupta writes (628) → text reaches Baghdad (c. 775) → al-Khwarizmi synthesizes (c. 825).
  - target: fibonacci
    type: ancestor-of
    note: Fibonacci's explicit opening — "The nine Indian figures are... With these nine figures, and with the sign 0 which the Arabs call zephyr, any number whatsoever can be written" — is a direct echo of Brahmagupta's zero arithmetic, filtered through 574 years of Islamic mathematical transmission.
  - target: mathematics-chinese-nine-chapters
    type: parallel
    note: Brahmagupta's treatment of negative numbers (rina, debt) in the Brahmasphutasiddhanta and the Chinese Jiuzhang's treatment of fu (negative) numbers are parallel independent discoveries. The Chinese text is earlier (c. 100 BCE vs. 628 CE), but the Indian treatment is the version that reached the Islamic world and Europe. Both arrived at the same cognitive step — that numbers below zero are real and operationally valid — through accounting contexts.
---

# Brahmagupta

## The Man Who Completed Zero

Brahmagupta (598–668 CE) is the mathematician who transformed zero from a scribal placeholder into a mathematical entity. His *Brahmasphutasiddhanta* (628 CE), written at age 30 at the observatory of Bhillamala (modern Bhinmal, Rajasthan), contains the first formalized arithmetic rules for zero in any mathematical tradition.

He was head astronomer at Bhillamala, the largest astronomical center in northwestern India. His work is simultaneously practical astronomy (computing planetary positions for religious-calendar purposes) and foundational mathematical innovation.

## The *Brahmasphutasiddhanta* — What It Contains

The *BSS* is a 25-chapter astronomical treatise in verse. Chapter 18 contains the landmark mathematical material:

**Arithmetic of zero:**
- *n* + 0 = *n*; *n* − 0 = *n*; *n* × 0 = 0; 0 ± 0 = 0; 0 × 0 = 0
- And the famous error: 0 ÷ 0 = 0 (wrong; undefined; not resolved until the 19th century)

**Arithmetic of negative numbers** (*rina*, debt):
- positive × negative = negative; negative × negative = positive

These rules are the same rules every student learns today. Brahmagupta stated them in a commercial metaphor — debts and assets — the most natural context for negative quantities.

## MASSIVE WIN — Zero Becomes a Number

Before Brahmagupta, zero was a scribal mark — a dot indicating an empty column in a positional number system. This is zero-as-placeholder, zero-as-absence.

Brahmagupta's *n* × 0 = 0 and *n* + 0 = *n* are something different: they are statements that zero participates in the same arithmetic operations as any other number. Zero is not an absence but a number with properties, a full citizen of the number system. This is the cognitive step that no other civilization had taken at that point.

The transmission that followed:
```
Brahmagupta, Bhillamala (628 CE)
     ↓ Arabic translation (c. 773-775 CE, al-Fazari)
al-Khwarizmi, Baghdad (c. 825 CE)
     ↓ Latin translation (c. 1126 CE)
Fibonacci, Pisa (1202 CE) — "the sign 0 which the Arabs call zephyr"
     ↓
Every number written in the Western world from 1202 to the present
```

## MASSIVE WIN — The Cyclic Quadrilateral Theorem

Brahmagupta's formula for the area of a cyclic quadrilateral (inscribed in a circle):

**Area = √[(s−a)(s−b)(s−c)(s−d)]** where *s* is the semi-perimeter.

This generalizes Heron's formula for triangles. European mathematicians would not rediscover it until the 17th century.

## The Gupta Efflorescence

Brahmagupta worked at the peak of India's mathematical golden age:
- **Aryabhata** (476–550 CE): π ≈ 3.1416; Earth as rotating sphere; trigonometric sine
- **Brahmagupta** (598–668 CE): Zero arithmetic; negative numbers; cyclic quadrilateral theorem
- **Bhaskara II** (1114–1185 CE): Algebra including recognition that division by zero yields infinity (*khahara*)

## Vault Connections

- [[mathematics-zero-india]] — the concept node; Brahmagupta is its founder
- [[mathematics-sulba-sutras]] — predecessor Indian mathematical tradition
- [[mathematics-house-of-wisdom]] — transmission destination; BSS among the first Indian texts translated into Arabic
- [[al-khwarizmi]] — direct heir through Arabic translation
- [[fibonacci]] — European transmitter, 574 years downstream
- [[mathematics-chinese-nine-chapters]] — parallel independent negative-number discovery
- [[tradition-vedic-hinduism]] — parent tradition

## References

- Brahmagupta. *Brahmasphutasiddhanta* (628 CE). Trans. H.T. Colebrooke, 1817. Tier 1. Primary source.
- Plofker, Kim. *Mathematics in India*. Princeton UP, 2009. Tier 1. Standard modern scholarly history.
- Datta, B. and Singh, A.N. *History of Hindu Mathematics*, 2 vols. Lahore, 1935–38. Tier 1. Classic analysis.
- Ifrah, Georges. *The Universal History of Numbers*. Wiley, 2000. Tier 2. Transmission history.
