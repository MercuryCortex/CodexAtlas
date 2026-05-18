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

---

## ADDENDUM — 2026-05-18 PM — bug "persists" after fix shipped

**Reporter:** John, with three screenshots: (1) cold load = clean idle; (2) after camera move = zoomed-in nodes + tier-label reveal (expected); (3) after window resize = every wire painted bright orange across the wheel, HOVER `—`, LOCK `—`, FRAME 0.2 ms.

### What was verified in the preview iframe

After the convention-flip commit (`6bfa018`) shipped:

- All four affected scripts (`engine/graph/edge.js`, `engine/graph/adjacency.js`, `engine/renderer/webgpu.js`, `views/forge.js`) are served with the new cache-bust `?v=20260518-forge-edge-state-invariant`.
- `window.AtlasEngineGraph.computeEdgeStates` was instrumented and observed across a programmatic resize cycle (1216×855 → 1016×655 → 1300×900 → 900×600 → 1500×1000). Every invocation returned `Float32Array(3033)` with **3033 zeros / 0 ones / focusedSet=null** — i.e. the safe-default-idle the fix was supposed to produce. Wheel stayed idle visually across every resize.
- `_forgeDebug.lockedIds()` returned `[]`, `hoverId()` returned `null` throughout.

**The fix is structurally correct and is taking effect in the preview iframe.**

### Why the 6d4 verification missed John's repro

The commit message says:

> §3 Zeus locked + window.resize event with user's exact prior-bug config (all active = #C9743A orange): wheel re-renders at new size with state preserved, NO mass-hot flash. ✓ (bug is gone)

That test verifies a **focused** state survives resize. John's actual repro is **no-focus → resize → wires light up HOT**. The 6d4 verification never exercised the path where the bug actually surfaces. §6 of this audit prescribed a 7-step checklist including a no-focus resize case (`§6.3`), and that step was not actually run with John's tweaked dev-panel palette. Future fixes must run §6 in full, not just the focus-preservation scenario.

### Why the wires look uniformly orange in screenshot 3 (not a separate bug)

John's persisted dev-panel state (`localStorage["codex-atlas/forge-dev-panel-v4"].params`) has **every** `active_color_*` bucket set to `#C9743A`:

```
active_color_transmission: "#C9743A"
active_color_parallel:     "#C9743A"
active_color_association:  "#C9743A"
active_color_kinship:      "#C9743A"
active_color_attestation:  "#C9743A"
active_color_polemic:      "#C9743A"
active_color_fusion:       "#C9743A"
```

So *whenever* a wire enters HOT state, it paints exactly that orange — regardless of bucket. The uniform-orange appearance is purely a consequence of this palette + the wires being in HOT state. **The colour itself is not evidence of a separate bug; it's just diagnostic of "every wire is in HOT state right now."**

### Why the bug still appears on John's machine — ranked hypotheses

#### H1 (≈80% likely) — cached old JS

Brave aggressively caches `index.html`. If John soft-refreshed (Cmd+R) after the commit landed, his browser may still be serving the pre-fix `index.html` whose script `<script src="…?v=20260518-forge-p6d3">` tags point at the old bodies. The convention flip never reaches his page. The bug is the old bug, on the old code.

**Confirm/refute in 5 seconds:** John does **Cmd+Shift+R** (hard refresh in Brave). If wires stay idle after a resize, this was it.

#### H2 (≈15%) — silent phantom `lockedSet`

If the status bar's `LOCK —` doesn't faithfully reflect `local.lockedSet.size`, John may have clicked a node before resizing without realizing the lock stuck. With `lockedSet.size > 0`, `focusedSetFor` returns a non-null set, every connected edge ends up state=1 (HOT under new convention), and on resize the camera re-fit makes the previously-already-HOT edges more visually prominent (closer zoom, thicker clamped strokes, more pixel buildup).

**Confirm/refute:** add `lockedSet.size` to the status-strip render, OR expose `window._forgeDebug.lockedSize()` so John can `console.log` it after the bug appears. If it's > 0 when the status bar shows `—`, this is it.

#### H3 (≈5%) — DPR=2 or real-GPU-only path

The preview iframe runs at DPR=1 with a throttled background-tab GPU pipeline. John's retina display + foreground real GPU could expose:

- A buffer-reuse race that's invisible at the iframe's slower frame cadence
- A swap-chain reconfigure ordering issue specific to certain Chrome / GPU driver combos
- A `wire_min_screen_px * dpr` clamp behavior that pins every wire to the visible minimum at his viewport size

