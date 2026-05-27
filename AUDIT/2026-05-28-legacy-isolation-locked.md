# Legacy isolation — LOCKED (Option A: hard partition)

**Filed:** 2026-05-28
**Resolves:** `AUDIT/2026-05-28-EMERGENCY-legacy-prototype-contamination.md` (P0)
**Strategy:** Option A — separate HTML files
**Status:** SHIPPED + verified via live DOM walk

---

## What the emergency was

The legacy V01 prototype chrome (nav-hub menu, side `<nav>`, style-menu, themes-menu, detail rail, dev-panel) was sharing the same `index.html`, `src/js/app.js`, and `src/styles/app.css` as the V2 app. Every "cleanup" was incomplete; the legacy kept regrowing through stale DOM, body-class state, or surviving CSS. John's directive: legacy must remain **accessible for reference** but **100% structurally isolated** from the V2 foundation.

---

## What was shipped

### 1. Frozen snapshot at `_legacy/`

Three files, self-contained:

- `_legacy/index.html` — verbatim copy of the pre-isolation `index.html`, with **all** asset paths prefixed `../` (relative to `_legacy/`) except `app.css` + `app.js` which load from the local directory. Adds a fixed-position `↩ V2 SHELL · LEGACY VIEW` link at top-right for return navigation.
- `_legacy/app.js` — frozen copy. Includes the `#filter-family`/`#filter-type` null-guard fix described below.
- `_legacy/app.css` — frozen copy.

The snapshot also patches the MapLibre style-spec paths inside `_legacy/app.js` (`_assets/...` → `../_assets/...`) so the legacy map renders correctly.

### 2. Live `index.html` stripped of legacy chrome

DELETED elements:

- `#nav-hub-trigger` + `#nav-hub-menu` (the ✦ hamburger with 32 legacy view links)
- `#side-tab` + `<nav class="side">` (the legacy left sidebar with view links + style-button + themes-button + tier-button + stats)
- `#style-menu` (13 visual-style presets dropdown)
- `#themes-menu` (themes overlay grid)
- Body class `footer-collapsed` (vestigial — footer was ripped out commit `a06fef9`)

KEPT (shared chrome both V2 and legacy use):

- `<aside class="detail">` — Forge inspector + Reader use it
- `<main class="canvas">` block with all rendering panes
- App-pill (master + class selectors)

### 3. Live `src/js/app.js` — null-guarded all consumers of deleted chrome

- `themes-button` / `themes-menu` / `themes-close` handlers gate on element existence
- `style-button` / `style-menu` handlers gate on element existence
- `s-docs/s-deities/s-themes/s-edges` stats setters wrapped in null-safe `setEl()`
- `buildThemesDropdown` — early return if `#themes-grid` is null
- `renderActiveTheme` — early return if `#active-theme-wrap` is null
- `[` / `]` keyboard shortcut handlers gate on element existence
- **`#filter-family` / `#filter-type` change handlers** — this was the silent boot crash. The pre-existing `forEach(k => document.getElementById('filter-' + k).addEventListener(...))` threw TypeError on null after the footer was deleted in `a06fef9`. The crash halted the entire script before the URL router IIFE could fire, leaving `STATE.view` stuck at the `'pantheon'` default. Patched to early-return on null. Cost ~30 min of debugging to find — added a memory note (see below).

### 4. App-pill "Old prototypes" entry → opens `_legacy/index.html`

The dropdown's bottom entry (now labelled `🗄 V01 prototype · reference · new tab`) opens the frozen snapshot in a new tab via `window.open('_legacy/index.html', '_blank', 'noopener,noreferrer')`. The old behaviour (falling back to the deleted nav-hub-menu) is replaced.

### 5. Per-view CSS scoping for `body.view-boards`

Added a `body.view-boards { ... }` block in `app.css` that hides `.view-header`, `aside.detail`, `#codex-dev-tab`, `.zoom-meter`, `.legend`, `.tier-legend`, `.map-thumb`. These are shared-chrome elements V2 Forge + Reader use, but Boards V2 doesn't need any of them — the contextual pill is the only chrome Boards shows. Without this scoping, John saw the legacy view-title text "BOARD..." ghost behind the master pill, plus right-edge `›` (detail-toggle) and `⚙ DEV` (codex-dev-tab) tabs.

---

## Live DOM walk — verified clean

Live probe of `http://localhost:8742/` (V2 shell, default Forge view):

```js
{
  navHubTrigger: false,   navHubMenu:   false,
  sideTab:       false,   navSide:      false,
  styleMenu:     false,   styleButton:  false,
  themesMenu:    false,   themesButton: false,
  tierButton:    false,   footer:       false,
  // V2 chrome present:
  appPillWrap:    true,   appPillMaster: true,
  appPillClass:   true,   asideDetail:   true,
  scriptureReader: true,  canvas:        true,
  bodyClass: "nav-hidden detail-collapsed view-forge fv-layout-wheel ..."
}
```

