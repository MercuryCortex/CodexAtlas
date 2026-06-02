# MEMBERSHIP-AND-WIRES — the singular-home + tiered-appearance model

**Status: RATIFIED 2026-06-02 by John. This is the canonical source of truth for how a node belongs to a family and how it reaches into other families. It supersedes every prior ad-hoc treatment of multi-valued `tradition:` fields.**

This document exists because the vault conflated two different things — *membership* and *reach* — and that conflation compromised ~52% of deities and ~32% of persons (the MEMBERSHIP-VS-WIRE crisis, `AUDIT/2026-06-02-MEMBERSHIP-VS-WIRE-CRISIS.md`). Read this before touching any `tradition:`, `family:`, `role-tokens:`, or wedge-placement work.

---

## §1 — The principle (John, verbatim, 2026-06-02)

> *"if a character appears in a family, HE IS THAT FAMILY POINT BLANK PERIOD FULL STOP. associations with other families will be WIRED or paths by AUTHORS or WTVER transmits them."*

> *"figures belong FIRST to one family but might transmit and appear in other families at some point. … Christ is always number one in christianity, but if we are in a gnosticism christian wheel he MIGHT appear if the lenses allow, since the TIER-one level is not reflected — i.e. an appearance."*

Two rules fall out of this:

1. **One home, singular.** Every node belongs to exactly ONE family — its origin/native tradition. This is its **tier-1** membership and it alone determines wedge placement.
2. **Reach is wires, carried by transmitters.** Everywhere else a figure appears, it appears as an **appearance** — an edge carried by the document/author/event that transmitted it across the boundary. An appearance is never a membership.

The wires ARE the project (the MASSIVE-WINS). Collapsing reach into membership erases the wire, which is the deliverable.

---

## §2 — The tier scale (one scale, every figure↔family relation)

| Tier | Meaning | Stored as | Renders in that family's chart… |
|---|---|---|---|
| **1 — home / canonical member** | The node's singular origin family. *Christ→Christianity; Seth→Hebrew Bible; Brigid→Celtic.* | the singular `tradition:` field (NOT a wire) | **always** |
| **2 — major appearance** | Doctrinally / narratively central in the *receiving* family. *Christ in Gnostic Christianity; Seth-as-redeemer in Sethian Gnosticism; Brigid→St Brigid in Christianity; Adam in the Quran.* | `appearance-tier: 2` on a transmission wire | when the lens shows appearances at all |
| **3 — minor appearance** | Present but peripheral in the receiving family. *Shīth in Islamic prophet-lists.* | `appearance-tier: 3` on the wire | only under a permissive lens |

- Tier-1 is **unique** per node (the singular home). Appearances are always tier ≥2 — the receiving family has its OWN tier-1 figures.
- Tier is set by **academic prominence in the receiving tradition**, per the T1-academic-default discipline. Not by how important the figure is at home.
- `appearance-tier` is a **distinct axis** from `source-tier` (T1–T5 sourcing reliability) and from `political-risk-flag`. Same word "tier," three orthogonal meanings — never conflate them.

---

## §3 — What is and is NOT a violation

**NOT a violation — within-family synonym/cluster labels.** A `tradition:` field whose components all map to the SAME family is fine. These are descriptive labels, not cross-tradition membership:
- `"Sumerian / Akkadian"` → Mesopotamian (one family)
- `"Norse / Germanic"`, `"Vedic / Hindu"`, `"Nahua / Aztec"`, `"Canaanite / Ugaritic"`

The fix for these is cosmetic at most (collapse to a clean single label). They do **not** need wires.

**Violation — cross-family cram.** A `tradition:` field whose components map to DIFFERENT families. The first/origin component's family is the home; every other family becomes an appearance-wire:
- `"Zoroastrian → Hebrew Apocrypha → rabbinic Judaism → Christian"` (Aeshma): home **Zoroastrian**; appearances Israelite/Rabbinic/Christian.
- `"Celtic paganism (Gaelic) → Irish Christianity"` (Brigid): home **Celtic**; appearance Christian (St Brigid), tier-2.

**Measured scope (2026-06-02, via `scripts/analyze_tradition_membership.py`):**
- Deities: 719 total → 465 singular, 181 within-family (trivial), **57 genuine cross-family** (16 HIGH / 41 MEDIUM conviction), 16 no-tradition.
- Persons: 1217 total → 436 singular, 203 within-family, **81 genuine cross-family** (27 HIGH / 54 MEDIUM), 497 no-tradition.

The real lockable problem is **~138 cross-family nodes**, NOT the 758 the raw multi-valued count implied. The headline conflated harmless within-family slashes with real violations.

---

## §4 — Determining the home (origin) tradition

1. **Earliest attestation wins.** The home is the tradition in which the figure is first attested as a named figure. We already carry dates + attestation, so this is objective and citable. *Seth → Genesis. Aeshma → the Avesta. Brigid → Gaelic paganism.*
2. **Arrows and order encode it.** `"Phrygian → Greek → Roman"` reads origin-first; the leftmost component is the home. Most `;`-lists also put origin first.
3. **Composites home to their birth-milieu.** A genuinely new merged entity (`composite-deity`) homes to the tradition where the composite emerged, with its components wired in as separate nodes. *Hermes Trismegistus → Greco-Egyptian Hermetic; Sarapis → Ptolemaic.*
4. **Cognate ≠ shared membership.** PIE/Indo-Iranian cognates (Dyaus/Zeus/Jupiter/Týr; Vedic Yama / Avestan Yima) are **separate nodes** joined by `cognate` wires — never one node in many families. The deity schema's splitting rule (`el-canaanite` ↔ `el-elohim-hebrew`) already encodes this; this model generalizes it.
5. **Genuinely contested origins → FLAG, never guess.** If two traditions have an equal claim with no attestation priority, surface it for John one at a time. No silent defaulting (the no-silent-guessing rule).

