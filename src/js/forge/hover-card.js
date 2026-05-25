// ============================================================
// CODEX ATLAS — FORGE · HOVER CARD (Phase 23.1f carve)
// ============================================================
// Lift-and-shift of `wireHoverCard()`. PURE REFACTOR.
// Floating thumbnail card next to cursor on node hover.
// Boundary: window._forgeHoverCard.attach({ local, setHoverId })
// ============================================================
(function () {
  'use strict';
  function attach(deps) {
    const local = deps.local;
    const setHoverId = deps.setHoverId;

        // ── Thumbnails cache ────────────────────────────────────
        // Wikipedia thumbnails live in _assets/thumbs_cache.json as
        // { id: { src, title, page, extract, width, height } }.
        // Fetched once at view mount; lookup on hover is then a free
        // Map.get(). The fetch is best-effort — if it fails, the card
        // still renders text but with the thumbnail row hidden.
        let thumbs = null;
        fetch('_assets/thumbs_cache.json', { cache: 'force-cache' })
          .then(r => r.ok ? r.json() : null)
          .then(j => {
            thumbs = j || {};
            // Phase 19 — share the cache with the side panel so both
            // surfaces lookup from the same in-memory map.
            local._thumbsCache = thumbs;
          })
          .catch(() => { thumbs = {}; local._thumbsCache = {}; });

        const card = document.createElement('div');
        card.className   = 'forge-hover-card';
        card.id          = 'forge-hover-card';
        card.style.display = 'none';
        // Layout: thumbnail on top, then header (name + tradition),
        // then the data rows (description, connections, date, place).
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

        // Param-derived bucket → hex color map. Built once per show
        // call so the legend stays the SSOT.
        function bucketHex(bucket) {
          const p = local.params || {};
          return p['active_color_' + bucket] || '#999999';
        }
        // Catchy "role" / brief-description picker. Tries multiple
        // YAML fields in vault-convention order. Empty string if none.
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
        // Year formatter — same shape as the scrubber's formatYear.
        function fmtYear(y) {
          if (typeof y !== 'number' || !isFinite(y)) return '';
          if (y < 0) return Math.abs(y) + ' BCE';
          if (y === 0) return '0';
          return y + ' CE';
        }
        function pickDate(n) {
          // Normalized fields from build_data.py first; YAML raw as fallback.
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
        // Count edges connected to `id`, grouped by bucket. Walks
        // local.mode.edges once. O(E) per show — cheap at 3k edges,
        // could be precomputed if hover frequency demands it.
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
        // Bucket render order — matches the legend's BUCKET_ORDER.
        const BUCKET_ORDER = ['transmission','parallel','association','kinship','attestation','polemic','fusion'];

        // ── Position state ──────────────────────────────────────
        // Phase 17 (2026-05-21) — anchor-once positioning.
        //
        // The card's anchor quadrant (top-right / top-left / bottom-
        // right / bottom-left of the cursor) is picked ONCE at show
        // time and STAYS THERE while the cursor moves. mousemove
        // just translates the card by (cursor + anchor offset) using
        // cached dimensions — no re-measurement, no quadrant
        // re-evaluation, no flicker near screen corners.
        //
        // Re-flip happens only when the cursor moves far enough that
        // the current anchor genuinely doesn't fit (the card would
        // overflow the viewport). That's hysteresis built in for
        // free.
        //
        // Cached dimensions: re-measured (1 layout read) only when
        // content changes — on showFor() and on image-load callback.
        // mousemove does ZERO layout reads. rAF-coalesced so we
        // never write transform more than once per frame.
        //
        // OFFSET = a fixed pad large enough that even a max-clamped
        // selected disk (22 px × 1.5 size_mult ≈ 33 px) doesn't sit
        // under the card. Generous 38 px gives breathing room.
        const OFFSET = 38;
        const MARGIN = 8;

        let showId      = 0;     // setTimeout token
        let posRafId    = 0;     // rAF coalesce token for position updates
        let lastClientX = 0;
        let lastClientY = 0;
        let cachedW     = 0;     // last measured card width
        let cachedH     = 0;     // last measured card height
        let anchorX     = +1;    // +1 = right of cursor, -1 = left
        let anchorY     = +1;    // +1 = below cursor, -1 = above

        function hide() {
          if (showId) { clearTimeout(showId); showId = 0; }
          if (posRafId) { cancelAnimationFrame(posRafId); posRafId = 0; }
          card.style.display = 'none';
        }

        // Single layout read. Stores width + height. Call AFTER
        // content swap and image load — never on mousemove.
        function measure() {
          const r = card.getBoundingClientRect();
          if (r.width > 0)  cachedW = r.width;
          if (r.height > 0) cachedH = r.height;
        }

        // Pick the anchor quadrant that fully fits the card at the
        // current cursor position. Default preference: bottom-right.
        // Falls back through the other 3 quadrants in order. Final
        // fallback: bottom-right + clamp on output.
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

        // Write the transform. No layout reads. Uses cached dims +
        // current anchor + last cursor. If the chosen anchor would
        // now overflow (cursor crossed the edge), flips ONCE and
        // re-evaluates — that's the hysteresis line.
        function applyTransform() {
          const w = cachedW, h = cachedH;
          if (!w || !h) return;
          const winW = window.innerWidth, winH = window.innerHeight;
          const cx = lastClientX, cy = lastClientY;
          let x = anchorX > 0 ? cx + OFFSET : cx - OFFSET - w;
          let y = anchorY > 0 ? cy + OFFSET : cy - OFFSET - h;
          // Flip X if overflowing.
          if (x < MARGIN || x + w + MARGIN > winW) {
            anchorX = -anchorX;
            x = anchorX > 0 ? cx + OFFSET : cx - OFFSET - w;
          }
          // Flip Y if overflowing.
          if (y < MARGIN || y + h + MARGIN > winH) {
            anchorY = -anchorY;
            y = anchorY > 0 ? cy + OFFSET : cy - OFFSET - h;
          }
          // Hard clamp to keep card inside viewport even if both
          // sides overflow (e.g. tiny viewport).
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
          // ── Header
          nameEl.textContent = node.name || id;
          tradEl.textContent = pickTradition(node);
          tradEl.style.display = tradEl.textContent ? '' : 'none';
          // ── Description: try YAML role/description first; fall back
          //    to the cache's Wikipedia extract (first sentence only).
          let desc = pickDescription(node);
          if (!desc && thumbs && thumbs[id] && thumbs[id].extract) {
            const ext = String(thumbs[id].extract);
            // First sentence; cap at 180 chars to keep card compact.
            const cut = ext.split(/(?<=[.!?])\s/)[0] || ext;
            desc = cut.length > 180 ? cut.slice(0, 177) + '…' : cut;
          }
          descEl.textContent = desc || '';
          descEl.style.display = desc ? '' : 'none';
          // ── Wires (colored pills with bucket-edge counts)
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
          // ── Meta (Date + Place)
          const date  = pickDate(node);
          const place = pickPlace(node);
          const metaParts = [];
          if (date)  metaParts.push('<div class="forge-hover-card-meta-row"><span class="forge-hover-card-meta-k">Date</span><span class="forge-hover-card-meta-v">' + date  + '</span></div>');
          if (place) metaParts.push('<div class="forge-hover-card-meta-row"><span class="forge-hover-card-meta-k">Place</span><span class="forge-hover-card-meta-v">' + place + '</span></div>');
          metaEl.innerHTML = metaParts.join('');
          metaEl.style.display = metaParts.length ? '' : 'none';
          // ── Thumbnail: lookup the URL in the cache. The cache's
          //    `src` is a fully-resolved Wikipedia URL; we don't need
          //    a probe.onload chain — just set src directly. onload
          //    re-measures + repositions (image adds height). onerror
          //    hides the image.
          const entry = (thumbs && thumbs[id]) ? thumbs[id] : null;
          img.style.display = 'none';
          img.removeAttribute('src');
          if (entry && entry.src) {
            img.onload  = function () {
              img.style.display = 'block';
              // Phase 21AD (2026-05-22) — face-aware object-position.
              // Portrait images shift upward so the head/face stays in
              // the visible square crop. See computeFaceObjectPosition.
              img.style.objectPosition = computeFaceObjectPosition(img.naturalWidth, img.naturalHeight);
              // Image just added height — re-measure + reposition.
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
          // ── Show + initial position
          card.style.display = '';
          measure();
          pickAnchor();
          applyTransform();
        }

        // mousemove on canvas: track cursor + schedule a position update.
        canvas.addEventListener('mousemove', (e) => {
          lastClientX = e.clientX;
          lastClientY = e.clientY;
          if (card.style.display !== 'none') schedulePosition();
        });

        // window resize invalidates anchor choice (viewport changed).
        // Recompute on next show; for now just hide so user gets a
        // fresh anchor when they hover again.
        window.addEventListener('resize', hide);

        // Drive show/hide from the existing hover pipeline. Phase 2B
        // setHoverId already coalesces; we hook into it via a hover
        // observer in local. setHoverId is the SSOT for "which node
        // is the cursor over."
        //
        // Phase 16 (2026-05-21) — show on locked nodes too. The card
        // was previously hidden when the hovered node was the locked
        // anchor (rationale: lock UI is sufficient). John pushed
        // back: when you point at a locked deity you still want the
        // info card; the lock visual + the card are complementary,
        // not redundant. Removed the lockedSet check.
        local._onHoverChange = function (id) {
          if (showId) { clearTimeout(showId); showId = 0; }
          if (!id) { hide(); return; }
          showId = setTimeout(() => { showId = 0; showFor(id); }, 150);
        };
        // Also hide on canvas leave.
        canvas.addEventListener('mouseleave', hide);
  }
  window._forgeHoverCard = { attach };
})();
