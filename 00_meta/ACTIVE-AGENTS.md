# Active Agents — in-flight work claims

_Hand-maintained. Each agent currently working in the vault appends a claim block before they start, and edits/strikes it when they finish. Read this BEFORE picking a batch so you don't collide._

Format:

```
## [agent-handle] — [scope tag] — started YYYY-MM-DD HH:MM (local)
- Owning: <comma-separated slugs or globs>
- Goal: <one-line>
- Status: in-flight | finished | abandoned
- Last edit: <last file touched>
```

**Archive policy (in effect from `opus-housekeeper-3`, 2026-05-14):** When a session ends, finished claim blocks move to `00_meta/agents-archive/YYYY-MM-DD.md`. The live file carries only: this header, the at-a-glance table, currently-in-flight blocks, and a pointer to the archive. Most-recent finished work stays summarized in the at-a-glance "Last session's finishers" table.

**For new agents:** Read [AGENTS.md](../AGENTS.md) at the vault root for a 60-second onboarding (pre-flight + coordination protocol + canonical-slug + status-file pointers).

---

## 🚦 In-flight claims at a glance (current as of 2026-05-15 — sonnet-zoroastrian-deepen-1 FINISHED)

| Handle | Scope tag | Owns (high level) | Started |
|---|---|---|---|
| `sonnet-zoroastrian-1` | content / Zoroastrian-Jewish transmission deep research | 3 MASSIVE-WIN nodes: theme-zoroastrian-jewish-exchange + theme-paradise-etymology + theme-satan-angra-mainyu-transfer; edge sweeps on 6 existing nodes — **FINISHED 2026-05-15** | 2026-05-15 |
| `sonnet-zoroastrian-deepen-1` | content / Zoroastrian stub deepening | zarathustra.md (full upgrade), tradition-zoroastrianism.md (full body), phase-2-002-gathas-of-zarathustra.md (cosmological-questions + Nietzsche sections), NEW: theme-asha-druj-cosmic-opposition.md — **FINISHED 2026-05-15** | 2026-05-15 |

## sonnet-zoroastrian-deepen-1 — content / Zoroastrian stub deepening — started 2026-05-15 — **FINISHED 2026-05-15**
- Owning: 04_persons/zarathustra.md, 07_traditions/tradition-zoroastrianism.md, 02_documents/_phase-2-axial-age/phase-2-002-gathas-of-zarathustra.md, 06_themes/theme-asha-druj-cosmic-opposition.md (NEW)
- Goal: Deep scholarly upgrade of all 4 Zoroastrian stub nodes; dates dispute, Nietzsche misappropriation, Asha/Druj cosmic opposition, full historical phases
- Status: finished
- Last edit: 00_meta/STATUS.md
| `sonnet-abraham-moses-1` | content / Abraham-Moses gap deep research | 3 new nodes (theme-lex-talionis-covenant-code, event-mitanni-kingdom-c1500-1340-bce, theme-habiru-hebrew-origins) + Amarna Letters edge upgrades — **FINISHED 2026-05-15** | 2026-05-15 |
| `sonnet-abraham-moses-2` | content / Abraham-Moses gap full expansion | 10 new nodes: event-hyksos-period, event-hyksos-expulsion-1550-bce, event-amarna-period-1353-1336, theme-akhenaten-moses-monotheism-thesis, theme-exodus-hyksos-thesis, theme-el-yahweh-merger, theme-baal-set-syncretism, el-shaddai (deity), document-kuntillet-ajrud-inscriptions, ahmose-i (person) — **FINISHED 2026-05-15** | 2026-05-15 |

---

## 🚦 In-flight claims at a glance (previous — opus-symbols-2 merged)

| Handle | Scope tag | Owns (high level) | Started |
|---|---|---|---|
| `sonnet-triage-1` | meta / triage + coordination (TEMPORARY — read-only session) | Diagnosed opus-foundation-1 failure; reverted broken app.js + app.css; tagged checkpoint; wrote HOW-TO-OPEN.md; updated ACTIVE-AGENTS | 2026-05-15 02:45 |
| `sonnet-foundation-2` | app-code / floating-panel layout pivot | nav + detail as frosted-glass position:fixed overlays; full-bleed canvas; SVG cleared by panel widths; atlas zoom-meter wired; dot-center marker fix | 2026-05-15 03:00 |
| `sonnet-themes-1` | content / theme nodes + deity fills | 6 theme nodes + 10 deity fills (batches a/b/c) — satan-christian expanded, serpent-dual-nature, Slavic/Baltic/Celtic/Hindu/Daoist fills — **FINISHED 2026-05-15** | 2026-05-15 |
| `sonnet-lusiadas-1/2` | content / Portuguese mythological spine | 12 new nodes (Os Lusíadas, Camões, Adamastor, Inês de Castro, Luís de Camões, Vieira, Henry the Navigator, Prester John, Endovélico, Nabia, tradition-lusitanian-religion, theme-heroes-paradise-island) + 2 Alchemy presets (portuguese-mythological-spine, templar-survival-portuguese) — **FINISHED 2026-05-15** | 2026-05-15 |
| `sonnet-templar-1` | content / Templar hardcore roots + Portuguese geo-wiring | 6 new nodes (event-battle-of-hattin-1187, tradition-hashshashin, wolfram-von-eschenbach, theme-holy-grail, baphomet, dinis-i-portugal) + Alchemy preset (templar-hardcore-roots) + 15 geo entries in locations.md + region-field geo-wiring on 7 Portuguese nodes — 1916 nodes · 11549 edges — **FINISHED 2026-05-15** | 2026-05-15 |

