#!/usr/bin/env python3
"""
strip_doc_thumbnails_2026-05-30.py

Audit-pass 1a: remove document thumbnail cache entries whose Wikipedia
fuzzy-match similarity falls below 0.40. Driven by 00_meta/SUSPECTS.md
which the original fetcher pipeline emitted during cache build.

Symptoms before fix:
- Sirach (Ecclesiasticus) hover card showed Thai TV host Setha Sirachaya
  photo + bio. Sim 0.57. (Borderline — keeping 0.40 threshold catches
  the worst 100 but leaves the 0.40-0.60 band for per-node review.)
- Ibn Rushd Tahāfut → unrelated person (sim 0.08).
- Tertullian Apology → bogus match (sim 0.12).
- ~70+ other docs with sim < 0.30.

Output:
- Removes flagged entries from _assets/thumbs_cache.json
- Emits AUDIT/2026-05-30-stripped-doc-thumbnails.tsv (id, sim, old-title, what-was-stripped)

Usage:
    python3 scripts/strip_doc_thumbnails_2026-05-30.py --dry-run
    python3 scripts/strip_doc_thumbnails_2026-05-30.py --apply
"""

import argparse
import csv
import json
import re
import sys
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
CACHE = VAULT / "_assets" / "thumbs_cache.json"
SUSPECTS = VAULT / "00_meta" / "SUSPECTS.md"
AUDIT_OUT = VAULT / "AUDIT" / "2026-05-30-stripped-doc-thumbnails.tsv"

THRESHOLD = 0.40  # below this, strip


def parse_suspects():
    """Extract (id, title, sim, current-match) rows for documents from SUSPECTS.md.
    Document rows look like:
      | `phase-3-007-sirach` | Sirach (Ecclesiasticus) | **Setha Sirachaya** | 0.57 | [view](...) |
    """
    rows = []
    in_doc_section = False
    with open(SUSPECTS, encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if line.startswith("## "):
                in_doc_section = "DOCUMENT" in line.upper()
                continue
            if not in_doc_section:
                continue
            if not line.startswith("| `phase-"):
                continue
            # split by | and strip
            parts = [p.strip() for p in line.strip("|").split("|")]
            if len(parts) < 4:
                continue
            nid = parts[0].strip("`")
            title = parts[1]
            matched = parts[2].replace("**", "")
            try:
                sim = float(parts[3])
            except ValueError:
                continue
            rows.append((nid, title, matched, sim))
    return rows


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true")
    g.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    dry = args.dry_run and not args.apply

    rows = parse_suspects()
    strip_ids = sorted(set(nid for nid, _, _, sim in rows if sim < THRESHOLD))
    print(f"SUSPECTS rows for docs: {len(rows)}")
    print(f"Threshold sim < {THRESHOLD}: {len(strip_ids)} IDs to strip")

    if not CACHE.exists():
        print(f"ERROR: cache not found at {CACHE}", file=sys.stderr)
        sys.exit(1)

    with open(CACHE, encoding="utf-8") as fh:
        cache = json.load(fh)

    pre_count = len(cache)
    stripped = []
    for nid, title, matched, sim in rows:
        if sim >= THRESHOLD:
            continue
        entry = cache.get(nid)
        if entry is None:
            continue
        stripped.append({
            "id": nid,
            "title": title,
            "stripped_match": entry.get("title", matched),
            "sim": sim,
            "extract_head": (entry.get("extract") or "")[:120].replace("\t", " ").replace("\n", " "),
        })
        if not dry:
            del cache[nid]
    post_count = len(cache)

    AUDIT_OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(AUDIT_OUT, "w", encoding="utf-8") as fh:
        w = csv.DictWriter(
            fh, fieldnames=["id", "title", "stripped_match", "sim", "extract_head"],
            delimiter="\t",
        )
        w.writeheader()
        for r in stripped:
            w.writerow(r)

    if not dry:
        with open(CACHE, "w", encoding="utf-8") as fh:
            json.dump(cache, fh, indent=2, ensure_ascii=False)
            fh.write("\n")

    print()
    print(f"{'DRY-RUN' if dry else 'APPLIED'}: pre={pre_count}, stripped={len(stripped)}, post={post_count}")
    print(f"Audit log: {AUDIT_OUT}")


if __name__ == "__main__":
    main()
