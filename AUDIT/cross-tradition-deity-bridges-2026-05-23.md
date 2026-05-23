# Cross-tradition deity-bridge audit (2026-05-23)

**Goblin:** read-only scholarship audit
**Scope:** `~/Desktop/Codex Atlas/03_deities/` — 676 `.md` files
**Output:** punch list of missing/broken cross-tradition links by category
**Constraint:** READ-ONLY on deity files. No edits made.

---

## Headline finding — the framing premise is partly wrong

The task brief stated: **"Christianity has no node for God the Father — only Jesus, Holy Spirit, Trinity, Satan."**

This is **incorrect at the file level**. `03_deities/god-the-father-christian.md` exists, is well-written, links to `[[yahweh]]` and `[[el-elohim-hebrew]]` via `syncretic-edges`, and is referenced **29 times in `data.js`**. Christianity's wedge does contain its central deity.

**What may be true** is that the wheel-visualization grouping or the family-rendering may not be foregrounding it — but at the data layer it is present and wired. If the perceived gap is visual (the deity isn't showing in the Christianity wedge), that is a **wheel-pipeline issue, not a missing-node issue**. Worth confirming before any new-node creation work begins on the Christianity side.

---

## Summary

| Metric | Count |
|---|---|
| Deity files surveyed | 676 |
| Files with `equivalents: []` (empty) | 151 |
| Files **missing** the `equivalents:` field entirely | 130 |
| Files with `syncretic-edges: []` (empty) | 41 |
| Files **missing** `syncretic-edges:` field entirely | 46 |
| Files fully isolated (both empty) | 28 |
| TIER-1 gaps identified | 6 |
| TIER-2 gaps identified | 11 |
| TIER-3 gaps identified | 6 |
| **Structural bugs (broken wikilinks, dupes, self-loops)** | **7** |
| Probable new nodes needed | ~5 (most cases want existing-node links, not new nodes) |

**The dominant pattern is not missing nodes. It is missing edges between nodes that already exist on both sides** — asymmetric links, raw-string targets that should be `[[wikilinks]]`, and empty `equivalents:` lists on top-tier deities.

---

## STRUCTURAL BUGS — fix these first (highest leverage, no scholarship debate)

These are not scholarship judgments. They are clear-cut wiring errors found by mechanical inspection.

### S-1. Apollo self-loop
- File: `03_deities/apollo.md`
- Bug: `equivalents: ["[[apollo]]"]` — Apollo equals Apollo.
- Should be: `equivalents: ["[[sol-invictus]]", "[[helios]] (late syncretic)", "[[horus]] (Herodotus)", "[[murugan]] (scholarly-parallel)", "[[belenos]]"]` — at minimum.
- Also: `target: "horus-egyptian"` in `syncretic-edges` references a non-existent id; the actual file is `horus.md` (id `horus`).

### S-2. Holy Spirit duplicate-node
- Files: `03_deities/holy-spirit.md` (id `holy-spirit`) AND `03_deities/holy-spirit-christian.md` (id `holy-spirit-christian`).
- Two separate Christian Holy-Spirit nodes with different content and different syncretic-edges sets. Both have empty `equivalents`.
- Resolution required: merge into one canonical node (probably `holy-spirit-christian` to match the `god-the-father-christian` / `jesus-christ-deity` naming convention), or formally split with distinct roles (e.g. Trinitarian vs Hebrew-Bible *ruach*). The current state looks accidental.

### S-3. Tammuz/Dumuzi duplicate-node
- Files: `03_deities/dumuzi-tammuz.md` (57 lines) AND `03_deities/tammuz-dumuzi.md` (25 lines).
- Same deity, two ids. The longer file appears canonical. The other should be deleted or made an alias-redirect.
- Downstream: `attis.md` already links to `[[dumuzi-tammuz]]`. Confirm all references use that id.

### S-4. Heracles/Hercules — verify whether intentional split
- Files: `heracles.md` (id `heracles`, tradition Greek + Phoenician syncretism), `hercules.md` (id `hercules`).
- `heracles.md` lists `equivalents: ["[[hercules]]", ...]` so the split appears intentional (Greek hero-god vs Roman Hercules cult). **Not a bug — flagging for double-check** since the same pattern is treated as a duplicate elsewhere.

### S-5. Raw-string `target:` values that should be wikilinks (~15+ occurrences across Norse / Roman / Greek files)
Common pattern: edge target written as descriptive prose, not a wikilink. The graph cannot follow these.

Confirmed instances:
- `odin.md` → `target: "Mercury / Hermes (Roman interpretatio germanica)"` — should be `[[mercury-roman]]` (and a parallel link from `mercury-roman.md`).
- `thor.md` → `target: "Jupiter / Zeus (Roman interpretatio germanica — Thursday / Thōrsdagr = Jovis dies)"` — should be `[[jupiter]]`, `[[zeus]]`.
- `tyr.md` → `target: "Mars (Roman interpretatio germanica — Tuesday / Tīwesdæg = Martis dies)"` — should be `[[mars-roman]]`. AND `target: "Zeus / Jupiter / Dyaus Pita (cognate Indo-European sky-god)"` — should be three wikilinks.
- `freyja.md` → `target: "Venus / Aphrodite (Roman interpretatio — Friday / Freyjudagr = Veneris dies)"` — should be `[[venus-roman]]`, `[[aphrodite-greek]]`.
- `frigg.md` → `target: "Venus (Friday calque)"` — should be `[[venus-roman]]`.
- `pan-greek.md` → `equivalents: ["Faunus (Roman)", "Banebdjedet / Mendes-ram (Egyptian — per Herodotus 2.46)"]` — should be `[[faunus-roman]]` and `[[banebdjedet]]` (if exists; otherwise create or drop).
- `fortuna.md` → `equivalents: ["Tyche (Greek)", ...]` — should be `[[tyche-greek]]`.
- `hades.md` → `"Dis Pater (Roman chthonic equivalent — no node yet)"` — string-marker; node should be created or the comment removed.
- `aurora-roman.md` → `"Usha (Avestan, cognate)"` and `"Eostre (Proto-Germanic, reconstructed)"` — no nodes; either create stubs or accept the string-only state.
- `nyx-primordial.md` → `equivalents: ["Nox (Roman)"]` — string only; no `nox.md`.
- `uranus-greek.md` → `"Caelus (Roman sky-personification; no node yet)"`.
- `gaia.md` → `"Tellus / Terra (Roman earth-mother — no node yet)"`.
- `el-canaanite.md` → `equivalents: ["el-elohim-hebrew (to be created in Phase 2)"]` — stale stub-marker; `el-elohim-hebrew.md` EXISTS now. Update to `[[el-elohim-hebrew]]`.
- `indra.md` syncretic-edges: `target: "zeus"`, `target: "verethraghna-zoroastrian"`, `target: "asura-deva-inversion"` — bare ids, not bracketed. Inconsistent with rest of corpus.
- `persephone-greek.md` → `equivalents: ["proserpina-roman"]` — bare id, no brackets, no actual `proserpina-roman.md` file.

### S-6. Horus has wired `syncretic-edges` but empty `equivalents: []`
- `horus.md` has `syncretic-edges` to `[[ra]]` (Ra-Horakhty composite) but `equivalents: []`.
- Inconsistency with the rest of the corpus where major cross-tradition identifications (e.g. Apollo from Herodotus 2.144) belong in `equivalents`.

### S-7. Asymmetric back-links — Shinto cluster links out, Norse/Slavic clusters do not link back
- `raijin.md` lists `[[thor]]`, `[[indra]]`, `[[zeus]]`, `[[perun]]`, `[[shango]]` as equivalents.
- But `thor.md` has no `equivalents:` field; `perun.md` has no `equivalents:` field; `indra.md` has empty `equivalents: []`; `shango.md` has no `equivalents:` field.
- Same pattern for `susanoo.md` ↔ `marduk.md`, `baal-hadad.md`, `indra.md`, `teshub` (if exists). The Japanese side is the most-linked thunder-cluster anchor; the other clusters are receivers without back-links.

---

## TIER-1 — dogmatic / textually explicit gaps

(theological-identity claims made by the traditions themselves in core texts; not scholarly hypothesis)

### T1-1. Christianity: God the Father ↔ YHWH
- **STATUS: ALREADY LINKED.** `god-the-father-christian.md` already lists `syncretic-edges` to `[[yahweh]]` with type `ancient-identification`. Nothing missing here.
- Listed only because the task brief flagged it as the trigger case.

### T1-2. Hindu Sarasvatī ↔ Japanese Benzaiten — no `benzaiten` node
- Source: `saraswati.md` text body explicitly says "Through Buddhist transmission she became Benzaiten in Japanese tradition." But there is **no `benzaiten.md` node** and no `target: [[benzaiten]]` link.
- Counterpart: Vedic → Buddhist → Japanese (Shichifukujin) transmission chain. Benzaiten is one of the Seven Lucky Gods of Japan, central enough to warrant her own node.
- Edge type: `direct-borrowing` (Buddhist tantric transmission documented in the *Konkōmyō-saishō-ō-kyō* / Suvarṇaprabhāsa Sūtra).
- Source: Ludvik, C. (2007). *Sarasvatī: Riverine Goddess of Knowledge*. Brill. Catherine Ludvik traces the explicit Sarasvatī → Benzaiten transmission via the Suvarṇaprabhāsa Sūtra.
- Priority: TIER-1
- Recommendation: **create `benzaiten.md`**; link `equivalents: ["[[saraswati]]"]` and add reciprocal link in `saraswati.md`.

### T1-3. Vedic Indra ↔ Buddhist Śakra / Japanese Taishakuten — no `sakra` / `taishakuten` node
- Source: `indra.md` text body explicitly says "in the Buddhist and Jain texts he becomes Śakra, a respectful guardian deity but no longer supreme." But no `sakra` node exists and no edge points to it.
- Counterpart: Vedic Indra → Buddhist Śakra (देवानामिन्द्र / Devānām Indra) → Chinese 帝释天 Dìshìtiān → Japanese Taishakuten 帝釈天. Documented across canonical Pāli, Mahāyāna, and Esoteric Buddhist texts.
- Edge type: `direct-borrowing` (canonical retention of the Vedic name in Buddhist scripture, with role demoted).
- Source: Sumi (2014), *Indra in Buddhist Texts*; DeCaroli, R. (2004). *Haunting the Buddha: Indian Popular Religions and the Formation of Buddhism*. Oxford UP. Boucher (2008) *Bodhisattvas of the Forest*.
- Priority: TIER-1
- Recommendation: **create `sakra-buddhist.md`** with `equivalents: ["[[indra]]"]` and aka ["Taishakuten", "Dìshìtiān", "Devānām Indra"]; add reciprocal link in `indra.md`.

### T1-4. Vedic Yama ↔ Japanese Enma / Chinese Yánluó — no `enma` / `yanluo` node
- Source: `yama-vedic.md` lists rich cross-tradition equivalents (Hades, Osiris, Mictlantecuhtli, Hel, Anubis, Ereshkigal) but **omits the Buddhist East-Asian transmission**, which is the cleanest case (direct phonetic descent: Yama → Yán-Mó → Enma-Ō).
- Edge type: `direct-borrowing` (Sanskrit Yama → Chinese 閻摩 Yánmó → Japanese 閻魔 Enma).
- Source: Teiser, S. (1988). *The Ghost Festival in Medieval China*. Princeton. Glassman, H. (2012). *The Face of Jizō*. Hawaii UP. Both document the Yama → Yánluó / Enma transmission via Chinese Buddhist iconography of the Ten Kings of Hell.
- Priority: TIER-1
- Recommendation: either **create `enma-japanese.md` and `yanluo-chinese.md`**, OR add `[[yamantaka]]`-style "Buddhist transmissions" prose section with proper `equivalents:` extensions in `yama-vedic.md`. Note `yamantaka.md` already exists as the tantric wrathful-deity branch; East-Asian Enma is a different branch.

### T1-5. PIE Sky-Father cluster: Týr has no reciprocal link to Zeus/Jupiter/Dyaus
- `zeus.md` → `equivalents: ["[[jupiter]]", "[[amun]]", "[[amun-ra]]"]` — does NOT include `[[tyr]]` or `[[dyaus-pita]]`.
- `jupiter.md` → `equivalents: ["[[zeus]]", "[[dyaus-pita]]"]` — does NOT include `[[tyr]]`.
- `dyaus-pita.md` → `equivalents: ["[[zeus]]", "[[jupiter]]"]` — does NOT include `[[tyr]]`.
- `tyr.md` has **no `equivalents:` field at all**, and its syncretic-edges use raw-string targets (see S-5).
- Edge type: `cognate` (Proto-Indo-European *Dyḗus ph₂tḗr → Sanskrit Dyaus Pita, Greek Zeus Pater, Latin Iuppiter, Proto-Germanic *Tīwaz → Old Norse Týr / Old English Tīw).
- Source: West, M.L. (2007). *Indo-European Poetry and Myth*. OUP. ch. 4. Watkins (1995). The etymology is uncontested.
- Priority: TIER-1 (etymology is mechanically derivable; this is the textbook PIE cognate set).
- Recommendation: add bidirectional `equivalents` links across all four; type `cognate-PIE-sky-father`.

### T1-6. Tetragrammaton / Aramaic & Mandaean → Allah etymological chain
- `allah.md` lists `equivalents: ["[[el-canaanite]]", "[[el-elohim-hebrew]]", "Elaha (Aramaic)", "Elah (Aramaic biblical)"]`.
- Aramaic "Elaha" / "Elah" / "Alāhā" should resolve to a node, or be acknowledged as a stub-string. The Mandaean *Hayyi Rabbi* (high god) `hayyi-rabbi.md` exists and is fully isolated (no `equivalents:` field) despite being the West-Aramaic-Gnostic Abrahamic counterpart.
- Edge type: `same-as` (Aramaic-speaking Christian, Jewish, Mandaean traditions all use the same theonym `Alāhā / Elaha / Allāh` for the high god in their liturgies).
- Source: Lupieri, E. (2001). *The Mandaeans: The Last Gnostics*. Eerdmans. Drower, E.S. (1937). *The Mandaeans of Iraq and Iran*. Oxford.
- Priority: TIER-1 (the same Aramaic word "Alāhā" appears in the Peshitta, Jewish-Aramaic liturgy, and Mandaean *Ginza Rabba*).
- Recommendation: add `equivalents` to `hayyi-rabbi.md` pointing at `[[allah]]`, `[[el-elohim-hebrew]]`, `[[yahweh]]` — with `polemic-against` or `gnostic-inversion` nuance per Mandaean theology.

---

## TIER-2 — scholarly-consensus gaps

(mainstream comparative-religion scholarship treats these as documented, but not as in-tradition dogma)

### T2-1. Hermes ↔ Mercury — symmetric link missing
- `hermes-greek.md` has **no `equivalents:` field at all**.
- `mercury-roman.md` lists `[[hermes-greek]]` correctly.
- The Greek-side gap is mechanical, not contested.
- Edge type: `same-as` (Roman interpretatio graeca, attested from Plautus onward).
- Source: Versnel, H.S. (2011). *Coping with the Gods*. Brill. Standard reference work.
- Priority: TIER-2

### T2-2. Marduk — no cross-tradition equivalents at all
- `marduk.md` → `equivalents: []`, syncretic-edges only points to `yaldabaoth` (polemic-inverse).
- Missing: `[[bel-canaanite]]` (if exists) or at least the **Marduk = Bēl** identification (Hellenistic Bel of Berossos / Apollodorus); the storm-warrior parallel to `[[baal-hadad]]`, `[[zeus]]` (chaoskampf cluster — the file's own body text says "Babylonian: Marduk vs. Tiamat" as part of the 5-tradition chaoskampf convergence).
- Edge types: `cognate` (Marduk-Bēl naming convention in Late Babylonian Hellenistic period); `parallel-motif` (chaoskampf cluster).
- Source: Lambert, W.G. (2013). *Babylonian Creation Myths*. Eisenbrauns. Smith, M.S. (2008). *God in Translation: Deities in Cross-Cultural Discourse*. Mohr Siebeck.
- Priority: TIER-2

### T2-3. Enki/Ea — no equivalents wired
- `enki-ea.md` → `equivalents: []`. Body text discusses Enki as patron of the apkallu wisdom-sages.
- Missing: parallel to `[[thoth]]` (wisdom + scribal patron), `[[hermes-greek]]` (Hellenistic interpretatio — Enki / Ea = Hermes via Berossos), and `[[an-sumerian]]` / `[[anshar-kishar]]` family.
- Edge type: `parallel-motif` + `interpretatio` for Hermes link.
- Source: Foster, B.R. (2005). *Before the Muses* 3rd ed. CDL Press. Lambert (1957) "Ancestors, Authors, and Canonicity" *JCS*.
- Priority: TIER-2

### T2-4. Tiamat — no equivalents
- `tiamat.md` → `equivalents: []`. Already linked from `typhon.md`, `aditi.md`. Asymmetric.
- Missing: reciprocal links to `[[typhon]]`, `[[vritra]]`, `[[lotan]]`, `[[apophis]]`, `[[illuyanka]]` — the chaoskampf-serpent cluster.
- Edge type: `parallel-motif` (Watkins 1995 chaoskampf).
- Priority: TIER-2

### T2-5. Vishnu — fully isolated despite massive cross-tradition footprint
- `vishnu.md` → `equivalents: []`, `syncretic-edges: []`. The supreme Vaishnava deity, with 10 avatāra each of which is its own theological problem.
- Missing: link from Vishnu to `[[krishna]]`, `[[rama]]`, `[[narasimha]]` (if exists), `[[buddha]]` (Hindu Buddha-avatara theology), and to broader supreme-deity parallels.
- This is the most striking single-node gap in the corpus.
- Edge type: `same-as` (within-tradition avatāra identifications); `direct-borrowing` (Hindu-Buddhist Buddha-as-Vishnu's-9th-avatāra).
- Source: Bhāgavata Purāṇa; Lipner, J. (2010). *Hindus*. Routledge. Doniger, W. (1976). *The Origins of Evil in Hindu Mythology*. UC Press.
- Priority: TIER-2 (only because the within-Vaiṣṇava avatāra identifications are technically theological-internal rather than cross-tradition; the Buddha-avatara claim *is* cross-tradition and is TIER-1 from the Hindu side).

### T2-6. Shiva — no equivalents (also major gap)
- `shiva.md` → `equivalents: []`. Only `syncretic-edges` to `[[rudra-shiva-early]]` (within-tradition continuous development).
- Missing: `[[mahakala]]` (Shiva's wrathful Buddhist form, already linked from the other side); `[[bhairava]]` (if exists); parallel to `[[dionysus]]` (Shiva-Dionysos comparative thread is canonical comparative-religion territory — Wendy Doniger, Alain Daniélou).
- Edge type: `direct-borrowing` (Mahākāla); `cross-tradition-parallel` (Dionysos).
- Source: Daniélou, A. (1979). *Shiva and Dionysus*. Inner Traditions. Doniger (1981) *Śiva: The Erotic Ascetic*. OUP.
- Priority: TIER-2

### T2-7. Slavic thunder-god Perun ↔ Thor / Indra / Taranis / Zeus
- `perun.md` has **no `equivalents:` field at all**.
- `raijin.md` lists `[[perun]]` as equivalent. `taranis.md` does not list `[[perun]]`. `thor.md` has no `equivalents:` field. `indra.md` is empty.
- Edge type: `cognate-PIE-thunderer` (Proto-Indo-European *Perkʷūnos thunder-and-oak cluster).
- Source: West (2007) ch. 6. Mallory & Adams (2006) *Oxford Introduction to PIE*.
- Priority: TIER-2 (the *Perkʷūnos cognate set is contested in detail but the broader thunder-god parallel is uncontested).

### T2-8. Slavic Veles ↔ Hermes / Hades cross-tradition
- `veles.md` has **no `equivalents:` field at all**. Veles is the chthonic / cattle / underworld / oath god, opposed to Perun.
- Edge type: `parallel-motif` (chthonic-pastoral-trickster — Ivanov & Toporov reconstruction is the standard Slavic comparative work).
- Source: Ivanov, V.V. & Toporov, V.N. (1974). *Slavic Linguistic Modeling Studies in the Field of Antiquities*. (Russian-language standard).
- Priority: TIER-2 (Ivanov-Toporov reconstruction is canonical in Slavic studies but contested in degree).

### T2-9. Norse Vanir (Freyr, Freyja, Njord) → Roman interpretatio gaps
- `freyr.md` → empty syncretic-edges, no equivalents.
- `freyja.md` → equivalents missing; syncretic-edge to "Venus / Aphrodite" is raw string (see S-5).
- `njord.md` → equivalents empty.
- Missing: `[[venus-roman]]`, `[[aphrodite-greek]]` from Freyja side (Friday calque). `[[freyr]] ↔ [[ingvi]]` cluster.
- Edge type: `ancient-identification` (weekday calque).
- Source: Lindow (2001) *Old Norse Mythology*. Simek (1993) *Dictionary of Northern Mythology*.
- Priority: TIER-2

### T2-10. Aphrodite-Venus-Astarte-Ishtar-Inanna chain — asymmetric back-links
- `aphrodite-greek.md` and `venus-roman.md` link to `[[ishtar-akkadian]]` and `[[inanna-sumerian]]`.
- But `ishtar-akkadian.md` → `equivalents: ["[[inanna-sumerian]]"]` only (no link back to Aphrodite/Venus/Astarte).
- `inanna-sumerian.md` → `equivalents: ["[[ishtar-akkadian]]"]` only.
- Source for the chain: West, M.L. (1997). *The East Face of Helicon*. OUP. Standard reference for Near-East → Greek transmission.
- Priority: TIER-2

### T2-11. Mithra-Zoroastrian / Mitra-Vedic / Varuna / Ahura-Mazda — all empty
- `mithra-zoroastrian.md`, `mitra-vedic.md`, `varuna.md`, `ahura-mazda.md` all have `equivalents: []`.
- `mithras-roman.md` correctly lists `[[mithra-zoroastrian]]`, `[[mitra-vedic]]`, `[[sol-invictus]]`.
- The Indo-Iranian Mitra-Varuna pair (Dumézil's "sovereignty pair") and the Mitra→Mithra→Mithras transmission chain is one of the most-studied cases in comparative IE religion.
- Edge type: `cognate` (Indo-Iranian Mitra split into Vedic Mitra + Iranian Mithra at the Indo-Iranian divergence ~-1700).
- Source: Dumézil, G. (1968-73). *Mythe et épopée* (3 vols). Boyce (1975) *History of Zoroastrianism* vol. 1. Beck, R. (2006). *The Religion of the Mithras Cult in the Roman Empire*. OUP.
- Priority: TIER-2

---

## TIER-3 — plausible / contested gaps

(comparative-religion claims with documented scholarship but ongoing debate)

### T3-1. Ushas-Eos-Aurora-Hausos (PIE dawn-goddess)
- `ushas.md` → `equivalents: []`.
- `eos-greek.md` and `aurora-roman.md` both link to `[[ushas]]`. Asymmetric.
- The PIE *Hausos reconstruction is mainstream but the file gap is one-sided.
- Source: West (2007) ch. 6 §6.4.
- Priority: TIER-3 (only because back-link is purely mechanical).

### T3-2. Aten ↔ YHWH (Assmann mnemohistory hypothesis)
- `aten.md` → `equivalents: []`, no syncretic-edges visible in survey.
- `yahweh.md` has a robust link to `[[theme-akhenaten-moses-monotheism-thesis]]`.
- Aten should reciprocally link to this theme + to `[[yahweh]]` as the "Egyptian pole" of the hypothesis. Currently the link is one-way.
- Edge type: `substrate-influence` (Assmann's *mnemohistory* framing).
- Source: Assmann, J. (1997). *Moses the Egyptian*. Harvard.
- Priority: TIER-3 (the hypothesis itself is contested).

### T3-3. Adonis-Tammuz-Attis-Osiris-Baal "dying-and-rising god" cluster
- `adonis.md` has **no `equivalents:` field**, though the file's `sub-tradition` explicitly notes "dying-and-rising deity cluster".
- `attis.md` links to `[[adonis]]`, `[[osiris]]`, `[[dumuzi-tammuz]]`.
- Reciprocal links missing from `adonis.md`.
- Note: the "dying-and-rising god" category itself is now scholarly-contested (Smith 1987 *Dying and Rising Gods*; Mettinger 2001 *The Riddle of Resurrection*) — but the figures are uncontroversially related at the Greco-Phoenician-Mesopotamian transmission level.
- Source: Mettinger (2001).
- Priority: TIER-3

### T3-4. Egyptian primordials (Shu, Tefnut, Nut, Geb) — all fully isolated
- `shu.md`, `tefnut.md`, `nut.md`, `geb.md` all have empty `equivalents:` and empty `syncretic-edges:`.
- Plausible cross-tradition links: Geb ↔ Gaia / Prithvi (earth-male variant); Nut ↔ sky-female cluster; Shu ↔ atmosphere/wind deities.
- These are *less central* than Vishnu / Shiva but still notable gaps in the Egyptian cluster.
- Priority: TIER-3

### T3-5. Sumerian primordials (An, Damkina, Lahmu-Lahamu, Ningikuga, Sarpanit) — fully isolated
- 5+ Sumerian-Mesopotamian deity files isolated.
- Anu is the Sumerian sky-god — should link to PIE sky-father cluster as a non-PIE structural parallel.
- Priority: TIER-3

### T3-6. Heimdall ↔ Gabriel
- `heimdall.md` lists `equivalents: ["[[gabriel-archangel]]"]`.
- `gabriel-archangel.md` does **not** list `[[heimdall]]` back.
- The Heimdall-Gabriel pairing is a fringe-comparative claim (both are watchers at the cosmic threshold with a horn-trumpet) but the asymmetry is mechanical.
- Priority: TIER-3 (the claim itself is fringe).

---

## Cognate clusters that need wiring (summary view)

### PIE Sky-Father cluster
- Dyaus Pita — partial (Zeus + Jupiter; missing Týr)
- Zeus — partial (Jupiter + Amun; missing Týr + Dyaus reciprocal)
- Jupiter — partial (Zeus + Dyaus; missing Týr)
- Týr — **NO `equivalents:` FIELD**; syncretic-edges use raw strings
- **Action:** symmetric cognate-cluster across all four.

### PIE Thunder-God cluster
- Indra — empty
- Thor — no `equivalents:` field
- Zeus — has thunder-aspect but `equivalents` doesn't include Thor or Indra
- Perun — no `equivalents:` field
- Taranis — links to `[[jupiter]], [[thor]], [[indra]]` (best-wired of cluster)
- Marduk — empty (Mesopotamian non-PIE parallel)
- Baal-Hadad — empty (Semitic non-PIE parallel)
- Susanoo (Shinto) — well-linked to most thunder-gods (best-wired in cluster)
- **Action:** Taranis + Susanoo are the existing hubs; everyone else should reciprocate.

### PIE Dawn-Goddess cluster
- Eos, Aurora link to Ushas — Ushas empty back.

### Indo-Iranian Mitra-Varuna sovereignty pair
- Mitra-Vedic empty; Mithra-Zoroastrian empty; Varuna empty.
- Mithras-Roman is the only correctly-wired node in this cluster.

### Aphrodite-Venus-Astarte-Ishtar-Inanna (Near Eastern love-goddess transmission)
- Greek and Roman ends wired; Mesopotamian end (Ishtar, Inanna) doesn't reciprocate.

### East Asian Buddhist transmission of Hindu deities
- Avalokiteśvara → Guanyin: WIRED.
- Tara → Avalokiteśvara: WIRED.
- Amitabha → Amida/Amituofo: documented as aka, no separate nodes (acceptable).
- Kubera → Vaiśravaṇa → Bishamonten: documented as aka (acceptable).
- **Sarasvatī → Benzaiten: NOT WIRED, no Benzaiten node** (TIER-1 gap T1-2).
- **Indra → Śakra → Taishakuten: NOT WIRED, no Śakra node** (TIER-1 gap T1-3).
- **Yama → Yánluó → Enma: NOT WIRED, no Enma/Yánluó node** (TIER-1 gap T1-4).

### Christian Satan / Iblis / Angra Mainyu / Yaldabaoth
- Well-wired throughout. `satan-christian.md` → `[[angra-mainyu-ahriman]]`, `[[lucifer]]`, `[[satanael]]`.
- `iblis-shaytan.md` → `parallel-form` to `[[satan-christian]]` and `[[angra-mainyu-ahriman]]`.
- `angra-mainyu-ahriman.md` → empty `equivalents:` but syncretic-edges presumably present (would need full read to confirm; field-empty itself is a minor gap).

### Yoruba → Diaspora (Vodou / Santería / Candomblé)
- Strongly wired across the board. Eshu → Papa Legba (Saint Peter / Saint Lazarus); Shango → Santa Bárbara; Ogun → Saint Peter / Saint James (Santiago); Yemoja, Oshun, Oya all have explicit Vodou + Catholic correspondences. **Best-wired cluster in the corpus.**

---

## Methodology notes

**How candidate pairs were selected.**
1. Glob-enumerated `03_deities/*.md` (676 files).
2. Mechanically scanned for files where the `equivalents:` field is empty or absent.
3. Mechanically scanned for `syncretic-edges` entries whose `target:` is a raw string rather than a `[[wikilink]]`.
4. Hand-read 40+ canonical-pantheon files (Greek, Roman, Egyptian, Mesopotamian, Hindu, Buddhist, Norse, Slavic, Celtic, Japanese, Mesoamerican, Yoruba, Christian) to spot asymmetric back-links.
5. Cross-checked the task brief's premise about `god-the-father-christian` (found to be incorrect at file level — file exists and is wired).

**What I treated as out-of-scope.**
- Highly speculative Jungian-archetype claims with no documented transmission (e.g. Heimdall ↔ Gabriel was already in the corpus and I flagged it as TIER-3 rather than recommend removal).
- New-node creation for deities the corpus does not currently track (e.g. Polynesian, Australian Aboriginal, North American First Nations clusters beyond what's already present).
- The substantial Christian *saint*-pantheon (Christianized pagan saints: St. Brigid ← Brigid, Saint Sarah ← Kali in Romani tradition, etc.) — `brigid.md` correctly links to `[[hestia]]` / `[[vesta]]` / `[[saraswati]]` but the Christianization is documented in body prose without a `saint-brigid` node; this is a separate-lens (04_persons or 21_theology) decision.
- The 28 fully-isolated minor nodes (Anput, Lahmu-Lahamu, Ningikuga, Sarpanit, Geb, etc.) are listed as TIER-3 cluster gaps rather than individually itemized.

**What I did not have time to check.**
- Full Egyptian Ennead / Ogdoad systematic cross-tradition mapping (only spot-checked Geb/Shu/Tefnut/Nut).
- Phoenician + Punic pantheon (Melkart, Tanit, Eshmun, etc.) — partial coverage in Heracles + Asclepius nodes.
- Hittite + Hurrian Anatolian pantheon (Teshub, Hebat, Ḫannaḫanna, Telipinu) — referenced but not fully surveyed.
- The Watcher / Enochic-Nephilim cluster (Asbeel, Baraqel, Hermoni, Kasdeja, Kokabiel, Armaros — 6+ Enochic angels with empty equivalents) — these are deep-substrate Second-Temple material; whether they need cross-tradition equivalents depends on a policy decision about Enoch-vs-canonical scope.
- Whether `proserpina-roman`, `nox-roman`, `caelus-roman`, `tellus-roman`, `dis-pater-roman`, `banebdjedet-egyptian` should be created as separate nodes or left as string-only stubs (currently broken at S-5).

**Recommended next steps in priority order.**
1. **Decide on the duplicates** (S-2 Holy Spirit, S-3 Tammuz/Dumuzi). These are structural bugs.
2. **Fix S-1 Apollo self-loop**.
3. **Fix the raw-string targets in S-5** (mechanical sweep — ~15 instances).
4. **Decide the framing premise question:** is the visible Christianity-wedge gap really about a missing-node, or about the wheel rendering of an existing node? If the latter, this is a Forge task, not a content task.
5. **Create the three TIER-1 East-Asian Buddhist transmission nodes** (Benzaiten, Śakra/Taishakuten, Enma/Yánluó) — these are the highest-confidence and most theologically-meaningful new nodes.
6. **Fill the empty `equivalents:` on Vishnu, Shiva, Marduk, Tiamat, Enki/Ea, Indra, Mitra-Vedic, Mithra-Zoroastrian, Varuna, Ahura-Mazda, Ushas, Perun, Thor, Odin, Týr.**
7. Asymmetric back-link sweep — every time deity A lists deity B, ensure B's file lists A (or has a documented reason not to).
