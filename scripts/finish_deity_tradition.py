#!/usr/bin/env python3
"""
finish_deity_tradition.py — closes the deity tradition sweep:
  (a) singularize the 3 genuinely-contested holds (T1-grounded origin), and
  (b) assign a tradition to the 16 no-tradition stub deities (textbook single
      tradition — README excluded).

Every origin is machine-checked against tradition_family(); refuses to write
on any mismatch. Idempotent.

Usage:  python3 scripts/finish_deity_tradition.py [--apply]
"""
import sys, re, importlib, os
sys.path.insert(0, os.getcwd())
import build_data as b
importlib.reload(b)
APPLY = "--apply" in sys.argv

# mode "S" = singularize existing multi-valued tradition (preserve raw + appearances)
# mode "A" = assign tradition to a stub that has none (insert after name:)
# (slug, mode, origin, appearances|None, expected_wedge)
ROWS = [
    # --- the 3 contested holds (T1: Russell 1984 / Kelly 2006 ; Barber 2006 + Hanegraaff ; Burkert 1987) ---
    ("lucifer",         "S", "Christianity (post-Jerome Vulgate, Isa 14:12 Helel)",
        ["Romantic reception", "Modern Satanism", "Hebrew Helel ben Shahar substrate"], "Christian"),
    ("baphomet",        "S", "Modern occultism (Lévi 1856 Sabbatic Goat)",
        ["Knights-Templar trial accusation 1307 (coerced — never a real cult)",
         "Hermeticism", "Rosicrucianism", "Modern Satanism"], "Modern-Esoteric"),
    ("dionysus-mystery","S", "Greco-Roman mystery-cult (Bacchic / Dionysiac)",
        ["civic Olympian Dionysus (see [[dionysus]])"], "Mystery"),
    # --- 15 no-tradition stubs (textbook single tradition; README excluded) ---
    ("adad",            "A", "Akkadian / Babylonian",        None, "Mesopotamian"),
    ("ammit-devourer",  "A", "Egyptian",                     None, "Egyptian"),
    ("anahita-zoroastrian","A","Zoroastrian (Avestan)",      None, "Zoroastrian"),
    ("ichikishima-hime","A", "Shinto",                       None, "Shinto"),
    ("kotoshironushi",  "A", "Shinto",                       None, "Shinto"),
    ("meenakshi",       "A", "Hindu (Tamil Shaiva)",         None, "Vedic"),
    ("shakti",          "A", "Hindu (Shakta)",               None, "Vedic"),
    ("sundareswarar",   "A", "Hindu (Tamil Shaiva)",         None, "Vedic"),
    ("tagitsu-hime",    "A", "Shinto",                       None, "Shinto"),
    ("tagori-hime",     "A", "Shinto",                       None, "Shinto"),
    ("takeminakata",    "A", "Shinto",                       None, "Shinto"),
    ("toyouke",         "A", "Shinto",                       None, "Shinto"),
    ("wiraqocha",       "A", "Inca / Andean",                None, "Andean"),
    ("xuanwu",          "A", "Chinese (Daoist)",             None, "Chinese"),
    ("zhenwu",          "A", "Chinese (Daoist)",             None, "Chinese"),
]

mismatch = staged = 0
plan = []
for slug, mode, origin, appears, expect in ROWS:
    path = f"03_deities/{slug}.md"
    try:
        text = open(path, encoding="utf-8").read()
    except FileNotFoundError:
        print(f"  !! MISSING {path}"); continue
    actual = b.tradition_family(origin)
    if actual != expect:
        print(f"  ✗ MISMATCH {slug}: {origin!r} -> engine={actual}, expected={expect}")
        mismatch += 1; continue
    if mode == "S":
        if "tradition-raw:" in text:
            print(f"  .. SKIP (migrated) {slug}"); continue
        m = re.search(r'^tradition:\s*(.+)$', text, re.M)
        raw = m.group(1).strip().strip("\"'")
        block = (f'tradition: "{origin}"\n'
                 f'tradition-raw: "{raw}"   # pre-migration (membership-vs-wire 2026-06-02)\n'
                 f'tradition-appearances: {appears}   # STEP-B worklist')
        plan.append((path, text, m.group(0), block))
    else:  # mode A — insert after the name: line
        if re.search(r'^tradition:', text, re.M):
            print(f"  .. SKIP (already has tradition) {slug}"); continue
        m = re.search(r'^(name:.*)$', text, re.M)
        if not m:
            print(f"  !! no name: line {slug}"); continue
        block = m.group(1) + f'\ntradition: "{origin}"   # assigned (membership-vs-wire 2026-06-02)'
        plan.append((path, text, m.group(1), block))
    print(f"  ✓ {slug:22s} [{mode}] {origin!r} -> {expect}")
    staged += 1

if mismatch:
    print(f"\n✗ {mismatch} MISMATCH(es) — fix table; NOTHING written."); sys.exit(1)
if APPLY:
    for path, text, old, block in plan:
        open(path, "w", encoding="utf-8").write(text.replace(old, block, 1))
    print(f"\nAPPLIED — {staged} files written.")
else:
    print(f"\nDRY RUN — {staged} files would change, 0 mismatches.")
