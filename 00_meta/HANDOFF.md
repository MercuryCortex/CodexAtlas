# Session HANDOFF — 2026-05-18 evening (after ontology lock pass 2)

**Last work:**
1. Forge engine Phases 5 → 6d4 + the edge-state-invariant audit + cache-bust dance.
2. The "wires lit up after resize" bug — **diagnosed and closed** — was dev-panel/engine drift, NOT state-buffer corruption. See `AUDIT/forge-edge-state-invariant-2026-05-18.md` "FINAL DIAGNOSIS" section.
3. **Ontology lock pass 2** — 26-lens vocabulary established (was 16). 10 new lenses added (08, 18–26). See commits `4ba1a2b` → `67e751e` and the permanent rationale doc `00_meta/ONTOLOGY-RATIONALE-2026-05-18.md`.

---

## ⚠️ READ FIRST — current state

### 1. Forge UX work (John in flight)

John is working on the Forge map view (visual tuning, dev panel). When ready, he will EXPORT the tuned JSON from the dev panel. The next agent's job:
- Bake the EXPORT JSON into `PARAM_DEFAULTS` in `src/js/views/forge.js` (Lane B).
- Then ship the structural fix from the audit's "FINAL DIAGNOSIS" §Option B: Forge view `render()` should pull dev-panel state on mount so the engine and panel can't desync.
- **Do NOT re-investigate the edge-state-buffer bug — it's closed. The audit's earlier sections are historical reference, not active work.**

### 2. Ontology lock pass 2 (just shipped)

The 16-lens vocabulary expanded to 26. New folders exist on disk with READMEs:
- `08_places/` (filled the historic gap)
- `18_languages/`, `19_astronomy/`, `20_sacred_architecture/`, `21_theology/`, `22_practices/`, `23_material_culture/`, `24_pharmacology/`, `25_divination/`, `26_calendars/`

**Read `00_meta/ONTOLOGY.md` (§2 lens table) and `00_meta/ONTOLOGY-RATIONALE-2026-05-18.md` (permanent rationale).** Any future change to the ontology requires writing a NEW dated rationale doc, not editing the existing one.

### 3. Deferred to next Lane B window — atomic batch (must ship together)

When John frees the Lane B slot (after Forge tuning settles), the next Lane B claimant must ship all of these in one atomic batch:

- [ ] **Themes → Motifs rename** — `06_themes/` → `06_motifs/`, `type: theme` → `type: motif`, vault-wide YAML field references (`themes:` → `motifs:`), `CORE-THEMES.md` → `CORE-MOTIFS.md`.
- [ ] **`build_data.py` `NODE_TYPE_MAP`** updates for the 10 new lens types.
- [ ] **`build_dashboard.py`, `lint_yaml.py`, `fetch_thumbnails.py`, `review_thumbnails.py`, `fetch_wikidata_thumbnails.py`** — sweep for hardcoded folder lists; update to cover 08 + 18–26.
- [ ] **Pre-commit hook regex** — `scripts/git-hooks/pre-commit` LANE_A regex from `^(0[1-9]_|1[0-7]_)` → `^(0[1-9]_|1[0-9]_|2[0-6]_)`. Re-install to `.git/hooks/pre-commit`.
- [ ] **Forge mode dropdown** — add the new node types to the renderable modes.

**Why deferred:** every item touches Lane B paths. Shipping them while John has the Lane B slot would collide with his map DEV work. Ship them as one atomic Lane B batch when the slot frees.

### 4. Investigation agents (Lane A) — what they can do NOW

May begin staging nodes in the 10 new folders. Use the `type:` value documented in each folder's `README.md`. **Nodes will not appear in the graph until the deferred Lane B batch lands** (step 3 above) — but the disk structure is correct, the YAML skeletons are documented, and the work will integrate the moment the build script catches up.

### 5. Bug class to test FIRST if any visual glitch in Forge

`feedback_devpanel_engine_drift.md` (memory) — when John reports a visual glitch in Forge, test dev-panel ↔ engine sync first. Run:

```js
await _forgeDebug.dumpBugState()
```

Compare `params.X` against what the dev panel displays. If they differ → drift. **Don't theorise about shaders or state buffers before testing this.**

---

## Bug class CLOSED (was open in previous HANDOFF)

The "wires lit up after resize" bug class is **resolved**.

**What it actually was:** dev-panel `state.params` and engine `local.params` desyncing on view (re)mount. Forge `render()` initializes `local.params` from `PARAM_DEFAULTS` on every mount; dev panel only pushes its state once via `tryBoot`. View remount → engine resets to code defaults → panel still displays saved values → drift.

