# ONTOLOGY RATIONALE — 2026-08-08 · SOURCE TIERS: CODEX §IV WINS

> **Supersedes `ONTOLOGY.md` §5's tier table.** Written as a new dated
> doc rather than an edit, per the append-only rule. Nothing else in
> ONTOLOGY.md is affected.
>
> John, 2026-08-08: *"T1 should mean Academic level i believe? what is
> the difference or primary source or mainstream peer reviewed? what
> entails the difference? what is you recco?"*

## 1. The collision, concretely

The vault has had **two incompatible definitions of T1** running side by
side. Both are written down, both are followed by real nodes.

| | **ONTOLOGY.md §5** | **CODEX.md §IV** |
|---|---|---|
| **T1** | **Primary** — the source text itself (ETCSL, Perseus, Loeb, Nag Hammadi, Sefaria) | **Mainstream peer-reviewed** — Doniger, Boyce, Hornung, Parker, Pelikan |
| **T2** | **Scholarly** — peer-reviewed academic (Mark S. Smith, **Boyce**, **Doniger**, Pagels) | **Academic minority** — Schoch on the Sphinx, Carrier on mythicism |
| **T3** | Reputable secondary (Britannica, SEP) | Alternative school (Hancock) |
| **T4** | Controversial (von Däniken, Sitchin) | Popular claim, rejected |

**The tell: Mary Boyce and Wendy Doniger appear as T2 in one table and
T1 in the other.** Same scholars. Two tiers. A reader hovering a wire
cannot know which scale it was written on.

T3 and T4 diverge too: ONTOLOGY's T3 is *Britannica* (respectable), and
CODEX's T3 is *Hancock* (alternative-school). Those are not the same
shelf, and an agent applying the wrong table mislabels in both
directions.

## 2. Why they conflict — they measure different axes

- **ONTOLOGY grades the KIND of source**: primary text → scholarship →
  encyclopedia → fringe.
- **CODEX grades the STRENGTH of the claim**: consensus → academic
  minority → alternative school → rejected.

These are **orthogonal**. A primary source can support a weak claim; a
2004 monograph can be settled consensus. Neither ordering is a refinement
of the other, which is why the two tables could not be quietly merged.

## 3. The decision: **CODEX §IV is the source-tier system**

`source-tier: T1..T4` means **how strongly the claim is supported by
current scholarship**, per CODEX §IV. ONTOLOGY §5's table is retired.

### Why, in order of weight

1. **It is what the field is FOR.** The tier is rendered next to a wire
   to tell a reader how much to trust *that claim*. "Where did this text
   come from" does not answer that question; "is this the consensus"
   does.

2. **ONTOLOGY's ordering inverts the project's posture.** Making a
   primary source T1 — above scholarship — means a tradition's own
   account of itself outranks the academic study of it. The *Rigveda* is
   excellent evidence for **what the Rigveda says** and no evidence at
   all for **whether it happened**. CODEX §I is explicit that this vault
   is investigation, not advocacy; a tier scale that ranks scripture
   above scholarship quietly reverses that.

3. **The graph already votes CODEX.** The `full` nodes — `nagarjuna`,
   and everything written in the 2026-08-07/08 batches — cite
   university-press monographs at `tier: 1`. Retiring CODEX would
   require re-tiering the vault's best-sourced nodes downward.

4. **CODEX's tiers already drive behaviour.** §IV.5 wires T3/T4 to
   disclaimer chrome and the political-risk flag. ONTOLOGY's tiers drive
   nothing. Only one of the two is load-bearing.

## 4. Primary sources are a KIND, not a TIER

Retiring ONTOLOGY's table does **not** demote primary sources — it stops
mis-filing them on the wrong axis. This vault already runs orthogonal
axes and says so: `appearance-tier` ≠ `source-tier` ≠
`political-risk-flag`. Primary-vs-secondary is a fourth such axis.

Where a primary source already lives, correctly:

- **as a node** — the text has its own entry in `02_documents/`
- **as an edge** — `attested-in`, `attests`, `appearances`,
  `primary-source` are registered edge types in the Attestation bucket
- **in `refs:`** — cite the edition; if the distinction matters to a
  reader, say "primary" in the entry's own `notes:`

**A primary source cited for what a tradition SAYS is unimpeachable and
needs no tier inflation. A primary source cited for what HAPPENED is an
interpretive claim, and takes the tier its scholarship earns.** That
distinction is the whole discipline, and the old table blurred it.

## 5. What this changes in practice

- **Nothing in the content has to be rewritten today.** The batches that
  followed CODEX are already correct. Nodes that followed ONTOLOGY §5
  have primary texts marked `tier: 1`, which is not *wrong* under the
  new rule so much as uninformative — it will be corrected as those
  nodes are next touched, not in a sweep.
- **`ONTOLOGY.md` §5 now points here** instead of carrying a rival table.
- **Agents read CODEX §IV for tiers.** It already says so; it is now the
  only thing that says so.

Related: [[CODEX]] · [[ONTOLOGY]] ·
[[ONTOLOGY-RATIONALE-2026-05-18]] · [[MEMBERSHIP-AND-WIRES]]
