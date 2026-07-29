# HANDOFF — NODE DRESS ENGINE (2026-07-28)

> Self-contained pickup for a fresh agent. The node-lab design is FULLY TRANSCRIBED
> into the live WebGPU engine (all layers, all dials), but ONE structural rendering
> bug — diagnosed, not yet fixed — makes most light layers invisible on the real
> map. **Fix that first. It is step 1 below and it explains every complaint John
> has filed since the engine port began.**

## Where this stands

- **The mission**: `design/node-lab.html` is the ratified spec (John dialed it by
  hand; verbatim law — no curve approximations). The engine port lives in
  `src/js/engine/renderer/webgpu.js` (NODE_SHADER: vs_main/fs_main body pass,
  vs_glow/fs_glow light pass, BLIT_SHADER, backdrop texture) +
  `src/js/views/forge.js` (wake system `tickWake`, label voice in
  `renderLabelsCanvas` tail, recipe in PARAM_DEFAULTS → `frame.recipe`) +
  `src/js/forge/lab-panel.js` (the in-Atlas LAB panel; bundle via
  `scripts/build-forge-bundle.sh`; **bump `?v=` on BOTH direct script tags in
  index.html lines ~212/232-233 after every edit — Safari cache law**).
- **Commit trail (all on main)**: `3c4f66e7` full transcription · `ca2667f6`
  review-wave fixes (19 findings) · `67c923e4` glow conservation retired ·
  (this handoff's commit) John's favorite recipe as PARAM_DEFAULTS.
- **STATUS.md** entries ENGINE-DRESS-7A → 10c tell the whole story with line cites.

## ✅ STEP 1 — SHIPPED 2026-07-29 (`ENGINE-DRESS-11`)

Done exactly as spec'd below: `add_light()` helper + all nine `fs_main`
emission sites + `fs_glow` alpha. Acceptance test passed (wires hidden,
A/B vs a reverted build: OFF = discrete dots with dead gaps, ON = one
continuous bloom on the void). No damping needed yet. `?v=20260729-lightalpha`.
The diagnosis below is kept verbatim as the record of WHY.

## ⚠ STEP 1 — THE ROOT CAUSE (diagnosed 2026-07-28, FIXED 2026-07-29)

John's decisive test: *"there's no GLOW outside the node except a glow that
reveals the WIRES — if I turn off the wires idle, no glow."*

**The forge canvas is TRANSPARENT** (Phase 20G: clear alpha 0; the page bg
image/color sits BEHIND the canvas). Every pure-light emission in the node
shaders writes `rgb` with **alpha 0** (fs_glow returns `vec4(light, 0.0)`; every
`acc.rgb += X` in fs_main leaves `acc.a` unchanged). That produces INVALID
premultiplied pixels (rgb > alpha) wherever nothing opaque was drawn beneath —
and at the canvas→page composite the browser CLAMPS them: **light over
emptiness is erased.** Light survives only where the framebuffer already has
alpha: wires, rings, the orb lens. Hence every symptom to date: "glow reveals
the wires", "just masks", "no fx", icon/veil/irid invisible in the void. The
LAB never shows this because its canvas is opaque (paintBG fills the ground).

**The fix (structural, one rule): every light emission must carry alpha.**
- Add a module-scope WGSL helper in NODE_SHADER:
  `fn add_light(acc: vec4<f32>, x: vec3<f32>) -> vec4<f32> {
     let l = clamp(max(max(x.r, x.g), x.b), 0.0, 1.0);
     return vec4<f32>(acc.rgb + x, acc.a + l * (1.0 - acc.a)); }`
  and replace EVERY `acc = vec4<f32>(acc.rgb + X, acc.a)` in fs_main with
  `acc = add_light(acc, X)` (icon leaf, veil, ember heart, through-drop glow,
  gathered light, iridescence, chroma, the two accents).
- fs_glow: return `vec4<f32>(light, clamp(max(max(light.r,light.g),light.b),0.0,1.0))`
  — the glow pipeline's SCREEN blend already has alpha `one / one-minus-src-alpha`,
  so accumulated alpha composes correctly. Check the color factors still read as
  screen with nonzero src alpha (they do: color factors don't involve src alpha).
- **Acceptance test = John's own**: hide idle wires (`body.fv-hide-wires` /
  wire calm max) → the glow must remain, floating on the void. Then the bench
  side-by-side (`localhost:8742/design/node-lab.html` vs `/?lab=1`, matching
  zoom, every dress).
- Watch for double-brightening where light overlaps opaque content (alpha now
  accumulates); if hot, damp `l` by ~0.7. Verify legacy path untouched
  (recipe off ⇒ byte-identical Phase-7 disks — honest-zeros law).

## JOHN'S FAVORITE RECIPE (now the PARAM_DEFAULTS boot look)

`dress ember · hover ×1.15 · click ×1.35 · bubble 1.05 · refract 1.16 depth 1.00
· frost 1.7 · ether 1.00 · label sans/rise · glow 1.00 pulse 1.00 reach ×3.6 ·
finish 1.00 [irid+chroma] chroma± 8.0px · wake 140px cap 12 · gate 0px · core w
0.46 a 0.92 · ring a 0.20` — plus wire calm 0.6 · hot wires 0.5 · sizes
hub 40 / mid 26 / small 20 (sizes in params; hub default in repo is 34 — John ran
40, ask him). His words: "my favorite so far with these limited options" —
i.e. chosen BEFORE the light fix; re-judge everything after step 1.

## The laws (do not relitigate)

Ring is canon (one ring 0.86r + core 0.32r; outlines belong to the symbol ONLY).
Rest is still (loop dies at rest; wake = life; sticky wake while panel open).
Honest zeros (recipe_hover_zoom 0 ⇒ legacy byte-identical; zero dials draw
nothing). Verbatim lab stops — piecewise-linear, never pow() stand-ins. Dresses:
HALO star / ICON leaf / ORB glass drop (real lens: backdrop texture = ground+wires
only) / VEIL 4 breaths / EMBER obsidian+molten heart. Iridescence = FAM palette
conic (rose/sand/teal/lav), never a rainbow. Glow conservation RETIRED (wire-calm
owns flood protection). Dim law: light dims fully, symbol tints hue-preserving
(slate, 45% ink floor = ratified divergence from lab 0.32). Dead forever: prism,
specular blob, hover-spin, sheen, gold selected ring, always-on halo, white-out.
The A4 focus dim + wake coexist (meaning vs material). Labels: wake reveals,
hovered/locked keep, deep zoom shows; 3 fonts × 3 motions.

## Deferred (known, cited in STATUS 10b)

Body-pass light is ADD not screen (in-shader approximation available); backdrop
texture never shrinks back after orb cast leaves; fractional-dpr lens
misregistration; recipeStr field order vs lab; "halo-under-orb" combo chip if
John asks for light+glass together (he might — see his last message).

## Gotchas (each cost real time)

`meta` is a WGSL reserved word. `read_console_messages` serves the PREVIOUS
page-load's errors after reload — hook console.error fresh before believing
"still broken". The threshold splash ignores synthetic clicks —
`window._threshold.close()`. Camera + panel localStorage persist across reloads
(the pane's state ≠ John's browser state). Browser-pane screenshots time out
while the wake loop runs hot — detach the panel (`window.__labEl` trick) or let
wake decay first. WebGPU canvas pixels are NOT readable via drawImage. The
forge canvas TRANSPARENCY is load-bearing (bg image behind) — do not make it
opaque to fix step 1. rebuildForMode allocates node state 4-wide now — keep it
that way. Panel must rebuild on view remounts (it does; don't restore the
early-return). Safari is the truth — the whole engine has ONLY been verified in
the Chromium pane; a Safari pass is still owed.

## Suggested order for the fresh agent

1. Step 1 light-alpha fix → verify with wires hidden → bench side-by-side.
2. Have John re-dial with working light; freeze "this one" into PARAM_DEFAULTS.
3. Safari pass (60fps at orb cast + cursor sweep).
4. Deferred list above, then P2 polish.
