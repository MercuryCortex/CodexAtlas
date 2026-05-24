// ============================================================
// CODEX ATLAS — TIMELINE CHROME (Phase TL-2 Step 3, 2026-05-24)
// ============================================================
// Renders the Timeline-specific visual chrome:
//   - 1 px horizontal axis line spanning the data X range
//   - Tick marks at major year boundaries
//   - Year labels above each tick (9000 BCE, 5000 BCE, ..., 2026 CE)
//
// Architecture: stays out of forge.js as much as possible. Forge
// calls mount(opts) when local.layoutId === 'timeline'; unmount()
// when it flips back to 'wheel'. The chrome owns its own DOM nodes
// (an SVG overlay), reads camera state via opts.camera, and
// repositions on each camera-change tick.
//
// World-space convention (must match timeline.js):
//   X_SCALE = 0.5 wu/year  →  worldX = (year - xRange.lo) * 0.5
//
// World → screen via opts.camera.worldToScreen({x, y}, viewport).
//
// Step 3 ships LINEAR distribution only. Step 4 adds the density-
// compressed bucket pattern with a Linear/Compressed toggle in the
// VIEW panel. Step 6 adds zoom-relaxation (TradingView-style).
//
// Exposes: window.AtlasTimelineChrome.{ mount, unmount, refresh }
// ============================================================
(function () {
  'use strict';

  // ── CONSTANTS ────────────────────────────────────────────
  const NS = 'http://www.w3.org/2000/svg';

  // Tick cadences by visible-year-span. Picks the most readable
  // tick interval for the current zoom. Coarser at overview,
  // finer when zoomed in. Mirrors TradingView's interval picker.
  // Phase 22-AB + AB-fix (2026-05-24) — finer cadence table,
  // SORTED ASCENDING so pickTickStep() returns the first entry
  // whose maxSpan threshold contains the current visible span.
  // Original table was sorted descending which combined with the
  // top-down loop meant tickStep was permanently locked at 5000.
  // Now: zoom-in shrinks span → matches a small-maxSpan entry →
  // tickStep shrinks correspondingly → dates appear continuously.
  const TICK_CADENCES = [
    // [maxSpanYears, tickStep]   ← visible span ≤ maxSpan → use step
    [     5,    1],   // deep zoom: every year
    [    10,    2],
    [    20,    2],
    [    30,    5],
    [    50,    5],
    [    70,   10],
    [   100,   10],
    [   200,   25],
    [   300,   25],
    [   500,   50],
    [   700,   50],
    [ 1_000,  100],
    [ 1_500,  150],
    [ 2_000,  200],
    [ 3_000,  250],
    [ 5_000,  500],
    [ 7_500,  750],
    [10_000, 1000],
    [15_000, 1500],
    [20_000, 2000],
    [30_000, 2500],
    [50_000, 5000],   // overview: every 5k years
  ];

  function pickTickStep(spanYears) {
    // Phase 22-AB-fix (2026-05-24) — TABLE-DIRECTION BUG.
    // The original loop iterated TICK_CADENCES top-down (largest
    // maxSpan first) and returned the FIRST entry where
    // `spanYears <= maxSpan`. Since [50_000, 5000] is the first
    // entry, ANY visible span ≤ 50_000 years matched on iteration
    // 1 → tickStep was permanently 5000. That's why John never saw
    // new dates appear while zooming in to the decade.
    // Fix: iterate from SMALLEST maxSpan and return the first
    // entry whose threshold contains the current span. The table
    // is now sorted ascending so the order is unambiguous.
    for (const [maxSpan, step] of TICK_CADENCES) {
      if (spanYears <= maxSpan) return step;
    }
    // Off the right end (very large span): use the LAST entry.
    return TICK_CADENCES[TICK_CADENCES.length - 1][1];
  }

  // Year → display label. Uses "BCE" / "CE" + "yr 0" cosmetic for
  // the boundary. Compact at large magnitudes ("5000 BCE" not "5,000").
  function formatYear(year) {
    if (year === 0) return '0';
    if (year < 0) return Math.abs(year) + ' BCE';
    return year + ' CE';
  }

  // ── DOM ──────────────────────────────────────────────────
  let svgRoot     = null;     // <svg> overlay
  let axisLineEl  = null;     // <line> the 1 px stroke
  let tickGroupEl = null;     // <g> container for ticks + labels
  let gridGroupEl = null;     // <g> container for faint vertical grid stripes
  let bandGroupEl = null;     // <g> family band rectangles (bottom-most layer)
  let bandLabelGroupEl = null;// <g> family labels — anchored to screen-left
  // Phase 22-AA (2026-05-24) — UNIFIED BOTTOM-RIGHT TOOLBAR.
  // Three previously-floating elements (chip picker, LIN/LOG switch,
  // vertical density slider) collapsed into ONE horizontal row that
  // mirrors the bottom-left button-strip layout. After 5+ asks. All
  // children use `.forge-fxpanel-btn` styling so any future restyle
  // of the bottom-left buttons propagates automatically here too.
  let toolbarEl   = null;     // <div> single container: [LIN|LOG|LOG-R|CMP] [DENSITY 1.0×]
  let presetSegEl = null;     // <div> segmented preset switcher
  let densityBtn  = null;     // <button> density popover trigger ("DENSITY 1.0×")
  let densityPopEl= null;     // <div> popover with horizontal slider (above the btn)
  let densityInput= null;     // <input type=hidden> holds the current band-scale value
  let densityRafId= 0;        // rAF coalesce for relayout on slider drag
  let mounted     = false;

  // localStorage key for persisting the band-density preference.
  // Phase 22-K → 22-N (2026-05-24) — v3 because base band heights
  // got another ×1.3 multiplier. Old saved 1.3× = new 1.3× would
  // compound to ~1.69× of new default → restart at 1×.
  const LS_BAND_SCALE = 'codex_atlas_timeline_band_scale_v3';

  // ── BAND STYLE STATE (Phase 22-I, 2026-05-24) ────────────
  // Live-tunable via the STYLE panel's "Timeline bands" + "Family
  // labels" sections. Reads applied on every refresh() call.
  // Persists to localStorage.
  // Phase 22-AB-fix (2026-05-24) — bumped to v2 because the
  // default for `denseTicks` flipped false→true. Users who'd ever
  // touched any band-style slider had the old default frozen in
  // their LS, which masked the new default. v2 = fresh start.
  const LS_BAND_STYLE = 'codex_atlas_timeline_band_style_v2';
  const BAND_STYLE_DEFAULTS = {
    fillAlpha:    0.18,
    strokeAlpha:  0.60,
    strokeWidth:  1.0,
    labelOpacity: 0.85,
    labelSize:    11,    // px
    // Phase 22-K (2026-05-24) — axis + grid line controls.
    axisOpacity:  0.70,
    axisWidth:    1.5,
    gridOpacity:  0.10,
    gridWidth:    1.0,
    // Phase 22-M (2026-05-24) — YR 0 pivot marker style.
    yr0Opacity:   1.0,
    yr0Size:      12,
    yr0Width:     1.8,
    // Phase 22-M — dense-ticks toggle (more dates onscreen as
    // you zoom in). When ON, the cadence picker uses one step
    // finer than auto.
    // Phase 22-AB (2026-05-24) — DEFAULT-ON. User: "the dates on
    // the timeline STILL MISSING — i don't want just a couple, i
    // want them TO appear while we zoom". Dense + finer ticks at
    // EVERY zoom level. The toggle stays in STYLE panel for users
    // who want the sparser overview look.
    denseTicks:   true,
  };
  let _bandStyle = Object.assign({}, BAND_STYLE_DEFAULTS);
  try {
    const raw = localStorage.getItem(LS_BAND_STYLE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.assign(_bandStyle, parsed);
      }
    }
  } catch (_) {}
  function _persistBandStyle() {
    try { localStorage.setItem(LS_BAND_STYLE, JSON.stringify(_bandStyle)); } catch (_) {}
  }
  function setBandStyleKey(key, val) {
    if (!(key in BAND_STYLE_DEFAULTS)) return false;
    if (typeof val !== 'number' || !isFinite(val)) return false;
    if (Math.abs(_bandStyle[key] - val) < 1e-4) return false;
    _bandStyle[key] = val;
    _persistBandStyle();
    scheduleRefresh();
    return true;
  }
  // Phase 22-M (2026-05-24) — boolean variant (denseTicks etc.).
  function setBandStyleBoolean(key, val) {
    if (!(key in BAND_STYLE_DEFAULTS)) return false;
    const bool = !!val;
    if (_bandStyle[key] === bool) return false;
    _bandStyle[key] = bool;
    _persistBandStyle();
    scheduleRefresh();
    return true;
  }
  function getBandStyle() { return Object.assign({}, _bandStyle); }
  function resetBandStyle() {
    _bandStyle = Object.assign({}, BAND_STYLE_DEFAULTS);
    _persistBandStyle();
    scheduleRefresh();
  }

  // ── STATE ────────────────────────────────────────────────
  // Provided by the host (forge.js) at mount-time:
  let hostEl   = null;        // The .forge-stage div (parent for the overlay)
  let camera   = null;        // The camera instance
  let mode     = null;        // local.mode (carries xRange via layout result)
  let xRange   = null;        // { lo, hi } in years
  let rafId    = 0;
  let unsubscribeCamera = null;

  // ── MOUNT ────────────────────────────────────────────────
  // opts: { hostEl, camera, mode, xRange }
  function mount(opts) {
    // Phase TL-2 Step 7b-fix (2026-05-24) — SOFT REMOUNT.
    // If we're already mounted to the same hostEl, don't tear
    // down the DOM. forge.js calls chrome.mount() on every
    // rebuildForMode — including when the user drags the band-
    // density slider (each tick → _forge.relayout → mount). A
    // hard unmount/mount would destroy the slider DOM mid-drag,
    // breaking the pointer-event chain after one click.
    if (mounted && opts && hostEl === opts.hostEl) {
      mode   = opts.mode  || mode;
      xRange = opts.xRange || xRange;
      if (opts.camera && camera !== opts.camera) {
        if (unsubscribeCamera) { try { unsubscribeCamera(); } catch (_) {} unsubscribeCamera = null; }
        camera = opts.camera;
        if (typeof camera.onChange === 'function') {
          unsubscribeCamera = camera.onChange(scheduleRefresh);
        }
      }
      // Phase 22-AA (2026-05-24) — re-sync toolbar readouts from
      // authority state in case something else mutated them.
      if (presetSegEl && typeof presetSegEl._render === 'function') {
        try { presetSegEl._render(); } catch (_) {}
      }
      if (densityInput && densityBtn) {
        const ENG = window.AtlasEngineLayout || {};
        if (typeof ENG.getTimelineBandHeightScale === 'function') {
          const cur = ENG.getTimelineBandHeightScale();
          if (Math.abs(parseFloat(densityInput.value) - cur) > 0.005) {
            densityInput.value = String(cur);
          }
          const vEl = densityBtn.querySelector('._v');
          if (vEl) vEl.textContent = formatBandScale(cur);
        }
      }
      scheduleRefresh();
      return;
    }
    if (mounted) unmount();
    hostEl = opts.hostEl;
    camera = opts.camera;
    mode   = opts.mode;
    xRange = opts.xRange;
    if (!hostEl || !camera || !xRange) {
      console.warn('[timeline-chrome] mount missing required opts', opts);
      return;
    }

    svgRoot = document.createElementNS(NS, 'svg');
    svgRoot.setAttribute('class', 'forge-timeline-chrome');
    svgRoot.setAttribute('aria-hidden', 'true');
    // Inline styles so we don't need a separate stylesheet entry for
    // Step 3. CSS gets formalized in Step 5 when we add the band chrome.
    svgRoot.style.position       = 'absolute';
    svgRoot.style.inset          = '0';
    svgRoot.style.width          = '100%';
    svgRoot.style.height         = '100%';
    svgRoot.style.pointerEvents  = 'none';
    svgRoot.style.zIndex         = '4';   // above canvas (z=1), below labels (z=10+)

    // Phase TL-2 Step 7 (2026-05-24) — family bands. Colored
    // rectangles per family, low alpha, span the full data range.
    // Drawn FIRST (bottom-most) so the grid stripes + ticks +
    // labels layer cleanly on top.
    //
    // Phase 22-G (2026-05-24) — left + right edges fade to 0
    // alpha via a per-band <linearGradient>, so the bands feel
    // organic instead of hard-edged. Strokes use the same
    // gradient → stroke-opacity tapers too.
    bandGroupEl = document.createElementNS(NS, 'g');
    bandGroupEl.setAttribute('class', 'forge-timeline-bands');
    // <defs> hosts the per-band fade gradient defs we mint on
    // refresh. Lives alongside the rects so it gets cleared with
    // them.
    const bandDefs = document.createElementNS(NS, 'defs');
    bandDefs.setAttribute('class', 'forge-timeline-band-defs');
    bandGroupEl.appendChild(bandDefs);
    bandGroupEl._defs = bandDefs;
    svgRoot.appendChild(bandGroupEl);

    // Vertical grid stripes — drawn AFTER bands so the date-lines
    // are visible over the band fill. Each visible tick gets a
    // faint full-height vertical line so the eye can read which
    // year any dot sits on without hover.
    gridGroupEl = document.createElementNS(NS, 'g');
    gridGroupEl.setAttribute('class', 'forge-timeline-grid');
    svgRoot.appendChild(gridGroupEl);

    // Phase 22-K (2026-05-24) — axis line spans full viewport with
    // a horizontal gradient that fades to 0 alpha beyond the spine
    // endpoints (9000 BCE / current year). Defs at top so the
    // gradient is reachable by url(#).
    const axisDefs = document.createElementNS(NS, 'defs');
    axisDefs.setAttribute('class', 'forge-timeline-axis-defs');
    const axisGrad = document.createElementNS(NS, 'linearGradient');
    axisGrad.setAttribute('id', 'forge-timeline-axis-fade');
    axisGrad.setAttribute('gradientUnits', 'userSpaceOnUse');
    // Stop colors + offsets minted on every refresh — see below.
    for (let i = 0; i < 4; i++) {
      const s = document.createElementNS(NS, 'stop');
      axisGrad.appendChild(s);
    }
    axisDefs.appendChild(axisGrad);
    svgRoot.appendChild(axisDefs);

    axisLineEl = document.createElementNS(NS, 'line');
    axisLineEl.setAttribute('class', 'forge-timeline-axis');
    axisLineEl.setAttribute('stroke', 'url(#forge-timeline-axis-fade)');
    axisLineEl.setAttribute('stroke-width', '1.5');
    svgRoot.appendChild(axisLineEl);

    tickGroupEl = document.createElementNS(NS, 'g');
    tickGroupEl.setAttribute('class', 'forge-timeline-ticks');
    svgRoot.appendChild(tickGroupEl);

    // Family band labels — TOP-most layer. X is anchored to the
    // viewport-left (10 px in), Y follows the band's world position
    // through the camera projection. Same convention the wheel's
    // family ring labels use, but in horizontal mode.
    bandLabelGroupEl = document.createElementNS(NS, 'g');
    bandLabelGroupEl.setAttribute('class', 'forge-timeline-band-labels');
    svgRoot.appendChild(bandLabelGroupEl);

    hostEl.appendChild(svgRoot);

    // Phase TL-2 Step 7b (2026-05-24) — hydrate the band-height
    // scale from localStorage BEFORE building the slider, so the
    // initial slider position reflects the persisted preference.
    // (Layout has ALREADY been computed by this point — that's OK;
    // forge.js will trigger a relayout when the slider's "init"
    // event handler fires, OR the user can drag for it to update.)
    hydrateBandScaleFromLS();

    // Phase 22-AA (2026-05-24) — UNIFIED BOTTOM-RIGHT TOOLBAR.
    // Was three separate floating elements (chip + LIN/LOG switch +
    // vertical density slider) — now one horizontal row that
    // matches the bottom-left button strip's height + padding +
    // visual rhythm. Children styled via `.forge-fxpanel-btn` so
    // the look stays in lockstep with the rest of the chrome.
    buildBottomToolbar();

    // Hook into camera so we redraw on every pan/zoom. Forge's camera
    // exposes onChange (camera.js line ~? — same hook the BG image
    // uses to follow zoom).
    if (typeof camera.onChange === 'function') {
      unsubscribeCamera = camera.onChange(scheduleRefresh);
    }

    mounted = true;
    scheduleRefresh();
  }

  // ── UNMOUNT ──────────────────────────────────────────────
  function unmount() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (unsubscribeCamera) { try { unsubscribeCamera(); } catch (_) {} unsubscribeCamera = null; }
    if (densityRafId) { cancelAnimationFrame(densityRafId); densityRafId = 0; }
    // Phase 22-AA (2026-05-24) — single-toolbar cleanup.
    if (toolbarEl && typeof toolbarEl._cleanup === 'function') {
      try { toolbarEl._cleanup(); } catch (_) {}
    }
    // Phase 22-L → 22-M (2026-05-24) — restore the wheel's
    // hull-overlay opacity ownership on unmount.
    const hullOverlayEl = document.querySelector('.forge-hulls-overlay');
    if (hullOverlayEl) hullOverlayEl.style.opacity = '';
    if (svgRoot && svgRoot.parentNode) svgRoot.parentNode.removeChild(svgRoot);
    if (toolbarEl && toolbarEl.parentNode) toolbarEl.parentNode.removeChild(toolbarEl);
    if (densityPopEl && densityPopEl.parentNode) densityPopEl.parentNode.removeChild(densityPopEl);
    svgRoot = null; axisLineEl = null; tickGroupEl = null; gridGroupEl = null;
    bandGroupEl = null; bandLabelGroupEl = null;
    toolbarEl = null; presetSegEl = null;
    densityBtn = null; densityPopEl = null; densityInput = null;
    hostEl = null; camera = null; mode = null; xRange = null;
    mounted = false;
  }

  // ── UNIFIED BOTTOM TOOLBAR (Phase 22-AA, 2026-05-24) ─────
  // After 5+ user asks the bottom-right is now ONE horizontal row
  // matching the bottom-left button strip (`.forge-fxpanel-btn`):
  //   [ LIN | LOG | LOG-R | CMP ]  [ DENSITY 1.0× ]
  // Previously three floating elements (chip + LIN/LOG switch +
  // vertical density slider) that didn't share a baseline. Now
  // all children are .forge-fxpanel-btn-styled at 24px height,
  // sitting at right:14 bottom:14 — mirroring the bottom-left rail.
  function buildBottomToolbar() {
    if (!hostEl) return;
    const ENG = window.AtlasEngineLayout || {};
    if (typeof ENG.setTimelineScalePreset !== 'function') return;

    toolbarEl = document.createElement('div');
    toolbarEl.className = 'forge-timeline-toolbar';
    Object.assign(toolbarEl.style, {
      position:      'absolute',
      right:         '14px',
      bottom:        '14px',
      display:       'inline-flex',
      alignItems:    'center',
      gap:           '8px',
      pointerEvents: 'auto',
      zIndex:        '6',
    });
    hostEl.appendChild(toolbarEl);

    // ─── Segmented preset switcher ─────────────────────────
    // 4 presets, short labels. Click = switch + relayout. Active
    // segment gets a gold tint + bold weight.
    presetSegEl = document.createElement('div');
    presetSegEl.className = 'forge-timeline-toolbar-seg';
    // Phase 22-AB-fix2 (2026-05-24) — NO explicit height. Size
    // emerges from font + padding + border like .forge-fxpanel-btn
    // so this row lines up flush with LEGEND / VIEW / etc. Earlier
    // `height:23px` made the outer height 25px (border-added) which
    // John's screenshot showed as 2-3px too tall.
    Object.assign(presetSegEl.style, {
      display:       'inline-flex',
      alignItems:    'stretch',
      background:    'rgba(13,17,25,0.78)',
      border:        '1px solid rgba(212,165,90,0.22)',
      borderRadius:  '6px',
      overflow:      'hidden',
      fontFamily:    'var(--mono, "JetBrains Mono", Menlo, monospace)',
      fontSize:      '11px',
      letterSpacing: '0.08em',
      cursor:        'pointer',
      userSelect:    'none',
      transition:    'border-color 120ms ease',
    });
    presetSegEl.addEventListener('mouseenter', function () {
      presetSegEl.style.borderColor = 'var(--gold-soft, rgba(212,165,90,0.45))';
    });
    presetSegEl.addEventListener('mouseleave', function () {
      presetSegEl.style.borderColor = 'rgba(212,165,90,0.22)';
    });

    const SEGMENTS = [
      { id: 'linear-default',          label: 'LIN',   tip: 'Linear · 9K BCE → today' },
      { id: 'log-centered',            label: 'LOG',   tip: 'Log · year-0 centered' },
      { id: 'log-recent',              label: 'LOG-R', tip: 'Log · recent-emphasis' },
      { id: 'compressed-civilization', label: 'CMP',   tip: 'Compressed · era-weighted' },
    ];
    function renderPresetSegs() {
      presetSegEl.innerHTML = '';
      const activeId = (typeof ENG.getTimelineScalePresetId === 'function')
        ? ENG.getTimelineScalePresetId() : 'linear-default';
      SEGMENTS.forEach(function (seg, i) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = seg.label;
        b.title = seg.tip;
        b.setAttribute('data-preset', seg.id);
        const isActive = (seg.id === activeId);
        Object.assign(b.style, {
          // Phase 22-AB-fix2 — vertical padding 5px matches
          // .forge-fxpanel-btn so each segment renders at the
          // same content-height (~13px line) as the canonical
          // bottom-bar buttons. Total row height ~22-23px outer.
          padding:       '5px 10px',
          lineHeight:    '1',
          background:    isActive ? 'rgba(212, 165, 90, 0.18)' : 'transparent',
          color:         isActive ? 'var(--gold-1, #e8c889)' : 'var(--text-2, #9099a8)',
          border:        'none',
          borderRight:   (i < SEGMENTS.length - 1) ? '1px solid rgba(212,165,90,0.12)' : 'none',
          cursor:        'pointer',
          fontFamily:    'inherit',
          fontSize:      'inherit',
          letterSpacing: 'inherit',
          fontWeight:    isActive ? '600' : '500',
          textTransform: 'uppercase',
        });
        b.addEventListener('click', function () {
          const changed = ENG.setTimelineScalePreset(seg.id);
          renderPresetSegs();
          if (changed && window._forge && typeof window._forge.relayout === 'function') {
            window._forge.relayout();
          }
        });
        presetSegEl.appendChild(b);
      });
    }
    renderPresetSegs();
    presetSegEl._render = renderPresetSegs;
    toolbarEl.appendChild(presetSegEl);

    // ─── Density button + horizontal popover ───────────────
    if (typeof ENG.getTimelineBandHeightScale === 'function') {
      // Hydrate band scale from LS first so the visible label is right.
      hydrateBandScaleFromLS();
      const cur = ENG.getTimelineBandHeightScale();
      const bounds = ENG.timelineBandScaleBounds || { min: 0.3, max: 3.0 };

      densityInput = document.createElement('input');
      densityInput.type  = 'hidden';
      densityInput.value = String(cur);
      densityInput._bounds = bounds;

      densityBtn = document.createElement('button');
      densityBtn.type = 'button';
      densityBtn.className = 'forge-timeline-toolbar-density';
      densityBtn.setAttribute('aria-haspopup', 'true');
      densityBtn.setAttribute('aria-expanded', 'false');
      densityBtn.title = 'Band density — click for slider, double-click to reset';
      // Phase 22-AB-fix2 — no explicit height; padding-driven sizing
      // matches .forge-fxpanel-btn (LEGEND / VIEW / FX / STYLE / #).
      Object.assign(densityBtn.style, {
        padding:       '5px 10px',
        lineHeight:    '1',
        background:    'rgba(13,17,25,0.78)',
        border:        '1px solid rgba(212,165,90,0.22)',
        borderRadius:  '6px',
        color:         'var(--text-2, #9099a8)',
        fontFamily:    'var(--mono, "JetBrains Mono", Menlo, monospace)',
        fontSize:      '11px',
        letterSpacing: '0.08em',
        cursor:        'pointer',
        userSelect:    'none',
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '6px',
        transition:    'border-color 120ms ease, color 120ms ease',
        whiteSpace:    'nowrap',
      });
      densityBtn.innerHTML = '<span style="opacity:0.7;text-transform:uppercase">density</span> <span class="_v" style="color:var(--gold,#d4a55a);font-weight:600">' + formatBandScale(cur) + '</span> <span style="opacity:0.6;font-size:9px">▾</span>';
      densityBtn.addEventListener('mouseenter', function () {
        densityBtn.style.borderColor = 'var(--gold-soft, rgba(212,165,90,0.45))';
      });
      densityBtn.addEventListener('mouseleave', function () {
        densityBtn.style.borderColor = 'rgba(212,165,90,0.22)';
      });
      densityBtn.addEventListener('click', toggleDensityPopover);
      densityBtn.addEventListener('dblclick', function (e) {
        e.preventDefault(); e.stopPropagation();
        applyDensityValue(1.0);
        closeDensityPopover();
      });
      toolbarEl.appendChild(densityBtn);
    }

    // Outside-click + Esc to close popovers.
    const onOutside = function (e) {
      if (!densityPopEl) return;
      if (densityPopEl.contains(e.target)) return;
      if (densityBtn && densityBtn.contains(e.target)) return;
      closeDensityPopover();
    };
    const onEsc = function (e) {
      if (e.key === 'Escape') closeDensityPopover();
    };
    document.addEventListener('mousedown', onOutside, true);
    document.addEventListener('keydown', onEsc, true);
    toolbarEl._cleanup = function () {
      document.removeEventListener('mousedown', onOutside, true);
      document.removeEventListener('keydown', onEsc, true);
    };
  }

  function hydrateBandScaleFromLS() {
    const ENG = window.AtlasEngineLayout || {};
    if (typeof ENG.setTimelineBandHeightScale !== 'function') return;
    try {
      const raw = localStorage.getItem(LS_BAND_SCALE);
      if (raw == null) return;
      const v = parseFloat(raw);
      if (isFinite(v)) ENG.setTimelineBandHeightScale(v);
    } catch (_) {}
  }

  function formatBandScale(v) {
    return (Math.round(v * 10) / 10).toFixed(1) + '×';
  }

  function toggleDensityPopover() {
    if (densityPopEl) closeDensityPopover();
    else              openDensityPopover();
  }

  function openDensityPopover() {
    if (!hostEl || !densityBtn || !densityInput) return;
    const bounds = densityInput._bounds || { min: 0.3, max: 3.0 };
    const v = parseFloat(densityInput.value);

    densityPopEl = document.createElement('div');
    densityPopEl.className = 'forge-timeline-toolbar-density-pop';
    Object.assign(densityPopEl.style, {
      position:      'absolute',
      right:         '14px',
      bottom:        '46px',    // 14 (toolbar bottom) + 24 (height) + 8 gap
      minWidth:      '240px',
      padding:       '10px 14px 12px',
      background:    'rgba(13,17,25,0.92)',
      border:        '1px solid rgba(212,165,90,0.22)',
      borderRadius:  '8px',
      backdropFilter:'blur(12px)',
      WebkitBackdropFilter:'blur(12px)',
      boxShadow:     '0 6px 24px rgba(0,0,0,0.45)',
      fontFamily:    'var(--mono, "JetBrains Mono", Menlo, monospace)',
      fontSize:      '11px',
      letterSpacing: '0.06em',
      color:         'var(--text-2, #9099a8)',
      zIndex:        '7',
      pointerEvents: 'auto',
    });

    // Header row — title + live readout.
    const head = document.createElement('div');
    head.style.display = 'flex';
    head.style.justifyContent = 'space-between';
    head.style.alignItems = 'baseline';
    head.style.marginBottom = '8px';
    head.style.textTransform = 'uppercase';
    const title = document.createElement('span');
    title.textContent = 'Band density';
    title.style.opacity = '0.7';
    head.appendChild(title);
    const readout = document.createElement('span');
    readout.className = '_pop_v';
    readout.textContent = formatBandScale(v);
    readout.style.color = 'var(--gold, #d4a55a)';
    readout.style.fontWeight = '600';
    head.appendChild(readout);
    densityPopEl.appendChild(head);

    // HORIZONTAL native range input — keeps interaction simple, no
    // pointer-event gymnastics needed (vertical slider had drag issues).
    const range = document.createElement('input');
    range.type  = 'range';
    range.min   = String(bounds.min);
    range.max   = String(bounds.max);
    range.step  = '0.05';
    range.value = String(v);
    Object.assign(range.style, {
      width:       '100%',
      accentColor: 'var(--gold, #d4a55a)',
      cursor:      'ew-resize',
    });
    range.addEventListener('input', function () {
      const nv = parseFloat(range.value);
      readout.textContent = formatBandScale(nv);
      applyDensityValue(nv);
    });
    densityPopEl.appendChild(range);

    // Foot row — min/reset/max ticks.
    const foot = document.createElement('div');
    foot.style.display = 'flex';
    foot.style.justifyContent = 'space-between';
    foot.style.marginTop = '6px';
    foot.style.opacity = '0.6';
    foot.style.fontSize = '9px';
    foot.style.letterSpacing = '0.10em';
    foot.style.textTransform = 'uppercase';
    const lo = document.createElement('span'); lo.textContent = bounds.min.toFixed(1) + '×';
    const reset = document.createElement('a');
    reset.href = '#'; reset.textContent = 'reset 1.0×';
    reset.style.color = 'var(--gold, #d4a55a)';
    reset.style.textDecoration = 'none';
    reset.addEventListener('click', function (e) {
      e.preventDefault();
      range.value = '1';
      readout.textContent = '1.0×';
      applyDensityValue(1.0);
    });
    const hi = document.createElement('span'); hi.textContent = bounds.max.toFixed(1) + '×';
    foot.appendChild(lo); foot.appendChild(reset); foot.appendChild(hi);
    densityPopEl.appendChild(foot);

    hostEl.appendChild(densityPopEl);
    if (densityBtn) densityBtn.setAttribute('aria-expanded', 'true');
  }

  function closeDensityPopover() {
    if (densityPopEl && densityPopEl.parentNode) densityPopEl.parentNode.removeChild(densityPopEl);
    densityPopEl = null;
    if (densityBtn) densityBtn.setAttribute('aria-expanded', 'false');
  }

  function applyDensityValue(v) {
    if (!densityInput) return;
    if (!isFinite(v)) return;
    const b = densityInput._bounds || { min: 0.3, max: 3.0 };
    const clamped = Math.max(b.min, Math.min(b.max, v));
    densityInput.value = String(clamped);
    // Sync btn readout
    if (densityBtn) {
      const vEl = densityBtn.querySelector('._v');
      if (vEl) vEl.textContent = formatBandScale(clamped);
    }
    if (densityPopEl) {
      const vEl = densityPopEl.querySelector('._pop_v');
      if (vEl) vEl.textContent = formatBandScale(clamped);
    }
    try { localStorage.setItem(LS_BAND_SCALE, String(clamped)); } catch (_) {}
    const ENG = window.AtlasEngineLayout || {};
    const changed = (typeof ENG.setTimelineBandHeightScale === 'function')
      && ENG.setTimelineBandHeightScale(clamped);
    if (!changed) return;
    if (densityRafId) return;
    densityRafId = requestAnimationFrame(function () {
      densityRafId = 0;
      if (window._forge && typeof window._forge.relayout === 'function') {
        window._forge.relayout();
      }
    });
  }


  // ── REFRESH ──────────────────────────────────────────────
  // rAF-coalesced so multiple camera-change events per frame collapse
  // to a single redraw. Same pattern Forge uses for hover-coalesce.
  function scheduleRefresh() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      refresh();
    });
  }

  function refresh() {
    if (!mounted || !svgRoot || !camera || !xRange) return;
    const vp = { w: hostEl.clientWidth, h: hostEl.clientHeight };
    if (!vp.w || !vp.h) return;

    // SVG viewport. Match host dimensions so 1 SVG-unit = 1 CSS pixel.
    svgRoot.setAttribute('viewBox', '0 0 ' + vp.w + ' ' + vp.h);
    svgRoot.setAttribute('width',  vp.w);
    svgRoot.setAttribute('height', vp.h);

    // Axis vertical position: viewport vertical-middle for Step 3.
    // (Step 5 will reposition above the family bands.)
    const axisY = Math.round(vp.h * 0.5);

    // Compute the screen X position of xRange.lo and xRange.hi using
    // the layout's world-X math. yearToWorldX is on AtlasEngineLayout.
    const yToX  = (window.AtlasEngineLayout && window.AtlasEngineLayout.timelineYearToWorldX) || null;
    if (!yToX) return;
    const loScreen = camera.worldToScreen(yToX(xRange.lo, xRange), 0, vp);
    const hiScreen = camera.worldToScreen(yToX(xRange.hi, xRange), 0, vp);

    // Phase 22-K (2026-05-24) — axis line spans FULL viewport
    // width; the gradient handles the fade-to-0-alpha outside
    // the spine endpoints. Color + width come from band-style
    // state (live STYLE-panel sliders).
    axisLineEl.setAttribute('x1', 0);
    axisLineEl.setAttribute('y1', axisY);
    axisLineEl.setAttribute('x2', vp.w);
    axisLineEl.setAttribute('y2', axisY);
    axisLineEl.setAttribute('stroke-width', String(_bandStyle.axisWidth));
    // Re-bake the linearGradient stops. Coordinate system =
    // userSpaceOnUse with x=0 → x=vp.w. Stops 0% + 100% are
    // ALWAYS at the viewport edges; stops 2/3 sit at the spine
    // endpoints (clamped if zoomed in past them).
    const axisGradEl = svgRoot.querySelector('#forge-timeline-axis-fade');
    if (axisGradEl) {
      axisGradEl.setAttribute('x1', 0);
      axisGradEl.setAttribute('x2', vp.w);
      const stops = axisGradEl.querySelectorAll('stop');
      const tLo = loScreen.x / vp.w;            // spine left as 0..1
      const tHi = hiScreen.x / vp.w;            // spine right as 0..1
      const lo  = Math.max(0, Math.min(1, tLo));
      const hi  = Math.max(0, Math.min(1, tHi));
      // If spine left is past the left viewport edge (tLo < 0),
      // the left stop should START at full alpha (no fade-in
      // needed). Same for right.
      const aLeft  = (tLo > 0) ? 0 : _bandStyle.axisOpacity;
      const aRight = (tHi < 1) ? 0 : _bandStyle.axisOpacity;
      const aInner = _bandStyle.axisOpacity;
      const baseCol = 'rgba(212, 165, 90, 1)';
      const stopSpec = [
        { off: '0%',                 col: baseCol, op: aLeft  },
        { off: (lo * 100) + '%',     col: baseCol, op: aInner },
        { off: (hi * 100) + '%',     col: baseCol, op: aInner },
        { off: '100%',               col: baseCol, op: aRight },
      ];
      for (let i = 0; i < stops.length; i++) {
        stops[i].setAttribute('offset',       stopSpec[i].off);
        stops[i].setAttribute('stop-color',   stopSpec[i].col);
        stops[i].setAttribute('stop-opacity', String(stopSpec[i].op));
      }
    }

    // ── FAMILY BANDS (Phase TL-2 Step 7, 2026-05-24) ─────────
    // Paint each family band as a colored rectangle spanning the
    // full data X range. Y comes from the layout (band.y0/y1 are
    // world coords — Step 6 origin-centered). Project through the
    // camera so bands track pan + zoom. Low alpha so the bands
    // sit BEHIND the dots + ticks without competing for attention.
    // Wipe + re-mint the band layer. Defs holds per-band gradients
    // — clear them too so we don't leak gradient nodes.
    while (bandGroupEl.firstChild)      bandGroupEl.removeChild(bandGroupEl.firstChild);
    while (bandLabelGroupEl.firstChild) bandLabelGroupEl.removeChild(bandLabelGroupEl.firstChild);
    const bandDefs2 = document.createElementNS(NS, 'defs');
    bandDefs2.setAttribute('class', 'forge-timeline-band-defs');
    bandGroupEl.appendChild(bandDefs2);

    const bands = (mode && mode.bands) || {};
    const undated = (mode && mode.undated) || null;
    // X range for band rects — extend slightly beyond data to match
    // the axis line's continuation feel.
    const bandX0 = Math.max(-200, loScreen.x - 40);
    const bandX1 = Math.min(vp.w + 200, hiScreen.x + 40);
    const bandWidth = Math.max(0, bandX1 - bandX0);

    // Phase 22-G (2026-05-24) — zoom-out band fade. Bands +
    // labels fade out as gizmo drops from 15% → 11% so the
    // overview view (zoom-far) reads as a clean field with the
    // floor-FX bloom, not a forest of stripes.
    let zoomFade = 1.0;
    try {
      const fitForFade = (window.AtlasEngineLayout && window.AtlasEngineLayout.computeTimelineFitScale)
        ? window.AtlasEngineLayout.computeTimelineFitScale(vp.w, xRange) : 0;
      if (fitForFade > 0 && camera.state && typeof camera.state.scale === 'number') {
        const gz = camera.state.scale / fitForFade;
        if      (gz >= 0.15) zoomFade = 1.0;
        else if (gz <= 0.11) zoomFade = 0.0;
        else                 zoomFade = (gz - 0.11) / (0.15 - 0.11);
      }
    } catch (_) {}
    bandGroupEl.style.opacity      = String(zoomFade);
    bandLabelGroupEl.style.opacity = String(zoomFade);
    // Phase 22-L → 22-M (2026-05-24) — fade the wheel's HULL
    // OVERLAY parent in lockstep with bands. The wheel's
    // syncHulls() owns the .forge-hulls-overlay opacity in wheel
    // mode (50→25% curve); forge.js now early-skips that write
    // when local.layoutId === 'timeline' so this override sticks
    // every frame.
    const hullOverlayEl = document.querySelector('.forge-hulls-overlay');
    if (hullOverlayEl) hullOverlayEl.style.opacity = String(zoomFade);

    // Per-band fade gradient — used by both fill + stroke so the
    // L/R taper is matched on both. Edges 0% opacity, middle 100%.
    // Inset 8% on each side: the band feels lifted off the
    // viewport edges instead of butted hard.
    function _gradId(name) {
      return 'forge-timeline-band-grad-' + name.replace(/[^a-z0-9_-]/gi, '_');
    }

    for (const famName in bands) {
      const band = bands[famName];
      if (!band) continue;
      const yTopScreen = camera.worldToScreen(0, band.y0, vp).y;
      const yBotScreen = camera.worldToScreen(0, band.y1, vp).y;
      const h = Math.max(0, yBotScreen - yTopScreen);
      // Skip bands that are entirely off-screen vertically.
      if (yBotScreen < -40 || yTopScreen > vp.h + 40) continue;

      // Build a per-band horizontal gradient: 0% → 8% ramp in,
      // 92% → 100% ramp out. Used for both fill + stroke so the
      // band visually tapers on both ends.
      const gradId = _gradId(famName);
      const grad = document.createElementNS(NS, 'linearGradient');
      grad.setAttribute('id', gradId);
      grad.setAttribute('x1', '0%'); grad.setAttribute('x2', '100%');
      grad.setAttribute('y1', '0%'); grad.setAttribute('y2', '0%');
      grad.setAttribute('gradientUnits', 'objectBoundingBox');
      const stops = [
        { o: '0%',   so: '0' },
        { o: '8%',   so: '1' },
        { o: '92%',  so: '1' },
        { o: '100%', so: '0' },
      ];
      for (const s of stops) {
        const st = document.createElementNS(NS, 'stop');
        st.setAttribute('offset', s.o);
        st.setAttribute('stop-color', band.color || '#6e7480');
        st.setAttribute('stop-opacity', s.so);
        grad.appendChild(st);
      }
      bandDefs2.appendChild(grad);

      // Fill rectangle — gradient fill (L/R fade to 0). Stroke
      // also uses the same gradient via a separate stroke-only
      // rect so end-caps also taper. Live-tunable via STYLE panel.
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x',      bandX0);
      rect.setAttribute('y',      yTopScreen);
      rect.setAttribute('width',  bandWidth);
      rect.setAttribute('height', h);
      rect.setAttribute('fill',           'url(#' + gradId + ')');
      rect.setAttribute('fill-opacity',   String(_bandStyle.fillAlpha));
      rect.setAttribute('stroke',         'url(#' + gradId + ')');
      rect.setAttribute('stroke-opacity', String(_bandStyle.strokeAlpha));
      rect.setAttribute('stroke-width',   String(_bandStyle.strokeWidth));
      bandGroupEl.appendChild(rect);

      // Left-edge label — fixed at viewport X=12 (so it stays
      // visible at any horizontal pan) + band's projected Y.
      const yCenterScreen = (yTopScreen + yBotScreen) / 2;
      if (yCenterScreen >= 0 && yCenterScreen <= vp.h) {
        const label = document.createElementNS(NS, 'text');
        label.setAttribute('x', 12);
        label.setAttribute('y', yCenterScreen + 4);
        label.setAttribute('text-anchor', 'start');
        label.setAttribute('class', 'forge-timeline-band-label');
        label.style.fill          = band.color || 'rgba(232,200,137,0.85)';
        label.style.fontFamily    = 'var(--mono, "JetBrains Mono", Menlo, monospace)';
        label.style.fontSize      = _bandStyle.labelSize + 'px';
        label.style.fontWeight    = '600';
        label.style.letterSpacing = '0.12em';
        label.style.textTransform = 'uppercase';
        label.style.opacity       = String(_bandStyle.labelOpacity);
        label.textContent = band.name || famName;
        bandLabelGroupEl.appendChild(label);
      }
    }

    // Phase B-DATING-3 (2026-05-24) — Atemporal lane GONE.
    // John: "intemporal nodes CANT be in a band spread out in a
    // timeline. it ruins the hulls. EVERYTHING has a date of
    // first mentioned or found." B7 nodes are skipped at layout
    // time; nothing to render here.

    // Compute tick cadence from the VISIBLE year span (not the full
    // dataset). At deep zoom, the visible span shrinks → finer ticks.
    const visLoYear = window.AtlasEngineLayout.timelineWorldXToYear(
      camera.screenToWorld(0, axisY, vp).x, xRange);
    const visHiYear = window.AtlasEngineLayout.timelineWorldXToYear(
      camera.screenToWorld(vp.w, axisY, vp).x, xRange);
    const visSpan = Math.max(1, visHiYear - visLoYear);
    // Phase 22-M (2026-05-24) — dense-ticks toggle. When ON,
    // pick one step finer than the auto cadence by halving
    // (clamped to step >= 1). User control via VIEW > Layers.
    let tickStep = pickTickStep(visSpan);
    if (_bandStyle.denseTicks) {
      tickStep = Math.max(1, Math.floor(tickStep / 2));
    }

    // Compute the first tick at or AFTER visLoYear, snapped to a
    // multiple of tickStep.
    const firstTick = Math.ceil(visLoYear / tickStep) * tickStep;

    // Phase TL-2 Step 6 — CLAMP tick iteration to the spine range.
    // Per John's spec (2026-05-24): the timeline only shows dates
    // within [9000 BCE, currentYear]. Anything outside that is OFF
    // — no "5000 CE" ghost labels past the right endpoint, no
    // "-15000 BCE" past the left. Loop is bounded by both visibility
    // (visHiYear) AND spine cap (xRange.hi); same on the lo side.
    const tickLo = Math.max(firstTick, xRange.lo);
    const tickHi = Math.min(visHiYear, xRange.hi);

    // Phase TL-2 Step 5b (2026-05-24) — ONE style for every tick.
    // Earlier (Step 5) the major/minor split made minor labels too
    // dim (10px 55%) — John flagged them as "ghostly gap dates."
    // Now every visible year tick gets the same bright label, same
    // mark, same grid stripe. Major-vs-minor distinction stays only
    // as a thin visual hint: ticks at multiples of (tickStep × 5)
    // get a slightly TALLER mark for orientation, but the LABEL
    // brightness + size stay constant across the row.
    const emphasisModulus = tickStep * 5;
    while (gridGroupEl.firstChild) gridGroupEl.removeChild(gridGroupEl.firstChild);
    while (tickGroupEl.firstChild) tickGroupEl.removeChild(tickGroupEl.firstChild);
    // Phase 22-F (2026-05-24) — year 0 is the BC/AD pivot. ALWAYS
    // render it, regardless of tick cadence, with a distinct
    // brighter + slightly heavier style. Skip the dup if the
    // normal loop also lands on 0 (it always will when 0 is in
    // [tickLo, tickHi] since 0 % N === 0 for any N).
    const Y0_LO = xRange.lo, Y0_HI = xRange.hi;
    const renderYearZeroSeparately = (0 >= Y0_LO && 0 <= Y0_HI);

    for (let yr = tickLo; yr <= tickHi; yr += tickStep) {
      if (renderYearZeroSeparately && yr === 0) continue;   // skip — drawn after as pivot
      const wx = yToX(yr, xRange);
      const sp = camera.worldToScreen(wx, 0, vp);
      // Off-screen guards (margin so near-edge labels still draw).
      if (sp.x < -80 || sp.x > vp.w + 80) continue;
      const emphasized = (yr % emphasisModulus === 0);

      // Faint vertical grid stripe (full viewport height). All
      // ticks get the same stripe so the eye can read any year
      // by tracing vertically. Emphasized = marginally brighter.
      const grid = document.createElementNS(NS, 'line');
      grid.setAttribute('x1', sp.x); grid.setAttribute('x2', sp.x);
      grid.setAttribute('y1', 0);    grid.setAttribute('y2', vp.h);
      // Phase 22-K (2026-05-24) — live opacity + width from STYLE panel.
      // Emphasized ticks get 60% boost on opacity for a subtle hint.
      const baseOp  = _bandStyle.gridOpacity;
      const emphOp  = Math.min(1, baseOp * 1.6);
      grid.setAttribute('stroke', 'rgba(212,165,90,' + (emphasized ? emphOp : baseOp) + ')');
      grid.setAttribute('stroke-width', String(_bandStyle.gridWidth));
      gridGroupEl.appendChild(grid);

      // Tick mark on the axis. Emphasized ticks slightly taller.
      const tickHalf = emphasized ? 8 : 5;
      const tick = document.createElementNS(NS, 'line');
      tick.setAttribute('x1', sp.x);
      tick.setAttribute('y1', axisY - tickHalf);
      tick.setAttribute('x2', sp.x);
      tick.setAttribute('y2', axisY + tickHalf);
      tick.setAttribute('stroke', 'rgba(232, 200, 137, 0.95)');
      tick.setAttribute('stroke-width', '1.25');
      tickGroupEl.appendChild(tick);

      // Year label — uniform style for every tick. Bright, mono,
      // 11 px, gold-1. Tick-mark length is the only thing that
      // changes between emphasized + non-emphasized.
      const label = document.createElementNS(NS, 'text');
      label.setAttribute('x', sp.x);
      label.setAttribute('y', axisY - (emphasized ? 14 : 12));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'forge-timeline-year-label');
      label.style.fill          = 'rgba(232, 200, 137, 0.95)';
      label.style.fontFamily    = 'var(--mono, "JetBrains Mono", Menlo, monospace)';
      label.style.fontSize      = '11px';
      label.style.fontWeight    = '500';
      label.style.letterSpacing = '0.10em';
      label.style.textTransform = 'uppercase';
      label.textContent = formatYear(yr);
      tickGroupEl.appendChild(label);
    }

    // Phase 22-F (2026-05-24) — ALWAYS-ON year-0 pivot marker.
    // Year 0 is the BC/AD hinge — render it distinctly at every
    // zoom level regardless of cadence. Brighter stripe, taller
    // tick, bolder "yr 0" label.
    if (renderYearZeroSeparately) {
      const wx0 = yToX(0, xRange);
      const sp0 = camera.worldToScreen(wx0, 0, vp);
      if (sp0.x >= -120 && sp0.x <= vp.w + 120) {
        // Phase 22-M (2026-05-24) — STYLE-tunable pivot mark.
        const y0op = _bandStyle.yr0Opacity;
        const y0sz = _bandStyle.yr0Size;
        const y0wd = _bandStyle.yr0Width;
        // Pivot grid stripe — brighter + wider than peer ticks.
        const grid0 = document.createElementNS(NS, 'line');
        grid0.setAttribute('x1', sp0.x); grid0.setAttribute('x2', sp0.x);
        grid0.setAttribute('y1', 0);     grid0.setAttribute('y2', vp.h);
        grid0.setAttribute('stroke', 'rgba(212, 165, 90, ' + (0.34 * y0op).toFixed(3) + ')');
        grid0.setAttribute('stroke-width', String(Math.max(1, y0wd * 0.83)));
        gridGroupEl.appendChild(grid0);

        // Tick mark.
        const tickHalf = y0sz;
        const tick0 = document.createElementNS(NS, 'line');
        tick0.setAttribute('x1', sp0.x);
        tick0.setAttribute('y1', axisY - tickHalf);
        tick0.setAttribute('x2', sp0.x);
        tick0.setAttribute('y2', axisY + tickHalf);
        tick0.setAttribute('stroke', 'rgba(245, 220, 160, ' + y0op.toFixed(3) + ')');
        tick0.setAttribute('stroke-width', String(y0wd));
        tickGroupEl.appendChild(tick0);

        // Label — heavier weight + slightly larger, bright gold.
        const lbl0 = document.createElementNS(NS, 'text');
        lbl0.setAttribute('x', sp0.x);
        lbl0.setAttribute('y', axisY - (tickHalf + 6));
        lbl0.setAttribute('text-anchor', 'middle');
        lbl0.setAttribute('class', 'forge-timeline-year-label forge-timeline-year-zero');
        lbl0.style.fill          = 'rgba(245, 220, 160, ' + y0op.toFixed(3) + ')';
        lbl0.style.fontFamily    = 'var(--mono, "JetBrains Mono", Menlo, monospace)';
        lbl0.style.fontSize      = (y0sz + 0) + 'px';
        lbl0.style.fontWeight    = '600';
        lbl0.style.letterSpacing = '0.14em';
        lbl0.style.textTransform = 'uppercase';
        lbl0.textContent = 'YR 0';
        tickGroupEl.appendChild(lbl0);
      }
    }
  }

  // ── EXPORT ───────────────────────────────────────────────
  window.AtlasTimelineChrome = {
    mount,
    unmount,
    refresh: scheduleRefresh,
    isMounted: () => mounted,
    // Phase 22-I (2026-05-24) — band style API for STYLE panel.
    // Phase 22-M (2026-05-24) — boolean setter added.
    setBandStyle: setBandStyleKey,
    setBandStyleBoolean: setBandStyleBoolean,
    getBandStyle: getBandStyle,
    resetBandStyle: resetBandStyle,
    bandStyleDefaults: function () { return Object.assign({}, BAND_STYLE_DEFAULTS); },
  };
})();
