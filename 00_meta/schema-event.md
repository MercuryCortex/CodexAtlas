# Schema — Event Node

Historical events that shape religious development: conquests, exiles, councils, persecutions, discoveries.

## YAML frontmatter

```yaml
---
type: event
id: ""                              # e.g., "babylonian-exile", "council-of-nicaea-325", "nag-hammadi-discovery-1945"
name: ""
date-start:                         # integer (BCE negative)
date-end:
duration-years:
region: ""
event-type: ""                      # conquest | exile | council | persecution | discovery | reformation | schism | founding | destruction
participants: []                    # links to 04_persons/
traditions-affected: []             # links to 07_traditions/
documents-produced: []              # links to 02_documents/ — texts that came out of this event
documents-affected: []              # texts that were edited / canonized / banned because of this
status: "stub"
refs: []
tags: []
---
```

## Body

```markdown
# [Event Name]

## What happened
One paragraph factual summary.

## Religious consequences
How did this event reshape what people believed, what was written, what was preserved or destroyed?

## Documents in play
- Texts produced *because* of this event.
- Texts edited / canonized / banned *because* of this event.

## Disputes
Dating, scope, or interpretive debates.

## Refs
1. ...
```

## Examples of expected event nodes

- **Babylonian Exile** (586–538 BCE) — pivots Hebrew religion; Persian/Zoroastrian contact begins; redactions of Torah.
- **Alexander's conquests** (334–323 BCE) — Hellenization spreads across Near East; Septuagint follows.
- **Maccabean Revolt** (167–160 BCE) — generates 1–2 Maccabees, sharpens Jewish apocalyptic.
- **Destruction of the Second Temple** (70 CE) — forces rabbinic Judaism; reshapes early Christianity.
- **Council of Nicaea** (325 CE) — defines Christological orthodoxy; positions "heresies."
- **Council of Chalcedon** (451 CE) — schisms Oriental Orthodox churches.
- **Nag Hammadi discovery** (1945) — Gnostic library resurfaces.
- **Dead Sea Scrolls discovery** (1947–1956) — Qumran library resurfaces.
- **Ugaritic discovery** (1928) — Ras Shamra tablets reveal Canaanite religion.
- **Edict of Thessalonica** (380 CE) — Christianity becomes Roman state religion.
- **Closure of Plato's Academy** (529 CE) — symbolic end of pagan philosophical tradition.