Lowest priority because the JS-side state is already proven correct in §H1's preview verification — for the bug to be real-GPU-only, the GPU would have to be reading state values that disagree with what JS wrote.

### Concrete next-action checklist for the agent picking this up

1. **Ask John to Cmd+Shift+R.** If the bug goes away, confirmed H1 — no further code change needed. Document the "hard refresh after a convention change" requirement in the agent runbook so this doesn't recur.
2. If H1 doesn't fix it, **run §6 of this audit IN FULL on John's machine** (not the preview). Specifically:
   - §6.3 no-focus → resize → confirm wire state in his real browser. Use `console.log(window._forgeDebug.lockedIds(), window._forgeDebug.hoverId())` immediately after the bug appears to rule out H2.
3. If still failing after H1 + H2 ruled out, **add a real GPU-side state probe**: expose a renderer method `_debugReadEdgeStates()` that uses a `GPUBufferUsage.MAP_READ` staging buffer to read back the actual edge-state VBO contents. Compare against `local.edgeStates`. Any disagreement is the smoking gun for H3.
4. **Bump the dev-panel LS_KEY v4 → v5** in the next batch even if H1 is the cause, just to flush any drift between persisted params and shipped defaults. Cheap belt-and-braces.
5. **Update the agent runbook**: future "verified live" claims must enumerate which §6 steps were run, not just say "verified." 6d4's verification was a single focused-state test that didn't cover the actual repro.

### What the auditor (me) is NOT recommending

- Do **not** revert the convention flip. The structural fix is correct and the preview confirms it. Reverting reopens the bug class.
- Do **not** add a fourth defensive write path on the resize/mode-switch trail. The pattern of "patch one more downstream path" is what produced the multi-attempt history this audit was supposed to end.

— addendum closed 2026-05-18 PM

---

## FINAL DIAGNOSIS — 2026-05-18 EVENING — read this first, supersedes everything above

