# Schema — Deity Node

Every file in `03_deities/`.

## YAML frontmatter

```yaml
---
type: deity
id: ""                              # deity-slug, e.g., "el-canaanite"
name: ""                            # primary name
aka: []                             # transliterations, epithets, alternate names
tradition: ""                       # primary cultural context
region: ""                          # geographic
period-active-earliest:             # integer (BCE negative)
period-active-latest:
domains: []                         # e.g., ["storm", "kingship", "creator"]
gender: ""                          # masculine | feminine | androgynous | non-gendered | varies
role: ""                            # creator | high-god | warrior | underworld | trickster | demiurge | psychopomp | savior | etc.
parent-of: []                       # other deities (links)
child-of: []
consort: []
attributes: []                      # iconographic — bull, double-axe, ankh, halo, etc.
attested-in: []                     # documents (links to 02_documents/)
equivalents: []                     # cross-tradition syncretic identifications, with edge note
syncretic-edges:                    # structured form of equivalents
  - target: ""
    type: ""                        # ancient-identification | scholarly-parallel | folk-syncretism
    source: ""                      # ref ID
status: "stub"                      # stub | metadata | full
refs:
  - title: ""
    author: ""
    url: ""
    type: ""
    tier:
tags: []
---
```

## Body sections

```markdown
# [Deity Name]

## Identity
One paragraph: who this deity is in its primary tradition, key epithets, principal domain(s).

## Earliest attestation
- First documentary appearance: (link to a `02_documents/` node here), date.
- Iconographic attestations (statues, reliefs, seals) if relevant.

## Mythological role
Brief — major myths, cosmological role, ritual context.

## Cross-tradition identifications
- **[[other-deity]]** — *ancient-identification* (e.g., Plutarch identifies X with Y) / *scholarly-parallel* (modern comparative claim) / *folk-syncretism* (popular conflation). Cite each.

## Iconography
Visual attributes — what does this god look like in art? What objects accompany them?

## Disputes
Where scholarly views differ on origin, identity, or syncretism.

## Refs
1. ...
```

## Splitting rule
When a deity migrates across traditions and the tradition transforms them significantly, **create separate nodes** linked by `syncretic-edges`. Examples:
- `el-canaanite.md` ↔ `el-elohim-hebrew.md`
- `inanna-sumerian.md` ↔ `ishtar-akkadian.md` ↔ `astarte-canaanite.md` ↔ `aphrodite-greek.md`
- `thoth-egyptian.md` ↔ `hermes-greek.md` ↔ `hermes-trismegistus-hermetic.md`

Each node carries the evidence specific to that cultural context. The edges carry the syncretism claim with sources.
