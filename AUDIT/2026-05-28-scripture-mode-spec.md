# Scripture Mode — Spec

**Filed:** 2026-05-28
**Status:** PROPOSED · Lane B (single-slot — wait for density-slider agent to release)
**Frame:** "the new scripture mode uses 100% the Forge wheel system; books open in a separate window"
**Reference (legacy, do-not-touch — REBUILD-FROM target):**
  - `src/js/views/scripture-reader.js` (725 LOC) — full-pane annotated reader, ✦ parallels, ⇌ transmissions
  - `src/data/scripture-texts.js` (1.7 MB · 125 texts · 119 crossTradition links · 16 religions)
  - `VIEWS.scripture` in `src/js/app.js:4157` — legacy D3-SVG corpus ring + reader-mode swap

---

## 1 · One-paragraph statement

The scripture mode is **two surfaces sharing one data spine**:

- **THE MAP** — a Forge wheel of scripture nodes (every `n.type === 'document'` plus everything in `SCRIPTURE_TEXTS`). The wheel renders, culls, instances, label-canvases, and time-positions exactly like Deities / Authors / Symbols — because it IS another `_forge.setClassFilter` mode (`scriptures`). Click a node = lock + side-panel preview. Click "Open in reader" on the side panel = the reader page opens over the wheel.
- **THE READER PAGE** — a Forge **overlay pane** (not a top-level view swap) that shows a single book full-bleed: title bar, religion/text/translation pickers, sectioned verses with clickable entities, parallels drawer, transmissions index. ESC / "← Wheel" closes the overlay; the wheel state (camera, lock, focus year, mode) is preserved.

**Both surfaces are carved Forge modules.** No DOM lives in `app.js`. No `STATE.scriptureReaderMode` boolean flips views at the app level. The forge view stays mounted; the reader is just another window the forge can open, the way `_forgeSidePanel` is just another window the forge owns.

---

## 2 · Why this exact shape

| Choice | Why |
|---|---|
| Wheel = `_forge.setClassFilter('scriptures')` | Reuses GPU instancing, viewport-cull, hit-test, focus-ring, timeline-layout swap, search autocomplete, zoom-floor, hover-trails. Zero new render code. |
| New mode entry `scriptures` in `engine/graph/mode.js` | Single source of truth for "what's in this mode" — sits next to `documents`/`deities`/`authors`. URL router (`?mode=scriptures`) works for free. |
| Reader is a Forge overlay pane (not a setView swap) | Legacy pattern (`setView('scripture')` + `STATE.scriptureReaderMode`) cross-cuts app.js. New pattern: the reader is a Forge sub-surface, opened/closed via `_forge.openReader(textKey)` / `_forge.closeReader()`. Wheel survives underneath. |
| Reader DOM lives in `src/js/forge/scripture-reader.js` (new carved module) | Single attach point. Same boundary contract as the other 10 carved modules. AST-validated dep injection. |
| Data stays in `src/data/scripture-texts.js` (1.7 MB) | Already loaded, already populated, already cross-tradition–wired. Migration would be 11k lines of risk for zero benefit. |
| Verse-entity clicks resolve to vault nodes | The `entity.node` already points to existing vault IDs (`elohim`, `cosmic-ocean`, etc.). Reader fires `STATE.selected = ent.node` and `_forge.closeReader()` → wheel re-locks on the entity. Tight feedback loop the legacy reader couldn't do (it was outside the wheel). |

---

## 3 · Wheel as a Forge mode

### 3.1 New mode entry

`src/js/engine/graph/mode.js` — add ONE row to `MODES`:

```javascript
{ value: 'scriptures', label: 'Scriptures', glyph: '✠', nodeType: 'document', filter: 'isScripture' },
```

The `filter` field is new — it tells `filterNodesByMode` to apply a sub-predicate when `nodeType` is too broad. `documents` mode shows ALL document-type nodes (charters, treatises, codices, etc.). `scriptures` mode is a subset: only documents that are religious texts.

### 3.2 The `isScripture` predicate

**Data-shape note (2026-05-28 correction):** Initial spec assumed I could derive SCRIPTURE_IDS from the 168 `CATALOG` text-keys in `scripture-reader.js`. Investigation found:

- `CATALOG` keys are text-keys (`genesis-1`, `enuma-elish-1`), not vault node IDs.
- `SCRIPTURE_TEXTS[k].docNode` pointers (the link to a vault doc-node) are **mostly empty** (only 10 of 125 entries set it) and some are stale (`phase-2-006-genesis` doesn't exist in the vault — Genesis isn't currently a doc-node at all).
- The vault has **510 `type: "document"` nodes**, of which many ARE real scriptures (`bhagavata-purana`, `avesta`, `diamond-sutra-868`, `corpus-hermeticum`, `codex-sinaiticus`, `mahabharata`, `ramayana`, `kojiki`, ~80–120 total) and many are NOT (`cassius-dio-roman-history-69`, `plutarch-life-of-pericles`, `codex-mendoza`, `da-ming-huidian`).

**Revised approach:** SCRIPTURE_IDS is a **hand-curated Set of vault node IDs**, lifted from a one-time enumeration of the 510 document-type nodes and committed to `engine/graph/mode.js` alongside the mode entry. The enumeration is produced as the FIRST commit of Step 1 (`AUDIT/2026-05-28-scripture-ids-enumeration.md`) so John can review the inclusion/exclusion before the mode goes live.

`filterNodesByMode('scriptures', nodes, edges)` returns `nodes.filter(n => n.type === 'document' && SCRIPTURE_IDS.has(n.id))`.

**Reader availability is a sub-filter:** clicking a wheel node only shows the "Open reader" button if there's a `SCRIPTURE_TEXTS` entry whose `docNode` matches `n.id`. V1 means ~10 nodes have reader content; the rest show vault metadata in the side panel. Reader-content coverage expands in subsequent Lane A batches by populating `docNode:` fields.

### 3.3 Edges for the wheel

Scripture edges already exist in the vault (`influenced`, `parallels`, `cited-by`, `translated-from`, `derives-from`). The wheel renders them like every other mode. **No new edge type needed for V1.**

The legacy reader's per-verse `crossTradition[]` and `entities[].parallels[]` ARE NOT wired as graph edges right now. They live only inside the scripture-texts.js data file. A follow-up Lane A pass should mirror them to canonical vault edges (one edge per `crossTradition` link, source = parent docNode, target = `crossTradition[i].textId`'s docNode, type = `parallel`). **NOT IN SCOPE for this spec** — flagged for separate batch.

### 3.4 Layout

Wheel layout (`_forge.setLayout('wheel')`) — angular = religion sector (already supported via radial wedge grouping; vault `tradition-*` ID is the cluster key); radial = none / by date is fine.
Timeline layout (`_forge.setLayout('timeline')`) — x = date_earliest. Books date back to ~1500 BCE (Rig Veda) through 1830 CE (Book of Mormon); the existing log scale handles that span.

Religion sectors are already a natural fall-out of the radial-wedge layout once nodes carry `tradition` membership. Genesis 1 carries `tradId: 'tradition-second-temple-judaism'`; the wedge layout clusters by trad. **No layout changes needed.**

### 3.5 Class-pill label

In `src/js/forge/view-settings.js` (the class-pill at the top-left of the wheel), the new mode appears with `✠ Scriptures` between `❡ Documents` and `✦ Symbols`. Selecting it triggers `_forge.setClassFilter('scriptures')` → rebuildForMode → wheel of scripture nodes.

---

## 4 · Reader as a Forge overlay

### 4.1 New carved module

`src/js/forge/scripture-reader.js` — boundary contract:

```javascript
window._forgeScriptureReader = {
  attach({
    local,                  // forge.js mount state
    toggleLock,             // forge.js — to re-lock the entity in the wheel
    triggerClickPulse,      // forge.js — visual confirm on entity-click
    closeReader,            // forge.js scope — installed by install-public-api
  }) { /* sets up DOM + handlers + window._forge.openReader/closeReader */ }
};
```

`window._forge.openReader(textKey)` and `window._forge.closeReader()` are installed by `_forgeInstallPublicApi` (we add them there to keep the public-API surface in one place).

### 4.2 Overlay DOM

Lives inside the existing `.forge-pane`, NOT the canvas. New child `<div class="forge-reader-pane" id="forge-reader-pane">`:

