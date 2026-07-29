// ============================================================
// FORGE GROUND — the node-lab's colour schemes, in the Atlas.
// ============================================================
//
// 2026-07-29 (John: "there was a colour scheme on the plan that I
// loved — can you add those colour BGs from the mockups to the
// options"). The four grounds in `design/node-lab.html` (§03 "The
// ground") are transcribed here VERBATIM — same hex stops, same
// radial glow position/radius, same 110-star field with the lab's
// own deterministic srand. No re-invention: if the lab and the
// Atlas ever disagree, the lab is right.
//
//   FILM      · the ambient bg movie — today's look, the DEFAULT
//               (honest zero: with 'film' selected this module
//               paints nothing and the video is untouched)
//   VOID      · Deep Void — the starfield John loved (lab default)
//   OBSIDIAN  · approved in round 2
//   NEBULA    · theme drawer
//   INKWELL   · theme drawer
//
// The ground is a plain 2D canvas pinned behind everything. It is
// painted ONCE per theme/resize — never per frame — so it costs
// nothing at runtime. It does not participate in the WebGPU passes:
// the forge canvas above it stays transparent (Phase 20G), which is
// exactly why the light-alpha law (ENGINE-DRESS-11) matters — the
// node light composites onto whichever ground is showing.
//
// NOTE on the orb lens: the lens samples the ENGINE's backdrop
// texture (ground+wires as the GPU knows them), not this DOM layer,
// so a drop over empty space still shows the page ground through
// its own transparency (the ENGINE-DRESS-10b rule). Picking a
// ground here changes what shows through — it does not break the
// lens contract.
//
//   window._forgeGround.apply('void')   → paint + hide the movie
//   window._forgeGround.apply('film')   → remove + restore the movie
// ============================================================
(function () {
  // Lab THEMES, verbatim (design/node-lab.html).
  // 'film' is not a lab theme — it is "no colour ground": the app's own
  // --bg-0 (read live, so it follows the FOLIO Theme) with no ramp and
  // no starfield. It is here so the canvas can paint EVERY background,
  // including today's default. See ATMOSPHERE below for why that matters.
  const THEMES = {
    film:     { flat: true,                                 glow: null,                  star: 0 },
    nebula:   { a: '#1c1547', b: '#2a1e5e', glow: 'rgba(150,70,180,.20)', star: 0 },
    obsidian: { a: '#0b0918', b: '#151129', glow: 'rgba(100,80,170,.13)', star: 0 },
    void:     { a: '#04060d', b: '#0a0e1c', glow: 'rgba(70,100,180,.10)',  star: 1 },
    inkwell:  { a: '#140f0b', b: '#1e1610', glow: 'rgba(200,150,80,.10)',  star: 0 },
  };

  // ── THE ATMOSPHERE, MOVED OFF CSS (2026-07-29) ───────────────
  // John, at 253% zoom with a colour ground and no film: "the version
  // without the film HAS banding — but there's no BANDING in your view
  // here on the side. what are you talking about?"
  //
  // He was right and I had been measuring the wrong layer. `.forge-stage`
  // painted its own CENTRED radial in CSS —
  //   radial-gradient(ellipse at center,
  //     rgba(212,165,90, var(--forge-atmosphere, .025)) 0%, transparent 70%)
  // — a warm haze worth about SIX of 256 levels spread across ~70% of the
  // viewport. That is ~120px per band, and **CSS gradients cannot be
  // dithered**: the browser rasterises them straight to 8 bits. So the
  // ground canvas underneath was provably smooth while the layer on top
  // of it banded, and my downscaled pane screenshots averaged the bands
  // away — which is exactly why his retina display disagreed with them.
  //
  // The atmosphere is now composited INTO this canvas, inside the same
  // dithered float pass, and the CSS one is switched off in view-forge
  // (--forge-atmosphere: 0). One surface owns the whole background.
  // Geometry reproduces `ellipse farthest-corner at center`: radii are
  // (W/2, H/2) × √2, the stop runs 0 → 70% of that, linear.
  const ATMO = { r: 212, g: 165, b: 90, a: 0.025, stop: 0.7 };
  const SQRT2 = Math.SQRT2;

  function cssVar(name, fallback) {
    try {
      const v = getComputedStyle(document.body).getPropertyValue(name).trim();
      return v || fallback;
    } catch (_) { return fallback; }
  }
  const NAMES = ['film', 'void', 'obsidian', 'nebula', 'inkwell'];
  // Swatch metadata for the pickers (THE FOLIO ▸ Ground). Kept here so
  // the swatch and the paint can never disagree.
  const SWATCH = [
    { key: 'film',     label: 'Film',      bg: 'linear-gradient(135deg,#0d1119,#1b2130)', dot: '#d4a55a' },
    { key: 'void',     label: 'Deep Void', bg: 'linear-gradient(135deg,#04060d,#0b101f)', dot: '#dce1ff' },
    { key: 'obsidian', label: 'Obsidian',  bg: 'linear-gradient(135deg,#0b0918,#171231)', dot: '#8f7fd0' },
    { key: 'nebula',   label: 'Nebula',    bg: 'linear-gradient(135deg,#1c1547,#31226b)', dot: '#c46ab4' },
    { key: 'inkwell',  label: 'Inkwell',   bg: 'linear-gradient(135deg,#140f0b,#211711)', dot: '#c89650' },
  ];
  // ONE SOURCE OF TRUTH (2026-07-29). The ground is a user setting with
  // exactly one owner: this module. Every surface that offers it —
  // THE FOLIO ▸ Ground today — calls set() and renders from current.
  // It is NOT a forge param and NOT part of the node recipe.
  const LS_KEY = 'codex-ground';

  // The lab's own deterministic pseudo-random — the starfield must
  // be the SAME field every paint (a reshuffle on every resize would
  // read as flicker, not sky).
  function srand(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  // ── WHY THIS IS NOT A canvas createLinearGradient ────────────
  // John, 2026-07-29: "there's a lot of banding in these gradients".
  // He is right and it is not fixable by nudging colours. These
  // grounds travel only ~6-15 of the 256 available levels across a
  // whole screen height (#04060d → #0a0e1c), so 8-bit output has
  // literally 6-15 steps to spend on ~900px — each band is 60-150px
  // wide and the eye reads every edge (Mach banding exaggerates it).
  // Canvas gradients are quantised to 8 bits at fill time, so
  // post-processing the result can only smear bands that already
  // exist. The fix is to never let them form: compute the gradient
  // in FLOAT here and apply an ordered (Bayer 8×8) dither at the
  // moment of quantisation, so the boundary between two levels is
  // traded for a fine, stable stipple. This is exactly what GPUs do
  // for gradient skies. Amplitude is ±0.5 of one level — invisible
  // as texture, decisive against banding.
  //
  // Ordered, NOT random: a random dither re-rolls on every repaint
  // and would shimmer on resize; the Bayer matrix is fixed, so the
  // ground is byte-identical every time it is painted.
  const BAYER8 = new Uint8Array([
     0, 32,  8, 40,  2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44,  4, 36, 14, 46,  6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
     3, 35, 11, 43,  1, 33,  9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47,  7, 39, 13, 45,  5, 37,
    63, 31, 55, 23, 61, 29, 53, 21,
  ]);

  function hex(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  // 'rgba(r,g,b,a)' → [r,g,b,a]
  function rgba(s) {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return [0, 0, 0, 0];
    const p = m[1].split(',').map(v => parseFloat(v));
    return [p[0] || 0, p[1] || 0, p[2] || 0, p.length > 3 ? p[3] : 1];
  }

  let cv = null;      // the ground canvas
  let current = 'film';

  // THE GROUND SITS UNDER THE FILM, IT DOES NOT REPLACE IT.
  // John, 2026-07-29: "the GROUND STILL MISSES THE FILM on zoom out —
  // the BGS needs to be canonical NOT SEPARATED". The first cut treated
  // ground and film as mutually exclusive: picking a colour hid the
  // movie, which also killed the movie's zoom-out reveal (forge.js
  // ramps its opacity by camera scale). That made two rival background
  // systems out of one. Corrected: the colour ground is the BASE and
  // the film keeps playing over it with its ramp intact, on every
  // ground. One background, two layers.
  //
  // Layering is by DOM order, not z-index: the movie is also
  // position:fixed at z-index 0, so whichever comes LAST wins. The
  // movie is created by the forge on mount — after this module loads —
  // so the ground must be re-seated before it whenever it appears.
  // That is what reapply() (called post-mount) is for.
  function seat() {
    if (!cv) return;
    const v = document.getElementById('forge-bg-image');
    const want = v || document.body.firstChild;
    if (cv.nextSibling !== v || !cv.isConnected) {
      document.body.insertBefore(cv, want);
    }
  }
  function ensureCanvas() {
    if (cv && cv.isConnected) { seat(); return cv; }
    cv = document.createElement('canvas');
    cv.id = 'forge-ground';
    cv.className = 'forge-ground';
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;'
                     + 'pointer-events:none;user-select:none;display:block';
    seat();
    return cv;
  }

  // paintBG — the lab's composition (vertical A→B ramp, then a
  // radial glow at 72%/15% of radius 0.8w, then the starfield),
  // reproduced in float and dithered on write. The lab's isolate
  // tint args are intentionally dropped: the Atlas has no isolate
  // ground tint yet.
  //
  // Canvas gradients interpolate with premultiplied alpha, so the
  // glow's colour→transparent stop holds its hue and only its ALPHA
  // ramps to zero — that is what the float model below reproduces.
  function paint() {
    const T = THEMES[current];
    if (!T || !cv) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = Math.max(1, Math.round(window.innerWidth));
    const cssH = Math.max(1, Math.round(window.innerHeight));
    const W = Math.max(1, Math.round(cssW * dpr));
    const H = Math.max(1, Math.round(cssH * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // 'film' = no colour ramp: the app's own --bg-0, read live so the
    // background follows whatever THEME is picked in THE FOLIO.
    const flatHex = T.flat ? cssVar('--bg-0', '#07090f') : null;
    const A = hex(T.flat ? flatHex : T.a);
    const B = T.flat ? A : hex(T.b);
    const G = T.glow ? rgba(T.glow) : [0, 0, 0, 0];
    const gx = W * 0.72, gy = H * 0.15, gr = W * 0.8;
    // the centred atmosphere (was the .forge-stage CSS radial)
    const ax = W * 0.5, ay = H * 0.5;
    const arx = (W * 0.5) * SQRT2 * ATMO.stop;
    const ary = (H * 0.5) * SQRT2 * ATMO.stop;
    const img = ctx.createImageData(W, H);
    const px = img.data;
    const denomY = H > 1 ? H - 1 : 1;

    let p = 0;
    for (let y = 0; y < H; y++) {
      const ty = y / denomY;
      // the vertical ramp — constant across the row
      const br = A[0] + (B[0] - A[0]) * ty;
      const bg = A[1] + (B[1] - A[1]) * ty;
      const bb = A[2] + (B[2] - A[2]) * ty;
      const dy = y - gy, dy2 = dy * dy;
      const ady = (y - ay) / ary, ady2 = ady * ady;
      const bRow = (y & 7) * 8;
      for (let x = 0; x < W; x++) {
        const dx = x - gx;
        let a = 1 - Math.sqrt(dx * dx + dy2) / gr;   // linear stop → radius
        a = a > 0 ? a * G[3] : 0;
        const ia = 1 - a;
        let r = G[0] * a + br * ia;
        let g = G[1] * a + bg * ia;
        let b = G[2] * a + bb * ia;
        // atmosphere over the top — same premultiplied colour→transparent
        // model as the CSS gradient it replaces, but in float.
        const adx = (x - ax) / arx;
        let aa = 1 - Math.sqrt(adx * adx + ady2);
        if (aa > 0) {
          aa = aa * ATMO.a;
          const iaa = 1 - aa;
          r = ATMO.r * aa + r * iaa;
          g = ATMO.g * aa + g * iaa;
          b = ATMO.b * aa + b * iaa;
        }
        // ordered dither, ±half a level, applied AT quantisation — the
        // whole point: the bands never get a chance to form.
        const d = (BAYER8[bRow + (x & 7)] + 0.5) * 0.015625 - 0.5;   // /64 - .5
        r += d; g += d; b += d;
        r = r < 0 ? 0 : r > 255 ? 255 : r;
        g = g < 0 ? 0 : g > 255 ? 255 : g;
        b = b < 0 ? 0 : b > 255 ? 255 : b;
        px[p++] = (r + 0.5) | 0;
        px[p++] = (g + 0.5) | 0;
        px[p++] = (b + 0.5) | 0;
        px[p++] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Stars ride on top in CSS px (the lab's own field, 1px each).
    if (T.star) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let i = 0; i < 110; i++) {
        ctx.fillStyle = 'rgba(220,225,255,' + (0.04 + srand(i) * 0.14) + ')';
        ctx.fillRect(srand(i * 3 + 1) * cssW, srand(i * 7 + 2) * cssH, 1, 1);
      }
    }
  }

  // The film is NEVER hidden any more (see the seat() note above). Its
  // own zoom ramp in forge.js owns its visibility, on every ground —
  // that is what "not separated" means. This only undoes the damage
  // from the first cut, for anyone whose element still carries it.
  function unhideMovie() {
    const v = document.getElementById('forge-bg-image');
    if (v && v.style.display === 'none') v.style.display = '';
  }

  // The canvas paints EVERY background now, 'film' included — that is
  // what makes it the one dithered surface instead of a special case
  // sitting next to an undithered CSS layer.
  function apply(name) {
    current = NAMES.indexOf(name) >= 0 ? name : 'film';
    unhideMovie();
    ensureCanvas();
    paint();
    return current;
  }

  // The FOLIO Theme changes --bg-0, which is the 'film' base — repaint.
  document.addEventListener('codex:profile-changed', () => {
    if (cv) paint();
  });

  let raf = 0;
  window.addEventListener('resize', () => {
    if (!cv) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(paint);
  });

  // set() = apply + remember. reapply() re-runs the current choice; the
  // forge calls it after a mount because the bg movie element only
  // exists from then on, and 'film' vs a colour ground is decided by
  // hiding it.
  function set(name) {
    const v = apply(name);
    try { localStorage.setItem(LS_KEY, v); } catch (_) { /* ignore */ }
    return v;
  }
  function reapply() { return apply(current); }

  let saved = 'film';
  try { saved = localStorage.getItem(LS_KEY) || 'film'; } catch (_) { /* ignore */ }
  current = NAMES.indexOf(saved) >= 0 ? saved : 'film';
  ensureCanvas(); paint();

  window._forgeGround = {
    apply, set, reapply, repaint: paint,
    names: NAMES, swatches: SWATCH,
    get current() { return current; },
  };
})();
