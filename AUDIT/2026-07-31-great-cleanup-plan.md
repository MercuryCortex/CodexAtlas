# THE GREAT CLEANUP — plan of record (2026-07-31)

> Produced from SIX parallel read-only audits run the evening after the termination
> post-mortem: ① app-code architecture · ② THE HOUSE vs the ratified toy · ③ CSS/shell/
> panels · ④ data pipeline + scripts + gates · ⑤ security/anonymity/deploy · ⑥ docs +
> process. Nothing was modified during the audits. Every claim below was grep-verified
> by an auditor with file:line evidence (kept in the session transcripts; the load-
> bearing refs are repeated here). All paths repo-relative.

## The verdict in one paragraph

The foundation is SOUND: the engine layer is clean and contract-shaped, the bundle
discipline works and is fresh, `panel-kit.js` is the right "one dial machine", git
authorship is pseudonymous across all history, and the deployed artifact carries zero
identity strings. The Frankenstein is real but LOCAL — five named diseases: (1) two
monolith files (`app.js`, `views/forge.js`) carrying a dead V01 civilization and
embedded content data; (2) forked truths — 4 palettes for the same 7 buckets, 2
scripture readers, 5+ panel machines, 23 localStorage keys in 4 naming styles;
(3) a house implementation that drifted from the ratified toy on exactly the points
John flagged, with gates PINNING the drift; (4) dead weight — ~24 one-off scripts,
~160 dead CSS classes + ~2–3k URL-only lines, dead modules still loading, stale
hand-bumped `?v=` stamps; (5) meta-docs that misroute agents (stale HANDOFF chain,
contradictory onboarding, no single worklist). None of this needs a rewrite.
Every fix has a clean seam.

---

## Phase 0 — SAFETY LOCKS (first; small; ~one sitting)

1. **Scrub the machine handle + absolute home paths** from the two tracked AUDIT
   files that carry them (`AUDIT/2026-07-31-house-audit-and-build-order.md` lines
   ~55/139; `AUDIT/2026-07-31-house-wave1-review.md` ~6 sites). Redact patterns
   (star-out the handle), rewrite paths repo-relative.
2. **Harden the founder-kit `audit.sh`**: promote the machine handle from warn-only
   to HARD fail; add a pattern for absolute home paths; make the gate also cover
   `dist/` — and add a pre-deploy invocation so `wrangler pages deploy` cannot ship
   unscanned (today pushes are gated, deploys are not).
3. **Loopback the dev servers**: `scripts/serve.py` + `scripts/serve-node.js`
   currently bind ALL interfaces and serve the repo root — including the identity-
   mapping file — to the LAN. Bind `127.0.0.1`, disable serve.py directory listing,
   fix the serve-node root-prefix check (missing trailing separator).
4. **SFW assertion in `scripts/build_dist.py`**: it reads full MAGNUM `data.js`
   directly (line ~39), bypassing CODEX §IX. Zero nodes are flagged today, so
   nothing has leaked — but add a hard refusal if any `political_risk_flag: true`
   exists, until the SFW step is properly wired.
5. **Pre-commit Lane-A regex**: extend to `3[0-9]_` — `31_consciousness/` is
   currently invisible to the cross-lane guard, linkcheck and lint.

**Decisions John must make in Phase 0** (both irreversible/outward — confirm, don't
assume): **(a)** delete-and-re-push the private GitHub repo to purge the real
name/handle from pushed HISTORY (scrubbed at HEAD already; cheap now — recommended);
**(b)** confirm that the alpha's static data being fetchable WITHOUT login is the
intended posture (the allowlist gates sync only, not content).

## Phase 1 — THE HOUSE MADE RIGHT (John's priority order, from the post-mortem)

Standing rule for every item: open `design/family-tree.html`, diff first; any gate
assertion that PINS a rejected decision is flipped in the SAME commit; an item is
done only when John has clicked it on the deployed site.

1. **Title block centred at top of inner circle** — `houseTitleAnchor` has only
   `'left'|'right'`; add `'center'`, default it, chips ride along. Flip the gate
   pins (`scripts/check-familytree.mjs:639`, `:771–839`) same commit.
