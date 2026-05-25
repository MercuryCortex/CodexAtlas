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

      const modeNodes = modemod.filterNodesByMode(modeId, allNodes, allEdges);
      const modeEdges = layout.filterEdgesByNodes(allEdges, modeNodes);
      const degree    = layout.computeDegree(modeNodes, modeEdges);
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
      let lay;
      if (_layoutId === 'timeline' && typeof layout.timelineLayout === 'function') {
        lay = layout.timelineLayout(modeNodes, currentFamilyOrder(), {
          colorOverride: currentColorOverride(),
          parkUndated:   true,
        });
      } else {
        lay = layout.radialWedgeLayout(modeNodes, currentFamilyOrder(), {
          degree,
          colorOverride: currentColorOverride(),
          distribution:  currentDistribution(),
          reverseAge:    !!document.body.classList.contains('fv-reverse-age'),
        });
      }

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
      hullsOverlay.setAttribute('viewBox', '0 0 ' + vp.w + ' ' + vp.h);
      hullsOverlay.setAttribute('width',  vp.w);
      hullsOverlay.setAttribute('height', vp.h);
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
          c.setAttribute('cx', centerScreen.x.toFixed(1));
          c.setAttribute('cy', centerScreen.y.toFixed(1));
          c.setAttribute('r',  Math.max(0, r).toFixed(1));
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

      bgImage.style.width  = widthPx.toFixed(1)  + 'px';
      bgImage.style.height = heightPx.toFixed(1) + 'px';
      bgImage.style.transform =
        'translate(-50%, -50%) ' +
        'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
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
    function triggerHoverFlash() {
      const id = local.hoverId;
      if (id == null) return;
      if (isPulsePlayingFor(id)) return;
      const dot = positionPulseDot(id);
      if (!dot) return;
      if (local._hoverFlashTimer) { clearTimeout(local._hoverFlashTimer); local._hoverFlashTimer = 0; }
      dot.classList.remove('fx-hover-flash', 'fx-click-pulse');
      void dot.offsetWidth;
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
      void dot.offsetWidth;
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
      const btn   = document.getElementById('forge-debug-btn');
      const panel = document.getElementById('forge-debug-panel');
      if (!btn || !panel) return;
      const FIELDS = [
        { id: 'forge-status-device', label: 'device' },
        { id: 'forge-status-nodes',  label: 'nodes'  },
        { id: 'forge-status-edges',  label: 'edges'  },
        { id: 'forge-status-hover',  label: 'hover'  },
        { id: 'forge-status-lock',   label: 'lock'   },
        { id: 'forge-status-frame',  label: 'frame'  },
      ];
      // One row per field. We CLONE the live span into the panel
      // each refresh so the displayed text always tracks the source.
      function renderRows() {
        panel.innerHTML = FIELDS.map(f => {
          const src = document.getElementById(f.id);
          const v = src ? src.textContent : '—';
          return '<div class="forge-debug-row">' +
            '<span class="forge-debug-k">' + f.label + '</span>' +
            '<span class="forge-debug-v">' + v + '</span>' +
          '</div>';
        }).join('');
      }
      function open() {
        renderRows();
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
        // While open, refresh on every frame's status update.
        local._debugStatsTimer = setInterval(renderRows, 250);
      }
      function close() {
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
        if (local._debugStatsTimer) {
          clearInterval(local._debugStatsTimer);
          local._debugStatsTimer = 0;
        }
      }
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (panel.classList.contains('is-open')) close(); else open();
      });
      document.addEventListener('click', (ev) => {
        if (!panel.classList.contains('is-open')) return;
        if (panel.contains(ev.target) || btn.contains(ev.target)) return;
        close();
      });
      document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && panel.classList.contains('is-open')) close();
      });
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
      window._forge = window._forge || {};
      window._forge.setClassFilter = function (modeId) {
        if (local.destroyed) return false;
        if (!modemod.isValidMode || !modemod.isValidMode(modeId)) return false;
        if (modeId === (local.mode && local.mode.id)) return true;
        try {
          rebuildForMode(modeId);
          syncModeButtonLabel(modeId);
          saveRuntimeState();
          return true;
        } catch (e) {
          console.warn('[forge] setClassFilter failed', e);
          return false;
        }
      };
      window._forge.getClassFilter = function () {
        return (local.mode && local.mode.id) || (modemod.defaultMode && modemod.defaultMode()) || 'deities';
      };
      window._forge.supportedClasses = function () {
        return (modemod.MODES || []).slice();
      };
      // Phase TL-2 Step 1 (2026-05-24) — layout selector. The
      // engine supports two layouts today: 'wheel' (radialWedgeLayout
      // — the default; what's shipped since Phase 20D) and 'timeline'
      // (timelineLayout — TL-1 module). Picking a layout triggers a
      // rebuildForMode at the current modeId, with locks preserved.
      // The Forge view stays the same view; only the geometry of
      // node placement changes. Future master views (Map, Star Map)
      // will register their own setLayout in their own _<view>.* API.
      window._forge.setLayout = function (layoutId) {
        if (local.destroyed) return false;
        const valid = (layoutId === 'wheel' || layoutId === 'timeline');
        if (!valid) {
          console.warn('[forge] unknown layoutId:', layoutId);
          return false;
        }
        if (layoutId === local.layoutId) return true;
        try {
          local.layoutId = layoutId;
          rebuildForMode(local.mode.id, { preserveLocks: true });
          // Emit so app-pill can update the LEFT pill label to
          // reflect the new master view (timeline vs wheel).
          document.dispatchEvent(new CustomEvent('codex:layout-changed', {
            detail: { layoutId }
          }));
          return true;
        } catch (e) {
          console.warn('[forge] setLayout failed', e);
          return false;
        }
      };
      window._forge.getLayout = function () {
        return local.layoutId || 'wheel';
      };
      // Phase TL-2 Step 6b (2026-05-24) — force a layout rebuild
      // at the CURRENT layoutId. Needed when a downstream module
      // (e.g. the timeline scale-preset picker) mutates state that
      // is only read at layout time. Same internal call setLayout
      // makes, but without the same-id early return.
      window._forge.relayout = function () {
        if (local.destroyed) return false;
        try {
          // Phase TL-2 Step 7b-fix3 (2026-05-24) — pass preserveZoom
          // so the band-density slider + scale-preset switch don't
          // reset the camera to the 20% default on every tick.
          rebuildForMode(local.mode.id, { preserveLocks: true, preserveZoom: true });
          return true;
        } catch (e) {
          console.warn('[forge] relayout failed', e);
          return false;
        }
      };
      // Phase 22-AD (2026-05-24) — FOCUS-RANGE API.
      // Zooms + pans the camera so that `yearLo` lands at the LEFT
      // edge of the viewport and `yearHi` lands at the RIGHT edge.
      // Used by the FOCUS button in the timeline bottombar. Works
      // for any active scale preset because it routes through the
      // preset's timelineYearToWorldX → world coords are correct
      // regardless of LIN / LOG / CMP.
      window._forge.focusTimelineRange = function (yearLo, yearHi) {
        if (local.destroyed) return false;
        if (local.layoutId !== 'timeline') return false;
        if (!isFinite(yearLo) || !isFinite(yearHi)) return false;
        if (yearLo >= yearHi) return false;
        const ENG = window.AtlasEngineLayout;
        if (!ENG || !ENG.timelineYearToWorldX) return false;
        const vp = local.lastSize;
        if (!vp || !vp.w) return false;
        const xRange = local.mode && local.mode.xRange;
        if (!xRange) return false;
        try {
          const wxLo = ENG.timelineYearToWorldX(yearLo, xRange);
          const wxHi = ENG.timelineYearToWorldX(yearHi, xRange);
          const worldSpan = Math.max(1e-6, wxHi - wxLo);
          // Leave a small horizontal margin so the endpoints don't
          // jam against the viewport edges (8% inset on each side).
          const usableW = vp.w * 0.92;
          const newScale = usableW / worldSpan;
          const midWorldX = (wxLo + wxHi) / 2;
          // Y stays at origin — timeline world is origin-centered.
          // camera.set() emits onChange internally so subscribers
          // (chrome, BG sync, etc.) re-fire automatically.
          camera.set({ centerX: midWorldX, centerY: 0, scale: newScale });
          // Refresh pan bounds + scale-bounds since the new scale
          // may sit above/below the fit-relative dead-lock zone.
          if (typeof applyZoomFloor === 'function') applyZoomFloor();
          return true;
        } catch (e) {
          console.warn('[forge] focusTimelineRange failed', e);
          return false;
        }
      };
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
      const btn   = document.getElementById('forge-viewset-btn');
      const panel = document.getElementById('forge-viewset-panel');
      if (!btn || !panel) return;
      // Phase 21AY (2026-05-23) — schema v7 (kept; legend reads tier
      // keys directly from same LS key). VIEW panel owns: layer
      // toggles, color theme, family order, node distribution.
      // LEGEND panel owns: tier filters + political-risk-flag toggle.
      const LS_KEY = 'forge.viewSettings.v7';
      const state = (() => {
        try {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) return JSON.parse(raw);
        } catch (_) {}
        return {
          hulls: true, familyTitles: true,
          dividers: true, dividersConverging: false,
          guideRings: false,
          wires: true, sfx: true, map: false,
          reverseAge: false,
          // Phase 22-I (2026-05-24) — timeline layer toggles.
          tlBands: true, tlBandLabels: true,
          // Phase 22-M (2026-05-24) — dense-ticks toggle.
          tlDenseTicks: false,
        };
      })();
      // Defensive defaults — additive.
      if (typeof state.familyTitles       !== 'boolean') state.familyTitles       = true;
      if (typeof state.dividers           !== 'boolean') state.dividers           = true;
      if (typeof state.dividersConverging !== 'boolean') state.dividersConverging = false;
      if (typeof state.guideRings         !== 'boolean') state.guideRings         = false;
      if (typeof state.sfx                !== 'boolean') state.sfx                = true;
      if (typeof state.reverseAge         !== 'boolean') state.reverseAge         = false;
      if (typeof state.tlBands            !== 'boolean') state.tlBands            = true;
      if (typeof state.tlBandLabels       !== 'boolean') state.tlBandLabels       = true;
      if (typeof state.tlDenseTicks       !== 'boolean') state.tlDenseTicks       = false;
      function applyState() {
        document.body.classList.toggle('fv-hide-hulls',         !state.hulls);
        document.body.classList.toggle('fv-hide-family-titles', !state.familyTitles);
        const noDividers = !state.dividers && !state.dividersConverging;
        document.body.classList.toggle('fv-hide-dividers',      noDividers);
        document.body.classList.toggle('fv-hide-wires',         !state.wires);
        document.body.classList.toggle('fv-hide-map',           !state.map);
        document.body.classList.toggle('fv-hide-guide-rings',   !state.guideRings);
        // Phase 22-I — timeline-only layer toggles via body classes.
        // CSS in app.css hides .forge-timeline-bands and
        // .forge-timeline-band-labels under these classes.
        document.body.classList.toggle('fv-hide-tl-bands',       !state.tlBands);
        document.body.classList.toggle('fv-hide-tl-band-labels', !state.tlBandLabels);
        // Phase 22-M (2026-05-24) — dense-ticks toggle dispatched
        // to chrome via setBandStyle (it's a boolean key but the
        // setter coerces via in-key check; we set it directly).
        if (window.AtlasTimelineChrome
            && typeof window.AtlasTimelineChrome.setBandStyle === 'function') {
          try {
            // setBandStyle accepts only numeric values. For the
            // boolean denseTicks, use getBandStyle/mutate/refresh
            // via the resetBandStyle pattern — quickest: write
            // directly through a thin helper exposed below.
            const tlcs = window.AtlasTimelineChrome.getBandStyle();
            if (tlcs && tlcs.denseTicks !== state.tlDenseTicks) {
              window.AtlasTimelineChrome.setBandStyleBoolean &&
                window.AtlasTimelineChrome.setBandStyleBoolean('denseTicks', !!state.tlDenseTicks);
            }
          } catch (_) {}
        }
        // Phase 21AS (2026-05-23) — source-tier filter. Update body
        // classes for CSS hooks AND build the active-tier set the
        // renderer will read in recomputeFocus. The wire-filter
        // is the real teeth: any edge whose source_tier is NOT in
        // the active set gets HIDDEN (state=2.0 → alpha 0). The
        // body classes are mostly for future legend chrome / side-
        // panel disclaimer styling.
        // Phase 21AY (2026-05-23) — tier + political-risk toggles
        // MOVED to the LEGEND panel (see wireLegend(): syncLegendTierUI).
        // The VIEW panel no longer touches `local._activeTiers` or
        // `local._showPoliticalRisk` — those flags are owned by the
        // legend now. VIEW's applyState only handles layer / theme /
        // distribution settings. tiersChanged below stays false from
        // this code path because none of the VIEW toggles affect
        // tier state.
        const tiersChanged         = false;
        // Phase 21AL (2026-05-23) — SFX toggle: when OFF, body
        // class signals the audio sync loop to force volume 0.
        document.body.classList.toggle('fv-hide-sfx',           !state.sfx);
        local._sfxEnabled = !!state.sfx;
        // Phase 21AM (2026-05-23) — reverseAge toggle: when ON, the
        // layout inverts the chronological mapping (rim = oldest
        // instead of center = oldest). The class is read by
        // rebuildForMode → radialWedgeLayout via the opts.reverseAge
        // flag. Toggling requires a full re-layout to take effect.
        const ageDirChanged = document.body.classList.contains('fv-reverse-age') !== !!state.reverseAge;
        document.body.classList.toggle('fv-reverse-age',         !!state.reverseAge);
        if (ageDirChanged && typeof rebuildForMode === 'function') {
          // Phase 22-J — preserveZoom for the reverse-age toggle
          // (wheel-only but harmless to pass; same rationale as
          // applyUxMode above — geometry shifts, dataset doesn't).
          try { rebuildForMode(local.mode.id, { preserveLocks: true, preserveZoom: true }); } catch (_) {}
        }
        // Push the divider mode into the layout layer.
        const newMode = state.dividersConverging ? 'long-centered'
                      : state.dividers           ? 'short'
                      : 'off';
        const modeChanged = (local._dividerMode !== newMode);
        local._dividerMode = newMode;
        if (modeChanged) {
          // Rebuild the gradient stops (they depend on mode) and
          // re-layout the geometry.
          if (typeof rebuildHullElements === 'function') {
            try { rebuildHullElements(); syncHulls(); } catch (_) {}
          }
        }
        // Mark each toggle row's checkbox state for CSS.
        panel.querySelectorAll('.forge-viewset-row[data-toggle]').forEach(row => {
          const key = row.dataset.toggle;
          row.classList.toggle('is-on', !!state[key]);
        });
        // Phase 21S (2026-05-22) — radio-style highlight for the
        // active color theme + family order rows.
        const ux = local.uxMode || DEFAULT_UX_MODE;
        panel.querySelectorAll('.forge-viewset-row[data-color]').forEach(row => {
          row.classList.toggle('is-on', row.dataset.color === ux.colorMode);
        });
        panel.querySelectorAll('.forge-viewset-row[data-order]').forEach(row => {
          row.classList.toggle('is-on', row.dataset.order === ux.orderMode);
        });
        panel.querySelectorAll('.forge-viewset-row[data-distribution]').forEach(row => {
          row.classList.toggle('is-on', row.dataset.distribution === (ux.distributionMode || 'organic'));
        });
        // Phase 21AS (2026-05-23) — when the source-tier set changes,
        // re-run recomputeFocus so edgeTargets pick up the tier-filter
        // (edges whose source_tier ∉ activeTiers get HIDDEN). Skip if
        // the renderer isn't mounted yet (first applyState fires before
        // mount completes).
        if (tiersChanged && typeof recomputeFocus === 'function' && local.mode && local.mode.edges) {
          try { recomputeFocus(); } catch (_) {}
          // Phase 21AX (2026-05-23) — also re-render the side panel
          // so its filtered connection list stays consistent with the
          // wheel. Without this, toggling politicalRisk would update
          // the wires but leave the side panel showing stale rows.
          if (typeof local._renderSidePanel === 'function') {
            try { local._renderSidePanel(); } catch (_) {}
          }
        }
        try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (_) {}
      }
      function open() {
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
      }
      function close() {
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
      }
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (panel.classList.contains('is-open')) close(); else open();
      });
      panel.addEventListener('click', (ev) => {
        const row = ev.target.closest('.forge-viewset-row');
        if (!row || row.disabled) return;
        // Layer toggle (boolean).
        if (row.dataset.toggle) {
          const key = row.dataset.toggle;
          if (!(key in state)) return;
          state[key] = !state[key];
          // Phase 21AL (2026-05-23) — force a redraw on layer-toggle
          // change. The wires toggle in particular reads body.fv-hide-
          // wires inside drawFrame to zero idle alpha; without a draw
          // tick triggered here the canvas keeps showing the previous
          // frame until something else (hover, zoom, …) calls drawFrame.
          // Safe one-line: drawFrame is in the same closure scope.
          try { if (typeof drawFrame === 'function') setTimeout(drawFrame, 0); } catch (_) {}
          // Phase 21AK — separator modes are mutually exclusive
          // (short ↔ converging). Turning one ON forces the other OFF.
          if (key === 'dividers' && state.dividers) {
            state.dividersConverging = false;
          }
          if (key === 'dividersConverging' && state.dividersConverging) {
            state.dividers = false;
          }
          applyState();
          return;
        }
        // Phase 21S (2026-05-22) — color-theme radio.
        if (row.dataset.color) {
          const v = row.dataset.color;
          if (!COLOR_THEMES.hasOwnProperty(v)) return;
          if (local.uxMode.colorMode === v) return;   // no-op if already
          local.uxMode.colorMode = v;
          applyState();
          applyUxMode();
          return;
        }
        // Phase 21S (2026-05-22) — order radio.
        if (row.dataset.order) {
          const v = row.dataset.order;
          if (!ORDER_THEMES.hasOwnProperty(v)) return;
          if (local.uxMode.orderMode === v) return;
          local.uxMode.orderMode = v;
          applyState();
          applyUxMode();
          return;
        }
        // Phase 21AL (2026-05-23) — node distribution radio.
        if (row.dataset.distribution) {
          const v = row.dataset.distribution;
          if (!DISTRIBUTION_THEMES.hasOwnProperty(v)) return;
          if ((local.uxMode.distributionMode || 'organic') === v) return;
          local.uxMode.distributionMode = v;
          applyState();
          applyUxMode();
          return;
        }
      });
      document.addEventListener('click', (ev) => {
        if (!panel.classList.contains('is-open')) return;
        if (panel.contains(ev.target) || btn.contains(ev.target)) return;
        close();
      });
      document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && panel.classList.contains('is-open')) close();
      });

      // ─── Phase 21T (2026-05-22) — criterion tooltips ──────────
      // Dwell ~1 s on a color/order radio → tooltip appears with
      // the criterion text. Reuses the legend-tooltip element so
      // we don't grow a second floating-box CSS surface.
      let tipEl = document.getElementById('forge-legend-tooltip');
      if (!tipEl) {
        // Defensive: if wireLegend hasn't created it (load-order),
        // make our own with the same class.
        tipEl = document.createElement('div');
        tipEl.className = 'forge-legend-tooltip';
        tipEl.id = 'forge-legend-tooltip';
        tipEl.setAttribute('aria-hidden', 'true');
        document.body.appendChild(tipEl);
      }
      let dwellTimer = 0;
      let dwellRow   = null;
      function getCriterion(row) {
        if (!row) return null;
        if (row.dataset.color && VIEWSET_CRITERIA.color[row.dataset.color])
          return VIEWSET_CRITERIA.color[row.dataset.color];
        if (row.dataset.order && VIEWSET_CRITERIA.order[row.dataset.order])
          return VIEWSET_CRITERIA.order[row.dataset.order];
        if (row.dataset.distribution && VIEWSET_CRITERIA.distribution[row.dataset.distribution])
          return VIEWSET_CRITERIA.distribution[row.dataset.distribution];
        return null;
      }
      function positionTooltip(row) {
        const rPanel = panel.getBoundingClientRect();
        const rRow   = row.getBoundingClientRect();
        const rTip   = tipEl.getBoundingClientRect();
        const margin = 8;
        // Default: place to the RIGHT of the panel, top-aligned with
        // the hovered row. Same mirror-clamp rules as the legend.
        let left = rPanel.right + margin;
        if (left + rTip.width + margin > window.innerWidth) {
          left = rPanel.left - rTip.width - margin;
        }
        if (left < margin) left = margin;
        let top = rRow.top;
        if (top + rTip.height + margin > window.innerHeight) {
          top = window.innerHeight - rTip.height - margin;
        }
        if (top < margin) top = margin;
        tipEl.style.left = left + 'px';
        tipEl.style.top  = top  + 'px';
      }
      function showTip(row) {
        const text = getCriterion(row);
        if (!text) return;
        // Phase 21U (2026-05-22) — innerHTML so color-name spans
        // render with their inline color. The criterion strings are
        // assembled from controlled constants in VIEWSET_CRITERIA;
        // no user input, so this is safe.
        tipEl.innerHTML = text;
        tipEl.style.display = '';
        tipEl.setAttribute('aria-hidden', 'false');
        positionTooltip(row);
      }
      function hideTip() {
        tipEl.setAttribute('aria-hidden', 'true');
        tipEl.style.display = 'none';
      }
      function clearDwell() {
        if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = 0; }
        dwellRow = null;
      }
      panel.addEventListener('mousemove', (ev) => {
        const row = ev.target.closest('.forge-viewset-row');
        if (!row || (!row.dataset.color && !row.dataset.order && !row.dataset.distribution)) {
          clearDwell();
          hideTip();
          return;
        }
        if (row === dwellRow) return;       // already counting this row
        clearDwell();
        hideTip();
        dwellRow = row;
        dwellTimer = setTimeout(() => {
          if (dwellRow === row) showTip(row);
        }, 1000);
      });
      panel.addEventListener('mouseleave', () => {
        clearDwell();
        hideTip();
      });

      applyState();
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
      const inp     = document.getElementById('forge-status-search');
      const suggest = document.getElementById('forge-search-suggest');
      if (!inp || !suggest) return;

      function modeNodes() {
        return (local.mode && local.mode.nodes) || [];
      }
      function escapeHtml(s) {
        return String(s || '')
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      }
      function render(matches) {
        if (!matches.length) {
          suggest.innerHTML = '';
          suggest.classList.remove('is-open');
          suggest.setAttribute('aria-hidden', 'true');
          return;
        }
        suggest.innerHTML = matches.slice(0, 8).map(m => {
          return '<button class="forge-search-suggest-item" data-id="' + escapeHtml(m.id) + '">'
            + '<span class="fss-dot" style="background:' + escapeHtml(m.color || '#888') + '"></span>'
            + '<span class="fss-title">' + escapeHtml(m.title || m.id) + '</span>'
            + '<span class="fss-fam">' + escapeHtml(m.family || '') + '</span>'
            + '</button>';
        }).join('');
        suggest.classList.add('is-open');
        suggest.setAttribute('aria-hidden', 'false');
      }
      function search(q) {
        q = (q || '').trim().toLowerCase();
        if (!q) return [];
        const all = modeNodes();
        const out = [];
        for (let i = 0; i < all.length && out.length < 12; i++) {
          const n = all[i];
          const title = (n.title || n.id || '').toLowerCase();
          if (title.indexOf(q) === -1) {
            // Also try alias hits via n.aka if present.
            const aka = Array.isArray(n.aka) ? n.aka.join(' ').toLowerCase() : '';
            if (!aka || aka.indexOf(q) === -1) continue;
          }
          out.push({
            id:     n.id,
            title:  n.title || n.id,
            family: n.family || '',
            color:  n.family_color || n.tradition_color || '#888',
          });
        }
        // Sort: title-startsWith ranks above title-contains.
        out.sort((a, b) => {
          const ai = a.title.toLowerCase().startsWith(q) ? 0 : 1;
          const bi = b.title.toLowerCase().startsWith(q) ? 0 : 1;
          return ai - bi || a.title.localeCompare(b.title);
        });
        return out;
      }
      inp.addEventListener('input', () => render(search(inp.value)));
      inp.addEventListener('focus', () => {
        if (inp.value.trim()) render(search(inp.value));
      });
      inp.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') {
          suggest.innerHTML = '';
          suggest.classList.remove('is-open');
          suggest.setAttribute('aria-hidden', 'true');
        } else if (ev.key === 'Enter') {
          const first = suggest.querySelector('.forge-search-suggest-item');
          if (first) {
            ev.preventDefault();
            first.click();
          }
        }
      });
      suggest.addEventListener('mousedown', (ev) => {
        // mousedown not click — so the input doesn't blur before
        // we read data-id.
        const item = ev.target.closest('.forge-search-suggest-item');
        if (!item) return;
        ev.preventDefault();
        const id = item.dataset.id;
        if (id) {
          // Phase 21L (2026-05-21) — go through the canonical lock
          // pipeline so the side-panel + lock-pill chrome updates,
          // not just lockedSet + recomputeFocus.
          try {
            if (local && local.lockedSet) {
              // Clear any prior locks first so a single click on a
              // suggestion produces a single-locked state (not an
              // additive multi-lock).
              if (local.lockedSet.size) {
                for (const oldId of Array.from(local.lockedSet)) {
                  if (typeof toggleLock === 'function') toggleLock(oldId);
                }
              }
              if (typeof toggleLock === 'function') toggleLock(id);
            }
          } catch (e) { /* best-effort */ }
        }
        inp.value = '';
        suggest.innerHTML = '';
        suggest.classList.remove('is-open');
        suggest.setAttribute('aria-hidden', 'true');
        inp.blur();
      });
      document.addEventListener('click', (ev) => {
        if (suggest.contains(ev.target) || inp.contains(ev.target)) return;
        suggest.classList.remove('is-open');
        suggest.setAttribute('aria-hidden', 'true');
      });
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
            // Phase 21AD (2026-05-22) — face-aware object-position.
            // Portrait images shift upward so the head/face stays in
            // the visible square crop. See computeFaceObjectPosition.
            img.style.objectPosition = computeFaceObjectPosition(img.naturalWidth, img.naturalHeight);
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
      // Phase 21AF (2026-05-22) — expose so the canvas click handler
      // can open the panel on double-click. Local-scope hooks so
      // there's no global pollution.
      local._setPanelOpen = setPanelOpen;
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
          // Phase 21X (2026-05-22) — fresh lock starts at image #1
          // of the carousel. If the user re-locks the same node, the
          // index resets so they see the curated lead image again.
          if (local._sidePanelImageIdx) delete local._sidePanelImageIdx[id];
          // Phase 21AE+AF (2026-05-22) — optional per-node click
          // pulse on the clicked node. Gated by pulse-enabled +
          // non-floor zoom (floor has its own heartbeat).
          if (local._fxToggles && local._fxToggles['pulse-enabled'] && !local._fxBloomActive) {
            triggerClickPulse(id);
          }
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
        // Phase 22-AH (2026-05-24) — D-fix. Any path that wipes the
        // side panel via `inner.innerHTML = ...` detaches the row
        // the hover-tip is anchored to WITHOUT firing mouseout.
        // The tip then sticks at top-left because positionTip reads
        // zero-rect from the detached row. Symmetric hideTip()
        // before the wipe kills the tip alongside its anchor row.
        try { if (typeof hideTip === 'function') hideTip(); } catch (_) {}
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
        // Each bucket: { count, neighbors: [{ id, title, family_color, dir, … }] }.
        // dir = 'out' (this node → other) or 'in' (other → this node).
        //
        // Phase 21AV (2026-05-23) — read from the FULL vault.edges set
        // (not local.mode.edges). The deity wedge mode filters edges to
        // deity-deity only — so all cross-folder connections (e.g. a
        // deity → theme/event/person syncretic-edge) were dropped before
        // the side panel ever saw them. That hid every T4 / T5 disclaimer
        // that lives on a deity→theme edge (the entire Sitchin / nibiru-
        // anunnaki batch is exactly this shape). Now the panel surfaces
        // ALL connections incident on this node; out-of-mode neighbors
        // get a subtype tag + are click-disabled (they're not on the
        // wheel to lock). The wheel itself still only paints in-mode
        // wires — that's correct, the wheel is the deity wheel.
        const buckets = Object.create(null);
        // Cache the full vault.nodes by id; reuse across renders.
        if (!local._vaultNodesById) {
          const vd = window.VAULT_DATA;
          const map = new Map();
          if (vd && Array.isArray(vd.nodes)) {
            for (let i = 0; i < vd.nodes.length; i++) {
              const n = vd.nodes[i];
              if (n && n.id) map.set(n.id, n);
            }
          }
          local._vaultNodesById = map;
        }
        const vaultNodesById = local._vaultNodesById;
        const modeNodesById  = (m && m.nodesById) ? m.nodesById : null;
        const vaultEdges     = (window.VAULT_DATA && window.VAULT_DATA.edges) || [];
        // Phase 21AX (2026-05-23) — apply the same tier + political-risk
        // filters in the side panel that the wire renderer uses. The
        // side panel is the disclaimer-machine surface; if the user
        // toggled T5 OFF or politicalRisk OFF, those edges shouldn't
        // leak into the panel either (otherwise the chrome lies about
        // what's "active"). Same composition: tier filter AND political-
        // risk filter, both must pass.
        const sideActiveTiers   = local._activeTiers;
        const sideShowPolitical = !!local._showPoliticalRisk;
        const sideTierFilterOn  = sideActiveTiers && sideActiveTiers.size < 5;
        if (vaultEdges) {
          const EB = window.EDGE_BUCKET || {};
          for (let i = 0; i < vaultEdges.length; i++) {
            const e = vaultEdges[i];
            const isSrc = e.source === id;
            const isTgt = e.target === id;
            if (!isSrc && !isTgt) continue;
            // Apply tier-filter to side panel too.
            const eTier = e.source_tier || 'T1';
            if (sideTierFilterOn && !sideActiveTiers.has(eTier)) continue;
            // Apply political-risk filter to side panel too.
            if (!sideShowPolitical && e.political_risk_flag) continue;
            const b = EB[e.type] || 'association';
            if (!buckets[b]) buckets[b] = { count: 0, neighbors: [] };
            buckets[b].count++;
            const otherId = isSrc ? e.target : e.source;
            const otherNode = vaultNodesById.get(otherId) || null;
            // out-of-mode = the wheel doesn't have this node, so the
            // click-to-lock handler can't do anything useful with it.
            const inMode = !!(modeNodesById && modeNodesById.has && modeNodesById.has(otherId));
            const subtype = otherNode ? (otherNode.type || '') : '';
            buckets[b].neighbors.push({
              id: otherId,
              title: (otherNode && (otherNode.title || otherNode.id)) || otherId,
              color: (otherNode && (otherNode.family_color || otherNode.tradition_color)) || '#888',
              dir: isSrc ? 'out' : 'in',
              inMode,
              subtype,           // 'deity' | 'theme' | 'person' | 'event' | …
              edgeType:  e.type || '',
              tier:      e.source_tier || 'T1',
              source:    e.edge_source || '',
              notes:     e.edge_notes  || '',
              polRisk:   !!e.political_risk_flag,
            });
          }
        }
        const BUCKET_ORDER = ['transmission','parallel','association','kinship','attestation','polemic','fusion'];
        const bucketHex = (b) => (local.params && local.params['active_color_' + b]) || '#999999';
        // Phase 21AV (2026-05-23) — human-readable headers + tooltip
        // labels. Replaces the raw kebab-case slugs (`parallel-form`,
        // `syncretic-negative-identification`) the panel was showing
        // earlier with plain-English phrases the reader can actually
        // parse. Keys cover every type emitted by build_data.py:
        // - the 21 PROTOCOL §3.1 edge types
        // - the syncretic- prefixed variants from syncretic-edges
        // - the legacy types still in older nodes
        // - the plain-list kinship fields (consort/child-of/…)
        const BUCKET_HUMAN = {
          transmission: 'Transmission',
          parallel:     'Parallel',
          association:  'Association',
          kinship:      'Kinship',
          attestation:  'Attestation',
          polemic:      'Polemic',
          fusion:       'Fusion',
        };
        const TYPE_HUMAN = {
          // PROTOCOL §3.1 — Transmission
          'cognate':                     'Cognate (shared linguistic root)',
          'direct-borrowing':            'Direct borrowing',
          'iconographic-borrowing':      'Iconographic borrowing',
          'substrate-influence':         'Substrate influence',
          'continuous-development':      'Continuous development',
          // PROTOCOL §3.1 — Parallel
          'scholarly-parallel':          'Scholarly parallel',
          'parallel-motif':              'Same motif, independent origin',
          'functional-equivalent':       'Functional equivalent',
          'interpretatio-nominal':       'Name mapping across traditions',
          // PROTOCOL §3.1 — Fusion / identification
          'same-as':                     'Identified as same figure',
          'interpretatio-cultic':        'Cult / ritual mapping across traditions',
          'ancient-identification':      'Ancient identification',
          'composite-deity':             'Composite deity (merger)',
          'folk-syncretism':             'Folk syncretism',
          'identification':              'Identification',
          // PROTOCOL §3.1 — Kinship / hierarchy
          'manifestation-of':            'Manifestation / aspect of',
          'avatara-of':                  'Avatara / incarnation of',
          'constituent-of':              'Constituent of',
          // PROTOCOL §3.1 — Polemic
          'polemic-against':             'Polemic — rejects / refutes',
          'polemic-inversion':           'Polemic — inverts opponent',
          'demonization':                'Demonized rival figure',
          'prefiguration-claim':         'Claimed as prefiguration',
          'negative-identification':     'Rejected identification',
          // Legacy / build_data.py defaults
          'parallel-form':               'Parallel form',
          'visual-cognate':              'Visual cognate',
          'ancestor-of':                 'Ancestor of',
          'connects-to':                 'Connected to',
          // Plain-list kinship fields
          'consort':                     'Consort',
          'child-of':                    'Child of',
          'parent-of':                   'Parent of',
          'attested-in':                 'Attested in',
        };
        function humanType(t) {
          if (!t) return '';
          if (TYPE_HUMAN[t]) return TYPE_HUMAN[t];
          // Strip the syncretic- prefix that build_data.py adds for
          // anything from a syncretic-edges block.
          if (t.indexOf('syncretic-') === 0) {
            const tail = t.slice(10);
            if (TYPE_HUMAN[tail]) return TYPE_HUMAN[tail];
            return tail.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }
          // Fallback: kebab → Title Case.
          return t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
        // Phase 21AV (2026-05-23) — subtype label shown after the
        // neighbor name when the neighbor is NOT a deity (i.e. lives
        // outside the current wheel mode). Keeps the panel honest
        // about cross-folder relationships without misrepresenting
        // them as wheel-clickable.
        const SUBTYPE_HUMAN = {
          theme:       'theme',
          person:      'person',
          event:       'event',
          tradition:   'tradition',
          symbol:      'symbol',
          music:       'music',
          alphabet:    'alphabet',
          alchemy:     'alchemy',
          ritual:      'ritual',
          moral:       'moral',
          philosophy:  'philosophy',
          mathematics: 'mathematics',
          medicine:    'medicine',
        };
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
          const items = data.neighbors.map(n => {
            // Phase 21AS (2026-05-23) — disclaimer-machine row chrome.
            // Phase 21AT (2026-05-23) — tier badge on EVERY row.
            // Phase 21AU (2026-05-23) — store tooltip data on data-*
            // attrs instead of the title="" attribute.
            // Phase 21AV (2026-05-23) — cross-folder neighbors (theme/
            // event/person targets) render with a small subtype tag +
            // are click-disabled (the wheel doesn't have them). The
            // tier badge + tooltip still surface so the disclaimer
            // machine works for cross-folder T4/T5 edges.
            // Phase 21AX (2026-05-23) — CODEX v1.2 — separate the two
            // axes. `risky` (tier===T5) gets the soft ⚠ contested
            // marker; `blackAlert` (political_risk_flag=true) gets
            // the ⛔ HIGH ALERT escalation. The two can co-occur
            // (Icke is both T5 AND political-risk); the visual chrome
            // composes — black left-border + ⛔ + the tier pill.
            const tier        = n.tier || 'T1';
            const tierRisky   = (tier === 'T5');
            const blackAlert  = !!n.polRisk;
            const risky       = tierRisky || blackAlert;   // for legacy is-risky class
            const pillHtml = '<span class="forge-side-panel-wire-item-tier vs-tier-pill vs-tier-pill--' + tier.toLowerCase() + '">' + tier + '</span>';
            const warnHtml = blackAlert
              ? '<span class="forge-side-panel-wire-item-warn forge-side-panel-wire-item-warn--alert" aria-hidden="true">⛔</span>'
              : (tierRisky
                  ? '<span class="forge-side-panel-wire-item-warn" aria-hidden="true">⚠</span>'
                  : '');
            const subTagHtml = (!n.inMode && n.subtype && SUBTYPE_HUMAN[n.subtype])
              ? '<span class="forge-side-panel-wire-item-subtype">' + SUBTYPE_HUMAN[n.subtype] + '</span>'
              : '';
            const classNames = 'forge-side-panel-wire-item'
              + (risky       ? ' is-risky'       : '')
              + (blackAlert  ? ' is-black-alert' : '')
              + (!n.inMode   ? ' is-cross-folder' : '');
            return '<button class="' + classNames + '"'
              + ' data-id="' + safeAttr(n.id) + '"'
              + ' data-in-mode="' + (n.inMode ? '1' : '0') + '"'
              + ' data-tier="' + safeAttr(tier) + '"'
              + ' data-edge-type="' + safeAttr(n.edgeType || '') + '"'
              + ' data-edge-type-human="' + safeAttr(humanType(n.edgeType)) + '"'
              + ' data-edge-source="' + safeAttr(n.source || '') + '"'
              + ' data-edge-notes="' + safeAttr(n.notes || '') + '"'
              + ' data-edge-dir="' + safeAttr(n.dir) + '"'
              + ' data-edge-target-title="' + safeAttr(n.title) + '"'
              + ' data-edge-target-subtype="' + safeAttr(n.subtype || '') + '"'
              + ' data-edge-risky="' + (risky ? '1' : '0') + '">'
              + '<span class="forge-side-panel-wire-item-dir">' + (n.dir === 'out' ? '→' : '←') + '</span>'
              + '<span class="forge-side-panel-wire-item-dot" style="background:' + safeAttr(n.color) + '"></span>'
              + warnHtml
              + '<span class="forge-side-panel-wire-item-title">' + safeAttr(n.title) + '</span>'
              + subTagHtml
              + pillHtml
              + '</button>';
          }).join('');
          return '<details class="forge-side-panel-wire" data-bucket="' + b + '" style="--bucket-color:' + bucketHex(b) + '">'
            + '<summary class="forge-side-panel-wire-summary">'
            +   '<span class="forge-side-panel-wire-dot" style="background:' + bucketHex(b) + '"></span>'
            +   '<span class="forge-side-panel-wire-count">' + data.count + '</span>'
            +   '<em class="forge-side-panel-wire-name">' + (BUCKET_HUMAN[b] || b) + '</em>'
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

        // Phase B-DATING-2 (2026-05-24) — dating_basis surface.
        // Always show the basis tier so the user can audit WHY a
        // node sits where it does on the timeline. Source + notes
        // are optional rows below.
        const dbasis    = node.dating_basis || '';
        const dbSource  = node.dating_basis_source || '';
        const dbNotes   = node.dating_basis_notes || '';
        const DATING_BASIS_LABELS = {
          'B1': 'B1 · primary date',
          'B2': 'B2 · first textual attestation',
          'B3': 'B3 · oldest archaeology',
          'B4': 'B4 · first scripture appearance',
          'B5': 'B5 · scholarly consensus',
          'B6': 'B6 · family-median (soft)',
          'B7': 'B7 · atemporal',
        };
        const dbLabel = DATING_BASIS_LABELS[dbasis] || dbasis;

        const safe = (s) => String(s || '').replace(/[&<>"']/g, c => (
          { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
        // Phase 21X (2026-05-22) — multi-image carousel.
        // Combine node.depictions[] (curated, with captions + license)
        // + node.thumbnail (auto-fetched from Wikipedia) into a single
        // list. Dedupe by URL. If length > 1, show ← / → arrows + a
        // running index (e.g. "2 / 5"). Index is tracked per-node in
        // local._sidePanelImageIdx so cycling persists while the panel
        // is open, but a fresh lock resets to 0.
        const depictionsList = Array.isArray(node.depictions) ? node.depictions : [];
        const imageList = [];
        const seenUrls = new Set();
        for (const d of depictionsList) {
          if (!d || typeof d.source !== 'string') continue;
          if (seenUrls.has(d.source)) continue;
          seenUrls.add(d.source);
          imageList.push({
            src:         d.source,
            caption:     d.caption || '',
            license:     d.license || '',
            attribution: d.attribution || '',
          });
        }
        if (thumbSrc && !seenUrls.has(thumbSrc)) {
          seenUrls.add(thumbSrc);
          imageList.push({ src: thumbSrc, caption: '', license: '', attribution: 'Wikipedia' });
        }
        if (!local._sidePanelImageIdx) local._sidePanelImageIdx = Object.create(null);
        // Initialize OR clamp the saved index (a re-render after a
        // depictions edit may have shrunk the list).
        let curIdx = local._sidePanelImageIdx[id];
        if (typeof curIdx !== 'number') curIdx = 0;
        if (curIdx < 0) curIdx = 0;
        if (curIdx >= imageList.length) curIdx = Math.max(0, imageList.length - 1);
        local._sidePanelImageIdx[id] = curIdx;

        function carouselHtml() {
          if (!imageList.length) return '';
          const img = imageList[curIdx];
          const total = imageList.length;
          const showArrows = total > 1;
          const captionLine = img.caption ? safe(img.caption) : '';
          const attribLine  = img.attribution ? safe(img.attribution) : '';
          return '<div class="forge-side-panel-thumb' + (showArrows ? ' has-carousel' : '') + '" data-node-id="' + safeAttr(id) + '">'
            + '<img src="' + safe(img.src) + '" alt="' + safe(img.caption || title) + '" />'
            + (showArrows
                ? '<button class="forge-side-panel-thumb-prev" data-thumb-nav="prev" aria-label="Previous image">‹</button>'
                + '<button class="forge-side-panel-thumb-next" data-thumb-nav="next" aria-label="Next image">›</button>'
                : '')
            + (showArrows || captionLine || attribLine
                ? '<div class="forge-side-panel-thumb-meta">'
                  + (captionLine ? '<div class="forge-side-panel-thumb-caption">' + captionLine + '</div>' : '')
                  + (attribLine  ? '<div class="forge-side-panel-thumb-attribution">' + attribLine + '</div>' : '')
                  + (showArrows  ? '<div class="forge-side-panel-thumb-index">' + (curIdx + 1) + ' / ' + total + '</div>' : '')
                  + '</div>'
                : '')
            + '</div>';
        }
        inner.innerHTML = '<div class="forge-side-panel-content" style="--family-color:' + safe(familyCol) + '">'
          + carouselHtml()
          + '<div class="forge-side-panel-header">'
          +   '<div class="forge-side-panel-name">' + safe(title) + '</div>'
          +   (aka.length ? '<div class="forge-side-panel-aka">' + aka.map(safe).join(' · ') + '</div>' : '')
          +   (tradition ? '<div class="forge-side-panel-tradition">' + safe(tradition) + '</div>' : '')
          + '</div>'
          + (desc ? '<div class="forge-side-panel-desc">' + safe(desc) + '</div>' : '')
          + (pills ? '<div class="forge-side-panel-wires">' + pills + '</div>' : '')
          + '<dl class="forge-side-panel-meta">'
          +   (dateStr ? '<dt>Date</dt><dd>' + safe(dateStr) + '</dd>' : '')
          // Phase B-DATING-2 (2026-05-24) — dating-basis rows.
          // Always show the basis tier; source + notes optional.
          +   (dbLabel  ? '<dt>Basis</dt><dd class="forge-side-panel-dating-basis forge-side-panel-dating-basis--' + safeAttr(dbasis.toLowerCase()) + '">' + safe(dbLabel) + '</dd>' : '')
          +   (dbSource ? '<dt>Source</dt><dd>' + safe(dbSource) + '</dd>' : '')
          +   (dbNotes  ? '<dt>Notes</dt><dd class="forge-side-panel-dating-notes">' + safe(dbNotes) + '</dd>' : '')
          +   (place   ? '<dt>Place</dt><dd>' + safe(place)   + '</dd>' : '')
          +   (domains ? '<dt>Domains</dt><dd>' + safe(domains) + '</dd>' : '')
          + '</dl>'
          + (extract ? '<div class="forge-side-panel-extract">' + safe(extract) + '</div>' : '')
          + (wikiPage ? '<a class="forge-side-panel-wikilink" href="' + safe(wikiPage) + '" target="_blank" rel="noopener noreferrer">Open Wikipedia ↗</a>' : '')
          + '</div>';

        // Phase 21AD (2026-05-22) — face-aware object-position on the
        // carousel image. Same heuristic as the hover card: portraits
        // shift up to keep the head visible inside the square crop.
        const thumbImg = inner.querySelector('.forge-side-panel-thumb img');
        if (thumbImg) {
          const setPos = () => {
            thumbImg.style.objectPosition = computeFaceObjectPosition(
              thumbImg.naturalWidth, thumbImg.naturalHeight
            );
          };
          if (thumbImg.complete && thumbImg.naturalWidth > 0) setPos();
          else thumbImg.addEventListener('load', setPos, { once: true });
        }
      }

      local._renderSidePanel = render;
      // Phase 21AG (2026-05-22) — expose renderTabs so the canvas
      // double-click handler can refresh the active-tab marker
      // immediately when it switches openTabId.
      local._renderTabs = renderTabs;

      // Phase 19D — click a neighbor inside an expanded wire list →
      // lock + switch the panel to that deity. Event-delegated on
      // the global inner so it works for every render pass without
      // re-binding.
      inner.addEventListener('click', (e) => {
        // Phase 21X (2026-05-22) — carousel arrows. Check first since
        // the buttons live inside .forge-side-panel-thumb which would
        // otherwise pass through to other handlers.
        const navBtn = e.target.closest('[data-thumb-nav]');
        if (navBtn) {
          e.stopPropagation();
          const direction = navBtn.getAttribute('data-thumb-nav');
          const thumbBox  = navBtn.closest('.forge-side-panel-thumb');
          const targetId  = thumbBox && thumbBox.getAttribute('data-node-id');
          if (!targetId || !local._renderSidePanel) return;
          // Compute total via the node's combined image list, mirror
          // of the render-time logic. We re-derive instead of caching
          // so the count stays correct if the data changes underneath.
          const nodeRec = (local.mode && local.mode.nodesById && local.mode.nodesById.get(targetId)) || null;
          if (!nodeRec) return;
          const deps  = Array.isArray(nodeRec.depictions) ? nodeRec.depictions : [];
          const seen  = new Set();
          let total   = 0;
          for (const d of deps) { if (d && d.source && !seen.has(d.source)) { seen.add(d.source); total++; } }
          if (nodeRec.thumbnail && !seen.has(nodeRec.thumbnail)) total++;
          if (total <= 1) return;
          if (!local._sidePanelImageIdx) local._sidePanelImageIdx = Object.create(null);
          let cur = local._sidePanelImageIdx[targetId];
          if (typeof cur !== 'number') cur = 0;
          if (direction === 'next') cur = (cur + 1) % total;
          else                      cur = (cur - 1 + total) % total;
          local._sidePanelImageIdx[targetId] = cur;
          // Re-render the side panel (cheap; the panel is small).
          local._renderSidePanel();
          return;
        }
        const item = e.target.closest('.forge-side-panel-wire-item');
        if (!item) return;
        const targetId = item.getAttribute('data-id');
        if (!targetId) return;
        // Phase 22-AH (2026-05-25) — cross-folder click handler.
        // Per audit C: pre-22-AH this early-returned silently. Now
        // cross-folder rows open an action popup with the target
        // info + "Open in <view>" button so the user can FOLLOW
        // the wire across master-view types (Themes / Persons /
        // Events / etc). The popup is also a slot for future
        // actions (Show reference, Copy link, Open in new tab, …).
        if (item.getAttribute('data-in-mode') !== '1') {
          showCrossFolderPopup(item);
          return;
        }
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

      // Phase 22-AH (2026-05-25) — cross-folder popup. Anchored to
      // the clicked row; offers "Open in <view> view" + dismiss.
      // Reusable shell — future commits can stack more actions
      // (Show reference, Copy link, Open thumb modal, etc.).
      function showCrossFolderPopup(rowEl) {
        if (!rowEl) return;
        const targetId   = rowEl.getAttribute('data-id') || '';
        const targetName = rowEl.getAttribute('data-edge-target-title') || targetId;
        const subtype    = rowEl.getAttribute('data-edge-target-subtype') || '';
        // Subtype → master view name. Today only the Deities wheel
        // is fully wired; other targets stay informational until
        // their master views ship.
        const VIEW_FOR = {
          deity:       { id: 'forge',  label: 'Deities',  available: true  },
          theme:       { id: 'forge',  label: 'Themes',   available: true  },
          person:      { id: 'forge',  label: 'Persons',  available: true  },
          event:       { id: 'forge',  label: 'Events',   available: true  },
          tradition:   { id: 'forge',  label: 'Traditions', available: true  },
          symbol:      { id: 'forge',  label: 'Symbols',  available: true  },
          music:       { id: 'forge',  label: 'Music',    available: false },
          alphabet:    { id: 'forge',  label: 'Alphabets',available: false },
          alchemy:     { id: 'forge',  label: 'Alchemy',  available: false },
          ritual:      { id: 'forge',  label: 'Practices',available: false },
          moral:       { id: 'forge',  label: 'Moral',    available: false },
          philosophy:  { id: 'forge',  label: 'Philosophy',available: false },
          mathematics: { id: 'forge',  label: 'Mathematics',available: false },
          medicine:    { id: 'forge',  label: 'Medicine', available: false },
        };
        const dest = VIEW_FOR[subtype] || { label: subtype || 'this folder', available: false };

        // Remove any existing popup first (single-instance).
        const old = document.getElementById('forge-side-cross-pop');
        if (old && old.parentNode) old.parentNode.removeChild(old);

        const pop = document.createElement('div');
        pop.id = 'forge-side-cross-pop';
        pop.className = 'forge-side-cross-pop';
        pop.innerHTML =
          '<div class="forge-side-cross-pop-head">' +
            '<span class="forge-side-cross-pop-title">' + safeAttr(targetName) + '</span>' +
            '<button class="forge-side-cross-pop-close" type="button" aria-label="Close">×</button>' +
          '</div>' +
          '<div class="forge-side-cross-pop-sub">' + safeAttr(subtype || 'cross-folder') + '</div>' +
          '<div class="forge-side-cross-pop-actions">' +
            (dest.available
              ? '<button class="forge-side-cross-pop-action" data-action="open-mode" data-mode="' + safeAttr(subtype) + '">Switch master view → ' + safeAttr(dest.label) + '</button>'
              : '<div class="forge-side-cross-pop-pending">' + safeAttr(dest.label) + ' view — coming soon</div>') +
          '</div>';

        // Anchor: drop the popup to the LEFT of the clicked row
        // (side panel is right-anchored). Use fixed positioning so
        // panel scroll doesn't drag it along.
        const rRow = rowEl.getBoundingClientRect();
        pop.style.position = 'fixed';
        pop.style.top  = (rRow.top - 4) + 'px';
        pop.style.right = (window.innerWidth - rRow.left + 12) + 'px';
        document.body.appendChild(pop);

        function close() {
          if (pop.parentNode) pop.parentNode.removeChild(pop);
          document.removeEventListener('mousedown', onOutside, true);
          document.removeEventListener('keydown', onEsc, true);
        }
        function onOutside(e) {
          if (pop.contains(e.target)) return;
          if (rowEl.contains(e.target)) return;
          close();
        }
        function onEsc(e) { if (e.key === 'Escape') close(); }
        pop.querySelector('.forge-side-cross-pop-close').addEventListener('click', close);
        const actBtn = pop.querySelector('.forge-side-cross-pop-action');
        if (actBtn) {
          actBtn.addEventListener('click', function () {
            // Switch class filter to the target's subtype mode if
            // it's a recognized one. Today this maps subtypes onto
            // the Deities wheel's mode list — a placeholder until
            // the other master views land. Future expansion: emit
            // a `codex:nav` event the shell catches.
            const mode = actBtn.getAttribute('data-mode');
            if (mode && window._forge && typeof window._forge.setClassFilter === 'function') {
              try { window._forge.setClassFilter(mode); } catch (_) {}
            }
            // Try to lock the target after the mode switch.
            try {
              setTimeout(function () {
                if (local.lockedSet && !local.lockedSet.has(targetId)) {
                  toggleLock(targetId);
                }
                local.openTabId = targetId;
                render();
                renderTabs();
              }, 60);
            } catch (_) {}
            close();
          });
        }
        document.addEventListener('mousedown', onOutside, true);
        document.addEventListener('keydown', onEsc, true);
      }

      // ─── Phase 21AU (2026-05-23) — custom side-panel tooltip ──
      //
      // Replaces the OS-native title="..." tooltip (ugly + slow,
      // ~1.5s delay) with an atlas-styled floating box that fires
      // at 500 ms. The tooltip element is created once and reused;
      // it lives in document.body so it can escape the side panel
      // clip + overflow. Position rule: try LEFT of the side panel
      // first (the panel is right-anchored), fall back to RIGHT if
      // left would overflow.
      //
      // Content per row is read from data-* attrs set in the row
      // HTML: tier, edge-type, edge-source, edge-notes, edge-dir,
      // edge-target-title, edge-risky. T5 / political-risk rows
      // lead with the disclaimer caveat row before the claim.
      let tipEl = document.getElementById('forge-side-tip');
      if (!tipEl) {
        tipEl = document.createElement('div');
        tipEl.id = 'forge-side-tip';
        tipEl.className = 'forge-side-tip';
        tipEl.setAttribute('aria-hidden', 'true');
        document.body.appendChild(tipEl);
      }
      let tipShowTimer = 0;
      let tipHideTimer = 0;
      let tipCurrentRow = null;
      const TIP_DELAY_MS = 500;
      function escTip(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
          { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
      }
      function buildTipHtml(row) {
        const tier      = row.getAttribute('data-tier') || 'T1';
        const dir       = row.getAttribute('data-edge-dir') === 'out' ? '→' : '←';
        const target    = row.getAttribute('data-edge-target-title') || '';
        // Phase 21AV (2026-05-23) — surface the HUMAN-READABLE type
        // label instead of the raw kebab-case slug (e.g. "Rejected
        // identification" instead of "syncretic-negative-identification").
        const typeHuman = row.getAttribute('data-edge-type-human') || '';
        const src       = row.getAttribute('data-edge-source') || '';
        const notes     = row.getAttribute('data-edge-notes') || '';
        const risky     = row.getAttribute('data-edge-risky') === '1';
        // Phase 21AX (2026-05-23) — black-alert is the political-risk-
        // flag axis (CODEX v1.2 §IV.5). Read directly from the row's
        // is-black-alert class, set by the renderer when polRisk=true.
        const blackAlert = row.classList.contains('is-black-alert');
        const inMode    = row.getAttribute('data-in-mode') === '1';
        const subtype   = row.getAttribute('data-edge-target-subtype') || '';
        const tierClass = 'vs-tier-pill--' + tier.toLowerCase();
        let html = '';
        if (blackAlert) {
          html += '<div class="forge-side-tip-risk forge-side-tip-risk--alert">⛔ HIGH ALERT — political-risk content (real-world harm-wiring documented)</div>';
        } else if (risky) {
          html += '<div class="forge-side-tip-risk">⚠ Disclaimer required — claim rejected by mainstream</div>';
        }
        html += '<div class="forge-side-tip-head">'
          +    '<span class="forge-side-tip-dir">' + dir + '</span>'
          +    '<span class="forge-side-tip-title">' + escTip(target) + '</span>'
          +    '<span class="vs-tier-pill ' + tierClass + '">' + escTip(tier) + '</span>'
          +    '</div>';
        // Cross-folder subtype line — e.g., "→ a theme node (not on
        // the deity wheel)" so the user understands why the row isn't
        // clickable.
        if (!inMode && subtype) {
          html += '<div class="forge-side-tip-row"><span class="k">node</span><span class="v">a ' + escTip(subtype) + ' node — not on the deity wheel</span></div>';
        }
        if (typeHuman) {
          html += '<div class="forge-side-tip-row"><span class="k">type</span><span class="v">' + escTip(typeHuman) + '</span></div>';
        }
        if (src) {
          html += '<div class="forge-side-tip-row"><span class="k">source</span><span class="v">' + escTip(src) + '</span></div>';
        }
        if (notes) {
          html += '<div class="forge-side-tip-notes">' + escTip(notes) + '</div>';
        }
        html += '<div class="forge-side-tip-hint">' + (inMode ? 'Click to lock + inspect' : 'Not on the deity wheel — view-only') + '</div>';
        return html;
      }
      function positionTip(row) {
        // Phase 22-AH (2026-05-24) — D-fix defensive guard.
        // If the row got detached from the DOM (innerHTML replaced
        // the side-panel while a tip was still anchored to it), its
        // bounding-rect reads zeros → tip clamps to (10, 10) top-
        // left. Detect detachment + hide instead of paint-then-stick.
        if (!row || !row.isConnected) { hideTip(); return; }
        const rRow = row.getBoundingClientRect();
        if (rRow.width === 0 && rRow.height === 0) { hideTip(); return; }
        const rTip = tipEl.getBoundingClientRect();
        const margin = 10;
        // Default to LEFT of the row (side panel is on the right).
        // If that would overflow off-screen left, fall back to RIGHT.
        let left = rRow.left - rTip.width - margin;
        if (left < margin) left = rRow.right + margin;
        // Clamp horizontally so we never paint off-screen right.
        if (left + rTip.width + margin > window.innerWidth) {
          left = Math.max(margin, window.innerWidth - rTip.width - margin);
        }
        // Vertical: align top of tip with top of row, clamp to fit.
        let top = rRow.top;
        if (top + rTip.height + margin > window.innerHeight) {
          top = window.innerHeight - rTip.height - margin;
        }
        if (top < margin) top = margin;
        tipEl.style.left = left + 'px';
        tipEl.style.top  = top  + 'px';
      }
      function showTipFor(row) {
        tipCurrentRow = row;
        tipEl.innerHTML = buildTipHtml(row);
        tipEl.setAttribute('data-tier', row.getAttribute('data-tier') || 'T1');
        tipEl.setAttribute('data-risky', row.getAttribute('data-edge-risky') === '1' ? '1' : '0');
        // Phase 21AX (2026-05-23) — propagate black-alert state to
        // the tip element so CSS can escalate the chrome (black
        // top border instead of red, ⛔ icon coloring, etc.).
        tipEl.setAttribute('data-alert', row.classList.contains('is-black-alert') ? '1' : '0');
        tipEl.classList.add('is-visible');
        tipEl.setAttribute('aria-hidden', 'false');
        positionTip(row);
      }
      function hideTip() {
        tipEl.classList.remove('is-visible');
        tipEl.setAttribute('aria-hidden', 'true');
        tipCurrentRow = null;
      }
      inner.addEventListener('mouseover', (e) => {
        const row = e.target.closest('.forge-side-panel-wire-item');
        if (!row || row === tipCurrentRow) return;
        if (tipShowTimer) { clearTimeout(tipShowTimer); tipShowTimer = 0; }
        if (tipHideTimer) { clearTimeout(tipHideTimer); tipHideTimer = 0; }
        tipShowTimer = setTimeout(() => {
          tipShowTimer = 0;
          showTipFor(row);
        }, TIP_DELAY_MS);
      });
      inner.addEventListener('mouseout', (e) => {
        const row = e.target.closest('.forge-side-panel-wire-item');
        if (!row) return;
        if (tipShowTimer) { clearTimeout(tipShowTimer); tipShowTimer = 0; }
        // Short defer so moving from one row to another doesn't
        // flash the tip out + back in — let the next mouseover
        // cancel the hide.
        if (tipHideTimer) { clearTimeout(tipHideTimer); }
        tipHideTimer = setTimeout(() => {
          tipHideTimer = 0;
          hideTip();
        }, 80);
      });
      // Hide on any scroll inside the panel (the row moved).
      inner.addEventListener('scroll', hideTip, true);
      // Hide on click — the panel's about to re-render and the
      // old tip would be orphaned.
      inner.addEventListener('click', hideTip, true);
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
