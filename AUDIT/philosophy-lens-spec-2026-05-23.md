# Philosophy Lens (`29_philosophy/`) — design spec

**Date:** 2026-05-23
**Handle:** opus-philosophy-lens-spec-1
**Status:** PROPOSAL — awaiting John's greenlight/veto. READ-ONLY scoping document; no nodes created, no existing nodes touched.
**Audited against:** `00_meta/ONTOLOGY.md` (26-lens spine + pending lens proposals), `00_meta/ONTOLOGY-RATIONALE-2026-05-18.md` (three-bar new-lens procedure), `00_meta/CODEX.md` v1.1 (5-tier source system + investigation-not-advocacy posture), `00_meta/PROTOCOL.md` §3.1 (21-type cross-tradition edge vocabulary, locked 2026-05-23), and three sibling proposals filed today: `AUDIT/sacred-geometry-lens-spec-2026-05-23.md`, `AUDIT/canonical-colors-deity-table-2026-05-23.md`, `AUDIT/politics-lens-spec-2026-05-23.md`.

---

## 0. Numbering note (read first)

The ontology lock currently lists slots 01–26 occupied (per `ONTOLOGY-RATIONALE-2026-05-18.md`). As of today three other lenses are in the air:

- `27_geometry/` (parallel proposal — `AUDIT/sacred-geometry-lens-spec-2026-05-23.md`)
- `28_color/` (parallel proposal — `AUDIT/canonical-colors-deity-table-2026-05-23.md`)
- `30_politics/` (parallel proposal — `AUDIT/politics-lens-spec-2026-05-23.md`)

The geometry author proposed bumping `27_attire/` → `28_attire/`. The politics author proposed slot 30 as a tail. **This spec proposes `29_philosophy/` at slot 29, sitting between the encoded-cosmos cluster (geometry / color) and the politics tail.** Philosophy is a meta-discipline — a *method* applied to religion rather than a phenomenon *of* religion — and slot 29 puts it adjacent to `21_theology/` (its closest neighbor and its primary boundary partner) via the natural reading path, while keeping `30_politics/` at the political-application tail. **The lens design is slot-agnostic; John picks the order. I use `29_philosophy/` as a placeholder below.**

---

## 1. Lens scope

`29_philosophy/` collects the **philosophical reflection ABOUT religion** — the methods, problems, thinkers, and works that interrogate religious claims from outside any single tradition's faith-internal vocabulary. The animating thesis: **the vault already holds Aquinas the theologian (faith-seeking-understanding) and the Five Ways as a doctrinal-defense text; what it lacks is a clean home for Aquinas the philosopher of religion, for Hume's *Dialogues Concerning Natural Religion*, for Schellenberg's hiddenness argument, for Steven Katz's contextualist critique of perennialism, for David Loy's Buddhist-Heideggerian comparative work, for Charles Taylor's *A Secular Age*. These are FIRST-CLASS objects of investigation — philosophical *methods* applied to religious phenomena — and they currently float between `04_persons/`, `17_documents/`, and `06_themes/` with no coherent home.**

Philosophy of religion is a **recognized academic field** with peer-reviewed journals (*International Journal for Philosophy of Religion*, Springer; *Religious Studies*, Cambridge; *Philosophia*, Springer; *Sophia*, Springer), endowed chairs at every major research university, the Stanford Encyclopedia of Philosophy as gold-standard reference, and a continuous canon from Plato's *Euthyphro* through contemporary analytic + comparative + phenomenological + continental work. The vault should mirror the field.

**Critical orientation:** philosophy of religion is *secular by methodological commitment*. It does not assume the truth of any tradition; it adjudicates arguments. This is what distinguishes it from theology, where faith-commitment is the methodological starting point (Anselm: *credo ut intelligam*). The lens collects the OUTSIDE-LOOKING-IN posture; theology collects the INSIDE-LOOKING-OUT posture. The investigation-not-advocacy posture of CODEX v1.1 makes philosophy of religion the **natural methodological home of the vault itself** — and that is one reason it earns a dedicated lens.

### Distinction from neighboring lenses

| Lens | What it holds | How philosophy differs |
|---|---|---|
| `21_theology/` | systematic doctrinal formulations from inside a tradition (Chalcedonian Christology, Tawhid, Trikaya, Sola Scriptura; doctrine-of-Discovery; doctrine-of-Incarnation) | Theology nodes are faith-internal: they reason from revelation + tradition to refined doctrine. Philosophy nodes are faith-external: they reason from publicly-available premises to evaluative conclusions, OR they describe-and-classify religious phenomena without ratifying them. Aquinas-the-theologian (*Summa Theologiae* Part I qq. 1–43 on the nature of God within Christian revelation) lives in 21; Aquinas-the-philosopher-of-religion (the Five Ways as natural-theology arguments addressable by any rational agent) lives in 29. They cross-link. |
| `04_persons/` | biographical entities (Plotinus born ~204, died 270 in Rome; published *Enneads* via Porphyry) | A person-node is biographical. A philosophy-thinker-node carries their **philosophical method + problems engaged + tier**. Plotinus-the-person is in 04; Plotinus-the-philosopher-of-religion (his theory of mystical union with the One, his apophatic theology, his influence on Christian Neoplatonism) is in 29. Two-way cross-link. |
| `17_documents/` | actual primary-source texts (the Bible, the Quran, the Tao Te Ching, the *Critique of Pure Reason*) | A document-node is a text-object: scripture, treatise, gospel. A philosophy-work-node is a *philosophical argument-bearing text* with named theses, named opponents, and downstream argumentative reception. Hume's *Dialogues Concerning Natural Religion* is both — it's a primary text AND a philosophy-of-religion work; we wire it in 17 as document AND in 29 as philosophy-work, with explicit cross-link. Otto's *Das Heilige* is primarily a philosophy-of-religion work; living in 17 is wrong-shaped (it isn't a scripture, isn't a treatise-of-tradition, is specifically a phenomenological-philosophical analysis). |
| `06_themes/` (pending → `06_motifs/`) | recurring cross-tradition motifs (ineffability, divine-hiddenness, theodicy as a motif, mystical-union as a motif) | Themes are *patterns* that travel cross-tradition. Philosophy-problem-nodes are the *philosophical-method articulations* of those patterns. The theme "divine hiddenness" is a cross-tradition pattern that lives in 06; the **philosophical problem of divine hiddenness** (Schellenberg's argument, Howard-Snyder's response, the cumulative-case literature) lives in 29. They cross-link. |
| `25_divination/` | divinatory practices (I Ching, geomancy, astrology-as-practice) | Distinct domain — divination is a practice-class, not a philosophical method. |
| `15_traditions/` | per-tradition overviews (Sunni Islam, Mahayana Buddhism, Roman Catholicism) | Traditions are religious communities. Philosophical-school nodes (Madhyamaka philosophy, Advaita Vedanta as philosophy, Stoicism as a philosophical school engaging religion) are *philosophical movements*, not religious communities. Some straddle (Advaita Vedanta is both a religious tradition and a philosophical school) — cross-link via `philosophical-school` field per §5.2 below. |

### Why this lens passes the three bars (per `ONTOLOGY-RATIONALE-2026-05-19.md` procedure)

**Bar 1 — existing lens fails it.** Philosophy of religion's canonical works have no clean home. *A Secular Age* by Charles Taylor is not a scripture (so not 17_documents in the same sense as the Bible), is not a faith-internal theological treatise (so not 21_theology), is not a biographical entity (so not 04_persons except for Taylor himself), and is not a motif (so not 06_themes). It is a *philosophical investigation OF religion-and-modernity*. Same applies to Hume's *Dialogues*, Otto's *Das Heilige*, Eliade's *The Sacred and the Profane*, James's *Varieties of Religious Experience*, Stace's *Mysticism and Philosophy*, Katz's *Mysticism and Philosophical Analysis*, Plantinga's *Warranted Christian Belief*, Schellenberg's *Divine Hiddenness and Human Reason*, Loy's *Nonduality*. ~80–120 such works exist; they currently have no node-type fit.

**Bar 2 — real demand signal.** Vault grep shows scattered references: Plato, Plotinus, Augustine, Aquinas, Hume, Kant, James, Otto, Eliade, Heidegger, Wittgenstein, Tillich, Schmitt, Taylor, and Buber all appear today as `04_persons/` nodes, but their philosophical contributions are described as biographical-paragraph text rather than as discrete philosophical-position nodes. The "perennialism vs contextualism" debate — central to philosophy of mysticism — has no node. The "problem of religious language" has no node. The "argument from religious experience" has no node. These are gaps. The Forge view's `category: "perennial-philosophy"` and `category: "phenomenology-of-religion"` tags appear in several existing nodes' frontmatter — like the politics lens's 47-themes signal, this is John already routing material *somewhere* without a coherent home.

