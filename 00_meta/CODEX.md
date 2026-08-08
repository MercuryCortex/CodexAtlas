# CODEX — Investigative Charter of the Codex Atlas Project

*Version 1.4 — locked 2026-08-08. Living document; revisions require a dated AUDIT/ doc.*

*Changelog:*
*- v1.4 (2026-08-08) — **T0 — ORIGIN tier** (§IV.0). The primary text in its own voice, NOT a weaker T1 and not on the T1→T5 scale at all: T0 reports what a source SAYS, T1–T5 grade what scholarship makes of it. When a T0 and a T1 disagree on the same point BOTH stay on the panel — the disagreement is the finding, not an error to resolve toward the academy. Where the graph can only draw one value (a timeline coordinate), pick one system, apply it consistently, and carry the alternative in `date-note:`/`## Disputes`. Rationale: `AUDIT/2026-08-08-t0-origin-tier.md`.*
*- v1.3 (2026-05-23) — **SFW / MAGNUM doctrine** (§IX). The vault has TWO deployment forms: MAGNUM (full vault, local-only by default, eventually auth-gated for trusted subscribers / institutions / academies) and SFW (full vault MINUS every political-risk-flagged node and edge, no orphans, no clues). Default upload posture = SFW. MAGNUM upload requires explicit human audit of `00_meta/HIGH-ALERT-INDEX.md`. Agents NEVER self-censor at gather-time — they catalogue everything, label heavily, and the SFW filter at deploy-time is the safety gate. The 99% of humans benefit from full investigation; the gate exists for the 1% bad-actor / low-context pipeline. Added `scripts/build_sfw.py` as the SFW builder.*
*- v1.2 (2026-05-23) — **Tier and political-risk-flag are ORTHOGONAL axes**, not the same scale. T5 measures intellectual mainstream-acceptance; political-risk-flag measures real-world harm-wiring. Codified the **⛔ BLACK ALERT** visual escalation: any node/edge with `political-risk-flag: true` gets escalated chrome regardless of tier, distinguishing politically-dangerous content (racial-mysticism, ethno-nationalist occultism) from intellectually-contested content (psychedelic mysticism, parapsychology). Added the HIGH-ALERT-INDEX.md generator for fast human + agent triage.*
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

### T0 — Origin: what the source itself says

**Added v1.4, 2026-08-08, on John's direction:** *"having different views or frictions ARE GOOD and we should always keep them IF THEY'RE strong enough … ACADEMIC doesn't mean right by default … it's ok to have a T0 origin and a T1 academic simultaneously on the panel if that's something being contested."*

The primary text in its own voice — scripture, inscription, papyrus, ostracon, a tradition's own account of itself.

**⚠️ T0 IS NOT A WEAKER T1. It is not on the T1→T5 scale at all.**
T1→T5 grades ONE thing: how strongly current scholarship supports a claim. T0 grades nothing — it reports. **T0 tells you what the source SAYS; T1–T5 tell you what scholarship makes of it.** It sits at 0 because it comes *before* interpretation, not *below* it.

**Examples**: *Enūma Anu Enlil* on celestial omens · *Bṛhat Saṃhitā* 2.15 on the Yavanas · the Ferrara ledger of 1442 · Varāhamihira conceding the Greek debt from inside his own tradition · a Śvetāmbara chronology giving Mahāvīra's dates.

### When T0 and T1 disagree, KEEP BOTH — the disagreement is the finding

This is the rule the tier exists for, and it is the charter's own posture (§I: investigation, not advocacy) applied to the source stack.

A tradition's account and the academic account routinely diverge. **That divergence is not an error to clean up, and it is not resolved by deferring to the academy.** Codex Atlas is an investigative instrument — it *contests*, it does not only search. Academic consensus is the best-supported reading available; it is not true by definition, and it revises.

So on a contested point the panel carries **both rows**, at equal visual weight:

```
T0  Śvetāmbara tradition: Mahāvīra 599–527 BCE (epoch of the Vīra Nirvāṇa era)
T1  Academic chronology: c. 497–425 BCE, following the redating of the Buddha
```

**Neither row is deleted.** A vault that silently dropped the T0 row would be telling the reader the question is closed, which is a claim in itself — and usually a false one.

