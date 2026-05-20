// ============================================================
// CODEX ATLAS — FORGE VIEW (Phase 3)
// ============================================================
// Forge renders the full Pantheon wheel via the proprietary
// WebGPU engine. Isolated from production Pantheon V2.
//
// ─── APP-SHELL CONTRACT (read this before touching layout) ───
// The Atlas shell is a fixed-edge layout: left `<nav.side>` rail
// + right `<aside.detail>` rail, both `position: fixed`. Their
// effective widths are CSS custom properties on <body>:
//   --nav-w-collapsed     /  --nav-w
//   --detail-w-collapsed  /  --detail-w
//   --eff-nav-w / --eff-detail-w  ← resolve via body.nav-collapsed
//                                   and body.detail-collapsed
//
// `main.canvas` is `position: fixed; inset: 0` — it covers the
// WHOLE viewport on purpose. Each view INSETS ITSELF using the
// vars (see `#svg-wrap`):
//     left:  var(--eff-nav-w);
//     width: calc(100% - var(--eff-nav-w) - var(--eff-detail-w));
//
// `.forge-pane` honours that contract: it uses `left: var(--eff-nav-w);
// right: var(--eff-detail-w)` so the WebGPU canvas + chrome
// (status strip, bottom bar) live BETWEEN the rails and adjust
// when either rail collapses/expands.
//
// View-time body classes worth knowing:
//   body.view-forge                  this view is mounted
//   body.nav-collapsed               left rail at --nav-w-collapsed
//   body.detail-collapsed            right rail at --detail-w-collapsed
//
// New chrome MUST:
//   - position INSIDE .forge-stage / .forge-pane, never against
//     the viewport edge.
//   - never assume the rails are absent — they're collapsed by
//     shrinking --eff-* vars, not by display:none.
//
// PHASE 3 ADDS (this commit)
//   - Camera pan (mouse drag) + zoom (wheel toward cursor)
//   - Hover hit-test (CPU side: distance < node radius)
//   - 1-hop focus: hovered node + its neighbors stay at full
//     opacity; everything else dims to ~15 %
//   - Adjacency-driven node + edge state buffers, updated on
//     hover change and uploaded as a small dynamic VBO
//   - Event-driven re-draw (no rAF loop required; the
//     preview iframe throttles rAF anyway)
//
// Earlier phases retained:
//   Phase 1: WebGPU bootstrap + single-disk diagnostic
//   Phase 2: full wheel (663 deities + 3,033 edges) rendered
//
// PHASE 4 NEXT
//   - Labels (DOM overlay, deconfliction)
//   - Hot-edge brighten (focused edges paint bucket-hex instead
//     of slate)
//   - Lock-on-click (sticky focus across hover-leave)
// ============================================================

