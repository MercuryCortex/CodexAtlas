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

  // The lab's own deterministic pseudo-random — the starfield must
  // be the SAME field every paint (a reshuffle on every resize would
  // read as flicker, not sky).
  function srand(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

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

  // paintBG — the lab function, transcribed. Note the tint args the
  // lab uses for its isolate-state experiments are intentionally
  // dropped: the Atlas has no isolate ground tint yet.
  function paint() {
    const T = THEMES[current];
    if (!T || !cv) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(window.innerWidth));
    const h = Math.max(1, Math.round(window.innerHeight));
    if (cv.width !== w * dpr || cv.height !== h * dpr) {
      cv.width = w * dpr; cv.height = h * dpr;
    }
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, T.a); g.addColorStop(1, T.b);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    const r = ctx.createRadialGradient(w * 0.72, h * 0.15, 0, w * 0.72, h * 0.15, w * 0.8);
    r.addColorStop(0, T.glow); r.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, w, h);

    if (T.star) {
      for (let i = 0; i < 110; i++) {
        ctx.fillStyle = 'rgba(220,225,255,' + (0.04 + srand(i) * 0.14) + ')';
        ctx.fillRect(srand(i * 3 + 1) * w, srand(i * 7 + 2) * h, 1, 1);
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

  window._forgeGround = { apply, repaint: paint, names: NAMES, get current() { return current; } };
})();
