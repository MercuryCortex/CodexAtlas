// ============================================================
// CODEX ATLAS — THE DEV PANEL KIT (ONE dial machine)
// ============================================================
//
// 2026-07-31 — extracted from lab-panel.js when THE HOUSE got its
// own door. John, twice: "I ASKED TO DO ITS OWN CLEAN SIMPLE TO
// ACESS ONE OPANEL FOR HTIS". Two dev panels now render the same
// kind of rows, and a copy-pasted slider builder is two machines
// that drift — so there is exactly ONE `addSlider` in the tree and
// both panels drive it.
//
// WHAT THE KIT OWNS (and no caller may re-implement):
//   · the stylesheet — injected ONCE, scoped to `.forge-devkit`, so
//     every panel is the same object; a panel adds only its own id
//     rule if it needs a different berth;
//   · the row builders — slider / toggle-chips / radio-chips;
//   · collapsible sections + their remembered open state;
//   · the localStorage recipe blob (working memory) and the
//     copyable recipe line (the formal spec);
//   · Copy / Reset.
//
// WHAT A CALLER OWNS: its dial table, its sections, its recipe
// string, its storage keys. Nothing else.
//
// BOUNDARY CONTRACT:
//   window._forgePanelKit.mount(spec) -> { el, defaults, persist }
//
//   spec = {
//     id, title,                  // element id + the <h4> line
//     local, api,                 // forge.js mount state + refreshes
//     sliders: [[key,label,min,max,step,unit,mode]],
//     toggles: [[key,label]],
//     radios:  [[key,caption,options,apiAfter]],
//     extraKeys: [...],           // params owned via custom renders
//     sections: [{ id,title,hint,open,items:[{k:...}] }],
//     render: { <kind>(host, ctx) },   // custom item kinds
//     storeKey, openKey, seedFrom,     // LS keys (+ one-time import)
//     radioAfter,                 // default api name for a radio
//     recipe(), onRestore(),
//   }
//
// THE OPEN-STATE LAW (this bug shipped THREE unfindable controls in
// two days): the open map only seeds a section id it has NEVER
// stored. A section added after the key was first written therefore
// arrives at its DECLARED default — not silently collapsed because
// `undefined` is falsy. Every panel gets this for free here.
//
// DRIFT LAW (inherited from the LAB): the kit owns NO values. Every
// control reads its default from local.params and writes back the
// same key drawFrame reads per frame.
// ============================================================
(function () {
  'use strict';

  const CSS_ID = 'forge-panelkit-css';

  // The panel object, defined once. Was `#forge-lab-panel ...` when
  // the LAB was the only dev panel with dials; it is a CLASS now so
  // the second door is the same object rather than a look-alike.
  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    const css = document.createElement('style');
    css.id = CSS_ID;
    css.textContent = [
      '.forge-devkit{position:fixed;top:64px;right:12px;z-index:235;width:240px;max-height:calc(100vh - 140px);',
      'overflow-y:auto;background:rgba(10,8,22,.92);backdrop-filter:blur(10px);border:1px solid rgba(211,184,119,.28);',
      'border-radius:4px;padding:10px 12px;font:10px ui-monospace,"SF Mono",Menlo,monospace;color:#918ab4;',
      'letter-spacing:.06em;pointer-events:auto}',
      '.forge-devkit h4{margin:0 0 8px;font-size:10px;letter-spacing:.24em;color:#d3b877;font-weight:600}',
      '.forge-devkit .lp-row{margin:7px 0 2px;display:flex;justify-content:space-between;text-transform:uppercase;font-size:8.5px}',
      '.forge-devkit .lp-row b{color:#d3b877;font-weight:600}',
      // SAFARI FIX (2026-07-29): Safari ignores accent-color on range
      // inputs and fell back to the fat native white slider — the
      // panel looked broken next to Chromium. Style the track/thumb
      // explicitly; -webkit-appearance:none is what unlocks them.
      '.forge-devkit input[type=range]{width:100%;accent-color:#d3b877;height:14px;background:transparent;margin:0;',
      '-webkit-appearance:none;appearance:none}',
      '.forge-devkit input[type=range]::-webkit-slider-runnable-track{height:2px;border-radius:1px;',
      'background:rgba(145,138,180,.35)}',
      '.forge-devkit input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;',
      'width:10px;height:10px;margin-top:-4px;border-radius:50%;background:#d3b877;border:none}',
      '.forge-devkit input[type=range]::-moz-range-track{height:2px;border-radius:1px;background:rgba(145,138,180,.35)}',
      '.forge-devkit input[type=range]::-moz-range-thumb{width:10px;height:10px;border-radius:50%;background:#d3b877;border:none}',
      '.forge-devkit .lp-chips{display:flex;gap:4px;flex-wrap:wrap;margin:6px 0}',
      '.forge-devkit .lp-chip{font:8.5px ui-monospace,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;',
      'padding:4px 7px;border-radius:2px;cursor:pointer;background:transparent;color:#918ab4;border:1px solid rgba(145,138,180,.35)}',
      '.forge-devkit .lp-chip.on{color:#231b08;background:#d3b877;border-color:#d3b877}',
      '.forge-devkit .lp-cast{margin:4px 0 2px;font-size:8px;text-transform:uppercase;color:#5e5885}',
      // ── collapsible section headers ──
      '.forge-devkit .lp-sec{width:100%;display:flex;align-items:center;gap:6px;margin:9px 0 0;padding:5px 0;',
      'background:none;border:none;border-top:1px solid rgba(211,184,119,.16);cursor:pointer;',
      'font:9px ui-monospace,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:#d3b877;text-align:left}',
      '.forge-devkit .lp-sec:hover{color:#f0e2bd}',
      '.forge-devkit .lp-sec .lp-caret{display:inline-block;width:8px;color:#5e5885;transition:transform .12s ease-out}',
      '.forge-devkit .lp-sec.open .lp-caret{transform:rotate(90deg);color:#d3b877}',
      '.forge-devkit .lp-secbody{display:none;padding-bottom:2px}',
      '.forge-devkit .lp-secbody.open{display:block}',
      // A one-line plain-English gloss under a section header — John
      // is not an engineer; the group name alone is not enough.
      '.forge-devkit .lp-hint{margin:1px 0 4px;font-size:8px;line-height:1.45;color:#5e5885;letter-spacing:.04em}',
      '.forge-devkit .lp-recipe{margin-top:10px;padding:6px 8px;border:1px dashed rgba(211,184,119,.3);border-radius:3px;',
      'font-size:8.5px;line-height:1.5;color:#918ab4;word-break:break-word;user-select:all}',
      '.forge-devkit .lp-btns{display:flex;gap:6px;margin-top:8px}',
      '.forge-devkit .lp-btn{flex:1;font:9px ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;',
      'background:transparent;color:#d3b877;border:1px solid rgba(211,184,119,.4);border-radius:2px;padding:5px 0;cursor:pointer}',
      '.forge-devkit .lp-x{position:absolute;top:8px;right:10px;cursor:pointer;color:#5e5885;background:none;border:none;font-size:12px}',
    ].join('');
    document.head.appendChild(css);
  }

  // ONE number formatter, derived from the dial's own STEP instead of
  // a hand-kept list of key names (the list had drifted: three px
  // dials with step 1 printed "24.00px"). A step of a whole unit or
  // more is a whole-number dial.
  function fmtValue(step, v) {
    return (Math.abs(+step) >= 1) ? String(Math.round(v)) : (+v).toFixed(2);
  }

  function mount(spec) {
    const id        = spec.id;
    const local     = spec.local;
    const api       = spec.api || {};
    const sliders   = spec.sliders   || [];
    const toggles   = spec.toggles   || [];
    const radios    = spec.radios    || [];
    const sections  = spec.sections  || [];
    const render    = spec.render    || {};
    const radioAfter = spec.radioAfter || 'redraw';

    // The panel survives forge view remounts on document.body; a stale
    // one is still wired to a DEAD mount's params (dials inert, the
    // persisted recipe silently reverted). Rebuild, never early-return.
    const stale = document.getElementById(id);
    if (stale) stale.remove();
    ensureCss();

    const SLIDER_BY_KEY = {};
    for (const s of sliders) SLIDER_BY_KEY[s[0]] = s;
    const RADIO_BY_KEY = {};
    for (const r of radios) RADIO_BY_KEY[r[0]] = r;

    const defaults = {};
    for (const [k] of sliders) defaults[k] = local.params[k];
    for (const [k] of toggles) defaults[k] = local.params[k];
    for (const [k] of radios)  defaults[k] = local.params[k];
    for (const k of (spec.extraKeys || [])) defaults[k] = local.params[k];
    const ALL_KEYS = Object.keys(defaults);

    // ── persistence: working memory, not the spec ────────────────
    // John's dials must survive a reload (they reset from
    // PARAM_DEFAULTS every mount otherwise).
    function persist() {
      if (!spec.storeKey) return;
      const o = {};
      for (const k of ALL_KEYS) o[k] = local.params[k];
      try { localStorage.setItem(spec.storeKey, JSON.stringify(o)); } catch (_) { /* ignore */ }
    }
    let stored = null;
    if (spec.storeKey) {
      try { stored = JSON.parse(localStorage.getItem(spec.storeKey) || 'null'); } catch (_) { /* ignore */ }
    }
    // ONE-TIME IMPORT — a panel that was carved OUT of another one
    // inherits the dials the user already tuned there, instead of
    // silently snapping back to PARAM_DEFAULTS on the day it ships.
    // Written straight back so the donor blob may forget them.
    let imported = false;
    if (!stored && spec.seedFrom) {
      let donor = null;
      try { donor = JSON.parse(localStorage.getItem(spec.seedFrom) || 'null'); } catch (_) { /* ignore */ }
      if (donor && typeof donor === 'object') {
        stored = {};
        for (const k of ALL_KEYS) if (k in donor) stored[k] = donor[k];
        imported = Object.keys(stored).length > 0;
        if (!imported) stored = null;
      }
    }
    if (stored && typeof stored === 'object') {
      for (const k of ALL_KEYS) if (k in stored) local.params[k] = stored[k];
      if (typeof spec.onRestore === 'function') {
        try { spec.onRestore(); } catch (_) { /* a dev panel never breaks the map */ }
      }
    }

    // ── which sections are open ──────────────────────────────────
    // Workspace state, remembered apart from the recipe. THE LAW: an
    // id we have NEVER stored falls back to its DECLARED default; one
    // he has actually toggled keeps his choice. Without this, every
    // section added after the key was first written ships COLLAPSED
    // to anyone who has ever opened the panel — which is exactly how
    // three controls John asked for BY NAME arrived invisible.
    let openState = null;
    if (spec.openKey) {
      try { openState = JSON.parse(localStorage.getItem(spec.openKey) || 'null'); } catch (_) { /* ignore */ }
    }
    if (!openState || typeof openState !== 'object') openState = {};
    for (const sec of sections) {
      if (!Object.prototype.hasOwnProperty.call(openState, sec.id)) openState[sec.id] = !!sec.open;
    }
    function persistOpen() {
      if (!spec.openKey) return;
      try { localStorage.setItem(spec.openKey, JSON.stringify(openState)); } catch (_) { /* ignore */ }
    }

    const el = document.createElement('div');
    el.id = id;
    el.className = 'forge-devkit';
    el.innerHTML = '<button class="lp-x" title="hide">×</button><h4>' + (spec.title || '') + '</h4>';
    document.body.appendChild(el);
    el.querySelector('.lp-x').addEventListener('click', () => { el.style.display = 'none'; });

    const recipeEl = document.createElement('div');
    function syncRecipe() {
      if (typeof spec.recipe === 'function') recipeEl.textContent = spec.recipe();
    }

    // ── the row builders — the ONE implementation of each ────────
    const used = new Set();

    function addSlider(host, key) {
      const sp = SLIDER_BY_KEY[key];
      if (!sp) return;
      used.add(key);
      const [, label, min, max, step, unit, mode] = sp;
      const row = document.createElement('div');
      row.className = 'lp-row';
      row.innerHTML = '<span>' + label + '</span><b></b>';
      const val = row.querySelector('b');
      const inp = document.createElement('input');
      inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step;
      inp.value = local.params[key];
      val.textContent = fmtValue(step, local.params[key]) + unit;
      inp.addEventListener('input', () => {
        local.params[key] = +inp.value;
        val.textContent = fmtValue(step, inp.value) + unit;
        syncRecipe();
        persist();
        // A DIAL THAT DOES NOT VISIBLY MOVE SOMETHING IS UNSHIPPED —
        // it has happened twice this week. Each mode names the
        // refresh deep enough to make the change appear:
        //   rebake  — node radii repack
        //   refocus — per-node state/palette rebuild
        //   house   — the family-isolate layout re-solves
        //   relabel — the label SET is rebuilt (the paint's idle-skip
        //             compares that Set BY IDENTITY, so a plain
        //             redraw is swallowed and the dial reads dead)
        if (mode === 'rebake' && api.rebake) api.rebake();
        else if (mode === 'refocus' && api.refocus) api.refocus();
        else if (mode === 'house' && api.houseSnap) api.houseSnap();
        else if (mode === 'relabel' && api.relabel) api.relabel();
        else api.redraw();
      });
      host.appendChild(row); host.appendChild(inp);
    }

    function addToggles(host, keys) {
      const tog = document.createElement('div');
      tog.className = 'lp-chips';
      for (const key of keys) {
        const sp = toggles.find(t => t[0] === key);
        if (!sp) continue;
        used.add(key);
        const b = document.createElement('button');
        b.className = 'lp-chip' + (local.params[key] ? ' on' : '');
        b.textContent = sp[1];
        b.addEventListener('click', () => {
          local.params[key] = local.params[key] ? 0 : 1;
          b.classList.toggle('on', !!local.params[key]);
          syncRecipe();
          persist();
          api.redraw();
        });
        tog.appendChild(b);
      }
      host.appendChild(tog);
    }

    function addRadioRow(host, key, caption, opts, after) {
      const cap = document.createElement('div');
      cap.className = 'lp-cast'; cap.textContent = caption;
      host.appendChild(cap);
      const row = document.createElement('div');
      row.className = 'lp-chips';
      for (const d of opts) {
        const b = document.createElement('button');
        b.className = 'lp-chip' + (local.params[key] === d ? ' on' : '');
        b.dataset.k = key; b.dataset.d = d;
        b.textContent = d;
        b.addEventListener('click', () => {
          local.params[key] = d;
          for (const s of row.children) s.classList.toggle('on', s.dataset.d === d);
          syncRecipe();
          persist();
          if (after) after();
          api.redraw();
        });
        row.appendChild(b);
      }
      host.appendChild(row);
    }

    const ctx = { addSlider, addToggles, addRadioRow, local, api, persist, syncRecipe };

    for (const sec of sections) {
      const head = document.createElement('button');
      head.className = 'lp-sec' + (openState[sec.id] ? ' open' : '');
      head.innerHTML = '<span class="lp-caret">▸</span><span>' + sec.title + '</span>';
      const body = document.createElement('div');
      body.className = 'lp-secbody' + (openState[sec.id] ? ' open' : '');
      head.addEventListener('click', () => {
        openState[sec.id] = !openState[sec.id];
        head.classList.toggle('open', openState[sec.id]);
        body.classList.toggle('open', openState[sec.id]);
        persistOpen();
      });
      el.appendChild(head); el.appendChild(body);
      if (sec.hint) {
        const h = document.createElement('div');
        h.className = 'lp-hint'; h.textContent = sec.hint;
        body.appendChild(h);
      }

      for (const it of sec.items) {
        if (it.k === 'slider') addSlider(body, it.key);
        else if (it.k === 'radio') {
          const r = RADIO_BY_KEY[it.key];
          if (r) { used.add(r[0]); addRadioRow(body, r[0], r[1], r[2], api[r[3] || radioAfter]); }
        } else if (it.k === 'toggles') addToggles(body, it.keys);
        else if (typeof render[it.k] === 'function') render[it.k](body, ctx);
      }
    }

    // A dial that fell out of SECTIONS would vanish from the panel
    // silently — loud in the console instead. (Radios too: a house
    // radio that lost its row is the same unfindable-control bug.)
    for (const [k] of sliders) {
      if (!used.has(k)) console.warn('[' + id + '] slider not placed in any section:', k);
    }
    for (const [k] of radios) {
      if (!used.has(k)) console.warn('[' + id + '] radio not placed in any section:', k);
    }

    if (typeof spec.recipe === 'function') {
      recipeEl.className = 'lp-recipe';
      el.appendChild(recipeEl);
    }
    const btns = document.createElement('div');
    btns.className = 'lp-btns';
    const copyB = document.createElement('button');
    copyB.className = 'lp-btn'; copyB.textContent = 'Copy';
    copyB.addEventListener('click', () => {
      const txt = typeof spec.recipe === 'function' ? spec.recipe() : '';
      const done = () => { copyB.textContent = 'Copied ✓'; setTimeout(() => { copyB.textContent = 'Copy'; }, 1200); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done, () => window.prompt('Copy the recipe:', txt));
      } else window.prompt('Copy the recipe:', txt);
    });
    const resetB = document.createElement('button');
    resetB.className = 'lp-btn'; resetB.textContent = 'Reset';
    resetB.addEventListener('click', () => {
      if (spec.storeKey) { try { localStorage.removeItem(spec.storeKey); } catch (_) { /* ignore */ } }
      Object.assign(local.params, defaults);
      el.remove();
      // Rebuild with the one-time import DISARMED and the defaults
      // written straight back: otherwise the donor blob (which still
      // holds the old values) would re-apply them on the spot, and
      // again on the next reload. A reset must stay reset.
      mount(Object.assign({}, spec, { seedFrom: null })).persist();
      if (typeof spec.onReset === 'function') {
        try { spec.onReset(); } catch (_) { /* never break the map */ }
      }
      if (api.redraw) api.redraw();
    });
    btns.appendChild(copyB); btns.appendChild(resetB);
    el.appendChild(btns);
    syncRecipe();
    if (imported) persist();             // keep what we imported

    return { el, defaults, persist, syncRecipe };
  }

  window._forgePanelKit = { mount, ensureCss, fmtValue };
})();
