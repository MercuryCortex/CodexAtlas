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
          // Phase 11 — Year-0 reference tick. Positioned at the
          // fraction along the track where year 0 sits. Hidden via
          // display:none when bounds don't straddle 0.
          '<div class="forge-scrub-year-zero" id="forge-scrub-year-zero" title="Year 0"></div>' +
          '<div class="forge-scrub-thumb forge-scrub-in-thumb"     id="forge-scrub-in-thumb"     data-handle="in"></div>' +
          '<div class="forge-scrub-thumb forge-scrub-center-thumb" id="forge-scrub-center-thumb" data-handle="center"></div>' +
          '<div class="forge-scrub-thumb forge-scrub-out-thumb"    id="forge-scrub-out-thumb"    data-handle="out"></div>' +
        '</div>' +
      '</div>',
      '<div class="forge-scrub-box" id="forge-scrub-out"     title="OUT: upper bound of date range">—</div>',
      '<div class="forge-scrub-box forge-scrub-present" id="forge-scrub-present" title="PRESENT: scrub playhead">—</div>',
    ].join('');
    stage.appendChild(bottomBar);

    // Phase 20F (2026-05-21) — backdrop image (star-field / nebula).
    // Sits BELOW the canvas in z-order so the wheel paints on top.
    // syncBackgroundImage() repositions + rescales + fades per
    // camera change: invisible at scale ≥ 0.50, fades in to full
    // opacity by scale ≤ 0.07 (max zoom-out). The image is anchored
    // at the wheel centre in world space, sized so it fills the
    // viewport when scale = 0.07.
    const bgImage = document.createElement('img');
    bgImage.className = 'forge-bg-image';
    bgImage.src = '_assets/bg/bg-a01.jpg?v=20260521';
    bgImage.alt = '';
    bgImage.draggable = false;
    stage.appendChild(bgImage);

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

    // Phase 19B (2026-05-21) — Forge uses the existing GLOBAL
    // aside.detail panel from index.html for the deity inspector.
    // No second panel inside .forge-stage (the earlier Phase 19
    // duplicate was removed once we found the global one already
    // existed and is shared with the other views). See
    // wireSidePanel() below for the content render + pulse-on-lock
    // hook wiring.

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
        const driftBand = N < 1000 ? 0.05 : N < 10000 ? 0.15 : 0.30;
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
          // Phase 5B M-F2 (2026-05-20) — persist mode on change.
          // saveRuntimeState reads the current local.mode.id +
          // any preserved-or-clamped timeline (refreshBounds was
          // called inside rebuildForMode) + the (now-cleared)
          // lockedSet.
          saveRuntimeState();
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

      // Phase 13 (2026-05-21) — Wire-color legend with nested
      // explainer tooltips. Reads bucket hexes from PARAM_DEFAULTS
      // so there's a single source of truth for color values.
      wireLegend();
      // Phase 14 (2026-05-21) — On-canvas hover thumbnail card.
      wireHoverCard();
      // Phase 19 (2026-05-21) — Right-edge deity inspector panel.
      wireSidePanel();

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
        // Also sync the mode dropdown to the saved mode (if any).
        const modeSelectEl2 = document.getElementById('forge-status-mode');
        if (modeSelectEl2 && local.mode && local.mode.id) {
          modeSelectEl2.value = local.mode.id;
        }
      }

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
      local.mode.hullData = (graph.buildFamilyHulls)
        ? graph.buildFamilyHulls(nodePack, modeNodeById, lay.wedges)
        : { hulls: [], center: { x: 0, y: 0 }, innerRadius: 0, outerRadius: 0, dividers: [] };
      rebuildHullElements();

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
      // Phase 5B M-F5 (2026-05-20) — eager search index for the
      // new mode. O(N) one-shot; findBestMatch then walks this
      // instead of re-lowercasing strings + looking up adjacency
      // on every call.
      buildSearchIndex();
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
    let hullDefs, hullPolysG, hullDividersG, hullLabelsG;
    function ensureHullStructure() {
      if (hullDefs) return;
      hullDefs       = document.createElementNS(SVG_NS, 'defs');
      hullDefs.setAttribute('id', 'forge-hull-defs');
      hullPolysG     = document.createElementNS(SVG_NS, 'g');
      hullPolysG.setAttribute('id', 'forge-hull-polys');
      hullDividersG  = document.createElementNS(SVG_NS, 'g');
      hullDividersG.setAttribute('id', 'forge-hull-dividers');
      hullLabelsG    = document.createElementNS(SVG_NS, 'g');
      hullLabelsG.setAttribute('id', 'forge-hull-labels');
      hullsOverlay.appendChild(hullDefs);
      hullsOverlay.appendChild(hullPolysG);
      hullsOverlay.appendChild(hullDividersG);
      hullsOverlay.appendChild(hullLabelsG);
    }
    function rebuildHullElements() {
      ensureHullStructure();
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
        // Phase 20C (2026-05-21) — separator color faint cool-blue
        // + wider fade zone (20% on each end, was 15%). Fully
        // opaque in the central 60% of the line, ramps to 0 in
        // the outer 20% on each side.
        const stopColors = [
          ['0%',   'stop-color:#6f8aaf;stop-opacity:0'],
          ['20%',  'stop-color:#6f8aaf;stop-opacity:0.55'],
          ['80%',  'stop-color:#6f8aaf;stop-opacity:0.55'],
          ['100%', 'stop-color:#6f8aaf;stop-opacity:0'],
        ];
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
      hullsOverlay.setAttribute('viewBox', '0 0 ' + vp.w + ' ' + vp.h);
      hullsOverlay.setAttribute('width',  vp.w);
      hullsOverlay.setAttribute('height', vp.h);
      const camScale = camera.state.scale;
      // Zoom fade for the WHOLE hulls overlay — overview chrome
      // only. Fades out only at deep zoom (≥ 3.0) so the pie
      // slices read cleanly at default + slightly-zoomed-in
      // viewing. Phase 20F (2026-05-21) — the family LABELS
      // have their own zoom fade (set further down inside this
      // function) so the pie slices can stay visible at small
      // scales while the labels fade out separately.
      const fade = camScale <= 2.0 ? 1.0
                 : camScale >= 3.0 ? 0.0
                 : (3.0 - camScale) / 1.0;
      hullsOverlay.style.opacity = fade.toFixed(3);
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
        polyEl.setAttribute('d', d);
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
      const LABEL_OUTSIDE_PAD = 24;
      let labelFade;
      if      (camScale >= 0.50) labelFade = 1;
      else if (camScale <= 0.25) labelFade = 0;
      else                       labelFade = (camScale - 0.25) / (0.50 - 0.25);
      hullLabelsG.style.opacity = labelFade.toFixed(3);
      const labelGroups = hullLabelsG.children;
      for (let i = 0; i < data.hulls.length && i < labelGroups.length; i++) {
        const h = data.hulls[i];
        const a = (h.wedgeCenter != null) ? h.wedgeCenter : h.centroidAngle;
        const rPx = pieOuterPx + LABEL_OUTSIDE_PAD;
        const lx = centerScreen.x + Math.cos(a) * rPx;
        const ly = centerScreen.y + Math.sin(a) * rPx;
        const labelEl = labelGroups[i].firstChild;
        labelEl.setAttribute('x', lx.toFixed(1));
        labelEl.setAttribute('y', ly.toFixed(1));
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
      const INNER_EXTRA = 30;  // dividers still poke a bit further inward
      const lines = hullDividersG.children;
      for (let i = 0; i < data.dividers.length && i < lines.length; i++) {
        const d = data.dividers[i];
        const a = d.angle;
        const r0 = Math.max(0, pieInnerPx - INNER_EXTRA);
        const r1 = pieOuterPx;
        const x1 = centerScreen.x + Math.cos(a) * r0;
        const y1 = centerScreen.y + Math.sin(a) * r0;
        const x2 = centerScreen.x + Math.cos(a) * r1;
        const y2 = centerScreen.y + Math.sin(a) * r1;
        const line = lines[i];
        line.setAttribute('x1', x1.toFixed(1));
        line.setAttribute('y1', y1.toFixed(1));
        line.setAttribute('x2', x2.toFixed(1));
        line.setAttribute('y2', y2.toFixed(1));
        const grad = document.getElementById('forge-hull-divgrad-' + i);
        if (grad) {
          grad.setAttribute('x1', x1.toFixed(1));
          grad.setAttribute('y1', y1.toFixed(1));
          grad.setAttribute('x2', x2.toFixed(1));
          grad.setAttribute('y2', y2.toFixed(1));
        }
      }
    }

    // ════════════════════════════════════════════════════════════
    //  Backdrop image  —  Phase 20F (2026-05-21)
    // ════════════════════════════════════════════════════════════
    //  A star-field / nebula image anchored at the wheel's WORLD
    //  centre. It scales WITH the camera (so when the user zooms
    //  out the image grows and starts to fill the frame) and FADES
    //  IN as scale drops from 0.50 → 0.07. Above 0.50 it's
    //  invisible (the wheel is the focus). Below 0.07 it's at full
    //  opacity (the wheel is a small thing inside the cosmos).
    //
    //  IMPLEMENTATION
    //  - Image is positioned with left/top + width/height so the
    //    centre of the image sits at the WORLD-zero point projected
    //    to screen.
    //  - At scale = 0.07, image fills the larger viewport dimension.
    //    At any other scale, image size = (vp.max / 0.07) * scale.
    //  - Opacity = linear interpolation between scale 0.50 (0) and
    //    scale 0.07 (1).
    // ════════════════════════════════════════════════════════════
    function syncBackgroundImage() {
      if (!bgImage) return;
      const vp = local.lastSize;
      if (!vp.w || !vp.h) return;
      if (!camera || !camera.state) return;
      const camScale = camera.state.scale;
      // Opacity ramp: invisible above 0.50, full below 0.07.
      let bgFade;
      if      (camScale >= 0.50) bgFade = 0;
      else if (camScale <= 0.07) bgFade = 1;
      else                       bgFade = (0.50 - camScale) / (0.50 - 0.07);
      if (bgFade <= 0.001) {
        bgImage.style.opacity = '0';
        return;
      }
      // Size: COVER-FIT the viewport at scale = 0.07 (Phase 20H,
      // 2026-05-21 — was max(vp.w, vp.h), which only reached the
      // larger viewport dimension and left the corners dark on
      // non-square viewports). For a square image to fully cover a
      // rectangular viewport, the image side must equal the
      // viewport DIAGONAL — every corner is then inside the image.
      // We then scale that base size linearly with camera, so at
      // scale = 0.07 the image exactly covers, and at higher zoom
      // it extends well past the viewport edges.
      const diagVp  = Math.hypot(vp.w, vp.h);
      const imgSize = (diagVp / 0.07) * camScale;
      // Anchor: world (0, 0) → screen.
      const centerScreen = camera.worldToScreen(0, 0, vp);
      bgImage.style.opacity = bgFade.toFixed(3);
      bgImage.style.width   = imgSize.toFixed(1) + 'px';
      bgImage.style.height  = imgSize.toFixed(1) + 'px';
      bgImage.style.left    = (centerScreen.x - imgSize / 2).toFixed(1) + 'px';
      bgImage.style.top     = (centerScreen.y - imgSize / 2).toFixed(1) + 'px';
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
      const idx       = local.mode.nodePacked.idIndex;
      local.focusedSet  = graph.focusedSetFor(local.hoverId, local.lockedSet, local.mode.adjacency);
      local.selectedSet = computeSelectedSet(local.hoverId, local.lockedSet);
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
        };
        window.localStorage.setItem(LS_RUNTIME_KEY, JSON.stringify(state));
      } catch (e) { /* ignore quota / privacy mode */ }
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
    function wireLegend() {
      const btn     = document.getElementById('forge-legend-btn');
      const panel   = document.getElementById('forge-legend-panel');
      const tooltip = document.getElementById('forge-legend-tooltip');
      if (!btn || !panel || !tooltip) return;
      // Per-bucket meta. Order = BUCKET_ORDER (shader bucket_index).
      // `title` is the row label; `body` is the explainer-tooltip
      // text (what it means + our criteria for using it).
      const BUCKETS = [
        { key: 'transmission',  param: 'active_color_transmission', title: 'Transmission',
          body: 'One tradition adopted from another. Documented contact, dated borrowing, or direct lineage. Use when there is evidence A INFLUENCED B (texts cite, archaeology, missionary record, trade-route attestation).' },
        { key: 'parallel',      param: 'active_color_parallel',     title: 'Parallel',
          body: 'Independent same-shape phenomena across traditions with NO documented contact. Use when two cultures separately arrived at structurally identical motif/figure/practice — strongest when geographically isolated.' },
        { key: 'association',   param: 'active_color_association',  title: 'Association',
          body: 'Co-appearance in the same texts, sites, or rituals without one causing the other. Use when items recur together in primary sources but the relationship is contextual, not generative.' },
        { key: 'kinship',       param: 'active_color_kinship',      title: 'Kinship',
          body: 'Family relationships INSIDE a pantheon or tradition: parent-child, sibling, consort. Use only for in-tradition genealogy.' },
        { key: 'attestation',   param: 'active_color_attestation',  title: 'Attestation',
          body: 'Source → claim. One node is a textual or archaeological witness to another. Use when a text/inscription/artifact attests to a deity, practice, or event.' },
        { key: 'polemic',       param: 'active_color_polemic',      title: 'Polemic',
          body: 'Contested or contradicting relationship. One tradition denies, refutes, or polemicizes against another. Use for theological disputes, heresies, refutations.' },
        { key: 'fusion',        param: 'active_color_fusion',       title: 'Fusion',
          body: 'Two figures or practices merged into one new identity over time. Use when historical blending produced a combined entity that absorbs both originals — e.g. Serapis = Osiris + Apis; Hermes Trismegistus = Hermes + Thoth.' },
      ];
      // Build rows ONCE. Colors read from local.params so the
      // legend stays in sync if PARAM_DEFAULTS ever changes.
      const rowsHtml = BUCKETS.map(b => {
        const hex = (local.params && local.params[b.param]) || '#999999';
        return '<div class="forge-legend-row" data-bucket="' + b.key + '">'
          + '<span class="forge-legend-swatch" style="background:' + hex + '"></span>'
          + '<span class="forge-legend-name">' + b.title + '</span>'
          + '</div>';
      }).join('');
      panel.innerHTML = rowsHtml;
      // Map for fast lookup on hover.
      const bodyByKey = Object.create(null);
      for (const b of BUCKETS) bodyByKey[b.key] = b.body;

      let isOpen = false;
      function openPanel()  {
        isOpen = true;
        btn.setAttribute('aria-expanded', 'true');
        panel.setAttribute('aria-hidden', 'false');
        panel.style.display = '';
      }
      function closePanel() {
        isOpen = false;
        btn.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-hidden', 'true');
        panel.style.display = 'none';
        hideTooltip();
      }
      closePanel();

      btn.addEventListener('click', () => {
        if (isOpen) closePanel(); else openPanel();
      });

      // Row-hover → explainer tooltip.
      // Phase 15 (2026-05-21) — viewport-clamped positioning. Default
      // placement is to the right of the legend panel, top-aligned
      // with the hovered row. But the tooltip can be tall (200+ px),
      // and the legend opens NEAR the bottom of the screen — so the
      // default position often overflowed BELOW the viewport. Fix:
      // measure the tooltip's actual height after rendering content,
      // then clamp into [margin, viewport - tooltipHeight - margin].
      // Same for the horizontal axis: if the right side would
      // overflow, place it to the LEFT of the panel instead.
      function showTooltipFor(row) {
        const key = row.getAttribute('data-bucket');
        const body = bodyByKey[key];
        if (!body) return;
        tooltip.textContent = body;
        // Reveal first so we can measure dimensions.
        tooltip.style.display = '';
        tooltip.setAttribute('aria-hidden', 'false');
        const rPanel = panel.getBoundingClientRect();
        const rRow   = row.getBoundingClientRect();
        const rTip   = tooltip.getBoundingClientRect();
        const margin = 8;
        // Horizontal: default to the right of the panel; if that
        // would overflow the right edge, switch to the left of the
        // panel; clamp to viewport in either case.
        let left = rPanel.right + margin;
        if (left + rTip.width + margin > window.innerWidth) {
          left = rPanel.left - rTip.width - margin;
        }
        if (left < margin) left = margin;
        // Vertical: top-align with the hovered row, then clamp so
        // the tooltip fits inside the viewport. If the row sits near
        // the bottom, the tooltip slides up until its bottom touches
        // the viewport bottom (minus margin).
        let top = rRow.top;
        if (top + rTip.height + margin > window.innerHeight) {
          top = window.innerHeight - rTip.height - margin;
        }
        if (top < margin) top = margin;
        tooltip.style.left = left + 'px';
        tooltip.style.top  = top  + 'px';
      }
      function hideTooltip() {
        tooltip.setAttribute('aria-hidden', 'true');
        tooltip.style.display = 'none';
      }
      panel.addEventListener('mouseover', (e) => {
        const row = e.target.closest('.forge-legend-row');
        if (row) showTooltipFor(row);
      });
      panel.addEventListener('mouseleave', hideTooltip);

      // Click outside → close.
      document.addEventListener('click', (e) => {
        if (!isOpen) return;
        if (e.target === btn || btn.contains(e.target)) return;
        if (panel.contains(e.target)) return;
        closePanel();
      });
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
      // ── Thumbnails cache ────────────────────────────────────
      // Wikipedia thumbnails live in _assets/thumbs_cache.json as
      // { id: { src, title, page, extract, width, height } }.
      // Fetched once at view mount; lookup on hover is then a free
      // Map.get(). The fetch is best-effort — if it fails, the card
      // still renders text but with the thumbnail row hidden.
      let thumbs = null;
      fetch('_assets/thumbs_cache.json', { cache: 'force-cache' })
        .then(r => r.ok ? r.json() : null)
        .then(j => {
          thumbs = j || {};
          // Phase 19 — share the cache with the side panel so both
          // surfaces lookup from the same in-memory map.
          local._thumbsCache = thumbs;
        })
        .catch(() => { thumbs = {}; local._thumbsCache = {}; });

      const card = document.createElement('div');
      card.className   = 'forge-hover-card';
      card.id          = 'forge-hover-card';
      card.style.display = 'none';
      // Layout: thumbnail on top, then header (name + tradition),
      // then the data rows (description, connections, date, place).
      card.innerHTML = ''
        + '<div class="forge-hover-card-thumb">'
        +   '<img id="forge-hover-card-img" alt="" />'
        + '</div>'
        + '<div class="forge-hover-card-body">'
        +   '<div class="forge-hover-card-name" id="forge-hover-card-name"></div>'
        +   '<div class="forge-hover-card-tradition" id="forge-hover-card-tradition"></div>'
        +   '<div class="forge-hover-card-desc" id="forge-hover-card-desc"></div>'
        +   '<div class="forge-hover-card-wires" id="forge-hover-card-wires"></div>'
        +   '<div class="forge-hover-card-meta" id="forge-hover-card-meta"></div>'
        + '</div>';
      stage.appendChild(card);
      const img       = card.querySelector('#forge-hover-card-img');
      const nameEl    = card.querySelector('#forge-hover-card-name');
      const tradEl    = card.querySelector('#forge-hover-card-tradition');
      const descEl    = card.querySelector('#forge-hover-card-desc');
      const wiresEl   = card.querySelector('#forge-hover-card-wires');
      const metaEl    = card.querySelector('#forge-hover-card-meta');

      // Param-derived bucket → hex color map. Built once per show
      // call so the legend stays the SSOT.
      function bucketHex(bucket) {
        const p = local.params || {};
        return p['active_color_' + bucket] || '#999999';
      }
      // Catchy "role" / brief-description picker. Tries multiple
      // YAML fields in vault-convention order. Empty string if none.
      function pickDescription(n) {
        const candidates = [
          n.role, n.description, n.brief, n.subtitle,
          Array.isArray(n.domains) ? n.domains.join(', ') : null,
        ];
        for (const c of candidates) if (c && typeof c === 'string') return c;
        return '';
      }
      function pickPlace(n) {
        return n.region
            || n['place-of-origin']
            || n['originating-place']
            || n.location
            || n.origin
            || '';
      }
      function pickTradition(n) {
        return n.tradition || n.family || n.religion || '';
      }
      // Year formatter — same shape as the scrubber's formatYear.
      function fmtYear(y) {
        if (typeof y !== 'number' || !isFinite(y)) return '';
        if (y < 0) return Math.abs(y) + ' BCE';
        if (y === 0) return '0';
        return y + ' CE';
      }
      function pickDate(n) {
        // Normalized fields from build_data.py first; YAML raw as fallback.
        const e = (typeof n.date_earliest === 'number') ? n.date_earliest
                : (typeof n['period-active-earliest'] === 'number') ? n['period-active-earliest']
                : null;
        const l = (typeof n.date_latest === 'number') ? n.date_latest
                : (typeof n['period-active-latest'] === 'number') ? n['period-active-latest']
                : null;
        if (e == null && l == null) return '';
        if (e != null && l != null && e !== l) return fmtYear(e) + ' – ' + fmtYear(l);
        return fmtYear(e != null ? e : l);
      }
      // Count edges connected to `id`, grouped by bucket. Walks
      // local.mode.edges once. O(E) per show — cheap at 3k edges,
      // could be precomputed if hover frequency demands it.
      function countWires(id) {
        const counts = Object.create(null);
        const edges = local.mode && local.mode.edges;
        if (!edges) return counts;
        const EB = window.EDGE_BUCKET || {};
        for (let i = 0; i < edges.length; i++) {
          const e = edges[i];
          if (e.source !== id && e.target !== id) continue;
          const b = EB[e.type] || 'association';
          counts[b] = (counts[b] || 0) + 1;
        }
        return counts;
      }
      // Bucket render order — matches the legend's BUCKET_ORDER.
      const BUCKET_ORDER = ['transmission','parallel','association','kinship','attestation','polemic','fusion'];

      // ── Position state ──────────────────────────────────────
      // Phase 17 (2026-05-21) — anchor-once positioning.
      //
      // The card's anchor quadrant (top-right / top-left / bottom-
      // right / bottom-left of the cursor) is picked ONCE at show
      // time and STAYS THERE while the cursor moves. mousemove
      // just translates the card by (cursor + anchor offset) using
      // cached dimensions — no re-measurement, no quadrant
      // re-evaluation, no flicker near screen corners.
      //
      // Re-flip happens only when the cursor moves far enough that
      // the current anchor genuinely doesn't fit (the card would
      // overflow the viewport). That's hysteresis built in for
      // free.
      //
      // Cached dimensions: re-measured (1 layout read) only when
      // content changes — on showFor() and on image-load callback.
      // mousemove does ZERO layout reads. rAF-coalesced so we
      // never write transform more than once per frame.
      //
      // OFFSET = a fixed pad large enough that even a max-clamped
      // selected disk (22 px × 1.5 size_mult ≈ 33 px) doesn't sit
      // under the card. Generous 38 px gives breathing room.
      const OFFSET = 38;
      const MARGIN = 8;

      let showId      = 0;     // setTimeout token
      let posRafId    = 0;     // rAF coalesce token for position updates
      let lastClientX = 0;
      let lastClientY = 0;
      let cachedW     = 0;     // last measured card width
      let cachedH     = 0;     // last measured card height
      let anchorX     = +1;    // +1 = right of cursor, -1 = left
      let anchorY     = +1;    // +1 = below cursor, -1 = above

      function hide() {
        if (showId) { clearTimeout(showId); showId = 0; }
        if (posRafId) { cancelAnimationFrame(posRafId); posRafId = 0; }
        card.style.display = 'none';
      }

      // Single layout read. Stores width + height. Call AFTER
      // content swap and image load — never on mousemove.
      function measure() {
        const r = card.getBoundingClientRect();
        if (r.width > 0)  cachedW = r.width;
        if (r.height > 0) cachedH = r.height;
      }

      // Pick the anchor quadrant that fully fits the card at the
      // current cursor position. Default preference: bottom-right.
      // Falls back through the other 3 quadrants in order. Final
      // fallback: bottom-right + clamp on output.
      function pickAnchor() {
        const w = cachedW, h = cachedH;
        const winW = window.innerWidth, winH = window.innerHeight;
        const cx = lastClientX, cy = lastClientY;
        const tries = [[+1, +1], [-1, +1], [+1, -1], [-1, -1]];
        for (const [qx, qy] of tries) {
          let x = qx > 0 ? cx + OFFSET            : cx - OFFSET - w;
          let y = qy > 0 ? cy + OFFSET            : cy - OFFSET - h;
          if (x >= MARGIN && x + w + MARGIN <= winW
              && y >= MARGIN && y + h + MARGIN <= winH) {
            anchorX = qx;
            anchorY = qy;
            return;
          }
        }
        anchorX = +1; anchorY = +1;
      }

      // Write the transform. No layout reads. Uses cached dims +
      // current anchor + last cursor. If the chosen anchor would
      // now overflow (cursor crossed the edge), flips ONCE and
      // re-evaluates — that's the hysteresis line.
      function applyTransform() {
        const w = cachedW, h = cachedH;
        if (!w || !h) return;
        const winW = window.innerWidth, winH = window.innerHeight;
        const cx = lastClientX, cy = lastClientY;
        let x = anchorX > 0 ? cx + OFFSET : cx - OFFSET - w;
        let y = anchorY > 0 ? cy + OFFSET : cy - OFFSET - h;
        // Flip X if overflowing.
        if (x < MARGIN || x + w + MARGIN > winW) {
          anchorX = -anchorX;
          x = anchorX > 0 ? cx + OFFSET : cx - OFFSET - w;
        }
        // Flip Y if overflowing.
        if (y < MARGIN || y + h + MARGIN > winH) {
          anchorY = -anchorY;
          y = anchorY > 0 ? cy + OFFSET : cy - OFFSET - h;
        }
        // Hard clamp to keep card inside viewport even if both
        // sides overflow (e.g. tiny viewport).
        if (x < MARGIN) x = MARGIN;
        if (x + w + MARGIN > winW) x = winW - w - MARGIN;
        if (y < MARGIN) y = MARGIN;
        if (y + h + MARGIN > winH) y = winH - h - MARGIN;
        card.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
      }

      function schedulePosition() {
        if (posRafId) return;
        posRafId = requestAnimationFrame(() => {
          posRafId = 0;
          applyTransform();
        });
      }

      function showFor(id) {
        const m = local.mode;
        const node = (m && m.nodesById && m.nodesById.get) ? m.nodesById.get(id) : null;
        if (!node) return;
        // ── Header
        nameEl.textContent = node.name || id;
        tradEl.textContent = pickTradition(node);
        tradEl.style.display = tradEl.textContent ? '' : 'none';
        // ── Description: try YAML role/description first; fall back
        //    to the cache's Wikipedia extract (first sentence only).
        let desc = pickDescription(node);
        if (!desc && thumbs && thumbs[id] && thumbs[id].extract) {
          const ext = String(thumbs[id].extract);
          // First sentence; cap at 180 chars to keep card compact.
          const cut = ext.split(/(?<=[.!?])\s/)[0] || ext;
          desc = cut.length > 180 ? cut.slice(0, 177) + '…' : cut;
        }
        descEl.textContent = desc || '';
        descEl.style.display = desc ? '' : 'none';
        // ── Wires (colored pills with bucket-edge counts)
        const counts = countWires(id);
        const pills = [];
        for (const b of BUCKET_ORDER) {
          const n = counts[b] || 0;
          if (!n) continue;
          pills.push(
            '<span class="forge-hover-card-wire" style="color:' + bucketHex(b) + '">'
            +   '<span class="forge-hover-card-wire-dot" style="background:' + bucketHex(b) + '"></span>'
            +   n
            + '</span>'
          );
        }
        wiresEl.innerHTML = pills.join('');
        wiresEl.style.display = pills.length ? '' : 'none';
        // ── Meta (Date + Place)
        const date  = pickDate(node);
        const place = pickPlace(node);
        const metaParts = [];
        if (date)  metaParts.push('<div class="forge-hover-card-meta-row"><span class="forge-hover-card-meta-k">Date</span><span class="forge-hover-card-meta-v">' + date  + '</span></div>');
        if (place) metaParts.push('<div class="forge-hover-card-meta-row"><span class="forge-hover-card-meta-k">Place</span><span class="forge-hover-card-meta-v">' + place + '</span></div>');
        metaEl.innerHTML = metaParts.join('');
        metaEl.style.display = metaParts.length ? '' : 'none';
        // ── Thumbnail: lookup the URL in the cache. The cache's
        //    `src` is a fully-resolved Wikipedia URL; we don't need
        //    a probe.onload chain — just set src directly. onload
        //    re-measures + repositions (image adds height). onerror
        //    hides the image.
        const entry = (thumbs && thumbs[id]) ? thumbs[id] : null;
        img.style.display = 'none';
        img.removeAttribute('src');
        if (entry && entry.src) {
          img.onload  = function () {
            img.style.display = 'block';
            // Image just added height — re-measure + reposition.
            measure();
            schedulePosition();
          };
          img.onerror = function () {
            img.style.display = 'none';
            measure();
            schedulePosition();
          };
          img.src = entry.src;
        }
        // ── Show + initial position
        card.style.display = '';
        measure();
        pickAnchor();
        applyTransform();
      }

      // mousemove on canvas: track cursor + schedule a position update.
      canvas.addEventListener('mousemove', (e) => {
        lastClientX = e.clientX;
        lastClientY = e.clientY;
        if (card.style.display !== 'none') schedulePosition();
      });

      // window resize invalidates anchor choice (viewport changed).
      // Recompute on next show; for now just hide so user gets a
      // fresh anchor when they hover again.
      window.addEventListener('resize', hide);

      // Drive show/hide from the existing hover pipeline. Phase 2B
      // setHoverId already coalesces; we hook into it via a hover
      // observer in local. setHoverId is the SSOT for "which node
      // is the cursor over."
      //
      // Phase 16 (2026-05-21) — show on locked nodes too. The card
      // was previously hidden when the hovered node was the locked
      // anchor (rationale: lock UI is sufficient). John pushed
      // back: when you point at a locked deity you still want the
      // info card; the lock visual + the card are complementary,
      // not redundant. Removed the lockedSet check.
      local._onHoverChange = function (id) {
        if (showId) { clearTimeout(showId); showId = 0; }
        if (!id) { hide(); return; }
        showId = setTimeout(() => { showId = 0; showFor(id); }, 150);
      };
      // Also hide on canvas leave.
      canvas.addEventListener('mouseleave', hide);
    }

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
      const inner = document.getElementById('detail-inner');
      if (!inner) return;

      // Build the floating tabs container at the viewport level.
      // Appended to body so it isn't constrained by the forge-stage
      // bounding box — that way it can shift across the panel edge
      // smoothly when the panel opens.
      const tabsEl = document.createElement('div');
      tabsEl.className = 'forge-deity-tabs';
      tabsEl.id        = 'forge-deity-tabs';
      document.body.appendChild(tabsEl);

      local.deityTabs = [];
      local.openTabId = null;

      function setPanelOpen(open) {
        // The existing global panel is collapsed via body.detail-
        // collapsed. In Forge view, our CSS hides aside.detail
        // entirely when that class is present, so toggling it is
        // the SAME as opening/closing for our purposes.
        document.body.classList.toggle('detail-collapsed', !open);
        // Sync data attribute so CSS can shift the tabs column.
        tabsEl.classList.toggle('panel-open', !!open);
      }
      // Initial state — panel closed.
      setPanelOpen(false);

      // Renders the tab stack from local.deityTabs.
      function renderTabs() {
        // Hide the whole container when empty.
        if (!local.deityTabs.length) {
          tabsEl.innerHTML = '';
          tabsEl.style.display = 'none';
          return;
        }
        tabsEl.style.display = '';
        const m = local.mode;
        const nodesById = (m && m.nodesById) ? m.nodesById : new Map();
        const safe = (s) => String(s || '').replace(/[&<>"']/g, c => (
          { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
        const html = local.deityTabs.map(id => {
          const n = nodesById.get ? nodesById.get(id) : null;
          const color = (n && (n.family_color || n.tradition_color)) || '#999';
          const title = (n && n.title) || id;
          const isActive = (id === local.openTabId);
          return '<button class="forge-deity-tab' + (isActive ? ' is-active' : '') + '"'
               + ' data-id="' + safe(id) + '"'
               + ' title="' + safe(title) + '">'
               +   '<span class="forge-deity-tab-chevron">' + (isActive ? '›' : '‹') + '</span>'
               +   '<span class="forge-deity-tab-dot" style="background:' + safe(color) + '"></span>'
               + '</button>';
        }).join('');
        tabsEl.innerHTML = html;
      }

      // Trigger pulse animation on a specific tab DOM element.
      function pulseTab(id) {
        renderTabs();   // ensure the tab exists
        const el = tabsEl.querySelector('.forge-deity-tab[data-id="' + id.replace(/"/g, '\\"') + '"]');
        if (!el) return;
        el.classList.remove('pulsing');
        void el.offsetWidth;
        el.classList.add('pulsing');
        clearTimeout(local._sidePanelPulseTimer);
        local._sidePanelPulseTimer = setTimeout(() => {
          el.classList.remove('pulsing');
        }, 2400);
      }

      // Tab click — event delegation on the container.
      tabsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.forge-deity-tab');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        if (!id) return;
        if (id === local.openTabId) {
          // Click active tab → close panel.
          local.openTabId = null;
          setPanelOpen(false);
          renderTabs();
        } else {
          // Switch to this deity.
          local.openTabId = id;
          setPanelOpen(true);
          render();
          renderTabs();
        }
      });

      // Lock-change observer — called by toggleLock with (id, action).
      // action: 'add' | 'remove' | 'clear'.
      local._onLockChange = function (id, action) {
        if (action === 'clear') {
          local.deityTabs = [];
          local.openTabId = null;
          setPanelOpen(false);
          renderTabs();
          return;
        }
        if (action === 'remove' && id != null) {
          const idx = local.deityTabs.indexOf(id);
          if (idx >= 0) local.deityTabs.splice(idx, 1);
          if (local.openTabId === id) {
            local.openTabId = null;
            setPanelOpen(false);
          }
          renderTabs();
          return;
        }
        if (action === 'add' && id != null) {
          if (local.deityTabs.indexOf(id) < 0) local.deityTabs.push(id);
          renderTabs();
          pulseTab(id);
          // If the panel is already open, switch the active deity
          // to the newest add — fresh focus wins.
          if (local.openTabId != null) {
            local.openTabId = id;
            render();
            renderTabs();
          }
          return;
        }
      };

      // Renders the deity inspector content into #detail-inner.
      function render() {
        const id = local.openTabId;
        const m = local.mode;
        const node = (id && m && m.nodesById && m.nodesById.get) ? m.nodesById.get(id) : null;
        if (!node) {
          inner.innerHTML = '<div class="empty">Select a deity to inspect.</div>';
          return;
        }
        // Field readers — use BAKED data.js fields. Falls back
        // through alternates for robustness.
        const title    = node.title || node.name || id;
        const tradition = (node.tradition || node.family || node.religion || '');
        const aka       = Array.isArray(node.aka) ? node.aka.filter(Boolean) : [];
        let desc        = (node.role || node.description || node.brief || node.subtitle || '');
        if (!desc && Array.isArray(node.domains) && node.domains.length) {
          desc = node.domains.join(', ');
        }
        const thumbSrc   = node.thumbnail || '';
        const extract    = String(node.thumb_extract || '');
        const wikiPage   = node.thumb_page || '';
        const place      = (node.region || node['place-of-origin'] || node['originating-place'] || node.location || node.origin || '');
        const domains    = Array.isArray(node.domains) ? node.domains.join(', ') : '';
        const familyCol  = (node.family_color || node.tradition_color || '#888');

        // Wire-bucket counts + per-bucket neighbor lists.
        // Each bucket: { count, neighbors: [{ id, title, family_color, dir }] }.
        // dir = 'out' (this node → other) or 'in' (other → this node).
        const buckets = Object.create(null);
        const edges = m && m.edges;
        const nodesByIdMap = (m && m.nodesById) ? m.nodesById : null;
        if (edges) {
          const EB = window.EDGE_BUCKET || {};
          for (let i = 0; i < edges.length; i++) {
            const e = edges[i];
            const isSrc = e.source === id;
            const isTgt = e.target === id;
            if (!isSrc && !isTgt) continue;
            const b = EB[e.type] || 'association';
            if (!buckets[b]) buckets[b] = { count: 0, neighbors: [] };
            buckets[b].count++;
            const otherId = isSrc ? e.target : e.source;
            const otherNode = (nodesByIdMap && nodesByIdMap.get) ? nodesByIdMap.get(otherId) : null;
            buckets[b].neighbors.push({
              id: otherId,
              title: (otherNode && (otherNode.title || otherNode.id)) || otherId,
              color: (otherNode && (otherNode.family_color || otherNode.tradition_color)) || '#888',
              dir: isSrc ? 'out' : 'in',
            });
          }
        }
        const BUCKET_ORDER = ['transmission','parallel','association','kinship','attestation','polemic','fusion'];
        const bucketHex = (b) => (local.params && local.params['active_color_' + b]) || '#999999';
        // Each bucket → a <details> block. Summary = colored pill
        // with count + bucket name. Open content = list of neighbor
        // titles (clickable to lock-and-switch to that deity).
        const safeAttr = (s) => String(s || '').replace(/[&<>"']/g, c => (
          { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
        const pills = BUCKET_ORDER.map(b => {
          const data = buckets[b];
          if (!data) return '';
          // Sort neighbors by title for predictable ordering.
          data.neighbors.sort((x, y) => x.title.localeCompare(y.title));
          // Phase 19E (2026-05-21) — item order: dot, title, dir.
          // The dot + title read as "this is the connected deity";
          // the arrow at the END reads as a direction annotation
          // rather than "this color goes via this arrow." Earlier
          // ordering (dot → arrow → title) made the arrow look
          // like it belonged to the color, not the relationship.
          const items = data.neighbors.map(n =>
            '<button class="forge-side-panel-wire-item" data-id="' + safeAttr(n.id) + '" title="Lock + inspect ' + safeAttr(n.title) + '">'
            + '<span class="forge-side-panel-wire-item-dot" style="background:' + safeAttr(n.color) + '"></span>'
            + '<span class="forge-side-panel-wire-item-title">' + safeAttr(n.title) + '</span>'
            + '<span class="forge-side-panel-wire-item-dir">' + (n.dir === 'out' ? '→' : '←') + '</span>'
            + '</button>'
          ).join('');
          return '<details class="forge-side-panel-wire" data-bucket="' + b + '" style="--bucket-color:' + bucketHex(b) + '">'
            + '<summary class="forge-side-panel-wire-summary">'
            +   '<span class="forge-side-panel-wire-dot" style="background:' + bucketHex(b) + '"></span>'
            +   '<span class="forge-side-panel-wire-count">' + data.count + '</span>'
            +   '<em class="forge-side-panel-wire-name">' + b + '</em>'
            +   '<span class="forge-side-panel-wire-caret">▾</span>'
            + '</summary>'
            + '<div class="forge-side-panel-wire-list">' + items + '</div>'
            + '</details>';
        }).filter(Boolean).join('');

        const fmtYear = (y) => {
          if (typeof y !== 'number' || !isFinite(y)) return '';
          if (y < 0) return Math.abs(y) + ' BCE';
          if (y === 0) return '0';
          return y + ' CE';
        };
        const de = (typeof node.date_earliest === 'number') ? node.date_earliest : null;
        const dl = (typeof node.date_latest   === 'number') ? node.date_latest   : null;
        const dateStr = (de == null && dl == null) ? ''
          : (de != null && dl != null && de !== dl) ? (fmtYear(de) + ' – ' + fmtYear(dl))
          : fmtYear(de != null ? de : dl);

        const safe = (s) => String(s || '').replace(/[&<>"']/g, c => (
          { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
        inner.innerHTML = '<div class="forge-side-panel-content" style="--family-color:' + safe(familyCol) + '">'
          + (thumbSrc
              ? '<div class="forge-side-panel-thumb"><img src="' + safe(thumbSrc) + '" alt="" /></div>'
              : '')
          + '<div class="forge-side-panel-header">'
          +   '<div class="forge-side-panel-name">' + safe(title) + '</div>'
          +   (aka.length ? '<div class="forge-side-panel-aka">' + aka.map(safe).join(' · ') + '</div>' : '')
          +   (tradition ? '<div class="forge-side-panel-tradition">' + safe(tradition) + '</div>' : '')
          + '</div>'
          + (desc ? '<div class="forge-side-panel-desc">' + safe(desc) + '</div>' : '')
          + (pills ? '<div class="forge-side-panel-wires">' + pills + '</div>' : '')
          + '<dl class="forge-side-panel-meta">'
          +   (dateStr ? '<dt>Date</dt><dd>' + safe(dateStr) + '</dd>' : '')
          +   (place   ? '<dt>Place</dt><dd>' + safe(place)   + '</dd>' : '')
          +   (domains ? '<dt>Domains</dt><dd>' + safe(domains) + '</dd>' : '')
          + '</dl>'
          + (extract ? '<div class="forge-side-panel-extract">' + safe(extract) + '</div>' : '')
          + (wikiPage ? '<a class="forge-side-panel-wikilink" href="' + safe(wikiPage) + '" target="_blank" rel="noopener noreferrer">Open Wikipedia ↗</a>' : '')
          + '</div>';
      }

      local._renderSidePanel = render;

      // Phase 19D — click a neighbor inside an expanded wire list →
      // lock + switch the panel to that deity. Event-delegated on
      // the global inner so it works for every render pass without
      // re-binding.
      inner.addEventListener('click', (e) => {
        const item = e.target.closest('.forge-side-panel-wire-item');
        if (!item) return;
        const targetId = item.getAttribute('data-id');
        if (!targetId) return;
        // Lock only if not already locked (toggleLock toggles).
        if (!local.lockedSet.has(targetId)) {
          toggleLock(targetId);    // adds + pulses tab + (if open) renders
        } else {
          // Already locked: just switch the panel to it.
          local.openTabId = targetId;
          render();
          renderTabs();
        }
      });
    }

    function wireTimelineScrubber() {
      const slider  = document.getElementById('forge-scrub-slider');
      if (!slider) return;
      const track   = slider.querySelector('.forge-scrub-track');
      const rangeEl = slider.querySelector('#forge-scrub-range');
      const inEl    = slider.querySelector('#forge-scrub-in-thumb');
      const ctrEl   = slider.querySelector('#forge-scrub-center-thumb');
      const outEl   = slider.querySelector('#forge-scrub-out-thumb');
      const yearZeroEl = slider.querySelector('#forge-scrub-year-zero');
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
        // a hairline.
        //
        // Phase 11 (2026-05-20):
        //   - HIST_LO is the OLDEST entry's clamped lower bound
        //     (no fixed floor; -15000 was just a safety net and we
        //     still keep it for cosmogonic outliers).
        //   - HIST_HI is TODAY'S year — the future ceiling is now
        //     pinned to "now", not an arbitrary 3000. Past-only
        //     timeline; nothing in the chart is in the future of
        //     the user.
        const HIST_LO = -15000;                    // 15,000 BCE safety floor
        const HIST_HI = new Date().getFullYear();  // today (Phase 11)
        if (lo < HIST_LO) lo = HIST_LO;
        if (hi > HIST_HI) hi = HIST_HI;
        // Round outward to nice century-edges so the readout looks
        // tidy. -3142 → -3200. Phase 11: do NOT round PAST today.
        // If the century-ceiling would exceed HIST_HI (e.g. 2024 →
        // 2100), clamp back to HIST_HI. The upper bound is "now",
        // not "next century."
        const lopad = Math.floor(lo / 100) * 100;
        let   hipad = Math.ceil(hi / 100) * 100;
        if (hipad > HIST_HI) hipad = HIST_HI;
        return [lopad, hipad];
      }

      // Phase 5B M-F3 (2026-05-20) — refreshBounds is the per-mode
      // entry point. wireTimelineScrubber runs ONCE at boot to set
      // up DOM + handlers + a first refresh; rebuildForMode calls
      // local.scrubber.refreshBounds() at the end to re-derive
      // lo/hi for the new mode + preserve-or-clamp the user's
      // in/out/center. Preserves user state when it fits the new
      // mode's date span; clamps to nearest valid bound otherwise.
      function refreshBounds() {
        const b = deriveBounds();
        if (!b) {
          slider.style.display = 'none';
          if (inBox)      inBox.style.display = 'none';
          if (outBox)     outBox.style.display = 'none';
          if (presentBox) presentBox.style.display = 'none';
          local.timeline = null;
          return;
        }
        const [lo, hi] = b;
        const prev = local.timeline;
        const inDate     = prev && typeof prev.inDate     === 'number'
          ? Math.max(lo, Math.min(hi, prev.inDate))   : lo;
        const outDate    = prev && typeof prev.outDate    === 'number'
          ? Math.max(inDate, Math.min(hi, prev.outDate)) : hi;
        const centerDate = prev && typeof prev.centerDate === 'number'
          ? Math.max(inDate, Math.min(outDate, prev.centerDate))
          : Math.floor((inDate + outDate) / 2);
        local.timeline = { lo, hi, inDate, outDate, centerDate };
        // Re-show in case a previous mode had no dated nodes.
        slider.style.display = '';
        if (inBox)      inBox.style.display = '';
        if (outBox)     outBox.style.display = '';
        if (presentBox) presentBox.style.display = '';
        refreshUI();
      }

      // Date → fraction along track (0..1). Reads from
      // local.timeline (NOT closure-local lo/hi) so it picks up
      // the current mode's bounds after refreshBounds().
      function dateToFrac(d) {
        const tl = local.timeline;
        if (!tl) return 0;
        return (d - tl.lo) / (tl.hi - tl.lo);
      }
      function fracToDate(f) {
        const tl = local.timeline;
        if (!tl) return 0;
        f = Math.max(0, Math.min(1, f));
        return Math.round(tl.lo + f * (tl.hi - tl.lo));
      }
      function formatYear(y) {
        if (y < 0) return Math.abs(y) + ' BCE';
        if (y === 0) return '0';
        return y + ' CE';
      }
      function refreshUI() {
        const t = local.timeline;
        if (!t) return;
        const inF  = dateToFrac(t.inDate)     * 100;
        const outF = dateToFrac(t.outDate)    * 100;
        const ctrF = dateToFrac(t.centerDate) * 100;
        inEl.style.left   = inF  + '%';
        outEl.style.left  = outF + '%';
        ctrEl.style.left  = ctrF + '%';
        rangeEl.style.left  = inF + '%';
        rangeEl.style.width = (outF - inF) + '%';
        // Phase 11 — Year-0 marker. Visible only when the bounds
        // straddle year 0 (almost always, but defensive). Positioned
        // by the same dateToFrac map the thumbs use; CSS makes it
        // a faint grey tick that doesn't compete with the thumbs.
        if (yearZeroEl) {
          if (t.lo < 0 && t.hi > 0) {
            const zeroF = dateToFrac(0) * 100;
            yearZeroEl.style.left    = zeroF + '%';
            yearZeroEl.style.display = '';
          } else {
            yearZeroEl.style.display = 'none';
          }
        }
        // 4-box readouts. Each box gets just the year (no
        // separator) so it stays compact at fixed height.
        if (inBox)      inBox.textContent      = formatYear(t.inDate);
        if (outBox)     outBox.textContent     = formatYear(t.outDate);
        if (presentBox) presentBox.textContent = formatYear(t.centerDate);
      }

      // Phase 5B M-F3 (2026-05-20) — apply LS-saved timeline state
      // (clamped to current mode's lo/hi) + refreshUI. Called once
      // at boot AFTER wireTimelineScrubber + after initial
      // rebuildForMode populates local.timeline.lo/hi. Safe when
      // saved is null or saved.timeline missing.
      function applySavedTimeline(saved) {
        if (!saved || !local.timeline) return;
        const tl = local.timeline;
        const lo = tl.lo, hi = tl.hi;
        if (typeof saved.in === 'number')     tl.inDate     = Math.max(lo, Math.min(hi, saved.in));
        if (typeof saved.out === 'number')    tl.outDate    = Math.max(tl.inDate, Math.min(hi, saved.out));
        if (typeof saved.center === 'number') tl.centerDate = Math.max(tl.inDate, Math.min(tl.outDate, saved.center));
        refreshUI();
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
        // Phase 5B M-F2 (2026-05-20) — persist timeline state on
        // drag release. Saves all three (mode + timeline + lockedSet).
        saveRuntimeState();
      }
      track.addEventListener('pointerdown', onPointerDown);
      track.addEventListener('pointermove', onPointerMove);
      track.addEventListener('pointerup',   onPointerUp);
      track.addEventListener('pointercancel', onPointerUp);

      // Phase 5B M-F3 (2026-05-20) — expose the per-mode refresh
      // entry on `local.scrubber` so rebuildForMode + LS-hydrate
      // can drive it. Each call re-derives lo/hi for the current
      // mode + clamps any preserved in/out/center to the new
      // bounds + refreshes UI.
      local.scrubber = {
        refreshBounds,
        refreshUI,
        applySavedTimeline,
      };

      // First render — populates local.timeline from the current
      // mode's bounds + paints the UI.
      refreshBounds();
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
