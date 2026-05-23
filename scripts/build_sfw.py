#!/usr/bin/env python3
"""
build_sfw.py — emit a SFW (Safe-For-Web) variant of data.js with all
political-risk-flag content stripped.

Per CODEX v1.3 §IX — "The SFW / MAGNUM doctrine":

- **MAGNUM** = the full vault. data.js (built by build_data.py). Contains
  every node and every edge including political-risk-flag content.
  Local-only by default. Gitignored. Eventually unlocked for trusted
  subscribers / institutions / academies via auth — never anonymous
  public access.

- **SFW** = data-sfw.js. The full vault MINUS every node where
  political_risk_flag is true AND every edge incident on such a node
  AND every edge whose own political_risk_flag is true. No
  breadcrumbs, no orphan placeholders, no clues for scrapers.

Default deploy posture (production server) = upload SFW only. The
MAGNUM upload is gated on explicit human-audit sign-off (the
00_meta/HIGH-ALERT-INDEX.md review).

USAGE:
    python3 scripts/build_sfw.py        # reads ./data.js, writes ./data-sfw.js

The output is a `window.VAULT_DATA = {...}` payload identical in shape
to data.js. The HTML serves the SFW version on the public server (a
deploy step copies data-sfw.js → data.js on the host).

Both data.js AND data-sfw.js are gitignored — they live only on John's
local machine (MAGNUM) and the production host (SFW), never in git.
"""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DATA_IN  = ROOT / "data.js"
DATA_OUT = ROOT / "data-sfw.js"


def load_vault(path: Path) -> dict:
    txt = path.read_text(encoding="utf-8")
    m = re.search(r"window\.VAULT_DATA\s*=\s*(\{.*\});\s*$", txt, re.S)
    if not m:
        raise SystemExit(f"ERROR: could not parse window.VAULT_DATA payload in {path}")
    return json.loads(m.group(1))


def strip_political_risk(vault: dict) -> tuple[dict, dict]:
    """Return (sfw_vault, stats). Mutates a copy of the input."""

    nodes = vault.get("nodes", []) or []
    edges = vault.get("edges", []) or []

    # 1. Identify NODES that must be stripped.
    flagged_node_ids = set()
    for n in nodes:
        if n.get("political_risk_flag"):
            flagged_node_ids.add(n.get("id"))

    # 2. Identify EDGES that must be stripped.
    #    Stripping rule:
    #      (a) the edge itself carries political_risk_flag=true, OR
    #      (b) either endpoint is a flagged node
    #    (b) is the "no orphans, no clues" rule — even a T1
    #    consort-of edge becomes a breadcrumb if the consort is
    #    flagged. We strip it.
    edges_in        = len(edges)
    edges_kept      = []
    edges_dropped   = 0
    edges_by_flag   = 0
    edges_by_orphan = 0
    for e in edges:
        if e.get("political_risk_flag"):
            edges_dropped += 1
            edges_by_flag += 1
            continue
        s = e.get("source")
        t = e.get("target")
        if s in flagged_node_ids or t in flagged_node_ids:
            edges_dropped += 1
            edges_by_orphan += 1
            continue
        edges_kept.append(e)

    # 3. Strip the flagged nodes themselves.
    nodes_in   = len(nodes)
    nodes_kept = [n for n in nodes if not n.get("political_risk_flag")]

    # 4. Stats for the build log.
    stats = {
        "nodes_in":            nodes_in,
        "nodes_dropped":       nodes_in - len(nodes_kept),
        "nodes_out":           len(nodes_kept),
        "edges_in":            edges_in,
        "edges_dropped":       edges_dropped,
        "edges_by_flag":       edges_by_flag,
        "edges_by_orphan":     edges_by_orphan,
        "edges_out":           len(edges_kept),
        "flagged_node_ids":    sorted(flagged_node_ids),
    }

    # 5. Build the SFW vault. Preserve every other key from the input
    #    so the HTML loads transparently.
    sfw = dict(vault)            # shallow copy — same generated_at_utc, traditions, families
    sfw["nodes"] = nodes_kept
    sfw["edges"] = edges_kept

    # 6. Recount the `counts` object (deity / theme / etc.) so the HUD
    #    badges + tier histograms reflect the SFW reality.
    from collections import Counter
    new_counts = Counter()
    for n in nodes_kept:
        t = n.get("type") or "?"
        new_counts[t] += 1
    sfw["counts"] = dict(new_counts)

    # 7. Mark the payload as SFW so the front-end can render a
    #    "viewing public version" indicator if/when we add one.
    sfw["sfw"] = True

    return sfw, stats


def main() -> int:
    if not DATA_IN.exists():
        print(f"ERROR: {DATA_IN} not found — run `python3 build_data.py` first.", file=sys.stderr)
        return 1

    vault = load_vault(DATA_IN)
    sfw, stats = strip_political_risk(vault)

    payload = json.dumps(sfw, indent=2, ensure_ascii=False)
    DATA_OUT.write_text(f"window.VAULT_DATA = {payload};\n", encoding="utf-8")

    print(f"OK  wrote {DATA_OUT}")
    print(f"  nodes : {stats['nodes_in']} in → {stats['nodes_out']} out ({stats['nodes_dropped']} stripped)")
    print(f"  edges : {stats['edges_in']} in → {stats['edges_out']} out ({stats['edges_dropped']} stripped)")
    print(f"          ({stats['edges_by_flag']} flag-on-edge + {stats['edges_by_orphan']} orphan-after-node-strip)")
    if stats["flagged_node_ids"]:
        print(f"  Stripped node ids:")
        for nid in stats["flagged_node_ids"]:
            print(f"    - {nid}")
    else:
        print(f"  (no political-risk-flagged nodes currently in vault — SFW = MAGNUM minus 0)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