---

## §5 — Schema encoding

**Home (the singular field):**
```yaml
tradition: "Hebrew Bible"        # SINGULAR — one origin tradition → sets family/wedge
```

**Appearances (wires) — on `syncretic-edges:`, carried by the transmitter:**
```yaml
syncretic-edges:
  - target: "[[phase-4-002-apocryphon-of-john]]"   # the DOC/AUTHOR that transmits it
    type: "direct-borrowing"                       # existing 21-type vocab — named-figure re-use
    appearance-tier: 2                             # prominence in the RECEIVING family
    role-in-context: "gnostic-redeemer-figure"     # the role IN that tradition (vocab token)
    source: "Turner, John D. (2001) Sethian Gnosticism and the Platonic Tradition"
    source-tier: "T1"                             # sourcing reliability — DIFFERENT axis
    notes: "Hebrew Seth adopted as the cosmic-redemptive seed of Seth."
```

Notes:
- **No new edge-type is needed.** `direct-borrowing` ("explicit re-use of a named figure", e.g. Iblis ← Christian Satan) already expresses cross-tradition adoption. Reception that is canonical-scripture in the receiving tradition uses `attested-in` to the receiving canon's text.
- **`role-tokens:` carries ONLY home-tradition roles.** A role belonging to an adopting tradition (Seth's `gnostic-redeemer-figure`) moves to `role-in-context` on the wire. This reuses the controlled-vocab registry — the tokens stay valid, they just attach to an edge.
- **Preserve provenance.** When singularizing, keep the original multi-valued string in `tradition-raw:` (audit field) so nothing is silently lost and the migration is reversible.

---

## §6 — How charts consume the tier

The chart engine already takes a swappable `groupBy` (cardinal rule #9). This model adds ONE lens parameter: **`appearanceTierThreshold`**.

- A **family chart** renders all its tier-1-home members natively, then — if the lens sets a threshold — also pulls in figures whose home is elsewhere but who have an appearance-wire INTO this family at tier ≤ threshold, drawn in an **appearance style** (ghosted/ringed, positioned by the wire, not as a native member).
- **All-families chart:** every figure once, in its home wedge; wires drawn out to its appearances.
- *"If the lenses allow"* = the chart's `appearanceTierThreshold`. A strict Gnostic wheel (threshold 1) shows only native Gnostic figures; a permissive one (threshold 2) lets Christ and Seth appear.

`tradition_family()` in `build_data.py` — the ~150-line order-dependent heuristic pile — collapses to a flat `TRADITION_TO_FAMILY` dict once `tradition:` is singular, because there is no multi-valued string left to disambiguate.

---

## §7 — The scripture exception (the one place that differs)

A scripture **book** is genuinely canonical in multiple living canons (Genesis is canonical in both the Tanakh and the Christian OT — neither "adopted it as a foreign object"). Therefore:

- Scripture nodes **also** get a **singular origin** `tradition:`/`family:` for wedge placement (Genesis originates Israelite; its place in the Christian canon is itself a transmission).
- But `canonical-corpus:` **stays legitimately multi-valued** as a SEPARATE axis — "which canons include this book" is a real many-to-many that does NOT determine wedge.

**Singular origin (wedge) + multi-valued canon-membership (a different axis).** This is the one ratified divergence from the figures rule. Do not import multi-membership back into wedge placement for scripture.

---

## §8 — The sweep order (John's methodology, 2026-06-02)

> *"start by locking deities with strong conviction — then move to the literature (the ROOT in principle that justifies all the lore and root of that deity) — then figures — etc. Once all the deities and books and key figures that stem from or connect to them are LOCKED with conviction, all the rest will become natural flow."*

1. **Deities first**, strong-conviction batch first (clean HIGH), then MEDIUM with per-node review, then contested→John.
2. **Literature (scripture/documents)** — the root that justifies the lore; apply §7.
3. **Figures (persons)** — same model.
4. **The rest flows** once the anchors are locked.

---

## §9 — Zero-tolerance rules (carried from the crisis diagnostic)

1. **Never patch a single node to dodge the structural problem.** Fix the model, sweep with tooling.
2. **Never build a mass migration before the model is ratified.** (Ratified 2026-06-02; build may proceed.)
3. **Never trust mechanical classification blindly** — the analyzer had real bugs (`kami`↔"Kamilaroi", `pre-Christian`↔Christian, missing Phrygian). Verify HIGH before locking; never auto-apply MEDIUM.
4. **Cross-tradition info MOVES to edges, it never vanishes.** Acceptance test: post-fix, cross-tradition edge count rises, never drops. Preserve `tradition-raw:`.
5. **The acceptance test is visual:** Seth must render in the HEBREW wedge with his Gnostic/Mandaean/Islamic reach visible as wires; Brigid in CELTIC with St-Brigid as a tier-2 Christian appearance.

---

*References: `AUDIT/2026-06-02-MEMBERSHIP-VS-WIRE-CRISIS.md` (diagnostic) · `feedback_membership_vs_wire_crisis_2026-06-02.md` (memory) · `00_meta/PROTOCOL.md §3.1` (21-type edge vocab) · `00_meta/HOW-WE-WORK.md §5` (cardinal rules) · `scripts/analyze_tradition_membership.py` (read-only scope report).*
