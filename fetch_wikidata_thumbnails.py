#!/usr/bin/env python3
"""
fetch_wikidata_thumbnails.py — Secondary image system for Codex Atlas.

Queries Wikidata P18 (canonical entity image) for suspect nodes where
Wikipedia returned a low-similarity article match. Updates thumbs_cache.json.

Usage:
  python3 fetch_wikidata_thumbnails.py              # dry run, writes WIKIDATA-REVIEW.md
  python3 fetch_wikidata_thumbnails.py --update     # apply changes to cache
  python3 fetch_wikidata_thumbnails.py --threshold 0.4  # widen net (default 0.35)
  python3 fetch_wikidata_thumbnails.py --limit 20   # test on first 20 nodes
  python3 fetch_wikidata_thumbnails.py --start-from al-ghazali  # resume from node ID
"""

import argparse
import difflib
import glob
import hashlib
import json
import os
import re
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

import yaml

# ── paths ──────────────────────────────────────────────────────────────────────
REPO        = os.path.dirname(os.path.abspath(__file__))
CACHE_PATH  = os.path.join(REPO, "_assets", "thumbs_cache.json")
REPORT_PATH = os.path.join(REPO, "00_meta", "WIKIDATA-REVIEW.md")

NODE_DIRS = [
    ("01_traditions", "tradition"),
    ("02_scriptures", "scripture"),
    ("03_deities",    "deity"),
    ("04_persons",    "person"),
    ("05_events",     "event"),
    ("06_themes",     "theme"),
]

UA = "CodexAtlas/4.0 (educational research vault; contact: research)"

# ── disambiguation word-lists ──────────────────────────────────────────────────
# Entity descriptions containing these words are almost certainly wrong matches
DISQUALIFIERS = {
    "municipality", "commune", "village", "city", "town", "borough",
    "district", "county", "province", "prefecture", "state",
    "river", "mountain", "lake", "island", "bay", "valley", "peninsula",
    "genus", "species", "family", "order", "insect", "plant", "fungus",
    "mineral", "chemical compound", "asteroid", "star system",
    "album", "film", "television", "song", "video game", "comic book",
    "brand", "company", "organization",  # orgs that share names with people
}

# Presence of these words in description boosts confidence (for persons/deities)
PERSON_QUALIFIERS = {
    "philosopher", "theologian", "theologican",
    "religious", "mystic", "ascetic", "monk", "nun", "priest", "priestess",
    "prophet", "saint", "rabbi", "imam", "bishop", "pope", "patriarch",
    "teacher", "guru", "master", "sage", "shaman",
    "scholar", "historian", "author", "writer", "poet", "translator",
    "alchemist", "astrologer", "occultist", "hermeticist", "gnostic",
    "kabbalist", "sufi", "dervish", "yogi", "swami",
    "heretic", "reformer", "founder", "leader", "activist",
    "figure", "person", "individual",
    "medieval", "ancient", "byzantine", "roman", "greek",
    "christian", "jewish", "islamic", "muslim", "buddhist", "hindu",
    "taoist", "zoroastrian", "pagan", "druid",
    "political", "military",  # broad catch
}

DEITY_QUALIFIERS = {
    "deity", "god", "goddess", "divine being", "spirit", "demon",
    "archangel", "angel", "jinn", "daemon", "daimon",
    "mythological", "mythological figure", "mythology",
    "concept in", "theological concept", "religious concept",
    "archetype",
}


# ── helpers ────────────────────────────────────────────────────────────────────
def sim(a, b):
    return difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _get(url, timeout=10):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 2:
                time.sleep(8)   # flat 8s wait, max 2 retries
                continue
            raise
    raise RuntimeError("Max retries exceeded")


def wikidata_search(query, limit=5):
    params = urllib.parse.urlencode({
        "action": "wbsearchentities",
        "search": query,
        "language": "en",
        "type": "item",
        "limit": limit,
        "format": "json",
    })
    return _get(f"https://www.wikidata.org/w/api.php?{params}")


def strip_diacritics(s):
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn")


def wikidata_entity(qid):
    params = urllib.parse.urlencode({
        "action": "wbgetentities",
        "ids": qid,
        "props": "claims|descriptions",
        "languages": "en",
        "format": "json",
    })
    return _get(f"https://www.wikidata.org/w/api.php?{params}")


def get_p18(qid):
    """Return P18 (image) filename string for QID, or None."""
    data = wikidata_entity(qid)
    entity = data["entities"].get(qid, {})
    p18_list = entity.get("claims", {}).get("P18", [])
    if p18_list:
        return p18_list[0]["mainsnak"]["datavalue"]["value"]
    return None


def commons_thumb_md5(filename, width=330):
    safe = filename.replace(" ", "_")
    md5 = hashlib.md5(safe.encode("utf-8")).hexdigest()
    ext = safe.rsplit(".", 1)[-1].lower() if "." in safe else ""
    thumb_file = (safe + ".png") if ext == "svg" else safe
    return (
        f"https://upload.wikimedia.org/wikipedia/commons/thumb"
        f"/{md5[0]}/{md5[:2]}/{urllib.parse.quote(safe, safe='()')}/"
        f"{width}px-{urllib.parse.quote(thumb_file, safe='()')}"
    )


