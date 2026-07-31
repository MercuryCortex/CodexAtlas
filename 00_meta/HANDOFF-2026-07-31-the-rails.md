# HANDOFF — THE RAILS (2026-07-31)

> Self-contained pickup. Everything below is **committed on `main`** and
> **DEPLOYED 2026-07-31** — `codexatlas.org` serves `?v=20260731-wave2b`, verified in real Safari against the live domain. Read this,
> then `00_meta/HOW-WE-WORK.md`.
>
> Supersedes `HANDOFF-2026-07-30-house-devdoor.md`.

---

## 0. What John asked for, in his words

He came back to a session that had *"got seriously confused! and got messy"* and
asked to *"audit the past work and redo stuff that doesn't make sense if needed
and push onwards … with attention to my objectives - the product - the rigor of
working canonically upwards."*

His two standing complaints from 07-30 were both closed, and both turned out to
be **data-path bugs, not polish**:

- *"regarding the counts … well thats what your plan showed me, so i want them."*
- *"the name was cascade and fan — CANT find that toggle."*

Rules that cost this session real time when I forgot them:

- **BE CONCISE.** Short replies, one action at a time, exact place + button.
- **Ship a dial, don't ask.** Reversible visual choices in the dev phase: pick a
  default, ship it, expose the number as a LAB slider.
- **He judges by toys, not stills.** Build the thing he can click.
- **Canonical rigor outranks polish.** A number on screen the vault does not
  support is the worst defect in this product. Three of today's blockers were
  exactly that.

---

## 1. What happened today

| | |
|---|---|
| **The audit** | 36 agents, 6 lenses, every blocker/major handed to an independent refuter. **55 findings, 38 survived.** `AUDIT/2026-07-31-house-audit-and-build-order.md` |
| **The build** | 3 agents in isolated worktrees, strict region ownership, merged by the main thread. |
| **The review** | 20 agents over the merged diff. **23 findings, 19 survived.** `AUDIT/2026-07-31-house-wave1-review.md` |
| **Wave 2** | 1 agent fixing all of it, merged and verified live. |
| **Anonymity** | A real leak, fixed, plus the gate that should have caught it. §5. |

Full detail with numbers: `00_meta/STATUS.md`, entries `THE-RAILS`,
`THE-RAILS-W2` and `ANONYMITY-GATE`.

---

## 2. THE RAILS — the architecture that changed

The house used to be handed `local.mode.nodes` — the wheel's mode-filtered set
— and **every one of the 30 modes is single-type** (`mode.js:517`), so
`docs.length` and `court.length` were 0 by construction on every family in every
mode, forever. The SCRIPTORIUM/COURT chrome had shipped complete on 07-30 and
was simply dead. The chrome needed nothing; the data did.

The house now resolves its own membership from the whole vault:

```
houseGuestsOf(fam)          every vault node of the family the mode filtered out
  → augmentModeForHouse     appends them + their INTRA-FAMILY wires to local.mode
  → packModeNodes           TWO blocks: the wheel set with its own tier
                            percentiles first, guests appended with their
                            buffer-A radius zeroed (so entering a house cannot
                            re-size one god on the wheel, and at mix 0 a guest
                            is literally not on screen)
  → rebakeNodes             the engine's own rebuild path — no new draw path
  → buildHouse              UNCHANGED; it now simply sees a mixed set
  → familytree.js           treeKindOf splits tree / scriptorium / court
```

Exit restores a snapshot and re-packs once; `packNodes` is deterministic, so the
wheel comes back byte-identical (proven by hit fingerprint, §4).

Real numbers: **Greek 241 = 80 deities + 24 documents + 137 court.
Christian 467 = 12 + 125 + 330. 'Other' 2,338** — 'Other' is the pathological
case every check must cover.

### The standing tension this created — READ BEFORE TOUCHING THE HOUSE

`treeKindOf` routes **deity → tree regardless of the wheel's lens**. So in 28 of
30 modes the cascade holds the family's DEITIES. That produced three blockers
(the crown printed the mode's noun over the tree's count) which are fixed — the
crown now names `stats.treeKind`, the cascade's real composition.

But the deeper question is open: **what does a Documents-mode house MEAN?**
Today you click a family title on the Documents wheel and get a deity tree
flanked by that family's library. That may be right — the house is a lineage
view and lineage is a deity thing — or the tree should follow the lens. It is a
product decision for John, not a code fix. Do not patch the label again.

