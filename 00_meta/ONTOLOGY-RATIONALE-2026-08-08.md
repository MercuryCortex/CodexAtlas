# ONTOLOGY RATIONALE — 2026-08-08 · `30_astrology/` PROMOTED

> **Supersedes exactly one clause** of `ONTOLOGY-RATIONALE-2026-05-18.md`
> §2.3 — the sentence deferring the astrology folder. Everything else in
> that document stands unchanged. Written as a NEW dated doc rather than
> an edit, per the append-only rule.

## 1. This is not a new decision — it is the trigger the old one named

The 2026-05-18 rationale did not reject an astrology lens. It **deferred**
it, with the promotion condition written into the text:

> *"Where astrology lives: for now, as cross-cutting tags + the existing
> Astrology UI tab. … **If astrology accumulates enough volume to warrant
> its own folder later, promote it then. Don't pre-create the folder.**"*

and recorded John's own direction from that session:

> *"astronomy should be astronomy, astrology should be astrology (even
> that then we place them under the same tab later)."*

John, 2026-08-08: *"astrology should be a lens... i believe."* That is
the same call, and the promotion condition is what this doc evaluates.

## 2. The volume test, answered honestly

**As of the moment of writing, the bar was NOT yet met — and that is
stated plainly rather than dressed up.**

Nodes whose *subject* is astrology-proper: **~14** (4 zodiac, 3
tonalpohualli, 2 jyotisha, decan, horoscope, horary, nakshatra,
astrological-technique). Against the smallest existing lenses:

| lens | nodes |
|---|---:|
| `16_mathematics/` | 22 |
| `24_pharmacology/` | 30 |
| `17_medicine/` | 31 |
| `12_alchemy/` | 36 |
| `19_astronomy/` | 44 |
| **astrology-proper, before this batch** | **~14** |

The ~84 nodes carrying an `astrology` tag are overwhelmingly **persons
and documents that correctly live in their own lenses** — Ptolemy is a
person, the *Tetrabiblos* is a document. Counting those toward the lens
would have been the exact conflation §2.3 forbids.

**So the lens is promoted TOGETHER WITH the batch that populates it**, not
in advance of it. The 2026-08-08 astrology/astronomy/tarot ingestion pass
writes the zodiac, the houses, the aspects, the decans, the techniques and
the tradition-specific systems — the material that IS this lens. Promoting
an empty folder would have been "pre-creating the folder", which §2.3
explicitly forbids; promoting it as its content lands is the promotion
§2.3 explicitly invites.

**If that batch under-delivers, the honest move is to reverse this** —
merge the folder back and record the reversal in a further dated doc.

## 3. What belongs in `30_astrology/`, and what does not

**Type:** `astrology`. **Bar cleared:** (a) distinct ontological category
that scholarship treats separately — the same Neugebauer / Pingree /
Rochberg literature §2.3 already cites for keeping astronomy distinct.

**IN** — astrology-proper, the system's own furniture:
- the zodiac and its signs; decans; lunar mansions (nakshatras, manzils)
- the houses/places, aspects, planetary rulerships, dignities
- techniques: horary, electional, natal, mundane, katarchic
- tradition-specific systems as *systems*: Hellenistic horoscopy,
  Jyotiṣa, Chinese and Mesoamerican astral systems

**OUT** — membership is singular (`MEMBERSHIP-AND-WIRES.md` is cardinal):
- **astrologers → `04_persons/`.** Ptolemy does not move because he wrote
  the *Tetrabiblos*. He is a person; the astrological work is a WIRE.
- **astrological texts → `02_documents/`.** *Tetrabiblos*,
  *Yavanajātaka*, *Bṛhat Parāśara Horāśāstra* stay documents.
- **observational/predictive astronomy → `19_astronomy/`.** The boundary
  of §2.3 is unchanged and is the whole point of that section.
- **divination as consultation → `25_divination/`.** ⚠️ This boundary is
  the genuinely fuzzy one and needs stating: `25_divination/` holds a
  sign-system *consulted for an answer*; `30_astrology/` holds the
  astrological apparatus *itself*. Horary astrology — a question asked
  and answered from a chart — is a divinatory USE and stays a
  divination-system node, wired to the astrology nodes it employs. When
  in doubt, ask "is this a way of asking a question, or a piece of the
  sky-model?"

## 4. Cost of the promotion, recorded for the next person

- `build_data.py` NODE_DIRS — one entry, `"astrology": ["30_astrology"]`
- `00_meta/ONTOLOGY.md` §lens-table — row 30 added; the §19 astronomy row
  updated so its "for now astrology lives as tags" clause no longer
  contradicts the tree
- `00_meta/HOW-WE-WORK.md` §6 lens table — row added
- `30_astrology/README.md` — the boundary cases, per house convention

**No node migration is required by this promotion.** The ~14 existing
astrology-proper nodes are left where they are for now, deliberately:
moving a node means updating every wikilink to it, and that is a separate
gated batch, not a side-effect of registering a folder. They are listed
in the README as the migration worklist.

Related: [[ONTOLOGY-RATIONALE-2026-05-18]] · [[MEMBERSHIP-AND-WIRES]] ·
[[ONTOLOGY]]
