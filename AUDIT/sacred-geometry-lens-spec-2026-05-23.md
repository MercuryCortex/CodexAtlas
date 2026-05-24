# Sacred Geometry Lens (`27_geometry/`) — design spec

**Date:** 2026-05-23
**Handle:** opus-geometry-spec-1
**Status:** PROPOSAL — awaiting John's greenlight/veto. Atomic with `06_themes/` → `06_motifs/` rename window (next Lane B batch). NOTE: ontology lock currently lists `27_attire` at slot 27. Either this becomes `28_geometry/` or `27_attire` → `28_attire` swap (recommend the latter; geometry is more fundamental and `27_` is the natural neighbor of `26_calendars` in the "encoded cosmos" cluster — calendars / geometry / astronomy are the three quantitative-cosmological lenses).

---

## 1. Lens scope

`27_geometry/` collects the **encoded-theology forms** — the geometric figures, diagrams, proportions, and frameworks that traditions use to *spatialize* their cosmologies. The animating thesis: **a Sri Yantra is not decoration; it is the goddess Tripura-Sundari as diagram. A girih pattern is not ornament; it is *tawhid* — divine unity — geometrically expressed. A Vesica Piscis in a rose window is not "a nice shape"; it is the Christological mystery of two natures intersecting.**

The lens is distinct from neighboring lenses as follows:

| Lens | What it holds | How it differs |
|---|---|---|
| `09_symbols/` | iconographic units (ankh, ouroboros, cross) | Geometry nodes carry **construction rules** (compass-and-straightedge or ratio-based). A symbol is a fixed glyph; a geometric figure is a *recipe* that can be re-instantiated. The Vesica Piscis is geometry (two-circle construction); the ichthys fish is a symbol. |
| `16_mathematics/` | numerical / theoretical mathematics (zero, infinity, ritual-arithmetic, transmission of decimals) | Math is *number*; geometry is *form*. Phi-the-number lives in `16_`; the Golden Rectangle as a constructible figure lives in `27_`. |
| `20_sacred_architecture/` | specific buildings (Chartres, Borobudur, Brihadeeswarar) | Architecture nodes *instantiate* a geometric figure. The Vastu Purusha Mandala lives in `27_`; the Brihadeeswarar Temple that is laid out on a Vastu mandala lives in `20_`. |
| `09_symbols/arabesque-girih.md` (already exists) | this should be reclassified or split | Existing node treats girih as a symbol; under the new lens, the girih *system* lives in `27_geometry/` and the symbolic *meanings* stay in `09_symbols/`. Cross-linked. |

---

## 2. Ontology — what KIND of node lives here?

**Recommended granularity: per-figure nodes, NOT per-tradition-cluster.**

The vault's pattern is one-concept-one-node. Lumping "all Hindu yantras" into one node breaks the cross-tradition wiring (a Sri Yantra has a parallel in the Christian Rose Window; a Bhupura square has a parallel in the Vastu mandala border; lumping hides these). Adam Hardy and Michael Meister's scholarship is itself organized per-figure (the *garbha-griha* footprint, the *prastara* horizontal cornice, the *shikhara* spire profile — each has its own published geometry).

Three node sub-types live in this lens:

1. **`geometry-figure`** — a specific constructible figure with a recipe: Sri Yantra, Vastu Purusha Mandala, Vesica Piscis, the 8-pointed Rub el-Hizb star, the Tetraktys, the Quincunx, Metatron's Cube.
2. **`geometry-proportion`** — an abstract ratio that encodes meaning: Phi, sqrt-2, sqrt-3, the double-square, the 3-4-5 triangle, the ad-quadratum sequence.
3. **`geometry-system`** — a coherent compositional framework: Indian *shilpa-shastra*, Islamic girih-tile system, Pythagorean number-theology, Gothic ad-quadratum/ad-triangulum, Vitruvian-into-medieval geometric design tradition.

A node's `category:` field carries which sub-type it is.

---

## 3. Node schema

