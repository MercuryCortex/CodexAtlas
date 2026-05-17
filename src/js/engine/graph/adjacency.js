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
      for (const id of lockedSet) out.add(id);
    }
    return out;
  }

  // Compute per-instance state floats from a focusedSet.
  //   0.0 = focused (full opacity)
  //   1.0 = dimmed
  // Length matches idIndex. When focusedSet is null, returns
  // an all-zeros array (no dim — idle state).
  //
  // The renderer multiplies (1 - state * dimAmount) by node
  // alpha in the fragment shader.
  function computeNodeStates(idIndex, focusedSet) {
    const out = new Float32Array(idIndex.length);
    if (!focusedSet) return out;
    for (let i = 0; i < idIndex.length; i++) {
      out[i] = focusedSet.has(idIndex[i]) ? 0.0 : 1.0;
    }
    return out;
  }

  // Per-edge state: an edge is "focused" iff BOTH endpoints
  // are in focusedSet (1-hop edges incident to the hovered
  // node are focused; edges between two non-focused nodes
  // are dimmed).
  function computeEdgeStates(edges, focusedSet) {
    const out = new Float32Array(edges.length);
    if (!focusedSet) return out;
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      out[i] = (focusedSet.has(e.source) && focusedSet.has(e.target)) ? 0.0 : 1.0;
    }
    return out;
  }

  // ── Export ────────────────────────────────────────────
  window.AtlasEngineGraph = window.AtlasEngineGraph || {};
  window.AtlasEngineGraph.buildAdjacency    = buildAdjacency;
  window.AtlasEngineGraph.focusedSetFor     = focusedSetFor;
  window.AtlasEngineGraph.computeNodeStates = computeNodeStates;
  window.AtlasEngineGraph.computeEdgeStates = computeEdgeStates;
})();
