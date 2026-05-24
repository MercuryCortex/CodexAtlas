#!/usr/bin/env python3
"""
lint_yaml.py — schema + wikilink lint for Codex Atlas vault nodes.

Complements build_dashboard.py (which counts dead links and quality issues)
by enforcing schema-level invariants:

  ERRORS (blockers — node will likely break the build)
    - YAML frontmatter is missing or malformed
    - required fields are absent (type, id or title)
    - `type` is not one of the known node types

  WARNINGS (silent quality degraders — atlas still builds)
    - file stem and YAML `id` slug disagree (slug drift)
    - date-composed-latest < date-composed-earliest
    - date-died < date-born
    - wikilink target does not resolve to any known node or canonical-slugs alias
      (these are also surfaced by build_dashboard.py; lint shows them per-source)

Usage:
    python3 lint_yaml.py                 # writes 00_meta/lint-report.md, exits 0
    python3 lint_yaml.py --strict        # exits 1 if any ERRORS found (for CI)
    python3 lint_yaml.py --quiet         # only writes the report, no console output

Stdlib only. Designed to run in <3s on the current ~1700-node vault.
"""

import argparse
import datetime
import glob
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

VAULT = Path(__file__).parent
META = VAULT / "00_meta"

# TYRANT remediation Phase 2 (2026-05-25) — finding #3:
# `lint_yaml.py` was validating only 7 of the 29 node types
# build_data.py recognizes (22 types silently passed through).
# Locked here as the single source of truth, mirrored from
# build_data.py NODE_DIRS lines 21–62. If you add a type there,
# add it here too.
NODE_DIRS = {
    # Original 16-lens spine (pre-2026-05-18).
    "document":             "02_documents",
    "deity":                "03_deities",
    "person":               "04_persons",
    "event":                "05_events",
    "theme":                "06_themes",
    "tradition":            "07_traditions",
    "symbol":               "09_symbols",
    "music":                "10_music",
    "alphabet":             "11_alphabets",
    "alchemy":              "12_alchemy",
    "moral":                "13_morals",
    "ritual":               "14_rituals",
    "philosophy":           "15_philosophy",
    "mathematics":          "16_mathematics",
    "medicine":             "17_medicine",
    # 10 lenses added 2026-05-18 (ontology lock pass 2).
    "place":                "08_places",
    "language":             "18_languages",
    "astronomy":            "19_astronomy",
    "sacred-site":          "20_sacred_architecture",
    "doctrine":             "21_theology",
    "practice":             "22_practices",
    "relic":                "23_material_culture",
    "substance":            "24_pharmacology",
    "divination-system":    "25_divination",
    "calendar-system":      "26_calendars",
    # 3 lenses added 2026-05-19 (ontology lock pass 3).
    "attire":               "27_attire",
    "exchange-network":     "28_exchange_networks",
    "technology":           "29_technology",
    # Consciousness seed (2026-05-24).
    "consciousness-figure": "31_consciousness/figures",
}
KNOWN_TYPES = set(NODE_DIRS.keys())


def parse_yaml_block(text: str) -> dict:
    """Mirror of build_dashboard.parse_yaml_block — kept inline so this script
    is fully standalone."""
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
                    result[key] = [s.strip().strip('"').strip("'")
                                   for s in re.split(r',\s*(?![^\[\]]*\])', inner)]
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


def parse_int(v):
    if v in (None, "", "?"):
        return None
    try:
        return int(str(v).strip())
    except ValueError:
        return None


