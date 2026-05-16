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

### Batch 2 — Greek/Western Strand (music-greek-western-1) — DISPATCHED 2026-05-16
Greek modal theory, Boethius transmission, Orpheus, lyre, Plato Timaeus world-soul,
Western sacred chant lineage. Agent owns: all nodes with `tradition-pythagoreanism`,
`tradition-neoplatonism`, `tradition-western-classical-music`.

### Batch 3 — Indian/Eastern/Islamic/Jewish Strand (music-eastern-1) — DISPATCHED 2026-05-16
Sama Veda, Natya Shastra, raga cosmology, Saraswati/vina, mantra, kirtan, AUM elaboration;
Arabic maqam, oud-lute transmission chain, Sufi sama; Sefer Yetzirah sound mysticism,
Torah cantillation, niggun. Agent owns: Indian, Arabic, Jewish music nodes.

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
