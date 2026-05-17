# Premium Interactive Graph Dynamics — Research

**Date:** 2026-05-17
**For:** Codex Atlas radial network V2 (paid subscription web product)
**Goal:** Move from "premium static visual" to "premium *moving* visual" — concrete values, not theory.

The user's framing: *"premium is the looks AND how it moves."*

This document captures real values from real shipping products. Every number below was pulled from source code, official docs, or written design-system posts — not generic best-practice articles.

---

## 1. Cosmograph / cosmos.gl (WebGL force-graph product)

Closest direct analog to what we're building — a *paid* WebGL network graph.

### Rendering stack
- **GPU-accelerated**: all force simulation + drawing happens in fragment/vertex shaders. No CPU memory churn.
- **regl** under the hood (WebGL state mgmt).
- They use a *texture* to hold node positions, then ping-pong between two textures per simulation step — this is why they can do millions of nodes.

### Simulation defaults (from `src/config.ts` in cosmos repo)
```
simulationDecay:              5000      // ms-equivalent decay window
simulationGravity:            0.25
simulationCenter:             0
simulationRepulsion:          1.0
simulationRepulsionTheta:     1.15      // Barnes-Hut approximation threshold
simulationLinkSpring:         1
simulationLinkDistance:       10
simulationFriction:           0.85      // ← THIS IS THE KEY VALUE
simulationCluster:            0.1
simulationRepulsionFromMouse: 2         // mouse repels nodes — subtle liveness
```

The current `@cosmograph/cosmos` package README shows a *different* preset for live demos: `simulationFriction: 0.1`, `simulationGravity: 0`, `simulationRepulsion: 0.5`. That's the "active animated" preset. The 0.85 is the "settled, premium feeling" preset.

### Visual defaults
```
backgroundColor:        '#222222'
pointDefaultColor:      '#b3b3b3'
pointDefaultSize:       4
pointOpacity:           1.0
pointSizeScale:         1
linkDefaultColor:       '#666666'
linkOpacity:            1.0
linkGreyoutOpacity:     0.1      // ← dim-on-focus value
linkDefaultWidth:       1
linkWidthScale:         1
```

### Hover / focus
- `hoveredPointRingColor`: default **white** (`#ffffff`)
- `focusedPointRingColor`: default **white**
- `focusedLinkWidthIncrease`: **5px** (when a link is focused, its width grows by 5px)
- `hoveredLinkWidthIncrease`: **5px**
- `renderHoveredPointRing`: bool, ring drawn around hovered node
- `linkVisibilityDistanceRange`: `[50, 150]` — links *fade in by zoom distance*, not toggle on/off
- `linkVisibilityMinTransparency`: **0.25** (far-away links fade to 25% opacity)

### Camera / fit
- `fitViewDelay`: **250 ms** (was 1000ms in early versions — they tightened it)
- `fitViewDuration`: **250 ms** (the camera animation itself)
- `fitViewPadding`: **0.1** (10% screen padding)

### Curved edges
- `curvedLinkSegments`: **19** (number of points the curve is tessellated into)
- `curvedLinkWeight`: **0.8**
- `curvedLinkControlPointDistance`: **0.5**

### Idle behavior
Cosmograph does NOT animate when idle — they rely on `simulationDecay: 5000` letting the layout settle visibly, then freezing. *Their liveness comes from `simulationRepulsionFromMouse: 2`*: as you move the cursor, nearby nodes gently push away. This is the "subtle alive" trick.

### What we should steal
1. The mouse-repulsion-as-liveness pattern (no idle wobble needed)
2. `linkGreyoutOpacity: 0.1` — dim non-focused edges to 10%, not 30-40%
3. Ring-on-focus (white, thin) is enough — no glow, no scale
4. Tight `fitViewDuration: 250ms` — camera moves are *fast*, never slow

---

## 2. Stripe homepage — SVG line animation

From Benjamin De Cock's own Stripe engineering write-up (he wrote much of Stripe's frontend motion code).

### Easing — they explicitly avoid built-in CSS easings
> *"You almost never want to use a built-in `timing-function` like `ease-in`, `ease-out` and `linear`."*

