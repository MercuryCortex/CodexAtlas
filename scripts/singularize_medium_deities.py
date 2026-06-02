#!/usr/bin/env python3
"""
singularize_medium_deities.py — STEP A for the verified MEDIUM-conviction
cross-family deities (+ resolved holds). Per-node EXPLICIT origin, hand-verified
against scholarship (NOT the analyzer's mechanical first-listed — which fails on
e.g. the archangels, listed "Christianity / Judaism / Islam" but originating in
Second-Temple Judaism).

SAFETY: each row declares its expected wedge; the script computes the engine's
tradition_family() on the new origin and REFUSES to write if it disagrees. So
every classification is machine-checked. Idempotent (skips tradition-raw).

Usage:  python3 scripts/singularize_medium_deities.py [--apply]
"""
import sys, re, importlib, os
sys.path.insert(0, os.getcwd())
import build_data as b
importlib.reload(b)
APPLY = "--apply" in sys.argv

# (file, new singular tradition, [appearance families/notes], expected wedge)
ROWS = [
    ("asherah",            "Canaanite / Ugaritic",                       ["Israelite folk religion"],                         "Canaanite"),
    ("guan-yu",            "Chinese folk religion",                      ["Confucian","Daoist","Buddhist"],                   "Chinese"),
    ("sun-wukong",         "Chinese folk religion",                      ["Daoism","Buddhism"],                               "Chinese"),
    ("yan-wang",           "Chinese religion",                           ["Chinese Buddhism (Daoist-Buddhist syncretic)"],    "Chinese"),
    ("gabriel-archangel",  "Second Temple Judaism",                      ["Christianity","Islam"],                            "Israelite"),
    ("michael-archangel",  "Second Temple Judaism",                      ["Christianity","Islam","Mandaeism"],                "Israelite"),
    ("raphael-archangel",  "Second Temple Judaism (Tobit)",              ["Christianity","Islam"],                            "Israelite"),
    ("uriel-archangel",    "Second Temple Judaism (1 Enoch)",            ["Christianity"],                                    "Israelite"),
    ("demiurge-gnostic",   "Sethian and Valentinian Gnosticism",         [],                                                  "Gnostic"),
    ("sophia-gnostic",     "Sethian and Valentinian Gnosticism",         [],                                                  "Gnostic"),
    ("abrasax",            "Basilidean Gnosticism",                      ["Hermetic"],                                        "Gnostic"),
    ("anthropos-gnostic",  "Sethian Gnosticism",                         ["Valentinian Gnosticism","Hermetic"],               "Gnostic"),
    ("satanael",           "Bogomilism and Catharism (medieval dualism)",[],                                                  "Gnostic"),
    ("demiurge-platonic",  "Platonist philosophy (Greek)",               ["Middle Platonism","Neoplatonism"],                 "Greek"),
    ("eros-primordial",    "Greek (Hesiodic and Orphic cosmogonies)",    [],                                                  "Greek"),
    ("hekate",             "Greek religion",                             ["Roman religion","Chaldean Oracles"],               "Greek"),
    ("selene",             "Greek",                                      ["Greco-Roman magical-papyri / Hekate-syncretic"],   "Greek"),
    ("agathos-daimon",     "Greco-Egyptian Hermetic tradition",          ["popular Hellenistic religion"],                    "Hermetic"),
    ("asmodeus",           "Second Temple Judaism (Tobit)",              ["Christianity","Kabbalah","Solomonic demonology"],  "Israelite"),
    ("beelzebub",          "Hebrew Bible (polemical, Baal-zebub)",       ["New Testament demonology","medieval Christian"],   "Israelite"),
    ("gilgamesh-nephilim", "Second-Temple Jewish apocalyptic (Book of Giants)", ["Manichaeism"],                             "Israelite"),
    ("hahyah-nephilim",    "Second-Temple Jewish apocalyptic (Book of Giants)", ["Manichaeism"],                             "Israelite"),
    ("mahaway-nephilim",   "Second-Temple Jewish apocalyptic (Book of Giants)", ["Manichaeism"],                             "Israelite"),
    ("ohyah-nephilim",     "Second-Temple Jewish apocalyptic (Book of Giants)", ["Manichaeism"],                             "Israelite"),
    ("lilith",             "Jewish folkloric / Kabbalistic",             ["Mesopotamian lilītu substrate"],                   "Israelite"),
    ("metatron",           "Jewish mystical / Hekhalot / Kabbalistic",   [],                                                  "Israelite"),
    ("amurru",             "Akkadian / Amorite",                         ["West Semitic"],                                    "Mesopotamian"),
    ("dumuzi-tammuz",      "Sumerian",                                   ["Akkadian","West Semitic"],                         "Mesopotamian"),
    ("ishara",             "Mesopotamian",                               ["Hurrian","Hittite"],                               "Mesopotamian"),
    ("nikkal-akkadian",    "Akkadian",                                   ["West Semitic","Aramaic"],                          "Mesopotamian"),
    ("hubal",              "Pre-Islamic Arabian (Hejazi / Quraysh)",     ["Nabataean / Levantine import"],                    "Pre-Islamic-Arabian"),
    ("almaqah",            "Pre-Islamic South Arabian (Sabaean)",        ["pre-Christian Aksumite (via Sabaean migration)"],  "Pre-Islamic-Arabian"),
    ("astar-aksumite",     "Pre-Islamic South Arabian (Sabaean)",        ["pre-Christian Aksumite"],                          "Pre-Islamic-Arabian"),
    ("psyche-myth",        "Greco-Roman religion",                       ["literary mythology"],                              "Greek"),
    ("hachiman",           "Shinto",                                     ["Buddhist syncretism"],                             "Shinto"),
    ("kubera",             "Hindu",                                      ["Buddhist","Jain"],                                 "Vedic"),
    ("mahakala",           "Hindu (Śaiva)",                              ["Vajrayāna Buddhism"],                              "Vedic"),
    # resolved holds:
    ("iao-gnostic",        "Gnostic (Greek Magical Papyri / Nag Hammadi)", ["Hermetic"],                                      "Gnostic"),
    ("vayu",               "Vedic / Hindu",                              ["Zoroastrian (Avestan Vayu — cognate)"],            "Vedic"),
    ("guanyin",            "Chinese popular religion / Chinese Buddhism", ["derived from [[avalokitesvara]] (Indian Mahāyāna)"], "Chinese"),
    ("sabazios",           "Phrygian / Thracian",                        ["Hellenistic-Roman syncretism"],                    "Phrygian"),
]

