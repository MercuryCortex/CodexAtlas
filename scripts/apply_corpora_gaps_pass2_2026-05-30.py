#!/usr/bin/env python3
"""
Apply Pass-2 of the canon audit (2026-05-30): ADD 17 high-priority
corpora + 1 reclassification, sourced from
AUDIT/2026-05-30-corpora-gap-pass2-raw.json (workflow wf_177bd1f2-60a).

Reclassifications:
- phase-7-009-outline-of-esoteric-science: theosophy-corpus →
  anthroposophy-corpus (Steiner 1912 split from Adyar Theosophy
  is an explicit doctrinal break; mis-filing under theosophy
  conflates two distinct traditions per Lachman 2007).

Renaissance-magic and western-alchemy ADDS create new wedges that
overlap with hermetica's Renaissance-recovery + Alchemical sections;
wheel-rendering picks the first BRI.idx match, so the new corpora
win at render. The legacy hermetica entries become dead-code for
those specific docs (acceptable for this commit; surgical removal
of the hermetica sub-sections can be a follow-up).

Same reuse pattern as apply_corpora_gaps_2026-05-30.py.

Usage:
    python3 scripts/apply_corpora_gaps_pass2_2026-05-30.py --dry-run
    python3 scripts/apply_corpora_gaps_pass2_2026-05-30.py --apply
"""

import argparse
import json
import re
import sys
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
APP_JS = VAULT / "src/js/app.js"
RAW = VAULT / "AUDIT/2026-05-30-corpora-gap-pass2-raw.json"

RECLASSIFICATIONS = [
    ('phase-7-009-outline-of-esoteric-science', 'theosophy-corpus'),
]

# Hue palette continued from Phase B (offset so colors don't collide).
HUE_BY_INDEX = [
    '#bb6655', '#5a8a3a', '#cc9966', '#8866aa', '#3a8a8a',
    '#aa3a5a', '#5a9a8f', '#cc8855', '#aaaa3a', '#6a3a8a',
    '#3aaa6a', '#8a3aaa', '#aa5a3a', '#6655aa', '#aa9a3a',
    '#5a8aaa', '#aa6a5a',
]


def load_proposals():
    data = json.loads(RAW.read_text(encoding='utf-8'))['result']
    return data['high_priority_adds']


def doc_title(doc_id):
    candidates = list(VAULT.glob(f"02_documents/**/{doc_id}.md"))
    if not candidates:
        return None
    text = candidates[0].read_text(encoding='utf-8')
    m = re.match(r'^---\n(.*?)\n---', text, re.DOTALL)
    if not m:
        return None
    fm = m.group(1)
    for key in ('title', 'name'):
        m2 = re.search(rf'^{key}:\s*(.*)$', fm, re.MULTILINE)
        if m2:
            v = m2.group(1).strip().strip('"').strip("'")
            return re.sub(r'\s*\([^)]{30,}\)$', '', v).strip()[:80]
    return None


def build_corpus_block(corpus_id, religion_label, docs, color):
    book_lines = []
    missing = []
    for did in docs:
        title = doc_title(did)
        if title is None:
            missing.append(did)
            title = did
        safe = title.replace("\\", "\\\\").replace("'", "\\'")
        book_lines.append(f"        {{ id: '{did}', label: '{safe}' }},")
    indented = "\n".join(book_lines)
    block = (
        f"  '{corpus_id}': {{\n"
        f"    label: {json.dumps(religion_label)},\n"
        f"    available: true,\n"
        f"    sections: [\n"
        f"      {{ id: '{corpus_id}-main', label: {json.dumps(religion_label)}, color: '{color}', books: [\n"
        f"{indented}\n"
        f"      ]}},\n"
        f"    ],\n"
        f"  }},\n"
    )
    return block, missing


def remove_book_in_corpus(text, corpus_key, book_id):
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
    m = re.search(r'(^const SCRIPTURE_CORPORA = \{)', text, re.MULTILINE)
    if not m:
        return text, False
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

    high_adds = load_proposals()
    text = APP_JS.read_text(encoding='utf-8')

    blocks = []
    log = []
    total_docs = 0
    missing_files = []
    for i, item in enumerate(high_adds):
        corpus_id = item['corpus_id']
        religion = item['religion_label']
        docs = list(dict.fromkeys(item['docs_to_assign']))
        color = HUE_BY_INDEX[i % len(HUE_BY_INDEX)]
        block, missing = build_corpus_block(corpus_id, religion, docs, color)
        blocks.append(block)
        log.append(f"  +corpus  {corpus_id:42s}  {len(docs):3d} docs  ({religion[:55]})")
        total_docs += len(docs)
        for m in missing:
            missing_files.append(f"{corpus_id}/{m}")

    # Reclassifications
    for doc_id, src in RECLASSIFICATIONS:
        text, ok = remove_book_in_corpus(text, src, doc_id)
        log.append(f"  reclass  {doc_id:50s} out-of {src:30s} {'OK' if ok else 'MISS'}")

    text, ok_insert = insert_corpora(text, blocks)

    print("\n".join(log))
    print()
    print(f"Corpora added: {len(blocks)}")
    print(f"Total doc assignments: {total_docs}")
    print(f"Missing files (label fallback to id): {len(missing_files)}")
    for m in missing_files:
        print(f"  - {m}")
    print(f"Insert: {'OK' if ok_insert else 'FAIL'}")

    if not dry and ok_insert:
        APP_JS.write_text(text, encoding='utf-8')
        print("APPLIED")
    elif dry:
        print("DRY-RUN — no write")
    else:
        print("ABORT — insertion failed")
        sys.exit(2)


if __name__ == "__main__":
    main()
