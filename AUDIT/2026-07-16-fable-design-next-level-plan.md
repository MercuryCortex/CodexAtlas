# Design pass — taking Codex Atlas "next level" for the alpha
**Date:** 2026-07-16 · **Author:** fable-design (read-only pass — no app code touched)
**Companion mockup:** `codex-design-mockup.html` (scratchpad, self-contained — scroll-through vision of every surface below)
**Contract honored:** `00_meta/app-architecture.md` — all proposals use the existing token vocabulary, the three type-family roles, the documented z-index ladder, and the Scripture polish ceiling. Nothing here invents a fourth font, a new hex, or a new tier.

---

## 0. The diagnosis (what the alpha tester actually experiences today)

I ran the live app (port 8742) and walked the alpha path cold:

1. **Boot** drops you into the full Forge wheel — 4,746 nodes blooming instantly. It is *spectacular* and completely mute. No name, no sentence, no "what is this / what do I do." The most beautiful frame in the product is spent on a moment when the visitor doesn't yet have eyes for it.
2. **Identity** is a stub: ✦ menu → "Sign in (stub · SaaS pivot WIP)" → a JS `alert()`. There is no place in the product that is *the tester's own*.
3. **Boards** — the one feature John wants testers to *feel* — opens as a pitch-black void with three mono buttons (`Transmission · Add node · Save tree`). No empty-state (violates the app's own Scripture rule §1), no visible library, no save feedback. The signal feature has the weakest first impression in the app.
4. **Navigation** — the master pill lists 7 flat ALL-CAPS entries (ATLAS / TIMELINE / BOARD / MAP / STAR MAP / ALPHABETS / INVESTIGATION) with zero explanation. To us those are obvious; to a newcomer "BOARD" vs "ATLAS" vs "INVESTIGATION" is a coin-flip.

**The thesis of this pass:** the app's *substance* is already premium — the gap is entirely in **framing, ownership, and feedback**. Four surfaces close it: a Threshold (first-run), a Folio (account/profile), an elevated Boards loop, and a narrated nav. All four are chrome-level HTML/CSS surfaces — none touch the engine.

---

## 1. Surface I — THE THRESHOLD (first-run / landing moment)

**Concept.** Don't build a marketing hero — the wheel *is* the hero. On first visit, let the Forge wheel boot behind a dark scrim (blur + dim, `--dim-opacity` territory) and place one centered card over it. The newcomer sees the living map *through* the welcome — "there is a world back there" — which no static hero page can fake.

**The card** (see mockup §01):
- ✦ glyph, then **Codex Atlas** in `--serif` at display size — the one place in the app allowed to go bigger than `--h1-size`, because it is a threshold, not chrome. (If we want to stay strictly inside the scale, add one token: `--display-size: 34px`, documented in §2 of the architecture file.)
- One italic-serif sentence — the whole pitch in 5 seconds: *"Every god, book, symbol and rite that left a documentary trace — one connected map, drawn from the sources."*
- One mono stat line — the credibility receipt: `4,746 NODES · 21,757 EDGES · 622 SOURCE TEXTS · 29 TRADITIONS` (pull live from `data.js` counts, never hardcode).
- **Three doors** (this is also the IA lesson, taught at minute zero):
  - **EXPLORE THE ATLAS** → the wheel · *"Start anywhere. Everything is connected."*
  - **READ THE SOURCES** → Scripture reader · *"The texts themselves, not summaries."*
  - **OPEN A BOARD** → Boards seeded with a starter investigation · *"Pin what you find. Make it yours."*
- Faint mono footer: `PRESS ANYWHERE TO ENTER · ✦ MENU → WELCOME TO RETURN`

**Mechanics.** One overlay div, z-index in the **100–110 modal tier** (claim 105). Dismiss on any door / click-out / Esc; set `atlas.welcome.v1 = seen` in LS; re-openable forever via ✦ menu → "Welcome". Doors route through the existing `setView` — no new routing. Transition out uses `--t-overlay` (280ms) + `--ease`.

**Why this beats a landing page:** zero new page weight, zero legacy-splash smell (this is NOT the V01 splash pattern — it's an overlay on the *live* app, dismissed in one act, never blocking a returning user), and it converts the app's raw density from intimidation into invitation.

---

## 2. Surface II — SIGN-IN + THE FOLIO (login and personal profile)

### Sign-in: "Enter the Codex"
Email-first, passwordless (magic link / one-time key) — right call for a trusted alpha cohort: no password storage, no reset flows, and it matches the security posture (nothing secret client-side). One modal, same 100–110 tier:
- Serif title **Enter the Codex**; italic-serif microcopy *"No passwords. We send a one-time key to your email."*
- One input (dark `--bg-2` field, gold `:focus-visible` ring per §4 state contract), one mono button `SEND KEY →`, and a "key sent" confirmation state with the same card swapped in place (140ms micro transition).
- Alpha implementation: whatever auth backend the SaaS pivot lands on — the *surface* is stable regardless; ship the UI against a stubbed session first if needed so testers see the real flow shape.

### The Folio: the profile page
Named surface — "Profile" is generic SaaS; **Folio** is a page in a codex that belongs to you. It is a **first-class view** rendered into `#canvas` (a pane, not an overlay — it obeys the §5 view contract), reached from the ✦ menu header.

Layout (see mockup §03) — two columns:

**Left — identity column** (`--bg-1` card):
- **Avatar = illuminated initial.** A circle with a hairline double gold ring and the display-name's first letter set in `--serif` — an illuminated capital, the most Codex-native avatar possible. Solves alpha scope (no image upload/storage/moderation pipeline needed) *and* is more distinctive than photo thumbnails. Custom image upload becomes the later upgrade that replaces the letter inside the same ring.
- **Display name** in serif at `--h1-size`, single pencil-edit affordance (inline edit, mono input).
- Mono meta rows: email · `MEMBER SINCE JUL 2026` · `ALPHA SEAL Nº 007` (give each tester a numbered seal — costs nothing, *feels* like membership; this is exactly the kind of detail a small trusted cohort talks about).
- **Preferred style** row: the 13 presets as small swatch dots; selection persists to the account (today: LS key `atlas.profile.v1.style`). This is the first personalization loop that already has a working backend (the presets exist).

**Right — the Boards shelf:**
- Section label `YOUR BOARDS` (mono caps, `--lbl-sm` treatment), count chip.
- Grid of **board cards**: constellation thumbnail (see §3), serif name, mono meta `12 NODES · UPDATED 2D AGO`, hover lifts to `--bg-3` + gold border per state contract. Click opens the board.
- Real empty-state per Scripture rule: serif *"No boards yet."* + mono `OPEN A BOARD → PIN YOUR FIRST FIND`.
- One ghosted future row (`READING MARKS — SOON`, disabled style) to signal trajectory without shipping vapor — same honest-stub ethic as the current ✦ menu.

**Signed-in ✦ menu** gets an identity header: initial-avatar chip + name + `VIEW FOLIO ↦`, replacing the Sign in/Sign up stubs. The account anchor lives where the account menu already is — no new chrome position.

---

## 3. Surface III — BOARDS as the hero signal feature

Boards is where a tester *does* something and the app *remembers*. Today saving works (LS `atlas.boards.v1`) but is imperceptible. Three moves, all feedback-layer:

1. **A real empty-state** (the app's own §1 rule, currently violated): centered card — serif *"An empty board is a question."* · italic-serif *"Pin gods, books and symbols side by side; the Atlas draws the wires it knows between them."* · two mono buttons `ADD NODE ▾` `OPEN LIBRARY ▾`. The void becomes an invitation.
2. **Make save state visible and ceremonial.**
   - Unsaved-changes signal: a small gold dot on the `Save tree` pill side (mono `Save tree ●`), cleared on save — the standard pattern, in Codex dress.
   - On save: a brief **"Sealed"** toast (bottom-center, `--bg-1` blur card, gold seal glyph ✦, serif board name, mono `SAVED TO YOUR FOLIO · 12 NODES`), 280ms in / auto-out. The word "sealed" does the brand work; the toast does the signal work — the tester *feels* the write.
   - Board name lives in the pill (serif is wrong here — keep mono per role contract): `BOARD · Ishtar → Aphrodite ●`.
3. **Elevate the Library into the showcase.** The existing Transmission/Investigation menu becomes a proper drawer (existing 200–300 overlay tier) with tabs `MY BOARDS · MASSIVE WINS · PRESETS`, each entry a **board card with a constellation thumbnail** — a tiny SVG of the actual saved card positions (dots + edge lines, gold on `--bg-2`). Thumbnails are nearly free (the geometry is already in LS) and they make the library read as a gallery of investigations instead of a text list. MASSIVE WINS presets (already shipped in `boards-library.js`) double as content marketing inside the product: a tester one-clicks "Flood Narratives" and instantly owns a beautiful board.

**The loop this creates:** Threshold door 3 → seeded board → tester drags/adds → gold dot appears → Save → "Sealed" toast → board appears on the Folio shelf → tester returns next session and their work is *there*. That chain is the entire alpha retention story, and every link is a chrome-level build.

---

## 4. Surface IV — Navigation clarity (IA proposal)

Keep the app-pill pattern exactly as-is (master left / class right — it's good, and it's ratified). The fix is inside the **master dropdown**, which currently reads as 7 flat opaque labels.

**Group the 7 masters into three narrated sections** (mono caps group labels, same `.user-menu-section-label` treatment):

| Group | Views | Story it tells |
|---|---|---|
| **EXPLORE** | ATLAS · TIMELINE · MAP · STAR MAP | Four projections of one substrate (chart/time/earth/sky) |
| **STUDY** | ALPHABETS · INVESTIGATION | The scholarship: writing systems, and what the Atlas has found |
| **YOURS** | BOARD | The tester's own workspace |

- Each row gains one line of **italic-serif microcopy** (`--lbl-md`): e.g. ATLAS — *"the whole map, every tradition"*; TIMELINE — *"the same map, laid on time"*; BOARD — *"your pinboard — save what you find"*; INVESTIGATION — *"1,252 documented cross-tradition finds"*. Dropdown only; the pill trigger stays compact.
- This is a **framing** change, not a routing change: same 7 targets, same `MASTER_VIEWS` table, plus section headers and hint lines in the menu builder. The Threshold's three doors teach the same three groups, so the mental model is reinforced twice in the first minute.
- The ✦ menu completes the split: **left pill = the world, ✦ = you.** With the identity header added (§2), that division becomes legible instead of implicit.
- Explicitly *not* proposing: hiding views from newcomers, a sidebar revival, or renaming ratified vocabulary. Eleven-plus views is fine when they're narrated and grouped; it's only "a lot" when they're flat and mute.

---

## 5. Ranked build list — alpha vs later

**Ship for alpha (in order):**
1. **Boards feedback loop** — empty-state card, unsaved dot, "Sealed" toast, library board-cards + thumbnails. *Highest signal-per-effort in the product; pure chrome; the feature John wants felt.*
2. **The Threshold** — first-run overlay + LS flag + ✦ "Welcome" re-entry. *One evening of work; transforms the first 5 seconds.*
3. **Master-menu grouping + microcopy** and ✦ identity split. *Hours, not days; makes 11 views feel like 3 ideas.*
4. **Sign-in (magic link) + the Folio view** — identity column with illuminated-initial avatar + editable display name, Boards shelf, style-preset preference. *The "this is yours" moment; the shelf reuses the §3 board-cards.*
5. **Alpha seal numbers** on the Folio. *Trivial; disproportionate delight for a small cohort.*

**Explicitly later (don't let them creep in):**
- Avatar **image upload** (the initial-ring is the alpha avatar; the ring is designed to accept an image later).
- **Cloud sync** of boards (alpha stays LS; write the profile/boards LS shapes with an `owner` field now so migration is a copy, not a schema change).
- Reading marks / annotations, Codex Shop, public Atlas Statement page, per-account style sync across devices.

**Token/discipline notes for whoever builds this** (so it survives review):
- New z-index claims: Threshold + sign-in modal in the 100–110 tier; toast in 50–60 fixed-chrome tier; library drawer stays in 200–300. No new tiers.
- One candidate new token: `--display-size` for the Threshold title — add to `:root` + architecture §2, or clamp to `--h1-size` and let letter-spacing do the work.
- Every new control ships the full 4-state contract (§4). All microcopy is italic `--serif`; all buttons/IDs/counts mono; all headlines serif. No fourth family, no new hexes — the mockup demonstrates the full build inside the existing vocabulary.
- New views (Folio) register per §5 of the architecture contract; new primitives (board-card, toast, threshold-card) get proposed as §3 rows.

---

*Mockup file: scroll-through of Threshold → Sign-in → Folio → Boards loop → Nav, all in live Codex tokens (`#07090f` canvas, `#d4a55a` gold, serif/mono/italic-serif roles). Open it full-screen and dark.*