## sonnet-themes-1 — content / pantheon theme batch — started 2026-05-15
- Owning: 06_themes/cosmic-body-cosmogony.md, 06_themes/divine-twins.md, 06_themes/messianic-future-savior.md, 06_themes/mother-and-child-iconography.md, 06_themes/feminine-solar.md, 06_themes/apocalyptic-thunderer-vs-serpent.md, 03_deities/the-dioskouroi.md, 03_deities/romulus.md, 03_deities/kalki.md, 03_deities/muhammad-al-mahdi.md
- Goal: Add 6 cross-tradition theme anchors + 4 deity fills; wires existing deity cluster into theme graph
- Status: finished
- Last edit: 00_meta/STATUS.md

**⚠️ opus-foundation-1 — ABANDONED (reverted 2026-05-15 ~02:45)**
The floating-panel pivot was left uncommitted and partially broken. Changes have been **discarded** via `git restore src/js/app.js src/styles/app.css`. The working tree is clean at `checkpoint-map-v2-working` (git tag). See audit below before any new agent picks this up.

**Last session's finishers (full claim blocks in [`agents-archive/2026-05-14.md`](agents-archive/2026-05-14.md) for prior batches; this session's claim block below):**

| Handle | Scope | What landed |
|---|---|---|
| `opus-design-6` | app-code / Alchemy utility tools (4 layouts + spacing slider) | 4 layout modes in toolbox — Force (∿) organic, Linear (─) chronological timeline type-banded, Circular (○) single ring, Radial (◎) picks-center bridges-outer. Spacing slider ⇿ 0-100 tunes all layouts. Layout + spacing persist in localStorage. New `alchemyLayoutPositions()` helper computes positions; non-force modes pin nodes via `fx/fy`. Cache-bust `?v=20260515-design-6-layouts`. |
| `opus-design-5` | app-code / Alchemy presets dropdown + save trees + discreet side-tab | Presets moved from left pane (which hid behind expanded nav) to upper-right dropdown; save/load/delete custom user trees via `localStorage` (key `alch-custom-trees-v1`); inline name-input pattern with ↩/esc; new `findPresetOrTree()` resolver unifies canonical + custom code paths. Side-tab redesigned from 18×64 chunky tab to 16×16 chevron at top-of-nav, 45% opacity until hover. Cache-bust `?v=20260515-design-5-dropdown`. |
| `opus-design-4` | app-code / Alchemy Presets pane v1 (superseded by opus-design-5) | First version: left-side `.alch-presets-pane` with sticky-head pattern + 10 canonical cross-tradition presets + Pantheon legend back-fit + `<body class="nav-collapsed">` default. UI was correct in mechanics but hid behind nav when expanded — opus-design-5 reworks the surface. The 10 presets data structure carries over. |
| `opus-map-1` | app-code / Atlas Map rebuild (DESIGN LEAD) | MapLibre GL + offline PMTiles vector basemap rewrite of `VIEWS.atlas`; 964 DOM markers with degree-tier LOD; hover-trail GeoJSON line layer; premium minimalist token-driven basemap style; `scripts/serve.py` HTTP Range server for local dev; `scripts/fetch-basemap.sh` reproducible setup; retires opus-design-3 SVG atlas |

**Last session's finishers (full claim blocks below, will be archived in the next session-close housekeeper sweep):**

| Handle | Scope | What landed |
|---|---|---|
| `opus-symbols-3-serpent` | content / cross-tradition serpent expansion (2026-05-15) | **4 NEW symbol nodes** — `naga-serpent` (Hindu/Buddhist/Jain multi-headed cobra: Shesha/Mucalinda/Vasuki/Kaliya/Parshvanatha + SE-Asian Angkor), `uraeus` (Egyptian Wadjet pharaonic cobra → Faravahar transmission), `feathered-serpent` (Mesoamerican Quetzalcoatl/Kukulkan/Q'uq'umatz unified iconographic complex, Olmec→Mexica 2,700-year span), `nehushtan` (Hebrew bronze-serpent → John 3:14 Christological typology + 2 Kings 18 internal-polemic-inversion). Plus +14 reciprocal edges back onto the 5 existing serpent-cluster symbols. Serpent cluster now **9-node densely-connected** (5 → 9 nodes; many new polemic-inversion edges across traditions). Vault state: 1866 → 1870 nodes, 11,393 edges, 3.2% dead-link ratio. 3/4 new symbols have Wikipedia thumbs (nehushtan needs curated depictions follow-up). |
| `opus-symbols-2` | content + app-code / Symbols-map next-level | Cross-symbol-edge density 140 → **324** (+130%) across all 56 symbols on 8 transmission spines (cross-family + solar/astral + serpent + tree/eucharist + Vedic-Buddhist + geometric/Hermetic + Persian/Zoroastrian + animals/Hebrew-flood); **55/56 symbol thumbnails** wired into side-tab via `fetch_thumbnails.py` OVERRIDES + curated `depictions:` schema-and-renderer hook |

**Last session's finishers (full claim blocks in [`agents-archive/2026-05-14.md`](agents-archive/2026-05-14.md)):**

