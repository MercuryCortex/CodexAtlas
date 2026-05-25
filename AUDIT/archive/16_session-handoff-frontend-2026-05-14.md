# Session Handoff — Frontend (2026-05-14)

End-of-session handoff. Last agent worked the frontend (`src/js/app.js`, `src/styles/app.css`, `index.html`) and ran one data-creation batch (`opus-monuments-1`). All vault-content batches were owned by other agents per `00_meta/ACTIVE-AGENTS.md`.

---

## 🚨 OPEN — pick up first

### 1. Pantheon must start with the detail panel CLOSED on initial load

User: *"the pantheon must start with the side panel closed"*. Confirmed not working at session close — panel appears open on first load. Investigate:

- Initial body class at app boot has no view-class set yet
- `setView('pantheon')` at the bottom of `app.js` runs once at init. My current guard `if (showMap && _isViewChange) { document.body.classList.add('detail-collapsed'); ... }` uses `_isViewChange = STATE.view !== name`. At first call, `STATE.view` is whatever was set in `STATE`'s initial object literal — check if it's `'pantheon'` already (which would make `_isViewChange` false on the first call and skip the auto-collapse).

Look at `STATE` init (somewhere near the top of `app.js`). If `STATE.view = 'pantheon'` is the default, the first `setView('pantheon')` is a no-op for the auto-collapse logic.

**Likely fix:** initialize `STATE.view = null` (or `undefined`), so the first `setView()` call is always a real view-change. Or special-case the initial load.

### 2. Detail panel must become an OVERLAY, not a grid column

User: *"NOTE THE SIDE PANEL IS A OVER PANEL"*

Currently in `app.css`:

```css
body {
  grid-template-columns: var(--nav-w) 1fr var(--detail-w);
}
```

The detail panel occupies a grid column. Opening/closing it RESIZES the canvas (grid columns recompute), which is structurally wrong AND was the root cause of the Timeline node-click bug (ResizeObserver fires when panel opens → re-triggers `setView` → panel snaps closed). I patched the symptom with a view-change guard; the right fix is to remove the bug source entirely.

**The architectural change:**

- `body` grid → `grid-template-columns: var(--nav-w) 1fr` (drop the detail column entirely)
- `aside.detail` → `position: fixed; top: 0; right: 0; bottom: 0; width: var(--detail-w); z-index: <high>` — same level as `nav.side`, both fixed overlays
- `body.detail-collapsed aside.detail` → use `transform: translateX(100%)` to slide off-screen right (like `body.footer-collapsed footer` already does)
- All canvas-internal absolute-positioned elements (`.view-header`, `.zoom-meter`, `.legend`, `.map-thumb`, `.tooltip`, `.tl-zoom-presets`) currently have right offsets accounting for the detail column — those `right:` values need re-checking. With detail as overlay, they'll get covered when panel opens, which is fine (panel-on-top is the overlay model).
- The footer (already fixed) currently has `right: var(--detail-w)` and `body.detail-collapsed footer { right: var(--detail-w-collapsed); }` — under the overlay model, footer should extend the full width OR explicitly avoid being covered by the panel. Simplest: keep footer at `right: 0` and let the panel sit over the bottom-right corner. Or set footer's right to `0` always.

**The bonus payoff:** with detail as overlay, opening it doesn't resize the SVG, so the ResizeObserver doesn't fire spuriously, so I can REMOVE the view-change guard hack from `setView`. Cleaner code.

---

## ⚠️ Known issues from this session (worth fixing, not critical)

### 3. 17 nodes have `tags` serialized as a STRING in `data.js`, not an array

`build_data.py` is truncating multi-line YAML tag arrays into a single string for ~17 nodes (`P3-019-4-maccabees`, `P3-015-pauline-epistles`, `akiva-ben-yosef`, and 14 others). Frontend handles this defensively via `tagsOf(n)` helper in `app.js` (~line 200) but the root-cause fix is in the YAML parser. Probably the agents are using inline multi-line YAML arrays that the parser doesn't handle correctly. Look at the affected files for the pattern.

### 4. Vault-wide slug-drift is patched at runtime, not at build

