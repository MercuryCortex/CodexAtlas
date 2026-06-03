#!/usr/bin/env python3
"""
audit_document_quality.py — PRODUCT-GRADE scorecard for the whole document/
literature corpus (02_documents/). Read-only. Mirrors audit_deity_quality.py.

KEY FEATURE: duplicate detection is a QUERY, not a hand-maintained allowlist.
It clusters documents by normalized title and reports any text that has >1
node — so a future fill can never silently create a dup again (the failure
mode that bit the 2026-06-02 literature pass: Matthew/John/Dhammapada dups).
Emits src/data/document-product-grade.json for the DEV Overview panel.
"""
import os, re, glob, collections, json, datetime, statistics

FILES = [f for f in glob.glob("02_documents/**/*.md", recursive=True) if not f.endswith("README.md")]
N = len(FILES)

def field(text, name):
    m = re.search(rf"^{name}:\s*(.*)$", text, re.M)
    return m.group(1).strip() if m else None

import unicodedata
def norm_title(s):
    # Fold diacritics (Avataṃsaka -> avatamsaka) so romanization/diacritic
    # variants cluster. Indexed over title AND aka, so cross-romanization
    # synonyms (Tao Te Ching == Daodejing) cluster via a shared aka.
    s = unicodedata.normalize("NFKD", (s or "")).encode("ascii", "ignore").decode("ascii").lower()
    s = re.sub(r"\([^)]*\)", "", s)
    s = re.sub(r"[^a-z0-9 ]", "", s)
    s = re.sub(r"\b(the|of|book|gospel|sutra|sutta|epistle|sacred|holy|document|st|saint|classic|jing)\b", "", s)
    return re.sub(r"\s+", " ", s).strip()

status_ct = collections.Counter()
no_tradition, no_dates, no_refs, no_wires, thin_body = [], [], [], [], []
title_index = collections.defaultdict(list)
_WL = re.compile(r'\[\[([^|\]]+)')
WIRE_FIELDS = ("themes", "parallels", "influenced-by", "influences",
               "deities-mentioned", "key-figures", "events-context",
               "documents-related", "attested-in", "mentioned-in", "authors")
_out, _ref = {}, set()

for path in FILES:
    t = open(path, encoding="utf-8").read()
    slug = os.path.basename(path)[:-3]
    fm_end = t.find("\n---", 4)
    fm = t[:fm_end] if fm_end > 0 else t
    body = t[fm_end+4:] if fm_end > 0 else ""

    status_ct[(field(t, "status") or "(none)").strip('"')] += 1
    if not field(t, "tradition") or field(t, "tradition") in ('""', "''"):
        no_tradition.append(slug)
    # any date field
    if not any(field(t, d) for d in ("date-composed-earliest", "date-earliest", "date-redacted", "date-physical-mss-earliest")):
        no_dates.append(slug)
    if "refs:" not in t and "## Refs" not in t and "## References" not in t:
        no_refs.append(slug)
    if len(body) < 400:
        thin_body.append(slug)

    # connectivity: wikilinks in OR out across the document wire-fields
    o = set()
    for fld in WIRE_FIELDS:
        m = re.search(rf"^{fld}:\s*(.+)$", fm, re.M)
        if m:
            for w in _WL.findall(m.group(1)):
                o.add(w.strip())
    # also catch body wikilinks (documents wire heavily in prose)
    for w in _WL.findall(body):
        o.add(w.strip())
    o.discard(slug)
    _out[slug] = o
    for x in o:
        _ref.add(x)
    if not o:
        no_wires.append(slug)

    # Index title AND every aka value (folded), so romanization/diacritic
    # synonyms for the SAME text cluster (Tao Te Ching == Daodejing via aka).
    st = (field(t, "status") or "(none)").strip('"')
    keys = set()
    title = (field(t, "title") or field(t, "name") or "").strip('"')
    if title: keys.add(norm_title(title))
    aka = field(t, "aka")
    if aka:
        for a in re.findall(r'"([^"]+)"', aka):
            keys.add(norm_title(a))
    for k in keys:
        if len(k) >= 5:
            title_index[k].append((slug, st, len(t)))

disconnected = sum(1 for s in {os.path.basename(f)[:-3] for f in FILES}
                   if not _out.get(s) and s not in _ref)
below_metadata = status_ct.get("stub", 0) + status_ct.get("partial", 0) + status_ct.get("(none)", 0)

# ── AUTOMATIC DUPLICATE DETECTION (the query) ───────────────────────────────
# Title+aka clustering casts a wide net (catches diacritic/romanization
# variants) but OVER-clusters: different works can share a title-phrase
# (Llull vs Kircher 'Ars Magna'; Madhva vs Shankara 'Brahma Sūtra Bhāṣya'),
# and some pairs are intentional source-critical STRATA (Rigveda vs its
# oldest 'family books'; the ancient Zhouyi core vs the received I Ching).
# So we collapse multi-key clusters to slug-PAIRS and subtract a curated
# KNOWN_DISTINCT set (recorded scholarly judgments — the deity
# KNOWN_DUPLICATES pattern). Resolution still needs a human per new cluster.
raw_clusters = {k: v for k, v in title_index.items() if len({s for s, _, _ in v}) > 1}
# collapse to unique slug-sets (the same pair surfaces under several keys)
_pairs = {}  # frozenset(slugs) -> {slug: (status, size)}
for k, v in raw_clusters.items():
    slugs = frozenset(s for s, _, _ in v)
    _pairs.setdefault(slugs, {})
    for s, st_, sz in v:
        _pairs[slugs][s] = (st_, sz)

