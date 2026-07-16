# PRE-ALPHA PRODUCT + ARCHITECTURE REVIEW — 2026-07-16 (fable)

> **Scope:** read-only review ahead of hosting the app for a small group of trusted alpha
> testers. Every claim below was grep/measure-verified in this session (sizes are real
> `stat`/`gzip` numbers, dead-code claims are element-grep verified per the cardinal rule).
> Every recommendation is checked against `00_meta/app-architecture.md` (the contract);
> the two places where a recommendation *evolves* the contract are explicitly flagged.
>
> Tags: **[pre-alpha]** = do before friends touch it · **[later]** = post-alpha.

---

## Executive summary

The product is real and the contract discipline shows — but the app today is built for its
*author*, not for a first-time guest. The single highest-leverage pre-alpha work is not a
feature: it is (1) a 10-minute-of-reading first-run frame so a tester knows what they are
looking at, (2) cutting the boot payload (44 MB `data.js` is ~56% node body-text that
nothing needs at boot), (3) resurrecting the *already-written but dead* account/statement
code in `app.js` into the live user menu so the "sign in → my boards" signal lands, and
(4) deploying an explicit **public subset** — the web root currently *is* the entire
source vault, strategy docs and all.

---

## A. PRODUCT — cleanup & reframing

### A1. The one-line promise, and the first run that doesn't deliver it — **[pre-alpha]** · impact: highest

The promise is already written, and it's good — it lives in *dead code*
(`src/js/app.js:841`, the unreachable Atlas Statement modal):

> *"An investigation tool. We surface; we cite; we tier; we never assert."*

Public phrasing suggestion: **"Trace how every sacred idea traveled — from the oldest
scriptures to the world you live in — with cited, tiered evidence."** The
Trace-to-Modernity work (audit 2026-07-12 §3.1) is this sentence as a gesture.

What a tester actually gets: the boot router (`src/js/app.js:9806`) drops them straight
into the Forge wheel — 5,374 nodes, no title, no framing, no "what is this / what do I do
first". For a knowledge-graph product the blank-wheel first paint reads as *screensaver*,
not *investigation*.

**Cheapest fix that fully lands (1 short session, fully contract-compatible):**
- A **first-visit welcome card** — one modal, shown once (LS flag), built on the
  `.codex-modal` pattern that already exists in `app.js:826-860` (`openAtlasStatement`).
  Serif headline = the promise, mono sub-line, then **three doors**:
  1. *"Open an investigation"* → load one curated preset board (the `BOARDS_LIBRARY`
     massive-wins presets already exist — `src/data/boards-presets.js`).
  2. *"Read something ancient"* → `setView('scripture')` on a hero text.
  3. *"Just explore"* → dismiss to the wheel.
- This is §1/§3/§5-clean: reuses the modal primitive, no new tokens, no new z-tier
  (`codex-modal` already has one).

### A2. View sprawl — hero surfaces vs. flag-hidden — **[pre-alpha]** · impact: high

The V2 master pill (`src/js/app-pill.js:50-74`) exposes **7 slots** (ATLAS, TIMELINE,
BOARD, MAP, STAR MAP, ALPHABETS, INVESTIGATION), plus GENEALOGY as a forge layout, plus
Scripture reachable only from inside Forge. For an alpha:

| Surface | Verdict | Why |
|---|---|---|
| **ATLAS** (forge wheel) | **Hero** | The spectacle; first paint. |
| **BOARD** | **Hero** | The signal feature (A4). |
| **Scripture READ** | **Hero — promote** | 234 docs covered, real polish ceiling; today it has *no top-level entry* (only reachable via Forge codex-controls, `src/js/forge/codex-controls.js:874`). A guest will never find it. Consider a READ entry in the master pill for alpha. |
| **INVESTIGATION** | Keep | 1,252 findings; it's the "what did you actually discover" answer. |
| TIMELINE / GENEALOGY | Keep (cheap) | Same engine, real payloads. |
| MAP | Keep | Real build (2026-06-13), verified functional module. |
| ALPHABETS | Keep or soft-hide | Real, but a side-quest for a first session. |
| **STAR MAP** | **Hide behind flag** | It is a construction note (`src/js/views/starmap.js:33-43`). A visible master-pill entry that renders "Under construction" **violates the app's own §8 rule** ("visible affordances must work"). Add `FEATURES.starmap: false` to the existing flags block (`src/js/app.js:30-37`) and filter `MASTER_VIEWS` on it. This is exactly what §8 exists for — zero contract friction. |