**Where a single value must still be chosen** (a timeline coordinate, a wedge placement — the graph cannot draw two positions at once), pick one system, apply it *consistently across the whole graph*, and carry the alternative in `date-note:` / `## Disputes` with its source. **Consistency in the machinery, plurality in the record.** The 2026-08-08 Mahāvīra fix is the worked example: the timeline uses the academic dates because the Buddha node does, and the traditional dates are stated in full on the node.

**When NOT to keep both:** T0 is for a source whose claim is *live* — held by a tradition, or genuinely contested in the literature. It is not a licence to preserve every error. A primary text that is simply mistaken on a matter of fact (a chronicle miscounting regnal years) is a T0 *about what that chronicle says*, and the correction is stated plainly beside it. John's own bar: keep the friction **"IF THEY'RE strong enough"**.

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

## IV.5 — Tier vs Political-Risk: TWO ORTHOGONAL AXES

*Added in v1.2 (2026-05-23). This section clarifies a distinction that was implicit in v1.1 and surfaced explicitly because the vault contains both:*

- **psychedelic mysticism** — intellectually contested but politically harmless
- **racial-mysticism / Nazi-occultism** — politically dangerous, "highest alert"

These two categories sit at completely different harm levels. Conflating them under a single "T5" badge is an integrity failure. **CODEX v1.2 makes the two axes explicit.**

### The two axes

| Axis | What it measures | Range | UI surface |
|---|---|---|---|
| **Tier** | How mainstream-accepted the *intellectual claim* is — peer-review acceptance ↔ popular rejection | T1 ··· T5 | Tier badge (green → red color ramp) |
| **Political-risk-flag** | Whether the content carries *real-world harm wiring* — antisemitic networks, ethno-nationalist mobilization, racial-hierarchy claims | `true` / `false` | **⛔ BLACK ALERT** marker (red border + black icon, prominent and orthogonal to tier) |

**These axes are independent.** A claim can be:

- **T3, political-risk-flag: false** — Hancock's Younger Dryas impact hypothesis (academically contested, politically inert)
- **T3, political-risk-flag: false** — Forman's Pure Consciousness Event defense (contested in mysticism studies, politically inert)
- **T3, political-risk-flag: true** — *example does not exist in vault, but in principle:* a T3 alternative-school claim that is also wired into ethno-nationalist mobilization
- **T5, political-risk-flag: false** — *example does not exist in vault* — a popular-rejected claim with no political downstream (most T4/T5 will however have political-risk because the political wiring is often WHY they reach T5)
- **T5, political-risk-flag: true** — David Icke's reptilian-elite mythology (antisemitic dog-whistle per ADL); Evola's Traditionalist neo-fascism (per Goodrick-Clarke 2002); Theosophy's root-races as invoked by white-nationalist contexts; Sebottendorff's Thule Society mysticism

### Why this matters

**Two different audiences need two different signals.**

1. **The reader of the site** sees the ⛔ BLACK ALERT and knows *"this is not just contested, this is dangerous content the vault is documenting under disclaimer"* — before they read the claim itself.

2. **John + future agents triaging the data** can `grep political-risk-flag` to instantly produce the FULL danger-list of nodes/edges. Decisions about "what stays / what gets hidden / what gets restricted to opt-in" become triage-able rather than buried inside the tier sort.

The 5-tier system measures *intellectual heat*. The political-risk-flag measures *political heat*. A tool that conflates them either:
- under-warns (psychedelic-mysticism gets the same chrome as Nazi-mysticism), or
- over-warns (psychedelic-mysticism gets buried under the same disclaimer as Nazi-mysticism, losing legitimate research)

Either is an integrity failure. The orthogonal-axes treatment fixes both.

### Visual escalation rules

When rendering wires + side-panel rows + tooltips:

- **`political-risk-flag: false`** (the silent default for ~99.99% of nodes) — normal chrome; tier badge alone signals the intellectual position.
- **`political-risk-flag: true`** (every node/edge regardless of tier) — **⛔ BLACK ALERT** chrome:
  - Replace ⚠ with ⛔ (black-circle-with-bar — the universal "stop / prohibition" sign — visually unambiguous as a high-alert marker, not a generic warning)
  - **Black left-border** on the row (4px solid, high-contrast at scan-level)
  - Tooltip header reads **"⛔ HIGH ALERT — political-risk content"** instead of "Disclaimer required"
  - Tooltip body leads with the political-risk source citation (ADL / Goodrick-Clarke / Barkun / Hovorun / equivalent peer-reviewed political-history) BEFORE the claim itself
  - Row background tint is the "danger" red (not the soft "contested" pink that T5 alone uses)