```yaml
---
type: geometry
id: ""                                # e.g., "sri-yantra", "vesica-piscis", "vastu-purusha-mandala"
name: ""
aka: []                               # Sanskrit/Arabic/Greek transliterations + alternates
                                      # Sri Yantra / Sri Chakra / Shri Yantra
category: ""                          # geometry-figure | geometry-proportion | geometry-system
tradition: ""                         # primary tradition; cross-tradition figures use the originating culture
sub-tradition: ""                     # e.g., "Shri Vidya Shakta", "Sunni Persianate"
region: ""
period-earliest:                      # integer (BCE negative); earliest attested instance
period-latest:                        # integer; 2026 if still in active liturgical/ritual use
construction: ""                      # one-paragraph: how the figure is geometrically built
                                      # (compass-and-straightedge steps, ratio sequence, tile rules)
canonical-proportions: []             # ["phi", "sqrt-3", "double-square", "3:4:5"] — empty if none
                                      # link to 16_mathematics nodes where they exist
encoded-figures: []                   # [[deity-slug]] or [[theme-slug]] this geometry represents
                                      # Sri Yantra → [[tripura-sundari]], [[lalita]], [[shri-vidya]]
encoded-cosmology: ""                 # one-line gloss: "the body of the Cosmic Purusha", "tawhid (divine
                                      # unity manifest in non-repeating tiling)", "the two natures of Christ
                                      # intersecting"
attested-in: []                       # [document-slug] texts where the figure is described
                                      # (Mayamatam, Manasara, Saundarya-Lahari, Topkapi Scroll, Vitruvius)
instantiated-in: []                   # [[architecture-slug]] specific buildings that realize this figure
                                      # (Chartres rose window for Vesica Piscis; Khajuraho Kandariya for
                                      # Vastu Purusha Mandala)
constructed-by: []                    # [[person-slug]] historical figures who codified / described it
                                      # (Sripati for Sri Yantra, Adam Hardy / Michael Meister as modern
                                      # scholarly reconstructors stay in `refs` not `constructed-by`)
encoded-color: []                     # [[color-slug]] canonical colors attached to this figure
                                      # (Sri Yantra → red; Tibetan Five-Buddha mandala → see five-color array)
                                      # Cross-references the canonical-colors table (sibling deliverable).
equivalents: []                       # cross-tradition parallel figures — MUST be [wikilinks]
                                      # Vesica Piscis ↔ [[mandorla]] ↔ [[two-fish-yin-yang]]
cross-geometry-edges:                 # structured form (preferred over equivalents for nuanced claims)
  - target: "[[other-figure-slug]]"
    type: ""                          # same edge-type vocabulary as deity edges:
                                      # same-as | cognate | direct-borrowing | scholarly-parallel |
                                      # parallel-form | substrate-influence | polemic-against
    source: ""                        # T1/T2 citation
    notes: ""                         # nuance
mystery-status: ""                    # "" | "construction-debated" | "modern-reconstruction" |
                                      # "claimed-but-rejected" (for Phi-in-Karnak-type claims we
                                      # reject — see §5)
sourcing-tier: ""                     # "T1-rigorous" | "T2-mixed-reception" | "T3-popular-mostly-rejected"
                                      # (see §5)
status: "stub"                        # stub | metadata | full
refs:
  - title: ""
    author: ""
    year:
    publisher: ""
    type: ""                          # monograph | journal-article | exhibition-catalogue | primary-text
    tier:                             # 1 | 2 | 3 | 4
    url: ""
    notes: ""
tags: []                              # [geometry, yantra, mandala, hindu, axial-age, ...]
---
```

The build script's `NODE_TYPE_MAP` will need `geometry` added (atomic with the deferred Lane B sweep).

---

## 4. Cross-tradition catalog — first-pass node roster

The table below is the **proposed initial roster** for `27_geometry/`. Each row becomes one node. Primary scholarly source cited per row. Categorize by tradition; cross-tradition parallels flagged with `→`.

### 4.1 Hindu / Indic

| Figure | Encoded | Primary source | Construction gloss |
|---|---|---|---|
| **Vastu Purusha Mandala** | Cosmic Purusha pinned to a 9x9 / 8x8 grid; 45 *padadevatas* (presiding deities) | Stella Kramrisch, *The Hindu Temple* vol. I (1946); Bruno Dagens trans. *Mayamatam*; Adam Hardy, *The Temple Architecture of India* (2007) | Square grid (most commonly 8×8 *manduka* or 9×9 *paramasayika*); Purusha overlaid prone; Brahma occupies center cell |
| **Sri Yantra (Sri Chakra)** | Tripura-Sundari / Lalita / the Goddess as cosmic body | Douglas Renfrew Brooks, *The Secret of the Three Cities* (1990); André Padoux ed., *Mantras et diagrammes rituels* (1986); T. Michael chapter therein | 9 interlocking triangles (4 upward Shiva + 5 downward Shakti) generating 43 sub-triangles, enclosed in lotus rings and a *bhupura* square gate |
| **Bhupura (square enclosure)** | the boundary between sacred and profane around any yantra | Brooks 1990; Padoux 1986 | Three nested squares with four T-shaped gates (one per cardinal direction) |
| **Mahameru Yantra** | 3D form of the Sri Yantra; Mount Meru as cosmic axis | Khanna, *Yantra: The Tantric Symbol of Cosmic Unity* (1979); Padoux 1986 | Sri-Yantra extruded into pyramidal form; physical metal/stone artefact rather than 2D diagram |
| **6 Chakras (sat-cakra) as geometric diagrams** | the subtle body's energy centers each with a distinct petal-count + bīja diagram | Sir John Woodroffe, *The Serpent Power* (1919; flawed but founding); Padoux, *Vāc: The Concept of the Word in Selected Hindu Tantras* (1990); David Gordon White, *Kiss of the Yogini* (2003) | Lotus diagrams with specified petal-counts (4-6-10-12-16-2) carrying Sanskrit phonemes; geometric body-map |
| **Kandariya Mahadev fractal generator** | Hindu cosmology as nested self-similar emanation | Trivedi 1989; Rian, Park, Ahn, Chang, *Building and Environment* 42:7 (2007) — fractal dimension ~1.70 | The *shikhara* spire repeats the temple silhouette at multiple scales as *urushringa* miniature spires |
| **Pancha-bhuta yantra arrangement** | 5-element cosmology (earth/water/fire/air/ether) as nested geometric figures | Khanna 1979 | Square (earth) / circle (water) / triangle (fire) / hexagon (air) / point (ether) |

