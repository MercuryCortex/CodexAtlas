#!/usr/bin/env python3
"""
build_health_index.py — Codex Atlas DEV OVERVIEW data builder
=============================================================

Walks every content folder, counts nodes per lens, rolls traditions up
into ~14 curated FAMILIES, applies a scholarly ballpark baseline, emits
`src/data/health-index.json` consumed by `src/js/views/dev-overview.js`.

The baseline is a POINTER, not a target. Methodology described in the
panel itself + in the JSON's `methodology` block.

Run from repo root:
    python3 scripts/build_health_index.py

No deps beyond Python 3 stdlib.
"""

import os, re, json, sys
from collections import Counter, defaultdict
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


# ─────────────────────────────────────────────────────────────────────
# LENS REGISTRY
#
# Each row: (folder, label, baseline, baseline_note)
#
# `baseline` = ballpark per-lens target derived from Encyclopedia of
# Religion (Lindsay Jones, ed.; Macmillan, 2nd ed. 2005; 15 vols,
# ~3,300 articles) PLUS named supplements where EoR under-covers a
# domain. These are SCHOLARLY BALLPARKS — they encode the rough shape
# a mature cross-tradition reference should have, not a hard target.
# Round numbers on purpose; precision past ~25 is meaningless at this
# tier of estimation.
# ─────────────────────────────────────────────────────────────────────
LENSES = [
    ("01_timeline",                 "Timeline (index)",       0,  "Master index, not counted"),
    ("02_documents",                "Documents",            550,  "EoR — scripture + commentary entries across 15 vols (~16% of corpus)"),
    ("03_deities",                  "Deities",              900,  "EoR deity/numina entries + Leeming Oxford Companion to World Mythology (~3,000 entries)"),
    ("04_persons",                  "Persons",              750,  "EoR religious figures + Bowker Oxford Dict. World Religions biographical entries"),
    ("05_events",                   "Events",               300,  "EoR + Oxford Dict. of the Christian Church + Encyc. Iranica historical-event entries"),
    ("06_themes",                   "Themes / motifs",      350,  "EoR concept/topic entries (Bynum 2011 + Eliade themes vocabulary)"),
    ("07_traditions",               "Traditions",           280,  "EoR + Bowker — named living + extinct religious traditions and schools"),
    ("08_places",                   "Places",               220,  "EoR sacred-geography entries + Stewart Holy Places of the World"),
    ("09_symbols",                  "Symbols",              200,  "Cooper Encyclopedia of Symbols + Chevalier-Gheerbrant Dict. of Symbols"),
    ("10_music",                    "Music",                120,  "Grove Dict. of Music — religious-music entries + Nettl Excursions"),
    ("11_alphabets",                "Alphabets",             80,  "Daniels-Bright World's Writing Systems + sacred-script entries"),
    ("12_alchemy",                  "Alchemy",              140,  "Greer 2003 Encyc. of Hermetic & Occult Traditions — alchemy section"),
    ("13_morals",                   "Morals / ethics",      180,  "Singer Companion to Ethics + EoR ethical-systems entries"),
    ("14_rituals",                  "Rituals",              260,  "EoR ritual + Smith Imagining Religion + Bell Ritual: Perspectives"),
    ("15_philosophy",               "Philosophy",           300,  "Religious-philosophy slice of Stanford Encyc. Philosophy + Routledge Encyc. Philosophy"),
    ("16_mathematics",              "Mathematics",           60,  "Sacred-mathematics niche — Schimmel Mystery of Numbers + Lawlor Sacred Geometry"),
    ("17_medicine",                 "Medicine",              90,  "Porter Cambridge Illustrated Hist. of Medicine — religious/traditional-medicine slice"),
    ("18_languages",                "Languages",            120,  "Brown Encyc. of Lang. & Linguistics — sacred / liturgical language entries"),
    ("19_astronomy",                "Astronomy",             80,  "Walker Astronomy Before the Telescope + cultural-astronomy entries"),
    ("20_sacred_architecture",      "Sacred architecture",  220,  "Davies Penguin Dict. Religious Architecture + Kostof History of Architecture sacred slice"),
    ("21_theology",                 "Theology / doctrine",  240,  "EoR doctrine/dogma entries across all traditions"),
    ("22_practices",                "Practices",            220,  "EoR practice entries + Csordas Embodiment & Experience"),
    ("23_material_culture",         "Material culture",     180,  "Morgan Religion & Material Culture + relic / instrument / regalia entries"),
    ("24_pharmacology",             "Pharmacology",          70,  "Schultes-Hofmann Plants of the Gods + sacred-entheogen / pharmacy entries"),
    ("25_divination",               "Divination",           110,  "Greer 2003 + Loewe-Blacker Oracles & Divination cross-cultural entries"),
    ("26_calendars",                "Calendars",             70,  "Richards Mapping Time + Steel Marking Time religious-calendar entries"),
    ("27_attire",                   "Attire",                90,  "Welters-Lillethun Fashion Studies religious-vestment / regalia entries"),
    ("28_exchange_networks",        "Exchange networks",     80,  "Bentley Old World Encounters + Beckwith Empires of the Silk Road — religious-transmission routes"),
    ("29_technology",               "Technology",            70,  "Pacey Technology in World Civilization — religious-tech / sacred-craft entries"),
    ("31_consciousness",            "Consciousness",         90,  "James Varieties + Forman Innate Capacity + contemplative-studies entries"),
]