**The user-visible "wires lit up after resize" bug had NOTHING to do with edge-state buffers.** Five sessions of work (phase-5d, phase-6d3, the audit's convention flip, the cache-bust bump, the GPU readback probe) all targeted a real latent state-buffer bug — but **the bug John was pointing at the whole time was a different one entirely**: the **Forge dev panel desyncs from the engine on view remount.**

### How we got to ground truth

The GPU readback probe (`opus-forge-edge-state-readback`, commit `6b09d35`) returned this when John reproduced the visible glitch:

- `js.edgeStates`: 3033 zeros, 0 ones, focusedSet `null`
- `gpu.edges`: 3072 zeros, 0 ones (matching sample hash)
- `palette[0]` (transmission hot): `#C9743A` orange
- `params.idle_color_fusion`: `#C4783A` amber

JS = GPU = all-zero. Under the post-flip convention, all-zero means all-idle. **The state buffer was provably correct**. The convention flip works exactly as the audit promised.

But the wires looked bright orange. Why? Because `params.idle_color_fusion` was **amber** at the moment of the dump — even though the dev panel UI displayed every idle colour as `#3A4A66` slate. The panel's stored state and the engine's `local.params` had drifted apart.

When John ran this directly from the console:
```js
window._forge.setParam('idle_color_fusion', '#3a4a66');
window._forge.setParam('idle_color_polemic', '#3a4a66');
```
**the wires immediately turned slate.** The rebake fires correctly; the engine accepts the value; the GPU updates. The pipeline is intact.

### The actual bug

In `src/js/engine/dev-panel-forge.js`:

1. The panel boots via `tryBoot(retries)` (line 629) — retries up to 20× 200ms = 4 seconds.
2. On boot, it calls `applyAllToEngine()` which loops through `state.params` and calls `window._forge.setParam(id, value)` for each.
3. **`applyAllToEngine` only runs once** — at panel-boot time, if `window._forge` is ready.

In `src/js/views/forge.js`:

1. `render()` initializes `local.params = Object.assign({}, PARAM_DEFAULTS)` on every view mount.
2. So **every time the Forge view (re)mounts** — page load on a different view followed by clicking Forge, hash router triggering a re-render, etc. — `local.params` resets to the hard-coded code defaults (amber Fusion).
3. **The dev panel does not re-apply its stored state on view remount.** It's a one-shot boot push.

### The race / drift sequence

| Step | Engine `local.params.idle_color_fusion` | Dev panel `state.params.idle_color_fusion` (display + LS) |
|---|---|---|
| 1. Page loads on Pantheon view | (Forge not mounted) | slate (loaded from LS) |
| 2. Dev panel `tryBoot` runs, `window._forge` not present yet, retries | — | slate |
| 3. Dev panel retries time out (4 s) | — | slate |
| 4. John clicks Forge tab → `render()` runs | **amber** (code default) | slate |
| 5. John opens dev panel | amber | slate (displayed in input fields) |
| 6. Wires render amber. John sees panel saying slate. **Drift visible.** | amber | slate |

OR equivalently:

1. Page loads on Forge, panel boots, applies slate. Engine = slate. Wires = slate. ✓
2. John switches to Pantheon and back, OR a hash-router event fires `render()` again.
3. `render()` re-initializes `local.params` to code defaults. Engine = amber.
4. Dev panel still shows slate (its own state.params untouched).
5. Drift.

The "after resize" pattern was a red herring — resize itself doesn't reset params (it calls `rebakeEdges()` which uses current `local.params`). What likely happened in John's repros: opening DevTools or the dev panel triggered a layout reflow that interacted with view-mount semantics, or a hash navigation he didn't notice. The *trigger* varied; the *underlying cause* was always step 3 above.

### Why the wires looked "lit up" specifically

The user's dev panel had every `active_color_*` set uniformly to `#C9743A` (orange). The code's `PARAM_DEFAULTS` for `idle_color_fusion` is `#C4783A` (also amber). Plus Fusion is in `HEADLINE_BUCKETS` → idles in its bucket hue when there's no override. **Idle Fusion and Hot Fusion paint nearly identical orange.** With 1977 fusion edges (65% of total) layered through the wheel centre via premultiplied alpha at 30% per edge → 10 overlapping crossings = full saturation. The wheel centre filled with amber regardless of whether wires were technically "hot" or "idle". John could not visually distinguish the two states because his tuned palette had collapsed them onto one colour.

### The fix John adopted (Option A — workflow only, no code change)

1. Stay on Forge view; do not navigate away or reload.
2. Tweak every dev-panel parameter to the desired state.
3. Click `EXPORT` in the panel — JSON copies to clipboard.
4. Paste the JSON into `PARAM_DEFAULTS` in `src/js/views/forge.js`.
5. After that bake, the engine's "default" *is* the tuned state. The dev panel becomes "fine-tune from here" instead of "first source of truth." Drift cannot occur.

### The structural fix that should follow (Option B — code change, recommended)

The dev panel should re-apply its `state.params` to the engine whenever the Forge view (re)mounts. Two reasonable implementations:

1. **Pull on mount:** `views/forge.js render()` checks for `window.AtlasEngineForgeDevPanel` and calls `getState()` to seed `local.params` from the panel's stored state instead of from `PARAM_DEFAULTS`. Cleanest.
2. **Push on mount:** Forge dispatches a `forge:mounted` event. Dev panel listens, calls `applyAllToEngine()`. Looser coupling but more moving parts.

Either way, **`PARAM_DEFAULTS` should remain the ground-zero fallback** for first-ever load (before the panel has any stored state). The dev panel's stored state is the authoritative source after that.

### Lessons (for me, for the next agent)

1. **Read the GPU before writing any audit doc.** I wrote an audit, two follow-up commits, and four agent prompts before shipping the readback that confirmed the state buffer was always correct. That readback would have rerouted everything on day one.
2. **When the user says "the panel shows X but the wheel shows Y," believe them.** John told me this multiple times. I kept theorising about HEADLINE_BUCKETS and premultiplied alpha instead of testing the trivial hypothesis: panel and engine are out of sync.
3. **Dev panel ↔ engine drift is a real category of bug in this codebase.** Boot-races, view-remount resets, LS_KEY schema bumps. Every dev panel in this app needs the same audit: does it sync on view-mount, not just on panel-boot?
4. **The convention flip was right, but it wasn't the user's bug.** Two correct, unrelated fixes shipped while the actual reported bug went undiagnosed. Keep these threads separate in commit messages and audit docs going forward.

### Open work (for the next agent who picks this up)

- [ ] Bake John's tuned `PARAM_DEFAULTS` after he hits EXPORT (paste-in task).
- [ ] Implement Option B (engine pulls panel state on view-mount) so the drift category goes away permanently.
- [ ] Audit `src/js/dev-panel.js` (Pantheon V2's dev panel) for the same drift pattern — likely has it too.
- [ ] Consider removing `phase-6d3`'s `forceWriteEdgeState` belt-and-braces now that the GPU readback has confirmed it was never needed. The convention flip alone is sufficient.

— final diagnosis closed 2026-05-18 evening
