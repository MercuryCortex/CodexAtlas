#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_investigation_index.py — READ-ONLY generator for the INVESTIGATION section.

Walks every findings surface in the repo and emits a single deduplicated,
consumer-language index at src/data/investigation-index.json.

Sources harvested (origin tag in parentheses):
  1. src/data/observations.js      window.OBSERVATIONS_DATA   (observations)
  2. src/data/patterns.js          window.PATTERNS_DATA       (patterns)
  3. src/data/chains.js            window.CHAINS_DATA         (chains)
  4. 00_meta/MASSIVE-WINS-INDEX.md                            (massive-wins-index)
  5. 00_meta/MASSIVE-WINS.md                                  (massive-wins-index)
  6. 00_meta/INVESTIGATION-LEADS.md                           (leads)
  7. 00_meta/MASSIVE-WIN-essays/*.md                          (essay)
  8. Content folders 01_*..31_* — every `## MASSIVE WIN*` node section  (node)

CONSUMER LANGUAGE RULE: the literal phrase "MASSIVE WIN" never appears in
title/summary/body of any finding (origin metadata may reference it).
Internal sourcing-tier markers ([T1]..[T4]) are stripped from surfaces.

This script only READS vault content. It writes exactly one file:
  src/data/investigation-index.json
"""

import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(ROOT, "src", "data", "investigation-index.json")

# ───────────────────────────────────────────────────────────────────────────
# Category taxonomy (consumer-facing). Rank = display/sort order.
# ───────────────────────────────────────────────────────────────────────────
CATEGORIES = [
    "Transmission",              # documented movement of an idea/symbol/practice
    "Convergence",               # independent arrival at the same structure
    "Inversion",                 # symbol kept, meaning flipped
    "Conclusion",                # multiple independent confirmations
    "Hypothesis",                # testable claim, data points this way
    "Anomaly",                   # breaks the expected pattern
    "Discovery",                 # manuscript / textual / dating discoveries
    "Open question",             # documented but unsolved
    "Method",                    # about how the investigation reads the record
    "Cross-tradition parallel",  # node-level documented links (the bulk layer)
]
CAT_RANK = {c: i for i, c in enumerate(CATEGORIES)}


# ───────────────────────────────────────────────────────────────────────────
# Minimal JS object-literal parser (data-only files; no expressions).
# Handles ' " ` strings (with escapes), // and /* */ comments, nested
# arrays/objects, numbers, true/false/null, trailing commas.
# ───────────────────────────────────────────────────────────────────────────
class JsParser(object):
    def __init__(self, text):
        self.t = text
        self.i = 0
        self.n = len(text)

    def err(self, msg):
        ctx = self.t[max(0, self.i - 40):self.i + 40].replace("\n", "\\n")
        raise ValueError("JS parse error at %d: %s … %r" % (self.i, msg, ctx))

    def ws(self):
        while self.i < self.n:
            c = self.t[self.i]
            if c in " \t\r\n":
                self.i += 1
            elif self.t.startswith("//", self.i):
                j = self.t.find("\n", self.i)
                self.i = self.n if j < 0 else j + 1
            elif self.t.startswith("/*", self.i):
                j = self.t.find("*/", self.i + 2)
                if j < 0:
                    self.err("unterminated block comment")
                self.i = j + 2
            else:
                return

    def value(self):
        self.ws()
        if self.i >= self.n:
            self.err("eof expecting value")
        c = self.t[self.i]
        if c == "{":
            return self.obj()
        if c == "[":
            return self.arr()
        if c in "'\"`":
            return self.string()
        if c.isdigit() or c == "-" or c == "+" or c == ".":
            return self.number()
        m = re.match(r"[A-Za-z_$][A-Za-z0-9_$]*", self.t[self.i:])
        if m:
            word = m.group(0)
            self.i += len(word)
            if word == "true":
                return True
            if word == "false":
                return False
            if word in ("null", "undefined"):
                return None
            self.err("unexpected identifier %r" % word)
        self.err("unexpected char %r" % c)

    def obj(self):
        out = {}
        self.i += 1  # {
        while True:
            self.ws()
            if self.i < self.n and self.t[self.i] == "}":
                self.i += 1
                return out
            key = self.key()
            self.ws()
            if self.i >= self.n or self.t[self.i] != ":":
                self.err("expected ':' after key %r" % key)
            self.i += 1
            out[key] = self.value()
            self.ws()
            if self.i < self.n and self.t[self.i] == ",":
                self.i += 1
                continue
            if self.i < self.n and self.t[self.i] == "}":
                self.i += 1
                return out
            self.err("expected ',' or '}' in object")

    def key(self):
        self.ws()
        c = self.t[self.i]
        if c in "'\"`":
            return self.string()
        m = re.match(r"[A-Za-z_$][A-Za-z0-9_$]*", self.t[self.i:])
        if not m:
            self.err("expected object key")
        self.i += len(m.group(0))
        return m.group(0)

    def arr(self):
        out = []
        self.i += 1  # [
        while True:
            self.ws()
            if self.i < self.n and self.t[self.i] == "]":
                self.i += 1
                return out
            out.append(self.value())
            self.ws()
            if self.i < self.n and self.t[self.i] == ",":
                self.i += 1
                continue
            if self.i < self.n and self.t[self.i] == "]":
                self.i += 1
                return out
            self.err("expected ',' or ']' in array")

    ESC = {"n": "\n", "t": "\t", "r": "\r", "b": "\b", "f": "\f",
           "v": "\v", "0": "\0", "'": "'", '"': '"', "`": "`", "\\": "\\",
           "\n": ""}  # backslash-newline = line continuation

    def string(self):
        q = self.t[self.i]
        self.i += 1
        buf = []
        while self.i < self.n:
            c = self.t[self.i]
            if c == "\\":
                self.i += 1
                if self.i >= self.n:
                    self.err("dangling backslash")
                e = self.t[self.i]
                if e == "u":
                    hexs = self.t[self.i + 1:self.i + 5]
                    buf.append(chr(int(hexs, 16)))
                    self.i += 5
                    continue
                if e == "x":
                    hexs = self.t[self.i + 1:self.i + 3]
                    buf.append(chr(int(hexs, 16)))
                    self.i += 3
                    continue
                buf.append(self.ESC.get(e, e))
                self.i += 1
                continue
            if c == q:
                self.i += 1
                return "".join(buf)
            if q == "`" and self.t.startswith("${", self.i):
                self.err("template interpolation not supported in data files")
            if q != "`" and c == "\n":
                self.err("newline in non-template string")
            buf.append(c)
            self.i += 1
        self.err("unterminated string")

    def number(self):
        m = re.match(r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?", self.t[self.i:])
        if not m:
            self.err("bad number")
        self.i += len(m.group(0))
        txt = m.group(0)
        return float(txt) if ("." in txt or "e" in txt or "E" in txt) else int(txt)


def parse_js_global(path, global_name):
    """Extract `window.<global_name> = [ ... ]` from a data-only JS file."""
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    m = re.search(r"window\.%s\s*=\s*" % re.escape(global_name), text)
    if not m:
        raise ValueError("global %s not found in %s" % (global_name, path))
    p = JsParser(text)
    p.i = m.end()
    return p.value()


# ───────────────────────────────────────────────────────────────────────────
# Text utilities — consumer-language scrubbing, wikilinks, slugs, summaries.
# ───────────────────────────────────────────────────────────────────────────
WIKILINK_RE = re.compile(r"\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]")
PHASE_PREFIX_RE = re.compile(r"^phase-\d+-\d+-")


def slugify(text, maxlen=60):
    s = unicodedata.normalize("NFKD", text)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:maxlen].rstrip("-") or "item"


