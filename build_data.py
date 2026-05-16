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
    "document": ["02_documents"],
    "deity":    ["03_deities"],
    "person":   ["04_persons"],
    "event":    ["05_events"],
    "theme":    ["06_themes"],
    "tradition":["07_traditions"],
    "symbol":   ["09_symbols"],
    "music":    ["10_music"],
}

# ---------- minimal YAML parser tailored to our schema ----------

def _strip_inline(v: str):
    """Coerce a YAML scalar to a Python value."""
    v = v.strip()
    if v == "" or v == "~" or v.lower() == "null":
        return ""
    if v == "[]":
        return []
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
    "Canaanite",
    "Israelite",
    "Rabbinic",
    "Zoroastrian",
    # Indic / East Asian
    "Vedic",
    "Buddhist",
    "Chinese",
    # African / Egyptian
    "Egyptian",
    "African",
    # Greco-Roman / Mediterranean
    "Hermetic",
    "Mystery",
    "Greek",
    "Roman",
    "Celtic",
    "Norse",
    "Slavic-Finnic",
    # Late-antique sectarian cluster
    "Christian",
    "Gnostic",
    "Neoplatonist",
    "Manichaean",
    "Mandaean",
    # Islamic
    "Islamic",
    # New World / Pacific (geographic cluster)
    "Mesoamerican",
    "Andean",
    "Native-American",
    "Pacific",
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
    "Vedic":            "#e08a3a",
    "Buddhist":         "#c4a05a",
    "Chinese":          "#5a9a8f",
    "Egyptian":         "#d4a55a",
    "African":          "#b86a3a",
    "Hermetic":         "#a8a3b8",
    "Mystery":          "#a85a8a",
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
    "Islamic":          "#3a8a6a",
    "Mesoamerican":     "#9a4a3a",
    "Andean":           "#a07050",
    "Native-American":  "#8a6a4a",
    "Pacific":          "#3a8aa4",
    "Modern-Esoteric":  "#9a7ac4",
    "Academic":         "#6a7a8a",
    "Other":            "#7a8090",
}

