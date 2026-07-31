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
  // ── THE INNER BAND (2026-07-31 wave 3) — John's ring design ──
  // His words: "Families nodes stay outside as they are in their own
  // 'imaginary circle band' --- then we display the court ALSO in a
  // circular band fashion, one level inner inside the main families
  // … with a slightly bigger size than the current which is almost
  // atomic size. --- then naturally inside these 2 bands we got the
  // amazing diagrams fan and cascade as we have."
  //
  // DECISION — ONE ring, SECTIONED BY ARC: the Scriptorium owns the
  // LEFT half-arc, the Court the RIGHT. Argued: (1) it keeps the
  // left/right mental model the vertical rails taught (docs left,
  // court right) so nothing John learned moves; (2) the
  // rails.<side> contract (count / shown / overflow / parkedIds,
  // shelf count / shown) is consumed by the chrome, the debug
  // surfaces and both gates — arc sectioning changes only WHERE
  // things stand, never what is claimed; (3) the ring keeps a GAP at
  // 12 and 6 o'clock, so the crown's text column and the cascade's
  // foot stay clear, and the two arc ENDS give the headers and the
  // overflow line anchors that provably clear the 15px claim rule.
  //
  // GLYPHS READ AS OBJECTS (his "almost atomic size" complaint —
  // measured 1.2-2.7 CSS px radius at the isolate fit): the band has
  // THICKNESS. Items fill nSub concentric sub-rows (auto-solved
  // 1..bandRows) with a half-pitch stagger, so the pitch — and the
  // glyph radius that rides it — multiplies by the sub-row count
  // instead of splitting one arc into 150 atomic slots.
  const BAND_R_FRAC    =  0.86;  // band centreline radius (× Rh)
  const BAND_GAP_DEG   =  24;    // arc gap at 12 o'clock (deg, each side of the axis)
  // WAVE 4 (2026-07-31, John: "push the limit of the rows on the
  // bottom opening space to fill") — the two gaps split. The TOP gap
  // protects the crown column and keeps its 24°; the BOTTOM gap only
  // has to clear the cascade's foot, which is a RADIAL fact (the
  // gate asserts max member extent < band rIn), so the band may run
  // much closer to 6 o'clock and the arc grows by ~12° a side.
  const BAND_GAP_BOT_DEG = 12;   // arc gap at 6 o'clock (deg, each side of the axis)
  const BAND_ROWS_MAX  =  3;     // sub-row cap (auto-solves 1..this)
  const BAND_TREE_R    =  0.86;  // cascade/fan zone radius (× Rh) while the band stands.
                                 // Same as the band centreline on purpose: the cascade's
                                 // own chord (0.74) and circle-fit (0.86) laws keep the
                                 // beds ~15% off their zone's rim, so the measured bed
                                 // extent stays inside the band's INNER edge (asserted
                                 // per family in check-familytree.mjs) while the gods
                                 // keep ~95% of their pre-ring size.
  // Band-case cascade span (fractions of the TREE radius, not Rh):
  // wider than the open-house span because the band's 12/6 o'clock
  // gaps free the vertical axis — this claws back most of the god
  // size the smaller tree radius would otherwise cost.
  const BAND_TREE_TOP  = -0.64;
  const BAND_TREE_BOT  =  0.92;
  // WAVE 4 (John: "theres SO much space we can utilize to make it 3
  // rows of docs") — the target pitch is what decides how many
  // sub-rows a crowded shelf earns, so it went from 9 (stop as soon
  // as the arc merely fits) to 16 (keep thickening until the slots
  // are OBJECTS). Measured: Christian's 125 documents solve to 3
  // sub-rows at 16, and the gate pins that.
  const BAND_PITCH_TGT =  16;    // add a sub-row until the pitch reaches this (wu)
  const BAND_PITCH_MAX =  30;    // a tiny court is centred, not smeared over the arc
  const BAND_SHELF_GAP =  20;    // arc air between shelves (wu) — must beat 2·RAIL_R_MAX
                                 // or two max-size glyphs touch across a shelf boundary
  const BAND_END_PAD   =  26;    // arc reserved at the FOOT end (overflow-line air)
  const BAND_HEAD_ARC  =  230;   // arc reserved at the TOP end for the curved rail
                                 // header (wu): "THE SCRIPTORIUM — 24 DOCS" at the
                                 // HEAD face is ~160 CSS px, which is 195-244 wu at
                                 // the gate viewports' fit scales — the reserve keeps
                                 // the first shelf's caption out of the header's arc
  const BAND_SUB_DR    =  0.90;  // sub-row radial spacing (× pitch)
  const BAND_SUB_DR_MAX = 20;    // dr ceiling (wu) — a 3-sub-row band at pitch 26
                                 // would otherwise be 65 wu thick and eat the whole
                                 // caption annulus between band and ports
  const BAND_CAP_CLEAR =  10;    // caption clearance off the band's outer edge (wu).
                                 // WAVE 4: captions ride ALONG the arc now and claim
                                 // BEFORE the band shield, so the old sqrt(7²+15²)
                                 // stand-off argument is gone — this is visual air
                                 // between the outermost glyph row and the text
  const BAND_CAP_TIER  =  30;    // alternating caption radial tier (wu) so two short
                                 // neighbouring shelves can never claim() each other
                                 // off: ≥ 19.6 screen px at the smallest gate scale,
                                 // which clears the 15px rule at every bearing the
                                 // replay measures (and the header rides tier 1, so
                                 // it is radially clear of the tier-0 first caption)
  // THE CAPTION IS PART OF THE ARC BUDGET (wave 4). A shelf caption
  // is constant-px text riding the shelf's own arc, so a shelf must
  // be dealt enough arc to CARRY its caption or two same-tier
  // captions abut and claim() hides one (measured: Christian's
  // "RITUALS · 5 OF 11" lost to "SYMBOLS · 12 OF 25" at 1000x1000 —
  // a kind the header counts, captionless). 9.2 wu/char covers the
  // CAP face's mono advance at the smallest gate fit scale
  // (9.5px × 0.62 / 0.6557); the allowance is capped so one long
  // caption over a two-item shelf cannot crush every other shelf's
  // pitch — past the cap it spills ±~18px into the NEIGHBOUR tier's
  // region, which the alternating tiers absorb by construction.
  const BAND_CAP_WU    =  9.2;   // caption arc allowance per character (wu)
  const BAND_CAP_ARC_MAX = 120;  // allowance ceiling per shelf (wu)
  const RAIL_R_FRAC    =  0.40;  // glyph radius = pitch * this
  const RAIL_R_MAX     =  9;     // hard ceiling (wu); the 0.49·minDist law below is
                                 // what actually guarantees glyphs can never touch
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
  //   railMax:    number  default 150    DISPLAY cap per rail; spent
  //               proportionally with a floor of one slot per shelf so
  //               no KIND is ever deleted outright, and the remainder
  //               is parked on the crown at radius 0 and reported as
  //               rails.<side>.overflow / .parkedIds (never a count
  //               lie — rails.<side>.count stays the family's true
  //               mass, and shelf.shown vs shelf.count says which
  //               shelves are showing a head)
  //   railGlyph:  number  default 0.40   band glyph radius as a fraction
  //               of the solved band pitch (hard-capped by the
  //               0.49·minDist no-touch law and RAIL_R_MAX)
  //   ── the three zones (2026-07-31 wave 3, all × Rh unless noted) ──
  //   portInset:  number  default 1.0    horizon ports ring radius
  //   bandR:      number  default 0.86   inner band centreline radius
  //   bandGap:    number  default 24     band arc gap at 12 o'clock (DEGREES, per side)
  //   bandGapBot: number  default 12     band arc gap at 6 o'clock (DEGREES, per side)
  //   bandRows:   number  default 3     max concentric sub-rows for the band
  //   bandPitch:  number  default 16     target slot pitch (wu) — sub-rows are added
  //               until the pitch reaches this, so it is the dial that
  //               decides how THICK a crowded shelf grows
  //   bandHead:   number  default 230    arc reserved at the top end for the
  //               curved rail header (wu)
  //   capClear:   number  default 10     caption air off the band's outer edge (wu)
  //   treeR:      number  default 0.80   cascade/fan zone radius while the
  //               band stands. HONEST ZERO: when the house holds no
  //               docs and no court (rails off, deity-only family,
  //               degrade branch) there is no band and the tree uses
  //               the FULL house exactly as before this pass —
  //               byte-identical output.
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
    // THE THREE ZONES (2026-07-31 wave 3) — outside in: the horizon
    // ports (portR), the inner band (the family's own non-deity mass,
    // §7), and the tree zone (Rt) holding the cascade/fan. The band
    // exists only when there is mass to put on it; with no band the
    // tree keeps the FULL house radius — byte-identical to the
    // pre-ring output (honest zero: rails off ⇒ the 07-30 house).
    const hasBand = (docs.length + court.length) > 0;
    const Rt = hasBand
      ? Rh * Math.max(0.35, Math.min(1, num(o.treeR, BAND_TREE_R)))
      : Rh;
    const treeTop = hasBand ? BAND_TREE_TOP : CASCADE_TOP;
    const treeBot = hasBand ? BAND_TREE_BOT : CASCADE_BOTTOM;
    const portR = Rh * Math.max(0.7, Math.min(1.25, num(o.portInset, 1)));
    // CANONICAL HONESTY (2026-07-31 wave 2, CR-1 / crown-noun-*) — the
    // CROWN counts this `tree` array, so the crown's NOUN has to name
    // what is in it. Only this file knows: treeKindOf routes by vault
    // type, and the degrade branch above can hand the cascade a
    // completely different population from the one the caller's mode
    // filter named. So report the cascade's OWN composition and let
    // the view print a word for THAT — never for the wheel mode.
    //   treeKind    the single vault type when the cascade is pure,
    //               null when it holds more than one kind
    //   treeTypes   {type: count} for every kind in the cascade
    // Derived AFTER the degrade branch, so it is true on every path
    // (deity house, corpus-section house, deity-less family alike).
    const treeTypes = Object.create(null);
    for (const n of tree) {
      const t = String((n && n.type) || 'other');
      treeTypes[t] = (treeTypes[t] || 0) + 1;
    }
    const treeTypeKeys = Object.keys(treeTypes);
    const treeKind = (treeTypeKeys.length === 1) ? treeTypeKeys[0] : null;
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

    // A ROW IS A LAYOUT RANK, NOT A GENERATION (2026-07-31 wave 2,
    // CR-4). §4 above builds a row index out of THREE different
    // things: a component's era offset, its lineage depth, and — for
    // anything unconnected — a pure era bucket. Measured on the vault
    // before this pass, 15 of Greek's parentless deities, 30 of
    // Norse's and 62 of Vedic's printed under GEN II or lower. So the
    // layout reports the PROVENANCE of every row and the view prints a
    // numeral only where the row really is one generation.
    //
    // Two things `layer` above cannot be used for here:
    //   · it is a longest path over `parents`, which §2 deliberately
    //     salts with ASPECT arcs as placement-parents. An avatar is
    //     not its hub's child, so a row it lands in is not a
    //     generation — that is where Vedic's remaining 13 false
    //     numerals came from.
    //   · it says nothing about who was dropped in by DATE.
    // genDepth walks the surviving LINEAGE arcs only, and offLineage
    // counts the members of a row whose place there is not a lineage
    // fact at all (unconnected, aspect-placed, or ranks='era').
    const lineParents = [], lineChildren = [];
    for (let i = 0; i < N; i++) { lineParents.push([]); lineChildren.push([]); }
    for (const a of arcs) { lineParents[a.c].push(a.p); lineChildren[a.p].push(a.c); }
    const genDepth = new Array(N).fill(0);
    for (let iter = 0; iter < N; iter++) {
      let changed = false;
      for (let c = 0; c < N; c++) {
        let best = 0;
        for (const p of lineParents[c]) if (genDepth[p] + 1 > best) best = genDepth[p] + 1;
        if (best > genDepth[c] && best < N) { genDepth[c] = best; changed = true; }
      }
      if (!changed) break;
    }
    const offLineageAt = (i) => (ranksMode === 'era')
      || (lineParents[i].length === 0 && lineChildren[i].length === 0);
    // dates + lineage provenance for one row, shared by both geometries.
    const rowStats = (row) => {
      let dlo = Infinity, dhi = -Infinity;
      let lmin = Infinity, lmax = -Infinity, off = 0;
      for (const n of row) {
        const d = dateOf(tree[n]);
        if (d != null) { if (d < dlo) dlo = d; if (d > dhi) dhi = d; }
        if (genDepth[n] < lmin) lmin = genDepth[n];
        if (genDepth[n] > lmax) lmax = genDepth[n];
        if (offLineageAt(n)) off++;
      }
      return {
        dmin: dlo > dhi ? null : dlo,
        dmax: dlo > dhi ? null : dhi,
        // The lineage depths this row spans (0-based), and how many of
        // its members are not there because of lineage at all.
        layerMin: row.length ? lmin : null,
        layerMax: row.length ? lmax : null,
        offLineage: off,
      };
    };

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
      // 2026-07-31 wave 3 — the cascade solves against the TREE ZONE
      // radius Rt (the innermost of the three zones), not Rh. With no
      // band Rt === Rh and every number below is the pre-ring value.
      const usable = Rt * (treeBot - treeTop);
      // P fills the vertical band OR the chord, capped; the spread
      // dial stretches but the vertical band ALWAYS re-clamps —
      // otherwise the bottom bed slides to the rim, its chord goes
      // to zero and the overflow guard nukes P (the toy's Greek bug).
      P = Math.min(usable / Math.max(1, totalU), (2 * Rt * CASCADE_CHORD) / Math.max(1, maxWU), Rt * 0.16);
      P = Math.min(P * spread, usable / Math.max(1, totalU));
      for (let attempt = 0; attempt < 2; attempt++) {
        const contentH = totalU * P;
        let y = Math.max(cy + Rt * treeTop,
          Math.min(cy + Rt * CASCADE_BIAS - contentH / 2, cy + Rt * treeBot - contentH));
        let shrink = 1;
        rowMeta = [];
        let firstBandTop = null;
        rows.forEach((row, r) => {
          const b = beds[r];
          if (!b) {
            rowMeta.push({ y: null, n: 0, dmin: null, dmax: null,
                           layerMin: null, layerMax: null, offLineage: 0 });
            return;
          }
          const bandY = y + (b.bedU * P) / 2;
          const dy = bandY - cy;
          const half = Math.sqrt(Math.max(Rt * Rt * 0.0144, Rt * Rt - dy * dy));
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
          rowMeta.push(Object.assign({
            y: bandY, half, w: b.wU * P, n: row.length,
            lineY: bandY + (b.bedU * P) / 2 + P * 0.44,
          }, rowStats(row)));
          y += b.bedU * P + BED_GAP * P;
        });
        if (shrink >= 0.999 || attempt === 1) break;   // never shrink after the last placement
        P *= Math.max(0.5, shrink);   // deterministic second pass
      }
      const topY = (rowMeta.find(m => m.y != null) || { y: cy + Rt * treeTop }).y;
      // CROWN CLEARANCE — the crown is not a point, it is a stack: the
      // family name, the arc/orphan line, the SCRIPTORIUM/COURT line,
      // and the CASCADE/FAN chips. That is four rows, ~68 screen px at
      // the fit scale the isolate flies to. The old 88-world-unit gap
      // reserved room for one and a half of them, so the chips landed
      // on top of the first rank's discs the moment the rails gave the
      // crown a second line. 132 clears the whole stack and still sits
      // inside the `cy - Rh * 0.84` ceiling below, which is untouched.
      // WAVE 3 — with the band standing, the crown stack is TALLER
      // (the type scale lifted every chrome row from 17 to 21 screen
      // px), and the tree zone is smaller, so the same P buys less
      // world clearance. The band case therefore floors the gap at 96
      // world units (~66 screen px at the isolate fit — three type
      // rows plus the title) and lets big-P houses take up to 170.
      // The no-band branch is byte-identical to the pre-ring formula.
      crown = { x: cx, y: Math.max(cy - Rh * 0.84, topY - (hasBand
        ? Math.max(96, Math.min(P * 2.2, 170))
        : Math.min(P * 1.9, 132))) };
    } else {
      // FAN — the crown is the TRUNK: origin below center so the
      // crest of rings fills the house instead of hugging the rim.
      // Ring capacity in units is P-free (each member needs 1 unit
      // of arc → capacity = span×radU); overfull rings BRAID.
      fanDy = Rt * FAN_DY;   // wave 3: the fan lives in the tree zone
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
      P = Math.min((Rt + fanDy * 0.82) / outerU, Rt * 0.15);
      P = Math.min(P * spread, (Rt + fanDy * 0.92) / outerU);
      for (let attempt = 0; attempt < 2; attempt++) {
        rowMeta = [];
        let worst = 1;
        rows.forEach((row, r) => {
          const g = rings[r];
          if (!g) {
            rowMeta.push({ rad: radU[r] * P, n: 0, dmin: null, dmax: null,
                           layerMin: null, layerMax: null, offLineage: 0 });
            return;
          }
          const compK = braidOn[r] ? FAN_COMP : 1;
          g.slots.forEach((sl, si) => {
            const ang = -Math.PI / 2 + ((sl.xU - g.wU / 2) * compK) / radU[r];
            const rad = (radU[r] + (braidOn[r] ? ((si % 2) ? FAN_BRAID_U : -FAN_BRAID_U) : 0)) * P;
            const x = cx + Math.cos(ang) * rad;
            const y = cy + fanDy + Math.sin(ang) * rad;
            const dc = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
            const lim = Rt * 0.94 - nodeR(sl.m);
            if (dc > lim) worst = Math.min(worst, lim / Math.max(1e-6, dc));
            positions.set(tree[sl.m].id, { x, y });
            radii.set(tree[sl.m].id, nodeR(sl.m));
          });
          rowMeta.push(Object.assign({
            rad: radU[r] * P, n: row.length, braid: braidOn[r],
          }, rowStats(row)));
        });
        if (worst >= 0.999 || attempt === 1) break;   // never shrink after the last placement
        P *= Math.max(0.5, worst);
        radii.clear();   // re-derive at the shrunk P
      }
      crown = { x: cx, y: cy + fanDy };
    }

    // ── 7. THE INNER BAND — one ring, two arcs of SHELVES ───
    // (wave 3; design argument at the BAND constants above.)
    // Scriptorium (docs) on the LEFT arc, grouped into era shelves
    // (gap-split, ≤5 + UNDATED); the court (everything else) on the
    // RIGHT arc, grouped by vault type (top 4 kinds with ≥2 members
    // + MORE). Both arcs leave the 12 and 6 o'clock gaps clear.
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
    // SPEND THE CAP SO EVERY SHELF SURVIVES (2026-07-31 wave 2, CR-3).
    // The old spend was greedy in shelf order, and kindShelves sorts
    // biggest-kind-first — so the largest kind ate the WHOLE cap and
    // four of Christian's five court kinds vanished with nothing on
    // screen saying so, under a header reading "330 OF ALL KINDS".
    // Deleting a kind the header counts is a count lie; a short shelf
    // is not.
    //
    // WHY PROPORTIONAL AND NOT ROUND-ROBIN: the rail's shape is read.
    // Equal shares would draw PERSONS·555 and RITUALS·11 as columns of
    // the same height — a second lie, about mass. A proportional head
    // keeps each shelf's share of the column equal to its share of the
    // court, so the rail reads as the court's real composition, while
    // the floor of one slot guarantees no kind is silently deleted.
    // Deterministic: fixed pass order, integer arithmetic, no floats
    // compared for equality.
    function spendCap(sizes, cap) {
      const G = sizes.length;
      const take = new Array(G).fill(0);
      let room = Math.max(0, cap);
      // 1 ▸ the floor — one slot per shelf, in shelf order. (Both
      //     shelf builders cap at ≤ 6 groups and the LAB cap floor is
      //     20, so this can never starve the proportional pass.)
      for (let i = 0; i < G && room > 0; i++) { take[i] = 1; room--; }
      // 2 ▸ water-fill the rest proportionally to unmet demand. A
      //     shelf that fills up hands its share back on the next pass;
      //     the max(1) keeps every pass making progress, and the guard
      //     bounds the loop no matter what the data does.
      for (let pass = 0; pass < 64 && room > 0; pass++) {
        let need = 0;
        for (let i = 0; i < G; i++) need += Math.max(0, sizes[i] - take[i]);
        if (!need) break;
        let given = 0;
        for (let i = 0; i < G && given < room; i++) {
          const want = sizes[i] - take[i];
          if (want <= 0) continue;
          const share = Math.max(1, Math.floor((room * want) / need));
          const add = Math.min(want, share, room - given);
          take[i] += add;
          given += add;
        }
        if (!given) break;
        room -= given;
      }
      return take;
    }
    // THE BAND BUILDER (2026-07-31 wave 3) — one side's arc of the
    // inner ring. `side` keeps its old meaning (-1 Scriptorium /
    // +1 Court) and everything the old vertical rail CLAIMED is
    // preserved: count is the family's true mass, shown + overflow
    // add up to it, every shelf reports shown vs count, the parked
    // remainder goes to the crown at radius zero. Only the GEOMETRY
    // changed: slots stand on nSub concentric sub-rows along the
    // side's arc, captions anchor OUTBOARD of the band (between band
    // and ports) on alternating radial tiers, and the header / foot
    // anchor at the arc's two ends.
    function buildRail(groups, side) {
      let T = 0;
      for (const g of groups) T += g.items.length;
      if (!T) return null;
      const cap   = Math.max(1, Math.round(num(o.railMax, RAIL_MAX)));
      const rFrac = Math.max(0.05, Math.min(1, num(o.railGlyph, RAIL_R_FRAC)));
      // Within a shelf the head is still the head of an order the
      // reader can name (docs oldest-first, court highest-degree-first).
      const takes = spendCap(groups.map(g => g.items.length), cap);
      const shown = [];
      const parked = [];
      for (let gi = 0; gi < groups.length; gi++) {
        const g = groups[gi];
        const take = Math.max(0, Math.min(takes[gi], g.items.length));
        if (take > 0) {
          shown.push({ label: g.label, count: g.items.length, items: g.items.slice(0, take) });
        }
        for (let k = take; k < g.items.length; k++) {
          // PARKED — on the crown, at ZERO radius. "No radius entry"
          // was NOT zero: the view's bake fell back to the WHEEL
          // radius, so a rail item that was also a MODE member stacked
          // a full-size, hit-testable disc on the family name (wave 2,
          // GUEST-2). An explicit 0 is the promise this file's header
          // already makes.
          positions.set(g.items[k].id, { x: crown.x, y: crown.y });
          radii.set(g.items[k].id, 0);
          parked.push(g.items[k].id);
        }
      }
      let S = 0;
      for (const g of shown) S += g.items.length;
      const G = shown.length;
      // ── the arc ────────────────────────────────────────────
      const bandR  = Rh * Math.max(0.5, Math.min(1.02, num(o.bandR, BAND_R_FRAC)));
      const gapRad = Math.max(4, Math.min(60, num(o.bandGap, BAND_GAP_DEG))) * Math.PI / 180;
      const gapBot = Math.max(2, Math.min(60, num(o.bandGapBot, BAND_GAP_BOT_DEG))) * Math.PI / 180;
      const rowsMax = Math.max(1, Math.min(4, Math.round(num(o.bandRows, BAND_ROWS_MAX))));
      const pitchTgt = Math.max(4, Math.min(BAND_PITCH_MAX, num(o.bandPitch, BAND_PITCH_TGT)));
      const capClear = Math.max(0, Math.min(60, num(o.capClear, BAND_CAP_CLEAR)));
      // radians per side arc — asymmetric since wave 4: the top gap
      // shields the crown column, the bottom gap only clears the
      // cascade's foot, and both are dials.
      const span = Math.max(0.26, Math.PI - gapRad - gapBot);
      const L = bandR * span;                  // arc budget (wu, centreline)
      const headArc = Math.max(0, Math.min(0.45 * L, num(o.bandHead, BAND_HEAD_ARC)));
      // arcU (wu along the centreline, 0 = TOP end) → world angle.
      // Right side runs -90°+gapTop → +90°-gapBot through 0
      // (3 o'clock); left side mirrors through 180°. Screen y grows
      // downward, so sin(-π/2) is the top of the ring.
      const angAt = (u) => (side > 0)
        ? (-Math.PI / 2 + gapRad + (u / L) * span)
        : (-Math.PI / 2 - gapRad - (u / L) * span);
      // The caption arc allowance per shelf — the SAME string the
      // view prints (CR-5: "label · shown OF count"), measured in
      // wu-per-char. Format drift between here and renderBandCaptions
      // is pinned by check-familytree.mjs.
      const capNeed = shown.map(g => {
        const txt = g.label + ' · '
          + ((g.items.length < g.count) ? (g.items.length + ' OF ' + g.count) : g.count);
        return Math.min(BAND_CAP_ARC_MAX, txt.length * BAND_CAP_WU);
      });
      // Sub-rows: the FEWEST that reach a readable pitch (so a small
      // court stays a single clean row and a 150-slot one thickens
      // instead of atomising). The half-pitch stagger overhang of an
      // odd sub-row is budgeted per shelf, and so is the caption
      // spill (a shelf whose caption outruns its items is dealt the
      // difference — fixed-point over pitch, monotone, 6 passes).
      const fixed = headArc + BAND_END_PAD + Math.max(0, G - 1) * BAND_SHELF_GAP;
      const itemsArcOf = (c, p) => Math.max(0, c - 1) * p + (nSub > 1 ? p / 2 : 0);
      let nSub = 1, cols = [], pitch = 0, spills = [];
      for (;; nSub++) {
        cols = shown.map(g => Math.ceil(g.items.length / nSub));
        let steps = 0;
        for (const c of cols) steps += Math.max(0, c - 1);
        const div = Math.max(1, steps + (nSub > 1 ? 0.5 * G : 0));
        let raw = (L - fixed) / div;
        for (let it = 0; it < 6; it++) {
          const p = Math.max(0.4, Math.min(BAND_PITCH_MAX, raw));
          let spill = 0;
          for (let gi = 0; gi < G; gi++) spill += Math.max(0, capNeed[gi] - itemsArcOf(cols[gi], p));
          raw = (L - fixed - spill) / div;
        }
        pitch = Math.max(0.4, Math.min(BAND_PITCH_MAX, raw));
        spills = cols.map((c, gi) => Math.max(0, capNeed[gi] - itemsArcOf(c, pitch)));
        if (nSub >= rowsMax || raw >= pitchTgt) break;
      }
      // dr is capped independently of the pitch: a wide-open arc can
      // solve to pitch 26+, and (nSub-1)·0.9·26 + glyphs would spend
      // the entire band→ports annulus on air between sub-rows.
      const dr = Math.min(pitch * BAND_SUB_DR, BAND_SUB_DR_MAX);
      // The closest two slots can stand: arc neighbours on one sub-row
      // are `pitch` apart ALONG THE CENTRELINE — but an inner sub-row
      // rides a smaller circle, so its chord shrinks by rInner/bandR
      // (measured: 4 sub-rows at a tight pitch overlapped by exactly
      // that factor). Staggered diagonal neighbours are
      // hypot(shrunk pitch/2, dr). Glyphs cap at 0.49 of the worst of
      // these, so NO dial position can make two glyphs touch — the
      // invariant the old clamp pair only held at its defaults.
      const rInner = bandR - ((nSub - 1) / 2) * dr;
      const shrink = Math.max(0.5, Math.min(1, rInner / bandR));
      const minDist = Math.min(BAND_SHELF_GAP,
        (nSub > 1) ? Math.min(pitch * shrink, Math.hypot((pitch / 2) * shrink, dr)) : pitch);
      const glyphR = Math.min(RAIL_R_MAX, Math.max(0.8, pitch * rFrac), 0.49 * minDist);
      const thick = (nSub - 1) * dr + 2 * glyphR;
      // THE CASCADE OWNS ITS AIR (wave 4) — a multi-sub-row band is a
      // thick annulus, and growing it INWARD from the centreline
      // would push rIn under the tree's measured extent (the gate
      // asserts cascade < rIn per family). The layout has already
      // placed the tree by the time the rails build, so the band's
      // centreline yields OUTWARD exactly as far as the measured
      // extent demands and no further. Angles still map arc-length on
      // the dialled centreline; placing them on a slightly larger
      // circle only ever INCREASES slot spacing (the no-touch law is
      // safe in that direction).
      const rC = Math.max(bandR, treeExt + 4 + thick / 2);
      // Centre the run in the USABLE arc — after the header reserve,
      // before the foot pad (a tiny court reads as a held object at
      // 3 / 9 o'clock, not a smear from crown to foot). The run
      // includes every shelf's caption spill.
      let run = Math.max(0, G - 1) * BAND_SHELF_GAP;
      cols.forEach((c, gi) => {
        run += Math.max(0, c - 1) * pitch + (nSub > 1 ? pitch / 2 : 0) + spills[gi];
      });
      let u = headArc + Math.max(0, (L - headArc - BAND_END_PAD - run) / 2);
      // `parkedIds` is the remainder's id list — the view needs it to
      // bake an honest external class for the wires that land on the
      // crown (wave 2, EDGE-2), and re-deriving it in the view would
      // be a second source of truth.
      //
      // WAVE 4 — THE TEXT RIDES THE ARC. The view writes the header,
      // the shelf captions and the spine names glyph-by-glyph ALONG
      // the curve, so the anchors are now BEARINGS + RADII, not
      // points: capR is the tier-0 caption ring (band outer edge +
      // capClear), capTier the alternating radial step, headA the
      // header's centre bearing (the middle of the reserved top arc,
      // hugging the run's start so a centred small court keeps its
      // title attached). The header rides tier 1 so it can never
      // claim() against the tier-0 first shelf caption.
      const rail = { side, count: T, shown: S, overflow: T - S, pitch, glyphR,
                     nSub, dr, r: rC, rIn: rC - thick / 2, rOut: rC + thick / 2,
                     a0: angAt(0), a1: angAt(L), gapRad, gapBotRad: gapBot,
                     capR: rC + thick / 2 + capClear, capTier: BAND_CAP_TIER,
                     headA: angAt(Math.max(headArc / 2, u - headArc / 2)),
                     foot: null,
                     parkedIds: parked, shelves: [] };
      const runStart = u;
      shown.forEach((g, gi) => {
        const shelf = { label: g.label, count: g.count, shown: g.items.length,
                        spineId: null, items: [] };
        // The caption spill pads the shelf on BOTH sides, so the
        // items stay centred under their own caption.
        const uItems = u + spills[gi] / 2;
        let bd = -1;
        g.items.forEach((n, k) => {
          const col = Math.floor(k / nSub), sub = k % nSub;
          const stag = (nSub > 1 && (sub % 2) === 1) ? pitch / 2 : 0;
          const a = angAt(uItems + col * pitch + stag);
          const rad = rC + (sub - (nSub - 1) / 2) * dr;
          const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
          positions.set(n.id, { x, y });
          radii.set(n.id, glyphR);
          shelf.items.push({ id: n.id, x, y, a });
          const d = degOf(n.id);
          if (d > bd) { bd = d; shelf.spineId = n.id; }
        });
        const uEnd = uItems + Math.max(0, cols[gi] - 1) * pitch + (nSub > 1 ? pitch / 2 : 0);
        shelf.a0 = angAt(uItems);
        shelf.a1 = angAt(uEnd);
        // Caption anchor: the shelf's mid-bearing on its own tier of
        // the caption ring. Alternating radial tiers keep two short
        // neighbouring shelves' captions out of each other's 15px
        // claim band even where captions run longer than their shelf.
        shelf.capA = angAt((uItems + uEnd) / 2);
        shelf.tier = gi % 2;
        shelf.capR = rail.capR + shelf.tier * BAND_CAP_TIER;
        rail.shelves.push(shelf);
        u = uEnd + spills[gi] / 2 + BAND_SHELF_GAP;
      });
      // THE FOOT SITS IN THE BOTTOM OPENING (wave 4) — the overflow
      // line used to anchor at the run's own end, which the curved
      // caption ring now owns; half a bottom-gap past the arc end is
      // the one bearing on this side that no shelf, caption or
      // header can ever occupy ("the bottom opening space", his
      // words — the remainder is stated exactly where the space is).
      const aFoot = angAt(L) + (side > 0 ? 1 : -1) * (gapBot / 2);
      rail.foot = { x: cx + Math.cos(aFoot) * rC, y: cy + Math.sin(aFoot) * rC,
                    ux: Math.cos(aFoot), uy: Math.sin(aFoot), a: aFoot };
      rail.runA0 = angAt(runStart);
      rail.runA1 = angAt(Math.max(0, Math.min(L, u - BAND_SHELF_GAP)));
      return rail;
    }
    // The tree's measured extent (position + house radius) — the
    // rails read it so a thick band can yield outward instead of
    // growing an annulus over the cascade's outermost gods.
    let treeExt = 0;
    for (const n of tree) {
      const p = positions.get(n.id);
      if (!p) continue;
      const e = Math.hypot(p.x - cx, p.y - cy) + (radii.get(n.id) || 0);
      if (e > treeExt) treeExt = e;
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
      const px = cx + Math.cos(ang) * portR;
      const py = cy + Math.sin(ang) * portR;
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
        // THE THREE ZONES (wave 3) — what the view and the probes
        // need to reason about the macro geometry without re-deriving
        // it: the tree zone the cascade solved against, the port ring,
        // and whether a band stands at all (rails carry its radii).
        treeR: Rt,
        portR,
        hasBand,
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
          // What the cascade ACTUALLY holds — the crown's noun for
          // `tree` is derived from this and never from the wheel mode.
          treeKind,
          treeTypes,
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
