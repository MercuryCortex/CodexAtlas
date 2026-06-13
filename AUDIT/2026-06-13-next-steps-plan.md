# Codex Atlas — next-steps plan (2026-06-13)

Filed after: tabs-teardown fix, engine-genealogy + page re-ratification, left-pick-lock,
MAP build (live in Safari), ALPHABETS fill, MASSIVE-WIN audit, side-panel close button.

State of the three live Sections the user just exercised: ATLAS/TIMELINE/GENEALOGY/
ALPHABETS/INVESTIGATION solid; **MAP confirmed live in Safari** (basemap + clustering +
click→inspector); STAR MAP = construction placeholder + design doc.

---

## TIER 1 — user-flagged, high value, do next

### 1. MAP lenses (class filter on the Map) — John: "we need the lenses of all there"
The Map plots all 2,581 geo-tagged nodes at once. Add the right-pill **class filter**
scoped to MAP, exactly per the left-pick-lock law (`feedback_left_pick_is_a_lock`):
MAP master stays locked; the class side filters the map's GeoJSON source WITHIN the
Section (deities / persons / documents / events / sacred-sites / …), never navigates out.
- Implement `window._mapsView.supportedClasses()/getClassFilter()/setClassFilter()`
  (same contract as `_forge` + `_alphabetsView`) so the app-pill drives it.
- On class change: refilter the GeoJSON `data` to that node type + `_map.getSource('maps-nodes').setData(...)` (re-clusters automatically). "All" stays an option.
- Only list classes that actually have geo-tagged members (read live, rule #10).
- Verify in Safari (preview can't render MapLibre).

### 2. Inspector tradition raw-bracket nit
Pessoa's panel showed `\[\[TRADITION-PORTUGUESE-HERMETICISM\]\]` literally instead of a
clean label (Zeus shows "GREEK"). The inspector falls back to the raw wikilink slug when
a tradition doesn't resolve to a titled node. Fix: render the tradition as a clean
de-slugged label (strip `[[ ]]`, title-case) with the resolved node title when present.
Small, visible, consumer-facing.

## TIER 2 — quality + the long-standing structural item

### 3. MASSIVE-WIN mid-sentence reword (targeted, harvest-safe)
Audit conclusion (2026-06-13): live node-detail surfaces are CLEAN for **headings**
(inspector + side-panel transform `## MASSIVE WIN` → "Cross-tradition findings"; Boards
strips headings; Investigation reads a pre-scrubbed index). The source `## MASSIVE WIN`
headings are **load-bearing** — `build_investigation_index.py` source #8 harvests them
(~978 findings) and asserts the output is phrase-free. DO NOT mass-rename headings.
Residual leak = **mid-sentence "MASSIVE WIN" in node-body prose** (the inspector heading
transform doesn't catch these). These need *contextual* rewording (mechanical replace
risks "MASSIVE WIN cross-tradition targets" → redundant grammar), so: a targeted Lane-A
micro-batch rewording only the non-heading prose occurrences in real node bodies
(numbered folders, not `00_meta`). Non-headings are NOT harvest keys → safe. Gate after.

### 4. §4.3 — merge the two panel renderers into ONE shared module
`src/js/inspector.js` (non-forge) + `src/js/forge/side-panel.js` (forge) emit the same
markup by hand — the MASSIVE-WIN transform, bucket colors, title-dedup all live in BOTH
(drift countdown; this is the open item from the 2026-06-10 V01-panel incident §4.3).
Extract one shared content-builder loaded before both. Recipe sealed in
`AUDIT/2026-06-10-INCIDENT-v01-side-panel-persistence.md` §7 (baseline via
`_forgeDebug.toggleLock('zeus')`, pixel-compare after, rebuild bundle). Bonus: the
MASSIVE-WIN transform then lives in ONE place.

### 5. Delete the dead V1 view-render functions (app.js)
The legacy Medicine/Philosophy/Rituals "findings" views + `cuneiform-viewer.js` are
unreachable from the V2 pill but still carry `label:'MASSIVE WIN'` chips + a hardcoded
"MASSIVE WIN:" string. Deleting them removes those dead leaks, shrinks app.js, and ends
the "queued for deletion" note. Verify no live caller (the V2 class filters route to the
engine, not these).

## TIER 3 — bigger builds (design ready or specced)

### 6. STAR MAP build — design doc `AUDIT/2026-06-13-starmap-design.md`
Sky × timeline, scrubbable (precession + attestation + events). Engine `skydome` layout
family. Prereq: Lane-A `21_astronomy` star/asterism nodes with HIP ids + attestation
dates. John ratifies scope (which sky-cultures ship first) before build.

### 7. The READ north-star — text coverage + the cross-tradition parallel panel
207/621 documents have staged reader text; the flagship "the deep → Tiamat·Nun·
Ginnungagap" parallel-panel click isn't wired yet (the single image the product was
pitched on). Highest *investigation* value; bigger lift.

### 8. Consumer wins: permalinks + global ⌘K search
No shareable URL for a node/finding/verse; search is one small box in the forge toolbar.
Two cheap, high-impact consumer features.

## DECISIONS FOR JOHN (no code until ratified)
- **Boards "MASSIVE WINS" library category label** — it's a deliberate feature name in
  the Transmission Library (consumer-facing). Rename to "Cross-tradition findings" to
  match the convention, or keep? (Product call, not a leak.)
- **`tradition:` on language nodes** — the 15 new language nodes carry it; the 34 legacy
  ones don't, and the controlled-vocab registry doesn't scope `tradition` to `language`.
  Backfill 34 + add registry scope, or strip the 15? (Registry is a master file.)
- **`script-family` registry entry** — the alphabets `script-family:` field (47/47) wants
  a controlled-vocab-registry entry (pending sign-off).

## RECOMMENDED ORDER
1 (map lenses) → 2 (tradition nit) → 5 (V1 deletion, unblocks clean app.js) →
4 (renderer merge) → 3 (mid-sentence reword) → then John picks among 6/7/8.
