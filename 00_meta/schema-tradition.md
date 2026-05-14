# Schema — Tradition Node

Overview node per tradition. Acts as a hub gathering its documents, deities, persons, and events.

## YAML frontmatter

```yaml
---
type: tradition
id: ""                              # e.g., "sumerian-mesopotamian", "zoroastrianism", "gnostic-christianity"
name: ""
parent-tradition: ""                # if a sub-branch
date-emergence:                     # integer BCE negative
date-end:                           # "" if still extant
region-origin: ""
regions-spread: []
key-deities: []                     # links to 03_deities/
key-persons: []                     # links to 04_persons/
key-documents: []                   # links to 02_documents/
sister-traditions: []               # links to other 07_traditions/ — parallel, not parent-child
status: "stub"
refs: []
tags: []
---
```

## Body

```markdown
# [Tradition Name]

## Overview
What is this tradition, when and where did it emerge, what are its defining features?

## Historical phases
1. ...
2. ...

## Core texts
- [[document-1]] — what it is, when
- [[document-2]]

## Pantheon (or key figures, for monotheistic/non-theistic traditions)
- [[deity-1]] — role
- [[deity-2]]

## Defining doctrines
- ...

## Relations to neighbors
- vs. [[other-tradition]]: shared milieu, contested points, mutual influence.

## Refs
1. ...
```
