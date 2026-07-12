# STATUS AUDIT + MODERNITY-INGESTION PATH + BOARDS DESIGN PROPOSALS — 2026-07-12

> AUDIT-only batch (no lane slot). Every number below was grep/script-verified in the main
> thread this session (rigor rule: no agent claim shipped unchecked). Two agent claims were
> **corrected** during verification — noted inline.

---

## 1. State of the vault (verified 2026-07-12)

- **5,363 nodes · 26,829 edges · lint 0 · dead-link floor 338** (matches HANDOFF-2026-07-08; tree clean at `2eb4050d`).
- Dead-link demand is a **flat long tail** — top unresolved targets have ≤3 inbound refs. Demand-ranked stubbing is exhausted; leverage now = investigation value, exactly as the ingestion master plan predicted.
- Lens distribution unchanged: 6 fat spines (persons 1,225 · deities 1,013 · documents 630 · themes 520 · traditions 332 · events 326), mid-tier ~110–130, then the ~18 thin lenses (≤58 each).

### 1a. 🔴 FINDING — the READ headline metric conflates two units

The tracked "READ 384/621 (~62%)" divides **texts staged** (384 reader entries) by **document
nodes** (622). Those are different units. Verified directly:

- 384 reader entries reference only **235 distinct docNodes**, of which **229 match a real
  `02_documents/` id** → true doc-coverage is **229/622 = 37%**, not 62%.
- The ratified target "80% (~497)" is a *doc-coverage* target → the real remaining work is
  **+268 docs**, not "+113 texts ≈ 38 batches". At the observed ~1.7 texts/doc ratio the texts
  number will hit "497" long before coverage hits 80%.
- This is the LOOP-DETECTION Pattern-A smell (two measures, no mechanical link). **Fix the
  metric at the source:** make `audit_scripture_coverage.py` print one headline —
  `docs-covered / 622` — and report texts-staged as a secondary stat; STATUS entries quote that.

### 1b. 🔴 FINDING — 6 broken reader→graph bridges in `scripture-texts.js`

`docNode` is the graph↔reader bridge; 6 entries mis-point (verified against all 31 node dirs):

| Reader docNode (wrong) | Correct target |
|---|---|
| `phase-1-024-shijing` (dead) | `phase-2-032-shijing-book-of-songs` |
| `phase-1-025-shujing` (dead) | `phase-2-033-shujing-book-of-documents` |
| `phase-5-054-rumi-masnavi` (dead) | `phase-5-025-rumi-masnavi` |
| `amos-prophet` (person node) | `document-amos` |
| `hosea-prophet` (person node) | `document-hosea` |
| `jeremiah` (person node) | `document-jeremiah` |

Small Lane-B fix (edit `src/data/scripture-texts.js`, `node --check`, bump `?v=`). The first
two came out of READ batch 30; a docNode-must-be-an-existing-document check belongs in the
per-batch gate (and in `audit_scripture_coverage.py`).

### 1c. Era census — the graph is ancient-heavy and the present-day terminus is unbuilt

Origin-dated nodes (3,968 dated of ~5,388 parsed; placed by earliest date):

| Era | Nodes | % of dated |
|---|---:|---:|
| pre-1000 BCE | 725 | 18.3% |
| 1000 BCE – 0 | 1,117 | 28.2% |
| 0 – 500 CE | 638 | 16.1% |
| 500 – 1500 | 915 | 23.1% |
| 1500 – 1800 | 236 | 5.9% |
| 1800 – 1900 | 139 | 3.5% |
| 1900 – 2000 | 190 | 4.8% |
| **2000+** | **8** | **0.2%** |

**86% of dated nodes originate before 1500.** Of the 573 modern (≥1500) nodes: 393 `metadata`,
117 `stub`, only **37 `full`**; **444/573 carry zero transmission-bucket edges**; 28% are
orphans/near-orphans (deg ≤1). The modern layer is node-present but wire-dead — the same
node-rich/wire-poor disease the master plan diagnosed, concentrated in exactly the centuries
the reach-to-today axis (benchmark §11) requires.

### 1d. What already works — the esoteric document spine

The Egyptian→Hermetic→Renaissance→occult-revival chain is among the best-wired material in
the vault (live `data.js` degrees): `hermes-trismegistus` 91 · Corpus Hermeticum I 81 ·
Agrippa 51 · Ficino Pimander 47 · Paracelsus 46 · Rosicrucian Manifestos 37 · Secret
Doctrine 25 · `carl-gustav-jung` 25 · `prisca-theologia` 53 holding it together. The spine is
real; it's the *person/tradition relays and termini* that are missing or thin.