```
.forge-pane
├── canvas#forge-canvas              (the wheel — z 1)
├── #forge-stage                     (canvas-overlay HTML — z 2)
├── #forge-side-panel                (existing right-side slide-in — z 3)
├── #forge-hover-card                (existing — z 3)
└── #forge-reader-pane               (NEW — z 4, hidden by default)
```

The reader pane is a full-bleed cover. When open:
- canvas is **not** hidden (kept under it for the close transition — a 200 ms slide+fade reveals it again).
- `local.readerOpen = true` — frame loop skips `idle camera` work, hit-tester ignores canvas events, hover-card hides.
- `STATE.scriptureReaderMode = textKey` for URL persistence (`?reader=<textKey>` writes via existing URL-router).

### 4.3 Reader chrome

Top bar (mirrors legacy `sr-topbar` but in Forge style — use `.forge-pill` and `.forge-btn-mini`, NOT new CSS classes):
```
[← Wheel]  <title>  <canon-badge>     [Religion ▾] [Text ▾] [lang ▾] [✦ parallels] [⇌ transmissions]
```

Body: `.forge-reader-body` with vertical `.forge-reader-sections` of `.forge-reader-verse` rows. CSS lifted from `app.css#sr-*` rules — RENAMED to `.forge-reader-*` so the legacy reader and new reader can coexist during transition without selector collisions.

### 4.4 Entity clicks

Entity click = `<mark class="forge-reader-ent">` → handler:
```javascript
function onEntityClick(ent) {
  if (!ent.node) return;
  // 1) lock the entity in the wheel underneath
  if (window.NODES_BY_ID && window.NODES_BY_ID[ent.node]) {
    toggleLock(ent.node);
    triggerClickPulse(ent.node);
  }
  // 2) keep reader open — show entity card in a slim side rail
  showEntityCard(ent);
}
```

The legacy reader pushed entity cards into `#detail-inner` (the app-level right rail). New reader has its OWN slim card rail (`.forge-reader-entity-rail`) so the wheel's side-panel is reserved for wheel interactions.

"Open in vault" button on the entity card calls `closeReader()` → focuses the entity in the wheel.

### 4.5 Cross-text linking

A `crossTradition[].textId` link or a `parallels[].textId` link is just `_forge.openReader(targetKey)` — the same overlay re-renders. No teardown / re-mount churn.

---

## 5 · Carve plan (commit-by-commit)

Each step is independently committable and pixel-equivalent to the prior step until the cutover (step 7). Use `scripts/smoke-test-forge.js` after every step.

| Step | What | LOC delta | Risk |
|---|---|---|---|
| **1** ✓ | Add `scriptures` mode to `engine/graph/mode.js` + `SCRIPTURE_IDS` set + `isScripture` predicate. No UI change yet. **SHIPPED 2026-05-28 commit `b1e0557`.** | +134 | Low |
| **2** ✓ | ~~Add `Scriptures` row to view-settings.js class-pill.~~ **NOT NEEDED** — `src/js/app-pill.js:129 buildClassMenu()` auto-iterates `_forge.supportedClasses()` which is `AtlasEngineMode.MODES`. The new ✶ Scriptures row appears in the class-pill dropdown automatically. Selection routes through `_forge.setClassFilter('scriptures')` → wheel rebuilds with 109 nodes. **Verified via DevTools console.** | 0 | None |
| **3** | Build `src/js/forge/scripture-reader.js` skeleton — attach + empty overlay DOM. Installed but never opened. Public API `_forge.openReader/closeReader` added (no-op until step 4). | +200 | Low |
| **4** | Port legacy `_buildSections` + `_annotate` + `_verseText` + `_buildCtx` from `scripture-reader.js` into the carved module. Reader can RENDER but doesn't open from anywhere yet. Manually testable via `window._forge.openReader('genesis-1')`. | +400 | Med — line-for-line port |
| **5** | Wire side-panel "Open reader" button — clicking a locked scripture node in the wheel exposes a button that calls `_forge.openReader(node.id)`. First end-to-end flow lights up. | +30 | Low |
| **6** | Port transmissions index. | +180 | Low |
| **7** | Cut `VIEWS.scripture` over: replace the D3 ring with a redirect to `_forge.setClassFilter('scriptures'); setView('forge')`. Reader-mode hash compatibility: `?view=scripture&reader=<key>` translates to `?view=forge&mode=scriptures&reader=<key>`. Legacy code path retained as `VIEWS._legacyScripture` (rollback parity with `_legacyPantheon`). | -300 net | Med — URL compat |
| **8** | Delete `src/js/views/scripture-reader.js` from index.html script tags. Keep file on disk for 1 release as reference. | -1 line | Low |

