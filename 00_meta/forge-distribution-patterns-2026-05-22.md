# Forge — Distribution Pattern Candidates (2026-05-22)

Eight intra-wedge distribution algorithms for a new View-panel toggle (sibling to
Color-theme + Family-order). Each preserves the wheel + 36 family wedges; only the
**(r, ang) assignment inside each wedge** changes.

Implementation site: `src/js/engine/layout/radial.js` Phase 3 (lines ~180–378).
The Phase-4 global repulsion pass (lines ~422–569) stays shared across patterns.

Frame: `arcUsable = (w.a1 - w.a0) - 2·padA`, padded annulus `[rIn, rOut]`,
`i ∈ [0,N)` after age-sort (oldest first). Formulas give `(u,v) ∈ [-1,1]²` →
`ang = w.center + u·arcUsable/2`, `r = rMid + v·radHalf`.

---

## 1. Vogel Sunflower (Phyllotaxis)

**Mathematical core**
```
ang_i = w.center + i · φ_golden     (mod arcUsable, recentred on wedge)
r_i   = rIn + (rOut − rIn) · √(i / N)
```
where φ_golden = 2π · (1 − 1/φ) ≈ 2.39996 rad.

**Story** — Pure botanical/Fibonacci packing. No data signal: nodes are
indistinguishable by position other than their rank. Subverts age-radial
reading; emphasises *family* as the only structural unit.

**Visual feel** — Iconic sunflower seed-head spiral inside each wedge. Organic,
almost alive — each wedge a miniature sunflower.

**Implementation notes** — Replace the vdcBase2 angle path and the ageT-derived
`v` with the two lines above. Use a per-wedge i counter (not the global sort
index) so each wedge starts a fresh spiral. Drop the age-spring radial target.
Repulsion pass barely fires — √-radius + golden-angle is already low-discrepancy.

**Tradeoffs** — Beautiful, recognisable, *throws away the age signal*. Hub-node
centrality lost. Good as a "pure aesthetic" mode.

---

## 2. Fermat / Archimedean Spiral

**Mathematical core**
```
θ_i = i · Δθ          (Δθ = arcUsable / N · k_density, k_density ≈ 3–5)
r_i = rIn + (rOut − rIn) · √(i / N)           (Fermat — equal-area)
        — or —
r_i = rIn + (rOut − rIn) · (i / N)            (Archimedean — equal-step)
```
Spiral wraps inside the wedge by modulo-folding θ into `[-arcUsable/2, +arcUsable/2]`.

**Story** — Age becomes a *path*. Following the spiral inward literally walks
the chronology. Stronger temporal narrative than the current fan.

**Visual feel** — Mechanical, deliberate, scholarly. Each wedge reads like a
nautilus shell. Data-visualisation aesthetic.

**Implementation notes** — Walk `i = 0…N-1` and assign `(r, ang)` directly.
Skip the vdc slot. Keep the 2D relaxation pass — it'll smooth where neighbours
come close on adjacent winds.

**Tradeoffs** — Adjacent ages stay visually adjacent (good for tracing
chronology) but loses the "sibling fan" feel. Could read as repetitive across
36 wedges.

---

## 3. Wave-Interference Grid (John's request)

**Mathematical core**
```
ψ(r, θ) = sin(k_r · r + φ_r) · cos(k_θ · θ + φ_θ)
```
Generate a candidate-position field over the wedge. Place nodes at the N highest
local maxima of |ψ|, sorted by age such that older = outer-band maxima, newer =
inner-band maxima. `k_r`, `k_θ` are 2–4 wavelengths across the wedge; `φ_r, φ_θ`
hashed per-wedge so families differ.

**Story** — Reveals *resonance*. Nodes look caught in a standing wave —
constructive crests mark "hotspots" where dense families pack tighter; sparse
ones leave the destructive valleys visibly empty. Cymatic / mystical.

**Visual feel** — Cymatic plate. Concentric ripples crossed with angular ripples
make a lattice of bright dots; destructive valleys leave visible empty stripes.
Esoteric, fitting for a cross-tradition-resonance investigation.

**Implementation notes** — Two approaches: (1) **snap-to-grid** — precompute
fine `(r_g, θ_g)` lattice, evaluate |ψ|, take top-N peaks; (2) **direct
parametric** — pick crest indices: `r_i = rIn + (m_i + 0.5)·π/k_r`,
`θ_off = (n_i + 0.5)·π/k_θ`, with `(m_i, n_i)` from a low-discrepancy 2D
sequence. Direct is faster. Either way **`k_r`, `k_θ` must scale with
`radHalf` and `arcUsable`** — suggest `k_r = 2π·3/radHalf`, `k_θ = 2π·2/arcUsable`.
Soften the relaxation push so it doesn't smear fringes back into valleys.

**Tradeoffs** — Striking, unique, honours John's request. Implementation
surprise: small wedges (N<8) lack peaks; need a Vogel fallback. Risk of looking
*gimmicky* if wave params aren't tuned carefully.

---

## 4. Poincaré Disk (Hyperbolic)

**Mathematical core**
Map each node from Euclidean (u, v) ∈ [-1, 1]² to hyperbolic coords:
```
r_hyp = tanh(ρ · v')              where v' = (v+1)/2 ∈ [0,1], ρ ≈ 2
r_euc = rIn + (rOut − rIn) · r_hyp
ang   = w.center + u · arcUsable/2
```
Or equivalently: warp the radial axis so equal age-steps near the rim are visually
*compressed* (more nodes per pixel near `rOut`).

**Story** — Edge-of-knowledge metaphor. Old material crams against the rim.
"Ancient = edge of the known world". Aesthetic match for a vault chasing oldest
substrate.