Also hide for alpha (same mechanism, minutes of work):
- **User-menu "Dev → Overview"** (`src/js/user-menu.js:53-58`) — gate behind the existing
  `codex-atlas/dev-enabled` flag that `dev-panel.js:519-540` already uses. Operator
  tooling should not be one click away from a guest.
- **"Codex Shop (soon)"** (`src/js/user-menu.js:42`) — a disabled shop teaser in a
  pre-alpha reads as vaporware; cut the row until there's a shop.

### A3. URL router lets testers wander into the V1 graveyard — **[pre-alpha]** · impact: high

The boot whitelist (`src/js/app.js:9811`) accepts **any** key of `VIEWS` — including
`?view=timeline`, `?view=atlas`, `?view=astrology`, `?view=documents`, `?view=authors`,
`?view=edges`, `?view=all`, `?view=transmission`… the V1 render paths that `index.html:109-115`
itself documents as "unreachable from the V2 master-pill router… queued for deletion."
They are *not* unreachable — they are one shared URL away, and they render against deleted
V01 chrome (null-guarded, but degraded). Alpha testers share URLs.

**Fix:** replace `hasOwnProperty(VIEWS, explicit)` with an explicit V2 allowlist
(`forge, boards, maps, starmap, alphabets, investigation, scripture, pantheon`). One line.
Pairs with B5 (deleting the V1 blocks makes the whitelist self-healing again).

### A4. The signal moment — yes, Boards is the right hero, and it's 80% built — **[pre-alpha]** · impact: high

Verified state: Boards v1 has **multi-board named persistence** (shape
`{boards:[{id,name,cards,pan,zoom,…}], currentBoardId}` at `src/js/views/boards.js:719-745`),
an explicit Save-tree flow, and a **MY BOARDS** list with delete already in the
Investigation menu (`src/js/forge/boards-controls.js:210-290`). Meanwhile the *live* user
menu has `alert('Sign in… coming with the SaaS launch')` stubs (`src/js/user-menu.js:144-149`)
— while a **complete, better account stub sits dead in `app.js`** (see B6).

The shortest path to "friends FEEL functionality" is a weekend-sized stitch, no backend:

1. Resurrect the LS account state-machine (`ACCT_KEY` at `src/js/app.js:806-816`,
   sign-in/out flow at `:930-940`) into `user-menu.js` — display-name sign-in, signed-in
   header state. (It already behaves like a real auth flow by design — that was its
   stated purpose.)
2. Give the user menu an **Account / My Boards panel**: name + the saved-boards list
   (data already in `atlas.boards.v1`) + click-to-open. That *is* the profile page, v0.
3. Seed one **starter board** from `boards-presets.js` on first run so Save-tree has
   something to save in the first five minutes.
4. **[later]** Trace-to-Modernity (audit §3.1) is the true signature demo — right choice,
   but it's a feature build; don't gate the alpha on it. Note-cards (audit §3.5) is the
   cheapest board upgrade if there's spare time.

First-session script this enables: welcome card → open preset board → drag, expand, read
a node → sign in with a name → save the board → reload → it's still there, under *your*
name. That's the whole signal.

### A5. Naming/jargon for a non-initiate — **[pre-alpha]** (microcopy only) · impact: medium

The master pill already did the hard rename (engine "Forge" surfaces as **ATLAS** —
correct instinct). Remaining friction, all microcopy, no renames of code:

