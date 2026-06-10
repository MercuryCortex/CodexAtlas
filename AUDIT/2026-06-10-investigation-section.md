# 2026-06-10 — INVESTIGATION section (consumer findings page)

**Directive (John):** *"all massive wins and STUFF we learn must come to a PAGE section called Investigation: here we list ALL AND EVERY thing that we find worth it (LOOK AT THE OLD PROTOTYPE … BRING BACK (THE IDEA NOT THE OLD NON CANONICAL STYLE, MAKE IT WITH CURRENT TECH)"*

Deliverables on disk (nothing committed, no shared files touched):

| file | role |
|---|---|
| `scripts/build_investigation_index.py` | read-only generator; walks every findings surface, emits the index |
| `src/data/investigation-index.json` | generated — **1,252 findings**, 2.6 MB, valid JSON |
| `src/js/views/investigation.js` | V2 view module (`window._investigationView = { render(pane), unmount() }`, pane class `investigation-pane`) |
| `AUDIT/2026-06-10-investigation-section.md` | this report |

---

## 1. What was harvested (counts per origin)

| origin | source | findings |
|---|---|---|
| `observations` | `src/data/observations.js` (prototype thinking layer) | 41 |
| `patterns` | `src/data/patterns.js` (prototype patterns tab) | 77 |
| `chains` | `src/data/chains.js` (prototype lineages tab; link sequences flattened to annotated timelines) | 26 |
| `massive-wins-index` | `00_meta/MASSIVE-WINS-INDEX.md` (55) + `00_meta/MASSIVE-WINS.md` (31) | 86 |
| `leads` | `00_meta/INVESTIGATION-LEADS.md` §I–IV (numbered entries; §V work-plan bullets and the "PRIORITY INVESTIGATION TARGETS" backlog are deliberately **excluded** — internal work items, not findings) | 37 |
| `essay` | `00_meta/MASSIVE-WIN-essays/*.md` (7 essays; 2-paragraph excerpt + wikilink evidence) | 7 |
| `node` | every `## MASSIVE WIN*` body section across content folders `01_*`–`31_*` (846 files, 980 sections; `00_meta` + `99_ingest` excluded) | 978 |
| | **total (after 2 title-dedups)** | **1,252** |

The three prototype JS data files are parsed with a small recursive-descent JS-literal
parser (handles `'`/`"`/backtick strings, comments, trailing commas) — no `eval`, no node
subprocess, pure python3 stdlib. Re-run any time with
`python3 scripts/build_investigation_index.py` (only writes the one JSON).

**Source resolution:** findings carry `sources: [node-ids]` harvested from `evidence:` /
`sources:` / `links[].node` / `Nodes:` lines / wikilinks. Sampled against `data.js`:
**3,168 / 3,179 slugs resolve (99.7%)** — the view greys out the rest as dashed
non-clickable chips ("not yet in the Atlas").

## 2. Category taxonomy (consumer-facing, = filter chips, in rank order)

| category | meaning | n |
|---|---|---|
| Transmission | an idea/symbol/practice that demonstrably travelled | 182 |
| Convergence | independent arrival at the same structure, no contact | 368 |
| Inversion | symbol kept, meaning flipped | 30 |
| Conclusion | multiple independent confirmations (incl. the 7 essays) | 43 |
| Hypothesis | testable claim the evidence points toward | 7 |
| Anomaly | breaks the expected pattern (incl. time-inversions, structural ironies) | 10 |
| Discovery | manuscript / textual / dating discoveries | 10 |
| Open question | documented but unsolved | 8 |
| Method | how the investigation reads the record (obs `META`, named patterns) | 6 |
| Cross-tradition parallel | node-level documented links (the bulk layer) | 588 |

Curated-source categories map 1:1 from their existing taxonomies (observations
`CONCLUSION/HYPOTHESIS/ANOMALY/META`, patterns `CONVERGENCE/TRANSMISSION/INVERSION/SCIENCE`,
chains categories, the MASSIVE-WINS-INDEX section headings). The 978 node sections are
classified by a conservative keyword heuristic (inversion/transmission/convergence signal
words; ties stay in `Cross-tradition parallel`) so the curated chips don't drown.

