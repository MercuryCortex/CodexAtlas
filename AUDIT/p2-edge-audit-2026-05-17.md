# Pantheon-v2 Edge Stroke Styling — Exhaustive Audit (2026-05-17)

**Scope:** Every CSS rule, JS attribute, inline style, and color value affecting `.ph2-edge` rendering.

---

## 1. Color Tables (Data-Driven)

### 1.1 EDGE_BUCKETS Map

**File:** `src/js/views/pantheon-v2.js:274–282`

Each bucket defines the visual identity for a family of edge types.

| Bucket | Hex | Width | Idle Op | Hot Op | Directional | Headline |
|--------|-----|-------|---------|--------|-------------|----------|
| transmission | #C9743A | 0.46 | 0.10 | 0.95 | true | false |
| parallel | #5A9A8F | 0.34 | 0.12 | 0.85 | false | false |
| association | #4A5AA4 | 0.20 | 0.08 | 0.55 | false | false |
| kinship | #C9A5D4 | 0.34 | 0.14 | 0.85 | true | false |
| attestation | #D4A55A | 0.34 | 0.10 | 0.90 | true | false |
| polemic | #A83E4A | 0.46 | 0.25 | 0.95 | false | **true** |
| fusion | #C4783A | 0.46 | 0.30 | 0.95 | false | **true** |

**Notes:**
- `headline: true` → edge idles in bucket color (not slate-blue); idleOp forced to 0.30.
- `directional: true` → gradient pre-built; on hover, swaps to directional gradient.
- DEFAULT_EDGE_COLOR (`pantheon-v2.js:360`) = `#4A5AA4` (association hex).

### 1.2 EDGE_TYPE_BUCKET Mapping

**File:** `src/js/views/pantheon-v2.js:284–350`

Maps 50+ edge types to buckets. Suffix `:hl` marks headline overrides within a bucket.

**Transmission bucket (11 types):**
- `influenced-by`, `influences`, `influenced`, `originated`, `affects-tradition`, `affects-document`, `documents-affected`, `produces-document`, `manuscript-transmission`, `redaction-of` → `transmission`
- `ancestor-of` → `transmission:hl` (headline override)

**Parallel bucket (11 types):**
- `parallel-motif`, `parallel-form`, `syncretic`, `syncretized-with`, `syncretic-scholarly-parallel`, `syncretic-ancient-identification`, `syncretic-structural-parallel`, `syncretic-parallel-motif`, `syncretic-instantiation`, `structural-parallel`, `contested-identification`, `exemplifies` → `parallel`

**Association bucket (13 types):**
- `has-theme`, `tradition-deity`, `tradition-doc`, `tradition-person`, `context`, `shared-milieu`, `shared-tradition`, `symbol-attests-in`, `symbol-iconography-of`, `symbol-in-tradition`, `participated-in`, `component-of`, `contains` → `association`

**Kinship bucket (4 types):**
- `child-of`, `parent-of`, `consort`, `sibling-of` → `kinship`

**Attestation bucket (10 types):**
- `attests`, `attested-in`, `mentioned-in`, `key-figure`, `authored`, `attributed-author`, `primary-source`, `primary-translation`, `critical-edition`, `translation`, `commentary-on`, `direct-quote`, `preserved-by` → `attestation`

**Polemic bucket (2 types, ALL headline):**
- `polemic-inversion`, `polemic-against` → `polemic`

**Fusion bucket (3 types, ALL headline):**
- `syncretic-fusion`, `appropriated-by`, `visual-cognate` → `fusion`

### 1.3 edgeStyleFor() Function

**File:** `src/js/views/pantheon-v2.js:351–358`

```javascript
function edgeStyleFor(type) {
  const raw = EDGE_TYPE_BUCKET[type] || 'association';
  const hl  = raw.endsWith(':hl');
  const key = hl ? raw.slice(0, -3) : raw;
  const b   = EDGE_BUCKETS[key] || EDGE_BUCKETS.association;
  if (hl) return { ...b, headline: true, idleOp: 0.30 };
  return b;
}
```

