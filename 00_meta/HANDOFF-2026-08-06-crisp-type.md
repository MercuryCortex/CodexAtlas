# HANDOFF — 2026-08-06 · THE FOCUS VIEW BECOMES PAGE TEXT

> **You are picking this up on a fresh account with no memory of this
> project. This file is written to be the only thing you need.** Read
> §0 before you touch anything — it is how John works, and most of the
> ways to fail here are in it. Then §5 for what to do next.
>
> John, at session close: *"we will keep working on the map."*
> The map = the Forge view (Lane B / UX). Route through
> [[HOW-WE-WORK]] §2 as normal.

---

## 0 · READ FIRST — how John works

He is a **designer/artist and CEO, not an engineer**. He does not audit
his own security or anonymity; that is your job. Explain things in
designer language with the *why*.

**THE FIVE RULES THAT COST THIS SESSION THE MOST TIME:**

1. **HE ONLY LOOKS AT `https://codexatlas.org`.** His words: *"im here
   https://codexatlas.org — ps i dont look at anytning except here."*
   He never opens localhost. **Work that is committed but not deployed
   is invisible to him and does not count as done.** Say explicitly, at
   the end of every batch, whether he can see it yet. **And when he says
   "still not fixed" — ASK WHICH URL before you debug anything.** Twice
   this session the answer was "you never shipped it".
2. **An un-bumped `?v=` ships nothing.** Editing a file under `src/js/`
   without bumping its `?v=` in `index.html` means no browser will ever
   load it. Rebuild `_bundle.js` too when a `src/js/forge/*` module
   changed (`bash scripts/build-forge-bundle.sh`). Treat the bump as
   part of the edit, not a release chore. A whole batch was invisible to
   him because of this.
3. **NEVER drive real Safari.** `scripts/safari-check.py` opens windows
   on his screen and interrupts his work. He stopped an agent fleet over
   it: *"why you are bashing me with pop up windiws to look repetidely
   to the same thing?"* Use the in-app browser pane instead (§7).
4. **BE CONCISE. ONE STEP AT A TIME.** Walls of text overwhelm him. He
   said *"im so lost"* mid-session when given too much at once. Short
   answers, one action, then stop.
5. **SHOW, DON'T TELL.** *"if you want me to check stuff you need to
   show me."* Screenshots, or better, ship it and give him the URL.

**Deploy** is `bash scripts/deploy.sh` — the ONE gated door (builds
dist, runs the anonymity leak audit, then Cloudflare Pages). Never call
`wrangler` directly. **Deploying is outward-facing: confirm first**,
but understand that not deploying means he cannot see your work at all.

**Anonymity is NON-NEGOTIABLE.** His real identity must appear nowhere
in the repo, commits, or anything that can become public *or
semi-public*. Commit as the project pseudonym (`Codex Atlas
<codex-atlas@local>`); `user.useConfigOnly` is set so an unconfigured
commit is refused. **"It's a private repo" is NOT a reason to accept a
leak** — see §4c.

---

## 1 · STATE

- **DEPLOYED. tree == live == origin.** codexatlas.org serves
  `?v=20260806-housetext` (forge.js + app.css), verified by curl.
- Tree CLEAN at `8f2e8517`. All three house gates PASS.
- **Pushed to `github.com/MercuryCortex/CodexAtlas` (private).**
- Five batches this session, in order: one family-name declaration + the
  canvas finally asking for the vendored fonts → the title re-seat
  glides (+ the cache-buster that had hidden batch 1) → ring names
  become page text → the whole focus view becomes page text → the
  handoff + identity purge.
- ⚠️ **GIT HISTORY WAS REWRITTEN on 2026-08-06 (see §4c). Every commit
  SHA changed.** Any SHA quoted in a document older than this one will
  not resolve. This is expected. Do not "fix" it.

## 2 · THE LESSON — type is TWO problems that look identical

John said "the fonts are blurry" on 08-02. It was **three different
causes wearing one complaint**, each invisible until the one before it
was fixed:

