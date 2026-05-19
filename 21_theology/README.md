# 21 — Theology & Doctrinal Systems

**Lens slot 21** of the 26-lens ontology. New 2026-05-18. Holds nodes of type `doctrine`.

## What lives here

Specific worked-out doctrinal positions formulated *within* a religious tradition.

**Examples:**
- **Christology:** Chalcedonian Christology (451), Miaphysite Christology (Coptic / Tewahedo / Syriac Orthodox), Nestorian Christology, Monothelitism, Apollinarianism, Arianism, Adoptionism, Docetism.
- **Trinitarian theology:** Augustinian (Western), Cappadocian (Eastern), Filioque controversy, Monarchianism, Sabellianism, Subordinationism, Social Trinitarianism.
- **Mariology:** Theotokos doctrine, Immaculate Conception, Assumption, Co-Redemptrix theology, Marian apparitions theology.
- **Islamic theology (kalām):** Tawhid (in its specific Ash'arite / Mu'tazilite / Maturidite formulations), Atomism (Ash'arite occasionalism), Bila Kayfa, the divine attributes debates, Mu'tazilite createdness-of-Qur'an, Ash'arite responses.
- **Hindu theological systems:** Advaita Vedanta, Vishishtadvaita, Dvaita, Achintya-Bheda-Abheda, Trimurti, Trikāya (technically Buddhist; see below).
- **Buddhist doctrine:** Trikāya, Anatta, Pratītyasamutpāda (Dependent Origination), Two Truths, Tathāgatagarbha (Buddha-nature), Madhyamaka non-conceptual emptiness, Yogācāra mind-only.
- **Reformation theology:** Sola Scriptura, Sola Fide, Sola Gratia, Justification by Faith, Total Depravity, Predestination (Calvinist), Consubstantiation (Lutheran), Transubstantiation (Catholic, formalized 1215).
- **Mystical theology:** Apophatic theology (via negativa), Cataphatic theology (via positiva), Essence/Energies distinction (Palamite), Henosis (mystical union — when formalized as a doctrine), Apokatastasis.
- **Cross-tradition theological positions:** Panentheism, Pantheism, Theism (classical), Deism, Process theology, Monism, Dualism (as formal positions).

## Why separate from Philosophy

- **Theology** = systematic reflection *within* a religious tradition on its own claims, using that tradition's revelatory authority. Operates under doctrinal constraints; outputs are tradition-specific doctrines.
- **Philosophy** = rational inquiry that may or may not be religious. Operates under non-tradition-specific argumentation; outputs are philosophical positions.

Aquinas wrote both *Summa Theologica* (theology — Catholic doctrinal synthesis) AND Aristotelian commentaries (philosophy). Plotinus wrote both Neoplatonic metaphysics (philosophy) AND theurgic / mystical-union doctrines (theology-adjacent). Shankara wrote both Vedanta (theology within Hindu tradition) AND general epistemological arguments (philosophy).

Bernard McGinn, Sarah Coakley, Khaled Anatolios, Lewis Ayres — modern academic theology treats this distinction as bedrock.

## Why separate from Themes / Motifs

- **Motifs (06_themes/, becoming 06_motifs/)** = recurring narrative or conceptual *units that travel cross-tradition* (the flood motif, dying-rising god motif, divine kingship motif).
- **Doctrines** = specific worked-out positions *within* a tradition (Chalcedonian Christology = a specific 5th-c. Christian doctrinal position, not a cross-tradition motif).

The "resurrection of the dead" is a motif (appears in Zoroastrian, Jewish, Christian, Islamic forms). "Chalcedonian Christology" is a doctrine (a specific Christian position from the 451 council).

## YAML skeleton (provisional)

```yaml
id: chalcedonian-christology
title: Chalcedonian Christology
type: doctrine
category: christology    # christology | trinitarian | mariology | atonement | soteriology | eschatology | ecclesiology | scriptural-authority | mystical | cosmological
tradition: christianity-chalcedonian
date-formulated: 451
council-of-origin: council-of-chalcedon
key-figures: [leo-the-great, cyril-of-alexandria, theodoret-of-cyrrhus]
opposed-by: [miaphysite-christology, nestorian-christology]
parent-doctrine: nicene-orthodoxy
descendant-doctrines: [maximus-confessor-dyothelitism, scholastic-christology]
key-documents: [chalcedonian-definition, tome-of-leo]
themes: [hypostatic-union, two-natures-doctrine]
refs:
  - title: "..."
    tier: 1
status: metadata
```

## Slug convention

`chalcedonian-christology`, `miaphysite-christology`, `tawhid-doctrine`, `mariology-marian-doctrine`, `trikaya-doctrine`, `apophatic-theology`, `advaita-vedanta-doctrine`, `sola-scriptura-doctrine`, `predestination-calvinist`.

Use the most precise doctrinal name. Avoid generic terms like "monotheism" as a slug — instead `monotheism-classical-theism-position` or `ethical-monotheism-doctrine`.
