#!/usr/bin/env python3
"""
build_data.py — Codex Atlas vault → data.js

Scans every .md file in the vault and emits a single data.js that
the index.html app consumes. Stdlib only — runs with system python3.

Run from the vault root:
    python3 build_data.py
"""

import json
import os
import re
import sys
from pathlib import Path

VAULT = Path(__file__).parent
OUT = VAULT / "data.js"

NODE_DIRS = {
    # Original 16-lens spine (pre-2026-05-18). Type values match the
    # `type:` field every node carries in YAML frontmatter.
    "document":     ["02_documents"],
    "deity":        ["03_deities"],
    "person":       ["04_persons"],
    "event":        ["05_events"],
    "theme":        ["06_themes"],
    "tradition":    ["07_traditions"],
    "symbol":       ["09_symbols"],
    "music":        ["10_music"],
    "alphabet":     ["11_alphabets"],
    "alchemy":      ["12_alchemy"],
    "moral":        ["13_morals"],
    "ritual":       ["14_rituals"],
    "philosophy":   ["15_philosophy"],
    "mathematics":  ["16_mathematics"],
    "medicine":     ["17_medicine"],
    # 10 lenses added 2026-05-18 (ontology lock pass 2).
    "place":             ["08_places"],
    "language":          ["18_languages"],
    "astronomy":         ["19_astronomy"],
    "sacred-site":       ["20_sacred_architecture"],
    "doctrine":          ["21_theology"],
    "practice":          ["22_practices"],
    "relic":             ["23_material_culture"],
    "substance":         ["24_pharmacology"],
    "divination-system": ["25_divination"],
    "calendar-system":   ["26_calendars"],
    # 3 lenses added 2026-05-19 (ontology lock pass 3).
    "attire":            ["27_attire"],
    "exchange-network":  ["28_exchange_networks"],
    "technology":        ["29_technology"],
    # Phase TL-1-adjacent (2026-05-24) — seed the consciousness lens.
    # Per AUDIT/consciousness-lens-spec-2026-05-23.md §2: ~55-figure
    # catalog includes consciousness-figures, csr-findings, contemplative-
    # neuroscience-findings, mysticism-studies-concepts, experiential-
    # profiles. For TL-1-validation we whitelist consciousness-figure
    # (Jung is the seed). Other sub-types whitelist when their first
    # batch lands. Full lens awaits per-item §10 checklist greenlight.
    "consciousness-figure": ["31_consciousness/figures"],
}

# ---------- minimal YAML parser tailored to our schema ----------

def _strip_inline(v: str):
    """Coerce a YAML scalar to a Python value."""
    v = v.strip()
    if v == "" or v == "~" or v.lower() == "null":
        return ""
    if v == "[]":
        return []
    if v.startswith("[[") and v.endswith("]]"):
        return v  # wikilink — preserve as-is so wikilinks() can extract the target
    if v.startswith("[") and v.endswith("]"):
        inner = v[1:-1].strip()
        if not inner:
            return []
        # split on commas not inside brackets/quotes
        parts, buf, depth, in_str = [], "", 0, None
        for ch in inner:
            if in_str:
                buf += ch
                if ch == in_str:
                    in_str = None
                continue
            if ch in ('"', "'"):
                in_str = ch; buf += ch; continue
            if ch in "[{":
                depth += 1; buf += ch; continue
            if ch in "]}":
                depth -= 1; buf += ch; continue
            if ch == "," and depth == 0:
                parts.append(buf.strip()); buf = ""; continue
            buf += ch
        if buf.strip():
            parts.append(buf.strip())
        return [_strip_inline(p) for p in parts]
    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
        return v[1:-1]
    if re.fullmatch(r"-?\d+", v):
        return int(v)
    if re.fullmatch(r"-?\d+\.\d+", v):
        return float(v)
    if v.lower() in ("true", "false"):
        return v.lower() == "true"
    return v


def parse_yaml(text: str) -> dict:
    """Parse the kind of YAML we write — keys, scalars, inline lists,
    block lists (- item), and block lists of dicts (e.g. refs)."""
    lines = text.split("\n")
    result, i = {}, 0
    while i < len(lines):
        raw = lines[i]
        if not raw.strip() or raw.lstrip().startswith("#"):
            i += 1; continue
        # top-level "key: value" or "key:"
        m = re.match(r"^([A-Za-z0-9_\-']+):\s*(.*)$", raw)
        if not m:
            i += 1; continue
        key, rest = m.group(1), m.group(2)
        if rest.strip() == "":
            # block — either a list or nested dict; peek
            j = i + 1
            block_lines = []
            while j < len(lines) and (lines[j].startswith("  ") or lines[j].strip() == ""):
                block_lines.append(lines[j])
                j += 1
            # is it a list of dicts (each starting with `  - `)?
            if block_lines and any(re.match(r"^\s*- ", b) for b in block_lines):
                items = []
                cur = None
                for b in block_lines:
                    if re.match(r"^\s*- ", b):
                        if cur is not None:
                            items.append(cur)
                        cur = {}
                        inner = b.strip()[2:]  # past '- '
                        # if it's `- "value"` (scalar list), append directly
                        sm = re.match(r"^([A-Za-z0-9_\-']+):\s*(.*)$", inner)
                        if sm:
                            cur[sm.group(1)] = _strip_inline(sm.group(2))
                        else:
                            items.append(_strip_inline(inner))
                            cur = None
                    else:
                        if cur is None:
                            continue
                        sm = re.match(r"^\s+([A-Za-z0-9_\-']+):\s*(.*)$", b)
                        if sm:
                            cur[sm.group(1)] = _strip_inline(sm.group(2))
                if cur is not None:
                    items.append(cur)
                result[key] = items
            else:
                result[key] = ""
            i = j
            continue
        result[key] = _strip_inline(rest)
        i += 1
    return result


# ---------- markdown utilities ----------

WIKILINK_RE = re.compile(r"\[\[([^\]\|]+)(?:\|[^\]]*)?\]\]")

def split_frontmatter(text: str):
    if not text.startswith("---"):
        return {}, text
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.DOTALL)
    if not m:
        return {}, text
    return parse_yaml(m.group(1)), m.group(2).strip()


def wikilinks(text: str):
    """Yield linked ids inside [[ ]] references — strips leading '../' etc."""
    for raw in WIKILINK_RE.findall(text or ""):
        clean = raw.strip().lstrip("./").split("/")[-1]
        # drop any .md extension and leading "phase-N-NNN-" stays in id
        clean = re.sub(r"\.md$", "", clean)
        yield clean


def deep_collect_wikilinks(value):
    """Walk a YAML value (str | list | dict) and return all wikilink ids."""
    found = []
    if value is None:
        return found
    if isinstance(value, str):
        found.extend(wikilinks(value))
    elif isinstance(value, list):
        for v in value:
            found.extend(deep_collect_wikilinks(v))
    elif isinstance(value, dict):
        for v in value.values():
            found.extend(deep_collect_wikilinks(v))
    return found


# ---------- main scan ----------

def derive_id(filepath: Path, frontmatter: dict) -> str:
    if "id" in frontmatter and frontmatter["id"]:
        return str(frontmatter["id"])
    return filepath.stem


TRADITION_COLORS = {
    "Sumerian / Mesopotamian": "#c25450",
    "Sumerian": "#c25450",
    "Babylonian": "#a8453e",
    "Babylonian (Akkadian) — drawing on Sumerian prototypes": "#a8453e",
    "Sumerian / Babylonian": "#b94d49",
    "Egyptian": "#d4a55a",
    "Ancient Egyptian": "#d4a55a",
    "Canaanite / Ugaritic": "#3f8a8c",
    "Ugaritic": "#3f8a8c",
    "Vedic Hindu": "#e08a3a",
    "Hindu": "#e08a3a",
    "Iranian / Zoroastrian": "#5a6cc4",
    "Zoroastrian": "#5a6cc4",
    "Judaism": "#9aa55a",
    "Hebrew": "#9aa55a",
    "Buddhism": "#c4a05a",
    "Daoism": "#5a9a8f",
    "Confucianism": "#8a6c5a",
    "Greek": "#8a5ac4",
    "Greek religion": "#8a5ac4",
    "Christianity": "#c44a5a",
    "Christian": "#c44a5a",
    "Gnosticism": "#6b3a8a",
    "Gnostic Christianity": "#6b3a8a",
    "Hermeticism": "#a8a3b8",
    "Manichaeism": "#7a5a9a",
    "Mandaeism": "#3a6a8a",
    "Neoplatonism": "#5a8a8a",
    "Islam": "#3a8a6a",
}

def tradition_color(t: str) -> str:
    if not t:
        return "#7a8090"
    if t in TRADITION_COLORS:
        return TRADITION_COLORS[t]
    # partial match
    for key, col in TRADITION_COLORS.items():
        if key.split(" ")[0] in t:
            return col
    return "#7a8090"


