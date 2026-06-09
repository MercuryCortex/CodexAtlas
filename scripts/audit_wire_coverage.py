#!/usr/bin/env python3
"""
audit_wire_coverage.py — THE COMPLETENESS BAR (read-only).

WHY THIS EXISTS
The quality scorecards (audit_deity_quality.py / audit_document_quality.py)
grade the nodes that EXIST — schema, sourcing, depth, wiring. They are
*structurally blind to a MISSING node*, so a cross-tradition NEIGHBORHOOD can
be broken — and a whole PANTHEON half-empty — while the scorecard reads 9/9
"product-grade".

PROVEN 2026-06-05: the flagship wire `Genesis-1 "the deep" -> Tiamat · Nun ·
Ginnungagap` scored product-grade while Ginnungagap had no node and the Egyptian
Ogdoad was half-missing. "Quality of the nodes that exist" is the wrong bar.
The right bar: do the nodes the INVESTIGATION needs to draw its wires exist?

This is an investigation tool, not a catalogue — completeness = WIRE-ENDPOINT
coverage, prioritized by the headwaters (Mesopotamian / Egyptian / Greek /
Canaanite / Norse — the source-ends every Abrahamic text echoes back to), NOT by
whether a tradition has a tidy book-canon.

WHAT IT MEASURES
  1. NEIGHBORHOOD INTEGRITY — for each curated cross-tradition cluster, is every
     endpoint present? A missing endpoint = a wire that cannot be drawn = BROKEN,
     and the bar FAILS (exit 1).
  2. PANTHEON ROSTER COVERAGE — for each headwater tradition, hold an
     authoritative deity roster and report present-vs-missing. This is the ONLY
     thing that can see a god nobody has linked yet (neither the quality bar nor
     the demand list can). Informational — does not fail the build.
  3. DEMAND-RANKED GAPS — referenced-but-missing slugs ranked by inbound refs:
     the nodes the graph is already reaching for.

Read-only. Emits src/data/wire-coverage.json for the DEV Overview panel.
Extend NEIGHBORHOODS / ROSTERS as each headwater is mapped.
"""
import os, re, glob, json, datetime, unicodedata