### 1e. Verified keystone gaps (grep-confirmed absent across all 31 dirs)

**Truly absent:** Golden Dawn (any node) · Mathers · Waite · Papus · Mesmer/mesmerism ·
Alan Watts · Timothy Leary · Robert Graves · Manly P. Hall · `monomyth` (no theme node) ·
any pop-culture reception node (no Star Wars, no film/comics/fantasy reception — the "→ pop
culture" terminus of every chain is 0 nodes).

**Present but starved (live data.js degree):** `sigmund-freud` 2 · `joseph-campbell` 5 ·
`tradition-spiritualism` ~0 · `tarot` ~0 · `eliphas-levi` 2 · `aldous-huxley` stub ·
`tradition-thelema` 2 · `tradition-wicca-modern-pagan` 5 · `tradition-freemasonry` 8
(incoming-only) · `marija-gimbutas` 1 · `james-hillman` 0 · Reformation doctrine stubs deg0.

**Agent-claim corrections (grep-verify caught both):** `tradition-pentecostalism` **EXISTS**
(metadata, deg7, Parham + Seymour person nodes exist — thin, not missing, despite
INVESTIGATION-LEADS §V still listing it as a gap); `galileo-galilei` is **deg10**, not an orphan.

---

## 2. THE INGESTION PATH — "transmissions to modernity, fast and smart, expands naturally"

### The thesis: keystone-relay ingestion

Don't ingest modernity breadth-first (573 thin nodes to fix, decades of material). The modern
layer has a **funnel topology**: documented transmission from ~all ancient branches passes
through a handful of convergence institutions/figures (Ficino already proves the pattern —
one translator lights up a whole millennium). Each missing keystone is a single node whose
creation **simultaneously extends dozens of existing high-degree chains to the present**.
That is the "expands naturally" property: build the funnel node, and every branch upstream of
it inherits a modern terminus for free; every later node has something real to wire into.

**And the PD frontier inverts here.** The READ push is currently PD-bottlenecked on ANE
headwaters (HANDOFF-2026-07-08 §3). The 1850–1930 occult-revival/comparativist layer is the
opposite — a **PD goldmine** (US: published <1931): Blavatsky 1877/1888 · Mathers'
*Kabbalah Unveiled* 1887 · Lévi-Waite 1896 · Papus Eng. tr. 1910 · Waite's *Pictorial Key*
1911 · Crowley's *Equinox* 1909–13 (which published the GD rituals) + *Book of the Law* ·
Frazer 1890–1915 · Jung-Hinkle 1916 · Manly P. Hall 1928. Steering READ batches to this trunk
serves reach-to-today AND escapes the PD wall in one move. (Per-text PD still verified by the
skeptic per the standing recipe.)

### The phases (each = 1–3 flywheel batches, standard gates, wire-as-we-read)

1. **The Golden Dawn keystone cluster** *(highest single leverage in the vault)* —
   CREATE `tradition-hermetic-order-golden-dawn` + `samuel-liddell-mathers` +
   `arthur-edward-waite` + `papus`; DEVELOP `eliphas-levi` (2), de-orphan `tarot`.
   Upstream it closes onto six existing deg-30–51 Phase-6 hubs (Agrippa, Dee-adjacent,
   Kircher, Christian Kabbalah, Rosicrucians); downstream it feeds Crowley (10), Thelema (2),
   Wicca (5), New Age (13). READ pairing: Pictorial Key, Kabbalah Unveiled, Lévi.
2. **Psychology + monomyth relay** — DEVELOP `sigmund-freud` (2→hub) and Jung's explicit
   `influenced-by` transmission edges to the Gnostic/alchemical corpus (his deg-25 is mostly
   soft edges); CREATE `theme-monomyth` + DEVELOP `joseph-campbell` (5). This is the gate to
   pop culture. READ pairing: *Golden Bough* chapters (partly staged), Jung-Hinkle 1916.
3. **The 19th-c connective tissue** — CREATE `mesmerism`; DEVELOP `tradition-spiritualism`
   (0), `tradition-theosophy`-as-hub (17; the docs are strong, the tradition node under-collects),
   Swedenborg→Romanticism links; psychedelic line: DEVELOP `aldous-huxley`, CREATE
   `alan-watts`, `timothy-leary`. READ pairing: Blavatsky, Mesmer, *Doors of Perception* is
   NOT PD — skip text, node only.
4. **The reception terminus layer** — small `pop-culture-reception` cluster: Star Wars/
   monomyth-cinema, Tolkien/modern fantasy, comics-as-mythology, plus popular relays
   `robert-graves` + `manly-p-hall` (Secret Teachings 1928 = PD, READ-stageable). Every
   chain that reaches phase 2–3 can then land at a node a modern user recognizes on sight.
5. **The lived-religion trunk + scholar spine** — DEVELOP `tradition-pentecostalism` (7;
   exists, contra INVESTIGATION-LEADS) toward global-South Christianity; wire the orphaned
   scholar layer (`marija-gimbutas` 1, `james-hillman` 0, Eliade 11) into
   `tradition-comparative-religion-academic` (23); the 3 missing comparativists from
   HANDOFF-2026-07-08 (#3: Watkins, Tylor, Puhvel) fold in here.

**Cadence:** unchanged proven recipe — `atlas-ingest-cluster` for creates (records above are
already existence-verified = the expensive pre-flight is done), wire-as-we-read for READ
batches, membership-singular/reach-is-wires, per-batch gates, STATUS + gated commits.
**Metric:** track docs-covered/622 (now 37%) as the READ headline (finding 1a), and add the
benchmark's ⏩ REACH-TO-TODAY bucket to each phase's exit check: the branch counts only when
it terminates ≥1900.

---

## 3. BOARDS — design proposals (spec-compatible; ranked)

Context: Boards v1 is complete and solid (all 10 carve steps shipped; bespoke HTML/SVG surface
is the ratified choice for this reader-class surface; LS persistence at `atlas.boards.v1`).
These proposals extend the LOCKED 2026-05-28 spec; none contradict it. All Lane B, serialized.

1. **Trace-to-Modernity mode (the signature feature).** Right-click a card → *"Trace to
   today"*: directed walk along transmission-bucket edges toward the newest-dated reachable
   node, laid out left→right on an era ruler. Pick Inanna → watch her land in Jung and 1920s
   comparativism. It is the product's core promise ("transmissions to modernity") rendered as
   one gesture, and the data (dates + `EDGE_BUCKET`) already supports it. Pairs with §2: every
   ingestion phase makes the traces longer — content work becomes visibly demo-able.
2. **Time-axis snap.** A VIEW toggle that soft-snaps card X-positions to origin date on an era
   ruler (manual Y preserved). Any messy board becomes a readable transmission timeline in one
   click; "Expand transmissions" fans stop being hairballs.
3. **Frontier markers ("this chain dead-ends in 1487").** A subtle right-edge glyph on any
   card whose transmission chain terminates pre-1700 — the benchmark's ⏩ bucket as UI. Click →
   pre-filled investigation lead. This is the *expands-naturally* mechanic for users: the tool
   shows its own frontier and invites the next dig; internally it's a live to-ingest map.
4. **Evidence-tier wires.** Style structured edges by `source-tier` (T1 solid → T4 dotted +
   warning hue), tooltip = type/source/note. The investigation tool's credibility promise made
   visible; deviant-bridge zones (Templar/occult) self-declare their tier on the board.
5. **Note cards.** Promote the spec's deferred free-text note to v1.1: a local-only card
   (hypotheses, questions) saved with the board. Investigation = claims + evidence; today the
   surface can only hold evidence. Cheapest high-utility item on this list.
6. **Ghost suggestions ("6 of these connect to prisca-theologia — add?").** When ≥N on-board
   cards share an off-board neighbor, show a dismissible ghost chip at the cluster edge.
   Same funnel logic as §2, as UX: the board suggests its own natural expansion.
7. **Reader→Board pinning.** In the scripture reader, pin a verse/term to the active board as
   a citation card (docNode + anchor; reverse of the existing inspector→reader handoff). Closes
   the product loop: read → pin → wire → see. Depends on finding 1b's docNode fixes.
8. **Walkthrough mode.** Order cards → play → camera tours card-to-card with the connecting
   wire highlighted. Turns a finished board into a shareable guided argument — the premium-SaaS
   demo artifact.

**Boards housekeeping (carry-over debts, verified):** legacy `src/js/alchemy/board.js` still
loaded at `index.html:278` (spec §4 sunset not executed); AI-presets category still reads
legacy `ALCHEMY_PRESETS` (`app.js:5203`) and `transmissions` reuse `mw-` ids in
`boards-library.js`; stale "placeholder until step 9" comment in `boards-controls.js:23`;
the naming question (spec §5 #1) remains open.

---

## 4. Immediate small fixes queued (background-task chips spawned this session)

1. Fix the 6 docNode mis-pointers (finding 1b) + add the docNode-exists check to the coverage
   auditor + make docs-covered the headline metric (finding 1a). Lane B, one sitting.
2. Boards housekeeping sweep (legacy board.js script tag + library taxonomy + stale comments).
   Lane B, one sitting.
