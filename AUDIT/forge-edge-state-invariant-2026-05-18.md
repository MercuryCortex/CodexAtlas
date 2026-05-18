# Forge Edge-State Invariant — Audit + Fix

**Date:** 2026-05-18
**Lane:** B (UX)
**Affected:** `src/js/engine/renderer/webgpu.js`, `src/js/engine/graph/adjacency.js`, `src/js/views/forge.js`
**Symptom history:** `opus-forge-phase-5d` ("fix idle wires being painted at HOT color"), `opus-forge-phase-6d3` ("force-write edge state — third attempt"). The bug keeps coming back because every fix has patched a downstream path, not the invariant.

---

## TL;DR

The edge-state convention is **inverted from the "safe default"** — and **asymmetric with the node-state convention**. Any GPU code path that allocates an edge-state buffer and doesn't explicitly overwrite every slot with `1.0` paints **every wire HOT (bucket color + hot width)**. The three previous fixes each closed one path; the root invariant was never touched.

**Recommended fix:** invert the edge-state convention so `0 = IDLE` and `1 = HOT`, matching the node convention. ~10 lines across 3 files. Eliminates the entire bug class — fresh GPU memory becomes the safe-default rendering by construction.

---

## 1. The invariant violation

| | meaning of `state = 0` | meaning of `state = 1` | zero-init GPU memory renders as… |
|---|---|---|---|
| **Node** state | focused (no dim) | dimmed | ✅ no-dim (safe) |
| **Edge** state | **HOT** (bucket color, hot width) | idle (slate / headline atmosphere) | ❌ **every wire lit bright** |

The asymmetry is the bug. For nodes, "no info yet" coincides with "show me at full opacity, no special treatment" → state = 0. For edges, "no info yet" coincides with "show me lit up like the user is hovering over me" → state = 0. That second sentence is nonsense, so the bug shows up every time the renderer's safety-net default fires.

### Where the convention is declared

`src/js/engine/graph/adjacency.js:82–101` — `computeEdgeStates`:

```js
// Per-edge state.
//   0.0 = HOT — paint with bucket-hex hot color (focused, in 1-hop)
//   1.0 = IDLE — paint with instance_color (slate / headline-low-alpha)
// An edge is "hot" iff BOTH endpoints are in focusedSet.
function computeEdgeStates(edges, focusedSet) {
  const out = new Float32Array(edges.length);
  if (!focusedSet) { out.fill(1.0); return out; }
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    out[i] = (focusedSet.has(e.source) && focusedSet.has(e.target)) ? 0.0 : 1.0;
  }
  return out;
}
```

### How the shader reads it

`src/js/engine/renderer/webgpu.js:250` (vs_main width pick) + `:293` (fs_main color pick):

```wgsl
// Width:
let world_w_raw = mix(inst_extra.w, inst_extra.x, inst_state);
// mix(a, b, t) = a*(1-t) + b*t
// state=0 → inst_extra.w (HOT width)
// state=1 → inst_extra.x (IDLE width)

// Color:
let color    = mix(hot, in.edge_color, in.state);
// state=0 → hot       (bucket-hex bright)
// state=1 → in.edge_color (slate or headline-low-alpha)

// Dim:
let dim_mult = mix(1.0, 1.0 - v.dim_amount, in.state);
// state=0 → 1.0          (no dim)
// state=1 → 1.0 - dimAmt (dimmed if a focus is active)
```

---

## 2. Where the safe-default leaks

### Leak A — drawFrame fallback path

`src/js/engine/renderer/webgpu.js:693`:

```js
const stateData = frame.edgeStates || new Float32Array(edgeCount);  // ← all zeros = all HOT
```

If `frame.edgeStates` is null/undefined, fallback is a fresh `Float32Array` (zeros) = every wire HOT.

### Leak B — `ensureBuffer` grows the GPU buffer

`src/js/engine/renderer/webgpu.js:500–506`:

