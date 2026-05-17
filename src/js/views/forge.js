// ============================================================
// CODEX ATLAS — FORGE VIEW
// ============================================================
// Forge is the isolated parallel build of the proprietary
// WebGPU rendering engine. Same isolation pattern Pantheon V2
// used: own pane, own state, zero shared mutable state with
// the rest of the app. Read-only access to `window.VAULT_DATA`.
//
// Read these before editing:
//   - AGENTS.md → "Craft doctrine" (load-bearing rules)
//   - src/js/engine/README.md  (engine architecture)
//   - src/js/engine/contract.js (the API surface)
//
// PHASE 1 (this commit): WebGPU bootstrap + first disk.
//   - Mounts a status strip + a full-area <canvas>
//   - Async-bootstraps the WebGPU renderer
//   - Draws ONE anti-aliased gold disk at canvas centre
//   - Resizes on viewport change
//   - Tears down GPU device on view-change
//
// PHASE 2 NEXT: render all 660 deities + 3k edges via instanced
// draw calls; cinematic camera; 60 fps with everything visible.
// ============================================================

(function () {
  'use strict';

  // Gold #d4a55a — the Atlas brand mark. The first pixel that
  // the proprietary engine paints is the brand color. Statement
  // of intent: every visual that follows is ours.
  const FIRST_DISK_COLOR = [0xd4 / 255, 0xa5 / 255, 0x5a / 255, 1.0];

  // Disk size as a fraction of min(canvas.width, canvas.height).
  // 0.18 = a substantial but not viewport-filling disk; reads as
  // a deliberate visual anchor rather than a screensaver fill.
  const DISK_FRACTION = 0.18;

  // ── Public render entry (called by VIEWS.forge) ────────────
  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';

    // Engine sanity check — refuse to mount if the contract /
    // types / math / renderer modules failed to load.
    const eng = window.AtlasEngine;
    const tps = window.AtlasEngineTypes;
    const mth = window.AtlasEngineMath;
    const gpu = window.AtlasEngineWebGPU;
    if (!eng || !tps || !mth || !gpu) {
      rootEl.innerHTML = '<div class="forge-error">'
        + 'Engine modules missing. Check index.html loads '
        + 'engine/contract.js + types.js + math.js + '
        + 'renderer/webgpu.js before views/forge.js.</div>';
      return;
    }

    // WebGPU availability gate. If absent, show a clear notice
    // instead of throwing — Phase 1b will add WebGL2 fallback.
    if (!navigator.gpu) {
      rootEl.innerHTML = '<div class="forge-error">'
        + 'WebGPU is not available in this browser. Forge requires '
        + 'Chrome 113+, Safari 18+, or Firefox Nightly with '
        + '<code>dom.webgpu.enabled</code>. WebGL2 fallback is on '
        + 'the Phase 1b roadmap.</div>';
      return;
    }

    // ── Build the pane DOM ───────────────────────────────────
    // Two stacked sections:
    //   1. Top status strip — fixed height; shows engine state.
    //   2. Canvas wrapper  — fills the rest; <canvas> is sized
    //      to the wrapper via ResizeObserver.
    const shell = document.createElement('div');
    shell.className = 'forge-shell-v1';
    rootEl.appendChild(shell);

    const status = document.createElement('div');
    status.className = 'forge-status';
    status.innerHTML = [
      '<span class="forge-status-tag">FORGE</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">phase</span>',
      '<span class="forge-status-v">1 · webgpu bootstrap</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">device</span>',
      '<span class="forge-status-v forge-status-pending" id="forge-status-device">acquiring…</span>',
      '<span class="forge-status-sep">·</span>',
      '<span class="forge-status-k">surface</span>',
      '<span class="forge-status-v" id="forge-status-surface">—</span>',
    ].join('');
    shell.appendChild(status);

    const stage = document.createElement('div');
    stage.className = 'forge-stage';
    shell.appendChild(stage);

    const canvas = document.createElement('canvas');
    canvas.className = 'forge-canvas';
    stage.appendChild(canvas);

    // Local state for this mount. Lives on rootEl so setView
    // teardown can find + destroy the GPU device cleanly via
    // the destroy() hook we set up below.
    const local = {
      renderer:   null,    // { drawDisk, resize, destroy, ... } from webgpu.js
      resizeObs:  null,
      lastSize:   { w: 0, h: 0 },
      destroyed:  false,
    };

    // Expose teardown to setView (via rootEl._engine, picked up
    // in app.js view-change cleanup pass).
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

    // ── Renderer bootstrap (async) ───────────────────────────
    // The first colored pixel happens here.
    (async function bootstrap() {
      let renderer;
      try {
        renderer = await gpu.create(canvas);
      } catch (err) {
        // Race: another setView fired before we awaited. Drop
        // the half-created renderer; nothing to clean.
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

      // Lost-race teardown — view changed while we were awaiting.
      if (local.destroyed) {
        try { renderer.destroy(); } catch (e) { /* ignore */ }
        return;
      }
      local.renderer = renderer;

      // Update status: device acquired, surface format known.
      const devEl = document.getElementById('forge-status-device');
      const surEl = document.getElementById('forge-status-surface');
      if (devEl) {
        devEl.textContent = 'active';
        devEl.classList.remove('forge-status-pending');
        devEl.classList.add('forge-status-ok');
      }
      if (surEl) {
        surEl.textContent = renderer.format + ' · ' + (window.devicePixelRatio || 1) + '×dpr';
      }

      // Initial paint. Do NOT defer through requestAnimationFrame
      // — Chrome throttles rAF in hidden / background tabs (the
      // preview iframe is one), so the first frame can be deferred
      // indefinitely. By the time bootstrap's await returns, layout
      // has already settled (we awaited the GPU device, which
      // takes orders of magnitude longer than a layout pass).
      // Paint synchronously; the ResizeObserver below handles
      // subsequent changes.
      resizeAndDraw();

      // ResizeObserver — re-fits + redraws on viewport change.
      // Atlas's window-resize chain also fires the global
      // ResizeObserver in app.js which calls setView for the
      // current view; that re-mounts Forge cleanly. The local
      // observer here handles in-place pane resizes (sidebar
      // collapse, detail-panel toggle) without a full remount.
      local.resizeObs = new ResizeObserver(() => {
        if (local.destroyed) return;
        resizeAndDraw();
      });
      local.resizeObs.observe(stage);
    })();

    // ── resize + redraw ─────────────────────────────────────
    // Single source of truth for "what should the canvas show".
    // Reads stage CSS size, resizes the renderer, draws the disk.
    function resizeAndDraw() {
      if (!local.renderer || local.destroyed) return;
      const rect = stage.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      if (w === local.lastSize.w && h === local.lastSize.h) {
        // Same size — repaint anyway in case loseContext fired.
        drawScene();
        return;
      }
      local.lastSize = { w, h };
      // CSS size — explicit so the canvas owns its layout box.
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      // Backing-store size + context re-configure happens inside
      // the renderer's resize().
      local.renderer.resize(w, h);
      drawScene();
    }

    function drawScene() {
      if (!local.renderer || local.destroyed) return;
      const w = local.lastSize.w;
      const h = local.lastSize.h;
      if (!w || !h) return;
      // Disk: centre of canvas, sized to a fraction of min(w, h).
      const cx = w / 2;
      const cy = h / 2;
      const r  = Math.min(w, h) * DISK_FRACTION;
      local.renderer.drawDisk(cx, cy, r, FIRST_DISK_COLOR, { w, h });
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
    })[c]);
  }

  // Expose on window so the VIEWS dispatch can route to us.
  window._forge = { render: render };
})();
