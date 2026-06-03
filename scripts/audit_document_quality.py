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

def norm_title(s):
    s = (s or "").lower()
    s = re.sub(r"\([^)]*\)", "", s)
    s = re.sub(r"[^a-z0-9 ]", "", s)
    s = re.sub(r"\b(the|of|book|gospel|sutra|sutta|epistle|sacred|holy|document|st|saint)\b", "", s)
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

    title = (field(t, "title") or field(t, "name") or "").strip('"')
    k = norm_title(title)
    if len(k) >= 3:
        title_index[k].append((slug, (field(t, "status") or "(none)").strip('"'), len(t)))

disconnected = sum(1 for s in {os.path.basename(f)[:-3] for f in FILES}
                   if not _out.get(s) and s not in _ref)
below_metadata = status_ct.get("stub", 0) + status_ct.get("partial", 0) + status_ct.get("(none)", 0)

# ── AUTOMATIC DUPLICATE DETECTION (the query) ───────────────────────────────
dup_clusters = {k: v for k, v in title_index.items() if len({s for s, _, _ in v}) > 1}
dup_count = len(dup_clusters)

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
        "auto-detected; resolve via dedup playbook (repoint → delete)"),
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
