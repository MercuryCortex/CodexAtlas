# Session HANDOFF — 2026-05-17 evening

**Last opus session:** `opus-v2-batch-e-1` + several follow-up fixes. **Pantheon V2 is now the master `pantheon` route.** Read this top-to-bottom, then [`../AGENTS.md`](../AGENTS.md), then dive in.

---

## ⚠️ READ FIRST — the seven-sweep problem

This session had **seven separate incidents** of parallel agents stepping on each other's app-code work. Concrete failures:

- `appendChild(overlay)` vs `insertBefore(overlay, rootEl.firstChild)` got toggled by a parallel agent → SVG hulls painted ABOVE sigma canvases → every click landed on a hull, not a deity. Required two rounds of re-fix.
- `.ph2-edge.hot { stroke: …; !important }` was re-added by a parallel agent that didn't know `applyEdgeHoverState` sets inline `style.stroke = url(#gradId)` for directional gradients. The `!important` silently blocked every gradient.
- An off-spec `'cross-tradition'` bucket (`idle: 0.62`, headline) got injected into `BUCKETS` by a parallel agent — produced 19 always-visible thick teal lines through the wheel centre that read as "a connection I can't clear."
- My staged files got swept into three unrelated parallel commits in a row — attribution muddied, commit messages wrong.

**`AGENTS.md` was updated this session with a hard rule: APP-CODE WORK SERIALIZES.** If you are about to touch anything under `src/js/`, `src/styles/`, or `index.html`, **stop and grep `00_meta/ACTIVE-AGENTS.md` for an in-flight claim listing your target file**. If one exists, do something else or coordinate.

The rule is non-negotiable. Read it in AGENTS.md before you touch any app-code file.

---

## 🌅 Where things stand

### Promoted: V2 is the master Pantheon

The legacy D3/SVG Pantheon is preserved as `VIEWS._legacyPantheon` in `src/js/app.js` for emergency rollback, but `VIEWS.pantheon` now uses the sigma/WebGL implementation in `src/js/views/pantheon-v2.js`. The `?webgl=1` URL flag is gone. Bookmarks to `?view=pantheon` land on V2.

Rollback paths:
- `git checkout landmark-before-v2-promotion` — pre-promotion landmark
- Or in console: `VIEWS.pantheon = VIEWS._legacyPantheon; setView('pantheon');`

Landmark tags (all annotated):
- `landmark-pantheon-v2-clean-states` — stable V2 with clean state machine
- `landmark-before-v2-promotion` — snapshot before V2 took over `pantheon` route
- `landmark-v2-promoted` — V2 owns `pantheon` route + alias for `pantheon-v2`

### What's live in V2 right now

- **7-bucket strict edge palette** per [`AUDIT/edge-color-spec-2026-05-17.md`](../AUDIT/edge-color-spec-2026-05-17.md). Transmission / Parallel / Association / Kinship / Attestation / Polemic / Fusion. Directional buckets paint as gradients on hover (and ancestor-of always at idle).
- **14 modes** in the mode dropdown — Deities (default), Authors, Symbols, Events, Documents, Rituals, Music, Alphabets, Alchemy, Philosophy, Morals, Medicine, Mathematics, Monuments.
- **Family-filter dropdown** (multi-select tick boxes + Reset) in the top toolbar. **Hull-click toggles a family in the filter set** via clickStage hit-test (sigma's mouse canvas sits above the SVG overlay, so we can't rely on SVG event propagation).
- **Empty-stage click** is the universal reset — clears lock + selected + filter + closes detail panel + clears `window.STATE.selected` + clears map-thumb. There's no "stuck highlight" state.
- **Inline zoom group** (`− 100% + ⌖`) in the top toolbar, no separate floater. Detail-panel aware (slides left when detail opens).
- **Wire-legend toggle** at the bottom-left, stacked above the footer-toggle, same anchor.
- **Search hook** — footer search input calls `window._pantheonV2._searchAndFocus`. Picks highest-degree id/title match, locks 1-hop neighbourhood, fires `selectNode`.
- **Drag a deity within its wedge** — soft radial clamp, incident edges follow live.
- **Photos toggle** removed from the UI; `setThumbsEnabled()` still callable via console.

