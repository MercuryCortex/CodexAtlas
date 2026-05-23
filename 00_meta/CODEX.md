# CODEX — Investigative Charter of the Codex Atlas Project

*Version 1.0 — locked 2026-05-23. Living document; revisions require a dated AUDIT/ doc.*

---

> **The vault is an investigation tool, not an advocacy site, not a catalogue of an authority.**
>
> Every wire is a claim with a citation. The wire's *type* tells you what kind of claim is being made (identity / borrowing / cognate / parallel / polemic). The wire's *source-tier* tells you how strongly it's supported (mainstream peer-review / academic minority / alternative-school / popular-claim-rejected). The wire's *source* tells you who made the claim.
>
> The reader sees all three. The reader decides.

This document is the project's epistemic constitution. It is read by every agent on cast. It is the seed for the user-facing "About" / "How we cite" section. It is updated only by a dated revision with an AUDIT/ rationale doc.

---

## I. Posture

The vault has three rules of stance that govern everything else:

1. **Investigation, not advocacy.** We surface the connections, name what kind of connection they are, cite the source. We do not endorse the source's theology. A wire from Father → YHWH labeled `same-as` is documenting Christianity's *own* claim, not asserting Christian truth. A wire from Krishna → Vishnu labeled `manifestation-of` documents Vaishnava theology, not Vaishnava preference.

2. **Pluralism, not orthodoxy.** Multiple academic frameworks for studying cross-tradition religion coexist (J.Z. Smith's analogy-vs-homology, Assmann's *translatio deorum*, Parker's three-axis interpretatio, Dumézil's trifunctional, Mark Smith's translatability, Stewart-Shaw's syncretism politics). We do not adopt any single one as authoritative. Each wire's `type:` and `source:` tells the reader which framework is being invoked, and the reader can compare.

