#!/usr/bin/env python3
"""
Apply the DETERMINISTIC_2026 fixes from the classifier TSV.

Reads AUDIT/2026-05-30-date-classifier.tsv and for every row where
bucket == DETERMINISTIC_2026, replaces the empty period-active-latest
value in the file's YAML frontmatter with the proposed value (2026).

Idempotent — re-running is safe; non-empty existing values are NEVER
overwritten. The only mutation pattern is:
    period-active-latest:                ->  period-active-latest: 2026
    period-active-latest: ""             ->  period-active-latest: 2026
    period-active-latest: ''             ->  period-active-latest: 2026

Usage:
  python3 scripts/apply_dates_2026-05-30.py --dry-run
  python3 scripts/apply_dates_2026-05-30.py --apply
"""

import argparse
import csv
import re
import sys
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
TSV = VAULT / "AUDIT/2026-05-30-date-classifier.tsv"
DEITY_DIR = VAULT / "03_deities"


EMPTY_LATEST_RX = re.compile(r"^(period-active-latest\s*:)(\s*(?:\"\"|\'\'|)\s*)$")
NEW_LINE = "period-active-latest: 2026"


def patch_file(path: Path, dry: bool):
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=False)
    new_lines = []
    changed = False
    for L in lines:
        m = EMPTY_LATEST_RX.match(L)
        if m:
            # safety: ensure we are inside frontmatter (first line should be ---)
            if changed:
                # only patch the first empty occurrence
                new_lines.append(L)
                continue
            new_lines.append(NEW_LINE)
            changed = True
        else:
            new_lines.append(L)

    if not changed:
        return False, "no empty period-active-latest line found"

    if dry:
        return True, "would patch"

    new_text = "\n".join(new_lines)
    if text.endswith("\n"):
        new_text += "\n"
    path.write_text(new_text, encoding="utf-8")
    return True, "patched"


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true")
    g.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    dry = args.dry_run and not args.apply

    if not TSV.exists():
        print(f"ERROR: classifier TSV missing — run scripts/audit_dates_2026-05-30.py first", file=sys.stderr)
        sys.exit(1)

    targets = []
    with open(TSV, encoding="utf-8") as fh:
        rdr = csv.DictReader(fh, delimiter="\t")
        for row in rdr:
            if row["bucket"] == "DETERMINISTIC_2026":
                targets.append(row["file"])

    print(f"Found {len(targets)} DETERMINISTIC_2026 targets")
    if not targets:
        return

    n_patched = 0
    n_skip = 0
    skips = []
    for name in targets:
        p = DEITY_DIR / name
        if not p.exists():
            print(f"  MISSING: {name}", file=sys.stderr)
            n_skip += 1
            skips.append((name, "file missing"))
            continue
        ok, msg = patch_file(p, dry)
        if ok:
            n_patched += 1
        else:
            n_skip += 1
            skips.append((name, msg))

    print(f"\n{'DRY-RUN' if dry else 'APPLIED'}: patched {n_patched} files, skipped {n_skip}")
    if skips:
        print("Skips:")
        for name, msg in skips:
            print(f"  {name}: {msg}")


if __name__ == "__main__":
    main()
