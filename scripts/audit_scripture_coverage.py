#!/usr/bin/env python3
"""
audit_scripture_coverage.py — THE SCRIPTURE COMPLETENESS BAR (read-only).

WHY THIS EXISTS
The document quality scorecard (audit_document_quality.py) grades the nodes that
EXIST — wedge, dates, refs, wires, depth. It is *structurally blind to a MISSING
book*, so the Bible — the project's literal north-star root — scored 7/7
"product-grade" while ~half its canon has no node (PROVEN 2026-06-05: all 12
Minor Prophets, Jeremiah, most NT epistles absent). SCRIPTURE_CORPORA can't fix
this: it is node-derived (the `bible` corpus enumerates 41 books, the curated
scholarly selection) and shares the exact same blind spot.

This is the SECOND bar — the scripture sibling of audit_wire_coverage.py
(deities). For each canon it holds an AUTHORITATIVE book list (external truth,
not vault state) and classifies every book three ways:

  • DEDICATED — a document node IS this book (its own wedge-point).
  • FOLDED    — no dedicated node, but the book is covered inside a GROUPED node
                (e.g. Joshua/Judges/Samuel inside "The Deuteronomistic History";
                Galatians inside "Undisputed Pauline Epistles"; Amos/Hosea/Micah
                inside "Early Prophets"). Scholarly-defensible, but invisible as
                an individual wire-endpoint.
  • ABSENT    — no node at all, not even folded. The genuine completeness hole.

The DEDICATED-vs-FOLDED split is the data behind John's reserved
"fold vs. distinguish" decision: coverage is reported under BOTH models so the
choice is concrete, not abstract.

MATCHING is EXACT (explicit candidate node-id stems per book), NOT a fuzzy
title scan — a fuzzy scan false-positives hard here ("Answer to Job" ≠ Book of
Job; "Revelations of Divine Love" ≠ Revelation; Ignatius "to the Ephesians" ≠
the Epistle). Group nodes are fold-only and can NEVER mark a member DEDICATED.

Read-only. Emits src/data/scripture-coverage.json for the DEV Overview panel.
Extend CANONS as each tradition's authoritative canon is encoded.

NOTE (planning-mode, 2026-06-05): the CANON encoding embeds a stance on what
"complete" means. Pilot = the Bible (Christianity). Other corpora come after
John ratifies the model.
"""
import os, re, glob, json, datetime

# ── present-set of DOCUMENT node ids (exact) ──────────────────────────────────
idre = re.compile(r'^id:\s*"?([a-z0-9][a-z0-9-]*)"?\s*$', re.M)
present_ids = set()
for f in glob.glob("02_documents/**/*.md", recursive=True):
    if os.path.basename(f).startswith("_") or os.path.basename(f).lower() == "readme.md":
        continue
    try:
        t = open(f, encoding="utf-8").read(1500)
    except OSError:
        continue
    m = idre.search(t)
    present_ids.add(m.group(1) if m else os.path.basename(f)[:-3])


def have(cands):
    return next((c for c in cands if c in present_ids), None)


# ── GROUPED nodes: one node that folds several individual books ───────────────
# (group-key -> (node-id, [book-names it folds]))
GROUPS = {
    "deuteronomistic-history": ("phase-2-019-deuteronomistic-history",
                                ["Joshua", "Judges", "1 Samuel", "2 Samuel"]),
    "early-prophets":          ("phase-2-010-hebrew-bible-early-prophets",
                                ["Hosea", "Amos", "Micah"]),
    "undisputed-paulines":     ("phase-3-015-pauline-epistles",
                                ["1 Corinthians", "2 Corinthians", "Galatians",
                                 "Philippians", "1 Thessalonians", "Philemon"]),
}
_folds = {}
for gk, (gid, books) in GROUPS.items():
    for b in books:
        _folds.setdefault(b, []).append(gk)


