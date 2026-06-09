# Alphabets Page — Plan & Ideas (V2 viewer)

> **Status:** PLANNING ONLY. Nothing in this doc is implemented. Author: planning agent, 2026-06-10.
> **Scope of this doc:** a thorough design + phased build plan for a NEW "Alphabets" page in the V2 viewer shell. Legacy `_legacy/*` and `src/js/alphabets/*` are **reference only** (see §2 KEEP/DISCARD/RETHINK). The deliverable is this doc; the main agent commits it.

---

## 0. TL;DR (read this first)

- **What it is for:** Writing-system genealogy as a **first-class investigation lens** — the fossil record `Egyptian hieroglyph → Proto-Sinaitic → Phoenician → {Greek → Latin/Cyrillic/Coptic, Aramaic → Hebrew/Arabic/Syriac→…, South-Arabian → Geʿez, ?→Brahmi→…}`. The payoff is the **aleph→alpha→A** glyph-evolution row and the **script → language → scripture** wire that lands a reader back in the Codex/READ surface ("the letters you are reading are a 3,900-year-old picture of an ox").
- **The data already exists and is already live.** `data.js` (`window.VAULT_DATA`) carries **42 `type:alphabet` nodes + 34 `type:language` nodes**, and **150 edges touch the alphabet nodes** — including a real genealogy graph (`ancestor-of` ×20, `descended-from` ×18, `adapted-from`, `parallel-form` ×53, `sibling`/`sibling-branch`, `influenced-by` ×4, `independent-invention` ×4). The chain `proto-sinaitic --ancestor-of--> alphabet-phoenician`, `proto-sinaitic --descended-from--> alphabet-medu-netjer` etc. is present as **first-class edges**, not hardcoded JS.
- **The engine already supports this.** `src/js/engine/layout/radial.js` takes `opts.groupBy / opts.wedgeBy / opts.groupColor / opts.colorOverride` as **swappable primitives** (rule #9 compliant). The Forge mode catalog `src/js/engine/graph/mode.js` **already declares `{value:'alphabet', nodeType:'alphabet'}` and `{value:'languages', nodeType:'language'}`** (lines 36, 50). So "type=alphabet on the canonical wheel" is partially pre-wired today.
- **Recommended architecture:** **Hybrid.** (a) The canonical wheel already gives a free "Alphabets" *class lens* (group by writing-system family). (b) Build a **bespoke `VIEWS.alphabets` page** for the two things the wheel cannot express well: the **horizontal genealogy tree** (time-on-X, descent edges) and the **per-letter glyph-evolution strip** (aleph→alpha→A). Both read from `VAULT_DATA` + a small curated glyph table. This mirrors exactly how Boards/Maps/Starmap V2 pages were carved.
- **Carve-step minimum (Phase 0):** `VIEWS.alphabets` + `src/js/views/alphabets.js` that mounts an empty `.alphabets-pane` with the Atlas radial-gradient and ONE app-pill contextual control — **no legacy chrome, no alchemy splash, no bottombar copied from legacy.** Exactly the `maps.js` skeleton shape.
- **The one real decision for John:** where Alphabets lives in nav — **promote to the 5→6 master-pill** vs. a **class-side entry** vs. **user-menu**. See §3.3 + §8 Q1.

---

## 1. Goal & scope — what an Alphabets page is FOR

Per the cardinal framing (`feedback_completeness_is_investigation_not_catalogue`, `project_scripture_is_the_root_of_truth`): we are **not** building a catalogue of letterforms. We are building an **investigation lens** whose job is to make the cross-tradition wiring *visible and walkable*. Writing-systems are an unusually strong lens because almost every node has a live wire-endpoint:

1. **The fossil-record genealogy.** One unbroken line of transmission runs from a Bronze-Age turquoise mine in Sinai to the sentence you are reading. Hieroglyph (acrophonic pictures) → Proto-Sinaitic (first alphabet, 22 consonants) → Phoenician (the mercantile disseminator) → the great fork:
   - **Greek branch** (the vowel revolution) → Latin (via Etruscan), Cyrillic, Coptic, Gothic, Runic(?).
   - **Aramaic branch** → Hebrew square script, Nabataean → Arabic, Syriac → Sogdian → Mongolian/Manchu, and (debated) Brahmi → all of South/SE Asia.
   - **South-Semitic branch** → South Arabian (Musnad) → Geʿez/Ethiopic.
   - **Independent inventions** (no shared ancestor): Cuneiform, Chinese oracle-bone, Maya, Indus, Rongorongo, Hangul (created, with possible Brahmic conceptual influence).

2. **The glyph-evolution strip.** The single most legible "MASSIVE WIN" artifact in the whole Atlas: pick a letter, watch its *shape* morph across scripts while its *name* and *meaning* persist. Aleph (ox) → 𐤀 → Α → A. Beth (house) → 𐤁 → Β → B. Waw (hook) → the six children F·U·V·W·Y·Υ. This is the "you are reading a rotated ox-skull" moment.

3. **Cross-script borrowing & convergence** (not just descent): the letter-number systems (Hebrew Gematria / Greek Isopsephy / Arabic Abjad) all inherit the **same Phoenician number-scaffold** (Gimel=3 in all three) — `convergence` / `parallel-form` edges, not descent. Champollion using **Coptic** as the bridge to decipher hieroglyphs. The *deva/daēva* inversion lives one lens over in `18_languages`.

4. **The script → language → scripture chain** — the tie-back into the Codex/READ surface. A *script* encodes one or more *languages*; a *language* carries *texts*; the texts are the **scripture corpus that is the root of the Atlas**. Geʿez script → Geʿez language → the 81-book Ethiopic canon + the only complete witness to 1 Enoch. Arabic script → Quranic Arabic → the Quran (theologically untranslatable: the Arabic *is* the revelation). This is the wire that makes Alphabets a *lens on scripture* and not a sidebar.

**In-scope for the page:** scripts (`11_alphabets`, 42 nodes), their genealogy edges, the per-letter glyph strip, and the script↔language↔scripture wiring (read-only links into `18_languages`, `02_documents`, the READ surface).
**Out-of-scope (other lenses own these):** languages-as-primary (that's a `languages` class on the wheel), gematria *calculators*, full cuneiform sign dictionaries. We *link* to them; we don't rebuild them here.

---

## 2. What the old prototype did — inventory + KEEP / DISCARD / RETHINK

The legacy `VIEWS.alphabets` (in `_legacy/app.js` ~line 8811–9000, registered by `alphabet-tab-1` 2026-05-16) had **5+ modes** driven by `_alphabetsState.mode`, dispatching to renderer modules in `src/js/alphabets/`:

| Mode | Legacy renderer | What it did |
|---|---|---|
| `glyphs` | `glyph-viewer.js` → `window._alphaGlyphs` | 22 Proto-Sinaitic letters as a grid; a **script-selector** (hieroglyph/Phoenician/Hebrew/Arabic/Greek/Latin/Ogham/Futhark/Chinese/Japanese/Devanagari/Hangul/Aztec/Maya/Quipu) reskins the whole grid; click a letter → expanded card with the 5-step transmission chain (Egyptian→Proto-Sinaitic→Phoenician→Greek→Latin), a "what the investigation found" panel, and `relatedNodes` chips that call `window.selectNode(id)`. |
| `origin` | `origin-chain.js` → `window._alphaOrigin` | A **horizontal SVG genealogy tree**: 28 script nodes positioned by `date` on X and a hand-tuned `y` row, 24 descent/source/sibling edges as cubic béziers, sample-glyph in each node circle, hover tooltip. Carries `vaultId` per node (links to `11_alphabets/*`). |
| `mysticism` | `mysticism.js` → `window._alphaMysticism` | Gematria / Isopsephy / Abjad side-by-side, curated famous examples (Echad=13=Ahavah, Chai=18, Nero=666), each with `relatedNodes`. |
| `cuneiform` | `cuneiform-viewer.js` → `window._alphaCuneiform` | The "independent invention" argument — Sumerian cuneiform signs with meaning + an `inv` cross-tradition note + `relatedNodes` (enki-ea, tiamat, …). |
| `scripts` / `findings` | inline in legacy `app.js` | HTML index of `type:alphabet` nodes; a curated "what the alphabet investigation found" essay panel. |

**Data assets the legacy carries** (these are the crown jewels):
- `src/js/alphabets/glyph-data.js` (**412 KB**, `window.ALPHA_GLYPH_DATA`): **351 entries**. The core 22 Semitic letters carry `letter / name / meaning / gardiner / unicode / phoneme / greek / latin / hebrew / arabic / phoenician (codepoint) / note / investigationHighlight / relatedNodes[]`. The rest are `scriptOnly`-tagged standalone-script glyphs (chinese ×55, hieroglyph ×68, devanagari ×46, japanese ×46, hangul ×24, maya ×20, aztec ×20, futhark ×14, ogham ×11, quipu ×9, arabic ×7, greek ×5, latin ×8). **40 entries carry inline `glyphSVG`** (hand-drawn vector path data — used when no Unicode glyph/font is reliable).
- `origin-chain.js` NODES/EDGES (28 nodes, 24 edges) — **a parallel, hand-curated copy** of what is now in the vault as `cross-alphabet-edges` (see §1.1 LOOP risk).

### KEEP / DISCARD / RETHINK

| Item | Verdict | Rationale |
|---|---|---|
| The **genealogy concept** (horizontal tree, time-on-X, descent edges, sample-glyph nodes) | **KEEP** | This is the core investigation artifact. Re-implement clean for V2. |
| The **glyph-evolution data** in `glyph-data.js` (name/meaning/gardiner/unicode/phoneme + per-script codepoints + investigationHighlight + relatedNodes + `glyphSVG`) | **KEEP** (as data; relocate) | Irreplaceable hand-curation. But it is a **413 KB JS global** living under `src/js/alphabets/`. RETHINK its home (see below). |
| The **per-letter transmission-chain expanded card** + `relatedNodes`→`selectNode()` wiring | **KEEP** (concept) | The "click aleph, see the chain, jump to the vault node" loop is exactly the investigation pattern. Re-skin in V2 tokens. |
| `origin-chain.js` hardcoded **NODES/EDGES** | **DISCARD** (replace with `VAULT_DATA`) | These now duplicate `cross-alphabet-edges` baked into `data.js`. Two-sources-of-truth = rule #10 LOOP smell. Read the live graph instead. Keep the legacy file only to *seed* curation gaps (dates, `y`-rows, sample glyphs the vault lacks). |
| The legacy **aesthetic**: `.alpha-pane` / `.agv-*` / `.ao-*` / `.age-*` DOM naming, the legacy script-selector pill row, header banners, mode-tab toolbar | **DISCARD** | Per rule #8 + `feedback_dont_copy_legacy_prototype_aesthetic`. V2 chrome lives in app-pill contextual pills; the pane owns its own clean DOM with `--*` tokens. No `.alch-*`/`.alpha-*` legacy class lift. |
| The **5-mode tab bar** inside the pane | **RETHINK** | V2 has no in-pane mode tabs by default. Modes become either (a) app-pill class/sub-selector entries, or (b) one cohesive page with a single mode-switch contextual pill. Don't lift the legacy toolbar. |
| `mysticism.js` (gematria) + `cuneiform.js` | **RETHINK / DEFER** | Valuable but arguably their own concerns. `gematria` overlaps the existing `alphabet-gematria-hebrew` / `alphabet-isopsephy-greek` vault nodes; cuneiform overlaps `alphabet-cuneiform-sacred` + the deity lens. Phase them in later (§7 Phase 4), or link out to the vault nodes rather than rebuild. |
| The 5-step chain being **hardcoded to Egyptian→Proto-Sinaitic→Phoenician→Greek→Latin** | **RETHINK** | That single path is Latin-centric. V2 should compute the path **per letter from the graph** so Hebrew/Arabic/Geʿez/Cyrillic letters show *their* lineage, not always the Latin one. |

---

## 3. Architectural fit

### 3.1 The three options (the genuine fork)

**Option A — pure wheel-lens.** Alphabets is just a `groupBy` spread on the canonical radial wheel. The Forge mode catalog already has `{value:'alphabet'}`, so selecting it filters to `type:alphabet` and the wheel hulls them.
- *Pros:* zero new view; rule #9 "ONE engine MANY spreads" in its purest form; free hover/zoom/perf; instant.
- *Cons:* the wheel is a **radial membership chart** — it groups nodes into wedges by family and scatters them. It **cannot natively express directed descent over time** (the genealogy is a DAG with a time axis), and it has **no per-letter glyph strip**. The fossil-record story (the entire point) is invisible. The wheel answers "what scripts exist and how do they cluster," not "what descended from what."

**Option B — pure standalone bespoke page.** A `VIEWS.alphabets` page that ignores the wheel and draws its own genealogy tree + glyph grid (like the legacy did, but clean V2).
- *Pros:* full control of the genealogy DAG + glyph strip; the artifacts John actually wants.
- *Cons:* if it hardcodes its own node list it re-creates the two-sources-of-truth LOOP. Must read `VAULT_DATA`. Doesn't reuse the wheel's hull/zoom primitives (acceptable — Boards/Maps don't either).

**Option C — HYBRID (recommended).**
- The **canonical wheel keeps its free "Alphabets" class lens** (Option A) for the membership/cluster view, declaring a writing-system `groupBy` so the hulls are *Semitic / Greek-Latin / Brahmic / Independent* rather than origin-tradition families (see §3.2).
- A **bespoke `VIEWS.alphabets` page** owns the two wheel-can't-do artifacts: the **genealogy tree** (time-X, descent edges, read from `VAULT_DATA` alphabet edges) and the **glyph-evolution strip** (read from the curated glyph table). The page reads the *same* `VAULT_DATA` so there is one source of truth; the glyph table is the *only* net-new curated data and it's additive (codepoints + svg + per-letter prose), not a duplicate node list.

**Recommendation: Option C.** It satisfies rule #9 (the wheel lens is a real swappable spread) AND delivers the genealogy/glyph artifacts the wheel structurally cannot. It mirrors precedent: Codex is "the same wheel" *plus* the bespoke READ surface; Boards is its own pane. Per `feedback_never_menu_pick_if_overlooking` — this is the clearly-better path within the ratified framework; I'm naming it rather than offering A/B/C as a fake fork to John. (The only thing genuinely needing John's call is §3.3 nav placement.)

### 3.2 The `{groupBy, wedgeBy, pointSourceFn}` triple (for the wheel-lens half)

The wheel already filters `type:alphabet` via `mode.js`. The **only** thing to add is a writing-system `groupBy` so hulls are meaningful, because **`n.family` on alphabet nodes is the *origin-tradition* family** (Phoenician's `family` = "Canaanite", Latin's = the Roman-religion family) — NOT the writing-system family. Grouping by `n.family` would scatter the genealogy across unrelated tradition-wedges. This is the precise hazard rule #9 was written for: **do not hard-code `n.family`; declare a `groupBy`.**

```
// Wheel-lens "Alphabets" spread (declared by the view, fed to radialWedgeLayout):
{
  // membership filter is already mode.js {value:'alphabet'}
  groupBy:    n => writingSystemFamily(n),   // 'Semitic' | 'Greek-Latin' | 'Brahmic' | 'East-Asian' | 'Independent' | 'Mesoamerican'
  groupColor: famName => WS_FAMILY_COLOR[famName],   // since n.family_color is the tradition color, not WS family
  wedgeBy:    null,        // optional: sub-wedge by branch (Aramaic-line vs Phoenician-line vs South-Semitic)
  pointSource:/* default: the filtered alphabet nodes */,
  colorOverride: n => WS_FAMILY_COLOR[writingSystemFamily(n)],  // recolor points to WS family
}
```

`writingSystemFamily(n)` is a small classifier. Cleanest is a **new `script-family:` field on the `11_alphabets` YAML** (Lane A content work — one line per node, 42 nodes) so the classifier is data-driven, not a JS lookup table. Until that field exists, a temporary slug→family map keyed on `n.id` is acceptable *inside the view module* (never inside `radial.js`). This `groupBy` is the rule-#9-correct way and needs no engine change — `radial.js` already consumes `groupBy/groupColor/colorOverride`.

### 3.3 Routing & where it lives in nav (THE decision for John)

The app shell nav is the **app-pill** (`src/js/app-pill.js`): a LEFT "master view" side (`MASTER_VIEWS`, currently 5: ATLAS/TIMELINE/BOARD/MAP/STAR MAP) + a RIGHT "class" side (driven by the active master's class API). Views register two places: `MASTER_VIEWS` in `app-pill.js` and `VIEWS.<name>` in `app.js`. `setView()` already does the URL push (`?view=<name>`) and `codex:view-changed` dispatch, and teardown already removes per-view panes by class (the plan adds `.alphabets-pane` to that sweep).

Three placements, with trade-offs:

| Option | How | Pros | Cons |
|---|---|---|---|
| **N1 — promote to master pill (6th entry)** | add `{ id:'alphabets', target:'alphabets', icon:'ℵ', label:'ALPHABETS' }` to `MASTER_VIEWS` | First-class, discoverable, parallels Codex/Boards as a top-level investigation surface; matches "writing-system genealogy as a first-class lens" | Grows the master pill 5→6 (the topbar refactor deliberately capped at 5 "promoted" views per `AUDIT/topbar-pill-refactor-design-2026-05-23.md`). Needs John's nod to break the cap. |
| **N2 — class-side of ATLAS** | rely on existing `mode.js {value:'alphabet'}`; Alphabets is a *class* of the wheel, the bespoke page opens on a "deep-dive" affordance | No master-pill growth; uses pre-wired class machinery | The bespoke genealogy/glyph page is *not* a wheel class — it's a different surface. Bolting a non-wheel page onto a wheel class is the kind of special-case rule #9/#8 discourage. Confusing. |
| **N3 — user-menu / "more views"** | entry in `src/js/user-menu.js` | zero pill change | Buries a flagship lens; contradicts §1's "first-class." |

**Recommendation to surface to John: N1** (promote to the master pill). Writing-system genealogy is exactly the kind of cross-tradition spine the Atlas exists to show, and the master pill is where Codex/Boards/Map live. The cap was a 2026-05-23 ergonomics call, not a law. **This is the single item I would *not* auto-decide** — the master-pill cap was an explicit design decision, so it's a real fork, not a fake one. Default to N1 unless John prefers to hold the 5-cap.

### 3.4 How the page owns its chrome (rule #8)

Exactly the Boards/Maps pattern — **no legacy markup, no hide-list, no copied bottombar**:
- `VIEWS.alphabets.render()` creates `<div class="alphabets-pane">`, appends to `#canvas`, hides `#svg`, delegates to `window._alphabetsView.render(pane)`. (Carbon-copy of `VIEWS.maps`, app.js ~1373.)
- `setView()` teardown: add `.alphabets-pane` to the cleanup `querySelectorAll(...)` sweep (app.js ~538/557) and call `window._alphabetsView.unmount()` if present (symmetry with Boards).
- All chrome (mode switch: *Genealogy ⇄ Glyph strip ⇄ Script index*; the per-script "view as" script-selector) lives as **app-pill contextual controls** or a single in-pane control rendered from V2 tokens — **not** a legacy tab-bar. If a per-view contextual pill is needed, follow the Boards bottombar *mechanism* (`.forge-viewset-*` drop-up) but only as reuse of existing classes, never a new legacy-styled bar.
- Empty/dark default: the pane shows the Atlas radial gradient with the genealogy tree centered — **no alchemy-glyph splash** (the carve-step minimum per `feedback_dont_copy_legacy_prototype_aesthetic`).

---

## 4. Data model — what exists, what's missing

### 4.1 Live in `data.js` today (verified by parsing `window.VAULT_DATA`)

- **42 `type:alphabet` nodes**, **34 `type:language` nodes** (counts block confirms). Node fields present: `id, type, title, tradition, family, family_color, date_earliest, date_latest, dating_basis, region, tags, refs, status, body, source_tier, path, political_risk_flag`. (Alphabet nodes do **not** carry script-specific glyph data — that's the curated table's job.)
- **150 edges touch alphabet nodes.** Genealogy-relevant types and counts: `parallel-form` 53, `convergence` 22, `ancestor-of` 20, `descended-from` 18, `influenced-by` 4, `sibling` 4, `independent-invention` 4, `sibling-branch` 2, `adapted-from` 1, plus `syncretic-*` variants linking to documents/deities/music. Sample real edges: `proto-sinaitic --ancestor-of--> alphabet-phoenician`, `proto-sinaitic --descended-from--> alphabet-medu-netjer`, `alphabet-sefer-yetzirah --parallel-form--> alphabet-ilm-al-huruf`, `event-armenian-genocide --affects-tradition--> alphabet-armenian`.
- **`build_data.py` provenance:** `STRUCTURED_EDGE_FIELDS` (line ~712) maps the YAML `cross-alphabet-edges:` block into graph edges (default type `parallel-form`, but the per-edge `type:` in the YAML is preserved — that's why `ancestor-of`/`descended-from`/`adapted-from`/`sibling`/`parallel-form` all appear). `syncretic-edges:` (line ~710) handles the script→document links (e.g. proto-sinaitic → document-genesis). So **the genealogy DAG is already in the live graph** — the page reads it; it does not re-author it.

### 4.2 The script ↔ language ↔ scripture wiring (already in the YAML)

- `18_languages` nodes carry `scripts-used:` (wikilinks to `11_alphabets/*`), `parent-language:`, `descendant-languages:`, `texts-in-language:` (wikilinks to `02_documents`/phase docs), and `liturgical-tradition:`. Example (`language-geez.md`): `scripts-used: [[alphabet-geez-ethiopic]]`, `texts-in-language: [[phase-4-082-ethiopic-biblical-canon]], [[phase-4-081-mashafa-henok-geez-1-enoch]]`.
- **DATA-HYGIENE NOTE (flag to John, do not auto-fix):** the field name is **inconsistent** — `scripts-used:` (geez) vs `script-used:` (the README skeleton + `sanskrit-vedic`). Whichever the page relies on must be normalized so the script→language→scripture wire is complete. This is a small Lane-A sweep across 34 files, not a blocker for the page, but the wire will be patchy until done. (Smells like the kind of two-sources/loose-field issue rule #10 warns about — worth a single normalization pass.)

### 4.3 The curated glyph table (the only net-new data)

The per-letter glyph-evolution strip needs data the *nodes* don't carry: per-letter, per-script codepoints + meaning + the `glyphSVG` fallback. That is exactly `ALPHA_GLYPH_DATA` in `src/js/alphabets/glyph-data.js` (351 entries, 40 with `glyphSVG`). **Decision on its home (RETHINK from §2):**

| Option | Trade-off |
|---|---|
| **G1 — relocate to `src/data/glyph-evolution.js`** as a V2 data module (like `src/data/scripture-texts.js`, `boards-library.js`), loaded in `index.html` near the other `src/data/*` | Clean V2 home; matches existing data-module convention; trims the standalone-script noise to what the strip actually shows. **Recommended.** |
| G2 — leave in `src/js/alphabets/glyph-data.js`, just load it in V2 index | Less churn but keeps a 413 KB file under a legacy-flavored path; risks re-importing the legacy module aesthetic by association |
| G3 — fold the glyph data into the `11_alphabets` YAML (per-letter sub-records) | Most "single-source" but a big content refactor (letters aren't currently nodes); over-engineered for now — defer |

Recommend **G1**: copy the *data object* (not the renderer) into `src/data/glyph-evolution.js`, prune to the strip's needs (the 22 core letters + the script-codepoint columns + `glyphSVG`), drop the legacy `_alphaGlyphs` renderer entirely. Fonts needed are **already loaded** in V2 `index.html` line 9 (`Noto Sans Egyptian Hieroglyphs`, `Noto Serif Hebrew`) — Phoenician/Ugaritic/Greek-extended may need a check (legacy fell back to `glyphSVG` exactly because some scripts lack reliable Unicode/fonts; keep that fallback).

### 4.4 Edge-direction normalization (must handle in the view)

The live edges are **directionally inconsistent**: both `ancestor-of` (parent→child) and `descended-from` (child→parent) exist, sometimes for the same relationship from different authoring nodes (e.g. Proto-Sinaitic authored `ancestor-of → phoenician` *and* `descended-from → medu-netjer`). The genealogy renderer must **normalize to a single direction** (recommend: canonicalize every descent edge to *older → younger* using `date_earliest`, treating `descended-from`/`adapted-from`/`child` as reversed `ancestor-of`, and `sibling`/`sibling-branch`/`parallel-form`/`convergence`/`independent-invention` as non-descent annotations). Do this **in the view's data-prep step**, never by mutating `data.js`. (Optionally propose a later `build_data.py` normalization, but that's out of scope here.)

### 4.5 Coverage gaps vs. the legacy genealogy (curation backlog, not blockers)

The legacy `origin-chain.js` has 28 script nodes; the vault has 42 alphabet nodes but several **transmission-spine** scripts that the legacy drew are **missing as vault nodes** (so the tree will have dangling/implied links until created). Notably absent or thin (cross-check `00_meta/dead-links.md` / `orphan-nodes.md`): **Nabataean** (the real Aramaic→Arabic missing link), **Sogdian**, **Mongolian**, **Brahmi**, **Devanagari**, **Tibetan**, **Greek** as its own node (the vault has `alphabet-greek-vowel-revolution` — a *finding* node, fine), **Aramaic** as a script node (`alphabet-aramaic` exists — good), **Etruscan** (flagged in `alphabet-latin.md` body as "candidate for a dedicated node"). This aligns with `feedback_completeness_is_investigation` (rank gaps by dead-link demand): the genealogy tree itself will *surface* which spine-nodes are missing — a useful by-product. **List these as a content-backlog appendix; do not let the page block on them** — render present nodes + draw "implied ancestor" ghost-stubs where an edge points to a non-existent id.

---

## 5. UX / interaction ideas

Three cohesive sub-modes (switchable via ONE app-pill contextual control, *not* a legacy tab-bar):

### 5.1 Genealogy tree (the hero view; default)
- **Horizontal DAG, time on X** (BCE left → CE right), descent edges as bézier ribbons (KEEP the legacy's clean ribbon look, re-skinned to `--gold`/branch colors). Nodes = `type:alphabet` from `VAULT_DATA`, positioned by `date_earliest`; Y assigned by **branch** (Semitic / Greek-Latin / South-Semitic / Brahmic / East-Asian / Independent) so the great forks read top-to-bottom.
- **Edge styling by relation:** solid = descent (`ancestor-of`/`descended-from`/`adapted-from` normalized); dashed = `sibling`/`parallel-form`; dotted/ghost = `?`-debated (the legacy already marks `'?'` labels on Aramaic→Brahmi, Latin→Runic).
- **Node chip:** a sample glyph (from the glyph table or node) + script name + date; click → opens the **global detail panel** via `selectNode(id)` (reuse, don't rebuild — the vault node `body` renders there). Hover → lightweight tooltip (date, branch, one-line note).
- **Ghost-stubs** for missing spine nodes (§4.5): faint outline + "node not yet in vault" — turns the gap into an investigation lead, consistent with the completeness-as-investigation doctrine.
- **Perf:** SVG is fine here (few-large elements — ~42 nodes, ~150 edges — exactly the "stay SVG" case per `feedback_safari_perf_unlocks`; do NOT canvas it). Safari is the truth; minimal stroke widths.

### 5.2 Glyph-evolution strip (the "aleph→alpha→A" artifact)
- A grid of the **22 core letters**; each row shows the letter's name + meaning (ox/house/door…) and its **shape across columns** Hieroglyph → Proto-Sinaitic → Phoenician → {Greek, Hebrew, Arabic, Latin, Geʿez, Cyrillic…}. Uses the curated codepoints + `glyphSVG` fallback.
- A **"view as" script selector** (app-pill contextual, replaces the legacy `.agv-script-selector` pill row) reskins which script *leads* — but unlike the legacy's single hardcoded Latin chain, the per-letter **chain is computed per script** so a Hebrew-led view shows the Hebrew lineage.
- Click a letter → expanded card: the big glyph, gardiner/unicode, the **per-letter transmission chain**, the `investigationHighlight` prose, and `relatedNodes` chips → `selectNode()`. (KEEP this loop from `glyph-viewer.js insertExpanded`, re-skinned; it's the strongest investigation moment.)
- Highlight the **one-to-many** stories the data already encodes: Waw → F·U·V·W·Y·Υ ("the most productive letter"); Gimel → C+G; the dropped letters (Teth, Tsade) Latin couldn't pronounce.

### 5.3 Script index + script→language→scripture rail
- A compact list/index of all 42 scripts (replaces legacy `scripts` mode), each row → `selectNode()`.
- For the selected script, a **right-rail "downstream" panel**: *script → languages it writes* (from `18_languages` `scripts-used`) → *texts in those languages* (`texts-in-language`) → **"Read in the Codex"** deep-links into the READ surface / scripture corpus. This is the §1.4 wire made walkable, and the concrete tie-back into `project_scripture_is_the_root_of_truth`.

### 5.4 The wheel-lens (free, via the canonical chart — §3.2)
- Selecting the "Alphabets" class on ATLAS shows all scripts on the canonical wheel, hulled by writing-system family (Semitic/Greek-Latin/Brahmic/…). This is the *membership/cluster* complement to the *genealogy* page. No new engine work — just the declared `groupBy/groupColor`.

---

## 6. Integration with the rest of the Atlas

- **`selectNode(id)` everywhere** — every script/letter chip routes through the existing global detail panel + cross-view navigation (`window.selectNode`, `window.NODES_BY_ID`). No bespoke detail panel.
- **18_languages** — the script→language rail reads `scripts-used` / `texts-in-language`; bidirectionally, a language node's detail can show "written in script X" (already in the data; the page just surfaces it).
- **02_documents + the READ surface** — `texts-in-language` lands the user on the scripture corpus; the genealogy of *the script the text is written in* becomes a lens that hangs off the READ panel (the Codex drilldown `family → corpus → book → LENS → READ`; "Alphabets" is a LENS per `feedback_chart_family_swap_is_a_primitive`). Phase 3+ could add an "alphabet" tab to the READ cross-tradition panel.
- **Cross-lens wires already present:** alphabet↔music (`music-sefer-yetzirah-sound`), alphabet↔deity/Pythagorean (gematria parallels), alphabet↔event (Armenian genocide → Armenian script). These render as the dashed/`parallel-form` edges and as `relatedNodes` chips — no extra wiring needed; they fall out of reading the live graph.
- **Forge wheel class** — `mode.js` already exposes `alphabet` + `languages` as classes, so the moment the page ships, the wheel's class-pill can also surface them with the §3.2 spread.

---

## 7. Phased build plan (mirrors Forge/Boards carve discipline)

> Each phase ends with the **verification ritual** (rule #8): `lsof :8742` (one `serve-node.js` pid), Cmd-Option-E in Safari, hard reload, **screenshot**. The screenshot is the success criterion, not "no console errors." Commit each phase immediately (concurrent-fleet wipe risk per `feedback_concurrent_fleet_wipes_untracked`).

- **Phase 0 — Carve-step minimum (skeleton).** `src/js/views/alphabets.js` exposing `window._alphabetsView = { render(pane), unmount() }` that mounts an empty `.alphabets-pane` (Atlas radial gradient, nothing else). `VIEWS.alphabets` in `app.js` (copy `VIEWS.maps`). Add `.alphabets-pane` to `setView()` teardown sweep + `unmount()` call. Register nav per John's §3.3 decision (default N1: add to `MASTER_VIEWS`). Load `src/js/views/alphabets.js` in `index.html` beside `maps.js`/`starmap.js`. **Verify: pill routes to a clean dark stage. No legacy chrome.** (This is the entire "pane mounts + routes" minimum — resist building more.)

- **Phase 1 — Genealogy tree (hero).** Data-prep: read `type:alphabet` nodes + their edges from `VAULT_DATA`, normalize edge direction (§4.4), assign branch-rows. Render the horizontal SVG DAG (nodes by `date_earliest`, descent ribbons, sample glyphs, hover tooltip). Wire node-click → `selectNode()`. Ghost-stubs for missing spine ids. **Verify: the hieroglyph→Phoenician→Greek/Aramaic forks read correctly on screenshot; clicking Phoenician opens its vault node.**

- **Phase 2 — Glyph-evolution strip.** Relocate/prune glyph data → `src/data/glyph-evolution.js` (§4.3 G1); load in `index.html`. Render the 22-letter grid + per-script columns + `glyphSVG` fallback; "view as" script selector as an app-pill contextual control; expanded per-letter card with computed chain + `investigationHighlight` + `relatedNodes` chips. Mode-switch (Genealogy ⇄ Glyph strip) via ONE contextual pill. **Verify: aleph→alpha→A visible; Waw→6-children card; Hebrew-led view shows Hebrew lineage.**

- **Phase 3 — Script index + downstream rail + wheel-lens.** Add the script index sub-mode and the script→language→scripture rail (reads `18_languages`). Separately, declare the canonical-wheel "Alphabets" spread (§3.2 `groupBy/groupColor` in the Forge view's mode config — **no `radial.js` change**). **Verify: selecting a script shows its languages + a working "Read in Codex" deep-link; the ATLAS class-pill "Alphabets" hulls by writing-system family.**

- **Phase 4 — (DEFER / optional) mysticism + cuneiform sub-lenses.** Only if John wants them on this page rather than as standalone vault nodes. Gematria/Isopsephy/Abjad comparison + cuneiform "independent invention" panel, each linking out via `relatedNodes`. Strong candidate to **link-out instead of rebuild** (the vault already has `alphabet-gematria-hebrew`, `alphabet-isopsephy-greek`, `alphabet-cuneiform-sacred`).

- **Content Lane-A backlog (parallel, not blocking):** add `script-family:` to the 42 `11_alphabets` nodes (§3.2); normalize `script(s)-used:` field name across `18_languages` (§4.2); create the missing spine nodes the tree surfaces (Nabataean, Sogdian, Brahmi, Devanagari, Tibetan, Mongolian, Etruscan — §4.5), ranked by dead-link demand per `feedback_completeness_is_investigation`.

---

## 8. Risks & open questions for John

1. **Nav placement (the one real fork).** Promote Alphabets to the 5→6 master pill (N1, my recommendation), keep it as an ATLAS class only (N2), or user-menu (N3)? The master-pill cap of 5 was an explicit 2026-05-23 design call — breaking it needs your nod. *Default: N1.*
2. **Glyph-data home.** OK to relocate the 413 KB `ALPHA_GLYPH_DATA` (pruned) into `src/data/glyph-evolution.js` and delete the legacy `_alphaGlyphs` renderer (G1)? Or fold per-letter glyph data into the `11_alphabets` YAML later (G3)?
3. **`groupBy` source.** Add a `script-family:` field to the 42 alphabet YAML nodes (data-driven, rule-#9-clean) vs. a temporary in-view slug→family map? *Recommend the field.*
4. **Edge-direction normalization.** Confirm normalizing in the view's data-prep is acceptable (vs. a `build_data.py` change later). The live data mixes `ancestor-of` / `descended-from` for the same relationships.
5. **Missing spine nodes.** Render the tree now with ghost-stubs for not-yet-created scripts (Nabataean/Sogdian/Brahmi/…), surfacing them as leads — or hold the genealogy until those nodes exist? *Recommend ghost-stubs now (completeness-as-investigation).*
6. **Scope of mysticism/cuneiform.** Rebuild them on this page (Phase 4) or link out to the existing vault nodes? *Lean link-out.*
7. **READ-surface tab.** Is an "Alphabets" tab on the READ cross-tradition panel wanted (Phase 3+), or is the standalone page + `selectNode` enough for now?
8. **Field-name sweep.** Confirm a one-pass normalization of `script-used` vs `scripts-used` across `18_languages` (small Lane-A task, makes the script→language→scripture wire complete).

---

### Key files referenced (all absolute under `…/Codex Atlas`)
- Legacy reference: `_legacy/index.html` (lines 150, 351–355), `_legacy/app.js` (~8811–9000); `src/js/alphabets/{glyph-data.js (412 KB, ALPHA_GLYPH_DATA, 351 entries, 40 glyphSVG), glyph-viewer.js, origin-chain.js (28 nodes/24 edges + vaultIds), mysticism.js, cuneiform-viewer.js}`.
- V2 shell + routing: `index.html` (app-pill markup ~47–70, font load line 9, script-load block ~171–244 — add view script near 235–236), `src/js/app.js` (`VIEWS`/`setView` 454–598, teardown sweep ~538/557, `VIEWS.maps` template ~1373), `src/js/app-pill.js` (`MASTER_VIEWS` ~50–65), `src/js/views/maps.js` (skeleton template).
- Engine: `src/js/engine/layout/radial.js` (`groupBy/wedgeBy/groupColor/colorOverride` ~95–210), `src/js/engine/graph/mode.js` (alphabet line 36, languages line 50), `src/js/engine/graph/hull.js` (`v=20260530-groupby-swappable`).
- Data: `data.js` (`window.VAULT_DATA`; 42 alphabet + 34 language nodes; 150 edges touch alphabets), `build_data.py` (`STRUCTURED_EDGE_FIELDS` ~709–717: `cross-alphabet-edges`→edges, `syncretic-edges`→doc links), content `11_alphabets/*.md` (`cross-alphabet-edges` YAML), `18_languages/*.md` (`scripts-used`/`texts-in-language` YAML).
- Cardinal constraints: `00_meta/HOW-WE-WORK.md §5` rules #8 (hide-list forbidden), #9 (groupBy swappable primitive), #10 (loop-detection / two-sources-of-truth), #12 (membership singular / reach is wires); `00_meta/app-architecture.md` (tokens, view-extension contract — note §5 of that doc references the *deleted* V01 `nav-inner`; the live registration path is `MASTER_VIEWS` + `VIEWS.<name>`).

---

*Plan authored 2026-06-10 by planning agent (read-only research pass; no code changed). Architecture recommendation: HYBRID (Option C) — keep the canonical wheel's free "Alphabets" class lens with a writing-system `groupBy`, plus a bespoke `VIEWS.alphabets` page for the genealogy tree + glyph-evolution strip, both reading the live `VAULT_DATA`. Sole item left for John: master-pill nav placement (§3.3 / §8 Q1).*