**Reversibility:** every step is `git revert`-clean. Step 7 is the only one with a URL-router touch; the redirect lives in one `if (legacyHash) replaceState()` block.

---

## 6 · What stays in legacy `scripture-texts.js`

EVERYTHING. The 1.7 MB data file is the canonical scripture corpus and survives unchanged. The reader module reads `window.SCRIPTURE_TEXTS` exactly as the legacy reader did. Same key conventions. Same field names. Same translation IDs. Zero data migration.

The only related Lane-A work (separate batch, after this ships):
- Mirror the 119 `crossTradition[]` links to canonical vault edges so the wheel can render them.
- Walk every text's `entities[].node` and add a `referenced-by-scripture` edge from the entity → docNode. Currently those connections only exist inside the verse-level JSON; the wheel can't see them as graph edges.

---

## 7 · Open questions

| Q | Recommendation | Notes |
|---|---|---|
| Religion picker — duplicate the legacy CATALOG, or derive from `node.tradition`? | **Derive from `node.tradition`.** CATALOG is hand-curated and drifts; vault tradition tags are canonical. Falls out for free if `node.tradition` is populated for every scripture. (Quick Lane A audit: confirm every `SCRIPTURE_IDS` member has a `tradition` field.) | Low risk |
| Should the reader live on its own URL? | **Yes.** `?view=forge&reader=<textKey>` (no `&mode=` needed — reader implies scriptures mode). Cold-boot to that URL = forge mounts + reader auto-opens. | Reuses existing URL router |
| Verse-entity card — slim rail inside reader, or use the existing detail-pane? | **Slim rail inside reader.** Detail pane is the wheel's surface; reader should own its own UI to avoid the "pane is open but the wheel under it isn't responsive" confusion the legacy reader had. | New CSS — ~80 LOC |
| Parallels drawer placement — top drop-down (legacy), or left side rail? | **Top drop-down.** Matches legacy muscle-memory + no new layout container. | Stay legacy here |
| Should clicking a wheel-edge between two scriptures open SOMETHING in the reader? | **Not in V1.** Edge-click already opens the connections drawer in the side panel; adding "open both books side-by-side" is a Phase 2 idea worth its own spec. | Defer |

---

## 8 · Risk / non-goals

**Risks:**
- Verse-text rendering is ~3 KB of HTML per text on average × 100+ texts. Eager-rendering all 100+ on overlay-open would jank. **Mitigation:** render ONLY the currently-active text. Switching texts re-renders (same as legacy).
- `SCRIPTURE_TEXTS` is 1.7 MB. Already a parsed JS object on page load. Not new cost — same as today.
- Wheel layout with 100+ scripture nodes is well within the GPU budget (Forge wheel runs fine with 1000+ node modes today).

**Explicit non-goals for V1:**
- Side-by-side text comparison (Phase 2)
- Verse-level wheel zoom (Phase 2)
- Cross-tradition edge rendering of the verse-level parallels (Lane A backfill, separate)
- Mobile-first reader layout (Phase 3 — desktop only for V1, like the rest of Forge)
- Search inside scripture text (separate spec; reuses Forge search infrastructure)

---

## 9 · Owner / sequencing

- **Carved module work** is Lane B → single-slot. Density-slider agent currently holds the slot; this spec ships AFTER that agent releases.
- **Step 1 (mode entry)** is the only step that touches a master engine file (`engine/graph/mode.js`). All other steps add new files or edit `view-settings.js` / `install-public-api.js` / `index.html` script tags.
- **No content folder touches** at all (pure Lane B). Lane A backfill of verse-level cross-tradition edges is a separate, later batch.

**Estimated effort:** 8 commits, ~870 LOC added / ~300 LOC deleted net, ~1 working session if uninterrupted. Each step smoke-tested before the next.

---

*Spec ends. Awaiting greenlight + density-slider slot release before Step 1.*
