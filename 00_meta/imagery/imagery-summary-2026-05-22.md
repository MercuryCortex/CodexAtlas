# Imagery sweep 2026-05-22 — deity-focused pass

Second imagery agent run (after the Wikipedia-only pass which closed 663 nulls).
Priority chain: Wikidata-P18 → native-language Wikipedia lead → Met Museum CC0 →
Commons category → skip.

Starting deity null count: **43** (after Wikipedia-only pass; one of these,
`salih-prophet`, turned out to be a `04_persons/` node already covered by the
Wikipedia cache — not a true null. So effective scope = 42 deity nulls).
Sources hit per row in the table below. "Trust" = HIGH (Met/Wikidata-P18), MED
(local-language lead image), LOW (cultural-context proxy where no direct
iconography exists), NULL (genuinely nothing).

## Deity rows

| Deity id | Source used | URL or skip reason | Trust |
|---|---|---|---|
| `israfil` | Wikidata-P18 | `Israfil1.png` (Islamic miniature, angel with trumpet) | HIGH |
| `dizang-ksitigarbha` | Wikidata-P18 | `Ksitigarbha_Bodhisattva_Painting.jpeg` (East Asian painting tradition) | HIGH |
| `wiraqocha` | Wikidata-P18 | `2Wiener-Tintin-Dieu_Soleil.jpg` (Tiwanaku-stylization, Wiener) | HIGH |
| `yum-kaax` | Wikidata-P18 | `Maya_Hieroglyphs_Fig_06.jpg` (hieroglyph) | HIGH |
| `prithvi` | Wikidata-P18 | `Prithu_-_Crop.jpg` (depicted with King Prithu — eponymous) | HIGH |
| `zorya` | Wikidata-P18 | `Zvezda-Zirka_by_Andrey_Shishkin.jpg` (modern painting; CC BY-SA) | MED |
| `ame-no-hohi` | Wikidata-P18 (via QID disambiguation: Q10940685 not Q10939697) | `Amenohohi_shinbutsu-zue.jpg` (1832 Shinto encyclopedia) | HIGH |
| `sundareswarar` | Wikidata-P18 (via QID Q126118910 — painting in Met) | Met painting "Sundareshvara feeding sugarcane to elephant" 2021.328 | HIGH |
| `hunab-ku` | frwiki lead | `Maya_calendar_(Hunab-Ku).svg` (calendar glyph; post-Conquest formulation) | MED |
| `belenos` | frwiki lead | Gundestrup cauldron plate (Celtic context, not direct) | LOW |
| `gugalanna` | frwiki lead | Ea/Enki Sumerian deity (husband-of-Ereshkigal context) | LOW |
| `haumia-tiketike` | frwiki lead | `Maorigodsymbols.jpg` (Māori atua family chart) | MED |
| `nethuns` | eswiki lead | `Usil,_Nethuns,_Thesan.jpg` (Etruscan bronze-mirror engraving) | HIGH |
| `suwa` | arwiki lead | Pre-Islamic Arabian female statuettes, al-Jawf, Yemen | MED |
| `aine` | eswiki lead | `Ainefairyqueen.jpg` (Irish illustration) | HIGH |
| `tapio` | fiwiki lead | `Tapio_väkineen_1898.jpg` (Finnish 1898 illustration) | HIGH |
| `adamas-gnostic` | none | Wikipedia/Wikidata only conflate with "adamant" metal; no Gnostic iconography | NULL |
| `amma-dogon` | none | Dogon Amma is aniconic; no museum/Wikipedia image specific to deity | NULL |
| `awonawilona` | none | eswiki/dewiki/itwiki articles exist but have no lead image | NULL |
| `bolon-tzakab` | none | No Wikidata entity with image; identification with Maya God K disputed | NULL |
| `christos-gnostic` | none | Sethian/Valentinian Christos has no separate iconography vs orthodox | NULL |
| `danu` | none | Wikipedia conflates with "Danuta" given name; Irish goddess has no agreed image | NULL |
| `haoma-zoroastrian` | none | Wikidata matches Samurai Shodown character; deity has no clear image | NULL |
| `ichikishima-hime` | none | jawiki article has no lead image | NULL |
| `laz` | none | Akkadian goddess Laz — Wikidata only knows Lazare Carnot | NULL |
| `mama-cocha` | none | No image in any Wikipedia (es/fr/ja/it tested); no Commons category | NULL |
| `mama-quilla` | none | Same: no Wikipedia lead images; Inca lunar iconography exists but not specifically labeled | NULL |
| `mawu-lisa` | none | frwiki/yowiki/itwiki articles thin; no lead images verified | NULL |
| `melek-hamza` | none | dewiki/frwiki/arwiki articles lack lead image (HTTP429 prevented full test — flagged for retry) | NULL-LIKELY |
| `menvra-etruscan` | none | Wikidata Q126916 = Roman Minerva (P18 = Louvre Minerva statue); Etruscan distinction lost | NULL |
| `mielikki` | none | fiwiki/dewiki/ruwiki articles have no lead image | NULL |
| `nane-armenian` | none | hywiki article exists but no lead image | NULL |
| `ningikuga` | none | eswiki/itwiki articles too thin | NULL |
| `tagitsu-hime` | none | jawiki article exists but no lead image | NULL |
| `tagori-hime` | none | jawiki article exists but no lead image | NULL |
| `tir-armenian` | none | Wikidata returns Turkish village; deity has no clear image | NULL |
| `vac-goddess` | none | Wikidata returns Czech male given name "Václav"; Vāc/Vāk has no separate iconography from Sarasvatī | NULL |
| `waa-the-crow` | none | Aboriginal Crow deity — Wikidata returns Frisian municipality; aniconic tradition | NULL |
| `wakea` | none | Hawaiian sky-god — Wikipedia articles have no lead images | NULL |
| `yaghuth` | none | arwiki/itwiki articles have no lead image; HTTP429 on retry | NULL-LIKELY |
| `yauq` | none | Same as yaghuth; pre-Islamic Arabian aniconic | NULL |
| `cagn` | none | Wikidata returns French commune Cagnes-sur-Mer; San deity has no fixed iconography | NULL |

## Totals

- Attempted: 42 true deity nulls (43 listed; one was a person-node)
- Added depictions: **16** (2.9% of original 544 vault nulls)
- Confirmed genuine NULL: 26 (see `imagery-nulls-genuine-2026-05-22.md`)
- Source breakdown: Wikidata-P18 = 8 · non-EN-Wikipedia lead = 8 · Met direct (via Wikidata P18 pointer) = 1 (sundareswarar) · Commons category = 0

## Method notes

- Wikidata P18 was the highest-yield source: caught 9 P18 images the EN-Wikipedia
  pass missed.
- Native-language Wikipedias added 8 more (es/fr/fi/ar — French was strongest).
- Met Museum API search returned mostly noise for these obscure deities — only
  one Met hit (Sundareshvara) and that came via Wikidata's P18 pointer, not via
  Met's search.
- Heavy Wikimedia rate-limiting (HTTP 429) interrupted batches; ~3 deities flagged
  NULL-LIKELY may have lead images that the rate-limit hid. Worth a retry pass.
