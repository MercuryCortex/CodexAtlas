#!/usr/bin/env python3
"""
fetch_thumbnails.py — populates _assets/thumbs_cache.json with a Wikipedia
thumbnail per node title. Run separately from build_data.py (slow, network).
Stdlib only.

Usage:
    python3 fetch_thumbnails.py              # incremental — only fetches missing
    python3 fetch_thumbnails.py --refetch    # re-tries previously failed lookups
    python3 fetch_thumbnails.py --force      # re-fetches everything

It reads node titles from the same folders build_data.py reads, queries the
Wikipedia REST summary API, and writes a JSON cache that build_data.py later
inlines into data.js.
"""

import argparse
import concurrent.futures as cf
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

VAULT = Path(__file__).parent
CACHE = VAULT / "_assets" / "thumbs_cache.json"

NODE_DIRS = ["02_documents", "03_deities", "04_persons", "05_events", "06_themes", "07_traditions", "09_symbols"]

USER_AGENT = "GnosticPathAtlas/0.2 (educational research vault; +https://obsidian.md)"
TIMEOUT = 6


def split_frontmatter(text):
    if not text.startswith("---"):
        return "", text
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.DOTALL)
    if not m:
        return "", text
    return m.group(1), m.group(2).strip()


def get_field_safe(fm_text, key):
    if not fm_text or not isinstance(fm_text, str):
        return None
    return get_field(fm_text, key)


def get_field(fm_text, key):
    m = re.search(rf"^{re.escape(key)}:\s*(.*)$", fm_text, re.MULTILINE)
    if not m:
        return None
    v = m.group(1).strip()
    if v in ('""', "''", "", "[]"):
        return None
    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
        v = v[1:-1]
    return v


def gather_nodes():
    nodes = []
    for d in NODE_DIRS:
        root = VAULT / d
        if not root.exists():
            continue
        for md in root.rglob("*.md"):
            if md.name.startswith("_"):
                continue
            text = md.read_text(encoding="utf-8")
            fm_text, _ = split_frontmatter(text)
            title = get_field(fm_text, "title") or get_field(fm_text, "name") or md.stem
            node_id = get_field(fm_text, "id") or md.stem
            tradition = get_field(fm_text, "tradition") or ""
            role = get_field(fm_text, "role") or ""
            ntype = d.split("_", 1)[1].rstrip("s").rstrip("e")  # rough type
            if "document" in d: ntype = "document"
            elif "deit" in d: ntype = "deity"
            elif "person" in d: ntype = "person"
            elif "event" in d: ntype = "event"
            elif "theme" in d: ntype = "theme"
            elif "tradition" in d: ntype = "tradition"
            elif "symbol" in d: ntype = "symbol"
            nodes.append({"id": node_id, "title": title, "type": ntype,
                          "tradition": tradition, "role": role})
    return nodes


