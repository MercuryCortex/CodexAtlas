// ============================================================
// CODEX ATLAS — FORGE · FX PANEL (Phase 23.1c carve)
// ============================================================
//
// Filed: 2026-05-25 by watcher-claude-lead.
// Lift-and-shift of `wireFXPanel()` from src/js/views/forge.js.
// PURE REFACTOR — no behavior change.
//
// Owns the FX param-tuning panel (sliders + color pickers for
// the runtime-tunable rendering params).
//
// Boundary contract — minimum scope refs:
//   window._forgeFXPanel.attach({ local, recomputeFocus, renderer })
// (Verified by scanning the function body for external symbol use.)
// ============================================================
(function () {
  'use strict';
  function attach(deps) {
    const local          = deps.local;
    const recomputeFocus = deps.recomputeFocus;
    const renderer       = deps.renderer;

        const btn   = document.getElementById('forge-fxpanel-btn');
        const panel = document.getElementById('forge-fxpanel');
        if (!btn || !panel) return;
        // Phase 21AC (2026-05-22) — bumped from v1 → v2 when we
        // swapped the flicker-spike model for the heartbeat. v1
        // values reference dead keys (bright-flicker, -big) and
        // outdated defaults; ignore them silently on first load.
        const LS_KEY = 'forge.fxParams.v4';

        // Format each slider's value for the on-screen readout AND
        // for the CSS var write. Three flavors:
        //   - blur-*       → "<n>px"
        //   - *-hue-peak   → "<n>deg" (CSS) / "<n>°" (display)
        //   - everything   → bare number (1.30 etc.)
        function formatForCss(key, raw) {
          const n = parseFloat(raw);
          if (key === 'period')                 return n.toFixed(1) + 's';
          if (key === 'pulse-duration')         return n.toFixed(2) + 's';
          if (key === 'pulse-size-mult')        return n.toFixed(1);          // unitless (read by JS)
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
        // Snapshot of defaults from the markup so RESET works.
        const defaults = Object.create(null);
        for (const s of sliders) defaults[s.getAttribute('data-fx')] = s.value;
        // Toggle defaults — all OFF in markup.
        const toggleDefaults = Object.create(null);
        for (const t of toggles) toggleDefaults[t.getAttribute('data-fx-toggle')] = false;

        function applyOne(key, val) {
          document.body.style.setProperty('--fx-' + key, formatForCss(key, val));
          const valEl = panel.querySelector('[data-val="' + key + '"]');
          if (valEl) valEl.textContent = formatForDisplay(key, val);
        }

        function applyToggle(key, on) {
          const cls = 'fx-' + key;     // e.g. 'fx-pulse-enabled'
          document.body.classList.toggle(cls, !!on);
          // Mirror UI state on the corresponding button.
          const btn = panel.querySelector('[data-fx-toggle="' + key + '"]');
          if (btn) btn.classList.toggle('is-on', !!on);
          // Expose for the JS-side hover/click handlers.
          local._fxToggles = local._fxToggles || Object.create(null);
          local._fxToggles[key] = !!on;
        }
        // Load saved values (if any) and push to body + sliders + readouts.
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

        // Slider drag → live-update var + readout (+ debounced LS write).
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

        // Toggle-row clicks (Phase 21AE) — pulse-enabled, etc.
        panel.addEventListener('click', (ev) => {
          const btn = ev.target.closest('[data-fx-toggle]');
          if (!btn) return;
          const key = btn.getAttribute('data-fx-toggle');
          const on = !(local._fxToggles && local._fxToggles[key]);
          applyToggle(key, on);
          saveAll();
        });

        // Open / close (same pattern as wireViewSettings).
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
  window._forgeFXPanel = { attach };
})();
