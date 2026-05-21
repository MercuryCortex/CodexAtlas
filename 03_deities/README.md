# 03 — Deities

**Lens slot 03** of the 26-lens ontology. Holds nodes of type `deity` — *any figure central enough to be the object of religious devotion within its framework*. The lens scope is **broader than "polytheistic god"** and intentionally so, because the vault's mission is cross-tradition comparison.

## What lives here (scope)

The lens covers **five distinct categories** of divine-figure, each filed under the same `type: deity` YAML for cross-tradition graph-navigability:

### 1. Polytheistic-pantheon deities
The default mental model: gods of polytheistic pantheons. *Zeus, Vishnu, Amaterasu, Quetzalcoatl, Inanna, Odin, Apollo, Hera, Thor, Hathor, Ganesha, etc.* The vault contains ~600+ of these.

### 2. Monotheistic supreme beings
The single deity of monotheistic traditions: *Allah, Yahweh, the Judeo-Christian Father*. These are theologically **NOT** "one god among many" — they are the sole divine reality within their framework. The `role` field of each node specifies the doctrinal status.

### 3. Trinitarian persons (Christian-specific)
The three Persons of the Trinity: *god-the-father-christian, jesus-christ-deity, holy-spirit-christian, the-trinity*. Christian doctrine asserts these are **one God in three Persons** (*homoousios* per Nicaea 325 + Constantinople 381). They are filed in 03_deities/ because Trinitarian theology treats each Person as fully divine, but the `role` field of each node explicitly notes the Trinitarian-doctrinal status to distinguish from polytheistic god-framing.

### 4. Composite / syncretic divine figures
Cross-tradition syncretic deities + late-antique constructions: *Serapis (Osiris-Apis-Zeus, Ptolemaic engineered fusion), Sol Invictus (Roman imperial sun-cult), Hermes Trismegistus (Greek-Egyptian Thoth-Hermes fusion), Christ Pantokrator (iconographic-theological synthesis figure)*. Filed in 03_deities/ because they functioned as objects of worship in their context.

### 5. Quasi-divine / borderline figures
Personified-divine principles + ancestor-deities + culture-heroes-become-divine: *Sophia-gnostic (personified divine Wisdom), the-one-plotinus (Plotinian hypostatic principle, philosophical not strictly cultic), Saoshyant (Zoroastrian future-savior), Maitreya (Buddhist future-Buddha), Imhotep (deified architect-physician, originally human), Apollonius of Tyana (Hellenistic theios-aner)*. The `role` field clarifies the borderline status case-by-case.

## What this is NOT

- **NOT only-polytheistic-gods** — the vault is cross-tradition; restricting 03_deities/ to polytheistic-pantheon would break cross-tradition comparative work
- **NOT a claim that monotheistic supremes + Trinitarian persons are "polytheistic-style gods"** — the doctrinal-status of each node is specified in its `role` field; the `tradition` field anchors each in its theological framework
- **NOT a doctrinal claim** about which figures are "real gods" — the vault catalogs figures-treated-as-divine within their framework, agnostic about external truth-claims

## Date-fields tier-discipline

Some deity nodes have `period-active-earliest` dates far older than direct textual attestation — particularly for **Aboriginal Australian (Waa the Crow, -60,000)** and **Khoisan San (ǀKaggen, -30,000)** figures, and for **Jain tirthankaras (Ṛṣabha, sentinel value representing the multi-million-year Jain cosmic cycle)**.

These dates reflect:
- **Tradition-antiquity arguments**: Aboriginal + San religious traditions have scholarly-defended continuity from 30,000-60,000 BCE based on rock-art + burial-site archaeology (Berndt, Flood, Stanner, McCarthy). The figure-as-named-figure is post-this in attestation, but the religious-tradition continuity argument is strong
- **Doctrinal-cosmic-cycle self-claims**: Jain mythology asserts Rishabha as first of 24 tirthankaras of the current vast cosmic age (millions of years). The date is a Jain doctrinal claim, not a scholarly historical-attestation. The sentinel value `-999999999` represents this distinctly from real dates.

**Methodology-discipline applied**: nodes with pre-9000-BCE dates carry methodological caveats in their `role` / `period-active-earliest` framing. Future field-design could split `period-active-earliest` into `direct-attestation-earliest` vs `tradition-antiquity-earliest` for cleaner tier-discipline. As-is, the per-node prose makes the distinction.

## Slug convention

Bare figure-name preferred (`zeus`, `apollo`, `inanna`, `allah`, `yahweh`). When multiple traditions share a figure-name, suffix-disambiguate: `isis-egyptian` vs `isis-hellenistic`; `jesus-of-nazareth` (person-lens, 04_persons/) vs `jesus-christ-deity` (deity-lens, 03_deities/). The vault uses the suffix when the disambiguation is theologically load-bearing.

## See also

- [[00_meta/ONTOLOGY-RATIONALE-2026-05-18]] — the 26-lens framework rationale
- 04_persons/ — historical persons (Jesus-of-Nazareth, Mary-of-Nazareth, etc. — distinguishable from their deity-counterparts)
- 21_theology/ — doctrinal-conceptual entries (vs. figural-divine entries here)
