#!/usr/bin/env python3
"""
Kill the OTHER bucket on the Codex wheel (2026-05-30).

After Pass-1 + Phase B + Pass-2 the wheel has 100 corpora and 534 book
entries, but 32 docs are still in SCRIPTURE_IDS without any corpus
assignment — they fall to OTHER on the wheel. John 2026-05-30: "we
should not HAVE other, because a scripture doesn't belong on Other".

This patcher appends each of those 32 doc IDs to the right existing
corpus's main section. Assignments are deterministic per the doc's
content (overview-of-Avesta → avesta; Tao Te Ching alternate ID →
tao-corpus; document-* goblin-stubs → bible; etc.).

A few of these are TRUE DUPLICATES of canonical IDs already in their
corpus (e.g. document-matthew + phase-3-017-gospel-of-matthew both
exist as separate vault docs but represent the same text). Adding
them keeps the data faithful to the vault; the dup-cleanup at the
data layer is a Lane A follow-up.

Usage:
    python3 scripts/apply_corpora_kill_other_2026-05-30.py --dry-run
    python3 scripts/apply_corpora_kill_other_2026-05-30.py --apply
"""

import argparse
import re
import sys
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
APP_JS = VAULT / "src/js/app.js"


# doc_id → target_corpus_id  (alphabetical for review-ability)
ASSIGNMENTS = {
    # Avesta-overview node (Zoroastrian canon)
    'avesta':                                      'avesta',
    # Bhagavata Purana — Vaishnava
    'bhagavata-purana':                            'vaishnava-canon',
    # Textual witnesses to the Christian Bible
    'codex-sinaiticus':                            'bible',
    'codex-vaticanus':                             'bible',
    # Corpus Hermeticum overview node
    'corpus-hermeticum':                           'hermetica',
    # Divyavadana — narrative collection within Mulasarvastivada/Theravada
    'divyavadana':                                 'theravada-jataka-corpus',
    # Document-stub auto-creates (goblin batch 2026-05-20) — book of the Bible
    'document-exodus':                             'bible',
    'document-ezekiel':                            'bible',
    'document-leviticus':                          'bible',
    'document-matthew':                            'bible',
    'document-numbers':                            'bible',
    # Gandavyuha Sutra — Mahayana sutra (Huayan especially)
    'gandavyuha-sutra':                            'chinese-mahayana-chan-huayan-tiantai',
    # Gospel of Judas (Sethian Gnostic, from Codex Tchacos)
    'gospel-of-judas-sethian':                     'nag-hammadi',
    # Kojiki overview node (= the 712 CE text, alternate ID)
    'kojiki':                                      'kojiki-nihongi',
    # Lotus Sutra — foundational Mahayana, prominent in Tiantai/Tendai
    'lotus-sutra':                                 'chinese-mahayana-chan-huayan-tiantai',
    # Mahabharata overview node — Vaishnava (contains Bhagavad Gita)
    'mahabharata':                                 'vaishnava-canon',
    # Mahaparinibbana Sutta — Pali Canon (Tipitaka, Digha Nikaya 16)
    'mahaparinibbana-sutta':                       'tipitaka',
    # Nihon Shoki overview (= 720 CE, alternate ID)
    'nihon-shoki':                                 'kojiki-nihongi',
    # Atrahasis — Babylonian flood narrative
    'phase-1-006-atrahasis':                       'mesopotamian',
    # Enuma Anu Enlil — omen tablets
    'phase-1-019-enuma-anu-enlil':                 'mesopotamian',
    # Rigveda overview (alternate ID)
    'phase-1-031-rigveda':                         'vedas',
    # Davidic Psalms (Hebrew Bible Ketuvim)
    'phase-2-005-davidic-psalms':                  'bible',
    # I Ching / Yi Jing — Confucian Five Classics
    'phase-2-042-yi-jing-i-ching':                 'confucian-classics',
    # Mahabharata phase-3 dating-thread node
    'phase-3-095-mahabharata':                     'vaishnava-canon',
    # Book of Giants — Qumran Aramaic + Manichaean reception
    'phase-3-033-book-of-giants-qumran-manichaean': 'mandaean-manichaean',
    # Rumi Masnavi — Sufi Persian
    'phase-5-025-rumi-masnavi':                    'sufi-persian',
    # Zohar — Kabbalistic corpus
    'phase-5-064-zohar':                           'kabbalistic-corpus',
    # Ramayana overview node — Vaishnava (Rama is Vishnu's 7th avatar)
    'ramayana':                                    'vaishnava-canon',
    # Shoku Nihongi — Continued Chronicles of Japan (797 CE, Imperial-court text)
    'shoku-nihongi':                               'kojiki-nihongi',
    # Tao Te Ching alternate-ID node
    'tao-te-ching':                                'tao-corpus',
    # Tipitaka overview node
    'tipitaka':                                    'tipitaka',
    # Vimalakirti Sutra — Mahayana, prominent in Chan/Zen + Tiantai
    'vimalakirti-sutra':                           'chinese-mahayana-chan-huayan-tiantai',
}


