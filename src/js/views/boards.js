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
  let _marqueeState = null; // { startScreenX, startScreenY, el }
  const _selected = new Set();   // card IDs currently selected
  let _spaceHeld = false;        // space-key state for pan-mode override

  // ── SEALED-LOOP STATE (2026-07-16, alpha) ────────────────────
  // _dirty = the board has user changes since the last save/load. Drives
  // the gold "unsaved" dot on the Save-tree pill (boards-controls listens
  // to `boards:dirty-changed`). Cleared by save/load, set by any mutation.
  let _dirty = false;
  function markDirty() {
    if (_dirty) return;
    _dirty = true;
    document.dispatchEvent(new CustomEvent('boards:dirty-changed', { detail: { dirty: true } }));
  }
  function markClean() {
    if (!_dirty) return;
    _dirty = false;
    document.dispatchEvent(new CustomEvent('boards:dirty-changed', { detail: { dirty: false } }));
  }

  // Empty-state card — shown on the stage when the board has no cards, so a
  // first-time tester meets an invitation instead of a black void. Its two
  // actions re-fire the existing pill buttons (single source of truth for the
  // Add-node picker + Investigation library — no duplicated wiring).
  function updateEmptyState() {
    if (!_stage) return;
    const empty = _cards.size === 0;
    let el = _stage.querySelector('.boards-empty');
    if (empty && !el) {
      el = document.createElement('div');
      el.className = 'boards-empty';
      el.innerHTML = [
        '<div class="boards-empty-card">',
        '  <div class="boards-empty-glyph">✦</div>',
        '  <h2 class="boards-empty-title">An empty board is a question.</h2>',
        '  <p class="boards-empty-sub">Pin gods, books and symbols side by side — the Atlas draws the wires it already knows between them.</p>',
        '  <div class="boards-empty-actions">',
        '    <button type="button" class="btn btn-mini boards-empty-add">Add node ▾</button>',
        '    <button type="button" class="btn btn-mini boards-empty-lib">Open library ▾</button>',
        '  </div>',
        '</div>',
      ].join('');
      el.querySelector('.boards-empty-add').addEventListener('click', () => {
        const b = document.getElementById('app-pill-boards-addnode');
        if (b) b.click();
      });
      el.querySelector('.boards-empty-lib').addEventListener('click', () => {
        const b = document.getElementById('app-pill-boards-investigation');
        if (b) b.click();
      });
      _stage.appendChild(el);
    } else if (!empty && el) {
      el.parentNode.removeChild(el);
    }
  }

  // "Sealed" toast — the felt confirmation on save. Serif name does the brand
  // work, mono receipt the signal work. Auto-dismisses; reduced-motion safe
  // (CSS handles the entrance). One at a time — replaces any live toast.
  function showSealedToast(name, count) {
    const prior = document.querySelector('.boards-toast');
    if (prior && prior.parentNode) prior.parentNode.removeChild(prior);
    const t = document.createElement('div');
    t.className = 'boards-toast';
    t.setAttribute('role', 'status');
    const n = (typeof count === 'number') ? count : _cards.size;
    t.innerHTML = [
      '<span class="boards-toast-glyph">✦</span>',
      '<span class="boards-toast-title">Sealed — <em>' + escapeHtml(name || 'Untitled board') + '</em></span>',
      '<span class="boards-toast-meta">' + n + ' node' + (n === 1 ? '' : 's') + '</span>',
    ].join('');
    document.body.appendChild(t);
    // force reflow then add .in so the CSS transition runs on first paint
    void t.offsetWidth;
    t.classList.add('is-in');
    setTimeout(() => {
      t.classList.remove('is-in');
      setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
    }, 2600);
  }

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
  // V2 card design (2026-05-28): 200px wide × 112px tall collapsed,
  // ~210px tall expanded. cardCenter reads live offset dimensions so
  // expand-toggles re-route lines correctly.
  const CARD_W = 200;
  const CARD_H_COLLAPSED = 112;
  function cardCenter(card) {
    if (card.el) {
      return {
        x: card.x + (card.el.offsetWidth  || CARD_W) / 2,
        y: card.y + (card.el.offsetHeight || CARD_H_COLLAPSED) / 2,
      };
    }
    return { x: card.x + CARD_W / 2, y: card.y + CARD_H_COLLAPSED / 2 };
  }
  // Edge-routing — find where the line from this card's center toward
  // another point exits the card's rectangle. So the wire doesn't
  // disappear behind the card body; it touches the card RIM and runs
  // entirely in the empty space between cards. Returns the rim point.
  function cardEdgePoint(card, towardX, towardY) {
    const w = ((card.el && card.el.offsetWidth)  || CARD_W) / 2;
    const h = ((card.el && card.el.offsetHeight) || CARD_H_COLLAPSED) / 2;
    const cx = card.x + w;
    const cy = card.y + h;
    const dx = towardX - cx;
    const dy = towardY - cy;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    // Scale factor that lands on the closest rectangle edge.
    const tx = (dx === 0) ? Infinity : w / Math.abs(dx);
    const ty = (dy === 0) ? Infinity : h / Math.abs(dy);
    const t = Math.min(tx, ty);
    return { x: cx + t * dx, y: cy + t * dy };
  }
  function rebuildEdges() {
    if (!_edgesSvg) return;
    const vault = window.VAULT_DATA || window.DATA || null;
    if (!vault || !Array.isArray(vault.edges) || _cards.size < 2) {
      _edgesSvg.innerHTML = '';
      return;
    }
    const cardSet = _cards;
    const EB = window.EDGE_BUCKET || {};
    // Walk vault.edges once; emit a <line> for each whose endpoints are
    // both on the board. 21k+ edges so this loop matters — keep it tight.
    // Lines run card-RIM to card-RIM (not center-to-center) so they don't
    // disappear behind the card bodies — every wire is fully visible in
    // the empty space between cards. data-bucket drives per-bucket color.
    const lines = [];
    for (let i = 0; i < vault.edges.length; i++) {
      const e = vault.edges[i];
      if (!e) continue;
      const a = cardSet.get(e.source);
      const b = cardSet.get(e.target);
      if (!a || !b) continue;
      const ca = cardCenter(a);
      const cb = cardCenter(b);
      // Route line from each card's rim toward the other card's center.
      const pa = cardEdgePoint(a, cb.x, cb.y);
      const pb = cardEdgePoint(b, ca.x, ca.y);
      const bucket = EB[e.type] || 'association';
      lines.push(
        '<line x1="' + pa.x + '" y1="' + pa.y + '"'
        +    ' x2="' + pb.x + '" y2="' + pb.y + '"'
        +    ' class="boards-edge-line"'
        +    ' data-bucket="' + bucket + '"'
        +    (e.type ? ' data-kind="' + escapeHtml(e.type) + '"' : '')
        + ' />'
      );
    }
    _edgesSvg.innerHTML = lines.join('');
  }

  // ── CARD BUILDER (V2 design: uniform compact, thumbnail + chevron expand) ────
  // Per John 2026-05-28: "the cards have all the same thumbnail size compact
  // with image and the light information of classes, with a drop to expand
  // to more — naturally the side panel is where all info then comes."
  //
  // Card shape (collapsed, ~200×112):
  //   ┌──────────────────┐
  //   │  [thumbnail]     │  fixed 200×60 cover; type-glyph fallback
  //   ├──────────────────┤
  //   │ Title  …      ⌄  │  1-line ellipsis title + expand chevron
  //   │ PERSON · 1370BCE │  light meta (type · era)
  //   └──────────────────┘
  // When expanded (~200×210): adds tradition line + 2-line body excerpt +
  // "Open inspector →" link.

  // Type → glyph fallback (when node has no thumbnail). Matches the
  // sidebar/wheel iconography John already lives with.
  const TYPE_GLYPH = {
    person:       '✎',
    deity:        '☉',
    document:     '❡',
    theme:        '◇',
    event:        '⎯',
    symbol:       '✦',
    place:        '⌖',
    'sacred-site': '☽',
    tradition:    '∴',
    ritual:       '⚖',
    music:        '♫',
    pattern:      '∞',
    observation:  '◉',
  };
  function typeGlyph(t) { return TYPE_GLYPH[t] || '○'; }

  // Fast vault lookup — only needed at card-build time so card.label can
  // be enriched with type/era/body for the expanded panel. Read each time
  // (cheap; nodes already in memory). Returns null if not in vault.
  function lookupVaultNode(id) {
    const v = window.VAULT_DATA || window.DATA;
    if (!v || !Array.isArray(v.nodes)) return null;
    return v.nodes.find(n => n && n.id === id) || null;
  }
  function formatEra(node) {
    if (!node) return '';
    const lo = node.date_earliest, hi = node.date_latest;
    if (lo == null && hi == null) return '';
    const fmt = y => (y < 0 ? Math.abs(y) + ' BCE' : y + ' CE');
    if (lo != null && hi != null && lo !== hi) return fmt(lo) + ' – ' + fmt(hi);
    return fmt(lo != null ? lo : hi);
  }
  function bodyExcerpt(node, lines) {
    if (!node || !node.body) return '';
    // Strip markdown headings + wikilinks, take first paragraph(s).
    const raw = node.body
      .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1')   // [[link|alias]] → link
      .replace(/^#+\s.*$/gm, '')                         // drop ## headings
      .replace(/\*\*([^*]+)\*\*/g, '$1')                 // drop bold
      .replace(/\*([^*]+)\*/g, '$1')                     // drop italic
      .trim();
    return raw.slice(0, lines * 90);
  }

  function buildCardEl(card) {
    const node = lookupVaultNode(card.id);
    const el = document.createElement('div');
    el.className = 'boards-card';
    el.dataset.cardId = card.id;
    el.style.left = card.x + 'px';
    el.style.top  = card.y + 'px';

    const type = (node && node.type) || '';
    const tradition = (node && node.tradition) || '';
    const era = formatEra(node);
    const thumbUrl = node && node.thumbnail;
    const excerpt = bodyExcerpt(node, 2);

    // Thumbnail OR fallback glyph stripe (always present at fixed height
    // so card sizes stay uniform regardless of image availability).
    const thumbHtml = thumbUrl
      ? '<div class="boards-card-thumb"><img loading="lazy" decoding="async" src="' + escapeHtml(thumbUrl) + '" alt=""/></div>'
      : '<div class="boards-card-thumb boards-card-thumb--fallback" data-type="' + escapeHtml(type) + '">'
        + '<span class="boards-card-glyph">' + typeGlyph(type) + '</span>'
        + '</div>';

    // Meta line — TYPE · ERA (or just one if the other is missing).
    const metaBits = [];
    if (type) metaBits.push(escapeHtml(type));
    if (era)  metaBits.push(escapeHtml(era));
    const metaHtml = metaBits.length
      ? '<div class="boards-card-meta">' + metaBits.join(' · ') + '</div>'
      : '';

    // Expanded-only content (lives in the DOM but hidden via CSS until
    // the user toggles the chevron; rendering it always keeps the chevron
    // animation snappy and lets the inspector handoff stay 1 click away).
    const expandedHtml = [
      '<div class="boards-card-expanded">',
        (tradition ? '<div class="boards-card-tradition">' + escapeHtml(tradition) + '</div>' : ''),
        (excerpt   ? '<div class="boards-card-excerpt">' + escapeHtml(excerpt) + '…</div>' : '<div class="boards-card-excerpt boards-card-excerpt--empty">No body text recorded.</div>'),
        '<button class="boards-card-open-inspector" type="button" data-action="open-inspector">Open inspector →</button>',
      '</div>',
    ].join('');

    el.innerHTML = [
      thumbHtml,
      '<div class="boards-card-body">',
        '<div class="boards-card-title-row">',
          '<span class="boards-card-label">' + escapeHtml(card.label) + '</span>',
          '<button class="boards-card-expand" type="button" title="Expand / collapse" aria-label="Expand">⌄</button>',
        '</div>',
        metaHtml,
      '</div>',
      expandedHtml,
    ].join('');

    // Wire the chevron — toggles .is-expanded on the card. Stop the click
    // from bubbling into the drag/select path.
    const expandBtn = el.querySelector('.boards-card-expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        el.classList.toggle('is-expanded');
        expandBtn.textContent = el.classList.contains('is-expanded') ? '⌃' : '⌄';
        // Edges re-route on size change. setTimeout(0) instead of rAF
        // for reliability in backgrounded tabs / headless.
        setTimeout(rebuildEdges, 0);
      });
    }
    // Wire the inspector handoff button.
    const inspBtn = el.querySelector('.boards-card-open-inspector');
    if (inspBtn) {
      inspBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openInspector(card.id);
      });
    }

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
      if (wasMove) markDirty();          // moving a card is an unsaved change
      if (!wasMove) handleCardClick(card, ev);
    };
    el.addEventListener('pointerup',     finishDrag);
    el.addEventListener('pointercancel', finishDrag);

    // Step 8 — double-click → open the Boards inspector for this card.
    el.addEventListener('dblclick', (ev) => {
      ev.stopPropagation();
      openInspector(card.id);
    });
  }

  // ── CARD CLICK / SELECTION ────────────────────────────────────
  // Single-click: toggle just that card. Shift+click (handled by the
  // pointerdown's shift-marquee path) is the multi-select path.
  function handleCardClick(card, ev) {
    if (ev && ev.shiftKey) {
      // Shift-click adds (or removes) the card from the existing selection
      // without resetting other selected cards.
      if (_selected.has(card.id)) deselectCard(card.id);
      else selectCard(card.id);
      return;
    }
    // Plain click — single-select replace.
    clearSelection();
    selectCard(card.id);
  }

  function selectCard(cardId) {
    _selected.add(cardId);
    const c = _cards.get(cardId);
    if (c && c.el) c.el.classList.add('is-selected');
    syncMultiBar();
  }
  function deselectCard(cardId) {
    _selected.delete(cardId);
    const c = _cards.get(cardId);
    if (c && c.el) c.el.classList.remove('is-selected');
    syncMultiBar();
  }
  function clearSelection() {
    _selected.forEach(id => {
      const c = _cards.get(id);
      if (c && c.el) c.el.classList.remove('is-selected');
    });
    _selected.clear();
    syncMultiBar();
  }

  // ── MARQUEE (step 8) ─────────────────────────────────────────
  // Shift+drag on the stage draws a marquee in SCREEN-SPACE. On
  // pointerup, every card whose screen-space bounding box intersects
  // the marquee gets `.is-selected`.
  function updateMarquee(curX, curY) {
    if (!_marqueeState) return;
    const x = Math.min(_marqueeState.startScreenX, curX);
    const y = Math.min(_marqueeState.startScreenY, curY);
    const w = Math.abs(curX - _marqueeState.startScreenX);
    const h = Math.abs(curY - _marqueeState.startScreenY);
    // Marquee element is fixed-positioned via CSS; assign top/left/width/height.
    const stageRect = _stage.getBoundingClientRect();
    _marqueeState.el.style.left   = (x - stageRect.left) + 'px';
    _marqueeState.el.style.top    = (y - stageRect.top)  + 'px';
    _marqueeState.el.style.width  = w + 'px';
    _marqueeState.el.style.height = h + 'px';
  }
  function finishMarquee() {
    if (!_marqueeState) return;
    const r = _marqueeState.el.getBoundingClientRect();
    if (r.width > 4 && r.height > 4) {
      _cards.forEach(card => {
        if (!card.el) return;
        const cr = card.el.getBoundingClientRect();
        const intersects = !(cr.right < r.left || cr.left > r.right || cr.bottom < r.top || cr.top > r.bottom);
        if (intersects) selectCard(card.id);
      });
    }
    if (_marqueeState.el.parentNode) _marqueeState.el.parentNode.removeChild(_marqueeState.el);
    _marqueeState = null;
  }

  // ── MULTI-CARD TOOLBAR (step 8) ─────────────────────────────
  // Floats above the bottom-center of the stage when selection > 1.
  // Shows: "N selected · [Delete] [Group] [Clear]".
  let _multiBarEl = null;
  function ensureMultiBar() {
    if (_multiBarEl && _multiBarEl.parentNode) return _multiBarEl;
    const bar = document.createElement('div');
    bar.className = 'boards-multi-bar';
    bar.id = 'boards-multi-bar';
    bar.innerHTML = [
      '<span class="boards-multi-bar-count" id="boards-multi-bar-count">0 selected</span>',
      '<button class="boards-multi-bar-btn" data-action="group" type="button" title="Pull selected cards into a tight cluster around their centroid">Group</button>',
      '<button class="boards-multi-bar-btn boards-multi-bar-btn--danger" data-action="delete" type="button" title="Remove selected cards from the board">Delete</button>',
      '<button class="boards-multi-bar-btn boards-multi-bar-btn--ghost" data-action="clear" type="button" title="Deselect everything">Clear</button>',
    ].join('');
    bar.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button[data-action]');
      if (!btn) return;
      ev.stopPropagation();
      const action = btn.getAttribute('data-action');
      if (action === 'delete') deleteSelected();
      else if (action === 'group') groupSelected();
      else if (action === 'clear') clearSelection();
    });
    if (_stage) _stage.appendChild(bar);
    _multiBarEl = bar;
    return bar;
  }
  function syncMultiBar() {
    if (_selected.size === 0) {
      if (_multiBarEl && _multiBarEl.parentNode) _multiBarEl.parentNode.removeChild(_multiBarEl);
      _multiBarEl = null;
      return;
    }
    const bar = ensureMultiBar();
    const count = bar.querySelector('.boards-multi-bar-count');
    if (count) count.textContent = _selected.size + ' selected';
  }
  function deleteSelected() {
    const ids = Array.from(_selected);
    ids.forEach(id => removeCard(id));
    clearSelection();
  }
  function groupSelected() {
    if (_selected.size < 2) return;
    // Compute centroid, then place selected cards in a tight 2-col grid
    // around it.
    const ids = Array.from(_selected);
    const sel = ids.map(id => _cards.get(id)).filter(Boolean);
    const cx = sel.reduce((s, c) => s + c.x, 0) / sel.length;
    const cy = sel.reduce((s, c) => s + c.y, 0) / sel.length;
    const cols = 2;
    const COL_W = 230;
    const ROW_H = 130;
    const rows = Math.ceil(sel.length / cols);
    const startX = cx - ((cols - 1) * COL_W) / 2;
    const startY = cy - ((rows - 1) * ROW_H) / 2;
    sel.forEach((c, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      c.x = Math.round(startX + col * COL_W);
      c.y = Math.round(startY + row * ROW_H);
      if (c.el) { c.el.style.left = c.x + 'px'; c.el.style.top = c.y + 'px'; }
    });
    rebuildEdges();
  }

  // ── PAN / ZOOM ATTACH ────────────────────────────────────────
  function attachPanZoom() {
    if (!_stage) return;

    // Pan / marquee on empty stage. Figma/Miro-style interaction:
    //   · plain LEFT-drag          → MARQUEE (default)
    //   · MIDDLE-click drag        → PAN
    //   · SPACE held + left-drag   → PAN
    //   · SHIFT held + left-drag   → MARQUEE additive (V1 = fresh select)
    _stage.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.boards-card')) return;
      if (ev.target.closest('.boards-multi-bar')) return;
      const isPanIntent = (ev.button === 1) || (ev.button === 0 && _spaceHeld);
      if (ev.button !== 0 && ev.button !== 1) return;
      try { _stage.setPointerCapture(ev.pointerId); } catch (_) {}

      if (isPanIntent) {
        _panState = {
          startX: ev.clientX, startY: ev.clientY,
          origX:  _pan.x,     origY:  _pan.y,
        };
        _stage.classList.add('is-panning');
        ev.preventDefault();   // suppress middle-click autoscroll
        return;
      }

      // Left-drag on empty → marquee (default).
      clearSelection();
      const m = document.createElement('div');
      m.className = 'boards-marquee';
      _stage.appendChild(m);
      _marqueeState = {
        startScreenX: ev.clientX,
        startScreenY: ev.clientY,
        el: m,
      };
    });
    _stage.addEventListener('pointermove', (ev) => {
      if (_marqueeState) {
        updateMarquee(ev.clientX, ev.clientY);
        return;
      }
      if (!_panState) return;
      _pan.x = _panState.origX + (ev.clientX - _panState.startX);
      _pan.y = _panState.origY + (ev.clientY - _panState.startY);
      applyTransform();
    });
    const endPan = () => {
      if (_marqueeState) { finishMarquee(); return; }
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
    updateEmptyState();   // invitation card when the board is empty
    // Initial edge pass — defer one tick so card .offsetWidth is measurable.
    // setTimeout(0) instead of rAF (rAF doesn't fire in backgrounded tabs
    // or headless browsers; we just need to wait one tick for layout).
    setTimeout(rebuildEdges, 0);
  }

  function unmount() {
    _pane = _stage = _world = null;
    _panState = _dragState = null;
    closeInspector();   // step 8 — don't leave the panel hanging on view-swap
    // _cards intentionally preserved so the next render() rehydrates.
  }

  // Step 8 — global Escape closes the inspector when open.
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && document.body.classList.contains('boards-inspector-open')) {
      closeInspector();
    }
  });

  // Space-held pan mode — Figma/Miro convention. When the user holds
  // space on the Boards view, the stage cursor changes to "grab" and
  // a left-drag will pan instead of marqueeing. Released → back to
  // marquee mode. Guarded against firing when typing in an input.
  document.addEventListener('keydown', (ev) => {
    if (ev.code !== 'Space') return;
    if (ev.target && /^(INPUT|TEXTAREA)$/.test(ev.target.tagName)) return;
    if (!document.body.classList.contains('view-boards')) return;
    if (_spaceHeld) return;
    _spaceHeld = true;
    if (_stage) _stage.classList.add('is-pan-mode');
    ev.preventDefault();
  });
  document.addEventListener('keyup', (ev) => {
    if (ev.code !== 'Space') return;
    _spaceHeld = false;
    if (_stage) _stage.classList.remove('is-pan-mode');
  });
  // Lose-focus safety: drop the space-held flag when window blurs so a
  // user who alt-tabs while holding space doesn't return to a stuck
  // pan-mode cursor.
  window.addEventListener('blur', () => {
    _spaceHeld = false;
    if (_stage) _stage.classList.remove('is-pan-mode');
  });

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
      // setTimeout(0) instead of requestAnimationFrame because rAF is
      // unreliable in backgrounded tabs and in headless browsers used
      // for testing — same "defer one tick" semantics, runs regardless.
      setTimeout(rebuildEdges, 0);
    }
    markDirty();
    updateEmptyState();
    return card;
  }

  function getState() {
    return {
      pan:  { x: _pan.x, y: _pan.y },
      zoom: _zoom,
      cards: Array.from(_cards.values()).map(c => ({
        id: c.id, label: c.label, x: c.x, y: c.y,
      })),
      // 2026-05-29 — expose selection size so the global Delete/Backspace
      // handler in VIEWS.boards.render can no-op on empty selection.
      selected: _selected,
      selectionCount: _selected.size,
    };
  }

  // Step 5 — clear all cards from the board (used by loadPreset's
  // replace mode; future Save/Load board switches will reuse this).
  function clearBoard() {
    _cards.forEach(c => { if (c.el && c.el.parentNode) c.el.parentNode.removeChild(c.el); });
    _cards.clear();
    rebuildEdges();   // step 6 — clear any rendered edges
    updateEmptyState();
  }

  // Step 7 — remove a single card by id.
  function removeCard(cardId) {
    const card = _cards.get(cardId);
    if (!card) return false;
    if (card.el && card.el.parentNode) card.el.parentNode.removeChild(card.el);
    _cards.delete(cardId);
    rebuildEdges();
    markDirty();
    updateEmptyState();
    return true;
  }

  // ── STEP 9 — LS PERSISTENCE at atlas.boards.v1 ──────────────
  // Shape:
  //   {
  //     boards: [
  //       { id, name, cards: [{id,label,x,y}], pan: {x,y}, zoom, createdAt, updatedAt }
  //     ],
  //     currentBoardId: <id|null>,
  //   }
  //
  // Save is explicit (Save tree button → name prompt). The current-board
  // pointer is updated on every save/load so a page reload can restore
  // the last loaded board (handled by syncFromLS() in render()).

  const LS_KEY = 'atlas.boards.v1';

  function loadLS() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return { boards: [], currentBoardId: null };
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.boards)) return { boards: [], currentBoardId: null };
      return parsed;
    } catch (_) { return { boards: [], currentBoardId: null }; }
  }
  function saveLS(state) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('[boards] saveLS failed', e); }
  }
  function currentSnapshot() {
    return {
      cards: Array.from(_cards.values()).map(c => ({
        id: c.id, label: c.label, x: c.x, y: c.y,
      })),
      pan:  { x: _pan.x, y: _pan.y },
      zoom: _zoom,
    };
  }
  function genBoardId() {
    return 'b-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  }

  // Save the current state as a NEW board with the given name. Returns
  // the saved board entry (with id/createdAt/updatedAt).
  function saveCurrentBoard(name) {
    const state = loadLS();
    const snap = currentSnapshot();
    const now = Date.now();
    const board = {
      id:        genBoardId(),
      name:      String(name || 'Untitled board').slice(0, 80),
      cards:     snap.cards,
      pan:       snap.pan,
      zoom:      snap.zoom,
      createdAt: now,
      updatedAt: now,
    };
    state.boards.unshift(board);     // newest first
    state.currentBoardId = board.id;
    // Cap at 100 boards to avoid LS bloat — drop the oldest.
    if (state.boards.length > 100) state.boards.length = 100;
    saveLS(state);
    markClean();
    showSealedToast(board.name, board.cards.length);
    document.dispatchEvent(new CustomEvent('boards:library-changed', { detail: { kind: 'save', id: board.id } }));
    return board;
  }

  // Update an existing saved board with the current state.
  function updateBoard(id, name) {
    const state = loadLS();
    const idx = state.boards.findIndex(b => b.id === id);
    if (idx < 0) return null;
    const snap = currentSnapshot();
    const next = Object.assign({}, state.boards[idx], {
      cards:     snap.cards,
      pan:       snap.pan,
      zoom:      snap.zoom,
      updatedAt: Date.now(),
    });
    if (typeof name === 'string') next.name = name.slice(0, 80);
    state.boards[idx] = next;
    state.currentBoardId = id;
    saveLS(state);
    markClean();
    showSealedToast(next.name, (next.cards || []).length);
    document.dispatchEvent(new CustomEvent('boards:library-changed', { detail: { kind: 'update', id: id } }));
    return next;
  }

  function loadBoardById(id) {
    const state = loadLS();
    const board = state.boards.find(b => b.id === id);
    if (!board) return null;
    // Replace current cards + pan + zoom.
    clearBoard();
    _pan.x = (board.pan && board.pan.x) || 0;
    _pan.y = (board.pan && board.pan.y) || 0;
    _zoom  = board.zoom || 1;
    applyTransform();
    (board.cards || []).forEach(c => addCard(c));
    state.currentBoardId = id;
    saveLS(state);
    markClean();
    updateEmptyState();
    document.dispatchEvent(new CustomEvent('boards:library-changed', { detail: { kind: 'load', id: id } }));
    return board;
  }

  function deleteBoardById(id) {
    const state = loadLS();
    const before = state.boards.length;
    state.boards = state.boards.filter(b => b.id !== id);
    if (state.currentBoardId === id) state.currentBoardId = null;
    saveLS(state);
    const changed = state.boards.length !== before;
    if (changed) document.dispatchEvent(new CustomEvent('boards:library-changed', { detail: { kind: 'delete', id: id } }));
    return changed;
  }

  function listBoards() {
    return loadLS().boards;
  }
  function currentBoardId() {
    return loadLS().currentBoardId;
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
      x: c.x + CARD_W / 2, y: c.y + CARD_H_COLLAPSED / 2,
    }));
    const R = 250;       // ring radius (bigger to fit 200×112 cards)
    const minDist = 230; // min distance between card centers
    let ring = 1;
    let placed = 0;
    while (placed < needN && ring < 6) {
      const slots = 6 * ring;
      for (let i = 0; i < slots && placed < needN; i++) {
        const angle = (Math.PI * 2 / slots) * i + ring * 0.18;
        const x = Math.round(cx + R * ring * Math.cos(angle) - CARD_W / 2);
        const y = Math.round(cy + R * ring * Math.sin(angle) - CARD_H_COLLAPSED / 2);
        const cxi = x + CARD_W / 2, cyi = y + CARD_H_COLLAPSED / 2;
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

    const cx = sourceCard.x + CARD_W / 2;
    const cy = sourceCard.y + CARD_H_COLLAPSED / 2;
    const slots = radialLayout(cx, cy, fresh.length);

    let added = 0;
    fresh.forEach((id, i) => {
      const slot = slots[i] || { x: cx + 220 * (i % 4) - CARD_W / 2, y: cy + 130 * Math.floor(i / 4) - CARD_H_COLLAPSED / 2 };
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
    // Spacing is tuned for the V2 card size (200×112 collapsed).
    const COLS    = 3;
    const COL_W   = 230;
    const ROW_H   = 140;
    const n       = spec.picks.length;
    const rows    = Math.max(1, Math.ceil(n / COLS));
    const startX  = cx - ((COLS - 1) * COL_W) / 2 - CARD_W / 2;
    const startY  = cy - ((rows - 1) * ROW_H) / 2 - CARD_H_COLLAPSED / 2;

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

  // ── STEP 8 — BOARDS INSPECTOR (right-side slide-in) ──────────
  // Dbl-clicking a card opens this panel showing the node's full
  // detail — title, type/tradition/era badges, markdown body via
  // window.marked, refs list, theme list, and if the node has a
  // SCRIPTURE_TEXTS entry, an "Open scripture reader" button that
  // hands off to the legacy reader.
  //
  // Why not reuse the Forge side-panel: it's tightly coupled to the
  // Forge engine internals (local state, computeFaceObjectPosition,
  // toggleLock, triggerClickPulse) and doesn't expose a clean
  // show(nodeId) public API. A standalone V2-native panel is
  // simpler, safer, and matches the legacy-isolation cardinal.
  //
  // The panel is appended to <body> once on first open, then re-
  // populated on each subsequent open. CSS slide-in animation;
  // body class .boards-inspector-open drives the open/closed.

  let _inspectorEl   = null;
  let _inspectorNodeId = null;

  function ensureInspector() {
    if (_inspectorEl) return _inspectorEl;
    const el = document.createElement('aside');
    el.className = 'boards-inspector';
    el.id = 'boards-inspector';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<button class="boards-inspector-close" type="button" aria-label="Close inspector">×</button><div class="boards-inspector-body" id="boards-inspector-body"></div>';
    document.body.appendChild(el);
    el.querySelector('.boards-inspector-close').addEventListener('click', closeInspector);
    _inspectorEl = el;
    return el;
  }

  function openInspector(nodeId) {
    const vault = window.VAULT_DATA || window.DATA || null;
    if (!vault || !Array.isArray(vault.nodes)) return;
    const node = vault.nodes.find(n => n && n.id === nodeId);
    if (!node) return;

    const el = ensureInspector();
    _inspectorNodeId = nodeId;
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('boards-inspector-open');

    // ── Match the Forge side-panel's structure exactly. Same class
    // vocabulary so it inherits the existing .forge-side-panel-* CSS
    // (the canonical V2 inspector look — used for deities, persons,
    // documents, etc., on the Forge wheel). Re-using V2 class names
    // across V2 surfaces is correct (single source of truth); the
    // legacy-isolation cardinal only forbids reusing legacy .alch-*
    // / .nh-* names from the V01 prototype.

    const tradition = node.tradition || '';
    const familyCol = node.family_color || node.tradition_color || '#888';
    const desc = node.label || '';   // short subtitle ("the Egyptian sun god of...")
    const bodyText = node.body || '';

    const dateStr = (() => {
      const lo = node.date_earliest, hi = node.date_latest;
      if (lo == null && hi == null) return '';
      const fmt = y => (y < 0 ? Math.abs(y) + ' BCE' : y + ' CE');
      if (lo != null && hi != null && lo !== hi) return fmt(lo) + ' – ' + fmt(hi);
      return fmt(lo != null ? lo : hi);
    })();

    // ── Wires section — pill row + per-bucket expandable neighbor lists.
    // Mirrors the Forge deity panel's wire-bucket tabs: click a bucket
    // pill → toggle the matching <details> open → see every neighbor in
    // that bucket → click title to swap inspector to that node, click
    // "+ Add" to drop the neighbor as a card on the board.
    const nodeIndex = new Map();
    vault.nodes.forEach(n => { if (n && n.id) nodeIndex.set(n.id, n); });

    const wiresHtml = (() => {
      const edges = (vault.edges || []).filter(e => e.source === nodeId || e.target === nodeId);
      if (!edges.length) return '';
      const EB = window.EDGE_BUCKET || {};
      const buckets = {};
      edges.forEach(e => {
        const b = EB[e.type] || e.type || 'association';
        if (!buckets[b]) buckets[b] = [];
        const otherId = (e.source === nodeId) ? e.target : e.source;
        const otherNode = nodeIndex.get(otherId);
        if (!otherNode) return;
        buckets[b].push({
          id: otherId,
          title: otherNode.title || otherNode.id,
          type: otherNode.type || '',
          color: otherNode.family_color || otherNode.tradition_color || '#888',
          dir: (e.source === nodeId) ? 'out' : 'in',
          edgeType: e.type,
        });
      });
      // Per-bucket dot color — matches the boards-edge-line colors below
      // so the pill's dot reads as the same wire on the board.
      const BUCKET_COLOR = {
        transmission: '#d4a55a', parallel: '#a78bfa', fusion: '#fb923c',
        attestation:  '#86efac', kinship:  '#7dd3fc', polemic: '#f87171',
        association:  '#9ca3af',
      };
      const entries = Object.entries(buckets).sort((a, b) => b[1].length - a[1].length).slice(0, 10);
      const pills = entries.map(([b, neighbors]) => {
        const color = BUCKET_COLOR[b] || '#9ca3af';
        return (
          '<button class="forge-side-panel-wire boards-wire-pill" type="button" data-bucket="' + escapeHtml(b) + '"'
          + ' aria-expanded="false" title="Click to expand neighbors in this bucket">'
          +   '<span class="forge-side-panel-wire-dot" style="background:' + color + '"></span>'
          +   neighbors.length + ' <em>' + escapeHtml(b) + '</em>'
          + '</button>'
        );
      }).join('');
      // Per-bucket neighbor lists rendered below the pill row. Hidden by
      // default; toggled on pill click. dedupe-by-id since the same
      // neighbor can appear via multiple edge kinds in the same bucket.
      const lists = entries.map(([b, neighbors]) => {
        const seen = new Set();
        const uniq = neighbors.filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; });
        const items = uniq.map(n => {
          const alreadyOnBoard = _cards.has(n.id);
          return (
            '<div class="boards-wire-neighbor" data-neighbor-id="' + escapeHtml(n.id) + '"'
            +   (alreadyOnBoard ? ' data-on-board="1"' : '') + '>'
            +   '<span class="boards-wire-neighbor-dir">' + (n.dir === 'out' ? '→' : '←') + '</span>'
            +   '<span class="boards-wire-neighbor-dot" style="background:' + escapeHtml(n.color) + '"></span>'
            +   '<button class="boards-wire-neighbor-title" type="button" data-action="open-neighbor" data-id="' + escapeHtml(n.id) + '">'
            +     escapeHtml(n.title)
            +   '</button>'
            +   (n.type ? '<span class="boards-wire-neighbor-type">' + escapeHtml(n.type) + '</span>' : '')
            +   '<button class="boards-wire-neighbor-add" type="button" data-action="add-neighbor" data-id="' + escapeHtml(n.id) + '"'
            +     (alreadyOnBoard ? ' disabled title="Already on board"' : ' title="Drop this node as a card on the board"') + '>'
            +     (alreadyOnBoard ? '✓' : '+')
            +   '</button>'
            + '</div>'
          );
        }).join('');
        return (
          '<div class="boards-wire-list" data-bucket="' + escapeHtml(b) + '" hidden>'
          +   '<div class="boards-wire-list-header">'
          +     uniq.length + ' ' + escapeHtml(b) + ' neighbor' + (uniq.length === 1 ? '' : 's')
          +   '</div>'
          +   items
          + '</div>'
        );
      }).join('');
      return '<div class="forge-side-panel-wires">' + pills + '</div>' + lists;
    })();

    // ── Meta dl/dt/dd grid (Date / Place / Domains).
    const metaRows = [];
    if (dateStr) metaRows.push('<dt>Date</dt><dd>' + escapeHtml(dateStr) + '</dd>');
    if (node.region || node.geo) {
      const place = node.region || (node.geo && node.geo.name) || '';
      if (place) metaRows.push('<dt>Place</dt><dd>' + escapeHtml(place) + '</dd>');
    }
    if (Array.isArray(node.domains) && node.domains.length) {
      metaRows.push('<dt>Domains</dt><dd>' + escapeHtml(node.domains.join(', ')) + '</dd>');
    }
    if (Array.isArray(node.themes) && node.themes.length) {
      metaRows.push('<dt>Themes</dt><dd>' + node.themes.slice(0, 8).map(escapeHtml).join(', ') + '</dd>');
    }
    if (node.language) metaRows.push('<dt>Lang</dt><dd>' + escapeHtml(node.language) + '</dd>');
    if (node.dating_basis) {
      const dbasis = node.dating_basis || 'b3';
      metaRows.push(
        '<dt>Basis</dt><dd class="forge-side-panel-dating-basis forge-side-panel-dating-basis--'
        + escapeHtml(String(dbasis).toLowerCase()) + '">'
        + escapeHtml(node.dating_basis_source || dbasis) + '</dd>'
      );
    }
    const metaHtml = metaRows.length
      ? '<dl class="forge-side-panel-meta">' + metaRows.join('') + '</dl>'
      : '';

    // ── Body extract — render markdown if available.
    const extractHtml = (() => {
      if (node.thumb_extract) {
        return '<div class="forge-side-panel-extract">' + escapeHtml(node.thumb_extract) + '</div>';
      }
      if (!bodyText) return '';
      let rendered = '';
      if (window.marked && typeof window.marked.parse === 'function') {
        try { rendered = window.marked.parse(bodyText); } catch (_) {}
      }
      if (!rendered) rendered = '<pre>' + escapeHtml(bodyText) + '</pre>';
      return '<div class="forge-side-panel-extract">' + rendered + '</div>';
    })();

    // ── Refs list (Tier-grouped).
    const refsHtml = (() => {
      if (!Array.isArray(node.refs) || !node.refs.length) return '';
      const items = node.refs.slice(0, 12).map(r => {
        if (typeof r === 'string') return '<li>' + escapeHtml(r) + '</li>';
        const cite = (r.author ? escapeHtml(r.author) : '')
          + (r.title ? (r.author ? ' · ' : '') + '<em>' + escapeHtml(r.title) + '</em>' : '')
          + (r.year ? ' (' + escapeHtml(String(r.year)) + ')' : '');
        const tier = r.tier ? ' <span class="boards-inspector-ref-tier">' + escapeHtml(r.tier) + '</span>' : '';
        return '<li>' + cite + tier + '</li>';
      });
      return '<dl class="forge-side-panel-meta" style="margin-top:14px;"><dt>Sources</dt><dd><ul class="boards-inspector-refs">' + items.join('') + '</ul></dd></dl>';
    })();

    // ── Wikipedia link.
    const wikiHtml = node.thumb_page
      ? '<a class="forge-side-panel-wikilink" href="' + escapeHtml(node.thumb_page) + '" target="_blank" rel="noopener noreferrer">Open Wikipedia ↗</a>'
      : '';

    // ── Scripture handoff button.
    const scriptureKey = (() => {
      const st = window.SCRIPTURE_TEXTS || {};
      if (st[nodeId]) return nodeId;
      for (const k in st) { if (st[k] && st[k].docNode === nodeId) return k; }
      return null;
    })();
    const readBtnHtml = scriptureKey
      ? '<button class="forge-side-panel-read-btn" type="button" data-textkey="' + escapeHtml(scriptureKey) + '">✠ Open in reader</button>'
      : '';

    // ── Thumbnail.
    const thumbHtml = node.thumbnail
      ? '<div class="forge-side-panel-thumb"><img src="' + escapeHtml(node.thumbnail) + '" loading="lazy" decoding="async" alt=""/></div>'
      : '';

    const innerBody = el.querySelector('.boards-inspector-body');
    innerBody.innerHTML = (
      '<div class="forge-side-panel-content" style="--family-color:' + escapeHtml(familyCol) + ';">'
      +   thumbHtml
      +   '<div class="forge-side-panel-header">'
      +     '<div class="forge-side-panel-name">' + escapeHtml(node.title || node.id) + '</div>'
      +     (tradition ? '<div class="forge-side-panel-tradition">' + escapeHtml(tradition) + '</div>' : '')
      +   '</div>'
      +   (desc ? '<div class="forge-side-panel-desc">' + escapeHtml(desc) + '</div>' : '')
      +   wiresHtml
      +   metaHtml
      +   extractHtml
      +   wikiHtml
      +   readBtnHtml
      +   refsHtml
      + '</div>'
    );

    // Scripture-handoff button wiring.
    const readBtn = innerBody.querySelector('.forge-side-panel-read-btn');
    if (readBtn) {
      readBtn.addEventListener('click', () => {
        const tk = readBtn.getAttribute('data-textkey');
        if (window.STATE) window.STATE.scriptureReaderMode = tk;
        if (typeof window.setView === 'function') window.setView('scripture');
      });
    }

    // Wire-bucket pill toggle + neighbor click handlers (event-delegated
    // on innerBody so the handler survives re-renders cleanly).
    innerBody.addEventListener('click', (ev) => {
      // 1. Pill click → toggle the matching .boards-wire-list visibility.
      const pill = ev.target.closest('.boards-wire-pill');
      if (pill) {
        ev.stopPropagation();
        const bucket = pill.getAttribute('data-bucket');
        const list = innerBody.querySelector('.boards-wire-list[data-bucket="' + CSS.escape(bucket) + '"]');
        if (!list) return;
        const isOpen = !list.hidden;
        // Close all other lists (single-open accordion).
        innerBody.querySelectorAll('.boards-wire-list').forEach(l => l.hidden = true);
        innerBody.querySelectorAll('.boards-wire-pill').forEach(p => p.setAttribute('aria-expanded', 'false'));
        if (!isOpen) {
          list.hidden = false;
          pill.setAttribute('aria-expanded', 'true');
        }
        return;
      }
      // 2. Neighbor title click → swap inspector to that node.
      const openBtn = ev.target.closest('[data-action="open-neighbor"]');
      if (openBtn) {
        ev.stopPropagation();
        const nid = openBtn.getAttribute('data-id');
        if (nid) openInspector(nid);
        return;
      }
      // 3. "+ Add" → drop the neighbor as a card on the board.
      const addBtn = ev.target.closest('[data-action="add-neighbor"]');
      if (addBtn && !addBtn.disabled) {
        ev.stopPropagation();
        const nid = addBtn.getAttribute('data-id');
        if (!nid) return;
        const sourceCard = _cards.get(_inspectorNodeId);
        if (sourceCard) {
          addNodesAround(sourceCard, [nid]);
        } else {
          // Source isn't on the board (shouldn't happen since inspector
          // opens from a card dblclick, but be defensive).
          const n = nodeIndex.get(nid);
          if (n) addCard({ id: nid, label: n.title || nid, x: 200, y: 200 });
        }
        // Mark this neighbor row as "on board" without re-rendering.
        addBtn.disabled = true;
        addBtn.textContent = '✓';
        addBtn.title = 'Already on board';
        const row = addBtn.closest('.boards-wire-neighbor');
        if (row) row.setAttribute('data-on-board', '1');
        return;
      }
    });
  }

  function closeInspector() {
    if (!_inspectorEl) return;
    _inspectorEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('boards-inspector-open');
    _inspectorNodeId = null;
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
    deleteSelected:   deleteSelected,   // 2026-05-29 — keyboard Delete/Backspace
    clearBoard:       clearBoard,
    loadPreset:       loadPreset,
    getState:         getState,
    setEdgesVisible:  setEdgesVisible,
    isEdgesVisible:   isEdgesVisible,
    rebuildEdges:     rebuildEdges,
    openInspector:    openInspector,
    closeInspector:   closeInspector,
    // Step 9 — LS persistence
    saveCurrentBoard: saveCurrentBoard,
    updateBoard:      updateBoard,
    loadBoardById:    loadBoardById,
    deleteBoardById:  deleteBoardById,
    listBoards:       listBoards,
    currentBoardId:   currentBoardId,
    seedTest:         seedTest,
  };
})();
