# Phase 23 — Forge Monolith Decomposition Spec

**Date filed:** 2026-05-25 LATE evening
**Filed by:** watcher-claude-lead (TYRANT remediation Phase 4 Option B execution)
**Greenlit by:** John ("B")
**Closes TYRANT audit finding:** #7 (`forge.js` monolith 8,577 LOC never decomposed per rebuild spec promise; P1).
**Reads-with:** `AUDIT/2026-05-25-foundation-locked-epilogue.md` · `AUDIT/forge-rebuild-layered-spec-2026-05-20.md`.

---

## 0. Why this exists

The rebuild spec (2026-05-20 §1) implicitly promised the Foundation layers would land as **separate modules** (NODE / BEHAVIORS / WIRES / FX / MANAGEMENT, each a distinct concern). Reality: all five layers shipped inside one `render(rootEl)` function in `src/js/views/forge.js` totalling **8,577 LOC** across one file. Premium-SaaS posture (`project_premium_saas_shift.md` 2026-05-15) cannot honor a single 8.5k-LOC view file.

Phase 23 carves `forge.js` into concern-scoped modules under the **same micro-audit-per-sub-phase discipline** that worked for rebuild Phases 0–5.

---

## 1. The carves, in order

```
Phase 23.1 — RENDERER carve     (WebGPU device + pipelines + shader plumbing)
   ↓
Phase 23.2 — GLYPH ATLAS carve  (atlas build + mip + cull + tint logic)
   ↓
Phase 23.3 — WIRES carve         (bucket palette + edge VBO writer + dirty flag)
   ↓
Phase 23.4 — HULL carve          (concave hull + fade + label hierarchy)
   ↓
Phase 23.5 — TIMELINE-CHROME carve (bottom-bar + scrubber + density + LOCK)
   ↓
Phase 23.6 — EVENT BINDING carve (hover / click / pointer / keyboard)
```

**Dependency order matters.** RENDERER first because everything else writes through it. GLYPH ATLAS second because it has the smallest footprint and is already partially in `engine/renderer/webgpu.js`. WIRES + HULL next because they read renderer state. TIMELINE-CHROME late because it spans multiple modules and depends on the others being stable. EVENT BINDING last because it touches everything.

Each carve = one ACTIVE-UX slot claim = one commit = one acceptance gate.

---

## 2. Acceptance gate per carve (mandatory)

For each Phase 23.N to ship:

1. **LOC reduction.** `forge.js` LOC drops by ≥800 (RENDERER carve target ≥1200; later carves smaller). Total Phase 23 target: ≥5000 LOC reduction.
2. **Zero behavior change.** Before/after `preview_screenshot` of the Forge view at deities mode + timeline mode shows pixel-identical render (or visibly identical at human-perception scale).
3. **Console clean.** Zero new warnings or errors at boot.
4. **All existing _forgeDebug helpers still callable.** (`_forgeDebug.dumpRuntime()` etc. — these are the rebuild's lock-test invariants.)
5. **Cache-bust bumped** in `index.html`.
6. **STATUS entry** logging what moved + what stayed + LOC delta.
7. **No master-file edits** (HOW-WE-WORK / ONTOLOGY / PROTOCOL / LANES / VIEW-CONTRACT untouched).

If a carve fails any gate, it does NOT ship — iterate within the carve until it does. Same rule that held Phases 0–5.

---

## 3. Carve-1 (Phase 23.1 — RENDERER) — first batch sketch

**Target module:** `src/js/forge/renderer.js` (new).

**Move out of `forge.js` into `renderer.js`:**
- WebGPU adapter + device acquisition
- All `GPUDevice.createBuffer` / `createBindGroup` / `createRenderPipeline` calls
- Vertex/index buffer management for nodes
- The `drawFrame()` loop or its non-state-mutating core
- `_forgeDebug.dumpAtlasInfo` / `countNodeVboWrites` / `countEdgeVboWrites` instrumentation hooks
- Any imports from `engine/renderer/webgpu.js` (preserve the boundary)

**Stay in `forge.js`:**
- The top-level `render(rootEl)` orchestrator
- State (`local.*` mutable state, `lockedSet`, mode, scrubber position)
- DOM-build of toolbar / side-panel / scrubber chrome
- Event bindings (move out only in Phase 23.6)

**LOC target:** ≥1200 lines moved (forge.js 8,577 → ~7,300).

**Verification:**
- `preview_screenshot` of `?view=forge` at deities mode shows clean halo + clean focus state for one locked node.
- Console reports `FRAME 0.X ms` with no errors.
- `_forgeDebug.dumpAtlasInfo()` returns the same shape as pre-carve.

---

## 4. What we will NOT do in Phase 23

- **Refactor logic.** Pure module-move only. Changing what code DOES inside a carve is a separate feature batch.
- **Decompose `app.js`** (10,749 LOC). That's a future Phase 25+ if needed.
- **Decompose `scripture-texts.js`** (11,697 LOC — a data file, not a code file). Out of scope.
- **Touch `engine/`** (existing modular layer is already healthy).

---

## 5. Risk

Highest risk: **WebGPU pipeline ordering.** GPU device + buffers + bind groups have non-obvious ordering invariants. A wrong-order initialization can boot clean but break on first interaction. Mitigation: Carve-1 starts with the smallest possible RENDERER slice (device acquisition + one pipeline only) if needed, expanding within Phase 23.1 if confidence holds.

---

## 6. Estimated budget

| Carve | Sub-audit (read-only) | Implementation | Verification | Total |
|---|---|---|---|---|
| 23.1 RENDERER | 30 min | 3-4 h | 30 min | ~4-5 h |
| 23.2 GLYPH ATLAS | 20 min | 2 h | 20 min | ~3 h |
| 23.3 WIRES | 20 min | 2 h | 20 min | ~3 h |
| 23.4 HULL | 20 min | 2-3 h | 30 min | ~4 h |
| 23.5 TIMELINE-CHROME | 30 min | 3 h | 30 min | ~4 h |
| 23.6 EVENT BINDING | 20 min | 2 h | 30 min | ~3 h |

**Total Phase 23 budget:** ~21-22 h focused Lane B over 6 carves. Each carve is shippable in one session.

---

## 7. Out-of-scope deferrals from the original rebuild Phase 6

These items were on the rebuild's TAIL POLISH backlog but are NOT Phase 23 carves:

- Hull jitter (UX polish — file under Timeline V1.N or its own batch)
- Custom cursor (UX polish — Timeline V1.N)
- Label hierarchy (UX polish — Timeline V1.N)
- Camera tuning (engine-tweak — would require a Foundation re-open, which the epilogue declined)

---

— Phase 23 spec, locked 2026-05-25 LATE evening. Carve 23.1 ships when greenlit.