3. **Disclosure, not concealment.** Widely-circulated claims that mainstream rejects (Graham Hancock's pre-13,000-BCE civilization, Sitchin's Nibiru, Schoch's Sphinx-erosion) are INCLUDED in the vault — labeled with their tier and shown alongside the academic rebuttal. Pretending they don't exist lets them circulate unrebutted in the world. Inclusion with disclaimer is the more honest path.

---

## II. The Disclaimer Machine

Every cross-tradition wire surfaces three pieces of information:

| Layer | What it tells the reader |
|---|---|
| `type:` | The KIND of claim — one of the 21 vocabulary types (§III). Identity? Borrowing? Cognate? Parallel? Polemic? |
| `source:` | WHO is making the claim — the ancient writer, the modern scholar, the tradition itself. Author + Year + Work + page if specific. |
| `source-tier:` | HOW STRONG the source is — T1 mainstream / T2 academic-minority / T3 alternative-school / T4 popular-claim-rejected (§IV). |
| `notes:` *(optional)* | Scholarship nuance that doesn't fit in the other three. The mainstream rebuttal for T3/T4 claims goes here. |

The reader hovers a wire. Sees the type. Sees the source. Sees the tier. Reads the notes. Decides.

This is the disclaimer machine. Not "trust the vault"; not "trust the source"; but "see what claim is being made, see who's making it, see how strong it is, see what the alternative view is."

---

## III. The 21-Type Cross-Tradition Edge Vocabulary

Full technical reference in [PROTOCOL.md §3.1](PROTOCOL.md). Summary here:

**TRANSMISSION (bronze)** — Smith's homological comparison; the figures share descent.
`cognate` · `direct-borrowing` · `iconographic-borrowing` · `substrate-influence` · `continuous-development`

**PARALLEL (teal)** — Smith's analogical comparison; structure resembles, no descent claim.
`scholarly-parallel` · `parallel-motif` · `functional-equivalent` · `interpretatio-nominal`

**FUSION (orange)** — a new third entity emerges OR a doctrinal-identity claim merges two figures.
`same-as` · `interpretatio-cultic` · `ancient-identification` · `composite-deity` · `folk-syncretism`

**KINSHIP (lilac)** — mythic family / aspect / part-of relations.
`manifestation-of` · `constituent-of`

**POLEMIC (red)** — one tradition reframes, rejects, or contests another.
`polemic-against` · `polemic-inversion` · `demonization` · `prefiguration-claim` · `negative-identification`

Each type maps to a Wikidata property where applicable (P138, P144, P460, P461, P1889, P361, P5800) for future linked-data interop. Hard cap at 21 types — adding a 22nd requires an AUDIT/ doc.

**Methodological pluralism**: the catalog deliberately accommodates Smith, Assmann, Parker, Dumézil, Mark Smith, Stewart-Shaw, Pye, Doniger, Burkert. We **reject** Eliade-style telescope-scale "all sun-gods are X" identification; if a source makes such a claim, route via `scholarly-parallel` with a notes-flag.

---

## IV. The 4-Tier Source System

Every node and edge carries a source-tier label. Four levels:

### T1 — Mainstream peer-reviewed

Standard scholarship. Published in academic presses (Brill, Cambridge UP, Oxford UP, university presses), peer-reviewed journals, or recognized reference works (Encyclopedia of Religion, LIMC, IDD).

**Examples**: Doniger on Hindu mythology; Boyce on Zoroastrianism; Hornung on Egyptian gods; Pelikan on Christian theology; Pearson on Gnostic-Mesopotamian transmission; West on Indo-European poetry; Parker on Greek religion.

**Wire treatment**: standard. No warning chrome. This is the default.

### T2 — Academic minority

Published academics holding a contested but legitimate position within their own field. They have peer-reviewed publications, their work is engaged with by their discipline, but their specific conclusion is not the consensus.

**Examples**:
- Robert Schoch (Boston U. geologist) on Sphinx weathering = older Sphinx
- Richard Carrier on Jesus-mythicism
- Israel Finkelstein on low-chronology biblical archaeology (was T2 in 1990s, increasingly mainstream now)
- Some Indo-Iranian comparative readings that mainstream rejects

**Wire treatment**: wire renders standard; on-hover tooltip says "academic minority view per [author]". The `notes:` field should cite the mainstream-majority position so the disagreement is visible.

### T3 — Alternative-school

Sustained body of published work, major publishers, large readership, has academic critics engaging with the claims (academia bothers to refute = de-facto recognition). NOT mainstream-accepted, but NOT pseudoarchaeology either — these are serious researchers operating outside the academy or alongside it.

**Examples**:
- Graham Hancock (*Fingerprints of the Gods*, *Magicians of the Gods*, *America Before*) — pre-13,000-BCE civilization, Younger Dryas catastrophe
- Randall Carlson — Younger Dryas Impact Hypothesis (geological)
- Robert Bauval — Orion Correlation Theory
- Schwaller de Lubicz — symbolist Egyptology
- John Anthony West — Sphinx-as-old (popularized Schoch)
- Andrew Collins — Cygnus mystery, Göbekli Tepe interpretations
- Manly P. Hall — Hermetic encyclopaedia
- René Guénon / Frithjof Schuon — Traditionalist school
- Mauro Biglino — Italian biblical translator (Elohim-as-Anunnaki direction)

**Wire treatment**: wire renders standard. On-hover tooltip shows `[type] [T3 — alternative-school]` plus the claim source plus the mainstream rebuttal in `notes:`. The wire itself uses the bucket color (transmission/parallel/fusion/polemic) — the T3 label is *meta*, separate from the bucket.

The rule for citing T3 claims: **always pair the claim source with a peer-reviewed rebuttal in `notes:`**. So a T3 wire reads:
```
type: parallel-motif
source: Hancock 1995 *Fingerprints of the Gods* (Crown); Carlson 2014 (geological)
source-tier: T3
notes: Mainstream rebuttal: Holliday et al. 2014 "The Younger Dryas Impact Hypothesis" *Journal of Quaternary Science*; Pinter et al. 2011. The vault includes this connection because it is widely-discussed; both sides cited.
```

### T4 — Popular claim — rejected

Heavily promoted in popular media but near-universally rejected by academia. No academic defenders. Pseudoarchaeology, New-Age fabrication, conspiracy-overlay.

**Examples**:
- Zecharia Sitchin — Nibiru / Anunnaki
- Erich von Däniken — ancient astronauts (*Chariots of the Gods?*)
- Drunvalo Melchizedek — Flower of Life as New-Age
- Edgar Cayce — Hall of Records under the Sphinx
- Helena Blavatsky / Theosophical Society — Root races / Lemuria / Atlantis (late 19th c)
- Immanuel Velikovsky — *Worlds in Collision*
- David Icke — reptilian-elite
- Joseph Atwill — Jesus-as-Roman-invention
- D.M. Murdock / Acharya S — Christ-as-Horus

**Inclusion threshold for T4**: include ONLY if the claim is widely-circulated enough that the vault's rebuttal serves a public-information function. Sitchin's Nibiru is worth including because millions believe it. Pure-internet single-source fabrications are not.

**Wire treatment**: wire renders ONLY when the rebuttal-node has documentary value. On-hover: `[type] [T4 — popular claim — rejected]` with the claim source AND the mainstream-rebuttal citation prominently in `notes:`. The vault essentially serves the rebuttal alongside the claim.

### Threshold for inclusion across all tiers

Include T1 by default. Include T2 by default. Include T3 by default. Include T4 ONLY if the claim is widely-circulated enough that the vault's rebuttal-node carries value (typical examples: Nibiru, von Däniken's specific famous claims like Nazca lines, Atlantis-under-the-Sphinx).

Exclude: random-internet-source-only claims with no major-publisher work; single-page web fabrications.

---

