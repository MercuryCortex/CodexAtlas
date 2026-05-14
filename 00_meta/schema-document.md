# Schema — Document Node

Every file in `02_documents/_phase-*/` must use this template.

## YAML frontmatter

```yaml
---
type: document
id: ""                              # phase-NNN-slug, e.g., P1-001-kesh-temple-hymn
title: ""
aka: []                             # alternative titles / transliterations
tradition: ""                       # e.g., "Sumerian / Mesopotamian", "Vedic Hindu", "Christian"
sub-tradition: ""                   # e.g., "Sethian Gnostic", "Theravada"
label: ""                           # see 00_meta/label-taxonomy.md
date-composed-earliest:             # integer, negative for BCE (e.g., -1500)
date-composed-latest:               # integer
date-redacted:                      # if oral-then-written
date-physical-mss-earliest:         # oldest surviving manuscript
language: []                        # e.g., ["Sumerian", "Akkadian"]
script: ""                          # e.g., "Cuneiform", "Greek uncial"
region: ""                          # broad region
city-of-origin: ""                  # specific where known
authorship: ""                      # known | attributed | anonymous | redacted | school | revealed
key-figures: []                     # named authors, redactors, addressees (link to 04_persons/)
themes: []                          # link to 06_themes/
parallels: []                       # link to other documents
influenced-by: []                   # provisional; flag uncertain with "?" suffix in title
influences: []                      # provisional
deities-mentioned: []               # link to 03_deities/
events-context: []                  # link to 05_events/
status: "stub"                      # stub | metadata | partial | full-text
preservation: ""                    # how the text survives (cuneiform tablets / papyri / medieval mss / etc.)
refs:
  - title: ""
    author: ""
    year:
    publisher: ""
    url: ""
    type: ""                        # see 00_meta/source-integrity.md
    tier:                           # 1 | 2 | 3 | 4
    notes: ""
tags: []                            # e.g., [phase-1, mesopotamian, flood-motif]
---
```

## Body sections (required)

```markdown
# [Title]

## What it is
One paragraph. Factual. What is the document, in what form does it survive, what is its scope?

## Context
- **Political milieu.** Who was in power, what empire / city-state / dynasty.
- **Religious milieu.** What other traditions were nearby, what was being contested.
- **Who was behind it.** Scribes? A school? A specific prophet? A council? Anonymous?
- **Discovery / transmission.** How did we get this text — continuous tradition, archaeological find, medieval manuscript chain?

## Themes and motifs
Bullet list with wikilinks to theme nodes. One sentence each on how the theme appears here.

## Connections (provisional)
- → [[other-document]] — *parallel-motif* / *direct-quote* / *redaction-of* / *polemic-against* / *shared-milieu* / *syncretic-identification* / *manuscript-transmission* / *commentary-on*: one-sentence reasoning + ref.

## Disputes
Where dates, authorship, or interpretation are contested, list the positions with refs. Omit section if no live dispute.

## Refs
1. Author, *Title*, Publisher (year). [URL]. — short note on what it provides.
2. ...
```

## Quality bar for promotion `stub → metadata`
- All required YAML fields populated (or explicitly marked `unknown`)
- At least one Tier 1 ref + one Tier 2 ref
- Themes link to at least 2 theme notes (creating them if needed)
- At least 2 outgoing connections to other documents (provisional fine)
- Body sections "What it is" and "Context" written
