// ============================================================
// CODEX ATLAS — FORGE · STYLE PANEL (Phase 23.1d carve)
// ============================================================
// Filed: 2026-05-25 by watcher-claude-lead.
// Lift-and-shift of `wireStylePanel()`. PURE REFACTOR.
//
// Boundary: window._forgeStylePanel.attach({ camera, local })
// ============================================================
(function () {
  'use strict';
  function attach(deps) {
    const camera = deps.camera;
    const local = deps.local;

        const btn   = document.getElementById('forge-stylepanel-btn');
        const panel = document.getElementById('forge-stylepanel');
        if (!btn || !panel) return;
        const LS_KEY = 'forge.styleParams.v1';
        const controls = Array.from(panel.querySelectorAll('[data-style]'));
        const defaults = Object.create(null);
        for (const c of controls) defaults[c.getAttribute('data-style')] = c.value;

        function formatForCss(key, raw) {
          const n = parseFloat(raw);
          if (key === 'ring-width' || key === 'sep-width') return n.toFixed(1) + 'px';
          if (key === 'tl-band-stroke-w' || key === 'tl-label-size'
              || key === 'tl-axis-width' || key === 'tl-grid-width'
              || key === 'tl-yr0-size' || key === 'tl-yr0-width') return n.toFixed(1) + 'px';
          if (/opacity$/.test(key))                        return n.toFixed(2);
          if (/^tl-(band-fill|band-stroke|label-opacity|axis-opacity|grid-opacity|yr0-opacity)$/.test(key)) return n.toFixed(2);
          // Color pickers: raw value is already a #rrggbb string.
          return raw;
        }
        function formatForDisplay(key, raw) {
          const n = parseFloat(raw);
          if (key === 'ring-width' || key === 'sep-width') return n.toFixed(1) + 'px';
          if (key === 'tl-band-stroke-w' || key === 'tl-axis-width' || key === 'tl-grid-width' || key === 'tl-yr0-width') return n.toFixed(1) + 'px';
          if (key === 'tl-label-size' || key === 'tl-yr0-size') return Math.round(n) + 'px';
          if (/opacity$/.test(key))                        return n.toFixed(2);
          if (/^tl-(band-fill|band-stroke|label-opacity|axis-opacity|grid-opacity|yr0-opacity)$/.test(key)) return n.toFixed(2);
          return raw;
        }
        // Phase 22-I → 22-M (2026-05-24) — timeline keys map to chrome state.
        const TL_BAND_KEY_MAP = {
          'tl-band-fill':     'fillAlpha',
          'tl-band-stroke':   'strokeAlpha',
          'tl-band-stroke-w': 'strokeWidth',
          'tl-label-opacity': 'labelOpacity',
          'tl-label-size':    'labelSize',
          'tl-axis-opacity':  'axisOpacity',
          'tl-axis-width':    'axisWidth',
          'tl-grid-opacity':  'gridOpacity',
          'tl-grid-width':    'gridWidth',
          'tl-yr0-opacity':   'yr0Opacity',
          'tl-yr0-size':      'yr0Size',
          'tl-yr0-width':     'yr0Width',
        };
        function applyOne(key, val) {
          document.body.style.setProperty('--style-' + key, formatForCss(key, val));
          const valEl = panel.querySelector('[data-val="' + key + '"]');
          if (valEl) valEl.textContent = formatForDisplay(key, val);
          // Phase 22-I — timeline band style keys: dispatch to
          // AtlasTimelineChrome.setBandStyle so the SVG redraws.
          if (TL_BAND_KEY_MAP[key] && window.AtlasTimelineChrome
              && typeof window.AtlasTimelineChrome.setBandStyle === 'function') {
            try { window.AtlasTimelineChrome.setBandStyle(TL_BAND_KEY_MAP[key], parseFloat(val)); }
            catch (_) {}
            return;
          }
          // Converging gradient stops cache aggressively in SVG; any
          // conv-* change forces a clean rebuild + sync to flush.
          if (key.indexOf('conv-') === 0 && local._dividerMode === 'long-centered') {
            try { rebuildHullElements(); syncHulls(); } catch (_) {}
          }
          // Force a redraw so the changes appear without waiting for
          // a camera tick (same reason as the layer-toggle fix).
          try { if (typeof drawFrame === 'function') setTimeout(drawFrame, 0); } catch (_) {}
        }
        function loadSaved() {
          let saved = null;
          try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) saved = JSON.parse(raw);
          } catch (_) {}
          for (const c of controls) {
            const key = c.getAttribute('data-style');
            if (saved && typeof saved[key] === 'string') c.value = saved[key];
            applyOne(key, c.value);
          }
        }
        function saveAll() {
          try {
            const state = {};
            for (const c of controls) state[c.getAttribute('data-style')] = c.value;
            localStorage.setItem(LS_KEY, JSON.stringify(state));
          } catch (_) {}
        }
        function resetAll() {
          for (const c of controls) {
            const key = c.getAttribute('data-style');
            c.value = defaults[key];
            applyOne(key, c.value);
          }
          saveAll();
        }

        let savePending = 0;
        panel.addEventListener('input', (ev) => {
          const c = ev.target;
          if (!c || !c.hasAttribute('data-style')) return;
          const key = c.getAttribute('data-style');
          applyOne(key, c.value);
          if (savePending) clearTimeout(savePending);
          savePending = setTimeout(() => { savePending = 0; saveAll(); }, 250);
        });
        const resetBtn = document.getElementById('forge-stylepanel-reset');
        if (resetBtn) resetBtn.addEventListener('click', resetAll);

        function open()  { panel.classList.add('is-open');  panel.setAttribute('aria-hidden', 'false'); btn.setAttribute('aria-expanded', 'true');  }
        function close() { panel.classList.remove('is-open'); panel.setAttribute('aria-hidden', 'true');  btn.setAttribute('aria-expanded', 'false'); }
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

        loadSaved();
  }
  window._forgeStylePanel = { attach };
})();
