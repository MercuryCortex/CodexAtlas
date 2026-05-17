# ACTIVE-UX — UX lane (single slot)

> **Lane B — UX.** Only **one agent at a time** may hold this slot. App-code work serializes by design — the "seven-sweep" incident (2026-05-17) proved parallel agents on `src/js/` collide repeatedly.
>
> Read `00_meta/LANES.md` for the lane definition and `00_meta/VIEW-CONTRACT.md` for the rules any view module must satisfy. Do **not** stage any path under `01_*` through `17_*` content folders. The pre-commit hook will refuse a cross-lane commit.

## Slot

| Handle | Scope | Owned files (explicit) | Started | Status |
|---|---|---|---|---|

_Slot is open. Claim it by filling the row above. If the slot is taken, switch to investigation work or wait._

## Current rollout queue (UX agent picks the next one)

Priority order for the kit + view migration sequence (from the Workflow Reset plan):

1. **Phase 3 — Kit extraction** — Lift Pantheon V2 design primitives into `src/js/kit/`. Pantheon V2 keeps rendering identically. *(Not started.)*
2. **Phase 4 — Documents view migration** — Adopt kit primitives in `src/js/app.js` Documents view. *(Blocked on Phase 3.)*
3. **Transmission view migration** — Biggest visual win after Documents.
4. **Atlas (map) view** — Adopt `thumb-card.js` for node hover.
5. **Timeline view** — Adopt tier colors + phase-band tokens.
6. **Astrology spine + wheel** — Adopt `rim-labels.js` + `force-bake.js`.
7. **Scripture ring** — Adopt `edge-buckets.js` for cross-book trails.
8. **Alphabets glyph viewer** — Adopt `thumb-card.js` + tokens.
9. **Remaining list views** — Authors, Themes, Edges, Traditions, All-nodes — token-only normalization.

## How to claim (3 lines)

1. Confirm slot is open (table above empty). If not, wait or do investigation work.
2. Fill the slot row: `| your-handle | what you're doing | the exact files you'll touch | YYYY-MM-DD HH:MM | started |`. Path enumeration must be explicit — "Owns: src/js/" is not specific enough.
3. When you commit and verify via `mcp__Claude_Preview__`, release the slot (move row to "Recently completed" or delete) and add a one-line entry to the top of `00_meta/STATUS.md`.

## Recently completed (last 5)

