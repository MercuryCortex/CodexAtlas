// ============================================================
// CODEX ATLAS — Alchemy (card pinboard)
// A research workbench. Drop vault nodes onto a free-form board as cards;
// drag them around; right-click to expand connections, neighbors, or
// shortest-path bridges. Each card = thumbnail + title + summary + tag pills.
// State persists to localStorage so the board survives reloads.
//
// Exposes: window._alchemyBoard.mount(rootEl)
// Reads (from app.js global scope): DATA, NODES_BY_ID, EDGES, selectNode,
//                                    fmtDateRange, edgeStyle
// ============================================================
(function () {

  const STORAGE_KEY = 'codex-atlas-alchemy-board-v1';
  const CARD_W = 260, CARD_H = 320;
  const GHOST_OPACITY = 0.55;

  // Board state (in-memory mirror of localStorage)
  const state = {
    cards: [],      // [{ id, nodeId, x, y, ghost: bool }]
    selected: new Set(), // card ids
    pan: { x: 0, y: 0 },
    zoom: 1
  };

  let rootEl = null;
  let boardEl = null;       // pan/zoom transformed inner div
  let edgesSvg = null;      // SVG overlay for connection lines
  let toolbarEl = null;
  let menuEl = null;
  let panState = null;      // mid-pan info
  let dragState = null;     // mid-card-drag info
  let marqueeState = null;  // mid-marquee-select info
  let nextCardId = 1;
  let searchResults = [];

  // ----- persistence -----
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state.cards = parsed.cards || [];
      state.pan = parsed.pan || { x: 0, y: 0 };
      state.zoom = parsed.zoom || 1;
      nextCardId = state.cards.reduce((m, c) => Math.max(m, c.id), 0) + 1;
    } catch (e) { /* ignore */ }
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        cards: state.cards, pan: state.pan, zoom: state.zoom
      }));
    } catch (e) { /* ignore */ }
  }

  // ----- node lookup -----
  function node(nodeId) {
    return (window.NODES_BY_ID && window.NODES_BY_ID[nodeId]) || null;
  }

  // ----- node-data accessors (graceful — these globals exist in app.js but
  // aren't on window. We read from VAULT_DATA which IS on window.) -----
  function allNodes() { return (window.VAULT_DATA && window.VAULT_DATA.nodes) || []; }
  function allEdges() { return (window.VAULT_DATA && window.VAULT_DATA.edges) || []; }
  function nodeById(id) {
    if (window.NODES_BY_ID && window.NODES_BY_ID[id]) return window.NODES_BY_ID[id];
    return allNodes().find(n => n.id === id);
  }

  // ----- transform application -----
  function applyTransform() {
    if (!boardEl) return;
    boardEl.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
    drawEdges();
  }

  // ----- card DOM -----
  function buildCardEl(card) {
    const n = nodeById(card.nodeId);
    if (!n) return null;
    const el = document.createElement('div');
    el.className = 'alch-card' + (card.ghost ? ' alch-card-ghost' : '');
    el.dataset.cardId = card.id;
    el.style.left = card.x + 'px';
    el.style.top  = card.y + 'px';
    el.style.width  = CARD_W + 'px';

    const thumb = n.thumbnail || (n.depictions && n.depictions[0] && n.depictions[0].src) || null;
    const summary = (n.body || '').replace(/^#[^\n]*\n/, '').replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1').slice(0, 220);

    el.innerHTML = `
      <div class="alch-card-thumb"${thumb ? ` style="background-image:url('${escapeAttr(thumb)}')"` : ' data-empty="1"'}>
        ${!thumb ? `<span class="alch-card-thumb-fallback">${typeGlyph(n.type)}</span>` : ''}
      </div>
      <div class="alch-card-body">
        <div class="alch-card-title-row">
          <span class="alch-card-title">${escapeHtml(n.title || n.id)}</span>
          <span class="alch-card-type" data-type="${escapeAttr(n.type || 'node')}">${typeLabel(n.type)}</span>
        </div>
        <div class="alch-card-sub">${escapeHtml(n.family || n.tradition || '—')}${n.tradition && n.family ? ' · ' + escapeHtml(n.tradition) : ''}</div>
        <div class="alch-card-summary">${escapeHtml(summary)}${summary.length >= 220 ? '…' : ''}</div>
        <div class="alch-card-tags">
          ${tagPills(n).map(p => `<span class="alch-pill" data-pill="${escapeAttr(p.kind)}" style="${pillStyle(p)}">${escapeHtml(p.label)}</span>`).join('')}
        </div>
      </div>
    `;

    // Drag handler — pointer events, preserves smoothness on touch
    // Block native text-selection on shift-click. Browsers default to "extend
    // selection" when shift is held on mousedown, which highlights the card's
    // text instead of just toggling multi-select.
    el.addEventListener('mousedown', (ev) => {
      if (ev.shiftKey) ev.preventDefault();
    });
    el.addEventListener('pointerdown', (ev) => {
      if (ev.button === 2) return; // right-click handled separately
      ev.stopPropagation();
      ev.preventDefault(); // belt-and-suspenders for text-selection
      el.setPointerCapture(ev.pointerId);
      const startX = ev.clientX, startY = ev.clientY;
      const orig = { x: card.x, y: card.y };
      let moved = false;
      const onMove = (mv) => {
        const dx = (mv.clientX - startX) / state.zoom;
        const dy = (mv.clientY - startY) / state.zoom;
        if (!moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) moved = true;
        if (moved) {
          card.x = orig.x + dx;
          card.y = orig.y + dy;
          el.style.left = card.x + 'px';
          el.style.top = card.y + 'px';
          drawEdges();
        }
      };
      const onUp = () => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
        if (moved) save();
        else handleCardClick(card, ev);
      };
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
    });

    // Right-click context menu
    el.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!state.selected.has(card.id)) {
        state.selected.clear();
        state.selected.add(card.id);
        refreshSelection();
      }
      showCardContextMenu(ev.clientX, ev.clientY);
    });

    return el;
  }

  // ----- selection visuals -----
  function refreshSelection() {
    boardEl.querySelectorAll('.alch-card').forEach(el => {
      const id = +el.dataset.cardId;
      el.classList.toggle('alch-card-selected', state.selected.has(id));
    });
  }

  // ----- card click (no drag) -----
  function handleCardClick(card, ev) {
    const n = nodeById(card.nodeId);
    if (!n) return;
    if (ev.shiftKey) {
      // Toggle multi-select
      if (state.selected.has(card.id)) state.selected.delete(card.id);
      else state.selected.add(card.id);
      refreshSelection();
      return;
    }
    state.selected.clear();
    state.selected.add(card.id);
    refreshSelection();
    if (window.selectNode) window.selectNode(card.nodeId, true);
  }

  // ----- type glyph + label (matches Atlas-map class-icons) -----
  function typeGlyph(t) {
    const map = { deity: '☉', person: '✎', event: '⧖', document: '▤', theme: '❖', tradition: '∴', symbol: '⚗' };
    return map[t] || '◆';
  }
  function typeLabel(t) {
    if (!t) return 'node';
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  // ----- tag pills — academic-level classification chips -----
  function tagPills(n) {
    const pills = [];
    if (n.tradition) pills.push({ kind: 'tradition', label: n.tradition });
    if (n.family && n.family !== n.tradition) pills.push({ kind: 'family', label: n.family, color: n.family_color });
    const er = formatEra(n.date_earliest, n.date_latest);
    if (er) pills.push({ kind: 'era', label: er });
    if (n.status && n.status !== 'stub') pills.push({ kind: 'status', label: n.status });
    if (n.category) pills.push({ kind: 'category', label: n.category });
    if (Array.isArray(n.themes)) {
      n.themes.slice(0, 3).forEach(th => {
        const clean = String(th).replace(/^\[\[|\]\]$/g, '').replace(/\|.*$/, '');
        if (clean) pills.push({ kind: 'theme', label: clean });
      });
    }
    return pills.slice(0, 8);
  }
  function pillStyle(p) {
    if (p.kind === 'family' && p.color) {
      return `background:${p.color}22; color:${p.color}; border-color:${p.color}55`;
    }
    return '';
  }
  function formatEra(a, b) {
    if (a == null) return null;
    const fmt = y => (y < 0 ? Math.abs(y) + ' BCE' : y + ' CE');
    if (b == null || b === a) return fmt(a);
    return fmt(a) + ' – ' + fmt(b);
  }

  // ----- escape helpers -----
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  }
  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/["'&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  // ----- adding cards -----
  function addCard(nodeId, x, y, opts = {}) {
    if (!nodeById(nodeId)) return null;
    const existing = state.cards.find(c => c.nodeId === nodeId);
    if (existing && !opts.allowDup) {
      // Just flash + center on the existing card
      panToCard(existing);
      return existing;
    }
    const card = {
      id: nextCardId++,
      nodeId,
      x: x != null ? x : Math.round(-state.pan.x / state.zoom + (rootEl.clientWidth / 2 - CARD_W / 2) / state.zoom),
      y: y != null ? y : Math.round(-state.pan.y / state.zoom + (rootEl.clientHeight / 2 - CARD_H / 2) / state.zoom),
      ghost: !!opts.ghost
    };
    state.cards.push(card);
    const el = buildCardEl(card);
    if (el) boardEl.appendChild(el);
    save();
    drawEdges();
    updateCounter();
    return card;
  }

  function removeCard(cardId) {
    state.cards = state.cards.filter(c => c.id !== cardId);
    state.selected.delete(cardId);
    const el = boardEl.querySelector(`.alch-card[data-card-id="${cardId}"]`);
    if (el) el.remove();
    save();
    drawEdges();
    updateCounter();
  }

  function clearBoard() {
    state.cards = [];
    state.selected.clear();
    boardEl.querySelectorAll('.alch-card').forEach(el => el.remove());
    save();
    drawEdges();
    updateCounter();
  }

  function panToCard(card) {
    const r = rootEl.getBoundingClientRect();
    state.pan.x = r.width / 2 - (card.x + CARD_W / 2) * state.zoom;
    state.pan.y = r.height / 2 - (card.y + CARD_H / 2) * state.zoom;
    applyTransform();
    save();
  }

  // ----- connection lines (SVG overlay) -----
  function drawEdges() {
    if (!edgesSvg) return;
    const r = rootEl.getBoundingClientRect();
    edgesSvg.setAttribute('width', r.width);
    edgesSvg.setAttribute('height', r.height);
    edgesSvg.innerHTML = '';

    if (state.cards.length < 2) return;

    // Map nodeId → card for fast lookup
    const byNodeId = new Map(state.cards.map(c => [c.nodeId, c]));
    const drawnPairs = new Set();

    const inHighlight = (cardA, cardB) => {
      if (!highlightCardIds) return null; // not in highlight mode → default look
      const aIn = highlightCardIds.has(cardA.id);
      const bIn = highlightCardIds.has(cardB.id);
      if (highlightCardIds.size === 1) return aIn || bIn; // single-card mode: any edge involving it
      return aIn && bIn; // multi-card mode: only edges within the subgraph
    };

    allEdges().forEach(e => {
      const a = byNodeId.get(e.source);
      const b = byNodeId.get(e.target);
      if (!a || !b) return;
      const key = a.id < b.id ? `${a.id}__${b.id}__${e.type}` : `${b.id}__${a.id}__${e.type}`;
      if (drawnPairs.has(key)) return;
      drawnPairs.add(key);

      // ----- Unreal/Blueprint-style side-anchored cubic bezier -----
      // Card-A and Card-B centers in screen-space (used only to decide orientation).
      const acx = (a.x + CARD_W / 2) * state.zoom + state.pan.x;
      const acy = (a.y + CARD_H / 2) * state.zoom + state.pan.y;
      const bcx = (b.x + CARD_W / 2) * state.zoom + state.pan.x;
      const bcy = (b.y + CARD_H / 2) * state.zoom + state.pan.y;
      const cx = bcx - acx, cy = bcy - acy;

      // Card edge offsets in screen-space (account for zoom).
      const halfW = (CARD_W / 2) * state.zoom;
      const halfH = (CARD_H / 2) * state.zoom;

      // Choose exit edges: horizontal-dominant → exit left/right sides,
      // vertical-dominant → exit top/bottom. The threshold (|dx| < CARD_W/2)
      // routes near-vertically-stacked cards through top/bottom anchors so
      // the curve doesn't loop back across itself.
      const horizontalDominant = Math.abs(cx) >= halfW;
      let ax, ay, bx, by, orientation;
      if (horizontalDominant) {
        orientation = 'h';
        if (cx >= 0) {
          // b is to the right of a → exit a-right, enter b-left
          ax = acx + halfW; ay = acy;
          bx = bcx - halfW; by = bcy;
        } else {
          // b is to the left of a → exit a-left, enter b-right
          ax = acx - halfW; ay = acy;
          bx = bcx + halfW; by = bcy;
        }
      } else {
        orientation = 'v';
        if (cy >= 0) {
          // b is below a → exit a-bottom, enter b-top
          ax = acx; ay = acy + halfH;
          bx = bcx; by = bcy - halfH;
        } else {
          // b is above a → exit a-top, enter b-bottom
          ax = acx; ay = acy - halfH;
          bx = bcx; by = bcy + halfH;
        }
      }

      // Cubic-Bezier control points pulled AWAY from each card along the
      // exit-axis. This is the same shape Unreal Blueprint / Figma / n8n
      // use for node-graph connections.
      const dx = bx - ax, dy = by - ay;
      const color = edgeColor(e.type);
      let cax, cay, cbx, cby;
      if (orientation === 'h') {
        const pull = Math.max(40, Math.abs(dx) * 0.5);
        const sgn = cx >= 0 ? 1 : -1;
        cax = ax + sgn * pull; cay = ay;
        cbx = bx - sgn * pull; cby = by;
      } else {
        const pull = Math.max(40, Math.abs(dy) * 0.5);
        const sgn = cy >= 0 ? 1 : -1;
        cax = ax; cay = ay + sgn * pull;
        cbx = bx; cby = by - sgn * pull;
      }

      // Determine visual state for this edge
      const hl = inHighlight(a, b);
      let strokeOpacity, strokeWidth, labelOpacity;
      if (hl === null) { strokeOpacity = 0.55; strokeWidth = 1.4; labelOpacity = 0.85; }
      else if (hl)    { strokeOpacity = 1;    strokeWidth = 2.2; labelOpacity = 1;    }
      else            { strokeOpacity = 0.10; strokeWidth = 0.8; labelOpacity = 0.18; }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${ax},${ay} C ${cax},${cay} ${cbx},${cby} ${bx},${by}`);
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', strokeWidth);
      path.setAttribute('stroke-opacity', strokeOpacity);
      path.setAttribute('fill', 'none');
      path.setAttribute('class', 'alch-edge');
      path.setAttribute('data-edge-type', e.type || 'related-to');
      edgesSvg.appendChild(path);

      // Label at the cubic-bezier midpoint (t = 0.5):
      //   P(0.5) = 0.125*P0 + 0.375*C1 + 0.375*C2 + 0.125*P3
      const lx = 0.125 * ax + 0.375 * cax + 0.375 * cbx + 0.125 * bx;
      const ly = 0.125 * ay + 0.375 * cay + 0.375 * cby + 0.125 * by;
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', lx);
      lbl.setAttribute('y', ly - 3);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('fill', color);
      lbl.setAttribute('font-family', 'var(--mono)');
      lbl.setAttribute('font-size', '9.5');
      lbl.setAttribute('opacity', labelOpacity);
      lbl.setAttribute('class', 'alch-edge-label');
      lbl.textContent = e.type || 'related-to';
      edgesSvg.appendChild(lbl);
    });
  }

  function edgeColor(type) {
    // Mirrors theme.js (graph WebGL) for visual consistency. Falls back to grey.
    const map = {
      'attested-in': '#d4a55a', 'authored': '#a87bb5', 'attributed-author': '#a87bb5',
      'originated': '#a87bb5', 'syncretized-with': '#6e8c6b', 'parallels': '#5a9a8f',
      'cognate-of': '#5a9a8f', 'cited-in': '#aabac5', 'mentioned-in': '#aabac5',
      'influenced': '#c25450', 'influenced-by': '#c25450', 'descends-from': '#c25450',
      'documents-affected': '#5a6cc4', 'preserved-by': '#5a6cc4',
      'theme': '#e0a850', 'child-of': '#a87bb5', 'consort-of': '#a87bb5',
      'parent-of': '#a87bb5', 'attests': '#d4a55a'
    };
    return map[type] || '#7a8090';
  }

  // ----- right-click context menu -----
  function dismissMenu() {
    if (menuEl) { menuEl.remove(); menuEl = null; }
  }
  function showMenu(x, y, items) {
    dismissMenu();
    menuEl = document.createElement('div');
    menuEl.className = 'alch-menu';
    menuEl.style.left = x + 'px';
    menuEl.style.top = y + 'px';
    items.forEach(it => {
      if (it.divider) { menuEl.appendChild(document.createElement('hr')); return; }
      const row = document.createElement('div');
      row.className = 'alch-menu-item' + (it.disabled ? ' alch-menu-item-disabled' : '');
      row.textContent = it.label;
      if (!it.disabled) {
        row.onclick = () => { dismissMenu(); it.action(); };
      }
      menuEl.appendChild(row);
    });
    document.body.appendChild(menuEl);
    setTimeout(() => document.addEventListener('pointerdown', dismissMenu, { once: true }), 50);
  }

  function showCardContextMenu(x, y) {
    const selectedIds = [...state.selected];
    const items = [];
    if (selectedIds.length === 1) {
      const c = state.cards.find(c => c.id === selectedIds[0]);
      const n = nodeById(c.nodeId);
      items.push({ label: 'Open detail panel', action: () => window.selectNode && window.selectNode(c.nodeId, true) });
      items.push({ label: 'Spawn all neighbors', action: () => spawnNeighbors(c) });
      items.push({ label: 'Highlight this card\'s connections', action: () => setEdgeHighlight([c.id]) });
      items.push({ divider: true });
      items.push({ label: 'See this node in Transmission', action: () => sendToTransmission([c.nodeId]) });
      items.push({ divider: true });
      items.push({ label: 'Remove card', action: () => removeCard(c.id) });
    } else if (selectedIds.length >= 2) {
      items.push({ label: `Highlight only the ${selectedIds.length}-card subgraph`, action: () => setEdgeHighlight(selectedIds) });
      items.push({ label: 'Spawn shortest paths (ghost cards)', action: () => spawnShortestPaths(selectedIds) });
      items.push({ label: 'Spawn common neighbors', action: () => spawnCommonNeighbors(selectedIds) });
      items.push({ label: 'Spawn all neighbors of any selected', action: () => spawnUnionNeighbors(selectedIds) });
      items.push({ divider: true });
      const selectedNodes = selectedIds.map(id => state.cards.find(c => c.id === id)?.nodeId).filter(Boolean);
      items.push({ label: `See these ${selectedNodes.length} in Transmission`, action: () => sendToTransmission(selectedNodes) });
      items.push({ divider: true });
      items.push({ label: `Remove ${selectedIds.length} cards`, action: () => selectedIds.forEach(removeCard) });
    }
    showMenu(x, y, items);
  }

  // ----- edge highlight mode -----
  // When set, drawEdges() draws only edges connecting cards in this set with
  // full opacity; other edges fade out. null = default (all edges normal).
  let highlightCardIds = null;
  function setEdgeHighlight(cardIds) {
    highlightCardIds = cardIds && cardIds.length ? new Set(cardIds) : null;
    drawEdges();
  }

  function showEmptyBoardContextMenu(x, y) {
    showMenu(x, y, [
      { label: 'Add card…', action: () => focusSearch() },
      { label: 'Auto-arrange (layered)', action: () => autoArrangeELK('layered') },
      { label: 'Auto-arrange (force)',   action: () => autoArrangeELK('force') },
      { label: 'Auto-arrange (pack)',    action: () => autoArrangeELK('rectpacking') },
      { divider: true },
      { label: 'Clear board', action: () => { if (confirm('Clear all cards from the board?')) clearBoard(); } }
    ]);
  }

  // ----- spawn helpers -----
  function spawnNeighbors(card) {
    const n = nodeById(card.nodeId);
    if (!n) return;
    const targets = new Set();
    allEdges().forEach(e => {
      if (e.source === card.nodeId) targets.add(e.target);
      else if (e.target === card.nodeId) targets.add(e.source);
    });
    const existing = new Set(state.cards.map(c => c.nodeId));
    const toAdd = [...targets].filter(id => !existing.has(id));
    placeAround(card, toAdd);
  }
  function spawnShortestPaths(cardIds) {
    // Pair-wise shortest paths between all selected cards; intermediate nodes become ghost cards.
    const ids = cardIds.map(cid => state.cards.find(c => c.id === cid)?.nodeId).filter(Boolean);
    if (ids.length < 2) return;
    const intermediates = new Set();
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const path = bfsPath(ids[i], ids[j], 4);
        path.slice(1, -1).forEach(id => intermediates.add(id));
      }
    }
    const existing = new Set(state.cards.map(c => c.nodeId));
    const toAdd = [...intermediates].filter(id => !existing.has(id));
    // Place ghost cards in the middle of the bounding box of selected
    const sel = state.cards.filter(c => cardIds.includes(c.id));
    const cx = sel.reduce((s, c) => s + c.x, 0) / sel.length;
    const cy = sel.reduce((s, c) => s + c.y, 0) / sel.length;
    toAdd.forEach((nodeId, idx) => {
      addCard(nodeId, cx + Math.cos(idx * 0.8) * 180 + (idx % 2) * 40, cy + Math.sin(idx * 0.8) * 180, { ghost: true });
    });
  }
  function spawnCommonNeighbors(cardIds) {
    const ids = cardIds.map(cid => state.cards.find(c => c.id === cid)?.nodeId).filter(Boolean);
    if (ids.length < 2) return;
    let common = null;
    ids.forEach(nodeId => {
      const neighbors = new Set();
      allEdges().forEach(e => {
        if (e.source === nodeId) neighbors.add(e.target);
        else if (e.target === nodeId) neighbors.add(e.source);
      });
      common = common === null ? neighbors : new Set([...common].filter(x => neighbors.has(x)));
    });
    const existing = new Set(state.cards.map(c => c.nodeId));
    const toAdd = [...(common || [])].filter(id => !existing.has(id));
    const sel = state.cards.filter(c => cardIds.includes(c.id));
    const cx = sel.reduce((s, c) => s + c.x, 0) / sel.length;
    const cy = sel.reduce((s, c) => s + c.y, 0) / sel.length;
    toAdd.forEach((nodeId, idx) => {
      addCard(nodeId, cx + Math.cos(idx * 0.6) * 240, cy + Math.sin(idx * 0.6) * 240);
    });
  }
  function spawnUnionNeighbors(cardIds) {
    const ids = cardIds.map(cid => state.cards.find(c => c.id === cid)?.nodeId).filter(Boolean);
    if (!ids.length) return;
    const idSet = new Set(ids);
    const targets = new Set();
    allEdges().forEach(e => {
      if (idSet.has(e.source)) targets.add(e.target);
      else if (idSet.has(e.target)) targets.add(e.source);
    });
    ids.forEach(id => targets.delete(id));
    const existing = new Set(state.cards.map(c => c.nodeId));
    const toAdd = [...targets].filter(id => !existing.has(id)).slice(0, 24);
    const sel = state.cards.filter(c => cardIds.includes(c.id));
    const cx = sel.reduce((s, c) => s + c.x, 0) / sel.length;
    const cy = sel.reduce((s, c) => s + c.y, 0) / sel.length;
    toAdd.forEach((nodeId, idx) => {
      const ang = (idx / Math.max(8, toAdd.length)) * Math.PI * 2;
      const r = 320 + (idx % 2) * 70;
      addCard(nodeId, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
    });
  }

  // Push the given nodeIds into STATE.alchemyPicks and switch to Transmission view.
  // The user can then continue from the same set, rendered as a force-laid graph.
  function sendToTransmission(nodeIds) {
    if (!nodeIds || !nodeIds.length) return;
    if (!window.STATE) return;
    // Keep order, de-dup
    const seen = new Set();
    const picks = [];
    nodeIds.forEach(id => { if (id && !seen.has(id)) { seen.add(id); picks.push(id); } });
    window.STATE.alchemyPicks = picks;
    window.STATE.alchemyActivePreset = null;
    // FIX (bug #1 — Alchemy→Transmission explosion):
    // 1. Skip bridge expansion: the user curated this set — don't inflate it
    //    with O(N²) BFS intermediates that flood the force-sim with cold nodes.
    // 2. Clear the ELK position cache so stale positions from a previous
    //    Transmission session don't corrupt the new layout. Without this, ELK
    //    positions computed for a different node set are reused for the new
    //    picks and the sim explodes trying to reconcile them.
    // 3. Use elk-layered so nodes land in a stable DAG rather than a force blob.
    window.STATE.alchemySkipBridges = true;
    window.STATE.alchemyLayout = 'elk-layered';
    if (window.STATE.alchemyElkPositions) window.STATE.alchemyElkPositions = new Map();
    try { localStorage.setItem('alch-layout', 'elk-layered'); } catch (e) { /* ignore */ }
    if (typeof window.setView === 'function') window.setView('transmission');
    else {
      // Fallback: click the nav item
      const nav = document.querySelector('nav.side .item[data-view="transmission"]');
      if (nav) nav.click();
    }
  }
  function bfsPath(srcId, dstId, maxHops) {
    if (srcId === dstId) return [srcId];
    const adj = new Map();
    allEdges().forEach(e => {
      if (!adj.has(e.source)) adj.set(e.source, []);
      if (!adj.has(e.target)) adj.set(e.target, []);
      adj.get(e.source).push(e.target);
      adj.get(e.target).push(e.source);
    });
    const prev = new Map([[srcId, null]]);
    let frontier = [srcId];
    for (let h = 0; h < maxHops; h++) {
      const next = [];
      for (const u of frontier) {
        for (const v of (adj.get(u) || [])) {
          if (prev.has(v)) continue;
          prev.set(v, u);
          if (v === dstId) {
            const path = [v]; let cur = u;
            while (cur != null) { path.unshift(cur); cur = prev.get(cur); }
            return path;
          }
          next.push(v);
        }
      }
      frontier = next;
      if (!frontier.length) break;
    }
    return [];
  }
  function placeAround(card, nodeIds) {
    nodeIds.slice(0, 16).forEach((nodeId, i) => {
      const ang = (i / Math.max(8, nodeIds.length)) * Math.PI * 2;
      const r = 320 + (i % 2) * 60;
      addCard(nodeId, card.x + Math.cos(ang) * r, card.y + Math.sin(ang) * r);
    });
  }
  // Legacy grid auto-arrange — kept as a guaranteed-fast fallback if ELK is unavailable.
  function autoArrangeGrid() {
    const cols = Math.ceil(Math.sqrt(state.cards.length));
    const gx = CARD_W + 40, gy = CARD_H + 40;
    state.cards.forEach((c, i) => {
      c.x = (i % cols) * gx - cols * gx / 2;
      c.y = Math.floor(i / cols) * gy - cols * gy / 2;
      const el = boardEl.querySelector(`.alch-card[data-card-id="${c.id}"]`);
      if (el) { el.style.left = c.x + 'px'; el.style.top = c.y + 'px'; }
    });
    save();
    drawEdges();
  }

  // ELK-powered arrange — runs the shared layout engine over the current cards
  // and their cross-tradition edges. Algorithm key per window._codexLayout.ALGORITHMS.
  async function autoArrangeELK(algorithm) {
    if (!window._codexLayout) return autoArrangeGrid();
    if (!state.cards.length) return;

    // Build the node + edge slice the layout engine consumes.
    const nodes = state.cards.map(c => ({ id: 'card-' + c.id }));
    const cardByNodeId = new Map(state.cards.map(c => [c.nodeId, c]));
    const edges = [];
    allEdges().forEach(e => {
      const a = cardByNodeId.get(e.source);
      const b = cardByNodeId.get(e.target);
      if (!a || !b || a.id === b.id) return;
      edges.push({ source: 'card-' + a.id, target: 'card-' + b.id });
    });

    const positions = await window._codexLayout.compute(nodes, edges, {
      algorithm,
      nodeWidth: CARD_W,
      nodeHeight: CARD_H,
      spacing: 60,
      direction: 'RIGHT'
    });

    // Apply positions back to cards. Center the layout on the current viewport.
    state.cards.forEach(c => {
      const p = positions.get('card-' + c.id);
      if (!p) return;
      c.x = Math.round(p.x);
      c.y = Math.round(p.y);
      const el = boardEl.querySelector(`.alch-card[data-card-id="${c.id}"]`);
      if (el) { el.style.left = c.x + 'px'; el.style.top = c.y + 'px'; }
    });
    save();
    drawEdges();
  }

  // Default Auto-arrange (clicking the toolbar button) — runs the layered/timeline
  // algorithm, which is the most useful for a research board.
  function autoArrange() { autoArrangeELK('layered'); }

  // Popup with every available ELK algorithm. Opened by the arrange-popup button.
  function openArrangeMenu(anchorEl) {
    const algos = (window._codexLayout && window._codexLayout.ALGORITHMS) || {};
    const items = Object.entries(algos).map(([key, meta]) => ({
      label: `${meta.label}`,
      action: () => autoArrangeELK(key)
    }));
    if (!items.length) items.push({ label: 'Grid', action: autoArrangeGrid });
    const r = anchorEl.getBoundingClientRect();
    showMenu(r.left, r.bottom + 4, items);
  }

  // ----- search bar / add-card -----
  function focusSearch() {
    const inp = toolbarEl.querySelector('.alch-search-input');
    if (inp) inp.focus();
  }
  function runSearch(q) {
    q = q.toLowerCase().trim();
    if (!q) return [];
    return allNodes().filter(n => {
      const hay = ((n.title || '') + ' ' + (n.id || '') + ' ' + (n.label || '')).toLowerCase();
      return hay.includes(q);
    }).slice(0, 20);
  }
  function renderResults(q) {
    const wrap = toolbarEl.querySelector('.alch-search-results');
    if (!wrap) return;
    searchResults = runSearch(q);
    if (!searchResults.length) {
      wrap.innerHTML = q ? '<div class="alch-search-empty">No matches.</div>' : '';
      wrap.style.display = q ? 'block' : 'none';
      return;
    }
    wrap.innerHTML = searchResults.map(n => `
      <div class="alch-search-row" data-id="${escapeAttr(n.id)}">
        <span class="alch-search-type">${typeGlyph(n.type)}</span>
        <span class="alch-search-title">${escapeHtml(n.title || n.id)}</span>
        <span class="alch-search-meta">${escapeHtml(n.family || n.type || '')}</span>
      </div>`).join('');
    wrap.style.display = 'block';
    wrap.querySelectorAll('.alch-search-row').forEach(r => {
      r.onclick = () => {
        addCard(r.dataset.id);
        const inp = toolbarEl.querySelector('.alch-search-input');
        if (inp) { inp.value = ''; }
        wrap.style.display = 'none';
      };
    });
  }

  // ----- pan/zoom handlers on the board background -----
  // ----- marquee (rectangle / click-drag) selection -----
  // Shift+drag from empty board → translucent gold rect → on release, every
  // card whose screen-space bounding box intersects the rect is added to
  // state.selected. Always ADDITIVE: shift-drag is how you grow a selection.
  function ensureMarqueeEl() {
    if (marqueeState.el) return marqueeState.el;
    const el = document.createElement('div');
    el.className = 'alch-marquee';
    rootEl.appendChild(el);
    marqueeState.el = el;
    return el;
  }
  function updateMarquee(clientX, clientY) {
    const el = ensureMarqueeEl();
    const rootRect = rootEl.getBoundingClientRect();
    const x0 = Math.min(marqueeState.startX, clientX) - rootRect.left;
    const y0 = Math.min(marqueeState.startY, clientY) - rootRect.top;
    const x1 = Math.max(marqueeState.startX, clientX) - rootRect.left;
    const y1 = Math.max(marqueeState.startY, clientY) - rootRect.top;
    el.style.left = x0 + 'px';
    el.style.top = y0 + 'px';
    el.style.width = (x1 - x0) + 'px';
    el.style.height = (y1 - y0) + 'px';
  }
  function finishMarquee() {
    if (!marqueeState) return;
    const el = marqueeState.el;
    if (el) {
      // Compute selection: every card whose screen-bbox intersects the marquee rect.
      const marqueeRect = el.getBoundingClientRect();
      // Empty/zero-area marquee → treat as click-empty: deselect
      if (marqueeRect.width < 4 && marqueeRect.height < 4) {
        if (!marqueeState.additive) {
          state.selected.clear();
          refreshSelection();
        }
      } else {
        boardEl.querySelectorAll('.alch-card').forEach(cardEl => {
          const r = cardEl.getBoundingClientRect();
          const intersects = !(r.right < marqueeRect.left || r.left > marqueeRect.right ||
                               r.bottom < marqueeRect.top || r.top > marqueeRect.bottom);
          if (intersects) state.selected.add(+cardEl.dataset.cardId);
        });
        refreshSelection();
      }
      el.remove();
    }
    marqueeState = null;
  }

  function attachPanZoom() {
    rootEl.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.alch-card') || ev.target.closest('.alch-toolbar') || ev.target.closest('.alch-menu')) return;
      // Shift+drag → MARQUEE select (additive to existing selection)
      // Plain-drag → PAN (and deselect on no-move)
      if (ev.button !== 0) return;
      rootEl.setPointerCapture(ev.pointerId);
      dismissMenu();
      if (ev.shiftKey) {
        // Start marquee — additive to current selection
        marqueeState = {
          startX: ev.clientX, startY: ev.clientY,
          el: null, additive: true
        };
        return;
      }
      // Plain click on empty: deselect + clear edge highlight + start pan
      state.selected.clear();
      refreshSelection();
      if (highlightCardIds) { highlightCardIds = null; drawEdges(); }
      panState = { startX: ev.clientX, startY: ev.clientY, origX: state.pan.x, origY: state.pan.y };
    });
    rootEl.addEventListener('pointermove', (ev) => {
      if (marqueeState) { updateMarquee(ev.clientX, ev.clientY); return; }
      if (!panState) return;
      state.pan.x = panState.origX + (ev.clientX - panState.startX);
      state.pan.y = panState.origY + (ev.clientY - panState.startY);
      applyTransform();
    });
    const endPan = () => {
      if (marqueeState) { finishMarquee(); return; }
      if (panState) { panState = null; save(); }
    };
    rootEl.addEventListener('pointerup', endPan);
    rootEl.addEventListener('pointercancel', endPan);

    rootEl.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const r = rootEl.getBoundingClientRect();
      const cx = ev.clientX - r.left, cy = ev.clientY - r.top;
      const oldZ = state.zoom;
      const newZ = Math.max(0.25, Math.min(2.5, oldZ * (ev.deltaY < 0 ? 1.08 : 0.92)));
      // Zoom about cursor
      state.pan.x = cx - (cx - state.pan.x) * (newZ / oldZ);
      state.pan.y = cy - (cy - state.pan.y) * (newZ / oldZ);
      state.zoom = newZ;
      applyTransform();
      save();
    }, { passive: false });

    rootEl.addEventListener('contextmenu', (ev) => {
      if (ev.target.closest('.alch-card') || ev.target.closest('.alch-toolbar')) return;
      ev.preventDefault();
      showEmptyBoardContextMenu(ev.clientX, ev.clientY);
    });
  }

  // ----- toolbar build -----
  function buildToolbar() {
    toolbarEl = document.createElement('div');
    toolbarEl.className = 'alch-toolbar';
    toolbarEl.innerHTML = `
      <div class="alch-toolbar-row">
        <div class="alch-search">
          <input class="alch-search-input" type="text" placeholder="Add a card — search nodes…" />
          <div class="alch-search-results" style="display:none"></div>
        </div>
        <button class="alch-btn" id="alch-btn-presets">Presets ▾</button>
        <button class="alch-btn" id="alch-btn-fit">Zoom to fit</button>
        <button class="alch-btn" id="alch-btn-arrange" title="Auto-arrange: layered timeline layout">Auto-arrange ▾</button>
        <button class="alch-btn alch-btn-danger" id="alch-btn-clear">Clear</button>
        <div class="alch-counter" id="alch-counter"></div>
      </div>
      <div class="alch-toolbar-row alch-toolbar-actions">
        <span class="alch-action-label">SELECTED:</span>
        <button class="alch-btn alch-btn-action" id="alch-btn-highlight" title="Highlight only the edges between selected cards (or this card's edges)">Highlight subgraph</button>
        <button class="alch-btn alch-btn-action" id="alch-btn-neighbors" title="Add cards for every node connected to any selected card">Spawn neighbors</button>
        <button class="alch-btn alch-btn-action" id="alch-btn-common" title="Add cards for nodes connected to ALL selected cards (intersection)">Common neighbors</button>
        <button class="alch-btn alch-btn-action" id="alch-btn-path" title="Add ghost cards for intermediate nodes on shortest paths between selected">Shortest path</button>
        <button class="alch-btn alch-btn-action" id="alch-btn-clear-selection" title="Clear current selection + edge highlight">Clear selection</button>
        <span class="alch-spacer"></span>
        <button class="alch-btn alch-btn-bridge" id="alch-btn-bridge" title="Open the current board as a Transmission graph">→ Transmission</button>
      </div>
    `;
    rootEl.appendChild(toolbarEl);
    const inp = toolbarEl.querySelector('.alch-search-input');
    inp.addEventListener('input', () => renderResults(inp.value));
    inp.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && searchResults.length) {
        addCard(searchResults[0].id);
        inp.value = '';
        toolbarEl.querySelector('.alch-search-results').style.display = 'none';
      } else if (ev.key === 'Escape') {
        inp.value = '';
        toolbarEl.querySelector('.alch-search-results').style.display = 'none';
      }
    });
    toolbarEl.querySelector('#alch-btn-fit').onclick = zoomToFit;
    toolbarEl.querySelector('#alch-btn-arrange').onclick = (ev) => openArrangeMenu(ev.target);
    toolbarEl.querySelector('#alch-btn-clear').onclick = () => {
      if (confirm('Clear all cards from the board?')) clearBoard();
    };
    toolbarEl.querySelector('#alch-btn-bridge').onclick = () => {
      const all = state.cards.map(c => c.nodeId);
      if (!all.length) {
        alert('Add some cards to the board first, then send them to Transmission.');
        return;
      }
      sendToTransmission(all);
    };
    // Action buttons (debug-visible — same actions as right-click context menu).
    // They operate on currently-selected cards; with no selection, fall back to
    // "all cards on board" so the user can experiment without having to select first.
    function selectedOrAll() {
      const sel = [...state.selected];
      if (sel.length) return sel;
      return state.cards.map(c => c.id);
    }
    toolbarEl.querySelector('#alch-btn-highlight').onclick = () => {
      const ids = selectedOrAll();
      if (!ids.length) { alert('Add or select some cards first.'); return; }
      setEdgeHighlight(ids);
    };
    toolbarEl.querySelector('#alch-btn-neighbors').onclick = () => {
      const ids = selectedOrAll();
      if (!ids.length) { alert('Add or select some cards first.'); return; }
      if (ids.length === 1) {
        const card = state.cards.find(c => c.id === ids[0]);
        if (card) spawnNeighbors(card);
      } else {
        spawnUnionNeighbors(ids);
      }
    };
    toolbarEl.querySelector('#alch-btn-common').onclick = () => {
      const ids = selectedOrAll();
      if (ids.length < 2) { alert('Select 2 or more cards first (shift-click) to find common neighbors.'); return; }
      spawnCommonNeighbors(ids);
    };
    toolbarEl.querySelector('#alch-btn-path').onclick = () => {
      const ids = selectedOrAll();
      if (ids.length < 2) { alert('Select 2 or more cards first (shift-click) to spawn shortest-path bridges.'); return; }
      spawnShortestPaths(ids);
    };
    toolbarEl.querySelector('#alch-btn-clear-selection').onclick = () => {
      state.selected.clear();
      refreshSelection();
      setEdgeHighlight(null);
    };
    updateCounter();
  }
  function updateCounter() {
    const c = toolbarEl && toolbarEl.querySelector('#alch-counter');
    if (c) c.textContent = `${state.cards.length} card${state.cards.length === 1 ? '' : 's'} on board`;
  }
  function zoomToFit() {
    if (!state.cards.length) {
      state.pan.x = 0; state.pan.y = 0; state.zoom = 1; applyTransform(); save(); return;
    }
    const xs = state.cards.map(c => c.x), ys = state.cards.map(c => c.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs) + CARD_W;
    const minY = Math.min(...ys), maxY = Math.max(...ys) + CARD_H;
    const w = maxX - minX, h = maxY - minY;
    const r = rootEl.getBoundingClientRect();
    const tbH = toolbarEl ? toolbarEl.getBoundingClientRect().height : 0;
    const zx = (r.width - 80) / w;
    const zy = (r.height - tbH - 80) / h;
    state.zoom = Math.max(0.25, Math.min(1.5, Math.min(zx, zy)));
    state.pan.x = (r.width / 2) - (minX + w / 2) * state.zoom;
    state.pan.y = ((r.height + tbH) / 2) - (minY + h / 2) * state.zoom;
    applyTransform();
    save();
  }

  // ----- mount / unmount -----
  function mount(host) {
    if (!host) return;
    rootEl = host;
    rootEl.innerHTML = '';
    rootEl.classList.add('alch-board-root');
    load();

    buildToolbar();

    boardEl = document.createElement('div');
    boardEl.className = 'alch-board-inner';
    rootEl.appendChild(boardEl);

    edgesSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    edgesSvg.classList.add('alch-edges-svg');
    rootEl.appendChild(edgesSvg);

    // Default pan: center world (0,0) on the viewport so cards placed at small
    // world coordinates land near the middle. Only apply the centering if the
    // user hasn't already panned (loaded state has 0,0 by default).
    if (state.pan.x === 0 && state.pan.y === 0) {
      const r = rootEl.getBoundingClientRect();
      const tbH = 64; // approximate toolbar height
      state.pan.x = r.width / 2;
      state.pan.y = r.height / 2 + tbH / 2;
    }

    attachPanZoom();
    applyTransform();

    // Render persisted cards
    state.cards.forEach(c => {
      const el = buildCardEl(c);
      if (el) boardEl.appendChild(el);
    });
    drawEdges();

    // Watch resize to update edges
    if (window.ResizeObserver && !rootEl._alchResize) {
      const ro = new ResizeObserver(() => drawEdges());
      ro.observe(rootEl);
      rootEl._alchResize = ro;
    }
    updateCounter();
  }

  // refresh counter when cards change
  const _origAdd = addCard, _origRemove = removeCard, _origClear = clearBoard;
  // (counters update inline via save() callbacks; keep this slot for future hooks)

  window._alchemyBoard = { mount, addCard, clearBoard, save, load, zoomToFit };
})();