## V. What We Explicitly Reject

We are pluralistic, not infinite. Some moves the vault refuses to make:

1. **Eliade-style telescope identification.** "All sun-gods are X" / "all moon-goddesses are the Goddess" / "every dying-and-rising god is one." J.Z. Smith dismantled this in *Drudgery Divine* (1990). If a source makes such a claim, route via `scholarly-parallel` with a notes-flag — never as `same-as`.

2. **Mainstream-only orthodoxy.** Refusing to include T3 claims because mainstream rejects them is its own form of doctrinal lock-in. The vault is poorer if it pretends Hancock doesn't exist.

3. **Single-school doctrine.** Adopting Assmann's interpretatio-as-translation as the sole framework, or Smith's analogy-vs-homology as the sole methodology, or Doniger's microscope-vs-telescope as the sole heuristic — any of these collapses the schema into one academic's worldview. We accommodate multiple, surface the differences in `type:`+`source:`+`notes:`.

4. **Asserting claims without citation.** The wiring law (PROTOCOL §3.1) is strict: every edge has a `source:`. If a claim has no published source, it doesn't get a wire.

5. **Surfacing T4 in the same chrome as T1.** The reader must be able to see at a glance "this is mainstream consensus" vs "this is a contested popular claim". Tier badges are visible on every wire-hover.

6. **Hierophany-mode "deep" or "essential" identifications.** Phenomenological depth-claims ("Christ and Krishna are both manifestations of the One Logos") are theology, not investigation. They belong in 21_theology/ as theological positions held by named thinkers, not as cross-tradition wires in 03_deities/.

---

## VI. How Agents Apply This

Every content-lane agent working on cross-tradition wiring must:

1. **Read CODEX before any cross-tradition batch** — alongside PROTOCOL §3.1's 21-type vocabulary and the 4-tier system.

2. **Tag every claim with a source-tier**: T1 / T2 / T3 / T4. This goes in the `source-tier:` field of `syncretic-edges:` and (for T2/T3/T4) flags the inclusion-as-disclaimer-machine ethic.

3. **Pair T3 and T4 claims with mainstream rebuttals in `notes:`**. Never include a Hancock-tier claim without the matching academic rebuttal cited alongside.

4. **Use the 21 edge types from PROTOCOL §3.1** — don't invent new types. If a case doesn't fit, document the gap in an AUDIT/ doc and propose the addition.

5. **Never hide an authored claim with significant readership**. Hancock, Carlson, Sitchin all have widely-distributed published work. Disagreement with mainstream is not grounds for exclusion — the vault wins by surfacing the disagreement transparently.

6. **Never blanket-endorse**. The agent's job is to surface what scholarship documents. Editorializing — saying which school is "right" — is out of scope.

7. **Reciprocity**. When wiring A→B, also wire B→A per the WIRING LAW (PROTOCOL §3.1 sub-rule d). This applies regardless of tier.

---

## VII. The User-Facing "About" Section

The user-visible About page renders a SHORTENED version of this CODEX:

- §I (Posture) — full text
- §II (Disclaimer Machine) — full text
- §III (21 types) — summary table + link to PROTOCOL §3.1
- §IV (4 tiers) — summary table with examples
- §V (Rejection list) — full text

§VI (How agents apply) is omitted from the user-facing page — that's internal discipline.

The About section makes the vault's epistemic stance LEGIBLE to every visitor before they form any opinion about the data they see. A Christian visitor, a Buddhist visitor, a secular-academic visitor, a Graham-Hancock-reader visitor — they all see the same posture statement and understand that the vault is showing them scholarship and disagreement, not making theological claims.

---

## VIII. Living Document

CODEX is versioned by date. The current version is **1.0 — 2026-05-23**.

Changes require:

1. An AUDIT/ doc dated and titled `codex-revision-<topic>-<date>.md` explaining what is changing and why.
2. A commit message explicitly noting the CODEX version bump.
3. The DASHBOARD surfaces the current CODEX version + last-updated date.

Cross-references (kept current):
- [PROTOCOL.md §3.1](PROTOCOL.md) — the 21-type edge-vocabulary spec
- [ONTOLOGY.md](ONTOLOGY.md) — the 27 lenses + 7 edge buckets
- [AGENTS.md](../AGENTS.md) — pre-flight read order; references this doc
- [LANES.md](LANES.md) — Lane A / Lane B discipline
- [AUDIT/edge-vocabulary-deep-audit-2026-05-23.md](../AUDIT/edge-vocabulary-deep-audit-2026-05-23.md) — the scholarship audit behind the 21-type catalog
- [AUDIT/cross-tradition-deity-bridges-2026-05-23.md](../AUDIT/cross-tradition-deity-bridges-2026-05-23.md) — the cross-tradition gap audit

---

*Codex Atlas. An investigation tool. We surface; we cite; we tier; we never assert.*
