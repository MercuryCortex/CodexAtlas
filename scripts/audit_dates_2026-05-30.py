#!/usr/bin/env python3
"""
Date-audit classifier (2026-05-30).

Scans 03_deities/ and 02_documents/ for dating gaps and partitions every
affected file into one of four buckets:

  DETERMINISTIC_2026      empty period-active-latest, tradition is currently-active
                          (Hindu / Buddhist / Christian / Islamic / Shinto / Yoruba /
                          Vodou / Sikh / Bahá'í / Mormon / Native-American /
                          African-traditional / Pacific / Chinese-folk / Daoist /
                          syncretic-continuation), fix = 2026.

  NEEDS_SCHOLARSHIP       empty period-active-latest, tradition is genuinely
                          extinct (Greek/Roman/Maya/Inca/Norse-pre-revival/
                          Celtic-pagan-no-Christianization/Slavic-pre-Christian/
                          Finno-Karelian). Needs Tier-1 source for end date.

  NEEDS_BOTH              earliest AND latest fields missing or empty.

  EDGE_CASE               revival movements, literary-only survival, ambiguous.

Output: AUDIT/2026-05-30-date-classifier.tsv with columns:
  file, current_state, tradition, bucket, proposed_latest, notes

Usage:
  python3 scripts/audit_dates_2026-05-30.py
"""

import re
import sys
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
DEITY_DIR = VAULT / "03_deities"
OUT = VAULT / "AUDIT/2026-05-30-date-classifier.tsv"


# -----------------------------------------------------------------------
# Tradition pattern matchers.
# Order matters: first match wins.
# -----------------------------------------------------------------------

ACTIVE_PATTERNS = [
    # Asian-Indic
    r"\bHindu", r"\bVedic", r"\bVaiṣṇava", r"\bVaishnav", r"\bShaiv", r"\bShakta",
    r"\bBhakti", r"\bTantric", r"\bSmārta", r"\bSmarta", r"\bPurān", r"\bPuran",
    r"tradition-vedic-hinduism", r"tradition-bhakti-vaishnavism",
    # Buddhism
    r"\bBuddhi", r"\bMahāyāna", r"\bMahayana", r"\bVajrayana", r"\bTheravāda",
    r"\bTheravada", r"\bPure Land", r"\bGeluk", r"\bSakya", r"\bNyingma",
    r"\bHuayan", r"\bShingon", r"\bTiantai", r"\bNichiren", r"\bTibetan",
    r"\bEsoteric Buddhism", r"\bChinese Buddhism", r"\bJapanese Buddhism",
    # Sikhism / Jainism / Zoroastrianism (active) / Bahá'í / Mormonism
    r"\bSikh", r"\bJain", r"\bZoroastrian(?!.*extinct)", r"\bBah[aá]'?[ií]",
    r"\bMormon", r"\bLDS\b",
    # Abrahamic — active
    r"\bChristianity", r"\bChristian(?!ization)", r"\bCatholic", r"\bOrthodox",
    r"\bProtestant", r"\bByzantine", r"\bCoptic", r"\bEthiopian",
    r"tradition-ethiopian-orthodox-tewahedo", r"tradition-coptic-orthodox",
    r"\bIslam", r"\bSunn[iī]", r"\bShia", r"\bShi[ʿ']?[ai]", r"\bSufi",
    r"\bJewish", r"\bJudaism", r"\bKabbalah", r"\bMandaeism",
    # East-Asian active folk/religion
    r"\bShinto", r"\bDaoism", r"\bTao(?:ism|ist)",
    r"\bChinese folk", r"\bChinese mythology",  # active syncretic
    r"\bConfucia", r"\bShichifukujin",
    # African traditional + diaspora
    r"\bYoruba", r"\bVodou", r"\bVoodoo", r"\bVodun", r"\bSanter[ií]a",
    r"\bCandombl[eé]", r"\bLucum[ií]", r"\bIf[aá]", r"\bAkan",
    r"\bIgbo", r"tradition-igbo-religion", r"\bBaKongo", r"tradition-bantu-kongo",
    r"\bShona", r"\bZulu", r"\bMaasai", r"\bKhoisan", r"tradition-khoisan-san",
    r"\bFon-Ewe", r"tradition-vodou-haitian", r"tradition-yoruba",
    r"\bDahomey", r"\bPan-African",
    # Native American + Inuit + Pueblo + Algonquian
    r"\bLakota", r"\bSioux", r"\bDakota", r"\bNakota",
    r"\bDiné", r"\bDine\b", r"\bNavajo",
    r"\bHaudenosaunee", r"\bIroquois",
    r"\bAnishinaabe", r"\bOjibwe", r"\bAlgonquian", r"\bCree",
    r"\bPacific Northwest", r"\bHaida", r"\bTlingit", r"\bTsimshian",
    r"\bInuit", r"\bArctic",
    r"\bPueblo", r"\bEastern Woodlands", r"\bAndean.*folk", r"\bQuechua",
    r"\bAymara",
    # Pacific
    r"\bM[aā]ori", r"\bPolynesian", r"\bHawaiian", r"\bKanaka Maoli",
    r"\bTahitian", r"\bSamoan",
    # Aboriginal Australian — Rainbow Serpent / Baiame are still active
    r"\bAboriginal", r"\bWiradjuri", r"\bKamilaroi",
]