def slug_aliases(slug):
    """A slug and its id-form mirror. Mirrors scriptureBookAliases() in app.js."""
    out = {slug}
    m1 = re.match(r"^phase-(\d+)-(.*)$", slug)
    if m1:
        out.add(f"P{m1.group(1)}-{m1.group(2)}")
    m2 = re.match(r"^P(\d+)-(.*)$", slug)
    if m2:
        out.add(f"phase-{m2.group(1)}-{m2.group(2)}")
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--strict", action="store_true", help="exit 1 if any ERRORS found")
    ap.add_argument("--quiet", action="store_true", help="only write the report")
    args = ap.parse_args()

    errors = []        # [(severity, file, message)]
    warnings = []
    nodes = []

    # First pass: collect all known stems + canonical slug aliases
    all_stems = set()
    for type_name, dir_name in NODE_DIRS.items():
        for md_path in glob.glob(str(VAULT / dir_name / "**/*.md"), recursive=True):
            stem = Path(md_path).stem
            if stem.startswith("_"):  # _TODO.md and similar
                continue
            if stem.upper() == "README":   # TYRANT Phase 2: lens README docs
                continue                   # are documentation, not nodes
            all_stems.add(stem)

    # Read canonical-slugs.md for aliases (lines under "also seen as:")
    canonical_aliases = set()
    cs_path = META / "canonical-slugs.md"
    if cs_path.exists():
        for ln in cs_path.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^\s+also seen as:\s*(.*)$", ln)
            if m:
                for alias in m.group(1).split(","):
                    canonical_aliases.add(alias.strip())

    resolvable = set()
    for s in all_stems:
        for alias in slug_aliases(s):
            resolvable.add(alias)
    resolvable |= canonical_aliases

    # Second pass: per-node lint
    for type_name, dir_name in NODE_DIRS.items():
        for md_path in glob.glob(str(VAULT / dir_name / "**/*.md"), recursive=True):
            rel = os.path.relpath(md_path, VAULT)
            stem = Path(md_path).stem
            if stem.startswith("_"):
                continue
            if stem.upper() == "README":   # see first-pass note
                continue
            try:
                text = open(md_path, encoding="utf-8").read()
            except Exception as e:
                errors.append(("ERROR", rel, f"unreadable: {e}"))
                continue

            yaml = parse_yaml_block(text)
            nodes.append((stem, type_name, yaml))

            # ERROR: no YAML at all
            if not yaml:
                errors.append(("ERROR", rel, "no YAML frontmatter (file does not start with '---')"))
                continue

            # ERROR: no `type` field
            if not yaml.get("type"):
                errors.append(("ERROR", rel, "YAML missing required `type:` field"))
                continue

            ytype = yaml.get("type", "")
            if ytype != type_name:
                # Note: type-folder mismatch is suspicious but allowable in some cases
                # (e.g., a person node placed under documents — but that's wrong).
                errors.append(("ERROR", rel,
                               f"`type: {ytype}` but file lives in {dir_name}/ (folder implies type {type_name})"))

            # ERROR: no title or name
            if not (yaml.get("title") or yaml.get("name")):
                errors.append(("ERROR", rel, "YAML missing both `title:` and `name:`"))

            # WARNING: id ↔ stem drift
            yid = yaml.get("id", "")
            if yid:
                # Strip quotes that may have leaked through, normalize id-form
                yid_norm = yid.strip().strip('"').strip("'")
                if yid_norm and yid_norm not in slug_aliases(stem):
                    warnings.append(("WARN", rel,
                                     f"YAML `id: {yid_norm}` does not match file stem `{stem}` (or alias)"))

            # WARNING: date sanity
            if ytype == "document":
                early = parse_int(yaml.get("date-composed-earliest"))
                late = parse_int(yaml.get("date-composed-latest"))
                if early is not None and late is not None and late < early:
                    warnings.append(("WARN", rel,
                                     f"date-composed-latest ({late}) < date-composed-earliest ({early})"))
            if ytype == "person":
                born = parse_int(yaml.get("date-born"))
                died = parse_int(yaml.get("date-died"))
                if born is not None and died is not None and died < born:
                    warnings.append(("WARN", rel, f"date-died ({died}) < date-born ({born})"))
                fearly = parse_int(yaml.get("floruit-earliest"))
                flate = parse_int(yaml.get("floruit-latest"))
                if fearly is not None and flate is not None and flate < fearly:
                    warnings.append(("WARN", rel,
                                     f"floruit-latest ({flate}) < floruit-earliest ({fearly})"))

            # WARNING: wikilinks that don't resolve
            seen_dead = set()
            for link in extract_wikilinks(text):
                if not link or link in seen_dead:
                    continue
                if link not in resolvable:
                    warnings.append(("WARN-LINK", rel, f"unresolved wikilink: [[{link}]]"))
                    seen_dead.add(link)

    # Group + write report
    today = datetime.date.today().isoformat()
    error_count = len(errors)
    warn_count = len([w for w in warnings if w[0] == "WARN"])
    link_warn_count = len([w for w in warnings if w[0] == "WARN-LINK"])

    out = []
    out.append(f"# YAML / wikilink lint report\n")
    out.append(f"_Auto-generated by `lint_yaml.py` on {today}._\n")
    out.append("## Summary\n")
    out.append(f"- **{error_count} ERRORS** (blockers — node may break the build)")
    out.append(f"- **{warn_count} schema/date WARNINGS** (silent quality degraders)")
    out.append(f"- **{link_warn_count} unresolved-wikilink WARNINGS** (per-source view; aggregate in `dead-links.md`)")
    out.append(f"- **{len(nodes)} nodes scanned across {len(NODE_DIRS)} folders**\n")

    if error_count:
        out.append("## ERRORS\n")
        out.append("These should be fixed first — they may cause `build_data.py` to drop the node from the atlas, or to misbind its edges.\n")
        for sev, f, msg in errors:
            out.append(f"- [`{f}`]({f}) — {msg}")
        out.append("")

    schema_warns = [w for w in warnings if w[0] == "WARN"]
    if schema_warns:
        out.append("\n## Schema / date warnings\n")
        out.append("Not blockers, but indicate likely data-entry mistakes.\n")
        for sev, f, msg in schema_warns:
            out.append(f"- [`{f}`]({f}) — {msg}")

    link_warns = [w for w in warnings if w[0] == "WARN-LINK"]
    if link_warns:
        # Group by source-file for readability
        by_file = defaultdict(list)
        for sev, f, msg in link_warns:
            target = msg.replace("unresolved wikilink: [[", "").replace("]]", "")
            by_file[f].append(target)
        out.append(f"\n## Unresolved wikilinks (top 30 source nodes by dead-link count)\n")
        out.append("Per-source view of dead wikilinks. (For target-priority order use `00_meta/dead-links.md`.)\n")
        ranked = sorted(by_file.items(), key=lambda kv: -len(kv[1]))[:30]
        for f, targets in ranked:
            out.append(f"- [`{f}`]({f}) — {len(targets)} dead: " + ", ".join(f"`{t}`" for t in targets[:6])
                       + (" …" if len(targets) > 6 else ""))

    (META / "lint-report.md").write_text("\n".join(out), encoding="utf-8")

    if not args.quiet:
        print(f"lint_yaml: scanned {len(nodes)} nodes")
        print(f"  ERRORS:                     {error_count}")
        print(f"  schema/date WARNINGS:       {warn_count}")
        print(f"  unresolved-wikilink WARNS:  {link_warn_count}")
        print(f"  wrote 00_meta/lint-report.md")

    if args.strict and error_count > 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
