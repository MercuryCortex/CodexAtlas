# Codex Atlas — Music Investigation Sector

_Opened 2026-05-16. Status: ACTIVE._

Music is a cross-tradition investigation thread parallel to Symbols. Nodes live in `10_music/`.
The central question: **did independent civilizations converge on the same sonic structures for the same reasons, or is there a documented transmission chain?**

---

## Why This Matters

The vault already documents creation-by-word (`06_themes/creation-by-word.md`) and the void (sacred-void.md). Music is the *sonic dimension* of both: every tradition that built a theology of the void also built a theology of sacred sound. The connections to the existing graph are immediate and deep.

Key investigation leads (all open):
- **Pentatonic universality** — same 5-note scale on every inhabited continent, no contact. Physics reason: strongest overtone harmonics. Strongest convergence candidate in the music layer.
- **The sacred drone** — Hindu tanpura/AUM, Tibetan singing bowls/overtone chanting, Orthodox ison, Sufi sama, Aboriginal didgeridoo, bagpipe drone, Gregorian organum. Every tradition independently discovered the sustained tone as an altered-state technology.
- **Scale transmission chain** — Babylonian tuning (c. -2000, Hurrian hymns) → Greek tetrachord (Pythagoras allegedly learns in Babylon) → Arabic maqam → European church modes (via Boethius) → Western tonal system. 4,000 years documented.
- **Music-cosmos homology** — Greek music of spheres, Indian raga cosmology, Chinese five tones = five elements = five planets. Multiple independent traditions mapped music onto cosmic structure.
- **Creation-by-sound** — Hindu Nada Brahma, Christian Logos/John 1:1, Egyptian Ptah (creates by speaking names), Sefer Yetzirah (God creates via Hebrew letters/sound), Gnostic Logos. Same as creation-by-word but explicitly sonic.
- **Instrument-deity bonds** — Apollo/lyre, Saraswati/vina, Orpheus/kithara, Krishna/flute, David/harp, Odin/galdr (runic chant). The musician-deity as cosmic archetype.

---

## Schema

**File location:** `10_music/music-[slug].md`
**Node type:** `type: music` (registered in build_data.py)

### YAML frontmatter

```yaml
---
id: music-[slug]
title: [Title]
type: music
music-type: theory-concept   # SEE SUBTYPES below
status: metadata | stub | full
tier: 1                       # source integrity tier (1=primary, 2=scholarly, 3=reputable, 4=catalogued)
tradition: [tradition-slug]   # primary tradition (use vault slugs)
date_earliest: [int BCE=-int]
date_latest: [int CE=+int]
tags:
  - music
  - [music-subtype-tag]       # e.g. music-cosmology, music-instrument, music-scale, music-practice
geo: [city/region name]       # if geographically locatable

# Cross-music edges (structured — same pattern as cross-symbol-edges)
cross-music-edges:
  - target: music-[slug]
    type: ancestor-of         # ancestor-of | parallel-form | syncretic-fusion | transmission-to | appropriated-by
    note: [optional short note]

# Links into the main vault graph
music-tradition-context:
  - [[tradition-slug]]        # tradition nodes this music belongs to
music-deity-connections:
  - [[deity-slug]]            # deity nodes connected to this music
music-appearances:
  - [[document-slug]]         # document nodes where this appears

refs:
  - "Author, Title, date"     # Tier-1 or Tier-2 scholarly sources only
---
```

### Music subtypes (`music-type` field)

| Value | Use for |
|---|---|
| `theory-concept` | Abstract music theory ideas: harmony, intervals, music-of-spheres, nada brahma |
| `scale-mode` | Specific scales, modes, tuning systems: pentatonic, raga, maqam, Greek modes |
| `instrument` | Physical instruments with cultural/sacred significance: lyre, oud, vina, singing bowl |
| `practice` | Ritual sonic practices: chant, drone, mantra, kirtan, sama, cantillation |
| `composition` | Specific works or corpora: Hurrian Hymns, Sama Veda, Natya Shastra |
| `person` | Composers and theorists (prefer `04_persons/` unless purely music-context) |

### Edge types for `cross-music-edges`

| Type | Meaning |
|---|---|
| `ancestor-of` | This concept/form developed into the target |
| `parallel-form` | Same structure, independent development (convergence) |
| `transmission-to` | Documented scholarly transmission to target culture |
| `syncretic-fusion` | Two traditions merged into target |
| `appropriated-by` | Target culture adopted this music concept, sometimes inverting it |

---

## Planned Batches

