#!/usr/bin/env python3
"""
analyze_tradition_membership.py  — READ-ONLY Phase-0 report for the
MEMBERSHIP-VS-WIRE re-architecture (ratified 2026-06-02).

Writes NOTHING to any node. Produces a conviction-ranked TSV + a summary so
John can ratify the singular-home assignment against real numbers before any
content edit.

Model (ratified 2026-06-02):
  - Every node has ONE singular home family = its origin tradition (tier-1).
  - Cross-tradition reach = WIRES (appearance edges), tier 2 (major) / 3 (minor).
  - The `tradition:` field must become singular; appearances move to edges.

This script classifies each deity's `tradition:` field into one of:
  SINGULAR            — already one family. Fine (maybe normalize label).
  MULTI_SAME_FAMILY   — slash/synonym cluster, all components -> ONE family
                        (e.g. "Sumerian / Akkadian" -> Mesopotamian). Trivial
                        lock: collapse label, no wires needed.
  MULTI_CROSS_FAMILY  — components map to DIFFERENT families. REAL cross-
                        tradition. Origin = first/earliest component's family;
                        the rest become appearance-wires. Conviction depends
                        on whether the origin component is unambiguous.

Usage:  python3 scripts/analyze_tradition_membership.py [03_deities | 04_persons]
"""
import sys, re, glob, os, unicodedata
from collections import Counter

def strip_diacritics(s: str) -> str:
    """Macron/diacritic-insensitive matching: Māori->maori, Mahāyāna->mahayana."""
    return "".join(c for c in unicodedata.normalize("NFKD", s)
                   if not unicodedata.combining(c))

FOLDER = sys.argv[1] if len(sys.argv) > 1 else "03_deities"

