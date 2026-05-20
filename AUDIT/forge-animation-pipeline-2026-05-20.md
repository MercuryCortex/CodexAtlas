# Forge animation pipeline — complete history + architecture log

**Filed:** 2026-05-20
**Filed by:** opus (Lane B), per John's request: *"please try once again and log everything we did for fresh agents"*
**Status:** living doc — append a section if you change the animation pipeline. Cite the related commit.

This doc covers the Forge view's hover / click / fade animation pipeline, the iterations we've tried, what failed, what worked, and what's still imperfect. Future agents touching the Forge view's `recomputeFocus` / `tickNodeFades` / `tickEdgeFades` / `syncLabels` / `syncGlyphFocus` chain MUST read this first.

## TL;DR for fresh agents

The Forge view runs at ~60 fps WebGPU with three independent animation channels:

1. **Node state** — `(dim, selected)` per node, drives shader's `mix(idle, hot, state)` for disk color + selected glow + size
2. **Edge state** — single float per edge, drives `mix(idleColor, hotColor, state)` for wire color + width
3. **Label opacity** — DOM `<div>`s with CSS `transition: opacity 0.15s ease-out`, toggled by `data-visible` attribute

All three are driven by `recomputeFocus()` which computes targets from `local.hoverId + local.lockedSet` and kicks `animTick` (the rAF loop). The state buffer animates toward targets at `FADE_DURATION = 0.15s`.

**The hard requirement** (broken multiple times — see history): hover state changes must feel BUTTERY in BOTH "IDLE → first hover" AND "LOCKED → hover neighbor" modes. If one feels smooth and the other doesn't, you've broken something. The asymmetry was the bug we kept chasing.

## Architecture overview

### Buffers (live in `local` state)

```
local.nodeStates   Float32Array(N*2)  // interleaved (state, selected) pairs, LIVE animating
local.nodeTargets  Float32Array(N*2)  // snap-to value, updated by recomputeFocus
local.edgeStates   Float32Array(E)    // LIVE animating
local.edgeTargets  Float32Array(E)    // snap-to, updated by recomputeFocus
```

### The flow

```
pointermove
  └─> setHoverId(id)         // coalesced via rAF (see history #6)
        └─> recomputeFocus()
              ├─ focusedSet = lockedSet ∪ {hoverId} ∪ 1-hop
              ├─ selectedSet = lockedSet ∪ {hoverId}
              ├─ compute new node/edge state targets
              ├─ local.nodeTargets.set(newTargets)   // in-place
              ├─ local.edgeTargets.set(newTargets)   // in-place
              ├─ apply scrubber date-range filter (override state=1 for out-of-range)
              ├─ startAnimLoop()                     // idempotent, schedules rAF
              ├─ syncGlyphFocus()                    // DOM opacity/z-index per glyph
              └─ syncLabels()                        // flip data-visible per label

animTick (rAF, ~60Hz)
  ├─ camera.tick(dt)                                 // pan/zoom inertia
  ├─ tickEdgeFades(dt)                               // edgeStates += step toward edgeTargets
  ├─ tickNodeFades(dt)                               // nodeStates += step toward nodeTargets
  ├─ drawFrame()                                     // GPU submit if any fade in flight
  └─ if stillFading or stillMoving: re-schedule
```

### Key invariants (don't break these)

