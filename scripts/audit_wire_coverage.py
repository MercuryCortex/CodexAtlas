#!/usr/bin/env python3
"""
audit_wire_coverage.py — THE COMPLETENESS BAR (read-only).

WHY THIS EXISTS
The quality scorecards (audit_deity_quality.py / audit_document_quality.py)
grade the nodes that EXIST — schema, sourcing, depth, wiring. They are
*structurally blind to a MISSING node*, so a cross-tradition NEIGHBORHOOD can
be broken — and a whole PANTHEON half-empty — while the scorecard reads 9/9
"product-grade".

PROVEN 2026-06-05: the flagship wire `Genesis-1 "the deep" -> Tiamat · Nun ·
Ginnungagap` scored product-grade while Ginnungagap had no node and the Egyptian
Ogdoad was half-missing. "Quality of the nodes that exist" is the wrong bar.
The right bar: do the nodes the INVESTIGATION needs to draw its wires exist?

This is an investigation tool, not a catalogue — completeness = WIRE-ENDPOINT
coverage, prioritized by the headwaters (Mesopotamian / Egyptian / Greek /
Canaanite / Norse — the source-ends every Abrahamic text echoes back to), NOT by
whether a tradition has a tidy book-canon.

WHAT IT MEASURES
  1. NEIGHBORHOOD INTEGRITY — for each curated cross-tradition cluster, is every
     endpoint present? A missing endpoint = a wire that cannot be drawn = BROKEN,
     and the bar FAILS (exit 1).
  2. PANTHEON ROSTER COVERAGE — for each headwater tradition, hold an
     authoritative deity roster and report present-vs-missing. This is the ONLY
     thing that can see a god nobody has linked yet (neither the quality bar nor
     the demand list can). Informational — does not fail the build.
  3. DEMAND-RANKED GAPS — referenced-but-missing slugs ranked by inbound refs:
     the nodes the graph is already reaching for.

Read-only. Emits src/data/wire-coverage.json for the DEV Overview panel.
Extend NEIGHBORHOODS / ROSTERS as each headwater is mapped.
"""
import os, re, glob, json, datetime, unicodedata

