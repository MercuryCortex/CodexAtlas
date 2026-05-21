# Codex Atlas — App & Infrastructure Audit (2026-05-14, second pass)

A complementary audit to `00_AUDIT_OVERVIEW.md` (which is a content / scholarship audit). This one is engineering, UX, infrastructure, and knowledge-representation. **Posture:** John's brief was "investigation tool." This audit asks where the *tool* itself is undercooked, and what would happen if a stranger landed on the project tomorrow and tried to use it.

Method: walked the file tree (`AUDIT/`, `00_meta/`, `_assets/`, `99_ingest/`, the four app files) and the live state (3620-line `app.js`, 1326-line CSS, 2MB+ `data.js`, ~1640 nodes / ~9000 edges as of this session). Cross-checked claims in `00_meta/STATUS.md` against actual files. Tested specific feature absences (URL routing, responsive layout, PWA, git history). Read `04_methodology_proposals.md` to avoid duplicating proposals already on the table.

Findings are claims, not commands. Not every gap should be filled — some are deliberate scope decisions that just deserve to be made *consciously*.

## Headline verdict

The investigation work is genuinely strong (the content audit covers that). The **scaffolding around it is fragile**: there is no version control, no CI, no automated quality gate, no public-facing deployment surface, and no URL routing — meaning the atlas is excellent at being viewed by its author and unusably opaque to anyone John might want to share it with. Five high-value extension proposals already exist in `04_methodology_proposals.md` (material-witness layer, geographic map, scholar role-class, new edge types, scholar-lineage modelling) and **none have been picked up by the agent batches** because the work queue agents read is the auto-generated `DASHBOARD.md`, not the AUDIT folder. That's a coordination-gap that compounds.

The single most consequential thing missing is **a git repository**. Everything else is a feature; git is the safety net under everything else.

---

## 1. Infrastructure / safety net

### 1.1 No version control (CRITICAL)
The vault root has no `.git` directory. A multi-agent project with ~1640 markdown nodes, generated `data.js`, and hand-edited coordination files (`ACTIVE-AGENTS.md`, `STATUS.md`, `canonical-slugs.md`) is operating without history, blame, branching, or rollback. A single bad agent batch — or a `rm` typo — destroys irrecoverable work.

**Concrete first step.** `git init`, `.gitignore` (`_assets/thumbs_cache.json`, `data.js` since regeneratable, screenshot-noise in `_assets/`), commit current state, push to a private GitHub remote. Subsequent agent batches each commit at the end. Auto-coordination files become diff-able.

### 1.2 No CI / no automated quality gate
No `.github/`, no `Makefile`, no test runner. `linkcheck.py` and `build_dashboard.py` are run manually after batches; nothing forces them. The 4.4% dead-link occurrence ratio is treated as informational rather than as a failing build.

**Concrete first step.** A single pre-commit hook (or GitHub Action) that runs: (a) YAML frontmatter validation against the `schema-*.md` files, (b) `python3 build_dashboard.py` to detect new dead-links / orphans / quality-issues, (c) `node --check src/js/app.js`, (d) ASSERT no dead-link occurrence-ratio regression beyond the previous commit. Fail the commit on regression.

### 1.3 No automated YAML / wikilink linter
The schemas are documented in markdown (`schema-deity.md` etc.) but not enforced. Slug drift is the single largest source of dead links; `04_methodology_proposals.md` proposes a registry; the registry exists; nothing checks against it at write time.

**Concrete first step.** `lint_yaml.py` that walks each phase folder, parses each YAML frontmatter, and ASSERTS each value against schema. For `parallels`, `influenced-by`, `influences`, `themes`, `key-figures`, `deities-mentioned`, `events-context` — verify each ``wikilink`` resolves to either a real slug or to a known canonical-slugs alias.

