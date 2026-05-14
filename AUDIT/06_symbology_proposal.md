# Symbology System — Design Proposal

_Written 2026-05-14 as a handoff for the next implementing agent. The user (John) asked for a complete plan logged here so the work can be picked up cold without context. This is NOT yet built. Treat this file as the agent brief._

---

## User's framing

> *"Symbols and iconography, should be a 'thing of this app' where we catalogue meaningful symbology on each family — with sub sectors of variants inside — but then we can try to connect the symbols across families, etc... This should also include images or iconography that is mystery but important if found in any context and if influenced. This can naturally become a new tab dedicated with art depictions (LATER) etc... or, but for now would be amazing if we can add on the pantheon map toggle to symbology, where we see those, and if there's connections between families (THAT'S MASSIVE WINS)"_

Two-phase rollout requested:

- **Phase A (now-ish)**: Add a third toggle to the Pantheon view (`Deities | Authors | Symbols`). In Symbols mode, the Pantheon shows symbol nodes clustered by family, with cross-family connection edges highlighted.
- **Phase B (later)**: A full dedicated view with art depictions, manuscript scans, gallery layout, iconographic comparison browser.

The user's "MASSIVE win" emphasis: **cross-family symbol connections** (a lotus that appears in Egyptian + Hindu + Buddhist + Christian contexts; a cross that pre-exists Christianity in Sumerian + Egyptian + Mithraic forms; a fish/ichthys with deep pre-Christian Mediterranean substrate).

---

## What "symbol" means in this system

Not just visual marks — **meaningful iconographic units** that recur across cultures and carry interpretive weight. The taxonomy:

1. **Pure geometric / abstract** — cross, hexagram, swastika, ouroboros, pentagram, vesica piscis, triskelion, yin-yang, mandala-circle, spiral, fleur-de-lis.
2. **Theriomorphic (animal-based)** — serpent (with sub-variants: caduceus, naga, uraeus, Ouroboros, Eden), bull (Mithras-tauroctony, Apis, Nandi, golden calf), dove (Holy Spirit, Aphrodite, Ishtar, Inanna), fish (ichthys, Dagon, Babylonian Oannes, Vishnu's Matsya), lion (throne of Solomon, lion of Judah, Cybele's lions, Sphinx), eagle (Zeus, Garuda, Roman aquila, evangelist Mark... wait, John).
3. **Phytomorphic (plant-based)** — lotus (Egyptian Nefertem, Hindu Lakshmi, Buddhist enlightenment, Coptic Christianity), Tree of Life (Mesopotamian, Kabbalistic Etz Chayyim, Norse Yggdrasil, Mayan ceiba, Christian arbor vitae), grapevine (Dionysus, Christian eucharist), wheat/grain (Demeter, Tammuz, Christian bread).
4. **Anthropomorphic / hand-gesture** — Hand of Fatima (Khamsa), hamsa (Jewish), abhaya-mudra (Buddhist), benediction-gesture (Christian icon-painting), Cernunnos sitting cross-legged ↔ Hindu yogic posture parallels.
5. **Solar / astral** — sun-disk (Aten, Sol Invictus, Christ-with-cross-halo, Surya, Amaterasu), crescent moon (Islamic, Diana, Hecate, Mesopotamian Sin), star-of-David, octagram, Venus-as-evening-star symbology.
6. **Cosmological diagrams** — Sefirot, Bhutachakra (Buddhist wheel of existence), Yin-Yang, Hermetic alchemical glyphs, Mithraic cosmographic reliefs, mandala traditions.
7. **Mystery objects** — symbols whose meaning is contested or unknown but whose RECURRENT presence is itself the datum. Examples: Indus Valley script, Magdalenian abstract signs, Tartaria tablets, Phaistos Disc, Voynich glyphs, Glozel inscriptions, Gobekli Tepe pillar symbols, Sahara rock art geometrics.

---

## Data model

### New node type: `symbol`

### Folder: `09_symbols/`

### Schema (proposed addition to `00_meta/schema-symbol.md` — needs to be created)

