# HANDOFF — 2026-08-06 · THE FOCUS VIEW BECOMES PAGE TEXT

> John, at the end: *"well done looks sahrp !!!"* — after two rounds of
> me answering the wrong question. Read **§2 THE LESSON** before you
> touch type anywhere in this app; it is the only part of this document
> that will still matter in a month.

---

## 1 · STATE

- **DEPLOYED. tree == live.** codexatlas.org serves `?v=20260806-housetext`
  (forge.js + app.css), through the one gated door (`bash scripts/deploy.sh`).
  Verified by curl after upload.
- Tree CLEAN at `1bff734b`. All three house gates PASS.
- Four batches today: `bbf2377f` (one family-name declaration + the canvas
  finally asks for the vendored fonts) → `406b1dd2` (the re-seat glides;
  the cache-buster that hid batch 1) → `b686a67d` (ring names become page
  text) → `1bff734b` (the whole focus view becomes page text).
- Full detail = the four `2026-08-0[56]` STATUS entries.

## 2 · THE LESSON — type is TWO problems, and they look identical

John said "the fonts are blurry" on 08-02, and it was **three different
causes wearing one complaint**. Each was invisible until the one before
it was fixed:

1. **The canvas never asked for the vendored fonts.** `HOUSE_MONO` was
   `ui-monospace,"SF Mono",Menlo` — JetBrains Mono was *not in the stack
   at all*. Worse, `font-synthesis-weight: none` (the 08-02 fix for fake
   bold) **governs CSS only, never canvas 2D** — so every `600` in the
   house was being synthesised from a 400 system face. Fixed `bbf2377f`.
2. **Two painters, two declarations.** The same tradition name was
   `11px/400/0.18em` on the wheel (SVG) and `12px/600/no tracking` in the
   house (canvas). Five settings, five disagreements. Fixed `bbf2377f`,
   guarded by a cross-source gate that parses BOTH the CSS rule and the
   JS constants and fails on drift.
3. **Two RENDERERS.** ← *this is the one that matters*
   Even at byte-identical settings the two still looked different,
   because **canvas text gets no hinting from the browser's text engine
   and page text does.** No `ctx` setting closes that gap. It is nearly
   invisible at 2× and brutal at 1×, which is why it reproduced on
   John's screen and not in a Retina test.

**THE RULE THAT FALLS OUT OF THIS:** if a string must look *the same* as
another string, it must be drawn by the *same renderer*. Matching the
type is necessary and not sufficient. Before hunting a blur, check which
painter draws each of the two things you are comparing.

**AND: measure before theorising.** I burned a round on glyph
positioning and halo width. Both were ruled out by pixel measurement,
not argument — device-snapping every glyph advance moved partial-coverage
pixels only 43.5%→42.0%, and removing the halo made the ratio *worse*.
That measurement is what pointed at the renderer.

## 3 · WHAT THE ARCHITECTURE IS NOW

- **In a house, the canvas paints ZERO strings.** All seven classes —
  title, subtitle, rank dates, rail headers, shelf captions, spine
  names, god names — are SVG nodes in `#forge-house-text`.
- **The conversion is one line deep.** Every steady chrome string already
  funnelled through `halo()` in `houseChromeEnv`; that function now reads
  the live ctx state and emits a node. **The eight painters upstream
  still speak canvas and none of them changed.** If you add a new house
  string, call `halo()` and you get page text for free.
- **Style is written INLINE from the JS TYPE ladder** so that ladder
  stays the one source of truth. The CSS rule `#forge-house-text text`
  carries *only* the halo shield (`paint-order: stroke fill`).
- **A family name is ONE css rule** — `.forge-hull-label,
  .forge-house-port` — shared by the wheel's ring and the house's
  horizon. They cannot drift again, in type *or* in sharpness.
  Ports deliberately do NOT carry `.forge-hull-label`: the
  `body.fv-isolated .forge-hull-label:not(.is-isolated)` rule retires
  the wheel's titles inside a house and would zero the ring in the very
  house it labels. Gate-pinned both directions.

### ⚠️ THE SPLIT IS LOAD-BEARING — DO NOT "UNIFY" IT
God names go to page text **`if (atHouseNow)` only**. The wheel keeps
canvas, because its label set is *unbounded* (thousands) — which is
exactly what the 2026-05 DOM-overlay removal was about. The wheel's
canvas path survives intact beside the new one. A gate pins both halves.
This looks like duplication. It is not. Leave it.

Perf was measured before committing (the Google-Maps rule): at the real
load of 217 strings/frame, canvas **0.24ms** vs DOM **0.22ms**, the DOM
figure *including* a forced layout flush. Bounded set, so it holds.

## 4 · TWO OLD DEFECTS CLOSED

Both of the defects John named at the 08-02 close are gone:

1. **"the titles position are very missing the space, jumping"** —
   root cause found: the 08-02 law "CHIP FLIP HOLDS THE PIN" deliberately
   kept the old seat across a geometry flip to avoid a measured ~590px
   teleport. But cascade and fan put their mass in *opposite halves*
   (measured on Native-American: dyW −382.8 `above` in cascade,
   +272.7 `below` in fan — a 655-unit move), so holding it parked the
   title on the drawing until a later camera gesture happened to arm the
   settle watcher. **The trade is dissolved, not re-taken:** the key is
   left alone (honest re-decision) and `house_title_ease_ms` (default
   220, dial 0–600 in DEV ▸ House ▸ "Title glide", **0 = the old hard
   cut**) carries the block to its new hole. `406b1dd2`.
