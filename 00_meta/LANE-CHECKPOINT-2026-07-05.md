# LANE CHECKPOINT — 2026-07-05

> **Purpose:** freeze exactly where the active ingestion lane sits so it can be resumed
> cold, and open a *disjoint* second lane for the branch-population benchmark without
> collision. Read this + `LANES.md` before picking up either lane.

## ⏸ PARKED — Engine ④ READ mass-ingest (Lane B — `src/data/scripture-texts.js`)

- **State:** clean. Last commit `223f5909` — *READ mass-ingest batch 19A (+4 → 353 keys)*.
- **Count:** **353 / 621** texts staged (~57%). Target 80%.
- **Cluster sequence (resume here):** dying-rising → flood → cosmogony → logos/wisdom → apocalyptic.
- **Two entries were rate-limited mid-fact-check and NOT shipped** (resume with the proven
  `resumeFromRunId` recipe): `athanasius-on-the-incarnation` (theosis), `laws-of-manu-1`
  (cosmic-egg cosmogony). Also re-stage the 3 rate-zeroed creation texts noted in the
  06-15 handoff: Ovid *Met.* I, Hesiod *Theogony* 116–210, Rig Veda 10.121, + corrected Enuma Elish VI.
- **How to resume:** `AUDIT/2026-06-15-read-scaling-handoff.md` has the exact
  `atlas-read-stage` recipe (SMALL batches of 3). This is **Lane B** — one slot, `src/data/`.

## ▶ OPEN — Branch-population benchmark (Lane A — content `.md` only)

- **What:** an exercise (John, 2026-07-05) — take a top-transmission root deity and follow its
  wires **outward until every lens lights up** (esp. the dark "civilization" lenses: Law,
  Philosophy, Math, Astronomy, Medicine, Divination, Music, Calendars). Output = a reusable
  **benchmark/template** for all future ingestion. Spec + worklist: `AUDIT/2026-07-05-branch-population-benchmark.md`.
- **Pilot root:** **Tiamat** (flagship "the deep" headwater; anchor text = Enuma Elish).
- **Lane:** **A** — touches only content `.md` (`03_deities/ 04_persons/ 06_themes/ 13_morals/
  15_philosophy/ 16_mathematics/ 19_astronomy/ 02_documents/ …`) + `00_meta/` + `AUDIT/`.
  **No `src/` files** → cannot collide with the parked Lane-B READ work. The pre-commit hook
  enforces the split.

## Lane map for any agent picking up work
| Lane | Owns | Status | Pick this if… |
|---|---|---|---|
| **B — READ** | `src/data/scripture-texts.js` (+ `index.html` cache-bump) | ⏸ parked @ 353 | you're staging reader texts (one slot) |
| **A — branch-population** | content `.md` across the lens folders | ▶ active (Tiamat) | you're wiring/creating nodes across lenses |

Tree was **clean** at checkpoint. Both lanes are file-path-disjoint; either can run without waiting on the other.
