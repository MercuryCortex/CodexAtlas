# Session HANDOFF — 2026-05-28 (Codex flow + Bahá'í 100% template)

> **⚠️ READ THIS BLOCK FIRST.** Long session shipped the **Atlas Codex** end-to-end workflow + the **Bahá'í corpus as the 100%-verified template**. The progressive-disclosure pill (`Family → Books → Lens → ✠ Read`) is the locked UX pattern for every future religion. The reader-as-right-side-panel is locked. Massive content adds also landed: 12 empty corpora filled, 5,500-year Feminine Divine spine essay, 13-figure Abrahamic-empire spine, 319-figure Figures class. Multiple bug-fix passes. **Fresh agent should pick up at**: extend the same workflow + reader to **Christianity (Bible)** corpus as the next 100% target.

---

## 60-second TL;DR for the fresh agent

1. **The Codex UX pattern is locked.** The Atlas top bar shows `Family ▾ → Books ▾ → Lens ▾ → ✠ Read` with progressive lock states. Picking each step unlocks the next. State persists in LS at `atlas.codex.v1`. Lens filter scopes to ONE picked book (not whole family).
2. **The reader is a right-side panel** sliding in from the right at `width: min(560px, 48vw)`. Wheel stays visible and interactive on the left. Verses render with section headers + gold-dotted entity highlights + collapsible cross-tradition parallels.
3. **Bahá'í is 100% verified end-to-end** as the proof template. 2/2 books reader-ready (Kitāb-i-Aqdas + Kitāb-i-Īqān), Authors lens correctly returns Bahá'u'lláh.
4. **Atlas Codex coverage**: 142 SCRIPTURE_TEXTS entries · 103 / 372 books reader-ready (28%) · 40 of 42 corpora have ≥1 entry (only Druze + Yazidi empty, deferred per `feedback_deviant_bridges.md`).
5. **MASSIVE-WINS now 43 entries.** New Queen-of-Heaven 5,500-year Feminine Divine spine is the day's headline content add (essay + 2 hubs + 30+ source-tiered edges, all T1).
6. **Next 100% target: Christianity (Bible).** Bible corpus has 33 listed books, 19 covered. Same agent prompt template as Bahá'í (commit `50bb9b6`) applies. Estimated 14 entries to ship to 100%.
7. **Known issue (not blocking):** `radialWedgeLayout` has a degenerate-render bug when filter returns exactly 1 family / 1 node (e.g., Bahá'í Authors = 1 author). Bible / larger corpora won't hit it. See § "Known issues".

---

## What landed today (10 commits, all on main)

| Commit | What |
|---|---|
| `5175545` | mode: Codex moved to position 2 in class-pill (after Deities) |
| `b2dccaa` | content: 5,500-year **Queen of Heaven** Feminine-Divine spine — essay + 2 hubs + 30+ T1/T2 edges (Inanna → Mary, 11 stations) |
| `d2b1306` | docs: **Top 10 most striking MASSIVE-WINS** curated (43 findings) |
| `c4e5702` | docs: **BOARDS V2 new-UX rebuild spec** filed (awaiting John brief) |
| `b0bc06c` | codex: Family-dropdown label fixes (Qurʾān Nöldeke/Manzil differentiation + 20 corpora had mid-list cuts) + DOM-dup guard |
| `5d32f8a` + `50bb9b6` | content: **Bahá'í corpus → 100% verified** — Kitāb-i-Aqdas (Bahá'í World Centre 1992) + Kitāb-i-Īqān (Shoghi Effendi 1931) + new Hidden Words vault node |
| `38d5602` | codex: ✠ Read button + book-picker dropdown |
| `235e743` | codex: 4 bug-fixes (pill scoped to Atlas/Timeline, filter persists across view-swap, reader-as-right-side-panel, verse rendering w/ entity highlights) |
| `b73417d` | codex: Personae/Authors/Deities lenses wired + scrubber bounds vault-wide |
| `20ec0a2` | codex: **progressive-disclosure workflow** — Family → Books → Lens → ✠ Read with strict gating |

