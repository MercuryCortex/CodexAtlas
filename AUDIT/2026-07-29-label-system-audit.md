# AUDIT — THE LABEL SYSTEM (2026-07-29)

> John: *"we got two labels now? the labels work and behaviour needs to be
> decided? i want to flow nice and keep a hierarchy on zooms but also use the
> interim reveal flow that we have more or less now — which is faded by the
> way, audit."*
>
> He is right. There are two independent label systems drawing on the same
> canvas, in two different visual languages, with two independent collision
> lists. This is the audit and the proposed single behaviour. **Nothing is
> implemented from this document yet** (AUDIT convention: proposals here are
> unimplemented).

---

## 1 · What is actually on screen

Both systems live in `renderLabelsCanvas()` — `src/js/views/forge.js:5196`.
They paint to the same 2D canvas, one after the other, and they do not know
about each other.

### A · THE RANK LABELS (idle tier system) — `forge.js:5288-5301`

- **Chosen by** `computeIdleLabelVisibility()`, `src/js/engine/graph/label.js`
- **Rule**: a per-tier zoom ladder — `tierZoomThresholds [0, 0.8, 1.2, 1.6,
  2.0, 2.8]`. Tier 0 (top hubs) always; each deeper tier appears as you zoom
  in. AABB collision pruning across all tiers, per-tier budgets, hard cap 200,
  centre-weighted so the middle of the screen wins ties.
- **Look**: Inter 500 **14px**, drawn **ABOVE** the node (`y = s.y − r·scale − 6`),
  colour `--forge-label-text` ≈ `#e8eaef`, **4px dark halo stroke**, **alpha 1.0**.

**Verdict: this is the hierarchy John wants, and it works.** It is the keeper.

### B · THE REVEAL LABELS (wake voice) — `forge.js:5303-5386`

- **Chosen by** the dress engine's per-node `wake` value: any node above
  `wake > 0.35`. Priority hovered (20) > locked (10) > wake. No cap.
- **Look**: a DIFFERENT font (the LAB "voice": sans 9.5px / serif 11px /
  mono 9px), drawn **BELOW** the node (`y = s.y + r·scale·bubble + 16`),
  colour = the node's **family colour mixed 40% toward white**, **no halo**,
  letter-spacing tracking, and one of three reveal motions (rise / condense /
  unveil).

**Verdict: the reveal FLOW is right and John wants to keep it. The visual
language is the problem — it is a second, weaker typography.**

---

## 2 · Why the reveal labels look faded — five compounding causes

Not one bug; five things multiplying:

1. **The ceiling is 0.85, never 1.** `forge.js:5369` — `0.85 * a`. A fully
   awake, hovered node still paints at 85%.
2. **The ramp is linear from a late start.** `rv = (wake − 0.35) / 0.65`.
   A neighbour sitting at wake 0.6 — very common in a woken cluster — is at
   rv 0.38, so **alpha 0.32**. Most reveal labels never get anywhere near
   even the 0.85 ceiling. This is the single biggest cause.
3. **No halo stroke.** The rank labels get a 4px dark halo, which is what
   makes them read as solid against the wheel. The reveal labels are bare
   text over nodes, wires and glow.
4. **32% smaller** (9.5px vs 14px) and **tinted toward the family colour**
   instead of near-white — so lower contrast before alpha is even applied.
5. **The focus dim darkens the field but not the labels' contrast budget** —
   during a hover the whole scene dims (A4 law) and the pale reveal text
   dims with it.

## 3 · Two real defects, independent of taste

- **P0 — the collision lists are separate.** A's `placed` set
  (`label.js`) and B's `placed` array (`forge.js:5339`) never see each other.
  A reveal label can land directly on a rank label. B only de-duplicates by
  **id** (`forge.js:5330`), not by position.
- **P1 — the most important nodes never get the reveal.** B skips any node
  already shown by A. So hovering a hub — the node the user is actually
  looking at — produces no reveal animation, because its rank label was
  already up. The "interim reveal flow" is structurally excluded from the
  top of the hierarchy.

---

## 4 · THE PROPOSED BEHAVIOUR — one label, two reasons to appear

The fix is not to delete either system. It is to stop them being two
*languages* while keeping them as two *reasons*.

**One typography.** The LAB voice (font + size, John's dial: sans/rise)
becomes THE label style for the whole app. One font, one size, one position
relative to the node, one halo. Rank and reveal become indistinguishable
once they have arrived — as they should be, because they are the same thing:
a name.

**Two reasons a name appears:**

| | RANK | REACH |
|---|---|---|
| why | the node is important enough at this zoom | your hand woke it |
| chosen by | the tier ladder (unchanged) | wake > threshold |
| arrival | simply present | animates in (rise / condense / unveil) |
| departure | crossfades on zoom change | fades with the wake |
| alpha | 1.0 | ramps to **1.0**, not 0.85 |

**Priority, one list, one collision pass:** hovered → locked → woken → rank
(T0…T5). Every candidate goes into a single placement pass, so nothing can
ever land on top of anything else, and a woken neighbour can *displace* a
low-tier rank label rather than fight it.

**The fade fix** (in priority order of impact):
1. Re-shape the ramp: reach full opacity by roughly the middle of the wake
   range instead of at wake = 1.0 (`rv` gets an ease, not a linear
   remainder), so a woken neighbour reads as present, not as a ghost.
2. Ceiling 0.85 → 1.0.
3. Give reveal labels the same halo as rank labels.
4. Same size and near-white as rank labels; keep the family tint only as a
   faint warmth, not as the text colour.

**What stays exactly as it is:** the tier zoom ladder and its thresholds,
the centre-weighting, the cap, the reveal motions, and John's voice dials.

---

## 5 · Open question for John (blocking the implementation)

Merging the two languages means **the whole app's labels adopt the LAB voice
font and size** (currently Inter 14px → sans 9.5px, or whatever he dials).
That is a visible change to every label on the wheel, not just the woken
ones.

- **(a)** One language — the voice wins, rank labels adopt it. *(recommended:
  this is what "one label" means, and it makes the voice dials meaningful for
  the whole app)*
- **(b)** One language — Inter 14px wins, the reveal labels adopt it and the
  voice-font dial is retired.
- **(c)** Keep two deliberate languages (rank = the map's typography, reveal
  = a lighter whisper), and only fix the fade + the collision defects.

---

## 6 · Adjacent, on the plan, NOT in this audit

- **Family / hull zoom** — John: *"the zoom on hulls etc… or families if we
  click on the families these are all parts of the plan."* The spec already
  exists in `design/node-lab.html` §04: *"Isolate is state, not navigation.
  Same Forge engine, same instanced nodes — a camera fit plus a dim-others
  flag plus a ground tint. Back is one click, and it's instant."* Now that
  the grounds are real (VIEW ▸ Ground), the "ground tint" half of that spec
  has somewhere to live.
- **Wedge titles clipping** at the viewport edge (`RN-ESOTERIC`,
  `HERMETIC`) and node names colliding with the bottom bar — separate from
  the two-label problem; these are the hull labels + a viewport-inset issue.
- **The wire dress** — its own design round (see the node-dress handoff).