**What it WASN'T:** edge-state buffer corruption. The state-convention flip (commit `6bfa018`) was a correct fix for a real latent bug but not for the user-visible "wires lit" symptom.

**Workflow fix John adopted:** stay on Forge while tuning; EXPORT panel JSON; bake into `PARAM_DEFAULTS`. Then the engine's "default" IS the tuned state. Drift impossible by construction.

**Structural fix queued (Option B in the audit):** Forge `render()` should pull dev-panel state on mount instead of resetting to `PARAM_DEFAULTS`. Ships with the deferred Lane B batch.

---

## Lane status

- **Lane A:** OPEN. opus-ontology-lock-2026-05-18 FINISHED 2026-05-18 evening.
- **Lane B:** John in flight (Forge map DEV / visual tuning).

---

_Older content from previous handoff preserved below for reference._

---

## Previous handoff content (pre-ontology-lock)

### Symptom (John's repro, both Safari + Brave/Chrome)

1. Load Forge (`?view=forge`). Idle wheel renders correctly (faint slate wires, hub labels).
2. Interact normally — hover / lock / zoom — all working.
3. **Resize the browser window** (any action that fires ResizeObserver on `.forge-stage`).
4. After resize: every wire renders in the active/HOT bucket color at high opacity. With John's saved config (all `active_color_*` set to `#C9743A` orange), the entire wheel goes bright orange. Status bar still shows `HOVER —` `LOCK —` so there is no logical focus — yet edges paint as if every edge were hot.

### What we've already ruled out

| Hypothesis | Status |
|---|---|
| Browser cache serving old JS | Ruled out by `opus-forge-cachebust-bump` (2026-05-18 PM, by another agent) — all 17 script + CSS cache-bust slugs bumped to `20260518-cachebust-bump`. John confirmed bug persists. |
| Convention asymmetry (`0 = HOT`) | The audit at `AUDIT/forge-edge-state-invariant-2026-05-18.md` correctly identified that the edge-state convention was inverted from the safe default. `opus-forge-edge-state-invariant` (commit `6bfa018`) flipped the convention so `0 = IDLE`, `1 = HOT`. Verified in preview iframe: `window.dispatchEvent(new Event('resize'))` no longer flashes hot. Did **not** fix John's real-browser repro. |
| `local.edgeStates` corruption | No `.fill(1.0)` left anywhere in `src/js/` (verified by grep). `computeEdgeStates(_, null) === Float32Array(N)` (all zeros = IDLE). |
| `focusedSet` corruption | Only two write sites; neither can produce a Set of all 663 nodes. |
| GPU buffer leak | `renderer.forceWriteEdgeState` was added (Phase 6d3) as a hard-stop after resize; explicitly called from `resizeAndFit`. |

### Three remaining hypotheses for next agent

1. **Pointer events fire during resize and accumulate hover/lock state.** Unlikely but uninstrumented — Zeus has ~50 neighbors not 663, but maybe a sequence of pointermoves produces a corrupted state. *Diagnostic:* add `console.log` to `setHoverId` + `recomputeFocus` + `rebakeEdges` and have John capture a trace through one repro.
2. **`packEdges` is called during resize without `edgeOverridesFromParams()`.** Polemic + fusion default idle colors are bucket-hex (red/amber). If overrides aren't applied, those ~2000 edges render in bucket-hex at idle alpha. Doesn't fully explain the brightness, but worth verifying. *Diagnostic:* breakpoint on `packEdges` and confirm `opts.idleColors` is populated.
3. **WebGPU-implementation quirk with depth attachment recreation on swap-chain reconfigure.** The depth texture is destroyed + recreated in `ensureDepthTex` on every canvas resize (Phase 6d). Maybe this races with in-flight commands and produces garbage state for one frame. *Diagnostic:* temporarily revert the depth pipeline (remove `depthStencilAttachment` from drawFrame, `depthStencil` from both pipelines, `out.position.z` writes from shaders). If the bug goes away, depth-on-resize is implicated.

### Why I couldn't reproduce

The `mcp__Claude_Preview__` iframe doesn't fire ResizeObserver reliably. Multiple attempts to trigger via `pane.style.right = '500px'`, `window.dispatchEvent(new Event('resize'))`, etc. did not reproduce the symptom. The bug is **John-side only**. Next agent should ask him to capture a console trace during a fresh repro.

### Files for the next agent

