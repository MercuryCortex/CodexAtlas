# AGENTS.md — 60-second onboarding for any agent landing in Codex Atlas

> **You are an agent newly attached to this vault. This is the entire pre-flight. Read these three files, pick a lane, go.**

---

## What this project is, in one paragraph

**Codex Atlas** is a cross-tradition investigation tool. The work is one motion: **absorb humanity's primary religious / philosophical / scientific corpus AND dissect each text into 17 category lenses at the same time**, then draw the **transmissions** that connect them across millennia. Investigation IS labelling; labelling IS data entry. The prize is the cross-tradition transmission edge (Christianity ← older Egyptian / Mesopotamian / Mystery / Platonic / Persian / Indic; Logos chain; Avatar typology; etc.). Posture: investigation, not advocacy. Every claim cites a source at a declared tier.

**Vault root:** `~/Desktop/Codex Atlas/`
**Atlas viewer:** `index.html` served at `http://localhost:8742` via `./start-atlas.command` (PMTiles needs Range, so no `file://`).
**Build:** `python3 build_data.py` (regenerates `data.js`, ~10 sec; data.js is `.gitignore`d).

---

## The four master files (read these, in order, before any work)

1. **[`00_meta/ONTOLOGY.md`](00_meta/ONTOLOGY.md)** — *what* we're mapping (structural). The 17 lenses (one folder each), the 7 edge buckets (Transmission / Parallel / Association / Kinship / Attestation / Polemic / Fusion), the MASSIVE-WIN transmission patterns we hunt, the source-integrity tiers (T1–T4), the node status tiers, slug discipline.

2. **[`00_meta/CORE-THEMES.md`](00_meta/CORE-THEMES.md)** — *what* to hunt for (content). The curated hunt-list of ~150 load-bearing cross-tradition patterns — themes (cosmogonic / eschatological / soteriological / theological / dualism / political-theological / anthropological + transmission-spine), symbols (cosmological / solar / theriomorphic / vegetal / architectural / cruciform / geometric / mystery / indigenous), rituals (sacrifice / initiation / mortuary / festival / pilgrimage / divination / prayer / ascetic / civic), and morals. Each entry: canonical slug + one-line "look for" + traditions usually carrying it + edge bucket the cross-tradition link lands in.

3. **[`00_meta/PROTOCOL.md`](00_meta/PROTOCOL.md)** — *how* to map it. The absorb-and-dissect SOP (claim → absorb → dissect → wire → hunt transmissions → stub-sweep → build → commit), the four laws (WIRING / INTEGRITY / GOBLIN-AUDIT / APP-CODE-SERIALIZES), the YAML skeletons for all 17 node types.

4. **[`00_meta/LANES.md`](00_meta/LANES.md)** — *where your work belongs*. Two lanes:
   - **Lane A — INVESTIGATION** (many agents, parallel): owns `01_*` through `17_*` content folders + the auto-regenerated meta files. Claim in [`ACTIVE-CONTENT.md`](00_meta/ACTIVE-CONTENT.md).
   - **Lane B — UX** (one agent at a time): owns `src/`, `index.html`, build scripts, `_assets/`. Claim the single slot in [`ACTIVE-UX.md`](00_meta/ACTIVE-UX.md).

   A pre-commit hook refuses cross-lane commits.

---

## Pre-flight is ~100 KB total. Do not read more than that before starting work.

The older docs (`methodology.md`, the seven `schema-*.md` files, `source-integrity.md`, the deep AGENTS.md) are deprecated by the four master files above. They're retained as compatibility references; if you find a contradiction, ONTOLOGY / CORE-THEMES / PROTOCOL / LANES win.

---

## Quick-claim cheat sheet

**Lane A — content agent:**
1. Read ONTOLOGY → CORE-THEMES → PROTOCOL → LANES.
2. Pick a primary text from [`00_meta/ABSORPTION-QUEUE.md`](00_meta/ABSORPTION-QUEUE.md), [`00_meta/DASHBOARD.md`](00_meta/DASHBOARD.md)'s priority queue, [`AUDIT/05_priority_queue.md`](AUDIT/05_priority_queue.md), or your own hunt.
3. Append your row to [`00_meta/ACTIVE-CONTENT.md`](00_meta/ACTIVE-CONTENT.md).
4. Absorb the text + dissect across the 17 lenses (use CORE-THEMES as the pattern lens) + wire + hunt MASSIVE-WIN transmissions + stub-sweep + `python3 build_data.py && python3 build_dashboard.py && python3 linkcheck.py` + commit.

**Lane B — UX agent:**
1. Read LANES → [`00_meta/VIEW-CONTRACT.md`](00_meta/VIEW-CONTRACT.md) (once it exists).
2. Verify [`00_meta/ACTIVE-UX.md`](00_meta/ACTIVE-UX.md) slot is open.
3. Claim the slot with an **explicit** file enumeration.
4. Iterate on Pantheon V2 / the `src/js/kit/` primitives, or migrate the next view from the rollout queue.
5. Verify with `mcp__Claude_Preview__` against `http://localhost:8742` before commit.

---

## The four laws (in 30 seconds)

- **WIRING LAW** — every `[[wikilink]]` resolves to a real node by commit time. Stub-sweep at batch close (not mid-sentence).
- **INTEGRITY LAW** — globally unique slugs. Build hard-fails on duplicates. Rename the conflict; never set `ATLAS_ALLOW_DUP_ID=1`.
- **GOBLIN-AUDIT** — when one-line fixes stop closing a bug class, dispatch three parallel read-only audit agents (correctness / rule-fragility / structural integrity). One pass, not ten.
- **APP-CODE SERIALIZES** — Lane B has one slot. Lane A may not stage anything under `src/`, `index.html`, build scripts, `_assets/`. The pre-commit hook enforces.

Details and rationale in PROTOCOL.md §3.

---

## Critical files (quick links)

| File | Purpose |
|---|---|
| [`00_meta/ONTOLOGY.md`](00_meta/ONTOLOGY.md) | Structural — 17 lenses + 7 edge buckets + tiers + MASSIVE-WIN patterns |
| [`00_meta/CORE-THEMES.md`](00_meta/CORE-THEMES.md) | The hunt-list — ~150 cross-tradition patterns (themes / symbols / rituals / morals) with canonical slugs |
| [`00_meta/PROTOCOL.md`](00_meta/PROTOCOL.md) | How to map (SOP + laws + YAML skeletons) |
| [`00_meta/LANES.md`](00_meta/LANES.md) | Where work belongs (lane definitions + path map) |
| [`00_meta/ACTIVE-CONTENT.md`](00_meta/ACTIVE-CONTENT.md) | Lane A in-flight claims |
| [`00_meta/ACTIVE-UX.md`](00_meta/ACTIVE-UX.md) | Lane B (single slot) |
| [`00_meta/ABSORPTION-QUEUE.md`](00_meta/ABSORPTION-QUEUE.md) | High-value texts not yet absorbed |
| [`00_meta/STATUS.md`](00_meta/STATUS.md) | Rolling log (last 30 batches; older in `status-archive/`) |
| [`00_meta/DASHBOARD.md`](00_meta/DASHBOARD.md) | Auto-regenerated live state |
| [`00_meta/MASSIVE-WINS-INDEX.md`](00_meta/MASSIVE-WINS-INDEX.md) | Full catalog of cross-tradition findings |

---

— maintained by opus, restructured 2026-05-17 (workflow reset).
