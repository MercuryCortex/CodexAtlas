# Atlas App — Architecture & Design-System Contract

> **Status:** Authoritative. Every agent extending the Atlas app (`index.html`, `src/styles/app.css`, `src/js/app.js`) MUST follow these rules. New views, new infographics, and new state must compose from the primitives defined here — never reinvent.
>
> **Anti-Frankenstein clause.** If you find yourself writing `style="…"` inline, picking an ad-hoc font-size value, declaring a new z-index, or copying half a Scripture-view rule into a different selector — stop. Add the missing token or shared class to this file first, then use it. The cost of "just this once" compounds catastrophically across 11+ views and 13 style presets.

---

## 1. The Scripture rule

**Scripture is the polish-tier ceiling.** When in doubt about how a new view should look or behave, replicate Scripture's pattern:

- **Three font families, three roles.** Serif for hierarchy labels · mono for buttons, IDs, micro-callouts · italic-serif for descriptive microcopy. No fourth family.
- **A real empty-state.** Styled card with a serif headline and a mono sub-line (see `.scripture-empty` at `src/styles/app.css`).
- **A real custom control, not a raw `<select>`,** when the dropdown carries more than 3 options or any description text. See `.scripture-corpus-btn` + `.scripture-corpus-popup`.
- **Coherent transitions** — same easing (`cubic-bezier(0.2, 0.8, 0.2, 1)`), same durations (140ms micro, 240ms layout, 280ms overlay).

---

## 2. Design tokens (the only legal vocabulary)

All tokens are defined in `src/styles/app.css` `:root`. Style presets (`body.style-*`) re-bind a subset; per-view CSS may **read** tokens but must **not introduce new ones inline**. Adding a new token: append to `:root` with a 1-line comment, document it here, then use it.

### Color tokens
- `--bg-0` (deepest canvas) · `--bg-1` (panel) · `--bg-2` (raised) · `--bg-3` (hover-raised)
- `--border` · `--border-soft`
- `--text-0` (primary) · `--text-1` (body) · `--text-2` (muted) · `--text-3` (faint)
- `--gold` (primary accent) · `--gold-soft` (secondary accent) · `--copper` · `--sage` · `--crimson` · `--indigo` · `--slate`

### Type-family tokens
- `--serif` — display hierarchy. **Must be a serif** in every preset (this is a hard contract — Inter is not allowed here).
- `--sans` — UI body text.
- `--mono` — precision: buttons, IDs, counts, micro-labels.

### Type-scale tokens
- `--h1-size: 22px` — modal/panel titles
- `--h2-size: 16px` — section titles inside detail/about panes
- `--h3-size: 14px` — sub-section
- `--lbl-lg: 12px` — primary labels (nav items, etc.)
- `--lbl-md: 10.5px` — secondary labels (subtitle, sub-row meta)
- `--lbl-sm: 9.5px` — caps section labels (sidebar group headers)
- `--micro: 9.2px` — SVG-overlay micro-labels only

### Spacing / radius (informal — keep to 4px grid)
- 4 · 8 · 12 · 14 · 18 · 24 · 32 · 48 — pad/margin steps. Avoid 5, 7, 11, 15, 22.
- Radii: `2px` (chips), `3px` (buttons/inputs), `4px` (cards), `999px` (pills).

### Z-index ladder (strict)
| Range | Layer | Examples |
|---:|---|---|
| 1–10 | In-canvas content | view-header (5), zoom-meter (6), scripture-book-label (2) |
| 25–40 | In-canvas floating UI | timeline zoom presets (25), alch palette (40) |
| 50–60 | Fixed chrome | footer (50), footer-toggle (51) |
| 100–110 | Side nav / full-screen modals | nav (100), missing-data (100), side-tab (101) |
| 200–300 | Overlay menus | themes-menu (200), style-menu (250), scripture-corpus-popup (300) |
| 1000 | Tooltips only | `.tooltip` |

**Rule:** any new floating UI claims a z-index within an existing tier. Adding a new tier requires a comment justifying why.

---

## 3. Component primitives (use these — don't reinvent)

| Pattern | Class | Use for |
|---|---|---|
| Main button | `.btn` | Any clickable in `view-controls`, detail panel, footer |
| Compact button | `.btn .btn-mini` | View-controls toolbar buttons |
| List view container | `.list-pane` | Any index/list view (themes, edges, traditions, all) |
| List section header | `.list-pane-header` | Group headers inside a list-pane (added 2026-05-14) |
| List row | `.list-pane .row` | A single clickable list item |
| Map view controls slot | `#view-controls` | The top-right toolbar of every map view |
| Empty-state card | `.empty-card` (alias to `.scripture-empty` pattern) | Any view's no-data state |
| Pill chip | `.chip` (TBD — currently bespoke per location) | Status chips, active-filter chips |
| Floating dropdown | `.scripture-corpus-popup` pattern | Custom popovers richer than a `<select>` |
| Dev launcher | `.forge-devdrawer-*` (one `DEV` door, drop-up row list, z 235) | EVERY workshop panel. One door, panels open individually, one editor at a time in the fixed top-right slot; the read-only STATS HUD is the only exemption. Added 2026-07-30. **Do not add a new button to the bottom bar for a dev surface — add a launcher row.** Canonical reader controls (`VIEW`, `LEGEND`, ✦ `FOLIO`) keep their own places and must never move into it. |

