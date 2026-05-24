#!/usr/bin/env python3
"""
Apply Phase B-DATING-3 sweep proposals from the goblin TSV.

Reads AUDIT/2026-05-24-dating-sweep-proposals.tsv, finds each node's
YAML file, and APPENDS missing dating fields without touching existing
keys. Idempotent — re-running is safe; existing dating_basis values
are preserved.

Usage:
    python3 scripts/apply_dating_proposals.py --dry-run     # preview
    python3 scripts/apply_dating_proposals.py --apply       # write

Phase B-DATING-3 (2026-05-24).
"""
import sys
import argparse
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
TSV   = VAULT / "AUDIT/2026-05-24-dating-sweep-proposals.tsv"

# Build an id → path map by scanning every lens folder's MDs.
# Node IDs derive from frontmatter `id:` (not filename), so a pure
# filename lookup misses ~76 nodes whose filename differs.
import re

_ID_MAP = None
def _build_id_map():
    global _ID_MAP
    _ID_MAP = {}
    for lens in sorted((VAULT).glob("[0-9][0-9]_*/")):
        if not lens.is_dir():
            continue
        for md in lens.rglob("*.md"):
            try:
                text = md.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            if not text.startswith("---"):
                continue
            # Grab the frontmatter slice. We don't need a full parser —
            # just the `id:` line near the top.
            m = re.search(r'^id\s*:\s*["\']?([^"\'\n]+?)["\']?\s*$',
                          text[:2000], re.MULTILINE)
            if m:
                nid = m.group(1).strip()
                if nid not in _ID_MAP:
                    _ID_MAP[nid] = md
            # Also index by filename stem as fallback (some nodes have
            # no `id:` field and rely on the build's derive_id).
            stem = md.stem
            if stem not in _ID_MAP:
                _ID_MAP[stem] = md

def find_node_file(node_id: str):
    if _ID_MAP is None:
        _build_id_map()
    return _ID_MAP.get(node_id)

def has_key(fm_lines, key_variants):
    """True if any of the key variants is present at the top level."""
    for line in fm_lines:
        stripped = line.lstrip()
        for k in key_variants:
            if stripped.startswith(f"{k}:"):
                return True
    return False

def apply_one(file: Path, year, basis: str, source: str, notes: str, dry_run: bool):
    text = file.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return False, "no frontmatter"

    # Split: leading `---\n`, frontmatter body, `\n---\n` or `\n---`,
    # body. We keep the EXACT bytes between the markers so write-back
    # is a clean rewrite (no leading-newline strip — see B-DATING-3
    # corruption: stripping the \n after opening --- joined `---type:`
    # into one line + broke YAML parsing).
    # Find end-of-opening-marker: after `---` skip exactly one \n (if
    # present) so we land at the first content char.
    after_open = 3
    if after_open < len(text) and text[after_open] == '\r':
        after_open += 1
    if after_open < len(text) and text[after_open] == '\n':
        after_open += 1
    open_marker = text[:after_open]      # e.g. "---\n"
    rest = text[after_open:]
    # Find closing marker — a line that is just `---` (possibly with
    # trailing whitespace).
    import re as _re
    m = _re.search(r'(?m)^---\s*$', rest)
    if not m:
        return False, "malformed frontmatter (no closing ---)"
    fm = rest[:m.start()]
    close_marker = rest[m.start():m.end()]
    body = rest[m.end():]
    lines = fm.split("\n")

    # Don't overwrite anything that's already set.
    has_de     = has_key(lines, ["date-earliest", "date_earliest",
                                  "date-composed-earliest", "date-born",
                                  "date-start", "date-emergence",
                                  "date-built-earliest", "date-attested-earliest",
                                  "date-founded-earliest", "period-earliest",
                                  "period-active-earliest", "date-composed",
                                  "date_composed_earliest", "date_emergence",
                                  "date_attested_earliest", "date_built_earliest"])
    has_basis  = has_key(lines, ["dating-basis", "dating_basis"])
    has_source = has_key(lines, ["dating-basis-source", "dating_basis_source"])
    has_notes  = has_key(lines, ["dating-basis-notes", "dating_basis_notes"])

    additions = []
    if not has_de and year is not None:
        additions.append(f"date-earliest: {year}")
    if not has_basis and basis:
        additions.append(f"dating-basis: {basis}")
    if not has_source and source and "field-rename" not in source.lower():
        # Quote source — strip leading/trailing whitespace.
        s = source.strip().replace('"', '\\"')
        additions.append(f'dating-basis-source: "{s}"')
    if not has_notes and notes:
        n = notes.strip().replace('"', '\\"')
        additions.append(f'dating-basis-notes: "{n}"')

    if not additions:
        return False, "all fields already present"

    if dry_run:
        return True, f"WOULD add {len(additions)}: {', '.join(a.split(':')[0] for a in additions)}"

    # Append before closing ---. Reconstruct: open_marker + fm
    # (with trailing newline) + additions + newline + close_marker + body.
    new_fm = fm.rstrip("\n") + "\n" + "\n".join(additions) + "\n"
    new_text = open_marker + new_fm + close_marker + body
    file.write_text(new_text, encoding="utf-8")
    return True, f"added {len(additions)} fields"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="Write changes to YAML files")
    ap.add_argument("--dry-run", action="store_true", help="Preview only (default)")
    ap.add_argument("--limit", type=int, default=None, help="Limit rows for testing")
    args = ap.parse_args()
    apply = args.apply and not args.dry_run

    applied = 0
    skipped_rename = 0
    skipped_present = 0
    errors = 0
    not_found = []

    with open(TSV, encoding="utf-8") as f:
        for i, line in enumerate(f):
            line = line.rstrip("\n")
            if not line or line.startswith("#") or line.startswith("Section"):
                continue
            parts = line.split("\t")
            if len(parts) < 6:
                continue
            node_id, current_basis, new_basis, year_s, source, notes = parts[:6]
            # Section 1 — pure field-rename, handled by the build coalesce extension.
            if "field-rename" in source.lower():
                skipped_rename += 1
                continue

            fpath = find_node_file(node_id)
            if not fpath:
                not_found.append(node_id)
                errors += 1
                continue

            try:
                year = int(year_s) if year_s and year_s != "—" else None
            except ValueError:
                year = None

            ok, msg = apply_one(fpath, year, new_basis, source, notes, dry_run=not apply)
            if ok:
                applied += 1
                if i < 20:
                    print(f"[{node_id}] {msg}")
            else:
                skipped_present += 1

            if args.limit and applied >= args.limit:
                break

    print()
    print(f"Mode:                  {'APPLY' if apply else 'DRY-RUN'}")
    print(f"Applied:               {applied}")
    print(f"Skipped (field-rename): {skipped_rename}")
    print(f"Skipped (fields exist): {skipped_present}")
    print(f"Errors / not-found:    {errors}")
    if not_found:
        print(f"Missing nodes ({len(not_found)}):", ", ".join(not_found[:10]),
              "..." if len(not_found) > 10 else "")

if __name__ == "__main__":
    main()
