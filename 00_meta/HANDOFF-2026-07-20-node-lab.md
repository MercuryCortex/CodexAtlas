# HANDOFF — NODE LAB design mission (2026-07-20)

> Self-contained pickup for a fresh agent after John's account swap. Read this + the
> auto-memory index, then continue the design loop with John. **He is mid-flow dialing
> the node look — do not restart the design conversation from zero.**

## The mission
Redesign the deities-Atlas **nodes** (main page, the wheel) to be top-tier, tasteful,
alive-but-still, via a live mockup lab John dials himself. When John copies a **recipe
line** and says "this one," implement it in the real engine (`NODE_SHADER`).

## The lab (source of truth)
- **File: `design/node-lab.html`** (committed; the ONLY artifact source).
- Serve: `.claude/launch.json` → name **"atlas"** → `http://localhost:8742/design/node-lab.html`.
- Old artifact URL `claude.ai/code/artifact/43c89499-…` belongs to the OLD account —
  a new session/account **cannot** update it. Republish `design/node-lab.html` as a NEW
  artifact (favicon 🔮, title "Codex Atlas — Node Lab") and give John the fresh link.

## Ratified design law (cumulative — John's verdicts, do not relitigate)
1. **The canonical ring is canon.** No beads, no replacing the ring. Hero = dress OVER it.
2. **Rest is still.** Zero motion, zero halo in the resting field (verified 0 px drift).
   Life = **the wake**: liquid glass grows over nodes near the cursor only.
3. Bubble is only *slightly* bigger than the node; node zooms on hover, more on click
   (lock); the bubble follows the zoom.
4. **Glow**: pulsating, exists ONLY behind awake nodes, bends through the glass. Core
   dot pulses subtly, never to white.
5. **Dead forever**: RGB prism ("future techno"), the white specular blob, anything
   spinning on hover, the always-on halo gradient, flat-stripe sheen, solid glass beads.
6. **Grounds**: Deep Void (starfield) = lab default, John loves it; Obsidian approved;
   Nebula/Inkwell theme drawer.
7. **Finishes stack** (chips): Iridescence (John loves — default ON), Chroma (with
   spread slider), Sheen (sphere-flow arc glint, one sweep per wake, never loops).
   Depth slider = figma-like edge bulge.
8. **Honest zeros law**: refract 1.0 + frost 0 + depth 0 ⇒ lens draws NOTHING (this
   fixed a real seam bug — annulus clips must moveTo before the inner arc, no chord).
9. **Labels**: 3 fonts (Mono instrument / Serif codex / Sans) × 3 motions (Condense /
   Rise / Unveil), group rule = hovered > locked > wake priority, overlapping neighbors
   skipped. Proposed app behavior: wake reveals, selected keeps, deep zoom shows.
10. Hulls/The Eye (section 04): hairline + 4% fill, label on hull edge, isolate = camera
    move (Forge engine — NEVER a bespoke DOM renderer, cardinal rule).

## The rig
12 sliders (bubble/hoverZ/clickZ/refraction/frost/glow/pulse/glowReach/finishStrength/
wakeRadius/chromaSpread/depth) + finish chips + label voice/motion chips → live
**RECIPE line + Copy**. The recipe string IS the engine spec (uniform values).

## Next steps (in order)
1. John keeps dialing; iterate the lab on his feedback (edit `design/node-lab.html`,
   commit each round `DESIGN-NODE-LAB-N`, STATUS entry, republish artifact).
2. On "this one" + recipe → implement **tier (a)** in `NODE_SHADER`
   (`src/js/engine/renderer/webgpu.js`, loaded via direct `<script ?v=>` in index.html
   — bump `?v=` to bust Safari cache; see memory `reference-forge-node-glass-shading-2026-07-19`).
   Dress-level = one uniform; Minimal toggle = LOD floor = same dial.
3. Tier (b) later: render-to-texture TRUE refraction (flagship FX; Safari-test first).

## Lab-editing gotchas (all learned the hard way)
- Color helper `hx()` must parse hex AND `rgb()` strings (bitwise NaN→0 silently blackens).
- Browser pane when backgrounded: 0×0 viewport + throttled rAF → `resize_window` first,
  drive frames with `window.__lab.step(dt)`, screenshot deep sections via negative
  `body` margin (scrolled screenshots come back black).
- The Write hook flips the pane to a static file:// view → `preview_start` "atlas" again.
- Commits: DESIGN-NODE-LAB-4 `ce93cc59` · 4b `e9c0eae6` · 4c `03b4058b` · 4d `f48b591f`.
