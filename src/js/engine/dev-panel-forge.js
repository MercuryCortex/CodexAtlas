// ============================================================
// CODEX ATLAS — FORGE DEV PANEL
// ============================================================
// Live-tweak surface for every visual parameter in the Forge
// engine. Right-edge drawer; opens on the 'F' key (or click
// the small tab on the right edge). All controls speak to the
// running Forge view through `window._forge.setParam(name, value)`,
// `setIcon(nodeType, iconId)`, `setFont(scope, fontFamily)`.
//
// LOAD-BEARING RULES (per AGENTS.md Craft doctrine §5)
//   - Labels are dummy-proof: each slider says what changes
//     in plain English, with a one-line hint underneath.
//   - Double-click a slider track → resets that slider only.
//   - Settings persist via localStorage; survive reloads.
//   - "Export config" button dumps JSON so we can bake user-
//     dialed values into Forge's defaults.
//
// This panel is Forge-specific. The legacy `src/js/dev-panel.js`
// (Pantheon V2's) is independent.
// ============================================================

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  const LS_KEY = 'codex-atlas/forge-dev-panel-v1';

  // ── Parameter catalog ─────────────────────────────────
  // Each entry:
  //   id        — programmatic key (matches setParam name)
  //   label     — short user-facing label (the WHAT it controls)
  //   hint      — one sentence of WHAT MOVING IT DOES
  //   min/max/step/default
  //   unit      — optional ('px', '×', '°', '')
  //   format    — value → display string
  //
  // Sections group controls in the drawer.
  const SECTIONS = [
    {
      id: 'rest',
      title: 'WHAT YOU SEE AT REST',
      blurb: 'When you are not hovering or searching — the wheel’s resting look.',
      controls: [
        { id: 'edge_idle_transmission', label: 'Transmission wires — visibility',  hint: 'Orange A→B influence wires. Higher = brighter; Lower = recede into background.',  min: 0, max: 1,   step: 0.01, default: 0.10, unit: '' },
        { id: 'edge_idle_parallel',     label: 'Parallel wires — visibility',       hint: 'Teal "same form / no contact" resemblance wires.',                                  min: 0, max: 1,   step: 0.01, default: 0.12, unit: '' },
        { id: 'edge_idle_association',  label: 'Association wires — visibility',    hint: 'Indigo ambient / theme / membership wires. Usually kept very faint.',               min: 0, max: 1,   step: 0.01, default: 0.08, unit: '' },
        { id: 'edge_idle_kinship',      label: 'Kinship wires — visibility',        hint: 'Lilac parent / child / consort wires.',                                            min: 0, max: 1,   step: 0.01, default: 0.14, unit: '' },
        { id: 'edge_idle_attestation',  label: 'Attestation wires — visibility',    hint: 'Gold document→entity textual-evidence wires.',                                       min: 0, max: 1,   step: 0.01, default: 0.10, unit: '' },
        { id: 'edge_idle_polemic',      label: 'Polemic wires — visibility',        hint: 'Red hostile-reframing wires. Painted in their color at idle (headline bucket).',     min: 0, max: 1,   step: 0.01, default: 0.25, unit: '' },
        { id: 'edge_idle_fusion',       label: 'Fusion wires — visibility',         hint: 'Amber identification / merger wires (Inanna≡Ishtar). Painted in color at idle.',     min: 0, max: 1,   step: 0.01, default: 0.30, unit: '' },
        { id: 'atmosphere',             label: 'Stage atmosphere — strength',       hint: 'Soft gold radial glow behind the wheel. Higher = more presence; 0 = pure black.',    min: 0, max: 0.2, step: 0.005, default: 0.025, unit: '' },
      ],
    },
    {
      id: 'focus',
      title: 'WHEN YOU HOVER OR LOCK',
      blurb: 'How the wheel responds when a node is in focus.',
      controls: [
        { id: 'dim_amount',           label: 'Background nodes — how much they fade', hint: 'When you hover, everything not in the 1-hop network dims by this much. 1 = invisible; 0 = stays bright.',  min: 0, max: 1, step: 0.01, default: 0.85, unit: '' },
        { id: 'hot_width_mult',       label: 'Focused wires — how much they widen',   hint: 'Hot incident wires fatten by this multiplier so they read as the dominant signal.',                              min: 1, max: 5, step: 0.1,  default: 2.4, unit: '×' },
        { id: 'edge_hot_transmission', label: 'Transmission wires — focus brightness', hint: 'Hot alpha when a transmission wire is in the focused set.',                                                       min: 0, max: 1, step: 0.01, default: 0.95, unit: '' },
        { id: 'edge_hot_parallel',     label: 'Parallel wires — focus brightness',     hint: 'Hot alpha when a parallel wire is in the focused set.',                                                            min: 0, max: 1, step: 0.01, default: 0.85, unit: '' },
        { id: 'edge_hot_kinship',      label: 'Kinship wires — focus brightness',      hint: 'Hot alpha when a kinship wire is in the focused set.',                                                            min: 0, max: 1, step: 0.01, default: 0.85, unit: '' },
        { id: 'edge_hot_attestation',  label: 'Attestation wires — focus brightness',  hint: 'Hot alpha when an attestation wire is in the focused set.',                                                        min: 0, max: 1, step: 0.01, default: 0.90, unit: '' },
        { id: 'edge_hot_polemic',      label: 'Polemic wires — focus brightness',      hint: 'Hot alpha when a polemic wire is in the focused set.',                                                            min: 0, max: 1, step: 0.01, default: 0.95, unit: '' },
        { id: 'edge_hot_fusion',       label: 'Fusion wires — focus brightness',       hint: 'Hot alpha when a fusion wire is in the focused set.',                                                             min: 0, max: 1, step: 0.01, default: 0.95, unit: '' },
      ],
    },
    {
      id: 'nodes',
      title: 'NODE CIRCLES',
      blurb: 'Size of the disks that represent each entity.',
      controls: [
        { id: 'node_radius_tier1', label: 'Biggest nodes — radius',  hint: 'Top 4% of nodes by connection count (the giants — Zeus, Ra, Marduk).',  min: 4, max: 36, step: 0.5, default: 16, unit: 'px' },
        { id: 'node_radius_tier2', label: 'Big nodes — radius',      hint: 'Next 11% — major figures.',                                              min: 4, max: 30, step: 0.5, default: 12, unit: 'px' },
        { id: 'node_radius_tier3', label: 'Medium nodes — radius',   hint: 'Next 25% — well-connected secondary figures.',                            min: 3, max: 24, step: 0.5, default:  9, unit: 'px' },
        { id: 'node_radius_tier4', label: 'Smallest nodes — radius', hint: 'Everyone else — peripheral or sparsely-connected nodes.',                 min: 2, max: 20, step: 0.5, default:  7, unit: 'px' },
      ],
    },
    {
      id: 'glyphs',
      title: 'SYMBOLS INSIDE EACH NODE',
      blurb: 'The little shape (ring, page, star…) painted inside every disk.',
      controls: [
        { id: 'glyph_scale',   label: 'Symbol size inside node',   hint: '1 = symbol fills the disk; 0.5 = symbol is half the disk.',                  min: 0.2, max: 1.4, step: 0.05, default: 0.95, unit: '×' },
        { id: 'glyph_opacity', label: 'Symbol visibility',         hint: 'Higher = symbol pops; lower = it whispers.',                                  min: 0,   max: 1,   step: 0.02, default: 0.86, unit: '' },
        { id: 'glyph_tint',    label: 'Symbol tint — softness',    hint: 'How much the symbol’s color is lightened from the family color. 0 = pure family color; 1 = pure white.', min: 0, max: 1, step: 0.05, default: 0.55, unit: '' },
      ],
    },
    {
      id: 'edges',
      title: 'WIRE SHAPE',
      blurb: 'How the connecting wires curve and how wide they are.',
      controls: [
        { id: 'edge_width_transmission', label: 'Transmission wires — thickness',  hint: '',  min: 0.1, max: 1.5, step: 0.02, default: 0.34, unit: 'px' },
        { id: 'edge_width_parallel',     label: 'Parallel wires — thickness',       hint: '',  min: 0.1, max: 1.5, step: 0.02, default: 0.30, unit: 'px' },
        { id: 'edge_width_association',  label: 'Association wires — thickness',    hint: '',  min: 0.1, max: 1.5, step: 0.02, default: 0.22, unit: 'px' },
        { id: 'edge_width_kinship',      label: 'Kinship wires — thickness',        hint: '',  min: 0.1, max: 1.5, step: 0.02, default: 0.32, unit: 'px' },
        { id: 'edge_width_attestation',  label: 'Attestation wires — thickness',    hint: '',  min: 0.1, max: 1.5, step: 0.02, default: 0.30, unit: 'px' },
        { id: 'edge_width_polemic',      label: 'Polemic wires — thickness',        hint: '',  min: 0.1, max: 1.5, step: 0.02, default: 0.40, unit: 'px' },
        { id: 'edge_width_fusion',       label: 'Fusion wires — thickness',         hint: '',  min: 0.1, max: 1.5, step: 0.02, default: 0.36, unit: 'px' },
        { id: 'curve_transmission',      label: 'Transmission wires — how curved',  hint: 'Higher = wires bow more strongly toward the wheel center.',  min: 0, max: 0.7, step: 0.01, default: 0.35, unit: '' },
        { id: 'curve_parallel',          label: 'Parallel wires — how curved',      hint: '',  min: 0, max: 0.7, step: 0.01, default: 0.30, unit: '' },
        { id: 'curve_kinship',           label: 'Kinship wires — how curved',       hint: '',  min: 0, max: 0.7, step: 0.01, default: 0.40, unit: '' },
        { id: 'curve_fusion',            label: 'Fusion wires — how curved',        hint: '',  min: 0, max: 0.7, step: 0.01, default: 0.45, unit: '' },
      ],
    },
    {
      id: 'labels',
      title: 'LABELS',
      blurb: 'The text that names each deity / document / etc when focused.',
      controls: [
        { id: 'label_size', label: 'Label text size',  hint: 'Pixel size of the focused-node labels.', min: 8, max: 18, step: 0.5, default: 11, unit: 'px' },
        { id: 'label_cap',  label: 'How many labels at most', hint: 'When you lock a lot of nodes, only this many label slots will fill before the rest are hidden.', min: 10, max: 200, step: 5, default: 80, unit: '' },
      ],
    },
    {
      id: 'camera',
      title: 'CAMERA FEEL',
      blurb: 'How pan inertia + zoom react to your input.',
      controls: [
        { id: 'pan_tau',    label: 'Drag-release glide — duration',   hint: 'How long the wheel keeps coasting after you let go of a drag.',                 min: 0.05, max: 0.6, step: 0.01, default: 0.18, unit: 's' },
        { id: 'zoom_tau',   label: 'Wheel zoom — smoothness',          hint: 'Higher = slower, smoother zoom; Lower = snappier.',                            min: 0.02, max: 0.4, step: 0.01, default: 0.08, unit: 's' },
        { id: 'flyto_dur',  label: 'Search fly-to — duration',         hint: 'How long the camera takes to glide to a searched node.',                       min: 0.1, max: 2,   step: 0.05, default: 0.55, unit: 's' },
      ],
    },
  ];

  const ALL_PARAMS = {};
  for (const sec of SECTIONS) for (const c of sec.controls) ALL_PARAMS[c.id] = c;

  // ── Font catalog (Phase 5) ────────────────────────────
  // Curated font families — the existing Google Fonts already
  // loaded by index.html. Each entry maps to a `font-family`
  // CSS value. User picks which family is used for each scope.
  const FONTS = [
    { id: 'inter',           label: 'Inter (modern sans)',                family: '"Inter", -apple-system, "Segoe UI", sans-serif' },
    { id: 'ibm-plex-sans',   label: 'IBM Plex Sans (technical)',          family: '"IBM Plex Sans", "Inter", sans-serif' },
    { id: 'cormorant',       label: 'Cormorant Garamond (literary)',      family: '"Cormorant Garamond", "Iowan Old Style", Palatino, serif' },
    { id: 'eb-garamond',     label: 'EB Garamond (classical)',            family: '"EB Garamond", Palatino, "Iowan Old Style", serif' },
    { id: 'jetbrains-mono',  label: 'JetBrains Mono (terminal)',          family: '"JetBrains Mono", Menlo, Consolas, monospace' },
    { id: 'ibm-plex-mono',   label: 'IBM Plex Mono (machine)',            family: '"IBM Plex Mono", "JetBrains Mono", monospace' },
  ];

  const FONT_SCOPES = [
    { id: 'label',  label: 'Node labels',     defaultFont: 'inter' },
    { id: 'status', label: 'Status bar',      defaultFont: 'jetbrains-mono' },
  ];

  // ── Storage ──────────────────────────────────────────
  function loadStored() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveStored(obj) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); }
    catch (e) { /* ignore */ }
  }

  // ── Apply state to the running engine ────────────────
  function applyAllToEngine() {
    if (!window._forge) return;
    for (const id of Object.keys(state.params)) {
      try { window._forge.setParam(id, state.params[id]); } catch (e) { /* ignore */ }
    }
    for (const t of Object.keys(state.icons)) {
      try { window._forge.setIcon(t, state.icons[t]); } catch (e) { /* ignore */ }
    }
    for (const scope of Object.keys(state.fonts)) {
      try { window._forge.setFont(scope, FONTS.find(f => f.id === state.fonts[scope])); } catch (e) { /* ignore */ }
    }
  }

  // ── Boot state ───────────────────────────────────────
  const stored = loadStored();
  const state = {
    params: {},
    icons:  stored.icons || {},
    fonts:  Object.assign({}, FONT_SCOPES.reduce((o, s) => (o[s.id] = s.defaultFont, o), {}), stored.fonts || {}),
    open:   stored.open || false,
  };
  for (const id of Object.keys(ALL_PARAMS)) {
    state.params[id] = (stored.params && stored.params[id] !== undefined)
                       ? +stored.params[id]
                       : ALL_PARAMS[id].default;
  }
  function persist() {
    saveStored({ params: state.params, icons: state.icons, fonts: state.fonts, open: state.open });
  }

  // ── Build the panel DOM ──────────────────────────────
  function svgIcon(iconId, size) {
    const lib = window.AtlasEngineIconLibrary;
    if (!lib) return '';
    return lib.fullSvg(iconId, size || 14);
  }

  function buildPanel() {
    if (document.getElementById('forge-dev-panel')) return; // already built

    const tab = document.createElement('button');
    tab.id = 'forge-dev-tab';
    tab.title = 'Open the visual-tweak panel (or press F)';
    tab.textContent = 'Visual ▸';
    tab.addEventListener('click', () => setOpen(!state.open));
    document.body.appendChild(tab);

    const panel = document.createElement('div');
    panel.id = 'forge-dev-panel';
    panel.innerHTML = renderPanelHTML();
    document.body.appendChild(panel);

    // Wire close button
    panel.querySelector('#fdp-close').addEventListener('click', () => setOpen(false));
    // Wire reset-all
    panel.querySelector('#fdp-reset-all').addEventListener('click', resetAll);
    // Wire export
    panel.querySelector('#fdp-export').addEventListener('click', exportConfig);
    // Wire sliders + icon pickers + font selectors
    wireControls(panel);

    setOpen(state.open);
  }

  function renderPanelHTML() {
    const sectionsHTML = SECTIONS.map(sec => `
      <details class="fdp-section" open>
        <summary class="fdp-sec-title">${sec.title}</summary>
        <div class="fdp-sec-blurb">${sec.blurb}</div>
        <div class="fdp-sec-body">
          ${sec.controls.map(c => renderSliderHTML(c)).join('')}
        </div>
      </details>
    `).join('');

    const iconPickerHTML = renderIconPickerSection();
    const fontPickerHTML = renderFontPickerSection();

    return `
      <div class="fdp-header">
        <span class="fdp-title">VISUAL  TUNING</span>
        <div class="fdp-header-actions">
          <button class="fdp-mini" id="fdp-export" title="Copy current settings as JSON to paste into chat">Export</button>
          <button class="fdp-mini" id="fdp-reset-all" title="Reset every slider to its default">Reset all</button>
          <button class="fdp-close" id="fdp-close" title="Close (or press F)">×</button>
        </div>
      </div>
      <div class="fdp-doctrine">
        <strong>Tip:</strong> double-click any slider to reset just that one.
      </div>
      <div class="fdp-body">
        ${sectionsHTML}
        ${iconPickerHTML}
        ${fontPickerHTML}
      </div>
    `;
  }

  function renderSliderHTML(c) {
    const val = state.params[c.id];
    const unit = c.unit || '';
    const display = formatVal(val, c) + (unit ? ' ' + unit : '');
    return `
      <div class="fdp-row" data-id="${c.id}">
        <div class="fdp-row-head">
          <span class="fdp-label">${c.label}</span>
          <span class="fdp-value">${display}</span>
        </div>
        ${c.hint ? `<div class="fdp-hint">${c.hint}</div>` : ''}
        <input class="fdp-slider" type="range"
          min="${c.min}" max="${c.max}" step="${c.step}" value="${val}"
          data-id="${c.id}" />
      </div>
    `;
  }

  function renderIconPickerSection() {
    const glyphmod = window.AtlasEngineGlyph;
    const lib = window.AtlasEngineIconLibrary;
    if (!glyphmod || !lib) return '';
    const TYPES = [
      { id: 'deity',       label: 'Deity' },
      { id: 'person',      label: 'Author / Person' },
      { id: 'document',    label: 'Document' },
      { id: 'symbol',      label: 'Symbol' },
      { id: 'event',       label: 'Event' },
      { id: 'ritual',      label: 'Ritual' },
      { id: 'music',       label: 'Music' },
      { id: 'alphabet',    label: 'Alphabet' },
      { id: 'alchemy',     label: 'Alchemy' },
      { id: 'philosophy',  label: 'Philosophy' },
      { id: 'moral',       label: 'Moral' },
      { id: 'medicine',    label: 'Medicine' },
      { id: 'mathematics', label: 'Mathematics' },
      { id: 'monument',    label: 'Monument' },
      { id: 'theme',       label: 'Theme' },
      { id: 'tradition',   label: 'Tradition' },
      { id: 'place',       label: 'Place' },
    ];
    const grouped = lib.iconsByCategory();
    const cats = lib.CATEGORY_ORDER;
    const catLabel = lib.CATEGORY_LABEL;

    const typesHTML = TYPES.map(t => {
      const currentIconId = state.icons[t.id] || null;
      const previewSvg = currentIconId
        ? lib.fullSvg(currentIconId, 18)
        : ('<svg width="18" height="18" viewBox="0 0 12 12" overflow="visible">' + glyphmod.glyphMarkup(t.id) + '</svg>');
      const gridHTML = cats.map(cat => {
        const list = grouped[cat] || [];
        return `
          <div class="fdp-icon-cat-label">${catLabel[cat] || cat}</div>
          <div class="fdp-icon-row">
            ${list.map(ic => `
              <button class="fdp-icon-btn${currentIconId === ic.id ? ' is-selected' : ''}"
                      data-type="${t.id}" data-icon="${ic.id}"
                      title="${ic.label}">
                ${lib.fullSvg(ic.id, 16)}
              </button>
            `).join('')}
          </div>
        `;
      }).join('');
      return `
        <details class="fdp-icon-type" data-type="${t.id}">
          <summary class="fdp-icon-type-head">
            <span class="fdp-icon-current">${previewSvg}</span>
            <span class="fdp-icon-type-label">${t.label}</span>
            <span class="fdp-icon-current-id">${currentIconId || '(default)'}</span>
          </summary>
          <div class="fdp-icon-grid">${gridHTML}</div>
        </details>
      `;
    }).join('');

    return `
      <details class="fdp-section" open>
        <summary class="fdp-sec-title">SYMBOL PER NODE TYPE</summary>
        <div class="fdp-sec-blurb">Pick which little shape paints inside each node-type’s disk. Click a row to expand the grid.</div>
        <div class="fdp-sec-body">
          ${typesHTML}
        </div>
      </details>
    `;
  }

  function renderFontPickerSection() {
    const optsHTML = (defId) => FONTS.map(f =>
      `<option value="${f.id}"${f.id === defId ? ' selected' : ''}>${f.label}</option>`
    ).join('');
    const scopesHTML = FONT_SCOPES.map(s => `
      <div class="fdp-row" data-font-scope="${s.id}">
        <div class="fdp-row-head">
          <span class="fdp-label">${s.label}</span>
        </div>
        <select class="fdp-font-select" data-font-scope="${s.id}">
          ${optsHTML(state.fonts[s.id] || s.defaultFont)}
        </select>
      </div>
    `).join('');
    return `
      <details class="fdp-section" open>
        <summary class="fdp-sec-title">TYPOGRAPHY</summary>
        <div class="fdp-sec-blurb">Pick the font family used in different parts of the wheel.</div>
        <div class="fdp-sec-body">${scopesHTML}</div>
      </details>
    `;
  }

  // ── Wiring ───────────────────────────────────────────
  function wireControls(panel) {
    // Sliders — input event for live updates, dblclick on the row
    // for "reset this one" (we listen on the row so double-clicking
    // the slider OR the label resets it).
    panel.querySelectorAll('.fdp-slider').forEach(el => {
      el.addEventListener('input', (ev) => {
        const id = ev.target.dataset.id;
        const v = parseFloat(ev.target.value);
        state.params[id] = v;
        const row = ev.target.closest('.fdp-row');
        if (row) {
          const c = ALL_PARAMS[id];
          row.querySelector('.fdp-value').textContent = formatVal(v, c) + (c.unit ? ' ' + c.unit : '');
        }
        if (window._forge && window._forge.setParam) {
          try { window._forge.setParam(id, v); } catch (e) { console.warn('[forge-dev-panel] setParam failed:', id, e); }
        }
        persist();
      });
    });
    panel.querySelectorAll('.fdp-row').forEach(row => {
      row.addEventListener('dblclick', (ev) => {
        if (!row.dataset.id) return;
        const id = row.dataset.id;
        const c = ALL_PARAMS[id];
        if (!c) return;
        resetOne(id);
        ev.preventDefault();
      });
    });

    // Icon picker buttons
    panel.querySelectorAll('.fdp-icon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const iconId = btn.dataset.icon;
        state.icons[type] = iconId;
        if (window._forge && window._forge.setIcon) {
          try { window._forge.setIcon(type, iconId); } catch (e) { console.warn('[forge-dev-panel] setIcon failed:', type, e); }
        }
        // Update visual selection state in this type's grid.
        const wrap = btn.closest('.fdp-icon-type');
        if (wrap) {
          wrap.querySelectorAll('.fdp-icon-btn').forEach(b => b.classList.toggle('is-selected', b === btn));
          // Update the preview thumbnail in the summary.
          const lib = window.AtlasEngineIconLibrary;
          if (lib) {
            const head = wrap.querySelector('.fdp-icon-current');
            if (head) head.innerHTML = lib.fullSvg(iconId, 18);
            const idEl = wrap.querySelector('.fdp-icon-current-id');
            if (idEl) idEl.textContent = iconId;
          }
        }
        persist();
      });
    });

    // Font select
    panel.querySelectorAll('.fdp-font-select').forEach(sel => {
      sel.addEventListener('change', (ev) => {
        const scope = ev.target.dataset.fontScope;
        const fontId = ev.target.value;
        state.fonts[scope] = fontId;
        const font = FONTS.find(f => f.id === fontId);
        if (window._forge && window._forge.setFont && font) {
          try { window._forge.setFont(scope, font); } catch (e) { console.warn('[forge-dev-panel] setFont failed:', scope, e); }
        }
        persist();
      });
    });
  }

  function resetOne(id) {
    const c = ALL_PARAMS[id];
    if (!c) return;
    state.params[id] = c.default;
    const row = document.querySelector('.fdp-row[data-id="' + id + '"]');
    if (row) {
      const slider = row.querySelector('.fdp-slider');
      if (slider) slider.value = c.default;
      const valEl = row.querySelector('.fdp-value');
      if (valEl) valEl.textContent = formatVal(c.default, c) + (c.unit ? ' ' + c.unit : '');
    }
    if (window._forge && window._forge.setParam) {
      try { window._forge.setParam(id, c.default); } catch (e) { /* ignore */ }
    }
    persist();
  }

  function resetAll() {
    for (const id of Object.keys(ALL_PARAMS)) resetOne(id);
  }

  function exportConfig() {
    const data = JSON.stringify({ params: state.params, icons: state.icons, fonts: state.fonts }, null, 2);
    try {
      navigator.clipboard.writeText(data).then(
        () => flashHeader('Copied to clipboard'),
        () => flashHeader('Copy failed — see console'),
      );
      console.log('[forge-dev-panel] EXPORT:\n' + data);
    } catch (e) {
      console.log('[forge-dev-panel] EXPORT:\n' + data);
      flashHeader('See console');
    }
  }

  function flashHeader(msg) {
    const t = document.querySelector('#forge-dev-panel .fdp-title');
    if (!t) return;
    const orig = t.textContent;
    t.textContent = msg;
    setTimeout(() => { t.textContent = orig; }, 1500);
  }

  function setOpen(open) {
    state.open = !!open;
    const p = document.getElementById('forge-dev-panel');
    const tab = document.getElementById('forge-dev-tab');
    if (p)   p.classList.toggle('is-open', state.open);
    if (tab) tab.classList.toggle('is-open', state.open);
    persist();
  }

  function formatVal(v, c) {
    if (typeof v !== 'number') return String(v);
    if (c.step >= 1) return String(Math.round(v));
    const decimals = c.step >= 0.1 ? 2 : 3;
    return v.toFixed(decimals);
  }

  // ── Keyboard ─────────────────────────────────────────
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'f' && ev.key !== 'F') return;
    const tag = (document.activeElement || {}).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    setOpen(!state.open);
  });

  // ── Bootstrap ───────────────────────────────────────
  // Forge view may not be mounted yet when this script loads.
  // Wait until DOMContentLoaded + a short retry to give the view
  // time to expose `window._forge`.
  function tryBoot(retries) {
    buildPanel();
    if (window._forge && (window._forge.setParam || window._forge.setIcon || window._forge.setFont)) {
      applyAllToEngine();
      return;
    }
    if (retries > 0) setTimeout(() => tryBoot(retries - 1), 200);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tryBoot(20));
  } else {
    tryBoot(20);
  }

  // Expose for other modules (e.g., the view to re-apply after
  // mode change wipes glyph DOMs).
  window.AtlasEngineForgeDevPanel = Object.freeze({
    applyAllToEngine,
    getState: () => ({
      params: Object.assign({}, state.params),
      icons:  Object.assign({}, state.icons),
      fonts:  Object.assign({}, state.fonts),
    }),
  });
})();
