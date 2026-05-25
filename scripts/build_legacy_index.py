#!/usr/bin/env python3
"""
build_legacy_index.py — TYRANT Phase 24 (2026-05-25).

Walks the on-disk archive sources (AUDIT/, 00_meta/status-archive/,
00_meta/HANDOFF-*.md) and writes `src/data/legacy-index.json` — the
single source of truth for the Legacy/Archive viewer (Phase 24 V1).

Categories (4):
  - specs        : AUDIT/*.md whose filename contains 'spec' /
                   'tradeoff' / 'epilogue' / 'remediation-plan' /
                   'rationale'
  - audits       : other AUDIT/*.md (recon / findings / inventories)
  - status       : 00_meta/status-archive/*.md (rolling-window archives)
  - handoffs     : 00_meta/HANDOFF-*.md (historical session handoffs)
                   — does NOT include 00_meta/HANDOFF.md (that's the
                   live one).

Per file we capture: path, title, category, date (best effort).
Date extraction order: (1) YYYY-MM-DD prefix in filename, (2) **Date:**
front matter, (3) git mtime fallback, (4) null.

Run manually or wire into the build pipeline. Stdlib only.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT  = ROOT / "src" / "data" / "legacy-index.json"

SPEC_KEYWORDS = ("spec", "tradeoff", "epilogue", "remediation-plan", "rationale")
DATE_FN_RE    = re.compile(r"(\d{4}-\d{2}-\d{2})")
DATE_BODY_RE  = re.compile(r"^\*\*Date(?:\s+filed)?:\*\*\s*(\d{4}-\d{2}-\d{2})", re.M)
TITLE_RE      = re.compile(r"^#\s+(.+?)\s*$", re.M)

def git_date(path):
    try:
        r = subprocess.run(
            ["git", "log", "-1", "--format=%ad", "--date=short", "--", str(path)],
            cwd=ROOT, capture_output=True, text=True, timeout=5,
        )
        s = r.stdout.strip()
        return s if re.match(r"\d{4}-\d{2}-\d{2}$", s) else None
    except Exception:
        return None

def extract(path):
    rel  = path.relative_to(ROOT).as_posix()
    text = path.read_text(errors="replace")
    title_m = TITLE_RE.search(text)
    title   = title_m.group(1).strip() if title_m else path.stem
    # date
    date = None
    fn_m = DATE_FN_RE.search(path.name)
    if fn_m:
        date = fn_m.group(1)
    else:
        body_m = DATE_BODY_RE.search(text)
        if body_m: date = body_m.group(1)
    if not date:
        date = git_date(path)
    return {"path": rel, "title": title, "date": date}

def classify_audit(path):
    name = path.name.lower()
    for kw in SPEC_KEYWORDS:
        if kw in name: return "specs"
    return "audits"

def main():
    entries = {"specs": [], "audits": [], "status": [], "handoffs": []}

    # AUDIT/
    audit_dir = ROOT / "AUDIT"
    if audit_dir.exists():
        for p in audit_dir.rglob("*.md"):
            # skip dead-link baseline + archive subfolder
            if p.name == "dead-link-baseline.txt": continue
            if "archive" in p.parts: continue
            cat = classify_audit(p)
            entry = extract(p)
            entry["category"] = cat
            entries[cat].append(entry)

    # 00_meta/status-archive/
    sa = ROOT / "00_meta" / "status-archive"
    if sa.exists():
        for p in sa.rglob("*.md"):
            entry = extract(p)
            entry["category"] = "status"
            entries["status"].append(entry)

    # 00_meta/HANDOFF-*.md (dated handoffs; live HANDOFF.md excluded)
    meta = ROOT / "00_meta"
    if meta.exists():
        for p in meta.glob("HANDOFF-*.md"):
            entry = extract(p)
            entry["category"] = "handoffs"
            entries["handoffs"].append(entry)

    # sort each category by date desc (None last)
    for cat, rows in entries.items():
        rows.sort(key=lambda r: (r["date"] or "0000-00-00"), reverse=True)

    payload = {
        "generated_at_utc":   subprocess.run(
                                  ["date", "-u", "+%Y-%m-%dT%H:%M:%SZ"],
                                  capture_output=True, text=True,
                              ).stdout.strip(),
        "counts": {k: len(v) for k, v in entries.items()},
        "totals": sum(len(v) for v in entries.values()),
        "entries": entries,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    print(f"[legacy-index] wrote {OUT.relative_to(ROOT)}")
    print(f"[legacy-index] counts: " + " · ".join(f"{k}={v}" for k, v in payload["counts"].items()))
    print(f"[legacy-index] total entries: {payload['totals']}")

if __name__ == "__main__":
    main()
