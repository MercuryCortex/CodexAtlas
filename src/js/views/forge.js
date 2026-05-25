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
  // Selected state — Phase 7 (2026-05-20):
  //  - DELETED the glow halo. The whole alpha-blended annulus
  //    (selected_glow_strength + selected_glow_extent + the quad
  //    headroom + the FX5 discard threshold) is GONE. Three sessions
  //    of bugs all traced back to that one decoration:
  //      * square-clip artifact (depth writes inside the AA halo)
  //      * disappearing dim disks (the 0.15 discard floor caught
  //        every disk where alpha-dim brought it below 0.15)
  //      * flicker during fade transitions (disks popping in/out
  //        as their alpha crossed the discard threshold)
  //    Replaced by a SOLID STROKE drawn inside the disk's outer
  //    edge — a single ring computed in the same SDF fragment, no
  //    separate object, no extra quad, no alpha compositing.
  //  - Selected nodes show TWO differences vs focused/idle:
  //      1. disk size × selected_size_mult (1.5 default)
  //      2. solid gold stroke ring at outer edge (width =
  //         selected_stroke_width fraction of radius, e.g. 0.12)
  //  - Quad scale = 1.0 always. No headroom needed.
  //  - Dim is now COLOR-based, not ALPHA-based. dim_amount_nodes
  //    multiplies the fill RGB. Disk stays fully opaque, just gets
  //    darker. No alpha math anywhere in the node fragment except
  //    the single AA pixel at the disk edge.
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
  //  - **Phase 8 (2026-05-20) — NESTED WITH DISK, WHITE TINT.**
  //    Both Phase 6A (screen-size fade) and Phase 6B (focus rule)
  //    are DELETED. The glyph has NO independent visibility rules.
  //    If the disk renders, the glyph renders. The glyph quad is
  //    geometrically nested inside the disk quad (same size_mult,
  //    radius = inst_radius × glyph_scale = ~0.85 of disk radius).
  //    Tint is WHITE. The stencil reads as a clean white symbol
  //    inside the colored disk — Apple-icon style, universal
  //    contrast against any family color. Dim follows the disk's
  //    rule (color × (1 - dim_g)). No more pastel wash, no more
  //    "symbol missing at this zoom" frames, no more focus rule
  //    asymmetry between focused and dim.
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
  // ════════════════════════════════════════════════════════════
  // MANAGEMENT — spec lock (Phase 5B, 2026-05-20)
  // ════════════════════════════════════════════════════════════
  // The orchestration layer that holds NODE / BEHAVIORS / WIRES /
  // FX together: camera, mode-switch, scrubber, search, fly-to,
  // persistence, mount path, side-nav. Full spec at
  // AUDIT/forge-rebuild-5A-management-2026-05-20.md §2. Phase 5B
  // ships the residual fixes; the layers below are already LOCKED.
  //
  // Camera contract (src/js/engine/camera.js):
  //  - pan/zoom/fit/setPanBounds API. fitToExtent teleports +
  //    cancels in-flight anims + aspect-correct letterbox.
  //  - rebuildForMode is the ONLY non-resize fitToExtent caller in
  //    forge.js (plus the zoom-gizmo click). Pan/wheel never refit.
  //  - M-F1 (Phase 5B) — `local.packedAtScale = camera.state.scale`
  //    is written IMMEDIATELY after rebuildForMode's fitToExtent so
  //    the synchronous onChange emit can't fire a spurious
  //    rebakeNodes() against the OLD mode (stale-radius class).
  //
  // Resize handling (forge.js: resizeAndFit):
  //  - initial=true: getBoundingClientRect → fitToExtent.
  //  - initial=false (ResizeObserver): preserve zoom/pan, only
  //    rebakeNodes+Edges+recomputeFocus (radii depend on scale).
  //  - M-F7 (Phase 5B) — zero-size bail (`rect.w/h < 8 → return`)
  //    so a hidden-tab mount doesn't corrupt camera state.
  //  - app.js's global window.resize handler short-circuits for
  //    Forge (we own our own ResizeObserver).
  //
  // rebuildForMode lifecycle ORDER (extended from BEHAVIORS step):
  //   1. cancelHoverCoalesce()
  //   2. filterNodesByMode → layout → degree
  //   3. camera.stopAnim()
  //   4. camera.fitToExtent(ext, vp)
  //   5. local.packedAtScale = camera.state.scale   <-- M-F1
  //   6. camera.setPanBounds(...)
  //   7. packNodes(...)
  //   8. local.packedAtScale = camera.state.scale   (belt-and-braces)
  //   9. build hitNodes + hitGrid
  //  10. WHOLESALE-REPLACE state buffers (FADE-PIPELINE INVARIANT
  //      — EXCEPTION SITE; see BEHAVIORS section)
  //  11. reset hoverId/lockedSet/focusedSet
  //  12. label DOM pre-create (N-aware cap)
  //  13. rebuildGlyphInstanceBuffer
  //  14. buildSearchIndex()              <-- M-F5
  //  15. local.scrubber.refreshBounds()  <-- M-F3
  //  16. drawFrame()
  //
  // Scrubber bounds (M-F3, Phase 5B):
  //  - wireTimelineScrubber runs ONCE at boot — DOM + handlers +
  //    initial refreshBounds.
  //  - local.scrubber.refreshBounds() runs on every mode-switch.
  //    Preserves user's IN/OUT/CENTER if still inside the new
  //    lo/hi; otherwise clamps to closest valid bound.
  //  - Scrubber drag rAF-coalesce + cancel-on-destroy locked in
  //    BEHAVIORS (Phase 2B).
  //
  // Search index (M-F5, Phase 5B):
  //  - Eager — buildSearchIndex() at end of rebuildForMode.
  //    Precomputes lowercase haystacks + degree per node.
  //  - findBestMatch walks local.searchIndex, not local.mode.nodes.
  //    O(N) per query but constant-time per entry (no lowercase
  //    re-allocation, no adjacency map-get per entry).
  //
  // Camera-drift threshold (M-F4, Phase 5B):
  //  - N-aware band: <1k → 5%, <10k → 15%, ≥10k → 30%. Trades a
  //    little screen-px-clamp accuracy for wall-time savings at
  //    scale (rebakeNodes→rebakeEdges chain is ~10-20 ms at 10k).
  //
  // Runtime persistence (M-F2, Phase 5B):
  //  - One LS key: `codex-atlas/forge-runtime-v1`.
  //    Carries { mode, timeline: {in, out, center}, lockedSet }.
  //  - Hydrated at mount: mode override BEFORE first rebuildForMode;
  //    timeline + lockedSet AFTER wireTimelineScrubber.
  //  - Saved on: mode-dropdown change, scrubber pointerup,
  //    toggleLock. All three persisted on every save.
  //  - I/O wrapped in try/catch — silently no-ops in private-mode
  //    browsers + on quota exceeded.
  //
  // Side-nav (M-F6, Phase 5B):
  //  - Forge is the primary entry; other views collapsed behind a
  //    "More views" <details> disclosure. Reversible: tabs still
  //    reachable, just demoted. CSS at src/styles/app.css around
  //    the `.nav-more` rules + `.item.forge-nav` active-focus pill.
  //
  // Debug surfaces (window._forgeDebug additions Phase 5B):
  //  - timeline()         — { lo, hi, inDate, outDate, centerDate }.
  //  - countRebakeNodes() — number of rebakeNodes() calls since
  //                         mount; verifies M-F1 (mode-switch
  //                         increments by 1, not 2).
  //  - dumpRuntime()      — current LS-serialisable snapshot
  //                         (mode + timeline + lockedSet).
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

    // ── FOCUS / DIM ──
    // Phase 9 (2026-05-20) — semantics: `dim_amount_*` is the amount
    // by which OPACITY drops when a node/glyph is in FADED state.
    // Final alpha = (1 - dim_amount). So 0.75 → FADED at 0.25 alpha.
    // No RGB darkening. Same family color in IDLE and FADED states;
    // only the alpha changes.
    dim_amount:        0.80,    // edges (still color-blend on edges; node/glyph rules differ)
    dim_amount_nodes:  0.75,    // FADED node alpha = 1 - 0.75 = 0.25
    dim_amount_glyphs: 0.75,    // FADED glyph alpha = 1 - 0.75 = 0.25
    atmosphere:        0.025,

    // ── SELECTED STATE ──
    // Phase 7 (2026-05-20) — bulletproof. No glow halo. Selected nodes
    // gain TWO visual differences from focused/idle:
    //   1. bigger disk (size × selected_size_mult)
    //   2. a solid gold stroke ring drawn INSIDE the disk's outer edge
    // Both come from a single SDF fragment. No alpha-blended halo,
    // no composite math, no discard threshold.
    selected_size_mult:      1.50,
    selected_stroke_width:   0.12,    // fraction of disk radius
    selected_stroke_color:   '#FFE9B0',

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
    // Phase 18 (2026-05-21) — 6-tier label thresholds. Params are
    // 1-indexed for legacy reasons; internal tier index is 0-based.
    //   _tier1 → T0 (top 4%, always)
    //   _tier2 → T1 (next 11%, ~120% zoom)
    //   _tier3 → T2 (next 25%, ~165% zoom)
    //   _tier4 → T3 (long-tail-a, ~200% zoom)   ← was the whole "rest" cliff before
    //   _tier5 → T4 (long-tail-b, ~250% zoom)   ← new
    //   _tier6 → T5 (long-tail-c, ~350% zoom)   ← new
    label_idle_zoom_tier1: 0.10,   // T0 — basically always
    label_idle_zoom_tier2: 1.20,   // T1
    label_idle_zoom_tier3: 1.65,   // T2
    label_idle_zoom_tier4: 2.00,   // T3
    label_idle_zoom_tier5: 2.50,   // T4
    label_idle_zoom_tier6: 3.50,   // T5
    // Reverted to 100 (2026-05-26): canvas labels are CHEAPER than
    // DOM labels per-element, but they're NOT free — each label is
    // still a strokeText + fillText GPU op. 100 → 300 added 400
    // text operations per frame, which Safari pays for. 100 stays
    // a fluid baseline. To raise this, the remaining DOM
    // compositors (SVG hulls + timeline chrome) need canvas
    // treatment first — Phase 25b. Until then, 100 is the safe cap.
    label_idle_max:        100,    // canvas is cheaper than DOM but NOT free.
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

    // ── THEMATIC FAMILY ORDER (Phase 20D, 2026-05-21) ────
    // 36 families paired across the wheel so CONTESTING /
    // RELEVANT-CONTEXT religions sit ~180° apart. The 18
    // pairs are listed below; reading slot i and slot i+18
    // gives the opposite-pair.
    //
    //  0 Christian          ↔ 18 Islamic              (Abrahamic main axis)
    //  1 Israelite          ↔ 19 Canaanite            (Hebrew Bible contesting)
    //  2 Rabbinic           ↔ 20 Pre-Islamic-Arabian  (late-antique Semitic, Jewish vs Arabian)
    //  3 Greek              ↔ 21 Roman                (Mediterranean classical)
    //  4 Norse              ↔ 22 Egyptian             (north pagan / south structured)
    //  5 Mesopotamian       ↔ 23 Chinese              (oldest high-civs, east/west)
    //  6 Vedic              ↔ 24 Buddhist             (Indian sequential / contesting)
    //  7 Celtic             ↔ 25 Mesoamerican         (tribal-priestly, two continents)
    //  8 Hermetic           ↔ 26 Modern-Esoteric      (ancient/modern occult lineage)
    //  9 African            ↔ 27 Andean               (indigenous continents)
    // 10 Mystery            ↔ 28 Gnostic              (initiatory vs revelatory)
    // 11 Neoplatonist       ↔ 29 Manichaean           (late-antique heterodoxies)
    // 12 Native-American    ↔ 30 Pacific              (indigenous, ocean-apart)
    // 13 Baltic             ↔ 31 Slavic-Finnic        (eastern european cluster split)
    // 14 Armenian           ↔ 32 Other                (Armenian small / Other = catch-all)
    // 15 Zoroastrian        ↔ 33 Shinto               (state religions, east/west)
    // 16 Hittite            ↔ 34 Etruscan             (bronze-age Anatolian / Italian)
    // 17 Mandaean           ↔ 35 Academic             (surviving Gnostic / scholarly meta)
    //
    // Any family present in the vault but NOT in this list
    // is appended in encounter order by radialWedgeLayout
    // (its fallback). This keeps new families auto-supported
    // without code change; opposite-pairing only applies to
    // the curated 36.
    const FAMILY_ORDER = [
      'Christian',           // 0
      'Israelite',           // 1
      'Rabbinic',            // 2
      'Greek',               // 3
      'Norse',               // 4
      'Mesopotamian',        // 5
      'Vedic',               // 6
      'Celtic',              // 7
      'Hermetic',            // 8
      'African',             // 9
      'Mystery',             // 10
      'Neoplatonist',        // 11
      'Native-American',     // 12
      'Baltic',              // 13
      'Armenian',            // 14
      'Zoroastrian',         // 15
      'Hittite',             // 16
      'Mandaean',            // 17
      'Islamic',             // 18  (opp Christian)
      'Canaanite',           // 19  (opp Israelite)
      'Pre-Islamic-Arabian', // 20  (opp Rabbinic)
      'Roman',               // 21  (opp Greek)
      'Egyptian',            // 22  (opp Norse)
      'Chinese',             // 23  (opp Mesopotamian)
      'Buddhist',            // 24  (opp Vedic)
      'Mesoamerican',        // 25  (opp Celtic)
      'Modern-Esoteric',     // 26  (opp Hermetic)
      'Andean',              // 27  (opp African)
      'Gnostic',             // 28  (opp Mystery)
      'Manichaean',          // 29  (opp Neoplatonist)
      'Pacific',             // 30  (opp Native-American)
      'Slavic-Finnic',       // 31  (opp Baltic)
      'Other',               // 32  (opp Armenian)
      'Shinto',              // 33  (opp Zoroastrian)
      'Etruscan',            // 34  (opp Hittite)
      'Academic',            // 35  (opp Mandaean)
    ];
    const familyOrder = FAMILY_ORDER;

    // ════════════════════════════════════════════════════════════
    //  COLOR THEMES + FAMILY ORDER THEMES — Phase 21S (2026-05-22)
    // ════════════════════════════════════════════════════════════
    //  John's directive: he liked all 4 color rubrics + all 4 order
    //  rubrics, so each is a togglable mode. Stored under
    //  `local.uxMode.colorMode` and `local.uxMode.orderMode`.
    //  Persisted in LS as `forge.uxMode.v1`.
    //
    //  COLOR_THEMES[<id>] is a family→hex map. `default` is null —
    //  null means "use the baked color from data.js". For each
    //  named theme, every curated family has an entry; unknown
    //  families fall through to baked.
    //
    //  Christian #c44a5a and Gnostic #6b3a8a are PINNED in the
    //  Roots theme — they anchor the Semitic / Late-Antique cluster
    //  John already loved. Other themes are free to pick their own.
    // ════════════════════════════════════════════════════════════
    const COLOR_THEMES = {
      // Phase 21U (2026-05-22) — null = pass-through to the baked
      // data.js palette. The UI labels this as "Atlas" because the
      // baked palette IS the curated atlas baseline: tones tuned for
      // visual distinction between adjacent slices, with a soft
      // warm-Mediterranean / cool-Northern / saffron-Asian /
      // obsidian-American drift around the wheel.
      default: null,

      // ─────────────────────────────────────────────────────────
      // LONGITUDE — color follows geographic longitude of origin.
      // West (Americas) = violet; through Europe (blue) → Med (gold)
      // → Near East (copper) → India (saffron) → East Asia (jade)
      // → Pacific (cyan). Forms a near-rainbow as you sweep east.
      // Added per John's Phase 21U directive — distinct from
      // GEOGRAPHY (which is climate band, not longitude).
      // ─────────────────────────────────────────────────────────
      longitude: {
        // Americas — violet to magenta.
        'Native-American':'#7a4ac4','Mesoamerican':'#8a4ab8','Andean':'#9a4aa8',
        // Atlantic / N-Europe — blue.
        'Celtic':'#5a7ac4','Norse':'#5a8ac4','Baltic':'#5a9ac4','Slavic-Finnic':'#5aa4b8',
        // Western & Central Med — gold.
        'Etruscan':'#c4a04a','Roman':'#d4a040','Greek':'#d4a55a','Mystery':'#d4a560',
        'Hermetic':'#d4ab60','Neoplatonist':'#d4b06a','Egyptian':'#d4a85a',
        'African':'#d4a05a',
        // Near East — copper.
        'Israelite':'#c8854a','Rabbinic':'#c4855a','Canaanite':'#c4805a','Christian':'#c4855a',
        'Gnostic':'#c47a5a','Mandaean':'#b8704a','Manichaean':'#b8704a',
        'Mesopotamian':'#c47a4a','Hittite':'#c4854a','Armenian':'#b8704a',
        'Pre-Islamic-Arabian':'#c8703a','Islamic':'#c87a3a','Zoroastrian':'#c4753a',
        // South Asia — saffron.
        'Vedic':'#e08a3a','Buddhist':'#d49040',
        // East Asia — jade.
        'Chinese':'#5a9a7a','Shinto':'#5aa48a',
        // Pacific — teal-cyan.
        'Pacific':'#3a8aa4',
        // No clear longitude — silver.
        'Modern-Esoteric':'#8a8aa4','Academic':'#7a8a9a','Other':'#7a8090',
      },

      // ROOTS — civilizational-linguistic root families. Hue per
      // root cluster; saturation/lightness distinguishes branches.
      roots: {
        // Semitic / Abrahamic — wine + violet + amber (Christian +
        // Gnostic pinned).
        'Israelite':           '#b87a45',
        'Rabbinic':            '#a8703a',
        'Christian':           '#c44a5a',  // PINNED
        'Gnostic':             '#6b3a8a',  // PINNED
        'Islamic':             '#9a3a6a',
        'Manichaean':          '#7a4a9a',
        'Mandaean':            '#5a4a8a',
        'Canaanite':           '#a85a5a',
        'Pre-Islamic-Arabian': '#b87a55',

        // Indo-European West (Mediterranean classical + N-Eur) —
        // rust to bronze.
        'Greek':       '#9a5ac4',  // anchor pulled toward violet for IE root tie-in
        'Roman':       '#8a4a9a',
        'Celtic':      '#5a8a4a',
        'Norse':       '#4a6aa4',
        'Baltic':      '#6a8a4a',
        'Slavic-Finnic':'#7a5a8a',
        'Hittite':     '#8a6a40',
        'Armenian':    '#a04a6a',
        'Etruscan':    '#b85a40',

        // Indo-European East (Indo-Iranian) — saffron + ochre.
        'Vedic':       '#e08a3a',
        'Buddhist':    '#c4a05a',
        'Zoroastrian': '#d49a3a',

        // East Asian — jade + celadon + cinnabar.
        'Chinese':     '#5a9a8f',
        'Shinto':      '#7aa49a',

        // Egyptian / Mesopotamian-Mediterranean basin — lapis +
        // turquoise + ochre.
        'Mesopotamian':'#3a6aa4',
        'Egyptian':    '#3a8aa4',
        'Hermetic':    '#5a9ab8',
        'Mystery':     '#7a8ab8',
        'Neoplatonist':'#4a8a9a',

        // African.
        'African':     '#b86a3a',

        // Mesoamerican / Andean.
        'Mesoamerican':'#9a4a3a',
        'Andean':      '#a06a40',

        // Indigenous (Americas + Pacific).
        'Native-American':'#8a7a50',
        'Pacific':     '#5a8a9a',

        // Modern syncretic / meta.
        'Modern-Esoteric':'#9a7ac4',
        'Academic':    '#6a7a8a',
        'Other':       '#7a8090',
      },

      // GEOGRAPHY — colored by climate / latitude band.
      // Tropical = warm; temperate = green; arid = ochre;
      // polar / oceanic = cool. Honest as a climate map.
      // Phase 21S-fix (2026-05-22) — Christian + Gnostic follow the
      // Mediterranean-basin gold here (no more crimson/violet pin);
      // the Roots theme is the only one that anchors them.
      geography: {
        // Mediterranean basin — gold + ochre.
        'Greek':'#d4a55a','Roman':'#c49a4a','Etruscan':'#c4863a','Egyptian':'#d4b04a',
        'Mesopotamian':'#c47a4a','Israelite':'#c89a5a','Rabbinic':'#b8904a','Canaanite':'#c48a4a',
        'Phoenician':'#c4904a','Pre-Islamic-Arabian':'#b87a40','Mystery':'#c4a06a','Hermetic':'#d4b06a',
        'Neoplatonist':'#c4a070','Christian':'#c89a5a','Gnostic':'#b89060',
        // Near-East arid — wine + ochre.
        'Islamic':'#9a6a40','Mandaean':'#8a6a5a','Manichaean':'#9a5a6a','Zoroastrian':'#a07050',
        'Armenian':'#a06a5a','Hittite':'#a07a4a',
        // Temperate Europe — green + slate.
        'Celtic':'#6a8a5a','Norse':'#5a7a9a','Baltic':'#7a8a5a','Slavic-Finnic':'#6a7a8a',
        // South / South-East Asia — saffron + jade.
        'Vedic':'#d4853a','Buddhist':'#c4a060','Chinese':'#5a9a7a','Shinto':'#7aa49a',
        // Tropical / Pacific — coral + sea-green.
        'African':'#b85a3a','Pacific':'#3a8aa4',
        // Americas — obsidian + sienna.
        'Mesoamerican':'#8a3a3a','Andean':'#a06a4a','Native-American':'#8a6a4a',
        // Meta.
        'Modern-Esoteric':'#9a7ac4','Academic':'#6a7a8a','Other':'#7a8090',
      },

      // COSMOLOGY — by theological structure.
      // Monotheist = gold | Dualist = violet | Polytheist = rust |
      // Pantheist = jade | Animist = moss
      // Phase 21U (2026-05-22) — Monotheist hue switched from gold
      // to RED per John's directive. Red reads as "concentrated /
      // unitary" which matches the theological claim (one supreme
      // deity) better than gold. Gold now belongs to no specific
      // theme so it doesn't fight Roots' Semitic anchor.
      cosmology: {
        // Monotheist (single supreme deity) — red spectrum.
        'Israelite':'#c44a4a','Rabbinic':'#b84a4a','Christian':'#c44a5a','Islamic':'#b03a3a',
        'Zoroastrian':'#c4505a','Mandaean':'#a04848','Sikh':'#c45a55',
        // Dualist (two opposing principles) — violet.
        'Gnostic':'#7a4a9a','Manichaean':'#8a5aa4','Neoplatonist':'#9a6ab8',
        // Polytheist (many gods).
        'Greek':'#c47a4a','Roman':'#b86a3a','Egyptian':'#c4854a','Mesopotamian':'#c4754a',
        'Norse':'#a86a4a','Celtic':'#b87a4a','Vedic':'#d4854a','Hittite':'#a87a4a',
        'Canaanite':'#b8704a','Etruscan':'#c4753a','Slavic-Finnic':'#a87a5a','Baltic':'#a88a5a',
        'Armenian':'#b86a5a','Pre-Islamic-Arabian':'#b87a40','Hermetic':'#c4a070','Mystery':'#c49a6a',
        // Pantheist / Non-dual (divine ≡ cosmos).
        'Buddhist':'#5a9a8a','Chinese':'#5a8a7a','Shinto':'#7aa49a',
        // Animist (spirits in things).
        'African':'#7a8a4a','Mesoamerican':'#7a8a5a','Andean':'#7a8a6a',
        'Native-American':'#8a8a5a','Pacific':'#6a8a8a',
        // Meta.
        'Modern-Esoteric':'#9a7ac4','Academic':'#6a7a8a','Other':'#7a8090',
      },

      // TIME — by era of emergence (the radial axis already encodes
      // age within a family; this colors-by-era too for an even
      // stronger temporal read).
      // Stone/Bronze pre-3000 BCE = deep umber | Bronze/Iron Age =
      // copper | Classical = ochre | Late-Antique = wine | Medieval
      // = teal | Early-Modern = indigo | Modern = silver
      time: {
        // Stone / Bronze (≥ -3000 BCE).
        'Mesopotamian':'#5a3a2a','Egyptian':'#6a4a2a','African':'#5a4a3a',
        'Native-American':'#5a4a3a','Pacific':'#5a4a4a',
        // Bronze / Iron Age (-3000 to -800).
        'Canaanite':'#8a5a3a','Israelite':'#8a6a3a','Vedic':'#a8703a','Hittite':'#9a6a3a',
        'Etruscan':'#a8703a','Mesoamerican':'#8a5a3a','Andean':'#8a6a3a',
        // Classical Antiquity (-800 to 0).
        'Greek':'#c4a040','Celtic':'#b89a4a','Norse':'#c4a04a','Roman':'#c89a4a',
        'Zoroastrian':'#c8a04a','Buddhist':'#c8a050','Chinese':'#c89a4a','Shinto':'#c8a05a',
        'Baltic':'#b8a04a','Slavic-Finnic':'#a89a4a','Pre-Islamic-Arabian':'#b89a3a',
        // Late-Antique (0 to 400 CE) — wine spectrum (no Christian/
        // Gnostic pin in this theme; era is what colors them).
        'Christian':'#9a4a6a','Gnostic':'#8a4a78','Manichaean':'#7a4a8a','Mandaean':'#6a4a7a',
        'Neoplatonist':'#8a5a8a','Hermetic':'#9a6a8a','Mystery':'#a06a8a','Rabbinic':'#a06a8a',
        'Armenian':'#9a5a7a',
        // Medieval (400 to 1500).
        'Islamic':'#3a8a8a',
        // Modern.
        'Modern-Esoteric':'#5a6aa4','Academic':'#7a8a9a','Other':'#7a8090',
      },
    };

    // ────────────────────────────────────────────────────────────
    // ORDER_THEMES[<id>] is a FAMILY_ORDER-shaped array (or null
    // for 'default' which uses the existing FAMILY_ORDER).
    // Missing families fall through to the layout's auto-append.
    // ────────────────────────────────────────────────────────────
    const ORDER_THEMES = {
      // Existing opposites-pair layout.
      opposites: FAMILY_ORDER,

      // Cluster by root, chronologically within. Near-East spine
      // first, then Indo-Iranian, East Asia, Classical Med,
      // IE-North/West, extra-Eurasian, Modern.
      roots: [
        // Near-East spine, oldest → youngest.
        'Mesopotamian','Egyptian','Hittite','Canaanite','Israelite','Rabbinic',
        'Christian','Gnostic','Mandaean','Manichaean','Pre-Islamic-Arabian','Islamic',
        // Indo-Iranian.
        'Zoroastrian','Vedic','Buddhist',
        // East Asia.
        'Chinese','Shinto',
        // Classical Mediterranean.
        'Greek','Mystery','Hermetic','Neoplatonist','Roman','Etruscan',
        // Broader Indo-European.
        'Celtic','Norse','Baltic','Slavic-Finnic','Armenian',
        // Extra-Eurasian.
        'African','Mesoamerican','Andean','Native-American','Pacific',
        // Modern / meta.
        'Modern-Esoteric','Academic','Other',
      ],

      // Strict global chronological emergence — oldest first, regardless
      // of cluster. Pure historical sweep.
      chronological: [
        'Mesopotamian','Egyptian','African','Native-American','Pacific',
        'Canaanite','Israelite','Vedic','Hittite','Etruscan',
        'Mesoamerican','Andean',
        'Greek','Zoroastrian','Buddhist','Celtic','Norse','Roman',
        'Chinese','Shinto','Baltic','Slavic-Finnic','Pre-Islamic-Arabian',
        'Rabbinic','Christian','Gnostic','Mandaean','Manichaean',
        'Hermetic','Mystery','Neoplatonist','Armenian',
        'Islamic',
        'Modern-Esoteric','Academic','Other',
      ],

      // Geographic sweep — Americas → Atlantic → Med → Near East →
      // India → East Asia → Pacific.
      geography: [
        'Mesoamerican','Andean','Native-American',
        'Celtic','Norse','Baltic','Slavic-Finnic',
        'Etruscan','Roman','Greek','Mystery','Hermetic','Neoplatonist',
        'Egyptian','African',
        'Mesopotamian','Canaanite','Israelite','Rabbinic','Christian','Gnostic',
        'Mandaean','Manichaean','Armenian','Hittite',
        'Pre-Islamic-Arabian','Islamic','Zoroastrian',
        'Vedic','Buddhist',
        'Chinese','Shinto','Pacific',
        'Modern-Esoteric','Academic','Other',
      ],
    };

    // Phase 21AL (2026-05-23) — Distribution themes: the algorithm
    // that places nodes INSIDE each wedge. Sibling to color +
    // family-order themes. Three shipped + the rest documented
    // in 00_meta/forge-distribution-patterns-2026-05-22.md for
    // future expansion (wave-interference, voronoi, penrose, etc).
    const DISTRIBUTION_THEMES = {
      organic:    'organic',       // current default — age-radial fan + relaxation
      'age-bands':'age-bands',     // fixed-year concentric bands, scholarly chart
      vogel:      'vogel',         // golden-angle phyllotaxis sunflower
    };

    // Default ux-mode used until LS-restore (if any) overrides it.
    const DEFAULT_UX_MODE = { colorMode: 'default', orderMode: 'opposites', distributionMode: 'organic' };

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

    // Phase 22-C (2026-05-23) — .forge-status row is now a HIDDEN
    // data carrier. The visible FORGE | Deities pill that lived
    // here (Phase 21L → 22-B) was DELETED in 22-C; that UI now
    // lives at the app-shell level (.app-pill in index.html).
    //
    // The spans below stay in the DOM because the debug-stats
    // popover (wireDebugStats) clones their textContent into its
    // own panel each open — they're the LIVE source of truth for
    // device / nodes / edges / hover / lock / frame fields. JS
    // throughout the file writes textContent into these spans via
    // getElementById; getElementById succeeds regardless of CSS
    // display state, so display:none on the parent (see app.css)
    // gives us "hidden but readable" without breaking the writes.
    const status = document.createElement('div');
    status.className = 'forge-status';
    status.innerHTML = [
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
      // Phase 13 (2026-05-21) — Legend button. Same height/style as
      // the zoom gizmo. Click toggles a panel that expands upward
      // listing the 7 wire-bucket colors + names. Hovering a row
      // pops a secondary explainer tooltip describing what that
      // wire type means and our methodology for using it.
      // The button + panel live in a position-relative wrapper so
      // the panel anchors above the button (not the whole bar).
      '<div class="forge-legend-wrap">' +
        '<button class="forge-legend-btn" id="forge-legend-btn" title="Wire color legend" aria-expanded="false">LEGEND</button>' +
        '<div class="forge-legend-panel" id="forge-legend-panel" aria-hidden="true"></div>' +
      '</div>',
      '<div class="forge-legend-tooltip" id="forge-legend-tooltip" aria-hidden="true"></div>',
      // Phase 21B (2026-05-21) — view-settings dropdown. Drop-up
      // menu of layer toggles (hulls / wires / future map). Click
      // a row to flip the toggle; menu stays open so multiple
      // toggles can be set in one go. Persists in LocalStorage.
      '<div class="forge-viewset-wrap">' +
        '<button class="forge-viewset-btn" id="forge-viewset-btn" title="View settings" aria-expanded="false">VIEW</button>' +
        // Phase 21R+21S (2026-05-22) — view-settings panel with
        // three sections: layer toggles (booleans), color theme
        // (radio), family order (radio). The color/order radios
        // re-run rebuildForMode with the preserve-locks path so
        // the user's selection survives the swap.
        '<div class="forge-viewset-panel" id="forge-viewset-panel" aria-hidden="true">' +
          '<div class="forge-viewset-section">Layers</div>' +
          // Phase 22-I (2026-05-24) — wheel-only layers hidden in
          // timeline mode via body.fv-layout-timeline. Hulls,
          // family titles, converging separators, guide rings —
          // all radial-only geometry. Wires + soundtrack + map
          // apply in both layouts so stay unhided.
          // Phase 22-K (2026-05-24) — hulls toggle available in
          // BOTH layouts now. John: "the hulls here are useful".
          '<button class="forge-viewset-row" data-toggle="hulls"><span class="vs-check"></span>Show family hulls</button>' +
          '<button class="forge-viewset-row fv-wheel-only" data-toggle="familyTitles"><span class="vs-check"></span>Show family titles</button>' +
          '<button class="forge-viewset-row fv-wheel-only" data-toggle="dividers"><span class="vs-check"></span>Show family separators</button>' +
          '<button class="forge-viewset-row fv-wheel-only" data-toggle="dividersConverging"><span class="vs-check"></span>Show converging separators <em>(solid → fade)</em></button>' +
          '<button class="forge-viewset-row fv-wheel-only" data-toggle="guideRings"><span class="vs-check"></span>Show guide rings <em>(inner / mid / outer)</em></button>' +
          // Phase 22-AH (2026-05-25) — renamed per audit B: this
          // toggle controls IDLE wires only (Phase 21AI design).
          // Active wires from lock/hover focus are unaffected.
          '<button class="forge-viewset-row" data-toggle="wires"><span class="vs-check"></span>Show idle wires</button>' +
          '<button class="forge-viewset-row" data-toggle="sfx"><span class="vs-check"></span>Soundtrack <em>(zoom-tied)</em></button>' +
          '<button class="forge-viewset-row" data-toggle="map" disabled><span class="vs-check"></span>Show map <em>(coming soon)</em></button>' +
          // Phase 22-I — timeline-only Layers (band rectangles + labels).
          '<button class="forge-viewset-row fv-timeline-only" data-toggle="tlBands"><span class="vs-check"></span>Show family bands</button>' +
          '<button class="forge-viewset-row fv-timeline-only" data-toggle="tlBandLabels"><span class="vs-check"></span>Show family band labels</button>' +
          // Phase 22-M (2026-05-24) — denser tick cadence (more
          // dates onscreen as you zoom in). Off = auto cadence.
          '<button class="forge-viewset-row fv-timeline-only" data-toggle="tlDenseTicks"><span class="vs-check"></span>Dense date ticks</button>' +
          '<div class="forge-viewset-divider"></div>' +
          '<div class="forge-viewset-section">Color theme</div>' +
          '<button class="forge-viewset-row" data-color="default"><span class="vs-radio"></span>Atlas <em>(curated)</em></button>' +
          '<button class="forge-viewset-row" data-color="roots"><span class="vs-radio"></span>Roots <em>(civilizational families)</em></button>' +
          '<button class="forge-viewset-row" data-color="geography"><span class="vs-radio"></span>Geography <em>(climate)</em></button>' +
          '<button class="forge-viewset-row" data-color="longitude"><span class="vs-radio"></span>Longitude <em>(east-west)</em></button>' +
          '<button class="forge-viewset-row" data-color="cosmology"><span class="vs-radio"></span>Cosmology <em>(theology)</em></button>' +
          '<button class="forge-viewset-row" data-color="time"><span class="vs-radio"></span>Time <em>(era)</em></button>' +
          '<div class="forge-viewset-divider"></div>' +
          // Phase 22-I — Family order works in both; only the
          // "Opposites (default)" choice is wheel-specific (radial-
          // pairing logic). Keep the section shown in both modes
          // but mark "opposites" wheel-only.
          '<div class="forge-viewset-section">Family order</div>' +
          '<button class="forge-viewset-row fv-wheel-only" data-order="opposites"><span class="vs-radio"></span>Opposites <em>(default)</em></button>' +
          '<button class="forge-viewset-row" data-order="roots"><span class="vs-radio"></span>Roots clustered</button>' +
          '<button class="forge-viewset-row" data-order="chronological"><span class="vs-radio"></span>Chronological</button>' +
          '<button class="forge-viewset-row" data-order="geography"><span class="vs-radio"></span>Geographic sweep</button>' +
          // Phase 22-I — Node distribution section: WHEEL-only.
          // Timeline uses its own cluster-aware packer (Step 7d);
          // these radio options are wheel-specific algorithms.
          '<div class="forge-viewset-divider fv-wheel-only"></div>' +
          '<div class="forge-viewset-section fv-wheel-only">Node distribution</div>' +
          '<button class="forge-viewset-row fv-wheel-only" data-distribution="organic"><span class="vs-radio"></span>Organic <em>(age-radial fan)</em></button>' +
          '<button class="forge-viewset-row fv-wheel-only" data-distribution="age-bands"><span class="vs-radio"></span>Age bands <em>(scholarly chart)</em></button>' +
          '<button class="forge-viewset-row fv-wheel-only" data-distribution="vogel"><span class="vs-radio"></span>Vogel sunflower <em>(phyllotaxis)</em></button>' +
          '<button class="forge-viewset-row fv-wheel-only" data-toggle="reverseAge"><span class="vs-check"></span>Reverse age direction <em>(rim = oldest)</em></button>' +
          // Phase 21AY (2026-05-23) — Source-tier + political-risk
          // toggles MOVED to the LEGEND panel where the tier vocabulary
          // is documented. Same vocabulary in one place — the legend's
          // tier-swatch rows become interactive checkboxes; the
          // dedicated VIEW section is gone. See wireLegend() below.
        '</div>' +
      '</div>',
      // Phase 21AJ (2026-05-22) — FX wrap moved to the right side
      // of the bottom bar (next to the # debug button). See the
      // forge-debug-btn site below for the new position.
      '<div class="forge-search-wrap">' +
        '<input type="text" class="forge-bottom-search" id="forge-status-search" placeholder="search…" autocomplete="off" spellcheck="false">' +
        '<div class="forge-search-suggest" id="forge-search-suggest" aria-hidden="true"></div>' +
      '</div>',
      // 2026-05-20 — Timeline scrubber redesigned per John's spec:
      // 4 separate boxes (IN value | slider | OUT value | PRESENT
      // value), each the SAME height as the zoom-gizmo + search.
      // Drag IN/OUT/CENTER thumbs in the slider; values update
      // live in the boxes. v2 wires the filter — nodes outside the
      // IN-OUT range get dimmed via the existing state pipeline.
      // Phase 21R (2026-05-22) — IN / OUT are now typable. Click
      // the box, edit "1500 BCE" / "200 CE" / "-500" / "2024",
      // press Enter or blur → parsed + clamped to [lo, hi] +
      // recomputeFocus. The slider thumbs stay live too.
      '<input type="text" class="forge-scrub-box forge-scrub-box-editable" id="forge-scrub-in"  title="IN: lower bound of date range — click to type" autocomplete="off" spellcheck="false" />',
      '<div class="forge-scrub-slider" id="forge-scrub-slider" title="Drag IN / OUT bounds; drag center to scrub">' +
        '<div class="forge-scrub-track">' +
          '<div class="forge-scrub-range" id="forge-scrub-range"></div>' +
          // Phase 11 — Year-0 reference tick. Positioned at the
          // fraction along the track where year 0 sits. Hidden via
          // display:none when bounds don't straddle 0.
          '<div class="forge-scrub-year-zero" id="forge-scrub-year-zero" title="Year 0"></div>' +
          '<div class="forge-scrub-thumb forge-scrub-in-thumb"     id="forge-scrub-in-thumb"     data-handle="in"></div>' +
          '<div class="forge-scrub-thumb forge-scrub-center-thumb" id="forge-scrub-center-thumb" data-handle="center"></div>' +
          '<div class="forge-scrub-thumb forge-scrub-out-thumb"    id="forge-scrub-out-thumb"    data-handle="out"></div>' +
        '</div>' +
      '</div>',
      '<input type="text" class="forge-scrub-box forge-scrub-box-editable" id="forge-scrub-out" title="OUT: upper bound of date range — click to type" autocomplete="off" spellcheck="false" />',
      // Phase 21R (2026-05-22) — PRESENT box + the CENTER-thumb on
      // the slider are HIDDEN in Forge (redundant for the age-radial
      // wheel; the IN/OUT range alone drives the filter here). The
      // JS handlers + DOM remain so a future view that NEEDS a
      // playhead (Timeline) inherits them. CSS hides them under
      // body.view-forge only.
      '<div class="forge-scrub-box forge-scrub-present" id="forge-scrub-present" title="PRESENT: scrub playhead">—</div>',
      // Phase 21AJ (2026-05-23) — FX + Style dev panels, grouped on
      // the right side of the bottom bar next to the # debug button.
      // Both anchor their dropdowns to the RIGHT edge of the wrap so
      // the panels don't overflow the viewport's right side.
      '<div class="forge-fxpanel-wrap forge-fxpanel-wrap--right">' +
        '<button class="forge-fxpanel-btn" id="forge-fxpanel-btn" title="Floor-zoom FX tuning" aria-expanded="false">FX</button>' +
        '<div class="forge-fxpanel forge-fxpanel--right" id="forge-fxpanel" aria-hidden="true">' +
          '<div class="forge-fxpanel-section">Heartbeat rhythm</div>' +
          '<div class="forge-fxpanel-row"><label>period <span class="forge-fxpanel-val" data-val="period">7.0s</span></label><input type="range" data-fx="period" min="1.5" max="14" step="0.1" value="7.0"></div>' +
          '<div class="forge-fxpanel-section">Disk — rest</div>' +
          '<div class="forge-fxpanel-row"><label>blur <span class="forge-fxpanel-val" data-val="blur-base">20.0px</span></label><input type="range" data-fx="blur-base" min="0" max="30" step="0.1" value="20.0"></div>' +
          '<div class="forge-fxpanel-row"><label>brightness <span class="forge-fxpanel-val" data-val="bright-base">1.50</span></label><input type="range" data-fx="bright-base" min="0.3" max="3" step="0.01" value="1.50"></div>' +
          '<div class="forge-fxpanel-row"><label>saturate <span class="forge-fxpanel-val" data-val="sat-base">1.50</span></label><input type="range" data-fx="sat-base" min="0.3" max="3" step="0.01" value="1.50"></div>' +
          '<div class="forge-fxpanel-section">Disk — pulse</div>' +
          '<div class="forge-fxpanel-row"><label>blur <span class="forge-fxpanel-val" data-val="blur-peak">20.0px</span></label><input type="range" data-fx="blur-peak" min="0" max="30" step="0.1" value="20.0"></div>' +
          '<div class="forge-fxpanel-row"><label>brightness <span class="forge-fxpanel-val" data-val="bright-peak">2.00</span></label><input type="range" data-fx="bright-peak" min="0.5" max="4" step="0.01" value="2.00"></div>' +
          '<div class="forge-fxpanel-row"><label>saturate <span class="forge-fxpanel-val" data-val="sat-peak">3.00</span></label><input type="range" data-fx="sat-peak" min="0.5" max="3.5" step="0.01" value="3.00"></div>' +
          '<div class="forge-fxpanel-row"><label>hue shift <span class="forge-fxpanel-val" data-val="hue-peak">0°</span></label><input type="range" data-fx="hue-peak" min="-60" max="60" step="1" value="0"></div>' +
          '<div class="forge-fxpanel-section">Hover &amp; click</div>' +
          '<button class="forge-fxpanel-toggle" data-fx-toggle="pulse-enabled" type="button"><span class="vs-check"></span>Pulse on hover / click</button>' +
          '<div class="forge-fxpanel-row"><label>pulse size <span class="forge-fxpanel-val" data-val="pulse-size-mult">4.0</span></label><input type="range" data-fx="pulse-size-mult" min="0.5" max="10" step="0.1" value="4.0"></div>' +
          '<div class="forge-fxpanel-row"><label>pulse duration <span class="forge-fxpanel-val" data-val="pulse-duration">0.8s</span></label><input type="range" data-fx="pulse-duration" min="0.2" max="2.0" step="0.05" value="0.8"></div>' +
          // Phase 22-I (2026-05-24) — Hulls section is WHEEL-only.
          // Timeline has no convex hulls (band rectangles instead).
          '<div class="forge-fxpanel-section fv-wheel-only">Hulls (calm layer)</div>' +
          '<div class="forge-fxpanel-row fv-wheel-only"><label>brightness <span class="forge-fxpanel-val" data-val="hull-bright-peak">1.30</span></label><input type="range" data-fx="hull-bright-peak" min="0.8" max="2" step="0.01" value="1.30"></div>' +
          '<div class="forge-fxpanel-row fv-wheel-only"><label>saturate <span class="forge-fxpanel-val" data-val="hull-sat-peak">1.55</span></label><input type="range" data-fx="hull-sat-peak" min="0.5" max="2.5" step="0.01" value="1.55"></div>' +
          '<div class="forge-fxpanel-row fv-wheel-only"><label>hue shift <span class="forge-fxpanel-val" data-val="hull-hue-peak">10°</span></label><input type="range" data-fx="hull-hue-peak" min="-60" max="60" step="1" value="10"></div>' +
          '<button class="forge-fxpanel-reset" id="forge-fxpanel-reset">RESET TO DEFAULTS</button>' +
        '</div>' +
      '</div>',
      // Phase 21AJ (2026-05-23) — Style dev panel. Controls the
      // stroke style of the guide-ring circles + the endpoint
      // colors of the long-centered converging separator gradient.
      // Sliders + color pickers write to CSS vars on body.view-forge
      // (see :root block at the top of app.css for defaults).
      '<div class="forge-stylepanel-wrap">' +
        '<button class="forge-stylepanel-btn" id="forge-stylepanel-btn" title="Stroke style tuning" aria-expanded="false">STYLE</button>' +
        '<div class="forge-stylepanel" id="forge-stylepanel" aria-hidden="true">' +
          // Phase 22-I (2026-05-24) — Guide rings + Converging
          // separator are RADIAL-only geometry. Hidden in
          // timeline mode via body.fv-layout-timeline.
          '<div class="forge-fxpanel-section fv-wheel-only">Guide rings</div>' +
          '<div class="forge-stylepanel-rowcolor fv-wheel-only"><label>inner color</label><input type="color" data-style="ring-inner-color" value="#6f8aaf"></div>' +
          '<div class="forge-stylepanel-rowcolor fv-wheel-only"><label>mid color</label><input type="color" data-style="ring-mid-color" value="#6f8aaf"></div>' +
          '<div class="forge-stylepanel-rowcolor fv-wheel-only"><label>outer color</label><input type="color" data-style="ring-outer-color" value="#6f8aaf"></div>' +
          '<div class="forge-fxpanel-row fv-wheel-only"><label>stroke width <span class="forge-fxpanel-val" data-val="ring-width">0.5px</span></label><input type="range" data-style="ring-width" min="0.2" max="6" step="0.1" value="0.5"></div>' +
          '<div class="forge-fxpanel-row fv-wheel-only"><label>opacity <span class="forge-fxpanel-val" data-val="ring-opacity">0.50</span></label><input type="range" data-style="ring-opacity" min="0" max="1" step="0.01" value="0.5"></div>' +
          '<div class="forge-fxpanel-section fv-wheel-only">Separators</div>' +
          '<div class="forge-fxpanel-row fv-wheel-only"><label>stroke width <span class="forge-fxpanel-val" data-val="sep-width">0.5px</span></label><input type="range" data-style="sep-width" min="0.2" max="6" step="0.1" value="0.5"></div>' +
          '<div class="forge-fxpanel-row fv-wheel-only"><label>opacity <span class="forge-fxpanel-val" data-val="sep-opacity">0.50</span></label><input type="range" data-style="sep-opacity" min="0" max="1" step="0.01" value="0.5"></div>' +
          '<div class="forge-fxpanel-section fv-wheel-only">Converging separator</div>' +
          '<div class="forge-stylepanel-rowcolor fv-wheel-only"><label>center color</label><input type="color" data-style="conv-center-color" value="#6f8aaf"></div>' +
          '<div class="forge-fxpanel-row fv-wheel-only"><label>center opacity <span class="forge-fxpanel-val" data-val="conv-center-opacity">1.00</span></label><input type="range" data-style="conv-center-opacity" min="0" max="1" step="0.01" value="1.0"></div>' +
          '<div class="forge-stylepanel-rowcolor fv-wheel-only"><label>outer color</label><input type="color" data-style="conv-edge-color" value="#6f8aaf"></div>' +
          '<div class="forge-fxpanel-row fv-wheel-only"><label>outer opacity <span class="forge-fxpanel-val" data-val="conv-edge-opacity">0.00</span></label><input type="range" data-style="conv-edge-opacity" min="0" max="1" step="0.01" value="0.0"></div>' +
          // Phase 22-I (2026-05-24) — Timeline band styling. Live
          // values feed into timeline-chrome.js on each refresh.
          // Persisted to localStorage; reset to defaults below.
          '<div class="forge-fxpanel-section fv-timeline-only">Timeline bands</div>' +
          '<div class="forge-fxpanel-row fv-timeline-only"><label>fill opacity <span class="forge-fxpanel-val" data-val="tl-band-fill">0.02</span></label><input type="range" data-style="tl-band-fill" min="0" max="0.8" step="0.01" value="0.02"></div>' +
          '<div class="forge-fxpanel-row fv-timeline-only"><label>stroke opacity <span class="forge-fxpanel-val" data-val="tl-band-stroke">0.25</span></label><input type="range" data-style="tl-band-stroke" min="0" max="1" step="0.01" value="0.25"></div>' +
          '<div class="forge-fxpanel-row fv-timeline-only"><label>stroke width <span class="forge-fxpanel-val" data-val="tl-band-stroke-w">0.5px</span></label><input type="range" data-style="tl-band-stroke-w" min="0" max="4" step="0.1" value="0.5"></div>' +
          '<div class="forge-fxpanel-section fv-timeline-only">Family labels</div>' +
          '<div class="forge-fxpanel-row fv-timeline-only"><label>opacity <span class="forge-fxpanel-val" data-val="tl-label-opacity">0.85</span></label><input type="range" data-style="tl-label-opacity" min="0" max="1" step="0.01" value="0.85"></div>' +
          '<div class="forge-fxpanel-row fv-timeline-only"><label>size <span class="forge-fxpanel-val" data-val="tl-label-size">11px</span></label><input type="range" data-style="tl-label-size" min="8" max="20" step="0.5" value="11"></div>' +
          // Phase 22-K (2026-05-24) — axis (horizontal) + grid
          // (vertical year stripes) live STYLE controls.
          '<div class="forge-fxpanel-section fv-timeline-only">Horizontal axis</div>' +
          '<div class="forge-fxpanel-row fv-timeline-only"><label>opacity <span class="forge-fxpanel-val" data-val="tl-axis-opacity">0.70</span></label><input type="range" data-style="tl-axis-opacity" min="0" max="1" step="0.01" value="0.70"></div>' +
          '<div class="forge-fxpanel-row fv-timeline-only"><label>width <span class="forge-fxpanel-val" data-val="tl-axis-width">1.5px</span></label><input type="range" data-style="tl-axis-width" min="0.5" max="4" step="0.1" value="1.5"></div>' +
          '<div class="forge-fxpanel-section fv-timeline-only">Vertical year stripes</div>' +
          '<div class="forge-fxpanel-row fv-timeline-only"><label>opacity <span class="forge-fxpanel-val" data-val="tl-grid-opacity">0.10</span></label><input type="range" data-style="tl-grid-opacity" min="0" max="0.6" step="0.01" value="0.10"></div>' +
          '<div class="forge-fxpanel-row fv-timeline-only"><label>width <span class="forge-fxpanel-val" data-val="tl-grid-width">1.0px</span></label><input type="range" data-style="tl-grid-width" min="0.5" max="3" step="0.1" value="1.0"></div>' +
          // Phase 22-M (2026-05-24) — Year-0 pivot marker controls.
          '<div class="forge-fxpanel-section fv-timeline-only">Year-0 pivot</div>' +
          '<div class="forge-fxpanel-row fv-timeline-only"><label>opacity <span class="forge-fxpanel-val" data-val="tl-yr0-opacity">0.75</span></label><input type="range" data-style="tl-yr0-opacity" min="0" max="1" step="0.01" value="0.75"></div>' +
          '<div class="forge-fxpanel-row fv-timeline-only"><label>tick size <span class="forge-fxpanel-val" data-val="tl-yr0-size">12px</span></label><input type="range" data-style="tl-yr0-size" min="4" max="32" step="1" value="12"></div>' +
          '<div class="forge-fxpanel-row fv-timeline-only"><label>line width <span class="forge-fxpanel-val" data-val="tl-yr0-width">1.8px</span></label><input type="range" data-style="tl-yr0-width" min="0.5" max="4" step="0.1" value="1.8"></div>' +
          '<button class="forge-fxpanel-reset" id="forge-stylepanel-reset">RESET TO DEFAULTS</button>' +
        '</div>' +
      '</div>',
      // Phase 21A2 (2026-05-21) — debug-stats toggle. Tiny
      // square button next to the present-date box.
      '<button class="forge-debug-btn" id="forge-debug-btn" type="button" title="Show engine stats" aria-expanded="false" aria-controls="forge-debug-panel">⌗</button>',
      '<div class="forge-debug-panel" id="forge-debug-panel" aria-hidden="true"></div>',
      // Phase 22-AB-fix4 (2026-05-24) — TIMELINE SEGMENT.
      // Lives inside the canonical .forge-bottombar so it shares
      // the same flex row + same vertical centering as every other
      // bottom-bar button. CSS gates visibility via body.fv-layout-
      // timeline (only shows on Timeline view). Each button uses
      // .forge-fxpanel-btn — the canonical site-wide button class.
      // NEW MENUS ANYWHERE IN THE APP MUST FOLLOW THIS PATTERN.
      //   - Declarative HTML in this bottombar template (or its
      //     view-specific siblings).
      //   - Class = .forge-fxpanel-btn (never a custom button class
      //     that duplicates its declarations).
      //   - Active state via [aria-pressed="true"] (CSS owns the
      //     gold tint). Open state via [aria-expanded="true"].
      //   - Visibility per layout via body.fv-layout-<name>.
      //   - JS attaches event handlers ONLY — never builds DOM.
      // See HOW-WE-WORK.md §5 cardinal rule #7 (SEVERITY DOGMA).
      // Phase 22-AD (2026-05-24) — three preset buttons (LIN/LOG/
      // CMP), then a focus group (DATE IN | DATE OUT | FOCUS) for
      // zoom-to-range navigation. LOG-R dropped per John's spec.
      // DENSITY moved OUT of the bar into its own always-visible
      // vertical slider primitive (see #forge-tl-vdensity below).
      '<div class="forge-bottombar-right fv-timeline-only" id="forge-bottombar-timeline">' +
        // Phase 22-AF (2026-05-24) — LOG dropped. CMP already behaves
        // as the log-style compressed scale, so LOG was redundant.
        '<button class="forge-fxpanel-btn" data-tl-preset="linear-default"          aria-pressed="true"  title="Linear · 9K BCE → today">LIN</button>' +
        '<button class="forge-fxpanel-btn" data-tl-preset="compressed-civilization" aria-pressed="false" title="Compressed · era-weighted">CMP</button>' +
        // Phase 22-AE (2026-05-24) — CALENDAR popup button. Click =
        // drops up a list of registered calendars (Gregorian, Hebrew,
        // Hijri, Jalali, Ethiopian to start). Active calendar drives
        // tick-label formatting + YR 0 pivot text via formatYear().
        // Same .forge-fxpanel-btn primitive class — pixel parity.
        '<button class="forge-fxpanel-btn forge-tl-cal-btn" id="forge-tl-cal-btn" aria-haspopup="true" aria-expanded="false" title="Date system — switch between Gregorian / Hebrew / Hijri / Jalali / Ethiopian">' +
          '<span class="forge-tl-cal-label">CAL</span>' +
          '<span class="forge-tl-cal-val">GREG</span>' +
          '<span class="forge-tl-cal-chev">▾</span>' +
        '</button>' +
        '<input type="text" class="forge-fxpanel-btn forge-tl-focus-in"  id="forge-tl-focus-in"  placeholder="date in"  autocomplete="off" spellcheck="false" title="Type a year (e.g. -3000, 0, 1500). Press FOCUS to zoom." />' +
        '<input type="text" class="forge-fxpanel-btn forge-tl-focus-out" id="forge-tl-focus-out" placeholder="date out" autocomplete="off" spellcheck="false" title="Type a year (e.g. -3000, 0, 1500). Press FOCUS to zoom." />' +
        '<button class="forge-fxpanel-btn forge-tl-focus-go" id="forge-tl-focus-go" title="Zoom + pan so DATE IN sits at the left edge and DATE OUT at the right edge">FOCUS</button>' +
      '</div>',
    ].join('');
    stage.appendChild(bottomBar);

    // Phase 22-AD (2026-05-24) — ALWAYS-VISIBLE VERTICAL DENSITY
    // SLIDER. Forked out of the bottombar into its own primitive
    // anchored bottom-right above the bottombar. Persistent on
    // Timeline view (hidden elsewhere via .fv-timeline-only).
    // John's brief: "always present vertical slider that the user
    // can always access and scrub while navigating not having to
    // click to open it — making it vertical also helps functionality
    // intuitive for human, and saves us horizontal space on UX
    // bottom menu." This is a SPECIALITY primitive that lives next
    // to the bottombar but is NOT a bottombar cell. Owns its own
    // shape (vertical), its own height (~150px), its own drag
    // semantics. Declarative DOM — JS in timeline-chrome.js only
    // wires pointer events.
    const vdensity = document.createElement('div');
    vdensity.className = 'forge-tl-vdensity fv-timeline-only';
    vdensity.id = 'forge-tl-vdensity';
    vdensity.innerHTML =
      '<div class="forge-tl-vdensity-readout" id="forge-tl-vdensity-readout">1.0×</div>' +
      '<div class="forge-tl-vdensity-track"   id="forge-tl-vdensity-track">' +
        '<div class="forge-tl-vdensity-thumb" id="forge-tl-vdensity-thumb"></div>' +
      '</div>' +
      '<div class="forge-tl-vdensity-label">DENS</div>' +
      // Phase 22-AG (2026-05-24) — LOCK toggle. When ON: zoom drives
      // density linearly (zoom 20% → density 1.0×; zoom 100% → 0.3×;
      // zoom out → density expands). OFF: independent controls.
      '<button class="forge-tl-vdensity-lock" id="forge-tl-vdensity-lock" type="button" aria-pressed="false" title="LOCK — zoom drives density when on">LOCK</button>';
    stage.appendChild(vdensity);

    // Phase 20F (2026-05-21) — backdrop image (star-field / nebula).
    // Sits BELOW the canvas in z-order so the wheel paints on top.
    // syncBackgroundImage() repositions + rescales + fades per
    // camera change: invisible at scale ≥ 0.50, fades in to full
    // opacity by scale ≤ 0.10 (max zoom-out). The image is anchored
    // at the wheel centre in world space, sized so it fills the
    // viewport when scale = 0.10.
    // Phase 21A2 (2026-05-21) — BG image is now attached to
    // document.body (NOT the forge stage) and CSS-positioned
    // `fixed; inset: 0; object-fit: cover;` so it covers the
    // entire VIEWPORT regardless of where the canvas / stage
    // sits inside the page chrome. Earlier versions parented
    // it under .forge-stage, which left visible gaps wherever
    // the stage was offset from the viewport edge (top status
    // bar, sidebar reservation, etc). Now: the page's outer
    // shell decides where the image goes (always full screen);
    // JS only controls opacity by zoom. The view module owns
    // its lifecycle — adds on render, removes on destroy.
    // Phase 21P (2026-05-21) — BG can be a still image OR a looping
    // video. The element keeps the SAME id (#forge-bg-image), class
    // (.forge-bg-image), DOM position (first child of <body>), and
    // sizing math (width/height in pixels written each tick by
    // syncBackgroundImage()). Only the element TAG and the aspect-
    // listener event differ between image and video. To swap assets:
    //   • set BG_ASSET_URL to the file
    //   • set BG_ASSET_KIND to 'image' or 'video'
    //   • everything else (anchoring, zoom-floor, fade) is identical
    // ───────────────────────────────────────────────────────────
    // BG asset — Phase 21Q (2026-05-22). Test #2: HD-aspect video.
    // Source master lives in `Art Direction/BG X2 hd.mov` (John's
    // workbench, .gitignored). The ABSORBED copy at the path below
    // is what the site references — so John can rearrange Art
    // Direction without breaking anything. To swap: copy the new
    // master into _assets/bg/<stable-name>.<ext>, edit these two
    // constants, bump the cache-bust string in index.html.
    // ───────────────────────────────────────────────────────────
    const BG_ASSET_URL  = '_assets/bg/bg-x1-hd.mov?v=20260522-21ac';
    const BG_ASSET_KIND = 'video';   // 'image' | 'video'
    let bgImage = document.getElementById('forge-bg-image');
    // If the cached element is the WRONG tag for the current asset
    // kind (e.g. an <img> left over from a prior load and now we
    // want <video>), drop it so the create-branch builds the
    // correct element.
    if (bgImage) {
      const wantTag = (BG_ASSET_KIND === 'video') ? 'VIDEO' : 'IMG';
      if (bgImage.tagName !== wantTag) {
        try { bgImage.parentNode && bgImage.parentNode.removeChild(bgImage); } catch (_) {}
        bgImage = null;
      }
    }
    if (!bgImage) {
      if (BG_ASSET_KIND === 'video') {
        bgImage = document.createElement('video');
        bgImage.id = 'forge-bg-image';
        bgImage.className = 'forge-bg-image';
        bgImage.src = BG_ASSET_URL;
        // Required for browsers to autoplay without user gesture.
        bgImage.autoplay    = true;
        bgImage.muted       = true;
        bgImage.defaultMuted= true;
        bgImage.loop        = true;
        bgImage.playsInline = true;
        bgImage.setAttribute('muted', '');
        bgImage.setAttribute('playsinline', '');
        bgImage.setAttribute('autoplay', '');
        bgImage.setAttribute('loop', '');
        bgImage.preload     = 'auto';
        bgImage.disablePictureInPicture = true;
        bgImage.controls    = false;
      } else {
        bgImage = document.createElement('img');
        bgImage.id = 'forge-bg-image';
        bgImage.className = 'forge-bg-image';
        bgImage.src = BG_ASSET_URL;
        bgImage.alt = '';
        bgImage.draggable = false;
      }
      // PREPEND so it sits at the bottom of the document stacking
      // order — every other positioned element (canvas, nav-hub
      // trigger, footer, detail panel, hover card) paints over it.
      document.body.insertBefore(bgImage, document.body.firstChild);
      if (BG_ASSET_KIND === 'video') {
        // Some browsers block autoplay if the gesture-check fires
        // before the muted attribute is committed; nudge play().
        try { bgImage.play().catch(() => {}); } catch (_) { /* ignore */ }
      }
    }
    // Phase 21C (2026-05-21) — re-introduce aspect tracking. Used
    // by syncBackgroundImage() to size the asset at its natural
    // proportions; otherwise the element box would stretch.
    if (!bgImage._bgAspect) bgImage._bgAspect = 4 / 3;
    if (!bgImage._bgAspectListenerAttached) {
      bgImage._bgAspectListenerAttached = true;
      if (BG_ASSET_KIND === 'video') {
        // <video> exposes natural dims as videoWidth / videoHeight,
        // settled on `loadedmetadata`.
        bgImage.addEventListener('loadedmetadata', () => {
          if (bgImage.videoWidth > 0 && bgImage.videoHeight > 0) {
            bgImage._bgAspect = bgImage.videoWidth / bgImage.videoHeight;
            if (typeof syncBackgroundImage === 'function') syncBackgroundImage();
          }
        });
      } else {
        bgImage.addEventListener('load', () => {
          if (bgImage.naturalWidth > 0 && bgImage.naturalHeight > 0) {
            bgImage._bgAspect = bgImage.naturalWidth / bgImage.naturalHeight;
            if (typeof syncBackgroundImage === 'function') syncBackgroundImage();
          }
        });
      }
    }

    // ────────────────────────────────────────────────────────────
    // Phase 21AL (2026-05-23) — soundtrack BG. Looping audio whose
    // volume rides the same zoom curve as the BG opacity: silent at
    // zoomPct >= 0.50, full at the floor (0.10). Toggleable from
    // View settings via the body.fv-hide-sfx class.
    //
    // Browser autoplay: audio with sound can't auto-play before a
    // user gesture. We attach a one-shot pointerdown listener that
    // calls .play() on first interaction. Until then the element
    // is loaded but silent.
    // ────────────────────────────────────────────────────────────
    let bgAudio = document.getElementById('forge-bg-audio');
    if (!bgAudio) {
      bgAudio = document.createElement('audio');
      bgAudio.id = 'forge-bg-audio';
      bgAudio.src = '_assets/audio/bg-sfx-01.mp3?v=20260523-21al';
      bgAudio.loop = true;
      bgAudio.preload = 'auto';
      bgAudio.volume = 0;     // start silent; ramps in via syncSoundtrack
      // No autoplay attribute — we kick it on first pointerdown.
      document.body.appendChild(bgAudio);
      const kickPlay = () => {
        try { bgAudio.play().catch(() => {}); } catch (_) {}
      };
      document.addEventListener('pointerdown', kickPlay, { once: true });
      // NOTE: `local._bgAudio = bgAudio` is set BELOW once `const local`
      // is declared. Doing it here triggered a TDZ ReferenceError
      // that aborted mount() before the canvas was created (the
      // forge view stayed stuck at "device acquiring…").
    }

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
    // Phase 20 (2026-05-21) — family hulls SVG overlay. Drawn ABOVE
    // the canvas (so the SVG can be styled directly with CSS) but
    // BEFORE the labels overlay so labels paint on top of hull
    // titles when they collide.
    //
    // The SVG is sized to match the canvas via 100%/100% + CSS
    // absolute positioning. World→screen for polygon vertices is
    // computed on each camera change inside `syncHulls()`.
    //
    // pointer-events: none so hulls never intercept hover.
    const hullsOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    hullsOverlay.setAttribute('class', 'forge-hulls-overlay');
    hullsOverlay.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    stage.appendChild(hullsOverlay);

    const labelsOverlay = document.createElement('div');
    labelsOverlay.className = 'forge-labels-overlay';
    stage.appendChild(labelsOverlay);

    // ─── Phase 25 (2026-05-26) — CANVAS LABEL LAYER ──────────
    // The DOM label layer (labelsOverlay above) is now NEVER
    // populated. All labels render on this 2D canvas — one
    // element composited as a single GPU layer. Eliminates the
    // per-label compositor cost that was Safari's last cliff
    // after the DOM-cap workaround (~100 labels). With canvas
    // we can show 500-1000+ labels with zero perf impact.
    //
    // Pointer-events: none so the canvas overlay can't intercept
    // mouse events (the WebGPU canvas below it owns hit-testing).
    // Position: absolute over the stage, full bounds, DPR-aware.
    const labelsCanvas = document.createElement('canvas');
    labelsCanvas.className = 'forge-labels-canvas';
    labelsCanvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;';
    stage.appendChild(labelsCanvas);
    const labelsCanvasCtx = labelsCanvas.getContext('2d');
    // labelsCanvas size is set lazily inside renderLabelsCanvas()
    // when local.lastSize first becomes valid.

    // Phase 19B (2026-05-21) — Forge uses the existing GLOBAL
    // aside.detail panel from index.html for the deity inspector.
    // No second panel inside .forge-stage (the earlier Phase 19
    // duplicate was removed once we found the global one already
    // existed and is shared with the other views). See
    // wireSidePanel() below for the content render + pulse-on-lock
    // hook wiring.

    // ── Camera ──────────────────────────────────────────
    const camera = cammod.create({ centerX: 0, centerY: 0, scale: 1 });

    // ════════════════════════════════════════════════════════════
    //  Phase 21J (2026-05-21) — zoom-floor + pan-lock policy
    // ════════════════════════════════════════════════════════════
    //  applyZoomFloor() is called whenever fit_scale could have
    //  changed (resize, rebuildForMode) AND on every camera
    //  change (so pan bounds tighten as scale approaches the
    //  floor).
    //
    //  Two things wired together:
    //
    //    1. SCALE FLOOR — camera.setScaleBounds(floor, undefined)
    //       so the engine clamps every internal scale write
    //       (setScale / zoomAt / nudgeZoomTarget / flyTo /
    //       animation tick) up to floor. No drift past gizmo 10%.
    //
    //    2. PAN LOCK — pan bounds tighten with zoom:
    //         t = (scale − floor) / (fit − floor)   ∈ [0, 1]
    //       At scale = floor (t = 0), bounds = (0, 0, 0, 0): the
    //       camera is locked dead-centre, no pan possible.
    //       At scale = fit (t = 1), bounds = the full world-pad
    //       extent (~world span × 0.5 margin on each side).
    //       Between, bounds expand linearly with t.
    // ════════════════════════════════════════════════════════════
    // Phase 21N (2026-05-21) → Phase 22-P (2026-05-24) — camera
    // zoom-out floor at gizmo 10% (was 11%). The cover-fit
    // fallback in syncBackgroundImage (max(world-scaled, vp-cover))
    // means going to 10% no longer leaves BG gaps; the floor can
    // safely drop.
    const FLOOR_PCT = 0.10;
    function applyZoomFloor() {
      if (!camera || !camera.setScaleBounds) return;
      const fit = (typeof computeFitScale === 'function') ? computeFitScale() : 0;
      if (!fit || fit <= 0) return;
      const floor = fit * FLOOR_PCT;
      camera.setScaleBounds(floor, undefined);
      // Pan bounds tied to current scale.
      if (camera.setPanBounds) {
        const ext = (local.mode && local.mode.worldExtent) || null;
        if (!ext) return;
        const span    = Math.max(ext.x1 - ext.x0, ext.y1 - ext.y0);
        const maxMrg  = span * 0.5;
        const t       = Math.max(0, Math.min(1, (camera.state.scale - floor) / Math.max(1e-6, fit - floor)));
        // Phase 21K (2026-05-21) + Phase TL-2 Step 4b (2026-05-24)
        // INTERPOLATE THE BOUNDS toward a dead-lock CENTER point at
        // t = 0 (zoom floor). For the wheel, that center is (0, 0)
        // — the wheel's own origin. For an off-origin layout like
        // the timeline (data midpoint at world-X ≈ +2750 wu), the
        // dead-lock center MUST be the layout's natural center; if
        // we collapse toward (0, 0), the camera gets clamped LEFT
        // of the data and the timeline visually shifts RIGHT off-
        // center at zoom-out — exactly the bug John screen-shotted.
        // local.mode.deadLockCenter (optional) carries the layout's
        // own choice; wheel mode leaves it undefined → defaults to
        // (0, 0) preserving the Phase 21K behavior.
        const dlc = (local.mode && local.mode.deadLockCenter) || { x: 0, y: 0 };
        // Phase 22-M (2026-05-24) — gentler pan-bound curve for
        // TIMELINE. The wheel's linear t-interpolation collapses
        // bounds aggressively at low zoom (gizmo 24% → t=0.16 →
        // bounds at 16% of extent), which clips tall band stacks
        // (esp. with high band-density slider values). Timeline
        // gets t^0.5 — reaches 50% bounds at gizmo 27%, 80% at
        // gizmo 75% — giving freedom to pan once you're off the
        // zoom floor. Wheel keeps linear (radial layouts are
        // already self-fitting at any zoom).
        const tCurve = (local.layoutId === 'timeline')
          ? Math.sqrt(t)
          : t;
        const x0 = dlc.x + ((ext.x0 - maxMrg) - dlc.x) * tCurve;
        const y0 = dlc.y + ((ext.y0 - maxMrg) - dlc.y) * tCurve;
        const x1 = dlc.x + ((ext.x1 + maxMrg) - dlc.x) * tCurve;
        const y1 = dlc.y + ((ext.y1 + maxMrg) - dlc.y) * tCurve;
        camera.setPanBounds(x0, y0, x1, y1);
      }
    }

    // ── Local mount state ──────────────────────────────
    const local = {
      renderer:    null,
      resizeObs:   null,
      lastSize:    { w: 0, h: 0 },
      destroyed:   false,
      hoverId:     null,
      lockedSet:   new Set(),    // Phase 4b: sticky focus from clickNode
      focusedSet:  null,
      // Phase TL-2 Step 1 (2026-05-24) — layout selector. Default
      // 'wheel' = radialWedgeLayout (the existing radial deity wheel).
      // 'timeline' = timelineLayout (TL-1 module). Flipped by
      // window._forge.setLayout(); read by rebuildForMode to pick
      // which layout function to call. Each layout owns its own
      // positions Map + worldExtent; everything downstream is
      // layout-agnostic.
      layoutId:    'wheel',
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
      // Phase 5C (2026-05-20) — glyphInstancesDirty REMOVED.
      // Glyph opacity is now uniform-driven in GPU (same shape as
      // disk opacity), so there is no per-frame CPU work for the
      // glyph alpha column. The glyph instance buffer is now
      // truly static: it changes only on rebake / mode-switch.
      // The next drawFrame's first upload happens because
      // ensureBuffer.grew is true on first allocation; subsequent
      // re-uploads only fire when rebake replaces the data.
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

    // Phase 21AL (2026-05-23) — deferred bgAudio binding. The audio
    // element was created above (before `local` existed); bind it
    // onto local now so destroy() can pause + detach it.
    if (bgAudio) local._bgAudio = bgAudio;

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
        // Phase TL-2 Step 3 (2026-05-24) — unmount the timeline
        // chrome (SVG axis + ticks) if active. Safe to call even
        // when in wheel mode (chrome.unmount is a no-op then).
        try {
          if (window.AtlasTimelineChrome && window.AtlasTimelineChrome.isMounted()) {
            window.AtlasTimelineChrome.unmount();
          }
        } catch (e) { /* ignore */ }
        if (local.resizeObs) {
          try { local.resizeObs.disconnect(); } catch (e) { /* ignore */ }
          local.resizeObs = null;
        }
        if (local.renderer) {
          try { local.renderer.destroy(); } catch (e) { /* ignore */ }
          local.renderer = null;
        }
        // Phase 21O (2026-05-21) — detach the mode-dropdown popup.
        // wireModeDropdown() appended it directly to document.body
        // (so it escapes the .forge-status overflow:hidden); on
        // destroy we tear it down so view-switch doesn't leak a
        // stale popup into the next view.
        if (local.modeMenuEl && local.modeMenuEl.parentNode) {
          try { local.modeMenuEl.parentNode.removeChild(local.modeMenuEl); } catch (e) { /* ignore */ }
          local.modeMenuEl = null;
        }
        // Phase 21V (2026-05-22) — clear the FX class so the bloom +
        // shimmer don't bleed into the next view if the user was at
        // floor zoom at unmount time.
        document.body.classList.remove('fx-bloom');
        document.body.classList.remove('fx-belowfifteen');
        document.body.classList.remove('fx-pulse-enabled');
        local._fxBloomActive    = false;
        local._fxBelowFifteen   = false;
        // Phase 21AE (2026-05-22) — pulse cleanup. Any pending
        // hover/click pulse timer would otherwise fire on the
        // next view and re-add the class to a no-longer-existing
        // canvas reference.
        if (local._hoverFlashTimer)  { clearTimeout(local._hoverFlashTimer);  local._hoverFlashTimer = 0; }
        if (local._fxBloomExitTimer) { clearTimeout(local._fxBloomExitTimer); local._fxBloomExitTimer = 0; }
        if (local._clickPulseTimer)  { clearTimeout(local._clickPulseTimer);  local._clickPulseTimer = 0; }
        // Phase 21AL (2026-05-23) — stop + detach the soundtrack
        // audio so it doesn't keep playing into the next view.
        if (local._bgAudio) {
          try { local._bgAudio.pause(); } catch (_) {}
          if (local._bgAudio.parentNode) {
            try { local._bgAudio.parentNode.removeChild(local._bgAudio); } catch (_) {}
          }
          local._bgAudio = null;
        }
        // Phase 21AG (2026-05-22) — dot elem cleanup. The
        // _clickPendingTimer from 21AF is gone (single-click is
        // instant now); no timer to cancel.
        if (local._fxPulseDot && local._fxPulseDot.parentNode) {
          try { local._fxPulseDot.parentNode.removeChild(local._fxPulseDot); } catch (_) {}
          local._fxPulseDot = null;
        }
        try { camera.stopAnim(); } catch (e) { /* ignore */ }
      },
    };

    // Debug surface — used by automated verification to inspect
    // hover state from outside the closure. Safe to leave on in
    // dev; gated to dev once we add user gating.
    window._forgeDebug = {
      // 24-HUD (2026-05-26, removable) — full per-frame timing
      // (GPU draw + syncLabels + syncHulls + syncBackgroundImage).
      // Returns rolling window stats over last N frames (max 120).
      frameStats: () => {
        const arr = local._frameTimes || [];
        const rf  = local._rfTimes || [];
        const rfSorted = rf.length ? rf.slice().sort((a, b) => a - b) : [];
        const out = {
          count: arr.length,
          activeNodes: (local.mode && local.mode.nodes) ? local.mode.nodes.length : 0,
          last: 0, avg: 0, p95: 0, max: 0,
          rfLast: +(local._lastRecomputeFocusMs || 0).toFixed(2),
          rfAvg: 0, rfP95: 0, rfMax: 0, rfCount: rf.length,
        };
        if (arr.length) {
          const sorted = arr.slice().sort((a, b) => a - b);
          out.last = +(local._lastFullFrameMs || 0).toFixed(2);
          out.avg = +(arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2);
          out.p95 = +sorted[Math.floor(sorted.length * 0.95)].toFixed(2);
          out.max = +sorted[sorted.length - 1].toFixed(2);
        }
        if (rf.length) {
          out.rfAvg = +(rf.reduce((s, v) => s + v, 0) / rf.length).toFixed(2);
          out.rfP95 = +rfSorted[Math.floor(rfSorted.length * 0.95)].toFixed(2);
          out.rfMax = +rfSorted[rfSorted.length - 1].toFixed(2);
        }
        return out;
      },
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

      // ── Phase 5B MANAGEMENT-only debug helpers (2026-05-20) ─
      // Current timeline bounds + user-driven thumbs.
      timeline: () => local.timeline ? {
        lo:         local.timeline.lo,
        hi:         local.timeline.hi,
        inDate:     local.timeline.inDate,
        outDate:    local.timeline.outDate,
        centerDate: local.timeline.centerDate,
      } : null,
      // Number of rebakeNodes() calls since mount. Verifies M-F1:
      // a mode-switch should increment this by exactly 1; if 2,
      // the spurious onChange-rebake-on-old-mode bug is back.
      countRebakeNodes: () => local.rebakeNodesCount || 0,
      // Current LS-serialisable runtime snapshot. Returns the same
      // shape saveRuntimeState would write — useful for verifying
      // hydration round-trip without touching localStorage from
      // the test.
      dumpRuntime: () => {
        const tl = local.timeline;
        return {
          mode: local.mode && local.mode.id || null,
          timeline: tl ? {
            in:     tl.inDate,
            out:    tl.outDate,
            center: tl.centerDate,
          } : null,
          lockedSet: local.lockedSet ? Array.from(local.lockedSet) : [],
        };
      },
      // Read raw LS value (for diagnosing persistence issues).
      dumpLsRuntime: () => {
        try {
          const raw = window.localStorage && window.localStorage.getItem(LS_RUNTIME_KEY);
          return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
      },

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

      // Phase 5B M-F2 (2026-05-20) — load LS runtime state BEFORE
      // first rebuildForMode so the saved mode (if any) is honored.
      // Timeline + lockedSet are restored AFTER the scrubber wires
      // up (post-rebuildForMode) so local.timeline.lo/hi exist for
      // clamping.
      const savedRuntime = loadRuntimeState();
      if (savedRuntime && typeof savedRuntime.mode === 'string'
          && modemod.isValidMode(savedRuntime.mode)) {
        local.mode.id = savedRuntime.mode;
      }
      // Phase 21S (2026-05-22) — restore color theme + family order
      // BEFORE the first rebuildForMode so the initial layout uses
      // the right choices. Unknown ids fall back to default.
      local.uxMode = Object.assign({}, DEFAULT_UX_MODE);
      if (savedRuntime && savedRuntime.uxMode) {
        const u = savedRuntime.uxMode;
        if (typeof u.colorMode === 'string' && COLOR_THEMES.hasOwnProperty(u.colorMode)) {
          local.uxMode.colorMode = u.colorMode;
        }
        if (typeof u.orderMode === 'string' && ORDER_THEMES.hasOwnProperty(u.orderMode)) {
          local.uxMode.orderMode = u.orderMode;
        }
        if (typeof u.distributionMode === 'string' && DISTRIBUTION_THEMES.hasOwnProperty(u.distributionMode)) {
          local.uxMode.distributionMode = u.distributionMode;
        }
      }

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
        // Phase 21J (2026-05-21) — recompute pan bounds on every
        // camera change so the lock tightens / loosens with the
        // current zoom. Scale clamping happens inside the camera
        // module via setScaleBounds; here we only re-apply pan
        // bounds based on the just-changed state.scale.
        applyZoomFloor();
        // Phase 5C (2026-05-20) — glyph opacity is uniform-driven
        // on the GPU now, so camera motion no longer needs to
        // mark the glyph buffer dirty. The off-viewport cull is
        // also gone (WebGPU's vertex-clip step handles it for
        // free; the previous CPU cull was redundant). Pan/zoom
        // is now purely a GPU-side view-uniform refresh.
        // Re-pack nodes if the camera scale has drifted enough
        // since the last pack. Threshold is N-aware (Phase 5B
        // M-F4, 2026-05-20): at 663 nodes a 5% band feels right;
        // at 10k+ the rebakeNodes→rebakeEdges chain is ~10-20 ms,
        // so successive crossings inside one wheel gesture cause
        // visible stutter. Widening the band trades a little
        // screen-px-clamp accuracy for huge wall-time savings
        // at scale. Tiers: <1k = 5%, <10k = 15%, ≥10k = 30%.
        const camScale = camera.state.scale;
        const lastScale = local.packedAtScale || camScale;
        const N = (local.mode && local.mode.nodePacked && local.mode.nodePacked.instanceCount) || 0;
        // Phase 22-AH (2026-05-25) — audit A: timeline navigation
        // chokes because the rebake-band-cross fires mid-wheel-gesture
        // every ~20 ticks at 5% drift. Widened the <1k tier from 0.05
        // → 0.10 — at 663 deities the screen-px-clamp difference is
        // perceptually zero but rebake-frequency halves.
        const driftBand = N < 1000 ? 0.10 : N < 10000 ? 0.15 : 0.30;
        const driftLo = 1 - driftBand;
        const driftHi = 1 + driftBand;
        if (lastScale > 0) {
          const ratio = camScale / lastScale;
          if (ratio < driftLo || ratio > driftHi) {
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
          // Phase 21AA (2026-05-22) — wheel default = NICE fit
          // (label-aware), not the pure geometric fit. Gizmo
          // displays ~85% post-click.
          // Phase 22-K → 22-N (2026-05-24) — timeline gizmo-click =
          // 20% gizmo (scan-the-whole-spine view).
          let targetScale, targetCx = 0, targetCy = 0;
          if (local.layoutId === 'timeline'
              && local.mode && local.mode.xRange
              && window.AtlasEngineLayout
              && window.AtlasEngineLayout.computeTimelineFitScale) {
            const tlFit = window.AtlasEngineLayout.computeTimelineFitScale(
              local.lastSize.w, local.mode.xRange);
            targetScale = tlFit * 0.20;
          } else {
            targetScale = computeNiceFitScale();
          }
          camera.flyTo({
            centerX: targetCx, centerY: targetCy,
            scale:   targetScale,
          }, 0.35);
          if (camera.isAnimating()) startAnimLoop();
          // Phase 22-AF (2026-05-24) — Timeline only: zoom-button
          // click ALSO resets band density to the default 1.0×.
          // John: "when we click on the zoom button it should also
          // slide the density to default". Skipped for wheel mode
          // where there's no density slider.
          if (local.layoutId === 'timeline'
              && window.AtlasEngineLayout
              && typeof window.AtlasEngineLayout.setTimelineBandHeightScale === 'function') {
            const changed = window.AtlasEngineLayout.setTimelineBandHeightScale(1.0);
            try { localStorage.setItem('codex_atlas_timeline_band_scale_v4', '1'); } catch (_) {}
            if (changed && typeof window._forge.relayout === 'function') {
              window._forge.relayout();
            }
          }
        });
      }
      updateZoomGizmo();

      // Phase 21O (2026-05-21) — Hub-style custom dropdown.
      // wireModeDropdown() builds the popup (sibling of body),
      // anchors it to the button, handles open/close/select, and
      // returns a `setMode(id)` so external code can sync the
      // visible label without firing a rebuild.
      // Phase 22-C (2026-05-23) — wireModeDropdown DELETED.
      // The class-selector UI now lives at the app-shell level
      // (.app-pill-class). We install the public API instead
      // so app-pill.js can drive setClassFilter from the new pill.
      installPublicApi();
      syncModeButtonLabel(local.mode.id);

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

      // Phase 13 (2026-05-21) — Wire-color legend with nested
      // explainer tooltips. Reads bucket hexes from PARAM_DEFAULTS
      // so there's a single source of truth for color values.
      wireLegend();
      // Phase 14 (2026-05-21) — On-canvas hover thumbnail card.
      wireHoverCard();
      // Phase 19 (2026-05-21) — Right-edge deity inspector panel.
      wireSidePanel();
      // Phase 21A2 (2026-05-21) — Debug-stats popover next to the
      // present-date box (replaces the old persistent top-bar
      // stats display).
      wireDebugStats();
      // Phase 21B (2026-05-21) — View-settings dropdown (hulls /
      // wires / map) + search autocomplete suggestions.
      wireViewSettings();
      wireFXPanel();
      wireStylePanel();
      wireSearchAutocomplete();

      // Phase 5B M-F2 (2026-05-20) — apply LS-saved timeline +
      // lockedSet now that local.timeline exists + adjacency is
      // populated. saved.timeline is clamped to current mode's
      // lo/hi by local.scrubber.applySavedTimeline; saved.lockedSet
      // ids are filtered against current adjacency (silently drop
      // ids that don't exist in this mode — could be a stale lock
      // from another mode or a removed vault node).
      if (savedRuntime) {
        if (local.scrubber && savedRuntime.timeline) {
          local.scrubber.applySavedTimeline(savedRuntime.timeline);
        }
        if (Array.isArray(savedRuntime.lockedSet)
            && local.mode && local.mode.adjacency) {
          for (const id of savedRuntime.lockedSet) {
            if (typeof id === 'string' && local.mode.adjacency.has(id)) {
              local.lockedSet.add(id);
            }
          }
          if (local.lockedSet.size > 0) {
            const lEl = document.getElementById('forge-status-lock');
            if (lEl) lEl.textContent = String(local.lockedSet.size);
            recomputeFocus();
          }
        }
        // Sync the mode button label to the saved mode (if any).
        // Phase 21O — replaces the old <select>.value sync.
        if (local.mode && local.mode.id) {
          syncModeButtonLabel(local.mode.id);
        }
      }

      // Bind interaction handlers AFTER renderer is ready.
      attachInteractions();
    })().catch(err => {
      // 2026-05-25 — safety net learned from the Phase 23.1 carve
      // incident: when the bootstrap IIFE is `async`, any synchronous
      // throw turns into an unhandled Promise rejection. Some browsers
      // silently swallow these (or surface them only in the dedicated
      // "unhandledrejection" channel, not the regular console). That
      // hid a wireLegend-style ReferenceError for hours.
      //
      // This .catch() makes ANY bootstrap failure LOUD on the regular
      // console.error channel — even silent-async ones. Costs nothing
      // when the bootstrap succeeds (catch() on a resolved promise is
      // a no-op).
      console.error('[forge] bootstrap failed (interactions may not be bound):', err && err.stack ? err.stack : err);
    });

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
    function rebuildForMode(modeId, opts) {
      // ─── Phase 24A-PROFILE (2026-05-26, removable) ────────────
      // Per-phase timing. Gated by local._profileRebuild flag —
      // zero overhead when off. Results land on
      // local._lastRebuildPhases as [{name, ms}, ...].
      // Toggle via window._forge.profileRebuild(true/false).
      // Read via window._forge.getLastRebuildPhases().
      const _PROFILE_ON = !!local._profileRebuild;
      const _PROFILE = _PROFILE_ON ? [] : null;
      let _phaseStart = _PROFILE_ON ? performance.now() : 0;
      const _tick = _PROFILE_ON
        ? (name) => { const now = performance.now(); _PROFILE.push({ name, ms: +(now - _phaseStart).toFixed(2) }); _phaseStart = now; }
        : () => {};
      if (!modemod.isValidMode(modeId)) modeId = modemod.defaultMode();
      // Phase 21S (2026-05-22) — `opts.preserveLocks` skips the
      // cross-mode lock-clear. Used by the ux-mode (color/order)
      // re-apply path where node ids stay valid even though the
      // wheel re-lays-out. The default (no opts) keeps the
      // existing cross-mode behavior: locks clear because node
      // ids don't carry between modes.
      const preserveLocks = !!(opts && opts.preserveLocks);
      const savedLocks    = preserveLocks ? Array.from(local.lockedSet || []) : null;
      // Phase TL-2 Step 7b-fix3 (2026-05-24) — preserveZoom.
      // When TRUE, the post-fit camera override is skipped so the
      // user's current pan + zoom state survives the relayout. Used
      // by _forge.relayout() (band-density slider tick, scale-preset
      // switch) where the dataset isn't actually changing — only the
      // mapping. Without this, every slider tick would yank the
      // camera back to the 20% default, undoing the user's zoom-in.
      // Fresh mounts + class-filter switches leave this false so the
      // 20% scan-view default still applies.
      const preserveZoom  = !!(opts && opts.preserveZoom);
      const savedCamState = (preserveZoom && camera && camera.state)
        ? { scale: camera.state.scale, centerX: camera.state.centerX, centerY: camera.state.centerY }
        : null;

      // Phase 2B B2 (2026-05-20) — drain any pending hover-coalesce
      // BEFORE swapping local.mode. Without this, the pending rAF
      // callback would fire post-swap and call recomputeFocus()
      // against the new mode's adjacency with the old hoverPendingId,
      // producing a brief ghost-hover on a node id that may not
      // exist in the new mode. The hoverId reset further down at
      // local.hoverId = null is correct but doesn't address the
      // pending recompute the rAF still holds.
      cancelHoverCoalesce();
      _tick('preamble');

      // Phase 24A v1 (2026-05-25 NIGHT): `modeNodes` and `modeEdges`
      // are `let` (not `const`) so the viewport-cull block below the
      // camera-fit can reassign them to the in-view subset. `degree`
      // stays computed against the full type-matching set so visual
      // sizing (which uses degree-as-importance) stays stable across
      // pan/zoom — only the SET of nodes that get packed shrinks.
      let modeNodes = modemod.filterNodesByMode(modeId, allNodes, allEdges);
      _tick('filterNodesByMode');

      // ─── 24-HARDDEBUG (2026-05-26, removable) ─────────────────
      // If ?debug-cap=N in URL, HARD-SLICE modeNodes to N RIGHT NOW,
      // before degree/layout/cull/pack — ALL downstream work runs on
      // N nodes only. Bypasses every other filter so there's zero
      // way for a stale cache or filter-toggle to hide the effect.
      // Paints a red banner on-screen so the user has visual proof
      // the code is live.
      let _hardCap = 0;
      try {
        const u = parseInt(new URLSearchParams(location.search).get('debug-cap'), 10);
        if (u > 0) _hardCap = u;
      } catch (_) {}
      if (_hardCap > 0 && Array.isArray(modeNodes) && modeNodes.length > _hardCap) {
        const beforeN = modeNodes.length;
        modeNodes = modeNodes.slice(0, _hardCap);
        console.log('[forge HARD-DEBUG] sliced modeNodes:', beforeN, '→', modeNodes.length, '(cap=' + _hardCap + ')');
        let banner = document.getElementById('forge-hard-debug-banner');
        if (!banner) {
          banner = document.createElement('div');
          banner.id = 'forge-hard-debug-banner';
          banner.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#e22;color:#fff;padding:8px 16px;z-index:99999;font:bold 14px ui-monospace,Menlo,Monaco,monospace;border-radius:6px;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,.5);';
          document.body.appendChild(banner);
        }
        banner.textContent = '🔴 HARD-DEBUG cap=' + _hardCap + ' · ' + modeNodes.length + '/' + beforeN + ' nodes · mode=' + modeId;
      } else {
        const banner = document.getElementById('forge-hard-debug-banner');
        if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
      }
      // ──────────────────────────────────────────────────────────

      let modeEdges = layout.filterEdgesByNodes(allEdges, modeNodes);
      _tick('filterEdgesByNodes');
      const degree    = layout.computeDegree(modeNodes, modeEdges);
      _tick('computeDegree');
      // Phase TL-2 Step 1 (2026-05-24) — layout-aware. local.layoutId
      // picks between the radial wheel and the horizontal timeline.
      // Default 'wheel' preserves existing behavior; setLayout('timeline')
      // (the new public API on window._forge) flips it. The layout
      // function picked here owns the positions Map + the worldExtent
      // it returns; the rest of the engine (packNodes, packEdges,
      // adjacency, hit-grid, camera) is layout-agnostic.
      //
      // Phase 21S (2026-05-22) — order + color from the active
      // ux-mode (radio selections in View settings; LS-persisted).
      const _layoutId = local.layoutId || 'wheel';
      // ─── Phase 24B v1 (2026-05-26) — layout-position cache ───
      // The profile (commit TBD) showed `layout` is 60-90% of every
      // rebuildForMode call. radialWedgeLayout is deterministic given
      // (modeNodes-set, familyOrder, colorOverride, distribution,
      // layoutId, reverseAge); cache by a key built from those and
      // skip recompute on cache hit. Switching deities → themes →
      // deities used to recompute deities layout (~80 ms); now it's
      // a Map lookup (<1 ms).
      //
      // Cache lives on local._layoutCache: Map<keyStr, layResult>.
      // Each `lay` object is structurally shared with the engine —
      // we hand the SAME object back on hit (positions Map etc.).
      // Mutations to lay.positions would corrupt the cache; the
      // downstream pipeline (packNodes, packEdges, etc.) is read-only
      // against lay.positions so this is safe today. If a future
      // change mutates lay, switch to deep-clone on hit.
      const _familyOrder = currentFamilyOrder();
      const _colorOverride = currentColorOverride();
      const _distribution = currentDistribution();
      const _reverseAge = !!document.body.classList.contains('fv-reverse-age');
      // Build a cheap-to-hash key. modeId + layoutId + a stable
      // string for each input. familyOrder + colorOverride may be
      // arrays/objects; JSON.stringify is fast enough at the sizes
      // involved (~20 families × short strings).
      const _layoutKey = modeId
        + '|' + _layoutId
        + '|' + JSON.stringify(_familyOrder)
        + '|' + JSON.stringify(_colorOverride)
        + '|' + JSON.stringify(_distribution)
        + '|' + (_reverseAge ? '1' : '0');
      if (!local._layoutCache) local._layoutCache = new Map();
      let lay = local._layoutCache.get(_layoutKey);
      const _layoutCacheHit = !!lay;
      if (_layoutCacheHit) {
        // Cache hit — skip the recompute.
      } else if (_layoutId === 'timeline' && typeof layout.timelineLayout === 'function') {
        lay = layout.timelineLayout(modeNodes, _familyOrder, {
          colorOverride: _colorOverride,
          parkUndated:   true,
        });
        local._layoutCache.set(_layoutKey, lay);
      } else {
        lay = layout.radialWedgeLayout(modeNodes, _familyOrder, {
          degree,
          colorOverride: _colorOverride,
          distribution:  _distribution,
          reverseAge:    _reverseAge,
        });
        local._layoutCache.set(_layoutKey, lay);
      }
      _tick(_layoutCacheHit ? 'layout (CACHED)' : 'layout');

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
      // Phase TL-2 Step 1 — timelineLayout returns its own
      // worldExtent (anisotropic rectangle); radialWedgeLayout
      // returns rOuter and the view layer builds the square
      // worldExtent from it. Branch by what's present.
      const ext = (lay.worldExtent)
        ? lay.worldExtent
        : {
            x0: -(lay.rOuter + WORLD_PAD), y0: -(lay.rOuter + WORLD_PAD),
            x1:  (lay.rOuter + WORLD_PAD), y1:  (lay.rOuter + WORLD_PAD),
          };
      camera.stopAnim();
      if (local.lastSize.w && local.lastSize.h) {
        camera.fitToExtent(ext, local.lastSize, 0);
        // Phase TL-2 Step 4 (2026-05-24) — timeline-mode fit override.
        // fitToExtent picks min(vp.w/world_w, vp.h/world_h) which for
        // an anisotropic 6000×2050 timeline picks the X-dimension and
        // shrinks the visible content to the tiny side of viewport.
        // John's spec wants the timeline 4.5× wider than viewport at
        // "fit" (gizmo 100%) so the user pans/zooms like TradingView.
        // After fitToExtent, override camera.scale + center for the
        // timeline-specific feel.
        if (local.layoutId === 'timeline' && lay.xRange
            && window.AtlasEngineLayout
            && window.AtlasEngineLayout.computeTimelineFitScale) {
          const tlFit = window.AtlasEngineLayout.computeTimelineFitScale(
            local.lastSize.w, lay.xRange);
          const tlCtr = window.AtlasEngineLayout.computeTimelineCenter(
            lay.xRange, ext);
          if (preserveZoom && savedCamState) {
            // Phase TL-2 Step 7b-fix3 — keep the user's zoom + pan
            // across relayouts (band-density slider, preset switch).
            camera.set(savedCamState);
          } else {
            // Phase 22-K → 22-N (2026-05-24) — default open zoom = 20%
            // gizmo (was 25%, before that 20%). Paired with the band-
            // height ×1.3 multiplier below so the new 1× slider value
            // produces what was previously 1.3× — the comfortable
            // scan view at 20% camera zoom.
            camera.set({ scale: tlFit * 0.20, centerX: tlCtr.x, centerY: tlCtr.y });
          }
        }
        // Phase 5B M-F1 (2026-05-20) — synchronously record the
        // new pack-scale BEFORE the listener-emit from fitToExtent
        // propagates. Otherwise the onChange listener (camera.js
        // emits inside fitToExtent → forge.js:onChange) computes
        // ratio against the OLD mode's packedAtScale and may fire
        // a spurious rebakeNodes() on the OLD mode (local.mode is
        // still the previous mode here — replacement is below).
        // Today the only effect is wasted work (rebake is discarded
        // when local.mode swaps below); becomes a stale-radius bug
        // the moment anyone optimises the listener's drift check.
        // Sets the same value the redundant write at line 1281
        // would have set; that line stays as belt-and-braces +
        // covers any non-fit packNodes call sites.
        local.packedAtScale = (camera && camera.state) ? camera.state.scale : 1;
      }
      _tick('camera-fit');
      // 2026-05-19 — pan bounds. Allow the user to pan a half-
      // viewport-worth beyond each edge of the wheel so the
      // outermost nodes can be brought toward center, but stop
      // them from infinite-panning into empty space. Margin is
      // generous (worldSpan units) so they always have headroom.
      // Phase 21J (2026-05-21) — pan bounds are now computed
      // dynamically by applyZoomFloor() based on the current
      // camera scale (tightens at the zoom floor, widens at fit).
      // We just need the worldExtent on local.mode for it to
      // read; the actual setPanBounds call lives inside
      // applyZoomFloor. Below we kick the first computation
      // right after rebuildForMode populates local.mode.

      // ─── Phase 24A v1 (2026-05-25 NIGHT) — viewport cull ────────
      // Camera is now fit. Before we pack nodes + edges + build hit
      // grid, reduce the active set to nodes whose layout position
      // is inside the viewport (+ margin). Vault stays loaded; what
      // shrinks is the set the downstream pipeline operates on.
      //
      // This bounds rebuildForMode cost to active-in-viewport, not
      // active-in-mode. On a 50k-node vault zoomed to default scan
      // view, the difference is ~7s freeze → ~30ms.
      //
      // V1 limitation: only fires on rebuildForMode (mode/layout
      // switch). Pan/zoom does NOT re-cull yet. V2 will extract the
      // post-layout pipeline into a callable function and add a
      // debounced camera.onChange hook. For now, mode switches at
      // arbitrary zoom levels get the active-set bound.
      //
      // Toggle off via window._forge.setViewportFilter(false) to A/B.
      if (window.AtlasViewportFilter && local._viewportFilterEnabled !== false) {
        const vfOpts = local._viewportFilterOpts || {};
        const margin = (vfOpts.margin != null) ? vfOpts.margin : 1.5;
        // Phase 24-DEBUG (2026-05-26): URL param ?debug-cap=N hard-caps
        // the active set to N regardless of opts. For perf-bisection:
        // visit /?view=forge&debug-cap=50 to force a 50-node render,
        // then compare felt fluidity to the uncapped baseline. Tells us
        // whether the bottleneck scales with active-node count or is
        // a fixed cost (DOM compositing, hull SVG, etc.).
        let cap = (vfOpts.capActive != null) ? vfOpts.capActive : 5000;
        try {
          const urlCap = parseInt(new URLSearchParams(location.search).get('debug-cap'), 10);
          if (urlCap > 0) cap = urlCap;
        } catch (_) {}
        const canvasEl = document.querySelector('.forge-pane canvas');
        const bbox = window.AtlasViewportFilter.viewportWorldBbox(camera, canvasEl, margin);
        const cullResult = window.AtlasViewportFilter.cull(modeNodes, lay.positions, bbox, cap);
        local._lastViewportCull = {
          ms: cullResult.ms,
          total: cullResult.total,
          kept: cullResult.kept,
          truncated: cullResult.truncated,
          bbox,
          margin,
          cap,
        };
        // Only apply if cull kept SOMETHING (defensive — degenerate
        // bbox or early-mount pre-fit could otherwise zero the set).
        if (cullResult.kept > 0) {
          modeNodes = cullResult.nodes;
          modeEdges = layout.filterEdgesByNodes(allEdges, modeNodes);
        }
      }
      _tick('viewport-cull');

      const nodePack  = graph.packNodes(modeNodes, lay.positions, degree, nodeOverridesFromParams());
      _tick('packNodes');
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
      _tick('packEdges');
      const adj       = graph.buildAdjacency(modeEdges);
      _tick('buildAdjacency');
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
      _tick('hit-grid');

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
        // Phase TL-2 Step 3 (2026-05-24) — timeline-layout-specific
        // metadata that the chrome layer reads. Empty/null in wheel
        // mode; populated by timelineLayout's return shape.
        xRange:      lay.xRange   || null,
        yRange:      lay.yRange   || null,
        bands:       lay.bands    || null,
        undated:     lay.undated  || null,
        // Phase TL-2 Step 4b (2026-05-24) — dead-lock center for
        // applyZoomFloor's pan-bound interpolation. Wheel leaves
        // undefined → defaults to (0, 0). Timeline writes its
        // natural center so zoom-out doesn't shift the line off-
        // center to the right.
        deadLockCenter: (local.layoutId === 'timeline' && lay.xRange && window.AtlasEngineLayout && window.AtlasEngineLayout.computeTimelineCenter)
          ? window.AtlasEngineLayout.computeTimelineCenter(lay.xRange, ext)
          : null,
      };
      // Phase TL-2 Step 3 (2026-05-24) — mount/unmount the timeline
      // chrome (axis line + tick metrics) based on the active layout.
      // The chrome owns its own SVG overlay and camera-change refresh
      // loop; we just bridge mount/unmount on rebuildForMode boundaries.
      try {
        // Phase 22-I (2026-05-24) — body class for layout-aware
        // panels. CSS rules hide .fv-wheel-only sections under
        // body.fv-layout-timeline and .fv-timeline-only under
        // body.fv-layout-wheel. Set BEFORE mounting the chrome so
        // the panels paint with the right visibility on first render.
        document.body.classList.toggle('fv-layout-timeline', local.layoutId === 'timeline');
        document.body.classList.toggle('fv-layout-wheel',    local.layoutId !== 'timeline');
        const chrome = window.AtlasTimelineChrome;
        if (chrome) {
          if (local.layoutId === 'timeline' && lay.xRange) {
            const stageEl = (rootEl && rootEl.querySelector) ? rootEl.querySelector('.forge-stage') : null;
            chrome.mount({
              hostEl: stageEl || rootEl,
              camera: camera,
              mode:   local.mode,
              xRange: lay.xRange,
            });
          } else {
            chrome.unmount();
          }
        }
      } catch (e) { console.warn('[forge] timeline chrome mount failed', e); }
      _tick('mode-state + timeline-chrome');
      // Phase 21O (2026-05-21) — keep the FORGE | <label> button
      // face + the open-menu active-row marker in sync with the
      // current mode. Safe no-op if the button isn't mounted yet.
      try { syncModeButtonLabel(modeId); } catch (_) {}
      // Phase 21J (2026-05-21) — apply the zoom-floor + pan-lock
      // now that local.mode.worldExtent is populated. The camera
      // is already at the new fit_scale (resizeAndFit was called
      // above), so this also pegs the scale bounds correctly.
      applyZoomFloor();
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
      _tick('fade-pipeline-replace');

      // Cross-mode hover/lock cleared — node ids don't map
      // between modes.
      // Phase 21S (2026-05-22) — preserveLocks restores the lock
      // set after the wholesale-replace (which has to allocate a
      // fresh Set per re-build). Only valid ids in the new mode's
      // adjacency are restored; stale ones (shouldn't happen for
      // same-mode color/order swaps but defensive) drop silently.
      local.hoverId    = null;
      local.lockedSet  = new Set();
      local.focusedSet = null;
      if (preserveLocks && savedLocks && savedLocks.length) {
        for (const id of savedLocks) {
          if (typeof id === 'string' && adj && adj.has(id)) {
            local.lockedSet.add(id);
          }
        }
        const lEl = document.getElementById('forge-status-lock');
        if (lEl) lEl.textContent = String(local.lockedSet.size || '—');
      }
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
      // Phase 25 (2026-05-26) — labelEls is empty (canvas owns
      // rendering); this loop is now a no-op. Kept the .clear()
      // call as belt-and-braces in case any legacy code added
      // entries.
      local.labelEls.clear();
      // Phase 4B FX6 (2026-05-20) — clear the visibility tracker
      // alongside labelEls so syncLabels starts from a clean slate.
      if (local.visibleLabelEls) local.visibleLabelEls.clear();
      _tick('label-DOM-clear');

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

      // Phase 20 (2026-05-21) — family hulls + ring metrics +
      // dividers. Built once per mode rebuild from packed node
      // positions. Result is a record:
      //   { hulls: [...], center, innerRadius, outerRadius,
      //     dividers: [...] }
      // - hulls[]   per-family convex polygon + centroid +
      //             centroidAngle for radial label placement
      // - center    world centre of the wheel
      // - innerRadius / outerRadius
      //             min / max distance from center over all nodes
      // - dividers[] radial separators between angularly-adjacent
      //             families. Phase 20D-4 (2026-05-21): the third
      //             arg is the layout's exact wedge boundaries —
      //             dividers are now computed from a1[i] → a0[i+1]
      //             mid-points, so they sit on the IMMUTABLE wedge
      //             edges instead of the post-relaxation centroids.
      //             Fixes the bug where Shinto / Pacific members
      //             drifted across the centroid-bisector dividers
      //             after the global relaxation pass.
      // Phase 20J (2026-05-21) — pass the CANONICAL rInner /
      // rOuter from the layout (not just the wedges map). The
      // hull function uses these to anchor pie-slice radii at
      // the same world geometry the layout used, so slices
      // line up with the deity cluster instead of with the
      // post-relaxation centroid (which drifts 30-50 wu off
      // origin and offsets the slices by ~60 px on screen).
      // Phase TL-2 Step 1 (2026-05-24) — defensive: hull-builder
      // expects radial-layout shape (wedges + rInner + rOuter). In
      // timeline-layout mode those don't exist; pass safe stubs so
      // we don't crash. Hulls will look wrong in timeline (no pie
      // slices = the band rectangles need their own renderer);
      // Step 3 swaps in proper band-aware hull data. For now the
      // hulls render as an empty/degenerate set which is fine for
      // Step 1's "verify engine boots in timeline mode" goal.
      local.mode.hullData = (graph.buildFamilyHulls)
        ? graph.buildFamilyHulls(nodePack, modeNodeById, {
            wedges: lay.wedges || {},
            rInner: lay.rInner || 0,
            rOuter: lay.rOuter || 1,
          })
        : { hulls: [], center: { x: 0, y: 0 }, innerRadius: 0, outerRadius: 0, dividers: [] };
      _tick('hull-data');
      rebuildHullElements();
      _tick('rebuildHullElements');

      // Phase 25 (2026-05-26) — label pre-create REMOVED. Canvas
      // labels need no per-node DOM. The labelEls Map stays empty
      // (kept as a stub so any straggler reads return undefined
      // cleanly). What used to be 100-1000 createElement+appendChild
      // calls per mode rebuild is now zero. Mode-switch cost drops
      // by 10-30ms depending on mode size.
      _tick('label-pre-create');

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
      _tick('glyph-buffer');
      // Phase 5B M-F5 (2026-05-20) — eager search index for the
      // new mode. O(N) one-shot; findBestMatch then walks this
      // instead of re-lowercasing strings + looking up adjacency
      // on every call.
      buildSearchIndex();
      _tick('search-index');
      // Phase 5B M-F3 (2026-05-20) — re-derive scrubber bounds for
      // the new mode. local.scrubber.refreshBounds preserves the
      // user's in/out/center when they fit the new lo/hi; clamps
      // otherwise. Skipped on the very first rebuildForMode (before
      // wireTimelineScrubber runs) — wireTimelineScrubber itself
      // calls refreshBounds at the end of its initial setup.
      if (local.scrubber) local.scrubber.refreshBounds();
      // Camera fit already done above (before packNodes) so the
      // pack ran at the correct scale. Just draw.
      drawFrame();
      _tick('drawFrame');
      if (_PROFILE_ON) {
        local._lastRebuildPhases = _PROFILE;
        local._lastRebuildTotal = _PROFILE.reduce((s, p) => s + p.ms, 0);
      }
    }

    // ════════════════════════════════════════════════════════════
    //  computeFaceObjectPosition(w, h) — Phase 21AD (2026-05-22)
    // ════════════════════════════════════════════════════════════
    //  Human heuristic for portraits in square crops: faces are
    //  usually in the upper portion of vertical images, so the
    //  square should clip MORE from the BOTTOM (i.e. image shifts
    //  up). Square or horizontal images get the standard centered
    //  position.
    //
    //  Returns a CSS `object-position` value (e.g. "center 11.4%").
    //  Lower Y% = image's TOP aligns with crop TOP (more clipped at
    //  bottom). Higher Y% = inverse.
    //
    //  Anchor case (John's spec, 2026-05-22):
    //    image 960×1865 (aspect 0.515) → 103 px clipped above out
    //    of 905 px excess → 11.4% of excess above center.
    //
    //  Formula (linear in verticality 1-aspect, clamped at 0):
    //    if aspect ≥ 1.0  → "center" (50%)
    //    else             → max(0, 50 - 79.6 × (1 - aspect)) %
    //
    //  The 79.6 slope is calibrated so the anchor case lands exactly
    //  at 11.4%. Eases smoothly toward 50% as the image approaches
    //  square; clamps to 0% (full top-align) for very thin portraits.
    // ════════════════════════════════════════════════════════════
    function computeFaceObjectPosition(w, h) {
      if (!w || !h || w <= 0 || h <= 0) return 'center';
      const aspect = w / h;
      if (aspect >= 1) return 'center';
      const verticality = 1 - aspect;       // 0..1, where 0 = square
      const topPct      = Math.max(0, 50 - 79.6 * verticality);
      return 'center ' + topPct.toFixed(1) + '%';
    }

    // ── Zoom gizmo (Phase 6d) ────────────────────────────
    // Reports current camera scale as a percentage relative to
    // the FIT scale (the scale that frames the whole wheel into
    // the viewport). 100% = wheel fills the viewport; >100% =
    // zoomed in; <100% = zoomed out. Click = fly back to fit.
    function computeFitScale() {
      const vp = local.lastSize;
      if (!vp.w || !vp.h || !local.mode || !local.mode.worldExtent) return 1;
      // Phase TL-2 Step 4 (2026-05-24) — timeline mode has its own
      // fit-scale semantics. Per John's spec: at gizmo 20% the date
      // range fills 90% of viewport — i.e., at fit (gizmo 100%) the
      // data range is 4.5× viewport-wide (only ~22% visible). This
      // gives the TradingView feel where the default zoom shows
      // detail and zoom-out gives the overview. See
      // layout/timeline.js FIT_OVERSCAN.
      if (local.layoutId === 'timeline'
          && local.mode.xRange
          && window.AtlasEngineLayout
          && window.AtlasEngineLayout.computeTimelineFitScale) {
        return window.AtlasEngineLayout.computeTimelineFitScale(vp.w, local.mode.xRange);
      }
      const ext = local.mode.worldExtent;
      const wx = ext.x1 - ext.x0;
      const wy = ext.y1 - ext.y0;
      if (wx <= 0 || wy <= 0) return 1;
      return Math.min(vp.w / wx, vp.h / wy);
    }
    // ════════════════════════════════════════════════════════════
    //  computeNiceFitScale() — Phase 21AA (2026-05-22)
    // ════════════════════════════════════════════════════════════
    //  The "click the zoom button" target scale. Smaller than the
    //  pure geometric fit_scale by a label-band buffer, so the
    //  family-name titles (which sit OUTSIDE the rim by ~44 px +
    //  text width) don't clip at the viewport edge.
    //
    //  ── CRITICAL: this is NOT a replacement for computeFitScale.
    //  ──   computeFitScale is the canonical metric (see
    //  ──   AUDIT/forge-zoom-world-system-2026-05-21.md §3).
    //  ──   Everything reads it: gizmo %, the 11% zoom floor, BG
    //  ──   opacity ramp, label fade, pan-bound collapse. If you
    //  ──   change computeFitScale, the floor moves, the BG ramp
    //  ──   moves, the floor wheel shrinks into oblivion. That
    //  ──   exact bug is Phases 21Y / 21Z (reverted).
    //  ──
    //  ──   computeNiceFitScale is a UX preset for ONE caller —
    //  ──   the gizmo-click flyTo. The gizmo % stays referenced
    //  ──   to computeFitScale, so the gizmo will read e.g. 85%
    //  ──   after the click. That's honest: "you're at a
    //  ──   comfortable viewing zoom, not the math-max fit."
    // ════════════════════════════════════════════════════════════
    function computeNiceFitScale() {
      const vp = local.lastSize;
      if (!vp.w || !vp.h || !local.mode || !local.mode.worldExtent) return computeFitScale();
      const ext = local.mode.worldExtent;
      const wx = ext.x1 - ext.x0;
      const wy = ext.y1 - ext.y0;
      if (wx <= 0 || wy <= 0) return computeFitScale();
      // Label band: LABEL_OUTSIDE_PAD (44 px) + worst-case half-
      // label-text-width (~80 px) + breathing room (~16 px) = 140 px
      // on each side. 280 px total per axis. Conservative — better
      // a slightly-too-small wheel than a clipped label.
      const LABEL_BAND_PX = 140;
      const totalBuffer   = 2 * LABEL_BAND_PX;
      const effectiveW    = Math.max(200, vp.w - totalBuffer);
      const effectiveH    = Math.max(200, vp.h - totalBuffer);
      return Math.min(effectiveW / wx, effectiveH / wy);
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
      // Phase 5B M-F7 (2026-05-20) — bail when the stage is
      // effectively zero-size. Previously fell through to
      // Math.max(1, ...) which fit the camera to a 1×1 viewport
      // producing garbage state. Today not reproducible because
      // setView('forge') makes the pane visible before render,
      // but a future route-guard mounting Forge in a hidden tab
      // would trip this. Audit-03 F13 / lock-plan T2.14.
      if (rect.width < 8 || rect.height < 8) return;
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
      // Phase 21J (2026-05-21) — viewport size changed → fit_scale
      // changed → zoom floor changed. Re-apply.
      applyZoomFloor();
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
      // Phase 21M (2026-05-21) — IDLE wires fade with zoom-out.
      // Mapping (in gizmo terms): wires at full alpha when
      // zoomPct ≥ 1.0 (gizmo 100% = fit); linearly fade to 0
      // alpha as zoomPct drops to 0.5 (gizmo 50%); fully faded
      // below 0.5. We reuse the existing `dim_amount` uniform
      // (which the edge shader applies as an alpha multiplier);
      // the fade kicks in independent of hasFocus so wires
      // dim during idle zoom-out too. The MAX of the two dim
      // sources wins: focused-state dim and zoom-fade dim
      // never accidentally underflow.
      let wireZoomFade = 0;
      // Phase 21V (2026-05-22) — at the zoom floor the wheel reads
      // as a constellation, not as readable nodes. Toggle a body
      // class so the CSS bloom + shimmer FX activate. The ramp:
      //   zp >= 0.30 → fx OFF
      //   zp <= 0.20 → fx ON (full)
      //   in between → ON (the CSS transition handles the soft
      //                    fade-in over 0.45s)
      // We use a small hysteresis (0.25 ↔ 0.30) so the class doesn't
      // flicker right at the edge as the user grazes the threshold.
      let fxBloomActive = !!local._fxBloomActive;
      // Phase 21AH (2026-05-22) — second threshold: BELOW 15% gizmo
      // the wheel is too compressed for any single node to be
      // readable. Nodes become un-selectable AND labels are hidden
      // (CSS via body.fx-belowfifteen). The user can only enjoy
      // the bloom heartbeat. Zoom back ABOVE 17% restores
      // interactivity (small hysteresis to avoid jitter on the
      // boundary).
      let belowFifteen = !!local._fxBelowFifteen;
      if (camera && camera.state && typeof computeFitScale === 'function') {
        const fitSc = computeFitScale();
        if (fitSc > 0) {
          const zp = camera.state.scale / fitSc;
          if      (zp >= 1.0) wireZoomFade = 0;
          else if (zp <= 0.5) wireZoomFade = 1;
          else                wireZoomFade = (1.0 - zp) / 0.5;
          // Phase 22-F (2026-05-24) — push floor-FX BELOW 15%
          // entirely. At gizmo 15% the canvas should be CLEAN (no
          // blur, no bloom, no heartbeat). Bloom now enters only
          // when zoom <= 13% and exits at 15%. (Was 25%/30% — much
          // earlier — and stacked on top of belowFifteen breath.)
          if (!fxBloomActive && zp <= 0.13) fxBloomActive = true;
          else if (fxBloomActive && zp >= 0.15) fxBloomActive = false;
          // Below-15% class toggle (hysteresis 0.13 / 0.15 —
          // synced with bloom so they enter + exit together).
          if (!belowFifteen && zp <= 0.13) belowFifteen = true;
          else if (belowFifteen && zp >= 0.15) belowFifteen = false;
        }
      }
      if (fxBloomActive !== local._fxBloomActive) {
        local._fxBloomActive = fxBloomActive;
        // Phase 21AO (2026-05-23) — symmetric blur transition.
        // Zoom-OUT was already smooth because `.fx-bloom` rule has
        // animation-delay: 0.45s, giving the base-rule `transition:
        // filter` time to ramp before the keyframes start.
        // Zoom-IN was snappy because removing `.fx-bloom` mid-cycle
        // dropped the actively-animated filter back to the declared
        // base in one frame BEFORE the transition could fire — so
        // the eye saw the discontinuity between animation-current
        // and declared-base.
        // Fix: on EXIT, snapshot the current rendered filter into an
        // inline style first (which becomes the transition's "from"),
        // THEN remove .fx-bloom. The transition now ramps from the
        // captured real-rendered filter → base no-filter smoothly.
        // ~500 ms later, clear the inline style.
        if (fxBloomActive) {
          // Re-entering bloom before the exit transition completed:
          // cancel any pending inline-clear + drop the inline filter
          // so the .fx-bloom rule + animation take over cleanly.
          if (local._fxBloomExitTimer) {
            clearTimeout(local._fxBloomExitTimer);
            local._fxBloomExitTimer = 0;
          }
          if (canvas && canvas.style.filter) canvas.style.filter = '';
          document.body.classList.add('fx-bloom');
        } else {
          const cnv = canvas;  // closure capture
          if (cnv) {
            try {
              const computed = getComputedStyle(cnv).filter;
              if (computed && computed !== 'none') cnv.style.filter = computed;
            } catch (_) {}
            document.body.classList.remove('fx-bloom');
            if (local._fxBloomExitTimer) clearTimeout(local._fxBloomExitTimer);
            local._fxBloomExitTimer = setTimeout(() => {
              try { cnv.style.filter = ''; } catch (_) {}
              local._fxBloomExitTimer = 0;
            }, 500);
          } else {
            document.body.classList.remove('fx-bloom');
          }
        }
      }
      if (belowFifteen !== local._fxBelowFifteen) {
        local._fxBelowFifteen = belowFifteen;
        document.body.classList.toggle('fx-belowfifteen', belowFifteen);
      }
      const focusDim      = hasFocus ? local.params.dim_amount : 0;
      // Phase 21AI (2026-05-22) — "Show wires" toggle. When OFF
      // (body.fv-hide-wires), force dim_amount to 1.0 so the IDLE
      // wires get alpha = (1 - 1) = 0 (invisible). HOT/selected
      // wires use state=1 and read mix(1-dim, 1.0, 1) = 1.0 — they
      // stay fully visible regardless of dim_amount. So toggling
      // "wires" off hides the faint blue mesh while keeping the
      // active focus/selected wires visible. Single-line fix on
      // the existing dim path.
      const wiresHidden   = document.body.classList.contains('fv-hide-wires');
      const effectiveDim  = wiresHidden ? 1.0 : Math.max(focusDim, wireZoomFade);
      const effectiveDimN = hasFocus ? local.params.dim_amount_nodes * dimMulN : 0;
      // Phase 7 (2026-05-20) — stroke color (replaces deleted glow color).
      // Parsed once per frame; cheap.
      const strokeHex = local.params.selected_stroke_color || '#FFE9B0';
      const strokeRgb = [
        parseInt(strokeHex.slice(1, 3), 16) / 255,
        parseInt(strokeHex.slice(3, 5), 16) / 255,
        parseInt(strokeHex.slice(5, 7), 16) / 255,
      ];
      // N2 (Phase 1B) / Phase 3B F3 — gate the static node + edge
      // instance buffer writes on the dirty flags (~270 MB/s saved
      // at 10k). Phase 5C (2026-05-20) — the glyph dirty flag is
      // GONE; the glyph instance buffer is now truly static and
      // re-uploads only on rebake/mode-switch (via ensureBuffer's
      // grew path or when rebuildGlyphInstanceBuffer signals via
      // its own dirty flag below). _forgeDebug.nodeOnly() hides
      // edges + glyphs; _forgeDebug.edgesAndNodesOnly() hides glyphs.
      const nodeOnly         = !!local._nodeOnly;
      const edgesAndNodesOnly = !!local._edgesAndNodesOnly;
      const frameNVB  = local.mode.nodePacked.data;
      const frameEVB  = nodeOnly ? null : local.mode.edgePacked.data;
      const glyphsHidden = nodeOnly || edgesAndNodesOnly;
      const frameGVB = glyphsHidden ? null : (local.glyphInstanceData || null);
      local.renderer.drawFrame({
        viewportCss:           { w: vp.w, h: vp.h },
        camera:                camera.state,
        dimAmount:             effectiveDim,
        dimAmountNodes:        effectiveDimN,
        wireMinScreenPx:       local.params.wire_min_screen_px,
        wireMaxScreenPx:       local.params.wire_max_screen_px,
        // Phase 7 (2026-05-20) — SELECTED uniforms: size + stroke.
        // Glow halo deleted. Stroke is a solid ring inside the disk edge.
        selectedSizeMult:      local.params.selected_size_mult,
        selectedStrokeWidth:   local.params.selected_stroke_width,
        selectedStrokeColorRgb: strokeRgb,
        selectedStrokeAlpha:   1.0,
        // Phase 5C — glyph opacity uniforms passed alongside the
        // disk dim uniforms. Shader applies them with the same
        // dim formula the disk uses.
        //
        // Phase 6B (2026-05-20) — dim_amount_glyphs is GATED on
        // hasFocus, matching effectiveDim / effectiveDimN above.
        // In idle (no hover/lock) dim_g is 0; the glyph fragment's
        // is_active=step(0.01, dim_g) check then disables the
        // "hide on focused, dim on dim" rule so glyphs paint on
        // every node at full opacity. When focus is active, dim_g
        // is the param value (0.9) and the shader's focus rule
        // kicks in: focused/selected disks render clean (no glyph
        // wash), dim background renders the faint context glyph.
        glyphOpacity:          (typeof local.params.glyph_opacity === 'number') ? local.params.glyph_opacity : 0.85,
        dimAmountGlyphs:       hasFocus
                                 ? ((typeof local.params.dim_amount_glyphs === 'number') ? local.params.dim_amount_glyphs : 0.7)
                                 : 0,
        nodeInstances:         frameNVB,
        nodeInstancesDirty:    local.nodeInstancesDirty,
        edgeInstances:         frameEVB,
        edgeInstancesDirty:    local.edgeInstancesDirty,
        nodeStates:            local.nodeStates,
        edgeStates:            local.edgeStates,
        glyphInstances:        frameGVB,
        glyphInstancesDirty:   !!local._glyphRebuildDirty,
      });
      // After the renderer has consumed the dirty buffers, reset
      // the two remaining flags. Glyphs are static — only the
      // rebuild marks the rebuild-dirty flag.
      local.nodeInstancesDirty  = false;
      local.edgeInstancesDirty  = false;
      local._glyphRebuildDirty  = false;
      const dt = performance.now() - t0;
      const fEl = document.getElementById('forge-status-frame');
      if (fEl) fEl.textContent = dt.toFixed(1) + ' ms';
      // Labels are CSS-positioned over the canvas, so any camera
      // change also needs them re-positioned. Cheap when small;
      // skip entirely when no focus is set.
      syncLabelPositions();
      // Phase 20 (2026-05-21) — same shape for the hulls overlay.
      // syncHulls walks local.mode.hulls and rewrites SVG polygon
      // points + label coordinates from worldToScreen. Cheap
      // (~34 polygons × ~10 vertices each) and fades to opacity 0
      // at camera.scale > 3.0 so deep-zoom inspection isn't
      // cluttered.
      syncHulls();
      // Phase 20F (2026-05-21) — backdrop image follows the same
      // camera transform. Position + size + opacity recomputed
      // each tick; cheap (one DOM element).
      syncBackgroundImage();
      // Glyphs are now in the WebGPU canvas (GPU glyph pass) so
      // they project via the same view-uniform as disks/edges —
      // no per-frame DOM sync needed.

      // ─── 24-HUD (2026-05-26, removable) ────────────────────
      // Full per-frame timing — captures GPU draw + syncLabels +
      // syncHulls + syncBackgroundImage (the WHOLE per-frame cost,
      // not just the GPU portion measured by `dt` at line ~3463).
      // Rolling window of 120 frames. Exposed via window._forgeDebug
      // .frameStats() for live HUD polling.
      const fullMs = performance.now() - t0;
      if (!local._frameTimes) { local._frameTimes = []; local._frameTimesIdx = 0; }
      local._frameTimes[local._frameTimesIdx % 120] = fullMs;
      local._frameTimesIdx++;
      local._lastFullFrameMs = fullMs;
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
        // Phase 5C (2026-05-20) — per-instance alpha is now a
        // base multiplier (1.0 = no per-instance override). The
        // glyph fragment shader applies glyph_opacity uniform +
        // state-driven dim_mult on top of this. So per-instance
        // alpha is reserved for future per-node overrides; today
        // it's identity (1.0) for every instance.
        data[off + 7] = 1.0;
      }
      local.glyphInstanceData = data;
      // Signal drawFrame that the static glyph buffer needs a
      // GPU upload on the next pass (mode-switch / rebake). After
      // that single upload the buffer is stable until the next
      // rebake; no per-frame work.
      local._glyphRebuildDirty = true;
    }
    // Phase 5C (2026-05-20) — refreshGlyphAlphas DELETED.
    // The per-frame CPU loop that recomputed alpha = baseOp ×
    // (1 - state × dimMul) for every glyph instance is gone.
    // Glyph opacity is now computed in the fragment shader from
    // the same per-instance state the disk already reads, using
    // the same dim formula (uniform-driven). One opacity logic,
    // one place. No drift between disk and glyph possible.
    //
    // Removed:
    //  - The O(N) JS loop that ran every drawFrame (the slow-pan
    //    source John flagged).
    //  - The off-viewport CPU cull (WebGPU's vertex-clip handles
    //    it for free; the min-size cull was already dropped in
    //    the post-Phase-4B fix).
    //  - The glyphInstancesDirty per-frame flag (state change
    //    no longer needs to bump anything; the shader picks up
    //    the new state via nodeStateVbo automatically).
    //
    // What remains:
    //  - local.glyphInstanceData (built once per rebake) carries
    //    static fields: pos, radius, glyphIdx, tint rgb, base
    //    alpha=1.0. No per-frame mutation.
    //  - local._glyphRebuildDirty flag — set true ONLY when
    //    rebuildGlyphInstanceBuffer reallocates. Cleared after
    //    one drawFrame uploads. Mirrors nodeInstancesDirty +
    //    edgeInstancesDirty for the static-VBO upload gate.
    //
    // See AUDIT/forge-rebuild-4A-fx-2026-05-20.md §3 FX1 for
    // the original design; this supersedes it post John's
    // architectural critique.

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
    // Phase 25 (2026-05-26) — ensureLabelEl is a no-op now. Canvas
    // owns label rendering; there's no DOM element to ensure. Kept
    // as a function (returns null) so any straggler callers don't
    // crash. Old call site in syncLabels still tolerated.
    function ensureLabelEl(id) { return null; }
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
        // Phase 24C v1 (2026-05-26) — viewport cull. Pass canvas
        // dimensions so the label hierarchy can skip off-screen
        // candidates BEFORE the AABB-collision loop.
        opts.viewport = vp;
        opts.viewportMarginPx = 100;
        const idleSet = graph.computeIdleLabelVisibility(local.mode.hitNodes, camScale, opts);
        // Phase 11C (2026-05-21) — filter out HIDDEN nodes. Labels
        // shouldn't render for nodes the timeline has hidden.
        // The fastest check is the nodeTargets buffer (post-override),
        // not the YAML dates — that way the rule mirrors what the
        // shader does, and a node hidden by ANY future filter
        // (search, mode-filter, etc.) also drops its label without
        // re-coding this loop.
        const idx = local.mode.nodePacked.idIndex;
        const nt  = local.nodeTargets;
        if (nt && nt.length === idx.length * 2) {
          // Build a "hidden by target state" set in one O(N) pass.
          const hidden = new Set();
          for (let i = 0; i < idx.length; i++) {
            if (nt[i * 2] >= 1.5) hidden.add(idx[i]);
          }
          for (const id of idleSet) if (!hidden.has(id)) visible.add(id);
        } else {
          for (const id of idleSet) visible.add(id);
        }
      }

      // Phase 25 (2026-05-26) — DOM diff REMOVED. Canvas owns label
      // rendering, so there are no per-label `data-visible` attribute
      // writes to make. Just update the visible Set (read by
      // renderLabelsCanvas in the per-frame paint) and trigger a
      // canvas redraw. ~80 lines of DOM manipulation collapsed to
      // 2 lines. The cost was already small post-throttle, but
      // the COMPOSITOR cost of those data-visible flips (each one
      // triggered Safari to re-validate the label's layer) was
      // non-trivial. Canvas eliminates it entirely.
      local.visibleLabelEls = visible;
      renderLabelsCanvas();
    }
    // Idle-label visibility depends on camera scale; positions
    // depend on scale + pan. We only need to RECOMPUTE the
    // visibility set when scale crosses a tier threshold, but
    // it's cheap (1 ms at 663 nodes) so we just rAF-debounce.
    //
    // SAFARI-WORKAROUND (2026-05-26): the original "rAF-debounce"
    // comment was wrong about cost. syncLabels walks all 682 hit
    // nodes through tier-thresholds + AABB collision + DOM diff
    // every camera change. Original comment said 1ms; actual cost
    // in Safari with 200+ visible labels is 5-15ms. Firing this
    // on EVERY pan tick stole frame budget that the user perceived
    // as "gag" during pan + hover-release. Throttled to 100ms
    // (10Hz) instead of rAF-coalesce (60Hz). Pan stays smooth;
    // labels update at 10Hz which is still imperceptibly live —
    // syncLabelPositions still runs at 60fps inside drawFrame so
    // already-visible labels track the camera continuously. Only
    // the SET membership update is throttled.
    function scheduleIdleLabelSync() {
      if (local.idleLabelRaf) return;
      local.idleLabelRaf = setTimeout(() => {
        local.idleLabelRaf = 0;
        if (local.destroyed) return;
        syncLabels();
      }, 100);
    }
    // ════════════════════════════════════════════════════════════
    //  Hulls overlay  —  Phase 20 (2026-05-21)
    // ════════════════════════════════════════════════════════════
    //  Family-level convex hulls + centroid titles drawn as an SVG
    //  overlay above the canvas. Polygon vertices are in WORLD
    //  space (computed once per mode rebuild in `local.mode.hulls`).
    //  On every camera change, `syncHulls()` walks the hull list
    //  and rewrites the SVG `points` + label transform from
    //  world→screen.
    //
    //  Fade rule: hulls fade out at deep zoom (camera.scale > 2.0)
    //  so they don't crowd individual-node inspection.
    // ════════════════════════════════════════════════════════════
    const SVG_NS = 'http://www.w3.org/2000/svg';
    // ── Hull SVG structure (Phase 20B, 2026-05-21) ──────────
    //   <svg class="forge-hulls-overlay">
    //     <defs id="forge-hull-defs">                 ← gradients per divider
    //     <g    id="forge-hull-polys">                ← per-family convex polys
    //     <g    id="forge-hull-dividers">             ← radial separator lines
    //     <g    id="forge-hull-labels">               ← family titles
    //
    // Z-order inside the SVG: polys (faintest) → dividers → labels
    // so labels paint above everything else.
    let hullDefs, hullPolysG, hullDividersG, hullLabelsG, hullGuideRingsG;
    function ensureHullStructure() {
      if (hullDefs) return;
      hullDefs       = document.createElementNS(SVG_NS, 'defs');
      hullDefs.setAttribute('id', 'forge-hull-defs');
      hullPolysG     = document.createElementNS(SVG_NS, 'g');
      hullPolysG.setAttribute('id', 'forge-hull-polys');
      hullDividersG  = document.createElementNS(SVG_NS, 'g');
      hullDividersG.setAttribute('id', 'forge-hull-dividers');
      // Phase 21AI (2026-05-22) — three concentric guide circles:
      // inner-rim, mid-hull, outer-rim. Hidden by default via
      // body.fv-hide-guide-rings. Same colour as the dividers but
      // a uniform 50% stroke-opacity (no gradient needed — a closed
      // ring doesn't have endpoints to fade between).
      hullGuideRingsG = document.createElementNS(SVG_NS, 'g');
      hullGuideRingsG.setAttribute('id', 'forge-hull-guide-rings');
      hullLabelsG    = document.createElementNS(SVG_NS, 'g');
      hullLabelsG.setAttribute('id', 'forge-hull-labels');
      hullsOverlay.appendChild(hullDefs);
      hullsOverlay.appendChild(hullPolysG);
      hullsOverlay.appendChild(hullDividersG);
      hullsOverlay.appendChild(hullGuideRingsG);
      hullsOverlay.appendChild(hullLabelsG);
    }
    // Phase 21AI (2026-05-22) — guide rings (inner / mid / outer).
    // Three SVG circles, same family colour as the dividers, fixed
    // 50% stroke-opacity. Created once; r updated each syncHulls
    // call based on pieInnerPx / pieOuterPx. Visibility gated by
    // body.fv-hide-guide-rings (CSS).
    function ensureGuideRings() {
      if (!hullGuideRingsG) return;
      if (hullGuideRingsG.children.length >= 3) return;
      hullGuideRingsG.innerHTML = '';
      const labels = ['inner', 'mid', 'outer'];
      for (const role of labels) {
        const c = document.createElementNS(SVG_NS, 'circle');
        // Phase 21AJ — stroke + opacity + width all driven by CSS
        // vars on body.view-forge so the Style panel can mutate
        // them live. See .forge-hull-guide-ring in app.css.
        c.setAttribute('class', 'forge-hull-guide-ring');
        c.setAttribute('data-ring', role);
        hullGuideRingsG.appendChild(c);
      }
    }
    function rebuildHullElements() {
      ensureHullStructure();
      ensureGuideRings();
      const data = (local.mode && local.mode.hullData) || { hulls: [], dividers: [] };
      // ── Clear existing children
      hullDefs.innerHTML = '';
      hullPolysG.innerHTML = '';
      hullDividersG.innerHTML = '';
      hullLabelsG.innerHTML = '';
      // ── One pie-slice path + one label per family
      // Phase 20E (2026-05-21) — was a <polygon> set from the
      // convex hull of placed deity positions, which gave
      // STRAIGHT polygon edges that didn't match the radial
      // dividers. Now a <path> drawn as a true annular sector
      // (curved outer/inner arcs + radial sides) using the
      // wedge's exact a0 / a1 bounds — so the family zone is
      // a pie-chart slice that ALIGNS with the divider lines
      // by construction.
      for (let i = 0; i < data.hulls.length; i++) {
        const h = data.hulls[i];
        const polyG = document.createElementNS(SVG_NS, 'g');
        polyG.setAttribute('class', 'forge-hull');
        polyG.setAttribute('data-family', h.family);
        polyG.style.setProperty('--family-color', h.color);
        const poly = document.createElementNS(SVG_NS, 'path');
        poly.setAttribute('class', 'forge-hull-poly');
        polyG.appendChild(poly);
        hullPolysG.appendChild(polyG);

        const lblG = document.createElementNS(SVG_NS, 'g');
        lblG.setAttribute('class', 'forge-hull-label-g');
        lblG.style.setProperty('--family-color', h.color);
        const label = document.createElementNS(SVG_NS, 'text');
        label.setAttribute('class', 'forge-hull-label');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'middle');
        label.textContent = h.family;
        lblG.appendChild(label);
        hullLabelsG.appendChild(lblG);
      }
      // ── One gradient + one line per divider. The gradient uses
      // userSpaceOnUse so its endpoints align with the line's
      // endpoints; we update both per camera change.
      for (let i = 0; i < data.dividers.length; i++) {
        const grad = document.createElementNS(SVG_NS, 'linearGradient');
        grad.setAttribute('id', 'forge-hull-divgrad-' + i);
        grad.setAttribute('gradientUnits', 'userSpaceOnUse');
        // Phase 21AI (2026-05-22) — gradient stops vary by divider
        // mode. 0% = the (x1,y1) end of the line, 100% = (x2,y2).
        // In 'short' mode the line spans the hull band only and
        // both ends should fade. In 'long' and 'long-centered'
        // the line goes from CENTER (x1,y1=centerScreen + r=4)
        // to the FAR EDGE (x2,y2 at pieOuterPx + 500). Mode rules:
        //   short          — fade both ends (centre 60% opaque)
        //   long           — fade both ends (centre 60% opaque)
        //   long-centered  — solid at centre, fades outward over
        //                    the second half. ~50% point sits near
        //                    the hull band mid-line; opacity is 1.0
        //                    at 0% (centre) and 0 at 100% (far).
        const mode = local._dividerMode || 'short';
        let stopColors;
        if (mode === 'long-centered') {
          // Phase 21AL (2026-05-23) — colors AND opacities read
          // from Style panel vars. Per-end controls let John tune
          // center alone vs outer alone. The interior mid-stops
          // interpolate via opacity multiplication so the smooth
          // fade preserved.
          stopColors = [
            ['0%',   'stop-color:var(--style-conv-center-color,#6f8aaf);stop-opacity:var(--style-conv-center-opacity,1.0)'],
            ['30%',  'stop-color:var(--style-conv-center-color,#6f8aaf);stop-opacity:calc(var(--style-conv-center-opacity,1.0) * 0.85)'],
            ['55%',  'stop-color:var(--style-conv-edge-color,#6f8aaf);stop-opacity:calc(var(--style-conv-edge-opacity,0.0) + (var(--style-conv-center-opacity,1.0) - var(--style-conv-edge-opacity,0.0)) * 0.45)'],
            ['100%', 'stop-color:var(--style-conv-edge-color,#6f8aaf);stop-opacity:var(--style-conv-edge-opacity,0.0)'],
          ];
        } else {
          stopColors = [
            ['0%',   'stop-color:#6f8aaf;stop-opacity:0'],
            ['20%',  'stop-color:#6f8aaf;stop-opacity:0.55'],
            ['80%',  'stop-color:#6f8aaf;stop-opacity:0.55'],
            ['100%', 'stop-color:#6f8aaf;stop-opacity:0'],
          ];
        }
        for (const [off, style] of stopColors) {
          const s = document.createElementNS(SVG_NS, 'stop');
          s.setAttribute('offset', off);
          s.setAttribute('style', style);
          grad.appendChild(s);
        }
        hullDefs.appendChild(grad);
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('class', 'forge-hull-divider');
        line.setAttribute('stroke', 'url(#forge-hull-divgrad-' + i + ')');
        hullDividersG.appendChild(line);
      }
    }
    function syncHulls() {
      const vp = local.lastSize;
      if (!vp.w || !vp.h) return;
      const data = (local.mode && local.mode.hullData);
      if (!data || !data.hulls || !data.hulls.length) return;
      // SAFARI-WORKAROUND (2026-05-26): viewBox/width/height only change
      // on viewport RESIZE, not on camera pan/zoom. Writing them every
      // frame forces Safari to re-validate the SVG root layer each tick
      // (Safari's SVG compositor is ~3× slower than Blink's). Cache and
      // skip the writes when unchanged. Blink doesn't need this but it
      // also doesn't suffer from it. See memory:
      // feedback_safari_is_the_truth_2026-05-26.
      if (local._hullsLastVpW !== vp.w || local._hullsLastVpH !== vp.h) {
        hullsOverlay.setAttribute('viewBox', '0 0 ' + vp.w + ' ' + vp.h);
        hullsOverlay.setAttribute('width',  vp.w);
        hullsOverlay.setAttribute('height', vp.h);
        local._hullsLastVpW = vp.w;
        local._hullsLastVpH = vp.h;
      }
      const camScale = camera.state.scale;
      // Phase 20K (2026-05-21) — hull fade now matches the
      // family-label fade so the WHOLE family-zone overlay
      // (pie slices + dividers + labels) breathes together as
      // the user zooms in / out.
      //   • Low-zoom fade (zoom-out): opacity 1 at gizmo ≥ 50%,
      //     0 at gizmo ≤ 25%. Same range as the label fade.
      //   • Deep-zoom fade (zoom-in):  opacity 1 at scale ≤ 2.0,
      //     0 at scale ≥ 3.0 (so deep-zoom inspection of an
      //     individual deity isn't crowded by overlay chrome).
      // The two ramps combine via min() — overlay fades when
      // either extreme is hit. The hullLabelsG no longer gets
      // its own opacity (the WHOLE overlay carries the fade).
      const hullFitScale = computeFitScale();
      const hullZoomPct  = (hullFitScale > 0) ? (camScale / hullFitScale) : 1;
      let lowZoomFade;
      if      (hullZoomPct >= 0.50) lowZoomFade = 1;
      else if (hullZoomPct <= 0.25) lowZoomFade = 0;
      else                          lowZoomFade = (hullZoomPct - 0.25) / 0.25;
      let deepZoomFade;
      if      (camScale <= 2.0) deepZoomFade = 1;
      else if (camScale >= 3.0) deepZoomFade = 0;
      else                      deepZoomFade = (3.0 - camScale);
      let fade = Math.min(lowZoomFade, deepZoomFade);
      // Phase 22-M (2026-05-24) — timeline owns hull fade (15→11
      // gizmo ramp, matching bands). The wheel's 50→25 curve would
      // overwrite the timeline-chrome opacity write every frame
      // otherwise. Skip the assignment + the early-return when the
      // timeline layout is active.
      if (local.layoutId === 'timeline') {
        // Don't write opacity — chrome owns it. But still keep
        // building the geometry so toggles + camera changes apply.
        fade = 1.0;
      } else {
        hullsOverlay.style.opacity = fade.toFixed(3);
      }
      if (fade <= 0.001) return;

      // Outer-ring radius in WORLD units + screen units.
      const outerWorld = data.outerRadius || 0;
      const innerWorld = data.innerRadius || 0;
      const centerWorld = data.center || { x: 0, y: 0 };
      const centerScreen = camera.worldToScreen(centerWorld.x, centerWorld.y, vp);
      // Screen-radius for the outer ring (use one node along +x to
      // measure the scale — robust to any view aspect / pan).
      const ringEdgeScreen = camera.worldToScreen(centerWorld.x + outerWorld, centerWorld.y, vp);
      const ringPxRadius = Math.hypot(ringEdgeScreen.x - centerScreen.x, ringEdgeScreen.y - centerScreen.y);
      const innerEdgeScreen = camera.worldToScreen(centerWorld.x + innerWorld, centerWorld.y, vp);
      const innerPxRadius = Math.hypot(innerEdgeScreen.x - centerScreen.x, innerEdgeScreen.y - centerScreen.y);
      // Phase 20H (2026-05-21) — pie-slice radial padding. The
      // padding is SPLIT into two parts so the breathing room is
      // visually obvious:
      //   • DISK_CONTAIN_PAD covers the disk radius itself (so the
      //     disk EDGES, not just centres, fit inside the arc).
      //   • DISK_BREATHE_PAD is the visible buffer between disk
      //     edge and slice arc — needs to read clearly at default
      //     zoom, so we set it generously.
      // Total = 28 px outward from ringPxRadius; same inward from
      // innerPxRadius. Dividers + family labels use these padded
      // radii so the whole overlay shares one outer/inner boundary.
      const DISK_CONTAIN_PAD = 10;
      const DISK_BREATHE_PAD = 18;
      const DISK_FIT_PAD     = DISK_CONTAIN_PAD + DISK_BREATHE_PAD;
      const pieOuterPx = ringPxRadius + DISK_FIT_PAD;
      const pieInnerPx = Math.max(0, innerPxRadius - DISK_FIT_PAD);

      // ── Pie-slice paths (one annular sector per family).
      // Outer arc at ringPxRadius (the data-driven outer rim),
      // inner arc at innerPxRadius. Angular extent = wedge
      // [a0, a1]. The wedges are contiguous (gap is between
      // adjacent wedges' a1 / a0), so adjacent pie slices share
      // a tiny gap where the divider line lives.
      const polyGroups = hullPolysG.children;
      for (let i = 0; i < data.hulls.length && i < polyGroups.length; i++) {
        const h = data.hulls[i];
        const polyEl = polyGroups[i].firstChild;
        let d;
        if (h.a0 != null && h.a1 != null) {
          // Annular sector path.
          //   M (a0, rIn) → L (a0, rOut) → A outer-arc to (a1, rOut)
          //   → L (a1, rIn) → A inner-arc back to (a0, rIn) → Z
          const a0 = h.a0, a1 = h.a1;
          const cx = centerScreen.x, cy = centerScreen.y;
          const rIn  = pieInnerPx;
          const rOut = pieOuterPx;
          const x0 = cx + Math.cos(a0) * rIn;
          const y0 = cy + Math.sin(a0) * rIn;
          const x1 = cx + Math.cos(a0) * rOut;
          const y1 = cy + Math.sin(a0) * rOut;
          const x2 = cx + Math.cos(a1) * rOut;
          const y2 = cy + Math.sin(a1) * rOut;
          const x3 = cx + Math.cos(a1) * rIn;
          const y3 = cy + Math.sin(a1) * rIn;
          let delta = a1 - a0;
          while (delta < 0)            delta += 2 * Math.PI;
          while (delta >= 2 * Math.PI) delta -= 2 * Math.PI;
          const largeArc = delta > Math.PI ? 1 : 0;
          // SVG y-axis is flipped vs math, so a math-CCW arc
          // reads as CW in SVG → sweep-flag 1 for the outer arc
          // (going a0→a1 forwards), sweep-flag 0 for the inner
          // arc (returning a1→a0).
          d = 'M ' + x0.toFixed(1) + ',' + y0.toFixed(1)
            + ' L ' + x1.toFixed(1) + ',' + y1.toFixed(1)
            + ' A ' + rOut.toFixed(1) + ',' + rOut.toFixed(1) + ' 0 ' + largeArc + ' 1 ' + x2.toFixed(1) + ',' + y2.toFixed(1)
            + ' L ' + x3.toFixed(1) + ',' + y3.toFixed(1)
            + ' A ' + rIn.toFixed(1)  + ',' + rIn.toFixed(1)  + ' 0 ' + largeArc + ' 0 ' + x0.toFixed(1) + ',' + y0.toFixed(1)
            + ' Z';
        } else {
          // Fallback — convex-hull polygon as before.
          let pts = '';
          for (let j = 0; j < h.polygon.length; j++) {
            const s = camera.worldToScreen(h.polygon[j].x, h.polygon[j].y, vp);
            pts += (j ? ' L ' : 'M ') + s.x.toFixed(1) + ',' + s.y.toFixed(1);
          }
          d = pts + ' Z';
        }
        // SAFARI-WORKAROUND (2026-05-26): skip setAttribute when the
        // computed `d` matches what we already wrote. Safari pays per
        // setAttribute even when value is identical (re-validates +
        // marks layer dirty). Per-hull cache hit during pure pan/zoom
        // is common when the rounded floats (toFixed 1) don't change.
        if (polyEl._lastD !== d) {
          polyEl.setAttribute('d', d);
          polyEl._lastD = d;
        }
      }

      // ── Family labels: angle = wedge centre, radius = outer+pad.
      // Labels sit OUTSIDE the wheel rim, NEVER inside the cluttered
      // node cloud. Phase 20E (2026-05-21) — was h.centroidAngle
      // (computed from drifted member positions); now h.wedgeCenter
      // (the wedge's canonical centre angle) so labels sit DIRECTLY
      // above their pie slice.
      //
      // Phase 20F (2026-05-21) — labels also fade by zoom: full
      // opacity at scale ≥ 0.50, fully invisible at scale ≤ 0.25.
      // Labels sit OUTSIDE the padded pie-slice outer arc so they
      // never overlap the slice fill or its outer boundary.
      // Phase 20K (2026-05-21) — per-label-group opacity REMOVED.
      // The whole hullsOverlay carries the zoom fade now (see
      // the lowZoomFade / deepZoomFade block above), so labels
      // breathe together with the pie slices + dividers as a
      // single overlay layer. Setting this explicitly to 1 in
      // case any prior frame stamped a lower value.
      // Phase 21R (2026-05-22) — labels shifted further outward
      // (was 24). Decouples the title band from the dividers so
      // they read clearly when both are visible.
      const LABEL_OUTSIDE_PAD = 44;
      hullLabelsG.style.opacity = '1';
      const labelGroups = hullLabelsG.children;
      for (let i = 0; i < data.hulls.length && i < labelGroups.length; i++) {
        const h = data.hulls[i];
        const a = (h.wedgeCenter != null) ? h.wedgeCenter : h.centroidAngle;
        const rPx = pieOuterPx + LABEL_OUTSIDE_PAD;
        const lx = centerScreen.x + Math.cos(a) * rPx;
        const ly = centerScreen.y + Math.sin(a) * rPx;
        const labelEl = labelGroups[i].firstChild;
        // SAFARI-WORKAROUND (2026-05-26): skip no-op x/y writes.
        const lxStr = lx.toFixed(1);
        const lyStr = ly.toFixed(1);
        if (labelEl._lastX !== lxStr) { labelEl.setAttribute('x', lxStr); labelEl._lastX = lxStr; }
        if (labelEl._lastY !== lyStr) { labelEl.setAttribute('y', lyStr); labelEl._lastY = lyStr; }
      }

      // ── Radial separators between adjacent families.
      // Each line is PERFECTLY RADIAL from the wheel centre at
      // its wedge-boundary angle (Phase 20D-4 — was previously
      // a centroid bisector that could drift off the boundary
      // after relaxation).
      //
      // Length: from (inner − INNER_OVERSHOOT) to (outer +
      // OUTER_OVERSHOOT). Phase 20D-4 reduced OUTER_OVERSHOOT
      // from 50 px to 8 px so the line ends just past the outer
      // node ring instead of intruding into the family-label
      // band at +28 px. Inner overshoot stays at 50 px so the
      // line still reads through the centre void.
      // Phase 20G (2026-05-21) — dividers now share the SAME
      // outer + inner radii as the pie-slice arcs (pieOuterPx /
      // pieInnerPx). The line is the wedge boundary between two
      // slices, so it should start exactly at the slice inner
      // arc and end exactly at the slice outer arc — no
      // overshoot past either, no gap.
      // Phase 21AI (2026-05-22) — position guide rings. inner = a
      // bit INSIDE the inner hull boundary (so it traces the
      // innermost-node arc without overlapping the hull line);
      // outer = a bit OUTSIDE the outer hull boundary; mid =
      // midpoint between the two. Visibility is CSS-driven via
      // body.fv-hide-guide-rings.
      if (hullGuideRingsG) {
        const RING_INSET = 10;     // pull-in from the hull boundary
        const rInner  = Math.max(0, pieInnerPx + RING_INSET);
        const rOuter  = pieOuterPx - RING_INSET;
        const rMid    = (rInner + rOuter) / 2;
        const radii   = { inner: rInner, mid: rMid, outer: rOuter };
        for (let i = 0; i < hullGuideRingsG.children.length; i++) {
          const c = hullGuideRingsG.children[i];
          const role = c.getAttribute('data-ring');
          const r = radii[role];
          if (r == null) continue;
          // SAFARI-WORKAROUND (2026-05-26): skip no-op writes.
          const cxStr = centerScreen.x.toFixed(1);
          const cyStr = centerScreen.y.toFixed(1);
          const rStr  = Math.max(0, r).toFixed(1);
          if (c._lastCx !== cxStr) { c.setAttribute('cx', cxStr); c._lastCx = cxStr; }
          if (c._lastCy !== cyStr) { c.setAttribute('cy', cyStr); c._lastCy = cyStr; }
          if (c._lastR  !== rStr)  { c.setAttribute('r',  rStr);  c._lastR  = rStr;  }
        }
      }

      // Phase 21AH (2026-05-22) — divider geometry depends on mode:
      //   • 'short' (default) — line spans the hull band only, from
      //     pieInnerPx (− small inner-overshoot) to pieOuterPx.
      //   • 'long'  — radial spokes from the centre all the way out
      //     past the hull rim by ~500 px. Reads as "this slice
      //     reaches from the heart of the wheel into the distance."
      //   • 'off'   — the hullDividersG group is `display:none` via
      //     body.fv-hide-dividers, so we still write geometry but
      //     nothing renders.
      const INNER_EXTRA       = 30;     // short-mode inner overshoot
      const LONG_OUTER_EXTRA  = 500;    // long-mode outer extension (px)
      const LONG_INNER_RADIUS = 4;      // pull-in from exact (0,0) to avoid AA
      const mode = local._dividerMode || 'short';
      // Phase 21AK — only 'long-centered' uses the long geometry now
      // (the long-faded mode was removed). 'short' / 'off' use the
      // hull-band geometry.
      const isLongMode = (mode === 'long-centered');
      const lines = hullDividersG.children;
      for (let i = 0; i < data.dividers.length && i < lines.length; i++) {
        const d = data.dividers[i];
        const a = d.angle;
        let r0, r1;
        if (isLongMode) {
          r0 = LONG_INNER_RADIUS;
          r1 = pieOuterPx + LONG_OUTER_EXTRA;
        } else {
          r0 = Math.max(0, pieInnerPx - INNER_EXTRA);
          r1 = pieOuterPx;
        }
        const x1 = centerScreen.x + Math.cos(a) * r0;
        const y1 = centerScreen.y + Math.sin(a) * r0;
        const x2 = centerScreen.x + Math.cos(a) * r1;
        const y2 = centerScreen.y + Math.sin(a) * r1;
        const line = lines[i];
        // SAFARI-WORKAROUND (2026-05-26): skip no-op coord writes.
        const x1s = x1.toFixed(1), y1s = y1.toFixed(1);
        const x2s = x2.toFixed(1), y2s = y2.toFixed(1);
        if (line._lastX1 !== x1s) { line.setAttribute('x1', x1s); line._lastX1 = x1s; }
        if (line._lastY1 !== y1s) { line.setAttribute('y1', y1s); line._lastY1 = y1s; }
        if (line._lastX2 !== x2s) { line.setAttribute('x2', x2s); line._lastX2 = x2s; }
        if (line._lastY2 !== y2s) { line.setAttribute('y2', y2s); line._lastY2 = y2s; }
        const grad = document.getElementById('forge-hull-divgrad-' + i);
        if (grad) {
          if (grad._lastX1 !== x1s) { grad.setAttribute('x1', x1s); grad._lastX1 = x1s; }
          if (grad._lastY1 !== y1s) { grad.setAttribute('y1', y1s); grad._lastY1 = y1s; }
          if (grad._lastX2 !== x2s) { grad.setAttribute('x2', x2s); grad._lastX2 = x2s; }
          if (grad._lastY2 !== y2s) { grad.setAttribute('y2', y2s); grad._lastY2 = y2s; }
        }
      }
    }

    // ════════════════════════════════════════════════════════════
    //  Backdrop image  —  Phase 20I (2026-05-21)
    // ════════════════════════════════════════════════════════════
    //  A star-field / nebula image anchored at the wheel's WORLD
    //  centre. Fades in + scales based on the ZOOM PERCENTAGE
    //  shown in the zoom-gizmo (`camera.state.scale / fit_scale`),
    //  NOT raw camera scale. The zoom-gizmo "100%" = fit, "50%" =
    //  half-fit, "7%" = max-zoom-out — those are the numbers John
    //  designs against. Comparing raw camera.state.scale to 0.50,
    //  0.25, 0.10 was wrong in Phase 20F/G/H (the same numeric
    //  value means very different zoom levels depending on the
    //  current viewport's fit-scale).
    //
    //  IMPLEMENTATION
    //  - zoomPct = camera.state.scale / computeFitScale()
    //  - Image side = max(vp.w, vp.h) at zoomPct = 0.10 (so the
    //    LARGER viewport axis is matched edge-to-edge, the
    //    smaller axis overflows + crops — proper "cover" fit
    //    against the larger window dimension as John asked).
    //  - At higher zoomPct the image grows proportionally and
    //    extends well past the viewport (the user is "inside" it).
    //  - Opacity = linear interpolation between zoomPct 0.50 (0)
    //    and 0.10 (1).
    // ════════════════════════════════════════════════════════════
    // Phase 21N (2026-05-21) — BG world size tuned so the image
    // EXACTLY covers the viewport at gizmo 11% (which we also
    // make the camera floor — see FLOOR_PCT below). On a 16:9
    // monitor, BG ≈ vp.larger at floor — no oversized halo,
    // no gap. Full reference:
    // AUDIT/forge-zoom-world-system-2026-05-21.md
    const BG_WORLD_WIDTH = 18000; // wu

    // ════════════════════════════════════════════════════════════
    //  BG SIZING + OPACITY RULES — CANONICAL (Phase 22-W, 2026-05-24)
    // ════════════════════════════════════════════════════════════
    //  Future agents: DO NOT modify these without an explicit John
    //  greenlight (he's been burned multiple times by well-meaning
    //  refactors that broke one layout while fixing the other).
    //
    //  WHEEL layout BG sizing (unchanged since Phase 21AJ):
    //    widthPx = max(BG_WORLD_WIDTH × camera.scale, cover)
    //    cover    = max(vp.w, vp.h × imgAspect)
    //    World-scaled with viewport-cover floor.
    //
    //  TIMELINE layout BG sizing (Phase 22-W, John's literal spec):
    //    widthPx = cover × max(1, gizmo% / FLOOR_PCT)
    //    At gizmo 10% (= FLOOR_PCT): BG = cover (fills viewport)
    //    Every tenth of a percent above 10%: BG grows linearly.
    //    No flat zone, no "stops growing" lock. EVER.
    //
    //  OPACITY ramp (BOTH layouts, John 2026-05-24):
    //    gizmo ≥ 30%:  opacity 0   (invisible — wheel/timeline is hero)
    //    15% ≤ gizmo < 30%:  linear fade 100→0%
    //    gizmo ≤ 15%:  opacity 1   (full)
    //    Was 10% / 50% — tightened to 15% / 30% per John's spec.
    //
    //  VERTICAL anchor for TIMELINE (Phase 22-P):
    //    dy = 0 when timeline — BG vertical-locks to viewport
    //    center so panning through the tall band stack doesn't
    //    move the BG off-screen vertically. Horizontal dx still
    //    follows world-X.
    // ════════════════════════════════════════════════════════════
    function syncBackgroundImage() {
      if (!bgImage) return;
      if (!camera || !camera.state) return;
      const vp = local.lastSize;
      if (!vp || !vp.w || !vp.h) return;
      const fitScale = computeFitScale();
      if (!fitScale || fitScale <= 0) return;

      const zoomPct = camera.state.scale / fitScale;
      // Phase 22-X (2026-05-24) — Opacity ramp: 15% / 30%.
      // John's literal spec: full opacity at gizmo 15% (and below
      // to floor 10%), 0% by gizmo 30%, linear between.
      let bgFade;
      if      (zoomPct >= 0.30) bgFade = 0;
      else if (zoomPct <= 0.15) bgFade = 1;
      else                      bgFade = (0.30 - zoomPct) / (0.30 - 0.15);
      bgImage.style.opacity = bgFade.toFixed(3);

      // ── BG WORLD-OBJECT TRANSFORM (Phase 21AJ, 2026-05-22) ────
      // World-scaled by default, with a VIEWPORT-COVER FLOOR so
      // the BG never shrinks smaller than the viewport. John bug:
      // at the very last percentage of zoom-out, the BG was
      // visibly cropping/leaving margins because pure world-
      // scaling at floor scale (e.g. 18000 × 0.077 ≈ 1390 px on a
      // 1920 px screen) is smaller than the larger viewport axis.
      //
      // The Phase 21H vp×1.5 floor was the right idea but its
      // 1.5× factor pegged too early (around gizmo 15%). New
      // rule: minimum width is exactly viewport-cover (= max of
      // vp.w and vp.h × imgAspect), no padding margin. As soon
      // as world-scaled exceeds cover, world-scaled wins (smooth
      // transition because both expressions are continuous and
      // they meet at the threshold).
      const imgAspect    = bgImage._bgAspect || (4 / 3);
      // Phase 22-W (2026-05-24) — TIMELINE BG: linear growth from
      // cover at gizmo 10%. John's spec, explicitly:
      //   gizmo 10.0% → BG = cover (fills viewport exactly)
      //   gizmo 10.1% → BG slightly bigger
      //   gizmo 10.x% → BG keeps growing every tenth of a percent
      //   …all the way up.
      // No flat zone, no "stops growing at 22%". The BG is
      // anchored at viewport-cover at the zoom floor + scales
      // linearly with gizmo above it.
      //
      //   ratio   = gizmo / floor   → 1.0 at the floor, grows above
      //   widthPx = coverPx × ratio (clamped to ≥ coverPx)
      // Wheel branch untouched.
      const coverWidthPx = Math.max(vp.w, vp.h * imgAspect);
      let widthPx;
      if (local.layoutId === 'timeline') {
        const ratio = Math.max(1, zoomPct / FLOOR_PCT);   // 1.0 at floor (10%), grows
        widthPx = coverWidthPx * ratio;
      } else {
        const worldWidthPx = BG_WORLD_WIDTH * camera.state.scale;
        widthPx = Math.max(worldWidthPx, coverWidthPx);
      }
      const heightPx = widthPx / imgAspect;
      // World (0, 0) → canvas-screen → viewport-screen.
      const centerCanvas = camera.worldToScreen(0, 0, vp);
      let offX = 0, offY = 0;
      if (canvas && canvas.getBoundingClientRect) {
        const r = canvas.getBoundingClientRect();
        offX = r.left;
        offY = r.top;
      }
      const wheelVpX = offX + centerCanvas.x;
      const wheelVpY = offY + centerCanvas.y;
      const vpCenterX = window.innerWidth  / 2;
      const vpCenterY = window.innerHeight / 2;
      const dx = wheelVpX - vpCenterX;
      let   dy = wheelVpY - vpCenterY;

      // Phase 22-P (2026-05-24) — TIMELINE BG vertical-lock.
      // The timeline's world is anisotropic + tall (5060 wu vs
      // wheel's ~2200) so as the user pans vertically through
      // the band stack, the world-origin (where BG is anchored)
      // moves off-screen and the BG disappears below the dots —
      // John's "dramatically cropped" report. Fix: in timeline
      // mode, the BG stays vertically centered on the viewport
      // (dy = 0). Horizontal pan still follows world X (dx)
      // because the spine IS the canonical X axis.
      // Wheel mode keeps the full world-tracking behavior — its
      // small square world stays inside the BG envelope anyway.
      if (local.layoutId === 'timeline') {
        dy = 0;
      }

      // Phase 24-PRIMITIVE-FIX (2026-05-26) — was per-frame
      // style.width + style.height writes, both of which trigger
      // browser LAYOUT every camera tick. Replaced with a fixed
      // CSS base-size set ONCE at first call + a per-frame scale()
      // baked into the transform string. Scale runs on the GPU
      // compositor thread — zero layout cost. Same final pixel
      // size for the user, different mechanism.
      if (!local._bgImageBaseSize) {
        // Pick a stable base size that gives near-1.0 scale at the
        // typical zoom range so font/image quality stays crisp.
        // Use the initial cover width — at the floor zoom it's
        // exactly 1× scale. As the user zooms, scale grows above
        // 1.0 (browsers handle 1-3× scale-ups well).
        bgImage.style.width  = coverWidthPx.toFixed(1) + 'px';
        bgImage.style.height = (coverWidthPx / imgAspect).toFixed(1) + 'px';
        local._bgImageBaseSize = coverWidthPx;
      }
      const bgScale = widthPx / local._bgImageBaseSize;
      bgImage.style.transform =
        'translate(-50%, -50%) ' +
        'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) ' +
        'scale(' + bgScale.toFixed(4) + ')';
      // Phase 21AL — soundtrack volume rides the same per-frame
      // zoom curve as the BG opacity.
      syncSoundtrack();
    }

    // Phase 21AL (2026-05-23) — soundtrack volume tracks the same
    // zoomPct curve as the BG opacity:
    //   zoomPct >= 0.50 → volume 0  (focused on a node, quiet)
    //   zoomPct <= 0.10 → volume MAX (immersive at the floor)
    //   linear between
    // Cap at 0.6 so the soundtrack stays atmospheric, not loud.
    // Forced to 0 when the SFX toggle is off (local._sfxEnabled).
    const SFX_MAX_VOLUME = 0.6;
    function syncSoundtrack() {
      const audio = local._bgAudio;
      if (!audio) return;
      const fitScale = (typeof computeFitScale === 'function') ? computeFitScale() : 0;
      if (!fitScale || fitScale <= 0) return;
      const zoomPct = camera.state.scale / fitScale;
      let target;
      if      (!local._sfxEnabled)  target = 0;
      else if (zoomPct >= 0.50)     target = 0;
      else if (zoomPct <= 0.10)     target = SFX_MAX_VOLUME;
      else                          target = SFX_MAX_VOLUME * (0.50 - zoomPct) / (0.50 - 0.10);
      // Smooth ramp — single-pole low-pass at ~0.05 per call so
      // the volume slides instead of stepping.
      const cur = audio.volume;
      const next = cur + (target - cur) * 0.18;
      audio.volume = Math.max(0, Math.min(1, next));
      // If we somehow paused (autoplay never kicked) and the user
      // is interacting at floor zoom, try a play() — harmless if
      // already playing.
      if (target > 0 && audio.paused) {
        try { audio.play().catch(() => {}); } catch (_) {}
      }
    }

    // Phase 25 (2026-05-26) — syncLabelPositions is now a thin
    // alias for renderLabelsCanvas. The function name is kept so
    // existing call sites (camera.onChange, drawFrame, scheduleIdle-
    // LabelSync, etc.) continue to work unchanged.
    function syncLabelPositions() { renderLabelsCanvas(); }

    // ─── Phase 25 (2026-05-26) — CANVAS LABEL RENDERER ────────
    // Replaces the DOM label layer with a single 2D-canvas paint
    // pass. Iterates local.visibleLabelEls (the same SSOT Set
    // computed by computeIdleLabelVisibility + center-weight
    // logic), draws stroke-then-fill text per visible label.
    //
    // Per-frame cost (typical 100 visible labels):
    //   - 1 clearRect (entire canvas)
    //   - 100 strokeText + 100 fillText calls
    //   - 1 composited layer (the canvas)
    // vs the old DOM approach:
    //   - 100 per-label transform writes
    //   - 100 separate GPU layers (Safari layer-eviction cliff)
    //   - per-label text-stroke paint
    //
    // The canvas approach is 5-10× cheaper in Safari and ~the same
    // in Blink. Future: can scale to 500-1000+ labels without
    // the per-label compositor tax.
    let _labelsDpr = 0;     // last applied dpr (resize-trigger)
    let _labelsCssW = 0, _labelsCssH = 0;   // last applied size
    let _labelsHaloColor = '';
    let _labelsTextColor = '';
    let _labelsHaloRead = 0;                // ms timestamp of last CSS-var read
    function renderLabelsCanvas() {
      const vp = local.lastSize;
      if (!vp.w || !vp.h || !labelsCanvasCtx) return;
      const dpr = window.devicePixelRatio || 1;
      // Resize backing store if dimensions changed (viewport or DPR).
      if (vp.w !== _labelsCssW || vp.h !== _labelsCssH || dpr !== _labelsDpr) {
        labelsCanvas.width  = Math.round(vp.w * dpr);
        labelsCanvas.height = Math.round(vp.h * dpr);
        labelsCanvas.style.width  = vp.w + 'px';
        labelsCanvas.style.height = vp.h + 'px';
        _labelsCssW = vp.w; _labelsCssH = vp.h; _labelsDpr = dpr;
      }
      // Re-read CSS vars every 500ms (cheap, but not free —
      // getComputedStyle invalidates style cache if called every
      // frame on a hot path).
      const now = performance.now();
      if (now - _labelsHaloRead > 500) {
        const cs = getComputedStyle(document.body);
        _labelsHaloColor = (cs.getPropertyValue('--forge-label-halo') || '').trim() || '#0a0d12';
        _labelsTextColor = (cs.getPropertyValue('--forge-label-text') || '').trim() || '#e8eaef';
        _labelsHaloRead = now;
      }
      const ctx = labelsCanvasCtx;
      // Transform to CSS pixels so we can use vp.w/vp.h coordinates.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vp.w, vp.h);
      const visible = local.visibleLabelEls;
      if (!visible || visible.size === 0) return;
      const hitById = local.mode.hitById;
      const nodesById = local.mode.nodesById;
      const camScale = camera.state.scale;
      const vMargin = 100;
      // Style setup ONCE per frame (not per label).
      ctx.font = '500 11px Inter, system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.lineWidth = 4;
      ctx.strokeStyle = _labelsHaloColor;
      ctx.fillStyle = _labelsTextColor;
      for (const id of visible) {
        const n = hitById ? hitById.get(id) : null;
        if (!n) continue;
        const s = camera.worldToScreen(n.x, n.y, vp);
        if (s.x < -vMargin || s.x > vp.w + vMargin
            || s.y < -vMargin || s.y > vp.h + vMargin) continue;
        const node = nodesById ? nodesById.get(id) : null;
        const title = (node && node.title) || id;
        const x = s.x;
        const y = s.y - n.r * camScale - 6;
        // Stroke-then-fill = halo around fill (matches old text-shadow effect).
        ctx.strokeText(title, x, y);
        ctx.fillText(title, x, y);
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
      // Phase 21AH (2026-05-22) — below 15% gizmo, nodes are not
      // individually selectable. The bloom heartbeat owns the
      // floor visual; clicking returns null so the user can pan/
      // zoom without accidentally picking a deity they can't
      // even see. Matches the body.fx-belowfifteen class set in
      // drawFrame.
      if (local._fxBelowFifteen) return null;
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

    // ════════════════════════════════════════════════════════════
    // applyTimelineHiddenOverride  —  Phase 11 (2026-05-21).
    // ════════════════════════════════════════════════════════════
    // Mutates `states[]` in place. For each node id NOT in
    // `focusedSet`, if its existence range falls outside the
    // current scrubber [inDate, outDate], set state = 2.0 (HIDDEN).
    //
    // Called from BOTH recomputeFocus (hover/lock/scrubber-drag)
    // and rebakeNodes (zoom rebake) so that on zoom-back, HIDDEN
    // nodes don't pop back as FADED. Was the bug: rebakeNodes
    // computed fresh states from focusedSet but didn't apply the
    // override, leaving out-of-range nodes at state=1 (FADED)
    // visually re-appearing on zoom.
    //
    // Contract:
    //  - `states` is a Float32Array of length idx.length.
    //  - `focusedSet` may be null (idle) or a Set<id>; nodes in
    //    focusedSet are SKIPPED (explicit focus wins, Phase 10).
    //  - Undated nodes (no date_earliest) stay visible — never
    //    hidden by the timeline filter.
    // ════════════════════════════════════════════════════════════
    function applyTimelineHiddenOverride(idx, states, focusedSet) {
      const tl = local.timeline;
      if (!tl) return;
      if (!(tl.inDate > tl.lo || tl.outDate < tl.hi)) return;
      const nodesById = (local.mode && local.mode.nodesById) || new Map();
      const lo = tl.inDate, hi = tl.outDate;
      for (let i = 0; i < idx.length; i++) {
        if (focusedSet && focusedSet.has(idx[i])) continue;
        const n = nodesById.get ? nodesById.get(idx[i]) : nodesById[idx[i]];
        if (!n) continue;
        const ne = (typeof n.date_earliest === 'number') ? n.date_earliest : null;
        const nl = (typeof n.date_latest   === 'number') ? n.date_latest   : ne;
        if (ne == null) continue;
        const overlaps = (nl == null ? ne : nl) >= lo && ne <= hi;
        if (!overlaps) states[i] = 2.0;
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
      // 24-HUD (2026-05-26, removable) — time the full recomputeFocus.
      // This is the heavy work per hover/lock change. Surfaced in the
      // on-screen HUD to make hover lag visible.
      const _rfT0 = performance.now();
      const idx       = local.mode.nodePacked.idIndex;
      local.focusedSet  = graph.focusedSetFor(local.hoverId, local.lockedSet, local.mode.adjacency);
      local.selectedSet = computeSelectedSet(local.hoverId, local.lockedSet);
      // Phase 22-AI (2026-05-25) — palette upload, UNTHROTTLED.
      // The Phase 22-AH `_hoverBoostActive` mirror flag desynced
      // from the renderer's actual bucketPalette via the asymmetric
      // writer at applyUxMode (forge.js:~4900) which uploads but
      // doesn't update the flag. Symptom: click → wires stay at
      // baseline, then move → wires jump to 1.0 (audit at AUDIT/
      // 2026-05-25-wires-regression-trace.md). Re-uploading
      // unconditionally on every recomputeFocus costs 32 floats +
      // one memcpy per hover/lock change (≤60Hz, never per frame),
      // and removes the entire class of mirror-flag desync bugs.
      if (local.renderer && local.renderer.setBucketPalette) {
        try { local.renderer.setBucketPalette(hotPaletteFromParams()); }
        catch (_) { /* ignore — renderer may be tearing down */ }
      }
      const states    = graph.computeNodeStates(idx, local.focusedSet);
      const selectFlags = graph.computeSelectedStates
        ? graph.computeSelectedStates(idx, local.selectedSet)
        : new Float32Array(idx.length);
      // Phase 11 (2026-05-20) — apply the timeline-HIDDEN override
      // via the shared helper so rebakeNodes (zoom rebake) ALSO
      // honors it. Without this, zoom-out would reset out-of-range
      // nodes to FADED and they'd visibly pop back. See helper at
      // the bottom of this file.
      applyTimelineHiddenOverride(idx, states, local.focusedSet);
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
      // Phase 21AS (2026-05-23) — source-tier filter. Per CODEX §VII
      // the user can hide entire tiers (T1-T5) via view-settings.
      // Any edge whose source_tier is NOT in the active set is
      // forced to HIDDEN (state=2.0 → alpha 0 in the wire shader,
      // see Phase 21AU edge-shader patch) regardless of focus or
      // hover. We apply this AFTER computeEdgeStates so HIDDEN
      // beats focus.
      // Phase 21AX (2026-05-23) — CODEX v1.2 — also hide political-
      // risk-flagged edges unless the user opts in via the
      // (orthogonal) politicalRisk toggle. The two filters compose
      // with AND: an edge must pass BOTH (its tier is on AND either
      // it is not political-risk-flagged OR politicalRisk toggle is
      // ON) to render. Triple-checked-default policy from §IV.5.
      const activeTiers     = local._activeTiers;
      const showPolitical   = !!local._showPoliticalRisk;
      const tierFilterOn    = activeTiers && activeTiers.size < 5;
      if (tierFilterOn || !showPolitical) {
        const edges = local.mode.edges;
        for (let i = 0; i < edges.length; i++) {
          const e = edges[i];
          const tier = e.source_tier || 'T1';
          // Hide by tier?
          if (tierFilterOn && !activeTiers.has(tier)) {
            newTargets[i] = 2.0;
            continue;
          }
          // Hide by political-risk-flag? (independent of tier)
          if (!showPolitical && e.political_risk_flag) {
            newTargets[i] = 2.0;
          }
        }
      }
      // Phase 21AU (2026-05-23) — snap edgeStates around HIDDEN
      // transitions. The fade animation linearly interpolates state
      // toward target, so 0 → 2 passes through state=1 (HOT) for
      // ~half the fade window — that would flash every hidden wire
      // bright orange before it disappears (and the reverse on un-
      // hide). Solution: for any edge that becomes HIDDEN, snap
      // both buffers to 2.0; for any edge LEAVING HIDDEN, snap from
      // 2.0 directly to its new target. Visible→visible transitions
      // (IDLE ↔ HOT) keep the existing smooth fade.
      const prevStates = local.edgeStates;
      if (prevStates && prevStates.length === newTargets.length) {
        for (let i = 0; i < newTargets.length; i++) {
          const nextHidden = (newTargets[i] >= 1.5);
          const prevHidden = (prevStates[i]   >= 1.5);
          if (nextHidden) {
            // Entering or staying HIDDEN: snap to 2.0, no fade.
            prevStates[i] = 2.0;
          } else if (prevHidden) {
            // Leaving HIDDEN: snap directly to the new target so
            // the fade doesn't pass through state=1 HOT.
            prevStates[i] = newTargets[i];
          }
        }
      }
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
      // Phase 5C (2026-05-20) — no glyph dirty-flag needed.
      // Glyph opacity is uniform + state driven on GPU; the
      // shader picks up the new state from nodeStateVbo on the
      // next drawFrame without any per-instance buffer write.
      startAnimLoop();
      syncLabels();
      // 24-HUD (2026-05-26, removable) — record recomputeFocus
      // duration (full method, including syncLabels at the end).
      const _rfMs = performance.now() - _rfT0;
      if (!local._rfTimes) { local._rfTimes = []; local._rfTimesIdx = 0; }
      local._rfTimes[local._rfTimesIdx % 60] = _rfMs;
      local._rfTimesIdx++;
      local._lastRecomputeFocusMs = _rfMs;
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
      // Phase 5C (2026-05-20) — no glyph dirty-flag needed.
      // The glyph fragment shader reads state from nodeStateVbo
      // (the same buffer animTick is writing). When fade
      // advances the state values, the next drawFrame's shader
      // run picks them up automatically — no JS-side glyph work.
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
    // ════════════════════════════════════════════════════════════
    //  Hover / click bloom pulse triggers — Phase 21AE (2026-05-22)
    // ════════════════════════════════════════════════════════════
    //  Add a class to the canvas → CSS animation runs once → JS
    //  removes the class after the duration so the next trigger
    //  can re-start cleanly. Browsers don't re-trigger a CSS
    //  animation by re-applying the SAME class without a reflow,
    //  so we force one via `void canvas.offsetWidth` between
    //  remove + add. Cost: one layout read, ~50µs. Fine for hover
    //  / click rates (well under 60 Hz).
    //
    //  Both are no-ops when:
    //    • body.fx-pulse-enabled is not set (toggle off — default), OR
    //    • body.fx-bloom is set (floor FX owns the filter; the CSS
    //      rule is :not(.fx-bloom) gated, so the class would be
    //      dead-styled — we still skip the work for cleanliness).
    // ════════════════════════════════════════════════════════════
    // Phase 21AF (2026-05-22) — per-node pulse dot (replaces the
    // canvas-wide filter approach from 21AE). The dot is one fixed-
    // position element shared across hover + click; JS positions
    // it at the node's screen coords, sets a size based on the
    // node radius × the user's --fx-pulse-size-mult var, and
    // toggles the animation class. Only the targeted node glows.
    function ensurePulseDot() {
      if (local._fxPulseDot && local._fxPulseDot.isConnected) return local._fxPulseDot;
      const d = document.createElement('div');
      d.className = 'forge-fx-pulse-dot';
      d.id        = 'forge-fx-pulse-dot';
      d.setAttribute('aria-hidden', 'true');
      document.body.appendChild(d);
      local._fxPulseDot = d;
      return d;
    }
    function positionPulseDot(nodeId) {
      const m   = local.mode;
      const vp  = local.lastSize;
      const hit = m && m.hitById && m.hitById.get ? m.hitById.get(nodeId) : null;
      const full= m && m.nodesById && m.nodesById.get ? m.nodesById.get(nodeId) : null;
      if (!hit || !vp || !vp.w) return null;
      const dot = ensurePulseDot();
      // Node centre in viewport coordinates.
      const screen = camera.worldToScreen(hit.x, hit.y, vp);
      const cr     = canvas.getBoundingClientRect();
      const px = cr.left + screen.x;
      const py = cr.top  + screen.y;
      // Base size: node radius (screen px) × the panel slider mult.
      const rPx     = Math.max(2, hit.r * camera.state.scale);
      const sizeMult= parseFloat(getComputedStyle(document.body).getPropertyValue('--fx-pulse-size-mult')) || 4;
      const sizePx  = rPx * 2 * sizeMult;
      // Phase 21AN (2026-05-23) — respect the active color theme.
      // Previously this pulled `full.family_color` from data.js,
      // which is the BAKED "default Atlas" palette — so when the user
      // switched to Roots/Geography/Longitude/Cosmology/Time the
      // hover/click pulse stayed the old colour. Now we check the
      // active currentColorOverride() map first; if the theme has a
      // hex for this node's family, use it. Falls back to the baked
      // colour for the default theme (override === null).
      const themeOverride = (typeof currentColorOverride === 'function') ? currentColorOverride() : null;
      const familyKey     = (full && full.family) || '';
      const color = (themeOverride && themeOverride[familyKey])
                 || (full && (full.family_color || full.tradition_color))
                 || '#d4a55a';
      dot.style.left = px + 'px';
      dot.style.top  = py + 'px';
      dot.style.setProperty('--fx-pulse-size',  sizePx + 'px');
      dot.style.setProperty('--fx-pulse-color', color);
      return dot;
    }
    // Phase 21AI (2026-05-22) — per-node single-flight guard. The
    // 21AH version blocked ALL triggers if any pulse was playing,
    // which suppressed legitimate hover/click on OTHER nodes when
    // the cursor moved between disks quickly. New rule (per John):
    // only block the trigger when the SAME node is mid-pulse.
    // Different node → cancel the in-flight pulse + start the new
    // one. local._fxPulseNodeId tracks the node currently animating.
    function isPulsePlayingFor(nodeId) {
      const dot = local._fxPulseDot;
      if (!dot) return false;
      const playing = dot.classList.contains('fx-hover-flash')
                   || dot.classList.contains('fx-click-pulse');
      if (!playing) return false;
      return local._fxPulseNodeId === nodeId;
    }
    // Phase 24-PRIMITIVE-FIX (2026-05-26) — replaced `void dot.offsetWidth`
    // (which forced synchronous reflow of the ENTIRE document, including
    // all 200+ labels, hulls SVG, BG image) with getAnimations().cancel().
    // The reflow trick was the worst per-hover primitive failure in the
    // codebase: every cursor-move-to-new-node triggered a full layout
    // pass, perceived as the "gag" between hover frames. Cancelling via
    // the Web Animations API releases the running animation cleanly so
    // the next classList.add() picks up fresh keyframes — same restart
    // behavior, zero layout invalidation.
    function _cancelPulseAnimations(dot) {
      try {
        const anims = dot.getAnimations ? dot.getAnimations() : null;
        if (anims) { for (const a of anims) { try { a.cancel(); } catch (_) {} } }
      } catch (_) { /* getAnimations may not exist on very old browsers */ }
    }
    function triggerHoverFlash() {
      const id = local.hoverId;
      if (id == null) return;
      if (isPulsePlayingFor(id)) return;
      const dot = positionPulseDot(id);
      if (!dot) return;
      if (local._hoverFlashTimer) { clearTimeout(local._hoverFlashTimer); local._hoverFlashTimer = 0; }
      dot.classList.remove('fx-hover-flash', 'fx-click-pulse');
      _cancelPulseAnimations(dot);     // was: void dot.offsetWidth (forced reflow)
      dot.classList.add('fx-hover-flash');
      local._fxPulseNodeId = id;
      local._hoverFlashTimer = setTimeout(() => {
        dot.classList.remove('fx-hover-flash');
        local._hoverFlashTimer = 0;
        if (local._fxPulseNodeId === id) local._fxPulseNodeId = null;
      }, 2200);
    }
    function triggerClickPulse(nodeId) {
      if (isPulsePlayingFor(nodeId)) return;
      const dot = positionPulseDot(nodeId);
      if (!dot) return;
      if (local._clickPulseTimer) { clearTimeout(local._clickPulseTimer); local._clickPulseTimer = 0; }
      dot.classList.remove('fx-hover-flash', 'fx-click-pulse');
      _cancelPulseAnimations(dot);     // was: void dot.offsetWidth (forced reflow)
      dot.classList.add('fx-click-pulse');
      local._fxPulseNodeId = nodeId;
      local._clickPulseTimer = setTimeout(() => {
        dot.classList.remove('fx-click-pulse');
        local._clickPulseTimer = 0;
        if (local._fxPulseNodeId === nodeId) local._fxPulseNodeId = null;
      }, 2800);
    }

    function setHoverId(newId) {
      if (newId === local.hoverId && local.hoverPendingId === undefined) return;
      // Light synchronous updates — cheap, must fire on every move
      // for the cursor feedback to feel responsive.
      if (newId !== local.hoverId) {
        const prevId = local.hoverId;
        local.hoverId = newId;
        canvas.classList.toggle('is-hover-node', !!newId);
        // Phase 21AE (2026-05-22) — fire hover bloom flash when the
        // cursor TRANSITIONS onto a node (newId becomes non-null).
        // Gated by the pulse-enabled toggle + the floor-FX is off
        // (CSS rule scoped via :not(.fx-bloom)). Restart-trick via
        // class-remove + reflow + class-add so rapid hovers always
        // re-trigger the keyframe.
        if (newId && !prevId && local._fxToggles && local._fxToggles['pulse-enabled'] && !local._fxBloomActive) {
          triggerHoverFlash();
        }
        const hEl = document.getElementById('forge-status-hover');
        if (hEl) {
          if (newId) {
            const node = nodeById(newId);
            hEl.textContent = (node && node.title) || newId;
          } else {
            hEl.textContent = '—';
          }
        }
        // Phase 14 (2026-05-21) — notify the hover card observer
        // (wireHoverCard installs this). Single hook; defensive
        // try/catch so a card-side error never breaks hover.
        if (typeof local._onHoverChange === 'function') {
          try { local._onHoverChange(newId); } catch (e) { /* ignore */ }
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
        // SAFARI-WORKAROUND (2026-05-26) — idleLabelRaf is now a
        // setTimeout token (was requestAnimationFrame). clearTimeout
        // is the correct canceller.
        try { clearTimeout(local.idleLabelRaf); } catch (e) { /* ignore */ }
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

    // ── Phase 5B M-F2 (2026-05-20) — runtime persistence ─
    // Single LS key `codex-atlas/forge-runtime-v1`. Carries:
    //   mode      — modemod id; hydrated at mount if isValidMode.
    //   timeline  — { in, out, center }; clamped to current mode's
    //               lo/hi on hydrate.
    //   lockedSet — array of node ids; filtered to ids that exist
    //               in current mode's adjacency on hydrate.
    // saveRuntimeState is called after each user-visible state
    // change (mode-switch, scrubber pointerup, lock toggle). LS
    // I/O wrapped in try/catch — silently no-ops in private-mode
    // browsers + on quota exceeded.
    const LS_RUNTIME_KEY = 'codex-atlas/forge-runtime-v1';
    function loadRuntimeState() {
      try {
        const raw = window.localStorage && window.localStorage.getItem(LS_RUNTIME_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object') ? parsed : null;
      } catch (e) { return null; }
    }
    function saveRuntimeState() {
      try {
        if (!window.localStorage) return;
        const tl = local.timeline;
        const state = {
          mode: local.mode && local.mode.id || null,
          timeline: tl ? {
            in:     tl.inDate,
            out:    tl.outDate,
            center: tl.centerDate,
          } : null,
          lockedSet: local.lockedSet ? Array.from(local.lockedSet) : [],
          // Phase 21S (2026-05-22) — persist color theme + family
          // order alongside mode/timeline/locks so the wheel comes
          // back with the user's last UX choice.
          uxMode: local.uxMode ? {
            colorMode:        local.uxMode.colorMode,
            orderMode:        local.uxMode.orderMode,
            distributionMode: local.uxMode.distributionMode,
          } : null,
        };
        window.localStorage.setItem(LS_RUNTIME_KEY, JSON.stringify(state));
      } catch (e) { /* ignore quota / privacy mode */ }
    }

    // Phase 21S (2026-05-22) — Re-apply the current ux-mode (color
    // theme + family order). Triggered by the View-settings radio
    // groups. Uses rebuildForMode({preserveLocks:true}) so the
    // user doesn't lose their selection when toggling a theme.
    function applyUxMode() {
      if (!local.mode || !local.mode.id) return;
      // Phase 22-J (2026-05-24) — preserveZoom: color theme or
      // family order doesn't change the dataset, only the coloring/
      // sort. Without preserveZoom the camera would snap to the
      // 20% timeline default on every theme click, undoing the
      // user's zoom + the band-density slider's visual reality.
      rebuildForMode(local.mode.id, { preserveLocks: true, preserveZoom: true });
      // Phase 22-AI (2026-05-25) — belt-and-braces palette refresh
      // here is REDUNDANT now that recomputeFocus uploads on every
      // call (see forge.js:~4358). rebuildForMode → recomputeFocus
      // chain ends with a fresh palette write. Keeping this site
      // would be the SAME asymmetric writer that caused the
      // wires-regression we just fixed. DELETED.
      saveRuntimeState();
    }

    // ── Search (Phase 4f) ─────────────────────────────
    // Substring match (case-insensitive) across title, id, and
    // aka of the CURRENT mode's nodes. First match wins; ties
    // broken by degree (highest first) so "zeus" beats a tiny
    // "zeusite" stub. Returns the node id, or null.
    // Phase 5B M-F5 (2026-05-20) — eager search index built at
    // the end of rebuildForMode (see buildSearchIndex below).
    // findBestMatch walks local.searchIndex instead of re-lowercasing
    // titles + re-looking-up adjacency on every call. Same exact >
    // prefix > contains > degree-tiebreak algorithm; just constant-
    // time per entry. At 663 deities the saving is ~5 ms; at 10k
    // synthetic mode it's ~20-30 ms → <5 ms. Falls back to a fresh
    // walk when the index is missing (defensive).
    function findBestMatch(query) {
      const q = (query || '').trim().toLowerCase();
      if (!q) return null;
      const idx = local.searchIndex;
      let bestExact = null, bestExactDeg = -1;
      let bestPrefix = null, bestPrefixDeg = -1;
      let bestContains = null, bestContainsDeg = -1;
      if (idx) {
        for (let i = 0; i < idx.length; i++) {
          const entry = idx[i];
          const hs = entry.haystacks;
          for (let j = 0; j < hs.length; j++) {
            const h = hs[j];
            if (h === q) {
              if (entry.deg > bestExactDeg) { bestExact = entry.id; bestExactDeg = entry.deg; }
            } else if (h.startsWith(q)) {
              if (entry.deg > bestPrefixDeg) { bestPrefix = entry.id; bestPrefixDeg = entry.deg; }
            } else if (h.indexOf(q) >= 0) {
              if (entry.deg > bestContainsDeg) { bestContains = entry.id; bestContainsDeg = entry.deg; }
            }
          }
        }
      } else if (local.mode && Array.isArray(local.mode.nodes)) {
        // Defensive fallback if the index wasn't built (e.g. very
        // early call before rebuildForMode's tail block ran).
        for (const n of local.mode.nodes) {
          if (!n) continue;
          const title = String(n.title || '').toLowerCase();
          const id    = String(n.id || '').toLowerCase();
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
      }
      return bestExact || bestPrefix || bestContains;
    }

    // Phase 5B M-F5 (2026-05-20) — build the search index from
    // the current mode's nodes + adjacency. Called at the end of
    // rebuildForMode. O(N × avg-aka-count) one-shot, no allocations
    // beyond the index itself. Walks `local.mode.nodes` once and
    // precomputes lowercase haystacks + degree per entry, so
    // findBestMatch is allocation-free + lookup-free per query.
    function buildSearchIndex() {
      const m = local.mode;
      if (!m || !Array.isArray(m.nodes) || !m.adjacency) {
        local.searchIndex = [];
        return;
      }
      const adj = m.adjacency;
      const out = [];
      for (const n of m.nodes) {
        if (!n || !n.id) continue;
        const title = String(n.title || '').toLowerCase();
        const id    = String(n.id   || '').toLowerCase();
        const haystacks = [title, id];
        if (Array.isArray(n.aka)) {
          for (const a of n.aka) {
            if (typeof a === 'string') haystacks.push(a.toLowerCase());
          }
        }
        const adjSet = adj.get(n.id);
        const deg = adjSet ? adjSet.size : 0;
        out.push({ id: n.id, deg, haystacks });
      }
      local.searchIndex = out;
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
    // ════════════════════════════════════════════════════════════
    //  wireLegend()  —  Phase 13 (2026-05-21)
    // ════════════════════════════════════════════════════════════
    //  Toggle-able color-code legend for the 7 wire buckets. Click
    //  the LEGEND button to expand a panel upward listing each
    //  bucket with its swatch + name. Hovering a row pops a
    //  secondary tooltip describing the wire type's meaning + our
    //  methodology for using it.
    //
    //  Architecture rules:
    //   - Bucket hex colors come from PARAM_DEFAULTS only (single
    //     source of truth — same values the shader reads). No
    //     duplication.
    //   - Rows are generated once; panel is `display:none` when
    //     closed (no per-frame cost).
    //   - The hover tooltip is ONE persistent element; content swaps
    //     on row hover. Hidden via aria-hidden + opacity-0 CSS.
    //   - Bucket order matches BUCKET_ORDER (shader bucket_index).
    // ════════════════════════════════════════════════════════════
    // ════════════════════════════════════════════════════════════
    //  wireDebugStats()  —  Phase 21A2 (2026-05-21)
    // ════════════════════════════════════════════════════════════
    //  Toggleable popover next to the present-date box. When
    //  open, displays a one-pass copy of the engine stats
    //  (device / nodes / edges / hover / lock / frame) read
    //  from the existing #forge-status-* spans (which still get
    //  written by the existing updaters — we just relocate the
    //  *display*). Stats refresh while the panel is open via a
    //  shared MutationObserver on the hidden status spans.
    // ════════════════════════════════════════════════════════════
    function wireDebugStats() {
      // Phase 23.1h RETRY carve — body lifted to src/js/forge/debug-stats.js.
      if (window._forgeDebugStats && typeof window._forgeDebugStats.attach === 'function') {
        window._forgeDebugStats.attach({ local });
      } else if (typeof console !== 'undefined' && console.warn) {
        console.warn('[forge] window._forgeDebugStats not loaded — debug popover inert.');
      }
    }

    // ════════════════════════════════════════════════════════════
    //  syncModeButtonLabel(modeId)  —  Phase 21O (2026-05-21)
    //                                  Phase 22-C (2026-05-23 — relocated)
    // ════════════════════════════════════════════════════════════
    //  Reflects the active mode's label into the UI. The legacy
    //  in-Forge `forge-status-mode` button is GONE (Phase 22-C
    //  deletion); the app-shell `.app-pill-class` label now owns
    //  the display. The function:
    //
    //   1. Writes the label into #app-pill-class-label (if present).
    //   2. Dispatches `codex:class-changed` so the app-pill's own
    //      dropdown can mark the matching row .is-active.
    //
    //  Pure DOM write — does NOT trigger a rebuild. Safe to call
    //  from save-state restore + rebuildForMode.
    // ════════════════════════════════════════════════════════════
    function syncModeButtonLabel(modeId) {
      const entry = (modemod.MODES || []).find(m => m.value === modeId);
      if (!entry) return;
      // Phase 22-C — write to the app-shell pill's class side.
      const pillLabel = document.getElementById('app-pill-class-label');
      if (pillLabel) pillLabel.textContent = entry.label;
      // Emit so the pill's dropdown row marks .is-active without
      // polling local.mode.id from outside the closure.
      try {
        document.dispatchEvent(new CustomEvent('codex:class-changed', {
          detail: { modeId, label: entry.label }
        }));
      } catch (_) {}
    }

    // ════════════════════════════════════════════════════════════
    //  installPublicApi()  —  Phase 22-C (2026-05-23)
    // ════════════════════════════════════════════════════════════
    //  Replaces the legacy wireModeDropdown() — the in-Forge mode
    //  pill + popup + handlers (lived in this slot Phase 21O → 22-B)
    //  was DELETED in 22-C. The class-selector UI now lives at the
    //  app-shell level (.app-pill-class in index.html, behaviour in
    //  src/js/app-pill.js).
    //
    //  Exposes a tiny app-level API on window._forge:
    //
    //    setClassFilter(modeId): switch the wheel to a different
    //      node-class (e.g. 'deities' → 'authors'). Wraps
    //      rebuildForMode + syncModeButtonLabel + saveRuntimeState
    //      so callers don't need to know the internals.
    //    getClassFilter(): returns the current modeId.
    //    supportedClasses(): returns the MODES catalog.
    //
    //  Used by src/js/app-pill.js right-side click handler; future
    //  view modules (Timeline / Map / etc.) will register similar
    //  surfaces under window._forge / window._timeline / etc.
    // ════════════════════════════════════════════════════════════
    function installPublicApi() {
      // Phase 23.1j RETRY carve — body lifted to src/js/forge/install-public-api.js.
      // FINAL carve of the a-j series.
      if (window._forgeInstallPublicApi && typeof window._forgeInstallPublicApi.attach === 'function') {
        window._forgeInstallPublicApi.attach({
          applyZoomFloor, camera, local, rebuildForMode, saveRuntimeState, syncModeButtonLabel,
        });
      } else if (typeof console !== 'undefined' && console.warn) {
        console.warn('[forge] window._forgeInstallPublicApi not loaded — public API inert.');
      }
    }

    // ════════════════════════════════════════════════════════════
    //  wireViewSettings()  —  Phase 21B (2026-05-21)
    // ════════════════════════════════════════════════════════════
    //  Drop-up menu in the bottom-bar with layer toggles. State
    //  persists in localStorage. Active toggles add classes to
    //  the body so CSS controls visibility:
    //    body.fv-hide-hulls    — pie slices + dividers + labels gone
    //    body.fv-hide-wires    — edge canvas layer dimmed to 0
    //    body.fv-hide-map      — placeholder, not implemented
    //  CSS in app.css wires the actual visibility — JS only
    //  flips classes.
    // ════════════════════════════════════════════════════════════
    // Phase 21T (2026-05-22) — criterion tooltips for the color +
    // order radios. Same pattern as the legend tooltip: dwell on a
    // row for ~1 s → a floating box appears with the rule that
    // governs that mode. Helps the user remember which theme uses
    // which logic without opening a separate help panel.
    // Phase 21U (2026-05-22) — simpler tooltip copy per John's
    // feedback: drop the family-arrow lists; keep just the rule.
    // Color words are HTML-styled in the actual color so the user
    // can read the criterion AS the palette. Tooltip rendering
    // switched from textContent to innerHTML below.
    function _c(hex, text) {
      return '<span style="color:' + hex + ';font-weight:600">' + text + '</span>';
    }
    const VIEWSET_CRITERIA = {
      // ── Color themes ────────────────────────────────────────
      color: {
        default:   'Curated palette tuned for visual distinction between neighbouring slices. Soft pattern: warm tones around the Mediterranean, cooler tones toward the North, saffron toward Asia, obsidian toward the Americas. Not a strict rule — the goal is legibility.',
        roots:     'Each civilizational root has its own hue range. Family relationship drives the colour; brightness distinguishes branches within a root. The only theme where Christian and Gnostic stay at their original tones.',
        geography: 'Colour follows climate band. ' + _c('#d4a55a','Warm') + ' for Mediterranean and tropical regions. ' + _c('#5a9a7a','Cool green') + ' for temperate Europe and East Asia. ' + _c('#e08a3a','Saffron') + ' for Indo-Iranian arid zones. Same climate ⇒ same tone.',
        longitude: 'Colour tracks geographic longitude of origin. Americas = ' + _c('#7a4ac4','violet') + '. Europe = ' + _c('#5a7ac4','blue') + '. Mediterranean = ' + _c('#d4a55a','gold') + '. Near East = ' + _c('#c4855a','copper') + '. India = ' + _c('#e08a3a','saffron') + '. East Asia = ' + _c('#5a9a7a','jade') + '. Pacific = ' + _c('#3a8aa4','teal') + '.',
        cosmology: 'Colour follows the tradition\'s claim about ultimate reality. Monotheist (one supreme deity) = ' + _c('#c44a5a','red') + '. Dualist (two opposing principles) = ' + _c('#8a5aa4','violet') + '. Polytheist (many gods) = ' + _c('#c47a4a','rust') + '. Pantheist (divine ≡ cosmos) = ' + _c('#5a9a7a','jade') + '. Animist (spirits in things) = ' + _c('#8a8a5a','moss') + '.',
        time:      'Colour follows the era a tradition emerged in. Stone and Bronze ages = ' + _c('#8a6a3a','umber') + '. Classical antiquity = ' + _c('#c4a040','ochre') + '. Late antiquity = ' + _c('#9a4a6a','wine') + '. Medieval = ' + _c('#3a8a8a','teal') + '. Modern = ' + _c('#7a8a9a','silver') + '.',
      },
      // ── Family orders ───────────────────────────────────────
      order: {
        opposites:     'Each family sits across the wheel from its conceptual opposite. Reading along a diameter gives you paired traditions.',
        roots:         'Walk clockwise through root clusters — similar traditions sit adjacent.',
        chronological: 'Globally oldest to globally youngest, ignoring family. Pure historical sweep.',
        geography:     'West to East: Americas → Europe → Mediterranean → Near East → India → East Asia → Pacific.',
      },
      // ── Node distributions ──────────────────────────────────
      // Phase 21AL (2026-05-23). Each wedge sorts its members by
      // date_earliest (oldest first); the distribution decides
      // how that ordered list gets mapped into (radius, angle).
      distribution: {
        organic:    'Default. Oldest nodes sit near the outer rim, newest near the centre, with hash-jitter so siblings don\'t line up perfectly. The wedge opens outward like a fan.',
        'age-bands':'Concentric chronological rings. Each node lands on the ring matching its century (Bronze Age outer → Modern inner). Reads like a radar chart of historical periods across all traditions at once.',
        vogel:      'Phyllotaxis sunflower (Vogel). Each next node steps by the golden angle (≈ 137.5°) and a √(i/N) radius, packing into the spiral pattern of real sunflower seeds. The OLDEST node is the seed at the centre; younger nodes spiral outward. Family colour is preserved.',
      },
    };

    function wireViewSettings() {
      // Phase 23.1i RETRY carve — body lifted to src/js/forge/view-settings.js.
      // Largest dep surface in the series: 12 deps. Stub plumbs them through.
      if (window._forgeViewSettings && typeof window._forgeViewSettings.attach === 'function') {
        window._forgeViewSettings.attach({
          COLOR_THEMES, DEFAULT_UX_MODE, DISTRIBUTION_THEMES, ORDER_THEMES,
          VIEWSET_CRITERIA, applyUxMode, drawFrame, local,
          rebuildForMode, rebuildHullElements, recomputeFocus, syncHulls,
        });
      } else if (typeof console !== 'undefined' && console.warn) {
        console.warn('[forge] window._forgeViewSettings not loaded — view settings inert.');
      }
    }

    // ════════════════════════════════════════════════════════════
    //  wireFXPanel()  —  Phase 21AB (2026-05-22)
    // ════════════════════════════════════════════════════════════
    //  Floor-zoom FX dev sliders. Live-tunes CSS vars on
    //  body.view-forge. Persists to LS as forge.fxParams.v1.
    //
    //  Scope: ONLY the visual look of the floor FX. The trigger
    //  threshold (25%) and the transition fade timing (0.45s) are
    //  intentionally NOT in this panel.
    //
    //  Each slider has data-fx="<var-suffix>". The var written is
    //  --fx-<var-suffix>. Defaults match the Phase 21W baseline.
    //  Units (px / deg) are baked into the format() helper.
    // ════════════════════════════════════════════════════════════
    function wireFXPanel() {
      // Phase 23.1c RETRY carve (2026-05-25 NIGHT) — body lifted to
      // src/js/forge/fx-panel.js. AST-validated deps = { local }
      // (the previous cherry-pick attempt over-declared `renderer`
      // and crashed at boot; bootstrap-catch + smoke gate caught it).
      if (window._forgeFXPanel && typeof window._forgeFXPanel.attach === 'function') {
        window._forgeFXPanel.attach({ local });
      } else if (typeof console !== 'undefined' && console.warn) {
        console.warn('[forge] window._forgeFXPanel not loaded — FX panel inert.');
      }
    }

    // ════════════════════════════════════════════════════════════
    // ════════════════════════════════════════════════════════════
    //  wireStylePanel()  —  Phase 21AJ (2026-05-23)
    // ════════════════════════════════════════════════════════════
    //  Stroke-style controls for the guide rings + the converging
    //  separator gradient. Writes to CSS vars on body.view-forge
    //  which are picked up by .forge-hull-guide-ring (rings) and
    //  by the gradient stops inline-style (converging separators).
    //  Persists state under forge.styleParams.v1.
    // ════════════════════════════════════════════════════════════
    function wireStylePanel() {
      // Phase 23.1d RETRY carve (2026-05-25 NIGHT) — body lifted to
      // src/js/forge/style-panel.js. AST-validated deps =
      // { drawFrame, local, rebuildHullElements, syncHulls }.
      if (window._forgeStylePanel && typeof window._forgeStylePanel.attach === 'function') {
        window._forgeStylePanel.attach({ drawFrame, local, rebuildHullElements, syncHulls });
      } else if (typeof console !== 'undefined' && console.warn) {
        console.warn('[forge] window._forgeStylePanel not loaded — style panel inert.');
      }
    }

    //  wireSearchAutocomplete()  —  Phase 21B (2026-05-21)
    // ════════════════════════════════════════════════════════════
    //  Adds an upward-expanding suggestion list under the
    //  #forge-status-search input. Reads from the SAME
    //  local.mode.search index the existing search machinery
    //  uses (no second source of truth). On match-click, locks +
    //  flies to the node via the existing lock pipeline.
    // ════════════════════════════════════════════════════════════
    function wireSearchAutocomplete() {
      // Phase 23.1e RETRY carve (2026-05-25 NIGHT) — body lifted to
      // src/js/forge/search-autocomplete.js. AST deps = { local, toggleLock }.
      if (window._forgeSearchAutocomplete && typeof window._forgeSearchAutocomplete.attach === 'function') {
        window._forgeSearchAutocomplete.attach({ local, toggleLock });
      } else if (typeof console !== 'undefined' && console.warn) {
        console.warn('[forge] window._forgeSearchAutocomplete not loaded — autocomplete inert.');
      }
    }

    function wireLegend() {
      // Phase 23.1b carve (2026-05-25): body lifted to
      // src/js/forge/legend.js. Stub preserves the call site.
      if (window._forgeLegend && typeof window._forgeLegend.attach === "function") {
        window._forgeLegend.attach({ local, recomputeFocus });
      } else if (typeof console !== "undefined" && console.warn) {
        console.warn("[forge] window._forgeLegend not loaded — legend panel inert.");
      }
    }

    // ════════════════════════════════════════════════════════════
    //  wireHoverCard()  —  Phase 14 (2026-05-21)
    // ════════════════════════════════════════════════════════════
    //  Floating thumbnail card that appears next to the cursor when
    //  hovering a node on the canvas. First-step scaffolding —
    //  iterate styling after live review.
    //
    //  Architecture rules:
    //   - ONE persistent DOM element appended at mount. No per-hover
    //     create/destroy.
    //   - Position updated on mousemove via transform: translate3d.
    //     rAF-coalesced through the same hoverRafId path so we don't
    //     burn CPU at 120Hz pointer events.
    //   - Image load: try thumbnails/<id>.jpg; onerror swap to a
    //     simple colored placeholder. Stale image loads ignored via
    //     a per-hover token.
    //   - Hidden via display:none when no hover, OR when a click-lock
    //     is active (lock interaction wins; the card would just be
    //     noise on top of the locked anchor).
    //   - Show-delay: 150ms — long enough to ignore mouse-passing,
    //     short enough to feel responsive.
    // ════════════════════════════════════════════════════════════
    function wireHoverCard() {
      // Phase 23.1f RETRY carve (2026-05-25 NIGHT) — body lifted to
      // src/js/forge/hover-card.js. AST-validated deps =
      // { canvas, computeFaceObjectPosition, local, stage }.
      if (window._forgeHoverCard && typeof window._forgeHoverCard.attach === 'function') {
        window._forgeHoverCard.attach({ canvas, computeFaceObjectPosition, local, stage });
      } else if (typeof console !== 'undefined' && console.warn) {
        console.warn('[forge] window._forgeHoverCard not loaded — hover card inert.');
      }
    }
    // ORIGINAL wireHoverCard body — lifted to module (kept here briefly so the
    // closing brace and subsequent functions stay at the same outer indent).

    // ════════════════════════════════════════════════════════════
    //  wireSidePanel()  —  Phase 19C (2026-05-21)
    // ════════════════════════════════════════════════════════════
    //  Multi-deity inspector. Each LOCK gets its own floating tab
    //  button stacked on the right edge of the viewport. Clicking
    //  a tab opens the existing GLOBAL aside.detail panel with
    //  that deity's content; clicking the active tab closes the
    //  panel; clicking-empty (toggleLock(null)) clears all tabs
    //  and closes the panel.
    //
    //  Architecture:
    //   - local.deityTabs[]   — ordered list of locked deity ids
    //     (newest = bottom of the visual stack)
    //   - local.openTabId     — which tab is currently shown in
    //     the panel; null = panel closed
    //   - body.view-forge     — flips `.detail-toggle` off (we
    //     don't use the global toggle in Forge view) and lets
    //     aside.detail hide entirely when no tab is open.
    //   - .forge-deity-tabs   — fixed-positioned column at the
    //     right viewport edge. Each child is a `.forge-deity-tab`
    //     button. The active one gets `.is-active`. A freshly-
    //     added one gets `.pulsing` for ~2.4s.
    //
    //  When the panel is open, the tab column shifts left by the
    //  panel width so the buttons stay outside the panel (per
    //  John's "OUTSIDE of it so it doesn't clutter inside" rule).
    //
    //  Content uses the BAKED fields from data.js:
    //   - node.title         (proper display name — was reading
    //     node.name which doesn't exist; that's why earlier the
    //     panel showed lowercase ids like "poseidon")
    //   - node.thumbnail     (Wikipedia URL, baked per node)
    //   - node.thumb_extract (Wikipedia extract paragraph)
    //   - node.thumb_page    (Wikipedia article URL)
    //   - node.role / .tradition / .region / .domains / .aka /
    //     .date_earliest / .date_latest / .family_color
    // ════════════════════════════════════════════════════════════
    function wireSidePanel() {
      // Phase 23.1g RETRY carve (2026-05-25 NIGHT) — body lifted to
      // src/js/forge/side-panel.js. THE BIG ONE: 865 LOC out of forge.js.
      // Deps = { computeFaceObjectPosition, local, toggleLock, triggerClickPulse }.
      // AST flagged safeAttr as a 5th dep but it's declared inside render()
      // in the original code, NOT at forge.js scope. The carved module
      // hoists safeAttr into its own attach() scope and incidentally
      // fixes a latent ReferenceError in showCrossFolderPopup.
      if (window._forgeSidePanel && typeof window._forgeSidePanel.attach === 'function') {
        window._forgeSidePanel.attach({ computeFaceObjectPosition, local, toggleLock, triggerClickPulse });
      } else if (typeof console !== 'undefined' && console.warn) {
        console.warn('[forge] window._forgeSidePanel not loaded — side panel inert.');
      }
    }

    function wireTimelineScrubber() {
      // Phase 23.1a carve (2026-05-25): body lifted to
      // src/js/forge/timeline-scrubber.js. This stub preserves the
      // existing call site + handles the (rare) load-order case
      // where this view mounts before the carved module finishes
      // loading. window._forgeTimelineScrubber is set by the IIFE
      // in that file; load via <script> tag before forge.js.
      if (window._forgeTimelineScrubber && typeof window._forgeTimelineScrubber.attach === "function") {
        window._forgeTimelineScrubber.attach({ local, recomputeFocus, saveRuntimeState });
      } else if (typeof console !== "undefined" && console.warn) {
        console.warn("[forge] window._forgeTimelineScrubber not loaded — timeline scrubber inert.");
      }
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
      let action;   // 'add' | 'remove' | 'clear'
      let changedId = id;
      if (id == null) {
        if (local.lockedSet.size === 0) return;
        local.lockedSet.clear();
        action = 'clear';
        changedId = null;
      } else if (local.lockedSet.has(id)) {
        local.lockedSet.delete(id);
        action = 'remove';
      } else {
        local.lockedSet.add(id);
        action = 'add';
      }
      const lEl = document.getElementById('forge-status-lock');
      if (lEl) lEl.textContent = local.lockedSet.size > 0 ? String(local.lockedSet.size) : '—';
      recomputeFocus();
      // Phase 5B M-F2 — persist on every toggle.
      saveRuntimeState();
      // Phase 19C (2026-05-21) — notify the deity-tab observer with
      // the action type so it can add / remove / clear tabs.
      // Defensive try/catch so a panel-side error never breaks lock.
      if (typeof local._onLockChange === 'function') {
        try { local._onLockChange(changedId, action); } catch (e) { /* ignore */ }
      }
    }

    // ── Interaction handlers ────────────────────────────
    function attachInteractions() {
      // Pointer move → hover hit-test.
      // Cache rect to avoid layout thrashing per pointermove. The
      // refresh hooks below keep it in sync.
      let canvasRect = canvas.getBoundingClientRect();
      const refreshRect = () => { canvasRect = canvas.getBoundingClientRect(); };

      // Phase 21AD (2026-05-22) — `canvasRect` was being computed
      // ONCE at attach time and never refreshed. When the side
      // panel opened (or closed), the canvas shifted by ~360 px but
      // canvasRect stayed at the old position. Result: clicks +
      // hovers used stale coordinates and either missed the node
      // under the cursor OR hit the wrong node. The "double-click
      // to select" + "click anywhere first" symptoms BOTH trace
      // back to this single staleness.
      //
      // Three refresh hooks, no per-frame cost on the hot path:
      //   • pointerenter — definitive sync when cursor enters canvas
      //   • pointerdown  — definitive sync just before click hit-test
      //   • ResizeObserver — covers viewport + panel-toggle reflow
      // Cheaper than calling getBoundingClientRect on every pointermove.
      canvas.addEventListener('pointerenter', refreshRect);
      // (pointerdown's refreshRect lives at its handler top — see below.)
      try {
        if (window.ResizeObserver) {
          const rectObs = new ResizeObserver(refreshRect);
          rectObs.observe(canvas);
          if (canvas.parentElement) rectObs.observe(canvas.parentElement);
        }
      } catch (_) { /* ignore — fallback: pointerenter still fires */ }

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
        // Phase 21AD — definitive rect sync right before the click
        // hit-test reads it. Belt-and-braces with pointerenter +
        // ResizeObserver above; keeps the click correct even if a
        // layout shift happened between enter and click (e.g. a tab
        // chevron animated in while the cursor was held still).
        refreshRect();
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
          // Phase 21AG (2026-05-22) — INSTANT click. Post-hoc
          // double-click detection — no defer, ever. The 21AF
          // deferral introduced a 280 ms visual lag between click
          // and "selected" appearance which felt broken. The new
          // semantics:
          //   • Click on node  → toggleLock IMMEDIATELY (instant
          //                       visual feedback). The pulse FX,
          //                       tab pulse, side-panel pulse-pulse
          //                       all fire on the spot. None of
          //                       these are dependent on a timer.
          //   • Click on empty → instant clear (unchanged).
          //   • Second click on the SAME node within 280 ms →
          //     "double-click intent". The first click's toggle
          //     already executed; the second click would normally
          //     toggle BACK. Instead, we detect the double and
          //     REPAIR the state: ensure the lock is added, mark
          //     the tab active, open the side panel.
          // This means a double-click on an already-locked node
          // briefly unlocks-then-relocks (the unlock blip is one
          // frame, well below the 280 ms detection window). For
          // unlocked-then-double-clicked, the lock is added by the
          // first click and just stays — no blip at all.
          const DBL_WINDOW_MS = 280;
          const now = (performance && performance.now) ? performance.now() : Date.now();
          if (hit == null) {
            local._lastClickId = null;
            local._lastClickT  = 0;
            toggleLock(null);
            return;
          }
          const sameAsLast   = local._lastClickId === hit;
          const withinWindow = local._lastClickT && (now - local._lastClickT) < DBL_WINDOW_MS;
          // ALWAYS toggle first — selection feedback is instant.
          toggleLock(hit);
          if (sameAsLast && withinWindow) {
            // DOUBLE detected post-hoc. The toggle just fired may
            // have removed the lock (if click #1 added it and
            // click #2 removed it). Restore + open the panel.
            if (!local.lockedSet.has(hit)) {
              toggleLock(hit);   // re-add
            }
            local.openTabId = hit;
            if (typeof local._setPanelOpen   === 'function') local._setPanelOpen(true);
            if (typeof local._renderTabs     === 'function') local._renderTabs();
            if (typeof local._renderSidePanel=== 'function') local._renderSidePanel();
            local._lastClickId = null;
            local._lastClickT  = 0;
          } else {
            // Single click — record for the next click's window check.
            local._lastClickId = hit;
            local._lastClickT  = now;
          }
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
      // Phase 18 (2026-05-21) — 6 tiers now. T4 + T5 share the smallest
      // (tier4) disk radius so the visual tiering of the disk SIZE still
      // spans only 4 levels; the extra granularity is purely for label
      // reveal pacing, not disk hierarchy.
      const r4 = local.params.node_radius_tier4;
      return [
        local.params.node_radius_tier1,
        local.params.node_radius_tier2,
        local.params.node_radius_tier3,
        r4,
        r4,
        r4,
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
        tierRadii:    tierRadiiFromParams(),
        camScale:     (camera && camera.state) ? camera.state.scale : 1,
        minScreenPx:  local.params.node_min_screen_px,
        maxScreenPx:  local.params.node_max_screen_px,
        // Phase 21S (2026-05-22) — current ux-mode color override.
        // Null when colorMode === 'default' (preserve baked colors).
        colorOverride: currentColorOverride(),
      };
    }
    // Phase 21S (2026-05-22) — return the active family→hex map for
    // the selected color theme (null = default, use baked).
    function currentColorOverride() {
      const m = (local.uxMode && local.uxMode.colorMode) || 'default';
      return COLOR_THEMES[m] || null;
    }
    function currentFamilyOrder() {
      const m = (local.uxMode && local.uxMode.orderMode) || 'opposites';
      return ORDER_THEMES[m] || FAMILY_ORDER;
    }
    function currentDistribution() {
      const m = (local.uxMode && local.uxMode.distributionMode) || 'organic';
      return DISTRIBUTION_THEMES[m] || 'organic';
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
    // Phase 21R (2026-05-22) — when a node is HOVERED, the visible
    // active wires become the cue for "this is what's connected".
    // Boost their opacity to 1.0 so they read decisively over the
    // BG video. When the focus is from LOCK only (no hover), keep
    // the calmer baseline (~0.75) so a sustained selection isn't
    // shouty. Boost is a one-line palette multiplier — no shader
    // or per-edge state change.
    const HOVER_BOOST_ALPHA = 1.0;
    function hotPaletteFromParams() {
      const p = local.params;
      // Phase 22-AH (2026-05-25) — audit B fix. Active wires now
      // reach alpha 1.0 on EITHER hover OR lock-only focus. John:
      // "the wires NEVER get the 1 opacity value." Audit traced
      // the cap to per-bucket `active_opacity_*` defaults (0.74–
      // 0.90) gated to hover only. New rule: any active focus
      // (hover OR locked set non-empty) boosts the palette so a
      // sustained selection reads decisively.
      const hasHover = (local.hoverId != null);
      const hasLock  = !!(local.lockedSet && local.lockedSet.size > 0);
      const boost = hasHover || hasLock;
      return BUCKET_ORDER.map(b => {
        const baseA = p['active_opacity_' + b];
        const a = boost ? Math.min(1.0, Math.max(baseA, HOVER_BOOST_ALPHA)) : baseA;
        return hex2rgba(p['active_color_' + b], a);
      });
    }
    function labelHierarchyFromParams() {
      const p = local.params;
      // Phase TL-2 Step 5 (2026-05-24) — timeline-mode label policy.
      // The wheel uses a 6-tier zoom ladder (T0 always-on, T1 at
      // 120% zoom, ...) tuned for the radial wheel's spatial
      // density. In timeline mode that policy hides most deity
      // names at the overview zoom (gizmo 20%) precisely when the
      // user needs them to identify dots. Per John 2026-05-24:
      // "the nodes here DON'T fade out — until we are there, we
      // need to see them here." So timeline mode drops ALL tier
      // thresholds to a low value — every label is eligible at
      // any zoom; collision-prune still trims at extreme overlap.
      if (local.layoutId === 'timeline') {
        return {
          tierZoomThresholds: [0.01, 0.05, 0.10, 0.15, 0.20, 0.25],
          maxLabels:          p.label_idle_max,
          labelSizePx:        p.label_size,
          collisionPaddingPx: p.label_collision_pad,
        };
      }
      return {
        // Phase 18 (2026-05-21) — 6-tier ladder. The bottom 60% of
        // nodes (former single "tier 3") is now split into 3 sub-
        // tiers (T3/T4/T5) so the long-tail reveal at deep zoom is
        // progressive instead of a 400-node cliff.
        tierZoomThresholds: [
          p.label_idle_zoom_tier1,
          p.label_idle_zoom_tier2,
          p.label_idle_zoom_tier3,
          p.label_idle_zoom_tier4,
          p.label_idle_zoom_tier5,
          p.label_idle_zoom_tier6,
        ],
        maxLabels:          p.label_idle_max,
        labelSizePx:        p.label_size,
        collisionPaddingPx: p.label_collision_pad,
      };
    }

    // Rebake node instances + glyph DOM (called when tier radii,
    // glyph tint, screen-px clamps, OR camera scale change).
    function rebakeNodes() {
      // Phase 5B M-F1 + AT-11 diagnostic — count every rebake so
      // _forgeDebug.countRebakeNodes() can verify mode-switch
      // increments by exactly 1 (and not 2, which would prove the
      // M-F1 spurious-rebake-on-old-mode bug is back).
      local.rebakeNodesCount = (local.rebakeNodesCount || 0) + 1;
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
      // Phase 11 (2026-05-21) — preserve timeline HIDDEN on zoom rebake.
      // Without this, rebakeNodes (fired by camera.onChange when
      // zoom drifts past the N-aware threshold) would reset
      // out-of-range nodes from state=2 (HIDDEN) back to state=1
      // (FADED). User report: "the hidden nodes appear on zoom back."
      applyTimelineHiddenOverride(np.idIndex, states, local.focusedSet);
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