---

## 3. What is on screen now (all verified live)

- Crown: `80 DEITIES · 96 LINEAGE ARCS · 10 STAND ON THEIR ERA`
- Crown: **`24 IN THE SCRIPTORIUM · 137 IN THE COURT`** ← the line he asked for
- `CASCADE` / `FAN` chips **on the crown**, only under `body.fv-isolated`
- `THE SCRIPTORIUM — 24 DOCS` (left) · `THE COURT — 137 OF ALL KINDS` (right)
- Shelf captions with honest truncation: `PERSONS · 90 OF 199`, `+180 NOT SHOWN`
- Spine names and rail item names, placed **outboard** of the rail column
- Lineage arcs that read as arcs (bow/chord 0.030 → 0.180)
- `GEN I..GEN N` only where the row is genuinely one generation of real kin

---

## 4. ⚠ FIRST THINGS TO DO

1. **Show John the house and let his eye decide.** He has rejected two versions
   of this feature. Serve `localhost:8742`, click a family title. The two
   captures are `house-greek.png` / `house-christian.png` (Safari, real).
2. **The GEN gutter is now nearly empty in lineage mode** — Greek 1 of 7 rows,
   Christian and Chinese 0. That is the honest outcome (the row is a layout
   rank, not a generation) but it is a real loss of a navigational aid. If he
   wants the axis back, the honest fix is a **layout** change so a row means one
   generation — not a relabel. Ask him.
3. **Rail glyphs are 150 identical dots.** No colour or shape by kind, which is
   why the shelf captions carry so much load. First candidate for the next
   design round.
4. **Deploy is NOT done.** The live site is still on 07-30. Deploy is
   outward-facing — confirm with John first (§6).

---

## 5. Anonymity — what changed for every project

John's real handle sat in a **tracked, pushed** file
(`00_meta/HANDOFF-2026-07-17.md:49`) for 11 days. The repo is **private**
(`github.com/MercuryCortex/CodexAtlas` 404s anonymously), so it was never public.
Scrubbed.

The regex was never the gap — it existed in two places. **Nothing ran it.**

- `scripts/git-hooks/pre-push` — **NEW, installed.** Delegates to the single
  source of truth `_FOUNDER-PROTOCOL/audit.sh`, refuses the push if the protocol
  kit is missing rather than passing blind, and gates authorship on an
  **allowlist** of project pseudonyms (a denylist would mean writing the real
  identity into the hook).
- `_FOUNDER-PROTOCOL/audit.sh` (shared, all projects): the hard regex was
  anchored on the real name and the gmail address and walked straight past the bare handle; hits
  are now filtered through `git check-ignore` so `PROJECT-IDENTITY.md`
  (gitignored by design) stops making the gate cry wolf on every push.

**Open, John's call:** the old string still exists in the private repo's git
HISTORY. A rewrite is his decision, not an agent's.

---

## 6. THE HARNESS LAWS — each cost hours

- **Safari is the truth.** `scripts/safari-check.py` drives real Safari
  headlessly. Read its header.
- **BOTH headless surfaces suspend rAF** (`visibilityState: hidden`). The layout
  mix never ramps, `edgeStates` never walks toward `edgeTargets`, and
  `camera.flyTo` never lands. Two sessions read "the arcs don't draw" off a
  screenshot that was actually the WHEEL at the wheel's scale with the crown
  above the viewport. **`_forgeDebug.houseSettle()` now jumps the mix, completes
  a morph AND lands the camera.** There is still no settle for `edgeStates` — a
  claim about wire brightness at a fractional state cannot be verified headless.
- **Debug surfaces that read the TARGET array lie.** `houseBones()` reported
  "39 lifted" off `edgeTargets` while the rendered state was 0. Read the state,
  or read the GPU. `dumpBugState()` is **async** — `await` it or you get `{}`.
- **`claim()` refuses anything within 15px of a rect the SAME function placed.**
  This hid the crown's count line, both rail headers and every court spine name
  — for months, invisibly, because the strings were written before the data that
  fills them. Derive row pitch from the collision rule, never hand-pick offsets.
  Suspect this FIRST when a label "should be there" and isn't.
- **`||` treats an explicit `0` as absent.** `hn.r = posB[z] || wheelR` turned
  "parked, no mass" into a full-size invisible click-target.
