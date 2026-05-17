# Ontology-Master Report — Universal Edge-Bucket Routing

**Date:** 2026-05-17 · **From:** ontology-master pass (read-only audit) · **To:** the next UX-slot holder · **Status:** proposal awaiting UX OK before implementation. Do not start until you've read this end-to-end and acknowledged in `ACTIVE-UX.md` Scope.

---

## TL;DR

The Pantheon V2 7-bucket palette is the right model — but its **type→bucket routing in `src/js/views/pantheon-v2.js` contradicts ONTOLOGY.md §3** on ~2,085 edges, and the production app.js view runs an **entirely separate per-type color map** (`EDGE_STYLE`) that knows nothing about buckets. One universal module, one routing table, both views consume it.

This is Lane B work. Hand-off from ontology-master after the audit John asked for.

---

## 1. The two ontological findings driving this patch

### 1.1 `syncretic` family is mis-routed to Parallel (ONTOLOGY says Fusion)

[ONTOLOGY.md §3](../00_meta/ONTOLOGY.md) YAML-field → bucket table is unambiguous:

| YAML field | Default edge type | Bucket |
|---|---|---|
| `equivalents[]` | `syncretic` | **Fusion** |
| `syncretic-edges[]` with `type: ancient-identification` | `syncretic-ancient-identification` | **Fusion** |
| `syncretic-edges[]` with `type: scholarly-parallel` | `syncretic-scholarly-parallel` | **Fusion** |
| `syncretic-edges[]` with `type: folk-syncretism` | `syncretic-folk-syncretism` | **Fusion** |

The semantic definition in §3 is also unambiguous: Fusion = "Genuine syncretic merger — two entities collapse into one or are *explicitly identified*."

Current code in `pantheon-v2.js:460-472` routes all four to **Parallel**:

| Edge type | Live count | Code routes to | ONTOLOGY says |
|---|---:|---|---|
| `syncretic` | **935** | parallel | fusion |
| `syncretic-scholarly-parallel` | **792** | parallel | fusion |
| `syncretic-ancient-identification` | **336** | parallel | fusion |
| `syncretic-folk-syncretism` | 22 | parallel | fusion |

**~2,085 edges paint teal that ONTOLOGY says should paint amber.** The Inanna ↔ Ishtar ↔ Astarte ↔ Aphrodite ↔ Isis-Hellenistic chain — the canonical Fusion example in ONTOLOGY §4D — currently reads as Parallel.

The cause is a contradiction between two reference docs: `AUDIT/edge-color-spec-2026-05-17.md` §1 narrowed Fusion to `{syncretic-fusion, appropriated-by, visual-cognate}`; ONTOLOGY.md kept the broader semantic definition. Per `LANES.md §6`, ONTOLOGY is master-tier and wins. The code currently follows the edge-color-spec.

### 1.2 Unmapped types fall through to Association

Live edge types in the built graph that aren't in `EDGE_BUCKET` and default to `association`:

