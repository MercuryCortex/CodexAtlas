# HANDOFF — 2026-06-06 · The Completeness Bar + FOLDER-MOVE checklist

**State:** clean tree, all gates green, on `main`, **no git remote** (local-only; John
backs up to a hard drive). John is about to **move the vault folder to a new location** —
§4 is the checklist for doing that safely. Read it before/after the move.

---

## 1. WHAT THIS SESSION BUILT — the COMPLETENESS BAR

Triggered by John's cardinal feedback (see `memory/feedback_completeness_is_investigation_not_catalogue_2026-06-05.md`): the old "product-grade" scorecards grade node QUALITY and are **blind to a MISSING node**, so the deities scored 9/9 while the flagship wire `Genesis-1 "the deep" → Tiamat·Nun·Ginnungagap` was broken (Ginnungagap had no node).

The fix is a **second bar** — `scripts/audit_wire_coverage.py` (read-only; emits `src/data/wire-coverage.json`; surfaced on **DEV → Overview** via `src/js/views/dev-overview.js`). It measures completeness two ways:

1. **NEIGHBORHOOD INTEGRITY** — does every endpoint of a cross-tradition WIRE exist? A missing endpoint = a wire that can't be drawn = the neighborhood is BROKEN (script exits 1). **11 neighborhoods, all WHOLE:** the-deep · chaoskampf (7 traditions) · dying-rising-god · divine-council · the-fates (Norns·Moirai·Ananke) · the-flood (Manu·Utnapishtim·Noah·Deucalion) · underworld-descent · sacred-marriage · the-trickster · the-mother-goddess · the-divine-smith.
2. **PANTHEON ROSTER COVERAGE** — authoritative deity list per tradition, present-vs-missing. **7 traditions rostered:** Mesopotamian / Egyptian / Greek / Canaanite / Norse **100%** · Hindu **95%** (4 gaps: Aryaman, Bhaga, Nirrti, Ardhanarishvara) · Mesoamerican **92%** (4 gaps: Metztli, Patecatl, Yacatecuhtli, Buluc Chabtan).
3. (also) **DEMAND-RANKED GAPS** — referenced-but-missing slugs from linkcheck (julius-caesar 13×, tradition-vaishnavism 10×).

**~62 new deity nodes shipped this session**, every one at 9/9 product-grade (the scorecard never dropped). Headcount: **962 deity nodes**. All five HEADWATER pantheons (the source-ends of the cross-tradition wires) are now 100%.

Flagship MASSIVE-WINS that now draw end-to-end: the-deep · **Isaiah-14 "Lucifer"** (Shahar/Athtar→`[[lucifer]]`) · the **fate-triad** · **creation-by-the-word** (Egyptian Hu-Sia / Memphite → Genesis-1/John-1 Logos) · the **flood-hero** across 4 traditions.

## 2. HOW TO EXTEND THE BAR (the working loop)

