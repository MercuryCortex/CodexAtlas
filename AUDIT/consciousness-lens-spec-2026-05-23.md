# Consciousness Lens (`31_consciousness/`) — design spec

**Date:** 2026-05-23
**Handle:** opus-consciousness-lens-spec-1
**Status:** PROPOSAL — awaiting John's greenlight/veto. READ-ONLY scoping document; no nodes created, no existing nodes touched.
**Audited against:** `00_meta/ONTOLOGY.md` (29-lens spine + the three pending 2026-05-23 lens proposals: `27_geometry`, `28_color`, `30_politics`, `29_philosophy`), `00_meta/ONTOLOGY-RATIONALE-2026-05-18.md` + `ONTOLOGY-RATIONALE-2026-05-19.md` (bars-cleared procedure), `00_meta/CODEX.md` v1.1 (5-tier source system + investigation-as-prompt + render-off-by-default for T5), parallel siblings `AUDIT/politics-lens-spec-2026-05-23.md` + `AUDIT/sacred-geometry-lens-spec-2026-05-23.md` + (in-flight) `AUDIT/philosophy-lens-spec-2026-05-23.md`.

---

## 0. Numbering note (read first)

Current ontology lock has slots 01–29 occupied. Four lenses are scoped today: `27_geometry`, `28_color`, `29_philosophy`, `30_politics`. This spec proposes the consciousness lens at **slot 31** — tail of the queue. If John reorders, this spec is slot-agnostic; the design here works at any tail position. For brevity below I use `31_consciousness/` as a placeholder.

The consciousness lens is the LAST of the five 2026-05-23 lens proposals. It is also the one with the highest tier-discipline overhead (CSR is a real T1 field; the popular adjacent literatures are heavily T2–T4). The lens should not ship until politics + philosophy + color + geometry are at least greenlit in principle — they generate the *targets* this lens's CSR explanations will fire at.

---

## 1. Lens scope

`31_consciousness/` collects the **empirical-meets-philosophical layer where religion meets the mind sciences** — the cognitive-scientific findings, contemplative-neuroscience results, and philosophy-of-mysticism positions through which religious phenomena are explained, measured, or contested as features of human cognition and experience.

The animating thesis: **the vault already maps deities, rituals, practices, theologies, and traditions; what it does NOT map is the converging body of peer-reviewed work explaining *why* humans produce religion and *what happens inside us* when we engage with it.** Why do gods have minds? (Boyer / Barrett — agency-detection + minimally counterintuitive concepts.) Why does ritual feel "sticky"? (Whitehouse — modes-of-religiosity; Atran — costly-signalling.) What is measurably going on when Tibetan monks enter *jhāna*? (Lutz + Davidson — gamma oscillations + sustained-attention markers.) What does psilocybin do to the default-mode network? (Carhart-Harris — entropic-brain hypothesis.) Is there a "pure consciousness event" beneath every cultural mysticism? (Stace says yes, Katz says no, Forman defends Stace, Proudfoot defends Katz — still live.)

These findings ARE NOT homeless in the current vault — they're scattered across notes on individual rituals + practices + scholarship-tags + tradition pages, with no organized home. Cognitive Science of Religion (CSR), contemplative neuroscience, and mysticism studies are **three convergent, recognized academic fields** with their own peer-reviewed journals (*Religion, Brain & Behavior* — Routledge 2011+; *Mindfulness* — Springer 2010+; *Journal of Consciousness Studies* — Imprint Academic 1994+; *Frontiers in Human Neuroscience* — Frontiers Media 2007+; *Method & Theory in the Study of Religion* — Brill 1989+; *Zygon: Journal of Religion and Science* — Wiley 1966+), endowed chairs (Aarhus's Religion Cognition Culture center; Harvard's CSR program; UC-Davis Center for Mind and Brain; Wisconsin's Center for Healthy Minds), and three generations of secondary scholarship. The vault should mirror the convergence.

### Distinction from neighboring lenses (boundary discipline)

