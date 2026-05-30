# HANDOFF — 2026-05-30 (Codex flow + Timeline rigor)

**Session pickup point:** read this top-down. Don't skim. Specifically the **NEXT STEP** section and the **DO NOT** list.

---

## NEXT STEP (John's directive)

> *"this timeline needs an audit on dates for deities and the scripture next step before working on ingesting scripture etc..."*

**Before any new scripture content ingestion**, dispatch a multi-agent audit workflow over the vault's `date_earliest` / `date_latest` fields for:

1. **`03_deities/`** — every deity node's first-attested date and "active-cult" date range
2. **`02_documents/`** (all scripture / corpus declarations) — every book's composition date_earliest and date_latest

For each node, verify the dating against scholarship (Tier-1 sources per `00_meta/methodology.md`) and flag:
- Wrong single-year facts that should be ranges (most common — the timeline's new date-range slide rule, commit `1917a00b`, **requires honest date_latest values to declutter dense epochs**)
- Wrong values entirely (genuine scholarship errors)
- Missing `date_latest` where a range is genuinely attested

**Why this MUST come before scripture ingestion:** ingesting more scripture nodes with the same single-year-fact tagging style will compound the date-pile-up that the B-DATING-5 fix is supposed to solve. Fix the existing data first; new content inherits the right schema.

**Workflow shape (reference):** see `wf_c86c6d91-8c0` (religion-wedge audit) and `wf_c2cb93c0-0d7` / `wf_51c7b561-ce8` (VIEW-panel audit) for the pattern — 4 parallel goblins by region/era + 1 synthesizer. Per-religion / per-tradition split is the natural fan-out.

---

## What landed this session (10+ commits on `main`, chronological)

```
1917a00b Timeline date-range slide-right (B-DATING-5)
96cd9c21 Timeline X-rigorous Y-stack — math is the math (B-DATING-4)
e85b714f Color Theme cascade + wedge-label drift (workflow w1vggjpfl Fix 2+4)
202d1f6e Scriptures-mode Family Order responsive (workflow whcprrhsd Fix 1)
706ca53e religion wedges adopt canonical family palette
a7d27535 SCRIPTURE_IDS auto-derives from SCRIPTURE_CORPORA
645ee897 scriptures-mode default groupBy = corpus-religion (rule #9)
1917a00b ← (see top)
72e0bd0a Codex Layer 2 — book sub-wedges (info/logic, NOT style)
e4c86d83 Codex inner-entity-grid + single-corpus auto-drill (Layer 3)
957cbaf3 Codex section-hulls — engine rule #9 implementation (Layer 1)
08089fb2 HOW-WE-WORK §5 cardinal rule #9: chart hull-grouping is swappable
63f38ea7 Codex filter — stale layout cache fix (workflow wf_93b13f27-020)
024515d5 Codex breadcrumb surfaces on Scripture URL
9e2512c7 dev-panel re-gated + aside.detail view-owned
e98e47f2 legacy purge FINAL — scorched-earth, not stub-and-hide
60b2de8f scripture-radial NUKED — Atlas wheel is the only chart
```

### Three architectural locks

**(1) ONE CHART ONLY = the canonical Atlas/Forge wheel.** Per `feedback_per_view_hide_list_forbidden_2026-05-29.md` + HOW-WE-WORK §5 #8. The V01 scripture-radial sunburst is dead (deleted in `60b2de8f`). Codex/Scripture renders through the canonical Forge wheel.

**(2) Chart hull/wedge grouping is a SWAPPABLE PRIMITIVE.** Per `feedback_chart_family_swap_is_a_primitive_2026-05-30.md` + HOW-WE-WORK §5 #9. View declares `{groupBy, wedgeBy, pointSourceFn}`; engine consumes agnostic of mode. ONE engine, MANY spreads. Atlas-view: `groupBy = n.family`. Codex/scripture-view: `groupBy = corpus-section` or `corpus-religion`. Implemented in `radial.js` + `hull.js` + `forge.js`.

**(3) Scripture is the ROOT of the Atlas knowledge graph.** Per `project_scripture_is_the_root_of_truth_2026-05-30.md`. Every other chart (Pantheon, Timeline, Events, Personae) is a LENS on the scripture corpus. The Codex flow `family → corpus → book → LENS → READ` is the PRIMARY navigation. READ surface (annotated text + cross-tradition parallel panel) is the canonical end-deliverable where MASSIVE-WINS surface.

### What works end-to-end on `http://localhost:8742/?view=scripture`

| Surface | State |
|---|---|
| Codex breadcrumb (CODEX → CHRISTIANITY → BIBLE → ALL BOOKS → LENS → READ) | ✓ full flow |
| Auto-drill single-corpus religions (Egyptian, Hindu, Zoroastrian, Sikh, Druze, Yazidi, Bahá'í, Mormon) | ✓ |
| Section hulls per corpus declaration (Egyptian 5 epochs, Bible 9 sections, etc.) | ✓ |
| Book sub-wedges INSIDE section hulls (Layer 2) | ✓ |
| Entity-dot grid INSIDE book wedges (Layer 3 — Ra, Osiris, Khufu, etc.) | ✓ |
| All-families/All-scriptures grouping by corpus-religion (Plutarch in Egyptian wedge etc.) | ✓ |
| Canonical color palette across class filters (Egyptian gold whether you're on Deities/Persons/Scriptures) | ✓ |
| Family Order radios responsive (Opposites / Roots clustered / Chronological / Geographic sweep) | ✓ |
| Color Theme radios responsive (Atlas / Roots / Geography / Longitude / Cosmology / Time) | ✓ |
| READ button → opens annotated reader with cross-tradition parallel panel | ✓ |
| Timeline LIN mode places nodes at exact `date_earliest` | ✓ (B-DATING-4) |
| Timeline date-range slide-right within `[date_earliest, date_latest]` | ✓ (B-DATING-5) |

### Known follow-ups (deferred, NOT this session's work)

1. **Date audit on `03_deities/` and `02_documents/`** — the explicit John-directed NEXT STEP above.
2. **Vault content batches that expand single-year facts into honest ranges** so the B-DATING-5 slide algorithm has room to declutter. Don't do this BEFORE the audit — audit informs what's wrong.
3. **Timeline label-deconflict tightening** — labels still drift away from their dots in dense areas. Mostly cosmetic.
4. **Distribution: Age bands** in scriptures mode degrades inside narrow book sub-wedges (workflow `w1vggjpfl` Fix 3, low priority; Organic + Vogel serve the use case).
5. **VEDIC + OTHER fallback wedges** in scriptures mode — non-corpus docs fall back to `n.family`, creating duplicate wedges next to their religion-wedge. Easy 5-line fix in `forge.js` (change fallback from `n.family` to `'Other'`).
6. **Show map** — intentional roadmap stub.

---

## DO NOT (cardinal rule violations to avoid)

- **DO NOT** add a per-view CSS hide-list. Per HOW-WE-WORK §5 #8 — V01 chrome is DELETED, not hidden via `body.view-X { .legacy { display: none } }`. If you find V01 markup, delete the markup AND its JS callers in the SAME commit.

- **DO NOT** hard-code `n.family` in any layout primitive. Per HOW-WE-WORK §5 #9 — grouping is a parameterized `groupBy` input. If you add a new chart mode, add a new `groupBy` function, NOT an `if (mode === 'X')` branch inside `radialWedgeLayout`.

- **DO NOT** report completion with "zero console errors." Per `feedback_describe_what_human_sees`: the screenshot is the success criterion.

- **DO NOT** skip the server/cache ritual before claiming a fix shipped. `lsof :8742` → ONE pid of serve-node.js, Cmd-Option-E in Safari to empty caches, hard reload, screenshot. Python http.server squatting on :8742 has cost ~90 min twice this month (see `feedback_server_hijack_and_safari_cache_2026-05-27`).

- **DO NOT** ingest scripture content before the date audit lands. John's explicit sequence.

- **DO NOT** treat corpus thinness (Egyptian 10 books, Bible 33 books) as an engine problem. It's Lane A content work. Per `feedback_chart_family_swap_is_a_primitive_2026-05-30`.

- **DO NOT** menu-pick in fix mode. Per `feedback_execute_dont_menu_2026-05-26` — when John asks for something, execute. Surface a real fork only when one genuinely exists.

---

## Verification ritual for the fresh agent on resume

```bash
lsof -ti :8742         # must be ONE pid of serve-node.js
git log --oneline -10  # confirm landing at 1917a00b
git status --short     # 5 Lane-A content files are pre-existing John edits — leave them
```

Load `http://localhost:8742/?view=scripture` in Safari (Cmd-Option-E first), hard reload, and verify:
- Codex breadcrumb visible
- Switching ATLAS → Deities → Persons → Scriptures keeps Egyptian wedge gold
- Family Order radios re-arrange the wheel
- Click Codex → Egyptian (ancient) → wheel shows 5 epoch hulls with book wedges + entity dots
- Click Books → Pyramid Texts → READ → reader opens with annotated text

If any of those fail, the cache ritual didn't fire. Don't debug logic until the ritual is clean.

---

## Memory pointers (read these BEFORE coding)

Located at `~/.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/`:

- `project_scripture_is_the_root_of_truth_2026-05-30.md` — the architectural north star
- `feedback_chart_family_swap_is_a_primitive_2026-05-30.md` — cardinal rule #9 full doctrine
- `feedback_per_view_hide_list_forbidden_2026-05-29.md` — cardinal rule #8 full doctrine
- `feedback_describe_what_human_sees.md` — believe what John reports; screenshots > console
- `feedback_server_hijack_and_safari_cache_2026-05-27.md` — the cache trap ritual
- `feedback_execute_dont_menu_2026-05-26.md` — in fix mode, execute don't menu-pick
- `feedback_severity_dogma_2026-05-24.md` — three strikes = terminate
- `00_meta/HOW-WE-WORK.md §5` — cardinal rules 1-9 (rules 8 + 9 most relevant to this session)

---

## One sentence

The Codex/Scripture chart system + timeline math both work correctly now; **next step is a multi-agent audit of vault dates on deities + scriptures BEFORE any new scripture-content ingestion** — wrong single-year facts will pile up the timeline regardless of how good the engine math is.
