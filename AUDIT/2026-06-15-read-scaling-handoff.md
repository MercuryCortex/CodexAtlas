# HANDOFF — Codex Atlas, 2026-06-15 (READ-scaling in flight)

**Self-contained. A fresh agent runs this cold.** Read this + the cardinal memories +
`AUDIT/2026-06-14-ingestion-master-plan.md` first. Tree is clean at handoff.

## TL;DR — the immediate next action
Keep scaling the **reader** (the user-facing READ surface) with the `atlas-read-stage`
workflow. Next cluster = **dying-and-rising gods**. Run **SMALL batches (3 texts, not 6 —
6 trips a transient Anthropic rate-limit)**. Recipe + exact command below.

## Where the project is (verified 2026-06-15)
- nodes **5,482** · edges **26,112** · dead-link floor **339** (baseline `AUDIT/dead-link-baseline.txt`, holds) · lint **0** errors
- READ **215 / 621** texts staged (~35%; target 80%)
- 17 session commits `c5b80387..914b841c`. All gated (build 0 · linkcheck no-regression · lint 0 · `node --check` for READ).

## The two automation workflows (this session's main deliverable — REUSE them)
Both live in `.claude/workflows/`. In both: **agents draft + self-verify; the MAIN THREAD is
the sole writer + gate** (agents are read-only — never let them write the tree).
1. **`atlas-ingest-cluster`** — node ingestion (Author → adversarial-Skeptic). `args` = array of
   node records `{slug,type,tradition,region,hubs,demand,note}`. Returns drafts + skeptic verdicts.
2. **`atlas-read-stage`** — READ staging (Draft → Factcheck). `args` = array of target texts
   `{ref,title,cluster,note}`. The skeptic **web-verifies every source, checks the scripture text
   byte-for-byte vs public-domain, and confirms every node-slug/textId exists.** Returns validated
   reader-entry JSON + verdicts.

## READ-staging recipe (run the next batch end-to-end)
1. **Launch** (batch of 3). Example dying-rising starter:
   ```
   Workflow({ scriptPath: ".claude/workflows/atlas-read-stage.js", args: [
     {ref:"Ezekiel 8:14", title:"Ezekiel 8:14 (women weeping for Tammuz)", cluster:"dying-rising-god",
      note:"the Hebrew prophet condemns the Tammuz mourning-rite; surface tammuz/dumuzi-the-shepherd + the dying-rising-god theme. Parallels: Descent of Inanna (staged 'descent-inanna'), Osiris, Adonis. Sources: Mettinger The Riddle of Resurrection 2001."},
     {ref:"Homeric Hymn to Demeter 1-50 + 398-403", title:"Homeric Hymn to Demeter (Persephone's descent and return)", cluster:"dying-rising-god / katabasis",
      note:"Persephone seized to the underworld, returns for part of each year = the seasonal dying-rising pattern + the Eleusinian mysteries. surface persephone-greek, demeter, the katabasis-and-anabasis theme. Parallels: Inanna/Dumuzi (staged 'descent-inanna'), Osiris. Sources: Burkert Greek Religion 1985; Mettinger 2001. docNode: grep 02_documents for a homeric-hymns / demeter doc."},
     {ref:"Hosea 6:1-3", title:"Hosea 6:1-3 (after two days he will revive us; the third day)", cluster:"dying-rising-god",
      note:"'after two days will he revive us: in the third day he will raise us up' — the Hebrew revival-on-the-third-day motif read against the dying-rising pattern + later resurrection theology. surface yahweh, resurrection/dying-rising-god. Sources: Day 2000; Mettinger 2001."}
   ]})
   ```
   (The agent finds docNode/tradId itself by grep; you verify after.)