# Tradition families — coarser grouping for ring-layout adjacency.
# Order matters — ring placement follows this list, so cross-family edges
# stay as short arcs rather than long chords.
TRADITION_FAMILY_ORDER = [
    # Ancient Near East cluster
    "Mesopotamian",
    "Hittite",
    "Canaanite",
    "Israelite",
    "Rabbinic",
    "Zoroastrian",
    "Armenian",
    # Indic / East Asian
    "Vedic",
    "Buddhist",
    "Chinese",
    "Korean",
    # African / Egyptian
    "Egyptian",
    "African",
    # Greco-Roman / Mediterranean
    "Etruscan",
    "Hermetic",
    "Phrygian",
    "Mystery",
    "Greek",
    "Roman",
    "Celtic",
    "Norse",
    "Baltic",
    "Slavic-Finnic",
    # Late-antique sectarian cluster
    "Christian",
    "Gnostic",
    "Neoplatonist",
    "Manichaean",
    "Mandaean",
    # Pre-Islamic Arabian (distinct from Islamic — pagan Arabian pantheon condemned in Quran)
    "Pre-Islamic-Arabian",
    # Islamic
    "Islamic",
    # New World / Pacific (geographic cluster)
    "Mesoamerican",
    "Andean",
    "Native-American",
    "Pacific",
    "Shinto",
    # Modern / academic / NRM
    "Modern-Esoteric",
    "Academic",
    "Other",
]

FAMILY_COLORS = {
    "Mesopotamian":     "#c25450",
    "Canaanite":        "#3f8a8c",
    "Israelite":        "#9aa55a",
    "Rabbinic":         "#8aa07a",
    "Zoroastrian":      "#5a6cc4",
    "Hittite":          "#7a6040",
    "Armenian":         "#8a3a5a",
    "Vedic":            "#e08a3a",
    "Buddhist":         "#c4a05a",
    "Chinese":          "#5a9a8f",
    "Egyptian":         "#d4a55a",
    "African":          "#b86a3a",
    "Etruscan":         "#c47a50",
    "Hermetic":         "#a8a3b8",
    "Mystery":          "#a85a8a",
    "Phrygian":         "#b0566a",  # Cybele rose (Anatolian, distinct from Mystery)
    "Korean":           "#4a78b0",  # Korean blue (distinct from Chinese teal)
    "Greek":            "#8a5ac4",
    "Roman":            "#7a5a9a",
    "Celtic":           "#4a8a4a",
    "Norse":            "#5a7aa4",
    "Slavic-Finnic":    "#6a5a8a",
    "Christian":        "#c44a5a",
    "Gnostic":          "#6b3a8a",
    "Neoplatonist":     "#5a8a8a",
    "Manichaean":       "#7a4a9a",
    "Mandaean":         "#3a6a8a",
    "Pre-Islamic-Arabian": "#b87a40",  # desert amber
    "Islamic":          "#3a8a6a",
    "Mesoamerican":     "#9a4a3a",
    "Andean":           "#a07050",
    "Native-American":  "#8a6a4a",
    "Pacific":          "#3a8aa4",
    "Shinto":           "#c85050",
    "Baltic":           "#7a9a5a",
    "Modern-Esoteric":  "#9a7ac4",
    "Academic":         "#6a7a8a",
    "Other":            "#7a8090",
}

