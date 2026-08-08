# T0 — THE ORIGIN TIER (2026-08-08)

**The dated doc CODEX v1.3's own revision rule requires.** Records why
T0 exists, and corrects a flaw in a decision taken earlier the same day.

## 1. What prompted it

Earlier on 2026-08-08 the vault's two conflicting definitions of `T1`
were resolved in CODEX's favour: `source-tier` grades **how strongly
current scholarship supports a claim**, and ONTOLOGY §5's rival table
(where T1 meant *primary source*) was retired. That resolution stands.

John, reading it:

> *"having different views or frictions ARE GOOD and we should always
> keep them IF THEY'RE strong enough — the same way codex atlas is a
> investigatory tool ( meaning not only search but contest ), we will
> have tons of disparities from different authors — **ACADEMIC doesn't
> mean right by default**, so i just want to make sure we are not
> discarding stuff but reframing if needed in special cases? its ok to
> have a T0 origin and a T1 academic simultaneously on the panel
> description if thats something being contested — or maybe im talking
> non sense?"*

Not nonsense. He caught a real flaw.

## 2. The flaw

The morning's resolution was right that a primary text must not be
graded on the scholarly scale — a scripture is not "more peer-reviewed"
than a monograph. But it left primary sources with **no label at all**,
and that has a consequence nobody argued for:

**if only scholarship carries a tier, then only scholarship is visibly
sourced, and the atlas silently sides with the academy on every
contested point.**

That is a substantive editorial position, adopted by omission. For a
project whose charter opens with *investigation, not advocacy*, and
whose value is cross-tradition friction, it is the wrong one — and it
was never a decision, just a gap.

## 3. The fix

**T0 = the origin. What the source itself says.**

- **NOT a weaker T1, and not on the T1→T5 scale.** T1→T5 grades one
  thing: scholarly support. T0 grades nothing — it *reports*. T0 says
  what the source SAYS; T1–T5 say what scholarship makes of it.
- **At 0 because it precedes interpretation**, not because it ranks
  below it.
- **Coloured out of the ramp.** T1→T5 runs quiet-grey → red. T0 takes
  the vault's gold, deliberately, so a reader cannot misread it as
  "even weaker than T4". It must sit beside a T1 at equal weight.

### The rule it exists for

**When a T0 and a T1 disagree on the same point, both stay on the
panel.** The disagreement is the finding. Deleting the T0 row would tell
the reader the question is closed — itself a claim, and usually a false
one.

### The limit — where a single value must still be chosen

The graph cannot draw two positions at once. A timeline coordinate, a
wedge placement, a `date-born:` — these take exactly one value. There,
pick one system, **apply it consistently across the whole graph**, and
carry the alternative in `date-note:` / `## Disputes` with its source.

> **Consistency in the machinery, plurality in the record.**

The Mahāvīra fix earlier the same day is the worked example, and it is
now the pattern rather than an exception: the timeline uses the academic
dates *because the Buddha node does*, and the Śvetāmbara and Digambara
chronologies are stated in full on the node with the Vīra Nirvāṇa era
epoch noted. Nothing was discarded; one axis was made consistent.

### Where NOT to keep both

T0 is for a claim that is **live** — held by a tradition, or genuinely
contested in the literature. It is not a licence to preserve every
error. A chronicle miscounting regnal years is a T0 about *what that
chronicle says*, with the correction stated plainly beside it. John's
own bar: keep the friction **"IF THEY'RE strong enough"**.

## 4. What shipped

| | |
|---|---|
| `CODEX.md` | → **v1.4**, new §IV.0 defining T0 and the keep-both rule |
| `src/js/forge/legend.js` | T0 row, tooltip, **default ON**, persisted as `tierT0` |
| tier filter | T0 added to `local._activeTiers`; body class `fv-hide-tier-t0` |
| ⚠️ `size < 5` → `size < 6` | **four separate "is the filter on?" checks** in `side-panel.js` and `forge.js` hard-coded the number of tiers. Left alone, adding T0 would have made the filter read as always-on and quietly stop hiding anything. |
| `app.css` | `.vs-tier-pill--t0` — gold, off the grey→red ramp |
| `ONTOLOGY-RATIONALE-2026-08-08-source-tiers.md` | amended: primary sources are a KIND *and* now carry T0 |

**The `size < 5` constants are the lesson worth keeping.** A vocabulary
change is never only a vocabulary change — the count of the vocabulary
was compiled into four unrelated files. Same shape as the lens that
shipped with no door earlier today: *the registry and the thing that
reads the registry have to move together.*

Related: [[CODEX]] · [[ONTOLOGY-RATIONALE-2026-08-08-source-tiers]] ·
[[MEMBERSHIP-AND-WIRES]]
