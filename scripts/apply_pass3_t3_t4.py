#!/usr/bin/env python3
"""Pass-3 T3 + edge cases + T4 apply.

Operates on EXPLICIT (file, field, expected_old, new_value) tuples — no regex
sweep. Idempotent. Refuses to write if the expected_old value isn't present.

Ratification: John explicit "agree" on AUDIT/2026-05-30-date-audit-pass3.md
proposal (single-batch greenlight covering T3 confident + edge defaults + T4
mechanical).
"""
import re
import sys
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
DEITY = VAULT / "03_deities"

# Each entry: (slug, field, expected_old, new_value, tier-tag)
# expected_old = the literal value currently on the line, stripped (no quotes).
PATCHES = [
    # ---- T3 CONFIDENT (17): direct Rule-A application ----
    # Vedic foundational (Agnihotra + Soma yāga + Srauta = living ritual)
    ("agni",                       "period-active-latest", "0",    "2026", "T3"),
    ("indra",                      "period-active-latest", "500",  "2026", "T3"),
    ("soma",                       "period-active-latest", "0",    "2026", "T3"),
    ("varuna",                     "period-active-latest", "500",  "2026", "T3"),
    ("mitra-vedic",                "period-active-latest", "500",  "2026", "T3"),
    ("prajapati",                  "period-active-latest", "200",  "2026", "T3"),
    ("rudra-shiva-early",          "period-active-latest", "500",  "2026", "T3"),
    # Zoroastrian core (Parsi + Iranian Mazdayasna active)
    ("ahura-mazda",                "period-active-latest", "700",  "2026", "T3"),
    ("mithra-zoroastrian",         "period-active-latest", "700",  "2026", "T3"),
    ("anahita",                    "period-active-latest", "700",  "2026", "T3"),
    ("tishtrya",                   "period-active-latest", "700",  "2026", "T3"),
    ("spenta-mainyu",              "period-active-latest", "700",  "2026", "T3"),
    ("angra-mainyu-ahriman",       "period-active-latest", "700",  "2026", "T3"),
    ("apam-napat-zoroastrian",     "period-active-latest", "700",  "2026", "T3"),
    ("the-amesha-spentas",         "period-active-latest", "700",  "2026", "T3"),
    # Abrahamic gap
    ("yahweh",                     "period-active-latest", "0",    "2026", "T3"),
    ("satan-christian",            "period-active-latest", "null", "2026", "T3"),

    # ---- T3 EDGES (defaults per ratification) ----
    # (keep: dyaus-pita, vritra, ushas, aditi, hokmah-hebrew, nanghaithya-daeva, kalki — no patch)
    ("azazel",                     "period-active-latest", "200",  "2026", "T3e"),
    ("kama-vedic",                 "period-active-latest", "1700", "2026", "T3e"),
    ("dhanvantari",                "period-active-latest", "1900", "2026", "T3e"),
    ("mahavira-jain",              "period-active-latest", "-527", "2026", "T3e"),
    # Broken placeholder → conventional Jain-tradition-attested range
    ("rishabha-jain",              "period-active-earliest", "-999999999", "-1500", "T3e"),
    ("rishabha-jain",              "period-active-latest",   "-999999000", "2026",  "T3e"),

    # ---- T4 ACTIVE-TRADITION CLEANUP (null → 2026) ----
    # Yoruba
    ("babalu-aye",                 "period-active-latest", "null", "2026", "T4a"),
    ("olokun",                     "period-active-latest", "null", "2026", "T4a"),
    ("aganju",                     "period-active-latest", "null", "2026", "T4a"),
    ("oduduwa",                    "period-active-latest", "null", "2026", "T4a"),
    # Shinto
    ("ame-no-uzume",               "period-active-latest", "null", "2026", "T4a"),
    ("kagutsuchi",                 "period-active-latest", "null", "2026", "T4a"),
    ("sarutahiko",                 "period-active-latest", "null", "2026", "T4a"),
    ("ame-no-hohi",                "period-active-latest", "null", "2026", "T4a"),
    # Mahayana Buddhism
    ("bhaisajyaguru",              "period-active-latest", "null", "2026", "T4a"),
    # Korean Muism
    ("tangun",                     "period-active-latest", "null", "2026", "T4a"),
    ("hwanin",                     "period-active-latest", "null", "2026", "T4a"),
    ("hwanung",                    "period-active-latest", "null", "2026", "T4a"),
    # Chinese folk
    ("yan-wang",                   "period-active-latest", "null", "2026", "T4a"),
    ("shennong",                   "period-active-latest", "null", "2026", "T4a"),
    # Zoroastrian (T3 also)
    ("verethraghna-zoroastrian",   "period-active-latest", "null", "2026", "T4a"),
    # Hindu
    ("chitragupta",                "period-active-latest", "null", "2026", "T4a"),
    # Twelver Shia (Mahdi in occultation; doctrinally active)
    ("muhammad-al-mahdi",          "period-active-latest", "null", "2026", "T4a"),
    # Active Western occult (Modern Satanism / contemporary occult discourse)
    ("baphomet",                   "period-active-latest", "null", "2026", "T4a"),

    # ---- T4 EXTINCT-TRADITION CLEANUP ----
    # Baltic — Lithuania Christianized 1387; Latvia ~1525
    ("laima",                      "period-active-latest", "null", "1525", "T4e"),   # Lat+Lith
    ("velinas",                    "period-active-latest", "null", "1525", "T4e"),   # Lat+Lith
    ("meness",                     "period-active-latest", "null", "1525", "T4e"),   # Latvian primary
    ("zemyna",                     "period-active-latest", "null", "1387", "T4e"),   # Lithuanian
    # Irish Celtic — Christianization of Ireland convention ~600
    ("boann",                      "period-active-latest", "null", "600",  "T4e"),
    ("ogma",                       "period-active-latest", "null", "600",  "T4e"),
    ("aengus-og",                  "period-active-latest", "null", "600",  "T4e"),
    ("macha",                      "period-active-latest", "null", "600",  "T4e"),
    # Literary mythology — Camões Os Lusíadas (1572), single-year doc-style
    ("adamastor",                  "period-active-latest", "null", "1572", "T4e"),
]


def patch_field(path: Path, field: str, expected_old: str, new_val: str) -> bool:
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(
        rf"^({re.escape(field)}:\s*){re.escape(expected_old)}\s*$", re.MULTILINE
    )
    if not pattern.search(text):
        return False
    new_text = pattern.sub(rf"\g<1>{new_val}", text, count=1)
    if new_text == text:
        return False
    path.write_text(new_text, encoding="utf-8")
    return True


def main():
    hits, misses = [], []
    for slug, field, old, new, tag in PATCHES:
        p = DEITY / f"{slug}.md"
        if not p.exists():
            misses.append((slug, field, "file-not-found", tag))
            continue
        if patch_field(p, field, old, new):
            hits.append((slug, field, old, new, tag))
        else:
            misses.append((slug, field, f"old-value-not-{old}", tag))

    by_tag = {}
    for _, _, _, _, tag in hits:
        by_tag[tag] = by_tag.get(tag, 0) + 1
    print("== HITS by tier ==")
    for tag, n in sorted(by_tag.items()):
        print(f"  {tag}: {n}")
    print(f"Total hits: {len(hits)} / {len(PATCHES)}")

    if misses:
        print("\n== MISSES ==")
        for slug, field, reason, tag in misses:
            print(f"  [{tag}] {slug}.{field}: {reason}")
        sys.exit(1)

    print("\nAll T3+T4 apply targets hit cleanly.")


if __name__ == "__main__":
    main()
