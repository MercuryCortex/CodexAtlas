# Schema — Person Node

For prophets, scribes, kings, philosophers, redactors, Church Fathers, heresiarchs, translators, founders.

## YAML frontmatter

```yaml
---
type: person
id: ""                              # e.g., "zarathustra", "valentinus", "constantine-i"
name: ""
aka: []
role: ""                            # prophet | scribe | king | philosopher | priest | redactor | heresiarch | translator | reformer | mystic | founder | scholar
tradition: ""
region: ""
date-born:                          # integer (BCE negative)
date-died:
floruit-earliest:                   # if dates uncertain, period of activity
floruit-latest:
historicity: ""                     # documented | likely-historical | legendary | mythologized | disputed
texts-authored: []                  # works we can defend as authentically by this person (links to 02_documents/)
texts-attributed-to: []             # works traditionally attributed but disputed or pseudonymous — Moses→Pentateuch, Solomon→Ecclesiastes, deutero-Paulines
originator-of: []                   # concepts/themes/motifs this person is credited with introducing (links to 06_themes/) — Plato→demiurge, Plotinus→the-one
events-participated: []             # links to 05_events/
mentioned-in: []                    # documents that reference this person
status: "stub"
refs: []
tags: []
---
```

## Authorship vs. attribution vs. origination

Three distinct claims, three distinct fields. Keep them separate — the *whole point* of the Authors view is that mixing them up destroys the investigation.

- **`texts-authored`** — works the consensus of critical scholarship treats as *actually by this person*. Blavatsky → *Isis Unveiled*; Plato → *Timaeus*; Paul → Romans / 1 Corinthians / Galatians / Philippians / 1 Thessalonians / Philemon / 2 Corinthians (the seven undisputed letters).
- **`texts-attributed-to`** — works traditionally credited to this person whose actual authorship is disputed, pseudonymous, or composite. Moses → Pentateuch (composite, JEDP); Solomon → Ecclesiastes / Song of Songs / Wisdom (pseudonymous attribution); Paul → Ephesians / Colossians / 2 Thessalonians / pastorals (deutero-Pauline); Hermes Trismegistus → *Corpus Hermeticum* (pseudepigraphic).
- **`originator-of`** — concepts, themes, or motifs this person is credited with introducing to the historical discourse. Examples (refer to the listed nodes when used in real frontmatter): Plato → demiurge; Plotinus → the-one; Zoroaster → cosmic-dualism; Mani → two-principles; Marcion → anti-cosmic-canon-rejection; Augustine → original-sin; Anselm → satisfaction-atonement; Blavatsky → root-races; Jung → archetypes.

When the attribution is contested or the origination is one of several competing claims, note it in the body's **Disputes** section rather than removing the link.

## Body

```markdown
# [Name]

## Identity
One paragraph: who, when, where, what they did.

## Historical evidence
What sources attest this person? How reliable? Is there extra-textual evidence (inscriptions, contemporary mentions)?

## Works
- Texts genuinely authored.
- Texts attributed but disputed (with the dispute).

## Role in the tradition
How later tradition framed them. Were they elevated, demonized, forgotten?

## Disputes
Historicity debates, dating debates, authorship debates.

## Refs
1. ...
```
