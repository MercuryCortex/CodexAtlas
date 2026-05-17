# Canonical Edge Color + Gradient Spec — Codex Atlas

**Date:** 2026-05-17 · **Scope:** Pantheon, Pantheon-v2, Transmission, Documents,
Scripture, Atlas (geo trails), Alchemy, Astrology · **Status:** spec only —
no code touched.

This document fixes the **palette**, **gradient policy**, and **opacity rule**
for every edge in the atlas. Thickness is owned by the dev panel and is
explicitly out of scope. Bucket membership and per-type tables already live
in `AUDIT/edge-logic-spec-2026-05-17.md`; this spec supersedes the *color*
columns of that document and lays down the rule John keeps asking for:

> "idle opacity should maintain the same when we highlight."

Idle never dims. Hover/lock only *adds brightness* to the hot subset.

---

## 1. The seven semantic buckets

The vault carries 50+ edge-type strings, but only seven *semantic shapes*
matter for visual encoding. The eye cannot reliably hold more than ~7 hues
against the `#0a0d14` background; piling on more dissolves into Pantheon-v2's
current "everything is greenish-pink" failure mode. Each bucket has one
canonical hex.

| # | Bucket            | What it encodes                                                                  | Symmetric? |
|---|-------------------|----------------------------------------------------------------------------------|-----------:|
| 1 | **Transmission**  | Historical causal flow: A *influences / produces / is ancestor of* B.            | NO (vector) |
| 2 | **Parallel**      | Structural resemblance without contact-claim: `parallel-motif`, `syncretic*`.    | YES         |
| 3 | **Association**   | Membership / theme / ambient context. The quiet majority (4k+ edges).            | YES         |
| 4 | **Kinship**       | Mythic family: `parent-of`, `child-of`, `consort`, `sibling-of`.                 | mixed       |
| 5 | **Attestation**   | A document attests / authors / translates an entity.                             | NO (vector) |
| 6 | **Polemic**       | Hostile reframing: `polemic-inversion`, `polemic-against`. Anti-relations.       | YES (mutual antagonism) |
| 7 | **Fusion**        | Cross-symbol merger / appropriation: `syncretic-fusion`, `appropriated-by`, `visual-cognate`. | mostly YES |

Why this split and not more: Transmission vs Parallel is the academically
load-bearing distinction (Smith/Ulansey/Burkert debates) — hue alone must
carry that. Polemic and Fusion are John's MASSIVE-wins-tier and earn their
own hues even at small edge counts because they're the *point* of the atlas.
Association exists as its own bucket only to *suppress* it visually — it is
the noise floor, not a feature.

---

## 2. Base palette

All seven hues sit in the warm/cool diagonal of the dark theme. None of them
collide with the deity family-color palette (which is stored per-node in
`family_color` and runs through saturated reds/blues/greens at ~70–90%
saturation; bucket colors are softer, ~50–65% saturation, so dots always
read brighter than the lines through them).

| # | Bucket        | Hex        | Color name              | Justification                                                                            |
|---|---------------|------------|-------------------------|------------------------------------------------------------------------------------------|
| 1 | Transmission  | `#C9743A`  | terracotta              | Warm earth — reads "manuscript / scroll / lineage." Same family as the gold tier-1 var but more saturated, so the eye separates "this is transmitted" from "this is sourced." |
| 2 | Parallel      | `#5A9A8F`  | desaturated teal        | Cool, neutral, non-claim. Teal is the academic-distance color — it says "structural similarity, no contact alleged." |
| 3 | Association   | `#4A5AA4`  | slate-indigo            | Sits one step warmer than the `#788CB6` global idle slate, so an Association edge with its hot color showing is still recognizably "ambient" — not promoted to a story. |
| 4 | Kinship       | `#C9A5D4`  | lilac                   | Distinctive against the warm/cool axis; reads "biological / personal" without being pink. Avoids collision with both the syncretic gold (1, 7) and the polemic crimson (6). |
| 5 | Attestation   | `#D4A55A`  | gold                    | Gold is the long-running "this is a sourced citation" color in the vault (`app.css` `--gold` family). The eye already trains on it for "textual evidence." |
| 6 | Polemic       | `#A83E4A`  | crimson                 | The only red in the palette — reserved exclusively for hostility / inversion. Reading a crimson line in the graph should unambiguously mean "anti-relation." |
| 7 | Fusion        | `#C4783A`  | amber                   | Adjacent to terracotta (bucket 1) on the wheel but warmer and slightly more orange — encodes "merger / fold-in." A viewer who knows the palette can read `Transmission → Fusion` as a *gradient of intimacy*: influence ⟶ absorption. |