```yaml
---
type: symbol
id: "ankh"
name: "Ankh"
aka: ["Crux ansata", "Key of Life", "Egyptian Cross"]
category: "geometric"             # geometric | theriomorphic | phytomorphic | anthropomorphic | astral | cosmological | mystery
families: ["Egyptian"]            # primary origin family/families
period-earliest: -3000            # earliest documented appearance (BCE neg)
period-latest: 1000               # last attested in primary tradition (or "present")
region: "Nile Valley"

# Variants — sub-forms within the same symbol-family. Each variant is a sub-section,
# not a separate node, unless it acquired a distinct tradition of its own.
variants:
  - id: "ankh-djed-was"
    description: "Compound with djed-pillar and was-sceptre (life-stability-power triad)"
  - id: "ankh-coptic-cross"
    description: "Coptic Christian appropriation as cross-variant from c. 200 CE onward"
    became-symbol: "coptic-cross"           # if the variant migrated and became its own node, point to it

# Appearances — documents, deities, events, traditions where this symbol is attested
appearances:
  - "[[phase-1-002-pyramid-texts]]"
  - "[[phase-1-009-coffin-texts]]"
  - "[[phase-1-010-book-of-the-dead]]"
deity-instances:
  - "[[isis]]"                              # depicted holding ankh
  - "[[osiris]]"
  - "[[ra]]"
  - "[[aten]]"
tradition-context:
  - "[[tradition-egyptian]]"
  - "[[tradition-coptic-christianity]]"     # cross-family migration

# Iconographic depictions — image refs (path or Wikimedia URL)
depictions:
  - src: "_assets/symbols/ankh-tutankhamun.jpg"
    caption: "Ankh from Tutankhamun's tomb"
    source: "Wikimedia Commons"
    license: "CC-BY-SA 4.0"
  - src: "https://upload.wikimedia.org/.../ankh.svg"
    caption: "Standard hieroglyphic form"

# Cross-symbol edges — when this symbol historically connects to, derives from, or
# influences another. The TYPE matters: don't conflate ancient-identification with
# scholarly-parallel.
cross-symbol-edges:
  - target: "coptic-cross"
    type: "ancestor-of"                     # this symbol → that symbol
    notes: "Coptic Christians adopted the ankh as cross variant; attested on Coptic textiles + manuscripts c. 200-400 CE"
    refs: ["Bagnall 1993 *Egypt in Late Antiquity*"]
  - target: "crux-ansata-symbol"
    type: "scholarly-parallel"
    notes: "Generic crux-ansata form documented across non-Egyptian Near Eastern cultures..."

# Mystery flag — for contested or unknown-meaning symbols
mystery-status: "documented"               # documented | partially-deciphered | contested | mystery

status: "stub"                              # stub | metadata | full
refs: []
tags: [symbol, egyptian, geometric, life, eternity]
---
```

### Body structure (proposed addition to schema)

```markdown
# Ankh

## Identity
One paragraph. What this symbol IS — its glyph form, its semiotic structure (life | hieroglyph | logograph).

## Earliest attestation
- First documentary appearance: `[[document-slug]]`, date.
- Iconographic earliest: `[[material-witness-slug]]` if 09_material exists.

## Meaning(s) attested
Documented interpretations IN THE PRIMARY TRADITION (Egyptian texts on the ankh).
Bullet list with sources.

## Variants
The sub-forms with explicit body sections.
- Ankh-djed-was compound — used in royal funerary contexts...
- Ankh-coptic-cross — the Coptic adaptation...
- Ankh-isiac — used in syncretic Greco-Roman Isis iconography...

## Cross-family appearance
Where this symbol shows up OUTSIDE its origin tradition.
- Coptic Christianity (200+ CE) — see [[coptic-cross]]
- Hermetic / Renaissance occult revival (Kircher's *Oedipus Aegyptiacus* 1652+)
- Modern New Age / Theosophical reception

## Contested interpretations
Where scholars disagree. (E.g., the ankh's origin as sandal-strap pictograph vs.
womb-and-uterus glyph vs. cosmic-knot motif — Gardiner 1957 vs. Westendorf 1979.)

## Mystery / unknown variants
Where the symbol appears in contexts whose meaning isn't recovered.

## Connections (provisional)
- → [[coptic-cross]] — *ancestor-of*
- → [[djed-pillar]] — *paired-with*
- → [[was-sceptre]] — *paired-with*

## Refs
Tier 1+ sources.
```

