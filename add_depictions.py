#!/usr/bin/env python3
"""
add_depictions.py — injects depictions[] blocks into null nodes.

Uses two strategies:
  1. DIRECT_FILES dict: exact Commons filenames → MD5 thumb URL (no API)
  2. SEARCH_TERMS dict: Commons search API for less-certain nodes (rate-limited)

Run: python3 add_depictions.py [--dry-run] [--search-only] [--direct-only]
"""

import json, glob, re, sys, time, urllib.request, urllib.parse, hashlib

DRY_RUN     = "--dry-run" in sys.argv
SEARCH_ONLY = "--search-only" in sys.argv
DIRECT_ONLY = "--direct-only" in sys.argv

# ── Strategy 1: Direct Commons file → MD5 thumb URL ─────────────────────────
# Format: node_id → (commons_filename, caption, license)
# Filename must be EXACTLY as on Commons (spaces as underscores, accented chars preserved)
DIRECT_FILES = {
    # DEITIES
    "nyame":                  ("Gye_nyame_symbol.jpg",
                               "Gye Nyame — Akan symbol of God's supremacy (Ghana)",
                               "CC BY-SA 4.0"),
    "the-one-plotinus":       ("Plotinus.jpg",
                               "Plotinus — Roman marble bust of the Neoplatonist philosopher",
                               "Public Domain"),
    "plotinus":               ("Plotinus.jpg",
                               "Plotinus — Roman marble bust",
                               "Public Domain"),
    "thoth":                  ("Thoth.svg",
                               "Thoth — Egyptian deity of writing and wisdom, ibis-headed",
                               "Public Domain"),
    "tlaloc":                 ("Tlaloc_(Museo_Nacional_de_Antropolog%C3%ADa)_-_Telleriano_Remensis.jpg",
                               "Tlaloc — Aztec rain deity, from the Codex Telleriano-Remensis",
                               "Public Domain"),
    "tangaroa":               ("Tangaroa_(1).jpg",
                               "Tangaroa — Polynesian god of the sea; carved wooden figure",
                               "CC BY-SA 3.0"),
    "enlil":                  ("Tablet_of_Shamash_relief.jpg",
                               "Shamash/Enlil — Babylonian sun-god enthroned; stele c. 9th c. BCE",
                               "Public Domain"),
    "the-world-soul":         ("Anima_Mundi_(Fludd).jpg",
                               "Anima Mundi — Robert Fludd's diagram of the World Soul, 1617",
                               "Public Domain"),
    "chernobog":              ("Chernobog_and_the_Black_God.jpg",
                               "Chernobog — Slavic black deity; 19th-century illustration",
                               "Public Domain"),
    "dagda":                  ("Dagda.jpg",
                               "The Dagda — Irish mythological god; 19th-century illustration",
                               "Public Domain"),
    "kumarbi":                ("Yazılıkaya_A_64_Sharruma.jpg",
                               "Yazılıkaya rock sanctuary, Hattusa — Hittite storm-god relief, c. 13th c. BCE",
                               "CC BY-SA 3.0"),
    "wakan-tanka":            ("Catlin_-_Big_Bend_of_the_Upper_Missouri.jpg",
                               "Great Plains — Lakota homeland; George Catlin painting, 1832",
                               "Public Domain"),
    "purusha":                ("Rigveda_MS2097.jpg",
                               "Rigveda manuscript — oldest text containing the Purusha Sukta hymn",
                               "Public Domain"),
    "ein-sof":                ("Sefirot_diagram.svg",
                               "Sefirot diagram — the Kabbalistic Tree of Life emanating from Ein Sof",
                               "Public Domain"),
    "ogun":                   ("Ogun_iron_figure.jpg",
                               "Ogun — Yoruba deity of iron; iron votive figure",
                               "CC BY-SA 4.0"),
    "obatala":                ("Obatala_sculpture.jpg",
                               "Obatala — Yoruba creator deity; ritual sculpture",
                               "CC BY-SA 4.0"),
    "ereshkigal":             ("Burney_Relief_Babylon_-2000-1600.jpg",
                               "Queen of the Night relief — possible depiction of Ereshkigal or Ishtar, c. 1800–1750 BCE",
                               "Public Domain"),
    "bondye-vodou":           ("Vodou_ceremony.jpg",
                               "Vodou ceremony — ritual invocation in which Bondye is the supreme creator",
                               "CC BY-SA 3.0"),
    "changing-woman":         ("Navajo_Night_Chant.jpg",
                               "Navajo Night Chant sandpainting — the ceremony in which Changing Woman figures centrally",
                               "Public Domain"),
    "laima":                  ("Laima_altar_Latvia.jpg",
                               "Laima — Baltic fate goddess; wayside shrine stone, Latvia",
                               "CC BY-SA 3.0"),
    "dyaus-pita":             ("Vedic_fire_ritual.jpg",
                               "Vedic fire ritual (yajña) — the cultic world in which Dyaus Pita was invoked",
                               "CC BY-SA 2.0"),
    "shekhinah":              ("Etz_chayim.svg",
                               "Etz Chayim (Tree of Life) — Kabbalistic diagram; the Shekhinah is the Malkhut sefira",
                               "Public Domain"),
    "stribog":                ("Slavic_pagan_deity_statue.jpg",
                               "Slavic pagan deity — wooden idol; Stribog is the Slavic wind deity",
                               "CC BY-SA 3.0"),
    "svarog":                 ("Svarog_idol.jpg",
                               "Svarog — Slavic sky/fire deity; modern reconstruction of wooden idol",
                               "CC BY-SA 3.0"),

    # DEITIES — pass 2 (2026-05-22) Wikidata-P18 + non-EN-Wikipedia sweep
    "israfil":                ("Israfil1.png",
                               "Isrāfīl — angel who blows the trumpet of resurrection; Islamic miniature",
                               "Public Domain"),
    "dizang-ksitigarbha":     ("Ksitigarbha_Bodhisattva_Painting.jpeg",
                               "Kṣitigarbha — bodhisattva of the underworld; East Asian painting tradition",
                               "Public Domain"),
    "wiraqocha":              ("2Wiener-Tintin-Dieu_Soleil.jpg",
                               "Viracocha — Inca creator deity; Tiwanaku-stylization line drawing (Wiener/Tintin)",
                               "Public Domain"),
    "yum-kaax":               ("Maya_Hieroglyphs_Fig_06.jpg",
                               "Yum Kaax — Maya maize and harvest god; hieroglyphic representation",
                               "Public Domain"),
    "prithvi":                ("Prithu_-_Crop.jpg",
                               "Pṛthivī — Vedic earth goddess; depicted with King Prithu (her eponym)",
                               "Public Domain"),
    "zorya":                  ("Zvezda-Zirka_by_Andrey_Shishkin.jpg",
                               "Zorya — Slavic dawn goddess; modern painting by Andrey Shishkin",
                               "CC BY-SA 4.0"),
    "ame-no-hohi":            ("Amenohohi_shinbutsu-zue.jpg",
                               "Ame-no-Hohi — Japanese kami; Shinbutsu-zue (1832) illustration",
                               "Public Domain"),
    "sundareswarar":          ("Unidentified_-_Sundareshvara_feeding_sugarcane_to_the_elephant_-_2021.328_-_Metropolitan_Museum_of_Art.jpg",
                               "Sundareshvara feeding sugarcane to the elephant — Tamil temple painting; Metropolitan Museum of Art",
                               "CC0"),
    "hunab-ku":               ("Maya_calendar_(Hunab-Ku).svg",
                               "Hunab Ku — Maya central-deity glyph as cosmic-calendar symbol (post-Conquest formulation)",
                               "Public Domain"),
    "belenos":                ("Gundestrupkarret_F.I.7074b.jpg",
                               "Gundestrup cauldron, plate b — Celtic ritual silver vessel; iconographic context for Belenos",
                               "Public Domain"),
    "gugalanna":              ("Ea_(Babilonian)_-_EnKi_(Sumerian).jpg",
                               "Mesopotamian deity Ea/Enki — Sumerian pantheon context for Gugalanna (husband of Ereshkigal)",
                               "Public Domain"),
    "haumia-tiketike":        ("Maorigodsymbols.jpg",
                               "Māori god-symbols — chart of the atua family including Haumia-tiketike (fern-root deity)",
                               "Public Domain"),
    "nethuns":                ("Usil,_Nethuns,_Thesan.jpg",
                               "Usil, Nethuns, Thesan — Etruscan sun/water/dawn triad; bronze mirror engraving",
                               "Public Domain"),
    "suwa":                   ("Antico_yemen,_al-jawf,_statuette_di_donne_sedute,_III-I_sec._ac._03.JPG",
                               "Pre-Islamic Arabian female statuettes from al-Jawf, Yemen — cultic context for Suwāʿ",
                               "CC BY-SA 3.0"),
    "aine":                   ("Ainefairyqueen.jpg",
                               "Áine, fairy-queen of Munster — Irish illustration of the sovereignty/sun goddess",
                               "Public Domain"),
    "tapio":                  ("Tapio_väkineen_1898.jpg",
                               "Tapio with his retinue — Finnish forest-spirit; 1898 illustration",
                               "Public Domain"),

    # SYMBOLS
    "all-seeing-eye":         ("Eye_of_Providence.svg",
                               "Eye of Providence — the all-seeing eye above a pyramid; United States Great Seal",
                               "Public Domain"),
    "feather-of-maat":        ("WeightingOfTheHeart.jpg",
                               "Weighing of the Heart — Egyptian Book of the Dead; heart weighed against feather of Ma'at",
                               "Public Domain"),
    "lamassu":                ("Louvre_-_Winged_human-headed_bull.jpg",
                               "Lamassu — Winged human-headed bull from Dur-Sharrukin (Louvre), 721–705 BCE",
                               "CC BY 2.5"),
    "cauldron-of-rebirth":    ("Gundestrup_Cauldron-_Outer_Plate_E.jpg",
                               "Gundestrup Cauldron — silver Celtic ceremonial vessel, 1st c. BCE; outer plate E",
                               "Public Domain"),
    "sator-square":           ("Sator_arepo_tenet_opera_rotas.jpg",
                               "Sator Square — palindromic word square from Pompeii, 1st c. CE",
                               "Public Domain"),
    "sacred-eclipse":         ("Solar_eclipse_1999_4_NR.jpg",
                               "Total solar eclipse, 1999 — the corona visible during totality",
                               "CC BY-SA 3.0"),
    "memento-mori-skull":     ("Vanitas_-_Pieter_Claesz_-_1630.jpg",
                               "Vanitas — Pieter Claesz, 1630; memento mori still life with skull",
                               "Public Domain"),
    "oshe-shango":            ("Shango_staff.jpg",
                               "Oshe Shango — Yoruba double-axe staff of the thunder deity Shango",
                               "CC BY-SA 4.0"),
    "rainbow-bridge":         ("Bifrost.jpg",
                               "Bifröst — the rainbow bridge of Norse mythology; 19th-century illustration",
                               "Public Domain"),
    "sacred-cat":             ("Gayer-Anderson_cat.jpg",
                               "Gayer-Anderson Cat — bronze seated sacred cat, Late Period Egypt (~664–332 BCE)",
                               "Public Domain"),
    "sacred-fire":            ("Zoroastrian_fire_temple.jpg",
                               "Zoroastrian fire temple — the sacred flame kept burning in an Atash Bahram",
                               "CC BY-SA 3.0"),
    "sacred-number-seven":    ("Menorah_of_the_Temple.jpg",
                               "Menorah — the seven-branched lampstand of the Jerusalem Temple (relief, Arch of Titus, 81 CE)",
                               "Public Domain"),
    "sacred-number-108":      ("Japa_mala.jpg",
                               "Japa mala — prayer beads with 108 beads, used in Hindu and Buddhist practice",
                               "CC BY-SA 3.0"),
    "kaaba-black-stone":      ("Kaaba_at_night_2.jpg",
                               "Kaaba — the cuboid shrine at the centre of the Grand Mosque, Mecca",
                               "CC BY-SA 4.0"),
    "asherah-pole":           ("Figurine_female_Louvre_AO_20127.jpg",
                               "Canaanite female figurine — pillar figurine type associated with Asherah cult",
                               "CC BY 2.5"),
    "sacred-cave":            ("Altamira_bison.jpg",
                               "Altamira cave — bison painted on the cave ceiling, c. 14,000 BCE; Spain",
                               "Public Domain"),
    "aten-disk":              ("Akhenaten_sacrificing.jpg",
                               "Akhenaten sacrificing under the Aten disk — Amarna period relief, c. 1345 BCE",
                               "Public Domain"),
    "bindu":                  ("Sri_Yantra_256bw.jpg",
                               "Sri Yantra — the central dot (bindu) is the point of cosmic origin in Tantric cosmology",
                               "Public Domain"),
    "chaos-star":             ("Chaos_star.svg",
                               "Chaos star — eight-pointed symbol of infinite possibility; from Michael Moorcock's Eternal Champion",
                               "CC BY-SA 3.0"),

    # THEMES
    "world-axis":             ("Yggdrasil.jpg",
                               "Yggdrasil — the Norse world-tree; 19th-century illustration by Oluf Olufsen Bagge",
                               "Public Domain"),
    "flood-myth":             ("The_Deluge_-_Francis_Danby.jpg",
                               "The Deluge — Francis Danby, 1837–1840; the universal flood in visual art",
                               "Public Domain"),
    "tower-of-babel":         ("Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_(Vienna)_-_Google_Art_Project_-_edited.jpg",
                               "Tower of Babel — Pieter Bruegel the Elder, 1563; Kunsthistorisches Museum, Vienna",
                               "Public Domain"),
    "apocalypse":             ("Durer_-_The_Four_Horsemen_of_the_Apocalypse.jpg",
                               "Four Horsemen of the Apocalypse — Albrecht Dürer woodcut, 1497–1498",
                               "Public Domain"),
    "apotheosis":             ("Apotheosis_of_Washington_(Brumidi).jpg",
                               "Apotheosis of Washington — Constantino Brumidi fresco, US Capitol, 1865",
                               "Public Domain"),
    "sacred-geometry":        ("Metatrons_cube.svg",
                               "Metatron's Cube — sacred geometry figure containing the five Platonic solids",
                               "Public Domain"),
    "sacred-marriage":        ("Hieros_gamos.jpg",
                               "Hieros gamos — sacred marriage tablet from Nippur, c. 2000 BCE",
                               "Public Domain"),
    "dying-rising-god":       ("Osiris_and_Isis.jpg",
                               "Osiris and Isis — the resurrection myth of the dying-rising god; Egyptian stele",
                               "Public Domain"),
    "underworld-descent":     ("Orpheus_leading_Eurydice.jpg",
                               "Orpheus leading Eurydice from the Underworld — Jean-Baptiste-Camille Corot, 1861",
                               "Public Domain"),
    "trickster-archetype":    ("Raven_Steals_the_Sun.jpg",
                               "Raven steals the sun — Northwest Coast indigenous art; Raven is the preeminent trickster",
                               "CC BY-SA 3.0"),
    "son-of-man":             ("Daniel_vision.jpg",
                               "Daniel's vision of the Son of Man — Gustave Doré illustration",
                               "Public Domain"),
    "individuation":          ("Jung_mandala.jpg",
                               "Mandala — Carl Jung's self-drawn mandala; the symbol of individuation",
                               "Public Domain"),
    "creation-ex-nihilo":     ("Michelangelo_-_Creation_of_Adam_(cropped).jpg",
                               "Creation of Adam — Michelangelo, Sistine Chapel, 1508–1512",
                               "Public Domain"),
    "virgin-birth":           ("Fra_Angelico_-_The_Annunciation_-_WGA00618.jpg",
                               "The Annunciation — Fra Angelico, c. 1426; the moment of the Virgin Birth",
                               "Public Domain"),
    "harrowing-of-hell":      ("Anastasis_mosaic_Chora.jpg",
                               "Anastasis mosaic — Chora Church, Istanbul, 14th c.; Christ harrowing Hell",
                               "CC BY-SA 3.0"),
    "imago-dei":              ("Vitruvian_Man_by_da_Vinci.jpg",
                               "Vitruvian Man — Leonardo da Vinci, c. 1490; the human as Imago Dei",
                               "Public Domain"),
    "theophany":              ("Moses_and_the_burning_bush.jpg",
                               "Moses and the Burning Bush — theophany; Raphael, c. 1514–1515",
                               "Public Domain"),
    "transmigration":         ("Wheel_of_Life_(Bhavachakra).jpg",
                               "Bhavachakra — Wheel of Life; the Buddhist/Hindu cosmology of transmigration",
                               "Public Domain"),
    "world-tree":             ("Yggdrasil.jpg",
                               "Yggdrasil — the cosmic World Tree of Norse mythology",
                               "Public Domain"),
    "sacred-language":        ("Isaiah_Scroll.jpg",
                               "Isaiah Scroll — Dead Sea Scrolls; sacred Hebrew text, 1st century BCE",
                               "Public Domain"),
    "sacred-mountain":        ("Mount_Sinai_Sunset.jpg",
                               "Mount Sinai at sunset — sacred mountain of the Mosaic revelation",
                               "CC BY 2.0"),
    "initiation":             ("Eleusis_-_Telestérion.jpg",
                               "Telesterion, Eleusis — the hall of initiation for the Eleusinian Mysteries",
                               "CC BY-SA 2.0"),
    "prophetic-consciousness": ("Isaiah_Scroll.jpg",
                               "Great Isaiah Scroll — Dead Sea Scrolls; the prophetic tradition's founding text",
                               "Public Domain"),
    "sacrifice":              ("Frieze_of_Panathenaic_procession_Acropolis_Museum.jpg",
                               "Panathenaic procession frieze — sacrifice procession; Parthenon, 447–438 BCE",
                               "CC BY-SA 3.0"),
    "soul-journey":           ("Book_of_the_Dead_of_Hunefer.jpg",
                               "Book of the Dead of Hunefer — the soul's journey through the Duat; c. 1275 BCE",
                               "Public Domain"),
    "spiritual-warfare":      ("Saint_Michael_Archangel_Guido_Reni.jpg",
                               "Saint Michael defeating Satan — Guido Reni, 1636; spiritual warfare in visual art",
                               "Public Domain"),
    "the-fall-of-man":        ("Adam_and_Eve_Durer.jpg",
                               "Adam and Eve — Albrecht Dürer, 1504; the Fall from Paradise",
                               "Public Domain"),
    "visionary-experience":   ("Ezekiel_Vision_Raphael.jpg",
                               "Vision of Ezekiel — Raphael, c. 1518; the chariot-throne theophany",
                               "Public Domain"),
    "gnosis-salvific-knowledge": ("Nag_Hammadi_Codex_II.jpg",
                               "Nag Hammadi Codex II — c. 4th century CE; the library of Gnostic texts",
                               "Public Domain"),
    "exaltation-of-the-throne": ("Merkabah_mysticism.jpg",
                               "Merkabah — the chariot-throne; illuminated Ezekiel vision",
                               "Public Domain"),
    "messianism":             ("Messiah_on_white_horse.jpg",
                               "The Messiah — medieval illumination of the messianic king",
                               "Public Domain"),
    "mystery-religion":       ("Eleusis_Fleeing_woman.jpg",
                               "Eleusis mystery frieze — initiate in the Eleusinian Mysteries",
                               "Public Domain"),
    "golden-age":             ("Lucas_Cranach_the_Elder_-_The_Golden_Age_(c._1530).jpg",
                               "The Golden Age — Lucas Cranach the Elder, c. 1530",
                               "Public Domain"),
    "parousia":               ("Pantocrator_mosaic_Cefalù_Cathedral.jpg",
                               "Christ Pantocrator — Cefalù Cathedral apse mosaic, 12th c.; the returning cosmic Christ",
                               "Public Domain"),
    "resurrection":           ("Grünewald_-_Die_Auferstehung_Christi_(Detail).jpg",
                               "Resurrection of Christ — Matthias Grünewald, Isenheim Altarpiece, c. 1515",
                               "Public Domain"),
    "trinity":                ("Shield_of_the_Trinity_-_English.svg",
                               "Shield of the Trinity — traditional diagram of the Christian Trinity doctrine",
                               "Public Domain"),
    "covenant":               ("Moses_Breaks_the_Tablets_of_the_Law.jpg",
                               "Moses and the Tablets — Rembrandt, 1659; the covenant at Sinai",
                               "Public Domain"),
    "prayer":                 ("Mosque_Wazir_Khan_Lahore_by_Mir_Khokar.jpg",
                               "Wazir Khan Mosque, Lahore — congregational prayer space; 17th century",
                               "CC BY-SA 4.0"),
    "ritual":                 ("Stonehenge_Total_Solar_Eclipse.jpg",
                               "Stonehenge — monumental ritual space, c. 3000–1600 BCE",
                               "CC BY-SA 4.0"),
    "reincarnation":          ("Wheel_of_Samsara.jpg",
                               "Wheel of Samsara — Buddhist cycle of reincarnation; Tibetan thangka",
                               "Public Domain"),
    "shamanism":              ("Shaman_Drum.jpg",
                               "Shaman with drum — Siberian shaman in ritual dress",
                               "CC BY-SA 3.0"),

    # TRADITIONS
    "tradition-essenes":      ("Qumran_cave_4.jpg",
                               "Cave 4, Qumran — where most Dead Sea Scrolls were discovered in 1952",
                               "CC BY-SA 3.0"),
    "tradition-vedic-hinduism": ("Vedic_fire_sacrifice.jpg",
                               "Vedic fire sacrifice (yajña) — the ritual at the heart of the Vedic tradition",
                               "CC BY-SA 2.0"),
    "tradition-theravada-buddhism": ("Doi_Suthep_temple_Thailand.jpg",
                               "Wat Phra That Doi Suthep — Theravada Buddhist temple, Chiang Mai, Thailand",
                               "CC BY-SA 2.5"),
    "tradition-shia-islam":   ("Imam_Husayn_shrine.jpg",
                               "Shrine of Imam Husayn ibn Ali — Karbala, Iraq; centre of Shia devotion",
                               "CC BY-SA 4.0"),
    "tradition-early-christianity": ("Rome_Catacombe_di_Priscilla_04.jpg",
                               "Catacombs of Priscilla, Rome — earliest Christian painting, c. 2nd–3rd century",
                               "CC BY-SA 3.0"),
    "tradition-druze":        ("Druze_star.svg",
                               "Druze star — five-pointed star with five colours symbolizing the five cosmic principles",
                               "Public Domain"),
    "tradition-cao-dai":      ("Cao_Dai_temple.jpg",
                               "Cao Dai temple, Tây Ninh — syncretic Vietnamese religion founded 1926",
                               "CC BY-SA 2.0"),
    "tradition-bon-tibet":    ("Bon_ceremony.jpg",
                               "Bön ceremony — pre-Buddhist Tibetan shamanistic tradition",
                               "CC BY-SA 2.5"),
    "tradition-sikhism":      ("Harmandir_Sahib_reflection.jpg",
                               "Harmandir Sahib (Golden Temple) — Amritsar; most sacred site in Sikhism",
                               "CC BY-SA 3.0"),
    "tradition-taoism":       ("Yin_yang.svg",
                               "Yin-Yang symbol — the central emblem of Taoist cosmology",
                               "Public Domain"),
    "tradition-shinto":       ("Fushimi_Inari_Torii.jpg",
                               "Fushimi Inari Taisha — the tunnel of torii gates; Kyoto, Japan",
                               "CC BY-SA 3.0"),
    "tradition-confucianism": ("Confucius_Tang_Dynasty.jpg",
                               "Confucius — Tang Dynasty portrait; Taipei National Palace Museum",
                               "Public Domain"),

    # EVENTS
    "event-dead-sea-scrolls-discovery": ("Qumran_cave_4.jpg",
                               "Cave 4, Qumran — where the majority of the Dead Sea Scrolls were found, 1952",
                               "CC BY-SA 3.0"),
    "event-council-of-troyes-1129": ("Templar_Seal.jpg",
                               "Seal of the Knights Templar — two knights on one horse; founded at Council of Troyes 1129",
                               "Public Domain"),
    "event-sulawesi-cave-art-c-45500-bce": ("Sulawesi_cave_art.jpg",
                               "Sulawesi cave art — Leang Tedongnge, Indonesia; oldest figurative art, c. 45,500 BCE",
                               "CC BY-SA 4.0"),
    "event-closure-platonic-academy-529": ("Justinian_mosaic_Ravenna.jpg",
                               "Justinian I mosaic — Ravenna, c. 547; Justinian closed the Platonic Academy in 529 CE",
                               "Public Domain"),
    "queens-chamber-great-pyramid": ("Great_Pyramid_Cross-Section.jpg",
                               "Great Pyramid cross-section — the Queen's Chamber is in the lower passage system",
                               "Public Domain"),

    # PERSONS
    "basilides":              ("Gnostic_Gem_Abraxas.jpg",
                               "Gnostic gem with Abraxas — Basilidean cosmology; Abraxas is the supreme being in Basilides' system",
                               "Public Domain"),
    "the-elect-one-enochic":  ("Book_of_Enoch_illustration.jpg",
                               "Book of Enoch — the Elect One/Son of Man is the central eschatological figure",
                               "Public Domain"),
    "valentinus":             ("Valentinus_Gnostic.jpg",
                               "Valentinus — Gnostic teacher; the most sophisticated philosophical Gnostic of 2nd century",
                               "Public Domain"),
    "marcion-of-sinope":      ("Marcion_of_Sinope.jpg",
                               "Marcion of Sinope — early Christian dualist, 2nd century CE",
                               "Public Domain"),
    "simon-magus":            ("Simon_Magus.jpg",
                               "Simon Magus — the Samaritan sorcerer of Acts 8; later elaborated in Gnostic tradition",
                               "Public Domain"),
    "lal-ded":                ("Kashmir_Shaivism.jpg",
                               "Kashmir — the landscape of Lal Ded's mystical poetry and Shaiva tradition",
                               "CC BY-SA 2.0"),
    "hypatia-of-alexandria":  ("Hypatia_portrait.png",
                               "Hypatia of Alexandria — mathematician and Neoplatonist philosopher, c. 360–415 CE",
                               "Public Domain"),
    "nicholas-of-cusa":       ("Nicholas_of_Cusa_portrait.jpg",
                               "Nicholas of Cusa — Cardinal and philosopher of learned ignorance, 1401–1464",
                               "Public Domain"),
    "marsilio-ficino":        ("Ficino.jpg",
                               "Marsilio Ficino — Florentine Renaissance philosopher and translator of Plato",
                               "Public Domain"),
    "hildegard-von-bingen":   ("Hildegard_von_Bingen.jpg",
                               "Hildegard of Bingen — Rhineland mystic, composer, and visionary, 1098–1179",
                               "Public Domain"),
    "meister-eckhart":        ("Meister_Eckhart.jpg",
                               "Meister Eckhart — Dominican mystic and theologian, c. 1260–1328",
                               "Public Domain"),
    "al-hallaj":              ("Al-Hallaj.jpg",
                               "Al-Hallaj — Sufi martyr executed for the declaration 'I am the Truth', 922 CE",
                               "Public Domain"),
    "john-dee":               ("John_Dee_Ashmolean.jpg",
                               "John Dee — Elizabethan mathematician, astrologer, and angelic communicator",
                               "Public Domain"),
    "giordano-bruno":         ("Giordano_Bruno.jpg",
                               "Giordano Bruno — philosopher burned at the stake in Rome, 1600",
                               "Public Domain"),
    "simone-weil":            ("Simone_Weil_age_10.jpg",
                               "Simone Weil — French philosopher, mystic, and political activist, 1909–1943",
                               "Public Domain"),

    # DOCUMENTS
    "phase-1-001-enuma-elish": ("Enuma_Elish.jpg",
                               "Enuma Elish — Babylonian creation epic; cuneiform tablets, 7th c. BCE copy",
                               "Public Domain"),
    "phase-2-004-book-of-enoch": ("Book_of_Enoch_manuscript.jpg",
                               "Book of Enoch — Ge'ez manuscript; the Watchers and apocalyptic Son of Man traditions",
                               "Public Domain"),
    "phase-6-001-emerald-tablet": ("Emerald_tablet.jpg",
                               "Emerald Tablet — 1541 edition; the foundational text of Hermetic alchemy",
                               "Public Domain"),
    "phase-7-011-divine-comedy": ("Gustave_Dore_Inferno34.jpg",
                               "Dante's Inferno — Gustave Doré illustration, 1861; the Divine Comedy",
                               "Public Domain"),
    "phase-7-024-leviathan-hobbes": ("Leviathan_by_Thomas_Hobbes.jpg",
                               "Leviathan frontispiece — Thomas Hobbes, 1651; the sovereign commonwealth as body",
                               "Public Domain"),
}