def slug_to_display(slug):
    """Readable label for a wikilinked node slug."""
    s = PHASE_PREFIX_RE.sub("", slug.strip())
    s = re.sub(r"^(document|tradition|music|alphabet)-", "", s)
    words = s.replace("_", "-").split("-")
    return " ".join(w[:1].upper() + w[1:] if w else w for w in words)


def strip_wikilinks(text, collect=None):
    """Replace [[slug]] / [[slug|disp]] with readable text; collect slugs."""
    def repl(m):
        slug = m.group(1).strip()
        if "/" in slug:                       # folder-qualified ref
            slug = slug.rsplit("/", 1)[-1]
        if collect is not None and slug not in collect:
            collect.append(slug)
        return m.group(2).strip() if m.group(2) else slug_to_display(slug)
    return WIKILINK_RE.sub(repl, text)


TIER_RE = re.compile(r"\s*[\[\(]T[1-4][\]\)]")

# Jargon scrubbing comes in two strengths.
# EVERYWHERE: phrases that are unambiguously internal jargon in any context.
# Verb-anchored "vault" phrases are safe; bare "the vault" is NOT rewritten in
# bodies because sacred-architecture entries use it literally ("the vault's
# load", "near the vault", "the vault of heaven").
JARGON_ALWAYS = [
    (re.compile(r"MASSIVE[\s-]WINS?", re.IGNORECASE), "key finding"),
    (re.compile(r"\b(the|this|our) vault (otherwise )?"
                r"(tracks|traces|treats|handles|documents|carries|maintains|"
                r"now documents|has been treating|has documented|should look)\b",
                re.IGNORECASE), r"\1 investigation \2\3"),
    (re.compile(r"\bvault (documents?|nodes?|narratives?|entries|entry)\b",
                re.IGNORECASE), r"investigation \1"),
    (re.compile(r"\bacross the vault\b", re.IGNORECASE), "across the investigation"),
    (re.compile(r"\bcase in the vault\b", re.IGNORECASE), "case in this investigation"),
    (re.compile(r"\bthe vault's (sharpest|strongest|best|most|full|standard|"
                r"current|acoustic|investigative|own)\b", re.IGNORECASE),
     r"the investigation's \1"),
    # sourcing-tier grades → plain language
    (re.compile(r"\bT2/T3\b"), "mainstream-to-contested"),
    (re.compile(r",\s*T[1-4]\)"), ")"),
    (re.compile(r"\ball T[1-4]\b"), "all first-rate"),
    (re.compile(r"\bTier-?\s?1\b", re.IGNORECASE), "first-rate"),
    (re.compile(r"\bTier-?\s?2\b", re.IGNORECASE), "mainstream"),
    (re.compile(r"\bTier-?\s?3\b", re.IGNORECASE), "contested"),
    (re.compile(r"\bTier-?\s?4\b", re.IGNORECASE), "speculative"),
    (re.compile(r"\bT1[-\s](sourced|cited|documented)\b"), r"fully \1"),
    (re.compile(r"\bT1\b"), "first-rate"),
    (re.compile(r"\bT2\b"), "mainstream"),
    (re.compile(r"\bT3\b"), "contested"),
    (re.compile(r"\bT4\b"), "speculative"),
    # internal batch numbering ("the Phase-17 essay series" → "the essay series")
    (re.compile(r"\b[Pp]hase-\d+\s+(essay series|essays?|series|batch(?:es)?)\b"),
     r"\1"),
]
# SURFACE ONLY (titles + summaries — every occurrence verified corpus-meaning):
JARGON_SURFACE = [
    (re.compile(r"\b(the|this|our) vault's\b", re.IGNORECASE), r"\1 investigation's"),
    (re.compile(r"\b(the|this|our) vault\b(?!\s+of\b)(?!')", re.IGNORECASE),
     r"\1 investigation"),
]