EXTINCT_PATTERNS = [
    r"\bGreek religion", r"\bGreek(?!.*(reception|philosophy.*Romantic))",
    r"\bRoman religion",
    r"\bEgyptian religion", r"\begyptian-religion(?!.*revival)",
    r"\bSumerian", r"\bAkkadian", r"\bBabylonian", r"\bAssyrian",
    r"\bMesopotamian",
    r"\bCanaanite", r"\bUgaritic", r"\bWest Semitic",
    r"\bHittite", r"\bEtruscan", r"\bPersian(?!.*active)", r"\bManich",
    r"\bMithra",
    # Norse listed as `[[tradition-norse]]` or "Norse / Germanic" pure
    r"tradition-norse",
    r"\bNorse / Germanic",
    r"\bMaya(?!.*living|.*continuation)",
    r"\bAztec", r"\bInca\b", r"\bIncan",
    # Pre-Christian Celtic with NO Christian-saint continuation
    r"^Celtic paganism \(G(allo|aelic\)$|aelic\+ Welsh)",  # tightened
    # Slavic pre-Christian
    r"\bPre-Christian Slavic",
    # Finno-Karelian
    r"\bFinno-Karelian",
]

# Cases where the file's tradition string slips past the broad patterns.
# Manually flag from the 173-list reconnaissance.
EXPLICIT_BUCKETS = {
    # EXTINCT pre-Christian Celtic deities (Brigid alone has Christian continuation)
    "atlas-titan.md": ("NEEDS_SCHOLARSHIP", 400, "Greek religion — match Zeus/Apollo Theodosian closures"),
    "iapetus.md": ("NEEDS_SCHOLARSHIP", 400, "Greek religion — match Zeus/Apollo"),
    "mnemosyne.md": ("NEEDS_SCHOLARSHIP", 400, "Greek religion (Orphic + Pythagorean)"),
    "prometheus.md": ("NEEDS_SCHOLARSHIP", 400, "Greek religion (cult); literary reception NOT counted under rule A"),
    "rhea.md": ("NEEDS_SCHOLARSHIP", 400, "Greek religion"),
    "the-erinyes.md": ("NEEDS_SCHOLARSHIP", 400, "Greek religion"),
    "the-moirai.md": ("NEEDS_SCHOLARSHIP", 400, "Greek religion"),
    "themis.md": ("NEEDS_SCHOLARSHIP", 400, "Greek religion"),
    "fortuna.md": ("NEEDS_SCHOLARSHIP", 400, "Roman religion — Theodosian closures"),
    "ah-puch.md": ("NEEDS_SCHOLARSHIP", 1697, "Maya — fall of Itza per Restall 1998"),
    "ixbalanque.md": ("NEEDS_SCHOLARSHIP", 1697, "Maya — Popol Vuh K'iche'; Itza endpoint"),
    "coniraya.md": ("NEEDS_SCHOLARSHIP", 1608, "Andean — Huarochirí Manuscript closing date"),
    "pariacaca.md": ("NEEDS_SCHOLARSHIP", 1608, "Andean — Huarochirí Manuscript"),
    "bergelmir.md": ("NEEDS_SCHOLARSHIP", 1100, "Norse pre-revival — match Odin/Thor/Freyja/Loki"),
    "cernunnos.md": ("NEEDS_SCHOLARSHIP", 600, "Gallo-Roman + Insular substrate; Christianization endpoint"),
    "dagda.md": ("NEEDS_SCHOLARSHIP", 600, "Gaelic — Christianization of Ireland"),
    "lugh.md": ("NEEDS_SCHOLARSHIP", 600, "Gaelic + Welsh + Continental — Christianization"),
    "manannan-mac-lir.md": ("NEEDS_SCHOLARSHIP", 600, "Gaelic + Welsh — Christianization"),
    "nuada.md": ("NEEDS_SCHOLARSHIP", 600, "Gaelic + Welsh + Romano-British — Christianization"),
    "the-morrigan.md": ("NEEDS_SCHOLARSHIP", 600, "Gaelic — Christianization"),
    "jarilo.md": ("NEEDS_SCHOLARSHIP", 988, "Pre-Christian Slavic — Christianization of Kievan Rus'"),
    "ukko.md": ("NEEDS_SCHOLARSHIP", 1900, "Finno-Karelian — runic singing through 19th c.; Kalevala 1849"),
    "vainamoinen.md": ("NEEDS_SCHOLARSHIP", 1900, "Finno-Karelian — runic singing through 19th c."),

    # DETERMINISTIC 2026: explicit overrides where tradition string is unusual
    "brigid.md": ("DETERMINISTIC_2026", 2026, "Celtic pagan → St. Brigid Christian-syncretic continuation"),
    "lucifer.md": ("DETERMINISTIC_2026", 2026, "Christianity → Romantic → Modern Satanism (LaVey 1969, continuing)"),
    "beelzebub.md": ("DETERMINISTIC_2026", 2026, "Hebrew Bible → NT demonology → ongoing Christian imagination"),
    "asmodeus.md": ("DETERMINISTIC_2026", 2026, "Second Temple → Christian/Kabbalah/Solomonic demonology, ongoing"),
    "saint-blaise.md": ("DETERMINISTIC_2026", 2026, "Christian saint — Eastern Orthodox + Catholic"),
    "supay.md": ("DETERMINISTIC_2026", 2026, "Inca/Andean → El Tío syncretic continuation in Andean folk Catholicism"),

    # Christian/Trinitarian/Mary/Christ figures
    "god-the-father-christian.md": ("DETERMINISTIC_2026", 2026, "Christianity, active"),
    "jesus-christ-deity.md": ("DETERMINISTIC_2026", 2026, "Christianity, active"),
    "holy-spirit.md": ("DETERMINISTIC_2026", 2026, "Christianity, active"),
    "the-trinity.md": ("DETERMINISTIC_2026", 2026, "Christianity, active"),
    "mary-theotokos.md": ("DETERMINISTIC_2026", 2026, "Christianity, active"),
    "mary-of-zion.md": ("DETERMINISTIC_2026", 2026, "Ethiopian Orthodox, active"),
    "christ-pantokrator.md": ("DETERMINISTIC_2026", 2026, "Christianity, active"),

    # Christian/Jewish/Islamic shared archangels
    "gabriel-archangel.md": ("DETERMINISTIC_2026", 2026, "Christianity/Judaism/Islam, active"),
    "michael-archangel.md": ("DETERMINISTIC_2026", 2026, "Christianity/Judaism/Islam/Mandaeism, active"),
    "raphael-archangel.md": ("DETERMINISTIC_2026", 2026, "Christianity/Judaism/Islam, active"),
    "uriel-archangel.md": ("DETERMINISTIC_2026", 2026, "Christianity/Judaism, active"),
    "raguel-archangel.md": ("DETERMINISTIC_2026", 2026, "Second Temple Enochic → Ethiopian Orthodox canon"),
    "remiel-archangel.md": ("DETERMINISTIC_2026", 2026, "Ethiopian Orthodox canon, active"),
    "saraqael-archangel.md": ("DETERMINISTIC_2026", 2026, "Ethiopian Orthodox canon, active"),
    "head-of-days.md": ("DETERMINISTIC_2026", 2026, "Ethiopian Orthodox canon (Book of Parables)"),
    "angel-of-the-presence.md": ("DETERMINISTIC_2026", 2026, "Ethiopian Orthodox canon (Jubilees)"),
    "israfil.md": ("DETERMINISTIC_2026", 2026, "Sunni/Shia hadith tradition, active"),
    "the-lady-ecclesia-hermas.md": ("DETERMINISTIC_2026", 2026, "Ethiopian Orthodox canon (Shepherd of Hermas)"),
    "the-shepherd-angel-of-repentance.md": ("DETERMINISTIC_2026", 2026, "Ethiopian Orthodox canon"),
    # Chinese pre-Qin mythology continues in Daoist/folk veneration + modern reception
    "gonggong.md": ("DETERMINISTIC_2026", 2026, "Chinese pre-Qin mythology → Daoist-folk continuation"),
}