---

## Cross-symbol edge types (proposed)

To go in the methodology edge-types table:

| Edge type | Direction | Meaning |
|---|---|---|
| `ancestor-of` | A → B | Symbol A is documented (textually / archaeologically) as the historical source of symbol B. |
| `parallel-form` | A ↔ B | Symbols share structure but no documented transmission — independent parallel. |
| `syncretic-fusion` | A + B → C | Two symbols merged into a syncretic third (e.g., Egyptian crook + Egyptian flail fused into pharaoh-regalia). |
| `appropriated-by` | A → tradition B | One tradition explicitly adopted the symbol from another (Sol Invictus → Christ halo). |
| `polemic-inversion` | A → A′ | Same symbol used in opposing polemic context (the swastika in Hindu/Buddhist/Jain piety vs. its Nazi appropriation). |
| `visual-cognate` | A ≈ B | Visually similar across cultures, transmission status unknown. |

These edges are bidirectional in the graph except for `ancestor-of` and `appropriated-by` (directional).

---

## Initial high-leverage seed list

If the agent only stubs **30 symbols**, do these. Each is referenced multiple times across the existing vault's deity / document / event nodes already — they'll resolve dead-links immediately:

### Cross / cruciform family (8 symbols, dense graph)
1. **Latin cross** (Christian) — historical evolution from Constantinian *labarum* + Calvary-image. **Cross-family edges**: derived-from `ankh`, `egyptian-tau-cross`; *parallel-form* with `mithraic-bull-tail-cross`.
2. **Tau cross** — pre-Christian: Greek τ, Phoenician, Egyptian sandal-strap-glyph hypothesis. Christian: Antony of Padua, Franciscan emblem.
3. **Greek cross** (equal arms) — Byzantine.
4. **Coptic cross** — Egyptian-Christian variant directly continuing ankh tradition.
5. **Celtic cross** — Insular Christian merging with pre-Christian solar-wheel iconography.
6. **Maltese cross** — Crusader / hospitaller.
7. **Mithraic cross / X** — pre-Christian, in the Mithraic bull-slaying tauroctony.
8. **Swastika** — Hindu / Buddhist / Jain / Native American / Norse / Greek-Bronze-Age. **The single most-cross-tradition symbol in this list.** Nazi-appropriation flagged with discipline (Goodrick-Clarke 2002 *The Occult Roots of Nazism*); the original sacred-symbol usage SURVIVES in Asian piety despite the Western post-1945 inversion.

### Geometric / abstract (8)
9. **Hexagram (Star of David)** — Jewish (post-medieval primarily), Hindu (Shatkona, much older), alchemy, Hermetic.
10. **Pentagram** — Pythagorean, medieval magical, Wiccan, anti-Wiccan Christian polemic.
11. **Ouroboros** — Egyptian *Enigmatic Book of the Netherworld*, Greek alchemical, Norse Jörmungandr-parallel.
12. **Triskelion** — Celtic, Sicilian, Buddhist *trishula* (related?), three-spiral cognates.
13. **Vesica piscis** — geometric form, Christian *ichthys* fish-symbol derivation, medieval mandorla.
14. **Spiral (single)** — neolithic megalithic (Newgrange, Maltese temples), Celtic, Hopi, Australian Aboriginal.
15. **Yin-Yang (taijitu)** — Daoist; with the surprising pre-Daoist Mediterranean parallels (Sasanian, Roman shield-emblems — Monier 1996).
16. **Mandala-circle (generic)** — Buddhist, Hindu, Navajo sand-painting, Christian rose-window iconography.

