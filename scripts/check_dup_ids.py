#!/usr/bin/env python3
"""
check_dup_ids.py — pre-commit dup-ID gate.

Scans every .md in the working tree for `id:` frontmatter fields.
If a STAGED .md file's id collides with ANOTHER existing file's id,
exit 2 with a list of collisions.

TYRANT remediation Phase 2 (2026-05-25) — finding #5. Promotes the
dup-slug check from build_data.py post-build to pre-commit. The
`ATLAS_ALLOW_DUP_ID=1` escape hatch was deleted; this is the
canonical gate.

Exit codes:
  0  — clean (or no staged Lane A md files)
  1  — internal error
  2  — DUP_ID_FOUND, with collisions printed to stdout
"""
import glob
import re
import subprocess
import sys
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
ID_RE = re.compile(r'^id\s*:\s*["\']?([^"\'\n]+?)["\']?\s*$', re.MULTILINE)


def staged_lane_a_md():
    """Return list of staged .md paths under a Lane A folder."""
    try:
        out = subprocess.check_output(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
            text=True, cwd=str(VAULT),
        )
    except Exception:
        return []
    res = []
    for p in out.splitlines():
        if not p.endswith(".md"):
            continue
        # Lane A: numbered folders 01_ through 32_.
        if any(p.startswith(f"{i:02d}_") for i in range(1, 33)):
            res.append(p)
    return res


def main():
    staged = staged_lane_a_md()
    if not staged:
        return 0
    # Build id → file map from the WORKING TREE.
    id_map = {}
    collisions = []
    for f in glob.glob(str(VAULT / "**/*.md"), recursive=True):
        rel = str(Path(f).relative_to(VAULT))
        try:
            head = open(f, encoding="utf-8").read(2000)
        except Exception:
            continue
        if not head.startswith("---"):
            continue
        m = ID_RE.search(head[:1500])
        if not m:
            continue
        nid = m.group(1).strip()
        if nid in id_map and id_map[nid] != rel:
            collisions.append((nid, id_map[nid], rel))
        else:
            id_map.setdefault(nid, rel)
    # Only report collisions where AT LEAST ONE file is in the
    # current staged set — pre-existing collisions outside the
    # staged change aren't this commit's fault.
    staged_set = set(staged)
    relevant = [(i, a, b) for i, a, b in collisions if a in staged_set or b in staged_set]
    if relevant:
        print("DUP_ID_FOUND")
        for nid, a, b in relevant:
            print(f"  id={nid!r}  first={a}  second={b}")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
