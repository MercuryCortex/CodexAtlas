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

## 🚦 In-flight claims at a glance (current as of 2026-05-14 ~22:55 — empty after session-close sweep)

| Handle | Scope tag | Owns (high level) | Started |
|---|---|---|---|
| _no agents in flight — vault at rest_ | | | |

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