### Batch 1 — Seed / Theory Layer (music-seed-1) — COMPLETED 2026-05-16
8 cross-tradition theory-concept nodes. The MASSIVE WIN convergence layer.
- music-music-of-spheres, music-nada-brahma, music-pentatonic-scale, music-sacred-drone
- music-creation-by-sound, music-aum-om, music-hurrian-hymns, music-pythagorean-harmony

### Batch 2 — Greek/Western Strand (music-greek-western-1) — COMPLETED 2026-05-16
7 nodes: Greek modes, Orpheus, lyre/kithara, Boethius De Musica, Plato Timaeus world-soul,
Gregorian modes, Western sacred chant. Commit: 61d14bf.

### Batch 3 — Indian/Islamic/Jewish Strand (music-eastern-1) — COMPLETED 2026-05-16
10 nodes: raga cosmology, Natya Shastra, Sama Veda, Saraswati/vina, Arabic maqam,
oud-lute transmission, Sufi sama, Sefer Yetzirah, Torah cantillation, niggun hasidic.
Stub: narada (03_deities/). Commit: 01f93af.

### Batch 4 — African Strand (music-africa-1) — COMPLETED 2026-05-16
5 nodes: West African polyrhythm, griot tradition, talking drums, mbira spirit music,
ancient Egyptian music. KEY FIND: Egypt's priestly musician caste predates Israel and India
by 1,000+ years — may be origin point, not convergence. Commit: cd6f41d.

### Batch 5 — East Asian Strand (music-eastasia-1) — COMPLETED 2026-05-16
5 nodes: Chinese pentatonic cosmology (五音/5-element mapping — most complete music-cosmos
system in vault), Yayue ritual music, Chinese court instruments (bāyīn/8 trigrams),
Gagaku Japanese, Korean Aak. KEY FIND: Confucian yayue + Platonic modal censorship = same
argument in independent civilizations. Preservation-by-periphery confirmed twice (Japan +
Korea both archived Tang music China lost). Commits: 79edeea + e41f4af.

### Batch 6 — Raga Singularity Investigation (music-raga-singularity-1) — COMPLETED 2026-05-16
3 nodes: Greek musical ethos, Liturgy of Hours, Islamic adhan maqam conventions. Plus:
2 new patterns (time-music-gradient-six-traditions, preservation-by-periphery) and
1 new observation (why-india-completed-the-clock). KEY FIND: tawhid doctrine specifically
blocks the Nada Brahma move — Islam couldn't complete the clock for doctrinal reasons,
not for lack of musical sophistication. Commits: 4110670 + 53aac59.

### Batch 7 — Americas + Oceania (music-americas-oceania-1) — COMPLETED 2026-05-16
5 nodes: Aboriginal Songlines, Inca siku, Native American ceremonial, Mayan music,
Aztec music. KEY FIND: Songlines = only tradition where creation-by-sound is ongoing
maintenance, not historical event. Seasonal song restriction independently discovered on
3 continents. Instrument burial convergence confirmed: Maya + Mesopotamia + China.
Commit: 3b0606d.

### Batch 8 — Ancient Near East (music-ancient-near-east-1) — COMPLETED 2026-05-16
3 nodes: Mesopotamian temple music (world's first salaried musicians, gala gender-liminality),
Levitical temple music (Psalm 137 = first music strike), Zoroastrian sacred sound.
KEY FIND: Zoroastrian Gathas and Sama Veda are same type of metered sacred oral composition;
opposite conclusions on instruments. Possible transmission vector for Islamic anti-instrument
jurisprudence. Commit: 252a346.

**CURRENT STATE: 47 music nodes · 15,779 edges · all inhabited continents covered**

---

## Sources

Primary:
- Boethius, *De Institutione Musica* (c. 510 CE) — Pythagorean transmission to West
- Plato, *Timaeus* — world-soul as musical scale
- Nicomachus, *Manual of Harmonics* (c. 100 CE) — Pythagorean intervals
- Bharata Muni, *Natya Shastra* (c. 200 BCE–200 CE) — Indian music philosophy
- *Sama Veda* — the Veda dedicated to sacred chant
- Hurrian Hymns (c. -1400 BCE) — oldest surviving notated music
- *Sefer Yetzirah* — Hebrew letters/sound/creation mysticism

Scholarly:
- Joscelyn Godwin, *Music of the Spheres* — comparative tradition survey (Tier-2)
- Manfred Clynes, *Music, Mind, and Brain* (1982)
- R.A. Schwaller de Lubicz, *The Temple of Man* — Egyptian sonic cosmology

---

_Update this file when new batches complete. Agents: read this before writing any music node._
