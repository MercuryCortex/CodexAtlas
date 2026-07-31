// ============================================================
// CODEX ATLAS — FAMILY TREE LAYOUT ("THE HOUSE", 2026-07-30)
// ============================================================
// Sibling of radial.js / timeline.js. Pure function — no DOM, no
// camera, no globals read. Spec: AUDIT/2026-07-29-fable-family-
// tree-isolate.md §1-2; reference implementation (and acceptance
// test): design/family-tree.html.
//
// THE FOUR LAWS (from the audit, data-derived):
//   1. Lineage arcs are the bones — parent→child arcs layered by
//      longest-path-from-roots inside each connected component.
//      The data is a DAG-with-orphans everywhere (Greek: 34/80
//      multi-parent) and never a clean tree; a cycle, should one
//      ever enter the data, is broken deterministically at the
//      arc whose parent has the youngest date (and logged).
//   2. Every rank is an era — date_earliest has 100% coverage on
//      deities, so a component hangs from the era-rank of its
//      oldest root and the unparented stand on their era rank
//      directly. Chinese (zero kinship) degrades continuously
//      into chronological strata, never into a broken layout.
//   3. The unparented are a court, not a crowd — grouped by
//      primary domain (or degree) inside their rank.
//   4. Laterals never rank — consorts order-adjacent, multi-parent
//      arcs all drawn (primary flagged), aspect/avatar arcs act as
//      placement-parents only for the otherwise-unparented.
//
// GROUPING IS A PARAMETER (cardinal rule #9): membership is
// `opts.groupBy(n) === opts.groupKey`. This file never references
// `n.family`. A Codex corpus-section isolate rides the same path.
//
// CONTRACT (shared with radialWedgeLayout / timelineLayout):
//   returns { positions: Map<id,{x,y}>, worldExtent:{x0,y0,x1,y1} }
//   plus mode metadata (`house`, `ports`) for the view to render,
//   plus `radii: Map<id,r>` — HOUSE node radii for members (2026-07-30
//   SCALE pass): the view bakes them into position-B so gods GROW as
//   the layout ramps in. Wheel radii are untouched (honest zeros).
//   ONE PASS POSITIONS ALL NODES: members into the house,
//   non-members onto their group's horizon port — so every edge
//   keeps live endpoints and external wires land on ports with no
//   pseudo-node hacks.
//
// Determinism: no Math.random; every sort carries an id tiebreak.
// Same input → same house, every time (`scripts/check-familytree.mjs`
// pins this on the two extremes, Greek and Chinese).
// ============================================================

