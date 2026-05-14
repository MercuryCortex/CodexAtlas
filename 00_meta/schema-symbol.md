# Schema — Symbol Node

Every file in `09_symbols/`.

Symbols are meaningful iconographic units — geometric, theriomorphic, phytomorphic, anthropomorphic, astral, cosmological, or mystery (undeciphered) — that recur across cultures and carry interpretive weight. They live in the graph alongside deities, documents, persons, events, themes, and traditions; the **cross-symbol edges** are the point of the layer.

The schema mirrors `schema-deity.md` and `schema-theme.md` deliberately so the existing build pipeline picks symbols up with minimal special-casing.

## YAML frontmatter

```yaml
---
type: symbol
id: ""                              # symbol-slug, e.g., "ankh", "latin-cross", "swastika"
name: ""                            # primary display name
aka: []                             # transliterations, alternate / esoteric names ("Crux ansata", "Key of Life")

# Visual taxonomy — the SHAPE in shapeFor() keys off this.
category: ""                        # geometric | theriomorphic | phytomorphic | anthropomorphic | astral | cosmological | mystery

# Origin tradition(s) — used for clustering in Pantheon Symbols mode (families[0] = primary).
# These should match the tradition-family vocabulary in build_data.py's tradition_family()
# (Egyptian, Christian, Mesopotamian, Hindu/Vedic, Buddhist, ...). MULTIPLE families is
# normal and IS the point — a symbol attested in three families holds three.
families: []                        # e.g., ["Egyptian"], ["Hindu", "Buddhist", "Norse"]

period-earliest:                    # integer (BCE negative). First documented attestation.
period-latest:                      # integer. Last attested in primary tradition; use 2026 for "present".
region: ""                          # geographic centre of gravity

# Variants — sub-forms within the same symbol-family. By default these are body sub-sections.
# Promote a variant to its own NODE only when the variant acquired a distinct tradition of its
# own (e.g., the Coptic cross developed enough independent reception to be its own node).
variants:
  - id: ""                          # short identifier
    description: ""
    became-symbol: ""               # OPTIONAL — if the variant migrated to its own node, point to it

# Appearances — wikilinks to existing nodes. These produce edges via build_data.py.
# Do NOT fabricate links; only reference nodes that exist.
appearances: []                     # documents (02_documents/) where this symbol attests
deity-instances: []                 # deities (03_deities/) iconographically associated
tradition-context: []               # traditions (07_traditions/) carrying this symbol

# Iconographic depictions — image refs (local path or Wikimedia URL). Optional.
# Phase A renders names + shapes; depictions get used in the Phase B dedicated view.
depictions:
  - src: ""                         # "_assets/symbols/<slug>/foo.jpg" or "https://upload.wikimedia.org/..."
    caption: ""
    source: ""                      # e.g., "Wikimedia Commons", "British Museum EA-12345"
    license: ""                     # "CC-BY-SA 4.0", "Public Domain", "Fair Use — scholarly"

# Cross-symbol edges — the load-bearing layer. Each entry has a TYPE that controls
# directionality and methodological weight. See methodology.md "Cross-symbol edge types".
#
# Discipline rule: NO `ancestor-of` edge without a Tier-1 source documenting historical
# transmission. The default for resemblance-without-evidence is `parallel-form`.
cross-symbol-edges:
  - target: ""                      # symbol-slug
    type: ""                        # ancestor-of | parallel-form | syncretic-fusion | appropriated-by | polemic-inversion | visual-cognate
    notes: ""                       # one sentence explaining what's claimed and the period
    refs: []                        # list of ref-ids or short citations backing this edge

# Mystery flag — for contested or undeciphered symbols.
mystery-status: "documented"        # documented | partially-deciphered | contested | mystery

status: "stub"                      # stub | metadata | full
refs:
  - title: ""
    author: ""
    year: 0
    publisher: ""
    url: ""
    type: ""                        # monograph | journal-article | critical-edition | encyclopedia | controversial | ...
    tier: 0                         # 1 | 2 | 3 | 4
tags: []                            # include the category, the families, any specific tradition tags
---
```

