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

- `opus-pantheon-hashrouter-1` (2026-05-17) — Pantheon V2 hash router + dev-panel knobs. URL params `view` / `mode` / `families` / `locked` / `focus` round-trip cleanly: mode change, family-filter, hull-toggle, node-click, and empty-stage-reset all update the URL via `replaceState`; cross-view navigation (Pantheon → Timeline → Pantheon) uses `pushState` so the back-stack moves between views; deep-links like `?view=pantheon&mode=documents&focus=phase-3-021-hermetic-corpus-earliest` mount the wheel in that exact state. Dev panel got two new sections — `Hover card` (card width / image height / tagline line-clamp) and `Type glyphs` (wheel-glyph scale / opacity) — gated on `?dev=1`. Files: `src/js/app.js`, `src/js/views/pantheon-v2.js`, `src/js/dev-panel.js`, `src/styles/app.css`, `index.html`.
- `opus-pantheon-hovercard-1` (2026-05-17) — Pantheon V2 hover-card rebuild + per-node-type SVG glyph vocabulary. Wide cover-cropped image, curated `role` tagline (falls back to attributed Wikipedia extract — no invented prose), family · BCE/CE period meta, edge-bucket connection breakdown, tag-label chips. New `ph2-type-glyphs-layer` paints a distinct geometric primitive per node type (deity / author / document / symbol / event / ritual / music / alphabet / alchemy / philosophy / moral / medicine / mathematics / monument / theme / tradition / place) — first-pass primitives, slot in hand-illustrated vectors by replacing TYPE_GLYPHS entries. Files: `src/js/views/pantheon-v2.js`, `src/styles/app.css`, `index.html`.

_Older UX work is in `agents-archive/2026-05-W2-active.md`._
