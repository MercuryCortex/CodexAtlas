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
  const TICK_CADENCES = [
    // [maxSpanYears, tickStep]
    [50_000, 5000],   // overview      → tick every 5000 yr
    [20_000, 2000],
    [10_000, 1000],
    [ 5_000,  500],
    [ 2_000,  250],
    [ 1_000,  100],
    [   500,   50],
    [   200,   25],
    [   100,   10],
    [    50,    5],
    [    20,    2],
    [     1,    1],
  ];

  function pickTickStep(spanYears) {
    for (const [maxSpan, step] of TICK_CADENCES) {
      if (spanYears <= maxSpan) return step;
    }
    return TICK_CADENCES[0][1];
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
  let pickerEl    = null;     // <div> bottom-right dev scale-preset picker
  let pickerMenuEl = null;    // <div> the pop-up list
  let mounted     = false;

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

    // Vertical grid stripes — drawn FIRST (under everything else)
    // so the axis + ticks layer cleanly on top. Each visible tick
    // gets a faint full-height vertical line so the eye can read
    // which year any dot sits on without hover.
    gridGroupEl = document.createElementNS(NS, 'g');
    gridGroupEl.setAttribute('class', 'forge-timeline-grid');
    svgRoot.appendChild(gridGroupEl);

    axisLineEl = document.createElementNS(NS, 'line');
    axisLineEl.setAttribute('class', 'forge-timeline-axis');
    axisLineEl.setAttribute('stroke', 'rgba(212, 165, 90, 0.70)');
    axisLineEl.setAttribute('stroke-width', '1.5');
    svgRoot.appendChild(axisLineEl);

    tickGroupEl = document.createElementNS(NS, 'g');
    tickGroupEl.setAttribute('class', 'forge-timeline-ticks');
    svgRoot.appendChild(tickGroupEl);

    hostEl.appendChild(svgRoot);

    // Phase TL-2 Step 6b — bottom-right DEV scale-preset picker.
    // Small chip showing the active preset label + a chevron. Click
    // pops a list of registered presets. Picking one calls
    // setTimelineScalePreset() + _forge.relayout(). Hosted inline
    // here (not its own module) since it's chrome-lifecycle-tied —
    // mounts when timeline mounts, unmounts when it leaves.
    buildScalePicker();

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
    if (svgRoot && svgRoot.parentNode) svgRoot.parentNode.removeChild(svgRoot);
    if (pickerEl && pickerEl.parentNode) pickerEl.parentNode.removeChild(pickerEl);
    svgRoot = null; axisLineEl = null; tickGroupEl = null; gridGroupEl = null;
    pickerEl = null; pickerMenuEl = null;
    hostEl = null; camera = null; mode = null; xRange = null;
    mounted = false;
  }

  // ── SCALE PICKER (Phase TL-2 Step 6b, 2026-05-24) ────────
  // DEV-tagged bottom-right chip. Lets us swap scale-distribution
  // presets at runtime (linear, compressed, log, …) without
  // rebuilding the engine. Today only 'linear-default' is wired;
  // the slot exists for future experiments.
  function buildScalePicker() {
    if (!hostEl) return;
    const ENG = window.AtlasEngineLayout || {};
    if (typeof ENG.listTimelineScalePresets !== 'function') return;

    pickerEl = document.createElement('div');
    pickerEl.className = 'forge-timeline-scale-picker';
    pickerEl.setAttribute('role', 'button');
    pickerEl.setAttribute('aria-haspopup', 'listbox');
    pickerEl.setAttribute('aria-expanded', 'false');
    pickerEl.setAttribute('tabindex', '0');
    // Phase 22-F (2026-05-24) — match the .forge-zoom-gizmo /
    // .forge-bottom-search aesthetic exactly. Same background,
    // border, radius, font family, sizing — so the bottom-right
    // chip belongs to the same button family as the zoom % box,
    // the scrubber boxes, and the search input. No DEV tag.
    Object.assign(pickerEl.style, {
      position:      'absolute',
      right:         '14px',
      bottom:        '14px',
      display:       'flex',
      alignItems:    'center',
      gap:           '8px',
      padding:       '5px 10px',
      background:    'rgba(13, 17, 25, 0.85)',
      border:        '1px solid var(--border, #2a2e3a)',
      borderRadius: '4px',
      color:         'var(--gold, #d4a55a)',
      fontFamily:    'var(--mono, "JetBrains Mono", Menlo, monospace)',
      fontSize:      '11px',
      fontWeight:    '500',
      letterSpacing: '0.08em',
      cursor:        'pointer',
      pointerEvents: 'auto',
      zIndex:        '6',
      userSelect:    'none',
      lineHeight:    '1',
      height:        '24px',
      boxSizing:     'border-box',
      transition:    'border-color 100ms ease, color 100ms ease',
    });
    pickerEl.addEventListener('mouseenter', function () {
      pickerEl.style.borderColor = 'var(--gold-soft, rgba(212,165,90,0.45))';
    });
    pickerEl.addEventListener('mouseleave', function () {
      pickerEl.style.borderColor = 'var(--border, #2a2e3a)';
    });

    // Active preset label (no DEV tag).
    const label = document.createElement('span');
    label.className = '_label';
    pickerEl.appendChild(label);

    // Chevron — tiny gradient-triangle glyph, matches .app-pill caret.
    const chev = document.createElement('span');
    chev.textContent = '▾';
    chev.style.opacity = '0.7';
    chev.style.fontSize = '9px';
    pickerEl.appendChild(chev);

    hostEl.appendChild(pickerEl);
    refreshPickerLabel();

    pickerEl.addEventListener('click', togglePickerMenu);
    pickerEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePickerMenu(); }
      else if (e.key === 'Escape')             { closePickerMenu(); }
    });
  }

  function refreshPickerLabel() {
    if (!pickerEl) return;
    const ENG = window.AtlasEngineLayout || {};
    const id  = (typeof ENG.getTimelineScalePresetId === 'function') ? ENG.getTimelineScalePresetId() : '?';
    const list = (typeof ENG.listTimelineScalePresets === 'function') ? ENG.listTimelineScalePresets() : [];
    const active = list.find(function (p) { return p.id === id; });
    const lbl = pickerEl.querySelector('._label');
    if (lbl) lbl.textContent = (active && active.label) || id;
  }

  function togglePickerMenu() {
    if (pickerMenuEl) closePickerMenu();
    else              openPickerMenu();
  }

  function openPickerMenu() {
    if (!pickerEl || !hostEl) return;
    const ENG = window.AtlasEngineLayout || {};
    const list = (typeof ENG.listTimelineScalePresets === 'function') ? ENG.listTimelineScalePresets() : [];
    const activeId = (typeof ENG.getTimelineScalePresetId === 'function') ? ENG.getTimelineScalePresetId() : null;

    pickerMenuEl = document.createElement('div');
    pickerMenuEl.className = 'forge-timeline-scale-picker-menu';
    pickerMenuEl.setAttribute('role', 'listbox');
    // Phase 22-F (2026-05-24) — same dark-amber chrome family as
    // the chip + zoom gizmo + scrubber boxes.
    Object.assign(pickerMenuEl.style, {
      position:      'absolute',
      right:         '14px',
      bottom:        '46px',
      minWidth:      '260px',
      maxWidth:      '340px',
      padding:       '4px',
      background:    'rgba(13, 17, 25, 0.94)',
      border:        '1px solid var(--border, #2a2e3a)',
      borderRadius: '4px',
      color:         'var(--gold, #d4a55a)',
      fontFamily:    'var(--mono, "JetBrains Mono", Menlo, monospace)',
      fontSize:      '11px',
      letterSpacing: '0.05em',
      zIndex:        '7',
      pointerEvents: 'auto',
      boxShadow:     '0 8px 24px rgba(0,0,0,0.45)',
    });

    list.forEach(function (p) {
      const row = document.createElement('div');
      row.setAttribute('role', 'option');
      row.setAttribute('data-preset', p.id);
      row.setAttribute('aria-selected', p.id === activeId ? 'true' : 'false');
      Object.assign(row.style, {
        display:      'flex',
        flexDirection:'column',
        gap:          '2px',
        padding:      '8px 10px',
        borderRadius:'6px',
        cursor:       'pointer',
        background:   p.id === activeId ? 'rgba(212, 165, 90, 0.12)' : 'transparent',
        border:       '1px solid ' + (p.id === activeId ? 'rgba(212, 165, 90, 0.35)' : 'transparent'),
      });
      const top = document.createElement('span');
      top.textContent = p.label;
      top.style.textTransform = 'uppercase';
      top.style.letterSpacing = '0.10em';
      top.style.fontSize = '11px';
      row.appendChild(top);
      if (p.tagline) {
        const sub = document.createElement('span');
        sub.textContent = p.tagline;
        sub.style.opacity = '0.55';
        sub.style.fontSize = '10px';
        sub.style.textTransform = 'none';
        sub.style.letterSpacing = '0.02em';
        row.appendChild(sub);
      }
      row.addEventListener('mouseenter', function () { if (p.id !== activeId) row.style.background = 'rgba(212, 165, 90, 0.06)'; });
      row.addEventListener('mouseleave', function () { if (p.id !== activeId) row.style.background = 'transparent'; });
      row.addEventListener('click', function () { applyPresetPick(p.id); });
      pickerMenuEl.appendChild(row);
    });

    hostEl.appendChild(pickerMenuEl);
    pickerEl.setAttribute('aria-expanded', 'true');

    // Outside-click + Esc to close.
    setTimeout(function () { document.addEventListener('mousedown', _onOutsideClick, true); }, 0);
    document.addEventListener('keydown', _onMenuKey, true);
  }

  function closePickerMenu() {
    if (pickerMenuEl && pickerMenuEl.parentNode) pickerMenuEl.parentNode.removeChild(pickerMenuEl);
    pickerMenuEl = null;
    if (pickerEl) pickerEl.setAttribute('aria-expanded', 'false');
    document.removeEventListener('mousedown', _onOutsideClick, true);
    document.removeEventListener('keydown', _onMenuKey, true);
  }

  function _onOutsideClick(e) {
    if (!pickerMenuEl) return;
    if (pickerMenuEl.contains(e.target)) return;
    if (pickerEl && pickerEl.contains(e.target)) return;
    closePickerMenu();
  }
  function _onMenuKey(e) {
    if (e.key === 'Escape') closePickerMenu();
  }

  function applyPresetPick(id) {
    const ENG = window.AtlasEngineLayout || {};
    if (typeof ENG.setTimelineScalePreset !== 'function') return;
    const changed = ENG.setTimelineScalePreset(id);
    closePickerMenu();
    if (!changed) return;
    refreshPickerLabel();
    // Force a re-layout — preset state is read at layout time. The
    // _forge.relayout() helper exists for exactly this case (Phase
    // TL-2 Step 6b).
    if (window._forge && typeof window._forge.relayout === 'function') {
      window._forge.relayout();
    }
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

    // Axis line: extend slightly past the data range so the eye reads
    // it as continuous across the viewport. Use viewport width as a
    // ceiling so we don't draw out of bounds.
    const lineX0 = Math.max(0,    loScreen.x - 40);
    const lineX1 = Math.min(vp.w, hiScreen.x + 40);
    axisLineEl.setAttribute('x1', lineX0);
    axisLineEl.setAttribute('y1', axisY);
    axisLineEl.setAttribute('x2', lineX1);
    axisLineEl.setAttribute('y2', axisY);

    // Compute tick cadence from the VISIBLE year span (not the full
    // dataset). At deep zoom, the visible span shrinks → finer ticks.
    const visLoYear = window.AtlasEngineLayout.timelineWorldXToYear(
      camera.screenToWorld(0, axisY, vp).x, xRange);
    const visHiYear = window.AtlasEngineLayout.timelineWorldXToYear(
      camera.screenToWorld(vp.w, axisY, vp).x, xRange);
    const visSpan = Math.max(1, visHiYear - visLoYear);
    const tickStep = pickTickStep(visSpan);

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
      grid.setAttribute('stroke', emphasized ? 'rgba(212,165,90,0.16)' : 'rgba(212,165,90,0.10)');
      grid.setAttribute('stroke-width', '1');
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
        // Pivot grid stripe — brighter + wider than peer ticks.
        const grid0 = document.createElementNS(NS, 'line');
        grid0.setAttribute('x1', sp0.x); grid0.setAttribute('x2', sp0.x);
        grid0.setAttribute('y1', 0);     grid0.setAttribute('y2', vp.h);
        grid0.setAttribute('stroke', 'rgba(212, 165, 90, 0.34)');
        grid0.setAttribute('stroke-width', '1.5');
        gridGroupEl.appendChild(grid0);

        // Tick mark — taller than emphasized peers.
        const tick0 = document.createElementNS(NS, 'line');
        tick0.setAttribute('x1', sp0.x);
        tick0.setAttribute('y1', axisY - 12);
        tick0.setAttribute('x2', sp0.x);
        tick0.setAttribute('y2', axisY + 12);
        tick0.setAttribute('stroke', 'rgba(245, 220, 160, 1.0)');
        tick0.setAttribute('stroke-width', '1.8');
        tickGroupEl.appendChild(tick0);

        // Label — heavier weight + slightly larger, bright gold.
        const lbl0 = document.createElementNS(NS, 'text');
        lbl0.setAttribute('x', sp0.x);
        lbl0.setAttribute('y', axisY - 18);
        lbl0.setAttribute('text-anchor', 'middle');
        lbl0.setAttribute('class', 'forge-timeline-year-label forge-timeline-year-zero');
        lbl0.style.fill          = 'rgba(245, 220, 160, 1.0)';
        lbl0.style.fontFamily    = 'var(--mono, "JetBrains Mono", Menlo, monospace)';
        lbl0.style.fontSize      = '12px';
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
  };
})();