Plus the agent commits (committed earlier on behalf of agents that ran):
- `9f07473` — 13-figure Abrahamic-empire spine (Akhenaten → Constantine → Mehmed II)
- `148f07a` — docNode backfill across 125 SCRIPTURE_TEXTS entries

---

## Atlas Codex — the locked UX pattern

When user picks **✶ Codex** on the class pill (position 2):

```
┌──────────────────────────────────────────────────────────────┐
│ [ATLAS ▾] [Codex ▾]   [Family ▾] [Books ▾] [Lens ▾] [✠ Read] │
└──────────────────────────────────────────────────────────────┘
       master/class            ↑           ↑       ↑       ↑
                          always-on    book      locked  locked
                                       picker   until book picked
```

### The four pill buttons

| Button | Behavior | Locked until |
|---|---|---|
| **Family ▾** | 42-corpora dropdown, short labels (Bible · Egyptian · Vedas · Qurʾān (Nöldeke) · etc.) | always enabled when Codex is active |
| **Books ▾** | Book picker grouped by canonical section (e.g. PENTATEUCH / GOSPELS / PAULINE CORPUS for Bible). Books w/o reader content show greyed "reader text not yet written" | always enabled (lists all 130 books in "All families" mode, or family-filtered when a family picked) |
| **Lens ▾** | Personae / Authors / Deities — scoped to the ONE picked book's entities + author edges. Live counts; rows with 0 entries are disabled | a book is picked |
| **✠ Read** | Single-click action (no dropdown). Opens the right-side reader for the picked book | a book is picked |

### State (LS key `atlas.codex.v1`)

```json
{
  "familyId":    "bahai-corpus" | null,
  "bookTextKey": "bahai-kitab-i-aqdas" | null,
  "lensId":      "personae" | "authors" | "deities" | null
}
```

Family-pick → resets `bookTextKey` + `lensId` (workflow reset).
Book-pick → resets `lensId` (entity counts differ per book).
Lens-pick → toggle (re-pick same lens = clear it).

### Visibility

- Codex pill **only visible** when Atlas (forge) or Timeline view is active. CSS hard-guard: `body:not(.view-forge):not(.view-timeline) .app-pill--codex { display: none !important; }`
- Lens + Read are shown but dimmed (`is-locked` class) when no book picked.
- The filter latch (`local._codexFilterAppliedFor`) ensures the filter re-fires after view-swap (Atlas → Map → Atlas).

### The reader

Right-side panel, `width: min(560px, 48vw)`, slides in 220ms cubic-bezier. Wheel stays interactive on the left.

Reader DOM structure:
```
.forge-reader-pane
├── .forge-reader-topbar     ← Wheel button + title + canon badge
└── .forge-reader-body
    ├── .forge-reader-intro            (italic prose intro, source-cited)
    ├── .forge-reader-section × N      (each section heading + verses)
    │   └── .forge-reader-verse × N
    │       ├── .forge-reader-ref      (e.g. "Kitāb-i-Aqdas §1")
    │       └── .forge-reader-vtext
    │           └── .forge-reader-ent  (gold-dotted entity highlights)
    └── <details>.forge-reader-xtrad   (collapsible cross-tradition parallels)
        └── .forge-reader-xtrad-item.is-linked  (click → open referenced text)
```

ESC closes. ← Wheel closes. Click another book in Books-menu → reader content swaps in place. Click a cross-tradition `textId` link → reader navigates to that text.

---

## Bahá'í — the 100% template

**This is the proof-of-concept religion John wants every future religion to match.** Audit it first to understand the bar.

### What's done

- `bahai-corpus` in `src/js/app.js` SCRIPTURE_CORPORA lists 2 books:
  - `phase-7-003-kitab-i-aqdas` ✓ reader-ready
  - `phase-7-002-kitab-i-iqan` ✓ reader-ready
- SCRIPTURE_TEXTS entries:
  - `bahai-kitab-i-aqdas` — Bahá'í World Centre 1992 translation, 3 sections / 5 verses, includes the 1873 abolition clause (§72) + Manifestation doctrine + Greatest Name invocation
  - `bahai-kitab-i-iqan` — Shoghi Effendi 1931 translation, 3 sections / 3 verses, the central re-reading of Qurʾān 33:40 "Seal of the Prophets"
  - `bahai-hidden-words` — 3 sections of the Hidden Words (1858), repointed to new vault node `phase-7-048-bahai-hidden-words`
