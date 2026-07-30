# HANDOFF — THE HOUSE + THE DEV DOOR (2026-07-30)

> Self-contained pickup for a fresh agent **in a different account**, with no
> access to the previous session and no memory files. Everything you need is
> here or cited by path. Read this, then `00_meta/HOW-WE-WORK.md`.
>
> **Everything below is committed, pushed, and LIVE on codexatlas.org at
> `?v=20260730-house2`.** Nothing is half-finished on disk.

---

## 0. Who you are working for

John — designer/artist and CEO, **not** a backend engineer. He does not audit
his own security or anonymity; that is your job. Rules that cost this session
real time when I forgot them:

- **BE CONCISE.** Short replies, one action at a time, exact place + button.
  Walls of text overwhelm him.
- **Ship a dial, don't ask.** On reversible visual choices in the dev phase,
  pick a sensible default, ship it, and expose the number as a slider. He said
  it twice, exasperated: *"these are just BGS that we working in DEV area,
  nothing is fixed?"* and *"WHERE is the FILM RAMP SLIDER??? or what kind of
  question was this?"* Reserve real questions for irreversible, outward-facing,
  money or security decisions.
- **He judges by toys, not stills.** Build the thing he can click.
- **Commit under the project pseudonym** (`Codex Atlas <codex-atlas@local>` —
  already the repo default). His real identity must never reach a remote.
  `.wrangler/` is gitignored because it holds the Cloudflare account id.

---

## 1. What shipped today (all live)

| | |
|---|---|
| **The light-alpha fix** | The forge canvas is transparent, so light written at alpha 0 was being clamped away over the void — glow only survived on wires/rings. Every emission now carries luminance alpha. This was the root cause of months of "no glow / just masks" complaints. |
| **John's orb dial** | `dress orb` on all tiers, reach ×2.0, frost 4.0 — the first recipe he judged with light actually rendering. |
| **The grounds** | node-lab colour grounds, now merged into **ONE Theme row of 8 complete looks** in the ✦ FOLIO (chrome + ground together). |
| **Banding** | Solved at the source: the ground is computed in float and dithered (ordered Bayer 8×8) at quantisation. The real culprit was a **CSS** radial on `.forge-stage` — see §3. |
| **One label system** | Two rival label systems merged into one registry with a single collision pass. |
| **Titles** | Wedge titles clamp on-screen, respect chrome keep-outs, and node names yield to them. |
| **The DEV door** | Six bottom-bar cells → three + one `DEV` launcher (NODE LAB · FX · STYLE · STATS · OVERVIEW). |
| **THE HOUSE** | Family isolate re-lays a family as a tree. §2. |

Full detail with line cites: `00_meta/STATUS.md`, entries `ENGINE-DRESS-11`
through `THE-HOUSE-SCALE`.

---

## 2. THE HOUSE — where it stands

Click a family title on the wheel → that family re-presents as a tree. Empty
click or Escape returns. Design + rationale: **`AUDIT/2026-07-29-fable-family-tree-isolate.md`**
and **`AUDIT/2026-07-29-fable-dev-drawer-and-tree-labels.md`**. Playable
reference toys: `design/family-tree.html`, `design/dev-drawer.html` (serve at
`localhost:8742/design/...`).

**Architecture** — `src/js/engine/layout/familytree.js` is a pure layout
sibling of `radial.js`/`timeline.js`; grouping is a **parameter** (`groupBy`),
never `n.family` internally. A second position attribute + one `layout_mix`
uniform ramp between wheel and house across all five WebGPU pipelines; buffer A
stays the wheel, so returning is instant. Position-B carries a **radius lane**,
which is how gods get bigger without touching `computeFitScale`.

**Verified**: gods measurably bigger in the house (Christian 6.0→29.2px,
Norse 6.0→19.3px, Vedic 6.0→16.9px) with `camScale` barely moving; honest zeros
hold (wheel returns byte-identical by screen-grid hit fingerprint); 0 frames
drawn at rest; `scripts/check-familytree.mjs` ALL PASS.

### ⚠ FIRST THING TO DO — the arcs

**Unresolved.** The bones system reports 39 Norse edges lifted to edge-state
0.75, but **no lineage arc was visible in my own screenshot**, even with idle
wires re-enabled. Two candidate explanations, undistinguished:

1. The arcs draw but are **occluded** — the beds now pack big discs close
   enough that a short arc sits entirely under them. If so, fix bed spacing or
   arc routing, **not** the `house_bones` dial.
2. They still do not draw at all.

Norse genuinely has only 20 kin arcs across 28 components, so most nodes have
none — do not mistake sparse data for a bug. Test on **Greek** (96 arcs, depth
6) before concluding anything.

### Known-empty by construction

The scriptorium/court rails are always empty: **no current view mode carries a
family's documents and persons alongside its deities** — all 30 modes are
single-type. That is a mode-level design question for John, not a house bug.

### Deferred, ranked (from the fable passes)

1. Mixed-type family isolate, to give the rails mass
2. Marriage-bar / dotted-aspect stroke styling (engine ribbons are uniform)
3. Rest-wire stub variant (the veil supersedes it for now)
4. In-house edge bow toward world centre
5. Rail proximity-reveal + court dial (moot until rails have mass)

---

## 3. THE HARNESS LAWS — each of these cost hours