### 4.2 Buddhist

| Figure | Encoded | Primary source | Construction gloss |
|---|---|---|---|
| **Garbhadhatu Mandala (Womb-Realm)** | Mahavairocana's compassion-realm cosmos | David Snellgrove, *Indo-Tibetan Buddhism* (1987); Robert Sharf, "Visualization and Mandala in Shingon Buddhism" in *Living Images* (2001) | 12-court rectangular diagram with Mahavairocana at center surrounded by 8 lotus petals containing buddhas/bodhisattvas |
| **Vajradhatu Mandala (Diamond-Realm)** | Mahavairocana's wisdom-realm; the Five-Buddha schema | Snellgrove 1987; Yamasaki, *Shingon: Japanese Esoteric Buddhism* (1988) | 9 quadrants in 3×3 grid; the central one carries the Five Tathagatas mandala (Vairocana center + four directional Buddhas) |
| **Kalachakra Mandala (Tibetan)** | the Wheel of Time; entire cosmos encoded in five interlocking palaces | Vesna Wallace, *The Kalachakra Tantra* (2010 trans. + study); Bryan Cuevas, *The Hidden History of the Book of the Dead* (2003) | 722-deity multi-storey palace mandala; 5 layered chakras (body/speech/mind/wisdom/great-bliss) |
| **Borobudur layered platform mandala** | the three Buddhist realms (Kāmadhātu / Rūpadhātu / Arūpadhātu) | Jacques Dumarçay, *Borobudur* (1985); Mark Long & Voute, *Borobudur: Pyramid of the Cosmic Buddha* (2008); John Miksic, *Borobudur* (1990) | 9 superimposed platforms: 6 square terraces (Kāma/Rūpa) + 3 circular terraces (Arūpa) culminating in central stupa |
| **Mandala of the Five Tathagatas** | the Five Dhyani Buddhas (Vairocana center + Akshobhya/Ratnasambhava/Amitabha/Amoghasiddhi) | Snellgrove 1987; Wayman, *The Buddhist Tantras* (1973) | Quincunx: center + 4 cardinal directions; each pole carries one Buddha with associated color/element/wisdom (see canonical-colors table) |

### 4.3 Egyptian

| Figure | Encoded | Primary source | Construction gloss |
|---|---|---|---|
| **Eye of Horus / Wedjat fractions** | the divine eye broken into 1/2, 1/4, 1/8, 1/16, 1/32, 1/64 capacity-fractions (heqat) | Erik Iversen, *Canon and Proportion in Egyptian Art* (rev. 1975); Gay Robins, *Proportion and Style in Ancient Egyptian Art* (1994) | Six glyph-parts each assigned a unit-fraction summing to 63/64; the missing 1/64 returned by Thoth |
| **Egyptian canon of proportions (square grid)** | the human body — including divine bodies — as 18-square (Old/Middle Kingdom) or 21-square (Late Period) grid | Robins 1994; Iversen 1975 | Square grid laid over figure with fixed anatomical-landmark / grid-line correspondences |
| **Temple axial geometry — Karnak / Luxor** | the procession-axis as solar/divine path | Richard H. Wilkinson, *The Complete Temples of Ancient Egypt* (2000); Dieter Arnold, *Temples of the Last Pharaohs* (1999) | Axial sequence: pylon → courtyard → hypostyle → sanctuary; not Phi-driven (see §5 caveat) |
| **64-pesh-en-kef / "sacred 64" claim** | mystery-status: claim of a 64-unit ritual measure | mixed: appears in popular sacred-geometry literature; scholarly treatment thin. **Recommend NODE WITH `mystery-status: "claimed-but-poorly-attested"`** | — |

### 4.4 Mesopotamian / Sumerian

| Figure | Encoded | Primary source | Construction gloss |
|---|---|---|---|
| **Ziggurat layered geometry** | mountain-of-the-god as step-pyramid; cosmic ladder | Harriet Crawford, *Sumer and the Sumerians* (2nd ed. 2004); Jean Margueron, *Mari: Capital of Northern Mesopotamia* (2014) | Stepped rectangular platforms (3, 5, or 7 tiers) topped by a *cella*; not pyramidal but terraced |
| **Lapis-blue celestial-vault geometry** | the heavens as a literal blue ceiling | Wayne Horowitz, *Mesopotamian Cosmic Geography* (1998); Stevens, "Bel-Marduk's Celestial Dais" (Academia.edu / AOAT 2021) | Cosmographic schema: the sky as inverted lapis-bowl over the disk-earth; underlying many Sumerian/Akkadian temple-imagery programs |
| **Astrolabe-B 36-star geometry** | star-list as 3-path circular diagram (Anu/Enlil/Ea paths) | Horowitz 1998; Hermann Hunger & David Pingree, *Astral Sciences in Mesopotamia* (1999) | 12 months × 3 paths; star catalog in nested-circle form |