**Consumer language enforcement (generator, asserted at build time):** the literal phrase
"MASSIVE WIN" never appears in any title/summary/body (rewritten "key finding" / section
headings stripped); sourcing-tier jargon (`[T1]`, `Tier-1`, `T2/T3`) is rewritten to plain
words ("first-rate", "mainstream", "contested"); internal batch numbering ("Phase-17
essays") dropped; corpus-jargon "the vault …" rewritten on all titles/summaries and
verb-anchored phrases in bodies. `origin` metadata in the JSON keeps full provenance
(`ref` field = source file + section) — the UI renders none of it.

## 3. INTEGRATION INSTRUCTIONS (for the main agent — exact edits)

The module is fully self-contained (fetches its own JSON with `cache: 'no-store'`,
injects its own `<style>`). Three edits wire it in; a fourth is optional.

**(a) `index.html`** — one script tag in the V2 views block, i.e. directly after the
`alphabets.js` tag (currently line ~239), before `src/js/app.js`:

```html
<!-- INVESTIGATION V2 Section (2026-06-10) — the consumer findings page;
     data = src/data/investigation-index.json (module fetches it itself,
     regenerate via scripts/build_investigation_index.py). -->
<script src="src/js/views/investigation.js?v=20260610-investigation-v1"></script>
```

No data `<script>` tag is needed (`.json` cannot set a global). If a preloaded global is
ever wanted, set `window.INVESTIGATION_INDEX` before the view renders — the module
prefers the global and falls back to fetch.

**(b) `src/js/app.js` — VIEWS registration**, copy of the `VIEWS.maps` pattern (place
next to it, currently ~line 1300, or after `VIEWS.alphabets` ~line 1333):

```js
// 2026-06-10 — INVESTIGATION Section: the consumer-facing findings page
// (every documented cross-tradition finding, searchable). Same app-shell
// contract as maps/starmap/alphabets; module owns chrome + data loading.
VIEWS.investigation = {
  title: 'Investigation',
  subtitle: 'what the record shows — every documented finding, with its evidence',
  render() {
    {const _vc = document.getElementById('view-controls'); if (_vc) _vc.innerHTML = ''; }
    if (typeof legend !== 'undefined' && legend) legend.style('display', 'none').html('');
    const canvasEl = document.getElementById('canvas');
    const pane = document.createElement('div');
    pane.className = 'investigation-pane';
    canvasEl.appendChild(pane);
    const svgEl = document.getElementById('svg');
    if (svgEl) svgEl.style.display = 'none';
    if (window._investigationView) window._investigationView.render(pane);
  },
};
```

**(c) `src/js/app.js` — teardown**, in the setView cleanup where `.alphabets-pane` is
handled (~line 538–543): add the symmetric unmount + add `.investigation-pane` to the
removal selector:

```js
  // 2026-06-10 — Investigation pane teardown, symmetric with Alphabets.
  if (window._investigationView && typeof window._investigationView.unmount === 'function') {
    try { window._investigationView.unmount(); } catch (e) { /* ignore */ }
  }
```
…and change the existing line to:
```js
  document.querySelectorAll('.boards-pane, .boards-bottombar, .alphabets-pane, .investigation-pane').forEach(el => el.remove());
```

**(d) optional, `src/styles/app.css`:** the module injects
`<style id="investigation-style">` (it may not edit app.css). The block is plain
`.investigation-*` rules on V2 tokens (`--gold`, `--bg-0/1`, `--text-0..3`, `--mono`,
`--eff-nav-w`/`--eff-detail-w`) — it can be moved into app.css verbatim and the
`injectStyle()` call deleted, or left as-is; both work.

**Nav placement — recommendation (decision is John's):**
- **Recommended: first-class master-pill Section** (the ALPHABETS 2026-06-10 precedent,
  pill 6→7). The directive calls it "a PAGE section"; this page is the consumer payoff
  surface of the whole project (MASSIVE-WINS framing) — burying it under a menu
  undersells it. The view has no class-side API (like maps), so the pill entry is just a
  `setView('investigation')` master click.
- **Alternative: user-menu / app-pill menu entry** — zero pill real-estate cost, fine as
  an interim while pill order is being debated.

## 4. Verification performed

- `python3 scripts/build_investigation_index.py` runs clean (re-runnable, idempotent);
  output is valid JSON, 1,252 findings; build-time assertion proves zero "MASSIVE WIN"
  on any consumer surface.
- `node --check src/js/views/investigation.js` passes.
- Headless smoke test (Node, DOM stubs, the **real** generated JSON through the real
  pipeline): boundary contract present; loading → stage render; meta = "1252 findings ·
  10 categories"; chips render; first chunk = 150 cards + "show more" (chunking 150→300
  verified); chip filter (Transmission → "182 of 1252"), text search ("eucharist" → 5),
  reset, and the selectNode guard (no call for unresolvable ids) all exercised through
  the real event handlers; zero legacy class names; style block injected.
- NOT yet verified in Safari (module is unwired by design; `preview_eval` denied in this
  session). **Post-integration ritual** (per the 2026-05-29 rule — the screenshot is the
  success criterion): `lsof -ti :8742` = ONE `serve-node.js` pid → hard reload →
  master-pill → Investigation → screenshot: header + chips + cards visible; click an
  evidence chip → detail panel opens; expand "full note" on `Abrasax: Gematria…` → table
  renders.
- Environment note: this session found port 8742 hijacked by a stale `scripts/serve.py`
  (python) — killed per the 2026-05-27 server-hijack protocol; `scripts/serve-node.js`
  now serves 8742 (started via `.claude/launch.json` "atlas").

## 5. Backlog (listed, NOT done)

1. **Lane A — vault-wide rename of node-body `## MASSIVE WIN` headings** to consumer
   language (846 files / 980 sections, 20+ heading variants). The generator absorbs the
   variance, so this is cosmetic-for-agents, but the internal phrase still lives in
   content files. Owner decision needed on the replacement heading (e.g. `## Findings —
   cross-tradition edges`); generator regex updates trivially.
2. Residual "the vault" phrasing survives inside ~70 node-section **bodies** where
   rewriting is unsafe without context (sacred-architecture entries use "vault"
   literally — "the vault's load", "barrel vault"; deity entries have "vault of heaven").
   Titles/summaries are fully scrubbed; bodies got verb-anchored rewrites only.
3. `Cross-tradition parallel` (588) is the bulk chip; a future pass could promote the
   best node sections into curated categories by hand-tagging.
4. The two `Hypothesis`-class observations files are static; new findings keep flowing
   in via node sections — re-run the generator on content syncs (candidate for the
   `build_data.py` chain).
