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
      '<span class="forge-status-k">phase</span><span class="forge-status-v">3 · camera + hover</span>',
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
      '<span class="forge-status-k">frame</span><span class="forge-status-v" id="forge-status-frame">—</span>',
    ].join('');
    shell.appendChild(status);

    const stage = document.createElement('div');
    stage.className = 'forge-stage';
    shell.appendChild(stage);

    const canvas = document.createElement('canvas');
    canvas.className = 'forge-canvas';
    stage.appendChild(canvas);

    // ── Camera ──────────────────────────────────────────
    const camera = cammod.create({ centerX: 0, centerY: 0, scale: 1 });

    // ── Local mount state ──────────────────────────────
    const local = {
      renderer:    null,
      resizeObs:   null,
      lastSize:    { w: 0, h: 0 },
      destroyed:   false,
      hoverId:     null,
      focusedSet:  null,
      nodeStates:  new Float32Array(nodePacked.instanceCount),
      edgeStates:  new Float32Array(edgePacked.instanceCount),
      // Pan-drag state
      panActive:   false,
      panLastX:    0,
      panLastY:    0,
      panMoved:    false,
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
      hitTestAt: (x, y) => hitTestAt(x, y),
      cameraState:  () => camera.state,
      lastSize:     () => ({ w: local.lastSize.w, h: local.lastSize.h }),
      hoverId:      () => local.hoverId,
      hitNodesAt:   (i) => hitNodes[i],
      hitNodeCount: () => hitNodes.length,
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

    // Update hoverId + recompute focused-state buffers, then
    // re-draw. No-op when the hover hasn't actually changed.
    function setHoverId(newId) {
      if (newId === local.hoverId) return;
      local.hoverId    = newId;
      local.focusedSet = graph.focusedSetFor(newId, null, adjacency);
      local.nodeStates = graph.computeNodeStates(nodePacked.idIndex, local.focusedSet);
      local.edgeStates = graph.computeEdgeStates(edges, local.focusedSet);
      const hEl = document.getElementById('forge-status-hover');
      if (hEl) {
        if (newId) {
          // Look up the node title for display. window.NODES_BY_ID
          // is a plain object in this codebase (not a Map). Handle
          // both shapes defensively so a future refactor that swaps
          // it for a Map doesn't break the hover label.
          let node = null;
          const idx = window.NODES_BY_ID;
          if (idx) {
            if (typeof idx.get === 'function') node = idx.get(newId);
            else                               node = idx[newId];
          }
          hEl.textContent = (node && node.title) || newId;
        } else {
          hEl.textContent = '—';
        }
      }
      drawFrame();
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
