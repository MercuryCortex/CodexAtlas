#!/usr/bin/env python3
"""
migrate_canonical_corpus.py

Stage 2+3 of the canonical-corpus YAML migration. For every document file
in 02_documents/, determine which corpus(es) it belongs to and add a
`canonical-corpus: [...]` line to its YAML frontmatter.

INPUTS:
  /tmp/scripture-corpora-dump.json  — produced by dump_scripture_corpora.js;
                                       contains the (book_id → corpus_key) map.

LOGIC:
  1. Build book_id → [corpus_keys] from the dump (preserving multi-corpus).
  2. For each doc file:
     a. If doc_id is in the map → use those keys (canonical, high confidence)
     b. Else → infer from tradition/sub-tradition via SUBTRAD_TO_CORPUS table.
     c. If neither matches → flag as "unmapped" for review.
  3. Apply the field idempotently:
     - Field placement: after `tradition:`, before `region:` if present, else
       after `tradition:`.
     - If existing canonical-corpus value matches: skip.
     - If exists but differs: --force flag required (default: skip + flag).
     - If absent: write the new line.

USAGE:
  python3 scripts/migrate_canonical_corpus.py            # dry-run, prints summary
  python3 scripts/migrate_canonical_corpus.py --apply    # actually writes
  python3 scripts/migrate_canonical_corpus.py --report   # write TSV report only
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
DOC_DIR = VAULT / "02_documents"
DUMP = Path("/tmp/scripture-corpora-dump.json")
REPORT_OUT = VAULT / "AUDIT" / "2026-05-31-canonical-corpus-migration-table.tsv"


# ─── Sub-tradition → corpus-key inference (used only for docs NOT already
#     in SCRIPTURE_CORPORA). Each pattern → list of corpus keys.
#     Order matters: first regex match wins for primary; multiple-match
#     emits multiple corpus keys. ──────────────────────────────────────
SUBTRAD_INFERENCE = [
    # (pattern, [corpus_keys], note)
    (r"\bEgyptian|Kemet|Pharaonic|Memphite|Theban|Heliopolit|Saqqara|Alexandria.*Egypt", ["egyptian-scripture"], "Egyptian"),
    (r"Mesopotam|Sumer|Akkad|Babylon|Assyr|Old Babylon|Marduk|Ningirsu|Nippur|Ur III|Lagash|scribal", ["mesopotamian-canonical"], "Mesopotamian"),
    (r"Confucia|Five Classics|Four Books|Neo-Confucian|Zhu Xi", ["confucian-classics"], "Confucian"),
    (r"Athenian dramatic|Greek tragedy|Aeschylus|Sophocles|Euripides", ["greek-scripture"], "Greek tragedy"),
    (r"Stoic|Old, Middle, and Roman Stoa|Chrysippus", ["greek-philosophical-scripture"], "Stoic"),
    (r"Middle Platonist|Hellenistic Judais|Alexandrian allegor|Philo", ["greek-philosophical-scripture", "hellenistic-jewish"], "Hellenistic-Jewish"),
    (r"Neoplaton|Plotinus|Porphyr|Iamblich|Proclus|Damascius", ["greek-philosophical-scripture", "neoplatonic"], "Neoplatonic"),
    (r"Post-Temple.*Jewish apocalyptic|Apocalypse of Ezra|4 Ezra", ["hellenistic-jewish", "tewahedo"], "Jewish apocalyptic"),
    (r"Greco-Roman historiograph|Hellenistic-Jewish apologetic|Josephus", ["hellenistic-jewish"], "Josephus"),
    (r"Latin epic|Roman religion|Ovid|Virgil|Lucretius", ["roman-scripture"], "Latin/Roman"),
    (r"Early Church canon formation", ["bible", "patristic-corpus"], "Patristic"),
    (r"Pseudo-Dionysian", ["patristic-corpus", "christian-mystical"], "Pseudo-Dionysian"),
    (r"Carolingian|Christian Platonist", ["patristic-corpus", "christian-mystical"], "Eriugena"),
    (r"Geonic|Kal[āa]m-influenced rationalist|Saadia", ["jewish-medieval-thought"], "Saadia"),
    (r"Jewish Aristotelianism|Maimonides", ["jewish-medieval-thought"], "Maimonides"),
    (r"apophatic-mystical|Free-Spirit|Marguerite Porete|Mirror of Simple", ["christian-mystical"], "Free-Spirit mystics"),
    (r"Medieval Hebrew chronicle|Yosippon|Ethiopian recension", ["tewahedo"], "Yosippon"),
    (r"Florentine Platonic|Ficino", ["renaissance-esotericism"], "Ficino"),
    (r"Lutheran|Luther 95 Theses|Protestant.*foundational", ["protestant-foundational"], "Luther"),
    (r"Brunian|Bruno", ["renaissance-esotericism"], "Bruno"),
    (r"Boehmian theosophy|Boehme", ["renaissance-esotericism", "western-occult-modern"], "Boehme"),
    (r"Safed-school|Cordoveran|Cordovero", ["kabbalah"], "Cordovero"),
    (r"Lurianic|Vital.*Etz", ["kabbalah"], "Lurianic"),
    (r"Lullism|Llull", ["christian-mystical", "renaissance-esotericism"], "Lullism"),
    (r"Portuguese vernacular prophetic|Bandarra|Sebastianist", ["portuguese-hermetic"], "Bandarra"),
    (r"Portuguese Renaissance epic|Camões", ["portuguese-hermetic"], "Camões"),
    (r"Sebastianist-Hermetic-Rosicrucian|Pessoa", ["portuguese-hermetic"], "Pessoa"),
    (r"Guénonian Traditionalism", ["traditionalist-school"], "Guénon"),
    (r"21st-c. Portuguese hermetic", ["portuguese-hermetic"], "Gandra"),
    (r"American pragmatism|James.*religion|Varieties of Religious", ["comparative-religion-academic"], "James"),
    (r"Hyperdiffusionism|Donnelly|Cayce|Hancock|lost-civilization", ["lost-civilization-corpus"], "Lost-civilization"),
    (r"Bahá'í.*Baghdad mystical|Bahai Hidden Words|baghdadi mystical", ["bahai-scripture"], "Bahá'í Hidden Words"),
    # ── Modern religious-studies scholarship (Group B from audit doc) ──
    (r"Evolutionist-ritualist comparative religion|Cambridge Ritualists|Golden Bough|Frazer", ["comparative-religion-academic"], "Frazer"),
    (r"Durkheimian sociology", ["comparative-religion-academic"], "Durkheim"),
    (r"Phenomenology of religion(?!.*Eliade)", ["comparative-religion-academic"], "Otto"),
    (r"Foundational text of academic Kabbalah|Scholem|Major Trends.*Jewish Mysticism", ["comparative-religion-academic", "kabbalah"], "Scholem"),
    (r"Existentialist phenomenology of Gnosticism|Jonas", ["comparative-religion-academic", "gnostic-scripture"], "Jonas"),
    (r"Nag Hammadi reception|Gospel of Thomas.*reception|Pagels", ["comparative-religion-academic", "gnostic-scripture"], "Pagels"),
    (r"Jung", ["comparative-religion-academic", "western-occult-modern"], "Jung"),
    (r"Eliadean phenomenology", ["comparative-religion-academic"], "Eliade"),
    (r"Warburg Institute|Yates", ["comparative-religion-academic", "renaissance-esotericism"], "Yates"),
    # ── Christian / Hebrew Bible orphans (legacy stub schema) ──
    (r"protestantism|Paradise Lost", ["protestant-foundational"], "Milton"),
]


# ─── Explicit slug overrides for docs with empty/insufficient YAML tags.
#     Used as the FINAL pass after SCRIPTURE_CORPORA lookup + sub-tradition
#     inference. Each entry: doc_id → [corpus_keys]. Add new entries here
#     when a doc falls through the dry-run "unmapped" list. ────────────
SLUG_OVERRIDES = {
    # Egyptian
    "phase-1-035-wadi-el-jarf-papyri":          ["egyptian-scripture"],
    "phase-1-008-shabaka-stone":                ["egyptian-scripture"],
    # Greek epic / hymns / tragedy / philosophy
    "phase-2-001-iliad":                        ["greek-scripture"],
    "phase-3-035-homeric-hymns":                ["greek-scripture"],
    "phase-3-014-enneads-plotinus":             ["greek-philosophical-scripture", "neoplatonic"],
    "phase-4-039-celsus-true-word":             ["greek-philosophical-scripture"],
    "phase-2-045-hippocratic-corpus":           ["greek-medical-corpus"],
    # Buddhist
    "phase-2-005-dhammapada":                   ["tipitaka"],
    "phase-2-067-lotus-sutra-saddharmapundarika": ["mahayana-corpus"],
    "mahavamsa":                                ["tipitaka", "buddhist-pilgrimage-chronicles"],
    "great-tang-records-on-the-western-regions": ["buddhist-pilgrimage-chronicles"],
    "ajanta-inscriptions":                      ["buddhist-pilgrimage-chronicles"],
    "ellora-inscriptions":                      ["buddhist-pilgrimage-chronicles"],
    "bagan-stone-inscriptions":                 ["buddhist-pilgrimage-chronicles"],
    "longmen-inscriptions":                     ["buddhist-pilgrimage-chronicles"],
    "karangtengah-inscription-824":             ["buddhist-pilgrimage-chronicles"],
    "dunhuang-manuscripts":                     ["buddhist-pilgrimage-chronicles"],
    # Chinese (Confucian / Daoist / legal / medical)
    "phase-2-046-huangdi-neijing":              ["daoist-medical-corpus"],
    "phase-3-037-shennong-bencao-jing":         ["daoist-medical-corpus"],
    "zhou-li":                                  ["confucian-classics"],
    "da-ming-huidian":                          ["confucian-classics"],
    "da-qing-huidian":                          ["confucian-classics"],
    "ying-zao-fa-shi":                          ["confucian-classics"],
    # Hindu / Tamil / Ayurveda
    "phase-3-036-charaka-samhita":              ["ayurveda-corpus"],
    "silappatikaram":                           ["tamil-shaiva-corpus"],
    "tiruvilaiyadal-puranam":                   ["tamil-shaiva-corpus"],
    "surya-shataka":                            ["hindu-stotra-corpus"],
    "vishnu-sahasranama":                       ["hindu-stotra-corpus"],
    "shilpa-shastra":                           ["hindu-architectural-corpus"],
    "vastu-shastra":                            ["hindu-architectural-corpus"],
    "madala-panji":                             ["jagannath-corpus"],
    "rajaraja-i-thanjavur-inscriptions":        ["tamil-shaiva-corpus"],
    # Korean
    "samguk-sagi":                              ["korean-historical-corpus"],
    "samguk-yusa":                              ["korean-historical-corpus"],
    "gukjo-orye-ui":                            ["korean-ritual-corpus"],
    # Japanese
    "heike-monogatari":                         ["japanese-historical-corpus"],
    "izumo-no-kuni-fudoki":                     ["kojiki-nihongi"],
    # Mayan / Mesoamerican inscriptions + Spanish chronicles
    "lintel-3-temple-i":                        ["maya-corpus"],
    "stela-16-tikal":                           ["maya-corpus"],
    "palenque-tablet-of-the-cross":             ["maya-corpus"],
    "palenque-tablet-of-the-foliated-cross":    ["maya-corpus"],
    "palenque-tablet-of-the-sun":               ["maya-corpus"],
    "codex-mendoza":                            ["aztec-corpus"],
    "florentine-codex":                         ["aztec-corpus"],
    "duran-historia-de-las-indias-de-nueva-espana": ["aztec-corpus"],
    "landa-relacion-de-las-cosas-de-yucatan":   ["maya-corpus"],
    # Andean
    "cobo-historia-del-nuevo-mundo":            ["andean-chronicles-corpus"],
    "garcilaso-de-la-vega-comentarios-reales-de-los-incas": ["andean-chronicles-corpus"],
    # Roman / Latin imperial
    "phase-3-024-suetonius-twelve-caesars":     ["roman-scripture"],
    "phase-3-097-res-gestae-divi-augusti":      ["roman-scripture"],
    "plutarch-life-of-pericles":                ["greek-scripture", "roman-scripture"],
    "cassius-dio-roman-history-69":             ["roman-scripture"],
    "phase-4-040-pliny-trajan-correspondence":  ["roman-scripture"],
    "magna-carta":                              ["medieval-legal-corpus"],
    # Christian / Byzantine / Syriac / Ethiopian
    "phase-3-096-baruch":                       ["bible", "tewahedo"],
    "document-1-kings":                         ["bible", "tanakh"],
    "document-2-chronicles":                    ["bible", "tanakh"],
    "procopius-de-aedificiis":                  ["byzantine-corpus"],
    "codex-syriacus-sinaiticus":                ["syriac-christian-corpus"],
    "sinai-library-corpus":                     ["syriac-christian-corpus"],
    "liber-pontificalis":                       ["patristic-corpus"],
    "gadla-lalibela":                           ["tewahedo"],
    "phase-5-017-peter-lombard-sentences":      ["scholastic-corpus"],
    "phase-5-021-cusa-de-docta-ignorantia":     ["christian-mystical", "renaissance-esotericism"],
    "phase-5-035-physiologus":                  ["patristic-corpus", "christian-bestiary"],
    # Templar
    "phase-5-036-rule-of-templars-latin":       ["templar-corpus"],
    "phase-5-037-bernard-de-laude-novae-militiae": ["templar-corpus"],
    "phase-5-038-chinon-parchment-1308":        ["templar-corpus"],
    # Islamic
    "phase-5-063-avicenna-canon-of-medicine":   ["islamic-philosophical", "islamic-medical-corpus"],
    # Esoteric / Voynich
    "phase-6-037-voynich-manuscript":           ["western-occult-modern"],
    # Modern academic religious-studies (Group B)
    "phase-7-013-eliade-myth-of-eternal-return": ["comparative-religion-academic"],
    "phase-7-014-bellah-civil-religion-essay":  ["comparative-religion-academic"],
    "phase-7-022-hick-interpretation-of-religion": ["comparative-religion-academic"],
    "phase-7-015-beyond-belief":                ["comparative-religion-academic"],
    # English Romantic / esoteric
    "phase-7-047-blake-songs-of-innocence-experience": ["western-occult-modern", "english-mystical-poetry"],
}


def parse_frontmatter(text: str):
    """Return (fm_dict, fm_raw_text, fm_start_idx, fm_end_idx, body_text)."""
    m = re.match(r"^---\n(.*?)\n---\n?", text, re.DOTALL)
    if not m:
        return None, None, None, None, None
    fm_raw = m.group(1)
    fm_dict = {}
    for line in fm_raw.split("\n"):
        mm = re.match(r'^([a-z][\w-]*):\s*(.*?)\s*$', line)
        if mm:
            fm_dict[mm.group(1)] = mm.group(2).strip('"').strip("'")
    return fm_dict, fm_raw, m.start(1), m.end(1), text[m.end():]


def load_corpus_map():
    """Load (book_id → [corpus_keys]) from the JS dump."""
    with DUMP.open() as f:
        data = json.load(f)
    book_to_corpora = defaultdict(list)
    for row in data["rows"]:
        bid = row["book_id"]
        ck = row["corpus_key"]
        if ck not in book_to_corpora[bid]:
            book_to_corpora[bid].append(ck)
    return book_to_corpora


def infer_from_subtradition(fm: dict) -> tuple[list[str], str]:
    """Return (corpus_keys, source-rule) by matching sub-tradition/tradition."""
    text_to_match = " ".join(filter(None, [
        fm.get("sub-tradition", ""),
        fm.get("tradition", ""),
        fm.get("label", ""),
        fm.get("region", ""),
    ]))
    matches = []
    rule_hits = []
    for pattern, keys, note in SUBTRAD_INFERENCE:
        if re.search(pattern, text_to_match, re.IGNORECASE):
            for k in keys:
                if k not in matches:
                    matches.append(k)
            rule_hits.append(note)
    return matches, " + ".join(rule_hits) if rule_hits else ""


def apply_canonical_corpus(text: str, keys: list[str]) -> tuple[str, str]:
    """Insert `canonical-corpus: ["k1", "k2"]` line into the frontmatter.
    Idempotent: if a matching line already exists with same keys, returns unchanged.
    Returns (new_text, action) where action ∈ {written, unchanged, conflict, no-frontmatter}.
    """
    fm, fm_raw, fm_start, fm_end, body = parse_frontmatter(text)
    if fm is None:
        return text, "no-frontmatter"

    new_value = '[' + ', '.join(f'"{k}"' for k in keys) + ']'

    # Check if field already present
    if "canonical-corpus" in fm:
        existing = fm["canonical-corpus"]
        # Normalize for comparison — strip whitespace, sort
        def norm(v):
            v = v.strip().lstrip('[').rstrip(']')
            items = [x.strip().strip('"').strip("'") for x in v.split(",") if x.strip()]
            return tuple(sorted(items))
        if norm(existing) == norm(new_value):
            return text, "unchanged"
        else:
            return text, f"conflict (existing={existing!r}, proposed={new_value!r})"

    # Find insertion point: after `tradition:` line if present
    lines = fm_raw.split("\n")
    insert_after = None
    for i, line in enumerate(lines):
        if re.match(r"^tradition\s*:", line):
            insert_after = i
            break
    if insert_after is None:
        # Else after `type:`
        for i, line in enumerate(lines):
            if re.match(r"^type\s*:", line):
                insert_after = i
                break
    if insert_after is None:
        # Fallback: prepend to frontmatter
        insert_after = -1

    new_line = f'canonical-corpus: {new_value}'
    new_lines = lines[:insert_after + 1] + [new_line] + lines[insert_after + 1:]
    new_fm_raw = "\n".join(new_lines)
    new_text = text[:fm_start] + new_fm_raw + text[fm_end:]
    return new_text, "written"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="actually write files")
    ap.add_argument("--report", action="store_true", help="write report TSV (always written)")
    args = ap.parse_args()

    if not DUMP.exists():
        print(f"ERROR: {DUMP} not found. Run scripts/dump_scripture_corpora.js first.")
        return 1

    book_to_corpora = load_corpus_map()
    print(f"Loaded {len(book_to_corpora)} book→corpus mappings from dump")

    actions = defaultdict(list)  # action → [(doc_id, keys, source)]
    rows = []

    for path in sorted(DOC_DIR.rglob("*.md")):
        if "_TODO" in path.name or path.name == "README.md":
            continue
        text = path.read_text(encoding="utf-8")
        fm, _, _, _, _ = parse_frontmatter(text)
        if fm is None:
            actions["no-frontmatter"].append((path.name, [], "no-fm"))
            rows.append((path.name, "", "no-frontmatter", "low", ""))
            continue
        doc_id = fm.get("id", path.stem)

        # Lookup precedence: SCRIPTURE_CORPORA > slug-override > sub-tradition inference
        if doc_id in book_to_corpora:
            keys = book_to_corpora[doc_id]
            source = "scripture-corpora"
            confidence = "high"
        elif doc_id in SLUG_OVERRIDES:
            keys = SLUG_OVERRIDES[doc_id]
            source = "slug-override"
            confidence = "high"
        else:
            keys, source_rule = infer_from_subtradition(fm)
            source = f"inferred:{source_rule}" if source_rule else "unmapped"
            confidence = "medium" if keys else "low"

        rows.append((str(path.relative_to(VAULT)), doc_id, ",".join(keys), source, confidence,
                     fm.get("sub-tradition", "") or fm.get("tradition", "")))

        if not keys:
            actions["unmapped"].append((doc_id, [], source))
            continue

        new_text, action = apply_canonical_corpus(text, keys)
        actions[action].append((doc_id, keys, source))
        if args.apply and action == "written":
            path.write_text(new_text, encoding="utf-8")

    # Always write report TSV
    REPORT_OUT.parent.mkdir(parents=True, exist_ok=True)
    with REPORT_OUT.open("w") as f:
        f.write("path\tdoc_id\tcorpus_keys\tsource\tconfidence\tsub_tradition\n")
        for r in rows:
            f.write("\t".join(r) + "\n")
    print(f"\nReport TSV: {REPORT_OUT.relative_to(VAULT)}")

    print("\n=== ACTION SUMMARY ===")
    for action, items in sorted(actions.items()):
        print(f"  [{action}] {len(items)}")

    if "unmapped" in actions and actions["unmapped"]:
        print("\n=== UNMAPPED (first 30) — need John review ===")
        for doc_id, _, source in actions["unmapped"][:30]:
            print(f"  {doc_id}  ({source})")

    if "conflict" in actions or any(a.startswith("conflict") for a in actions):
        print("\n=== CONFLICTS — existing values disagree with inference ===")
        for a, items in actions.items():
            if a.startswith("conflict"):
                for doc_id, keys, source in items[:5]:
                    print(f"  {doc_id}  proposed={keys}  reason={a}")

    if not args.apply:
        print("\n(dry-run — no files written; re-run with --apply to commit changes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
