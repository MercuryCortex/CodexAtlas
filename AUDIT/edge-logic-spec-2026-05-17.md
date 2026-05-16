# Canonical Edge Visual-Logic Spec — Codex Atlas

**Date:** 2026-05-17 · **Scope:** all graph views (Pantheon, Pantheon-v2, Documents, Scripture, Transmission, Atlas, Alchemy, Astrology) · **Status:** spec, not code

## 1. Design principles

| Principle | Rule |
|---|---|
| Idle = invisible-ish | Every edge type defaults to ONE quiet slate-blue stroke. Per-type color is stashed in `--edge-type-color` and only paints on `.hot`. |
| Color = bucket, not type | 7 semantic buckets. Inside a bucket every type shares the same hue (±lightness). |
| Width = importance, not type | 3 widths only — ambient 0.20, named 0.34, headline 0.46. Hot state caps at 1.6 px. |
| Direction = gradient | Directional buckets paint a `<linearGradient>` source→target on `.hot` (no arrowheads — too noisy in dense graphs). |
| The MASSIVE wins are loud at rest | Cross-symbol bucket (ancestor-of, polemic-inversion, syncretic-fusion, appropriated-by) idles at 0.25–0.30 opacity instead of 0.10 — these are the headline edges and must be visible without hover. |

## 2. Global idle rule

```css
.edge-line, .ph2-edge {
  stroke: rgba(120, 140, 182, 0.72);   /* slate-blue, ~#788CB6 */
  stroke-width: 0.20;                  /* non-scaling-stroke */
  stroke-opacity: 0.10;                /* per-type multiplier overrides */
  vector-effect: non-scaling-stroke;
}
```

This is the **only** color most edges ever paint. Hex `#788CB6` at 72% alpha × 10% stroke-opacity = a barely-there wash; reads as atmosphere, not as data.

## 3. Hot-state gradient mechanism

For directional buckets (transmission, authorship, kinship-descent, attestation-source) — render a per-edge SVG `<linearGradient>` into `<defs>` at hover time:

```xml
<linearGradient id="eg-{id}" gradientUnits="userSpaceOnUse"
  x1="{srcX}" y1="{srcY}" x2="{tgtX}" y2="{tgtY}">
  <stop offset="0%"  stop-color="{bucket-hex}" stop-opacity="0.95"/>
  <stop offset="100%" stop-color="{bucket-hex}" stop-opacity="0.35"/>
</linearGradient>
```

Set `stroke="url(#eg-{id})"` on `.hot`. **No arrowheads** — they pile up illegibly at zoom-out and the source→target fade reads cleaner. Symmetric buckets (parallel, association, kinship-lateral, polemic, fusion) skip the gradient and use a flat `--edge-type-color`.

**Alternative considered, rejected:** dash patterns for direction. Dashes survive dense graphs poorly and conflict with the existing `.edge-line.dim` opacity logic.

## 4. The 7 semantic buckets

| # | Bucket | Meaning | Direction | Hot hex | Hot width | Idle op ×  | Hot op | Arrowhead? |
|---|---|---|---|---|---|---|---|---|
| 1 | **Transmission** | Historical causal flow (A influences/originates B; manuscript chain) | gradient src→tgt | `#C9743A` (terracotta) | 0.46 | 0.10 | 0.95→0.35 | no (gradient) |
| 2 | **Parallel / Structural** | Symmetric resemblance, no claim of contact | symmetric | `#5A9A8F` (teal) | 0.34 | 0.12 | 0.85 | no |
| 3 | **Association / Context** | Membership, theme, ambient context (the quiet majority) | symmetric | `#4A5AA4` (slate-indigo) | 0.20 | 0.08 | 0.55 | no |
| 4 | **Kinship & Consort** | Mythic family relations | descent = gradient parent→child; consort = symmetric | `#C9A5D4` (lilac) | 0.34 | 0.14 | 0.85 | no (gradient) |
| 5 | **Attestation / Authorship** | A document attests / mentions / is authored-by | gradient text→entity (or author→text) | `#D4A55A` (gold) | 0.34 | 0.10 | 0.90→0.40 | no (gradient) |
| 6 | **Polemic / Inversion** | "Anti-" relation, hostile reframing | symmetric (mutual antagonism) | `#A83E4A` (crimson) | 0.46 | 0.25 (loud at rest) | 0.95 | no |
| 7 | **Fusion / Appropriation** | Cross-symbol merger, adoption, visual cognate | symmetric (sometimes gradient) | `#C4783A` (amber-gold) | 0.46 | 0.30 (loud at rest) | 0.95 | no |

