#!/usr/bin/env python3
"""
fetch_thumbnails.py — populates _assets/thumbs_cache.json with a Wikipedia
thumbnail per node title. Run separately from build_data.py (slow, network).
Stdlib only.

Usage:
    python3 fetch_thumbnails.py              # incremental — only fetches missing
    python3 fetch_thumbnails.py --refetch    # re-tries previously failed lookups
    python3 fetch_thumbnails.py --force      # re-fetches everything

It reads node titles from the same folders build_data.py reads, queries the
Wikipedia REST summary API, and writes a JSON cache that build_data.py later
inlines into data.js.
"""

import argparse
import concurrent.futures as cf
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

VAULT = Path(__file__).parent
CACHE = VAULT / "_assets" / "thumbs_cache.json"

NODE_DIRS = ["02_documents", "03_deities", "04_persons", "05_events", "06_themes", "07_traditions", "09_symbols"]

USER_AGENT = "GnosticPathAtlas/0.2 (educational research vault; +https://obsidian.md)"
TIMEOUT = 6


def split_frontmatter(text):
    if not text.startswith("---"):
        return "", text
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.DOTALL)
    if not m:
        return "", text
    return m.group(1), m.group(2).strip()


def get_field_safe(fm_text, key):
    if not fm_text or not isinstance(fm_text, str):
        return None
    return get_field(fm_text, key)


def get_field(fm_text, key):
    m = re.search(rf"^{re.escape(key)}:\s*(.*)$", fm_text, re.MULTILINE)
    if not m:
        return None
    v = m.group(1).strip()
    if v in ('""', "''", "", "[]"):
        return None
    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
        v = v[1:-1]
    return v


def gather_nodes():
    nodes = []
    for d in NODE_DIRS:
        root = VAULT / d
        if not root.exists():
            continue
        for md in root.rglob("*.md"):
            if md.name.startswith("_"):
                continue
            text = md.read_text(encoding="utf-8")
            fm_text, _ = split_frontmatter(text)
            title = get_field(fm_text, "title") or get_field(fm_text, "name") or md.stem
            node_id = get_field(fm_text, "id") or md.stem
            tradition = get_field(fm_text, "tradition") or ""
            role = get_field(fm_text, "role") or ""
            ntype = d.split("_", 1)[1].rstrip("s").rstrip("e")  # rough type
            if "document" in d: ntype = "document"
            elif "deit" in d: ntype = "deity"
            elif "person" in d: ntype = "person"
            elif "event" in d: ntype = "event"
            elif "theme" in d: ntype = "theme"
            elif "tradition" in d: ntype = "tradition"
            elif "symbol" in d: ntype = "symbol"
            nodes.append({"id": node_id, "title": title, "type": ntype,
                          "tradition": tradition, "role": role})
    return nodes


