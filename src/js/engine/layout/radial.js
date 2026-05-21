// ============================================================
// CODEX ATLAS — RADIAL WEDGE LAYOUT (Phase 20D, 2026-05-21)
// ============================================================
// Pure function: takes a list of nodes + a family ordering,
// returns wedge geometry + per-node positions.
//
// LAYOUT STRATEGY
//   1. Group nodes by family.
//   2. Allocate angular wedge per family proportional to
//      sqrt(member count) — keeps small families visible
//      without crowding large ones.
//   3. Inside each wedge, place nodes in age-stratified
//      bands across the annulus: OLDEST deities (most
//      negative `date_earliest`) land at the OUTER radius;
//      NEWEST at the INNER radius. Bands are sized to the
//      wedge width so dense families pack into more bands,
//      sparse ones into fewer, but every family fills its
//      wedge cleanly from outer to inner.
//   4. Within a band, members fan across the wedge arc
//      (alternate stagger between rows so the visual feel
//      is organic, not grid-like).
//
// AGE-RADIAL RATIONALE
//   The wheel becomes a TIMELINE radially: outer = ancient
//   (Neolithic / Bronze-Age substrate), inner = modern
//   (medieval / contemporary). Reading inward = traversing
//   time. Reading angularly = traversing tradition. This
//   doubles the information density of the diagram for free.
//
//   Members without `date_earliest` ("undated" deities) sort
//   to the inner end (treated as "newest" / unknown) so the
//   outer rim is reserved for confidently-old material.
//
// Ported clean with no DOM/state — testable, portable, ready
// for a future Rust port via the portable core.
// ============================================================

