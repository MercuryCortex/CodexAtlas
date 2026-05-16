/*!
 * dev-panel.js — Codex Atlas live-style-tweak panel
 *
 * Gated by ?dev=1 or ?webgl=1 — completely dormant in production.
 * D key (when not in an input field) toggles the drawer open/closed.
 * Settings persist to localStorage['codex-atlas/dev-panel-v1'].
 *
 * Exposes window.CODEX_DEV so pantheon-v2.js can read live settings
 * from nodeReducer and register its sigma instance after render.
 *
 * Live-update mechanism per control type:
 *   edgeOpacity / hullOpacity  → CSS custom properties (instant, no JS)
 *   nodeSizeMult / hubThreshold → sigma.refresh({ skipIndexation: true })
 *   edgeCurvature               → rebuilds SVG edge path `d` attributes
 */
(function () {
  'use strict';

  const sp = new URLSearchParams(location.search);
  if (sp.get('dev') !== '1' && sp.get('webgl') !== '1') return;

  const LS_KEY = 'codex-atlas/dev-panel-v1';

  const DEFAULTS = {
    edgeOpacity:   0.55,
    edgeCurvature: 0.35,
    nodeSizeMult:  1.0,
    hubThreshold:  6,
    hullOpacity:   0.12,
  };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, +v || 0)); }

  let S = { ...DEFAULTS };
  try { Object.assign(S, JSON.parse(localStorage.getItem(LS_KEY) || '{}')); } catch (e) {}
  S.edgeOpacity   = clamp(S.edgeOpacity,   0,   1);
  S.edgeCurvature = clamp(S.edgeCurvature, 0,   0.6);
  S.nodeSizeMult  = clamp(S.nodeSizeMult,  0.5, 2.5);
  S.hubThreshold  = clamp(S.hubThreshold,  1,   30);
  S.hullOpacity   = clamp(S.hullOpacity,   0,   0.4);

  // Expose so pantheon-v2.js nodeReducer can read live values and
  // so render() can register sigma + overlay data after init.
  window.CODEX_DEV = { settings: S, _sigma: null, _edgeEls: null, _positions: null };

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {}
  }

  // ── CSS vars (instant — no JS re-render needed) ──────────────────
  function applyCssVars() {
    const r = document.documentElement;
    r.style.setProperty('--ph2-edge-opacity',         S.edgeOpacity);
    r.style.setProperty('--ph2-hull-opacity',         S.hullOpacity);
    r.style.setProperty('--ph2-hull-stroke-opacity',  Math.min(1, S.hullOpacity * 2.5));
  }

  // ── sigma refresh (node size + label threshold) ──────────────────
  function sigmaRefresh() {
    const d = window.CODEX_DEV;
    if (d._sigma) d._sigma.refresh({ skipIndexation: true });
  }

  // ── edge SVG path rebuild (curvature) ────────────────────────────
  function rebuildEdges() {
    const { _edgeEls, _positions } = window.CODEX_DEV;
    if (!_edgeEls || !_positions) return;
    const pull = S.edgeCurvature;
    _edgeEls.forEach(({ el, s, t }) => {
      const sp2 = _positions.get(s);
      const tp2 = _positions.get(t);
      if (!sp2 || !tp2) return;
      const mx  = (sp2.x + tp2.x) / 2;
      const my  = (sp2.y + tp2.y) / 2;
      const cxp = mx + (0 - mx) * pull;
      const cyp = my + (0 - my) * pull;
      el.setAttribute('d', `M ${sp2.x},${sp2.y} Q ${cxp},${cyp} ${tp2.x},${tp2.y}`);
    });
  }

  // Apply stored settings immediately on script load
  applyCssVars();

  // ── Panel HTML + CSS ─────────────────────────────────────────────
  const PANEL_ID = 'codex-dev-panel';
  const TAB_ID   = 'codex-dev-tab';

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #${PANEL_ID} {
      position: fixed; top: 60px; right: 0;
      width: 264px;
      background: rgba(13,17,25,0.97);
      border: 1px solid var(--border, #2a2e3a);
      border-right: none;
      border-radius: 6px 0 0 6px;
      box-shadow: -4px 4px 28px rgba(0,0,0,0.65);
      font-family: var(--mono, 'JetBrains Mono', monospace);
      font-size: 11px;
      color: var(--text-0, #c8cdd8);
      z-index: 9000;
      transform: translateX(calc(100% + 1px));
      transition: transform 220ms cubic-bezier(.4,0,.2,1);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      user-select: none;
    }
    #${PANEL_ID}.open { transform: translateX(0); }
    #${TAB_ID} {
      position: fixed; top: 80px; right: 0;
      padding: 7px 5px;
      background: rgba(13,17,25,0.88);
      border: 1px solid var(--border, #2a2e3a);
      border-right: none;
      border-radius: 4px 0 0 4px;
      cursor: pointer;
      z-index: 8999;
      font-size: 11px;
      font-family: var(--mono, monospace);
      color: var(--text-2, #7a8090);
      letter-spacing: 0.06em;
      writing-mode: vertical-rl;
      line-height: 1.1;
      transition: color 150ms, background 150ms, opacity 200ms;
    }
    #${TAB_ID}:hover { color: var(--gold, #d4a35a); }
    #${TAB_ID}.hidden { opacity: 0; pointer-events: none; }
    .dp-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px 7px;
      border-bottom: 1px solid var(--border, #2a2e3a);
      font-weight: 600; letter-spacing: 0.05em;
      color: var(--gold, #d4a35a); font-size: 11px;
    }
    .dp-close {
      background: none; border: none; cursor: pointer;
      color: var(--text-2, #7a8090); font-size: 14px; padding: 0 2px; line-height: 1;
    }
    .dp-close:hover { color: var(--text-0, #c8cdd8); }
    .dp-body { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 7px; }
    .dp-row { display: flex; flex-direction: column; gap: 3px; }
    .dp-label {
      display: flex; justify-content: space-between; align-items: baseline;
      color: var(--text-2, #7a8090); font-size: 10px;
      text-transform: uppercase; letter-spacing: 0.07em;
    }
    .dp-val { color: var(--text-0, #c8cdd8); font-weight: 600; font-size: 10.5px; }
    .dp-slider {
      width: 100%; -webkit-appearance: none; appearance: none;
      height: 3px; border-radius: 2px;
      background: linear-gradient(to right,
        var(--gold, #d4a35a) 0%,
        var(--gold, #d4a35a) var(--pct, 50%),
        var(--border, #2a2e3a) var(--pct, 50%));
      outline: none; cursor: pointer; margin: 1px 0;
    }
    .dp-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 13px; height: 13px; border-radius: 50%;
      background: var(--gold, #d4a35a);
      border: 2px solid rgba(13,17,25,0.9);
      box-shadow: 0 0 0 1px var(--gold, #d4a35a);
      cursor: grab; transition: transform 120ms;
    }
    .dp-slider:active::-webkit-slider-thumb { transform: scale(1.2); cursor: grabbing; }
    .dp-divider { border: none; border-top: 1px solid var(--border, #2a2e3a); margin: 1px 0; }
    .dp-actions { display: flex; gap: 6px; padding-top: 2px; }
    .dp-btn {
      flex: 1; padding: 5px 0;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border, #2a2e3a); border-radius: 3px;
      color: var(--text-1, #a0a8b8);
      font-family: var(--mono, monospace); font-size: 10.5px;
      cursor: pointer; transition: background 150ms, color 150ms;
    }
    .dp-btn:hover { background: rgba(212,163,90,0.15); color: var(--gold, #d4a35a); }
    .dp-hint {
      text-align: center; color: var(--text-3, #4a5060);
      font-size: 9.5px; padding-top: 2px; letter-spacing: 0.05em;
    }
  `;
  document.head.appendChild(styleEl);

  // ── Control descriptors ──────────────────────────────────────────
  const CONTROLS = [
    {
      id: 'edgeOpacity', label: 'Edge opacity',
      min: 0, max: 1, step: 0.01,
      fmt: v => v.toFixed(2),
      onInput: () => applyCssVars(),
    },
    {
      id: 'edgeCurvature', label: 'Edge curvature',
      min: 0, max: 0.6, step: 0.01,
      fmt: v => Math.round(v * 100) + '%',
      onInput: (input) => {
        clearTimeout(input._debounce);
        input._debounce = setTimeout(rebuildEdges, 50);
      },
    },
    {
      id: 'nodeSizeMult', label: 'Node size ×',
      min: 0.5, max: 2.5, step: 0.1,
      fmt: v => v.toFixed(1),
      onInput: () => sigmaRefresh(),
    },
    {
      id: 'hubThreshold', label: 'Label threshold (deg ≥)',
      min: 1, max: 20, step: 1,
      fmt: v => String(Math.round(v)),
      onInput: () => sigmaRefresh(),
    },
    {
      id: 'hullOpacity', label: 'Hull opacity',
      min: 0, max: 0.4, step: 0.01,
      fmt: v => v.toFixed(2),
      onInput: () => applyCssVars(),
    },
  ];

  function pct(v, min, max) { return ((v - min) / (max - min) * 100).toFixed(1) + '%'; }

  // ── Build panel DOM ──────────────────────────────────────────────
  let _open = false;

  function buildPanel() {
    if (document.getElementById(PANEL_ID)) return;

    // Tab button (always visible when panel is closed)
    const tab = document.createElement('button');
    tab.id = TAB_ID;
    tab.title = 'Dev Panel  (D)';
    tab.textContent = '⚙ DEV';
    document.body.appendChild(tab);
    tab.addEventListener('click', () => setOpen(true));

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.setAttribute('aria-label', 'Dev Panel');

    const rows = CONTROLS.map(c => `
      <div class="dp-row">
        <label class="dp-label">
          ${c.label}
          <span class="dp-val" id="dpv-${c.id}">${c.fmt(S[c.id])}</span>
        </label>
        <input class="dp-slider" type="range" id="dp-${c.id}"
          min="${c.min}" max="${c.max}" step="${c.step}" value="${S[c.id]}"
          style="--pct:${pct(S[c.id], c.min, c.max)}">
      </div>
    `).join('<hr class="dp-divider">');

    panel.innerHTML = `
      <div class="dp-header">
        <span>⚙ Dev Panel</span>
        <button class="dp-close" id="dp-close-btn" title="Close (D)">✕</button>
      </div>
      <div class="dp-body">
        ${rows}
        <hr class="dp-divider">
        <div class="dp-actions">
          <button class="dp-btn" id="dp-copy">Copy JSON</button>
          <button class="dp-btn" id="dp-reset">Reset</button>
        </div>
        <div class="dp-hint">D key toggles &nbsp;·&nbsp; ?dev=1 to activate</div>
      </div>
    `;
    document.body.appendChild(panel);

    // Wire sliders
    CONTROLS.forEach(c => {
      const input = document.getElementById('dp-' + c.id);
      const valEl = document.getElementById('dpv-' + c.id);
      input.addEventListener('input', () => {
        S[c.id] = parseFloat(input.value);
        valEl.textContent = c.fmt(S[c.id]);
        input.style.setProperty('--pct', pct(S[c.id], c.min, c.max));
        c.onInput(input);
        save();
      });
    });

    document.getElementById('dp-close-btn').addEventListener('click', () => setOpen(false));

    document.getElementById('dp-copy').addEventListener('click', () => {
      const btn = document.getElementById('dp-copy');
      const text = JSON.stringify(S, null, 2);
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy JSON'; }, 1600);
      }).catch(() => {
        // Fallback for browsers without clipboard API
        prompt('Copy these values:', text);
      });
    });

    document.getElementById('dp-reset').addEventListener('click', () => {
      Object.assign(S, DEFAULTS);
      save();
      applyCssVars();
      sigmaRefresh();
      rebuildEdges();
      CONTROLS.forEach(c => {
        const input = document.getElementById('dp-' + c.id);
        input.value = S[c.id];
        input.style.setProperty('--pct', pct(S[c.id], c.min, c.max));
        document.getElementById('dpv-' + c.id).textContent = c.fmt(S[c.id]);
      });
    });
  }

  function setOpen(open) {
    _open = open;
    const panel = document.getElementById(PANEL_ID);
    const tab   = document.getElementById(TAB_ID);
    if (panel) panel.classList.toggle('open', open);
    if (tab)   tab.classList.toggle('hidden', open);
  }

  function togglePanel() { setOpen(!_open); }

  // Keyboard: D toggles
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'd' && e.key !== 'D') return;
    const tag = (document.activeElement || {}).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    togglePanel();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildPanel);
  } else {
    buildPanel();
  }

}());