The BLACK ALERT escalation is **co-equal with the tier system**, not subordinate to it. A T1 mainstream-published claim about a politically-dangerous movement (e.g., a peer-reviewed paper documenting Christian Reconstructionism) still gets the BLACK ALERT marker because the *content* is harm-wired, even though the *claim* is mainstream-academic.

### Hidden-by-default policy (v1.2 update)

| Filter | Default state | What it does |
|---|---|---|
| Tier T1-T4 | ON | Default visibility |
| Tier T5 | OFF | Hidden until user opts in |
| Political-risk-flag | OFF | Hidden until user opts in **independently of tier** |

The two filters compose with **AND**: an edge with `tier: T5` AND `political-risk-flag: true` requires BOTH toggles ON to be visible. A `tier: T1, political-risk-flag: true` edge requires the political-risk toggle ON (tier is already on by default).

### The HIGH-ALERT-INDEX.md auto-generator

The build pipeline (`build_data.py`) generates `00_meta/HIGH-ALERT-INDEX.md` on every run. This file aggregates EVERY node + every edge with `political-risk-flag: true` into a single human-readable list with: id, title, tier, source citation, political-risk-flag rationale, edge endpoints. The file is the **single triage surface** — `cat 00_meta/HIGH-ALERT-INDEX.md` is the fastest path to "show me the danger list."

Agents are required to read HIGH-ALERT-INDEX.md before:
- Greenlighting a release
- Approving any T4/T5 batch
- Wiring any new edge that touches a node already on the index

This makes the danger surface a first-class object, not buried inside tier sorts. Triage becomes a 30-second scan instead of a grep-through-the-vault expedition.

### When to set political-risk-flag

Set `political-risk-flag: true` when ANY of the following is documented in a peer-reviewed source or recognized civil-rights monitor (ADL / Hope Not Hate / SPLC / Barkun / Goodrick-Clarke / equivalent):

1. The author/figure has documented reception by ethno-nationalist or fascist groups
2. The claim is wired into a documented hate-speech network or conspiracy infrastructure
3. The content describes a movement that civil-rights scholars document as active harm-vector (ethno-nationalist mobilization, organized antisemitism, racial-hierarchy theology)
4. The content is invoked in documented political violence contexts

