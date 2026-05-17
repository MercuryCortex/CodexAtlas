// ============================================================
// CODEX ATLAS — ADJACENCY MAP
// ============================================================
// Builds neighbor-of-each-node sets from an edge list.
// Used by the hover/focus dim pipeline: when the user hovers
// node N, we light up N + its 1-hop neighbors and dim
// everything else. Done CPU-side so the GPU shaders stay
// agnostic to graph structure.
//
// Pure function. No DOM, no global state.
// ============================================================

(function () {
  'use strict';

  // Build the adjacency map.
  // @param edges  Array of { source, target } (and anything else; ignored).
  // @returns Map<nodeId, Set<nodeId>>
  function buildAdjacency(edges) {
    const adj = new Map();
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if (!adj.has(e.source)) adj.set(e.source, new Set());
      if (!adj.has(e.target)) adj.set(e.target, new Set());
      adj.get(e.source).add(e.target);
      adj.get(e.target).add(e.source);
    }
    return adj;
  }

  // Compute the focused-node set: a hovered node + its 1-hop
  // neighbors, plus an optional locked set (e.g., from clicks).
  //
  // @param hoverId    string | null  — currently hovered node id
  // @param lockedSet  Set<string> | null — sticky-locked nodes
  // @param adjacency  Map<id, Set<id>>  — from buildAdjacency
  // @returns Set<nodeId> | null  — null = no focus (idle state)
  //
  // Convention: returning null lets the renderer skip the dim
  // pass entirely (all nodes paint at full alpha). When a hover
  // or lock is active, returns the focused set so the renderer
  // can attenuate non-members.
  function focusedSetFor(hoverId, lockedSet, adjacency) {
    const hasHover  = !!hoverId;
    const hasLock   = lockedSet && lockedSet.size > 0;
    if (!hasHover && !hasLock) return null;
    const out = new Set();
    if (hasHover) {
      out.add(hoverId);
      const nbrs = adjacency.get(hoverId);
      if (nbrs) for (const n of nbrs) out.add(n);
    }
    if (hasLock) {
      // Locked nodes also get 1-hop expansion so a click-to-pin
      // preserves the network when the cursor moves away. Same
      // visual rule as hover, just sticky.
      for (const id of lockedSet) {
        out.add(id);
        const nbrs = adjacency.get(id);
        if (nbrs) for (const n of nbrs) out.add(n);
      }
    }
    return out;
  }

  // Compute per-instance NODE state floats from a focusedSet.
  //   0.0 = focused (full opacity, no dim)
  //   1.0 = dimmed (alpha multiplied by 1 - dim_amount)
  // Length matches idIndex. When focusedSet is null (truly
  // idle — no hover, no lock), returns an all-zeros array so
  // every node paints at full opacity. The dim only kicks in
  // when something is in focus.
  function computeNodeStates(idIndex, focusedSet) {
    const out = new Float32Array(idIndex.length);
    if (!focusedSet) return out;
    for (let i = 0; i < idIndex.length; i++) {
      out[i] = focusedSet.has(idIndex[i]) ? 0.0 : 1.0;
    }
    return out;
  }

  // Per-edge state.
  //   0.0 = HOT — paint with bucket-hex hot color (focused, in 1-hop)
  //   1.0 = IDLE — paint with instance_color (slate / headline-low-alpha)
  // An edge is "hot" iff BOTH endpoints are in focusedSet.
  //
  // When focusedSet is null (truly idle — no hover, no lock),
  // every edge gets state=1 so the whole wire constellation
  // sits at IDLE (faint slate atmosphere + headline-color
  // whispers for polemic/fusion). The drawFrame caller is
  // expected to also drop dimAmount to 0 in this case so the
  // already-faint idle alphas aren't further attenuated.
  function computeEdgeStates(edges, focusedSet) {
    const out = new Float32Array(edges.length);
    if (!focusedSet) { out.fill(1.0); return out; }
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      out[i] = (focusedSet.has(e.source) && focusedSet.has(e.target)) ? 0.0 : 1.0;
    }
    return out;
  }

  // Per-node SELECTED flag — 1 if the node is in `selectedSet`
  // (the anchor set: hoverId ∪ lockedSet), else 0. Phase 6c
  // introduced this as the third visual state on top of the
  // existing focus/dim binary. Used to drive the glow ring +
  // size bump in the node shader.
  function computeSelectedStates(idIndex, selectedSet) {
    const out = new Float32Array(idIndex.length);
    if (!selectedSet || !selectedSet.size) return out;
    for (let i = 0; i < idIndex.length; i++) {
      out[i] = selectedSet.has(idIndex[i]) ? 1.0 : 0.0;
    }
    return out;
  }

  // ── Export ────────────────────────────────────────────
  window.AtlasEngineGraph = window.AtlasEngineGraph || {};
  window.AtlasEngineGraph.buildAdjacency        = buildAdjacency;
  window.AtlasEngineGraph.focusedSetFor         = focusedSetFor;
  window.AtlasEngineGraph.computeNodeStates     = computeNodeStates;
  window.AtlasEngineGraph.computeEdgeStates     = computeEdgeStates;
  window.AtlasEngineGraph.computeSelectedStates = computeSelectedStates;
})();
