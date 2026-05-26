# AGENTS.md — 60-second onboarding for any agent landing in Codex Atlas

> **You are an agent newly attached to this vault. This is the entire pre-flight. Read these three files, pick a lane, go.**

---

## What this project is, in one paragraph

**Codex Atlas** is a cross-tradition investigation tool. The work is one motion: **absorb humanity's primary religious / philosophical / scientific corpus AND dissect each text into 17 category lenses at the same time**, then draw the **transmissions** that connect them across millennia. Investigation IS labelling; labelling IS data entry. The prize is the cross-tradition transmission edge (Christianity ← older Egyptian / Mesopotamian / Mystery / Platonic / Persian / Indic; Logos chain; Avatar typology; etc.). Posture: investigation, not advocacy. Every claim cites a source at a declared tier.

**Vault root:** `~/Desktop/Codex Atlas/`
**Atlas viewer:** `index.html` served at `http://localhost:8742` via `./start-atlas.command` (PMTiles needs Range, so no `file://`).
**Build:** `python3 build_data.py` (regenerates `data.js`, ~10 sec; data.js is `.gitignore`d).

---

## The five master files (read these, in order, before any work)

1. **[`00_meta/CODEX.md`](00_meta/CODEX.md)** — *who we are epistemically*. The investigative-not-advocacy posture, the disclaimer-machine ethos, the 21-type cross-tradition vocabulary (summary), the 4-tier source system (T1 mainstream peer-reviewed / T2 academic minority / T3 alternative-school like Hancock / T4 popular-claim-rejected like Sitchin), what we explicitly reject (Eliade-mode telescope claims, mainstream-only orthodoxy, single-school doctrine, hierophany-depth assertions). **Read this BEFORE any cross-tradition wiring batch.**

2. **[`00_meta/ONTOLOGY.md`](00_meta/ONTOLOGY.md)** — *what* we're mapping (structural). The 27 lenses (one folder each), the 7 edge buckets (Transmission / Parallel / Association / Kinship / Attestation / Polemic / Fusion), the MASSIVE-WIN transmission patterns we hunt, the source-integrity tiers (T1–T4), the node status tiers, slug discipline.

3. **[`00_meta/CORE-THEMES.md`](00_meta/CORE-THEMES.md)** — *what* to hunt for (content). The curated hunt-list of ~150 load-bearing cross-tradition patterns — themes (cosmogonic / eschatological / soteriological / theological / dualism / political-theological / anthropological + transmission-spine), symbols (cosmological / solar / theriomorphic / vegetal / architectural / cruciform / geometric / mystery / indigenous), rituals (sacrifice / initiation / mortuary / festival / pilgrimage / divination / prayer / ascetic / civic), and morals. Each entry: canonical slug + one-line "look for" + traditions usually carrying it + edge bucket the cross-tradition link lands in.

4. **[`00_meta/PROTOCOL.md`](00_meta/PROTOCOL.md)** — *how* to map it. The absorb-and-dissect SOP (claim → absorb → dissect → wire → hunt transmissions → stub-sweep → build → commit), the four laws (WIRING / INTEGRITY / GOBLIN-AUDIT / APP-CODE-SERIALIZES), the YAML skeletons for all 27 node types, and the locked 21-type cross-tradition edge vocabulary (§3.1).

5. **[`00_meta/LANES.md`](00_meta/LANES.md)** — *where your work belongs*. Two lanes:
   - **Lane A — INVESTIGATION** (many agents, parallel): owns `01_*` through `17_*` content folders + the auto-regenerated meta files. Claim in [`ACTIVE-CONTENT.md`](00_meta/ACTIVE-CONTENT.md).
   - **Lane B — UX** (one agent at a time): owns `src/`, `index.html`, build scripts, `_assets/`. Claim the single slot in [`ACTIVE-UX.md`](00_meta/ACTIVE-UX.md).

   A pre-commit hook refuses cross-lane commits.

---

## Pre-flight is ~100 KB total. Do not read more than that before starting work.

The older docs (`methodology.md`, the seven `schema-*.md` files, `source-integrity.md`, the deep AGENTS.md) are deprecated by the four master files above. They're retained as compatibility references; if you find a contradiction, ONTOLOGY / CORE-THEMES / PROTOCOL / LANES win.

---

## Quick-claim cheat sheet

**Lane A — content agent:**
1. Read CODEX → ONTOLOGY → CORE-THEMES → PROTOCOL → LANES.
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