- Live workflow verified (commit `20ec0a2` test eval):
  - Lens shows Books 2 / Personae 0 / Authors 1 / Deities 0 — correct for Bahá'í (modern legal-doctrinal scripture, not narrative)
  - Authors lens correctly returns Bahá'u'lláh
  - Reader opens with full canonical content + intro + cross-tradition parallels + entity highlights

### The agent prompt template that worked

Commit `50bb9b6` was driven by an agent with this scope (use as template for Christianity):
- Pick ONE religion + its canonical books
- For each book: write a full SCRIPTURE_TEXTS entry with intro + 2-3 sections / 3-5 verses + entity annotations + cross-tradition parallels (every `textId:` must point to an existing SCRIPTURE_TEXTS key)
- Use canonical scholarly translations (cite explicitly)
- Both English + native-language originals where possible
- Mandatory verification script before exit: every book's docNode must have a SCRIPTURE_TEXTS entry
- No mid-sentence cuts (capture-quality rule per AGENTS.md)

---

## Next 100% target: Christianity (Bible)

Current state (per audit in `AUDIT/2026-05-28-scripture-ids-enumeration.md`):
- Bible corpus has **33 listed books**, **19 covered** (45%)
- 14 entries to write to reach 100%

**Books to fill** (from `src/js/app.js` SCRIPTURE_CORPORA['bible'].sections):

Pentateuch · source-critical strata: J, E, D, P sources (1 stub — phase-2-007-hebrew-bible-e-source needs entry)
Former Prophets · Deuteronomistic History: phase-2-019-deuteronomistic-history (no entry)
Wisdom & later writings: phase-2-034-books-of-kings (no entry)
Apocrypha & pseudepigrapha: phase-3-009-jubilees, phase-3-010-sibylline-oracles (no entries)
Canonical translations & recensions: phase-3-006-septuagint, phase-4-108-peshitta, phase-4-080-garima-gospels, phase-4-081-mashafa-henok-geez-1-enoch, phase-4-082-ethiopic-biblical-canon (no entries)
Pre-Gospel sources: phase-3-014-q-source (no entry)
Lamentations: phase-2-020-lamentations (no entry)

**Recommended scope for the next agent: just the most-canonical missing books first.** Probably Gospel of Matthew + Acts (already exist as scripture-texts → check), then fill the apocryphal + translation entries in a second batch.

---

## MASSIVE-WINS state

43 findings in `00_meta/MASSIVE-WINS-INDEX.md`. Top 10 curated at `AUDIT/2026-05-28-top-10-most-striking-wins.md` (John re-curated this file twice today). New entries:

- **#2 — Queen of Heaven Transmission Spine** (5,500 years, Inanna → Mary). The archaeologically tightest single point: same Coptic workshops in 3rd-5th c. Egypt produced both Isis Lactans and Maria Lactans icons in identical composition (Frankfurter 1998).

Long-form essays in `00_meta/MASSIVE-WIN-essays/`:
- `christianity-five-inheritances.md` (capstone)
- `executed-divine-claimant.md`
- `feminine-divine-transmission.md` (NEW today, 245 lines)
- `hermetic-transmission-chain.md`
- `soma-haoma-eucharist.md`
- `soul-exile-longing.md`
- `connector-nodes.md`

---

## Other shipped today

- **319 Figures class** (the ⚜ class-pill mode): 13 Abrahamic-empire spine figures wired with full source-tiered transmission edges (Akhenaten / Cyrus / Alexander / Antiochus IV / Augustus / Constantine / Theodosius / Justinian / Heraclius / Umar ibn al-Khattab / Charlemagne / Constantine XI / Mehmed II)
- **2 new event-node stubs**: event-saqifa-bani-saida-632, event-saxon-wars-772-804
- **BOARDS V2 spec** filed at `AUDIT/2026-05-28-boards-v2-new-ux-spec.md` — full rebuild plan for the legacy alchemy pinboard using the Atlas-era canonical primitives. Awaiting John brief on 8 architecture questions before any code.
- **Timeline scrubber bounds now vault-wide** (was mode-dependent → caused "jumping" feeling on class switches)

