# 25 — Divination & Oracular Systems

**Lens slot 25** of the 26-lens ontology. New 2026-05-18. Holds nodes of type `divination-system`.

## What lives here

Sign-systems consulted to read what is hidden — present state, future, hidden order, the will of powers, the moral character of a person or moment.

**Examples:**
- **Binary / permutation systems:** Yi Jing (I Ching) hexagrams, Ifá Odù (256-permutation Yoruba system, parallel to Yi Jing — a MASSIVE-WIN), Tarot (specifically the divinatory deck systems; the symbolism of the trumps is in `09_symbols/` cross-linked).
- **Astrological divination systems:** Hellenistic horary, Hellenistic natal, Vedic Jyotisha (insofar as predictive-divinatory), Chinese Bazi (Four Pillars of Destiny), Mesoamerican Tonalpohualli + Tzolkin (when used divinatorily), Mayan day-sign divination, Tibetan astrology.
- **Geomantic / pattern-drawing:** raml (Islamic / Arabic geomancy), African sand-divination (`fa` in Fon-Yoruba complex), European geomancy (Cornelius Agrippa lineage), feng shui (insofar as divinatory).
- **Reading bodily / animal signs:** augury (Roman / Etruscan — bird-flight reading), haruspicy (Etruscan / Roman — liver reading), scapulimancy (Chinese oracle bones — Shang dynasty + Inuit + Korean / Mongolian), extispicy (Mesopotamian — entrails), palmistry (chiromancy).
- **Reading natural / cast objects:** runes (Norse), bones-and-shells throwing (sangoma — Southern African), cowrie shells (Yoruba and Afro-diasporic), throwing-bones (Tibetan *mo*, Mongolian), I Ching yarrow-stalk vs. coin methods, lithomancy.
- **Dream / vision systems:** oneiromancy (Greco-Roman / Mesopotamian / Islamic / Hindu), Asklepian incubation (when read divinatorily), vision-quest traditions.
- **Text-based / scriptural divination:** stichomancy / bibliomancy (random scripture passage), the Erbieh of Sufi practice, Sortes Sanctorum (Christian), I Ching as text consultation.
- **Statistical / mathematical:** specifically the *systems' formal structure* — Ifá's 4-bit-x-4 binary, Yi Jing's 6-bit binary (64 hexagrams from 8 trigrams), Tarot's 22 + 56, Tzolkin's 13 × 20.

## Why separate from Rituals

- **Ritual (`14_rituals/`)** = a *performative act* done for religious purpose (sacrifice, prayer, festival, initiation).
- **Divination (`25_divination/`)** = a *consultation* of a sign-system to read what's hidden.

The structural logic is different: ritual = participation / transformation. Divination = information extraction. They can overlap — a divinatory consultation may be ritually framed (Yoruba *babalawo* throws cowries within a ritual-prepared space) — but the *system being consulted* is the node here; the *ritual frame* is in `14_rituals/`.

## Why important enough for its own lens

- **Yi Jing ↔ Ifá** is one of the headline MASSIVE-WINs (per ONTOLOGY §4-B): 4,000-year-old binary-permutation systems on opposite sides of the Atlantic, almost certainly independent. Today it has no proper home.
- Divination systems are **structurally comparable** in ways that beg cross-lens analysis (binary vs ternary vs fourfold vs continuous; deterministic vs probabilistic; expert vs lay; mediumic vs textual).
- Cross-cuts symbols (Tarot trumps), mathematics (Yi Jing binary), traditions, music (some Yoruba divination uses sung verses), psychology (Jung on Yi Jing as synchronicity).
- Academic literature: David Zeitlyn (*Divinatory Logics*), William Sax, Stephan Palmié (*The Cooking of History* on Ifá), Richard Smith (*Fortune-tellers and Philosophers* on Chinese), John Skorupski.

## YAML skeleton (provisional)

```yaml
id: yi-jing-divination
title: Yi Jing (I Ching) Divination System
type: divination-system
category: binary-permutation-system   # binary-permutation-system | astrological-divination | geomantic | bone-reading | oracle-bone | throwing-cast | bibliomancy | dream-divination | medium-channeling | bodily-omen-reading | natural-omen-reading
tradition: chinese-religion
parallel-system: ifa-odu-divination
parallel-system-relation: structural-parallel-independent-emergence
formal-structure: 64-hexagrams-from-8-trigrams-from-3-bit-binary
methods: [yi-jing-yarrow-stalk-method, yi-jing-coin-method, yi-jing-rice-grain-method]
key-documents: [yi-jing, shi-yi-ten-wings, wilhelm-translation, legge-translation]
key-figures: [fuxi-mythic, king-wen-mythic, duke-of-zhou, confucius]
date-attested-earliest: -1100
themes: [universal-binary-divination, divinatory-calendar]
related-mathematics: [leibniz-binary-yi-jing-correspondence]
refs:
  - title: "..."
    tier: 1
status: metadata
```

## Slug convention

`yi-jing-divination` (vs. `yi-jing` for the text), `ifa-odu-divination`, `tarot-divination-system`, `geomancy-raml-islamic`, `haruspicy-etruscan-roman`, `scapulimancy-shang-oracle-bones`, `runes-divination-norse`, `mo-divination-tibetan`, `oneiromancy-greek`, `palmistry-chiromancy`.

When the divination system shares a name with its underlying text (Yi Jing), suffix `-divination` to distinguish from the document node: `yi-jing` (in `02_documents/`) + `yi-jing-divination` (here). Cross-edged.
