#!/usr/bin/env python3
"""
Apply Phase-A of the canon audit (2026-05-30):

- Remove 10 non-canonical corpus blocks from SCRIPTURE_CORPORA in
  src/js/app.js
- Remove specific book-id entries from kept corpora (per modify list)
- Rename 'mandaean-manichaean' → 'mandaean-corpus' AFTER dropping its
  3 Manichaean texts (Cologne Mani Codex, Kephalaia, Shabuhragan)

Deferred to later phases:
- Splits (vedas → 3 corpora, tipitaka → 3 corpora)
- ADDS that require NEW_NODE_NEEDED file creation (Lane A)
- ADDS of existing-vault books (separate Phase B for safer review)

Source of truth: AUDIT/2026-05-30-canon-audit-raw.json (workflow
wf_5d250547-e39 output).

Usage:
    python3 scripts/apply_canon_audit_2026-05-30.py --dry-run
    python3 scripts/apply_canon_audit_2026-05-30.py --apply
"""

import argparse
import re
import sys
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
APP_JS = VAULT / "src/js/app.js"

# Corpora to remove ENTIRELY — they're not anyone's canonical scripture.
CORPORA_TO_REMOVE = {
    'quran',                    # duplicate of quran-manzil (Nöldeke chronology is a lens, not a canon)
    'islamic-theological',      # kalam/falsafa/tasawwuf, not canon
    'kebra-nagast',             # national epic, not in Tewahedo 81-book canon
    'south-asian-modernism',    # modern thought, not canon
    'nag-hammadi',              # Gnostic suppressed library, not active-religion canon
    'hermetica',                # philosophical-magical, no organized canon
    'cathar-bogomil',           # extinguished medieval heresies
    'sufi-persian',             # Persian Sufi poetry, not Islamic canon
    'spanish-mystical',         # Catholic mystics' writings, not canon
    'reformation',              # Reformation tracts, not canon (Bible is)
}

# Books to REMOVE from kept corpora — they're inside the corpus block
# but aren't canonical content for that religion (source-critical
# reconstructions, harmonies, hagiography, textual witnesses, etc.).
BOOKS_TO_REMOVE = {
    'bible': [
        'phase-2-005-hebrew-bible-j-source',
        'phase-2-007-hebrew-bible-e-source',
        'phase-2-011-hebrew-bible-d-source',
        'phase-2-018-hebrew-bible-p-source',
        'phase-2-010-hebrew-bible-early-prophets',
        'phase-2-019-deuteronomistic-history',
        'phase-3-001-second-third-isaiah',
        'phase-3-014-q-source',
        'phase-3-010-sibylline-oracles',
        'phase-3-011-dead-sea-scrolls',
        'phase-3-006-septuagint',
        'phase-4-108-peshitta',
        'phase-4-080-garima-gospels',
        'phase-4-082-ethiopic-biblical-canon',
        'phase-4-037-diatessaron',
    ],
    'tanakh': [
        'phase-2-005-hebrew-bible-j-source',
        'phase-2-007-hebrew-bible-e-source',
        'phase-2-011-hebrew-bible-d-source',
        'phase-2-018-hebrew-bible-p-source',
        'phase-2-010-hebrew-bible-early-prophets',
        'phase-2-019-deuteronomistic-history',
        'phase-3-001-second-third-isaiah',
        'phase-3-011-dead-sea-scrolls',
    ],
    'ethiopic-tewahedo-canon': [
        'phase-4-080-garima-gospels',
        'phase-5-036-mashafa-mistir-giyorgis',
        'phase-5-038-mashafa-berhan',
        'phase-5-037-fetha-nagast',
        'phase-5-039-sinkessar-synaxarium',
        'phase-8-008-kebra-nagast',
        'phase-7-040-walatta-petros-hagiography',
    ],
    'greek-scripture': [
        'phase-3-002-plato-dialogues',
        'phase-3-022-plato-timaeus-critias-atlantis',
        'phase-3-003-aristotle-metaphysics',
        'phase-4-022-chaldean-oracles',
        'phase-2-028-herodotus-histories-book-2',
    ],
    'egyptian-scripture': [
        'phase-1-012-amarna-letters',
        'phase-3-025-manetho-aegyptiaca',
        'phase-3-026-diodorus-bibliotheca-book-1',
        'phase-4-072-plutarch-de-iside-et-osiride',
        'phase-2-028-herodotus-histories-book-2',
    ],
    'confucian-classics': [
        'phase-2-025-mozi',
        'phase-2-026-han-feizi',
        'phase-2-024-xunzi',
    ],
    'norse-eddic': [
        'phase-8-018-kalevala',           # Finno-Karelian, not Norse
    ],
    'mandaean-manichaean': [
        'phase-4-014-cologne-mani-codex',
        'phase-4-015-kephalaia-of-the-teacher',
        'phase-4-016-shabuhragan',
    ],
    'rabbinic-corpus': [
        'phase-5-013-hekhalot-literature',  # reclassify to kabbalistic
    ],
}