### 4.5 Greek / Pythagorean / Platonic

| Figure | Encoded | Primary source | Construction gloss |
|---|---|---|---|
| **Tetraktys** | the sacred 1-2-3-4 dot-triangle; "the source of ever-flowing nature" | Walter Burkert, *Lore and Science in Ancient Pythagoreanism* (1972); Carl Huffman, *Philolaus of Croton* (1993) | 10 dots arranged in 4 rows (1+2+3+4=10); decade as cosmic fullness |
| **Five Platonic Solids** | the four elements + cosmos (tetrahedron=fire, cube=earth, octahedron=air, icosahedron=water, dodecahedron=cosmos) | Plato, *Timaeus* 53c-57d (primary); Burkert 1972; Reviel Netz, *The Shaping of Deduction in Greek Mathematics* (1999) | Regular convex polyhedra with congruent faces; *Timaeus* assigns each to an element |
| **Vesica Piscis (Greek inheritance)** | two-circle intersection; later Christian "fish bladder" | David Fowler, *The Mathematics of Plato's Academy* (1987); Christian inheritance documented in §4.7 | Two circles each centered on the other's circumference; the almond intersection is the vesica |
| **Golden Section in Parthenon** | mystery-status: **disputed** — see §5 | George Markowsky, "Misconceptions about the Golden Ratio," *College Mathematics Journal* 23:1 (1992); Mario Livio, *The Golden Ratio* (2002) | Often claimed but evidence is largely modern overlay; Markowsky shows most Parthenon-Phi diagrams are post-hoc fits |

### 4.6 Roman

| Figure | Encoded | Primary source | Construction gloss |
|---|---|---|---|
| **Ad Quadratum (square-rotation sequence)** | proportional ladder via successive 45° square rotations; ratio 1:√2 | Vitruvius, *De Architectura* III; Mark Wilson Jones, *Principles of Roman Architecture* (2000) | Square inscribed-then-rotated 45° generates a smaller square whose side is the diagonal-half; iterated for cornice/floor/dome proportions |
| **Pantheon spherical geometry** | the dome as a hemisphere whose vertical center is the floor-mid; rotunda inscribes a perfect sphere | Wilson Jones 2000; Tod Marder & Mark Wilson Jones eds., *The Pantheon* (2015) | Interior diameter = interior height (43.3 m), so a 43.3-m sphere fits exactly inside; oculus = sun-eye |
| **Vitruvian human-circle-square** | the human as cosmic measure inscribed in both circle and square | Vitruvius, *De Architectura* III.1.2-3; Indra Kagis McEwen, *Vitruvius: Writing the Body of Architecture* (2003) | Navel-centered figure inscribing a circle; head-and-foot-and-fingertip figure inscribing a square; Da Vinci's drawing is the famous late-15th-c rendering |

### 4.7 Christian

| Figure | Encoded | Primary source | Construction gloss |
|---|---|---|---|
| **Vesica Piscis (Christian)** | the two-natures-of-Christ mystery; Marian mandorla; ichthys-fish ancestor | Rudolf Wittkower, *Architectural Principles in the Age of Humanism* (1949 / 1971 rev.); Nigel Hiscock, *The Wise Master Builder: Platonic Geometry in Plans of Medieval Abbeys and Cathedrals* (2000); Robert Bork, *The Geometry of Creation* (2011) | Two circles overlapping at each other's center; the almond-shape intersection frames Christ in majesty or the Virgin |
| **Rose Window geometry (Chartres / Notre-Dame de Paris)** | celestial harmony, Marian crown, the cosmic wheel | Painton Cowen, *The Rose Window* (2005); Otto von Simson, *The Gothic Cathedral* (1956); George Lesser, *Gothic Cathedrals and Sacred Geometry* (1957) | Concentric divisions (typically 12-fold or 24-fold) generated by inscribed polygons within nested circles |
| **Cosmati pavements** | the cosmic harmony of the church floor — square-and-circle interlace | Paloma Pajares-Ayuela, *Cosmatesque Ornament: Flat Polychrome Geometric Patterns in Architecture* (2002) | Recursive square-and-circle quincunx patterns in opus sectile (cut-stone inlay); Westminster Abbey pavement = most famous |
| **Gothic ad-quadratum / ad-triangulum** | the cathedral plan as proportional ladder | Wittkower 1949/71; Hiscock 2000; Stephen Murray, *Notre-Dame, Cathedral of Amiens* (1996) | Choice of generative geometry (Milan Cathedral debate 1392 — ad-quadratum vs ad-triangulum) recorded in primary sources |
| **Trinitarian triangle** | the Father/Son/Holy-Spirit equality | Adolphe Didron, *Christian Iconography* (1851; orig. 1843); standard liturgical-art handbooks | Equilateral triangle, sometimes nested in a circle (Trinity in unity) |