**Rule:** if your new view needs a primitive that isn't in this list, propose it here first as a new row, then implement it.

---

## 4. State-coverage requirements

Every interactive element MUST style these four states. No exceptions:

1. **default**
2. **`:hover`** — must use a token (`var(--gold)` or `var(--bg-3)`), never an ad-hoc hex.
3. **`:focus-visible`** — must show a visible outline. The shared utility lives in `app.css` (`*:focus-visible` baseline) and individual buttons may override but never to `outline: none` without a replacement.
4. **`:active` / `.open` / `.active`** — when the control has a "currently engaged" state, it must look distinct from `:hover`.

Disabled state is required only when the control can actually be disabled. SVG-rendered nodes are exempt from `:focus-visible` (no keyboard target) but must still have JS-driven `.hot` / `.dim` / `.selected` classes that visibly differ.

---

## 5. View extension contract

To add a new view (e.g. "Atlas", "Transmission", "Threads"):

1. **Register in `index.html`** — one `<div class="item" data-view="newview">` inside the appropriate `<div class="nav-inner">` section (Maps / Indexes / Project).
2. **Add `VIEWS.newview` to `src/js/app.js`** with `title`, `subtitle`, and `render()`. The render function must:
   - Append its DOM to `#canvas` (for HTML panes) OR draw into the global `<svg id="svg">` (for graph views).
   - Set `view-controls` markup using `.btn .btn-mini` only — no inline styles.
   - Provide a real empty-state card if data may be empty.
3. **Add CSS** in `src/styles/app.css` scoped under `.newview-*` selectors. Only reference design tokens — no new fonts, no new colors, no new z-indices outside the documented ladder.
4. **No inline `style="…"`** in `render()`. All styling lives in CSS.

---

## 6. Style-preset contract

The 13 presets (`body.style-codex|crypt|mystic|twilight|technical|parchment|vatican|nag-hammadi|passion|orthodox|atlantis|eye|hermes`) may override **only** the token bindings, not the structural CSS. A preset may:

- Re-bind color tokens (`--bg-0`, `--text-0`, etc.)
- Re-bind type-family tokens (`--serif`, `--sans`, `--mono`) — **but `--serif` must remain a serif family**.
- Add a small number of scoped tweaks (e.g. `body.style-technical .brand h1 { letter-spacing: 0.04em; }`) — but only when the preset's identity genuinely demands it.

A preset may not:
- Introduce new components or override layout / positioning.
- Hide structural elements except through token bindings (e.g. setting a glyph color to `transparent` is fine; `display: none` is not).
- Override font-family on a specific element (`.so-name`, `.brand h1`, etc.) — change the token instead.

---

## 7. Anti-patterns (instant rework)

If a code review spots any of these, the change goes back:

- `style="font-size: 11px; padding: 0 14px; ..."` — inline CSS in JS render strings. Use a class.
- New font URL loaded in `index.html` that doesn't replace an existing one. Loadout is capped at three families per role (serif, sans, mono).
- A new `font-size:` value in px that doesn't match a `--lbl-*` / `--h*-size` / `--micro` token.
- A new color hex that isn't one of the documented tokens.
- A new `z-index:` value outside the documented ladder.
- A `<select>` used where the option list contains description text or icon glyphs that aren't single-character — use the `.scripture-corpus-popup` pattern instead.
- An empty-state rendered as bare text inside an SVG (`svg.append('text')... 'No data'`) — use `.empty-card`.
- A `:hover` state with no matching `:focus-visible`.
- A view that re-implements list rows instead of using `.list-pane .row`.

---

## 8. Feature-flag pattern

For half-built / placeholder modes (e.g. Pantheon `monuments`, future "Atlas" map): gate them behind a top-of-file `FEATURES = { monuments: false, atlasMap: false, ... }` constant in `src/js/app.js`. Do NOT ship them as visible dropdown options with empty payloads — that breaks the rule that every visible affordance must work.

---

## 9. Build & rebuild

The app is static — no bundler, no transpile. Edits to `index.html`, `src/styles/app.css`, `src/js/app.js` take effect on browser refresh. The `data.js` payload is regenerated by `python3 build_data.py`. Re-run `python3 build_dashboard.py` after any content batch so the next agent's DASHBOARD is current.

---

## 10. When to update this doc

- New design token added → document it in §2.
- New shared component → add to §3.
- New view added → no doc update needed, but verify §5 compliance.
- New floating UI → claim a z-index from §2 and explain why if a new tier is needed.
- New style preset → verify §6 compliance.

**Last update:** 2026-05-14 by `opus-design-1` (initial codification).