2. **Parse + verify (MAIN THREAD — the gate).** From the task `.output` file, `json.load(...)["result"]["entries"]`.
   - Ship ONLY entries with `verdict.verdict === 'pass'`. Drop `reject` (e.g. paraphrased text). For `revise`, apply the flagged fixes.
   - **Grep-verify yourself** (don't trust the agent): every `entity.node`, every `docNode`, every `tradId`
     (`find 03_deities 04_persons 06_themes 09_symbols 02_documents 07_traditions 26_calendars ... -iname "<slug>.md"`), and that every parallel `textId` is already staged (`grep "SCRIPTURE_TEXTS\['<id>'\]" src/data/scripture-texts.js`). Demote/drop any that fail.
3. **Serialize JSON → JS + append** (this exact python, used 2026-06-15 — JSON is valid JS object-literal so the reader reads it fine; it adds `translations` + per-verse `textVersions` to match the working model):
   ```python
   import json
   entries=json.load(open("/tmp/read-entries.json"))   # the passing, verified entries
   READER=['id','title','shortTitle','corpus','tradId','date','docNode','language','translations','intro','crossTradition','sections']
   with open("src/data/scripture-texts.js","a",encoding='utf-8') as f:
     for e in entries:
       o={k:e.get(k) for k in READER}
       o['shortTitle']=o.get('shortTitle') or e['id']
       o['translations']=o.get('translations') or [{'id':'kjv','label':'KJV (1611)','note':'King James Version — public domain'}]
       tid=o['translations'][0]['id']
       o['sections']=[{'heading':s['heading'],'verses':[{'ref':v['ref'],'text':v['text'],'textVersions':v.get('textVersions') or {tid:v['text']},'entities':v['entities']} for v in s['verses']]} for s in e['sections']]
       f.write(f"\n// -- {o['title']} --\nSCRIPTURE_TEXTS['{o['id']}'] = "+json.dumps(o,ensure_ascii=False,indent=2)+";\n")
   ```
4. **Gate:** `node --check src/data/scripture-texts.js` (must pass). Bump the cache token:
   `sed -i '' "s|scripture-texts\.js?v=[^\"]*|scripture-texts.js?v=$(date +%Y%m%d-%H%M%S)|" index.html`.
5. **Verify in-browser + send John a screenshot** (he checks by sample, NOT per-note — see style):
   `preview_start("atlas")` → wait ~4s → `window._forge.openReader('<id>')` → expand the
   `CROSS-TRADITION PARALLELS` panel → `preview_screenshot`. (Server is port 8742; if a python
   `serve.py` holds the port, `lsof -ti tcp:8742 | xargs kill` then `preview_start`.)
6. **Commit Lane B** (separate from content — see lanes): `src/data/scripture-texts.js` + `index.html`
   (+ STATUS). The pre-commit hook **hard-refuses** mixing Lane A (content `*.md`) with Lane B
   (`src/js/*`, `src/data/*`). 00_meta is neutral. One STATUS entry per batch.

## Rigor firewall (non-negotiable — why the product is trustworthy)
- **GREP-VERIFY every agent claim.** This session the skeptics produced ~14 fabricated citations + caught
  ~6 duplicate nodes + 1 paraphrased scripture text — all before shipping. Never ship an agent draft unchecked.
- READ: scripture text must be **exact public-domain** (the fact-checker rejects paraphrase). Every annotation
  `word` must be an exact substring of its verse `text`.
- **John, 2026-06-15:** *"as long real sourced lets go ! and we can have several claims as long they are sourced."*
  → MULTIPLE sourced cross-tradition claims per term are wanted; each must name a real scholar/work.
- Gates every batch, real exit codes, never `--no-verify`.

## Open decisions for John (do NOT resolve unilaterally — §6 checkpoints)
1. `moral-rta-cosmic-order` ↔ a `theme/rta` lens (consolidate or keep). Defaulted to no-duplicate.
2. `matthew-apostle`/`matthew-evangelist` + `mark-evangelist`/`john-mark` — traditional-identity vs critical
   distinction. Recommended KEEP SEPARATE; held.

## Loose ends (safe to do)
- Re-stage the 3 creation texts the rate-limit zeroed: **Ovid Met. I**, **Hesiod Theogony 116-210**,
  **Rig Veda 10.121 (Hiranyagarbha)** — and a corrected **Enuma Elish VI** (use the verbatim L.W. King 1902
  text, not a paraphrase; that's why it was rejected). Same `atlas-read-stage` recipe.
- 7 stale `.claude/worktrees/` vault-copies (gitignored) — prune when no fleet is using them.
- READ is ~35%; keep feeding clusters (dying-rising → flood → cosmogony → logos/wisdom → apocalyptic).

## John's working style (match it)
- **Plain human talk.** He bounced me for jargon. Lead with the substance in plain words; keep the technical
  detail in STATUS/commits, not the chat.
- **He checks by SAMPLE, not per-note** — send a reader screenshot each batch; he eyeballs the vibe. The
  machine + the visible sources are the per-item guarantee.
- **Design is DEFERRED.** He finds the current tabs/navigation confusing and KNOWS it; content is stored as
  data independent of the UI, so a future navigation redesign won't touch it. Do not rabbit-hole on UI now.

## Key reads
`00_meta/STATUS.md` (top ~12 entries = this session) · `00_meta/HOW-WE-WORK.md` §5 · `00_meta/LANES.md` ·
`AUDIT/2026-06-14-ingestion-master-plan.md`. Memories: `project_ingestion_master_plan_2026-06-14` (has the
flywheel + the thin-lens + id≠filename lessons), `feedback_membership_vs_wire_crisis_2026-06-02`,
`feedback_completeness_is_investigation_not_catalogue_2026-06-05`. Model reader entries:
`isaiah-51` / `enuma-elish-4` / `psalm-104` in `src/data/scripture-texts.js`. Model nodes: `03_deities/tehom.md`.