# ── AUTHORITATIVE CANON: the Bible (pilot) ────────────────────────────────────
# Each book: (Name, [exact candidate node-id stems], {canon tags}). Empty cand
# list = no dedicated node expected/known (so it resolves to FOLDED or ABSENT).
# Canon tags: P=Protestant 66 · C=Catholic 73 · O=Eastern Orthodox · E=Ethiopian 81.
P, C, O, E = "P", "C", "O", "E"
PCOE = {P, C, O, E}; COE = {C, O, E}; OE = {O, E}; ETH = {E}
BIBLE = [
    # ── Torah / Pentateuch (5) ──
    ("Genesis",        ["document-genesis"],            PCOE),
    ("Exodus",         ["document-exodus"],             PCOE),
    ("Leviticus",      ["document-leviticus"],          PCOE),
    ("Numbers",        ["document-numbers"],            PCOE),
    ("Deuteronomy",    ["document-deuteronomy"],        PCOE),
    # ── Former Prophets / OT Historical ──
    ("Joshua",         [],                              PCOE),  # folded: DH
    ("Judges",         [],                              PCOE),  # folded: DH
    ("Ruth",           [],                              PCOE),
    ("1 Samuel",       [],                              PCOE),  # folded: DH
    ("2 Samuel",       [],                              PCOE),  # folded: DH
    ("1 Kings",        ["phase-2-034-books-of-kings"],  PCOE),
    ("2 Kings",        ["phase-2-034-books-of-kings"],  PCOE),
    ("1 Chronicles",   ["document-2-chronicles"],       PCOE),
    ("2 Chronicles",   ["document-2-chronicles"],       PCOE),
    ("Ezra",           [],                              PCOE),
    ("Nehemiah",       [],                              PCOE),
    ("Esther",         [],                              PCOE),
    # ── Wisdom / Writings (5) ──
    ("Job",            ["phase-2-job"],                 PCOE),
    ("Psalms",         ["phase-2-005-davidic-psalms"],  PCOE),
    ("Proverbs",       ["phase-2-041-book-of-proverbs"], PCOE),
    ("Ecclesiastes",   ["phase-2-ecclesiastes"],        PCOE),
    ("Song of Songs",  ["phase-2-song-of-songs"],       PCOE),
    # ── Major Prophets (5) ──
    ("Isaiah",         ["phase-3-001-second-third-isaiah"], PCOE),
    ("Jeremiah",       ["document-jeremiah"],           PCOE),
    ("Lamentations",   ["phase-2-020-lamentations"],    PCOE),
    ("Ezekiel",        ["document-ezekiel"],            PCOE),
    ("Daniel",         ["phase-3-008-book-of-daniel"],  PCOE),
    # ── Minor Prophets / The Twelve (12) ──
    ("Hosea",          [],                              PCOE),  # folded: early-prophets
    ("Joel",           [],                              PCOE),
    ("Amos",           [],                              PCOE),  # folded: early-prophets
    ("Obadiah",        [],                              PCOE),
    ("Jonah",          [],                              PCOE),
    ("Micah",          [],                              PCOE),  # folded: early-prophets
    ("Nahum",          [],                              PCOE),
    ("Habakkuk",       [],                              PCOE),
    ("Zephaniah",      [],                              PCOE),
    ("Haggai",         [],                              PCOE),
    ("Zechariah",      [],                              PCOE),
    ("Malachi",        [],                              PCOE),
    # ── Deuterocanon (Catholic / Orthodox / Ethiopian) ──
    ("Tobit",          [],                              COE),
    ("Judith",         [],                              COE),
    ("Wisdom of Solomon", ["phase-3-012-wisdom-of-solomon"], COE),
    ("Sirach",         ["phase-3-007-sirach"],          COE),
    ("Baruch",         ["phase-3-096-baruch"],          COE),
    ("1 Maccabees",    [],                              COE),
    ("2 Maccabees",    [],                              COE),
    ("1 Esdras",       [],                              OE),
    ("3 Maccabees",    [],                              OE),
    ("4 Maccabees",    ["phase-3-019-4-maccabees"],     OE),
    ("Prayer of Manasseh", [],                          OE),
    ("Jubilees",       ["phase-3-009-jubilees"],        ETH),
    ("1 Enoch",        ["phase-3-004-1-enoch"],         ETH),
    # ── Gospels & Acts (5) ──
    ("Matthew",        ["phase-3-017-gospel-of-matthew", "document-matthew"], PCOE),
    ("Mark",           ["phase-3-016-gospel-of-mark"],  PCOE),
    ("Luke",           ["phase-3-018-luke-acts"],       PCOE),
    ("John (Gospel)",  ["phase-3-020-gospel-of-john"],  PCOE),
    ("Acts",           ["phase-3-018-luke-acts"],       PCOE),
    # ── Pauline corpus (13) ──
    ("Romans",         ["document-romans"],             PCOE),
    ("1 Corinthians",  [],                              PCOE),  # folded: paulines
    ("2 Corinthians",  [],                              PCOE),  # folded: paulines
    ("Galatians",      [],                              PCOE),  # folded: paulines
    ("Ephesians",      [],                              PCOE),
    ("Philippians",    [],                              PCOE),  # folded: paulines
    ("Colossians",     [],                              PCOE),
    ("1 Thessalonians",[],                              PCOE),  # folded: paulines
    ("2 Thessalonians",[],                              PCOE),
    ("1 Timothy",      [],                              PCOE),
    ("2 Timothy",      [],                              PCOE),
    ("Titus",          [],                              PCOE),
    ("Philemon",       [],                              PCOE),  # folded: paulines
    # ── General / Catholic epistles + Hebrews + Revelation (9) ──
    ("Hebrews",        ["document-hebrews"],            PCOE),
    ("James",          [],                              PCOE),
    ("1 Peter",        [],                              PCOE),
    ("2 Peter",        [],                              PCOE),
    ("1 John",         [],                              PCOE),
    ("2 John",         [],                              PCOE),
    ("3 John",         [],                              PCOE),
    ("Jude",           [],                              PCOE),
    ("Revelation",     ["document-revelation"],         PCOE),
]