| Handle | Scope | What landed |
|---|---|---|
| `opus-housekeeper-3` | meta / archive + slim | Created `agents-archive/2026-05-14.md` with all 24 finished claim blocks; rewrote this file slim (1548 → ~95 lines); refreshed at-a-glance |
| `opus-design-3` | app-code / Maps view (DESIGN LEAD) | New top-level Atlas world-map view: 949 geo-tagged nodes, equirectangular projection, 6-preset era window, hub-only/all/off label modes, hover-trails, tier-overlay inheritance, d3.zoom pan/zoom |
| `opus-flood-1` | content / cross-tradition Flood wedge | Mesopotamian + Hebrew + Greek + Vedic + Chinese + Norse + modern reception + Black Sea Deluge hypothesis |
| `opus-monuments-1` | content / Pantheon Monuments mode | 23 monument-tagged event-site nodes (15 retrofits + 8 new: kaaba, hagia-sophia, chartres, borobudur, angkor-wat, parthenon, karnak, mahabodhi) |
| `opus-zoroastrian-1` | content | Zoroastrian deities (Ahura Mazda strengthened, Ahriman, Amesha Spentas, aeshma, atar, asha-vahishta, druj, sraosha, verethragna, saoshyant, yima-jamshid) + symbols + Magi |
| `opus-symbols-1` | content / symbols-map | Cross-tradition iconographic transmission gold-zone (aum-om, dharmachakra, menorah, monas-hieroglyphica, star-of-ishtar + 6 more) |
| `opus-design-2` | app-code / Source-Integrity-Tier overlay | 5 tier color tokens, `FEATURES.tierOverlay`, `_tier` per node, `[data-tier]` across 5 render paths, side-nav toggle, `.tier-legend` popover. **96% T1-sourced** vault now visible at a glance |
| `opus-housekeeper-2` | meta / git bootstrap | User-authorized `git init` + `.gitignore` extended + `AUDIT/12` updated to credit `opus-infra-1` + standing-recs status-tracked |
| `opus-infra-1` | meta / **silent — never registered (protocol gap, see AUDIT/12 §3.10)** | `git init` first commit + extended `build_dashboard.py` to surface AUDIT proposals + added `lint_yaml.py` + filled empty `tradition-slavic` stub |
| `opus-housekeeper-1` | meta / vault hygiene | At-a-glance table, AUDIT renumber (10→11), [`AGENTS.md`](../AGENTS.md), README refresh, Obsidian config |
| `opus-design-1` | app-code / architecture pass (DESIGN LEAD) | New [`00_meta/app-architecture.md`](app-architecture.md) — load-bearing rules doc; type/motion tokens; component primitives; Twilight `--serif: Inter` bug fix; `:focus-visible` utility; `FEATURES` flag pattern |
| `opus-ethiopian-4` | content / Ethiopian-canonical extras | 5 docs + 2 persons + 10 figures incl. **gilgamesh-nephilim** MASSIVE-win (Bronze-Age Sumerian Gilgamesh epic → Aramaic Book of Giants → Manichaean → Ethiopian-canonical 1 Enoch) |
| `opus-hellenic-3` | content / mystery-cult capstone | Eleusinian event, Iacchus, Triptolemus, eleusinian-mystery-revelation theme, Apuleius, Bk 11, Euripides, Aeschylus, Bacchae, Oresteia |
| `opus-gaps-1` | content / dead-link closure | tradition-syriac-orthodox, tradition-armenian-apostolic, dioscorus-of-alexandria, severus-of-antioch, jacob-baradaeus, shenoute, melchizedek, hagiography, tewahedo-christology, ethiopian-systematic-theology + 6 Buddhist follow-ups |
| `opus-mysteries-1` | content / Mystery Cults | Eleusinian / Dionysian / Mithraic / Isis / Cybele-Attis tradition nodes + 13 metadata-tier nodes |
| `opus-ethiopian-3` | app-code / Scripture-view Ethiopian corpora | Kebra Nagast + Ethiopic Tewahedo Canon corpora wired into Scripture tab |
| `opus-scripture-2` | app-code / Scripture-view corpora | Hermetica + Nag Hammadi + Quran corpora wired (232 entity-instances across 30 hulls) |
| `opus-ethiopian-2` | content / Ethiopian-canonical figures | Watchers (5) + Enochic archangels (3) + Parables divinities (2) + Jubilees figures (2) + pre-Christian Aksumite pantheon (5) + Meqabyan trio (3) |
| `opus-hermetic-1` | content / Corpus Hermeticum deepening | 18 nodes — 5 documents (CH XIII, Stobaean Kore Kosmou, Armenian Definitions, NHC VI,7, NHC VI,8) + 8 persons + 3 themes + 2 events |
| `opus-hellenic-2` | content / Greek+Egypt long-tail | Milesian pre-Socratics, Orphic primary documents, Hestia/Eros/Heracles, Cleopatra VII, Founding-of-Alexandria event arc |
| `opus-mystical-1` | content / Mystical wedge | Ritman / Beinecke-Mellon axis — 32 nodes incl. alchemical-Hermetic spine + Renaissance illustrated-alchemy + Voynich + Christian mystic women + Rhineland mystics |
| `opus-hellenic-1` | content / Greek+Egypt deepening | 28 nodes — classical & Hellenistic transmission spine (Manetho/Plutarch/Diodorus/Herodotus + Theban-triad cluster + Orphic primordial layer + Imhotep-Ptolemy-Empedocles) |
| `opus-templar-1` | content / Templars | 25 nodes — Templars/Hospitallers/Teutons + Crusades + Bernard/Payens/Molay + Latin Rule + Chinon Parchment + Templar-Gnostic-transmission-hypothesis |
| `opus-ethiopian-1` | content / Ethiopian Christianity wedge | 37 nodes — Tewahedo/Coptic/Oriental-Orthodox + Frumentius/Ezana/Nine-Saints/Lalibela + Garima Gospels/Mashafa-Henok/81-book-canon |
| `opus-scripture-1` | app-code / Scripture view | New top-level Maps view: Holy Bible corpus wired with 27 book-islands across 9 sections in compositional time-order |
| `opus-islam-1` | content / Islam wedge | 30 nodes — pre-Islamic Arabia (Hubal, al-Uzza, Manat, Wadd, Nasr) + falsafa Aristotle-transmission spine (al-Kindi, al-Farabi, ibn-Sina, ibn-Rushd) + sira/hadith + Ibn Taymiyya |
| `opus-buddhist-1` | content / Buddhism wedge | 30 nodes — Theravāda + Pure Land + Greco-Buddhist tradition + 10 persons (Aśoka, Menander I, Kanishka) + 7 documents (Dhammapada, Milindapañha, Aśokan Edicts) + 5 events + 5 themes |

