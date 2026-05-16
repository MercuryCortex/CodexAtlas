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
import threading
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
    # ---- Persons bulk pass (thumbnail-system-1, session 2026-05-16) ----
    # Islamic scholars / figures
    "ali-ibn-abi-talib":                  "Ali ibn Abi Talib",
    "ibn-rushd":                          "Averroes",
    "ibn-sina":                           "Avicenna",
    "ibn-taymiyya":                       "Ibn Taymiyya",
    "farid-ud-din-attar":                 "Attar of Nishapur",
    "hafez":                              "Hafez",
    "sadi-of-shiraz":                     "Saadi Shirazi",
    "mulla-sadra":                        "Mulla Sadra",
    "suhrawardi":                         "Yahya Suhrawardi",
    "jafar-al-sadiq":                     "Ja'far al-Sadiq",
    "khadija-bint-khuwaylid":             "Khadija bint Khuwaylid",
    "shah-wali-allah":                    "Shah Wali Allah",
    "muawiya-ibn-abi-sufyan":             "Muawiya I",
    # Greek / Roman / Hellenistic
    "apuleius":                           "Apuleius",
    "herodotus":                          "Herodotus",
    "lucian-of-samosata":                 "Lucian of Samosata",
    "galen-of-pergamon":                  "Galen",
    "philo-of-alexandria":                "Philo",
    "seneca":                             "Seneca the Younger",
    "darius-i-the-great":                 "Darius the Great",
    # Roman emperors
    "hadrian-emperor":                    "Hadrian",
    "diocletian-emperor":                 "Diocletian",
    "domitian-emperor":                   "Domitian",
    "nero-emperor":                       "Nero",
    "septimius-severus":                  "Septimius Severus",
    "julian-the-apostate":                "Julian (emperor)",
    "justinian-i":                        "Justinian I",
    "decius-emperor":                     "Decius",
    # Ancient Near East / Egypt
    "hammurabi":                          "Hammurabi",
    "sargon-of-akkad":                    "Sargon of Akkad",
    "naram-sin":                          "Naram-Sin of Akkad",
    "hatshepsut":                         "Hatshepsut",
    "cleopatra-vii":                      "Cleopatra",
    "gudea-of-lagash":                    "Gudea",
    "ashurbanipal":                       "Ashurbanipal",
    # Buddhist / Hindu / East Asian
    "siddhartha-gautama-buddha":          "Gautama Buddha",
    "asoka-maurya":                       "Ashoka",
    "atisa":                              "Atiśa",
    "huineng":                            "Huineng",
    "hakuin":                             "Hakuin Ekaku",
    "mengzi-person":                      "Mencius",
    "han-feizi-person":                   "Han Fei",
    "takla-haymanot":                     "Tekle Haymanot",
    "wolega-tafari-makonnen-haile-selassie": "Haile Selassie",
    "black-elk":                          "Black Elk",
    "deganawidah-peacemaker":             "Deganawida",
    "hiawatha-haudenosaunee":             "Hiawatha",
    "dutty-boukman":                      "Dutty Boukman",
    "marie-laveau":                       "Marie Laveau",
    # Medieval Christian
    "charlemagne":                        "Charlemagne",
    "meister-eckhart":                    "Meister Eckhart",
    "julian-of-norwich":                  "Julian of Norwich",
    "marguerite-porete":                  "Marguerite Porete",
    "john-of-damascus":                   "John of Damascus",
    "john-scotus-eriugena":               "Johannes Scotus Eriugena",
    "cyril-of-alexandria":                "Cyril of Alexandria",
    "nestorius":                          "Nestorius",
    "dietrich-bonhoeffer":                "Dietrich Bonhoeffer",
    "cyprian-of-carthage":                "Cyprian",
    "symeon-the-new-theologian":          "Symeon the New Theologian",
    # Apostles / early Christianity
    "paul-of-tarsus":                     "Paul the Apostle",
    "peter-apostle":                      "Peter the Apostle",
    "jesus-of-nazareth":                  "Jesus",
    "mary-mother-of-jesus":               "Mary, mother of Jesus",
    "judas-iscariot":                     "Judas Iscariot",
    "james-son-of-zebedee":               "James, son of Zebedee",
    "john-son-of-zebedee":                "John the Apostle",
    "stephen-protomartyr":                "Stephen the first martyr",
    # Renaissance / Hermetic
    "marsilio-ficino":                    "Marsilio Ficino",
    "cosimo-de-medici":                   "Cosimo de' Medici",
    "robert-fludd":                       "Robert Fludd",
    "thomas-vaughan":                     "Thomas Vaughan (philosopher)",
    "george-ripley":                      "George Ripley (alchemist)",
    "elias-ashmole":                      "Elias Ashmole",
    "fulcanelli":                         "Fulcanelli",
    "luis-de-camoes":                     "Luís de Camões",
    "fernando-pessoa":                    "Fernando Pessoa",
    "ines-de-castro":                     "Inês de Castro",
    "henry-the-navigator":                "Henry the Navigator",
    "sebastian-i-portugal":               "Sebastian I of Portugal",
    "hugues-de-payens":                   "Hugues de Payens",
    "jacques-de-molay":                   "Jacques de Molay",
    "dinis-i-portugal":                   "Denis I of Portugal",
    # Theosophists / occultists
    "annie-besant":                       "Annie Besant",
    "henry-steel-olcott":                 "Henry Steel Olcott",
    "rene-guenon":                        "René Guénon",
    "p-d-ouspensky":                      "P. D. Ouspensky",
    # Kabbalists / Jewish
    "baal-shem-tov":                      "Baal Shem Tov",
    "moses-cordovero":                    "Moses Cordovero",
    "isaac-the-blind":                    "Isaac the Blind",
    # Modern scholars / academics
    "mircea-eliade":                      "Mircea Eliade",
    "sigmund-freud":                      "Sigmund Freud",
    "james-hillman":                      "James Hillman",
    "jordan-peterson":                    "Jordan Peterson",
    "n-t-wright":                         "N. T. Wright",
    "david-bentley-hart":                 "David Bentley Hart",
    "elaine-pagels":                      "Elaine Pagels",
    "hypatia":                            "Hypatia",
    "mani":                               "Mani (prophet)",
    "ptolemy-i-soter":                    "Ptolemy I Soter",
    "ptolemy-ii-philadelphus":            "Ptolemy II Philadelphus",
    "rudolf-ii-habsburg":                 "Rudolf II, Holy Roman Emperor",
    "saladin":                            "Saladin",
    "makeda-queen-of-sheba":              "Queen of Sheba",
    # ---- Deities bulk pass (thumbnail-system-1, session 2026-05-16) ----
    # Roman / Greek
    "bacchus":                            "Bacchus",
    # Mesopotamian
    "ishtar-akkadian":                    "Ishtar",
    "ashur":                              "Ashur (deity)",
    "apkallu":                            "Apkallu",
    # Buddhist deities
    "amitabha":                           "Amitabha",
    "akshobhya":                          "Akshobhya",
    "amoghasiddhi":                       "Amoghasiddhi",
    "bhaisajyaguru":                      "Bhaisajyaguru",
    # East Asian deities
    "guan-yu":                            "Guan Yu",
    "hachiman":                           "Hachiman",
    # Semitic / Israelite
    "el-hebrew":                          "El (deity)",
    "belial":                             "Belial",
    # Christianity
    "holy-spirit":                        "Holy Spirit in Christianity",
    "holy-spirit-paraclete":              "Holy Spirit in Christianity",
    # Vodou / Afro-Caribbean
    "baron-samedi":                       "Baron Samedi",
    "erzulie":                            "Erzulie",
    # ---- Document fixes — bad suspect overrides (thumbnail-system-1, session 2026-05-16) ----
    "phase-6-005-luther-95-theses":          "Ninety-five Theses",
    "phase-5-054-rumi-masnavi":              "Masnavi",
    "phase-8-009-dreaming-narratives":       "Tjukurpa",
    "phase-6-050-thomas-vaughan-anthroposophia": "Thomas Vaughan (philosopher)",
    "phase-4-024-tertullian-apology":        "Tertullian",
    "phase-4-039-celsus-true-word":          "Celsus (philosopher)",
    "phase-7-018-aion":                      "Aion (Jung)",
    "phase-4-062-1-clement":                 "First Epistle of Clement",
    "phase-3-032-4-ezra-ethiopic-recension": "2 Esdras",
    "phase-6-038-teresa-interior-castle":    "The Interior Castle",
    "phase-5-052-sadi-gulistan":             "Gulistan (book)",
    "phase-5-060-bon-kangyur":               "Bön",
    "phase-4-096-cantong-qi":                "Can Tong Qi",
    "phase-8-011-maori-cosmogonic-chants":   "Māori mythology",
    "phase-4-045-gregory-of-nyssa-life-of-moses": "The Life of Moses (Gregory of Nyssa)",
    "phase-6-044-llull-ars-magna":           "Ars Magna (Ramon Llull)",
    "phase-1-034-adapa-myth":                "Adapa",
    "phase-4-105-apuleius-metamorphoses-book-11": "Metamorphoses (Apuleius)",
    "phase-1-004-gilgamesh-old-babylonian":  "Epic of Gilgamesh",
    "phase-7-034-blavatsky-atlantis-root-race": "The Secret Doctrine",
    # ---- Traditions pass (thumbnail-system-1, session 2026-05-16) ----
    "tradition-african-traditional":      "African traditional religions",
    "tradition-akan":                     "Akan religion",
    "tradition-alevi-bektashi":           "Alevism",
    "tradition-anthroposophy":            "Anthroposophy",
    "tradition-megalithic-atlantic":      "Atlantic megalith",
    "tradition-australian-aboriginal":    "Australian Aboriginal religion",
    "tradition-bhakti-vaishnavism":       "Vaishnavism",
    "tradition-canaanite-ugaritic":       "Canaanite religion",
    "tradition-christianity-canonical":   "History of early Christianity",
    "tradition-celtic":                   "Celtic polytheism",
    "tradition-cybele-attis-mysteries":   "Cybele",
    "tradition-navajo":                   "Navajo religion",
    "tradition-early-christianity":       "Early Christianity",
    "tradition-essenes":                  "Essenes",
    "tradition-ethiopian-orthodox-tewahedo": "Ethiopian Orthodox Tewahedo Church",
    "tradition-etruscan-religion":        "Etruscan religion",
    "tradition-finno-karelian":           "Finnish paganism",
    "tradition-mystery-cults":            "Greco-Roman mysteries",
    "tradition-greek-religion":           "Ancient Greek religion",
    "tradition-haudenosaunee":            "Iroquois",
    "tradition-hellenistic-philosophy":   "Hellenistic philosophy",
    "tradition-hindu-modernism":          "Neo-Vedanta",
    "tradition-hopi":                     "Hopi people",
    "tradition-inca-andean":              "Inca religion",
    "tradition-isis-mysteries":           "Isis",
    "tradition-jainism":                  "Jainism",
    "tradition-jungian-depth-psychology": "Analytical psychology",
    "tradition-jyotisha-indian-astrology":"Jyotisha",
    "tradition-bantu-kongo":              "Kongo religion",
    "tradition-lakota":                   "Lakota people",
    "tradition-lusitanian-religion":      "Lusitanian mythology",
    "tradition-maori":                    "Māori religion",
    "tradition-maya-religion":            "Maya religion",
    "tradition-medieval-christianity":    "Medieval church",
    "tradition-merkavah-mysticism":       "Merkabah mysticism",
    "tradition-mesoamerican":             "Mesoamerican religion",
    "tradition-ordo-novi-templi":         "Ordo Novi Templi",
    "tradition-pentecostalism":           "Pentecostalism",
    "tradition-islamism-political":       "Islamism",
    "tradition-polynesian":               "Polynesian mythology",
    "tradition-norse":                    "Norse religion",
    "tradition-slavic":                   "Slavic religion",
    "tradition-proto-indo-european-religion": "Proto-Indo-European religion",
    "tradition-roman-religion":           "Religion in ancient Rome",
    "tradition-sanjiao":                  "Three teachings",
    "tradition-second-temple-judaism":    "Second Temple Judaism",
    "tradition-shia-islam":               "Shia Islam",
    "tradition-spiritualism":             "Spiritualism (beliefs)",
    "tradition-strict-templar-observance":"Rite of Strict Observance",
    "tradition-sufism":                   "Sufism",
    "tradition-samkhya-yoga":             "Samkhya",
    "tradition-theravada-buddhism":       "Theravada",
    "tradition-traditionalism-perennialist": "Traditionalist School",
    "tradition-vajrayana-buddhism":       "Vajrayana",
    "tradition-vedic-hinduism":           "Vedic religion",
    "tradition-western-astrology":        "Western astrology",
    "tradition-won-buddhism":             "Won Buddhism",
    "tradition-asatru":                   "Germanic paganism",
    "tradition-eglise-johannite":         "Johannite Church",
    # Traditions suspects — fix to correct article
    "tradition-aztec-mexica":             "Aztec religion",
    "tradition-cao-dai":                  "Caodaism",
    "tradition-catharism":                "Catharism",
    "tradition-cheondogyo":               "Cheondogyo",
    "tradition-donghak":                  "Donghak",
    "tradition-gnosticism":               "Gnosticism",

    # ---- Deities bulk pass 2 (thumbnail-system-2, session 2026-05-16) ----
    # Norse / Germanic
    "thor":                               "Thor",
    "freya-norse":                        "Freyja",
    "tyr":                                "Týr",
    "loki":                               "Loki",
    "baldur":                             "Baldr",
    "frigg":                              "Frigg",
    "heimdall":                           "Heimdall",
    "njord":                              "Njörðr",
    "nuada":                              "Nuada",
    "ogma":                               "Ogma",
    "dagda":                              "The Dagda",
    "cerridwen":                          "Cerridwen",
    "danu-celtic":                        "Danu (Irish goddess)",
    "velinas":                            "Velnias",
    "laima":                              "Laima",
    "zemyna":                             "Žemyna",
    "dievas-baltic":                      "Dievas",
    "stribog":                            "Stribog",
    "svarog":                             "Svarog",
    "chernobog":                          "Chernobog",
    "perun":                              "Perun",
    "marzanna":                           "Marzanna",
    # Japanese
    "susanoo":                            "Susanoo-no-Mikoto",
    "izanagi":                            "Izanagi",
    "izanami":                            "Izanami",
    "amaterasu":                          "Amaterasu",
    "tsukuyomi":                          "Tsukuyomi-no-Mikoto",
    "inari-kami":                         "Inari Ōkami",
    # Korean
    "hwanin":                             "Hwanin",
    "hwanung":                            "Hwanung",
    "tangun":                             "Dangun",
    "hanullim":                           "Haneullim",
    # South / East Asian
    "tara":                               "Tara (Buddhism)",
    "soma":                               "Soma (drink)",
    "soma-deity":                         "Soma (drink)",
    "vajradhara":                         "Vajradhara",
    "vajrasattva":                        "Vajrasattva",
    "vairocana":                          "Vairocana",
    "samantabhadra-buddha":               "Samantabhadra",
    "ratnasambhava":                      "Ratnasambhava",
    "manjushri":                          "Mañjuśrī",
    "hariti":                             "Hārītī",
    "mahakala":                           "Mahakala",
    "tara-green":                         "Tara (Buddhism)",
    "prajnaparamita-goddess":             "Prajnaparamita",
    "three-pure-ones":                    "Three Pure Ones",
    "yan-wang":                           "Yanluo Wang",
    "zao-jun":                            "Zao Jun",
    "guan-yin":                           "Guanyin",
    # Hindu
    "vishnu-deity":                       "Vishnu",
    "rudra-shiva-early":                  "Rudra",
    "sita":                               "Sita",
    "vritra":                             "Vritra",
    "the-ashvins":                        "Ashvins",
    "purusha":                            "Purusha",
    "mitra-vedic":                        "Mitra (Vedic)",
    "dyaus-pita":                         "Dyeus",
    "yima-iranian":                       "Yima",
    "yima-jamshid":                       "Yima",
    # Zoroastrian
    "asha-vahishta":                      "Asha Vahishta",
    "spenta-mainyu":                      "Spenta Mainyu",
    "druj":                               "Druj",
    "angra-mainyu-ahriman":               "Angra Mainyu",
    "verethragna":                        "Verethragna",
    "the-amesha-spentas":                 "Amesha Spenta",
    "saoshyant":                          "Saoshyant",
    # Yoruba / Vodou / African
    "shango":                             "Shango",
    "oshun":                              "Oshun",
    "eshu":                               "Eshu",
    "ogun":                               "Ogun",
    "orunmila":                           "Orunmila",
    "aganju":                             "Aganju",
    "obatala":                            "Obatala",
    "olokun":                             "Olokun",
    "olodumare":                          "Olodumare",
    "nyame":                              "Nyame",
    "bondye-vodou":                       "Bondye",
    # Semitic / Hebrew
    "el-shaddai":                         "El Shaddai",
    "ein-sof":                            "Ein Sof",
    "shekhinah":                          "Shekhinah",
    "metatron":                           "Metatron",
    "the-sefirot":                        "Sefirot",
    "mastema":                            "Mastema",
    "satanael":                           "Satanael",
    "yam":                                "Yam (god)",
    # Mesopotamian
    "kumarbi":                            "Kumarbi",
    "apsu":                               "Abzu",
    "kingu":                              "Kingu",
    "tammuz-dumuzi":                      "Tammuz",
    "dumuzi-tammuz":                      "Tammuz",
    "ki-sumerian":                        "Ki (goddess)",
    "nanna-sin":                          "Sin (mythology)",
    "bau-sumerian":                       "Bau (goddess)",
    "belet-seri-akkadian":                "Belet-Seri",
    "mullissu-akkadian":                  "Mullissu",
    "ninazu":                             "Ninazu",
    "ninkasi":                            "Ninkasi",
    "nin-lil-sumerian":                   "Ninlil",
    "gula-akkadian":                      "Gula (goddess)",
    "ishara":                             "Ishara",
    "damkina":                            "Damkina",
    "lahmu-lahamu":                       "Lahmu",
    "anshar-kishar":                      "Anshar",
    # Hittite / Hurrian
    "sun-goddess-of-arinna":              "Sun goddess of Arinna",
    "telipinu":                           "Telipinu",
    # Canaanite
    "wadd":                               "Wadd",
    "nasr-pre-islamic":                   "Nasr (god)",
    "almaqah":                            "Almaqah",
    # Mediterranean / Roman
    "mars-roman":                         "Mars (mythology)",
    "mercury-roman":                      "Mercury (mythology)",
    "los":                                "Los (mythology)",
    "romulus":                            "Romulus",
    # Polynesian / Pacific
    "tangaroa":                           "Tangaroa",
    "io-matua-kore":                      "Io (Māori)",
    "ranginui":                           "Ranginui",
    "papatuanuku":                        "Papatūānuku",
    "kane-hawaiian":                      "Kāne (deity)",
    # Indigenous Americas
    "viracocha":                          "Viracocha",
    "changing-woman":                     "Changing Woman",
    "coyote-navajo":                      "Coyote (mythology)",
    "spider-woman-navajo":                "Spider Woman (mythology)",
    "wakan-tanka":                        "Wakan Tanka",
    "sky-woman":                          "Sky Woman",
    "sky-woman-haudenosaunee":            "Sky Woman",
    "inyan":                              "Inyan",
    "flint-deity":                        "Good Mind and Flint",
    "sapling-deity":                      "Good Mind and Flint",
    "sun-bearer":                         "Jóhonaaʼéí",
    "palongawhoya":                       "Hopi mythology",
    "poqanghoya":                         "Hopi mythology",
    # Cao Dai
    "cao-dai-god":                        "Cao Đài",
    # Enochic / Second Temple
    "semyaza":                            "Semjâzâ",
    "armaros":                            "Armaros",
    "baraqel":                            "Baraqel",
    "gadreel":                            "Gadreel",
    "kasdeja":                            "Kasdeja",
    "kokabiel":                           "Kokabiel",
    "penemue":                            "Penemue",
    "uriel-archangel":                    "Uriel",
    "raphael-archangel":                  "Raphael (archangel)",
    "raguel-archangel":                   "Raguel (archangel)",
    "remiel-archangel":                   "Remiel",
    "saraqael-archangel":                 "Saraqael",
    "angel-of-the-presence":              "Angel of the Lord",
    "the-elect-one-enochic":              "Son of Man",
    "head-of-days":                       "Ancient of Days",
    # Manichaean / Gnostic
    "manda-d-hayyi":                      "Mandaeism",
    "ruha":                               "Ruha (Mandaeism)",
    "ptahil":                             "Ptahil",
    "hayyi-rabbi":                        "Mandaeism",
    "jesus-the-splendor":                 "Manichaeism",
    # Hermas (Christian)
    "the-lady-ecclesia-hermas":           "The Shepherd of Hermas",
    "the-shepherd-angel-of-repentance":   "The Shepherd of Hermas",
    # Neoplatonic
    "the-one-plotinus":                   "The One (Plotinus)",
    "the-world-soul":                     "World soul",
    # Cathar
    "the-good-god-cathar":                "Catharism",
    "the-evil-god-cathar":                "Catharism",
    # Iberian / Lusitanian
    "endovelicus":                        "Endovelicus",
    "bandua":                             "Bandua",
    "trebaruna":                          "Trebaruna",
    "reue-lusitanian":                    "Lusitanian mythology",
    "beher":                              "Ethiopian mythology",
    "mahrem":                             "Mahrem",
    "meder":                              "Meder (deity)",
    "astar-aksumite":                     "Astar (Aksumite)",
    "melek-taus":                         "Melek Taus",
    "nur-muhammadi":                      "Nur Muhammad",
    "al-haqq":                            "Al-Haqq",
    "oyagami":                            "Ōyagami",
    # Enochic specifics
    "hahyah-nephilim":                    "Nephilim",
    "ohyah-nephilim":                     "Nephilim",
    "mahaway-nephilim":                   "Nephilim",
    "asbeel":                             "Asbeel",
    "hermoni":                            "Watchers (Jewish tradition)",
    "bergelmir":                          "Bergelmir",
    "iapetus":                            "Iapetus (mythology)",
    # Christian specifics
    "mary-theotokos":                     "Mary, mother of Jesus",
    "mary-of-zion":                       "Mary of Zion",
    "jesus-christ-deity":                 "Jesus in Christianity",

    # ---- Themes bulk pass (thumbnail-system-2, session 2026-05-16) ----
    # Kabbalistic / Jewish mystical
    "adam-kadmon":                        "Adam Kadmon",
    "shevirat-hakelim":                   "Shevirat ha-kelim",
    "tzimtzum":                           "Tzimtzum",
    "tikkun-olam":                        "Tikkun olam",
    "shekhinah-as-theme":                 "Shekhinah",
    "the-sefirot":                        "Sefirot",
    "torah-as-pre-existent":              "Pre-existence of the soul",
    "torah-and-wisdom-identified":        "Torah",
    "two-powers-in-heaven":               "Two Powers in Heaven",
    "theme-two-powers-in-heaven":         "Two Powers in Heaven",
    "merkabah-miraj-ascent-chain":        "Merkabah mysticism",
    # Gnostic / Manichaean
    "aeon-as-emanation":                  "Aeon (Gnosticism)",
    "sophia-pleroma":                     "Sophia (Gnosticism)",
    "soul-as-spark":                      "Divine spark",
    "alien-god":                          "Deus Absconditus",
    "anticosmic":                         "Gnosticism",
    "atonement-reinterpreted":            "Atonement in Christianity",
    "two-principles":                     "Dualism in cosmology",
    "dualism-spirit-matter":              "Dualism (philosophy of mind)",
    "dualism-cosmic":                     "Religious dualism",
    "soul-exile-longing":                 "Divine spark",
    "anthropos-myth":                     "Anthropos",
    "primal-man-myth":                    "Primal Man (Manichaeism)",
    # Zoroastrian / Iranian
    "asha-druj-cosmic-opposition":        "Asha",
    "theme-asha-druj-cosmic-opposition":  "Asha",
    "theme-zoroastrian-cosmogony":        "Bundahishn",
    "theme-zoroastrian-afterlife-geography": "Chinvat Bridge",
    "cinvat-bridge-judgment":             "Chinvat Bridge",
    "theme-zoroastrian-jewish-exchange":  "Zoroastrianism and Judaism",
    "theme-vedic-avestan-split":          "Indo-Iranian religion",
    "asura-deva-inversion":               "Asura",
    "spenta-mainyu-as-theme":             "Spenta Mainyu",
    "bmac-proto-zoroastrian":             "Bactria–Margiana Archaeological Complex",
    # Alchemical / Hermetic
    "alchemical-marriage":                "Alchemical wedding",
    "alchemy-as-spiritual-discipline":    "Alchemy",
    "coniunctio":                         "Alchemical wedding",
    "prima-materia-theme":                "Prima materia",
    "visionary-alchemical-allegory":      "Splendor Solis",
    "philosophers-stone-theme":           "Philosopher's stone",
    "as-above-so-below":                  "As above, so below",
    "hermetic-cosmogony":                 "Hermeticism",
    "hermetic-transmission-chain":        "Hermeticism",
    "universal-reformation":              "Rosicrucian Manifestos",
    "true-will":                          "Thelema",
    "ceremonial-magick":                  "Ceremonial magic",
    "theurgy":                            "Theurgy",
    "sympathetic-magic":                  "Sympathetic magic",
    # Neoplatonic / Greek philosophical
    "apophatic-mysticism":                "Apophatic theology",
    "theme-apophatic-theology":           "Apophatic theology",
    "via-negativa":                       "Apophatic theology",
    "neoplatonic-henosis":                "Henosis",
    "ascent-of-the-soul":                 "Ascent to heaven (mysticism)",
    "the-one-plotinus-theme":             "The One (Plotinus)",
    "eros-as-philosophical-motive":       "Eros (concept)",
    "archetype":                          "Archetype",
    "analogy-of-being":                   "Analogia entis",
    "analogia-entis":                     "Analogia entis",
    "essence-energies-distinction":       "Essence–energies distinction",
    "divine-emanation":                   "Emanationism",
    "apatheia-and-virtue":                "Apatheia",
    "stoic-virtue":                       "Virtue ethics",
    "cosmopolitanism":                    "Cosmopolitanism",
    "reason-over-passion":                "Stoicism",
    # Christian theology
    "crucifixion-theology":               "Crucifixion of Jesus",
    "resurrection-of-the-dead":           "Resurrection of the dead",
    "satisfaction-atonement":             "Satisfaction theory of atonement",
    "vicarious-atonement":                "Vicarious atonement",
    "tewahedo-christology":               "Oriental Orthodox Christology",
    "ecclesiology":                       "Ecclesiology",
    "ecclesial-authority":                "Catholic Church",
    "apologetic-historiography":          "Christian apologetics",
    "bridal-mysticism":                   "Bridal mysticism",
    "five-ways":                          "Five Ways (Aquinas)",
    "the-godhead-eckhart":                "Meister Eckhart",
    "realized-eschatology":               "Realized eschatology",
    "soul-as-bride":                      "Bridal mysticism",
    "discipleship-failure":               "Gospel of Mark",
    "messianic-secret":                   "Messianic Secret",
    "translation-as-theology":            "Bible translations",
    "commentary-as-genre":                "Biblical commentary",
    "anti-roman-polemic":                 "Jewish–Roman wars",
    "chosen-people":                      "Chosen people",
    "righteous-suffering-vindication":    "Suffering servant",
    "suffering-servant":                  "Suffering Servant",
    "apokatastasis":                      "Apokatastasis",
    "sacred-and-profane":                 "Sacred–profane dichotomy",
    # Islam / Sufi
    "tawhid":                             "Tawhid",
    "tawḥīd":                             "Tawhid",
    "occultation-hidden-imam":            "The Occultation",
    "satanic-verses-incident":            "Satanic Verses incident",
    "hanif-monotheism":                   "Hanif",
    "theme-aaronide-priestly-continuity": "Israelite religion",
    # Eschatology / Apocalyptic
    "apocalyptic-cosmic-warfare":         "Apocalyptic literature",
    "apocalyptic-revelation":             "Book of Revelation",
    "eschatological-imminence":           "Eschatology",
    "eschatological-war":                 "Armageddon",
    "end-times-judgment":                 "Last Judgment",
    "watchers-and-fallen-angels":         "Watchers (Jewish tradition)",
    "ragnarok-apocalyptic":               "Ragnarök",
    # Sacred kingship / ritual
    "divine-kingship":                    "Divine king",
    "divine-kingship-solar":              "Divine right of kings",
    "sacred-king":                        "Sacred king",
    "sacred-marriage":                    "Hieros gamos",
    "sacrifice-as-cosmic-renewal":        "Sacrifice",
    "scapegoat-mechanism":                "Scapegoat",
    "royal-hymn":                         "Psalm",
    "temple-economy":                     "Temple",
    "civic-religion":                     "Civic religion",
    "divinatory-calendar":                "Divination",
    "divinatory-omen-reading":            "Omen",
    # Soul / afterlife
    "soul-immortality":                   "Immortality of the soul",
    "underworld-descent":                 "Descent to the underworld",
    "theme-guide-through-underworld":     "Psychopomp",
    "world-axis":                         "Axis mundi",
    "ancestor-veneration":                "Ancestor veneration",
    "cosmic-cycles":                      "Hindu units of time",
    "eternal-return":                     "Eternal return",
    # Cross-tradition
    "dying-rising-god":                   "Dying-and-rising deity",
    "wisdom-personified":                 "Sophia (wisdom)",
    "divine-feminine":                    "Divine feminine",
    "divine-immanence":                   "Immanence",
    "divine-name":                        "Names of God",
    "creation-by-word":                   "Fiat lux",
    "cosmic-body-cosmogony":              "Cosmic Body",
    "world-parent-cosmogony":             "World parents",
    "earth-diver-creation":               "Earth-diver",
    "sacred-defeat":                      "Martyrdom",
    "theme-dying-founder-paradigm":       "Martyrdom",
    "executed-divine-claimant":           "Crucifixion of Jesus",
    "trickster-archetype":                "Trickster",
    "son-of-man":                         "Son of man",
    "ethical-monotheism":                 "Ethical monotheism",
    "ethical-dualism":                    "Dualism (religion)",
    "monotheism-strict":                  "Monotheism",
    "monotheism":                         "Monotheism",
    # Kabbalah / Jewish
    "shevirat-ha-kelim":                  "Shevirat ha-kelim",
    "tikkun":                             "Tikkun olam",
    "lurianic-kabbalah-theme":            "Lurianic Kabbalah",
    # Celtic / IE / PIE
    "dumezil-trifunctional":              "Trifunctional hypothesis",
    "celtic-otherworld":                  "Celtic Otherworld",
    "atlantic-bronze-age-network":        "Atlantic Bronze Age",
    "cattle-raid-myth":                   "Cattle raid",
    "bronze-age-substrate-of-greek-religion": "Greek mythology",
    "syncretism-egyptian-greek":          "Greco-Egyptian religion",
    "allegory-and-hermeneutics":          "Allegorical interpretation",
    "allegorical-exegesis":               "Allegorical interpretation",
    # Pseudoarchaeology / Esotericism
    "atlantis-myth":                      "Atlantis",
    "antediluvian-civilization":          "Antediluvian",
    "baphomet-controversy":               "Baphomet",
    "templar-gnostic-transmission-hypothesis": "Knights Templar",
    "pseudoarchaeology":                  "Pseudoarchaeology",
    "pseudonymity-as-strategy":           "Pseudepigrapha",
    "shamanism-hypothesis":               "Shamanism",
    "collective-effervescence":           "Collective effervescence",
    "comparative-religion-method":        "Comparative religion",
    # Hindu / South Asian
    "avatar-doctrine":                    "Avatar",
    "bhakti-devotion":                    "Bhakti",
    "bodhisattva-vow":                    "Bodhisattva",
    "anekantavada":                       "Anekāntavāda",
    "anatman-no-self":                    "Anatta",
    # Buddhist
    "the-five-buddha-families":           "Five Dhyani Buddhas",
    # Specific MASSIVE WIN themes
    "theme-soma-haoma-eucharist":         "Soma (drink)",
    "theme-manichaeism-synthesis":        "Manichaeism",
    "theme-gandharan-buddhism":           "Greco-Buddhist art",
    "theme-habiru-hebrew-origins":        "Hapiru",
    "theme-axial-age":                    "Axial Age",
    "third-century-collision-zone":       "Crisis of the Third Century",
    "theme-solomonic-transmission-spine": "Solomon's Temple",
    "theme-rebel-against-the-divine":     "Prometheus",
    "theme-el-yahweh-merger":             "El (deity)",
    "theme-baal-set-syncretism":          "Baal",
    "theme-sacred-bloodline-claim":       "Divine right of kings",
    "theme-heroes-paradise-island":       "Elysium",
    "zep-tepi":                           "Zep Tepi",
    "sebastianism-quinto-imperio":        "Sebastianism",
    "saudade":                            "Saudade",
    "tabot-ark-replica":                  "Tabot",
    "sacred-geometry-cosmic-proportion":  "Sacred geometry",
    "afro-diasporic-syncretism":          "African diaspora religion",
    "apophatic-mysticism":                "Apophatic theology",
    "sacred-fire-as-theme":               "Sacred fire",
    "ancient-of-days":                    "Ancient of Days",
    "merkabah-mysticism-theme":           "Merkabah mysticism",
    "restorationism":                     "Restorationism (Christianity)",
    "secular-spirituality":               "Spiritual but not religious",
    "christian-pagan-site-overlay":       "Church (building)",
    "theme-apophatic-theology":           "Apophatic theology",
    "ungrund":                            "Ungrund",
    "theme-satan-angra-mainyu-transfer":  "Devil in Christianity",
    "kritias-atlantis":                   "Atlantis",
    "theme-zoroastrian-cosmogony":        "Bundahishn",
    "wisdom-as-cosmic-order":             "Sophia (wisdom)",
    "364-day-solar-calendar":             "Hebrew calendar",
    "divinatory-omen-reading":            "Divination",
    "critique-of-idolatry":               "Iconoclasm",
    "cosmic-cataclysm":                   "Flood myth",
    "diaspora-judaism":                   "Jewish diaspora",
    "apologetic-historiography":          "Christian apologetics",
    "anti-roman-polemic":                 "Jewish–Roman wars",
    "the-numinous":                       "Numinous",
    "numinous":                           "Numinous",
    "theme-axial-age":                    "Axial Age",
    "dispensationalism":                  "Dispensationalism",
    "sacred-number-seven":                "7 (number)",
    "prophetic-tradition":                "Prophet",
    "marian-devotion":                    "Veneration of Mary",
    "ethiopian-marian-devotion":          "Mary of Zion",
    "solomonic-genealogy":                "Solomonic dynasty",
    "theme-sacred-defeat":                "Martyrdom",

    # ---- Events bulk pass (thumbnail-system-2, session 2026-05-16) ----
    # Prehistoric / cave art
    "event-altamira-cave-paintings-c-22000-bce":    "Cave of Altamira",
    "event-chauvet-cave-paintings-c-32000-bce":     "Chauvet Cave",
    "event-lascaux-cave-paintings-c-17000-bce":     "Lascaux",
    "event-sulawesi-cave-art-c-45500-bce":          "Leang Tedongnge",
    "event-hohle-fels-figurines-c-35000-bce":       "Venus of Hohle Fels",
    "event-shanidar-neanderthal-burials-c-60000-bce": "Shanidar Cave",
    "event-pike-2018-neanderthal-cave-art-c-64800-bce": "Cave painting",
    "event-catalhoyuk-c-7400-6200-bce":             "Çatalhöyük",
    "event-jericho-pre-pottery-neolithic-c-9000-bce": "Jericho",
    "event-cucuteni-trypillia-c-5500-3000-bce":     "Cucuteni–Trypillia culture",
    # Architecture / monuments
    "event-gobekli-tepe-c-9500-bce":               "Göbekli Tepe",
    "event-stonehenge-construction-c-3000-1600-bce": "Stonehenge",
    "event-karnak-temple-complex-construction-c-2055-bce-100-ce": "Karnak",
    "el-castillo-chichen-itza":                     "El Castillo, Chichen Itza",
    "event-angkor-wat-construction-c-1113-1150":    "Angkor Wat",
    "event-borobudur-construction-c-750-825":       "Borobudur",
    "event-chartres-cathedral-construction-1194-1220": "Chartres Cathedral",
    "event-hagia-sophia-construction-537":          "Hagia Sophia",
    "event-parthenon-construction-447-432-bce":     "Parthenon",
    "event-kaaba-pre-islamic-and-islamic-foundation": "Kaaba",
    "event-zagwe-lalibela-churches-c1200":          "Lalibela",
    "event-quinta-da-regaleira-construction-1904-1910": "Quinta da Regaleira",
    "event-rosslyn-chapel-construction-1446":       "Rosslyn Chapel",
    "event-mafra-monument-construction-1717-1755":  "Mafra National Palace",
    # Ancient Near East / Egypt
    "event-cyrus-conquest-of-babylon-539-bce":      "Cyrus the Great",
    "event-ebla-tablets-1974-1976":                 "Ebla tablets",
    "event-ras-shamra-excavation-1928":             "Ugarit",
    "event-phoenician-gades-foundation-1100bce":    "Cádiz",
    "event-george-smith-flood-tablet-1872":         "Epic of Gilgamesh",
    "event-decipherment-of-cuneiform-1857":         "Cuneiform script",
    "event-numantia-133bce":                        "Numantia",
    # Greek / Roman
    "event-bacchanalia-suppression-186-bce":        "Bacchanalia",
    "event-closure-of-pagan-mysteries-392-393":     "Theodosius I",
    "event-edict-of-thessalonica-380":              "Edict of Thessalonica",
    "event-sack-of-rome-410":                       "Sack of Rome (410)",
    "event-discovery-of-thera-akrotiri-1967":       "Akrotiri (Santorini)",
    "event-black-sea-deluge-hypothesis-1997":       "Black Sea deluge hypothesis",
    # Jewish / Israelite
    "event-dead-sea-scrolls-discovery":             "Dead Sea Scrolls",
    "event-destruction-of-second-temple-70":        "Siege of Jerusalem (70 CE)",
    "event-temple-leontopolis-foundation-c150bce":  "Temple of Leontopolis",
    "event-jamnia-yavneh-90":                       "Council of Jamnia",
    "event-jewish-expulsion-spain-1492":            "Alhambra Decree",
    "event-sabbatean-apostasy-1666":                "Sabbatai Zevi",
    "event-pittsburgh-platform-1885":               "Pittsburgh Platform (Judaism)",
    "event-linear-b-decipherment-1952":             "Linear B",
    # Christian
    "event-council-of-nicaea-325":                  "First Council of Nicaea",
    "event-crucifixion-of-jesus-c30ce":             "Crucifixion of Jesus",
    "event-stoning-of-stephen-c35ce":               "Stephen the first martyr",
    "event-lyon-martyrs-177":                       "Martyrs of Lyon",
    "event-casaubon-redates-hermetica-1614":        "Isaac Casaubon",
    "event-clovis-baptism-c-496":                   "Clovis I",
    "event-iconoclast-controversy-726-843":         "Byzantine Iconoclasm",
    "event-fourth-crusade-1204":                    "Fourth Crusade",
    "event-council-of-florence-1439":               "Council of Florence",
    "event-death-of-jan-hus-1415":                  "Jan Hus",
    "event-burning-of-library-of-alexandria":       "Library of Alexandria",
    "event-death-of-hypatia-415":                   "Hypatia",
    "event-diocletian-great-persecution-303":       "Diocletianic Persecution",
    "event-augustine-of-canterbury-mission-597":    "Augustine of Canterbury",
    "event-origen-lucifer-misreading-c230":         "Origen",
    "event-luther-95-theses-1517":                  "Ninety-five Theses",
    "event-stobaeus-anthology-c500":                "John Stobaeus",
    "event-council-of-troyes-1129":                 "Council of Troyes",
    "event-wilhelmsbad-convent-1782":               "Convent of Wilhelmsbad",
    "event-ramsay-oration-1737":                    "Chevalier de Ramsay",
    "event-solar-temple-mass-suicides-1994-1997":   "Order of the Solar Temple",
    "event-priory-of-sion-fabrication":             "Priory of Sion",
    "event-prague-occult-court-1576-1612":          "Rudolf II, Holy Roman Emperor",
    "event-bruno-execution-1600":                   "Giordano Bruno",
    "nestorian-stele":                              "Nestorian Stele",
    "event-visigothic-kingdom-hispania-418-711":    "Visigothic Kingdom",
    "event-magi-visit-matthew2":                    "Biblical Magi",
    "event-vatican-ii-aftermath-1965-present":      "Second Vatican Council",
    "event-spanish-inquisition-1478":               "Spanish Inquisition",
    "event-fourth-buddhist-council-kanishka-c-100": "Kanishka",
    "event-third-buddhist-council-c-250-bce":       "Third Buddhist council",
    "event-destruction-of-nalanda-1193":            "Nalanda",
    "event-arabic-harranian-hermetica-c800-1000":   "Harran",
    "event-ficino-corpus-hermeticum-translation-1463": "Marsilio Ficino",
    "event-cologne-mani-codex-identified-1970":     "Cologne Mani-Codex",
    "event-quranic-manuscript-finds-2015-onward":   "Sanaa manuscript",
    # Islamic
    "event-death-of-muhammad-632":                  "Muhammad",
    "event-first-fitna-656-661":                    "First Fitna",
    "event-al-andalus-711-1492":                    "Al-Andalus",
    "event-execution-of-al-hallaj-922":             "Al-Hallaj",
    "event-rise-of-political-islamism-1928-present": "Muslim Brotherhood",
    # Ethiopian / African
    "event-aksumite-christianization-c330":         "Ezana of Axum",
    "event-ahmad-gragn-invasion-1529":              "Ahmad ibn Ibrahim al-Ghazi",
    "event-jesuit-mission-ethiopia-1557-1632":      "History of Christianity in Ethiopia",
    "event-magdala-expedition-1868":                "Expedition to Abyssinia",
    "event-kaleb-aksum-himyar-invasion-525":        "Kaleb of Axum",
    "event-solomonic-restoration-1270":             "Solomonic dynasty",
    "event-bruce-recovers-enoch-1773":              "Book of Enoch",
    # Iberian / Portuguese
    "event-founding-kingdom-portugal-1139":         "Afonso I of Portugal",
    "event-order-of-christ-foundation-1319":        "Order of Christ",
    "event-vasco-da-gama-india-voyage-1497":        "Vasco da Gama",
    # Asian
    "event-asokan-dhamma-missions-c-250-bce":       "Ashoka",
    "event-buddha-parinirvana-c-400-bce":           "Parinirvana",
    "event-fourth-buddhist-council-kanishka-c-100": "Fourth Buddhist council",
    "event-timur-destruction-church-of-east-1380-1405": "Timur",
    "event-ramakrishna-mission-founded-1897":       "Ramakrishna Mission",
    "event-formation-of-arya-samaj-1875":           "Arya Samaj",
    "event-pizarro-conquest-of-inca-1533":          "Francisco Pizarro",
    # Indigenous Americas
    "event-ghost-dance-wounded-knee-1890":          "Ghost Dance",
    "event-spanish-conquest-of-tenochtitlan-1521":  "Fall of Tenochtitlan",
    "event-great-law-of-peace-haudenosaunee-c1450": "Great Law of Peace",
    # Modern
    "event-new-atheism-2004-2010":                  "New Atheism",
    "event-rise-of-nones-2007-present":             "Irreligion",
    "event-evangelical-political-realignment-usa-1979-present": "Moral Majority",
    "event-aboriginal-stolen-generations-1905-1969": "Stolen Generations",
    "event-azusa-street-revival-1906":              "Azusa Street Revival",
    "event-death-of-guru-tegh-bahadur-1675":        "Guru Tegh Bahadur",
    "event-ramakrishna-mission-founded-1897":       "Ramakrishna Mission",
    "event-bab-execution-1850":                     "The Báb",

    # ---- Persons bulk pass 2 (thumbnail-system-2, session 2026-05-16) ----
    # Jewish / Israelite
    "akiva-ben-yosef":                    "Rabbi Akiva",
    "amos-prophet":                       "Amos (prophet)",
    "baal-shem-tov":                      "Baal Shem Tov",
    "daniel-prophet":                     "Daniel (biblical figure)",
    "eliezer-ben-hyrcanus":               "Eliezer ben Hyrcanus",
    "isaiah-first":                       "Isaiah",
    "ishmael-ben-elisha":                 "Ishmael ben Elisha",
    "joseph-patriarch":                   "Joseph (Genesis)",
    "joshua-ben-hananiah":                "Yehoshua ben Hananiah",
    "yohanan-ben-zakkai":                 "Yohanan ben Zakkai",
    "onias-iv":                           "Onias IV",
    "pyrrha":                             "Pyrrha",
    # Islamic
    "al-ghazali":                         "Islamic philosophy",
    "al-tabari":                          "Al-Tabari",
    "aisha-bint-abi-bakr":                "Aisha",
    "umar-ibn-al-khattab":                "Umar",
    "uthman":                             "Uthman ibn Affan",
    "muhammad-ibn-abdullah":              "Muhammad",
    "hamza-ibn-ali":                      "Hamza ibn Ali ibn Ahmad",
    "ibn-ishaq":                          "Ibn Ishaq",
    # Christian patristic / medieval
    "apollinaris-of-laodicea":            "Apollinaris of Laodicea",
    "bardaisan-of-edessa":                "Bardaisan",
    "bogomil-priest":                     "Bogomilism",
    "dioscorus-of-alexandria":            "Dioscorus I of Alexandria",
    "eutyches":                           "Eutyches",
    "heracleon-valentinian":              "Heracleon",
    "hermas":                             "The Shepherd of Hermas",
    "hermas-of-rome":                     "The Shepherd of Hermas",
    "hermogenes-the-painter":             "Tertullian",
    "herod-the-great":                    "Herod the Great",
    "hongren":                            "Hongren",
    "hypatia":                            "School of Athens",
    "jacob-baradaeus":                    "Syriac Christianity",
    "james-bruce-of-kinnaird":            "James Bruce",
    "john-scotus-eriugena":               "Johannes Scotus Eriugena",
    "kaleb-of-aksum":                     "Kaleb of Axum",
    "marcus-the-magician":                "Valentinianism",
    "martha-of-bethany":                  "Martha (New Testament)",
    "menander-of-samaria":                "Menander of Antioch",
    "michael-archangel":                  "Michael (archangel)",
    "montanus":                           "Montanism",
    "moses-cordovero":                    "Moses Cordovero",
    "noetus-of-smyrna":                   "Noetus",
    "numenius-of-apamea":                 "Numenius of Apamea",
    "paul-of-samosata":                   "Paul of Samosata",
    "phoebe":                             "Phoebe (biblical figure)",
    "pothinus-of-lyon":                   "Martyrs of Lyon",
    "praxeas":                            "Patripassianism",
    "priscilla":                          "Priscilla (biblical figure)",
    "priscilla-and-maximilla":            "Montanism",
    "sabellius":                          "Sabellianism",
    "saturninus":                         "Saturninus of Antioch",
    "tatian-the-syrian":                  "Tatian",
    "theodotus-valentinian":              "Clement of Alexandria",
    "theophilus-of-antioch":              "Theophilus of Antioch",
    "william-seymour":                    "Azusa Street Revival",
    "william-sinclair-rosslyn":           "Rosslyn Chapel",
    # Gnostic
    "valentinus":                         "Valentinianism",
    # Zoroastrian
    "zarathustra":                        "Zoroaster",
    # Eastern
    "bharatamuni":                        "Natya Shastra",
    "cheng-yi":                           "Cheng Yi (philosopher)",
    "karma-lingpa":                       "Karma Lingpa",
    "lal-ded":                            "Lalleshwari",
    "manu":                               "Manu (Hinduism)",
    "naropa-tilopa":                      "Naropa",
    "nund-rishi":                         "Nund Rishi",
    "sotaesan":                           "Won Buddhism",
    "utpaladeva":                         "Pratyabhijna",
    "vasugupta":                          "Spanda",
    "xunzi-person":                       "Xunzi",
    "zhuangzi-person":                    "Zhuangzi",
    # Ethiopian
    "abba-garima":                        "Garima Gospels",
    "ewostatewos":                        "Ewostatewos of Sara'e",
    "giyorgis-of-sagla":                  "Ethiopian Orthodox Tewahedo Church",
    "kaleb-of-aksum":                     "Kaleb of Axum",
    "zara-yaqob-emperor":                 "Zara Yaqob",
    # Mediterranean / Classical
    "arganthonius":                       "Tartessos",
    "mes-anepada":                        "First Dynasty of Ur",
    "pytheas":                            "Pytheas",
    "triptolemus-legendary":              "Triptolemus",
    "viriato":                            "Viriathus",
    # Iberian
    "goncalo-annes-bandarra":             "Sebastianism",
    # Scholars / modern
    "ammonius-saccas":                    "Neoplatonism",
    "april-deconick":                     "Gnosticism",
    "charles-hapgood":                    "Piri Reis map",
    "david-brakke":                       "Athanasius of Alexandria",
    "emile-durkheim":                     "Émile Durkheim",
    "garth-fowden":                       "Byzantine Empire",
    "george-smith-cuneiformist":          "Epic of Gilgamesh",
    "george-starkey":                     "Alchemy",
    "helen-schucman":                     "A Course in Miracles",
    "howard-vyse":                        "Great Pyramid of Giza",
    "james-hollis":                       "Carl Jung",
    "john-d-turner":                      "Nag Hammadi library",
    "karen-king":                         "Gospel of Thomas",
    "kevin-van-bladel":                   "Harran",
    "louis-komjathy":                     "Taoism",
    "manuel-j-gandra":                    "Hermeticism",
    "mark-singleton":                     "Yoga",
    "marshall-vian-summers":              "New religious movement",
    "peter-j-carroll":                    "Chaos magic",
    "tat-hermetic-disciple":              "Hermeticism",
    "theodore-strehlow":                  "Arrernte people",
    "t-g-h-strehlow":                     "Arrernte people",
    "valerian-emperor":                   "Valerian (emperor)",
    "timothy":                            "Timothy (companion of Paul)",
    "silas-silvanus":                     "Silas",
    "aquila":                             "Aquila and Priscilla",
    "the-nine-saints":                    "Ethiopian Orthodox Tewahedo Church",
    "the-magi":                           "Magi",
    "abya-meqabyan":                      "Maccabees",
    "fentos-meqabyan":                    "Maccabees",
    "seela-meqabyan":                     "Maccabees",
    "quetzalcoatl-historical":            "Quetzalcoatl",
    "robert-de-boron":                    "Holy Grail",
    "robert-schoch":                      "Sphinx",
    "daniel-prophet":                     "Daniel (biblical figure)",
    "deganawidah-peacemaker":             "Iroquois",
    "dutty-boukman":                      "Haitian Revolution",
    "marie-laveau":                       "Voodoo",
    "rabbi-akiva":                        "Rabbi Akiva",
    "beatrice-portinari":                 "Beatrice Portinari",
    "jacob-israel":                       "Jacob",
    "eusebius-of-caesarea":               "Eusebius of Caesarea",
    "hypatia":                            "Hypatia",
    "fulcanelli":                         "Fulcanelli",
    "brian-copenhaver":                   "Renaissance philosophy",
    "marguerite-porete":                  "Marguerite Porete",
    "isaac-the-blind":                    "Kabbalah",
    "fazlur-rahman":                      "Islamic modernism",
    "firmicus-maternus":                  "Late Roman religion",
    "plutarch":                           "Plutarch",
    "ali-zayn-al-abidin":                 "Ali ibn Husayn Zayn al-Abidin",

    # ---- Documents bulk pass 2 (thumbnail-system-2, session 2026-05-16) ----
    # Mesopotamian texts (where previous OVERRIDES returned nothing)
    "phase-1-016-eridu-genesis-flood":    "Eridu",
    "phase-1-017-descent-of-inanna":      "Inanna",
    "phase-1-018-gudea-cylinders":        "Gudea",
    "phase-1-022-lament-for-ur":          "Third Dynasty of Ur",
    "phase-1-023-shulgi-hymns":           "Shulgi",
    "phase-1-028-kumarbi-cycle":          "Kumarbi",
    "phase-1-029-telipinu-myth":          "Telipinu",
    "phase-1-030-illuyanka-myth":         "Illuyanka",
    "phase-1-032-babylonian-theodicy":    "Babylonian theodicy",
    "phase-1-033-anzu-myth":              "Anzû",
    "phase-1-035-wadi-el-jarf-papyri":    "Diary of Merer",
    "tummal-chronicle":                   "Tummal",
    # Chinese texts
    "phase-1-024-shijing":                "Classic of Poetry",
    "phase-1-025-shujing":                "Classic of Documents",
    "phase-2-032-shijing":                "Classic of Poetry",
    "phase-2-033-shujing":                "Classic of Documents",
    # Hebrew Bible
    "phase-2-034-books-of-kings":         "Books of Kings",
    "phase-2-041-book-of-proverbs":       "Book of Proverbs",
    "phase-2-010-hebrew-bible-early-prophets": "Hebrew Bible",
    "phase-3-001-second-third-isaiah":    "Second Isaiah",
    "phase-3-007-sirach":                 "Book of Sirach",
    "phase-4-095-new-testament-canon":    "New Testament",
    # Jewish mystical texts
    "phase-5-012-sefer-yetzirah":         "Sefer Yetzirah",
    "phase-5-026-sefer-ha-bahir":         "Sefer HaBahir",
    "phase-5-027-sefer-ha-zohar":         "Zohar",
    "phase-5-010-saadia-emunot-ve-deot":  "Saadia Gaon",
    "phase-5-013-hekhalot-literature":    "Hekhalot literature",
    "phase-7-012-major-trends-jewish-mysticism": "Gershom Scholem",
    "phase-6-025-nathan-of-gaza-treatise-on-dragons": "Nathan of Gaza",
    # Islamic texts
    "phase-5-009-tabari-tafsir":          "Al-Tabari",
    "phase-5-015-al-ghazali-ihya":        "Al-Ghazali",
    "phase-5-021-ibn-arabi-fusus-al-hikam": "Ibn Arabi",
    "phase-5-039-jabir-corpus-arabic-alchemy": "Jabir ibn Hayyan",
    "phase-5-043-ibn-ishaq-sirat-rasul-allah": "Muhammad",
    "phase-5-044-ibn-sina-kitab-al-shifa": "Avicenna",
    "phase-5-045-al-ghazali-tahafut-al-falasifa": "Al-Ghazali",
    "phase-5-046-ibn-rushd-tahafut-al-tahafut": "Averroes",
    "phase-5-047-ibn-tufayl-hayy-ibn-yaqdhan": "Ibn Tufayl",
    "phase-5-057-ibn-rushd-aristotle-commentaries": "Averroes",
    "phase-5-051-attar-conference-of-birds": "Attar of Nishapur",
    "phase-5-018-suhrawardi-hikmat-al-ishraq": "Yahya Suhrawardi",
    "phase-5-059-rasail-al-hikma":        "Druze",
    "phase-5-061-kiteba-cilwe":           "Yazidis",
    "phase-7-042-donggyeong-daejeon":     "Donghak",
    # Hindu / Sanskrit
    "phase-2-006-brahmanas-aranyakas":    "Brahmanas",
    "phase-2-017-mahabharata-ramayana-oral-layers": "Mahabharata",
    "phase-3-024-natyashastra":           "Natyashastra",
    "phase-5-005-shankara-brahma-sutra-bhasya": "Adi Shankara",
    "phase-5-014-abhinavagupta-tantraloka": "Abhinavagupta",
    "phase-5-016-ramanuja-sribhasya":     "Ramanuja",
    "phase-5-022-madhva-brahma-sutra-bhasya": "Madhvacharya",
    "phase-5-032-yogavasishtha":          "Yoga Vasistha",
    "phase-5-033-shiva-sutras":           "Shiva Sutras of Vasugupta",
    "phase-5-034-vivekachudamani":        "Adi Shankara",
    "phase-6-013-mirabai-bhajans":        "Mirabai",
    "phase-6-020-chaitanya-charitamrita": "Chaitanya Mahaprabhu",
    "phase-7-027-life-divine":            "Sri Aurobindo",
    "phase-7-029-hindutva":               "Hindutva",
    # Buddhist texts
    "phase-4-077-abhidharmakosa":         "Vasubandhu",
    "phase-5-004-platform-sutra-huineng": "Platform Sutra",
    "phase-5-049-bodhicaryavatara":       "Śāntideva",
    "phase-4-104-sukhavativyuha-larger":  "Pure Land Buddhism",
    "phase-4-075-mulamadhyamakakarika":   "Nagarjuna",
    "phase-4-099-shangqing-corpus":       "Shangqing",
    "phase-8-010-kumulipo":               "Kumulipo",
    "phase-8-013-navajo-blessingway":     "Blessingway",
    # Zoroastrian
    "phase-2-004-yasna-younger-avesta":   "Avesta",
    "phase-4-086-arda-viraf-namag":       "Arda Viraf",
    # Patristic Christian
    "phase-4-024b-tertullian-against-valentinians": "Tertullian",
    "phase-4-026-origen-on-first-principles": "Origen",
    "phase-4-030-pseudo-dionysius":       "Pseudo-Dionysius the Areopagite",
    "phase-4-043-apophthegmata-patrum":   "Desert Fathers",
    "phase-4-044-basil-on-the-holy-spirit": "Basil of Caesarea",
    "phase-4-046-john-of-damascus-exposition-orthodox-faith": "John of Damascus",
    "phase-4-050-leo-tome-to-flavian":    "Pope Leo I",
    "phase-4-052-gregory-dialogues":      "Pope Gregory I",
    "phase-4-055-ephrem-hymns-on-paradise": "Ephrem the Syrian",
    "phase-4-064-martyrdom-of-polycarp":  "Polycarp",
    "phase-4-066-polycarp-philippians":   "Polycarp",
    "phase-4-067-martyrdom-of-polycarp":  "Polycarp",
    "phase-3-026-diodorus-bibliotheca-book-1": "Diodorus Siculus",
    # Gnostic (previous NHC OVERRIDES returned NULL — try manuscript images)
    "phase-4-008-trimorphic-protennoia":  "Nag Hammadi library",
    "phase-4-009-pistis-sophia":          "Nag Hammadi library",
    "phase-4-010-sophia-of-jesus-christ": "Nag Hammadi library",
    "phase-4-057-allogenes":              "Nag Hammadi library",
    "phase-4-078-prayer-of-thanksgiving-nhc-vi-7": "Nag Hammadi Codices",
    "phase-4-079-coptic-asclepius-nhc-vi-8": "Nag Hammadi Codices",
    # Ethiopian / Coptic
    "phase-4-081-mashafa-henok-geez-1-enoch": "Book of Enoch",
    "phase-4-082-ethiopic-biblical-canon": "Ethiopian Orthodox Tewahedo Church",
    "phase-4-083-mashafa-kidan-testament-of-our-lord": "Testament of our Lord",
    "phase-4-084-ethiopian-sinodos":      "Ethiopian Orthodox Tewahedo Church",
    "phase-5-036-mashafa-mistir-giyorgis": "Ethiopian Orthodox Tewahedo Church",
    "phase-5-038-mashafa-berhan":         "Ethiopian Orthodox Tewahedo Church",
    "phase-5-040-meqabyan-ethiopian-maccabees": "Maccabees",
    "phase-5-049-yosippon-ethiopian-recension": "Josippon",
    "phase-7-040-walatta-petros-hagiography": "Walatta Petros",
    # Mandate / Corpus Hermeticum overrides (already in OVERRIDES but NULL — try specific articles)
    "phase-4-011-corpus-hermeticum-i":    "Corpus Hermeticum",
    "phase-4-075-corpus-hermeticum-xiii-rebirth": "Corpus Hermeticum",
    "phase-4-076-stobaean-hermetica-kore-kosmou": "Stobaeus",
    # Renaissance / alchemical
    "phase-6-002-ficino-theologia-platonica": "Marsilio Ficino",
    "phase-6-003-pico-oration-900-conclusions": "Giovanni Pico della Mirandola",
    "phase-6-004-pico-heptaplus-conclusiones-cabalisticae": "Giovanni Pico della Mirandola",
    "phase-6-006-reuchlin-de-arte-cabalistica": "Johann Reuchlin",
    "phase-6-007-luther-bondage-of-will": "Martin Luther",
    "phase-6-008-paracelsus-corpus":      "Paracelsus",
    "phase-6-009-agrippa-de-occulta-philosophia": "Heinrich Cornelius Agrippa",
    "phase-6-011-cordovero-pardes-rimmonim": "Moses Cordovero",
    "phase-6-015-luria-vital-etz-chayyim": "Isaac Luria",
    "phase-6-017-boehme-aurora-mysterium-magnum": "Jakob Böhme",
    "phase-6-018-rosicrucian-manifestos": "Rosicrucian Manifestos",
    "phase-6-022-fludd-utriusque-cosmi-historia": "Robert Fludd",
    "phase-6-027-swedenborg-arcana-heaven-and-hell": "Emanuel Swedenborg",
    "phase-6-032-rosarium-philosophorum": "Rosarium philosophorum",
    "phase-6-034-khunrath-amphitheatrum-sapientiae": "Heinrich Khunrath",
    "phase-6-040-bandarra-trovas":        "Sebastianism",
    "phase-6-043-dee-libri-mysteriorum-enochian": "John Dee",
    "phase-6-045-sendivogius-novum-lumen-chymicum": "Michael Sendivogius",
    "phase-6-046-ripley-compound-of-alchemy": "George Ripley (alchemist)",
    "phase-6-048-basil-valentine-twelve-keys": "Basil Valentine",
    "phase-6-049-starkey-secrets-revealed": "George Starkey",
    "phase-5-011-rasail-ikhwan-al-safa":  "Brethren of Purity",
    # Medieval
    "phase-5-003-maximus-confessor-ambigua": "Maximus the Confessor",
    "phase-5-023-liber-de-duobus-principiis": "Catharism",
    "phase-5-025-rumi-masnavi":           "Masnavi",
    "phase-5-028-meister-eckhart-sermons": "Meister Eckhart",
    "phase-5-036-rule-of-templars-latin": "Knights Templar",
    "phase-5-037-bernard-de-laude-novae-militiae": "Bernard of Clairvaux",
    "phase-5-037-fetha-nagast":           "Fetha Nagast",
    "phase-5-052-sadi-gulistan":          "Gulistan (book)",
    "phase-5-055-vilayetname-haci-bektas": "Haji Bektash Veli",
    "phase-5-053-hafez-divan":            "Hafez",
    "phase-4-072-plutarch-de-iside-et-osiride": "Plutarch",
    "phase-4-073-tabula-smaragdina":      "Emerald Tablet",
    # Modern
    "phase-7-008-book-of-the-law":        "The Book of the Law",
    "phase-7-009-outline-of-esoteric-science": "Rudolf Steiner",
    "phase-7-013-gnostic-religion":       "Hans Jonas",
    "phase-7-014-gnostic-gospels":        "Elaine Pagels",
    "phase-7-016-magick-in-theory-and-practice": "Aleister Crowley",
    "phase-7-017-psychology-and-alchemy": "Carl Jung",
    "phase-7-021-patterns-comparative-religion": "Mircea Eliade",
    "phase-7-022-sacred-and-profane":     "Mircea Eliade",
    "phase-7-035-cayce-atlantis-readings": "Edgar Cayce",
    "phase-7-039-gandra-da-face-oculta-2009": "Hermeticism",
    "phase-7-044-cao-dai-canon":          "Caodaism",
    # African-diaspora
    "phase-8-007-ifa-divination-corpus":  "Ifá",
    "phase-8-016-haitian-vodou-liturgical-tradition": "Haitian Vodou",
    "phase-8-017-santeria-lucumi":        "Santería",
    "phase-8-022-the-sacred-pipe":        "Sacred pipe",
    "phase-8-023-gayanashagowa":          "Great Law of Peace",
    # Jain
    "phase-2-038-acharanga-sutra":        "Acaranga Sutra",
    "phase-2-039-sutrakritanga":          "Sutrakritanga",
    # Assorted
    "phase-2-019-deuteronomistic-history": "Deuteronomistic history",
    "phase-4-036-passio-perpetuae":       "Perpetua and Felicity",
    "phase-4-040-pliny-trajan-correspondence": "Pliny the Younger",
    "phase-5-020-interrogatio-iohannis":  "Catharism",
    "phase-7-038-guenon-symbols-sacred-science": "René Guénon",

    # ---- Symbols bulk pass (thumbnail-system-3, session 2026-05-16) ----
    "all-seeing-eye":            "Eye of Providence",
    "asherah-pole":              "Asherah",
    "aten-disk":                 "Aten",
    "bindu":                     "Bindu (symbol)",
    "blood-sacred":              "Blood",
    "cauldron-of-rebirth":       "Gundestrup cauldron",
    "chaos-star":                "Chaos star",
    "cosmic-serpent":            "Cosmic serpent",
    "cow-sacred":                "Sacred cow",
    "divine-child":              "Child god",
    "dove":                      "Doves as symbols",
    "eleusinian-kykeon":         "Kykeon",
    "evil-eye":                  "Evil eye",
    "eye-of-the-heart":          "Qalb",
    "feather-of-maat":           "Maat",
    "great-work":                "Magnum opus (alchemy)",
    "green-lion":                "Viridis Leo",
    "ifa-divination":            "Ifá",
    "kaaba-black-stone":         "Kaaba",
    "lamassu":                   "Lamassu",
    "maypole-irminsul":          "Irminsul",
    "memento-mori-skull":        "Memento mori",
    "mosaic-pavement":           "Mosaic pavement (Freemasonry)",
    "north-star":                "Polaris",
    "oshe-shango":               "Shango",
    "pakal-sarcophagus-lid":     "Palenque",
    "pontos-riscados":           "Pontos riscados",
    "rainbow-bridge":            "Bifröst",
    "royal-arch":                "Royal Arch Masonry",
    "sacred-cat":                "Cats in ancient Egypt",
    "sacred-cauldron":           "Cauldron",
    "sacred-cave":               "Cave painting",
    "sacred-crown":              "Crown (headgear)",
    "sacred-dove":               "Holy Spirit",
    "sacred-eclipse":            "Solar eclipse",
    "sacred-feather":            "Eagle feather law",
    "sacred-fire":               "Sacred fire",
    "sacred-harvest":            "Harvest festival",
    "sacred-horse":              "Horse worship",
    "sacred-lance":              "Holy Lance",
    "sacred-mask":               "Mask",
    "sacred-number-108":         "108 (number)",
    "sacred-number-eight":       "Eight (number)",
    "sacred-number-five":        "Pentagon",
    "sacred-number-forty":       "40 (number)",
    "sacred-number-four":        "Tetractys",
    "sacred-number-nine":        "Nine (number)",
    "sacred-number-three":       "Triple deity",
    "sacred-number-two":         "Duality",
    "sacred-number-zero":        "Zero",
    "sacred-pearl":              "Pearl",
    "sacred-ring":               "Ring (jewellery)",
    "sacred-river":              "Sacred river",
    "sacred-rose":               "Rose",
    "sacred-scepter":            "Sceptre",
    "sacred-stag":               "Cernunnos",
    "sacred-sword":              "Sword",
    "sacred-threshold":          "Threshold (ritual)",
    "sacred-twins":              "Divine twins",
    "sacred-void":               "Śūnyatā",
    "sacrifice-substitution":    "Scapegoat",
    "sator-square":              "Sator square",
    "sulphur-mercury-salt":      "Paracelsus",
    "tattoo-sacred":             "Tattoo",
    "thread-of-fate":            "Moirai",
    "was-scepter":               "Was-sceptre",
    "winged-disk":               "Winged sun",
    "world-mountain":            "Mount Meru",
    "zodiac-wheel":              "Zodiac",

    # ---- Themes bulk pass 2 (thumbnail-system-3, session 2026-05-16) ----
    "city-of-god-vs-earthly-city": "The City of God",
    "crusade-theology-of-malecide": "Albigensian Crusade",
    "eleusinian-mystery-revelation": "Eleusinian Mysteries",
    "ethiopian-systematic-theology": "Ethiopian Orthodox Tewahedo Church",
    "ethiopic-canon-broad":         "Biblical canon",
    "evolutionary-cosmogony":       "Cosmogony",
    "falsafa":                      "Islamic philosophy",
    "fanaa-annihilation":           "Fana (Sufism)",
    "feminine-solar":               "Solar deity",
    "finisterre-end-of-world":      "Finis terrae",
    "flood-motif":                  "Flood myth",
    "forms-and-archetypes":         "Theory of forms",
    "four-ages-degeneration":       "Ages of Man",
    "four-kingdoms-schema":         "Four kingdoms of Daniel",
    "free-will-vs-determinism":     "Free will",
    "fulfillment-of-prophecy":      "Messianism",
    "genealogical-cosmogony":       "Theogony",
    "gentile-inclusion":            "Gentile",
    "gentile-mission":              "Great Commission",
    "gnosis-as-salvation":          "Gnosis",
    "ground-of-being":              "Paul Tillich",
    "heavenly-tablets":             "Heavenly tablets",
    "heavenly-tour":                "Merkabah mysticism",
    "heliopolis-ennead":            "Ennead",
    "henotheism-monolatry":         "Henotheism",
    "hermetic-correspondences":     "Hermeticism",
    "hermetic-piety":               "Hermetic Corpus",
    "hermetic-rebirth":             "Hermeticism",
    "hermopolitan-ogdoad":          "Ogdoad (Egyptian)",
    "hidden-god":                   "Deus absconditus",
    "hierophany":                   "Hierophany",
    "holy-spirit-empowered-witness": "Acts of the Apostles",
    "i-am-sayings":                 "I am (Biblical term)",
    "iconography-and-aniconism":    "Aniconism",
    "ideal-state-myth":             "Atlantis",
    "idealism-metaphysical":        "Idealism",
    "in-christ":                    "In Christ",
    "individuation":                "Individuation",
    "itinerant-discipleship":       "Apostle",
    "jain-karma":                   "Karma in Jainism",
    "justification-by-faith":       "Justification (theology)",
    "katabasis-and-anabasis":       "Katabasis",
    "lamentation-genre":            "Lamentations",
    "liberation-theology":          "Liberation theology",
    "light-and-darkness-dualism":   "Dualism (religion)",
    "liturgical-calendar":          "Liturgical year",
    "logos-cosmic-reason":          "Logos",
    "logos-johannine":              "Logos",
    "logos-philonic":               "Philo",
    "lost-continent":               "Atlantis",
    "marcionite-canon":             "Marcion of Sinope",
    "martyrdom-theology":           "Martyrdom",
    "mesoamerican-cosmogony":       "Mesoamerican creation myths",
    "messianic-future-savior":      "Messianism",
    "messianic-genealogy":          "Genealogy of Jesus",
    "messianic-revelation":         "Apocalyptic literature",
    "messianism":                   "Messianism",
    "miaphysite-christology":       "Miaphysitism",
    "microcosm-macrocosm":          "Macrocosm and microcosm",
    "mixture-cosmology":            "Manichaeism",
    "monastic-asceticism":          "Christian monasticism",
    "mystery-initiation":           "Initiation",
    "new-moses-typology":           "Typology (theology)",
    "non-duality":                  "Nondualism",
    "norse-cosmogony":              "Norse cosmology",
    "occasionalism":                "Occasionalism",
    "oral-tradition-transmission":  "Oral tradition",
    "orisha-pantheon":              "Orisha",
    "orthodoxy-vs-heresy":          "Heresy",
    "panentheism":                  "Panentheism",
    "paraclete-spirit":             "Paraclete",
    "passion-narrative":            "Passion (Christianity)",
    "persian-period-injection":     "Zoroastrianism",
    "personal-daimon":              "Daimon",
    "pharmakos":                    "Pharmakos",
    "possession-ritual":            "Spirit possession",
    "pratyabhijna":                 "Pratyabhijña",
    "predestination":               "Predestination",
    "predestination-protestant":    "Calvinism",
    "priestly-purity":              "Ritual purity",
    "primordial-waters":            "Primordial water",
    "prisca-theologia":             "Prisca theologia",
    "progressive-revelation":       "Progressive revelation (Christianity)",
    "prophet-and-king":             "Hebrew Bible",
    "serpent-dual-nature":          "Serpent (symbolism)",
    "tauroctony-as-cosmic-icon":    "Mithraic mysteries",
    "theme-exodus-hyksos-thesis":   "Hyksos",
    "theme-graduated-afterlife":    "Heaven",
    "theme-holy-spirit-sophia":     "Sophia (Gnosticism)",
    "theme-lex-talionis-covenant-code": "Code of Hammurabi",
    "theme-paradise-etymology":     "Paradise",
    "theme-persecution-as-legitimation": "Religious persecution",
    "theme-proto-indo-iranian-religion": "Proto-Indo-Iranian religion",
    "two-spirits-doctrine":         "Angra Mainyu",

    # ---- Traditions pass 2 (thumbnail-system-3, session 2026-05-16) ----
    "tradition-hinduism":           "Hinduism",
    "tradition-islamic-modernism":  "Islamic Modernism",
    "tradition-jyotisha-indian-astrology": "Jyotisha",
    "tradition-portuguese-hermeticism": "Hermeticism",
    "tradition-strict-templar-observance": "Rite of Strict Observance",
    "tradition-sunni-islam":        "Sunni Islam",

    # ---- Events pass 2 (thumbnail-system-3, session 2026-05-16) ----
    "event-ambedkar-mass-conversion-1956":  "B. R. Ambedkar",
    "event-death-of-guru-arjan-1606":       "Guru Arjan",
    "event-leo-taxil-hoax-1885-1897":       "Léo Taxil hoax",
    "event-mahabodhi-temple-construction-c-260-bce-onwards": "Mahabodhi Temple",
    "event-malta-temples-c-3600-2500-bce":  "Ġgantija",
    "event-mitanni-kingdom-c1500-1340-bce": "Mitanni",
    "event-mongol-sack-of-baghdad-1258":    "Siege of Baghdad (1258)",
    "event-muhammads-miraj-619":            "Isra and Mi'raj",
    "event-natufian-burial-traditions-c-12500-9500-bce": "Natufian culture",
    "event-nero-persecution-64":            "Persecution of Christians in the Roman Empire",
    "event-nine-saints-mission-c480":       "Nine Saints",
    "event-perpetua-felicity-203":          "Perpetua and Felicity",
    "event-portuguese-forced-conversion-1496": "Manuel I of Portugal",
    "queens-chamber-great-pyramid":         "Great Pyramid of Giza",

    # ---- Persons pass 2 (thumbnail-system-3, session 2026-05-16) ----
    "basilides":                     "Basilides",
    "tamil-three-nayanars":          "Nayanmars",
    "vasco-da-gama":                 "Vasco da Gama",

    # ---- Deities pass 2 (thumbnail-system-3, session 2026-05-16) ----
    "meness":                        "Meness",
    "wi-sun-lakota":                 "Wí",

    # ---- Targeted fixes — articles WITH thumbnails (thumbnail-system-3b) ----
    # Traditions
    "tradition-shia-islam":          "Husayn ibn Ali",
    "tradition-islamic-modernism":   "Muhammad Abduh",
    "tradition-sikhism":             "Guru Granth Sahib",
    "tradition-taoism":              "Taoism",
    "tradition-confucianism":        "Confucius",
    "tradition-shinto":              "Shinto",
    "tradition-theravada-buddhism":  "Wat Pho",
    "tradition-vedic-hinduism":      "Vedic period",
    "tradition-essenes":             "Qumran",
    "tradition-early-christianity":  "Ichthys",
    "tradition-hindu-modernism":     "Swami Vivekananda",
    "tradition-druze":               "Druze",
    "tradition-cao-dai":             "Cao Dai",
    "tradition-bon-tibet":           "Bön",
    "tradition-jyotisha-indian-astrology": "Navagraha",
    "tradition-portuguese-hermeticism": "Fernando Pessoa",
    "tradition-strict-templar-observance": "Karl Gotthelf von Hund",
    "tradition-sunni-islam":         "Al-Azhar University",
    # Symbols
    "sacred-number-seven":           "Menorah (Temple)",
    "sacred-fire":                   "Zoroaster",
    "lamassu":                       "Lamassu",
    "zodiac-wheel":                  "Zodiac",
    "sacred-eclipse":                "Solar eclipse",
    "sacred-cat":                    "Bastet",
    "cauldron-of-rebirth":           "Gundestrup cauldron",
    "kaaba-black-stone":             "Black Stone",
    "feather-of-maat":               "Maat",
    "rainbow-bridge":                "Bifröst",
    "all-seeing-eye":                "Eye of Providence",
    "sacred-number-108":             "Mala (prayer beads)",
    "oshe-shango":                   "Shango",
    "bindu":                         "Bindu (symbol)",
    "aten-disk":                     "Akhenaten",
    "asherah-pole":                  "Asherah",
    "chaos-star":                    "Eight-pointed star",
    "sator-square":                  "Sator square",
    "sacred-cave":                   "Cave painting",
    "memento-mori-skull":            "Vanitas",
    "sacred-crown":                  "Crown (headgear)",
    "sacred-rose":                   "Rosa (symbolism)",
    "sacred-river":                  "Sacred river",
    "winged-disk":                   "Winged sun",
    "was-scepter":                   "Was-sceptre",
    "thread-of-fate":                "Moirai",
    "north-star":                    "Polaris",
    "evil-eye":                      "Evil eye",
    "dove":                          "Dove",
    "cow-sacred":                    "Sacred cow",
    "cosmic-serpent":                "Serpent (symbolism)",
    "blood-sacred":                  "Sacred",
    "divine-child":                  "Child god",
    "eleusinian-kykeon":             "Eleusinian Mysteries",
    "sacred-harvest":                "Harvest",
    "sacred-horse":                  "Horse sacrifice",
    "sacred-lance":                  "Holy Lance",
    "maypole-irminsul":              "Maypole",
    "sacred-mask":                   "Mask",
    "sacred-cauldron":               "Cauldron",
    "sulphur-mercury-salt":          "Tria prima",
    "tattoo-sacred":                 "Tattooing",
    "world-mountain":                "Mount Meru",
    "sacred-number-three":           "Sacred number three",
    "sacred-number-four":            "Tetractys",
    "sacred-number-five":            "Pentagon",
    "sacred-number-eight":           "Eight (number)",
    "sacred-number-zero":            "Zero",
    "sacred-void":                   "Śūnyatā",
    "sacred-pearl":                  "Pearl",
    "sacred-ring":                   "Ring (jewellery)",
    "sacred-scepter":                "Sceptre",
    "sacred-stag":                   "Cernunnos",
    "sacred-sword":                  "Sword",
    "sacred-threshold":              "Liminality",
    "sacred-twins":                  "Divine twins",
    "great-work":                    "Magnum opus (alchemy)",
    "eye-of-the-heart":              "Sufi philosophy",
    "pakal-sarcophagus-lid":         "Palenque sarcophagus",
    "pontos-riscados":               "Umbanda",
    "royal-arch":                    "Royal Arch Masonry",
    "ifa-divination":                "Ifá",
    "mosaic-pavement":               "Freemasons",
    "green-lion":                    "Alchemy",
    "sacrifice-substitution":        "Scapegoat",
    # Deities
    "chernobog":                     "Veles (god)",
    "dagda":                         "Cernunnos",
    "the-world-soul":                "Neoplatonism",
    "the-one-plotinus":              "Plotinus",
    "dyaus-pita":                    "Proto-Indo-European religion",
    "laima":                         "Baltic mythology",
    "stribog":                       "Slavic mythology",
    "svarog":                        "Slavic mythology",
    "bondye-vodou":                  "Haitian Vodou",
    "changing-woman":                "Navajo Nation",
    "wakan-tanka":                   "Lakota people",
    "ein-sof":                       "Kabbalah",
    "shekhinah":                     "Shekhinah",
    "kumarbi":                       "Hittite mythology",
    "tangaroa":                      "Tangaroa",
    "nasr-pre-islamic":              "Pre-Islamic Arabian religion",
    "asbeel":                        "Book of Enoch",
    "armaros":                       "Watchers (supernatural)",
    "baraqel":                       "Watchers (supernatural)",
    "bergelmir":                     "Norse mythology",
    "the-evil-god-cathar":           "Catharism",
    "the-elect-one-enochic":         "Book of Enoch",
    "astar-aksumite":                "Aksumite Empire",
    "beher":                         "Kingdom of Aksum",
    "belet-seri-akkadian":           "Ereshkigal",
    "bandua":                        "Lusitanian religion",
    "al-haqq":                       "Names of God in Islam",
    "almaqah":                       "Almaqah",
    "anshar-kishar":                 "Babylonian mythology",
    "nyame":                         "Gye Nyame",
    "obatala":                       "Obatala",
    "ogun":                          "Ogun",
    "orisha-oko":                    "Yoruba religion",
    "aganju":                        "Yoruba religion",
    "purusha":                       "Purusha",
    "thoth":                         "Thoth",
    "tlaloc":                        "Tlaloc",
    "enlil":                         "Enlil",
    "ereshkigal":                    "Ereshkigal",
    "ninkasi":                       "Ninkasi",
    "el-ugaritic":                   "El (deity)",
    "meness":                        "Baltic mythology",
    "wi-sun-lakota":                 "Lakota people",
    # Themes
    "archetype":                     "Carl Jung",
    "individuation":                 "Carl Jung",
    "son-of-man":                    "Son of man (Daniel)",
    "suffering-servant":             "Isaiah 53",
    "two-spirits-doctrine":          "Zoroastrianism",
    "dualism-cosmic":                "Dualistic cosmology",
    "divine-immanence":              "Immanence",
    "fulfillment-of-prophecy":       "Messianism",
    "gnosis-as-salvation":           "Gnosis",
    "hermetic-correspondences":      "Hermeticism",
    "hermetic-rebirth":              "Hermeticism",
    "hidden-god":                    "Deus absconditus",
    "hierophany":                    "Mircea Eliade",
    "iconography-and-aniconism":     "Aniconism in Islam",
    "forms-and-archetypes":          "Theory of forms",
    "logos-cosmic-reason":           "Logos",
    "logos-johannine":               "Gospel of John",
    "logos-philonic":                "Philo",
    "mystery-initiation":            "Mystery religion",
    "mystic-union":                  "Mystical union",
    "new-moses-typology":            "Typology (theology)",
    "non-duality":                   "Nondualism",
    "norse-cosmogony":               "Norse cosmology",
    "orisha-pantheon":               "Yoruba religion",
    "panentheism":                   "Panentheism",
    "pascal-wager":                  "Pascal's wager",
    "personal-daimon":               "Daimon",
    "pharmakos":                     "Pharmakos",
    "possession-ritual":             "Spirit possession",
    "primordial-waters":             "Primordial water",
    "prisca-theologia":              "Prisca theologia",
    "serpent-dual-nature":           "Serpent (symbolism)",
    "tauroctony-as-cosmic-icon":     "Mithraic mysteries",
    "theme-exodus-hyksos-thesis":    "Hyksos",
    "theme-graduated-afterlife":     "Afterlife",
    "theme-holy-spirit-sophia":      "Sophia (Gnosticism)",
    "theme-lex-talionis-covenant-code": "Code of Hammurabi",
    "theme-paradise-etymology":      "Paradise",
    "theme-persecution-as-legitimation": "Religious persecution",
    "theme-proto-indo-iranian-religion": "Proto-Indo-Iranian religion",
    "falsafa":                       "Islamic Golden Age",
    "fanaa-annihilation":            "Sufi philosophy",
    "four-kingdoms-schema":          "Four kingdoms of Daniel",
    "free-will-vs-determinism":      "Free will in theology",
    "genealogical-cosmogony":        "Theogony",
    "ground-of-being":               "Paul Tillich",
    "heavenly-tablets":              "Heavenly tablets",
    "heavenly-tour":                 "Merkabah mysticism",
    "heliopolis-ennead":             "Ennead",
    "henotheism-monolatry":          "Henotheism",
    "holy-spirit-empowered-witness": "Holy Spirit",
    "i-am-sayings":                  "I am (Gospel of John)",
    "ideal-state-myth":              "The Republic (Plato)",
    "idealism-metaphysical":         "Idealism",
    "in-christ":                     "Christ",
    "itinerant-discipleship":        "Apostle",
    "jain-karma":                    "Karma in Jainism",
    "justification-by-faith":        "Justification (theology)",
    "katabasis-and-anabasis":        "Orpheus",
    "lamentation-genre":             "Lamentations",
    "liberation-theology":           "Liberation theology",
    "light-and-darkness-dualism":    "Yin and yang",
    "liturgical-calendar":           "Liturgical year",
    "lost-continent":                "Atlantis",
    "marcionite-canon":              "Marcion of Sinope",
    "martyrdom-theology":            "Christian martyrdom",
    "mesoamerican-cosmogony":        "Aztec cosmology",
    "messianic-future-savior":       "Messianism",
    "messianic-genealogy":           "Genealogy of Jesus",
    "messianic-revelation":          "Apocalyptic literature",
    "messianism":                    "David",
    "miaphysite-christology":        "Ethiopian Orthodox Tewahedo Church",
    "microcosm-macrocosm":           "Macrocosm and microcosm",
    "mixture-cosmology":             "Manichaeism",
    "monastic-asceticism":           "Monasticism",
    "city-of-god-vs-earthly-city":   "Augustine of Hippo",
    "crusade-theology-of-malecide":  "Albigensian Crusade",
    "eleusinian-mystery-revelation": "Eleusinian Mysteries",
    "ethiopian-systematic-theology": "Ethiopian Orthodox Tewahedo Church",
    "ethiopic-canon-broad":          "Biblical canon",
    "evolutionary-cosmogony":        "Cosmology",
    "feminine-solar":                "Solar deity",
    "finisterre-end-of-world":       "Cape Finisterre",
    "flood-motif":                   "Flood myth",
    "four-ages-degeneration":        "Ages of Man",
    "gentile-inclusion":             "Gentile",
    "gentile-mission":               "Great Commission",
    "hermetic-piety":                "Hermeticism",
    "hermopolitan-ogdoad":           "Ogdoad (Egyptian)",
    "oral-tradition-transmission":   "Oral tradition",
    "orthodoxy-vs-heresy":           "Christian heresy",
    "paraclete-spirit":              "Paraclete",
    "passion-narrative":             "Crucifixion of Jesus",
    "persian-period-injection":      "Zoroastrianism",
    "predestination":                "Predestination",
    "predestination-protestant":     "Calvinism",
    "priestly-purity":               "Ritual purity",
    "progressive-revelation":        "Revelation (theology)",
    "prophet-and-king":              "Hebrew Bible",
    # Events
    "event-dead-sea-scrolls-discovery": "Qumran",
    "event-council-of-troyes-1129":  "Knights Templar",
    "event-ras-shamra-excavation-1928": "Ugarit",
    "event-sulawesi-cave-art-c-45500-bce": "Cave painting",
    "event-new-atheism-2004-2010":   "Atheism",
    "event-closure-platonic-academy-529": "Platonic Academy",
    "event-pittsburgh-platform-1885": "Reform Judaism",
    "nestorian-stele":               "Nestorian Stele",
    "event-ambedkar-mass-conversion-1956": "B. R. Ambedkar",
    "event-death-of-guru-arjan-1606": "Guru Arjan",
    "event-leo-taxil-hoax-1885-1897": "Léo Taxil hoax",
    "event-mahabodhi-temple-construction-c-260-bce-onwards": "Mahabodhi Temple",
    "event-malta-temples-c-3600-2500-bce": "Ġgantija",
    "event-mitanni-kingdom-c1500-1340-bce": "Mitanni",
    "event-mongol-sack-of-baghdad-1258": "Siege of Baghdad (1258)",
    "event-muhammads-miraj-619":     "Isra and Mi'raj",
    "event-natufian-burial-traditions-c-12500-9500-bce": "Natufian culture",
    "event-nero-persecution-64":     "Nero",
    "event-nine-saints-mission-c480": "Ethiopian Orthodox Tewahedo Church",
    "event-perpetua-felicity-203":   "Perpetua and Felicity",
    "event-portuguese-forced-conversion-1496": "Manuel I of Portugal",
    "queens-chamber-great-pyramid":  "Great Pyramid of Giza",
    # Persons
    "basilides":                     "Basilides",
    "tamil-three-nayanars":          "Shaiva Nayanmars",
    "vasco-da-gama":                 "Vasco da Gama",
    "the-elect-one-enochic":         "Enoch (ancestor of Noah)",
    "lal-ded":                       "Lalleshwari",
    "hypatia-of-alexandria":         "Hypatia",
    "nicholas-of-cusa":              "Nicholas of Cusa",
    "marsilio-ficino":               "Marsilio Ficino",
    "hildegard-von-bingen":          "Hildegard of Bingen",
    "meister-eckhart":               "Meister Eckhart",
    "al-hallaj":                     "Al-Hallaj",
    "john-dee":                      "John Dee",
    "giordano-bruno":                "Giordano Bruno",
    "simone-weil":                   "Simone Weil",
    "marcion-of-sinope":             "Marcion of Sinope",
    "simon-magus":                   "Simon Magus",
    "bardaisan-of-edessa":           "Bardaisan",
    "praxeas":                       "Patripassianism",
    "priscillian":                   "Priscillian",
    "apollinaris-of-laodicea":       "Apollinaris of Laodicea",
    "menander-of-samaria":           "Menander (Gnostic)",
    "joshua-ben-hananiah":           "Yehoshua ben Hananiah",

    # ---- Targeted fixes batch 2 (thumbnail-system-3c) ----
    # Traditions
    "tradition-christianity-canonical": "Christianity",
    "tradition-celtic":              "Druid",
    "tradition-navajo":              "Navajo people",
    "tradition-vajrayana-buddhism":  "Tibetan Buddhism",
    "tradition-hinduism":            "Hindu",
    "tradition-jainism":             "Mahavira",
    "tradition-alchemy":             "Alchemy",
    "tradition-rosicrucianism":      "Rosicrucianism",
    "tradition-theosophy":           "Theosophy",
    "tradition-freemasonry":         "Freemasonry",
    "tradition-sufism":              "Rumi",
    "tradition-tantra":              "Tantra",
    # Deities
    "saoshyant":                     "Saoshyant",
    "io-matua-kore":                 "Māori mythology",
    "ninazu":                        "Sumerian deity",
    "ruha":                          "Mandaeism",
    "laima":                         "Baltic religion",
    "the-evil-god-cathar":           "Rex Mundi",
    # Events
    "event-edict-of-thessalonica-380": "Theodosius I",
    "event-ramsay-oration-1737":     "Andrew Michael Ramsay",
    "event-ras-shamra-excavation-1928": "Cuneiform",
    "event-new-atheism-2004-2010":   "Richard Dawkins",
    "nestorian-stele":               "Xi'an",
    # Symbols
    "sacred-dove":                   "Dove",
    "cow-sacred":                    "Cattle in religion",
    "sacred-number-two":             "Yin and yang",
    "sacred-number-zero":            "Śūnyatā",
    "sacred-number-nine":            "Enneagram of Personality",
    "sacred-number-108":             "Japamala",
    # Themes
    "son-of-man":                    "Ancient of Days",
    "divine-immanence":              "Baruch Spinoza",
    "fulfillment-of-prophecy":       "Isaiah 53",
    "dualism-cosmic":                "Zoroastrianism",
    "tzimtzum":                      "Isaac Luria",
    "cosmopolitanism":               "Stoicism",

    # ---- Traditions/Events batch 3 (thumbnail-system-3d) ----
    "tradition-christianity-canonical": "Christianity",
    "tradition-celtic":              "Druid",
    "tradition-navajo":              "Navajo people",
    "tradition-vajrayana-buddhism":  "Tibetan Buddhism",
    "tradition-hinduism":            "Hindu",
    "tradition-jainism":             "Mahavira",
    "tradition-alchemy":             "Alchemy",
    "tradition-rosicrucianism":      "Rosicrucianism",
    "tradition-theosophy":           "Theosophy",
    "tradition-freemasonry":         "Freemasonry",
    "tradition-sufism":              "Rumi",
    "tradition-tantra":              "Tantra",
    "tradition-african-traditional": "Yoruba religion",
    "tradition-anthroposophy":       "Rudolf Steiner",
    "tradition-eglise-johannite":    "Templarism",
    "tradition-etruscan-religion":   "Etruscans",
    "tradition-hellenistic-philosophy": "Stoicism",
    "tradition-islam-mughal":        "Taj Mahal",
    "tradition-lusitanian-religion": "Lusitania",
    "tradition-maori":               "Māori mythology",
    "tradition-megalithic-atlantic": "Megalith",
    "tradition-mesoamerican":        "Aztec",
    "tradition-pentecostalism":      "Holy Spirit in Christianity",
    "tradition-samkhya-yoga":        "Yoga",
    "tradition-second-temple-judaism": "Temple Mount",
    "tradition-western-astrology":   "Zodiac",
    "tradition-won-buddhism":        "Korean Buddhism",
    "event-azusa-street-revival-1906": "Charles Parham",
    "event-death-of-hypatia-415":    "Alexandria",
    "event-fourth-buddhist-council-kanishka-c-100": "Kanishka",
    "event-jesuit-mission-ethiopia-1557-1632": "Jesuit",
    "event-leo-taxil-hoax-1885-1897": "Léo Taxil",
    "event-order-of-christ-foundation-1319": "Military Order of Christ",
    "event-stoning-of-stephen-c35ce": "Saint Stephen",
    "event-temple-leontopolis-foundation-c150bce": "Leontopolis",
    "event-third-buddhist-council-c-250-bce": "Ashoka",
    "event-wilhelmsbad-convent-1782": "Freemasonry",

    # ---- Symbols/events final fixes (thumbnail-system-3e) ----
    "sacred-sword":              "Excalibur",
    "cosmic-serpent":            "Ouroboros",
    "divine-child":              "Harpocrates",
    "bindu":                     "Sri Yantra",
    "nehushtan":                 "Moses",
    "sacred-river":              "Ganges",
    "eye-of-the-heart":          "Sufism",
    "sacred-number-eight":       "Ba Gua",
    "sacred-number-forty":       "Forty days",
    "event-rise-of-nones-2007-present": "Irreligion",

    # ---- Persons targeted fixes (thumbnail-system-3f) ----
    "ewostatewos":               "Ewostatewos",
    "fatima-bint-muhammad":      "Fatimah",
    "akbar-mughal":              "Akbar",
    "baal-shem-tov":             "Hasidism",
    "hongren":                   "Chan Buddhism",
    "ibn-taymiyya":              "Salafism",
    "zhuangzi-person":           "Taoism",
    "hamza-ibn-ali":             "Druze",
    "xunzi-person":              "Confucianism",
    "yohanan-ben-zakkai":        "Mishnah",
    "eliezer-ben-hyrcanus":      "Talmud",
    "marguerite-porete":         "Mysticism",
    "lal-ded":                   "Kashmir Shaivism",
    "thomas-vaughan":            "Rosicrucianism",
    "priscillian":               "Hispania",
    "basilides":                 "Gnosticism",
    "valentinus":                "Valentinianism",
    "bardaisan-of-edessa":       "Syriac Christianity",
    "saturninus":                "Antioch",
    "cerinthus":                 "Ephesus",
    "sabellius":                 "Modalism",
    "praxeas":                   "Trinity",
    "phoebe":                    "Epistle to the Romans",
    "menander-of-samaria":       "Simon Magus",
    "apollinaris-of-laodicea":   "Council of Constantinople",
    "firmicus-maternus":         "Roman religion",
    "shah-wali-allah":           "Delhi",
    "april-deconick":            "Gospel of Judas",
    "timothy":                   "Ephesus",
    "joshua-ben-hananiah":       "Mishnah",

    # ---- Deities targeted fixes (thumbnail-system-3g) ----
    "laima":                     "Dievturība",
    "saoshyant":                 "Frashokereti",
    "los":                       "William Blake",
    "yima-jamshid":              "Jamshid",
    "el-shaddai":                "Names of God in Judaism",
    "mastema":                   "Book of Jubilees",
    "telipinu":                  "Hittite mythology",
    "satanael":                  "Bogomilism",
    "ki-sumerian":               "Sumerian mythology",
    "tangaroa":                  "Polynesian mythology",
    "kingu":                     "Enuma Elish",
    "sky-woman":                 "Sky Woman",
    "yam":                       "Yam (god)",
    "vritra":                    "Vritra",
    "mullissu-akkadian":         "Ishtar",
    "ogma":                      "Irish mythology",
    "mitra-vedic":               "Mitra (Vedic deity)",
    "samantabhadra-buddha":      "Tibetan Buddhism",
    "iapetus":                   "Titan (mythology)",
    "ninkasi":                   "Ninkasi",
    "kane-hawaiian":             "Hawaiian mythology",
    "olokun":                    "Yoruba religion",
    "saraqael-archangel":        "Archangel",
    "endovelicus":               "Lusitanian religion",
    "wadd":                      "Arabian religion",
    "sun-bearer":                "Navajo people",
    "the-evil-god-cathar":       "Manichaeism",
    "the-good-god-cathar":       "Catharism",
    "reue-lusitanian":           "Iberian religion",
    "trebaruna":                 "Celtic religion",
    "meder":                     "Kingdom of Aksum",
    "mahrem":                    "Kingdom of Aksum",
    "bandua":                    "Votive inscription",
    "inyan":                     "Lakota people",
    "hermoni":                   "Book of Enoch",
    "hahyah-nephilim":           "Nephilim",
    "ohyah-nephilim":            "Nephilim",
    "kokabiel":                  "Watchers (supernatural)",
    "raguel-archangel":          "Raphael (archangel)",
    "yima-iranian":              "Yima",

    # ---- Theme targeted fixes (thumbnail-system-3h) ----
    "afro-diasporic-syncretism": "Candomblé",
    "bhakti-devotion":           "Mirabai",
    "theurgy":                   "Iamblichus",
    "bridal-mysticism":          "Bernard of Clairvaux",
    "adam-kadmon":               "Kabbalah",
    "sympathetic-magic":         "James George Frazer",
    "civic-religion":            "State religion",
    "monotheism-strict":         "Islamic theology",
    "theme-persecution-as-legitimation": "Martyrdom",
    "pseudoarchaeology":         "Ancient astronauts",
    "cosmic-body-cosmogony":     "Ymir",
    "ascent-of-the-soul":        "Ladder of Divine Ascent",
    "theme-vedic-avestan-split": "Avesta",
    "satanic-verses-incident":   "Satanic Verses",
    "stoic-virtue":              "Stoicism",
    "ecclesiology":              "Church (building)",
    "numinous":                  "Rudolf Otto",
    "ungrund":                   "Jacob Boehme",
    "tewahedo-christology":      "Ethiopian Orthodox Tewahedo Church",
    "theme-axial-age":           "Karl Jaspers",
    "watchers-and-fallen-angels": "Book of Enoch",
    "alien-god":                  "Deus absconditus",
    "divine-kingship":           "Divine right of kings",
    "mesoamerican-cosmogony":    "Popol Vuh",
    "syncretism-egyptian-greek": "Greco-Roman mysteries",
    "alchemical-marriage":       "Rosarium philosophorum",
    "anthropos-myth":            "Cosmic man",
    "theme-zoroastrian-jewish-exchange": "Zoroastrianism",
    "serpent-dual-nature":       "Ouroboros",
    "idealism-metaphysical":     "Plato",
    "henotheism-monolatry":      "Atenism",
    "orthodoxy-vs-heresy":       "Irenaeus",
    "messianic-future-savior":   "Messiah",
    "anticosmic":                "Dualism",
    "apatheia-and-virtue":       "Stoicism",
    "persecution-as-legitimation": "Martyrdom",
    "gnosis-as-salvation":       "Nag Hammadi library",
    "liberation-theology":       "Oscar Romero",
    "world-parent-cosmogony":    "Cosmogony",
    "heavenly-tablets":          "Book of Jubilees",
    "analogia-entis":            "Thomas Aquinas",
    "cosmic-cycles":             "Yuga",
    "apokatastasis":             "Universal reconciliation",
    "secular-spirituality":      "Secular humanism",
    "fanaa-annihilation":        "Sufi whirling",
    "paraclete-spirit":          "Paraclete",
    "righteous-suffering-vindication": "Book of Job",
    "occasionalism":             "Nicolas Malebranche",

    # ---- Final sweep (thumbnail-system-3i) ----
    "sacred-number-forty":       "Lent",
    "eye-of-the-heart":          "Heart chakra",
    "event-rise-of-nones-2007-present": "Pew Research Center",
    "satanic-verses-incident":   "The Satanic Verses (novel)",
    "sky-woman":                 "Iroquois",
    "yam":                       "Ugaritic mythology",
    "basilides":                 "Alexandria",
    "apollinaris-of-laodicea":   "Council of Constantinople",
    "valentinus":                "Valentinianism",
    "sabellius":                 "Modalism",
    "cosmic-cycles":             "Hindu cosmology",
    "progressive-revelation":    "Bahá'í Faith",
    "secular-spirituality":      "Spirituality",
    "satanael":                  "Bogomilism",
    "reue-lusitanian":           "Celtic Iberia",
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
    # Extended — gaps found during thumbnail-system-1 pass
    'theosoph', 'freemason', 'masonic',
    'polymath', 'historian', 'poet', 'physician',
    'caliph', 'imam', 'sunni', 'shia', 'shi\'a', 'muslim',
    'buddhist', 'buddhism', 'zen', 'chan', 'taoist', 'daoist', 'confucian',
    'psycholog', 'psychiatr', 'analyst',
    'emperor', 'pharaoh', 'king', 'queen', 'ruler', 'founder',
    'martyr', 'archbishop', 'cardinal', 'pope',
    'shaman', 'druid', 'magician', 'astrologer', 'theurg',
    'esoteric', 'initiat', 'perennial', 'traditionalist',
    'nationalist', 'revolutionary', 'independence',
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
    # OVERRIDES are human-vetted — skip for them (some OVERRIDE articles have short extracts)
    if node and node.get("id") not in OVERRIDES:
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
    # OVERRIDES are human-vetted — skip this gate entirely for them.
    if node and node.get("id") not in OVERRIDES:
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
    _lock = threading.Lock()

    def task(n):
        result = find_thumbnail(n)
        with _lock:
            cache[n["id"]] = result
            done[0] += 1
            if result is None:
                failures[0] += 1
                status = "·"
            else:
                status = "✓"
            cur = done[0]
            cur_fail = failures[0]
        if cur % 10 == 0 or cur == len(todo):
            print(f"  {cur:>4}/{len(todo)}  failures: {cur_fail:<3}  last: {status} {n['title'][:60]}")
        if cur % 25 == 0:
            with _lock:
                snapshot = dict(cache)
            CACHE.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")
        return result

    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        list(ex.map(task, todo))

    CACHE.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")
    hits = sum(1 for v in cache.values() if v)
    print(f"\nDone. {hits}/{len(cache)} nodes have a thumbnail. Cache → {CACHE.relative_to(VAULT)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
