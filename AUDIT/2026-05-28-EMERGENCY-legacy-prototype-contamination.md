# 🚨 EMERGENCY — Legacy prototype V01 chrome is contaminating the V2 foundation

**Filed:** 2026-05-28 (continuous session ending 2026-05-27→28)
**Priority:** P0 — blocks all V2 view work until resolved
**Status:** OPEN, requires fresh agent to plan + execute
**Constraint from John (verbatim):**
> "i want it to be able to check because we need to check the work there BUT I DONT WANT IT as the BASE OF OUR FOUNDATIONS SO 100% GUARANTEE NOT TO CONTAMINATE"

---

## The shape of the problem (one paragraph)

The Codex Atlas codebase has been undergoing a multi-month rebuild from the **prototype V01** era (legacy d3-SVG views, "alchemy" pinboard, transmutation/pantheon nav names, global filter bar at the bottom) to the **Atlas-era V2** (the Forge wheel, the Codex pill, the Boards V2 surface being designed). **The new and old code share the same `index.html`, `src/js/app.js`, and `src/styles/app.css`.** Every previous "cleanup" pass has trimmed individual leaks (the 2026-05-17 footer dropdown removal; the 2026-05-27 Boards step-2 splash strip; this session's footer rip-out), but the pattern keeps repeating: legacy chrome keeps appearing in new views because the architectural separation between V2 and V01 is **organisational only — every legacy element is one missed body-class or stale state away from rendering on top of a V2 view.**

The user has now stated explicitly that the legacy must remain **accessible for reference** (to check prior implementations against) but **100% isolated** from the V2 foundation. A fresh agent needs to design + execute the isolation strategy.

---

## Confirmed contamination points (inventoried 2026-05-28 by live DOM scan)

These are the elements found leaking into the Boards V2 view this session. There may be more in other views (Codex, Forge variants) — a full audit is part of the planning task.

### 1. `#nav-hub-trigger` + `#nav-hub-menu` — the legacy navigation hub

**The biggest finding.** A `<button id="nav-hub-trigger">✦</button>` at top-left (14, 14) opens a `<div id="nav-hub-menu">` (15, 47, 269×420) that lists **32 legacy view items**:

```
Account section: Sign in / Sign up (stub)
Atlas section:   § Atlas Statement, ⛀ Codex Shop (soon)
View list:       ⚒ Atlas (live)
                 ◯ Pantheon                  ← marked `is-active` even on Boards (stale state)
                 ⎯ Timeline
                 ❡ Documents
                 ✠ Scripture
                 ⇌ Transmission
                 ⌖ Atlas                     ← DUPLICATE
                 ☿ Alchemy
                 ⚗ Transmutation
                 ⚖ Morals
                 ☽ Rituals
                 ∞ Philosophy
                 ∑ Mathematics
                 ♄ Astrology
                 ⚕ Medicine
                 𓀀 Alphabets
                 ♫ Music
                 ✎ Authors
                 ◇ Themes list
                 → Connections
                 ∴ Traditions
                 ✦ Patterns
                 ◉ Observations
                 ≡ All nodes
                 🗄 Legacy
```

**Visibility state at the moment of the scan:** `display: block`, `aria-expanded="false"` (state machine broken — claims closed, is open). It's rendered on top of the Boards view. The previous agent's "everything loaded" inventory completely missed this menu.

**Defined in:** `src/js/app.js` somewhere in the `navHubMenu` block (grep `nav-hub-menu`); rendered into `<body>` near the top of the DOM tree. CSS in `src/styles/app.css` (grep `\.nh-item`, `\.nav-hub-menu`).

**Why it's a problem:** every legacy view ID in the prototype era is in this menu. Clicking any of them either routes to a still-mounted legacy view or hits a broken setView call. The menu itself is part of the prototype V01 navigation pattern (hamburger-drawer with every-view-in-the-app) that the master pill was supposed to replace.

### 2. Hardcoded prototype footer (RIPPED OUT this session — commit `a06fef9`)

Already deleted. Documented here for completeness. Was:
- `<button id="footer-toggle">▾</button>` + `<footer>` block in index.html
- `#filter-search`, `#btn-reset-filters`, `#footer-status`, hidden `#filter-family` + `#filter-type` stubs
- 8 JS consumer blocks in app.js
- ~70 LOC of CSS

**Lesson:** previous cleanup (2026-05-17) only removed the dropdowns. The shell + search input + status text + JS consumers + CSS survived. **Half-cleanups don't work — the prototype chrome regrows from the surviving stubs.**

### 3. Boards V2 step 2 imitating legacy aesthetic (FIXED this session — commit `813ebe0`)

Already cleaned. Initial Boards skeleton shipped with a centred alchemy ⚗ glyph splash + a verbatim copy of the legacy bottombar (zoom% / LEGEND / search-vault / # debug). John caught it on screenshot. Stripped to a clean empty stage.

**Lesson recorded in:** `memory/feedback_dont_copy_legacy_prototype_aesthetic_2026-05-27.md` (cardinal).

### 4. Right-edge — TWO panel tabs stacked

- `#detail-toggle` (`›`) at (1253, 12) — inside `<aside class="detail">` — legacy detail-rail collapse toggle, 36×720 sliver always visible on the right edge
- `#codex-dev-tab` (`⚙ DEV`) at (1257, 80) — post-prototype Forge dev panel (`src/js/dev-panel.js`)

Both currently pinned globally regardless of active view. Neither is meaningful on Boards (or Codex — DEV panel only tunes Forge engine parameters).

### 5. `#style-menu` — visible 240×464 panel at (8, 208)

`display: block`, content: `Codexhouse · Cryptoccult · Mysticesoteric · Twilightmodern · Technicalplex` — style presets dropdown sitting at left-middle of the page. Marked as hidden in the previous agent's inventory; live DOM scan shows it visible. State machine for its visibility is broken.

### 6. `#themes-menu` — sitting at negative-y, in DOM

1244×151 at (0, **−166**) — themes-list overlay. Off-screen via negative y-coord, but in DOM with full content. One state-flip away from popping back on-screen.

### 7. Side `<nav class="side">` — invisible but in DOM

Duplicate navigation rail. 0×0 (hidden by `body.nav-hidden`). Contains the same view-list as `#nav-hub-menu` in a different chrome — second copy of the same legacy navigation system.

### 8. `<aside class="detail" id="detail">` — 36×720 right-rail

The legacy "Select a node to inspect" detail panel. Currently collapsed to a 36px sliver. Contains:
- `#detail-toggle` `›` button (one of the two right-edge tabs noted above)
- `#detail-inner` with the empty-state text

### 9. Body class state

`nav-hidden detail-collapsed footer-collapsed app-pill-no-class view-boards`

- `footer-collapsed` is now vestigial (footer ripped out commit `a06fef9`)
- The other classes are doing real work, but the cascade of hides shows how much of the chrome is "hidden by default" — meaning **the legacy is always one missing class away from leaking.**

### 10. CSS rules still styling legacy elements

Even after this session's footer rip-out, `src/styles/app.css` contains rules for:
- `.nav-hub-menu`, `.nh-item`, `.nh-section`, `.nh-header`, `.nh-lbl` (the nav-hub-menu chrome)
- `.detail-toggle`, `.detail-inner`, `aside.detail` (the right-rail)
- `.side`, `.side-tab` (the side nav rail)
- `.style-menu`, `.style-preset` (the style preset menu)
- `.themes-menu`, `.themes-close` (the themes overlay)
- `.alch-board-root`, `.alch-preset-*` (the alchemy board chrome — still loaded since `VIEWS.transmutation` uses it)
- Dozens of `body.view-*` adjustments for the legacy views

Total legacy CSS still in `app.css`: roughly 1,500–2,000 LOC of un-audited stylesheet. **None of it is gated on "is the user in a V2 view"** — it's all global.

---

## Why the previous agent (me) kept missing things

Documented for the fresh agent's situational awareness. Three failure modes in this session, all the same root cause:

1. **Inventoried from code, not from live DOM.** Twice claimed "everything loaded on the Boards page" without doing a `document.body.children`-level scan. Both times missed major visible elements.
2. **Trusted that `display: none` / negative coordinates / collapsed body classes meant "not contaminating."** Wrong — these are stale-state landmines. Any state flip (a stray class toggle, a `display: block` setter) makes them visible.
3. **Half-clean leaves residue.** The 2026-05-17 footer-dropdown removal removed the visible UI but left the shell + stubs + CSS. The 2026-05-27 footer rip-out shipped step 2 of Boards with legacy aesthetic. The pattern: every "cleanup" is incomplete unless it also strips the underlying DOM shell, JS consumers, CSS rules, and verifies via live DOM scan.

**The cardinal:** **never claim a legacy element is "isolated" without a live DOM walk proving it.** The legacy is fully contaminating until proven otherwise.

This pattern hit three strikes per `feedback_severity_dogma_2026-05-24.md` — the agent who shipped it (me) is fatigued and should be replaced with a fresh agent for the planning + execution work.

---

## Strategies the fresh agent should evaluate

These are the architectural forks I (the outgoing agent) see. **Don't pick one without John's input** — each has real trade-offs.

### Option A — Hard partition: separate `index.html` files

Keep the prototype reachable at `legacy.html` (or `proto-v01.html`); have `index.html` be the V2-only shell with zero legacy chrome.

**Pros:**
- Cleanest isolation. Zero risk of contamination since the legacy HTML/JS/CSS isn't loaded at all in the V2 shell.
- Easy mental model: two URLs, two apps.
- Legacy stays accessible for reference (it's a click away).

**Cons:**
- Code duplication between the two HTML files (the master-pill, nav, account drawer, etc. need to live somewhere).
- Two CSS files to keep aligned for shared chrome (or extract into a third common CSS).
- Build-time work to set up.

### Option B — Soft partition: feature-flag gate at the JS layer

Same index.html, but every legacy DOM mount / event listener gated behind a single global `LEGACY_MODE` flag. New V2 views never see legacy chrome because the gates are closed by default.

**Pros:**
- No file duplication.
- Easy to toggle legacy on for "check the prototype" inspection.

**Cons:**
- Still one bug away from contamination — every legacy mount needs the gate, missing one re-creates the problem.
- The legacy HTML in index.html still pollutes the DOM tree on first paint (until the gate hides it).
- Doesn't solve the CSS bleed problem unless all legacy selectors are also scoped under a `body.legacy-mode` parent.

### Option C — Strict view-class scoping

Every legacy element gets a `view-legacy` (or `app-legacy-*`) parent class. CSS rules become `body.app-legacy .legacy-thing { ... }` instead of bare `.legacy-thing { ... }`. JS mounts gate on the same class.

**Pros:**
- Cleanest for the "stays in one file" model.
- Forces every legacy reference to declare itself.

**Cons:**
- Requires the largest rewrite (every legacy CSS selector + JS mount).
- Easy to forget one rule during the rewrite.

### Option D — Archive then preserve as a `_legacy/` route

Move everything legacy (board.js, the prototype views in app.js, the alchemy/transmutation code) into `src/_legacy/` as a frozen archive. Keep one V2-side "open legacy" button that opens `legacy.html` in an iframe or new tab.

**Pros:**
- Cleanest separation of "code we still build on" vs "code we keep for reference."
- The legacy can't drift — it's frozen, you only read it.
- Mirrors the user's stated mental model: "legacy is reference-only."

**Cons:**
- Most upfront work to extract.
- Need to be careful that the archive is functional enough to actually run (so it's truly check-able as reference).

### My (outgoing agent's) intuition

**Option A or D feels closest to John's stated constraint.** "100% GUARANTEE NOT TO CONTAMINATE" basically rules out the soft-partition options because they're always one bug away from breaking. Hard file-level partition is the only architecture that's structurally incapable of contamination.

But that's an opinion. **The fresh agent should brief John on the trade-offs and let him pick.**

---

## What must NOT happen

- Do not "just delete the legacy" without confirming with John. He explicitly said it must stay accessible.
- Do not pick a strategy without confirming with John. The trade-offs are real.
- Do not start writing isolation code until the strategy is locked.
- Do not return to BOARDS V2 step 3 work until the contamination question is resolved. Steps 3–10 are blocked.

## What the fresh agent should do, in order

1. **Read this document end-to-end.** Don't skim.
2. **Read `memory/feedback_dont_copy_legacy_prototype_aesthetic_2026-05-27.md`** — the cardinal that emerged from the same pattern.
3. **Read `memory/feedback_severity_dogma_2026-05-24.md`** — the three-strikes rule that triggered the outgoing-agent termination.
4. **Do a live DOM walk on every V2 view** (Forge, Codex, Boards) — produce a complete inventory of every legacy element appearing on each. The outgoing agent's inventories were unreliable.
5. **Brief John on the 4 architectural options** above. Get his pick.
6. **Lock the strategy in a new audit doc** (`AUDIT/YYYY-MM-DD-legacy-isolation-locked.md`).
7. **Execute, with checks via live DOM walks** at each step.
8. **Resume BOARDS V2 step 3** once the foundation is verified clean.

## Frozen work in flight

- **BOARDS V2** — spec locked (`AUDIT/2026-05-28-boards-v2-new-ux-spec.md`), step 1 + 2 shipped + 2 fix-ups. Steps 3–10 PAUSED until contamination resolved. Last commits: `b450932` (spec lock), `ecc2fda` (step 2 skeleton), `813ebe0` (step 2 fix-up — legacy aesthetic strip), `a06fef9` (footer rip-out).
- **Atlas Codex** — content + UX work is complete for the session (31/42 corpora at 100% reader-ready, 196 SCRIPTURE_TEXTS, 5-step Codex pill + religion filter all working). Not blocked by this emergency since Codex is mature; the emergency only blocks NEW V2 view development.

## Outgoing-agent signature

- Termination triggered: 3-strikes severity-dogma on legacy-contamination pattern
- Last clean commit: `a06fef9` (footer rip-out)
- HEAD at termination: `a06fef9`
- Memory filed for next agent: `feedback_dont_copy_legacy_prototype_aesthetic_2026-05-27.md`
- New emergency task: #33 `EMERGENCY — isolate legacy prototype from V2 foundation`

Fresh agent: do the live DOM walks first. Don't trust any "everything loaded" claim from the prior session.