1. **The canvas never asked for the vendored fonts.** `HOUSE_MONO` was
   `ui-monospace,"SF Mono",Menlo` — JetBrains Mono was *not in the stack
   at all*. Worse, **`font-synthesis-weight: none` governs CSS ONLY,
   never canvas 2D** — so every `600` in the house was being synthesised
   from a 400 system face. A canvas font stack is a *second* place fonts
   get chosen and it does not read your CSS tokens.
2. **Two painters, two declarations.** The same tradition name was
   `11px/400/0.18em` on the wheel (SVG) and `12px/600/no tracking` in
   the house (canvas). Five settings, five disagreements.
3. **Two RENDERERS.** ← *the one that matters.*
   Even at byte-identical settings they still looked different, because
   **canvas text gets no hinting from the browser's text engine and page
   text does.** No `ctx` setting closes it. It is nearly invisible at
   devicePixelRatio 2 and brutal at 1 — so it reproduces on his screen
   and *not* in a Retina test, which is exactly how it survived review.

> **THE RULE: if two strings must look the same, they must be drawn by
> the same renderer. Matching the type is necessary and not sufficient.**
> Before hunting a blur, ask which painter draws each of the two things
> being compared.

**AND: measure before theorising.** A round was burned on glyph
positioning and halo width. Both were ruled out by pixel counts, not
argument — device-snapping every glyph advance moved partial-coverage
pixels only 43.5%→42.0%, and removing the halo made the ratio *worse*.
That measurement is what pointed at the renderer.

## 3 · THE ARCHITECTURE NOW

- **In a house, the canvas paints ZERO strings.** All seven classes —
  title, subtitle, rank dates, rail headers, shelf captions, spine
  names, god names — are SVG nodes in `#forge-house-text`.
- **The conversion is one line deep.** Every steady chrome string
  already funnelled through `halo()` in `houseChromeEnv`; that function
  now reads the live ctx state and emits a node. **The eight painters
  upstream still speak canvas and none of them changed.** If you add a
  new house string, call `halo()` and you get page text for free.
- **Style is written INLINE from the JS TYPE ladder**
  (`TYPE = {head:13, name:12, cap:11.5} × house_type_scale`) so that
  ladder stays the one source of truth. The CSS rule
  `#forge-house-text text` carries *only* the halo shield.
- **A family name is ONE css rule** — `.forge-hull-label,
  .forge-house-port` — shared by the wheel's ring and the house's
  horizon, so they cannot drift in type *or* sharpness. Ports
  deliberately do NOT carry `.forge-hull-label`: the
  `body.fv-isolated .forge-hull-label:not(.is-isolated)` rule retires
  the wheel's titles inside a house and would zero the ring in the very
  house it labels. Gate-pinned both directions.

### ⚠️ THE HOUSE/WHEEL SPLIT IS LOAD-BEARING — DO NOT "UNIFY" IT
God names go to page text **`if (atHouseNow)` only**. The wheel keeps
canvas, because its label set is *unbounded* (thousands) — which is
exactly what the 2026-05 DOM-overlay removal was about. The wheel's
canvas path survives intact beside the new one. It reads as duplication.
It is not. A gate pins both halves.

