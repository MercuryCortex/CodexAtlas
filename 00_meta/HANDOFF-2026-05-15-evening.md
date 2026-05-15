# Handoff — Atlas Map V3 + class-icons + persistent connections (2026-05-15 evening)

**Last session-close.** Read this first if you're a fresh agent landing in the vault.

This was a marathon Atlas-tab session that finished with the map in a state John called "fantastic". It also pulled in two adjacent fixes (geocoder coverage, default-closed detail panel) and one foundational change (zoom-aware jitter architecture replacing the spider system entirely). Plus a sidebar-nav icon refresh and class-icons on every map marker.

**Pickup branch:** `main` (no remote). **Latest commit:** `98465dc`. **Tag for safe revert:** `atlas-map-v3-icons` (this session-close state) or `map-v3-jitter-flow` (mid-session, before icons).

---

## 🌍 Headline state

| Metric | Value |
|---|---:|
| Total nodes | **1939** |
| Edges | **11,673** |
| Dead-link occurrence ratio | **3.3%** |
| Geo-tagged coverage (excl. themes/traditions) | **~85%** |
| Git commits this session | 30+ |
| Git tags | `atlas-map-v3-icons`, `map-v3-jitter-flow`, `checkpoint-map-v2-working` |

## ⚡ Quick-start verification (fresh-session sanity check)

```bash
cd "~/Desktop/Codex Atlas"
git log --oneline -3              # should show recent atlas-map commits
git tag | grep -E "map|atlas"     # 3 tags
grep -c "_atlasShowSpider" src/js/app.js   # MUST be 0 (spider removed)
grep -c "_atlasComputeFC" src/js/app.js    # MUST be ≥ 3 (the new flow)
ls "_assets/vendor/glyphs/Noto Sans Regular/" | wc -l   # should be 10 .pbf ranges
ls -la _assets/basemap/world-z7.pmtiles    # ~185 MB, gitignored, fetchable
```

**To open the site:** open `http://localhost:8742` directly in browser (the server should already be running). If not, run `python3 scripts/serve.py 8742` or double-click `start-atlas.command`. **Never tell John to open `index.html` via file://** — PMTiles needs HTTP Range support.

---

## 🗺️ Atlas tab — final architecture (read `project_atlas_map_v3.md` in memory for the full doc)

