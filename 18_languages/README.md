# 18 — Languages & Linguistic Families

**Lens slot 18** of the 26-lens ontology. New 2026-05-18. Holds nodes of type `language`.

## What lives here

Linguistic systems — language families, specific languages, comparative linguistic findings.

**Examples:** Indo-European (family), Afroasiatic (family), Sino-Tibetan (family), Niger-Congo (family), Austronesian (family), Uralic (family), language isolates (Basque, Sumerian, Elamite). Specific languages: Sanskrit, Akkadian, Sumerian, Koine Greek, Classical Arabic, Ge'ez, Pali, Old Avestan, Avestan, Aramaic, Coptic, Latin, Hebrew (Biblical / Mishnaic / Modern), Quranic Arabic, Sanskrit (Vedic / Classical), Tamil (Old / Middle / Modern), Chinese (Old / Middle / Modern), Tibetan (Old / Classical / Modern). Comparative findings: the *deva/daēva* inversion (Vedic/Avestan), Grimm's Law (Indo-European consonant shift), Verner's Law, the substrate hypothesis for Pre-Greek vocabulary.

## What does NOT live here

- **Alphabets / scripts** → `11_alphabets/`. Critical distinction: a *language* is a linguistic system; an *alphabet* is the visual script used to encode one or more languages. Devanagari writes Sanskrit + Hindi + Marathi. Arabic script writes Arabic + Persian + Urdu + Ottoman Turkish. Hebrew alphabet writes Hebrew + Yiddish.
- **Specific texts in a language** → `02_documents/`. The Rigveda is a document IN Vedic Sanskrit; the language itself is the node here.

## Why a separate lens

Transmissions follow linguistic boundaries. Sanskrit-knowing scholars carried Vedic ideas into Greek-knowing Mediterranean. Arabic-knowing translators (Hunayn ibn Ishaq, Toledo translators) carried Greek philosophy into Latin Europe. The *language itself* is a transmission medium — currently invisible in the graph.

Standard comparative-linguistics taxonomy: Bernard Comrie's *The World's Major Languages*, Ethnologue, Glottolog, SIL classification.

## YAML skeleton (provisional)

```yaml
id: sanskrit-vedic
title: Vedic Sanskrit
type: language
category: language     # language | language-family | linguistic-finding
family: indo-european-family
parent-language: proto-indo-iranian
descendant-languages: [sanskrit-classical, pali, prakrit-languages]
scripts-used: [brahmi, devanagari]
date-attested-earliest: -1500
date-attested-latest: -500
liturgical-tradition: vedic-religion
texts-in-language: [rigveda, samaveda, yajurveda, atharvaveda, brahmanas, aranyakas, upanishads-early]
refs:
  - title: "..."
    tier: 1
status: metadata
```

## Slug convention

`sanskrit-vedic`, `sanskrit-classical`, `koine-greek`, `classical-arabic`, `geez`, `indo-european-family`, `afroasiatic-family`, `proto-indo-iranian`, `pali`, `latin-classical`, `latin-medieval`.

When a language has multiple distinct historical layers, suffix with the period: `hebrew-biblical` / `hebrew-mishnaic` / `hebrew-modern`.