**Behavior:**
- Unknown types default to `association` bucket.
- If `:hl` suffix present, strips it, looks up bucket, spreads properties, and forces `headline: true` + `idleOp: 0.30`.
- Returns object: `{ hex, width, idleOp, hotOp, directional, headline }`.

### 1.4 REVERSE_DIRECTION Set

**File:** `src/js/views/pantheon-v2.js:700–702`

```javascript
const REVERSE_DIRECTION = new Set([
  'influenced-by', 'attested-in', 'child-of', 'documents-affected', 'preserved-by'
]);
```

**Purpose:** For directional edges, reverses gradient endpoint order so the bright stop (0.95 opacity) sits on the semantic origin, not the data source/target.

---

## 2. CSS Rules Targeting .ph2-edge

**File:** `src/styles/app.css:1761–1793`

### 2.1 Base `.ph2-edge` Rule

**Lines:** 1771–1782

```css
.ph2-edge {
  fill: none;
  /* Darker slate than production's `rgba(120,140,182,0.72)` — when 1200+
     edges overlap through the center, even at 0.04 per-edge opacity the
     cumulative wash reads as colored. A darker base means the cumulative
     stack stays dark instead of brightening. */
  stroke: rgba(80, 95, 130, 0.85);
  stroke-width: calc(var(--edge-w, 0.20) * var(--ph2-edge-width-mult, 1));
  stroke-opacity: calc(var(--edge-idle-op, 0.08) * var(--ph2-edge-opacity-mult, 1));
  vector-effect: non-scaling-stroke;
  transition: stroke-opacity 180ms ease, stroke-width 180ms ease, stroke 180ms ease;
}
```

**Properties:**
| Property | Value | Notes |
|----------|-------|-------|
| `fill` | `none` | SVG path interior painted nothing. |
| `stroke` | `rgba(80, 95, 130, 0.85)` | Slate-blue base for idle non-headline edges. Darker than production (120, 140, 182) to prevent cumulative brightening at 1200+ edges. |
| `stroke-width` | `calc(var(--edge-w, 0.20) * var(--ph2-edge-width-mult, 1))` | Idle width = bucket width (0.20/0.34/0.46) × dev-panel opacity mult (default 0.60). |
| `stroke-opacity` | `calc(var(--edge-idle-op, 0.08) * var(--ph2-edge-opacity-mult, 1))` | Idle opacity = bucket idleOp (0.08–0.30) × dev-panel opacity mult (default 0.20). Defaults to 0.08 if CSS var missing. |
| `vector-effect` | `non-scaling-stroke` | Preserves stroke width in screen space (does not scale with zoom). |
| `transition` | `stroke-opacity 180ms ease, stroke-width 180ms ease, stroke 180ms ease` | Animates state changes over 180ms. |

### 2.2 Inline CSS Custom Properties Set by JS

**File:** `src/js/views/pantheon-v2.js:770–773`

Each `.ph2-edge` element receives four inline `style.setProperty()` calls:

```javascript
path.style.setProperty('--edge-type-color', st.hex);
path.style.setProperty('--edge-w',          st.width);
path.style.setProperty('--edge-idle-op',    st.idleOp);
path.style.setProperty('--edge-hot-op',     st.hotOp);
```