# Curated: flagged-but-genuinely-DIFFERENT (false positives) or intentional
# source-critical STRATA we deliberately keep as separate nodes.
KNOWN_DISTINCT = [
    frozenset({"phase-6-044-llull-ars-magna", "phase-6-052-kircher-ars-magna-lucis"}),       # different works
    frozenset({"phase-5-022-madhva-brahma-sutra-bhasya", "phase-5-005-shankara-brahma-sutra-bhasya"}),  # different commentaries
    frozenset({"phase-1-031-rigveda", "phase-2-001-rig-veda-family-books"}),                  # strata: whole vs oldest core
    frozenset({"phase-2-042-yi-jing-i-ching", "phase-1-026-yijing"}),                         # strata: received classic vs Zhouyi divination core
    frozenset({"phase-2-017-mahabharata-ramayana-oral-layers", "phase-3-095-mahabharata"}),   # oral-composition study vs the epic text
    frozenset({"phase-3-004-1-enoch", "phase-4-081-mashafa-henok-geez-1-enoch"}),             # Greek/Aramaic 1 Enoch vs the Ethiopic canonical recension
    frozenset({"phase-6-029-boehme-aurora", "phase-6-017-boehme-aurora-mysterium-magnum"}),   # Aurora vs Mysterium Magnum (different Boehme works)
]
_actionable = {sl: d for sl, d in _pairs.items() if sl not in KNOWN_DISTINCT}
dup_clusters = {"+".join(sorted(sl)): [(s, d[s][0], d[s][1]) for s in sl]
                for sl, d in _actionable.items()}
dup_count = len(dup_clusters)
known_distinct_count = len(_pairs) - len(_actionable)

print(f"=== DOCUMENT PRODUCT-GRADE SCORECARD ({N} nodes) ===\n")
print("STATUS distribution:")
for s, c in status_ct.most_common():
    print(f"  {c:4d}  {s}")
print()
def pct(x): return f"{x} ({100*x//N}%)"
print("SCHEMA / QUALITY GAPS (lower = better):")
print(f"  missing tradition (wedge): {pct(len(no_tradition))}")
print(f"  missing dates:             {pct(len(no_dates))}")
print(f"  NO refs (unsourced):       {pct(len(no_refs))}")
print(f"  NO wires (graph-orphan):   {pct(len(no_wires))}")
print(f"  thin body (<400 chars):    {pct(len(thin_body))}")
print(f"  below metadata depth:      {pct(below_metadata)}")
print()
print(f"DUPLICATE-TITLE CLUSTERS (auto-detected): {dup_count}")
for k, v in sorted(dup_clusters.items()):
    print(f"  '{k}':")
    for slug, st, sz in sorted(v, key=lambda x: -x[2]):
        print(f"      {st:10} {sz:6}B  {slug}")
print()

def row(key, label, target, current, ok, detail=""):
    return {"key": key, "label": label, "target": target,
            "current": str(current), "ok": bool(ok), "detail": detail}

rows = [
    row("connected", "Graph-connected (no orphans)", "0 disconnected", disconnected, disconnected == 0,
        "every doc has ≥1 wikilink wire in or out"),
    row("tradition", "Has home tradition (wedge)", "100%", f"{N-len(no_tradition)}/{N}", len(no_tradition) == 0,
        "the scripture-exception singular origin"),
    row("dates", "Has dates", "100%", f"{N-len(no_dates)}/{N}", len(no_dates) == 0),
    row("sourced", "Sourced (refs)", "0 unsourced", len(no_refs), len(no_refs) == 0),
    row("depth", "At least metadata depth", "0 stubs/partials", below_metadata, below_metadata == 0,
        "stub + partial + untyped"),
    row("thin", "No thin bodies (<400 chars)", "0", len(thin_body), len(thin_body) == 0),
    row("dupes", "No duplicate-title clusters", "0", dup_count, dup_count == 0,
        f"title+aka folded; {known_distinct_count} distinct/strata pairs excluded (curated); resolve rest via dedup playbook"),
]
product_grade = all(r["ok"] for r in rows)
bench = {
    "generatedAt": datetime.date.today().isoformat(),
    "totalDocuments": N,
    "productGrade": product_grade,
    "passCount": sum(1 for r in rows if r["ok"]),
    "rowCount": len(rows),
    "dupClusters": {k: [s for s, _, _ in v] for k, v in sorted(dup_clusters.items())},
    "rows": rows,
}
os.makedirs("src/data", exist_ok=True)
open("src/data/document-product-grade.json", "w", encoding="utf-8").write(json.dumps(bench, indent=1))
print(f"PRODUCT-GRADE: {bench['passCount']}/{bench['rowCount']} rows green "
      f"({'✅ PRODUCT-GRADE' if product_grade else 'not yet'}) -> src/data/document-product-grade.json")
