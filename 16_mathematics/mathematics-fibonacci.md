---
id: mathematics-fibonacci
type: mathematics
title: "Fibonacci sequence (mātrāmeru / Liber Abaci)"
math-type: integer-sequence-with-sacred-loading
tradition: tradition-vedic
also-in-traditions:
  - tradition-jainism
  - tradition-renaissance-hermeticism
date_earliest: -200
date_latest: 2026
date-earliest: -200
dating-basis: B5
dating-basis-source: "Plofker, K. 2009 *Mathematics in India*; Singh, P. 1985 *Historia Mathematica* 12: 229-244"
dating-basis-notes: "The sequence is first explicitly described by the Indian prosodist Piṅgala (Chandas-śāstra, c. -200) in the context of Sanskrit-meter mathematics; it is treated as a known result by Virahāṅka (c. 600-800 CE), Gopāla (c. 1135), and Hemacandra (1150). Fibonacci's *Liber Abaci* (1202) gives the European introduction; his rabbit-population example is the Western canonical context."
tags: [mathematics, fibonacci, matra-meru, golden-ratio, vedic-prosody, jaina-mathematics, sanskrit-meter]
refs:
  - title: "Mathematics in India"
    author: "Plofker, Kim"
    year: 2009
    publisher: "Princeton University Press"
    type: "monograph"
    tier: 1
  - title: "The So-called Fibonacci Numbers in Ancient and Medieval India"
    author: "Singh, Parmanand"
    year: 1985
    publisher: "Historia Mathematica 12(3): 229-244"
    type: "journal-article"
    tier: 1
    notes: "Definitive demonstration that the sequence and its construction-rule were known in India a millennium before Fibonacci."
---

# Fibonacci sequence (mātrāmeru)

The integer sequence in which each term after the first two is the sum of the two preceding: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, .... Internationally known by Fibonacci's name from his use of it in *Liber Abaci* (1202) to describe an idealized rabbit-population growth pattern; the sequence and its construction-rule were known in Sanskrit and Prakrit mathematical traditions a millennium earlier as *mātrāmeru* — the "meter-mountain".

## The prosodic origin

The Indian mathematical context is Sanskrit prosodic combinatorics: enumerating the number of distinct meters of a given duration. In Sanskrit prosody, syllables are either *laghu* (light, one mora) or *guru* (heavy, two morae). The question "how many distinct sequences of L and G syllables produce a meter of *n* morae" generates the Fibonacci sequence directly:

- 1 mora: just L (1 way).
- 2 morae: LL or G (2 ways).
- 3 morae: LLL, LG, GL (3 ways).
- 4 morae: LLLL, LLG, LGL, GLL, GG (5 ways).
- 5 morae: 8 ways.
- ...

Each (*n*)-mora sequence is either (a) an (*n*-1)-mora sequence followed by L, or (b) an (*n*-2)-mora sequence followed by G — which yields exactly the Fibonacci recurrence *F*(*n*) = *F*(*n*-1) + *F*(*n*-2).

Piṅgala's *Chandas-śāstra* (c. -200) gives this directly. Virahāṅka (c. 600-800) generalizes; Hemacandra (1150) is explicit and is c. 50 years before Fibonacci.

## Fibonacci's Liber Abaci

Leonardo of Pisa learned mathematics in North Africa as a young merchant and traveled across the Mediterranean studying the Arabic mathematical tradition. The *Liber Abaci* (1202) introduces the [[mathematics-zero-india|Indian-Arabic decimal numerals]] to European audiences and uses the Fibonacci sequence to model an idealized rabbit-population growth scenario. Fibonacci almost certainly received the sequence from Arabic sources who had it from Indian sources; the chain of transmission is plausible though not directly documented in the case of this specific result.

## The Fibonacci-φ connection

The ratio of successive Fibonacci numbers converges to the [[mathematics-golden-ratio|golden ratio]]: lim *F*(*n*+1) / *F*(*n*) = φ. This connection has fueled extensive popular-mathematics literature on Fibonacci numbers in nature (phyllotaxis, nautilus shells, etc.). The biological cases are real but often over-claimed; the mathematical convergence is rigorous.

## Cross-tradition connections

- **[[mathematics-golden-ratio]]**: the limit-ratio connection.
- **[[mathematics-zero-india]]**: the parallel and slightly later Indian → Arabic → European transmission.
- **[[mathematics-vedic-altar-geometry]]**: parallel pre-modern Indian mathematics.

## Refs

- Plofker, K. 2009. *Mathematics in India*. Princeton.
- Singh, P. 1985. *Historia Mathematica* 12.
