#!/usr/bin/env python3
"""
Apply Phase B of the canon audit (2026-05-30): ADD 41 missing corpora
+ apply 8 reclassifications, sourced from AUDIT/2026-05-30-corpora-gap-raw.json
(workflow wf_13cfb086-36e).

Each new corpus gets a single section seeded with its proposed docs.
The Lane B follow-up can sub-divide sections later. Reclassifications
remove a book entry from one corpus and add it to another.

Dup-flag resolutions (per scholarly primary classification):
- phase-4-095-new-testament-canon → keep in bible (canonical-formation
  context), drop from apostolic-fathers
- phase-7-004-science-and-health → new-thought-corpus (Mary Baker
  Eddy = Christian Science = New Thought primary)
- Mashafa Kidan + Ethiopian Sinodos → keep in ethiopic-tewahedo-canon,
  drop from syriac-christianity
- phase-4-030-pseudo-dionysius + phase-4-celestial-hierarchy →
  byzantine-orthodox primary, drop from neoplatonist-corpus
- phase-5-008-eriugena-periphyseon → latin-catholic-medieval primary
  (Carolingian Latin), drop from byzantine-orthodox + neoplatonist
- phase-5-035-hatha-yoga-pradipika → shaiva-tantric-canon
  (Natha-yogic Shaiva-aligned)

Usage:
    python3 scripts/apply_corpora_gaps_2026-05-30.py --dry-run
    python3 scripts/apply_corpora_gaps_2026-05-30.py --apply
"""

import argparse
import json
import re
import sys
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
APP_JS = VAULT / "src/js/app.js"
RAW = VAULT / "AUDIT/2026-05-30-corpora-gap-raw.json"

# Dup-flag resolutions — keys are corpora to EXCLUDE these doc IDs from.
EXCLUDE_FROM_CORPUS = {
    'apostolic-fathers': {'phase-4-095-new-testament-canon'},
    'syriac-christianity': {'phase-4-080-garima-gospels'},
    'neoplatonist-corpus': {'phase-4-030-pseudo-dionysius', 'phase-4-100-celestial-hierarchy', 'phase-5-008-eriugena-periphyseon', 'phase-4-074-liber-de-causis-arabic-theology-aristotle'},
    'byzantine-orthodox': {'phase-5-008-eriugena-periphyseon'},
    'christian-theosophy': {'phase-7-004-science-and-health'},
}

# Reclassifications: (doc_id, source_corpus, target_corpus) — source is
# where to REMOVE the entry; target is where it should be (the target
# corpus is created in the high-priority-adds pass, so we don't need to
# re-add — it's already in that new corpus's docs_to_assign list).
RECLASSIFICATIONS = [
    ('phase-1-013-baal-cycle', 'mesopotamian'),
    ('phase-1-014-ugaritic-ritual-texts', 'mesopotamian'),
    ('phase-4-022-chaldean-oracles', 'greek-scripture'),
    ('phase-7-032-kybalion', 'hermetica'),
    ('phase-2-030-euripides-bacchae', 'greek-scripture'),
    ('phase-2-040-orphic-gold-tablets', 'greek-scripture'),
    ('phase-3-027-derveni-papyrus', 'greek-scripture'),
    ('phase-3-028-orphic-hymns', 'greek-scripture'),
]

# Hue palette for new corpora — keep distinct from existing
# RELIGION_COLOR palette where possible.
HUE_BY_INDEX = [
    '#9aa55a', '#5a7aa4', '#c44a5a', '#6e8a5a', '#a08850', '#7a6a8a',
    '#c89a3a', '#9a4a3a', '#3a8a6a', '#c4a05a', '#5a9a8f', '#8a5ac4',
    '#d99a3a', '#3a6cc4', '#d4a55a', '#a89880', '#c25450', '#8a7a5a',
    '#5a8a6a', '#7a9a5a', '#aa7a55', '#5a6cc4', '#955aa5', '#bb6655',
    '#669966', '#8a3a3a', '#3a8a3a', '#6a5a8a', '#a55a55', '#5a9a5a',
    '#a55a3a', '#3a5a8a', '#9a6a3a', '#5a5a8a', '#6a8a5a', '#8a6a3a',
    '#a05a3a', '#5a3a8a', '#3a8a8a', '#8a3a6a', '#7a4a9a',
]


def load_proposals():
    data = json.loads(RAW.read_text(encoding='utf-8'))['result']
    return data['high_priority_adds'], data['reclassifications']


def doc_title(doc_id: str):
    """Look up a doc's title from its YAML. Returns short label or doc_id."""
    candidates = list(VAULT.glob(f"02_documents/**/{doc_id}.md"))
    if not candidates:
        return None  # signal doc missing
    text = candidates[0].read_text(encoding='utf-8')
    # frontmatter
    m = re.match(r'^---\n(.*?)\n---', text, re.DOTALL)
    if not m:
        return None
    fm = m.group(1)
    for key in ('title', 'name'):
        m2 = re.search(rf'^{key}:\s*(.*)$', fm, re.MULTILINE)
        if m2:
            v = m2.group(1).strip().strip('"').strip("'")
            # short label — strip parenthetical
            short = re.sub(r'\s*\([^)]{30,}\)$', '', v).strip()
            return short[:80]
    return None


