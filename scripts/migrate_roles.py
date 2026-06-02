#!/usr/bin/env python3
"""
migrate_roles.py — Figures migration Stage 5+6+7.

For every person file in 04_persons/:
  1. If doc_id is in role-contested-cases-ratified-2026-05-31.yaml → use those values
  2. Else: alias-match against current free-text role: field against role-vocabulary.yaml aliases
  3. Else: sub-tradition / tradition heuristic (medium confidence, conservative)
  4. Else: flag for manual review (NEVER silent-default per no-silent-guessing rule + Step 0 source-gate)

Writes:
  - role-tokens: ["canonical-id-1", "canonical-id-2"]      (controlled vocab array)
  - role-description: "<existing prose>"                    (preserves emic nuance)
  - polemical-framing: [...]                                (when from contested-cases)
  - reclaimed-self-naming: [...]                            (when from contested-cases)

USAGE:
  python3 scripts/migrate_roles.py                # dry-run; writes TSV report
  python3 scripts/migrate_roles.py --apply        # actually writes YAML
  python3 scripts/migrate_roles.py --revert-from-tsv PATH   # undo from TSV
"""
from __future__ import annotations
import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

import yaml

VAULT = Path(__file__).resolve().parent.parent
PERSONS = VAULT / "04_persons"
VOCAB = VAULT / "00_meta" / "role-vocabulary.yaml"
CONTESTED = VAULT / "00_meta" / "role-contested-cases-ratified-2026-05-31.yaml"
TSV_OUT = VAULT / "AUDIT" / "2026-05-31-roles-migration-table.tsv"


# ─── YAML helpers ───────────────────────────────────────────────────────

def parse_frontmatter(text: str):
    """Return (fm_dict, fm_raw, fm_start, fm_end, body)."""
    m = re.match(r"^---\n(.*?)\n---\n?", text, re.DOTALL)
    if not m:
        return None, None, None, None, None
    fm_raw = m.group(1)
    fm_dict = {}
    for line in fm_raw.split("\n"):
        mm = re.match(r'^([a-z][\w-]*):\s*(.*?)\s*$', line)
        if mm:
            fm_dict[mm.group(1)] = mm.group(2).strip('"').strip("'")
    return fm_dict, fm_raw, m.start(1), m.end(1), text[m.end():]


# ─── Vocab loading ──────────────────────────────────────────────────────

def load_vocab():
    """Returns:
        - canonical_ids: set of all valid role-token ids
        - alias_to_id: dict mapping alias-string (lowercased) → canonical id
        - id_to_entry: dict mapping canonical id → full entry
    """
    with VOCAB.open() as f:
        data = yaml.safe_load(f)
    canonical_ids = set()
    alias_to_id = {}
    id_to_entry = {}
    for entry in data.get("entries", []):
        eid = entry["id"]
        canonical_ids.add(eid)
        id_to_entry[eid] = entry
        # Canonical id is also an alias
        alias_to_id[eid.lower()] = eid
        alias_to_id[entry.get("display", "").lower()] = eid
        for alias in (entry.get("aliases") or []):
            alias_to_id[str(alias).lower()] = eid
    return canonical_ids, alias_to_id, id_to_entry


def load_contested_cases():
    """Returns dict mapping doc_id → contested-case-entry."""
    with CONTESTED.open() as f:
        data = yaml.safe_load(f)
    return data.get("contested_cases", {}) or {}


# ─── Classification logic ──────────────────────────────────────────────

def classify_via_aliases(fm_dict: dict, alias_to_id: dict) -> tuple[list[str], str]:
    """Try to resolve current role: free-text via aliases.
    Returns ([canonical_ids], 'alias-match'/'no-alias-match')."""
    role_raw = fm_dict.get("role", "")
    if not role_raw:
        return [], "no-role-field"

    # Try direct exact match first
    if role_raw.lower().strip() in alias_to_id:
        return [alias_to_id[role_raw.lower().strip()]], "alias-exact"

    # Try splitting on common separators
    parts = re.split(r'\s*[/|,;]\s*|\s+/\s+', role_raw)
    matched = []
    for p in parts:
        p_clean = p.strip().strip('"').strip("'").lower()
        if p_clean in alias_to_id:
            cid = alias_to_id[p_clean]
            if cid not in matched:
                matched.append(cid)
    if matched:
        return matched, "alias-split"
    return [], "no-alias-match"