def consumerize(text, surface=False):
    """Scrub internal jargon from consumer-visible text."""
    if not text:
        return text
    t = TIER_RE.sub("", text)
    for rx, sub in JARGON_ALWAYS:
        t = rx.sub(sub, t)
    if surface:
        for rx, sub in JARGON_SURFACE:
            t = rx.sub(sub, t)
    t = t.replace("key findings entries", "findings")
    t = re.sub(r"[ \t]+", " ", t)
    return t.strip()


def md_to_plain(text):
    """Markdown → plain text for summaries."""
    t = strip_wikilinks(text)
    t = re.sub(r"\*\*([^*]+)\*\*", r"\1", t)
    t = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"\1", t)
    t = re.sub(r"`([^`]+)`", r"\1", t)
    t = re.sub(r"^\s*[-•+]\s+", "", t, flags=re.M)
    t = re.sub(r"^\s*#+\s*", "", t, flags=re.M)
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def clip_sentences(text, limit=300):
    """Clip plain text at a sentence boundary near `limit` chars."""
    t = text.strip()
    if len(t) <= limit:
        return t
    cut = t[:limit]
    # prefer the last sentence end inside the window
    best = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "), cut.rfind(".» "))
    if best > limit * 0.45:
        return cut[:best + 1].strip()
    sp = cut.rfind(" ")
    return (cut[:sp] if sp > 0 else cut).rstrip(",;:—- ") + "…"