**Bar 3 — bounded scope.** The lens has a clean definition borrowed from the academic field: **the philosophical study of religious phenomena, where "philosophical" means methodologically secular and argument-based, encompassing five sub-methods (analytic philosophy of religion / phenomenology of religion / philosophy of mysticism / comparative East-West philosophy / continental-hermeneutic philosophy of religion) and one disputed-overlap zone (process theology, which straddles 21 + 29).** Bounded inputs:

- IN: philosophical *problems* engaging religion (existence-of-god arguments, problem-of-evil, divine hiddenness, religious language, mystical-experience-and-its-interpretation, perennialism-vs-contextualism, religious epistemology, ineffability, the secular-and-the-sacred)
- IN: philosophical *methods* applied to religion (analytic / phenomenological / hermeneutic / comparative / continental)
- IN: philosophical *thinkers* (the ~40–60 canonical figures catalogued in the companion doc)
- IN: philosophical *works* with named theses (Hume *Dialogues*, Otto *Das Heilige*, Plantinga *Warranted Christian Belief*, Stace *Mysticism and Philosophy*, Loy *Nonduality*, Taylor *A Secular Age*)
- IN: philosophical *schools* engaging religion as a primary problem-domain (Neoplatonism-as-philosophy, Madhyamaka philosophy, Kyoto School, Frankfurt School on religion, Reformed Epistemology school)
- OUT: faith-internal systematic theology (stays in `21_theology/`)
- OUT: biographical lives of philosophers (stay in `04_persons/`, with `philosophical-school:` cross-field pointing to their school here)
- OUT: scriptures + primary religious texts (stay in `17_documents/`)
- OUT: cross-tradition motifs *as motifs* (stay in `06_themes/`/`06_motifs/`)
- OUT: political-theological movements (stay in `30_politics/` per the parallel proposal)

The lens is bounded by the academic field's own delimitation: if a Stanford Encyclopedia of Philosophy entry treats the entity as philosophy-of-religion / phenomenology-of-religion / philosophy-of-mysticism, it belongs in 29_philosophy. SEP is the T1 gold standard (see §4 Rule PHIL-2 below).

---

## 2. Ontology — what KIND of node lives here?

Five node sub-types within the lens. Each carries `type:` field per the vault's pattern:

### 2.1 `philosophy-method` (the meta-frame node — small set, ~5–8 nodes)

The handful of methodological frames in which philosophical engagement with religion takes place. These are NOT schools (which are tradition-specific) — they are the meta-categories.

Proposed catalog:
- `phenomenology-of-religion` (Otto / van der Leeuw / Eliade / Wach / Smart — descriptive-typological method, brackets truth-questions, focuses on *what religious consciousness presents itself as*)
- `analytic-philosophy-of-religion` (Anglophone post-1960s — Plantinga / Swinburne / Hick / Alston / Schellenberg — applies logical-analytical-evidential tools to traditional problems)
- `continental-philosophy-of-religion` (post-Heideggerian; Ricoeur / Marion / Caputo / Vattimo — hermeneutic, phenomenological-of-givenness, post-secular)
- `comparative-philosophy-of-religion` (East-West and trans-tradition; Loy / Mohanty / Siderits / Garfield / Ganeri / Matilal / Halbfass — uses one tradition's philosophical resources to illuminate or contest another's)
- `philosophy-of-mysticism` (Stace / Katz / Forman / Proudfoot / Jones — specifically about the structure, interpretation, and epistemic status of mystical experience)
- `process-philosophy-of-religion` (Whitehead / Hartshorne / Cobb — straddles 21+29; the philosophical side is here, the theological extension in 21)
- `hermeneutic-philosophy-of-religion` (Gadamer / Ricoeur on religious texts; the interpretive-tradition method)

A method-node's `notes:` summarizes the method's commitments, its critics, and its current state in the SEP entry.

### 2.2 `philosophy-problem` (the workhorse type — ~20–35 nodes)

The classical and contemporary problems that constitute philosophy of religion as a discipline. **Per CODEX v1.1, every problem-node carries `source-tier:` AND, where applicable, `political-risk-flag:` (rare for philosophy, but applies to e.g. the racial-essentialist-perennialism diffusion that crosses into politics).**

Examples (full catalog further in this doc):

- `existence-of-god-cosmological-argument` — Aquinas Five Ways → Leibniz → Craig (Kalam) → Pruss; rebuttals Hume / Mackie / Oppy
- `existence-of-god-ontological-argument` — Anselm → Descartes → Plantinga (modal version) → Gödel; rebuttals Kant / Gaunilo / Oppy
- `existence-of-god-teleological-argument` — Paley → Hume (rebuttal) → Behe (contested) → Swinburne (Bayesian fine-tuning)
- `problem-of-evil-logical` — Mackie 1955 → Plantinga 1974 free-will defense (now considered to have closed the logical problem in mainline analytic literature)
- `problem-of-evil-evidential` — Rowe 1979 → Wykstra 1984 → van Inwagen 2006 — the live form of the problem
- `divine-hiddenness` — Schellenberg 1993 *Divine Hiddenness and Human Reason* + 2007 *The Wisdom to Doubt*; responses Howard-Snyder, Moser
- `religious-language-problem` — Aquinas (analogy) / logical-positivism (Ayer-verification) / Wittgenstein-on-language-games / D.Z. Phillips
- `mystical-experience-perennialism` — Stace 1960 *Mysticism and Philosophy* + Forman 1990 *The Problem of Pure Consciousness*
- `mystical-experience-contextualism` — Katz 1978 *Mysticism and Philosophical Analysis* (the constructivist counter)
- `religious-epistemology-reformed` — Plantinga / Wolterstorff / Alston — properly-basic beliefs
- `religious-epistemology-evidentialism` — Clifford / Russell / Mavrodes
- `ineffability` — the problem of religious language's limits; cross-link to Wittgenstein, Dionysius, Nagarjuna's catuṣkoṭi
- `religious-experience-as-evidence` — James 1902 *Varieties* + Swinburne *The Existence of God* ch. 13 + Alston 1991 *Perceiving God*
- `pluralism-vs-exclusivism-vs-inclusivism` — Hick 1989 *An Interpretation of Religion* (pluralism); responses Plantinga, D'Costa, Heim
- `secularization-thesis` — Berger 1967 → retraction → Casanova 1994 → Taylor 2007 — the empirical-philosophical debate
- `comparative-emptiness-and-being` — Loy *Nonduality* 1988 + Garfield *Engaging Buddhism* 2015 + Priest *The Fifth Corner of Four* 2018 — Buddhist śūnyatā vs Western metaphysics-of-being
- `comparative-self-and-no-self` — Siderits 2003 *Personal Identity and Buddhist Philosophy*, Ganeri 2007 *The Concealed Art of the Soul*
- `phenomenology-of-the-holy` — Otto 1917 *Das Heilige* — *mysterium tremendum et fascinans*, numinous
- `phenomenology-of-hierophany` — Eliade *The Sacred and the Profane* + *Patterns in Comparative Religion*
- `problem-of-religious-diversity` — distinct from pluralism: the EPISTEMIC challenge of religious disagreement
- `process-philosophy-of-god` — Whitehead's dipolar theism — straddles 21+29

### 2.3 `philosophy-thinker` (the canon — ~40–60 nodes per companion catalog)

Each canonical philosopher of religion gets a node with:
- main philosophy-of-religion work(s) + tier + claim summary
- philosophical method (one of the 2.1 types)
- problems engaged (link to 2.2 nodes)
- cross-lens connections (which deities / themes / rituals their philosophy treats)

Two-way cross-link: the philosopher's biographical entity sits in `04_persons/`; their philosophical contribution + method + problems sit in `29_philosophy/thinkers/`. The 04 node carries `philosophical-school: <slug>` pointing to the 29 node.

### 2.4 `philosophy-work` (canonical philosophical texts engaging religion — ~25–40 nodes)

The named philosophical-argument-bearing books and essays. Distinct from `17_documents/` (scripture / treatise / gospel) because these are specifically PHILOSOPHICAL ARGUMENTS with named theses, named opponents, named downstream reception.

