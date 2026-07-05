#!/usr/bin/env python3
"""
build_transmission_ranking.py — Codex Atlas
=================================================================
Computes the DEITY TRANSMISSION RANKING + the civilization-lens
reach matrix that feeds the Dev Overview panel's "Deity
Transmission Ranking" heatmap.

Two measures, both grep/parse-verified from the live vault:

1. TRANSMISSION SCORE (per deity) — how much a deity's concept
   travels across traditions, from its wire fields:
      score = sourced_syncretic_edges
            + 1.5 * distinct_cross_traditions_reached
            + 0.5 * equivalents
            + 0.5 * tier1_sourced_edges
   The top 10 by this score are the "roots".

2. CIVILIZATION-LENS REACH (per root) — for each of the 9 "hard"
   lenses (the ones that discriminate: law, philosophy, math,
   medicine, astronomy, divination, calendars, music, alchemy),
   how many nodes in that lens folder mention the root's branch
   (word-boundaried tokens). This is a mention-reach proxy — a
   LOWER BOUND (tradition-anchored roots are undercounted; the
   Tiamat deep-dive lit ~17/29 despite low name-mentions).

Output: src/data/transmission-ranking.json  (SSOT — the panel
never hard-codes these numbers). Rebuild:
    python3 scripts/build_transmission_ranking.py
"""
import os, re, glob, json, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEI = os.path.join(ROOT, "03_deities")

# --- per-root branch tokens (word-boundaried; hand-curated for the
#     current top-10 transmission roots). If a new deity enters the
#     top 10 with no entry, we fall back to its id + tradition words. ---
ROOT_TOKENS = {
 "tiamat":  r"\btiamat\b|\bmarduk\b|\bapsu\b|\benuma[- ]?elish\b|\btehom\b|chaoskampf|\bnun\b|primordial[- ]water",
 "indra":   r"\bindra\b|\bvedic\b|rig[- ]?veda|\bvritra\b|\bsoma\b|\bvajra\b|\bmaruts?\b|\bdyaus\b",
 "zeus":    r"\bzeus\b|olympian|\bhesiod\b|theogony|\bkronos\b|\bcronus\b|titanomachy|\bdyaus\b|jupiter",
 "jesus-christ-deity": r"\bjesus\b|\bchrist\b|\bgospel|crucifix|resurrect|incarnation|\blogos\b|eucharist",
 "osiris":  r"\bosiris\b|\bisis\b|\bhorus\b|pyramid[- ]text|book[- ]of[- ]the[- ]dead|\bduat\b|heliopolis|\bennead\b|\bma-?at\b",
 "thor":    r"\bthor\b|mjolnir|\bthunar\b|\bdonar\b|jormungand|\basgard\b|\beddas?\b|\bodin\b|perkwunos",
 "mary-theotokos": r"\bmary\b|theotokos|madonna|marian|annunciation|magnificat|immaculate|dormition",
 "perun":   r"\bperun\b|perkun|\bslavic\b|\bveles\b|\bsvarog\b|perkwunos|dazhbog",
 "inanna-sumerian": r"\binanna\b|\bishtar\b|dumuzi|descent[- ]of[- ]inanna|\buruk\b|\bastarte\b|\bsumer",
 "hermes-greek": r"\bhermes\b|trismegistus|hermetic|\bmercury\b|caduceus|psychopomp|emerald[- ]tablet|\bthoth\b|\bthrice[- ]great",
}
# the 9 discriminating "civilization" lenses (folder -> short key)
HARD_LENSES = [
 ("13_morals","law"),("15_philosophy","phil"),("16_mathematics","math"),
 ("17_medicine","med"),("19_astronomy","astr"),("25_divination","div"),
 ("26_calendars","cal"),("10_music","mus"),("12_alchemy","alch"),
]

WL = re.compile(r"\[\[([^\]|#]+)")
def wl_slug(s):
    if not isinstance(s, str): return None
    m = WL.search(s); return (m.group(1).strip() if m else s.strip())
def norm_trad(t):
    if not t: return "?"
    return re.split(r"[\(—;,/]", str(t))[0].strip().lower() or "?"

def load_fm(path):
    with open(path, encoding="utf-8", errors="ignore") as f:
        txt = f.read()
    if not txt.startswith("---"): return None, txt
    end = txt.find("\n---", 3)
    if end == -1: return None, txt
    fm = txt[3:end]
    grab = lambda k: (re.search(rf'^{k}\s*:\s*"?(.*?)"?\s*$', fm, re.M) or [None,""])[1] if re.search(rf'^{k}\s*:', fm, re.M) else ""
    return fm, txt

def extract_block(fm, key):
    out, inb = [], False
    for ln in fm.splitlines():
        if re.match(rf"^{re.escape(key)}\s*:", ln): inb = True; continue
        if inb:
            if re.match(r"^\S.*:", ln): break
            out.append(ln)
    return "\n".join(out)

# ---- pass 1: home tradition per deity slug + transmission-score inputs ----
files = [f for f in sorted(glob.glob(os.path.join(DEI, "*.md"))) if os.path.basename(f) != "README.md"]
home, recs = {}, {}
for f in files:
    fm, _ = load_fm(f)
    slug = os.path.splitext(os.path.basename(f))[0]
    if fm is None: continue
    m = re.search(r'^tradition\s*:\s*"?(.*?)"?\s*$', fm, re.M)
    home[slug] = m.group(1) if m else ""
    recs[slug] = fm

