#!/usr/bin/env python3
"""
audit_deity_quality.py — PRODUCT-GRADE scorecard for the whole deity corpus.
Read-only. Measures the dimensions that separate "gaps filled" from
"product-grade": schema completeness, sourcing, wiring (the cross-tradition
edges = the Atlas's whole point), stub-depth, orphans, and duplicate risk.
"""
import os, re, glob, collections
sys_path = os.getcwd()

FILES = [f for f in glob.glob("03_deities/*.md") if not f.endswith("README.md")]
N = len(FILES)

def field(text, name):
    m = re.search(rf"^{name}:\s*(.*)$", text, re.M)
    return m.group(1).strip() if m else None

def has_nonempty_list(text, name):
    v = field(text, name)
    if v is None: return False
    if v in ("[]", '""', "''", ""): return False
    return True

status_ct = collections.Counter()
no_tradition = []
no_dates = []
no_domains = []
no_refs = []
no_wires = []          # no syncretic-edges AND no equivalents
thin_body = []         # body < 400 chars
no_gender = []
no_role = []
name_index = collections.defaultdict(list)  # normalized name/aka -> files (dup detection)
body_lens = []
wire_counts = []

def norm(s):
    s = re.sub(r"\([^)]*\)", "", s)
    s = re.sub(r"[^a-zA-Z]", "", s).lower()
    return s

for path in FILES:
    t = open(path, encoding="utf-8").read()
    slug = os.path.basename(path)[:-3]
    fm_end = t.find("\n---", 4)
    body = t[fm_end+4:] if fm_end > 0 else ""
    body_lens.append(len(body))
    status_ct[(field(t, "status") or "(none)").strip('"')] += 1
    if not field(t, "tradition") or field(t, "tradition") in ('""', "''"): no_tradition.append(slug)
    # dates
    e = field(t, "period-active-earliest"); l = field(t, "period-active-latest")
    if not e or not l or e in ("", '""') or l in ("", '""'): no_dates.append(slug)
    if not has_nonempty_list(t, "domains"): no_domains.append(slug)
    if not field(t, "gender"): no_gender.append(slug)
    if not field(t, "role"): no_role.append(slug)
    # refs: look for a refs: block with at least one title
    if "refs:" not in t or not re.search(r"refs:\s*\n\s*-\s*title:", t): no_refs.append(slug)
    # wires
    has_se = re.search(r"syncretic-edges:\s*\n\s*-\s*target:", t)
    has_eq = has_nonempty_list(t, "equivalents")
    nwire = len(re.findall(r"-\s*target:", t))
    wire_counts.append(nwire)
    if not has_se and not has_eq: no_wires.append(slug)
    if len(body) < 400: thin_body.append(slug)
    # dup index: name + each aka
    nm = field(t, "name")
    if nm:
        name_index[norm(nm.strip('"'))].append(slug)
    aka = field(t, "aka")
    if aka:
        for a in re.findall(r'"([^"]+)"', aka):
            k = norm(a)
            if len(k) >= 4: name_index[k].append(slug)

dups = {k: v for k, v in name_index.items() if len(set(v)) > 1}

print(f"=== DEITY PRODUCT-GRADE SCORECARD ({N} nodes) ===\n")
print("STATUS distribution:")
for s, c in status_ct.most_common():
    print(f"  {c:4d}  {s}")
print()
def pct(x): return f"{x} ({100*x//N}%)"
print("SCHEMA COMPLETENESS (lower = better; these are the gaps to product-grade):")
print(f"  missing tradition:        {pct(len(no_tradition))}")
print(f"  missing/blank dates:      {pct(len(no_dates))}")
print(f"  missing domains:          {pct(len(no_domains))}")
print(f"  missing gender:           {pct(len(no_gender))}")
print(f"  missing role:             {pct(len(no_role))}")
print(f"  NO refs (unsourced):      {pct(len(no_refs))}")
print(f"  NO cross-tradition wires: {pct(len(no_wires))}   <-- ORPHANS from the Atlas")
print(f"  thin body (<400 chars):   {pct(len(thin_body))}")
print()
import statistics
print(f"WIRING: total target-edges across corpus = {sum(wire_counts)}; "
      f"mean {statistics.mean(wire_counts):.2f}/node; median {statistics.median(wire_counts)}; "
      f"nodes with 0 = {sum(1 for w in wire_counts if w==0)}")
print(f"BODY DEPTH: mean {statistics.mean(body_lens):.0f} chars; median {statistics.median(body_lens):.0f}; "
      f"min {min(body_lens)}")
print()
print(f"DUPLICATE-NAME CANDIDATES (same name/aka -> multiple files): {len(dups)}")
for k, v in sorted(dups.items())[:40]:
    print(f"  {k}: {sorted(set(v))}")
print()
# write detail lists
import json
open("/tmp/deity_quality.json","w").write(json.dumps({
  "no_refs": no_refs, "no_wires": no_wires, "no_dates": no_dates,
  "no_domains": no_domains, "thin_body": thin_body, "no_role": no_role,
  "no_gender": no_gender, "dups": {k:sorted(set(v)) for k,v in dups.items()},
}, indent=1))
print("detail -> /tmp/deity_quality.json")
