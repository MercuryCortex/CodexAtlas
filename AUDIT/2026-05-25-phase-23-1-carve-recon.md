# Phase 23.1 — Carve recon (DISCOVERY: RENDERER already extracted)

**Date filed:** 2026-05-25 LATE evening
**Filed by:** watcher-claude-lead (Phase 23 execution prep)
**Reads-with:** `AUDIT/2026-05-25-phase-23-decomposition-spec.md` (the locked spec — this doc PROPOSES an amendment).
**Status:** **AWAITING JOHN GREENLIGHT** before any code moves. Audit-only.

---

## 0. TL;DR

The locked Phase 23 spec proposed 6 carves in this order:

> RENDERER → GLYPH ATLAS → WIRES → HULL → TIMELINE-CHROME → EVENT BINDING

**Discovery during recon:** WebGPU device/pipeline/buffer plumbing **is already extracted** — it lives in `src/js/engine/renderer/webgpu.js`. forge.js only calls into it via the `renderer.*` interface; it does not own the GPU code.

Therefore: **Phase 23.1 RENDERER is a no-op** (the carve already shipped during Foundation Phases 0–5 alongside the engine modules).

**Proposed amendment**: re-prioritize Phase 23.1 to **TIMELINE-CHROME** (the largest single concern in forge.js, ~3,022 LOC), and update later sub-phases accordingly.

---

## 1. Evidence — forge.js is not what we thought

```
$ wc -l src/js/views/forge.js
8577

$ grep -cE 'createBuffer|createRenderPipeline|createBindGroup|requestAdapter|requestDevice|createShaderModule' src/js/views/forge.js
0
```

forge.js contains **zero** WebGPU primitive calls. Every GPU operation is routed through `engine/renderer/webgpu.js` (which I verified by grep — the file exists and contains the device/pipeline/buffer code).

forge.js's 8,577 LOC is one giant `render(rootEl)` function (lines 619–8569) containing **view-controller logic**, not engine code. The decomposition opportunity is by *feature concern*, not by *engine layer*.

---

## 2. forge.js structural map (LOC ranges by concern)

