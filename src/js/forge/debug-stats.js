// ============================================================
// CODEX ATLAS — FORGE DEBUG STATS POPOVER
// ============================================================
//
// Phase 23.1h RETRY (2026-05-25 NIGHT) — fresh carve.
//
// AST-VALIDATED DEPS: { local }
// BOUNDARY CONTRACT:
//   window._forgeDebugStats.attach({ local })
// ============================================================
(function () {
  function attach({ local }) {
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