Examples:
- Hume 1779 *Dialogues Concerning Natural Religion*
- Kant 1793 *Religion within the Bounds of Bare Reason*
- Hegel 1827 *Lectures on the Philosophy of Religion*
- James 1902 *The Varieties of Religious Experience*
- Otto 1917 *Das Heilige*
- Heidegger 1927 *Being and Time* §10 (sketches the philosophy of religion engagement; the larger engagement is in *Phenomenology of Religious Life*)
- Eliade 1957 *The Sacred and the Profane*
- Stace 1960 *Mysticism and Philosophy*
- Smart 1969 *The Religious Experience of Mankind*
- Plantinga 1974 *God and Other Minds* + 2000 *Warranted Christian Belief*
- Swinburne 1979 *The Existence of God*
- Katz ed. 1978 *Mysticism and Philosophical Analysis*
- Hick 1989 *An Interpretation of Religion*
- Forman ed. 1990 *The Problem of Pure Consciousness*
- Alston 1991 *Perceiving God*
- Schellenberg 1993 *Divine Hiddenness and Human Reason*
- Loy 1988 *Nonduality* + 1996 *Lack and Transcendence*
- Taylor 2007 *A Secular Age*
- Garfield 2015 *Engaging Buddhism*
- Ganeri 2007 *The Concealed Art of the Soul* + 2017 *Attention, Not Self*
- Priest 2018 *The Fifth Corner of Four*

A work-node's frontmatter carries `original-text:` pointing back to the `17_documents/` node if the same text lives there too.

### 2.5 `philosophy-school` (philosophical movements engaging religion — ~10–15 nodes)