(function () {
  'use strict';

  // Geometry constants — fractions of the house radius Rh, matching
  // the ratified toy (design/family-tree.html buildTreeScene).
  // 2026-07-30 SCALE + BUNDLES pass: a rank is a BED (staggered
  // sub-rows) or a braided ring, never a queue, and the pitch P is
  // SOLVED so the beds FILL the house — a 12-deity family gets a
  // huge P (huge gods), a 97-deity one a moderate one. Node radius
  // rides P (returned in `radii`), which is the whole point: the
  // house re-presents the family CLOSE, not merely re-arranged.
  const CASCADE_TOP    = -0.58;  // yTop  = cy + Rh * CASCADE_TOP
  const CASCADE_BOTTOM =  0.84;  // yBot  = cy + Rh * CASCADE_BOTTOM
  const CASCADE_BIAS   =  0.10;  // stack centre sits below cy
  const CASCADE_CHORD  =  0.74;  // coarse chord factor for the P solve
  const BED_GG         =  0.55;  // extra air (in P) at group boundaries
  const BED_SUBDY      =  0.78;  // sub-row spacing (in P)
  const BED_GAP        =  1.5;   // inter-band gap (in P) — arc room
  const NODE_R_FRAC    =  0.34;  // node radius = P * this * tier mult
  const TIER_MULTS     =  [1.30, 1.02, 0.82];   // hub / mid / small
  const FAN_SPAN       =  Math.PI * 1.10;  // per-ring window cap (±99°)
  const FAN_R_IN_U     =  2.3;   // innermost ring radius (in P)
  const FAN_RING_U     =  1.70;  // ring pitch (in P)
  const FAN_BRAID_U    =  0.30;  // braid amplitude (in P, flat)
  const FAN_COMP       =  0.78;  // braided angular-pitch compression
  const FAN_DY         =  0.34;  // fan origin sits at cy + Rh * this
  const RAIL_X         =  0.885; // rails at ± Rh * RAIL_X
  const RAIL_Y_SPAN    =  0.60;  // rails run cy ± Rh * RAIL_Y_SPAN
  // THE RAILS GET REAL MASS (2026-07-31) — a rail item is a real
  // engine instance now, so it needs a RADIUS like every other member.
  // The glyph rides the rail PITCH exactly as a god's disk rides P:
  // a 24-spine Scriptorium reads fat, a 150-slot Court reads slim, and
  // 2·r ≤ pitch at both ends of the clamp so slots can never touch.
  const RAIL_R_FRAC    =  0.40;  // glyph radius = pitch * this
  const RAIL_R_MIN     =  1.6;   // (pitch floor 3.8 ⇒ 2·1.6 < 3.8)
  const RAIL_R_MAX     =  3.6;   // (pitch ceil  9.0 ⇒ 2·3.6 < 9.0)
  // DISPLAY cap per rail. 'Other' holds 2,336 non-deity members; a
  // 2,336-slot column is neither drawable nor readable. Capping is a
  // display decision, never a claim: `count` stays the family's TRUE
  // mass (what the header and the crown assert) and `overflow` is the
  // honest remainder, parked ON the crown at zero radius.
  const RAIL_MAX       =  150;
  const WORLD_MARGIN   =  70;    // worldExtent pad beyond Rh

  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }

  function strHash(s) {
    let h = 2166136261 >>> 0;
    const str = String(s || '');
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  // @param nodes  Array of node records ({id, type, date_earliest, domains, ...}).
  // @param opts {
  //   groupBy:    n => groupName          (REQUIRED semantic; defaults to n.family
  //                                        ONLY as the historical Atlas fallback —
  //                                        callers with another spread pass their own)
  //   groupKey:   the isolated group name (REQUIRED)
  //   arcs:       [[parentId, childId], ...]   lineage, pre-normalized by the view
  //   laterals:   [[aId, bId], ...]            consorts
  //   aspects:    [[aId, bId], ...]            avatar/manifestation/constituent —
  //                                            hub normalized here (higher degree)
  //   degree:     Map<id, number>
  //   bearings:   { [groupName]: angleRad }    wheel bearing per non-member group
  //   groupColor: { [groupName]: cssColor }    carried onto ports (view convenience)
  //   portWeights:{ [groupName]: extWireCount }
  //   center:     {x, y}   default {0,0}
  //   radius:     Rh       default 540
  //   geometry:   'cascade' | 'fan'      default 'cascade'
  //   ranks:      'lineage' | 'era'      default 'lineage'
  //   orphans:    'domain' | 'degree'    default 'domain'
  //   spread:     0.85..1.5              default 1.10
  //   consorts:   bool                   default true  (adjacency ordering)
  //   aspectsOn:  bool                   default true  (placement-parents)
  //   treeKindOf: n => 'tree'|'doc'|'court'  default: deity→tree,
  //               document→doc, else court. If the tree set comes out
  //               empty (a family with no deities in this mode), ALL
  //               members become the tree — the house never breaks.
  //   dateOf:     n => year|null         default n.date_earliest
  //   domainOf:   n => string            default first token of n.domains
  //   railMax:    number  default 150    DISPLAY cap per rail; the
  //               remainder is parked on the crown with no radius and
  //               reported as rails.<side>.overflow (never a count lie —
  //               rails.<side>.count stays the family's true mass)
  //   railGlyph:  number  default 0.40   rail glyph radius as a fraction
  //               of the solved rail pitch, clamped to [1.6, 3.6] wu
  // }
  function familyTreeLayout(nodes, opts) {
    const o = opts || {};
    const groupBy  = (typeof o.groupBy === 'function') ? o.groupBy : (n => (n && n.family) || 'Other');
    const groupKey = o.groupKey;
    const degree   = (o.degree instanceof Map) ? o.degree : new Map();
    const cx = o.center ? num(o.center.x, 0) : 0;
    const cy = o.center ? num(o.center.y, 0) : 0;
    const Rh = Math.max(60, num(o.radius, 540));
    const geometry = (o.geometry === 'fan') ? 'fan' : 'cascade';
    const ranksMode = (o.ranks === 'era') ? 'era' : 'lineage';
    const orphanMode = (o.orphans === 'degree') ? 'degree' : 'domain';
    const spread = Math.max(0.6, Math.min(2, num(o.spread, 1.10)));
    const useConsorts = o.consorts !== false;
    const useAspects  = o.aspectsOn !== false;
    const dateOf = (typeof o.dateOf === 'function') ? o.dateOf
      : (n => (typeof n.date_earliest === 'number' && isFinite(n.date_earliest)) ? n.date_earliest : null);
    const domainOf = (typeof o.domainOf === 'function') ? o.domainOf
      : (n => {
          const d = n && n.domains;
          if (Array.isArray(d) && d.length) return String(d[0]);
          if (typeof d === 'string' && d) return d.split(/[,·]/)[0].trim();
          return '~';
        });
    const treeKindOf = (typeof o.treeKindOf === 'function') ? o.treeKindOf
      : (n => (n.type === 'deity') ? 'tree' : (n.type === 'document' ? 'doc' : 'court'));

    const positions = new Map();
    const degOf = (id) => degree.get(id) || 0;

    // ── 1. Membership split ─────────────────────────────────
    const members = [];
    const others  = [];
    for (const n of nodes) {
      if (!n || !n.id) continue;
      if (groupBy(n) === groupKey) members.push(n); else others.push(n);
    }
    let tree = [], docs = [], court = [];
    for (const n of members) {
      const k = treeKindOf(n);
      if (k === 'tree') tree.push(n);
      else if (k === 'doc') docs.push(n);
      else court.push(n);
    }
    // Degrade gracefully: a family with no tree-kind members in this
    // mode still opens — everything becomes the cascade.
    if (!tree.length) { tree = members.slice(); docs = []; court = []; }
    // Deterministic base order (input order is layout-cache dependent).
    tree.sort((a, b) => (a.id < b.id ? -1 : 1));

    const N = tree.length;
    const idxOf = new Map();
    tree.forEach((n, i) => idxOf.set(n.id, i));

    // ── 2. Bones: lineage arcs among the tree set ───────────
    const parents = [], children = [];
    for (let i = 0; i < N; i++) { parents.push([]); children.push([]); }
    const arcs = [];   // {p, c, primary} member-index space
    const seenArc = new Set();
    for (const pc of (o.arcs || [])) {
      const p = idxOf.get(pc[0]), c = idxOf.get(pc[1]);
      if (p == null || c == null || p === c) continue;
      const key = p + ':' + c;
      if (seenArc.has(key)) continue;
      seenArc.add(key);
      arcs.push({ p, c, primary: false });
      parents[c].push(p);
      children[p].push(c);
    }
    // Aspect arcs — hub = higher-degree endpoint (tie: older date,
    // then id). Placement-parents ONLY for the otherwise-unparented.
    const aspectArcs = [];
    if (useAspects) {
      const seenAsp = new Set();
      for (const ab of (o.aspects || [])) {
        const ia = idxOf.get(ab[0]), ib = idxOf.get(ab[1]);
        if (ia == null || ib == null || ia === ib) continue;
        let hub = ia, asp = ib;
        const da = degOf(tree[ia].id), db = degOf(tree[ib].id);
        if (db > da) { hub = ib; asp = ia; }
        else if (db === da) {
          const ta = dateOf(tree[ia]), tb = dateOf(tree[ib]);
          if (tb != null && (ta == null || tb < ta)) { hub = ib; asp = ia; }
          else if (ta === tb && tree[ib].id < tree[ia].id) { hub = ib; asp = ia; }
        }
        const key = hub + ':' + asp;
        if (seenAsp.has(key)) continue;
        seenAsp.add(key);
        aspectArcs.push({ p: hub, c: asp });
        if (parents[asp].length === 0) {
          parents[asp].push(hub);
          children[hub].push(asp);
        }
      }
    }
    // Primary parent per child = highest degree (tie: id) — anchors
    // barycenter placement; every other arc still draws, lighter.
    const primaryParent = new Array(N).fill(-1);
    for (let c = 0; c < N; c++) {
      let best = -1;
      for (const p of parents[c]) {
        if (best < 0 || degOf(tree[p].id) > degOf(tree[best].id)
            || (degOf(tree[p].id) === degOf(tree[best].id) && tree[p].id < tree[best].id)) best = p;
      }
      primaryParent[c] = best;
    }
    for (const a of arcs) a.primary = (primaryParent[a.c] === a.p);

    // ── 2b. Cycle guard — deterministic break, logged ───────
    // Today this fires zero times (verified across all 30 families);
    // the guard exists so bad data degrades a picture, not the app.
    let cyclesBroken = 0;
    {
      const state = new Array(N).fill(0);   // 0 unvisited, 1 in-stack, 2 done
      const stack = [];
      const removeArc = (p, c) => {
        parents[c] = parents[c].filter(x => x !== p);
        children[p] = children[p].filter(x => x !== c);
        for (let i = arcs.length - 1; i >= 0; i--) {
          if (arcs[i].p === p && arcs[i].c === c) arcs.splice(i, 1);
        }
        cyclesBroken++;
      };
      const visit = (start) => {
        stack.length = 0;
        stack.push([start, 0]);
        state[start] = 1;
        const chain = [start];
        while (stack.length) {
          const top = stack[stack.length - 1];
          const u = top[0];
          if (top[1] < children[u].length) {
            const v = children[u][top[1]++];
            if (state[v] === 1) {
              // Cycle: break the in-cycle arc whose PARENT has the
              // youngest date (largest year; undated = youngest).
              const at = chain.indexOf(v);
              const cyc = chain.slice(at).concat([u]);
              let bp = u, bc = v, by = -Infinity;
              for (let k = chain.indexOf(v); k < chain.length - 1; k++) {
                const pp = chain[k], cc = chain[k + 1];
                const d = dateOf(tree[pp]);
                const y = (d == null) ? Infinity : d;
                if (y > by || (y === by && tree[pp].id > tree[bp].id)) { by = y; bp = pp; bc = cc; }
              }
              const du = dateOf(tree[u]);
              const yu = (du == null) ? Infinity : du;
              if (yu > by) { bp = u; bc = v; }
              removeArc(bp, bc);
              try { console.warn('[familytree] cycle broken at arc', tree[bp].id, '→', tree[bc].id); } catch (_) {}
              // restart this component's DFS from scratch
              for (const q of chain) state[q] = 0;
              return false;
            }
            if (state[v] === 0) { state[v] = 1; stack.push([v, 0]); chain.push(v); }
          } else {
            state[u] = 2;
            stack.pop();
            chain.pop();
          }
        }
        return true;
      };
      for (let s = 0; s < N; s++) {
        while (state[s] !== 2) { if (visit(s)) break; }
      }
    }

    // ── 3. Components + layering (longest path from roots) ──
    const comp = new Array(N).fill(-1);
    let nComp = 0;
    for (let s = 0; s < N; s++) {
      if (comp[s] >= 0) continue;
      const st = [s];
      comp[s] = nComp;
      while (st.length) {
        const u = st.pop();
        const nbrs = parents[u].concat(children[u]);
        for (const v of nbrs) if (comp[v] < 0) { comp[v] = nComp; st.push(v); }
      }
      nComp++;
    }
    const layer = new Array(N).fill(0);
    for (let iter = 0; iter < N; iter++) {
      let changed = false;
      for (let c = 0; c < N; c++) {
        let best = 0;
        for (const p of parents[c]) if (layer[p] + 1 > best) best = layer[p] + 1;
        if (best > layer[c] && best < N) { layer[c] = best; changed = true; }
      }
      if (!changed) break;
    }
    let maxLayer = 0;
    for (const l of layer) if (l > maxLayer) maxLayer = l;

    // ── 4. Era axis + rank assignment ───────────────────────
    let dmin = Infinity, dmax = -Infinity;
    for (const n of tree) {
      const d = dateOf(n);
      if (d != null) { if (d < dmin) dmin = d; if (d > dmax) dmax = d; }
    }
    if (dmin > dmax) { dmin = 0; dmax = 1; }
    const era = (i) => {
      const d = dateOf(tree[i]);
      return d == null ? 1 : (d - dmin) / Math.max(1, dmax - dmin);
    };
    // 2026-07-30 SCALE pass — the BEDS (§6) absorb density
    // horizontally, so ranks no longer multiply to spread big
    // families vertically (ceil(N/12) is why Vedic needed 9 rows and
    // every house went tall + tiny). Fewer ranks = shorter house =
    // bigger gods after the camera fit.
    let RK = Math.max(maxLayer + 1, Math.ceil(N / 14), 3);
    RK = Math.min(RK, 13);
    const eraRank = (i) => Math.round(era(i) * (RK - 1));

    const rank = new Array(N).fill(0);
    if (ranksMode === 'era') {
      for (let i = 0; i < N; i++) rank[i] = eraRank(i);
    } else {
      const compRootEra = new Array(nComp).fill(Infinity);
      const compDepth   = new Array(nComp).fill(0);
      for (let i = 0; i < N; i++) {
        if (layer[i] > compDepth[comp[i]]) compDepth[comp[i]] = layer[i];
        if (parents[i].length === 0) {
          const er = eraRank(i);
          if (er < compRootEra[comp[i]]) compRootEra[comp[i]] = er;
        }
      }
      for (let i = 0; i < N; i++) {
        const isolated = parents[i].length === 0 && children[i].length === 0;
        if (isolated) { rank[i] = eraRank(i); continue; }
        const rootEra = (compRootEra[comp[i]] === Infinity) ? 0 : compRootEra[comp[i]];
        const base = Math.min(rootEra, RK - 1 - compDepth[comp[i]]);
        rank[i] = Math.max(0, Math.min(RK - 1, base + layer[i]));
      }
    }

    // ── 5. Ordering within ranks ────────────────────────────
    const rows = [];
    for (let r = 0; r < RK; r++) rows.push([]);
    for (let i = 0; i < N; i++) rows[rank[i]].push(i);
    const dom0 = (i) => domainOf(tree[i]) || '~';
    rows.forEach((row) => {
      row.sort((a, b) => {
        const ka = parents[a].length ? ('0c' + comp[a]) : ('1' + (orphanMode === 'domain' ? dom0(a) : '~'));
        const kb = parents[b].length ? ('0c' + comp[b]) : ('1' + (orphanMode === 'domain' ? dom0(b) : '~'));
        if (ka !== kb) return ka < kb ? -1 : 1;
        const da = degOf(tree[a].id), db = degOf(tree[b].id);
        if (da !== db) return db - da;
        return tree[a].id < tree[b].id ? -1 : 1;
      });
    });
    const ux = new Array(N).fill(0.5);
    const reindex = () => rows.forEach((row) => row.forEach((n, j) => { ux[n] = (j + 0.5) / row.length; }));
    reindex();
    // Barycenter sweeps: down, down, up. Orphans follow their
    // domain-group centroid so clusters travel together.
    const groupCentroid = (row, n) => {
      const g = dom0(n);
      let s = 0, c = 0;
      for (const m of row) if (!parents[m].length && dom0(m) === g) { s += ux[m]; c++; }
      return c ? s / c : ux[n];
    };
    for (let pass = 0; pass < 3; pass++) {
      const up = pass === 2;
      rows.forEach((row) => {
        if (row.length < 2) return;
        const key = new Map();
        for (const n of row) {
          const rel = up ? children[n] : parents[n];
          if (rel.length) {
            let s = 0;
            for (const p of rel) s += ux[p];
            key.set(n, s / rel.length);
          } else key.set(n, groupCentroid(row, n));
        }
        row.sort((a, b) => {
          const d = key.get(a) - key.get(b);
          if (d) return d;
          const dd = degOf(tree[b].id) - degOf(tree[a].id);
          if (dd) return dd;
          return tree[a].id < tree[b].id ? -1 : 1;
        });
        row.forEach((n, j) => { ux[n] = (j + 0.5) / row.length; });
      });
    }
    // Consort adjacency — lateral only, never a rank.
    const consortPairs = [];
    for (const ab of (o.laterals || [])) {
      const a = idxOf.get(ab[0]), b = idxOf.get(ab[1]);
      if (a == null || b == null || a === b) continue;
      consortPairs.push({ a, b, adjacent: false });
    }
    if (useConsorts) {
      for (const cp of consortPairs) {
        if (rank[cp.a] !== rank[cp.b]) continue;
        const row = rows[rank[cp.a]];
        let ia = row.indexOf(cp.a), ib = row.indexOf(cp.b);
        if (ia < 0 || ib < 0) continue;
        if (Math.abs(ia - ib) > 1) {
          row.splice(ib, 1);
          ia = row.indexOf(cp.a);
          row.splice(ia + 1, 0, cp.b);
          row.forEach((n, j) => { ux[n] = (j + 0.5) / row.length; });
        }
        cp.adjacent = true;
      }
      // adjacency flag reflects FINAL order
      for (const cp of consortPairs) {
        if (rank[cp.a] !== rank[cp.b]) { cp.adjacent = false; continue; }
        const row = rows[rank[cp.a]];
        cp.adjacent = Math.abs(row.indexOf(cp.a) - row.indexOf(cp.b)) === 1;
      }
    }

    // ── 6. Geometry — beds (cascade) or braided crest (fan) ─
    // Same-era deities BUNDLE: column-major sub-row beds with hex
    // stagger (cascade) / braided rings (fan), wider air at group
    // boundaries so each kin/domain bundle reads as one shape. The
    // pitch P is solved so content FILLS the house (the toy is the
    // reference implementation; constants ratified there).
    // Node radii: three degree tiers within the family (mirrors the
    // app's hub/mid/small), all riding P.
    const degsSorted = tree.map(n => degOf(n.id)).sort((a, b) => b - a);
    const tHubDeg = degsSorted[Math.min(N - 1, Math.floor(N * 0.12))] || 0;
    const tMidDeg = degsSorted[Math.min(N - 1, Math.floor(N * 0.50))] || 0;
    const tierMult = (i) => {
      const g = degOf(tree[i].id);
      return g >= tHubDeg ? TIER_MULTS[0] : (g >= tMidDeg ? TIER_MULTS[1] : TIER_MULTS[2]);
    };
    const radii = new Map();
    let P = 0;
    const nodeR = (i) => Math.max(3, P * NODE_R_FRAC * tierMult(i));
    const groupKeyOf = (i) => (parents[i].length
      ? ('0c' + comp[i])
      : ('1' + (orphanMode === 'domain' ? (dom0(i) || '~') : '~')));
    // A bed: column-major slots (order flows left→right in columns of
    // nSub), half-pitch stagger on odd subs, +BED_GG units of air
    // where the leading member's group changes. cmax=Infinity gives
    // the fan's single-file slots with the same group gaps.
    const bedLayout = (row, cmax) => {
      const n = row.length;
      const nSub = Math.max(1, Math.ceil(n / cmax));
      const out = { nSub, slots: [], wU: 0, bedU: (nSub - 1) * BED_SUBDY };
      let u = 0, prevKey = null;
      for (let j = 0; j < n; j++) {
        const col = Math.floor(j / nSub), sub = j % nSub;
        if (sub === 0) {
          const k = groupKeyOf(row[j]);
          if (col > 0) { u += 1; if (k !== prevKey) u += BED_GG; }
          prevKey = k;
        }
        const stag = (nSub > 1 && (sub % 2) === 1) ? 0.5 : 0;
        out.slots.push({ m: row[j], xU: u + stag, sub });
      }
      out.wU = u + (nSub > 1 ? 0.5 : 0);
      return out;
    };
    const C_MAX = Math.max(6, Math.min(14, Math.ceil(Math.sqrt(N) * 1.35)));

    let rowMeta = [];
    let crown;
    let fanDy = 0;
    if (geometry === 'cascade') {
      const beds = rows.map(row => (row.length ? bedLayout(row, C_MAX) : null));
      let totalU = 0, maxWU = 0, nB = 0;
      for (const b of beds) { if (!b) continue; totalU += b.bedU; maxWU = Math.max(maxWU, b.wU); nB++; }
      totalU += BED_GAP * Math.max(0, nB - 1);
      const usable = Rh * (CASCADE_BOTTOM - CASCADE_TOP);
      // P fills the vertical band OR the chord, capped; the spread
      // dial stretches but the vertical band ALWAYS re-clamps —
      // otherwise the bottom bed slides to the rim, its chord goes
      // to zero and the overflow guard nukes P (the toy's Greek bug).
      P = Math.min(usable / Math.max(1, totalU), (2 * Rh * CASCADE_CHORD) / Math.max(1, maxWU), Rh * 0.16);
      P = Math.min(P * spread, usable / Math.max(1, totalU));
      for (let attempt = 0; attempt < 2; attempt++) {
        const contentH = totalU * P;
        let y = Math.max(cy + Rh * CASCADE_TOP,
          Math.min(cy + Rh * CASCADE_BIAS - contentH / 2, cy + Rh * CASCADE_BOTTOM - contentH));
        let shrink = 1;
        rowMeta = [];
        let firstBandTop = null;
        rows.forEach((row, r) => {
          const b = beds[r];
          if (!b) { rowMeta.push({ y: null, n: 0, dmin: null, dmax: null }); return; }
          const bandY = y + (b.bedU * P) / 2;
          const dy = bandY - cy;
          const half = Math.sqrt(Math.max(Rh * Rh * 0.0144, Rh * Rh - dy * dy));
          const fitR = (half * 2 * 0.86) / Math.max(1e-6, b.wU * P);
          if (fitR < 1) shrink = Math.min(shrink, fitR);
          if (firstBandTop == null) firstBandTop = y;
          for (const sl of b.slots) {
            positions.set(tree[sl.m].id, {
              x: cx + (sl.xU - b.wU / 2) * P,
              y: bandY + (sl.sub - (b.nSub - 1) / 2) * BED_SUBDY * P,
            });
            radii.set(tree[sl.m].id, nodeR(sl.m));
          }
          let rdmin = Infinity, rdmax = -Infinity;
          for (const n of row) {
            const d = dateOf(tree[n]);
            if (d != null) { if (d < rdmin) rdmin = d; if (d > rdmax) rdmax = d; }
          }
          rowMeta.push({
            y: bandY, half, w: b.wU * P, n: row.length,
            lineY: bandY + (b.bedU * P) / 2 + P * 0.44,
            dmin: rdmin > rdmax ? null : rdmin,
            dmax: rdmin > rdmax ? null : rdmax,
          });
          y += b.bedU * P + BED_GAP * P;
        });
        if (shrink >= 0.999 || attempt === 1) break;   // never shrink after the last placement
        P *= Math.max(0.5, shrink);   // deterministic second pass
      }
      const topY = (rowMeta.find(m => m.y != null) || { y: cy + Rh * CASCADE_TOP }).y;
      // CROWN CLEARANCE — the crown is not a point, it is a stack: the
      // family name, the arc/orphan line, the SCRIPTORIUM/COURT line,
      // and the CASCADE/FAN chips. That is four rows, ~68 screen px at
      // the fit scale the isolate flies to. The old 88-world-unit gap
      // reserved room for one and a half of them, so the chips landed
      // on top of the first rank's discs the moment the rails gave the
      // crown a second line. 132 clears the whole stack and still sits
      // inside the `cy - Rh * 0.84` ceiling below, which is untouched.
      crown = { x: cx, y: Math.max(cy - Rh * 0.84, topY - Math.min(P * 1.9, 132)) };
    } else {
      // FAN — the crown is the TRUNK: origin below center so the
      // crest of rings fills the house instead of hugging the rim.
      // Ring capacity in units is P-free (each member needs 1 unit
      // of arc → capacity = span×radU); overfull rings BRAID.
      fanDy = Rh * FAN_DY;
      const rings = rows.map(row => (row.length ? bedLayout(row, Infinity) : null));
      const radU = [], braidOn = [];
      let prevRad = 0;
      rows.forEach((row, r) => {
        const g = rings[r];
        if (!g) { radU.push(prevRad || FAN_R_IN_U); braidOn.push(false); prevRad = radU[r]; return; }
        const base = prevRad ? prevRad + FAN_RING_U : FAN_R_IN_U;
        const needFlat = (g.wU + 1) / FAN_SPAN;
        const needBraid = (g.wU * FAN_COMP / 2 + 1) / FAN_SPAN;
        if (needFlat <= base) { radU.push(base); braidOn.push(false); }
        else if (needBraid <= base) { radU.push(base); braidOn.push(true); }
        else { radU.push(Math.max(base, needBraid)); braidOn.push(true); }
        prevRad = radU[r];
      });
      const outerU = radU.length ? radU[radU.length - 1] + 0.6 : FAN_R_IN_U;
      P = Math.min((Rh + fanDy * 0.82) / outerU, Rh * 0.15);
      P = Math.min(P * spread, (Rh + fanDy * 0.92) / outerU);
      for (let attempt = 0; attempt < 2; attempt++) {
        rowMeta = [];
        let worst = 1;
        rows.forEach((row, r) => {
          const g = rings[r];
          if (!g) { rowMeta.push({ rad: radU[r] * P, n: 0, dmin: null, dmax: null }); return; }
          const compK = braidOn[r] ? FAN_COMP : 1;
          g.slots.forEach((sl, si) => {
            const ang = -Math.PI / 2 + ((sl.xU - g.wU / 2) * compK) / radU[r];
            const rad = (radU[r] + (braidOn[r] ? ((si % 2) ? FAN_BRAID_U : -FAN_BRAID_U) : 0)) * P;
            const x = cx + Math.cos(ang) * rad;
            const y = cy + fanDy + Math.sin(ang) * rad;
            const dc = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
            const lim = Rh * 0.94 - nodeR(sl.m);
            if (dc > lim) worst = Math.min(worst, lim / Math.max(1e-6, dc));
            positions.set(tree[sl.m].id, { x, y });
            radii.set(tree[sl.m].id, nodeR(sl.m));
          });
          let rdmin = Infinity, rdmax = -Infinity;
          for (const n of row) {
            const d = dateOf(tree[n]);
            if (d != null) { if (d < rdmin) rdmin = d; if (d > rdmax) rdmax = d; }
          }
          rowMeta.push({
            rad: radU[r] * P, n: row.length, braid: braidOn[r],
            dmin: rdmin > rdmax ? null : rdmin,
            dmax: rdmin > rdmax ? null : rdmax,
          });
        });
        if (worst >= 0.999 || attempt === 1) break;   // never shrink after the last placement
        P *= Math.max(0.5, worst);
        radii.clear();   // re-derive at the shrunk P
      }
      crown = { x: cx, y: cy + fanDy };
    }

    // ── 7. Court rails — SHELVES, not lists ─────────────────
    // Scriptorium (docs) left, grouped into era shelves (gap-split,
    // ≤5 + UNDATED); the court (everything else) right, grouped by
    // vault type (top 4 kinds with ≥2 members + MORE).
    const fmtDate = (d) => d == null ? 'UNDATED' : (d < 0 ? (-d) + ' BCE' : d + ' CE');
    const fmtRange = (a, b) => {
      if (a == null || b == null || a === b) return fmtDate(a == null ? b : a);
      if (a < 0 && b < 0) return (-a) + '–' + (-b) + ' BCE';
      if (a >= 0 && b >= 0) return a + '–' + b + ' CE';
      return (-a) + ' BCE–' + b + ' CE';
    };
    function docShelves(list) {
      const dated = list.filter(n => dateOf(n) != null)
        .sort((a, b) => (dateOf(a) - dateOf(b)) || (a.id < b.id ? -1 : 1));
      const und = list.filter(n => dateOf(n) == null).sort((a, b) => (a.id < b.id ? -1 : 1));
      const out = [];
      if (dated.length) {
        const span = Math.max(1, dateOf(dated[dated.length - 1]) - dateOf(dated[0]));
        let cur = [dated[0]];
        for (let i = 1; i < dated.length; i++) {
          const gap = dateOf(dated[i]) - dateOf(dated[i - 1]);
          if ((out.length + 1 < 5 && cur.length >= 2 && gap > span / 6)
              || (cur.length >= 12 && out.length + 1 < 5)) { out.push(cur); cur = []; }
          cur.push(dated[i]);
        }
        if (cur.length) out.push(cur);
      }
      const g = out.map(items => ({
        label: fmtRange(dateOf(items[0]), dateOf(items[items.length - 1])).toUpperCase(),
        items,
      }));
      if (und.length) g.push({ label: 'UNDATED', items: und });
      return g;
    }
    function kindShelves(list) {
      const by = new Map(), order = [];
      for (const n of list) {
        const k = String(n.type || 'other');
        if (!by.has(k)) { by.set(k, []); order.push(k); }
        by.get(k).push(n);
      }
      for (const arr of by.values()) arr.sort((a, b) => (degOf(b.id) - degOf(a.id)) || (a.id < b.id ? -1 : 1));
      order.sort((a, b) => (by.get(b).length - by.get(a).length) || (a < b ? -1 : 1));
      const g = []; let more = [];
      for (const k of order) {
        if (g.length < 4 && by.get(k).length >= 2) {
          g.push({ label: (k + 's').replace(/ys$/, 'ies').toUpperCase(), items: by.get(k) });
        } else more = more.concat(by.get(k));
      }
      if (more.length) {
        more.sort((a, b) => (degOf(b.id) - degOf(a.id)) || (a.id < b.id ? -1 : 1));
        g.push({ label: 'MORE', items: more });
      }
      return g;
    }
    // 2026-07-31 — a rail item is now real mass (an engine instance at
    // a real position with a real radius), not a caption. Three changes
    // from the 07-30 shell, everything else untouched:
    //   1. every DISPLAYED item gets a radius in `radii` — without one
    //      the view bakes a wheel-sized dot into position-B;
    //   2. the rail is capped at `railMax` and the remainder is parked
    //      ON the crown at no radius, so no edge is ever left with a
    //      dead endpoint and 'Other' cannot build a 2,336-slot column;
    //   3. the pitch divides by the number of INTRA-SHELF gaps (S − G),
    //      which is what `total` counts — the old `T − 1` over-counted
    //      by G−1 and degenerated when every shelf held one item.
    function buildRail(groups, side) {
      const x = cx + side * Rh * RAIL_X;
      const yA = cy - Rh * RAIL_Y_SPAN, yB = cy + Rh * RAIL_Y_SPAN;
      let T = 0;
      for (const g of groups) T += g.items.length;
      if (!T) return null;
      const cap   = Math.max(1, Math.round(num(o.railMax, RAIL_MAX)));
      const rFrac = Math.max(0.05, Math.min(1, num(o.railGlyph, RAIL_R_FRAC)));
      // Cap in shelf order (docs oldest-first, court biggest-kind-first)
      // so what survives is the head of an order the reader can name.
      const shown = [];
      let room = cap;
      for (const g of groups) {
        const take = Math.max(0, Math.min(room, g.items.length));
        if (take > 0) {
          shown.push({ label: g.label, count: g.items.length, items: g.items.slice(0, take) });
        }
        for (let k = take; k < g.items.length; k++) {
          positions.set(g.items[k].id, { x: crown.x, y: crown.y });   // parked, no radius
        }
        room -= take;
      }
      let S = 0;
      for (const g of shown) S += g.items.length;
      const capH = 13, pad = 4, gap = 10, G = shown.length;
      const fixed = G * (capH + pad) + Math.max(0, G - 1) * gap;
      const pitch = Math.max(3.8, Math.min(9, (yB - yA - fixed) / Math.max(1, S - G)));
      const total = fixed + (S - G) * pitch;
      const glyphR = Math.max(RAIL_R_MIN, Math.min(RAIL_R_MAX, pitch * rFrac));
      let y = Math.max(yA, cy - total / 2);
      const rail = { x, side, count: T, shown: S, overflow: T - S, pitch, glyphR, shelves: [] };
      for (const g of shown) {
        const shelf = {
          label: g.label, count: g.count, shown: g.items.length,
          capY: y + capH / 2, spineId: null, items: [],
        };
        y += capH + pad;
        let bd = -1;
        g.items.forEach((n, k) => {
          positions.set(n.id, { x, y });
          radii.set(n.id, glyphR);
          shelf.items.push({ id: n.id, y });
          const d = degOf(n.id);
          if (d > bd) { bd = d; shelf.spineId = n.id; }
          if (k < g.items.length - 1) y += pitch;
        });
        shelf.y1 = y;
        y += gap;
        rail.shelves.push(shelf);
      }
      return rail;
    }
    const rails = {
      left:  buildRail(docShelves(docs), -1),
      right: buildRail(kindShelves(court), +1),
    };

    // ── 8. Horizon ports — every other group at its true bearing ──
    const bearings = o.bearings || {};
    const weights  = o.portWeights || {};
    const colors   = o.groupColor || {};
    const groupsSeen = new Map();   // groupName → [nodes]
    for (const n of others) {
      const g = groupBy(n) || 'Other';
      if (!groupsSeen.has(g)) groupsSeen.set(g, []);
      groupsSeen.get(g).push(n);
    }
    const ports = [];
    const portNames = Array.from(groupsSeen.keys()).sort();
    for (const g of portNames) {
      let ang = bearings[g];
      if (typeof ang !== 'number' || !isFinite(ang)) {
        ang = (strHash(g) % 6283) / 1000;   // deterministic fallback bearing
      }
      const px = cx + Math.cos(ang) * Rh;
      const py = cy + Math.sin(ang) * Rh;
      const cnt = num(weights[g], 0);
      const pr = cnt ? Math.max(5, Math.min(15, 3 + Math.log(cnt + 1) * 1.9)) : 2.5;
      for (const n of groupsSeen.get(g)) positions.set(n.id, { x: px, y: py });
      ports.push({ group: g, x: px, y: py, ang, r: pr, count: cnt, color: colors[g] || null, members: groupsSeen.get(g).length });
    }
    ports.sort((a, b) => (b.count - a.count) || (a.group < b.group ? -1 : 1));

    // ── 9. Orphan domain caption anchors (cascade only) ─────
    // Captions sit under the whole BED (lineY), not under a single
    // row — the bed is the bundle the caption names.
    const orphanCaptions = [];
    if (orphanMode === 'domain' && geometry === 'cascade') {
      rows.forEach((row, ri) => {
        if (!rowMeta[ri] || rowMeta[ri].y == null) return;
        const groups = new Map(), order = [];
        for (const n of row) {
          if (parents[n].length || children[n].length) continue;
          const g = dom0(n);
          if (!g || g === '~') continue;
          if (!groups.has(g)) { groups.set(g, { s: 0, c: 0 }); order.push(g); }
          const p = positions.get(tree[n].id);
          groups.get(g).s += p.x;
          groups.get(g).c++;
        }
        const capY = (rowMeta[ri].lineY != null) ? rowMeta[ri].lineY + 6 : rowMeta[ri].y + 16;
        for (const g of order) {
          const gg = groups.get(g);
          if (gg.c < 3) continue;
          orphanCaptions.push({ label: g.toUpperCase(), x: gg.s / gg.c, y: capY, rank: ri, count: gg.c });
        }
      });
    }

    // ── 10. Stats + return ──────────────────────────────────
    let orphanCount = 0;
    for (let i = 0; i < N; i++) if (!parents[i].length && !children[i].length) orphanCount++;

    const worldExtent = {
      x0: cx - Rh - WORLD_MARGIN, y0: cy - Rh - WORLD_MARGIN,
      x1: cx + Rh + WORLD_MARGIN, y1: cy + Rh + WORLD_MARGIN,
    };

    // id-space views of the arc lists for the view layer.
    const idArcs = arcs.map(a => ({ parent: tree[a.p].id, child: tree[a.c].id, primary: a.primary }));
    const idAspects = aspectArcs.map(a => ({ hub: tree[a.p].id, aspect: tree[a.c].id }));
    const idConsorts = consortPairs.map(cp => ({ a: tree[cp.a].id, b: tree[cp.b].id, adjacent: cp.adjacent }));
    const rankOf = new Map();
    tree.forEach((n, i) => rankOf.set(n.id, rank[i]));

    return {
      positions,
      worldExtent,
      // House node radii (world units) — members only; the view bakes
      // these into position-B so gods GROW as the layout ramps in.
      // Non-members keep their wheel radii (the port piles stay quiet).
      radii,
      house: {
        groupKey, geometry, RK,
        center: { x: cx, y: cy },
        radius: Rh,
        pitch: P,
        fanDy,
        crown,
        rows: rows.map(row => row.map(i => tree[i].id)),
        rowMeta,
        rankOf,
        arcs: idArcs,
        aspectArcs: idAspects,
        consorts: idConsorts,
        rails,
        orphanCaptions,
        stats: {
          members: members.length,
          tree: N,
          docs: docs.length,
          court: court.length,
          kinArcs: idArcs.length,
          orphanCount,
          components: nComp,
          maxDepth: maxLayer,
          cyclesBroken,
        },
      },
      ports,
    };
  }

  // ── Export ─────────────────────────────────────────────
  window.AtlasEngineLayout = window.AtlasEngineLayout || {};
  window.AtlasEngineLayout.familyTreeLayout = familyTreeLayout;
})();
