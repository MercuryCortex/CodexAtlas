# `src/js/engine/` — Atlas Proprietary Rendering Engine

> **Read this before editing anything in this folder.** This is load-bearing infrastructure for the Forge tab (the proprietary WebGPU successor to Pantheon V2's hybrid Sigma + SVG stack).

---

## Why this folder exists

Pantheon V2 (`src/js/views/pantheon-v2.js`) runs on a Sigma + SVG hybrid that's adequate for ~660 nodes / 3k edges but **not** the foundation for the product ambition John has stated: "the most gorgeous visual representation of human history's cross-tradition transmissions ever produced, the most ROBUST system at thousands of nodes."

The Forge tab is the parallel-build of a proprietary engine that does carry that ambition. Same pattern as Pantheon V2 was — isolated route, zero risk to production, graduates when proven.

See `AGENTS.md → Craft doctrine` for the load-bearing rules:
1. We are NOT shipping until the app is 100 % done. No "ship fast" posture.
2. Re-evaluate tech at every friction signal.
3. Proprietary, not rented. No commercial / SaaS dependencies.
4. Forward compatibility — engine contracts mirror the portable core so future Rust+WASM port stays mechanical.

---

## What's in here

| File | Purpose | Status |
|---|---|---|
| `contract.js` | Public API the view layer talks to. The ONLY surface the rest of the app sees. Defines `Renderer`, `Scene`, `Camera`, draw-op shapes. | Phase 0 |
| `types.js` | Visual style vocabulary — `Transform`, `Style`, `Gradient`, `BlendMode`, `Shadow`. Hand-mirrored from the portable core's `types.ts` which itself mirrors the portable core Rust structs. Future WASM port = mechanical swap. | Phase 0 (ported) |
| `math.js` | Affine transform math, world↔screen, bezier helpers, bounds, hit-testing primitives. Ported from the portable core's `canvasGeometry.ts`. Pure functions, no state. | Phase 0 (ported) |
| `renderer/webgpu.js` | The WebGPU renderer. The ONLY file in the engine that knows about GPU APIs. Implements `contract.js`'s draw-op interface. | Phase 1 |
| `graph/node.js`, `graph/edge.js`, `graph/hull.js`, `graph/glyph.js` | Atlas-specific graph primitives. Composed by view modules. | Phase 2 |
| `layout/radial.js`, `layout/timeline.js`, `layout/map.js` | Layout engines per view. | Phase 3+ |

---

## Architecture invariants

These are **non-negotiable** because they're what makes a future Rust+WASM port mechanical instead of a rewrite.

### 1. View modules never touch WebGPU directly.

Atlas-specific code (in `src/js/views/forge.js` and future view modules) talks ONLY to the contract. The view layer never imports from `renderer/`, never holds a `GPUBuffer`, never writes a shader string.

❌ Wrong (view layer reaching past the contract):
```js
// In a view module:
const buffer = device.createBuffer({...});  // NO. View doesn't know about GPU.
```

✅ Right (view layer talks to contract):
```js
// In a view module:
scene.drawShape({ kind: 'circle', x, y, r, style: { fill: '#c47a3a' } });
```

### 2. Types match the portable core.

`types.js` is the type contract. Every shape it defines (Transform, Style, Gradient, etc.) has a corresponding Rust struct in the portable core crate. When fields are added or removed, the *intent* must align with the portable core's intent. This is what makes the future port mechanical.

### 3. No third-party libraries in this folder.

Every line here is ours (or ported from the portable core). No npm dependencies, no graph libraries, no rendering libraries. Browser APIs (WebGPU, WebGL2, Canvas2D, DOM) are the only "external" surface.

### 4. Pure functions where possible.

`math.js` is pure functions. So is most of `graph/`. State lives in the `Scene` object and the `Renderer`. Pure code is testable, portable, and amenable to future SIMD / Rust translation.

### 5. Performance targets are real.

| Scenario | Target FPS | Acceptable | Failing |
|---|---|---|---|
| Idle render, 1k nodes, 5k edges | 60 | 45 | <30 |
| Idle render, 10k nodes, 50k edges | 60 | 30 | <15 |
| Hover state change | < 8 ms | < 16 ms | > 32 ms |
| Pan/zoom transition | 60 | 45 | <30 |

These are not aspirational — they are the launch criterion. If the engine fails them, the engine is wrong, not the targets.

---

## What this folder is NOT

- Not a graph library. It is a rendering primitive + a graph-primitives library + layout engines, composed.
- Not a wrapper around someone else's engine.
- Not a feature-equivalent reimplementation of Sigma. Sigma was the wrong foundation; the Forge is the right one.
- Not a temporary scaffold. Anything in `engine/` should be production quality at write time.