# ── present-set: stems + id: + slugified aka: (so romanization variants resolve) ─
def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii").lower()
    s = re.sub(r"\([^)]*\)", "", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

present = set()
idre = re.compile(r'^id:\s*"?([a-z0-9][a-z0-9-]*)"?\s*$', re.M)
akare = re.compile(r'^aka:\s*\[(.*)\]', re.M)
for f in glob.glob("[0-9]*/**/*.md", recursive=True):
    if "/00_meta/" in f or "/99_ingest/" in f or os.path.basename(f).startswith("_"):
        continue
    present.add(os.path.basename(f)[:-3])
    try:
        t = open(f, encoding="utf-8").read(3000)
    except OSError:
        continue
    m = idre.search(t)
    if m:
        present.add(m.group(1))
    a = akare.search(t)
    if a:
        for nm in re.findall(r'"([^"]+)"', a.group(1)):
            s = slug(nm)
            if len(s) >= 3:
                present.add(s)

def have(cands):
    return any(c in present for c in cands)

# ── 1. cross-tradition NEIGHBORHOODS (wire clusters) ─────────────────────────
NEIGHBORHOODS = {
    "the-deep": {
        "label": "The Deep / primordial waters & void (Genesis 1:2 tehom across traditions)",
        "endpoints": {
            "Mesopotamian": ["tiamat", "apsu", "nammu", "mummu", "lahmu-lahamu", "anshar-kishar"],
            "Egyptian (Ogdoad)": ["nun", "naunet", "heh-egyptian", "hauhet",
                                   "kek-egyptian", "kauket", "amun", "amaunet"],
            "Norse": ["ginnungagap", "ymir", "audumla"],
            "Greek": ["chaos-primordial", "nyx-primordial"],
            "hub (themes)": ["primordial-waters", "primordial-darkness", "chaoskampf"],
        },
    },
    "chaoskampf": {
        "label": "Chaoskampf — the storm/warrior-god slays the chaos-monster to found order",
        "endpoints": {
            "Mesopotamian": ["marduk", "tiamat", "ninurta", "anzu", "asag", "tishpak"],
            "Canaanite": ["baal", "yam", "lotan", "mot"],
            "Greek": ["zeus", "typhon", "tartarus"],
            "Norse": ["thor", "jormungandr", "nidhogg"],
            "Vedic": ["indra", "vritra"],
            "Egyptian": ["ra", "apophis"],
            "Hittite": ["teshub", "illuyanka"],
            "hub": ["chaoskampf"],
        },
    },
    "dying-rising-god": {
        "label": "The dying-and-rising god — death/descent and return of the vegetation deity",
        "endpoints": {
            "Mesopotamian": ["dumuzi-tammuz", "damu"],
            "Levantine": ["baal", "adonis"],
            "Egyptian": ["osiris"],
            "Greek": ["persephone-greek", "dionysus", "zagreus"],
            "Roman": ["proserpina-roman"],
            "Etruscan": ["fufluns"],
            "hub": ["dying-rising-god"],
        },
    },
    "divine-council": {
        "label": "The divine council / assembly of the gods (high god + the decreeing assembly)",
        "endpoints": {
            "Mesopotamian": ["anunnaki", "igigi", "an-sumerian", "enlil"],
            "Canaanite": ["el-canaanite"],
            "Hebrew": ["yahweh"],
            "Greek": ["zeus"],
            "Norse": ["odin"],
            "hub": ["divine-council"],
        },
    },
    "the-fates": {
        "label": "The fate-triad — goddesses who measure out destiny (Indo-European)",
        "endpoints": {
            "Norse": ["norns"],
            "Greek": ["the-moirai", "ananke"],
            "Mesopotamian (decree of destinies)": ["anunnaki"],
        },
    },
    "the-flood": {
        "label": "The flood-hero — the righteous survivor of the deluge who re-founds humanity",
        "endpoints": {
            "Mesopotamian": ["ziusudra", "utnapishtim", "atrahasis-flood-hero"],
            "Hebrew": ["noah"],
            "Greek": ["deucalion"],
            "Hindu": ["manu-vedic", "matsya"],
        },
    },
    "underworld-descent": {
        "label": "Descent to the underworld — the god/hero who goes down to the land of the dead and returns",
        "endpoints": {
            "Mesopotamian": ["inanna-sumerian", "ishtar-akkadian", "ereshkigal", "nergal", "dumuzi-tammuz"],
            "Greek": ["persephone-greek", "demeter", "hades", "orpheus"],
            "Egyptian": ["osiris", "isis-egyptian"],
            "Norse": ["baldr", "hel", "nanna-norse"],
            "Canaanite": ["baal", "mot"],
            "Shinto": ["izanagi", "izanami"],
            "hub": ["underworld-descent"],
        },
    },
    "sacred-marriage": {
        "label": "Sacred marriage (hieros gamos) — the divine wedding that secures fertility/order",
        "endpoints": {
            "Mesopotamian": ["inanna-sumerian", "dumuzi-tammuz"],
            "Canaanite": ["yarikh", "nikkal-akkadian"],
            "Greek": ["zeus", "hera"],
            "Egyptian": ["osiris", "isis-egyptian"],
            "Norse": ["freyr", "gerd", "njord", "skadi"],
            "hub": ["sacred-marriage"],
        },
    },
    "the-trickster": {
        "label": "The trickster — the boundary-crossing culture-bringer who is both clever and a fool",
        "endpoints": {
            "Norse": ["loki"],
            "Greek": ["hermes-greek", "prometheus"],
            "Egyptian": ["set"],
            "Mesopotamian": ["enki-ea"],
            "West African": ["eshu", "anansi"],
            "Native American": ["coyote", "raven-trickster"],
            "Polynesian": ["maui-polynesian"],
        },
    },
    "the-mother-goddess": {
        "label": "The great mother-goddess — the divine feminine of earth, fertility, and origin",
        "endpoints": {
            "Mesopotamian": ["ninhursag", "inanna-sumerian"],
            "Greek": ["gaia", "rhea", "demeter"],
            "Anatolian": ["cybele"],
            "Egyptian": ["isis-egyptian", "hathor"],
            "Canaanite": ["asherah", "anat"],
            "Hindu": ["durga", "parvati"],
            "West African (Yoruba)": ["yemoja", "oshun"],
            "Roman": ["ceres-roman"],
        },
    },
    "the-divine-smith": {
        "label": "The divine smith — the craftsman-god who forges the gods' weapons and wonders",
        "endpoints": {
            "Greek": ["hephaestus"],
            "Canaanite": ["kothar-wa-khasis"],
            "Egyptian": ["ptah", "khnum"],
            "Vedic": ["tvashtar"],
            "Germanic": ["wayland-smith"],
            "Celtic": ["goibniu"],
            "Finnish": ["ilmarinen"],
            "West African (Yoruba)": ["ogun"],
            "Roman": ["vulcan-roman"],
            "Etruscan": ["sethlans"],
        },
    },
    "the-divine-twins": {
        "label": "The divine twins — paired brothers (often horse-linked, of contrasting fate) who found peoples and rescue",
        "endpoints": {
            "Vedic": ["the-ashvins"],
            "Greek": ["the-dioskouroi"],
            "Roman": ["romulus", "remus"],
            "Maya (Hero Twins)": ["hunahpu", "ixbalanque"],
            "Yoruba": ["ibeji"],
            "hub": ["divine-twins"],
        },
    },
    "the-hunter": {
        "label": "The hunter / master of animals — the deity of the wild, the chase, and the lord of beasts",
        "endpoints": {
            "Greek": ["artemis"],
            "Roman": ["diana-roman"],
            "Yoruba": ["osoosi"],
            "Aztec": ["mixcoatl"],
            "Celtic": ["cernunnos"],
            "Norse": ["skadi", "ullr"],
            "Vedic": ["rudra-shiva-early"],
            "Egyptian": ["neith"],
        },
    },
    "the-storm-god": {
        "label": "The storm-god — the thunder-wielding sky-warrior, king or champion of the pantheon (PIE *Perkwunos and beyond)",
        "endpoints": {
            "Mesopotamian": ["marduk", "adad", "ishkur"],
            "Canaanite": ["baal"],
            "Greek": ["zeus"],
            "Roman": ["jupiter"],
            "Norse": ["thor"],
            "Vedic": ["indra"],
            "Hittite": ["teshub", "tarhunna"],
            "Slavic": ["perun"],
            "Baltic": ["perkunas"],
            "Egyptian": ["set"],
            "Shinto": ["raijin", "susanoo"],
            "Yoruba": ["shango"],
            "Celtic": ["taranis"],
            "Andean": ["illapa"],
            "Mesoamerican": ["tlaloc", "huracan"],
        },
    },
    "the-sky-father": {
        "label": "The sky-father — the PIE *Dyeus and the bright-sky high god, father of the gods",
        "endpoints": {
            "Vedic": ["dyaus-pita"],
            "Greek": ["zeus", "uranus-greek"],
            "Roman": ["jupiter"],
            "Norse": ["tyr"],
            "Etruscan": ["tinia"],
            "Mesopotamian": ["an-sumerian"],
            "Maori": ["ranginui"],
            "Chinese": ["tian-heaven"],
            "Armenian": ["aramazd"],
            "Baltic": ["dievas-baltic"],
            "Slavic": ["svarog"],
        },
    },
    "the-sun-god": {
        "label": "The sun-god — the solar deity who crosses the sky each day and sees all",
        "endpoints": {
            "Egyptian": ["ra", "aten"],
            "Vedic": ["surya"],
            "Greek": ["helios"],
            "Roman": ["sol-invictus"],
            "Norse": ["sol-norse"],
            "Mesopotamian": ["utu-shamash"],
            "Iranian": ["mithra-zoroastrian"],
            "Celtic": ["belenos"],
            "Andean (Inca)": ["inti"],
            "Shinto": ["amaterasu"],
            "Aztec": ["tonatiuh"],
            "Maya": ["kinich-ahau"],
            "Baltic": ["saule"],
            "Armenian": ["mihr-armenian"],
        },
    },
    "the-love-goddess": {
        "label": "The love-goddess — the deity of love, beauty, and desire (the Inanna lineage and its parallels)",
        "endpoints": {
            "Mesopotamian": ["inanna-sumerian", "ishtar-akkadian"],
            "Canaanite": ["astarte-canaanite"],
            "Greek": ["aphrodite-greek"],
            "Roman": ["venus-roman"],
            "Etruscan": ["turan"],
            "Norse": ["freyja"],
            "Egyptian": ["hathor"],
            "Iranian": ["anahita-zoroastrian"],
            "Armenian": ["astghik"],
            "Aztec": ["xochiquetzal"],
            "Yoruba": ["oshun"],
        },
    },
    "the-moon": {
        "label": "The moon-deity — the lunar god/goddess of the month, the tides, and the measure of time",
        "endpoints": {
            "Mesopotamian": ["nanna-sin"],
            "Egyptian": ["khonsu"],
            "Greek": ["selene"],
            "Roman": ["luna-roman"],
            "Norse": ["mani-norse"],
            "Vedic": ["chandra"],
            "Shinto": ["tsukuyomi"],
            "Andean": ["mama-quilla"],
            "Baltic": ["meness"],
            "Arabian": ["sin-hadhramaut"],
            "Aztec": ["tecciztecatl", "metztli"],
        },
    },
    "the-war-god": {
        "label": "The war-god — the deity of battle, slaughter, and martial fury",
        "endpoints": {
            "Greek": ["ares"],
            "Roman": ["mars-roman", "bellona"],
            "Egyptian": ["sekhmet"],
            "Mesopotamian": ["inanna-sumerian", "nergal"],
            "Celtic": ["the-morrigan"],
            "Aztec": ["huitzilopochtli"],
            "Armenian": ["vahagn"],
            "Etruscan": ["laran"],
        },
    },
    "world-tree": {
        "label": "The world-tree / axis mundi — the cosmic tree or pillar joining heaven, earth, and the underworld",
        "endpoints": {
            "Norse": ["yggdrasil"],
            "Jewish / Kabbalah": ["sefirot-tree-of-life", "tree-of-life"],
            "Egyptian": ["djed-pillar"],
            "hub (symbols)": ["world-tree", "axis-mundi", "world-axis"],
        },
    },
    "the-healer": {
        "label": "The divine healer / physician — the god of medicine, healing, and the cure",
        "endpoints": {
            "Greek": ["asclepius-greek", "apollo"],
            "Mesopotamian": ["gula-akkadian"],
            "Egyptian": ["heka-egyptian"],
            "Vedic": ["dhanvantari"],
            "Celtic": ["dian-cecht"],
            "Norse": ["eir-norse"],
            "Hittite": ["kamrusepa"],
            "Yoruba": ["babalu-aye"],
        },
    },
    "the-divine-scribe": {
        "label": "The scribe / wisdom-god — keeper of writing, knowledge, and the divine record",
        "endpoints": {
            "Egyptian": ["thoth", "seshat"],
            "Mesopotamian": ["nabu", "enki-ea"],
            "Greek": ["athena"],
            "Roman": ["minerva-roman"],
            "Vedic": ["saraswati"],
            "Shinto": ["omoikane"],
            "Celtic": ["ogma"],
            "Armenian": ["tir-armenian"],
            "Chinese": ["cangjie"],
        },
    },
    "the-psychopomp": {
        "label": "The psychopomp — the guide who leads the souls of the dead to the otherworld",
        "endpoints": {
            "Greek": ["hermes-greek"],
            "Egyptian": ["anubis"],
            "Norse": ["valkyrie"],
            "Vedic": ["yama-vedic"],
            "Aztec": ["xolotl", "mictlantecuhtli"],
            "Celtic": ["the-morrigan"],
            "Maori": ["hine-nui-te-po"],
            "Korean": ["yeomra"],
        },
    },
    "the-sea": {
        "label": "The sea-god — the sovereign of the ocean and the deep waters",
        "endpoints": {
            "Greek": ["poseidon"],
            "Roman": ["neptune-roman"],
            "Mesopotamian": ["tiamat"],
            "Canaanite": ["yam"],
            "Shinto": ["watatsumi", "ryujin"],
            "Norse": ["njord", "aegir-norse"],
            "Andean": ["mama-cocha"],
            "Polynesian": ["tangaroa"],
            "Vedic": ["varuna"],
            "Etruscan": ["nethuns"],
        },
    },
    "the-dawn": {
        "label": "The dawn-goddess — the PIE *Hausos and the radiant maiden of the morning",
        "endpoints": {
            "Greek": ["eos-greek"],
            "Roman": ["aurora-roman"],
            "Vedic": ["ushas"],
            "Baltic": ["ausrine"],
            "Andean": ["chasca"],
        },
    },
    "the-dragon-slayer": {
        "label": "The dragon-slayer — the hero/god who slays the serpent or dragon (the heroic form of chaoskampf)",
        "endpoints": {
            "Vedic": ["indra"],
            "Norse": ["thor"],
            "Greek": ["apollo", "zeus"],
            "Mesopotamian": ["marduk", "ninurta"],
            "Canaanite": ["baal"],
            "Hittite": ["tarhunna", "teshub"],
            "Shinto": ["susanoo"],
            "Armenian": ["vahagn"],
            "Slavic": ["perun"],
            "Christian": ["michael-archangel"],
        },
    },
    "the-first-man": {
        "label": "The first human / primordial man — the first mortal, or the being from whom humanity (or the world) is made",
        "endpoints": {
            "Norse": ["ymir"],
            "Vedic": ["purusha", "manu", "manu-vedic"],
            "Chinese": ["pangu", "nuwa", "fuxi"],
            "Iranian": ["yima-jamshid"],
            "Greek": ["prometheus"],
            "Hebrew": ["adam"],
            "Polynesian": ["tiki"],
        },
    },
}

# ── 2. PANTHEON ROSTERS (authoritative deity lists, headwaters first) ────────
# "within reason" = the great gods + significant secondary deities + the
# primordials + the demons/monsters that carry cross-tradition wires; NOT every
# obscure local city-god. Each entry: (Label, [candidate slugs]). Present-stems
# are listed explicitly so the diff is exact.
ROSTERS = {
    "Mesopotamian (Sumerian/Akkadian/Babylonian/Assyrian)": [
        # primordial / theogony
        ("Tiamat", ["tiamat"]), ("Apsu", ["apsu"]), ("Nammu", ["nammu"]),
        ("Mummu", ["mummu"]), ("Lahmu & Lahamu", ["lahmu-lahamu"]),
        ("Anshar & Kishar", ["anshar-kishar"]), ("Kingu", ["kingu"]),
        # sky / great gods
        ("An / Anu", ["an-sumerian", "anu"]), ("Ki / Antu", ["ki-sumerian"]),
        ("Enlil", ["enlil"]), ("Ninlil", ["nin-lil-sumerian", "ninlil"]),
        ("Enki / Ea", ["enki-ea"]), ("Damkina / Damgalnuna", ["damkina"]),
        ("Ninhursag / Belet-ili / Mami", ["ninhursag", "belet-ili", "mami", "aruru", "nintu"]),
        ("Inanna / Ishtar", ["inanna-sumerian", "ishtar-akkadian", "inanna", "ishtar"]),
        ("Dumuzi / Tammuz", ["dumuzi-tammuz"]), ("Geshtinanna", ["geshtinanna"]),
        ("Utu / Shamash", ["utu-shamash"]), ("Aya / Sherida", ["aya-sherida", "aya", "sherida"]),
        ("Nanna / Sin", ["nanna-sin"]), ("Ningal", ["nin-gal-sumerian", "ningal"]),
        ("Ishkur / Adad", ["adad", "ishkur"]), ("Shala", ["shala"]),
        ("Ninurta / Ningirsu", ["ninurta", "nin-girsu"]),
        ("Gula / Bau / Ninisina / Ninkarrak (healing)", ["gula-akkadian", "bau-sumerian", "ninisina", "ninkarrak"]),
        ("Nergal", ["nergal"]), ("Ereshkigal", ["ereshkigal"]), ("Namtar", ["namtar"]),
        ("Nabu", ["nabu"]), ("Marduk", ["marduk"]), ("Sarpanit", ["sarpanit"]),
        ("Ashur", ["ashur"]), ("Mullissu", ["mullissu-akkadian"]),
        ("Nisaba / Nidaba", ["nisaba"]), ("Haya", ["haya"]),
        ("Nuska / Nusku", ["nuska"]), ("Ninshubur", ["ninshubur"]),
        ("Ningishzida", ["ningishzida"]), ("Ninazu", ["ninazu"]),
        ("Nanshe", ["nanshe-sumerian"]), ("Ninkasi", ["ninkasi"]), ("Siris", ["siris-akkadian"]),
        ("Gibil / Girra", ["gibil"]), ("Erra", ["erra-akkadian"]), ("Ishum", ["ishum"]),
        ("Zababa", ["zababa"]), ("Shara", ["shara"]),
        ("Lugalbanda", ["lugalbanda"]), ("Ninsun", ["ninsun"]), ("Gugalanna", ["gugalanna"]),
        ("Ishtaran", ["ishtaran"]), ("Nanaya", ["nanaya"]), ("Damu", ["damu"]),
        ("Lahar (cattle)", ["lahar"]), ("Ashnan / Ezina (grain)", ["ashnan", "ezina"]),
        ("Enkimdu", ["enkimdu"]), ("Enbilulu", ["enbilulu"]),
        ("Amurru", ["amurru"]), ("Ishara", ["ishara"]),
        ("Belet-seri", ["belet-seri-akkadian"]), ("Allatu", ["allatu-akkadian"]),
        ("Laz", ["laz"]), ("Nikkal", ["nikkal-akkadian"]), ("Nungal", ["nungal"]),
        ("Ningikuga", ["ningikuga"]),
        # demons / monsters that carry wires
        ("Lamashtu", ["lamashtu"]), ("Pazuzu", ["pazuzu"]),
        ("Lamassu / Shedu", ["lamassu"]), ("Apkallu (sages)", ["apkallu"]),
        ("Anzu (storm-bird)", ["anzu", "anzu-bird"]),
        ("Humbaba / Huwawa", ["humbaba", "huwawa"]),
        ("Asag / Asakku", ["asag", "asakku"]), ("Tishpak", ["tishpak"]),
        # collectives
        ("Anunnaki (collective)", ["anunnaki"]), ("Igigi (collective)", ["igigi"]),
    ],
    "Egyptian": [
        ("Ra", ["ra", "amun-ra"]), ("Atum", ["atum"]), ("Amun", ["amun"]), ("Ptah", ["ptah"]),
        ("Osiris", ["osiris"]), ("Isis", ["isis-egyptian", "isis-hellenistic"]), ("Horus", ["horus"]),
        ("Set", ["set"]), ("Nephthys", ["nephthys"]), ("Thoth", ["thoth"]), ("Hathor", ["hathor"]),
        ("Anubis", ["anubis"]), ("Geb", ["geb"]), ("Nut", ["nut"]), ("Shu", ["shu"]), ("Tefnut", ["tefnut"]),
        ("Sekhmet", ["sekhmet"]), ("Bastet", ["bastet"]), ("Sobek", ["sobek"]), ("Khnum", ["khnum"]),
        ("Khonsu", ["khonsu"]), ("Maat", ["ma-at"]), ("Nun", ["nun"]), ("Mut", ["mut"]), ("Neith", ["neith"]),
        ("Apophis", ["apophis"]), ("Ammit", ["ammit-devourer"]), ("Wadjet", ["wadjet"]), ("Nekhbet", ["nekhbet"]),
        ("Bes", ["bes"]), ("Taweret", ["taweret"]), ("Min", ["min-egyptian"]), ("Montu", ["montu"]),
        ("Sokar", ["sokar"]), ("Serapis", ["serapis"]), ("Aten", ["aten"]), ("Khepri", ["khepri"]),
        ("Nefertem", ["nefertem"]), ("Heqet", ["heqet"]), ("Satet", ["satet"]), ("Anuket", ["anuket"]),
        ("Selket", ["selket"]), ("Renenutet", ["renenutet"]), ("Meretseger", ["meretseger"]),
        ("Onuris", ["onuris"]), ("Banebdjedet", ["banebdjedet"]), ("Apis", ["apis-bull"]),
        ("Hapi (Nile)", ["hapi-nile"]), ("Wepwawet", ["wepwawet"]),
        ("Amaunet (Ogdoad)", ["amaunet"]), ("Hauhet (Ogdoad)", ["hauhet"]), ("Heh (Ogdoad)", ["heh-egyptian"]),
        ("Kek (Ogdoad)", ["kek-egyptian"]), ("Kauket (Ogdoad)", ["kauket"]), ("Naunet (Ogdoad)", ["naunet"]),
        # gaps
        ("Seshat", ["seshat"]), ("Heka", ["heka", "heka-egyptian"]), ("Tatenen", ["tatenen"]),
        ("Imhotep (deified)", ["imhotep"]), ("Hu & Sia", ["hu-sia", "hu-egyptian"]),
    ],
    "Greek": [
        ("Zeus", ["zeus"]), ("Hera", ["hera"]), ("Poseidon", ["poseidon"]), ("Demeter", ["demeter"]),
        ("Athena", ["athena"]), ("Apollo", ["apollo"]), ("Artemis", ["artemis"]), ("Ares", ["ares"]),
        ("Aphrodite", ["aphrodite-greek"]), ("Hephaestus", ["hephaestus"]), ("Hermes", ["hermes-greek"]),
        ("Hestia", ["hestia"]), ("Dionysus", ["dionysus"]), ("Hades", ["hades"]), ("Persephone", ["persephone-greek"]),
        ("Kronos", ["kronos"]), ("Rhea", ["rhea"]), ("Gaia", ["gaia"]), ("Uranus", ["uranus-greek"]),
        ("Oceanus", ["oceanus"]), ("Tethys", ["tethys"]), ("Hyperion", ["hyperion"]), ("Theia", ["theia"]),
        ("Iapetus", ["iapetus"]), ("Mnemosyne", ["mnemosyne"]), ("Themis", ["themis"]), ("Metis", ["metis"]),
        ("Leto", ["leto"]), ("Atlas", ["atlas-titan"]), ("Prometheus", ["prometheus"]),
        ("Chaos", ["chaos-primordial"]), ("Nyx", ["nyx-primordial"]), ("Eros", ["eros-primordial"]),
        ("Phanes", ["phanes-protogonos"]), ("Helios", ["helios"]), ("Selene", ["selene"]), ("Eos", ["eos-greek"]),
        ("Hekate", ["hekate"]), ("Pan", ["pan-greek"]), ("Nemesis", ["nemesis-greek"]), ("Nike", ["nike-greek"]),
        ("Iris", ["iris-greek"]), ("Hypnos", ["hypnos"]), ("Thanatos", ["thanatos-greek"]), ("Hebe", ["hebe"]),
        ("Asclepius", ["asclepius-greek"]), ("Hygieia", ["hygieia"]), ("Eileithyia", ["eileithyia-greek"]),
        ("Tyche", ["tyche-greek"]), ("Eris", ["eris"]), ("Nereus", ["nereus"]), ("Triton", ["triton"]),
        ("Amphitrite", ["amphitrite"]), ("The Moirai (Fates)", ["the-moirai"]), ("The Erinyes", ["the-erinyes"]),
        ("The Dioskouroi", ["the-dioskouroi"]), ("Priapus", ["priapus-greek-roman"]), ("Plutus", ["plutus"]),
        ("Triptolemus", ["triptolemus"]), ("Heracles", ["heracles", "hercules"]), ("Typhon", ["typhon"]),
        # gaps
        ("Tartarus", ["tartarus"]), ("Erebus", ["erebus"]), ("Charon", ["charon", "charon-greek"]),
        ("Epimetheus", ["epimetheus"]), ("Phoebe (Titan)", ["phoebe-titan"]), ("Coeus", ["coeus"]),
        ("Crius", ["crius"]), ("Proteus", ["proteus-greek", "proteus"]), ("Ananke", ["ananke"]),
    ],
    "Canaanite / Ugaritic / Phoenician": [
        ("El", ["el-canaanite"]), ("Asherah", ["asherah"]), ("Baal-Hadad", ["baal", "baal-hadad"]),
        ("Anat", ["anat"]), ("Astarte", ["astarte-canaanite"]), ("Yam", ["yam"]), ("Mot", ["mot"]),
        ("Dagon", ["dagon"]), ("Kothar-wa-Khasis", ["kothar-wa-khasis"]), ("Shapash", ["shapash"]),
        ("Resheph", ["resheph"]), ("Lotan", ["lotan"]), ("Chemosh", ["chemosh"]), ("Moloch", ["moloch"]),
        ("Eshmun", ["eshmun"]), ("Melqart", ["melqart"]), ("Tanit", ["tanit"]),
        # gaps
        ("Athtar", ["athtar"]), ("Shahar (dawn — Isa 14 Helel)", ["shahar"]), ("Shalim (dusk)", ["shalim"]),
        ("Yarikh (moon)", ["yarikh"]), ("Horon", ["horon"]), ("Kotharat", ["kotharat"]), ("Pidray", ["pidray"]),
    ],
    "Norse": [
        ("Odin", ["odin"]), ("Thor", ["thor"]), ("Loki", ["loki"]), ("Frigg", ["frigg"]), ("Freyja", ["freyja"]),
        ("Freyr", ["freyr"]), ("Tyr", ["tyr"]), ("Baldr", ["baldr"]), ("Heimdall", ["heimdall"]), ("Njord", ["njord"]),
        ("Hel", ["hel"]), ("Sif", ["sif"]), ("Idunn", ["idunn"]), ("Bragi", ["bragi"]), ("Vidar", ["vidar"]),
        ("Vali", ["vali"]), ("Hod", ["hod"]), ("Forseti", ["forseti"]), ("Ullr", ["ullr"]), ("Skadi", ["skadi"]),
        ("Gefjon", ["gefjon"]), ("Sigyn", ["sigyn"]), ("Ran", ["ran"]), ("Aegir", ["aegir-norse"]),
        ("Mani", ["mani-norse"]), ("Sol", ["sol-norse"]), ("Mimir", ["mimir-norse"]), ("Hoenir", ["hoenir"]),
        ("Andvari", ["andvari"]), ("Audumla", ["audumla"]), ("Bergelmir", ["bergelmir"]),
        ("Ginnungagap", ["ginnungagap"]), ("Surtr", ["surtr"]), ("Fenrir", ["fenrir"]),
        ("Jormungandr", ["jormungandr"]), ("Ymir", ["ymir"]), ("Nerthus", ["nerthus"]),
        # gaps
        ("Nanna (Baldr's wife)", ["nanna-norse"]), ("Nott (night)", ["nott", "nott-norse"]), ("Dagr (day)", ["dagr"]),
        ("Vili & Ve", ["vili-ve", "vili"]), ("Buri", ["buri-norse", "buri"]), ("Bor", ["bor-norse"]),
        ("Nidhogg", ["nidhogg"]), ("The Norns (fate)", ["norns"]), ("Valkyries", ["valkyrie", "valkyries"]),
        ("Modi & Magni", ["modi-magni", "modi"]), ("Eir (healing)", ["eir-norse", "eir"]),
    ],
    "Hindu (Vedic / Puranic)": [
        # Trimurti + great goddesses
        ("Brahma", ["brahma"]), ("Vishnu", ["vishnu"]), ("Shiva", ["shiva"]),
        ("Saraswati", ["saraswati"]), ("Lakshmi", ["lakshmi"]), ("Parvati", ["parvati"]),
        ("Durga", ["durga"]), ("Kali", ["kali"]), ("Shakti", ["shakti"]),
        ("Tripura Sundari", ["tripura-sundari"]),
        # Dashavatara (the ten avatars of Vishnu)
        ("Matsya", ["matsya", "matsya-avatar"]), ("Kurma", ["kurma-avatar"]),
        ("Varaha", ["varaha-avatar"]), ("Narasimha", ["narasimha"]), ("Vamana", ["vamana"]),
        ("Parashurama", ["parashurama"]), ("Rama", ["rama"]), ("Krishna", ["krishna"]),
        ("Balarama", ["balarama"]), ("Kalki", ["kalki"]),
        # Vaishnava circle
        ("Narayana", ["narayana"]), ("Garuda", ["garuda"]), ("Radha", ["radha"]),
        ("Sita", ["sita"]), ("Hanuman", ["hanuman"]), ("Jagannath", ["jagannath"]),
        ("Venkateswara", ["venkateswara"]), ("Vithoba", ["vithoba"]), ("Ayyappa", ["ayyappa"]),
        ("Harihara", ["harihara"]), ("Dattatreya", ["dattatreya"]), ("Dhanvantari", ["dhanvantari"]),
        ("Kamadhenu", ["kamadhenu"]), ("Yashoda", ["yashoda"]),
        # Shaiva circle
        ("Rudra", ["rudra-shiva-early"]), ("Ganesha", ["ganesha"]),
        ("Skanda / Murugan", ["skanda-karthikeya", "murugan"]), ("Nandi", ["nandi"]),
        ("Bhairava", ["bhairava"]), ("Mahakala", ["mahakala"]), ("Nataraja", ["nataraja"]),
        ("Khandoba", ["khandoba"]),
        # goddesses (regional / folk)
        ("Mariamman", ["mariamman"]), ("Meenakshi", ["meenakshi"]), ("Manasa", ["manasa-devi"]),
        ("Shitala", ["shitala"]), ("Ganga", ["ganga"]), ("Yamuna", ["yamuna"]),
        ("Sundareswarar", ["sundareswarar"]),
        # Vedic gods
        ("Indra", ["indra"]), ("Agni", ["agni"]), ("Varuna", ["varuna"]), ("Surya", ["surya"]),
        ("Soma", ["soma"]), ("Vayu", ["vayu"]), ("Mitra", ["mitra-vedic"]), ("Ushas", ["ushas"]),
        ("Dyaus Pita", ["dyaus-pita"]), ("Aditi", ["aditi"]), ("Ashvins", ["the-ashvins"]),
        ("Brihaspati", ["brihaspati"]), ("Tvashtar", ["tvashtar"]), ("Vritra", ["vritra"]),
        ("Apam Napat", ["apam-napat-vedic"]), ("Purusha", ["purusha"]), ("Prajapati", ["prajapati"]),
        ("Vac", ["vac-goddess"]), ("Savitr", ["savitr"]), ("Maruts", ["maruts"]),
        # Navagraha (planetary gods)
        ("Chandra", ["chandra"]), ("Mangala", ["mangala"]), ("Budha", ["budha"]),
        ("Shukra", ["shukra"]), ("Shani", ["shani"]), ("Rahu", ["rahu"]), ("Ketu", ["ketu"]),
        # other major figures
        ("Kubera", ["kubera"]), ("Yama", ["yama-vedic"]), ("Kama", ["kama-vedic"]),
        ("Narada", ["narada"]), ("Chitragupta", ["chitragupta"]), ("Prithvi", ["prithvi"]),
        ("Vishvakarma", ["vishvakarma"]), ("Daksha", ["daksha"]), ("Gayatri", ["gayatri"]),
        # next-tier gaps (honest remaining)
        ("Pushan", ["pushan"]), ("Aryaman", ["aryaman"]), ("Bhaga", ["bhaga"]),
        ("Annapurna", ["annapurna"]), ("Nirrti", ["nirrti"]),
        ("Ardhanarishvara", ["ardhanarishvara"]),
    ],
    "Mesoamerican (Aztec / Maya)": [
        # Aztec
        ("Huitzilopochtli", ["huitzilopochtli"]), ("Quetzalcoatl", ["quetzalcoatl"]),
        ("Tezcatlipoca", ["tezcatlipoca"]), ("Tlaloc", ["tlaloc"]), ("Ehecatl", ["ehecatl"]),
        ("Xipe Totec", ["xipe-totec"]), ("Xiuhtecuhtli", ["xiuhtecuhtli"]),
        ("Mictlantecuhtli", ["mictlantecuhtli"]), ("Mictecacihuatl", ["mictecacihuatl"]),
        ("Coatlicue", ["coatlicue"]), ("Coyolxauhqui", ["coyolxauhqui"]),
        ("Chalchiuhtlicue", ["chalchiuhtlicue"]), ("Chicomecoatl", ["chicomecoatl"]),
        ("Centeotl", ["centeotl"]), ("Mayahuel", ["mayahuel"]), ("Xochipilli", ["xochipilli"]),
        ("Xochiquetzal", ["xochiquetzal"]), ("Tlazolteotl", ["tlazolteotl"]),
        ("Tlaltecuhtli", ["tlaltecuhtli"]), ("Cipactli", ["cipactli"]), ("Tonatiuh", ["tonatiuh"]),
        ("Tlahuizcalpantecuhtli", ["tlahuizcalpantecuhtli"]), ("Mixcoatl", ["mixcoatl"]),
        ("Xolotl", ["xolotl"]), ("Itzpapalotl", ["itzpapalotl"]), ("Ometeotl", ["ometeotl"]),
        ("Nanahuatzin", ["nanahuatzin"]), ("Tecciztecatl", ["tecciztecatl"]),
        # Maya
        ("Itzamna", ["itzamna"]), ("Kukulkan / Gucumatz", ["kukulkan"]),
        ("Chaac", ["chaac", "chac"]), ("Kinich Ahau", ["kinich-ahau"]), ("Ixchel", ["ixchel"]),
        ("Hunab Ku", ["hunab-ku"]), ("Kawil / Bolon Dzacab", ["kawil", "bolon-tzakab"]),
        ("Ah Puch", ["ah-puch"]), ("Cizin", ["cizin"]), ("Camazotz", ["camazotz"]),
        ("Yum Kaax", ["yum-kaax"]), ("Ek Chuah", ["ek-chuah"]), ("Huracan", ["huracan"]),
        ("Hun Hunahpu", ["hun-hunahpu"]), ("Hunahpu", ["hunahpu"]), ("Xbalanque", ["ixbalanque"]),
        ("Vucub Caquix", ["vucub-caquix"]), ("Xmucane & Xpiacoc", ["xmucane-xpiacoc"]),
        ("Tepeu", ["tepeu"]), ("Ixtab", ["ixtab"]), ("Zipacna", ["zipacna"]),
        ("Cabracan", ["cabracan"]),
        # honest remaining gaps
        ("Tonacatecuhtli", ["tonacatecuhtli"]), ("Metztli (moon)", ["metztli"]),
        ("Patecatl", ["patecatl"]), ("Yacatecuhtli", ["yacatecuhtli"]),
        ("Buluc Chabtan", ["buluc-chabtan"]),
    ],
    "Yoruba (Orisha — West African)": [
        # supreme & cosmogonic
        ("Olodumare / Olorun (supreme)", ["olodumare"]),
        ("Obatala / Orisha-nla (sky / shaper of bodies)", ["obatala"]),
        ("Oduduwa (earth / founder of Ife)", ["oduduwa"]),
        ("Orunmila (Ifa / wisdom & divination)", ["orunmila"]),
        # the Warriors
        ("Eshu / Elegba (trickster-messenger)", ["eshu"]),
        ("Ogun (iron / war / smith)", ["ogun"]),
        ("Oshosi (hunter)", ["osoosi"]),
        # great orisha
        ("Shango (thunder / justice / deified Alaafin)", ["shango"]),
        ("Oya (storm / Niger / gate of the dead)", ["oya"]),
        ("Oshun (river / love / fertility)", ["oshun"]),
        ("Yemoja (waters / great mother)", ["yemoja"]),
        ("Oba (river / marriage)", ["oba-orisha"]),
        ("Olokun (sea / depths)", ["olokun"]),
        ("Oshumare (rainbow serpent)", ["oshumare"]),
        ("Babalu-Aye / Obaluaye (Shopona — disease & healing)", ["babalu-aye"]),
        ("Osanyin (herbs / medicine)", ["osanyin"]),
        ("Aganju (volcano / wilderness)", ["aganju"]),
        ("Orisha Oko (agriculture)", ["orisha-oko"]),
        ("Ibeji (divine twins)", ["ibeji"]),
        # significant secondary — honest remaining gaps
        ("Erinle / Inle (healer-hunter)", ["erinle", "inle"]),
        ("Logunede (youth; Oshun x Oshosi)", ["logunede", "logun-ede"]),
    ],
    "Roman (Dii Consentes + state cult)": [
        # the Dii Consentes (the twelve)
        ("Jupiter", ["jupiter"]), ("Juno", ["juno"]), ("Neptune", ["neptune-roman"]),
        ("Minerva", ["minerva-roman"]), ("Mars", ["mars-roman"]), ("Venus", ["venus-roman"]),
        ("Apollo", ["apollo"]), ("Diana", ["diana-roman"]), ("Vulcan", ["vulcan-roman"]),
        ("Mercury", ["mercury-roman"]), ("Vesta", ["vesta"]), ("Ceres", ["ceres-roman"]),
        # underworld + Aventine + Liberalia
        ("Pluto / Dis Pater", ["pluto-roman", "dis-pater"]), ("Proserpina", ["proserpina-roman"]),
        ("Bacchus / Liber", ["bacchus", "liber"]),
        # the old Italic / state gods
        ("Saturn", ["saturn-roman"]), ("Janus", ["janus"]), ("Quirinus", ["quirinus-roman"]),
        ("Bellona", ["bellona"]), ("Fortuna", ["fortuna"]), ("Victoria", ["victoria-roman"]),
        ("Sol Invictus", ["sol-invictus"]), ("Luna", ["luna-roman"]), ("Aurora", ["aurora-roman"]),
        ("Pomona", ["pomona"]), ("Vertumnus", ["vertumnus"]),
        ("Faunus", ["faunus-roman"]), ("Flora", ["flora-roman"]), ("Ops", ["ops-roman"]),
        ("Cupid / Amor", ["cupid-roman", "amor"]),
        ("Romulus", ["romulus"]), ("Remus", ["remus"]),
        # significant secondary — honest remaining gaps
        ("Liber", ["liber", "liber-roman"]), ("Terminus", ["terminus", "terminus-roman"]),
        ("The Lares", ["the-lares", "lares"]), ("The Penates", ["the-penates", "penates"]),
    ],
    "Shinto (kami)": [
        # primordial / creators
        ("Amenominakanushi", ["amenominakanushi"]), ("Takamimusubi", ["takamimusubi"]),
        ("Kamimusubi", ["kamimusubi"]), ("Kuninotokotachi", ["kuninotokotachi"]),
        ("Izanagi", ["izanagi"]), ("Izanami", ["izanami"]),
        # the three noble children
        ("Amaterasu", ["amaterasu"]), ("Tsukuyomi", ["tsukuyomi"]), ("Susanoo", ["susanoo"]),
        # the heavenly host (Takamagahara)
        ("Ame-no-Uzume", ["ame-no-uzume"]), ("Omoikane", ["omoikane"]),
        ("Ame-no-Tajikarao", ["ame-no-tajikarao"]), ("Futsunushi", ["futsunushi"]),
        ("Takemikazuchi", ["takemikazuchi"]), ("Ame-no-Koyane", ["ame-no-koyane"]),
        ("Ame-no-Hohi", ["ame-no-hohi"]), ("Ninigi", ["ninigi"]), ("Sarutahiko", ["sarutahiko"]),
        # earthly kami (Kunitsukami / Izumo)
        ("Okuninushi", ["okuninushi"]), ("Kotoshironushi", ["kotoshironushi"]),
        ("Takeminakata", ["takeminakata"]), ("Sukunabikona", ["sukunabikona"]),
        ("Konohanasakuya-hime", ["konohanasakuya-hime"]),
        # nature kami
        ("Watatsumi / Ryujin", ["watatsumi", "ryujin"]), ("Oyamatsumi", ["oyamatsumi"]),
        ("Raijin (thunder)", ["raijin"]), ("Fujin (wind)", ["fujin"]),
        ("Kagutsuchi (fire)", ["kagutsuchi"]), ("Inari (rice)", ["inari"]),
        # the Munakata sisters
        ("Ichikishima-hime", ["ichikishima-hime"]), ("Tagitsu-hime", ["tagitsu-hime"]),
        ("Tagori-hime", ["tagori-hime"]),
        # Shichifukujin (Seven Lucky Gods — Shinto/Buddhist)
        ("Ebisu", ["ebisu"]), ("Daikokuten", ["daikokuten"]), ("Benzaiten", ["benzaiten"]),
        # deified / cultic
        ("Hachiman", ["hachiman"]), ("Tenjin (Sugawara no Michizane)", ["tenjin"]),
        ("Toyouke", ["toyouke", "toyouke-omikami"]),
    ],
    "Celtic (Irish + Gaulish + Welsh)": [
        # Irish — Tuatha Dé Danann
        ("The Dagda", ["dagda", "the-dagda"]), ("Lugh", ["lugh"]), ("Brigid", ["brigid"]),
        ("Nuada", ["nuada"]), ("The Morrigan", ["the-morrigan", "morrigan"]),
        ("Macha", ["macha"]), ("Badb", ["badb"]), ("Nemain", ["nemain"]),
        ("Dian Cecht", ["dian-cecht"]), ("Goibniu", ["goibniu"]), ("Ogma", ["ogma"]),
        ("Danu", ["danu"]), ("Boann", ["boann"]), ("Aengus Og", ["aengus-og", "aengus"]),
        ("Manannan mac Lir", ["manannan-mac-lir", "manannan"]), ("Lir", ["lir"]),
        ("Balor (Fomorian)", ["balor"]), ("Bres", ["bres"]), ("Donn", ["donn-celtic", "donn"]),
        ("Aine", ["aine"]), ("Midir", ["midir"]), ("Etain", ["etain"]),
        # Gaulish
        ("Cernunnos", ["cernunnos"]), ("Belenos", ["belenos"]), ("Taranis", ["taranis"]),
        ("Teutates", ["teutates"]), ("Epona", ["epona"]), ("Sucellus", ["sucellus"]),
        ("Lugus", ["lugus"]), ("Sulis", ["sulis"]), ("Rosmerta", ["rosmerta"]),
        ("Nodens", ["nodens"]), ("Maponos", ["maponos"]),
        # Welsh
        ("Arianrhod", ["arianrhod"]), ("Gwydion", ["gwydion"]), ("Lleu Llaw Gyffes", ["lleu-llaw-gyffes", "lleu"]),
        ("Rhiannon", ["rhiannon"]), ("Bran the Blessed", ["bran-the-blessed", "bran"]),
        ("Arawn", ["arawn"]), ("Cerridwen", ["cerridwen"]),
    ],
    "Slavic (pre-Christian)": [
        ("Perun", ["perun"]), ("Veles", ["veles"]), ("Svarog", ["svarog"]),
        ("Dazhbog", ["dazhbog"]), ("Mokosh", ["mokosh"]), ("Stribog", ["stribog"]),
        ("Svantovit", ["svantovit"]), ("Chernobog", ["chernobog"]), ("Belobog", ["belobog"]),
        ("Jarilo", ["jarilo"]), ("Marzanna / Morana", ["marzanna", "morana"]),
        ("Khors", ["khors"]), ("Simargl", ["simargl"]), ("Zorya", ["zorya"]),
        ("Rod", ["rod-slavic", "rod"]), ("Kupala", ["kupala"]),
        # honest gaps
        ("Triglav", ["triglav"]), ("Lada", ["lada"]), ("Devana", ["devana"]),
    ],
    "Zoroastrian / Iranian": [
        ("Ahura Mazda", ["ahura-mazda"]), ("Angra Mainyu / Ahriman", ["angra-mainyu-ahriman", "ahriman"]),
        ("Spenta Mainyu", ["spenta-mainyu"]),
        # the Amesha Spentas
        ("Vohu Manah", ["vohu-manah"]), ("Asha Vahishta", ["asha-vahishta"]),
        ("Khshathra Vairya", ["khshathra-vairya"]), ("Spenta Armaiti", ["spenta-armaiti"]),
        ("Haurvatat", ["haurvatat"]), ("Ameretat", ["ameretat"]),
        ("The Amesha Spentas", ["the-amesha-spentas"]),
        # yazatas
        ("Mithra", ["mithra-zoroastrian", "mithra"]), ("Anahita", ["anahita-zoroastrian", "anahita"]),
        ("Verethragna", ["verethragna", "verethraghna"]), ("Sraosha", ["sraosha"]),
        ("Rashnu", ["rashnu-zoroastrian", "rashnu"]), ("Ashi", ["ashi"]), ("Atar (fire)", ["atar"]),
        ("Haoma", ["haoma-zoroastrian", "haoma"]), ("Tishtrya", ["tishtrya"]),
        ("Vayu", ["vayu-iranian", "vayu"]), ("Apam Napat", ["apam-napat-zoroastrian"]),
        ("Daena", ["daena"]),
        # daevas + figures
        ("Aeshma", ["aeshma"]), ("Druj", ["druj"]), ("Nanghaithya", ["nanghaithya-daeva"]),
        ("Yima / Jamshid", ["yima-jamshid"]), ("Zurvan", ["zurvan"]), ("Saoshyant", ["saoshyant"]),
        # honest gaps
        ("Mah (moon)", ["mah", "mah-zoroastrian"]), ("Geush Urvan (ox-soul)", ["geush-urvan"]),
        ("Asman (sky)", ["asman"]),
    ],
    "Hittite / Hurrian (Anatolian)": [
        ("Tarhunna / Teshub (storm)", ["tarhunna", "teshub"]), ("Hebat", ["hebat"]),
        ("Sun-goddess of Arinna", ["sun-goddess-of-arinna"]), ("Istanu (sun)", ["istanu"]),
        ("Telipinu (vanishing god)", ["telipinu"]), ("Kumarbi", ["kumarbi"]),
        ("Illuyanka (dragon)", ["illuyanka"]), ("Inara", ["inara"]), ("Shaushka", ["shaushka-hurrian", "shaushka"]),
        ("Hannahanna", ["hannahanna"]), ("Kamrusepa (healing)", ["kamrusepa"]),
        ("Sharruma", ["sharruma"]), ("Kubaba", ["kubaba"]), ("Shala", ["shala"]),
        ("Runtiya", ["runtiya"]),
        # honest gaps
        ("Halki (grain)", ["halki"]), ("Wurusemu", ["wurusemu"]), ("Aranzah (Tigris)", ["aranzah"]),
    ],
    "Chinese (folk + Daoist)": [
        # cosmogonic / high gods
        ("Pangu", ["pangu"]), ("Nuwa", ["nuwa"]), ("Fuxi", ["fuxi"]), ("Shangdi", ["shangdi"]),
        ("Tian (Heaven)", ["tian-heaven", "tian"]), ("Jade Emperor", ["jade-emperor"]),
        ("Three Pure Ones", ["three-pure-ones"]), ("Xi Wangmu", ["xi-wangmu"]), ("Doumu", ["doumu"]),
        # culture heroes
        ("Shennong", ["shennong"]), ("Huangdi (Yellow Emperor)", ["huangdi"]),
        ("Hou Yi", ["hou-yi"]), ("Chang'e", ["chang-e"]),
        # popular gods
        ("Guanyin", ["guanyin"]), ("Mazu", ["mazu"]), ("Guan Yu", ["guan-yu"]),
        ("Caishen (wealth)", ["caishen"]), ("Zao Jun (kitchen)", ["zao-jun"]),
        ("Tu Di Gong (earth)", ["tu-di-gong"]), ("Wenchang (literature)", ["wenchang"]),
        ("Leigong (thunder)", ["leigong"]), ("Longwang (dragon kings)", ["longwang"]),
        ("Yan-wang (hell)", ["yan-wang"]), ("Xuanwu", ["xuanwu"]),
        ("Erlang Shen", ["erlang-shen"]), ("Nezha", ["nezha"]), ("Sun Wukong", ["sun-wukong"]),
        ("Gonggong", ["gonggong"]), ("Eight Immortals", ["ba-xian"]),
        # honest gaps
        ("Zhurong (fire)", ["zhurong"]), ("Houtu (earth-queen)", ["houtu"]),
        ("Chenghuang (city god)", ["chenghuang"]), ("Cangjie (writing)", ["cangjie"]),
    ],
    "Andean (Inca + pre-Inca)": [
        ("Viracocha (creator)", ["viracocha"]), ("Inti (sun)", ["inti"]),
        ("Mama Quilla (moon)", ["mama-quilla"]), ("Pachamama (earth)", ["pachamama"]),
        ("Mama Cocha (sea)", ["mama-cocha"]), ("Illapa (thunder)", ["illapa"]),
        ("Pachacamac", ["pachacamac"]), ("Supay (underworld)", ["supay"]),
        ("Chasca (Venus)", ["chasca"]), ("Mama Sara (maize)", ["mama-sara"]),
        ("Catequil (thunder)", ["catequil"]), ("Coniraya", ["coniraya"]),
        ("Tunupa", ["tunupa"]), ("Pariacaca", ["pariacaca"]), ("Vichama", ["vichama"]),
        ("Urcuchillay", ["urcuchillay"]), ("Apus (mountain spirits)", ["apus"]),
        ("Ekeko", ["ekeko"]), ("Manco Capac (founder)", ["manco-capac"]), ("Inkarri", ["inkarri"]),
        # honest gaps
        ("Cavillaca", ["cavillaca"]), ("Punchao (sun-image)", ["punchao"]),
    ],
    "Polynesian (Maori / Hawaiian / Tahitian)": [
        # the great gods (cognate across the islands)
        ("Tane / Kane", ["tane", "kane-hawaiian"]), ("Tangaroa / Kanaloa", ["tangaroa", "kanaloa"]),
        ("Tu / Ku", ["tu-maori", "ku"]), ("Rongo / Lono", ["rongo-maori", "lono"]),
        ("Tawhirimatea (winds)", ["tawhirimatea"]), ("Haumia-tiketike", ["haumia-tiketike"]),
        # sky & earth, the supreme
        ("Ranginui (sky-father)", ["ranginui"]), ("Papatuanuku (earth-mother)", ["papatuanuku"]),
        ("Io-matua-kore (supreme)", ["io-matua-kore"]), ("Wakea (Hawaiian sky)", ["wakea"]),
        # other major
        ("Maui (trickster-hero)", ["maui-polynesian"]), ("Hine-nui-te-po (death)", ["hine-nui-te-po"]),
        ("Whiro (dark)", ["whiro"]), ("Ruaumoko (earthquakes)", ["ruaumoko"]),
        ("Pele (volcano)", ["pele"]), ("Haumea", ["haumea"]), ("Hina", ["hina"]),
        ("Oro (Tahitian war)", ["oro-polynesian"]),
        # honest gaps
        ("Tiki (first man)", ["tiki"]), ("Mahuika (fire)", ["mahuika"]), ("Kamapua'a", ["kamapuaa"]),
    ],
    "Pre-Islamic Arabian": [
        ("Allah (high god)", ["allah"]), ("Allat", ["allat"]), ("al-Uzza", ["al-uzza"]),
        ("Manat", ["manat"]), ("Hubal", ["hubal"]), ("Dushara (Nabataean)", ["dushara"]),
        ("Almaqah (Sabaean)", ["almaqah"]), ("Athtar (Venus)", ["athtar"]),
        ("Shams (sun)", ["shams-arabian"]), ("Sin (moon)", ["sin-hadhramaut"]),
        ("Ruda", ["ruda"]), ("Manaf", ["manaf"]),
        # the five idols of Noah's people (Q 71:23)
        ("Wadd", ["wadd"]), ("Suwa", ["suwa"]), ("Yaghuth", ["yaghuth"]),
        ("Yauq", ["yauq"]), ("Nasr", ["nasr-pre-islamic"]),
        # honest gaps
        ("Quzah (storm)", ["quzah"]), ("Isaf & Na'ila", ["isaf-naila"]),
    ],
    "Baltic (Lithuanian / Latvian / Prussian)": [
        ("Dievas (sky-god)", ["dievas-baltic"]), ("Perkunas (thunder)", ["perkunas"]),
        ("Saule (sun)", ["saule"]), ("Meness (moon)", ["meness"]),
        ("Ausrine (dawn / Venus)", ["ausrine"]), ("Laima (fate)", ["laima"]),
        ("Gabija (hearth-fire)", ["gabija"]), ("Zemyna (earth)", ["zemyna"]),
        ("Medeina (forest/hunt)", ["medeina"]), ("Velinas / Velnias (underworld)", ["velinas"]),
        # honest gaps
        ("Potrimpo", ["potrimpo"]), ("Patollo / Pikuolis", ["patollo", "pikuolis"]),
        ("Auseklis", ["auseklis"]),
    ],
    "Etruscan": [
        ("Tinia (sky-king)", ["tinia"]), ("Uni (queen)", ["uni-etruscan"]),
        ("Menrva", ["menvra-etruscan"]), ("Nethuns (sea)", ["nethuns"]),
        ("Turms (messenger)", ["turms"]), ("Charun (death-demon)", ["charun-etruscan"]),
        ("Aita (underworld)", ["aita"]), ("Turan (love)", ["turan"]),
        ("Fufluns (wine)", ["fufluns"]), ("Sethlans (smith)", ["sethlans"]),
        # honest gaps
        ("Laran (war)", ["laran"]), ("Vanth (death-demon)", ["vanth"]),
        ("Usil (sun)", ["usil"]), ("Tivr (moon)", ["tivr"]),
    ],
    "Armenian (pre-Christian)": [
        ("Aramazd (supreme)", ["aramazd"]), ("Anahit (mother)", ["anahit-armenian"]),
        ("Vahagn (dragon-slayer)", ["vahagn"]), ("Astghik (love)", ["astghik"]),
        ("Nane (war-mother)", ["nane-armenian"]), ("Tir (scribe)", ["tir-armenian"]),
        # honest gaps
        ("Mihr (sun)", ["mihr-armenian", "mihr"]), ("Spandaramet (earth)", ["spandaramet"]),
    ],
    "Korean (folk / shamanic)": [
        ("Hwanin (heavenly king)", ["hwanin"]), ("Hwanung", ["hwanung"]),
        ("Tangun (founder)", ["tangun"]), ("Samsin (birth-grandmothers)", ["samsin"]),
        ("Sansin (mountain god)", ["sansin"]),
        # honest gaps
        ("Yeomra (death-king)", ["yeomra", "yomra"]), ("Yongwang (dragon kings)", ["yongwang"]),
        ("Jowangsin (hearth)", ["jowangsin"]),
    ],
}

# ── 3. demand: referenced-but-missing slugs, ranked (linkcheck output) ───────
DEAD = "99_ingest/audit_dead.txt"
STOP = {"wikilink", "wikilinks", "document", "documents", "document-slug",
        "parallel-motif", "tradition", "deity", "person", "event", "theme",
        "place", "symbol", "name", "slug", "target"}
demand = []
if os.path.exists(DEAD):
    for line in open(DEAD, encoding="utf-8"):
        parts = line.rstrip("\n").split("\t")
        if len(parts) < 2:
            continue
        try:
            cnt = int(parts[0])
        except ValueError:
            continue
        tgt = parts[1].strip()
        if tgt in STOP or tgt in present:
            continue
        if "." in tgt or tgt.endswith(("-slug", "-type", "-id")):
            continue
        if not re.fullmatch(r"[a-z][a-z0-9-]{2,}", tgt):
            continue
        demand.append((cnt, tgt))
demand.sort(key=lambda x: (-x[0], x[1]))

# ── report ──────────────────────────────────────────────────────────────────
print(f"=== COMPLETENESS BAR ({len(present)} node slugs indexed) ===\n")
print("NEIGHBORHOOD INTEGRITY:")
neigh_out, all_whole = [], True
for nid, n in NEIGHBORHOODS.items():
    missing = {}
    total = 0
    for trad, slugs in n["endpoints"].items():
        total += len(slugs)
        miss = [s for s in slugs if s not in present]
        if miss:
            missing[trad] = miss
    whole = not missing
    all_whole = all_whole and whole
    pc = total - sum(len(v) for v in missing.values())
    print(f"  {'✅ WHOLE' if whole else '🚨 BROKEN'}  [{nid}] {pc}/{total}")
    for trad, miss in missing.items():
        print(f"          MISSING · {trad}: {', '.join(miss)}")
    neigh_out.append({"id": nid, "label": n["label"], "whole": whole,
                      "present": pc, "total": total, "missing": missing})

print("\nPANTHEON ROSTER COVERAGE:")
roster_out = []
for trad, roster in ROSTERS.items():
    miss = [lbl for lbl, cands in roster if not have(cands)]
    p = len(roster) - len(miss)
    pct = 100 * p // len(roster)
    print(f"  {trad}: {p}/{len(roster)} present ({pct}%)")
    if miss:
        print(f"     MISSING ({len(miss)}): {', '.join(miss)}")
    roster_out.append({"tradition": trad, "present": p, "total": len(roster),
                       "pct": pct, "missing": miss})

print("\nTOP DEMAND — referenced but missing:")
for cnt, tgt in demand[:25]:
    print(f"   {cnt:3d}×  {tgt}")

out = {
    "generatedAt": datetime.date.today().isoformat(),
    "indexedSlugs": len(present),
    "neighborhoodsWhole": all_whole,
    "neighborhoods": neigh_out,
    "rosters": roster_out,
    "topDemand": [{"refs": c, "target": t} for c, t in demand[:50]],
}
os.makedirs("src/data", exist_ok=True)
open("src/data/wire-coverage.json", "w", encoding="utf-8").write(json.dumps(out, indent=1))
print(f"\nNEIGHBORHOODS {'all WHOLE ✅' if all_whole else 'BROKEN 🚨'} "
      f"-> src/data/wire-coverage.json")
raise SystemExit(0 if all_whole else 1)