### 4.8 Islamic

| Figure | Encoded | Primary source | Construction gloss |
|---|---|---|---|
| **Girih tile system** | *tawhid* (divine unity) — non-figurative geometric expression of one-without-image | Gülru Necipoğlu, *The Topkapi Scroll: Geometry and Ornament in Islamic Architecture* (1995); Lu & Steinhardt, *Science* 315 (2007) | 5 polygon tiles (decagon, pentagon, hexagon, bowtie, rhombus) with surface-line patterns; tiles combine into 10-fold symmetry |
| **Darb-i Imam quasicrystal tiling** | the Isfahan shrine's near-perfect Penrose-quasicrystal pattern (1453 CE) | Lu & Steinhardt 2007 — peer-reviewed *Science* paper; Eric Broug, *Islamic Geometric Patterns* (2008/2013) | Self-similar subdivision rules generating decagonal aperiodic tiling, predating Penrose by 5 centuries |
| **8-pointed Rub el-Hizb (Khatim Sulayman)** | the seal of the Quran; section-marker for one-quarter-hizb | Necipoğlu 1995; Carol Bier, "Geometric Patterns and the Interpretation of Meaning" (2002) | Two superimposed squares rotated 45°; the resulting 8-point star is found on Moroccan flag, Quran divisions, mosque ornaments |
| **Muqarnas hierarchy** | the descent of divine light through ranked celestial niches | Necipoğlu 1995 (with Mohammad al-Asad essay on muqarnas geometry); Yasser Tabbaa, *The Transformation of Islamic Art during the Sunni Revival* (2001) | Stalactite-like 3D vault built from a 2D grid of unit-cells; the projection rules are non-trivially mathematical |
| **Arabesque infinite-pattern logic** | the infinity of God expressed through pattern that has no natural stopping point | Necipoğlu 1995; Oleg Grabar, *The Mediation of Ornament* (1992) | Repeat units that extend indefinitely; the wall is a window onto the infinite pattern that continues beyond visible bounds |

### 4.9 Chinese

| Figure | Encoded | Primary source | Construction gloss |
|---|---|---|---|
| **BaGua trigrams (Eight Trigrams)** | the eight fundamental cosmic states; pre-geometry of the *Yijing* | Richard Smith, *Fathoming the Cosmos and Ordering the World: The Yijing* (2008); Hellmut Wilhelm, *Heaven, Earth, and Man in the Book of Changes* (1977) | 8 three-line figures (broken/unbroken) arranged in octagonal Pre-Heaven (Fuxi) or Post-Heaven (King Wen) sequence |
| **Five-Phase pentagram (wuxing)** | the five-phase generative + destructive cycle (wood/fire/earth/metal/water) | Robin D.S. Yates, *Five Lost Classics: Tao, Huang-Lao, and Yin-Yang in Han China* (1997); Manfred Porkert, *The Theoretical Foundations of Chinese Medicine* (1974) | 5 points connected by inner star: outer ring = generative cycle; inner star = controlling cycle |
| **Luoshu magic square** | the 3×3 magic square = cosmic order; 4-9-2 / 3-5-7 / 8-1-6 (lines sum to 15) | Schuyler Cammann, "The Magic Square of Three in Old Chinese Philosophy and Religion," *History of Religions* 1:1 (1961) | 3×3 grid with digits 1-9; sums of rows/columns/diagonals all = 15 |
| **Hetu river diagram** | the Yellow River dragon-horse diagram; 5+5 dot pattern as cosmic origin | Wilhelm 1977; Smith 2008 | 10 groups of dots (1-10) arranged as a cross with center; paired with Luoshu |
| **Taiji (yin-yang)** | the dynamic complementary opposition encoded as S-curve in a circle | Isabelle Robinet, *Taoism: Growth of a Religion* (1997) | Two interlocking comma-shapes within a circle; each contains a dot of the other's color |

### 4.10 Mesoamerican

| Figure | Encoded | Primary source | Construction gloss |
|---|---|---|---|
| **Tzolkin 260-day grid** | the divinatory calendar as 20×13 matrix | Anthony Aveni, *Skywatchers of Ancient Mexico* (rev. 2001); David Carrasco, *Religions of Mesoamerica* (3rd ed. 2014) | 13 numbered "tones" × 20 named "day-signs"; each day = one cell |
| **Quincunx (5-point cosmogram)** | the four directions + center; the Aztec/Maya cosmic plan | Karl Taube, "The Symbolism of Jade in Classic Maya Religion" (2005); Mary Miller & Karl Taube, *An Illustrated Dictionary of the Gods and Symbols of Ancient Mexico and the Maya* (1993) | 4 dots at cardinal directions + 1 central dot; on jade plaques, codex pages, and city plans |
| **Codex Fejérváry-Mayer cosmogram (page 1)** | the 5-region world-map with directional gods, trees, birds, and 260-day count | Eduard Seler, *Gesammelte Abhandlungen* (collected 1902-23); Elizabeth Hill Boone, *Cycles of Time and Meaning in the Mexican Books of Fate* (2007) | Maltese-cross with central quincunx; each arm = one cardinal direction with its color/god/tree/bird |
| **Templo Mayor twin-pyramid axis** | the dual god-axis (Huitzilopochtli south + Tlaloc north) | Eduardo Matos Moctezuma, *Life and Death in the Templo Mayor* (1995); Carrasco 2014 | Two adjacent pyramids on a single platform; geometric statement of war/water duality |

