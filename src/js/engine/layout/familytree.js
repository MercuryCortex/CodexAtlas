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
  // CASCADE_BIAS (0.10 — "stack centre sits below cy") was here until
  // 2026-07-31 wave 4. It existed to keep a column clear above the
  // first rank for the crown's four-row caption stack; that block is a
  // locked SCREEN fixture now and reserves nothing in world space, so
  // the vertical offset is SOLVED per family instead (see §6).
  // THE TWO PITCH TERMS. Both are design/family-tree.html's ratified
  // values and both SHIP UNCHANGED — wave 5 only made them dials.
  // They were the terms most likely to have to move: the tree's lane
  // is a hard boundary now, and a hard boundary usually costs size.
  // Measured, it costs −0.1% across the ten gate families, because
  // the lane is enforced on the tree's MEASURED EXTENT rather than on
  // its zone (see THE LANE IS A HARD BOUNDARY) and most families
  // never reach it. So nothing is bought back, because nothing was
  // spent. Pushing them is now John's call, not a baked constant:
  // chord 0.76 / fill 0.88 is +1.2% with no family losing centring;
  // past ~0.78 / 0.90 Greek's circle fit starts to bind and its
  // cascade leaves the house centre.
  const CASCADE_CHORD  =  0.74;  // coarse chord factor for the P solve
  const BED_FILL       =  0.86;  // how much of a bed's own chord the bed may fill
  // The third term: the ceiling on P as a fraction of the tree lane.
  // It is what stops a 12-god family becoming twelve balloons, and it
  // is the term that BINDS on small families (Christian, Celtic,
  // Baltic) — so it is a dial too, and it is the one to reach for
  // when a small house looks under-scaled.
  const BED_P_CAP      =  0.16;
  const BED_GG         =  0.55;  // extra air (in P) at group boundaries
  const BED_SUBDY      =  0.78;  // sub-row spacing (in P)
  const BED_GAP        =  1.5;   // inter-band gap (in P) — arc room
  const NODE_R_FRAC    =  0.34;  // node radius = P * this * tier mult
  // ── THE TWO PACKINGS (2026-07-31 wave 5) ─────────────────────
  // John: "Im not sure what was your logic in your node
  // distribution, but if its different keep it add a toggle to use
  // it then i can pick." So both laws ship and `pack` picks.
  //
  // THE MEASURED DIFF (app HEAD vs design/family-tree.html, the
  // ratified toy). The BED itself is NOT the difference — the toy
  // took the same 07-30 SCALE+BUNDLES pass, so column-major slots,
  // the hex half-pitch stagger, BED_GG group air, C_MAX and the tier
  // radii are character-identical in both files. What actually
  // drifted is WHERE THE STACK STANDS and WHAT IT SOLVES AGAINST:
  //
  //   1 ▸ VERTICAL ANCHOR.  toy: a fixed bias — the stack's centre is
  //       pinned 0.10·R below the house centre (it was reserving a
  //       column for the crown's caption stack).  app: the offset is
  //       SOLVED (96-step scan for the offset that maximises the
  //       worst bed's circle fit, tie-broken to the smallest |offset|
  //       so an unbound house centres).  This is the wave-4 change
  //       John asked for ("the title is taking TOO MUCH space").
  //   2 ▸ VERTICAL SPAN.  toy: −0.58 … +0.84 of R, always.  app:
  //       −0.64 … +0.92 of the TREE ZONE Rt whenever a band stands
  //       (wider span, smaller radius).
  //   3 ▸ POLE CHORD FLOOR.  toy floors the half-chord at sqrt(0.12)
  //       ≈ 0.35 wu (i.e. effectively nothing).  app floors it at
  //       0.12·Rt ≈ 50 wu, so a bed pushed near a pole shrinks the
  //       whole house far less violently.
  //   4 ▸ SHRINK FLOOR.  toy: P *= shrink, unbounded.  app: P *=
  //       max(0.5, shrink) — one pass can never more than halve P.
  //   5 ▸ FAN, EMPTY RANK.  toy advances the ring radius by half a
  //       ring pitch for a rank with no members; the app leaves the
  //       radius where it was.  (The only fan-side difference; it
  //       shows up wherever era-ranking leaves a rank empty.)
  //   6 ▸ NODE RADIUS FLOOR.  toy 2.6 wu, app 3 wu.
  //   7 ▸ CROWN CLEARANCE.  toy: min(P·1.5, 68) above the first bed's
  //       TOP.  app: min(P·0.9, 60) above the first bed's CENTRE.
  //
  // `pack:'bed'` (default) is the app's law, `pack:'toy'` the toy's,
  // applied to the same solved tree lane Rt — the three-zone budget
  // below is orthogonal to the packing law and binds both.
  const TOY_BIAS       =  0.10;  // toy pack: stack centre sits 0.10·Rt below cy
  const TOY_TOP        = -0.58;  // toy pack: vertical span, fractions of Rt
  const TOY_BOT        =  0.84;
  const TOY_NODE_R_MIN =  2.6;   // toy pack: node radius floor (wu)
  const BED_NODE_R_MIN =  3;     // bed pack: node radius floor (wu)
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
  const RAIL_R_MAX     =  9;     // hard ceiling (wu)
  const RAIL_R_MIN     =  1.6;   // glyph radius floor (wu) — below this a court slot
                                 // stops being an object and the margin has to give
                                 // instead (reported as rail.squeeze.glyph)
  // ════════════════════════════════════════════════════════════
  // ZERO-TOLERANCE MARGINS (2026-07-31 wave 5)
  // ════════════════════════════════════════════════════════════
  // John, verbatim: "we keep the other work done with the increased
  // 0 TOLERANCE bands margins between nodes NEVER getting close
  // between bands."
  //
  // MEASURED BEFORE THIS PASS, on the real vault at the shipped
  // dials (probe over all 30 families, both geometries):
  //   · tree extent → band inner edge:  4.0 wu  (Greek/Vedic/Celtic/
  //     Mesoamerican/Buddhist in FAN — the literal hard-coded `+4` in
  //     the old rC line), 9.8 wu (Mesopotamian, cascade)
  //   · outermost caption tier → ports ring:  9.6 wu, before the text
  //     itself is counted at all
  //   · sub-row → sub-row (edge to edge):  1.15 wu
  //   · glyph → glyph along an arc:  2.00 wu (the old law reserved
  //     2% of the slot pitch and nothing else)
  //
  // Those four numbers ARE his complaint. They were emergent — the
  // band was placed at a dialled radius and the tree hoped to stay
  // out of it. They are CONSTRUCTED now: the radial budget is solved
  // outside-in, once, before anything is placed —
  //
  //   portR
  //     − M_BAND_PORT − caption text − caption tier − capClear
  //                                            = the band's outer ceiling
  //   band centreline rC = min(bandR, ceiling − thickness/2)
  //   band inner edge    = rC − thickness/2
  //     − M_TREE_BAND                          = the tree's lane RtMax
  //   Rt = min(dialled tree zone, RtMax)
  //
  // so the tree can no longer reach the band and the band can no
  // longer reach the ports. Inside the band, M_SUB_ROW and M_GLYPH
  // bound the glyph radius and the sub-row spacing directly.
  //
  // WHERE THE GROUND IS GIVEN, when a family cannot have everything:
  //   1 ▸ the TREE ZONE yields first (Rt shrinks; gods get smaller).
  //       It is the only one of the four that can yield without two
  //       things touching, and it is reported as house.margins.rtCost.
  //   2 ▸ then the band THINS — glyph radius down to RAIL_R_MIN.
  //   3 ▸ only then does M_BAND_PORT yield, and the shortfall is
  //       named in rails.<side>.squeeze (never silently absorbed).
  // M_TREE_BAND, M_SUB_ROW and M_GLYPH never yield: they are the
  // "nodes NEVER getting close" half of the sentence.
  const M_TREE_BAND    =  16;    // tree's measured extent → band inner edge (wu)
  const M_BAND_PORT    =  12;    // outermost caption tier's outer edge → ports ring (wu)
  const M_SUB_ROW      =  3;     // sub-row → sub-row, glyph edge to glyph edge (wu)
  const M_GLYPH        =  3;     // glyph → glyph along the arc, edge to edge (wu)
  // The caption ring is TEXT, and text has height the layout cannot
  // measure headlessly (it is CSS px on a camera that has not been
  // built yet). This is its outer half-height in world units at the
  // isolate's own fit scale: TYPE.cap 9.5px × type scale 1.6 (the
  // LAB's ceiling) ÷ 0.82 (the measured fit scale at the gate
  // viewports) ≈ 18.5 px ≈ 9.3 wu — rounded up, once, here.
  const BAND_CAP_TEXT  =  10;    // caption outer half-height reserve (wu)
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
  //   pack:       'bed' | 'toy'          default 'bed'  — WHICH packing
  //               law places the ranks (see THE TWO PACKINGS above for
  //               the measured, itemised difference). 'bed' is the
  //               app's shipped law; 'toy' is design/family-tree.html's.
  //   chord:      0.5..1   default 0.74  — the coarse chord factor in
  //               the pitch solve (bigger = wider beds allowed = a
  //               bigger P before the circle fit claws it back)
  //   bedFill:    0.5..1   default 0.86  — how much of a bed's OWN
  //               chord the bed may fill. These two are the terms
  //               that decide god size, and they are dials because
  //               the tree lane below is now a hard boundary.
  //   ── the four zero-tolerance minimums, world units ──
  //   marginTree: default 16  tree's measured extent → band inner edge
  //   marginPort: default 12  outermost caption tier → ports ring
  //   marginSub:  default 3   sub-row → sub-row, edge to edge
  //   marginGlyph:default 3   glyph → glyph along an arc, edge to edge
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
    // WAVE 5 — the packing law (see THE TWO PACKINGS above) and the
    // two pitch terms that decide god size, both dials now.
    const pack = (o.pack === 'toy') ? 'toy' : 'bed';
    const chordF  = Math.max(0.5, Math.min(1, num(o.chord, CASCADE_CHORD)));
    const bedFill = Math.max(0.5, Math.min(1, num(o.bedFill, BED_FILL)));
    const bedCap  = Math.max(0.08, Math.min(0.32, num(o.bedCap, BED_P_CAP)));
    // The four zero-tolerance minimums (world units).
    const mTreeBand = Math.max(0, Math.min(120, num(o.marginTree,  M_TREE_BAND)));
    const mBandPort = Math.max(0, Math.min(120, num(o.marginPort,  M_BAND_PORT)));
    const mSubRow   = Math.max(0, Math.min(40,  num(o.marginSub,   M_SUB_ROW)));
    const mGlyph    = Math.max(0, Math.min(40,  num(o.marginGlyph, M_GLYPH)));
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
    const portR = Rh * Math.max(0.7, Math.min(1.25, num(o.portInset, 1)));
    // The band's own dials, hoisted out of buildRail (wave 5): the
    // RADIAL BUDGET below needs them before anything is placed.
    const bandR   = Rh * Math.max(0.5, Math.min(1.02, num(o.bandR, BAND_R_FRAC)));
    const gapRad  = Math.max(4, Math.min(60, num(o.bandGap, BAND_GAP_DEG))) * Math.PI / 180;
    const gapBot  = Math.max(2, Math.min(60, num(o.bandGapBot, BAND_GAP_BOT_DEG))) * Math.PI / 180;
    const rowsMax = Math.max(1, Math.min(4, Math.round(num(o.bandRows, BAND_ROWS_MAX))));
    const pitchTgt = Math.max(4, Math.min(BAND_PITCH_MAX, num(o.bandPitch, BAND_PITCH_TGT)));
    const capClear = Math.max(0, Math.min(60, num(o.capClear, BAND_CAP_CLEAR)));
    const railCap  = Math.max(1, Math.round(num(o.railMax, RAIL_MAX)));
    const railFrac = Math.max(0.05, Math.min(1, num(o.railGlyph, RAIL_R_FRAC)));
    const bandSpan = Math.max(0.26, Math.PI - gapRad - gapBot);
    // Shelf-label formatters — hoisted out of §7 with the band dials
    // (wave 5): docShelves runs before the tree now, so these have to
    // be initialised before the budget calls it.
    const fmtDate = (d) => d == null ? 'UNDATED' : (d < 0 ? (-d) + ' BCE' : d + ' CE');
    const fmtRange = (a, b) => {
      if (a == null || b == null || a === b) return fmtDate(a == null ? b : a);
      if (a < 0 && b < 0) return (-a) + '–' + (-b) + ' BCE';
      if (a >= 0 && b >= 0) return a + '–' + b + ' CE';
      return (-a) + ' BCE–' + b + ' CE';
    };
    // ── THE RADIAL BUDGET, SOLVED OUTSIDE-IN (wave 5) ────────────
    // The band is solved BEFORE the tree, because the band's arc and
    // thickness depend on nothing the tree knows, while the tree's
    // lane depends entirely on where the band's inner edge lands.
    // Solving in this order is what turns all four clearances from
    // emergent into constructed. (Before this pass the order was the
    // other way round and the band chased the tree outward with a
    // hard-coded +4 wu of air — the measured 4.0 wu John saw.)
    const railSolves = hasBand
      ? { left: solveRail(docShelves(docs), -1), right: solveRail(kindShelves(court), +1) }
      : { left: null, right: null };
    // THE TREE'S LANE — the innermost band edge, less the tree margin.
    // This is a HARD CEILING ON THE MEASURED EXTENT, not on the zone
    // the cascade solves in, and the difference is 4% of every god in
    // half the vault. Most families do not fill their zone (Greek's
    // cascade reaches 382 of 464; Christian's 362), so clamping the
    // ZONE would tax nine families for a problem two of them have.
    // The zone stays where the dial puts it, the extent is MEASURED
    // after placement, and a tree that reaches past its lane is
    // scaled into it exactly (see THE LANE IS A HARD BOUNDARY). The
    // clearance is identical either way — it just costs less.
    let RtLane = Infinity;
    for (const rs of [railSolves.left, railSolves.right]) {
      if (rs) RtLane = Math.min(RtLane, rs.rC - rs.thick / 2 - mTreeBand);
    }
    // A pathological dial set (huge margins on a small house) must
    // still draw a house — the floor is 0.25·Rh, and any shortfall is
    // reported in house.margins, never silently swallowed.
    if (hasBand) RtLane = Math.max(Rh * 0.25, RtLane);
    const Rt = hasBand
      ? Rh * Math.max(0.35, Math.min(1, num(o.treeR, BAND_TREE_R)))
      : Rh;
    // The vertical span stayed at the wave-4 constants on purpose:
    // measured, widening it to -0.68…0.94 does re-centre Greek and
    // buys Norse/Vedic/Mesopotamian 2-4%, but it costs GREEK 15% (its
    // beds get pushed toward the poles, where the chord is short).
    // Greek is the family with the most bones on screen; it wins.
    const treeTop = hasBand ? BAND_TREE_TOP : CASCADE_TOP;
    const treeBot = hasBand ? BAND_TREE_BOT : CASCADE_BOTTOM;
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
    // Pack diff #6 — the node-radius floor (toy 2.6 wu, app 3).
    const nodeRMin = (pack === 'toy') ? TOY_NODE_R_MIN : BED_NODE_R_MIN;
    const nodeR = (i) => Math.max(nodeRMin, P * NODE_R_FRAC * tierMult(i));
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
      // Pack diff #2 — the vertical span. 'bed' uses the wave-3 zone
      // span; 'toy' uses design/family-tree.html's -0.58 … +0.84.
      const spanTop = (pack === 'toy') ? TOY_TOP : treeTop;
      const spanBot = (pack === 'toy') ? TOY_BOT : treeBot;
      const usable = Rt * (spanBot - spanTop);
      // P fills the vertical band OR the chord, capped; the spread
      // dial stretches but the vertical band ALWAYS re-clamps —
      // otherwise the bottom bed slides to the rim, its chord goes
      // to zero and the overflow guard nukes P (the toy's Greek bug).
      // chordF / bedFill are wave-5 dials: with the tree lane now a
      // HARD boundary (the band can no longer be reached), the
      // cascade is allowed to fill more of it than the old
      // place-then-hope constants dared.
      P = Math.min(usable / Math.max(1, totalU), (2 * Rt * chordF) / Math.max(1, maxWU), Rt * bedCap);
      P = Math.min(P * spread, usable / Math.max(1, totalU));
      // ── THE CROWN'S RESERVED SPAN, GIVEN BACK (2026-07-31 wave 4) ──
      // John: "the title is taking TOO MUCH space and central that
      // forces the nodes to be around it… theres no reason for that."
      // He is right, and CASCADE_BIAS was the mechanism: the stack's
      // centre was pushed 0.10·Rt (≈46 world units) BELOW the house
      // centre purely so the family name, two stat lines and the
      // geometry chips had a clear column above the first rank. The
      // block is a LOCKED SCREEN FIXTURE since wave 4 (forge.js
      // houseTitleAnchor) and reserves nothing in world space, so the
      // cascade may sit wherever it reads best.
      //
      // "Wherever it reads best" is not a new constant — it is SOLVED.
      // The second pass below shrinks P by the worst bed's circle fit
      // (a bed near a pole has a short chord), and where the block's
      // centre lands is exactly what decides which bed is worst. So
      // scan the legal offsets and take the one that maximises the
      // worst fit; the objective is clamped at 1 (a bed that already
      // fits cannot "fit more"), so when nothing is shrinking every
      // offset ties and the tie-break picks the SMALLEST |offset| —
      // i.e. the tree centres on the house, which is what the caption
      // was stopping it doing. Deterministic: fixed grid, fixed pass
      // order, no float compared for equality.
      //
      // MEASURED against the pre-wave-4 layout, median god radius per
      // family (world units): Norse 18.7→21.1 (+12.7%), Mesoamerican
      // 19.1→20.3 (+6.4%), Egyptian 15.9→16.8 (+5.8%), Vedic
      // 16.4→17.0 (+3.5%), Chinese 22.7→23.1 (+1.9%), Celtic +0.3%,
      // Greek / Christian / Mesopotamian / Baltic / Other unchanged.
      // ZERO families lose. (Widening treeTop as well was tried and
      // rejected: it costs Mesopotamian ~10%.)
      const bedCentreU = [];
      {
        let u = 0;
        for (const b of beds) {
          if (!b) { bedCentreU.push(null); continue; }
          bedCentreU.push(u + b.bedU / 2);
          u += b.bedU + BED_GAP;
        }
      }
      // Pack diff #3 — the pole chord floor. 'bed' floors the
      // half-chord at 0.12·Rt so a bed near a pole cannot nuke P;
      // 'toy' floors it at sqrt(0.12) wu, i.e. effectively not at all.
      const halfFloorSq = (pack === 'toy') ? 0.12 : Rt * Rt * 0.0144;
      const halfChord = (dy) => Math.sqrt(Math.max(halfFloorSq, Rt * Rt - dy * dy));
      const V_STEPS = 96;
      const solveVOffset = (P0) => {
        const contentH = totalU * P0;
        const lo = Rt * spanTop + contentH / 2;
        const hi = Rt * spanBot - contentH / 2;
        if (!(hi > lo)) return (lo + hi) / 2;   // content taller than the zone
        const fitAt = (off) => {
          let s = 1;                            // clamped: "already fits" is the ceiling
          for (let r = 0; r < beds.length; r++) {
            const b = beds[r];
            if (!b) continue;
            const dy = off - contentH / 2 + bedCentreU[r] * P0;
            s = Math.min(s, (halfChord(dy) * 2 * bedFill) / Math.max(1e-6, b.wU * P0));
          }
          return s;
        };
        let best = -1;
        for (let k = 0; k <= V_STEPS; k++) best = Math.max(best, fitAt(lo + ((hi - lo) * k) / V_STEPS));
        const want = best * 0.995;              // within half a percent counts as tied
        let bestOff = null;
        for (let k = 0; k <= V_STEPS; k++) {
          const off = lo + ((hi - lo) * k) / V_STEPS;
          if (fitAt(off) < want) continue;
          if (bestOff === null || Math.abs(off) < Math.abs(bestOff) - 1e-9) bestOff = off;
        }
        return (bestOff === null) ? Math.max(lo, Math.min(0, hi)) : bestOff;
      };
      let firstBandTop = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const contentH = totalU * P;
        // Pack diff #1 — the vertical ANCHOR. 'toy' pins the stack's
        // centre TOY_BIAS·Rt below the house centre (its caption
        // reserve); 'bed' solves the offset that maximises the worst
        // bed's circle fit and ties to the smallest |offset|.
        const vOff = (pack === 'toy') ? (Rt * TOY_BIAS) : solveVOffset(P);
        let y = Math.max(cy + Rt * spanTop,
          Math.min(cy + vOff - contentH / 2, cy + Rt * spanBot - contentH));
        let shrink = 1;
        rowMeta = [];
        firstBandTop = null;
        rows.forEach((row, r) => {
          const b = beds[r];
          if (!b) {
            rowMeta.push({ y: null, n: 0, dmin: null, dmax: null,
                           layerMin: null, layerMax: null, offLineage: 0 });
            return;
          }
          const bandY = y + (b.bedU * P) / 2;
          const half = halfChord(bandY - cy);
          const fitR = (half * 2 * bedFill) / Math.max(1e-6, b.wU * P);
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
        // Pack diff #4 — the shrink floor. 'bed' never lets one pass
        // more than halve P; 'toy' applies the ratio raw.
        P *= (pack === 'toy') ? shrink : Math.max(0.5, shrink);
      }
      const firstMeta = rowMeta.find(m => m.y != null);
      // Pack diff #7 — the crown's clearance. 'bed' hangs it
      // min(P·0.9, 60) above the first bed's CENTRE; 'toy'
      // min(P·1.5, 68) above the first bed's TOP row.
      const crownAnchor = (pack === 'toy')
        ? ((firstBandTop != null) ? firstBandTop : (cy + Rt * spanTop))
        : (firstMeta ? firstMeta.y : (cy + Rt * spanTop));
      const crownLift = (pack === 'toy') ? Math.min(P * 1.5, 68) : Math.min(P * 0.9, 60);
      // THE CROWN IS NO LONGER A TEXT ANCHOR (2026-07-31 wave 4).
      // It used to reserve clearance for a four-row caption stack —
      // 96-170 world units under the wave-3 type scale — because the
      // family name, both stat lines and the CASCADE/FAN chips hung
      // off it. All four are a LOCKED SCREEN FIXTURE now (forge.js
      // houseTitleAnchor), so the only jobs left are (a) the apex of
      // the room and (b) the park point for the band's overflow
      // remainder, which stands at radius 0 and never draws. One
      // modest clearance above the first rank does both; the
      // `cy - Rh * 0.84` ceiling is untouched.
      crown = { x: cx, y: Math.max(cy - Rh * 0.84, crownAnchor - crownLift) };
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
        if (!g) {
          // Pack diff #5 — the EMPTY rank. The toy advances the ring
          // radius by half a ring pitch (an empty era still costs
          // radial room, so the rings that follow sit further out);
          // the app leaves the radius where it was (an empty era
          // costs nothing and the next ring takes its place). This is
          // the only place the two fans differ.
          radU.push((pack === 'toy')
            ? (prevRad ? prevRad + FAN_RING_U * 0.5 : FAN_R_IN_U)
            : (prevRad || FAN_R_IN_U));
          braidOn.push(false); prevRad = radU[r]; return;
        }
        const base = prevRad ? prevRad + FAN_RING_U : FAN_R_IN_U;
        const needFlat = (g.wU + 1) / FAN_SPAN;
        const needBraid = (g.wU * FAN_COMP / 2 + 1) / FAN_SPAN;
        if (needFlat <= base) { radU.push(base); braidOn.push(false); }
        else if (needBraid <= base) { radU.push(base); braidOn.push(true); }
        else { radU.push(Math.max(base, needBraid)); braidOn.push(true); }
        prevRad = radU[r];
      });
      const outerU = radU.length ? radU[radU.length - 1] + 0.6 : FAN_R_IN_U;
      P = Math.min((Rt + fanDy * 0.82) / outerU, Rt * bedCap * 0.9375);
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
    // ════════════════════════════════════════════════════════════
    // THE BAND: SOLVE (before the tree) → PLACE (after it)
    // ════════════════════════════════════════════════════════════
    // wave 3 built this as one `buildRail` that ran AFTER the tree and
    // read the tree's measured extent, pushing the band outward with a
    // hard-coded +4 wu of air. That is the "place then hope" John's
    // "0 TOLERANCE" note is about: 4 wu is not a margin, it is a
    // rounding error, and it is what the probe measured in five
    // families' fan.
    //
    // Wave 5 splits it. `solveRail` needs NOTHING from the tree — the
    // shelves, the cap spend, the arc budget and the band's thickness
    // all fall out of the band's own dials — so it runs first and the
    // TREE gets the lane that is left over (§ THE RADIAL BUDGET).
    // `placeRail` then does the placement, once the crown exists for
    // the parked remainder to stand on.
    //
    // `side` keeps its old meaning (-1 Scriptorium / +1 Court) and
    // every claim the wave-3 rail made is preserved verbatim: count is
    // the family's true mass, shown + overflow add up to it, every
    // shelf reports shown vs count, the parked remainder goes to the
    // crown at radius zero.
    function solveRail(groups, side) {
      let T = 0;
      for (const g of groups) T += g.items.length;
      if (!T) return null;
      // Within a shelf the head is still the head of an order the
      // reader can name (docs oldest-first, court highest-degree-first).
      const takes = spendCap(groups.map(g => g.items.length), railCap);
      const shown = [];
      const parked = [];
      for (let gi = 0; gi < groups.length; gi++) {
        const g = groups[gi];
        const take = Math.max(0, Math.min(takes[gi], g.items.length));
        if (take > 0) {
          shown.push({ label: g.label, count: g.items.length, items: g.items.slice(0, take) });
        }
        for (let k = take; k < g.items.length; k++) parked.push(g.items[k]);
      }
      let S = 0;
      for (const g of shown) S += g.items.length;
      const G = shown.length;
      // The caption arc allowance per shelf — the SAME string the
      // view prints (CR-5: "label · shown OF count"), measured in
      // wu-per-char. Format drift between here and renderBandCaptions
      // is pinned by check-familytree.mjs.
      const capNeed = shown.map(g => {
        const txt = g.label + ' · '
          + ((g.items.length < g.count) ? (g.items.length + ' OF ' + g.count) : g.count);
        return Math.min(BAND_CAP_ARC_MAX, txt.length * BAND_CAP_WU);
      });
      // ── the arc, at a candidate centreline radius ──────────────
      // Sub-rows: the FEWEST that reach a readable pitch (so a small
      // court stays a single clean row and a 150-slot one thickens
      // instead of atomising). The half-pitch stagger overhang of an
      // odd sub-row is budgeted per shelf, and so is the caption
      // spill (a shelf whose caption outruns its items is dealt the
      // difference — fixed-point over pitch, monotone, 6 passes).
      const solveAt = (rCin) => {
        const L = rCin * bandSpan;             // arc budget (wu, centreline)
        const headArc = Math.max(0, Math.min(0.45 * L, num(o.bandHead, BAND_HEAD_ARC)));
        const fixed = headArc + BAND_END_PAD + Math.max(0, G - 1) * BAND_SHELF_GAP;
        const itemsArcOf = (c, p, ns) => Math.max(0, c - 1) * p + (ns > 1 ? p / 2 : 0);
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
            for (let gi = 0; gi < G; gi++) spill += Math.max(0, capNeed[gi] - itemsArcOf(cols[gi], p, nSub));
            raw = (L - fixed - spill) / div;
          }
          pitch = Math.max(0.4, Math.min(BAND_PITCH_MAX, raw));
          spills = cols.map((c, gi) => Math.max(0, capNeed[gi] - itemsArcOf(c, pitch, nSub)));
          if (nSub >= rowsMax || raw >= pitchTgt) break;
        }
        // ── M_SUB_ROW and M_GLYPH, enforced by construction ───────
        // The closest two slots can stand: arc neighbours on one
        // sub-row are `pitch` apart ALONG THE CENTRELINE — but an
        // inner sub-row rides a smaller circle, so its chord shrinks
        // by rInner/rC. Staggered diagonal neighbours are
        // hypot(shrunk pitch/2, dr).
        //
        // wave 3 turned that worst distance into a glyph radius with
        // a flat 0.49 factor — 2% of the pitch, i.e. the measured
        // 2.00 wu of air John is looking at. It is a SUBTRACTION now:
        // the glyph gets whatever is left after mGlyph is taken out,
        // so the clearance is the dial and the glyph size is what
        // yields. Same for the sub-rows: dr is at least two glyphs
        // plus mSubRow, and the cosmetic BAND_SUB_DR_MAX ceiling
        // never wins over the margin.
        //
        // dr and glyphR each depend on the other, so this is a small
        // fixed point — monotone (both are bounded above by
        // RAIL_R_MAX / BAND_SHELF_GAP) and deterministic at 6 passes.
        let dr = Math.min(pitch * BAND_SUB_DR, BAND_SUB_DR_MAX);
        let glyphR = Math.min(RAIL_R_MAX, pitch * railFrac);
        let minDist = pitch;
        for (let it = 0; it < 6; it++) {
          const rInner = rCin - ((nSub - 1) / 2) * dr;
          const shrinkF = Math.max(0.5, Math.min(1, rInner / Math.max(1e-6, rCin)));
          minDist = Math.min(BAND_SHELF_GAP,
            (nSub > 1) ? Math.min(pitch * shrinkF, Math.hypot((pitch / 2) * shrinkF, dr)) : pitch);
          // THE ORDER OF THESE FOUR MATTERS. `0.49 * minDist` is the
          // wave-3 NO-TOUCH backstop and it is still the last word:
          // two glyphs may never intersect, whatever the dials say.
          // On top of it, the glyph gives up (minDist − mGlyph)/2 of
          // itself so the CLEARANCE is what the dial buys — but only
          // down to RAIL_R_MIN, because a court of invisible dots is
          // not a court. Where that floor wins, the margin is short
          // and `glyphSqueeze` says by how much.
          glyphR = Math.min(RAIL_R_MAX, pitch * railFrac, 0.49 * minDist,
                            Math.max((minDist - mGlyph) / 2, RAIL_R_MIN));
          dr = Math.max(Math.min(pitch * BAND_SUB_DR, BAND_SUB_DR_MAX), 2 * glyphR + mSubRow);
        }
        // >0 only where RAIL_R_MIN (or the no-touch backstop) beat the
        // margin — a court so crowded that honouring mGlyph in full
        // would erase it.
        const glyphSqueeze = Math.max(0, mGlyph - (minDist - 2 * glyphR));
        const thick = (nSub - 1) * dr + 2 * glyphR;
        return { L, headArc, nSub, cols, pitch, spills, dr, glyphR, thick, glyphSqueeze };
      };
      // ── the band's radial slot in the budget ───────────────────
      // Everything outboard of the band's outer edge is TEXT: the
      // caption clearance, the alternating tier (the header always
      // rides tier 1 — renderBandCaptions), and the text's own
      // half-height. mBandPort is what must still be free between
      // that and the ports ring.
      const rOutCeil = portR - mBandPort - BAND_CAP_TEXT - BAND_CAP_TIER - capClear;
      // THE SOLVE AND THE PLACEMENT MUST SHARE A RADIUS. Slot
      // spacing is arc length mapped onto the centreline, so solving
      // the pitch at one radius and placing at a smaller one silently
      // multiplies every gap by rPlaced/rSolved — that is a
      // no-touch law that holds on paper and fails on screen.
      // So: walk rC DOWN (never up) until it stops moving, re-solving
      // at each step, and place at the radius of the LAST solve.
      // Monotone ⇒ it terminates; fixed step count ⇒ deterministic.
      let rC = bandR;
      let sol = solveAt(rC);
      for (let it = 0; it < 6; it++) {
        const next = Math.max(Rh * 0.25, Math.min(rC, rOutCeil - sol.thick / 2));
        if (!(next < rC - 1e-9)) break;
        rC = next;
        sol = solveAt(rC);
      }
      // GIVE GROUND, NAMED: if the 0.25·Rh floor is what stopped the
      // band moving in far enough, the PORT margin is the one that
      // yields (the tree's never does — see the give-ground order at
      // the constants), and the shortfall is stated in world units.
      const portSqueeze = Math.max(0, (rC + sol.thick / 2) - rOutCeil);
      return { side, groups: shown, parked, count: T, shown: S, G,
               capNeed, rC, rOutCeil,
               squeeze: { port: portSqueeze, glyph: sol.glyphSqueeze },
               L: sol.L, headArc: sol.headArc, nSub: sol.nSub, cols: sol.cols,
               pitch: sol.pitch, spills: sol.spills, dr: sol.dr,
               glyphR: sol.glyphR, thick: sol.thick };
    }
    // PLACE — the solved band, now that the crown exists. Nothing
    // here re-decides a size; it only walks the arc.
    function placeRail(sol) {
      if (!sol) return null;
      const { side, groups: shown, cols, spills, pitch, nSub, dr, glyphR, thick, L, headArc } = sol;
      const rC = sol.rC;
      // PARKED — on the crown, at ZERO radius. "No radius entry" was
      // NOT zero: the view's bake fell back to the WHEEL radius, so a
      // rail item that was also a MODE member stacked a full-size,
      // hit-testable disc on the family name (wave 2, GUEST-2). An
      // explicit 0 is the promise this file's header already makes.
      const parkedIds = [];
      for (const n of sol.parked) {
        positions.set(n.id, { x: crown.x, y: crown.y });
        radii.set(n.id, 0);
        parkedIds.push(n.id);
      }
      // arcU (wu along the centreline, 0 = TOP end) → world angle.
      // Right side runs -90°+gapTop → +90°-gapBot through 0
      // (3 o'clock); left side mirrors through 180°. Screen y grows
      // downward, so sin(-π/2) is the top of the ring.
      const angAt = (u) => (side > 0)
        ? (-Math.PI / 2 + gapRad + (u / L) * bandSpan)
        : (-Math.PI / 2 - gapRad - (u / L) * bandSpan);
      // Centre the run in the USABLE arc — after the header reserve,
      // before the foot pad (a tiny court reads as a held object at
      // 3 / 9 o'clock, not a smear from crown to foot). The run
      // includes every shelf's caption spill.
      const G = shown.length;
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
      const rail = { side, count: sol.count, shown: sol.shown, overflow: sol.count - sol.shown,
                     pitch, glyphR,
                     nSub, dr, r: rC, rIn: rC - thick / 2, rOut: rC + thick / 2,
                     a0: angAt(0), a1: angAt(L), gapRad, gapBotRad: gapBot,
                     capR: rC + thick / 2 + capClear, capTier: BAND_CAP_TIER,
                     headA: angAt(Math.max(headArc / 2, u - headArc / 2)),
                     foot: null,
                     // The band's own honesty record (wave 5): what it
                     // was given, and whether any of it had to yield.
                     squeeze: sol.squeeze, rOutCeil: sol.rOutCeil,
                     parkedIds, shelves: [] };
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
    // ── THE LANE IS A HARD BOUNDARY (wave 5) ────────────────────
    // THE one enforcement point for marginTree. Neither geometry can
    // promise its own extent: the cascade's circle fit is a two-pass
    // approximation, and the fan's origin offset (cy + Rt·FAN_DY)
    // does not scale with P at all, so shrinking P does not shrink
    // the distance to the house centre proportionally (measured:
    // Mesoamerican's fan reached 464.8 inside a 464.0 zone). A
    // margin that is only usually true is exactly what this pass
    // exists to delete.
    //
    // So the extent is MEASURED, and if it reaches past the lane the
    // band left it, the whole tree is scaled about the house centre
    // by precisely the ratio it is over — positions, radii, rowMeta
    // anchors, crown and pitch together, so the picture is identical
    // and only smaller. Uniform, deterministic, and it makes
    // `rIn − treeExt >= marginTree` a fact rather than a hope, which
    // is what lets the gate ASSERT the clearance instead of sampling
    // it. Families that never reach their lane pay nothing.
    let treeExt = 0;
    const treeExtOf = () => {
      let e0 = 0;
      for (const n of tree) {
        const p = positions.get(n.id);
        if (!p) continue;
        const e = Math.hypot(p.x - cx, p.y - cy) + (radii.get(n.id) || 0);
        if (e > e0) e0 = e;
      }
      return e0;
    };
    treeExt = treeExtOf();
    // HONEST ZERO: with no band there is nothing for the tree to be
    // clear OF, so the clamp has no job and must not run — a no-band
    // house (rails off, a deity-only family, the degrade branch) has
    // to come out byte-identical to the pre-wave-5 layout, and the
    // fan can legally reach a hair past Rh there exactly as it did.
    const laneCap = hasBand ? Math.min(Rt, RtLane) : Infinity;
    let rtCost = 0;
    if (treeExt > laneCap && treeExt > 0) {
      const k = laneCap / treeExt;
      rtCost = treeExt - laneCap;
      for (const n of tree) {
        const p = positions.get(n.id);
        if (!p) continue;
        positions.set(n.id, { x: cx + (p.x - cx) * k, y: cy + (p.y - cy) * k });
        const r = radii.get(n.id);
        if (r != null) radii.set(n.id, r * k);
      }
      // rowMeta carries the geometry the chrome anchors on (the rank
      // gutter's left edge, the ring crests) — it rides the same k or
      // the captions detach from the rows they name.
      for (const m of rowMeta) {
        if (m.y != null) { m.y = cy + (m.y - cy) * k; m.half *= k; m.w *= k; m.lineY = cy + (m.lineY - cy) * k; }
        if (m.rad != null) m.rad *= k;
      }
      if (crown) crown = { x: cx + (crown.x - cx) * k, y: cy + (crown.y - cy) * k };
      fanDy *= k;
      P *= k;
      treeExt = treeExtOf();
    }
    const rails = {
      left:  placeRail(railSolves.left),
      right: placeRail(railSolves.right),
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
        groupKey, geometry, RK, pack,
        center: { x: cx, y: cy },
        radius: Rh,
        // THE THREE ZONES (wave 3) — what the view and the probes
        // need to reason about the macro geometry without re-deriving
        // it: the tree zone the cascade solved against, the port ring,
        // and whether a band stands at all (rails carry its radii).
        treeR: Rt,
        portR,
        hasBand,
        // ── THE MARGIN RECORD (wave 5) ────────────────────────────
        // What was DECLARED (`min`), what was ACHIEVED (`treeBand` /
        // `bandPort`, the two the budget constructs), and what it
        // cost. A dial the reader cannot audit is a decoration:
        // check-familytree.mjs asserts every achieved value against
        // its declared minimum, per family, in both packs, both
        // geometries, at the dial extremes.
        //   rtCost   world units of tree EXTENT given back so the
        //            clearance could hold (0 = this family never
        //            reached its lane and paid nothing)
        //   treeExt  the cascade/fan's own measured outer extent
        margins: {
          min: { treeBand: mTreeBand, bandPort: mBandPort,
                 subRow: mSubRow, glyph: mGlyph },
          treeExt,
          treeBand: (() => {
            let rIn = Infinity;
            for (const rl of [rails.left, rails.right]) if (rl) rIn = Math.min(rIn, rl.rIn);
            return (rIn === Infinity) ? null : (rIn - treeExt);
          })(),
          bandPort: (() => {
            let outer = -Infinity;
            for (const rl of [rails.left, rails.right]) {
              if (rl) outer = Math.max(outer, rl.capR + rl.capTier + BAND_CAP_TEXT);
            }
            return (outer === -Infinity) ? null : (portR - outer);
          })(),
          rtCost,
          squeeze: {
            port: Math.max(rails.left ? rails.left.squeeze.port : 0,
                           rails.right ? rails.right.squeeze.port : 0),
            glyph: Math.max(rails.left ? rails.left.squeeze.glyph : 0,
                            rails.right ? rails.right.squeeze.glyph : 0),
          },
        },
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
