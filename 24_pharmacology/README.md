# 24 — Pharmacology, Materia Medica & Sacred Substances

**Lens slot 24** of the 26-lens ontology. New 2026-05-18. Holds nodes of type `substance`.

## What lives here

The *substances themselves* — herbs, sacred plants, minerals, animal products, prepared compounds — used in healing, ritual, alchemy, divination, mystical practice, or as cultural sacraments.

**Examples:**
- **Sacred plants:** soma (Vedic), haoma (Zoroastrian — likely linked to soma), ayahuasca (Amazonian), peyote (Mesoamerican Native American Church + Huichol), San Pedro / Wachuma, psilocybin mushrooms (Mesoamerican + modern), blue lotus (Egyptian), iboga (Bwiti), salvia divinorum (Mazatec), datura (cross-cultural), cannabis (Scythian / Vedic / Chinese / medical), opium poppy, mandrake, henbane, ephedra (possible candidate for haoma), kykeon ingredients (Eleusinian — ergot hypothesis), kava (Polynesian), tobacco (sacred use in Americas), coca (Andean).
- **Alchemical substances:** mercury, sulfur, salt (the *tria prima*), lead, gold, silver, antimony, vitriol, aqua regia, alkahest, lapis philosophorum (as claimed substance — overlaps with Alchemy folder; node can sit here OR there with cross-edge).
- **Medicinal staples cross-tradition:** ginseng, turmeric, willow bark (proto-aspirin), cinchona bark (quinine), nutmeg, mastic, frankincense, myrrh, aloes, silphium (lost antiquity drug), theriac (complex preparation).
- **Animal products in pharmacy:** bezoar stones, ambergris, musk, dragon's blood (resin), unicorn horn (claimed — usually narwhal tusk), Spanish fly.
- **Minerals in pharmacy:** sulfur, mercury, cinnabar (Chinese alchemical longevity), realgar, calomel.
- **Pharmacopoeia (the texts):** the *texts* themselves go in `02_documents/`, but each substance the text catalogs gets a node here. Six independent pharmacopoeia traditions: Sumerian medical tablets, Ebers Papyrus, Atharva Veda (Sushruta Samhita / Charaka Samhita), Hippocratic Corpus (medicinal sections), Charaka Saṃhitā (deep pharmacology), Shennong Bencao Jing.
- **Ritual / sacramental wine, bread, oils:** liturgical wine, chrism (anointing oil), katabasion oils, soma-pressing equipment vs. soma-substance.

## Why separate from Medicine

- **Medicine (`17_medicine/`)** = healing systems, traditions of healing (Ayurveda, Hippocratic, Islamic Golden Age, TCM, Asklepion, indigenous), specific healers/physicians, medical theory (humoural, dosha, five-phase).
- **Pharmacology (`24_pharmacology/`)** = the *substances themselves* with cross-cultural pharmacological + ritual + alchemical use.

The substances cross-cut domains in a way that pure medicine doesn't:
- **Soma** = Vedic ritual + medicine + theology + cosmology
- **Haoma** = Zoroastrian ritual + medicine
- **Kykeon** = Eleusinian mystery + medicine (ergot hypothesis)
- **Ayahuasca** = Amazonian shamanic + medicine + modern psychedelic-therapy literature
- **Mercury / Sulfur / Salt** = alchemy + medicine + metallurgy
- **Ergot** = Eleusinian + medicine + medieval St. Anthony's fire
- **Mandrake** = Genesis (Reuben/Leah) + medieval European magic + medicine
- **Blue lotus** = Egyptian ritual + cosmology + pharmacology
- **Cannabis / Hemp** = Scythian funerary + Vedic + Chinese + modern

Each substance is one node with edges into multiple domains.

ONTOLOGY.md MASSIVE-WINS already flags "six independent pharmacopeia traditions" as headline content — the volume is real.

## Why separate from Alchemy

Alchemy = the *practice*, *texts*, *practitioners*. Substances used in alchemy live here, cross-edged to the alchemical practitioner / text that uses them. Mercury as a substance is here; Paracelsus's mercury-philosophy is in `12_alchemy/`.

## What does NOT live here

- **Healers, physicians, alchemists (persons)** → `04_persons/`
- **Pharmacopoeia texts** → `02_documents/`
- **Healing traditions / systems** → `17_medicine/`
- **Alchemical processes and operations** (calcination, distillation, projection) → `12_alchemy/`
- **Sacred plants as cosmological symbols only** (the world-tree as concept) → `06_themes/` (becoming `06_motifs/`) and `09_symbols/`

## YAML skeleton (provisional)

```yaml
id: soma
title: Soma (Vedic sacred drink + plant)
type: substance
category: sacred-plant-and-preparation   # sacred-plant | botanical | mineral | animal-product | prepared-compound | sacrament-substance | psychoactive-plant | alchemical-substance | ritual-incense
botanical-candidates: [ephedra-sinica-candidate, amanita-muscaria-candidate, peganum-harmala-candidate, mountain-ephedra-candidate]
status-identification: contested
traditions-using: [vedic-religion, ancient-iranian-religion]
parallel-substance: haoma
parallel-substance-type: linguistic-cognate-and-ritual-cognate
key-documents: [rigveda-mandala-9, yasna-haoma-yasht]
key-rituals: [soma-yajna-pressing, ritual-soma-libation]
related-deities: [soma-deity, indra]
themes: [sacred-drink-of-immortality, soma-haoma-eucharist-sacred-drink-transmission-chain]
controversies: [wasson-amanita-hypothesis-T3, flattery-schwartz-peganum-harmala-T2, ephedra-candidate-T2]
refs:
  - title: "..."
    tier: 1
status: metadata
```

## Slug convention

Plants: scientific-name optional but clarifying — `soma`, `haoma`, `ayahuasca`, `peyote-lophophora`, `psilocybin-mushroom`, `blue-lotus-nymphaea-caerulea`, `ergot-claviceps`, `mandrake-mandragora`, `iboga-tabernanthe`, `cannabis-sativa`, `kykeon-eleusinian-compound`.

Alchemical: `mercury-alchemical`, `sulfur-alchemical`, `salt-alchemical-tria-prima`, `lapis-philosophorum-substance`.

Animal: `bezoar-stone`, `ambergris`, `dragons-blood-resin`.

When a substance has both pharmacological and deified form (Soma the drink + Soma the deity): two nodes — `soma` (substance, here) + `soma-deity` (in `03_deities/`), cross-linked.
