# Deferred Lane B Batch — Runbook & Spec

**Date written:** 2026-05-18 late evening (immediately after the ontology lock pass 2)
**Author:** opus
**For:** the next Lane B claimant (likely opus again, after John finishes Forge tuning + sends the EXPORT JSON)
**Status:** spec ready to execute — atomic batch, must ship together

---

## Why this exists

The 2026-05-18 ontology lock pass 2 created 10 new lens folders + made several conceptual changes. **All the disk + master-doc work landed in Lane A** (commits `4ba1a2b` → `9ca9888`). What did NOT ship — because John was holding Lane B for Forge tuning at the time — is the Lane B-side work that *makes* the new lenses functional and ships the queued conceptual changes.

This file is the spec for that Lane B batch. It must ship atomically (all items in one Lane B claim, ideally one or two commits) because the pieces depend on each other.

---

## The 7 items in this batch (ship in this order, atomically)

### Item 1 — Bake John's tuned Forge `PARAM_DEFAULTS`

**Why first:** ergonomic. John has been iterating in the dev panel; he'll EXPORT JSON when ready. Baking those values into `PARAM_DEFAULTS` makes the engine's "default state" equal his tuned state — eliminates the dev-panel/engine drift bug class (see `AUDIT/forge-edge-state-invariant-2026-05-18.md` FINAL DIAGNOSIS).

**Where:** `src/js/views/forge.js`, the `PARAM_DEFAULTS = Object.freeze({...})` block near the top.