# ─────────────────────────────────────────────────────────────────────
# FAMILIES — 14-family high-level rollup. Each row: (key, label,
# baseline, matchers). A node is rolled up to the FIRST family whose
# matcher list (substring against lowercased `tradition:` field) hits.
# ─────────────────────────────────────────────────────────────────────
# ─────────────────────────────────────────────────────────────────────
# Discipline notes for the matcher lists:
#
# 1. Families are checked IN ORDER. The order is engineered so that
#    bare-word matchers in later families are safe — earlier families
#    catch their natural overlaps first.
#
#    Current order:
#      1  mesopotamian
#      2  egyptian
#      3  abrahamic        ← MUST come before greco-roman, so that
#                            "Greek Orthodox" / "Russian Orthodox" /
#                            "Coptic Orthodox" hit Abrahamic via
#                            "orthodox" before greco-roman's "greek"
#                            steals "Greek Orthodox" (the bug caught
#                            in the false-positive cross-check on
#                            2026-05-29).
#      4  greco-roman      ← bare "greek" / "graeco" / "greco" safe
#                            here because anything Christian is
#                            already routed.
#      5  iranian
#      6  indic
#      7  buddhist
#      8  east-asian       ← bare "chinese" safe (Buddhist + Abrahamic
#                            catch Chinese Buddhism / Chinese Catholic
#                            first).
#      9  north-european
#     10  african          ← bare "african" safe (Abrahamic catches
#                            African Catholic / Methodist first;
#                            Egyptian catches Kemetic-African first).
#     11  mesoamerican
#     12  andean-amazonian
#     13  indigenous-other
#     14  modern-syncretic
#
# 2. NEVER add bare "roman" to greco-roman — would steal "Roman
#    Catholic" / "Roman Catholic Jesuit" from Abrahamic. Use multi-word
#    or suffixed forms only.
#
# 3. Wikilink + hyphenated variants must be explicitly matched. The
#    `tradition:` field appears as `"Roman religion"` (space) AND
#    `"[[tradition-roman-religion]]"` (hyphens, stripped of brackets).
#    Each family needs both forms where relevant.
#
# 4. New matchers added 2026-05-29 rigor pass are marked with end-of-
#    line comments — `# +RIGOR` (first pass), `# +RIGOR2` (second pass),
#    `# +RIGOR3` (third pass). The progression 196 → 49 → 24 → 0
#    accidental-unclassified is the integrity signal.
#    See `scripts/_audit_classifier.py` for the diagnostic survey.
#
# 5. SANITY_CASES below run at every build and abort the build on
#    regression. To add a new tricky case, append it there.
# ─────────────────────────────────────────────────────────────────────
FAMILIES = [
    {
        "key": "mesopotamian", "label": "Mesopotamian", "baseline": 280,
        "matchers": ["sumer", "akkad", "babyl", "assyr", "mesopotam", "uruk",
                     "old-babylonian", "neo-babylonian", "neo-assyrian", "kassite",
                     "eridu", "nineveh", "ugarit", "canaanite", "phoenic", "ammonite",
                     "moabite", "edomite", "aramean", "amorite", "elamite",
                     "hittite", "hurrian", "hattic", "hurrian–hittite", "hurrian-hittite",  # +RIGOR Anatolian
                     "anatolian", "urartian"],                                             # +RIGOR Anatolian
    },
    {
        "key": "egyptian", "label": "Egyptian", "baseline": 240,
        "matchers": ["egypt", "kemetic", "amarna", "ptolema", "memphis", "thebes",
                     "heliopolis", "hermopolis"],
    },
    {
        # NOTE 2026-05-29 RIGOR4: Abrahamic moved BEFORE Greco-Roman so
        # "Greek Orthodox" / "Coptic Orthodox" / Greek-named Abrahamic
        # variants route correctly. Greco-Roman's bare "greek" matcher
        # was previously stealing these.
        "key": "abrahamic", "label": "Abrahamic", "baseline": 700,
        "matchers": ["christ", "judaism", "jewish", "israel", "rabbinic",
                     "patristic", "byzantin", "catholic", "orthodox", "protestant",
                     "reformation", "calvinist", "lutheran", "anglican", "methodist",
                     "baptist", "puritan", "evangelic", "pentecost", "mormon",
                     "islam", "muslim", "sunni", "shia", "shi'a", "ismaili", "sufi",
                     "kharijit", "ibadi", "ahmadi", "bahai", "baha'i", "druze",
                     "samaritan", "second-temple", "second temple", "essene",
                     "qumran", "kabbal", "hasid", "mizrahi", "sephardi", "ashkenazi",
                     "yazidi", "alevi", "ethiopian-orthodox", "ethiopian orthodox",
                     "tewahedo", "coptic", "armenian-apostolic", "armenian apostolic",
                     "syriac", "maronite", "nestorian", "assyrian-church", "monophysite",
                     "manichae", "mandaean", "gnostic", "valentinian", "sethian",
                     "marcion", "cathar", "bogomil", "messianic",
                     "hebrew", "old testament", "judah", "judahite",              # +RIGOR Hebrew-Bible literal
                     "bahá",                                                      # +RIGOR catches the regex-fix Bahá'í
                     "ismā",                                                      # +RIGOR catches Ismā'īlī
                     "knights-templar", "knights templar", "templar",             # +RIGOR Templar (historical Catholic; "templar-influenced architecture")
                     "montanism", "donatist", "arian",                            # +RIGOR Christian heresies
                     "russian orthodox", "greek orthodox",                        # +RIGOR Eastern Orthodox specifics
                     "abrahamic",                                                 # +RIGOR explicit family tag
                     "monarchianism", "sabellian", "modalist",                    # +RIGOR2 Trinitarian heresies
                     "frankism", "sabbatean",                                     # +RIGOR2 Jewish Sabbatean offshoot
                     "crusade mythology", "crusade legend",                       # +RIGOR2 medieval crusade
                     "portuguese medieval history", "portuguese national",       # +RIGOR2 Iberian-Catholic
                     "unification church", "moonies",                             # +RIGOR2 Moon's Unification Church
                     "jesuit", "society of jesus",                                # +RIGOR3 Jesuits
                     "jehovah", "watch tower", "bible student",                   # +RIGOR3 JW movement
                     "herodian", "roman-judean",                                  # +RIGOR3 Herodian Judea
                     "tradition-baha",                                            # +RIGOR3 Bahá'í wikilink variant
                     "septuagint", "lxx", "bible", "biblical",                   # +RIGOR4 LXX / Bible alone
                     "mevlevi", "tradition-mevlevi"],                             # +RIGOR5 Mevlevi Sufi order (Rumi)
    },
    {
        "key": "greco-roman", "label": "Greco-Roman", "baseline": 380,
        # NEVER add bare "roman" here — would steal "Roman Catholic" from
        # Abrahamic (still — Abrahamic now comes earlier, but defensive
        # discipline: the matcher list should be self-justifying).
        "matchers": ["greek", "graeco", "greco", "roman religion", "etruscan",
                     "minoan", "mycen", "orphic", "eleusin", "dionysian",
                     "olympian", "stoic", "epicurean", "neoplaton", "platon",
                     "pythagor", "hellenist", "hermet", "mithra", "isiac",
                     "imperial-cult", "imperial cult", "sol invictus",
                     "roman-religion", "roman state", "roman imperial",          # +RIGOR hyphenated + variants
                     "roman aristocratic", "roman mystery", "roman pagan",       # +RIGOR
                     "roman cult", "roman state cult",                           # +RIGOR
                     "theurgy", "chaldean oracle", "isis-mysteries",             # +RIGOR late-antique mystery
                     "lusitan",                                                  # +RIGOR Iberian-Roman frontier
                     "hellenic", "hellenistic", "seleucid",                      # +RIGOR2 Hellenistic specifics
                     "roman (founding", "roman founding",                        # +RIGOR2 Roman founding-mythology
                     "tartess"],                                                 # +RIGOR2 Iberian Tartessos
    },
    {
        "key": "iranian", "label": "Iranian / Zoroastrian", "baseline": 180,
        "matchers": ["zoroast", "mazdaism", "mazdean", "parsi", "avestan",
                     "achaemenid", "sasanian", "sassanian", "parthian", "median",
                     "khvarenah", "iranian", "old-iranian",
                     "mazdakism", "khurramite", "kurramite",                      # +RIGOR post-Sasanian heretics
                     "persian zoroastrian", "iranian-religion"],                  # +RIGOR variant spellings
    },
    {
        "key": "indic", "label": "Indic (Hindu / Jain / Sikh)", "baseline": 520,
        "matchers": ["hindu", "vedic", "vaishn", "shaiva", "shakta", "smarta",
                     "tantric", "shaivite", "vaishnavite", "advait", "vishishtadvaita",
                     "dvaita", "samkhya", "yoga", "mimam", "nyaya", "vaisheshika",
                     "carvaka", "ajivika", "bhakti", "jain", "digambara", "shvetambara",
                     "sikh", "sant", "kabir", "south-asian", "south asian",
                     "indian-modern", "indian modern", "indian classical",
                     "indo-aryan", "indus", "harappan",
                     "tradition-tantra", "tantra"],                               # +RIGOR3 Tantra wikilink form
    },
    {
        "key": "buddhist", "label": "Buddhist", "baseline": 380,
        "matchers": ["buddh", "theravada", "mahayana", "vajrayana", "tibet",
                     "zen", "chan", "pure-land", "pure land", "nichiren", "shingon",
                     "tendai", "kagyu", "nyingma", "sakya", "gelug", "bon-po", "bon ",
                     "bonpo", "abhidharma", "madhyamaka", "yogacara", "huayan",
                     "tiantai", "rinzai", "soto", "obaku",
                     "tradition-bon", "tibetan bon", "yungdrung bon"],            # +RIGOR Tibetan Bön wikilink forms
    },
    {
        "key": "east-asian", "label": "East Asian (Daoist / Confucian / folk)", "baseline": 320,
        # Bare "chinese" is safe here — Buddhist (#7) catches Chinese Buddhism
        # via "buddh" before this family sees it; Abrahamic catches Chinese
        # Catholic via "catholic" earlier still.
        "matchers": ["dao", "tao", "confuc", "neo-confuc", "shinto", "shintō",
                     "shinbutsu", "shugendo", "shugendō", "chinese folk",
                     "chinese-folk", "chinese popular", "yin-yang", "yin yang",
                     "five-elements", "five elements", "wuxing", "huang-lao",
                     "huanglao", "celestial-masters", "celestial masters",
                     "quanzhen", "shangqing", "lingbao", "korean", "joseon",
                     "vietnamese", "cao-dai", "cao đài", "caodai", "cheondogyo",
                     "tenrikyo", "tenrikyō", "legalism", "mohism",
                     "chinese", "zhou-classical", "han-period",                   # +RIGOR catches bare-chinese variants
                     "tradition-chinese-religion",                                # +RIGOR exact wikilink
                     "donghak", "tonghak",                                        # +RIGOR Korean Donghak
                     "tradition-japanese-medieval", "japanese medieval",          # +RIGOR3 Heian/Kamakura
                     "japanese"],                                                 # +RIGOR3 bare "japanese" (Buddhist still wins for Japanese-Zen via "zen")
    },
    {
        "key": "north-european", "label": "Norse / Celtic / Slavic / Baltic", "baseline": 220,
        "matchers": ["norse", "germanic", "viking", "anglo-saxon", "anglo saxon",
                     "celtic", "irish", "welsh", "gaelic", "druid", "gaulish",
                     "slavic", "slavonic", "polish", "russian-pagan", "baltic",
                     "lithuanian", "latvian", "prussian", "finnic", "finnish",
                     "estonian", "sámi", "sami", "saami",
                     "finno-karelian", "karelian", "kalevala",                    # +RIGOR Finnic specifics
                     "megalithic-atlantic", "atlantic megalithic",                # +RIGOR pre-IE Western Europe
                     "asatru", "heathenry", "ásatrú"],                            # +RIGOR2 Modern Heathen Norse revival
    },
    {
        "key": "african", "label": "African (Yoruba / Bantu / Akan / Nilotic etc.)", "baseline": 260,
        # Bare "african" is safe — Abrahamic catches "African Catholic" /
        # "Ethiopian Orthodox" via earlier matchers; Egyptian catches
        # "Kemetic-African" (we have that exact term) but only matches
        # "egypt" / "kemetic-african" already.
        "matchers": ["yoruba", "ifa", "ifá", "vodou", "vodun", "santeria", "santería",
                     "candomble", "candomblé", "lukumi", "lukumí", "palo", "macumba",
                     "ashanti", "akan", "bantu", "zulu", "shona", "khoisan",
                     "nilotic", "dinka", "nuer", "maasai", "berber", "amazigh",
                     "tuareg", "dogon", "fon", "ewe", "igbo", "edo", "fulani",
                     "mande", "mandinka", "bambara", "kongo", "kikongo", "swahili",
                     "ethiopian-traditional", "oromo", "rastafari", "kemetic-african",
                     "african", "pan-african", "west african",                    # +RIGOR bare-word catches
                     "central african", "southern african", "east african",       # +RIGOR
                     "tradition-african-traditional", "mami wata",                # +RIGOR specific
                     "tradition-san-bushmen", "san-bushmen", "san bushmen"],      # +RIGOR3 San / Khoisan wikilink
    },
    {
        "key": "mesoamerican", "label": "Mesoamerican", "baseline": 180,
        "matchers": ["maya", "mayan", "aztec", "mexica", "nahua", "toltec",
                     "olmec", "zapotec", "mixtec", "purepecha", "tarascan",
                     "huastec", "mesoamerican",
                     "k'iche", "kiche", "quiche", "popol vuh tradition",          # +RIGOR K'iche' Maya
                     "tradition-teotihuacan", "teotihuacan"],                     # +RIGOR3 classical Mesoamerican wikilink
    },
    {
        "key": "andean-amazonian", "label": "Andean / Amazonian", "baseline": 120,
        "matchers": ["inca", "andean", "quechua", "aymara", "moche", "nazca",
                     "chavin", "chavín", "tiwanaku", "tiahuanaco", "amazonian",
                     "amazon", "shipibo", "ashaninka", "achuar", "yanomami"],
    },
    {
        "key": "indigenous-other", "label": "Indigenous (N.American / Oceanic / Australian / Arctic)", "baseline": 200,
        "matchers": ["lakota", "navajo", "diné", "dine", "hopi", "pueblo",
                     "cherokee", "iroquois", "haudenosaunee", "ojibwe", "anishinaabe",
                     "inuit", "yup'ik", "yupik", "aleut", "siberian", "tungus",
                     "yakut", "evenk", "polynesian", "maori", "māori", "hawaiian",
                     "tongan", "samoan", "tahitian", "melanesian", "papuan",
                     "micronesian", "aboriginal", "australian-indigenous",
                     "lenape", "delaware-eastern", "algonquian", "algonkian",    # +RIGOR Eastern Algonquian
                     "paiute", "ghost dance", "pan-tribal",                       # +RIGOR2 Northern Paiute Ghost Dance
                     "tradition-native-american", "native american",              # +RIGOR3 wikilink form
                     "tradition-plains-indigenous", "plains indigenous",          # +RIGOR3 wikilink form
                     "tradition-mississippian", "mississippian",                  # +RIGOR3 N. American mound-builders
                     "tradition-shamanism", "shamanism"],                         # +RIGOR3 shamanism → indigenous-other (most-associated)
    },
    {
        "key": "modern-syncretic", "label": "Modern / syncretic / esoteric", "baseline": 240,
        "matchers": ["theosoph", "anthroposoph", "rosicrucian", "rose-cross",
                     "freemason", "masonic", "golden-dawn", "golden dawn",
                     "thelema", "thelemic", "wicca", "neo-pagan", "neopagan",
                     "neoplatonic-modern", "new-age", "new age", "new-thought",
                     "new thought", "scientolog", "transcendental",
                     "fifth-empire", "sebastianist", "comparative-religion",
                     "perennial", "perennialism", "guénon", "traditionalist-school",
                     "academic", "secular-philosoph", "secular philosoph",
                     "western-philosoph", "modern philosophy", "process-theology",
                     "process theology",
                     "jungian", "depth psychology",                               # +RIGOR Jung
                     "blakean", "blake mythology",                                # +RIGOR Blake
                     "paracelsian", "sendivogian", "ripley",                      # +RIGOR alchemy schools
                     "renaissance alchemy", "medieval-renaissance alchemy",       # +RIGOR
                     "english medieval-renaissance alchemy",                      # +RIGOR
                     "german renaissance alchemy",                                # +RIGOR
                     "anglo-american alchemy", "alchemy / paracelsian",           # +RIGOR
                     "starkey", "basil valentine",                                # +RIGOR alchemy names
                     "sebastianism", "tradition-sebastianism",                    # +RIGOR Sebastianist wikilink form
                     "fourth way", "gurdjieff", "ouspensky",                      # +RIGOR Fourth Way
                     "laveyan", "satanism", "modern pagan",                       # +RIGOR LaVeyan
                     "pseudoarchaeology", "alternative-history",                  # +RIGOR Hancock / Däniken
                     "american esoteric", "trance prophecy", "cayce",             # +RIGOR Cayce
                     "american pragmatism", "psychology of religion",             # +RIGOR William James
                     "french enlightenment", "enlightenment",                     # +RIGOR Rousseau / Voltaire
                     "voynich",                                                   # +RIGOR Voynich (edge: undeciphered esoteric)
                     "analytic philosophy", "continental philosophy",             # +RIGOR2 20th-c. academic philosophy
                     "british empiricism", "whig political",                      # +RIGOR2 Enlightenment-era political philosophy
                     "cognitive neuroscience", "philosophy of mind",              # +RIGOR2 cog-sci of religion
                     "western psychology", "psychoanalysis",                      # +RIGOR2 psychoanalytic religious-studies
                     "comparative religion",                                      # +RIGOR2 catches non-hyphenated form
                     "florentine renaissance", "renaissance esoteric",            # +RIGOR2 Ficino/Pico territory
                     "angelic magic", "natural philosophy",                       # +RIGOR2 Dee, Bruno, Kepler-Tycho era
                     "priory of sion",                                            # +RIGOR2 Plantard/Dan Brown territory
                     "conspiratorial-literary",                                   # +RIGOR2 20th-c. French esoteric milieu
                     "american populist", "popular esoteric",                     # +RIGOR2 Donnelly Atlantis-Antediluvian era
                     "tradition-western-esotericism", "western esotericism",      # +RIGOR3 Faivre/Hanegraaff scholarly term
                     "tradition-mystery-cults", "mystery cults",                  # +RIGOR3 cross-Hellenistic mystery cults
                     "tradition-modern-recovery", "modern recovery",              # +RIGOR3 12-step movement
                     "tradition-alchemy-european", "alchemy-european",            # +RIGOR3 European alchemy wikilink
                     "medieval european mathematics",                             # +RIGOR3 Fibonacci-era specific
                     "habsburg imperial", "renaissance occultism",                # +RIGOR3 Rudolfine Prague era
                     "modern religious studies",                                  # +RIGOR3 academic religious-studies
                     "comparative anthropology"],                                 # +RIGOR3 academic anthropology
    },
]