### Why these buckets

- **7 buckets, not 12:** the eye can hold ~7 hues; more dissolves into Pantheon-v2's current "green/pink/teal everywhere" failure.
- **Transmission vs Parallel split is academically load-bearing:** Smith/Ulansey/Burkert make their careers on the difference between "Mithra-as-Iranian-descent" (transmission, terracotta) and "Mithra-as-structural-parallel-to-Christ" (parallel, teal). Hue alone must encode that distinction.
- **Association is its own bucket, not a default:** `tradition-deity`, `has-theme`, `context`, `shared-milieu` are 4000+ edges. They flood. Keeping them at slate-indigo 0.08 op preserves the "atmosphere" reading.
- **Kinship is lilac, not green:** green is overused in current schemes for both syncretic-and-kin. Lilac separates "Hera consort-of Zeus" from "Marduk syncretic Bel" cleanly.
- **Polemic and Fusion idle louder (0.25–0.30):** these are John's MASSIVE-wins — swastika polemic-inversion, ankh ancestor-of coptic-cross. They are the *point* of the atlas and should never need hover to be seen.
- **Attestation is gold + directional:** "the Bible attests YHWH" is a source→entity vector. Gold is the long-standing source-tier-1 color in the vault (`app.css:59`), so the eye already trains on it for "this is sourced".

## 5. Implementation table — every type → bucket

