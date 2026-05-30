#!/usr/bin/env python3
"""Pass-3 mechanical apply: Tier 1 (2025→2026 rollover) + Tier 2 (Egyptian 400→500).

Both tiers are extensions of rules already ratified in Pass-1/Pass-2:
- T1: annual rollover on currently-active-tradition deities (Rule A continuation)
- T2: Egyptian cult terminus 500 (Philae 535 CE bookend, Pass-2 standardization)

Operates on EXPLICIT FILE ALLOWLISTS. No regex sweep. Idempotent.
"""
import re
import sys
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
DEITY = VAULT / "03_deities"

T1_ROLLOVER_2025_TO_2026 = [
    "erlang-shen", "mahakala", "mara-demon", "rama", "ruha", "nommo",
    "sun-wukong", "the-sefirot", "lilith", "al-haqq", "padmasambhava",
    "hanuman", "chakrasamvara", "amma-dogon", "avalokitesvara", "ein-sof",
    "cagn", "murugan", "ptahil", "krishna", "saraswati", "kali",
    "samantabhadra-buddha", "vajrasattva", "allah", "metatron", "guan-yu",
    "haoma-zoroastrian", "manasa-devi", "kalachakra", "manda-d-hayyi",
    "vajradhara", "hayyi-rabbi", "tu-di-gong", "durga", "ganesha",
    "nur-muhammadi", "dizang-ksitigarbha", "abathur", "lakshmi", "guanyin",
    "tara", "vajrayogini", "shekhinah",
]

T2_EGYPTIAN_400_TO_500 = [
    "nun", "banebdjedet", "geb", "amun-ra", "nekhbet", "neith", "amun",
    "bastet", "kek-egyptian", "sekhmet", "tefnut", "khnum", "ptah",
    "anput", "anubis", "set", "thoth", "agathos-daimon", "atum", "khepri",
    "shu", "wadjet", "serapis", "hathor", "nut", "apis-bull", "horus",
    "nephthys",
]


def replace_field_value(path: Path, field: str, expected_old: str, new_val: str) -> bool:
    """Replace `field: expected_old` with `field: new_val` in the YAML frontmatter.
    Returns True if the file was modified."""
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(rf"^({re.escape(field)}:\s*){re.escape(expected_old)}\s*$", re.MULTILINE)
    if not pattern.search(text):
        return False
    new_text = pattern.sub(rf"\g<1>{new_val}", text, count=1)
    if new_text == text:
        return False
    path.write_text(new_text, encoding="utf-8")
    return True


def main():
    t1_hits, t1_miss = [], []
    for slug in T1_ROLLOVER_2025_TO_2026:
        p = DEITY / f"{slug}.md"
        if not p.exists():
            t1_miss.append((slug, "file-not-found"))
            continue
        if replace_field_value(p, "period-active-latest", "2025", "2026"):
            t1_hits.append(slug)
        else:
            t1_miss.append((slug, "value-not-2025"))

    t2_hits, t2_miss = [], []
    for slug in T2_EGYPTIAN_400_TO_500:
        p = DEITY / f"{slug}.md"
        if not p.exists():
            t2_miss.append((slug, "file-not-found"))
            continue
        if replace_field_value(p, "period-active-latest", "400", "500"):
            t2_hits.append(slug)
        else:
            t2_miss.append((slug, "value-not-400"))

    print(f"\n[T1] 2025 → 2026 rollover")
    print(f"  hits: {len(t1_hits)} / {len(T1_ROLLOVER_2025_TO_2026)}")
    if t1_miss:
        print(f"  MISSES: {t1_miss}")

    print(f"\n[T2] Egyptian 400 → 500 standardization")
    print(f"  hits: {len(t2_hits)} / {len(T2_EGYPTIAN_400_TO_500)}")
    if t2_miss:
        print(f"  MISSES: {t2_miss}")

    if t1_miss or t2_miss:
        print("\nWARNING: some misses — investigate before committing.")
        sys.exit(1)
    print("\nAll mechanical apply targets hit cleanly.")


if __name__ == "__main__":
    main()
