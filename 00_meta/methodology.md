# Methodology — Standing Operating Procedure

## Pre-flight protocol (read this FIRST every session)

Before any agent or human starts adding/editing nodes:

1. **Read [DASHBOARD.md](DASHBOARD.md)** — it shows the live priority queue (top unstubbed wikilink targets), orphan nodes, quality issues, and inventory by type × status. It tells you what's already in flight and what's most valuable to work on next.
2. **Check [canonical-slugs.md](canonical-slugs.md)** before naming a new file — if the concept already has a canonical slug or a known alias, use that. Slug drift is our largest source of dead links and is preventable.
3. **Read the per-phase `_TODO.md`** for the phase(s) you're working in (e.g., `02_documents/_phase-5-medieval/_TODO.md`). Each phase's TODO auto-lists undone documents and unstubbed named entities.
4. **Re-run `python3 build_dashboard.py`** after your batch so the next session/agent sees current state.
5. **Re-run `python3 build_data.py`** after any node creation/modification so the atlas (`data.js`) reflects your work.

The dashboard is the **work queue**. The canonical-slugs file is the **shared vocabulary**. The per-phase TODO is the **local scope**.

## Core principle
**Investigation, not advocacy.** Every node states what is *attested*, *redacted*, *dated*, *connected* — never what is "true." Spiritual claims are catalogued as historical phenomena.

## Equal-weight document rule
A document's **label** describes its preservation/reception status, not its value as evidence:
- A Nag Hammadi Gnostic codex and a canonical Gospel are both **primary early-Christian-era textual evidence** for what was being thought, taught, or fought over.
- The *reason* one has more cross-links than the other is itself a research finding (who held political power, who copied texts, who burned them).

See [[label-taxonomy]].

## ⚠️ THE WIRING LAW (added 2026-05-15 — highest priority rule)

**Connection IS the product. Every `[[wikilink]]` must resolve to a real node before you commit.**

When you write `[[some-concept]]` in any node, you are making a promise: that concept has a home in the vault. If the file doesn't exist, create it immediately — at minimum a stub. For figures that are MASSIVE WIN cross-tradition targets (Logos figures, Cosmic Human variants, divine feminine manifestations, demiurge figures, etc.), create `metadata`-tier nodes, not just stubs. A stub signals existence. A metadata node carries the edge's meaning.

**Before your final commit:**
1. Scan every `[[wikilink]]` you wrote this session.
2. `find . -name "<slug>.md"` for each one.
3. Missing → create now. Non-negotiable.
4. Run `python3 build_data.py` and check the output for dead-link warnings. Zero introduced dead links = a clean close.

**The root failure pattern to avoid:** writing 5 rich nodes with 30 wikilinks, committing, stopping — and leaving 15 dead links behind. The graph is only as strong as its connections. Broken links are broken arguments.

---

## Node creation workflow (per document)

1. **Stub** — create file in correct `02_documents/_phase-*/` folder with YAML skeleton + title + provisional date range. Status: `stub`.
2. **Metadata pass** — fill YAML completely:
   - `date-composed-earliest` / `date-composed-latest` (scholarly consensus range; cite the range)
   - `date-physical-mss-earliest` (oldest surviving physical witness)
   - `language`, `script`, `region`, `city-of-origin`
   - `authorship` (known | attributed | anonymous | redacted | school | revealed)
   - `themes` (link to `06_themes/` notes — create new theme notes as needed)
   - `parallels` (link to other documents — initial pass)
   - `influenced-by` / `influences` (provisional, with `?` flag if uncertain)
   - `deities-mentioned` (link to `03_deities/`)
   - At least **3 refs**: one primary translation/edition, one peer-reviewed scholar, one university/repository.
   Status → `metadata`.
3. **Context paragraphs** — under the YAML, write:
   - **What it is** (1 paragraph, factual)
   - **Context** (political/religious milieu, who was behind it)
   - **Themes and motifs** (brief, link-heavy)
   - **Connections (provisional)** (one bullet per outgoing edge, with reasoning)
4. **Promotion** — `partial` (selected excerpts) → `full-text` (complete) in scheduled waves.
5. **Edge sweep** — every new node triggers a check: do any *existing* nodes now have a new link to add? If yes, edit them.

## Date conventions
- Always **BCE/CE**, never AD/BC.
- Negative integers in YAML for BCE (e.g., `date-composed-earliest: -1500` means 1500 BCE).
- For oral-then-written texts, both dates: `date-composed-earliest` (presumed oral origin) and `date-redacted` (writing/canonization).

## Source-integrity policy
See [[source-integrity]] for the full rules. Short version:
- **Tier 1 (primary)** — direct translations from critical editions; original-language texts.
- **Tier 2 (scholarly)** — peer-reviewed academic publications, university press monographs.
- **Tier 3 (popular/secondary)** — reputable encyclopedias (Britannica, Stanford Encyclopedia of Philosophy), trade books by named scholars.
- **Tier 4 (controversial/heterodox)** — allowed and useful, but **always labeled** `type: controversial` and balanced by at least one Tier 1–2 source on the same claim.

A claim with **only Tier 4** sourcing is marked `[claim: contested]` in the body.

## Connection rules (edge creation)

Edges between nodes must specify a **type** so the graph is meaningful:

