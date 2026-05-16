/*!
 * dev-panel.js — Codex Atlas live-style-tweak panel (v2: 7-section / 24 controls)
 *
 * Gated by ?dev=1 or ?webgl=1 — completely dormant in production.
 * D key (when not in an input field) toggles the drawer open/closed.
 * Settings persist to localStorage['codex-atlas/dev-panel-v1'].
 *
 * Exposes window.CODEX_DEV.settings so pantheon-v2.js can read live values
 * from nodeReducer, relaxPositions, and the camera-init block.
 *
 * Apply mechanisms per control:
 *   cssVar         CSS custom property on :root — instant, no JS
 *   sigmaRefresh   sigma.refresh({skipIndexation:true}) — fast
 *   rebuildEdges   re-compute the SVG edge `d` attributes (curvature)
 *   camera         sigma.getCamera().setState({ratio})
 *   rerender       window._pantheonV2.rerender() — re-runs the full render
 *                  with new positions/baked layout (debounced 300 ms)
 */
(function () {
  'use strict';

  const sp = new URLSearchParams(location.search);
  if (sp.get('dev') !== '1' && sp.get('webgl') !== '1') return;

  const LS_KEY = 'codex-atlas/dev-panel-v1';

  // ── Control descriptors ─────────────────────────────────────────────
  // Each control has: id, label, min/max/step, default, target, [cssVar], [fmt]
  // Grouped into 7 sections (collapsible <details>).
  const SECTIONS = [
    {
      id: 'edges',
      title: 'Edges',
      openByDefault: true,
      items: [
        { id: 'edgeOpacity',   label: 'Idle opacity ×', min: 0,    max: 3,    step: 0.05, default: 0.20, target: 'cssVar', cssVar: '--ph2-edge-opacity-mult', fmt: v => v.toFixed(2) + '×' },
        { id: 'edgeWidth',     label: 'Idle width ×',   min: 0.4,  max: 3,    step: 0.05, default: 0.60, target: 'cssVar', cssVar: '--ph2-edge-width-mult',   fmt: v => v.toFixed(2) + '×' },
        { id: 'edgeCurvature', label: 'Curvature',      min: 0,    max: 0.6,  step: 0.01, default: 0.35, target: 'rebuildEdges',                                fmt: v => Math.round(v * 100) + '%' },
        { id: 'edgeHotWidth',  label: 'Hot width',      min: 0.6,  max: 3,    step: 0.1,  default: 1.6,  target: 'cssVar', cssVar: '--ph2-edge-hot-width',    fmt: v => v.toFixed(1) + 'px' },
      ]
    },
    {
      id: 'nodes',
      title: 'Nodes',
      items: [
        { id: 'nodeSizeMult',     label: 'Size ×',          min: 0.5, max: 2.5, step: 0.1, default: 1.0, target: 'sigmaRefresh',                                       fmt: v => v.toFixed(1) + '×' },
        { id: 'nodeLabelSize',    label: 'Label size',      min: 8,   max: 14,  step: 0.5, default: 10,  target: 'cssVar', cssVar: '--ph2-node-label-size',     fmt: v => v.toFixed(1) + 'px' },
        { id: 'nodeHubLabelSize', label: 'Hub label size',  min: 9,   max: 15,  step: 0.5, default: 11,  target: 'cssVar', cssVar: '--ph2-node-hub-label-size', fmt: v => v.toFixed(1) + 'px' },
      ]
    },
    {
      id: 'labels',
      title: 'Labels',
      items: [
        { id: 'hubThreshold',      label: 'Hub threshold (deg ≥)', min: 1,     max: 20,    step: 1,     default: 6,    target: 'sigmaRefresh',                                          fmt: v => String(Math.round(v)) },
        { id: 'rimLabelSize',      label: 'Rim label size',        min: 10,    max: 18,    step: 0.5,   default: 13,   target: 'cssVar', cssVar: '--ph2-rim-label-size',    fmt: v => v.toFixed(1) + 'px' },
        { id: 'rimLabelOpacity',   label: 'Rim label opacity',     min: 0.30,  max: 1.00,  step: 0.02,  default: 0.92, target: 'cssVar', cssVar: '--ph2-rim-label-opacity', fmt: v => v.toFixed(2) },
        { id: 'rimLabelSpacing',   label: 'Rim letter-spacing',    min: 0.05,  max: 0.40,  step: 0.01,  default: 0.22, target: 'cssVar', cssVar: '--ph2-rim-label-spacing', fmt: v => v.toFixed(2) + 'em', unit: 'em' },
      ]
    },
    {
      id: 'hulls',
      title: 'Hulls',
      items: [
        { id: 'hullOpacity',  label: 'Fill opacity',     min: 0,    max: 0.40, step: 0.01, default: 0.07,  target: 'cssVar', cssVar: '--ph2-hull-opacity',         fmt: v => v.toFixed(2) },
        { id: 'hullStrokeW',  label: 'Stroke width',     min: 0.2,  max: 2.0,  step: 0.1,  default: 0.8,   target: 'cssVar', cssVar: '--ph2-hull-stroke-width',    fmt: v => v.toFixed(1) + 'px' },
        { id: 'hullHotFill',  label: 'Hot fill',         min: 0.10, max: 0.50, step: 0.02, default: 0.20,  target: 'cssVar', cssVar: '--ph2-hull-hot-fill',        fmt: v => v.toFixed(2) },
        { id: 'hullDimFill',  label: 'Dim fill',         min: 0.005,max: 0.08, step: 0.005,default: 0.025, target: 'cssVar', cssVar: '--ph2-hull-dim-fill',        fmt: v => v.toFixed(3) },
      ]
    },
    {
      id: 'force',
      title: 'Force bake',
      items: [
        { id: 'anchorK',     label: 'Anchor stiffness', min: 0.005, max: 0.080, step: 0.002, default: 0.045, target: 'rerender', fmt: v => v.toFixed(3) },
        { id: 'chargeK',     label: 'Charge repulsion', min: -1200, max: -100,  step: 25,    default: -260,  target: 'rerender', fmt: v => String(Math.round(v)) },
        { id: 'chargeRange', label: 'Charge range',     min: 60,    max: 320,   step: 10,    default: 180,   target: 'rerender', fmt: v => String(Math.round(v)) },
        { id: 'damp',        label: 'Velocity damping', min: 0.30,  max: 0.85,  step: 0.02,  default: 0.55,  target: 'rerender', fmt: v => v.toFixed(2) },
      ]
    },
    {
      id: 'camera',
      title: 'Camera',
      items: [
        { id: 'cameraRatio', label: 'Zoom ratio', min: 0.30, max: 1.80, step: 0.02, default: 1.32, target: 'camera', fmt: v => v.toFixed(2) + '×' },
      ]
    },
    {
      id: 'ui',
      title: 'Refinements',
      items: [
        { id: 'tickOpacity', label: 'Tick opacity', min: 0.05, max: 0.95, step: 0.05, default: 0.45, target: 'cssVar', cssVar: '--ph2-tick-opacity', fmt: v => v.toFixed(2) },
      ]
    }
  ];

  // Flatten + default map
  const ALL_CONTROLS = SECTIONS.flatMap(s => s.items.map(c => ({ ...c, sectionId: s.id })));
  const DEFAULTS = {};
  ALL_CONTROLS.forEach(c => { DEFAULTS[c.id] = c.default; });

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, +v || 0)); }

  // Load settings from storage, clamped to range
  let S = { ...DEFAULTS };
  try {
    const stored = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    Object.assign(S, stored);
  } catch (e) {}
  ALL_CONTROLS.forEach(c => { S[c.id] = clamp(S[c.id], c.min, c.max); });

  // Expose so pantheon-v2 read live values
  window.CODEX_DEV = window.CODEX_DEV || {};
  window.CODEX_DEV.settings    = S;
  window.CODEX_DEV._sigma      = null;
  window.CODEX_DEV._edgeEls    = null;
  window.CODEX_DEV._positions  = null;

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {}
  }

  // ── Apply functions ─────────────────────────────────────────────────
  function applyCssVars() {
    const r = document.documentElement;
    ALL_CONTROLS.forEach(c => {
      if (c.target !== 'cssVar') return;
      const val = c.unit ? (S[c.id] + c.unit) : S[c.id];
      r.style.setProperty(c.cssVar, val);
    });
    // Hull stroke-opacity derived from hull fill opacity. Was × 2.5 (matched
    // production .sector-hull which uses 0.07 fill + 0.30 stroke), but at V2's
    // 0.12 fill that gave a loud 0.30 colored outline that read as "lit-up
    // wires" in the screenshot. × 1.4 keeps the outline subtle (~0.17).
    // Match P1's .sector-hull discipline: fill ~0.07, stroke ~0.30 fixed.
    r.style.setProperty('--ph2-hull-stroke-opacity', 0.30);
  }

  function sigmaRefresh() {
    const s = window.CODEX_DEV._sigma;
    if (s) s.refresh({ skipIndexation: true });
  }

  function rebuildEdges() {
    const d = window.CODEX_DEV;
    if (!d._edgeEls || !d._positions) return;
    const pull = S.edgeCurvature;
    d._edgeEls.forEach(({ el, s, t }) => {
      const sp2 = d._positions.get(s);
      const tp2 = d._positions.get(t);
      if (!sp2 || !tp2) return;
      const mx = (sp2.x + tp2.x) / 2;
      const my = (sp2.y + tp2.y) / 2;
      const cxp = mx + (0 - mx) * pull;
      const cyp = my + (0 - my) * pull;
      el.setAttribute('d', `M ${sp2.x},${sp2.y} Q ${cxp},${cyp} ${tp2.x},${tp2.y}`);
    });
  }

  function applyCamera() {
    const s = window.CODEX_DEV._sigma;
    if (!s) return;
    try { s.getCamera().setState({ ratio: S.cameraRatio }); } catch (e) {}
  }

  let _rerenderTimer = null;
  function scheduleRerender() {
    clearTimeout(_rerenderTimer);
    _rerenderTimer = setTimeout(() => {
      if (window._pantheonV2 && typeof window._pantheonV2.rerender === 'function') {
        window._pantheonV2.rerender();
      }
    }, 300);
  }

  // Apply ALL on first load (sets CSS vars + camera if sigma already present)
  applyCssVars();

  // ── Panel HTML + CSS ────────────────────────────────────────────────
  const PANEL_ID = 'codex-dev-panel';
  const TAB_ID   = 'codex-dev-tab';

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #${PANEL_ID} {
      position: fixed; top: 60px; right: 0; bottom: 60px;
      width: 280px;
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
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      user-select: none;
      display: flex; flex-direction: column;
    }
    #${PANEL_ID}.open { transform: translateX(0); }
    #${TAB_ID} {
      position: fixed; top: 80px; right: 0;
      padding: 7px 5px;
      background: rgba(13,17,25,0.88);
      border: 1px solid var(--border, #2a2e3a);
      border-right: none;
      border-radius: 4px 0 0 4px;
      cursor: pointer; z-index: 8999;
      font-size: 11px; font-family: var(--mono, monospace);
      color: var(--text-2, #7a8090); letter-spacing: 0.06em;
      writing-mode: vertical-rl; line-height: 1.1;
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
      flex-shrink: 0;
    }
    .dp-close { background: none; border: none; cursor: pointer; color: var(--text-2, #7a8090); font-size: 14px; padding: 0 2px; line-height: 1; }
    .dp-close:hover { color: var(--text-0, #c8cdd8); }
    .dp-body { padding: 4px 0 0; overflow-y: auto; flex: 1; }
    .dp-body::-webkit-scrollbar { width: 6px; }
    .dp-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
    .dp-section { border-bottom: 1px solid var(--border, #2a2e3a); }
    .dp-section:last-of-type { border-bottom: none; }
    .dp-section[open] .dp-sec-title::after { transform: rotate(90deg); }
    .dp-sec-title {
      padding: 7px 12px;
      cursor: pointer; list-style: none;
      font-weight: 600; letter-spacing: 0.06em;
      color: var(--text-1, #a0a8b8); font-size: 10.5px;
      text-transform: uppercase;
      display: flex; align-items: center; justify-content: space-between;
    }
    .dp-sec-title::-webkit-details-marker { display: none; }
    .dp-sec-title::after {
      content: '›'; color: var(--text-3, #4a5060); font-size: 14px;
      transition: transform 180ms ease; transform: rotate(0deg);
    }
    .dp-sec-title:hover { color: var(--gold, #d4a35a); }
    .dp-sec-body { padding: 4px 12px 10px; display: flex; flex-direction: column; gap: 7px; }
    .dp-row { display: flex; flex-direction: column; gap: 3px; }
    .dp-label {
      display: flex; justify-content: space-between; align-items: baseline;
      color: var(--text-2, #7a8090); font-size: 10px;
      letter-spacing: 0.04em;
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
    .dp-footer {
      flex-shrink: 0;
      padding: 8px 12px 10px;
      border-top: 1px solid var(--border, #2a2e3a);
      display: flex; flex-direction: column; gap: 6px;
    }
    .dp-actions { display: flex; gap: 6px; }
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
      font-size: 9.5px; letter-spacing: 0.05em;
    }
  `;
  document.head.appendChild(styleEl);

  function pct(v, min, max) { return ((v - min) / (max - min) * 100).toFixed(1) + '%'; }

  let _open = false;

  function buildPanel() {
    if (document.getElementById(PANEL_ID)) return;

    const tab = document.createElement('button');
    tab.id = TAB_ID;
    tab.title = 'Dev Panel  (D)';
    tab.textContent = '⚙ DEV';
    document.body.appendChild(tab);
    tab.addEventListener('click', () => setOpen(true));

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.setAttribute('aria-label', 'Dev Panel');

    const sectionsHtml = SECTIONS.map(sec => {
      const itemsHtml = sec.items.map(c => `
        <div class="dp-row">
          <label class="dp-label">${c.label} <span class="dp-val" id="dpv-${c.id}">${c.fmt(S[c.id])}</span></label>
          <input class="dp-slider" type="range" id="dp-${c.id}"
            min="${c.min}" max="${c.max}" step="${c.step}" value="${S[c.id]}"
            style="--pct:${pct(S[c.id], c.min, c.max)}">
        </div>
      `).join('');
      return `
        <details class="dp-section" ${sec.openByDefault ? 'open' : ''}>
          <summary class="dp-sec-title">${sec.title}<span style="font-size:9px;color:var(--text-3)">${sec.items.length}</span></summary>
          <div class="dp-sec-body">${itemsHtml}</div>
        </details>
      `;
    }).join('');

    panel.innerHTML = `
      <div class="dp-header">
        <span>⚙ Dev Panel · 24 controls</span>
        <button class="dp-close" id="dp-close-btn" title="Close (D)">✕</button>
      </div>
      <div class="dp-body">${sectionsHtml}</div>
      <div class="dp-footer">
        <div class="dp-actions">
          <button class="dp-btn" id="dp-copy">Copy JSON</button>
          <button class="dp-btn" id="dp-rebake">Re-bake</button>
          <button class="dp-btn" id="dp-reset">Reset</button>
        </div>
        <div class="dp-hint">D key toggles &nbsp;·&nbsp; ?dev=1 to activate</div>
      </div>
    `;
    document.body.appendChild(panel);

    // Wire each slider
    ALL_CONTROLS.forEach(c => {
      const input = document.getElementById('dp-' + c.id);
      const valEl = document.getElementById('dpv-' + c.id);
      input.addEventListener('input', () => {
        S[c.id] = parseFloat(input.value);
        valEl.textContent = c.fmt(S[c.id]);
        input.style.setProperty('--pct', pct(S[c.id], c.min, c.max));
        save();
        switch (c.target) {
          case 'cssVar':       applyCssVars(); break;
          case 'sigmaRefresh': sigmaRefresh(); break;
          case 'rebuildEdges':
            clearTimeout(input._t); input._t = setTimeout(rebuildEdges, 40);
            break;
          case 'camera':       applyCamera(); break;
          case 'rerender':     scheduleRerender(); break;
        }
      });
    });

    document.getElementById('dp-close-btn').addEventListener('click', () => setOpen(false));

    document.getElementById('dp-copy').addEventListener('click', () => {
      const btn = document.getElementById('dp-copy');
      const text = JSON.stringify(S, null, 2);
      const ok = () => { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy JSON'; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok).catch(() => prompt('Copy these values:', text));
      else { prompt('Copy these values:', text); ok(); }
    });

    document.getElementById('dp-rebake').addEventListener('click', () => {
      if (window._pantheonV2 && window._pantheonV2.rerender) window._pantheonV2.rerender();
    });

    document.getElementById('dp-reset').addEventListener('click', () => {
      Object.assign(S, DEFAULTS);
      save();
      applyCssVars();
      sigmaRefresh();
      applyCamera();
      rebuildEdges();
      ALL_CONTROLS.forEach(c => {
        const input = document.getElementById('dp-' + c.id);
        input.value = S[c.id];
        input.style.setProperty('--pct', pct(S[c.id], c.min, c.max));
        document.getElementById('dpv-' + c.id).textContent = c.fmt(S[c.id]);
      });
      // After a reset, also need a full re-render in case force constants changed
      scheduleRerender();
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