### Collision check against deity family palette

The deity family palette (`family_color` per node) uses (typical examples
from the vault): Mesopotamian `#c9a06e`, Egyptian `#d4b96a`, Greek
`#b8843a`, Roman `#a85e44`, Canaanite `#b08840`, Indic `#c97a3a`, Christian
`#c8a45a`, Norse `#7a8b9d`, Celtic `#5a8a6e`. These are all dot fills.

- Transmission `#C9743A` ≈ near Greek `#b8843a`. Distinguished because the
  Greek dot is *filled* and saturated; the edge is *stroked* and (idle)
  multiplied by 0.10 opacity — they never look alike in context.
- Fusion `#C4783A` ≈ near Indic `#c97a3a`. Same defense — dots and lines
  occupy different visual channels.
- Attestation `#D4A55A` ≈ near Egyptian `#d4b96a`. Same defense.
- All other buckets (Parallel teal, Association indigo, Kinship lilac,
  Polemic crimson) are in unused regions of the palette and cannot
  collide.

The defense holds as long as **dots stay filled and edges stay stroked**.
That is a contract on the renderers, not on the palette. Don't change it.

---

## 3. Gradient policy — when and why

A gradient earns its place only when the edge encodes a **temporal or
causal direction**. For symmetric relations, a gradient is misinformation —
it implies a source and a sink where the data says neither exists.

### 3.1 Use a gradient (bright origin → dim terminus)

| Bucket          | Why gradient                                                                       |
|-----------------|------------------------------------------------------------------------------------|
| 1 Transmission  | A *gives rise to* B. The stop-0 = origin, stop-1 = recipient.                      |
| 5 Attestation   | A *attests / authors / translates* B. Stop-0 = document, stop-1 = entity (or author → text). |
| 4 Kinship (descent only) | `parent-of` / `child-of` / `ancestor-of` (when the edge is in kinship via this aliasing) carry generational direction. Stop-0 = parent. |
| 7 Fusion (`appropriated-by` only) | The appropriator pulls *from* the origin — gradient encodes the theft direction. The rest of Fusion (`syncretic-fusion`, `visual-cognate`) is symmetric and stays solid. |

### 3.2 Do NOT use a gradient

| Bucket           | Why solid                                                                            |
|------------------|--------------------------------------------------------------------------------------|
| 2 Parallel       | Structural resemblance is symmetric by definition — `parallel-motif` between Mithra and Christ doesn't favor either pole. |
| 3 Association    | Membership / theme / context have no direction.                                      |
| 4 Kinship (`consort`, `sibling-of`) | Lateral kin are symmetric. Only descent gets the gradient. |
| 6 Polemic        | Inversion is a *mutual* antagonism. The crimson is uniform — both ends are equally hostile. |
| 7 Fusion (`syncretic-fusion`, `visual-cognate`) | Fusion is symmetric — both symbols carry the merged identity. Only `appropriated-by` (a directional theft) earns the gradient. |

### 3.3 Gradient specification

For every directional edge, paint a `<linearGradient>` in `<defs>` keyed to
the bezier endpoints (`userSpaceOnUse`, not bounding-box, so the gradient
follows the actual segment regardless of curvature):

```xml
<linearGradient id="eg-{id}" gradientUnits="userSpaceOnUse"
                x1="{srcX}" y1="{srcY}" x2="{tgtX}" y2="{tgtY}">
  <stop offset="0%"  stop-color="{bucket-hex}" stop-opacity="0.95"/>
  <stop offset="100%" stop-color="{bucket-hex}" stop-opacity="0.35"/>
</linearGradient>
```

- Stop-0 carries the bucket hex at **0.95** opacity (bright origin).
- Stop-1 carries the same hex at **0.35** opacity (dim terminus).
- No mid-stops. The single-hue fade is the *only* directional signal.
- For edge types in `REVERSE_DIRECTION` (`influenced-by`, `attested-in`,
  `child-of`, `documents-affected`, `preserved-by`), swap x1/y1 with x2/y2
  so the bright stop sits on the *semantic* origin, not the data-edge
  source.

### 3.4 Arrowheads — rejected

