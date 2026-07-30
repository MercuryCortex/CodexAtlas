// ============================================================
// CODEX ATLAS — FORGE FX PANEL
// ============================================================
//
// Phase 23.1c RETRY (2026-05-25 NIGHT) — fresh carve.
//
// Lifted from src/js/views/forge.js (`wireFXPanel()`, lines
// 5665-5814 at the time of carve). Pure refactor; behavior is
// byte-identical to the inlined version.
//
// BOUNDARY CONTRACT:
//   window._forgeFXPanel.attach({ local })
//
//   `local` is the forge.js per-mount state object — the FX
//   panel mutates `local._fxToggles` to expose toggle state
//   to the JS-side hover/click handlers in forge.js.
//
// AST-VALIDATED: scripts/forge_carve_deps.py confirmed the
// ONLY free identifier inside this function is `local`. The
// previous (cherry-picked) carve attempt over-declared
// `renderer` and crashed at boot — bootstrap-catch surfaced
// it; per-carve smoke gate caught it before commit.
// ============================================================
(function () {
  function attach({ local }) {
    const btn   = document.getElementById('forge-fxpanel-btn');
    const panel = document.getElementById('forge-fxpanel');
    if (!btn || !panel) return;
    const LS_KEY = 'forge.fxParams.v4';

    function formatForCss(key, raw) {
      const n = parseFloat(raw);
      if (key === 'period')                 return n.toFixed(1) + 's';
      if (key === 'pulse-duration')         return n.toFixed(2) + 's';
      if (key === 'pulse-size-mult')        return n.toFixed(1);
      if (key.indexOf('blur') === 0)        return n.toFixed(1) + 'px';
      if (key.indexOf('hue-') === 0 || key.indexOf('-hue-') > 0) return n.toFixed(0) + 'deg';
      if (key.indexOf('hull-hue') === 0)    return n.toFixed(0) + 'deg';
      return n.toFixed(2);
    }
    function formatForDisplay(key, raw) {
      const n = parseFloat(raw);
      if (key === 'period')                 return n.toFixed(1) + 's';
      if (key === 'pulse-duration')         return n.toFixed(2) + 's';
      if (key === 'pulse-size-mult')        return n.toFixed(1) + '×';
      if (key.indexOf('blur') === 0)        return n.toFixed(1) + 'px';
      if (key.indexOf('hue-') === 0 || key.indexOf('-hue-') > 0 || key.indexOf('hull-hue') === 0) {
        return (n > 0 ? '+' : '') + n.toFixed(0) + '°';
      }
      return n.toFixed(2);
    }

    const sliders = Array.from(panel.querySelectorAll('input[type="range"]'));
    const toggles = Array.from(panel.querySelectorAll('[data-fx-toggle]'));
    const defaults = Object.create(null);
    for (const s of sliders) defaults[s.getAttribute('data-fx')] = s.value;
    const toggleDefaults = Object.create(null);
    for (const t of toggles) toggleDefaults[t.getAttribute('data-fx-toggle')] = false;

    function applyOne(key, val) {
      document.body.style.setProperty('--fx-' + key, formatForCss(key, val));
      const valEl = panel.querySelector('[data-val="' + key + '"]');
      if (valEl) valEl.textContent = formatForDisplay(key, val);
    }

    function applyToggle(key, on) {
      const cls = 'fx-' + key;
      document.body.classList.toggle(cls, !!on);
      const tBtn = panel.querySelector('[data-fx-toggle="' + key + '"]');
      if (tBtn) tBtn.classList.toggle('is-on', !!on);
      local._fxToggles = local._fxToggles || Object.create(null);
      local._fxToggles[key] = !!on;
    }
    function loadSaved() {
      let saved = null;
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) saved = JSON.parse(raw);
      } catch (_) {}
      for (const s of sliders) {
        const key = s.getAttribute('data-fx');
        if (saved && typeof saved[key] === 'string') s.value = saved[key];
        applyOne(key, s.value);
      }
      const savedToggles = (saved && saved._toggles) || null;
      for (const t of toggles) {
        const key = t.getAttribute('data-fx-toggle');
        const on  = savedToggles && typeof savedToggles[key] === 'boolean'
          ? savedToggles[key]
          : toggleDefaults[key];
        applyToggle(key, on);
      }
    }
    function saveAll() {
      try {
        const state = {};
        for (const s of sliders) state[s.getAttribute('data-fx')] = s.value;
        const togState = Object.create(null);
        for (const t of toggles) {
          const key = t.getAttribute('data-fx-toggle');
          togState[key] = !!(local._fxToggles && local._fxToggles[key]);
        }
        state._toggles = togState;
        localStorage.setItem(LS_KEY, JSON.stringify(state));
      } catch (_) {}
    }
    function resetAll() {
      for (const s of sliders) {
        const key = s.getAttribute('data-fx');
        s.value = defaults[key];
        applyOne(key, s.value);
      }
      for (const t of toggles) {
        const key = t.getAttribute('data-fx-toggle');
        applyToggle(key, toggleDefaults[key]);
      }
      saveAll();
    }

    let savePending = 0;
    panel.addEventListener('input', (ev) => {
      const s = ev.target;
      if (!s || s.tagName !== 'INPUT' || !s.hasAttribute('data-fx')) return;
      const key = s.getAttribute('data-fx');
      applyOne(key, s.value);
      if (savePending) clearTimeout(savePending);
      savePending = setTimeout(() => { savePending = 0; saveAll(); }, 250);
    });
    const resetBtn = document.getElementById('forge-fxpanel-reset');
    if (resetBtn) resetBtn.addEventListener('click', resetAll);

    panel.addEventListener('click', (ev) => {
      const tBtn = ev.target.closest('[data-fx-toggle]');
      if (!tBtn) return;
      const key = tBtn.getAttribute('data-fx-toggle');
      const on = !(local._fxToggles && local._fxToggles[key]);
      applyToggle(key, on);
      saveAll();
    });

    function open()  { panel.classList.add('is-open');  panel.setAttribute('aria-hidden', 'false'); btn.setAttribute('aria-expanded', 'true');  }
    function close() { panel.classList.remove('is-open'); panel.setAttribute('aria-hidden', 'true');  btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (panel.classList.contains('is-open')) close(); else open();
    });
    // ONE DEV DOOR (2026-07-30, §3.2 step 3) — close-on-outside-click
    // + the module's own Esc DROPPED, deliberately: a tuning panel
    // that vanishes when you click the canvas to test the effect is
    // a broken tuning panel. The panel persists until its × (the LAB
    // idiom, declared in the bottombar template); Esc is owned by
    // the dev-drawer walk-back cascade (src/js/forge/dev-drawer.js).
    const xBtn = panel.querySelector('.forge-devpanel-x');
    if (xBtn) xBtn.addEventListener('click', close);

    loadSaved();
  }

  window._forgeFXPanel = { attach };
})();
