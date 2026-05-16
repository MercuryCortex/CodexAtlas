// ============================================================
// CODEX ATLAS — Pantheon v2 (WebGL R&D track)
// ============================================================
//
// SECOND ATTEMPT at the WebGL Pantheon. Sigma.js + graphology renderer
// targeting visual + interaction parity with the production D3 SVG
// Pantheon. Hidden behind ?webgl=1 URL flag.
//
// PARITY GATE (must all be ✓ before promoting to default):
//   [✓] Family-wedge polar layout (sqrt-weighted arcs, GAP=0.105 rad)
//   [✓] Family-color node fills + sqrt-degree node sizing
//   [✓] Click → window.selectNode (detail panel)
//   [✓] Hover trail — dim non-neighbors, highlight edges (sigma reducer)
//   [✓] Colored bezier edges per type (theme.js palette)
//   [✓] Tangential family rim labels (DOM overlay synced to sigma camera)
//   [✓] Mode dropdown (deities/authors/symbols/events/monuments)
//   [✓] labels: hub/all/off toggle
//   [✓] Ego-focus button
//   [✓] Family-legend click-to-filter
//   [ ] Family-filter + tier-overlay parity
//
// REUSES from existing modules:
//   window._codexGraph        sigma wrapper (src/js/graph/renderer.js)
//   window._codexGraphTheme   color tokens
//   window.NODES_BY_ID / EDGES / DATA / FAMILIES — from app.js
//   window.selectNode / showTooltip / hideTooltip
// ============================================================
(function () {
  // Module-level state: persists across render calls so mode/label choices
  // survive filter changes (legend clicks, mode dropdown changes).
  let _currentMode  = 'deities'; // 'deities'|'authors'|'symbols'|'events'|'monuments'

  // FAMILY-WEDGE polar layout — same math as the main D3 Pantheon
  // (app.js around line 975), so the angular allocation is identical.
  function computeWedgePositions(deities, families) {
    const famByName = {};
    deities.forEach(d => {
      const f = d.family || 'Other';
      if (!famByName[f]) famByName[f] = { name: f, members: [], color: d.family_color || '#7a8090' };
      famByName[f].members.push(d);
    });
    const familyOrder = (families || []).map(f => f.name).filter(n => famByName[n]);
    Object.keys(famByName).forEach(n => { if (!familyOrder.includes(n)) familyOrder.push(n); });

    const GAP = 0.105; // ~6° gap between wedges (matches main Pantheon)
    const totalGap = GAP * familyOrder.length;
    const totalArc = 2 * Math.PI - totalGap;
    const weights = familyOrder.map(n => Math.max(1.1, Math.sqrt(famByName[n].members.length)));
    const totalW = weights.reduce((a, b) => a + b, 0);
    let cursor = -Math.PI * 0.55; // start near 9 o'clock so labels read naturally
    const wedges = {};
    familyOrder.forEach((name, i) => {
      const arcSize = totalArc * (weights[i] / totalW);
      wedges[name] = {
        name,
        a0: cursor,
        a1: cursor + arcSize,
        center: cursor + arcSize / 2,
        members: famByName[name].members,
        color: famByName[name].color
      };
      cursor += arcSize + GAP;
    });

    // Per-deity anchors: 1-3 concentric rows depending on family size
    const Rinner = 220, Router = 540;
    const positions = new Map();
    Object.values(wedges).forEach(w => {
      const N = w.members.length;
      if (!N) return;
      const wedgePad = Math.min(0.05, (w.a1 - w.a0) * 0.12);
      const aSpan = (w.a1 - w.a0) - wedgePad * 2;
      const rowCount = N <= 4 ? 1 : N <= 9 ? 2 : 3;
      const rRange = Router - Rinner;
      const rRowGap = rowCount > 1 ? rRange / (rowCount - 1) : 0;
      // Sort members by date_earliest (oldest first) so the wedge reads chronologically.
      const sorted = [...w.members].sort((a, b) => {
        const ad = (typeof a.date_earliest === 'number') ? a.date_earliest : 999999;
        const bd = (typeof b.date_earliest === 'number') ? b.date_earliest : 999999;
        if (ad !== bd) return ad - bd;
        return (a.id || '').localeCompare(b.id || '');
      });
      sorted.forEach((d, idx) => {
        const row = idx % rowCount;
        const col = Math.floor(idx / rowCount);
        const colsInRow = Math.ceil((N - row) / rowCount);
        const t = colsInRow > 1 ? col / (colsInRow - 1) : 0.5;
        const ang = w.a0 + wedgePad + aSpan * t;
        const r = Rinner + row * rRowGap;
        positions.set(d.id, {
          x: r * Math.cos(ang),
          y: r * Math.sin(ang)
        });
      });
    });

    return { positions, wedges, familyOrder, famByName };
  }

  // Edge-type color palette — based on real types in data.js (audit caught
  // that ~69% of deity↔deity edges fell through to grey because the map was
  // built from theme.js convention rather than vault reality. Frequency-counts
  // from data.js (deity-relevant subset):
  //   syncretic (586) parallel-motif (1018) parallel-form (329)
  //   influenced-by (506) influences (463) consort (~128)
  //   child-of / parent-of  attests / attested-in / mentioned-in
  const EDGE_COLOR = {
    // SYNCRETIC / PARALLEL family — green to teal
    'syncretic':         '#6e8c6b', 'syncretized-with':  '#6e8c6b',
    'parallel-motif':    '#5a9a8f', 'parallels':         '#5a9a8f',
    'parallel-form':     '#5a9a8f', 'cognate-of':        '#5a9a8f',
    // INFLUENCE family — red
    'influenced':        '#c25450', 'influenced-by':     '#c25450',
    'influences':        '#c25450', 'descends-from':     '#c25450',
    // ATTESTATION family — gold
    'attested-in':       '#d4a55a', 'attests':           '#d4a55a',
    'mentioned-in':      '#aabac5', 'cited-in':          '#aabac5',
    'key-figure':        '#d4a55a',
    // AUTHORSHIP family — purple
    'authored':          '#a87bb5', 'attributed-author': '#a87bb5',
    'originated':        '#a87bb5',
    // KINSHIP family — purple-lighter
    'consort':           '#c9a5d4', 'consort-of':        '#c9a5d4',
    'child-of':          '#c9a5d4', 'parent-of':         '#c9a5d4',
    'sibling-of':        '#c9a5d4',
    // DOCUMENT-AFFECT family — blue
    'documents-affected':'#5a6cc4', 'preserved-by':      '#5a6cc4',
    'affects-tradition': '#5a6cc4',
    // THEME — amber
    'theme':             '#e0a850', 'has-theme':         '#e0a850'
  };
  const DEFAULT_EDGE_COLOR = '#7a8090';

  // Build a degree map from edges — used for sqrt-degree node sizing.
  function computeDegree(edges) {
    const d = new Map();
    edges.forEach(e => {
      d.set(e.source, (d.get(e.source) || 0) + 1);
      d.set(e.target, (d.get(e.target) || 0) + 1);
    });
    return d;
  }

  // DOM overlay for tangential family rim labels — sigma doesn't natively
  // do curved/rotated SVG text, so we place absolutely-positioned divs
  // and sync them to sigma's camera on each render.
  function buildRimLabels(rootEl, wedges, sigmaRenderer, familyFilter) {
    const overlay = document.createElement('div');
    overlay.className = 'ph2-rim-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    rootEl.appendChild(overlay);

    const Router = 540;
    const labelEntries = Object.values(wedges).filter(w => w.members.length);
    labelEntries.forEach(w => {
      const el = document.createElement('div');
      el.className = 'ph2-rim-label';
      el.dataset.family = w.name;
      el.textContent = w.name;
      el.style.color = w.color;
      if (familyFilter && w.name !== familyFilter) el.style.opacity = '0.18';
      // Stash world-space anchor + angle so the sync function can re-position
      const ang = w.center;
      el._wx = (Router + 50) * Math.cos(ang);
      el._wy = (Router + 50) * Math.sin(ang);
      // Tangential rotation: angle in degrees, rotated 90° so text follows the rim
      let rotDeg = (ang * 180 / Math.PI) + 90;
      // Flip 180° on the bottom half so labels read upright
      const normalized = ((rotDeg % 360) + 360) % 360;
      if (normalized > 90 && normalized < 270) rotDeg -= 180;
      el._rot = rotDeg;
      overlay.appendChild(el);
    });

    function sync() {
      // Convert each label's world position to screen position via sigma's camera.
      // Sigma exposes viewportToGraph / graphToViewport.
      const labels = overlay.querySelectorAll('.ph2-rim-label');
      labels.forEach(el => {
        const screen = sigmaRenderer.graphToViewport({ x: el._wx, y: el._wy });
        el.style.left = screen.x + 'px';
        el.style.top  = screen.y + 'px';
        el.style.transform = `translate(-50%, -50%) rotate(${el._rot}deg)`;
      });
    }
    sync();
    sigmaRenderer.on('afterRender', sync);
    return overlay;
  }

  // ----- node filter by mode -----
  function filterNodesByMode(mode) {
    const DATA     = window.VAULT_DATA || { nodes: [], edges: [] };
    const EDGES    = DATA.edges || [];
    const NODES_BY_ID = window.NODES_BY_ID || {};
    let authorSet = null;
    if (mode === 'authors') {
      authorSet = new Set();
      const authorEdgeTypes = new Set(['authored', 'attributed-author', 'originated', 'key-figure']);
      EDGES.forEach(e => {
        if (!authorEdgeTypes.has(e.type)) return;
        const candidateId = (e.type === 'key-figure') ? e.target : e.source;
        const cand = NODES_BY_ID[candidateId];
        if (cand && cand.type === 'person') authorSet.add(candidateId);
      });
    }
    return (DATA.nodes || []).filter(n => {
      if (mode === 'deities')   return n.type === 'deity';
      if (mode === 'authors')   return n.type === 'person' && authorSet && authorSet.has(n.id);
      if (mode === 'symbols')   return n.type === 'symbol';
      if (mode === 'events')    return n.type === 'event';
      if (mode === 'monuments') {
        const tags = Array.isArray(n.tags) ? n.tags
          : (typeof n.tags === 'string' ? n.tags.split(/[,\s]+/) : []);
        return tags.includes('monument') || (n.category || '').toLowerCase() === 'monument';
      }
      return false;
    });
  }

  // ----- main render -----
  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';

    if (!window.Sigma || !window.graphology) {
      rootEl.innerHTML = '<div class="ph2-error">sigma.js / graphology not loaded</div>';
      return;
    }
    const data = window.VAULT_DATA || { nodes: [], edges: [] };
    const EDGES = data.edges || [];
    const FAMILIES = data.families || [];

    // Filter nodes for the current mode.
    const deities = filterNodesByMode(_currentMode);
    if (!deities.length) {
      const msgs = { deities: 'No deities in data.', authors: 'No authors found.',
        symbols: 'No symbols found.', events: 'No events found.',
        monuments: 'Monuments — add `tags: [monument]` to site nodes to populate this view.' };
      rootEl.innerHTML = `<div class="ph2-error">${msgs[_currentMode] || 'No nodes.'}</div>`;
      return;
    }

    // Compute wedge layout + per-node positions.
    const { positions, wedges, familyOrder, famByName } = computeWedgePositions(deities, FAMILIES);

    // Build edge slice — only same-type↔same-type edges.
    const idSet = new Set(deities.map(d => d.id));
    const edges = EDGES.filter(e => idSet.has(e.source) && idSet.has(e.target));
    const degree = computeDegree(edges);

    // ----- build graphology graph -----
    const Graph = window.graphology.Graph || window.graphology.default || window.graphology;
    const graph = new Graph();

    // Hub set — top-12 by degree for the 'hub' label mode.
    const _sortedByDeg = [...degree.entries()].sort((a, b) => b[1] - a[1]);
    const _hubIdSet = new Set(_sortedByDeg.slice(0, 12).map(e => e[0]));

    deities.forEach(d => {
      const pos = positions.get(d.id);
      if (!pos) return;
      const deg = degree.get(d.id) || 0;
      graph.addNode(d.id, {
        x:       pos.x,
        y:       pos.y,
        size:    Math.min(11, 4 + Math.sqrt(deg) * 1.3),
        color:   d.family_color || d.tradition_color || '#7a8090',
        label:   d.title || d.id,
        _isHub:  _hubIdSet.has(d.id),
        _family: d.family || 'Other',
        _node:   d
      });
    });

    let _edgeCounter = 0;
    edges.forEach(e => {
      if (!graph.hasNode(e.source) || !graph.hasNode(e.target)) return;
      const key = `${e.source}__${e.target}__${e.type || 'rel'}__${_edgeCounter++}`;
      try {
        graph.addEdgeWithKey(key, e.source, e.target, {
          size: 0.5,
          color: EDGE_COLOR[e.type] || DEFAULT_EDGE_COLOR,
          _type: e.type
        });
      } catch (err) { /* ignore parallel-edge collisions */ }
    });

    // ----- sigma renderer -----
    let _hoverId = null;
    let _selectedId = null;

    // INTERACTIVITY STATE — drives the reducers below.
    //   _labelsMode:  'hub' (top-N by degree, default) | 'all' | 'off'
    //   _egoFocus:    when true + a node is selected, ONLY its 1-hop neighbourhood renders
    //   _familyFilter: family name string (null = no filter) — set by family-legend clicks
    let _labelsMode = 'hub';
    let _egoFocus = false;
    let _familyFilter = null;

    const settings = {
      renderEdgeLabels: false,
      defaultEdgeColor: DEFAULT_EDGE_COLOR,
      defaultNodeColor: '#7a8090',
      labelColor: { color: '#cad0d8' },
      labelSize: 11,
      labelWeight: 400,
      labelFont: 'Cormorant Garamond, serif',
      labelDensity: 0.5,
      labelGridCellSize: 80,
      labelRenderedSizeThreshold: 7,
      enableEdgeEvents: false,
      hideEdgesOnMove: true,
      hideLabelsOnMove: true,
      minCameraRatio: 0.05,
      maxCameraRatio: 8,
      nodeReducer: (id, attrs) => {
        const out = { ...attrs };

        // EGO FOCUS — when active + a node is selected, hide everything outside the 1-hop neighbourhood.
        if (_egoFocus && _selectedId) {
          const inNeighbourhood = (id === _selectedId) ||
            graph.hasEdge(id, _selectedId) || graph.hasEdge(_selectedId, id) ||
            graph.areNeighbors(id, _selectedId);
          if (!inNeighbourhood) { out.hidden = true; return out; }
        }
        // FAMILY FILTER — when set, dim every node not in that family.
        if (_familyFilter && attrs._family !== _familyFilter) {
          out.color = '#2a2c32';
          out.label = '';
          return out;
        }
        // HOVER / SELECT highlighting.
        if (_hoverId === id || _selectedId === id) {
          out.highlighted = true;
          out.zIndex = 2;
        } else if (_hoverId) {
          const isNeighbor =
            graph.hasEdge(id, _hoverId) ||
            graph.hasEdge(_hoverId, id) ||
            graph.areNeighbors(id, _hoverId);
          if (!isNeighbor) {
            out.color = '#3a3d44';
            out.label = '';
          }
        }
        // LABEL MODE — 'off' kills all labels, 'hub' keeps only top-12, 'all' shows them all.
        if (_labelsMode === 'off') {
          out.label = '';
        } else if (_labelsMode === 'hub' && !attrs._isHub) {
          out.label = '';
        }
        return out;
      },
      edgeReducer: (id, attrs) => {
        const out = { ...attrs };
        if (_egoFocus && _selectedId) {
          const ext = graph.extremities(id);
          if (ext[0] !== _selectedId && ext[1] !== _selectedId) { out.hidden = true; return out; }
        }
        if (_hoverId) {
          const ext = graph.extremities(id);
          if (ext[0] !== _hoverId && ext[1] !== _hoverId) {
            out.color = '#2a2c32';
            out.size = 0.25;
          } else {
            // Brighten the hovered node's edges in their own type colour
            out.size = 1.4;
            out.zIndex = 1;
          }
        }
        return out;
      }
    };

    const sigma = new window.Sigma(graph, rootEl, settings);

    sigma.on('enterNode', ({ node }) => {
      _hoverId = node;
      sigma.refresh({ skipIndexation: true });
    });
    sigma.on('leaveNode', () => {
      _hoverId = null;
      sigma.refresh({ skipIndexation: true });
    });
    sigma.on('clickNode', ({ node }) => {
      _selectedId = node;
      sigma.refresh({ skipIndexation: true });
      if (window.selectNode) window.selectNode(node, true);
    });
    sigma.on('clickStage', () => {
      _selectedId = null;
      _hoverId = null;
      sigma.refresh({ skipIndexation: true });
    });

    // Tangential family rim labels — DOM overlay synced to sigma camera.
    const rimOverlay = buildRimLabels(rootEl, wedges, sigma, _familyFilter);

    // ----- TOOLBAR — mode dropdown + labels toggle + ego focus + recenter -----
    const toolbar = document.createElement('div');
    toolbar.className = 'ph2-toolbar';
    toolbar.innerHTML = `
      <select class="ph2-btn ph2-mode-select" title="What the wedges show">
        <option value="deities"   ${_currentMode === 'deities'   ? 'selected' : ''}>◯ Deities</option>
        <option value="authors"   ${_currentMode === 'authors'   ? 'selected' : ''}>✎ Authors</option>
        <option value="symbols"   ${_currentMode === 'symbols'   ? 'selected' : ''}>✦ Symbols</option>
        <option value="events"    ${_currentMode === 'events'    ? 'selected' : ''}>★ Events</option>
        <option value="monuments" ${_currentMode === 'monuments' ? 'selected' : ''}>⛬ Monuments</option>
      </select>
      <button class="ph2-btn" id="ph2-labels" title="Toggle label density">labels: ${_labelsMode}</button>
      <button class="ph2-btn${_egoFocus ? ' ph2-btn-on' : ''}" id="ph2-ego" title="Show 1-hop neighbourhood of selected node">ego focus</button>
      <button class="ph2-btn" id="ph2-recenter" title="Re-fit camera to all nodes">recenter</button>
    `;
    rootEl.appendChild(toolbar);

    // Mode dropdown — rebuilds entire graph for the new mode
    toolbar.querySelector('.ph2-mode-select').onchange = (ev) => {
      _currentMode  = ev.target.value;
      _familyFilter = null;
      _egoFocus     = false;
      _labelsMode   = 'hub';
      render(rootEl);
    };

    toolbar.querySelector('#ph2-labels').onclick = (ev) => {
      _labelsMode = _labelsMode === 'hub' ? 'all' : _labelsMode === 'all' ? 'off' : 'hub';
      ev.target.textContent = 'labels: ' + _labelsMode;
      sigma.refresh({ skipIndexation: true });
    };
    toolbar.querySelector('#ph2-ego').onclick = (ev) => {
      _egoFocus = !_egoFocus;
      ev.target.classList.toggle('ph2-btn-on', _egoFocus);
      if (!_egoFocus) _selectedId = null;
      sigma.refresh({ skipIndexation: true });
    };
    toolbar.querySelector('#ph2-recenter').onclick = () => {
      try { sigma.getCamera().animatedReset({ duration: 400 }); } catch (e) { /* ignore */ }
      _egoFocus = false;
      toolbar.querySelector('#ph2-ego').classList.remove('ph2-btn-on');
      sigma.refresh({ skipIndexation: true });
    };

    // ----- FAMILY LEGEND (bottom-left) — click to filter wheel to one family -----
    const legendStartCollapsed = (() => {
      try { return localStorage.getItem('legend-collapsed') === '1'; } catch (e) { return false; }
    })();
    const legend = document.createElement('div');
    legend.className = 'ph2-legend' + (legendStartCollapsed ? ' collapsed' : '');
    const familyOrderForLegend = (familyOrder || []).filter(name => famByName && famByName[name] && famByName[name].members.length);
    legend.innerHTML =
      '<div class="ph2-legend-head">' +
        '<div class="ph2-legend-title">Families · click to filter</div>' +
        '<button class="ph2-legend-burger" title="Collapse">≡</button>' +
      '</div>' +
      '<div class="ph2-legend-body">' +
        familyOrderForLegend.map(name => {
          const w = wedges[name] || {};
          const color = (w.color) || '#7a8090';
          const count = (w.members || []).length;
          return `<div class="ph2-legend-row${_familyFilter === name ? ' ph2-legend-active' : ''}" data-family="${escapeAttr(name)}">
            <span class="ph2-legend-swatch" style="background:${color}"></span>
            <span class="ph2-legend-name">${escapeHtml(name)}</span>
            <span class="ph2-legend-count">${count}</span>
          </div>`;
        }).join('') +
      '</div>';
    rootEl.appendChild(legend);

    legend.querySelectorAll('.ph2-legend-row').forEach(row => {
      row.onclick = () => {
        const fam = row.dataset.family;
        _familyFilter = (_familyFilter === fam) ? null : fam;
        legend.querySelectorAll('.ph2-legend-row').forEach(r => {
          r.classList.toggle('ph2-legend-active', r.dataset.family === _familyFilter);
        });
        // Sync rim-label opacity
        rimOverlay.querySelectorAll('.ph2-rim-label').forEach(el => {
          el.style.opacity = (_familyFilter && el.dataset.family !== _familyFilter) ? '0.18' : '0.85';
        });
        sigma.refresh({ skipIndexation: true });
      };
      // Hover preview
      row.addEventListener('mouseenter', () => {
        if (_familyFilter) return;
        const fam = row.dataset.family;
        rimOverlay.querySelectorAll('.ph2-rim-label').forEach(el => {
          el.style.opacity = el.dataset.family !== fam ? '0.18' : '0.85';
        });
      });
      row.addEventListener('mouseleave', () => {
        if (_familyFilter) return;
        rimOverlay.querySelectorAll('.ph2-rim-label').forEach(el => {
          el.style.opacity = '0.85';
        });
      });
    });

    legend.querySelector('.ph2-legend-burger').onclick = (ev) => {
      ev.stopPropagation();
      const willCollapse = !legend.classList.contains('collapsed');
      legend.classList.toggle('collapsed', willCollapse);
      try { localStorage.setItem('legend-collapsed', willCollapse ? '1' : '0'); } catch (e) {}
    };

    // Stash for diagnostics + setView() teardown
    rootEl._sigma = sigma;
    rootEl._graph = graph;
  }

  // --- escape helpers (kept private to this module) ---
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  }
  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/["'&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  window._pantheonV2 = { render };
})();