- **"Save tree"** (`boards-controls.js:77`) → "Save board" — a guest doesn't know boards
  were once trees.
- **"Pantheon", "wedges", "wires"** — never surface these in guest-facing copy; say
  "families", "connections". (Internal vocabulary is fine internally.)
- **Hints like "(stub · SaaS pivot WIP)"** (`user-menu.js:34-35`) — internal status
  leaking into UI; either the A4 fix removes them or cut the hints.
- **"V01 prototype (reference · new tab)"** (`user-menu.js:49`) — dev-gate it with A2's
  flag; guests should not tour the legacy snapshot.
- The four **`alert()` dialogs** in `user-menu.js:144-163` are the single most
  embarrassing surface in the app for a technical friend — native OS alerts with stale
  copy. Replace with the `.codex-modal` pattern (A1 resurrects it anyway).
- **Stale hardcoded stats:** the About alert says "4746 nodes · 21,757 edges"
  (`user-menu.js:155`); live data is 5,374 / 27,033. The dead `app.js` version already
  did this right — it read `window.VAULT_DATA` live (`app.js:783-793`). Port that.

### A6. Zero page identity — **[pre-alpha]** · impact: small, minutes

`index.html:1-12` has no favicon, no `<meta name="description">`, no OG tags. Testers
will share links; the tab shows a blank default icon. One `<link rel="icon">` (the ✦
glyph as SVG data-URI keeps it self-contained) + one description line. No contract impact.

---

## B. ARCHITECTURE / CODE

### B1. The 44 MB `data.js` — the #1 hosting risk, with a cheap staircase down — **[pre-alpha]** · impact: highest

Measured: `data.js` = **44.1 MB raw / 12.2 MB gzip**, loaded as the *first* synchronous
`<script>` (`index.html:176`) — nothing paints until it transfers *and* parses. On a
hosted alpha that is a 12 MB download before first pixel; on mobile Safari the parse +
retained `VAULT_DATA` heap is a realistic tab-kill. Composition (measured from the live
payload):

| Slice | Size (compact JSON) |
|---|---:|
| Full payload | 39.6 MB |
| — node `body` markdown | **22.3 MB (56%)** |
| — nodes minus bodies | 11.2 MB |
| — edges | 6.0 MB |

The staircase, in order of effort — **no bundler, all §9-compatible**:

1. **Free: stop pretty-printing.** `build_data.py:1621` serializes with `indent=2` —
   that alone is 44.1 → 39.6 MB raw (gzip gain smaller but real, and parse is faster).
   One-line change: `json.dumps(out, separators=(',',':'), ensure_ascii=False)`.
2. **The big one: split bodies out of the boot payload.** Nothing at boot needs 22 MB of
   markdown — bodies render on node *inspection*. Emit a second artifact from
   `build_data.py` (e.g. `data-bodies.js` or sharded `bodies/<lens>.json`) and lazy-load
   on first inspector open (the inspector already treats `body` as optional — boards even
   have a "No body text recorded" fallback, `src/js/views/boards.js:265`). Boot payload
   drops to ~17 MB raw / **~4–5 MB gzip**. This is a build-script + one-loader change,
   not an app rewrite.
3. **Host-level compression: serve brotli.** 12.2 MB gz → likely ~8–9 MB br for the full
   file, ~3 MB for the post-split core. Any static host (Cloudflare Pages, Netlify) does
   this for free — just verify it applies to `.js` this large (some hosts cap
   compressible size; check before launch day).
4. **Boot splash:** until (2) lands, an inline-CSS loading state in `index.html` above
   the script tags, so the 12 MB wait shows the brand instead of a white page.
   (`#missing-data` exists but only fires on *error*.)
5. **[later]** Move from script-literal to `fetch()` + `JSON.parse` (faster parse path,
   enables progress UI), and per-lens sharding. Not needed for alpha.

### B2. `scripture-texts.js` (5.7 MB / 1.5 MB gz) loads on every boot — **[pre-alpha]** · impact: high, low risk