| Edge type | Count | Bucket | Hex | Width | Idle op | Hot op | Directional |
|---|---|---|---|---|---|---|---|
| `monograph` | 5615 | (node type, skip) | — | — | — | — | — |
| `symbol-attests-in` | 1604 | 3 Association | `#4A5AA4` | 0.20 | 0.08 | 0.55 | N |
| `has-theme` | 1554 | 3 Association | `#4A5AA4` | 0.20 | 0.08 | 0.55 | N |
| `primary-translation` | 1127 | 5 Attestation | `#D4A55A` | 0.34 | 0.10 | 0.90 | Y |
| `parallel-motif` | 1024 | 2 Parallel | `#5A9A8F` | 0.34 | 0.12 | 0.85 | N |
| `attests` | 961 | 5 Attestation | `#D4A55A` | 0.34 | 0.10 | 0.90 | Y (doc→entity) |
| `symbol-iconography-of` | 935 | 3 Association | `#4A5AA4` | 0.20 | 0.08 | 0.55 | N |
| `symbol-in-tradition` | 912 | 3 Association | `#4A5AA4` | 0.20 | 0.08 | 0.55 | N |
| `mentioned-in` | 803 | 5 Attestation | `#D4A55A` | 0.28 | 0.09 | 0.80 | Y (doc→entity, dimmer than `attests`) |
| `key-figure` | 755 | 5 Attestation | `#D4A55A` | 0.34 | 0.10 | 0.90 | Y |
| `attested-in` | 712 | 5 Attestation | `#D4A55A` | 0.34 | 0.10 | 0.90 | Y (entity→doc) |
| `parallel-form` | 647 | 2 Parallel | `#5A9A8F` | 0.34 | 0.12 | 0.85 | N |
| `syncretic` | 583 | 2 Parallel | `#5A9A8F` | 0.34 | 0.14 | 0.85 | N |
| `influenced-by` | 537 | 1 Transmission | `#C9743A` | 0.46 | 0.10 | 0.95 | Y (src→tgt reversed) |
| `critical-edition` | 513 | 5 Attestation | `#D4A55A` | 0.28 | 0.09 | 0.80 | Y |
| `influences` | 487 | 1 Transmission | `#C9743A` | 0.46 | 0.10 | 0.95 | Y |
| `tradition-person` | 425 | 3 Association | `#4A5AA4` | 0.20 | 0.08 | 0.55 | N |
| `participated-in` | 423 | 3 Association | `#4A5AA4` | 0.28 | 0.10 | 0.65 | N |
| `tradition-deity` | 389 | 3 Association | `#4A5AA4` | 0.20 | 0.08 | 0.55 | N |
| `affects-tradition` | 364 | 1 Transmission | `#C9743A` | 0.34 | 0.10 | 0.85 | Y |
| `tradition-doc` | 292 | 3 Association | `#4A5AA4` | 0.20 | 0.08 | 0.55 | N |
| `syncretic-fusion` | 213 | 7 Fusion | `#C4783A` | 0.46 | 0.30 | 0.95 | N |
| `child-of` | 208 | 4 Kinship | `#C9A5D4` | 0.34 | 0.14 | 0.85 | Y (parent→child reversed) |
| `authored` | 201 | 5 Attestation | `#D4A55A` | 0.34 | 0.10 | 0.90 | Y (author→text) |
| `parent-of` | 161 | 4 Kinship | `#C9A5D4` | 0.34 | 0.14 | 0.85 | Y |
| `visual-cognate` | 152 | 7 Fusion | `#C4783A` | 0.34 | 0.20 | 0.85 | N (weakest claim, narrower) |
| `consort` | 145 | 4 Kinship | `#C9A5D4` | 0.34 | 0.14 | 0.85 | N (symmetric) |
| `primary-source` | 122 | 5 Attestation | `#D4A55A` | 0.34 | 0.10 | 0.90 | Y |
| `context` | 120 | 3 Association | `#4A5AA4` | 0.20 | 0.08 | 0.55 | N |
| `originated` | 111 | 1 Transmission | `#C9743A` | 0.46 | 0.10 | 0.95 | Y |
| `affects-document` | 111 | 1 Transmission | `#C9743A` | 0.34 | 0.10 | 0.85 | Y |
| `syncretic-scholarly-parallel` | 110 | 2 Parallel | `#5A9A8F` | 0.34 | 0.12 | 0.85 | N |
| `syncretic-ancient-identification` | 92 | 2 Parallel | `#5A9A8F` | 0.34 | 0.14 | 0.85 | N (deeper-line variant: `#7AAEA0`) |
| `ancestor-of` | 55 | 1 Transmission | `#C9743A` | 0.46 | 0.30 (HEADLINE) | 0.95 | Y |
| `commentary-on` | 54 | 5 Attestation | `#D4A55A` | 0.28 | 0.09 | 0.80 | Y |
| `attributed-author` | 49 | 5 Attestation | `#D4A55A` | 0.30 | 0.09 | 0.80 | Y (dashed in gradient if implementable) |
| `produces-document` | 49 | 1 Transmission | `#C9743A` | 0.34 | 0.10 | 0.85 | Y |
| `syncretic-structural-parallel` | 35 | 2 Parallel | `#5A9A8F` | 0.34 | 0.12 | 0.85 | N |
| `polemic-inversion` | 14 | 6 Polemic | `#A83E4A` | 0.46 | 0.30 (HEADLINE) | 0.95 | N |
| `appropriated-by` | 11 | 7 Fusion | `#C4783A` | 0.46 | 0.30 (HEADLINE) | 0.95 | Y (gradient: appropriator pulls from origin) |
| `structural-parallel` | 10 | 2 Parallel | `#5A9A8F` | 0.34 | 0.12 | 0.85 | N |
| `syncretic-parallel-motif` | 8 | 2 Parallel | `#5A9A8F` | 0.34 | 0.12 | 0.85 | N |
| `syncretic-instantiation` | 8 | 2 Parallel | `#5A9A8F` | 0.34 | 0.14 | 0.85 | N |
| `translation` | 8 | 5 Attestation | `#D4A55A` | 0.30 | 0.10 | 0.85 | Y |
| `direct-quote` | (low) | 5 Attestation | `#D4A55A` | 0.34 | 0.10 | 0.90 | Y |
| `redaction-of` | (low) | 1 Transmission | `#C9743A` | 0.34 | 0.10 | 0.85 | Y |
| `manuscript-transmission` | (low) | 1 Transmission | `#C9743A` | 0.46 | 0.12 | 0.95 | Y |
| `polemic-against` | (low) | 6 Polemic | `#A83E4A` | 0.46 | 0.25 | 0.95 | N |
| `shared-milieu` | (low) | 3 Association | `#4A5AA4` | 0.28 | 0.10 | 0.65 | N |
| `shared-tradition` | (low) | 3 Association | `#4A5AA4` | 0.20 | 0.08 | 0.55 | N |
| `contested-identification` | 1 | 2 Parallel (dashed) | `#5A9A8F` | 0.34 | 0.12 | 0.85 | N |
| `documents-affected` | (low) | 1 Transmission | `#C9743A` | 0.34 | 0.10 | 0.85 | Y |
| `preserved-by` | (low) | 5 Attestation | `#D4A55A` | 0.34 | 0.10 | 0.85 | Y |
| `exemplifies` | 1 | 2 Parallel | `#5A9A8F` | 0.28 | 0.10 | 0.80 | N |
| `component-of` | 1 | 3 Association | `#4A5AA4` | 0.20 | 0.08 | 0.55 | Y |
| `contains` | 6 | 3 Association | `#4A5AA4` | 0.20 | 0.08 | 0.55 | Y |
| `sibling-of` (rare) | — | 4 Kinship | `#C9A5D4` | 0.30 | 0.12 | 0.80 | N |

