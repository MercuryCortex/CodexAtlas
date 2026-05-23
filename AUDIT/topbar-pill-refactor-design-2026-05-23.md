# Top-Bar Pill Refactor — App-Level Macro-Navigation Design

**Filed:** 2026-05-23
**Filed by:** opus (lead)
**Status:** SCOPE / GREENLIGHT — design only, no implementation.
**Reads-with:**
- `00_meta/CODEX.md` (v1.3 — charter, §I–V land in the Atlas Statement drawer entry).
- `00_meta/HOW-WE-WORK.md` (Lane B / app-shell slot claim — single coordinator, no overlapping mounts).
- `AUDIT/forge-timeline-mode-design-2026-05-23.md` (the sibling-view audit that triggered this refactor; that doc assumed Timeline was a Forge sub-mode — John clarified it is a SIBLING master view, which is what this refactor enables).
- `AUDIT/forge-rebuild-layered-spec-2026-05-20.md` (the structural shape this doc follows — phased layered build, per-phase SHIP/VERIFY/FOLLOW gate).
- `src/js/app.js` (the view router — `STATE.view`, `setView()`, `VIEWS` registry, the existing top-left nav-hub).
- `src/js/views/forge.js` lines 1013–1048 (the FORGE | Deities pill living in the view-internal top status row — what we PULL OUT) and lines 4746–4818 (`wireModeDropdown()` — the custom-popup primitive the new pill will inherit).
- `src/styles/app.css` lines 404–512 (`.nav-hub-trigger` + `.nav-hub-menu` — the visual contract the preferences drawer extends) and lines 6212–6330 (`.forge-status-mode` + `.forge-mode-menu` — the pill button + popup contract the new master/class pill inherits).
- Memory `feedback_atlas_is_map.md` — "Atlas" tab IS the Map view; the new pill must respect that vocabulary.
- Memory `feedback_describe_what_human_sees.md` — the UI must read as ONE pill split by `|`, not two adjacent buttons. Mocks lock the visual.

---

## 0. John's brief (verbatim, 2026-05-23)

> *"The current top bar needs to be reorganized into a clean macro-overview. Three elements: far-left icon becomes the Main Overall Preferences menu (logo + title, login interface, Codex Shop / Atlas Statement / utility entries). Center: a pill-shaped dual button split by | — LEFT is the MASTER VIEW toggle (Forge / Timeline / Map / Star Map / future siblings), RIGHT is the CLASS toggle (Deities / Persons / Themes / Events / Symbols / All types). The class selector is THE SAME ACROSS ALL MASTER VIEWS — picking Deities then switching Forge → Timeline shows the same 676 deities, just in a different layout. The pill's two sides are independent dropdowns sharing the visual pill shell. The current Forge bottom-bar FORGE pill + Deities dropdown gets PULLED OUT of Forge into the app shell, becoming app-level UI."*

The architecture pivot: chrome that today is "the Forge view's internal pill" becomes "the app shell's pill, with the Forge view as one of N consumers." This collapses the duplication that today exists across Forge (its own `forge-status-mode`), Pantheon-v2 (its own STATE.pantheonMode), Scripture (`STATE.scriptureCorpus`), and the future Timeline view (which would otherwise grow its own type/mode picker).

This document translates the brief into a phased refactor modeled on `forge-rebuild-layered-spec-2026-05-20.md` and `forge-timeline-mode-design-2026-05-23.md`. Each phase = one Lane B slot claim = one commit = one acceptance gate.

---

## §1. Current-state audit

### 1.1 Top-bar inventory today

The viewport's TOP region currently carries three overlapping concerns:

