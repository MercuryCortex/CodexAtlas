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
    clearBoard:       clearBoard,
    loadPreset:       loadPreset,
    getState:         getState,
    setEdgesVisible:  setEdgesVisible,
    isEdgesVisible:   isEdgesVisible,
    rebuildEdges:     rebuildEdges,  // exposed for step 7 right-click expansion
    seedTest:         seedTest,
  };
})();