def tradition_family(t: str) -> str:
    if not t:
        return "Other"
    import re as _re
    # 1. Remove "canonical in [[...]]" and similar context-only annotations first so slugs
    #    like [[tradition-ethiopian-orthodox-tewahedo]] don't leak "ethiopian" into
    #    unrelated family checks (e.g. Enochic archangels mapping to African).
    cleaned = _re.sub(
        r'[/|]?\s*(?:canonical|liturgically retained|scripture|attested)\s+in\s+\[\[[^\]]*\]\]',
        '', t, flags=_re.IGNORECASE
    )
    # 2. Expand remaining wikilinks to just their slug text ([[tradition-donghak]] → tradition-donghak)
    #    so primary-tradition wikilink nodes (e.g. tradition: "[[tradition-donghak]]") still classify.
    cleaned = _re.sub(r'\[\[([^|\]]+)(?:\|[^\]]+)?\]\]', r'\1', cleaned)
    s = cleaned.lower()
    # 3. Christian-tradition slug guards — when the primary tradition is a wikilink
    #    to a Christian sub-tradition whose slug contains a region/family keyword
    #    (e.g. tradition-ethiopian-orthodox-tewahedo, tradition-coptic-orthodox,
    #    tradition-armenian-apostolic, tradition-greek-orthodox), those keywords
    #    would otherwise leak into African/Egyptian/Armenian/Greek checks. Catch
    #    the explicit Christian-Orthodox/Apostolic markers up-front.
    if "tewahedo" in s or "apostolic christian" in s or "armenian-apostolic" in s or "armenian apostolic" in s:
        return "Christian"
    if ("orthodox" in s) and (
        "greek" in s or "russian" in s or "serbian" in s or "ethiopian" in s
        or "coptic" in s or "syrian" in s or "antiochian" in s or "georgian" in s
        or "eastern" in s or "oriental" in s
    ):
        return "Christian"
    # ORDER matters — most-origin-specific first so that cross-traditional strings
    # ("Pre-Christian Slavic", "Zoroastrian → Christian demonology", etc.) land in
    # their ORIGIN family, not the latest tradition mentioned.
    if "gnostic" in s or "sethian" in s or "valentinian" in s or "thomasine" in s or "cathar" in s or "bogomil" in s:
        return "Gnostic"
    if not s.startswith("christianit") and "mandae" in s:
        return "Mandaean"
    # Manichaean — guard against Second-Temple Jewish texts (Book of Giants etc.)
    # that Manichaeism canonized later. Origin-wins: those are Israelite.
    if "manichae" in s and not (s.startswith("second temple") or s.startswith("second-temple")):
        return "Manichaean"
    if "neoplaton" in s or "plotin" in s or "iambl" in s or "procl" in s:
        return "Neoplatonist"
    if "hermetic" in s or "hermetism" in s:
        return "Hermetic"
    if s.startswith("roman") or "italic religion" in s:
        return "Roman"
    # Phrygian (membership-vs-wire 2026-06-02) — Cybele/Attis/Sabazios ORIGINATE in
    # Phrygian/Anatolian religion. Their fame as Greco-Roman MYSTERY cults is a
    # reception (an appearance-wire), not their home family. Checked BEFORE Mystery
    # so origin wins. Only attis/cybele/sabazios carry "phrygian" in tradition.
    if "phrygian" in s:
        return "Phrygian"
    # Mystery — also catch nodes explicitly marked as mystery-cult layer
    # (e.g. dionysus-mystery: "Greek and Roman mystery-cult layers (distinguished from civic Olympian Dionysus)")
    if (("mystery-cult" in s or "mystery cult" in s)
            or (not s.startswith("greek") and ("mystery" in s or "mithra" in s or "orphic" in s
                                               or "eleusin" in s or "bacchic" in s))):
        return "Mystery"
    # --- Ancient origin traditions checked BEFORE Christian so that strings like
    #     "Pre-Christian Slavic", "Zoroastrian → Christian demonology", "Celtic
    #     paganism → Irish Christianity", or "Hebrew Bible → medieval Christian"
    #     all land in their origin family, not in Christian. ---
    if not (s.startswith("vedic") or s.startswith("hindu")) and ("zoroastr" in s or "avesta" in s or "mazdean" in s):
        return "Zoroastrian"
    # Canaanite — adds "levantine" so Phoenician/Levantine deities don't fall through.
    # Guard against "pre-islamic" prefix so Hubal ("Pre-Islamic Arabian ... Levantine
    # import") still lands in Pre-Islamic-Arabian below.
    if (not s.startswith("greek") and not s.startswith("pre-islamic")
            and ("canaan" in s or "ugarit" in s or "philistine" in s or "phoenic" in s
                 or "northwest semitic" in s or "levantine" in s)):
        return "Canaanite"
    if not s.startswith("christianit") and ("israel" in s or "hebrew" in s or "jewish" in s or "judaism" in s or "second temple" in s or "qumran" in s or "essene" in s):
        return "Israelite"
    # Hittite — origin-wins guard against Greek figures with Anatolian substrate (e.g. Typhon).
    if (("hittite" in s or "hurrian" in s or "luwian" in s or "hattic" in s)
            and not s.startswith("greek")):
        return "Hittite"
    if "sumerian" in s or "akkadian" in s or "babylonian" in s or "assyrian" in s or "mesopotam" in s or "elamite" in s:
        return "Mesopotamian"
    if "egyptian" in s or "amarna" in s or "ptolema" in s or "kemetic" in s:
        return "Egyptian"
    # Pre-Islamic Arabian — pagan Arabian pantheon (al-Uzza, Allat, Manat, Hubal, Nasr, Wadd)
    # Guard: must NOT start with "islam" — prevents allah's tradition from landing here
    if not s.startswith("islam") and (
        "pre-islamic" in s or "arabian polytheism" in s or "south arabian religion" in s or "minaean" in s or "nabataean" in s
    ):
        return "Pre-Islamic-Arabian"
    # African — \bakan\b and \bsan\b word-boundaries so Arakanese (Burmese) and
    # "Pisan civic cult" don't false-fire into African.
    if ("yoruba" in s or "ifa" in s or "vodun" in s or "vodou" in s or "santeria" in s
            or "candomble" in s or _re.search(r'\bakan\b', s) or "bantu" in s
            or "ethiopian" in s or "aksumite" in s or "kebra" in s or "african" in s
            or _re.search(r'\bsan\b', s) or "maasai" in s or "dahomey" in s
            or "igbo" in s or "shona" in s or "zulu" in s or "dogon" in s
            or _re.search(r'\bewe\b', s) or "ashanti" in s or "kongo" in s):
        return "African"
    # Celtic — \biberian\b and \bbreton\b word-boundaries so Siberian shamanism and
    # André Breton don't false-fire into Celtic.
    if ("celtic" in s or "druid" in s or "gaelic" in s or "irish" in s or "welsh" in s
            or "gaulish" in s or _re.search(r'\bbreton\b', s) or "lusitanian" in s
            or _re.search(r'\biberian\b', s) or "gallaecian" in s):
        return "Celtic"
    if "norse" in s or "germanic" in s or "icelandic" in s or "viking" in s or "asatru" in s or "anglo-saxon" in s:
        return "Norse"
    if "baltic pagan" in s or "latvian" in s or "lithuanian" in s or "prussian pagan" in s:
        return "Baltic"
    if "slavic" in s or "finnic" in s or "finnish" in s or "karelian" in s or "sami" in s or "kalevala" in s or "finno-karelian" in s:
        return "Slavic-Finnic"
    # Greek — adds "greco-roman" / "graeco-roman" so e.g. psyche-myth doesn't fall
    # through to Modern-Esoteric via "literary mythology".
    if ("greek" in s or "hellenistic" in s or "greco-roman" in s or "graeco-roman" in s
            or "platonist" in s or "stoic" in s or "aristot" in s or "pythagor" in s
            or "epicurean" in s or "cynic" in s or "skeptic" in s):
        return "Greek"
    # Christian checked AFTER ancient origin traditions — also excludes "pre-christian" strings
    # s.startswith("christianit") catches "Christianity (from Second Temple Jewish substrate)" before "jewish" fires
    if "pre-christian" not in s and (
        s.startswith("christianit") or "christian" in s or "patristic" in s or "coptic" in s or "byzantine" in s
        or "lutheran" in s or "calvinist" in s or "reformed" in s or "protestant" in s
        or "catholic" in s or "anglican" in s or "rosicrucian" in s or "freemason" in s
        or "mormon" in s or "baha" in s or "scientology" in s or "spiritualist" in s
        or "new age" in s or "wicca" in s or "rastafari" in s
    ):
        return "Christian"
    if "rabbinic" in s or "mishnah" in s or "talmud" in s or "midrash" in s or "kabbal" in s or "hasidic" in s or "hasidism" in s or "merkavah" in s or "hekhalot" in s or "sabbatean" in s or "frankist" in s:
        return "Rabbinic"
    # startswith guard — "pre-islamic" handled above; only block if string STARTS with it
    # "shia" as bare word only — prevents "tsimshian" (Native-American) from matching
    if not s.startswith("pre-islamic") and (
        "islam" in s or "qur" in s or "sufi" in s or _re.search(r'\bshia\b', s) or "shi'a" in s
        or "ismaili" in s or "alevi" in s or "druze" in s or "yazidi" in s or "muslim" in s
    ):
        return "Islamic"
    if "shinto" in s or "kojiki" in s or "nihon shoki" in s or "nihongi" in s:
        return "Shinto"
    # Vedic checked first among the East/South-Asian block — origin tradition wins for
    # shared deities (Garuda, Kubera, Yama, Mahakala) whose tradition strings lead with
    # "Vedic"/"Hindu" but also list Buddhism/Jainism downstream.
    if ("sikh" in s or "vedic" in s or "hindu" in s or "upanish" in s or "brahman" in s
            or "tantric" in s or "vaishnav" in s or "shakta" in s or "shaiv" in s
            or "bhakti" in s or "vedanta" in s or "jain" in s or "hindutva" in s):
        return "Vedic"
    # Korean (membership-vs-wire 2026-06-02) — Korean shamanism (Muism) + Korean
    # founding myth (Hwanin/Hwanung/Tangun) is its OWN origin family, NOT Chinese.
    # Keyed on ORIGIN markers (startswith korean / muism) so Indian-Buddhist deities
    # that merely list Korean reception in the tail (Dizang's "Mahāyāna Buddhism
    # (Chinese, Japanese, Korean ...)") still fall through to Buddhist below.
    if s.startswith("korean") or "muism" in s:
        return "Korean"
    # Chinese — uses STARTSWITH guards on Chinese-keyword leads so deified Chinese
    # generals/officials (Guan Yu, Mazu, Sun Wukong, Yan Wang) whose tradition strings
    # start with "Chinese folk religion / ... / Buddhist" land in Chinese (origin-wins),
    # while Indian-origin Buddhist deities with Chinese reception in the tail (Hariti's
    # "Buddhism — early Indian, Gandhāran, Chinese, Japanese", Dizang's "Mahāyāna
    # Buddhism (Chinese, Japanese, Korean — pan-East Asian)") fall through to the
    # Buddhist check below. \bshang\b word-boundary prevents Shanghai/Shangri-La hits.
    if (s.startswith("chinese") or s.startswith("confucian") or s.startswith("daoist")
            or s.startswith("daoism") or s.startswith("taoist") or s.startswith("taoism")
            or s.startswith("zhou")
            or _re.search(r'\bshang\b', s)):
        return "Chinese"
    # Buddhist — catches Indian-Buddhist origin deities even when their tradition
    # string mentions Chinese/Japanese/Korean reception downstream (Hariti, Dizang).
    # Word-boundaries on \bbon\b, \bzen\b, \bchan\b so Bonaventure/Sorbonne,
    # Renaissance/citizen, "chant" don't false-fire.
    if ("buddh" in s or "theravada" in s or "mahayana" in s
            or _re.search(r'\bzen\b', s) or _re.search(r'\bchan\b', s)
            or "vajra" in s or "tantric buddh" in s or "pure land" in s
            or "dzogchen" in s or _re.search(r'\bbon\b', s)):
        return "Buddhist"
    # Chinese — fallback for tradition strings that mention Chinese keywords in the
    # tail (no Vedic/Buddhist origin marker fired earlier).
    if ("chinese" in s or "confucian" in s or "daoist" in s or "daoism" in s
            or "taoist" in s or "taoism" in s):
        return "Chinese"
    if "zoroastr" in s or "avesta" in s or "iranian" in s or "ahura" in s:
        return "Zoroastrian"
    if "armenian" in s and "apostolic" not in s:
        return "Armenian"
    if "etruscan" in s and "roman" not in s:
        return "Etruscan"
    # Mesoamerican — \bmaya\b word-boundary so "Himalayan" / "Maya Angelou" don't
    # false-fire (Himalayan would also be caught by Buddhist/Vedic above).
    if ("aztec" in s or "mexica" in s or "nahuatl" in s or _re.search(r'\bmaya\b', s)
            or "mayan" in s or "olmec" in s or "toltec" in s or "zapotec" in s
            or "mixtec" in s or "mesoamerican" in s):
        return "Mesoamerican"
    # Andean — \binca\b word-boundary so "incarnation" / "incantation" don't false-fire.
    if _re.search(r'\binca\b', s) or "andean" in s or "quechua" in s or "aymara" in s or "moche" in s:
        return "Andean"
    # "inuit" word-boundary — "continuity" contains "inuit" as substring
    if ("lakota" in s or "iroquois" in s or "haudenosaunee" in s or "navajo" in s or "hopi" in s or "cherokee" in s or "algonqu" in s or "native american" in s or "first nations" in s or "anishin" in s or "pueblo" in s or "diné" in s or _re.search(r'\binuit\b', s) or "yupik" in s or "tlingit" in s or "haida" in s or "tsimshian" in s
            or "pawnee" in s or "zuni" in s or "ojibwe" in s or _re.search(r'\bcree\b', s) or "blackfoot" in s or "apache" in s or "comanche" in s or "shoshone" in s or "cheyenne" in s or _re.search(r'\bsioux\b', s) or "dakota" in s or "abenaki" in s or "wabanaki" in s or "salish" in s or "chinook" in s or "kwakiutl" in s or "mi'kmaq" in s):
        return "Native-American"
    if ("polynesian" in s or "maori" in s or "māori" in s or "hawaiian" in s
            or "samoan" in s or "tongan" in s or "aboriginal" in s or "australian" in s
            or "australia" in s or "torres" in s or "papuan" in s or "melanesian" in s
            or "pacific" in s or _re.search(r'\bkimberley\b', s) or _re.search(r'\bkulin\b', s)):
        return "Pacific"
    # Modern-Esoteric — "caodai" no-space variant added.
    if ("theosoph" in s or "anthroposoph" in s or "thelem" in s or "rosic" in s
            or "occult" in s or "gurdj" in s or "esoteric" in s or "blakean" in s
            or "blake" in s or "tenrikyo" in s or "donghak" in s or "cao dai" in s
            or "cao-dai" in s or "caodai" in s or "literary mythology" in s
            or "literary fiction" in s):
        return "Modern-Esoteric"
    if "academic" in s or "comparative religion" in s or "jungian" in s or "religionsgeschichtl" in s or "phenomenology of religion" in s:
        return "Academic"
    return "Other"