# ─────────────────────────────────────────────────────────────────────
# INTENTIONAL_CROSS_TRADITION — exact-match (lowercased) tradition values
# that we DELIBERATELY leave unclassified because they are genuinely
# cross-tradition, comparative, or unclassifiable. These count toward
# `vault.intentionallyCrossTradition` in the JSON so the panel can
# distinguish "classifier gap" from "genuinely cross-tradition" — a real
# integrity signal vs noise.
# ─────────────────────────────────────────────────────────────────────
INTENTIONAL_CROSS_TRADITION = {
    "cross-tradition",
    "unknown / undeciphered",                                  # Voynich, etc.
    "portuguese renaissance literature (literary mythology)",  # Camões Adamastor — literary not religious
}

# Prefix-based intentional set — any tradition value STARTING with one of
# these strings is treated as deliberately cross-tradition. Avoids having
# to enumerate every "cross-tradition (every major religious tradition
# has X practices)" variant.
INTENTIONAL_PREFIXES = (
    "cross-tradition (",
    "(pre-tradition",
    "(pre-pottery",
    "pre-tradition",
)


# Two-stage YAML scalar parser per field. The previous single regex
# `^tradition:\s*[\"\']?([^\"\'\n]+)` truncated at the FIRST quote char it
# saw — fatal for values like `tradition: "Bahá'í Faith"` (captured "Bahá",
# missed the rest) or `tradition: "K'iche'"` (captured "K"). The fix:
# detect the leading quote (double-quoted / single-quoted / unquoted)
# and only stop at the matching closing quote (or end-of-line for
# unquoted values). Internal apostrophes in a double-quoted string are
# preserved verbatim.
_LINE_RX = {
    "tradition": re.compile(r'^tradition:\s*(.*)$', re.M),
    "status":    re.compile(r'^status:\s*(.*)$',    re.M),
    "type":      re.compile(r'^type:\s*(.*)$',      re.M),
}

