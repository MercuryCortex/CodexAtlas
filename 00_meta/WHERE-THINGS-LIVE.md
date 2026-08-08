# WHERE THINGS LIVE — every surface, and how you reach it

> **One screen. Read it when you cannot find something, or before you move
> anything.** Written 2026-08-07 because John could not find the DEV
> Overview and neither could an agent reading that view's own header — the
> comment still named the menu it had lived in *before* a refactor. Nothing
> in the repo mapped surface → route, so both of us searched docs, audits
> and published artifacts before looking in `src/js/views/`.
>
> **THE RULE THIS FILE EXISTS TO ENFORCE:**
> **if you move a surface, update its "how do I get here" line IN THE SAME
> COMMIT — here and in the file's own header.** Same law as "a gate moves
> with the law it guards"; a stale route comment is a gate that lies.

Verified against **live production**, not the source, on 2026-08-07.

---

## The four ways in

| Control | Where on screen | What it opens |
|---|---|---|
| **⚒ master pill** | top-left | the master views (below) |
| **✦ user menu** | top-right | account + project pages — NOT a view switcher |
| **bottom bar** | bottom-left | zoom · LEGEND (tier filters) · VIEW (wheel chrome) · search · time slider · **DEV** |
| **side panel** | right edge | the node inspector — opens on click, ✕ closes |

## Master views — ⚒ pill

| Entry | Route | Owner |
|---|---|---|
| **ATLAS** | `?view=forge` | `src/js/views/forge.js` — *the map*, the flagship |
| **TIMELINE** | `?view=timeline` | `src/js/views/timeline-chrome.js` |
| **ALPHABETS** | `?view=alphabets` | `src/js/views/alphabets.js` |
| **INVESTIGATION** | `?view=investigation` | `src/js/views/investigation.js` |
| **BOARD** | `?view=boards` | `src/js/views/boards.js` |
| V01 prototype | new tab | `_legacy/index.html` — frozen reference |

Also mounted but not on the pill: `maps.js`, `starmap.js`, `pantheon-v2.js`,
`scripture-reader.js` (the reader, opened from a scripture node).

## ⚠️ DEV drawer — bottom bar → **DEV**

**This is where the operator tools are.** They are NOT in the ✦ menu.

| Row | What it is | Owner |
|---|---|---|
| Node Lab | node recipe dials — light, glass, wires | `forge/lab-panel.js` |
| House | the family tree — tree, band, ports, words | `forge/house-panel.js` |
| FX | floor-zoom effects + pulse | `forge/fx-panel.js` |
| Style | ring / separator / timeline strokes | `forge/style-panel.js` |
| Stats | engine HUD, read-only | `forge/debug-stats.js` |
| **Overview** | **vault coverage — per-lens levels** | `views/dev-overview.js` |

### The Overview specifically — "the status map with the levels"
Per-lens and per-family node counts against a scholarly baseline, banded
**anemic** (<25%) · **developing** (25–60%) · **rich** (60–150%) ·
**over-baseline** (>150%), plus the deity transmission ranking × civilization-lens
heat-map. Wired in `forge/dev-drawer.js` via `data-dev-panel="overview"`.

**It reads baked JSON, so it is only as fresh as its last rebuild:**

```
python3 scripts/build_health_index.py          # the per-lens levels
python3 scripts/build_transmission_ranking.py  # the roots heat-map
python3 scripts/audit_wire_coverage.py         # wire-coverage.json
python3 scripts/audit_scripture_coverage.py    # scripture-coverage.json
```

## The vault's own status docs (agent-facing, not in the app)

| File | What it holds |
|---|---|
| `00_meta/STATUS.md` | the running log — newest entry on top |
| `00_meta/DASHBOARD.md` | node counts, dead links, top unresolved targets · `python3 build_dashboard.py` |
| `00_meta/HOW-WE-WORK.md` | the cast-and-go doc — the pre-flight |
| `AUDIT/` | standing audits and proposals; unimplemented unless STATUS says otherwise |

## Data the app actually reads

`data.js` at the repo root is **baked and gitignored**. The vault's `.md`
files are the source of truth, but **nothing you write reaches the app until
`python3 build_data.py` runs** — and the deploy bakes from your local copy.
Same trap as the `?v=` cache-buster: the edit is not the ship.
