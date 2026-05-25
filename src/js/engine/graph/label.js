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
    // Phase 24-CENTER-WEIGHT (2026-05-26) — smoother tier progression.
    // Was [0, 1.0, 1.8, 2.0, 2.5, 3.5] which had a cliff at 1.8→2.0
    // (T2 and T3 revealed at almost the same zoom = visual dump).
    // New evenly-spaced [0, 0.8, 1.2, 1.6, 2.0, 2.8] — 0.4 between
    // each adjacent tier, T1 reveals at default zoom, T2 reveals
    // sooner (1.2 vs 1.8), no two-tier overlap cliff.
    const thresh  = (opts && opts.tierZoomThresholds) || [0, 0.8, 1.2, 1.6, 2.0, 2.8];
    const cap     = (opts && opts.maxLabels)          || 200;
    const sizePx  = (opts && opts.labelSizePx)        || 11;
    const padPx   = (opts && opts.collisionPaddingPx) || 4;
    const w2s     = opts && opts.worldToScreen;
    const estW    = (opts && opts.estimateLabelWidth) || ((id) => Math.max(40, id.length * sizePx * 0.55));
    // Phase 24-CENTER-WEIGHT (2026-05-26) — label density bias toward
    // the viewport center. Split each tier's budget into center vs
    // edge: a label whose screen position falls inside a center
    // radius (default 35% of min(vp.w, vp.h)) competes for the
    // center-share; outside competes for the edge-share. Default
    // centerWeight = 0.7 means 70% of each tier's budget can land
    // in the center, 30% at the edges. Result: more labels where
    // the user is looking, less clutter at the periphery.
    const centerWeight = (opts && typeof opts.centerWeight === 'number')
      ? Math.max(0, Math.min(1, opts.centerWeight)) : 0.7;
    const centerRadiusRatio = (opts && typeof opts.centerRadiusRatio === 'number')
      ? opts.centerRadiusRatio : 0.35;
    // Phase 24C v1 (2026-05-26) — viewport cull. When `opts.viewport`
    // (= {w, h}) is provided, skip any candidate whose screen position
    // falls outside the viewport plus `viewportMarginPx` (default 100).
    // Previously the function iterated ALL hitNodes and applied AABB
    // collision to all of them, producing screen-space layouts for
    // hundreds of off-screen labels at moderate zoom-in. At 181% zoom
    // on the deity wheel, ~270 candidate labels became collision
    // boxes even though only ~80 of them were actually on-screen.
    // The pruning gives the per-frame label pipeline a sub-linear
    // floor: as you zoom in, more nodes fall off-screen and fewer
    // labels enter the collision pass.
    const vp      = opts && opts.viewport;
    const vMargin = (opts && opts.viewportMarginPx) || 100;
    const useVpCull = !!(vp && typeof vp.w === 'number' && typeof vp.h === 'number');

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
    // Phase 24-CENTER-WEIGHT — split each tier's budget into
    // center-share + edge-share. Center gets `centerWeight`, edge
    // gets the remainder. Floor so neither half over-spends.
    const tierBudgetCenter = tierBudget.map(b => Math.floor(b * centerWeight));
    const tierBudgetEdge   = tierBudget.map((b, i) => b - tierBudgetCenter[i]);
    // Center region: a disc centered on the viewport mid-point with
    // radius = centerRadiusRatio × min(vp.w, vp.h). Default 35% of
    // the short axis ⇒ center disc covers ~10% of viewport area but
    // takes 70% of label budget = ~7× density in the focus zone.
    const useCenterWeight = useVpCull;
    const cxC = useCenterWeight ? vp.w / 2 : 0;
    const cyC = useCenterWeight ? vp.h / 2 : 0;
    const centerRadius = useCenterWeight ? Math.min(vp.w, vp.h) * centerRadiusRatio : 0;
    const centerRadiusSq = centerRadius * centerRadius;
    for (let T = 0; T < NUM_TIERS; T++) {
      const bucket = tierBuckets[T];
      const budgetCenter = tierBudgetCenter[T];
      const budgetEdge   = tierBudgetEdge[T];
      let addedCenter = 0;
      let addedEdge   = 0;
      for (let i = 0; i < bucket.length; i++) {
        if (out.size >= cap) return out;
        // Skip tier entirely once both center+edge are full.
        if (useCenterWeight) {
          if (addedCenter >= budgetCenter && addedEdge >= budgetEdge) break;
        } else {
          if (addedCenter + addedEdge >= budgetCenter + budgetEdge) break;
        }
        const n = bucket[i];
        const s = w2s(n.x, n.y);
        // Phase 24C v1 — viewport cull. Cheap test BEFORE the AABB
        // collision loop (which is O(boxes.length) per candidate).
        if (useVpCull && (s.x < -vMargin || s.x > vp.w + vMargin
                       || s.y < -vMargin || s.y > vp.h + vMargin)) {
          continue;
        }
        // Phase 24-CENTER-WEIGHT — classify center vs edge by screen
        // position; check the appropriate budget BEFORE AABB collision.
        let inCenter = false;
        if (useCenterWeight) {
          const dx = s.x - cxC, dy = s.y - cyC;
          inCenter = (dx * dx + dy * dy) <= centerRadiusSq;
          if (inCenter && addedCenter >= budgetCenter) continue;
          if (!inCenter && addedEdge >= budgetEdge) continue;
        }
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
        if (inCenter) addedCenter++;
        else          addedEdge++;
      }
    }
    return out;
  }

  // ── Export ────────────────────────────────────────────
  window.AtlasEngineGraph = window.AtlasEngineGraph || {};
  window.AtlasEngineGraph.computeIdleLabelVisibility = computeIdleLabelVisibility;
})();