def _strip_yaml_scalar(raw):
    """Pull the scalar value out of a YAML field-value line, respecting
    quote-style. Trailing inline comments (after a leading space + #)
    are stripped from unquoted values per YAML 1.2."""
    s = raw.strip()
    if not s:
        return None
    if len(s) >= 2 and s[0] == '"' and s.rstrip().endswith('"'):
        return s.rstrip()[1:-1]
    if len(s) >= 2 and s[0] == "'" and s.rstrip().endswith("'"):
        return s.rstrip()[1:-1]
    # Unquoted: strip trailing inline comment per YAML 1.2 (`value # comment`)
    # but only when the # is preceded by whitespace (a # inside an identifier
    # like `tradition-x#y` should be preserved, though that's improbable here).
    m = re.match(r'^([^#]*?)\s+#.*$', s)
    if m:
        s = m.group(1).rstrip()
    return s or None

FIELD_RX = _LINE_RX  # kept for back-compat with any caller

def extract(text):
    out = {}
    for k, rx in _LINE_RX.items():
        m = rx.search(text)
        if not m:
            out[k] = None
            continue
        raw = _strip_yaml_scalar(m.group(1))
        out[k] = raw.lower() if raw else None
    return out


def classify_family(trad):
    if not trad:
        return None
    t = trad.lower().replace("[", "").replace("]", "").strip()
    for fam in FAMILIES:
        for m in fam["matchers"]:
            if m in t:
                return fam["key"]
    return None