**Do NOT set political-risk-flag for:**
- Intellectual fringe without political wiring (psychedelic mysticism, parapsychology, Hancock-class lost-civilization claims, most parapsychology)
- Religious nationalism that is mainstream-documented but not currently in violence-context (some forms of Christian nationalism in scholarly-historical mode)
- Esoteric/occult content per se (Crowley, Steiner, Gurdjieff) unless specifically wired to hate networks
- Religious traditions you personally find objectionable (this is the vault's CODEX rejection #2 — mainstream-only orthodoxy is its own integrity failure; politics ≠ political-risk-flag)

The flag is a **scholarship-citation requirement**, not an editorial judgment. If you cannot cite a peer-reviewed political-history or civil-rights source, do NOT set the flag.

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

9. **Political-risk-flag is ORTHOGONAL to tier** (v1.2). Set `political-risk-flag: true` per the §IV.5 criterion when content carries documented real-world harm-wiring (ethno-nationalist reception, antisemitic networks, racial-hierarchy mobilization). The flag is **independent of tier** — a T1 mainstream-academic claim about a politically-dangerous movement gets the flag if the *content* is harm-wired, even though the *source* is mainstream. The flag is a scholarship-citation requirement, NOT an editorial judgment. If you cannot cite a peer-reviewed political-history / civil-rights source, do NOT set it. After any batch that touches political-risk content, **read `00_meta/HIGH-ALERT-INDEX.md`** (auto-generated by build_data.py) to verify your additions surface correctly in the triage list.

---

## VII. The User-Facing "About" Section + Tier Toggle UX

The user-visible About page renders a SHORTENED version of this CODEX:

- §I (Posture) — full text
- §II (Disclaimer Machine) — full text
- §III (21 types) — summary table + link to PROTOCOL §3.1
- §IV (5 tiers including T5) — summary table with examples + tier-toggle UI explanation
- **§IV.5 (Two orthogonal axes — tier vs political-risk-flag, BLACK ALERT) — full text** (v1.2)
- §V (Rejection list) — full text

§VI (How agents apply) is omitted from the user-facing page — that's internal discipline.

### Tier-toggle + political-risk UI (Legend tab) — v1.2

The Forge view (and every other view that shows cross-tradition wires) has TWO independent toggle groups in the view-settings panel:

```
Source tiers (intellectual mainstream-acceptance)
  ☑ T1 — mainstream scholarship
  ☑ T2 — academic minority view
  ☑ T3 — alternative-school (Hancock, Carlson, Bauval)
  ☑ T4 — popular claim — rejected (Sitchin, Däniken, Cayce)
  ☐ T5 — disclaimer-required (rejected with extreme reception — Icke, Evola)

High-alert content (real-world harm-risk, orthogonal to tier)
  ☐ ⛔ Show political-risk-flagged content
       (racial-mysticism, ethno-nationalist occultism, antisemitic conspiracy)
```

Default state: T1-T4 ON, T5 OFF, political-risk-flag toggle OFF. The two toggles compose with AND — a wire must pass BOTH filters to render. A T1 + political-risk-flagged claim still requires the political-risk toggle ON.

When a political-risk-flagged wire renders, its row + tooltip render with **⛔ BLACK ALERT chrome** (black left-border, ⛔ icon, "HIGH ALERT" tooltip header) — visually unambiguous as harm-content vs the soft "contested" treatment used for tier-only T5.

The About section makes the vault's epistemic stance LEGIBLE to every visitor before they form any opinion about the data they see. A Christian visitor, a Buddhist visitor, a secular-academic visitor, a Graham-Hancock-reader visitor — they all see the same posture statement and understand that the vault is showing them scholarship and disagreement, not making theological claims.

The tier toggle is the visible UX expression of CODEX's pluralism: the user controls which strata of claims they want to see, and they see the strata labeled honestly.

---

## IX. The SFW / MAGNUM Doctrine

*Added in v1.3 (2026-05-23). This is the project's deployment-safety constitution. Distinct from the wire-level disclaimer machine (§II) and the visual-escalation chrome (§IV.5) — those operate INSIDE the data. SFW/MAGNUM operates BETWEEN the data and the public internet.*

### Two versions, always

The vault has TWO deployment forms:

| Form | Contents | Where it lives | Who can access |
|---|---|---|---|
| **MAGNUM** | Full vault. Every node, every edge, including all `political-risk-flag: true` content. The complete investigation record. | Local-only by default. Generated by `python3 build_data.py` as `data.js`. **Never committed, never pushed to git, never uploaded to a public server.** | John during development. Eventually: trusted subscribers, partner institutions, academic research access — gated by authentication, never anonymous. |
| **SFW** | MAGNUM **MINUS** every `political-risk-flag: true` node AND every edge incident on a flagged node AND every edge whose own flag is true. No breadcrumbs, no orphan placeholders, no scraper-clues. | Generated by `python3 scripts/build_sfw.py` as `data-sfw.js`. The deploy step copies `data-sfw.js → data.js` on the production host. | Public — the masses, search engines, scrapers, casual readers. |

Both files are gitignored. The MAGNUM lives only on John's laptop. The SFW lives on the production server.

### Why two versions

The agents on this project are instructed to **catalogue everything**, including the dark end (Nazi mysticism, ethno-nationalist occultism, organized hate networks). The reason: studying the evil root is essential scholarship. The 99% of humans benefit from rigorous documentation of how these movements emerge, mobilize, and recruit — that's how civil-rights research, deradicalization work, and political-history scholarship operate.

**But the public internet contains the 1% bad-actor pipeline.** Scrapers harvest content, lift fragments out of context, weaponize them. A T1 mainstream-academic paragraph about Theosophy's root-race doctrine, surfaced to a search-engine query, becomes recruitment material for the very groups the paragraph documents. We cannot stop the 1% from seeking the content elsewhere — but we are NOT obligated to be their nearest-source-of-supply.

The SFW filter is the gate. It applies AFTER the investigation is complete, not before. Agents never self-censor at gather-time.

### What the SFW filter strips

`scripts/build_sfw.py` removes:

1. **Every node** where `political_risk_flag: true` in YAML — the node disappears entirely from the SFW payload
2. **Every edge** whose own `political_risk_flag: true` — even if both endpoints are visible deities
3. **Every edge** incident on a stripped node — even a T1 `consort` edge becomes a clue if the consort is flagged; the edge goes too

The result is a SFW payload with no orphans, no breadcrumbs, no scraper trail. A user browsing the public site has no way to know certain content exists in the MAGNUM. That's the gate working as designed.

### Tier vs political-risk-flag — recap for the deploy gate

Per §IV.5, the two axes serve two different purposes:

- **Tier (T1-T5)** = intellectual mainstream-acceptance, the IN-DATA disclaimer system. T5 wires still ship to SFW unless they ALSO carry political-risk-flag. Psychedelic mysticism (T3-T5 intellectually-fringe, politically-inert) **ships to SFW** with its ⚠ chrome.
- **political-risk-flag** = real-world harm-wiring, the DEPLOY-GATE filter. ANY flagged content is stripped at SFW build, regardless of tier. Racial-mysticism (T3-T5 + flagged) **does NOT ship to SFW**.

Both are needed. The tier system serves the reader; the political-risk-flag serves the deploy gate.

### The human-audit rule

The MAGNUM is the canonical investigation record. The SFW is the public artifact. The transformation between them MUST be reviewed by a human before any production upload:

1. **Run** `python3 build_data.py` (produces MAGNUM `data.js`)
2. **Run** `python3 scripts/build_sfw.py` (produces `data-sfw.js`)
3. **Review** `00_meta/HIGH-ALERT-INDEX.md` (auto-regenerated by step 1) — verify the flagged-list is correct + complete. Any node that SHOULD be flagged but isn't is an integrity hole. Any node that SHOULDN'T be flagged but is is a censorship over-correction.
4. **Diff** the new `data-sfw.js` against the previous release — confirm only intentional changes
5. **Upload** `data-sfw.js → production data.js` only after steps 3 + 4 pass

A future automated deploy pipeline CANNOT skip step 3. The audit gate is John (or an explicit human delegate); not an agent, not a script.

**If the audit step is skipped or fails, the deploy posture is SFW-only by default** — the system never falls back to uploading MAGNUM. There is no "well, we don't know if this is safe so let's upload everything" path; the only fallback is the safer one.

### Agents NEVER inhibit gathering

Repeat: **agents working on content batches do NOT self-censor at gather-time.** They:

1. Catalogue every documented figure, claim, edge — including the politically-dangerous ones
2. Apply the §IV.5 criteria honestly — set `political-risk-flag: true` where peer-reviewed civil-rights / political-history scholarship documents real-world harm-wiring, do NOT set it where the content is merely intellectually fringe or politically-objectionable-to-the-agent
3. Trust the gate. The SFW filter at deploy will handle the public exposure question.

An agent that hesitates to wire an edge "because it might be misused" is doing the wrong job. The right job is to wire it, label it, and let the human audit + the SFW pipeline decide what reaches the public. The vault's epistemic posture (§I — investigation, not advocacy; pluralism, not orthodoxy; disclosure, not concealment) only works if the data is complete; gate-keeping happens at PUBLISH-time.

The 1% are why we have the gate. The 99% are why we have the data.

### Deploy workflow (cheatsheet)

```bash
# 1. Local build — generates MAGNUM data.js + regenerates HIGH-ALERT-INDEX.md
python3 build_data.py

# 2. SFW build — generates data-sfw.js from data.js, strips political-risk content
python3 scripts/build_sfw.py

# 3. Human audit — review HIGH-ALERT-INDEX.md, diff against previous SFW release
cat 00_meta/HIGH-ALERT-INDEX.md
diff data-sfw.js  <(curl -s https://prod-server/data.js)   # (manual, John or delegate)

# 4. Upload — copy SFW artifact to production
scp data-sfw.js  prod:/var/www/atlas/data.js

# MAGNUM upload (for trusted-subscriber path, not yet built)
#   — Auth-gated. Never anonymous. Never the default. Requires §IX audit pass.
```

---

## VIII. Living Document

CODEX is versioned by date. The current version is **1.3 — 2026-05-23**.

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
