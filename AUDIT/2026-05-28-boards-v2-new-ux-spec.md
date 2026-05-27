# BOARDS V2 — New-UX Rebuild Spec

**Filed:** 2026-05-28
**Status:** LOCKED — John's brief landed 2026-05-27 (see §5 answered brief below)
**Frame:** "BOARDS from the old prototype — prepare using our new UX"
**Reference (legacy, do-not-touch — REBUILD-FROM target):**
  - `src/js/alchemy/board.js` (1,025 LOC) — free-form pinboard, drag-pan-zoom, right-click expand, LS persistence
  - `VIEWS.transmutation` in `src/js/app.js:6504` — legacy mount + Presets dropdown
  - `MASTER_VIEWS[2]` in `src/js/app-pill.js:53` — `{ id: 'board', target: 'transmutation', icon: '⚗', label: 'BOARD' }` (already wired)

---

## 1 · What Boards is for

A research workbench distinct from Atlas (the wheel). Where Atlas is the **canonical map of everything**, Boards is your **personal investigation surface**: drop vault nodes onto a free-form 2D canvas as cards, drag them into spatial clusters, right-click to expand connections, draw paths between figures, save your investigation as a custom tree.

Same vault data behind both views. Atlas = the territory. Boards = your map of the part you care about right now.

---

## 2 · One-paragraph statement of the new UX

When you pick **⚗ BOARD** on the master pill, the canvas becomes a free-form 2D surface (pan + zoom + drag-cards). The top bar follows the same `.app-pill` chrome pattern as Atlas + Codex: master pill (BOARD) + contextual pill that lights up only on BOARD mode containing `[Preset ▾]` `[Add node ▾]` `[Save tree ▾]` actions. Card click locks; card double-click opens the same side-panel + reader overlay the wheel uses. Right-click a card opens the same expansion menu the legacy had (`connections`, `neighbors`, `shortest-path-to`). Marquee-drag selects multiple. Cards persist to `atlas.boards.v1` in LS so the board survives reload.

**100% reuse of Atlas tech.** No parallel rendering system. The card itself is the same DOM element family as the forge-side-panel preview. The reader is the same overlay we already shipped. The side panel is the same module. Boards is just a new SURFACE — a 2D arrangement of the same vault nodes the wheel renders.

---

## 3 · Why this exact shape

| Choice | Why |
|---|---|
| New view stays at master-pill level (slot already exists) | No URL routing rework — `BOARD` is already in `MASTER_VIEWS` at app-pill.js:53. Picking it triggers `setView` with the right target. |
| Surface = HTML/SVG, not GPU canvas | Cards are RICH (thumbnail + title + 4-5 tag pills + summary text). HTML rendering is right for this; GPU instancing is right for 1000-node wheels. Two surfaces, two render strategies, one data layer. |
| Contextual top-bar pill mirrors Codex pattern | `.app-pill--boards margin-left:8px; body.app-pill-boards-visible .app-pill--boards { display:inline-flex }` — exact same canonical-primitive pattern as `.app-pill--codex`. Zero new chrome primitives. |
| Card double-click → side panel + reader | Same flow as Atlas wheel-node-double-click. User learns one interaction model, applies it across all views. |
| Right-click expansion menu (legacy preserved) | The graph-walk affordances (`expand connections`, `neighbors`, `shortest path to`) are Boards' superpower vs. Atlas. Atlas shows everything; Boards lets you GROW your investigation node-by-node. Keep it. |
| LS persistence with new key | `atlas.boards.v1` (mirrors `atlas.codex.v1` + `atlas.debug.pinned`). Old `codex-atlas-alchemy-board-v1` key stays untouched so legacy state is recoverable. |
| Presets system carries over | The 30+ curated investigation trees (ALCHEMY_PRESETS) are real research scaffolding. Reuse them; rename the system to "Investigations" (clearer than "Presets") in V2 UI but keep the data model. |

---

## 4 · What rebuilds vs what carries over

### Carries over (data + assets — don't touch)

- `ALCHEMY_PRESETS` in app.js — the 30+ curated investigation trees
- `PRESET_CATEGORY_ORDER` / `PRESET_CATEGORY_LABELS`
- `alchemyLoadPresetToCards()` — preset-to-cards mapping helper
- `loadCustomTrees()` / save-tree LS helpers
- Vault data structures (NODES_BY_ID, EDGES) — same source of truth

### Rebuilds (new carved Forge-style module)

**New file: `src/js/views/boards.js`** — the V2 view module, single source of truth.