| File | Lines | Why it matters |
|---|---|---|
| `AUDIT/forge-edge-state-invariant-2026-05-18.md` | full | Most rigorous analysis of the bug class. Read this first. |
| `src/js/engine/graph/adjacency.js` | 80–106 | `computeEdgeStates`. Convention is `0=IDLE, 1=HOT` (current). |
| `src/js/engine/renderer/webgpu.js` | 230–305 | Edge shader. Three `mix()` calls: width (line ~250), z (line ~270), color/dim (line ~294–301). |
| `src/js/engine/renderer/webgpu.js` | 569–581 | `forceWriteEdgeState` — Phase 6d3 hard-stop. |
| `src/js/engine/renderer/webgpu.js` | 685–705 | drawFrame edge-state upload. |
| `src/js/views/forge.js` | 619 | rebuildForMode init: zero-init (no fill). |
| `src/js/views/forge.js` | 730–770 | drawFrame call: passes `dimAmount: 0` when no focus. |
| `src/js/views/forge.js` | 808–860 | resizeAndFit: calls `rebakeEdges + recomputeFocus + forceWriteEdgeState`. |

Per AGENTS.md Craft doctrine §2, **four patched attempts on this bug is past the friction threshold**. The next investigation needs to be diagnostic-first, not patch-first.

---

## 🛠 Where Forge stands (Phases 0 → 6d4)

Forge is the proprietary WebGPU engine John is building to eventually replace the Sigma + SVG Pantheon. Through Phase 6d4 it is feature-rich and visually mature. Side-nav badge is `p6d4`.

### Capabilities (all working except the open bug above)

- WebGPU device + swap-chain + depth attachment.
- Full Deities wheel: **663 nodes + 3,033 edges** at ~0.1–0.3 ms/frame.
- 17 modes (deities, authors, documents, symbols, events, rituals, music, alphabet, alchemy, philosophy, morals, medicine, mathematics, monuments, themes, traditions, places). Switch via the FORGE • Mode dropdown.
- Camera: pan inertia + critically-damped zoom + ease-out fly-to.
- Hover hit-test + 1-hop highlight + click-to-lock with persistent label overlay.
- **Three-state model**: IDLE / HIGHLIGHTED (1-hop) / SELECTED (the actual anchor). SELECTED gets glow ring + size bump via SDF outside the disk.
- **Z-layering** via depth attachment — selected on top of highlighted on top of dimmed; edges always behind nodes.
- **Search + fly-to** — type a deity, Enter → camera glides to frame their 1-hop network.
- **Label hierarchy** — per-tier zoom thresholds, AABB collision pruning (skipped for tier 3 so deep-zoom reveals Lono / Māui), cap 800.
- **Zoom gizmo** — bottom-left chip with current % of fit-scale, click to fly back to fit.
- **Wire zoom clamp** — shader-side `clamp(world_w × scale, min_px, max_px)`.
- **Dev panel** (right-edge drawer, F key, "Visual ▸" tab) — 60+ live controls in nested collapsible groups: IDLE state · ACTIVE state · SHAPE · SIZE CLAMP · FOCUS DIM (3-channel: wires/nodes/glyphs) · NODES (tier radii + min/max screen-px clamp) · SELECTED state (size mult, glow strength, glow extent, glow color) · GLYPHS · LABELS (tier zoom thresholds + cap + size + collision pad) · GLOBAL PALETTE · CAMERA · SYMBOL PER NODE TYPE (icon picker, 17 types × 55-icon library) · TYPOGRAPHY (font picker, 6 families × 2 scopes). Double-click any row resets that one. Export config to clipboard. Persists via localStorage `codex-atlas/forge-dev-panel-v4`.
- **App-shell awareness** — `.forge-pane` uses `left: var(--eff-nav-w); right: var(--eff-detail-w)`. All chrome respects the side rails. Top-of-file doc-block in `src/js/views/forge.js` spells out the contract.
- **Text-selection suppression** — `user-select: none` on `.forge-pane` (re-enabled on inputs). No more blue overlay during window-edge drags.

### Phase log

