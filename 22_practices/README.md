# 22 — Mystical & Contemplative Practices

**Lens slot 22** of the 26-lens ontology. New 2026-05-18. Holds nodes of type `practice`.

## What lives here

Specific inner/contemplative methods — disciplined practices aimed at altered states, mystical union, ethical transformation, or insight.

**Examples:**
- **Christian:** centering prayer, lectio divina, the Jesus Prayer, hesychasm (Eastern Orthodox), Ignatian Spiritual Exercises, contemplative recitation of the Psalms, Quaker expectant silence.
- **Islamic / Sufi:** dhikr (repetitive remembrance — silent or vocal), sama (audition / spiritual music), muraqaba (contemplation), fana (extinction in God — as a practice path, not just a doctrine), fikr (reflection), Naqshbandi *khufiyya* (silent dhikr).
- **Jewish:** kabbalistic meditation on the sefirot, hitbonenut (Habad meditation), Merkavah ascent practices, kavvanot in prayer.
- **Buddhist:** vipassana (insight meditation), samatha (calm-abiding), anapanasati (mindfulness of breath), metta-bhavana (loving-kindness cultivation), jhana (absorption states), tonglen (giving-and-taking), shikantaza (Zen "just sitting"), koan practice, dzogchen rigpa-recognition, mahamudra, deity yoga (Vajrayana).
- **Hindu:** pranayama (breath disciplines), asana (postural practice, in its yogic-meditative sense), pratyahara (sense-withdrawal), dharana (concentration), dhyana (meditation), samadhi (absorption), japa (mantra-recitation), kundalini practices, trataka (steady gazing), Patañjali's eight-limb yoga (as a practice system).
- **Daoist:** neidan (internal alchemy), zuowang (sitting-and-forgetting), qigong, taiji (in its meditative form), shouyi (guarding-the-One).
- **Greek / philosophical:** Stoic *prosoche* (attention), Stoic morning/evening examinations, Plotinian contemplation of the One, Pythagorean breath-control, Hesychast prayer of the heart.
- **Indigenous / shamanic:** vision-quest practices, sweat-lodge contemplative use, plant-medicine ceremonial methods (when treated as practice; the plant itself is `24_pharmacology/`).
- **Modern:** Vipassana revival (Goenka method), Transcendental Meditation, mindfulness-based stress reduction (MBSR), Centering Prayer (Keating), Christian non-dual contemplation, etc.

## Why separate from Rituals

- **Rituals (`14_rituals/`)** = public/communal performative acts done for religious purpose (Eucharist, salat, puja, fire sacrifice, festival).
- **Practices (`22_practices/`)** = inner/contemplative disciplines, often private or small-group, aimed at transformation of consciousness or character.

The distinction is canonical in the academic study of mysticism — William James (*Varieties of Religious Experience*), Evelyn Underhill (*Mysticism*), Bernard McGinn (the multi-volume *Presence of God*), Bhaskar Mishra, Robert Forman.

Edge cases: dhikr in Sufi *halqa* (circle) is communal and ritual-shaped, AND a practice. Both nodes can exist with cross-edges; the practice carries the technique, the ritual carries the social form.

## Why separate from Philosophy

Practices are *methods*; philosophy includes theory *of* such methods but is not the method itself. Patañjali's *Yoga Sutras* is a philosophical text about yoga; the actual practice of asana / pranayama / dhyana is here.

## YAML skeleton (provisional)

```yaml
id: dhikr-sufi
title: Dhikr (Sufi remembrance)
type: practice
category: contemplative-recitation   # contemplative-recitation | meditation | breath-discipline | body-discipline | visualization | imageless-contemplation | service-as-practice | ascetic-discipline | initiatic-rite-of-practice | psychophysical-discipline
tradition: islam-sufism
parent-practice: islamic-prayer-tradition
key-figures: [rabia-al-adawiyya, ibn-arabi, rumi]
key-orders-using: [naqshbandi-order, mevlevi-order, qadiri-order, chishti-order]
texts-prescribing: [futuhat-al-makkiyya, masnavi-of-rumi]
techniques: [silent-dhikr-naqshbandi, vocal-dhikr, dhikr-with-movement]
related-doctrines: [tawhid-doctrine, fana-doctrine]
cross-tradition-edges:
  - target: jesus-prayer-hesychast
    type: parallel-form
    note: "Repetitive sacred-phrase contemplative recitation; mediated contact through Eastern Christian-Islamic Middle East"
  - target: japa-mantra-hindu
    type: parallel-form
    note: "Repetitive divine-name recitation as contemplative method"
refs:
  - title: "..."
    tier: 1
status: metadata
```

## Slug convention

`dhikr-sufi`, `hesychasm-prayer-of-the-heart`, `lectio-divina`, `vipassana-insight`, `samatha-calm-abiding`, `pranayama-yogic`, `neidan-daoist`, `centering-prayer-keating`, `tonglen-buddhist`, `kabbalistic-meditation-sefirot`, `merkavah-ascent-practice`.

Suffix with tradition when needed to disambiguate (`dhikr-sufi` vs. `dhikr-as-quranic-term`).
