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
  const THEMES = {
    nebula:   { a: '#1c1547', b: '#2a1e5e', glow: 'rgba(150,70,180,.20)', star: 0 },
    obsidian: { a: '#0b0918', b: '#151129', glow: 'rgba(100,80,170,.13)', star: 0 },
    void:     { a: '#04060d', b: '#0a0e1c', glow: 'rgba(70,100,180,.10)',  star: 1 },
    inkwell:  { a: '#140f0b', b: '#1e1610', glow: 'rgba(200,150,80,.10)',  star: 0 },
  };
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

  function ensureCanvas() {
    if (cv && cv.isConnected) return cv;
    cv = document.createElement('canvas');
    cv.id = 'forge-ground';
    cv.className = 'forge-ground';
    // Behind every positioned element, including the bg movie
    // (which is itself prepended to body at z-index 0 — we sit
    // before it in DOM order, so it would win a tie; it is hidden
    // whenever a ground is active, so there is never a tie).
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;'
                     + 'pointer-events:none;user-select:none;display:block';
    document.body.insertBefore(cv, document.body.firstChild);
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

    const A = hex(T.a), B = hex(T.b), G = rgba(T.glow);
    const gx = W * 0.72, gy = H * 0.15, gr = W * 0.8;
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
      const bRow = (y & 7) * 8;
      for (let x = 0; x < W; x++) {
        const dx = x - gx;
        let a = 1 - Math.sqrt(dx * dx + dy2) / gr;   // linear stop → radius
        a = a > 0 ? a * G[3] : 0;
        const ia = 1 - a;
        // ordered dither, ±half a level, applied AT quantisation
        const d = (BAYER8[bRow + (x & 7)] + 0.5) * 0.015625 - 0.5;   // /64 - .5
        let r = G[0] * a + br * ia + d;
        let g = G[1] * a + bg * ia + d;
        let b = G[2] * a + bb * ia + d;
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

  function movie(show) {
    const v = document.getElementById('forge-bg-image');
    if (!v) return;
    // display, not opacity: forge.js writes bgImage.style.opacity
    // every frame from the zoom ramp and would fight an opacity hide.
    v.style.display = show ? '' : 'none';
  }

  function apply(name) {
    current = NAMES.indexOf(name) >= 0 ? name : 'film';
    if (current === 'film') {
      if (cv && cv.isConnected) { cv.remove(); }
      cv = null;
      movie(true);
      return current;
    }
    ensureCanvas();
    paint();
    movie(false);
    return current;
  }

  let raf = 0;
  window.addEventListener('resize', () => {
    if (current === 'film' || !cv) return;
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
  if (current !== 'film') { ensureCanvas(); paint(); }

  window._forgeGround = {
    apply, set, reapply, repaint: paint,
    names: NAMES, swatches: SWATCH,
    get current() { return current; },
  };
})();