### 1.4 Multi-agent coordination is hand-edited and unverified
`ACTIVE-AGENTS.md` is a markdown file any process can claim any handle in. The "lock" is social, not technical. Detection of collision is post-facto via the harness's "File has been modified since read" warning. There is no agent identity verification (any agent can claim `opus-templar-1`'s edits), no audit log of who-touched-what, no automatic "claim expired after 24h" reaping.

**Mitigation, not full fix.** Add an `AGENT-LOG.jsonl` append-only log that each agent batch writes one line to at start and one at end (handle, scope, timestamp, files-touched count). Cheap, programmatic, and lets you detect runaway / abandoned batches.

### 1.5 No backup / disaster-recovery
With no git, no remote, no rsync mention anywhere, the entire project is one disk failure away from losing six months of work. The `_assets/` folder has dozens of screenshots that document the visual evolution of the app — those are also irreplaceable.

---

## 2. App / engineering

### 2.1 No URL routing — deep-linking impossible
Clicking through nodes never changes `window.location`. There is no `history.pushState`, no `popstate` handler, no hash-based router. **You cannot share a link to a node, a view, or a filter combination.** This single gap blocks every other "share with collaborators" use case.

**Concrete first step.** Hash-based router: `#/pantheon`, `#/timeline`, `#/scripture/hermetica`, `#/node/yaldabaoth`. ~50 lines. Make the back/forward buttons work.

### 2.2 No responsive layout / no mobile
Zero `@media` queries in `app.css`, zero `matchMedia` calls in `app.js`. The atlas is a desktop-only experience. For a tool John might want to demo on a phone or share to a tablet-using friend, this is a hard wall.

### 2.3 No PWA / no offline mode
No manifest.json, no service worker. The app is a single-page web app that requires loading `data.js` (2MB+) on every visit. A trivial service worker would make it installable, offline-capable, and instant on subsequent loads.

### 2.4 The 5000-node scaling cliff is approaching
`STATUS.md` flags the data-layer split (Phase B) as deferred until ~5000 nodes. We are at ~1640 and growing fast (the multi-agent batches added 270+ nodes in this single session). At current pace, the cliff arrives in 4-6 more sessions of comparable activity. The proposed split (`data/index.json` + per-node `data/nodes/<id>.json`) is the right design but needs a small dev server (`python3 -m http.server`) to dodge Chrome's strict `file://` mode — that should be in the README before users hit the wall, not after.

### 2.5 No bundler / no ES-modules / single-file 3620-line app.js
The Phase A refactor split the 2300-line monolith into HTML + CSS + JS, but JS is still one 3620-line file. With ten VIEWS and the SCRIPTURE_CORPORA registry growing (now 6 wired corpora, more incoming), this will hit human-readability limits. `04_methodology_proposals.md` doesn't address this — it's a different problem from the data layer.

**Concrete first step.** Vite + ES modules. Each `VIEWS.*` becomes its own file. `SCRIPTURE_CORPORA` becomes a `corpora/` folder with one config-file per corpus.

### 2.6 No tests — none
Zero unit tests, zero integration tests. The Scripture-view smoke-test I ran in this session was an ad-hoc node-eval; nothing in the project reruns it on changes. The id-form alias-shim (`scriptureResolveBookId`), the layout math, the edge-type binding logic — all of it is under-protected against silent regression.

---

## 3. Distribution / public-facing

### 3.1 No license file at root
No `LICENSE`, `LICENSE.md`, or copyright notice visible. Every Tier-1 source quoted at length in node bodies (Mead public domain is fine; Copenhaver, Festugière, Mahé, Fowden — copyrighted) sits in a legal gray zone of unattributed long-quotation. For private use this is fine; for any sharing it is the first thing to fix.

### 3.2 No public deployment
The README says `open index.html`; nothing about hosting. There is no `deploy.sh`, no Vercel/Netlify config, no GitHub Pages workflow. The atlas — visually striking, scholarly substantive — is reaching exactly one user.