| Lens | What it holds | How consciousness differs |
|---|---|---|
| `29_philosophy/` (proposed, in-flight) | conceptual / analytic philosophy of religion (arguments for/against God, philosophy of mysticism *qua argument*, comparative philosophy of mind East / West *qua argument*) | Philosophy is conceptual; consciousness is empirical-meets-philosophical. The Stace / Katz debate is BOTH — its philosophical-analytic side (Katz's epistemological constructivism *as an argument*) lives in `29_`; its empirical-test side (Hood's M-Scale, the psilocybin Mystical-Experience-Questionnaire scores) lives in `31_`. Both lenses cross-link the debate node; the **primary home** for the *figure* depends on which side of their work dominates — Forman is a consciousness-lens figure (he wrote the *Pure Consciousness Event* empirical-style defense); Katz is split (his 1978 essay is philosophical but enters as a foil here). |
| `24_pharmacology/` | psychoactive substances themselves (psilocybin, DMT, ayahuasca, LSD, MDMA, *Amanita muscaria*, *Ephedra*) | Pharmacology holds the molecules + their cultural/ritual usage. Consciousness holds the *peer-reviewed neuroscience and phenomenological findings* about what those molecules do to the brain and to religious experience (Carhart-Harris's DMN findings; Griffiths's Hopkins mystical-experience trials; Pahnke's Good Friday Experiment). Cross-link: `24_pharmacology/psilocybin.md` carries the substance; `31_consciousness/findings/psilocybin-mystical-experience-griffiths.md` carries the empirical-claim. |
| `22_practices/` | the religious practices themselves (Vipassanā meditation, Centering Prayer, Tibetan deity-yoga, Sufi *dhikr*, Christian lectio divina) | Practice nodes hold the *what / how / cultural-context* of the practice. Consciousness nodes hold the *what-happens-to-brain-and-experience* peer-reviewed findings. Cross-link: `22_practices/vipassana-meditation.md` carries the practice; `31_consciousness/findings/vipassana-attention-saron-shamatha.md` carries the Saron-et-al longitudinal-trial results. |
| `03_deities/` + `06_themes/` | individual deities + cross-tradition motifs | Consciousness lens supplies the **CSR explanatory layer** via a new `cognitive-mechanism[]` field — e.g., why so many cultures have hidden-agency deities (Guthrie + Barrett's agency-detection device); why moralizing high-gods are correlated with large-scale societies (Norenzayan + Slingerland's Seshat-database work). The deity-node stays in `03_`; the CSR-explanation node it points to lives in `31_`. |
| `13_morals/` | moral-systems-as-systems within traditions | The CSR account of moralizing-high-gods (Norenzayan 2013) is a *finding about why moral-systems converge with religion*; the finding lives here, the actual moral-system lives in `13_`. |

**Where the same node could be cross-tagged: pick ONE home folder.** The rule:
- If the entity is a **substance**, home = `24_pharmacology/`. Findings about it = `31_consciousness/findings/`.
- If the entity is a **practice**, home = `22_practices/`. Findings about it = `31_consciousness/findings/`.
- If the entity is a **person** (researcher, philosopher, contemplative-scientist), home = `04_persons/` (biographical) with a thinker-stub in `31_consciousness/figures/` (their consciousness-lens claim summary; mirrors politics-lens convention).
- If the entity is a **debate / concept / finding** (PCE, ego-dissolution, agency-detection, DMN-suppression), home = `31_consciousness/` (specifically `concepts/` or `findings/`).
- If the entity is a **theoretical position in philosophy of mind** (IIT, GWT, Higher-Order, Illusionism, Russellian Monism), home = `29_philosophy/` with cross-link in `31_consciousness/findings/` only when an empirical claim about religion turns on it (rare).

---

## 2. Ontology — what KIND of node lives here?

Five sub-types within the lens:

### 2.1 `csr-finding` (the cognitive-science-of-religion empirical claim)

Specific peer-reviewed claims from CSR with primary-text genealogy:
- `agency-detection-hyperactive` — Guthrie 1993 → Barrett 2000+ → Boyer 2001 — humans over-attribute agency to ambiguous stimuli; explains why gods (intentional agents) recur cross-culturally
- `minimally-counterintuitive-concepts` — Boyer 1994/2001 — concepts violating one ontological expectation (a tree that talks; a person who walks through walls) are mnemonically privileged; explains why specific god-concepts cluster around a narrow set of violations
- `theory-of-mind-mentalizing` — Barrett 2004; Bering 2002 — mentalizing apparatus extended to invisible agents; predicts cross-cultural prevalence of god-belief
- `mode-doctrinal` — Whitehouse 1995/2000 — high-frequency low-arousal ritual → semantic memory → large diffuse communities (world religions)
- `mode-imagistic` — Whitehouse 1995/2000 — low-frequency high-arousal ritual → episodic memory → small intense communities (initiation cults, rites of passage)
- `moralizing-high-gods-societal-scale` — Norenzayan 2013 *Big Gods*; Watts/Greenhill/Atkinson/Bulbulia/Gray 2015 *PNAS* — moralizing high-gods correlate with large-scale-cooperation societies; reverse-causation debate live (Whitehouse et al. 2019 *Nature* counter)
- `costly-signalling-of-commitment` — Sosis 2003+; Atran/Henrich 2010 — religious rituals as costly hard-to-fake signals stabilizing in-group cooperation
- `dual-process-belief` — Pyysiäinen + Barrett 2004; "theological correctness" effect — explicit theological beliefs (God is omniscient) diverge from implicit intuitions (God has located attention)
- `teleological-stance-children` — Kelemen 1999+ — children default to purpose-based explanations; "promiscuous teleology"; persists into adulthood under cognitive load
- `mind-body-dualism-intuitive` — Bloom 2004 *Descartes' Baby*; Bering 2006 — afterlife belief partially grounded in intuitive Cartesianism
- `religion-and-cooperation-causality-still-contested` — Whitehouse et al. 2019 *Nature*; Beheim et al. 2021 reanalysis — explicit "OPEN QUESTION" node documenting the live methodological debate

### 2.2 `contemplative-neuroscience-finding` (peer-reviewed brain / phenomenology data from practice)

- `gamma-oscillation-long-term-meditators` — Lutz/Greischar/Rawlings/Ricard/Davidson 2004 *PNAS* — sustained gamma-band synchrony in long-term Tibetan-Buddhist practitioners
- `default-mode-network-suppression-meditation` — Brewer/Worhunsky/Gray/Tang/Weber/Kober 2011 *PNAS*; Garrison et al. 2015 — DMN deactivation in experienced meditators
- `default-mode-network-suppression-psilocybin` — Carhart-Harris/Erritzoe/Williams/Stone/Reed/Colasanti/Tyacke/Leech/Malizia/Murphy/Hobden/Evans/Feilding/Wise/Nutt 2012 *PNAS*; Carhart-Harris/Friston 2019 *Pharmacological Reviews* (entropic-brain) — DMN deactivation under psilocybin correlates with ego-dissolution self-report
- `attention-training-shamatha-project` — Saron's Shamatha Project (Davis); MacLean et al. 2010 *Psychological Science* — three-month retreat improves visual perceptual threshold
- `mindfulness-amygdala-coupling` — Goldin/Gross 2010 *Emotion*; Hölzel et al. 2011 *Psychiatry Research* — mindfulness training alters amygdala-prefrontal coupling
- `psilocybin-mystical-experience-mef-2006` — Griffiths/Richards/McCann/Jesse 2006 *Psychopharmacology* — psilocybin reliably occasions mystical-type experiences with persisting personal meaning at 14 months
- `psilocybin-depression-trial-2016` — Carhart-Harris et al. 2016 *Lancet Psychiatry*; replicated Davis/Barrett/Lancelotta/Sepeda/Sweat/Hurwitz/Cosimano/Griffiths 2021 *JAMA Psychiatry*
- `good-friday-experiment-1962-2002` — Pahnke 1963 dissertation (Harvard); Doblin 1991 long-term-follow-up *Journal of Transpersonal Psychology* — historical anchor for psychedelic-mysticism research; documents Pahnke's methodological gaps (Doblin) and the long-term qualitative report (Doblin re-interview)
- `loving-kindness-meditation-vagal-tone` — Kok/Coffey/Cohn/Catalino/Vacharkulksemsuk/Algoe/Brantley/Fredrickson 2013 *Psychological Science*
- `mantra-recitation-default-mode` — Berkovich-Ohana et al. 2017 *Frontiers in Psychology*

### 2.3 `mysticism-studies-concept` (the perennialist↔contextualist canon)

- `pure-consciousness-event-pce` — Forman 1990 ed. *The Problem of Pure Consciousness* (Oxford); Forman 1998 *Mysticism, Mind, Consciousness* (SUNY) — claim that contentless awareness is reportable across traditions
- `katz-contextualism-thesis` — Katz 1978 "Language, Epistemology, and Mysticism" in Katz ed. *Mysticism and Philosophical Analysis* (Oxford) — no unmediated experience; cultural-linguistic frame structures every mystical report
- `perennialist-position-stace` — Stace 1960 *Mysticism and Philosophy* (Lippincott) — common-core thesis; introvertive vs extrovertive mysticism distinction (still the workhorse typology)
- `attributional-account-proudfoot` — Proudfoot 1985 *Religious Experience* (California) — descriptive vs explanatory reduction; mystics' own causal-theological accounts are post-hoc attributions
- `m-scale-mysticism-measurement` — Hood 1975 + Hood et al. 2001 *International Journal for the Psychology of Religion* — empirical scale operationalizing Stace's categories; the most-used measurement instrument
- `mystical-experience-questionnaire-meq` — Maclean/Leoutsakos/Johnson/Griffiths 2012 *Journal for the Scientific Study of Religion* — 30-item factor-analyzed Hopkins-developed Stace-derived scale; standard in psilocybin trials
- `ineffability-as-cognitive-category` — Stace 1960; Forman 1990; Yaden et al. 2017 *Review of General Psychology* on self-transcendent experiences
- `pahnke-typology` — Pahnke 1963 — 9-category mystical-experience typology used as ground for MEQ
- `richards-typology-extension` — Richards 2015 *Sacred Knowledge* (Columbia) — Bill Richards's career synthesis post-Hopkins

### 2.4 `experiential-profile` (the cross-religious phenomenological category)

These are the **named-category nodes** for the experiences themselves — the things rituals/practices/psychedelics tend to occasion:
- `ego-dissolution` — Lebedev/Lövdén/Rosenthal/Feilding/Nutt/Carhart-Harris 2015 *Human Brain Mapping*; Letheby 2021 *Philosophy of Psychedelics* (Oxford)
- `unitive-experience` — Stace's introvertive-unity; MEQ "internal unity" + "external unity" factors
- `noetic-quality` — William James 1902 *Varieties* lectures; modern operationalization MEQ
- `time-distortion` — common across deep-meditation + psychedelic + flow reports; Wittmann 2015 *Frontiers in Psychology*
- `ineffability` — see §2.3
- `sacredness-experience` — Yaden + Newberg 2022 *The Varieties of Spiritual Experience* (Oxford)
- `cosmic-consciousness` — Bucke 1901 (historical anchor); modern operationalization MEQ
- `kundalini-arising` — emic-Hindu/yogic category; Krishna 1967 first modern report (T2 — popular memoir; flag); Greyson/Lukoff in DSM-IV religious-or-spiritual-problem category
- `mystical-experience` (umbrella) — the broadest container; cross-link to all of the above

### 2.5 `consciousness-figure` (the academic-field canon)

The 40–60 canonical figures across CSR + contemplative-neuroscience + mysticism-studies + psychedelic-research + NDE-research + parapsychology-border + comparative-consciousness — full catalog in **`AUDIT/consciousness-key-figures-2026-05-23.md`**. Each gets a node with main work + tier + risk-flag (where applicable) + claim summary. Two-way cross-link: the figure sits in `04_persons/` (biographical) AND `31_consciousness/figures/` (their consciousness-lens claim).

### Sub-folder structure

```
31_consciousness/
├── README.md
├── csr/                              # cognitive science of religion findings
│   ├── agency-detection-hyperactive.md
│   ├── minimally-counterintuitive-concepts.md
│   ├── theory-of-mind-mentalizing.md
│   ├── mode-doctrinal.md
│   ├── mode-imagistic.md
│   ├── moralizing-high-gods-societal-scale.md
│   ├── costly-signalling-of-commitment.md
│   ├── dual-process-belief.md
│   ├── teleological-stance-children.md
│   ├── mind-body-dualism-intuitive.md
│   ├── religion-and-cooperation-causality-still-contested.md
│   └── ...
├── contemplative-science/            # meditation / contemplative-practice neuroscience
│   ├── gamma-oscillation-long-term-meditators.md
│   ├── default-mode-network-suppression-meditation.md
│   ├── attention-training-shamatha-project.md
│   ├── mindfulness-amygdala-coupling.md
│   ├── loving-kindness-meditation-vagal-tone.md
│   ├── neurotheology-newberg-spect.md           # T2 — flag mandatory
│   └── ...
├── psychedelic-science/              # psychedelic-neuroscience and -mysticism research
│   ├── default-mode-network-suppression-psilocybin.md
│   ├── psilocybin-mystical-experience-mef-2006.md
│   ├── psilocybin-depression-trial-2016.md
│   ├── good-friday-experiment-1962-2002.md
│   ├── entropic-brain-hypothesis.md
│   └── ...
├── mysticism-studies/                # philosophy + empirical-psychology of mysticism
│   ├── pure-consciousness-event-pce.md
│   ├── katz-contextualism-thesis.md
│   ├── perennialist-position-stace.md
│   ├── attributional-account-proudfoot.md
│   ├── m-scale-mysticism-measurement.md
│   ├── mystical-experience-questionnaire-meq.md
│   ├── ineffability-as-cognitive-category.md
│   ├── pahnke-typology.md
│   └── ...
├── experiential-profiles/            # the named cross-religious experience categories
│   ├── ego-dissolution.md
│   ├── unitive-experience.md
│   ├── noetic-quality.md
│   ├── time-distortion.md
│   ├── ineffability.md
│   ├── sacredness-experience.md
│   ├── cosmic-consciousness.md
│   ├── kundalini-arising.md          # T2 flag
│   └── mystical-experience.md
├── nde-research/                     # near-death-experience studies
│   ├── greyson-scale.md
│   ├── peak-in-darien.md             # T1 anchor + the long-history NDE-corpus debate
│   ├── awareness-during-resuscitation-aware-1-2.md
│   ├── critical-counter-blackmore-augustine.md  # mandatory pluralism per CON-3
│   └── ...
├── parapsychology-border/            # the T3-T4 zone — include with rebuttal per CODEX
│   ├── ganzfeld-protocol.md
│   ├── global-consciousness-project.md
│   ├── psi-mainstream-rebuttal-french-wiseman.md   # mandatory pluralism per CON-3
│   └── ...
├── figures/                          # the canon (companion doc catalog)
│   ├── pascal-boyer.md
│   ├── justin-barrett.md
│   ├── harvey-whitehouse.md
│   ├── ara-norenzayan.md
│   ├── robert-mccauley.md
│   ├── francisco-varela.md
│   ├── richard-davidson.md
│   ├── antoine-lutz.md
│   ├── robin-carhart-harris.md
│   ├── roland-griffiths.md
│   ├── walter-stace.md
│   ├── steven-katz.md
│   ├── robert-forman.md
│   ├── ralph-hood.md
│   ├── ... (see companion doc)
└── concepts/                         # cross-cutting theoretical categories
    ├── neurotheology.md              # T1/T2 boundary
    ├── neurophenomenology.md         # Varela
    ├── enactivism-thompson.md
    ├── entropic-brain-hypothesis.md
    ├── altered-state-of-consciousness-asc.md
    └── religious-experience-as-category.md
```

The sub-folder split is **strongly recommended.** Without it the 80+ projected nodes pile into a single folder. With it, the lens stays browseable along the lines of its own academic-field structure (CSR / contemplative-science / psychedelic-science / mysticism-studies / experiential-profiles / NDE / parapsychology-border / figures / concepts).

---

## 3. Schema additions — new YAML fields across the vault

The lens REQUIRES four new YAML fields on existing-lens nodes. All are optional-additive; none overwrite existing data.

### 3.1 On `03_deities/` + `06_themes/` — new field `cognitive-mechanism[]`

Pointer to CSR-finding nodes that explain why the deity / motif recurs. Each entry: `slug` + `relation:` (one of: `predicted-by`, `consistent-with`, `partially-explained-by`, `proposed-as-instance-of`).

Examples:
- `yahweh` → `cognitive-mechanism: [{slug: agency-detection-hyperactive, relation: consistent-with}, {slug: moralizing-high-gods-societal-scale, relation: proposed-as-instance-of}, {slug: minimally-counterintuitive-concepts, relation: consistent-with}]`
- `ancestor-spirits` (theme) → `cognitive-mechanism: [{slug: theory-of-mind-mentalizing, relation: predicted-by}, {slug: mind-body-dualism-intuitive, relation: consistent-with}]`
- `flood-myth` (theme) → `cognitive-mechanism: [{slug: minimally-counterintuitive-concepts, relation: partially-explained-by, notes: "Boyer notes flood narratives' MCI structure"}]`

The field is **explicitly causal-direction-neutral** — `consistent-with` ≠ "CSR proves the deity is a brain-artefact." Per CON-2 (§4 below), we report the CSR-finding's claim AND the discipline's known limitations AND the live counter-debates.

### 3.2 On `22_practices/` — new field `experiential-profile[]` + `neural-correlate[]`

Pointer to phenomenological-category nodes and peer-reviewed neural-correlate findings.

Examples:
- `vipassana-meditation` → `experiential-profile: [equanimity, ineffability (in deep states), time-distortion]` + `neural-correlate: [{slug: default-mode-network-suppression-meditation, source: Brewer 2011 PNAS}, {slug: gamma-oscillation-long-term-meditators, source: Lutz 2004 PNAS}, {slug: attention-training-shamatha-project, source: MacLean 2010 Psych Sci}]`
- `centering-prayer` → `experiential-profile: [unitive-experience, ineffability]` + `neural-correlate: [{slug: default-mode-network-suppression-meditation, source: Barnby/Bailey 2017 Frontiers; partial-evidence}]` — flag thinness of data per Barnby/Bailey
- `tibetan-deity-yoga` → `experiential-profile: [vivid-imagery, unitive-experience]` + `neural-correlate: [{slug: kozhevnikov-deity-yoga-cognitive 2009 PLoS One, source: Kozhevnikov 2009}]`

### 3.3 On `07_traditions/` — new field `consciousness-treatment[]`

How does the tradition itself theorize consciousness? Single-valued summary tag (one of) plus a free-form short-text gloss. The point is to render the tradition's *emic* theory of mind comparable across the corpus.

Tag options:
- `non-dual-awareness` (Advaita Vedanta; Zen; Dzogchen)
- `eight-vijnana-storehouse` (Yogacara Buddhism)
- `consciousness-only-citta-matra` (Yogacara)
- `momentary-stream-citta` (Theravada Abhidhamma)
- `nous-pneuma-psyche` (Hellenistic Christian + Hermetic)
- `apophatic-via-negativa` (Christian apophatic; Sufi *faná*)
- `embodied-cognition-emic` (most pre-modern traditions implicitly)
- `mind-as-soul-substance-dualist` (most Abrahamic + Cartesian)
- `process-mind-dependent-arising` (early Buddhism)
- `panentheistic-mind` (Process theology; some Hindu schools)
- `naturalist-no-self-account` (modern secular contemplative; some Theravada-modernist)

Example:
- `theravada-buddhism` → `consciousness-treatment: [{tag: momentary-stream-citta, source: Bhikkhu Bodhi trans. *Abhidhammattha-sangaha* 1993}, {tag: process-mind-dependent-arising, source: Gethin 1998 *Foundations of Buddhism*}]`

### 3.4 On `14_rituals/` — new field `cognitive-mechanism[]` + `experiential-profile[]`

Same vocabulary as §3.1 / §3.2 — but applied to ritual-nodes. Examples:
- `Christian-eucharist` → `cognitive-mechanism: [{slug: mode-doctrinal, relation: instance-of}, {slug: costly-signalling-of-commitment, relation: partially-explained-by}]`
- `Sun-Dance` (Plains) → `cognitive-mechanism: [{slug: mode-imagistic, relation: paradigmatic-instance, source: Whitehouse 2000 *Arguments and Icons* Ch 4}]`
- `vision-quest` → `cognitive-mechanism: [{slug: mode-imagistic, relation: instance-of}]` + `experiential-profile: [unitive-experience, time-distortion, noetic-quality]`

---

## 4. Critical neutrality discipline — the three CON rules

Modelled on the politics-lens POL-1..3. The consciousness lens is high-risk for two failure modes: (a) **scientism-creep** ("the brain explains religion away") and (b) **mysticism-credulity** ("the data prove the ancients knew everything"). Both fail the investigation-as-prompt charter.

### Rule CON-1 — Perennialist ↔ contextualist symmetric pairing

Every Forman / Stace claim in `mysticism-studies/` ships with a Katz / Proudfoot counter-node in the same batch. Every PCE claim has an in-the-batch contextualist objection. The reader arriving at `pure-consciousness-event-pce.md` should see `katz-contextualism-thesis.md` in the adjacent slot; arriving at Stace's introvertive-mysticism category should see Proudfoot's attribution-theory critique. **The debate is live; the vault renders both sides at first-batch parity.**

Concretely: the first batch's mysticism-studies nodes always come in pairs:
- Stace's common-core ↔ Katz's contextualism
- Forman PCE ↔ Proudfoot attribution
- Hood's M-Scale (operationalizes Stace) ↔ critiques of M-Scale (e.g., Streib + Hood 2016 *Semantics and Psychology of Spirituality*) inside the same node-body
- MEQ (validates Stace-Pahnke typology in psilocybin trials) ↔ explicit "MEQ-as-Stace-loaded" methodological-caveat node citing Sanders + Zijlmans 2021 *Frontiers in Psychology*

### Rule CON-2 — Neuroscience-finding ≠ popular-extrapolation discipline

This is the central tier-discipline rule for the lens. **Distinguish the peer-reviewed neuroscience finding from the popular extrapolation that travels under its name.** Every `contemplative-neuroscience-finding` or `psychedelic-science` node has TWO sections in its body:

1. **What the study actually shows** (T1; primary citation; sample-size, replication-status, effect-size disclosed)
2. **What gets claimed about it in popular discourse** (T2-T4; cited explicitly as popular-reception)

Example:
- `default-mode-network-suppression-psilocybin.md` reports the Carhart-Harris 2012 *PNAS* finding (T1; n=15 healthy volunteers; replicated by multiple groups; effect-size disclosed). Then *separately* documents the popular extrapolation ("psilocybin proves the ego is illusory" — Pollan 2018 *How to Change Your Mind*, popular bestseller, T2; "psychedelics are how the ancients accessed God" — Hancock 2005 *Supernatural*, T3; "DMT is the spirit molecule and the brain's portal to other dimensions" — Strassman 2001 *DMT: The Spirit Molecule*, T3-T4 popular reception of T2 medical-research). The node's `notes:` field carries both; the `source-tier:` field is T1 on the empirical claim; the popular-extrapolation citations are tagged T2-T4 inline.

The same discipline applies to:
- `gamma-oscillation-long-term-meditators` — the Lutz 2004 *PNAS* finding (T1) ≠ "meditation proves Buddhists are right about consciousness" (popular extrapolation, T2-T3)
- `psilocybin-mystical-experience-mef-2006` — the Griffiths 2006 *Psychopharmacology* trial (T1; n=36 healthy volunteers; rated alongside top-life-event by 67% at 14 months) ≠ "psychedelics prove perennialism" (popular extrapolation; cited where it appears)
- `neurotheology-newberg-spect` — Newberg's SPECT-imaging studies of Tibetan monks + Franciscan nuns (T1/T2 boundary — peer-reviewed methodology but heavily critiqued sample-size + interpretation per Schjoedt 2009 *Method & Theory in the Study of Religion*) ≠ "your brain on God" popular framing (T2 trade-press)

### Rule CON-3 — NDE + parapsychology: include with full rebuttal sourcing

Per CODEX v1.1 investigation-as-prompt rule, we DO node:
- NDE research (Greyson, Fenwick, Parnia, van Lommel)
- parapsychology / ganzfeld / global-consciousness-project (Radin, Bem)
- Theosophy-derived "consciousness-evolution" claims (with politics-lens cross-link for racial-mysticism reception)

AND we ALSO node, in the same batch, the mainstream rebuttal corpus:
- Susan Blackmore 1993 *Dying to Live* (Routledge) + Blackmore 1996 *In Search of the Light* (Prometheus)
- Keith Augustine + Michael Martin eds. 2015 *The Myth of an Afterlife* (Rowman & Littlefield)
- Christopher French 2009 + 2010+ in *Cortex* / *Trends in Cognitive Sciences*
- Ray Hyman 1994/2010 critiques of Ganzfeld + remote-viewing
- Richard Wiseman 2010 *Paranormality* (Macmillan) — popular but rigorous

Tier-assignment table for this zone:
- Greyson-scale + AWARE-1/2 studies = T1 (peer-reviewed; ICU consortium; *Resuscitation* journal)
- Pim van Lommel's *Lancet* 2001 paper = T1 within the field; T2 in mainstream interpretation per Augustine/Martin
- Eben Alexander *Proof of Heaven* 2012 = T3 (popular memoir; documented factual disputes per *Esquire* July 2013 investigation by Luke Dittrich)
- Daryl Bem 2011 *JPSP* precognition study = T3 (peer-reviewed but a textbook replication-crisis exemplar; cite Galak/LeBoeuf/Nelson/Simmons 2012 failed-replication)
- Dean Radin's parapsychology work = T3 (peer-reviewed in *Journal of Scientific Exploration*; rejected mainstream cog-sci per Hyman/Wiseman)
- Theosophical "consciousness-evolution" / Blavatsky / Besant root-race material = **T4 in core form, T5 in 20th-c racial-mysticism reception** — cross-link mandatory to politics-lens `theosophy-root-race-political-reception.md`

Every flagged node in the parapsychology-border/ folder carries an inline `rebuttal-source:` field pointing to at least one peer-reviewed rebuttal. This is not optional; without the rebuttal-source the node fails creation.

---

## 5. Tier policy — the lens-specific T1–T5 mapping

| Tier | What it means HERE | Examples |
|---|---|---|
| **T1** | Standard peer-reviewed cog-sci + neuroscience + philosophy-of-mysticism | Boyer 2001; Whitehouse 1995; Lutz/Davidson 2004 *PNAS*; Stace 1960; Katz 1978; Forman 1990; Hood M-Scale 2001; Brewer 2011 *PNAS*; Carhart-Harris 2012 *PNAS*; Griffiths 2006 *Psychopharmacology*; Pahnke 1963 (with caveats); Greyson 1983 *J Nerv Ment Dis*; Norenzayan 2013 *Big Gods*; Letheby 2021 (Oxford); MacLean 2010 *Psychological Science* |
| **T2** | Peer-reviewed but contested OR popular-bestseller with academic background | Newberg's neurotheology (peer-reviewed methodology + heavy critique); Wilber's "integral" model (some academic engagement; mostly Wilber-system-internal); Yaden's varieties-of-self-transcendent-experience program (T1 in Yaden 2017 *RGP*; T2 in popular framing); Pollan 2018 *How to Change Your Mind* (well-researched journalism; not peer-reviewed); Csikszentmihalyi flow-as-mysticism extension (T1 on flow; T2 on flow-as-religious-experience) |
| **T3** | Alternative-school; peer-reviewed-in-fringe-venue or popular-bestseller-only | Radin parapsychology (*JSE* peer-reviewed but rejected mainstream); Strassman *DMT: The Spirit Molecule* 2001; Hancock *Supernatural* 2005 (psychedelics-as-source-of-religion); Eben Alexander *Proof of Heaven* 2012; Grof transpersonal psychology (psychedelic-therapy clinical work T1; cosmological framework T3); modern "psychedelic mysticism" popular-spirituality stream |
| **T4** | Popular-claim-rejected by mainstream consensus | McKenna "stoned ape" hypothesis 1992 *Food of the Gods* (no peer-reviewed support); Sheldrake morphic-resonance (rejected by mainstream biology + cog-sci per Rose 1981 *Nature* exchange and onwards); James DeMeo *Saharasia* (T4 reception; no peer-reviewed acceptance) |
| **T5** | Disclaimer-required; render-off-by-default per CODEX §IV | Theosophy root-race "consciousness-evolution" used by ethno-nationalist groups (cross-link to politics-lens `theosophy-root-race-political-reception.md`); any "consciousness levels" framework deployed to rank cultures (per Goodrick-Clarke 1985 *Occult Roots of Nazism*); Evola's "races-of-the-spirit" consciousness-hierarchy schema (per the politics-lens T5 catalogue) |

**Note on the T3/T4 boundary in this lens specifically:** Many T3 figures here have published peer-reviewed work in narrowly-defined venues (Radin in *JSE*; Sheldrake in *J Sci Exploration*; Strassman in *Archives of General Psychiatry* on the DMT pilots themselves). Tier reflects mainstream cog-sci reception, not publication-venue alone. When in doubt, T3.

**Note on T2 in this lens specifically:** The T2 category is broader here than in politics-lens, because much consciousness-research is genuinely high-quality methodology applied to topics where mainstream acceptance is partial (neurotheology; psychedelic-mysticism). Tier reflects reception-state, not methodological-rigor alone.

---

## 6. Forge integration

### 6.1 Probably NOT a wedge

Unlike politics + geometry + color, the consciousness lens **doesn't naturally form a Forge wheel-wedge**. The reason: consciousness-lens nodes are explanations *about* other-lens nodes, not first-class entities the user navigates to directly. The reader is more likely to land on `yahweh` and want to see "what CSR mechanisms explain this deity?" than to land on `moralizing-high-gods-societal-scale` and want to navigate outward.

**Recommendation: no dedicated wedge.** Instead, two Forge features below.

### 6.2 Side-panel widget — "Cognitive mechanisms" + "Neural correlates"

When the user clicks a deity or theme or practice node, the side-panel gains a **"Cognitive mechanisms" disclosure section** (collapsed by default; reads the new `cognitive-mechanism[]` field on the node and renders each entry as `<mechanism-name>` (linked to the consciousness-lens node) `<relation>` (predicted-by / consistent-with / etc.) `<one-line gloss>`.

Same pattern for practice nodes: a "Neural correlates" disclosure section reading `neural-correlate[]`.

The disclosure-section pattern matches the existing tier-toggle disclosure UX. UX recommendation: section starts collapsed (since it's tier-sensitive content); user expands; chrome carries a "T1 default; T2-T5 nodes render with full caveat" disclaimer at section-head, matching the existing pattern from `21AS`/`21AT` side-panel work.

### 6.3 New color theme — "CSR explanations"

Per the tier-toggle UX pattern, add a new Forge color-theme that paints deity / theme / practice nodes by **dominant cognitive-mechanism**. Palette proposal (John's veto-able):

| Mechanism family | Color (hex) | Rationale |
|---|---|---|
| Agency-detection / theory-of-mind / mentalizing | warm-yellow `#D9B85B` | "agent" = social-warm hue |
| Mode-doctrinal | deep-blue `#3A5A8A` | "stable / institutional / repetitive" hue |
| Mode-imagistic | crimson `#A8443A` | "high-arousal / vivid / episodic" hue |
| Moralizing high-gods / costly-signalling | green-gold `#B0A04A` | "cooperation / social-binding" hue |
| Dual-process / theological-correctness | grey-blue `#7A8A9A` | "two-system" hue |
| Mind-body dualism / teleological-stance | pale-violet `#8A7A9A` | "developmental / intuitive" hue |
| Multiple-mechanisms / mixed | warm-grey `#9A8A7A` | fallback for nodes with 3+ tagged mechanisms |
| Untagged | existing tradition-color | default |

Same toggle-UX as tier-toggle: user picks "CSR explanations" from the color-theme dropdown; the Forge re-paints deity / theme / practice nodes; legend panel renders the key.

### 6.4 Tier-toggle interaction

The existing 5-tier source-toggle (T1–T5) applies in the consciousness lens. T5 nodes (Theosophy root-race consciousness-evolution; Evola consciousness-hierarchy) render OFF by default. T3 nodes (parapsychology, popular psychedelic-mysticism) carry the mandatory rebuttal-source banner in their tooltip. T2 nodes (neurotheology, Pollan-style popular framing, Wilber integral) carry the "popular-reception" caveat.

### 6.5 New side-panel section for traditions — "Consciousness treatment"

When user clicks a tradition node, side-panel renders the `consciousness-treatment[]` field as a small badge cluster (e.g., for Advaita Vedanta: `non-dual-awareness` + `apophatic-via-negativa`). Lets a user comparing traditions see "this one is non-dualist; that one is dualist-substance" at a glance. Reuses the existing tag-cluster CSS chrome.

---

## 7. Build-script + viewer touchpoints

| File | Change |
|---|---|
| `build_data.py` | Add `csr-finding`, `contemplative-neuroscience-finding`, `mysticism-studies-concept`, `experiential-profile`, `consciousness-figure` to `NODE_TYPE_MAP` — each routes to `31_consciousness/<sub-folder>/` |
| `build_data.py` | Add new field handlers: `cognitive-mechanism[]` (on deities + themes + rituals + practices) + `neural-correlate[]` (on practices + rituals) + `experiential-profile[]` (on rituals + practices + psychedelic-substances) + `consciousness-treatment[]` (on traditions) — edge-bucket routing to Association by default; Polemic where relation indicates a debate (e.g., Katz contextualism polemic-against Stace common-core) |
| `00_meta/CODEX.md` | No change — CODEX v1.1 already accommodates this lens via the T1-T5 protocol + investigation-as-prompt rule already in §IV |
| `00_meta/ONTOLOGY.md` | Add row 31 (or wherever after siblings resolve) to the lens table; cite this audit in the lock-rationale |
| `00_meta/PROTOCOL.md` | Add a consciousness-lens section to the bucket-routing table — most new fields route to Association; Polemic for explicit-debate edges (Katz↔Forman, Whitehouse-et-al-2019 ↔ Watts-et-al-2015) |
| `00_meta/ONTOLOGY-RATIONALE-2026-05-23-consciousness.md` | New dated rationale doc per the lock procedure (append-only; never edit existing rationale docs per memory) |
| `src/js/forge/themes.js` (if exists) | Add `csr-explanations` color theme |
| `src/js/forge/side-panel.js` (or equivalent) | Add "Cognitive mechanisms" + "Neural correlates" + "Consciousness treatment" disclosure-sections following the existing tier-disclosure UX pattern |
| `index.html` Legend panel | Add `csr-explanations` to the color-theme dropdown |

---

## 8. Risk + scope reckoning

### R-1 — Scientism creep
The lens is a magnet for "the brain explains religion away" framing. CON-2 (neuroscience-finding ≠ popular-extrapolation discipline) is the discipline rule. Every node body explicitly distinguishes the empirical claim from the popular extrapolation. The vault's posture is investigation-as-prompt, not debunking-as-prompt.

### R-2 — Mysticism credulity
The opposite failure: "the data prove the perennial wisdom." CON-1 (perennialist↔contextualist symmetric pairing) is the discipline rule. Every PCE / common-core / unitive-experience node ships with its contextualist counter in the same batch. The reader never encounters Forman without Katz.

### R-3 — Boundary blur with `29_philosophy`
The Stace / Katz / Forman debate is both philosophical and empirical. The boundary rule (§1): if the figure's primary corpus is philosophical-analytic (Katz 1978 is an epistemology essay), they live in `29_philosophy/figures/` with a cross-link stub in `31_`. If their primary corpus is empirical-psychology-of-mysticism (Hood's M-Scale program; Forman's case-collection in *Problem of Pure Consciousness*), they live in `31_consciousness/figures/`. **Cross-link both ways always.**

### R-4 — Boundary blur with `24_pharmacology` + `22_practices`
The substance/practice itself stays in `24_`/`22_`; the *finding about it* lives in `31_`. The pharmacology node for psilocybin carries the molecule + cultural-ritual usage; the consciousness node carries Carhart-Harris's DMN finding + Griffiths's mystical-experience trial. Cross-link both ways.

### R-5 — Boundary blur with politics-lens T5 racial-mysticism wiring
Some "consciousness-evolution" claims (Theosophy root-races; Wilber's "second-tier" hierarchy; New-Age "5D-vs-3D consciousness") are deployed politically as cultural-ranking schemes. These nodes live in `31_consciousness/` (as their consciousness-claim genre) WITH cross-link to `30_politics/movements/theosophy-root-race-political-reception.md` for the political-reception. Render-off-by-default per T5.

### R-6 — Replication crisis + small samples
Much contemplative-neuroscience + psychedelic research has small samples (Lutz 2004 *PNAS*: n=8 long-term meditators + 10 controls; Carhart-Harris 2012 *PNAS*: n=15). The lens MUST disclose sample-sizes + replication-status in node bodies. We do not amplify n=8 results to "Tibetan monks have unique brains" framing. Replication-status field is mandatory on every `contemplative-neuroscience-finding` + `psychedelic-science` node.

### R-7 — The hard problem question
The lens is NOT a forum for solving the philosophy-of-mind hard-problem. IIT (Tononi), GWT (Dehaene), HOT, illusionism — these live in `29_philosophy/problems/consciousness/`. The consciousness-lens only references them when a religious-experience claim turns on them (rare). Disambiguation table in §1; figures-catalog (companion doc) marks every philosopher-of-mind figure with their PRIMARY-HOME (philosophy lens) and the consciousness-lens cross-link rationale.

---

## 9. Decision checklist — John's greenlight / veto

For each, John picks: **GREEN** (proceed) / **AMBER** (modify per note) / **RED** (don't do this).

| # | Decision | John's call |
|---|---|---|
| 1 | Create the consciousness lens at slot 31 (or wherever the 2026-05-23 lens-batch resolves — slot-agnostic design) | ☐ |
| 2 | Eight-sub-folder structure (`csr/`, `contemplative-science/`, `psychedelic-science/`, `mysticism-studies/`, `experiential-profiles/`, `nde-research/`, `parapsychology-border/`, `figures/`, `concepts/`) | ☐ |
| 3 | Five node sub-types per §2 (`csr-finding`, `contemplative-neuroscience-finding`, `mysticism-studies-concept`, `experiential-profile`, `consciousness-figure`) | ☐ |
| 4 | Cross-lens new fields per §3: `cognitive-mechanism[]` on deities/themes/rituals/practices, `experiential-profile[]` on rituals/practices, `neural-correlate[]` on rituals/practices, `consciousness-treatment[]` on traditions | ☐ |
| 5 | Boundary discipline per §1 — substance home = `24_`; practice home = `22_`; finding home = `31_`; philosopher whose primary corpus is analytic home = `29_`; debate-cross-link always | ☐ |
| 6 | CON-1 perennialist↔contextualist symmetric pairing per §4 (every Stace/Forman with a Katz/Proudfoot in the same batch) | ☐ |
| 7 | CON-2 neuroscience-finding ≠ popular-extrapolation discipline per §4 (two-section node-body: what study shows / what gets claimed about it) | ☐ |
| 8 | CON-3 NDE + parapsychology included with full rebuttal sourcing per §4 (Blackmore + Augustine + French + Hyman + Wiseman in same batch) | ☐ |
| 9 | T5 protocol applied to Theosophy root-race consciousness-evolution + Evola consciousness-hierarchy (hidden-by-default + cross-link to politics-lens) | ☐ |
| 10 | Forge: NO dedicated wedge; instead side-panel "Cognitive mechanisms" + "Neural correlates" + "Consciousness treatment" disclosure-sections + new "CSR explanations" color theme per §6 | ☐ |
| 11 | Replication-status + sample-size disclosure MANDATORY on every contemplative-neuroscience + psychedelic-science finding node per §8 R-6 | ☐ |
| 12 | First-batch roster ~30 T1-only nodes (CSR core 10 + contemplative-neuro 8 + mysticism-studies 8 + experiential-profiles 4) per §10 below | ☐ |
| 13 | Second-batch ~20 nodes including T2 (neurotheology, Pollan, integral) + the figure catalog per companion doc | ☐ |
| 14 | Third-batch ~15 nodes including T3 (parapsychology-border with mandatory rebuttal sources) + T5 (consciousness-evolution political reception cross-links) | ☐ |
| 15 | Companion doc `AUDIT/consciousness-key-figures-2026-05-23.md` for the ~50 figures (filed alongside this spec) | ☐ |

---

## 10. Recommended roll-out

### First batch (T1 only, ~30 nodes)

**CSR core (10):**
- agency-detection-hyperactive · minimally-counterintuitive-concepts · theory-of-mind-mentalizing · mode-doctrinal · mode-imagistic · moralizing-high-gods-societal-scale · costly-signalling-of-commitment · dual-process-belief · teleological-stance-children · mind-body-dualism-intuitive

**Contemplative neuroscience (8):**
- gamma-oscillation-long-term-meditators · default-mode-network-suppression-meditation · attention-training-shamatha-project · mindfulness-amygdala-coupling · loving-kindness-meditation-vagal-tone · neurophenomenology-varela · enactivism-thompson · kozhevnikov-deity-yoga-cognitive

**Mysticism studies (8):**
- pure-consciousness-event-pce · katz-contextualism-thesis · perennialist-position-stace · attributional-account-proudfoot · m-scale-mysticism-measurement · mystical-experience-questionnaire-meq · ineffability-as-cognitive-category · pahnke-typology

**Experiential profiles (4):**
- ego-dissolution · unitive-experience · noetic-quality · ineffability (as experiential-profile node, distinct from mysticism-studies-concept node)

### Second batch (T1 + T2, ~25 nodes)

- All psychedelic-science core: default-mode-network-suppression-psilocybin · psilocybin-mystical-experience-mef-2006 · psilocybin-depression-trial-2016 · good-friday-experiment-1962-2002 · entropic-brain-hypothesis · letheby-philosophy-of-psychedelics
- NDE T1 core: greyson-scale · aware-1-2-studies · peak-in-darien (the historical-corpus debate)
- T2: neurotheology-newberg-spect (with critique-banner) · wilber-integral-model (with critique-banner) · pollan-popular-psychedelic-framing (T2 as documented popular-reception)
- ~30 figure-nodes per companion doc — Boyer / Barrett / Whitehouse / Norenzayan / McCauley / Atran / Slingerland / Varela / Thompson / Davidson / Lutz / Brewer / Saron / Stace / Katz / Forman / Hood / Proudfoot / Carhart-Harris / Griffiths / Letheby / Pahnke / Greyson / Parnia

### Third batch (T3 + T5 with mandatory rebuttal sources, ~15 nodes)

- Parapsychology-border: ganzfeld-protocol (with Hyman rebuttal) · global-consciousness-project (with rebuttal) · radin-conscious-universe (with rebuttal) · bem-precognition (with Galak failed-replication)
- T3 popular psychedelic-mysticism: strassman-dmt-spirit-molecule (with mainstream-neuroscience rebuttal) · hancock-supernatural (with critical academic-cite) · grof-transpersonal (split T1 clinical / T3 cosmology)
- T4: mckenna-stoned-ape (with primatology rebuttal) · sheldrake-morphic-resonance (with Rose 1981 + onwards rebuttal)
- T5: theosophy-root-race-consciousness-evolution (cross-link to politics-lens) · evola-races-of-the-spirit-consciousness-hierarchy (cross-link to politics-lens)
- Critical-counter-corpus nodes: blackmore-dying-to-live · augustine-myth-of-afterlife · french-cortex-anomalistic-psych · wiseman-paranormality · hyman-ganzfeld-critique

Total roster across three batches: **~70 nodes.**

---

## 11. References (peer-reviewed anchor list)

The consciousness canon used to construct this lens. Full per-figure citations live in the companion `consciousness-key-figures-2026-05-23.md`; this is the pruned anchor list.

**CSR foundational + survey:**
- Boyer, Pascal. 2001. *Religion Explained: The Evolutionary Origins of Religious Thought*. Basic Books.
- Barrett, Justin. 2004. *Why Would Anyone Believe in God?*. AltaMira.
- Whitehouse, Harvey. 2000. *Arguments and Icons: Divergent Modes of Religiosity*. Oxford UP.
- Whitehouse, Harvey. 2004. *Modes of Religiosity: A Cognitive Theory of Religious Transmission*. AltaMira.
- Norenzayan, Ara. 2013. *Big Gods: How Religion Transformed Cooperation and Conflict*. Princeton UP.
- McCauley, Robert. 2011. *Why Religion Is Natural and Science Is Not*. Oxford UP.
- Atran, Scott. 2002. *In Gods We Trust: The Evolutionary Landscape of Religion*. Oxford UP.
- Guthrie, Stewart. 1993. *Faces in the Clouds: A New Theory of Religion*. Oxford UP.
- Watts, Joseph, et al. 2015. "Broad supernatural punishment but not moralizing high gods precede the evolution of political complexity in Austronesia." *Proceedings of the Royal Society B* 282: 20142556.
- Whitehouse, Harvey, et al. 2019. "Complex societies precede moralizing gods throughout world history." *Nature* 568: 226-229.
- Beheim, Bret, et al. 2021. "Treatment of missing data determined conclusions regarding moralizing gods." *Nature* 595: E29-E34. (the reanalysis-debate node anchor)

**Contemplative neuroscience anchors:**
- Lutz, Antoine, et al. 2004. "Long-term meditators self-induce high-amplitude gamma synchrony during mental practice." *PNAS* 101.46: 16369-16373.
- Brewer, Judson, et al. 2011. "Meditation experience is associated with differences in default mode network activity and connectivity." *PNAS* 108.50: 20254-20259.
- MacLean, Katherine, et al. 2010. "Intensive meditation training improves perceptual discrimination and sustained attention." *Psychological Science* 21.6: 829-839.
- Varela, Francisco, Evan Thompson, Eleanor Rosch. 1991. *The Embodied Mind: Cognitive Science and Human Experience*. MIT Press.
- Thompson, Evan. 2007. *Mind in Life: Biology, Phenomenology, and the Sciences of Mind*. Harvard / Belknap.
- Davidson, Richard J. & Antoine Lutz. 2008. "Buddha's Brain: Neuroplasticity and Meditation." *IEEE Signal Processing Magazine* 25.1: 176-174.
- Hölzel, Britta, et al. 2011. "Mindfulness practice leads to increases in regional brain gray matter density." *Psychiatry Research: Neuroimaging* 191.1: 36-43.
- Kozhevnikov, Maria, et al. 2009. "The enhancement of visuospatial processing efficiency through Buddhist deity meditation." *PLoS ONE* 4(5): e5594.
- Newberg, Andrew & Eugene d'Aquili. 2001. *Why God Won't Go Away*. Ballantine.
- Schjoedt, Uffe. 2009. "The Religious Brain: A General Introduction to the Experimental Neuroscience of Religion." *Method & Theory in the Study of Religion* 21.3: 310-339. (the methodology-critique anchor)

**Psychedelic neuroscience anchors:**
- Carhart-Harris, Robin, et al. 2012. "Neural correlates of the psychedelic state as determined by fMRI studies with psilocybin." *PNAS* 109.6: 2138-2143.
- Carhart-Harris, Robin & Karl Friston. 2019. "REBUS and the Anarchic Brain: Toward a Unified Model of the Brain Action of Psychedelics." *Pharmacological Reviews* 71.3: 316-344.
- Griffiths, Roland, et al. 2006. "Psilocybin can occasion mystical-type experiences having substantial and sustained personal meaning and spiritual significance." *Psychopharmacology* 187: 268-283.
- MacLean, Katherine, et al. 2012. "Factor analysis of the Mystical Experience Questionnaire." *Journal for the Scientific Study of Religion* 51.4: 721-737.
- Letheby, Chris. 2021. *Philosophy of Psychedelics*. Oxford UP.
- Pahnke, Walter. 1963. *Drugs and Mysticism*. Harvard PhD dissertation.
- Doblin, Rick. 1991. "Pahnke's 'Good Friday Experiment': A long-term follow-up and methodological critique." *Journal of Transpersonal Psychology* 23.1: 1-28.

**Mysticism studies anchors:**
- Stace, Walter T. 1960. *Mysticism and Philosophy*. Macmillan.
- Katz, Steven T. 1978. "Language, Epistemology, and Mysticism." In Katz ed. *Mysticism and Philosophical Analysis*. Oxford UP, 22-74.
- Forman, Robert K.C., ed. 1990. *The Problem of Pure Consciousness: Mysticism and Philosophy*. Oxford UP.
- Proudfoot, Wayne. 1985. *Religious Experience*. California UP.
- Hood, Ralph W. 1975. "The construction and preliminary validation of a measure of reported mystical experience." *Journal for the Scientific Study of Religion* 14.1: 29-41.
- Hood, Ralph W., et al. 2001. "Dimensions of the Mysticism Scale: Confirming the three-factor structure in the United States and Iran." *Journal for the Scientific Study of Religion* 40.4: 691-705.
- Jones, Richard H. 2016. *Philosophy of Mysticism: Raids on the Ineffable*. SUNY.
- Yaden, David, et al. 2017. "The Varieties of Self-Transcendent Experience." *Review of General Psychology* 21.2: 143-160.
- Yaden, David & Andrew Newberg. 2022. *The Varieties of Spiritual Experience: 21st Century Research and Perspectives*. Oxford UP.

**NDE + critical-counter anchors:**
- Greyson, Bruce. 1983. "The Near-Death Experience Scale: Construction, reliability, and validity." *Journal of Nervous and Mental Disease* 171.6: 369-375.
- van Lommel, Pim, et al. 2001. "Near-death experience in survivors of cardiac arrest: a prospective study in the Netherlands." *Lancet* 358: 2039-2045.
- Parnia, Sam, et al. 2014. "AWARE-AWAreness during REsuscitation -- A prospective study." *Resuscitation* 85.12: 1799-1805.
- Blackmore, Susan. 1993. *Dying to Live: Near-Death Experiences*. Prometheus.
- Augustine, Keith & Michael Martin, eds. 2015. *The Myth of an Afterlife: The Case Against Life After Death*. Rowman & Littlefield.
- French, Christopher. 2009. "Near-death experiences and the brain." In Murray ed. *Psychological Scientific Perspectives on Out-of-Body and Near-Death Experiences*. Nova.
- Wiseman, Richard. 2010. *Paranormality: Why We See What Isn't There*. Macmillan.

**Risk-flag civil-rights / political-reception sources (per CODEX §IV T5):**
- Goodrick-Clarke, Nicholas. 1985. *The Occult Roots of Nazism: Secret Aryan Cults and Their Influence on Nazi Ideology*. I.B. Tauris.
- Goodrick-Clarke, Nicholas. 2002. *Black Sun: Aryan Cults, Esoteric Nazism, and the Politics of Identity*. NYU Press.
- (Cross-link to politics-lens companion doc `political-theology-key-figures-2026-05-23.md` for Theosophy + Evola treatment.)

---

*End of spec. Filed alongside `AUDIT/consciousness-key-figures-2026-05-23.md` (companion figures catalog). Both await John's greenlight before any node creation.*