# Manual overrides — for nodes whose Wikipedia page title differs from our title,
# or for hand-picked thumbnails that beat the auto-pick.
OVERRIDES = {
    "kesh-temple-hymn": "Kesh temple hymn",
    "phase-1-001-kesh-temple-hymn": "Kesh temple hymn",
    "phase-1-008-enuma-elish": "Enūma Eliš",
    "phase-1-004-gilgamesh-old-babylonian": "Epic of Gilgamesh",
    "phase-1-006-atrahasis": "Atra-Hasis",
    "phase-1-007-code-of-hammurabi": "Code of Hammurabi",
    "phase-1-002-pyramid-texts": "Pyramid Texts",
    "phase-1-009-coffin-texts": "Coffin Texts",
    "phase-1-010-book-of-the-dead": "Book of the Dead",
    "phase-1-011-great-hymn-to-aten": "Great Hymn to the Aten",
    "phase-1-012-amarna-letters": "Amarna letters",
    "phase-1-013-baal-cycle": "Baal Cycle",
    "phase-1-014-ugaritic-ritual-texts": "Ugaritic texts",
    "phase-1-003-enheduanna-hymns": "Enheduanna",
    "phase-1-005-instructions-of-shuruppak": "Instructions of Shuruppak",
    "an-sumerian": "Anu",
    "enki-ea": "Enki",
    "ninhursag-nintud": "Ninhursag",
    "el-canaanite": "El (deity)",
    "el-elohim-hebrew": "Elohim",
    "yahweh": "Yahweh",
    "phase-2-001-rig-veda-family-books": "Rigveda",
    "phase-2-002-gathas-of-zarathustra": "Gathas",
    "phase-2-008-homeric-epics": "Homer",
    "phase-2-009-hesiod-theogony-works-and-days": "Theogony",
    "phase-2-012-brihadaranyaka-upanishad": "Brihadaranyaka Upanishad",
    "phase-2-013-chandogya-upanishad": "Chandogya Upanishad",
    "phase-2-014-daodejing": "Tao Te Ching",
    "phase-2-015-analects-of-confucius": "Analects",
    "phase-2-016-early-buddhist-suttas": "Pāli Canon",
    "phase-3-002-plato-dialogues": "Plato",
    "phase-3-003-aristotle-metaphysics": "Metaphysics (Aristotle)",
    "phase-3-004-1-enoch": "Book of Enoch",
    "phase-3-006-septuagint": "Septuagint",
    "phase-3-008-book-of-daniel": "Book of Daniel",
    "phase-3-011-dead-sea-scrolls": "Dead Sea Scrolls",
    "phase-3-012-wisdom-of-solomon": "Wisdom of Solomon",
    "phase-3-013-philo-of-alexandria": "Philo",
    "phase-3-015-pauline-epistles": "Pauline epistles",
    "phase-3-016-gospel-of-mark": "Gospel of Mark",
    "phase-3-017-gospel-of-matthew": "Gospel of Matthew",
    "phase-3-018-luke-acts": "Luke–Acts",
    "phase-3-020-gospel-of-john": "Gospel of John",
    "phase-3-021-hermetic-corpus-earliest": "Hermetica",
    "phase-4-001-gospel-of-thomas": "Gospel of Thomas",
    "phase-4-002-apocryphon-of-john": "Apocryphon of John",
    "phase-4-003-gospel-of-truth": "Gospel of Truth",
    "phase-4-004-gospel-of-philip": "Gospel of Philip",
    "phase-4-005-gospel-of-mary": "Gospel of Mary",
    "phase-4-009-pistis-sophia": "Pistis Sophia",
    "phase-4-011-corpus-hermeticum-i": "Hermetica",
    "phase-4-014-cologne-mani-codex": "Cologne Mani-Codex",
    "phase-4-015-kephalaia-of-the-teacher": "Kephalaia",
    "phase-4-017-ginza-rba": "Ginza Rabba",
    "phase-4-019-plotinus-enneads": "Enneads",
    "phase-4-022-chaldean-oracles": "Chaldean Oracles",
    "phase-4-023-irenaeus-against-heresies": "On the Detection and Overthrow of the So-Called Gnosis",
    "phase-4-028-augustine-confessions": "Confessions (Augustine)",
    "phase-4-029-augustine-city-of-god": "The City of God",
    "phase-4-031-mishnah": "Mishnah",
    "phase-4-033-babylonian-talmud": "Talmud",
    "phase-4-034-quran": "Quran",

    # ---- Gnostic audit fixes (thumbnail-system-1 review pass) ----
    # Correct slug/title mismatches discovered during the Gnostic image audit.
    # Most prior entries used phase-4-XXX slugs; actual node ids use P4-XXX.
    "P4-009-pistis-sophia":   "Nag Hammadi library",   # "Pistis Sophia" article has no thumbnail; NHC article does
    "P4-016-shabuhragan":     "Mani (prophet)",         # Šābuhragān article has no thumbnail; Mani portrait does
    "P4-028-augustine-confessions": "Confessions (Augustine)",  # was: Madonna album
    "P4-060-letter-to-flora": "Letter to Flora",        # was: Loretta Young Show
    "P5-030-palamas-triads":  "Gregory Palamas",        # was: Trial of the Chicago 7
    "P7-015-beyond-belief":   "The Gnostic Gospels",    # was: Beyond Belief: Fact or Fiction TV show
    "P7-018-aion":            "Carl Jung",               # Aion article has no thumbnail; Jung portrait does
    "P7-019-mysterium-coniunctionis": "Carl Jung",      # same — direct to Jung portrait
    "P1-021-shumma-izbu":     "Enuma Anu Enlil",        # was: Tamil movie; closest reliable Wikipedia article
    "carpocrates":            "Carpocrates",
    "cerdo":                  "Cerdo",
    "cerinthus":              "Cerinthus",
    "eve":                    "Adam and Eve",            # "Eve" Wikipedia article has no thumbnail
    "fall-of-humanity":       "Fall of man",            # was: asteroid impact / global catastrophe
    "event-mani-execution-274-or-277": "Mani (prophet)", # was: Execution of Mary Queen of Scots
    "priscillian":            "Priscillian",             # Wikipedia article exists but has no thumbnail — placeholder
    "tradition-catharism":    "Albigensian Crusade",     # "Catharism" article has no thumbnail; Crusade article does
    "tradition-gnosticism":   "Apocryphon of John",      # "Gnosticism" article has no thumbnail; ApoJohn codex does
    # Themes with no specific Wikipedia image — leave null (placeholder is correct)
    # alien-god, anticosmic, personal-daimon: intentionally NOT in OVERRIDES

    # ---- Egyptian religion pass (thumbnail-system-1, session 2026-05-16) ----
    # Persons
    "flinders-petrie":                           "Flinders Petrie",
    "manetho":                                   "Manetho",
    "thutmose-iv":                               "Thutmose IV",
    "robert-bauval":                             "Robert Bauval",
    # Events
    "event-amarna-period-1353-1336":             "Akhenaten",
    "event-tutankhamun-tomb-discovery-1922":     "Tutankhamun",
    "event-hyksos-expulsion-1550-bce":           "Hyksos",
    "event-hyksos-period":                       "Hyksos",
    "event-founding-of-alexandria-331-bce":      "Alexandria",
    "event-nag-hammadi-discovery":               "Nag Hammadi library",
    "kings-chamber-great-pyramid":               "King's Chamber",
    "event-school-of-alexandria-300bce-415ce":   "Mouseion",
    "event-destruction-of-serapeum-391":         "Serapeum",
    # Documents
    "P1-027-memphite-theology-shabaka-stone":    "Shabaka Stone",
    "phase-2-028-herodotus-histories-book-2":    "Histories (Herodotus)",
    "phase-3-026-diodorus-bibliotheca-book-1":   "Bibliotheca historica",
    "P4-010-sophia-of-jesus-christ":             "Nag Hammadi library",
    "P4-008-trimorphic-protennoia":              "Nag Hammadi library",
    "P4-057-allogenes":                          "Nag Hammadi library",
    "P4-026-origen-on-first-principles":         "Origen",
    "P4-042-athanasius-on-the-incarnation":      "Athanasius of Alexandria",
    "P4-075-corpus-hermeticum-xiii-rebirth":     "Corpus Hermeticum",
    "P4-076-stobaean-hermetica-kore-kosmou":     "Hermetica",
    "P4-078-prayer-of-thanksgiving-nhc-vi-7":    "Hermetica",
    "P4-079-coptic-asclepius-nhc-vi-8":          "Hermetica",
    # Themes
    "hermetic-cosmogony":                        "Hermeticism",

    # ---- Gnostic audit pass 2 (thumbnail-system-1, session 2026-05-16) ----
    # 10 Gnostic aeon/deity/tradition/person nodes confirmed to have thumbnails
    "sophia-gnostic":                    "Sophia (Gnosticism)",
    "demiurge-gnostic":                  "Yaldabaoth",
    "the-monad-gnostic":                 "Monad (philosophy)",
    "primal-man-manichaean":             "Manichaeism",
    "anthropos-gnostic":                 "Manichaeism",
    "prince-of-darkness-manichaean":     "Manichaeism",
    "urizen":                            "Urizen",
    "sefirot":                           "Sefirot",
    "william-blake":                     "William Blake",
    "tradition-renaissance-hermeticism": "Hermeticism",

    # ---- 09_symbols/ overrides (opus-symbols-2, 2026-05-15) ----
    # Symbols often need explicit Wikipedia-article-title mapping because the slug
    # is descriptive ("eye", "bull", "lion") and bare-title search collides with
    # the literal animal/anatomy page rather than the iconographic-religious page.
    "ankh": "Ankh",
    "asclepian-rod": "Rod of Asclepius",
    "aum-om": "Om",
    "beauseant": "Beauséant",
    "bull": "Sacred bull",
    "caduceus": "Caduceus",
    "celtic-cross": "Celtic cross",
    "chi-rho-labarum": "Chi Rho",
    "coptic-cross": "Coptic cross",
    "crescent-moon-star": "Star and crescent",
    "cross-pattee-templar": "Cross pattée",
    "dharmachakra": "Dharmachakra",
    "eye": "Eye of Providence",
    "eye-of-horus-wedjat": "Eye of Horus",
    "faravahar": "Faravahar",
    "fish-ichthys": "Ichthys",
    "greek-cross": "Christian cross variants",
    "halo-nimbus": "Halo (religious iconography)",
    "haoma": "Haoma",
    "hexagram": "Star of David",
    "indus-valley-script": "Indus script",
    "latin-cross": "Christian cross",
    "lion": "Lion (heraldry)",
    "lotus": "Sacred lotus in religious art",
    "maltese-cross": "Maltese cross",
    "mandala-circle": "Mandala",
    "menorah": "Menorah (Temple)",
    "mithraic-cross": "Tauroctony",
    "monas-hieroglyphica": "Monas Hieroglyphica",
    "mount-ararat": "Mount Ararat",
    "noahs-ark": "Noah's Ark",
    "ouroboros": "Ouroboros",
    "pelican-in-piety": "Pelican",
    "pentagram": "Pentagram",
    "phoenix-bennu": "Phoenix (mythology)",
    "pomegranate": "Pomegranate",
    "rainbow-covenant": "Rainbow",
    "rose-cross-rosicrucian": "Rose Cross",
    "sacred-fire-atash": "Atar",
    "scarab-khepri": "Scarab (artifact)",
    "serpent-cosmic-enemy": "Chaoskampf",
    "serpent-wisdom-chthonic": "Serpent symbolism",
    "spiral": "Triple spiral",
    "star-of-ishtar": "Star of Ishtar",
    "sun-disk": "Solar symbol",
    "swastika": "Swastika",
    "tau-cross": "Tau Cross",
    "tauroctony": "Tauroctony",
    "tetragrammaton": "Tetragrammaton",
    "thyrsus": "Thyrsus",
    "tree-of-life": "Tree of life",
    "triskelion": "Triskelion",
    "vesica-piscis": "Vesica piscis",
    "vine-grape": "Grape",
    "wheat-grain": "Wheat",
    "yin-yang": "Taijitu",
    # opus-symbols-3-serpent additions (2026-05-15) — 4 new cross-tradition serpent symbols
    "naga-serpent": "Nāga",
    "uraeus": "Uraeus",
    "feathered-serpent": "Feathered Serpent",
    "nehushtan": "Nehushtan",

    # ---- Symbols pass (thumbnail-system-1, session 2026-05-16) ----
    # Null symbols — Wikipedia returns thumbnails for these titles
    "adinkra":                   "Adinkra symbols",
    "ajna-third-eye":            "Ajna",
    "arabesque-girih":           "Girih",
    "athanor":                   "Athanor",
    "bodhi-tree":                "Bodhi tree",
    "crossroads-symbol":         "Hecate",             # Hecate = goddess of crossroads
    "enso":                      "Ensō",
    "gobekli-tepe-pillars":      "Göbekli Tepe",
    "gorgoneion":                "Medusa",
    "labyrinth":                 "Labyrinth",
    "mandorla":                  "Mandorla",
    "medicine-wheel":            "Medicine wheel",
    "nun-primordial-waters":     "Nun (mythology)",
    "philosophers-stone":        "Philosopher's stone",
    "pillars-jachin-boaz":       "Solomon's Temple",
    "prima-materia":             "Prima materia",
    "shankha-conch":             "Shankha",
    "shofar":                    "Shofar",
    "sol-niger":                 "Splendor Solis",     # alchemical sun-nigredo manuscript
    "tyet-isis-knot":            "Tyet",
    "veve":                      "Veve",
    "voynich-glyphs":            "Voynich manuscript",
    # Suspect fixes — replace wrong/weak matches
    "pelican-in-piety":          "Pelican (heraldry)",
    "serpent-wisdom-chthonic":   "Rod of Asclepius",
    "vine-grape":                "Vine (symbolism)",
    "wheat-grain":               "Wheat (symbolism)",

    # ---- Greece pass (thumbnail-system-1, session 2026-05-16) ----
    # Person nodes where slug doesn't map cleanly to Wikipedia article title
    "aeschylus":                          "Aeschylus",
    "euripides":                          "Euripides",
    "strabo":                             "Strabo",
    "zeno-of-citium":                     "Zeno of Citium",
    "berossus":                           "Berossus",
    "critias-younger":                    "Plato",
    "thomas-taylor-neoplatonist":         "Thomas Taylor (neoplatonist)",
    "spyridon-marinatos":                 "Spyridon Marinatos",
    "menander-i-soter":                   "Menander I",
    # Deity/concept nodes
    "rhea-greek":                         "Rhea (mythology)",
    "the-moirai":                         "Moirai",
    "the-dioskouroi":                     "Castor and Pollux",
    "phanes-protogonos":                  "Phanes (mythology)",
    "demiurge-platonic":                  "Demiurge",
    "hermes-trismegistus":                "Hermes Trismegistus",
    "iapetus":                            "Iapetus (mythology)",
    # Documents
    "P3-002-plato-dialogues":             "Plato",
    "P3-022-plato-timaeus-critias-atlantis": "Timaeus (dialogue)",
    "P3-005-stoic-foundational-texts":    "Stoicism",
    "phase-2-040-orphic-gold-tablets":    "Orphic gold tablets",
    "P4-085-ovid-metamorphoses-book-1":   "Ovid",
    # Traditions / themes
    "tradition-minoan-religion":          "Minoan religion",
    "apocalyptic-thunderer-vs-serpent":   "Chaoskampf",
    "tahafut-controversy":                "Tahafut al-Falasifa",
    "theme-heroes-paradise-island":       "Elysium",
    "zeus-pantokrator-transmission":      "Zeus",
    "antediluvian-civilization":          "Antediluvian",
    # Events
    "event-eleusinian-mysteries-c1500-bce-396-ce": "Eleusinian Mysteries",
    "event-thera-eruption-c-1600-bce":    "Minoan eruption",
    "event-closure-platonic-academy-529": "Platonic Academy",
}