**How:**
1. Receive the JSON blob John pastes from his dev panel's EXPORT button.
2. Diff against current `PARAM_DEFAULTS`. Apply the deltas.
3. Bump cache-bust slug in `index.html` (`?v=YYYYMMDD-<slug>`).
4. Verify in preview (`mcp__Claude_Preview__preview_eval` → `_forgeDebug.dumpBugState()` → confirm `params.X` matches John's exported values).

**Risk:** low. Pure const-block update. The only gotcha is making sure the JSON blob's key set matches `PARAM_DEFAULTS`'s exactly — any unknown key gets ignored (warn, don't error).

**Commit:** `opus-forge-paramdefaults-bake-2026-05-XX: bake John's tuned dev-panel state into PARAM_DEFAULTS`

---

### Item 2 — Forge Option B structural fix (engine pulls dev-panel state on mount)

**Why second:** even after the bake, if the user opens the dev panel and changes anything, then navigates away and back, the same drift bug re-appears. Option B from the audit fixes the underlying race.

**Where:** `src/js/views/forge.js`, the `render()` function (the view-mount entry point).

**The fix (per the audit):**

```js
// In forge.js render(), right after local.params is initialized
// from PARAM_DEFAULTS:
if (window.AtlasEngineForgeDevPanel && window.AtlasEngineForgeDevPanel.getState) {
  const panelState = window.AtlasEngineForgeDevPanel.getState();
  if (panelState && panelState.params) {
    // Pull persisted panel state into local.params, overriding defaults.
    for (const [k, v] of Object.entries(panelState.params)) {
      if (k in local.params) {
        local.params[k] = v;
      }
    }
  }
}
```

**Why this works:** the dev panel's `state.params` is hydrated from LS at panel boot. Whenever Forge re-mounts (page load on a different view → click Forge tab; hash-router events; etc.), `render()` now pulls the persisted panel state instead of falling back to code defaults. Engine and panel can no longer drift on view-mount because the engine reads from the panel's source-of-truth.

**Risk:** low. Only effect is engine respects persisted user choices across view-mount. Verified pattern (we have a working example in `applyAllToEngine()` already; this is the same loop, just called from `render()` instead of `tryBoot()`).

**Verification:**
- Hard refresh `?view=forge` → wires render with current panel values (not code defaults).
- Switch to `?view=pantheon` then back to `?view=forge` → wires still render with panel values, not reset to defaults.

**Commit:** `opus-forge-option-b-pull-on-mount-2026-05-XX: engine pulls dev-panel state on view mount`

---

### Item 3 — Update `build_data.py` `NODE_TYPE_MAP` for 10 new lens types

**Why:** without this, nodes added to the new folders (`08_places/`, `18_languages/`, …, `26_calendars/`) are invisible to the graph because `build_data.py` doesn't know to walk those folders.

**Where:** `build_data.py`, around lines 22–36 (the `NODE_TYPE_MAP` dict).

**The diff:**

```python
NODE_TYPE_MAP = {
    "document":         ["02_documents"],
    "deity":            ["03_deities"],
    "person":           ["04_persons"],
    "event":            ["05_events"],
    "theme":            ["06_themes"],     # ← becomes "motif" in Item 4
    "tradition":        ["07_traditions"],
    "place":            ["08_places"],     # NEW
    "symbol":           ["09_symbols"],
    "music":            ["10_music"],
    "alphabet":         ["11_alphabets"],
    "alchemy":          ["12_alchemy"],
    "moral":            ["13_morals"],
    "ritual":           ["14_rituals"],
    "philosophy":       ["15_philosophy"],
    "mathematics":      ["16_mathematics"],
    "medicine":         ["17_medicine"],
    "language":         ["18_languages"],            # NEW
    "astronomy":        ["19_astronomy"],            # NEW
    "sacred-site":      ["20_sacred_architecture"],  # NEW
    "doctrine":         ["21_theology"],             # NEW
    "practice":         ["22_practices"],            # NEW
    "relic":            ["23_material_culture"],     # NEW
    "substance":        ["24_pharmacology"],         # NEW
    "divination-system":["25_divination"],           # NEW
    "calendar-system":  ["26_calendars"],            # NEW
}
```

Also check for other hardcoded folder-walking elsewhere in `build_data.py` (look for any `os.listdir`, `glob`, or hardcoded `0[1-9]_` / `1[0-7]_` patterns — add `08_` and `18_–26_` where found).

**Risk:** low if NODE_TYPE_MAP is the only hardcoded list (it is per a quick search). Run `python3 build_data.py` immediately after the edit to verify.

---

### Item 4 — Themes → Motifs rename (the big one)

**Why:** academic accuracy. What `06_themes/` holds are motifs in the Stith Thompson sense, not themes. The rationale is in `ONTOLOGY-RATIONALE-2026-05-18.md` §3.5. Deferred to this batch because it touches build scripts (Lane B) + 339 nodes + cross-refs vault-wide.

**Where (vault-wide):**
1. `git mv 06_themes 06_motifs`
2. For every `.md` in `06_motifs/`: change `type: theme` → `type: motif`. Also `type: "theme"` → `type: "motif"`.
3. Vault-wide: every other content node that uses the `themes:` YAML field (or `themes-mentioned:`, `themes-instantiated:`, etc.) — rename the field to `motifs:`.
4. `build_data.py` `NODE_TYPE_MAP`: change `"theme": ["06_themes"]` → `"motif": ["06_motifs"]` (or just rename `"theme"` → `"motif"` AND the folder).
5. `build_data.py` line 541: `("themes", "has-theme")` → `("motifs", "has-motif")`. Also line 626 + 829 + 936 + any other "themes" string literal in `build_data.py`.
6. `build_dashboard.py`: any hardcoded `themes` / `theme` references.
7. `lint_yaml.py`, `fetch_thumbnails.py`, `review_thumbnails.py`, `fetch_wikidata_thumbnails.py`: same sweep.
8. `00_meta/CORE-THEMES.md` → `git mv` to `00_meta/CORE-MOTIFS.md`. Update the preamble pending-rename note (the rename is done now).
9. `00_meta/ONTOLOGY.md` §2 row 6 — remove the ⚠️ pending-rename markers; folder is now `06_motifs/`, type is `motif`.
10. `00_meta/LANES.md` line that says "06_themes/" — update to `06_motifs/`.
11. `00_meta/HOW-WE-WORK.md` §6 row 6 — update.
12. `00_meta/PROTOCOL.md` — update example references.
13. `src/js/engine/graph/mode.js` line 39 — change `{ value: 'themes', label: 'Themes', glyph: '◇', nodeType: 'theme' }` to `{ value: 'motifs', label: 'Motifs', glyph: '◇', nodeType: 'motif' }`.
14. `index.html` line 47 — change `data-view="themes"` → `data-view="motifs"` AND label `"Themes list"` → `"Motifs list"`.
15. Sweep for any other reference to the literal string `themes` as a type or folder in `src/js/`.

**Risk:** high — this is the invasive change. Write a single script (`scripts/rename_themes_to_motifs.py` or similar) that:
- Does the `git mv`
- Does the YAML find-replace via a Python AST walker (NOT a dumb regex — there are non-theme uses of the word "themes" in prose that must not be touched).
- Updates all hardcoded references in `build_*.py` and view modules.
- Runs `python3 build_data.py` at the end to verify nothing breaks.
- Refuses to commit if `python3 build_data.py` fails.

**Verification:**
- `python3 build_data.py` runs clean.
- `python3 build_dashboard.py` regenerates `DASHBOARD.md`; motif count = 339 (same as old theme count); no orphan/dead-link spike.
- Forge view loads; Motifs mode in dropdown shows the same wheel that Themes used to show.
- `grep -r "06_themes" .` returns ZERO hits (after the migration script).
- `grep -r 'type: "theme"' .` returns ZERO hits.

**Commit:** `opus-themes-to-motifs-rename-2026-05-XX: 06_themes → 06_motifs (academic accuracy per Stith Thompson)`

---

### Item 5 — Forge mode dropdown adds the 10 new node types

**Why:** the Forge tab's mode dropdown enumerates which node types are renderable. Without entries for the new types, John can't actually browse them via Forge.

**Where:** `src/js/engine/graph/mode.js`, the `MODES = Object.freeze([...])` block (currently lines 24–42).

**The additions (insert in slot-numbered order; existing entries keep their current positions):**

```js
// After existing entries, add:
{ value: 'languages',          label: 'Languages',           glyph: 'Ⓛ',  nodeType: 'language' },
{ value: 'astronomy',          label: 'Astronomy',           glyph: '☄', nodeType: 'astronomy' },
{ value: 'sacred-sites',       label: 'Sacred Sites',        glyph: '⛪', nodeType: 'sacred-site' },
{ value: 'theology',           label: 'Theology',            glyph: '✠', nodeType: 'doctrine' },
{ value: 'practices',          label: 'Practices',           glyph: '☸', nodeType: 'practice' },
{ value: 'material-culture',   label: 'Material Culture',    glyph: '⚱', nodeType: 'relic' },
{ value: 'pharmacology',       label: 'Pharmacology',        glyph: '⚗', nodeType: 'substance' },
{ value: 'divination',         label: 'Divination',          glyph: '⚆', nodeType: 'divination-system' },
{ value: 'calendars',          label: 'Calendars',           glyph: '☉', nodeType: 'calendar-system' },
```

Note: `places` mode already exists (line 41 — added previously). Reorder to slot 08 position if you want strict slot-order; otherwise leave.

Pick glyphs that don't collide with existing ones (current existing: ◉ ✎ ❡ ✦ ◆ ✚ ♩ ℵ △ ○ ⚖ ⚕ ∑ ▮ ◇ ⊙ ◐). The above suggestions all check.

**Also update:** the Forge status-strip `<select>` in `views/forge.js` if it has a hardcoded option list (it does — search for `forge-status-mode` in `forge.js`).

**Risk:** low. Mode dropdown is purely UI.

**Verification:** open Forge, dropdown shows 26 modes total; each new mode renders the corresponding new-folder content once Item 3 + Item 4 have shipped.

---

### Item 6 — Pre-commit hook regex widening

**Why:** today the hook's LANE_A regex is `^(0[1-9]_|1[0-7]_)` (covers 01–17 only). It doesn't classify the new folders 18–26 as Lane A. The hook will silently fail to detect cross-lane commits involving the new folders.

**Where:** `scripts/git-hooks/pre-commit` line 28 (per my earlier audit reading).

**The diff:**

```diff
- LANE_A="$(printf '%s\n' "$STAGED_ALL" | grep -E '^(0[1-9]_|1[0-7]_)' || true)"
+ LANE_A="$(printf '%s\n' "$STAGED_ALL" | grep -E '^(0[1-9]_|1[0-9]_|2[0-6]_)' || true)"
```

**Then re-install** the hook locally:
```bash
ln -sf ../../scripts/git-hooks/pre-commit .git/hooks/pre-commit
```

(Per the comment in the hook file itself.)

Also worth: add `^00_meta/ONTOLOGY-RATIONALE-.*\.md$` to the Lane A regex if not already covered by a broader 00_meta pattern. Per the c3 LANES.md update, the dated rationale docs are Lane A.

**Risk:** trivial.

**Commit:** can bundle with Item 5 or 7.

---

### Item 7 — Documentation final-state sweep

**Why:** after Items 3–6 land, several "pending" / "queued" / "⚠️" markers in the master docs become stale and should be cleaned.

**Where:**
- `00_meta/ONTOLOGY.md` — remove the ⚠️ pending-rename markers in the header preamble and §2 row 6.
- `00_meta/ONTOLOGY.md` §2 final paragraph — remove the "Build-script awareness gap" warning (now resolved).
- `00_meta/HOW-WE-WORK.md` §6 row 6 — remove the ⚠️ pending-rename mark; the build-script-awareness paragraph below the table.
- `00_meta/PROTOCOL.md` §1 — remove the "Build-script awareness gap" callout.
- `00_meta/CORE-MOTIFS.md` (renamed in Item 4) — remove the "pending rename" preamble note.
- `00_meta/HANDOFF.md` — update §3 "Deferred to next Lane B window" → mark each item DONE.
- `00_meta/STATUS.md` — one-line entry for the batch.
- `00_meta/ACTIVE-UX.md` — release the slot.
- Memory note for the batch closure.

**Risk:** zero. Pure doc hygiene.

---

## How to claim and execute

1. **Confirm Lane B is free** (`00_meta/ACTIVE-UX.md` empty).
2. **Claim** in `ACTIVE-UX.md`: `opus-deferred-laneb-batch-2026-05-XX` (or your handle) with explicit `Owns:` list covering: `src/js/views/forge.js`, `src/js/engine/graph/mode.js`, `index.html`, `build_data.py`, `build_dashboard.py`, `lint_yaml.py`, `fetch_thumbnails.py`, `review_thumbnails.py`, `fetch_wikidata_thumbnails.py`, `scripts/git-hooks/pre-commit`, `06_themes/` → `06_motifs/` (the rename), `00_meta/CORE-THEMES.md` → `00_meta/CORE-MOTIFS.md` (the rename), `00_meta/{ONTOLOGY,LANES,HOW-WE-WORK,PROTOCOL,HANDOFF,STATUS,ACTIVE-UX}.md`, plus the migration script you'll write.
3. **Execute Items 1–7 in order.** Items 3 + 4 + 5 + 6 must land before Item 7's doc cleanup (Item 7 says "X is done" so X has to actually be done).
4. **Commit cadence:** 4–6 commits, atomic per item or per logical group. Item 4 is one big commit (the rename script + its output). Items 1, 2, 3, 5+6, 7 are each their own.
5. **Verify after Item 4:** `python3 build_data.py` MUST run clean. If it fails, fix before any further commit. This is the single highest-risk step.
6. **Verify after Items 5+6:** open Forge in preview; check the dropdown has 26 modes; check the pre-commit hook refuses a deliberate cross-lane stage (try staging a content file + an src/ file together).
7. **Release the Lane B slot** in `ACTIVE-UX.md` after Item 7's commit.

---

## Estimated effort

- Item 1: ~10 min (after John sends EXPORT JSON)
- Item 2: ~15 min + verification
- Item 3: ~10 min
- Item 4: ~60–90 min (most of the effort — the migration script + careful verification)
- Item 5: ~15 min
- Item 6: ~5 min
- Item 7: ~15 min

**Total: ~2.5–3 hours**, in one Lane B window. Could split across two sessions if needed — Item 4 is the natural breakpoint (everything before it is small; everything after depends on it).

---

## Reference

- Ontology lock pass 2 rationale: `00_meta/ONTOLOGY-RATIONALE-2026-05-18.md`
- New-lens candidates audit (backlog for content agents after this batch lands): `AUDIT/new-lens-candidates-2026-05-18.md`
- Forge edge-state audit (FINAL DIAGNOSIS § Option B is Item 2 above): `AUDIT/forge-edge-state-invariant-2026-05-18.md`
- Current ontology state: `00_meta/ONTOLOGY.md`
- Current routing: `00_meta/HOW-WE-WORK.md`
- Current LANES path-map: `00_meta/LANES.md`

— end runbook, 2026-05-18 late evening. Ready to execute on the next Lane B claim.