(function () {
  'use strict';

  // Wedge-to-wedge angular gap (radians). 0.045 ≈ 2.6° —
  // tuned in pantheon-v2 to keep sparse families breathable.
  const GAP = 0.045;

  // Default annulus. Phase 2 uses these as world-space radii;
  // the camera fit-to-viewport later maps them into screen px.
  // Tuned wider than pantheon-v2's (220–540) so dense wedges
  // (Vedic, Egyptian, Greek) have room to spiral fully.
  const R_INNER = 220;
  const R_OUTER = 540;

  // Golden angle — Vogel/sunflower divergence. Used for the
  // angular spread inside each wedge so the placement reads
  // organic and never bands into rigid rings.
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.39996 rad

  // Compute the radial wedge layout.
  //
  // @param nodes        Array of node records ({ id, family, family_color, ... }).
  // @param familyOrder  Array of family-name strings in display order.
  //                     Missing families get appended in encounter order.
  // @param opts         { rInner, rOuter, gap, degree (Map<id,degree>) }
  //
  // @returns { wedges, positions, rInner, rOuter }
  //          wedges:    { [familyName]: { name, a0, a1, center, members, color } }
  //          positions: Map<nodeId, { x, y }>  (world space)
  //          rInner, rOuter: copies of the radii used (for hull/edge layout)
  function radialWedgeLayout(nodes, familyOrder, opts) {
    const o      = opts || {};
    const rInner = (typeof o.rInner === 'number') ? o.rInner : R_INNER;
    const rOuter = (typeof o.rOuter === 'number') ? o.rOuter : R_OUTER;
    const gap    = (typeof o.gap    === 'number') ? o.gap    : GAP;
    const degree = o.degree instanceof Map ? o.degree : new Map();

    // ── 1. Group nodes by family ──────────────────────────
    const famByName = Object.create(null);
    nodes.forEach(n => {
      const fam = n.family || 'Other';
      if (!famByName[fam]) {
        famByName[fam] = {
          name:    fam,
          members: [],
          color:   n.family_color || n.tradition_color || '#7a8090',
        };
      }
      famByName[fam].members.push(n);
    });

    // Build ordered family list — explicit order first, then
    // append any unknown families in encounter order.
    const order = (familyOrder || []).filter(name => famByName[name]).slice();
    Object.keys(famByName).forEach(name => { if (!order.includes(name)) order.push(name); });

    // Skip empty input case — return well-formed empty result.
    if (!order.length) {
      return { wedges: {}, positions: new Map(), rInner, rOuter };
    }

    // ── 2. Allocate angular wedges ────────────────────────
    // Weights: sqrt(memberCount) clamped to ≥ 1.1 so sparse
    // families don't collapse to slivers. Total available arc
    // is 2π minus the inter-wedge gaps.
    const weights  = order.map(name => Math.max(1.1, Math.sqrt(famByName[name].members.length)));
    const totalW   = weights.reduce((s, w) => s + w, 0);
    const totalGap = gap * order.length;
    const totalArc = 2 * Math.PI - totalGap;

    // Start cursor near 9 o'clock so the family-rim labels
    // read left-to-right around the top half of the wheel.
    // -0.55π = ~-99° from x-axis (9 o'clock = -π/2 = -90°, so
    // we're slightly above the horizontal at the start).
    let cursor = -Math.PI * 0.55;
    const wedges = Object.create(null);
    order.forEach((name, i) => {
      const arcSize = totalArc * (weights[i] / totalW);
      wedges[name] = {
        name,
        a0:      cursor,
        a1:      cursor + arcSize,
        center:  cursor + arcSize / 2,
        members: famByName[name].members,
        color:   famByName[name].color,
      };
      cursor += arcSize + gap;
    });

    // ── 3. Place nodes inside each wedge ──────────────────
    // AGE-RADIAL ORGANIC FAN PACKING (Phase 20D-2, 2026-05-21).
    //
    // John feedback after the first 20D pass: the band/grid
    // version felt mechanical. We're keeping the OLD Vogel
    // sunflower "feel" but constraining it with three layers
    // on top:
    //
    //   (a) AGE → RADIUS, soft.   Members sort by date_earliest.
    //       Oldest pulls toward rOuter, newest toward rInner.
    //       The pull is SOFT (a hash-jittered band ±~15% of
    //       the annulus span) so age-equivalent members never
    //       form a perfect ring.
    //
    //   (b) VOGEL + HASH → ANGLE.  Each member gets an angular
    //       offset built from cos(i · golden_angle) blended
    //       with an FNV-hash term. Vogel's irrational rotation
    //       guarantees no clustering; the hash blend kills
    //       any residual visible spiral.
    //
    //   (c) FAN FACTOR.   Angular offsets multiply by a factor
    //       that GROWS with radius — narrow at the inner edge,
    //       wide at the outer edge — so the wedge literally
    //       opens like a fan instead of reading as a parallel
    //       rectangle.
    //
    //   (d) DEGREE → PERSONAL SPACE.   High-degree deities
    //       (degree near the wedge max) contract their u-offset
    //       toward the wedge centre — i.e. they grab more
    //       central screen real-estate and push their lower-
    //       degree neighbours toward the edges. A small final
    //       relaxation pass (anti-collision, angular-only) keeps
    //       overlap from accidents.
    //
    // The result preserves the OLD organic sunflower feel
    // (chaotic, no rings, no rows) while now ALSO encoding
    // age radially and importance centrally.
    const positions = new Map();

    Object.keys(wedges).forEach(famName => {
      const w = wedges[famName];
      const N = w.members.length;
      if (!N) return;

      // Sort by date_earliest ASC (oldest first). Undated
      // members (NaN / null / undefined) sink to the end.
      // Tie-break by degree DESC (more-connected first), then
      // alphabetically so layout is deterministic across loads.
      const sorted = w.members.slice().sort((a, b) => {
        const da = ageOrZero(a.date_earliest);
        const db = ageOrZero(b.date_earliest);
        if (da !== db) return da - db;     // older (more negative) first
        const ga = degree.get(a.id) || 0;
        const gb = degree.get(b.id) || 0;
        if (ga !== gb) return gb - ga;
        return String(a.id || '').localeCompare(String(b.id || ''));
      });

      // Max degree inside this wedge — used to normalise the
      // degree contraction below.
      let maxDeg = 1;
      for (const m of sorted) {
        const dv = degree.get(m.id) || 0;
        if (dv > maxDeg) maxDeg = dv;
      }

      // Wedge geometry.
      const arc       = w.a1 - w.a0;
      const padA      = Math.min(0.04, (arc / 2) * 0.14);
      const arcUsable = arc - 2 * padA;
      const padR      = 18;
      const rOut      = rOuter - padR;
      const rIn       = rInner + padR;
      const radHalf   = (rOut - rIn) / 2;
      const rMid      = (rOut + rIn) / 2;

      // Per-wedge target radius for each rank — stored on the
      // point so the relaxation pass can pull members back
      // toward their age band after angular pushing.
      const targetR = new Array(N);
      for (let i = 0; i < N; i++) {
        const ageT = N > 1 ? i / (N - 1) : 0.5;
        targetR[i] = rMid + (1 - 2 * ageT) * radHalf;
      }

      // Phase 1 — initial placement.
      //   v ← AGE rank with soft hash jitter (so age-equivalent
      //        members spread radially instead of forming a ring)
      //   u ← VAN DER CORPUT bit-reversal sequence with soft
      //        hash jitter (so consecutive ages get well-spread,
      //        non-monotonic angular slots — gives the organic
      //        sunflower feel without rigid bands or rows).
      //
      // The van der Corput sequence is a classic low-discrepancy
      // sequence: vdc(1)=½, vdc(2)=¼, vdc(3)=¾, vdc(4)=⅛, vdc(5)=⅝,
      // vdc(6)=⅜, vdc(7)=⅞, … Each rank gets a UNIQUE u-slot in
      // [0, 1] with no clustering, so two age-adjacent members
      // (similar v) automatically diverge angularly (different u).
      // That eliminates the pile-up that plain Vogel/cos(i·φ)
      // could produce when paired with a sorted-by-age v-axis.
      const pts = new Array(N);

      sorted.forEach((d, i) => {
        const h  = strHash(d.id);
        const hU = (h         & 0xffff) / 0xffff;  // ∈ [0, 1]
        const hV = ((h >>> 16) & 0xffff) / 0xffff;  // ∈ [0, 1]

        // ── RADIUS ── soft pull toward age-rank position.
        const ageT = N > 1 ? i / (N - 1) : 0.5;     // 0 oldest, 1 newest
        let v = 1 - 2 * ageT;                       // +1 outer, −1 inner
        v += (hV - 0.5) * 0.32;                     // ±16% radial jitter
        v = Math.max(-0.97, Math.min(0.97, v));
        const r = rMid + v * radHalf;

        // ── ANGLE ── van der Corput slot + hash sub-jitter.
        const uBase = vdcBase2(i + 1) * 2 - 1;      // unique ∈ (-1, 1)
        const slotW = 2 / Math.max(8, N);           // width of one vdc slot
        let u       = uBase + (hU - 0.5) * slotW * 0.9;

        // Fan factor: angles squeeze toward inner radius, open
        // toward outer. The annulus naturally widens arc-length
        // outward — this multiplier amplifies that visual cue
        // so the wedge reads as an opening fan instead of as a
        // parallel-walled rectangle.
        const radNorm   = (r - rIn) / Math.max(1, rOut - rIn);
        const fanFactor = 0.45 + 0.55 * radNorm;
        u *= fanFactor;
        u  = Math.max(-0.96, Math.min(0.96, u));
        const ang = w.center + u * (arcUsable / 2);

        pts[i] = { id: d.id, r, ang, deg: degree.get(d.id) || 0 };
      });

      // Convert (r, ang) initial placement to (x, y) so the
      // relaxation pass can push in 2D — angular-only push
      // doesn't work in tight wedges (no room to escape
      // sideways) so we let radius drift too, and pull it
      // back toward the age-target with a soft spring.
      const xy = new Array(N);
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        xy[i] = { id: p.id, x: p.r * Math.cos(p.ang), y: p.r * Math.sin(p.ang), deg: p.deg };
      }

      // Phase 2 — 2D anti-collision relaxation with age spring.
      //   • Each pair (i, j) within minDist pushes APART in 2D
      //     along the line between them (handles coincident
      //     pairs with a hash-derived bearing).
      //   • Each member is pulled toward its age-target radius
      //     by a soft radial spring — gentle enough that
      //     age-equivalent members can drift apart radially
      //     when angular space runs out, but strong enough
      //     that the wedge keeps the "oldest outer, newest
      //     inner" reading.
      //   • Final clamp: keep r inside [rIn, rOut] and the
      //     angle inside the fan-constrained wedge bounds.
      //
      // Personal-space targets are chosen to MATCH the
      // physical packing limit of the wedge area, not to
      // exceed it. For Vedic (60 deities in ~23,000 wu² of
      // annulus), the natural min spacing is ~20 wu — we
      // target 16–24 so relaxation can settle.
      const BASE_SIZE   = 11;   // world units for tail nodes
      const HUB_BONUS   = 7;    // extra space for top-degree nodes
      const SPRING_K    = 0.10; // age-spring stiffness (per iter)
      const PUSH_STEP   = 0.55; // 2D push step
      const RELAX_ITERS = 8;
      for (let iter = 0; iter < RELAX_ITERS; iter++) {
        for (let i = 0; i < N; i++) {
          const pi    = xy[i];
          const sizeI = BASE_SIZE + (pi.deg / maxDeg) * HUB_BONUS;
          let pushX = 0, pushY = 0;
          // Repulsion from neighbors.
          for (let j = 0; j < N; j++) {
            if (i === j) continue;
            const pj = xy[j];
            const dx = pi.x - pj.x;
            const dy = pi.y - pj.y;
            const d2 = dx * dx + dy * dy;
            const sizeJ   = BASE_SIZE + (pj.deg / maxDeg) * HUB_BONUS;
            const minDist = sizeI + sizeJ;
            if (d2 < minDist * minDist) {
              const d = Math.sqrt(d2);
              let ux, uy;
              if (d < 0.01) {
                // Coincident — pick a deterministic bearing
                // from a hash of both ids so the pair always
                // splits in the same direction.
                const h = (strHash(pi.id) ^ strHash(pj.id)) >>> 0;
                const theta = (h % 10000) / 10000 * Math.PI * 2;
                ux = Math.cos(theta);
                uy = Math.sin(theta);
              } else {
                ux = dx / d;
                uy = dy / d;
              }
              const force = (minDist - d) * 0.5 * PUSH_STEP;
              pushX += ux * force;
              pushY += uy * force;
            }
          }
          // Age-spring: pull current radius back toward
          // age-target along the current radial direction.
          const curR = Math.hypot(pi.x, pi.y);
          if (curR > 1) {
            const dr   = targetR[i] - curR;
            const radX = pi.x / curR;
            const radY = pi.y / curR;
            pushX += radX * dr * SPRING_K;
            pushY += radY * dr * SPRING_K;
          }
          // Apply combined push.
          let nx = pi.x + pushX;
          let ny = pi.y + pushY;
          // Clamp to wedge bounds (radial + fan-angular).
          let nr   = Math.hypot(nx, ny);
          let nang = (nr > 0.001) ? Math.atan2(ny, nx) : w.center;
          nr = Math.max(rIn, Math.min(rOut, nr));
          const radNorm   = (nr - rIn) / Math.max(1, rOut - rIn);
          const fanFactor = 0.45 + 0.55 * radNorm;
          const maxOff    = (arcUsable / 2) * fanFactor * 0.96;
          let off = nang - w.center;
          while (off >  Math.PI) off -= 2 * Math.PI;
          while (off < -Math.PI) off += 2 * Math.PI;
          off = Math.max(-maxOff, Math.min(maxOff, off));
          nang = w.center + off;
          pi.x = nr * Math.cos(nang);
          pi.y = nr * Math.sin(nang);
        }
      }

      // Write final positions.
      for (let i = 0; i < N; i++) {
        positions.set(xy[i].id, { x: xy[i].x, y: xy[i].y });
      }
    });

    // ── 4. GLOBAL relaxation (Phase 20D-3, 2026-05-21) ────
    // After all wedges have placed their members, run an
    // all-vs-all repulsion pass so cross-wedge boundaries
    // get the same organic spacing as within-wedge pairs.
    //
    // John's request: "make all nodes repel from each other
    // (naturally and organically) attempting to move out
    // 10 px (towards the center when possible)".
    //
    //   • PADDING = 10 wu  → each pair targets an extra
    //     ~10 wu of breathing room on top of size-based
    //     personal space.
    //   • INWARD_GRAVITY → a small constant pull toward
    //     the wheel centre. Makes the "toward the centre
    //     when possible" preference physical: when a node
    //     gets pushed, the gravity term biases its trajectory
    //     inward so the layout compacts gracefully rather
    //     than ballooning outward into the divider zones.
    //   • Hard outer clamp at rOuter − 6 so nothing leaks
    //     across the rim labels; soft inner stop so newest
    //     nodes don't pile at r=0.
    //
    // Wedge angular bounds are intentionally NOT re-applied —
    // a small amount of cross-family drift at the family
    // boundaries is the organic signature John asked for,
    // and the convex hull overlay just expands to enclose it.
    {
      const PADDING   = 10;      // wu of extra space per pair
      const G_ITERS   = 5;
      const G_STEP    = 0.55;
      const G_GRAVITY = 0.6;     // wu/iter pull toward origin
      const BASE_SZ   = 11;
      const HUB_SZ    = 7;
      const RIM_PAD   = 6;
      const outerCap  = rOuter - RIM_PAD;
      const innerCap  = rInner + RIM_PAD;

      // Compute the global max degree once so size scaling
      // is consistent across families.
      let maxDegGlobal = 1;
      for (const m of degree.values()) if (m > maxDegGlobal) maxDegGlobal = m;

      // Snapshot all placed nodes.
      const all = [];
      for (const n of nodes) {
        const p = positions.get(n.id);
        if (!p) continue;
        all.push({ id: n.id, x: p.x, y: p.y, deg: degree.get(n.id) || 0 });
      }
      const M = all.length;

      for (let iter = 0; iter < G_ITERS; iter++) {
        for (let i = 0; i < M; i++) {
          const pi    = all[i];
          const sizeI = BASE_SZ + (pi.deg / maxDegGlobal) * HUB_SZ;
          let pushX = 0, pushY = 0;
          // Repulsion against every other node.
          for (let j = 0; j < M; j++) {
            if (i === j) continue;
            const pj = all[j];
            const dx = pi.x - pj.x;
            const dy = pi.y - pj.y;
            const d2 = dx * dx + dy * dy;
            const sizeJ   = BASE_SZ + (pj.deg / maxDegGlobal) * HUB_SZ;
            const minDist = sizeI + sizeJ + PADDING;
            if (d2 < minDist * minDist) {
              let ux, uy, d;
              if (d2 < 0.0001) {
                // Coincident — deterministic split bearing.
                const h = (strHash(pi.id) ^ strHash(pj.id)) >>> 0;
                const theta = (h % 10000) / 10000 * Math.PI * 2;
                ux = Math.cos(theta);
                uy = Math.sin(theta);
                d  = 0;
              } else {
                d  = Math.sqrt(d2);
                ux = dx / d;
                uy = dy / d;
              }
              const force = (minDist - d) * 0.5 * G_STEP;
              pushX += ux * force;
              pushY += uy * force;
            }
          }
          // Inward gravity — "toward the centre when possible".
          // Small constant pull so the layout naturally compacts
          // rather than expands when conflicts resolve.
          const r = Math.hypot(pi.x, pi.y);
          if (r > 1) {
            pushX -= (pi.x / r) * G_GRAVITY;
            pushY -= (pi.y / r) * G_GRAVITY;
          }
          // Apply.
          pi.x += pushX;
          pi.y += pushY;
          // Annulus clamp.
          const nr = Math.hypot(pi.x, pi.y);
          if (nr > outerCap) {
            const s = outerCap / nr;
            pi.x *= s; pi.y *= s;
          } else if (nr < innerCap) {
            const s = innerCap / Math.max(nr, 0.001);
            pi.x *= s; pi.y *= s;
          }
        }
      }

      // Write back.
      for (let i = 0; i < M; i++) {
        positions.set(all[i].id, { x: all[i].x, y: all[i].y });
      }
    }

    return { wedges, positions, rInner, rOuter };
  }

  // Numeric coercion for sort. Undated → +Infinity (sinks to
  // newest end of the wedge). Negative numbers (BCE) stay
  // negative; smaller (more negative) = older = sorts earlier.
  function ageOrZero(v) {
    if (v == null) return Infinity;
    const n = Number(v);
    if (!isFinite(n)) return Infinity;
    return n;
  }

  function clamp01(t) { return t < 0 ? 0 : (t > 1 ? 1 : t); }

  // Van der Corput base-2 sequence — classic low-discrepancy
  // 1D sampling. Bit-reverses `n` into [0, 1):
  //   1 → 0.1₂   → 0.5
  //   2 → 0.01₂  → 0.25
  //   3 → 0.11₂  → 0.75
  //   4 → 0.001₂ → 0.125
  //   5 → 0.101₂ → 0.625
  //   …
  // Each integer index gets a unique value, and consecutive
  // indices land FAR apart in [0, 1) — perfect for "spread N
  // members across an arc without any of them landing on top
  // of each other".
  function vdcBase2(n) {
    let q = 0;
    let bk = 0.5;
    let k = n;
    while (k > 0) {
      if (k & 1) q += bk;
      bk *= 0.5;
      k >>>= 1;
    }
    return q;
  }

  // Cheap deterministic string hash (FNV-1a). Used only for
  // tiny jitter — no security / distribution guarantees needed.
  function strHash(s) {
    let h = 2166136261 >>> 0;
    const str = String(s || '');
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  // Compute degree map from edges. Useful pre-layout helper —
  // pantheon-v2 builds the degree map separately, but for the
  // Forge view we want everything from data.js→layout in one path.
  function computeDegree(nodes, edges) {
    const deg = new Map();
    const present = new Set(nodes.map(n => n.id));
    edges.forEach(e => {
      if (!present.has(e.source) || !present.has(e.target)) return;
      deg.set(e.source, (deg.get(e.source) || 0) + 1);
      deg.set(e.target, (deg.get(e.target) || 0) + 1);
    });
    return deg;
  }

  // Helper: filter edges to those whose both endpoints are in
  // the current node set. Pantheon-v2 does this implicitly via
  // sigma's graph.hasEdge / addEdge; we do it explicitly so
  // the Forge engine doesn't need a separate graph library.
  function filterEdgesByNodes(edges, nodes) {
    const present = new Set(nodes.map(n => n.id));
    return edges.filter(e => present.has(e.source) && present.has(e.target));
  }

  // ── Export ─────────────────────────────────────────────
  window.AtlasEngineLayout = window.AtlasEngineLayout || {};
  window.AtlasEngineLayout.radialWedgeLayout = radialWedgeLayout;
  window.AtlasEngineLayout.computeDegree     = computeDegree;
  window.AtlasEngineLayout.filterEdgesByNodes = filterEdgesByNodes;
})();
