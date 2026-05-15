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
    el.addEventListener('pointerdown', (ev) => {
      if (ev.button === 2) return; // right-click handled separately
      ev.stopPropagation();
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

    allEdges().forEach(e => {
      const a = byNodeId.get(e.source);
      const b = byNodeId.get(e.target);
      if (!a || !b) return;
      const key = a.id < b.id ? `${a.id}__${b.id}__${e.type}` : `${b.id}__${a.id}__${e.type}`;
      if (drawnPairs.has(key)) return;
      drawnPairs.add(key);

      const ax = (a.x + CARD_W / 2) * state.zoom + state.pan.x;
      const ay = (a.y + CARD_H / 2) * state.zoom + state.pan.y;
      const bx = (b.x + CARD_W / 2) * state.zoom + state.pan.x;
      const by = (b.y + CARD_H / 2) * state.zoom + state.pan.y;
      const color = edgeColor(e.type);
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const dx = bx - ax, dy = by - ay;
      // Curve perpendicular to the line — gentle bow
      const len = Math.sqrt(dx*dx + dy*dy);
      const nx = -dy / (len || 1) * Math.min(40, len * 0.12);
      const ny =  dx / (len || 1) * Math.min(40, len * 0.12);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${ax},${ay} Q ${mx + nx},${my + ny} ${bx},${by}`);
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', 1.4);
      path.setAttribute('stroke-opacity', '0.55');
      path.setAttribute('fill', 'none');
      path.setAttribute('class', 'alch-edge');
      path.setAttribute('data-edge-type', e.type || 'related-to');
      edgesSvg.appendChild(path);

      // Small label at midpoint
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', mx + nx);
      lbl.setAttribute('y', my + ny - 3);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('fill', color);
      lbl.setAttribute('font-family', 'var(--mono)');
      lbl.setAttribute('font-size', '9.5');
      lbl.setAttribute('opacity', '0.85');
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
      items.push({ label: 'Spawn neighbors', action: () => spawnNeighbors(c) });
      items.push({ divider: true });
      items.push({ label: 'Remove card', action: () => removeCard(c.id) });
    } else if (selectedIds.length >= 2) {
      items.push({ label: `Show connections between ${selectedIds.length} cards`, action: drawEdges });
      items.push({ label: 'Show shortest path (with ghost cards)', action: () => spawnShortestPaths(selectedIds) });
      items.push({ label: 'Show common neighbors', action: () => spawnCommonNeighbors(selectedIds) });
      items.push({ divider: true });
      items.push({ label: `Remove ${selectedIds.length} cards`, action: () => selectedIds.forEach(removeCard) });
    }
    showMenu(x, y, items);
  }

  function showEmptyBoardContextMenu(x, y) {
    showMenu(x, y, [
      { label: 'Add card…', action: () => focusSearch() },
      { label: 'Auto-arrange grid', action: autoArrange },
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
  function autoArrange() {
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
  function attachPanZoom() {
    rootEl.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.alch-card') || ev.target.closest('.alch-toolbar') || ev.target.closest('.alch-menu')) return;
      // Click empty board → deselect + start pan
      state.selected.clear();
      refreshSelection();
      dismissMenu();
      if (ev.button !== 0) return;
      rootEl.setPointerCapture(ev.pointerId);
      panState = { startX: ev.clientX, startY: ev.clientY, origX: state.pan.x, origY: state.pan.y };
    });
    rootEl.addEventListener('pointermove', (ev) => {
      if (!panState) return;
      state.pan.x = panState.origX + (ev.clientX - panState.startX);
      state.pan.y = panState.origY + (ev.clientY - panState.startY);
      applyTransform();
    });
    const endPan = () => { if (panState) { panState = null; save(); } };
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
        <button class="alch-btn" id="alch-btn-fit">Zoom to fit</button>
        <button class="alch-btn" id="alch-btn-arrange">Auto-arrange</button>
        <button class="alch-btn alch-btn-danger" id="alch-btn-clear">Clear</button>
        <div class="alch-counter" id="alch-counter"></div>
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
    toolbarEl.querySelector('#alch-btn-arrange').onclick = autoArrange;
    toolbarEl.querySelector('#alch-btn-clear').onclick = () => {
      if (confirm('Clear all cards from the board?')) clearBoard();
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

  window._alchemyBoard = { mount, addCard, clearBoard, save, load };
})();
