# HANDOFF — 2026-08-01 · THE TITLE AND THE FAN'S AXIS

> Written at John's request at the end of a session he closed with
> *"very well done… this is looking very good, the house panel allows me
> to detail further."* First session since three consecutive
> terminations (07-31, 08-01, 08-01 #2) that ended shipped and green.
> Read `00_meta/POSTMORTEM-2026-08-01-terminated-2.md` first if you have
> not — the rules below are what those cost.

---

## STATE — read this before anything

- **DEPLOYED. `tree == live`.** codexatlas.org serves
  `?v=20260801-fanaxis`, built from this tree through the one gated door
  (`bash scripts/deploy.sh`). The 08-01 postmortem's broken invariant —
  live serving a build John had rejected — **is closed.**
- **All three house gates PASS** (`check-familytree`,
  `check-house-wires`, `check-house-interaction`). Tree clean.
- Verified ON THE LIVE SITE in real Safari at John's own window
  (2000×1098): 10 families × both geometries, **0 no-fit**, every fan
  puts the title below, every cascade above, 0 boot errors.

---

## WHAT SHIPPED

**1 ▸ The title takes the empty air.** The centre slot used to project
the house's top through the camera and hang the stack above it, which on
a full-height window clamped it to the screen edge every time. It now
measures: everything the house draws in the title's own column — members,
rail glyphs, ports, **and the era captions** — is projected into an
interval list, and the block takes the widest HOLE. The side is decided
by where the tree's own mass sits (cascade centred ⇒ top; fan crests
high ⇒ the empty bottom), and only then does size choose between the
holes on that side.

**2 ▸ One title, one subtitle.** The block was a name and TWO stat
lines — three headlines pretending to be a title block. Now name +
subtitle + the CASCADE/FAN chips. The subtitle still counts
`stats.tree` with the treeKind noun AND still states the scriptorium and
the court, which is the honesty the second line existed for.

**3 ▸ The fan sits on the X axis** (`house_fan_dy`, ships at 0). Its
origin used to be 0.34×Rt below centre. That one number was behind three
separate complaints of John's: *"the inner circle is not central"*, the
date staircase, and the fan having no room for its own title. On the
axis the crest fills the top half and the bottom is free. **0.34
restores the old origin** — it is a dial because it is a composition
decision.

**4 ▸ Smaller things.** Idle CASCADE/FAN chip opacity 0.45 → 0.62 (this
repo's own chrome floor is 0.55). `scripts/safari-check.py` now takes
`SAFARI_CHECK_W` / `SAFARI_CHECK_H` so a pass can be run from John's
seat instead of a 1440 laptop.

**5 ▸ `design/bands.html`** — the frame study. The two bands, the inner
circle, the five margins as dimensions, the date-line template, and a
LIVE family. It **calls the real engine**
(`window.AtlasEngineLayout.familyTreeLayout`), it does not mirror it.
Pack data is shared with `design/family-tree.html` through
`design/_ft-data.js` (one copy, extracted this session).

---

## THE FIVE RULES THIS SESSION PAID FOR

1. **A toy may never ship a rival layout.** I invented node distribution
   three times — density slots, bed re-packing, natural heights — and
   John rejected all three, correctly: *"whatever im asking, ITS already
   built in our codex… i WANT ZERO changes of what is currently built."*
   The engine is a plain global. **Call it. Never mirror it.**

2. **A gate that mirrors app logic goes stale silently, and stale means
   GREEN.** `check-familytree`'s `titleAnchor` was a copy of the OLD
   anchor formula and kept passing after the view stopped using it — a
   gate testing its own fiction. Same trap twice: `houseUnion` omitted
   `fanDy`, so the gate scored a fan the app no longer draws. **When you
   change a law, move its mirror in the same commit.** Fixing the second
   one moved the headroom number from 1090px to 900px — the gate had
   been reporting a defect that no longer existed.

3. **Verify on the LIVE site, not just locally.** codexatlas.org sits
   behind the *Enter the Codex* access gate; a harness must call
   `window._threshold.close()` first, and a raw screenshot will still
   show the sign-in overlay while the app runs underneath it. Drive
   `_forgeDebug` and read the numbers.

4. **The browser preview pane lies about size.** Its screenshots go
   stale and mis-scale after a resize; several "the canvas is broken"
   moments were the pane, not the page. **Real Safari via
   `scripts/safari-check.py` is the truth** (cardinal rule, and it held
   every time this session).

5. **Never label a drawn thing with a number it is not.** The margin
   overlay drew the band→ports lane from the caption ring all the way to
   the ports — 107wu of slack — while captioning it "mBandPort 12wu".
   John: *"IM LOST WHAT IS THIS THUNG"*. A margin is a MINIMUM: draw it
   at its declared size anchored to the thing it protects, and draw
   slack AS slack.

---

## OPEN — in John's likely priority order

1. **THE DATE AXIS IS NOW UNBLOCKED.** This is the interesting one. The
   fan's rings are concentric with the house for the first time, so a
   date axis on a true radial of the circle is now GEOMETRICALLY
   POSSIBLE — it was not before, and I proved that the hard way (see the
   reverted experiment in the 08-01 log). John's original words stand:
   *"the lines of dates GOES off the center of their spot, they should
   be circular that is INSIDE and centred on their PERIMETER."* The
   template he approved is in `design/bands.html`: every date ON its own
   ring, all sharing one bearing, so the set reads down a straight
   radial instead of a staircase. **Ask before shipping it** — it moves
   ink he has not seen in the app.

2. **`design/bands.html` sliders are inert under REAL ENGINE.** John:
   *"need to control the arc, most of buttons sliders not working."*
   True — once the engine owns the layout, ARC / INNERMOST / OUTERMOST /
   LINES are overridden by the engine's own rowMeta. Either pass them
   through or hide them in engine mode. Not done.

3. **Headroom.** Every family finds air at window height ≥ **900px**
   (re-derived every gate run, so it cannot go stale). Below that the
   biggest fans fall back to the top slot. Closing it means scaling the
   block with the house radius or reserving the band in the layout —
   both change ratified type/layout, both are John's call.

4. Unchanged from before: great-cleanup **Phases 2–5**
   (`AUDIT/2026-07-31-great-cleanup-plan.md`), and the **history purge**
   (his YES stands; timing his).

---

## THE ONE SENTENCE

**The codex already knows how to do it — find where, call that, and move
the gate's mirror in the same commit.**