---

## Known issues (not blocking, for the next agent's awareness)

1. **`radialWedgeLayout` degenerate-render with 1 family / 1 node**
   When Lens filter returns exactly 1 node in 1 family (e.g., Bahá'í Authors = just Bahá'u'lláh), the wheel renders empty. Engine fix in `src/js/engine/layout/radial.js` — handle the 1-node case by enforcing a minimum worldExtent so the node centers visibly. **Bible / larger corpora won't hit this** (5+ authors across multiple families). ~10 LOC fix.

2. **Bahá'í wheel sparseness with Books-only filter**
   Atlas wheel shows 2 dots in "Other" family hull with the rest of the 24 family hulls visible as empty thin sectors. The layout engine already filters empty families (`radial.js:107`), so what's visible is decorative guide-rings — not a bug, but UX feels sparse. **Bible (33 books across 3 families) won't have this.**

3. **Scripture → back → Map routing bug** (reported by John 2026-05-28, NOT investigated yet)
   When user clicks sidebar `data-view="scripture"` then hits browser back, end state is MAP view instead of original Atlas. Likely a `setView('scripture')` URL-router quirk. Out of scope for today's work; flagged for next agent.

4. **Timeline scrubber labels jumped in earlier reports**
   Fixed in commit `b73417d` — bounds now vault-wide. If user still reports jumping, check whether they mean the SCRUBBER endpoints or the LAYOUT density (the 1× density rebase from commit `4c8a892` is a separate issue, was the agent's call not John's, can be reverted by tweaking BAND_H_BASE in `engine/layout/timeline.js`).

---

## Working tree state at session end

Uncommitted (pre-existing from previous agents, NOT today's work):
- `00_meta/HANDOFF.md` — old session handoff from 2026-05-27 (Safari perf)
- `00_meta/MASSIVE-WIN-essays/executed-divine-claimant.md` + `soul-exile-longing.md` — agent-touched, never committed
- `00_meta/lint-report.md` — auto-generated
- `04_persons/charlemagne.md` + `04_persons/umar-ibn-al-khattab.md` — agent partial work
- `06_themes/antichrist-figure.md` (untracked) — agent work
- `AUDIT/2026-05-24-dating-sweep-proposals.tsv` + `AUDIT/2026-05-24-dating-sweep-summary.md` (untracked) — older audit work

**None of these block the next agent.** Fresh agent should triage them (decide commit vs revert vs leave) before starting new work.

---

## Slot state for fresh-agent

- **Lane B (UX, single-slot)**: OPEN. Today's pass shipped the full Codex flow; next Lane B work should pick from: (a) extend the workflow to handle wheel-click-to-pick-book (currently only Books dropdown picks; clicking the wheel doesn't update state.bookTextKey), (b) fix the `radialWedgeLayout` 1-node degenerate case, (c) start BOARDS V2 per spec.
- **Lane A (content, multi-agent OK)**: OPEN. Highest-leverage next: Christianity (Bible) → 100% per the Bahá'í template.
- **Memories**: no new cardinal memory entries today. The Codex UX pattern (Family → Books → Lens → Read) is now the locked template — agents shouldn't redesign it.

---

## Pickup checklist for fresh agent

1. Read `00_meta/HOW-WE-WORK.md` (the standing pre-flight)
2. Read THIS file
3. Pick a track:
   - **Content** (Christianity 100%): dispatch a Lane A agent with the Bahá'í template prompt
   - **UX polish** (1-node-render fix, wheel-click-to-pick): take the Lane B slot
   - **Boards V2**: confirm the 8 questions in `AUDIT/2026-05-28-boards-v2-new-ux-spec.md` with John, then carve
4. Server: `lsof -ti :8742` — if no `serve-node.js`, restart via `mcp__Claude_Preview__preview_start` (config in `.claude/launch.json`)
5. Hard-reload Safari at http://localhost:8742 to confirm baseline before any edits

— closed by watcher 2026-05-28 PM