def score_deity(slug, fm):
    # syncretic-edges: count entries (- target:) that carry a source: + tier
    eblock = extract_block(fm, "syncretic-edges")
    edges, cur = [], None
    for ln in eblock.splitlines():
        mt = re.match(r"\s*-\s*target:\s*(.*)$", ln)
        if mt:
            if cur: edges.append(cur)
            cur = {"target": mt.group(1).strip().strip('"'), "src": False, "t1": False}
            continue
        if cur is not None:
            if re.match(r"\s*source:\s*\S", ln): cur["src"] = True
            if re.match(r'\s*source-tier:\s*"?T?1', ln): cur["t1"] = True
    if cur: edges.append(cur)
    sourced = [e for e in edges if e["src"]]
    t1 = [e for e in sourced if e["t1"]]
    # equivalents
    qb = extract_block(fm, "equivalents")
    equivs = WL.findall(qb)
    mi = re.search(r'^equivalents:\s*(\[.*)', fm, re.M)
    if mi and not equivs: equivs = WL.findall(mi.group(1))
    myfam = norm_trad(home.get(slug, ""))
    reach = set()
    for e in edges:
        t = wl_slug(e["target"])
        if t in home: reach.add(norm_trad(home[t]))
    for q in equivs:
        if q.strip() in home: reach.add(norm_trad(home[q.strip()]))
    cross = reach - {myfam}
    return len(sourced)*1.0 + len(cross)*1.5 + len(equivs)*0.5 + len(t1)*0.5, len(sourced), len(t1), len(equivs), len(cross)

ranked = []
for slug, fm in recs.items():
    sc, ns, nt1, neq, ncr = score_deity(slug, fm)
    nm = re.search(r'^name\s*:\s*"?(.*?)"?\s*$', fm, re.M)
    ranked.append({"slug": slug, "name": (nm.group(1) if nm else slug),
                   "tradition": home.get(slug,""), "score": round(sc,1),
                   "sourced": ns, "t1": nt1, "equiv": neq, "cross": ncr})
ranked.sort(key=lambda r: -r["score"])

# ---- pass 2: civ-lens reach for the top-10 roots ----
# preload hard-lens folder texts once
lens_texts = {}
for folder, key in HARD_LENSES:
    d = os.path.join(ROOT, folder)
    lens_texts[key] = [open(p, encoding="utf-8", errors="ignore").read().lower()
                       for p in glob.glob(os.path.join(d, "*.md"))]

def civ_reach(slug, name, tradition):
    pat = ROOT_TOKENS.get(slug)
    if not pat:
        # Fallback for a root with no curated tokens: use only distinctive
        # NAME words from the slug — never tradition words (e.g. "greek",
        # "norse") which match hundreds of unrelated nodes and inflate reach.
        STOP = {"greek","roman","norse","germanic","egyptian","hindu","vedic","celtic",
                "slavic","gnostic","christian","jewish","hebrew","islamic","buddhist",
                "sumerian","babylonian","akkadian","deity","god","goddess","the"}
        words = [re.escape(w) for w in re.split(r"[-\s]", slug) if len(w) > 3 and w.lower() not in STOP]
        pat = r"\b(" + "|".join(words or [re.escape(slug.split('-')[0])]) + r")\b"
    rx = re.compile(pat, re.I)
    return {key: sum(1 for t in lens_texts[key] if rx.search(t)) for _, key in HARD_LENSES}

top = ranked[:10]
missing_tokens = [r["slug"] for r in top if r["slug"] not in ROOT_TOKENS]
if missing_tokens:
    print("  ⚠ WARNING — top-10 roots without curated civ-reach tokens (using name-only "
          "fallback; add a ROOT_TOKENS entry for an exact reach count): " + ", ".join(missing_tokens))
roots = []
for i, r in enumerate(top):
    lenses = civ_reach(r["slug"], r["name"], r["tradition"])
    civ = sum(lenses.values())
    roots.append({
        "slug": r["slug"], "name": r["name"], "tradition": r["tradition"],
        "transmissionRank": i + 1, "transmissionScore": r["score"],
        "sourced": r["sourced"], "equiv": r["equiv"], "cross": r["cross"],
        "civScore": civ, "lenses": lenses,
    })
# display order = civ-score desc (the heatmap sort)
roots.sort(key=lambda x: -x["civScore"])

out = {
    "generatedAt": datetime.date.today().isoformat(),
    "note": "Top-10 deities by transmission score; heatmap sorted by civilization-lens reach (mention-count lower bound).",
    "lensKeys": [k for _, k in HARD_LENSES],
    "roots": roots,
    "methodology": {
        "transmissionScore": "sourced syncretic-edges + 1.5*distinct-cross-traditions + 0.5*equivalents + 0.5*T1-edges",
        "civReach": "per hard lens, count of nodes mentioning the root's branch tokens (word-boundaried); a LOWER BOUND — tradition-anchored roots undercounted.",
    },
}
OUT = os.path.join(ROOT, "src", "data", "transmission-ranking.json")
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print(f"wrote {OUT}")
print(f"  transmission top-10: " + ", ".join(f"{r['name'].split('(')[0].strip()}({r['score']})" for r in top))
print(f"  civ-score order:     " + ", ".join(f"{r['name'].split('(')[0].strip()}={r['civScore']}" for r in roots))
