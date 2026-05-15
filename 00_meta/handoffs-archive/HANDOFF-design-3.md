# Handoff — end of session 2026-05-14 ~22:45

**Last design lead:** `opus-design-3` (finished). Three back-to-back app passes shipped this session: opus-design-1 (architecture-doc + foundation cleanup), opus-design-2 (Source-Integrity-Tier overlay), opus-design-3 (Atlas world-map view + zoom-progressive label LOD).

## What you need to know before touching `app.js` / `app.css`

1. **Read `00_meta/app-architecture.md` first.** Load-bearing rules doc. Token vocabulary, component primitives, state-coverage requirement, view-extension contract (5-step recipe in §5), style-preset contract, 8 named anti-patterns, `FEATURES` flag pattern. **Every edit goes through these rules.**
2. **Tokens-only.** No new fonts, no new hex colors, no new font-size px values, no new z-indices outside the documented ladder, no inline `style="…"` in JS render strings.
3. **`FEATURES` flag** at top of `app.js` gates half-built modes. Currently live: `tierOverlay`, `pantheonMonuments`, `atlasMap`. Off: `transmissionFlow`, `threadsView`. Add a flag for any new mode/view before exposing it.
4. **Two reusable patterns from the last three passes:**
   - **Tier overlay (`opus-design-2`)** — any new SVG node-class needs `data-tier` set in JS so `body.tier-overlay-on` recolors strokes automatically. Drop `.attr('data-tier', n => n._tier ?? 'none')` on append.
   - **Zoom-progressive LOD (`opus-design-3` v2)** — pattern from `VIEWS.pantheon` lines 1229–1308, replicated in `VIEWS.atlas` lines ~4180–4280. Degree-tier classification + `updateLOD(k)` on every zoom + debounced bbox-deconflict by degree. Use this any time a new view plots ≥100 labels.

## Live state

- **Vault:** 1765 nodes · 10537 edges · 3.4% dead-link ratio (post-`opus-flood-1` + `opus-monuments-1`).
- **App:** 6 Maps views (Pantheon · Timeline · Documents · Scripture · Alchemy · **Atlas** — new). 5 Indexes (Authors · Themes list · Connections · Traditions · All nodes). About. Tier overlay (`body.tier-overlay-on` via side-nav button). Themes filter overlay. 13 style presets.
- **Git:** local repo, 3 commits, **NO REMOTE** (John explicit: not online until "done").

## Open queue (ranked, all opus-design-4-ish)

| # | Task | Size | Why |
|---|---|---|---|
| 1 | Tier-legend should optionally count atlas-visible nodes when on Atlas | S | Currently shows global filtered count — minor mismatch with what's visible on the map |
| 2 | Great-circle trail curves on Atlas (Bezier interpolation) | S | Currently straight lines; Aksum-Cordoba arc would read more geographic |
| 3 | Time-scrubber strip replacing era dropdown on Atlas | M | Continuous slider feels more fluid than 6 presets; reuse Timeline gap-compression |
| 4 | KDE heatmap layer on Atlas | M | Shows "where the vault is heaviest" without dot-by-dot rendering |
| 5 | Region polygons colored by family-density on Atlas | M | Continent fill encodes content-density at a glance |
| 6 | Edge tier rendering — edges inherit `min(src.tier, tgt.tier)` | S | Completes the tier overlay (currently nodes only) |
| 7 | Click a tier-legend row → cross-view filter to that tier | S | Makes the legend interactive |
| 8 | `localStorage` persist of tier-overlay state | S | Currently resets to off on every reload |
| 9 | Cut the 6-family font loadout to 3 role-slots | M | Architectural — would lock the font contract permanently. Test against all 13 presets. |
| 10 | Transmission-Sankey view (the audit's #1 ranked infographic) | L | Cross-tradition flow as a single legible diagram by phase |
| 11 | Threads bridge-figure ladder view (Hermes/Mary/Abraham/Solomon across corpora) | L | The figure-as-bridge lens; complements Scripture |
| 12 | Phase-isotype grid uplift on Documents | M | Small-multiples coverage map |

## Coordination

- Add yourself to `00_meta/ACTIVE-AGENTS.md` **at-a-glance table** (line ~21) AND a full claim block at the bottom before starting.
- Other agents may be running content batches (`opus-hellenic-3` mystery-cult capstone, `opus-flood-1` cross-tradition flood wedge, `opus-gaps-1` dead-link closure) in parallel — they touch vault nodes, not app files. Coordinate file-by-file.
- After your batch: `python3 build_data.py && python3 build_dashboard.py`, then update `ACTIVE-AGENTS.md` status + `STATUS.md` headline.

## Touch points (file:line ranges as of close)

- `index.html` lines 26–32 (nav), 53–58 (tier-button), 109 (#tier-legend)
- `src/styles/app.css` lines 1–80 (`:root` + tokens), 35–46 (`:focus-visible` utility), 411–417 (themes-menu overlap fix), 446–456 (tier-button), 462–475 (body.tier-overlay-on rules), 477–540 (.tier-legend), 1010–1037 (.list-pane-header + .list-pane-empty), 1263–1331 (.atlas-* section)
- `src/js/app.js` lines 15–21 (`FEATURES`), 23–35 (per-node `_tier` computation), 367–400 (`geoToMap` + `CONTINENT_OUTLINES`), 4041–4225 (`VIEWS.atlas` incl. LOD refactor), 4226–4286 (tier-overlay button + legend)

End of handoff. Good luck.
