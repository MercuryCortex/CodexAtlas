#!/usr/bin/env python3
"""
build_dashboard.py — Codex Atlas vault → DASHBOARD.md + canonical-slugs.md + per-phase _TODO.md

Scans the vault and produces:
  00_meta/DASHBOARD.md             — single-page state-of-the-vault
  00_meta/dead-links.md            — priority queue: highest-referenced unresolved targets
  00_meta/orphan-nodes.md          — nodes with zero incoming AND outgoing edges
  00_meta/quality-issues.md        — status claims that don't meet the bar
  02_documents/_phase-N-…/_TODO.md — per-phase: docs not yet at partial; named-entity gaps
  00_meta/canonical-slugs.md       — currently-resolved slug registry (initial seed; manual edits welcome)

Run from the vault root:
    python3 build_dashboard.py

Stdlib only — no dependencies. Designed to run in <2s on the current ~1000-node vault.
"""

import os
import re
import glob
import json
import datetime
from collections import Counter, defaultdict
from pathlib import Path

VAULT = Path(__file__).parent
META = VAULT / "00_meta"

NODE_DIRS = {
    "document":   "02_documents",
    "deity":      "03_deities",
    "person":     "04_persons",
    "event":      "05_events",
    "theme":      "06_themes",
    "tradition":  "07_traditions",
    "symbol":     "09_symbols",
}

# ---------- minimal YAML parser tailored to our schema ----------
def parse_yaml_block(text: str) -> dict:
    """Extract the YAML frontmatter (between leading ---/---) and return a dict.
    Only handles the subset of YAML our schemas use: scalars, inline lists, single-line key:value.
    Multi-line refs blocks are returned as the raw string so downstream code can count entries.
    """
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 4)
    if end == -1:
        return {}
    block = text[4:end]
    result = {}
    current_key = None
    list_buffer = []
    for raw in block.splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        # Top-level key:value
        m = re.match(r'^([a-zA-Z][\w\-]*?):\s*(.*)$', raw)
        if m and not raw.startswith(" "):
            if current_key and list_buffer:
                result[current_key] = list_buffer
                list_buffer = []
            key, val = m.group(1), m.group(2).strip()
            current_key = None
            if val == "":
                current_key = key
                list_buffer = []
            elif val.startswith("[") and val.endswith("]"):
                inner = val[1:-1].strip()
                if not inner:
                    result[key] = []
                else:
                    result[key] = [s.strip().strip('"').strip("'") for s in re.split(r',\s*(?![^\[\]]*\])', inner)]
            else:
                result[key] = val.strip().strip('"').strip("'")
        elif raw.startswith("  - ") and current_key:
            list_buffer.append(raw[4:].strip())
    if current_key and list_buffer:
        result[current_key] = list_buffer
    return result


def extract_wikilinks(text: str) -> list:
    return [m.group(1).strip().split("/")[-1].replace(".md", "")
            for m in re.finditer(r'\[\[([^\]|#]+?)(?:\|[^\]]+)?\]\]', text)]


def count_refs_in_yaml(text: str) -> int:
    """Crude but reliable: count top-level entries under `refs:` block."""
    m = re.search(r'^refs:\s*$\n((?:^  -.*$\n(?:^    .*$\n)*)+)', text, re.MULTILINE)
    if not m:
        return 0
    return sum(1 for ln in m.group(1).splitlines() if ln.startswith("  - "))


# ---------- scan ----------

print(f"build_dashboard: scanning {VAULT}")

nodes = []                                          # list of dicts
links_by_source = defaultdict(list)                 # source-stem -> [target stems]
links_to_target = defaultdict(int)                  # target-stem -> count of incoming
incoming_nodes  = defaultdict(set)                  # target-stem -> set of source stems

for md_path in glob.glob(str(VAULT / "**/*.md"), recursive=True):
    rel = os.path.relpath(md_path, VAULT)
    stem = Path(md_path).stem
    if stem in ("README", "MEMORY"):
        continue
    try:
        text = open(md_path, encoding="utf-8").read()
    except Exception:
        continue
    yaml = parse_yaml_block(text)
    node = {
        "stem": stem,
        "path": rel,
        "type":   yaml.get("type", ""),
        "status": yaml.get("status", ""),
        "title":  yaml.get("title") or yaml.get("name") or stem,
        "tradition": yaml.get("tradition", ""),
        "n_refs": count_refs_in_yaml(text),
        "needs":  yaml.get("needs", []),
        "priority": yaml.get("priority", ""),
        "last_touched": yaml.get("last-touched", ""),
    }
    nodes.append(node)
    targets = extract_wikilinks(text)
    for t in targets:
        if t == stem:
            continue
        links_by_source[stem].append(t)
        links_to_target[t] += 1
        incoming_nodes[t].add(stem)

