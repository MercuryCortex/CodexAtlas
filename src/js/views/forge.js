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

  // Dim attenuation for non-focused instances. 0.85 = focused
  // nodes / edges stay at full alpha, non-focused get
  // multiplied by 0.15. Tunable from a dev-panel slider later.
  const DIM_AMOUNT = 0.85;

  // Wheel-event zoom sensitivity. Browser delta varies; this
  // tuning keeps a normal scroll click feeling like a step.
  const WHEEL_ZOOM_K = 0.0015;

  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';

    // ── Engine sanity check ─────────────────────────────
    const eng    = window.AtlasEngine;
    const mth    = window.AtlasEngineMath;
    const gpu    = window.AtlasEngineWebGPU;
    const layout = window.AtlasEngineLayout;
    const graph  = window.AtlasEngineGraph;
    const cammod = window.AtlasEngineCamera;
    if (!eng || !mth || !gpu || !layout || !graph || !cammod) {
      rootEl.innerHTML = '<div class="forge-error">'
        + 'Engine modules missing. Check index.html loads '
        + 'engine/contract.js + types.js + math.js + camera.js + '
        + 'layout/radial.js + graph/{node,edge,adjacency}.js + '
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

    // ── Data prep ───────────────────────────────────────
    const vault    = window.VAULT_DATA || { nodes: [], edges: [], families: [] };
    const deities  = (vault.nodes || []).filter(n => n && n.type === 'deity');
    const allEdges = vault.edges || [];
    const edges    = layout.filterEdgesByNodes(allEdges, deities);
    const degree   = layout.computeDegree(deities, edges);
    const familyOrder = (vault.families || []).map(f => f.name);
    const { wedges, positions, rOuter } = layout.radialWedgeLayout(
      deities, familyOrder, { degree }
    );

    const worldExtent = {
      x0: -(rOuter + WORLD_PAD), y0: -(rOuter + WORLD_PAD),
      x1:  (rOuter + WORLD_PAD), y1:  (rOuter + WORLD_PAD),
    };

    const nodePacked = graph.packNodes(deities, positions, degree);
    const edgePacked = graph.packEdges(edges, positions);
    const adjacency  = graph.buildAdjacency(edges);

    // Spatial index for hover hit-test: array of {id, x, y, r}
    // in world coordinates. Hit-test is O(N) per pointer event
    // — fine at 663 nodes. Spatial index (grid bucket) is a
    // Phase 4 optimisation if needed.
    const NODE_FLOATS = graph.NODE_FLOATS_PER_INSTANCE;
    const hitNodes = new Array(nodePacked.instanceCount);
    for (let i = 0; i < nodePacked.instanceCount; i++) {
      const off = i * NODE_FLOATS;
      hitNodes[i] = {
        id: nodePacked.idIndex[i],
        x:  nodePacked.data[off + 0],
        y:  nodePacked.data[off + 1],
        r:  nodePacked.data[off + 2],
      };
    }

    // ── Build pane DOM ──────────────────────────────────
    const shell = document.createElement('div');
    shell.className = 'forge-shell-v1';
    rootEl.appendChild(shell);

    const status = document.createElement('div');
    status.className = 'forge-status';
    status.innerHTML = [
      '<span class="forge-status-tag">FORGE</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">phase</span><span class="forge-status-v">4b · lock + labels</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">device</span>',
      '<span class="forge-status-v forge-status-pending" id="forge-status-device">acquiring…</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">nodes</span><span class="forge-status-v">' + nodePacked.instanceCount + '</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">edges</span><span class="forge-status-v">' + edgePacked.instanceCount + '</span>',
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

    const canvas = document.createElement('canvas');
    canvas.className = 'forge-canvas';
    stage.appendChild(canvas);

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
      nodeStates:  new Float32Array(nodePacked.instanceCount),
      edgeStates:  new Float32Array(edgePacked.instanceCount),
      // Pan-drag state
      panActive:   false,
      panLastX:    0,
      panLastY:    0,
      panMoved:    false,
      // Label DOM nodes — one per renderable deity. Created lazily
      // (only when first shown) to avoid 663 hidden divs at mount.
      labelEls:    new Map(),     // id → HTMLDivElement
    };

    rootEl._engine = {
      destroy() {
        local.destroyed = true;
        if (local.resizeObs) {
          try { local.resizeObs.disconnect(); } catch (e) { /* ignore */ }
          local.resizeObs = null;
        }
        if (local.renderer) {
          try { local.renderer.destroy(); } catch (e) { /* ignore */ }
          local.renderer = null;
        }
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
      hitNodesAt:   (i) => hitNodes[i],
      hitNodeCount: () => hitNodes.length,
      toggleLock:   (id) => toggleLock(id),
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

      local.resizeObs = new ResizeObserver(() => {
        if (local.destroyed) return;
        resizeAndFit(false);
      });
      local.resizeObs.observe(stage);

      // Camera re-renders on every change. The interaction
      // handlers below mutate `camera`; the listener pushes
      // a new frame each time.
      camera.onChange(() => { if (!local.destroyed) drawFrame(); });

      // Bind interaction handlers AFTER renderer is ready.
      attachInteractions();
    })();

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
        camera.fitToExtent(worldExtent, { w, h }, 0);
      } else if (sizeChanged) {
        // On resize, re-fit so the wheel doesn't get cropped.
        camera.fitToExtent(worldExtent, { w, h }, 0);
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
        dimAmount:     DIM_AMOUNT,
        nodeInstances: nodePacked.data,
        edgeInstances: edgePacked.data,
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
      local.focusedSet = graph.focusedSetFor(local.hoverId, local.lockedSet, adjacency);
      local.nodeStates = graph.computeNodeStates(nodePacked.idIndex, local.focusedSet);
      local.edgeStates = graph.computeEdgeStates(edges, local.focusedSet);
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
        local.panActive = true;
        local.panMoved  = false;
        local.panLastX  = ev.clientX;
        local.panLastY  = ev.clientY;
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
        }
      };
      canvas.addEventListener('pointerup',     endPan);
      canvas.addEventListener('pointercancel', endPan);

      // Zoom: wheel toward cursor.
      canvas.addEventListener('wheel', (ev) => {
        if (local.destroyed) return;
        ev.preventDefault();
        const cssX = ev.clientX - canvasRect.left;
        const cssY = ev.clientY - canvasRect.top;
        // deltaY: positive = scroll down = zoom out.
        const factor = Math.exp(-ev.deltaY * WHEEL_ZOOM_K);
        camera.zoomAt(factor, cssX, cssY, { w: local.lastSize.w, h: local.lastSize.h });
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
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
    })[c]);
  }

  window._forge = { render: render };
})();