def commons_imageinfo_url(filename, width=330):
    """Fall back to Commons imageinfo API when MD5 URL fails."""
    safe = filename.replace(" ", "_")
    params = urllib.parse.urlencode({
        "action": "query",
        "titles": f"File:{safe}",
        "prop": "imageinfo",
        "iiprop": "url|thumburl",
        "iiurlwidth": width,
        "format": "json",
    })
    try:
        data = _get(f"https://commons.wikimedia.org/w/api.php?{params}")
        for page in data["query"]["pages"].values():
            info = page.get("imageinfo", [])
            if info:
                return info[0].get("thumburl") or info[0].get("url")
    except Exception:
        pass
    return None


def url_ok(url):
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.status == 200
    except Exception:
        return False


def entity_confidence(description, node_type, node_tradition):
    """
    Return 0.0–1.0 confidence that this Wikidata entity is the right match.
    0.0 = definitely wrong (disqualified). ≥ 0.5 = accept.
    """
    desc_low = description.lower()

    # Hard disqualification
    if any(w in desc_low for w in DISQUALIFIERS):
        return 0.0

    score = 0.3  # base: survived disqualification

    qualifiers = PERSON_QUALIFIERS if node_type in ("person", "deity") else set()
    if node_type == "deity":
        qualifiers = qualifiers | DEITY_QUALIFIERS

    if any(w in desc_low for w in qualifiers):
        score += 0.4

    # Tradition name overlap
    trad = node_tradition.lower() if node_tradition else ""
    for word in re.findall(r"\w{4,}", trad):
        if word in desc_low:
            score += 0.2
            break

    return min(score, 1.0)


# ── node loader ────────────────────────────────────────────────────────────────
def load_suspects(threshold):
    with open(CACHE_PATH) as f:
        cache = json.load(f)

    suspects = []
    for dir_name, ntype in NODE_DIRS:
        full_dir = os.path.join(REPO, dir_name)
        if not os.path.isdir(full_dir):
            continue
        for md_path in sorted(glob.glob(os.path.join(full_dir, "*.md"))):
            try:
                with open(md_path) as f:
                    content = f.read()
                m = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
                if not m:
                    continue
                fm = yaml.safe_load(m.group(1))
                nid    = fm.get("id", "")
                name   = fm.get("name", "")
                trad   = str(fm.get("tradition", "") or "")
                if not nid or not name:
                    continue

                # Skip nodes that already have a hand-curated depictions[] block
                if fm.get("depictions"):
                    continue

                cached = cache.get(nid)
                if not cached or not cached.get("src"):
                    continue

                # Skip entries already resolved via Wikidata
                if cached.get("_wikidata"):
                    continue

                mq = cached.get("matched_query", "")
                s  = sim(name, mq)
                if s < threshold:
                    suspects.append({
                        "id":            nid,
                        "name":          name,
                        "type":          ntype,
                        "tradition":     trad,
                        "sim":           s,
                        "matched_query": mq,
                        "current_src":   cached.get("src", ""),
                    })
            except Exception:
                pass

    suspects.sort(key=lambda x: x["sim"])
    return cache, suspects


# ── Wikidata lookup ────────────────────────────────────────────────────────────
def find_wikidata_image(node):
    """
    Try to find a validated Wikidata P18 image URL for a node.
    Returns (qid, description, filename, url) or None.
    """
    name      = node["name"]
    node_id   = node["id"]
    ntype     = node["type"]
    tradition = node["tradition"]

    # Build search query list (most-specific first)
    # 1. Clean name (strip trailing parentheticals)
    clean = re.sub(r"\s*\([^)]+\)\s*$", "", name).strip()
    # 2. Text inside parentheses (for "Heȟáka Sápa (Black Elk)" → "Black Elk")
    paren_match = re.search(r"\(([^)]+)\)", name)
    paren_inner = paren_match.group(1).strip() if paren_match else None
    # 3. Diacritic-stripped version
    ascii_clean = strip_diacritics(clean)
    # 4. Node-ID as words (eshu → "Eshu", al-ghazali → "Al Ghazali")
    id_as_words = node_id.replace("-", " ").title()

    # Two queries max: canonical name, then node-ID-as-words (catches
    # non-ASCII names like "Èṣù" where ASCII "Eshu" is more findable)
    queries = []
    for q in [clean, id_as_words, ascii_clean, paren_inner]:
        if q and q not in queries:
            queries.append(q)
    queries = queries[:2]  # limit to 2 queries per node for speed

    for query in queries:
        try:
            time.sleep(0.6)
            result = wikidata_search(query, limit=3)
            for candidate in result.get("search", []):
                qid         = candidate.get("id", "")
                label       = candidate.get("label", "")
                description = candidate.get("description", "") or ""
                match_info  = candidate.get("match", {})
                alias_match = match_info.get("type") == "alias"

                # If the search matched via alias (e.g., "Ibn Rushd" → Averroes),
                # trust it without requiring label similarity
                if not alias_match:
                    name_sim = max(
                        sim(query, label),
                        sim(clean, label),
                        sim(ascii_clean, label),
                    )
                    if name_sim < 0.38:
                        continue

                conf = entity_confidence(description, ntype, tradition)
                if conf < 0.45:
                    continue

                # Look for P18 image
                time.sleep(0.6)
                filename = get_p18(qid)
                if not filename:
                    continue

                # Try MD5-based URL first; skip imageinfo fallback for speed
                url = commons_thumb_md5(filename)
                time.sleep(0.4)
                if url_ok(url):
                    return qid, description, filename, url

        except Exception:
            pass

    return None