**Build state at session close:** **1767 nodes** · **3.5% dead-link occurrence ratio** · **10,561 edges** · **5+ commits in local git, NO remote**.

**Convention reminder:** vault-content batches do not collide because each owns a distinct slug list. App-code batches do not collide with content batches. Meta-coordination batches (`opus-housekeeper-N`) do not touch any vault content node, app-code file, or in-flight slug — only `AUDIT/`, `README`, `AGENTS.md`, Obsidian config, `.gitignore`, and the header sections of the registry files. Pick a non-overlapping wedge, **append your claim block here AND a row in the table above before starting** (`opus-infra-1` skipped registration — see [`AUDIT/12`](../AUDIT/12_meta-audit-housekeeping.md) §3.10). **App-code agents:** also read [`00_meta/app-architecture.md`](app-architecture.md) — the load-bearing rules doc for `app.js` / `app.css`.

---

## opus-symbols-2 — Symbols-map next-level (densify + imagery) — started 2026-05-15 ~00:00 — **FINISHED 2026-05-15 ~02:10**

- **Owning:** all 56 files in `09_symbols/*.md` (frontmatter `cross-symbol-edges` densification + one new `depictions:` entry on haoma.md); `build_data.py` (one-line passthrough so `depictions` reaches the JS layer); `src/js/app.js` (side-tab thumb prefers `depictions[0]` when present, falls back to `n.thumbnail`); `fetch_thumbnails.py` OVERRIDES extended with 56 symbol-slug→Wikipedia-article mappings.
- **Delivered:** Cross-symbol edges 140 → 324 (+131%). All 56 nodes at ≥3 edges. 55/56 symbol thumbnails via fetch_thumbnails.py OVERRIDES. Curated haoma `depictions:` covers the one Wikipedia gap. MASSIVE-win demos enabled (cross-is-older-than-Christianity / lotus-Egypt-India-Christianity / swastika-with-discipline each now carry 6-9 edges). 6 new symbol nodes deferred to opus-symbols-3.
- **Status:** finished
- **Last edit:** this close-out block + STATUS.md headline + at-a-glance table.

---

## opus-housekeeper-3 — Per-session archive of finished claim blocks (NO vault-content / NO app-UI edits) — started 2026-05-14 ~22:45 — **FINISHED 2026-05-14 ~22:55**

- **Mission (user-authorized after confirming all agents stopped):** archive the 24 FINISHED claim blocks from this session into `00_meta/agents-archive/2026-05-14.md` so the live `ACTIVE-AGENTS.md` stays scannable for the next agent. Per-agent claim-file split + `build_agents.py` rollup (`AUDIT/12` §3.2) was the original deferred plan; the archive approach is a simpler intermediate that captures most of the scannability win without the build-pipeline change.
- **Owning (NO vault content, NO app code, NO methodology / schema policy):**
  - **NEW:** `00_meta/agents-archive/` directory + `00_meta/agents-archive/2026-05-14.md` (1525 lines — full content of all 24 finished claim blocks from the 2026-05-14 session, with a session-summary header).
  - **REWROTE:** this file from 1548 lines → ~95 lines (header + at-a-glance + 24-row last-session-finishers summary table + this claim block + archive pointer). Empty in-flight section because all agents stopped.
  - Touch points only: `AGENTS.md` (point at archive convention), `STATUS.md` (headline entry).
- **Explicitly NOT doing:**
  - **No per-agent claim-file split** (`AUDIT/12` §3.2) — the archive achieves most of the scannability win without the build-pipeline change. Defer §3.2 until contention pain returns at 5+ truly-parallel-write agents.
  - **No vault content nodes / no app code / no schema** (same scope-discipline as `opus-housekeeper-1` and `opus-housekeeper-2`).