# ---------------------------------------------------------------------------
# Component -> family map. Applied PER-COMPONENT (after splitting the field),
# which is the correct approach the old order-dependent tradition_family() pile
# could not take because it saw the whole polluted string at once.
# Keyword -> canonical family. First match wins within a component.
# ---------------------------------------------------------------------------
FAMILY_RULES = [
    # (regex keyword, family)
    (r"tewahedo|ethiopian orthodox|coptic|armenian.?apostolic|byzantine|patristic|"
     r"catholic|anglican|lutheran|calvinist|protestant|orthodox christ|christianit|"
     r"\bchristian\b|mormon|latter.?day|modalist|monarchian|jesuit|society of jesus|"
     r"ressourcement|order of christ|methodist|baptist|pentecostal|adventist|"
     r"nicene|arian|donatist|montanist|nestorian|miaphysite", "Christian"),
    (r"gnostic|sethian|valentinian|thomasine|cathar|bogomil", "Gnostic"),
    (r"mandae", "Mandaean"),
    (r"manichae", "Manichaean"),
    (r"hermetic|hermetism|trismegist", "Hermetic"),
    (r"neoplaton|plotin|iambl|procl", "Neoplatonist"),
    (r"kabbal|hasid|rabbinic|mishnah|talmud|midrash|merkavah|hekhalot|sabbatean|frankist", "Rabbinic"),
    (r"second.?temple|enochic|hebrew|israel|jewish|judaism|qumran|essene|"
     r"judahite|pre.?monarchic|samaritan|deuteronom", "Israelite"),
    (r"canaan|ugarit|phoenic|punic|philistine|northwest semitic|west.?semitic|levantine", "Canaanite"),
    (r"zoroastr|avest|mazdean|pahlavi|zurvan", "Zoroastrian"),
    # Pre-Islamic-Arabian BEFORE Islamic so "Pre-Islamic Arabian" doesn't fire Islamic.
    (r"pre-islamic|arabian poly|south arabian|minaean|nabataean|sabaean|"
     r"\bhubal\b|\ballat\b|al-?uzza|\bmanat\b", "Pre-Islamic-Arabian"),
    (r"islam|qur|sunni|shi.?[aʿ]|sufi|muslim|falsafa|kalam|mu.?tazil|ash.?ari", "Islamic"),
    (r"sumerian|akkadian|babylonian|assyrian|mesopotam|elamite", "Mesopotamian"),
    (r"phrygian|cybele|galli\b|metroac", "Phrygian"),
    (r"hittite|hurrian|luwian|hattic|anatolian", "Hittite"),
    (r"egyptian|amarna|ptolema|kemetic", "Egyptian"),
    (r"vedic|hindu|puranic|tantric|shaiva|vaishnav|shakta|brahman|advaita|vedanta|"
     r"samkhya|yoga|nyaya|mimamsa|smarta|bhakti", "Vedic-Hindu"),
    (r"buddh|mahayana|theravada|vajrayana|zen|pure land|tibetan|chan\b|nichiren", "Buddhist"),
    (r"jain", "Jain"),
    (r"sikh", "Sikh"),
    (r"shinto|\bkami\b|japanese", "Shinto"),
    (r"daois|taois|confucian|chinese", "Chinese"),
    (r"korean|muism|cheondo|donghak", "Korean"),
    (r"yoruba|ifa|vodun|vodou|santeria|candomble|lukumi|orisha|orisa|fon\b", "Yoruba-Diaspora"),
    (r"\bakan\b|bantu|dahomey|maasai|zulu|san religion|african|dogon|igbo|"
     r"\bewe\b|ashanti|kongo", "African"),
    (r"aksumite|kebra", "Aksumite"),
    (r"norse|germanic|icelandic|viking|asatru|anglo-saxon", "Norse"),
    (r"celtic|druid|gaelic|irish|welsh|gaulish|breton|lusitanian|iberian|gallaecian", "Celtic"),
    (r"baltic|latvian|lithuanian|prussian pagan", "Baltic"),
    (r"slavic|finnic|finnish|karelian|sami|kalevala", "Slavic-Finnic"),
    (r"roman religion|italic|\broman\b", "Roman"),
    (r"etruscan", "Etruscan"),
    (r"mystery|mithra|orphic|eleusin|bacchic|dionysiac cult", "Mystery"),
    (r"greek|hellenis|hellenic|greco-roman|graeco-roman|platonis|middle platon|"
     r"stoic|aristot|pythagor|epicurean|cynic|peripatet|sophist", "Greek"),
    (r"nahua|aztec|mexica|toltec", "Nahua-Aztec"),
    (r"maya", "Maya"),
    (r"inca|andean|quechua|aymara", "Andean"),
    (r"din[eé]|navajo|hopi|lakota|haudenosaunee|iroquois|pueblo|zuni|"
     r"native american|first nations|tsimshian|inuit", "Indigenous-N-American"),
    (r"maori|polynesi|hawaiian|samoan|tongan", "Polynesian"),
    (r"aboriginal|dreamtime", "Aboriginal-Australian"),
    (r"theosoph|anthroposoph|new age|wicca|neopagan|thelema|occult|rosicrucian|"
     r"freemason|satanism|blakean", "Modern-Esoteric"),
    (r"comparative.religion|history of religions|religious studies|"
     r"phenomenology of religion|academic|early modern science|classical historian", "Academic"),
    (r"literary|literature|epic poetry|romance tradition", "Literary"),
]

SPLIT_RE = re.compile(r"\s*(?:;|/|→|->|\band\b|\bvs\.?\b|\|)\s*")
# strip parenthetical context + "canonical in [[..]]" appearance-annotations
CANON_IN_RE = re.compile(r"(?:canonical|liturgically retained|scripture|attested|received)\s+in\s+\[\[[^\]]*\]\]", re.I)
WIKILINK_RE = re.compile(r"\[\[([^|\]]+)(?:\|[^\]]+)?\]\]")
PAREN_RE = re.compile(r"\([^)]*\)")

def family_of(component: str):
    s = strip_diacritics(component).lower()
    # "pre-Christian X" / "post-Christian X" name the SUBSTRATE (X), not Christianity.
    # Strip the temporal-prefix religion-word so it can't false-match its family rule.
    # (pre-exilic / pre-monarchic stay — they DO denote Israelite history.)
    s = re.sub(r"\bpre-?christian\b|\bpost-?christian\b|\bpre-?roman\b", " ", s)
    for pat, fam in FAMILY_RULES:
        if re.search(pat, s):
            return fam
    return None  # unknown