import difflib
import unicodedata

# ── Conservative-fetch thresholds ─────────────────────────────────────────────
# Title similarity: ratio between our query and Wikipedia's returned title.
# Below this threshold → reject the hit, even if an image exists.
# OVERRIDES entries bypass this check (they are human-vetted).
MIN_TITLE_SIMILARITY = 0.55

# Minimum image width in pixels. Images smaller than this are usually logos or
# tiny icons, not article-quality portraits/illustrations.
MIN_IMAGE_WIDTH = 100

# Wikipedia extracts under this length usually mean a disambiguation stub or a
# nearly-empty article — not worth using.
MIN_EXTRACT_LEN  = 60

# For deity and person nodes the Wikipedia extract MUST mention at least one of
# these keywords, or the article is probably about a different (non-religious)
# person/entity with the same name.
_DEITY_KW  = frozenset({
    'ancient', 'myth', 'mytholog', 'god', 'goddess', 'deity', 'deities',
    'divine', 'sacred', 'ritual', 'religious', 'religion', 'worship',
    'temple', 'pantheon', 'cult', 'solar', 'lunar', 'underworld',
    'sumerian', 'egyptian', 'greek', 'roman', 'norse', 'hindu', 'celtic',
    'mesopotamia', 'babylon', 'akkad', 'vedic', 'yoruba', 'orisha',
    'canaanite', 'phoenician', 'ugaritic', 'zoroastrian', 'avestan',
})
_PERSON_KW = frozenset({
    'philosopher', 'theologian', 'mystic', 'saint', 'prophet', 'bishop',
    'ancient', 'medieval', 'gnostic', 'hermetic', 'kabbalist', 'alchemist',
    'neoplatonist', 'stoic', 'rabbi', 'monk', 'priest', 'sufi',
    'thinker', 'scholar', 'teacher', 'sage', 'guru', 'occultist',
    'religious', 'religion', 'spiritual', 'heretic', 'reformer', 'apostle', 'evangelist',
    'church', 'faith', 'scripture', 'canon', 'biblical', 'bible', 'torah',
    'genesis', 'abrahamic', 'christian', 'islamic', 'jewish',
})
_RELEVANCE_KW = {'deity': _DEITY_KW, 'person': _PERSON_KW}
# ── end thresholds ─────────────────────────────────────────────────────────────