### 4.11 Indigenous / pre-state

| Figure | Encoded | Primary source | Construction gloss |
|---|---|---|---|
| **Medicine Wheel (Plains, esp. Bighorn)** | the four directions + sky/earth/center; ceremonial calendar | John Eddy, "Astronomical Alignment of Big Horn Medicine Wheel," *Science* 184 (1974); Ake Hultkrantz, *Belief and Worship in Native North America* (1981) | Stone circle ~25 m diameter with 28 radiating spokes and 6 outlier cairns; solar-alignment debated but documented for Bighorn |
| **Dogon cosmological diagram** | the 8 ancestor-Nommo geometric system; the *yala* signs | Marcel Griaule, *Conversations with Ogotemmêli* (1965 trans.); Walter van Beek's critical reassessment in *Current Anthropology* 32:2 (1991) — **mystery-status: "modern-ethnographic-reconstruction-disputed"** | Various geometric "signs" (*yala*) used in initiation cosmology; van Beek argues Griaule's elaborate system may reflect interview-effects |
| **Songline geometric paths (Australian Aboriginal)** | landscape-encoded ancestral journey-lines as ritual geometry | Howard Morphy, *Ancestral Connections* (1991); Lynne Hume, *Ancestral Power: The Dreaming, Consciousness and Aboriginal Australians* (2002) | Pattern is *across geography*, not on paper; cross-country journey-traces forming a continental geometric mesh |

### 4.12 Hermetic / esoteric

| Figure | Encoded | Primary source | Construction gloss |
|---|---|---|---|
| **Kabbalistic Tree of Life (Sefirot)** | the 10 emanations from Ein Sof + 22 connecting paths | Gershom Scholem, *Major Trends in Jewish Mysticism* (1941; rev. 1995); Moshe Idel, *Kabbalah: New Perspectives* (1988); Judith Weiss, "Spherical Sefirot in Early Kabbalah," *Harvard Theological Review* 117:4 (2024) | 10 nodes in 3-column arrangement (severity / mercy / balance) connected by 22 paths corresponding to Hebrew letters; visualized form developed gradually in medieval period |
| **Sefer Yetzirah letter-geometry** | the 22 Hebrew letters as cosmic building-blocks; the 32 paths of wisdom | Aryeh Kaplan trans., *Sefer Yetzirah* (1997 ed.); Joseph Dan, *The Heart and the Fountain: An Anthology of Jewish Mystical Experiences* (2002) | 3 mother letters + 7 double letters + 12 simple letters; assigned to elements, planets, zodiac signs; pre-Tree-of-Life letter-geometry |
| **Metatron's Cube** | claimed projection of the 5 Platonic solids; modern Hermetic synthesis | mystery-status: **mixed-reception** — see §5. Primary academic treatment: Marsha Keith Schuchard, *Restoring the Temple of Vision: Cabalistic Freemasonry and Stuart Culture* (2002) for early modern Hermetic geometry; the specific "Metatron's Cube" 13-circle figure is a 20th-c esoteric synthesis | 13 circles (1 center + 6 inner ring + 6 outer ring) of the Fruit-of-Life with connecting lines |
| **Flower of Life** | mystery-status: **mixed-reception** — see §5. Documented as a decorative motif on the Osireion at Abydos (palaeographic dating disputed — likely Greco-Roman not Old Kingdom); academic treatment of the term itself: largely 20th-c | William Stirling, *The Canon* (1897) and later Drunvalo Melchizedek (1990s) popularized the term. Earlier scholarly engagement focuses on the underlying *hexagonal close packing* / Apollonian circle figure, not on cosmic interpretations | 19-circle hexagonal pattern of equal overlapping circles; one of many "circle-packing" figures |

---

## 5. Sourcing standards — Tier 1 / Tier 2 / Tier 3

The vault's existing tier convention (T1 peer-reviewed monograph / T2 monograph or top journal / T3 popular / T4 polemical/unreliable) maps to geometry as follows. **The `sourcing-tier:` field on each node carries this.**

### T1-rigorous — "wire it confidently"

These figures have decades of peer-reviewed scholarship; the academic record is solid.