# ── Strategy 2: Commons search for nodes not in DIRECT_FILES ─────────────────
SEARCH_TERMS = {
    # Nodes worth trying via search where filename is uncertain
    "aganju":                 "Aganju orisha Yoruba deity sculpture",
    "almaqah":                "Almaqah moon god Sabaean South Arabian",
    "anshar-kishar":          "Anshar Kishar Babylonian primordial seal",
    "nasr-pre-islamic":       "pre-Islamic Arabian eagle deity relief",
    "ninkasi":                "Ninkasi Sumerian goddess beer seal",
    "armaros":                "Book of Enoch watchers fallen angels illustration",
    "asbeel":                 "watchers fallen angels Enoch illumination",
    "baraqel":                "Enoch angels lightning watcher",
    "bergelmir":              "Norse giant flood mythology illustration",
    "astar-aksumite":         "Aksumite obelisk Ethiopia ancient",
    "beher":                  "Aksumite Ethiopian ancient inscription stele",
    "belet-seri-akkadian":    "Akkadian underworld deity cylinder seal",
    "bandua":                 "Lusitanian Celtic deity inscription Roman",
    "the-evil-god-cathar":    "Cathar dualism illuminated manuscript France",
    "el-ugaritic":            "El Canaanite god Ugarit stele bronze",
    "orisha-oko":             "Yoruba deity agriculture sculpture",
    "al-haqq":                "99 names Allah Islamic calligraphy gold",

    "thoth-caduceus":         "Caduceus Hermes Mercury staff serpents",
    "oshe-shango":            "Shango Yoruba thunder axe wood carving",
    "sacred-void":            "Buddhist sunyata emptiness calligraphy heart sutra",

    "tradition-islamic-modernism": "Muhammad Abduh Islamic reform Egypt",
    "tradition-jyotisha-indian-astrology": "Jyotisha Indian astrology chart Sanskrit",
    "tradition-hindu-modernism": "Vivekananda Ramakrishna Hindu reform portrait",
    "tradition-alevi":        "Alevi Bektashi Turkey cem ceremony",
    "tradition-african-traditional": "African traditional religion ceremony Nigeria",
    "tradition-candomble":    "Candomble Brazil orixá ceremony altar",
    "tradition-umbanda":      "Umbanda Brazil spirit altar ceremony",
    "tradition-ifa-divination": "Ifa divination Yoruba opele board",
    "tradition-indigenous-australian": "Aboriginal Australian rock art Kakadu",
    "tradition-indigenous-north-american": "Native American totem pole ceremony",
    "tradition-indigenous-mesoamerican": "Maya Aztec ceremony pyramid Teotihuacan",
    "tradition-indigenous-south-american": "Andean Inca ceremony textile Machu Picchu",
    "tradition-reconstructionism-jewish": "Conservative Reform synagogue modern Judaism",
    "tradition-hurufism":     "Hurufism Arabic letter mysticism Ottoman",

    "event-ras-shamra-excavation-1928": "Ras Shamra Ugarit tablet cuneiform excavation",
    "event-new-atheism-2004-2010": "Richard Dawkins God Delusion atheism book",
    "event-death-of-guru-arjan-1606": "Guru Arjan Dev Sikh Granth Sahib Amritsar",
    "event-council-of-troyes-1129": "Knights Templar founding Bernard Clairvaux seal",

    "bardaisan-of-edessa":    "Bardaisan Edessa Syrian Gnostic scholar",
    "praxeas":                "Praxeas Monarchianism early Christianity",
    "priscillian":            "Priscillian bishop heresy Spain Avila",
    "apollinaris-of-laodicea": "Apollinarianism Christology Council Nicaea",
    "menander-of-samaria":    "Simon Magus Samaritans Gnostic teacher Acts",
    "joshua-ben-hananiah":    "Rabbi Yehoshua ben Hananiya Talmud sage",

    "suffering-servant":      "Isaiah servant songs illuminated manuscript Hebrew",
    "katabasis-and-anabasis": "Orpheus Eurydice underworld descent Greek vase",
    "two-spirits-doctrine":   "Zoroastrian Ahura Mazda Angra Mainyu good evil",
    "dualism-cosmic":         "Zoroastrian cosmic dualism light darkness relief",
    "fulfillment-of-prophecy": "Isaiah prophecy fulfillment manuscript scroll",
    "divine-spark":           "divine spark light soul Gnostic alchemical",
    "sacred-kingship":        "sacred kingship pharaoh coronation Egypt",
    "holy-war":               "crusade knights medieval illuminated siege",
    "logos":                  "Logos Greek philosophy John prologue manuscript",
    "mystical-union":         "mystical union God soul Sufi whirling dervish",
    "number-symbolism":       "Pythagorean sacred numbers geometry tetractys",
    "sophia-divine":          "Sophia divine wisdom icon Hagia Sophia",
    "theosophy-divine-wisdom": "Helena Blavatsky Theosophy Isis Unveiled",
    "syncretism":             "religious syncretism Hellenistic gods Roman Egypt",
    "occult-transmission":    "Rosicrucian manifesto Fama Fraternitatis 1614",
    "prophetic-consciousness": "Hebrew prophet scroll ancient writing",
    "zodiac-cosmic-order":    "zodiac medieval illuminated manuscript astrology",
    "exile-and-return":       "Jewish exile Babylon return illuminated manuscript",
    "temple-cosmos":          "Jerusalem Temple menorah Holy of Holies model",
    "the-divine-feminine":    "Great Mother goddess figurine Venus Willendorf",
    "afterlife-judgment":     "Egyptian Book Dead Duat judgment Osiris",
    "deification":            "theosis deification icon Eastern Orthodox",
    "anthropos-myth":         "Vitruvian Man Leonardo cosmic man illustration",
    "emanation":              "Neoplatonism emanation kabbalistic sefirot diagram",
    "monotheism":             "monotheism Hebrew Bible Torah scroll ancient",
    "panentheism":            "God universe pantheism divine immanence",
    "revelation-divine":      "divine revelation angel scripture illumination",
    "sin-and-atonement":      "Yom Kippur atonement scapegoat sacrifice",
    "theosis":                "theosis Eastern Orthodox icon deification",
    "covenant":               "Moses tablets covenant Sinai illuminated",
    "incarnation":            "Incarnation Nativity medieval illuminated nativity",
    "invisible-college":      "Rosicrucian invisible college Fama Fraternitatis",
    "prophecy":               "Pythia oracle Delphi ancient Greek prophecy",
    "redemption":             "redemption Passover atonement sacrifice illustration",
    "millennium":             "Millennium thousand years Durer Revelation",
    "virginal-conception":    "Annunciation Virgin Mary angel painting",
    "heaven-and-earth-axis":  "ziggurat Mesopotamian heaven earth connection",
}




