// ============================================================
// CODEX ATLAS — MAP V2 VIEW (real geographic map)
// ============================================================
//
// Built 2026-06-13 (Lane B). John's brief: "build the map page — use the
// good tech with the logic of nodes zoom." The construction-note skeleton
// (filed 2026-05-28 under the legacy-isolation lock) is REPLACED here by a
// real interactive world map.
//
// "The good tech" = the same offline MapLibre GL + PMTiles vector basemap
// stack the legacy VIEWS.atlas used (cardinal rule #9 — canonical tech, not
// a hand-rolled SVG/canvas map). "The logic of nodes zoom" = GeoJSON
// clustering: co-located nodes stack into a single circle at low zoom and
// decluster as you zoom in — the Atlas feel of detail revealing with depth.
//
// This module is a self-contained IIFE (loaded as its own <script> in
// index.html), so it does NOT share app.js's lexical scope. It reads data
// live from window.VAULT_DATA (rule #10 — single source of truth, never a
// hardcoded list) and opens the CANONICAL node panel via
// window._inspector.show(id) — the same inspector every other view uses.
//
// Boundary contract (public API):
//   window._mapsView = { render(pane), unmount() }
//
// VIEWS.maps in src/js/app.js delegates to render(pane). app.js's setView
// teardown calls unmount() before removing the .maps-pane (the teardown
// hook was added alongside this build — see the app.js cleanup pass that
// already calls _boardsView.unmount() / _alphabetsView.unmount()).
//
// REFERENCE: the legacy implementation lives in src/js/app.js around the
// `VIEWS.atlas` block (_atlasBuildStyle, _atlasComputeFC, etc.). The basemap
// style spec here is a faithful copy of _atlasBuildStyle so both surfaces
// share the proven offline-PMTiles config.
// ============================================================
(function () {
  'use strict';

  // ---- module-scoped state (one map instance, torn down on unmount) ----
  let _pane = null;          // the .maps-pane element app.js handed us
  let _map = null;           // the MapLibre GL instance
  let _resizeObs = null;     // ResizeObserver that keeps the canvas sized
  let _popup = null;         // hover label (tiny — full content is the inspector)
  let _nodesById = null;     // id -> vault node (geo-tagged subset)
  let _degreeById = null;    // id -> degree (computed from edges)
  let _protocolRegistered = false;
  let _styleErrShown = false;
  // 2026-06-13 — MAP lenses (class filter). Persists across mounts so
  // re-entering MAP keeps the chosen lens. The right-pill class side
  // drives this via the standard app-pill contract; it filters the
  // map's nodes WITHIN the Section (left-pick-lock law — never
  // navigates out of MAP). 'all' = every geo-tagged node.
  let _classFilter = 'all';
  let _allGeoNodes = null;   // full geo set (cached so a lens switch re-filters without re-querying)

  // type → display label + glyph, mirroring the engine's class catalog
  // so the lens names read the same as everywhere else. Unmapped types
  // fall back to a title-cased label.
  const CLASS_META = {
    deity:         { label: 'Deities',      glyph: '◉' },
    person:        { label: 'Figures',      glyph: '⚜' },
    document:      { label: 'Documents',    glyph: '❡' },
    symbol:        { label: 'Symbols',      glyph: '✦' },
    event:         { label: 'Events',       glyph: '◆' },
    ritual:        { label: 'Rituals',      glyph: '✚' },
    'sacred-site': { label: 'Sacred sites', glyph: '▲' },
    place:         { label: 'Places',       glyph: '◐' },
    tradition:     { label: 'Traditions',   glyph: '⊙' },
    monument:      { label: 'Monuments',    glyph: '▮' },
    music:         { label: 'Music',        glyph: '♩' },
    alphabet:      { label: 'Alphabets',    glyph: 'ℵ' },
    language:      { label: 'Languages',    glyph: 'A' },
    mathematics:   { label: 'Mathematics',  glyph: '∑' },
    medicine:      { label: 'Medicine',     glyph: '⚕' },
    philosophy:    { label: 'Philosophy',   glyph: '○' },
    moral:         { label: 'Morals',       glyph: '⚖' },
    alchemy:       { label: 'Alchemy',      glyph: '△' }
  };
  function _titleCase(t) {
    return String(t || 'other').replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  // ---- PMTiles protocol registration (idempotent) ----
  // The offline basemap is served through the pmtiles:// custom protocol.
  // maplibregl + pmtiles are vendored globals (see index.html script tags).
  function registerProtocol() {
    if (_protocolRegistered) return true;
    if (typeof maplibregl === 'undefined' || typeof pmtiles === 'undefined') {
      console.warn('[maps] MapLibre or PMTiles not loaded — basemap unavailable.');
      return false;
    }
    try {
      const proto = new pmtiles.Protocol();
      maplibregl.addProtocol('pmtiles', proto.tile);
      _protocolRegistered = true;
      return true;
    } catch (e) {
      console.warn('[maps] PMTiles protocol registration failed:', e && e.message);
      return false;
    }
  }

  // Resolve a CSS token at runtime so the basemap tracks the active preset.
  function token(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue(name).trim();
      return v || fallback;
    } catch (_) { return fallback; }
  }

  // ---- live data access (rule #10 — read VAULT_DATA, never a cached list) ----
  function vault() {
    return window.VAULT_DATA || window.DATA || null;
  }

  // Geo-tagged nodes only. A node qualifies if it carries n.geo.{lat,lon}.
  function geoNodes() {
    const v = vault();
    if (!v || !Array.isArray(v.nodes)) return [];
    return v.nodes.filter(n =>
      n && n.geo &&
      typeof n.geo.lat === 'number' && typeof n.geo.lon === 'number');
  }

  // Degree per node, computed once from the edge list (app.js's DEGREE map
  // is not window-exposed, so we derive our own — same definition: count of
  // incident edges). Used to size the dots (hubs read larger).
  function computeDegree() {
    const v = vault();
    const deg = new Map();
    if (!v || !Array.isArray(v.edges)) return deg;
    v.edges.forEach(e => {
      if (!e) return;
      if (e.source) deg.set(e.source, (deg.get(e.source) || 0) + 1);
      if (e.target) deg.set(e.target, (deg.get(e.target) || 0) + 1);
    });
    return deg;
  }

  // ---- basemap style (faithful copy of app.js _atlasBuildStyle) ----
  // Premium-minimalist quiet backdrop in our token palette — no loud labels,
  // just land / water / borders. Place-name labels are added dynamically in
  // setup() (wrapped in try/catch) so a glyph/filter validation error can't
  // block the whole basemap from rendering.
  function buildStyle() {
    return {
      version: 8,
      glyphs: '_assets/vendor/glyphs/{fontstack}/{range}.pbf',
      sources: {
        protomaps: {
          type: 'vector',
          // Tiles array form avoids a TileJSON metadata fetch through the
          // pmtiles:// handler, which hangs in MapLibre v5 with the source-url form.
          tiles: ['pmtiles://_assets/basemap/world-z7.pmtiles/{z}/{x}/{y}'],
          minzoom: 0,
          maxzoom: 7,
          bounds: [-180, -85.05, 180, 85.05],
          attribution: '© <a href="https://openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        }
      },
      layers: [
        { id: 'bg', type: 'background',
          paint: { 'background-color': token('--bg-0', '#07090f') } },
        { id: 'earth', source: 'protomaps', 'source-layer': 'earth', type: 'fill',
          paint: { 'fill-color': token('--bg-3', '#1c2333') } },
        { id: 'landcover', source: 'protomaps', 'source-layer': 'landcover', type: 'fill',
          paint: { 'fill-color': token('--bg-2', '#141a26'), 'fill-opacity': 0.22 } },
        { id: 'natural', source: 'protomaps', 'source-layer': 'natural', type: 'fill',
          paint: { 'fill-color': token('--bg-2', '#141a26'), 'fill-opacity': 0.30 } },
        { id: 'water', source: 'protomaps', 'source-layer': 'water', type: 'fill',
          paint: { 'fill-color': token('--bg-0', '#07090f') } },
        { id: 'boundaries-country', source: 'protomaps', 'source-layer': 'boundaries', type: 'line',
          filter: ['<=', ['coalesce', ['get', 'kind_detail'], 2], 2],
          paint: {
            'line-color': token('--border', '#232b3d'),
            'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.35, 4, 0.85, 7, 1.4],
            'line-opacity': 0.85
          }
        },
        { id: 'boundaries-region', source: 'protomaps', 'source-layer': 'boundaries', type: 'line',
          filter: ['>', ['coalesce', ['get', 'kind_detail'], 0], 2],
          paint: {
            'line-color': token('--border-soft', '#1a2030'),
            'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.25, 7, 0.55],
            'line-opacity': 0.55
          }
        }
      ]
    };
  }

  // ---- build the node FeatureCollection from the geo-tagged subset ----
  // One Point feature per node. We jitter co-located nodes onto a small
  // spiral so a city with 99 documents doesn't render as one indistinguishable
  // dot once you zoom past the cluster threshold. The jitter is deterministic
  // per id (stable across re-renders).
  function buildFeatureCollection(nodes, degById) {
    // Group nodes that share the exact same coordinate so we can spiral them.
    const groups = new Map();
    nodes.forEach(n => {
      const key = n.geo.lon.toFixed(4) + ',' + n.geo.lat.toFixed(4);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(n.id);
    });
    const ITEMS_PER_RING = 8;
    const STEP = 0.06; // degrees per ring — bounded spread so dots stay regional

    return {
      type: 'FeatureCollection',
      features: nodes.map(n => {
        const key = n.geo.lon.toFixed(4) + ',' + n.geo.lat.toFixed(4);
        const group = groups.get(key);
        let lng = n.geo.lon, lat = n.geo.lat;
        if (group && group.length > 1) {
          const pos = group.indexOf(n.id);
          const ring = Math.floor(pos / ITEMS_PER_RING) + 1;
          const inRing = pos % ITEMS_PER_RING;
          const perRing = ITEMS_PER_RING;
          const angle = (inRing / perRing) * 2 * Math.PI - Math.PI / 2;
          const r = STEP * ring;
          // Correct longitude spread for latitude so the spiral looks round.
          const lonFactor = 1 / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
          lng += r * Math.cos(angle) * lonFactor;
          lat += r * Math.sin(angle);
        }
        const deg = degById.get(n.id) || 0;
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            id: n.id,
            title: n.title || n.id,
            type: n.type || '',
            family: n.family || '',
            geoLabel: (n.geo && n.geo.label) || '',
            color: n.family_color || n.tradition_color || '#7a8090',
            deg: deg,
            // Dot radius grows with degree (sqrt damping so hubs don't dwarf).
            dotSize: 4 + Math.sqrt(deg) * 1.1
          }
        };
      })
    };
  }

  // ============================================================
  // RENDER
  // ============================================================
  function render(pane) {
    if (!pane) return;
    _pane = pane;
    pane.classList.add('maps-pane');

    // Shell: a relative-positioned stage that owns the MapLibre target div +
    // any overlay chrome (legend, empty state). View-owned chrome (rule #8).
    pane.innerHTML = [
      '<div class="maps-shell" id="maps-shell">',
      '  <div class="maps-stage" id="maps-stage">',
      '    <div class="maps-map" id="maps-map"></div>',
      '  </div>',
      '</div>'
    ].join('\n');

    const nodes = geoNodes();

    // --- guards: no MapLibre / no data → honest empty state, no fake map ---
    if (typeof maplibregl === 'undefined') {
      showEmpty('MapLibre GL not loaded — the offline map engine is unavailable.');
      return;
    }
    if (!nodes.length) {
      showEmpty('No geo-tagged nodes in the vault yet. As locations are added, they appear here.');
      return;
    }
    if (!registerProtocol()) {
      // Protocol failed (pmtiles missing) — still init the map; basemap layers
      // will silently no-op but markers render on the dark background.
      console.warn('[maps] continuing without PMTiles basemap.');
    }

    _degreeById = computeDegree();
    _nodesById = new Map();
    nodes.forEach(n => _nodesById.set(n.id, n));
    // 2026-06-13 — cache the full geo set so a lens switch re-filters
    // instantly, and seed the initial source with the active lens.
    _allGeoNodes = nodes;
    const fc = buildFeatureCollection(_nodesForFilter(), _degreeById);

    // --- init the MapLibre map ---
    try {
      _map = new maplibregl.Map({
        container: 'maps-map',
        style: buildStyle(),
        center: [40, 28],     // eastern Mediterranean / Near East — the vault's heartland
        zoom: 2.1,
        minZoom: 0.6,
        maxZoom: 11,
        renderWorldCopies: false,   // single world — no infinite horizontal repeat
        attributionControl: false,
        fadeDuration: 200,
        bearing: 0,
        pitch: 0
      });
    } catch (e) {
      console.error('[maps] MapLibre init failed:', e);
      showEmpty('The map engine failed to initialise. See console for details.');
      return;
    }

    // Debug handle for verification (parallels window._forgeDebug).
    window._mapsDebug = { map: () => _map };

    // No rotation — keep it a flat reading map.
    try {
      _map.dragRotate.disable();
      _map.touchZoomRotate.disableRotation();
      _map.keyboard.disableRotation();
    } catch (_) { /* defensive — older builds may differ */ }

    // Compact attribution control, bottom-left (OSM credit for the basemap).
    try {
      _map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
      _map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    } catch (_) { /* non-fatal */ }

    // Surface a style/source load error once (so a missing basemap is visible
    // in the console, not silent). The map still works for markers.
    _map.on('error', (ev) => {
      if (_styleErrShown) return;
      _styleErrShown = true;
      const msg = (ev && ev.error && ev.error.message) || 'unknown';
      console.warn('[maps] MapLibre error (basemap may be missing):', msg);
    });

    // Double-click empty map → reset to baseline view.
    _map.on('dblclick', (ev) => {
      const hit = _map.queryRenderedFeatures(ev.point, {
        layers: layersThatExist(['maps-clusters', 'maps-circles'])
      });
      if (hit && hit.length) return;     // dbl-click a feature → default zoom-in
      ev.preventDefault();
      _map.easeTo({ center: [40, 28], zoom: 2.1, duration: 600 });
    });

    // Keep the canvas sized to the pane (rail open/close, window resize).
    _resizeObs = new ResizeObserver(() => { if (_map) _map.resize(); });
    _resizeObs.observe(pane);

    // setup() adds sources + layers ONLY once the style is genuinely ready.
    // 2026-06-13 fix: the original gated on 'load'/'idle', but with the custom
    // pmtiles:// protocol those can fire BEFORE the style finishes — addSource
    // then throws "Style is not done loading" and no node layers ever mount
    // (black map). Poll isStyleLoaded() so setup runs exactly when MapLibre is
    // truly ready, regardless of which event fired.
    let _setupDone = false;
    const setup = () => {
      if (_setupDone || !_map) return;
      _setupDone = true;
      try { addLayers(fc); } catch (e) { console.error('[maps] setup failed:', e); }
    };
    const _readyStart = (window.performance && performance.now) ? performance.now() : 0;
    const whenReady = () => {
      if (!_map || _setupDone) return;
      if (_map.isStyleLoaded()) { setup(); return; }
      // Graceful floor: if the style never settles (e.g. a basemap/source
      // failure), surface a quiet message instead of an empty black void.
      // ~8s is comfortably longer than a real Safari load (<2s); it only
      // trips on genuine failure. 2026-06-13.
      const elapsed = ((window.performance && performance.now) ? performance.now() : _readyStart + 9000) - _readyStart;
      if (elapsed > 8000) {
        showEmpty('The basemap could not be loaded. The node data is intact — reload, or check the basemap asset.');
        return;
      }
      setTimeout(whenReady, 80);     // re-poll until the style settles
    };
    whenReady();
  }

  // Return only the layer ids that currently exist (queryRenderedFeatures
  // throws if you pass a layer that hasn't been added yet).
  function layersThatExist(ids) {
    if (!_map) return [];
    return ids.filter(id => { try { return !!_map.getLayer(id); } catch (_) { return false; } });
  }

  // ============================================================
  // LAYERS — clustered GeoJSON source + cluster/circle/label/hover
  // ============================================================
  function addLayers(fc) {
    if (!_map) return;

    // Basemap place-name labels (added here, not in the style spec, so a
    // glyph/filter validation error can't block the whole basemap).
    try {
      if (!_map.getLayer('basemap-place-labels') && _map.getSource('protomaps')) {
        _map.addLayer({
          id: 'basemap-place-labels',
          source: 'protomaps',
          'source-layer': 'places',
          type: 'symbol',
          layout: {
            'text-field': ['coalesce', ['get', 'name'], ''],
            'text-font': ['Noto Sans Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 2, 9, 6, 11, 10, 13],
            'text-allow-overlap': false,
            'text-letter-spacing': 0.05,
            'text-transform': 'uppercase',
            'symbol-sort-key': ['coalesce', ['get', 'min_zoom'], 12]
          },
          paint: {
            'text-color': token('--text-2', '#8b8e98'),
            'text-halo-color': token('--bg-0', '#07090f'),
            'text-halo-width': 1.5,
            // 2026-06-13 fix: `['zoom']` is only legal at the TOP LEVEL of a
            // step/interpolate — it was nested inside a `case`, which makes
            // MapLibre reject the layer (style error → broke the render).
            // Fade all place labels in across z3→z4.5; per-importance
            // declutter is handled by text-allow-overlap:false + sort-key.
            'text-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0, 4.5, 0.65]
          }
        });
      }
    } catch (e) {
      console.warn('[maps] basemap place labels skipped:', e && e.message);
    }

    // Clustered node source. clusterMaxZoom 6 → past z6 the clusters dissolve
    // into individual circles (the spiral jitter spreads co-located nodes so
    // they're individually clickable). clusterRadius 38px = comfortable grouping.
    if (!_map.getSource('maps-nodes')) {
      _map.addSource('maps-nodes', {
        type: 'geojson',
        data: fc,
        cluster: true,
        clusterRadius: 38,
        clusterMaxZoom: 6
      });
    } else {
      _map.getSource('maps-nodes').setData(fc);
      return; // layers already exist on a re-render
    }

    // --- cluster bubbles (gold ringed, sized by point_count) ---
    _map.addLayer({
      id: 'maps-clusters',
      type: 'circle',
      source: 'maps-nodes',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': token('--gold-soft', '#a87f3e'),
        'circle-radius': ['step', ['get', 'point_count'], 13, 10, 18, 30, 24, 100, 32],
        'circle-stroke-width': 2,
        'circle-stroke-color': token('--gold', '#d4a55a'),
        'circle-opacity': 0.85
      }
    });

    // --- cluster count labels (numeric) ---
    try {
      _map.addLayer({
        id: 'maps-cluster-counts',
        type: 'symbol',
        source: 'maps-nodes',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 12,
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': token('--bg-0', '#07090f'),
          'text-halo-color': token('--gold', '#d4a55a'),
          'text-halo-width': 0.5
        }
      });
    } catch (e) {
      console.warn('[maps] cluster-count labels unavailable (no glyphs):', e && e.message);
    }

    // --- individual node circles (color by family, size by degree) ---
    _map.addLayer({
      id: 'maps-circles',
      type: 'circle',
      source: 'maps-nodes',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          1,  ['*', ['get', 'dotSize'], 1.2],
          4,  ['*', ['get', 'dotSize'], 1.8],
          7,  ['*', ['get', 'dotSize'], 2.2],
          11, ['*', ['get', 'dotSize'], 1.6]
        ],
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(255,255,255,0.22)',
        'circle-opacity': 0.95
      }
    });

    // --- node labels (fade in as you zoom; hubs label earlier) ---
    try {
      _map.addLayer({
        id: 'maps-node-labels',
        type: 'symbol',
        source: 'maps-nodes',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'title'],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 8, 12, 11, 12],
          'text-anchor': 'left',
          'text-offset': [0.8, 0],
          'text-allow-overlap': false,
          'text-optional': true,
          // High-degree nodes claim placement first (lower sort-key = earlier).
          'symbol-sort-key': ['*', -1, ['get', 'deg']]
        },
        paint: {
          'text-color': token('--text-1', '#c8c4b8'),
          'text-halo-color': token('--bg-0', '#07090f'),
          'text-halo-width': 1.2,
          // Labels only appear once you've zoomed in past the cluster band.
          'text-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0, 5.5, 1]
        }
      });
    } catch (e) {
      console.warn('[maps] node labels unavailable:', e && e.message);
    }

    wireInteractions();
  }

  // ============================================================
  // INTERACTIONS — hover label + click → canonical inspector
  // ============================================================
  function wireInteractions() {
    if (!_map) return;

    // Hover an individual circle → tiny native label (full content = inspector).
    _map.on('mousemove', 'maps-circles', (ev) => {
      if (!ev.features || !ev.features.length) return;
      _map.getCanvas().style.cursor = 'pointer';
      const p = ev.features[0].properties;
      const meta = [p.type, p.family, p.geoLabel].filter(Boolean).join(' · ');
      const html =
        '<div class="maps-tip-title">' + escapeHtml(p.title) + '</div>' +
        (meta ? '<div class="maps-tip-meta">' + escapeHtml(meta) + '</div>' : '');
      if (!_popup) {
        _popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'maps-tip',
          offset: 10,
          maxWidth: '240px'
        });
      }
      _popup.setLngLat(ev.lngLat).setHTML(html).addTo(_map);
    });
    _map.on('mouseleave', 'maps-circles', () => {
      _map.getCanvas().style.cursor = '';
      if (_popup) { _popup.remove(); }
    });

    // Click an individual circle → open THE canonical node panel (rule: same
    // inspector everywhere — no bespoke map popup with node content).
    _map.on('click', 'maps-circles', (ev) => {
      if (!ev.features || !ev.features.length) return;
      const id = ev.features[0].properties.id;
      openInspector(id);
    });

    // Cluster cursor + click-to-zoom (the node-zoom decluttering behavior).
    _map.on('mouseenter', 'maps-clusters', () => { _map.getCanvas().style.cursor = 'pointer'; });
    _map.on('mouseleave', 'maps-clusters', () => { _map.getCanvas().style.cursor = ''; });
    _map.on('click', 'maps-clusters', (ev) => {
      const feats = _map.queryRenderedFeatures(ev.point, { layers: ['maps-clusters'] });
      if (!feats.length) return;
      const clusterId = feats[0].properties.cluster_id;
      const coord = feats[0].geometry.coordinates;
      const src = _map.getSource('maps-nodes');
      const cur = _map.getZoom();
      const ease = (targetZoom) => {
        const FLOOR = 6.4; // ensure a click always breaks the cluster
        const candidate = (typeof targetZoom === 'number' && isFinite(targetZoom))
          ? Math.max(targetZoom + 0.5, FLOOR)
          : Math.max(cur + 2.2, FLOOR);
        const want = Math.min(_map.getMaxZoom(), candidate);
        _map.easeTo({ center: coord, zoom: want, duration: 500 });
      };
      // getClusterExpansionZoom is callback in v3- and Promise in v5 — handle both.
      try {
        const r = src.getClusterExpansionZoom(clusterId, (err, z) => {
          if (err) { ease(); return; }
          ease(z);
        });
        if (r && typeof r.then === 'function') r.then(ease).catch(() => ease());
      } catch (_) { ease(); }
    });
  }

  // Open the canonical inspector. Prefer the inspector module directly; fall
  // back to window.selectNode (which app.js routes to the inspector too).
  function openInspector(id) {
    if (!id) return;
    document.body.classList.remove('detail-collapsed'); // make sure the panel is visible
    if (window._inspector && typeof window._inspector.show === 'function') {
      try { window._inspector.show(id); return; } catch (e) { /* fall through */ }
    }
    if (typeof window.selectNode === 'function') {
      try { window.selectNode(id, true); } catch (e) { /* ignore */ }
    }
  }

  // ---- empty / error state (reuses the maps-stage shell) ----
  function showEmpty(message) {
    const stage = _pane && _pane.querySelector('#maps-stage');
    if (!stage) return;
    stage.innerHTML =
      '<div class="maps-empty">' +
      '  <div class="maps-empty-glyph">⌖</div>' +
      '  <div class="maps-empty-title">MAP</div>' +
      '  <div class="maps-empty-sub">' + escapeHtml(message) + '</div>' +
      '</div>';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ============================================================
  // UNMOUNT — full teardown (MANDATORY: MapLibre + observers + listeners).
  // app.js's setView calls this before removing the .maps-pane. Leaving the
  // MapLibre instance alive is a known leak class in this project.
  // ============================================================
  function unmount() {
    if (_resizeObs) {
      try { _resizeObs.disconnect(); } catch (_) {}
      _resizeObs = null;
    }
    if (_popup) {
      try { _popup.remove(); } catch (_) {}
      _popup = null;
    }
    if (_map) {
      // remove() tears down the GL context, all sources/layers, and every
      // event listener registered via _map.on(...). No manual .off() needed.
      try { _map.remove(); } catch (e) { /* ignore */ }
      _map = null;
    }
    try { window._mapsDebug = null; } catch (_) {}
    _allGeoNodes = null;      // re-built on next render; _classFilter persists (keeps the lens)
    _nodesById = null;
    _degreeById = null;
    _styleErrShown = false;
    _pane = null;
  }

  // ============================================================
  // CLASS LENSES — the app-pill right-side contract (same as _forge /
  // _alphabetsView). Filters the plotted nodes WITHIN the MAP Section;
  // never navigates out (left-pick-lock law). 2026-06-13.
  // ============================================================
  function _nodesForFilter() {
    const all = _allGeoNodes || geoNodes();
    if (_classFilter === 'all') return all;
    return all.filter(n => (n.type || '') === _classFilter);
  }
  function supportedClasses() {
    const counts = new Map();
    (_allGeoNodes || geoNodes()).forEach(n => {
      const t = n.type || 'other';
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    const list = [{ value: 'all', label: 'All', glyph: '∗' }];
    Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])            // most-populated lens first
      .forEach(function (pair) {
        const t = pair[0];
        const m = CLASS_META[t] || { label: _titleCase(t), glyph: '·' };
        list.push({ value: t, label: m.label, glyph: m.glyph });
      });
    return list;
  }
  function getClassFilter() { return _classFilter; }
  function setClassFilter(v) {
    _classFilter = v || 'all';
    // Re-filter the live source (MapLibre re-clusters on setData).
    if (_map && _allGeoNodes) {
      try {
        const src = _map.getSource('maps-nodes');
        if (src) src.setData(buildFeatureCollection(_nodesForFilter(), _degreeById));
      } catch (e) { /* source not ready yet — initial render seeds the filter */ }
    }
    // the pill listens for this to refresh its class label
    try { document.dispatchEvent(new CustomEvent('codex:class-changed')); } catch (e) { /* ignore */ }
  }

  window._mapsView = {
    render: render,
    unmount: unmount,
    supportedClasses: supportedClasses,
    getClassFilter: getClassFilter,
    setClassFilter: setClassFilter
  };
})();