def first_block(md_text):
    """First substantive paragraph/bullet of a markdown blob (raw)."""
    for block in re.split(r"\n\s*\n", md_text):
        b = block.strip()
        if not b or b.startswith(("---", "|", ">", "#")):
            continue
        return b
    return md_text.strip()


def summarize(md_text, limit=300):
    return clip_sentences(consumerize(md_to_plain(first_block(md_text)), surface=True), limit)


def clean_body(md_text, cap=6000):
    """Body kept as light markdown (bold/italic/bullets/tables survive)."""
    extra = []
    t = strip_wikilinks(md_text, collect=extra)
    t = consumerize(t)
    t = re.sub(r"\n{3,}", "\n\n", t).strip()
    if len(t) > cap:
        t = t[:cap].rsplit("\n", 1)[0].rstrip() + "\n…"
    return t, extra


# ───────────────────────────────────────────────────────────────────────────
# Frontmatter (id / title / name / type only — no YAML dependency).
# ───────────────────────────────────────────────────────────────────────────
FM_LINE_RE = re.compile(r"^(id|title|name|type)\s*:\s*(.+?)\s*$")


def read_frontmatter(text):
    fm = {}
    if not text.startswith("---"):
        return fm, text
    end = text.find("\n---", 3)
    if end < 0:
        return fm, text
    head = text[3:end]
    for line in head.splitlines():
        m = FM_LINE_RE.match(line.strip())
        if not m:
            continue
        key, raw = m.group(1), m.group(2)
        if raw[:1] in "\"'":
            q = raw[0]
            close = raw.find(q, 1)
            val = raw[1:close] if close > 0 else raw.strip("\"'")
        else:
            val = raw.split("  #", 1)[0].split("\t#", 1)[0].strip()
        fm[key] = val
    return fm, text[end + 4:]


# ───────────────────────────────────────────────────────────────────────────
# Findings assembly
# ───────────────────────────────────────────────────────────────────────────
FINDINGS = []
SEEN_TITLES = {}
SEEN_IDS = set()
DUP_DROPPED = 0


def add_finding(fid, title, summary, category, origin, sources=None,
                body=None, tags=None, ref=None):
    global DUP_DROPPED
    title = consumerize(title, surface=True).strip().strip("*").strip()
    summary = consumerize(summary or "", surface=True).strip()
    if category not in CAT_RANK:
        category = "Cross-tradition parallel"
    norm = re.sub(r"[^a-z0-9]+", " ", title.lower()).strip()
    if norm in SEEN_TITLES:
        DUP_DROPPED += 1
        return
    base = fid
    k = 2
    while fid in SEEN_IDS:
        fid = "%s-%d" % (base, k)
        k += 1
    SEEN_IDS.add(fid)
    SEEN_TITLES[norm] = fid
    entry = {
        "id": fid,
        "title": title,
        "summary": summary,
        "category": category,
        "origin": origin,
        "sources": list(dict.fromkeys([s for s in (sources or []) if s]))[:12],
        "tags": list(dict.fromkeys([t for t in (tags or []) if t]))[:8],
    }
    if body:
        entry["body"] = body
    if ref:
        entry["ref"] = ref
    FINDINGS.append(entry)


# ── 1. observations.js ─────────────────────────────────────────────────────
OBS_CAT = {"CONCLUSION": "Conclusion", "HYPOTHESIS": "Hypothesis",
           "ANOMALY": "Anomaly", "META": "Method"}