| Edge type | Meaning |
|---|---|
| `parallel-motif` | Same motif appears in both (flood, dying god, etc.) — no claim of direct borrowing |
| `direct-quote` | One text quotes/paraphrases another |
| `redaction-of` | Text B is an edited version of text A |
| `polemic-against` | Text rejects or attacks the other tradition |
| `shared-milieu` | Composed in the same time + place; mutual influence likely but not provable |
| `syncretic-identification` | One tradition identifies its god with another's (Hermes Trismegistus = Thoth, etc.) |
| `manuscript-transmission` | Physical copy descends from the other |
| `commentary-on` | Text B explicitly comments on text A |
| `ancestor-of` (A → B) | Symbol A is documented (textually / archaeologically) as the historical source of symbol B. **Requires a Tier-1 source documenting transmission.** |
| `parallel-form` (A ↔ B) | Symbols share structure but no documented transmission. **Default for cross-cultural visual similarity without evidence of transmission** — not a claim of influence, only of resemblance. |
| `syncretic-fusion` (A + B → C) | Two symbols merged into a syncretic third (e.g., Egyptian crook + flail fused into pharaoh-regalia; sun-disk + cross fused into Constantinian *labarum*). |
| `appropriated-by` (A → tradition B) | One tradition explicitly adopted the symbol from another, with documented continuity (Sol Invictus solar disk → Christ-haloed iconography). |
| `polemic-inversion` (A → A′) | Same symbol used in opposing polemic context (the swastika in Hindu/Buddhist/Jain piety vs. its 20th-c. Nazi appropriation). |
| `visual-cognate` (A ≈ B) | Visually similar across cultures, transmission status unknown / unrecoverable. **Weaker than `parallel-form`** — use when even the formal resemblance is approximate. |

Edges live in YAML (`parallels`, `influenced-by`, `influences`) AND in the Connections section of each node. The `_graph/influences.md` master edge list is regenerated periodically.

## Naming conventions
- Document file: `phase-N-NNN-slug.md` — e.g., `phase-1-001-kesh-temple-hymn.md`
- Deity file: `deity-slug.md` — e.g., `el-canaanite.md`, `el-hebrew.md` (split when traditions diverge)
- Person file: `person-slug.md` — e.g., `zoroaster.md`, `valentinus.md`
- Theme file: `theme-slug.md` — e.g., `flood-motif.md`, `dualism.md`, `demiurge.md`

## Anti-patterns
- Do not collapse syncretic identifications into one node prematurely. **El (Canaanite)** and **El / Elohim (Hebrew)** get *separate* notes with a `syncretic-identification` edge. Same for Inanna/Ishtar/Astarte/Aphrodite — separate notes, edges.
- Do not assert "X is just Y renamed" without a Tier 1–2 source. Comparative-religion claims are *hypotheses* unless an ancient source explicitly identifies them.
- Do not delete sourced material because it conflicts with a newer source. Add the new source and reconcile in a `Disputes` section.

## Symbol-research discipline

The symbology layer (`09_symbols/`) is the area where bad scholarship is easiest to fall into. The **dilettante's trap** is to claim every cross-cultural symbolic parallel is evidence of transmission — when most are independent invention or coincidence. Required discipline:

- **No `ancestor-of` edge without a Tier-1 archaeological / textual source documenting the historical transmission.** Suggestive resemblance is not transmission. The Coptic cross genuinely descends from the ankh (documented in Coptic textile + manuscript record c. 200–400 CE, Bagnall 1993); the swastika does NOT descend from the Egyptian ankh despite visual cognacy.
- **`parallel-form` is the default** for cross-cultural visual similarity without documented transmission. It is NOT a claim of influence — it is a claim of resemblance. Most "cross is universal" or "all wheels are sun-symbols" assertions resolve to `parallel-form` or `visual-cognate`, not `ancestor-of`.
- **Tiering of comparative-religion synthesists — handle individually, not as a bloc:**
  - **Joseph Campbell** — Tier 4 (popular synthesis; *Hero with a Thousand Faces* is genuinely influential but evidentiarily weak; cite when documenting reception, not for primary transmission claims).
  - **René Guénon** — Tier 4 (Traditionalist metaphysics; cite as a primary source for the Traditionalist tradition itself, not as evidence for cross-cultural symbol claims).
  - **Mircea Eliade** — split tiering: **Tier 2** for the phenomenological categories (*hierophany*, *sacred-and-profane*, *axis mundi*, *eternal return*) — these are academic canon and already cited across this vault's theme nodes. **Tier 4** for his pre-WWII Iron Guard / Aryan-myth essays specifically. Each Eliade citation must specify which work and tier individually; do not lump. *Patterns in Comparative Religion* and *The Sacred and the Profane* → Tier 2. *Yoga: Immortality and Freedom* → Tier 2 with caveat about dated Indological framing. Pre-1940 political essays → Tier 4.
- Naïve diffusionist claims (Massey, Higgins, Acharya S., "religion is all the same Solar Myth") get explicit `[claim: pseudoscholarship]` tags and a Tier-4 ref-label.
- Indus Valley / Voynich / Phaistos style undeciphered symbols get `mystery-status: mystery` and **no interpretive body claims** — only attestation + the scholarly state-of-debate.
- **The swastika rule:** every entry for the swastika (and any symbol with a similar appropriation history) must surface BOTH the ancient sacred use AND the 20th-c. Nazi appropriation without conflating them. Goodrick-Clarke 1985/2004 *The Occult Roots of Nazism* + Heller 2000 *The Swastika: Symbol Beyond Redemption?* are the load-bearing sources for the appropriation branch. Both attestation timelines must be explicit and the body must NOT flatten the polemic-inversion into a single continuous tradition.