1. **Never wholesale-replace `local.nodeStates` or `local.edgeStates`.** Always `.set()` into the existing typed array. Replacing breaks fade continuity by snapping current → fresh values. (See history #3, #5.)
2. **Always update `local.nodeTargets` / `local.edgeTargets` in place** (`.set()` not `=`). Same reason.
3. **`startAnimLoop()` is idempotent** — calling it while a loop is in flight is a no-op. The existing tick keeps advancing.
4. **`animRafId` is set by both fade and camera motion.** Don't use it as a gate for "is a fade in flight" — it conflates the two. (See history #5.)

## The iteration history — every animation-related commit, what we tried, what broke

### #1 — Original fade ships (`4b0cec9`, 2026-05-19)

Animated `nodeStates` and `edgeStates` toward targets via `tickNodeFades` / `tickEdgeFades` at `FADE_DURATION = 0.10s`. CSS transition on labels.

**Worked:** the fade itself.
**Failed:** preview iframe throttled rAF so the test harness couldn't verify timing. John reported "no fade visible" — turned out the 0.10s was below his perceptual threshold.

### #2 — Bump fade duration (`4769653`, 2026-05-19)

`FADE_DURATION = 0.10 → 0.25s`. Visible, perceivable ease.

**Worked:** John saw the fade and called it "gorgeous".

### #3 — Resize re-mount regression caught (`03e1589`, 2026-05-19)

Found `src/js/app.js:10267` was calling `setView('forge')` 200ms after window resize → full Forge teardown + re-mount → camera refit to extent → wheel snapped to center. Patched to skip Forge in the global window-resize handler.

**Worked.**

### #4 — Glow clip + glyph z-order (`e52b3ea`, `4371f52`, 2026-05-19)

Two unrelated fixes — selected-node glow's square-outline artifact and glyph z-stacking inconsistency. Bumped discard threshold 0.04 → 0.08, added 1.5× quad headroom past glow, added per-glyph occlusion zones.

**Mostly worked.** John later flagged Raijin + Vairocana still showing residual clip when glow_strength was high enough. Bumped threshold again 0.08 → 0.15 in commit `536f9cb` — should be fully clean now.

### #5 — First IDLE-hover lag flagged (2026-05-20)

John: *"the first over is still slow, it takes time to be over state with the label and the size and the glow up... when focus highlighted mode all the nodes flow fast and animate."*

Multiple attempted fixes:

**Attempt A — label reflow batching (`c70f73b`):** previously `syncLabels` called `el.getBoundingClientRect()` per new label (47×reflow per hover). Batched into one reflow. **Helped DOM perf, didn't fix the perceived lag.**

**Attempt B — pre-warm fade (`536f9cb`):** pre-advance `nodeStates`/`edgeStates` 30% toward target inside `recomputeFocus` so first `drawFrame` shows visible progress.
- **IDLE-hover felt slightly better.**
- **BROKE LOCKED-hover smoothness** — every cursor move during a LOCKED fade jumped the in-flight animation 30% forward, killing the buttery flow.
- **Made clicks feel "stuck"** — rapid hover-then-click compounded the jumps before pointerup resolved.

**Attempt C — conditional pre-warm (uncommitted experiment):** gate pre-warm with `if (local.animRafId == null)`. Wrong: `animRafId` reflects camera motion too, so pan-then-hover would still feel slow.

**Plan-agent audit (in the transcript):** identified that the actual root cause was NOT the fade pipeline. It was:

> **First hover from settled IDLE creates ~47 label divs on the spot.** `appendChild` × 47 + a forced reflow → 1-2 frame render-thread stall → swallows the first fade frames visually. LOCKED-hover feels smooth because the locked node's labels ALREADY exist in DOM.

The audit also flagged `rebakeNodes` wholesale-replacing `nodeStates` (parallel bug to #5B), `recomputeFocus` not coalesced across pointermove + pointerup, `nodesById` rebuilt per hover, redundant trailing `drawFrame()`.

**Attempt D — pre-create label DOM + fade-aware rebakeNodes + remove pre-warm (`27de121`):**
- Pre-create all label DOM at `rebuildForMode` time via a single batched `DocumentFragment` append (676 labels for deities mode). Labels start at `opacity:0` (CSS default, no `data-visible`). First hover is now pure attribute flip — no DOM allocation, no reflow.
- `rebakeNodes` now mirrors the `rebakeEdges` fade-aware pattern.
- Pre-warm removed entirely (treating symptom not cause).

**Result:** John reports LOCKED-hover restored. IDLE-hover STILL feels different ("works highlighted inside, not outside").

### #6 — Architectural fixes (`<this commit>`, 2026-05-20)

John flagged the persistent IDLE-vs-LOCKED hover asymmetry as an "architectural flaw". Implementing the remaining audit recommendations:

**A. Coalesce `setHoverId` via rAF.** Previously every pointermove crossing a node boundary fired `recomputeFocus` synchronously. At 120Hz pointer events, that's 120 full recomputes per second — JS thread can't keep up with rAF (60Hz), animation stutters. Now: `setHoverId` schedules ONE `recomputeFocus` per rAF, regardless of how many pointer events fire in between. Light synchronous updates (cursor class, status text) stay immediate.

**B. Drop the redundant trailing `drawFrame()` in `recomputeFocus`.** `startAnimLoop` schedules `animTick` which calls `drawFrame` on its first iteration. The extra `drawFrame` at the end of `recomputeFocus` was one redundant GPU submit per call.

**C. Hoist `nodesById` Map to `local.mode.nodesById`.** Built once in `rebuildForMode`. The scrubber filter in `recomputeFocus` now reads from this cached Map instead of allocating a fresh object every hover.

**Why the IDLE-vs-LOCKED asymmetry persists architecturally:** even with all the above, IDLE-hover has an inherent magnitude difference vs LOCKED-hover:

- IDLE → hover: nodeStates flips ~600 values (all → mostly dim). That's the dim transition mass.
- LOCKED → hover-change: nodeStates flips ~5-10 values (small overlap shift). Tiny.

The fade animation runs equally well in both. The visual EFFECT looks "busier" in IDLE because more is changing. This is a DESIGN call — the alternative is to NOT aggressively dim everything on IDLE-hover (save dim for LOCKED). That's a UX decision for John, not a bug.

## Things the audit flagged but we haven't fixed

1. **rAF loop conflates camera motion with fade animation.** `animRafId != null` doesn't mean "fade in flight" — could be camera ease. If we ever want a "fade-in-flight" check, add a `local.fadesInFlight` boolean that `tickNodeFades` and `tickEdgeFades` update.
2. **Pre-warm is still tempting** for the IDLE-hover snap. If you bring it back, gate it on actual fade-settled state (compare buffers element-wise, short-circuit on mismatch), NOT on `animRafId`.

## Things to NOT do

1. **Don't wholesale-replace any of the state/target buffers.** Use `.set()` into the existing typed array. (Burned us in `rebakeNodes` and the early pre-warm experiments.)
2. **Don't add pre-warm without a correct "is fade settled" gate.** Each pre-warm during an in-flight fade is a visual jump.
3. **Don't call `recomputeFocus` synchronously from a high-frequency event.** Coalesce via rAF.
4. **Don't trust the preview iframe for fade timing.** Its rAF is throttled. Verify on real browser.
5. **Don't conflate camera animation with fade animation in any gating logic.**

## File map for fresh agents

- `src/js/views/forge.js` — the whole animation pipeline lives here
  - `recomputeFocus()` (~line 1340) — the central function
  - `tickNodeFades()` / `tickEdgeFades()` (~line 1450) — fade advance per frame
  - `animTick()` / `startAnimLoop()` (~line 1275) — rAF loop
  - `setHoverId()` (~line 1599) — coalesced via rAF
  - `rebuildForMode()` (~line 786) — pre-creates label DOM
  - `rebakeNodes()` / `rebakeEdges()` (~line 2100+) — must use fade-aware pattern
  - `syncLabels()` / `syncGlyphFocus()` (~line 1190 / 1525)
- `src/js/engine/renderer/webgpu.js` — node + edge shaders
  - Node fragment shader: glow falloff math, disk SDF, `final_a < 0.15` discard threshold
  - Edge vertex shader: state-to-color/width mix
- `src/styles/app.css` — label / glyph CSS
  - `.forge-label` has `opacity: 0` default + `transition: opacity 0.15s ease-out`
  - `data-visible="1"` flips to opacity:1

## How to debug fade issues

Use `window._forgeDebug.dumpBugState()` in the browser console. The dump includes:
- `js.nodeStates / nodeTargets` — bucket counts (zeros / ones / other / pairs)
- `js.edgeStates / edgeTargets` — same
- `js.timeline` — scrubber state
- `js.animRafActive` — whether rAF loop is running
- `js.focusedSetSize`, `js.lockedIds`, etc.

If states.other > 0 the buffer is mid-fade. If states.ones < targets.ones the fade hasn't completed (or got snapped back by `rebakeNodes` — see invariant #1).

## Glossary

- **IDLE state** — no hover, no lock. `focusedSet` is null. All nodes at full brightness.
- **HOVER state** — `hoverId` set, no lock. `focusedSet` = {hoverId + 1-hop}. Hovered node + neighbors highlighted, rest dimmed.
- **LOCKED state** — at least one `lockedSet` entry. Same dim/highlight semantics as HOVER but persistent across pointermove.
- **focusedSet** — the union of hoverId + lockedSet, expanded by 1-hop neighbors. Drives the dim/highlight pipeline.
- **selectedSet** — just hoverId + lockedSet (no 1-hop). Drives the glow + size pipeline.
- **Fade** — the 0.15s animation from one state to another.

— opus, Lane B agent, 2026-05-20.