- **Vastu Purusha Mandala** — Kramrisch, Hardy, Meister, Dagens; primary texts (*Mayamatam*, *Manasara*, *Shilpa-shastra* corpus)
- **Sri Yantra + Sri Chakra** — Brooks, Padoux, Khanna; primary text *Saundarya-Lahari*
- **Girih tiles + Darb-i Imam quasicrystal** — Necipoğlu, Lu & Steinhardt (*Science* 2007), Broug
- **Five Tathagata mandala** — Snellgrove, Wayman, Sharf
- **Vesica Piscis in Gothic architecture** — Wittkower, Hiscock, Bork, von Simson
- **Borobudur as mandala** — Dumarçay, Miksic, Long & Voute
- **Maya quincunx / Mesoamerican directional cosmogram** — Aveni, Miller & Taube, Boone, Carrasco
- **Tetraktys + Platonic solids** — Burkert, Huffman, Netz, Plato's *Timaeus* itself
- **Egyptian canon of proportions (square-grid)** — Iversen, Robins
- **Sefirot / Tree of Life** — Scholem, Idel, Dan, Weiss (HTR 2024)
- **Topkapi Scroll geometric tradition** — Necipoğlu (Getty 1995)
- **Pantheon spherical geometry** — Wilson Jones, Marder

### T2-mixed-reception — "wire with explicit caveats"

Real scholarly treatment exists, but the topic has been heavily co-opted by New-Age sources. We can node these but must (a) cite *only* academic sources, (b) name the popular co-option explicitly in the body so future readers can navigate, (c) carry `sourcing-tier: "T2-mixed-reception"`.

- **Flower of Life** — the decorative motif is real and pre-modern (Osireion etchings, Assyrian thresholds, Roman mosaics); the *cosmological interpretation* is largely 20th-c esoteric (Melchizedek). Academic treatment of "circle packing" / *hexagonal close packing* is rigorous. Node should foreground the figure's actual archaeology + clearly mark interpretive claims as modern.
- **Metatron's Cube** — the specific 13-circle figure with the "contains all five Platonic solids" claim is a modern Hermetic synthesis. Schuchard 2002 traces early-modern Hermetic geometry; the figure-as-named appears mainly in 19th–20th c esoteric literature.
- **Tetragrammaton-as-pentagram / "Hexagram of Solomon" cosmic claims** — overlap with serious Kabbalah scholarship and serious folk-magic studies; pop-occult literature is mostly T4. Wire to Scholem/Idel, not to Eliphas Lévi.
- **6 Chakras** — Woodroffe (1919) is foundational but flawed; modern scholarship (Padoux, White) revises substantially. Wire to current academic sources, not the popular yoga-studio paraphrase.

### T3-popular-mostly-rejected — "node with mystery-status; document the rejection"

Common claims that the scholarly consensus largely rejects. We still node them because they are *culturally important claims* — but the node documents the claim AS a claim, with the rejection.

- **"Golden Ratio governs the Great Pyramid / Parthenon / all cathedrals"** — Markowsky (*College Mathematics Journal* 1992), Livio (*The Golden Ratio* 2002). Most Phi-overlay diagrams are post-hoc fits. Reject; document the rejection.
- **"Vitruvian Man encodes Phi"** — Vitruvius does not mention Phi; the figure is square-and-circle, not golden-rectangle. Modern overlay myth. Reject; document.
- **"Sacred 64 / pesh-en-kef Egyptian temple measure"** — popular sacred-geometry claim; academic Egyptology does not support a unified "64 cubit module" governing Karnak/Luxor. Mystery-status: claimed-but-poorly-attested.
- **"Stonehenge is a precise observatory encoding π / Phi / Pythagorean triples"** — Gerald Hawkins's 1965 *Stonehenge Decoded* hypothesis is largely rejected by current archaeology (Mike Parker Pearson, *Stonehenge: A New Understanding* 2012). Document the claim + rejection.

### T4-pseudoscholarly — "do not wire"

- Anything from Drunvalo Melchizedek, Graham Hancock's geometric-cosmic-axis claims, Robert Lawlor's *Sacred Geometry* (Thames & Hudson 1982 is widely cited but is openly mystical synthesis — useful as a *primary source for modern Western esotericism*, not as scholarly authority).
- **Use Lawlor as evidence of the modern Hermetic-revival tradition**, not as evidence about the figures themselves.

---

## 6. Cross-lens wiring patterns

The geometry lens is heavily transverse — almost every node connects to nodes in three or more other lenses.

| From | To | Field on geometry node | Reciprocal field |
|---|---|---|---|
| `27_geometry/sri-yantra` | `03_deities/tripura-sundari` | `encoded-figures: ["[[tripura-sundari]]"]` | on deity: add `encoded-by: ["[[sri-yantra]]"]` (new field — or use existing `attributes:`) |
| `27_geometry/vastu-purusha-mandala` | `20_sacred_architecture/khajuraho-kandariya-mahadev` | `instantiated-in:` | on arch: `built-on-geometry: ["[[vastu-purusha-mandala]]"]` (new field) |
| `27_geometry/vesica-piscis` | `02_documents/euclid-elements` | `attested-in:` | on document: `geometric-figures: ["[[vesica-piscis]]"]` (new field) |
| `27_geometry/five-tathagata-mandala` | `03_deities/vairocana`, `akshobhya`, etc. | `encoded-figures: [5 deity links]` | each deity: `encoded-by:` |
| `27_geometry/sri-yantra` | canonical-color [[red]] | `encoded-color: ["[[red]]"]` | links to canonical-colors table data |
| `27_geometry/girih-tile-system` | `09_symbols/arabesque-girih` | `equivalents:` or `cross-geometry-edges:` | reciprocal cross-symbol-edges |
| `27_geometry/sri-yantra` | `27_geometry/rose-window-geometry` | `cross-geometry-edges` with `type: parallel-form` and source: scholarly comparison | reciprocal |

