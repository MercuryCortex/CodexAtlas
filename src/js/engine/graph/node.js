// ============================================================
// CODEX ATLAS — GRAPH NODE PACKER
// ============================================================
// Converts an array of node records + a positions Map into a
// flat Float32Array suitable as a per-instance vertex buffer
// for the WebGPU instanced disk pipeline.
//
// Each instance is 8 floats (32 bytes) — the natural alignment
// for a vec4 + vec4 attribute pair:
//   [0,1]  worldX, worldY       — wedge-layout position
//   [2]    radius               — world-space radius
//   [3]    _pad                 — alignment
//   [4..7] colorR,G,B,A         — family color (premultiplied alpha applied in shader)
//
// Pure function. No DOM, no global state.
// ============================================================

(function () {
  'use strict';

  // N8 (Phase 1B, 2026-05-20) — legacy fallback for callers that
  // don't pass opts.tierRadii. Forge always overrides with its
  // PARAM_DEFAULTS values via tierRadiiFromParams() so this path
  // is dead in the Forge view; kept for non-Forge callers (e.g.,
  // any future test harness or alternate front-end) and as a
  // defensive default. Do not tune from here — change the
  // PARAM_DEFAULTS node_radius_tier* values in forge.js.
  const TIER_RADIUS = [18, 14, 11, 8]; // top4% / next11% / next25% / rest

  // ── Color parsing — hex / rgb / rgba → [r, g, b, a] in [0, 1] ──
  // N7 (Phase 1B, 2026-05-20) — Module-scope cache by design:
  // bounded by the count of distinct family / tradition colors
  // in the vault (~100 entries today), survives view-remount
  // for cross-mount perf, never evicted. If a future refactor
  // tries to "fix" this by moving into a per-mount `local`,
  // re-read this comment + the audit doc first. NOTE: hex (#RRGGBB
  // and #RRGGBBAA) + rgb()/rgba() only — vault convention.
  const _colorCache = new Map();
  function parseColor(s, fallback) {
    if (!s || typeof s !== 'string') return fallback || [0.5, 0.5, 0.5, 1];
    const cached = _colorCache.get(s);
    if (cached) return cached;
    let r = 0, g = 0, b = 0, a = 1;
    if (s[0] === '#' && (s.length === 7 || s.length === 9)) {
      r = parseInt(s.slice(1, 3), 16) / 255;
      g = parseInt(s.slice(3, 5), 16) / 255;
      b = parseInt(s.slice(5, 7), 16) / 255;
      if (s.length === 9) a = parseInt(s.slice(7, 9), 16) / 255;
    } else {
      const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
      if (m) {
        r = (+m[1]) / 255;
        g = (+m[2]) / 255;
        b = (+m[3]) / 255;
        if (m[4]) a = parseFloat(m[4]);
      }
    }
    const out = [r, g, b, a];
    _colorCache.set(s, out);
    return out;
  }

  // ── Tier classifier ───────────────────────────────────
  // Given a degree map and a node list, returns a function
  // that maps a degree value to a tier index 0..3.
  function buildTierClassifier(nodes, degreeMap) {
    const sorted = nodes.map(n => degreeMap.get(n.id) || 0)
                        .sort((a, b) => b - a);
    if (!sorted.length) return () => 3;
    const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] || 0;
    const t0 = q(0.04);    // top 4%
    const t1 = q(0.15);    // next 11%
    const t2 = q(0.40);    // next 25%
    return function tierFor(deg) {
      if (deg >= t0) return 0;
      if (deg >= t1) return 1;
      if (deg >= t2) return 2;
      return 3;
    };
  }

  // ── Pack instances ────────────────────────────────────
  // @param nodes      Array of node records.
  // @param positions  Map<id, { x, y }>  (world space)
  // @param degree     Map<id, number>
  // @param opts       {
  //                     tierRadii:   [r0, r1, r2, r3]  optional override
  //                     camScale:    number            current camera scale
  //                                                    (required if min/max set)
  //                     minScreenPx: number            don't shrink below this
  //                                                    apparent on-screen radius
  //                     maxScreenPx: number            don't grow above this
  //                   }
  // @returns {
  //   data:           Float32Array, length = nodes.length * 8
  //   instanceCount:  number
  //   idIndex:        Array<string>  — instance index → node id (for hover dispatch)
  //   tierFor:        (deg) → 0..3   — the classifier this pack used (N6, Phase 1B
  //                                    2026-05-20). Callers may reuse instead of
  //                                    rebuilding to avoid drift if classifier
  //                                    semantics change.
  // }
  function packNodes(nodes, positions, degree, opts) {
    const tiers = (opts && Array.isArray(opts.tierRadii)) ? opts.tierRadii : TIER_RADIUS;
    const camScale = (opts && typeof opts.camScale    === 'number') ? opts.camScale : null;
    const minPx    = (opts && typeof opts.minScreenPx === 'number') ? opts.minScreenPx : null;
    const maxPx    = (opts && typeof opts.maxScreenPx === 'number') ? opts.maxScreenPx : null;
    const clampActive = camScale && (minPx !== null || maxPx !== null);
    const tierFor = buildTierClassifier(nodes, degree);

    // Filter to nodes that actually have a position — defensive,
    // handles disjoint data (a node in the list but absent from
    // the layout pass for whatever reason). Skipping it is the
    // right behavior; rendering at (0,0) would be misleading.
    const renderable = [];
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (positions.has(n.id)) renderable.push(n);
    }

    const FLOATS_PER_INSTANCE = 8;
    const data    = new Float32Array(renderable.length * FLOATS_PER_INSTANCE);
    const idIndex = new Array(renderable.length);

    const fallbackColor = [0.5, 0.55, 0.65, 1];
    for (let i = 0; i < renderable.length; i++) {
      const n   = renderable[i];
      const pos = positions.get(n.id);
      const deg = degree.get(n.id) || 0;
      let   r   = tiers[tierFor(deg)];
      // Phase 6: clamp the apparent on-screen radius. At low
      // zoom-out we widen the world radius so dots stay legible;
      // at deep zoom-in we shrink it so a single node doesn't
      // bloat the viewport. This is the same piecewise idea the
      // Atlas Map v3 uses.
      if (clampActive) {
        const screenR = r * camScale;
        let targetScreen = screenR;
        if (minPx !== null && targetScreen < minPx) targetScreen = minPx;
        if (maxPx !== null && targetScreen > maxPx) targetScreen = maxPx;
        r = targetScreen / camScale;
      }
      const col = parseColor(n.family_color || n.tradition_color, fallbackColor);

      const off = i * FLOATS_PER_INSTANCE;
      data[off + 0] = pos.x;
      data[off + 1] = pos.y;
      data[off + 2] = r;
      data[off + 3] = 0;      // pad
      data[off + 4] = col[0];
      data[off + 5] = col[1];
      data[off + 6] = col[2];
      data[off + 7] = col[3];

      idIndex[i] = n.id;
    }
    return { data, instanceCount: renderable.length, idIndex, tierFor };
  }

  // ── Export ────────────────────────────────────────────
  window.AtlasEngineGraph = window.AtlasEngineGraph || {};
  window.AtlasEngineGraph.packNodes           = packNodes;
  window.AtlasEngineGraph.buildTierClassifier = buildTierClassifier;
  window.AtlasEngineGraph.parseColor          = parseColor;
  window.AtlasEngineGraph.NODE_TIER_RADIUS    = TIER_RADIUS;
  window.AtlasEngineGraph.NODE_FLOATS_PER_INSTANCE = 8;
})();