def harvest_observations():
    data = parse_js_global(os.path.join(ROOT, "src", "data", "observations.js"),
                           "OBSERVATIONS_DATA")
    n = 0
    for o in data:
        body, _ = clean_body(o.get("body") or "")
        add_finding(
            fid="obs--" + (o.get("id") or slugify(o.get("title", ""))),
            title=o.get("title", ""),
            summary=clip_sentences(consumerize(o.get("summary", ""), surface=True), 360),
            category=OBS_CAT.get(o.get("category"), "Hypothesis"),
            origin="observations",
            sources=o.get("evidence") or o.get("nodes") or [],
            body=body or None,
            tags=[(o.get("category") or "").lower()],
            ref="src/data/observations.js",
        )
        n += 1
    return n


# ── 2. patterns.js ──────────────────────────────────────────────────────────
def pattern_category(raw):
    raw = (raw or "").upper()
    if "INVERSION" in raw:
        return "Inversion"
    if "TRANSMISSION" in raw and "CONVERGENCE" not in raw:
        return "Transmission"
    return "Convergence"


def harvest_patterns():
    data = parse_js_global(os.path.join(ROOT, "src", "data", "patterns.js"),
                           "PATTERNS_DATA")
    n = 0
    for p in data:
        raw = p.get("category") or ""
        tags = [raw.lower().replace("+", " ")]
        if p.get("section"):
            tags.append(slugify(p["section"], 40))
        if raw.upper() == "SCIENCE":
            tags.append("science")
        add_finding(
            fid="pat--" + (p.get("id") or slugify(p.get("title", ""))),
            title=p.get("title", ""),
            summary=clip_sentences(consumerize(p.get("summary", ""), surface=True), 360),
            category=pattern_category(raw),
            origin="patterns",
            sources=p.get("sources") or [],
            tags=tags,
            ref="src/data/patterns.js",
        )
        n += 1
    return n


# ── 3. chains.js ────────────────────────────────────────────────────────────
def harvest_chains():
    data = parse_js_global(os.path.join(ROOT, "src", "data", "chains.js"),
                           "CHAINS_DATA")
    n = 0
    for c in data:
        cat = "Convergence" if (c.get("category") == "CONVERGENCE") else "Transmission"
        lines = []
        if c.get("span"):
            lines.append("Span: %s" % c["span"])
            lines.append("")
        srcs = []
        for lk in c.get("links") or []:
            if lk.get("node"):
                srcs.append(lk["node"])
            lines.append("**%s — %s.** %s" % (lk.get("date", "?"),
                                              lk.get("label", ""),
                                              lk.get("note", "")))
        body, _ = clean_body("\n\n".join(lines))
        add_finding(
            fid="chain--" + (c.get("id") or slugify(c.get("title", ""))),
            title=c.get("title", ""),
            summary=clip_sentences(consumerize(c.get("summary", ""), surface=True), 360),
            category=cat,
            origin="chains",
            sources=srcs,
            body=body or None,
            tags=["lineage", (c.get("category") or "").lower()],
            ref="src/data/chains.js",
        )
        n += 1
    return n


# ── 4+5. MASSIVE-WINS-INDEX.md + MASSIVE-WINS.md ────────────────────────────
def section_category_mwi(heading):
    h = heading.upper()
    if "PRIORITY" in h or "HOW TO USE" in h:
        return None
    if "INVERSION" in h or "SUBVERSION" in h:
        return "Inversion", []
    if "REVERSAL" in h:
        return "Transmission", ["modern-reversal"]
    if "TRANSMISSION" in h:
        return "Transmission", []
    if "PARALLEL" in h or "CONVERGENCE" in h:
        return "Convergence", []
    if "TIME INVERSIONS" in h:
        return "Anomaly", ["time-inversion"]
    if "IRONIES" in h:
        return "Anomaly", ["structural-irony"]
    if "NAMED PATTERNS" in h:
        return "Method", ["named-pattern"]
    return None


NODES_LINE_RE = re.compile(r"^\*{0,2}Nodes?:?\*{0,2}\s*:?\s*(.+)$", re.IGNORECASE)
ENTRY_HEAD_RE = re.compile(r"^###\s+(\d+)\.\s+(.+?)\s*$")


