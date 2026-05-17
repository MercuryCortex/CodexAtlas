# LANES — The two-lane workflow

> **Read this third.** [`ONTOLOGY.md`](ONTOLOGY.md) tells you *what* we're mapping. [`PROTOCOL.md`](PROTOCOL.md) tells you *how* to map it. This file tells you *which lane your work belongs in* — and how to keep agents from colliding.

---

## 1. Why two lanes

Codex Atlas has two kinds of work that don't share a coordination model:

- **Content** (absorbing texts, dissecting them into the 17 category lenses, wiring connections, hunting transmissions) — **many agents can run in parallel** as long as they pick disjoint documents. Different files, no contention.
- **App code** (the viewer, the design system, the build pipeline) — **serializes**. Two agents on `src/js/` repeatedly collide. The 2026-05-17 "seven-sweep" incident saw five separate cross-agent regressions in one session: an SVG overlay z-order flip, a `!important` rule that silently blocked gradients, an off-spec edge bucket inserted into `BUCKETS`, and three commit-attribution sweeps. Parallel app-code agents are a net negative on this codebase.

Mixing both kinds of work under one coordination protocol is what's been slowing the project down. The fix is **physical separation by file path** plus **a pre-commit hook that refuses cross-lane commits**.

---

## 2. Lane A — INVESTIGATION (many agents, parallel)

**Purpose:** absorb primary texts and dissect them into the graph.

**Slot model:** unlimited. Two or more agents may run in parallel as long as they pick disjoint documents / disjoint slug ranges. Same era is fine; same document is not.

**Owns (may stage):**
- `01_timeline/`, `02_documents/`, `03_deities/`, `04_persons/`, `05_events/`, `06_themes/`, `07_traditions/`, `09_symbols/`, `10_music/`, `11_alphabets/`, `12_alchemy/`, `13_morals/`, `14_rituals/`, `15_philosophy/`, `16_mathematics/`, `17_medicine/`
- `00_meta/STATUS.md`, `00_meta/ACTIVE-CONTENT.md`, `00_meta/canonical-slugs.md` (regenerated), `00_meta/dead-links.md` (regenerated), `00_meta/DASHBOARD.md` (regenerated), `00_meta/orphan-nodes.md` (regenerated), `00_meta/quality-issues.md` (regenerated)
- `AUDIT/` (only adding new findings; not editing the active-five)

**Cannot touch (commit will be refused):**
- `src/js/`, `src/styles/`, `src/` of any kind
- `index.html`
- `build_data.py`, `build_dashboard.py`, `linkcheck.py`, `lint_yaml.py`, `fetch_thumbnails.py`, `fetch_wikidata_thumbnails.py`, `review_thumbnails.py`, `add_depictions.py`
- `_assets/`
- `.claude/`
- `00_meta/ACTIVE-UX.md`
- `00_meta/ONTOLOGY.md`, `00_meta/PROTOCOL.md`, `00_meta/LANES.md`, `00_meta/VIEW-CONTRACT.md` (these are master files — only update via explicit decision)
- The 7 `schema-*.md` (deprecated by PROTOCOL.md §6) and `methodology.md` (deprecated by PROTOCOL.md)

**Where to claim:** [`ACTIVE-CONTENT.md`](ACTIVE-CONTENT.md). Append your row before starting; mark FINISHED with timestamp when you commit.

**Where to log:** one-line entry at the top of [`STATUS.md`](STATUS.md) when you commit.

**Workflow:** see [`PROTOCOL.md`](PROTOCOL.md) for the full absorb-and-dissect SOP.

---

## 3. Lane B — UX (one agent at a time)

**Purpose:** evolve the viewer. Iterate on Pantheon V2's design language. Lift it into a reusable kit. Migrate other views to consume the kit.

**Slot model:** **one slot only.** If [`ACTIVE-UX.md`](ACTIVE-UX.md) shows an occupied row, you wait, switch to investigation work, or coordinate with the slot-holder.

**Owns (may stage):**
- `src/js/` (everything: `app.js`, `views/`, `alphabets/`, `astrology/`, `alchemy/`, `kit/` once it exists)
- `src/styles/`
- `index.html`
- `build_data.py`, `build_dashboard.py`, `linkcheck.py`, `lint_yaml.py`, `fetch_thumbnails.py`, `fetch_wikidata_thumbnails.py`, `review_thumbnails.py`, `add_depictions.py`
- `_assets/` (vendored libraries, basemaps, screenshots, thumbnail cache config)
- `00_meta/ACTIVE-UX.md`, `00_meta/VIEW-CONTRACT.md`, `00_meta/app-architecture.md`, `00_meta/app-usage.md`
- `AUDIT/` design-spec docs (`edge-color-spec`, `edge-logic-spec`, `dev-panel-inventory`, `pantheon-v2-parity`, `premium-dynamics-research`)

**Cannot touch (commit will be refused):**
- `01_*` through `17_*` content folders (no editing content nodes mid-UX-batch)
- `00_meta/ACTIVE-CONTENT.md`
- `00_meta/ONTOLOGY.md`, `00_meta/PROTOCOL.md`, `00_meta/LANES.md` (master files; only update by explicit decision)
- `00_meta/STATUS.md` (you may log a one-line entry, but not edit historical entries)