| Element | Owner | Position | What it does |
|---|---|---|---|
| `.nav-hub-trigger` (✦) | app shell (`index.html` line 20 + `app.js` lines 653–757) | `position: fixed; top: 14px; left: 14px; 36×36px` | Floating button. Opens `.nav-hub-menu` (mirrors the hidden sidebar's view list). View-switch via `setView()`. Phase 21A (2026-05-21). |
| `.nav-hub-menu` | app shell | `position: fixed; top: 56px; left: 14px; width: 240px` | Dropdown panel listing every `VIEWS.*` entry. Grouped: top-level (Forge) + "More views" disclosure (Maps / Indexes / Project). |
| `.view-header` (h2 + subtitle + view-controls) | app shell, populated per-view | `position: absolute; top: 14px; left: calc(var(--nav-w) + 24px); right: calc(var(--detail-w) + 24px)` | The big serif view title + (mostly hidden) subtitle + per-view button cluster. Per-view CSS in `body.view-forge .view-header { display: none; }` hides this on Forge. |
| `.forge-status` (the status row) | **Forge view internal** (`forge.js` lines 1013–1048) | `position: absolute` inside `.forge-shell-v1` near the top | Carries the FORGE | Deities pill (`.forge-status-tag` + `.forge-status-mode`), plus device/nodes/edges/hover/lock/frame readouts. |

So today the top-left has TWO competing affordances: the global `.nav-hub-trigger` floating button (which switches the master view) AND the in-Forge `.forge-status-mode` pill (which switches the data class within Forge). The visual asymmetry is part of what John flagged — the master-view affordance is a tiny ✦ glyph in the corner while the class affordance is a prominent center-of-canvas pill. The refactor inverts this: both promotions go to the same horizontal stripe.

### 1.2 Forge bottom-bar inventory (the source of the PULL-OUT)

The Forge bottom-bar (`forge.js` lines 1057–1217) carries 11+ elements; only the FORGE pill is app-level. Everything else is view-specific:

| Element | Concern | Refactor verdict |
|---|---|---|
| `#forge-zoom-gizmo` | Forge-internal camera zoom | **STAYS** in Forge bottom-bar. View-specific. |
| `#forge-legend-btn` + panel | Forge wire-bucket legend + tier toggles | **STAYS** in Forge bottom-bar. The legend's tier toggle is view-specific behavior on Forge edges; Timeline will get its own legend if it ships. |
| `#forge-viewset-btn` + panel | Forge view-settings (layer toggles, color theme, family order, distribution) | **STAYS** in Forge bottom-bar. View-specific layout knobs. |
| `#forge-status-search` (`forge-bottom-search`) | Forge search-by-name | **STAYS** in Forge bottom-bar. View-specific (today queries Forge's own search index). |
| `#forge-scrub-in / -slider / -out / -present` (timeline scrubber) | Cross-view era-window filter | **POTENTIAL** app-level promotion in a LATER phase — see §10 D-09 / out-of-scope §11. NOT in scope for Phase 22. |
| `#forge-fxpanel-btn` + panel | Forge FX dev panel | **STAYS** in Forge. View-specific dev surface. |
| `#forge-stylepanel-btn` + panel | Forge guide-ring + separator CSS-var tuner | **STAYS** in Forge. View-specific dev surface. |
| `#forge-debug-btn` + panel | Forge engine stats | **STAYS** in Forge. View-specific. |
| **`.forge-status-tag` ("FORGE")** | Master-view name label | **REMOVED** from Forge. App-level pill carries this. |
| **`#forge-status-mode` ("Deities ▾") + `.forge-mode-menu`** | Class-filter selector | **REMOVED** from Forge. App-level pill carries this. |

The remaining `.forge-status` row (device / counts / hover / lock / frame readouts) is debug-grade; it's been hidden via CSS for ages (see `app.css` lines 6190–6195 — `display: none` for k/v pairs after the first separator). Phase 22-C can either delete the whole `.forge-status` row or keep it as a hidden dev surface for `_forgeDebug`. Recommendation: keep the row, strip the now-orphaned FORGE | Deities pill, leave the rest invisible for dev-overlay use.

### 1.3 Other views: what their top chrome looks like

To understand what the master-view pill needs to coexist with, the same inventory across all currently-registered views (`grep "VIEWS\." src/js/app.js` returns 50+ hits; most are short index views):

| View | `setView` slot in app.js | Has its own top chrome? | Has a class picker? | Notes |
|---|---|---|---|---|
| **forge** | line 939 | NO (hides `.view-header` via `body.view-forge`) | YES — internal `forge-status-mode` (30 entries) + `wireModeDropdown` | The dominant view. Carries its own FORGE | Deities pill we're PULLING OUT. |
| **pantheon** (V2) | line 912 | uses `.view-header` (title "Pantheon"); legacy V1 had a sub-mode picker via `STATE.pantheonMode` (deities/authors/symbols/events/music/alphabet/monuments) — V2 currently locked to deities | YES (legacy V1 — implicit via STATE.pantheonMode); V2 deities-only | Live; sibling-of-Forge candidate for the new pill. |
| **timeline** | line 2045 | uses `.view-header` | NO (filter by node-type via STATE.filter.type) | Live legacy SVG view; will be replaced by the new Timeline master view per the timeline-mode audit. Today it accepts the global STATE.filter.type. |
| **scripture** | line 3922 | populates `#view-controls` with a custom corpus dropdown (~36 corpora) + Read button + label/trails/recenter | NO (its picker is corpus-scoped, not class-scoped) | Live. Coexists; not in the master-view pill. |
| **atlas** (the Map) | line 7384 | populates `#view-controls` with labels-toggle + recenter | NO | Live. The user calls this "the Map" per memory `feedback_atlas_is_map.md`. **Promotion candidate** to the master-view pill as "Map". |
| **pantheon-v2** | alias of pantheon (line 10253) | (same as pantheon) | — | Alias for hash-router back-compat. |
| **documents** | line 1806 | uses `.view-header` | — | Live D3-SVG index. Legacy; sunset candidate. |
| **astrology** | line 8495 | populates `#view-controls` with a sub-mode picker (spine/decanic/wheel/now) | NO | Live; sub-modes are astrology-internal. Could be a master view; could stay a "list view" outside the pill. |
| **alphabets** | line 8554 | populates `#view-controls` with a sub-mode picker (origin / glyph / mysticism / cuneiform / hebrew) | NO | Live. Same status as astrology. |
| **alchemy** + **transmutation** | lines 6377 / 6265 | mode pickers in `#view-controls` | NO | Live; transmutation is the freeform board, alchemy the investigation modes. |
| **morals / rituals / philosophy / mathematics / medicine / music** | lines 8730 / 8865 / 9152 / 9276 / 9584 / 9415 | each has its own internal sub-mode picker | NO | Live; thematic-investigation views. |
| **transmission** (formerly Alchemy graph) | line 6467 | uses `.view-header` | — | Live. Sunset / fold-into-Forge candidate per the Forge-promotion direction in `forge-rebuild-layered-spec-2026-05-20.md` Phase 5B. |
| **authors / themes / edges / traditions / patterns / observations / chains / all** | scattered (8189, 8359, 8383, 8415, 9881, 9933, 9971, 8452) | use `.view-header` | — | Index/list views. Tabular; not master-view candidates. **All keep working unchanged**; reachable from the preferences drawer or from the legacy nav-hub-menu (kept as a secondary entry — see §6.3). |
| **about** | line 10044 | uses `.view-header` | — | Renders the original prose-style About. **Sunset candidate** — its content gets ABSORBED by the new "Atlas Statement" drawer entry that renders CODEX §I–V. |
| **_legacyPantheon** | line 955 | rollback only | — | Console-reachable rollback for the V2 promotion. Untouched. |

### 1.4 The view universe — refactor verdict per view

Mapping every view to its post-refactor role:

| Status | Views | Treatment |
|---|---|---|
| **MASTER VIEW (in the pill)** | `forge` (default), `timeline` (new — see timeline-mode audit), `atlas` (renamed/relabeled "Map"), optionally `pantheon` (deities ring) | Promoted to the left-side dropdown. Each must implement §4's view contract. |
| **MASTER VIEW (deferred to Phase 22+1)** | `astrology` (the sky), `scripture` (the reader) | Strong sibling candidates but each carries its own picker primitive that doesn't reduce cleanly to "class filter". Promote in a later phase if John greenlights. |
| **SUNSET candidate** | `documents` (legacy SVG), `transmission` (graph), `about` (folded into Atlas Statement) | Removed from the master-view pill. Documents + transmission stay reachable via a legacy "Other views" entry in the preferences drawer until traffic confirms they're unused; about is replaced. |
| **HIDDEN reachable** | `authors / themes / edges / traditions / patterns / observations / chains / all` (the index list views) | Stay in the legacy nav-hub-menu (which becomes a "Browse all views" entry inside the preferences drawer — see §6.5). Not in the master-view pill. |
| **VIEW-LEVEL submodes** | `alphabets`, `alchemy`, `transmutation`, `morals`, `rituals`, `philosophy`, `mathematics`, `medicine`, `music` (the thematic investigations) | Keep their internal pickers. NOT promoted to master view in Phase 22 — each has 4–6 sub-modes that don't share the "show ME this class of nodes" vocabulary. Reachable via the preferences drawer's "Browse all views" entry. Sunset decisions for any individual one are out of scope for Phase 22. |

### 1.5 What the user sees today (problem statement)

Concretely, the current state at view = Forge looks like:

```
┌────────────────────────────────────────────────────────────────┐
│ [✦]                                              [⛶100%]       │  ← top-left floating nav-hub
│                                                                │     trigger; top-right zoom meter
│                                                                │
│              (Forge canvas — wheel of deities)                 │
│                                                                │
│                                                                │
│  FORGE · Deities▾ · device · nodes 676 · edges 3033 · hover…  │  ← in-Forge status row (sits OVER
│                                                                │     canvas; carries the pill that
│                                                                │     should be app-level)
│  [⛶100%] [LEGEND▾] [VIEW▾] [search…] [⤚in—◯—out⤙] [FX▾] [⌗]   │  ← Forge bottom bar
└────────────────────────────────────────────────────────────────┘
```

Two affordances for "switch what you're looking at": the corner ✦ (master-view) and the in-Forge Deities▾ (class). They live at opposite ends of the canvas, look like different primitives, and the user has to learn that they're orthogonal axes. The refactor consolidates them into ONE prominent macro-control region.

---

## §2. Target visual specification

### 2.1 Layout after the refactor

```
┌────────────────────────────────────────────────────────────────┐
│ [☰]            ╔═══════════════════════════════╗     [⛶100%]   │  ← TOP BAR
│  ↑              ║   FORGE  │  DEITIES  ▾      ║      ↑         │     (always-on,
│  preferences    ╚═══════════════════════════════╝      zoom    │      every view)
│   drawer            ↑              ↑                            │
│   anchor       master-view      class                          │
│                  side           side                            │
│                                                                │
│                                                                │
│              (Forge canvas — wheel of deities)                 │
│                                                                │
│                                                                │
│         (no app-level chrome at bottom of canvas — view-       │
│         specific bottom bar lives below)                       │
│                                                                │
│  [⛶100%] [LEGEND▾] [VIEW▾] [search…] [⤚in—◯—out⤙] [FX▾] [⌗]   │  ← Forge bottom bar
│                                                                │     (unchanged minus the
│                                                                │      pulled-out pill)
└────────────────────────────────────────────────────────────────┘
```

Three regions, left → right:

#### Region A — Far-left preferences icon (`☰` or current `✦`)

- **Position**: `fixed; top: 14px; left: 14px; 36×36 px` — the SAME pixel slot the current `.nav-hub-trigger` occupies.
- **Glyph choice**: keep `✦` (current — readable as "menu / hub") OR switch to `☰` (universal hamburger). Decision in §10 D-04. Recommendation: keep `✦` — it's the project's signature glyph and matches the brand-glyph in the hidden sidebar (`index.html` line 35).
- **Click**: opens the **Preferences drawer** (replaces today's nav-hub-menu in this slot — see §6).
- **Visual**: rounded-square dark-glass panel, gold border on hover/active, same chrome as current `.nav-hub-trigger`. **No code change to the trigger element itself** — its `id` stays `nav-hub-trigger`, its CSS stays; only what its CLICK DOES changes (it now opens the preferences drawer, not the view list).

#### Region B — Center pill

The pill is the headline of the refactor. ASCII at full detail:

```
╔══════════════════════════════════════╗
║  FORGE      │      DEITIES     ▾    ║
╚══════════════════════════════════════╝
   ↑           ↑          ↑       ↑
   master-     pipe       class   caret
   view       divider     label   (one per
   label                          side)
```

**Construction**: ONE pill-shaped container with TWO independent click targets fused by a vertical `|` divider. Visually reads as a single object; functionally is two dropdowns.

- **Pill shell**: `display: inline-flex; height: 32px; border-radius: 16px (full-pill); border: 1px solid rgba(212,165,90,0.28); background: rgba(13,17,25,0.78); backdrop-filter: blur(12px);` — same glass-on-dark contract as the nav-hub trigger and the current Forge pill.
- **Position**: `fixed; top: 14px; left: 50%; transform: translateX(-50%);` — horizontally centered against the viewport (NOT the canvas, which can shift with detail-panel collapse — see §2.5).
- **Master-view side (LEFT)**: ~140px wide. Carries `[icon] LABEL ▾`. Icon = the view's sigil (Forge `⚒`, Timeline `⎯`, Map `⌖`, Pantheon `◯`). Label = the master view's name in caps-lock mono. Caret = gradient triangle, same as current `.forge-status-mode`.
- **Divider `|`**: 1px gold-soft (`rgba(212,165,90,0.28)`) vertical rule, full pill height. Same chrome as the current `border-left` on `.forge-status-mode`.
- **Class side (RIGHT)**: ~140px wide. Carries `LABEL ▾`. Label = the class name (Deities / Persons / Themes / All types / etc.).

**Hover & active states**:

```
Idle:        [  FORGE   │   DEITIES   ▾  ]   (gold text on glass)
Hover left:  [⌜FORGE⌝   │   DEITIES   ▾  ]   (left side brightens — gold-1)
Hover right: [  FORGE   │  ⌜DEITIES⌝  ▾  ]   (right side brightens)
Open left:   [  FORGE ▾ │   DEITIES   ▾  ]   + dropdown panel ANCHORED to pill bottom-left
                  ╔══════════════════╗
                  ║ ⚒  Forge   ← here║
                  ║ ⎯  Timeline      ║
                  ║ ⌖  Map           ║
                  ║ ◯  Pantheon      ║
                  ╚══════════════════╝
Open right:  [  FORGE   │  DEITIES ▾▾  ]   + dropdown panel ANCHORED to pill bottom-right
                                      ╔══════════════════╗
                                      ║ ◉  Deities  676  ║
                                      ║ ✎  Persons 1187  ║
                                      ║ ◇  Themes  497   ║
                                      ║ ◆  Events  309   ║
                                      ║ ✦  Symbols 280   ║
                                      ║ ≡  All     4475  ║
                                      ╚══════════════════╝
Both open:   shouldn't happen (one side closes the other on open — see §2.6 click-outside rules)
```

The two dropdown panels reuse the **same primitive** as the existing `.forge-mode-menu` / `.nav-hub-menu` (per the STYLE-GUIDE comment in `app.css` line 6212 — "Don't introduce a third primitive for similar pickers — reuse this + the popup"). Cell shape, padding, hover state, animation curve all locked.

#### Region C — Right side

The far-right slot is occupied by the existing **zoom-meter** (`#zoom-meter` in `index.html` line 175) on zoomable views. **No change.** The pill must not overflow into this region at narrow viewports — see §2.5 responsive rules.

**Optional Phase 22-E addition** (not in 22-A/B/C/D): a small **global search** affordance in the top-right (between pill and zoom-meter) that searches across all views' data. Deferred — current per-view search inputs are sufficient and the global one needs its own ranking heuristic. Decision in §10 D-12. Recommendation: defer.

### 2.2 Three rendered visual states

**State 1 — both dropdowns closed (steady state)**

```
┌────────────────────────────────────────────────────────────────┐
│ [✦]            ╔════════════════════════╗      [⛶100%]         │
│                 ║  ⚒ FORGE  │  DEITIES ▾║                       │
│                 ╚════════════════════════╝                      │
│                                                                │
│            (the rest of the view, unchanged)                   │
└────────────────────────────────────────────────────────────────┘
```

**State 2 — master-view dropdown open**

```
┌────────────────────────────────────────────────────────────────┐
│ [✦]            ╔════════════════════════╗      [⛶100%]         │
│                 ║  ⚒ FORGE ▾│  DEITIES ▾║                       │
│                 ╚════════════════════════╝                      │
│                 ┌──────────────────┐                            │
│                 │ ⚒  Forge      ←  │                            │
│                 │ ⎯  Timeline      │                            │
│                 │ ⌖  Map           │                            │
│                 │ ◯  Pantheon      │                            │
│                 │ ──────────────── │                            │
│                 │ ✦  Browse all… → │ (opens preferences drawer  │
│                 └──────────────────┘   with the legacy view list)
└────────────────────────────────────────────────────────────────┘
```

**State 3 — class dropdown open**

```
┌────────────────────────────────────────────────────────────────┐
│ [✦]            ╔════════════════════════╗      [⛶100%]         │
│                 ║  ⚒ FORGE  │  DEITIES ▾║                       │
│                 ╚════════════════════════╝                      │
│                              ┌──────────────────┐               │
│                              │ ◉ Deities    676│               │
│                              │ ✎ Persons   1187│               │
│                              │ ◇ Themes     497│               │
│                              │ ◆ Events     309│               │
│                              │ ✦ Symbols    280│               │
│                              │ ⊙ Traditions 307│               │
│                              │ ────────────── │               │
│                              │ ≡ All types 4475│               │
│                              └──────────────────┘               │
└────────────────────────────────────────────────────────────────┘
```

Both dropdowns anchor to the pill's bottom edge, aligned to the corresponding side's left/right respectively. Anchor logic identical to `wireModeDropdown` lines 4765–4773 (`getBoundingClientRect`, then position `top: rect.bottom + 6, left: ...`).

### 2.3 Pill width math

Each side: ~140px (icon 18px + label up to 110px + caret 8px + padding 4px = ~140px). Divider 1px. Total pill width ~280px. At narrow viewports (<1100px) the pill could collide with the zoom-meter; see §2.5.

### 2.4 What the Forge bottom bar looks like AFTER the refactor

```
[⛶100%] [LEGEND▾] [VIEW▾] [search…] [⤚in—◯—out⤙] [FX▾] [STYLE▾] [⌗]
```

— literally identical to today, MINUS the in-Forge top status row containing `.forge-status-tag FORGE` and `.forge-status-mode Deities▾`. The status row (`.forge-status`) either gets deleted entirely or kept as a hidden-by-default dev-overlay row (see §1.2 verdict). Recommendation in §10 D-08: delete the row; restore on demand via `_forgeDebug.showStatusRow()` if dev work needs the readouts.

### 2.5 Responsive behavior

Three breakpoints based on viewport width (the pill must remain centered and unobstructed):

| Viewport | Behavior |
|---|---|
| **≥ 1280px** (desktop) | Full pill at center-top. Preferences icon at left, zoom-meter at right, comfortable air on both sides. |
| **960–1279px** (narrow desktop / tablet landscape) | Pill stays centered but shrinks to ~240px wide (each side ~115px). Labels truncate with `text-overflow: ellipsis`. Zoom-meter moves to right edge with tighter inset. |
| **< 960px** (tablet portrait / phone) | Pill collapses to **one combined button** showing both labels stacked or hyphenated: `FORGE · DEITIES ▾`. Single click opens a UNIFIED dropdown with both sections shown (LAYOUT group on top, CLASS group below — see §2.6 unified-mobile mockup). The preferences icon collapses into the same combined button as a `☰` prefix. |

**Unified-mobile mockup (< 960px)**:

```
┌────────────────────────────────────────────┐
│       [ ☰ FORGE·DEITIES ▾ ]      [⛶]       │
│       ┌──────────────────┐                  │
│       │ PREFERENCES    → │                  │
│       │ ──────────────── │                  │
│       │ VIEW             │                  │
│       │  ⚒ Forge      ←  │                  │
│       │  ⎯ Timeline      │                  │
│       │  ⌖ Map           │                  │
│       │ ──────────────── │                  │
│       │ CLASS            │                  │
│       │  ◉ Deities    ←  │                  │
│       │  ✎ Persons       │                  │
│       │  …               │                  │
│       └──────────────────┘                  │
└────────────────────────────────────────────┘
```

The mobile/narrow path is acceptable to defer to Phase 22-E polish; Phase 22-A/B/C ship the desktop-only layout. Decision in §10 D-11. Recommendation: ship desktop in 22-A/B/C; add 960px collapse rule in 22-E.

### 2.6 Click-outside, escape, mutual-exclusion behavior

- **Click outside a dropdown**: closes it. Standard pattern, identical to the current `wireModeDropdown` (`forge.js` lines 4804–4807) and the nav-hub-menu (`app.js` lines 740–744).
- **Escape key**: closes the open dropdown.
- **Open one side → if the other side is open, close it first.** Single-source-of-truth pattern: at most one of {`mv-dropdown-open`, `class-dropdown-open`, `prefs-drawer-open`} body class is set at any time. The three are mutually exclusive at the UI level.
- **Pointer-on-pill**: the divider `|` is a non-interactive 1-2px hit region; clicks on it route to whichever side is left/right of the pointer.

---

## §3. State + LS schema

### 3.1 State migration map

What moves from view-internal state to app-level state:

| Today | Tomorrow | Notes |
|---|---|---|
| `local.mode.id` in Forge (the Deities/Authors/… filter) | `STATE.classFilter` (app-level, `app.js`) | Read by Forge in `rebuildForMode`; written by the pill's class side. |
| `STATE.pantheonMode` in app.js (the legacy V1 Pantheon submode `deities/authors/symbols/…`) | folded into `STATE.classFilter` for the V2 Pantheon when it's promoted to a master view, or sunset if V2 stays deities-only | Pantheon V2 currently locked to deities; promotion is in §10 D-02. |
| `STATE.filter.type` (the global type filter on legacy views) | unchanged for legacy views; new code uses `STATE.classFilter` | Old views keep working; new views read the new state. Reconciliation in §10 D-13. |
| `STATE.view` (which master view is mounted) | unchanged; still the canonical master-view register | The pill's master-view side just writes here and calls `setView(name)`. |
| `local.lockedSet` in Forge | unchanged (stays view-internal) | The locked-deity set is Forge-specific (it's its own visual treatment); see §3.3. |
| `forge.viewSettings.v7` LS key | unchanged | View-internal toggles, layer toggles, color theme, family order. Stays. |
| `codex-atlas/forge-runtime-v1` LS key | unchanged | Mode + timeline + locks + uxMode. The `mode` field stays as the source-of-truth for the per-view class default (see §5.4). |

### 3.2 New app-level LS schema

The pill needs ONE new LS key, with a tiny payload:

```
key:   codex-atlas/app-shell-v1
value: {
  classFilter: 'deities',        // current class — survives reload
  masterView:  'forge',          // current master view; redundant with STATE.view from URL,
                                 //   but a fallback for hash-less loads
  prefs: {
    // Phase 22-D contents — see §6
    loginStub: { displayName: null, tier: 'public' },
    theme:     null,             // null = inherit current behavior
    fontScale: 1.0
  }
}
```

**Schema version**: start at `v1`. Bump on any breaking change (new shape).

### 3.3 Cross-view persistence rules

| State | Survives class switch (same view)? | Survives view switch (same class)? | Lives where |
|---|---|---|---|
| `STATE.classFilter` | by definition no | YES | app-level (LS `app-shell-v1.classFilter`) |
| `STATE.view` | YES | by definition no | app-level (LS + URL `?view=`) |
| Forge `local.lockedSet` | conditional — see below | YES if the locked node ids still exist in the new view's data, else dropped | view-internal (LS `forge-runtime-v1.lockedSet`) |
| Forge `local.uxMode` (color theme, family order, distribution) | YES (within Forge) | only applies when re-mounting Forge | view-internal |
| Forge `forge.viewSettings.v7` (layer toggles, tier filters) | YES | YES (cross-view sticky) | view-internal LS but read globally — see §5 |
| `STATE.scriptureCorpus` | n/a (Scripture is its own master view, not classed) | YES | app-level for now (`STATE.*`) — Scripture is excluded from the pill |
| `STATE.atlasEra` | n/a | YES | app-level |

**Locked set cross-class behavior** (the surprise case):

Today John locks Zeus in Forge × Deities; switches to Forge × Persons via the (new) class side. Zeus's node id doesn't appear in the Persons-filtered data set — Forge `rebuildForMode` currently drops locks that don't exist in the new mode (`forge.js` line 2447 in the `preserveLocks` path filters `savedLocks` against the new adjacency).

Two options:

- **(A) Drop locks on class change.** `setClassFilter()` calls `rebuildForMode(newId, { preserveLocks: false })`. Cleanest semantic: locks are class-scoped.
- **(B) Keep locks across class switches.** Same `preserveLocks: true` path used today by the View-settings color/order radios. Locks survive in `local.lockedSet`; ids that aren't in the new class get filtered at the pack-time barrier (already happens). Zeus comes back when the user flips back to Deities.

Recommendation (§10 D-07): **(B)** — keep locks. The "lock" is a user assertion "I care about this entity" — it shouldn't evaporate when they rotate the view. Forge already implements the filter; the cost is one boolean.

### 3.4 LS schema bump

- `codex-atlas/forge-runtime-v1` — unchanged. `mode` field still drives the **per-view default class on first mount** (see §5.4); after first mount the app-level `STATE.classFilter` is authoritative.
- `codex-atlas/app-shell-v1` — NEW. Created in Phase 22-A; populated in 22-C/22-D.
- `forge.viewSettings.v7` — unchanged.

No version bump on existing keys. Back-compat default: absent `app-shell-v1` → seed with `{ classFilter: <derived from forge-runtime-v1.mode>, masterView: <STATE.view>, prefs: { loginStub: { tier: 'public' }, theme: null, fontScale: 1.0 } }`. Decision §10 D-06.

---

## §4. View contract — what every master view must implement

For a view to be a sibling in the master-view pill, it must implement a tight contract. The contract is intentionally minimal so existing views are cheap to adapt.

### 4.1 Required interface

```js
VIEWS[name] = {
  // Existing fields — all views have these today.
  title:    'Forge',                    // display name (used in the pill icon + label)
  subtitle: '…',                        // optional; hidden in CSS
  render(): Function,                   // existing mount lifecycle

  // NEW fields — required for master-view promotion.
  master: {
    icon:        '⚒',                   // 1-glyph sigil shown next to the label in the pill
    pillLabel:   'FORGE',               // short caps-lock label shown in the pill (defaults to title.toUpperCase())
    order:       10,                    // sort order in the master-view dropdown (lower = earlier)

    // Class support — see §5 for the legal class names.
    classes:     ['deities', 'persons', 'themes', 'events', 'symbols',
                  'traditions', 'all'], // or 'all' alone if the view supports every class

    defaultClass: 'deities',            // default class on first mount; LS override survives

    // Optional: cheap class-refilter that does NOT teardown the view.
    // If absent, the pill falls back to setView(name) which is a full remount.
    setClassFilter(classId): void       // called when the user picks a new class while
                                        // already mounted in THIS view. May be omitted.
  },

  // Optional: contribute view-specific buttons to the top-right of the canvas.
  // The pill itself OWNS the master-view + class slots; this is for view-specific
  // controls that don't fit the pill vocabulary (e.g. Forge's bottom bar today, or
  // Scripture's corpus picker if Scripture is promoted later).
  //
  // For Phase 22-A/B/C, NO view declares topbarRight — it's a hook for later.
  topbarRight(): HTMLElement | null
};
```

### 4.2 Lifecycle reminder

The existing lifecycle in `setView(name)` (`app.js` lines 513–619) doesn't change. Specifically:

1. **Teardown**: `setView` already destroys `.pantheon-v2-pane`, `.forge-pane`, `.scripture-reader-pane`, `.atlas-pane`, and the SVG layer. Each view's `_engine.destroy()` is called.
2. **Mount**: `v.render()` is called fresh on every view-change.
3. **Idempotent re-render**: `setView(STATE.view)` is the canonical "re-render after a filter change" path. Used by many existing callers (e.g. `app.js` line 10316 after `STATE.filter` changes).

The new pill calls `setView(name)` on master-view changes (full remount), but can call `view.master.setClassFilter(newClass)` on class-only changes IF the current view declares it. Forge's implementation of `setClassFilter` would internally call `rebuildForMode(newClass, { preserveLocks: true })` — the existing fast path. Views without `setClassFilter` fall back to a full `setView(STATE.view)` remount.

### 4.3 Class declaration

Each master view declares which CLASSES it supports. Three policy options:

- **Whitelist** (`classes: ['deities', 'persons', 'themes']`) — only these are offered in the dropdown when this view is active.
- **All** (`classes: 'all'`) — every legal class shows in the dropdown.
- **Reject** — pick "Persons" while in a deities-only view causes the pill to gray-out the option (not clickable) with a tooltip "this view shows deities only".

Recommendation (§10 D-10): **whitelist per view, with `all` shorthand for "every legal class"**. Concretely:

| View | `master.classes` |
|---|---|
| **forge** | `'all'` (Forge already supports every modemod entry — 30 entries today + `all-types` per the timeline-mode audit) |
| **timeline** | `'all'` (per the timeline-mode audit §6.2 — Timeline ships with `all-types` as its headline default) |
| **atlas** (Map) | `['deities', 'persons', 'themes', 'events', 'traditions', 'sacred-architecture', 'places', 'all']` — only geo-tagged classes; tightens the dropdown to ~6 entries plus All |
| **pantheon** (if promoted) | `['deities']` only — V2 is deities-only by design today |

### 4.4 Pill labels per view

The master-view side of the pill must show a short label. Default = `title.toUpperCase()` but views can override:

| View | `master.pillLabel` | `master.icon` |
|---|---|---|
| **forge** | `FORGE` | `⚒` |
| **timeline** | `TIMELINE` | `⎯` |
| **atlas** | `MAP` (per memory `feedback_atlas_is_map.md` — John calls it "the Map" even though the code calls it `atlas`) | `⌖` |
| **pantheon** (optional) | `PANTHEON` | `◯` |

The label/icon source of truth lives in each view's `master.*` block. The pill reads from there at every render. No hardcoded list in app.js (avoids drift).

### 4.5 Optional: view-specific top-bar contributions

For Phase 22 specifically, NO view contributes anything to the top-bar beyond the pill itself. The hook exists for future use (e.g. a Scripture promotion would contribute the corpus dropdown).

---

## §5. Class contract

### 5.1 Legal class names

The classes are a **superset** of node-type filters — they overlap with `modemod.MODES` but are NOT identical to it. Initial roster (§10 D-01):

| Class id | Maps to node type(s) | Count (2026-05-23) | Notes |
|---|---|---|---|
| `deities` | `type='deity'` | 682 | Default per Forge today |
| `persons` | `type='person'` | 1187 | The author/figure tier (called "authors" in modemod for legacy reasons) |
| `themes` | `type='theme'` | 497 | |
| `events` | `type='event'` | 309 | |
| `symbols` | `type='symbol'` | 280 | |
| `traditions` | `type='tradition'` | 307 | |
| `documents` | `type='document'` | 495 | |
| `sacred-architecture` | `type='sacred-site'` | 125 | per ontology lock 2026-05-18 |
| `places` | `type='place'` | 111 | |
| `music` | `type='music'` | 108 | |
| `rituals` | `type='ritual'` | 106 | |
| `all` | every type (~4475) | 4475 | The Timeline default per the timeline-mode audit |

The dropdown shows ~12 entries plus `all`. Smaller node-type modes from `modemod.MODES` (alphabet 41, alchemy 35, doctrine 14, divination-system 13, calendar-system 11, philosophy 9, math 8, medicine 8, attire 10, technology 25, exchange-network 57, substance 3, moral 12, relic 11, practice 11) can be reached via the Forge view's INTERNAL legacy mode dropdown (not removed in Phase 22-C — see §10 D-08). The class pill is a **shortlist of the headline classes**, not the exhaustive modemod list.

Reasoning: the pill is a macro-overview. If we put all 30 modemod entries in it, the dropdown becomes a phone book and the user has the same problem as today. The shortlist + the Forge-internal legacy picker is the "headline class + power-user override" pattern.

### 5.2 Class → view-specific filter mapping

Each master view interprets the class differently:

| Class | Forge interpretation | Timeline interpretation | Map interpretation |
|---|---|---|---|
| `deities` | `rebuildForMode('deities')` — same as today | filter to `type='deity'`, render in band-chart | filter to deities with `geo.lat / geo.lon` |
| `persons` | `rebuildForMode('authors')` — Forge calls this mode "authors" | filter to `type='person'`, band-chart | filter to persons with geo |
| `all` | `rebuildForMode('all-types')` — per timeline-mode audit §6.2 | the headline 4373-node band-chart | filter to all nodes with geo |
| (etc) | ... | ... | ... |

Mapping table lives in `app.js` once, read by every view's `setClassFilter`. View-specific overrides live in the view file.

### 5.3 LS persistence

`STATE.classFilter` round-trips through `codex-atlas/app-shell-v1.classFilter`. Initial seed:

1. If `app-shell-v1.classFilter` exists in LS → use it.
2. Else if `forge-runtime-v1.mode` exists → seed `classFilter` from it (back-compat).
3. Else → use the current view's `master.defaultClass` (Forge=`deities`, Timeline=`all`, etc).

This means a returning user who last had `mode: 'authors'` in Forge comes back with `classFilter: 'persons'` (after the `authors`→`persons` rename — see §5.4).

### 5.4 Default per view

Each master view declares `master.defaultClass`. The class side of the pill resets to that default **only on first ever mount of that view in the current session**; after that, the LAST USER CHOICE for that view persists. Concretely:

- First load: classFilter = view.master.defaultClass
- User picks `persons`: classFilter = `persons`; LS saves it.
- User switches Forge → Timeline: classFilter stays `persons` (cross-view persistence per §3.3).
- User reloads page: comes back at classFilter = `persons`.
- User clears LS / new browser: classFilter = current-view.master.defaultClass = Forge.deities or Timeline.all.

Decision §10 D-05: **last-choice sticky, with per-view defaults on first mount**.

### 5.5 Class rejection

When a view doesn't support the currently selected class, two options:

- **(A) Auto-switch class** on view-mount to the view's defaultClass. E.g., switching Forge→Map while `classFilter='alchemy'` (Map doesn't support alchemy) would silently swap to `classFilter='deities'`.
- **(B) Keep class, show empty state.** The Map view, with `classFilter='alchemy'`, mounts and shows an empty map with a "No alchemy nodes have geo" message.

Recommendation (§10 D-13): **(A) auto-switch with a brief toast** — "Map doesn't show Alchemy; switched to Deities." This avoids confusing empty states. The toast is a 2-second fade in the bottom-right.

### 5.6 The legacy `STATE.filter.type` reconciliation

Many existing list views read `STATE.filter.type` (set by the hidden `#filter-type` input or by URL params). To avoid breaking them, `setClassFilter(newClass)` ALSO writes to `STATE.filter.type` via the existing mapping. Pure additive — no legacy code changes. After all consumers migrate (Phase 22-E polish), `STATE.filter.type` could be deprecated, but not in this refactor.

---

## §6. Preferences drawer scope

The far-left icon (`✦` / `☰`) opens the Preferences drawer. The drawer is the master settings panel — distinct from per-view settings (Forge's VIEW panel, etc.).

### 6.1 Drawer layout (ASCII)

```
┌─────────────────────────────────────────┐
│   ✦  CODEX ATLAS                  [×]   │  ← header
│   investigation across traditions       │
│   ────────────────────────────────────  │
│                                         │
│   ACCOUNT                               │  ← Phase 22-D login stub
│   ┌─────────────────────────────────┐   │
│   │  Not signed in                  │   │
│   │  [ Sign in ]   [ Create… ]      │   │
│   └─────────────────────────────────┘   │
│                                         │
│   ATLAS                                 │  ← Phase 22-D utility section
│   ⓘ  Atlas Statement                    │  ← opens CODEX §I–V modal
│   🛍  Codex Shop  (coming soon)          │  ← placeholder; no link
│   ✦  Browse all views                   │  ← legacy nav-hub-menu folded in here
│   ────────────────────────────────────  │
│                                         │
│   DISPLAY                               │  ← Phase 22-D display preferences
│   ◐  Visual style  ▾  [Codex]           │  ← reuses existing style-menu
│   ↹  Font scale    ─●──   1.00×         │
│   ────────────────────────────────────  │
│                                         │
│   ABOUT                                 │
│   Version 2026-05-23                    │
│   CODEX v1.3                            │
│   4475 nodes · 21,400 edges             │
│                                         │
└─────────────────────────────────────────┘
```

The drawer slides in from the LEFT EDGE of the viewport when the icon is clicked (`transform: translateX(-100%)` → `translateX(0)`). Width = 320px. Backdrop blur with click-outside-closes behavior. Animation 220ms ease.

### 6.2 Section: HEADER — logo + title

- Codex Atlas brand glyph (`✦` 22px) + "CODEX ATLAS" in serif caps.
- Subtitle: "investigation across traditions" (single line, mono).
- Close button `[×]` top-right.
- Click on the brand block → does nothing (no home button). The pill's master-view selector is the canonical "go home" affordance.

### 6.3 Section: ACCOUNT (login stub)

For Phase 22-D, scope = **placeholder + storage**, NOT a real auth system.

**Visible UI**:

```
┌─────────────────────────────────────┐
│  Not signed in                      │   ← idle state
│  [ Sign in ]   [ Create account ]   │
└─────────────────────────────────────┘
```

OR (post-signin stub):

```
┌─────────────────────────────────────┐
│  ⓘ  john@example.com                │   ← signed-in state (stub)
│  Tier: Subscriber                   │
│  [ Sign out ]   [ Account… ]        │
└─────────────────────────────────────┘
```

**Backend wiring**: NONE in Phase 22-D. Clicking "Sign in" opens a modal that says "Sign-in is not yet available. The trusted-subscriber program launches with MAGNUM access (CODEX §IX)." Clicking "Sign out" clears `app-shell-v1.prefs.loginStub`. The whole stub is a UI dress-rehearsal.

**Storage stub**: `app-shell-v1.prefs.loginStub = { displayName, email, tier }` is the schema; written only by the (currently disabled) sign-in flow. Tier values: `public` (default), `subscriber`, `institution`. Per CODEX §IX, MAGNUM access requires `subscriber` or `institution` — the eventual auth backend writes here.

**Where the real auth backend plugs in**: when Phase 23+ adds Tauri 2 / OAuth / session tokens (see memory `feedback_vektor_sibling_handoff.md` — the sibling product the portable core offers a trusted-subscriber backend), the modal's "Sign in" button becomes the entry-point. Until then, the modal is dressing.

Decision §10 D-03: **ship the stub in 22-D** with the modal saying "coming soon". John has explicitly hinted at this in the brief; the UI scaffolding lets the auth-backend phase land without front-end rework.

### 6.4 Section: ATLAS (utility entries)

Three rows, each navigable:

- **ⓘ Atlas Statement** — opens a modal rendering CODEX §I–V (Posture / Disclaimer Machine / 21-type vocab / 4-tier system / Rejection list). Replaces the current `VIEWS.about` (which gets sunset). Source: `00_meta/CODEX.md` rendered as markdown via the existing `marked.parse()` pipeline. Modal full-screen on mobile; centered card on desktop.
- **🛍 Codex Shop (coming soon)** — placeholder row. Tooltip on hover says "Coming soon — physical editions, art prints, decanic deck." No link.
- **✦ Browse all views** — opens an EXPANDED panel-within-the-drawer with the same content as today's `.nav-hub-menu` (the full view list including legacy index views). This is where users find Authors / Themes / Connections / Traditions / Patterns / Observations / Chains / All nodes / Documents / Astrology / Alchemy / etc. — everything that's NOT in the master-view pill.

### 6.5 Section: DISPLAY (preferences)

Three rows. Phase 22-D ships rows 1 and 3; row 2 is queue-for-22-E.

- **◐ Visual style ▾ [Codex]** — opens the existing `#style-menu` from `index.html` line 109 (13 presets: Codex / Crypt / Mystic / Twilight / Technical / Parchment / Vatican / Nag Hammadi / Passion / Orthodox / Atlantis / All-Seeing Eye / Hermes). This menu already exists; the drawer just provides a NEW entry-point for it (the old style-button in the hidden sidebar is dead UI). No new code beyond the click handler.
- **↹ Font scale (1.00×)** — slider 0.85× to 1.20×. Writes CSS variable `--font-scale-mult` on `body`. Stored in `app-shell-v1.prefs.fontScale`. Queue for Phase 22-E.
- **(future) ☾ Color theme** — Atlas / Roots / Geography / etc. Today lives in Forge's VIEW panel. **Stays in Forge** — it's wheel-specific. Don't promote.

### 6.6 Section: ABOUT (info)

Bottom-of-drawer info block:
- App version (snapshot date)
- CODEX version (1.3)
- Live node / edge counts (read from `DATA.generated_at_utc`, `DATA.nodes.length`, `EDGES.length`).

Static. No interactive elements.

### 6.7 Drawer interaction rules

- Open: click `✦` trigger.
- Close: click `×`, click outside the drawer, press Escape, or click any item that navigates away (master view change auto-closes).
- Animation: 220ms cubic-bezier(0.2, 0.8, 0.2, 1) — same curve as nav-hub-menu.
- Mutually exclusive with both pill dropdowns (see §2.6).

---

## §7. Migration plan — phased

Strictly sequential. Each phase = one Lane B slot claim = one commit = one acceptance gate. No phase merges into the next without verification. Cache-bust the version string on every phase.

### Phase 22-A — APP SHELL HTML + CSS (no functional change)

**Mandate:** scaffold the new top-bar HTML in `index.html` + the new CSS in `src/styles/app.css`. The new pill and preferences drawer trigger appear on every view but do NOTHING when clicked (or open empty placeholders). The existing Forge bottom-bar pill keeps working.

**Sub-audit (22-A1 — read-only goblin):**
Walk every existing top-region element (`.nav-hub-trigger`, `.nav-hub-menu`, `.view-header`, `.forge-status`, `.zoom-meter`) and surface every z-index conflict, every position-fixed coordinate, every layout-shift risk when the pill lands. Output: `AUDIT/topbar-22A-shell-audit-<date>.md`.

**Implementation (22-A2):**

1. **Add HTML scaffolding** in `index.html` between line 26 (end of nav-hub-menu) and line 33 (start of sidebar `<nav class="side">`):
   ```html
   <!-- Phase 22-A — App-shell top bar. The center pill is the master-
        view + class macro-control. The preferences drawer trigger
        replaces the nav-hub trigger's role (still uses the ✦ icon
        and the same fixed position). -->
   <div class="app-topbar" id="app-topbar" role="toolbar">
     <button class="app-pill" id="app-pill" type="button">
       <span class="app-pill-mv" id="app-pill-mv" data-side="mv"
             aria-haspopup="menu" aria-expanded="false">
         <span class="app-pill-mv-icon" id="app-pill-mv-icon">⚒</span>
         <span class="app-pill-mv-label" id="app-pill-mv-label">FORGE</span>
         <span class="app-pill-caret">▾</span>
       </span>
       <span class="app-pill-divider" aria-hidden="true"></span>
       <span class="app-pill-class" id="app-pill-class" data-side="class"
             aria-haspopup="menu" aria-expanded="false">
         <span class="app-pill-class-label" id="app-pill-class-label">Deities</span>
         <span class="app-pill-caret">▾</span>
       </span>
     </button>
   </div>
   ```
2. **Add CSS** for `.app-topbar`, `.app-pill`, `.app-pill-mv`, `.app-pill-divider`, `.app-pill-class`, `.app-pill-caret`. Mirror the visual contract from `.forge-status-mode` (lines 6225–6260) and `.nav-hub-menu` (lines 443–512). Position: `fixed; top: 14px; left: 50%; transform: translateX(-50%); z-index: 245;` (between nav-hub-menu z=240 and nav-hub-trigger z=250 — see §9 acceptance gate).
3. **Add dropdown CSS** for `.app-pill-menu` (the two popup panels — both share one class with `data-side="mv|class"` for theming). Mirror `.forge-mode-menu` (lines 6269–6330).
4. **Add preferences drawer CSS** for `.prefs-drawer`. `position: fixed; left: 0; top: 0; bottom: 0; width: 320px; transform: translateX(-100%); transition: transform 220ms ease;`. `.prefs-drawer.is-open { transform: translateX(0); }`.
5. **Add preferences drawer HTML** placeholder (empty rows for ACCOUNT / ATLAS / DISPLAY / ABOUT sections per §6.1). Section bodies are stubs in 22-A; they get populated in 22-D.
6. **Wire NOTHING yet.** Pill clicks log to console; drawer trigger flips `body.prefs-drawer-open` class.

**Acceptance for 22-A:**
- New pill visible at top-center on every view; the old `.nav-hub-trigger` still works as before (it still opens the nav-hub-menu); no functional regression.
- `body.view-forge .forge-status-tag` + `body.view-forge #forge-status-mode` still display (the in-Forge pill is intact during this phase — duplicate UI is INTENDED for one phase).
- Boot clean, zero console errors on every view.
- Zoom-meter, detail panel, footer all still positioned correctly.
- Cache-bust string updated (e.g. `?v=20260524-22a-app-shell`).

**Risk:** low — pure additive UI scaffolding.

### Phase 22-B — WIRE the master-view selector

**Mandate:** clicking the LEFT side of the pill opens a dropdown listing all master views. Selecting an item calls `setView(name)`. The class side stays disabled / no-op.

**Sub-audit (22-B1 — view-contract goblin):**
For each candidate master view (`forge`, `timeline`, `atlas`, optional `pantheon`), document what would change in its `VIEWS[name]` declaration. Confirm no view-specific render path is broken by a `master: { ... }` field addition. Output: `AUDIT/topbar-22B-master-view-audit-<date>.md`.

**Implementation (22-B2):**

1. **Add `master: { … }` blocks** to each promoted view's `VIEWS[name]` declaration per §4. Concretely:
   - `VIEWS.forge.master = { icon: '⚒', pillLabel: 'FORGE', order: 10, classes: 'all', defaultClass: 'deities' }`
   - `VIEWS.timeline.master = { icon: '⎯', pillLabel: 'TIMELINE', order: 20, classes: 'all', defaultClass: 'all' }` (Note: `VIEWS.timeline` exists today as a legacy SVG view at `app.js:2045`. The Forge-Timeline-mode landing will REPLACE this — see timeline-mode audit; for Phase 22-B, the new pill simply points at whatever's currently at `VIEWS.timeline`.)
   - `VIEWS.atlas.master = { icon: '⌖', pillLabel: 'MAP', order: 30, classes: ['deities','persons','themes','events','traditions','sacred-architecture','places','all'], defaultClass: 'all' }`
   - `VIEWS.pantheon.master = { icon: '◯', pillLabel: 'PANTHEON', order: 40, classes: ['deities'], defaultClass: 'deities' }` (optional per §10 D-02)
2. **Build the master-view dropdown** when the pill's LEFT side is clicked. Iterate over `VIEWS` looking for entries with `master.*` set; sort by `master.order`; render as `.app-pill-menu[data-side="mv"]` rows mirroring `.fm-item` rows. Single-source — no hardcoded list.
3. **On row click**: `setView(rowDataset.view)` and `closeDropdown()`. Same handler shape as `wireModeDropdown` line 4793.
4. **Sync pill labels** on every `setView` — read the new view's `master.icon` / `master.pillLabel` and write to `#app-pill-mv-icon` + `#app-pill-mv-label`. If the new view has no `master.*` (legacy view reached via the drawer's "Browse all views"), set icon = the view's nav-side `.sym` and label = the view's `title.toUpperCase()` and gray-out the class side.
5. **Anchor + open/close logic**: copy verbatim from `wireModeDropdown` lines 4765–4817. Single shared close-on-outside handler for both sides.
6. **Add a "Browse all views →" footer row** in the master-view dropdown that opens the preferences drawer's "Browse all views" panel (Phase 22-D hook — drawer is empty in 22-B but the click is wired).

**Acceptance for 22-B:**
- Click left side of pill → dropdown opens; rows = Forge / Timeline / (Map) / (Pantheon).
- Click a row → `setView()` fires; canvas swaps to the chosen view; pill icon + label updates.
- LS round-trip: select Timeline, reload, comes back at Timeline (already handled by existing URL `?view=` + `loadRuntimeState`; verify).
- Existing nav-hub-menu still works (covers legacy index views).
- Click outside / Esc closes the dropdown.
- Forge bottom-bar pill (`forge-status-mode`) still works, still updates Forge mode (NOT class-pill-driven yet — that's 22-C).
- Smoke-test all currently-promoted master views + at least 3 legacy views (Authors / Themes / Scripture) → no regression.

**Risk:** medium-low — the pill anchor logic is a copy of `wireModeDropdown`, well-trodden. Risk: a master view that doesn't render fully on `setView()` without extra state setup. Mitigated by 22-B1 audit.

### Phase 22-C — WIRE the class selector + REMOVE the legacy Forge pill

**Mandate:** the RIGHT side of the pill becomes the live class selector. `STATE.classFilter` becomes app-level state. Forge consumes it. The in-Forge `.forge-status-tag` + `#forge-status-mode` are REMOVED.

**Sub-audit (22-C1 — class-state goblin):**
Walk every Forge call site that reads `local.mode.id`, every legacy view that reads `STATE.filter.type`, and every place `STATE.pantheonMode` / `STATE.scriptureCorpus` etc. is set. Surface every state-write that needs a parallel write to `STATE.classFilter`. Output: `AUDIT/topbar-22C-class-state-audit-<date>.md`.

**Implementation (22-C2):**

1. **Introduce `STATE.classFilter`** in `app.js` near the existing STATE declaration. Seed at boot from `app-shell-v1.classFilter` LS key, falling back to `forge-runtime-v1.mode` LS key, falling back to current view's `master.defaultClass`.
2. **Build the class dropdown** when the pill's RIGHT side is clicked. Rows = current view's `master.classes` filtered to non-empty (skip classes with zero nodes for the current view). Show node-count badge per class (e.g. `Deities · 676`).
3. **On class-row click**:
   - Update `STATE.classFilter`.
   - Save to LS (`app-shell-v1`).
   - If current view declares `master.setClassFilter` → call it (fast path).
   - Else → call `setView(STATE.view)` (slow remount path).
   - Update pill label.
   - Close dropdown.
4. **Add `setClassFilter` to Forge**: `VIEWS.forge.master.setClassFilter = (cls) => { _forge.setClassFilter(cls); }`. Inside forge.js, define `_forge.setClassFilter(cls)` that maps the class id to its Forge mode id (Deities → 'deities', Persons → 'authors' [legacy mode name], All → 'all-types' [pending modemod addition per timeline audit §6.2]) and calls `rebuildForMode(modeId, { preserveLocks: true })` + `syncModeButtonLabel`. The map table is the §5.2 mapping.
5. **REMOVE the in-Forge top status row pill chrome**:
   - Delete `forge.js` lines ~1027–1047 (the `.forge-status` innerHTML setting). Keep the `.forge-status` element ITSELF as a hidden dev-overlay surface (or delete it entirely — decision §10 D-08).
   - Delete `wireModeDropdown` (`forge.js` lines 4746–4818) — replaced by app-level wiring.
   - Delete `syncModeButtonLabel` calls in `forge.js` (lines 2158, 2226, etc.) — the label is owned by the pill now.
   - Delete `.forge-status-tag`, `.forge-status-mode`, `.forge-mode-menu`, `.fm-*` CSS in `app.css` lines 6196–6330 — replaced by `.app-pill-*` and `.app-pill-menu`.
6. **Auto-class-switch on incompatible view-class combos** per §5.5 option A: in `setView(name)`, after the view mounts, check if `STATE.classFilter ∈ view.master.classes` (or `view.master.classes === 'all'`). If not, set `STATE.classFilter = view.master.defaultClass` and show a 2-second toast: "Map doesn't show Alchemy; switched to Deities."

**Acceptance for 22-C:**
- Click right side of pill → class dropdown opens; rows = view-appropriate classes with node counts.
- Click `Persons` while in Forge → wheel rebuilds with persons (no full mount).
- Switch Forge → Timeline with class=Persons → Timeline renders persons in band-chart.
- Switch Forge → Map with class=Alchemy → toast appears, class auto-switches to Deities.
- The in-Forge top status row (FORGE | Deities pill) is GONE.
- `forge.viewSettings.v7` still works (legacy state).
- LS round-trip: pick Timeline + Persons, reload, comes back at Timeline + Persons.
- Locks preserved across class changes within Forge (per §3.3 decision B).
- Smoke-test the 30 Forge mode entries are still reachable via the Forge view's INTERNAL legacy mode dropdown (NOT removed — see §10 D-08). Wait — IF D-08 votes to remove, then they're reachable only via the class pill's 12-entry shortlist. Decision below.

**Risk:** medium — first phase that mutates Forge state significantly. The 30-mode-vs-12-class reconciliation (D-08) is the biggest fork-point.

### Phase 22-D — PREFERENCES DRAWER WIRING

**Mandate:** clicking the ✦ icon opens the preferences drawer with live content. Atlas Statement renders CODEX §I–V. Login UI is a stub.

**Sub-audit (22-D1 — drawer-content goblin):**
Walk the existing About view's content (`app.js` line 10044) + the existing nav-hub-menu's full list. Map every existing entry to its new drawer location. Output: `AUDIT/topbar-22D-drawer-audit-<date>.md`.

**Implementation (22-D2):**

1. **Build the drawer DOM** per §6.1 layout. Sections: HEADER / ACCOUNT / ATLAS / DISPLAY / ABOUT.
2. **Wire ✦ trigger** to toggle `body.prefs-drawer-open` and `.prefs-drawer.is-open`. (The trigger element is the existing `#nav-hub-trigger` — repurposed. The old click handler is REPLACED to open the drawer instead of the nav-hub-menu. The nav-hub-menu element is reused inside the drawer's "Browse all views" panel.)
3. **ACCOUNT section**: render the not-signed-in state. Click "Sign in" → modal saying "Sign-in not yet available; trusted-subscriber program launches with MAGNUM access (CODEX §IX)." Click "Create account" → same modal.
4. **ATLAS section**:
   - **Atlas Statement** click → modal rendering CODEX §I–V via `marked.parse(<fetched CODEX.md text>)`. Source: fetch `00_meta/CODEX.md` at runtime (it's in the deployed `data.js` bundle? — verify in 22-D1 audit; if not, inline the text or include as a fetched static asset). Modal has close button and Escape-to-close.
   - **Codex Shop** click → does nothing; tooltip "Coming soon."
   - **Browse all views** click → expands an in-drawer panel listing every `VIEWS.*` entry (master views + legacy index views). Same content as today's nav-hub-menu (built by the existing `buildMenu` helper at `app.js` line 658).
5. **DISPLAY section**:
   - **Visual style** click → opens the existing `#style-menu` (positioned to the right of the drawer). No new menu logic.
   - **Font scale slider**: writes CSS variable `--font-scale-mult` and saves to `app-shell-v1.prefs.fontScale`. Affects body via `font-size: calc(var(--font-base) * var(--font-scale-mult, 1))`.
6. **ABOUT section**: static text from `DATA.generated_at_utc`, `DATA.nodes.length`, `EDGES.length`. CODEX version hardcoded as "1.3" (or read from CODEX.md frontmatter if available).
7. **Sunset `VIEWS.about`**: redirect any `setView('about')` calls to open the Atlas Statement modal instead. Or keep `VIEWS.about` as a back-compat stub that simply triggers the modal.

**Acceptance for 22-D:**
- Click ✦ → drawer slides in from left.
- Click outside drawer / ✦ / Esc → drawer slides closed.
- Click Atlas Statement → modal opens with CODEX §I–V content rendered as markdown.
- Click Sign in → "coming soon" modal.
- Click Browse all views → in-drawer panel shows every view; clicking a row calls `setView()` and closes the drawer.
- Click Visual style → existing style-menu opens.
- Font scale slider live-updates body font size.
- Reload preserves font scale.
- Click About → modal opens (back-compat).

**Risk:** medium — most surface area touched. Single biggest dependency: the CODEX.md content needs to be accessible at runtime (fetch the file? bake into data.js?). Audit in 22-D1.

### Phase 22-E — POLISH / RESPONSIVE / VERIFY

**Mandate:** narrow-viewport collapse, smoke-test every promoted view + every legacy view, run cache-bust, run pluginval (if applicable — Forge tests).

**Sub-audit (22-E1 — cross-view stress goblin):**
For each of the ~12 reachable master + commonly-used legacy views, walk through master-view-switch + class-switch + drawer-open sequences. Catalog any visual glitch, any console error, any orphaned listener. Output: `AUDIT/topbar-22E-polish-audit-<date>.md`.

**Implementation (22-E2):**

1. **Narrow-viewport collapse**: implement §2.5 breakpoints. Below 960px the pill collapses to one combined button with a unified dropdown.
2. **Animation polish**: refine the 220ms easing curves; add a subtle scale-in on dropdown open per §2.2 mockup conventions.
3. **Keyboard navigation**: arrow keys cycle dropdown rows; Enter selects; Tab moves between mv-side and class-side.
4. **Accessibility audit**: ARIA roles on the pill (`role="toolbar"` on container, `role="button" aria-haspopup="menu" aria-expanded` on each side), dropdown rows (`role="menuitem"`), drawer (`role="dialog"`).
5. **Focus restoration**: closing a dropdown restores focus to the trigger. Same for drawer.
6. **Smoke-test** the full view universe + run any existing Forge test harness (`_forgeDebug.runAllChecks()` if present).
7. **Cache-bust** the global version string (`index.html` line 11 + every `?v=` in `<script>` tags).

**Acceptance for 22-E:**
- All views renderable from the pill.
- All legacy views reachable from the drawer's Browse all views entry.
- 960px / 1280px / 1920px viewports all read cleanly.
- Keyboard navigation works.
- No console errors on any view-switch / class-switch / drawer-open.
- Forge 4-second smoke (boot + click around + lock + class-switch + view-switch) clean.
- Memory: no listener leaks across 10 view-switches (Chrome devtools).

**Risk:** low — pure polish; iteration time built in.

---

## §8. Code-touch map

For each phase, the files + rough line ranges that will change. Conservative — flag uncertainty.

### Phase 22-A — Shell HTML + CSS

| File | Lines | Change |
|---|---|---|
| `index.html` | ~27 (insert) | Add `<div class="app-topbar"…>` block before line 33 (the `<nav class="side">`). |
| `index.html` | 11 | Bump cache-bust string to `?v=20260524-22a-app-shell`. |
| `src/styles/app.css` | append ~end of file (~8156) | New section `/* ── Phase 22-A — App-shell top bar ── */` with `.app-topbar`, `.app-pill`, `.app-pill-mv`, `.app-pill-divider`, `.app-pill-class`, `.app-pill-caret`, `.app-pill-menu`, `.prefs-drawer` (~250 LOC). |
| `src/styles/app.css` | 404–512 | Move/note: the existing `.nav-hub-trigger`/`.nav-hub-menu` block stays for now; the trigger's behavior changes in 22-D, not the styling. |

### Phase 22-B — Master-view selector

| File | Lines | Change |
|---|---|---|
| `src/js/app.js` | 939–951 (VIEWS.forge) | Add `master: { icon, pillLabel, order, classes, defaultClass }` block. |
| `src/js/app.js` | 2045 (VIEWS.timeline) | Add `master: { … }` block (current timeline is legacy SVG; the spec applies to the new Timeline once that lands). |
| `src/js/app.js` | 7384 (VIEWS.atlas) | Add `master: { … }` block. |
| `src/js/app.js` | 912 (VIEWS.pantheon) — optional per D-02 | Add `master: { … }` block. |
| `src/js/app.js` | new function around line ~750 (after the existing `mountNavHub` IIFE) | Add `mountAppPill()` IIFE that builds the master-view dropdown content, anchors it, wires click. |
| `src/js/app.js` | 619 (end of setView) | After `v.render()`, also call `syncAppPill()` to update pill labels. |

### Phase 22-C — Class selector + remove Forge pill

| File | Lines | Change |
|---|---|---|
| `src/js/app.js` | new `STATE.classFilter` near existing STATE block | Introduce app-level class state + boot-seed from LS. |
| `src/js/app.js` | inside `mountAppPill()` | Wire the right-side dropdown + class-row click handlers. |
| `src/js/app.js` | new global `setClassFilter(cls)` function | Centralizes the class-change pathway. |
| `src/js/views/forge.js` | 1027–1047 | DELETE `.forge-status` innerHTML chrome (the FORGE | Deities pill). The `<div class="forge-status">` element either stays empty or gets deleted entirely (D-08). |
| `src/js/views/forge.js` | 4746–4818 | DELETE `wireModeDropdown`. |
| `src/js/views/forge.js` | scattered (2158, 2226, etc.) | Delete `syncModeButtonLabel` calls. |
| `src/js/views/forge.js` | NEW `_forge.setClassFilter(cls)` | App-level callback hook, maps class to Forge mode and calls `rebuildForMode`. |
| `src/styles/app.css` | 6196–6330 | DELETE legacy `.forge-status-mode`, `.forge-mode-menu`, `.fm-*` block (replaced by `.app-pill-*`). |

### Phase 22-D — Preferences drawer

| File | Lines | Change |
|---|---|---|
| `src/js/app.js` | 653–757 (mountNavHub) | Repurpose — the IIFE now mounts the drawer instead of the nav-hub-menu, OR the nav-hub-menu is folded into the drawer's "Browse all views" panel. Significant rewrite (~100 LOC). |
| `src/js/app.js` | new `mountPrefsDrawer()` block | The drawer's section logic. |
| `src/js/app.js` | 10044–10080 (VIEWS.about) | Convert to a stub that opens the Atlas Statement modal. Keep `VIEWS.about` as a redirect for hash-router back-compat. |
| `src/js/app.js` | new `openAtlasStatementModal()` | Renders CODEX §I–V markdown via `marked.parse`. |
| `index.html` | line ~30 (after nav-hub-menu div) | Add `<aside class="prefs-drawer" id="prefs-drawer">…</aside>` with section skeleton. |
| `src/styles/app.css` | append | Drawer animation + section CSS (~150 LOC). |
| `src/styles/app.css` | 478–512 (`.nh-item` block) | Reuse for the drawer's "Browse all views" panel rows (no change required — same primitive). |

### Phase 22-E — Polish

| File | Lines | Change |
|---|---|---|
| `src/styles/app.css` | new media-query block | `@media (max-width: 960px)` collapse rules per §2.5. |
| `src/js/app.js` | `mountAppPill()` | Keyboard navigation handlers. |
| `src/js/app.js` | scattered | Focus restoration on close. |
| `index.html` | 11 + every `?v=` | Final cache-bust to `?v=20260524-22e-pill-polish`. |

### Uncertainty flags

- **CODEX.md content source for the Atlas Statement modal**: 22-D1 audit must determine whether to fetch CODEX.md at runtime (works on dev / file://, may fail on production without HTTP server — but the project requires HTTP server per `feedback_atlas_needs_http_server.md`), bake into data.js (build-script change), or inline the text in a JS constant. Cheapest = fetch. Safest = inline. Recommendation: fetch, with inline fallback if fetch fails.
- **Timeline placement in the pill**: `VIEWS.timeline` exists today as the legacy SVG timeline view; the new Forge-Timeline-mode (per timeline-mode audit) is a *Forge layout option*, not a separate VIEWS entry. The decision: ship Phase 22-B with `VIEWS.timeline` pointing at the legacy view (so it's reachable from the pill), then if/when the new timeline lands as a separate sibling view, repoint. If it lands as a Forge-internal layout, the pill's Timeline entry becomes redundant. Decision §10 D-14.
- **Forge bottom-bar legend tier toggles**: today the legend panel carries the tier-filter toggles. In a future world where the class pill carries them, those move out. NOT in scope for 22-A through 22-E — that's Phase 22+1.
- **STATE.pantheonMode**: legacy V1 Pantheon used this for its submodes (deities/authors/etc); V2 is locked to deities. In 22-C, if Pantheon is in the pill, `STATE.classFilter` writes drive Pantheon V2 (which today only honors `deities` — for other classes Pantheon would either render empty or auto-switch per §5.5 A). Audit pin in 22-B1.

---

## §9. Risks + acceptance gates

### 9.1 Lane B discipline

- **All Phase 22 work is Lane B (app code).** Pre-commit hook enforces no `0[0-9]_*` folder touches.
- **No content folder changes** in any phase. Pure UI refactor.
- **Pre-commit gate**: any commit during Phase 22 work that touches `src/js/app.js` must come from this Phase 22 series; sub-agents on content batches must not push competing app.js edits. Coordinate via `00_meta/ACTIVE-AGENTS.md`.
- **View modules MUST NOT individually grow new top-bar contributions** during Phase 22 work. If a sibling sub-agent decides to add a new picker to Scripture or Astrology during 22-B, the change conflicts. Slot-claim the app-shell coordination in HOW-WE-WORK.md.

### 9.2 Pre-commit hooks

- Existing pre-commit hook (per memory `feedback_content_agents_dont_touch_appcode.md`) catches accidental app.js corruption from content sub-agents. **Verified working**, no change needed.
- For Phase 22, add a temporary commit-message rule: each Phase 22 commit must include `Phase 22-X` in its title for auditability.

### 9.3 Cache-bust + smoke-test gates

- Every phase commit bumps the cache-bust string in `index.html` line 11 + every `<script src>` `?v=` parameter.
- After each phase commit, smoke-test the 6 promoted master views + 4 commonly-used legacy views.

### 9.4 Acceptance gates (cumulative)

After 22-A → 22-E ship in sequence:

- **AT-1** — The pill is the single coordinator for master-view + class.
- **AT-2** — Every promoted master view has a `master: { … }` block declaring its icon, label, classes, default.
- **AT-3** — `STATE.classFilter` is the app-level source of truth for class; LS round-trips.
- **AT-4** — Forge's old top-status pill (`.forge-status-mode`) is removed.
- **AT-5** — Forge's bottom bar still works (legend, view, search, scrubber, FX, style, debug).
- **AT-6** — Preferences drawer opens, closes, renders all 5 sections.
- **AT-7** — Atlas Statement modal renders CODEX §I–V.
- **AT-8** — Login UI is a stub but storable.
- **AT-9** — Browse all views in the drawer reaches every legacy view.
- **AT-10** — Visual style + font scale wired in the DISPLAY section.
- **AT-11** — 960px / 1280px / 1920px viewports all read cleanly.
- **AT-12** — No console errors on any view-switch / class-switch / drawer-open.
- **AT-13** — Locks preserved across class changes inside Forge.
- **AT-14** — Auto-class-switch on incompatible class+view combos with toast.
- **AT-15** — All 50+ VIEWS entries still mountable via the pill (master) or the drawer (legacy).

### 9.5 Risk register

| Risk | Severity | Phase exposed | Mitigation |
|---|---|---|---|
| **Visible duplication during 22-A → 22-C** (both old + new pill briefly coexist) | low | 22-A through 22-B | Intentional. The old pill ships intact in 22-A/B, removed only in 22-C, so each phase ships independently shippable. |
| **`STATE.classFilter` collision with `STATE.filter.type`** | medium | 22-C | Initial implementation writes to BOTH; later phase deprecates `STATE.filter.type`. Audit pin in 22-C1. |
| **Forge `rebuildForMode` cost on rapid class-switching** | low | 22-C | Existing `preserveLocks` path is the established fast lane. Profile in 22-E. |
| **Legacy views (Authors / Themes / Documents / etc.) breaking** because they read `STATE.filter.type` and the pill stops writing to it | medium | 22-C | Keep writing to `STATE.filter.type` AS WELL — pure additive — until those views are migrated or sunset. |
| **CODEX.md fetch fails on production HTTP server** | medium | 22-D | Inline fallback text in the modal JS (bytes are cheap; ~30 KB CODEX). Audit in 22-D1. |
| **Master-view dropdown row ordering churn** when sibling agents add `master:` blocks in different commits | low | 22-B+ | `master.order` numeric — agents pick a slot, no automatic re-sorting. |
| **The `✦` trigger's behavior changes** from "open view list" to "open drawer" — muscle memory regression | low | 22-D | Drawer's first row IS the Browse-all-views panel; muscle memory recovers in one click. |
| **Atlas / Map labeling mismatch** — code says `atlas`, John says `map`, pill says `MAP` — internal vs user vocab | low | 22-B | The `master.pillLabel` is `MAP`; the internal name stays `atlas`; URL stays `?view=atlas` (back-compat). Audit in 22-B1. |
| **Pantheon-V2 deities-only** vs class pill expectation | low | 22-C | `VIEWS.pantheon.master.classes = ['deities']` makes the pill gray out other classes. Auto-switch per §5.5 A on view-switch. |
| **Mobile collapse breaks the `\|` divider visual semantic** | low | 22-E | Unified-dropdown design per §2.5 avoids needing to render the `\|` at narrow widths. |
| **Scripture's custom corpus picker** competes with the class pill if Scripture is promoted (not in this phase) | low | (post-22) | Scripture is NOT promoted in 22-A through 22-E. Defer. |

---

## §10. Decision checklist for John

Greenlight / veto each. Phase 22-A does not start until **D-01 + D-02 + D-04 + D-06 + D-08** are answered (the hard fork-points). Others can be deferred to in-phase decisions.

1. **D-01 — Initial class roster.** Recommended: 12 headline classes per §5.1 (Deities / Persons / Themes / Events / Symbols / Traditions / Documents / Sacred-architecture / Places / Music / Rituals / All). Alternatives: (a) trimmed 6-class roster (Deities / Persons / Themes / Events / Traditions / All); (b) full 30-class roster matching modemod (rejected — phone-book problem).
   - Recommendation: **12 headline classes.**

2. **D-02 — Pantheon-V2 promotion to master-view pill.** Pantheon V2 currently locked to deities-only and partially overlaps with Forge's deities mode. Options: (a) promote with `classes: ['deities']` (sits alongside Forge as a sibling, gives the deities-only ring its own pill slot); (b) keep as legacy index view in the drawer; (c) sunset since V2 has been quiet.
   - Recommendation: **(b) drawer-only.** Forge already gives the deities ring; Pantheon V2 is redundant in the macro-nav. Sunset candidate for a later phase.

3. **D-03 — Login stub scope.** Options: (a) full stub with sign-in / sign-out / tier display + storage stub (Phase 22-D as specced); (b) minimum text-only placeholder ("Trusted-subscriber program coming soon."); (c) defer entirely to Phase 23+.
   - Recommendation: **(a) full stub.** The UI scaffolding is cheap; lets the auth backend phase land without front-end rework.

4. **D-04 — Preferences icon glyph.** Options: (a) keep `✦` (current Atlas brand glyph; familiar); (b) switch to `☰` (universal hamburger — clearer affordance).
   - Recommendation: **(a) `✦`.** Brand glyph, signature.

5. **D-05 — Per-view default class behavior on first mount.** Each promoted view declares `master.defaultClass`. After first mount, last-user-choice sticks per §5.4. Confirm.
   - Recommendation: **last-choice sticky.**

6. **D-06 — LS schema bump.** Stay at unbumped `forge-runtime-v1` + new `app-shell-v1`, with `app-shell-v1` defaulting to derive from existing keys on absence. Alternative: bump `forge-runtime-v1` to v2 to consolidate.
   - Recommendation: **separate keys; no bump.** Cleanest back-compat.

7. **D-07 — Lock preservation across class switches.** Option A drops locks on class change. Option B keeps them (locks survive but get filtered to the current class' data).
   - Recommendation: **B (keep locks).**

8. **D-08 — Phase 22-C: completely remove the Forge in-view top-status pill, OR leave it as a redundant secondary?** Recommended: remove (cleaner; the class pill is the canonical source). Alternative: leave hidden behind a flag for power users.
   - Recommendation: **remove.** Phase 22-C deletes lines 1027–1047 + 4746–4818 + the CSS block. Restoration is a 50-line revert if needed.

9. **D-09 — Timeline scrubber: app-level promotion?** Today scrubber lives in Forge's bottom bar. With Timeline arriving as a sibling master-view, the scrubber's role expands. Options: (a) keep scrubber Forge-internal in 22; (b) promote scrubber to app-level chrome (top-right? above the bottom bar?) in a future Phase 22+1.
   - Recommendation: **(a) Forge-internal for now.** Defer to 22+1 when Timeline ships.

10. **D-10 — Class declaration policy.** Per-view whitelist (`master.classes: ['deities', 'persons']`) vs. `'all'` shorthand vs. global allow-list with view-level rejection (gray-out). Recommended hybrid per §4.3.
    - Recommendation: **per-view whitelist with `'all'` shorthand.**

11. **D-11 — Responsive collapse below 960px.** Ship desktop in 22-A/B/C; add narrow collapse rule in 22-E. Alternative: ship narrow collapse in 22-A.
    - Recommendation: **defer to 22-E.**

12. **D-12 — Right-side global search affordance.** Not in scope for 22-A/B/C/D; defer entirely or include in 22-E?
    - Recommendation: **defer entirely.** Each view's local search is sufficient.

13. **D-13 — Auto-class-switch on incompatible class+view.** Option A (toast + auto-switch) vs. Option B (keep class, show empty state) vs. Option C (block view-switch with explanation).
    - Recommendation: **(A) toast + auto-switch.**

14. **D-14 — Where does Timeline live in the pill in Phase 22-B?** Options: (a) point Timeline pill row at the existing legacy SVG `VIEWS.timeline` (works now); (b) wait for the new Forge-Timeline-mode (per timeline audit) to land and point there; (c) include both as separate rows.
    - Recommendation: **(a) point at current legacy `VIEWS.timeline` for 22-B; repoint when the new timeline lands.** Decoupling.

15. **D-15 — Sunset `VIEWS.about` in 22-D.** Convert to a stub that opens the Atlas Statement modal. Yes/no.
    - Recommendation: **yes.** The original About content gets absorbed; the route stays for back-compat.

---

## §11. Out of scope (do NOT cover in Phase 22)

- **Lens content decisions** — the 5 lens audits (philosophy / consciousness / sacred-geometry / politics / political-theology) run separately on the Lane A track.
- **Timeline-mode implementation** — separate audit (`forge-timeline-mode-design-2026-05-23.md`) governs that build.
- **Auth backend** — only the UI stub is in scope. Real OAuth / session tokens / institution-tier verification is Phase 23+, tied to the the portable core sibling product per `feedback_vektor_sibling_handoff.md`.
- **CODEX content revisions** — Phase 22-D simply renders CODEX v1.3. Edits to CODEX itself require their own dated AUDIT/ doc.
- **Global search across views** — deferred.
- **Scrubber promotion** to app-level — deferred (D-09).
- **Scripture / Astrology promotion** to master-view pill — deferred (each has its own picker that doesn't reduce to "class").
- **Sunsetting legacy index views** (Authors / Themes / Documents / etc.) — they stay in the drawer's Browse-all-views panel. Sunset decisions are individual and out of scope.
- **Per-view top-bar contributions** (`master.topbarRight()`) — hook exists in the contract but no view declares it in Phase 22.

---

## §12. Estimated budget

| Phase | Sub-audit | Implementation | Verification |
|---|---|---|---|
| 22-A | 1 goblin ~10 min (z-index conflicts, position-fixed math) | 3–4 h | 30 min |
| 22-B | 1 goblin ~10 min (view contract per view) | 3–4 h | 1 h |
| 22-C | 1 goblin ~20 min (state-write callers, legacy filter paths) | 4–6 h | 1.5 h |
| 22-D | 1 goblin ~15 min (drawer-content sources, CODEX.md plumbing) | 3–5 h | 1 h |
| 22-E | 1 goblin ~20 min (cross-view stress) | 2–3 h | 1.5 h |

**Total focused Lane B for 22-A → 22-E:** ~18–26 hours.

Each phase commits atomically. If acceptance fails, iterate within the phase — do NOT cascade unfinished work into the next.

---

## §13. What this refactor unlocks

When Phase 22-E ships clean:

1. **Timeline ships as a sibling master view in one move**, not as a Forge sub-mode. Aligned with John's "Timeline is its own world" reframing of the timeline-mode audit.
2. **Map / Star Map / future sibling views** plug in by declaring a `master: { … }` block and a `setClassFilter` — no app shell changes.
3. **The class vocabulary is settled** at the app level. Future agents adding new node types know exactly where the class shows up (the §5.1 roster expands; views opt-in via `master.classes`).
4. **The legacy chrome (in-Forge top-status pill, the `forge-status-mode` primitive)** is gone. One pill primitive across the app — `.app-pill-menu`. Reduces the design-system surface.
5. **The Atlas Statement** finally has a prominent slot. Today's `VIEWS.about` is buried under a hidden `<details class="nav-more">` and the user finds it by accident. The drawer's ATLAS section makes the project's epistemic stance LEGIBLE at first run.
6. **The login stub** sets up the Phase 23+ trusted-subscriber program without front-end thrash.

The pill is the macro-control. The drawer is the master settings. The view bottom bars stay view-specific. Everything else — the canvas — is the work.

---

*Top-bar pill refactor design, 2026-05-23.*