### What's queued, in priority order

1. **Multi-tag search rebuild** — Enter → chip → multi-isolate. Simple version is in. The big version (chips below the search bar, Cmd+F, page-aware chrome, layout-aware UI shift) is still half-built.
2. **Mode audit** — verify each of the 14 modes produces a sensible wheel (Authors mode's zoom-label problem was flagged earlier).
3. **Phase 2 of V2 promotion** — delete `VIEWS._legacyPantheon` from `src/js/app.js` (~800 lines of dormant code). Only after John confirms a session of green production usage.
4. **Map-thumb V2 wiring polish** — currently re-uses production `window.setMapTarget`. Works, but could use V2-specific styling.

---

## 🛠️ How to work safely in this codebase

### Mandatory pre-flight (every session)

1. Read [`DASHBOARD.md`](DASHBOARD.md) — live priority queue, dead-link counts, inventory.
2. Read [`ACTIVE-AGENTS.md`](ACTIVE-AGENTS.md) — at-a-glance table at the top. **Do not pick a slug another agent owns.**
3. Read [`../AGENTS.md`](../AGENTS.md) — full coordination protocol including the new APP-CODE SERIALIZES rule.
4. **If you'll touch app code, grep ACTIVE-AGENTS.md for the exact filenames you plan to edit before staging anything.**

### Cache-bust convention

`index.html` carries `?v=<YYYYMMDD>-<slug>` on every script + CSS link. Bump to a new slug on every batch (e.g. `20260518-mybatch-1`). The browser revalidates only when the query changes.

### Verification (V2 view)

The dev server runs at `http://localhost:8742` via `scripts/serve-node.js`. Use the `mcp__Claude_Preview__` MCP tools (`preview_eval`, `preview_screenshot`, `preview_console_logs`) to verify. **Note:** the preview iframe runs in a hidden Chrome tab — Chrome throttles CSS animations there, so synthetic transition tests may report "stuck" even when they work fine in a real foreground tab.

### Pre-commit hook

`node --check` runs against every `src/js/*.js` file you stage. It refuses syntax-broken JS. **Do not pass `--no-verify`** unless John explicitly asks.

---

## 📂 Critical files

| Path | Purpose |
|---|---|
| `src/js/views/pantheon-v2.js` | The V2 Pantheon (sigma/WebGL, ~2300 lines). Most edits go here. |
| `src/js/app.js` | Main app. `VIEWS.pantheon` routes to V2's render. `VIEWS._legacyPantheon` is the dormant D3-SVG fallback. |
| `src/styles/app.css` | All CSS. `.ph2-*` rules are V2-specific. |
| `src/js/dev-panel.js` | Live-tweak panel (`D` key toggles). |
| `data.js` | Generated by `build_data.py` — DO NOT hand-edit. |
| `AUDIT/edge-color-spec-2026-05-17.md` | The 7-bucket color spec. **Strict.** Don't add buckets without updating the spec first. |
| `AUDIT/edge-logic-spec-2026-05-17.md` | Per-type edge bucket mapping. |
| `00_meta/DASHBOARD.md` | Live state — regenerated by `python3 build_dashboard.py`. |
| `00_meta/ACTIVE-AGENTS.md` | In-flight agent claims. **Hard requirement: register here before app-code work.** |

---

## 🎯 Suggested next-session move

If you are an opus picking up app-code work:

1. **Multi-tag search rebuild** — top of queue. John explicitly asked. Owns: `src/js/views/pantheon-v2.js`, `src/js/app.js`, `src/styles/app.css`, `index.html`.
2. Or the **mode audit** if you want a lower-stakes warm-up.
3. Or **Phase 2 of V2 promotion** (delete `VIEWS._legacyPantheon`) — easiest cleanup, but only after John confirms a session of green V2 usage with no surprises.

If you are a content agent:

1. Read [`DASHBOARD.md`](DASHBOARD.md)'s priority queue.
2. Pick a wedge or theme. **Never touch app code** — the pre-commit hook will refuse, and AGENTS.md spells out why.

---

— closed by opus, 2026-05-17 evening