| Edge type | Live count | Should route to |
|---|---:|---|
| `parallel` | 89 | parallel |
| `heir-of` | 60 | transmission |
| `syncretic-cross-tradition-parallel` | 39 | parallel (or fusion if §1.1 broadens) |
| `syncretic-mythological-partner` | 23 | kinship |
| `convergence` | 22 | parallel |
| `descended-from` | 18 | transmission |
| `syncretic-applies-to` | 16 | association (intentional) |
| `syncretic-direct-influence` | 15 | transmission |
| `syncretic-part-of` | 13 | association |
| `syncretic-shared-tradition` | 13 | association |
| `sibling` | 12 | kinship (`sibling-of` is mapped; the bare form isn't) |
| `syncretic-child-of` | 10 | kinship |
| `member-of` | 10 | association |

Most consequential: `heir-of` (60) and `descended-from` (18) — these are the Aristotle → al-Farabi → Avicenna → Averroes → Aquinas transmission chain just shipped by `mathematics-1`. They're rendering as Association noise-floor blue.

---

## 2. The universal-map problem (John's "universal" comment)

Two color systems are in flight, neither knows about the other:

| File | What it has | Conformance to ONTOLOGY §3 |
|---|---|---|
| `src/js/views/pantheon-v2.js:428-557` | 7-bucket `BUCKETS` + `EDGE_BUCKET` routing + `edgeStyleFor()` | Partial — has the right buckets, wrong routing for §1.1/§1.2 |
| `src/js/app.js:196-241` | Per-type `EDGE_STYLE` with hand-picked hex per edge type | **None** — predates the bucket system; no semantic grouping |

The production Pantheon, Documents view, Transmission view, and all D3 views consume `EDGE_STYLE`. The Pantheon V2 prototype consumes `BUCKETS`. There is no single source of truth.

The fix is to extract one universal module that both views import.

---

## 3. Proposed plan (UX agent owns the implementation)

### Step 1 — Extract a universal bucket module

New file: `src/js/edge-buckets.js` (or `src/js/kit/edge-buckets.js` if you want to seed Phase 3 kit-extraction at the same time — the rollout queue in `ACTIVE-UX.md` puts kit-extraction as priority 1).

Exports:

```js
export const BUCKETS = {
  transmission: { hex: '#C9743A', idle: 0.10, hot: 0.95, headline: false, directional: true  },
  parallel:     { hex: '#5A9A8F', idle: 0.12, hot: 0.85, headline: false, directional: false },
  association:  { hex: '#4A5AA4', idle: 0.08, hot: 0.55, headline: false, directional: false },
  kinship:      { hex: '#C9A5D4', idle: 0.14, hot: 0.85, headline: false, directional: false },
  attestation:  { hex: '#D4A55A', idle: 0.10, hot: 0.90, headline: false, directional: true  },
  polemic:      { hex: '#A83E4A', idle: 0.25, hot: 0.95, headline: true,  directional: false },
  fusion:       { hex: '#C4783A', idle: 0.30, hot: 0.95, headline: true,  directional: false },
};
export const EDGE_BUCKET = { /* per §3.2 + §3.3 below */ };
export const REVERSE_DIRECTION = new Set([...]);
export const DIRECTIONAL_TYPES = new Set([...]);
export const HEADLINE_TYPES    = new Set(['ancestor-of', 'syncretic-ancestor-of']);
export function edgeStyleFor(type) { ... }
```

Source of truth for `BUCKETS` is `AUDIT/edge-color-spec-2026-05-17.md` §6 (hex + opacity numbers as authored — the comment at `pantheon-v2.js:425-427` admits the current 0.15/0.18 headline-idle values are below spec; restore the 0.25/0.30 in this patch).

### Step 2 — Re-route the `syncretic` family per ONTOLOGY

Move from `parallel` → `fusion`:

- `syncretic` (935)
- `syncretic-ancient-identification` (336)
- `syncretic-scholarly-parallel` (792)
- `syncretic-folk-syncretism` (22)
- `syncretic-identification`
- `syncretic-syncretic-identification` (28)
- `syncretic-continuous-development`
- `syncretic-aspect-of`
- `syncretic-instantiation`

Keep in `parallel`:

- `syncretic-structural-parallel` (171)
- `syncretic-parallel-form` (26)
- `syncretic-parallel-motif` (15)
- `syncretic-cross-tradition-parallel` (39)
- `syncretic-cross-tradition-archetype` (17)
- `syncretic-functional-parallel`
- `syncretic-parallel`

### Step 3 — Map the unmapped types (see §1.2 table above)

### Step 4 — Reclassify `syncretic-lineage-claim` from polemic → transmission

A lineage claim is an assertion of ancestry, not a hostile reframing. Polemic should be reserved for `polemic-against` / `polemic-inversion` (genuinely antagonistic reframings).

### Step 5 — Adopt the new module in both consumers

- **`pantheon-v2.js`**: replace inline `BUCKETS` + `EDGE_BUCKET` (lines 428-557) with imports from the new module. Delete the dormant legacy `EDGE_STYLE` block (lines 578-639) — it's labeled "Legacy reference left for compatibility" but contains duplicate keys and stale per-type opacities; resurrection risk is real.
- **`app.js`**: replace `EDGE_STYLE` (line 196) and `edgeStyle(t)` (line 250) with `edgeStyleFor(t)` returning `{ c, w, op, hotOp, bucket, directional, headline }`. Six call sites to update: lines 250, 1262, 1797, 4470, 6986, 8252. The per-type widths from the old map are mostly redundant — keep per-bucket defaults and only override at the few `xsym`/`xfamily` sites that already exist.

### Step 6 — Verify

- `python3 build_data.py` → 0 errors.
- `localhost:8742` Pantheon — before/after screenshots for these specific cases:
  - Inanna ↔ Ishtar (`syncretic`): teal → amber
  - Inanna ↔ Aphrodite (`syncretic`): teal → amber
  - Aristotle → al-Farabi → Avicenna → Averroes → Aquinas (`heir-of` chain): blue → terracotta gradient
  - Hera consort Zeus (`consort`): unchanged lilac
  - Any `polemic-inversion`: unchanged crimson
- Check Documents view, Transmission view, Atlas trail-arcs — confirm no regression (they should now consume the same bucket palette and read brighter / more consistent).

---

## 4. Out of scope this patch (ontology-master will route separately)

1. **Medicine mode filter** — `pantheon-v2.js:762` scans `tags[]` instead of `n.type === 'medicine'`. One-line cleanup; bundle if convenient, otherwise split.
2. **Themes / Traditions Pantheon modes** — `MODE_OPTIONS` ([pantheon-v2.js:2081](../src/js/views/pantheon-v2.js)) is missing lenses 6 and 7. Themes especially would surface cross-tradition parallels that the project exists to hunt. Design call, not a fix.
3. **`REVERSE_DIRECTION` extras** (`influenced`, `mentioned-in`, `syncretic-attested-in`) — defensible additions to the spec's authoritative set, but undocumented; fold into the edge-color-spec next revision.

---

## 5. Coordination

- This is Lane B. Claim the slot in `ACTIVE-UX.md` before starting.
- If you'd rather not bundle steps 1-5 into one batch, the natural split is: **Phase A** = extract `edge-buckets.js` + adopt in `pantheon-v2.js` (steps 1-4 + half of 5); **Phase B** = migrate app.js (other half of step 5). Phase A is the visible MASSIVE-WIN-color fix; Phase B is the universal cleanup.
- The ontology master (this report) has no further opinions on the implementation. The data routing is the deliverable; the visual outcome is yours to tune.

— ontology-master, 2026-05-17
