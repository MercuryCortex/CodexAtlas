# HANDOFF — Codex Atlas, 2026-07-19 (the "bucket push")

**Self-contained pickup for the next / concurrent agent.** Read this + the cardinal memories, especially `reference-ingest-cluster-gate-checklist-2026-07-18`.

## ⚠️ COORDINATION FIRST (there were ≥2 agents on `main` this session)
- Before firing anything: `git log --oneline -15` + `git status`. This session, a Pharmacology run hit the **agent session-limit** (5 skeptics failed mid-batch); a second agent **recovered the drafts and committed them** (`b5ad5b84` "recovers lost run" → Pharmacology 12/12, then Attire 12/12, then Consciousness +12). Nothing was lost, but two agents committing to `main` is how untracked work gets clobbered — **commit tight, pull often, don't duplicate a lens someone just did.**
- If you hit `You've hit your session limit`, STOP firing workflows (agents fail silently as errored) until it resets.

## WHERE THE VAULT IS (as of 2026-07-19, 5,540 nodes)
This session pushed **9 thin lenses** via the `atlas-ingest-cluster` workflow (12-node batches, grep-verified discovery in the MAIN thread, every node hand-gated). Lens bands now:
- **STILL ANEMIC (red) — the only two left:** **Philosophy 22%** (67/300) · **Practices 23%** (50/220)
- **Developing (amber, most room):** Alchemy 26 · Divination 26 · Morals 27 · Material-culture 27 · Consciousness 28 · Theology 29 · Astronomy 31 · Medicine 34 · Attire 34 · Calendars 36 · Technology 36 · Mathematics 37 · Languages 41 · Pharmacology 41 · Rituals 42
- Open **✦ → Dev → Overview** for live numbers (fetches `src/data/*.json`; rebuild with `python3 scripts/build_health_index.py`).

## THE METHOD (proven — ~9 batches this session, all gated)
1. **Discovery = deterministic grep in the main thread** — never let agents guess what's missing. For a lens: list existing nodes, brainstorm cross-tradition CONCEPT/HUB gaps (not just instances), then grep-verify each candidate: (a) absent as a **filename stem**, (b) real demand, (c) no dup in a sibling folder/theme. The agents' verify-absent step catches most different-slug dups (it skipped covenant/avatara/miaphysite/incubation this session) — trust it but pre-check anyway.
2. **Fire `atlas-ingest-cluster`** with 12 records `{slug,type,tradition,region,hubs,demand,note}`. Give each note dedup guidance + the correct **edge field for that folder** (philosophy=`syncretic-edges`/`cross-tradition-edges`; theology=`syncretic-edges`; practices/medicine=`hub-edges`/`cross-tradition-edges`; morals=`cross-moral-edges`; material=`syncretic-edges`; pharmacology=`syncretic-edges`).
3. **GATE every node in the main thread** — the 6 recurring agent failure modes (memory `reference-ingest-cluster-gate-checklist-2026-07-18`): superlatives · zero-edge (grep `data.js` for `"source": "<slug>"`) · dead/wrong-target wires · membership-vs-wire · different-slug dups · schema-per-folder. **New catches worth repeating:** two **FABRICATED citations** this session (a nonexistent Brereton JAOS-2004 article; a wrong papal bull *Inter sollicitudines*) — always sanity-check named citations; **membership-vs-wire on comparative hubs** (a cross-tradition hub must be `tradition: cross-tradition` with NO `also-in-traditions`; drop the tradition list, it's wires); **numeric `source-tier: 1` crashes `build_data.py`** (must be string `T1`); **type must match folder** (a `type: theme` in `21_theology/` is a strict-lint ERROR); **`linkcheck.py` resolves by filename STEM only — `id:` does NOT count** (use `linkcheck.py --baseline`, the pre-commit's own gate).
4. **Ship:** apply fixes via an asserting patcher → stem-only WIRING + YAML + type gate → `cp` to folder → `python3 lint_yaml.py --strict` → `python3 build_data.py` → `python3 linkcheck.py --baseline` (must say "no regression — 337 dead targets") → commit **`.md` + STATUS only** (`data.js` is GITIGNORED). Dead-link floor = **337**; never let it rise.

## RANKED NEXT STEPS
1. **Finish the last two anemic lenses → developing:** **Practices** (23% — still has meditation forms, prayer types, initiation/lifecycle rites not yet hubbed) and **Philosophy** (22% — headwaters mostly done; remaining are lower-demand tails: e.g. philosophy-vaisheshika-atomism, -sautrantika-done, African/Ubuntu, more Islamic kalam). Philosophy's 300 baseline is ambitious — a few more batches only.
2. **Push developing→rich on the richest seams:** Divination (26%), Alchemy (26%), Astronomy (31%) — all high cross-tradition value.
3. **REDEPLOY** so codexatlas.org shows the new work: `python3 scripts/build_dist.py && npx wrangler pages deploy dist --project-name codex-atlas --commit-dirty=true`. The Pharmacology/Attire/Consciousness batches are committed but NOT yet live (last deploy was mid-session). ⚠️ outward-facing — confirm with John.
4. **Deferred (worth a persons batch):** the new medicine/practices/morals/material nodes flagged more missing founder person-nodes as demand (the earlier persons batch did 12).
5. **PARKED non-ingestion (John's original #1, see `HANDOFF-2026-07-17.md`):** the **deities-node glass/prism redesign** (Forge engine, NOT a bespoke renderer — memory `feedback-no-bespoke-graph-renderers`), Forge dev-panel declutter, password-login option, verify WHOIS privacy at Porkbun.

## SESSION TALLY (this agent)
7 lenses hand-gated + committed (Philosophy 36→67, Theology 53→69+3themes, Practices 38→50, Medicine 20→31, Morals 37→49, Material-culture 36→48) + 12 founder persons + founder-reciprocal wiring + the avatāra↔incarnation MASSIVE-WIN. Redeployed codexatlas.org once (mid-session). The concurrent agent added Pharmacology, Attire, Consciousness. Floor held/improved 338→337 throughout; every node grep-verified, skeptic-checked, and gated. Nothing shipped unverified.