Tested mentally against a 1900-node graph: arrowheads pile up at deity
hubs, become visually dominant, and conflict with the dot-as-deity reading.
The gradient fade-out is sufficient signal at the densities we render.
**Do not add arrowheads.** Re-litigate only if the gradient is shown to be
illegible at zoom-out (audit the actual render first; don't pre-emptively
add chrome).

---

## 4. Idle vs hot vs locked — the opacity rule

> **The pet peeve:** when the user hovers a deity, idle edges currently dim
> to ~0.02. Visually this *feels* like the rest of the graph is being
> punished for the user's curiosity. The rule below removes the punishment.

### 4.1 The rule, stated plainly

1. **Idle opacity is a property of the bucket, not the interaction.**
   An Association edge idles at 0.08 whether anyone is hovering or not.
   Hovering never changes it.
2. **Hot opacity is added to incident edges only.** The hot subset jumps to
   its bucket's hot value (see table). Non-incident edges stay exactly where
   they were.
3. **There is no `.dim` class for non-incident edges.** Delete it. The
   illusion of "focus" comes from the hot edges getting brighter, not from
   the rest getting darker.
4. **Lock (family-filter, deity-pin) follows the same rule.** Locked-in
   edges jump to hot; everything else stays at idle. Locked-out edges are
   NOT dimmed below their bucket idle.

### 4.2 Why this is correct