# Manual overrides — for nodes whose Wikipedia page title differs from our title,
# or for hand-picked thumbnails that beat the auto-pick.
OVERRIDES = {
    "kesh-temple-hymn": "Kesh temple hymn",
    "phase-1-001-kesh-temple-hymn": "Kesh temple hymn",
    "phase-1-008-enuma-elish": "Enūma Eliš",
    "phase-1-004-gilgamesh-old-babylonian": "Epic of Gilgamesh",
    "phase-1-006-atrahasis": "Atra-Hasis",
    "phase-1-007-code-of-hammurabi": "Code of Hammurabi",
    "phase-1-002-pyramid-texts": "Pyramid Texts",
    "phase-1-009-coffin-texts": "Coffin Texts",
    "phase-1-010-book-of-the-dead": "Book of the Dead",
    "phase-1-011-great-hymn-to-aten": "Great Hymn to the Aten",
    "phase-1-012-amarna-letters": "Amarna letters",
    "phase-1-013-baal-cycle": "Baal Cycle",
    "phase-1-014-ugaritic-ritual-texts": "Ugaritic texts",
    "phase-1-003-enheduanna-hymns": "Enheduanna",
    "phase-1-005-instructions-of-shuruppak": "Instructions of Shuruppak",
    "an-sumerian": "Anu",
    "enki-ea": "Enki",
    "ninhursag-nintud": "Ninhursag",
    "el-canaanite": "El (deity)",
    "el-elohim-hebrew": "Elohim",
    "yahweh": "Yahweh",
    "phase-2-001-rig-veda-family-books": "Rigveda",
    "phase-2-002-gathas-of-zarathustra": "Gathas",
    "phase-2-008-homeric-epics": "Homer",
    "phase-2-009-hesiod-theogony-works-and-days": "Theogony",
    "phase-2-012-brihadaranyaka-upanishad": "Brihadaranyaka Upanishad",
    "phase-2-013-chandogya-upanishad": "Chandogya Upanishad",
    "phase-2-014-daodejing": "Tao Te Ching",
    "phase-2-015-analects-of-confucius": "Analects",
    "phase-2-016-early-buddhist-suttas": "Pāli Canon",
    "phase-3-002-plato-dialogues": "Plato",
    "phase-3-003-aristotle-metaphysics": "Metaphysics (Aristotle)",
    "phase-3-004-1-enoch": "Book of Enoch",
    "phase-3-006-septuagint": "Septuagint",
    "phase-3-008-book-of-daniel": "Book of Daniel",
    "phase-3-011-dead-sea-scrolls": "Dead Sea Scrolls",
    "phase-3-012-wisdom-of-solomon": "Wisdom of Solomon",
    "phase-3-013-philo-of-alexandria": "Philo",
    "phase-3-015-pauline-epistles": "Pauline epistles",
    "phase-3-016-gospel-of-mark": "Gospel of Mark",
    "phase-3-017-gospel-of-matthew": "Gospel of Matthew",
    "phase-3-018-luke-acts": "Luke–Acts",
    "phase-3-020-gospel-of-john": "Gospel of John",
    "phase-3-021-hermetic-corpus-earliest": "Hermetica",
    "phase-4-001-gospel-of-thomas": "Gospel of Thomas",
    "phase-4-002-apocryphon-of-john": "Apocryphon of John",
    "phase-4-003-gospel-of-truth": "Gospel of Truth",
    "phase-4-004-gospel-of-philip": "Gospel of Philip",
    "phase-4-005-gospel-of-mary": "Gospel of Mary",
    "phase-4-009-pistis-sophia": "Pistis Sophia",
    "phase-4-011-corpus-hermeticum-i": "Hermetica",
    "phase-4-014-cologne-mani-codex": "Cologne Mani-Codex",
    "phase-4-015-kephalaia-of-the-teacher": "Kephalaia",
    "phase-4-017-ginza-rba": "Ginza Rabba",
    "phase-4-019-plotinus-enneads": "Enneads",
    "phase-4-022-chaldean-oracles": "Chaldean Oracles",
    "phase-4-023-irenaeus-against-heresies": "On the Detection and Overthrow of the So-Called Gnosis",
    "phase-4-028-augustine-confessions": "Confessions (Augustine)",
    "phase-4-029-augustine-city-of-god": "The City of God",
    "phase-4-031-mishnah": "Mishnah",
    "phase-4-033-babylonian-talmud": "Talmud",
    "phase-4-034-quran": "Quran",

    # ---- 09_symbols/ overrides (opus-symbols-2, 2026-05-15) ----
    # Symbols often need explicit Wikipedia-article-title mapping because the slug
    # is descriptive ("eye", "bull", "lion") and bare-title search collides with
    # the literal animal/anatomy page rather than the iconographic-religious page.
    "ankh": "Ankh",
    "asclepian-rod": "Rod of Asclepius",
    "aum-om": "Om",
    "beauseant": "Beauséant",
    "bull": "Sacred bull",
    "caduceus": "Caduceus",
    "celtic-cross": "Celtic cross",
    "chi-rho-labarum": "Chi Rho",
    "coptic-cross": "Coptic cross",
    "crescent-moon-star": "Star and crescent",
    "cross-pattee-templar": "Cross pattée",
    "dharmachakra": "Dharmachakra",
    "eye": "Eye of Providence",
    "eye-of-horus-wedjat": "Eye of Horus",
    "faravahar": "Faravahar",
    "fish-ichthys": "Ichthys",
    "greek-cross": "Christian cross variants",
    "halo-nimbus": "Halo (religious iconography)",
    "haoma": "Haoma",
    "hexagram": "Star of David",
    "indus-valley-script": "Indus script",
    "latin-cross": "Christian cross",
    "lion": "Lion (heraldry)",
    "lotus": "Sacred lotus in religious art",
    "maltese-cross": "Maltese cross",
    "mandala-circle": "Mandala",
    "menorah": "Menorah (Temple)",
    "mithraic-cross": "Tauroctony",
    "monas-hieroglyphica": "Monas Hieroglyphica",
    "mount-ararat": "Mount Ararat",
    "noahs-ark": "Noah's Ark",
    "ouroboros": "Ouroboros",
    "pelican-in-piety": "Pelican",
    "pentagram": "Pentagram",
    "phoenix-bennu": "Phoenix (mythology)",
    "pomegranate": "Pomegranate",
    "rainbow-covenant": "Rainbow",
    "rose-cross-rosicrucian": "Rose Cross",
    "sacred-fire-atash": "Atar",
    "scarab-khepri": "Scarab (artifact)",
    "serpent-cosmic-enemy": "Chaoskampf",
    "serpent-wisdom-chthonic": "Serpent symbolism",
    "spiral": "Triple spiral",
    "star-of-ishtar": "Star of Ishtar",
    "sun-disk": "Solar symbol",
    "swastika": "Swastika",
    "tau-cross": "Tau Cross",
    "tauroctony": "Tauroctony",
    "tetragrammaton": "Tetragrammaton",
    "thyrsus": "Thyrsus",
    "tree-of-life": "Tree of life",
    "triskelion": "Triskelion",
    "vesica-piscis": "Vesica piscis",
    "vine-grape": "Grape",
    "wheat-grain": "Wheat",
    "yin-yang": "Taijitu",
    # opus-symbols-3-serpent additions (2026-05-15) — 4 new cross-tradition serpent symbols
    "naga-serpent": "Nāga",
    "uraeus": "Uraeus",
    "feathered-serpent": "Feathered Serpent",
    "nehushtan": "Nehushtan",
}