stems_set = {n["stem"] for n in nodes}
nodes_by_type = defaultdict(list)
for n in nodes:
    nodes_by_type[n["type"] or "other"].append(n)


# ---------- derived metrics ----------

dead = [(t, c) for t, c in links_to_target.items() if t not in stems_set]
dead.sort(key=lambda x: -x[1])

orphans = []  # nodes with zero incoming AND zero outgoing
for n in nodes:
    outgoing = len(links_by_source.get(n["stem"], []))
    incoming = links_to_target.get(n["stem"], 0)
    if outgoing == 0 and incoming == 0 and n["type"] not in ("", "other"):
        orphans.append(n)

status_counts = defaultdict(lambda: Counter())
for n in nodes:
    if not n["type"]:
        continue
    status_counts[n["type"]][n["status"] or "(unset)"] += 1

quality_issues = []
for n in nodes:
    if n["type"] == "document":
        if n["status"] in ("metadata", "partial", "full-text") and n["n_refs"] < 2:
            quality_issues.append((n, f"status:{n['status']} but only {n['n_refs']} refs"))
        if n["status"] in ("partial", "full-text") and n["n_refs"] < 4:
            quality_issues.append((n, f"status:{n['status']} but only {n['n_refs']} refs (need 4+)"))
    elif n["type"] in ("deity", "person", "theme", "event", "tradition"):
        if n["status"] in ("metadata", "full") and n["n_refs"] < 2:
            quality_issues.append((n, f"status:{n['status']} but only {n['n_refs']} refs"))
    elif n["type"] == "symbol":
        # Symbols at metadata/full need >=3 Tier-1 refs per schema-symbol.md.
        if n["status"] in ("metadata", "full") and n["n_refs"] < 3:
            quality_issues.append((n, f"symbol status:{n['status']} but only {n['n_refs']} refs (need 3+)"))


# ---------- write DASHBOARD.md ----------

today = datetime.date.today().isoformat()
total_nodes = len([n for n in nodes if n["type"]])
total_links = sum(len(v) for v in links_by_source.values())
resolved_links = sum(c for t, c in links_to_target.items() if t in stems_set)
dead_occ = sum(c for _, c in dead)

dash = []
dash.append(f"# Vault Dashboard\n")
dash.append(f"_Auto-generated by `build_dashboard.py` on {today}. Re-run after every batch._\n")
dash.append("## At a glance\n")
dash.append(f"- **Total content nodes:** {total_nodes}")
dash.append(f"- **Total wikilink occurrences:** {total_links} ({resolved_links} resolve, {dead_occ} dead → "
            f"{dead_occ*100/(total_links or 1):.1f}% dead-occurrence ratio)")
dash.append(f"- **Distinct dead targets:** {len(dead)}  ·  **Orphan nodes:** {len(orphans)}  ·  **Quality issues:** {len(quality_issues)}\n")

dash.append("## Inventory by type × status\n")
dash.append("| Type | stub | metadata | partial | full-text | full | (unset) | **total** |")
dash.append("|---|---:|---:|---:|---:|---:|---:|---:|")
all_statuses = ["stub", "metadata", "partial", "full-text", "full", "(unset)"]
for t in ["document", "deity", "person", "event", "theme", "tradition", "symbol"]:
    sc = status_counts[t]
    row = [f"| {t}"]
    total = sum(sc.values())
    for s in all_statuses:
        row.append(f"{sc[s] or '·'}")
    row.append(f"**{total}**")
    dash.append(" | ".join(row) + " |")

# ---------- Open AUDIT proposals ----------
# Standing audit documents in AUDIT/ are large structural proposals that the
# unstubbed-wikilink queue does not surface. Without this section, agents
# repeatedly stub low-priority filler instead of picking up architectural
# extensions (material-witness layer, geographic map, scholar role-class,
# new edge types, etc.). See AUDIT/10_app-and-infrastructure-audit.md §6.
audit_dir = VAULT / "AUDIT"
audit_files = []
if audit_dir.exists():
    for p in sorted(audit_dir.glob("*.md")):
        try:
            atext = p.read_text(encoding="utf-8")
            heading = ""
            for ln in atext.splitlines():
                if ln.startswith("# "):
                    heading = ln[2:].strip()
                    break
            if not heading:
                heading = p.stem
            mtime = datetime.date.fromtimestamp(p.stat().st_mtime).isoformat()
            audit_files.append((p.name, heading, mtime))
        except Exception:
            continue

