# ACTIVE-CONTENT — Investigation lane claims

> **Lane A — INVESTIGATION.** Many agents may work here in parallel as long as they pick **disjoint documents / disjoint slug ranges**. Append your one-line claim to the table when you start; mark it FINISHED with a timestamp when you commit; the next rotation pass moves finished rows to `agents-archive/`.
>
> Read `00_meta/LANES.md` for the lane definition and `00_meta/PROTOCOL.md` for the absorb-and-dissect SOP. Do **not** stage any path under `src/`, `index.html`, `build_data.py`, `build_dashboard.py`, `_assets/`, or `.claude/`. The pre-commit hook will refuse a cross-lane commit.

## In-flight

| Handle | Document or scope | Owned paths (folder lock) | Started | Status |
|---|---|---|---|---|
| opus-ontology-lock-2026-05-18 | Ontology lock pass 2 — 10 new lens folders (08, 18-26) + ONTOLOGY/LANES updated + permanent rationale doc. Deferred to next Lane B window: themes→motifs rename + build script updates + pre-commit hook regex + Forge mode dropdown. | as listed | 2026-05-18 PM | FINISHED 2026-05-18 evening |
| opus-rarefact-2026-05-18-pm | Rarefaction pass — write HOW-WE-WORK.md (slim routing doc replacing 100KB pre-flight burden), sync PROTOCOL.md + CORE-THEMES.md to 26-lens awareness, AUDIT note on pagan-usage review verdict | 00_meta/HOW-WE-WORK.md, 00_meta/PROTOCOL.md, 00_meta/CORE-THEMES.md, AUDIT/pagan-usage-verdict-2026-05-18.md, 00_meta/STATUS.md, 00_meta/ACTIVE-CONTENT.md | 2026-05-18 PM late | started |

_No active claims after this one. Append your row above._

## Stale carry-overs from pre-2026-05-17 (verify before continuing)

These claims existed in the old `ACTIVE-AGENTS.md` without a FINISHED marker. Likely either swept into another agent's commit (the parallel-sweep pattern observed 2026-05-15) or abandoned. Verify against `git log` before reclaiming.

- `sonnet-now-events-1` — app-code / Astrology Now mode — started 2026-05-15 — **now LANE B (UX); reclaim via ACTIVE-UX.md if reviving**
- `sonnet-themes-1` — content / pantheon theme batch — started 2026-05-15 — verify, then close or reclaim
- `goblin-world-wisdom-1` — symbols / ifa-divination + sankofa + quipu + eagle-symbol — started 2026-05-16 — verify, then close or reclaim
- `music-eastasia-1` — East Asian music cosmology strand — 2026-05-16 — verify, then close or reclaim
- `music-raga-singularity-1` — Raga-as-cosmic-clock — 2026-05-16 — verify, then close or reclaim

Full historical claim blocks for all 235 prior batches: [`agents-archive/2026-05-W2-active.md`](agents-archive/2026-05-W2-active.md).

## How to claim (3 lines)

1. Pick a primary document (from `ABSORPTION-QUEUE.md`, `AUDIT/05_priority_queue.md`, or free choice).
2. Append a row to the **In-flight** table: `| your-handle | doc slug or scope | folder-prefix locks | YYYY-MM-DD HH:MM | started |`.
3. When you commit, edit the row's Status to `FINISHED YYYY-MM-DD HH:MM` and add a one-line entry to the top of `00_meta/STATUS.md`.