def ascii_fold(s):
    """Remove diacritics: Šābuhragān → Sabuhragan."""
    return ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))


def _title_sim(query, returned):
    """Case-insensitive similarity ratio between query and Wikipedia returned title."""
    a = re.sub(r"\s*\(.*?\)", "", query).lower().strip()
    b = re.sub(r"\s*\(.*?\)", "", returned).lower().strip()
    return difflib.SequenceMatcher(None, a, b).ratio()


def normalize_title(t):
    return re.sub(r"\s*\(.*?\)\s*", "", t).strip()


def candidate_titles(node):
    nid = node["id"]
    out = []
    if nid in OVERRIDES:
        out.append(OVERRIDES[nid])
    raw = node["title"]
    # DISAMBIGUATED FIRST — for deities especially, a bare title like "Geb" or "Nun"
    # routes to the modern military officer / actual nuns rather than the deity.
    # Prepend disambiguators based on node type + tradition so the religious page wins.
    ntype = node.get("type")
    tradition = (node.get("tradition") or "").lower()
    if ntype == "deity":
        # try with common Wikipedia disambiguator forms — these MATCH actual Wikipedia article naming.
        out.append(f"{raw} (god)")
        out.append(f"{raw} (deity)")
        out.append(f"{raw} (mythology)")
        if "egyptian" in tradition:
            out.append(f"{raw} (Egyptian god)")
            out.append(f"{raw} (Egyptian deity)")
            out.append(f"{raw} (Egyptian mythology)")
        if "sumerian" in tradition or "mesopotam" in tradition or "akkadian" in tradition or "babylonian" in tradition:
            out.append(f"{raw} (Mesopotamian god)")
            out.append(f"{raw} (Mesopotamian deity)")
            out.append(f"{raw} (Sumerian)")
            out.append(f"{raw} (Akkadian)")
        if "greek" in tradition or "hellenic" in tradition:
            out.append(f"{raw} (Greek god)")
            out.append(f"{raw} (mythology)")
        if "roman" in tradition:
            out.append(f"{raw} (Roman god)")
            out.append(f"{raw} (mythology)")
        if "norse" in tradition or "germanic" in tradition:
            out.append(f"{raw} (Norse god)")
            out.append(f"{raw} (Germanic mythology)")
        if "hindu" in tradition or "vedic" in tradition or "tantric" in tradition:
            out.append(f"{raw} (Hindu deity)")
            out.append(f"{raw} (Vedic god)")
        if "canaanite" in tradition or "ugaritic" in tradition or "phoenician" in tradition:
            out.append(f"{raw} (Canaanite god)")
            out.append(f"{raw} (Semitic god)")
        if "yoruba" in tradition or "african" in tradition:
            out.append(f"{raw} (Yoruba)")
            out.append(f"{raw} (orisha)")
        if "celtic" in tradition or "irish" in tradition or "welsh" in tradition:
            out.append(f"{raw} (Celtic)")
            out.append(f"{raw} (mythology)")
    elif ntype == "person":
        if "philosoph" in (node.get("role") or "").lower() or "philosoph" in tradition:
            out.append(f"{raw} (philosopher)")
        if "theolog" in (node.get("role") or "").lower():
            out.append(f"{raw} (theologian)")
        if "patristic" in tradition or "christian" in tradition:
            out.append(f"{raw} (theologian)")
            out.append(f"{raw} (bishop)")
    elif ntype == "symbol":
        # Symbols often disambiguate via "(symbol)" or category — try those first.
        out.append(f"{raw} (symbol)")
        out.append(f"{raw} (Christianity)")
        out.append(f"{raw} (Egyptian symbol)")
        out.append(f"{raw} (religious symbol)")
        out.append(f"{raw} (iconography)")
    # NOW the plain title (so if there's no disambiguator clash, the bare title still resolves).
    out.append(raw)
    # ASCII-folded version (Šābuhragān → Sabuhragan)
    ascii_form = ascii_fold(raw)
    if ascii_form != raw:
        out.append(ascii_form)
    # Strip trailing " (...)" disambig
    out.append(normalize_title(raw))
    out.append(ascii_fold(normalize_title(raw)))
    # Cut at em-dash, en-dash, colon, " - " — Wikipedia titles rarely have these
    for sep in (" — ", " – ", " - ", ": ", " — "):
        if sep in raw:
            head = raw.split(sep)[0].strip()
            out.append(head)
            out.append(ascii_fold(head))
            out.append(normalize_title(head))
    # "Foo / Bar" → both halves
    if " / " in raw:
        for piece in raw.split(" / "):
            piece = piece.strip()
            if piece:
                out.append(piece)
                out.append(normalize_title(piece))
                out.append(ascii_fold(piece))
    # remove trailing " (Sumerian)" etc.
    out.append(re.sub(r"\s+\([^)]+\)\s*$", "", raw).strip())
    # de-dupe while preserving order
    seen, uniq = set(), []
    for t in out:
        if t and t not in seen:
            seen.add(t); uniq.append(t)
    return uniq