## The five laws (in 30 seconds)

- **CODEX LAW** — see [`00_meta/CODEX.md`](00_meta/CODEX.md). Investigation not advocacy; pluralism not orthodoxy; disclosure not concealment. Every cross-tradition edge carries `type:` (one of 21 from PROTOCOL §3.1) + `source:` (who claims it) + `source-tier:` (T1/T2/T3/T4) + `notes:` (mainstream rebuttal for T3/T4). Never blanket-endorse a school. Never hide a widely-circulated claim. Never assert without citation.
- **WIRING LAW** — every ``wikilink`` resolves to a real node by commit time. **Edge targets MUST be `[wikilinks]`, never raw prose strings** (so the graph can traverse). **Every cross-tradition figure you name in body prose must appear as a structured `[wikilink]` entry in `equivalents:` or `syncretic-edges:` — body prose alone does NOT count as wiring.** **Reciprocal**: when you add A→B in A's file, add B→A in B's file (or document why not). Stub-sweep + reciprocity sweep at batch close. See PROTOCOL §3.1 for the 21 edge types and concrete examples.
- **INTEGRITY LAW** — globally unique slugs. Build hard-fails on duplicates. Rename the conflict; never set `ATLAS_ALLOW_DUP_ID=1`.
- **GOBLIN-AUDIT** — when one-line fixes stop closing a bug class, dispatch three parallel read-only audit agents (correctness / rule-fragility / structural integrity). One pass, not ten.
- **APP-CODE SERIALIZES** — Lane B has one slot. Lane A may not stage anything under `src/`, `index.html`, build scripts, `_assets/`. The pre-commit hook enforces.

Details and rationale in PROTOCOL.md §3.

---

## Craft doctrine (read before any UX-lane work)

These are **load-bearing rules** for how this product gets built. They override the agent's default instinct to "ship fast."

### 1. We are NOT shipping until the app is 100 % done.

Codex Atlas is being built to be **the most gorgeous visual representation of human history's cross-tradition transmissions ever produced**. The launch criterion is not "MVP that works" — it is "so crafted that a competitor attempting to reproduce the design + visualization gets stuck on the surface alone."

This means:

- **No "ship fast" posture.** No "good enough for now." No "we'll polish later." No "the user won't notice."
- **No third-party graph libraries** (Cosmograph, deck.gl, react-flow, etc.) for the production rendering surface. The Atlas visual is proprietary — every shader, every curve, every glyph is ours, written from first principles. Browser APIs (WebGPU, WebGL2, Canvas2D) are the only acceptable rendering primitives.
- **No SaaS dependencies that could shift pricing, license, or roadmap under us.** MIT/BSD/Apache FOSS libraries are fine *only* when they sit at the primitive layer (e.g., a math helper) and we could fork-and-replace within a day. Anything graph-domain-specific is built proprietary.
- **Quality target: visual signature so distinct it's hard to copy purely from a design / visualization POV.** Type-glyphs, family hulls, edge-bucket palette, focus-dim hierarchy, cinematic camera, animated wires — every visual is a designed choice, not a library default.

### 2. Re-evaluate tech at every friction signal.

The default agent instinct is to *optimize what's there*. That instinct is wrong for this project. When you hit:

- A regression you can't fix without touching the architecture
- A performance ceiling that requires "tuning" instead of solving
- A library limitation that requires fighting the framework
- An iteration loop that takes more than seconds (compile, hot-reload, manual click-through)

**STOP. Step back. Ask: is this the right tech for the ambition?**

The current stack (vanilla JS + Sigma WebGL + SVG overlays + D3 + MapLibre) is *adequate* for the current 660-node scale. It is **not** the right foundation for "thousands of nodes, the most gorgeous visual of human history." That conversation should have happened on day one and didn't. It is happening now. The Forge tab (Lane B, `src/js/views/forge.js` + `src/js/engine/`) is the proprietary WebGPU foundation being built to actually carry the product ambition. Pantheon V2 stays in production *only* until Forge proves it carries the visual ambition at scale — then graduates the same way V2 graduated.

Every agent doing UX-lane work has standing permission — actually, **standing obligation** — to escalate a "we are using the wrong tech for this" finding to John the moment evidence accumulates. Polishing wrong-tech instead of escalating is a protocol violation.

### 3. Proprietary, not rented.