def build_corpus_block(corpus_id, religion_label, docs, color):
    """Build a multi-line JS object literal for a single corpus."""
    book_lines = []
    missing = []
    for did in docs:
        title = doc_title(did)
        if title is None:
            missing.append(did)
            title = did  # fall back to id as label
        # escape single-quotes in title
        safe = title.replace("\\", "\\\\").replace("'", "\\'")
        book_lines.append(f"        {{ id: '{did}', label: '{safe}' }},")
    indented_books = "\n".join(book_lines)
    block = (
        f"  '{corpus_id}': {{\n"
        f"    label: {json.dumps(religion_label)},\n"
        f"    available: true,\n"
        f"    sections: [\n"
        f"      {{ id: '{corpus_id}-main', label: {json.dumps(religion_label)}, color: '{color}', books: [\n"
        f"{indented_books}\n"
        f"      ]}},\n"
        f"    ],\n"
        f"  }},\n"
    )
    return block, missing


def remove_book_in_corpus(text, corpus_key, book_id):
    """Same regex as Phase A patcher — drop a single book line."""
    rx_outer = re.compile(rf"^  '{re.escape(corpus_key)}':\s*\{{", re.MULTILINE)
    m = rx_outer.search(text)
    if not m:
        return text, False
    start = m.start()
    depth = 0
    i = m.end() - 1
    while i < len(text):
        ch = text[i]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                j = i + 1
                while j < len(text) and text[j] != '\n':
                    j += 1
                if j < len(text) and text[j] == '\n':
                    j += 1
                block = text[start:j]
                rx_book = re.compile(
                    rf"^\s*\{{[^{{}}\n]*?id:\s*'{re.escape(book_id)}'[^{{}}\n]*?\}},?\s*\n",
                    re.MULTILINE,
                )
                new_block, n = rx_book.subn('', block)
                if n == 0:
                    return text, False
                return text[:start] + new_block + text[j:], True
        i += 1
    return text, False


def insert_corpora(text, blocks):
    """Insert new corpus blocks BEFORE the SCRIPTURE_CORPORA closing `};` line."""
    # find: end of SCRIPTURE_CORPORA = { ... };
    m = re.search(r'(^const SCRIPTURE_CORPORA = \{)', text, re.MULTILINE)
    if not m:
        return text, False
    # walk balance from this opening { to find the matching }
    start = m.end() - 1
    depth = 0
    i = start
    while i < len(text):
        ch = text[i]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                # i = position of closing }
                # insert blocks just before this }
                joined = "".join(blocks)
                return text[:i] + joined + text[i:], True
        i += 1
    return text, False


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true")
    g.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    dry = args.dry_run and not args.apply

    high_adds, reclasses = load_proposals()
    text = APP_JS.read_text(encoding='utf-8')

    # Build blocks
    blocks = []
    summary = []
    total_docs = 0
    total_missing = []
    for i, item in enumerate(high_adds):
        corpus_id = item['corpus_id']
        religion = item['religion_label']
        docs = list(dict.fromkeys(item['docs_to_assign']))  # dedup preserve-order
        # apply exclude-from-corpus dup-flag resolutions
        if corpus_id in EXCLUDE_FROM_CORPUS:
            docs = [d for d in docs if d not in EXCLUDE_FROM_CORPUS[corpus_id]]
        color = HUE_BY_INDEX[i % len(HUE_BY_INDEX)]
        block, missing = build_corpus_block(corpus_id, religion, docs, color)
        blocks.append(block)
        summary.append(f"  +corpus  {corpus_id:30s}  {len(docs):3d} docs  ({religion[:50]})")
        total_docs += len(docs)
        for m in missing:
            total_missing.append(f"{corpus_id}/{m}")

    # Apply reclassifications — remove from source corpus.
    reclass_log = []
    for doc_id, src in RECLASSIFICATIONS:
        new_text, ok = remove_book_in_corpus(text, src, doc_id)
        if ok:
            text = new_text
        reclass_log.append(f"  reclass  {doc_id:42s}  out-of {src:25s}  {'OK' if ok else 'MISS'}")

    # Insert new corpora before the closing }
    text, ok_insert = insert_corpora(text, blocks)

    print("\n".join(summary))
    print()
    print("\n".join(reclass_log))
    print()
    print(f"Corpora added:  {len(blocks)}")
    print(f"Total docs assigned to new corpora: {total_docs}")
    print(f"Books missing from vault (label fallback to id): {len(total_missing)}")
    if total_missing:
        for m in total_missing[:5]:
            print(f"  - {m}")
        if len(total_missing) > 5:
            print(f"  ... +{len(total_missing) - 5} more")
    print(f"Insert: {'OK' if ok_insert else 'FAIL'}")

    if not dry and ok_insert:
        APP_JS.write_text(text, encoding='utf-8')
        print("APPLIED")
    elif dry:
        print("DRY-RUN — no write")
    else:
        print("ABORT — insertion failed; no write")
        sys.exit(2)


if __name__ == "__main__":
    main()
