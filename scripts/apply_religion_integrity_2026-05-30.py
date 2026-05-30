#!/usr/bin/env python3
"""
Apply integrity-audit restructure to SCRIPTURE_RELIGIONS (2026-05-30).

Replaces the SCRIPTURE_RELIGIONS block in src/js/forge/codex-controls.js
with the workflow-synthesized 55-religion taxonomy from
AUDIT/2026-05-30-religion-wedge-integrity-raw.json (workflow
wf_ba0125c2-6ec).

Major restructures:
- Christianity → Christianity + Christian Gnosticism + Esoteric Christianity
- Judaism → Judaism + Samaritanism + Sabbatean-Frankist
- Buddhism → Buddhism + Bön
- Chinese → Confucianism + Daoism
- gnostic-dualist → Mandaeism + Manichaeism (bundled corpus stays in
  mandaeism for now; Lane A splits the corpus later)
- mesoamerican → Maya + Aztec/Mexica (umbrella retired)
- afro-diasporic → Haitian Vodou + Lucumí-Santería (bundled corpus
  stays in haitian-vodou for now; Lane A splits later)
- indigenous-na → Diné + Lakota + Haudenosaunee + Lenape (bundled
  corpus stays in lenape-walam-olum for now)
- modern-syncretic → Cheondogyo + Tenrikyō + Cao Đài
- modern-religions → Scientology + LaVeyan Satanism
- esoteric-occult → Western Alchemy + Renaissance Esotericism +
  Rosicrucian/Masonic + Modern Occult Revival + Thelema

Corpus moves implicit in religion definition below.

Usage:
    python3 scripts/apply_religion_integrity_2026-05-30.py --dry-run
    python3 scripts/apply_religion_integrity_2026-05-30.py --apply
"""

import argparse
import json
import re
import sys
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
CC = VAULT / "src/js/forge/codex-controls.js"
RAW = VAULT / "AUDIT/2026-05-30-religion-wedge-integrity-raw.json"


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true")
    g.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    dry = args.dry_run and not args.apply

    data = json.loads(RAW.read_text(encoding='utf-8'))['result']
    taxonomy = data['final_taxonomy']

    # Manual touch-ups vs. raw goblin output:
    # 1. mandaeism + manichaeism: synth flagged the bundled
    #    'mandaean-manichaean' corpus needs splitting. Until that
    #    Lane A work, assign the bundled corpus to MANDAEISM only
    #    (Mandaeism is living + has explicit doc nodes). Manichaeism
    #    wedge gets no corpus and renders empty — placeholder.
    # 2. afro-diasporic-liturgical: assign to haitian-vodou; lucumi
    #    wedge empty until corpus split.
    # 3. indigenous-north-american-corpus: bundled tradition mixes;
    #    assign to lenape-walam-olum (which contains the Sacred Pipe
    #    + Gayanashagowa + Walam Olum etc. as one corpus). Diné /
    #    Lakota / Haudenosaunee wedges empty until Lane A corpus
    #    split.
    # 4. mesopotamian label: synth proposed long label
    #    "Mesopotamian (Sumerian + Akkadian + Babylonian + Assyrian)"
    #    — shorten to "Mesopotamian" for pill UI fit.
    LABEL_OVERRIDES = {
        'mesopotamian': 'Mesopotamian',
    }
    CORPUS_OVERRIDES = {
        'mandaeism': ['mandaean-manichaean'],
        'manichaeism': [],
        'haitian-vodou': ['afro-diasporic-liturgical'],
        'lucumi-santeria': [],
        'lenape-walam-olum': ['indigenous-north-american-corpus'],
        'dine-navajo': [],
        'lakota-oglala': [],
        'haudenosaunee': [],
    }

    # Build the new JS block in dict-literal form, preserving the
    # original code structure exactly so insertion is line-for-line
    # comparable.
    js_lines = ["  const SCRIPTURE_RELIGIONS = {"]
    for r in taxonomy:
        rid = r['religion_id']
        label = LABEL_OVERRIDES.get(rid, r['label'])
        corpora = CORPUS_OVERRIDES.get(rid, r['corpora'])
        # Escape single quotes in label
        safe_label = label.replace("\\", "\\\\").replace("'", "\\'")
        corpora_list = ", ".join(f"'{c}'" for c in corpora)
        js_lines.append(
            f"    {repr(rid):24s}: {{ label: '{safe_label}', corpora: [{corpora_list}] }},"
        )
    js_lines.append("  };")
    new_block = "\n".join(js_lines)

    # Read source + find existing block to replace
    src = CC.read_text(encoding='utf-8')
    rx = re.compile(
        r"^  const SCRIPTURE_RELIGIONS = \{.*?^  \};",
        re.DOTALL | re.MULTILINE,
    )
    m = rx.search(src)
    if not m:
        print("ERROR: could not find SCRIPTURE_RELIGIONS block", file=sys.stderr)
        sys.exit(1)

    new_src = src[:m.start()] + new_block + src[m.end():]

    print(f"Old religions: {len(re.findall(r'^    .{{1,40}}: ', m.group(0), re.MULTILINE))}")
    print(f"New religions: {len(taxonomy)}")
    print(f"Block size: {len(m.group(0))} → {len(new_block)} bytes")

    if not dry:
        CC.write_text(new_src, encoding='utf-8')
        print("APPLIED to", CC)
    else:
        print("DRY-RUN — no write")


if __name__ == "__main__":
    main()
