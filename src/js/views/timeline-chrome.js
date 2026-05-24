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
    svgRoot = null; axisLineEl = null; tickGroupEl = null; gridGroupEl = null;
    hostEl = null; camera = null; mode = null; xRange = null;
    mounted = false;
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

    // Phase TL-2 Step 5 (2026-05-24) — major / minor tick split.
    // Every Nth tick is MAJOR (bright label + extended vertical
    // grid stripe full-viewport-height); the rest are MINOR
    // (smaller tick mark + dimmer label or no label). N is chosen
    // so the major cadence reads at ~5x the minor.
    const majorEvery = (tickStep >= 5000) ? 2
                     : (tickStep >= 1000) ? 5
                     : (tickStep >= 100)  ? 5
                     : (tickStep >= 10)   ? 5
                     : 5;
    // Render grid stripes + ticks. Clear + rebuild — typical zoom
    // levels show ~10–30 ticks, so the full rebuild per frame is
    // cheap (well under 1 ms).
    while (gridGroupEl.firstChild) gridGroupEl.removeChild(gridGroupEl.firstChild);
    while (tickGroupEl.firstChild) tickGroupEl.removeChild(tickGroupEl.firstChild);
    for (let yr = firstTick; yr <= visHiYear; yr += tickStep) {
      const wx = yToX(yr, xRange);
      const sp = camera.worldToScreen(wx, 0, vp);
      // Off-screen guards (margin so near-edge labels still draw).
      if (sp.x < -80 || sp.x > vp.w + 80) continue;
      const isMajor = (yr % (tickStep * majorEvery) === 0);

      // Faint vertical grid stripe (full viewport height). Major
      // gets a slightly brighter line so the eye snaps to it.
      const grid = document.createElementNS(NS, 'line');
      grid.setAttribute('x1', sp.x); grid.setAttribute('x2', sp.x);
      grid.setAttribute('y1', 0);    grid.setAttribute('y2', vp.h);
      grid.setAttribute('stroke', isMajor ? 'rgba(212,165,90,0.10)' : 'rgba(212,165,90,0.04)');
      grid.setAttribute('stroke-width', '1');
      gridGroupEl.appendChild(grid);

      // Tick mark on the axis. Major ticks are taller + brighter.
      const tickHalf = isMajor ? 8 : 4;
      const tick = document.createElementNS(NS, 'line');
      tick.setAttribute('x1', sp.x);
      tick.setAttribute('y1', axisY - tickHalf);
      tick.setAttribute('x2', sp.x);
      tick.setAttribute('y2', axisY + tickHalf);
      tick.setAttribute('stroke', isMajor ? 'rgba(232,200,137,0.95)' : 'rgba(212,165,90,0.55)');
      tick.setAttribute('stroke-width', isMajor ? '1.5' : '1');
      tickGroupEl.appendChild(tick);

      // Year label. Major = bigger + brighter; minor = smaller + dimmer.
      const label = document.createElementNS(NS, 'text');
      label.setAttribute('x', sp.x);
      label.setAttribute('y', axisY - (isMajor ? 14 : 10));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'forge-timeline-year-label' + (isMajor ? ' is-major' : ''));
      label.style.fill          = isMajor ? 'rgba(232,200,137,0.95)' : 'rgba(212,165,90,0.55)';
      label.style.fontFamily    = 'var(--mono, "JetBrains Mono", Menlo, monospace)';
      label.style.fontSize      = isMajor ? '12px' : '10px';
      label.style.fontWeight    = isMajor ? '600'  : '400';
      label.style.letterSpacing = '0.10em';
      label.style.textTransform = 'uppercase';
      label.textContent = formatYear(yr);
      tickGroupEl.appendChild(label);
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