import unicodedata

def ascii_fold(s):
    """Remove diacritics: Šābuhragān → Sabuhragan."""
    return ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))


def normalize_title(t):
    return re.sub(r"\s*\(.*?\)\s*", "", t).strip()


def candidate_titles(node):
    nid = node["id"]
    out = []
    if nid in OVERRIDES:
        out.append(OVERRIDES[nid])
    raw = node["title"]
    # DISAMBIGUATED FIRST — for deities especially, a bare title like "Geb" or "Nun"
    # routes to the modern military officer / actual nuns rather than the deity.
    # Prepend disambiguators based on node type + tradition so the religious page wins.
    ntype = node.get("type")
    tradition = (node.get("tradition") or "").lower()
    if ntype == "deity":
        # try with common Wikipedia disambiguator forms — these MATCH actual Wikipedia article naming.
        out.append(f"{raw} (god)")
        out.append(f"{raw} (deity)")
        out.append(f"{raw} (mythology)")
        if "egyptian" in tradition:
            out.append(f"{raw} (Egyptian god)")
            out.append(f"{raw} (Egyptian deity)")
            out.append(f"{raw} (Egyptian mythology)")
        if "sumerian" in tradition or "mesopotam" in tradition or "akkadian" in tradition or "babylonian" in tradition:
            out.append(f"{raw} (Mesopotamian god)")
            out.append(f"{raw} (Mesopotamian deity)")
            out.append(f"{raw} (Sumerian)")
            out.append(f"{raw} (Akkadian)")
        if "greek" in tradition or "hellenic" in tradition:
            out.append(f"{raw} (Greek god)")
            out.append(f"{raw} (mythology)")
        if "roman" in tradition:
            out.append(f"{raw} (Roman god)")
            out.append(f"{raw} (mythology)")
        if "norse" in tradition or "germanic" in tradition:
            out.append(f"{raw} (Norse god)")
            out.append(f"{raw} (Germanic mythology)")
        if "hindu" in tradition or "vedic" in tradition or "tantric" in tradition:
            out.append(f"{raw} (Hindu deity)")
            out.append(f"{raw} (Vedic god)")
        if "canaanite" in tradition or "ugaritic" in tradition or "phoenician" in tradition:
            out.append(f"{raw} (Canaanite god)")
            out.append(f"{raw} (Semitic god)")
        if "yoruba" in tradition or "african" in tradition:
            out.append(f"{raw} (Yoruba)")
            out.append(f"{raw} (orisha)")
        if "celtic" in tradition or "irish" in tradition or "welsh" in tradition:
            out.append(f"{raw} (Celtic)")
            out.append(f"{raw} (mythology)")
    elif ntype == "person":
        if "philosoph" in (node.get("role") or "").lower() or "philosoph" in tradition:
            out.append(f"{raw} (philosopher)")
        if "theolog" in (node.get("role") or "").lower():
            out.append(f"{raw} (theologian)")
        if "patristic" in tradition or "christian" in tradition:
            out.append(f"{raw} (theologian)")
            out.append(f"{raw} (bishop)")
    elif ntype == "symbol":
        # Symbols often disambiguate via "(symbol)" or category — try those first.
        out.append(f"{raw} (symbol)")
        out.append(f"{raw} (Christianity)")
        out.append(f"{raw} (Egyptian symbol)")
        out.append(f"{raw} (religious symbol)")
        out.append(f"{raw} (iconography)")
    # NOW the plain title (so if there's no disambiguator clash, the bare title still resolves).
    out.append(raw)
    # ASCII-folded version (Šābuhragān → Sabuhragan)
    ascii_form = ascii_fold(raw)
    if ascii_form != raw:
        out.append(ascii_form)
    # Strip trailing " (...)" disambig
    out.append(normalize_title(raw))
    out.append(ascii_fold(normalize_title(raw)))
    # Cut at em-dash, en-dash, colon, " - " — Wikipedia titles rarely have these
    for sep in (" — ", " – ", " - ", ": ", " — "):
        if sep in raw:
            head = raw.split(sep)[0].strip()
            out.append(head)
            out.append(ascii_fold(head))
            out.append(normalize_title(head))
    # "Foo / Bar" → both halves
    if " / " in raw:
        for piece in raw.split(" / "):
            piece = piece.strip()
            if piece:
                out.append(piece)
                out.append(normalize_title(piece))
                out.append(ascii_fold(piece))
    # remove trailing " (Sumerian)" etc.
    out.append(re.sub(r"\s+\([^)]+\)\s*$", "", raw).strip())
    # de-dupe while preserving order
    seen, uniq = set(), []
    for t in out:
        if t and t not in seen:
            seen.add(t); uniq.append(t)
    return uniq


