# Codex Atlas — Meta-audit & Housekeeping pass (`opus-housekeeper-1`, 2026-05-14)

A pure infrastructure / coordination-layer pass. **No vault content nodes were created or edited.** **No app code was edited.** This audit is concerned with how easy the project is to *operate* by the next wave of agents and humans landing in the vault.

Method: read DASHBOARD + ACTIVE-AGENTS + STATUS + methodology + the AUDIT folder + the schema files + a sample of in-flight claims to map the actual coordination friction; cross-checked the Obsidian config; cross-checked the README freshness; identified the AUDIT folder numbering collision.

Headline verdict: the vault's *content* work is operating at remarkable depth, the *infrastructure* underneath it has been steadily improving (opus-design-1's new [`app-architecture.md`](../00_meta/app-architecture.md) is exactly the right kind of standing rules document), but the *agent-coordination layer* still has friction that compounds with every additional parallel agent. A few small fixes — a one-screen onboarding doc, a top-of-file at-a-glance table, AUDIT folder index freshness, Obsidian config — remove three or four real points of friction from the next-agent workflow.

---

## 1. What was found

### 1.1 ACTIVE-AGENTS.md is now 1,200+ lines

The hand-edited claim-block format is the right shape, but the file has accumulated 19 claim blocks (mostly finished) in a single session and is growing by ~50 lines per batch. An incoming agent currently has to scroll past 16+ finished blocks to find the in-flight ones. The opus-buddhist-1 audit ([`11_opus-buddhist-1-audit.md`](11_opus-buddhist-1-audit.md)) already proposed a per-agent file split (`00_meta/agents/opus-<wedge>-<n>.md` + a `build_agents.py` rollup) — that's the right long-term fix. Until then, an at-a-glance table at the top of the file is the lowest-cost mitigation.

### 1.2 STATUS.md is doing two jobs at once

It is both the project status file (identity, posture, inventory snapshot) and the recently-completed-batches changelog. The changelog block has grown to ~10 entries, each a paragraph. Reading STATUS.md to learn "what is this project?" now requires scrolling past the entire batch log first. **Recommendation (deferred):** split into `STATUS.md` (steady-state identity + inventory) + `CHANGELOG.md` (per-batch headlines, newest first).

### 1.3 AUDIT folder had a numbering collision

Two files numbered `10_`: `10_app-and-infrastructure-audit.md` (engineering audit) and `10_opus-buddhist-1-audit.md` (post-hoc agent audit). The latter shipped second and inherited the duplicate number. **Resolved this batch:** renamed to `11_opus-buddhist-1-audit.md`. Updated the in-text reference in `ACTIVE-AGENTS.md`.

### 1.4 AUDIT/00_AUDIT_OVERVIEW.md index was stale at 05

Files 06 (symbology proposal), 07 (lead-session-log), 08 (quran-scripture-wiring brief), 09 (timeline-progressive-reveal plan), 10 (app-and-infrastructure audit), 11 (opus-buddhist-1 audit) had landed but were not in the index. **Resolved this batch:** index refreshed, with categorical grouping (content audits / scoped feature briefs / engineering & process audits) and a numbering-convention note.

### 1.5 No vault-root agent-onboarding doc