`index.html:255` loads all staged reader texts unconditionally, but the reader only opens
via explicit navigation. Lazy-inject it: a tiny loader in
`src/js/views/scripture-reader.js` that appends the script tag on first reader open and
awaits `window.SCRIPTURE_TEXTS`. Data-only module, no ordering hazard, ~1.5 MB off every
cold boot. Same pattern later for `src/data/investigation-index.json` (2.7 MB — already
fetched by the view itself, good) and `chains/patterns/observations.js` if their views
are flag-hidden for alpha.

### B3. Two load-bearing CDN dependencies + a 25-family font request — **[pre-alpha]** (d3/marked) / **[later]** (fonts)

`index.html:177-178`: `d3` from `d3js.org` and `marked` from `cdn.jsdelivr.net`. d3 is
load-bearing for `app.js` — if the CDN is down/blocked (corporate networks, ad-blockers
hitting jsdelivr), the app is a blank page. Vendor both into `_assets/vendor/` exactly
like maplibre/sigma/elk already are (the standing memory "vendor d3+marked locally"
agrees; this is an hour). Also removes third-party request logging of your testers — the
privacy-by-default posture this project runs on.

Fonts: `index.html:9` pulls ~25 Google-Fonts families in one blocking stylesheet.
**[later]** self-host the three core families (Cormorant Garamond / Inter / JetBrains
Mono per §2) and lazy-load the Noto script fonts (they exist for glyph rendering in
specific views). For alpha, at minimum add `&display=swap` is already present — acceptable.

### B4. Script-load-order fragility: 33 hand-ordered tags — **[pre-alpha]** (cheap hardening only)

`index.html:176-292` is 33 `<script>` tags whose correctness is maintained by prose
comments ("must load BEFORE forge.js…", "boot-race fix…"). Real risks: a reorder or a
missed tag fails *silently* (null globals caught by guards) or as a boot crash; and the
`?v=` cache-busters are **hand-stamped and already stale** — `data.js?v=20260621-035413`
(`index.html:176`) while the live `data.js` says `generated_at 2026-07-14`. Locally the
dev server sends `no-store` so nobody noticed; **on a real CDN host stale `?v=` means
testers get month-old cached data after your next content push.** Cheapest hardening,
in order:

1. **Automate `?v=` stamping** in `build_data.py` (it already rewrites `data.js`; have it
   also rewrite the `?v=` on `data.js` + `src/data/*.js` tags in `index.html`). This is
   the one that will actually bite during the alpha.
2. **A boot-assert prologue** — a 20-line inline script at the end of `<body>` that
   checks the required globals (`VAULT_DATA, d3, marked, AtlasEngineLayout, _boardsView,
   …`) and swaps in a styled "failed to boot — missing X" card instead of a silent
   half-render. Turns any future ordering mistake into a labeled error.
3. **[later] Extend the concat-bundle precedent.** `src/js/forge/_bundle.js` +
   `scripts/build-forge-bundle.sh` already proved the §9-compatible answer: *generated
   concatenation, not a bundler*. Apply the same to the `engine/*` group and the
   `views/*` group → 33 tags become ~8, order encoded once in a build script.
   **Contract note:** recommend adding one sentence to §9 blessing "generated
   concatenation + version stamping" explicitly, so no future agent mistakes this for
   bundler-creep. (Explicit contract evolution, minimal.)

### B5. `src/js/app.js` (606 KB): most of it is verified-dead or unreachable V1 — deletion IS the modularization — **[pre-alpha]** · impact: high

Two grep-verified facts:

- **`mountNavHub` (app.js:658-989, ~330 lines) is dead code.** It guards on
  `#nav-hub-trigger` (`app.js:659-661`) which exists nowhere in `index.html` except a
  comment (`index.html:91`) — the IIFE early-returns on every boot. Dead-but-valuable:
  it contains the *only real* account stub and the Atlas Statement modal (see B6/A4).