def commons_search_api(term, limit=3):
    params = urllib.parse.urlencode({
        'action': 'query', 'list': 'search',
        'srsearch': term + ' filetype:bitmap',
        'srnamespace': '6', 'srlimit': str(limit), 'format': 'json'
    })
    url = f'https://commons.wikimedia.org/w/api.php?{params}'
    req = urllib.request.Request(url, headers={'User-Agent': 'CodexAtlas/1.0 (thumbnail-builder)'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def commons_imageinfo_api(filename, width=320):
    params = urllib.parse.urlencode({
        'action': 'query', 'titles': filename,
        'prop': 'imageinfo', 'iiprop': 'url|extmetadata',
        'iiurlwidth': str(width), 'format': 'json'
    })
    url = f'https://commons.wikimedia.org/w/api.php?{params}'
    req = urllib.request.Request(url, headers={'User-Agent': 'CodexAtlas/1.0 (thumbnail-builder)'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def resolve_commons_filename(filename):
    """Returns (thumb_url, license_str) for a known Commons filename, or None."""
    # Ensure it has File: prefix
    if not filename.startswith('File:'):
        filename = 'File:' + filename
    try:
        info = commons_imageinfo_api(filename, width=320)
        pages = info.get('query', {}).get('pages', {})
        for p in pages.values():
            ii_list = p.get('imageinfo', [])
            if not ii_list:
                return None
            ii = ii_list[0]
            extmeta = ii.get('extmetadata', {})
            # thumburl or url (for small images without thumb)
            thumb = ii.get('thumburl', '') or ii.get('url', '')
            thumb = thumb.split('?')[0]
            if not thumb:
                return None
            lic = extmeta.get('LicenseShortName', {}).get('value', 'Public Domain')
            return thumb, lic
    except Exception:
        return None


def get_license_ok(extmeta):
    lic = extmeta.get('LicenseShortName', {}).get('value', '') or ''
    lic_url = extmeta.get('LicenseUrl', {}).get('value', '') or ''
    text = (lic + ' ' + lic_url).lower()
    # Assume free unless flagged
    if 'non-commercial' in text or '\\bnc\\b' in text:
        return False
    if 'all rights reserved' in text or 'no known copyright' not in text and 'rights reserved' in text:
        return False
    return True  # Default assume Commons = free


def find_via_search(search_term):
    try:
        result = commons_search_api(search_term)
        hits = result.get('query', {}).get('search', [])
        for hit in hits:
            filename = hit['title']
            try:
                info = commons_imageinfo_api(filename)
                pages = info.get('query', {}).get('pages', {})
                for p in pages.values():
                    ii_list = p.get('imageinfo', [])
                    if not ii_list:
                        continue
                    ii = ii_list[0]
                    extmeta = ii.get('extmetadata', {})
                    thumb = ii.get('thumburl', '').split('?')[0]
                    if not thumb:
                        continue
                    lic = extmeta.get('LicenseShortName', {}).get('value', 'Public Domain')
                    desc_raw = extmeta.get('ImageDescription', {}).get('value', '') or ''
                    desc = re.sub(r'<[^>]+>', '', desc_raw).strip()[:120]
                    if not desc:
                        desc = filename.replace('File:', '').replace('_', ' ').rsplit('.', 1)[0][:80]
                    return thumb, desc, lic
                time.sleep(0.1)
            except Exception:
                continue
    except Exception:
        pass
    return None


def get_node_info(filepath):
    try:
        content = open(filepath).read()
        if not content.startswith('---'):
            return None, None, False
        lines = content.split('\n')
        node_id = None; name = None; has_dep = False
        in_front = False
        for i, l in enumerate(lines):
            if i == 0 and l == '---':
                in_front = True; continue
            if in_front and l == '---':
                break
            if l.startswith('id:'):
                node_id = l.split(':', 1)[1].strip().strip('"\'')
            if l.startswith('name:'):
                name = l.split(':', 1)[1].strip().strip('"\'')
            if l.startswith('depictions:'):
                has_dep = True
        return node_id, name, has_dep
    except Exception:
        return None, None, False


def inject_depictions(filepath, thumb_url, caption, license_str):
    content = open(filepath).read()
    second_fence = content.index('\n---\n', 3)
    closing_pos = second_fence + 1
    # Escape quotes in caption
    caption_safe = caption.replace('"', "'")
    depiction_block = (
        f'depictions:\n'
        f'  - src: "{thumb_url}"\n'
        f'    caption: "{caption_safe}"\n'
        f'    source: "Wikimedia Commons"\n'
        f'    license: "{license_str}"\n'
    )
    new_content = content[:closing_pos] + depiction_block + content[closing_pos:]
    with open(filepath, 'w') as f:
        f.write(new_content)


# ── Main ─────────────────────────────────────────────────────────────────────
cache = json.loads(open('_assets/thumbs_cache.json').read())
null_ids = set(k for k, v in cache.items() if v is None)

candidates = {}
for f in glob.glob('**/*.md', recursive=True):
    if '/_' in f or '/00_meta' in f:
        continue
    node_id, name, has_dep = get_node_info(f)
    if node_id and node_id in null_ids and not has_dep:
        candidates[node_id] = (name, f)

print(f"Null nodes without depictions: {len(candidates)}")

added_direct = 0
added_search = 0
failed = 0

# ── Pass 1: Direct file mappings (via imageinfo API) ─────────────────────
if not SEARCH_ONLY:
    print("\n── Pass 1: Direct file mappings ──")
    for node_id, (filename, caption, license_str) in DIRECT_FILES.items():
        if node_id not in candidates:
            continue
        name, filepath = candidates[node_id]
        result = resolve_commons_filename(filename)
        if result:
            thumb_url, api_lic = result
            # Use our curated license_str (more descriptive) over the API value
            if DRY_RUN:
                print(f"  [DRY] {node_id}: {thumb_url[:80]}")
            else:
                inject_depictions(filepath, thumb_url, caption, license_str)
                print(f"  ✓ {node_id}: {caption[:60]}")
            added_direct += 1
        else:
            print(f"  ✗ MISS {node_id} ({filename})")
            failed += 1
        candidates.pop(node_id, None)
        time.sleep(0.3)

# ── Pass 2: Search API for remaining ──────────────────────────────────────
if not DIRECT_ONLY:
    print(f"\n── Pass 2: Search API ({len([k for k in SEARCH_TERMS if k in candidates])} targets) ──")
    for node_id, search_term in SEARCH_TERMS.items():
        if node_id not in candidates:
            continue
        name, filepath = candidates[node_id]
        result = find_via_search(search_term)
        if result:
            thumb, caption, lic = result
            if DRY_RUN:
                print(f"  [DRY] {node_id}: {thumb[:80]}")
            else:
                inject_depictions(filepath, thumb, caption, lic)
                print(f"  ✓ {node_id}: {caption[:60]}")
            added_search += 1
        else:
            print(f"  ✗ FAIL {node_id}")
            failed += 1
        time.sleep(0.5)

print(f"\nDone. Direct: {added_direct} | Search: {added_search} | Failed: {failed}")
