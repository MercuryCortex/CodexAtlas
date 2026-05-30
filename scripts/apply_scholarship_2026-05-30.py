#!/usr/bin/env python3
"""
Apply scholarship-backed dating proposals from the Pass-2 workflow.

Reads AUDIT/2026-05-30-date-scholarship-proposals.tsv (synthesizer
output) and patches each deity file's YAML frontmatter.

Behavior:
- If `period-active-earliest:` line exists with a non-empty value,
  do NOT overwrite (idempotent / safe re-run).
- If the line exists but is empty, replace value with proposed.
- If the line is absent, insert immediately after the most stable
  frontmatter anchor (region: > tradition: > name: > id:).
- Same logic for `period-active-latest:`.

The non-canonical legacy fields (`date-earliest:`, `period-earliest:`,
`period-latest:`) are left untouched — they remain as audit trail of
the prior schema state.

Usage:
  python3 scripts/apply_scholarship_2026-05-30.py --dry-run
  python3 scripts/apply_scholarship_2026-05-30.py --apply
"""

import argparse
import csv
import re
import sys
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
TSV = VAULT / "AUDIT/2026-05-30-date-scholarship-proposals.tsv"
DEITY_DIR = VAULT / "03_deities"


EARLIEST_RX = re.compile(r"^period-active-earliest\s*:\s*(.*)$")
LATEST_RX = re.compile(r"^period-active-latest\s*:\s*(.*)$")
# anchors in preference order
ANCHOR_KEYS = ["region", "tradition", "name", "id"]


def is_empty_val(v: str) -> bool:
    return v is None or v.strip() in ("", '""', "''")


def find_anchor_idx(lines: list[str]) -> int:
    """Return index of the last anchor line found in the frontmatter
    (insertion point is anchor + 1). Falls back to 1 (just after opening ---)."""
    fm_end = None
    for i, L in enumerate(lines):
        if i > 0 and L.strip() == "---":
            fm_end = i
            break
    if fm_end is None:
        return 1
    best = 1
    for key in ANCHOR_KEYS:
        rx = re.compile(rf"^{key}\s*:")
        for i in range(fm_end):
            if rx.match(lines[i]):
                best = i
                break
        if best > 1:
            return best
    return best


def patch_file(path: Path, proposed_earliest: int, proposed_latest: int, dry: bool):
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    new_lines = lines[:]
    actions = []

    e_idx = None
    l_idx = None
    for i, L in enumerate(new_lines):
        if EARLIEST_RX.match(L):
            e_idx = i
        if LATEST_RX.match(L):
            l_idx = i

    # 1. handle earliest
    if e_idx is not None:
        m = EARLIEST_RX.match(new_lines[e_idx])
        val = m.group(1).strip()
        if is_empty_val(val):
            new_lines[e_idx] = f"period-active-earliest: {proposed_earliest}"
            actions.append(f"set-earliest-empty→{proposed_earliest}")
        else:
            actions.append(f"keep-earliest={val}")
    else:
        ins_idx = find_anchor_idx(new_lines) + 1
        new_lines.insert(ins_idx, f"period-active-earliest: {proposed_earliest}")
        actions.append(f"insert-earliest@{ins_idx}={proposed_earliest}")
        # adjust l_idx if it was after insertion point
        if l_idx is not None and l_idx >= ins_idx:
            l_idx += 1

    # 2. handle latest
    if l_idx is not None:
        m = LATEST_RX.match(new_lines[l_idx])
        val = m.group(1).strip()
        if is_empty_val(val):
            new_lines[l_idx] = f"period-active-latest: {proposed_latest}"
            actions.append(f"set-latest-empty→{proposed_latest}")
        else:
            actions.append(f"keep-latest={val}")
    else:
        # insert just after the (possibly inserted) earliest line
        for i, L in enumerate(new_lines):
            if EARLIEST_RX.match(L):
                new_lines.insert(i + 1, f"period-active-latest: {proposed_latest}")
                actions.append(f"insert-latest@{i+1}={proposed_latest}")
                break

    if new_lines == lines:
        return False, "no-op", actions

    if not dry:
        new_text = "\n".join(new_lines)
        if text.endswith("\n"):
            new_text += "\n"
        path.write_text(new_text, encoding="utf-8")
    return True, "patched", actions


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true")
    g.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    dry = args.dry_run and not args.apply

    if not TSV.exists():
        print(f"ERROR: proposals TSV missing: {TSV}", file=sys.stderr)
        sys.exit(1)

    rows = []
    with open(TSV, encoding="utf-8") as fh:
        rdr = csv.DictReader(fh, delimiter="\t")
        for row in rdr:
            rows.append(row)

    print(f"Found {len(rows)} proposals")
    patched = 0
    noops = 0
    missing = 0
    for r in rows:
        p = DEITY_DIR / r["file"]
        if not p.exists():
            print(f"  MISSING: {r['file']}", file=sys.stderr)
            missing += 1
            continue
        try:
            e = int(r["proposed_earliest"])
            l = int(r["proposed_latest"])
        except ValueError:
            print(f"  BAD-PROPOSAL {r['file']}: {r['proposed_earliest']}/{r['proposed_latest']}", file=sys.stderr)
            continue
        changed, status, actions = patch_file(p, e, l, dry)
        if changed:
            patched += 1
        else:
            noops += 1
        if dry or changed:
            print(f"  {r['file']:<35} {status:<10} {','.join(actions)}")

    print(f"\n{'DRY-RUN' if dry else 'APPLIED'}: patched={patched}, no-op={noops}, missing={missing}")


if __name__ == "__main__":
    main()