def doc_title(doc_id):
    candidates = list(VAULT.glob(f"02_documents/**/{doc_id}.md"))
    if not candidates:
        return doc_id
    text = candidates[0].read_text(encoding='utf-8')
    m = re.match(r'^---\n(.*?)\n---', text, re.DOTALL)
    if not m:
        return doc_id
    fm = m.group(1)
    for key in ('title', 'name'):
        m2 = re.search(rf'^{key}:\s*(.*)$', fm, re.MULTILINE)
        if m2:
            v = m2.group(1).strip().strip('"').strip("'")
            return re.sub(r'\s*\([^)]{30,}\)$', '', v).strip()[:80]
    return doc_id


def find_corpus_block(text, key):
    """Return (start, end_of_block, end_of_close_line) for a top-level corpus."""
    rx = re.compile(rf"^  '{re.escape(key)}':\s*\{{", re.MULTILINE)
    m = rx.search(text)
    if not m:
        return None
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
                # i = position of closing }
                # advance to end-of-line
                j = i + 1
                while j < len(text) and text[j] != '\n':
                    j += 1
                if j < len(text) and text[j] == '\n':
                    j += 1
                return (start, i, j)
        i += 1
    return None


def add_book_to_corpus(text, corpus_key, doc_id):
    """Append a book entry to the FIRST `books: [` array inside the corpus block.

    Looks for the pattern `books: [` and inserts a `{ id: ..., label: ... },`
    line just before the matching `]}`.
    """
    span = find_corpus_block(text, corpus_key)
    if not span:
        return text, False
    start, close_brace, _ = span
    block = text[start:close_brace + 1]

    # If this doc_id is already in the block, no-op (idempotent).
    if re.search(rf"id:\s*'{re.escape(doc_id)}'", block):
        return text, 'noop'

    # Locate the FIRST `books: [` inside the block.
    bm = re.search(r"books:\s*\[", block)
    if not bm:
        return text, False
    # Walk bracket depth from that opening [ to its matching ]
    i = bm.end() - 1
    depth = 0
    while i < len(block):
        ch = block[i]
        if ch == '[':
            depth += 1
        elif ch == ']':
            depth -= 1
            if depth == 0:
                close_bracket_in_block = i
                break
        i += 1
    else:
        return text, False

    title = doc_title(doc_id)
    safe = title.replace("\\", "\\\\").replace("'", "\\'")
    new_entry = f"        {{ id: '{doc_id}', label: '{safe}' }},\n      "
    # Insert just before the closing `]` of the first books array.
    new_block = block[:close_bracket_in_block] + new_entry + block[close_bracket_in_block:]
    return text[:start] + new_block + text[close_brace + 1:], True


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true")
    g.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    dry = args.dry_run and not args.apply

    text = APP_JS.read_text(encoding='utf-8')
    pre_len = len(text)

    ok = []
    noops = []
    miss = []
    for doc_id, corpus_id in sorted(ASSIGNMENTS.items()):
        new_text, result = add_book_to_corpus(text, corpus_id, doc_id)
        if result == 'noop':
            noops.append((doc_id, corpus_id))
        elif result is True:
            text = new_text
            ok.append((doc_id, corpus_id))
        else:
            miss.append((doc_id, corpus_id))

    for d, c in ok:
        print(f"  +book   {d:50s} → {c}")
    for d, c in noops:
        print(f"  noop    {d:50s} (already in {c})")
    for d, c in miss:
        print(f"  MISS    {d:50s} (target {c} not found)")
    print()
    print(f"Added: {len(ok)}  No-op: {len(noops)}  Missed: {len(miss)}")
    print(f"File size: {pre_len} → {len(text)} ({len(text) - pre_len:+d})")

    if not dry:
        APP_JS.write_text(text, encoding='utf-8')
        print("APPLIED")
    else:
        print("DRY-RUN — no write")


if __name__ == "__main__":
    main()
