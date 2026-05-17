// ============================================================
// CODEX ATLAS — Pantheon v2 (WebGL R&D track)
// ============================================================
//
// SECOND ATTEMPT at the WebGL Pantheon. Sigma.js + graphology renderer
// targeting visual + interaction parity with the production D3 SVG
// Pantheon. Hidden behind ?webgl=1 URL flag.
//
// PARITY GATE (must all be ✓ before promoting to default):
//   [✓] Family-wedge polar layout (sqrt-weighted arcs, GAP=0.105 rad)
//   [✓] Family-color node fills + sqrt-degree node sizing
//   [✓] Click → window.selectNode (detail panel)
//   [✓] Hover trail — dim non-neighbors, highlight edges (sigma reducer)
//   [✓] Translucent family hulls (SVG overlay, annular wedge geometry,
//       same d3.arc-equivalent path as production .sector-hull)
//   [✓] Curved Q-bezier edges (SVG overlay, control pulled 35% toward
//       center — exact production formula; sigma's stock edges are
//       hidden via size 0)
//   [✓] Tangential family rim labels (DOM overlay synced to camera)
//   [✓] More deity labels — degree≥6 threshold + labelDensity 1.0
//   [✓] Thumbnail hover card — image + title + family · tradition +
//       connection count + wikipedia link
//   [✓] Mode dropdown (deities/authors/symbols/events/monuments)
//   [✓] labels: hub/all/off toggle
//   [✓] Ego-focus button
//   [✓] Family-legend click-to-filter
//   [✓] Family-filter + tier-overlay parity
//   [✓] Force-simulation layout (jitter + weaker anchor = organic spread)
//
// EDGE-CURVE NOTE: brief recommended vendoring `@sigma/edge-curve` and
// registering an EdgeCurveProgram. That package only ships CJS/ESM
// (no UMD bundle) and imports from `sigma`, which cannot resolve in
// browser without a bundler. We use option (b) instead — SVG overlay
// path elements with the exact `Q ${cxp},${cyp}` formula production
// uses. Sigma's stock straight-line edges are sized to 0 so only the
// curved overlay paints. At ~1000 edges this is fine perf-wise; if
// the slice grows past ~5k we can revisit by adding a bundler step.
//
// REUSES from existing modules:
//   window.VAULT_DATA / NODES_BY_ID / EDGES / DATA / FAMILIES — from app.js
//   window.selectNode
// ============================================================
(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  // Module-level state: persists across render calls so mode/label choices
  // survive filter changes (legend clicks, mode dropdown changes).
  let _currentMode  = 'deities'; // 'deities'|'authors'|'symbols'|'events'|'monuments'

  // Deterministic per-id hash (djb2) — used for radial jitter so the wedge
  // grid doesn't look mechanical. Matches production's hashStr usage.
  function hashStr(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  // Translate any color string ("#RRGGBB", "#RRGGBBAA", "rgb(...)", "rgba(...)")
  // to an rgba() string with the given alpha. Sigma's circle program accepts
  // rgba — this is how we get TRANSLUCENT dim nodes (the user's intent) instead
  // of replacing them with a different opaque color.
  const _alphaCache = new Map();
  function withAlpha(color, alpha) {
    if (!color || typeof color !== 'string') return 'rgba(70,75,90,' + alpha + ')';
    const key = color + ':' + alpha;
    const cached = _alphaCache.get(key);
    if (cached) return cached;
    let r = 0, g = 0, b = 0;
    if (color[0] === '#' && color.length === 7) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    } else if (color[0] === '#' && color.length === 9) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    } else {
      const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (m) { r = +m[1]; g = +m[2]; b = +m[3]; }
    }
    const out = `rgba(${r},${g},${b},${alpha})`;
    _alphaCache.set(key, out);
    return out;
  }
  // Blend a hex color toward the canvas background — used for dimming nodes
  // without losing family identity. Returns a hex string that's the original
  // color mixed 10% with the bg, so a faded red still reads as red-ish, not grey.
  const _DIM_BG    = [10, 13, 20];     // app bg approximately
  const _fadeCache = new Map();
  function fadeToBg(hex, t /* 0..1, default 0.10 */) {
    const alpha = (t == null ? 0.10 : t);
    if (!hex || typeof hex !== 'string') return '#1a1d22';
    const key = hex + ':' + alpha;
    const cached = _fadeCache.get(key);
    if (cached) return cached;
    let r, g, b;
    if (hex[0] === '#' && hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    } else { return hex; }
    const mr = Math.round(r * alpha + _DIM_BG[0] * (1 - alpha));
    const mg = Math.round(g * alpha + _DIM_BG[1] * (1 - alpha));
    const mb = Math.round(b * alpha + _DIM_BG[2] * (1 - alpha));
    const out = '#' + mr.toString(16).padStart(2, '0')
                    + mg.toString(16).padStart(2, '0')
                    + mb.toString(16).padStart(2, '0');
    _fadeCache.set(key, out);
    return out;
  }

  // ============================================================
  // PHASE D — FORCE-RELAXATION BAKE
  // ============================================================
  // One-shot pre-paint relaxation pass. Mirrors production's
  // d3.forceSimulation (app.js:1322-1361) but bakes settled positions
  // before sigma ever paints — no live loop, zero render-perf cost.
  //
  // Three forces:
  //   anchor  — pull each node toward its computed wedge-slot (the
  //             radial-row position from computeWedgePositions)
  //   charge  — gentle Coulomb repulsion from neighbours WITHIN the
  //             same wedge (other wedges are angularly clamped out)
  //   collide — non-overlap constraint (radius ∝ √degree)
  //
  // Hard wedge clamp every iteration:
  //   radial   ∈ [Rinner + 14,  Router - 14]
  //   angular  ∈ [center - halfArc + padA,  center + halfArc - padA]
  //
  // O(Σ wedge_size²) per iter ≈ O(10k) — finishes in ~50 ms for 500 nodes.
  function relaxPositions(deities, positions, wedges, Rinner, Router, degree, iterations) {
    iterations = iterations || 250;
    // Group nodes by wedge for fast per-wedge pairwise force evaluation.
    const wedgeMembers = new Map();
    const wedgeByNode  = new Map();
    deities.forEach(d => {
      const w = wedges[d.family || 'Other'];
      if (!w) return;
      wedgeByNode.set(d.id, w);
      if (!wedgeMembers.has(w.name)) wedgeMembers.set(w.name, []);
      wedgeMembers.get(w.name).push(d.id);
    });
    // Per-node radius for collide (slightly larger than visual size for breathing).
    const radius = new Map();
    deities.forEach(d => {
      const deg = degree.get(d.id) || 0;
      radius.set(d.id, 9 + Math.sqrt(deg) * 1.5);
    });
    // Working state: { x, y, vx, vy, ax, ay } where (ax,ay) is the static anchor.
    // Initial positions are jittered ±20 px from the slot center so the bake breaks
    // the regular grid symmetry — without jitter the charge forces perfectly cancel
    // between equally-spaced neighbours and nodes barely move from their grid slots.
    // Jitter is derived from hashStr so it's deterministic across renders.
    const P = new Map();
    deities.forEach(d => {
      const p = positions.get(d.id);
      if (!p) return;
      const h = hashStr(d.id + '_jit');
      const jx = ((h % 41) - 20);
      const jy = (((h >> 6) % 41) - 20);
      P.set(d.id, { x: p.x + jx, y: p.y + jy, vx: 0, vy: 0, ax: p.x, ay: p.y });
    });
    // Constants (tuned for V2's 220→540 world scale; production uses 14 px radial pad).
    // Dev panel may override anchorK / chargeK / chargeRange / damp live via
    // window.CODEX_DEV.settings (re-render is triggered on slider release).
    const D = window.CODEX_DEV?.settings || {};
    // Production force-sim uses charge strength -22 with distanceMax 140 and
    // anchor strength 0.55 (app.js:1322-1331). V2's one-shot Coulomb bake uses
    // a different math model, but the visual target is the same: gentle
    // tangential nudges around the anchor, not aggressive separation. Anchor
    // bumped up + charge halved gets us close to V1's settled feel.
    const ANCHOR_K     = D.anchorK     != null ? D.anchorK     : 0.045;
    const CHARGE_K     = D.chargeK     != null ? D.chargeK     : -260;
    const CHARGE_RANGE = D.chargeRange != null ? D.chargeRange : 180;
    const DAMP         = D.damp        != null ? D.damp        : 0.55;
    const COLLIDE_PAD  = 1.5;
    // Clamps are now SOFT: a node can bleed up to BLEED px past the radial wall
    // before being pushed back. Avoids the "glued to the rim" look on sparse
    // wedges, where the rigid clamp would force every dot to the boundary line.
    const RADIAL_PAD   = 8;   // smaller hard pad so nodes don't all stack on the edge
    const RADIAL_BLEED = 6;   // px allowed past the wall before reflection
    const ANG_PAD_MAX  = 0.030; // slightly tighter — was 0.045

    // INWARD GRAVITY — sparse wedges get a soft pull toward the annulus
    // centerline so members don't all camp on the outer rim. Density is
    // members.length / arcLength; when below a threshold, gravity activates.
    const Rmid = (Rinner + Router) / 2;
    const gravityPerWedge = new Map();
    wedgeMembers.forEach((ids, name) => {
      const w = Array.from(wedgeByNode.values()).find(ww => ww.name === name);
      if (!w) { gravityPerWedge.set(name, 0); return; }
      const arc = w.a1 - w.a0;
      const density = ids.length / Math.max(0.01, arc);   // members per radian
      // Below ~12 members/rad (e.g. 2 deities in a 0.18-rad wedge) we pull
      // gently toward the annulus mid-line. Linear fall-off above that.
      const SPARSE_THRESH = 12;
      const t = Math.max(0, Math.min(1, (SPARSE_THRESH - density) / SPARSE_THRESH));
      gravityPerWedge.set(name, t * 0.018);  // max-strength gravity coefficient
    });
    for (let iter = 0; iter < iterations; iter++) {
      // 1) anchor force + inward gravity for sparse wedges
      P.forEach((p, id) => {
        p.vx += (p.ax - p.x) * ANCHOR_K;
        p.vy += (p.ay - p.y) * ANCHOR_K;
        // Inward gravity — pull toward Rmid along the radial axis only.
        const w = wedgeByNode.get(id);
        if (!w) return;
        const g = gravityPerWedge.get(w.name) || 0;
        if (g === 0) return;
        const r = Math.hypot(p.x, p.y) || 0.0001;
        const targetR = Rmid;
        const radialErr = targetR - r;
        // Project the radial error back into world-space dx,dy
        p.vx += (p.x / r) * radialErr * g;
        p.vy += (p.y / r) * radialErr * g;
      });
      // 2) per-wedge pairwise charge + collide
      wedgeMembers.forEach(ids => {
        for (let i = 0; i < ids.length; i++) {
          const pi = P.get(ids[i]); if (!pi) continue;
          const ri = radius.get(ids[i]);
          for (let j = i + 1; j < ids.length; j++) {
            const pj = P.get(ids[j]); if (!pj) continue;
            const dx = pi.x - pj.x, dy = pi.y - pj.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 0.001) continue;
            const dist = Math.sqrt(d2);
            // CHARGE — inverse-square, capped range
            if (dist < CHARGE_RANGE) {
              const fmag = CHARGE_K / d2;
              const fx = (dx / dist) * fmag, fy = (dy / dist) * fmag;
              pi.vx -= fx; pi.vy -= fy;
              pj.vx += fx; pj.vy += fy;
            }
            // COLLIDE — positional resolve if overlapping
            const rj = radius.get(ids[j]);
            const minDist = ri + rj + COLLIDE_PAD;
            if (dist < minDist) {
              const push = (minDist - dist) * 0.35;
              const ux = dx / dist, uy = dy / dist;
              pi.x += ux * push; pi.y += uy * push;
              pj.x -= ux * push; pj.y -= uy * push;
            }
          }
        }
      });
      // 3) integrate + hard wedge clamp
      P.forEach((p, id) => {
        p.vx *= DAMP; p.vy *= DAMP;
        p.x += p.vx; p.y += p.vy;
        const w = wedgeByNode.get(id); if (!w) return;
        let r = Math.hypot(p.x, p.y) || 0.0001;
        let ang = Math.atan2(p.y, p.x);
        // angular clamp — signed shortest delta from wedge center
        let delta = ((ang - w.center + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const halfArc = (w.a1 - w.a0) / 2;
        const padA = Math.min(ANG_PAD_MAX, halfArc * 0.22);
        const maxDelta = Math.max(0, halfArc - padA);
        if (delta >  maxDelta) ang = w.center + maxDelta;
        if (delta < -maxDelta) ang = w.center - maxDelta;
        // SOFT radial clamp — allow up to RADIAL_BLEED px past the wall but
        // damp the overshoot so nodes naturally settle near (but not glued to)
        // the rim. Past BLEED, hard-clamp as a safety net.
        const minR = Rinner + RADIAL_PAD - RADIAL_BLEED;
        const maxR = Router - RADIAL_PAD + RADIAL_BLEED;
        if (r < Rinner + RADIAL_PAD) {
          // soft pull back into the annulus
          const overshoot = (Rinner + RADIAL_PAD) - r;
          r += overshoot * 0.55;
          if (r < minR) r = minR;
        } else if (r > Router - RADIAL_PAD) {
          const overshoot = r - (Router - RADIAL_PAD);
          r -= overshoot * 0.55;
          if (r > maxR) r = maxR;
        }
        p.x = r * Math.cos(ang);
        p.y = r * Math.sin(ang);
      });
    }
    // Write settled positions back
    P.forEach((p, id) => positions.set(id, { x: p.x, y: p.y }));
  }

  // FAMILY-WEDGE polar layout — same math as the main D3 Pantheon
  // (app.js around line 975), so the angular allocation is identical.
  function computeWedgePositions(deities, families) {
    const famByName = {};
    deities.forEach(d => {
      const f = d.family || 'Other';
      if (!famByName[f]) famByName[f] = { name: f, members: [], color: d.family_color || '#7a8090' };
      famByName[f].members.push(d);
    });
    const familyOrder = (families || []).map(f => f.name).filter(n => famByName[n]);
    Object.keys(famByName).forEach(n => { if (!familyOrder.includes(n)) familyOrder.push(n); });

    // Wedge-to-wedge gap. 0.045 rad (~2.6°) — narrower than P1's 0.105 so
    // each hull gets more arc, the spiral has room to breathe, and the
    // sparse wedges (Manichaean, Mandaean, Pacific) stop looking starved.
    const GAP = 0.045;
    const totalGap = GAP * familyOrder.length;
    const totalArc = 2 * Math.PI - totalGap;
    const weights = familyOrder.map(n => Math.max(1.1, Math.sqrt(famByName[n].members.length)));
    const totalW = weights.reduce((a, b) => a + b, 0);
    let cursor = -Math.PI * 0.55; // start near 9 o'clock so labels read naturally
    const wedges = {};
    familyOrder.forEach((name, i) => {
      const arcSize = totalArc * (weights[i] / totalW);
      wedges[name] = {
        name,
        a0: cursor,
        a1: cursor + arcSize,
        center: cursor + arcSize / 2,
        members: famByName[name].members,
        color: famByName[name].color
      };
      cursor += arcSize + GAP;
    });

    // Fermat-spiral layout — key figures gravitate to wedge center.
    //
    // Sort members by degree DESC. The top deity lands at the wedge's
    // angular + radial midpoint. Subsequent members spiral outward via a
    // golden-angle Vogel pattern in wedge-local (u, v) ∈ [-1, 1]²:
    //   θ = i · 137.5°,   ρ = √(i / N)
    //   u = ρ cosθ · 0.92,  v = ρ sinθ · 0.85
    // (u, v) is then mapped to (ang, r) inside the wedge's annulus.
    //
    // Result: top deities (Zeus, Ra, YHWH, Jesus) sit at the centerline;
    // minor members fan toward the edges; the hull AREA is filled, not
    // just its centerline. Deterministic — no jitter needed.
    const Rinner = 220, Router = 540;
    const Rmid   = (Rinner + Router) / 2;
    const positions = new Map();
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.39996 rad

    Object.values(wedges).forEach(w => {
      const N = w.members.length;
      if (!N) return;
      const arc = w.a1 - w.a0;
      // Sort by degree DESC (key figures first). Tie-break alphabetic for stability.
      const sorted = [...w.members].sort((a, b) => {
        const da = (deities => 0)(0); // placeholder; degree map isn't available here.
        // We use the optional `_degHint` injected by the render scope, falling back
        // to 0 if missing. computeWedgePositions is called BEFORE degree is built,
        // so this expects the caller to pass an updated deities array (it does at
        // line ~470). For first-call layout we get degree from window.VAULT_DATA.
        const degA = (window._codexDegreeHint && window._codexDegreeHint.get(a.id)) || 0;
        const degB = (window._codexDegreeHint && window._codexDegreeHint.get(b.id)) || 0;
        if (degA !== degB) return degB - degA;
        return (a.id || '').localeCompare(b.id || '');
      });

      // Spiral coefficients — tighter at center for the dense top, more spread
      // when the wedge is small. Scale by sqrt(N) so a 50-member wedge fills the
      // box and a 3-member wedge doesn't blow up.
      const scale = Math.min(1, Math.sqrt(N) / Math.sqrt(Math.max(N, 8)));
      sorted.forEach((d, i) => {
        // Top deity lands EXACTLY at center; others spiral.
        if (i === 0) {
          positions.set(d.id, { x: Rmid * Math.cos(w.center), y: Rmid * Math.sin(w.center) });
          return;
        }
        const theta = i * GOLDEN_ANGLE;
        const rho   = Math.sqrt(i / N) * scale;
        // (u, v) in wedge-local ∈ [-1, 1]². u = angular axis, v = radial axis.
        const u = rho * Math.cos(theta) * 0.92;
        const v = rho * Math.sin(theta) * 0.85;
        // Map to world.
        const halfArc = arc / 2;
        // Angular padding so dots don't kiss the hull's angular edge.
        const padA = Math.min(0.05, halfArc * 0.18);
        const ang  = w.center + u * (halfArc - padA);
        // Radial padding so dots stay inside the annulus (hull extends Rinner-22 → Router+22).
        const radHalf = (Router - Rinner) / 2;
        const padR    = 14;
        const r       = Rmid + v * (radHalf - padR);
        positions.set(d.id, { x: r * Math.cos(ang), y: r * Math.sin(ang) });
      });
    });

    return { positions, wedges, familyOrder, famByName, Rinner, Router };
  }

  // ── EDGE COLOR / GRADIENT SYSTEM ────────────────────────────────────
  // Implementation of AUDIT/edge-color-spec-2026-05-17.md:
  // 7 semantic buckets, one canonical hex each. Idle stroke is the spec's
  // single slate (rgba(80,95,130,0.85)) for non-headlines — bucket color
  // only paints on .hot, or at idle for the two HEADLINE buckets
  // (Polemic, Fusion) and the single headline edge type (ancestor-of).
  //
  // Directional buckets (Transmission, Attestation, kinship descent,
  // `appropriated-by`) get a <linearGradient> from origin (bright stop,
  // 0.95) to terminus (dim stop, 0.35). REVERSE_DIRECTION types swap
  // stops so the bright end sits on the SEMANTIC origin, not the
  // data-edge source.
  const BUCKETS = {
    transmission: { hex: '#C9743A', idle: 0.10, hot: 0.95, headline: false, directional: true  },
    parallel:     { hex: '#5A9A8F', idle: 0.12, hot: 0.85, headline: false, directional: false },
    association:  { hex: '#4A5AA4', idle: 0.08, hot: 0.55, headline: false, directional: false },
    kinship:      { hex: '#C9A5D4', idle: 0.14, hot: 0.85, headline: false, directional: false },
    attestation:  { hex: '#D4A55A', idle: 0.10, hot: 0.90, headline: false, directional: true  },
    polemic:      { hex: '#A83E4A', idle: 0.25, hot: 0.95, headline: true,  directional: false },
    fusion:       { hex: '#C4783A', idle: 0.30, hot: 0.95, headline: true,  directional: false },
  };
  // Per-bucket widths — kept compatible with the existing dev-panel mult.
  const BUCKET_WIDTH = {
    transmission: 0.34, parallel: 0.30, association: 0.22, kinship: 0.32,
    attestation:  0.30, polemic:  0.46, fusion:      0.40,
  };
  // Type → bucket map. Built from the spec + the runtime edge-type tally.
  const EDGE_BUCKET = {
    // Transmission
    'influenced-by':                    'transmission',
    'influences':                       'transmission',
    'influenced':                       'transmission',
    'originated':                       'transmission',
    'affects-tradition':                'transmission',
    'affects-document':                 'transmission',
    'documents-affected':               'transmission',
    'produces-document':                'transmission',
    'manuscript-transmission':          'transmission',
    'redaction-of':                     'transmission',
    'transmission-to':                  'transmission',
    'ancestor-of':                      'transmission',   // HEADLINE override below
    'syncretic-ancestor-of':            'transmission',   // HEADLINE override below
    // Parallel
    'parallel-motif':                   'parallel',
    'parallel-form':                    'parallel',
    'syncretic':                        'parallel',
    'syncretized-with':                 'parallel',
    'syncretic-scholarly-parallel':     'parallel',
    'syncretic-ancient-identification': 'parallel',
    'syncretic-structural-parallel':    'parallel',
    'syncretic-parallel-motif':         'parallel',
    'syncretic-parallel-form':          'parallel',
    'syncretic-syncretic-identification':'parallel',
    'syncretic-identification':         'parallel',
    'syncretic-folk-syncretism':        'parallel',
    'syncretic-continuous-development': 'parallel',
    'syncretic-aspect-of':              'parallel',
    'syncretic-instantiation':          'parallel',
    'structural-parallel':              'parallel',
    'parallel-amulet':                  'parallel',
    'visual-parallel':                  'parallel',
    'structural':                       'parallel',
    'typological':                      'parallel',
    'thematic-overlap':                 'parallel',
    'variant-of':                       'parallel',
    'contested-identification':         'parallel',
    'exemplifies':                      'parallel',
    'instantiation-of':                 'parallel',
    // Association
    'has-theme':                        'association',
    'context':                          'association',
    'shared-milieu':                    'association',
    'shared-tradition':                 'association',
    'co-tradition':                     'association',
    'co-appears-with':                  'association',
    'tradition-deity':                  'association',
    'tradition-doc':                    'association',
    'tradition-person':                 'association',
    'symbol-attests-in':                'association',
    'symbol-iconography-of':            'association',
    'symbol-in-tradition':              'association',
    'music-in-tradition':               'association',
    'music-attests-in':                 'association',
    'music-iconography-of':             'association',
    'participated-in':                  'association',
    'component-of':                     'association',
    'contains':                         'association',
    'related':                          'association',
    // Kinship
    'parent-of':                        'kinship',
    'child-of':                         'kinship',
    'consort':                          'kinship',
    'sibling-of':                       'kinship',
    'syncretic-sacred-marriage':        'kinship',
    // Attestation
    'attests':                          'attestation',
    'attested-in':                      'attestation',
    'mentioned-in':                     'attestation',
    'key-figure':                       'attestation',
    'authored':                         'attestation',
    'attributed-author':                'attestation',
    'primary-source':                   'attestation',
    'primary-translation':              'attestation',
    'critical-edition':                 'attestation',
    'translation':                      'attestation',
    'commentary-on':                    'attestation',
    'direct-quote':                     'attestation',
    'preserved-by':                     'attestation',
    'syncretic-manuscript-transmission':'attestation',
    'syncretic-attested-in':            'attestation',
    'syncretic-reports-to':             'attestation',
    // Polemic — entire bucket is headline (idle in bucket color)
    'polemic-inversion':                'polemic',
    'polemic-against':                  'polemic',
    'syncretic-polemic-against':        'polemic',
    'syncretic-polemic-inversion':      'polemic',
    'syncretic-lineage-claim':          'polemic',
    // Fusion — entire bucket is headline (idle in bucket color)
    'syncretic-fusion':                 'fusion',
    'syncretic-syncretic-fusion':       'fusion',
    'appropriated-by':                  'fusion',
    'visual-cognate':                   'fusion',
  };
  // Directional edge types. Bright stop on the SEMANTIC origin.
  // Direction is `source → target` by default. These types' DATA points
  // source/target the "wrong" way (`child-of` data = child→parent, but
  // the semantic origin is the parent) so we swap gradient stops.
  const REVERSE_DIRECTION = new Set([
    'influenced-by', 'influenced', 'child-of', 'attested-in', 'mentioned-in',
    'documents-affected', 'preserved-by', 'syncretic-attested-in',
  ]);
  // Single edge types in symmetric buckets that nonetheless carry direction.
  const DIRECTIONAL_TYPES = new Set([
    'parent-of', 'child-of', 'ancestor-of', 'syncretic-ancestor-of',
    'appropriated-by',
  ]);
  // Headline overrides on otherwise non-headline buckets.
  const HEADLINE_TYPES = new Set(['ancestor-of', 'syncretic-ancestor-of']);

  function edgeStyleFor(type) {
    const bucketName = EDGE_BUCKET[type] || 'association';
    const b          = BUCKETS[bucketName];
    const headline   = b.headline || HEADLINE_TYPES.has(type);
    const directional = b.directional || DIRECTIONAL_TYPES.has(type);
    return {
      bucket:      bucketName,
      c:           b.hex,              // bucket color (for hot + headline idle)
      w:           BUCKET_WIDTH[bucketName] || 0.30,
      op:          b.idle,             // idle opacity
      hotOp:       b.hot,
      headline,
      directional,
      reverse:     REVERSE_DIRECTION.has(type),
    };
  }
  // Legacy reference left for compatibility; not actually used by the build
  // loop (which now reads `edgeStyleFor`). Kept inert so external dev-panel
  // diagnostics don't break.
  const EDGE_STYLE = {
    // syncretic / kin — gold-brown-green tints
    'syncretic-identification':         { c: '#b08840', w: 0.42, op: 0.36 },
    'syncretic-ancient-identification': { c: '#b08840', w: 0.38, op: 0.30 },
    'syncretic-scholarly-parallel':     { c: '#947030', w: 0.34, op: 0.24 },
    'syncretic-folk-syncretism':        { c: '#7d5e28', w: 0.30, op: 0.20 },
    'syncretic':                        { c: '#b08840', w: 0.36, op: 0.28 },
    // syncretic-* variants — all forms of cross-tradition identification. Mirror
    // the parent `syncretic` styling so the 250 deity-deity edges in these
    // sub-types stop falling to the slate-blue default. Headline-equivalent
    // variants (polemic, fusion, ancestor-of) inherit the headline colors.
    'syncretic-scholarly-parallel':     { c: '#b08840', w: 0.34, op: 0.24 },
    'syncretic-ancient-identification': { c: '#b08840', w: 0.34, op: 0.28 },
    'syncretic-structural-parallel':    { c: '#b08840', w: 0.32, op: 0.22 },
    'syncretic-syncretic-identification':{ c: '#b08840', w: 0.32, op: 0.22 },
    'syncretic-folk-syncretism':        { c: '#b08840', w: 0.30, op: 0.20 },
    'syncretic-manuscript-transmission':{ c: '#6a5a40', w: 0.30, op: 0.22 },
    'syncretic-aspect-of':              { c: '#b08840', w: 0.30, op: 0.22 },
    'syncretic-parallel-motif':         { c: '#5a6a82', w: 0.28, op: 0.22 },
    'syncretic-parallel-form':          { c: '#a08a5a', w: 0.34, op: 0.32 },
    'syncretic-polemic-against':        { c: '#a83e4a', w: 0.38, op: 0.32 },
    'syncretic-polemic-inversion':      { c: '#a83e4a', w: 0.46, op: 0.50 },
    'syncretic-syncretic-fusion':       { c: '#c47a3a', w: 0.42, op: 0.48 },
    'syncretic-ancestor-of':            { c: '#d4a55a', w: 0.40, op: 0.45 },
    'syncretic-sacred-marriage':        { c: '#a85e44', w: 0.36, op: 0.32 },
    'syncretic-identification':         { c: '#b08840', w: 0.32, op: 0.24 },
    'syncretic-continuous-development': { c: '#b08840', w: 0.32, op: 0.22 },
    'parent-of':                        { c: '#5a7458', w: 0.34, op: 0.30 },
    'child-of':                         { c: '#5a7458', w: 0.34, op: 0.24 },
    'consort':                          { c: '#a85e44', w: 0.36, op: 0.30 },
    // textual / scholarly — slate-teal-blue
    'polemic-against':                  { c: '#a83e4a', w: 0.38, op: 0.32 },
    'direct-quote':                     { c: '#4a8a86', w: 0.34, op: 0.28 },
    'redaction-of':                     { c: '#8a6a30', w: 0.32, op: 0.24 },
    'commentary-on':                    { c: '#8a6a8a', w: 0.30, op: 0.22 },
    'parallel-motif':                   { c: '#5a6a82', w: 0.28, op: 0.22 },
    'shared-milieu':                    { c: '#4a5aa4', w: 0.28, op: 0.20 },
    'shared-tradition':                 { c: '#4a5aa4', w: 0.28, op: 0.18 },
    'manuscript-transmission':          { c: '#6a5a40', w: 0.28, op: 0.20 },
    'influenced-by':                    { c: '#4a8a86', w: 0.30, op: 0.24 },
    'influences':                       { c: '#4a8a86', w: 0.30, op: 0.24 },
    // ambient / structural — barely-visible (flood types)
    'attests':                          { c: '#3a4a66', w: 0.22, op: 0.12 },
    'attested-in':                      { c: '#3a4a66', w: 0.22, op: 0.12 },
    'has-theme':                        { c: '#3a5a3e', w: 0.22, op: 0.12 },
    'context':                          { c: '#3a3e48', w: 0.22, op: 0.12 },
    'tradition-deity':                  { c: '#2f3a4e', w: 0.18, op: 0.10 },
    'tradition-doc':                    { c: '#2f3a4e', w: 0.18, op: 0.10 },
    'tradition-person':                 { c: '#2f3a4e', w: 0.18, op: 0.10 },
    'authored':                         { c: '#8a6a30', w: 0.30, op: 0.24 },
    // cross-symbol — color does the work; width 0.46 / op up to 0.55 for headline
    'ancestor-of':                      { c: '#d4a55a', w: 0.46, op: 0.55 },
    'parallel-form':                    { c: '#a08a5a', w: 0.34, op: 0.36 },
    'syncretic-fusion':                 { c: '#c47a3a', w: 0.42, op: 0.50 },
    'appropriated-by':                  { c: '#c4a05a', w: 0.42, op: 0.50 },
    'polemic-inversion':                { c: '#a83e4a', w: 0.46, op: 0.55 },
    'visual-cognate':                   { c: '#7a8090', w: 0.30, op: 0.28 },
    // symbol → other-node — high volume, nearly invisible
    'symbol-attests-in':                { c: '#6a7a90', w: 0.26, op: 0.16 },
    'symbol-iconography-of':            { c: '#8a6a5a', w: 0.28, op: 0.20 },
    'symbol-in-tradition':              { c: '#5a7080', w: 0.24, op: 0.14 }
  };
  // Cross-symbol edge types — mirror of production SYMBOL_CROSS_EDGE_TYPES.
  const SYMBOL_CROSS_EDGE_TYPES = new Set([
    'ancestor-of', 'parallel-form', 'syncretic-fusion',
    'appropriated-by', 'polemic-inversion', 'visual-cognate'
  ]);
  const MUSIC_CROSS_EDGE_TYPES = new Set([
    'ancestor-of', 'parallel-form', 'syncretic-fusion',
    'transmission-to', 'appropriated-by', 'child-of'
  ]);
  // `edgeStyleFor` is defined above as the bucket-aware version; the
  // per-type EDGE_STYLE map (kept for compat) is no longer consulted by it.
  const DEFAULT_EDGE_COLOR = BUCKETS.association.hex;

  // SOURCE-INTEGRITY TIER FILL COLORS — matches production CSS vars (app.css:59-63).
  // Used when _tierOverlay is active; replaces family-color fill on each node.
  const TIER_FILL = {
    '1':    '#d4a55a',  // T1: primary sources (deep gold)
    '2':    '#b8c3d0',  // T2: scholarly (silver)
    '3':    '#8a8a82',  // T3: reputable secondary (warm grey)
    '4':    '#a85a5a',  // T4: controversial-but-catalogued (muted crimson)
    'none': '#3e424a',  // no refs yet (faint near-black)
  };

  // Build a degree map from edges — used for sqrt-degree node sizing.
  function computeDegree(edges) {
    const d = new Map();
    edges.forEach(e => {
      d.set(e.source, (d.get(e.source) || 0) + 1);
      d.set(e.target, (d.get(e.target) || 0) + 1);
    });
    return d;
  }

  // ----- ANNULAR-WEDGE PATH GENERATOR -----
  // Mirror of d3.arc() with cornerRadius — produces a rounded annular wedge
  // matching production's .sector-hull geometry exactly. Returns SVG path d.
  //   a0, a1   start/end angles (radians)
  //   rIn,rOut inner / outer radius
  //   cr       corner radius (rounded "extruded-rect" look)
  //   pad      padAngle equivalent — angular padding subtracted from each side
  // NOTE: production polarXY convention is `x = r*sin(a), y = -r*cos(a)`
  // (12 o'clock = a=0). The wedge-positions function above uses the standard
  // math convention (`x=r*cos, y=r*sin`). To keep the hull paths aligned with
  // sigma's coordinate space, we use the SAME math convention here.
  function annularWedgePath(a0, a1, rIn, rOut, cr, pad) {
    const _pad = pad || 0;
    a0 += _pad; a1 -= _pad;
    if (a1 <= a0) return '';
    // Cap corner radius so it never exceeds half the radial span or arc gap.
    const maxByRadial = (rOut - rIn) / 2;
    const _cr = Math.max(0, Math.min(cr || 0, maxByRadial));
    // Math.cos/sin convention (x = r*cos(a), y = r*sin(a))
    const px = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
    // Inset angles for the corner-radius arc on inner/outer rims
    const dOut = _cr / Math.max(rOut, 1e-6);
    const dIn  = _cr / Math.max(rIn,  1e-6);
    const a0o = a0 + dOut, a1o = a1 - dOut;
    const a0i = a0 + dIn,  a1i = a1 - dIn;
    if (a1o <= a0o || a1i <= a0i) {
      // Wedge too narrow for rounded corners — fall back to plain arc.
      const [x0o, y0o] = px(rOut, a0);
      const [x1o, y1o] = px(rOut, a1);
      const [x1i, y1i] = px(rIn,  a1);
      const [x0i, y0i] = px(rIn,  a0);
      const large = (a1 - a0) > Math.PI ? 1 : 0;
      return `M ${x0o},${y0o} A ${rOut},${rOut} 0 ${large} 1 ${x1o},${y1o} L ${x1i},${y1i} A ${rIn},${rIn} 0 ${large} 0 ${x0i},${y0i} Z`;
    }
    // Corner-tangent points (where the corner arcs join the rim arcs / radial lines)
    const [x0oT, y0oT] = px(rOut, a0o);
    const [x1oT, y1oT] = px(rOut, a1o);
    const [x1iT, y1iT] = px(rIn,  a1i);
    const [x0iT, y0iT] = px(rIn,  a0i);
    // Corner-end points on the radial sides
    const [x0oR, y0oR] = px(rOut - _cr, a0);
    const [x1oR, y1oR] = px(rOut - _cr, a1);
    const [x1iR, y1iR] = px(rIn  + _cr, a1);
    const [x0iR, y0iR] = px(rIn  + _cr, a0);
    const large = (a1o - a0o) > Math.PI ? 1 : 0;
    // Build path: outer-rim arc → outer-end corner → end-radial → inner-end corner →
    // inner-rim arc (reversed) → inner-start corner → start-radial → outer-start corner → close
    return [
      `M ${x0oT},${y0oT}`,
      `A ${rOut},${rOut} 0 ${large} 1 ${x1oT},${y1oT}`,
      `A ${_cr},${_cr} 0 0 1 ${x1oR},${y1oR}`,
      `L ${x1iR},${y1iR}`,
      `A ${_cr},${_cr} 0 0 1 ${x1iT},${y1iT}`,
      `A ${rIn},${rIn} 0 ${large} 0 ${x0iT},${y0iT}`,
      `A ${_cr},${_cr} 0 0 1 ${x0iR},${y0iR}`,
      `L ${x0oR},${y0oR}`,
      `A ${_cr},${_cr} 0 0 1 ${x0oT},${y0oT}`,
      'Z'
    ].join(' ');
  }

  // ----- node filter by mode -----
  function filterNodesByMode(mode) {
    const DATA     = window.VAULT_DATA || { nodes: [], edges: [] };
    const EDGES    = DATA.edges || [];
    const NODES_BY_ID = window.NODES_BY_ID || {};
    let authorSet = null;
    if (mode === 'authors') {
      authorSet = new Set();
      const authorEdgeTypes = new Set(['authored', 'attributed-author', 'originated', 'key-figure']);
      EDGES.forEach(e => {
        if (!authorEdgeTypes.has(e.type)) return;
        const candidateId = (e.type === 'key-figure') ? e.target : e.source;
        const cand = NODES_BY_ID[candidateId];
        if (cand && cand.type === 'person') authorSet.add(candidateId);
      });
    }
    return (DATA.nodes || []).filter(n => {
      if (mode === 'deities')   return n.type === 'deity';
      if (mode === 'authors')   return n.type === 'person' && authorSet && authorSet.has(n.id);
      if (mode === 'symbols')   return n.type === 'symbol';
      if (mode === 'events')    return n.type === 'event';
      if (mode === 'music')        return n.type === 'music';
      if (mode === 'alphabet')     return n.type === 'alphabet';
      if (mode === 'rituals')      return n.type === 'ritual';
      if (mode === 'alchemy')      return n.type === 'alchemy';
      if (mode === 'morals')       return n.type === 'moral';
      if (mode === 'philosophy')   return n.type === 'philosophy';
      if (mode === 'medicine')     return n.type === 'medicine';
      if (mode === 'mathematics')  return n.type === 'mathematics';
      if (mode === 'monuments') {
        const tags = Array.isArray(n.tags) ? n.tags
          : (typeof n.tags === 'string' ? n.tags.split(/[,\s]+/) : []);
        return tags.includes('monument') || (n.category || '').toLowerCase() === 'monument';
      }
      return false;
    });
  }

  // ----- main render -----
  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';

    if (!window.Sigma || !window.graphology) {
      rootEl.innerHTML = '<div class="ph2-error">sigma.js / graphology not loaded</div>';
      return;
    }
    const data = window.VAULT_DATA || { nodes: [], edges: [] };
    const EDGES = data.edges || [];
    const FAMILIES = data.families || [];

    // Filter nodes for the current mode.
    const deities = filterNodesByMode(_currentMode);
    if (!deities.length) {
      const msgs = { deities: 'No deities in data.', authors: 'No authors found.',
        symbols: 'No symbols found.', events: 'No events found.',
        music: 'No music nodes found.', alphabet: 'No alphabet nodes found.',
        rituals: 'No ritual nodes found.', alchemy: 'No alchemy nodes found.',
        morals: 'No moral nodes found.', philosophy: 'No philosophy nodes found.',
        medicine: 'No medicine nodes found.', mathematics: 'No mathematics nodes found.',
        monuments: 'Monuments — add `tags: [monument]` to site nodes to populate this view.' };
      rootEl.innerHTML = `<div class="ph2-error">${msgs[_currentMode] || 'No nodes.'}</div>`;
      return;
    }

    // Build edge slice + degree FIRST so the wedge layout can sort by degree
    // (key figures gravitate to wedge center in the new spiral layout).
    const idSet = new Set(deities.map(d => d.id));
    const edges = EDGES.filter(e => idSet.has(e.source) && idSet.has(e.target));
    const degree = computeDegree(edges);
    // Expose for computeWedgePositions' sort (deg-DESC → top deity at center).
    window._codexDegreeHint = degree;

    // Compute wedge layout + per-node positions.
    const { positions, wedges, familyOrder, famByName, Rinner, Router } =
      computeWedgePositions(deities, FAMILIES);

    // Phase D — bake settled positions (force-relaxation pre-paint pass).
    // Lets siblings within a wedge nudge tangentially / radially around each
    // other for breathing room; hubs push minor deities sideways. Hard-clamped
    // to the wedge so nothing escapes. ~50 ms one-shot, zero ongoing perf cost.
    relaxPositions(deities, positions, wedges, Rinner, Router, degree, 250);

    // ----- build graphology graph -----
    const Graph = window.graphology.Graph || window.graphology.default || window.graphology;
    const graph = new Graph();

    // LABEL DENSITY (priority 2 of the parity brief) — production paints every
    // major-degree deity name (~50+ labels: Shiva, Indra, Krishna, Isis, Horus,
    // Zeus, Demeter, Athena, YHWH, Allah, Enlil, Ishtar, Mary, Jesus, …). We
    // mark a node as "hub" if its degree ≥ HUB_DEGREE_THRESHOLD so the label
    // mode 'hub' shows that wider set. Falls back to top-12 if the threshold
    // would yield fewer than 12 (small slices, e.g. monuments).
    const HUB_DEGREE_THRESHOLD = 6;
    const _sortedByDeg = [...degree.entries()].sort((a, b) => b[1] - a[1]);
    const aboveThreshold = _sortedByDeg.filter(e => e[1] >= HUB_DEGREE_THRESHOLD);
    const _hubIdSet = new Set(
      (aboveThreshold.length >= 12 ? aboveThreshold : _sortedByDeg.slice(0, 12))
        .map(e => e[0])
    );

    // ----- TIERED NODE SIZING -----
    // Key figures (Zeus, Jesus, YHWH, Ra, Indra) should LOOM larger than
    // minor deities. Compute degree quartiles across the visible slice and
    // assign tier radii — bigger steps than P1's [8, 6, 4.5, 3.5] so key
    // figures read clearly even at default zoom.
    const _degSorted = deities.map(d => degree.get(d.id) || 0).sort((a, b) => b - a);
    const _q = (p) => _degSorted[Math.floor(_degSorted.length * p)] || 0;
    const TIER_CUTOFFS = [_q(0.04), _q(0.15), _q(0.40)];   // top 4%, next 11%, next 25%, rest
    const TIER_RADIUS  = [13, 10, 7, 5];                    // px (production uses 8/6/4.5/3.5)
    function nodeSizeForDeg(deg) {
      if (deg >= TIER_CUTOFFS[0]) return TIER_RADIUS[0];
      if (deg >= TIER_CUTOFFS[1]) return TIER_RADIUS[1];
      if (deg >= TIER_CUTOFFS[2]) return TIER_RADIUS[2];
      return TIER_RADIUS[3];
    }

    deities.forEach(d => {
      const pos = positions.get(d.id);
      if (!pos) return;
      const deg = degree.get(d.id) || 0;
      graph.addNode(d.id, {
        x:       pos.x,
        y:       pos.y,
        size:    nodeSizeForDeg(deg),
        color:   d.family_color || d.tradition_color || '#7a8090',
        label:   d.title || d.id,
        _isHub:  _hubIdSet.has(d.id),
        _family: d.family || 'Other',
        _node:   d
      });
    });

    let _edgeCounter = 0;
    edges.forEach(e => {
      if (!graph.hasNode(e.source) || !graph.hasNode(e.target)) return;
      const key = `${e.source}__${e.target}__${e.type || 'rel'}__${_edgeCounter++}`;
      try {
        // size: 0 — sigma's straight-line edge program is suppressed.
        // The curved SVG overlay below paints the visible edge.
        graph.addEdgeWithKey(key, e.source, e.target, {
          size: 0,
          color: edgeStyleFor(e.type).hex,
          _type: e.type
        });
      } catch (err) { /* ignore parallel-edge collisions */ }
    });

    // ----- sigma renderer -----
    let _hoverId = null;
    let _selectedId = null;       // most-recently-clicked node (anchor of the locked set)
    let _lockedSet = new Set();   // additive selection — mirrors P1's STATE.lockedSet

    // INTERACTIVITY STATE — drives the reducers below.
    //   _labelsMode:  'hub' (degree≥HUB_DEGREE_THRESHOLD, default) | 'all' | 'off'
    //   _egoFocus:    when true + a node is selected, ONLY its 1-hop neighbourhood renders
    //   _familyFilter: Set<family-name> (empty = no filter, multi-select)
    //   _lockedSet:   persistent multi-select — clicking a node anywhere starts
    //                 the set; clicking a node that touches the existing set
    //                 ADDS its neighbourhood (P1's sticky/additive behaviour);
    //                 clicking a node that doesn't touch resets the set.
    //                 Empty stage click clears the set.
    let _labelsMode = 'hub';
    let _egoFocus = false;
    let _familyFilter = new Set();
    // Helper — is this family currently visible? True iff no filter active OR family is in the set.
    function famInFilter(fam) {
      return _familyFilter.size === 0 || _familyFilter.has(fam);
    }
    let _tierOverlay = false;

    // Cached 1-hop neighbourhood (incl. self) — used by additive selection
    // AND by the nodeReducer hover-dim check, which fires per node per frame.
    // graph.areNeighbors / hasEdge are O(degree) lookups; doing them 492×
    // every refresh adds up. Cache once, invalidate on graph rebuild (which
    // happens on full render() — this closure dies with each rebuild).
    const _neighborCache = new Map();
    function neighborhoodOf(id) {
      const cached = _neighborCache.get(id);
      if (cached) return cached;
      const out = new Set([id]);
      if (graph.hasNode(id)) graph.forEachNeighbor(id, (nid) => out.add(nid));
      _neighborCache.set(id, out);
      return out;
    }
    // Fast `is b in 1-hop(a)?` — both directions, no graph re-walk.
    function inNeighborhood(a, b) {
      if (a === b) return true;
      return neighborhoodOf(a).has(b);
    }

    // Single source of truth for "what state is this node in?"
    // Used by nodeReducer (color + zIndex + size), updateNodeLabelVisibility
    // (whether to force-show this label), and deconflict (priority ordering).
    //   HOVERED  — the node currently under the cursor, or the selected node
    //              if there's no hover. Always painted top, label always on.
    //   ACTIVE   — touched by the current focus (1-hop of hover OR member of
    //              _lockedSet). Full color, label always on regardless of
    //              degree threshold or distance from camera centre.
    //   DIM      — there IS a focus context, and this node is NOT in it.
    //              Original colour at 10% alpha, lowest zIndex.
    //   NORMAL   — no focus context anywhere; idle render.
    function nodeStateFor(id) {
      if (_hoverId === id) return 'HOVERED';
      if (!_hoverId && _selectedId === id && _lockedSet.size === 0) return 'HOVERED';
      if (_hoverId) {
        return inNeighborhood(_hoverId, id) ? 'ACTIVE' : 'DIM';
      }
      if (_lockedSet.size > 0) {
        return _lockedSet.has(id) ? 'ACTIVE' : 'DIM';
      }
      return 'NORMAL';
    }
    function isActiveOrHovered(id) {
      const s = nodeStateFor(id);
      return s === 'HOVERED' || s === 'ACTIVE';
    }

    const settings = {
      renderEdgeLabels: false,
      // Sigma's stock canvas edge program still strokes a 1-px hairline per
      // edge even with size: 0; making the default color fully transparent
      // suppresses it so only the curved SVG overlay paints visible edges.
      defaultEdgeColor: 'rgba(0,0,0,0)',
      defaultNodeColor: '#7a8090',
      // Custom hover renderer — sigma's default draws a label-background rect
      // even when label === '' (any string triggers it), producing a 5-px white
      // sliver to the right of the dot. Ours just paints the bumped-size dot,
      // no label box. Size bump itself lives in nodeReducer.
      defaultDrawNodeHover: (ctx, data) => {
        ctx.beginPath();
        ctx.arc(data.x, data.y, data.size + 0.5, 0, Math.PI * 2);
        ctx.fillStyle = data.color;
        ctx.closePath();
        ctx.fill();
      },
      // ZOOM SENSITIVITY — sigma's default 1.7 is too aggressive (compounds
      // wildly on trackpads), but 1.10 needed too many wheel ticks. 1.25 is
      // the sweet spot — a trackpad gesture reaches usable zoom in a single
      // motion without compounding into spaceland on a hard wheel.
      zoomingRatio:               1.25,
      zoomDuration:                160,
      doubleClickZoomingRatio:    1.50,
      doubleClickZoomingDuration:  220,
      labelColor: { color: '#cad0d8' },
      labelSize: 11,
      labelWeight: 400,
      labelFont: 'Cormorant Garamond, serif',
      // Density bumped from 0.5 → 1.0 + threshold from 7 → 4 (per brief priority 2)
      // so the 40-60 hub labels actually paint simultaneously.
      labelDensity: 1.0,
      labelGridCellSize: 60,
      labelRenderedSizeThreshold: 4,
      enableEdgeEvents: false,
      hideEdgesOnMove: true,
      hideLabelsOnMove: true,
      minCameraRatio: 0.05,
      maxCameraRatio: 8,
      // zIndex enabled so dim nodes paint BEHIND highlighted ones — fixes the
      zIndex: true,
      // ── NODE STATE MACHINE ───────────────────────────────────────────
      // One function decides the visual state of every node per frame. Four
      // mutually-exclusive states. The reducer below just applies the state.
      //
      //   HOVERED  — _hoverId === id, OR (_selectedId === id with no hover)
      //   ACTIVE   — in current focus set: 1-hop of hover, or in _lockedSet
      //   DIM      — there IS a focus, this node is NOT in it
      //   NORMAL   — no focus; idle render
      //
      //  Per-state attrs:
      //                size mult   zIndex   color                  label?
      //   HOVERED      +4 / +2      3       attrs.color (full)     ALWAYS
      //   ACTIVE       attrs.size   2       attrs.color (full)     ALWAYS
      //   DIM          attrs.size   0       rgba(...,0.10)         hidden
      //   NORMAL       attrs.size   1       attrs.color            by threshold
      //
      nodeReducer: (id, attrs) => {
        const out = { ...attrs };

        // DEV PANEL — live node-size multiplier
        const _devMult = window.CODEX_DEV?.settings?.nodeSizeMult;
        if (_devMult && _devMult !== 1) out.size = (attrs.size || 4) * _devMult;

        // EGO FOCUS short-circuit — hide everything outside the ego subgraph.
        if (_egoFocus && _selectedId) {
          if (!inNeighborhood(_selectedId, id)) { out.hidden = true; return out; }
        }
        // FAMILY FILTER short-circuit — fade by own color, lowest layer.
        if (!famInFilter(attrs._family)) {
          out.color  = withAlpha(attrs.color, 0.10);
          out.zIndex = 0;
          out.label  = '';
          return out;
        }
        // TIER OVERLAY — substitute family color with source-integrity tier.
        const baseColor = _tierOverlay
          ? (TIER_FILL[String((attrs._node || {})._tier ?? 'none')] || TIER_FILL.none)
          : attrs.color;

        const state = nodeStateFor(id);
        switch (state) {
          case 'HOVERED':
            out.size   = (out.size || 4) + (_hoverId === id ? 4 : 2);
            out.zIndex = 3;
            out.color  = baseColor;
            break;
          case 'ACTIVE':
            out.zIndex = 2;
            out.color  = baseColor;
            break;
          case 'DIM':
            out.color  = withAlpha(baseColor, 0.10);
            out.zIndex = 0;
            break;
          case 'NORMAL':
          default:
            out.color  = baseColor;
            out.zIndex = 1;
            break;
        }
        // DOM overlay handles all node labels — sigma's built-in suppressed.
        out.label = '';
        return out;
      },
      edgeReducer: (id, attrs) => {
        // Sigma edges are size 0 (curved overlay paints them) — reducer just
        // tracks visibility for hover state, used by overlay-sync below.
        return attrs;
      }
    };

    const sigma = new window.Sigma(graph, rootEl, settings);
    // Adaptive initial fit. Sigma's autofit places node bbox edge (Router=540)
    // at the smaller viewport dimension's edge — but rim labels sit at
    // Router+56=596 and need ~10% extra margin to read cleanly. Compute the
    // ratio dynamically from the pane size so the diagram fits whatever
    // window the user opens, instead of hardcoding for one resolution.
    function computeFitRatio() {
      try {
        const rect = rootEl.getBoundingClientRect();
        const minDim = Math.min(rect.width || 1, rect.height || 1);
        // World-space target: rim labels at radius 596 must fit with ~12% margin.
        // At ratio R, world radius 540 maps to (minDim/2) screen px. Solve for R
        // so that 596 / 540 × (minDim/2) × (1 - 0.12) ≤ (minDim/2).
        // → R = 596 / (540 × 0.88) ≈ 1.254. Add a small extra so the pane has
        //   breathing room on most desktop viewports.
        const aspect = (rect.width || 1) / (rect.height || 1);
        // Wider viewports (browser dominant) — give a touch more margin so
        // the diagram doesn't kiss the legend / detail rail. Square-ish
        // viewports get tighter fit.
        const margin = aspect > 1.6 ? 0.18 : aspect > 1.2 ? 0.15 : 0.12;
        const r = 596 / (540 * (1 - margin));
        return Math.max(1.20, Math.min(1.80, r));
      } catch (e) { return 1.32; }
    }
    function applyInitialFit() {
      try {
        // ALWAYS use computeFitRatio() for initial render. The dev-panel
        // cameraRatio slider is for live-tweaking AFTER the diagram lands —
        // it must not poison the reload-fit. The 100% button uses the same
        // path so reload and 100% click are guaranteed to match.
        const ratio = computeFitRatio();
        sigma.getCamera().setState({ ratio, x: 0.5, y: 0.5, angle: 0 });
        sigma.refresh();
      } catch (e) {}
    }
    // Two-pass fit: once on render (before sigma's first paint), again after
    // a resize so the diagram never lands cropped on first show.
    applyInitialFit();
    requestAnimationFrame(applyInitialFit);
    // ResizeObserver — re-fit if the pane size changes (window resize, nav toggle, etc.)
    try {
      const ro = new ResizeObserver(() => applyInitialFit());
      ro.observe(rootEl);
      // Stash so the parent can disconnect on teardown.
      rootEl._ph2Resize = ro;
    } catch (e) { /* ResizeObserver not available */ }

    // ============================================================
    // SVG OVERLAY — hulls (under canvas) + curved edges (under canvas).
    // Sigma's canvas sits ON TOP of this SVG via z-index, so dots paint
    // above edges and edges paint above hulls.
    // ============================================================
    const overlay = document.createElementNS(SVG_NS, 'svg');
    overlay.setAttribute('class', 'ph2-svg-overlay');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.width  = '100%';
    overlay.style.height = '100%';
    // The overlay must sit BEHIND sigma's canvas children. sigma adds canvases
    // with z-index that defaults to auto; setting z-index:0 on the SVG plus
    // letting canvases stay at auto (which paints over earlier siblings) keeps
    // them above the SVG. To be safe we insert the SVG as the FIRST child of
    // rootEl, so it's the lowest in the stacking order.
    if (rootEl.firstChild) rootEl.insertBefore(overlay, rootEl.firstChild);
    else rootEl.appendChild(overlay);

    // Two groups inside the overlay: hulls first (painted bottom), edges on top.
    const hullsG = document.createElementNS(SVG_NS, 'g');
    hullsG.setAttribute('class', 'ph2-hulls-g');
    overlay.appendChild(hullsG);
    const edgesG = document.createElementNS(SVG_NS, 'g');
    edgesG.setAttribute('class', 'ph2-edges-g');
    overlay.appendChild(edgesG);
    // Phase F — radial tick lines from hull outer rim to just inside each
    // family-rim label, matching production (app.js:1169-1177). Painted on
    // TOP of hulls + edges so they read as ownership cues for the labels.
    const ticksG = document.createElementNS(SVG_NS, 'g');
    ticksG.setAttribute('class', 'ph2-ticks-g');
    overlay.appendChild(ticksG);
    // (Phase H gradients removed — P1 doesn't have them; we copy P1 verbatim now.)

    // ----- HULLS (priority 1) -----
    // For each family, draw a rounded annular wedge at the same geometry as
    // production's `.sector-hull` (Rinner-22 → Router+22, padAngle 0.014,
    // cornerRadius 8). The path is drawn in WORLD coordinates (centered on
    // origin, same coord-space as graph nodes). On every sigma camera change
    // we re-project to screen coords by computing the viewport position of
    // origin + a unit reference and applying the resulting translate+scale
    // to the SVG `<g>`'s transform.
    const HULL_INNER = Rinner - 22;
    const HULL_OUTER = Router + 22;
    const HULL_PAD   = 0.014;
    // Was 8 — narrow wedges fell back to plain arc (no rounding), making the
    // ring read as inconsistent (some round, some sharp). 4 fits inside every
    // wedge so all of them get rounded corners.
    const HULL_CR    = 4;
    const hullEls = [];
    const tickEls = [];
    Object.values(wedges).forEach(w => {
      if (!w.members.length) return;
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('class', 'ph2-hull');
      path.setAttribute('d', annularWedgePath(w.a0, w.a1, HULL_INNER, HULL_OUTER, HULL_CR, HULL_PAD));
      path.setAttribute('fill', w.color);
      path.setAttribute('stroke', w.color);
      path.dataset.family = w.name;
      // CLICK-A-HULL → isolate that family. Click again on same hull to clear.
      // Background click (stage) and deity click already clear via clickStage.
      path.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const fam = w.name;
        // Toggle this family's membership in the multi-select filter set.
        if (_familyFilter.has(fam)) _familyFilter.delete(fam);
        else                         _familyFilter.add(fam);
        _lockedSet = new Set();
        _selectedId = null;
        _hoverId = null;
        applyHullFilterState();
        applyEdgeHoverState();
        if (typeof applyLabelHoverDim === 'function') applyLabelHoverDim();
        if (typeof updateNodeLabelVisibility === 'function') updateNodeLabelVisibility();
        if (typeof syncFamilyMenu === 'function') syncFamilyMenu();
        sigma.refresh({ skipIndexation: true });
      });
      hullsG.appendChild(path);
      hullEls.push(path);
      // Phase F — radial tick line: from inside the hull's outer rim out
      // toward the family label. Production geometry (app.js:1169-1177):
      // Router+6 → Router+38 (hull outer is Router+22, label is at +56).
      const tick = document.createElementNS(SVG_NS, 'line');
      const cx0 = (Router +  6) * Math.cos(w.center);
      const cy0 = (Router +  6) * Math.sin(w.center);
      const cx1 = (Router + 38) * Math.cos(w.center);
      const cy1 = (Router + 38) * Math.sin(w.center);
      tick.setAttribute('x1', cx0); tick.setAttribute('y1', cy0);
      tick.setAttribute('x2', cx1); tick.setAttribute('y2', cy1);
      tick.setAttribute('stroke', w.color);
      tick.setAttribute('class', 'ph2-rim-tick');
      tick.dataset.family = w.name;
      ticksG.appendChild(tick);
      tickEls.push(tick);
    });

    // ----- CURVED EDGES with 7-bucket palette + directional gradients ----
    // (Implementation of AUDIT/edge-color-spec-2026-05-17.md.)
    // For every directional edge we pre-build a <linearGradient> in the SVG
    // <defs>, attached to its semantic origin → terminus. The gradient
    // paints on .hot (and on idle for HEADLINE buckets / ancestor-of).
    const EDGE_PULL = 0.35;
    const edgeEls   = [];
    const defsEl    = document.createElementNS(SVG_NS, 'defs');
    edgesG.appendChild(defsEl);
    let _gradCounter = 0;
    edges.forEach(e => {
      const sp = positions.get(e.source);
      const tp = positions.get(e.target);
      if (!sp || !tp) return;
      const mx = (sp.x + tp.x) / 2;
      const my = (sp.y + tp.y) / 2;
      const cxp = mx + (0 - mx) * EDGE_PULL;
      const cyp = my + (0 - my) * EDGE_PULL;
      const st  = edgeStyleFor(e.type);

      const path = document.createElementNS(SVG_NS, 'path');
      let cls = 'ph2-edge';
      if (st.headline)    cls += ' ph2-edge-headline';
      if (st.directional) cls += ' ph2-edge-directional';
      if (_currentMode === 'symbols' && SYMBOL_CROSS_EDGE_TYPES.has(e.type)) {
        cls += ' xsym';
        const sNode = window.NODES_BY_ID && window.NODES_BY_ID[e.source];
        const tNode = window.NODES_BY_ID && window.NODES_BY_ID[e.target];
        if (sNode && tNode && (sNode.family || 'Other') !== (tNode.family || 'Other')) cls += ' xsym-xfamily';
      }
      if (_currentMode === 'music' && MUSIC_CROSS_EDGE_TYPES.has(e.type)) {
        cls += ' xsym';
        const sNode = window.NODES_BY_ID && window.NODES_BY_ID[e.source];
        const tNode = window.NODES_BY_ID && window.NODES_BY_ID[e.target];
        if (sNode && tNode && (sNode.family || 'Other') !== (tNode.family || 'Other')) cls += ' xsym-xfamily';
      }
      path.setAttribute('class', cls);
      path.setAttribute('d', `M ${sp.x},${sp.y} Q ${cxp},${cyp} ${tp.x},${tp.y}`);
      // Per-edge CSS vars consumed by .ph2-edge CSS calc (dev-panel mults).
      path.style.setProperty('--edge-bucket-color', st.c);
      path.style.setProperty('--base-op',           st.op);
      path.style.setProperty('--base-w',            st.w);
      path.style.setProperty('--hot-op',            st.hotOp);
      path.setAttribute('stroke-width',   st.w);
      path.setAttribute('stroke-opacity', st.op);
      path.setAttribute('fill', 'none');
      path.dataset.source = e.source;
      path.dataset.target = e.target;
      path.dataset.type   = e.type || '';
      path.dataset.bucket = st.bucket;

      // Pre-build the directional <linearGradient> if applicable. The
      // gradient lives in <defs>; the path activates it on .hot via JS in
      // applyEdgeHoverState (or always for HEADLINE directional types).
      if (st.directional) {
        const gid = 'eg-' + (_gradCounter++);
        const grad = document.createElementNS(SVG_NS, 'linearGradient');
        grad.setAttribute('id', gid);
        grad.setAttribute('gradientUnits', 'userSpaceOnUse');
        const x1 = st.reverse ? tp.x : sp.x;
        const y1 = st.reverse ? tp.y : sp.y;
        const x2 = st.reverse ? sp.x : tp.x;
        const y2 = st.reverse ? sp.y : tp.y;
        grad.setAttribute('x1', x1); grad.setAttribute('y1', y1);
        grad.setAttribute('x2', x2); grad.setAttribute('y2', y2);
        const stop0 = document.createElementNS(SVG_NS, 'stop');
        stop0.setAttribute('offset', '0%');
        stop0.setAttribute('stop-color', st.c);
        stop0.setAttribute('stop-opacity', '0.95');
        const stop1 = document.createElementNS(SVG_NS, 'stop');
        stop1.setAttribute('offset', '100%');
        stop1.setAttribute('stop-color', st.c);
        stop1.setAttribute('stop-opacity', '0.35');
        grad.appendChild(stop0);
        grad.appendChild(stop1);
        defsEl.appendChild(grad);
        path.dataset.gradId = gid;
        // For headline directional edges (ancestor-of), paint the gradient at
        // idle too — the user sees the directionality without needing to hover.
        if (st.headline) path.style.stroke = 'url(#' + gid + ')';
      }

      edgesG.appendChild(path);
      edgeEls.push({ el: path, s: e.source, t: e.target, st });
    });

    // Index edges by node for fast drag-time path updates.
    const edgesByNode = new Map();   // nodeId → array of edgeEls entries
    edgeEls.forEach(entry => {
      if (!edgesByNode.has(entry.s)) edgesByNode.set(entry.s, []);
      if (!edgesByNode.has(entry.t)) edgesByNode.set(entry.t, []);
      edgesByNode.get(entry.s).push(entry);
      edgesByNode.get(entry.t).push(entry);
    });
    // Rebuild path `d` for every edge incident to `nodeId`. Used by drag.
    function rebuildEdgesForNode(nodeId) {
      const list = edgesByNode.get(nodeId);
      if (!list) return;
      const EP = EDGE_PULL;
      for (const { el, s, t } of list) {
        const sp = positions.get(s), tp = positions.get(t);
        if (!sp || !tp) continue;
        const mx = (sp.x + tp.x) / 2, my = (sp.y + tp.y) / 2;
        const cxp = mx + (0 - mx) * EP, cyp = my + (0 - my) * EP;
        el.setAttribute('d', `M ${sp.x},${sp.y} Q ${cxp},${cyp} ${tp.x},${tp.y}`);
      }
    }

    // Dev panel hook — expose sigma + overlay data for live-tweaking.
    if (window.CODEX_DEV) {
      window.CODEX_DEV._sigma     = sigma;
      window.CODEX_DEV._edgeEls   = edgeEls;
      window.CODEX_DEV._positions = positions;
    }

    // ── THUMBNAIL FILL OVERLAY ──────────────────────────────────────────
    // Sits ABOVE sigma's node canvas (so the photo covers the dot fill, not
    // sits behind it). A separate top-layer SVG is appended to rootEl AFTER
    // sigma was constructed, so it's the last sibling in paint order.
    // Hidden by default; toggled via the toolbar "photos" button.
    const thumbsLayer = document.createElementNS(SVG_NS, 'svg');
    thumbsLayer.setAttribute('class', 'ph2-thumbs-layer');
    thumbsLayer.setAttribute('aria-hidden', 'true');
    thumbsLayer.style.position = 'absolute';
    thumbsLayer.style.inset = '0';
    thumbsLayer.style.pointerEvents = 'none';
    thumbsLayer.style.width = '100%';
    thumbsLayer.style.height = '100%';
    thumbsLayer.style.display = 'none';
    rootEl.appendChild(thumbsLayer);   // appended AFTER sigma's canvases
    const thumbsG = document.createElementNS(SVG_NS, 'g');
    thumbsG.setAttribute('class', 'ph2-thumbs-g');
    thumbsLayer.appendChild(thumbsG);
    const thumbEntries = [];               // { el, id, wx, wy, baseR }
    deities.forEach(d => {
      if (!d.thumbnail) return;
      const pos = positions.get(d.id);
      if (!pos) return;
      const deg = degree.get(d.id) || 0;
      const baseR = nodeSizeForDeg(deg);
      // <clipPath> per image — required to clip to a circle at the
      // image's location. defs-based shared clip wouldn't follow per-image.
      const clipId = 'ph2-thumb-clip-' + d.id.replace(/[^a-z0-9_-]/gi, '_');
      const defs = document.createElementNS(SVG_NS, 'defs');
      const clip = document.createElementNS(SVG_NS, 'clipPath');
      clip.setAttribute('id', clipId);
      const clipCircle = document.createElementNS(SVG_NS, 'circle');
      clip.appendChild(clipCircle);
      defs.appendChild(clip);
      thumbsG.appendChild(defs);
      const img = document.createElementNS(SVG_NS, 'image');
      img.setAttribute('href', d.thumbnail);
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', d.thumbnail);
      img.setAttribute('clip-path', 'url(#' + clipId + ')');
      img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      thumbsG.appendChild(img);
      thumbEntries.push({ el: img, clipCircle, id: d.id, wx: pos.x, wy: pos.y, baseR });
    });
    function syncThumbsImmediate() {
      if (thumbsLayer.style.display === 'none') return;
      const mult = window.CODEX_DEV?.settings?.nodeSizeMult || 1;
      for (let i = 0; i < thumbEntries.length; i++) {
        const T = thumbEntries[i];
        const pos = positions.get(T.id) || { x: T.wx, y: T.wy };
        const screen = sigma.graphToViewport({ x: pos.x, y: pos.y });
        const r = (T.baseR * mult) * 1.4;
        const d = r * 2;
        T.el.setAttribute('x', screen.x - r);
        T.el.setAttribute('y', screen.y - r);
        T.el.setAttribute('width',  d);
        T.el.setAttribute('height', d);
        T.clipCircle.setAttribute('cx', screen.x);
        T.clipCircle.setAttribute('cy', screen.y);
        T.clipCircle.setAttribute('r',  r);
      }
    }
    function setThumbsEnabled(on) {
      thumbsLayer.style.display = on ? '' : 'none';
      if (on) syncThumbsImmediate();
    }

    // Build neighbour index for fast hover dim/highlight on the edge overlay.
    const neighborIdx = new Map();
    edges.forEach(e => {
      if (!neighborIdx.has(e.source)) neighborIdx.set(e.source, new Set());
      if (!neighborIdx.has(e.target)) neighborIdx.set(e.target, new Set());
      neighborIdx.get(e.source).add(e.target);
      neighborIdx.get(e.target).add(e.source);
    });

    // ----- CAMERA → SVG SYNC -----
    // Compute a 2D affine transform mapping world coords → screen coords by
    // probing two reference points via sigma.graphToViewport.
    function syncOverlay() {
      // Probe sigma's world→viewport mapping on BOTH axes. Sigma uses math
      // convention (Y up) internally; SVG uses canvas convention (Y down).
      // Sample (0,0), (1,0), (0,1) to recover sx and sy separately — sy will
      // be negative when sigma flips Y. Without this flip, every hull and
      // edge in the overlay paints mirrored across the horizontal axis from
      // where sigma renders its nodes (the bug observed in opus-pantheon-v2-
      // labels-1 — nodes upper-right, hulls lower-right).
      const o = sigma.graphToViewport({ x: 0, y: 0 });
      const ux = sigma.graphToViewport({ x: 1, y: 0 });
      const uy = sigma.graphToViewport({ x: 0, y: 1 });
      const sx = (ux.x - o.x) || 1;
      const sy = (uy.y - o.y) || 1;
      const transform = `translate(${o.x} ${o.y}) scale(${sx} ${sy})`;
      hullsG.setAttribute('transform', transform);
      edgesG.setAttribute('transform', transform);
      ticksG.setAttribute('transform', transform);
    }

    // ----- HOVER + LOCK DIM ON EDGES (mirrors sigma's reducer behaviour) -----
    // Three priority layers, top wins:
    //   (1) hover present   → incident hot, rest dim
    //   (2) locked set      → edges where BOTH endpoints in set hot, rest dim
    //   (3) idle            → all idle
    function applyEdgeHoverState() {
      // setHotEdge — toggles the .hot class AND swaps the inline stroke to
      // the directional gradient (if any). On .dim/idle the inline stroke
      // is cleared so CSS resumes ownership.
      function setHot(el, hot, st) {
        if (hot) {
          el.classList.add('hot');
          el.classList.remove('dim');
          if (st.directional && el.dataset.gradId) {
            el.style.stroke = 'url(#' + el.dataset.gradId + ')';
          }
        } else {
          el.classList.remove('hot');
          // Clear the gradient inline override so the CSS rule for headline /
          // non-headline takes over again. (HEADLINE directional edges set
          // their idle gradient inline at build time — preserve that.)
          if (el.dataset.gradId && !el.classList.contains('ph2-edge-headline')) {
            el.style.stroke = '';
          }
        }
      }
      if (_hoverId) {
        edgeEls.forEach(({ el, s, t, st }) => {
          const incident = (s === _hoverId || t === _hoverId);
          setHot(el, incident, st);
          el.classList.toggle('dim', !incident);
        });
        return;
      }
      if (_lockedSet.size > 0) {
        edgeEls.forEach(({ el, s, t, st }) => {
          const inLock = _lockedSet.has(s) && _lockedSet.has(t);
          setHot(el, inLock, st);
          el.classList.toggle('dim', !inLock);
        });
        return;
      }
      edgeEls.forEach(({ el, st }) => {
        setHot(el, false, st);
        el.classList.remove('dim');
      });
    }
    function applyHullFilterState() {
      const filtering = _familyFilter.size > 0;
      hullEls.forEach(el => {
        const fam = el.dataset.family;
        const isIn = _familyFilter.has(fam);
        el.classList.toggle('hot', filtering && isIn);
        el.classList.toggle('dim', filtering && !isIn);
      });
      tickEls.forEach(el => {
        const fam = el.dataset.family;
        el.classList.toggle('dim', filtering && !_familyFilter.has(fam));
      });
    }

    syncOverlay();
    sigma.on('afterRender', syncOverlay);

    // ----- THUMBNAIL HOVER CARD (priority 4) -----
    // Production uses showTooltip() with tooltipThumb() — a unified card with
    // image, title, family·tradition, connection-count, and an optional
    // wikipedia link. We build a dedicated card so the global #tooltip stays
    // owned by the production views.
    const thumbCard = document.createElement('div');
    thumbCard.className = 'ph2-thumb-card';
    thumbCard.style.display = 'none';
    rootEl.appendChild(thumbCard);

    function wikiUrlFromRefs(refs) {
      if (!Array.isArray(refs)) return null;
      for (const r of refs) {
        if (!r) continue;
        const url = (typeof r === 'string') ? r : (r.url || r.href || '');
        if (typeof url === 'string' && /wikipedia\.org\/wiki\//.test(url)) return url;
      }
      return null;
    }
    function showThumbCard(nodeAttrs, evt) {
      const n = nodeAttrs._node || {};
      const thumb = n.thumbnail || (Array.isArray(n.depictions) && n.depictions[0] && n.depictions[0].src);
      const deg = graph.degree(n.id || '') || 0;
      const wiki = wikiUrlFromRefs(n.refs);
      const family = nodeAttrs._family || n.family || '—';
      const tradition = n.tradition || '';
      const meta1 = family + (tradition ? ' · ' + tradition : '');
      // Horizontal card layout — circular avatar + .ph2-thumb-body text column.
      const meta2 = deg + ' connection' + (deg === 1 ? '' : 's') +
                    (n.geo && n.geo.label ? ' · ' + escapeHtml(n.geo.label) : '');
      thumbCard.innerHTML = [
        thumb ? `<img class="ph2-thumb-img" src="${escapeAttr(thumb)}" alt="" onerror="this.remove()"/>` : '',
        '<div class="ph2-thumb-body">',
          `<div class="ph2-thumb-title">${escapeHtml(n.title || n.id || '')}</div>`,
          `<div class="ph2-thumb-meta">${escapeHtml(meta1)}</div>`,
          `<div class="ph2-thumb-meta">${meta2}</div>`,
          wiki ? `<a class="ph2-thumb-link" href="${escapeAttr(wiki)}" target="_blank" rel="noopener">Wikipedia →</a>` : '',
        '</div>'
      ].join('');
      thumbCard.style.display = 'block';
      positionThumbCard(evt);
    }
    function positionThumbCard(evt) {
      if (!evt) return;
      // evt may be a sigma event with .event.original (a MouseEvent) or a
      // direct MouseEvent passed from a DOM listener.
      const mouse = (evt && evt.event && evt.event.original) ? evt.event.original
                  : (evt && evt.clientX !== undefined ? evt : null);
      if (!mouse) return;
      // Position relative to the viewport; the card is position:fixed in CSS.
      const x = (mouse.clientX || 0) + 14;
      const y = (mouse.clientY || 0) + 14;
      thumbCard.style.left = x + 'px';
      thumbCard.style.top  = y + 'px';
    }
    function hideThumbCard() { thumbCard.style.display = 'none'; }

    // ----- SIGMA EVENTS -----
    sigma.on('enterNode', (e) => {
      _hoverId = e.node;
      sigma.refresh({ skipIndexation: true });
      applyEdgeHoverState();
      if (typeof applyLabelHoverDim === 'function') applyLabelHoverDim();
      const attrs = graph.getNodeAttributes(e.node);
      showThumbCard(attrs, e);
    });
    sigma.on('leaveNode', () => {
      _hoverId = null;
      sigma.refresh({ skipIndexation: true });
      applyEdgeHoverState();
      if (typeof applyLabelHoverDim === 'function') applyLabelHoverDim();
      hideThumbCard();
    });
    // Track raw mouse for card positioning — sigma's stage-mousemove fires
    // continuously; cheaper to listen on the root.
    // PREMIUM LIVENESS — Cosmograph's `simulationRepulsionFromMouse` trick:
    // nearby nodes gently push away from the cursor. Adds "alive" feel
    // without a live force-simulation. See AUDIT/premium-dynamics-research.
    let _mouseWorld = null;    // {x, y} in graph coords, or null when cursor off-canvas
    const _nudges = new Map(); // nodeId → {dx, dy} current displacement from anchor
    // Tuned subtle — was "magnet" (NUDGE_MAX 6, RADIUS 110); user could not click nodes.
    // Now: only the OUTER ring of neighbours nudges; closest stays put for clickability.
    const NUDGE_RADIUS  = 70;  // world-units: smaller proximity window
    const NUDGE_DEAD    = 14;  // world-units: nodes inside this stay still (clickable)
    const NUDGE_MAX     = 1.2; // world-units: max displacement (subtle breathe, not push)
    const NUDGE_LERP    = 0.12;// per-frame approach (slower = more damped)
    const NUDGE_DECAY   = 0.90;
    let _rafId = null;
    function tickLiveness() {
      let anyChange = false;
      // Compute target nudge per node + lerp current toward target
      positions.forEach((p, id) => {
        let tx = 0, ty = 0;
        if (_mouseWorld) {
          const dx = p.x - _mouseWorld.x;
          const dy = p.y - _mouseWorld.y;
          const dist = Math.hypot(dx, dy);
          // Dead zone — the closest node(s) MUST stay clickable
          if (dist > NUDGE_DEAD && dist < NUDGE_RADIUS) {
            const span = NUDGE_RADIUS - NUDGE_DEAD;
            const fall = 1 - ((dist - NUDGE_DEAD) / span);   // 1 just outside dead zone, 0 at radius
            const mag  = NUDGE_MAX * fall * fall;            // quadratic falloff
            tx = (dx / dist) * mag;
            ty = (dy / dist) * mag;
          }
        }
        const cur = _nudges.get(id) || { dx: 0, dy: 0 };
        // Lerp toward target; if no mouse, target=0 with stronger decay
        if (_mouseWorld) {
          cur.dx += (tx - cur.dx) * NUDGE_LERP;
          cur.dy += (ty - cur.dy) * NUDGE_LERP;
        } else {
          cur.dx *= NUDGE_DECAY;
          cur.dy *= NUDGE_DECAY;
        }
        if (Math.abs(cur.dx) < 0.02 && Math.abs(cur.dy) < 0.02) {
          if (_nudges.has(id)) { _nudges.delete(id); anyChange = true; }
        } else {
          _nudges.set(id, cur);
          anyChange = true;
          // Push the displacement into the live graph node so sigma paints it.
          if (graph.hasNode(id)) {
            graph.setNodeAttribute(id, 'x', p.x + cur.dx);
            graph.setNodeAttribute(id, 'y', p.y + cur.dy);
          }
        }
      });
      if (anyChange) sigma.refresh({ skipIndexation: true });
      // Stop the loop when nothing's moving and cursor is gone
      if (_nudges.size === 0 && !_mouseWorld) { _rafId = null; return; }
      _rafId = requestAnimationFrame(tickLiveness);
    }
    function kickLiveness() {
      if (_rafId == null) _rafId = requestAnimationFrame(tickLiveness);
    }
    rootEl.addEventListener('mousemove', (mev) => {
      if (thumbCard.style.display === 'block') positionThumbCard(mev);
      // Translate viewport (relative to container) → world coords via sigma camera.
      const rect = rootEl.getBoundingClientRect();
      const vx = mev.clientX - rect.left;
      const vy = mev.clientY - rect.top;
      try { _mouseWorld = sigma.viewportToGraph({ x: vx, y: vy }); } catch (e) { _mouseWorld = null; }
      kickLiveness();
    });
    rootEl.addEventListener('mouseleave', () => {
      _mouseWorld = null;
      kickLiveness();
    });
    // CLICK NODE — additive multi-select (P1 parity, app.js:1274-1291).
    // First click on empty state → lockedSet = node + 1-hop neighbours.
    // Subsequent click whose neighbourhood TOUCHES the existing lock →
    //   ADDS those neighbours (extends the investigation subgraph).
    // Subsequent click whose neighbourhood does NOT touch the lock →
    //   RESETS the lock to this node + neighbours.
    // ALWAYS-ADD selection: every node click extends the locked set with
    // that node + its 1-hop neighbours. The "touch / reset" heuristic was
    // confusing — pure additive is the right mental model. Empty stage
    // click clears the whole set.
    sigma.on('clickNode', ({ node }) => {
      _selectedId = node;
      const nbrs = neighborhoodOf(node);
      nbrs.forEach(id => _lockedSet.add(id));
      sigma.refresh({ skipIndexation: true });
      applyEdgeHoverState();
      if (typeof applyLabelHoverDim === 'function') applyLabelHoverDim();
      if (window.selectNode) window.selectNode(node, true);
    });
    sigma.on('clickStage', () => {
      // Clicking empty stage clears the LOCKED selection + the family-isolate
      // filter set by hull click. Deity-click flow is handled separately and
      // does NOT clear the family filter (clicking a node inside the isolate
      // narrows further; user needs an explicit empty click to fully reset).
      _selectedId   = null;
      _hoverId      = null;
      _lockedSet    = new Set();
      _familyFilter = new Set();
      sigma.refresh({ skipIndexation: true });
      applyEdgeHoverState();
      applyHullFilterState();
      if (typeof applyLabelHoverDim === 'function') applyLabelHoverDim();
      if (typeof updateNodeLabelVisibility === 'function') updateNodeLabelVisibility();
      if (typeof syncFamilyMenu === 'function') syncFamilyMenu();
      hideThumbCard();
    });
    // Double-click on empty = animated reset to computeFitRatio (same view
    // as the 100% button, no slider value, no surprise).
    sigma.on('doubleClickStage', ({ event }) => {
      if (event && event.preventSigmaDefault) event.preventSigmaDefault();
      try {
        const ratio = computeFitRatio();
        sigma.getCamera().animate({ x: 0.5, y: 0.5, ratio, angle: 0 }, { duration: 320 });
      } catch (e) {}
    });

    // ----- NODE DRAG (P1 parity) -----
    // Grab a deity dot and slide it inside its family wedge. The wedge clamp
    // mirrors the bake's soft-radial-clamp + angular clamp, so a dragged node
    // can bleed slightly past the rim but never escapes the family arc — the
    // hull boundary always reads. Camera pan is suppressed while dragging via
    // event.preventSigmaDefault().
    const _wedgeByFam = wedges; // family-name → wedge entry
    let _draggedId  = null;
    let _dragMoved  = false;    // track real movement to skip click suppression on noise
    function clampToWedge(world, fam) {
      const w = _wedgeByFam[fam];
      let r   = Math.hypot(world.x, world.y) || 0.0001;
      let ang = Math.atan2(world.y, world.x);
      if (w) {
        let delta = ((ang - w.center + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const halfArc = (w.a1 - w.a0) / 2;
        const padA    = Math.min(0.030, halfArc * 0.22);
        const maxDelta = Math.max(0, halfArc - padA);
        if (delta >  maxDelta) ang = w.center + maxDelta;
        if (delta < -maxDelta) ang = w.center - maxDelta;
      }
      // Soft radial clamp matching the bake (Rinner=220, Router=540, PAD=8, BLEED=6)
      const Rin = 220, Rout = 540, PAD = 8, BLEED = 6;
      if (r < Rin + PAD - BLEED)  r = Rin + PAD - BLEED;
      if (r > Rout - PAD + BLEED) r = Rout - PAD + BLEED;
      return { x: r * Math.cos(ang), y: r * Math.sin(ang) };
    }
    sigma.on('downNode', ({ node, event }) => {
      _draggedId = node;
      _dragMoved = false;
      if (event && event.preventSigmaDefault) event.preventSigmaDefault();
    });
    sigma.getMouseCaptor().on('mousemovebody', (e) => {
      if (!_draggedId) return;
      if (e.preventSigmaDefault) e.preventSigmaDefault();
      if (e.original && e.original.preventDefault) e.original.preventDefault();
      _dragMoved = true;
      const world = sigma.viewportToGraph({ x: e.x, y: e.y });
      const fam   = graph.getNodeAttribute(_draggedId, '_family') || 'Other';
      const pos   = clampToWedge(world, fam);
      // Update sigma graph (paint), positions Map (anchor/nudge cache),
      // AND rebuild every incident SVG edge so the connections track the dot.
      graph.setNodeAttribute(_draggedId, 'x', pos.x);
      graph.setNodeAttribute(_draggedId, 'y', pos.y);
      positions.set(_draggedId, { x: pos.x, y: pos.y });
      rebuildEdgesForNode(_draggedId);
      sigma.refresh({ skipIndexation: true });
    });
    function _endDrag() {
      if (!_draggedId) return;
      _draggedId = null;
      // Swallow the synthetic click that follows a real drag so we don't
      // accidentally reset the locked set when releasing the dot.
      if (_dragMoved) {
        const swallow = (e) => { e.stopPropagation(); e.preventDefault(); window.removeEventListener('click', swallow, true); };
        window.addEventListener('click', swallow, true);
        setTimeout(() => window.removeEventListener('click', swallow, true), 30);
      }
    }
    sigma.getMouseCaptor().on('mouseup', _endDrag);

    // Tangential family rim labels — DOM overlay synced to sigma camera.
    const rimOverlay = buildRimLabels(rootEl, wedges, sigma, _familyFilter);

    // ============================================================
    // PHASE E — DOM NODE LABELS + DECONFLICTION
    // ============================================================
    // Sigma's stock labels paint at each node's center and de-overlap via a
    // grid — but the grid just *hides* collisions, it doesn't move labels
    // out of the way. Result: 40-60 labels piled up on the inner ring.
    //
    // Production uses SVG <text> in a dedicated layer, positioned ABOVE each
    // node (dy = -(7 + √deg × 1.8)), with a stroke-paint halo, and runs a
    // greedy-by-degree deconfliction pass at the end of the force-sim.
    //
    // V2 mirror: a DOM overlay (one <div> per deity) synced to sigma's
    // camera on every afterRender. Label IS centered above its node by
    // CSS transform; halo is text-shadow. Deconflict runs ~60 ms after
    // each sync settles, hiding lower-degree labels that overlap higher-
    // degree ones.
    const nodeLabelOverlay = document.createElement('div');
    nodeLabelOverlay.className = 'ph2-node-labels-overlay';
    nodeLabelOverlay.setAttribute('aria-hidden', 'true');
    rootEl.appendChild(nodeLabelOverlay);

    const nodeLabelEntries = [];
    deities.forEach(d => {
      const pos = positions.get(d.id);
      if (!pos) return;
      const deg = degree.get(d.id) || 0;
      const el = document.createElement('div');
      el.className = 'ph2-node-label' + (_hubIdSet.has(d.id) ? ' hub' : '');
      el.dataset.nodeId = d.id;
      el.dataset.family = d.family || 'Other';
      // Two-line stacking for slashed double-names ("Enki / Ea", "Inanna / Ishtar")
      const title = d.title || d.id || '';
      if (/\s+\/\s+/.test(title) && title.length < 32) {
        const parts = title.split(/\s+\/\s+/);
        el.innerHTML = '<span>' + escapeHtml(parts[0]) + '</span>' +
                       '<br><span>' + escapeHtml(parts.slice(1).join(' / ')) + '</span>';
      } else {
        el.textContent = title;
      }
      nodeLabelOverlay.appendChild(el);
      nodeLabelEntries.push({
        el, id: d.id, family: d.family || 'Other',
        wx: pos.x, wy: pos.y,
        deg,
        dy: 7 + Math.sqrt(deg) * 1.5  // pixels above the node, scales with size
      });
    });

    // ZOOM-TIERED degree threshold: as the user zooms in, lower-degree deities
    // earn their label slot. The deconfliction pass still culls overlaps, so
    // tighter rings auto-thin. At default ratio (~1.32) you see the top hubs;
    // zoom to ~0.5 to read the minor pantheon members.
    // Smooth gradient: at the 100% fit ratio (~1.32) the user-specified
    // threshold (default 10) gates only the top hubs; as the user zooms IN
    // (ratio shrinks toward 0.30), the threshold drops linearly toward 1.
    // No more stepped jumps — labels reveal continuously with zoom.
    function dynamicHubThreshold() {
      let ratio = 1.32;
      try { ratio = sigma.getCamera().getState().ratio || 1.32; } catch (e) {}
      // User can pin a manual ceiling via dev panel (defaults to 10 = "show
      // the top hubs at 100% zoom"). We never go ABOVE that.
      const HIGH = Math.max(1, Math.round(window.CODEX_DEV?.settings?.hubThreshold ?? 10));
      const LOW  = 1;
      const R_HI = 1.32;  // 100% fit
      const R_LO = 0.30;  // close zoom — show all
      // Linear interpolation in ratio space, clamped to [LOW, HIGH].
      const t = Math.max(0, Math.min(1, (R_HI - ratio) / (R_HI - R_LO)));
      return Math.round(HIGH - t * (HIGH - LOW));
    }
    function updateNodeLabelVisibility() {
      const thresh = dynamicHubThreshold();
      nodeLabelEntries.forEach(L => {
        let show = true;
        if (_labelsMode === 'off') show = false;
        else if (_labelsMode === 'hub') show = L.deg >= thresh;
        if (!famInFilter(L.family)) show = false;
        // ACTIVE / HOVERED nodes get their label ALWAYS — overrides the
        // threshold, overrides the family filter, overrides everything. The
        // user must be able to read every node in their current focus.
        if (isActiveOrHovered(L.id)) show = true;
        const cur = L.el.style.display;
        const next = show ? '' : 'none';
        if (cur !== next) L.el.style.display = next;
        // Active/hovered labels ALSO escape deconflict-hidden state — clear
        // their visibility so the next deconflict pass keeps them visible.
        if (isActiveOrHovered(L.id) && L.el.style.visibility === 'hidden') {
          L.el.style.visibility = '';
        }
      });
      syncNodeLabelsImmediate();
      scheduleDeconflict();
    }

    // Expose inner refresh hooks so the dev panel can re-run them when CSS
    // vars (label size, hub threshold, etc.) change without a full rerender.
    if (window._pantheonV2) {
      window._pantheonV2._refreshLabels    = updateNodeLabelVisibility;
      window._pantheonV2._refreshFit       = applyInitialFit;
      window._pantheonV2._scheduleDecon    = scheduleDeconflict;
    }

    // ── PAN/ZOOM LIFECYCLE — labels stay visible AND dynamic ──────────────
    // No more overlay-hide trick. The diagram tracks the camera continuously:
    //   - syncNodeLabelsImmediate runs on every afterRender → positions follow
    //     the camera every frame, so labels move smoothly with the dots.
    //   - updateNodeLabelVisibility runs on a 60 ms debounce during camera
    //     updates → toggles which labels are eligible based on the current
    //     ratio (smooth gradient hub threshold). Only TOUCHES `display` when
    //     it would actually change — no DOM churn.
    //   - Deconflict is OWNERSHIP of the `visibility` property and is the
    //     only place that touches it. It NEVER resets visibility before
    //     measuring — measures off the current state, computes the diff,
    //     applies only what changed. No flash.
    //   - During motion, deconflict is debounced 220 ms so it only fires
    //     once after the user lets go, which is the natural settle moment.
    let _isPanning     = false;
    let _panEndTimer   = null;
    let _camRefreshT   = null;
    function syncNodeLabelsImmediate() {
      const distMult = window.CODEX_DEV?.settings?.nodeLabelDist || 1;
      for (let i = 0; i < nodeLabelEntries.length; i++) {
        const L = nodeLabelEntries[i];
        if (L.el.style.display === 'none') continue;
        const screen = sigma.graphToViewport({ x: L.wx, y: L.wy });
        L.el.style.left = screen.x + 'px';
        L.el.style.top  = (screen.y - L.dy * distMult) + 'px';
      }
    }
    sigma.getCamera().on('updated', () => {
      // Mark motion so deconflict gets deferred. No overlay opacity changes.
      _isPanning = true;
      clearTimeout(_panEndTimer);
      _panEndTimer = setTimeout(() => {
        _isPanning = false;
        // Final visibility refresh + deconflict once motion has actually
        // stopped (200 ms quiet window).
        updateNodeLabelVisibility();
        scheduleDeconflict();
      }, 200);
      // Re-evaluate threshold mid-motion so labels appear/disappear in
      // proportion to zoom — but on a slower cadence to avoid thrashing.
      clearTimeout(_camRefreshT);
      _camRefreshT = setTimeout(updateNodeLabelVisibility, 80);
    });

    function syncNodeLabels() {
      // Re-project visible label world-positions to screen-space via sigma camera.
      // Per-sync read of dev-panel label-distance multiplier so live tweaks apply.
      const distMult = window.CODEX_DEV?.settings?.nodeLabelDist || 1;
      const len = nodeLabelEntries.length;
      for (let i = 0; i < len; i++) {
        const L = nodeLabelEntries[i];
        if (L.el.style.display === 'none') continue;
        const screen = sigma.graphToViewport({ x: L.wx, y: L.wy });
        L.el.style.left = screen.x + 'px';
        L.el.style.top  = (screen.y - L.dy * distMult) + 'px';
      }
      // Skip deconflict during pan/zoom — it's the source of the flash.
      if (!_isPanning) scheduleDeconflict();
    }

    let _deconflictTimer = null;
    function scheduleDeconflict() {
      if (_isPanning) return;
      clearTimeout(_deconflictTimer);
      _deconflictTimer = setTimeout(deconflictNodeLabels, 60);
    }

    // Greedy first-fit by degree — NO visibility reset.
    //
    // Key invariant: visibility:hidden elements STILL report correct
    // getBoundingClientRect (they occupy layout, they just don't paint).
    // So we can measure off the current state without ever blinking
    // labels visible-then-hidden. We compute the target state for every
    // label and only TOUCH .visibility when it would change.
    function deconflictNodeLabels() {
      const items = [];
      for (let i = 0; i < nodeLabelEntries.length; i++) {
        const L = nodeLabelEntries[i];
        if (L.el.style.display === 'none') continue;
        const bb = L.el.getBoundingClientRect();
        if (!bb.width || !bb.height) continue;
        const priority = isActiveOrHovered(L.id) ? 1 : 0;
        items.push({ L, bb, deg: L.deg, priority });
      }
      if (!items.length) return;
      // Sort: ACTIVE/HOVERED first (they claim their slot no matter what),
      // then by degree. A high-degree distant label can NEVER displace a
      // selected/hovered node's label.
      items.sort((a, b) => (b.priority - a.priority) || (b.deg - a.deg));
      const claimed = [];
      const PAD = 2;
      for (const it of items) {
        const bb = it.bb;
        const x0 = bb.left - PAD, x1 = bb.right + PAD;
        const y0 = bb.top  - PAD, y1 = bb.bottom + PAD;
        let conflict = false;
        for (const c of claimed) {
          if (!(x1 < c.x0 || c.x1 < x0 || y1 < c.y0 || c.y1 < y0)) { conflict = true; break; }
        }
        // Active/hovered labels are NEVER hidden by deconflict — they always
        // claim their slot. Lesser labels around them get hidden instead.
        const target = (conflict && it.priority === 0) ? 'hidden' : '';
        if (it.L.el.style.visibility !== target) it.L.el.style.visibility = target;
        // Both claimed-by-active and claimed-by-normal reserve space.
        if (!conflict || it.priority === 1) claimed.push({ x0, x1, y0, y1 });
      }
    }

    function applyLabelHoverDim() {
      // Hover trumps lock. Lock trumps idle.
      if (_hoverId) {
        for (const L of nodeLabelEntries) {
          const isNeighbor = (L.id === _hoverId) ||
            graph.hasEdge(L.id, _hoverId) || graph.hasEdge(_hoverId, L.id);
          L.el.classList.toggle('dim', !isNeighbor);
        }
        return;
      }
      if (_lockedSet.size > 0) {
        for (const L of nodeLabelEntries) L.el.classList.toggle('dim', !_lockedSet.has(L.id));
        return;
      }
      for (const L of nodeLabelEntries) L.el.classList.remove('dim');
    }

    // Initial paint + bind camera sync
    updateNodeLabelVisibility();
    syncNodeLabels();
    sigma.on('afterRender', () => { syncNodeLabels(); syncThumbsImmediate(); });

    // ----- TOOLBAR — mode dropdown + labels toggle + ego focus + recenter -----
    const toolbar = document.createElement('div');
    toolbar.className = 'ph2-toolbar';
    toolbar.innerHTML = `
<select class="ph2-btn ph2-mode-select" title="What the wedges show">
        <option value="deities"      ${_currentMode === 'deities'      ? 'selected' : ''}>◯ Deities</option>
        <option value="authors"      ${_currentMode === 'authors'      ? 'selected' : ''}>✎ Authors</option>
        <option value="symbols"      ${_currentMode === 'symbols'      ? 'selected' : ''}>✦ Symbols</option>
        <option value="events"       ${_currentMode === 'events'       ? 'selected' : ''}>★ Events</option>
        <option value="rituals"      ${_currentMode === 'rituals'      ? 'selected' : ''}>⚱ Rituals</option>
        <option value="music"        ${_currentMode === 'music'        ? 'selected' : ''}>♩ Music</option>
        <option value="alphabet"     ${_currentMode === 'alphabet'     ? 'selected' : ''}>ℵ Alphabets</option>
        <option value="alchemy"      ${_currentMode === 'alchemy'      ? 'selected' : ''}>🜍 Alchemy</option>
        <option value="philosophy"   ${_currentMode === 'philosophy'   ? 'selected' : ''}>✺ Philosophy</option>
        <option value="morals"       ${_currentMode === 'morals'       ? 'selected' : ''}>⚖ Morals</option>
        <option value="medicine"     ${_currentMode === 'medicine'     ? 'selected' : ''}>☤ Medicine</option>
        <option value="mathematics"  ${_currentMode === 'mathematics'  ? 'selected' : ''}>∑ Mathematics</option>
        <option value="monuments"    ${_currentMode === 'monuments'    ? 'selected' : ''}>⛬ Monuments</option>
      </select>
      <button class="ph2-btn" id="ph2-labels" title="Toggle label density">labels: ${_labelsMode}</button>
      <button class="ph2-btn${_egoFocus ? ' ph2-btn-on' : ''}" id="ph2-ego" title="Show 1-hop neighbourhood of selected node">ego focus</button>
      <button class="ph2-btn" id="ph2-thumbs" title="Show deity thumbnails as circle fills">photos: off</button>
    `;
    rootEl.appendChild(toolbar);

    // Mode dropdown — rebuilds entire graph for the new mode
    toolbar.querySelector('.ph2-mode-select').onchange = (ev) => {
      _currentMode  = ev.target.value;
      _familyFilter = new Set();
      _egoFocus     = false;
      _labelsMode   = 'hub';
      render(rootEl);
    };

    toolbar.querySelector('#ph2-labels').onclick = (ev) => {
      _labelsMode = _labelsMode === 'hub' ? 'all' : _labelsMode === 'all' ? 'off' : 'hub';
      ev.target.textContent = 'labels: ' + _labelsMode;
      updateNodeLabelVisibility();
      sigma.refresh({ skipIndexation: true });
    };
    toolbar.querySelector('#ph2-ego').onclick = (ev) => {
      _egoFocus = !_egoFocus;
      ev.target.classList.toggle('ph2-btn-on', _egoFocus);
      if (!_egoFocus) _selectedId = null;
      sigma.refresh({ skipIndexation: true });
    };
    // Thumbnail-fill toggle — overlays each deity's thumbnail (clipped to a
    // circle) on top of the dot. Hidden by default; flips state on click.
    let _thumbsOn = false;
    toolbar.querySelector('#ph2-thumbs').onclick = (ev) => {
      _thumbsOn = !_thumbsOn;
      setThumbsEnabled(_thumbsOn);
      ev.target.textContent = 'photos: ' + (_thumbsOn ? 'on' : 'off');
      ev.target.classList.toggle('ph2-btn-on', _thumbsOn);
    };
    // 100% + recenter moved to the bottom-right zoom widget (see below).

    // ── FAMILY-FILTER DROPDOWN (toolbar) ──────────────────────────────
    // Tick-box multi-select panel: pick one or many families to isolate.
    // Reset button clears all selections. Replaces the old bottom-left
    // legend entirely. Lives inside the top toolbar next to the mode select.
    const familyOrderForMenu = (familyOrder || []).filter(name => famByName && famByName[name] && famByName[name].members.length);
    const filterMenu = document.createElement('div');
    filterMenu.className = 'ph2-filter-menu';
    filterMenu.innerHTML = `
      <button class="ph2-btn ph2-filter-trigger" id="ph2-filter-trigger" title="Filter by family">Families ▾</button>
      <div class="ph2-filter-dropdown" id="ph2-filter-dropdown">
        <div class="ph2-filter-head">
          <span class="ph2-filter-head-title">Filter families</span>
          <button class="ph2-filter-reset" id="ph2-filter-reset" title="Show all">Reset</button>
        </div>
        <div class="ph2-filter-body">
          ${familyOrderForMenu.map(name => {
            const w = wedges[name] || {};
            const color = w.color || '#7a8090';
            const count = (w.members || []).length;
            return `<label class="ph2-filter-row" data-family="${escapeAttr(name)}">
              <input type="checkbox" class="ph2-filter-check" data-family="${escapeAttr(name)}">
              <span class="ph2-filter-swatch" style="background:${color}"></span>
              <span class="ph2-filter-name">${escapeHtml(name)}</span>
              <span class="ph2-filter-count">${count}</span>
            </label>`;
          }).join('')}
        </div>
      </div>
    `;
    // Insert at index 1 (right after the mode dropdown) so it reads as a peer.
    toolbar.insertBefore(filterMenu, toolbar.children[1] || null);

    const filterTrigger  = filterMenu.querySelector('#ph2-filter-trigger');
    const filterDropdown = filterMenu.querySelector('#ph2-filter-dropdown');
    const filterChecks   = filterMenu.querySelectorAll('.ph2-filter-check');
    const filterResetBtn = filterMenu.querySelector('#ph2-filter-reset');

    function syncFamilyMenu() {
      // Drive checkbox state + the trigger button label from the live set.
      filterChecks.forEach(cb => { cb.checked = _familyFilter.has(cb.dataset.family); });
      const n = _familyFilter.size;
      filterTrigger.textContent = n === 0
        ? 'Families ▾'
        : (n === 1 ? `Family: ${Array.from(_familyFilter)[0]} ▾` : `Families · ${n} selected ▾`);
      filterTrigger.classList.toggle('ph2-btn-on', n > 0);
      // Rim label opacity follows the filter.
      const filtering = n > 0;
      rimOverlay.querySelectorAll('.ph2-rim-label').forEach(el => {
        el.style.opacity = (filtering && !_familyFilter.has(el.dataset.family)) ? '0.18' : '0.85';
      });
    }
    function commitFilterChange() {
      applyHullFilterState();
      updateNodeLabelVisibility();
      applyEdgeHoverState();
      syncFamilyMenu();
      sigma.refresh({ skipIndexation: true });
    }
    filterTrigger.onclick = (ev) => {
      ev.stopPropagation();
      filterMenu.classList.toggle('open');
    };
    filterChecks.forEach(cb => {
      cb.addEventListener('change', () => {
        const fam = cb.dataset.family;
        if (cb.checked) _familyFilter.add(fam);
        else            _familyFilter.delete(fam);
        commitFilterChange();
      });
    });
    filterResetBtn.onclick = () => {
      _familyFilter = new Set();
      commitFilterChange();
    };
    // Close dropdown on any outside click.
    document.addEventListener('click', (ev) => {
      if (!filterMenu.contains(ev.target)) filterMenu.classList.remove('open');
    });
    // Initial sync (in case render() re-fires with a populated set).
    syncFamilyMenu();

    // ── BOTTOM-RIGHT ZOOM WIDGET ──────────────────────────────────────
    // Compact zoom UI: percentage label (also acts as 100%/fit button on
    // click) + zoom in / zoom out steppers + recenter. Lives over the
    // bottom-right of the pane; sits above the search bar via z-index.
    const zoomWidget = document.createElement('div');
    zoomWidget.className = 'ph2-zoom-widget';
    zoomWidget.innerHTML = `
      <button class="ph2-zoom-btn" id="ph2-zoom-out" title="Zoom out">−</button>
      <button class="ph2-zoom-pct" id="ph2-zoom-pct" title="Click to fit (100%)">100%</button>
      <button class="ph2-zoom-btn" id="ph2-zoom-in" title="Zoom in">+</button>
      <button class="ph2-zoom-btn ph2-zoom-recenter" id="ph2-zoom-recenter" title="Recenter to all nodes">⌖</button>
    `;
    rootEl.appendChild(zoomWidget);

    const zoomPctEl = zoomWidget.querySelector('#ph2-zoom-pct');
    function syncZoomPct() {
      try {
        const ratio = sigma.getCamera().getState().ratio;
        const fit   = computeFitRatio();
        // 100% = at-fit-ratio. Smaller ratio (more zoomed-in) = larger %.
        const pct = Math.round((fit / ratio) * 100);
        zoomPctEl.textContent = pct + '%';
      } catch (e) {}
    }
    sigma.getCamera().on('updated', syncZoomPct);
    syncZoomPct();

    zoomPctEl.onclick = () => {
      try {
        const ratio = computeFitRatio();
        sigma.getCamera().animate({ x: 0.5, y: 0.5, ratio, angle: 0 }, { duration: 280 });
      } catch (e) {}
    };
    zoomWidget.querySelector('#ph2-zoom-in').onclick = () => {
      try {
        const cam = sigma.getCamera();
        const cur = cam.getState().ratio;
        cam.animate({ ratio: Math.max(0.05, cur / 1.30) }, { duration: 180 });
      } catch (e) {}
    };
    zoomWidget.querySelector('#ph2-zoom-out').onclick = () => {
      try {
        const cam = sigma.getCamera();
        const cur = cam.getState().ratio;
        cam.animate({ ratio: Math.min(8, cur * 1.30) }, { duration: 180 });
      } catch (e) {}
    };
    zoomWidget.querySelector('#ph2-zoom-recenter').onclick = () => {
      try { sigma.getCamera().animatedReset({ duration: 360 }); } catch (e) {}
      _egoFocus = false;
      toolbar.querySelector('#ph2-ego')?.classList.remove('ph2-btn-on');
    };

    // Stash for diagnostics + setView() teardown
    rootEl._sigma = sigma;
    rootEl._graph = graph;
  }

  // PHASE F — DOM overlay for HORIZONTAL family rim labels.
  //
  // Previously tangential (rotated to follow rim) at Router+50. Production
  // (app.js:1162-1206) uses HORIZONTAL text at Router+56 with text-anchor +
  // dy computed from the angle so each label reads naturally regardless of
  // where it sits around the ring, plus a tick line from hull rim to label.
  //
  // For DOM divs we translate via CSS percentages rather than SVG text-anchor:
  //   cos(a) > 0.35       → anchor at LEFT  edge   (tx =    0%)
  //   cos(a) < -0.35      → anchor at RIGHT edge   (tx = -100%)
  //   else                 → centered horizontally (tx =  -50%)
  //   sin(a) > 0.55       → label is ABOVE anchor  (ty = -100%)   (top of ring)
  //   sin(a) < -0.55      → label is BELOW anchor  (ty =    0%)   (bottom)
  //   else                 → centered vertically   (ty =  -50%)
  //
  // V2 uses math-convention angle (cos = x, sin = y) post-Y-flip. Sigma flips
  // Y when rendering, so sin > 0 = screen-up = top half (matches production).
  //
  // Font size scales with wedge angular size (narrower wedge → smaller font),
  // production formula: max(9, min(14, 8 + arc × 11)).
  function buildRimLabels(rootEl, wedges, sigmaRenderer, familyFilter) {
    const overlay = document.createElement('div');
    overlay.className = 'ph2-rim-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    rootEl.appendChild(overlay);

    const Router = 540;
    const labelR = Router + 56;
    const entries = Object.values(wedges).filter(w => w.members.length);
    entries.forEach(w => {
      const el = document.createElement('div');
      el.className = 'ph2-rim-label' + (w.members.length >= 6 ? ' ph2-rim-label-bright' : '');
      el.dataset.family = w.name;
      el.textContent = w.name;
      // familyFilter is a Set; empty = no filter.
      if (familyFilter && familyFilter.size > 0 && !familyFilter.has(w.name)) el.style.opacity = '0.30';
      const ang = w.center;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      // Stash world-space label anchor
      el._wx = labelR * c;
      el._wy = labelR * s;
      // CSS translate percentages (anchor position WITHIN the label box)
      const tx = c >  0.35 ?    '0%' : c < -0.35 ? '-100%' : '-50%';
      const ty = s >  0.55 ? '-100%' : s < -0.55 ?    '0%' : '-50%';
      el._tx = tx; el._ty = ty;
      // Font size scales with wedge arc — production formula
      const arc = w.a1 - w.a0;
      el.style.fontSize = Math.max(9, Math.min(14, 8 + arc * 11)).toFixed(1) + 'px';
      overlay.appendChild(el);
    });

    function sync() {
      const labels = overlay.querySelectorAll('.ph2-rim-label');
      labels.forEach(el => {
        const screen = sigmaRenderer.graphToViewport({ x: el._wx, y: el._wy });
        el.style.left = screen.x + 'px';
        el.style.top  = screen.y + 'px';
        el.style.transform = `translate(${el._tx}, ${el._ty})`;
      });
    }
    sync();
    sigmaRenderer.on('afterRender', sync);
    return overlay;
  }

  // --- escape helpers (kept private to this module) ---
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  }
  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/["'&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  window._pantheonV2 = {
    render,
    // Convenience for the dev panel — re-render the live pane after changing
    // any setting (force constants, camera ratio, etc.) that requires a full
    // bake + paint rather than a CSS-var swap or sigma.refresh.
    rerender: function () {
      const pane = document.querySelector('.pantheon-v2-pane');
      if (pane) render(pane);
    }
  };
})();
