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

  // ════════════════════════════════════════════════════════════
  // CALENDAR REGISTRY (Phase 22-AE, 2026-05-24)
  // ────────────────────────────────────────────────────────────
  // Each calendar exposes:
  //   id      — short LS-safe key
  //   label   — full display name for the picker
  //   short   — 3-4 char display label for the chip (e.g. "GREG")
  //   suffix  — usually the year-suffix the calendar prints
  //   format  — function(yearGregorian) → display string
  // Active calendar persists in localStorage; tick labels and the
  // YR-0 pivot route through it. Math is approximate for non-
  // Gregorian (Hijri lunar offset rounded, Hebrew ignores Rosh
  // Hashanah split) — sufficient for timeline tick display.
  // Mayan Long Count + Chinese Sexagenary deferred.
  // ════════════════════════════════════════════════════════════
  // Each calendar exposes:
  //   id, label, short, format(y)
  //   epochGregYear — Gregorian year that equals THAT calendar's
  //   year 1 / year 0 (whichever the calendar treats as the
  //   meaningful origin). The pivot tick + zero-label move to
  //   this Gregorian year when the calendar is active, so the
  //   user sees the founding moment of their chosen system as
  //   the "year 0" mark on the timeline.
  // Phase 22-AF (2026-05-24) — registry expanded to cover most
  // atlas-relevant traditions: Mayan Long Count, Egyptian Civil
  // (Sothic), Greek Olympiad, Roman Ab Urbe Condita, Buddhist
  // Era, Holocene Era. Chinese sexagenary cycle deferred (needs
  // cyclic anchoring — not a monotonic counter).
  const CALENDARS = {
    gregorian: {
      id: 'gregorian', label: 'Gregorian', short: 'GREG',
      epochGregYear: 0,
      tip: 'Solar, 365.2425 days/year. Modern civil calendar adopted 1582 (papal reform of Julian). Year-0 marks the BCE/CE pivot.',
      format: function (y) {
        if (y === 0) return '0';
        if (y < 0) return Math.abs(y) + ' BCE';
        return y + ' CE';
      },
    },
    hebrew: {
      id: 'hebrew', label: 'Hebrew (Anno Mundi)', short: 'HEB',
      epochGregYear: -3760,
      tip: 'Lunisolar. Year 1 AM = 3761 BCE — counted from the rabbinic date of creation. Months start at the new moon; intercalated to keep Pesach in spring.',
      format: function (y) {
        const am = y + 3761;
        return am.toLocaleString('en-US') + ' AM';
      },
    },
    hijri: {
      id: 'hijri', label: 'Islamic (Hijri)', short: 'HIJ',
      epochGregYear: 622,
      tip: 'Purely lunar, 12 months × ~29.5 days = ~354 days/year. Year 1 AH = 622 CE (Muhammad\'s migration from Mecca to Medina). Drifts ~11 days/year vs solar.',
      format: function (y) {
        const ah = Math.round((y - 622) * 33 / 32);
        if (ah === 0) return '0 AH';
        if (ah < 0) return Math.abs(ah) + ' BH';
        return ah + ' AH';
      },
    },
    jalali: {
      id: 'jalali', label: 'Iranian (Jalali)', short: 'AP',
      epochGregYear: 622,
      tip: 'Solar Hijri. Omar Khayyam-era (1079 CE) calendar, more accurate than Gregorian. Year starts at March equinox; Year 1 AP = 622 CE.',
      format: function (y) {
        const ap = y - 621;
        if (ap === 0) return '0 AP';
        if (ap < 0) return Math.abs(ap) + ' BP';
        return ap + ' AP';
      },
    },
    ethiopian: {
      id: 'ethiopian', label: 'Ethiopian (Geez)', short: 'EC',
      epochGregYear: 8,
      tip: 'Solar, 13 months (12 × 30 days + a 5/6-day epagomenal month). Runs ~7–8 years behind Gregorian. Still the civil calendar of Ethiopia + Eritrea.',
      format: function (y) {
        const ec = y - 8;
        if (ec === 0) return '0 EC';
        if (ec < 0) return Math.abs(ec) + ' BEC';
        return ec + ' EC';
      },
    },
    mayan: {
      id: 'mayan', label: 'Mayan Long Count', short: 'MAY',
      tip: 'Vigesimal day-counter (baktun.katun.tun.uinal.kin). Epoch = 11 Aug 3114 BCE. Day 13.0.0.0.0 (current era end) fell on 21 Dec 2012. Used alongside Tzolkin + Haab ritual cycles.',
      // Long-count epoch = 11 Aug 3114 BCE = year −3113 (proleptic).
      epochGregYear: -3113,
      // Show baktun.katun.tun derived from days-since-epoch / 360.
      // Tropical-year approximation 365.2425. Adequate for tick
      // labels at year resolution (kin/uinal day-level precision
      // not useful on a 11k-year spine).
      format: function (y) {
        const yearsSince = y - (-3113);
        const tunTotal = Math.floor(yearsSince * 365.2425 / 360);
        if (tunTotal < 0) {
          return '−' + Math.abs(tunTotal) + ' tun';   // pre-epoch
        }
        const baktun = Math.floor(tunTotal / 400);
        const katun  = Math.floor((tunTotal % 400) / 20);
        const tun    = tunTotal % 20;
        return baktun + '.' + katun + '.' + tun;
      },
    },
    egyptian: {
      id: 'egyptian', label: 'Egyptian Civil', short: 'EGY',
      epochGregYear: -2781,
      tip: 'Civil calendar: 12 months × 30 days + 5 epagomenal days = 365 (no leap). Drifts 1 day every 4 years vs the Sothic year. Used continuously ~2700 BCE → Roman era.',
      format: function (y) {
        const ec = y - (-2781);
        return ec + ' EgC';
      },
    },
    olympiad: {
      id: 'olympiad', label: 'Greek (Olympiad)', short: 'OLY',
      epochGregYear: -775,
      tip: 'Greek historiographic timekeeping. Olympiad 1, Year 1 = 776 BCE (first Olympic Games). Format: Oly N.Y where Y = 1–4 within the 4-year cycle. Used by Diodorus, Eusebius et al.',
      format: function (y) {
        const offs = y - (-776);
        const ol  = Math.floor(offs / 4) + 1;
        const yr  = (offs % 4 + 4) % 4 + 1;
        if (ol < 1) return 'pre-Oly ' + (-ol + 1);
        return 'Oly ' + ol + '.' + yr;
      },
    },
    auc: {
      id: 'auc', label: 'Roman (Ab Urbe Condita)', short: 'AUC',
      epochGregYear: -752,
      tip: '"From the founding of the city" of Rome. Year 1 AUC = 753 BCE (Varro reckoning, used by Livy + Plutarch). Year 2776 AUC = 2024 CE.',
      format: function (y) {
        const auc = y + 753;
        if (auc <= 0) return Math.abs(auc - 1) + ' pre-AUC';
        return auc + ' AUC';
      },
    },
    buddhist: {
      id: 'buddhist', label: 'Buddhist Era', short: 'BE',
      epochGregYear: -543,
      tip: 'Anchored to the Buddha\'s parinirvana. Theravada places Year 1 BE = 544 BCE. Current civil calendar in Thailand, Sri Lanka, Cambodia, Laos, Myanmar.',
      format: function (y) {
        const be = y + 544;
        if (be <= 0) return Math.abs(be - 1) + ' pre-BE';
        return be + ' BE';
      },
    },
    bahai: {
      id: 'bahai', label: 'Baháʼí (Badíʿ)', short: 'BBE',
      epochGregYear: 1844,
      tip: 'Badíʿ ("Wondrous") calendar. Year 1 = 1844 CE (the Báb\'s declaration). 19 months × 19 days + 4–5 intercalary days. Year starts at March equinox.',
      format: function (y) {
        const b = y - 1843;
        if (b <= 0) return Math.abs(b - 1) + ' pre-Baháʼí';
        return b + ' BBE';
      },
    },
    holocene: {
      id: 'holocene', label: 'Holocene Era', short: 'HE',
      epochGregYear: -9999,
      tip: 'Cesare Emiliani 1993 proposal. Same year-length as Gregorian, shifted +10,000: Year 1 HE = 10000 BCE (rough start of Holocene + agriculture). Removes negative dates from prehistory.',
      format: function (y) {
        const he = y + 10000;
        return he + ' HE';
      },
    },
  };

  const LS_CALENDAR = 'codex_atlas_timeline_calendar';
  let _activeCalendarId = 'gregorian';
  try {
    const raw = localStorage.getItem(LS_CALENDAR);
    if (raw && CALENDARS[raw]) _activeCalendarId = raw;
  } catch (_) {}

  function setActiveCalendar(id) {
    if (!CALENDARS[id]) return false;
    if (id === _activeCalendarId) return false;
    _activeCalendarId = id;
    try { localStorage.setItem(LS_CALENDAR, id); } catch (_) {}
    scheduleRefresh();   // redraw all ticks + labels
    return true;
  }
  function getActiveCalendarId() { return _activeCalendarId; }
  function listCalendars() {
    return Object.values(CALENDARS).map(function (c) {
      return { id: c.id, label: c.label, short: c.short, tip: c.tip || '' };
    });
  }

  // Year → display label. Routes through the active calendar.
  // Gregorian (default) preserves the original "BCE / CE / 0" rule.
  function formatYear(year) {
    const cal = CALENDARS[_activeCalendarId] || CALENDARS.gregorian;
    try { return cal.format(year); } catch (_) { return String(year); }
  }

  // ── DOM ──────────────────────────────────────────────────
  let svgRoot     = null;     // <svg> overlay
  let axisLineEl  = null;     // <line> the 1 px stroke
  let tickGroupEl = null;     // <g> container for ticks + labels
  let gridGroupEl = null;     // <g> container for faint vertical grid stripes
  let bandGroupEl = null;     // <g> family band rectangles (bottom-most layer)
  let bandLabelGroupEl = null;// <g> family labels — anchored to screen-left
  // Phase 22-AD (2026-05-24) — Bottombar toolbar lives in HTML;
  // density forked into its own persistent vertical slider. JS
  // only wires events on declarative DOM here.
  let toolbarEl    = null;    // <div#forge-bottombar-timeline> — bottombar right segment
  let vdensityEl   = null;    // <div#forge-tl-vdensity> — persistent vertical slider
  let vdensityRafId= 0;       // rAF coalesce for relayout on slider drag
  let densityVal   = 1.0;     // current band-density scalar (mirrors LS)
  // 2026-05-26 — zoom↔density LOCK system removed (rarely used).
  // The readout is now a click-to-reset button (was a separate div +
  // dblclick). See wireVDensity() below.
  let mounted      = false;

  // localStorage key for persisting the band-density preference.
  // Phase 22-K → 22-N (2026-05-24) — v3 because base band heights
  // got another ×1.3 multiplier. Old saved 1.3× = new 1.3× would
  // compound to ~1.69× of new default → restart at 1×.
  // Phase 22-AF (2026-05-24) — v4 because BAND_H_BASE got another
  // ×1.3 bake. Old 1.0 saved value × new 1.3× baseline would feel
  // identical to before; we want the user to see the NEW default
  // unless they've explicitly chosen something else.
  const LS_BAND_SCALE = 'codex_atlas_timeline_band_scale_v4';

  // ── BAND STYLE STATE (Phase 22-I, 2026-05-24) ────────────
  // Live-tunable via the STYLE panel's "Timeline bands" + "Family
  // labels" sections. Reads applied on every refresh() call.
  // Persists to localStorage.
  // Phase 22-AE (2026-05-24) — v3: BAKED defaults from John's
  // tuned values (screenshot 2026-05-24 evening). Subtler bands,
  // gentler YR-0 pivot. Bump = LS flush so returning users pick
  // up the new defaults.
  const LS_BAND_STYLE = 'codex_atlas_timeline_band_style_v3';
  const BAND_STYLE_DEFAULTS = {
    fillAlpha:    0.02,   // was 0.18 — bands now barely tinted
    strokeAlpha:  0.25,   // was 0.60 — band edges much fainter
    strokeWidth:  0.5,    // was 1.0  — hairline band edges
    labelOpacity: 0.85,
    labelSize:    11,    // px
    // Phase 22-K (2026-05-24) — axis + grid line controls.
    axisOpacity:  0.70,
    axisWidth:    1.5,
    gridOpacity:  0.10,
    gridWidth:    1.0,
    // Phase 22-M / 22-AE — YR 0 pivot marker style.
    yr0Opacity:   0.75,   // was 1.0  — pivot less shouty
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
      // Phase 22-AD (2026-05-24) — re-sync toolbar + vdensity state.
      if (toolbarEl && typeof toolbarEl._renderPresets === 'function') {
        try { toolbarEl._renderPresets(); } catch (_) {}
      }
      if (vdensityEl) {
        const ENG = window.AtlasEngineLayout || {};
        if (typeof ENG.getTimelineBandHeightScale === 'function') {
          densityVal = ENG.getTimelineBandHeightScale();
          syncVDensity();
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
    if (vdensityRafId) { cancelAnimationFrame(vdensityRafId); vdensityRafId = 0; }
    // Toolbar + vdensity live in declarative HTML; only events detach.
    if (toolbarEl && typeof toolbarEl._cleanup === 'function') {
      try { toolbarEl._cleanup(); } catch (_) {}
    }
    if (vdensityEl && typeof vdensityEl._cleanup === 'function') {
      try { vdensityEl._cleanup(); } catch (_) {}
    }
    // Restore the wheel's hull-overlay opacity ownership on unmount.
    const hullOverlayEl = document.querySelector('.forge-hulls-overlay');
    if (hullOverlayEl) hullOverlayEl.style.opacity = '';
    if (svgRoot && svgRoot.parentNode) svgRoot.parentNode.removeChild(svgRoot);
    svgRoot = null; axisLineEl = null; tickGroupEl = null; gridGroupEl = null;
    bandGroupEl = null; bandLabelGroupEl = null;
    toolbarEl = null; vdensityEl = null;
    hostEl = null; camera = null; mode = null; xRange = null;
    mounted = false;
  }

  // ── BOTTOMBAR + VDENSITY WIRING (Phase 22-AD, 2026-05-24) ─
  // The TIMELINE bottom-right segment + the vertical density
  // slider are both DECLARED in `forge.js` bottombar template
  // (HTML in app.css-owned classes). This module ONLY wires
  // event handlers + state sync. NO DOM creation here.
  // SEVERITY DOGMA compliance (HOW-WE-WORK §5.7).
  function buildBottomToolbar() {
    const ENG = window.AtlasEngineLayout || {};
    if (typeof ENG.setTimelineScalePreset !== 'function') return;

    toolbarEl = document.getElementById('forge-bottombar-timeline');
    if (!toolbarEl) return;

    // ─── Preset segments (LIN / LOG / CMP) via delegation ──
    function syncPresetActive() {
      const activeId = (typeof ENG.getTimelineScalePresetId === 'function')
        ? ENG.getTimelineScalePresetId() : 'linear-default';
      toolbarEl.querySelectorAll('button[data-tl-preset]').forEach(function (b) {
        b.setAttribute('aria-pressed', (b.getAttribute('data-tl-preset') === activeId) ? 'true' : 'false');
      });
    }
    function onPresetClick(e) {
      const b = e.target.closest('button[data-tl-preset]');
      if (!b || !toolbarEl.contains(b)) return;
      const id = b.getAttribute('data-tl-preset');
      const changed = ENG.setTimelineScalePreset(id);
      syncPresetActive();
      if (changed && window._forge && typeof window._forge.relayout === 'function') {
        window._forge.relayout();
      }
    }
    toolbarEl.addEventListener('click', onPresetClick);
    syncPresetActive();
    toolbarEl._renderPresets = syncPresetActive;

    // ─── DATE IN / DATE OUT / FOCUS button group ────────────
    const inEl   = document.getElementById('forge-tl-focus-in');
    const outEl  = document.getElementById('forge-tl-focus-out');
    const goBtn  = document.getElementById('forge-tl-focus-go');
    function parseYear(s) {
      if (!s) return null;
      s = String(s).trim();
      if (!s) return null;
      // Accept: "1500", "-3000", "1500 CE", "3000 BCE", "0".
      let m = s.match(/^(-?\d+)\s*(BCE|BC|CE|AD)?\s*$/i);
      if (!m) return null;
      let y = parseInt(m[1], 10);
      const tag = (m[2] || '').toUpperCase();
      if (tag === 'BCE' || tag === 'BC') y = -Math.abs(y);
      return isFinite(y) ? y : null;
    }
    function applyFocus() {
      const lo = parseYear(inEl  && inEl.value);
      const hi = parseYear(outEl && outEl.value);
      if (lo == null || hi == null) {
        if (inEl)  inEl.style.borderColor  = (lo == null ? '#7a2a2a' : '');
        if (outEl) outEl.style.borderColor = (hi == null ? '#7a2a2a' : '');
        return;
      }
      if (inEl)  inEl.style.borderColor  = '';
      if (outEl) outEl.style.borderColor = '';
      const a = Math.min(lo, hi), b = Math.max(lo, hi);
      if (window._forge && typeof window._forge.focusTimelineRange === 'function') {
        window._forge.focusTimelineRange(a, b);
      }
    }
    if (goBtn) goBtn.addEventListener('click', applyFocus);
    function onFocusKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); applyFocus(); }
    }
    if (inEl)  inEl.addEventListener('keydown',  onFocusKey);
    if (outEl) outEl.addEventListener('keydown', onFocusKey);

    // ─── Vertical density slider (persistent primitive) ─────
    vdensityEl = document.getElementById('forge-tl-vdensity');
    if (vdensityEl && typeof ENG.getTimelineBandHeightScale === 'function') {
      hydrateBandScaleFromLS();
      wireVDensity(vdensityEl);
    }

    // 2026-05-26 — LOCK toggle removed. Density-reset moved into the
    // readout-button at the bottom of the slider (wired in
    // wireVDensity()).

    // ─── CALENDAR popup button ──────────────────────────────
    const calBtn = document.getElementById('forge-tl-cal-btn');
    function syncCalLabel() {
      if (!calBtn) return;
      const v = calBtn.querySelector('.forge-tl-cal-val');
      const cur = CALENDARS[_activeCalendarId] || CALENDARS.gregorian;
      if (v) v.textContent = cur.short;
    }
    syncCalLabel();
    function onCalClick(e) {
      e.preventDefault(); e.stopPropagation();
      if (document.getElementById('forge-tl-cal-pop')) closeCalPop();
      else                                            openCalPop();
    }
    if (calBtn) calBtn.addEventListener('click', onCalClick);

    // Outside-click + Esc close (covers cal popup too).
    const onCalOutside = function (e) {
      const pop = document.getElementById('forge-tl-cal-pop');
      if (!pop) return;
      if (pop.contains(e.target)) return;
      if (calBtn && calBtn.contains(e.target)) return;
      closeCalPop();
    };
    const onCalEsc = function (e) {
      if (e.key === 'Escape') closeCalPop();
    };
    document.addEventListener('mousedown', onCalOutside, true);
    document.addEventListener('keydown', onCalEsc, true);

    // Phase 22-AG (2026-05-24) — 500 ms dwell tooltip on row hover.
    // Single tooltip element re-used across rows. Re-positions to
    // the hovered row's top-right. Cleared on mouseleave + popup
    // close. The text comes from CALENDARS[id].tip.
    let _calTipEl = null;
    let _calTipTimer = 0;
    function clearCalTip() {
      if (_calTipTimer) { clearTimeout(_calTipTimer); _calTipTimer = 0; }
      if (_calTipEl && _calTipEl.parentNode) _calTipEl.parentNode.removeChild(_calTipEl);
      _calTipEl = null;
    }
    function showCalTip(rowEl, calObj) {
      if (!rowEl || !calObj || !calObj.tip) return;
      clearCalTip();
      const stageEl = rowEl.closest('.forge-stage') || document.body;
      _calTipEl = document.createElement('div');
      _calTipEl.className = 'forge-tl-cal-tip';
      _calTipEl.innerHTML =
        '<div class="forge-tl-cal-tip-title">' + calObj.label + '</div>' +
        '<div class="forge-tl-cal-tip-body">' + calObj.tip + '</div>';
      // Position: to the LEFT of the popup row (popup is on the
      // right edge; tooltip drops left so it doesn't go off-screen).
      const rRow = rowEl.getBoundingClientRect();
      const rStage = stageEl.getBoundingClientRect();
      _calTipEl.style.position = 'absolute';
      _calTipEl.style.right    = (rStage.right - rRow.left + 10) + 'px';
      _calTipEl.style.top      = (rRow.top - rStage.top - 2)     + 'px';
      stageEl.appendChild(_calTipEl);
    }

    function openCalPop() {
      if (!calBtn) return;
      const stageEl = calBtn.closest('.forge-stage') || document.body;
      const pop = document.createElement('div');
      pop.className = 'forge-tl-cal-pop is-open';
      pop.id = 'forge-tl-cal-pop';
      listCalendars().forEach(function (c) {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'forge-tl-cal-row';
        row.setAttribute('data-cal', c.id);
        row.setAttribute('aria-pressed', (c.id === _activeCalendarId) ? 'true' : 'false');
        row.innerHTML =
          '<span class="forge-tl-cal-row-short">' + c.short + '</span>' +
          '<span class="forge-tl-cal-row-label">' + c.label + '</span>';
        row.addEventListener('click', function () {
          if (setActiveCalendar(c.id)) {
            syncCalLabel();
          }
          clearCalTip();
          closeCalPop();
        });
        // 500 ms dwell tooltip.
        row.addEventListener('mouseenter', function () {
          if (_calTipTimer) clearTimeout(_calTipTimer);
          _calTipTimer = setTimeout(function () {
            _calTipTimer = 0;
            showCalTip(row, CALENDARS[c.id]);
          }, 500);
        });
        row.addEventListener('mouseleave', function () {
          if (_calTipTimer) { clearTimeout(_calTipTimer); _calTipTimer = 0; }
          clearCalTip();
        });
        pop.appendChild(row);
      });
      stageEl.appendChild(pop);
      if (calBtn) calBtn.setAttribute('aria-expanded', 'true');
    }
    function closeCalPop() {
      const pop = document.getElementById('forge-tl-cal-pop');
      if (pop && pop.parentNode) pop.parentNode.removeChild(pop);
      clearCalTip();
      if (calBtn) calBtn.setAttribute('aria-expanded', 'false');
    }

    toolbarEl._cleanup = function () {
      toolbarEl.removeEventListener('click', onPresetClick);
      if (goBtn) goBtn.removeEventListener('click', applyFocus);
      if (inEl)  inEl.removeEventListener('keydown',  onFocusKey);
      if (outEl) outEl.removeEventListener('keydown', onFocusKey);
      if (calBtn) calBtn.removeEventListener('click', onCalClick);
      document.removeEventListener('mousedown', onCalOutside, true);
      document.removeEventListener('keydown', onCalEsc, true);
      closeCalPop();
    };
  }

  // ── VERTICAL DENSITY SLIDER (Phase 22-AD, 2026-05-24) ───
  // Pointer-event driven. Track + thumb live in declarative HTML
  // (`#forge-tl-vdensity`), this just wires drag → value.
  function wireVDensity(rootEl) {
    const ENG = window.AtlasEngineLayout || {};
    const bounds = ENG.timelineBandScaleBounds || { min: 0.3, max: 3.0 };
    const trackEl  = rootEl.querySelector('#forge-tl-vdensity-track');
    const thumbEl  = rootEl.querySelector('#forge-tl-vdensity-thumb');
    const readoutEl= rootEl.querySelector('#forge-tl-vdensity-readout');
    if (!trackEl || !thumbEl || !readoutEl) return;

    densityVal = ENG.getTimelineBandHeightScale();
    syncVDensity();

    function clientYToValue(clientY) {
      const r = trackEl.getBoundingClientRect();
      if (r.height <= 0) return densityVal;
      // top of track = max, bottom = min (drag UP = expand).
      const t = 1 - Math.max(0, Math.min(1, (clientY - r.top) / r.height));
      return bounds.min + t * (bounds.max - bounds.min);
    }
    function snap(v) { return Math.round(v / 0.05) * 0.05; }
    let dragging = false;
    function onPointerDown(e) {
      e.preventDefault();
      dragging = true;
      thumbEl.style.cursor = 'grabbing';
      try { thumbEl.setPointerCapture && e.pointerId != null && thumbEl.setPointerCapture(e.pointerId); } catch(_){}
      applyDensityValue(snap(clientYToValue(e.clientY)));
    }
    function onPointerMove(e) {
      if (!dragging) return;
      e.preventDefault();
      applyDensityValue(snap(clientYToValue(e.clientY)));
    }
    function onPointerUp(e) {
      if (!dragging) return;
      dragging = false;
      thumbEl.style.cursor = 'grab';
      try { thumbEl.releasePointerCapture && e.pointerId != null && thumbEl.releasePointerCapture(e.pointerId); } catch(_){}
    }
    trackEl.addEventListener('pointerdown', onPointerDown);
    thumbEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup',   onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    // 2026-05-26 — readout is now a <button>; single click resets
    // density to 1.0× (was dblclick on a div). Matches the button
    // affordance + replaces the LOCK toggle that used to sit here.
    readoutEl.addEventListener('click', function () { applyDensityValue(1.0); });
    // Stash cleanup
    rootEl._cleanup = function () {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup',   onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }

  // 2026-05-26 — applyZoomDrivenDensity() + LOCK system removed.

  function syncVDensity() {
    if (!vdensityEl) return;
    const bounds = (window.AtlasEngineLayout && window.AtlasEngineLayout.timelineBandScaleBounds) || { min: 0.3, max: 3.0 };
    const t = (densityVal - bounds.min) / (bounds.max - bounds.min);   // 0..1
    const thumbEl   = vdensityEl.querySelector('#forge-tl-vdensity-thumb');
    const readoutEl = vdensityEl.querySelector('#forge-tl-vdensity-readout');
    if (thumbEl)   thumbEl.style.top = ((1 - t) * 100).toFixed(2) + '%';
    if (readoutEl) readoutEl.textContent = formatBandScale(densityVal);
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

  function applyDensityValue(v) {
    if (!isFinite(v)) return;
    const ENG = window.AtlasEngineLayout || {};
    const bounds = (ENG && ENG.timelineBandScaleBounds) || { min: 0.3, max: 3.0 };
    const clamped = Math.max(bounds.min, Math.min(bounds.max, v));
    densityVal = clamped;
    syncVDensity();
    try { localStorage.setItem(LS_BAND_SCALE, String(clamped)); } catch (_) {}
    const changed = (typeof ENG.setTimelineBandHeightScale === 'function')
      && ENG.setTimelineBandHeightScale(clamped);
    if (!changed) return;
    if (vdensityRafId) return;
    vdensityRafId = requestAnimationFrame(function () {
      vdensityRafId = 0;
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

    // 2026-05-26 — LOCK propagation removed (system retired).

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
    // Phase 22-AG (2026-05-24) — TWO PIVOT TIERS:
    //   PRIMARY  = Gregorian year 0 (ALWAYS rendered, regardless
    //              of active calendar). John: "preserve the Greg 0
    //              as a common reference to the entire world to
    //              understand the difference."
    //   SECONDARY = active calendar's own epoch (rendered ONLY
    //              when the active calendar is non-Gregorian, with
    //              a lower-emphasis style — gold-soft, smaller).
    // Both display labels through formatYear() so each pivot shows
    // its respective year-in-calendar text.
    const _activeCal = CALENDARS[_activeCalendarId] || CALENDARS.gregorian;
    const _epochYear = (typeof _activeCal.epochGregYear === 'number') ? _activeCal.epochGregYear : 0;
    const Y0_LO = xRange.lo, Y0_HI = xRange.hi;
    const renderGregPivot  = (0 >= Y0_LO && 0 <= Y0_HI);                       // always-on Greg anchor
    const renderEpochPivot = (_epochYear !== 0) && (_epochYear >= Y0_LO && _epochYear <= Y0_HI);
    // Backwards-compat alias — older code paths still reference these.
    const _pivotYear = 0;
    const renderYearZeroSeparately = renderGregPivot;

    // Phase 22-AD (2026-05-24) — LABEL COLLISION DETECTION.
    // Tick MARKS always render (so the user has a visual scale),
    // but LABELS skip if they'd overlap the last-drawn label.
    // Estimate width from char count × ~7px/char at 11px mono +
    // a 10px breathing-gap on each side. Track the right-edge
    // of the last drawn label; if next label's left-edge collides,
    // skip the label (keep the tick mark). The non-log presets
    // produce evenly-spaced ticks so this is monotonic L→R.
    // Phase 22-AG (2026-05-24) — COLLISION RESERVATION.
    // Both pivots (Greg-0 always; calendar epoch when non-Greg)
    // reserve their visual slot UP FRONT so loop ticks that would
    // collide with them are skipped. Build a sorted list of
    // [leftEdge, rightEdge] reservation intervals; the loop walks
    // L→R and tests against the next reservation. Fixes the user-
    // visible "YR 0 trampled by 250 BCE at wide zoom" bug.
    function estLabelWidth(text) {
      return Math.max(20, text.length * 7) + 10;
    }
    const _reservedSlots = [];
    if (renderGregPivot) {
      const sx = camera.worldToScreen(yToX(0, xRange), 0, vp).x;
      const w  = estLabelWidth(CALENDARS.gregorian.format(0));
      _reservedSlots.push({ leftX: sx - w/2 - 4, rightX: sx + w/2 + 4, pivotYear: 0 });
    }
    if (renderEpochPivot) {
      const sx = camera.worldToScreen(yToX(_epochYear, xRange), 0, vp).x;
      const w  = estLabelWidth(formatYear(_epochYear));
      _reservedSlots.push({ leftX: sx - w/2 - 4, rightX: sx + w/2 + 4, pivotYear: _epochYear });
    }
    _reservedSlots.sort(function (a, b) { return a.leftX - b.leftX; });
    function collidesWithReservedSlot(leftX, rightX) {
      for (let i = 0; i < _reservedSlots.length; i++) {
        const s = _reservedSlots[i];
        if (rightX < s.leftX) return false;        // labels are sorted L→R; safe to short-circuit
        if (leftX  > s.rightX) continue;
        return true;
      }
      return false;
    }
    let lastLabelRight = -Infinity;

    // Phase 22-AH (2026-05-25) — audit A: universal label cap.
    // Per-frame ceiling so DOM ops + main-thread cost stay bounded
    // regardless of zoom level or visible span. 120 is the same
    // ceiling the wheel's `label_cap` uses comfortably. Tick MARKS
    // still draw without limit — only the text labels cap.
    const TICK_LABEL_CAP = 120;
    let _labelsRendered = 0;
    for (let yr = tickLo; yr <= tickHi; yr += tickStep) {
      // Phase 22-AG (2026-05-24) — skip ticks that coincide with
      // EITHER pivot (Greg 0 always; calendar epoch when non-Greg).
      if (renderGregPivot  && yr === 0)            continue;
      if (renderEpochPivot && yr === _epochYear)   continue;
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

      // Year label — uniform style. Collision rules (Phase 22-AG):
      //   - skip if would overlap the previously-drawn label
      //   - skip if would overlap a reserved pivot slot (Greg-0
      //     and/or active-calendar epoch)
      // Tick MARK still renders either way so the user keeps a
      // visual scale reference.
      const labelText = formatYear(yr);
      const lw = estLabelWidth(labelText);
      const leftEdge  = sp.x - lw / 2;
      const rightEdge = sp.x + lw / 2;
      if (leftEdge < lastLabelRight) continue;
      if (collidesWithReservedSlot(leftEdge, rightEdge)) continue;
      // Phase 22-AH (2026-05-25) — universal label cap.
      if (_labelsRendered >= TICK_LABEL_CAP) continue;
      _labelsRendered++;
      lastLabelRight = rightEdge;

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
      label.textContent = labelText;
      tickGroupEl.appendChild(label);
    }

    // Phase 22-AG (2026-05-24) — TWO-TIER PIVOTS.
    // PRIMARY = Gregorian year 0 (always rendered, full emphasis).
    // SECONDARY = active calendar's epoch year (rendered when
    //             non-Gregorian, dimmer + slightly smaller — it's
    //             a navigational note, not the world's anchor).
    function _drawPivot(year, primary) {
      const wx = yToX(year, xRange);
      const sp = camera.worldToScreen(wx, 0, vp);
      if (sp.x < -120 || sp.x > vp.w + 120) return;
      // STYLE-tunable. Secondary pivot dims to 55% of primary
      // opacity and 80% of primary tick-size so the eye reads
      // Greg-0 as the canonical anchor.
      const dim = primary ? 1.0 : 0.55;
      const sz  = (primary ? 1.0 : 0.80) * _bandStyle.yr0Size;
      const op  = _bandStyle.yr0Opacity * dim;
      const wd  = _bandStyle.yr0Width;
      // Pivot grid stripe — secondary is half-stripe opacity.
      const grid0 = document.createElementNS(NS, 'line');
      grid0.setAttribute('x1', sp.x); grid0.setAttribute('x2', sp.x);
      grid0.setAttribute('y1', 0);    grid0.setAttribute('y2', vp.h);
      grid0.setAttribute('stroke', 'rgba(212, 165, 90, ' + (0.34 * op).toFixed(3) + ')');
      grid0.setAttribute('stroke-width', String(Math.max(1, wd * 0.83)));
      gridGroupEl.appendChild(grid0);
      // Tick mark.
      const tick0 = document.createElementNS(NS, 'line');
      tick0.setAttribute('x1', sp.x);
      tick0.setAttribute('y1', axisY - sz);
      tick0.setAttribute('x2', sp.x);
      tick0.setAttribute('y2', axisY + sz);
      tick0.setAttribute('stroke', 'rgba(245, 220, 160, ' + op.toFixed(3) + ')');
      tick0.setAttribute('stroke-width', String(wd));
      tickGroupEl.appendChild(tick0);
      // Label.
      const lbl0 = document.createElementNS(NS, 'text');
      lbl0.setAttribute('x', sp.x);
      lbl0.setAttribute('y', axisY - (sz + 6));
      lbl0.setAttribute('text-anchor', 'middle');
      lbl0.setAttribute('class', 'forge-timeline-year-label' + (primary ? ' forge-timeline-year-zero' : ' forge-timeline-year-epoch'));
      lbl0.style.fill          = 'rgba(245, 220, 160, ' + op.toFixed(3) + ')';
      lbl0.style.fontFamily    = 'var(--mono, "JetBrains Mono", Menlo, monospace)';
      lbl0.style.fontSize      = sz + 'px';
      lbl0.style.fontWeight    = '600';
      lbl0.style.letterSpacing = '0.14em';
      lbl0.style.textTransform = 'uppercase';
      lbl0.textContent = formatYear(year);
      tickGroupEl.appendChild(lbl0);
    }
    if (renderGregPivot)  _drawPivot(0, true);
    if (renderEpochPivot) _drawPivot(_epochYear, false);
  }

  // ── EXPORT ───────────────────────────────────────────────
  window.AtlasTimelineChrome = {
    mount,
    unmount,
    refresh: scheduleRefresh,
    isMounted: () => mounted,
    // Phase 22-I — band style API for STYLE panel.
    // Phase 22-M — boolean setter added.
    setBandStyle: setBandStyleKey,
    setBandStyleBoolean: setBandStyleBoolean,
    getBandStyle: getBandStyle,
    resetBandStyle: resetBandStyle,
    bandStyleDefaults: function () { return Object.assign({}, BAND_STYLE_DEFAULTS); },
    // Phase 22-AE (2026-05-24) — calendar surface for the popup.
    listCalendars: listCalendars,
    getActiveCalendarId: getActiveCalendarId,
    setActiveCalendar: setActiveCalendar,
  };
})();
