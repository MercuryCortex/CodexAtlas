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

_Nothing here yet under the new lane protocol. Older UX work is in `agents-archive/2026-05-W2-active.md`._