# ── main ───────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--update",     action="store_true",
                    help="Write found images to cache (default: dry run)")
    ap.add_argument("--threshold",  type=float, default=0.35,
                    help="Similarity threshold for suspects (default 0.35)")
    ap.add_argument("--limit",      type=int,   default=None,
                    help="Max nodes to process (testing)")
    ap.add_argument("--start-from", type=str,   default=None,
                    help="Resume from this node ID")
    args = ap.parse_args()

    print(f"Loading suspects (sim < {args.threshold})…")
    cache, suspects = load_suspects(args.threshold)
    print(f"  {len(suspects)} suspects total")

    # Resume support
    if args.start_from:
        idx = next(
            (i for i, s in enumerate(suspects) if s["id"] == args.start_from), 0
        )
        suspects = suspects[idx:]
        print(f"  Resuming from '{args.start_from}' → {len(suspects)} remaining")

    if args.limit:
        suspects = suspects[: args.limit]
        print(f"  Limited to first {args.limit}")

    found     = []
    not_found = []
    errors    = []

    for i, node in enumerate(suspects):
        tag = f"[{i+1}/{len(suspects)}] {node['id']} (sim={node['sim']:.2f})"
        print(f"{tag} — {node['name']!r}", end=" … ", flush=True)
        try:
            result = find_wikidata_image(node)
            if result:
                qid, desc, filename, url = result
                print(f"✓  {qid} — {desc[:55]}")
                found.append({**node,
                               "wikidata_qid":  qid,
                               "wikidata_desc": desc,
                               "wikidata_file": filename,
                               "wikidata_url":  url})
            else:
                print("—")
                not_found.append(node)
        except Exception as e:
            print(f"ERROR: {e}")
            errors.append({**node, "error": str(e)})

    # ── report ──
    with open(REPORT_PATH, "w") as f:
        f.write("# WIKIDATA SECONDARY IMAGE REVIEW\n\n")
        f.write("> Auto-generated by `fetch_wikidata_thumbnails.py` — do not edit directly.\n\n")
        f.write(f"**Threshold:** {args.threshold}  "
                f"**Processed:** {len(suspects)}  "
                f"**Found:** {len(found)}  "
                f"**Not found:** {len(not_found)}  "
                f"**Errors:** {len(errors)}\n\n")
        f.write("---\n\n")

        if found:
            f.write(f"## Found ({len(found)} upgrades available)\n\n")
            f.write("| Node | Name | Current Wikipedia match | Wikidata entity | Wikidata description | Image |\n")
            f.write("|---|---|---|---|---|---|\n")
            for r in found:
                wd_link = f"[{r['wikidata_qid']}](https://www.wikidata.org/wiki/{r['wikidata_qid']})"
                f.write(
                    f"| `{r['id']}` "
                    f"| {r['name']} "
                    f"| {r['matched_query']} ({r['sim']:.2f}) "
                    f"| {wd_link} "
                    f"| {r['wikidata_desc'][:80]} "
                    f"| [view]({r['wikidata_url']}) |\n"
                )

        if not_found:
            f.write(f"\n## Not found ({len(not_found)} nodes)\n\n")
            f.write("| Node | Name | Current match | Sim |\n")
            f.write("|---|---|---|---|\n")
            for r in not_found:
                f.write(f"| `{r['id']}` | {r['name']} | {r['matched_query']} | {r['sim']:.2f} |\n")

        if errors:
            f.write(f"\n## Errors ({len(errors)})\n\n")
            for r in errors:
                f.write(f"- `{r['id']}` {r['name']}: {r.get('error', '')}\n")

    print(f"\nReport → {REPORT_PATH}")
    print(f"Found: {len(found)}  Not found: {len(not_found)}  Errors: {len(errors)}")

    if args.update and found:
        print(f"\nApplying {len(found)} Wikidata images to cache…")
        for r in found:
            entry = cache.setdefault(r["id"], {})
            entry["src"]           = r["wikidata_url"]
            entry["title"]         = r["name"]
            entry["matched_query"] = r["name"]   # now matches exactly
            entry["_wikidata"]     = r["wikidata_qid"]
        with open(CACHE_PATH, "w") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
        print("Cache updated.")
        print("Next: python3 review_thumbnails.py && python3 build_data.py")
    elif found and not args.update:
        print(f"\nDry run — use --update to apply {len(found)} changes.")


if __name__ == "__main__":
    main()
