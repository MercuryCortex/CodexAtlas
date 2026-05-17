// ============================================================
// CODEX ATLAS — FORGE VIEW (Phase 2)
// ============================================================
// Forge renders the full Pantheon wheel via the proprietary
// WebGPU engine. Isolated from the production Pantheon V2 —
// own pane, own state, zero shared mutable state.
//
// Read before editing:
//   - AGENTS.md → "Craft doctrine"
//   - src/js/engine/README.md
//   - src/js/engine/contract.js  (the API surface)
//
// PHASE 2 SCOPE (this commit)
//   - Read VAULT_DATA, filter to deities + edges between them
//   - Compute degree map + radial wedge layout
//   - Pack node + edge instance buffers
//   - Async-bootstrap WebGPU renderer
//   - Fit-to-viewport camera
//   - One drawFrame per render: instanced disks + curved edges
//   - Resize handler re-fits + redraws
//   - Status strip: node/edge counts, bucket breakdown, last-frame ms
//
// PHASE 3 NEXT
//   - Hover state (highlight + dim)
//   - Family hulls + type-glyphs
//   - Cinematic pan/zoom camera with momentum
// ============================================================

(function () {
  'use strict';

  // World-space bounding box of the radial wedge layout. The
  // layout's R_OUTER is ~540, so a ~600-unit box with a 24-unit
  // letterbox margin gives breathing room around the outermost
  // ring of nodes.
  const WORLD_PAD = 24;

  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';

    // ── Engine sanity check ───────────────────────────────
    const eng    = window.AtlasEngine;
    const tps    = window.AtlasEngineTypes;
    const mth    = window.AtlasEngineMath;
    const gpu    = window.AtlasEngineWebGPU;
    const layout = window.AtlasEngineLayout;
    const graph  = window.AtlasEngineGraph;
    if (!eng || !tps || !mth || !gpu || !layout || !graph) {
      rootEl.innerHTML = '<div class="forge-error">'
        + 'Engine modules missing. Check index.html loads '
        + 'engine/contract.js + types.js + math.js + '
        + 'layout/radial.js + graph/node.js + graph/edge.js + '
        + 'renderer/webgpu.js before views/forge.js.</div>';
      return;
    }
    if (!navigator.gpu) {
      rootEl.innerHTML = '<div class="forge-error">'
        + 'WebGPU is not available in this browser. Forge requires '
        + 'Chrome 113+, Safari 18+, or Firefox Nightly with '
        + '<code>dom.webgpu.enabled</code>. WebGL2 fallback is on '
        + 'the Phase 1b roadmap.</div>';
      return;
    }

    // ── Data prep ─────────────────────────────────────────
    // Read VAULT_DATA, isolate deities + deity-deity edges.
    // (Phase 3 will add mode switching; Phase 2 is Deities only.)
    const vault = window.VAULT_DATA || { nodes: [], edges: [], families: [] };
    const deities = (vault.nodes || []).filter(n => n && n.type === 'deity');
    const allEdges = vault.edges || [];
    const edges = layout.filterEdgesByNodes(allEdges, deities);
    const degree = layout.computeDegree(deities, edges);
    const familyOrder = (vault.families || []).map(f => f.name);
    const { wedges, positions, rInner, rOuter } = layout.radialWedgeLayout(
      deities, familyOrder, { degree }
    );

    // World-space bounding box for the camera fit.
    const worldExtent = {
      x0: -(rOuter + WORLD_PAD),
      y0: -(rOuter + WORLD_PAD),
      x1:  (rOuter + WORLD_PAD),
      y1:  (rOuter + WORLD_PAD),
    };

    // ── Pack instance buffers ────────────────────────────
    const nodePacked = graph.packNodes(deities, positions, degree);
    const edgePacked = graph.packEdges(edges, positions);

    // ── Build pane DOM ───────────────────────────────────
    const shell = document.createElement('div');
    shell.className = 'forge-shell-v1';
    rootEl.appendChild(shell);

    const status = document.createElement('div');
    status.className = 'forge-status';
    status.innerHTML = [
      '<span class="forge-status-tag">FORGE</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">phase</span>',
      '<span class="forge-status-v">2 · full wheel</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">device</span>',
      '<span class="forge-status-v forge-status-pending" id="forge-status-device">acquiring…</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">nodes</span>',
      '<span class="forge-status-v" id="forge-status-nodes">' + nodePacked.instanceCount + '</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">edges</span>',
      '<span class="forge-status-v" id="forge-status-edges">' + edgePacked.instanceCount + '</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">frame</span>',
      '<span class="forge-status-v" id="forge-status-frame">—</span>',
    ].join('');
    shell.appendChild(status);

    const stage = document.createElement('div');
    stage.className = 'forge-stage';
    shell.appendChild(stage);

    const canvas = document.createElement('canvas');
    canvas.className = 'forge-canvas';
    stage.appendChild(canvas);

    // ── Local mount state ────────────────────────────────
    const local = {
      renderer:  null,
      resizeObs: null,
      lastSize:  { w: 0, h: 0 },
      destroyed: false,
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

    // ── Bootstrap renderer + first frame ─────────────────
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

      // Initial paint — synchronous after await so layout is settled.
      // Chrome throttles rAF in hidden tabs (preview iframe is one),
      // so we cannot defer the first frame through requestAnimationFrame.
      resizeAndDraw();

      // ResizeObserver — handles pane resizes without re-mounting.
      local.resizeObs = new ResizeObserver(() => {
        if (local.destroyed) return;
        resizeAndDraw();
      });
      local.resizeObs.observe(stage);
    })();

    function resizeAndDraw() {
      if (!local.renderer || local.destroyed) return;
      const rect = stage.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      if (w !== local.lastSize.w || h !== local.lastSize.h) {
        local.lastSize = { w, h };
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';
        local.renderer.resize(w, h);
      }
      drawFrame();
    }

    function drawFrame() {
      if (!local.renderer || local.destroyed) return;
      const w = local.lastSize.w;
      const h = local.lastSize.h;
      if (!w || !h) return;

      const t0 = performance.now();
      local.renderer.drawFrame({
        viewportCss:    { w, h },
        worldExtent:    worldExtent,
        nodeInstances:  nodePacked.data,
        edgeInstances:  edgePacked.data,
      });
      const dt = performance.now() - t0;

      const fEl = document.getElementById('forge-status-frame');
      if (fEl) fEl.textContent = dt.toFixed(1) + ' ms';
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
    })[c]);
  }

  window._forge = { render: render };
})();