| Range | LOC | Concern | Carve candidate |
|---|---|---|---|
| 1–618 | 618 | File-header docstrings (NODE / BEHAVIORS / WIRES / FX / MANAGEMENT spec-lock comments) + PARAM_DEFAULTS | Stay (it's the spec lock) |
| 619–1480 | 862 | render() prologue: engine sanity check, vault data, thematic family ordering, mode-dependent state init, pane DOM build | Stay |
| 1480–1610 | 130 | Glyph overlay + labels overlay setup | Could carve with GLYPH/LABELS |
| 1611–2128 | 517 | Local mount state | Stay |
| 2128–2416 | 288 | Bootstrap renderer + first frame | Stay (orchestrator) |
| 2416–2931 | 515 | `rebuildForMode` mode-switch logic | Could carve as MODE-DISPATCH |
| 2931–3086 | 155 | Zoom gizmo + resize/fit | Could carve with chrome |
| 3086–3319 | 233 | `drawFrame` main loop | Stay (orchestrator) |
| 3319–3416 | 97 | GPU glyph instance buffer | Could carve with GLYPH |
| 3416–3573 | 157 | Labels (DOM placement) | Could carve as LABELS |
| 3573–4185 | 612 | **Hull SVG structure + ensure / rebuild / sync** | **Carve candidate: HULLS** |
| 4185–4251 | 66 | Hover hit-test | Stay (orchestrator) |
| 4251–4845 | 594 | Animation loop + focus/fade ticks | Stay (orchestrator) |
| 4845–4911 | 66 | LS runtime persistence | Stay |
| 4911–5004 | 93 | Search index + findBestMatch | Could carve as SEARCH |
| **5004–8026** | **3022** | **TIMELINE SCRUBBER — bottom-toolbar + LIN/LOG/CMP scale + density slider + DATE IN/OUT/FOCUS group + calendar registry + per-row tooltips + tick collision + LOCK toggle** | **Carve candidate: TIMELINE-CHROME** (Phase 22 work) |
| 8026–8245 | 219 | Interaction handlers (pointer / click / wheel / keyboard) | Carve as EVENT-BINDING (later) |
| 8245–8577 | 332 | Param helpers (PARAM_DEFAULTS support) | Stay |

**Headline:** the timeline-chrome block is **35% of forge.js**. That's the single biggest decomposition win.

---

## 3. Proposed amended carve order

| New # | Concern | Est. LOC | Risk | Why this order |
|---|---|---|---|---|
| **23.1** | **TIMELINE-CHROME** | ~3,000 | Medium | Biggest single LOC win. Mostly DOM/event-handler driven (low GPU-state coupling). Aligned with where Phase 22 work has been concentrated, so the carve maps to John's recent mental model. Sets the decomposition pattern. |
| 23.2 | HULLS | ~610 | Low | Self-contained SVG/canvas structure with `ensureHullStructure`, `rebuildHullElements`, `syncHulls`. Almost no global state. |
| 23.3 | MODE-DISPATCH | ~510 | Medium-High | `rebuildForMode` is the mode-switching engine. Touches state. Carve later when pattern is solid. |
| 23.4 | LABELS+GLYPH | ~380 | Low | DOM/atlas-driven; minimal global state. |
| 23.5 | EVENT-BINDING | ~219 | Low | Hover hit-test + click/wheel/keyboard handlers. |
| 23.6 | SEARCH | ~93 | Low | Smallest carve — ship last as polish. |

**Estimated total carve-out from forge.js: ~4,800 LOC** (8,577 → ~3,700). Exceeds the spec's "≥5,000 LOC total" target only because the original spec budgeted for a RENDERER carve that turned out unnecessary; the actual realizable reduction is ~4,800.

---

## 4. Phase 23.1 (TIMELINE-CHROME) — concrete carve plan

**Source range:** `src/js/views/forge.js:5004-8026` (3,022 LOC under the `// ── Timeline scrubber (2026-05-20) ───` section header).

**Target file:** `src/js/forge/timeline-chrome.js` (new). Exposes `window._forgeTimelineChrome.attach(local, opts)` where `local` is the forge mount state and `opts` contains the DOM root + camera + renderer handles.

**Boundary contract:**
- timeline-chrome.js **owns**: the bottom-toolbar DOM, scrubber DOM + drag handling, scale-preset UI (LIN/LOG/CMP), density slider, LOCK toggle, calendar registry (11 calendars), per-row tooltips, tick collision detection, DATE IN/DATE OUT/FOCUS group, `_forge.focusTimelineRange()` external API.
- timeline-chrome.js **reads from forge.js's `local` state**: mode, scrubber position, locked set.
- timeline-chrome.js **calls forge.js's** `recomputeFocus()` and `rebuildForMode()` (or those move with it — TBD during execution).

**Risk profile:**
- **Medium.** Timeline-chrome touches `local.scrubber`, calendar registry constants, and the DATE-FOCUS API. Several call sites in forge.js (recomputeFocus, rebuildForMode, applyTimelineHiddenOverride) reach INTO timeline-chrome state. Carve must preserve these via the boundary contract.
- Mitigation: spec out the boundary contract BEFORE moving code. Each external read → method on the new module. No raw state-poking across the boundary.

---

## 5. Acceptance gates (per Phase 23 spec §2, unchanged)

1. **LOC reduction.** forge.js ≥800 LOC drop (target: 3,000).
2. **Zero behavior change.** Before/after `preview_screenshot` of `?view=forge&mode=timeline` shows pixel-identical render. Before/after of `?view=forge&mode=deities` confirms non-timeline modes are untouched.
3. **Console clean.** Zero new warnings/errors at boot.
4. **`_forge.focusTimelineRange()` external API still callable** (it's referenced by side-panel cross-folder click popup per Phase 22-AH).
5. **`_forgeDebug` helpers still work**: `_forgeDebug.timeline()`, `_forgeDebug.countRebakeNodes()`, etc.
6. **Cache-bust bumped.**
7. **STATUS entry logged.**
8. **NO master-file edits.**

If any gate fails → carve does not ship; iterate within the phase.

---

## 6. What I am asking John for

**One of three responses:**

- **"go timeline-chrome"** → I execute Phase 23.1 = TIMELINE-CHROME carve as the amended plan above. Single Lane B batch. Slot stays held until preview-verified.
- **"go hulls first"** → I execute the safer/smaller HULLS carve first (~610 LOC), then TIMELINE-CHROME as 23.2. Lower risk, slower path to the big win.
- **"different first carve"** → tell me which.

**I will not move any code until you greenlight one of these.**

---

## 7. Why this matters

Quick recap of where this lands: the Premium SaaS bar (memory `project_premium_saas_shift.md`, 2026-05-15) cannot ship with an 8,577-LOC monolithic view file. Decomposition is the engineering precondition for sustainable future work. Without it, Phase 22-style oscillation rate stays high (each touch risks regressions in unrelated features that share the same file). Phase 23 closes audit finding #7 (P1) and is the load-bearing fix for project longevity.

The 3,000-LOC timeline-chrome carve, done right, is the single most leveraged refactor available right now. It's the right next step.

— Phase 23.1 carve recon, filed 2026-05-25 LATE evening, awaiting John greenlight.