**Two new fields needed on existing node types** for full bidirectional wiring:
- On `deity` and `theme` nodes: `encoded-by: []` (array of `[[geometry-slug]]`) — for "this deity is geometrically expressed as X"
- On `architecture` nodes: `built-on-geometry: []` (array of `[[geometry-slug]]`) — for "this building instantiates X mandala/proportion-system"

These can be added incrementally; existing nodes don't need backfill on creation.

---

## 7. Recommended initial node count + roll-out

**First batch (high-yield, T1-only) — ~25 nodes:**

Vastu Purusha Mandala · Sri Yantra · Sri Chakra (separate node if treating as the 3D mahameru) · Bhupura · Five-Tathagata mandala · Garbhadhatu Mandala · Vajradhatu Mandala · Borobudur-mandala-geometry · Vesica Piscis · Rose Window geometry · Cosmati pavement system · Ad Quadratum · Ad Triangulum · Vitruvian-circle-and-square · Pantheon-spherical-geometry · Tetraktys · Five Platonic Solids · Girih tile system · Darb-i Imam tiling · Rub-el-Hizb · Muqarnas · BaGua trigrams · Luoshu magic square · Maya quincunx · Tzolkin grid · Medicine Wheel · Sefirot Tree of Life · Sefer Yetzirah letter-geometry · Eye of Horus fractions · Egyptian canon of proportions

That's ~30 nodes for batch 1.

**Second batch (T2-mixed; explicit caveats) — ~8 nodes:**

Flower of Life · Metatron's Cube · 6-chakras-as-diagrams · Kalachakra Mandala · Pancha-bhuta yantra · Dogon yala signs (with disputed-status) · Hetu river diagram · Taiji (yin-yang)

**Third batch (T3-rejected, documenting-the-rejection) — ~5 nodes:**

Phi-in-Great-Pyramid (claim) · Phi-in-Parthenon (claim) · Sacred-64-Karnak (claim) · Stonehenge-as-observatory (claim) · Vitruvian-Phi (claim)

These exist as nodes so the graph has *somewhere to point* when other nodes reference these popular claims, but their bodies document the rejection.

**Total roster: ~43 nodes at first pass.**

---

## 8. Action checklist (for John's greenlight)

- [ ] **Greenlight or veto** the lens itself. Yes/no.
- [ ] **Greenlight or veto** the slot number. Recommendation: `27_geometry/` (swap `27_attire` → `28_attire`). Or accept `28_geometry/`.
- [ ] **Greenlight or veto** the per-figure granularity (recommended) vs per-tradition-cluster.
- [ ] **Greenlight or veto** the node schema in §3. Particularly the two new fields (`encoded-by:` on deity/theme, `built-on-geometry:` on architecture).
- [ ] **Greenlight or veto** the 3-batch roll-out plan (~43 nodes total over 3 waves).
- [ ] **Lane B atomic update**: `build_data.py NODE_TYPE_MAP` must learn `geometry`. Atomic with `06_themes/` → `06_motifs/` rename. Next Lane B window.
- [ ] **Forge mode dropdown** needs a new "Geometry" filter (Lane B).
- [ ] **Pre-commit hook regex** needs `27_geometry/` (or `28_geometry/`) added.

Once these are checked: I can proceed with **batch 1** in a Lane A content session (estimated 90-120 minutes for ~30 stub/metadata nodes, all with proper YAML + ≥1 T1 ref each).

---

## 9. Open questions for John

1. **Is "encoded color" structured enough to share a field with `encoded-figures`, or should color live entirely in the sibling canonical-colors deliverable and be cross-referenced via `encoded-color: []` only?** Recommendation: keep `encoded-color:` minimal (just the [[color-slug]] reference); the table in the canonical-colors deliverable carries the source citation.
2. **Should `geometry-proportion` nodes (Phi, sqrt-2) live here or in `16_mathematics/`?** Recommendation: live in `16_mathematics/` as `mathematics` type with `category: sacred-number`, and *be cross-referenced* by `27_geometry/` figures. Keeps Phi-the-number distinct from Golden-Rectangle-the-figure.
3. **Should the Vitruvian Man get its own node or live as a sub-section of the human-canon-of-proportions node?** Recommendation: own node, since the figure is a specific Renaissance synthesis (Da Vinci 1490) of a Vitruvian description (1st c. BCE) — two-stage transmission worth documenting.
4. **For `mystery-status: "claimed-but-rejected"` nodes (Phi-in-Parthenon, etc.) — do we want a separate folder convention or just the field?** Recommendation: just the field. The node lives in `27_geometry/` like any other; the field signals interpretive status.

---

*Author: opus-geometry-spec-1 · 2026-05-23*