def _http_json(url, retries=3):
    backoff = 0.6
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                if r.status == 200:
                    return json.loads(r.read().decode("utf-8"))
                if r.status in (429, 503):
                    time.sleep(backoff * (attempt + 1))
                    continue
                return None
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                time.sleep(backoff * (attempt + 1))
                continue
            return None
        except Exception:
            time.sleep(backoff)
            continue
    return None


def wiki_summary(title):
    url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title.replace(" ", "_"), safe="")
    return _http_json(url)


def wiki_search(query, limit=3):
    url = ("https://en.wikipedia.org/w/api.php?action=opensearch&search=" +
           urllib.parse.quote(query) + f"&limit={limit}&namespace=0&format=json")
    data = _http_json(url)
    if not data or not isinstance(data, list) or len(data) < 2:
        return []
    return data[1] or []


def _summary_to_thumb(data, matched, node=None):
    if not data:
        return None
    if data.get("type") == "disambiguation":
        return None

    extract = (data.get("extract") or "")

    # Gate 1: reject near-empty extracts (stubs / disambiguation pages)
    if len(extract) < MIN_EXTRACT_LEN:
        return None

    returned_title = data.get("title", "")

    # Gate 2: title similarity — skip for OVERRIDES (those are human-vetted)
    if node and node.get("id") not in OVERRIDES:
        if _title_sim(matched, returned_title) < MIN_TITLE_SIMILARITY:
            return None

    # Gate 3: relevance keyword check for deity / person
    # The extract must mention at least one religion/mythology keyword or we
    # reject the hit entirely (catches living athletes/politicians with ancient names).
    if node:
        kw_set = _RELEVANCE_KW.get(node.get("type"))
        if kw_set:
            el = extract.lower()
            if not any(kw in el for kw in kw_set):
                return None

    thumb = data.get("thumbnail") or data.get("originalimage")
    if not thumb:
        return None

    # Gate 4: reject tiny images (logos, icons)
    if (thumb.get("width") or 0) < MIN_IMAGE_WIDTH:
        return None

    return {
        "title": returned_title,
        "src": thumb.get("source"),
        "width": thumb.get("width"),
        "height": thumb.get("height"),
        "page": (data.get("content_urls") or {}).get("desktop", {}).get("page"),
        "extract": extract[:280],
        "matched_query": matched,
    }


