# 30_astrology — the sky as a system of meaning

**Type:** `astrology`. Promoted 2026-08-08; rationale in
`00_meta/ONTOLOGY-RATIONALE-2026-08-08.md`, which supersedes one clause
of the 2026-05-18 doc. Read that before proposing any change here.

## What lives here

Astrology-**proper** — the apparatus itself:

- the zodiac and its signs · decans · lunar mansions (nakshatras, manzils)
- houses/places · aspects · planetary rulerships and dignities
- techniques: natal, horary, electional, mundane, katarchic
- tradition-specific systems **as systems**: Hellenistic horoscopy,
  Jyotiṣa, Chinese and Mesoamerican astral systems

## What does NOT live here — membership is singular

| Thing | Lens | Why |
|---|---|---|
| Astrologers (Ptolemy, Abū Maʿshar, Alan Leo) | `04_persons/` | A person is a person. Their astrology is a WIRE, not their home. |
| Astrological texts (*Tetrabiblos*, *Yavanajātaka*) | `02_documents/` | A text is a document. |
| Observational/predictive astronomy | `19_astronomy/` | The 2026-05-18 §2.3 boundary, unchanged. |
| A chart consulted to answer a question | `25_divination/` | See below. |

### ⚠️ The divination boundary — the fuzzy one

`25_divination/` holds a sign-system **consulted for an answer**.
`30_astrology/` holds the astrological **apparatus itself**.

Horary astrology — a question asked, a chart cast to answer it — is a
divinatory *use*, so it stays a `divination-system` node and WIRES to the
astrology nodes it employs. The test: *"is this a way of asking a
question, or a piece of the sky-model?"*

## Migration worklist — NOT yet moved, deliberately

These ~14 astrology-proper nodes still sit in other lenses. Moving a node
means repointing every wikilink to it, which is a separate gated batch,
not a side-effect of creating this folder:

`zodiac*` (4) · `tonalpohualli*` (3) · `jyotisha*` (2) · `decan*` ·
`horoscope*` · `horary*` · `nakshatra*` · `astrological-*`

Locate them with:

```
ls [0-9][0-9]_*/*zodiac* [0-9][0-9]_*/*decan* [0-9][0-9]_*/*jyotisha*
```

## House rules that bite here

- **WIRING LAW** — every `[[wikilink]]` resolves to a real node **file
  stem**, not a YAML `id:`. They differ on some nodes.
- **An aliased wikilink `[[slug|Alias]]` must never sit inside a markdown
  table cell** — the linkchecker mis-parses it and the link dies silently.
- **CODEX tiering is load-bearing in this lens.** Astrology's *history* is
  T1 scholarship (Neugebauer, Pingree, Rochberg). Astrology's *predictive
  claims* are not. Report at tier; do not blur the two, and do not
  editorialise in either direction.