**Where to claim:** [`ACTIVE-UX.md`](ACTIVE-UX.md). Fill the single slot row before starting. Path enumeration in `Owns:` must be **explicit** ("Owns: src/js/views/pantheon-v2.js, src/styles/app.css, index.html" — not "Owns: app code").

**Verification before commit:** start `./start-atlas.command` or hit `http://localhost:8742`; use `mcp__Claude_Preview__` to drive the live view. Take a before/after screenshot for any visual change.

**Commit cadence:** every 1–2 surgical edits, not at the end of a session. The faster you commit, the smaller the parallel-sweep window if a content agent slips through.

---

## 4. The pre-commit hook (what stops the collisions)

`.git/hooks/pre-commit` will check the staged file list and apply two rules:

### Rule 1 — Syntax (already in place)
Every staged file under `src/js/` is run through `node --check`. Syntax error → commit refused.

### Rule 2 — Lane purity (new in Phase 2)
The hook scans staged paths and asks:
- Does **any** path match a Lane B prefix (`^src/`, `^index\.html$`, `^build_.*\.py$`, `^lint_yaml\.py$`, `^linkcheck\.py$`, `^fetch_.*\.py$`, `^review_thumbnails\.py$`, `^add_depictions\.py$`, `^_assets/`)?
- Does **any** path match a Lane A prefix (`^0[1-9]_`, `^1[0-7]_`, `^00_meta/(STATUS|ACTIVE-CONTENT|DASHBOARD|dead-links|orphan-nodes|quality-issues|canonical-slugs)\.md$`)?

If **both**, the commit is refused with:
```
Refused: cross-lane commit detected.
  Lane B (UX) paths in stage: <list>
  Lane A (content) paths in stage: <list>
Split into two commits: one per lane. See 00_meta/LANES.md.
```

**Override:** `git commit --no-verify` works but is logged to memory as a protocol violation. Only use when John explicitly authorises it.

---

## 5. Switching lanes mid-session

You can switch lanes within one session, but **commit and release first**:

1. Finish whatever you started in your current lane.
2. Commit. Mark your row FINISHED (Lane A) or release the slot (Lane B).
3. Read the other lane's claim file. Verify your scope is open.
4. Claim. Proceed.

You cannot have an in-flight claim in both lanes simultaneously.

---

## 6. What about the meta / build scripts?

Some files don't belong cleanly to either lane:

| Path | Owner | Notes |
|---|---|---|
| `00_meta/ONTOLOGY.md`, `PROTOCOL.md`, `LANES.md`, `VIEW-CONTRACT.md` | **Master files** | Only update by explicit decision from John. Either lane may propose changes via `AUDIT/` and discuss before editing. |
| `AGENTS.md`, `README.md` | **Master files** | Same rule. |
| `.gitignore` | **UX lane** | Treated as build infrastructure. |
| `.git/hooks/pre-commit` | **UX lane** | Build infrastructure. |
| `start-atlas.command`, `scripts/` | **UX lane** | Build/dev infrastructure. |
| `00_meta/canonical-slugs.md`, `dead-links.md`, `orphan-nodes.md`, `quality-issues.md`, `DASHBOARD.md` | **Lane A (auto-regenerated)** | These regenerate from `build_dashboard.py`. Lane A agents stage them as part of their batch. |
| `02_documents/_phase-*/_TODO.md` | **`.gitignore`d** | Auto-regenerated; not tracked. |

When in doubt, ask in your claim block (`Owns: ... — also touching <unclear file>; verify`).

---

## 7. Lane-violation triage

**If you find app-code paths in `git status` and you're a content agent:**
1. `git diff <path>` — see what changed.
2. If you didn't deliberately edit it → `git checkout HEAD -- <path>` to revert.
3. If you did deliberately edit it → you're not a content agent for this batch. Stop. Claim the UX slot if it's open, or wait.

**If you find content-folder paths in `git status` and you're a UX agent:**
1. Verify they were already present at session start (perhaps a previous agent left them uncommitted).
2. If yes → leave them alone; commit only your UX changes.
3. If you accidentally edited a content node → `git checkout HEAD -- <path>` and stop touching it.

**The pre-commit hook is the safety net.** If you forget all of the above, the hook still catches the mixed commit.

---

## 8. Reading list (in order, before any session)

1. [`ONTOLOGY.md`](ONTOLOGY.md) — what we're mapping (the 17 lenses + 7 edge buckets + MASSIVE-WIN patterns + source-integrity tiers). ~30 KB.
2. [`PROTOCOL.md`](PROTOCOL.md) — how to absorb + dissect + wire + commit. ~30 KB.
3. [`LANES.md`](LANES.md) — this file. Pick a lane. ~7 KB.
4. The claim file for your lane: [`ACTIVE-CONTENT.md`](ACTIVE-CONTENT.md) or [`ACTIVE-UX.md`](ACTIVE-UX.md). ~5 KB.

That's the entire pre-flight. ~75 KB total instead of the previous ~800 KB.

Older docs (`methodology.md`, the seven `schema-*.md` files, `source-integrity.md`) are retained for now as compatibility references but are **deprecated** — PROTOCOL.md and ONTOLOGY.md replace them. If you find a contradiction, the three master files (ONTOLOGY / PROTOCOL / LANES) are authoritative.
