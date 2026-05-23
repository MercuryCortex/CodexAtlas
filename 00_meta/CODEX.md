# CODEX — Investigative Charter of the Codex Atlas Project

*Version 1.1 — locked 2026-05-23. Living document; revisions require a dated AUDIT/ doc.*

*Changelog:*
*- v1.1 (2026-05-23) — added T5 disclaimer-required tier (Icke / Evola / Theosophy-as-Nazi-substrate cases) + investigation-as-prompt rule (fringe-author claims open investigation toward legitimate-source parallels)*
*- v1.0 (2026-05-23) — initial lock*

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

Heavily promoted in popular media but near-universally rejected by academia. No academic defenders. Pseudoarchaeology, New-Age fabrication, conspiracy-overlay. **Politically neutral** — wrong, but not extremism-adjacent.

**Examples**:
- Zecharia Sitchin — Nibiru / Anunnaki
- Erich von Däniken — ancient astronauts (*Chariots of the Gods?*)
- Drunvalo Melchizedek — Flower of Life as New-Age
- Edgar Cayce — Hall of Records under the Sphinx
- Helena Blavatsky / Theosophical Society — Root races / Lemuria / Atlantis (late 19th c — NOTE: Blavatsky's root-race doctrine has politically-fraught downstream reception; treat as T4 for the core claims but flag T5 caveats where the root-race material is being invoked)
- Immanuel Velikovsky — *Worlds in Collision*
- Joseph Atwill — Jesus-as-Roman-invention
- D.M. Murdock / Acharya S — Christ-as-Horus

**Inclusion threshold for T4**: include ONLY if the claim is widely-circulated enough that the vault's rebuttal serves a public-information function. Sitchin's Nibiru is worth including because millions believe it. Pure-internet single-source fabrications are not.

**Wire treatment**: wire renders with `[type] [T4 — popular claim — rejected]` and the mainstream-rebuttal citation prominently in `notes:`. The vault essentially serves the rebuttal alongside the claim.

### T5 — Disclaimer-required (political-risk-flag)

A subset of T4-popular-rejected claims that ALSO carry documented hate-speech, antisemitism, fascist-occultism, or political-extremism reception. The claim itself might be the same kind of pseudoarchaeology as T4 — but the AUTHOR's wider work, or the political downstream of the claim, has been documented by civil-rights watchdogs or peer-reviewed political-history scholarship as carrying extremism risk.

**Examples**:
- **David Icke** — reptilian-elite mythology; documented as antisemitic dog-whistle by ADL + Hope Not Hate
- **Julius Evola** — Traditionalist + hermeticist whose work has been formative for European neo-fascism (Goodrick-Clarke 2002 *Black Sun*)
- **Joseph Atwill** in some receptions (*Caesar's Messiah* as anti-Christian-conspiracy material)
- Theosophical root-race material specifically when invoked in modern Aryan / white-nationalist contexts (the source-theosophy is T4; the contemporary invocation is T5)

**Inclusion**: ALWAYS collect, never discard. The node exists in the data. The wire exists in the graph. But:

**Wire treatment for T5**:
- **Hidden by default** in the legend tier-toggle (T1-T4 ON; T5 OFF). User must explicitly opt-in.
- When surfaced, the tooltip leads with the political-risk caveat BEFORE the claim itself: "Author's wider work documented as [antisemitic / fascist-occultist / etc.] reception per [ADL / Goodrick-Clarke / scholarly source]. This vault includes the specific claim AND the rebuttal AND the political-context warning."
- Wired ONLY via `polemic` edges (`polemic-against`, `polemic-inversion`, `demonization`, `prefiguration-claim`, `negative-identification`) — never `same-as` / `direct-borrowing` / kinship-bucket types. The figure is not a "religious thinker" in our schema.
- The Evola pattern: state the texts AND state the political downstream together. Goodrick-Clarke 2002 cited in `notes:` mandatory.
- The Blavatsky-Icke pattern: state the claim AND state the documented hate-speech reception together. ADL or equivalent civil-rights citation in `notes:` mandatory.

### Threshold for inclusion across all tiers

| Tier | Default visibility | Inclusion criterion |
|---|---|---|
| T1 | ON | Default |
| T2 | ON | Default |
| T3 | ON | Default — sustained published work + major publisher + academic engagement |
| T4 | ON | Widely-circulated enough that rebuttal serves public-information function |
| T5 | OFF (opt-in) | T4 criteria PLUS documented hate/extremism reception |

Exclude entirely: random-internet-source-only claims with no major-publisher work; single-page web fabrications; figures with no readership.

### Investigation-as-prompt rule (T3 / T4 / T5 specific)

The vault treats fringe-author claims as **investigation prompts, not authorities**. When a T3/T4/T5 figure claims a specific cross-tradition connection (e.g. Icke claims Marduk = reptilian-elite ancestor; Sitchin claims Anunnaki = aliens; Däniken claims Nazca lines = landing-strips), the vault response is:

1. **Wire the claim** with the appropriate tier label + mainstream-rebuttal — per the standard disclaimer-machine pattern.
2. **OPEN INVESTIGATION**: ask "does any LEGITIMATE source (T1 or T2) document the same *structural pattern* the fringe author noticed?" Often the answer is *yes, but interpreted differently*:
   - Icke's "reptilian Marduk" → real scholarship documents dragon-slayer / chaoskampf serpent in Mesopotamian theology (Smith 1994; Lambert 2013); the *underlying iconography* is real, the *political interpretation* is not.
   - Sitchin's "Anunnaki astronauts" → real Akkadian-Sumerian texts DO use anunnaki to mean a specific divine class (Bottéro; Black & Green Brill); the *texts* are real, the *aliens* are not.
   - Däniken's "Nazca lines" → real archaeology documents the Nazca geoglyphs and their probable ritual function (Reinhard; Aveni); the *geoglyphs* are real, the *landing-strips* are not.
3. **Wire BOTH layers**: the fringe claim with its rebuttal, AND the legitimate scholarship documenting the underlying pattern. The reader can see what the fringe author noticed AND what scholarship actually says about it.

This turns the vault from a *gallery of debunkings* into an *investigation tool that uses fringe claims as starting points for legitimate inquiry*. Same epistemic posture — pluralism + disclosure — applied to the fringe layer.

### Always-collect, never-discard

Even T5 figures whose work we never surface in any default view are NODES in the vault. The data exists. Future researchers can opt-in, see the wire, follow the investigation chain. We do not censor; we tier and we toggle. If a T5 figure's risk profile changes (improves or worsens), we re-tier — but the data stays.

This is non-negotiable. The alternative — discarding the data — would mean the vault becomes a curator of its own preferred orthodoxy. CODEX rejects that.

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

3. **Pair T3 and T4 claims with mainstream rebuttals in `notes:`**. Never include a Hancock-tier claim without the matching academic rebuttal cited alongside. **For T5, additionally cite the political-risk source** (ADL / Goodrick-Clarke / equivalent civil-rights or political-history scholarship) in `notes:` BEFORE the rebuttal — the political risk leads the disclaimer.

4. **Use the 21 edge types from PROTOCOL §3.1** — don't invent new types. If a case doesn't fit, document the gap in an AUDIT/ doc and propose the addition.

5. **Never hide an authored claim with significant readership**. Hancock, Carlson, Sitchin all have widely-distributed published work. Disagreement with mainstream is not grounds for exclusion — the vault wins by surfacing the disagreement transparently.

6. **Never blanket-endorse**. The agent's job is to surface what scholarship documents. Editorializing — saying which school is "right" — is out of scope.

7. **Reciprocity**. When wiring A→B, also wire B→A per the WIRING LAW (PROTOCOL §3.1 sub-rule d). This applies regardless of tier. **T5 EXCEPTION**: do NOT wire reciprocal back-links FROM the legitimate-deity TO the T5-figure on the deity's primary node. The fringe-claim node carries the T5 wire; the deity does not carry "Icke claimed I was a reptilian" in its own equivalents. This prevents T5 contamination of major-deity nodes that users may browse with T5-toggle ON or OFF.

8. **Investigation-as-prompt** (T3/T4/T5). When you wire a fringe claim, ALSO check whether legitimate scholarship documents the underlying *structural pattern* the fringe author noticed. Wire BOTH layers per §IV's investigation-as-prompt rule. Use the fringe claim as a starting point for legitimate inquiry, not as an authority.

---

## VII. The User-Facing "About" Section + Tier Toggle UX

The user-visible About page renders a SHORTENED version of this CODEX:

- §I (Posture) — full text
- §II (Disclaimer Machine) — full text
- §III (21 types) — summary table + link to PROTOCOL §3.1
- §IV (5 tiers including T5) — summary table with examples + tier-toggle UI explanation
- §V (Rejection list) — full text

§VI (How agents apply) is omitted from the user-facing page — that's internal discipline.

### Tier-toggle UI (Legend tab)

The Forge view (and every other view that shows cross-tradition wires) has a **tier toggle** in the legend panel — five checkboxes:

```
Source tiers
  ☑ T1 — mainstream scholarship
  ☑ T2 — academic minority view
  ☑ T3 — alternative-school (Hancock, Carlson, Bauval)
  ☑ T4 — popular claim — rejected (Sitchin, Däniken, Cayce)
  ☐ T5 — disclaimer-required (politically extreme reception — Icke, Evola)
```

Default state: T1-T4 ON, T5 OFF. The user can toggle any combination. Wires render only for currently-enabled tiers. T5 stays OFF unless the user explicitly opts-in — making the disclaimer act of opt-in itself a small consent gesture.

When T5 is ON and a T5 wire renders, its tooltip leads with the political-risk caveat BEFORE the claim itself — the user must read the warning before they read the alleged connection.

The About section makes the vault's epistemic stance LEGIBLE to every visitor before they form any opinion about the data they see. A Christian visitor, a Buddhist visitor, a secular-academic visitor, a Graham-Hancock-reader visitor — they all see the same posture statement and understand that the vault is showing them scholarship and disagreement, not making theological claims.

The tier toggle is the visible UX expression of CODEX's pluralism: the user controls which strata of claims they want to see, and they see the strata labeled honestly.

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