# Heuristic patterns — conservative, only used when alias-match fails.
# Each entry: (regex, [canonical_ids_to_add], confidence-label)
HEURISTIC_PATTERNS = [
    # Strong signals (only fire when YAML field text is unambiguous)
    (r"\bpope of rome\b|\broman catholic pope\b|\bbishop of rome\b", ["pope-roman-catholic"], "pope-rc"),
    (r"\bpope of alexandria\b|\bcoptic pope\b", ["pope-coptic"], "pope-coptic"),
    (r"\bdalai lama\b", ["dalai-lama"], "dalai-lama"),
    (r"\bpanchen lama\b", ["panchen-lama"], "panchen-lama"),
    (r"\bkarmapa\b", ["karmapa"], "karmapa"),
    (r"\btirthankara\b|\btīrthaṅkara\b", ["tirthankara-jain"], "tirthankara"),
    (r"\bmahasiddha\b|\bmahāsiddha\b", ["mahasiddha"], "mahasiddha"),
    (r"\b(Adi )?Sankara|Śaṅkara|Śaṅkarācārya|Ramanuja|Rāmānuja|Madhva|Madhvācārya|Nimbarka|Vallabha|Chaitanya|Chaitanya Mahāprabhu|acharya|ācārya\b", ["acharya-hindu"], "acharya-hindu"),
    (r"\bAvalokiteśvara|Mañjuśrī|Maitreya|Tara|Vajrapani\b", [], "deity-not-person"),  # exclude
    (r"\bbabalawo\b|\bbabaláwo\b|\bIfá priest\b", ["babalawo"], "babalawo"),
    (r"\bhoungan\b", ["houngan"], "houngan"),
    (r"\bmambo\b", ["mambo"], "mambo"),
    (r"\boba of\b|\bAlaafin\b|\bOoni\b", ["oba-yoruba"], "oba-yoruba"),
    (r"\bwičháša wakȟáŋ\b|\bLakota holy (man|woman|person)\b", ["wichasha-wakan"], "wichasha-wakan"),
    (r"\bGhost Dance prophet\b|\bNorthern Paiute prophet\b|\bSeneca prophet\b", ["prophet-indigenous"], "prophet-indigenous"),
    (r"\btohunga\b", ["tohunga"], "tohunga"),
    (r"\bkahuna\b", ["kahuna"], "kahuna"),
    (r"\bmudang\b", ["mudang"], "mudang"),
    (r"\bGuru Nanak|Guru Angad|Guru Amar Das|Guru Ram Das|Guru Arjan|Guru Hargobind|Guru Har Rai|Guru Har Krishan|Guru Tegh Bahadur|Guru Gobind Singh\b", ["guru-sikh"], "guru-sikh"),
    (r"\bIslamic jurist|jurisprudence.*Islamic|fiqh\b", ["jurist-islamic"], "jurist-islamic"),
    (r"\bHasidic\b.*\b(rebbe|tzaddik|tsaddik)\b|\b(Baal Shem Tov|Maggid of Mezeritch|Lubavitcher)\b", ["zaddik-hasidic"], "zaddik-hasidic"),
    (r"\bTannaitic\b|\bMishnaic sage\b", ["rabbi-tannaitic"], "rabbi-tannaitic"),
    (r"\bAmora\b|\bAmoraim\b|\bTalmudic sage\b", ["rabbi-amoraic"], "rabbi-amoraic"),
    (r"\bGeonic\b|\bRishonim\b", ["rabbi-medieval"], "rabbi-medieval"),
    (r"\bArchbishop of Canterbury\b|\bAnglican Archbishop\b", ["archbishop-anglican"], "archbishop-anglican"),
    (r"\bDoctor of the Church\b|\bDoctor Ecclesiae\b", ["doctor-of-the-church"], "doctor-of-the-church"),
    (r"\bpharaoh\b", ["pharaoh"], "pharaoh"),
    (r"\bemperor\b(?!.*Holy Roman|.*Byzantine.*context|.*patron|.*who patronized)", ["emperor"], "emperor"),
    (r"\bShinto priest\b|\bkannushi\b", ["kannushi"], "kannushi"),
    (r"\bmiko\b", ["miko"], "miko"),
    (r"\bDaoist priest\b|\bdaoshi\b", ["daoshi"], "daoshi"),
    (r"\bConfucian sage\b|\bRu scholar\b", ["sage-chinese-ru"], "sage-chinese-ru"),
    (r"\bPre-Socratic\b|\bPresocratic\b", ["presocratic-philosopher"], "presocratic-philosopher"),
    (r"\bBenedictine\b|\bCistercian\b|\bDominican\b|\bFranciscan\b|\bCarmelite\b|\bTrappist\b|\bJesuit\b", ["monastic-christian-western"], "monastic-western"),
    (r"\bRussian Orthodox monk\b|\bAthonite\b", ["monastic-christian-eastern"], "monastic-eastern"),
    (r"\bbhikkhu\b|\bbhiksu\b", ["bhikkhu-theravada"], "bhikkhu"),
    (r"\barhat\b|\barahant\b", ["arhat-buddhist"], "arhat-buddhist"),
    (r"\bRōshi\b|\brōshi\b|\broshi\b", ["roshi"], "roshi"),
    (r"\bZen master\b|\bChan master\b", ["zen-master"], "zen-master"),
    (r"\bSangharaja\b", ["sangharaja"], "sangharaja"),
    (r"\bSahabi\b|\bCompanion of the Prophet\b|\bCompanion of Muhammad\b", ["sahabi"], "sahabi"),
    (r"\bayatollah\b|\bAyatollah\b", ["ayatollah-twelver"], "ayatollah-twelver"),
    (r"\bSufi shaykh\b|\bSufi master\b", ["sufi-shaykh"], "sufi-shaykh"),
    (r"\bsanteros?\b", ["santero"], "santero"),
    (r"\bbabalorixá?\b", ["babalorixa"], "babalorixa"),
    (r"\biyalorixá?\b", ["iyalorixa"], "iyalorixa"),
    # Modern-Pagan
    (r"\bWiccan high priest\b|\bWiccan high priestess\b|\bWicca.*priest\b", ["priest-wiccan"], "priest-wiccan"),
    # Tier 4 — political with religious dimension
    (r"\bmonarch\b|\bKing of\b|\bking\b", ["king"], "king"),
    (r"\bqueen\b", ["queen"], "queen"),
    (r"\breligious reformer\b|\bReformation\b.*\bleader\b", ["religious-reformer"], "religious-reformer"),
    (r"\bpatron of\s+(Buddhism|Christianity|Hinduism|Islam)\b", ["religious-patron"], "religious-patron"),
    # Tier 5
    (r"\bhistorian of religion\b|\breligious studies scholar\b|\bcomparative religion (scholar|professor)\b|\banthropologist.*religion\b|\bsociologist.*religion\b", ["scholar-academic-religion"], "scholar-academic"),
    (r"\bpsychologist of religion\b", ["psychologist-of-religion"], "psychologist-religion"),
    (r"\b(poet|playwright|novelist|essayist|writer)\b(?!\s+(saint|sant|of religion))", ["author-secular"], "author-secular"),
]