if audit_files:
    dash.append("\n## Open AUDIT proposals\n")
    dash.append(f"Standing audit documents in [`AUDIT/`](../AUDIT/). These are large structural proposals "
                f"and content-gap surveys that the unstubbed-wikilink queue below does NOT surface. "
                f"**Read them before starting an architectural batch** — many propose work that's been "
                f"sitting unimplemented across multiple sessions.\n")
    dash.append("| File | Audit | Last touched |")
    dash.append("|---|---|---|")
    for name, heading, mtime in audit_files:
        dash.append(f"| [{name}](../AUDIT/{name}) | {heading} | {mtime} |")

dash.append("\n## Top 30 unresolved wikilink targets (priority queue)\n")
dash.append("These are nodes that should exist but don't. The number is how many existing nodes link to each. "
            "Stubbing high-count targets gives the biggest graph-integrity ROI.\n")
dash.append("| Refs | Target | Likely type |")
dash.append("|---:|---|---|")
def guess_type(slug):
    if slug.startswith("phase-"): return "document (slug-drift)"
    if slug.startswith("event-"): return "event"
    if slug.startswith("tradition-"): return "tradition"
    if "-archangel" in slug: return "deity (archangel)"
    if slug in ("adam","eve","noah","abraham","moses","seth","enoch","cain","abel"): return "person (biblical)"
    return "—"
for t, c in dead[:30]:
    dash.append(f"| {c} | `{t}` | {guess_type(t)} |")

dash.append(f"\n## Orphan nodes ({len(orphans)})\n")
dash.append("Nodes with zero incoming + zero outgoing edges. May be stale, mislabeled, or simply forgotten.\n")
if orphans[:20]:
    for o in orphans[:20]:
        dash.append(f"- `{o['stem']}` ({o['type']}, status: {o['status'] or '?'})")
    if len(orphans) > 20:
        dash.append(f"- … and {len(orphans) - 20} more — see [orphan-nodes.md](orphan-nodes.md)")
else:
    dash.append("_(none)_")

dash.append(f"\n## Quality issues ({len(quality_issues)})\n")
dash.append("Status claims that don't meet the bar in [methodology.md](methodology.md).\n")
for n, msg in quality_issues[:20]:
    dash.append(f"- `{n['stem']}` ({n['type']}) — {msg}")
if len(quality_issues) > 20:
    dash.append(f"- … and {len(quality_issues) - 20} more — see [quality-issues.md](quality-issues.md)")

dash.append("\n---\n")
dash.append("## How to read this file\n")
dash.append("- This file is **read by every agent before starting work** (pre-flight protocol).")
dash.append("- The **priority queue** above is the recommended next-stub list — high-count targets first.")
dash.append("- Don't stub items already in flight in another agent (check the [STATUS.md](STATUS.md) recently-completed log).")
dash.append("- Re-run `python3 build_dashboard.py` from the vault root after any batch.\n")

(META / "DASHBOARD.md").write_text("\n".join(dash), encoding="utf-8")
print(f"  wrote 00_meta/DASHBOARD.md")


# ---------- write dead-links.md ----------

dl = []
dl.append("# Unresolved wikilink targets (priority queue)\n")
dl.append(f"_Auto-generated {today}. Targets sorted by incoming reference count (descending)._\n")
dl.append("| Refs | Target | Sources (first 3) |")
dl.append("|---:|---|---|")
for t, c in dead:
    sources = list(incoming_nodes[t])[:3]
    dl.append(f"| {c} | `{t}` | {', '.join(f'`{s}`' for s in sources)}{' …' if len(incoming_nodes[t]) > 3 else ''} |")
(META / "dead-links.md").write_text("\n".join(dl), encoding="utf-8")
print(f"  wrote 00_meta/dead-links.md ({len(dead)} targets)")


# ---------- write orphan-nodes.md ----------

orph = ["# Orphan nodes\n", f"_Auto-generated {today}. Nodes with zero edges in either direction._\n"]
orph.append("| Stem | Type | Status |")
orph.append("|---|---|---|")
for n in orphans:
    orph.append(f"| `{n['stem']}` | {n['type']} | {n['status'] or '?'} |")
(META / "orphan-nodes.md").write_text("\n".join(orph), encoding="utf-8")
print(f"  wrote 00_meta/orphan-nodes.md ({len(orphans)} nodes)")


# ---------- write quality-issues.md ----------

qi = ["# Quality issues\n", f"_Auto-generated {today}. Status claims not meeting the bar in methodology.md._\n"]
qi.append("| Node | Type | Issue |")
qi.append("|---|---|---|")
for n, msg in quality_issues:
    qi.append(f"| `{n['stem']}` | {n['type']} | {msg} |")
