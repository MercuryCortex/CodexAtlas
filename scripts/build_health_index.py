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

import os, re, json
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
FAMILIES = [
    {
        "key": "mesopotamian", "label": "Mesopotamian", "baseline": 280,
        "matchers": ["sumer", "akkad", "babyl", "assyr", "mesopotam", "uruk",
                     "old-babylonian", "neo-babylonian", "neo-assyrian", "kassite",
                     "eridu", "nineveh", "ugarit", "canaanite", "phoenic", "ammonite",
                     "moabite", "edomite", "aramean", "amorite", "elamite"],
    },
    {
        "key": "egyptian", "label": "Egyptian", "baseline": 240,
        "matchers": ["egypt", "kemetic", "amarna", "ptolema", "memphis", "thebes",
                     "heliopolis", "hermopolis"],
    },
    {
        "key": "greco-roman", "label": "Greco-Roman", "baseline": 380,
        "matchers": ["greek", "graeco", "greco", "roman religion", "etruscan",
                     "minoan", "mycen", "orphic", "eleusin", "dionysian",
                     "olympian", "stoic", "epicurean", "neoplaton", "platon",
                     "pythagor", "hellenist", "hermet", "mithra", "isiac",
                     "imperial-cult", "imperial cult", "sol invictus"],
    },
    {
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
                     "marcion", "cathar", "bogomil", "messianic"],
    },
    {
        "key": "iranian", "label": "Iranian / Zoroastrian", "baseline": 180,
        "matchers": ["zoroast", "mazdaism", "mazdean", "parsi", "avestan",
                     "achaemenid", "sasanian", "sassanian", "parthian", "median",
                     "khvarenah", "iranian", "old-iranian"],
    },
    {
        "key": "indic", "label": "Indic (Hindu / Jain / Sikh)", "baseline": 520,
        "matchers": ["hindu", "vedic", "vaishn", "shaiva", "shakta", "smarta",
                     "tantric", "shaivite", "vaishnavite", "advait", "vishishtadvaita",
                     "dvaita", "samkhya", "yoga", "mimam", "nyaya", "vaisheshika",
                     "carvaka", "ajivika", "bhakti", "jain", "digambara", "shvetambara",
                     "sikh", "sant", "kabir", "south-asian", "south asian",
                     "indian-modern", "indian modern", "indian classical",
                     "indo-aryan", "indus", "harappan"],
    },
    {
        "key": "buddhist", "label": "Buddhist", "baseline": 380,
        "matchers": ["buddh", "theravada", "mahayana", "vajrayana", "tibet",
                     "zen", "chan", "pure-land", "pure land", "nichiren", "shingon",
                     "tendai", "kagyu", "nyingma", "sakya", "gelug", "bon-po", "bon ",
                     "bonpo", "abhidharma", "madhyamaka", "yogacara", "huayan",
                     "tiantai", "rinzai", "soto", "obaku"],
    },
    {
        "key": "east-asian", "label": "East Asian (Daoist / Confucian / folk)", "baseline": 320,
        "matchers": ["dao", "tao", "confuc", "neo-confuc", "shinto", "shintō",
                     "shinbutsu", "shugendo", "shugendō", "chinese folk",
                     "chinese-folk", "chinese popular", "yin-yang", "yin yang",
                     "five-elements", "five elements", "wuxing", "huang-lao",
                     "huanglao", "celestial-masters", "celestial masters",
                     "quanzhen", "shangqing", "lingbao", "korean", "joseon",
                     "vietnamese", "cao-dai", "cao đài", "caodai", "cheondogyo",
                     "tenrikyo", "tenrikyō", "legalism", "mohism"],
    },
    {
        "key": "north-european", "label": "Norse / Celtic / Slavic / Baltic", "baseline": 220,
        "matchers": ["norse", "germanic", "viking", "anglo-saxon", "anglo saxon",
                     "celtic", "irish", "welsh", "gaelic", "druid", "gaulish",
                     "slavic", "slavonic", "polish", "russian-pagan", "baltic",
                     "lithuanian", "latvian", "prussian", "finnic", "finnish",
                     "estonian", "sámi", "sami", "saami"],
    },
    {
        "key": "african", "label": "African (Yoruba / Bantu / Akan / Nilotic etc.)", "baseline": 260,
        "matchers": ["yoruba", "ifa", "ifá", "vodou", "vodun", "santeria", "santería",
                     "candomble", "candomblé", "lukumi", "lukumí", "palo", "macumba",
                     "ashanti", "akan", "bantu", "zulu", "shona", "khoisan",
                     "nilotic", "dinka", "nuer", "maasai", "berber", "amazigh",
                     "tuareg", "dogon", "fon", "ewe", "igbo", "edo", "fulani",
                     "mande", "mandinka", "bambara", "kongo", "kikongo", "swahili",
                     "ethiopian-traditional", "oromo", "rastafari", "kemetic-african"],
    },
    {
        "key": "mesoamerican", "label": "Mesoamerican", "baseline": 180,
        "matchers": ["maya", "mayan", "aztec", "mexica", "nahua", "toltec",
                     "olmec", "zapotec", "mixtec", "purepecha", "tarascan",
                     "huastec", "mesoamerican"],
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
                     "micronesian", "aboriginal", "australian-indigenous"],
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
                     "process theology"],
    },
]


FIELD_RX = {
    "tradition": re.compile(r'^tradition:\s*[\"\']?([^\"\'\n]+)', re.M),
    "status":    re.compile(r'^status:\s*[\"\']?([^\"\'\n]+)',    re.M),
    "type":      re.compile(r'^type:\s*[\"\']?([^\"\'\n]+)',      re.M),
}

def extract(text):
    out = {}
    for k, rx in FIELD_RX.items():
        m = rx.search(text)
        out[k] = m.group(1).strip().rstrip('"\'').lower() if m else None
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


def main():
    per_lens = []
    family_counts = Counter()
    family_lens_grid = defaultdict(lambda: Counter())
    unmatched_traditions = Counter()
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
                        unmatched_traditions[meta["tradition"][:60]] += 1
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
            "totalNodes":         grand_total_nodes,
            "lensCount":          len(LENSES),
            "familyCount":        len(FAMILIES),
            "unmatchedTradNodes": sum(unmatched_traditions.values()),
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
                "is clean. Nodes whose tradition doesn't match any family "
                "are counted in `vault.unmatchedTradNodes`."
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
