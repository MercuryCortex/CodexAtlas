// ============================================================
// CODEX ATLAS — FORGE · DEBUG-STATS (Phase 23.1 carve)
// ============================================================
// Lift-and-shift of `wireDebugStats()`. PURE REFACTOR.
// Boundary: window._forgeDebugStats.attach({ local })
// ============================================================
(function () {
  'use strict';
  function attach(deps) {
    const local = deps.local;

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
  window._forgeDebugStats = { attach };
})();