# ── Phase B-DATING-1 (2026-05-24) — slug-extracted year for events ──
# Some event nodes carry the year in the slug (e.g.,
#   event-cahokia-foundation-c-1050-ce
#   event-imjin-war-burning-of-bulguksa-1593
# ) but have empty frontmatter. The audit estimated ~50 such nodes.
# This helper recovers the year from the slug as a last-resort B1.
# Pattern matches: optional 'c-' or 'c' prefix + 3-4 digit year +
# optional '-bce' / '-ce' suffix + end-of-string.
import re as _re
_EVENT_YEAR_RE = _re.compile(r"-(c-?-?)?(\d{2,4})(?:-(bce|ce|bc|ad))?$", _re.IGNORECASE)
_EVENT_YEAR_RE_MIDPART = _re.compile(r"-(c-?-?)?(\d{2,4})-(\d{2,4})(?:-(bce|ce|bc|ad))?(-[a-z]+)?$", _re.IGNORECASE)
def extract_year_from_slug(slug: str):
    """Return integer year if recoverable from a node id, else None."""
    if not slug:
        return None
    # Try range pattern first ("1939-1945-ww2"). Take the earlier year.
    m = _EVENT_YEAR_RE_MIDPART.search(slug)
    if m:
        try:
            y = int(m.group(2))
            era = (m.group(4) or "").lower()
            if era in ("bce", "bc"):
                y = -y
            return y
        except (ValueError, TypeError):
            pass
    m = _EVENT_YEAR_RE.search(slug)
    if m:
        try:
            y = int(m.group(2))
            era = (m.group(3) or "").lower()
            if era in ("bce", "bc"):
                y = -y
            return y
        except (ValueError, TypeError):
            pass
    return None


def parse_influences_md(path: Path):
    """Pull edges out of _graph/influences.md (raw text block format)."""
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    edges = []
    # entries look like: `[type] source → target`
    block_re = re.compile(
        r"`\[(?P<type>[a-z\-]+)\]\s+(?P<source>[a-z0-9\-\_]+)\s*→\s*(?P<target>[a-z0-9\-\_]+(?:\s*→\s*[a-z0-9\-\_]+)?)`",
        re.IGNORECASE,
    )
    for m in block_re.finditer(text):
        edges.append({
            "source": m.group("source"),
            "target": m.group("target").split("→")[-1].strip(),
            "type": m.group("type"),
            "from": "influences.md",
        })
    return edges


def collect_node_edges(nodes_by_id):
    """Derive edges from each node's YAML wikilink fields."""
    edges = []
    edge_fields = [
        ("themes",            "has-theme"),
        ("parallels",         "parallel-motif"),
        ("influenced-by",     "influenced-by"),
        ("influences",        "influences"),
        ("deities-mentioned", "attests"),
        ("events-context",    "context"),
        ("attested-in",       "attested-in"),
        ("equivalents",       "syncretic"),
        ("parent-of",         "parent-of"),
        ("child-of",          "child-of"),
        ("consort",           "consort"),
        ("key-deities",       "tradition-deity"),
        ("key-documents",     "tradition-doc"),
        ("key-persons",       "tradition-person"),
        ("texts-authored",    "authored"),
        ("texts-attributed-to", "attributed-author"),  # traditional/disputed authorship — Moses→Pentateuch, Solomon→Ecclesiastes, deutero-Paulines
        ("originator-of",     "originated"),             # person introduced a concept/theme — Plato→demiurge, Plotinus→the-one
        ("mentioned-in",      "mentioned-in"),           # person/deity is named in document — Jerome ← Vulgate, Galen ← Stoic fragments
        ("events-participated", "participated-in"),       # person took part in event — Constantine → Nicaea, Jerome → Sack of Rome
        ("key-figures",       "key-figure"),             # document features person as author/redactor/protagonist/addressee
        # SYMBOL node fields (09_symbols/). appearances → documents; deity-instances → deities;
        # tradition-context → traditions. These produce typed edges from symbol → target.
        ("appearances",       "symbol-attests-in"),
        ("deity-instances",   "symbol-iconography-of"),
        ("tradition-context", "symbol-in-tradition"),
        # MUSIC node fields (10_music/). mirrors symbol field pattern.
        ("music-appearances",         "music-attests-in"),
        ("music-deity-connections",   "music-iconography-of"),
        ("music-tradition-context",   "music-in-tradition"),
        # EVENT node outgoing fields. The pre-existing schema-event.md uses these YAML
        # keys (participants / traditions-affected / documents-affected / documents-produced)
        # but they were never registered as edge-emitters — so every event had ONLY incoming
        # edges (from other nodes' `events-participated` etc.). That left the new monument
        # event nodes orphaned in the Pantheon Monuments view (no edges → no family
        # derivation → all bucket to "Other"). Registering these fields here closes the gap.
        ("participants",        "participated-in"),   # event → person (mirrors person→event from events-participated)
        ("traditions-affected", "affects-tradition"), # event → tradition (e.g., Chalcedon → Christianity, Hegira → Islam)
        ("documents-affected",  "affects-document"),  # event → document (e.g., Nag Hammadi → Gospel of Thomas)
        ("documents-produced",  "produces-document"), # event → document (e.g., Council of Nicaea → Nicene Creed)
        ("deities-affected",    "affects-deity"),     # event → deity (rare; e.g., Akhenaten reform → Aten elevation)
    ]
    for node_id, node in nodes_by_id.items():
        fm = node["frontmatter"]
        for field, etype in edge_fields:
            val = fm.get(field)
            if not val:
                continue
            if isinstance(val, str):
                val = [val]
            for entry in val:
                if isinstance(entry, dict):
                    continue
                for target in wikilinks(str(entry)):
                    if target == node_id:
                        continue
                    edges.append({
                        "source": node_id,
                        "target": target,
                        "type": etype,
                        "field": field,
                        # 2026-05-23 Phase 21AR — every emitted edge carries a
                        # source_tier so the Forge tier-filter is dead simple
                        # (renderer never has to default-T1 a missing field).
                        # These plain-list edge fields (consort, child-of,
                        # parent-of, …) predate the tier system and describe
                        # within-tradition family/ritual structure that is
                        # mainstream-accepted-by-default → T1.
                        "source_tier": "T1",
                    })
        # === Structured-edge fields ===
        # Each of the *-edges / connections / connects-to / cross-* fields uses a
        # block-list of dicts with at minimum a `target:` field. The edge type comes
        # from the entry's `type:` (or `relation:` for connects-to), falling back to
        # a per-field default. Targets may be either "[[wikilink]]" or bare slug.
        #
        # The bare-slug fallback rejects prose-shaped strings (anything that isn't
        # kebab-case lowercase). This prevents emitting fake edges from descriptive
        # notes accidentally typed into the `target:` slot, e.g.
        #   - target: "Saint Patrick (because of the snake imagery)"
        # which previously produced damballa→"Saint Patrick (because..."  dead-edges.
        #
        # The structured-edge registry below covers every per-folder convention found
        # in the vault as of 2026-05-17. New conventions should be added here, not
        # re-implemented inline.
        STRUCTURED_EDGE_FIELDS = [
            ("syncretic-edges",         "identification",  "syncretic-"),   # deities
            ("cross-symbol-edges",      "visual-cognate",  None),           # 09_symbols/
            ("cross-alphabet-edges",    "parallel-form",   None),           # 11_alphabets/
            ("cross-music-edges",       "parallel-form",   None),           # 10_music/
            ("cross-tradition-edges",   "parallel-form",   None),           # 16_mathematics/
            ("cross-alchemy-edges",     "parallel-form",   None),           # 12_alchemy/
            ("cross-ritual-edges",      "parallel-form",   None),           # 14_rituals/
            ("cross-moral-edges",       "parallel-form",   None),           # 13_morals/
            ("cross-tradition-parallels","parallel-motif", None),           # 06_themes/
            ("cross-links",             "ancestor-of",     None),           # 03_deities/ (Celtic/Welsh anchors)
            ("connections",             "parallel-form",   None),           # 09_symbols/ (older convention used by a few nodes)
            ("connects-to",             "connects-to",     None),           # 04_persons/ (uses `relation:` instead of `type:`)
        ]
        SLUG_RE = re.compile(r"^[a-z0-9_-]+$")
        for field, default_etype, etype_prefix in STRUCTURED_EDGE_FIELDS:
            block = fm.get(field)
            if not isinstance(block, list):
                continue
            for s in block:
                if not isinstance(s, dict) or not s.get("target"):
                    continue
                target_raw = str(s["target"]).strip()
                # accept "[[slug]]" anywhere in target, else bare-slug if valid shape
                candidate_targets = list(wikilinks(target_raw))
                if not candidate_targets:
                    bare = target_raw.lstrip("[").rstrip("]").strip()
                    if SLUG_RE.match(bare):
                        candidate_targets = [bare]
                    # else: drop — target looks like prose, not a slug
                # edge type: prefer `type:`, fall back to `relation:` (connects-to),
                # then per-field default. Apply optional prefix for syncretic-edges.
                raw_etype = (s.get("type") or s.get("relation") or default_etype).strip()
                etype = (etype_prefix + raw_etype) if etype_prefix else raw_etype
                # 2026-05-23 Phase 21AR — surface CODEX v1.1 source-tier
                # + political-risk-flag onto each emitted edge so the
                # Forge wire-renderer can filter by tier and the side-panel
                # tooltip can render the per-tier disclaimer chrome.
                # Per PROTOCOL §3.1: source-tier is REQUIRED on syncretic-
                # edges from 2026-05-23 onward; legacy edges that lack it
                # default to T1 (mainstream peer-reviewed) since they were
                # written before the tier system existed.
                src_tier = (s.get("source-tier") or s.get("source_tier") or "T1").strip()
                if src_tier not in ("T1", "T2", "T3", "T4", "T5"):
                    src_tier = "T1"   # invalid value → safe default
                pol_risk = bool(s.get("political-risk-flag") or s.get("political_risk_flag"))
                src_text = s.get("source") or ""
                notes_text = s.get("notes") or ""
                for target in candidate_targets:
                    if not target or target == node_id:
                        continue
                    edge_obj = {
                        "source": node_id,
                        "target": target,
                        "type": etype,
                        "field": field,
                        "source_tier": src_tier,
                    }
                    if pol_risk:
                        edge_obj["political_risk_flag"] = True
                    if src_text:
                        edge_obj["edge_source"] = str(src_text)
                    if notes_text:
                        edge_obj["edge_notes"] = str(notes_text)
                    edges.append(edge_obj)

        # === 2026-05-29 — Body-table edges =============================
        # Many MASSIVE-WIN essay nodes (and a lot of person/theme nodes)
        # encode their cross-tradition wirings as markdown TABLE rows in
        # the body, not as a `syncretic-edges:` YAML block. Example from
        # `04_persons/nagarjuna.md`:
        #
        #   | [[wittgenstein]]  | structural-parallel | Philosophy's self-dissolution... |
        #   | [[derrida]]       | structural-parallel | Différance :: śūnyatā... |
        #   | [[candrakirti]]   | chief-commentator   | Prāsaṅgika...           |
        #
        # Until now these never made it into vault.edges, so any board
        # preset (or Forge wire pass) that referenced two such nodes
        # had nothing to draw between them. The Nāgārjuna ↔ Wittgenstein
        # MASSIVE-WIN preset MW-012 was the user-flagged case.
        #
        # We extract rows that look like exactly THREE pipe-separated
        # cells where cell-1 is `[[slug]]` (target) and cell-2 is a
        # kebab-case edge-type identifier. The third cell is preserved
        # as `edge_notes`. We skip header separators (cell-2 starts
        # with `-` or `:`).
        body_text = node.get("body") or ""
        if body_text and "|" in body_text:
            for m in BODY_TABLE_ROW_RX.finditer(body_text):
                target_slug = m.group(1).strip()
                # Allow `[[slug|display]]` form — keep slug only.
                if "|" in target_slug:
                    target_slug = target_slug.split("|", 1)[0].strip()
                target_slug = target_slug.lower()
                # Reject prose / wikilinks that don't look like slugs
                # (the structured-edge field uses the same guard).
                if not SLUG_RE.match(target_slug):
                    continue
                if target_slug == node_id:
                    continue
                etype = m.group(2).strip().lower()
                notes = m.group(3).strip()
                # Skip separator rows: `|---|---|---|` and aliases.
                if not etype or etype.startswith(("-", ":")) or set(etype) <= {"-", ":"}:
                    continue
                # Source-tier defaults to T1 (mainstream) for body-table
                # edges since they predate the tier system on most nodes.
                edge_obj = {
                    "source":      node_id,
                    "target":      target_slug,
                    "type":        etype,
                    "field":       "body-table",
                    "source_tier": "T1",
                }
                if notes:
                    edge_obj["edge_notes"] = notes
                edges.append(edge_obj)
    return edges