def _http_json(url, retries=3):
    backoff = 0.6
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                if r.status == 200:
                    return json.loads(r.read().decode("utf-8"))
                if r.status in (429, 503):
                    time.sleep(backoff * (attempt + 1))
                    continue
                return None
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                time.sleep(backoff * (attempt + 1))
                continue
            return None
        except Exception:
            time.sleep(backoff)
            continue
    return None


def wiki_summary(title):
    url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title.replace(" ", "_"), safe="")
    return _http_json(url)


def wiki_search(query, limit=3):
    url = ("https://en.wikipedia.org/w/api.php?action=opensearch&search=" +
           urllib.parse.quote(query) + f"&limit={limit}&namespace=0&format=json")
    data = _http_json(url)
    if not data or not isinstance(data, list) or len(data) < 2:
        return []
    return data[1] or []


def _summary_to_thumb(data, matched):
    if not data:
        return None
    if data.get("type") == "disambiguation":
        return None
    thumb = data.get("thumbnail") or data.get("originalimage")
    if not thumb:
        return None
    return {
        "title": data.get("title"),
        "src": thumb.get("source"),
        "width": thumb.get("width"),
        "height": thumb.get("height"),
        "page": (data.get("content_urls") or {}).get("desktop", {}).get("page"),
        "extract": (data.get("extract") or "")[:280],
        "matched_query": matched,
    }