Perf was measured before committing (John's cardinal perf rule): at the
real load of 217 strings/frame, canvas **0.24ms** vs DOM **0.22ms**, the
DOM figure *including* a forced layout flush. Bounded set, so it holds.

## 4 · CLOSED THIS SESSION

**a. "the titles position are very missing the space, jumping."**
The 08-02 law "CHIP FLIP HOLDS THE PIN" kept the old seat across a
geometry flip to dodge a measured ~590px teleport. But cascade and fan
put their mass in *opposite halves* (measured on Native-American: seat
dyW −382.8 `above` in cascade, +272.7 `below` in fan — a 655-unit move),
so holding it parked the title *on the drawing* until a later camera
gesture happened to arm the settle watcher. **The trade is dissolved,
not re-taken:** the seat key is left alone (honest re-decision) and
`house_title_ease_ms` (default 220, dial 0–600 at DEV ▸ House ▸ "Title
glide", **0 = the old hard cut**) carries the block to its new hole.

**b. "the subtitles fade shows black outline on fade."**
Closed as a *consequence* of §3, not by a targeted fix. The subtitle is
a DOM node now, so its LOD ramp is element `opacity`, which multiplies
stroke and fill **together**. Verified live. **The whole defect class is
gone**, not just the subtitle.

**c. THE IDENTITY PURGE — do not re-report this.**
John's real name, email and username sat in git history (4 planning docs
from July). It had been surfacing as a "new finding" in every session
for weeks, because the files were cleaned from the *current* tree while
git kept every old copy — and no decision was ever recorded, so each
session met it cold. **Fixed 2026-08-06:** `git filter-repo
--replace-text` over all history, then **the GitHub repo was deleted and
recreated empty** and the clean history pushed. Deletion, not
force-push: force-pushing leaves old objects fetchable by SHA.
**Verified by cloning the remote back down (`--mirror`) and scanning
that** — 0 hits, authors pseudonymous, 2,538 commits, `main` the only
ref. A local scan would not have been proof; the question was what
GitHub holds. **If you ever find an identity leak: the fix is history
rewrite + repo recreate, and the verification must read the REMOTE.**

## 5 · THE WORKLIST — nothing below is started

Ranked by how loudly John has complained. **#1 is the one he called
"medieveal".**

1. **ZOOM-INVARIANCE — the biggest open defect.**
   All house chrome is fixed screen px with no LOD, *and*
   `renderHouseChrome` claims the collision registry **before** the
   god-name pass. Measured, Greek house at gizmo 15%: **3 god names
   printed against 24 chrome strings**, and `THE COURT — 149 OF ALL
   KINDS` renders **225px wide on a house 160px across**. Even at house
   entry the chrome outweighs the names 1.9:1 in ink; by 57% it is
   4.4:1. John: *"stuff like DATES, the scriptorium, court families
   names, they are HUGE when zooming out… the dates becoming huge over
   the nodes are medieveal."*
   **The wheel already has the LOD law the house lacks**
   (`forge.js:5456-5466` — the hull overlay fades 1.0 → 0.53 → 0.0
   between 62% and 16% fit) **and the house explicitly opts out of it.**
   Structural blocker: `rel` (camera scale ÷ house fit scale) is
   computed *inside* the title block and is not visible to the other
   chrome sections — hoist it into `houseChromeEnv` and return it
   alongside `TYPE`. Suggested shape: one `rel`-driven multiplier on
   chrome faces only (never on god names), plus a tertiary-first LOD
   ladder (dates and ports retire first, rail headers last), plus moving
   the date axis / shelf captions / spine names / ports out of the HIGH
   half into `renderHouseChromeLow` so names claim first — the comment
   at `forge.js:6489-6492` already says that is the intent and six
   classes violate it.
2. **THE SIDE PANEL — John approved a FULL REDESIGN. Not started.**
   Measured: panel-vs-canvas contrast **1.03:1** (it has no edge — every
   other pill in the app gets a gold hairline, the largest surface gets
   none); the default state is a 440×1098 black slab holding one line of
   grey text; the hero photo renders *before* the title, putting the
   first sentence of prose at y=996, below his fold; on a scripture the
   "Open in reader" button sits at `offsetTop 15283` — **14 screens
   down**; ten font sizes inside one 440px column. Also
   **387 nodes print build scaffolding to customers** (*"Stub.
   Auto-created 2026-05-20 during the orchestrated initial-wave goblin
   batch…"*). John's call was: **shield it in the panel now** (detect
   the stub and render "This entry is not written yet"), write the
   entries later. If only three things get built: the edge, a standing
   page for the empty state, and title-before-photo.
3. **SCRIPTURE → DEITIES regression.** John: *"when i click on the
   scripture, when back to deities theres no information on the gods."*
   The agent investigating it was killed mid-run (it was driving real
   Safari on his screen) — **never reproduced, never diagnosed.** Start
   from scratch. Suspects worth checking: `lockedSet` shared across
   views, a YAML-id vs file-stem shim that only holds on first load, an
   inspector re-mount losing its data source, a listener removed on
   teardown and never re-bound.
4. **IMAGES — a one-line build bug is the top item.**
   `build_data.py:1442` gates the `depictions` read behind
   `if ntype == "symbol":`, so **every curated depiction on a deity,
   theme, document, person or tradition node is silently discarded at
   build time — 57 nodes are one dedent from a verified image**, incl.
   `amun`, `atum`, `amun-ra`, `tradition-egyptian`, `demiurge`. Then:
   30 `depictions` URLs carry structurally impossible Wikimedia hash
   paths (they never worked); `shiva` (degree 116, the 12th
   most-connected node in the vault) and `tsukuyomi` point at files
   deleted from Commons — both render blank. A Wikidata **P18 fallback**
   would add ~145 more (the REST summary endpoint returns no thumbnail
   for a large class of articles that plainly have art — Yggdrasil,
   Gnosticism, Amun, Geb all answer via P18). Honest coverage is
   **70.9%**, not the 71.7% previously claimed. Realistic ceiling from
   automation ≈ **74.3%**; the remaining ~1,439 are the vault's own
   invented comparative nodes and need human curation.
   Also: `_assets/thumbs_cache.json` (2.6 MB) is **gitignored and
   untracked** yet is the only source for the canvas hover card — a
   `git clean -xdf` destroys every hover image with no recovery but a
   multi-hour re-fetch.
5. Non-default `arcRun` curved caption style still paints on canvas
   (the shipping default is flat and is converted).
6. Carried over, untouched: ~3,120 REVERSE_DIRECTION edges paint their
   idle gradient backwards at dial 0 — a one-line pack-time flip, but it
   visibly changes the idle wheel, so **John's call**; Boards inspector
   restyle needs one eyeball click.

## 6 · RULES THAT EARNED THEIR PLACE

- **A gate that mirrors app logic moves IN THE SAME COMMIT as the law.**
  Two pins mirroring "chip flip HOLDS the pin" were *deleted with the
  law they guarded* — keeping them would have gone green on a law the
  view no longer has. Third time this repo has been bitten by that.
- **A gate can lie about itself.** The new isolate-hide check tripped on
  its *own explanatory comment* — prose ABOUT a selector matching a
  regex looking FOR the selector. Comments are stripped before that test
  now. If a gate fails on a change you believe is right, suspect the
  gate.
- **`claim()` is the ONE label registry (law 5).** Everything that
  prints, canvas or DOM, goes through it. Never add a second collision
  pass. `_forgeDebug.lastPlacedRects()` returns the final rect list —
  assert zero overlapping pairs.
- Every claim grep- or pixel-verified before commit; every batch =
  STATUS entry + commit.

## 7 · HOW TO VERIFY WITHOUT TOUCHING HIS SCREEN

Use the **in-app browser pane**, never `safari-check.py`.

- Dev server: `http://localhost:8742` (never open `index.html` directly —
  PMTiles needs Range requests). Check it's alive before assuming a
  code bug: `lsof -ti :8742`.
- **Size the pane to 2000×1098 (his seat) and then RELOAD** — the app
  sizes its canvases at boot, so a resize without a reload leaves the
  labels canvas at 300×150 and nothing paints. This wasted several
  probes.
- **rAF is throttled when the pane is hidden.** Frame-counting probes
  come back empty and time out. Drive repaints with
  `_forgeDebug.houseSettle()` and measure cost *synchronously*
  (`performance.now()` around the work) rather than by counting frames.
- **Synthetic wheel/pointer events do NOT drive the camera.** Use the
  debug API: `_forgeDebug.enterHouse(fam)`, `houseSettle()`,
  `portList()`, `houseState()`, `lastPlacedRects()`, and
  `_forgeViewSettings.setHouseGeometry('fan'|'cascade')`.
- **To see what is actually painted**, monkey-patch
  `ctx.fillText` on `canvas.forge-labels-canvas` and record
  `{text, ctx.font, letterSpacing, lineWidth}`. That inventory is how
  every finding in §2 was proved.
- **`document.fonts.check()` lies.** Test real ink, or compare
  `measureText` advances between font stacks.
- Gates: `node scripts/check-familytree.mjs`,
  `check-house-interaction.mjs`, `check-house-wires.mjs`. All three must
  pass before commit.

Related: [[HOW-WE-WORK]], [[HANDOFF-2026-08-02-type-pass]],
[[POSTMORTEM-2026-08-01-terminated-2]]