Many wikilinks across the vault write `[[tradition-christianity-canonical]]` but the actual node id is `christianity-canonical` (no `tradition-` prefix). Same for `[phase-X-NNN-slug]` vs canonical `[PX-NNN-slug]`. I patched this at app init via `_resolveNodeId()` in `app.js` (~line 50) which canonicalizes edge source/target on the way in. ~4,800 previously-dead edges now resolve.

The right fix is in `build_data.py`'s `wikilinks()` resolution — recognize both forms and emit canonical IDs in `data.js`. That'd fix:

- Dead-link ratio reported by `build_dashboard.py`
- Tooling that scans `data.js` directly
- Edge ID consistency across all consumers

### 5. Cache-busting on `app.js` is manual

`index.html` has `<script src="src/js/app.js?v=20260514-monuments-5">` — I bump the version every time I edit `app.js`. The dev server should add it automatically (e.g., via filemtime or random nonce) or use a build step. Until then, every JS edit needs the version bump or the browser serves stale code.

---

## ✅ Landed this session

Listing for situational awareness — DO NOT REVERT these.

### Pantheon
- `Monuments` mode added to the dropdown (was a placeholder; now functional)
- `Events` mode added to the dropdown (functional)
- Mode selector converted from 3-button toggle to a `<select>` dropdown supporting 6 modes (deities / authors / symbols / events / scripture-shortcut / monuments)
- **Render-time family derivation** for events and monuments: walks each event's edges, tallies the families of adjacent nodes via vote, assigns the majority family. Tradition-node fallback uses a JS port of `build_data.py`'s `tradition_family()` regex (mirrors the same logic) — see `app.js` ~line 700 (`familyFromTraditionSlug`).
- Slug-drift alias resolver at the EDGES init pipeline (`app.js` ~line 50) — also benefits every other view, not just Pantheon

### Timeline
- Default subtitle removed (was "drag to pan…")
- Zoom-preset toolbar at the bottom: `10y · 50y · 100y · 200y · 500y · 1000y · 2000y · all` + a "go to" year-input field. Each preset centers the current viewport mid-year and zooms to the specified window. Year input accepts negatives (BCE) and positives (CE).
- Smooth-zoom rAF animation on wheel + zoom-meter buttons + preset buttons (200–380ms ease-out-cubic)
- Class-based opacity fades for tier-gated labels (was hard `display: none` flip)
- Chart-area background tint (`.tl-chart-bg { fill: rgba(80, 90, 115, 0.10) }`) — fixed the "void-black left side" issue
- Compression-gap rect now `fill: transparent` (zigzag remains the cut marker)
- Per-type shapes on the main pass: documents=square, persons=equilateral diamond, events=star, monument-tagged events=temple silhouette. Mini overview keeps tiny circles.
- `ev.stopPropagation()` on event-click handler (matches Pantheon)

### Scripture, Documents, Alchemy
- Untouched in this session

