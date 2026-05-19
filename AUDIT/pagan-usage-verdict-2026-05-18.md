# "Pagan" usage in the vault — verdict, 2026-05-18

**Triggered by:** my own §B5 recommendation in the ontology-audit pass that we should check whether the vault uses "pagan" / "paganism" in pejorative/owned-narrative contexts vs. legitimate scholarly-historical usage. Per John's "1000% we need ethics" framing in the lock conversation.

**Scope of scan:** `grep -rniE 'pagan(ism)?\b'` across `07_traditions/`, `06_themes/`, `02_documents/`, `00_meta/`. ~25 hits inspected.

## Verdict

**Existing usage is academically appropriate. Nothing requires content rewriting in this batch.** "Pagan" appears in the vault almost exclusively in three legitimate scholarly-historical contexts:

### Category 1 — describing historical actors' own categories (✓ appropriate)

- *"Theodosian suppression of public pagan religion (+391/+392)"* (`tradition-roman-religion.md`) — accurate historical description; "pagan" is what the Theodosian legislation called what it suppressed.
- *"Julian the Apostate (Phase 4: last pagan emperor)"* — Julian's own self-identification was complex but later sources (and modern scholarship) consistently call him this.
- *"Symmachus (Phase 4: pagan defender)"* — Symmachus's *Relatio 3* (384 CE) defending the Altar of Victory is THE canonical late-pagan defense; the term is the academic-standard label.
- *"the last pagan polities of Europe"* (`tradition-teutonic-knights.md`) — describing what the Teutonic Order's crusading propaganda called the Prussians, Lithuanians, Estonians; flagging it AS the crusading category, not endorsing it.
- *"event-closure-of-pagan-mysteries-392-393"* — event slug naming the Theodosian closure; correct historical event name.

### Category 2 — modern self-identification (✓ appropriate)

- `tradition-wicca-modern-pagan` — Wicca explicitly self-identifies under the "Modern Pagan / Neopagan" umbrella (Gerald Gardner, *Witchcraft Today* 1954; subsequent Wiccan literature). Using their own term.
- *"tradition-celtic.md vs. tradition-wicca-modern-pagan"* — comparison to modern Druidic / Celtic-Reconstructionist self-identifications.

### Category 3 — citing book titles (✓ appropriate)

- Ronald Hutton, *The Pagan Religions of the Ancient British Isles* (Blackwell 1991) — major scholarly work; citation accuracy requires using its title.
- Anne Ross, *Pagan Celtic Britain* (Routledge 1967) — same.
- Kim McCone, *Pagan Past and Christian Present in Early Irish Literature* (An Sagart 1990) — same.

These are book-title citations. Required by `refs:` integrity.

## One slug worth considering for future review (NOT a blocker)

`tradition-germanic-paganism` (slug + node title "Germanic Paganism")

**Concern:** modern academic preference for the Germanic pre-Christian religious complex tends toward:
- "Germanic religion" (most neutral)
- "Germanic heathenry" (modern reconstructionist self-identifier — "Heathen" is the preferred term in Asatru / Theodish / Forn Sed circles)
- "Pre-Christian Germanic religion" (most precise)

"Germanic Paganism" is not wrong — it's standard 19th-c.-to-mid-20th-c. usage and still common — but it's a Christianizing label imposed by outsiders. The Wicca-modern-pagan case is different because Wiccans *adopt* "Pagan" as self-identification; Iron Age Germanic peoples did not.

**Why I'm NOT recommending a rename in this batch:**

1. **Slug rename has migration cost.** `tradition-germanic-paganism` is referenced from other nodes via `[[wikilinks]]`; renaming requires vault-wide find-replace + verifying all references resolve. That's Lane A work but consequential.
2. **Lower priority than the 26-lens lock work itself.** Don't bundle a separate decision into a structural batch.
3. **Worth a separate small decision later.** Could be `tradition-germanic-religion` or `tradition-germanic-heathenry`. Either defensible; John should pick.

**Recommendation:** schedule a one-line clarification with John in a future session: *"Should `tradition-germanic-paganism` be renamed to `tradition-germanic-religion` or `tradition-germanic-heathenry`? Or keep as-is?"* Then act on his answer.

## What this audit did NOT find

- No body-prose passages where the project itself characterizes a tradition as "merely pagan" in a dismissive sense.
- No `refs:` claims supported by pejorative-pagan sources.
- No symbol / theme / ritual nodes with "pagan" in their slug where the term is non-self-identifying.
- No agent-facing documentation (`ONTOLOGY.md`, `PROTOCOL.md`, `LANES.md`, `HOW-WE-WORK.md`) using "pagan" as an ontological category.

## Closing

The vault's "pagan" usage passes a scholarly-ethics review. One slug flagged for John's future decision (non-urgent). No content changes required in this batch.

— opus, 2026-05-18 evening, as part of the post-ontology-lock rarefaction pass.