2. **"the subtitles fade shows black outline on fade"** — closed as a
   *consequence* of §3, not by a targeted fix. The subtitle is a DOM node
   now, so its LOD ramp is element `opacity`, which multiplies stroke and
   fill **together**. A halo can no longer outlive a fading glyph.
   Verified live: `stroke rgba(0,0,0,0.7)` under `opacity 0.5` → both at
   0.5. **The whole defect class is gone**, not just the subtitle.

## 5 · WHAT IS STILL OPEN (nothing below is started)

Ranked by how loudly John has complained:

1. **ZOOM-INVARIANCE — the biggest one.** All house chrome is fixed
   screen px with no LOD, *and* `renderHouseChrome` claims the collision
   registry **before** the god-name pass. Measured, Greek house at gizmo
   15%: **3 god names printed against 24 chrome strings**, and
   `THE COURT — 149 OF ALL KINDS` renders **225px wide on a house 160px
   across**. Even at house entry the chrome outweighs the names 1.9:1 in
   ink. John: *"the dates becoming huge over the nodes are medieveal."*
   The wheel already has the LOD law the house lacks
   (`forge.js:5456-5466`) and the house **explicitly opts out** of it.
   Full analysis + a proposed hierarchy ladder is in the audit findings
   quoted in the 08-06 STATUS entries.
2. **THE SIDE PANEL — John approved a FULL REDESIGN, not yet started.**
   Measured: panel-vs-canvas contrast **1.03:1** (it has no edge); the
   default state is a 440×1098 black slab; the photo renders *before* the
   title, putting first prose at y=996 — below his fold; on a scripture
   the "Open in reader" button sits **14 screens down**. Also
   **387 nodes print build scaffolding to customers** (*"Stub.
   Auto-created … during the orchestrated initial-wave goblin batch"*) —
   John's call was: shield it in the panel now, write the entries later.
3. **SCRIPTURE → DEITIES regression.** John: *"when i click on the
   scripture, when back to deities theres no information on the gods."*
   The agent investigating it was killed mid-run (it was driving real
   Safari on John's screen) — **never reproduced, never diagnosed.**
   Start from scratch, and do NOT use safaridriver (see §6).
4. **IMAGES — a one-line build bug is the top item.**
   `build_data.py:1442` gates the `depictions` read behind
   `if ntype == "symbol":`, so **every curated depiction on a deity,
   theme, document, person or tradition node is silently discarded at
   build time — 57 nodes are one dedent from a verified image**, incl.
   `amun`, `atum`, `amun-ra`, `tradition-egyptian`, `demiurge`. Then:
   30 `depictions` URLs carry structurally impossible hash paths (never
   worked); `shiva` (degree 116) and `tsukuyomi` point at files deleted
   from Commons; a Wikidata P18 fallback would add ~145. Honest coverage
   is **70.9%**, not the 71.7% previously claimed. Realistic ceiling from
   automation is ~74.3% — the remaining ~1,439 are the vault's own
   invented comparative nodes and need human curation.
5. Non-default `arcRun` curved caption style still paints on canvas
   (the shipping default is flat and is converted).
6. Carried over, untouched: ~3,120 REVERSE_DIRECTION edges paint their
   idle gradient backwards at dial 0 (a one-line pack-time flip, but it
   visibly changes the idle wheel — **John's call**); Boards inspector
   restyle needs one eyeball click.

## 6 · RULES THAT EARNED THEIR PLACE TODAY

- **JOHN ONLY LOOKS AT `codexatlas.org`.** He said it outright:
  *"im here https://codexatlas.org — ps i dont look at anytning except
  here."* Local verification is not delivery. **Ask which URL before
  diagnosing any "still not fixed".**
- **An un-bumped `?v=` ships nothing.** Batch 1 was committed, gate-green
  and completely invisible to him because `index.html` still requested
  the old cache-buster. Treat the bump as part of the edit, not a release
  chore. Rebuild `_bundle.js` too when a `src/js/forge/*` module changed.
- **NEVER drive real Safari.** `scripts/safari-check.py` opens windows on
  John's screen; he stopped a whole agent fleet over it — *"why you are
  bashing me with pop up windiws to look repetidely to the same thing?"*
  Use the in-app browser pane instead. **Its rAF is throttled when the
  pane is hidden** — that is why frame-capture probes come back empty;
  drive repaints with `houseSettle()` and measure cost synchronously
  rather than by counting frames.
- **A gate that mirrors app logic moves IN THE SAME COMMIT as the law.**
  Two pins mirroring "chip flip HOLDS the pin" were *deleted with the law
  they guarded* — keeping them would have gone green on a law the view no
  longer has. Third time this repo has been bitten by that.
- **A gate can lie about itself.** The new isolate-hide check tripped on
  its *own explanatory comment* — prose ABOUT a selector matching a regex
  looking FOR the selector. Comments are stripped before that test now.
- Every claim grep- or pixel-verified before commit; every batch =
  STATUS + commit.

Related: [[HANDOFF-2026-08-02-type-pass]], [[POSTMORTEM-2026-08-01-terminated-2]]