- **The V1 VIEWS blocks are ~5,500–6,000 of app.js's 9,846 lines** and unreachable from
  the V2 pill: `_legacyPantheon` (1388–2240), `documents` (2240–2479), `timeline`
  (2479–5085 — 2,600 lines alone), `alchemy`/`transmission` (5822–6820), `atlas`
  (6820–7625), `authors`/`themes`/`edges`/`traditions`/`all` (7625–7911), `astrology`
  (7931+). `index.html:109-115` marked them "queued for deletion" on **2026-05-30** —
  seven weeks ago. They are reachable *only* via the `?view=` hole (A3).

Deleting them (after trimming the router allowlist, and after extracting the two live
functions noted in B6) takes app.js to roughly **~250 KB / ~4,000 lines** with zero
behavior change — the cheapest possible "split the monolith" and it is *mandated* by the
project's own rule #8 (scorched-earth, no zombie code). Everything genuinely live in
app.js (FEATURES, STATE, setView, VIEWS.forge/boards/maps/starmap/alphabets/
investigation/scripture/pantheon glue, boot router) is a sane single file for a
no-bundler app. Do the deletion in its own commit with the standard grep-verify gate
(memory: never claim dead without the grep — the greps above are in this review's
session log; re-run them at deletion time).

### B6. The account/auth seam: two parallel implementations, the good one dead — **[pre-alpha]** (stitch) / **[later]** (backend) · impact: high

Current state, verified:

| | Live `src/js/user-menu.js` | Dead `src/js/app.js:806-989` |
|---|---|---|
| Sign in | `alert("coming with SaaS launch")` (`:149`) | Real LS state machine: `ACCT_KEY='codex-atlas/account-v1'`, `readAccount/writeAccount`, display-name sign-in, sign-out, signed-in UI state (`:806-940`) |
| Atlas Statement | `alert("coming soon")` (`:152`) | Full styled `.codex-modal` with the CODEX §I–V abstract (`:826-860`) |
| About stats | Hardcoded, stale (`:155`) | Reads `window.VAULT_DATA` live (`:783-793`) |