def tradition_family(t: str) -> str:
    if not t:
        return "Other"
    s = t.lower()
    # ORDER matters here — most specific tests first.
    if "gnostic" in s or "sethian" in s or "valentinian" in s or "thomasine" in s:
        return "Gnostic"
    if "mandae" in s:
        return "Mandaean"
    if "manichae" in s:
        return "Manichaean"
    if "neoplaton" in s or "plotin" in s or "iambl" in s or "procl" in s:
        return "Neoplatonist"
    if "hermetic" in s or "hermetism" in s:
        return "Hermetic"
    if "mystery" in s or "mithra" in s or "orphic" in s or "eleusin" in s or "phrygian" in s or "bacchic" in s:
        return "Mystery"
    if "christian" in s or "christianity" in s or "patristic" in s or "coptic" in s or "byzantine" in s or "lutheran" in s or "calvinist" in s or "reformed" in s or "protestant" in s or "catholic" in s or "anglican" in s or "rosicrucian" in s or "freemason" in s or "mormon" in s or "baha" in s or "scientology" in s or "spiritualist" in s or "new age" in s or "wicca" in s or "rastafari" in s:
        return "Christian"
    if "rabbinic" in s or "mishnah" in s or "talmud" in s or "midrash" in s or "kabbal" in s or "hasidic" in s or "hasidism" in s or "merkavah" in s or "hekhalot" in s or "sabbatean" in s or "frankist" in s:
        return "Rabbinic"
    if "islam" in s or "qur" in s or "sufi" in s or "shia" in s or "shi'a" in s or "ismaili" in s or "alevi" in s or "druze" in s or "yazidi" in s or "muslim" in s:
        return "Islamic"
    if "buddh" in s or "theravada" in s or "mahayana" in s or "zen" in s or "chan" in s or "vajra" in s or "tantric buddh" in s or "pure land" in s or "dzogchen" in s or "bon" in s:
        return "Buddhist"
    if "sikh" in s or "vedic" in s or "hindu" in s or "upanish" in s or "brahman" in s or "tantric" in s or "vaishnav" in s or "shakta" in s or "shaiv" in s or "bhakti" in s or "vedanta" in s or "jain" in s or "hindutva" in s:
        return "Vedic"
    if "zoroastr" in s or "avesta" in s or "iranian" in s or "ahura" in s:
        return "Zoroastrian"
    if "canaan" in s or "ugarit" in s or "philistine" in s or "phoenic" in s or "northwest semitic" in s:
        return "Canaanite"
    if "israel" in s or "hebrew" in s or "jewish" in s or "judaism" in s or "second temple" in s or "qumran" in s or "essene" in s:
        return "Israelite"
    if "sumerian" in s or "akkadian" in s or "babylonian" in s or "assyrian" in s or "mesopotam" in s or "elamite" in s or "hittite" in s:
        return "Mesopotamian"
    if "egyptian" in s or "amarna" in s or "ptolema" in s or "kemetic" in s:
        return "Egyptian"
    if "yoruba" in s or "ifa" in s or "vodun" in s or "vodou" in s or "santeria" in s or "candomble" in s or "akan" in s or "bantu" in s or "ethiopian" in s or "kebra" in s or "african" in s or "san" in s or "maasai" in s or "dahomey" in s:
        return "African"
    if "celtic" in s or "druid" in s or "gaelic" in s or "irish" in s or "welsh" in s or "gaulish" in s:
        return "Celtic"
    if "norse" in s or "germanic" in s or "icelandic" in s or "viking" in s or "asatru" in s or "anglo-saxon" in s:
        return "Norse"
    if "slavic" in s or "finnic" in s or "finnish" in s or "karelian" in s or "sami" in s or "kalevala" in s:
        return "Slavic-Finnic"
    if "greek" in s or "hellenistic" in s or "platonist" in s or "stoic" in s or "aristot" in s or "pythagor" in s or "epicurean" in s or "cynic" in s or "skeptic" in s:
        return "Greek"
    if "roman" in s:
        return "Roman"
    if "chinese" in s or "confucian" in s or "daoist" in s or "taoist" in s or "shang" in s or "zhou" in s or "shinto" in s or "japanese" in s or "korean" in s:
        return "Chinese"
    if "aztec" in s or "mexica" in s or "nahuatl" in s or "maya" in s or "mayan" in s or "olmec" in s or "toltec" in s or "zapotec" in s or "mixtec" in s or "mesoamerican" in s:
        return "Mesoamerican"
    if "inca" in s or "andean" in s or "quechua" in s or "aymara" in s or "moche" in s:
        return "Andean"
    if "lakota" in s or "iroquois" in s or "navajo" in s or "hopi" in s or "cherokee" in s or "algonqu" in s or "native american" in s or "first nations" in s or "anishin" in s or "pueblo" in s:
        return "Native-American"
    if "polynesian" in s or "maori" in s or "hawaiian" in s or "samoan" in s or "tongan" in s or "aboriginal" in s or "australian" in s or "torres" in s or "papuan" in s or "melanesian" in s or "pacific" in s:
        return "Pacific"
    if "theosoph" in s or "anthroposoph" in s or "thelem" in s or "rosic" in s or "occult" in s or "gurdj" in s or "esoteric" in s:
        return "Modern-Esoteric"
    if "academic" in s or "comparative religion" in s or "jungian" in s or "religionsgeschichtl" in s or "phenomenology of religion" in s:
        return "Academic"
    return "Other"


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
                    })
        # syncretic-edges has a structured form
        sync = fm.get("syncretic-edges")
        if isinstance(sync, list):
            for s in sync:
                if isinstance(s, dict) and s.get("target"):
                    for target in wikilinks(s["target"]):
                        edges.append({
                            "source": node_id,
                            "target": target,
                            "type": "syncretic-" + (s.get("type") or "identification"),
                            "field": "syncretic-edges",
                        })
        # cross-symbol-edges — structured form on 09_symbols/ nodes. Edge type is taken
        # verbatim from each entry's `type` field (ancestor-of, parallel-form,
        # syncretic-fusion, appropriated-by, polemic-inversion, visual-cognate).
        # The target field can be either a bare slug or a [[wikilink]].
        xsym = fm.get("cross-symbol-edges")
        if isinstance(xsym, list):
            for s in xsym:
                if not isinstance(s, dict) or not s.get("target"):
                    continue
                etype = (s.get("type") or "visual-cognate").strip()
                target_raw = str(s["target"]).strip()
                # accept either "[[slug]]" or bare "slug"
                targets = list(wikilinks(target_raw)) or [target_raw.lstrip("[").rstrip("]")]
                for target in targets:
                    target = target.strip()
                    if not target or target == node_id:
                        continue
                    edges.append({
                        "source": node_id,
                        "target": target,
                        "type": etype,
                        "field": "cross-symbol-edges",
                    })
        # cross-music-edges — same structured form for 10_music/ nodes.
        xmus = fm.get("cross-music-edges")
        if isinstance(xmus, list):
            for s in xmus:
                if not isinstance(s, dict) or not s.get("target"):
                    continue
                etype = (s.get("type") or "parallel-form").strip()
                target_raw = str(s["target"]).strip()
                targets = list(wikilinks(target_raw)) or [target_raw.lstrip("[").rstrip("]")]
                for target in targets:
                    target = target.strip()
                    if not target or target == node_id:
                        continue
                    edges.append({
                        "source": node_id,
                        "target": target,
                        "type": etype,
                        "field": "cross-music-edges",
                    })
    return edges


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
                    "date_earliest": fm.get("date-composed-earliest") or fm.get("period-active-earliest") or fm.get("date-start") or fm.get("date-born") or fm.get("period-earliest"),
                    "date_latest":   fm.get("date-composed-latest")   or fm.get("period-active-latest")   or fm.get("date-end")   or fm.get("date-died") or fm.get("period-latest"),
                    "region": fm.get("region", ""),
                    "language": fm.get("language", []),
                    "themes": fm.get("themes", []),
                    "domains": fm.get("domains", []),
                    "role": fm.get("role", ""),
                    "gender": fm.get("gender", ""),
                    "tags": fm.get("tags", []),
                    "status": fm.get("status", "stub"),
                    "refs": fm.get("refs", []),
                    "path": str(md.relative_to(VAULT)),
                    "body": body,
                    "frontmatter": fm,
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
                    print(f"  ⚠ DUPLICATE ID  {node_id!r}  — {md.relative_to(VAULT)} overwrites {id_sources[node_id]}")
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
    print(f"  documents : {counts['document']}")
    print(f"  deities   : {counts['deity']}")
    print(f"  themes    : {counts['theme']}")
    print(f"  persons   : {counts['person']}")
    print(f"  events    : {counts['event']}")
    print(f"  traditions: {counts['tradition']}")
    print(f"  symbols   : {counts.get('symbol', 0)}")
    print(f"  music     : {counts.get('music', 0)}")
    print(f"  edges     : {len(deduped)}")

if __name__ == "__main__":
    sys.exit(main())