def parse_tradition(raw: str):
    """Return (components, families_set, appearance_annotations)."""
    appearances = CANON_IN_RE.findall(raw)
    txt = CANON_IN_RE.sub("", raw)
    txt = WIKILINK_RE.sub(r"\1", txt)
    txt = PAREN_RE.sub("", txt)
    comps = [c.strip(" \"'") for c in SPLIT_RE.split(txt) if c.strip(" \"'")]
    fams = []
    for c in comps:
        f = family_of(c)
        fams.append((c, f))
    return comps, fams, appearances

def get_field(text, field):
    m = re.search(rf"^{field}:\s*(.+)$", text, re.M)
    if not m:
        return ""
    return m.group(1).strip().strip("\"'")

rows = []
cls_counter = Counter()
unknown_components = Counter()

for path in sorted(glob.glob(os.path.join(FOLDER, "*.md"))):
    text = open(path, encoding="utf-8").read()
    raw = get_field(text, "tradition")
    if not raw:
        cls_counter["NO_TRADITION"] += 1
        rows.append((os.path.basename(path), "NO_TRADITION", "", "", "", ""))
        continue
    comps, fams, appearances = parse_tradition(raw)
    fam_values = [f for (_, f) in fams]
    distinct = [f for f in dict.fromkeys(fam_values) if f]
    unknowns = [c for (c, f) in fams if f is None]
    for u in unknowns:
        unknown_components[u] += 1

    if len(comps) <= 1 and not appearances:
        cls = "SINGULAR"
        origin = distinct[0] if distinct else "UNKNOWN"
        conviction = "HIGH" if distinct else "REVIEW"
    elif len(distinct) <= 1:
        cls = "MULTI_SAME_FAMILY"
        origin = distinct[0] if distinct else "UNKNOWN"
        conviction = "HIGH" if distinct else "REVIEW"
    else:
        cls = "MULTI_CROSS_FAMILY"
        origin = distinct[0]  # first-listed component's family = origin candidate
        # conviction: HIGH if the field clearly orders origin first via ; or arrow,
        # and remaining are reception markers; MEDIUM otherwise.
        ordered = bool(re.search(r"→|->|;", raw)) or bool(appearances)
        conviction = "HIGH" if (ordered and not unknowns) else "MEDIUM"
    if unknowns and cls != "MULTI_CROSS_FAMILY":
        conviction = "REVIEW"
    cls_counter[cls] += 1
    appearance_str = " | ".join(distinct[1:] + [f"received-in:{a}" for a in appearances])
    rows.append((os.path.basename(path), cls, conviction, origin, appearance_str, raw))

# ---- output ----
out = os.path.join("AUDIT", f"2026-06-02-tradition-membership-{os.path.basename(FOLDER)}.tsv")
with open(out, "w", encoding="utf-8") as f:
    f.write("file\tclass\tconviction\torigin_family\tappearances\traw_tradition\n")
    for r in rows:
        f.write("\t".join(r) + "\n")

total = sum(cls_counter.values())
print(f"=== {FOLDER}  ({total} nodes) ===")
for cls in ["SINGULAR", "MULTI_SAME_FAMILY", "MULTI_CROSS_FAMILY", "NO_TRADITION"]:
    print(f"  {cls:20s} {cls_counter.get(cls,0)}")
print()
conv = Counter(r[2] for r in rows if r[1] in ("MULTI_CROSS_FAMILY",))
print("  MULTI_CROSS_FAMILY conviction split:")
for c in ["HIGH", "MEDIUM", "REVIEW"]:
    print(f"    {c:8s} {conv.get(c,0)}")
print()
if unknown_components:
    print("  Top unmapped components (need a FAMILY_RULES entry or REVIEW):")
    for comp, n in unknown_components.most_common(20):
        print(f"    {n:3d}  {comp!r}")
print(f"\nWrote {out}")
