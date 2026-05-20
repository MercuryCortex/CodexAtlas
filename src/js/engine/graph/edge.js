// ============================================================
// CODEX ATLAS — GRAPH EDGE PACKER
// ============================================================
// Converts an array of edge records + a positions Map + the
// universal edge-bucket palette into a flat Float32Array
// suitable as a per-instance vertex buffer for the WebGPU
// instanced curved-edge pipeline.
//
// Each instance is 12 floats (48 bytes):
//   [0,1]   sourceX, sourceY        — world-space endpoint
//   [2,3]   targetX, targetY        — world-space endpoint
//   [4..7]  colorR, G, B, A         — idle color + idle opacity
//   [8]     idleWidth               — world-space stroke width at idle
//   [9]     curveStrength           — 0..1 fraction pull toward (0,0)
//   [10]    bucketIndex             — 0..6 for the 7 buckets (hot-color lookup)
//   [11]    hotWidth                — world-space stroke width when in focus
//
// Pure function. No DOM, no global state.
// ============================================================

(function () {
  'use strict';

  // Bucket index — stable order used for instance-color uniform
  // lookups. Order MUST match the BUCKETS object in
  // src/js/edge-buckets.js. (Keep this list in sync when
  // routing changes — a unit test will lock it in Phase 3.)
  const BUCKET_INDEX = {
    transmission: 0,
    parallel:     1,
    association:  2,
    kinship:      3,
    attestation:  4,
    polemic:      5,
    fusion:       6,
  };

  // Curve strength per bucket. Bundled edges (kinship, fusion,
  // polemic) pull harder toward centre so they read as
  // ribbons; ambient edges (association) pull less so they
  // don't all stack on the same arc.
  const CURVE_STRENGTH = {
    transmission: 0.35,
    parallel:     0.30,
    association:  0.22,
    kinship:      0.40,
    attestation:  0.32,
    polemic:      0.42,
    fusion:       0.45,
  };

  // Tier-2 edge-width baseline — multiplied by per-instance
  // bucket width in the shader. Source values match
  // edge-buckets.js BUCKETS.*.width.
  // (Re-declared here so the packer can run without depending
  // on window.EDGE_BUCKETS being loaded — graceful degradation.)
  const DEFAULT_BUCKET_WIDTH = {
    transmission: 0.34,
    parallel:     0.30,
    association:  0.22,
    kinship:      0.32,
    attestation:  0.30,
    polemic:      0.40,
    fusion:       0.36,
  };
  const DEFAULT_BUCKET_IDLE_OP = {
    transmission: 0.10,
    parallel:     0.12,
    association:  0.08,
    kinship:      0.14,
    attestation:  0.10,
    polemic:      0.25,
    fusion:       0.30,
  };
  // Headline buckets (Polemic, Fusion) idle at their bucket
  // colour. Everything else idles slate-blue — atmosphere not
  // story — and switches to its bucket colour on hover. Match
  // pantheon-v2's CSS `.ph2-edge` rule.
  const HEADLINE_BUCKETS = new Set(['polemic', 'fusion']);
  // World-space stroke-width scale. The Phase 2 wheel is laid
  // out in world units where R_OUTER = 540 — so width 1.0 is
  // ~0.2% of the wheel diameter, which reads as a thin line.
  // Multiplied by bucket.width below; final ranges ~0.7–1.4.
  const WIDTH_SCALE = 2.2;

  function bucketColor(bucketName) {
    const b = window.EDGE_BUCKETS && window.EDGE_BUCKETS[bucketName];
    if (b && typeof b.hex === 'string') return b.hex;
    // Fallback: slate-blue.
    return '#3a4a66';
  }

  function bucketWidth(bucketName) {
    const b = window.EDGE_BUCKETS && window.EDGE_BUCKETS[bucketName];
    if (b && typeof b.width === 'number') return b.width;
    return DEFAULT_BUCKET_WIDTH[bucketName] || 0.25;
  }

  function bucketIdleOp(bucketName) {
    const b = window.EDGE_BUCKETS && window.EDGE_BUCKETS[bucketName];
    if (b && typeof b.idle === 'number') return b.idle;
    return DEFAULT_BUCKET_IDLE_OP[bucketName] || 0.10;
  }

  // Atmospheric slate that non-headline buckets idle at.
  // Pantheon-v2 CSS uses rgba(80, 95, 130, 0.85) — same here.
  const SLATE = [80 / 255, 95 / 255, 130 / 255];

  function hexToRgb(hex) {
    return [
      parseInt(hex.slice(1, 3), 16) / 255,
      parseInt(hex.slice(3, 5), 16) / 255,
      parseInt(hex.slice(5, 7), 16) / 255,
    ];
  }

  // Resolve an edge's bucket using the universal edge-buckets
  // module if it's loaded; fall back to 'association'.
  function bucketFor(edgeType) {
    if (window.EDGE_BUCKET && window.EDGE_BUCKET[edgeType]) {
      return window.EDGE_BUCKET[edgeType];
    }
    return 'association';
  }

  // ── Pack instances ────────────────────────────────────
  // @param edges      Array of { source, target, type }.
  // @param positions  Map<id, { x, y }>  (world space)
  // @param opts       Optional overrides (all keyed by bucket name):
  //                     idleWidths:  { transmission: 0.34, ... }  (alias: widths)
  //                     hotWidths:   { transmission: 0.82, ... }  per-bucket focus stroke
  //                     idleOps:     { transmission: 0.10, ... }
  //                     idleColors:  { transmission: '#3a4a66', ... }  hex overrides
  //                     curves:      { transmission: 0.35, ... }
  // @returns {
  //   data:          Float32Array, length = N * 12
  //   instanceCount: number
  //   bucketCounts:  { transmission: n, parallel: n, ... }  diagnostic
  // }
  function packEdges(edges, positions, opts) {
    const wOver  = (opts && (opts.idleWidths || opts.widths)) || null;
    const hwOver = (opts && opts.hotWidths)  || null;
    const oOver  = (opts && opts.idleOps)    || null;
    const cOver  = (opts && opts.curves)     || null;
    const colOver = (opts && opts.idleColors) || null;
    // 2026-05-19 — optional id→worldRadius map. When present, each
    // wire's endpoint is pulled from the node center to the disk
    // perimeter ALONG the line to its partner. Different wires
    // out of the same hub then emerge from different points on
    // its circumference, fixing the "all wires bundle at center"
    // bunching John flagged. Without this map, endpoints stay at
    // centers (legacy behavior). The view layer builds the map
    // from the packed node-radius column after packNodes runs.
    const radii = (opts && opts.nodeRadii) || null;
    const FLOATS_PER_INSTANCE = 12;

    // First pass: collect renderable edges (both endpoints
    // present in the layout).
    const renderable = [];
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if (positions.has(e.source) && positions.has(e.target)) {
        renderable.push(e);
      }
    }

    const data         = new Float32Array(renderable.length * FLOATS_PER_INSTANCE);
    const bucketCounts = { transmission: 0, parallel: 0, association: 0, kinship: 0, attestation: 0, polemic: 0, fusion: 0 };

    for (let i = 0; i < renderable.length; i++) {
      const e   = renderable[i];
      const sp  = positions.get(e.source);
      const tp  = positions.get(e.target);
      const buc = bucketFor(e.type);
      bucketCounts[buc] = (bucketCounts[buc] || 0) + 1;

      // Idle color: explicit override > headline-bucket hue > slate.
      // The dev panel's per-bucket idle color picker writes into
      // `colOver`; without an override, headline buckets paint
      // their hue and the rest paint slate atmosphere.
      let rgb;
      if (colOver && typeof colOver[buc] === 'string') {
        rgb = hexToRgb(colOver[buc]);
      } else if (HEADLINE_BUCKETS.has(buc)) {
        rgb = hexToRgb(bucketColor(buc));
      } else {
        rgb = SLATE;
      }
      const alpha    = (oOver  && typeof oOver[buc]  === 'number') ? oOver[buc]  : bucketIdleOp(buc);
      const idleW    = (wOver  && typeof wOver[buc]  === 'number') ? wOver[buc]  : bucketWidth(buc);
      const curveVal = (cOver  && typeof cOver[buc]  === 'number') ? cOver[buc]  : (CURVE_STRENGTH[buc] || 0.3);
      // Hot width: explicit override, or 2.4× the idle stroke
      // (matches the pre-Phase-6 global `hot_width_mult`).
      const hotW     = (hwOver && typeof hwOver[buc] === 'number') ? hwOver[buc] : idleW * 2.4;

      // 2026-05-19 — offset endpoints to disk perimeter when
      // node radii are known. dx/dy point source → target; the
      // unit vector × radius pulls each end OUTWARD from its
      // node's center. If the partners are essentially on top of
      // each other (dist near 0) we fall back to centers.
      //
      // Phase 3B D3 (2026-05-20) — `nodeRadii` is REQUIRED for
      // forge-view callers (rebuildForMode + rebakeEdges always
      // build the Map via `buildRadiiMap`). Center-fallback below
      // is for the same-pixel edge case ONLY (dist < 1e-4), NOT
      // for missing radii. Omitting `nodeRadii` is allowed for
      // headless tests; live forge frames must pass it.
      let srcX = sp.x, srcY = sp.y, tgtX = tp.x, tgtY = tp.y;
      if (radii) {
        const dx = tp.x - sp.x;
        const dy = tp.y - sp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.0001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const rs = radii.get(e.source) || 0;
          const rt = radii.get(e.target) || 0;
          // Inset by 0.92r — just inside the disk edge, so the
          // anti-aliased disk halo cleanly covers the bezier
          // start/end and there's no visible "stub" sticking out
          // of the wrong side of a small disk.
          srcX = sp.x + nx * rs * 0.92;
          srcY = sp.y + ny * rs * 0.92;
          tgtX = tp.x - nx * rt * 0.92;
          tgtY = tp.y - ny * rt * 0.92;
        }
      }

      // Phase 3B D4 (2026-05-20) — gradient direction (in shader
      // edge_t 0→1) follows this vault edge's natural source→target
      // order. Bucket-asymmetric edges (transmission, polemic,
      // fusion) carry semantic direction; symmetric edges (parallel,
      // kinship, association, attestation) carry no direction but
      // the gradient is still applied universally as a visual
      // cue. This is intentional — see AUDIT/forge-rebuild-3A-
      // wires-2026-05-20.md §3 F7.
      const off = i * FLOATS_PER_INSTANCE;
      data[off +  0] = srcX;
      data[off +  1] = srcY;
      data[off +  2] = tgtX;
      data[off +  3] = tgtY;
      data[off +  4] = rgb[0];
      data[off +  5] = rgb[1];
      data[off +  6] = rgb[2];
      data[off +  7] = alpha;
      data[off +  8] = idleW * WIDTH_SCALE;
      data[off +  9] = curveVal;
      data[off + 10] = BUCKET_INDEX[buc];
      data[off + 11] = hotW * WIDTH_SCALE;
    }

    return { data, instanceCount: renderable.length, bucketCounts };
  }

  // ── Export ────────────────────────────────────────────
  window.AtlasEngineGraph = window.AtlasEngineGraph || {};
  window.AtlasEngineGraph.packEdges                = packEdges;
  window.AtlasEngineGraph.EDGE_FLOATS_PER_INSTANCE = 12;
  window.AtlasEngineGraph.BUCKET_INDEX             = BUCKET_INDEX;
})();