Coherent philosophical movements / schools that engage religion as a primary problem-domain:
- `neoplatonism-philosophical` (Plotinus, Porphyry, Iamblichus, Proclus — the philosophical school; the religious-tradition aspect remains in 15_traditions)
- `madhyamaka-philosophy` (Nagarjuna, Candrakirti, Tsongkhapa — the philosophical school as distinct from the tradition-of-practice)
- `advaita-vedanta-philosophy` (Shankara as philosopher; the *theological* dimension stays in 21)
- `kyoto-school` (Nishida, Tanabe, Nishitani, Ueda — Japanese Buddhist-existentialist comparative philosophy)
- `reformed-epistemology` (Plantinga, Wolterstorff, Alston — the analytic-school named in §2.2 above)
- `process-philosophy` (Whitehead, Hartshorne, Cobb)
- `phenomenology-of-religion-school` (Otto → van der Leeuw → Eliade → Wach → Smart — the descriptive-typological lineage)
- `traditionalist-perennialism-school` (Guénon / Schuon / Coomaraswamy / Lings — **T3 alternative-school per CODEX, with T5 risk where it crosses into Evola's racial-essentialism — see §4 Rule PHIL-3**)
- `frankfurt-school-on-religion` (Adorno, Benjamin, Habermas — critical-theory engagement with religion)
- `radical-orthodoxy-philosophical-dimension` (Milbank — straddles 21+29+30)

### Sub-folder structure

```
29_philosophy/
├── README.md
├── methods/
│   ├── phenomenology-of-religion.md
│   ├── analytic-philosophy-of-religion.md
│   ├── continental-philosophy-of-religion.md
│   ├── comparative-philosophy-of-religion.md
│   ├── philosophy-of-mysticism.md
│   ├── process-philosophy-of-religion.md
│   ├── hermeneutic-philosophy-of-religion.md
├── problems/
│   ├── existence-of-god-cosmological.md
│   ├── existence-of-god-ontological.md
│   ├── existence-of-god-teleological.md
│   ├── problem-of-evil-logical.md
│   ├── problem-of-evil-evidential.md
│   ├── divine-hiddenness.md
│   ├── religious-language-problem.md
│   ├── mystical-experience-perennialism.md
│   ├── mystical-experience-contextualism.md
│   ├── religious-epistemology-reformed.md
│   ├── religious-epistemology-evidentialism.md
│   ├── ineffability.md
│   ├── pluralism-vs-exclusivism.md
│   ├── secularization-thesis.md
│   ├── ...
├── thinkers/
│   ├── plato.md (cross-link to 04_persons/plato.md — see companion catalog)
│   ├── plotinus.md
│   ├── augustine-philosophical.md
│   ├── aquinas-philosophical.md
│   ├── hume.md
│   ├── kant.md
│   ├── hegel.md
│   ├── kierkegaard.md
│   ├── nietzsche.md
│   ├── james-william.md
│   ├── otto-rudolf.md
│   ├── van-der-leeuw.md
│   ├── eliade-mircea.md
│   ├── plantinga-alvin.md
│   ├── swinburne-richard.md
│   ├── hick-john.md
│   ├── alston-william.md
│   ├── schellenberg-jl.md
│   ├── stace-walter.md
│   ├── katz-steven.md
│   ├── forman-robert.md
│   ├── proudfoot-wayne.md
│   ├── loy-david.md
│   ├── garfield-jay.md
│   ├── ganeri-jonardon.md
│   ├── siderits-mark.md
│   ├── matilal-bk.md
│   ├── priest-graham.md
│   ├── taylor-charles.md
│   ├── ricoeur-paul.md
│   ├── gadamer.md
│   ├── marion-jean-luc.md
│   ├── caputo-john.md
│   ├── whitehead.md
│   ├── ... (see companion catalog)
├── works/
│   ├── hume-dialogues.md
│   ├── kant-religion-within-bounds.md
│   ├── otto-das-heilige.md
│   ├── james-varieties.md
│   ├── eliade-sacred-and-profane.md
│   ├── stace-mysticism-and-philosophy.md
│   ├── katz-mysticism-and-philosophical-analysis.md
│   ├── plantinga-warranted-christian-belief.md
│   ├── swinburne-existence-of-god.md
│   ├── schellenberg-divine-hiddenness.md
│   ├── loy-nonduality.md
│   ├── taylor-secular-age.md
│   ├── garfield-engaging-buddhism.md
│   ├── ganeri-concealed-art-of-the-soul.md
│   ├── priest-fifth-corner-of-four.md
│   ├── ...
└── schools/
    ├── neoplatonism-philosophical.md
    ├── madhyamaka-philosophy.md
    ├── advaita-vedanta-philosophy.md
    ├── kyoto-school.md
    ├── reformed-epistemology.md
    ├── process-philosophy.md
    ├── phenomenology-of-religion-school.md
    ├── traditionalist-perennialism-school.md   # T3, see §4 PHIL-3
    ├── frankfurt-school-on-religion.md
    ├── ...
```

The sub-folder split is **strongly recommended**. Without it, the ~100+ projected nodes form an undifferentiated pile; with it, the five sub-types stay semantically clean and the lens is browseable. Build-script update is one-time and follows the existing sub-folder routing pattern already used in `02_documents/`.

---

## 3. The boundary discipline — philosophy vs theology

This is the highest-stakes design decision in the lens. Without a sharp boundary, `29_philosophy/` and `21_theology/` become redundant or quarrel over canonical figures (Augustine, Aquinas, Maimonides, Shankara, Schleiermacher, Tillich). With a sharp boundary, both lenses stay coherent and the canonical figures get split-treatment that scholars themselves use.

### 3.1 The methodological commitment criterion

A node belongs in `21_theology/` if it reasons **from revelation + tradition as premises** toward refined doctrine. A node belongs in `29_philosophy/` if it reasons **from publicly-available premises** (logical, empirical, phenomenological) toward conclusions evaluable by any rational agent without prior faith-commitment.

Anselm's classic formulation captures this exactly: theology is *fides quaerens intellectum* — faith seeking understanding (theology assumes faith and works downstream). Philosophy of religion is the inverse — *intellectus quaerens fidem* OR *intellectus quaerens veritatem* — reason seeking either to ground faith or to evaluate religious claims without assuming them.

The criterion is **methodological, not biographical**. The same person can write both kinds of work. The same chapter can sometimes be both, but in most cases the distinction is clear in the work's own announced method.

### 3.2 Split-treatment for canonical figures who straddle

A handful of canonical figures wrote *both* kinds of work. They get nodes in BOTH lenses with explicit cross-link. The rule: **the node-name disambiguates by suffix or sub-folder.**

| Figure | `21_theology/` node | `29_philosophy/thinkers/` node |
|---|---|---|
| Augustine | `augustine-theology.md` — *De Trinitate*, *De Civitate Dei* as Christian-Platonic theology, *Confessions* as confession of faith | `augustine-philosophical.md` — *Confessions* book XI on time, the cogito-anticipation in *De Trinitate* XI, the philosophy-of-evil dimension (privation theory of evil as philosophical thesis as opposed to its theological deployment) |
| Aquinas | `aquinas-theology.md` — *Summa Theologiae* I qq. on Trinity, Incarnation, sacraments as faith-internal | `aquinas-philosophical.md` — Five Ways (*Summa* I q. 2 a. 3, treated as natural-theology accessible without revelation), the analogy doctrine in religious language, the philosophy-of-mind dimension of *Summa contra Gentiles* |
| Maimonides | `maimonides-theology.md` — *Mishneh Torah*, halakhic theology | `maimonides-philosophical.md` — *Guide for the Perplexed*, religious language and negative theology, problem of evil treatment |
| Ibn Sina (Avicenna) | (mostly philosophical — light theology presence) | `ibn-sina-philosophical.md` — *Kitab al-Shifa*, Necessary-Being argument, philosophy of soul (Floating Man) |
| Ibn Rushd (Averroes) | `ibn-rushd-theology.md` — *Decisive Treatise* harmonization | `ibn-rushd-philosophical.md` — *The Incoherence of the Incoherence* (responding to al-Ghazali) |
| Al-Ghazali | `al-ghazali-theology.md` — *Ihya' ulum al-din* | `al-ghazali-philosophical.md` — *The Incoherence of the Philosophers* (a philosophy-of-religion text in the polemical-philosophical sense) |
| Sankara | `sankara-theology.md` — Brahmasūtra-bhāṣya as Advaita commentary | `sankara-philosophical.md` — Advaita as philosophical position (per Halbfass, Mohanty) |
| Ramanuja | `ramanuja-theology.md` — Vishishtadvaita as theology | (mostly stays in 21; less philosophical-method dimension) |
| Eckhart | `eckhart-theology.md` — German sermons | `eckhart-philosophical.md` — the philosophical-mystical dimension (per McGinn, in his philosophical mode) |
| Spinoza | (no 21 node — Spinoza was excommunicated and is not "Jewish theology" in the systematic sense) | `spinoza-philosophical.md` — *Tractatus Theologico-Politicus*, *Ethics* on God-or-Nature |
| Pascal | `pascal-theology.md` — *Pensées* as Jansenist apologetic-theology | `pascal-philosophical.md` — the Wager as philosophical argument; "reasons of the heart" as religious-epistemology |
| Kant | (no 21 node — Kant was not a theologian, though some Protestant scholars receive him as one) | `kant-philosophical.md` — *Critique of Pure Reason* on God-existence proofs; *Religion within Bounds* |
| Schleiermacher | `schleiermacher-theology.md` — *The Christian Faith* as systematic Protestant theology | `schleiermacher-philosophical.md` — *On Religion: Speeches to Its Cultured Despisers* as philosophy-of-religion |
| Hegel | (in 21 only if treating Christology-philosophical-theology; complicated — the *Lectures* are arguably both) | `hegel-philosophical.md` — *Lectures on the Philosophy of Religion* |
| Kierkegaard | `kierkegaard-theology.md` — *Practice in Christianity*, *Training in Christianity* | `kierkegaard-philosophical.md` — *Fear and Trembling*, *Concluding Unscientific Postscript*, teleological suspension of the ethical |
| Tillich | `tillich-theology.md` — *Systematic Theology* | `tillich-philosophical.md` — *The Courage to Be*, philosophical-existential dimension |
| Whitehead / Hartshorne | `process-theology.md` (already in queue) | `process-philosophy.md` (the philosophy-of-god dimension) |
| Heschel | `heschel-theology.md` — *God in Search of Man* | `heschel-philosophical.md` — *Man Is Not Alone* (philosophy-of-religion side) |
| Buber | `buber-theology.md` — *Two Types of Faith* | `buber-philosophical.md` — *I and Thou* as philosophical phenomenology |

The pattern: **same person, two nodes, suffix-disambiguated, with `cross-lens-pair:` field on each pointing at the other.** This is more nodes but better epistemology — and it lets the Forge view paint the same person twice (once as theologian, once as philosopher) with the appropriate edge colors.

### 3.3 The simple-case figures

Most figures don't straddle. They are EITHER theologians (Athanasius, Cyril of Alexandria, Origen, Karl Barth in his *Church Dogmatics* mode, Madhva, Vallabha, Sayyid Qutb-as-theologian) OR philosophers of religion (Hume, Kant in his religion-work, James, Otto, Eliade, Plantinga, Swinburne, Hick, Stace, Katz, Forman, Loy, Garfield, Priest, Taylor, Ricoeur, Marion, Caputo). The split-treatment in §3.2 is only for the genuine straddlers.

### 3.4 The "21_theology has doctrine-* nodes only" rule

A useful sharpening: existing `21_theology/` content (per the live folder listing) is all `doctrine-*` prefixed — `doctrine-incarnation`, `doctrine-sola-scriptura`, `doctrine-mass-literacy-as-religious-prerequisite`, `doctrine-padroado-portuguese-crown-mission`, etc. These are **specific doctrinal formulations**, not philosophical methods or problems. The proposed lens does not collide with the existing 21_theology content — none of the existing doctrine-* nodes need to move. The proposed `21_theology/` ADDITIONS (theology-thinkers like Athanasius-as-theologian, Augustine-as-theologian-suffix-treatment per §3.2) are the only newly-touched 21 nodes, and they are clearly distinct from the existing doctrine catalog.

### 3.5 Decision: when in doubt

When a node could go in either: **does its argument cite Scripture / tradition / revealed-corpus as a *premise* that the reader is expected to share?** If yes → 21. If no (the argument cites publicly-available premises or treats Scripture as evidence to be analyzed rather than authority to be deployed) → 29.

---

## 4. Critical neutrality discipline — three rules for the philosophy lens

Philosophy of religion is not as politically charged as politics, but it has its own discipline traps. Three rules, modeled on the POL-1..3 rules from the politics-lens spec:

### Rule PHIL-1 — Symmetric pairing on live debates

Whenever the lens treats one side of a live academic philosophical debate, the *opposing position* gets a node in the **same batch**. The reader should never encounter Plantinga's *Warranted Christian Belief* without Schellenberg's hiddenness argument and Mackie's *The Miracle of Theism* nearby; Forman's pure-consciousness perennialism without Katz's contextualist critique in the adjacent slot; Stace's mystical-experience-perennialism without Proudfoot's *Religious Experience* in the same batch. The aim is not "balance" in the cable-news sense — it is **academic-currency representation**: if the SEP entry presents the debate as live, the vault presents it as live.

Mandatory paired-batch examples:

- Cosmological argument node → **same batch** Hume's *Dialogues* node + Oppy 2006 *Arguing about Gods* node.
- Perennialism node (Stace, Forman) → **same batch** Katz contextualism node + Proudfoot *Religious Experience* node.
- Reformed Epistemology node (Plantinga / Alston) → **same batch** Schellenberg + Mackie + Oppy nodes.
- Hick's religious pluralism → **same batch** Plantinga's *Pluralism: A Defense of Religious Exclusivism* + D'Costa's critique nodes.
- Eliade phenomenology → **same batch** the post-1980s critical-reception scholarship (Wasserstrom 1999 *Religion after Religion*, McCutcheon 1997 *Manufacturing Religion*) as the contextualist counter to Eliade's perennialism.

### Rule PHIL-2 — The SEP rule (T1 anchor)

**The Stanford Encyclopedia of Philosophy is the T1 gold-standard anchor for every philosophy-lens node where an SEP entry exists.** Every node's `refs:` field cites the SEP entry first (with full author + URL + last-revised date), then peer-reviewed monographs second.

SEP entries are peer-reviewed (the SEP has the most rigorous peer-review system of any reference work in philosophy — every entry has a named author who is a recognized expert and is revised periodically), open-access (so the citation survives URL rot to the extent academic publishing does), and *current* (revisions track the live state of each debate). This makes them better T1 anchors than even Cambridge Companion volumes for philosophy-of-religion topics.

Standard SEP entries the lens depends on (selection — full catalog in §10):
- "Philosophy of Religion" (overview)
- "Cosmological Argument" / "Ontological Arguments" / "Teleological Arguments for God's Existence"
- "Problem of Evil" / "The Logical Problem of Evil" / "The Evidential Problem of Evil"
- "Hiddenness of God"
- "Religious Language" / "Religious Epistemology" / "Religious Experience"
- "Mysticism" / "Mystical Experience"
- "Phenomenology of Religion"
- "Continental Philosophy of Religion"
- "Comparative Philosophy" / "Comparative Philosophy: Chinese and Western"
- "Pluralism in Philosophy of Religion"
- "Reformed Epistemology"
- "Process Theism"
- "Whitehead" / "Hartshorne" / "Plotinus" / "Augustine" / "Aquinas" / "Hume" / "Kant" / "Hegel" / "Kierkegaard" / "William James" / "Otto" / "Eliade" / "Plantinga" (where SEP coverage exists)
- "Nāgārjuna" / "Śaṅkara" / "Buddhist Philosophy" / "Indian Philosophy" categories

Where SEP doesn't have an entry (e.g., Loy, Forman as specific figures), the T1 anchor falls to peer-reviewed monograph + Cambridge / Oxford Handbook chapter.

### Rule PHIL-3 — The perennialism / contextualism / Traditionalist-School minefield

This is the philosophy-lens's analog of the politics-lens's risk-flag discipline. The perennial-philosophy / Traditionalist-School / mystical-experience space contains three distinct positions that get tier-discriminated **per peer-reviewed source — not per agent's preference**:

| Position | Tier | Rationale |
|---|---|---|
| **Stace 1960 perennialism** (mystical experience has a common phenomenological core across traditions) | T1 with live counter | This is mainstream-academic philosophy of mysticism. Stace's *Mysticism and Philosophy* is a standard reference; SEP entries on Mystical Experience treat it as one of the live positions. PAIRED in the same batch with Katz contextualism per Rule PHIL-1. |
| **Forman 1990 (pure consciousness)** + the post-Forman defense of a weaker perennialism (the "PCE" — Pure Consciousness Event — argument) | T1 with live counter | Forman's *The Problem of Pure Consciousness* (Oxford 1990) is peer-reviewed and Forman's later work appears in mainline journals. Treated as a live academic position in tension with Katz. |
| **Katz 1978 contextualism** | T1 (currently dominant in academic philosophy of mysticism) | Katz's edited volume *Mysticism and Philosophical Analysis* (Oxford 1978) is the watershed and the contextualist position is currently dominant in the SEP entry. |
| **Aldous Huxley's *The Perennial Philosophy* (1945)** | T2 contextually defended | Huxley's book popularized the term but is essentially a curated anthology with introduction. Not peer-reviewed in the academic-monograph sense; it is a cultural-historical document. Treated as T2 (academic-minority — historically influential, methodologically informal). |
| **Traditionalist School — Guénon, Coomaraswamy, Schuon, Lings, Burckhardt** | T3 (alternative-school) | The Traditionalist School is a coherent intellectual movement with its own publications (*Studies in Comparative Religion*) and adherents (Seyyed Hossein Nasr as the academic respectable face). Mark Sedgwick's *Against the Modern World* (Oxford 2004) is the peer-reviewed history of the movement. The school's claims (a primordial *sophia perennis* underlying all traditions, accessed via initiatic transmission) are methodologically unfalsifiable and not engaged on equal terms in mainline academic philosophy of religion. **T3 means: documented as alternative-school; engaged as a tradition-of-claim in its own right; not treated as currently-mainstream peer-reviewed scholarship.** Per CODEX v1.1 §III, every Traditionalist-School edge ships with `source: <traditionalist work>` + `source-tier: T3` + `notes: <claim — Traditionalist-School position; mainstream academic philosophy of mysticism treats this as a methodological-school distinct from peer-reviewed analytic / phenomenological philosophy of mysticism. See Sedgwick 2004>`. |
| **Julius Evola's "Tradition" school** — *Revolt Against the Modern World*, *Men Among the Ruins* | T5 (disclaimer-required, political-risk-flag mandatory) | Evola was an Italian fascist whose work is foundational for European post-war neo-fascism (Goodrick-Clarke 2002 *Black Sun*, Hansen 2002 *Evola and the Conservative Revolution*). His "Traditionalism" sells itself as comparative mysticism but is explicitly anti-democratic + ethno-essentialist + politically apocalyptic. Already flagged in the politics-lens spec. The philosophy-lens treatment: Evola gets a node ONLY for completeness of intellectual-historical mapping, with mandatory T5 disclaimer + political-risk-flag + paired-citation to Goodrick-Clarke 2002, and is wired ONLY via `polemic-against` / `polemic-inversion` edges. Per CODEX v1.1, T5 nodes render OFF by default. |
| **Schuon's racialist drift** (post-1981 "differential cosmology") | T5 in the racialist-drift dimension, T3 in the perennialist-philosophical dimension | Frithjof Schuon's later "essential races" speculation crosses into racial-essentialism per Sedgwick 2004. The disclaimer must be present where the racial-essentialist claims appear; the broader perennialist philosophy remains T3. Two-zone disclosure: the philosophy-lens treats Schuon's perennialism as T3 but flags the racialist-drift sub-claim as T5 per Sedgwick. |
| **Psychedelic perennialism (Huxley→Leary→Watts→Pollan)** | T2 contextually (Huxley 1954 *Doors of Perception* + Pollan 2018 *How to Change Your Mind* — both serious-press); T3 in popular reception (Leary's politicization, the McKenna brothers); reception traceable through MAPS / Johns Hopkins psychedelic research peer-reviewed studies | Two-zone again: the *empirical-research* side (Griffiths et al. at Johns Hopkins; the psilocybin-and-mystical-experience literature; the Mystical Experience Questionnaire / MEQ) is T1 in the empirical-psychology literature. The *philosophical perennialism* tied to it (Huxley, Pollan, the "everything is one" gloss) is T2. The Leary-McKenna popularization is T3. The lens documents all three layers with explicit tier-discrimination. |

**The discipline rule:** every perennialism / Traditionalism / psychedelic-perennialism node carries its tier explicitly in the `source-tier:` field, with the relevant academic-history citation (Sedgwick 2004; Goodrick-Clarke 2002; Hanegraaff 2012 *Esotericism and the Academy*) named in `notes:`. The lens documents the entire perennialism debate — Stace vs Katz vs Forman vs Huxley vs Traditionalist-School vs Evola vs psychedelic-perennialism — as a **layered cluster with tier-discrimination**, never as a single undifferentiated "perennialism" tag.

The vault posture: investigation, not advocacy. The lens reports what scholarship reports — not what the agent thinks about perennialism. **Rule PHIL-3 is the discipline that earns the lens its T1 academic credibility.**

---

## 5. Cross-lens wiring — new fields on existing nodes

The lens REQUIRES five new YAML fields on existing-lens nodes. None overwrite existing data; all are optional-additive.

### 5.1 On `03_deities/` — new field `philosophical-treatments[]`

Pointer to philosophy-problem-nodes or philosophy-work-nodes that engage the deity philosophically. Each entry: `slug` + `relation:` (one of: `existence-argued-for`, `existence-argued-against`, `phenomenologically-treated`, `comparatively-analyzed`, `apophatically-treated`).

Examples:
- `yahweh-elohim` → `philosophical-treatments: [{slug: existence-of-god-cosmological-argument, relation: existence-argued-for}, {slug: hume-dialogues, relation: existence-argued-against}, {slug: problem-of-evil-evidential, relation: existence-argued-against}, {slug: divine-hiddenness, relation: existence-argued-against}]`
- `brahman` → `philosophical-treatments: [{slug: advaita-vedanta-philosophy, relation: apophatically-treated}, {slug: madhyamaka-philosophy, relation: comparatively-analyzed}, {slug: priest-fifth-corner-of-four, relation: comparatively-analyzed}]`
- `shunyata` (treated as the Buddhist non-self placeholder) → `philosophical-treatments: [{slug: garfield-engaging-buddhism, relation: comparatively-analyzed}, {slug: priest-fifth-corner-of-four, relation: comparatively-analyzed}, {slug: loy-nonduality, relation: comparatively-analyzed}]`

### 5.2 On `04_persons/` — new field `philosophical-school`

Single-valued tag (rarely multi-valued) — the person's primary philosophical school per the 2.5 catalog. Optional. Examples:

- `plotinus` → `philosophical-school: neoplatonism-philosophical`
- `nagarjuna` → `philosophical-school: madhyamaka-philosophy`
- `sankara` → `philosophical-school: advaita-vedanta-philosophy`
- `plantinga-alvin` → `philosophical-school: reformed-epistemology`
- `nishida-kitaro` → `philosophical-school: kyoto-school`
- `whitehead` → `philosophical-school: process-philosophy`
- `eliade` → `philosophical-school: phenomenology-of-religion-school`
- `guenon-rene` → `philosophical-school: traditionalist-perennialism-school` (with `source-tier: T3` on the school node)

Cross-link rule: every person with `philosophical-school:` set appears in that school-node's `key-figures[]`.

### 5.3 On `06_themes/` (→ `06_motifs/`) — new field `philosophical-engagement[]`

Pointer to philosophy-problem-nodes that articulate the motif philosophically. Each entry: `slug` + `articulation:` (a noun-phrase: "logical-form-of", "phenomenological-form-of", "comparative-form-of").

Examples:
- `06_themes/ineffability.md` → `philosophical-engagement: [{slug: religious-language-problem, articulation: logical-form-of}, {slug: ineffability, articulation: phenomenological-form-of}]`
- `06_themes/mystical-union.md` → `philosophical-engagement: [{slug: mystical-experience-perennialism, articulation: phenomenological-form-of}, {slug: mystical-experience-contextualism, articulation: critical-form-of}]`
- `06_themes/divine-hiddenness.md` (motif) → `philosophical-engagement: [{slug: divine-hiddenness, articulation: logical-form-of}]`

This is the bridge that turns recurring cross-tradition motifs into philosophical-method engagement.

### 5.4 On `14_rituals/` + `22_practices/` — new field `phenomenological-pattern`

Single-valued. Points to a philosophy-problem-node or philosophy-method-node that classifies the practice phenomenologically (Otto's *mysterium tremendum*, Eliade's hierophany, van der Leeuw's typology).

Examples:
- `14_rituals/whirling-dervish-sema.md` → `phenomenological-pattern: phenomenology-of-the-holy` (Otto-style numinous)
- `14_rituals/eucharist.md` → `phenomenological-pattern: phenomenology-of-hierophany` (Eliade-style sacred-time)
- `22_practices/vipassana-meditation.md` → `phenomenological-pattern: mystical-experience-contextualism` (Katz's argument that vipassana phenomenology is constructed by Theravada conceptual framework, not bare-bones pure consciousness)

This is a small but high-value field — it lets the Forge layer over rituals/practices a phenomenological-method classification that helps the reader see method-shape across traditions.

### 5.5 On `17_documents/` — optional `philosophy-cross-link` field

Single-valued. For documents that also live in `29_philosophy/works/`, the pointer to the matched 29-work-node. Avoids redundancy:

- `17_documents/hume-dialogues-concerning-natural-religion.md` → `philosophy-cross-link: 29_philosophy/works/hume-dialogues.md`

Most documents won't carry this — only the ones with strong philosophy-of-religion argumentation that we want to treat under the philosophical lens as well.

---

## 6. Forge integration

**The recommendation is NOT a deity wedge.** Philosophy is meta-discipline (a *method* applied to religion) rather than itself a phenomenon-of-religion, so a deity-wedge representation is wrong-shaped. Instead, three integration paths, in increasing order of build effort:

### 6.1 Side-panel widget: "Philosophical engagement"

**Lowest-effort, highest-value.** When a user clicks a deity / theme / ritual node in the Forge view, the side panel gains a new section: **"Philosophical engagement"**, listing the philosophy-problem-nodes and philosophy-thinker-nodes that engage that deity / theme / ritual.

Example: click `yahweh-elohim` → side panel shows existing sections plus:

```
PHILOSOPHICAL ENGAGEMENT
 ► Existence arguments:
   • Cosmological (Aquinas, Leibniz, Craig)  [T1]
   • Ontological (Anselm, Plantinga, Gödel)  [T1]
 ► Critiques:
   • Hume — Dialogues Concerning Natural Religion  [T1]
   • Problem of evil — evidential form  [T1]
   • Divine hiddenness — Schellenberg 1993       [T1]
 ► Phenomenological treatment:
   • Otto — Das Heilige (mysterium tremendum)    [T1]
```

This is the minimum viable Forge integration: the lens contributes new edges + new side-panel section, but no new wedge on the wheel. It mirrors how the politics-lens spec proposes the existing 5-tier toggle apply to politics-lens edges.

### 6.2 New filter chip: "Philosophical methods"

**Medium effort.** Add a Forge filter chip — "Philosophical methods" — that, when enabled, paints over the existing graph a translucent overlay of which philosophical method each tradition is most engaged-by:

| Method | Color (proposed) |
|---|---|
| Analytic philosophy of religion | navy `#2A4A7A` |
| Phenomenology of religion | warm-gold `#C9A35A` |
| Continental philosophy of religion | violet `#7A4A8A` |
| Comparative East-West philosophy | jade `#4A8A6A` |
| Philosophy of mysticism | indigo `#3A3A7A` |
| Process philosophy | sage `#7A9A6A` |
| Hermeneutic philosophy of religion | sienna `#9A6A4A` |
| Traditionalist-perennialism-school (T3) | muted-amber `#A07A4A` — rendered translucent to signal T3 |

This is a soft overlay — not a wedge — that tells the reader at a glance which traditions are most heavily-treated by which philosophical method (e.g., Buddhism: heavy comparative + philosophy-of-mysticism; Christianity: heavy analytic + phenomenology + continental; Hinduism: heavy comparative; Daoism: heavy continental + phenomenology).

### 6.3 (Future, optional) New view mode: "Philosophy lens"

**Highest effort, optional.** A standalone Forge view mode where the canvas re-arranges around the philosophy-lens nodes themselves: thinkers + problems + works as the primary entities, with edges showing engagement-with deities / themes / traditions as outgoing arrows. This is a separate Forge build — not part of the lens-creation batch — and would only be greenlit after the lens has 80+ nodes and proves itself in side-panel usage.

**Recommendation: ship 6.1 in the lens-creation batch; ship 6.2 in the immediate follow-up batch; defer 6.3 indefinitely.**

### 6.4 Tier-toggle interaction

The existing 5-tier source-toggle (T1–T5) applies in the philosophy lens. T3 nodes (Traditionalist-School per §4 PHIL-3) render in muted-amber by default and become full-saturation when T3 is toggled on. T5 nodes (Evola; Schuon's racialist-drift dimension) stay OFF by default and render with mandatory political-risk caveat tooltip when toggled on.

---

## 7. T5 risks to handle (consolidated from §4)

This section consolidates the T5 + political-risk-flag entries specifically:

| Slug | Tier | Risk-flag | Treatment |
|---|---|---|---|
| `evola-traditionalist-philosophy-of-religion` | T5 | YES (mandatory) | Wire ONLY via `polemic-against` / `polemic-inversion` edges. Cite Goodrick-Clarke 2002 *Black Sun* (NYU) + Hansen 2002 + Sedgwick 2004. Already flagged in `AUDIT/politics-lens-spec-2026-05-23.md` §3.4 — atomic with politics-lens entry. Render OFF by default per CODEX v1.1. |
| `schuon-perennialism-philosophical` (the perennialism-broad position) | T3 | NO | Mainline Traditionalist-School representative; engaged on T3 terms with Sedgwick 2004 as the academic-history anchor. |
| `schuon-racialist-drift` (sub-node for the post-1981 essential-races material) | T5 | YES (mandatory) | Separate sub-node from the philosophical-perennialism node. The split lets the reader engage Schuon's philosophical position at T3 while seeing the racialist-drift discipline at T5. Cite Sedgwick 2004 + Hanegraaff 2012 *Esotericism and the Academy* (Cambridge). |
| `psychedelic-perennialism-leary-mckenna` | T3 | NO (no political-violence-risk in the Barkun sense; methodological alternative-school flag) | Engaged on T3 terms. The empirical-psilocybin research side (Griffiths et al.) lives at T1 in `22_practices/` or `24_pharmacology/` per the existing pharmacology lens; the philosophical perennialism gloss in popular reception is what lives here at T3. |
| `huxley-aldous-perennial-philosophy` | T2 | NO | The 1945 *Perennial Philosophy* book + the 1954 *Doors of Perception* are serious-press works but methodologically informal. T2 is the contextual home — popular-influence + intellectual-history significance, not peer-reviewed analytic philosophy. |
| `guenon-rene-philosophy` | T3 | NO | Traditionalist-School founder; engaged on T3 alternative-school terms per Sedgwick 2004. |
| `coomaraswamy-philosophy` | T3 (mainstream-academic-respectable face of Traditionalism) + T1 in his art-history work | NO | Cross-disciplinary: T1 for art-history (he was curator at MFA Boston); T3 for the Traditionalist-philosophical work. |

The lens's T5 footprint is small (essentially Evola + Schuon-racialist-drift). The T3 footprint is the Traditionalist-School cluster. Both are handled per CODEX v1.1 — always-collect-never-discard, render-OFF-by-default for T5, full disclaimer-machine treatment.

---

## 8. Build-script + viewer touchpoints

| File | Change |
|---|---|
| `build_data.py` | Add `philosophy-method`, `philosophy-problem`, `philosophy-thinker`, `philosophy-work`, `philosophy-school` to `NODE_TYPE_MAP`; each routes to `29_philosophy/<sub-folder>/` |
| `build_data.py` | Add new field handlers: `philosophical-treatments[]` (on deities) + `philosophical-school` (on persons) + `philosophical-engagement[]` (on themes/motifs) + `phenomenological-pattern` (on rituals/practices) + `philosophy-cross-link` (on documents). Edge-bucket routing per PROTOCOL §3.1: most route to Parallel (scholarly-parallel / parallel-motif) unless `relation:` indicates polemic (then Polemic bucket) or doctrinal kinship (then Kinship). |
| `00_meta/CODEX.md` | No change — CODEX v1.1 already accommodates this lens via existing tier system + investigation posture |
| `00_meta/ONTOLOGY.md` | Add row 29 (or wherever after geometry/color resolve) to the lens table; cite this audit + the companion thinkers catalog in the lock rationale |
| `00_meta/PROTOCOL.md` | Add a philosophy-lens section to the bucket-routing table — most new edges route to Parallel (scholarly-parallel for problem-engages-deity; parallel-motif for problem-articulates-theme); cite SEP rule PHIL-2 in the routing notes |
| `00_meta/ONTOLOGY-RATIONALE-2026-05-23-philosophy.md` | New dated rationale doc per the append-only lock procedure |
| `src/js/forge/sidepanel.js` (or wherever side-panel sections are defined) | Add new section "Philosophical engagement" that renders from new edge-types |
| `src/js/views/forge.js` | Add new filter chip "Philosophical methods" with the 8-color overlay per §6.2 |
| `index.html` Legend panel | Add new filter chip + tier-toggle entries for philosophy-lens nodes |
| `00_meta/SUSPECTS.md` (if it tracks lens-creation queue) | Note that philosophy-lens creation depends on geometry + color + politics lenses resolving first if those land first; lens is otherwise independent |

---

## 9. Risk + scope reckoning

Three risks to flag explicitly:

### R-1 — Lens-creep from "this is philosophy-adjacent" → "any abstract claim about religion belongs here"

The lens is NOT a tag for "religious-claim-with-philosophical-vocabulary." It is for **named philosophical problems / methods / thinkers / works / schools per the academic field's own delimitation.** Test: if the candidate node has no Stanford Encyclopedia of Philosophy entry, no peer-reviewed academic-press monograph treatment, and no presence in standard philosophy-of-religion textbooks (Peterson/Hasker/Reichenbach/Basinger *Reason and Religious Belief* — Oxford; Taliaferro/Marty *A Dictionary of Philosophy of Religion* — Continuum; Wainwright ed. *The Oxford Handbook of Philosophy of Religion*), the candidate fails the bar.

### R-2 — Eurocentric coverage drift

The vault's existing philosophy material is European-Abrahamic-heavy (Plato, Aristotle, Augustine, Aquinas, Hume, Kant, Hegel, Heidegger). The philosophy-lens MUST proportionally cover Indian philosophy of religion (Sankara, Ramanuja, Madhva as philosophers; Nagarjuna, Candrakirti, Dharmakirti; Mohanty, Matilal, Ganeri, Halbfass), Buddhist philosophy of religion (Madhyamaka, Yogacara; Garfield, Siderits, Priest, Tzohar), East Asian philosophy of religion (Kyoto School — Nishida, Tanabe, Nishitani; Confucian philosophy of religion — Tu Weiming, Mou Zongsan), and Islamic philosophy of religion (Ibn Sina, Ibn Rushd, al-Ghazali, al-Farabi; Suhrawardi; Mulla Sadra; modern Iranian + Indo-Pakistani philosophy of religion).

The companion thinkers catalog (`AUDIT/philosophy-key-figures-2026-05-23.md`) makes this proportional weighting explicit — roughly one-third Western analytic, one-third comparative / Asian, one-third phenomenological-continental. If a batch ships heavy on one side, the next batch corrects.

### R-3 — Drift into the agent's preferred philosophy

The discipline rule borrowed from politics-lens R-3: every wire is a citation, every claim traces to a peer-reviewed source, every live debate gets paired-batch treatment per PHIL-1. The lens's job is documenting what philosophy of religion as a field says — not what the agent finds compelling. Self-check: *would I write this same node if my philosophical sympathies were inverted?* If yes, the node is in the right place. If the node's `notes:` field expresses a philosophical evaluation the agent endorses but no peer-reviewed source supports, the node is in the wrong place.

CODEX v1.1's posture statement ("the vault is an investigation tool, not an advocacy site") applies here as the discipline rule. The Stace-vs-Katz debate is **live** in the SEP — both positions get T1 nodes, both get full paired-batch treatment.

---

## 10. Action checklist — John's greenlight / veto

For each, John picks: **GREEN** (proceed) / **AMBER** (modify per note) / **RED** (don't do this).

| # | Decision | John's call |
|---|---|---|
| 1 | Create the philosophy lens at slot 29 (or wherever after geometry/color/politics resolve) | ☐ |
| 2 | Five-sub-folder structure (`methods/`, `problems/`, `thinkers/`, `works/`, `schools/`) per §2 | ☐ |
| 3 | Distinct node sub-types per §2 (`philosophy-method`, `philosophy-problem`, `philosophy-thinker`, `philosophy-work`, `philosophy-school`) | ☐ |
| 4 | First-batch catalog of ~50–70 nodes covering all five sub-types proportionally per §2 + §9 R-2 | ☐ |
| 5 | Boundary-discipline rule per §3 (methodological-commitment criterion: faith-internal → 21; argument-from-public-premises → 29) | ☐ |
| 6 | Split-treatment for straddling figures per §3.2 (Augustine / Aquinas / Maimonides / Eckhart / Spinoza / Pascal / Kant / Hegel / Schleiermacher / Kierkegaard / Tillich / Buber / Heschel / Whitehead — each gets a 21 + 29 node pair where applicable, suffix-disambiguated) | ☐ |
| 7 | Cross-lens new fields per §5: `philosophical-treatments[]` on deities + `philosophical-school` on persons + `philosophical-engagement[]` on themes/motifs + `phenomenological-pattern` on rituals/practices + `philosophy-cross-link` on documents | ☐ |
| 8 | Rule PHIL-1 symmetric pairing enforced (every live academic debate ships both sides in same batch) | ☐ |
| 9 | Rule PHIL-2 SEP-as-T1-anchor enforced (every node's `refs:` cites the SEP entry first where one exists) | ☐ |
| 10 | Rule PHIL-3 perennialism-tier-discrimination per §4 (Stace/Forman T1 with Katz counter; Huxley T2; Traditionalist-School T3 per Sedgwick 2004; Evola + Schuon-racialist-drift T5 with mandatory political-risk-flag; Schuon-perennialism-broad T3 separately) | ☐ |
| 11 | Forge integration Path 6.1 (side-panel "Philosophical engagement" section) shipped in lens-creation batch | ☐ |
| 12 | Forge integration Path 6.2 (filter chip "Philosophical methods" with 8-color overlay) shipped in immediate follow-up batch | ☐ |
| 13 | Build-script + ONTOLOGY.md + PROTOCOL.md + new dated rationale doc per §8 | ☐ |
| 14 | Companion doc `AUDIT/philosophy-key-figures-2026-05-23.md` for the ~40–60 thinkers (filed alongside this spec; greenlight required before any node creation) | ☐ |

---

## 11. References (peer-reviewed anchor list)

The philosophy-of-religion canon used to construct this lens. Per Rule PHIL-2, SEP entries are listed first as the gold-standard T1 anchor.

**Stanford Encyclopedia of Philosophy (gold-standard T1):**
- Taliaferro, Charles. "Philosophy of Religion." *SEP* (most recently substantively revised 2023).
- Reichenbach, Bruce. "Cosmological Argument." *SEP*.
- Oppy, Graham. "Ontological Arguments." *SEP*.
- Ratzsch, Del; Koperski, Jeffrey. "Teleological Arguments for God's Existence." *SEP*.
- Tooley, Michael. "The Problem of Evil." *SEP*.
- Howard-Snyder, Daniel; Green, Adam. "Hiddenness of God." *SEP*.
- Scott, Michael. "Religious Language." *SEP*.
- Forrest, Peter. "Religious Epistemology." *SEP*.
- Webb, Mark. "Religious Experience." *SEP*.
- Gellman, Jerome. "Mysticism." *SEP*.
- Smith, Jonathan Z.; later authors. "Phenomenology of Religion" (relevant SEP entries on phenomenology + Eliade scholarship).
- Westphal, Merold. "Continental Philosophy of Religion." *SEP*.
- Wong, David. "Comparative Philosophy: Chinese and Western." *SEP*.
- Quinn, Philip; Meeker, Kevin. "Pluralism in Philosophy of Religion." *SEP*.
- Sudduth, Michael. "Reformed Epistemology." *SEP*.
- Viney, Donald. "Process Theism." *SEP*.

**Foundational + survey monographs:**
- Wainwright, William J. (ed.). 2005. *The Oxford Handbook of Philosophy of Religion*. Oxford UP.
- Taliaferro, Charles; Draper, Paul; Quinn, Philip L. (eds.). 2010. *A Companion to Philosophy of Religion* (2nd ed.). Wiley-Blackwell.
- Peterson, Michael; Hasker, William; Reichenbach, Bruce; Basinger, David. 2013. *Reason and Religious Belief* (5th ed.). Oxford UP.
- Hick, John. 1989. *An Interpretation of Religion: Human Responses to the Transcendent*. Yale UP.
- Plantinga, Alvin. 2000. *Warranted Christian Belief*. Oxford UP.
- Swinburne, Richard. 2004. *The Existence of God* (2nd ed.). Oxford UP.
- Oppy, Graham. 2006. *Arguing about Gods*. Cambridge UP.
- Schellenberg, J.L. 1993. *Divine Hiddenness and Human Reason*. Cornell UP.
- van Inwagen, Peter. 2006. *The Problem of Evil*. Oxford UP.

**Phenomenology of religion:**
- Otto, Rudolf. 1917 [1923 Eng.]. *Das Heilige* / *The Idea of the Holy*. Oxford UP.
- van der Leeuw, Gerardus. 1933 [1938]. *Phänomenologie der Religion* / *Religion in Essence and Manifestation*. Princeton UP.
- Eliade, Mircea. 1957 [1959]. *Das Heilige und das Profane* / *The Sacred and the Profane*. Harper.
- Eliade, Mircea. 1958. *Patterns in Comparative Religion*. Sheed and Ward.
- Smart, Ninian. 1969. *The Religious Experience of Mankind*. Scribner.
- Wasserstrom, Steven M. 1999. *Religion after Religion: Gershom Scholem, Mircea Eliade, and Henry Corbin at Eranos*. Princeton UP. (Critical-reception counter to Eliade per PHIL-1.)
- McCutcheon, Russell. 1997. *Manufacturing Religion: The Discourse on Sui Generis Religion and the Politics of Nostalgia*. Oxford UP.

**Philosophy of mysticism:**
- Stace, W.T. 1960. *Mysticism and Philosophy*. Macmillan.
- Katz, Steven T. (ed.). 1978. *Mysticism and Philosophical Analysis*. Oxford UP.
- Forman, Robert K.C. (ed.). 1990. *The Problem of Pure Consciousness: Mysticism and Philosophy*. Oxford UP.
- Proudfoot, Wayne. 1985. *Religious Experience*. California UP.
- Alston, William P. 1991. *Perceiving God: The Epistemology of Religious Experience*. Cornell UP.
- Jones, Richard H. 2016. *Philosophy of Mysticism*. SUNY Press.
- McGinn, Bernard. 1991– (multi-volume). *The Presence of God: A History of Western Christian Mysticism*. Crossroad. (Multi-volume; vols 1–7 published through 2017.)

**Comparative East-West philosophy:**
- Halbfass, Wilhelm. 1988. *India and Europe: An Essay in Understanding*. SUNY Press.
- Mohanty, J.N. 1992. *Reason and Tradition in Indian Thought*. Oxford UP.
- Matilal, B.K. 1986. *Perception: An Essay on Classical Indian Theories of Knowledge*. Oxford UP.
- Loy, David. 1988. *Nonduality: A Study in Comparative Philosophy*. Yale UP.
- Loy, David. 1996. *Lack and Transcendence*. Humanities Press.
- Siderits, Mark. 2003. *Personal Identity and Buddhist Philosophy*. Ashgate.
- Garfield, Jay. 2015. *Engaging Buddhism: Why It Matters to Philosophy*. Oxford UP.
- Ganeri, Jonardon. 2007. *The Concealed Art of the Soul*. Oxford UP.
- Ganeri, Jonardon. 2017. *Attention, Not Self*. Oxford UP.
- Priest, Graham. 2018. *The Fifth Corner of Four: An Essay on Buddhist Metaphysics and the Catuṣkoṭi*. Oxford UP.
- Tzohar, Roy. 2018. *A Yogācāra Buddhist Theory of Metaphor*. Oxford UP.
- Larson, Gerald James; Deutsch, Eliot (eds.). 1988. *Interpreting Across Boundaries: New Essays in Comparative Philosophy*. Princeton UP.

**Continental philosophy of religion:**
- Ricoeur, Paul. 1969 [1974]. *Le conflit des interprétations* / *The Conflict of Interpretations*. Northwestern UP.
- Gadamer, Hans-Georg. 1960 [1975]. *Wahrheit und Methode* / *Truth and Method*. Sheed and Ward.
- Taylor, Charles. 2007. *A Secular Age*. Harvard / Belknap.
- Gauchet, Marcel. 1985 [1997]. *Le désenchantement du monde* / *The Disenchantment of the World*. Princeton UP.
- Marion, Jean-Luc. 1991. *God Without Being*. Chicago UP.
- Caputo, John D. 1997. *The Prayers and Tears of Jacques Derrida*. Indiana UP.
- Vattimo, Gianni. 1996. *Credere di credere* / *Belief*. Stanford UP.

**Process philosophy:**
- Whitehead, A.N. 1929. *Process and Reality*. Macmillan.
- Hartshorne, Charles. 1948. *The Divine Relativity*. Yale UP.
- Cobb, John B. Jr.; Griffin, David Ray. 1976. *Process Theology: An Introductory Exposition*. Westminster.

**Traditionalist-perennialism — academic-history (required for tier-discrimination per PHIL-3):**
- Sedgwick, Mark. 2004. *Against the Modern World: Traditionalism and the Secret Intellectual History of the Twentieth Century*. Oxford UP.
- Hanegraaff, Wouter J. 2012. *Esotericism and the Academy: Rejected Knowledge in Western Culture*. Cambridge UP.
- Goodrick-Clarke, Nicholas. 2002. *Black Sun: Aryan Cults, Esoteric Nazism, and the Politics of Identity*. NYU Press. (Evola + racial-essentialist drift in Traditionalism.)
- Hansen, H.T. 2002. "Julius Evola's Political Endeavors." Introduction to Evola, *Men Among the Ruins*. Inner Traditions.

**Psychedelic-perennialism (T1 empirical / T2 Huxley / T3 popular):**
- Huxley, Aldous. 1945. *The Perennial Philosophy*. Harper.
- Huxley, Aldous. 1954. *The Doors of Perception*. Harper.
- Griffiths, R.R.; Richards, W.A.; et al. 2006. "Psilocybin can occasion mystical-type experiences having substantial and sustained personal meaning and spiritual significance." *Psychopharmacology* 187.3. (T1 empirical research.)
- Pollan, Michael. 2018. *How to Change Your Mind*. Penguin Press. (T2 popular-scientific synthesis.)

---

*End of spec. Filed alongside `AUDIT/philosophy-key-figures-2026-05-23.md` (companion thinkers catalog with ~40–60 figures, full per-figure citations, tier assignments, and cross-lens connections). Both await John's greenlight before any node creation.*