- `opus-edge-buckets-universal-1` (2026-05-17) — Universal 7-bucket edge palette + ONTOLOGY-correct routing. New `src/js/edge-buckets.js` is the single source of truth; consumed by both `pantheon-v2.js` and `app.js` via `window.edgeStyleFor()`. The `syncretic` family (935 + 792 + 336 + 22 = ~2,085 edges) moved from Parallel → Fusion per ONTOLOGY.md §3 — Inanna ↔ Ishtar / Poseidon ↔ Neptune-Roman / Isis-Hellenistic identifications now paint amber, not teal. `heir-of` + `descended-from` + `syncretic-direct-influence` now route to Transmission terracotta. Headline opacities restored to AUDIT spec (Polemic 0.25, Fusion 0.30, `ancestor-of` 0.30). Dormant legacy `EDGE_STYLE` deleted from `pantheon-v2.js`; `app.js` keeps `EDGE_STYLE[t]` as a Proxy delegating to the universal map for back-compat. Verified live: 1,977 fusion edges rendered in V2 Deities mode. Files: `src/js/edge-buckets.js` (new), `src/js/views/pantheon-v2.js`, `src/js/app.js`, `index.html` (cache-bust `20260517-edge-buckets-universal`).
- `opus-pantheon-focus-vis-1` (2026-05-17) — Focus-state visual overhaul + dev-panel always-on. (1) Removed the `?dev=1` URL gate from `src/js/dev-panel.js`; the vertical "Dev Panel" tab now appears on every page load, `D` key still toggles. (2) Type-glyphs no longer paint stark white — each glyph picks up a lighter hue of its node's family color via a new `lightenColor(hex, 0.55)` helper, set inline as `style.color` at build time; `currentColor` inside the SVG paths inherits the tint. The dev-panel `Type glyph opacity` slider now controls actual `opacity` (not color alpha). (3) New `applyTypeGlyphDim()` toggles `.ph2-type-glyph-dim` (opacity 0.10) on entries whose node is in the DIM state or whose family is filtered out — wired into both `applyEdgeHoverState` and `applyHullFilterState`. (4) Split the SVG overlay into two: hulls + ticks stay below sigma (so disks paint on top of family backgrounds), edges are lifted into a new `.ph2-edges-overlay` at `z-index: 2` so the bright wires paint OVER the dim disks when a node is locked. Verified live: clicking Zeus dims every non-focused disk to a soft family hue at 10% opacity, the radial wires to Jupiter/Apollo/Marduk/Baal-Hadad/Indra read clearly across faded clusters, and the dev tab is visible without any URL flag. Files: `src/js/views/pantheon-v2.js`, `src/js/dev-panel.js`, `src/styles/app.css`, `index.html` (cache-bust `20260517-focusvis`).
- `opus-pantheon-polish-1` (2026-05-17) — Three Pantheon V2 polish fixes. (1) Music type-glyph redrawn as a clean quarter-note (head + stem, matches the toolbar's `♩`) — replaced the previous double-eighth design which read as noise at small sizes. (2) Smart-label space-fill rule: in `hub` label mode, every label now enters the deconflict pool — hubs claim their slots first (highest priority by degree), then lower-tier labels are promoted to visible when their bbox doesn't collide with any already-claimed bbox. Empty-hull traditions (Christian / Macedonian / Pre-Islamic Arabian / Pacific…) now surface dozens of secondary labels. (3) Node tier-radii bumped from `[13,10,7,5]` → `[16,12,9,7]` — the rest-tier (low-degree single nodes in sparse hulls) is now 40 % bigger and clearly legible. Files: `src/js/views/pantheon-v2.js`, `index.html` (cache-bust `20260517-polish`).
- `opus-pantheon-hashrouter-1` (2026-05-17) — Pantheon V2 hash router + dev-panel knobs. URL params `view` / `mode` / `families` / `locked` / `focus` round-trip cleanly: mode change, family-filter, hull-toggle, node-click, and empty-stage-reset all update the URL via `replaceState`; cross-view navigation (Pantheon → Timeline → Pantheon) uses `pushState` so the back-stack moves between views; deep-links like `?view=pantheon&mode=documents&focus=phase-3-021-hermetic-corpus-earliest` mount the wheel in that exact state. Dev panel got two new sections — `Hover card` (card width / image height / tagline line-clamp) and `Type glyphs` (wheel-glyph scale / opacity) — gated on `?dev=1`. Files: `src/js/app.js`, `src/js/views/pantheon-v2.js`, `src/js/dev-panel.js`, `src/styles/app.css`, `index.html`.
- `opus-pantheon-hovercard-1` (2026-05-17) — Pantheon V2 hover-card rebuild + per-node-type SVG glyph vocabulary. Wide cover-cropped image, curated `role` tagline (falls back to attributed Wikipedia extract — no invented prose), family · BCE/CE period meta, edge-bucket connection breakdown, tag-label chips. New `ph2-type-glyphs-layer` paints a distinct geometric primitive per node type (deity / author / document / symbol / event / ritual / music / alphabet / alchemy / philosophy / moral / medicine / mathematics / monument / theme / tradition / place) — first-pass primitives, slot in hand-illustrated vectors by replacing TYPE_GLYPHS entries. Files: `src/js/views/pantheon-v2.js`, `src/styles/app.css`, `index.html`.

_Older UX work is in `agents-archive/2026-05-W2-active.md`._