| Phase | Commit | What |
|---|---|---|
| 0 | `90671dd` | Tab scaffold + Craft doctrine in AGENTS.md |
| 1 | — | WebGPU bootstrap + first disk |
| 2 | — | Full wheel: 663 deities + 3,033 edges instanced |
| 3 | — | Camera (pan + zoom-to-cursor) + hover + 1-hop dim |
| 4a–4f | — | Hot-edge brighten · lock · cinematic camera · mode switching · type-shape glyphs · search + fly-to |
| 5 | — | Visual-tuning dev panel + icon library |
| 5b–5d | — | Hide legacy Pantheon-V2 dev panel · first idle-paints-hot attempt (didn't hold) |
| 6 | — | Dev panel UX + idle/active wire split + label hierarchy + zoom-aware nodes |
| 6b | `f445fd7` | Zoom-aware wire widths + hide legacy filter bar |
| 6c | `472b110` | 3-state model + cursor + dim split |
| 6d | `cfdb972` | Z-layered selected/highlighted (depth) · tier-3 label fix · bottom search · zoom gizmo · top-bar layout |
| 6d2 | `9ce18da` | App-shell framework awareness · aggressive resize defensive |
| 6d3 | `0025f61` | `user-select: none` · label cap 800 · `forceWriteEdgeState` |
| invariant | `6bfa018` | Audit-prescribed convention flip (`0 = IDLE`) — should have fixed resize bug but didn't in John's browser |
| cachebump | (separate agent) | Diagnostic cache-bust to `20260518-cachebust-bump` |

---

## 📋 Outstanding work plan

### IMMEDIATE PRIORITY (blocking John's progress)

1. **Fix the resize → orange bug.** See the "Three remaining hypotheses" block above. Per AGENTS.md Craft doctrine §2, this is past the friction threshold — next round must be structural, not another patch.

### NEXT (Forge work John explicitly wanted but I deferred)

2. **Node spread / hull jitter with springback.** John's words: "would be good that they can be moved around a bit in the hull (with a tendency to ease back to its original anchor position)". Probably ~200 LOC: per-node anchor + drag offset, rAF springback tick, dev-panel slider for jitter strength.
3. **Better label hierarchy at deep zoom.** Lono/Māui are reachable now via Phase 6d3 (cap 800, tier-3 collision skipped). John may still want smoother reveal curves or a "show all labels in viewport" override toggle.
4. **Custom Forge cursor (SVG).** Phase 6c stub left a hook; long-term goal is a the portable core-style cursor instead of the system default arrow.
5. **Phase 5b camera tuning live-wire.** `pan_tau` / `zoom_tau` / `flyto_dur` dev-panel sliders update `local.params` but don't yet plumb through to the camera module setters. Trivial wire-up.

### BROADER UX QUEUE (from `00_meta/ACTIVE-UX.md`, in order)

These are blocked behind Forge stabilising:

1. **Phase 3 — Kit extraction** — Lift Pantheon V2 design primitives into `src/js/kit/`. Pantheon V2 keeps rendering identically. *(Not started.)*
2. **Phase 4 — Documents view migration** — Adopt kit primitives in `src/js/app.js` Documents view. *(Blocked on Phase 3.)*
3. Transmission view migration — Biggest visual win after Documents.
4. Atlas (map) view — Adopt `thumb-card.js` for node hover.
5. Timeline view — Adopt tier colors + phase-band tokens.
6. Astrology spine + wheel — Adopt `rim-labels.js` + `force-bake.js`.
7. Scripture ring — Adopt `edge-buckets.js` for cross-book trails.
8. Alphabets glyph viewer — Adopt `thumb-card.js` + tokens.
9. Remaining list views — Authors, Themes, Edges, Traditions, All-nodes — token-only normalization.

---

## 🧠 Pickup checklist for next session

1. **Skim AGENTS.md** for the Craft doctrine — especially §2 (re-evaluate tech at every friction signal, three+ patched attempts means escalate).
2. **Read `AUDIT/forge-edge-state-invariant-2026-05-18.md`** — the most rigorous analysis we have of the bug.
3. **Decide on a hypothesis to test first.** Recommend hypothesis #3 (depth-on-resize) as the cheapest diagnostic — temporarily revert the depth pipeline and see if the bug goes away.
4. **Ask John for a fresh console trace** if you can't repro locally. The `mcp__Claude_Preview__` iframe doesn't fire ResizeObserver the way a real browser does.
5. Once root-caused, write a follow-up entry on this HANDOFF + add to `00_meta/STATUS.md` + (if structural) save a feedback memory.

---

## 📍 Memory anchors

Worth re-reading before deep work:

- `~/.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/feedback_safe_default_conventions.md` — asymmetric "zero-init = bad" defaults are a recurring trap. The Forge edge-state bug surfaced this lesson; future engine work should treat zero as "do nothing" everywhere.
- `~/.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/feedback_goblin_audit_ethic.md` — "not bulletproof" after iterative one-line fixes → dispatch parallel read-only audit agents. The audit linked above is the model for that.
- `~/.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/project_premium_saas_shift.md` — Forge is the centerpiece of the premium SaaS pivot. App-code quality bar is higher than vault-content quality bar.

---

— handoff written 2026-05-18 PM. Forge feature-complete through Phase 6d4 except for the open resize → hot wires bug. Stay surgical, stay in Lane B.