**Readiness verdict:** the *shape* is right and deliberately so (the dead code's own
comment: "UI behaves identically to a real auth flow so the wiring is testable; the
server-side identity check plugs in later"). What's missing for a real backend is only:
no session/token concept, no server identity, and the state is a single unversioned LS
blob per browser.

**The clean seam (no rewrite):** extract one module, `src/js/account.js`, exposing
`window.AtlasAccount = { read(), signIn(profile), signOut(), onChange(cb) }`, backed by
the existing LS logic today. `user-menu.js` renders from it; Boards **[later]** namespaces
its LS key per account id (`atlas.boards.v1` is already versioned —
`src/js/views/boards.js:732` — so a migration path exists). When a real backend arrives
(any auth-as-a-service), only `account.js` internals change, and server-enforced access
rules go with it per the standing security law. For the alpha itself, **LS-only is
correct** — do not stand up real auth for trusted friends; it would add prohibited-level
risk surface (credentials) for zero alpha signal.

### B7. The web root is the entire source vault — deploy an allowlist subset — **[pre-alpha]** · impact: high (IP + method exposure)

The directory `index.html` lives in also contains the **31 content directories**
(`02_documents/` … `31_consciousness/` — the vault source, i.e. the product's moat),
`00_meta/` (strategy, handoffs, HOW-WE-WORK), `AUDIT/` (including this file),
`scripts/`, `build_data.py`, and `_legacy/`. Any static host pointed at the repo root
serves *all of it* to anyone who guesses a path. Nothing here is an identity leak
(grep-verified: no real name/email/username anywhere in the served tree; git author is
the pseudonym) — but it hands out the entire content corpus and working method.

**Fix:** a `scripts/build-deploy.sh` that stages an explicit allowlist —
`index.html, src/, data.js, _assets/vendor/, _assets/bg/ (see B8), _assets/basemap/,
_assets/placeholders/, _assets/audio/` — into `dist/` (already gitignored) and deploys
*that*. Run the `_FOUNDER-PROTOCOL/SECURITY-CHECKLIST.md` gate on `dist/`, not the repo.
Never point a host at the repo root, and keep the GitHub repo private regardless.

### B8. Heavy-asset hosting facts to settle before picking a host — **[pre-alpha]** · impact: medium

- **PMTiles basemap = 177 MB** (`_assets/basemap/world-z7.pmtiles`) and **requires HTTP
  Range support** (the local `scripts/serve-node.js` exists precisely for this). Most
  CDNs (Cloudflare Pages/R2, Netlify) support Range on static assets — verify with a
  `curl -r 0-1023` on the deployed URL before calling MAP done. It's gitignored, so the
  deploy pipeline must upload it out-of-band; a 177 MB file also exceeds some hosts'
  per-file caps (Cloudflare Pages caps at 25 MB — R2 or a different host/bucket for this
  one file). This is the single biggest host-selection constraint.
- **Background videos: 52 MB of `.mov`** (`_assets/bg/bg-x1/x2-hd.mov`, 26 MB each).
  Transcode to H.264/HEVC MP4 or WebM at ~5–8 MB each — .mov is also a compatibility
  risk outside Safari. **[pre-alpha if the boot view plays one; otherwise later.]**
- **Cache headers on the host:** the local server's `no-store` habit must NOT be copied
  to production for media/vendor (long `max-age, immutable`), while `data.js` +
  `src/**` ride the `?v=` stamps (B4.1). One paragraph in the deploy script's README.
- **Runtime thumbnail hotlinking:** node images load from Wikipedia URLs at runtime
  (`src/js/inspector.js:312-313`). Known and deliberately deferred ("imagery bake
  deferred to release" memory). Fine for alpha; keep on the release checklist. **[later]**

### B9. Mobile: don't let it crash — say "desktop only" — **[pre-alpha]** · impact: small effort, saves a bad first impression

With B1 unfixed (and even after it), 12 MB+ payloads + WebGPU/WebGL Forge + MapLibre is
not an alpha mobile story. Add a small viewport check that shows a styled
`.empty-card`-pattern interstitial ("Codex Atlas is desktop-first for now") instead of
letting iOS Safari OOM mid-parse. Honest beats broken.

---

## Priority order (what I'd actually do, in sequence)

| # | Item | Tag | Size |
|---|---|---|---|
| 1 | B7 deploy-allowlist subset + host pick w/ B8 constraints | pre-alpha | ½ day |
| 2 | B1.1+B1.2 compact JSON + split bodies out of `data.js` | pre-alpha | 1 day |
| 3 | A4+B6 resurrect account stub → user menu; My Boards panel; kill the `alert()`s (A5) | pre-alpha | 1 day |
| 4 | A1 first-run welcome card + 3 doors (incl. Scripture entry, A2) | pre-alpha | ½–1 day |
| 5 | A3 router allowlist + B5 delete V1 view blocks | pre-alpha | ½ day + gates |
| 6 | A2 flags: STAR MAP off, Dev-menu gated, Shop row cut; A5 microcopy; A6 favicon/meta | pre-alpha | ½ day |
| 7 | B2 defer scripture-texts.js; B3 vendor d3+marked; B4.1 automate `?v=`; B4.2 boot-assert | pre-alpha | 1 day |
| 8 | B9 mobile interstitial | pre-alpha | 1 hour |
| 9 | Trace-to-Modernity board mode (the demo feature) | later | feature build |
| 10 | B4.3 concat-bundles (§9 note) · B3 fonts self-host · B1.5 fetch+shard · thumbnail bake · real auth backend | later | — |

**Contract-evolution items (explicit):** only two — a one-sentence §9 blessing of
generated concatenation + version stamping (B4.3), and eventually a §8-adjacent "payload
budget" note if John wants boot-size to be a ratified constraint. Everything else works
inside the existing constitution.
