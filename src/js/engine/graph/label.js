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
    const thresh  = (opts && opts.tierZoomThresholds) || [0, 1.0, 1.8, Infinity];
    const cap     = (opts && opts.maxLabels)          || 200;
    const sizePx  = (opts && opts.labelSizePx)        || 11;
    const padPx   = (opts && opts.collisionPaddingPx) || 4;
    const w2s     = opts && opts.worldToScreen;
    const estW    = (opts && opts.estimateLabelWidth) || ((id) => Math.max(40, id.length * sizePx * 0.55));

    if (!w2s) return new Set();

    // Pass 1: per-tier eligibility by zoom threshold.
    // tierBuckets[T] = nodes of tier T that pass camScale.
    const tierBuckets = [[], [], [], []];
    for (let i = 0; i < hitNodes.length; i++) {
      const n = hitNodes[i];
      const t = n.tier | 0;
      if (t < 0 || t > 3) continue;
      const need = thresh[t];
      if (need == null || need === Infinity) continue;
      if (camScale + 1e-6 >= need) tierBuckets[t].push(n);
    }

    // Pass 2: walk top-down, AABB-prune against already-shown set.
    // Each label's AABB is (cx ± halfW, cy ± halfH) where cx,cy is
    // the screen-space position just above the disk. We keep the
    // boxes as flat arrays to avoid GC churn at 663 entries.
    //
    // Phase 6d — fairness fix: previously a single top-down walk
    // with one shared cap meant that when tiers 0-2 produced
    // many candidates, tier 3 frequently got zero. Now each
    // tier gets its own SOFT BUDGET so even if higher tiers
    // claim most of the screen, tier 3 still gets a shot. We
    // also collide more leniently for tier 3 (50% padding) since
    // those labels are the "everyone else" group and the user
    // explicitly opted them in.
    const out = new Set();
    const boxes = [];   // [x0, y0, x1, y1] per shown label
    const halfH = sizePx * 0.6 + padPx;
    // Per-tier budget — higher tiers get more room, but every
    // tier reserves at least some labels so tier 3 isn't starved.
    const tierBudget = [Math.floor(cap * 0.40), Math.floor(cap * 0.30), Math.floor(cap * 0.20), Math.floor(cap * 0.40)];
    for (let T = 0; T < 4; T++) {
      const bucket = tierBuckets[T];
      const budget = tierBudget[T];
      let addedThisTier = 0;
      // Tier 3 (rest) gets a slightly relaxed pad — the user
      // dialled its threshold low specifically because they want
      // these labels to show.
      const padFactor = (T === 3) ? 0.5 : 1.0;
      for (let i = 0; i < bucket.length; i++) {
        if (out.size >= cap) return out;
        if (addedThisTier >= budget) break;
        const n = bucket[i];
        const s = w2s(n.x, n.y);
        const halfW = (estW(n.id) * 0.5 + padPx) * padFactor;
        const halfHT = halfH * padFactor;
        const cy = s.y - n.r * camScale - 6;
        const cx = s.x;
        const x0 = cx - halfW, y0 = cy - halfHT;
        const x1 = cx + halfW, y1 = cy + halfHT;
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
