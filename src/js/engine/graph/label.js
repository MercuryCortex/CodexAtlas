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
  //                   ── THE OPEN SET (2026-07-31 wave 4) ──
  //                   openIds:  Set<id>   nodes that are NAME-WORTHY by
  //                             their own presentation, not by the
  //                             wheel's degree percentile. See the
  //                             argument below.
  //                   openMax:  number    how many of them may be
  //                             admitted (0 = none; an explicit 0 is
  //                             honoured, it is not "absent").
  //                   openRank: Map<id, number>  higher goes first —
  //                             degree, so collision resolves ties in
  //                             an order the reader can name.
  //                 }
  // @returns Set<nodeId>  the ids that SHOULD show a label at idle.
  //
  // ── WHY THE OPEN SET EXISTS (2026-07-31 wave 4) ────────────────
  // John: "the DEities nodes are the most important and NEVER appear,
  // i need to OVER to see the names.... even at 100% scale!"
  //
  // MEASURED: in the Norse house at camScale 1.0, 5 of 50 gods were
  // eligible for a name (3 at the isolate's own fit scale of ~0.70) —
  // and all 50 are drawn at the IDENTICAL radius (worldR 23.84).
  //
  // The tier ladder is not broken; it is answering a question the
  // house does not ask. `tier` is a degree percentile taken across the
  // WHOLE wheel, and ON the wheel it correlates with disc size, so
  // gating names on zoom declutters honestly: a big disc earns its
  // name first. The house throws that correlation away — it re-sizes
  // every member onto its own radius lane, so 50 equally-large discs
  // stand there with 47 of them mute for a reason nothing on screen
  // expresses.
  //
  // So: inside a house, name-worthiness follows the house's own
  // presentation. `openIds` is admitted with NO zoom gate and NO
  // centre-weight budget, ordered by `openRank`.
  //
  // AND NO AABB PASS OF ITS OWN — deliberate, per law 5 (ONE LABEL
  // REGISTRY). The view's renderLabelsCanvas runs the real,
  // priority-ordered `claim()` over every name AND every piece of
  // house chrome. A second collision pass here, with a different
  // width estimate and a different rect, could only ever refuse a
  // name the real registry would have printed — which is the exact
  // complaint. The open set is CANDIDACY; `claim()` decides who
  // prints. `openMax` is the ceiling, and it is a LAB dial.
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

    // ── Pass 0: THE OPEN SET (see the header argument) ─────────
    // No zoom gate, no centre-weight budget, no AABB of its own.
    // Deterministic: openRank desc, then id.
    const openIds  = (opts && opts.openIds instanceof Set) ? opts.openIds : null;
    const openMax  = (opts && typeof opts.openMax === 'number')   // an explicit 0 means ZERO
      ? Math.max(0, Math.floor(opts.openMax)) : 0;
    const openRank = (opts && opts.openRank instanceof Map) ? opts.openRank : null;
    // HONEST ZERO of the ceiling dial: openMax 0 means the open pass
    // does not run AT ALL — including its exclusion from the ladder
    // below. Otherwise setting the dial to 0 would delete every house
    // name instead of handing the house back to the zoom ladder, which
    // is not what "off" means.
    const openOn = !!(openIds && openIds.size && openMax > 0);
    const out = new Set();
    if (openOn) {
      const open = [];
      for (let i = 0; i < hitNodes.length; i++) {
        const n = hitNodes[i];
        if (!openIds.has(n.id)) continue;
        if (useVpCull) {
          const s = w2s(n.x, n.y);
          if (s.x < -vMargin || s.x > vp.w + vMargin
              || s.y < -vMargin || s.y > vp.h + vMargin) continue;
        }
        open.push(n);
      }
      const rankOf = (n) => (openRank ? (openRank.get(n.id) || 0) : 0);
      open.sort((a, b) => (rankOf(b) - rankOf(a)) || (a.id < b.id ? -1 : 1));
      for (let i = 0; i < open.length && out.size < openMax; i++) out.add(open[i].id);
    }

    // Pass 1: per-tier eligibility by zoom threshold.
    // tierBuckets[T] = nodes of tier T that pass camScale.
    // An open-set member never enters the ladder — it is already
    // admitted (or already over the ceiling), and letting it compete
    // again would spend a tier budget on a decided name.
    const NUM_TIERS = 6;
    const tierBuckets = [[], [], [], [], [], []];
    for (let i = 0; i < hitNodes.length; i++) {
      const n = hitNodes[i];
      if (openOn && openIds.has(n.id)) continue;
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