# Body-table row matcher. Three cells. Cell-1 = `[[slug]]` (with optional
# `|display` text after the slug). Cell-2 = kebab-case edge-type identifier.
# Cell-3 = free-form notes (HTML / Unicode allowed). The leading pipe and
# trailing pipe are required; we anchor each line so we don't accidentally
# match inline `|` characters elsewhere.
BODY_TABLE_ROW_RX = re.compile(
    r"^\s*\|\s*\[\[([^\[\]|]+?)(?:\|[^\]]*)?\]\]\s*"   # cell-1 = [[slug]] or [[slug|display]]
    r"\|\s*([a-z][a-z0-9-]*)\s*"                       # cell-2 = kebab-case edge-type
    r"\|(.*)\|\s*$",                                   # cell-3 = notes (any content)
    re.MULTILINE,
)


def load_thumbnail_cache():
    p = VAULT / "_assets" / "thumbs_cache.json"
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {}


def load_locations() -> dict:
    """Read 00_meta/locations.md and return {region_lowercase: (lat, lon, label)}."""
    p = VAULT / "00_meta" / "locations.md"
    if not p.exists():
        return {}
    out = {}
    in_block = False
    for line in p.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if s.startswith("```"):
            in_block = not in_block
            continue
        if not in_block:
            continue
        if not s or s.startswith("#"):
            continue
        parts = [p.strip() for p in s.split("|")]
        if len(parts) < 3:
            continue
        try:
            key = parts[0]
            lat = float(parts[1])
            lon = float(parts[2])
            label = parts[3] if len(parts) > 3 else key
            out[key.lower()] = {"lat": lat, "lon": lon, "label": label}
        except ValueError:
            continue
    return out


def geo_for_node(fm: dict, locations: dict):
    """Return {lat,lon,label} for a node based on its region or city-of-origin fields.

    Lookup cascade (first match wins, deduped against `seen`):
      1. Raw string as-is
      2. Strip trailing parenthetical: "Roman North Africa (Hippo Regius)" → "Roman North Africa"
      3. Strip leading qualifier: "narrative setting: pre-diluvian" → "pre-diluvian"
      4. Each comma/semicolon/slash/arrow chunk
      5. Last-comma chunk (country-like): "Württemberg, Germany" → "Germany"
      6. Token-level fallback (single words with len > 3)

    Improvements 2026-05-15: previously only (4) + (6) existed, hitting 67% coverage.
    Adding (1)(2)(3)(5) is meant to lift coverage past 85% without false positives.
    """
    candidates = []
    for fld in ("city-of-origin", "region"):
        v = fm.get(fld, "")
        if not (isinstance(v, str) and v.strip()):
            continue
        raw = v.strip()
        candidates.append(raw)
        # (2) drop trailing parenthetical
        no_paren = re.sub(r"\s*\([^)]*\)\s*$", "", raw).strip()
        if no_paren and no_paren != raw:
            candidates.append(no_paren)
        # (3) drop leading qualifier
        no_qual = re.sub(
            r"^\s*(narrative setting|modern|legendary|mythological|setting):\s*",
            "", raw, flags=re.I,
        ).strip()
        if no_qual and no_qual != raw:
            candidates.append(no_qual)
        # (4) chunks on common separators (incl. → for "X → Y" syncretic moves)
        chunks = re.split(r"[;,/()→]", raw)
        for ch in chunks:
            ch = ch.strip()
            if ch:
                candidates.append(ch)
        # (5) last-comma fallback (country-like)
        if "," in raw:
            last = raw.rsplit(",", 1)[-1].strip()
            if last:
                candidates.append(last)
    seen = set()
    for c in candidates:
        cl = c.lower()
        if cl in seen:
            continue
        seen.add(cl)
        if cl in locations:
            return locations[cl]
    # (6) token-level fallback — only words > 3 chars to avoid false matches on "the"/"of"
    for c in candidates:
        for token in c.split():
            tl = token.lower().strip(".,;:")
            if len(tl) > 3 and tl in locations:
                return locations[tl]
    return None