def classify_via_heuristic(fm_dict: dict, canonical_ids: set) -> tuple[list[str], str]:
    """Conservative inference via sub-tradition / tradition / role-description.
    Only fires when alias-match failed.
    Returns ([canonical_ids], 'heuristic-rule-name' or 'unmatched')."""
    text = " ".join(filter(None, [
        fm_dict.get("role", ""),
        fm_dict.get("sub-tradition", ""),
        fm_dict.get("tradition", ""),
        fm_dict.get("label", ""),
        fm_dict.get("title", ""),
    ]))
    matches = []
    rule_hits = []
    for pattern, tokens, rule_name in HEURISTIC_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            for t in tokens:
                if t in canonical_ids and t not in matches:
                    matches.append(t)
            if tokens:
                rule_hits.append(rule_name)
    return matches, "+".join(rule_hits) if rule_hits else "unmatched"


# ─── Field placement / YAML writing ─────────────────────────────────────

def apply_role_tokens(text: str, tokens: list[str], description: str,
                     polemical: list[dict] | None = None,
                     reclaimed: list[dict] | None = None) -> tuple[str, str]:
    """Add `role-tokens:`, `role-description:`, and optional `polemical-framing:` +
    `reclaimed-self-naming:` to YAML frontmatter.

    Renames any existing `role:` field to `role-description:` if no explicit
    description provided.

    Returns (new_text, action) where action ∈ {written, unchanged, no-frontmatter}.
    """
    fm, fm_raw, fm_start, fm_end, body = parse_frontmatter(text)
    if fm is None:
        return text, "no-frontmatter"

    # Already migrated?
    if "role-tokens" in fm:
        return text, "already-migrated"

    lines = fm_raw.split("\n")
    new_lines = []
    inserted_role_tokens = False
    existing_role_prose = fm.get("role", "")
    rename_role = "role" in fm and "role-description" not in fm
    final_description = description or existing_role_prose

    # Find insertion point — after tradition: line; else after role: line
    insert_after_idx = -1
    for i, line in enumerate(lines):
        if re.match(r"^tradition\s*:", line):
            insert_after_idx = i

    for i, line in enumerate(lines):
        # Rename existing `role:` to `role-description:` (skip if we'll set a new description)
        if rename_role and re.match(r"^role\s*:", line) and not re.match(r"^role-", line):
            if description and description != existing_role_prose:
                # We'll write our own role-description; drop the old `role:` line
                continue
            else:
                # Convert role: → role-description:
                rest = re.sub(r"^role\s*:\s*", "", line)
                new_lines.append(f"role-description: {rest}")
                continue
        new_lines.append(line)
        # Insert role-tokens block after tradition: (or end)
        if i == insert_after_idx and not inserted_role_tokens:
            tokens_str = '[' + ', '.join(f'"{t}"' for t in tokens) + ']'
            new_lines.append(f"role-tokens: {tokens_str}")
            if description and (not rename_role or description != existing_role_prose):
                new_lines.append(f'role-description: "{description}"')
            if polemical:
                new_lines.append("polemical-framing:")
                for p in polemical:
                    new_lines.append(f"  - by: \"{p.get('by','')}\"")
                    new_lines.append(f"    label: \"{p.get('label','')}\"")
                    new_lines.append(f"    source-tier: {p.get('source-tier','T1')}")
                    new_lines.append(f"    source: \"{p.get('source','')}\"")
                    if p.get('direction'):
                        new_lines.append(f"    direction: {p['direction']}")
                    if p.get('note'):
                        new_lines.append(f"    note: \"{p['note']}\"")
            if reclaimed:
                new_lines.append("reclaimed-self-naming:")
                for r in reclaimed:
                    new_lines.append(f"  - tradition: \"{r.get('reclaiming-tradition','')}\"")
                    new_lines.append(f"    label: \"{r.get('label','')}\"")
                    new_lines.append(f"    source-tier: {r.get('source-tier','T1')}")
                    new_lines.append(f"    source: \"{r.get('source','')}\"")
            inserted_role_tokens = True

    # If we never found insertion point (no tradition: + no role:), append at end
    if not inserted_role_tokens:
        tokens_str = '[' + ', '.join(f'"{t}"' for t in tokens) + ']'
        new_lines.append(f"role-tokens: {tokens_str}")
        if final_description:
            new_lines.append(f'role-description: "{final_description}"')

    new_fm = "\n".join(new_lines)
    return text[:fm_start] + new_fm + text[fm_end:], "written"