The pre-flight protocol lived in `00_meta/methodology.md` (procedural section), `00_meta/feedback_preflight_protocol` (the user's preference memory, only visible to Claude sessions with the right project memory), and the format spec at the top of `ACTIVE-AGENTS.md`. Onboarding required stitching across 5–7 files. **Resolved this batch:** created [`AGENTS.md`](../AGENTS.md) at the vault root — a 60-second onboarding doc that compresses pre-flight + coordination + canonical-slug + DO-NOT list + folder map + status legend + MASSIVE-win framing into one screen.

### 1.6 README.md was stale at v0.1

The README's folder map listed only phases 1–4 (vault has 1–8) and didn't mention `AUDIT/`, `src/`, `_assets/`, `09_symbols/`, or `AGENTS.md`. The "current phase" line still said *"v0.1 — Skeleton + Phase 1–4 metadata seeding"* while we're at v0.7 with 1,681 nodes. **Resolved this batch:** folder map updated; current-phase line updated with live counts + a "For agents" pointer.

### 1.7 Obsidian config was empty

`.obsidian/app.json` and `.obsidian/appearance.json` were 2-byte stubs (`{}`). The vault opens in Obsidian (the user explicitly mentioned wanting Obsidian files updated) without sane defaults: no attachment-folder routing (drops paste anywhere), no link-format consistency (mixed wikilink/markdown styles), no spellcheck, no readable-line-length, no inline-title, no front-matter display. **Resolved this batch:** populated both files with reading-friendly + ingestion-friendly defaults.

### 1.8 Schema-template `[[document]]` and `[[document-slug]]` placeholder leak

Already being closed by `opus-gaps-1` in this same session — schema files used un-backticked `[[document]]` as illustrative placeholders, which got counted by `build_dashboard.py`'s wikilink extractor as real dead-link targets. **Not touched this batch** to avoid collision; flagged here for the record.

---

## 2. What was changed (delivered)

| File | Change |
|---|---|
| [`00_meta/ACTIVE-AGENTS.md`](../00_meta/ACTIVE-AGENTS.md) | Added 🚦 In-flight at-a-glance table at top; archive-policy note; pointer to AGENTS.md; `opus-housekeeper-1` claim block; updated reference to renamed audit file |
| [`AUDIT/10_opus-buddhist-1-audit.md`](11_opus-buddhist-1-audit.md) → **renamed** | → `AUDIT/11_opus-buddhist-1-audit.md` (resolved 10_ numbering collision) |
| [`AUDIT/00_AUDIT_OVERVIEW.md`](00_AUDIT_OVERVIEW.md) | Refreshed index — now lists files 00–12 with categorical grouping and a numbering-convention note |
| [`AGENTS.md`](../AGENTS.md) | **NEW** — vault-root agent-onboarding doc (60-second pre-flight + coordination + DO-NOT + folder map + MASSIVE-win framing) |
| [`README.md`](../README.md) | Folder map refreshed (phases 1–8, AUDIT/, src/, _assets/, 09_symbols/, AGENTS.md); current-phase line updated to v0.7 with live counts; "For agents" pointer added |
| [`.obsidian/app.json`](../.obsidian/app.json) | Was `{}`; now sane defaults (attachment folder → 99_ingest, alwaysUpdateLinks, newLinkFormat shortest, useMarkdownLinks false, promptDelete, readableLineLength, showFrontmatter, foldHeading, spellcheck) |
| [`.obsidian/appearance.json`](../.obsidian/appearance.json) | Was `{}`; now reading-friendly defaults (baseFontSize 16, monospace fallback chain, accent color) |
| [`00_meta/STATUS.md`](../00_meta/STATUS.md) | Added `opus-housekeeper-1` headline entry to recently-completed batches |
| [`AUDIT/12_meta-audit-housekeeping.md`](12_meta-audit-housekeeping.md) | **NEW** — this file |

**Files explicitly NOT touched** (in-flight or out of scope): any `02_documents/`, `03_deities/`, `04_persons/`, `05_events/`, `06_themes/`, `07_traditions/`, `08_refs/`, `09_symbols/` node; `index.html`, `src/styles/app.css`, `src/js/app.js`, `data.js`, `build_data.py`, `build_dashboard.py`, `linkcheck.py`, `fetch_thumbnails.py`; `00_meta/methodology.md`, `00_meta/source-integrity.md`, `00_meta/schema-*.md`, `00_meta/canonical-slugs.md`, `00_meta/dead-links.md`, `00_meta/quality-issues.md`, `00_meta/orphan-nodes.md`, `00_meta/DASHBOARD.md` body (only re-ran the regenerator).

---

## 3. Standing recommendations carried forward (NOT done this batch)

These are the high-leverage hygiene moves that are still on the table. They are listed with rough effort estimates and the audit file that originally proposed them so future agents can pick one without rediscovering the rationale.

### 3.1 `git init` at vault root (CRITICAL — proposed in [`10_app-and-infrastructure-audit.md`](10_app-and-infrastructure-audit.md) §1.1)

The single highest-impact gap. Six months of investigation work + 1,681 markdown nodes + hand-edited registry files are running without history, blame, or rollback. One bad batch destroys irrecoverable work. ~1 hour: `git init`, `.gitignore` (`data.js` regenerable; `_assets/thumbs_cache.json`; macOS `.DS_Store`), commit current state, push to a private remote.

### 3.2 Per-agent claim-block files + rollup script (proposed in [`11_opus-buddhist-1-audit.md`](11_opus-buddhist-1-audit.md) §1)

Replaces the contention-prone single ACTIVE-AGENTS.md with per-agent files (`00_meta/agents/opus-<wedge>-<n>.md`) + a 30-line `build_agents.py` script that concatenates them into ACTIVE-AGENTS.md as the rendered registry view. Same pattern for STATUS via `STATUS-fragments/YYYY-MM-DD-opus-<wedge>-<n>.md`. ~1 hour. Removes the single most reliable source of frustration in the parallel-agent workflow.

### 3.3 `build_dashboard.py` should surface AUDIT proposals (proposed in [`10_app-and-infrastructure-audit.md`](10_app-and-infrastructure-audit.md) §6)

DASHBOARD.md is the work queue agents pick from. It surfaces dead-link counts and unstubbed wikilink targets. It does NOT surface the AUDIT/ folder's standing proposals — and as a result they sit unread while agents add more nodes against the easier-to-count queue. Adding a "## Open AUDIT proposals (last touched: ...)" section at the top of DASHBOARD.md is ~30 lines in `build_dashboard.py` and unsticks the architectural backlog. Same logic for surfacing `quality-issues.md`, `orphan-nodes.md`, and `themes-to-create.md` in the dashboard.

### 3.4 YAML linter + canonical-slug check (proposed in [`10_app-and-infrastructure-audit.md`](10_app-and-infrastructure-audit.md) §1.3)

Slug drift is preventable with ~1 day of `lint_yaml.py`: parse each YAML frontmatter, ASSERT each value against schema, verify each `[[wikilink]]` resolves to either a real file or a known canonical-slugs alias. Run in pre-commit (after §3.1) or on every `build_data.py`.

### 3.5 7-day archive policy for ACTIVE-AGENTS.md (proposed this batch)

Finished claim blocks older than 7 days move to `00_meta/agents-archive/YYYY-MM-DD.md`. Implementation deferred — would compete with §3.2 (per-agent files), which subsumes it.

### 3.6 Hash-based URL router for the atlas (proposed in [`10_app-and-infrastructure-audit.md`](10_app-and-infrastructure-audit.md) §2.1)

`#/pantheon`, `#/timeline`, `#/scripture/hermetica`, `#/node/yaldabaoth`. ~50 lines. Unblocks every "share with someone" use case. Also lets the user (and agents in browser sessions) link directly to a particular node when discussing it in chat.

### 3.7 STATUS.md → STATUS.md + CHANGELOG.md split (proposed this batch)

Steady-state project identity in STATUS.md; per-batch headlines in CHANGELOG.md. Cuts a long scroll that incoming readers do every session.

### 3.8 Sacred-sites, material-witnesses, scholar-lineage layers ([`04_methodology_proposals.md`](04_methodology_proposals.md), [`10_app-and-infrastructure-audit.md`](10_app-and-infrastructure-audit.md) §4)

Five large structural extensions (material witnesses → `09_material/`, geographic map view, scholar role-class, new edge types, scholar-lineage modelling, sacred-sites layer → `10_sites/`) sit unimplemented because of the dashboard-routing problem in §3.3. Fix that first, then these surface as work-queue items naturally.

---

## 4. Conventions formalized (or re-formalized) by this batch

- **AUDIT/ numbering**: `NN_short-slug.md` where `NN` is the next free integer; check `ls AUDIT/` before adding; segregating by category (content vs feature vs infra) is not worth re-attempting after the 10–11 collision.
- **Agent claim format**: full claim block in `ACTIVE-AGENTS.md` (existing convention) PLUS one row in the at-a-glance table at the top (new this batch). Both updated when status changes.
- **Onboarding entry-point**: `AGENTS.md` at vault root is the single entry-point; everything else hangs off it.
- **App-code agent pre-flight extension**: in addition to DASHBOARD + canonical-slugs + methodology, app-code agents read [`00_meta/app-architecture.md`](../00_meta/app-architecture.md) (created by `opus-design-1` in this same session). This is now noted in both `AGENTS.md` and the at-a-glance table footer.
- **Obsidian config commits**: `.obsidian/app.json` and `.obsidian/appearance.json` are checked into the vault (when `git init` lands) so every collaborator opens with the same defaults. `workspace.json` and per-user state should be `.gitignore`d at that point.

---

## 5. Closing

The investigation work is exemplary. The infrastructure has been steadily improving across the session — each batch leaves a slightly tighter vault than it found. The single biggest remaining piece is `git init`. Everything else is a hygiene chore that can be done in <1 day per item.

The strongest pattern this session: **the agents who write standing rules documents (`opus-design-1`'s `app-architecture.md`, the AUDIT/04 methodology proposals, this audit) leave outsized leverage for every subsequent batch.** Every doc that compresses scattered tribal knowledge into one place is worth ~10 batches of node-stubbing in compounding effect on coordination cost. The AUDIT folder as the durable "place where this kind of synthesis goes" is one of the best decisions in the project.