def write_high_alert_index(nodes, edges):
    """Emit `00_meta/HIGH-ALERT-INDEX.md` — the single triage surface for
    every node + edge carrying `political_risk_flag: true`. Per CODEX v1.2
    §IV.5 (the orthogonal harm-risk axis). This is the file John + agents
    `cat` to see the FULL danger list in 30 seconds instead of grep-ing
    the vault.
    """
    out_path = VAULT / "00_meta" / "HIGH-ALERT-INDEX.md"
    nodes_flagged = [n for n in nodes if n.get("political_risk_flag")]
    edges_flagged = [e for e in edges if e.get("political_risk_flag")]

    # Tier histogram so John can see at a glance whether the flag is
    # concentrated at T5 (expected) or leaking into lower tiers (worth a
    # second look).
    from collections import Counter
    node_tier_counts = Counter(n.get("source_tier", "T1") for n in nodes_flagged)
    edge_tier_counts = Counter(e.get("source_tier", "T1") for e in edges_flagged)

    lines = []
    lines.append("# HIGH-ALERT INDEX — political-risk-flagged content")
    lines.append("")
    lines.append("**Auto-generated by `build_data.py` on every run. Do NOT hand-edit.**")
    lines.append("")
    lines.append("This file lists every NODE and every EDGE in the vault that carries")
    lines.append("`political-risk-flag: true` — content with documented real-world")
    lines.append("harm-wiring per CODEX v1.2 §IV.5 (ethno-nationalist reception,")
    lines.append("antisemitic networks, racial-hierarchy mobilization).")
    lines.append("")
    lines.append("The political-risk-flag is **orthogonal to tier**. A T1 mainstream-")
    lines.append("academic claim about a politically-dangerous movement gets the flag")
    lines.append("if the *content* is harm-wired, even though the *source* is mainstream.")
    lines.append("")
    lines.append("## Triage usage")
    lines.append("")
    lines.append("- **John**: `cat 00_meta/HIGH-ALERT-INDEX.md` for the full danger list.")
    lines.append("  Decide which entries to surface / restrict / remove. Re-tier or")
    lines.append("  un-flag a node by editing its YAML; the next `python3 build_data.py`")
    lines.append("  refreshes this file.")
    lines.append("- **Agents**: must read this file BEFORE greenlighting a release,")
    lines.append("  approving any T4/T5 batch, or wiring any new edge that touches a")
    lines.append("  node already on the index (per CODEX §VI rule 9).")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append(f"- **Nodes flagged**: {len(nodes_flagged)}")
    lines.append(f"- **Edges flagged**: {len(edges_flagged)}")
    if nodes_flagged:
        tier_str = ", ".join(f"{k}: {v}" for k, v in sorted(node_tier_counts.items()))
        lines.append(f"- **Node tier histogram**: {tier_str}")
    if edges_flagged:
        tier_str = ", ".join(f"{k}: {v}" for k, v in sorted(edge_tier_counts.items()))
        lines.append(f"- **Edge tier histogram**: {tier_str}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## ⛔ NODES")
    lines.append("")
    if not nodes_flagged:
        lines.append("*(No nodes currently flagged. This means either (a) we have not yet")
        lines.append("created any high-alert content — the politics-lens / consciousness-lens")
        lines.append("batches that will surface real T5 figures are still in audit, awaiting")
        lines.append("greenlight; or (b) all currently-flagged content sits on edges, not on")
        lines.append("nodes themselves.)*")
    else:
        # Group by tier for fast visual scan.
        nodes_by_tier = {}
        for n in nodes_flagged:
            t = n.get("source_tier", "T1")
            nodes_by_tier.setdefault(t, []).append(n)
        for tier in sorted(nodes_by_tier.keys()):
            lines.append(f"### Tier {tier}")
            lines.append("")
            for n in sorted(nodes_by_tier[tier], key=lambda x: x.get("id", "")):
                nid = n.get("id", "?")
                title = n.get("title", nid)
                ntype = n.get("type", "?")
                path = n.get("path", "?")
                notes = n.get("political_risk_notes", "") or ""
                lines.append(f"- **`{nid}`** ({ntype}) — {title}")
                lines.append(f"  - path: `{path}`")
                if notes:
                    # Trim very long notes; full text remains in the file.
                    short = notes if len(notes) <= 240 else (notes[:235] + " …")
                    lines.append(f"  - rationale: {short}")
                lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## ⛔ EDGES")
    lines.append("")
    if not edges_flagged:
        lines.append("*(No edges currently flagged. T4 Sitchin batch carries no political-")
        lines.append("risk-flag because the Anunnaki=astronauts framework is pseudoarchaeology")
        lines.append("but not politically wired. The first edges to land here will be from")
        lines.append("the Politics-lens batch — Hindutva, Khomeinism, Christian")
        lines.append("Reconstructionism, Russian Orthodox-Imperialism — when those nodes are")
        lines.append("created. Currently all 5 lens proposals sit in /AUDIT/ awaiting greenlight.)*")
    else:
        edges_by_tier = {}
        for e in edges_flagged:
            t = e.get("source_tier", "T1")
            edges_by_tier.setdefault(t, []).append(e)
        for tier in sorted(edges_by_tier.keys()):
            lines.append(f"### Tier {tier}")
            lines.append("")
            for e in sorted(edges_by_tier[tier], key=lambda x: (x.get("source", ""), x.get("target", ""))):
                src = e.get("source", "?")
                tgt = e.get("target", "?")
                etype = e.get("type", "?")
                esource = e.get("edge_source", "")
                enotes = e.get("edge_notes", "")
                lines.append(f"- **`{src}`** → **`{tgt}`** *({etype})*")
                if esource:
                    short = esource if len(esource) <= 200 else (esource[:195] + " …")
                    lines.append(f"  - source: {short}")
                if enotes:
                    short = enotes if len(enotes) <= 240 else (enotes[:235] + " …")
                    lines.append(f"  - notes: {short}")
                lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## CODEX cross-reference")
    lines.append("")
    lines.append("- [CODEX §IV.5 — Two orthogonal axes](CODEX.md#iv5--tier-vs-political-risk-two-orthogonal-axes)")
    lines.append("- [CODEX §VI rule 9 — agent obligation to read this file](CODEX.md#vi-how-agents-apply-this)")
    lines.append("- [PROTOCOL §3.1 — 21-type edge vocabulary](PROTOCOL.md)")
    lines.append("")
    lines.append("*Last regenerated by `build_data.py`. To refresh: `python3 build_data.py`.*")
    lines.append("")
    out_path.write_text("\n".join(lines), encoding="utf-8")


def _attach_classification_provenance(nodes):
    """Attach source-citation provenance to each node's classification_provenance
    field, generic over any controlled-vocab field listed in the registry.

    For each controlled-vocab field a node uses, emit:
      node.classification_provenance[field] = [
        {token, display, source-tier, source, contested_rationale (if any)},
        ...
      ]

    Side-panel renderer reads this and surfaces "Categorized as X per Y"
    chips per the John 2026-06-02 directive.
    """
    import yaml as _yaml
    META = VAULT / "00_meta"

    # Load registry
    reg_path = META / "controlled-vocab-registry.yaml"
    if not reg_path.exists():
        return
    with reg_path.open() as f:
        registry = _yaml.safe_load(f) or {}
    active = (registry or {}).get("active_fields", {}) or {}

    # Load each vocab file's entries into a (field → id → entry) map
    vocab_index = {}
    for field_name, meta in active.items():
        vocab_file = meta.get("vocab_file", "")
        if not vocab_file:
            continue
        vp = VAULT / vocab_file
        if not vp.exists():
            continue
        try:
            with vp.open() as f:
                vd = _yaml.safe_load(f) or {}
            entries = vd.get("entries", []) or []
            idx = {}
            for e in entries:
                key = e.get("id") or e.get("label")
                if key:
                    idx[key] = e
            vocab_index[field_name] = idx
        except Exception:
            continue

    # Load contested-cases ratifications (single source of truth for per-node
    # overrides)
    contested = {}
    cc_path = META / "role-contested-cases-ratified-2026-05-31.yaml"
    if cc_path.exists():
        try:
            with cc_path.open() as f:
                ccd = _yaml.safe_load(f) or {}
            contested = ccd.get("contested_cases", {}) or {}
        except Exception:
            pass

    # Walk nodes, build provenance per controlled-vocab field
    JSON_FIELD_NAMES = {
        # YAML field name → JSON field name in node payload
        "role-tokens": "role_tokens",
        "tradition": "tradition",
        "polemical-framing": "polemical_framing",
        "reclaimed-self-naming": "reclaimed_self_naming",
    }

    for node in nodes:
        prov = node.get("classification_provenance") or {}
        node_id = node.get("id")
        node_contested = contested.get(node_id, {}) or {}

        for field_yaml_name, vocab_idx in vocab_index.items():
            json_field_name = JSON_FIELD_NAMES.get(field_yaml_name, field_yaml_name.replace("-", "_"))
            value = node.get(json_field_name)
            if not value:
                continue

            # Build per-value provenance entries
            entries_out = []
            if isinstance(value, list):
                # Array field — typical case (role_tokens)
                for v in value:
                    if isinstance(v, dict):
                        # Already a structured field (polemical-framing, reclaimed-self-naming)
                        # Source is already in the value — pass through as-is
                        entries_out.append({
                            "value": v.get("label") or v.get("by") or "",
                            "source-tier": v.get("source-tier", ""),
                            "source": v.get("source", ""),
                            "context": v.get("by") or v.get("direction") or v.get("tradition") or "",
                        })
                    else:
                        # Scalar in array — look up in vocab
                        vocab_entry = vocab_idx.get(v)
                        if vocab_entry:
                            entries_out.append({
                                "value": v,
                                "display": vocab_entry.get("display", v),
                                "source-tier": vocab_entry.get("source-tier", ""),
                                "source": vocab_entry.get("source", ""),
                                "secondary": vocab_entry.get("secondary", []),
                                "tier": vocab_entry.get("tier", ""),
                                "notes": vocab_entry.get("notes", ""),
                            })
                        else:
                            entries_out.append({
                                "value": v,
                                "display": v,
                                "source-tier": "",
                                "source": "(no vocab entry — needs registration)",
                            })
            elif isinstance(value, str):
                # Scalar field — typical for tradition
                vocab_entry = vocab_idx.get(value)
                if vocab_entry:
                    entries_out.append({
                        "value": value,
                        "display": vocab_entry.get("display", value),
                        "source-tier": vocab_entry.get("source-tier", ""),
                        "source": vocab_entry.get("source", ""),
                    })

            # If this node is in contested-cases for role-tokens, attach the rationale
            if field_yaml_name == "role-tokens" and node_contested:
                contested_rationale = node_contested.get("rationale", "")
                contested_source = node_contested.get("source-tier", "")
                if contested_rationale:
                    for e in entries_out:
                        e["contested_rationale"] = contested_rationale
                        e["contested_source_tier"] = contested_source

            if entries_out:
                prov[field_yaml_name] = entries_out

        if prov:
            node["classification_provenance"] = prov


