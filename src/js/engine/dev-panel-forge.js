// ============================================================
// CODEX ATLAS — FORGE DEV PANEL  (Phase 6 rewrite)
// ============================================================
// Live-tweak surface for every visual parameter in the Forge
// engine. Right-edge drawer; 'F' to toggle, click the vertical
// "Visual ▸" tab, or use the X close button.
//
// SECTIONS (each top-level <details>):
//   1. WIRES         — IDLE state, ACTIVE state, SHAPE
//                      (each a nested collapsible group).
//                      Per-bucket color + opacity + stroke for
//                      idle AND active; curvature is global.
//   2. NODES         — disk radii by tier + on-screen-px clamps.
//   3. SYMBOLS       — glyph scale / opacity / tint.
//   4. LABELS        — idle hierarchy (per-tier zoom thresholds)
//                      + size + cap + collision padding.
//   5. PALETTE       — background / label text / label halo.
//   6. CAMERA        — pan inertia / zoom smoothness / fly-to.
//   7. SYMBOL PER NODE TYPE  — icon picker × 17 types × library.
//   8. TYPOGRAPHY    — font selectors.
//
// LOAD-BEARING RULES
//   - Labels are dummy-proof: WHAT it controls + one-line hint.
//   - Double-click any slider row resets THAT slider only.
//   - Settings persist via localStorage; survive reloads.
//   - "Export config" copies JSON for baking into defaults.
// ============================================================

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  const LS_KEY = 'codex-atlas/forge-dev-panel-v3';   // v3 schema (Phase 6c: SELECTED state + dim split)

  // Bucket order matches `BUCKET_INDEX` in engine/graph/edge.js.
  const BUCKETS = [
    { id: 'transmission', label: 'Transmission', hint: 'Orange A→B direct influence wires.' },
    { id: 'parallel',     label: 'Parallel',     hint: 'Teal "same form / no contact" resemblance.' },
    { id: 'association',  label: 'Association',  hint: 'Indigo ambient / theme / membership.' },
    { id: 'kinship',      label: 'Kinship',      hint: 'Lilac parent / child / consort / sibling.' },
    { id: 'attestation',  label: 'Attestation',  hint: 'Gold document→entity textual evidence.' },
    { id: 'polemic',      label: 'Polemic',      hint: 'Red hostile reframing / refutation.' },
    { id: 'fusion',       label: 'Fusion',       hint: 'Amber merger / identification (Inanna≡Ishtar).' },
  ];

  // ── Helpers to generate per-bucket controls ──────────────
  // Each helper returns an array of control objects, ready to
  // splat into a section's `controls` list.
  function bucketIdleControls(b) {
    return [
      { kind: 'color',  id: `idle_color_${b.id}`,   label: `${b.label} — idle color`,   hint: '',                            default: '#3a4a66' },
      { kind: 'slider', id: `idle_opacity_${b.id}`, label: `${b.label} — idle opacity`, hint: '0 = invisible · 1 = solid.',  min: 0, max: 1, step: 0.01, default: 0.10 },
      { kind: 'slider', id: `idle_stroke_${b.id}`,  label: `${b.label} — idle stroke`,  hint: '',                            min: 0.05, max: 1.5, step: 0.02, default: 0.30, unit: 'px' },
    ];
  }
  function bucketActiveControls(b) {
    return [
      { kind: 'color',  id: `active_color_${b.id}`,   label: `${b.label} — active color`,   hint: '',                            default: '#C9743A' },
      { kind: 'slider', id: `active_opacity_${b.id}`, label: `${b.label} — active opacity`, hint: 'Brightness when in focus.',   min: 0, max: 1, step: 0.01, default: 0.90 },
      { kind: 'slider', id: `active_stroke_${b.id}`,  label: `${b.label} — active stroke`,  hint: 'Thickness when in focus.',    min: 0.05, max: 3, step: 0.02, default: 0.80, unit: 'px' },
    ];
  }
  function bucketCurveControl(b) {
    return { kind: 'slider', id: `curve_${b.id}`, label: `${b.label} — curvature`, hint: 'Higher = bow more strongly toward the wheel center.', min: 0, max: 0.7, step: 0.01, default: 0.30 };
  }

  // ── Section catalog ──────────────────────────────────────
  // Top-level entries become outer <details>. Groups are NESTED
  // collapsible <details> inside the section.
  const SECTIONS = [
    {
      id: 'wires',
      title: 'WIRES',
      blurb: 'How the connecting wires read — at rest, in focus, and how they bend.',
      groups: [
        {
          id: 'wires-idle',
          title: 'IDLE STATE',
          blurb: 'How wires look at rest (no hover, no lock). Slate atmosphere by default; headline buckets paint in their hue.',
          controls: [].concat(...BUCKETS.map(bucketIdleControls)),
        },
        {
          id: 'wires-active',
          title: 'ACTIVE STATE',
          blurb: 'How wires light up when in the focused 1-hop network.',
          controls: [].concat(...BUCKETS.map(bucketActiveControls)),
        },
        {
          id: 'wires-shape',
          title: 'SHAPE (state-independent)',
          blurb: 'Curvature per bucket — geometry that does not change between idle and active.',
          controls: BUCKETS.map(bucketCurveControl),
        },
        {
          id: 'wires-clamp',
          title: 'ON-SCREEN SIZE CLAMP (zoom-aware)',
          blurb: 'Caps the apparent stroke width as you zoom. Mirrors the node clamp — keeps wires legible when zoomed out + stops them ballooning at deep zoom-in.',
          controls: [
            { kind: 'slider', id: 'wire_min_screen_px', label: 'Don\'t shrink below', hint: 'Minimum apparent stroke width in CSS pixels.', min: 0, max: 6,  step: 0.1, default: 0.5, unit: 'px' },
            { kind: 'slider', id: 'wire_max_screen_px', label: 'Don\'t grow above',  hint: 'Maximum apparent stroke width in CSS pixels.', min: 1, max: 12, step: 0.1, default: 4,   unit: 'px' },
          ],
        },
        {
          id: 'wires-focus',
          title: 'FOCUS DIM',
          blurb: 'How much non-focused stuff fades when something is hovered or locked. Three independent channels — wires + disks + symbols — so you can dial them separately.',
          controls: [
            { kind: 'slider', id: 'dim_amount',        label: 'Background WIRES — fade',   hint: '1 = invisible at focus; 0 = stays bright.',           min: 0, max: 1,   step: 0.01,  default: 0.85 },
            { kind: 'slider', id: 'dim_amount_nodes',  label: 'Background NODES — fade',   hint: 'Same scale, applied to dimmed disks.',                 min: 0, max: 1,   step: 0.01,  default: 0.85 },
            { kind: 'slider', id: 'dim_amount_glyphs', label: 'Background SYMBOLS — fade', hint: 'Glyphs are DOM (SVG); shader dim doesn\'t touch them.', min: 0, max: 1,   step: 0.01,  default: 0.85 },
            { kind: 'slider', id: 'atmosphere',        label: 'Stage atmosphere — strength', hint: 'Soft radial glow behind the wheel.',                  min: 0, max: 0.2, step: 0.005, default: 0.025 },
          ],
        },
      ],
    },
    {
      id: 'nodes',
      title: 'NODES',
      blurb: 'Disk sizes per importance tier + on-screen size clamps as you zoom.',
      groups: [
        {
          id: 'nodes-tiers',
          title: 'TIER RADII (world units)',
          blurb: 'Base disk radius before zoom + clamps. Tier 0 = top 4% by degree.',
          controls: [
            { kind: 'slider', id: 'node_radius_tier1', label: 'Biggest nodes — radius',  hint: 'Top 4% (Zeus, Ra, Marduk).', min: 4, max: 36, step: 0.5, default: 16, unit: 'px' },
            { kind: 'slider', id: 'node_radius_tier2', label: 'Big nodes — radius',      hint: 'Next 11%.',                  min: 4, max: 30, step: 0.5, default: 12, unit: 'px' },
            { kind: 'slider', id: 'node_radius_tier3', label: 'Medium nodes — radius',   hint: 'Next 25%.',                  min: 3, max: 24, step: 0.5, default:  9, unit: 'px' },
            { kind: 'slider', id: 'node_radius_tier4', label: 'Smallest nodes — radius', hint: 'Everyone else.',             min: 2, max: 20, step: 0.5, default:  7, unit: 'px' },
          ],
        },
        {
          id: 'nodes-clamp',
          title: 'ON-SCREEN SIZE CLAMP',
          blurb: 'Keeps disks readable when zoomed out + prevents bloat when zoomed in.',
          controls: [
            { kind: 'slider', id: 'node_min_screen_px', label: 'Don\'t shrink below', hint: 'Minimum apparent on-screen radius (px).', min: 0, max: 12, step: 0.5, default: 3,  unit: 'px' },
            { kind: 'slider', id: 'node_max_screen_px', label: 'Don\'t grow above',  hint: 'Maximum apparent on-screen radius (px).', min: 8, max: 64, step: 1,   default: 28, unit: 'px' },
          ],
        },
        {
          id: 'nodes-selected',
          title: 'SELECTED STATE (the anchor — distinct from its 1-hop tree)',
          blurb: 'Three visual states: IDLE → HIGHLIGHTED (the 1-hop neighbourhood) → SELECTED (the actual clicked / hovered node). This group tunes the SELECTED layer on top.',
          controls: [
            { kind: 'slider', id: 'selected_size_mult',     label: 'Size multiplier',  hint: '1.0 = same size as idle; 1.5 = 50% bigger.',          min: 1,    max: 2,    step: 0.05,  default: 1.15, unit: '×' },
            { kind: 'slider', id: 'selected_glow_strength', label: 'Glow strength',    hint: 'Soft halo ring outside the disk. 0 = no glow.',       min: 0,    max: 1,    step: 0.02,  default: 0.65 },
            { kind: 'slider', id: 'selected_glow_extent',   label: 'Glow radius',      hint: 'How far the glow reaches. 1.0 = no halo; 2.0 = double radius.', min: 1, max: 2.5, step: 0.05, default: 1.6, unit: '×' },
            { kind: 'color',  id: 'selected_glow_color',    label: 'Glow color',       hint: 'The halo tint. Warm cream by default; pick any.',     default: '#FFE9B0' },
          ],
        },
      ],
    },
    {
      id: 'symbols',
      title: 'SYMBOLS INSIDE EACH NODE',
      blurb: 'The little glyph painted inside every disk.',
      controls: [
        { kind: 'slider', id: 'glyph_scale',   label: 'Symbol size inside node', hint: '1 = fills disk; 0.5 = half disk.',                    min: 0.2, max: 1.4, step: 0.05, default: 0.95, unit: '×' },
        { kind: 'slider', id: 'glyph_opacity', label: 'Symbol visibility',       hint: 'Higher = pops; lower = whispers.',                    min: 0,   max: 1,   step: 0.02, default: 0.86 },
        { kind: 'slider', id: 'glyph_tint',    label: 'Symbol tint — softness',  hint: '0 = pure family color; 1 = pure white.',              min: 0,   max: 1,   step: 0.05, default: 0.55 },
      ],
    },
    {
      id: 'labels',
      title: 'LABELS',
      blurb: 'When + how node names appear. Per-tier zoom rules let hubs always show; smaller fish only show on zoom-in.',
      groups: [
        {
          id: 'labels-hierarchy',
          title: 'IDLE HIERARCHY (zoom thresholds)',
          blurb: 'Show a label at IDLE when the camera scale is at or above this. 0 = always; 999 = never.',
          controls: [
            { kind: 'slider', id: 'label_idle_zoom_tier1', label: 'Tier 1 — show at zoom ≥', hint: 'Top 4% by degree (huge hubs). 0 = always visible.', min: 0, max: 5, step: 0.05, default: 0,    unit: '×' },
            { kind: 'slider', id: 'label_idle_zoom_tier2', label: 'Tier 2 — show at zoom ≥', hint: 'Next 11%.',                                          min: 0, max: 5, step: 0.05, default: 1.0,  unit: '×' },
            { kind: 'slider', id: 'label_idle_zoom_tier3', label: 'Tier 3 — show at zoom ≥', hint: 'Next 25%.',                                          min: 0, max: 5, step: 0.05, default: 1.8,  unit: '×' },
            { kind: 'slider', id: 'label_idle_zoom_tier4', label: 'Tier 4 — show at zoom ≥', hint: 'Rest. 999 = only show on hover/lock.',               min: 0, max: 999, step: 0.05, default: 999, unit: '×' },
            { kind: 'slider', id: 'label_idle_max',        label: 'Max idle labels at once', hint: 'Safety cap. Collision-pruning will hide further ones.', min: 10, max: 500, step: 10, default: 200 },
          ],
        },
        {
          id: 'labels-style',
          title: 'APPEARANCE',
          blurb: 'Text size + halo + collision padding.',
          controls: [
            { kind: 'slider', id: 'label_size',          label: 'Label text size',          hint: 'Pixel size of the rendered text.',         min: 8,  max: 20, step: 0.5, default: 11, unit: 'px' },
            { kind: 'slider', id: 'label_cap',           label: 'Focus label cap',          hint: 'Maximum labels shown when locked.',        min: 10, max: 200, step: 5,  default: 80 },
            { kind: 'slider', id: 'label_collision_pad', label: 'Collision padding',        hint: 'Extra px buffer when checking overlap.',   min: 0,  max: 16, step: 0.5, default: 4, unit: 'px' },
          ],
        },
      ],
    },
    {
      id: 'palette',
      title: 'GLOBAL PALETTE',
      blurb: 'Colors that apply across the whole stage — background, label text, label halo.',
      controls: [
        { kind: 'color',  id: 'palette_background', label: 'Background',  hint: 'Canvas backdrop.',                       default: '#0a0c10' },
        { kind: 'color',  id: 'palette_label_text', label: 'Label text',  hint: 'The text color used for label names.',   default: '#e8e2d0' },
        { kind: 'color',  id: 'palette_label_halo', label: 'Label halo',  hint: 'Soft outline behind labels (read over wires).', default: '#0a0c10' },
      ],
    },
    {
      id: 'camera',
      title: 'CAMERA FEEL',
      blurb: 'How pan inertia + zoom + fly-to react to your input.',
      controls: [
        { kind: 'slider', id: 'pan_tau',   label: 'Drag-release glide — duration', hint: 'How long the wheel keeps coasting after a drag.', min: 0.05, max: 0.6, step: 0.01, default: 0.18, unit: 's' },
        { kind: 'slider', id: 'zoom_tau',  label: 'Wheel zoom — smoothness',       hint: 'Higher = slower, smoother; lower = snappier.',    min: 0.02, max: 0.4, step: 0.01, default: 0.08, unit: 's' },
        { kind: 'slider', id: 'flyto_dur', label: 'Search fly-to — duration',      hint: 'How long the camera takes to fly to a hit.',      min: 0.1,  max: 2,   step: 0.05, default: 0.55, unit: 's' },
      ],
    },
  ];

  // Flatten all controls into a lookup. Walks both flat .controls
  // and nested .groups[].controls so the rest of the panel can
  // look up any param by id without knowing the structure.
  const ALL_PARAMS = {};
  function indexSection(sec) {
    if (sec.controls) for (const c of sec.controls) ALL_PARAMS[c.id] = c;
    if (sec.groups)   for (const g of sec.groups)   indexSection(g);
  }
  for (const s of SECTIONS) indexSection(s);

  // ── Font catalog ──────────────────────────────────────────
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

  // ── Storage ──────────────────────────────────────────────
  function loadStored() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveStored(obj) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); }
    catch (e) { /* ignore */ }
  }

  // ── Apply state to the running engine ─────────────────────
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

  // ── Boot state ───────────────────────────────────────────
  const stored = loadStored();
  const state = {
    params: {},
    icons:  stored.icons || {},
    fonts:  Object.assign({}, FONT_SCOPES.reduce((o, s) => (o[s.id] = s.defaultFont, o), {}), stored.fonts || {}),
    open:   stored.open || false,
  };
  for (const id of Object.keys(ALL_PARAMS)) {
    const stash = stored.params && stored.params[id];
    state.params[id] = (stash !== undefined) ? stash : ALL_PARAMS[id].default;
  }
  function persist() {
    saveStored({ params: state.params, icons: state.icons, fonts: state.fonts, open: state.open });
  }

  // ── Build the panel DOM ──────────────────────────────────
  function svgIcon(iconId, size) {
    const lib = window.AtlasEngineIconLibrary;
    if (!lib) return '';
    return lib.fullSvg(iconId, size || 14);
  }

  function buildPanel() {
    if (document.getElementById('forge-dev-panel')) return;

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

    panel.querySelector('#fdp-close').addEventListener('click',  () => setOpen(false));
    panel.querySelector('#fdp-reset-all').addEventListener('click', resetAll);
    panel.querySelector('#fdp-export').addEventListener('click', exportConfig);
    wireControls(panel);

    setOpen(state.open);
  }

  function renderPanelHTML() {
    const sectionsHTML = SECTIONS.map(renderSection).join('');
    const iconPickerHTML = renderIconPickerSection();
    const fontPickerHTML = renderFontPickerSection();

    return `
      <div class="fdp-header">
        <span class="fdp-title">VISUAL  TUNING</span>
        <div class="fdp-header-actions">
          <button class="fdp-mini" id="fdp-export"     title="Copy current settings as JSON">Export</button>
          <button class="fdp-mini" id="fdp-reset-all"  title="Reset every slider + color to its default">Reset all</button>
          <button class="fdp-close" id="fdp-close"     title="Close (or press F)">×</button>
        </div>
      </div>
      <div class="fdp-doctrine">
        <strong>Tip:</strong> double-click any slider row to reset just that one.
        Press <kbd>F</kbd> to toggle this panel.
      </div>
      <div class="fdp-body">
        ${sectionsHTML}
        ${iconPickerHTML}
        ${fontPickerHTML}
      </div>
    `;
  }

  function renderSection(sec) {
    const inner = sec.groups
      ? sec.groups.map(renderGroup).join('')
      : `<div class="fdp-sec-body">${(sec.controls || []).map(renderControl).join('')}</div>`;
    return `
      <details class="fdp-section" open>
        <summary class="fdp-sec-title">${sec.title}</summary>
        ${sec.blurb ? `<div class="fdp-sec-blurb">${sec.blurb}</div>` : ''}
        ${inner}
      </details>
    `;
  }

  function renderGroup(g) {
    return `
      <details class="fdp-group" open>
        <summary class="fdp-group-title">${g.title}</summary>
        ${g.blurb ? `<div class="fdp-group-blurb">${g.blurb}</div>` : ''}
        <div class="fdp-group-body">
          ${(g.controls || []).map(renderControl).join('')}
        </div>
      </details>
    `;
  }

  function renderControl(c) {
    if (c.kind === 'color') return renderColorRow(c);
    return renderSliderRow(c);
  }

  function renderSliderRow(c) {
    const v = state.params[c.id];
    const display = formatVal(v, c) + (c.unit ? ' ' + c.unit : '');
    return `
      <div class="fdp-row" data-id="${c.id}" data-kind="slider">
        <div class="fdp-row-head">
          <span class="fdp-label">${c.label}</span>
          <span class="fdp-value">${display}</span>
        </div>
        ${c.hint ? `<div class="fdp-hint">${c.hint}</div>` : ''}
        <input class="fdp-slider" type="range"
               data-id="${c.id}"
               min="${c.min}" max="${c.max}" step="${c.step}" value="${v}">
      </div>
    `;
  }

  function renderColorRow(c) {
    const v = state.params[c.id];
    return `
      <div class="fdp-row fdp-row-color" data-id="${c.id}" data-kind="color">
        <div class="fdp-row-head">
          <span class="fdp-label">${c.label}</span>
          <span class="fdp-value fdp-value-color">${v}</span>
        </div>
        ${c.hint ? `<div class="fdp-hint">${c.hint}</div>` : ''}
        <div class="fdp-color-wrap">
          <input class="fdp-color" type="color" data-id="${c.id}" value="${v}">
          <span class="fdp-color-swatch" style="background:${v}"></span>
        </div>
      </div>
    `;
  }

  function renderIconPickerSection() {
    const types = (window.AtlasEngineMode && window.AtlasEngineMode.MODES)
      ? window.AtlasEngineMode.MODES.map(m => ({ id: m.nodeType, label: m.label }))
      : [];
    if (!types.length) return '';
    const lib = window.AtlasEngineIconLibrary;
    if (!lib) return '';
    const cats = lib.iconsByCategory();
    const catLabel = lib.CATEGORY_LABEL;
    const iconRowsHTML = types.map(t => {
      const currentIconId = state.icons[t.id] || '';
      const previewSvg = currentIconId ? svgIcon(currentIconId, 18) : svgIcon('circle-filled', 18);
      const gridHTML = lib.CATEGORY_ORDER.map(cat => `
        <div class="fdp-icon-cat">
          <div class="fdp-icon-cat-label">${catLabel[cat] || cat}</div>
          <div class="fdp-icon-row">
            ${(cats[cat] || []).map(ic => `
              <button class="fdp-icon-btn${currentIconId === ic.id ? ' is-selected' : ''}"
                      data-type="${t.id}" data-icon="${ic.id}" title="${ic.label || ic.id}">
                ${svgIcon(ic.id, 18)}
              </button>
            `).join('')}
          </div>
        </div>
      `).join('');
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
      <details class="fdp-section">
        <summary class="fdp-sec-title">SYMBOL PER NODE TYPE</summary>
        <div class="fdp-sec-blurb">Pick which little shape paints inside each node-type's disk. Click a row to expand the grid.</div>
        <div class="fdp-sec-body">
          ${iconRowsHTML}
        </div>
      </details>
    `;
  }

  function renderFontPickerSection() {
    const scopesHTML = FONT_SCOPES.map(s => {
      const cur = state.fonts[s.id] || s.defaultFont;
      const opts = FONTS.map(f => `<option value="${f.id}"${f.id === cur ? ' selected' : ''}>${f.label}</option>`).join('');
      return `
        <div class="fdp-row" data-font-scope="${s.id}">
          <div class="fdp-row-head">
            <span class="fdp-label">${s.label}</span>
          </div>
          <select class="fdp-font-select" data-font-scope="${s.id}">${opts}</select>
        </div>
      `;
    }).join('');
    return `
      <details class="fdp-section">
        <summary class="fdp-sec-title">TYPOGRAPHY</summary>
        <div class="fdp-sec-blurb">Pick the font family used in different parts of the wheel.</div>
        <div class="fdp-sec-body">${scopesHTML}</div>
      </details>
    `;
  }

  // ── Wiring ────────────────────────────────────────────────
  function wireControls(panel) {
    // Sliders
    panel.querySelectorAll('.fdp-slider').forEach(el => {
      el.addEventListener('input', (ev) => {
        const id = ev.target.dataset.id;
        const v  = parseFloat(ev.target.value);
        state.params[id] = v;
        const row = ev.target.closest('.fdp-row');
        if (row) {
          const c = ALL_PARAMS[id];
          row.querySelector('.fdp-value').textContent = formatVal(v, c) + (c.unit ? ' ' + c.unit : '');
        }
        if (window._forge && window._forge.setParam) {
          try { window._forge.setParam(id, v); } catch (e) { console.warn('[forge-dev-panel] setParam:', id, e); }
        }
        persist();
      });
    });
    // Color pickers
    panel.querySelectorAll('.fdp-color').forEach(el => {
      el.addEventListener('input', (ev) => {
        const id  = ev.target.dataset.id;
        const v   = ev.target.value;
        state.params[id] = v;
        const row = ev.target.closest('.fdp-row');
        if (row) {
          row.querySelector('.fdp-value').textContent = v;
          const sw = row.querySelector('.fdp-color-swatch');
          if (sw) sw.style.background = v;
        }
        if (window._forge && window._forge.setParam) {
          try { window._forge.setParam(id, v); } catch (e) { console.warn('[forge-dev-panel] setParam (color):', id, e); }
        }
        persist();
      });
    });
    // Double-click row → reset this param
    panel.querySelectorAll('.fdp-row').forEach(row => {
      row.addEventListener('dblclick', (ev) => {
        if (!row.dataset.id) return;
        resetOne(row.dataset.id);
        ev.preventDefault();
      });
    });
    // Icon picker
    panel.querySelectorAll('.fdp-icon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type   = btn.dataset.type;
        const iconId = btn.dataset.icon;
        state.icons[type] = iconId;
        if (window._forge && window._forge.setIcon) {
          try { window._forge.setIcon(type, iconId); } catch (e) { console.warn('[forge-dev-panel] setIcon:', type, e); }
        }
        const wrap = btn.closest('.fdp-icon-type');
        if (wrap) {
          wrap.querySelectorAll('.fdp-icon-btn').forEach(b => b.classList.toggle('is-selected', b === btn));
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
        const id    = ev.target.value;
        state.fonts[scope] = id;
        const font  = FONTS.find(f => f.id === id);
        if (window._forge && window._forge.setFont && font) {
          try { window._forge.setFont(scope, font); } catch (e) { console.warn('[forge-dev-panel] setFont:', scope, e); }
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
      if (c.kind === 'color') {
        const input = row.querySelector('.fdp-color');
        if (input) input.value = c.default;
        row.querySelector('.fdp-value').textContent = c.default;
        const sw = row.querySelector('.fdp-color-swatch');
        if (sw) sw.style.background = c.default;
      } else {
        const slider = row.querySelector('.fdp-slider');
        if (slider) slider.value = c.default;
        const valEl = row.querySelector('.fdp-value');
        if (valEl) valEl.textContent = formatVal(c.default, c) + (c.unit ? ' ' + c.unit : '');
      }
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
    if (c.step >= 1)   return String(Math.round(v));
    if (c.step >= 0.1) return v.toFixed(2);
    return v.toFixed(3);
  }

  // ── Keyboard ─────────────────────────────────────────────
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'f' && ev.key !== 'F') return;
    const tag = (document.activeElement || {}).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    setOpen(!state.open);
  });

  // ── Bootstrap ────────────────────────────────────────────
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

  // Expose for other modules.
  window.AtlasEngineForgeDevPanel = Object.freeze({
    applyAllToEngine,
    getState: () => ({
      params: Object.assign({}, state.params),
      icons:  Object.assign({}, state.icons),
      fonts:  Object.assign({}, state.fonts),
    }),
  });
})();