**Visual feel** — Dense halo of ancient deities pressed against the rim, sparse
modern strata at the inside. Escher-disk feel.

**Implementation notes** — Replace the linear `v ↦ r` mapping with a `tanh`
warp. Everything else (vdc angle, jitter, springs) stays. Tune ρ; ρ=2 packs
~80% of nodes in the outer 30% of the annulus.

**Tradeoffs** — Strengthens age-reading. Risk: compresses ancient nodes — may
hurt clickability at moderate zoom. Stronger version of current lens.

---

## 5. Concentric Age-Bands (Scholarly Chronological)

**Mathematical core**
```
Band k = [year_k, year_{k+1}]   (e.g. fixed -3000, -1500, -500, 500, 1500, 2026)
Members in band k → r = rIn + (k + 0.5) · (rOut - rIn) / K
Within band: van der Corput angular spread (as today).
```

**Story** — Pure chronology. The wheel reads like a *radar chart of historical
periods* — at a glance, which families have Bronze-Age presence, which are
Iron-Age-only, which exploded in late antiquity.

**Visual feel** — Most grid-like / scholarly. Distinct rings of nodes at fixed
radii across all wedges; a chronological reference chart.

**Implementation notes** — Replace `targetR[i] = rMid + (1−2·ageT)·radHalf`
with a band lookup on `n.date_earliest`. 5–6 fixed bands. Angular spread inside
a band stays vdc + jitter. Undated nodes need their own ring (innermost).

**Tradeoffs** — *Maximum* legibility for the age question. *Worst* for visual
variety — rings read globally as one circle pattern (glorious radar chart, or
boring). Mitigate with soft band labels at the rim.

---

## 6. Voronoi-Relaxed Lattice (Lloyd's algorithm)

**Mathematical core**
1. Seed N points by vdc inside the wedge polygon.
2. Compute Voronoi diagram clipped to wedge.
3. Move each seed to its cell centroid.
4. Repeat 2–3 for ~5 iterations.
5. Sort seeds by radial position, assign to age-sorted node list.

**Story** — *Equal-area* packing. Every node "owns" the same wedge area.
Scrupulously fair / scholarly. Hub bonus lost unless cells are weighted by
degree (power diagram).

**Visual feel** — Crystalline, even, peaceful — soap-foam / honeycomb.

**Implementation notes** — Needs clipped-Voronoi (library or hand-rolled
half-plane clipping). Lloyd converges in 5–10 iters. *Cheap proxy*: blue-noise
/ Poisson-disc sampling inside the wedge polygon (Bridson, ~40 lines, no
Voronoi).

**Tradeoffs** — Cleanest equal-area distribution. Cost: 200+ LoC, age signal
lost unless re-stratified, hub bonus lost unless weighted. Possibly too
expensive for a toggle.

---

## 7. Family-Tree Dendrogram Fan

**Mathematical core**
Within a wedge, recursively split the arc by sub-family (or by age era):
```
splitArc(angRange, members):
  if |members| ≤ K: distribute linearly along (angRange, radial-band)
  else:
    sub_groups = partition(members)
    arcs = subdivide angRange proportional to |sub_group|
    for each (sub_group, sub_arc): splitArc(sub_arc, sub_group)
```

**Story** — Reveals *internal genealogy*. Inside Egyptian: Heliopolitan ennead
grouped, then Theban triad, then late Ptolemaic syncretisms — each its own
micro-wedge.

**Visual feel** — Tree fan. Hierarchical cladogram. Adds a second layer of
structure inside each wedge.

**Implementation notes** — Requires *sub-family* metadata that doesn't exist
today (we group by `family` only). Could fake it from `tag-cult-center` /
`tag-era-*` tags, but quality depends on tag coverage. Pre-compute partition
once, then place.

**Tradeoffs** — Powerful for big wedges (Vedic, Egyptian, Greek). Weak for
small wedges. Implementation surprise: needs a metadata pass; otherwise
collapses to age-bands trivially.

---

## 8. Quasi-Crystal Penrose Slice

**Mathematical core**
Use a 5-fold quasi-periodic point set (e.g. cut-and-project from 5D lattice
onto 2D plane), then crop to the wedge polygon and pick N nearest-to-vdc-seeds.
Practical approximation:
```
For point n in De Bruijn pentagrid:
  (x_n, y_n) = Σ_{k=0..4} cos(2πk/5)·z_k, sin(2πk/5)·z_k
```
where `z_k` are integer indices satisfying the pentagrid intercept condition.

**Story** — Aperiodic order. Same underlying lattice everywhere; no two wedge
crops look alike. Suggests hidden shared symmetry without repetition.

**Visual feel** — Most "sacred geometry" of all candidates. Intentional,
mystical, mathematically rich.

**Implementation notes** — Heavy. Probably needs an offline-precomputed Penrose
point cloud (a few thousand points) cached as JSON; runtime crops to each
wedge polygon and picks N. Age sort then assigns node-to-point by radial rank.

**Tradeoffs** — Distinctive, *vault-thematic*. But expensive to implement,
small-wedge fallback needed, and the 5-fold symmetry only reads at sufficient
zoom.

---

## 100-word Recommendation

Ship **Concentric Age-Bands** first — it's the lowest-LoC change (~30 lines
replacing Phase 3), and it tells the cleanest scholarly story: the wheel
becomes a chronological radar chart at a glance. Ship **Wave-Interference**
second — it's John's named request, visually unique, and matches the vault's
cross-tradition-resonance thesis; budget 1–2 sessions for parameter tuning and
small-wedge fallback. Ship **Vogel Sunflower** third — it's almost free (~10
lines, golden-angle is already imported), gives a pure-aesthetic mode for
screenshots, and provides a non-data-encoded baseline against which the other
modes' data-readings become legible by contrast.