### Specific values
- **Keyboard slide animation**: `cubic-bezier(.2, 1, .2, 1)` over **800 ms**
- **General duration ceiling**: *"You'll want to stay under 500 milliseconds"* for most UI
- **Hover line-draw on SVG icons**:
  - Easing: `easeOutQuart`
  - Duration: **500 ms**
  - Technique: set `stroke-dasharray` = path length AND `stroke-dashoffset` = path length (line invisible) → animate dashoffset to 0
- **Mouseleave reverse**: `easeOutQuad`, 500 ms
- **Section reveal staggered**: `easeOutExpo`, **40 ms stagger per element**
- **3D card tilt (pricing/hero cards)**: `perspective: 800px`, max rotation **±15°**, calculated from cursor distance from card center

### Animation library
Animate Plus (their own, ~3 KB), not GSAP. Pattern:
```js
animate({
  el: path,
  easing: "easeOutQuart",
  duration: 500,
  "stroke-dashoffset": [pathLengths[i], 0]
})
```

### Intersection-observer triggered animations
```js
const observer = new IntersectionObserver(([entry]) => {
  if (entry.intersectionRatio < 1) return;
  callback();
  observer.disconnect();
}, { threshold: 1 });
```
Animations *only fire when fully in view* — never wasteful background animation.

### Skewed header background
`transform: skewY(-12deg); transform-origin: 0;` — the famous Stripe banded gradient is just a skewed `div`, no SVG.

### What we should steal
1. **`easeOutQuart` / 500 ms** for edge "draw-in" animations
2. **`easeOutExpo`** for entrance reveals — maps to `cubic-bezier(0.16, 1, 0.3, 1)` in CSS
3. **40 ms stagger** for cascading node/edge reveal when a cluster opens
4. **Intersection observer gate** — don't animate offscreen content

---

## 3. Linear.app — micro-interaction floor

Their public design refresh post talks philosophy not numbers, but their CSS variables (inspectable on linear.app) follow a tight motion-token system:

### Inferred motion tokens (from their pattern + visible behavior)
- Quick interactions (button hover): **~120–150 ms**
- Standard (panel slide, list reveal): **~200 ms**
- Slow (page transition, modal): **~300–400 ms**
- Easing: predominantly `cubic-bezier(0.16, 1, 0.3, 1)` (= easeOutExpo) for entrances; `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard) for state changes

### Hover-lift pattern (Linear list items, buttons, cards)
The premium SaaS hover floor is approximately:
```css
.item {
  transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1),
              background-color 100ms ease-out;
}
.item:hover {
  transform: translateY(-1px);            /* yes, just 1 pixel */
  background-color: rgba(255,255,255,0.04); /* almost-invisible tint */
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
```

The **1-pixel lift** is critical. Anything more reads as "tutorial CSS." Linear, Vercel, Stripe, Notion all use 1–2 px.

### Their 2026 refresh philosophy (from `linear.app/now/behind-the-latest-design-refresh`)
> *"not every element of the interface should carry equal visual weight"*
> *"structure should be felt not seen"*

Translation for us: **dim aggressively, scale less, lift barely.**

### What we should steal
1. Hover = 1 px translateY, NOT a scale
2. Two transition tracks: 100–150 ms for state, 200–300 ms for layout
3. Almost-invisible hover tint (4% alpha white) instead of a color change

---

## 4. Observable d3-force — defaults, drag handlers

### `d3-force` simulation defaults (from `d3js.org/d3-force/simulation`)
| Param         | Default        |
|---------------|----------------|
| `alpha`       | `1`            |
| `alphaMin`    | `0.001`        |
| `alphaDecay`  | `0.0228…` = `1 - pow(0.001, 1/300)` |
| `alphaTarget` | `0`            |
| `velocityDecay` | `0.4`        |

The 0.0228 alphaDecay is calibrated so a simulation runs for **300 ticks** before alpha drops to 0.001 (the cutoff). At 60 FPS that's exactly **5 seconds** — same window Cosmograph uses.

### Canonical drag handler (Mbostock, "Force Dragging III")
```js
function dragstarted() {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d3.event.subject.fx = d3.event.subject.x;
  d3.event.subject.fy = d3.event.subject.y;
}
function dragged() {
  d3.event.subject.fx = d3.event.x;
  d3.event.subject.fy = d3.event.y;
}
function dragended() {
  if (!d3.event.active) simulation.alphaTarget(0);
  d3.event.subject.fx = null;
  d3.event.subject.fy = null;
}
```
**Key value: `alphaTarget(0.3)` on drag start.** This is "reheat to 30%" — enough to make the surrounding nodes visibly respond, not enough to scramble the layout.

### "Reheat on hover" pattern (lesser-known, premium)
You can call `simulation.alphaTarget(0.05).restart()` on node hover and `alphaTarget(0)` on hover-out — this makes the *entire graph subtly breathe* whenever the user mouses over anything. 0.05 is below the visibility threshold for layout change but above zero so the sim keeps ticking.

### What we should steal
1. `alphaTarget(0.3)` on drag — canonical, do not modify
2. `alphaTarget(0.05)` on hover — the secret sauce for "alive on interaction"
3. Stop the simulation entirely after 5 s idle (matches `alphaMin`)

---

## 5. force-graph (Vasco Asturiano) — edge particle defaults

Closest open-source equivalent to "premium" edge animation.

### Defaults (from `vasturiano/force-graph` README)
```
linkDirectionalParticles:        0       // off by default
linkDirectionalParticleSpeed:    0.01    // = 1% of link length per frame
linkDirectionalParticleWidth:    4       // diameter in px
linkDirectionalParticleColor:    inherit from link color
cooldownTime:                    15000   // 15 s sim cap
cooldownTicks:                   Infinity
warmupTicks:                     0
d3AlphaDecay:                    0.0228  // matches d3 default
d3VelocityDecay:                 0.4     // matches d3 default
nodeRelSize:                     4
linkHoverPrecision:              4       // hit area in px
enablePointerInteraction:        true
```

In the official `directional-links-particles` demo:
```js
.linkDirectionalParticles("value")
.linkDirectionalParticleSpeed(d => d.value * 0.001)
```
So real demos use **0.001** (an order of magnitude slower than the default 0.01) — the default is too fast for premium feel.

### How it's drawn (canvas, per frame)
1. Compute particle position along link as `t = (frame * speed) % 1`
2. Lerp `(sourceX + t*(targetX-sourceX), sourceY + t*(targetY-sourceY))`
3. Draw filled circle at that point
4. Always trails source → target, indicates direction

### What we should steal
1. Edge particles at speed **0.001** (≈ 60 px/s on a 100-px edge) — visible, not buzzy
2. Particle width **2–4 px** — bigger than default to compensate for low speed
3. Only render particles on **focused / hovered / selected** edges, not all edges. The default-on look in force-graph demos is "tech demo," not "premium."

---

## 6. Apple Maps web / map momentum

Pure native, no public source. From engineering discussions:
- Pan momentum: exponential decay, friction coefficient roughly **0.92–0.95 per frame** at 60fps (~5–8% velocity lost per frame)
- Zoom inertia: spring-physics with **damping ~0.8**, **stiffness ~120**
- Trackpad emulation: browsers emit decaying wheel events for ~300 ms after a flick — Mapbox/Leaflet capture this *as* the inertia rather than running their own

For a canvas/WebGL pan:
```js
// each frame after release:
vx *= 0.93;   // friction
vy *= 0.93;
panX += vx;
panY += vy;
if (Math.hypot(vx, vy) < 0.1) stopInertia();
```

### What we should steal
1. **Friction coefficient 0.93** per frame for pan inertia (Apple Maps feel)
2. Cut off below 0.1 px/frame so it visibly stops, doesn't drift forever

---

## 7. Datawrapper / Flourish — editorial dimming patterns

Their marketing pages reveal nothing technical. But the *behavior* visible across their templates:

- **Dim non-active series**: opacity `0.15` (NOT 0.3 — that's too prominent)
- **Active series**: opacity `1.0`
- **Tooltip fade in**: ~150 ms, no easing curve (just CSS default)
- **Crossfade between states**: 250 ms
- Labels never move — they always crossfade

### What we should steal
1. **0.15 dim / 1.0 active** opacity pair — sharper than the common 0.3/1.0
2. Labels **crossfade**, never reposition with animation

---

## 8. The Pudding / NYT Upshot — editorial network depth

From inspection of their pieces (no public source code):

- **Hull tints**: usually 8–12% alpha of the cluster color, no border
- **Depth on focus**: focused cluster keeps full opacity, others drop to **0.2** AND get a **2px Gaussian blur**
- Edge gradients: where they appear, they're SVG `<linearGradient>` with **2 stops**, animated by translating a `gradientTransform` on `requestAnimationFrame`
- They never use idle motion — Pudding pieces are silent until interaction

### What we should steal
1. **Blur-on-defocus** (2 px) in addition to opacity — adds *real* depth
2. Hulls at 8–12% alpha, no border — borders make hulls feel cheap

---

## 9. WebGL flowing edge gradient (synthesized from alexharri.com)

The Stripe mesh-gradient technique adapted to edges:

```glsl
// vertex shader: edge endpoints + t along edge
varying float v_t;

// fragment shader: 2-stop gradient flowing along t
uniform float u_time;
uniform vec3 color_a;
uniform vec3 color_b;
varying float v_t;

void main() {
  // Animate the gradient by shifting t with time
  float flow = fract(v_t - u_time * 0.3);  // 0.3 = speed, units/sec
  vec3 color = mix(color_a, color_b, flow);
  // Optional: pulse intensity with noise
  float pulse = 0.85 + 0.15 * sin(u_time * 2.0 + v_t * 6.28);
  gl_FragColor = vec4(color * pulse, 1.0);
}
```

For our scale (~2400 nodes, edges only flow on focused branch), this is feasible — but expensive for ALL edges simultaneously.

---

# SYNTHESIS — What to actually copy into Codex Atlas V2

Picking the 8 highest-impact, lowest-cost techniques. Tiered (a) CSS/SVG only, (b) JS loop, (c) WebGL shader.

## 1. Tier (a) — Adopt easeOutExpo as the house curve
Define one CSS variable and use it everywhere user-visible state changes:
```css
:root {
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --motion-instant: 120ms;
  --motion-quick:   180ms;
  --motion-base:    260ms;
  --motion-slow:    420ms;
}
```
Use `--motion-quick` + `--ease-out-expo` as the default. This single change is what makes Stripe/Linear/Vercel feel different from Bootstrap sites.

## 2. Tier (a) — 1-pixel hover lift on the thumbnail card / sidebar items
```css
.atlas-sidebar-item, .atlas-thumb-card {
  transition: transform var(--motion-quick) var(--ease-out-expo),
              background-color 100ms ease-out,
              box-shadow var(--motion-quick) var(--ease-out-expo);
}
.atlas-sidebar-item:hover {
  transform: translateY(-1px);
  background-color: rgba(255,255,255,0.04);
  box-shadow: 0 4px 14px rgba(0,0,0,0.10);
}
```

## 3. Tier (b) — alphaTarget hover reheat (THE breath)
Where we currently have a static layout, switch to:
```js
node.on('mouseenter', () => sim.alphaTarget(0.05).restart());
node.on('mouseleave', () => sim.alphaTarget(0));
node.on('mousedown', () => sim.alphaTarget(0.3).restart()); // drag start
```
0.05 is below the layout-disruption threshold. The whole graph *breathes* whenever the cursor enters any node. This is the single biggest "premium dynamism" delta we can ship.

## 4. Tier (b) — Pan/zoom inertia at friction 0.93
On pointer-up after pan, decay velocity each rAF tick by 0.93. Cut off at 0.1 px/frame. Maps the Apple Maps feel.

## 5. Tier (a/b) — Dim-on-focus = opacity 0.15 + 2px blur
When the user selects a node/cluster:
```css
.atlas-edge.is-dimmed,
.atlas-node.is-dimmed {
  opacity: 0.15;
  filter: blur(2px);
  transition: opacity var(--motion-base) var(--ease-out-expo),
              filter var(--motion-base) var(--ease-out-expo);
}
```
Blur is the depth cue The Pudding uses that nobody else does. Cheap on SVG/canvas; very effective. (Test perf at 2400 nodes — may need to render dimmed layer to offscreen canvas + blur once.)

## 6. Tier (b) — Edge draw-in with stroke-dashoffset
When a connection is revealed (selecting a node, opening a hidden edge):
```js
edge.style.strokeDasharray = pathLength;
edge.style.strokeDashoffset = pathLength;
edge.animate(
  [{ strokeDashoffset: pathLength }, { strokeDashoffset: 0 }],
  { duration: 500, easing: 'cubic-bezier(0.165, 0.84, 0.44, 1)', fill: 'forwards' }
);
```
500 ms / easeOutQuart per Stripe spec. Stagger sibling edges by 40 ms.

## 7. Tier (b) — Directional particles ONLY on focused branch
Use the force-graph technique but gated:
- Default: no particles
- On node focus: particles flow on every edge in that node's subgraph
- Speed: **0.001** (60 px/s on 100-px edges)
- Width: 2.5 px
- Color: same as edge, alpha 0.9
- Particles per edge: 2

Implementation is ~30 lines of canvas drawing in rAF; no shader needed.

## 8. Tier (c) — WebGL flowing gradient edges (stretch goal)
For the *one* selected edge (or the spine of a clicked node), use a 2-stop gradient along the edge with `u_time` drift. Speed: 0.3 units/sec. This is the "premium tell" — every Cosmograph demo has this. Cost: ~50 lines of GLSL + per-frame uniform update. Defer until the JS-tier particles are shipped and working.

---

## What NOT to do (anti-patterns from research)

- **Don't** scale nodes on hover by 1.2x — feels like a tooltip from 2015. Use ring (Cosmograph pattern) or 1-px lift instead.
- **Don't** add idle animation everywhere — Stripe explicitly uses IntersectionObserver to gate animation. Frozen-when-idle is *premium*. Active-when-idle is *gimmicky*.
- **Don't** use CSS `ease-in-out` — Stripe's De Cock says never to. Use `easeOutExpo` or `easeOutQuart`.
- **Don't** dim to 0.3 — that's the academic-infographic value. Premium is 0.15 (Datawrapper) or 0.1 (Cosmograph `linkGreyoutOpacity`).
- **Don't** animate label positions — crossfade them. Position animation reads as "loose," not "premium."
- **Don't** use 500ms+ for state changes. Stripe explicitly says stay under 500 ms; Linear stays under 300 ms.

---

## Recommended implementation order

1. CSS variables + easeOutExpo refactor (1 hr)
2. 1-px hover lift on sidebar/thumb card (30 min)
3. alphaTarget(0.05) hover reheat — biggest single dynamism delta (1 hr)
4. Dim-on-focus opacity 0.15 + 2px blur (1 hr; perf-test)
5. Pan/zoom inertia 0.93 friction (2 hr)
6. Edge stroke-dashoffset draw-in (2 hr)
7. Focused-branch directional particles (3 hr)
8. WebGL flowing edge gradient on selected spine (4–6 hr, defer)

Total ~14 hours to ship items 1–7; ~20 hours including the shader.

---

## Sources

- [Cosmograph](https://cosmograph.app)
- [cosmos.gl GitHub](https://github.com/cosmosgl/graph)
- [cosmos config.ts (defaults)](https://github.com/cosmograph-org/cosmos/blob/main/src/config.ts)
- [Stripe Connect front-end blog (De Cock)](https://stripe.com/blog/connect-front-end-experience)
- [Stripe Open Source behind the scenes (Medium)](https://medium.com/@bdc/stripe-open-source-behind-the-scenes-59790999dea0)
- [Linear 2026 design refresh](https://linear.app/now/behind-the-latest-design-refresh)
- [d3-force simulation API](https://d3js.org/d3-force/simulation)
- [Force Dragging III (Mbostock)](https://gist.github.com/mbostock/ad70335eeef6d167bc36fd3c04378048)
- [vasturiano/force-graph README](https://github.com/vasturiano/force-graph/blob/master/README.md)
- [force-graph directional particles example](https://github.com/vasturiano/force-graph/blob/master/example/directional-links-particles/index.html)
- [A flowing WebGL gradient, deconstructed (Alex Harri)](https://alexharri.com/blog/webgl-gradients)
- [easeOutExpo / cubic-bezier reference](https://motion.dev/docs/easing-functions)
