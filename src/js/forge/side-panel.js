// ============================================================
// CODEX ATLAS — FORGE SIDE PANEL (deity inspector)
// ============================================================
//
// Phase 23.1g RETRY (2026-05-25 NIGHT) — fresh carve. THE BIG ONE.
//
// DEPS: { computeFaceObjectPosition, local, toggleLock, triggerClickPulse }
// (AST scanner also flagged `safeAttr` — see SAFEATTR FIX below.)
// BOUNDARY CONTRACT:
//   window._forgeSidePanel.attach({ computeFaceObjectPosition, local, toggleLock, triggerClickPulse })
//
// This is the biggest carve in the series (~860 LOC). Lifts the entire
// deity inspector: tabs, render pipeline, wire-bucket disclosure, tier
// pills + political-risk alerts, cross-folder popup, custom tooltip with
// hover delay, image carousel.
//
// SAFEATTR FIX: AST flagged `safeAttr` as a free ref because the original
// code declared `const safeAttr` INSIDE render() but referenced it from
// sibling showCrossFolderPopup() — a latent ReferenceError bug that
// would have thrown if a user ever clicked a cross-folder neighbor.
// Hoisting safeAttr to attach() scope here fixes both the carve and the
// latent bug. (render() still has its own local safeAttr; it shadows
// but is functionally identical.)
// ============================================================
(function () {
  // Shared HTML-attr escaper at module scope — used by render() AND
  // showCrossFolderPopup() (the latter referenced safeAttr across
  // sibling function scopes in the original, an unfired latent bug).
  const safeAttr = (s) => String(s || '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  function attach({ computeFaceObjectPosition, local, toggleLock, triggerClickPulse }) {
    const inner = document.getElementById('detail-inner');
    if (!inner) return;
    // Build the floating tabs container at the viewport level.
    // Appended to body so it isn't constrained by the forge-stage
    // bounding box — that way it can shift across the panel edge
    // smoothly when the panel opens.
    const tabsEl = document.createElement('div');
    tabsEl.className = 'forge-deity-tabs';
    tabsEl.id        = 'forge-deity-tabs';
    document.body.appendChild(tabsEl);

    local.deityTabs = [];
    local.openTabId = null;

    function setPanelOpen(open) {
      // The existing global panel is collapsed via body.detail-
      // collapsed. In Forge view, our CSS hides aside.detail
      // entirely when that class is present, so toggling it is
      // the SAME as opening/closing for our purposes.
      document.body.classList.toggle('detail-collapsed', !open);
      // Sync data attribute so CSS can shift the tabs column.
      tabsEl.classList.toggle('panel-open', !!open);
    }
    // Phase 21AF (2026-05-22) — expose so the canvas click handler
    // can open the panel on double-click. Local-scope hooks so
    // there's no global pollution.
    local._setPanelOpen = setPanelOpen;
    // Initial state — panel closed.
    setPanelOpen(false);

    // Renders the tab stack from local.deityTabs.
    function renderTabs() {
      // Hide the whole container when empty.
      if (!local.deityTabs.length) {
        tabsEl.innerHTML = '';
        tabsEl.style.display = 'none';
        return;
      }
      tabsEl.style.display = '';
      const m = local.mode;
      const nodesById = (m && m.nodesById) ? m.nodesById : new Map();
      const safe = (s) => String(s || '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      ));
      const html = local.deityTabs.map(id => {
        const n = nodesById.get ? nodesById.get(id) : null;
        const color = (n && (n.family_color || n.tradition_color)) || '#999';
        const title = (n && n.title) || id;
        const isActive = (id === local.openTabId);
        return '<button class="forge-deity-tab' + (isActive ? ' is-active' : '') + '"'
             + ' data-id="' + safe(id) + '"'
             + ' title="' + safe(title) + '">'
             +   '<span class="forge-deity-tab-chevron">' + (isActive ? '›' : '‹') + '</span>'
             +   '<span class="forge-deity-tab-dot" style="background:' + safe(color) + '"></span>'
             + '</button>';
      }).join('');
      tabsEl.innerHTML = html;
    }

    // Trigger pulse animation on a specific tab DOM element.
    function pulseTab(id) {
      renderTabs();   // ensure the tab exists
      const el = tabsEl.querySelector('.forge-deity-tab[data-id="' + id.replace(/"/g, '\\"') + '"]');
      if (!el) return;
      el.classList.remove('pulsing');
      void el.offsetWidth;
      el.classList.add('pulsing');
      clearTimeout(local._sidePanelPulseTimer);
      local._sidePanelPulseTimer = setTimeout(() => {
        el.classList.remove('pulsing');
      }, 2400);
    }

    // Tab click — event delegation on the container.
    tabsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.forge-deity-tab');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      if (!id) return;
      if (id === local.openTabId) {
        // Click active tab → close panel.
        local.openTabId = null;
        setPanelOpen(false);
        renderTabs();
      } else {
        // Switch to this deity.
        local.openTabId = id;
        setPanelOpen(true);
        render();
        renderTabs();
      }
    });

    // Lock-change observer — called by toggleLock with (id, action).
    // action: 'add' | 'remove' | 'clear'.
    local._onLockChange = function (id, action) {
      if (action === 'clear') {
        local.deityTabs = [];
        local.openTabId = null;
        setPanelOpen(false);
        renderTabs();
        return;
      }
      if (action === 'remove' && id != null) {
        const idx = local.deityTabs.indexOf(id);
        if (idx >= 0) local.deityTabs.splice(idx, 1);
        if (local.openTabId === id) {
          local.openTabId = null;
          setPanelOpen(false);
        }
        renderTabs();
        return;
      }
      if (action === 'add' && id != null) {
        if (local.deityTabs.indexOf(id) < 0) local.deityTabs.push(id);
        // Phase 21X (2026-05-22) — fresh lock starts at image #1
        // of the carousel. If the user re-locks the same node, the
        // index resets so they see the curated lead image again.
        if (local._sidePanelImageIdx) delete local._sidePanelImageIdx[id];
        // Phase 21AE+AF (2026-05-22) — optional per-node click
        // pulse on the clicked node. Gated by pulse-enabled +
        // non-floor zoom (floor has its own heartbeat).
        if (local._fxToggles && local._fxToggles['pulse-enabled'] && !local._fxBloomActive) {
          triggerClickPulse(id);
        }
        renderTabs();
        pulseTab(id);
        // If the panel is already open, switch the active deity
        // to the newest add — fresh focus wins.
        if (local.openTabId != null) {
          local.openTabId = id;
          render();
          renderTabs();
        }
        return;
      }
    };

    // Renders the deity inspector content into #detail-inner.
    // Atlas Codex step 5 (2026-05-28) — docNode → textKey reverse
    // index, built lazily once per session. The forward map lives
    // on SCRIPTURE_TEXTS[k].docNode; we invert it so the side panel
    // can ask "given a locked vault doc node id, does it have a
    // reader text we can open?"
    function textKeyForDoc(docNodeId) {
      if (!docNodeId) return null;
      if (!local._docnodeToTextKey) {
        const map = Object.create(null);
        const T = window.SCRIPTURE_TEXTS || {};
        for (const k in T) {
          const t = T[k];
          if (t && t.docNode && typeof t.docNode === 'string') {
            // First-write wins. If two text-keys claim the same
            // docNode, the alphabetically-earlier key takes the
            // slot — a rare collision; the agent's backfill
            // collapsed pauline-epistles to one docNode for many
            // epistle keys, so 'colossians-1' lands first over
            // 'romans-12' alphabetically.
            if (!map[t.docNode]) map[t.docNode] = k;
          }
        }
        local._docnodeToTextKey = map;
      }
      return local._docnodeToTextKey[docNodeId] || null;
    }

    function render() {
      // Phase 22-AH (2026-05-24) — D-fix. Any path that wipes the
      // side panel via `inner.innerHTML = ...` detaches the row
      // the hover-tip is anchored to WITHOUT firing mouseout.
      // The tip then sticks at top-left because positionTip reads
      // zero-rect from the detached row. Symmetric hideTip()
      // before the wipe kills the tip alongside its anchor row.
      try { if (typeof hideTip === 'function') hideTip(); } catch (_) {}
      const id = local.openTabId;
      const m = local.mode;
      const node = (id && m && m.nodesById && m.nodesById.get) ? m.nodesById.get(id) : null;
      if (!node) {
        inner.innerHTML = '<div class="empty">Select a deity to inspect.</div>';
        return;
      }
      // Field readers — use BAKED data.js fields. Falls back
      // through alternates for robustness.
      const title    = node.title || node.name || id;
      const tradition = (node.tradition || node.family || node.religion || '');
      const aka       = Array.isArray(node.aka) ? node.aka.filter(Boolean) : [];
      let desc        = (node.role || node.description || node.brief || node.subtitle || '');
      if (!desc && Array.isArray(node.domains) && node.domains.length) {
        desc = node.domains.join(', ');
      }
      const thumbSrc   = node.thumbnail || '';
      const extract    = String(node.thumb_extract || '');
      const wikiPage   = node.thumb_page || '';
      const place      = (node.region || node['place-of-origin'] || node['originating-place'] || node.location || node.origin || '');
      const domains    = Array.isArray(node.domains) ? node.domains.join(', ') : '';
      const familyCol  = (node.family_color || node.tradition_color || '#888');

      // Wire-bucket counts + per-bucket neighbor lists.
      // Each bucket: { count, neighbors: [{ id, title, family_color, dir, … }] }.
      // dir = 'out' (this node → other) or 'in' (other → this node).
      //
      // Phase 21AV (2026-05-23) — read from the FULL vault.edges set
      // (not local.mode.edges). The deity wedge mode filters edges to
      // deity-deity only — so all cross-folder connections (e.g. a
      // deity → theme/event/person syncretic-edge) were dropped before
      // the side panel ever saw them. That hid every T4 / T5 disclaimer
      // that lives on a deity→theme edge (the entire Sitchin / nibiru-
      // anunnaki batch is exactly this shape). Now the panel surfaces
      // ALL connections incident on this node; out-of-mode neighbors
      // get a subtype tag + are click-disabled (they're not on the
      // wheel to lock). The wheel itself still only paints in-mode
      // wires — that's correct, the wheel is the deity wheel.
      const buckets = Object.create(null);
      // Cache the full vault.nodes by id; reuse across renders.
      if (!local._vaultNodesById) {
        const vd = window.VAULT_DATA;
        const map = new Map();
        if (vd && Array.isArray(vd.nodes)) {
          for (let i = 0; i < vd.nodes.length; i++) {
            const n = vd.nodes[i];
            if (n && n.id) map.set(n.id, n);
          }
        }
        local._vaultNodesById = map;
      }
      const vaultNodesById = local._vaultNodesById;
      const modeNodesById  = (m && m.nodesById) ? m.nodesById : null;
      const vaultEdges     = (window.VAULT_DATA && window.VAULT_DATA.edges) || [];
      // Phase 21AX (2026-05-23) — apply the same tier + political-risk
      // filters in the side panel that the wire renderer uses. The
      // side panel is the disclaimer-machine surface; if the user
      // toggled T5 OFF or politicalRisk OFF, those edges shouldn't
      // leak into the panel either (otherwise the chrome lies about
      // what's "active"). Same composition: tier filter AND political-
      // risk filter, both must pass.
      const sideActiveTiers   = local._activeTiers;
      const sideShowPolitical = !!local._showPoliticalRisk;
      const sideTierFilterOn  = sideActiveTiers && sideActiveTiers.size < 5;
      if (vaultEdges) {
        const EB = window.EDGE_BUCKET || {};
        for (let i = 0; i < vaultEdges.length; i++) {
          const e = vaultEdges[i];
          const isSrc = e.source === id;
          const isTgt = e.target === id;
          if (!isSrc && !isTgt) continue;
          // Apply tier-filter to side panel too.
          const eTier = e.source_tier || 'T1';
          if (sideTierFilterOn && !sideActiveTiers.has(eTier)) continue;
          // Apply political-risk filter to side panel too.
          if (!sideShowPolitical && e.political_risk_flag) continue;
          const b = EB[e.type] || 'association';
          if (!buckets[b]) buckets[b] = { count: 0, neighbors: [] };
          buckets[b].count++;
          const otherId = isSrc ? e.target : e.source;
          const otherNode = vaultNodesById.get(otherId) || null;
          // out-of-mode = the wheel doesn't have this node, so the
          // click-to-lock handler can't do anything useful with it.
          const inMode = !!(modeNodesById && modeNodesById.has && modeNodesById.has(otherId));
          const subtype = otherNode ? (otherNode.type || '') : '';
          buckets[b].neighbors.push({
            id: otherId,
            title: (otherNode && (otherNode.title || otherNode.id)) || otherId,
            color: (otherNode && (otherNode.family_color || otherNode.tradition_color)) || '#888',
            dir: isSrc ? 'out' : 'in',
            inMode,
            subtype,           // 'deity' | 'theme' | 'person' | 'event' | …
            edgeType:  e.type || '',
            tier:      e.source_tier || 'T1',
            source:    e.edge_source || '',
            notes:     e.edge_notes  || '',
            polRisk:   !!e.political_risk_flag,
          });
        }
      }
      const BUCKET_ORDER = ['transmission','parallel','association','kinship','attestation','polemic','fusion'];
      const bucketHex = (b) => (local.params && local.params['active_color_' + b]) || '#999999';
      // Phase 21AV (2026-05-23) — human-readable headers + tooltip
      // labels. Replaces the raw kebab-case slugs (`parallel-form`,
      // `syncretic-negative-identification`) the panel was showing
      // earlier with plain-English phrases the reader can actually
      // parse. Keys cover every type emitted by build_data.py:
      // - the 21 PROTOCOL §3.1 edge types
      // - the syncretic- prefixed variants from syncretic-edges
      // - the legacy types still in older nodes
      // - the plain-list kinship fields (consort/child-of/…)
      const BUCKET_HUMAN = {
        transmission: 'Transmission',
        parallel:     'Parallel',
        association:  'Association',
        kinship:      'Kinship',
        attestation:  'Attestation',
        polemic:      'Polemic',
        fusion:       'Fusion',
      };
      const TYPE_HUMAN = {
        // PROTOCOL §3.1 — Transmission
        'cognate':                     'Cognate (shared linguistic root)',
        'direct-borrowing':            'Direct borrowing',
        'iconographic-borrowing':      'Iconographic borrowing',
        'substrate-influence':         'Substrate influence',
        'continuous-development':      'Continuous development',
        // PROTOCOL §3.1 — Parallel
        'scholarly-parallel':          'Scholarly parallel',
        'parallel-motif':              'Same motif, independent origin',
        'functional-equivalent':       'Functional equivalent',
        'interpretatio-nominal':       'Name mapping across traditions',
        // PROTOCOL §3.1 — Fusion / identification
        'same-as':                     'Identified as same figure',
        'interpretatio-cultic':        'Cult / ritual mapping across traditions',
        'ancient-identification':      'Ancient identification',
        'composite-deity':             'Composite deity (merger)',
        'folk-syncretism':             'Folk syncretism',
        'identification':              'Identification',
        // PROTOCOL §3.1 — Kinship / hierarchy
        'manifestation-of':            'Manifestation / aspect of',
        'avatara-of':                  'Avatara / incarnation of',
        'constituent-of':              'Constituent of',
        // PROTOCOL §3.1 — Polemic
        'polemic-against':             'Polemic — rejects / refutes',
        'polemic-inversion':           'Polemic — inverts opponent',
        'demonization':                'Demonized rival figure',
        'prefiguration-claim':         'Claimed as prefiguration',
        'negative-identification':     'Rejected identification',
        // Legacy / build_data.py defaults
        'parallel-form':               'Parallel form',
        'visual-cognate':              'Visual cognate',
        'ancestor-of':                 'Ancestor of',
        'connects-to':                 'Connected to',
        // Plain-list kinship fields
        'consort':                     'Consort',
        'child-of':                    'Child of',
        'parent-of':                   'Parent of',
        'attested-in':                 'Attested in',
      };
      function humanType(t) {
        if (!t) return '';
        if (TYPE_HUMAN[t]) return TYPE_HUMAN[t];
        // Strip the syncretic- prefix that build_data.py adds for
        // anything from a syncretic-edges block.
        if (t.indexOf('syncretic-') === 0) {
          const tail = t.slice(10);
          if (TYPE_HUMAN[tail]) return TYPE_HUMAN[tail];
          return tail.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
        // Fallback: kebab → Title Case.
        return t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      // Phase 21AV (2026-05-23) — subtype label shown after the
      // neighbor name when the neighbor is NOT a deity (i.e. lives
      // outside the current wheel mode). Keeps the panel honest
      // about cross-folder relationships without misrepresenting
      // them as wheel-clickable.
      const SUBTYPE_HUMAN = {
        theme:       'theme',
        person:      'person',
        event:       'event',
        tradition:   'tradition',
        symbol:      'symbol',
        music:       'music',
        alphabet:    'alphabet',
        alchemy:     'alchemy',
        ritual:      'ritual',
        moral:       'moral',
        philosophy:  'philosophy',
        mathematics: 'mathematics',
        medicine:    'medicine',
      };
      // Each bucket → a <details> block. Summary = colored pill
      // with count + bucket name. Open content = list of neighbor
      // titles (clickable to lock-and-switch to that deity).
      const safeAttr = (s) => String(s || '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      ));
      const pills = BUCKET_ORDER.map(b => {
        const data = buckets[b];
        if (!data) return '';
        // Sort neighbors by title for predictable ordering.
        data.neighbors.sort((x, y) => x.title.localeCompare(y.title));
        const items = data.neighbors.map(n => {
          // Phase 21AS (2026-05-23) — disclaimer-machine row chrome.
          // Phase 21AT (2026-05-23) — tier badge on EVERY row.
          // Phase 21AU (2026-05-23) — store tooltip data on data-*
          // attrs instead of the title="" attribute.
          // Phase 21AV (2026-05-23) — cross-folder neighbors (theme/
          // event/person targets) render with a small subtype tag +
          // are click-disabled (the wheel doesn't have them). The
          // tier badge + tooltip still surface so the disclaimer
          // machine works for cross-folder T4/T5 edges.
          // Phase 21AX (2026-05-23) — CODEX v1.2 — separate the two
          // axes. `risky` (tier===T5) gets the soft ⚠ contested
          // marker; `blackAlert` (political_risk_flag=true) gets
          // the ⛔ HIGH ALERT escalation. The two can co-occur
          // (Icke is both T5 AND political-risk); the visual chrome
          // composes — black left-border + ⛔ + the tier pill.
          const tier        = n.tier || 'T1';
          const tierRisky   = (tier === 'T5');
          const blackAlert  = !!n.polRisk;
          const risky       = tierRisky || blackAlert;   // for legacy is-risky class
          const pillHtml = '<span class="forge-side-panel-wire-item-tier vs-tier-pill vs-tier-pill--' + tier.toLowerCase() + '">' + tier + '</span>';
          const warnHtml = blackAlert
            ? '<span class="forge-side-panel-wire-item-warn forge-side-panel-wire-item-warn--alert" aria-hidden="true">⛔</span>'
            : (tierRisky
                ? '<span class="forge-side-panel-wire-item-warn" aria-hidden="true">⚠</span>'
                : '');
          const subTagHtml = (!n.inMode && n.subtype && SUBTYPE_HUMAN[n.subtype])
            ? '<span class="forge-side-panel-wire-item-subtype">' + SUBTYPE_HUMAN[n.subtype] + '</span>'
            : '';
          const classNames = 'forge-side-panel-wire-item'
            + (risky       ? ' is-risky'       : '')
            + (blackAlert  ? ' is-black-alert' : '')
            + (!n.inMode   ? ' is-cross-folder' : '');
          return '<button class="' + classNames + '"'
            + ' data-id="' + safeAttr(n.id) + '"'
            + ' data-in-mode="' + (n.inMode ? '1' : '0') + '"'
            + ' data-tier="' + safeAttr(tier) + '"'
            + ' data-edge-type="' + safeAttr(n.edgeType || '') + '"'
            + ' data-edge-type-human="' + safeAttr(humanType(n.edgeType)) + '"'
            + ' data-edge-source="' + safeAttr(n.source || '') + '"'
            + ' data-edge-notes="' + safeAttr(n.notes || '') + '"'
            + ' data-edge-dir="' + safeAttr(n.dir) + '"'
            + ' data-edge-target-title="' + safeAttr(n.title) + '"'
            + ' data-edge-target-subtype="' + safeAttr(n.subtype || '') + '"'
            + ' data-edge-risky="' + (risky ? '1' : '0') + '">'
            + '<span class="forge-side-panel-wire-item-dir">' + (n.dir === 'out' ? '→' : '←') + '</span>'
            + '<span class="forge-side-panel-wire-item-dot" style="background:' + safeAttr(n.color) + '"></span>'
            + warnHtml
            + '<span class="forge-side-panel-wire-item-title">' + safeAttr(n.title) + '</span>'
            + subTagHtml
            + pillHtml
            + '</button>';
        }).join('');
        return '<details class="forge-side-panel-wire" data-bucket="' + b + '" style="--bucket-color:' + bucketHex(b) + '">'
          + '<summary class="forge-side-panel-wire-summary">'
          +   '<span class="forge-side-panel-wire-dot" style="background:' + bucketHex(b) + '"></span>'
          +   '<span class="forge-side-panel-wire-count">' + data.count + '</span>'
          +   '<em class="forge-side-panel-wire-name">' + (BUCKET_HUMAN[b] || b) + '</em>'
          +   '<span class="forge-side-panel-wire-caret">▾</span>'
          + '</summary>'
          + '<div class="forge-side-panel-wire-list">' + items + '</div>'
          + '</details>';
      }).filter(Boolean).join('');

      const fmtYear = (y) => {
        if (typeof y !== 'number' || !isFinite(y)) return '';
        if (y < 0) return Math.abs(y) + ' BCE';
        if (y === 0) return '0';
        return y + ' CE';
      };
      const de = (typeof node.date_earliest === 'number') ? node.date_earliest : null;
      const dl = (typeof node.date_latest   === 'number') ? node.date_latest   : null;
      const dateStr = (de == null && dl == null) ? ''
        : (de != null && dl != null && de !== dl) ? (fmtYear(de) + ' – ' + fmtYear(dl))
        : fmtYear(de != null ? de : dl);

      // Phase B-DATING-2 (2026-05-24) — dating_basis surface.
      // Always show the basis tier so the user can audit WHY a
      // node sits where it does on the timeline. Source + notes
      // are optional rows below.
      const dbasis    = node.dating_basis || '';
      const dbSource  = node.dating_basis_source || '';
      const dbNotes   = node.dating_basis_notes || '';
      const DATING_BASIS_LABELS = {
        'B1': 'B1 · primary date',
        'B2': 'B2 · first textual attestation',
        'B3': 'B3 · oldest archaeology',
        'B4': 'B4 · first scripture appearance',
        'B5': 'B5 · scholarly consensus',
        'B6': 'B6 · family-median (soft)',
        'B7': 'B7 · atemporal',
      };
      const dbLabel = DATING_BASIS_LABELS[dbasis] || dbasis;

      const safe = (s) => String(s || '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      ));
      // Phase 21X (2026-05-22) — multi-image carousel.
      // Combine node.depictions[] (curated, with captions + license)
      // + node.thumbnail (auto-fetched from Wikipedia) into a single
      // list. Dedupe by URL. If length > 1, show ← / → arrows + a
      // running index (e.g. "2 / 5"). Index is tracked per-node in
      // local._sidePanelImageIdx so cycling persists while the panel
      // is open, but a fresh lock resets to 0.
      const depictionsList = Array.isArray(node.depictions) ? node.depictions : [];
      const imageList = [];
      const seenUrls = new Set();
      for (const d of depictionsList) {
        if (!d || typeof d.source !== 'string') continue;
        if (seenUrls.has(d.source)) continue;
        seenUrls.add(d.source);
        imageList.push({
          src:         d.source,
          caption:     d.caption || '',
          license:     d.license || '',
          attribution: d.attribution || '',
        });
      }
      if (thumbSrc && !seenUrls.has(thumbSrc)) {
        seenUrls.add(thumbSrc);
        imageList.push({ src: thumbSrc, caption: '', license: '', attribution: 'Wikipedia' });
      }
      if (!local._sidePanelImageIdx) local._sidePanelImageIdx = Object.create(null);
      // Initialize OR clamp the saved index (a re-render after a
      // depictions edit may have shrunk the list).
      let curIdx = local._sidePanelImageIdx[id];
      if (typeof curIdx !== 'number') curIdx = 0;
      if (curIdx < 0) curIdx = 0;
      if (curIdx >= imageList.length) curIdx = Math.max(0, imageList.length - 1);
      local._sidePanelImageIdx[id] = curIdx;

      function carouselHtml() {
        if (!imageList.length) return '';
        const img = imageList[curIdx];
        const total = imageList.length;
        const showArrows = total > 1;
        const captionLine = img.caption ? safe(img.caption) : '';
        const attribLine  = img.attribution ? safe(img.attribution) : '';
        return '<div class="forge-side-panel-thumb' + (showArrows ? ' has-carousel' : '') + '" data-node-id="' + safeAttr(id) + '">'
          + '<img src="' + safe(img.src) + '" alt="' + safe(img.caption || title) + '" />'
          + (showArrows
              ? '<button class="forge-side-panel-thumb-prev" data-thumb-nav="prev" aria-label="Previous image">‹</button>'
              + '<button class="forge-side-panel-thumb-next" data-thumb-nav="next" aria-label="Next image">›</button>'
              : '')
          + (showArrows || captionLine || attribLine
              ? '<div class="forge-side-panel-thumb-meta">'
                + (captionLine ? '<div class="forge-side-panel-thumb-caption">' + captionLine + '</div>' : '')
                + (attribLine  ? '<div class="forge-side-panel-thumb-attribution">' + attribLine + '</div>' : '')
                + (showArrows  ? '<div class="forge-side-panel-thumb-index">' + (curIdx + 1) + ' / ' + total + '</div>' : '')
                + '</div>'
              : '')
          + '</div>';
      }
      inner.innerHTML = '<div class="forge-side-panel-content" style="--family-color:' + safe(familyCol) + '">'
        + carouselHtml()
        + '<div class="forge-side-panel-header">'
        +   '<div class="forge-side-panel-name">' + safe(title) + '</div>'
        +   (aka.length ? '<div class="forge-side-panel-aka">' + aka.map(safe).join(' · ') + '</div>' : '')
        +   (tradition ? '<div class="forge-side-panel-tradition">' + safe(tradition) + '</div>' : '')
        + '</div>'
        + (desc ? '<div class="forge-side-panel-desc">' + safe(desc) + '</div>' : '')
        + (pills ? '<div class="forge-side-panel-wires">' + pills + '</div>' : '')
        + '<dl class="forge-side-panel-meta">'
        +   (dateStr ? '<dt>Date</dt><dd>' + safe(dateStr) + '</dd>' : '')
        // Phase B-DATING-2 (2026-05-24) — dating-basis rows.
        // Always show the basis tier; source + notes optional.
        +   (dbLabel  ? '<dt>Basis</dt><dd class="forge-side-panel-dating-basis forge-side-panel-dating-basis--' + safeAttr(dbasis.toLowerCase()) + '">' + safe(dbLabel) + '</dd>' : '')
        +   (dbSource ? '<dt>Source</dt><dd>' + safe(dbSource) + '</dd>' : '')
        +   (dbNotes  ? '<dt>Notes</dt><dd class="forge-side-panel-dating-notes">' + safe(dbNotes) + '</dd>' : '')
        +   (place   ? '<dt>Place</dt><dd>' + safe(place)   + '</dd>' : '')
        +   (domains ? '<dt>Domains</dt><dd>' + safe(domains) + '</dd>' : '')
        + '</dl>'
        + (extract ? '<div class="forge-side-panel-extract">' + safe(extract) + '</div>' : '')
        + (wikiPage ? '<a class="forge-side-panel-wikilink" href="' + safe(wikiPage) + '" target="_blank" rel="noopener noreferrer">Open Wikipedia ↗</a>' : '')
        // Atlas Codex step 5 (2026-05-28) — Open-in-reader button
        // for any locked doc node whose docNode field is claimed
        // by a SCRIPTURE_TEXTS entry. The reader overlay handles
        // the rest (Step 3 module already wired).
        + (() => {
            if (!node || node.type !== 'document') return '';
            const tk = textKeyForDoc(id);
            if (!tk) return '';
            return '<button class="forge-side-panel-read-btn" data-codex-read="' + safeAttr(tk) + '" type="button">✠ Open in reader</button>';
          })()
        + '</div>';

      // Phase 21AD (2026-05-22) — face-aware object-position on the
      // carousel image. Same heuristic as the hover card: portraits
      // shift up to keep the head visible inside the square crop.
      const thumbImg = inner.querySelector('.forge-side-panel-thumb img');
      if (thumbImg) {
        const setPos = () => {
          thumbImg.style.objectPosition = computeFaceObjectPosition(
            thumbImg.naturalWidth, thumbImg.naturalHeight
          );
        };
        if (thumbImg.complete && thumbImg.naturalWidth > 0) setPos();
        else thumbImg.addEventListener('load', setPos, { once: true });
      }
    }

    local._renderSidePanel = render;
    // Phase 21AG (2026-05-22) — expose renderTabs so the canvas
    // double-click handler can refresh the active-tab marker
    // immediately when it switches openTabId.
    local._renderTabs = renderTabs;

    // Phase 19D — click a neighbor inside an expanded wire list →
    // lock + switch the panel to that deity. Event-delegated on
    // the global inner so it works for every render pass without
    // re-binding.
    inner.addEventListener('click', (e) => {
      // Atlas Codex step 5 (2026-05-28) — Open-in-reader button.
      // Check FIRST so it short-circuits before the carousel /
      // neighbor-click paths. Reader API installed by
      // install-public-api.js attaches to window._forge.openReader.
      const readBtn = e.target.closest('[data-codex-read]');
      if (readBtn) {
        e.stopPropagation();
        const tk = readBtn.getAttribute('data-codex-read');
        if (tk && window._forge && typeof window._forge.openReader === 'function') {
          window._forge.openReader(tk);
        }
        return;
      }
      // Phase 21X (2026-05-22) — carousel arrows. Check first since
      // the buttons live inside .forge-side-panel-thumb which would
      // otherwise pass through to other handlers.
      const navBtn = e.target.closest('[data-thumb-nav]');
      if (navBtn) {
        e.stopPropagation();
        const direction = navBtn.getAttribute('data-thumb-nav');
        const thumbBox  = navBtn.closest('.forge-side-panel-thumb');
        const targetId  = thumbBox && thumbBox.getAttribute('data-node-id');
        if (!targetId || !local._renderSidePanel) return;
        // Compute total via the node's combined image list, mirror
        // of the render-time logic. We re-derive instead of caching
        // so the count stays correct if the data changes underneath.
        const nodeRec = (local.mode && local.mode.nodesById && local.mode.nodesById.get(targetId)) || null;
        if (!nodeRec) return;
        const deps  = Array.isArray(nodeRec.depictions) ? nodeRec.depictions : [];
        const seen  = new Set();
        let total   = 0;
        for (const d of deps) { if (d && d.source && !seen.has(d.source)) { seen.add(d.source); total++; } }
        if (nodeRec.thumbnail && !seen.has(nodeRec.thumbnail)) total++;
        if (total <= 1) return;
        if (!local._sidePanelImageIdx) local._sidePanelImageIdx = Object.create(null);
        let cur = local._sidePanelImageIdx[targetId];
        if (typeof cur !== 'number') cur = 0;
        if (direction === 'next') cur = (cur + 1) % total;
        else                      cur = (cur - 1 + total) % total;
        local._sidePanelImageIdx[targetId] = cur;
        // Re-render the side panel (cheap; the panel is small).
        local._renderSidePanel();
        return;
      }
      const item = e.target.closest('.forge-side-panel-wire-item');
      if (!item) return;
      const targetId = item.getAttribute('data-id');
      if (!targetId) return;
      // Phase 22-AH (2026-05-25) — cross-folder click handler.
      // Per audit C: pre-22-AH this early-returned silently. Now
      // cross-folder rows open an action popup with the target
      // info + "Open in <view>" button so the user can FOLLOW
      // the wire across master-view types (Themes / Persons /
      // Events / etc). The popup is also a slot for future
      // actions (Show reference, Copy link, Open in new tab, …).
      if (item.getAttribute('data-in-mode') !== '1') {
        showCrossFolderPopup(item);
        return;
      }
      // Lock only if not already locked (toggleLock toggles).
      if (!local.lockedSet.has(targetId)) {
        toggleLock(targetId);    // adds + pulses tab + (if open) renders
      } else {
        // Already locked: just switch the panel to it.
        local.openTabId = targetId;
        render();
        renderTabs();
      }
    });

    // Phase 22-AH (2026-05-25) — cross-folder popup. Anchored to
    // the clicked row; offers "Open in <view> view" + dismiss.
    // Reusable shell — future commits can stack more actions
    // (Show reference, Copy link, Open thumb modal, etc.).
    function showCrossFolderPopup(rowEl) {
      if (!rowEl) return;
      const targetId   = rowEl.getAttribute('data-id') || '';
      const targetName = rowEl.getAttribute('data-edge-target-title') || targetId;
      const subtype    = rowEl.getAttribute('data-edge-target-subtype') || '';
      // Subtype → master view name. Today only the Deities wheel
      // is fully wired; other targets stay informational until
      // their master views ship.
      const VIEW_FOR = {
        deity:       { id: 'forge',  label: 'Deities',  available: true  },
        theme:       { id: 'forge',  label: 'Themes',   available: true  },
        person:      { id: 'forge',  label: 'Persons',  available: true  },
        event:       { id: 'forge',  label: 'Events',   available: true  },
        tradition:   { id: 'forge',  label: 'Traditions', available: true  },
        symbol:      { id: 'forge',  label: 'Symbols',  available: true  },
        music:       { id: 'forge',  label: 'Music',    available: false },
        alphabet:    { id: 'forge',  label: 'Alphabets',available: false },
        alchemy:     { id: 'forge',  label: 'Alchemy',  available: false },
        ritual:      { id: 'forge',  label: 'Practices',available: false },
        moral:       { id: 'forge',  label: 'Moral',    available: false },
        philosophy:  { id: 'forge',  label: 'Philosophy',available: false },
        mathematics: { id: 'forge',  label: 'Mathematics',available: false },
        medicine:    { id: 'forge',  label: 'Medicine', available: false },
      };
      const dest = VIEW_FOR[subtype] || { label: subtype || 'this folder', available: false };

      // Remove any existing popup first (single-instance).
      const old = document.getElementById('forge-side-cross-pop');
      if (old && old.parentNode) old.parentNode.removeChild(old);

      const pop = document.createElement('div');
      pop.id = 'forge-side-cross-pop';
      pop.className = 'forge-side-cross-pop';
      pop.innerHTML =
        '<div class="forge-side-cross-pop-head">' +
          '<span class="forge-side-cross-pop-title">' + safeAttr(targetName) + '</span>' +
          '<button class="forge-side-cross-pop-close" type="button" aria-label="Close">×</button>' +
        '</div>' +
        '<div class="forge-side-cross-pop-sub">' + safeAttr(subtype || 'cross-folder') + '</div>' +
        '<div class="forge-side-cross-pop-actions">' +
          (dest.available
            ? '<button class="forge-side-cross-pop-action" data-action="open-mode" data-mode="' + safeAttr(subtype) + '">Switch master view → ' + safeAttr(dest.label) + '</button>'
            : '<div class="forge-side-cross-pop-pending">' + safeAttr(dest.label) + ' view — coming soon</div>') +
        '</div>';

      // Anchor: drop the popup to the LEFT of the clicked row
      // (side panel is right-anchored). Use fixed positioning so
      // panel scroll doesn't drag it along.
      const rRow = rowEl.getBoundingClientRect();
      pop.style.position = 'fixed';
      pop.style.top  = (rRow.top - 4) + 'px';
      pop.style.right = (window.innerWidth - rRow.left + 12) + 'px';
      document.body.appendChild(pop);

      function close() {
        if (pop.parentNode) pop.parentNode.removeChild(pop);
        document.removeEventListener('mousedown', onOutside, true);
        document.removeEventListener('keydown', onEsc, true);
      }
      function onOutside(e) {
        if (pop.contains(e.target)) return;
        if (rowEl.contains(e.target)) return;
        close();
      }
      function onEsc(e) { if (e.key === 'Escape') close(); }
      pop.querySelector('.forge-side-cross-pop-close').addEventListener('click', close);
      const actBtn = pop.querySelector('.forge-side-cross-pop-action');
      if (actBtn) {
        actBtn.addEventListener('click', function () {
          // Switch class filter to the target's subtype mode if
          // it's a recognized one. Today this maps subtypes onto
          // the Deities wheel's mode list — a placeholder until
          // the other master views land. Future expansion: emit
          // a `codex:nav` event the shell catches.
          const mode = actBtn.getAttribute('data-mode');
          if (mode && window._forge && typeof window._forge.setClassFilter === 'function') {
            try { window._forge.setClassFilter(mode); } catch (_) {}
          }
          // Try to lock the target after the mode switch.
          try {
            setTimeout(function () {
              if (local.lockedSet && !local.lockedSet.has(targetId)) {
                toggleLock(targetId);
              }
              local.openTabId = targetId;
              render();
              renderTabs();
            }, 60);
          } catch (_) {}
          close();
        });
      }
      document.addEventListener('mousedown', onOutside, true);
      document.addEventListener('keydown', onEsc, true);
    }

    // ─── Phase 21AU (2026-05-23) — custom side-panel tooltip ──
    //
    // Replaces the OS-native title="..." tooltip (ugly + slow,
    // ~1.5s delay) with an atlas-styled floating box that fires
    // at 500 ms. The tooltip element is created once and reused;
    // it lives in document.body so it can escape the side panel
    // clip + overflow. Position rule: try LEFT of the side panel
    // first (the panel is right-anchored), fall back to RIGHT if
    // left would overflow.
    //
    // Content per row is read from data-* attrs set in the row
    // HTML: tier, edge-type, edge-source, edge-notes, edge-dir,
    // edge-target-title, edge-risky. T5 / political-risk rows
    // lead with the disclaimer caveat row before the claim.
    let tipEl = document.getElementById('forge-side-tip');
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.id = 'forge-side-tip';
      tipEl.className = 'forge-side-tip';
      tipEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tipEl);
    }
    let tipShowTimer = 0;
    let tipHideTimer = 0;
    let tipCurrentRow = null;
    const TIP_DELAY_MS = 500;
    function escTip(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      ));
    }
    function buildTipHtml(row) {
      const tier      = row.getAttribute('data-tier') || 'T1';
      const dir       = row.getAttribute('data-edge-dir') === 'out' ? '→' : '←';
      const target    = row.getAttribute('data-edge-target-title') || '';
      // Phase 21AV (2026-05-23) — surface the HUMAN-READABLE type
      // label instead of the raw kebab-case slug (e.g. "Rejected
      // identification" instead of "syncretic-negative-identification").
      const typeHuman = row.getAttribute('data-edge-type-human') || '';
      const src       = row.getAttribute('data-edge-source') || '';
      const notes     = row.getAttribute('data-edge-notes') || '';
      const risky     = row.getAttribute('data-edge-risky') === '1';
      // Phase 21AX (2026-05-23) — black-alert is the political-risk-
      // flag axis (CODEX v1.2 §IV.5). Read directly from the row's
      // is-black-alert class, set by the renderer when polRisk=true.
      const blackAlert = row.classList.contains('is-black-alert');
      const inMode    = row.getAttribute('data-in-mode') === '1';
      const subtype   = row.getAttribute('data-edge-target-subtype') || '';
      const tierClass = 'vs-tier-pill--' + tier.toLowerCase();
      let html = '';
      if (blackAlert) {
        html += '<div class="forge-side-tip-risk forge-side-tip-risk--alert">⛔ HIGH ALERT — political-risk content (real-world harm-wiring documented)</div>';
      } else if (risky) {
        html += '<div class="forge-side-tip-risk">⚠ Disclaimer required — claim rejected by mainstream</div>';
      }
      html += '<div class="forge-side-tip-head">'
        +    '<span class="forge-side-tip-dir">' + dir + '</span>'
        +    '<span class="forge-side-tip-title">' + escTip(target) + '</span>'
        +    '<span class="vs-tier-pill ' + tierClass + '">' + escTip(tier) + '</span>'
        +    '</div>';
      // Cross-folder subtype line — e.g., "→ a theme node (not on
      // the deity wheel)" so the user understands why the row isn't
      // clickable.
      if (!inMode && subtype) {
        html += '<div class="forge-side-tip-row"><span class="k">node</span><span class="v">a ' + escTip(subtype) + ' node — not on the deity wheel</span></div>';
      }
      if (typeHuman) {
        html += '<div class="forge-side-tip-row"><span class="k">type</span><span class="v">' + escTip(typeHuman) + '</span></div>';
      }
      if (src) {
        html += '<div class="forge-side-tip-row"><span class="k">source</span><span class="v">' + escTip(src) + '</span></div>';
      }
      if (notes) {
        html += '<div class="forge-side-tip-notes">' + escTip(notes) + '</div>';
      }
      html += '<div class="forge-side-tip-hint">' + (inMode ? 'Click to lock + inspect' : 'Not on the deity wheel — view-only') + '</div>';
      return html;
    }
    function positionTip(row) {
      // Phase 22-AH (2026-05-24) — D-fix defensive guard.
      // If the row got detached from the DOM (innerHTML replaced
      // the side-panel while a tip was still anchored to it), its
      // bounding-rect reads zeros → tip clamps to (10, 10) top-
      // left. Detect detachment + hide instead of paint-then-stick.
      if (!row || !row.isConnected) { hideTip(); return; }
      const rRow = row.getBoundingClientRect();
      if (rRow.width === 0 && rRow.height === 0) { hideTip(); return; }
      const rTip = tipEl.getBoundingClientRect();
      const margin = 10;
      // Default to LEFT of the row (side panel is on the right).
      // If that would overflow off-screen left, fall back to RIGHT.
      let left = rRow.left - rTip.width - margin;
      if (left < margin) left = rRow.right + margin;
      // Clamp horizontally so we never paint off-screen right.
      if (left + rTip.width + margin > window.innerWidth) {
        left = Math.max(margin, window.innerWidth - rTip.width - margin);
      }
      // Vertical: align top of tip with top of row, clamp to fit.
      let top = rRow.top;
      if (top + rTip.height + margin > window.innerHeight) {
        top = window.innerHeight - rTip.height - margin;
      }
      if (top < margin) top = margin;
      tipEl.style.left = left + 'px';
      tipEl.style.top  = top  + 'px';
    }
    function showTipFor(row) {
      tipCurrentRow = row;
      tipEl.innerHTML = buildTipHtml(row);
      tipEl.setAttribute('data-tier', row.getAttribute('data-tier') || 'T1');
      tipEl.setAttribute('data-risky', row.getAttribute('data-edge-risky') === '1' ? '1' : '0');
      // Phase 21AX (2026-05-23) — propagate black-alert state to
      // the tip element so CSS can escalate the chrome (black
      // top border instead of red, ⛔ icon coloring, etc.).
      tipEl.setAttribute('data-alert', row.classList.contains('is-black-alert') ? '1' : '0');
      tipEl.classList.add('is-visible');
      tipEl.setAttribute('aria-hidden', 'false');
      positionTip(row);
    }
    function hideTip() {
      tipEl.classList.remove('is-visible');
      tipEl.setAttribute('aria-hidden', 'true');
      tipCurrentRow = null;
    }
    inner.addEventListener('mouseover', (e) => {
      const row = e.target.closest('.forge-side-panel-wire-item');
      if (!row || row === tipCurrentRow) return;
      if (tipShowTimer) { clearTimeout(tipShowTimer); tipShowTimer = 0; }
      if (tipHideTimer) { clearTimeout(tipHideTimer); tipHideTimer = 0; }
      tipShowTimer = setTimeout(() => {
        tipShowTimer = 0;
        showTipFor(row);
      }, TIP_DELAY_MS);
    });
    inner.addEventListener('mouseout', (e) => {
      const row = e.target.closest('.forge-side-panel-wire-item');
      if (!row) return;
      if (tipShowTimer) { clearTimeout(tipShowTimer); tipShowTimer = 0; }
      // Short defer so moving from one row to another doesn't
      // flash the tip out + back in — let the next mouseover
      // cancel the hide.
      if (tipHideTimer) { clearTimeout(tipHideTimer); }
      tipHideTimer = setTimeout(() => {
        tipHideTimer = 0;
        hideTip();
      }, 80);
    });
    // Hide on any scroll inside the panel (the row moved).
    inner.addEventListener('scroll', hideTip, true);
    // Hide on click — the panel's about to re-render and the
    // old tip would be orphaned.
    inner.addEventListener('click', hideTip, true);
  }

  window._forgeSidePanel = { attach };
})();