# ── present-set: stems + id: + slugified aka: (so romanization variants resolve) ─
def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii").lower()
    s = re.sub(r"\([^)]*\)", "", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

present = set()
idre = re.compile(r'^id:\s*"?([a-z0-9][a-z0-9-]*)"?\s*$', re.M)
akare = re.compile(r'^aka:\s*\[(.*)\]', re.M)
for f in glob.glob("[0-9]*/**/*.md", recursive=True):
    if "/00_meta/" in f or "/99_ingest/" in f or os.path.basename(f).startswith("_"):
        continue
    present.add(os.path.basename(f)[:-3])
    try:
        t = open(f, encoding="utf-8").read(3000)
    except OSError:
        continue
    m = idre.search(t)
    if m:
        present.add(m.group(1))
    a = akare.search(t)
    if a:
        for nm in re.findall(r'"([^"]+)"', a.group(1)):
            s = slug(nm)
            if len(s) >= 3:
                present.add(s)

def have(cands):
    return any(c in present for c in cands)

# ── 1. cross-tradition NEIGHBORHOODS (wire clusters) ─────────────────────────
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

# ── 2. PANTHEON ROSTERS (authoritative deity lists, headwaters first) ────────
# "within reason" = the great gods + significant secondary deities + the
# primordials + the demons/monsters that carry cross-tradition wires; NOT every
# obscure local city-god. Each entry: (Label, [candidate slugs]). Present-stems
# are listed explicitly so the diff is exact.
ROSTERS = {
    "Mesopotamian (Sumerian/Akkadian/Babylonian/Assyrian)": [
        # primordial / theogony
        ("Tiamat", ["tiamat"]), ("Apsu", ["apsu"]), ("Nammu", ["nammu"]),
        ("Mummu", ["mummu"]), ("Lahmu & Lahamu", ["lahmu-lahamu"]),
        ("Anshar & Kishar", ["anshar-kishar"]), ("Kingu", ["kingu"]),
        # sky / great gods
        ("An / Anu", ["an-sumerian", "anu"]), ("Ki / Antu", ["ki-sumerian"]),
        ("Enlil", ["enlil"]), ("Ninlil", ["nin-lil-sumerian", "ninlil"]),
        ("Enki / Ea", ["enki-ea"]), ("Damkina / Damgalnuna", ["damkina"]),
        ("Ninhursag / Belet-ili / Mami", ["ninhursag", "belet-ili", "mami", "aruru", "nintu"]),
        ("Inanna / Ishtar", ["inanna-sumerian", "ishtar-akkadian", "inanna", "ishtar"]),
        ("Dumuzi / Tammuz", ["dumuzi-tammuz"]), ("Geshtinanna", ["geshtinanna"]),
        ("Utu / Shamash", ["utu-shamash"]), ("Aya / Sherida", ["aya-sherida", "aya", "sherida"]),
        ("Nanna / Sin", ["nanna-sin"]), ("Ningal", ["nin-gal-sumerian", "ningal"]),
        ("Ishkur / Adad", ["adad", "ishkur"]), ("Shala", ["shala"]),
        ("Ninurta / Ningirsu", ["ninurta", "nin-girsu"]),
        ("Gula / Bau / Ninisina / Ninkarrak (healing)", ["gula-akkadian", "bau-sumerian", "ninisina", "ninkarrak"]),
        ("Nergal", ["nergal"]), ("Ereshkigal", ["ereshkigal"]), ("Namtar", ["namtar"]),
        ("Nabu", ["nabu"]), ("Marduk", ["marduk"]), ("Sarpanit", ["sarpanit"]),
        ("Ashur", ["ashur"]), ("Mullissu", ["mullissu-akkadian"]),
        ("Nisaba / Nidaba", ["nisaba"]), ("Haya", ["haya"]),
        ("Nuska / Nusku", ["nuska"]), ("Ninshubur", ["ninshubur"]),
        ("Ningishzida", ["ningishzida"]), ("Ninazu", ["ninazu"]),
        ("Nanshe", ["nanshe-sumerian"]), ("Ninkasi", ["ninkasi"]), ("Siris", ["siris-akkadian"]),
        ("Gibil / Girra", ["gibil"]), ("Erra", ["erra-akkadian"]), ("Ishum", ["ishum"]),
        ("Zababa", ["zababa"]), ("Shara", ["shara"]),
        ("Lugalbanda", ["lugalbanda"]), ("Ninsun", ["ninsun"]), ("Gugalanna", ["gugalanna"]),
        ("Ishtaran", ["ishtaran"]), ("Nanaya", ["nanaya"]), ("Damu", ["damu"]),
        ("Lahar (cattle)", ["lahar"]), ("Ashnan / Ezina (grain)", ["ashnan", "ezina"]),
        ("Enkimdu", ["enkimdu"]), ("Enbilulu", ["enbilulu"]),
        ("Amurru", ["amurru"]), ("Ishara", ["ishara"]),
        ("Belet-seri", ["belet-seri-akkadian"]), ("Allatu", ["allatu-akkadian"]),
        ("Laz", ["laz"]), ("Nikkal", ["nikkal-akkadian"]), ("Nungal", ["nungal"]),
        ("Ningikuga", ["ningikuga"]),
        # demons / monsters that carry wires
        ("Lamashtu", ["lamashtu"]), ("Pazuzu", ["pazuzu"]),
        ("Lamassu / Shedu", ["lamassu"]), ("Apkallu (sages)", ["apkallu"]),
        ("Anzu (storm-bird)", ["anzu", "anzu-bird"]),
        ("Humbaba / Huwawa", ["humbaba", "huwawa"]),
        ("Asag / Asakku", ["asag", "asakku"]), ("Tishpak", ["tishpak"]),
        # collectives
        ("Anunnaki (collective)", ["anunnaki"]), ("Igigi (collective)", ["igigi"]),
    ],
    "Egyptian": [
        ("Ra", ["ra", "amun-ra"]), ("Atum", ["atum"]), ("Amun", ["amun"]), ("Ptah", ["ptah"]),
        ("Osiris", ["osiris"]), ("Isis", ["isis-egyptian", "isis-hellenistic"]), ("Horus", ["horus"]),
        ("Set", ["set"]), ("Nephthys", ["nephthys"]), ("Thoth", ["thoth"]), ("Hathor", ["hathor"]),
        ("Anubis", ["anubis"]), ("Geb", ["geb"]), ("Nut", ["nut"]), ("Shu", ["shu"]), ("Tefnut", ["tefnut"]),
        ("Sekhmet", ["sekhmet"]), ("Bastet", ["bastet"]), ("Sobek", ["sobek"]), ("Khnum", ["khnum"]),
        ("Khonsu", ["khonsu"]), ("Maat", ["ma-at"]), ("Nun", ["nun"]), ("Mut", ["mut"]), ("Neith", ["neith"]),
        ("Apophis", ["apophis"]), ("Ammit", ["ammit-devourer"]), ("Wadjet", ["wadjet"]), ("Nekhbet", ["nekhbet"]),
        ("Bes", ["bes"]), ("Taweret", ["taweret"]), ("Min", ["min-egyptian"]), ("Montu", ["montu"]),
        ("Sokar", ["sokar"]), ("Serapis", ["serapis"]), ("Aten", ["aten"]), ("Khepri", ["khepri"]),
        ("Nefertem", ["nefertem"]), ("Heqet", ["heqet"]), ("Satet", ["satet"]), ("Anuket", ["anuket"]),
        ("Selket", ["selket"]), ("Renenutet", ["renenutet"]), ("Meretseger", ["meretseger"]),
        ("Onuris", ["onuris"]), ("Banebdjedet", ["banebdjedet"]), ("Apis", ["apis-bull"]),
        ("Hapi (Nile)", ["hapi-nile"]), ("Wepwawet", ["wepwawet"]),
        ("Amaunet (Ogdoad)", ["amaunet"]), ("Hauhet (Ogdoad)", ["hauhet"]), ("Heh (Ogdoad)", ["heh-egyptian"]),
        ("Kek (Ogdoad)", ["kek-egyptian"]), ("Kauket (Ogdoad)", ["kauket"]), ("Naunet (Ogdoad)", ["naunet"]),
        # gaps
        ("Seshat", ["seshat"]), ("Heka", ["heka", "heka-egyptian"]), ("Tatenen", ["tatenen"]),
        ("Imhotep (deified)", ["imhotep"]), ("Hu & Sia", ["hu-sia", "hu-egyptian"]),
    ],
    "Greek": [
        ("Zeus", ["zeus"]), ("Hera", ["hera"]), ("Poseidon", ["poseidon"]), ("Demeter", ["demeter"]),
        ("Athena", ["athena"]), ("Apollo", ["apollo"]), ("Artemis", ["artemis"]), ("Ares", ["ares"]),
        ("Aphrodite", ["aphrodite-greek"]), ("Hephaestus", ["hephaestus"]), ("Hermes", ["hermes-greek"]),
        ("Hestia", ["hestia"]), ("Dionysus", ["dionysus"]), ("Hades", ["hades"]), ("Persephone", ["persephone-greek"]),
        ("Kronos", ["kronos"]), ("Rhea", ["rhea"]), ("Gaia", ["gaia"]), ("Uranus", ["uranus-greek"]),
        ("Oceanus", ["oceanus"]), ("Tethys", ["tethys"]), ("Hyperion", ["hyperion"]), ("Theia", ["theia"]),
        ("Iapetus", ["iapetus"]), ("Mnemosyne", ["mnemosyne"]), ("Themis", ["themis"]), ("Metis", ["metis"]),
        ("Leto", ["leto"]), ("Atlas", ["atlas-titan"]), ("Prometheus", ["prometheus"]),
        ("Chaos", ["chaos-primordial"]), ("Nyx", ["nyx-primordial"]), ("Eros", ["eros-primordial"]),
        ("Phanes", ["phanes-protogonos"]), ("Helios", ["helios"]), ("Selene", ["selene"]), ("Eos", ["eos-greek"]),
        ("Hekate", ["hekate"]), ("Pan", ["pan-greek"]), ("Nemesis", ["nemesis-greek"]), ("Nike", ["nike-greek"]),
        ("Iris", ["iris-greek"]), ("Hypnos", ["hypnos"]), ("Thanatos", ["thanatos-greek"]), ("Hebe", ["hebe"]),
        ("Asclepius", ["asclepius-greek"]), ("Hygieia", ["hygieia"]), ("Eileithyia", ["eileithyia-greek"]),
        ("Tyche", ["tyche-greek"]), ("Eris", ["eris"]), ("Nereus", ["nereus"]), ("Triton", ["triton"]),
        ("Amphitrite", ["amphitrite"]), ("The Moirai (Fates)", ["the-moirai"]), ("The Erinyes", ["the-erinyes"]),
        ("The Dioskouroi", ["the-dioskouroi"]), ("Priapus", ["priapus-greek-roman"]), ("Plutus", ["plutus"]),
        ("Triptolemus", ["triptolemus"]), ("Heracles", ["heracles", "hercules"]), ("Typhon", ["typhon"]),
        # gaps
        ("Tartarus", ["tartarus"]), ("Erebus", ["erebus"]), ("Charon", ["charon", "charon-greek"]),
        ("Epimetheus", ["epimetheus"]), ("Phoebe (Titan)", ["phoebe-titan"]), ("Coeus", ["coeus"]),
        ("Crius", ["crius"]), ("Proteus", ["proteus-greek", "proteus"]), ("Ananke", ["ananke"]),
    ],
    "Canaanite / Ugaritic / Phoenician": [
        ("El", ["el-canaanite"]), ("Asherah", ["asherah"]), ("Baal-Hadad", ["baal", "baal-hadad"]),
        ("Anat", ["anat"]), ("Astarte", ["astarte-canaanite"]), ("Yam", ["yam"]), ("Mot", ["mot"]),
        ("Dagon", ["dagon"]), ("Kothar-wa-Khasis", ["kothar-wa-khasis"]), ("Shapash", ["shapash"]),
        ("Resheph", ["resheph"]), ("Lotan", ["lotan"]), ("Chemosh", ["chemosh"]), ("Moloch", ["moloch"]),
        ("Eshmun", ["eshmun"]), ("Melqart", ["melqart"]), ("Tanit", ["tanit"]),
        # gaps
        ("Athtar", ["athtar"]), ("Shahar (dawn — Isa 14 Helel)", ["shahar"]), ("Shalim (dusk)", ["shalim"]),
        ("Yarikh (moon)", ["yarikh"]), ("Horon", ["horon"]), ("Kotharat", ["kotharat"]), ("Pidray", ["pidray"]),
    ],
    "Norse": [
        ("Odin", ["odin"]), ("Thor", ["thor"]), ("Loki", ["loki"]), ("Frigg", ["frigg"]), ("Freyja", ["freyja"]),
        ("Freyr", ["freyr"]), ("Tyr", ["tyr"]), ("Baldr", ["baldr"]), ("Heimdall", ["heimdall"]), ("Njord", ["njord"]),
        ("Hel", ["hel"]), ("Sif", ["sif"]), ("Idunn", ["idunn"]), ("Bragi", ["bragi"]), ("Vidar", ["vidar"]),
        ("Vali", ["vali"]), ("Hod", ["hod"]), ("Forseti", ["forseti"]), ("Ullr", ["ullr"]), ("Skadi", ["skadi"]),
        ("Gefjon", ["gefjon"]), ("Sigyn", ["sigyn"]), ("Ran", ["ran"]), ("Aegir", ["aegir-norse"]),
        ("Mani", ["mani-norse"]), ("Sol", ["sol-norse"]), ("Mimir", ["mimir-norse"]), ("Hoenir", ["hoenir"]),
        ("Andvari", ["andvari"]), ("Audumla", ["audumla"]), ("Bergelmir", ["bergelmir"]),
        ("Ginnungagap", ["ginnungagap"]), ("Surtr", ["surtr"]), ("Fenrir", ["fenrir"]),
        ("Jormungandr", ["jormungandr"]), ("Ymir", ["ymir"]), ("Nerthus", ["nerthus"]),
        # gaps
        ("Nanna (Baldr's wife)", ["nanna-norse"]), ("Nott (night)", ["nott", "nott-norse"]), ("Dagr (day)", ["dagr"]),
        ("Vili & Ve", ["vili-ve", "vili"]), ("Buri", ["buri-norse", "buri"]), ("Bor", ["bor-norse"]),
        ("Nidhogg", ["nidhogg"]), ("The Norns (fate)", ["norns"]), ("Valkyries", ["valkyrie", "valkyries"]),
        ("Modi & Magni", ["modi-magni", "modi"]), ("Eir (healing)", ["eir-norse", "eir"]),
    ],
}

# ── 3. demand: referenced-but-missing slugs, ranked (linkcheck output) ───────
DEAD = "99_ingest/audit_dead.txt"
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
            continue
        if not re.fullmatch(r"[a-z][a-z0-9-]{2,}", tgt):
            continue
        demand.append((cnt, tgt))
demand.sort(key=lambda x: (-x[0], x[1]))

# ── report ──────────────────────────────────────────────────────────────────
print(f"=== COMPLETENESS BAR ({len(present)} node slugs indexed) ===\n")
print("NEIGHBORHOOD INTEGRITY:")
neigh_out, all_whole = [], True
for nid, n in NEIGHBORHOODS.items():
    missing = {}
    total = 0
    for trad, slugs in n["endpoints"].items():
        total += len(slugs)
        miss = [s for s in slugs if s not in present]
        if miss:
            missing[trad] = miss
    whole = not missing
    all_whole = all_whole and whole
    pc = total - sum(len(v) for v in missing.values())
    print(f"  {'✅ WHOLE' if whole else '🚨 BROKEN'}  [{nid}] {pc}/{total}")
    for trad, miss in missing.items():
        print(f"          MISSING · {trad}: {', '.join(miss)}")
    neigh_out.append({"id": nid, "label": n["label"], "whole": whole,
                      "present": pc, "total": total, "missing": missing})

print("\nPANTHEON ROSTER COVERAGE:")
roster_out = []
for trad, roster in ROSTERS.items():
    miss = [lbl for lbl, cands in roster if not have(cands)]
    p = len(roster) - len(miss)
    pct = 100 * p // len(roster)
    print(f"  {trad}: {p}/{len(roster)} present ({pct}%)")
    if miss:
        print(f"     MISSING ({len(miss)}): {', '.join(miss)}")
    roster_out.append({"tradition": trad, "present": p, "total": len(roster),
                       "pct": pct, "missing": miss})

print("\nTOP DEMAND — referenced but missing:")
for cnt, tgt in demand[:25]:
    print(f"   {cnt:3d}×  {tgt}")

out = {
    "generatedAt": datetime.date.today().isoformat(),
    "indexedSlugs": len(present),
    "neighborhoodsWhole": all_whole,
    "neighborhoods": neigh_out,
    "rosters": roster_out,
    "topDemand": [{"refs": c, "target": t} for c, t in demand[:50]],
}
os.makedirs("src/data", exist_ok=True)
open("src/data/wire-coverage.json", "w", encoding="utf-8").write(json.dumps(out, indent=1))
print(f"\nNEIGHBORHOODS {'all WHOLE ✅' if all_whole else 'BROKEN 🚨'} "
      f"-> src/data/wire-coverage.json")
raise SystemExit(0 if all_whole else 1)