- **Coordination notes:**
  - All agents stopped per user directive ("ive just asked ALL agents to close their session"); zero in-flight as of audit.
  - Two stale "Status: in-flight" lines at original (now archived) locations of `opus-buddhist-1` and `opus-gaps-1` — both have FINISHED-block updates appended later in the same archive (correct status visible at the archive's later block for the same handle).
- **Delivered:**
  - **`00_meta/agents-archive/2026-05-14.md`** (NEW, 1525 lines) — every finished claim block from this session preserved verbatim, plus a session-summary header documenting the 25-batch session.
  - **`00_meta/ACTIVE-AGENTS.md`** rewritten from 1548 lines → ~95 lines.
  - **Two untracked design-handoff files committed**: `00_meta/HANDOFF-design-3.md` (opus-design-3's frontend handoff) and `AUDIT/13_session-handoff-frontend-2026-05-14.md`.
  - **`AGENTS.md`** updated with the new archive convention (one-line note in the coordination protocol).
  - **`STATUS.md`** headline entry for `opus-housekeeper-3`.
- **Build state after batch:** unchanged content (1767 nodes / 3.5% dead-link / 10561 edges). **Repo state:** 6 commits at vault root after this batch; NO REMOTE.
- **Open gaps for follow-up agents:**
  - `opus-housekeeper-4` (when needed): per-agent claim-file split + `build_agents.py` rollup (`AUDIT/12` §3.2) — only worth it if 5+ truly-parallel-write agents become routine.
  - `opus-housekeeper-4` (any session): pre-commit hook running `lint_yaml.py --strict && build_dashboard.py` (`AUDIT/12` §3.9) — ~10 lines of shell.
  - `opus-housekeeper-4` (any session): 35 file-stem-vs-yaml-id drift warnings flagged by `lint_yaml.py` — needs a one-line decision on which form is canonical, then scriptable in 5 min.
  - `opus-design-4`: see `00_meta/HANDOFF-design-3.md` open queue (tier-legend Atlas-aware count, great-circle Atlas trails, Pantheon-detail-panel-closed-on-init bug from `AUDIT/13`).
  - **Content agents:** read AGENTS.md, then DASHBOARD's "Open AUDIT proposals" section (`opus-infra-1` extension), then pick from the priority queue.
- **Status:** finished
- **Last edit:** this claim block (close-out) + final `git commit`.

---

**Older sessions' archives:** [`agents-archive/`](agents-archive/) (one file per session-date, in chronological order).

---

## opus-map-1 — Atlas Map rebuild (MapLibre GL + offline PMTiles) — started 2026-05-15 01:20 — **FINISHED 2026-05-15 ~02:00**

- **Mission (user-authorized, "premium SaaS bar"):** Replace the SVG/equirectangular Atlas view (opus-design-3) with a MapLibre GL JS + offline PMTiles vector-tile map. **John reframed the app as a paid subscription product on 2026-05-15** — every decision in this batch cleared a higher polish bar than vault-content work does. See `~/.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/project_premium_saas_shift.md`.

- **What landed (app-code only — no vault content touched):**
  - **`index.html`** — vendor `<link>` for `maplibre-gl.css` + `<script>` tags for `_assets/vendor/maplibre/maplibre-gl.js` + `_assets/vendor/pmtiles/pmtiles.js` loaded before `app.js`. New nested `<div id="atlas-pane"><div id="atlas-map"></div></div>` container alongside `<svg id="svg">` (outer wrapper owns positioning because MapLibre overrides `position: relative` inline on its own container). Cache-buster `?v=20260515-map-1` on CSS + JS.
  - **`src/js/app.js`** —
    - Added `FEATURES.atlasMapV2: true`. Removed retired `FEATURES.atlasMap` flag.
    - New shared utility `tierVisibilityThreshold(tier, k, mode)` — degree-tier visibility curves shared by Atlas (and Timeline once it inherits).
    - Updated `setView()` to toggle `#atlas-pane` ↔ `#svg` visibility on view enter/exit.
    - Replaced ~250 lines of SVG/equirectangular `VIEWS.atlas` (lines 4079–4329 pre-edit) with ~330 lines of MapLibre-backed implementation:
      - Module-scoped persistent map instance (init once, reused across atlas visits — preserves zoom/pan state).
      - `_atlasRegisterProtocol()` registers `pmtiles://` source protocol via the PMTiles JS adapter.
      - `_atlasBuildStyle()` synthesizes a MapLibre style spec at render time, reading `--bg-0` / `--bg-1` / `--bg-2` / `--border` / `--border-soft` / `--gold` from CSS tokens so the basemap palette tracks the active preset.
      - 7-layer style: `bg` → `earth` → `landcover` → `natural` → `water` → `boundaries-country` → `boundaries-region`. No text labels (premium minimalism — vault nodes carry the only labels).
      - Each node renders as a DOM marker (`.atlas-marker` with `.atlas-marker-dot` + `.atlas-marker-label`) styled by tier (`tier-0..3`, `.hub` for tiers 0–1). 964 markers in the current build.
      - Hover trails as a single `atlas-trails` GeoJSON line source; `_atlasShowHoverTrails(id)` rebuilds the FeatureCollection per hover; `_atlasHideHoverTrails()` clears.
      - LOD via `_atlasUpdateLOD()` (cheap, every zoom frame — opacity by tier) + `_atlasDeclutter()` (expensive, only on `zoomend`/`moveend` — bbox claim by degree, hides overlaps via `.hidden-by-declutter`).
      - View controls preserved: era-window `<select>` (6 presets), labels toggle (off / hub / all), recenter (easeTo).
      - MapLibre `NavigationControl` (zoom +/-) and `AttributionControl` (OSM credit) added.
      - `ResizeObserver` on the pane keeps `map.resize()` called when the canvas changes (side-panel toggle, window resize).
  - **`src/styles/app.css`** — replaced the old `.atlas-*` SVG block (lines 1263–1331 pre-edit) with the MapLibre overlay system:
    - `.atlas-pane` — positioning wrapper.
    - `.atlas-marker` / `.atlas-marker-dot` / `.atlas-marker-label` — three-role font stack (serif label, dot via CSS custom-prop `--dot-color` + `--dot-size`).
    - Tier-based label weight (`tier-0` → 600, `tier-1` → 500, `tier-2/3` → 400). `.hub` promotes font-size from `--micro` to `--lbl-md`.
    - Hover/hot states: gold ring on dot, gold label color, 1.15× scale.
    - `.atlas-dim` for non-neighbor markers during hover.
    - `.hidden-by-declutter` for bbox-conflict suppression.
    - MapLibre control theming via `.atlas-map .maplibregl-ctrl-*` — buttons, attribution, group borders all driven by our `--bg-*` / `--border` / `--gold` / `--mono` tokens.
    - Empty-state card (`.atlas-empty-card` headline + sub) matching Scripture's empty-state pattern.
  - **`_assets/vendor/maplibre/maplibre-gl.js` + `maplibre-gl.css`** — vendored MapLibre GL JS v5.24.0 (~1.1 MB total, COMMITTED).
  - **`_assets/vendor/pmtiles/pmtiles.js`** — vendored PMTiles JS v4.4.1 (~20 KB, COMMITTED).
  - **`_assets/vendor/bin/pmtiles`** — go-pmtiles CLI v1.30.2 macOS-arm64 binary (~55 MB, **GITIGNORED**, re-fetchable via `scripts/fetch-basemap.sh`).
  - **`_assets/basemap/world-z7.pmtiles`** — z0-z7 world extract from Protomaps daily build 2026-05-14 (185 MB, **GITIGNORED**, re-fetchable). z7 is city-block resolution — perfectly sufficient for our 149 unique vault locations (mostly ancient cities/regions).
  - **`scripts/fetch-basemap.sh`** — reproducible setup: detects OS/arch, downloads pmtiles CLI, resolves latest valid Protomaps daily build (walks back up to 14 days if today isn't built yet), extracts z0-z7. ~10 minutes one-time per repo clone.
  - **`scripts/serve.py`** — local dev static server with **HTTP Range support**. Python's stdlib `http.server` doesn't support Range requests, which PMTiles requires (byte-range reads from a single `.pmtiles` file). This wraps `SimpleHTTPRequestHandler` with proper 206 Partial Content responses. ~95 lines, dev-only — production deploys (Vercel/Cloudflare Pages/R2+CloudFront) all support Range natively.
  - **`.claude/launch.json`** — updated to invoke `scripts/serve.py` instead of `python -m http.server`.
  - **`.gitignore`** — extended with `_assets/basemap/*.pmtiles` + `_assets/vendor/bin/`.

- **Premium-feel design decisions made this batch:**
  - **Basemap has zero text labels.** Bloomberg/Stripe/Linear-style restraint. Vault nodes carry all label hierarchy. Side benefit: no PBF glyph fonts needed → smaller offline footprint.
  - **Vendored deps, not CDN.** Per the premium-SaaS posture: third-party CDN is a single point of failure for paid products.
  - **DOM markers, not native MapLibre symbols.** Lets us use our existing `--serif` / `--mono` / token color system directly via CSS — would otherwise need PBF glyphs baked into a vendor directory. 964 markers is well within DOM-positioning performance budget.
  - **Map instance persists across view changes.** Init cost (~150ms) only paid once per session; subsequent atlas visits reuse the same map and only refresh markers.

- **Verified (browser preview, 1440×900 desktop viewport):**
  - Basemap renders: country borders, water/ocean, regional boundaries all visible in the muted token palette.
  - 964 markers placed accurately at lat/lon; 49 hub-tier (top 5%) labels visible by default.
  - Hover trails: gold lines connecting the hovered node to neighbors via the atlas-trails GeoJSON source.
  - Tooltip shows title + meta + date range; non-related markers dim, related ones go hot.
  - View switching atlas ↔ pantheon ↔ atlas works: pane shows/hides cleanly, markers re-render on re-entry, MapLibre instance kept alive.
  - MapLibre nav control (+/-) and attribution control render in our token palette.

- **Explicitly NOT doing this batch (deferred — open gaps for follow-up agents):**
  - **Hash-based URL router** for deep links (`#/view/atlas/era=axial` shape). ~50 lines, ~1 hour. Critical for the SaaS deep-link / SEO / onboarding use case. Goal: any view-and-filter state encodable in the URL, restorable on reload, shareable. **Priority follow-up #1 for `opus-router-1`.**
  - **Style-preset consolidation** (13 → 3 hero). User picked "defer presets, one neutral map for now" path on 2026-05-15. The Map currently uses the active preset's CSS-token values to color the basemap (resolved at style-build time), but presets aren't yet rebuilt as marketing identities. **`opus-presets-1` follow-up batch.**
  - **Font loadout cut** (6 → 3 families) — design-3 open queue item #9. Touches every preset; too invasive for mid-Map-rebuild. **`opus-design-4` follow-up.**
  - **Timeline retypography + shared zoom-meter migration** — Timeline's hardcoded px values (`9.5 / 12 / 10 / 8.5`) violate the type-token contract. The shared `tierVisibilityThreshold` utility I added is ready for Timeline to consume. **`opus-timeline-1` follow-up — the user explicitly flagged Timeline as next-up after Map.**
  - **Great-circle trail interpolation** — current trails are straight lines (which on a Mercator-ish projection cross seas at unnatural angles for Aksum-Cordoba etc.). Bezier or geodesic interpolation in `_atlasShowHoverTrails`. ~20 lines. Polish.
  - **Live preset re-coloring** — when the user switches presets while on Atlas, the basemap doesn't recolor (style was built at the previous preset's token values). Fix: subscribe to a "preset changed" event and call `_atlasMap.setStyle(_atlasBuildStyle())`. ~10 lines.
  - **Auth, billing/Stripe, account management, iPhone PWA, service worker** — all out of scope until John flags.
  - **`transmissionFlow` / `threadsView`** — design-3 queue items #10–11, still flagged off.

- **Coordination notes:**
  - The map-thumbnail (bottom-right of Pantheon/Documents/Timeline) uses `geoToMap` + `CONTINENT_OUTLINES` — those helpers stay intact at app.js:391–426. Only the old `VIEWS.atlas` callsite was retired.
  - `STATE.atlasEra` and `STATE.atlasLabelMode` are unchanged in shape — any URL router built later can read them directly.
  - The map instance is exposed indirectly through the closures in `VIEWS.atlas.render()`. If a follow-up agent needs to expose it on `window` for cross-view orchestration, do it via a `window._atlasMap = _atlasMap` line near the init.

- **Status:** finished
- **Last edit:** this claim block close-out + cleanup of stale `FEATURES.atlasMap` flag.

---

## sonnet-triage-1 — Session triage + coordination — started 2026-05-15 ~02:45 — **FINISHED**

- **Model:** Claude Sonnet 4.6 (not Opus — cheaper triage model, read-mostly session)
- **Role:** TEMPORARY. This is not a content or feature agent. John asked for a status check after opus-foundation-1 got stuck and left the site broken. I am a one-session diagnostic and stabilization agent.

### What I found

**opus-foundation-1 was in-flight and uncommitted.** Its changes to `src/js/app.js` and `src/styles/app.css` implemented a floating-panel layout pivot (grid → position:fixed panels with backdrop-blur) but were never committed. The working tree had these changes sitting loose, breaking:
- Pantheon SVG sizing (old `width:100%; height:100%` rule removed; replacement `position:absolute; width:auto` has edge cases on SVG elements in some browsers)
- ResizeObserver no longer fires on panel toggle (canvas is now always full-bleed; panel collapse doesn't resize it)

**opus-foundation-1's scope was also incomplete.** It claimed: era-range slider, STATE.atlasEra→STATE.eraWindow rename, per-view geometry tuning. None of those were done. Only the layout pivot was partially applied.

### What I did

1. **Tagged git checkpoint** — `checkpoint-map-v2-working` on commit `00a2630`. This is the safe revert point: all views working, MapLibre atlas working, Pantheon working. **Future agents: if anything breaks, `git checkout checkpoint-map-v2-working -- src/js/app.js src/styles/app.css` restores the last known-good app code.**
2. **Reverted broken uncommitted changes** — `git restore src/js/app.js src/styles/app.css`. App is now back to the checkpoint state.
3. **Fixed `.claude/launch.json` paths** — the launch.json in the worktree had a stale path to a deleted worktree. Fixed both copies.
4. **Updated ACTIVE-AGENTS.md** (this file) — marked opus-foundation-1 as abandoned, registered myself.
5. **Created `HOW-TO-OPEN.md`** at the vault root — plain-English, no terminal knowledge required. John is non-technical and needed a step-by-step to open the app.

### Key findings for future agents (READ THIS)

**Workflow constraint — John cannot run dev servers himself.** He needs a double-clickable launcher (`start-atlas.command` exists for this) and a plain-English guide. Any changes to the server port, start command, or URL must be reflected in `HOW-TO-OPEN.md` at the vault root.

**Chrome extension is NOT required for app development.** `Claude in Chrome` is only for agent-internal visual verification. The app itself is browser-agnostic (HTML/CSS/JS, no Node runtime). John opens it in any browser at `http://localhost:8742`. Agents can develop without Chrome extension; they just need to test via code analysis or ask John to verify in his browser.

**The floating-panel layout pivot (opus-foundation-1) is a valid direction but needs to be done properly.** If a future `opus-foundation-2` picks this up, the key bugs to fix before committing are:
  1. Give `svg#svg` explicit `width: 100%; height: 100%` within its absolutely-positioned container (not `width:auto; height:auto`) so `clientWidth`/`clientHeight` are reliable for d3.
  2. Switch `_canvasResizeObs` to observe `svg#svg` instead of `#canvas` (canvas never resizes in full-bleed layout).
  3. Remove stale `body.footer-collapsed { grid-template-rows: 1fr 0px; }` rule.
  4. Test ALL five SVG views (Pantheon, Timeline, Documents, Alchemy, Scripture) before committing — not just Atlas.

**Git versioning is now in place** (since opus-housekeeper-2 on 2026-05-14). Use `git tag -a <name> -m "<reason>"` to mark checkpoints after each major batch. There is NO remote; git is local-only.

**The serve.py server must be running for the app to work.** It provides HTTP Range support for the PMTiles basemap. Python's built-in server (`python -m http.server`) will NOT work — the Atlas map will be blank.

### Current vault state (at triage close)

- **1767 nodes** · **10,561 edges** · **3.5% dead-link ratio**
- Git tag `checkpoint-map-v2-working` = last known-good state
- `app.js` + `app.css` reverted to that checkpoint
- All views functional: Pantheon ✓, Atlas (MapLibre) ✓, Timeline ✓, Scripture ✓, Documents ✓, Alchemy ✓

### What is NOT done (open for next agents)

The things opus-foundation-1 claimed but never started are all still open:
- Hash-based URL router (`opus-router-1`) — #1 priority per prior sessions
- Era-range slider replacing era `<select>` dropdowns
- Timeline retypography (`opus-timeline-1`)
- Floating-panel layout pivot (if still desired — `opus-foundation-2`)

- **Status:** finished
- **Last edit:** this claim block + `HOW-TO-OPEN.md` creation + git tag + revert.

---

## sonnet-foundation-2 — app-code / floating-panel layout pivot — started 2026-05-15 ~03:00 — **FINISHED**

- **Model:** Claude Sonnet 4.6
- **Mission:** Implement the premium floating-panel layout (nav + detail panels as frosted-glass overlays over a full-bleed canvas). Second attempt after `opus-foundation-1` was abandoned; triage analysis from `sonnet-triage-1` used as the implementation guide.

### What landed (app-code only — no vault content touched)

- **`src/styles/app.css`:**
  - Added panel design tokens to `:root`: `--panel-bg`, `--panel-blur`, `--panel-shadow`, `--panel-edge`.
  - Replaced `body { display: grid ... }` with `body { position: relative; height: 100vh; width: 100vw; }`. Removed all `grid-template-columns/rows/areas` rules from body and collapsed variants. Removed stale `body.footer-collapsed { grid-template-rows: 1fr 0px; }` rule.
  - `main.canvas` → `position: fixed; inset: 0; z-index: 1` (full-bleed canvas). Added `body.view-atlas` background override.
  - `main.canvas > svg#svg` → `position: absolute; top/bottom: 0; left: var(--nav-w); right: var(--detail-w)` — SVG occupies panel-cleared area. Collapsed variants adjust left/right. `map-thumb svg` keeps its own 100% rule.
  - `nav.side` → upgraded to `position: fixed; z-index: 150; background: var(--panel-bg); backdrop-filter: var(--panel-blur)`. Width-based collapse transition replaces old transform-based transition.
  - `aside.detail` → removed `grid-area: detail`. Now `position: fixed; right: 0; z-index: 150; width: var(--detail-w)` with backdrop-blur. Added `body.detail-collapsed aside.detail` width rule.
  - `.view-header` → now `left: calc(var(--nav-w) + 24px); right: calc(var(--detail-w) + 24px)` with transition and collapsed variants. Zoom-visible override accounts for both panels.
  - `.zoom-meter` → `right: calc(var(--detail-w) + 24px)` with panel tokens + collapsed variant.
  - `.map-thumb` → `right: calc(var(--detail-w) + 14px)` with panel tokens + collapsed variant.
  - `.legend` → `left: calc(var(--nav-w) + 24px)` with panel tokens + nav-collapsed variant.
  - Footer and themes-menu / style-menu already had correct `left/right: var(--nav-w/detail-w)` rules — verified intact.

- **`src/js/app.js`:**
  - Split `showMap` → `showMapThumb` (pantheon/documents/timeline/alchemy/scripture) + `showZoomMeter` (showMapThumb OR atlas). Atlas now shows the zoom meter.
  - Atlas marker dot-center anchor: `dotOffsetX = -(parseFloat(dotSize) / 2)` so the dot center (not row left edge) anchors at the coordinate.
  - Removed `maplibregl.NavigationControl` add (unified zoom-meter replaces it).
  - Added `_atlasUpdateZoomMeter()` function — reads `_atlasMap.getZoom()`, computes a 2× multiplier relative to zoom 1.6 baseline, writes to `#zm-readout`.
  - Updated atlas zoom handler: `_atlasZoomHandler = () => { _atlasUpdateLOD(); _atlasUpdateZoomMeter(); }`.
  - Wired `#zm-in` / `#zm-out` / `#zm-reset` buttons to MapLibre `zoomIn()` / `zoomOut()` / `easeTo()`. Called `_atlasUpdateZoomMeter()` on setup.
  - `_canvasResizeObs` now observes `svg#svg` (not `#canvas`) so panel-toggle CSS transitions — which change the SVG's effective width — still trigger Timeline re-renders.

### Verified (code analysis)

- `node --check src/js/app.js` — passes, no syntax errors.
- All 5 SVG views (Pantheon, Timeline, Documents, Scripture, Alchemy) read `svg.node().clientWidth` — correct from `position:absolute; left/right/top/bottom` constraints.
- No `grid-area`, `grid-template-columns`, or stale `grid-template-rows` remaining on body/canvas/detail.
- No `NavigationControl` remaining in app.js.

- **Status:** finished
- **Last edit:** commit — `src/js/app.js` + `src/styles/app.css` + `00_meta/ACTIVE-AGENTS.md`.