mismatch = staged = 0
plan = []
for slug, origin, appears, expect in ROWS:
    path = f"03_deities/{slug}.md"
    try:
        text = open(path, encoding="utf-8").read()
    except FileNotFoundError:
        print(f"  !! MISSING {path}"); continue
    actual = b.tradition_family(origin)
    if actual != expect:
        print(f"  ✗ MISMATCH {slug}: origin {origin!r} -> engine={actual}, expected={expect}")
        mismatch += 1; continue
    if "tradition-raw:" in text:
        print(f"  .. SKIP (migrated) {slug}"); continue
    m = re.search(r'^tradition:\s*(.+)$', text, re.M)
    raw = m.group(1).strip().strip("\"'")
    block = (f'tradition: "{origin}"\n'
             f'tradition-raw: "{raw}"   # pre-migration (membership-vs-wire 2026-06-02)\n'
             f'tradition-appearances: {appears}   # STEP-B worklist')
    plan.append((path, text, m.group(0), block))
    print(f"  ✓ {slug:20s} {origin!r}  -> {expect}")
    staged += 1

if mismatch:
    print(f"\n✗ {mismatch} MISMATCH(es) — fix the table; NOTHING written.")
    sys.exit(1)
if APPLY:
    for path, text, oldline, block in plan:
        open(path, "w", encoding="utf-8").write(text.replace(oldline, block, 1))
    print(f"\nAPPLIED — {staged} files written.")
else:
    print(f"\nDRY RUN — {staged} files would change, 0 mismatches.")