def has_field(lines, key):
    rx = re.compile(rf"^{re.escape(key)}\s*:")
    return any(rx.match(L) for L in lines)


def get_field(lines, key):
    rx = re.compile(rf"^{re.escape(key)}\s*:\s*(.*)$")
    for L in lines:
        m = rx.match(L)
        if m:
            return m.group(1).strip()
    return None


def classify(name, tradition):
    """Return (bucket, proposed_latest, notes)."""
    if name in EXPLICIT_BUCKETS:
        return EXPLICIT_BUCKETS[name]
    if not tradition:
        return ("EDGE_CASE", "", "tradition string missing")

    # Active patterns first (tradition continuations dominate)
    for pat in ACTIVE_PATTERNS:
        if re.search(pat, tradition, re.IGNORECASE):
            return ("DETERMINISTIC_2026", 2026, f"matched ACTIVE pattern: {pat}")

    for pat in EXTINCT_PATTERNS:
        if re.search(pat, tradition, re.IGNORECASE):
            return ("NEEDS_SCHOLARSHIP", "", f"matched EXTINCT pattern: {pat}")

    return ("EDGE_CASE", "", f"unmatched tradition: {tradition[:80]}")


def main():
    rows = []  # (file, current_state, tradition, bucket, proposed_latest, notes)

    for f in sorted(DEITY_DIR.glob("*.md")):
        if f.name.upper().startswith("README"):
            continue
        with open(f, encoding="utf-8") as fh:
            text = fh.read()
        lines = text.splitlines()

        has_e = has_field(lines, "period-active-earliest")
        has_l = has_field(lines, "period-active-latest")
        e_val = get_field(lines, "period-active-earliest") if has_e else None
        l_val = get_field(lines, "period-active-latest") if has_l else None
        e_empty = (e_val is None) or e_val.strip() in ("", '""', "''")
        l_empty = (l_val is None) or l_val.strip() in ("", '""', "''")

        tradition = get_field(lines, "tradition") or ""
        tradition = tradition.strip().strip('"')

        if not has_e and not has_l:
            current_state = "MISSING_BOTH"
            bucket = "NEEDS_BOTH"
            proposed = ""
            notes = "both fields absent"
            rows.append((f.name, current_state, tradition, bucket, proposed, notes))
            continue

        if e_empty and l_empty:
            current_state = "EMPTY_BOTH"
            bucket = "NEEDS_BOTH"
            proposed = ""
            notes = "both fields empty"
            rows.append((f.name, current_state, tradition, bucket, proposed, notes))
            continue

        if l_empty:
            current_state = "EMPTY_LATEST"
            bucket, proposed, notes = classify(f.name, tradition)
            rows.append((f.name, current_state, tradition, bucket, proposed, notes))
            continue

        # full field set — not in scope for this audit
        # (sample-audit in Pass 3, not Pass 1/2)

    # write TSV
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("file\tcurrent_state\ttradition\tbucket\tproposed_latest\tnotes\n")
        for row in rows:
            fh.write("\t".join(str(c).replace("\t", " ") for c in row) + "\n")

    # summary
    from collections import Counter
    bucket_count = Counter(r[3] for r in rows)
    state_count = Counter(r[1] for r in rows)
    print(f"Total flagged: {len(rows)}")
    print("By state:")
    for k, v in sorted(state_count.items()):
        print(f"  {k}: {v}")
    print("By bucket:")
    for k, v in sorted(bucket_count.items()):
        print(f"  {k}: {v}")
    print(f"\nTSV written: {OUT}")


if __name__ == "__main__":
    main()
