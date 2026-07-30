// ============================================================
// CODEX ATLAS — FORGE STYLE PANEL
// ============================================================
//
// Phase 23.1d RETRY (2026-05-25 NIGHT) — fresh carve.
//
// AST-VALIDATED DEPS: { drawFrame, local, rebuildHullElements, syncHulls }
//
// BOUNDARY CONTRACT:
//   window._forgeStylePanel.attach({ drawFrame, local, rebuildHullElements, syncHulls })
// ============================================================
(function () {
  function attach({ drawFrame, local, rebuildHullElements, syncHulls }) {
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
      if (TL_BAND_KEY_MAP[key] && window.AtlasTimelineChrome
          && typeof window.AtlasTimelineChrome.setBandStyle === 'function') {
        try { window.AtlasTimelineChrome.setBandStyle(TL_BAND_KEY_MAP[key], parseFloat(val)); }
        catch (_) {}
        return;
      }
      if (key.indexOf('conv-') === 0 && local._dividerMode === 'long-centered') {
        try { rebuildHullElements(); syncHulls(); } catch (_) {}
      }
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
    // ONE DEV DOOR (2026-07-30, §3.2 step 3) — same deliberate change
    // as fx-panel.js: outside-click close + own-Esc dropped; the panel
    // persists until its × (declared in the bottombar template); Esc
    // is owned by the dev-drawer walk-back (src/js/forge/dev-drawer.js).
    const xBtn = panel.querySelector('.forge-devpanel-x');
    if (xBtn) xBtn.addEventListener('click', close);

    loadSaved();
  }

  window._forgeStylePanel = { attach };
})();
