# Handoff — fresh-session pickup

**Last updated:** 2026-05-14 ~22:00 (after the `opus-hermetic-1` / `opus-scripture-2` / infra-sweep block — vault is now under git for the first time).
**Read me first if you're a fresh Claude Code session opening this vault.**

---

## 🆕 Session 2026-05-14 late-PM closing remarks (read this first)

### Headline change for new agents

The vault is **now under git** (initialized this session — `git log` shows 4 commits; the housekeeper agents are committing their own batches). **Your batch should commit at end-of-batch** — do not leave uncommitted state. Use `git add -A && git commit -m "<handle>: <one-line>"` with the `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer. Don't push; there is no remote yet (per John's intent).

### New tools you should run during pre-flight

In addition to reading DASHBOARD + canonical-slugs + methodology + per-phase _TODO:

```bash
python3 lint_yaml.py            # 0.3s — flags missing YAML, slug drift, date inversions, dead wikilinks
                                # writes 00_meta/lint-report.md; --strict exits 1 on any ERROR
```

The DASHBOARD now also has an **"Open AUDIT proposals"** section at the top listing all 12 standing audits in `AUDIT/`. Read these *before* starting an architectural batch — proposals there have been sitting unimplemented across multiple sessions because the work-queue routing only surfaces unstubbed-wikilink targets, not the architectural extensions in `AUDIT/04_methodology_proposals.md` (material-witness layer, geographic map view, scholar role-class, new edge types).

### What just finished in this block (post-flood-1)

| Batch | Scope | Count / artifact |
|---|---|---|
| `opus-hermetic-1` | Corpus Hermeticum primary-text deepening: CH XIII rebirth dialogue, Stobaean Hermetica + Kore Kosmou, Armenian Definitions (Mahé), NHC VI,7 Prayer of Thanksgiving, NHC VI,8 Coptic Asclepius; persons Fowden / Copenhaver / Nock / Festugière / Mahé / van Bladel / Tat / Lactantius; themes hermetic-rebirth / hermetic-piety / hermetic-cosmogony; events Stobaeus c500 / Sabian-Harranian transmission c800–1000 | 18 nodes + 4 edge-sweeps |
| `opus-scripture-2` | Scripture-view corpora wiring: **Hermetica** (13 books × 6 sections) + **Nag Hammadi** (16 tractates × 8 codices) + **Qurʾān** (single-island starter — 39 entities, the densest single hull in the wiring pass). Scripture tab now has 6 live corpora total (Bible · Kebra Nagast · Ethiopic Tewahedo · Hermetica · Nag Hammadi · Qurʾān) | app-code only |
| `AUDIT/10_app-and-infrastructure-audit.md` | App / engineering / UX / infra audit, complementary to the content-side audits 00–09. Headline: no git, no CI, no URL routing, no map view, no responsive layout, no PWA, no test suite. Top-10 fix list. §6 surfaces the structural meta-finding that DASHBOARD doesn't surface AUDIT proposals so they rot. | new audit |
| infra-sweep (this agent) | Three fast+critical audit-10 fixes: **`git init`** + .gitignore (later extended by housekeeper-2 to also ignore data.js + per-phase _TODO + .obsidian/workspace.json + .claude/), **`build_dashboard.py` → "Open AUDIT proposals" section** at top of DASHBOARD, **`lint_yaml.py`** stdlib linter (0.3s; ERROR/WARN tracks; CI-ready). Caught + fixed 1 ERROR (empty `tradition-slavic.md` — filled with proper stub). | 2 commits, 1 stub fix, 4 audits surfaced |
| concurrent agents (housekeeper-1, housekeeper-2, others) | Vault-wide cleanup including .obsidian/{app,appearance,core-plugins,graph}.json normalization, .gitignore extension, AUDIT/12 status track, dashboard regen | tracked in their own commits |

**Vault delta this block:** ~1681 → **1691 nodes scanned** by the linter at session-close (live count likely 1700+ as concurrent agents land work) · dead-link ratio improved to **3.6%** · 9556 edges (likely 9700+ after the in-flight commits land).

### What's still in flight at session close

Multiple agents have uncommitted concurrent work staged at session-close (the final session-close commit will sweep these). If you start a fresh session immediately, do `git status` first — there may be loose state.

### Top-of-mind things for the next session

1. **Hash-based URL router** — fastest remaining audit-10 win (~50 lines, ~1hr). Unblocks every "share with someone" use case.
2. **`.github/workflows/check.yml`** — needs git remote first. When John adds one, this is a 1-day setup that gives CI on `lint_yaml.py --strict` + `build_dashboard.py`.
3. **`AUDIT/04_methodology_proposals.md` items** — material-witness `09_material/` layer, geographic Map view, scholar role-class — all still untouched. The DASHBOARD now surfaces these so any pre-flight will see them.
4. **Lint warnings to chip away at** — 34 schema/date warnings (mostly the `id: foo` vs file stem `event-foo` / `tradition-foo` drift documented in scripture-1 v2's open-gap list). Mechanical fix; a one-shot script could correct them.

### Wins-log convention (added this block)

`00_meta/INVESTIGATION-LEADS.md` is the **standing growing log** of MASSIVE-WIN cross-tradition transmission-edge findings, unexpected connections, textual shocks, and structural framework discoveries. Items numbered continuously across all batches (currently 1–37); items 26–37 were appended in this block. **When your batch surfaces a cross-tradition transmission edge or unexpected connection, append a numbered entry to this file** — it is the source-of-truth for any future "highlights" / "discoveries" section of the public-facing atlas. See the file footer for the format convention.

---

---

## 🆕 Session 2026-05-14 PM closing remarks (most recent — read this first)

> This block is the latest fresh-session-pickup. The original 2026-05-14 morning handoff follows below; it remains valid context but is partly historical now.

### What just finished (5 batches, this session)

| Batch | Scope | Count |
|---|---|---|
| `opus-ethiopian-1` | Aksumite-to-modern Tewahedo + Coptic/Oriental-Orthodox parent layer (foundational Ethiopian Christian wedge) | 37 nodes |
| `opus-ethiopian-2` | Ethiopian-canonical figures: Watchers, full Enochic 7-archangels, Jubilees Mastema + Angel-of-Presence, Parables Son-of-Man + Head-of-Days, pre-Christian Aksumite pantheon (Almaqah/Mahrem/Astar/Beher/Meder), Meqabyan trio | 21 nodes |
| `opus-ethiopian-3` | Scripture-view Ethiopian corpora wiring (Kebra Nagast + Ethiopic Tewahedo Broader Canon) | app-code only |
| `opus-ethiopian-4` | Extra Ethiopian-canonical books (4 Ezra, Mashafa Kidan, Sinodos, Yosippon) + characters (Hermas, Cainan, Shepherd, Lady-Ecclesia, Mary-of-Zion) + 4 more Watchers + 4 Nephilim **incl. Gilgamesh-Nephilim MASSIVE-win** | 17 nodes |
| `opus-flood-1` | Cross-tradition Flood wedge: 9 flood-heroes across Mesopotamian/Hebrew/Greek/Vedic/Chinese traditions + Matsya/Bergelmir/Gonggong + Berossus + George Smith + Ovid Met 1 + Black Sea Deluge 1997 + Ark/Rainbow/Ararat symbols + flood-motif theme upgrade | 17 nodes + theme upgrade |

**Vault delta across the session:** ~1467 → **1767 nodes** · dead-link ratio held in the 3.4–4.6% band · final state **3.4%** · edges grew to **10,561**.

### What's still in flight (don't collide with)

Check `ACTIVE-AGENTS.md` at-a-glance table at the top before picking work. As of close-out, in-flight content batches:
- **`opus-hellenic-3`** — Mystery-cult capstone (Iacchus, Triptolemus, Apuleius, Bacchae, Oresteia).
- **`opus-gaps-1`** — Coptic/Oriental-Orthodox founders + Buddhist follow-ups + dead-link closure. Owns several slugs I was tempted to do (Dioscorus, Severus, Jacob Baradaeus, Shenoute, hagiography theme, tewahedo-christology). **DO NOT DUPLICATE.**

### What the user explicitly wants done next (open gaps from this session's batches)

The user's framing across the session: **"MASSIVE wins"** = cross-tradition tracing edges from later traditions back to older ones, especially anything Christianity → older. **And "across all families"** when adding a thematic cluster (flood, etc.). The user prefers terse onboarding → dig style; don't over-plan.

**Ethiopian wedge — remaining ~15-20% (priorities from opus-ethiopian-4's open-gaps section):**

1. **Modern Ethiopia + Beta Israel** — historical [[menelik-ii]] (defeated Italy at Adwa 1896), [[tewodros-ii]], [[yohannes-iv]], [[fasilides]], [[susenyos-i]], [[yekuno-amlak]]; events: [[event-battle-of-adwa-1896]] (a huge anti-colonial moment), [[event-italian-invasion-of-ethiopia-1935-1941]], [[event-ethiopian-church-autocephaly-1959]], [[event-derg-period-1974-1991]]; Beta Israel tradition + [[abba-sabra]] + [[event-operation-moses-1984]] + [[event-operation-solomon-1991]].
2. **Yodit/Gudit** — legendary 10th-c. Jewish queen who attacked Aksum.
3. **17th-c. Zara Yacob the philosopher** — distinct from the 15th-c. emperor [[zara-yaqob-emperor]]; *Hatata* author. Authenticity contested (Conti Rossini 1920 forgery claim vs. Sumner 1976 authenticity defense).
4. **Walatta Petros as a person node** — her hagiography exists as [[phase-7-040-walatta-petros-hagiography]] but she herself does not.

**Flood wedge — remaining ~10-15% (priorities from opus-flood-1's open-gaps section):**

5. **Mesoamerican flood-survivors** — Tata + Nene (Aztec Nahui Atl); the wooden-men flood from Popol Vuh (already in [[phase-8-001-popol-vuh]] but no character nodes).
6. **Andean Viracocha-era flood** + Pachakamak.
7. **Polynesian flood-narratives** (Hawaiian, Maori).
8. **Tiddalik the frog** (Australian Aboriginal).
9. **Native American flood-narratives** (Pacific Northwest, Inuit, Algonquian — extensive corpus).
10. **Babel-und-Bibel controversy 1902–1904** as event + **Friedrich Delitzsch** as person — the German-Protestant institutionalization of comparative-religion question after Smith 1872.
11. **Andrew George** and **W.G. Lambert** as person nodes — the critical-edition editors of Mesopotamian flood texts.

**Sister Oriental Orthodox layer (opus-gaps-1 owns some of this):**

12. Whatever opus-gaps-1 doesn't close: tradition-malankara-syrian (Indian Saint Thomas Christians); founders Severus/Dioscorus/etc. that opus-gaps-1 didn't get to.

### Pre-flight protocol (mandatory — see `AGENTS.md` at vault root for the 60-second version)

```
1. Read this HANDOFF.md (you're here).
2. Read 00_meta/STATUS.md — the recently-completed batches headlines.
3. Read 00_meta/ACTIVE-AGENTS.md at-a-glance table — DO NOT COLLIDE with in-flight slugs.
4. Read 00_meta/canonical-slugs.md before naming any new node — slug drift was the #1 dead-link source.
5. Read the relevant 00_meta/schema-<type>.md for the node type you're creating.
6. Append your `opus-<wedge>-<n>` claim block to ACTIVE-AGENTS.md (table row + full block) before starting.
7. After your batch: `cd "~/Desktop/Codex Atlas" && python3 build_data.py && python3 build_dashboard.py`
8. Update your claim block to `Status: finished` with full delivery list + MASSIVE-win edges + open-gaps for next agent.
9. Add a one-paragraph entry to STATUS.md "Recently completed batches" block.
```

### Memory pointers (for future sessions of mine)

Memory dir: `~/.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/`

Already saved:
- `MEMORY.md` (index) + `project_codex_atlas.md` + `user_role.md` (John) + `feedback_massive_wins.md` + `feedback_preflight_protocol.md` + `feedback_multi_agent_coordination.md` + `project_ethiopian_wedge.md` + `project_audit_folder.md`.

The feedback_preflight_protocol.md was extended mid-session by another agent (opus-housekeeper-1) to include the AGENTS.md + ACTIVE-AGENTS at-a-glance table reading steps. The `feedback_multi_agent_coordination.md` covers the register-your-batch-in-the-group protocol that John explicitly asked for.

### Quick-start commands for a fresh session

```bash
# verify write access
touch "~/Desktop/Codex Atlas/03_deities/_perm_test" && rm "~/Desktop/Codex Atlas/03_deities/_perm_test" && echo "OK"

# state-of-vault snapshot
cd "~/Desktop/Codex Atlas" && head -40 00_meta/DASHBOARD.md

# in-flight agents to coordinate with
head -33 00_meta/ACTIVE-AGENTS.md
```

### One-line recommendation for the next agent

**The highest-leverage next batch is modern Ethiopia + Beta Israel** (#1 above) — this closes the most-visible remaining gap in the user-prized Ethiopian wedge: Battle of Adwa 1896 is a single huge moment that connects the wedge to global late-19th-c. anti-colonial history. Roughly 12-15 nodes; ~30-40 minutes of focused work.

---

## (Original 2026-05-14 morning handoff continues below — partly historical now)


The user is John (memory at `~/.claude/projects/-Users-user-Desktop-John-Bio/memory/`). The vault is **Codex Atlas** at `~/Desktop/Codex Atlas/`. The project is a cross-tradition investigation tool — a map of every named deity, primary religious document, key historical figure, event, theme, and tradition across time, plus the people behind the texts (authors, redactors, scribes, translators).

## Why this handoff exists

The previous session was started in the old folder `~/Desktop/Gnostic Path/`. The folder was renamed to `Codex Atlas` mid-session, and `~/.claude/settings.json` was updated to whitelist the new path. **But agents spawned from the previous session inherited a broken sandbox** — they could only write to `00_meta/` and `src/js/` because their working-directory inheritance was tied to the now-renamed parent path.

**You, in this fresh session, should have full write access to the entire vault.** Verify before launching any agents:

```bash
touch "~/Desktop/Codex Atlas/03_deities/_perm_test" && rm "~/Desktop/Codex Atlas/03_deities/_perm_test" && echo "OK"
```

If that succeeds, the sandbox is healthy and you can proceed.

## Vault state (as of end of previous session)

| Category | Count |
|---|---:|
| Documents | 202 |
| Deities | 227 |
| Persons | 325 |
| Events | 46 |
| Themes | **171** (just expanded — 29 new themes added by hand from the staged drafts) |
| Traditions | 79 |
| **Total nodes** | **1,049** |
| Graph edges | 3,579 |
| Dead-link occurrence ratio | 6.4% |

Live state is always in **[DASHBOARD.md](DASHBOARD.md)** (regenerated by `python3 build_dashboard.py`).

## Pre-flight protocol (mandatory before any work)

1. Read **[DASHBOARD.md](DASHBOARD.md)** — live priority queue, top unstubbed wikilink targets, orphan nodes, quality issues.
2. Read **[canonical-slugs.md](canonical-slugs.md)** before naming new files — avoids the slug-drift problem.
3. Read **[methodology.md](methodology.md)** — sets investigation posture, quality bars, edge-typing rules.
4. Per phase, read the phase's auto-generated `02_documents/_phase-N-…/_TODO.md`.

## TWO PENDING AGENT BATCHES — relaunch these in this fresh session

### Batch A — Atlantis + Sumerian + Modern Reception
The brief is below in the `AGENT BATCH A` section. Failed in the previous session due to the sandbox issue. The Atlantis investigation is the user's flagged "speculative tracing wedge" — Plato → Donnelly → Blavatsky → Cayce → Hancock, plus the antediluvian-civilization cluster connecting Sumerian King List + Genesis + Plato.

### Batch B — Christianity NER deepening
We already did a Christianity 0–300 CE pass that added 83 persons (apostles, Pauline circle, apostolic fathers, apologists, heresiarchs, persecuting emperors, named martyrs). The user explicitly wants Christianity as the densest tracing wedge: every connection from Christianity back to an older Egyptian / Mesopotamian / Mystery / Platonic source = "MASSIVE win". Next pass extends to 300–800 CE + every named figure in the Hebrew Bible / NT / Patristic corpus that's still missing.

## User's strategic framing (from previous session)

> *"We're building an investigation tool. We should have literally everyone mentioned in the Bible and other texts and the people behind them. Christianity is without a doubt where we can find the most characters and info — and from there we also will be able to trace back other influences and gnostic paths. If we any moment can establish a connection between Christianity and an older religion from Egypt or whatever, THAT for us is a MASSIVE victory. This is what is all about — connections with deep long roots, not easy without we doing the small steps."*

**Tier order:**
- Tier 1 (current focus): named persons mentioned in any of the 202 docs — bounded, ~800–1,500 unique names total
- Tier 2: major secondary figures within established traditions
- Tier 3: comprehensive named-entity completion across canonical primary texts
- Tier 4: critical-edition / reception-history layer

## Project name and identity

- **Codex Atlas** — final name (renamed from "Gnostic Path" mid-previous-session)
- Vault root: `~/Desktop/Codex Atlas/`
- Atlas viewer: `index.html` opens in browser, loads `src/styles/app.css` + `src/js/app.js` + `data.js`
- Build tools: `python3 build_data.py` (rebuild atlas data) + `python3 build_dashboard.py` (rebuild work queue)
- Settings: `~/.claude/settings.json` whitelists `~/Desktop/Codex Atlas/` for full agent access

## UI features that exist (verify they work — don't re-implement)

- **Pantheon view** (radial wedge graph of deities by family)
  - Visual family filter (click legend or footer dropdown) — fades non-matching, stays in position
  - Hover reveals cross-family edges
  - **Click locks selection** (sticky); click connected node = additive; click unrelated = reset; click empty = clear
  - Font hierarchy by degree tier (top 8% / 30% / 65% / rest)
  - Min-wedge-size floor so tiny families (Christian, Celtic) are still visible
  - Family labels horizontal with leader-line ticks
  - Burger toggle on legend (`≡`)
- **Documents view** (polar time-by-family chart)
- **Timeline view**
  - Phase bands + sub-era markers (Bronze Age through Nag Hammadi)
  - **Gap compression**: any gap > 400 years between adjacent dated nodes is squished to ~80 yr of visual space with a "// X yr //" break marker
  - Dots and labels grow on zoom-in (capped)
  - Dynamic date resolution — finer ticks as you zoom in
- **Map thumbnail** bottom-right of Pantheon/Documents/Timeline — pulsing gold dot on hovered deity's region. 559 of 1,049 nodes already have geo coords. Expand by adding entries to `00_meta/locations.md`.
- **Reset filters button** in footer (clears family + type + search + theme in one click)
- **Style dropdown** in header (color palette + 3 font themes: Classical / Modern / Scholarly)
- **Edge lines**: thin baseline (0.18–0.42 px), 1.6 px max when highlighted, `vector-effect: non-scaling-stroke` so they stay constant at any zoom

## What was JUST fixed in the final UI pass

1. **Tooltip tracks mouse correctly** — was using `position: absolute` which broke clientX/Y mapping; now `position: fixed` + `z-index: 1000`.
2. **Dim nodes ignore pointer events** — `.node-circle.dim` and `.node-circle.filter-dim` now have `pointer-events: none`. Locked-out / filter-dimmed nodes no longer catch hover.
3. **Panel toggles no longer reset view state** — opening/closing the right detail panel (or left nav) used to call `setView(STATE.view)` which destroyed zoom, selection, hover, map state. That call was removed; CSS transitions handle the layout shift while preserving everything else.
4. **Edge lines thinner + non-scaling-stroke** — all `EDGE_STYLE` widths reduced ~35%, hot ceiling at 1.6 px (down from 2 px).

## Active infrastructure files (auto-generated; don't edit by hand)

- `00_meta/DASHBOARD.md` — live state-of-vault
- `00_meta/dead-links.md` — priority queue
- `00_meta/orphan-nodes.md` — zero-edge nodes
- `00_meta/quality-issues.md` — status-bar violations
- `00_meta/canonical-slugs.md` — slug registry
- `02_documents/_phase-N-…/_TODO.md` per phase

Manually-edited (safe to touch):
- `00_meta/locations.md` — region → lat/lon lookup for the map thumbnail
- `00_meta/themes-audit.md` — themes-quality agent identified 10 thin Tier-A themes that should be expanded + flagged `final-judgment` ↔ `end-times-judgment` as merge candidate
- `00_meta/themes-to-create.md` — STAGING FILE; the 29 themes it contained were already split out into individual `06_themes/` files. **Safe to delete.**

## Quick start for the fresh session

After running the permission test above, your first action should be:

```
"Run Atlantis + Sumerian + Modern Reception agent — see HANDOFF.md BATCH A brief."
```

Or:

```
"Run Christianity 300–800 CE follow-up agent — see HANDOFF.md BATCH B brief."
```

Or work through the dead-link queue:

```
"Read DASHBOARD.md and stub the top 20 unresolved targets in 06_themes/."
```

---

## AGENT BATCH A — Atlantis + Sumerian + Modern Reception (full brief)

### Thread A: ATLANTIS

**Documents (`02_documents/_phase-3-…/` and `_phase-7-…/`):**
- `phase-3-022-plato-timaeus-critias-atlantis.md` — Plato Timaeus 24a–25d + Critias. ~-360. Refs: Vidal-Naquet 1964, Brisson, Gill 1980.
- `phase-7-033-donnelly-atlantis-antediluvian-world.md` — Donnelly 1882. Jordan 2001, Feder 2011.
- `phase-7-034-blavatsky-atlantis-root-race.md` — *Secret Doctrine* 1888 fourth-root-race. Tier 4. Hanegraaff 1998, Goodrick-Clarke 2008.
- `phase-7-035-cayce-atlantis-readings.md` — ~1923–1944. Tier 4. Kirkpatrick 2000.
- `phase-7-036-hancock-fingerprints-of-the-gods.md` — 1995+. Tier 4. Feder 2011, Fagan 2006.

**Persons (`04_persons/`):** `solon`, `critias-younger` (distinct from Critias-the-Thirty-Tyrant), `donnelly-ignatius`, `edgar-cayce`, `graham-hancock`, `charles-hapgood`

**Events (`05_events/`):** `event-thera-eruption-c-1600-bce` (Driessen-Macdonald 1997), `event-discovery-of-thera-akrotiri-1967`

**Themes (`06_themes/`):** `lost-continent`, `antediluvian-civilization`, `pseudoarchaeology` (Feder 2011, Card 2018)

**MASSIVE-WIN tracing edges:**
- Plato → Donnelly → Blavatsky → Cayce → Hancock (modern Atlantis chain)
- Sumerian King List pre-flood kings ↔ Genesis antediluvian patriarchs ↔ Plato's Atlantis (Lambert 1980, Civil)
- Egyptian Zep Tepi → Plato's Saïs claim (Hornung 1992)
- Thera eruption → cultural memory → Plato's narrative kernel
- Hancock-Hapgood-Cayce ↔ white-supremacist appropriations (carefully — Lepore 2018)

### Thread B: SUMERIAN DEEPENING

**Sumerian King List figures (`04_persons/`):** `gilgamesh-king` (historical), `enmebaragesi`, `mes-anepada`, `ur-nammu`, `shulgi`, `sargon-of-akkad`, `naram-sin`, `gudea-of-lagash`, `lipit-ishtar`, `ur-bau`

**Sumerian deities (`03_deities/`):** `nin-lil`, `nin-gal`, `nanshe`, `bau`, `nin-girsu`, `nidaba`, `nungal`, `geshtinanna`, `ninkasi`. Verify existing: `ereshkigal`, `nergal`.

**Documents (`02_documents/_phase-1-ancient-near-east/`):** `phase-1-015-sumerian-king-list` (Glassner 2004), `phase-1-016-eridu-genesis-flood` (Civil 1969), `phase-1-017-descent-of-inanna` (Kramer), `phase-1-018-gudea-cylinders` (Edzard)

### Thread C: MODERN RECEPTION (Phase 7 → present)

**Persons (`04_persons/`):** `april-deconick`, `birger-pearson`, `john-d-turner`, `david-brakke`, `reza-aslan`, `harold-bloom`, `david-bentley-hart`, `iain-mcgilchrist`, `jordan-peterson` (Tier 4), `pope-francis`, `rowan-williams`, `n-t-wright`, `geza-vermes`. Strengthen existing: `bart-ehrman`, `karen-king`, `elaine-pagels`, `karen-armstrong`, `the-14th-dalai-lama`.

**Events (`05_events/`):** `event-vatican-ii-aftermath-1965-present`, `event-rise-of-political-islamism-1928-present`, `event-evangelical-political-realignment-usa-1979-present`, `event-rise-of-nones-2007-present` (Pew/GSS data), `event-new-atheism-2004-2010`, `event-quranic-manuscript-finds-2015-onward` (Birmingham, Sana'a palimpsest)

**Tracing edges (Phase X → Present):** Plato/Plotinus → modern academic Neoplatonism; Sethian Gnosticism → Jung → modern depth psychology (Hillman, Hollis); Hermetic → Thelema/chaos-magic (Regardie, Crowley, Carroll); Patristic → Resourcement (de Lubac, Ratzinger); Vedic → Neo-Vedanta → Western yoga (Singleton 2010 *Yoga Body*); Daoism → "wellness" appropriation (Komjathy 2014).

### Close
```bash
cd "~/Desktop/Codex Atlas" && python3 build_data.py && python3 build_dashboard.py
```

---

## AGENT BATCH B — Christianity Tier-1 NER continuation

**Approach: per-document extraction.** For each of the 202 primary documents (especially Hebrew Bible J/E/D/P sources, Gospels, Pauline epistles, Acts, Patristic writers, rabbinic sources), open the doc, list every named person in body or YAML (`key-figures`, `deities-mentioned`, `mentioned-in`, `events-context`), stub any that don't have a node yet.

**Priority documents:**
- Phase 2 Hebrew Bible sources — Genesis genealogies, Exodus, Numbers, Joshua, Judges, Samuel, Kings, Chronicles, major + minor prophets
- Phase 3 Septuagint, 1 Enoch, Jubilees, Dead Sea Scrolls — extensive name lists
- Phase 4 Eusebius *Ecclesiastical History* — names ~2,000 historical figures across 1st–4th c.
- Phase 5 Talmud — sage names by generation
- Phase 6 Bhakti / Sikh / Sufi texts — lineage chains
- Phase 7 modern scholars for tradition reception

**Quality bar:** stub level (full YAML, 2+ refs, identity paragraph + historical evidence + role + disputes).

Use `00_meta/canonical-slugs.md` to avoid re-creating existing nodes. After each batch, rerun `python3 build_data.py` and `python3 build_dashboard.py`.

---

Welcome to the fresh session. Verify write access first, then pick a thread and begin.