def harvest_master_file(relpath, id_prefix):
    path = os.path.join(ROOT, "00_meta", relpath)
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    lines = text.splitlines()
    current = None      # (category, tags) or None=skip
    entries = []        # (num, title, body_lines, category, tags)
    cur_entry = None
    for line in lines:
        if line.startswith("## ") and not line.startswith("###"):
            current = section_category_mwi(line[3:])
            cur_entry = None
            continue
        m = ENTRY_HEAD_RE.match(line)
        if m:
            if current is None:
                cur_entry = None
                continue
            cur_entry = (m.group(1), m.group(2), [], current[0], list(current[1]))
            entries.append(cur_entry)
            continue
        if cur_entry is not None:
            cur_entry[2].append(line)
    n = 0
    for num, title, body_lines, category, tags in entries:
        raw = "\n".join(body_lines).strip().strip("-").strip()
        srcs = []
        kept = []
        for ln in raw.splitlines():
            nm = NODES_LINE_RE.match(ln.strip())
            if nm:
                strip_wikilinks(nm.group(1), collect=srcs)
                continue
            kept.append(ln)
        body_md = "\n".join(kept).strip()
        # summary: the bold lead line if present, else first paragraph
        lead = None
        for ln in body_md.splitlines():
            t = ln.strip()
            if t.startswith("**") and t.endswith("**") and len(t) > 8:
                lead = t.strip("*").strip()
                break
            if t and not t.startswith(("|", ">", "#")):
                break
        summary = summarize(lead or body_md, 320)
        body, extra = clean_body(body_md)
        for s in extra:
            if s not in srcs:
                srcs.append(s)
        add_finding(
            fid="%s--%s-%s" % (id_prefix, num, slugify(title, 48)),
            title=re.sub(r"^\d+\.\s*", "", title),
            summary=summary,
            category=category,
            origin="massive-wins-index",
            sources=srcs,
            body=body or None,
            tags=tags,
            ref="00_meta/%s §%s" % (relpath, num),
        )
        n += 1
    return n


# ── 6. INVESTIGATION-LEADS.md ───────────────────────────────────────────────
def leads_section_category(heading):
    h = heading.upper()
    if "UNSOLVED" in h:
        return "Open question", ["unsolved-parallel"]
    if "TRANSMISSION" in h:
        return "Transmission", ["unexpected-transmission"]
    if "TEXTUAL" in h:
        return "Discovery", ["textual"]
    if "STRUCTURAL FINDINGS" in h:
        return "Conclusion", ["structural"]
    return None  # "LEADS WORTH PURSUING", "Appended …", anything else


LEAD_HEAD_RE = re.compile(r"^\*\*(\d+)\.\s+(.+?)\*\*\s*$")
LEAD_SRC_RE = re.compile(r"^→\s*Source documents?:\s*(.+)$", re.IGNORECASE)