## Body sections

```markdown
# [Symbol Name]

## Identity
One paragraph. What this symbol IS — its glyph form, its semiotic structure (life-sign | hieroglyph | logograph | cosmographic-diagram | apotropaic-mark).

## Earliest attestation
- First documentary appearance: (link to a `02_documents/` node here), date.
- Iconographic earliest: object / site / inscription if relevant (museum number, archaeological context).

## Meaning(s) attested
Documented interpretations IN THE PRIMARY TRADITION (e.g., for the ankh — Egyptian
texts on what the ankh *means*, not modern Theosophical readings). Bullet list with sources.

## Variants
Sub-forms with explicit body sections. Promote a variant to its own node only when it
acquired an independent tradition.

## Cross-family appearance
Where this symbol shows up OUTSIDE its origin tradition. **Cite the documented
transmission OR explicitly note "no documented transmission — visual cognate only".**

## Contested interpretations
Where scholars disagree (origin, meaning, transmission claim).

## Mystery / unknown variants
For symbols with undeciphered or contested reading — what's known about attestation,
what's NOT known about meaning.

## Cross-symbol edges (provisional)
Bullet form of the structured `cross-symbol-edges` YAML, with the prose justification.

## Refs
Tier-1 sources first. **Minimum 3 Tier-1 refs per symbol node** before status: `metadata`.
For symbols with a polemic-inversion edge (notably swastika), 4 refs minimum — the two
appropriation-handling sources are mandatory.
```

## Splitting rule

When a symbol migrates across traditions and the receiving tradition transforms it
significantly enough to warrant independent treatment, **create a separate node** linked
by an `ancestor-of` edge (with Tier-1 source for the transmission claim). Examples:

- `ankh` → `coptic-cross` (the Coptic appropriation acquired its own iconographic
  tradition documented in Coptic textile + manuscript record c. 200–400 CE).
- `latin-cross` ↔ `greek-cross` (equal-arms vs. long-shaft variants developed
  region-specific iconographic traditions and are now distinct).

When the variant did NOT acquire an independent tradition, keep it as a body sub-section
of the parent symbol node.

## Example (minimal)

```yaml
---
type: symbol
id: "ankh"
name: "Ankh"
aka: ["Crux ansata", "Key of Life", "Egyptian cross"]
category: "geometric"
families: ["Egyptian"]
period-earliest: -3000
period-latest: 800
region: "Nile Valley"
variants:
  - id: "ankh-djed-was"
    description: "Compound with djed-pillar and was-sceptre — the 'life-stability-power' triad."
  - id: "ankh-coptic"
    description: "Coptic Christian appropriation; became its own node."
    became-symbol: "coptic-cross"
appearances:
  - "[[phase-1-002-pyramid-texts]]"
  - "[[phase-1-009-coffin-texts]]"
  - "[[phase-1-010-book-of-the-dead]]"
deity-instances:
  - "[[isis]]"
  - "[[osiris]]"
  - "[[ra]]"
  - "[[aten]]"
tradition-context:
  - "[[tradition-egyptian]]"
cross-symbol-edges:
  - target: "coptic-cross"
    type: "ancestor-of"
    notes: "Coptic Christians adopted the ankh as cross-variant on textiles + manuscripts c. 200–400 CE."
    refs: ["Bagnall 1993", "Frankfurter 1998"]
  - target: "tau-cross"
    type: "parallel-form"
    notes: "Pre-Christian τ + Egyptian sandal-strap glyph hypothesis — visual cognate, transmission disputed."
    refs: ["Gardiner 1957"]
mystery-status: "documented"
status: "metadata"
refs:
  - title: "Egyptian Grammar (3rd ed.)"
    author: "Alan H. Gardiner"
    year: 1957
    publisher: "Griffith Institute, Oxford"
    type: "critical-edition"
    tier: 1
tags: [symbol, egyptian, geometric, life, eternity]
---
```