### Theriomorphic (6 → 7 with the caduceus/Asclepian split)
17. **Serpent / dragon (cosmic enemy)** — Tiamat, Illuyanka, Typhon, Vritra, Leviathan, Lotan, Apophis, Yam — the chaoskampf cluster.
18. **Serpent (wisdom / chthonic)** — Nehushtan (Numbers 21), Eden's serpent, Quetzalcoatl, Naga, Mesopotamian Ningishzida, Minoan snake-goddess. Ouroboros split out to geometric (already separate node #11).
18b. **Caduceus** — two snakes + wings, Hermes / Mercury attribute, herald's wand. *Not* a medical symbol historically. Connect to Hermes, Hermes Trismegistus, Mesopotamian Ningishzida iconography (one source for the entwined-serpent form).
18c. **Asclepian rod (Rod of Asclepius)** — one snake, no wings. Healing-deity attribute (Asclepius, Egyptian-Hellenistic Imhotep-Asclepius). The **caduceus ≠ Asclepian rod** distinction is itself an iconographic-history story: their conflation by US Army Medical Corps (1902) and subsequent American medical-logo use is a documented modern misappropriation worth a `polemic-inversion` or `appropriated-by` edge with discipline. Sources: Walter J. Friedlander, *The Golden Wand of Medicine: A History of the Caduceus Symbol in Medicine* (Greenwood Press, 1992); James Bailey, *The God-Kings and the Titans* — and Stuart Tyson Smith critique of conflation. **This is a 60-second demo of the "scholarship vs. popular icon" thesis.**
19. **Bull** — Mithras tauroctony, Apis-Egyptian, Babylonian Lugal-banda, Mesopotamian winged bulls (lamassu), Cretan Minotaur, golden calf, Nandi (Shiva's mount), Vedic Indra-bull.
20. **Lion** — Throne of Solomon, Lion of Judah, Sphinx, Cybele's lions, Buddha's lion-throne (*siṃhāsana*), evangelist Mark, lion of St Jerome.
21. **Fish / ichthys** — Christian (acrostic Ἰησοῦς Χριστός Θεοῦ Υἱὸς Σωτήρ); pre-Christian Dagon (Philistine), Oannes (Babylonian), Vishnu's Matsya avatar, Aphrodite-fish.
22. **Dove** — Christian Holy Spirit, Aphrodite, Ishtar/Inanna, Noah's dove, Athena.

### Phytomorphic (4)
23. **Lotus** — Egyptian Nefertem, Hindu Lakshmi, Buddhist *padmasana*, Coptic Christian. **Highest-cross-tradition phytomorphic symbol.**
24. **Tree of Life** — Mesopotamian sacred tree, Kabbalistic Etz Chayyim, Norse Yggdrasil, Mayan ceiba, Christian arbor vitae, Bodhi tree.
25. **Vine / grape** — Dionysus, Christian eucharist, Vedic Soma (contested cognate).
26. **Wheat / grain / sheaf** — Demeter / Eleusis, Tammuz / Dumuzi, Christian eucharist (bread), Ceres.

### Astral / cosmological (3)
27. **Sun disk / solar wheel** — Aten, Sol Invictus, Christ-haloed-with-cross-radiating, Surya, Amaterasu, Inca Inti, Buddhist Dharma-wheel (cognate).
28. **Crescent moon + star** — Islamic (medieval Ottoman adoption — see Tezcan 2010), Hellenistic Diana / Hecate / Trivia, Mesopotamian Sin, pre-Islamic Arabic Allat.
29. **Eye (single, all-seeing / Eye of Horus / Eye of Providence)** — Egyptian Eye of Horus (*wedjat*), Eye of Ra, Christian Eye of Providence (post-1500), Masonic, dollar-bill Great Seal.

### Mystery (1)
30. **Indus Valley script symbols** — undeciphered, found on 4,000+ Harappan seals. Status: contested / mystery. Wire to existing prehistory + IVC context.

---

## UI integration plan

### Phase A: Pantheon Symbols mode

Add to the existing Pantheon mode toggle:

```html
<span class="pantheon-mode-toggle">
  <button data-mode="deities">deities</button>
  <button data-mode="authors">authors</button>
  <button data-mode="symbols">symbols</button>    <!-- NEW -->
</span>
```

In the pantheon render, when mode === 'symbols':
- Filter `DATA.nodes` by `n.type === 'symbol'`
- Cluster by family (using `n.families[0]` or a separate `symbol-family` field)
- Apply the same wedge / hull / force layout
- **Cross-family edges should render visibly highlighted** — they're the point. Filter `EDGES` by `e.type ∈ {ancestor-of, syncretic-fusion, appropriated-by}` and draw those PROMINENTLY, not faintly.

### Shape for symbols in Pantheon

Add a shape mapping for symbols in `shapeFor()`:
```js
case 'symbol': return d3.symbolStar;   // or symbolWye, or symbolCross
```

Or better: use the symbol's CATEGORY for shape:
- geometric → symbolStar
- theriomorphic → symbolDiamond
- phytomorphic → symbolTriangle
- anthropomorphic → symbolWye
- astral → symbolCircle
- cosmological → symbolSquare
- mystery → symbolCross

### Phase B: Dedicated Symbology view (later)

A new view in the nav: `❖ Symbology`. The interaction model:
- Grid layout (or radial cluster by category)
- Each symbol shows: image thumbnail, name, families it appears in, mystery-status badge
- Click a symbol → detail panel with full body + all variants + all depictions + cross-symbol-edges as a mini-graph
- Filter sidebar: by family, category, mystery-status, period
- Search: by name or aka

---

## Build pipeline additions needed

1. **Add `symbol` type to `build_data.py`** — currently the build script iterates over `NODE_DIRS` looking for `02_documents`, `03_deities`, `04_persons`, `05_events`, `06_themes`, `07_traditions`. Add `09_symbols` to that list. The build will then index symbol nodes the same way.

2. **Add new edge types in `build_data.py`'s `edge_fields`**:
```python
("cross-symbol-edges", "symbol-cross-tradition"),    # this generates edges from the structured form
("variants",           "symbol-variant"),             # only generates from string entries; structured variants are body content
("ancestor-of",        "ancestor-of"),                # if listed as a top-level field
("appropriated-by",    "appropriated-by"),
("syncretic-fusion",   "syncretic-fusion"),
```

3. **`schema-symbol.md`** to be added in `00_meta/` documenting the shape above.

4. **Image folder convention**: `_assets/symbols/<symbol-slug>/` with one image per variant. Wikimedia URLs are also acceptable (the renderer should respect CC licensing — include attribution in the body).

5. **Thumbnail fetching**: extend `fetch_thumbnails.py` to handle symbols. The Wikipedia API works for most named symbols; the disambiguation issue (already patched for deities) applies similarly. For mystery symbols where Wikipedia is unhelpful, fall back to Wikimedia Commons search.

---

## Methodology cautions

This is the kind of work where bad scholarship is easy to fall into. The **dilettante's trap** is to claim every cross-cultural symbolic parallel is evidence of transmission — when most are independent invention or coincidence.

Required discipline (codify in `00_meta/methodology.md` extension):

- **No `ancestor-of` edge without a Tier-1 archaeological / textual source documenting the historical transmission.**
- `parallel-form` is the default for cross-cultural visual similarity without documented transmission. It's NOT a claim of influence — it's a claim of resemblance.
- **Tiering of comparative-religion synthesists** — handle individually, not as a bloc:
  - **Joseph Campbell** — Tier 4 (popular synthesis; *Hero with a Thousand Faces* is genuinely influential but evidentiarily weak; cite when documenting reception, not for primary claims).
  - **René Guénon** — Tier 4 (Traditionalist metaphysics; cite as primary source for the Traditionalist tradition itself, not for cross-cultural claims).
  - **Mircea Eliade** — split tiering: **Tier 2** for the phenomenological categories (*hierophany*, *sacred-and-profane*, *axis mundi*, *eternal return*) — these are academic canon and already cited across this vault's theme nodes. **Tier 4** for his pre-WWII Iron Guard / Aryan-myth essays specifically. Each Eliade citation should specify which work and tier individually; don't lump.
- Naïve diffusionist claims (Massey, Higgins, Acharya S., "religion is all the same Solar Myth") get explicit `[claim: pseudoscholarship]` tags.
- Indus Valley / Voynich / Phaistos style undeciphered symbols get `mystery-status: mystery` and NO interpretive body claims — just attestation + the scholarly state-of-debate.
- The **swastika problem**: every entry must surface BOTH the ancient sacred use AND the 20th-c. Nazi appropriation without conflating them. Goodrick-Clarke 2002 is the load-bearing source.

---

## Suggested agent task structure

When this work is picked up:

### Batch 1 — Infrastructure (no content yet)
1. Create `09_symbols/` folder.
2. Write `00_meta/schema-symbol.md` per the schema above.
3. Update `build_data.py` `NODE_DIRS` + `edge_fields`.
4. Document new edge types in `methodology.md`.
5. Update `fetch_thumbnails.py` to recognize symbols.
6. Update the frontend's `shapeFor()` to include `symbol` type.
7. Add the third Pantheon toggle button + symbol-mode filter.
8. **Verify a single test symbol** (e.g., `ankh.md`) renders correctly end-to-end.

### Batch 2 — Cross / cruciform family (8 symbols)
Author the 8 cross-family symbols with cross-symbol edges connecting them. Wire to existing Christian, Egyptian, Mithraic deity/document nodes.

### Batch 3 — Geometric / abstract (8 symbols)
Hexagram, Pentagram, Ouroboros, Triskelion, Vesica piscis, Spiral, Yin-Yang, Mandala.

### Batch 4 — Theriomorphic (6 symbols)
The two serpents (chaoskampf vs wisdom), bull, lion, fish, dove. **High cross-family edge density expected.**

### Batch 5 — Phytomorphic + Astral + Mystery (8 symbols)
Lotus, Tree of Life, Vine, Wheat, Sun disk, Crescent + star, Eye, Indus Valley.

### Batch 6 — UI polish + dedicated view
Build Phase-B view if user signs off after Phase A is live.

---

## Open questions for the user

These need a decision before the agent commits:

1. **Symbol-family or tradition-family?** Should symbols inherit the existing `family` taxonomy (Egyptian, Christian, etc.) or have their own taxonomy (geometric, theriomorphic, …)? Recommendation: BOTH — `families:` array for origin traditions, `category:` for visual taxonomy.

2. **Variants as sub-nodes or body sections?** The schema above treats variants as body sub-sections by default, promoting to separate nodes only when the variant acquired its own tradition (e.g., Coptic cross became distinct enough to warrant its own node). User should confirm this is the right boundary.

3. **Phase A scope**: 30 seed symbols feels right for the Pantheon Symbols mode to be visually meaningful. Smaller (10–15) wouldn't show the cross-family pattern. Larger (50+) is one more batch round.

4. **Phase B priority**: dedicated Symbology view — when? After ~50 symbols exist, or when user requests it?

---

## Why this matters for the product

The user's framing was "MASSIVE wins." The cross-tradition symbol layer is the most visually compelling instance of the entire vault's thesis. **Three concrete demos a user would want to show others:**

1. **The cross is older than Christianity.** Click "cross" symbol → see edges to Egyptian ankh, Mithraic X, Sumerian tau, Coptic cross-from-ankh evolution. Constantine's labarum lands in a graph context that PRECEDES Christianity by ~3,000 years.

2. **The lotus crosses Egypt → India → China → Coptic Egypt → Renaissance Christian iconography.** Click lotus → see cross-family edges threading through Nefertem, Lakshmi, Buddhist *padmasana*, Coptic textiles, Botticelli's Venus.

3. **The swastika handled with discipline.** Hindu / Buddhist / Jain / Native American / Bronze Age Greek / Norse — all documented continuous sacred use. The 20th-c. Nazi appropriation is one branch with explicit `polemic-inversion` tag, sourced to Goodrick-Clarke. The user sees: this symbol is 4,000 years old, the modern Western shame is 80 years old.

These three alone are the **single best 90-second demo of the entire atlas's thesis**. The user is right that this could be the centerpiece feature.

---

## Files touched / created by this proposal (when implemented)

```
00_meta/schema-symbol.md                  NEW
00_meta/methodology.md                    EDIT (new edge types)
09_symbols/                               NEW FOLDER
09_symbols/ankh.md                        NEW (Batch 2)
09_symbols/latin-cross.md                 NEW (Batch 2)
... (~30 total in seed)
build_data.py                             EDIT (NODE_DIRS + edge_fields)
fetch_thumbnails.py                       EDIT (symbol-type aware)
index.html                                EDIT (third pantheon toggle button)
src/js/app.js                             EDIT (symbol mode filter, shapeFor extension)
src/styles/app.css                        EDIT (symbol-mode styling if needed)
_assets/symbols/                          NEW FOLDER (image cache per symbol)
```

End of proposal. Ready for an agent to pick up cold.
