// ============================================================
// CODEX ATLAS — FORGE HOVER CARD
// ============================================================
//
// Phase 23.1f RETRY (2026-05-25 NIGHT) — fresh carve.
//
// AST-VALIDATED DEPS: { canvas, computeFaceObjectPosition, local, stage }
// BOUNDARY CONTRACT:
//   window._forgeHoverCard.attach({ canvas, computeFaceObjectPosition, local, stage })
// ============================================================
(function () {
  function attach({ canvas, computeFaceObjectPosition, local, stage }) {
    let thumbs = null;
    fetch('_assets/thumbs_cache.json', { cache: 'force-cache' })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        thumbs = j || {};
        local._thumbsCache = thumbs;
      })
      .catch(() => { thumbs = {}; local._thumbsCache = {}; });

    const card = document.createElement('div');
    card.className   = 'forge-hover-card';
    card.id          = 'forge-hover-card';
    // Phase 24-PRIMITIVE-FIX (2026-05-26) — opacity-fade visibility.
    // Default state (no is-shown class) = CSS opacity:0. Show toggles
    // the class for a smooth 140ms fade.
    card.innerHTML = ''
      + '<div class="forge-hover-card-thumb">'
      +   '<img id="forge-hover-card-img" alt="" />'
      + '</div>'
      + '<div class="forge-hover-card-body">'
      +   '<div class="forge-hover-card-name" id="forge-hover-card-name"></div>'
      +   '<div class="forge-hover-card-tradition" id="forge-hover-card-tradition"></div>'
      +   '<div class="forge-hover-card-desc" id="forge-hover-card-desc"></div>'
      +   '<div class="forge-hover-card-wires" id="forge-hover-card-wires"></div>'
      +   '<div class="forge-hover-card-meta" id="forge-hover-card-meta"></div>'
      + '</div>';
    stage.appendChild(card);
    const img       = card.querySelector('#forge-hover-card-img');
    const nameEl    = card.querySelector('#forge-hover-card-name');
    const tradEl    = card.querySelector('#forge-hover-card-tradition');
    const descEl    = card.querySelector('#forge-hover-card-desc');
    const wiresEl   = card.querySelector('#forge-hover-card-wires');
    const metaEl    = card.querySelector('#forge-hover-card-meta');

    function bucketHex(bucket) {
      const p = local.params || {};
      return p['active_color_' + bucket] || '#999999';
    }
    function pickDescription(n) {
      const candidates = [
        n.role, n.description, n.brief, n.subtitle,
        Array.isArray(n.domains) ? n.domains.join(', ') : null,
      ];
      for (const c of candidates) if (c && typeof c === 'string') return c;
      return '';
    }
    function pickPlace(n) {
      return n.region
          || n['place-of-origin']
          || n['originating-place']
          || n.location
          || n.origin
          || '';
    }
    function pickTradition(n) {
      return n.tradition || n.family || n.religion || '';
    }
    function fmtYear(y) {
      if (typeof y !== 'number' || !isFinite(y)) return '';
      if (y < 0) return Math.abs(y) + ' BCE';
      if (y === 0) return '0';
      return y + ' CE';
    }
    function pickDate(n) {
      const e = (typeof n.date_earliest === 'number') ? n.date_earliest
              : (typeof n['period-active-earliest'] === 'number') ? n['period-active-earliest']
              : null;
      const l = (typeof n.date_latest === 'number') ? n.date_latest
              : (typeof n['period-active-latest'] === 'number') ? n['period-active-latest']
              : null;
      if (e == null && l == null) return '';
      if (e != null && l != null && e !== l) return fmtYear(e) + ' – ' + fmtYear(l);
      return fmtYear(e != null ? e : l);
    }
    function countWires(id) {
      const counts = Object.create(null);
      const edges = local.mode && local.mode.edges;
      if (!edges) return counts;
      const EB = window.EDGE_BUCKET || {};
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        if (e.source !== id && e.target !== id) continue;
        const b = EB[e.type] || 'association';
        counts[b] = (counts[b] || 0) + 1;
      }
      return counts;
    }
    const BUCKET_ORDER = ['transmission','parallel','association','kinship','attestation','polemic','fusion'];

    const OFFSET = 38;
    const MARGIN = 8;

    let showId      = 0;
    let posRafId    = 0;
    let lastClientX = 0;
    let lastClientY = 0;
    let cachedW     = 0;
    let cachedH     = 0;
    let anchorX     = +1;
    let anchorY     = +1;

    function hide() {
      if (showId) { clearTimeout(showId); showId = 0; }
      if (posRafId) { cancelAnimationFrame(posRafId); posRafId = 0; }
      // Phase 24-PRIMITIVE-FIX — opacity-fade out, no display change
      // (CSS .is-shown class flip triggers the 140ms fade).
      card.classList.remove('is-shown');
    }

    function measure() {
      const r = card.getBoundingClientRect();
      if (r.width > 0)  cachedW = r.width;
      if (r.height > 0) cachedH = r.height;
    }

    function pickAnchor() {
      const w = cachedW, h = cachedH;
      const winW = window.innerWidth, winH = window.innerHeight;
      const cx = lastClientX, cy = lastClientY;
      const tries = [[+1, +1], [-1, +1], [+1, -1], [-1, -1]];
      for (const [qx, qy] of tries) {
        let x = qx > 0 ? cx + OFFSET            : cx - OFFSET - w;
        let y = qy > 0 ? cy + OFFSET            : cy - OFFSET - h;
        if (x >= MARGIN && x + w + MARGIN <= winW
            && y >= MARGIN && y + h + MARGIN <= winH) {
          anchorX = qx;
          anchorY = qy;
          return;
        }
      }
      anchorX = +1; anchorY = +1;
    }

    function applyTransform() {
      const w = cachedW, h = cachedH;
      if (!w || !h) return;
      const winW = window.innerWidth, winH = window.innerHeight;
      const cx = lastClientX, cy = lastClientY;
      let x = anchorX > 0 ? cx + OFFSET : cx - OFFSET - w;
      let y = anchorY > 0 ? cy + OFFSET : cy - OFFSET - h;
      if (x < MARGIN || x + w + MARGIN > winW) {
        anchorX = -anchorX;
        x = anchorX > 0 ? cx + OFFSET : cx - OFFSET - w;
      }
      if (y < MARGIN || y + h + MARGIN > winH) {
        anchorY = -anchorY;
        y = anchorY > 0 ? cy + OFFSET : cy - OFFSET - h;
      }
      if (x < MARGIN) x = MARGIN;
      if (x + w + MARGIN > winW) x = winW - w - MARGIN;
      if (y < MARGIN) y = MARGIN;
      if (y + h + MARGIN > winH) y = winH - h - MARGIN;
      card.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
    }

    function schedulePosition() {
      if (posRafId) return;
      posRafId = requestAnimationFrame(() => {
        posRafId = 0;
        applyTransform();
      });
    }

    function showFor(id) {
      const m = local.mode;
      const node = (m && m.nodesById && m.nodesById.get) ? m.nodesById.get(id) : null;
      if (!node) return;
      nameEl.textContent = node.name || id;
      tradEl.textContent = pickTradition(node);
      tradEl.style.display = tradEl.textContent ? '' : 'none';
      let desc = pickDescription(node);
      if (!desc && thumbs && thumbs[id] && thumbs[id].extract) {
        const ext = String(thumbs[id].extract);
        const cut = ext.split(/(?<=[.!?])\s/)[0] || ext;
        desc = cut.length > 180 ? cut.slice(0, 177) + '…' : cut;
      }
      descEl.textContent = desc || '';
      descEl.style.display = desc ? '' : 'none';
      const counts = countWires(id);
      const pills = [];
      for (const b of BUCKET_ORDER) {
        const n = counts[b] || 0;
        if (!n) continue;
        pills.push(
          '<span class="forge-hover-card-wire" style="color:' + bucketHex(b) + '">'
          +   '<span class="forge-hover-card-wire-dot" style="background:' + bucketHex(b) + '"></span>'
          +   n
          + '</span>'
        );
      }
      wiresEl.innerHTML = pills.join('');
      wiresEl.style.display = pills.length ? '' : 'none';
      const date  = pickDate(node);
      const place = pickPlace(node);
      const metaParts = [];
      if (date)  metaParts.push('<div class="forge-hover-card-meta-row"><span class="forge-hover-card-meta-k">Date</span><span class="forge-hover-card-meta-v">' + date  + '</span></div>');
      if (place) metaParts.push('<div class="forge-hover-card-meta-row"><span class="forge-hover-card-meta-k">Place</span><span class="forge-hover-card-meta-v">' + place + '</span></div>');
      metaEl.innerHTML = metaParts.join('');
      metaEl.style.display = metaParts.length ? '' : 'none';
      const entry = (thumbs && thumbs[id]) ? thumbs[id] : null;
      img.style.display = 'none';
      img.removeAttribute('src');
      if (entry && entry.src) {
        img.onload  = function () {
          img.style.display = 'block';
          img.style.objectPosition = computeFaceObjectPosition(img.naturalWidth, img.naturalHeight);
          measure();
          schedulePosition();
        };
        img.onerror = function () {
          img.style.display = 'none';
          measure();
          schedulePosition();
        };
        img.src = entry.src;
      }
      // Phase 24-PRIMITIVE-FIX — opacity-fade in via CSS class.
      card.classList.add('is-shown');
      measure();
      pickAnchor();
      applyTransform();
    }

    canvas.addEventListener('mousemove', (e) => {
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      // Phase 24-PRIMITIVE-FIX — check class instead of display style.
      if (card.classList.contains('is-shown')) schedulePosition();
    });

    window.addEventListener('resize', hide);

    local._onHoverChange = function (id) {
      if (showId) { clearTimeout(showId); showId = 0; }
      if (!id) { hide(); return; }
      showId = setTimeout(() => { showId = 0; showFor(id); }, 150);
    };
    canvas.addEventListener('mouseleave', hide);
  }

  window._forgeHoverCard = { attach };
})();