The idle layer is *information*. The user paid for the atlas to *see* the
9000+ edges as atmosphere — that atmosphere is the data. Dimming it on
hover destroys the very thing the user is investigating ("how does this
deity sit inside the field?"). The hot subset is enough contrast on its
own: 0.08 ⟶ 0.90 is an 11× brightness jump, more than the eye needs to
isolate the highlighted subset.

The two **headline-loud** buckets (Polemic, Fusion + `ancestor-of` from
Transmission) already idle at 0.25–0.30 — those are visible at rest and
become incandescent on hover. They do not get dimmer when someone hovers
elsewhere either.

### 4.3 Per-bucket opacities

| # | Bucket        | Idle opacity | Hot opacity | Headline at idle? |
|---|---------------|-------------:|------------:|-------------------|
| 1 | Transmission  |        0.10  |       0.95  | `ancestor-of` only (0.30) |
| 2 | Parallel      |        0.12  |       0.85  | no                |
| 3 | Association   |        0.08  |       0.55  | no                |
| 4 | Kinship       |        0.14  |       0.85  | no                |
| 5 | Attestation   |        0.10  |       0.90  | no                |
| 6 | Polemic       |        0.25  |       0.95  | **yes** (entire bucket) |
| 7 | Fusion        |        0.30  |       0.95  | **yes** (entire bucket) |

The numbers are the *bucket multiplier*. The dev panel's
`--ph2-edge-opacity-mult` (default 0.20) multiplies all idle values
globally — that knob stays user-controlled and is not part of this spec.

### 4.4 The single idle stroke color (non-headline)

All non-headline edges share **one** stroke color at idle:

```
stroke: rgba(80, 95, 130, 0.85)   /* slate, ≈ #505F82 */
```

The bucket hex only paints on `.hot` (and on `.ph2-edge-headline` for
buckets 6, 7, and `ancestor-of`). This is the deliberate decision that
keeps idle reading as **atmosphere**, not as **fifty colors at once**. The
bucket palette comes alive only when the user reaches for it.

### 4.5 Worked example

Hovering Zeus in Pantheon-v2:

| Edge                                   | Bucket          | State before | State after            |
|----------------------------------------|-----------------|--------------|------------------------|
| Zeus — Hera (`consort`)                | 4 Kinship       | idle 0.14    | **hot 0.85, lilac**    |
| Zeus — Jupiter (`syncretic`)           | 2 Parallel      | idle 0.12    | **hot 0.85, teal**     |
| Zeus — Athena (`parent-of`)            | 4 Kinship       | idle 0.14    | **hot 0.85, lilac, gradient parent→child** |
| Brahma — Vishnu (any, not incident)    | any             | idle X       | **idle X (unchanged)** |
| Bible — Marduk (`attests`, not incident)| 5 Attestation   | idle 0.10    | **idle 0.10 (unchanged)** |

The non-incident rows are the user's complaint; the rule fixes them.

---

## 5. Per-view applicability

| View                  | Buckets in play (descending importance)                                | Notes                                                                                                       |
|-----------------------|------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| **Pantheon** (prod)   | 4 Kinship, 2 Parallel, 1 Transmission, 7 Fusion, 6 Polemic             | Deity-deity slice. Attestation absent — no documents in this view. Headline buckets carry the visual story. |
| **Pantheon-v2**       | 4 Kinship, 2 Parallel, 1 Transmission, 7 Fusion, 6 Polemic, 3 Association | Same as Pantheon but with the Association layer surfaced as atmosphere. Gradient pre-build wired here.       |
| **Transmission view** | 1 Transmission, 5 Attestation, 7 Fusion, 6 Polemic                     | The view's whole reason for existing. Bias hot rendering toward buckets 1 and 5 — they carry the story.     |
| **Documents**         | 5 Attestation, 1 Transmission, 3 Association                           | Text→entity is the dominant link type. Gradient (doc → entity) is critical here.                            |
| **Scripture**         | 5 Attestation, 1 Transmission, 2 Parallel, 6 Polemic                   | Cross-corpus polemic (e.g. Mishnah vs Christian writings) gets the crimson treatment.                       |
| **Atlas (geo)**       | 1 Transmission, 5 Attestation, 7 Fusion                                | Arc-trails over the map. Gradient still applies — the bright stop sits on the geographic origin.            |
| **Alchemy**           | 7 Fusion, 2 Parallel, 1 Transmission                                   | Symbol-merger heavy. Fusion's amber is the dominant color of this view.                                     |
| **Astrology**         | 2 Parallel, 1 Transmission, 3 Association                              | Decanic / planetary correspondences — mostly Parallel. No Polemic.                                          |

### 5.1 Atlas trail-arcs — special note

The map view has its own opacity scaling (PMTiles base is darker than the
graph background). Multiply bucket idle opacities by **1.4** in the Atlas
view only, so a 0.10 transmission edge reads at 0.14 against the basemap.
Hot opacities stay unchanged — they're already at 0.85–0.95 which is
plenty.

---

## 6. Decision summary (canonical table)

One row per bucket. Implementation reads from here.

| # | Bucket        | Hex        | Gradient? | Idle opacity | Hot opacity | Used in views                                                       |
|---|---------------|------------|-----------|-------------:|------------:|---------------------------------------------------------------------|
| 1 | Transmission  | `#C9743A`  | YES (src→tgt) | 0.10 (0.30 for `ancestor-of`) | 0.95 | Pantheon, Pantheon-v2, Transmission, Documents, Atlas, Alchemy |
| 2 | Parallel      | `#5A9A8F`  | no        |         0.12 |        0.85 | Pantheon, Pantheon-v2, Scripture, Alchemy, Astrology              |
| 3 | Association   | `#4A5AA4`  | no        |         0.08 |        0.55 | Pantheon-v2, Documents, Astrology                                  |
| 4 | Kinship       | `#C9A5D4`  | descent only (parent→child) | 0.14 | 0.85 | Pantheon, Pantheon-v2                                  |
| 5 | Attestation   | `#D4A55A`  | YES (doc→entity, or author→text) | 0.10 | 0.90 | Transmission, Documents, Scripture, Atlas |
| 6 | Polemic       | `#A83E4A`  | no        |         0.25 (headline) | 0.95 | Pantheon, Pantheon-v2, Scripture                          |
| 7 | Fusion        | `#C4783A`  | `appropriated-by` only | 0.30 (headline) | 0.95 | Pantheon, Pantheon-v2, Alchemy, Atlas      |

---

## 7. Out of scope (explicitly)

- **Edge thickness** — owned by the dev panel
  (`--ph2-edge-width-mult`, `--ph2-edge-hot-width`). Bucket widths in
  `edge-logic-spec-2026-05-17.md` are the *defaults* the dev panel
  multiplies; this color spec does not touch them.
- **Edge curvature** — owned by `S.edgeCurvature` (default 0.35).
- **Edge filtering by type** (the proposed dev-panel type-toggles) — UI
  work, not a color decision.
- **The `monograph` / `journal-article` / `encyclopedia` strings** that
  appear in the type column of grep results: those are *node* types
  reused as keys in the export; skip them in any edge-style table.

---

**End of spec.** Implementation reads `Decision summary` (section 6) +
gradient stop values (section 3.3) + idle/hot rule (section 4.1). The
per-edge-type → bucket mapping is the table in
`AUDIT/edge-logic-spec-2026-05-17.md` section 5; this document does not
duplicate it.
