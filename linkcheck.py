#!/usr/bin/env python3
"""
linkcheck.py — vault-wide [[wikilink]] resolution + dead-link gate.

Three modes:

  (default)          — scan vault, write 99_ingest/audit_dead{,_files}.txt,
                       print summary, exit 0.

  --write-baseline   — refresh AUDIT/dead-link-baseline.txt with the
                       current dead set (one target per line, no count).
                       Use ONLY when intentionally accepting the current
                       leak as the new floor (e.g. after a sweep).

  --baseline         — gate mode for the pre-commit hook + CI:
                       compare current dead set against
                       AUDIT/dead-link-baseline.txt. Exit 0 if every
                       current dead target is in the baseline (no new
                       breakage). Exit 1 with a diff if any new dead
                       target appeared. Pre-existing baseline targets
                       are TOLERATED but FROZEN — they can only shrink,
                       never grow.

  --quiet            — suppress per-target output (the summary still prints).

TYRANT remediation Phase 2 (2026-05-25) — added the baseline mechanism
per audit findings P0 #1 + P2 #13. Pre-commit hook now invokes
`linkcheck.py --baseline` so the WIRING LAW (HOW-WE-WORK §5.4) finally
has a mechanism behind it. The existing ~594 dead targets are
captured as the floor; new ones cannot land.

Stdlib only.
"""
import argparse
import glob
import os
import re
import sys
from collections import Counter
from pathlib import Path

VAULT = Path(__file__).resolve().parent
INGEST = VAULT / "99_ingest"
BASELINE_PATH = VAULT / "AUDIT" / "dead-link-baseline.txt"

# Markdown wikilink — captures the slug before any `|` (display) or
# `#` (anchor). Matches the pattern used vault-wide.
LINK_RE = re.compile(r'\[\[([^\]|#]+?)(?:[#|][^\]]*)?\]\]')


def scan_vault():
    """Walk every .md file and return (stems, targets, target_files)."""
    md_files = glob.glob(str(VAULT / "**/*.md"), recursive=True)
    stems = {Path(f).stem: f for f in md_files}
    targets = Counter()
    target_files = {}
    for f in md_files:
        try:
            text = open(f, encoding="utf-8").read()
        except Exception:
            continue
        for m in LINK_RE.finditer(text):
            t = m.group(1).strip().split('/')[-1]
            if not t:           # `[[/]]` and similar — ignore
                continue
            targets[t] += 1
            target_files.setdefault(t, set()).add(f)
    dead = [(t, c) for t, c in targets.items() if t not in stems]
    dead.sort(key=lambda x: -x[1])
    return md_files, dead, target_files


def write_report(dead, target_files):
    """Write 99_ingest/audit_dead.txt + audit_dead_files.txt (legacy paths)."""
    INGEST.mkdir(parents=True, exist_ok=True)
    with open(INGEST / "audit_dead.txt", "w") as out:
        for t, c in dead:
            out.write(f'{c}\t{t}\n')
    with open(INGEST / "audit_dead_files.txt", "w") as out:
        for t, c in dead:
            out.write(f'{c}\t{t}\t{"; ".join(sorted(target_files[t]))}\n')


def load_baseline():
    """Read AUDIT/dead-link-baseline.txt → set of target slugs.
    Lines starting with `#` are comments; blank lines ignored."""
    if not BASELINE_PATH.exists():
        return None
    out = set()
    for ln in BASELINE_PATH.read_text(encoding="utf-8").splitlines():
        ln = ln.strip()
        if not ln or ln.startswith("#"):
            continue
        # Tolerate `count\ttarget` rows OR plain `target`.
        if "\t" in ln:
            ln = ln.split("\t", 1)[1].strip()
        out.add(ln)
    return out


def write_baseline(dead):
    """Refresh AUDIT/dead-link-baseline.txt with the current dead set."""
    BASELINE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(BASELINE_PATH, "w", encoding="utf-8") as out:
        out.write("# AUDIT/dead-link-baseline.txt — TYRANT Phase 2 floor.\n")
        out.write("# One dead-link target per line. Pre-commit hook tolerates\n")
        out.write("# these but refuses any NEW dead target not on this list.\n")
        out.write("# To accept current state as the new floor, run:\n")
        out.write("#     python3 linkcheck.py --write-baseline\n")
        out.write("# See AUDIT/2026-05-25-tyrant-remediation-plan.md Phase 2.\n")
        out.write(f"# Captured {len(dead)} targets on first write.\n\n")
        for t, _c in sorted(dead, key=lambda x: x[0]):
            out.write(f"{t}\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n", 1)[0])
    ap.add_argument("--baseline", action="store_true",
                    help="Gate mode: fail on regression vs AUDIT/dead-link-baseline.txt")
    ap.add_argument("--write-baseline", action="store_true",
                    help="Capture current dead set as the new baseline")
    ap.add_argument("--quiet", action="store_true", help="Suppress per-target output")
    args = ap.parse_args()

    md_files, dead, target_files = scan_vault()
    write_report(dead, target_files)

    dead_targets = {t for t, _ in dead}
    occ = sum(c for _, c in dead)

    if args.write_baseline:
        write_baseline(dead)
        print(f"[linkcheck] wrote baseline: {len(dead)} targets to {BASELINE_PATH.relative_to(VAULT)}")
        return 0

    if args.baseline:
        baseline = load_baseline()
        if baseline is None:
            # No baseline yet — seed it on first run.
            write_baseline(dead)
            print(f"[linkcheck] no baseline existed; seeded with {len(dead)} targets. "
                  f"Subsequent runs will gate against this floor.")
            return 0
        # New dead targets = current dead - baseline.
        new_dead = sorted(dead_targets - baseline)
        # Drained baseline targets (current dead ⊂ baseline minus those now resolved).
        resolved = sorted(baseline - dead_targets)
        if new_dead:
            print(f"[linkcheck] ✗ REGRESSION — {len(new_dead)} new dead target(s) not in baseline:")
            for t in new_dead[:50]:
                print(f"    - {t}")
            if len(new_dead) > 50:
                print(f"    ... and {len(new_dead) - 50} more")
            print(f"")
            print(f"  Either stub/wire the missing target(s) before commit,")
            print(f"  or — if intentional — refresh the baseline with:")
            print(f"      python3 linkcheck.py --write-baseline")
            print(f"  (NOT recommended without explicit John signoff per")
            print(f"   AUDIT/2026-05-25-tyrant-remediation-plan.md Phase 3.)")
            return 1
        msg = f"[linkcheck] ✓ no regression — {len(dead)} dead targets (baseline holds)"
        if resolved:
            msg += f"; {len(resolved)} resolved since baseline"
        print(msg)
        return 0

    # Default mode — report and exit 0.
    if not args.quiet:
        print(f'TOTAL DEAD: {len(dead)} targets / {occ} occurrences')
        print(f'TOTAL FILES: {len(md_files)}')
    return 0


if __name__ == "__main__":
    sys.exit(main())
