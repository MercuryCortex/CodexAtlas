// ============================================================
// CODEX ATLAS — BOARDS V2 VIEW (step 3 of 10: pan/zoom + drag-card)
// ============================================================
//
// Filed: 2026-05-27 (step 2 skeleton), step 3 ships 2026-05-28.
// Spec: AUDIT/2026-05-28-boards-v2-new-ux-spec.md (LOCKED).
//
// Step 3 ports the pan/zoom + drag-card BEHAVIORS from the legacy
// `src/js/alchemy/board.js` (reference only per
// `memory/feedback_dont_copy_legacy_prototype_aesthetic_2026-05-27.md`).
// The aesthetic is NEW V2: gold accent, dark blur, JetBrains Mono.
// No `.alch-*` class names; new `.boards-*` vocabulary.
//
// DOM contract:
//   .boards-pane          ← outer absolute-positioned pane (canvas-aligned)
//     .boards-shell       ← shell (fills pane)
//       .boards-stage     ← clickable surface (catches pan-empty, wheel)
//         .boards-world   ← inner div the transform applies to
//           .boards-card  ← individual cards (pan/zoom transformed via parent)
//
// Pan: pointerdown on empty stage → pan with origX/origY captured;
//      pointermove → translate; pointerup → end (no save yet, step 9).
// Zoom: wheel on stage → ±8% per tick; clamped 0.25-2.5; zoom about cursor.
// Drag-card: pointerdown on .boards-card → drag; pointermove → translate
//      card.x / card.y in WORLD coords (delta / zoom); pointerup → if no
//      move, click handler (placeholder — wired to inspector in step 7).
//
// Step 4 will add the contextual pill (Add node ▾ etc.).
// Step 9 will add LS persistence; until then state.pan/zoom/cards live
// only in module scope.
//
// Boundary contract (public API):
//   window._boardsView = {
//     render(pane),                 // mount or refresh
//     unmount(),                    // tear down
//     addCard({id, label, x, y}),   // append a card
//     getState(),                   // {pan, zoom, cards} for debug
//     seedTest(),                   // dev helper — drops 3 demo cards
//   }
// ============================================================
(function () {
  'use strict';

  // ── INTERNAL STATE ───────────────────────────────────────────
  // Per-board state. Step 9 will persist this to LS at
  // `atlas.boards.v1` keyed by current-board id; for now it's
  // ephemeral and resets on view-swap.
  let _pane  = null;
  let _stage = null;
  let _world = null;
  let _edgesSvg = null;   // step 6: SVG element holding the edge lines

  let _pan  = { x: 0, y: 0 };
  let _zoom = 1;

  // Cards: each is { id, label, x, y, el }. id is unique within the board.
  const _cards = new Map();

  // Live drag/pan state. null when no drag in flight.
  let _panState  = null;   // { startX, startY, origX, origY }
  let _dragState = null;   // { card, startX, startY, origX, origY, moved }

  // Edge visibility — step 6. Default ON; toggleable via the pill.
  // Persists to LS so John's preference survives reloads even before
  // the full board persistence ships in step 9.
  let _edgesVisible = (function () {
    try { return localStorage.getItem('atlas.boards.edges-visible') !== '0'; }
    catch (_) { return true; }
  })();

  // ── HELPERS ──────────────────────────────────────────────────
  function applyTransform() {
    if (!_world) return;
    _world.style.transform =
      'translate(' + _pan.x + 'px, ' + _pan.y + 'px) scale(' + _zoom + ')';
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
  function clampZoom(z) {
    return Math.max(0.25, Math.min(2.5, z));
  }

  // ── EDGE LAYER (step 6) ──────────────────────────────────────
  // SVG sibling of the card layer inside .boards-world. Lives in the
  // same coordinate space as the cards (transform-origin 0 0), so it
  // pans + zooms automatically with the world transform. Edges are
  // recomputed on every card add / remove / drag-move and on board
  // clear/load. Visibility is gated by a body class; the toggle in
  // the pill flips it.
  function cardCenter(card) {
    // Approximate center: a card is ~180px wide × 36-60px tall in world
    // coords (varies with label length). Use the live element measurements
    // so the line connects to the visual midpoint even on long labels.
    if (card.el) {
      return {
        x: card.x + (card.el.offsetWidth  || 180) / 2,
        y: card.y + (card.el.offsetHeight || 36)  / 2,
      };
    }
    return { x: card.x + 90, y: card.y + 18 };
  }
  function rebuildEdges() {
    if (!_edgesSvg) return;
    const vault = window.VAULT_DATA || window.DATA || null;
    if (!vault || !Array.isArray(vault.edges) || _cards.size < 2) {
      _edgesSvg.innerHTML = '';
      return;
    }
    const cardSet = _cards;
    // Walk vault.edges once; emit a <line> for each whose endpoints are
    // both on the board. 21k+ edges so this loop matters — keep it tight.
    const lines = [];
    for (let i = 0; i < vault.edges.length; i++) {
      const e = vault.edges[i];
      if (!e) continue;
      const a = cardSet.get(e.source);
      const b = cardSet.get(e.target);
      if (!a || !b) continue;
      const ca = cardCenter(a);
      const cb = cardCenter(b);
      lines.push(
        '<line x1="' + ca.x + '" y1="' + ca.y + '"'
        +    ' x2="' + cb.x + '" y2="' + cb.y + '"'
        +    ' class="boards-edge-line"'
        +    (e.type ? ' data-kind="' + escapeHtml(e.type) + '"' : '')
        + ' />'
      );
    }
    _edgesSvg.innerHTML = lines.join('');
  }

  // ── CARD BUILDER ─────────────────────────────────────────────
  function buildCardEl(card) {
    const el = document.createElement('div');
    el.className = 'boards-card';
    el.dataset.cardId = card.id;
    el.style.left = card.x + 'px';
    el.style.top  = card.y + 'px';
    el.innerHTML = '<span class="boards-card-label">' + escapeHtml(card.label) + '</span>';
    attachCardDrag(card, el);
    return el;
  }

  function attachCardDrag(card, el) {
    // Block native text-selection on shift-click (placeholder for marquee in step 8).
    el.addEventListener('mousedown', (ev) => { if (ev.shiftKey) ev.preventDefault(); });

    // Step 7 — right-click → contextual menu (connections / transmissions /
    // shortest-path / remove). Handler lives below in showCardMenu().
    el.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      showCardMenu(card, ev.clientX, ev.clientY);
    });

    el.addEventListener('pointerdown', (ev) => {
      if (ev.button === 2) return;  // right-click handled in step 6
      ev.stopPropagation();          // don't trigger pan
      ev.preventDefault();
      // setPointerCapture can throw if pointerId isn't a live pointer
      // (synthetic events in tests, weird touch hardware edges). Treat as
      // best-effort — drag still works without the capture, browser just
      // routes events normally based on event target hit-testing.
      try { el.setPointerCapture(ev.pointerId); } catch (_) {}
      _dragState = {
        card,
        startX: ev.clientX,
        startY: ev.clientY,
        origX:  card.x,
        origY:  card.y,
        moved:  false,
      };
      el.classList.add('is-dragging');
    });
    el.addEventListener('pointermove', (ev) => {
      if (!_dragState || _dragState.card !== card) return;
      const dx = (ev.clientX - _dragState.startX) / _zoom;
      const dy = (ev.clientY - _dragState.startY) / _zoom;
      if (!_dragState.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        _dragState.moved = true;
      }
      if (_dragState.moved) {
        card.x = _dragState.origX + dx;
        card.y = _dragState.origY + dy;
        el.style.left = card.x + 'px';
        el.style.top  = card.y + 'px';
        // Step 6 — re-route any edges touching this card. Cheap because
        // rebuildEdges is a single linear pass over vault.edges with
        // tight inner loop; on a board with 10-20 cards it's well under
        // 1ms per frame.
        rebuildEdges();
      }
    });
    const finishDrag = (ev) => {
      if (!_dragState || _dragState.card !== card) return;
      const wasMove = _dragState.moved;
      el.classList.remove('is-dragging');
      _dragState = null;
      if (!wasMove) handleCardClick(card, ev);
    };
    el.addEventListener('pointerup',     finishDrag);
    el.addEventListener('pointercancel', finishDrag);
  }

  // ── CARD CLICK (placeholder; step 7 wires the side-panel/reader) ────
  function handleCardClick(card, _ev) {
    // For now just log + toggle a `.is-selected` ring so the click is visible.
    document.querySelectorAll('.boards-card.is-selected').forEach(e => {
      if (e.dataset.cardId !== card.id) e.classList.remove('is-selected');
    });
    const el = _cards.get(card.id) && _cards.get(card.id).el;
    if (el) el.classList.toggle('is-selected');
    console.info('[boards] card click', card.id);
  }

  // ── PAN / ZOOM ATTACH ────────────────────────────────────────
  function attachPanZoom() {
    if (!_stage) return;

    // Pan: pointerdown on empty stage (not on a card).
    _stage.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.boards-card')) return;
      if (ev.button !== 0) return;
      try { _stage.setPointerCapture(ev.pointerId); } catch (_) {}
      _panState = {
        startX: ev.clientX, startY: ev.clientY,
        origX:  _pan.x,     origY:  _pan.y,
      };
      _stage.classList.add('is-panning');
      // Click-empty deselects cards (step 8 will extend with marquee on shift).
      document.querySelectorAll('.boards-card.is-selected').forEach(e => e.classList.remove('is-selected'));
    });
    _stage.addEventListener('pointermove', (ev) => {
      if (!_panState) return;
      _pan.x = _panState.origX + (ev.clientX - _panState.startX);
      _pan.y = _panState.origY + (ev.clientY - _panState.startY);
      applyTransform();
    });
    const endPan = () => {
      if (!_panState) return;
      _panState = null;
      _stage.classList.remove('is-panning');
    };
    _stage.addEventListener('pointerup',     endPan);
    _stage.addEventListener('pointercancel', endPan);

    // Zoom: wheel about cursor.
    _stage.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const r = _stage.getBoundingClientRect();
      const cx = ev.clientX - r.left;
      const cy = ev.clientY - r.top;
      const oldZ = _zoom;
      const newZ = clampZoom(oldZ * (ev.deltaY < 0 ? 1.08 : 0.92));
      if (newZ === oldZ) return;
      // Zoom about cursor: keep the point under the cursor fixed.
      _pan.x = cx - (cx - _pan.x) * (newZ / oldZ);
      _pan.y = cy - (cy - _pan.y) * (newZ / oldZ);
      _zoom  = newZ;
      applyTransform();
    }, { passive: false });
  }

  // ── PUBLIC API ───────────────────────────────────────────────
  function render(pane) {
    if (!pane) return;
    _pane = pane;
    pane.classList.add('boards-pane');
    pane.innerHTML = [
      '<div class="boards-shell" id="boards-shell">',
      '  <div class="boards-stage" id="boards-stage">',
      '    <div class="boards-world" id="boards-world">',
      // Edge layer: SVG sibling of card elements, behind them in stacking
      // order. width/height come from the world layer (CSS); we use a very
      // wide viewBox so coordinates can be anywhere.
      '      <svg class="boards-edges" id="boards-edges" xmlns="http://www.w3.org/2000/svg"></svg>',
      '    </div>',
      '  </div>',
      '</div>',
    ].join('\n');
    _stage = pane.querySelector('.boards-stage');
    _world = pane.querySelector('.boards-world');
    _edgesSvg = pane.querySelector('.boards-edges');

    // Re-mount any cards that survived a re-render (none yet — step 9
    // ships LS rehydration). The loop is here so the contract holds
    // when the state lives across mounts.
    _cards.forEach(card => {
      const el = buildCardEl(card);
      card.el = el;
      _world.appendChild(el);
    });
    // Apply persisted edge-visibility on (re)mount.
    document.body.classList.toggle('boards-edges-hidden', !_edgesVisible);

    applyTransform();
    attachPanZoom();
    // Initial edge pass — defer one tick so card .offsetWidth is measurable.
    requestAnimationFrame(rebuildEdges);
  }

  function unmount() {
    _pane = _stage = _world = null;
    _panState = _dragState = null;
    // _cards intentionally preserved so the next render() rehydrates.
  }

  function addCard(spec) {
    if (!spec || !spec.id) return null;
    if (_cards.has(spec.id)) return _cards.get(spec.id);
    const card = {
      id:    String(spec.id),
      label: spec.label || spec.id,
      x:     Number.isFinite(spec.x) ? spec.x : 0,
      y:     Number.isFinite(spec.y) ? spec.y : 0,
      el:    null,
    };
    _cards.set(card.id, card);
    if (_world) {
      const el = buildCardEl(card);
      card.el = el;
      _world.appendChild(el);
      // Step 6 — recompute edges on every add. Defer one tick so the new
      // el's offsetWidth/Height are measurable (needed by cardCenter).
      requestAnimationFrame(rebuildEdges);
    }
    return card;
  }

  function getState() {
    return {
      pan:  { x: _pan.x, y: _pan.y },
      zoom: _zoom,
      cards: Array.from(_cards.values()).map(c => ({
        id: c.id, label: c.label, x: c.x, y: c.y,
      })),
    };
  }

  // Step 5 — clear all cards from the board (used by loadPreset's
  // replace mode; future Save/Load board switches will reuse this).
  function clearBoard() {
    _cards.forEach(c => { if (c.el && c.el.parentNode) c.el.parentNode.removeChild(c.el); });
    _cards.clear();
    rebuildEdges();   // step 6 — clear any rendered edges
  }

  // Step 7 — remove a single card by id.
  function removeCard(cardId) {
    const card = _cards.get(cardId);
    if (!card) return false;
    if (card.el && card.el.parentNode) card.el.parentNode.removeChild(card.el);
    _cards.delete(cardId);
    rebuildEdges();
    return true;
  }

  // ── STEP 7 — RIGHT-CLICK EXPANSION MENU ─────────────────────
  // Right-click on a card opens a small menu at cursor with:
  //   · Expand connections     — add ALL 1-hop vault neighbors
  //   · Expand transmissions   — add only history-charged neighbors
  //                              (influences / influenced-by / syncretic-*)
  //   · Path to ▸              — submenu of other cards; shortest path
  //                              between this card and the target (BFS,
  //                              cap 6 hops); intermediate nodes added
  //                              as cards
  //   · Remove from board
  //
  // Lays new cards in a radial fan around the source card, picking
  // empty world-space slots in a spiral so they don't overlap.

  // Edge-type subsets for the menu.
  const TRANSMISSION_KINDS = new Set([
    'influences', 'influenced-by',
    'syncretic-transmission', 'syncretic-foundational',
  ]);

  function vaultNeighbors(cardId, kindFilter) {
    const vault = window.VAULT_DATA || window.DATA || null;
    if (!vault || !Array.isArray(vault.edges)) return [];
    const out = new Set();
    for (let i = 0; i < vault.edges.length; i++) {
      const e = vault.edges[i];
      if (!e) continue;
      if (kindFilter && !kindFilter.has(e.type)) continue;
      if (e.source === cardId) out.add(e.target);
      else if (e.target === cardId) out.add(e.source);
    }
    out.delete(cardId);
    return Array.from(out);
  }

  // Place new cards in a hex-ring around (cx, cy), skipping slots that
  // would overlap an existing card. Returns [{x, y}, ...] sized to needN.
  function radialLayout(cx, cy, needN) {
    const out = [];
    const occupied = Array.from(_cards.values()).map(c => ({
      x: c.x + 90, y: c.y + 18,
    }));
    const R = 200;       // ring radius
    const minDist = 160; // min distance between cards
    let ring = 1;
    let placed = 0;
    while (placed < needN && ring < 6) {
      const slots = 6 * ring;
      for (let i = 0; i < slots && placed < needN; i++) {
        const angle = (Math.PI * 2 / slots) * i + ring * 0.18;
        const x = Math.round(cx + R * ring * Math.cos(angle) - 90);
        const y = Math.round(cy + R * ring * Math.sin(angle) - 18);
        const cxi = x + 90, cyi = y + 18;
        const tooClose = occupied.some(o => {
          const dx = o.x - cxi, dy = o.y - cyi;
          return dx*dx + dy*dy < minDist*minDist;
        });
        if (tooClose) continue;
        out.push({ x, y });
        occupied.push({ x: cxi, y: cyi });
        placed++;
      }
      ring++;
    }
    return out;
  }

  // Add a list of node IDs around a source card. Skips IDs already on
  // the board. Returns the count actually added.
  function addNodesAround(sourceCard, nodeIds) {
    const vault = window.VAULT_DATA || window.DATA || null;
    if (!vault || !Array.isArray(vault.nodes)) return 0;
    const lookup = new Map();
    vault.nodes.forEach(n => { if (n && n.id) lookup.set(n.id, n); });

    const fresh = nodeIds.filter(id => !_cards.has(id) && lookup.has(id));
    if (!fresh.length) return 0;

    const cx = sourceCard.x + 90;
    const cy = sourceCard.y + 18;
    const slots = radialLayout(cx, cy, fresh.length);

    let added = 0;
    fresh.forEach((id, i) => {
      const slot = slots[i] || { x: cx + 200 * (i % 4), y: cy + 80 * Math.floor(i / 4) };
      const node = lookup.get(id);
      addCard({ id, label: node.title || id, x: slot.x, y: slot.y });
      added++;
    });
    return added;
  }

  // Undirected BFS over vault.edges, returns the shortest path as an
  // array of node IDs (including start + end) or null if no path.
  function shortestPath(startId, endId, maxHops) {
    maxHops = maxHops || 6;
    const vault = window.VAULT_DATA || window.DATA || null;
    if (!vault || !Array.isArray(vault.edges)) return null;
    if (startId === endId) return [startId];
    // Build adjacency once (cached on first call could be added later).
    const adj = new Map();
    for (let i = 0; i < vault.edges.length; i++) {
      const e = vault.edges[i];
      if (!e) continue;
      if (!adj.has(e.source)) adj.set(e.source, []);
      if (!adj.has(e.target)) adj.set(e.target, []);
      adj.get(e.source).push(e.target);
      adj.get(e.target).push(e.source);
    }
    const queue = [[startId]];
    const seen = new Set([startId]);
    while (queue.length) {
      const path = queue.shift();
      if (path.length > maxHops + 1) continue;
      const head = path[path.length - 1];
      const nbrs = adj.get(head) || [];
      for (let i = 0; i < nbrs.length; i++) {
        const nb = nbrs[i];
        if (seen.has(nb)) continue;
        if (nb === endId) return path.concat([nb]);
        seen.add(nb);
        queue.push(path.concat([nb]));
      }
    }
    return null;
  }

  let _cardMenuEl = null;
  function dismissCardMenu() {
    if (_cardMenuEl && _cardMenuEl.parentNode) _cardMenuEl.parentNode.removeChild(_cardMenuEl);
    _cardMenuEl = null;
  }
  function showCardMenu(card, screenX, screenY) {
    dismissCardMenu();
    const menu = document.createElement('div');
    menu.className = 'boards-card-menu';
    menu.style.left = screenX + 'px';
    menu.style.top  = screenY + 'px';

    const allNbr = vaultNeighbors(card.id, null);
    const txNbr  = vaultNeighbors(card.id, TRANSMISSION_KINDS);
    const newAll = allNbr.filter(id => !_cards.has(id)).length;
    const newTx  = txNbr.filter(id => !_cards.has(id)).length;

    // Path targets = other cards on board.
    const otherCards = Array.from(_cards.values()).filter(c => c.id !== card.id);

    menu.innerHTML = [
      '<div class="boards-card-menu-header">',
      '  <span class="boards-card-menu-title">' + escapeHtml(card.label) + '</span>',
      '  <span class="boards-card-menu-id">' + escapeHtml(card.id) + '</span>',
      '</div>',
      '<button class="boards-card-menu-item" data-action="expand-all"' + (newAll === 0 ? ' disabled' : '') + '>',
      '  <span class="bcm-item-label">Expand all connections</span>',
      '  <span class="bcm-item-meta">' + newAll + ' new · ' + allNbr.length + ' total</span>',
      '</button>',
      '<button class="boards-card-menu-item" data-action="expand-tx"' + (newTx === 0 ? ' disabled' : '') + '>',
      '  <span class="bcm-item-label">Expand transmissions</span>',
      '  <span class="bcm-item-meta">' + newTx + ' new · ' + txNbr.length + ' total</span>',
      '</button>',
      (otherCards.length > 0
        ? '<div class="boards-card-menu-section">Shortest path to…</div>'
          + otherCards.map(c => (
              '<button class="boards-card-menu-item boards-card-menu-item--path"'
              + ' data-action="path" data-target="' + encodeURIComponent(c.id) + '">'
              + '<span class="bcm-item-label">' + escapeHtml(c.label) + '</span>'
              + '</button>'
            )).join('')
        : ''),
      '<div class="boards-card-menu-divider"></div>',
      '<button class="boards-card-menu-item boards-card-menu-item--danger" data-action="remove">',
      '  <span class="bcm-item-label">Remove from board</span>',
      '</button>',
    ].join('');

    document.body.appendChild(menu);
    _cardMenuEl = menu;

    // Position adjust if menu would overflow viewport.
    requestAnimationFrame(() => {
      const r = menu.getBoundingClientRect();
      if (r.right > window.innerWidth - 8) {
        menu.style.left = Math.max(8, window.innerWidth - r.width - 8) + 'px';
      }
      if (r.bottom > window.innerHeight - 8) {
        menu.style.top = Math.max(8, window.innerHeight - r.height - 8) + 'px';
      }
    });

    menu.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button[data-action]');
      if (!btn || btn.disabled) return;
      ev.stopPropagation();
      const action = btn.getAttribute('data-action');
      if (action === 'expand-all') {
        addNodesAround(card, allNbr);
      } else if (action === 'expand-tx') {
        addNodesAround(card, txNbr);
      } else if (action === 'path') {
        const targetId = decodeURIComponent(btn.getAttribute('data-target') || '');
        const path = shortestPath(card.id, targetId, 6);
        if (!path) {
          alert('No path found within 6 hops between\n' + card.label + '\n  and\n' + targetId);
        } else {
          // Skip endpoints (already on board); add intermediates.
          const intermediates = path.slice(1, -1);
          addNodesAround(card, intermediates);
        }
      } else if (action === 'remove') {
        removeCard(card.id);
      }
      dismissCardMenu();
    });

    // Dismiss on next outside click / Escape (registered once).
    setTimeout(() => {
      const off = (e) => {
        if (menu.contains(e.target)) return;
        dismissCardMenu();
        document.removeEventListener('mousedown', off, true);
        document.removeEventListener('keydown', kd, true);
      };
      const kd = (e) => {
        if (e.key !== 'Escape') return;
        dismissCardMenu();
        document.removeEventListener('mousedown', off, true);
        document.removeEventListener('keydown', kd, true);
      };
      document.addEventListener('mousedown', off, true);
      document.addEventListener('keydown', kd, true);
    }, 0);
  }

  // Step 5 — load a preset (named pick list) onto the board.
  //   spec: { name?, picks: string[] (vault node ids), replace?: bool=true }
  // Looks each pick up in window.VAULT_DATA.nodes by id; missing nodes
  // are dropped silently (legacy preset entries may reference renamed
  // / removed vault nodes). Cards land in a centered grid: 3 columns,
  // CARD_W=180 / CARD_H=60 spacing, starting from the current viewport
  // center in world coords. Returns the count of cards actually added.
  function loadPreset(spec) {
    if (!spec || !Array.isArray(spec.picks)) return 0;
    const replace = (spec.replace !== false);   // default true
    if (replace) clearBoard();

    const vault = window.VAULT_DATA || window.DATA || null;
    const allNodes = (vault && Array.isArray(vault.nodes)) ? vault.nodes : [];
    const nodeIndex = new Map();
    allNodes.forEach(n => { if (n && n.id) nodeIndex.set(n.id, n); });

    // Center of the boards-stage in WORLD coords.
    let cx = 400, cy = 300;
    if (_stage) {
      const r = _stage.getBoundingClientRect();
      cx = (r.width  / 2 - _pan.x) / _zoom;
      cy = (r.height / 2 - _pan.y) / _zoom;
    }

    // Grid layout. 3 cols × ceil(n/3) rows centered on (cx, cy).
    const COLS    = 3;
    const COL_W   = 220;
    const ROW_H   = 80;
    const n       = spec.picks.length;
    const rows    = Math.max(1, Math.ceil(n / COLS));
    const startX  = cx - ((COLS - 1) * COL_W) / 2 - 100;
    const startY  = cy - ((rows - 1) * ROW_H) / 2 - 20;

    let added = 0;
    spec.picks.forEach((nodeId, i) => {
      const node = nodeIndex.get(nodeId);
      if (!node) return;   // silently drop missing nodes
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      addCard({
        id:    node.id,
        label: node.title || node.id,
        x:     Math.round(startX + col * COL_W),
        y:     Math.round(startY + row * ROW_H),
      });
      added++;
    });
    return added;
  }

  // Dev seeder — drops 3 demo cards to verify pan/zoom/drag without
  // needing the contextual pill (step 4) to be wired yet.
  function seedTest() {
    addCard({ id: 'demo-1', label: 'Akhenaten',         x:  120, y:  140 });
    addCard({ id: 'demo-2', label: 'Aten hymn 14C BCE', x:  360, y:  240 });
    addCard({ id: 'demo-3', label: 'Psalm 104',         x:  120, y:  340 });
  }

  // Step 6 — edge visibility toggle. Body class drives the CSS hide.
  // LS-persists the preference so it survives reloads.
  function setEdgesVisible(on) {
    _edgesVisible = !!on;
    document.body.classList.toggle('boards-edges-hidden', !_edgesVisible);
    try { localStorage.setItem('atlas.boards.edges-visible', _edgesVisible ? '1' : '0'); } catch (_) {}
  }
  function isEdgesVisible() { return _edgesVisible; }

  window._boardsView = {
    render:           render,
    unmount:          unmount,
    addCard:          addCard,
    removeCard:       removeCard,
    clearBoard:       clearBoard,
    loadPreset:       loadPreset,
    getState:         getState,
    setEdgesVisible:  setEdgesVisible,
    isEdgesVisible:   isEdgesVisible,
    rebuildEdges:     rebuildEdges,
    seedTest:         seedTest,
  };
})();
