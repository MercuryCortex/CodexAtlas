// ============================================================
// CODEX ATLAS — FORGE VIEW (Phase 3)
// ============================================================
// Forge renders the full Pantheon wheel via the proprietary
// WebGPU engine. Isolated from production Pantheon V2.
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

  // Default values for every dev-panel parameter. setParam(id, v)
  // writes into local.params and dispatches the right rebake.
  // Keys MUST match the SECTIONS catalog in dev-panel-forge.js.
  const PARAM_DEFAULTS = Object.freeze({
    // What you see at rest
    edge_idle_transmission: 0.10,
    edge_idle_parallel:     0.12,
    edge_idle_association:  0.08,
    edge_idle_kinship:      0.14,
    edge_idle_attestation:  0.10,
    edge_idle_polemic:      0.25,
    edge_idle_fusion:       0.30,
    atmosphere:             0.025,
    // Focus
    dim_amount:             0.85,
    hot_width_mult:         2.4,
    edge_hot_transmission:  0.95,
    edge_hot_parallel:      0.85,
    edge_hot_kinship:       0.85,
    edge_hot_attestation:   0.90,
    edge_hot_polemic:       0.95,
    edge_hot_fusion:        0.95,
    // Nodes
    node_radius_tier1: 16,
    node_radius_tier2: 12,
    node_radius_tier3:  9,
    node_radius_tier4:  7,
    // Glyphs
    glyph_scale:   0.95,
    glyph_opacity: 0.86,
    glyph_tint:    0.55,
    // Edges
    edge_width_transmission: 0.34,
    edge_width_parallel:     0.30,
    edge_width_association:  0.22,
    edge_width_kinship:      0.32,
    edge_width_attestation:  0.30,
    edge_width_polemic:      0.40,
    edge_width_fusion:       0.36,
    curve_transmission: 0.35,
    curve_parallel:     0.30,
    curve_kinship:      0.40,
    curve_fusion:       0.45,
    // Labels
    label_size: 11,
    label_cap:  80,
    // Camera
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
      '<span class="forge-status-tag">FORGE</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">mode</span>',
      '<select class="forge-status-mode" id="forge-status-mode">' + modeOptionsHtml + '</select>',
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
      '<input type="text" class="forge-status-search" id="forge-status-search" placeholder="search…" autocomplete="off" spellcheck="false">',
    ].join('');
    shell.appendChild(status);

    const stage = document.createElement('div');
    stage.className = 'forge-stage';
    shell.appendChild(stage);

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
    const glyphOverlay = document.createElement('div');
    glyphOverlay.className = 'forge-glyphs-overlay';
    stage.appendChild(glyphOverlay);

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
      edgeStates:  new Float32Array(0),
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
      // Animation loop rAF id. Null when idle.
      animRafId:   null,
      animLastT:   0,
      // Label DOM nodes — one per renderable deity. Created lazily
      // (only when first shown) to avoid 663 hidden divs at mount.
      labelEls:    new Map(),     // id → HTMLDivElement
      // Glyph DOM nodes (Phase 4e) — one per node, all visible.
      // Created at rebuildForMode time so the overlay matches the
      // current mode exactly.
      glyphEls:    [],            // Array<{ el, id, baseR, family }>
      glyphFamilyColor: new Map(),// id → string  (for label tint)
      // Phase 5: live-tweak parameter dict + per-type icon overrides.
      // Populated from PARAM_DEFAULTS on mount; the Forge dev panel
      // overrides via setParam / setIcon / setFont.
      params:       Object.assign({}, PARAM_DEFAULTS),
      iconByType:   {},           // type → iconId (from icon library)
      fontByScope:  {},           // scope → { family }
    };

    rootEl._engine = {
      destroy() {
        local.destroyed = true;
        if (local.animRafId != null) {
          try { cancelAnimationFrame(local.animRafId); } catch (e) { /* ignore */ }
          local.animRafId = null;
        }
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
      visibleLabels:() => Array.from(local.labelEls.entries())
                            .filter(([, el]) => el.style.display !== 'none')
                            .map(([id]) => id),
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
      // Hot alpha pulled from window.EDGE_BUCKETS (universal
      // routing module) if loaded; falls back to spec values.
      const buckets = window.EDGE_BUCKETS || {};
      function hex2rgba(hex, a) {
        if (!hex || typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) {
          return [0.31, 0.37, 0.51, a];   // slate fallback
        }
        return [
          parseInt(hex.slice(1, 3), 16) / 255,
          parseInt(hex.slice(3, 5), 16) / 255,
          parseInt(hex.slice(5, 7), 16) / 255,
          a,
        ];
      }
      function bucketHot(name, fallbackHex, fallbackHot) {
        const b = buckets[name];
        if (b && typeof b.hex === 'string' && typeof b.hot === 'number') {
          return hex2rgba(b.hex, b.hot);
        }
        return hex2rgba(fallbackHex, fallbackHot);
      }
      renderer.setBucketPalette([
        bucketHot('transmission', '#C9743A', 0.95),  // 0
        bucketHot('parallel',     '#5A9A8F', 0.85),  // 1
        bucketHot('association',  '#4A5AA4', 0.55),  // 2
        bucketHot('kinship',      '#C9A5D4', 0.85),  // 3
        bucketHot('attestation',  '#D4A55A', 0.90),  // 4
        bucketHot('polemic',      '#A83E4A', 0.95),  // 5
        bucketHot('fusion',       '#C4783A', 0.95),  // 6
      ]);

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
      camera.onChange(() => { if (!local.destroyed) drawFrame(); });

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

      const modeNodes = modemod.filterNodesByMode(modeId, allNodes, allEdges);
      const modeEdges = layout.filterEdgesByNodes(allEdges, modeNodes);
      const degree    = layout.computeDegree(modeNodes, modeEdges);
      const lay       = layout.radialWedgeLayout(modeNodes, familyOrder, { degree });
      const nodePack  = graph.packNodes(modeNodes, lay.positions, degree, { tierRadii: tierRadiiFromParams() });
      const edgePack  = graph.packEdges(modeEdges, lay.positions, edgeOverridesFromParams());
      const adj       = graph.buildAdjacency(modeEdges);

      const hitNodesNew = new Array(nodePack.instanceCount);
      for (let i = 0; i < nodePack.instanceCount; i++) {
        const off = i * NODE_FLOATS;
        hitNodesNew[i] = {
          id: nodePack.idIndex[i],
          x:  nodePack.data[off + 0],
          y:  nodePack.data[off + 1],
          r:  nodePack.data[off + 2],
        };
      }

      const ext = {
        x0: -(lay.rOuter + WORLD_PAD), y0: -(lay.rOuter + WORLD_PAD),
        x1:  (lay.rOuter + WORLD_PAD), y1:  (lay.rOuter + WORLD_PAD),
      };

      local.mode = {
        id:          modeId,
        nodes:       modeNodes,
        edges:       modeEdges,
        positions:   lay.positions,
        adjacency:   adj,
        nodePacked:  nodePack,
        edgePacked:  edgePack,
        hitNodes:    hitNodesNew,
        worldExtent: ext,
      };
      // State buffers must size to the new instance counts.
      local.nodeStates = new Float32Array(nodePack.instanceCount);
      local.edgeStates = new Float32Array(edgePack.instanceCount);

      // Cross-mode hover/lock cleared — node ids don't map
      // between modes.
      local.hoverId    = null;
      local.lockedSet  = new Set();
      local.focusedSet = null;
      // Wipe label divs from the previous mode — different ids,
      // different positions. Lazy creation re-mounts on demand.
      for (const el of local.labelEls.values()) {
        try { el.remove(); } catch (e) { /* ignore */ }
      }
      local.labelEls.clear();

      // Rebuild glyph overlay (Phase 4e). One inline-SVG per
      // node, tinted to a lighter hue of the family color. The
      // positions follow the camera via syncGlyphPositions on
      // every camera change.
      glyphOverlay.innerHTML = '';
      local.glyphEls.length = 0;
      local.glyphFamilyColor.clear();
      // Build a `<span>` per node containing an inline <svg>.
      // Iterate via nodePack.idIndex so the order matches
      // hitNodes / state buffers exactly (and any node that
      // failed positioning is correctly skipped).
      const modeNodeById = new Map();
      for (const n of modeNodes) modeNodeById.set(n.id, n);
      for (let i = 0; i < nodePack.instanceCount; i++) {
        const id = nodePack.idIndex[i];
        const n  = modeNodeById.get(id);
        if (!n) continue;
        const r  = nodePack.data[i * NODE_FLOATS + 2];   // baseR (world units)
        const fc = n.family_color || n.tradition_color || '#cccccc';
        const tint = mth.lightenColor(fc, 0.55);
        const span = document.createElement('span');
        span.className = 'forge-glyph';
        span.style.color = tint;
        span.innerHTML = glyphmod.fullSvg(n.type, 12);   // fill via CSS sizing
        glyphOverlay.appendChild(span);
        local.glyphEls.push({ el: span, id, baseR: r });
        local.glyphFamilyColor.set(id, fc);
      }

      // Status strip counters + dropdown selection sync.
      const nEl = document.getElementById('forge-status-nodes');
      const eEl = document.getElementById('forge-status-edges');
      const hEl = document.getElementById('forge-status-hover');
      const lEl = document.getElementById('forge-status-lock');
      if (nEl) nEl.textContent = String(nodePack.instanceCount);
      if (eEl) eEl.textContent = String(edgePack.instanceCount);
      if (hEl) hEl.textContent = '—';
      if (lEl) lEl.textContent = '—';

      // Refit camera to the new layout. Cancel any in-flight
      // animation — fit-to-extent is a teleport, not an ease.
      camera.stopAnim();
      if (local.lastSize.w && local.lastSize.h) {
        camera.fitToExtent(ext, local.lastSize, 0);
      }
      drawFrame();
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
        // On resize, re-fit so the wheel doesn't get cropped.
        camera.fitToExtent(local.mode.worldExtent, { w, h }, 0);
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
      local.renderer.drawFrame({
        viewportCss:   { w: vp.w, h: vp.h },
        camera:        camera.state,
        dimAmount:     local.params.dim_amount,
        nodeInstances: local.mode.nodePacked.data,
        edgeInstances: local.mode.edgePacked.data,
        nodeStates:    local.nodeStates,
        edgeStates:    local.edgeStates,
      });
      const dt = performance.now() - t0;
      const fEl = document.getElementById('forge-status-frame');
      if (fEl) fEl.textContent = dt.toFixed(1) + ' ms';
      // Labels are CSS-positioned over the canvas, so any camera
      // change also needs them re-positioned. Cheap when small;
      // skip entirely when no focus is set.
      syncLabelPositions();
      // Glyphs are also CSS-positioned. Sync on every camera move.
      syncGlyphPositions();
    }

    // ── Glyph positions (Phase 4e) ─────────────────────
    // Iterate glyphEls (one per node) and place each span at
    // its node's screen position. Size = disk diameter at the
    // current camera scale. Skip when no glyphs (empty mode).
    function syncGlyphPositions() {
      if (local.destroyed) return;
      const els = local.glyphEls;
      if (!els.length) return;
      const vp = local.lastSize;
      if (!vp.w || !vp.h) return;
      const sc = camera.state.scale;
      const glyphScale = local.params.glyph_scale;
      const hitNodes = local.mode.hitNodes;
      // hitNodes order matches glyphEls order (both come from
      // nodePack.idIndex). Iterate by index for O(N) with no
      // per-frame Map lookups.
      for (let i = 0; i < els.length; i++) {
        const g = els[i];
        const n = hitNodes[i];
        if (!n) continue;
        const s = camera.worldToScreen(n.x, n.y, vp);
        // Glyph fills the disk × glyph_scale (dev-tweakable).
        const dPx = Math.max(2, 2 * g.baseR * sc * glyphScale);
        const half = dPx / 2;
        g.el.style.left   = (s.x - half) + 'px';
        g.el.style.top    = (s.y - half) + 'px';
        g.el.style.width  = dPx + 'px';
        g.el.style.height = dPx + 'px';
      }
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
      if (el) return el;
      el = document.createElement('div');
      el.className = 'forge-label';
      const node = nodeById(id);
      el.textContent = (node && node.title) || id;
      labelsOverlay.appendChild(el);
      local.labelEls.set(id, el);
      return el;
    }
    function syncLabels() {
      const focus = local.focusedSet;
      // Hide all existing labels first, then reveal the ones
      // that are in the focused set. Cheap at our scale.
      for (const el of local.labelEls.values()) {
        el.style.display = 'none';
      }
      if (!focus || focus.size === 0) return;
      // Cap how many labels we show on a really large lock — at
      // ~150+ visible labels the overlay becomes noise. Phase 4c
      // can add proper deconfliction; for now, cap and order by
      // tier (which is implicit in idIndex order via degree sort).
      const MAX_LABELS = 80;
      let shown = 0;
      for (const id of focus) {
        if (shown >= MAX_LABELS) break;
        const el = ensureLabelEl(id);
        // Explicit 'block' — clearing to '' would fall back to
        // the CSS rule which sets display:none as the default.
        el.style.display = 'block';
        shown++;
      }
      syncLabelPositions();
    }
    function syncLabelPositions() {
      const focus = local.focusedSet;
      if (!focus || focus.size === 0) return;
      const vp = local.lastSize;
      if (!vp.w || !vp.h) return;
      // Position each currently-visible label above its node's
      // screen position. Use the camera (NOT the renderer's flip)
      // — labels need the actual canvas pixel, which already
      // accounts for the renderer's Y-flip via the camera's
      // straight world→screen.
      const hitNodes = local.mode.hitNodes;
      for (let i = 0; i < hitNodes.length; i++) {
        const n = hitNodes[i];
        if (!focus.has(n.id)) continue;
        const el = local.labelEls.get(n.id);
        if (!el || el.style.display === 'none') continue;
        const s = camera.worldToScreen(n.x, n.y, vp);
        // Label sits just above the disk. Negate-Y in render
        // means world.y POSITIVE maps to canvas.y SMALL (top of
        // canvas), so the disk's "top edge" on screen is at
        // canvas.y = s.y - n.r * scale. Place label above that
        // with a small gap.
        const px = s.x;
        const py = s.y - n.r * camera.state.scale - 6;
        el.style.left = px + 'px';
        el.style.top  = py + 'px';
      }
    }

    // ── Hover hit-test ──────────────────────────────────
    // Returns the topmost node ID under the cursor, or null.
    // CSS-pixel input; converts to world via camera.
    function hitTestAt(cssX, cssY) {
      const w = local.lastSize.w;
      const h = local.lastSize.h;
      if (!w || !h) return null;
      const world = camera.screenToWorld(cssX, cssY, { w, h });
      let best = null;
      let bestDist = Infinity;
      // Iterate forward — later instances paint on top of
      // earlier ones in the wheel, so we want the LAST
      // matching node. Track the nearest within radius as a
      // tie-break for overlapping disks (rare but possible).
      const hitNodes = local.mode.hitNodes;
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
      if (stillMoving) {
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
    function recomputeFocus() {
      local.focusedSet = graph.focusedSetFor(local.hoverId, local.lockedSet, local.mode.adjacency);
      local.nodeStates = graph.computeNodeStates(local.mode.nodePacked.idIndex, local.focusedSet);
      local.edgeStates = graph.computeEdgeStates(local.mode.edges, local.focusedSet);
      syncLabels();
      drawFrame();
    }

    // Update hoverId, then refresh focus. No-op when the hover
    // hasn't actually changed.
    function setHoverId(newId) {
      if (newId === local.hoverId) return;
      local.hoverId = newId;
      const hEl = document.getElementById('forge-status-hover');
      if (hEl) {
        if (newId) {
          const node = nodeById(newId);
          hEl.textContent = (node && node.title) || newId;
        } else {
          hEl.textContent = '—';
        }
      }
      recomputeFocus();
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
        ev.preventDefault();
      });
      const endPan = (ev) => {
        if (!local.panActive) return;
        try { canvas.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
        local.panActive = false;
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

    // ── Param helpers (Phase 5 — dev panel wires) ───────
    function tierRadiiFromParams() {
      return [
        local.params.node_radius_tier1,
        local.params.node_radius_tier2,
        local.params.node_radius_tier3,
        local.params.node_radius_tier4,
      ];
    }
    function edgeOverridesFromParams() {
      return {
        widths: {
          transmission: local.params.edge_width_transmission,
          parallel:     local.params.edge_width_parallel,
          association:  local.params.edge_width_association,
          kinship:      local.params.edge_width_kinship,
          attestation:  local.params.edge_width_attestation,
          polemic:      local.params.edge_width_polemic,
          fusion:       local.params.edge_width_fusion,
        },
        idleOps: {
          transmission: local.params.edge_idle_transmission,
          parallel:     local.params.edge_idle_parallel,
          association:  local.params.edge_idle_association,
          kinship:      local.params.edge_idle_kinship,
          attestation:  local.params.edge_idle_attestation,
          polemic:      local.params.edge_idle_polemic,
          fusion:       local.params.edge_idle_fusion,
        },
        curves: {
          transmission: local.params.curve_transmission,
          parallel:     local.params.curve_parallel,
          kinship:      local.params.curve_kinship,
          fusion:       local.params.curve_fusion,
        },
      };
    }
    function hotPaletteFromParams() {
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
      const buckets = window.EDGE_BUCKETS || {};
      function hot(name, hex) {
        const a = local.params['edge_hot_' + name];
        const useHex = (buckets[name] && buckets[name].hex) || hex;
        return hex2rgba(useHex, a);
      }
      return [
        hot('transmission', '#C9743A'),
        hot('parallel',     '#5A9A8F'),
        hot('association',  '#4A5AA4'),
        hot('kinship',      '#C9A5D4'),
        hot('attestation',  '#D4A55A'),
        hot('polemic',      '#A83E4A'),
        hot('fusion',       '#C4783A'),
      ];
    }

    // Rebake node instances + glyph DOM (called when tier radii
    // or glyph tint changes — both depend on the packed radius).
    function rebakeNodes() {
      const m = local.mode;
      const np = graph.packNodes(m.nodes, m.positions, layout.computeDegree(m.nodes, m.edges), { tierRadii: tierRadiiFromParams() });
      m.nodePacked = np;
      // Re-derive hit-test index.
      m.hitNodes = new Array(np.instanceCount);
      for (let i = 0; i < np.instanceCount; i++) {
        const off = i * NODE_FLOATS;
        m.hitNodes[i] = { id: np.idIndex[i], x: np.data[off], y: np.data[off + 1], r: np.data[off + 2] };
      }
      local.nodeStates = new Float32Array(np.instanceCount);
      rebakeGlyphsForMode();
      drawFrame();
    }
    // Rebake edge instances (idle alpha / width / curve).
    function rebakeEdges() {
      const m = local.mode;
      m.edgePacked = graph.packEdges(m.edges, m.positions, edgeOverridesFromParams());
      local.edgeStates = new Float32Array(m.edgePacked.instanceCount);
      drawFrame();
    }
    // Push hot palette to the renderer.
    function rebakeBucketPalette() {
      if (!local.renderer) return;
      local.renderer.setBucketPalette(hotPaletteFromParams());
      drawFrame();
    }
    // Rebuild glyph DOM (called by mode switch + tier-radii change
    // + icon override + tint change).
    function rebakeGlyphsForMode() {
      glyphOverlay.innerHTML = '';
      local.glyphEls.length = 0;
      local.glyphFamilyColor.clear();
      const m = local.mode;
      const modeNodeById = new Map();
      for (const n of m.nodes) modeNodeById.set(n.id, n);
      for (let i = 0; i < m.nodePacked.instanceCount; i++) {
        const id = m.nodePacked.idIndex[i];
        const n  = modeNodeById.get(id);
        if (!n) continue;
        const r  = m.nodePacked.data[i * NODE_FLOATS + 2];
        const fc = n.family_color || n.tradition_color || '#cccccc';
        const tint = mth.lightenColor(fc, local.params.glyph_tint);
        const iconOverride = local.iconByType[n.type];
        const innerSvg = iconOverride && window.AtlasEngineIconLibrary
          ? window.AtlasEngineIconLibrary.fullSvg(iconOverride, 12)
          : glyphmod.fullSvg(n.type, 12);
        const span = document.createElement('span');
        span.className = 'forge-glyph';
        span.style.color = tint;
        span.innerHTML = innerSvg;
        glyphOverlay.appendChild(span);
        local.glyphEls.push({ el: span, id, baseR: r });
        local.glyphFamilyColor.set(id, fc);
      }
      syncGlyphPositions();
    }

    // ── Public API for dev panel ────────────────────────
    function setParam(name, value) {
      if (typeof value !== 'number' || isNaN(value)) return;
      if (!(name in local.params)) return;
      local.params[name] = value;
      // Dispatch — what's the cheapest valid reaction?
      if (name === 'dim_amount') { drawFrame(); return; }
      if (name === 'atmosphere') {
        document.documentElement.style.setProperty('--forge-atmosphere', String(value));
        return;
      }
      if (name === 'label_size') {
        document.documentElement.style.setProperty('--forge-label-size', value + 'px');
        return;
      }
      if (name === 'label_cap') {
        syncLabels(); return;
      }
      if (name === 'glyph_opacity') {
        document.documentElement.style.setProperty('--forge-glyph-opacity', String(value));
        return;
      }
      if (name === 'glyph_scale') {
        // syncGlyphPositions multiplies the disk diameter by this
        // each frame; we store it on local.params and trigger
        // a sync. (No per-frame read; we just need a redraw.)
        syncGlyphPositions(); return;
      }
      if (name === 'glyph_tint') {
        rebakeGlyphsForMode(); return;
      }
      if (name === 'hot_width_mult') {
        // Currently shader-hardcoded (2.4). Phase 5b will wire
        // this through a view-uniform field. For now this slider
        // updates local.params but the visual effect waits.
        return;
      }
      if (name.startsWith('node_radius_tier')) {
        rebakeNodes(); return;
      }
      if (name.startsWith('edge_idle_') ||
          name.startsWith('edge_width_') ||
          name.startsWith('curve_')) {
        rebakeEdges(); return;
      }
      if (name.startsWith('edge_hot_')) {
        rebakeBucketPalette(); return;
      }
      if (name === 'pan_tau' || name === 'zoom_tau' || name === 'flyto_dur') {
        // Camera tuning constants — would need camera-module setters.
        // Stored for now; Phase 5b can plumb them through.
        return;
      }
    }

    function setIcon(nodeType, iconId) {
      if (!nodeType) return;
      local.iconByType[nodeType] = iconId;
      rebakeGlyphsForMode();
    }

    function setFont(scope, font) {
      if (!scope || !font || !font.family) return;
      local.fontByScope[scope] = font;
      const cssVar = '--forge-font-' + scope;
      document.documentElement.style.setProperty(cssVar, font.family);
    }

    // Apply glyph-scale CSS var so syncGlyphPositions can read it.
    // Done once at mount + on every setParam('glyph_scale').
    document.documentElement.style.setProperty('--forge-glyph-opacity', String(local.params.glyph_opacity));
    document.documentElement.style.setProperty('--forge-atmosphere', String(local.params.atmosphere));
    document.documentElement.style.setProperty('--forge-label-size', local.params.label_size + 'px');

    // Expose on window for dev panel.
    window._forge.setParam = setParam;
    window._forge.setIcon  = setIcon;
    window._forge.setFont  = setFont;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
    })[c]);
  }

  window._forge = { render: render };
})();
