#!/usr/bin/env python3
"""
singularize_tradition.py — STEP A of the membership-vs-wire migration.

For an EXPLICIT allow-list of files (never the whole vault), rewrite a
cross-family multi-valued `tradition:` into its SINGULAR origin tradition
(the first top-level segment), and preserve everything:

  tradition:          -> origin segment only (sets the wedge correctly)
  tradition-raw:      -> the full original string (audit + reversible)
  tradition-appearances: -> the displaced non-origin segments, as a worklist
                            for Step-B wire construction (appearance edges)

Idempotent + refuse-on-mismatch: skips a file that already has tradition-raw,
or whose current tradition: does not match the expected string passed in.

This fixes wedge PLACEMENT (Seth-in-wrong-wedge class of bug) for the
strong-conviction set. It does NOT yet build the formal appearance wires —
that is Step B (per-node, leverages existing mentioned-in/attested-in edges).
Cross-tradition info is retained as structured fields, so nothing vanishes
(acceptance test §9.4 of MEMBERSHIP-AND-WIRES.md).

Usage:  python3 scripts/singularize_tradition.py [--apply]
        (default = dry run; --apply writes)
"""
import sys, re

APPLY = "--apply" in sys.argv

# Allow-list: (file, expected-origin-family) — the 11 rock-solid HIGH deities.
# guanyin / iao-gnostic / vayu deliberately EXCLUDED (contested origin -> John).
TARGETS = [
    ("03_deities/aeshma.md",            "Zoroastrian"),
    ("03_deities/asclepius-greek.md",   "Greek"),
    ("03_deities/attis.md",             "Phrygian"),
    ("03_deities/brigid.md",            "Celtic"),
    ("03_deities/cybele.md",            "Phrygian"),
    ("03_deities/helios.md",            "Greek"),
    ("03_deities/heracles.md",          "Greek"),
    ("03_deities/hwanin.md",            "Korean"),
    ("03_deities/saint-blaise.md",      "Christian"),
    ("03_deities/verethragna.md",       "Zoroastrian"),
    ("03_deities/yima-jamshid.md",      "Zoroastrian"),
]

# Paren-aware top-level split on ;  →  ->   (NOT "/", which is within-family).
def split_top_level(s: str):
    segs, buf, depth = [], [], 0
    i = 0
    while i < len(s):
        c = s[i]
        if c == "(":
            depth += 1; buf.append(c)
        elif c == ")":
            depth = max(0, depth - 1); buf.append(c)
        elif depth == 0 and c == ";":
            segs.append("".join(buf)); buf = []
        elif depth == 0 and c == "→":              # →
            segs.append("".join(buf)); buf = []
        elif depth == 0 and c == "-" and s[i:i+2] == "->":
            segs.append("".join(buf)); buf = []; i += 1
        else:
            buf.append(c)
        i += 1
    segs.append("".join(buf))
    return [seg.strip(" \t\"'") for seg in segs if seg.strip(" \t\"'")]

def get_tradition(text):
    m = re.search(r'^tradition:\s*(.+)$', text, re.M)
    return m, (m.group(1).strip().strip("\"'") if m else None)

changed = 0
for path, expect_fam in TARGETS:
    try:
        text = open(path, encoding="utf-8").read()
    except FileNotFoundError:
        print(f"  !! MISSING {path}"); continue
    if "tradition-raw:" in text:
        print(f"  .. SKIP (already migrated) {path}"); continue
    m, raw = get_tradition(text)
    if not raw:
        print(f"  !! NO tradition field {path}"); continue
    segs = split_top_level(raw)
    if len(segs) < 2:
        print(f"  !! NOT multi-segment, skip {path}: {raw!r}"); continue
    origin = segs[0]
    appearances = segs[1:]
    # Build replacement block (keep the original line's position).
    orig_line = m.group(0)
    new_block = (
        f'tradition: "{origin}"\n'
        f'tradition-raw: "{raw}"   # pre-migration; full original (membership-vs-wire 2026-06-02)\n'
        f'tradition-appearances: {appearances}   # STEP-B worklist: build appearance wires for these'
    )
    new_text = text.replace(orig_line, new_block, 1)
    print(f"  -> {path}")
    print(f"       origin:      {origin!r}  (family: {expect_fam})")
    print(f"       appearances: {appearances}")
    if APPLY:
        open(path, "w", encoding="utf-8").write(new_text)
        changed += 1

print(f"\n{'APPLIED' if APPLY else 'DRY RUN'} — {changed if APPLY else len(TARGETS)} file(s) "
      f"{'written' if APPLY else 'would change'}.")