# ─────────────────────────────────────────────────────────────────────
# Sanity-check the matcher tables against known-tricky strings before
# walking the vault. False positives caught here = real bug.
# ─────────────────────────────────────────────────────────────────────
SANITY_CASES = [
    # (tradition_value, expected_family_key, why_this_matters)
    ("Roman Catholic",                "abrahamic",        "Greco-Roman must not steal Catholic"),
    ("Greek Orthodox",                "abrahamic",        "Greco-Roman's 'greek' must not steal Eastern Orthodox (RIGOR4 reorder)"),
    ("Russian Orthodox",              "abrahamic",        "North-european must not steal Russian-anything"),
    ("Coptic Orthodox",               "abrahamic",        "Egyptian/Coptic specific routes to Abrahamic"),
    ("Chinese Buddhism",              "buddhist",         "East Asian must not steal Chinese Buddhists"),
    ("Japanese Buddhist",             "buddhist",         "Buddhist must catch before East Asian"),
    ("African Catholic",              "abrahamic",        "African must not steal Catholic"),
    ("Roman religion",                "greco-roman",      "Roman religion → Greco-Roman"),
    ("Hellenic (Iliad)",              "greco-roman",      "Hellenic forms"),
    ("[[tradition-roman-religion]]",  "greco-roman",      "Wikilink hyphenated form"),
    ("Bahá'í Faith",                  "abrahamic",        "Regex fix: internal apostrophe must not truncate"),
    ("K'iche'",                       "mesoamerican",     "Regex fix: leading-apostrophe must not truncate"),
    ("Ismā'īlī",                      "abrahamic",        "Regex fix: Ismā'īlī"),
    ("tradition-african-traditional", "african",          "Hyphenated wikilink form"),
    ("Hittite (with Hattic substrate)", "mesopotamian",   "Anatolian → Mesopotamian per EoR grouping"),
    ("Jungian depth psychology",      "modern-syncretic", "Jung → modern syncretic"),
    ("[[tradition-bon]]",             "buddhist",         "Tibetan Bön wikilink"),
    ("Chinese / Legalist",            "east-asian",       "Bare-Chinese variant"),
    ("Hebrew Bible / Old Testament",  "abrahamic",        "Hebrew literal"),
    ("Jesuit (Society of Jesus)",     "abrahamic",        "Catholic Jesuit order"),
    ("Templar Order (medieval Catholic military)", "abrahamic", "Templar with multi-word context"),
    ("Septuagint Greek Bible",        "abrahamic",        "LXX must route to Abrahamic, not Greco-Roman via 'greek'"),
    ("Hellenistic Judaism",           "abrahamic",        "Jewish-Hellenistic phenomenon routes to Abrahamic"),
]