def main():
    print(f"Scanning vault at {VAULT} ...")
    THUMBS = load_thumbnail_cache()
    LOCATIONS = load_locations()
    nodes_by_id = {}
    id_sources = {}  # node_id → first filepath that claimed it (for dup detection)
    counts = {k: 0 for k in NODE_DIRS}
    type_for_dir = {}
    for ntype, dirs in NODE_DIRS.items():
        for d in dirs:
            type_for_dir[d] = ntype

    for ntype, dirs in NODE_DIRS.items():
        for d in dirs:
            root = VAULT / d
            if not root.exists():
                continue
            for md in root.rglob("*.md"):
                if md.name.startswith("_"):
                    # _index.md and similar
                    continue
                # Skip per-folder READMEs (lens documentation, not
                # graph nodes). Pre-2026-05-18 lenses (03-07, 09-17)
                # had no README files, so this wasn't hit. The 10
                # lenses added in pass 2 + 3 lenses added in pass 3
                # all ship with a README.md that explains the lens
                # scope; those documentation files would otherwise
                # collide on the derived id "README".
                if md.name.lower() == "readme.md":
                    continue
                text = md.read_text(encoding="utf-8")
                fm, body = split_frontmatter(text)
                node_id = derive_id(md, fm)
                title = fm.get("title") or fm.get("name") or node_id
                phase = None
                if ntype == "document":
                    pm = re.match(r"phase-(\d+)", md.stem)
                    if pm:
                        phase = int(pm.group(1))
                trad = fm.get("tradition", "")
                # Symbols don't have a single `tradition` — they have a `families` array of
                # origin traditions. For clustering we use families[0]; the full list is
                # exposed as `symbol_families` for cross-family edge rendering downstream.
                symbol_families = []
                if ntype == "symbol":
                    raw_fams = fm.get("families") or []
                    if isinstance(raw_fams, str):
                        raw_fams = [raw_fams]
                    symbol_families = [str(f).strip() for f in raw_fams if str(f).strip()]
                    if not trad and symbol_families:
                        # Synthesize a tradition string so tradition_color() has something to chew on.
                        trad = symbol_families[0]
                fam = tradition_family(trad)
                if ntype == "symbol" and symbol_families:
                    # Prefer an explicit family-name match (these come straight from the
                    # TRADITION_FAMILY_ORDER vocabulary) so a symbol with families: ["Hindu"]
                    # lands in "Vedic" via tradition_family().
                    first = symbol_families[0]
                    if first in FAMILY_COLORS:
                        fam = first
                node = {
                    "id": node_id,
                    "type": ntype,
                    "title": title,
                    "tradition": trad,
                    "family": fam,
                    "family_color": FAMILY_COLORS[fam],
                    "tradition_color": tradition_color(trad),
                    "label": fm.get("label", ""),
                    "category": fm.get("category", ""),
                    "phase": phase,
                    # Phase B-DATING-1 → B-DATING-3 (2026-05-24) — extended
                    # coalesce per AUDIT/2026-05-24-dating-sweep-summary.md.
                    # Recovers nodes that already carry parseable dates under
                    # field names the old coalesce ignored. Order matters:
                    # composition / start / born first (B1 primary), then
                    # building / attestation / emergence (B1 primary for the
                    # entity type), then redaction / manuscript (B1/B3 last-
                    # resort), then UNDERSCORED variants (304 nodes had dates
                    # under date_earliest:, date_composed_earliest:, etc. —
                    # build was reading hyphenated only; that was a silent
                    # pipeline blind spot).
                    "date_earliest": (
                        fm.get("date-composed-earliest")
                        or fm.get("period-active-earliest")
                        or fm.get("date-start")
                        or fm.get("date-born")
                        or fm.get("period-earliest")
                        # B1 primary for non-composition entity types
                        or fm.get("date-built-earliest")
                        or fm.get("date-attested-earliest")
                        or fm.get("date-emergence")
                        or fm.get("date-emergence-earliest")
                        or fm.get("date-founded-earliest")
                        or fm.get("date-composed")
                        # Last-resort fallbacks — redaction / canonization
                        # date (still primary), oldest extant manuscript
                        # (hard lower bound on the text's existence).
                        or fm.get("date-redacted")
                        or fm.get("date-physical-mss-earliest")
                        # Phase B-DATING-3 (2026-05-24) — UNDERSCORE variants.
                        # Agent-authored content batches (music, rituals,
                        # alphabets, alchemy, …) used underscored YAML keys
                        # that didn't match the build's hyphenated lookups.
                        # 304-node recovery — pure field-rename, no inference.
                        or fm.get("date_earliest")
                        or fm.get("date_composed_earliest")
                        or fm.get("date_emergence")
                        or fm.get("date_attested_earliest")
                        or fm.get("date_built_earliest")
                        or fm.get("date_founded_earliest")
                        or fm.get("date_composed")
                        or fm.get("date_start")
                        or fm.get("date_born")
                    ),
                    "date_latest":   fm.get("date-composed-latest")   or fm.get("period-active-latest")   or fm.get("date-end")   or fm.get("date-died") or fm.get("period-latest"),
                    # Phase B-DATING-1 — dating_basis: B1..B7. Set
                    # by author for B2..B5 (with cited source). B6
                    # is auto-synthesized below (family median).
                    # B7 is the residue marker for genuinely-undatable.
                    "dating_basis":        fm.get("dating-basis") or fm.get("dating_basis"),
                    "dating_basis_source": fm.get("dating-basis-source") or fm.get("dating_basis_source"),
                    "dating_basis_notes":  fm.get("dating-basis-notes") or fm.get("dating_basis_notes"),
                    "region": fm.get("region", ""),
                    "language": fm.get("language", []),
                    "themes": fm.get("themes", []),
                    "domains": fm.get("domains", []),
                    "role": fm.get("role", ""),
                    "gender": fm.get("gender", ""),
                    "tags": fm.get("tags", []),
                    "status": fm.get("status", "stub"),
                    "refs": fm.get("refs", []),
                    # 2026-05-31 — canonical-corpus YAML migration. Each
                    # document declares its canonical corpus membership(s)
                    # in YAML (`canonical-corpus: ["bible", "tanakh"]`).
                    # mode.js filterNodesByMode('scriptures') reads this
                    # field as the AUTHORITATIVE source of "which docs
                    # are in the Codex view" — dissolves the SCRIPTURE_
                    # CORPORA-vs-vault drift that was creating endless
                    # catch-up passes. See AUDIT/2026-05-31-codex-wires-
                    # gap.md for the motivating wire-coverage problem
                    # (88.8% under the static set, 77.4% under the
                    # auto-derived union, → ≥95% under the YAML field).
                    "canonical_corpus": fm.get("canonical-corpus", []) or [],
                    # 2026-05-31 — Figures migration (v3 plan + John "go").
                    # Controlled-vocabulary primitive #1 (role-tokens) drives
                    # the Figures lens via mode.js filterNodesByMode('figures').
                    # Future controlled-vocab fields inherit this pass-through
                    # pattern via 00_meta/controlled-vocab-registry.yaml.
                    "role_tokens": fm.get("role-tokens", []) or [],
                    "role_description": fm.get("role-description", "") or fm.get("role", ""),
                    "polemical_framing": fm.get("polemical-framing", []) or [],
                    "reclaimed_self_naming": fm.get("reclaimed-self-naming", []) or [],
                    # 2026-06-02 — Provenance surfacing (John's "explicit-why-we-
                    # categorize" directive). Per-node provenance is computed
                    # post-construction by attach_classification_provenance()
                    # which reads the controlled-vocab registry + vocab files +
                    # contested-cases YAML and emits source citations per
                    # classification chip. Side-panel renderer surfaces these
                    # via renderProvenance(node, field_name) — generic over
                    # any controlled-vocab field, future-extensible.
                    "classification_provenance": {},
                    "path": str(md.relative_to(VAULT)),
                    "body": body,
                    "frontmatter": fm,
                    # 2026-05-23 — CODEX v1.2 — surface the per-NODE
                    # source-tier + political-risk-flag onto the JSON
                    # payload. These mirror what build_data already
                    # emits per-EDGE, so the Forge UI can render the
                    # ⛔ BLACK ALERT chrome on the node's own row in
                    # the side panel even when no edge happens to be
                    # the source of the political-risk wiring.
                    # `political-risk-flag` is the YAML field; some
                    # legacy nodes use the underscore variant.
                    "source_tier":          (str(fm.get("source-tier") or fm.get("source_tier") or "T1").strip() if (fm.get("source-tier") or fm.get("source_tier")) else "T1"),
                    "political_risk_flag":  bool(fm.get("political-risk-flag") or fm.get("political_risk_flag") or False),
                    "political_risk_notes": str(fm.get("political-risk-notes") or fm.get("political_risk_notes") or ""),
                }
                if ntype == "symbol":
                    # Surface the raw cross-tradition family list + mystery-status to the
                    # frontend. The Pantheon Symbols mode uses these for cross-family edges.
                    node["symbol_families"] = symbol_families
                    node["mystery_status"] = fm.get("mystery-status", "documented")
                    node["aka"] = fm.get("aka", [])
                    # Curated depictions (Wikimedia URLs + license + caption + source). When
                    # present, the side-tab renderer prefers depictions[0] over the Wikipedia-
                    # cache thumbnail — lets agents/users override the auto-fetched image
                    # without touching the cache file.
                    depictions = fm.get("depictions") or []
                    if depictions:
                        node["depictions"] = depictions
                t = THUMBS.get(node_id)
                if t:
                    node["thumbnail"] = t.get("src")
                    node["thumb_page"] = t.get("page")
                    node["thumb_title"] = t.get("title")
                    node["thumb_extract"] = t.get("extract")
                g = geo_for_node(fm, LOCATIONS)
                if g:
                    node["geo"] = g
                if node_id in nodes_by_id:
                    # Hard-fail on duplicate slug. Silent overwrites caused 8 deity nodes
                    # to disappear from the Pantheon ring (same-slug symbol/person files
                    # winning the build race). If two nodes really share a concept, give
                    # them distinct slugs with a -person/-symbol/-deity suffix and link
                    # them via syncretic-edges.
                    #
                    # TYRANT remediation Phase 2 (2026-05-25), finding #5:
                    # `ATLAS_ALLOW_DUP_ID=1` escape hatch DELETED. The pre-commit hook
                    # (scripts/git-hooks/pre-commit step #6) is the canonical gate now.
                    # If you reached THIS raise, the hook didn't run — likely a CI build
                    # or a `--no-verify` bypass. In either case, fix the slug.
                    msg = (
                        f"  ✗ DUPLICATE ID  {node_id!r}\n"
                        f"      first claimed by: {id_sources[node_id]}\n"
                        f"      overwritten by:   {md.relative_to(VAULT)}\n"
                        f"      Fix: rename one file so the two nodes have distinct slugs."
                    )
                    raise SystemExit(msg)
                else:
                    id_sources[node_id] = str(md.relative_to(VAULT))
                    counts[ntype] += 1
                nodes_by_id[node_id] = node

    edges = collect_node_edges(nodes_by_id)
    edges.extend(parse_influences_md(VAULT / "_graph" / "influences.md"))

    # dedupe edges
    seen, deduped = set(), []
    for e in edges:
        k = (e["source"], e["target"], e["type"])
        if k in seen:
            continue
        seen.add(k)
        deduped.append(e)

    nodes = list(nodes_by_id.values())

    # ── Phase B-DATING-1 (2026-05-24) — Slug-extracted year for events ──
    # Per AUDIT §8 step 3. Event nodes that carry the year in the slug
    # (event-cahokia-foundation-c-1050-ce) but have empty frontmatter
    # date fields get the year recovered here. Tags as dating_basis: B1
    # because the year is the event itself.
    _slug_recovered = 0
    for n in nodes:
        if n.get("date_earliest") is None and n.get("type") == "event":
            y = extract_year_from_slug(n.get("id", ""))
            if y is not None:
                n["date_earliest"]  = y
                n["dating_basis"]   = n.get("dating_basis") or "B1"
                n["dating_basis_notes"] = (n.get("dating_basis_notes")
                    or "year extracted from event slug (no frontmatter)")
                _slug_recovered += 1
    if _slug_recovered:
        print(f"OK  slug-extracted {_slug_recovered} event years")

    # ── Phase B-DATING-1 — B6 family-median synthesizer ──────
    # Per AUDIT §8 step 4. For nodes still undated AFTER the coalesce
    # + slug extraction, AND carrying a tradition, synthesize
    # date_earliest from the tradition's median. Soft placement —
    # marked dating_basis: B6 so the UI can render reduced-confidence
    # chrome.
    # Compute tradition medians once.
    _by_tradition_dates = {}
    for n in nodes:
        d = n.get("date_earliest")
        t = n.get("tradition")
        if d is None or t is None:
            continue
        if not isinstance(d, (int, float)):
            continue
        _by_tradition_dates.setdefault(t, []).append(d)
    _tradition_median = {}
    for t, ds in _by_tradition_dates.items():
        if len(ds) >= 3:        # require >=3 dated members for stability
            srt = sorted(ds)
            mid = len(srt) // 2
            _tradition_median[t] = srt[mid] if len(srt) % 2 else (srt[mid - 1] + srt[mid]) // 2
    _b6_recovered = 0
    for n in nodes:
        if n.get("date_earliest") is not None:
            continue
        t = n.get("tradition")
        if t and t in _tradition_median:
            n["date_earliest"]  = _tradition_median[t]
            n["dating_basis"]   = "B6"
            n["dating_basis_notes"] = (
                f"Inherited from tradition '{t}' median (c. {_tradition_median[t]}). "
                "No primary evidence in YAML; soft placement per AUDIT B-DATING-1.")
            _b6_recovered += 1
    if _b6_recovered:
        print(f"OK  B6 family-median synthesized {_b6_recovered} dates")

    # ── Phase B-DATING-1 — B7 residue marker ─────────────────
    # Anything still undated after all the above gets dating_basis: B7
    # (genuinely atemporal). The timeline UI places these in a
    # dedicated atemporal lane rather than the main spine.
    _b7_residue = 0
    for n in nodes:
        if n.get("date_earliest") is None and n.get("dating_basis") is None:
            n["dating_basis"]      = "B7"
            n["dating_basis_notes"] = (n.get("dating_basis_notes")
                or "No date evidence located + no tradition median available — atemporal.")
            _b7_residue += 1
    if _b7_residue:
        print(f"OK  marked {_b7_residue} nodes as B7 (atemporal)")

    # For nodes with explicit date_earliest but no dating_basis,
    # default to B1 (primary date). Idempotent + harmless.
    for n in nodes:
        if n.get("date_earliest") is not None and not n.get("dating_basis"):
            n["dating_basis"] = "B1"

    # strip frontmatter out of the final payload to keep file lean — keep refs separately
    for n in nodes:
        n.pop("frontmatter", None)

    # gather tradition list
    tradition_set = {}
    for n in nodes:
        t = n.get("tradition")
        if t and t not in tradition_set:
            tradition_set[t] = tradition_color(t)

    # family roll-up — used by the ring layout
    fam_members = {f: [] for f in TRADITION_FAMILY_ORDER}
    for n in nodes:
        f = n.get("family", "Other")
        fam_members.setdefault(f, []).append(n["id"])
    families = [
        {"name": f, "color": FAMILY_COLORS[f], "count": len(fam_members.get(f, []))}
        for f in TRADITION_FAMILY_ORDER if fam_members.get(f)
    ]

    # ── 2026-06-02 Provenance surfacing (John's "explicit-why-we-categorize"
    # directive). Generic over controlled-vocab fields per the §9.5
    # architectural-primitive directive. For each node with a controlled-vocab
    # field populated, attach per-token source citations + (if contested) the
    # ratification rationale. Side-panel renderer reads node.classification_
    # provenance[field_name] and surfaces source chips with tooltips.
    try:
        _attach_classification_provenance(nodes)
    except Exception as _e:
        print(f"WARN: classification provenance attachment failed: {_e}")

    out = {
        "generated_at_utc": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "counts": {
            **counts,
            "edges": len(deduped),
        },
        "nodes": nodes,
        "edges": deduped,
        "traditions": [{"name": k, "color": v} for k, v in tradition_set.items()],
        "families": families,
    }

    payload = json.dumps(out, indent=2, ensure_ascii=False)
    OUT.write_text(f"window.VAULT_DATA = {payload};\n", encoding="utf-8")
    print(f"OK  wrote {OUT}")

    # 2026-05-23 — CODEX v1.2 — emit HIGH-ALERT-INDEX.md so John + agents
    # can `cat 00_meta/HIGH-ALERT-INDEX.md` for a fast triage list of
    # every node + edge carrying `political-risk-flag: true`. Per §IV.5:
    # this file is the single triage surface for the orthogonal harm-risk
    # axis. Auto-generated on every build; do NOT hand-edit (changes will
    # be overwritten). To suppress a node from the index, fix its YAML.
    write_high_alert_index(nodes, deduped)
    print(f"OK  wrote 00_meta/HIGH-ALERT-INDEX.md")
    print(f"  documents : {counts['document']}")
    print(f"  deities   : {counts['deity']}")
    print(f"  themes    : {counts['theme']}")
    print(f"  persons   : {counts['person']}")
    print(f"  events    : {counts['event']}")
    print(f"  traditions: {counts['tradition']}")
    print(f"  symbols   : {counts.get('symbol', 0)}")
    print(f"  music     : {counts.get('music', 0)}")
    print(f"  alphabets : {counts.get('alphabet', 0)}")
    print(f"  alchemy   : {counts.get('alchemy', 0)}")
    print(f"  morals    : {counts.get('moral', 0)}")
    print(f"  rituals   : {counts.get('ritual', 0)}")
    print(f"  philosophy: {counts.get('philosophy', 0)}")
    print(f"  mathematics:{counts.get('mathematics', 0)}")
    print(f"  medicine  : {counts.get('medicine', 0)}")
    print(f"  edges     : {len(deduped)}")

if __name__ == "__main__":
    sys.exit(main())