Mounts inside `.boards-pane` like Atlas mounts in `.forge-pane`. Structure:

```
.boards-pane
├── .boards-shell-v1
│   ├── .boards-stage             (the pan/zoom HTML surface)
│   │   ├── .boards-card × N      (one per pinned node)
│   │   └── .boards-edges (SVG)   (lines between connected cards)
│   ├── .boards-bottombar
│   │   ├── [search input]
│   │   ├── [zoom %]
│   │   ├── [LEGEND]
│   │   └── [#] debug button (shared with forge-debug-stats)
│   └── (re-uses #forge-side-panel + #forge-reader-pane)
└── (the Boards contextual pill is sibling inside #app-pill-wrap)
```

**New file: `src/js/forge/boards-controls.js`** — the contextual pill carved module. Mirrors `codex-controls.js` pattern exactly:
- IIFE + `attach({ local, rebuildBoards })` boundary
- Injects a second `.app-pill` group inside `#app-pill-wrap` with class `.app-pill--boards`
- Buttons: `[Investigation ▾]` (presets dropdown), `[Add node ▾]` (search + insert), `[Save tree]` (one-click action)
- State persists to `atlas.boards.v1`
- Visibility: `body.app-pill-boards-visible` class toggle, sibling to `.app-pill-codex-visible`

**New CSS** in `app.css` — two rules mirroring the Codex pattern:
```css
.app-pill--boards { margin-left: 8px; display: none; }
body.app-pill-boards-visible .app-pill--boards { display: inline-flex; }
```

Plus the `.boards-card` / `.boards-stage` / `.boards-edges` styling — carved from legacy `board.js` inline styles into canonical app.css selectors.

### Sunsets (delete or archive — needs John's signoff)

- `VIEWS.transmutation` in app.js — becomes a 3-line redirect (`setView('boards'); STATE.view = 'boards';`)
- `src/js/alchemy/board.js` — kept on disk for 1 release as `_legacy_alchemy_board.js`, removed from index.html script tags
- The inline transmutation chrome at app.js:6504-6608 — rewritten + relocated into the carved module

---

## 5 · Architecture decisions — ANSWERED BRIEF (2026-05-27)

All 8 architectural forks resolved by John on 2026-05-27. The decisions below are LOCKED for V1; revisit in V2 if usage data signals otherwise.

| # | Question | John's answer | Notes |
|---|---|---|---|
| 1 | Naming | **Boards** (placeholder) | "agree on boards, but don't love it — not comparable with Atlas + Codex, not same gravitas or coolness. proceed, can change later if better ideas." Filed as an open question to revisit. |
| 2 | Single vs N boards | **N saved user boards + pre-loaded Investigation Library** | The Investigation Library is the differentiator — pre-populated with everything: AI-found connections from prototype + transmissions the user mentioned + MASSIVE-WIN findings + winnings. All organized in categories. |
| 3 | Card interaction | **Match Atlas exactly** | Single-click = lock + 1-hop highlight; double-click = open side-panel + reader; right-click = expansion menu (connections / neighbours / shortest-path-to). Atlas muscle-memory carries over. |
| 4 | V1 scope: cards-only vs +notes | **Cards only — V1** | Notes deferred to V2. |
| 5 | Default zoom/pan on mount | **fit-to-cards** (spec default, not contested) | When loading an investigation, frame the cards. |
| 6 | Edges between cards | **Auto-drawn from vault edges + visibility toggle** | When both endpoints of a vault edge are on the board, draw the edge. Per-board show/hide toggle for noise control. Edges re-route on card drag. |
| 7 | Add-node target board | **Active board only** | No global pin concept. To put a node on multiple boards, user explicitly adds to each. |
| 8 | Mobile/small-screen V1 | **Desktop only** | Matches Atlas + Codex. |

### Derived from the brief — Investigation Library taxonomy (4 categories)

The `[Investigation ▾]` dropdown lists boards under 4 grouped headers:

1. **MY BOARDS** — user-saved investigations from previous sessions (LS-persisted at `atlas.boards.v1`)
2. **MASSIVE WINS** — the 43 cross-tradition spine findings from `00_meta/MASSIVE-WINS-INDEX.md`, each as a one-click loadable board (cards = the nodes wired in the corresponding essay)
3. **AI PRESETS** — the 30+ existing `ALCHEMY_PRESETS` from the prototype, retaining their original `PRESET_CATEGORY_ORDER` sub-grouping
4. **TRANSMISSIONS** — the multi-text lineages we wired in the 2026-05-27 session (Akhenaten → Christianity, Queen of Heaven, Mani → Bogomil → Cathar dualist, Eridu Genesis → Genesis 6-9 flood, Enheduanna → Inanna → Mary, Yasna 30 → 1QS → Pauline → Johannine dualism, etc.) — each as a curated board