def run_sanity_check():
    """Exit nonzero if any matcher promise breaks. The audit script
    (`scripts/_audit_classifier.py`) and the build are both protected
    by these — if you add a matcher that accidentally re-routes a known
    case, the build refuses."""
    failures = []
    for trad, expected, why in SANITY_CASES:
        actual = classify_family(trad.lower())
        if actual != expected:
            failures.append((trad, expected, actual, why))
    if failures:
        print("\n========== CLASSIFIER SANITY FAILURES ==========")
        for trad, expected, actual, why in failures:
            print(f"  {trad!r}")
            print(f"     expected: {expected}")
            print(f"     got     : {actual}")
            print(f"     why     : {why}")
        print("================================================\n")
        sys.exit(2)


def main():
    run_sanity_check()
    per_lens = []
    family_counts = Counter()
    family_lens_grid = defaultdict(lambda: Counter())
    unmatched_traditions = Counter()
    intentional_unclassified_count = 0
    accidental_unclassified_count = 0
    grand_total_nodes = 0

    for folder, label, baseline, note in LENSES:
        path = os.path.join(ROOT, folder)
        n = 0
        statuses = Counter()
        if os.path.isdir(path):
            for dirpath, dirnames, filenames in os.walk(path):
                dirnames[:] = [d for d in dirnames if not d.startswith(".")]
                for fn in filenames:
                    if not fn.endswith(".md"):
                        continue
                    if fn.upper().startswith("README"):
                        continue
                    full = os.path.join(dirpath, fn)
                    try:
                        with open(full, encoding="utf-8") as fh:
                            head = fh.read(4000)
                    except Exception:
                        continue
                    n += 1
                    grand_total_nodes += 1
                    meta = extract(head)
                    statuses[meta["status"] or "(no status)"] += 1
                    fam = classify_family(meta["tradition"])
                    if fam:
                        family_counts[fam] += 1
                        family_lens_grid[fam][folder] += 1
                    elif meta["tradition"]:
                        # Distinguish intentionally-cross-tradition from
                        # classifier-gap accidents. The former is a real
                        # editorial choice; the latter is a coverage bug.
                        trad_norm = meta["tradition"].lower().strip().rstrip("'\"")
                        if (trad_norm in INTENTIONAL_CROSS_TRADITION
                                or any(trad_norm.startswith(p) for p in INTENTIONAL_PREFIXES)):
                            intentional_unclassified_count += 1
                        else:
                            accidental_unclassified_count += 1
                            unmatched_traditions[meta["tradition"][:80]] += 1
        ratio = (n / baseline) if baseline > 0 else None
        if ratio is None:
            band = "index"
        elif ratio < 0.25:
            band = "anemic"
        elif ratio < 0.60:
            band = "developing"
        elif ratio < 1.5:
            band = "rich"
        else:
            band = "over-baseline"
        per_lens.append({
            "folder":   folder,
            "label":    label,
            "count":    n,
            "baseline": baseline,
            "ratio":    round(ratio, 3) if ratio is not None else None,
            "band":     band,
            "baselineNote": note,
            "statuses": dict(statuses),
        })

    per_family = []
    for fam in FAMILIES:
        count = family_counts[fam["key"]]
        ratio = count / fam["baseline"] if fam["baseline"] else 0
        if ratio < 0.25:    band = "anemic"
        elif ratio < 0.60:  band = "developing"
        elif ratio < 1.5:   band = "rich"
        else:               band = "over-baseline"
        per_family.append({
            "key":      fam["key"],
            "label":    fam["label"],
            "count":    count,
            "baseline": fam["baseline"],
            "ratio":    round(ratio, 3),
            "band":     band,
            "perLens":  dict(family_lens_grid[fam["key"]]),
        })

    out = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "vault": {
            "totalNodes":                 grand_total_nodes,
            "lensCount":                  len(LENSES),
            "familyCount":                len(FAMILIES),
            "unmatchedTradNodes":         accidental_unclassified_count,
            "intentionallyCrossTradition": intentional_unclassified_count,
        },
        "lenses":   per_lens,
        "families": per_family,
        "methodology": {
            "baselineSource": (
                "Encyclopedia of Religion (Lindsay Jones, ed.; Macmillan, "
                "2nd ed. 2005; 15 vols, ~3,300 articles) — the standard "
                "modern tertiary reference for cross-tradition religious "
                "studies. Per-lens supplements named in baselineNote where "
                "EoR under-covers (esoteric / divination / pharmacology / "
                "material-culture / etc.). Round-number ballpark — encodes "
                "the SHAPE a mature cross-tradition vault should have, not "
                "a hard target. Precision past ~25 entries is meaningless "
                "at this estimation tier."
            ),
            "bands": {
                "anemic":       "ratio < 25% — lens is starved; ingest needed",
                "developing":   "ratio 25% - 60% — coverage forming, gaps remain",
                "rich":         "ratio 60% - 150% — within scholarly-reference range",
                "over-baseline":"ratio > 150% — beyond EoR coverage (Atlas-original territory)",
            },
            "familyClassification": (
                "Nodes are rolled up to families by substring-matching "
                "their `tradition:` YAML field against ordered family "
                "matchers. The vault's `tradition:` field has free-form "
                "naming drift (1,123 distinct values observed); a curated "
                "matcher list is more honest than pretending the field "
                "is clean. Nodes are split into two unclassified buckets: "
                "`vault.intentionallyCrossTradition` (genuinely "
                "cross-tradition, comparative, or pre-tradition entries — "
                "explicitly allow-listed in INTENTIONAL_CROSS_TRADITION) "
                "vs `vault.unmatchedTradNodes` (classifier-gap accidents, "
                "should be zero in a healthy build). The 2026-05-29 rigor "
                "pass drove accidentals from 196 → 0 across 4 sweeps "
                "(+RIGOR / +RIGOR2 / +RIGOR3 / +RIGOR4 family-order swap "
                "to route Greek Orthodox correctly). Sanity-case panel "
                "in `scripts/build_health_index.py` aborts the build on "
                "any future regression."
            ),
            "caveats": [
                "Family baselines are pooled across lenses (sum of relevant "
                "deity + person + tradition + theme + ritual + practice "
                "entries an EoR-class reference would have for that family).",
                "A single lens contributes to MANY families (e.g. 03_deities "
                "rolls up to 9+ family rows). `perLens` in each family row "
                "shows the lens-folder breakdown.",
                "The Timeline lens (01_timeline) is excluded — it's an index, "
                "not a content folder.",
                "Stub-status nodes count toward the total. The `statuses` "
                "block per lens shows the stub/metadata/full breakdown.",
            ],
        },
        "unmatchedTraditionsTop": [
            {"tradition": t, "count": c}
            for t, c in unmatched_traditions.most_common(25)
        ],
    }

    out_path = os.path.join(ROOT, "src", "data", "health-index.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2, ensure_ascii=False)

    print(f"health-index.json written → {out_path}")
    print(f"  totalNodes:         {grand_total_nodes}")
    print(f"  lenses:             {len(LENSES)}")
    print(f"  families:           {len(FAMILIES)}")
    print(f"  unmatchedTradNodes: {sum(unmatched_traditions.values())}")


if __name__ == "__main__":
    main()