### Maps in general
- All map views (`pantheon, timeline, documents, scripture, alchemy`) auto-collapse the detail panel on view ENTRY (not on re-render — see open item #1, fixes to come)
- Empty-canvas click closes the panel (single global handler on `#svg`)
- Click any node → panel opens with details

### Shapes (`shapeFor()` in `app.js`)
- `deity` → `symbolCircle`
- `person` → `symbolDiamondEqual` (custom — equilateral rotated square, all 4 points equidistant. NOT `d3.symbolDiamond` (tall lozenge) and NOT `d3.symbolSquare2`. Matches Scripture's render exactly.)
- `event` → `symbolStar`, EXCEPT events with `tags: [monument]` → `symbolMonument` (custom — triangle pediment + rectangular base, reads as a temple)
- `document` → `symbolSquare`
- `theme` → `symbolTriangle`
- `tradition` → `symbolWye`
- `symbol` → varies by category (see `app.js`)

### Edge styling
- Default state: quiet slate-blue (`rgba(96, 116, 158, 0.55)`) for ALL edge types
- Type color stashed in `--edge-type-color` CSS custom property; only shows when `.edge-line.hot` or `.edge-line.filter-dim.hover-reveal`
- Cross-symbol "ancestor-of" and friends NO LONGER force a thick stroke — color alone differentiates, width stays subtle
- Same pattern applied to `.alch-link`
- User explicitly: "I HATE BIG THICK LINES, except when highlighted"

### Sidebar
- Collapsed nav = 48px icon strip (was: slid fully off-screen). Glyphs stay visible.
- Body grid changed: `var(--nav-w) 1fr var(--detail-w)` (was `0 1fr var(--detail-w)`). Canvas no longer draws under the nav strip.

### Footer
- Toggle button moved to body-level (was inside `<footer>`, got trapped by the parent's transform). Always reachable.

### Data
- `build_data.py` extended with 5 new edge-emitting YAML fields: `participants`, `traditions-affected`, `documents-affected`, `documents-produced`, `deities-affected`. Closes the long-standing "events have no outgoing edges from their own YAML" gap.
- `opus-monuments-1` agent: tagged 15 existing event-site nodes with `monument` + created 8 new monument-event nodes (Kaaba, Hagia Sophia, Chartres, Borobudur, Angkor Wat, Parthenon, Karnak, Mahabodhi). All metadata-grade, ≥2 Tier-1 refs each.
- New deity stubs from earlier in the session (foundation patch + symbology cleanup): ashur, ninisina, ninazu, typhon, lotan, vritra, apophis, nandi, lamassu, leviathan, ningishzida, lugalbanda, nefertem, brahma, surya, jormungandr, allat, hubal, anshar-kishar, ninkarrak.
- Slug-drift fixes via canonical-slugs alias: `yhwh-hebrew` → `yahweh` (9 incoming refs); `ningal` → `nin-gal-sumerian` (3 incoming); `ninlil` → `nin-lil-sumerian` (3 incoming).

---

## File map — what was touched

| File | What changed |
|---|---|
| `src/js/app.js` | Major: shapes, edge styling, Pantheon modes, family derivation, alias resolver, Timeline polish, click handlers, setView guard |
| `src/styles/app.css` | Sidebar compact-mode, footer-toggle escape, edge default color, monument shape sizing, zoom-preset CSS, dropdown styling |
| `index.html` | Footer toggle moved out of `<footer>`. Tier-button + tier-legend added by another agent. Cache-bust query on app.js. |
| `build_data.py` | 5 new edge-field bindings |
| `05_events/event-*.md` | 15 retrofit-tagged + 8 new monument nodes (via `opus-monuments-1`) |
| `03_deities/*.md` | ~20 new stubs (via foundation patch + symbology cleanup batches) |
| `00_meta/canonical-slugs.md` | 3 slug-drift alias entries |
| `AUDIT/13_session-handoff-frontend-2026-05-14.md` | This file |

---

## Verification harness for the next agent

The preview server is running at `localhost:8742` (serverId in `mcp__Claude_Preview__preview_list`). Use it actively — many of my bugs this session were caused by NOT verifying renders against the live preview before declaring victory.

Pattern that works:

```js
mcp__Claude_Preview__preview_eval(serverId, `
  (async () => {
    location.reload();
    await new Promise(r => setTimeout(r, 2000));
    // <do thing>
    return <state>;
  })()
`)
```

If `location.reload()` returns "Inspected target navigated or closed", that's expected — the eval target closes during navigation. Just call eval again with the post-reload check.

If JS edits don't appear to take effect, bump the cache-bust version in `index.html` (`?v=YYYYMMDD-N`). The dev server doesn't auto-bust.

---

## Coordination notes

- `ACTIVE-AGENTS.md` has been updated by several agents this session. Read it. Other agents have been writing content (Buddhist wedge, scripture, hellenic-2, monuments). My handle was lead-coordination + frontend.
- The user explicitly distinguished CONTENT work (other agents) from FRONTEND work (this session). Frontend agents stay in `src/`, `index.html`, `build_data.py`, and `AUDIT/`. Don't touch vault content (`0X_*/*.md`) without explicit user instruction.

End of handoff. Pick up open items #1 and #2 first.