**Concrete first step.** Static-site deploy to GitHub Pages or Cloudflare Pages. With the data layer split done, this is ~30 minutes of work. `STATUS.md` already lists "License + domain + hosting" as a future move; surface it.

### 3.3 No embedding model / no API
No way to embed a single node, a single view, or a graph slice in another page. No JSON endpoint of `data.js` for outside consumers.

### 3.4 No print / no PDF / no Markdown export
A user reading a long node like CH XIII rebirth (with primary text excerpts, scholarly context, connections, refs) cannot export it. No CSS print stylesheet. No "download as PDF" button. No "copy as BibTeX" for the references.

---

## 4. Knowledge-representation gaps

### 4.1 No `09_material/` layer (already proposed in `04_methodology_proposals.md`)
The audit has already proposed material witnesses (Mesha Stele, Cyrus Cylinder, Behistun, Pyrgi Tablets, etc.) as a first-class node type. **Has not been picked up by any agent batch in this session.** That's an observation about the work-queue routing, not the proposal.

### 4.2 No geographic / map view (already proposed)
Same. `04_methodology_proposals.md` proposes a Map view; `locations.md` already has 149 lines of region → lat/lon entries; the `opus-ethiopian-1` finish-block notes adding 22 Aksumite coordinates "for the atlas map." But there is **no Map view in `VIEWS`**. The data is half-built; the rendering surface is missing.

### 4.3 Image integration is shallow
`fetch_thumbnails.py` pulls Wikipedia thumbnails per node title and caches them; the detail-panel apparently uses these. But **only one node has explicit `image:` or `thumbnail:` YAML** — meaning for nodes about specific manuscripts (Garima Gospels, Codex Sinaiticus, Voynich Manuscript, the Mesha Stele) the user cannot see the actual object the node describes. The Wikipedia auto-fetch is a generic-illustration crutch where curated imagery would be vastly more powerful.

### 4.4 No original-language script display
The vault correctly notes Greek / Coptic / Hebrew / Arabic / Aramaic / Ge'ez / Sanskrit / Pali / Tibetan / Sumerian-cuneiform sources in YAML. **Zero nodes display any non-Latin-script characters in the body**, even where the original would be one line and decisive (the Tetragrammaton יהוה in the Yahweh node; the Greek λόγος in the Logos theme; the Sanskrit मायā or अद्वैत; the Ge'ez ሕይወት).

### 4.5 No audio / no multimedia for oral traditions
Yared composed Ethiopian liturgical chant *zema*; the Vedas were oral for ~2000 years before being written; the Indigenous Australian *Dreaming* is sung; Ifa divination is recited. All of these are *audible* phenomena treated in the vault as silent text. No SoundCloud / Wikimedia Commons audio embed, no field-recording links.

### 4.6 No sacred-sites layer
Mecca, Jerusalem, Varanasi, Bodh Gaya, Aksum, Lalibela, Delphi, Eleusis, Ise, Mount Athos, Compostela — all mentioned in prose across many nodes, none of them are first-class nodes. They function the way deities and persons do (mentioned, attested, oriented around) but lack their own data structure. A `10_sites/` folder analogous to the proposed `09_material/` would be high-leverage.

### 4.7 No comparative-table or trail-export feature
A reader who wants to compare "the Christian Trinity vs. the Hindu Trimurti vs. the Sethian Father-Mother-Son" cannot generate a side-by-side table from the existing YAML. A reader who has spent an hour clicking through Hermes-Trismegistus → CH XIII → John 3:3 → Pauline regeneration → Lactantius → Ficino has assembled a research trail; there is no "save as essay" or "export as bibliography" path.

### 4.8 No reading-list / no progress tracking
No way to mark a node read, want-to-read, or annotated-personally. For an investigation tool this is a real omission — the user (John) is the principal investigator and has no scratch-pad.

---

## 5. Content blind-spots that the existing audit understates