- **Never validate banding in the Chromium pane** — Chromium dithers gradients,
  Safari does not.
- **`?diag=1`** installs the boot-error recorder; assert `window.__diag === []`.

---

## 7. Laws — do not relitigate

- The Forge engine is the ONLY renderer for vault-node graphs (a control chip is
  chrome, not a graph — the CASCADE/FAN chips are legitimately SVG in the
  existing hulls overlay).
- Layout spread is a swappable primitive — never hard-code the grouping key.
- **Honest zeros** — feature off ⇒ byte-identical. Proven today across six
  houses by screen-grid hit fingerprint.
- **Rest is still** — 0 frames in 4s, `isAnimating() === false`.
- **ONE label registry.** A second copy of the collision math crept in once and
  was folded back; do not add a third.
- `computeFitScale()` is sacred.

### The instance count is no longer constant — this is the new footgun

Two GPU crashes today, one class: `writeBuffer: Number of bytes to write is too
large`. Each house now brings a different number of instances, so **any path
that changes the packed count while a house stands** can upload past the end of
an array. Both are fixed at the root (travel snaps on identity; `bakeEdgePosB`
counts its own renderable edges), and `check-house-wires.mjs` §7 pins the
numbers. Suspect this class on any new path that re-packs.

---

## 8. The workflow that worked

1. **Audit first, adversarially.** Every serious finding goes to an independent
   agent whose only job is to refute it. 17 of 55 and 4 of 23 died there —
   including three of my own first guesses.
2. **Implement in parallel git worktrees with STRICT file/region ownership.**
   Tell each agent exactly which regions it owns and which are forbidden.
3. **Worktrees do NOT contain `data.js`** (gitignored). Every agent's first
   command must be `ln -sf "<main checkout>/data.js" data.js`.
4. **Agents never touch `index.html` stamps or `_bundle.js`** — the main thread
   bumps and rebuilds once after all merges, or you get three-way conflicts.
5. **The main thread does ALL live verification.** Agents cannot drive a browser
   (contention, and rAF is suspended anyway). Every defect that mattered most
   today — the crown line, the rail headers, the travel crash — was found by
   looking at a real screen after the agents said done.
6. **Merge note:** if a worktree branched before your own commits, `git merge`
   re-conflicts every hunk you already fixed. Check whether its sync commit
   matches main (`git diff <sync> main -- <files>`) and **cherry-pick its real
   commits** instead.

---

## 9. Build / verify / ship

```bash
python3 scripts/build_dist.py && npx wrangler pages deploy dist --project-name codex-atlas --commit-dirty=true
```

- Dev server: `.claude/launch.json` → port 8742. Never `open index.html`.
- After editing `src/js/forge/*`: `./scripts/build-forge-bundle.sh` (never
  hand-edit `_bundle.js`).
- **Bump `?v=` on every changed tag in `index.html`** — Safari cache law.
  Current stamp: `20260731-wave2`.
- Gates: `node scripts/check-familytree.mjs` (188 assertions) and
  `node scripts/check-house-wires.mjs` (51). Both must be ALL PASS.
- Deploy is outward-facing: **confirm with John.** Propagation ~30s; poll
  `codexatlas.org` for the new stamp before telling him it is live.

---

## 10. Deferred, ranked

1. **What a non-deities house means** (§2) — a product decision for John.
2. **The GEN axis** — layout change, not a relabel (§4.2).
3. **Rail glyphs by kind** — colour/shape so a court is not 150 identical dots.
4. **THE WIRE DRESS** — his standing brief, not yet started: *"our wires should
   also add some fx to match the new nodes for elegancy and flair to distinguish
   the levels of transmission hierarchy."* A design round of its own — a wire
   lab, the way `design/node-lab.html` was for nodes.
5. Remaining minor findings in `AUDIT/2026-07-31-house-wave1-review.md` that
   wave 2 did not take: the bones' lilac-vs-green question (a decision for
   John's eye), the fan geometry's halved braid span (`familytree.js:547`,
   rings wrap ~350° instead of the declared 198°), the aspect step that
   manufactures a cycle and deletes a real lineage arc, and
   `check-familytree.mjs`'s original sections still measuring a deities-only
   world.
6. Engine loose ends: orb backdrop never shrinks back after a cast leaves;
   fractional-dpr lens misregistration; body-pass light is ADD not screen.