def find_thumbnail(node):
    cands = candidate_titles(node)
    # Pass 1 — direct summary (all types)
    for cand in cands:
        out = _summary_to_thumb(wiki_summary(cand), cand, node)
        if out:
            return out
    # Pass 2 — opensearch fuzzy fallback.
    # Restricted to 'document' only: Phase-X-NNN-* slugs are unique enough that
    # a fuzzy title search is safe.  For every other type (deity, symbol, person,
    # event, theme, tradition) the fuzzy search reliably returns wrong matches
    # (Geb → Geocaching, Nun → actual nuns, etc.).
    # Also skip for OVERRIDE entries: if the human-vetted direct title has no
    # image, fall back to the placeholder — not to opensearch garbage.
    # Missing image >> wrong image for a religion atlas.
    if node.get('type') != 'document':
        return None
    if node.get('id') in OVERRIDES:
        return None
    for cand in cands:
        hits = wiki_search(cand, limit=3)
        for h in hits:
            out = _summary_to_thumb(wiki_summary(h), f"{cand} → {h}", node)
            if out:
                return out
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--refetch", action="store_true", help="re-try previously failed (null) entries")
    ap.add_argument("--force",   action="store_true", help="re-fetch everything, ignore cache")
    ap.add_argument("--force-type", default=None, help="wipe and re-fetch cache for nodes of this type only (e.g. 'deity', 'person')")
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()

    CACHE.parent.mkdir(parents=True, exist_ok=True)
    cache = {}
    if CACHE.exists() and not args.force:
        try:
            cache = json.loads(CACHE.read_text(encoding="utf-8"))
        except Exception:
            cache = {}

    nodes = gather_nodes()
    # Selectively wipe cache entries for one node type (e.g. deity) so the disambiguation-aware
    # re-fetch replaces wrong matches (Geb=Prussian officer, Nun=actual nuns, etc.).
    if args.force_type:
        target = args.force_type.lower()
        ids_to_wipe = {n["id"] for n in nodes if n["type"] == target}
        wiped = sum(1 for k in list(cache.keys()) if k in ids_to_wipe and cache.pop(k, None) is not None)
        print(f"--force-type={target}: wiped {wiped} cache entries; will re-fetch.")
    print(f"Scanning {len(nodes)} nodes; cache holds {len(cache)} entries.")

    todo = []
    for n in nodes:
        cur = cache.get(n["id"])
        if cur is None and (args.force or args.refetch or n["id"] not in cache):
            todo.append(n)
        elif cur and args.force:
            todo.append(n)

    if not todo:
        print("Nothing to fetch. (Use --refetch to retry null entries, --force to redo all.)")
        return 0

    print(f"Fetching {len(todo)} entries with {args.workers} workers ...")
    done = [0]
    failures = [0]

    def task(n):
        result = find_thumbnail(n)
        cache[n["id"]] = result
        done[0] += 1
        if result is None:
            failures[0] += 1
            status = "·"
        else:
            status = "✓"
        if done[0] % 10 == 0 or done[0] == len(todo):
            print(f"  {done[0]:>4}/{len(todo)}  failures: {failures[0]:<3}  last: {status} {n['title'][:60]}")
        # periodic save so we don't lose progress
        if done[0] % 25 == 0:
            CACHE.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")
        return result

    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        list(ex.map(task, todo))

    CACHE.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")
    hits = sum(1 for v in cache.values() if v)
    print(f"\nDone. {hits}/{len(cache)} nodes have a thumbnail. Cache → {CACHE.relative_to(VAULT)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