The 02_coverage_gaps_by_tradition.md audit is comprehensive on textual/canonical gaps. These are categorical-axis gaps it doesn't fully address:

### 5.1 Atheism / secularism / non-belief as a tradition
There is `event-rise-of-nones-2007-present` and `event-new-atheism-2004-2010` but **no `tradition-secular-humanism` or `tradition-atheism`**. For a project framed as cross-tradition investigation, omitting the largest religious-demographic shift of the contemporary West (the rise of "no religion") as a *tradition* is a structural blind spot. Equivalents exist already: Marxist atheism (~Soviet-state atheism), French laïcité, North-American Humanist Manifestos, the British Humanist Association, secular Buddhism. As nodes: Bertrand Russell, John Dewey, Richard Dawkins, Daniel Dennett, Sam Harris, Christopher Hitchens — only Dawkins is referenced (in the new-atheism event); none are person-nodes.

### 5.2 Cognitive science of religion as its own field
Mentioned briefly in the existing audit. Pascal Boyer (*Religion Explained* 2001), Stewart Guthrie (*Faces in the Clouds* 1993), Justin Barrett (HADD-hypothesis), Scott Atran (*In Gods We Trust* 2002), Robin Dunbar — none are person-nodes, no `tradition-cognitive-science-of-religion`. CSR is the principal 21st-century academic-naturalistic-explanatory program and would transform the cross-tradition graph by adding a *meta-explanatory* layer.

