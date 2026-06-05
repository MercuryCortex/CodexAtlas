#!/usr/bin/env python3
"""
audit_wire_coverage.py — THE COMPLETENESS BAR (read-only).

WHY THIS EXISTS
The quality scorecards (audit_deity_quality.py / audit_document_quality.py)
grade the nodes that EXIST — schema, sourcing, depth, wiring. They are
*structurally blind to a MISSING node*, so a cross-tradition NEIGHBORHOOD can
be broken while the scorecard proudly reads 9/9 "product-grade".

PROVEN 2026-06-05: the flagship wire `Genesis-1 "the deep" -> Tiamat (Mesopotamia)
· Nun (Egypt) · Ginnungagap (Norse)` scored product-grade while Ginnungagap had
no node, the Egyptian Ogdoad was half-missing, and the Mesopotamian primordial
trio lacked Nammu + Mummu. "Quality of the nodes that exist" is the wrong bar.
The right bar: do the nodes the INVESTIGATION needs to draw its wires exist?

This is an investigation tool, not a catalogue — so completeness is measured by
WIRE-ENDPOINT coverage, prioritized by the headwaters (Mesopotamian / Egyptian /
Greek / Canaanite / Norse — the source-ends every Abrahamic text echoes back to),
NOT by whether a tradition has a tidy book-canon.

WHAT IT MEASURES
  1. NEIGHBORHOOD INTEGRITY — for each curated cross-tradition cluster, is every
     endpoint present as a node? A missing endpoint = a wire that cannot be drawn
     = the neighborhood is BROKEN and the bar FAILS (exit 1).
  2. DEMAND-RANKED GAPS — referenced-but-missing slugs (the live link-checker's
     output, ranked by inbound reference count): the nodes the graph is already
     reaching for. The investigation naming its own next targets.

Read-only. Emits src/data/wire-coverage.json for the DEV Overview panel.
Extend NEIGHBORHOODS as each headwater cluster is mapped.
"""
import os, re, glob, json, datetime

# ── 1. present-set: a node "exists" if a <slug>.md file exists (wikilinks
#    resolve by file stem) or a node declares id: "<slug>". ───────────────────
NODE_DIRS_GLOB = "[0-9]*/**/*.md"   # numbered content dirs only (skips 00_meta, AUDIT, _legacy)
present = set()
id_re = re.compile(r'^id:\s*"?([a-z0-9][a-z0-9-]*)"?\s*$', re.M)
for f in glob.glob(NODE_DIRS_GLOB, recursive=True):
    if "/00_meta/" in f or "/99_ingest/" in f or os.path.basename(f).startswith("_"):
        continue
    present.add(os.path.basename(f)[:-3])
    try:
        m = id_re.search(open(f, encoding="utf-8").read(2000))
        if m:
            present.add(m.group(1))
    except OSError:
        pass

def have(slug):
    return slug in present

# ── 2. cross-tradition NEIGHBORHOODS (the investigation's wire clusters). ─────
# Seed = "the deep" (closed 2026-06-05). Add a cluster here whenever a MASSIVE-WIN
# wire is mapped; the bar then guards it forever. headwaters listed first.
NEIGHBORHOODS = {
    "the-deep": {
        "label": "The Deep / primordial waters & void (Genesis 1:2 tehom across traditions)",
        "endpoints": {
            "Mesopotamian": ["tiamat", "apsu", "nammu", "mummu", "lahmu-lahamu", "anshar-kishar"],
            "Egyptian (Ogdoad)": ["nun", "naunet", "heh-egyptian", "hauhet",
                                   "kek-egyptian", "kauket", "amun", "amaunet"],
            "Norse": ["ginnungagap", "ymir", "audumla"],
            "Greek": ["chaos-primordial", "nyx-primordial"],
            "hub (themes)": ["primordial-waters", "primordial-darkness", "chaoskampf"],
        },
    },
}

# ── 3. demand: referenced-but-missing slugs, ranked. (linkcheck output) ──────
DEAD = "99_ingest/audit_dead.txt"
# generic / structural tokens that are not entity nodes — never "demand"
STOP = {"wikilink", "wikilinks", "document", "documents", "document-slug",
        "parallel-motif", "tradition", "deity", "person", "event", "theme",
        "place", "symbol", "name", "slug", "target"}
demand = []
if os.path.exists(DEAD):
    for line in open(DEAD, encoding="utf-8"):
        parts = line.rstrip("\n").split("\t")
        if len(parts) < 2:
            continue
        try:
            cnt = int(parts[0])
        except ValueError:
            continue
        tgt = parts[1].strip()
        if tgt in STOP or tgt in present:
            continue
        if "." in tgt or tgt.endswith(("-slug", "-type", "-id")):
            continue  # filenames (app.js) and schema-placeholder tokens
        if not re.fullmatch(r"[a-z][a-z0-9-]{2,}", tgt):
            continue  # entity-ish lowercase-hyphen slug only
        demand.append((cnt, tgt))
demand.sort(key=lambda x: (-x[0], x[1]))

# ── report ──────────────────────────────────────────────────────────────────
print(f"=== WIRE-ENDPOINT COVERAGE BAR ({len(present)} node slugs indexed) ===\n")
neigh_out, all_whole = [], True
for nid, n in NEIGHBORHOODS.items():
    missing = {}
    total = 0
    for trad, slugs in n["endpoints"].items():
        total += len(slugs)
        miss = [s for s in slugs if not have(s)]
        if miss:
            missing[trad] = miss
    whole = not missing
    all_whole = all_whole and whole
    present_ct = total - sum(len(v) for v in missing.values())
    flag = "✅ WHOLE" if whole else "🚨 BROKEN"
    print(f"{flag}  [{nid}] {n['label']}")
    print(f"          {present_ct}/{total} endpoints present")
    for trad, miss in missing.items():
        print(f"          MISSING · {trad}: {', '.join(miss)}")
    neigh_out.append({"id": nid, "label": n["label"], "whole": whole,
                      "present": present_ct, "total": total,
                      "missing": missing})
print()
print(f"TOP DEMAND — referenced but missing (the investigation's own most-wanted):")
for cnt, tgt in demand[:25]:
    print(f"   {cnt:3d}×  {tgt}")

out = {
    "generatedAt": datetime.date.today().isoformat(),
    "indexedSlugs": len(present),
    "neighborhoodsWhole": all_whole,
    "neighborhoods": neigh_out,
    "topDemand": [{"refs": c, "target": t} for c, t in demand[:50]],
}
os.makedirs("src/data", exist_ok=True)
open("src/data/wire-coverage.json", "w", encoding="utf-8").write(json.dumps(out, indent=1))
print(f"\nNEIGHBORHOODS {'all WHOLE ✅' if all_whole else 'BROKEN 🚨'} "
      f"-> src/data/wire-coverage.json")
raise SystemExit(0 if all_whole else 1)