2. **Dates as an AXIS** — `familytree.js:1033` already computes `lineY` per row and
   NOTHING draws it: consume it (one faint chord-clamped stroke per bed, toy
   :820–837), and move the caption anchor to a FIXED left gutter outside the widest
   bed (toy :1042–1058) instead of per-row width.
3. **Balance the band arcs about the horizontal axis** — asymmetric by construction
   (24° top vs 12° bottom gap + 230wu head reserve; `familytree.js:167,174,200,
   1417–1429`). Equalise or centre content after the head reserve; add a symmetry
   assertion to the gate.
4. **Curved text → horizontal** (recommended; the ratified design has ZERO curved
   text and John called it random twice): replace `arcRun` call sites with straight
   halo labels; DELETE `renderBandCaptions`' rotation machinery + the arc-budget
   constants sized for it. *(Decision (d) — his final taste call, but the default
   is horizontal.)*
5. **A direct god-size slider, named "God size"** — thread `NODE_R_FRAC`
   (`familytree.js:88/874`, today a hard constant) as an opt from a new house-panel
   row. Stop offering adjacent controls as substitutes.
6. **Findability from his seat** — first house entry auto-opens the HOUSE panel
   once (via panel-kit's open-state law) + the hint line points at it. Test with a
   PLANTED legacy localStorage state, per the standing memory rule.
7. **The four ratified-but-never-applied fixes** from the build-order: aspect-cycle
   reachability guard (`familytree.js:573–576` + delete the false ":593 fires zero
   times" comment), the fan `/2` in BOTH files (`familytree.js:1086` + toy:521),
   RK floor above the 13-cap (`:695–696`), and gate coverage: `cyclesBroken===0`
   for EVERY family (today Greek only, while Celtic's break prints mid-run and the
   gate passes) + a fan-span assertion (none exists).
8. **Comment sediment** — collapse the five wave essays (~45% of `familytree.js`)
   into one current-truth header.

## Phase 2 — THE GREAT DELETION (zero-risk; every item auditor-verified dead)

- **Dead modules on disk**: `src/js/alphabets/glyph-viewer.js`, `mysticism.js`,
  `origin-chain.js`, `src/js/engine/icon-library.js` — loaded from nowhere.
- **Dead loaded subsystem**: `src/js/graph/theme.js` + `layout.js` + `renderer.js`
  + their 3 script tags (`index.html:263–265`) + `_renderPantheonWebGL`
  (`app.js:1006`, zero callers) — one commit.
- **Dead CSS ~500 lines** (themes-menu/tm, style-menu, nav-hub, side-tab, acv/acc/
  af, atlas-marker/cluster, dead ph2 subset, boards-inspector fossils, misc — the
  UI audit's list) + their dead JS callsites (`app.js:659–660, 9450–9458, 9611,
  9740–9743`) in the SAME commits, per law 8.
- **Archive 24 dead one-off scripts** → `scripts/_archive/` (all `apply_*`,
  `migrate_*`, `singularize_*`, the May thumbnail trio, etc. — pipeline audit's
  list; all verified zero live refs, outputs long committed).
- **Untrack** (git rm --cached): the 16 stale `99_ingest/` files (dir stays as
  linkcheck's sink), `src/js/forge/_bundle.js` (generated; rebuild instead), and
  the two ~27MB HD `.mov` files the deploy already strips.

**Decision (c) for John**: the ~25 URL-only V01 views inside `app.js` (+ ~2–3k CSS
lines + 5 astrology scripts they keep alive). They are reachable only by typing
`?view=...`. Recommended: DELETE from the live tree — V01 is already preserved at
`_legacy/`. This single move shrinks `app.js` by roughly 60% and is the biggest
de-Frankenstein step available.

## Phase 3 — ONE LOGIC (convergence)

- **One color/label truth**: a single bucket-color + type-human-label export;
  inspector, side-panel and legend read it live. Delete `inspector.js:117–124`'s
  "Keep in sync" copy and the duplicated TYPE_HUMAN/SUBTYPE_HUMAN tables.
- **One dial machine**: migrate FX panel, Style panel and VIEW settings onto
  `panel-kit` (kit gains a `cssvar` apply mode + a `color` row kind); `dev-panel.js`
  dies with the V01 pantheon view (or folds in if that view survives decision (c)).
  Replacing `view-settings.js:39–70` with the kit's per-key merge kills the LAST
  seed-only-when-missing site — the bug-class that shipped three invisible controls.
- **One scripture reader**: fold `views/scripture-reader.js` + `forge/scripture-
  reader.js` onto one catalog + renderer with two mounts.
- **One state schema**: one LS namespace (values blob + open-state blob, per-key
  merge, `seedFrom` migration); one writer per key (fix the
  `codex_atlas_timeline_band_scale_v4` double-writer, `forge.js:3025`).
- **Cache stamps from content hash**: a build step rewrites every `?v=` — kills the
  silent-stale class (5 files stale today; `engine/graph/node.js` by two months —
  the likely mechanic behind some "nothing changed" sessions).
- **One edge-store**: migrate `_graph/influences.md` (the last hand-maintained
  parallel edge file, live input at `build_data.py:1489`) into per-node YAML and
  retire the parser. Extend linkcheck to validate node ids inside `src/data/*.js`
  (chains/patterns/scripture-texts — today they can rot silently).

## Phase 4 — THE BIG CARVE (heaviest; only after 1–3 have landed)

- `app.js` → `shell` (STATE/routing/tooltip/style) + one file per surviving view +
  move `SCRIPTURE_CORPORA` (~1,700 lines) and `INVESTIGATIONS` (~400) into
  `src/data/`.
- `views/forge.js` → carve along its existing banner seams via the proven bundle
  `attach()` pattern (constants → data module; hulls+wedges, canvas labels, house
  chrome, interaction, persistence → `forge/` modules); `render()` stays
  orchestration. The 13 `wire*Panel()` bridges mark the seams already.
- Cadence: commit every 1–2 carves, all gates green each step, deploy + John-click
  checkpoints between chunks.

## Phase 5 — GATES AIMED AT JOHN'S SEAT + PAPER

- Wire `check-familytree` / `check-house-*` into pre-commit for `src/js/engine/**`
  + `src/js/views/forge.js` changes (headless, fast; today they run on memory
  alone). `safari-check.py` remains the pre-deploy pass.
- Sweep every `must()` source-pin that froze a REJECTED decision; gates assert the
  ratified design, not the shipped accident.
- Docs: create **`00_meta/WORKLIST.md` — the ONE open worklist** (seeded from the
  docs audit's consolidated list, house tier on top); `HANDOFF.md` becomes a
  pointer to the current handoff only; `AGENTS.md` → 5-line pointer at
  HOW-WE-WORK; patch HOW-WE-WORK drift (folder range through 31, drop the
  nonexistent VIEW-CONTRACT refs, hook-coverage note); rotate `STATUS.md`
  (pre-07-01 → `status-archive/`); add `AUDIT/INDEX.md` (one row per doc:
  IMPLEMENTED / OPEN / OBE); close the two phantom "started" rows in ACTIVE-UX and
  archive finished ACTIVE-CONTENT rows; regenerate DASHBOARD; rewrite
  HOW-TO-OPEN.md + README.md to match reality.

## What we deliberately do NOT touch

- The engine layer, guest-augmentation/exit machinery, posB/`uLayoutMix` lanes,
  bundle system, `panel-kit.js`, the interaction laws — audited SOUND; rebuilding
  them would re-open closed defects.
- No git history rewrite without John's explicit go (decision (a)).
- Nothing public-facing changes without confirm.

## The four decisions pending John

| # | Decision | Recommendation |
|---|---|---|
| a | Delete-and-re-push the private repo to purge identity from pushed history | YES — cheap now, only gets more expensive |
| b | Alpha data fully public without login — intended? | Confirm intent; if not, gate at Cloudflare |
| c | Delete the ~25 URL-only V01 views from the live tree | YES — V01 preserved at `_legacy/` |
| d | House captions: horizontal (ratified) vs curved (shipped) | HORIZONTAL — matches the toy + his stated read |
