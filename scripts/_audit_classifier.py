#!/usr/bin/env python3
"""Throwaway audit script — diagnose family-classifier coverage gaps.
Run from repo root: python3 scripts/_audit_classifier.py
"""
import os, sys, re
from collections import Counter

sys.path.insert(0, os.path.dirname(__file__))
from build_health_index import FAMILIES, classify_family, FIELD_RX, LENSES

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

failing = []      # (tradition_string, file_path)
classified = 0
total_with_trad = 0

for folder, _label, _bl, _note in LENSES:
    path = os.path.join(ROOT, folder)
    if not os.path.isdir(path):
        continue
    for dirpath, dirnames, filenames in os.walk(path):
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]
        for fn in filenames:
            if not fn.endswith(".md") or fn.upper().startswith("README"):
                continue
            full = os.path.join(dirpath, fn)
            try:
                with open(full, encoding="utf-8") as fh:
                    head = fh.read(4000)
            except Exception:
                continue
            m = FIELD_RX["tradition"].search(head)
            if not m:
                continue
            total_with_trad += 1
            trad = m.group(1).strip().rstrip("\"'")
            fam = classify_family(trad)
            if fam:
                classified += 1
            else:
                failing.append((trad[:90], os.path.relpath(full, ROOT)))

print(f"Nodes with tradition: field   : {total_with_trad}")
print(f"  classified to a family       : {classified}")
print(f"  UNCLASSIFIED                 : {len(failing)}")
print()

# Top failing values, with sample files
counter = Counter(t for t, _ in failing)
print("=== TOP 50 UNCLASSIFIED TRADITION VALUES (with one sample file each) ===")
for v, n in counter.most_common(50):
    sample = next(f for t, f in failing if t == v)
    print(f"  [{n:>3}]  {v}")
    print(f"         └─ e.g. {sample}")
