// ============================================================
// CODEX ATLAS — FORGE DEBUG STATS POPOVER + perf HUD
// ============================================================
//
// Phase 23.1h RETRY (2026-05-25 NIGHT) — fresh carve.
// Phase debug-bar-move (2026-05-28) — rAF / longtask / fps perf
// tracking moved here FROM the inline <script> in index.html
// (which painted a forced-visible green banner at top-center).
// Now: perf data lives inside the # popover by default, with a
// PIN PERF BAR toggle that, when ON, recreates the floating
// top-center HUD until clicked off. State persists in LS so the
// user gets the same view across reloads.
//
// AST-VALIDATED DEPS: { local }
// BOUNDARY CONTRACT:
//   window._forgeDebugStats.attach({ local })
// ============================================================
(function () {
  'use strict';

  const LS_PIN_KEY = 'atlas.debug.pinned';

  function attach({ local }) {
    const btn   = document.getElementById('forge-debug-btn');
    const panel = document.getElementById('forge-debug-panel');
    if (!btn || !panel) return;

    // ── Perf trackers (always-on; cheap when idle) ───────────
    // rAF interval = real FPS measure. If > 16ms with cheap frame
    // work, the bottleneck is compositor / DOM / GPU sync.
    const rafIntervals = [];
    let lastRafT = 0;
    function rafTick(t) {
      if (lastRafT) {
        const gap = t - lastRafT;
        rafIntervals.push(gap);
        if (rafIntervals.length > 120) rafIntervals.shift();
      }
      lastRafT = t;
      requestAnimationFrame(rafTick);
    }
    requestAnimationFrame(rafTick);

    // longtask observer catches >50ms main-thread blockers.
    // Safari may not implement longtask — wrapped in try.
    let longTaskCount = 0;
    let longTaskTotalMs = 0;
    try {
      if (typeof PerformanceObserver === 'function') {
        const po = new PerformanceObserver(list => {
          list.getEntries().forEach(e => {
            longTaskCount++;
            longTaskTotalMs += e.duration;
          });
        });
        po.observe({ entryTypes: ['longtask'] });
      }
    } catch (_) { /* Safari quirk — silently skip */ }

    function statsFromArr(arr) {
      if (!arr.length) return { avg: 0, p95: 0, max: 0 };
      const sorted = arr.slice().sort((a, b) => a - b);
      return {
        avg: +(arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1),
        p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
        max: +sorted[sorted.length - 1].toFixed(1),
      };
    }
    function colorFor(ms) {
      if (ms < 8)  return '#1a8';
      if (ms < 17) return '#2a6';
      if (ms < 33) return '#c81';
      return '#e22';
    }
    function getPerfSnapshot() {
      const r = statsFromArr(rafIntervals);
      const fps = r.avg ? Math.round(1000 / r.avg) : 0;
      const s = (window._forgeDebug && window._forgeDebug.frameStats) ? window._forgeDebug.frameStats() : null;
      const line = '● ' + (s ? s.activeNodes + 'n' : '?') + ' · '
        + 'rAF ' + r.avg + '/' + r.p95 + '/' + r.max + 'ms (' + fps + 'fps)'
        + ' · frame ' + (s ? s.avg + '/' + s.p95 : '?') + 'ms'
        + ' · hover ' + (s ? s.rfAvg + '/' + s.rfMax : '?') + 'ms'
        + ' · longtasks ' + longTaskCount + ' (' + Math.round(longTaskTotalMs) + 'ms)';
      const worstMs = Math.max(r.avg || 0, s ? (s.avg || 0) : 0, s ? (s.rfAvg || 0) : 0);
      return { line, worstMs, r, fps };
    }

    // ── Pinned floating HUD bar (off by default) ─────────────
    let pinnedBar = null;
    let pinnedTimer = 0;
    function pinFloatingBar() {
      if (pinnedBar) return;
      pinnedBar = document.createElement('div');
      pinnedBar.className = 'forge-hud-banner';
      pinnedBar.id        = 'forge-hud-banner';
      document.body.appendChild(pinnedBar);
      function tick() {
        const snap = getPerfSnapshot();
        pinnedBar.textContent = snap.line;
        pinnedBar.style.background = colorFor(snap.worstMs);
      }
      tick();
      pinnedTimer = setInterval(tick, 250);
    }
    function unpinFloatingBar() {
      if (pinnedBar) { pinnedBar.remove(); pinnedBar = null; }
      if (pinnedTimer) { clearInterval(pinnedTimer); pinnedTimer = 0; }
    }
    function isPinned() {
      try { return localStorage.getItem(LS_PIN_KEY) === '1'; } catch (_) { return false; }
    }
    function setPinned(b) {
      try { localStorage.setItem(LS_PIN_KEY, b ? '1' : '0'); } catch (_) {}
      if (b) pinFloatingBar(); else unpinFloatingBar();
    }

    // Hydrate pin state from LS on attach
    if (isPinned()) pinFloatingBar();

    // ── Engine fields (existing source-of-truth spans) ───────
    const FIELDS = [
      { id: 'forge-status-device', label: 'device' },
      { id: 'forge-status-nodes',  label: 'nodes'  },
      { id: 'forge-status-edges',  label: 'edges'  },
      { id: 'forge-status-hover',  label: 'hover'  },
      { id: 'forge-status-lock',   label: 'lock'   },
      { id: 'forge-status-frame',  label: 'frame'  },
    ];

    function renderRows() {
      const snap = getPerfSnapshot();
      const r = snap.r;
      const perfRows = [
        '<div class="forge-debug-row"><span class="forge-debug-k">fps</span><span class="forge-debug-v">' + snap.fps + '</span></div>',
        '<div class="forge-debug-row"><span class="forge-debug-k">rAF avg/p95/max</span><span class="forge-debug-v">' + r.avg + '/' + r.p95 + '/' + r.max + 'ms</span></div>',
        '<div class="forge-debug-row"><span class="forge-debug-k">longtasks</span><span class="forge-debug-v">' + longTaskCount + ' (' + Math.round(longTaskTotalMs) + 'ms)</span></div>',
      ].join('');
      const engineRows = FIELDS.map(f => {
        const src = document.getElementById(f.id);
        const v = src ? src.textContent : '—';
        return '<div class="forge-debug-row">' +
          '<span class="forge-debug-k">' + f.label + '</span>' +
          '<span class="forge-debug-v">' + v + '</span>' +
        '</div>';
      }).join('');
      const pinRow = '<div class="forge-debug-row forge-debug-pin-row">' +
        '<span class="forge-debug-k">pin perf bar</span>' +
        '<button class="forge-debug-pin-btn" id="forge-debug-pin-btn" type="button">' +
        (isPinned() ? 'ON' : 'OFF') +
        '</button>' +
        '</div>';
      panel.innerHTML = perfRows + engineRows + pinRow;
      // Re-bind pin button after re-render (innerHTML wipes
      // previous listener). Stop propagation so the document-
      // click outside-close handler doesn't fire.
      const pinBtn = document.getElementById('forge-debug-pin-btn');
      if (pinBtn) {
        pinBtn.onclick = (ev) => {
          ev.stopPropagation();
          setPinned(!isPinned());
          renderRows();
        };
      }
    }

    function open() {
      renderRows();
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
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

  window._forgeDebugStats = { attach };
})();