**Safari is the truth on this project.** `scripts/safari-check.py` drives real
Safari headlessly via `safaridriver` (John enabled *Allow Remote Automation*
2026-07-29). Read its header.

- **Never validate banding in the Chromium preview pane.** Chromium dithers
  gradients; **Safari does not** — measured 59 vs 23 distinct row-means on the
  same ramp. Same code, different picture. And downscaled pane screenshots
  average bands away.
- **A CSS gradient cannot be dithered.** Any smooth-gradient requirement must
  be drawn in a canvas in float and dithered at quantisation. Locate a suspect
  gradient **by where its centre is** before measuring anything — that is what
  finally identified the `.forge-stage` radial.
- **Both headless surfaces suspend rAF** (`visibilityState:hidden`): animation
  looks frozen when it is fine, Safari screenshots can come back **all-black**,
  and rAF FPS probes hang. Settle motion with `_forgeDebug.houseSettle()`; use
  engine `frameStats` as the perf proxy; take pixels from the Chromium pane
  **after it has presented**. The pane additionally **zeroes `lastSize` while
  hidden**, silently no-oping hit-tests and camera flies.
- **Synthetic clicks and hover never reach the forge canvas handlers** under
  WebDriver. Drive canvas interaction through `window._forgeDebug`
  (`hitTestAt`, `toggleLock`, `enterHouse`, `houseState`, `nodeInfo`,
  `frameStats`, `cameraState`). DOM buttons *do* respond to `.click()`.
- **`offsetParent` is null for `position:fixed`** — test panel visibility with
  `getBoundingClientRect` + computed style. I briefly "found" a bug that was
  only my probe being wrong.
- **`?diag=1`** installs a boot-error recorder as the first script in
  `index.html`; assert `window.__diag === []`. WebDriver connects after load, so
  without it there is no honest way to claim "no boot errors".
- **Assigning `''` to a canvas colour is a silent no-op**, not an error. A
  lazily-read style must be guarded on "never read yet", never on elapsed time.

---

## 4. Laws — do not relitigate

- **The Forge engine is the only renderer for vault-node graphs.** Bespoke
  DOM/SVG graph layers are forbidden in the app (fine in `design/` toys).
- **Layout spread is a swappable primitive** — never hard-code the grouping key
  inside a layout function.
- **Honest zeros** — with a feature off, output must be byte-identical to
  before it existed. Proven for the house by hit-fingerprint.
- **Rest is still** — the rAF loop must die at rest. Verify: 0 frames in 4s.
- **ONE label registry.** All on-canvas text goes through
  `renderLabelsCanvas`'s single priority-ordered collision pass. A second label
  system is the exact bug that was fixed on 07-29; do not reintroduce it.
- **Dev vs canonical**: dev = dials that tune the *rendering*; canonical =
  controls that change what the map *claims*. VIEW, LEGEND and the ✦ FOLIO are
  canonical and never move into the DEV drawer. **Do not add a bottom-bar
  button for a dev surface — add a launcher row** (`00_meta/app-architecture.md`
  §3).
- `computeFitScale()` is sacred and cascades — do not repurpose it.

---

## 5. The workflow that worked

John explicitly asked for **fable agents** and liked the output: *"i like
implement with thos fable quality."* The pattern, four times over:

1. Dispatch an agent with `model: "fable"` carrying the ratified constraints
   inline, plus the harness traps in §3.
2. Read-only on `src/` for **design** passes → delivers an `AUDIT/` doc + a
   playable `design/` toy.
3. Write access for **implementation** passes → it implements its own spec, the
   toy is the acceptance test.
4. **The main thread reviews independently, commits and deploys.** Agents do
   not commit or deploy. Re-verify the headline claim yourself — my own checks
   caught things worth knowing every single time.

---

## 6. Build / verify / ship

```bash
python3 scripts/build_dist.py && npx wrangler pages deploy dist --project-name codex-atlas --commit-dirty=true
```

- Dev server: `.claude/launch.json` → port 8742. Never `open index.html`.
- After editing `src/js/forge/*`: `./scripts/build-forge-bundle.sh` (never
  hand-edit `_bundle.js`).
- **Bump `?v=` on every changed tag in `index.html`** — Safari cache law.
- Deploy is outward-facing: confirm with John unless he has just asked for it.
- Propagation takes ~30s; poll `codexatlas.org` for the new stamp before
  telling him it is live. **Check a URL exists before sending him to it** — I
  sent him to a file an agent had not written yet.
- Layout invariants: `node scripts/check-familytree.mjs`.

---

## 7. Suggested order

1. **The arcs** (§2) — the one open defect, on his screen first.
2. Whatever he says next after looking at the house — he has rejected two
   versions of this feature already; his eye decides.
3. **THE WIRE DRESS** — his standing brief, not yet started: *"our wires should
   also add some fx to match the new nodes for elegancy and flair to
   distinguish the levels of transmission hierarchy."* This is a design round of
   its own — a wire lab, the way `design/node-lab.html` was for nodes. Wire-calm
   and hot-wire dials are flood protection, not this.
4. Engine loose ends: orb backdrop never shrinks back after a cast leaves;
   fractional-dpr lens misregistration; body-pass light is ADD not screen;
   `recipeStr` field order vs the lab.