def harvest_leads():
    path = os.path.join(ROOT, "00_meta", "INVESTIGATION-LEADS.md")
    with open(path, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()
    current = None
    cur = None
    entries = []
    for line in lines:
        if line.startswith("#"):
            heading = line.lstrip("#").strip()
            cat = leads_section_category(heading)
            if cat is not None or line.startswith(("## ", "### ")):
                current = cat
            cur = None
            continue
        m = LEAD_HEAD_RE.match(line.strip())
        if m:
            if current is None:
                cur = None
                continue
            cur = (m.group(1), m.group(2), [], current[0], list(current[1]))
            entries.append(cur)
            continue
        if cur is not None:
            cur[2].append(line)
    n = 0
    for num, title, body_lines, category, tags in entries:
        srcs = []
        kept = []
        for ln in body_lines:
            sm = LEAD_SRC_RE.match(ln.strip())
            if sm:
                for ref in re.findall(r"`([^`]+)`", sm.group(1)):
                    slug = ref.rsplit("/", 1)[-1].strip()
                    if slug and slug not in srcs:
                        srcs.append(slug)
                continue
            kept.append(ln)
        body_md = "\n".join(kept).strip()
        body, extra = clean_body(body_md)
        for s in extra:
            if s not in srcs:
                srcs.append(s)
        add_finding(
            fid="lead--%s-%s" % (num, slugify(title, 48)),
            title=md_to_plain(title),
            summary=summarize(body_md, 320),
            category=category,
            origin="leads",
            sources=srcs,
            body=body or None,
            tags=tags,
            ref="00_meta/INVESTIGATION-LEADS.md §%s" % num,
        )
        n += 1
    return n


# ── 7. MASSIVE-WIN-essays/*.md ──────────────────────────────────────────────
def harvest_essays():
    folder = os.path.join(ROOT, "00_meta", "MASSIVE-WIN-essays")
    n = 0
    for fname in sorted(os.listdir(folder)):
        if not fname.endswith(".md") or fname == "README.md":
            continue
        path = os.path.join(folder, fname)
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        fm, rest = read_frontmatter(text)
        h1 = re.search(r"^#\s+(.+)$", rest, re.M)
        title = fm.get("title") or (h1.group(1).strip() if h1 else fname[:-3])
        body_text = rest[h1.end():] if h1 else rest
        # first 2 substantive paragraphs as the body excerpt
        paras = [b.strip() for b in re.split(r"\n\s*\n", body_text)
                 if b.strip() and not b.strip().startswith(("---", ">", "#", "|"))]
        excerpt_md = "\n\n".join(paras[:2])
        srcs = []
        strip_wikilinks(text, collect=srcs)
        body, _ = clean_body(excerpt_md, cap=2400)
        body = (body + "\n\n(Excerpt — the full essay lives in the source file noted below.)").strip()
        add_finding(
            fid="essay--" + slugify(fm.get("id") or fname[:-3], 56),
            title=title,
            summary=summarize(excerpt_md, 360),
            category="Conclusion",
            origin="essay",
            sources=srcs[:12],
            body=body,
            tags=["essay", "synthesis"],
            ref="00_meta/MASSIVE-WIN-essays/" + fname,
        )
        n += 1
    return n


# ── 8. Node-level `## MASSIVE WIN*` sections across content folders ─────────
CONTENT_DIR_RE = re.compile(r"^(0[1-9]|[12]\d|3[01])_")
WIN_HEAD_RE = re.compile(r"^(#{2,3})\s*MASSIVE[\s-]?WINS?\b[\s:—–\-]*(.*)$")
GENERIC_REMAINDERS = {
    "", "cross-tradition edges", "cross-tradition edge",
    "cross-tradition parallels", "cross-tradition parallel",
    "cross-tradition connections", "cross tradition edges",
    "summary", "edges",
}

TRANS_WORDS = ("transmission", "transmitted", "transmits", "borrowed",
               "borrowing", "absorbed", "inherited", "descends from",
               "descended from", "derived from", "adopted from", "loanword",
               "lineage", "carried into", "entered via", "imported")
CONV_WORDS = ("independent", "independently", "convergence", "converge",
              "no documented transmission", "no documented contact",
              "zero contact", "no contact", "without contact",
              "no transmission")
INV_WORDS = ("inversion", "inverted", "inverts", "demonized", "demonization",
             "reversal", "reversed", "flipped", "subverted")


def score(text, words):
    return sum(text.count(w) for w in words)


def classify_node_section(heading_rest, body_text):
    t = (heading_rest + " " + body_text).lower()
    if "transmission" in heading_rest.lower():
        return "Transmission"
    inv, tr, cv = score(t, INV_WORDS), score(t, TRANS_WORDS), score(t, CONV_WORDS)
    if inv >= 2 and inv >= tr and inv >= cv:
        return "Inversion"
    if tr >= 3 and tr > cv:
        return "Transmission"
    if cv >= 2 and cv > tr:
        return "Convergence"
    return "Cross-tradition parallel"


def harvest_nodes():
    n = 0
    files = 0
    for entry in sorted(os.listdir(ROOT)):
        if not CONTENT_DIR_RE.match(entry):
            continue
        folder = os.path.join(ROOT, entry)
        if not os.path.isdir(folder):
            continue
        for dirpath, dirnames, filenames in os.walk(folder):
            dirnames[:] = [d for d in dirnames if not d.startswith(".")]
            for fname in sorted(filenames):
                if not fname.endswith(".md"):
                    continue
                path = os.path.join(dirpath, fname)
                with open(path, "r", encoding="utf-8") as f:
                    text = f.read()
                if "MASSIVE WIN" not in text and "MASSIVE-WIN" not in text:
                    continue
                fm, _rest = read_frontmatter(text)
                node_id = fm.get("id") or fname[:-3]
                node_title = fm.get("title") or fm.get("name") or slug_to_display(node_id)
                node_type = fm.get("type") or entry.split("_", 1)[-1]
                lines = text.splitlines()
                sections = []
                i = 0
                while i < len(lines):
                    m = WIN_HEAD_RE.match(lines[i])
                    if not m:
                        i += 1
                        continue
                    level = len(m.group(1))
                    rest = m.group(2).strip()
                    j = i + 1
                    while j < len(lines):
                        hm = re.match(r"^(#{1,6})\s", lines[j])
                        if hm and len(hm.group(1)) <= level:
                            break
                        j += 1
                    sec = "\n".join(lines[i + 1:j]).strip()
                    sec = re.sub(r"\n-{3,}\s*$", "", sec).strip()
                    if sec:
                        sections.append((rest, sec))
                    i = j
                if not sections:
                    continue
                files += 1
                for idx, (rest, sec) in enumerate(sections):
                    rest_clean = re.sub(r"^[\s:—–\-]+", "", rest).strip()
                    generic = rest_clean.lower().rstrip(".") in GENERIC_REMAINDERS
                    if generic:
                        title = "%s — cross-tradition connections" % node_title
                    elif rest_clean.lower() in ("transmission edges", "transmission edge"):
                        title = "%s — transmission connections" % node_title
                    else:
                        t = rest_clean[:1].upper() + rest_clean[1:]
                        title = "%s: %s" % (node_title, md_to_plain(t))
                    srcs = [node_id]
                    body, extra = clean_body(sec)
                    for s in extra:
                        if s not in srcs:
                            srcs.append(s)
                    fid = "node--" + node_id + ("" if idx == 0 else "-%d" % (idx + 1))
                    add_finding(
                        fid=fid,
                        title=title,
                        summary=summarize(sec, 300),
                        category=classify_node_section(rest_clean, sec),
                        origin="node",
                        sources=srcs,
                        body=body or None,
                        tags=[node_type],
                        ref="%s/%s" % (entry, fname),
                    )
                    n += 1
    return n, files


# ───────────────────────────────────────────────────────────────────────────
def main():
    counts = {}
    counts["observations"] = harvest_observations()
    counts["patterns"] = harvest_patterns()
    counts["chains"] = harvest_chains()
    counts["massive-wins-index"] = harvest_master_file("MASSIVE-WINS-INDEX.md", "mwi")
    counts["massive-wins-index"] += harvest_master_file("MASSIVE-WINS.md", "mw")
    counts["leads"] = harvest_leads()
    counts["essay"] = harvest_essays()
    node_count, node_files = harvest_nodes()
    counts["node"] = node_count

    FINDINGS.sort(key=lambda f: (CAT_RANK.get(f["category"], 99), f["title"].lower()))

    by_cat = {}
    for f in FINDINGS:
        by_cat[f["category"]] = by_cat.get(f["category"], 0) + 1
    by_origin = {}
    for f in FINDINGS:
        by_origin[f["origin"]] = by_origin.get(f["origin"], 0) + 1

    # consumer-surface guard: the internal phrase must not survive
    for f in FINDINGS:
        for field in ("title", "summary", "body"):
            v = f.get(field) or ""
            assert "MASSIVE WIN" not in v.upper().replace("-", " "), \
                "jargon leak in %s of %s" % (field, f["id"])

    out = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "version": 1,
        "categories": CATEGORIES,
        "counts": {
            "total": len(FINDINGS),
            "byOrigin": by_origin,
            "byCategory": by_cat,
            "harvested": counts,
            "duplicatesDropped": DUP_DROPPED,
            "nodeFilesWithSections": node_files,
        },
        "findings": FINDINGS,
    }
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    size_kb = os.path.getsize(OUT_PATH) / 1024.0
    print("investigation-index.json written: %d findings (%.0f KB)" %
          (len(FINDINGS), size_kb))
    print("  harvested:", json.dumps(counts))
    print("  by category:", json.dumps(by_cat))
    print("  duplicates dropped:", DUP_DROPPED)


if __name__ == "__main__":
    sys.exit(main())
