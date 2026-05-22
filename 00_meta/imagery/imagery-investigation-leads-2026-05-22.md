# Investigation leads — 2026-05-22 imagery sweep

Cross-tradition iconographic parallels and Wikidata-cluster oddities noticed
while hunting deity images. Brief notes; not investigated in depth.

## Wikidata defaults to "Christian-God" reading for non-Christian creator deities

Querying Wikidata for **Hunab Ku** (Yucatec Maya) returns description:
"Yucatec Maya name for the Christian God". This is not a translation quirk —
it's the actual Wikidata description. Hunab Ku's first-attested usage IS in
post-Conquest Catholic-translation contexts (the deity may not have a
pre-Conquest existence). Wikidata is silently encoding the syncretism /
colonial reinterpretation here, but presenting it as "this deity = the
Christian God" without context.

Similar: searching **Awonawilona** (Zuni creator) the article exists in
eswiki under "Awonawilona" with description "Creator god/godess in Zuni
mythology" — but Awonawilona is sometimes characterized in 19th-c. Anglo
ethnography as "Zuni Tao" or "Zuni Spinoza-pantheism". The
cross-tradition characterization is a recurring colonial-anthropology
pattern worth tracking.

## Single-image-stands-for-an-entire-pantheon pattern

When the French Wikipedia article for **Belenos** has no specific image, it
defaults to using the **Gundestrup cauldron** as a generic "Celtic deity"
image. Same pattern: the article for **Gugalanna** uses an image of
**Enki/Ea** as generic "Mesopotamian deity". Local-language Wikipedia
editors often pick a high-icon image from the broader pantheon and use it
as a default. This means the vault's `belenos` and `gugalanna` images are
not really of those deities — they are of the pantheon.

This is worth a research note: a node like `gundestrup-cauldron` is doing
TRIPLE iconographic duty across the Celtic pantheon. Same with the
Burney Relief for Mesopotamia (note: existing vault entry on `ereshkigal`
already uses the Burney Relief — a fourth use of this single image).

## The Met has a Tamil temple painting of Sundareshvara (Shiva-form)

Wikidata's P18 for **Sundareswarar** points directly to a Metropolitan
Museum object (2021.328) — a Tamil painting titled "Sundareshvara feeding
sugarcane to the elephant". This is rare: Wikidata usually points to
Commons files, but the file IS the Met's CC0 upload (the Met now mass-deposits
its public-domain holdings to Commons). The Met has been one of the most
active institutional Wikimedia contributors since 2017. WIN.

## Iconographic borrowing: the Suwāʿ statuettes

Searching the Arabic Wikipedia for **Suwāʿ** (سواع) returns a thumbnail
of YEMENI female statuettes (al-Jawf, 3rd–1st c. BCE) — but Suwāʿ was a
Hejazi-tribal idol (the Hudhayl tribe in western Arabia, not Yemen). The
Arabic Wikipedia editors are using South-Arabian pre-Islamic art as
context-for-North-Arabian deities. This is a research-pattern worth
flagging: pre-Islamic Arabian iconography is so sparse that the
Yemeni/Sabaean visual record gets repurposed across the entire peninsula's
pre-Islamic religious history.

## The three Munakata goddesses — one Wikidata node treats them as a unit

**Tagori-hime · Tagitsu-hime · Ichikishima-hime** each have their own
Wikidata entries, BUT the high-quality article (the one with iconography)
is the COLLECTIVE Q10948069 "Munakata Sanjojin / 宗像三女神". This
suggests the vault's three separate goddess nodes might benefit from a
"Munakata Triad" wrapper-node — the cult and shrine treats them as a
single tripartite goddess.

Compare: the vault probably has separate nodes for **Zorya** (one Wikidata
entry already merges Zoryas Polunoshnaya/Vechernyaya/Utrennyaya — Slavic
dawn-twilight-midnight triad). The triad pattern repeats: Greek Moirai,
Norse Norns, Slavic Zoryas, Japanese Munakata-sanjojin, Roman Parcae,
Etruscan Disciplina-trinity.

## Andean P18s are surprisingly thin

Of all the Inca/Andean deity nulls (mama-cocha, mama-quilla, wiraqocha,
hunab-ku indirectly), only **Viracocha** had a P18. The Inca pantheon
suffers most from the "no clear pre-Conquest iconography" problem — the
quipu-record tradition didn't preserve iconographic standards the way
Mesoamerican codices did. Worth a research note: this is a feature of
the post-conquest evidence destruction, not an "Inca religion was
aniconic" claim. The Spanish destroyed the huacas.

## Note: the AKAN/GHANA Nyame entry already uses a sigil, not a portrait

Found while scanning existing entries: `nyame` uses the **Gye Nyame
adinkra symbol** instead of a portrait. This is iconographically correct
because Nyame is aniconic in Akan tradition. The sigil-instead-of-portrait
pattern is the right move for aniconic deities; consider doing the same
for some of the NULL entries (Amma, Wakea, etc.) using their tradition's
sigil/ritual-object instead of a portrait.