Per tradition / neighborhood, the proven loop is:
1. `grep` present nodes for the tradition (`for f in 03_deities/*.md; do grep -m1 "^tradition:" "$f"; done`).
2. Build an authoritative "within-reason" roster; **verify gap candidates are genuinely absent** (the aka-resolver can false-POSITIVE — a deity counted present because another node lists it as an alias; caught Athtar & the Norns).
3. Fill the high-value gaps as **product-grade** nodes (singular `tradition:`, `syncretic-edges:` for cross-tradition reach per the membership-vs-wire rule, T1 refs, body ≥400 chars).
4. Add the roster/neighborhood to the `ROSTERS` / `NEIGHBORHOODS` dicts in `scripts/audit_wire_coverage.py`.
5. Gates: `python3 build_data.py` (exits 1 on DUPLICATE ID — it caught a redundant Nataraja this session) → `python3 linkcheck.py --baseline` (capture the REAL exit code) → `python3 lint_yaml.py` → `python3 scripts/audit_deity_quality.py` (stays 9/9) → `python3 scripts/audit_wire_coverage.py`.
6. Commit **Lane A** (content `03_deities/*`) and **Lane B** (`scripts/` + `src/`) SEPARATELY. Add a STATUS batch entry (pre-commit nudges if you don't).

## 3. RESUME PLAN (next session, after the move)

- **Roster more traditions:** Yoruba / West-African (Africa not yet measured — Olodumare·Eshu·Shango·Ogun·Oshun·Yemoja, rich diaspora wires to Vodou/Santería); then Celtic, Slavic, Shintō, Egyptian-neighbors (Hittite/Hurrian already partly there).
- **More neighborhoods:** world-tree/axis-mundi, solar-journey, the divine twins, the dragon-hoard.
- **Finish the tails:** Hindu's 4 + Mesoamerican's 4 gaps if wanted.
- **Demand list:** julius-caesar (13×), tradition-vaishnavism (10×) are the loudest referenced-but-missing.

## 4. 🚚 FOLDER-MOVE CHECKLIST (do this carefully)

**Good news:** no git remote, so the entire repo lives in this folder. Moving the whole folder with `mv` (or Finder drag) preserves **everything** — `.git` history, untracked files (`data.js`), and gitignored files (`Art Direction/`, `.claude/settings.local.json`).

**Steps:**
1. **Stop the dev server** if running (`lsof -ti :8742 | xargs kill` — it's just `scripts/serve-node.js`).
2. **Move the whole folder** (do NOT git-clone — that would drop untracked/gitignored files). e.g. `mv "~/Desktop/Codex Atlas" "/NEW/PATH/Codex Atlas"`.
3. **`cd` into the new location**, then `git status` (should be clean on `main`) and `git log --oneline -3` (history intact).
4. **Repair the nested git worktrees:** `git worktree repair` — fixes the 7 worktrees under `.claude/worktrees/` whose absolute-path pointers break on move. ⚠️ **Those worktrees hold ORPHANED uncommitted work** (a Giza/pyramids investigation, a Neoplatonism/Alexandria batch, Christian symbols) — see below. Do NOT `rm -rf .claude/worktrees/` without salvaging first.
5. **Update the 2 config files that hardcode the old absolute path** (replace `~/Desktop/Codex Atlas` with the new path):
   - `.claude/settings.json` → `"additionalDirectories"` (Claude Code's permission scope)
   - `.claude/launch.json` → `runtimeArgs` (the preview-server path)
6. **Verify from the new root:** `python3 build_data.py && python3 linkcheck.py --baseline && python3 lint_yaml.py && python3 scripts/audit_wire_coverage.py` — all should pass (core scripts use RELATIVE paths, so they're move-safe). Then `python3 scripts/serve.py 8742` (or the preview tool) and load the site.

**Stale-path notes (informational, mostly harmless):** `MEMORY.md` and several `00_meta/*.md` docs mention the old `~/Desktop/Codex Atlas` path in prose; `99_ingest/audit_dead*.txt` contains old absolute paths but is regenerated by linkcheck. None of these break tooling.

### ⚠️ Orphaned uncommitted work in the 7 stale worktrees (salvage candidate)
Past Claude sessions left **untracked, never-merged** content in `.claude/worktrees/*/`. Highlights worth reviewing/merging into `main` someday:
- `objective-aryabhata-02d7a2`: **Giza/pyramids investigation** — flinders-petrie, howard-vyse, khufu, khafre, thutmose-iv, robert-bauval, robert-schoch, sphinx-of-giza, multiple pyramids, orion-correlation-theory, hall-of-records-hypothesis, pyramid-as-resurrection-machine, sacred-geometry-giza (~22 nodes).
- `elated-bell-8e8f1a`: **Neoplatonism/Alexandria** — ammonius-saccas, pseudo-dionysius, ma-at-logos-sophia, neoplatonic-henosis, axis-mundi, cosmic-egg, tetramorph, school-of-alexandria (~11 nodes).
- `peaceful-kare-9e705c`: **Christian symbols** — alpha-omega, dove, fleur-de-lis, hamsa-khamsa, sacred-heart, sefirot-tree-of-life (~7 nodes).
- (4 more worktrees with 1–2 files each.)
These are physical files; they survive the `mv`. To salvage: copy the wanted `.md` files into the main tree, run the gates, and commit. To discard: just delete the worktree dirs after the move.

## 5. ONE-LINE SITUATION
The completeness bar exists, is green (11 neighborhoods + 7 rosters), and surfaced on the DEV panel; the headwaters are 100% and the flagship cross-tradition wires all draw. Everything committed, tree clean, ready to move. After moving: `git worktree repair` + fix the 2 `.claude` paths + re-run gates, and resume with the Yoruba roster.
