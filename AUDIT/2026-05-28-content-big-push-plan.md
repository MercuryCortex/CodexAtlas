# Content Big Push — Plan (2026-05-28)

**Filed:** 2026-05-28, post BOARDS V2 carve-plan completion
**Status:** ACTIVE — agents dispatching in parallel

The V2 app surface is complete (Forge, Codex, Boards, Map/Star Map skeletons, inspector, edges, save/load, legacy isolation). The next frontier is **content depth**. The vault is 4,558 nodes thick on the heavy lenses (persons, deities, themes) but **starved** on the conceptual / investigative lenses where the most interesting cross-tradition stories live (pharmacology, divination, calendars, practices, philosophy, medicine, astronomy, mathematics, languages).

This push fires four parallel ingestion agents to fill those gaps + close the remaining scripture corpora.

---

## The four lanes

### Lane A — Scripture corpora to 100% reader-ready

**Goal:** close the last 11 SCRIPTURE_CORPORA rows.
**File:** `src/data/scripture-texts.js` (currently 196 entries, target ~280).
**Owner:** `agent-codex-corpora-finisher-2026-05-28`

Remaining corpora + missing entry counts:
- Vedas (15)
- Tipitaka (12)
- Nag Hammadi (11)
- Hermetica (10)
- Ethiopic Tewahedo broader (8)
- Confucian (6)
- Greek-scripture (6)
- Islamic-theological (6)
- Tao (5)

Per `feedback_delegated_agent_content_filter_2026-05-27.md`, religious content batches must be **encyclopedic + factual** in framing, **3-5 entries per batch**, **Tier-1 translations** with primary-source citations. Cross-tradition wiring required on every entry.

### Lane B — Thin lens expansion (the 26 ontology folders)

**Goal:** double the starved lenses.
**Folders:** individual files in `22_practices/`, `23_material_culture/`, `24_pharmacology/`, `25_divination/`, `26_calendars/`, `13_morals/`, `19_astronomy/`, `18_languages/`, `15_philosophy/`, `16_mathematics/`, `17_medicine/`, `21_theology/`.
**Owner:** `agent-lens-expansion-2026-05-28`

Current counts: 24_pharmacology 6 · 26_calendars 12 · 25_divination 14 · 22_practices 12 · 23_material_culture 12 · 13_morals 12 · 19_astronomy 11 · 18_languages 11 · 15_philosophy 9 · 16_mathematics 8 · 17_medicine 8 · 21_theology 18.

Target: get each to **20-25 nodes** with high investigative value — the kind of nodes the Boards V2 right-click expansion + cross-tradition wires actually surface usefully. Each new node is a markdown file in its folder, properly YAML-front-matter'd, with refs[].

### Lane C — MASSIVE-WIN essays + Boards preset library

**Goal:** add 10+ new transmission chains to `00_meta/MASSIVE-WINS-INDEX.md` and regenerate `src/data/boards-library.js`.
**File:** `00_meta/MASSIVE-WINS-INDEX.md` (currently 43 entries).
**Owner:** `agent-massive-wins-expander-2026-05-28`

Target additions — documented cross-tradition transmission chains we haven't written up yet:
- Persian theological vocabulary → Greek philosophical vocabulary (Zoroaster → Plato)
- Babylonian astronomy → Greek astrology → Renaissance hermeticism
- Ethiopian Christianity → Beta Israel → modern Falasha studies
- Tang Dynasty Buddhism → Heian Japan → Zen → Western mindfulness (we have D.T. Suzuki branch but not the Tang transmission)
- Mithras Mysteries → Sol Invictus → Constantine → Christianity
- Tibetan Bön → Tantric Buddhism interchange
- Sufi → Ibn ʿArabi → Wahdat al-wujūd → Indian Bhakti convergence
- More if time permits

Each entry follows the existing INDEX format: section heading, **bolded thesis**, paragraph evidence, source citations, `Nodes: <node-A>, <node-B>` line (placeholders shown as `<node-A>`/`<node-B>` — replace with real slugs when filling). Then re-run `scripts/build-boards-library.py` so Boards V2 Investigation Library auto-picks them up.

### Lane D — Vault data integrity (thumbnail audit)

**Goal:** scan all `node.thumbnail` URLs for obvious mismatches (e.g. the Amduat node pulling an AMD CPU thumbnail), filter or null the bad ones, report a fix list.
**Files:** vault data → produces a fix-list at `AUDIT/2026-05-28-thumbnail-audit.md`.
**Owner:** `agent-thumbnail-auditor-2026-05-28`

Lane D is the **only Lane B (UX) lane** in this push — it runs in read-mostly mode, producing a report rather than editing content files. The actual fixes go in a follow-up commit once John reviews the report.

---

## Coordination rules

1. **No agent touches `src/js/app.js`, `src/styles/app.css`, `index.html`, or any `.js` other than the lane-owned data file.** Per `feedback_content_agents_dont_touch_appcode_2026-05-15.md`, content agents touching app code has bricked the site twice. Pre-commit hook enforces this.

2. **Each agent commits in tight cycles** (after each batch of 3-5 entries). Per `feedback_parallel_agent_sweeps_2026-05-15.md`, autonomous agents periodically commit uncommitted work; tight commit discipline keeps attribution clean.

3. **Each agent appends a one-line entry to `00_meta/STATUS.md`** on completion. Per `feedback_always_log_work_2026-05-15.md`.

4. **All [[wikilinks]] must point to a real node before commit.** Per `feedback_wiring_law_2026-05-15.md` (cardinal). Missing target → stub the file in the same commit OR drop the wikilink.

5. **No content overlap between lanes A and B.** Lane A writes to `src/data/scripture-texts.js`; Lane B writes to individual `NN_lens/*.md` files. Lane A entries can wikilink to Lane B nodes once Lane B has committed them.

---

## Out of scope for this push

- BOARDS V2 polish (carve plan complete)
- MAP V2 / STAR MAP V2 build-out (deferred to next session)
- Codex pill UX (working as locked)
- Forge engine perf (separate spec)
- Legacy contamination audit (resolved 2026-05-28 `b73c9bb`)

---

*Plan ends. Agents dispatched in parallel; see commits.*