(META / "quality-issues.md").write_text("\n".join(qi), encoding="utf-8")
print(f"  wrote 00_meta/quality-issues.md ({len(quality_issues)} issues)")


# ---------- per-phase _TODO.md ----------

for phase_dir in sorted(glob.glob(str(VAULT / "02_documents" / "_phase-*"))):
    phase_name = Path(phase_dir).name
    phase_docs = [n for n in nodes if n["type"] == "document" and n["path"].startswith(f"02_documents/{phase_name}/")]
    if not phase_docs:
        continue
    not_partial = [d for d in phase_docs if d["status"] not in ("partial", "full-text", "full")]

    # named-entity gaps: persons referenced from this phase's docs but not yet stubbed
    referenced_persons = Counter()
    for d in phase_docs:
        for tgt in links_by_source.get(d["stem"], []):
            if tgt not in stems_set and not tgt.startswith("phase-") and not tgt.startswith("tradition-") and not tgt.startswith("event-"):
                referenced_persons[tgt] += 1
    top_gaps = referenced_persons.most_common(25)

    tdl = []
    tdl.append(f"# {phase_name} — TODO\n")
    tdl.append(f"_Auto-generated {today}._\n")
    tdl.append(f"## Documents not yet at `partial` ({len(not_partial)} of {len(phase_docs)})\n")
    for d in not_partial:
        tdl.append(f"- [ ] `{d['stem']}` — status: {d['status'] or '?'} ({d['n_refs']} refs)")
    tdl.append(f"\n## Top unstubbed wikilink targets from this phase ({len(top_gaps)})\n")
    tdl.append("(stub these to close out internal references)\n")
    for tgt, c in top_gaps:
        tdl.append(f"- [ ] `{tgt}` — referenced {c}×")
    Path(phase_dir, "_TODO.md").write_text("\n".join(tdl), encoding="utf-8")
    print(f"  wrote {phase_name}/_TODO.md")


# ---------- canonical-slugs.md (initial seed) ----------

# Group all stems by likely-concept (same first 3 path-segment-tokens or same dashed-prefix)
# and surface the *resolved* canonical form plus the *unresolved* near-duplicates from dead links.

canonical = ["# Canonical slug registry\n",
             f"_Initially seeded {today}. **Edit this file by hand to lock the canonical form.**_\n",
             "When agents or humans rename a node, add the old slug here as an alias so future agents",
             "can detect and avoid drift. The build_dashboard.py audit cross-checks dead-link targets",
             "against this registry to suggest fixes.\n",
             "## Format\n",
             "```",
             "canonical-slug",
             "  also seen as: old-slug-1, old-slug-2",
             "  notes: optional context (renamed YYYY-MM-DD because ...)",
             "```\n",
             "## Currently resolved slugs (auto-seeded — every existing file)\n"]

by_type = defaultdict(list)
for n in nodes:
    if not n["type"]: continue
    by_type[n["type"]].append(n["stem"])

for t in sorted(by_type):
    canonical.append(f"\n### {t} ({len(by_type[t])} nodes)\n")
    for s in sorted(by_type[t]):
        canonical.append(f"- `{s}`")

# also seed the known slug-drift conflicts (suggest canonical based on existing)
canonical.append("\n## Known historical drift / suggested fixes\n")
canonical.append("(Generated from current dead-link analysis — fuzzy-match against existing slugs)\n")
suggestions = []
for dead_slug, c in dead[:50]:
    # simple fuzzy: look for an existing stem that shares a substantial substring
    for stem in stems_set:
        if dead_slug == stem: continue
        # crude similarity
        a, b = dead_slug.replace('-', ''), stem.replace('-', '')
        if len(a) > 8 and len(b) > 8:
            overlap = len(set(re.findall(r'.{4}', a)) & set(re.findall(r'.{4}', b)))
            if overlap >= 2 and abs(len(a) - len(b)) < 8:
                suggestions.append((c, dead_slug, stem))
                break
suggestions.sort(reverse=True)
canonical.append("| Refs | Dead target | Suggested canonical (existing) |")
canonical.append("|---:|---|---|")
for c, dead_slug, stem in suggestions[:30]:
    canonical.append(f"| {c} | `{dead_slug}` | `{stem}` |")

(META / "canonical-slugs.md").write_text("\n".join(canonical), encoding="utf-8")
print(f"  wrote 00_meta/canonical-slugs.md")

print(f"\ndone — {total_nodes} nodes scanned · {dead_occ} dead occurrences ({dead_occ*100/(total_links or 1):.1f}%)")
