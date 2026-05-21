// ============================================================
// CODEX ATLAS — LABEL HIERARCHY (Phase 6)
// ============================================================
// Decides WHICH labels paint at idle (no hover, no lock) given
// the current zoom level + per-tier visibility thresholds +
// an AABB collision rule.
//
// The story:
//   - Hub nodes (tier 0 — top 4% by degree) get labels at any
//     zoom: they're the giants of the corpus and the entry
//     points for navigation.
//   - Tier 1 (next 11%) shows at moderate zoom-in.
//   - Tier 2 (next 25%) shows at deeper zoom-in.
//   - Tier 3 (rest) only ever shows on hover/lock.
//
// Plus: when two would-be-visible labels' AABBs collide, the
// lower-tier one yields. Walking tiers top-down preserves
// hub legibility.
//
// Pure function. No DOM, no global state. The view module
// is responsible for actually placing / hiding label DOM.
// ============================================================

(function () {
  'use strict';

  // ── Idle-time visibility selector ─────────────────────────
  // @param hitNodes   Array<{ id, x, y, r, tier }>  positions
  //                   in world space (the same hitNodes the
  //                   view already uses for hit-testing).
  // @param camScale   number   current camera scale
  // @param opts {
  //                   tierZoomThresholds: [t0, t1, t2, t3]
  //                     show labels for tier T when camScale >= tierZoomThresholds[T].
  //                     Use Infinity to mean "never".
  //                   maxLabels:   number  cap (collision safety net)
  //                   labelSizePx: number  text size in screen px
  //                                        (used to estimate AABB width)
  //                   collisionPaddingPx: number  extra screen padding
  //                                        around each label's AABB
  //                   estimateLabelWidth: (id) => number  optional
  //                                        custom width estimator
  //                   worldToScreen: (x, y) => {x,y}    REQUIRED
  //                                        for screen-space collision
  //                 }
  // @returns Set<nodeId>  the ids that SHOULD show a label at idle.
  function computeIdleLabelVisibility(hitNodes, camScale, opts) {
    // Phase 18 (2026-05-21) — 6-tier thresholds. T3 is no longer the
    // long-tail catch-all that dumped 400+ labels at one zoom step;
    // it's now the FIRST of three sub-tiers (3 / 4 / 5) each at its
    // own threshold, so the reveal is progressive instead of a
    // cluttered cliff at ~2.0×.
    const thresh  = (opts && opts.tierZoomThresholds) || [0, 1.0, 1.8, 2.0, 2.5, 3.5];
    const cap     = (opts && opts.maxLabels)          || 200;
    const sizePx  = (opts && opts.labelSizePx)        || 11;
    const padPx   = (opts && opts.collisionPaddingPx) || 4;
    const w2s     = opts && opts.worldToScreen;
    const estW    = (opts && opts.estimateLabelWidth) || ((id) => Math.max(40, id.length * sizePx * 0.55));

    if (!w2s) return new Set();

    // Pass 1: per-tier eligibility by zoom threshold.
    // tierBuckets[T] = nodes of tier T that pass camScale.
    const NUM_TIERS = 6;
    const tierBuckets = [[], [], [], [], [], []];
    for (let i = 0; i < hitNodes.length; i++) {
      const n = hitNodes[i];
      const t = n.tier | 0;
      if (t < 0 || t >= NUM_TIERS) continue;
      const need = thresh[t];
      if (need == null || need === Infinity) continue;
      if (camScale + 1e-6 >= need) tierBuckets[t].push(n);
    }

    // Pass 2: walk top-down, AABB-prune against already-shown set.
    // Each label's AABB is (cx ± halfW, cy ± halfH) where cx,cy is
    // the screen-space position just above the disk.
    //
    // Phase 18 (2026-05-21) — collision pruning applies to ALL tiers
    // now, including T3/T4/T5. Per John's directive: lower tiers
    // RESPECT the upper tiers and don't appear if no room. The
    // previous skipCollision exception for the long-tail tier
    // (which dumped 400+ overlapping labels at deep zoom) is GONE.
    //
    // Per-tier soft budgets prevent any single tier from starving
    // others. The OVERALL `cap` (label_idle_max) is the hard limit.
    const out = new Set();
    const boxes = [];   // [x0, y0, x1, y1] per shown label
    const halfH = sizePx * 0.6 + padPx;
    const tierBudget = [
      Math.floor(cap * 0.40),  // T0  top hubs
      Math.floor(cap * 0.30),  // T1
      Math.floor(cap * 0.20),  // T2
      Math.floor(cap * 0.30),  // T3  long-tail-a
      Math.floor(cap * 0.30),  // T4  long-tail-b
      cap,                     // T5  long-tail-c (uncapped — only `cap` limits)
    ];
    for (let T = 0; T < NUM_TIERS; T++) {
      const bucket = tierBuckets[T];
      const budget = tierBudget[T];
      let addedThisTier = 0;
      for (let i = 0; i < bucket.length; i++) {
        if (out.size >= cap) return out;
        if (addedThisTier >= budget) break;
        const n = bucket[i];
        const s = w2s(n.x, n.y);
        const halfW = estW(n.id) * 0.5 + padPx;
        const cy = s.y - n.r * camScale - 6;
        const cx = s.x;
        const x0 = cx - halfW, y0 = cy - halfH;
        const x1 = cx + halfW, y1 = cy + halfH;
        let collides = false;
        for (let b = 0; b < boxes.length; b += 4) {
          if (x0 < boxes[b+2] && x1 > boxes[b] && y0 < boxes[b+3] && y1 > boxes[b+1]) {
            collides = true; break;
          }
        }
        if (collides) continue;
        out.add(n.id);
        boxes.push(x0, y0, x1, y1);
        addedThisTier++;
      }
    }
    return out;
  }

  // ── Export ────────────────────────────────────────────
  window.AtlasEngineGraph = window.AtlasEngineGraph || {};
  window.AtlasEngineGraph.computeIdleLabelVisibility = computeIdleLabelVisibility;
})();
