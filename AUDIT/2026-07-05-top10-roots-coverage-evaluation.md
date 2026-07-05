# Top-10 Transmission Roots — Coverage Pass + Evaluation (2026-07-05)

**Task (John):** do a branch-population pass on all 10 top-transmission roots, then evaluate
what each gave us. Tiamat was already deep-populated (runs 1+2, `AUDIT/2026-07-05-branch-population-benchmark.md`);
this doc is the grep-verified **reach map** of the other 9 + Tiamat as baseline, and the evaluation.

## Method
A root's "branch" reaches a lens if that lens contains a node about the branch. I grep-counted,
per root, how many files in each of the 29 lens folders mention the root's branch tokens
(word-boundaried regex to avoid noise). Then I **verified the winners' hard-lens endpoints exist
as real nodes** (not incidental mentions). This is a *mention-reach* proxy — a **lower bound**:
the Tiamat calibration showed real populatable reach (~17/29 lit) exceeds mention-reach, because
civilization-lens nodes are often keyed to the *tradition* or *other figures*, not the deity's name.
So tradition-anchored roots (Tiamat, Inanna, Indra) are undercounted; the relative ranking still holds.

## The discriminating metric — civilization-lens reach
Every root has a big mythology **spine** (deities, persons, themes, symbols) — that doesn't
discriminate. Roots differ in whether their branch carries the **civilization lenses**: Law,
Philosophy, Math, Medicine, Astronomy, Divination, Calendars, Music, Alchemy. Score = Σ mentions
across those 9 lenses:

| Rank | Root | Civ-score | Depth (all lenses) | Breadth | Character |
|---|---|---:|---:|---:|---|
| 1 | **Indra** | **97** | 755 | 27/29 | Natively lens-complete Vedic tradition |
| 2 | **Hermes** | **92** | 623 | 25/29 | Owns the esoteric-sciences branch (alchemy/divination) |
| 3 | **Jesus** | **88** | **1323** | 28/29 | Deepest + broadest; strong law + philosophy |
| — | *(big gap)* | | | | |
| 4 | Zeus | 28 | 444 | 23/29 | Wide *equivalents* hub, but branch-thin on the sciences |
| 5 | Inanna | 24 | 383 | 24/29 | Overlaps Tiamat's Mesopotamian sphere (redundant) |
| 6 | Osiris | 20 | 487 | 23/29 | Strong Egyptian astronomy; weak phil/math/med |
| 7 | Mary | 17 | 434 | 26/29 | Theology/practice/art; overlaps Jesus (Christian) |
| 8 | Thor | 7 | 202 | 13/29 | Mythology-only branch |
| 9 | Tiamat | 6* | 297 | 20/29 | *undercounted — real deep-dive lit ~17/29 (tradition-anchored) |
| 10 | Perun | 1 | 81 | 13/29 | Thinnest — reconstructed Slavic, little corpus |

## What the pass gave us — the four findings

**1. Three roots carry the whole atlas; the rest are mostly mythology.**
Indra (97), Hermes (92), Jesus (88) are in a class of their own on civilization reach — a
3–5× gap to everyone else. If the goal is to light every lens, these three do it; the others
mostly populate the mythology spine.

**2. The transmission ranking ≠ branch-population richness — the pass CORRECTS the ranking.**
- **Zeus** was #2 on the equivalents-based transmission ranking but is **branch-thin** here
  (civ-score 28; **philosophy = 0** — verified: no philosophy node references Zeus). His reach is
  *interpretatio* breadth (X=Zeus equations), not a branch that transmits law/science. Greek
  philosophy/math/astronomy attach to the *persons* (Thales, Euclid, Ptolemy) and to **Hermes**,
  not to Zeus. Zeus is a spine hub, not a population engine.
- **Indra** was #1 on the ranking AND is #1 on population — the Vedic tradition natively owns
  every lens (verified real nodes: `mathematics-sulba-sutras`, `philosophy-advaita-vedanta` +4,
  `moral-dharma`/`karma`/`rta`, `medicine-ayurveda`, `astronomy-indian-nakshatras`, `hindu-panchang`).
- **Hermes** was mid-ranking but is a population powerhouse — he **owns the alchemy lens**
  (Hermes Trismegistus → the Hermetica → `alchemy-emerald-tablet` + a full alchemy corpus;
  alch=32, div=10). No other root touches alchemy meaningfully.

**3. Two roots are redundant, two are thin.**
- **Inanna** overlaps Tiamat's Mesopotamian sphere (shares `sexagesimal`, `mul-apin`, `extispicy`,
  `code-of-hammurabi`, `medicine-mesopotamian-temple`, `cuneiform`) — populating her *extends the
  already-built Mesopotamian branch* rather than opening new ground.
- **Mary** overlaps Jesus (Christian sphere).
- **Thor** (7) and **Perun** (1) are mythology-only; Perun is barely attested (reconstructed Slavic).

**4. The spine is universal, the sciences are the differentiator.** Deities/persons/themes/symbols
are dense for every root (even Perun has 47 deity-nodes in reach). The value of a branch-population
pass is entirely in whether it reaches the hard lenses — which is why civ-score, not breadth, ranks them.

## Recommendation — populate the distinct powerhouses, skip the redundant/thin
1. **Indra** — deepest new ground; a natively lens-complete tradition. Highest ROI: nearly every
   lens has a real, existing, un-wired endpoint (the Tiamat lesson — cheap wiring, not creation).
2. **Hermes** — unique: the only root that opens the alchemy/esoteric-sciences branch. Distinct, non-redundant.
3. **Jesus** — deepest + broadest, strong law/philosophy; but Christianity is already 149%
   over-target (master plan §1) → this is mostly **wiring existing wealth**, not creation.
4. **Zeus** — populate as the *interpretatio spine* only; don't expect it to light the sciences.
5. **Skip for now:** Inanna (fold into the Mesopotamian branch), Mary (fold into Jesus), Thor + Perun (thin).

Net: the 10-root pass says **populate 3 branches deeply (Indra, Hermes, Jesus)** to light the whole
lens-grid from independent traditions — Vedic, Hermetic-Greek, Christian — plus the already-done
Mesopotamian (Tiamat). Four traditions, four fully-lit branches, minimal redundancy.