(function () {
  'use strict';

  // World-space bbox of the radial layout, padded.
  const WORLD_PAD = 24;

  // Wheel-event zoom sensitivity. Browser delta varies; this
  // tuning keeps a normal scroll click feeling like a step.
  const WHEEL_ZOOM_K = 0.0015;

  // ════════════════════════════════════════════════════════════
  // NODE ATOM — spec lock (Phase 1B, 2026-05-20)
  // ════════════════════════════════════════════════════════════
  // The node primitive is locked at this commit. The spec lives
  // in AUDIT/forge-rebuild-1A-node-atom-2026-05-20.md (§2 — the
  // locked spec table). Do not change tier radii / state channels
  // / depth z / GPU layout without writing a dated rationale doc
  // that supersedes the relevant section.
  //
  // Dimensions:
  //  - Tier classification: graph.buildTierClassifier(nodes,
  //    degreeMap). Quantile cuts p4 / p15 / p40. 4 tiers.
  //  - Tier radii (world units, this PARAM_DEFAULTS): 4 numbers,
  //    threaded via tierRadiiFromParams() → packNodes.
  //  - Screen-px clamp: node_min/max_screen_px applied in
  //    packNodes using camera.state.scale at pack time. Re-pack
  //    on 5%-drift via camera.onChange → rebakeNodes.
  //  - State channel (semantics): 0 = focused (no dim), 1 = dim.
  //    Storage: local.nodeStates (live) + local.nodeTargets
  //    (snap-to), interleaved (state, selected) pairs.
  //  - Selected channel: 0 / 1 float; size_mult = selected_size_mult
  //    in shader; glow ring under disk via premultiplied composite.
  //  - Depth z: selected=0.0, focused=0.3, dim=0.6. Glyph z =
  //    SAME value (depth tiebreak by draw-order; see CROSS-PIPELINE
  //    INVARIANT in webgpu.js at the nodeStateVbo write site).
  //  - GPU layout: 8 floats × 32 bytes per instance —
  //    (x, y, r, _pad, R, G, B, A). Frozen.
  //
  // rebuildForMode ORDER (for the NODE parts in scope):
  //   1. ext = lay.worldExtent
  //   2. camera.fitToExtent(ext, vp)         // BEFORE packNodes
  //   3. camera.setPanBounds(...)
  //   4. packNodes(modeNodes, …)             // reads camera.scale
  //   5. local.packedAtScale = camera.state.scale  // N4 invariant
  //   6. build hitNodes + hitGrid in one loop
  //   7. allocate local.nodeStates / nodeTargets
  // The lifecycle invariant: every pack site must update
  // packedAtScale immediately after the pack. The `||` fallback in
  // camera.onChange masks the absence today; a future agent who
  // "cleans up" the fallback brings back the pack-scale invariant
  // bug from memory feedback_pack_scale_invariant.md.
  // ════════════════════════════════════════════════════════════
  //
  // ════════════════════════════════════════════════════════════
  // BEHAVIORS — spec lock (Phase 2B, 2026-05-20)
  // ════════════════════════════════════════════════════════════
  // The interaction + state-transition layer that sits on top of
  // the locked NODE atom. Full spec at AUDIT/forge-rebuild-2A-
  // behaviors-2026-05-20.md §2.
  //
  // Three-state model:
  //  - IDLE      = no hover AND no lock; focusedSet === null;
  //                drawFrame passes dimAmount = 0 (no attenuation).
  //  - FOCUSED   = hover or lock present; focusedSet = {hoverId}
  //                ∪ 1-hop(hoverId) ∪ ⋃(lockedSet ∪ 1-hop(lockedSet));
  //                non-members get nodeStates[i*2] = 1 (dim) at
  //                depth z = 0.6.
  //  - SELECTED  = hover ∪ lockedSet (the anchors only — no 1-hop);
  //                nodeStates[i*2+1] = 1; size_mult applied in
  //                shader; glow ring; depth z = 0.0.
  //
  // Hover transition:
  //  - setHoverId() — synchronous: hoverId mutation + cursor
  //    class + status text. Coalesced: recomputeFocus deferred to
  //    next rAF via local.hoverRafId. At most 1 recompute per
  //    frame regardless of pointer rate.
  //
  // Click-lock transition:
  //  - toggleLock(id) — id present: lockedSet.add/.delete (toggle).
  //    id null (click-empty): lockedSet.clear(). recomputeFocus
  //    runs synchronously (click rate is low; no coalesce needed).
  //
  // Fade pipeline:
  //  - FADE_DURATION = 0.15 s (a constant in this file).
  //  - local.nodeStates ↔ nodeTargets, local.edgeStates ↔ edgeTargets.
  //  - tickNodeFades / tickEdgeFades advance current toward target
  //    IN PLACE every animTick. The only legitimate WHOLESALE
  //    replace is in rebuildForMode (cross-mode N differs); see
  //    the FADE-PIPELINE INVARIANT — EXCEPTION SITE comment block
  //    around line 1051 below.
  //
  // rAF ownership map (all four cancelled by destroy()):
  //  - local.animRafId     — fade + camera motion (animTick)
  //  - local.hoverRafId    — hover coalesce → recomputeFocus
  //  - local.idleLabelRaf  — idle-tier label visibility recompute
  //  - local.scrubRafId    — scrubber drag coalesce → recomputeFocus
  // Helpers in this file: cancelHoverCoalesce(), cancelIdleLabelRaf(),
  // cancelScrubCoalesce(). destroy() calls all three plus the
  // explicit animRafId cancel.
  //
  // rebuildForMode lifecycle ORDER (extends the NODE order above):
  //   1. cancelHoverCoalesce()        // drain pending recompute
  //   2. modemod.filterNodesByMode → layout → degree
  //   3. camera.fitToExtent(ext, vp)  // BEFORE packNodes
  //   4. camera.setPanBounds(...)
  //   5. graph.packNodes(...)
  //   6. local.packedAtScale = camera.state.scale  // N4 invariant
  //   7. buildHitGrid(hitNodes, ext, maxRadius)
  //   8. local.nodeStates / nodeTargets / edgeStates / edgeTargets
  //      WHOLESALE-REPLACED (the documented exception)
  //   9. local.hoverId / lockedSet / focusedSet reset
  //   10. label DOM pre-creation
  //   11. rebuildGlyphInstanceBuffer + drawFrame
  //
  // Dim model dispatcher (Phase 2B B6, default A4):
  //  - A4 (default) — accept asymmetry; IDLE-hover dims whole scene.
  //  - A1 — halved IDLE-hover dim multiplier; LOCKED keeps full.
  //  - A2 — same as A1 in Phase 2B; lock-indicator CSS deferred to P4.
  //  - A3 — staggered ring cascade via scratch.fadeDelay (precomputed
  //    in recomputeFocus, consumed by tickNodeFades).
  //  Switch live via window._forgeDebug.setDimModel('AX').
  // ════════════════════════════════════════════════════════════
  //
  // ════════════════════════════════════════════════════════════
  // WIRES — spec lock (Phase 3B, 2026-05-20)
  // ════════════════════════════════════════════════════════════
  // The edge primitive connecting nodes. Full spec at AUDIT/
  // forge-rebuild-3A-wires-2026-05-20.md §2. Phase 3B locks
  // invariants + ships the edgeInstanceVbo dirty flag + deletes
  // two dead-code drift surfaces (forceWriteEdgeState and
  // rebakeBucketPalette).
  //
  // 7-bucket palette (single source of truth):
  //  - Buckets: Transmission / Parallel / Association / Kinship /
  //    Attestation / Polemic / Fusion. BUCKET_INDEX in
  //    src/js/engine/graph/edge.js is the canonical ordering;
  //    BUCKET_ORDER in this file is DERIVED from it (D1).
  //  - Active colors + opacities live in PARAM_DEFAULTS
  //    (active_color_{bucket} + active_opacity_{bucket}).
  //  - Renderer-side `bucketPalette` cache is pushed ONCE at boot
  //    via `setBucketPalette(hotPaletteFromParams())`. With
  //    PARAM_DEFAULTS frozen and the dev panel removed (Phase 0),
  //    there is NO live mutation route — the cache cannot drift.
  //    If a future V2 panel ever lands, it MUST re-push on every
  //    mutation of `local.params.active_color_*` /
  //    `local.params.active_opacity_*`. (Audit Q1 safe-default: B.)
  //
  // Edge state channel (convention-flip, 2026-05-18):
  //  - 0 = IDLE (slate / instance-color), 1 = HOT (bucket-hex).
  //  - Zero-init is now the SAFE default — `forceWriteEdgeState`
  //    hammer deleted in Phase 3B F2.
  //  - In-place `.set()` everywhere except the documented
  //    wholesale-replace at the FADE-PIPELINE INVARIANT —
  //    EXCEPTION SITE block (rebuildForMode, ~line 1145).
  //
  // Gradient (universal source→target darken):
  //  - Shader: `mix(1.0, 0.25, edge_t)` on color RGB only.
  //  - DO NOT extend grad_mult to alpha (D2) — keeps AA footprint
  //    constant so the wire-end stays blunt against its disk.
  //  - Applies to IDLE + HOT alike; symmetric buckets carry no
  //    semantic direction, but the gradient is still applied as
  //    a visual cue (D4).
  //
  // Width clamp (screen-px):
  //  - Shader: `clamp(world_w × cam.scale × DPR × vp.x × 0.5,
  //    wire_min_screen_px, wire_max_screen_px)` in framebuffer-px,
  //    converted back to world-units before extrusion.
  //  - Defaults: min=1, max=2. Naming parallel to node clamps
  //    (intentional; do not collapse only one — audit Q3=A).
  //
  // Endpoint offset (disk perimeter):
  //  - `packEdges(..., { nodeRadii: Map<id, r> })` insets each
  //    bezier endpoint 0.92r along source→target. Wires emerge
  //    from disk circumference, not center.
  //  - `nodeRadii` is REQUIRED for forge-view callers. Center-
  //    fallback (dist < 1e-4) is for the same-pixel edge case
  //    ONLY, not for missing radii (D3).
  //
  // Depth z (BELOW every node layer):
  //  - IDLE z = 0.85, HOT z = 0.75 — both behind nodes (max 0.6
  //    for dim disks). Shader: `mix(0.85, 0.75, inst_state)`.
  //
  // GPU instance layout (frozen):
  //  - 12 floats × 48 bytes per instance. Layout documented at
  //    src/js/engine/graph/edge.js lines 8-19. Frozen — any
  //    change requires a dated rationale doc + a migration plan.
  //  - State VBO: separate, 4 bytes per instance (single float).
  //
  // Dirty-flag invariant (Phase 3B F3, mirrors NODE N2):
  //  - `local.edgeInstancesDirty` defaults true; reset after each
  //    drawFrame; re-set by every packEdges site (rebuildForMode,
  //    rebakeEdges). Renderer gates `edgeInstanceVbo writeBuffer`
  //    on `frame.edgeInstancesDirty || r.grew`. State VBO write
  //    stays unconditional (fades animate per frame).
  //  - Verify via window._forgeDebug.countEdgeVboWrites() — at
  //    rest, the counter equals the rebake count, NOT the frame
  //    count.
  //
  // rAF ownership:
  //  - No new rAF id introduced. Edges share the existing
  //    `local.animRafId` via `tickEdgeFades` running inside
  //    animTick. destroy()/rebuildForMode cancellation covered
  //    by the BEHAVIORS section above.
  //
  // Debug surfaces (window._forgeDebug):
  //  - edgesAndNodesOnly() — hides the glyph pass (keeps nodes +
  //    wires) for visual isolation testing.
  //  - countEdgeVboWrites() — see dirty-flag invariant above.
  // ════════════════════════════════════════════════════════════
  //
  // ════════════════════════════════════════════════════════════
  // FX — spec lock (Phase 4B, 2026-05-20)
  // ════════════════════════════════════════════════════════════
  // The ornament layer that rides on top of NODE / BEHAVIORS /
  // WIRES: selected glow, GPU glyphs (atlas + per-frame alpha
  // refresh + cull), CSS-positioned labels. Full spec at AUDIT/
  // forge-rebuild-4A-fx-2026-05-20.md §2.
  //
  // Selected glow:
  //  - Quad scale = `selected_glow.w × 1.5` (1.5× headroom past
  //    glow extent so the smoothstep completes well inside the
  //    quad — kills the square-clip artifact). See node vertex
  //    shader in webgpu.js.
  //  - Discard threshold DERIVED from `selected_glow_strength`
  //    (FX5, 2026-05-20). Replaces the 3-session magic-number
  //    bump trail (0.04 → 0.08 → 0.15). Threshold adapts as the
  //    slider moves; the square-clip class cannot return at any
  //    strength value.
  //
  // Glyphs:
  //  - Atlas at 128 px cells + full mip chain (FX4). `mipmapFilter:
  //    'linear'` sampler now has a chain — Retina deep-zoom sharp.
  //  - Glyph z = parent disk z EXACTLY (selected=0.0, focused=0.3,
  //    dim=0.6). Wins by draw-order tiebreak in less-equal depth
  //    test. Read-site invariant documented inline in webgpu.js
  //    GLYPH_SHADER header (mirrors Phase 1B's nodeStateVbo
  //    write-site comment — see CROSS-PIPELINE INVARIANT).
  //  - Tint factor frozen at 0.55 literal in
  //    rebuildGlyphInstanceBuffer (FX7 — `glyph_tint` deleted from
  //    PARAM_DEFAULTS per Phase 0 consistency).
  //
  // Glyph dirty-flag + cull (FX1 + FX2):
  //  - local.glyphInstancesDirty defaults true; reset after each
  //    drawFrame; re-set by every site whose output the alpha
  //    column depends on: rebuildGlyphInstanceBuffer (rebake),
  //    recomputeFocus (state change), tickNodeFades (fade in
  //    flight), camera.onChange (cull viewport-dependent).
  //  - drawFrame skips refreshGlyphAlphas + renderer.writeBuffer
  //    when dirty=false. At idle the per-frame ~21 KB GPU upload
  //    drops to 0 (~1.6 MB at 50k saved).
  //  - refreshGlyphAlphas screen-projects each instance; sets
  //    alpha=0 when screen_r < 4 px OR off-viewport. Fragment
  //    discard at alpha<0.02 handles the GPU side. Pure alpha
  //    gating — no pipeline change.
  //  - Verify via `_forgeDebug.countGlyphVboWrites()` (should
  //    track rebake/fade/camera counts, NOT frame count) and
  //    `_forgeDebug.countCulledGlyphs()` (number of instances
  //    forced to alpha 0 in the last refresh).
  //
  // Labels:
  //  - Pre-create cap = `min(N, label_idle_max + label_cap × 2)`
  //    (FX3). Walks at most ~1k <div>s at mode-switch instead of
  //    full N. Lazy-create the rest via ensureLabelEl on first
  //    reveal. At 10k N this cuts mode-switch stall from
  //    ~200-300 ms to ~10 ms; at 50k from ~1-2 s freeze to ~20 ms.
  //  - `local.visibleLabelEls` Set is the SSOT for what's
  //    currently shown (FX6). syncLabels writes data-visible only
  //    on the symmetric-difference vs previously-visible;
  //    syncLabelPositions iterates the Set directly instead of
  //    walking the full labelEls Map.
  //  - CSS opacity transition (0.15s ease-out) drives the visible
  //    fade — `.forge-label[data-visible="1"] { opacity: 1; }`.
  //    JS only flips the attribute.
  //
  // Dead-state cleanup (FX9):
  //  - `syncGlyphPositions` / `syncGlyphFocus` no-op stubs DELETED
  //    (Phase 4B). Their callers (camera.onChange, recomputeFocus)
  //    are also cleaned up.
  //
  // Debug surfaces (window._forgeDebug):
  //  - countGlyphVboWrites() — gate verification.
  //  - countCulledGlyphs()   — number of instances at alpha=0 in
  //                            the last refresh (viewport+min-size cull).
  //  - dumpAtlasInfo()       — { width, height, mipLevelCount }.
  // ════════════════════════════════════════════════════════════
  //
  // PARAM_DEFAULTS — the SINGLE SOURCE OF TRUTH for every visual
  // parameter in Forge. Dev panel removed 2026-05-20 (Phase 0 of
  // the layered rebuild — see AUDIT/forge-rebuild-layered-spec-
  // 2026-05-20.md). Values below are John's last tuned set,
  // preserved verbatim from the 2026-05-18 bake.
  //
  // Phase 6 organisation, kept as section markers for readers:
  //   IDLE state    — what you see when nothing is hovered or locked.
  //   ACTIVE state  — what lights up when something is in focus.
  //   SHAPE         — state-independent geometry (curvature).
  //   NODES         — disk sizing + zoom-aware clamps.
  //   GLYPHS        — per-disk symbol look.
  //   LABELS        — idle-tier visibility hierarchy.
  //   PALETTE       — global colours (background / label text + halo).
  //   CAMERA        — pan inertia + zoom + fly-to timing.
  //
  // Pre-bake originals preserved in git history; recover via
  //   git show 4976623:src/js/views/forge.js | grep PARAM_DEFAULTS
  // (commit just before the 2026-05-18 bake).
  // ----------------------------------------------------------
  // Default per-type glyphs apply to every node; icon overrides
  // were a dev-panel feature, removed in Phase 0. Same for font
  // overrides per scope.
  const PARAM_DEFAULTS = Object.freeze({
    // ── WIRES · IDLE STATE (per bucket) ── slate atmospheric across all buckets
    idle_color_transmission: '#3a4a66',
    idle_color_parallel:     '#3a4a66',
    idle_color_association:  '#3a4a66',
    idle_color_kinship:      '#3a4a66',
    idle_color_attestation:  '#3a4a66',
    idle_color_polemic:      '#3a4a66',
    idle_color_fusion:       '#3a4a66',
    idle_opacity_transmission: 0.10,
    idle_opacity_parallel:     0.10,
    idle_opacity_association:  0.10,
    idle_opacity_kinship:      0.10,
    idle_opacity_attestation:  0.10,
    idle_opacity_polemic:      0.10,
    idle_opacity_fusion:       0.10,
    idle_stroke_transmission:  0.30,
    idle_stroke_parallel:      0.30,
    idle_stroke_association:   0.30,
    idle_stroke_kinship:       0.30,
    idle_stroke_attestation:   0.30,
    idle_stroke_polemic:       0.30,
    idle_stroke_fusion:        0.30,

    // ── WIRES · ACTIVE STATE (per bucket) ── John's tuned palette
    active_color_transmission: '#5a4bd5',  // violet
    active_color_parallel:     '#004093',  // deep blue
    active_color_association:  '#097a8e',  // teal
    active_color_kinship:      '#0f8f31',  // green
    active_color_attestation:  '#9cad8c',  // sage
    active_color_polemic:      '#710713',  // deep crimson
    active_color_fusion:       '#725b3f',  // warm brown
    active_opacity_transmission: 0.75,
    active_opacity_parallel:     0.76,
    active_opacity_association:  0.78,
    active_opacity_kinship:      0.75,
    active_opacity_attestation:  0.74,
    active_opacity_polemic:      0.90,
    active_opacity_fusion:       0.75,
    active_stroke_transmission:  0.57,
    active_stroke_parallel:      0.51,
    active_stroke_association:   0.51,
    active_stroke_kinship:       0.51,
    active_stroke_attestation:   0.55,
    active_stroke_polemic:       0.80,
    active_stroke_fusion:        0.51,

    // ── WIRES · SHAPE (state-independent) ── John's tuned curvatures
    curve_transmission: 0.22,
    curve_parallel:     0.31,
    curve_association:  0.21,
    curve_kinship:      0.13,
    curve_attestation:  0.14,
    curve_polemic:      0.20,
    curve_fusion:       0.30,

    // ── FOCUS / DIM ── tighter than pre-bake (was 0.85 across)
    dim_amount:        0.80,    // edges
    dim_amount_nodes:  0.90,
    dim_amount_glyphs: 0.90,
    atmosphere:        0.025,

    // ── SELECTED STATE ──
    selected_size_mult:     1.20,
    selected_glow_strength: 0.50,
    selected_glow_extent:   1.6,
    selected_glow_color:    '#FFE9B0',

    // ── NODES ── smaller than pre-bake (was 16/12/9/7 max 28)
    node_radius_tier1:     8,
    node_radius_tier2:     7,
    node_radius_tier3:     6,
    node_radius_tier4:     5,
    node_min_screen_px:    3,
    node_max_screen_px:   22,

    // ── WIRES · ZOOM CLAMP ── narrower band than pre-bake (was 0.5/4)
    wire_min_screen_px:   1,
    wire_max_screen_px:   2,

    // ── GLYPHS ──
    glyph_scale:   0.85,
    glyph_opacity: 0.86,
    // Phase 4B FX7 (2026-05-20) — `glyph_tint` DELETED. Was a
    // dev-panel-era tunable that the GPU glyph pipeline never
    // read (handoff doc flagged it as known-not-done). Tint
    // factor is now frozen at the literal 0.55 in
    // rebuildGlyphInstanceBuffer. To re-tune, change that
    // literal. Consistent with Phase 0's deletion of iconByType
    // + fontByScope (same shape — half-wired param ghosts).

    // ── LABELS ── John's progressive zoom thresholds (step-02 values;
    // step-01 was much more aggressive at 0/0.2/0.35/0.45 — step-02
    // tightened to reduce label clutter at lower zoom).
    label_idle_zoom_tier1: 0.10,   // tier 0 — basically always
    label_idle_zoom_tier2: 1.20,
    label_idle_zoom_tier3: 1.65,
    label_idle_zoom_tier4: 1.95,
    label_idle_max:        750,    // bumped from 800 → 1200 in step-01, settled at 750 in step-02
    label_size:            12,
    label_cap:             120,
    label_collision_pad:   6,

    // ── GLOBAL PALETTE ──
    palette_background: '#0a0c10',
    palette_label_text: '#e8e2d0',
    palette_label_halo: '#0a0c10',

    // ── CAMERA ──
    pan_tau:   0.18,
    zoom_tau:  0.08,
    flyto_dur: 0.55,
  });

  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';

    // ── Engine sanity check ─────────────────────────────
    const eng       = window.AtlasEngine;
    const mth       = window.AtlasEngineMath;
    const gpu       = window.AtlasEngineWebGPU;
    const layout    = window.AtlasEngineLayout;
    const graph     = window.AtlasEngineGraph;
    const cammod    = window.AtlasEngineCamera;
    const modemod   = window.AtlasEngineMode;
    const glyphmod  = window.AtlasEngineGlyph;
    if (!eng || !mth || !gpu || !layout || !graph || !cammod || !modemod || !glyphmod) {
      rootEl.innerHTML = '<div class="forge-error">'
        + 'Engine modules missing. Check index.html loads '
        + 'engine/contract.js + types.js + math.js + camera.js + '
        + 'layout/radial.js + graph/{node,edge,adjacency,mode}.js + '
        + 'renderer/webgpu.js before views/forge.js.</div>';
      return;
    }
    if (!navigator.gpu) {
      rootEl.innerHTML = '<div class="forge-error">'
        + 'WebGPU is not available in this browser. Forge requires '
        + 'Chrome 113+, Safari 18+, or Firefox Nightly with '
        + '<code>dom.webgpu.enabled</code>.</div>';
      return;
    }

    // ── Vault data (mode-independent) ────────────────────
    const vault       = window.VAULT_DATA || { nodes: [], edges: [], families: [] };
    const allNodes    = vault.nodes || [];
    const allEdges    = vault.edges || [];
    const familyOrder = (vault.families || []).map(f => f.name);

    // ── Mode-dependent state lives on `local.mode` ────────
    // rebuildForMode(id) repopulates this object whenever the
    // user picks a different mode in the dropdown.  Keeping the
    // mode state in one place means the renderer / camera / DOM
    // chrome / interaction handlers can all read from a single
    // bag without re-binding closure variables.
    const NODE_FLOATS = graph.NODE_FLOATS_PER_INSTANCE;

    // ── Build pane DOM ──────────────────────────────────
    const shell = document.createElement('div');
    shell.className = 'forge-shell-v1';
    rootEl.appendChild(shell);

    const status = document.createElement('div');
    status.className = 'forge-status';
    // Mode dropdown is FIRST in the status row so it reads as the
    // primary "what is this wheel showing" indicator.  The rest
    // (device / counts / hover / lock / frame) follow.
    const modeOptionsHtml = modemod.MODES.map(m =>
      '<option value="' + m.value + '">' + m.glyph + '  ' + m.label + '</option>'
    ).join('');
    status.innerHTML = [
      // 2026-05-19 — restored the clean monospace FORGE tag here.
      // The dup was the OTHER way around: app shell's view-header
      // was rendering "FORGE" in big stretched serif (the global
      // .view-header h2 rule with letter-spacing 0.32em +
      // text-transform: uppercase), AND this neat tag below.
      // John wanted the neat one kept; CSS now hides the app
      // shell header for body.view-forge entirely.
      '<span class="forge-status-tag">FORGE</span>',
      '<span class="forge-status-sep">·</span>',
      '<select class="forge-status-mode" id="forge-status-mode" title="What is this wheel showing?">' + modeOptionsHtml + '</select>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">device</span>',
      '<span class="forge-status-v forge-status-pending" id="forge-status-device">acquiring…</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">nodes</span><span class="forge-status-v" id="forge-status-nodes">—</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">edges</span><span class="forge-status-v" id="forge-status-edges">—</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">hover</span><span class="forge-status-v" id="forge-status-hover">—</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">lock</span><span class="forge-status-v" id="forge-status-lock">—</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">frame</span><span class="forge-status-v" id="forge-status-frame">—</span>',
      '<span class="forge-status-spacer"></span>',
    ].join('');
    shell.appendChild(status);

    const stage = document.createElement('div');
    stage.className = 'forge-stage';
    shell.appendChild(stage);

    // Phase 6d — bottom bar: search + zoom gizmo. Floating
    // over the canvas at the bottom edge. Lives below the
    // dev panel z-stack so the panel can cover it when needed.
    const bottomBar = document.createElement('div');
    bottomBar.className = 'forge-bottombar';
    bottomBar.innerHTML = [
      '<button class="forge-zoom-gizmo" id="forge-zoom-gizmo" title="Current zoom — click to reset to fit">100%</button>',
      '<input type="text" class="forge-bottom-search" id="forge-status-search" placeholder="search…" autocomplete="off" spellcheck="false">',
      // 2026-05-20 — Timeline scrubber redesigned per John's spec:
      // 4 separate boxes (IN value | slider | OUT value | PRESENT
      // value), each the SAME height as the zoom-gizmo + search.
      // Drag IN/OUT/CENTER thumbs in the slider; values update
      // live in the boxes. v2 wires the filter — nodes outside the
      // IN-OUT range get dimmed via the existing state pipeline.
      '<div class="forge-scrub-box" id="forge-scrub-in"      title="IN: lower bound of date range">—</div>',
      '<div class="forge-scrub-slider" id="forge-scrub-slider" title="Drag IN / OUT bounds; drag center to scrub">' +
        '<div class="forge-scrub-track">' +
          '<div class="forge-scrub-range" id="forge-scrub-range"></div>' +
          '<div class="forge-scrub-thumb forge-scrub-in-thumb"     id="forge-scrub-in-thumb"     data-handle="in"></div>' +
          '<div class="forge-scrub-thumb forge-scrub-center-thumb" id="forge-scrub-center-thumb" data-handle="center"></div>' +
          '<div class="forge-scrub-thumb forge-scrub-out-thumb"    id="forge-scrub-out-thumb"    data-handle="out"></div>' +
        '</div>' +
      '</div>',
      '<div class="forge-scrub-box" id="forge-scrub-out"     title="OUT: upper bound of date range">—</div>',
      '<div class="forge-scrub-box forge-scrub-present" id="forge-scrub-present" title="PRESENT: scrub playhead">—</div>',
    ].join('');
    stage.appendChild(bottomBar);

    const canvas = document.createElement('canvas');
    canvas.className = 'forge-canvas';
    stage.appendChild(canvas);

    // ── Glyph overlay (Phase 4e) ──────────────────────
    // SVG-per-node, positioned absolutely over the canvas.
    // Adds the type-shape vocabulary (◉ deity / ✎ person /
    // ❡ document / ✦ symbol / ◆ event / ✚ ritual / ♩ music /
    // ℵ alphabet / △ alchemy / ○ philosophy / ⚖ moral /
    // ⚕ medicine / ⊕ mathematics / ▮ monument / ◇ theme /
    // ⊙ tradition / pin place) inside each disk.  Drawn at idle
    // when the wheel is at rest — disambiguates node TYPE
    // (especially useful across mode switches where the wheel
    // density changes drastically).
    //
    // pointer-events: none so glyphs never intercept hover.
    // Positioned via camera.worldToScreen each frame.
    // 2026-05-20 — DOM glyph overlay removed (replaced by GPU
    // glyph pass in the WebGPU canvas). The variable is kept as
    // null so any straggling reference fails fast rather than
    // silently no-op'ing.
    const glyphOverlay = null;

    // ── Labels overlay ──────────────────────────────────
    // DOM <div> per node, absolutely positioned over the canvas.
    // Pointer-events: none so it never intercepts hover. Hidden
    // by default; revealed for nodes in the current focused set
    // (hover or lock + their 1-hop neighbours). Phase 4c will
    // add an idle-time hub-label pass with deconfliction; for
    // now, labels only paint on focus to stay readable.
    const labelsOverlay = document.createElement('div');
    labelsOverlay.className = 'forge-labels-overlay';
    stage.appendChild(labelsOverlay);

    // ── Camera ──────────────────────────────────────────
    const camera = cammod.create({ centerX: 0, centerY: 0, scale: 1 });

    // ── Local mount state ──────────────────────────────
    const local = {
      renderer:    null,
      resizeObs:   null,
      lastSize:    { w: 0, h: 0 },
      destroyed:   false,
      hoverId:     null,
      lockedSet:   new Set(),    // Phase 4b: sticky focus from clickNode
      focusedSet:  null,
      // Mode-dependent baking, refilled by rebuildForMode(id).
      mode:        {
        id:           modemod.defaultMode(),
        nodes:        [],
        edges:        [],
        positions:    new Map(),
        adjacency:    new Map(),
        nodePacked:   { data: new Float32Array(), instanceCount: 0, idIndex: [] },
        edgePacked:   { data: new Float32Array(), instanceCount: 0 },
        hitNodes:     [],
        worldExtent:  { x0: -100, y0: -100, x1: 100, y1: 100 },
      },
      nodeStates:  new Float32Array(0),
      // 2026-05-19 — node fade animation. Same target/states
      // split as edges below. nodeStates carries (dim, selected)
      // pairs; we fade BOTH axes so the dim transition and the
      // selected-glow appearance both ease in/out at FADE_DURATION
      // instead of snapping.
      nodeTargets: new Float32Array(0),
      // N2 (2026-05-20) — nodeInstanceVbo dirty flag. The packed
      // node geometry (positions + radii + family color) only
      // changes when packNodes runs (rebuildForMode / rebakeNodes).
      // Default = true so the first drawFrame after mount uploads
      // the buffer; drawFrame resets to false after each call;
      // every pack site re-sets to true. The state VBO is NOT
      // gated (it animates per-frame via tickNodeFades).
      nodeInstancesDirty: true,
      // Phase 3B F3 (2026-05-20) — edgeInstanceVbo dirty flag.
      // Same shape as nodeInstancesDirty above; static geometry
      // (endpoints + colors + widths) only changes when packEdges
      // runs (rebuildForMode / rebakeEdges). Default = true so
      // first drawFrame uploads; drawFrame resets to false after
      // each call. ~130 MB/s saved at 10k mode / ~648 MB/s at 50k.
      edgeInstancesDirty: true,
      // Phase 4B FX1+FX2 (2026-05-20) — glyphInstanceVbo dirty flag.
      // Set true by every site whose output the glyph alpha column
      // depends on: rebuildGlyphInstanceBuffer (static rebuild),
      // recomputeFocus (state change), tickNodeFades (fade in flight),
      // camera.onChange (cull viewport-dependent). drawFrame gates
      // refreshGlyphAlphas + the GPU writeBuffer on this flag and
      // resets to false after upload. Combined with the viewport+
      // min-size cull below, idle GPU upload at deities drops from
      // ~21 KB/frame to 0 once fade settles.
      glyphInstancesDirty: true,
      // 2026-05-19 — edge fade animation. `edgeStates` is the
      // LIVE-ANIMATING value pushed to the GPU each frame;
      // `edgeTargets` is the snap-to value computed by
      // `recomputeFocus` from the current focused set. animTick
      // advances states toward targets at FADE_DURATION s. A
      // fresh recomputeFocus updates targets but leaves states
      // alone, so a mid-fade hover-change picks up the new
      // target smoothly without snapping.
      edgeStates:  new Float32Array(0),
      edgeTargets: new Float32Array(0),
      // Pan-drag state
      panActive:   false,
      panLastX:    0,
      panLastY:    0,
      panMoved:    false,
      // Phase 4c: pan velocity tracking. A small ring buffer of
      // (clientX, clientY, t) samples; on release we average the
      // most recent ~80ms to derive release velocity. Avoids the
      // jitter you get from using just the final move's delta.
      panSamples:  [],
      // Phase 2B (2026-05-20) — three rAF ids tracked on `local` so
      // destroy() + rebuildForMode can cancel them symmetrically.
      // See the BEHAVIORS section of the spec-lock header for the
      // ownership map (which scheduler writes which id, when each
      // is cancelled). Internal `if (local.destroyed) return;`
      // guards inside each rAF callback are belt-and-braces;
      // explicit cancellation in destroy() is load-bearing.
      animRafId:        null,   // fade + camera-motion loop (animTick)
      animLastT:        0,
      hoverRafId:       0,      // hover coalesce → recomputeFocus
      hoverPendingId:   undefined,
      idleLabelRaf:     0,      // idle-tier label visibility recompute
      scrubRafId:       0,      // B4: scrubber drag coalesce → recomputeFocus
      scrubPendingChange: false,
      // Phase 2B B6 — dim-model dispatcher. Default A4 (accept
      // asymmetry — IDLE-hover dims the whole scene; LOCKED feels
      // surgical). Other options: A1 = softer IDLE dim; A2 = A1
      // + Phase-4 lock indicator (in Phase 2B same effect as A1);
      // A3 = staggered ring cascade (uses scratch.fadeDelay).
      // Toggle via window._forgeDebug.setDimModel('AX').
      _dimModel:        'A4',
      // Scratch buffers reused across recomputeFocus / tickNodeFades.
      // Allocated on demand at the right size; reused thereafter.
      scratch:          { ringDist: null, fadeDelay: null },
      // Label DOM nodes — one per renderable deity. Created lazily
      // (only when first shown) to avoid 663 hidden divs at mount.
      labelEls:    new Map(),     // id → HTMLDivElement
      // Dead state from the retired DOM glyph overlay + dev panel.
      // Kept as no-op fields so any stragglers still reading them
      // don't NPE; deletion handled by Phase 1 cleanup once we've
      // pruned every reader.
      glyphEls:    [],
      glyphFamilyColor: new Map(),
      // Visual params — seeded once from PARAM_DEFAULTS at mount.
      // Single source of truth; no live-mutation surface now that
      // the dev panel is gone. iconByType / fontByScope stay as
      // empty-init for the same Phase-1-cleanup reason as above.
      params:       Object.assign({}, PARAM_DEFAULTS),
      iconByType:   {},
      fontByScope:  {},
    };

    rootEl._engine = {
      destroy() {
        local.destroyed = true;
        // Phase 2B B1 (2026-05-20) — symmetric rAF cancellation.
        // Previously only animRafId was cancelled; the hover +
        // idle-label + scrubber rAFs relied on internal
        // `if (local.destroyed) return;` guards inside their
        // callbacks. Those guards are belt-and-braces; explicit
        // cancellation here is load-bearing — one missed guard
        // in a future refactor produces use-after-destroy on
        // stale local.mode.
        if (local.animRafId != null) {
          try { cancelAnimationFrame(local.animRafId); } catch (e) { /* ignore */ }
          local.animRafId = null;
        }
        cancelHoverCoalesce();
        cancelIdleLabelRaf();
        cancelScrubCoalesce();
        if (local.resizeObs) {
          try { local.resizeObs.disconnect(); } catch (e) { /* ignore */ }
          local.resizeObs = null;
        }
        if (local.renderer) {
          try { local.renderer.destroy(); } catch (e) { /* ignore */ }
          local.renderer = null;
        }
        try { camera.stopAnim(); } catch (e) { /* ignore */ }
      },
    };

    // Debug surface — used by automated verification to inspect
    // hover state from outside the closure. Safe to leave on in
    // dev; gated to dev once we add user gating.
    window._forgeDebug = {
      hitTestAt:    (x, y) => hitTestAt(x, y),
      cameraState:  () => camera.state,
      lastSize:     () => ({ w: local.lastSize.w, h: local.lastSize.h }),
      hoverId:      () => local.hoverId,
      lockedIds:    () => Array.from(local.lockedSet),
      // Phase 4B FX6 (2026-05-20) — uses the new visibleLabelEls
      // Set. Returns the ids of currently-shown labels.
      visibleLabels:() => local.visibleLabelEls
        ? Array.from(local.visibleLabelEls)
        : [],
      hitNodesAt:   (i) => local.mode.hitNodes[i],
      hitNodeCount: () => local.mode.hitNodes.length,
      currentMode:  () => local.mode.id,
      toggleLock:   (id) => toggleLock(id),
      // Animation introspection (Phase 4c).
      isAnimating:  () => camera.isAnimating(),
      // Step the camera animation manually (bypasses rAF). Used
      // by automated tests that can't rely on rAF firing in
      // background tabs. Real users get the rAF-driven loop.
      tickAnim:     (dt) => camera.tick(dt),
      // Diagnostic peek at the live pan-sample ring + velocity
      // computation. _lastEndPan is the most recent endPan record.
      panSamples:    () => local.panSamples.slice(),
      lastEndPan:    () => local._lastEndPan || null,
      // Direct injection — bypass the pointer-event path so we
      // can verify the animation system without depending on
      // setTimeout cadence (which the preview iframe throttles).
      kickPanVelocity: (vx, vy) => { camera.kickPanVelocity(vx, vy); },

      // ── Phase 1B NODE-only debug helpers (2026-05-20) ─────
      // Acceptance instrumentation for the layered rebuild's
      // NODE atom phase. See AUDIT/forge-rebuild-1A-node-atom-
      // 2026-05-20.md §6.
      // Toggle: render only nodes (no edges, no glyphs). Useful
      // for verifying the node primitive in isolation. Pass true /
      // false to set explicitly; pass nothing to flip.
      nodeOnly: (on) => {
        local._nodeOnly = (typeof on === 'boolean') ? on : !local._nodeOnly;
        drawFrame();
        return local._nodeOnly;
      },
      // Inspect the hit-test spatial grid (N1).
      dumpHitGrid: () => {
        const g = local.mode && local.mode.hitGrid;
        if (!g) return null;
        const totalCells = g.cols * g.rows;
        // buckets is sparse — iterate length, treat undefined as 0.
        let nonEmpty = 0, maxOcc = 0, totalEntries = 0;
        for (let i = 0; i < totalCells; i++) {
          const bucket = g.buckets[i];
          const s = bucket ? bucket.length : 0;
          if (s > 0) nonEmpty++;
          if (s > maxOcc) maxOcc = s;
          totalEntries += s;
        }
        return {
          cellSize: g.cellSize,
          cols: g.cols, rows: g.rows,
          totalCells,
          nonEmptyCells: nonEmpty,
          maxBucketSize: maxOcc,
          totalEntries,
          avgPerNonEmpty: nonEmpty ? +(totalEntries / nonEmpty).toFixed(2) : 0,
        };
      },
      // Inspect the pack-scale invariant (N4).
      dumpPackedAtScale: () => ({
        packedAtScale: local.packedAtScale,
        currentScale:  camera && camera.state ? camera.state.scale : null,
        ratio: local.packedAtScale && camera && camera.state
          ? (camera.state.scale / local.packedAtScale).toFixed(4)
          : null,
      }),
      // Count of static node-VBO uploads since renderer create.
      // Should approximate rebake/mode-switch count — NOT frame count.
      countNodeVboWrites: () => (local.renderer && local.renderer.debugCountNodeVboWrites
        ? local.renderer.debugCountNodeVboWrites() : null),
      // Count of live GPU resources tracked by the renderer's
      // owned[] list. View-switch should leave this constant at 0.
      ownedCount: () => (local.renderer && local.renderer.debugOwnedCount
        ? local.renderer.debugOwnedCount() : null),

      // ── Phase 3B WIRES-only debug helpers (2026-05-20) ─────
      // Toggle: render nodes + edges only (hide the glyph pass).
      // Pair to Phase 1B's nodeOnly() — useful for verifying the
      // edge primitive in isolation without removing nodes. Pass
      // true / false to set explicitly; pass nothing to flip.
      edgesAndNodesOnly: (on) => {
        local._edgesAndNodesOnly = (typeof on === 'boolean') ? on : !local._edgesAndNodesOnly;
        drawFrame();
        return local._edgesAndNodesOnly;
      },
      // Count of static edge-instance VBO uploads since renderer
      // create. Should equal rebake/mode-switch count — NOT frame
      // count. Mirror of countNodeVboWrites().
      countEdgeVboWrites: () => (local.renderer && local.renderer.debugCountEdgeVboWrites
        ? local.renderer.debugCountEdgeVboWrites() : null),

      // ── Phase 4B FX-only debug helpers (2026-05-20) ────────
      // Glyph dirty-flag verification (mirrors node + edge).
      // Should track rebake/fade/camera-change counts, NOT frame
      // count. At idle the delta over 500ms should be 0.
      countGlyphVboWrites: () => (local.renderer && local.renderer.debugCountGlyphVboWrites
        ? local.renderer.debugCountGlyphVboWrites() : null),
      // Number of glyph instances forced to alpha=0 in the last
      // `refreshGlyphAlphas` (viewport + min-size cull). At
      // zoom-fit on deities most glyphs should NOT be culled
      // (radii are ~60 world units × scale ~0.05 = ~3 px which
      // is borderline against the 4 px minScreenR threshold).
      // At deep zoom-in most off-screen glyphs ARE culled.
      countCulledGlyphs: () => local.glyphCulledCount || 0,
      // Atlas diagnostic: { width, height, mipLevelCount }.
      // Returns null until the async buildAtlas+setGlyphAtlas
      // completes at boot.
      dumpAtlasInfo: () => (local.renderer && local.renderer.debugAtlasInfo
        ? local.renderer.debugAtlasInfo() : null),

      // ── Phase 2B BEHAVIORS-only debug helpers (2026-05-20) ─
      // Toggle the dim model used by hover dimming. A4 (default)
      // is the legacy uniform mass-dim. A1 halves the IDLE-hover
      // dim multiplier (LOCKED keeps full); A2 = A1 in Phase 2B
      // (CSS treatment deferred to Phase 4); A3 staggers the
      // cascade by ring distance over ~0.3s. Returns the model
      // that was set, or null if the argument is invalid.
      setDimModel: (s) => {
        if (!['A1', 'A2', 'A3', 'A4'].includes(s)) return null;
        local._dimModel = s;
        // Force a recompute so the new model takes effect on the
        // current hover/lock state without waiting for the next
        // pointermove. drawFrame call inside animTick picks up
        // the new dim multiplier on its next tick.
        if (local.hoverId || (local.lockedSet && local.lockedSet.size)) {
          recomputeFocus();
        }
        drawFrame();
        return s;
      },
      // Snapshot the dim-model-relevant state for side-by-side
      // comparisons. Call setDimModel('A1') → screenshot → call
      // setDimModel('A2') → screenshot → compare. The values
      // here are stable across model swaps; only the visible
      // rendering changes.
      compareDimModels: () => ({
        current:        local._dimModel || 'A4',
        hoverId:        local.hoverId,
        lockedSize:     local.lockedSet ? local.lockedSet.size : 0,
        focusedSize:    local.focusedSet ? local.focusedSet.size : 0,
        ringDistFilled: local.scratch && local.scratch.ringDist
          ? (() => {
              const r = local.scratch.ringDist;
              let r0 = 0, r1 = 0, r2 = 0, beyond = 0;
              for (let i = 0; i < r.length; i++) {
                if      (r[i] === 0)   r0++;
                else if (r[i] === 1)   r1++;
                else if (r[i] === 2)   r2++;
                else                   beyond++;
              }
              return { r0, r1, r2, beyond };
            })()
          : null,
      }),
      // Read the count of cancelled-vs-fired rAFs since mount.
      // Useful for verifying destroy() / rebuildForMode B1+B2.
      rafIds: () => ({
        anim:  local.animRafId,
        hover: local.hoverRafId,
        idle:  local.idleLabelRaf,
        scrub: local.scrubRafId,
      }),

      // ── Phase 6d5 — ground-truth bug probe ─────────────────
      // dumpBugState() captures every signal we'd need to diagnose
      // the recurring "wires light up after resize" bug in ONE
      // snapshot. Call it from the console right after the bug
      // appears and paste the JSON back. Combines:
      //   - JS-side state (focusedSet, lockedSet, hoverId,
      //     local.edgeStates counts, dim_amount, hasFocus)
      //   - GPU-side state (actual edge-state VBO bytes via
      //     renderer.debugReadEdgeStates — async)
      //   - Bucket palette uniform (the HOT color lookup)
      //   - Camera state + viewport + DPR
      // Returns a Promise<{js, gpu, palette, env, params}>.
      dumpBugState: async () => {
        const r = local.renderer;
        const fs = local.focusedSet;
        const es = local.edgeStates || new Float32Array(0);
        const et = local.edgeTargets || new Float32Array(0);
        let jsZeros = 0, jsOnes = 0, jsOther = 0;
        for (let i = 0; i < es.length; i++) {
          if      (es[i] === 0) jsZeros++;
          else if (es[i] === 1) jsOnes++;
          else                  jsOther++;
        }
        let tgtZeros = 0, tgtOnes = 0, tgtOther = 0;
        for (let i = 0; i < et.length; i++) {
          if      (et[i] === 0) tgtZeros++;
          else if (et[i] === 1) tgtOnes++;
          else                  tgtOther++;
        }
        const ns = local.nodeStates || new Float32Array(0);
        let nsStateZ = 0, nsStateO = 0, nsSelZ = 0, nsSelO = 0;
        for (let i = 0; i < ns.length; i += 2) {
          if (ns[i] === 0) nsStateZ++; else if (ns[i] === 1) nsStateO++;
          if (ns[i + 1] === 0) nsSelZ++; else if (ns[i + 1] === 1) nsSelO++;
        }
        const gpuEdges  = r && r.debugReadEdgeStates ? await r.debugReadEdgeStates() : null;
        const gpuNodes  = r && r.debugReadNodeStates ? await r.debugReadNodeStates() : null;
        const palette   = r && r.bucketHotPalette ? r.bucketHotPalette() : null;
        return {
          js: {
            mode:           local.mode && local.mode.id,
            hoverId:        local.hoverId,
            lockedIdsSize:  local.lockedSet ? local.lockedSet.size : 0,
            lockedIds:      local.lockedSet ? Array.from(local.lockedSet) : [],
            focusedSetSize: fs ? fs.size : null,
            edgeStates: {
              length: es.length,
              zeros: jsZeros, ones: jsOnes, other: jsOther,
            },
            edgeTargets: {
              length: et.length,
              zeros: tgtZeros, ones: tgtOnes, other: tgtOther,
            },
            animRafActive: local.animRafId != null,
            nodeStates: {
              pairs: ns.length / 2,
              state: { zeros: nsStateZ, ones: nsStateO, other: (ns.length / 2) - nsStateZ - nsStateO },
              selected: { zeros: nsSelZ, ones: nsSelO },
            },
            nodeTargets: (() => {
              const nt = local.nodeTargets || new Float32Array(0);
              let z = 0, o = 0, ot = 0;
              for (let i = 0; i < nt.length; i += 2) {  // state channel only
                if (nt[i] === 0) z++;
                else if (nt[i] === 1) o++;
                else ot++;
              }
              return { pairs: nt.length / 2, state: { zeros: z, ones: o, other: ot } };
            })(),
            timeline: local.timeline ? {
              lo: local.timeline.lo, hi: local.timeline.hi,
              inDate: local.timeline.inDate, outDate: local.timeline.outDate,
              centerDate: local.timeline.centerDate,
              isNarrowed: (local.timeline.inDate > local.timeline.lo || local.timeline.outDate < local.timeline.hi),
            } : null,
            modeEdgesLen: local.mode && local.mode.edges ? local.mode.edges.length : null,
          },
          gpu: { edges: gpuEdges, nodes: gpuNodes },
          palette,
          env: {
            dpr:        window.devicePixelRatio || 1,
            lastSize:   { w: local.lastSize.w, h: local.lastSize.h },
            canvas:     { w: canvas.width, h: canvas.height },
            camera:     camera.state,
            cacheBust:  (document.querySelector('script[src*="views/forge"]') || {}).src,
          },
          params: {
            dim_amount:               local.params.dim_amount,
            dim_amount_nodes:         local.params.dim_amount_nodes,
            wire_min_screen_px:       local.params.wire_min_screen_px,
            wire_max_screen_px:       local.params.wire_max_screen_px,
            idle_opacity_fusion:      local.params.idle_opacity_fusion,
            idle_color_fusion:        local.params.idle_color_fusion,
            active_color_transmission: local.params.active_color_transmission,
            active_color_fusion:      local.params.active_color_fusion,
            active_opacity_fusion:    local.params.active_opacity_fusion,
          },
          ts: new Date().toISOString(),
        };
      },
    };

    // ── Bootstrap renderer + first frame ────────────────
    (async function bootstrap() {
      let renderer;
      try {
        renderer = await gpu.create(canvas);
      } catch (err) {
        if (local.destroyed) {
          if (renderer && renderer.destroy) {
            try { renderer.destroy(); } catch (e) { /* ignore */ }
          }
          return;
        }
        const msg = err && err.message ? err.message : String(err);
        rootEl.innerHTML = '<div class="forge-error">'
          + 'WebGPU bootstrap failed: ' + escapeHtml(msg) + '</div>';
        return;
      }
      if (local.destroyed) {
        try { renderer.destroy(); } catch (e) { /* ignore */ }
        return;
      }
      local.renderer = renderer;

      // Upload the 7-bucket hot-color palette for the edge
      // fragment shader (Phase 4a hot-edge brighten). Order
      // MUST match BUCKET_INDEX in src/js/engine/graph/edge.js.
      // Phase 6: source from `local.params` so the dev panel's
      // per-bucket active color/opacity drives the palette
      // directly — no second source of truth.
      renderer.setBucketPalette(hotPaletteFromParams());

      // 2026-05-20 — build the glyph atlas asynchronously and
      // upload to the GPU. Replaces the DOM glyph overlay (was
      // the perf cliff John discovered when zooming out). The
      // glyph instance buffer rebuilds at rebuildForMode time;
      // we fire the next drawFrame after upload completes so the
      // glyphs appear without needing a user interaction.
      local.glyphAtlas = null;
      // Phase 4B FX4 (2026-05-20) — atlas cell size bumped 64 → 128
      // and a full mip chain shipped. ~1.3 MB texture vs ~70 KB
      // pre-Phase-4B; one-shot at boot. Removes Retina blur at deep
      // zoom on DPR=2/3 displays. The atlas builder generates per-
      // mip downsampled canvases via browser drawImage at high
      // quality; setGlyphAtlas uploads each mip level.
      glyphmod.buildAtlas(128).then((atlas) => {
        if (local.destroyed || !local.renderer) return;
        local.renderer.setGlyphAtlas(atlas.canvas, atlas.uvRects, atlas.mipCanvases);
        local.glyphAtlas = atlas;
        // Rebuild glyph instance buffer + draw once the atlas
        // is live so we don't wait for the next user action.
        rebuildGlyphInstanceBuffer();
        drawFrame();
      }).catch((e) => {
        console.warn('[forge] glyph atlas build failed:', e && e.message);
      });

      const devEl = document.getElementById('forge-status-device');
      if (devEl) {
        devEl.textContent = 'active · ' + renderer.format;
        devEl.classList.remove('forge-status-pending');
        devEl.classList.add('forge-status-ok');
      }

      // Initial resize + camera fit + first frame. Synchronous —
      // do NOT defer through rAF (preview iframe throttles it).
      resizeAndFit(true);

      // Phase 4d: bake the initial mode (deities by default).
      // Must happen AFTER resizeAndFit so the camera has a valid
      // viewport for the fitToExtent call inside rebuildForMode.
      rebuildForMode(local.mode.id);

      local.resizeObs = new ResizeObserver(() => {
        if (local.destroyed) return;
        resizeAndFit(false);
      });
      local.resizeObs.observe(stage);

      // Camera re-renders on every change. The interaction
      // handlers below mutate `camera`; the listener pushes
      // a new frame each time.
      // Phase 6: zoom also retriggers (a) the node-size clamp
      // pack (when scale crosses ~5%) and (b) idle-label
      // visibility recomputation (per-tier zoom thresholds).
      camera.onChange(() => {
        if (local.destroyed) return;
        // Phase 4B FX1 (2026-05-20) — camera moved → glyph cull
        // recompute on next drawFrame (screen-projection depends
        // on cam.scale / centerX / centerY + viewport). Cheap to
        // over-set: the cull is in refreshGlyphAlphas which is
        // gated by this flag.
        local.glyphInstancesDirty = true;
        // Re-pack nodes if the camera scale has drifted enough
        // since the last pack. 5% threshold keeps a smooth pan
        // free from re-packs while a real zoom triggers one.
        const camScale = camera.state.scale;
        const lastScale = local.packedAtScale || camScale;
        if (lastScale > 0) {
          const ratio = camScale / lastScale;
          if (ratio < 0.95 || ratio > 1.05) {
            rebakeNodes();
            updateZoomGizmo();
            return;
          }
        }
        drawFrame();
        scheduleIdleLabelSync();
        updateZoomGizmo();
      });

      // Phase 6d — zoom gizmo wire-up. Shows current camera
      // scale as a %, click resets to the fit-the-wheel scale.
      const gizmoEl = document.getElementById('forge-zoom-gizmo');
      if (gizmoEl) {
        gizmoEl.addEventListener('click', () => {
          camera.flyTo({
            centerX: 0, centerY: 0,
            scale:   computeFitScale(),
          }, 0.35);
          if (camera.isAnimating()) startAnimLoop();
        });
      }
      updateZoomGizmo();

      // Mode dropdown wire-up (Phase 4d).
      const modeSelectEl = document.getElementById('forge-status-mode');
      if (modeSelectEl) {
        modeSelectEl.value = local.mode.id;
        modeSelectEl.addEventListener('change', (ev) => {
          if (local.destroyed) return;
          rebuildForMode(ev.target.value);
        });
      }

      // Search wire-up (Phase 4f).
      const searchEl = document.getElementById('forge-status-search');
      if (searchEl) {
        // Enter → search + fly-to. Live-typing doesn't fire to
        // avoid camera lurching with each keystroke; user commits.
        searchEl.addEventListener('keydown', (ev) => {
          if (local.destroyed) return;
          if (ev.key === 'Enter') {
            ev.preventDefault();
            handleSearch(searchEl.value);
          } else if (ev.key === 'Escape') {
            searchEl.value = '';
            searchEl.blur();
          }
        });
      }

      // Timeline scrubber wire-up (2026-05-20). Three handles —
      // IN / CENTER / OUT — drag to set bounds + playhead.
      wireTimelineScrubber();

      // Bind interaction handlers AFTER renderer is ready.
      attachInteractions();
    })();

    // ── rebuildForMode (Phase 4d) ──────────────────────
    // Filter nodes for the mode, recompute the radial layout,
    // pack instance buffers, rebuild adjacency + hit-test
    // index, clear hover/lock, reset camera fit. Safe to call
    // before the renderer exists (it stores state); the next
    // drawFrame() picks up the new instance buffers.
    //
    // Heavy work scales with the active mode's node count, not
    // the whole vault — `documents` at 700+ nodes is the busiest
    // and still finishes in <20 ms on modern hardware.
    function rebuildForMode(modeId) {
      if (!modemod.isValidMode(modeId)) modeId = modemod.defaultMode();

      // Phase 2B B2 (2026-05-20) — drain any pending hover-coalesce
      // BEFORE swapping local.mode. Without this, the pending rAF
      // callback would fire post-swap and call recomputeFocus()
      // against the new mode's adjacency with the old hoverPendingId,
      // producing a brief ghost-hover on a node id that may not
      // exist in the new mode. The hoverId reset further down at
      // local.hoverId = null is correct but doesn't address the
      // pending recompute the rAF still holds.
      cancelHoverCoalesce();

      const modeNodes = modemod.filterNodesByMode(modeId, allNodes, allEdges);
      const modeEdges = layout.filterEdgesByNodes(allEdges, modeNodes);
      const degree    = layout.computeDegree(modeNodes, modeEdges);
      const lay       = layout.radialWedgeLayout(modeNodes, familyOrder, { degree });

      // 2026-05-19 — pack-scale-fix. packNodes bakes the world
      // radius using `camScale` at pack time (the screen-px clamp
      // in node.js:126-131 reads it). If we pack BEFORE fitting
      // the camera, the first pack uses scale=1.0 (the camera
      // default), then fitToExtent below shrinks scale to ~0.4 —
      // and every disk renders at the wrong on-screen size until
      // a user gesture happens to cross the 5%-drift threshold in
      // camera.onChange. (That's why John's three-state bug
      // looked like "tiny dots on load, snap to correct on first
      // mouse move, tiny dots again after resize".) Fit first,
      // then pack at the now-correct scale.
      const ext = {
        x0: -(lay.rOuter + WORLD_PAD), y0: -(lay.rOuter + WORLD_PAD),
        x1:  (lay.rOuter + WORLD_PAD), y1:  (lay.rOuter + WORLD_PAD),
      };
      camera.stopAnim();
      if (local.lastSize.w && local.lastSize.h) {
        camera.fitToExtent(ext, local.lastSize, 0);
      }
      // 2026-05-19 — pan bounds. Allow the user to pan a half-
      // viewport-worth beyond each edge of the wheel so the
      // outermost nodes can be brought toward center, but stop
      // them from infinite-panning into empty space. Margin is
      // generous (worldSpan units) so they always have headroom.
      if (camera.setPanBounds) {
        const span = Math.max(ext.x1 - ext.x0, ext.y1 - ext.y0);
        const margin = span * 0.5;
        camera.setPanBounds(
          ext.x0 - margin, ext.y0 - margin,
          ext.x1 + margin, ext.y1 + margin,
        );
      }

      const nodePack  = graph.packNodes(modeNodes, lay.positions, degree, nodeOverridesFromParams());
      // N4 (2026-05-20) — pack-scale invariant: every site that
      // calls packNodes must immediately record the scale the pack
      // was made at. Saves the `||` fallback in camera.onChange
      // from masking the bug from feedback_pack_scale_invariant.md.
      local.packedAtScale = (camera && camera.state) ? camera.state.scale : 1;
      // 2026-05-19 — Build the radii lookup so packEdges can
      // offset each wire to the source/target disk perimeter,
      // fanning wires out around each hub's circumference
      // instead of bundling them all at the center.
      const radiiById = buildRadiiMap(nodePack);
      const edgePack  = graph.packEdges(modeEdges, lay.positions, Object.assign({}, edgeOverridesFromParams(), { nodeRadii: radiiById }));
      const adj       = graph.buildAdjacency(modeEdges);
      // N6 (Phase 1B) — reuse the classifier built inside packNodes
      // instead of recomputing. Eliminates two redundant O(N log N)
      // sorts per mode rebuild and the drift risk if classifier
      // semantics change.
      const tierFor   = nodePack.tierFor || graph.buildTierClassifier(modeNodes, degree);

      // N1 (2026-05-20) — hit-test spatial grid built alongside
      // the hitNodes array in one pass. cellSize = 2 × maxRadius
      // ensures a node CENTER is within 1 cell of any point its
      // disk contains; hitTestAt queries the 3×3 neighborhood.
      // Drops hit-test from O(N) per pointermove to O(neighborhood)
      // — ~2-10 candidates regardless of N. See AUDIT/forge-rebuild-
      // 1A-node-atom-2026-05-20.md §3 N1.
      const hitNodesNew = new Array(nodePack.instanceCount);
      const hitByIdNew  = new Map();
      let maxRadius     = 0;
      for (let i = 0; i < nodePack.instanceCount; i++) {
        const off = i * NODE_FLOATS;
        const id  = nodePack.idIndex[i];
        const hn  = {
          id,
          x:    nodePack.data[off + 0],
          y:    nodePack.data[off + 1],
          r:    nodePack.data[off + 2],
          tier: tierFor(degree.get(id) || 0),
        };
        hitNodesNew[i] = hn;
        hitByIdNew.set(id, hn);
        if (hn.r > maxRadius) maxRadius = hn.r;
      }
      const hitGridNew = buildHitGrid(hitNodesNew, ext, maxRadius);

      local.mode = {
        id:          modeId,
        nodes:       modeNodes,
        edges:       modeEdges,
        positions:   lay.positions,
        adjacency:   adj,
        nodePacked:  nodePack,
        edgePacked:  edgePack,
        hitNodes:    hitNodesNew,
        hitById:     hitByIdNew,
        hitGrid:     hitGridNew,
        worldExtent: ext,
      };
      // N2 (2026-05-20) — fresh nodePacked.data means the GPU
      // node-instance VBO needs re-upload on the next drawFrame.
      // After upload, drawFrame resets the flag to false so steady-
      // state animation skips the ~21KB upload at 663 nodes
      // (~106 MB/s saved at 10k).
      local.nodeInstancesDirty = true;
      // Phase 3B F3 — same shape for the edge instance VBO.
      // packEdges ran above; the static geometry needs re-upload
      // on the next drawFrame.
      local.edgeInstancesDirty = true;
      // ════════════════════════════════════════════════════════════
      // FADE-PIPELINE INVARIANT — EXCEPTION SITE (Phase 2B B5,
      // 2026-05-20)
      // ════════════════════════════════════════════════════════════
      // The four lines below WHOLESALE-REPLACE local.nodeStates /
      // nodeTargets / edgeStates / edgeTargets. This is the SOLE
      // legitimate wholesale-replace site in the entire fade
      // pipeline. Every OTHER mutation must update in place via
      // .set() so an in-flight fade keeps animating (see
      // tickNodeFades / tickEdgeFades + rebakeNodes / rebakeEdges
      // for the fade-aware pattern).
      //
      // Why this site IS the exception: mode-switch changes the
      // instance count (deities=676 vs documents=494 etc.). The
      // buffers MUST be re-sized; preserving the old values would
      // index into the wrong nodes. Hover + lock are cleared just
      // below, so there's no in-flight fade to corrupt.
      //
      // DO NOT factor these lines into a helper that rebakeNodes
      // or recomputeFocus could call. Doing so brought back the
      // "fade snaps mid-transition" bug class twice in history
      // (see AUDIT/forge-animation-pipeline-2026-05-20.md §1).
      //
      // State buffer shapes:
      //   - Nodes: 2 floats per instance (state, selected).
      //     state defaults to 0 (no dim, full alpha); selected
      //     defaults to 0.
      //   - Edges: 1 float per instance. Convention (post-2026-
      //     05-18 flip): 0 = IDLE (safe default), 1 = HOT.
      //   Zero-init is correct by construction; no .fill() needed.
      // ════════════════════════════════════════════════════════════
      local.nodeStates  = new Float32Array(nodePack.instanceCount * 2);
      local.nodeTargets = new Float32Array(nodePack.instanceCount * 2);
      local.edgeStates  = new Float32Array(edgePack.instanceCount);
      local.edgeTargets = new Float32Array(edgePack.instanceCount);

      // Cross-mode hover/lock cleared — node ids don't map
      // between modes.
      local.hoverId    = null;
      local.lockedSet  = new Set();
      local.focusedSet = null;
      // 2026-05-20 — audit-flagged root cause of the IDLE-hover
      // lag: first hover from a settled IDLE state was creating
      // ~47 label divs on the spot (appendChild × 47 + a single
      // batched reflow). The DOM materialization stalled the
      // render thread for 1-2 frames, swallowing the fade
      // visually — so the user perceived "no animation, slow".
      // LOCKED-hover felt smooth because the locked node's labels
      // ALREADY existed in DOM from the lock click.
      //
      // Fix: PRE-CREATE label DOM for every node in the mode now,
      // at opacity:0 (CSS default — no data-visible attribute).
      // First hover only flips `data-visible="1"` on the diff —
      // zero DOM allocation, zero reflow. The IDLE↔hover stall
      // is fully eliminated.
      for (const el of local.labelEls.values()) {
        try { el.remove(); } catch (e) { /* ignore */ }
      }
      local.labelEls.clear();
      // Phase 4B FX6 (2026-05-20) — clear the visibility tracker
      // alongside labelEls so syncLabels starts from a clean slate.
      if (local.visibleLabelEls) local.visibleLabelEls.clear();

      // 2026-05-20 — DOM glyph overlay removed. The 663-span
      // DOM layer was the perf cliff (syncGlyphPositions ran
      // every drawFrame writing 4 style properties per glyph =
      // ~160k DOM writes/sec when zoomed out, where ALL glyphs
      // are in viewport). Glyphs are now drawn in the WebGPU
      // canvas via a texture-atlas sampling instanced quad
      // (`rebuildGlyphInstanceBuffer` → `renderer.drawFrame`'s
      // glyph pass). One typed-array allocation + one GPU
      // buffer write per mode + per-frame alpha refresh from
      // nodeStates (so glyphs still fade with focus dim).
      //
      // Build the local.mode.nodesById Map (used by the
      // scrubber filter); the rest of the work moved to
      // rebuildGlyphInstanceBuffer below.
      const modeNodeById = new Map();
      for (const n of modeNodes) modeNodeById.set(n.id, n);
      local.mode.nodesById = modeNodeById;

      // 2026-05-20 — pre-create label DOM so a first hover doesn't
      // pay the appendChild + reflow cost mid-interaction.
      //
      // Phase 4B FX3 (2026-05-20) — pre-create cap. Previously this
      // walked the full mode (N), producing 10k <div>s on a 10k-N
      // mode-switch (~150-300 ms stall) and ~50k <div>s at 50k
      // (~1-2 s freeze). The hover-stall fix only needs enough
      // pre-created headroom for the idle-tier hierarchy + focused-
      // set cap. The cap = `label_idle_max + label_cap × 2` ≈ 1000
      // today and tracks the user's tuned params automatically.
      // Anything beyond the cap lazy-creates via `ensureLabelEl`
      // on first reveal — a single appendChild is fast enough to
      // be invisible. See AUDIT/forge-rebuild-4A-fx-2026-05-20.md
      // §3 FX3.
      const idleMax = (local.params && typeof local.params.label_idle_max === 'number')
        ? local.params.label_idle_max : 750;
      const labelCap = (local.params && typeof local.params.label_cap === 'number')
        ? local.params.label_cap : 120;
      const preCreateCap = Math.min(nodePack.instanceCount, idleMax + labelCap * 2);
      const labelFrag = document.createDocumentFragment();
      for (let i = 0; i < preCreateCap; i++) {
        const id = nodePack.idIndex[i];
        // ensureLabelEl appends to labelsOverlay directly, so to
        // batch we replicate its core inline + use the fragment.
        if (local.labelEls.has(id)) continue;
        const el = document.createElement('div');
        el.className = 'forge-label';
        const node = nodeById(id);
        let title = (node && node.title) || '';
        if (!title) {
          const mn = modeNodeById.get(id);
          if (mn && mn.title) title = mn.title;
        }
        el.textContent = title || id;
        labelFrag.appendChild(el);
        local.labelEls.set(id, el);
      }
      labelsOverlay.appendChild(labelFrag);

      // Status strip counters + dropdown selection sync.
      const nEl = document.getElementById('forge-status-nodes');
      const eEl = document.getElementById('forge-status-edges');
      const hEl = document.getElementById('forge-status-hover');
      const lEl = document.getElementById('forge-status-lock');
      if (nEl) nEl.textContent = String(nodePack.instanceCount);
      if (eEl) eEl.textContent = String(edgePack.instanceCount);
      if (hEl) hEl.textContent = '—';
      if (lEl) lEl.textContent = '—';

      // 2026-05-20 — populate the GPU glyph instance buffer. Was
      // previously a DOM `<span>` per node (perf cliff on zoom-out).
      // Now a single typed array → one GPU buffer write → drawn
      // as instanced quads sampling the atlas.
      rebuildGlyphInstanceBuffer();
      // Camera fit already done above (before packNodes) so the
      // pack ran at the correct scale. Just draw.
      drawFrame();
    }

    // ── Zoom gizmo (Phase 6d) ────────────────────────────
    // Reports current camera scale as a percentage relative to
    // the FIT scale (the scale that frames the whole wheel into
    // the viewport). 100% = wheel fills the viewport; >100% =
    // zoomed in; <100% = zoomed out. Click = fly back to fit.
    function computeFitScale() {
      const vp = local.lastSize;
      if (!vp.w || !vp.h || !local.mode || !local.mode.worldExtent) return 1;
      const ext = local.mode.worldExtent;
      const wx = ext.x1 - ext.x0;
      const wy = ext.y1 - ext.y0;
      if (wx <= 0 || wy <= 0) return 1;
      return Math.min(vp.w / wx, vp.h / wy);
    }
    function updateZoomGizmo() {
      const gizmoEl = document.getElementById('forge-zoom-gizmo');
      if (!gizmoEl) return;
      const fit = computeFitScale();
      if (fit <= 0) { gizmoEl.textContent = '—'; return; }
      const pct = Math.round((camera.state.scale / fit) * 100);
      gizmoEl.textContent = pct + '%';
      gizmoEl.classList.toggle('is-at-fit', Math.abs(pct - 100) <= 1);
    }

    // ── resize + fit ─────────────────────────────────────
    function resizeAndFit(initial) {
      if (!local.renderer || local.destroyed) return;
      const rect = stage.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const sizeChanged = (w !== local.lastSize.w || h !== local.lastSize.h);
      if (sizeChanged) {
        local.lastSize = { w, h };
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';
        local.renderer.resize(w, h);
      }
      if (initial) {
        // Frame the wheel into the viewport on mount.
        camera.fitToExtent(local.mode.worldExtent, { w, h }, 0);
      } else if (sizeChanged) {
        // 2026-05-19 — DO NOT auto-refit on resize. John's
        // feedback: "Resizing on zooms makes the wheel zoom out
        // to 100% and centers it — we don't want that." The
        // camera should preserve the user's zoom + pan state
        // through a viewport resize. Only the canvas pixel size
        // changes; world coords stay anchored.
        //
        // We still need rebakeNodes() below because packNodes
        // bakes the on-screen-px clamp into the world radius
        // using camera.state.scale at pack time — but the scale
        // itself stays where the user left it.
        // Phase 6d — defensive: REBUILD EVERY GPU-side per-instance
        // buffer from scratch. The "wires turn orange after resize"
        // bug John reported was a state-buffer corruption that I
        // can't reproduce in the preview iframe but is clearly
        // observable on his machine. This hammer guarantees the
        // GPU sees the correct edge instance data (idle colours +
        // widths from packEdges) AND the correct edge state
        // (computed from the current hover/lock set), independent
        // of whatever transient state the rest of the pipeline
        // might have left behind. Cost: ~1 ms at 3033 edges, only
        // when the canvas actually resizes — not per pan.
        if (local.mode && local.mode.adjacency) {
          // 2026-05-19 — pack-scale-fix. Resize changes the
          // camera scale (because fitToExtent re-frames to the
          // new viewport), and packNodes bakes the world radius
          // using that scale. Without rebakeNodes, the cached
          // wrong-scale radii survive every resize — visible as
          // John's "tiny dots after resize even though the bake
          // landed correctly" report. camera.onChange's 5%-drift
          // guard does NOT reliably catch this (a small or
          // gradual resize doesn't cross the threshold).
          rebakeNodes();      // re-pack at new scale (radii + glyphs)
          rebakeEdges();      // re-pack instance buffer (colour + widths)
          recomputeFocus();   // re-derive node + edge state buffers
          // Phase 3B F2 (2026-05-20) — `forceWriteEdgeState` deleted.
          // The 2026-05-18 hard-stop hammer is dead-code post the
          // adjacency.js convention flip: zero-init = IDLE is the
          // safe default, and `recomputeFocus` above wrote
          // `local.edgeStates`; the trailing `drawFrame()` uploads
          // it through the normal path. No belt-and-braces needed.
          drawFrame();
        }
      }
      // camera.onChange would have triggered draw, but if
      // camera state was already at fit (e.g., first call before
      // listener attached), draw explicitly.
      drawFrame();
    }

    // ── Frame draw ──────────────────────────────────────
    function drawFrame() {
      if (!local.renderer || local.destroyed) return;
      const vp = local.lastSize;
      if (!vp.w || !vp.h) return;
      const t0 = performance.now();
      // dim_amount only applies when something is in focus. At
      // true idle (no hover, no lock) we pass 0 so the already-
      // faint idle alphas (0.10–0.30) aren't further attenuated.
      const hasFocus      = !!(local.focusedSet && local.focusedSet.size);
      // Phase 2B B6 (2026-05-20) — dim-model dispatcher.
      //   A4 (default) — full mass-dim on both IDLE-hover and
      //     LOCKED-hover (current behavior; audit verdict says
      //     this is semantically correct: IDLE = "I'm navigating,
      //     scene reacts"; LOCKED = "I've committed, surgical").
      //   A1 — halved IDLE-hover dim so the mass-flip is gentler;
      //     LOCKED keeps full dim.
      //   A2 — A1 + Phase-4 CSS treatment on lock indicator (CSS
      //     side TODO). In Phase 2B A2 = A1.
      //   A3 — staggered cascade by ring; handled in tickNodeFades
      //     via local.scratch.ringDist (precomputed in recomputeFocus
      //     when A3 is active). The drawFrame dim-amount itself
      //     uses A4 values.
      // Toggle via window._forgeDebug.setDimModel('A1'|'A2'|'A3'|'A4').
      const dimModel    = local._dimModel || 'A4';
      const isIdleHover = !local.lockedSet || local.lockedSet.size === 0;
      const dimMulN = (isIdleHover && (dimModel === 'A1' || dimModel === 'A2'))
        ? 0.5 : 1.0;
      const effectiveDim  = hasFocus ? local.params.dim_amount               : 0;
      const effectiveDimN = hasFocus ? local.params.dim_amount_nodes * dimMulN : 0;
      // Hex glow → rgb in 0..1. Cheap; called once per frame.
      const gh = local.params.selected_glow_color || '#FFFFFF';
      const glowRgb = [
        parseInt(gh.slice(1, 3), 16) / 255,
        parseInt(gh.slice(3, 5), 16) / 255,
        parseInt(gh.slice(5, 7), 16) / 255,
      ];
      // N2 (Phase 1B) / Phase 3B F3 / Phase 4B FX1 — gate the
      // static instance buffer writes on the dirty flags (skips
      // ~21KB node + ~145KB edge + ~21KB glyph GPU upload per
      // frame at deities / ~270 MB/s combined saved at 10k).
      // _forgeDebug.nodeOnly() hides edges + glyphs;
      // _forgeDebug.edgesAndNodesOnly() hides only glyphs.
      const nodeOnly         = !!local._nodeOnly;
      const edgesAndNodesOnly = !!local._edgesAndNodesOnly;
      const frameNVB  = local.mode.nodePacked.data;
      const frameEVB  = nodeOnly ? null : local.mode.edgePacked.data;
      // FX1 — refresh ONLY when the alpha column may have changed
      // (rebake, focus change, fade in flight, or camera moved).
      // When settled the JS O(N) loop is skipped + the buffer
      // reference passes through unchanged. The dirty bool propagates
      // to the renderer, which skips the writeBuffer too.
      const glyphsHidden = nodeOnly || edgesAndNodesOnly;
      const glyphsDirty  = !glyphsHidden && local.glyphInstancesDirty;
      if (glyphsDirty) refreshGlyphAlphas();
      const frameGVB = glyphsHidden ? null : (local.glyphInstanceData || null);
      local.renderer.drawFrame({
        viewportCss:           { w: vp.w, h: vp.h },
        camera:                camera.state,
        dimAmount:             effectiveDim,
        dimAmountNodes:        effectiveDimN,
        wireMinScreenPx:       local.params.wire_min_screen_px,
        wireMaxScreenPx:       local.params.wire_max_screen_px,
        selectedSizeMult:      local.params.selected_size_mult,
        selectedGlowStrength:  local.params.selected_glow_strength,
        selectedGlowExtent:    local.params.selected_glow_extent,
        selectedGlowColorRgb:  glowRgb,
        nodeInstances:         frameNVB,
        nodeInstancesDirty:    local.nodeInstancesDirty,
        edgeInstances:         frameEVB,
        edgeInstancesDirty:    local.edgeInstancesDirty,
        nodeStates:            local.nodeStates,
        edgeStates:            local.edgeStates,
        glyphInstances:        frameGVB,
        glyphInstancesDirty:   glyphsDirty,
      });
      // After the renderer has consumed the dirty buffers, reset
      // all three flags. Next pack / focus / fade / camera sets
      // re-set them.
      local.nodeInstancesDirty  = false;
      local.edgeInstancesDirty  = false;
      local.glyphInstancesDirty = false;
      const dt = performance.now() - t0;
      const fEl = document.getElementById('forge-status-frame');
      if (fEl) fEl.textContent = dt.toFixed(1) + ' ms';
      // Labels are CSS-positioned over the canvas, so any camera
      // change also needs them re-positioned. Cheap when small;
      // skip entirely when no focus is set.
      syncLabelPositions();
      // Glyphs are now in the WebGPU canvas (GPU glyph pass) so
      // they project via the same view-uniform as disks/edges —
      // no per-frame DOM sync needed.
    }

    // Phase 4B FX9 (2026-05-20) — `syncGlyphPositions` /
    // `syncGlyphFocus` stubs DELETED. The DOM glyph machinery
    // they wrapped was retired with the GPU glyph migration; the
    // no-op stubs were kept as breadcrumbs for stragglers. All
    // callers are now removed (this commit), so the stubs go too.

    // ── GPU glyph instance buffer (2026-05-20) ──────────
    // Builds the per-node instance data the WebGPU glyph pass
    // consumes. Each instance is 8 floats (32 bytes):
    //   [0..1]  world pos (x, y)
    //   [2]     world radius (the disk's r — glyph sized to it)
    //   [3]     glyphIdx (atlas slot, 0..16)
    //   [4..6]  tint rgb (family color, parsed from hex)
    //   [7]     alpha (base * dim multiplier, updated per frame)
    //
    // Called once per rebuildForMode to populate static parts;
    // the alpha column is refreshed per drawFrame via the existing
    // nodeStates buffer so glyphs dim alongside their parent disks.
    function rebuildGlyphInstanceBuffer() {
      if (!local.glyphAtlas || !local.mode || !local.mode.nodePacked) return;
      const np = local.mode.nodePacked;
      const N = np.instanceCount;
      const data = new Float32Array(N * 8);
      const nodesById = local.mode.nodesById || new Map();
      const NF = NODE_FLOATS;
      const idxOf = local.glyphAtlas.typeToIdx;
      const baseOp = (local.params && typeof local.params.glyph_opacity === 'number')
        ? local.params.glyph_opacity : 0.85;
      // 2026-05-20 — apply glyph_scale on the radius so GPU
      // glyphs match the prior DOM glyph sizing
      // (`dPx = 2 * baseR * sc * glyphScale`). The shader
      // applies selected_size_mult on top of this for selected
      // nodes (so selected disk + glyph grow together).
      const glyphScale = (local.params && typeof local.params.glyph_scale === 'number')
        ? local.params.glyph_scale : 0.85;
      for (let i = 0; i < N; i++) {
        const id = np.idIndex[i];
        const n  = nodesById.get ? nodesById.get(id) : null;
        const off = i * 8;
        // World pos + radius from the packed node data (post
        // screen-px-clamp — same world units the disks render at).
        data[off + 0] = np.data[i * NF + 0];
        data[off + 1] = np.data[i * NF + 1];
        data[off + 2] = np.data[i * NF + 2] * glyphScale;
        // Glyph type index from the atlas lookup.
        const typeKey = n && n.type ? n.type : 'theme';
        data[off + 3] = glyphmod.idxForType(idxOf, typeKey);
        // Tint = lighter hue of family color. Phase 4B FX7
        // (2026-05-20) — glyph_tint deleted from PARAM_DEFAULTS;
        // factor frozen at 0.55 (matches the prior DOM-glyph
        // visual reading). To re-tune, change the literal here.
        const fc = (n && (n.family_color || n.tradition_color)) || '#cccccc';
        const tint = mth.lightenColor(fc, 0.55);
        const rgb = hex2rgba(tint, 1);
        data[off + 4] = rgb[0];
        data[off + 5] = rgb[1];
        data[off + 6] = rgb[2];
        data[off + 7] = baseOp;
      }
      local.glyphInstanceData = data;
      // FX1 — fresh static data; mark dirty so the next drawFrame
      // uploads + the cull recomputes against the current camera.
      local.glyphInstancesDirty = true;
      // FX2 — counter for the cull diagnostic helper (number of
      // instances whose alpha was forced to 0 in the last refresh).
      local.glyphCulledCount = 0;
    }
    // Per-frame alpha refresh — reads local.nodeStates (which
    // animates via tickNodeFades) and updates the alpha column
    // so glyphs fade with their parent disk's dim transition.
    //
    // Phase 4B FX1+FX2 (2026-05-20) — full redesign per
    // AUDIT/forge-rebuild-4A-fx-2026-05-20.md.
    //   FX1 settled-fade short-circuit — drawFrame now gates this
    //     call on local.glyphInstancesDirty. When the flag is false
    //     this function isn't invoked at all; the buffer's alpha
    //     column from the previous tick stays. Renderer skips the
    //     ~21 KB GPU write (~1.6 MB at 50k) when dirty=false.
    //   FX2 viewport + min-size cull — each instance is screen-
    //     projected; alpha forced to 0 when screen_r < 4 px OR the
    //     instance is outside the viewport bounds. The existing
    //     fragment-discard at webgpu.js (alpha < 0.02) catches the
    //     downstream cost; vertex shader still runs, but at 10k
    //     this drops fragment fill from O(N × pixel-coverage) to
    //     ~O(visible-N × pixel-coverage).
    function refreshGlyphAlphas() {
      const data = local.glyphInstanceData;
      const states = local.nodeStates;
      if (!data || !states) return;
      const N = data.length >>> 3;  // /8
      const baseOp = (local.params && typeof local.params.glyph_opacity === 'number')
        ? local.params.glyph_opacity : 0.85;
      const dimMul = (local.params && typeof local.params.dim_amount_glyphs === 'number')
        ? local.params.dim_amount_glyphs : 0.7;
      // FX2 cull setup — read camera + viewport. If unavailable
      // (early boot), skip cull and just compute alpha.
      const cam = camera && camera.state;
      const vp  = local.lastSize;
      const cullActive = !!(cam && vp.w && vp.h);
      const camScale   = cullActive ? cam.scale   : 1;
      const camCX      = cullActive ? cam.centerX : 0;
      const camCY      = cullActive ? cam.centerY : 0;
      const halfW = vp.w * 0.5;
      const halfH = vp.h * 0.5;
      const minScreenR = 4;
      let culled = 0;
      for (let i = 0; i < N; i++) {
        let alpha;
        if (cullActive) {
          const wx = data[i * 8 + 0];
          const wy = data[i * 8 + 1];
          const wr = data[i * 8 + 2];
          const screenR = wr * camScale;
          const screenX = (wx - camCX) * camScale + halfW;
          const screenY = (wy - camCY) * camScale + halfH;
          const offScreen = (screenX + screenR < 0)
                         || (screenX - screenR > vp.w)
                         || (screenY + screenR < 0)
                         || (screenY - screenR > vp.h);
          const tooSmall = screenR < minScreenR;
          if (offScreen || tooSmall) {
            alpha = 0;
            culled++;
          } else {
            const state = states[i * 2] || 0;     // 0=focused, 1=dim
            alpha = baseOp * (1 - state * dimMul);
          }
        } else {
          const state = states[i * 2] || 0;
          alpha = baseOp * (1 - state * dimMul);
        }
        data[i * 8 + 7] = alpha;
      }
      local.glyphCulledCount = culled;
    }

    // ── Labels ─────────────────────────────────────────
    // Only paint labels for nodes in the focused set (hover or
    // lock + their 1-hop neighbours). Phase 4c will add an
    // idle-time hub-label pass with deconfliction.
    //
    // syncLabels() — call when the focused set CHANGES. Creates
    //   label divs lazily, shows/hides them, sets text, then
    //   positions them.
    // syncLabelPositions() — call every camera change. Cheap:
    //   only iterates currently-visible labels.
    function ensureLabelEl(id) {
      let el = local.labelEls.get(id);
      if (el) {
        // Phase 6d3 — guard against the "empty label" repro
        // John flagged: if a label was created before the node's
        // title was resolvable (early in mount, or mid-mode-
        // switch), the textContent could be empty. Re-resolve
        // on every reveal so the cached div doesn't show ''.
        if (!el.textContent) {
          const n = nodeById(id);
          el.textContent = (n && n.title) || id;
        }
        return el;
      }
      el = document.createElement('div');
      el.className = 'forge-label';
      // Title resolution chain: global index → mode nodes →
      // fallback to the id itself. Never leave textContent empty.
      let title = '';
      const node = nodeById(id);
      if (node && node.title) title = node.title;
      if (!title && local.mode && local.mode.nodes) {
        for (let i = 0; i < local.mode.nodes.length; i++) {
          if (local.mode.nodes[i].id === id) {
            title = local.mode.nodes[i].title || '';
            break;
          }
        }
      }
      el.textContent = title || id;
      labelsOverlay.appendChild(el);
      local.labelEls.set(id, el);
      return el;
    }
    function syncLabels() {
      const focus = local.focusedSet;
      // Pass 1: compute the UNION of (focused labels) ∪ (idle-tier
      // labels at current zoom). The focused set always wins —
      // hubs in focus don't drop out just because they collide.
      const visible = new Set();
      // Focused labels first (capped).
      if (focus && focus.size > 0) {
        const focusCap = local.params.label_cap || 80;
        let shown = 0;
        for (const id of focus) {
          if (shown >= focusCap) break;
          visible.add(id);
          shown++;
        }
      }
      // Idle-tier labels — only when at TRUE idle (no focus).
      // When focus is active the dim pass already nukes the
      // background to atmosphere; idle hubs would just clutter.
      if (!focus || focus.size === 0) {
        const camScale = camera.state.scale;
        const vp       = local.lastSize;
        const opts     = labelHierarchyFromParams();
        opts.worldToScreen = (x, y) => camera.worldToScreen(x, y, vp);
        const idleSet = graph.computeIdleLabelVisibility(local.mode.hitNodes, camScale, opts);
        for (const id of idleSet) visible.add(id);
      }

      // 2026-05-20 — pure attribute-diff. Label DOM is now
      // pre-created at rebuildForMode time (one batched fragment
      // append for the whole mode), so syncLabels never has to
      // create / append / reflow during hover. Just flips
      // data-visible on the set diff. CSS opacity transition
      // handles the fade.
      //
      // Phase 4B FX6 (2026-05-20) — visible-labels Set. Previously
      // both this diff AND syncLabelPositions walked the full
      // local.labelEls Map every call (O(N) attribute reads, even
      // when only a handful are visible). Now `local.visibleLabelEls`
      // is the source of truth for "what's currently shown"; only
      // the diff loop touches the union (visible ∪ previously-
      // visible), and syncLabelPositions iterates the Set directly.
      // At 10k with ~20 labels visible, position loop drops from
      // 10k Map entries to 20.
      const wasVisible = local.visibleLabelEls || (local.visibleLabelEls = new Set());
      // Compute the symmetric difference: items to hide + items to show.
      // Iterate previously-visible to hide non-members.
      for (const id of wasVisible) {
        if (visible.has(id)) continue;
        const el = local.labelEls.get(id);
        if (el) el.removeAttribute('data-visible');
      }
      // Iterate target-visible to show new members + lazy-create.
      for (const id of visible) {
        let el = local.labelEls.get(id);
        if (!el) {
          // Lazy-create — pre-create cap (FX3) means high-index
          // hub labels weren't pre-created in large modes; ensure
          // here on first reveal.
          el = ensureLabelEl(id);
        }
        if (!el.hasAttribute('data-visible')) {
          el.setAttribute('data-visible', '1');
        }
      }
      // Swap the Set (cheap; both are small).
      local.visibleLabelEls = new Set(visible);
      syncLabelPositions();
    }
    // Idle-label visibility depends on camera scale; positions
    // depend on scale + pan. We only need to RECOMPUTE the
    // visibility set when scale crosses a tier threshold, but
    // it's cheap (1 ms at 663 nodes) so we just rAF-debounce.
    function scheduleIdleLabelSync() {
      if (local.idleLabelRaf) return;
      local.idleLabelRaf = requestAnimationFrame(() => {
        local.idleLabelRaf = 0;
        if (local.destroyed) return;
        syncLabels();
      });
    }
    function syncLabelPositions() {
      const vp = local.lastSize;
      if (!vp.w || !vp.h) return;
      // Phase 4B FX6 (2026-05-20) — iterate local.visibleLabelEls
      // Set directly instead of walking the full local.labelEls
      // Map and skipping non-data-visible entries. At 10k this
      // drops the per-camera-tick cost from 10k attribute reads
      // to (visible count) — typically <100.
      const visible = local.visibleLabelEls;
      if (!visible || visible.size === 0) return;
      const hitById = local.mode.hitById;
      for (const id of visible) {
        const el = local.labelEls.get(id);
        if (!el) continue;
        const n = hitById ? hitById.get(id) : null;
        if (!n) continue;
        const s = camera.worldToScreen(n.x, n.y, vp);
        const px = s.x;
        const py = s.y - n.r * camera.state.scale - 6;
        el.style.left = px + 'px';
        el.style.top  = py + 'px';
      }
    }

    // ── Hover hit-test ──────────────────────────────────
    // Returns the topmost node ID under the cursor, or null.
    // CSS-pixel input; converts to world via camera.
    //
    // N1 (2026-05-20) — queries local.mode.hitGrid (spatial grid)
    // instead of iterating every hitNode. Cell layout ensures any
    // node CENTER that contains the query point is in the 3×3
    // cells around the point's cell. The tie-break (nearest
    // within radius for overlapping disks) is preserved.
    function hitTestAt(cssX, cssY) {
      const w = local.lastSize.w;
      const h = local.lastSize.h;
      if (!w || !h) return null;
      const world = camera.screenToWorld(cssX, cssY, { w, h });
      let best = null;
      let bestDist = Infinity;
      const grid = local.mode && local.mode.hitGrid;
      if (!grid) {
        // Defensive fallback for the (theoretical) case where the
        // grid hasn't been built yet — e.g. a pointermove racing
        // mount before the first rebuildForMode resolves.
        const hitNodes = (local.mode && local.mode.hitNodes) || [];
        for (let i = 0; i < hitNodes.length; i++) {
          const n = hitNodes[i];
          const dx = world.x - n.x;
          const dy = world.y - n.y;
          const d2 = dx * dx + dy * dy;
          if (d2 <= n.r * n.r && d2 < bestDist) {
            best = n.id;
            bestDist = d2;
          }
        }
        return best;
      }
      const gx = Math.floor((world.x - grid.x0) / grid.cellSize);
      const gy = Math.floor((world.y - grid.y0) / grid.cellSize);
      for (let dy = -1; dy <= 1; dy++) {
        const cy = gy + dy;
        if (cy < 0 || cy >= grid.rows) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const cx = gx + dx;
          if (cx < 0 || cx >= grid.cols) continue;
          const bucket = grid.buckets[cy * grid.cols + cx];
          if (!bucket) continue;
          for (let i = 0; i < bucket.length; i++) {
            const n = bucket[i];
            const ddx = world.x - n.x;
            const ddy = world.y - n.y;
            const d2  = ddx * ddx + ddy * ddy;
            if (d2 <= n.r * n.r && d2 < bestDist) {
              best = n.id;
              bestDist = d2;
            }
          }
        }
      }
      return best;
    }

    // ── Animation loop (Phase 4c) ────────────────────────
    // Drives camera.tick(dt) while the camera reports motion.
    // rAF-based so the browser schedules at refresh cadence.
    // The Chrome-throttles-rAF-in-hidden-tabs issue (which we
    // hit at first-paint bootstrap) doesn't apply here — these
    // animations only start in response to user input, which
    // requires the tab to be foreground.
    function startAnimLoop() {
      if (local.animRafId != null) return;     // already running
      local.animLastT = performance.now();
      local.animRafId = requestAnimationFrame(animTick);
    }
    function animTick() {
      if (local.destroyed) {
        local.animRafId = null;
        return;
      }
      const now = performance.now();
      const dt  = (now - local.animLastT) / 1000;
      local.animLastT = now;
      // Clamp dt — if the loop was paused (tab background), the
      // first tick after resume could have a huge dt that
      // teleports the camera. 100ms cap keeps motion sane.
      const dtClamped = Math.min(dt, 0.1);
      const stillMoving = camera.tick(dtClamped);
      // 2026-05-19 — fade ticks. Both edge state buffer and the
      // node (state, selected) interleaved buffer animate toward
      // their targets at FADE_DURATION. Either pulse keeps the
      // rAF loop alive; pure-fade frames need an explicit redraw
      // since camera.tick → onChange → drawFrame only fires when
      // camera state actually changes.
      const stillFadingE = tickEdgeFades(dtClamped);
      const stillFadingN = tickNodeFades(dtClamped);
      const stillFading  = stillFadingE || stillFadingN;
      if (stillFading && !stillMoving) {
        drawFrame();
      }
      if (stillMoving || stillFading) {
        local.animRafId = requestAnimationFrame(animTick);
      } else {
        local.animRafId = null;
      }
    }

    // Look up a node by id. NODES_BY_ID is a plain object in
    // this codebase (not a Map). Defensive handling so a future
    // Map refactor doesn't break callers.
    function nodeById(id) {
      const idx = window.NODES_BY_ID;
      if (!idx) return null;
      if (typeof idx.get === 'function') return idx.get(id);
      return idx[id];
    }

    // Re-compute the focused set from current hover + lock state,
    // re-pack per-instance state buffers, update labels, redraw.
    // Called whenever hover changes, lock changes, or camera moves.
    //
    // Phase 6c — three states:
    //   SELECTED    = {hoverId} ∪ lockedSet  (the actual anchors)
    //   HIGHLIGHTED = SELECTED ∪ 1-hop neighbours (focusedSet)
    //   DIMMED      = everything else
    // Selected nodes get glow + size mult in the shader; the
    // node-state attribute is bumped from 1 float to vec2(state, selected).
    function recomputeFocus() {
      const idx       = local.mode.nodePacked.idIndex;
      local.focusedSet  = graph.focusedSetFor(local.hoverId, local.lockedSet, local.mode.adjacency);
      local.selectedSet = computeSelectedSet(local.hoverId, local.lockedSet);
      const states    = graph.computeNodeStates(idx, local.focusedSet);
      const selectFlags = graph.computeSelectedStates
        ? graph.computeSelectedStates(idx, local.selectedSet)
        : new Float32Array(idx.length);
      // 2026-05-20 — timeline scrubber filter. If the user has
      // narrowed the IN/OUT range (i.e., it's tighter than the
      // full bounds), force out-of-range nodes to state=1 (dim).
      // Overlap rule: a node is "in range" if its existence
      // period [date_earliest..date_latest] intersects the
      // [inDate..outDate] range. Nodes without dates are kept
      // in range (don't dim them just for missing data).
      const tl = local.timeline;
      if (tl && (tl.inDate > tl.lo || tl.outDate < tl.hi)) {
        // 2026-05-20 — reuse the pre-built mode.nodesById Map
        // (built once in rebuildForMode) instead of allocating a
        // fresh object every hover. Was the audit-flagged
        // O(N)-per-hover allocation.
        const nodesById = (local.mode && local.mode.nodesById) || new Map();
        const lo = tl.inDate, hi = tl.outDate;
        for (let i = 0; i < idx.length; i++) {
          const n = nodesById.get ? nodesById.get(idx[i]) : nodesById[idx[i]];
          if (!n) continue;
          const ne = (typeof n.date_earliest === 'number') ? n.date_earliest : null;
          const nl = (typeof n.date_latest   === 'number') ? n.date_latest   : ne;
          if (ne == null) continue;   // undated nodes stay visible
          const overlaps = (nl == null ? ne : nl) >= lo && ne <= hi;
          if (!overlaps) states[i] = 1.0;
        }
      }
      // 2026-05-19 — node fade. Interleaved (dim, selected) pairs
      // go into nodeTargets; tickNodeFades advances nodeStates
      // toward them at FADE_DURATION. On first run / mode switch,
      // sizes might mismatch — resize without flashing the user
      // by seeding edgeStates from the targets on initial alloc.
      const newNodeTargets = interleavePairs(states, selectFlags);
      if (!local.nodeTargets || local.nodeTargets.length !== newNodeTargets.length) {
        local.nodeTargets = newNodeTargets;
      } else {
        local.nodeTargets.set(newNodeTargets);
      }
      if (!local.nodeStates || local.nodeStates.length !== newNodeTargets.length) {
        local.nodeStates = new Float32Array(newNodeTargets);
      }
      // Phase 2B B6 (2026-05-20) — A3 staggered cascade. Precompute
      // per-node fade delay via BFS from selectedSet (anchors) so
      // tickNodeFades can release each ring after the inner one
      // has visibly started moving. Default A4 path skips this
      // entirely (zero cost). Allocates two scratch buffers + one
      // Map per call when A3 is active; acceptable because the
      // dispatcher is opt-in and the call rate is hover-rate
      // (≤60Hz). Ring 0 (anchor) = 0s delay; ring 1 = 0.05s;
      // ring 2 = 0.10s; ring ≥3 / unreached = 0.15s (cascades
      // outward over ~0.3s total).
      if (local._dimModel === 'A3') {
        const N  = idx.length;
        const sc = local.scratch;
        if (!sc.ringDist  || sc.ringDist.length  !== N) sc.ringDist  = new Uint8Array(N);
        if (!sc.fadeDelay || sc.fadeDelay.length !== N) sc.fadeDelay = new Float32Array(N);
        sc.ringDist.fill(255);
        const idxOf = new Map();
        for (let i = 0; i < N; i++) idxOf.set(idx[i], i);
        const queue = [];
        if (local.selectedSet) {
          for (const id of local.selectedSet) {
            const i = idxOf.get(id);
            if (i !== undefined) {
              sc.ringDist[i] = 0;
              queue.push(i);
            }
          }
        }
        const adj = local.mode.adjacency;
        let head = 0;
        while (head < queue.length) {
          const ci = queue[head++];
          const d  = sc.ringDist[ci];
          if (d >= 2) continue;
          const neighbors = adj.get(idx[ci]);
          if (!neighbors) continue;
          for (const nid of neighbors) {
            const ni = idxOf.get(nid);
            if (ni === undefined) continue;
            if (sc.ringDist[ni] === 255) {
              sc.ringDist[ni] = d + 1;
              queue.push(ni);
            }
          }
        }
        for (let i = 0; i < N; i++) {
          const r = sc.ringDist[i];
          sc.fadeDelay[i] = (r === 255) ? 0.15 : r * 0.05;
        }
      }
      // 2026-05-19 — edge fade. Compute the snap-to TARGET value
      // for each edge; the live edgeStates buffer is animated
      // toward it by `tickEdgeFades` (FADE_DURATION = 0.1s). On
      // first run (or after rebuildForMode) sizes may mismatch;
      // resize and pre-fill targets without touching states so
      // the GPU sees a coherent buffer immediately.
      const newTargets = graph.computeEdgeStates(local.mode.edges, local.focusedSet);
      if (!local.edgeTargets || local.edgeTargets.length !== newTargets.length) {
        local.edgeTargets = newTargets;
      } else {
        local.edgeTargets.set(newTargets);
      }
      if (!local.edgeStates || local.edgeStates.length !== newTargets.length) {
        // First-time alloc — initial value matches target so no surprise flash.
        local.edgeStates = new Float32Array(newTargets);
      }
      // 2026-05-20 — pre-warm removed. Earlier attempts to fix
      // the IDLE-hover lag with a 30% pre-advance broke
      // LOCKED-hover smoothness (each cursor move jumped the
      // in-flight animation, killing the buttery fade) AND made
      // clicks feel buffered. The proper fix was the
      // label-DOM-pre-create above in rebuildForMode + the
      // fade-aware rebakeNodes. Both implemented per the Plan
      // agent's audit. Fade animation now flows uninterrupted in
      // both IDLE and LOCKED modes.
      // Kick the animation loop. It self-exits when both the
      // camera and all edge fades have settled. animTick will
      // call drawFrame on its first iteration (this frame or the
      // next rAF tick), so we don't need an explicit drawFrame
      // here — saves one redundant GPU submit per recomputeFocus.
      // (2026-05-20 — audit-flagged minor optimization.)
      // Phase 4B FX1 (2026-05-20) — focus change → glyph alpha
      // column will reflect new dim states on the next refresh.
      // Mark dirty so refreshGlyphAlphas + writeBuffer fire.
      local.glyphInstancesDirty = true;
      startAnimLoop();
      syncLabels();
    }

    // 2026-05-19 — advance per-edge state toward its target by
    // dt / FADE_DURATION per second. Returns true if any edge is
    // still in flight (loop must keep ticking). Tunable from
    // here. Iteration log: 0.10s (invisible) → 0.25s (John: "VERY
    // slow") → 0.15s (snappy but ease is perceivable). Match the
    // CSS .forge-label / .forge-glyph transition duration so node-
    // canvas-fade and label/glyph-DOM-fade end together.
    const FADE_DURATION = 0.15;
    function tickEdgeFades(dt) {
      const cur = local.edgeStates;
      const tgt = local.edgeTargets;
      if (!cur || !tgt || cur.length !== tgt.length) return false;
      const step = dt / FADE_DURATION;
      let stillFading = false;
      for (let i = 0; i < cur.length; i++) {
        const c = cur[i];
        const t = tgt[i];
        if (c === t) continue;
        const diff = t - c;
        const absDiff = diff < 0 ? -diff : diff;
        if (absDiff <= step) {
          cur[i] = t;
        } else {
          cur[i] = c + (diff > 0 ? step : -step);
          stillFading = true;
        }
      }
      return stillFading;
    }
    // 2026-05-19 — same advancing logic for the node (state,
    // selected) interleaved buffer. Same FADE_DURATION so the
    // node dim + the edge fade ease together.
    function tickNodeFades(dt) {
      const cur = local.nodeStates;
      const tgt = local.nodeTargets;
      if (!cur || !tgt || cur.length !== tgt.length) return false;
      const step = dt / FADE_DURATION;
      let stillFading = false;
      // Phase 2B B6 (2026-05-20) — A3 dispatcher: per-node fade
      // delay precomputed by recomputeFocus into scratch.fadeDelay.
      // Until a node's delay counts down to 0 its (state, selected)
      // pair holds its current value, producing a ring-by-ring
      // cascade. Other dim models (A1/A2/A4) skip this branch and
      // tick uniformly across all nodes (existing behavior).
      const N = cur.length >> 1;   // node count (2 floats per node)
      const useDelay = local._dimModel === 'A3'
        && local.scratch.fadeDelay
        && local.scratch.fadeDelay.length === N;
      const delays = useDelay ? local.scratch.fadeDelay : null;
      for (let n = 0; n < N; n++) {
        if (delays && delays[n] > 0) {
          delays[n] = Math.max(0, delays[n] - dt);
          stillFading = true;
          continue;
        }
        // Advance both floats for this node (state + selected).
        for (let k = 0; k < 2; k++) {
          const i = (n << 1) + k;
          const c = cur[i];
          const t = tgt[i];
          if (c === t) continue;
          const diff = t - c;
          const absDiff = diff < 0 ? -diff : diff;
          if (absDiff <= step) {
            cur[i] = t;
          } else {
            cur[i] = c + (diff > 0 ? step : -step);
            stillFading = true;
          }
        }
      }
      // Phase 4B FX1 (2026-05-20) — fade in flight → glyph alphas
      // need updating on the next drawFrame. When stillFading
      // settles to false, the flag stops being re-set; the dirty
      // gate in drawFrame then skips the refreshGlyphAlphas O(N)
      // loop + the GPU writeBuffer for the glyph instance buffer.
      if (stillFading) local.glyphInstancesDirty = true;
      return stillFading;
    }

    function computeSelectedSet(hoverId, lockedSet) {
      const s = new Set();
      if (hoverId) s.add(hoverId);
      if (lockedSet) for (const id of lockedSet) s.add(id);
      return s;
    }

    function interleavePairs(a, b) {
      const n = a.length;
      const out = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        out[i*2]   = a[i];
        out[i*2+1] = b[i];
      }
      return out;
    }

    // Update hoverId, then refresh focus. No-op when the hover
    // hasn't actually changed.
    //
    // 2026-05-20 — audit-flagged architectural fix: COALESCE
    // recomputeFocus via rAF. Previously, every pointermove that
    // crossed a node boundary fired setHoverId → recomputeFocus
    // synchronously. At 120Hz pointer events, that's 120 full
    // recomputes per second — the JS thread can't keep up with
    // rAF (60Hz), animation stutters, hover feels "slow + no
    // fade". Now: setHoverId records the pending id and schedules
    // ONE recompute on the next rAF, regardless of how many
    // pointer events fire in between. Capped at 60Hz max, same
    // perceived responsiveness, ~2× less work.
    //
    // The actual hoverId mutation + DOM-cue updates stay
    // synchronous (cursor class, status text) — only the
    // heavy recomputeFocus call is coalesced.
    // Phase 2B (2026-05-20) — hoverRafId + hoverPendingId lifted
    // onto `local` (audit Q3 recommendation). Lets destroy() and
    // rebuildForMode call cancelHoverCoalesce() to drain pending
    // recomputes against stale state. See cancelHoverCoalesce
    // below + the BEHAVIORS spec-lock header for the rAF
    // ownership map.
    function setHoverId(newId) {
      if (newId === local.hoverId && local.hoverPendingId === undefined) return;
      // Light synchronous updates — cheap, must fire on every move
      // for the cursor feedback to feel responsive.
      if (newId !== local.hoverId) {
        local.hoverId = newId;
        canvas.classList.toggle('is-hover-node', !!newId);
        const hEl = document.getElementById('forge-status-hover');
        if (hEl) {
          if (newId) {
            const node = nodeById(newId);
            hEl.textContent = (node && node.title) || newId;
          } else {
            hEl.textContent = '—';
          }
        }
      }
      // Coalesce the heavy recompute. If one is already pending,
      // just update the target; rAF will pick it up.
      local.hoverPendingId = newId;
      if (local.hoverRafId) return;
      local.hoverRafId = requestAnimationFrame(() => {
        local.hoverRafId = 0;
        local.hoverPendingId = undefined;
        if (local.destroyed) return;
        recomputeFocus();
      });
    }

    // Phase 2B (2026-05-20) — cancel helpers used by destroy() (B1)
    // and rebuildForMode (B2) to drain pending rAFs before swapping
    // state out from under them.
    function cancelHoverCoalesce() {
      if (local.hoverRafId) {
        try { cancelAnimationFrame(local.hoverRafId); } catch (e) { /* ignore */ }
        local.hoverRafId = 0;
      }
      local.hoverPendingId = undefined;
    }
    function cancelIdleLabelRaf() {
      if (local.idleLabelRaf) {
        try { cancelAnimationFrame(local.idleLabelRaf); } catch (e) { /* ignore */ }
        local.idleLabelRaf = 0;
      }
    }
    function cancelScrubCoalesce() {
      if (local.scrubRafId) {
        try { cancelAnimationFrame(local.scrubRafId); } catch (e) { /* ignore */ }
        local.scrubRafId = 0;
      }
      local.scrubPendingChange = false;
    }

    // ── Search (Phase 4f) ─────────────────────────────
    // Substring match (case-insensitive) across title, id, and
    // aka of the CURRENT mode's nodes. First match wins; ties
    // broken by degree (highest first) so "zeus" beats a tiny
    // "zeusite" stub. Returns the node id, or null.
    function findBestMatch(query) {
      const q = (query || '').trim().toLowerCase();
      if (!q) return null;
      const nodes = local.mode.nodes;
      let bestExact = null, bestExactDeg = -1;
      let bestPrefix = null, bestPrefixDeg = -1;
      let bestContains = null, bestContainsDeg = -1;
      for (const n of nodes) {
        if (!n) continue;
        const title = String(n.title || '').toLowerCase();
        const id    = String(n.id || '').toLowerCase();
        // Build a small haystack list: title, id, then any aka aliases.
        const akaArr = Array.isArray(n.aka) ? n.aka : [];
        const haystacks = [title, id];
        for (const a of akaArr) {
          if (typeof a === 'string') haystacks.push(a.toLowerCase());
        }
        const deg = (local.mode.adjacency.get(n.id) || new Set()).size;
        for (const h of haystacks) {
          if (h === q) {
            if (deg > bestExactDeg) { bestExact = n.id; bestExactDeg = deg; }
          } else if (h.startsWith(q)) {
            if (deg > bestPrefixDeg) { bestPrefix = n.id; bestPrefixDeg = deg; }
          } else if (h.indexOf(q) >= 0) {
            if (deg > bestContainsDeg) { bestContains = n.id; bestContainsDeg = deg; }
          }
        }
      }
      return bestExact || bestPrefix || bestContains;
    }

    // ── Timeline scrubber (2026-05-20) ──────────────────────
    // 4-box layout per John 2026-05-20: separate IN value box +
    // slider + OUT value box + PRESENT (playhead) value box. All
    // four match the height of the zoom-gizmo + search input. v2
    // wires the FILTER too — `recomputeFocus` reads
    // `local.timeline.{inDate, outDate}` and dims any node whose
    // date range doesn't overlap [inDate, outDate].
    //
    // Range derivation: scan current mode's nodes for normalized
    // `date_earliest` / `date_latest` (build_data.py output) plus
    // YAML-raw fallbacks; min/max give the timeline bounds. Clamped
    // to a sane archaeology window [-15000, 3000] so cosmogonic
    // outliers don't squash human-history span to a hairline.
    function wireTimelineScrubber() {
      const slider  = document.getElementById('forge-scrub-slider');
      if (!slider) return;
      const track   = slider.querySelector('.forge-scrub-track');
      const rangeEl = slider.querySelector('#forge-scrub-range');
      const inEl    = slider.querySelector('#forge-scrub-in-thumb');
      const ctrEl   = slider.querySelector('#forge-scrub-center-thumb');
      const outEl   = slider.querySelector('#forge-scrub-out-thumb');
      const inBox      = document.getElementById('forge-scrub-in');
      const outBox     = document.getElementById('forge-scrub-out');
      const presentBox = document.getElementById('forge-scrub-present');

      // Derive [minYear, maxYear] from the current mode's nodes.
      // Negative = BCE per the vault convention.
      // Field naming: the YAML uses kebab-case (date-start,
      // date-attested-earliest, etc.) but build_data.py normalizes
      // to underscored snake_case (date_earliest, date_latest) in
      // data.js. Read the normalized form first, fall back to raw
      // for safety.
      function deriveBounds() {
        const nodes = local.mode && local.mode.nodes;
        if (!nodes || !nodes.length) return null;
        let lo = Infinity, hi = -Infinity;
        for (const n of nodes) {
          const candidates = [
            n.date_earliest, n.date_latest,                // normalized
            n['date-start'],  n['date-end'],               // raw fallback
            n['date-attested-earliest'], n['date-attested-latest'],
            n['originating-date'], n['date-composed-earliest'],
            n['date-composed-latest'], n['date-formulated'],
            n['date-founded'], n['date-built-earliest'],
            n['date-built-latest'], n['date-birth'], n['date-death'],
          ];
          for (const v of candidates) {
            if (v == null) continue;
            const num = typeof v === 'number' ? v : parseInt(v, 10);
            if (!isFinite(num)) continue;
            if (num < lo) lo = num;
            if (num > hi) hi = num;
          }
        }
        if (!isFinite(lo) || !isFinite(hi) || lo >= hi) return null;
        // Sanity clamp. Some nodes carry cosmological / pre-history
        // dates (e.g., date_earliest = -1e9 for Big Bang / Earth
        // formation references in cosmogonic-motif nodes). Those
        // skew the timeline so far that the human-history span is
        // a hairline. Clamp to a useful archaeology floor (-15000)
        // and future ceiling (3000) — nodes outside this window
        // are visible at the extreme end of the slider.
        const HIST_LO = -15000;  // 15,000 BCE — before any writing
        const HIST_HI =   3000;  // CE — near-future ceiling
        if (lo < HIST_LO) lo = HIST_LO;
        if (hi > HIST_HI) hi = HIST_HI;
        // Round outward to nice century-edges so the readout looks
        // tidy. -3142 → -3200; 2024 → 2100.
        const lopad = Math.floor(lo / 100) * 100;
        const hipad = Math.ceil(hi / 100) * 100;
        return [lopad, hipad];
      }

      const bounds = deriveBounds();
      if (!bounds) {
        // Hide all four boxes when the current mode has no dated nodes.
        slider.style.display = 'none';
        if (inBox)      inBox.style.display = 'none';
        if (outBox)     outBox.style.display = 'none';
        if (presentBox) presentBox.style.display = 'none';
        return;
      }
      const [lo, hi] = bounds;

      // local.timeline: {lo, hi, in, out, center} — `lo`/`hi` are
      // immutable spine bounds; the others are user-driven within.
      local.timeline = {
        lo, hi,
        inDate:     lo,
        outDate:    hi,
        centerDate: Math.floor((lo + hi) / 2),
      };

      // Date → fraction along track (0..1).
      function dateToFrac(d) { return (d - lo) / (hi - lo); }
      function fracToDate(f) {
        f = Math.max(0, Math.min(1, f));
        return Math.round(lo + f * (hi - lo));
      }
      function formatYear(y) {
        if (y < 0) return Math.abs(y) + ' BCE';
        if (y === 0) return '0';
        return y + ' CE';
      }
      function refreshUI() {
        const t = local.timeline;
        const inF  = dateToFrac(t.inDate)     * 100;
        const outF = dateToFrac(t.outDate)    * 100;
        const ctrF = dateToFrac(t.centerDate) * 100;
        inEl.style.left   = inF  + '%';
        outEl.style.left  = outF + '%';
        ctrEl.style.left  = ctrF + '%';
        rangeEl.style.left  = inF + '%';
        rangeEl.style.width = (outF - inF) + '%';
        // 4-box readouts. Each box gets just the year (no
        // separator) so it stays compact at fixed height.
        if (inBox)      inBox.textContent      = formatYear(t.inDate);
        if (outBox)     outBox.textContent     = formatYear(t.outDate);
        if (presentBox) presentBox.textContent = formatYear(t.centerDate);
      }

      // Drag state. Pointer events on track + thumbs; track captures
      // so dragging outside the track still updates.
      let dragHandle = null;
      function onPointerDown(ev) {
        const handle = ev.target && ev.target.dataset && ev.target.dataset.handle;
        if (!handle) return;
        dragHandle = handle;
        track.setPointerCapture(ev.pointerId);
        ev.preventDefault();
      }
      function onPointerMove(ev) {
        if (!dragHandle) return;
        const rect = track.getBoundingClientRect();
        const frac = (ev.clientX - rect.left) / rect.width;
        const date = fracToDate(frac);
        const t = local.timeline;
        let rangeChanged = false;
        if (dragHandle === 'in') {
          const newIn = Math.min(date, t.outDate - 1);
          if (newIn !== t.inDate) { t.inDate = newIn; rangeChanged = true; }
          if (t.centerDate < t.inDate) t.centerDate = t.inDate;
        } else if (dragHandle === 'out') {
          const newOut = Math.max(date, t.inDate + 1);
          if (newOut !== t.outDate) { t.outDate = newOut; rangeChanged = true; }
          if (t.centerDate > t.outDate) t.centerDate = t.outDate;
        } else if (dragHandle === 'center') {
          t.centerDate = Math.max(t.inDate, Math.min(t.outDate, date));
          // Center scrub doesn't re-filter (no IN/OUT change), just
          // updates the playhead readout.
        }
        refreshUI();
        // Filter wiring: when IN or OUT change, re-run focus so
        // the date-range-dim is applied to nodes outside the
        // range. Center moves don't change the filter.
        //
        // Phase 2B B4 (2026-05-20) — rAF-coalesce the recompute.
        // Scrubber drag fires pointermove at up to 120Hz; without
        // this gate `recomputeFocus` runs synchronously per move,
        // burning the JS thread on full-buffer fade-target writes.
        // Mirrors the setHoverId pattern from commit 98bc609.
        // refreshUI (cheap DOM text updates) stays synchronous so
        // drag feedback feels immediate.
        if (rangeChanged) {
          local.scrubPendingChange = true;
          if (!local.scrubRafId) {
            local.scrubRafId = requestAnimationFrame(() => {
              local.scrubRafId = 0;
              local.scrubPendingChange = false;
              if (local.destroyed) return;
              recomputeFocus();
            });
          }
        }
      }
      function onPointerUp(ev) {
        if (!dragHandle) return;
        dragHandle = null;
        try { track.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      }
      track.addEventListener('pointerdown', onPointerDown);
      track.addEventListener('pointermove', onPointerMove);
      track.addEventListener('pointerup',   onPointerUp);
      track.addEventListener('pointercancel', onPointerUp);

      // First render.
      refreshUI();
    }

    // Submit a search query. On match: lock the node, fly the
    // camera to frame the node + its 1-hop neighbourhood.
    function handleSearch(query) {
      const hitId = findBestMatch(query);
      if (!hitId) return;
      // Replace lock with just this hit (search should focus, not
      // accumulate). User can still cmd-click to compound.
      local.lockedSet.clear();
      local.lockedSet.add(hitId);
      const lEl = document.getElementById('forge-status-lock');
      if (lEl) lEl.textContent = String(local.lockedSet.size);
      recomputeFocus();
      // Camera fly-to: frame the hit + its 1-hop neighbours into the viewport.
      flyToFocusedSet();
      if (camera.isAnimating()) startAnimLoop();
    }

    // Compute a target camera (centre + scale) that frames the
    // current focused set into the viewport with margin, then
    // call camera.flyTo() to ease there.
    function flyToFocusedSet() {
      const focus = local.focusedSet;
      if (!focus || !focus.size) return;
      const vp = local.lastSize;
      if (!vp.w || !vp.h) return;
      // World-space bbox of the focused nodes' positions, padded
      // by an extra disk radius so circles aren't clipped at the
      // viewport edge.
      let x0 =  Infinity, y0 =  Infinity, x1 = -Infinity, y1 = -Infinity;
      const hitNodes = local.mode.hitNodes;
      for (let i = 0; i < hitNodes.length; i++) {
        const n = hitNodes[i];
        if (!focus.has(n.id)) continue;
        if (n.x - n.r < x0) x0 = n.x - n.r;
        if (n.y - n.r < y0) y0 = n.y - n.r;
        if (n.x + n.r > x1) x1 = n.x + n.r;
        if (n.y + n.r > y1) y1 = n.y + n.r;
      }
      if (!isFinite(x0)) return;
      // Margin so labels have breathing room above each disk.
      const padW = 60;   // world units
      x0 -= padW; y0 -= padW; x1 += padW; y1 += padW;
      const worldW = x1 - x0;
      const worldH = y1 - y0;
      const targetScale = Math.min(vp.w / worldW, vp.h / worldH);
      camera.flyTo({
        centerX: (x0 + x1) / 2,
        centerY: (y0 + y1) / 2,
        scale:   targetScale,
      }, 0.55);
    }

    // Toggle the locked state for a node. Click on an empty
    // canvas (no node hit) clears the entire lock — the standard
    // "click to dismiss" gesture.
    function toggleLock(id) {
      if (id == null) {
        if (local.lockedSet.size === 0) return;
        local.lockedSet.clear();
      } else if (local.lockedSet.has(id)) {
        local.lockedSet.delete(id);
      } else {
        local.lockedSet.add(id);
      }
      const lEl = document.getElementById('forge-status-lock');
      if (lEl) lEl.textContent = local.lockedSet.size > 0 ? String(local.lockedSet.size) : '—';
      recomputeFocus();
    }

    // ── Interaction handlers ────────────────────────────
    function attachInteractions() {
      // Pointer move → hover hit-test.
      // Cache rect to avoid layout thrashing per pointermove.
      let canvasRect = canvas.getBoundingClientRect();
      const refreshRect = () => { canvasRect = canvas.getBoundingClientRect(); };

      canvas.addEventListener('pointermove', (ev) => {
        if (local.destroyed) return;
        const cssX = ev.clientX - canvasRect.left;
        const cssY = ev.clientY - canvasRect.top;
        // Pan: track delta from last move while button is held.
        if (local.panActive) {
          const dx = ev.clientX - local.panLastX;
          const dy = ev.clientY - local.panLastY;
          local.panLastX = ev.clientX;
          local.panLastY = ev.clientY;
          if (dx !== 0 || dy !== 0) {
            local.panMoved = true;
            camera.panByScreen(dx, dy);  // triggers draw via onChange
          }
          // Phase 4c — record sample for release-velocity. Ring-
          // buffer length 6; older samples drop off the front.
          // Use performance.now() not ev.timeStamp — synthetic
          // events for automated tests can have zero/equal stamps.
          local.panSamples.push({ x: ev.clientX, y: ev.clientY, t: performance.now() });
          if (local.panSamples.length > 6) local.panSamples.shift();
          return;
        }
        // Hover hit-test in idle state.
        const hit = hitTestAt(cssX, cssY);
        setHoverId(hit);
      });
      canvas.addEventListener('pointerleave', () => {
        if (local.destroyed) return;
        setHoverId(null);
      });

      // Pan: pointerdown to start; pointerup/cancel to end.
      canvas.addEventListener('pointerdown', (ev) => {
        if (local.destroyed) return;
        // Only primary button. Touch / pen come through as button=0.
        if (ev.button !== 0) return;
        // setPointerCapture throws on untrusted (synthetic) events in
        // Chromium; we still want pan to work for automated testing.
        // It's a UX nicety for real input, not a correctness gate.
        try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
        // New drag → cancel any in-flight inertia or zoom ease.
        camera.stopAnim();
        local.panActive  = true;
        local.panMoved   = false;
        local.panLastX   = ev.clientX;
        local.panLastY   = ev.clientY;
        local.panSamples = [{ x: ev.clientX, y: ev.clientY, t: performance.now() }];
        canvas.classList.add('is-panning');
        ev.preventDefault();
      });
      const endPan = (ev) => {
        if (!local.panActive) return;
        try { canvas.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
        local.panActive = false;
        canvas.classList.remove('is-panning');
        // Click = pointerup without intermediate move. If the pointer
        // didn't move during the drag, treat it as a click and toggle
        // the lock at the cursor's hit. Click on empty space clears
        // the entire lock — natural "dismiss" gesture.
        if (!local.panMoved) {
          const cssX = ev.clientX - canvasRect.left;
          const cssY = ev.clientY - canvasRect.top;
          const hit = hitTestAt(cssX, cssY);
          toggleLock(hit);   // hit === null → clear all
          return;
        }
        // Phase 4c — release-velocity from the last ~80ms of samples.
        // Use the OLDEST sample within the window so a fast last
        // micro-move doesn't spike the velocity.
        const samples = local.panSamples;
        if (samples.length >= 2) {
          const tNow = performance.now();
          let i = samples.length - 1;
          while (i > 0 && (tNow - samples[i - 1].t) < 80) i--;
          const oldest = samples[i];
          const newest = samples[samples.length - 1];
          const dt = (newest.t - oldest.t) / 1000;   // seconds
          let vx = 0, vy = 0;
          if (dt > 0.001) {
            vx = (newest.x - oldest.x) / dt;
            vy = (newest.y - oldest.y) / dt;
            camera.kickPanVelocity(vx, vy);
            if (camera.isAnimating()) startAnimLoop();
          }
          // Diagnostic snapshot for automated verification.
          local._lastEndPan = { sampleCount: samples.length, oldest, newest, dt, vx, vy, animating: camera.isAnimating() };
        } else {
          local._lastEndPan = { sampleCount: samples.length, animating: camera.isAnimating() };
        }
        local.panSamples = [];
      };
      canvas.addEventListener('pointerup',     endPan);
      canvas.addEventListener('pointercancel', endPan);

      // Zoom: wheel toward cursor. Phase 4c — use nudgeZoomTarget
      // so rapid wheel events accumulate into a single smooth ease
      // instead of compounding into jerky discrete steps.
      canvas.addEventListener('wheel', (ev) => {
        if (local.destroyed) return;
        ev.preventDefault();
        const cssX = ev.clientX - canvasRect.left;
        const cssY = ev.clientY - canvasRect.top;
        // deltaY: positive = scroll down = zoom out.
        const factor = Math.exp(-ev.deltaY * WHEEL_ZOOM_K);
        camera.nudgeZoomTarget(factor, cssX, cssY, { w: local.lastSize.w, h: local.lastSize.h });
        if (camera.isAnimating()) startAnimLoop();
        // Hover may now point to a different node — re-test at the
        // same screen position.
        const hit = hitTestAt(cssX, cssY);
        setHoverId(hit);
      }, { passive: false });

      // Keep canvasRect fresh when the viewport changes.
      window.addEventListener('scroll', refreshRect, true);
      window.addEventListener('resize', refreshRect);
      if (local.resizeObs) {
        // ResizeObserver is the source of truth — chain a refresh
        // here too in case CSS changes don't trigger the global
        // resize event.
        const orig = local.resizeObs;
        const wrapped = new ResizeObserver(() => {
          refreshRect();
          if (!local.destroyed) resizeAndFit(false);
        });
        try { orig.disconnect(); } catch (e) { /* ignore */ }
        local.resizeObs = wrapped;
        wrapped.observe(stage);
      }
    }

    // ── Param helpers ──────────────────────────────────────
    // Phase 3B D1 (2026-05-20) — BUCKET_ORDER derived from
    // AtlasEngineGraph.BUCKET_INDEX (single source of truth in
    // src/js/engine/graph/edge.js). Eliminates the 3-source
    // duplication (was: hardcoded array here + BUCKET_INDEX in
    // edge.js + a docstring mirror in webgpu.js setBucketPalette).
    // The sort by numeric index guarantees the ORDER matches the
    // shader's bucket_hot_colors array indexing. Fallback to the
    // canonical literal preserves load-order safety.
    const BUCKET_ORDER = (window.AtlasEngineGraph && window.AtlasEngineGraph.BUCKET_INDEX)
      ? Object.keys(window.AtlasEngineGraph.BUCKET_INDEX)
          .sort((a, b) => window.AtlasEngineGraph.BUCKET_INDEX[a] - window.AtlasEngineGraph.BUCKET_INDEX[b])
      : ['transmission','parallel','association','kinship','attestation','polemic','fusion'];

    function tierRadiiFromParams() {
      return [
        local.params.node_radius_tier1,
        local.params.node_radius_tier2,
        local.params.node_radius_tier3,
        local.params.node_radius_tier4,
      ];
    }
    // 2026-05-19 — extract the packed (post-clamp) world radius
    // per node id so packEdges can offset wires to the disk
    // perimeter. Cheap (one O(n) pass), called once per pack/
    // rebake. Returns null-safe Map for the radii option.
    function buildRadiiMap(nodePack) {
      const m = new Map();
      if (!nodePack || !nodePack.idIndex) return m;
      for (let i = 0; i < nodePack.instanceCount; i++) {
        m.set(nodePack.idIndex[i], nodePack.data[i * NODE_FLOATS + 2]);
      }
      return m;
    }

    // N1 (2026-05-20) — hit-test spatial grid. Uniform grid over
    // worldExtent with cellSize = 2 × maxRadius, guaranteeing every
    // node CENTER is within ±1 cell of any query point its disk
    // contains. hitTestAt then queries a 3×3 cell neighborhood
    // (~2-10 candidates instead of N). Built in rebuildForMode +
    // rebakeNodes. Empty/missing buckets are skipped during query.
    // See AUDIT/forge-rebuild-1A-node-atom-2026-05-20.md §3 N1.
    function buildHitGrid(hitNodes, ext, maxRadius) {
      const cellSize = Math.max(1, 2 * (maxRadius || 1));
      const x0 = ext.x0;
      const y0 = ext.y0;
      const wExt = Math.max(1, ext.x1 - ext.x0);
      const hExt = Math.max(1, ext.y1 - ext.y0);
      const cols = Math.max(1, Math.ceil(wExt / cellSize));
      const rows = Math.max(1, Math.ceil(hExt / cellSize));
      const buckets = new Array(cols * rows);
      for (let i = 0; i < hitNodes.length; i++) {
        const n = hitNodes[i];
        const cx = Math.max(0, Math.min(cols - 1, Math.floor((n.x - x0) / cellSize)));
        const cy = Math.max(0, Math.min(rows - 1, Math.floor((n.y - y0) / cellSize)));
        const idx = cy * cols + cx;
        if (!buckets[idx]) buckets[idx] = [];
        buckets[idx].push(n);
      }
      return { cellSize, cols, rows, x0, y0, buckets };
    }
    function edgeOverridesFromParams() {
      const p = local.params;
      const o = { idleColors: {}, idleOps: {}, idleWidths: {}, hotWidths: {}, curves: {} };
      for (const b of BUCKET_ORDER) {
        o.idleColors[b] = p['idle_color_'    + b];
        o.idleOps[b]    = p['idle_opacity_'  + b];
        o.idleWidths[b] = p['idle_stroke_'   + b];
        o.hotWidths[b]  = p['active_stroke_' + b];
        o.curves[b]     = p['curve_'         + b];
      }
      return o;
    }
    function nodeOverridesFromParams() {
      return {
        tierRadii:   tierRadiiFromParams(),
        camScale:    (camera && camera.state) ? camera.state.scale : 1,
        minScreenPx: local.params.node_min_screen_px,
        maxScreenPx: local.params.node_max_screen_px,
      };
    }
    function hex2rgba(hex, a) {
      if (!hex || typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) {
        return [0.31, 0.37, 0.51, a];
      }
      return [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
        a,
      ];
    }
    function hotPaletteFromParams() {
      const p = local.params;
      return BUCKET_ORDER.map(b => hex2rgba(
        p['active_color_'   + b],
        p['active_opacity_' + b],
      ));
    }
    function labelHierarchyFromParams() {
      const p = local.params;
      return {
        tierZoomThresholds: [
          p.label_idle_zoom_tier1,
          p.label_idle_zoom_tier2,
          p.label_idle_zoom_tier3,
          p.label_idle_zoom_tier4,
        ],
        maxLabels:          p.label_idle_max,
        labelSizePx:        p.label_size,
        collisionPaddingPx: p.label_collision_pad,
      };
    }

    // Rebake node instances + glyph DOM (called when tier radii,
    // glyph tint, screen-px clamps, OR camera scale change).
    function rebakeNodes() {
      const m = local.mode;
      const deg = layout.computeDegree(m.nodes, m.edges);
      const np = graph.packNodes(m.nodes, m.positions, deg, nodeOverridesFromParams());
      m.nodePacked = np;
      // Tier classifier so hitNodes know their tier for the
      // label-hierarchy module. N6 (Phase 1B) — reuse the
      // classifier packNodes already built; falls back to a
      // fresh build for older packNodes implementations.
      const tierFor = np.tierFor || graph.buildTierClassifier(m.nodes, deg);
      // Re-derive hit-test index. Tier is stored on the hitNode
      // so the label module can route per-tier without needing
      // a side lookup.
      // N1 (2026-05-20) — rebuild hitGrid here too. Camera-zoom
      // re-pack changes node radii, which can shift maxRadius and
      // thus cellSize; rebuilding the grid keeps queries correct.
      m.hitNodes = new Array(np.instanceCount);
      m.hitById  = new Map();
      let maxRadius = 0;
      for (let i = 0; i < np.instanceCount; i++) {
        const off = i * NODE_FLOATS;
        const id  = np.idIndex[i];
        const hn  = {
          id,
          x:    np.data[off],
          y:    np.data[off + 1],
          r:    np.data[off + 2],
          tier: tierFor(deg.get(id) || 0),
        };
        m.hitNodes[i] = hn;
        m.hitById.set(id, hn);
        if (hn.r > maxRadius) maxRadius = hn.r;
      }
      m.hitGrid = buildHitGrid(m.hitNodes, m.worldExtent, maxRadius);
      // N2 — fresh nodePack means re-upload on next drawFrame.
      local.nodeInstancesDirty = true;
      // 2026-05-20 — fade-aware (mirror rebakeEdges). Previous
      // version wholesale-replaced local.nodeStates with a fresh
      // interleavePairs() result — that killed any in-flight node
      // fade by snapping current values to the target. So a zoom
      // drift during a hover-transition (or a dev-panel slider
      // tweak) would cause the disk fade to JUMP rather than
      // continue. Audit reported this as the highest-impact bug
      // bypassing the fade pipeline (alongside the rebakeEdges
      // pattern which was already correct).
      //
      // Fix: update local.nodeTargets in place, only resize
      // local.nodeStates when the length actually changed (mode
      // switch with different instance count). The live buffer
      // animates toward the new targets via tickNodeFades — fade
      // continuity preserved.
      const states      = graph.computeNodeStates(np.idIndex, local.focusedSet);
      const selectFlags = graph.computeSelectedStates
        ? graph.computeSelectedStates(np.idIndex, local.selectedSet)
        : new Float32Array(np.idIndex.length);
      const newNodeTargets = interleavePairs(states, selectFlags);
      if (!local.nodeTargets || local.nodeTargets.length !== newNodeTargets.length) {
        local.nodeTargets = newNodeTargets;
      } else {
        local.nodeTargets.set(newNodeTargets);
      }
      if (!local.nodeStates || local.nodeStates.length !== newNodeTargets.length) {
        local.nodeStates = new Float32Array(newNodeTargets);
      }
      startAnimLoop();
      // Track the camera scale this pack was made at, so the
      // re-pack-on-zoom hook knows when it's actually stale.
      local.packedAtScale = (camera && camera.state) ? camera.state.scale : 1;
      rebakeGlyphsForMode();
      scheduleIdleLabelSync();
      // 2026-05-19 — edge endpoints depend on node radii (offset
      // to disk perimeter). When zoom-aware re-pack changes
      // radii, the edges must follow or they detach visually.
      // rebakeEdges itself ends in drawFrame, so we skip the
      // explicit drawFrame below to avoid double work.
      rebakeEdges();
    }
    // Rebake edge instances (idle alpha / width / curve).
    function rebakeEdges() {
      const m = local.mode;
      m.edgePacked = graph.packEdges(m.edges, m.positions, Object.assign({}, edgeOverridesFromParams(), { nodeRadii: buildRadiiMap(m.nodePacked) }));
      // Phase 3B F3 (2026-05-20) — fresh edgePacked.data; next
      // drawFrame needs to upload the static instance VBO. Reset
      // to false after the upload (see drawFrame).
      local.edgeInstancesDirty = true;
      // 2026-05-19 — fade-aware. Don't replace `local.edgeStates`
      // wholesale; that would snap mid-fade values to a fresh
      // binary array and kill the animation. Update TARGETS
      // (which the next animTick will fade toward) and only
      // resize the live states buffer if the edge count changed.
      const newTargets = graph.computeEdgeStates(m.edges, local.focusedSet);
      if (!local.edgeTargets || local.edgeTargets.length !== newTargets.length) {
        local.edgeTargets = newTargets;
      } else {
        local.edgeTargets.set(newTargets);
      }
      if (!local.edgeStates || local.edgeStates.length !== newTargets.length) {
        local.edgeStates = new Float32Array(newTargets);
      }
      startAnimLoop();
      drawFrame();
    }
    // Phase 3B R3 (2026-05-20) — `rebakeBucketPalette` deleted.
    // Its only caller was the (now-removed) dev panel; with
    // PARAM_DEFAULTS frozen + panel gone, there's no live mutation
    // route for active_color_*. Palette is pushed ONCE at boot via
    // setBucketPalette(hotPaletteFromParams()); subsequent calls
    // would have no effect. See AUDIT/forge-rebuild-3A-wires-
    // 2026-05-20.md §3 F5.
    // Rebuild glyph DOM (called by mode switch + tier-radii change
    // + icon override + tint change).
    function rebakeGlyphsForMode() {
      // 2026-05-20 — redirect to the GPU pipeline. The DOM
      // overlay loop is gone; rebuildGlyphInstanceBuffer + a
      // drawFrame is the new equivalent. (Icon-override + glyph-
      // tint param wiring also flows through this path.)
      rebuildGlyphInstanceBuffer();
      drawFrame();
    }

    // Apply CSS vars from PARAM_DEFAULTS at mount. With the dev
    // panel removed (Phase 0, 2026-05-20), these values are static
    // for the lifetime of the mount — no live-mutation path remains.
    document.documentElement.style.setProperty('--forge-glyph-opacity', String(local.params.glyph_opacity));
    document.documentElement.style.setProperty('--forge-atmosphere',    String(local.params.atmosphere));
    document.documentElement.style.setProperty('--forge-label-size',    local.params.label_size + 'px');
    document.documentElement.style.setProperty('--forge-bg',            local.params.palette_background);
    document.documentElement.style.setProperty('--forge-label-text',    local.params.palette_label_text);
    document.documentElement.style.setProperty('--forge-label-halo',    local.params.palette_label_halo);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
    })[c]);
  }

  window._forge = { render: render };
})();
