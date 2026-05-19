# 08 — Places & Geographic Loci

**Lens slot 08** of the 26-lens ontology. Filled 2026-05-18 (was historically empty). Holds nodes of type `place`.

## What lives here

Geographic entities — cities, regions, civilizations, valleys, rivers — anywhere named that hosts religious, philosophical, or cultural activity.

**Examples:** Alexandria, Jerusalem, Mecca, Varanasi, Lhasa, Cuzco, Ife, Constantinople, Mount Sinai, the Nile delta, the Indus valley, Mesopotamia, Andalusia, Toledo, Chang'an, Timbuktu, Tenochtitlan.

## What does NOT live here

- **Sacred sites with primarily religious-architectural significance** → `20_sacred_architecture/` (Pyramid of Khufu, Hagia Sophia, Karnak, Borobudur — even though they're located in places)
- **Pure geographic features without cultural weight** → not in vault
- **Tradition / civilization concepts** (Egyptian religion, Vedic religion) → `07_traditions/`

A place that is *also* a sacred site (Mecca, Jerusalem) gets a `place` node here AND a `sacred-site` node in `20_`, cross-linked via edge. The `place` node carries geography + history; the `sacred-site` node carries religious-architectural detail.

## Why a separate lens (vs. tags on other nodes)

Places are cross-roads. Alexandria is where Greek + Egyptian + Jewish + Christian + Hermetic met. That cross-tradition convergence deserves its own node, not just a tag on each tradition. Standard historical-geography practice (Talbert's *Barrington Atlas*, the Cambridge ancient histories) treats places as first-class.

## YAML skeleton (provisional — see `00_meta/PROTOCOL.md` once finalized)

```yaml
id: alexandria
title: Alexandria
type: place
category: city          # city | region | civilization | valley | river | sacred-site
region: Egypt
lat: 31.2001
lon: 29.9187
date-founded: -331
traditions-active: [hellenistic-religion, christianity-coptic, judaism-hellenistic, hermeticism]
key-events: [foundation-of-alexandria, library-of-alexandria-destruction]
key-figures: [philo-of-alexandria, clement-of-alexandria, origen, hypatia]
key-documents: [hermetic-corpus, septuagint]
refs:
  - title: "..."
    tier: 1
status: metadata
```

## Slug convention

Kebab-case place names. `alexandria` / `jerusalem` / `mecca` / `mount-sinai` / `indus-valley` / `nile-delta-egypt`.

When ambiguous (Tripoli-Lebanon vs Tripoli-Libya), append disambiguator: `tripoli-lebanon` / `tripoli-libya`.