The 4-category split is the spine of V1 — without it Boards is just "the legacy with new chrome." With it, Boards becomes a genuine investigation-construction tool from day one.

### Open question (not blocking)

- **Naming**: "Boards" was accepted but not loved. If a name with more gravitas surfaces (something with the register of "Atlas" / "Codex" — possibilities the user might workshop: "Lattice", "Threadboard", "Synthesis", "Atelier", "Forum"), revisit. The internal DOM IDs already use `boards-*` — renaming to a different word later is a CSS-class + label change, not a structural rewrite.

---

## 6 · Carve plan (commit-by-commit)

| Step | What | Risk |
|---|---|---|
| 1 | Confirm John's answers to the 8 architecture questions in §5 | — |
| 2 | New file `src/js/views/boards.js` — skeleton mount + empty stage + bottombar. View registers as `VIEWS.boards`. Picking BOARD on master pill routes to it. | Low |
| 3 | Port pan/zoom + drag-card from legacy board.js into the new module. Cards render as HTML elements; no GPU. | Low |
| 4 | New carved module `src/js/forge/boards-controls.js` — the contextual pill `[Investigation ▾] [Add node ▾] [Save tree]`. Uses canonical `.app-pill` primitives, body-class visibility toggle. | Low |
| 5 | Port the Presets system from legacy `alch-presets-dropdown` to the new Investigation dropdown. Same data, new chrome. | Medium |
| 6 | Wire right-click expansion menu (connections / neighbors / shortest-path). | Medium |
| 7 | Wire card double-click → existing forge-side-panel + forge-reader-pane (reuses the modules — no new DOM). | Low |
| 8 | Marquee select + multi-card operations (delete, group, save subset as new board). | Medium |
| 9 | LS persistence at `atlas.boards.v1` — N named boards, current-board pointer, per-board cards/pan/zoom. | Medium |
| 10 | Cut over `VIEWS.transmutation` to redirect → `VIEWS.boards`. Move legacy `board.js` to `_legacy_alchemy_board.js` (kept 1 release for rollback). | Medium |

**Estimated effort:** 8–10 commits, ~1,200 LOC added / ~1,000 LOC sunsetted (net wash). 2 focused sessions.

---

## 7 · Why this is the right next "era"

Atlas + Codex are the **canonical** views — the territory. They show what the vault contains. Boards is the **investigative** view — it lets the user CONSTRUCT their own argument from the vault. It's the bridge from "browse" to "synthesize."

For the Codex Atlas premium-SaaS framing per `memory/project_premium_saas_shift.md`, Boards is what differentiates the product from a wiki / encyclopedia. A wiki lets you READ; Boards lets you THINK ON the wiki. The legacy prototype already proved the interaction works — what's missing is the chrome integration with the new Atlas-era pill system + side panel + reader.

The user can build a board for ANY investigation:
- "The transmission chain from Akhenaten to Christianity" — drop the 12 Abrahamic-empire spine figures we just shipped, arrange them temporally, expand connections, see the long arc visually
- "Every figure named in Genesis 1" — drop the deities/persons mentioned in the scripture, watch the cross-tradition wires light up
- "The Two Ways: Zoroastrian → Christian → Manichaean" — drop yasna-30, Qumran rule, Didache, Manichaean psalms; expand to see the genealogy

The MASSIVE-WINS index becomes BOARDABLE — every documented transmission is one Investigation preset away from being visualized as a card cluster.

---

## 8 · Non-goals for V1

- Mobile / touch support
- Real-time multi-user collaboration
- Export to PDF / image
- Custom node styling per card
- Free-text notes between cards (defer to V2)
- Boards-to-Boards card cross-references (defer to V2)
- Undo / redo (defer; rely on LS snapshot)

---

## 9 · Open follow-ups (Lane A — separate batches)

- Audit the 30+ existing ALCHEMY_PRESETS for any that reference now-stale node IDs (post-P-prefix migration)
- Curated set of "Investigation starters" — 5–10 hand-built boards for the most striking MASSIVE-WIN spines (Eucharist substrate, Executed Divine Claimant, Christianity's Five Inheritances, the Abrahamic-Empire spine we just shipped)
- Documentation for "how to build a board" in the eventual user-facing help system

---

*Spec ends. **Brief landed 2026-05-27.** Carve plan §6 unblocked — implementation can proceed.*