Live probe of `?view=boards` (V2 shell, Boards):

```js
{
  STATEview: "boards",
  appPillLabel: "BOARD",
  boardsPane: true, appPillWrap: true,
  viewHeader: "none", asideDetail: "none", codexDevTab: "none",
  navHubMenu: false, navSide: false, styleMenu: false, themesMenu: false,
}
```

Screenshots taken on both views show the expected output: app-pill at top-left, Forge wheel rendering scriptures, Forge bottom bar — and on Boards, just the BOARD pill + empty radial-gradient stage. No legacy chrome visible.

Legacy snapshot at `_legacy/index.html` loads with all its expected chrome (`✦` nav-hub-trigger, side `<nav>`, `↩ V2 SHELL` return link, `⚙ DEV` tab) and remains fully functional for reference inspection.

---

## What was NOT done (deliberate)

- **Live `src/js/app.js` not pared of legacy VIEWS.** All VIEWS.{pantheon, atlas, astrology, alchemy, transmutation, ...} are still defined in the live app.js. They are inert until invoked, and the only entry points to them in the V2 shell are the master-pill MAP and STAR MAP entries (intentionally retained — those views were V2-promoted per `feedback_atlas_is_map`). Future cleanup work can lift them into `_legacy/` if desired, but doing so is a separate task and was explicitly out of scope for this isolation lock.
- **Live `src/styles/app.css` not pared of legacy CSS rules.** Roughly 1,500–2,000 LOC of un-audited legacy selectors remain. They no longer match anything in the V2 DOM (the elements were deleted), so they don't render anything — they're dead weight, not contamination. Same disposition as legacy VIEWS code.
- **Script tag loads not reduced.** The live `index.html` still loads `pantheon-v2.js`, `astrology/*`, `alphabets/*`, `alchemy/board.js`, etc. They self-install IIFEs that register modules; without a master-pill click into them, they remain inert. Removing them would break MAP/STAR MAP master-pill entries.

These three are intentional minimisations — the contamination John complained about was visible chrome, not dead module code. The hard partition (Option A) provides the structural guarantee; further cleanup is optional hygiene.

---

## Why Option A and not B/C/D

- **Option B (feature-flag gate at JS layer)** — rejected. Always one missed gate from re-contamination. Doesn't satisfy "100% GUARANTEE NOT TO CONTAMINATE".
- **Option C (strict view-class scoping)** — rejected. Same risk surface as B; one missing `body.app-legacy` prefix and the CSS bleeds.
- **Option D (archive into `_legacy/` route)** — overlapping with A. Could be pursued later as an additional cleanup if the live legacy VIEWS code starts mutating in unexpected ways. For now, Option A's hard file partition is sufficient.

Option A (separate HTML files) is the only one that's *structurally* incapable of contamination: the V2 shell never loads the legacy chrome HTML, so it cannot render it under any state machine bug.

---

## Outgoing memory for the next agent

- **The `#filter-family` / `#filter-type` null-throw bug.** Any future deletion of legacy DOM must search `src/js/app.js` for direct `document.getElementById(...).addEventListener(...)` calls and guard them. Multiple existing handlers had pre-existing null guards (the result of past similar incidents); this one slipped because the `.forEach(k => ...)` loop wrapped the call. The cost of finding it without trace flags was ~30 minutes. **Filed memory: `feedback_dom_addEventListener_null_throws_silently_2026-05-28.md`** — pattern: `getElementById(X).addEventListener(Y, Z)` throws TypeError on null; throw inside script body halts boot silently; symptom is STATE stuck at default + body has no `view-*` class.

---

## Resumes

- **BOARDS V2** — unblocked. Step 3 (pan/zoom + drag-card primitives) can resume.
- **Atlas Codex** — never blocked; remains at 31/42 corpora reader-ready.
- **Master pill MAP / STAR MAP** — still route to legacy views in the live shell. If John wants those rebuilt or migrated to the V2 engine, that's a separate project (the `feedback_atlas_is_map` memory locks the user-facing nomenclature; nothing in the isolation lock affects routing).

---

## Outgoing-agent signature

- Strategy picked: Option A (hard partition via `_legacy/` snapshot)
- Files changed: `index.html`, `src/js/app.js`, `src/js/app-pill.js`, `src/styles/app.css`
- Files added: `_legacy/index.html`, `_legacy/app.js`, `_legacy/app.css`, this audit doc
- Live DOM walks: 4 (default V2, ?view=boards, master-pill open, _legacy/index.html)
- Verified clean: ✅