def find_thumbnail(node):
    cands = candidate_titles(node)
    # Pass 1 — direct summary
    for cand in cands:
        out = _summary_to_thumb(wiki_summary(cand), cand)
        if out:
            return out
    # Pass 2 — opensearch fallback (fuzzy). DELIBERATELY SKIPPED for deities AND symbols
    # because bare-title fuzzy matches go wildly wrong (Geb → Geocaching, Tefnut →
    # Teutonic Order, Nun → actual nuns, Cross → various nautical/electrical things).
    # Missing image is far better than wrong image for the religion atlas.
    if node.get('type') in ('deity', 'symbol'):
        return None
    for cand in cands:
        hits = wiki_search(cand, limit=3)
        for h in hits:
            out = _summary_to_thumb(wiki_summary(h), f"{cand} → {h}")
            if out:
                return out
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--refetch", action="store_true", help="re-try previously failed (null) entries")
    ap.add_argument("--force",   action="store_true", help="re-fetch everything, ignore cache")
    ap.add_argument("--force-type", default=None, help="wipe and re-fetch cache for nodes of this type only (e.g. 'deity', 'person')")
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()

    CACHE.parent.mkdir(parents=True, exist_ok=True)
    cache = {}
    if CACHE.exists() and not args.force:
        try:
            cache = json.loads(CACHE.read_text(encoding="utf-8"))
        except Exception:
            cache = {}

    nodes = gather_nodes()
    # Selectively wipe cache entries for one node type (e.g. deity) so the disambiguation-aware
    # re-fetch replaces wrong matches (Geb=Prussian officer, Nun=actual nuns, etc.).
    if args.force_type:
        target = args.force_type.lower()
        ids_to_wipe = {n["id"] for n in nodes if n["type"] == target}
        wiped = sum(1 for k in list(cache.keys()) if k in ids_to_wipe and cache.pop(k, None) is not None)
        print(f"--force-type={target}: wiped {wiped} cache entries; will re-fetch.")
    print(f"Scanning {len(nodes)} nodes; cache holds {len(cache)} entries.")

    todo = []
    for n in nodes:
        cur = cache.get(n["id"])
        if cur is None and (args.force or args.refetch or n["id"] not in cache):
            todo.append(n)
        elif cur and args.force:
            todo.append(n)

    if not todo:
        print("Nothing to fetch. (Use --refetch to retry null entries, --force to redo all.)")
        return 0

    print(f"Fetching {len(todo)} entries with {args.workers} workers ...")
    done = [0]
    failures = [0]

    def task(n):
        result = find_thumbnail(n)
        cache[n["id"]] = result
        done[0] += 1
        if result is None:
            failures[0] += 1
            status = "·"
        else:
            status = "✓"
        if done[0] % 10 == 0 or done[0] == len(todo):
            print(f"  {done[0]:>4}/{len(todo)}  failures: {failures[0]:<3}  last: {status} {n['title'][:60]}")
        # periodic save so we don't lose progress
        if done[0] % 25 == 0:
            CACHE.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")
        return result

    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        list(ex.map(task, todo))

    CACHE.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")
    hits = sum(1 for v in cache.values() if v)
    print(f"\nDone. {hits}/{len(cache)} nodes have a thumbnail. Cache → {CACHE.relative_to(VAULT)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