| Var | Values | Used In | Notes |
|-----|--------|---------|-------|
| `--edge-type-color` | Bucket hex (#C9743A, #5A9A8F, etc.) | `.ph2-edge.hot` (stroke), `.ph2-edge.ph2-edge-headline` (stroke) | Defined per-edge by JS from bucket. |
| `--edge-w` | 0.20, 0.34, 0.46 | `stroke-width` calc | Idle stroke width per bucket; multiplied by `--ph2-edge-width-mult`. |
| `--edge-idle-op` | 0.08–0.30 | `stroke-opacity` calc | Idle opacity per bucket or headline override; multiplied by `--ph2-edge-opacity-mult`. |
| `--edge-hot-op` | 0.55–0.95 | `.ph2-edge.hot` stroke-opacity | Hot state opacity per bucket. |

### 2.3 `.ph2-edge.ph2-edge-headline` Rule

**Lines:** 1785–1787

```css
.ph2-edge.ph2-edge-headline {
  stroke: var(--edge-type-color, rgba(120, 140, 182, 0.72));
}
```

**Purpose:** Headline edges (polemic, fusion, ancestor-of) idle in bucket color instead of slate-blue.

| Property | Value | Notes |
|----------|-------|-------|
| `stroke` | `var(--edge-type-color, rgba(120, 140, 182, 0.72))` | Uses `--edge-type-color` (bucket hex) set inline by JS. Fallback is production's slate color. |

**Class Addition:** JS line 768:
```javascript
path.setAttribute('class', 'ph2-edge' + (st.headline ? ' ph2-edge-headline' : ''));
```

### 2.4 `.ph2-edge.dim` Rule

**Line:** 1788

```css
.ph2-edge.dim { stroke-opacity: 0.02 !important; }
```

**Applied When:**
- Non-incident edges during node hover (`applyEdgeHoverState()`, line 853).
- Non-matching edges during family filter lock (`applyHullFilterState()`, line 875).

### 2.5 `.ph2-edge.hot` Rule

**Lines:** 1789–1793

```css
.ph2-edge.hot {
  stroke: var(--edge-type-color, rgba(212, 165, 90, 0.9)) !important;
  stroke-opacity: var(--edge-hot-op, 0.9) !important;
  stroke-width: var(--ph2-edge-hot-width, 1.6) !important;
}
```

| Property | Value | Notes |
|----------|-------|-------|
| `stroke` | `var(--edge-type-color, ...)` | Uses bucket color (inline CSS var). Fallback gold suggests production CSS. |
| `stroke-opacity` | `var(--edge-hot-op, 0.9)` | Hot opacity per bucket (0.55–0.95). Defaults to 0.9. |
| `stroke-width` | `var(--ph2-edge-hot-width, 1.6)` | Fixed hot width (dev-panel tunable, default 1.6px). `!important` overrides calc-width. |

**Applied When:**
- Incident edges during node hover (`applyEdgeHoverState()`, line 854).
- Matching edges during family filter lock (`applyHullFilterState()`, line 876).

**Special:** On hover, if edge is directional (`dataset.gradId`), inline `stroke` is set to `url(#gradientId)` to activate the gradient (line 859).

### 2.6 Dev-Panel-Controlled CSS Variables

**File:** `src/js/dev-panel.js:36–39` (defaults)

These are applied to `:root` by `applyCssVars()` (dev-panel.js:124–136).

| Var | Default | Range | Target | Notes |
|-----|---------|-------|--------|-------|
| `--ph2-edge-opacity-mult` | 0.20 | 0–3 | Multiplier in `.ph2-edge` stroke-opacity calc | Controls overall idle opacity. |
| `--ph2-edge-width-mult` | 0.60 | 0.4–3 | Multiplier in `.ph2-edge` stroke-width calc | Controls overall idle width. |
| `--ph2-edge-hot-width` | 1.6 | 0.6–3 | Fixed width in `.ph2-edge.hot` | Hot state width in px. |

---

## 3. JS Edge-Build Code

### 3.1 Edge Creation Loop

**File:** `src/js/views/pantheon-v2.js:751–808`

```javascript
edges.forEach(e => {
  // ... compute bezier path ...
  const st = edgeStyleFor(e.type);
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('class', 'ph2-edge' + (st.headline ? ' ph2-edge-headline' : ''));
  path.setAttribute('d', `M ${sp.x},${sp.y} Q ${cxp},${cyp} ${tp.x},${tp.y}`);
  path.style.setProperty('--edge-type-color', st.hex);
  path.style.setProperty('--edge-w',          st.width);
  path.style.setProperty('--edge-idle-op',    st.idleOp);
  path.style.setProperty('--edge-hot-op',     st.hotOp);
  if (st.directional) path.dataset.directional = '1';
  path.dataset.source = e.source;
  path.dataset.target = e.target;
  path.dataset.type   = e.type || '';
  path.dataset.bucket = EDGE_TYPE_BUCKET[e.type] ? EDGE_TYPE_BUCKET[e.type].replace(':hl','') : 'association';
  // ... directional gradient (phase H) ...
  edgesG.appendChild(path);
  edgeEls.push({ el: path, s: e.source, t: e.target, st });
});
```

**Class Assignments on Creation:**
- Always: `ph2-edge`
- If `st.headline` (polemic, fusion, ancestor-of): add `ph2-edge-headline`

**Inline CSS Variables Set:**
1. `--edge-type-color` = `st.hex` (bucket hex from EDGE_BUCKETS)
2. `--edge-w` = `st.width` (0.20 / 0.34 / 0.46)
3. `--edge-idle-op` = `st.idleOp` (0.08–0.30)
4. `--edge-hot-op` = `st.hotOp` (0.55–0.95)

**Dataset Properties Set:**
- `data-directional` = '1' (if `st.directional`)
- `data-source` = source node id
- `data-target` = target node id
- `data-type` = edge type string (e.g., 'syncretic')
- `data-bucket` = bucket name (polemic → 'polemic', no `:hl` suffix)
- `data-gradId` = gradient id (if directional, set in phase H)

**Inline Stroke / Fill:**
- `fill` is NOT set inline; CSS rule `fill: none` applies.
- `stroke` is NOT set inline in idle state; CSS `.ph2-edge` stroke applies.
- `stroke` IS set inline on hot + directional: `style.stroke = 'url(#gradId)'`

---

## 4. Gradient Mechanism (Directional Edges)

### 4.1 Gradient Pre-Build (Phase H)

**File:** `src/js/views/pantheon-v2.js:779–805`

Directional edges receive a pre-built `<linearGradient>` in `<defs>`.

```javascript
if (st.directional) {
  const gid = 'ph2eg-' + _edgeCounter; // unique ID
  const grad = document.createElementNS(SVG_NS, 'linearGradient');
  grad.setAttribute('id', gid);
  grad.setAttribute('gradientUnits', 'userSpaceOnUse');
  const reverse = REVERSE_DIRECTION.has(e.type);
  const x1 = reverse ? tp.x : sp.x, y1 = reverse ? tp.y : sp.y;
  const x2 = reverse ? sp.x : tp.x, y2 = reverse ? sp.y : tp.y;
  grad.setAttribute('x1', x1); grad.setAttribute('y1', y1);
  grad.setAttribute('x2', x2); grad.setAttribute('y2', y2);
  const stop0 = document.createElementNS(SVG_NS, 'stop');
  stop0.setAttribute('offset', '0%');
  stop0.setAttribute('stop-color', st.hex);
  stop0.setAttribute('stop-opacity', '0.95');
  const stop1 = document.createElementNS(SVG_NS, 'stop');
  stop1.setAttribute('offset', '100%');
  stop1.setAttribute('stop-color', st.hex);
  stop1.setAttribute('stop-opacity', '0.35');
  grad.appendChild(stop0); grad.appendChild(stop1);
  defsEl.appendChild(grad);
  path.dataset.gradId = gid;
}
```

**Gradient Specs:**
- **ID:** `ph2eg-{edgeCounter}` (unique per edge)
- **gradientUnits:** `userSpaceOnUse` (world coordinates, not percentages)
- **Endpoints:**
  - If in `REVERSE_DIRECTION`: x1/y1 = target, x2/y2 = source (reverses flow)
  - Else: x1/y1 = source, x2/y2 = target
- **Stop 0 (0%):** Color = bucket hex, opacity = 0.95 (bright origin)
- **Stop 1 (100%):** Color = bucket hex, opacity = 0.35 (dim terminus)

**When Activated:**
- On `.hot` class + `dataset.gradId` present, JS swaps inline `stroke` (line 859):
  ```javascript
  el.style.stroke = 'url(#' + el.dataset.gradId + ')';
  ```
- Overrides CSS `.ph2-edge.hot` stroke color.

**Directional Buckets:**
- transmission (5 types)
- kinship (4 types)
- attestation (13 types)

---

## 5. Hover State Code

### 5.1 applyEdgeHoverState() Function

**File:** `src/js/views/pantheon-v2.js:849–871`

Called on `enterNode` and `leaveNode` events.

```javascript
function applyEdgeHoverState() {
  if (_hoverId) {
    edgeEls.forEach(({ el, s, t }) => {
      const incident = (s === _hoverId || t === _hoverId);
      el.classList.toggle('dim', !incident);
      el.classList.toggle('hot', incident);
      if (incident && el.dataset.gradId) {
        el.style.stroke = 'url(#' + el.dataset.gradId + ')';
      } else if (el.style.stroke) {
        el.style.stroke = '';
      }
    });
  } else {
    edgeEls.forEach(({ el }) => {
      el.classList.remove('dim');
      el.classList.remove('hot');
      if (el.style.stroke) el.style.stroke = '';
    });
  }
}
```

**Class Toggles:**
- **Incident edges** (source or target = hovered node):
  - Add `.hot`
  - Remove `.dim`
  - If directional: set `style.stroke = 'url(#gradId)'`
- **Non-incident edges:**
  - Add `.dim`
  - Remove `.hot`
  - Clear inline stroke

---

## 6. Filter & Family-Filter Code

### 6.1 Family Filter Lock

**File:** `src/js/views/pantheon-v2.js:569–572` (init), **1192** (toggle)

```javascript
let _familyFilter = null;
// ...
_familyFilter = (_familyFilter === fam) ? null : fam;
```

**Triggered:** Click on family legend row.

### 6.2 applyHullFilterState() Function

**File:** `src/js/views/pantheon-v2.js:872–882`

Called after family filter toggle.

```javascript
function applyHullFilterState() {
  hullEls.forEach(el => {
    const fam = el.dataset.family;
    el.classList.toggle('dim', !!(_familyFilter && fam !== _familyFilter));
    el.classList.toggle('hot', !!(_familyFilter && fam === _familyFilter));
  });
  tickEls.forEach(el => {
    const fam = el.dataset.family;
    el.classList.toggle('dim', !!(_familyFilter && fam !== _familyFilter));
  });
}
```

**Note:** Function only directly toggles `.dim` / `.hot` on **hulls** and **ticks**, NOT edges.

### 6.3 Edge Filter Behavior (Implicit)

**File:** `src/js/views/pantheon-v2.js:608` (node rendering)

```javascript
if (_familyFilter && attrs._family !== _familyFilter) {
  // Node is not in active family — not rendered.
}
```

**Effect on Edges:** When family filter is active, only nodes in the matching family are rendered. Edges incident to filtered-out nodes are implicitly invisible (their endpoints are gone). No explicit `.filter-dim` class on edges.

---

## 7. Edge Path & Curvature

### 7.1 EDGE_PULL Constant

**File:** `src/js/views/pantheon-v2.js:749`

```javascript
const EDGE_PULL = 0.35;
```

**Bezier Formula:**

For each edge with source `sp`, target `tp`:

```
midpoint mx, my = ((sp.x + tp.x) / 2, (sp.y + tp.y) / 2)
control point (cxp, cyp) = (mx + (0 - mx) * 0.35, my + (0 - my) * 0.35)
path d = M sp.x,sp.y Q cxp,cyp tp.x,tp.y
```

Pulls control point 35% from midpoint toward origin (0, 0), creating inward-curved Q-bezier.

### 7.2 Dev-Panel Curvature Control

**File:** `src/js/dev-panel.js:38` (control), **143–157** (rebuildEdges)

```javascript
{ id: 'edgeCurvature', label: 'Curvature', min: 0, max: 0.6, step: 0.01, 
  default: 0.35, target: 'rebuildEdges', fmt: v => Math.round(v * 100) + '%' },
```

On slider change, `rebuildEdges()` recomputes all edge paths using `S.edgeCurvature` instead of hardcoded 0.35. Default is 0.35 (matching EDGE_PULL).

---

## 8. Dev-Panel CSS Var Contributions

### 8.1 Dev-Panel Control Mapping

**File:** `src/js/dev-panel.js:30–95`

**Edge-relevant controls** applied to `:root` via `applyCssVars()`:

| Control ID | Label | Var | Default | Range | Fmt |
|------------|-------|-----|---------|-------|-----|
| `edgeOpacity` | Idle opacity × | `--ph2-edge-opacity-mult` | 0.20 | 0–3 | `v.toFixed(2)+'×'` |
| `edgeWidth` | Idle width × | `--ph2-edge-width-mult` | 0.60 | 0.4–3 | `v.toFixed(2)+'×'` |
| `edgeHotWidth` | Hot width | `--ph2-edge-hot-width` | 1.6 | 0.6–3 | `v.toFixed(1)+'px'` |

**Hull-relevant controls** (affect filter state visually):

| Control ID | Label | Var | Default | Notes |
|------------|-------|-----|---------|-------|
| `hullOpacity` | Fill opacity | `--ph2-hull-opacity` | 0.12 | — |
| `hullHotFill` | Hot fill | `--ph2-hull-hot-fill` | 0.20 | — |

### 8.2 applyCssVars() Logic

**File:** `src/js/dev-panel.js:124–136`

```javascript
function applyCssVars() {
  const r = document.documentElement;
  ALL_CONTROLS.forEach(c => {
    if (c.target !== 'cssVar') return;
    const val = c.unit ? (S[c.id] + c.unit) : S[c.id];
    r.style.setProperty(c.cssVar, val);
  });
  r.style.setProperty('--ph2-hull-stroke-opacity', Math.min(1, (S.hullOpacity || 0.12) * 1.4));
}
```

Sets each CSS var on `:root` to the control's current value.

---

## 9. Final Computed Picture (Idle State)

### 9.1 Example: Syncretic Edge (Parallel Bucket) at Idle

**Scenario:**
- Edge type: `syncretic` → bucket `parallel`
- `st.headline = false` (not in headline set)
- Dev panel: default values (edgeOpacity mult = 0.20, edgeWidth mult = 0.60)
- No hover, no family filter active

**From EDGE_BUCKETS (parallel):**
- hex = #5A9A8F
- width = 0.34
- idleOp = 0.12
- hotOp = 0.85
- directional = false

**Computed Stroke & Opacity:**

1. **stroke** (from `.ph2-edge` base, line 1777):
   ```
   rgba(80, 95, 130, 0.85)
   ```
   RGB = (80, 95, 130), alpha = 0.85

2. **stroke-width** (from `.ph2-edge`, line 1778):
   ```
   calc(var(--edge-w, 0.20) * var(--ph2-edge-width-mult, 1))
   = calc(0.34 * 0.60)
   = 0.204 px
   ```

3. **stroke-opacity** (from `.ph2-edge`, line 1779):
   ```
   calc(var(--edge-idle-op, 0.08) * var(--ph2-edge-opacity-mult, 1))
   = calc(0.12 * 0.20)
   = 0.024
   ```

**Final Rendered Style:**
- **stroke:** rgba(80, 95, 130, 0.85) [slate-blue base]
- **stroke-opacity:** 0.024 [very dim]
- **stroke-width:** 0.204 px
- **Combined Alpha:** 0.85 × 0.024 ≈ **0.0204** (effectively invisible except in dense stacks)

**Rationale:** Non-directional, non-headline edges form a dim "atmosphere" layer. At 1200+ edges with cumulative opacity ~0.02 per edge, the stack reads as a colored haze around core nodes.

### 9.2 Example: Ancestor-of Edge (Transmission:hl Bucket) at Idle

**Scenario:**
- Edge type: `ancestor-of` → bucket `transmission:hl`
- `st.headline = true` (`:hl` suffix forces headline)
- `st.idleOp = 0.30` (override via line 356 of edgeStyleFor)
- Dev panel: default values

**From EDGE_BUCKETS (transmission):**
- hex = #C9743A
- width = 0.46
- hotOp = 0.95

**Override from edgeStyleFor (line 356):**
- idleOp = 0.30 (forced for headline)

**Computed Stroke & Opacity:**

1. **stroke** (from `.ph2-edge.ph2-edge-headline`, line 1786):
   ```
   var(--edge-type-color, rgba(120, 140, 182, 0.72))
   = #C9743A (inline CSS var from JS)
   = rgba(201, 116, 58, 1) [normalized]
   ```

2. **stroke-width** (from `.ph2-edge`, line 1778):
   ```
   calc(0.46 * 0.60)
   = 0.276 px
   ```

3. **stroke-opacity** (from `.ph2-edge`, line 1779):
   ```
   calc(0.30 * 0.20)
   = 0.06
   ```

**Final Rendered Style:**
- **stroke:** #C9743A (warm orange-brown, bucket color)
- **stroke-opacity:** 0.06
- **stroke-width:** 0.276 px
- **Combined Alpha:** ≈ **0.06** (visible in light areas; headline edges "pop" at baseline)

**Rationale:** Headline edges (ancestor-of, polemic, fusion, appropriated-by, visual-cognate, syncretic-fusion) render in bucket color at baseline to highlight major discoveries without requiring hover.

### 9.3 Example: Polemic Edge at Hot (Hover)

**Scenario:**
- Edge type: `polemic-against` → bucket `polemic` (entire bucket is headline)
- Edge is incident to hovered node
- Dev panel: default values

**From EDGE_BUCKETS (polemic):**
- hex = #A83E4A
- width = 0.46
- hotOp = 0.95
- directional = false

**Classes Applied:** `.ph2-edge` + `.ph2-edge-headline` + `.hot` (from hover)

**Computed Stroke & Opacity:**

1. **stroke** (from `.ph2-edge.hot`, line 1790, overrides headline):
   ```
   var(--edge-type-color, rgba(212, 165, 90, 0.9)) !important
   = #A83E4A (inline CSS var)
   = rgba(168, 62, 74, 1) [normalized, deep crimson]
   ```

2. **stroke-opacity** (from `.ph2-edge.hot`, line 1791):
   ```
   var(--edge-hot-op, 0.9) !important
   = 0.95 [bucket hotOp]
   ```

3. **stroke-width** (from `.ph2-edge.hot`, line 1792):
   ```
   var(--ph2-edge-hot-width, 1.6) !important
   = 1.6 px [dev-panel hot-width, default]
   ```

**Final Rendered Style:**
- **stroke:** #A83E4A (deep crimson, bucket color)
- **stroke-opacity:** 0.95
- **stroke-width:** 1.6 px
- **Combined Alpha:** ≈ **0.95** (bright, fully visible)

**Transition:** From idle (invisible, rgba(80,95,130, calc(0.25*0.20))) to hot (bright crimson) animates over 180ms (transition: stroke-opacity, stroke-width, stroke).

---

## 10. Summary Table: CSS Var Flow

| Source | Var | Idle Default | Hot Default | Used In | Remarks |
|--------|-----|--------------|-------------|---------|---------|
| **Inline JS** | `--edge-type-color` | bucket hex | bucket hex | `.hot`, `.headline` stroke | Set per-edge by edgeStyleFor(). |
| **Inline JS** | `--edge-w` | 0.20–0.46 | — | stroke-width calc | Set per-edge; bucket width. |
| **Inline JS** | `--edge-idle-op` | 0.08–0.30 | — | stroke-opacity calc | Set per-edge; bucket idleOp. |
| **Inline JS** | `--edge-hot-op` | 0.55–0.95 | 0.55–0.95 | `.hot` stroke-opacity | Set per-edge; bucket hotOp. |
| **Dev Panel** | `--ph2-edge-opacity-mult` | 0.20 | — | stroke-opacity calc | Multiplies idle opacity. |
| **Dev Panel** | `--ph2-edge-width-mult` | 0.60 | — | stroke-width calc | Multiplies idle width. |
| **Dev Panel** | `--ph2-edge-hot-width` | 1.6 | 1.6 | `.hot` stroke-width | Hot width in px. |

---

## 11. Class Application Summary

| Class | Conditions | Effect |
|-------|-----------|--------|
| `.ph2-edge` | Always | Base styling: slate-blue stroke, calc'd width/opacity. |
| `.ph2-edge-headline` | `st.headline === true` (polemic, fusion, ancestor-of) | Stroke = bucket color (not slate) at idle. |
| `.dim` | Non-incident during hover OR non-matching during family filter | stroke-opacity forced to 0.02 !important. |
| `.hot` | Incident during hover OR matching during family filter | stroke = bucket color, stroke-opacity = hotOp, stroke-width = fixed 1.6px. |

---

**Audit completed 2026-05-17.**  
**Source files:** `src/js/views/pantheon-v2.js`, `src/styles/app.css`, `src/js/dev-panel.js`.