(All `monograph`, `person`, `deity`, `journal-article`, `encyclopedia`, etc. are **node types**, not edge types — they appear in the `data.js` grep because the export reuses the `"type":` key. Skip in edge-style logic.)

## 6. Per-view application

| View | What changes |
|---|---|
| Pantheon (production) | Replace `EDGE_STYLE` (`src/js/app.js:196-249`) with the 7-bucket table. The slate-blue idle is already correct (`.edge-line` `app.css:1060`). |
| Pantheon-v2 | Replace `EDGE_COLOR` (`src/js/views/pantheon-v2.js:257-286`) with the same 7-bucket table. `.ph2-edge` idle is already correct (`app.css:1772`). Wire `<defs>` gradient injection into the existing `.ph2-edge.hot` path. |
| Documents, Scripture, Transmission | Same table, no per-view overrides. Transmission view biases hot-rendering toward bucket 1 + 5 (those are its story). |
| Atlas (map) | Edges already use the slate-blue idle; apply the bucket palette only when an edge is hovered on the map. |
| Alchemy, Astrology | Symbol-heavy views; lean on buckets 7 (fusion) + 2 (parallel) for the cross-tradition story. |

## 7. Headline-loud exceptions (idle ≥ 0.25)

These four types stay visible at rest because they ARE the atlas's thesis:

- `ancestor-of` (terracotta, 0.30) — cross-symbol descent
- `polemic-inversion` (crimson, 0.30) — swastika→Nazi inversion case
- `syncretic-fusion` (amber, 0.30) — merger
- `appropriated-by` (amber, 0.30) — cross-tradition adoption

Everything else fades back into the slate-blue atmosphere until hovered.