CANONS = {
    "Bible (Christianity)": {"books": BIBLE,
                             "canon_sizes": {P: 66, C: 73, O: 78, E: 81}},
}


# ── classify ──────────────────────────────────────────────────────────────────
def classify(name, cands):
    hit = have(cands)
    if hit:
        return "DEDICATED", hit
    for gk in _folds.get(name, []):
        gid = GROUPS[gk][0]
        if gid in present_ids:
            return "FOLDED", gid
    return "ABSENT", None


# ── report ────────────────────────────────────────────────────────────────────
print(f"=== SCRIPTURE COMPLETENESS BAR ({len(present_ids)} document nodes indexed) ===\n")
canon_out = []
for cname, cdef in CANONS.items():
    books = cdef["books"]
    rows = []
    for name, cands, tags in books:
        status, ref = classify(name, cands)
        rows.append({"book": name, "status": status, "node": ref, "canons": sorted(tags)})
    n_ded = sum(1 for r in rows if r["status"] == "DEDICATED")
    n_fold = sum(1 for r in rows if r["status"] == "FOLDED")
    n_abs = sum(1 for r in rows if r["status"] == "ABSENT")
    total = len(rows)
    print(f"{cname} — {total} canonical books encoded")
    print(f"  DEDICATED {n_ded}   FOLDED {n_fold}   ABSENT {n_abs}")
    print(f"  coverage(distinguish · dedicated-only): {100*n_ded//total}%")
    print(f"  coverage(fold · dedicated+folded):      {100*(n_ded+n_fold)//total}%\n")
    for r in rows:
        mark = {"DEDICATED": "OK ", "FOLDED": "FLD", "ABSENT": "!! "}[r["status"]]
        tag = "".join(r["canons"])
        ref = f"   <{r['node']}>" if r["node"] else ""
        print(f"    {mark} {r['status']:9} [{tag:4}] {r['book']}{ref}")
    print()
    for c, sz in cdef["canon_sizes"].items():
        in_canon = [r for r in rows if c in r["canons"]]
        miss = [r["book"] for r in in_canon if r["status"] == "ABSENT"]
        fold = [r["book"] for r in in_canon if r["status"] == "FOLDED"]
        ded = len(in_canon) - len(miss) - len(fold)
        print(f"  canon {c} ({sz}-book): {ded} dedicated / {len(fold)} folded / {len(miss)} absent "
              f"(of {len(in_canon)} encoded)")
        if miss:
            print(f"      ABSENT: {', '.join(miss)}")
    print()
    canon_out.append({"canon": cname, "total": total,
                      "dedicated": n_ded, "folded": n_fold, "absent": n_abs,
                      "books": rows})

out = {
    "generatedAt": datetime.date.today().isoformat(),
    "indexedDocs": len(present_ids),
    "canons": canon_out,
}
os.makedirs("src/data", exist_ok=True)
open("src/data/scripture-coverage.json", "w", encoding="utf-8").write(json.dumps(out, indent=1))
print("-> src/data/scripture-coverage.json")