def find_corpus_block(text: str, key: str) -> "tuple[int, int] | None":
    """Find the line-aligned span of a top-level corpus block.

    Looks for a line beginning with two-space indent + the quoted key,
    then walks brace-balance through the value object until the closing
    `},` line that returns to two-space indent.
    """
    rx = re.compile(rf"^  '{re.escape(key)}':\s*\{{", re.MULTILINE)
    m = rx.search(text)
    if not m:
        return None
    start = m.start()
    depth = 0
    i = m.end() - 1  # position of '{'
    while i < len(text):
        ch = text[i]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                # find end of line (consume trailing comma + newline)
                j = i + 1
                while j < len(text) and text[j] != '\n':
                    j += 1
                # include the final newline
                if j < len(text) and text[j] == '\n':
                    j += 1
                return (start, j)
        i += 1
    return None


def remove_corpus(text: str, key: str) -> "tuple[str, bool]":
    span = find_corpus_block(text, key)
    if not span:
        return text, False
    return text[:span[0]] + text[span[1]:], True


def remove_book_in_corpus(text: str, corpus_key: str, book_id: str) -> "tuple[str, bool]":
    """Remove a single book entry line from inside a corpus's sections.

    Book entry shape:
        { id: 'phase-X-NNN-foo', label: '...' },
    Allows variations in spacing. Returns (new_text, ok).
    """
    span = find_corpus_block(text, corpus_key)
    if not span:
        return text, False
    block = text[span[0]:span[1]]
    # match a single line containing the book id within an object literal
    rx = re.compile(
        rf"^\s*\{{[^{{}}\n]*?id:\s*'{re.escape(book_id)}'[^{{}}\n]*?\}},?\s*\n",
        re.MULTILINE,
    )
    new_block, n = rx.subn('', block)
    if n == 0:
        return text, False
    return text[:span[0]] + new_block + text[span[1]:], True


def rename_corpus(text: str, old_key: str, new_key: str, new_label=None) -> "tuple[str, bool]":
    """Replace the corpus key + optionally the label inside that block."""
    span = find_corpus_block(text, old_key)
    if not span:
        return text, False
    block = text[span[0]:span[1]]
    block = block.replace(f"'{old_key}':", f"'{new_key}':", 1)
    if new_label is not None:
        block = re.sub(r"label:\s*'[^']*'", f"label: '{new_label}'", block, count=1)
    return text[:span[0]] + block + text[span[1]:], True


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true")
    g.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    dry = args.dry_run and not args.apply

    text = APP_JS.read_text(encoding="utf-8")
    pre_len = len(text)
    pre_lines = text.count('\n')

    log = []

    # 1. Remove the 10 non-canonical corpora.
    for key in sorted(CORPORA_TO_REMOVE):
        text, ok = remove_corpus(text, key)
        log.append(f"  remove-corpus  {key:32s}  {'OK' if ok else 'MISS'}")

    # 2. Remove specific books from kept corpora.
    for corpus_key, books in BOOKS_TO_REMOVE.items():
        for bid in books:
            text, ok = remove_book_in_corpus(text, corpus_key, bid)
            log.append(f"  remove-book    {corpus_key:32s} {bid:50s}  {'OK' if ok else 'MISS'}")

    # 3. Rename mandaean-manichaean → mandaean-corpus (after Manichaean books dropped).
    text, ok = rename_corpus(
        text,
        'mandaean-manichaean',
        'mandaean-corpus',
        new_label='Mandaean canonical scripture',
    )
    log.append(f"  rename-corpus  mandaean-manichaean → mandaean-corpus    {'OK' if ok else 'MISS'}")

    post_len = len(text)
    post_lines = text.count('\n')

    for line in log:
        print(line)
    print()
    print(f"file size: {pre_len} → {post_len} bytes  ({pre_len - post_len:+d} = -{(pre_len - post_len)/1024:.1f} KB)")
    print(f"file lines: {pre_lines} → {post_lines}  ({pre_lines - post_lines:+d})")

    if not dry:
        APP_JS.write_text(text, encoding="utf-8")
        print("APPLIED")
    else:
        print("DRY-RUN — no write")


if __name__ == "__main__":
    main()