### 5.3 Women's religious leadership beyond the canonical handful
The vault has done well on Christian mystic women (post-`opus-mystical-1`: Marguerite Porete, Julian, Teresa, John of the Cross, Mechthild, Hadewijch). It is thinner on: female Sufi saints beyond Rabia, female yoginis (Andal exists; many others don't), female Buddhist teachers (Mahaprajapati, Khema, Yeshe Tsogyal, Machig Labdron), female 19th-c. spiritual founders beyond Blavatsky/Eddy/Besant (Aimee Semple McPherson, Ellen White), women deities of African/African-diasporic traditions in depth (Yemoja and Oshun exist as stubs but are flagged in `quality-issues` for low ref count).

### 5.4 Folk / lived / popular religion
The vault is a textual-canonical atlas. **Folk religion — possession cults, popular saints, charm magic, folk healing, household religion, popular pilgrimage practice — is structurally absent** (one obvious exception: the Bes node which `opus-hellenic-1` correctly framed as Egyptian household religion). Theravada Buddhism in the vault is monastic-canonical; popular Theravada (spirit-cults, *nat* worship in Burma, *phi* in Thailand) is not represented. Catholicism in the vault is conciliar; popular Catholic devotion (the rosary, the scapular, Marian apparitions beyond Guadalupe, the Sacred Heart, the saints) is thin. This matters because most people in most traditions practice the popular form, not the textual one.

### 5.5 LGBTQ+ figures and theological developments
Very thin. The Stoic and Pauline contexts of same-sex relations, the Christian-Roman shift documented by John Boswell, the modern conservative/liberal Christianity split, queer theology (Marcella Althaus-Reid, Patrick Cheng), the LDS / Bahá'í / Islamic / Hindu denominational debates — almost none of this is represented.

### 5.6 Pentecostalism / global Christianity
Mentioned as a gap in the existing audit. The fastest-growing Christian movement of the 20th-21st centuries (~600M+ adherents, mostly in Global South) has zero tradition node, zero person nodes for William Seymour / Charles Parham / Aimee Semple McPherson / David Yonggi Cho, no Azusa Street event, no World Christianity authors (Lamin Sanneh, Andrew Walls, Philip Jenkins). For a project that wants to be cross-tradition, omitting the largest Christian growth-axis of the contemporary world is structural.

### 5.7 Material-religion / sacred objects beyond inscriptions
Relics, icons, statues, masks, costumes, altars, talismans, amulets, ritual objects — these are religion-as-handled-and-worn. The Bes-as-Pataikos-amulet edge `opus-hellenic-1` added is the only place the vault really treats this. The Black Stone of the Kaaba, the Pala d'Oro, the Tibetan thangka, the Yoruba Ifa divining-tray, the Christian rosary itself — no nodes.

---

## 6. Coordination meta-finding (process-side)

The auto-generated `DASHBOARD.md` is the work queue agents pick from. It surfaces **dead-link counts and unstubbed wikilink targets** ranked by reference count. It **does NOT surface**:
- The `AUDIT/` folder's standing proposals (5 large-scale extensions waiting for implementers).
- The `themes-to-create.md` list.
- The `themes-audit.md` findings.
- The `quality-issues.md` 109-issue backlog.
- The `orphan-nodes.md` 4 orphans.

Result: agents repeatedly stub the same kind of work (more deity nodes, more person nodes, more document nodes) because that is what the dashboard surfaces, while the architectural and methodological proposals sit in their AUDIT files unread. This session's seven-batch flurry added **257+ new nodes but zero new edge types, zero material nodes, zero map view, zero scholar role-class**. Not because the proposals are wrong — because the work-queue routing is biased toward node-stubbing.

**Concrete first step.** `build_dashboard.py` should additionally surface:
- "Open AUDIT proposals (last touched: ...)" — top section.
- "Quality issues > N old" — escalation track.
- "Orphans aging > 30 days" — cleanup track.
The dashboard becomes a five-track work queue (stubs / quality / orphans / audits / cleanup), not just a stub queue.

---

## 7. Top 10 highest-leverage things to fix (in order)

If only 10 things get done from this audit:

1. **`git init` + remote.** Everything else is built on this. (1 hour.)
2. **Hash-based URL router.** Unblocks every "share with someone" use case. (~50 lines.)
3. **`.github/workflows/check.yml`** — runs `build_dashboard.py` + `node --check` + a YAML lint + dead-link-regression check. Fail on regression. (1 day.)
4. **YAML lint script** (`lint_yaml.py`) — schema enforcement + canonical-slug check. Run it in CI. (1 day.)
5. **Public deployment** — GitHub Pages or Cloudflare Pages, with the data-layer-split (Phase B from STATUS.md) done first. (1 day after Phase B.)
6. **Map view** — already-proposed; `locations.md` is half the work; ~200 lines of D3 + a Leaflet call. (~1 day.)
7. **`09_material/` layer for inscriptions** — already-proposed; the Mesha Stele alone unlocks a half-dozen edges in the Yahweh / Kemosh / DtrH triangle. (~1 day per ~20 inscriptions.)
8. **DASHBOARD surfaces AUDIT proposals.** Stops the proposal-rot cycle. (~50 lines in `build_dashboard.py`.)
9. **`tradition-secular-humanism` + `tradition-cognitive-science-of-religion` + ~20 person nodes for each.** Unblocks the largest categorical blind-spot in cross-tradition coverage. (~1 day per tradition.)
10. **CSS print stylesheet + "copy as BibTeX" button on the detail panel.** Tiny work, large signal that the project respects its readers' workflow.

If even 5 of these land the atlas crosses from "remarkable private investigation tool" to "substantively shareable scholarly resource."

---

## Closing

The project is doing investigation-grade work at investigation-grade depth. The infrastructure underneath it has the seams of a private-vault prototype rather than a tool ready to leave the laptop. None of these gaps are conceptually hard; they are mostly someone-needs-to-do-it gaps. The single highest-impact action from any one of them is `git init` — every other recommendation is conditional on that.

The strongest pattern in this session's seven-batch flurry: agents are very good at *adding nodes*, less good at *adding apparatus*. The work queue (DASHBOARD) reflects what's easy to count (unstubbed wikilink targets), not what's hardest to fix (architectural extensions). Surfacing the AUDIT proposals on the dashboard is the simplest single change that would unstick the architectural backlog.