```js
function ensureBuffer(current, currentSize, neededSize, label) {
  if (current && currentSize >= neededSize) return { buf: current, size: currentSize };
  if (current && current.destroy) { try { current.destroy(); } catch (e) {} }
  const size = Math.max(4096, Math.ceil(neededSize / 4096) * 4096);
  const buf = device.createBuffer({ label, size, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  return { buf, size };
}
```

When `neededSize > currentSize`, the old buffer is destroyed and a fresh one is created. WebGPU buffer allocations are **zero-initialized**. The renderer immediately writes `stateBytes / 4` floats from `stateData`. If `stateData.length === edgeCount` everything is fine — but the trailing slots in the *larger* buffer (rounded up to a 4 KB page) stay zero. Those slots aren't drawn (instance count caps the draw call), so they're harmless **in isolation**.

The real risk is the **race window** between buffer grow → first frame: if any path (mode switch, resize, swap-chain reconfigure) hits `drawFrame` with `frame.edgeStates = null` or a mis-sized array right after the grow, the just-created zero-buffer is what the GPU samples, and every wire paints HOT.

### Leak C — `forceWriteEdgeState` is a bandaid

`src/js/engine/renderer/webgpu.js:568–574`:

```js
forceWriteEdgeState(stateData) {
  if (!edgeStateVbo || !stateData || !stateData.length) return;
  const stateBytes = stateData.length * 4;
  const r = ensureBuffer(edgeStateVbo, edgeStateVboSize, stateBytes, 'forge-edge-state-vbo');
  edgeStateVbo = r.buf; edgeStateVboSize = r.size;
  device.queue.writeBuffer(edgeStateVbo, 0, stateData, 0, stateData.length);
}
```

This was Phase 6d3's third-attempt fix. It works **only if** `stateData` is correctly populated with `1.0`s for every idle edge. It guards one specific path (resize). It does nothing for any future path. The convention is still the trap.

### View-layer compensations

The view already knows about the trap and tries to compensate:

- `src/js/views/forge.js:354` — local default: `edgeStates: new Float32Array(0)` (empty — won't trip default until edges arrive).
- `src/js/views/forge.js:619` — mode-switch init: `local.edgeStates = new Float32Array(edgePack.instanceCount).fill(1.0);` (manually re-fills with idle).
- `src/js/views/forge.js:744–746` — resize path: explicit `forceWriteEdgeState` after `recomputeFocus`.

Three places, three different defensive patterns, all for one inverted convention.

---

## 3. Why the prior fixes failed

| Commit | What it did | Why it didn't hold |
|---|---|---|
| `opus-forge-phase-5d` (2026-05-17) | "fix idle wires being painted at HOT color" — first attempt | Patched the symptom on one path; left the convention. |
| `opus-forge-phase-6d3` (2026-05-18) | added `forceWriteEdgeState`; called after `resizeAndFit → recomputeFocus` | Only guards the resize path. Any other path that hits a freshly-allocated edge-state buffer still paints HOT. |

The agent's commit message on 6d3 is honest about it:

> *"Even if some pipeline-state corruption I can't reproduce in Chrome were to discard the state upload, this guarantees the GPU buffer holds the values our JS thinks it should."*

That's the tell. The bug isn't pipeline-state corruption — it's that **"the values our JS thinks it should hold"** are derived from a convention where the zero default means *the wrong thing*. The patch protects one path. The trap is structural.

---

## 4. Recommended fix — invert the edge-state convention

`0 = IDLE` (safe default), `1 = HOT`. Matches the node convention. Eliminates the bug class — fresh GPU memory now renders correctly by construction.

### Diff (4 surgical edits)

#### 4.1 `src/js/engine/graph/adjacency.js:82–101` — `computeEdgeStates`

```js
// Per-edge state.
//   0.0 = IDLE — paint with instance_color (slate / headline-low-alpha)
//   1.0 = HOT  — paint with bucket-hex hot color (focused, both endpoints in 1-hop)
// An edge is "hot" iff BOTH endpoints are in focusedSet.
//
// Convention rationale: zero-initialized GPU memory = IDLE (the
// safe default). Matches the node-state convention where 0 = no
// special treatment. Eliminates the "fresh buffer paints hot"
// trap that caused phase-5d + phase-6d3 fixes.
function computeEdgeStates(edges, focusedSet) {
  const out = new Float32Array(edges.length);
  if (!focusedSet) return out;       // all-zeros = all-idle
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    out[i] = (focusedSet.has(e.source) && focusedSet.has(e.target)) ? 1.0 : 0.0;
  }
  return out;
}
```

#### 4.2 `src/js/engine/renderer/webgpu.js` — edge shader (3 mix() calls flip)

Around lines 250, 269, 293–294:

```wgsl
// Width: state=0 → idle, state=1 → hot
let world_w_raw = mix(inst_extra.x, inst_extra.w, inst_state);

// Z-layer: state=0 (idle) is BEHIND, state=1 (hot) sits forward
let z = mix(0.85, 0.75, inst_state);

// Color: state=0 → idle instance color, state=1 → bucket hot
let color    = mix(in.edge_color, hot, in.state);
// Dim:   state=0 (idle, non-focused) → dim by dim_amount when a focus is active.
//        state=1 (hot)               → no dim.
let dim_mult = mix(1.0 - v.dim_amount, 1.0, in.state);
```

**Note on dim semantics:** today, `dim_amount` only really kicks in when a focus is active (no focus → caller is responsible for passing `dimAmount = 0`). Under the inverted convention, that contract is unchanged. When `focusedSet === null`, all edges are state=0, and the caller must still pass `dimAmount = 0` so the no-focus idle constellation isn't attenuated. Verify the view layer does this — see §6.

#### 4.3 `src/js/engine/renderer/webgpu.js:693` — drawFrame fallback

```js
// Phase 6d4: zero-init = idle (safe default). No more .fill(1.0)
// dances; this is now the structural default.
const stateData = frame.edgeStates || new Float32Array(edgeCount);
```

(No functional change to this line, but the comment now accurately describes a safe default.)

#### 4.4 `src/js/views/forge.js:619` — mode-switch init

```js
// Phase 6d4: edge state default is now 0 = IDLE. No fill needed.
local.edgeStates = new Float32Array(edgePack.instanceCount);
```

(Drop the `.fill(1.0)`.)

### 4.5 Optional cleanup

- `src/js/views/forge.js:744–746` — the `forceWriteEdgeState` hard-stop after resize is now redundant, **but** keep it for one more session as belt-and-braces. Remove in a follow-up batch once the convention flip has been live for a green session.
- `src/js/engine/renderer/webgpu.js:562–574` — `forceWriteEdgeState` method itself can stay as a no-cost utility.

---

## 5. Alternative paths considered

### Option B — Self-healing renderer (smaller surgery, latent bug remains)

Don't touch the convention. When `ensureBuffer` returns a *grown* buffer for `edgeStateVbo`, prefill with `1.0`s:

```js
const r = ensureBuffer(edgeStateVbo, edgeStateVboSize, stateBytes, 'forge-edge-state-vbo');
if (r.buf !== edgeStateVbo) {
  const idleFill = new Float32Array(r.size / 4).fill(1.0);
  device.queue.writeBuffer(r.buf, 0, idleFill);
}
edgeStateVbo = r.buf; edgeStateVboSize = r.size;
```

Also flip the drawFrame fallback to `.fill(1.0)`.

**Why not this:** it's defensive plumbing on top of a broken invariant. Every future contributor still has to remember "for edges, the safe default is 1, not 0." The bug stays latent. Strictly worse than Option A.

### Option C — Keep patching downstream paths (what's been happening)

Add another `forceWriteEdgeState` call wherever the bug surfaces next. **Strongly discouraged** — this is the path that produced three commits over two days for one bug. Per AGENTS.md Craft doctrine §2, three patched attempts is the explicit friction signal to escalate to a real fix.

---

## 6. Verification plan

Run after Option A is applied. All checks via `mcp__Claude_Preview__` on `http://localhost:8742/?view=forge` with cache-bust.

1. **Cold idle.** Load `?view=forge`, do nothing. Expected: all wires paint at idle (slate atmosphere + headline-color whispers for polemic/fusion). Screenshot.
2. **Hover a hub.** Hover Zeus. Expected: incident edges light up HOT in their bucket colors; non-incident edges stay idle (and dim by `dim_amount` if a focus is active). Screenshot.
3. **Resize (the original repro).** With Zeus locked, drag the browser window edge horizontally. Expected: wires stay in their pre-resize state — incident hot, others idle/dimmed. **No mass-hot flash.** This is the bug to confirm gone.
4. **Mode switch.** Switch from Deities to Authors to Documents and back to Deities. Expected: each mode loads idle, no hot-flash on switch.
5. **Buffer grow stress.** Force a mode-switch sequence that grows the edge buffer (small mode → large mode). Confirm no hot-flash on the larger mode's first frame.
6. **Edge-bucket palette mutation.** Open the dev panel, change `active_color_transmission` to bright green. Expected: ONLY focused-and-transmission edges turn green on hover. Idle non-transmission edges unaffected.
7. **No-focus dim sanity.** Click empty stage to clear lock. Expected: idle wire constellation is faint slate, not heavily attenuated (caller is correctly passing `dimAmount = 0` per §4.2 note). If they look too dim, the view-layer dim-passthrough needs an adjustment — see `drawFrame` call site in `forge.js`.

**Pass criterion:** all 7 produce the expected state with zero hot-flash transitions.

---

## 7. Commit recipe

- **Slot:** claim `opus-forge-edge-state-invariant` in `00_meta/ACTIVE-UX.md` before touching `src/`.
- **Owned files:** `src/js/engine/graph/adjacency.js`, `src/js/engine/renderer/webgpu.js`, `src/js/views/forge.js`.
- **Cache-bust:** `20260518-forge-edge-state-invariant` in `index.html`.
- **Commit message stub:**

  ```
  opus-forge-edge-state-invariant: flip edge-state convention so 0=IDLE

  Eliminates the "fresh buffer paints hot wires" bug class that
  drove phase-5d + phase-6d3 patches. Under the new convention,
  zero-initialized GPU memory is the safe default (all wires
  idle), matching the existing node-state convention.

  See AUDIT/forge-edge-state-invariant-2026-05-18.md for the full
  analysis. Edits:

   - adjacency.js:computeEdgeStates — return 1.0 for HOT, 0.0 for IDLE
   - webgpu.js edge shader — flip width/color/dim mix() arg order
   - views/forge.js:619 — drop the .fill(1.0) on mode-switch init

  Verified live: §6 7-step checklist all green.
  ```

- **Log:** one-line entry at the top of `00_meta/STATUS.md`.
- **Memory:** save a `feedback` memory noting that asymmetric "safe default" conventions across paired buffers are a recurring trap in this engine — future engine work should default-zero = "do nothing" everywhere.

---

## 8. Risk + rollback

**Risk:** low. Pure semantic flip in three places. Shader changes are 3 line edits with mechanically inverted argument order. No new code paths.

**Confounder to watch:** the dim-mult flip (§4.2) assumes the view passes `dimAmount = 0` when no focus is active. If it doesn't, the idle constellation will look too dim under the new convention. Easy 1-line fix at the `drawFrame` call site — verify in step 7 of §6.

**Rollback:** revert the four edits. No data migration, no persisted state changes (the dev panel's LS doesn't touch this).

---

— audit closed 2026-05-18