When the choice is between adopting a library and building it ourselves:

- **Default to building.** Especially for anything that touches the visual signature.
- **Choose libraries only when (a) it's a math / I/O primitive, (b) MIT/BSD/Apache FOSS, (c) we could fork-and-replace within a day if needed, (d) it does not shape the user-visible product.**
- **Never adopt anything commercial / SaaS-licensed for the production surface.**
- **Reuse from John's own work (the portable core, the portable core) is encouraged** — copy patterns and code into Atlas, no live dependency. Atlas should never break because the portable core changed.

### 4. Forward compatibility is part of craft.

When building TypeScript engine code today, design the contracts so a future Rust+WASM port (via the portable core) is a mechanical swap, not a rewrite. Type definitions in `src/js/engine/types.js` mirror the portable core's Rust structs by intention. The Renderer API is small and well-defined. The view layer never reaches past the engine contract into WebGPU directly. This is non-negotiable for engine-layer code.

### 5. Color, stroke, and visual style are a single locked system.

Palette / family colors / bucket hex / dim levels / hot alphas / stroke widths / curve strengths / background atmosphere / type-glyph tints — these are not independent knobs. Tweaking one in isolation creates visual debt; the system needs to move as a coordinated whole.

**Rules:**

- **No per-element ad-hoc color tweaks during functional work.** When you ship a feature (a renderer, a view, an overlay), use whatever palette currently exists. Do *not* "lower this opacity" or "brighten that bucket" mid-batch. That's how the visual surface accumulates clashes.
- **When the operator (John) flags visual debt** ("this is jarring", "the colors fight each other"), do **not** offer micro-tweaks. Record the observation. Continue functional work.
- **When visual debt accumulates enough that further functional work is wasted polish**, propose a dedicated **color / style / dogma batch**. That batch focuses 100 % on the visual system: palette breakdown, bucket-hex audit, family-color audit, dim/hot ratio audit, stroke width audit, atmosphere audit. NO chart code touched in that batch. Come back to chart code only after the system is locked.
- **The dev panel** (when built) is the operator's interface to the locked system. ALL visual parameters live there: per-bucket idle/hot alpha + width + curve, family color overrides, dim amount, hot-width multiplier, AA falloff, node tier radii, edge segment count, atmosphere strength, camera ratios, label thresholds + sizes. Building it is part of the color/style/dogma batch, not a separate concern.
- **Until the dogma batch happens**, the current state is "we know it's visually broken; we're recording the debt; we'll fix it as a unified pass." Don't apologize for it mid-feature; just keep building functional surface until enough exists to justify the pass.

**Recorded debt as of 2026-05-17 evening:** Forge wheel at zoom-in shows ~2,000 Fusion bucket edges at idle 0.30 amber, dominating the visual into orange spaghetti that obscures family clusters. Headline-bucket idle-paints-in-bucket-hex rule is part of the question. Whole atlas-app color system has never been audited. Both will be addressed in the dedicated dogma batch.

---

## Capture-quality rule (2026-05-28) — applies to any agent fetching external text

When pulling text from Wikipedia, Britannica, or any other source for `thumb_extract`, scripture intros, side-panel content, or essay quotes:

**DO NOT cut mid-sentence.** Always extend the capture window to a sentence boundary (period, exclamation, question mark, em-dash followed by capital). The atlas displays this content in narrow side panels and mid-sentence cuts read as broken UI.

Practical rules:
- If targeting "first N characters" — find the last `. ` (period + space) before N and cut there.
- If targeting "first paragraph" — keep the WHOLE paragraph; never truncate.
- If the source uses non-Latin punctuation (Arabic ، Chinese 。 etc.) — treat those as sentence terminators too.
- When unclear: capture MORE rather than less. Side panel scroll is fine; mid-sentence is not.

Triggered by John's note 2026-05-28 on a deity-panel cut-off. Affects `scripts/fetch_thumbnails.py`, scripture-text intro fetches, any content backfill.

---

## Critical files (quick links)

| File | Purpose |
|---|---|
| [`00_meta/CODEX.md`](00_meta/CODEX.md) | **Investigative charter — posture / disclaimer-machine / 21-edge-vocabulary / 4-tier source system / what we reject** |
| [`00_meta/ONTOLOGY.md`](00_meta/ONTOLOGY.md) | Structural — 27 lenses + 7 edge buckets + tiers + MASSIVE-WIN patterns |
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