**ONE flow, ONE visual language.** Co-located docs (e.g. 99 Christian texts all at Rome's `41.9°N 12.5°E`) spread visually via a **zoom-aware jitter spiral**:

- Per-node stable angle/ring cached in `_atlasNodeJitter` Map (computed once at GeoJSON build)
- `_atlasComputeFC(zoom, geoNodes, tierById)` returns features with positions adjusted for the current zoom
- Throttled at 60 ms on the `zoom` event so positions slide smoothly during animation
- Jitter scale: `<z4: 0.003-0.018°` (tight, natural cluster) → `<z7: 0.018-0.150°` (rapid spread) → `≥z7: 0.150°` (plateau)

**Cluster click flow:** `easeTo` to `max(getClusterExpansionZoom + 0.6, 6.2)` so we always land past `clusterMaxZoom: 5`. At that zoom, the jitter has the inner ring at ~40 px on screen — well past the `clusterRadius: 25` threshold. MapLibre un-clusters them; user sees individual labeled dots.

**Persistent hover-trails (Pantheon-style).** Hover any node → its connections draw as gold lines. Mouse leaves → trails **stay visible**. Hover another → replaces with that node's. **Only `click empty map` clears.** John explicitly asked for this 2026-05-15 evening: "don't cut the connection, add connections like the Pantheon".

**Class-icons on every dot.** Each non-cluster marker shows its TYPE glyph centered on the colored circle, from z 4 onwards:

| Node type | Glyph |
|---|---|
| deity | ☉ (sun) |
| person | ✎ (pencil) |
| event | ⧖ (hourglass) |
| document | ▤ (ruled rectangle) |
| theme | ❖ (diamond cluster) |
| tradition | ∴ (therefore mark) |
| symbol | ⚗ (alembic) |

Same vocabulary as the sidebar nav, so the design system reads consistently across the app.

**Other surfaces still live on Atlas:**
- Era-range slider docked bottom (dual-handle drag to trim BCE/CE, phase-band gradient, reset button)
- Basemap place labels (countries/regions/cities, fade in per `min_zoom`)
- Cluster-count text labels (the gold "99" inside cluster rings)
- Hub-tier node labels (tier 0-1 always visible; tier 2 from z 5, tier 3 from z 7)
- Double-click empty → snap to baseline 100% view
- Sticky-select: click a node → trails persist, dim/highlight locked; cluster-click or empty-click clears
- 7-layer basemap style in `_atlasBuildStyle()`: bg → earth → landcover → natural → water → boundaries-country → boundaries-region

---

## 📝 What landed this session (by file)

**`src/js/app.js`** (~30 commits across the session):
- `_atlasNodeJitter` / `_atlasJitteredPos` / `_atlasComputeFC` zoom-aware jitter system (replaces the SVG-marker + later spider system)
- Single `atlas-nodes` source with `cluster: true`, `clusterRadius: 25`, `clusterMaxZoom: 5`, `maxZoom: 10`
- Layers: `atlas-clusters` + `atlas-cluster-counts` + `atlas-nodes-circles` + `atlas-node-labels` + `atlas-node-icons` + `basemap-place-labels` + `atlas-trail-line`
- `_ATLAS_TYPE_ICON` lookup table + per-feature `typeIcon` property
- Hover-trails using live `_atlasJitteredPos` (not original lat/lon centroid)
- Era-range slider `_renderAtlasEraSlider()` with stable pointer-event listeners
- Detail-panel cleanup on cluster click, double-click reset to baseline
- Removed: spider source/layers (`atlas-spider-*`), `_atlasShowSpider`, `_atlasHideSpider`, `_atlasToggleUnderlyingLayers`, `_atlasSpiderActive`, `_atlasSpiderRecentering`, `_atlasPreSpiderState`

**`src/styles/app.css`**:
- `.atlas-era-bar` + handles + phase-band gradient (~80 lines added)
- Cluster-popup styling (legacy, kept but unused — could be pruned)
- MapLibre control theming

**`index.html`**:
- Vendored `<link>` for `maplibre-gl.css` + `<script>` for `maplibre-gl.js` + `pmtiles.js`
- `<div id="atlas-pane"><div id="atlas-map"></div></div>` container
- `<body class="nav-collapsed detail-collapsed">` (default-closed panel)
- Sidebar nav glyphs: ☉ ⧖ ▤ ✠ ⚗ ⌖ / ✎ ❖ ⇄ ∴ ≡ / ✦

**`build_data.py`**:
- `geo_for_node()` cascade: raw match → strip trailing parenthetical → strip leading qualifier → comma-separated chunks → last-comma fallback → token fallback (4+ chars)
- Lifted geo coverage 67% → ~85%

**`00_meta/locations.md`**:
- +62 entries (modern countries, compound regions, historical cities, etc.)

**`_assets/`**:
- `basemap/world-z7.pmtiles` (185 MB, gitignored, re-fetchable)
- `vendor/maplibre/` + `vendor/pmtiles/` (committed)
- `vendor/glyphs/Noto Sans Regular/` (10 PBF ranges, ~860 KB committed)
- `vendor/bin/pmtiles` (gitignored CLI)

**`scripts/`**:
- `serve.py` (HTTP server with Range support — PMTiles requires it)
- `fetch-basemap.sh` (reproducible setup; downloads pmtiles CLI + extracts world.pmtiles)

**`start-atlas.command`** (vault root):
- Double-clickable Finder launcher: rebuilds data.js + bumps cache token + opens browser

**Vault content preservation** (early-session rescue):
- 71 new deities from abandoned `ecstatic-noether` worktree
- 18 mods + 1 person (`ashurbanipal`) from abandoned `vibrant-shirley` worktree
- AUDIT/14 design proposal from `epic-moore` worktree
- 9 worktrees + 10 orphan branches deleted after preservation

---

## 🎯 What's next (queued, ranked)

1. **Timeline tab rebuild** — inherits `_atlasJitterScale` curve pattern + the era-range slider. Current Timeline uses hardcoded px values that violate the type-token contract. (Mentioned multiple times by John as "next-up after Atlas".)
2. **Hash-based URL router** — `#/atlas?era=axial&family=mesopotamian` for shareable view+filter state. ~50 lines, critical for the paid-SaaS deep-link/onboarding/SEO use case.
3. **Style preset re-coloring of basemap** — currently basemap colors are resolved at style-build time; switching presets doesn't refresh. Could be a `presetchange` listener that calls `_atlasMap.setStyle(_atlasBuildStyle())`.
4. **Terrain / satellite toggle** — John asked about this early in the session; the user-visible map UI would need a style selector. MapLibre supports raster overlays cleanly.
5. **Great-circle line interpolation** for trails (currently straight lines, which on Mercator misread for long arcs).
6. **Country-centroid → city-precise sweep** in `00_meta/locations.md` (would push geo coverage past current ~85%).
7. **Pantheon retypography** to consume the same shared utilities (motion tokens, --t-* durations) as Atlas's era-slider.

---

## ⚠️ Operational notes

- John is **John** — see `~/.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/user_role.md`.
- **Work directly on `main`.** No worktree branches. See `feedback_work_on_main.md`. This session deleted 9 stray worktrees in cleanup.
- **Commit-discipline:** commit after every surgical edit. Don't accumulate. Multiple parallel agents (sonnet-zoroastrian, sonnet-templar, sonnet-grail-ark, etc.) ran content batches while I worked on app-code; the commit-after-each-edit pattern prevented attribution loss.
- **`start-atlas.command` script** sometimes fails with `forkpty: Device not configured` (macOS PTY exhaustion). Workaround: tell John to open `http://localhost:8742` directly in browser — the server is usually already running. Bookmarking that URL to the Dock is the long-term answer.

---

## 📚 Memory entries to read (in this order, before touching Atlas)

1. `project_atlas_map_v3.md` — full Atlas architecture brief
2. `feedback_atlas_is_map.md` — when John says "map" he means the Atlas tab
3. `feedback_atlas_needs_http_server.md` — never instruct opening via file://
4. `feedback_work_on_main.md` — no worktree branches
5. `feedback_agent_commit_discipline.md` — commit before stopping
6. `feedback_parallel_agent_sweeps.md` — autonomous agents commit your uncommitted work; commit tight cycles
7. `project_premium_saas_shift.md` — Atlas viewer is now framed as a paid product

End of handoff.
