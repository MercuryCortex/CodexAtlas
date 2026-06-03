#!/usr/bin/env python3
"""
READ-ONLY citation pre-filter (D5 step 1, per HANDOFF-2026-06-03).

Per 02_documents node: extract each YAML `refs:` (author, title) and compare
to the body `## Refs` list titles for the SAME author. Flags the
"real-scholar-wrong-title" signature: an author whose YAML title and body
title diverge (the body list is frequently CORRECT for the same work, so a
YAML-title != body-title diff catches a free subset of the fabricated refs).

No grading, no network. Pure mechanical worklist generator. Catches a subset;
does NOT replace the read-only grader fleet (D5 step 2).
"""
import os, re, sys, glob, unicodedata

try:
    import yaml
except ImportError:
    print("PyYAML required (it's already used by lint_yaml.py)"); sys.exit(1)

DOC_DIR = "02_documents"

def norm(s):
    """Lowercase, strip diacritics + punctuation, collapse whitespace -> token set helper."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()

STOP = {"the","a","an","of","and","in","on","to","for","with","its","de","la",
        "el","des","du","von","der","das","ed","rev","vol","new","its"}

def toks(s):
    return {t for t in norm(s).split() if t not in STOP and len(t) > 2}

def surnames(author):
    """Pull surname tokens from a YAML author string like
    'Lambert, W.G., and Millard, A.R.' -> {'lambert','millard'}."""
    out = set()
    # split on 'and' / '&' / ';'
    for chunk in re.split(r"\band\b|&|;", author):
        chunk = chunk.strip()
        if not chunk:
            continue
        # surname is the token before the first comma (Lastname, Initials)
        first = chunk.split(",")[0].strip()
        for w in norm(first).split():
            if len(w) > 2:
                out.add(w)
    return out

def parse_frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return None
    try:
        return yaml.safe_load(m.group(1))
    except Exception:
        return None

def body_refs(text):
    """Return list of raw lines from the body '## Refs' (or '## References') section."""
    m = re.search(r"\n##\s+Ref(?:erence)?s?\s*\n(.*?)(?:\n##\s|\Z)", text, re.S | re.I)
    if not m:
        return []
    lines = []
    for ln in m.group(1).splitlines():
        ln = ln.strip()
        if ln and (ln[0].isdigit() or ln.startswith(("-", "*"))):
            lines.append(ln)
    return lines

def italic_title(line):
    """Body refs put the title in *italics* / _italics_. Extract it if present."""
    m = re.search(r"[*_]{1,2}([^*_]{4,})[*_]{1,2}", line)
    return m.group(1) if m else None

flags = []           # (node, author, yaml_title, body_title, overlap)
author_missing = []  # (node, author, yaml_title)  -- author not in body at all
no_body = []         # nodes with YAML refs but no body ## Refs section
stats = {"nodes": 0, "yaml_refs": 0, "checked": 0}

for path in sorted(glob.glob(os.path.join(DOC_DIR, "**", "*.md"), recursive=True)):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    fm = parse_frontmatter(text)
    if not fm or not isinstance(fm, dict):
        continue
    refs = fm.get("refs")
    if not refs or not isinstance(refs, list):
        continue
    node = os.path.splitext(os.path.basename(path))[0]
    stats["nodes"] += 1
    blines = body_refs(text)
    btitles = [(ln, italic_title(ln) or ln) for ln in blines]
    if not blines:
        no_body.append(node)
        continue
    for r in refs:
        if not isinstance(r, dict):
            continue
        ytitle = str(r.get("title", "")).strip()
        yauth = str(r.get("author", "")).strip()
        if not ytitle or not yauth:
            continue
        stats["yaml_refs"] += 1
        sns = surnames(yauth)
        if not sns:
            continue
        # find body ref line(s) that mention any of this ref's surnames
        cand = [(ln, bt) for (ln, bt) in btitles if sns & toks(ln)]
        if not cand:
            author_missing.append((node, yauth, ytitle))
            continue
        stats["checked"] += 1
        ytok = toks(ytitle)
        if not ytok:
            continue
        # Best CONTAINMENT across candidate body lines, measured over the SHORTER
        # title's token set. An abbreviated body title fully contained in the YAML
        # title (or vice-versa) scores ~1.0 = SAME work = clean. A genuinely
        # different title for the same author scores low = the fabrication signature.
        best = 0.0
        best_bt = ""
        for ln, bt in cand:
            bttok = toks(bt)
            if not bttok:
                continue
            contain = len(ytok & bttok) / min(len(ytok), len(bttok))
            if contain > best:
                best, best_bt = contain, bt
        if best < 0.5:   # neither title contains the other -> divergent work, same author
            flags.append((node, yauth, ytitle, best_bt.strip(), round(best, 2)))

print("=" * 72)
print("CITATION TITLE-CONSISTENCY PRE-FILTER (read-only, D5 step 1)")
print("=" * 72)
print(f"nodes with YAML refs: {stats['nodes']}   YAML refs: {stats['yaml_refs']}   "
      f"author-matched & checked: {stats['checked']}")
print()
print(f"### TITLE-MISMATCH (same author, divergent title) — {len(flags)} "
      f"[HIGH-VALUE: the real-scholar-wrong-title signature]")
for node, auth, yt, bt, ov in sorted(flags, key=lambda x: (x[0], x[4])):
    print(f"  • {node}")
    print(f"      author: {auth}")
    print(f"      YAML  : {yt}")
    print(f"      BODY  : {bt}   (overlap {ov})")
print()
print(f"### AUTHOR-NOT-IN-BODY — {len(author_missing)} "
      f"[SOFT: body may legitimately be a subset; not necessarily bad]")
# group by node, count only
from collections import Counter
amc = Counter(n for n, _, _ in author_missing)
for node, c in sorted(amc.items()):
    print(f"  • {node}: {c}")
print()
print(f"### NODES WITH YAML REFS BUT NO BODY ## Refs — {len(no_body)} "
      f"[can't cross-check mechanically; defer to grader fleet]")
for n in no_body:
    print(f"  • {n}")