# ─── Main migration ─────────────────────────────────────────────────────

def migrate(args):
    canonical_ids, alias_to_id, id_to_entry = load_vocab()
    contested = load_contested_cases()

    print(f"Loaded {len(canonical_ids)} canonical role-tokens from vocab")
    print(f"Loaded {len(contested)} contested-case ratifications")

    actions = defaultdict(list)
    rows = []
    all_persons = sorted(PERSONS.glob("*.md"))

    for path in all_persons:
        if path.name in ("README.md", "_TODO.md"):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except Exception:
            actions["read-error"].append(path.name)
            continue
        fm, _, _, _, _ = parse_frontmatter(text)
        if fm is None:
            actions["no-frontmatter"].append(path.name)
            rows.append((path.name, "", "no-frontmatter", "low", "", "", ""))
            continue
        doc_id = fm.get("id", path.stem)

        # 1. Contested-cases ratification (highest priority)
        if doc_id in contested:
            entry = contested[doc_id]
            tokens = entry.get("role-tokens", []) or []
            description = entry.get("role-description", "") or fm.get("role", "")
            polemical = entry.get("polemical-framing", []) or []
            reclaimed = entry.get("reclaimed-self-naming", []) or []
            source = f"contested-ratified ({entry.get('source-tier','T1')})"
            confidence = "high"
            rationale = entry.get("rationale", "")[:100]
        else:
            # 2. Alias-match
            tokens, alias_status = classify_via_aliases(fm, alias_to_id)
            if tokens:
                source = f"alias-match:{alias_status}"
                confidence = "high"
                description = fm.get("role", "")
                polemical = []
                reclaimed = []
                rationale = ""
            else:
                # 3. Heuristic inference
                tokens, h_status = classify_via_heuristic(fm, canonical_ids)
                if tokens:
                    source = f"heuristic:{h_status}"
                    confidence = "medium"
                    description = fm.get("role", "")
                    polemical = []
                    reclaimed = []
                    rationale = ""
                else:
                    # 4. Flag for manual review (per no-silent-guessing rule)
                    source = "needs-manual-review"
                    confidence = "low"
                    description = fm.get("role", "")
                    polemical = []
                    reclaimed = []
                    rationale = ""

        # Verify all tokens are valid
        invalid = [t for t in tokens if t not in canonical_ids]
        if invalid:
            actions["invalid-tokens"].append((doc_id, invalid))
            rows.append((path.name, doc_id, ",".join(tokens), f"INVALID:{','.join(invalid)}",
                        "error", fm.get("tradition","")[:40], rationale))
            continue

        rows.append((str(path.relative_to(VAULT)), doc_id, ",".join(tokens),
                    source, confidence, fm.get("tradition","")[:40], rationale))

        if not tokens:
            actions["needs-manual-review"].append(doc_id)
            continue

        if args.apply:
            new_text, action = apply_role_tokens(
                text, tokens, description, polemical, reclaimed)
            actions[action].append(doc_id)
            if action == "written":
                path.write_text(new_text, encoding="utf-8")
        else:
            actions["dry-run-classified"].append(doc_id)

    # Write TSV
    TSV_OUT.parent.mkdir(parents=True, exist_ok=True)
    with TSV_OUT.open("w") as f:
        f.write("path\tdoc_id\trole_tokens\tsource\tconfidence\ttradition\trationale\n")
        for r in rows:
            f.write("\t".join(r) + "\n")

    print(f"\nTSV: {TSV_OUT.relative_to(VAULT)}")
    print("\n=== ACTION SUMMARY ===")
    for action, items in sorted(actions.items()):
        print(f"  [{action}] {len(items)}")

    # Confidence breakdown
    from collections import Counter
    conf = Counter(r[4] for r in rows)
    print("\n=== CONFIDENCE BREAKDOWN ===")
    for c in ("high", "medium", "low", "error"):
        print(f"  {c}: {conf.get(c, 0)}")

    # Coverage by tier
    tier_counts = Counter()
    for r in rows:
        for tok in r[2].split(","):
            if tok and tok in id_to_entry:
                tier_counts[id_to_entry[tok].get("tier", "?")] += 1
    print("\n=== TIER USAGE ===")
    for t in (1, 2, 3, 4, 5):
        print(f"  Tier {t}: {tier_counts.get(t, 0)} assignments")

    if not args.apply:
        print("\n(dry-run — re-run with --apply after John reviews TSV)")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--revert-from-tsv", metavar="PATH")
    args = ap.parse_args()
    if args.revert_from_tsv:
        print("Revert mode — TODO: not implemented in v1; use git checkout instead.")
        sys.exit(1)
    sys.exit(migrate(args))
