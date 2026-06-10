// ============================================================
// CODEX ATLAS — CANONICAL NODE INSPECTOR (V2)
// ============================================================
//
// Filed 2026-06-10 — the greenlit 2026-06-05 item ("ONE canonical
// side-panel; decouple the legacy app.js renderer from
// #detail-inner"), triggered by John catching the V01 panel:
// "this LOOKS like PROTOTYPE JUNK".
//
// This module is THE renderer behind window.selectNode for every
// non-Forge surface (alphabets glyph chips, astrology, boards,
// pantheon, reader vault-jumps, …). It renders into the shared
// `aside#detail > #detail-inner` shell using the SAME canonical
// `.forge-side-panel-*` classes the Forge inspector emits — one
// visual system everywhere a node opens (severity dogma: REUSE
// the canonical primitives, don't fork them).
//
// The Forge view keeps its own specialized driver
// (src/js/forge/side-panel.js — locks, tabs, carousel, engine
// tier-filters); both emit the same markup language. The V01
// renderer (`renderDetail`, app.js) is DELETED in the same commit
// that ships this module (rule #8).
//
// Cross-talk guard: forge/side-panel.js keeps a persistent
// delegated click listener on #detail-inner. This module renders
// everything inside `.inspector-root` and handles clicks in the
// CAPTURE phase with stopPropagation, so the two drivers never
// double-handle each other's rows.
//
// Boundary contract (public API):
//   window._inspector = { show(nodeId), clear() }
//
// NOTE: TYPE_HUMAN / bucket maps mirror src/js/forge/side-panel.js
// (closure-private there — sharing them needs a forge carve; a
// follow-up). Keep the two in sync when the vocab grows.
// ============================================================
(function () {
  'use strict';

  const safe = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  let _nodesById = null;
  function nodesById() {
    if (_nodesById) return _nodesById;
    const map = new Map();
    const vd = window.VAULT_DATA;
    if (vd && Array.isArray(vd.nodes)) {
      for (const n of vd.nodes) if (n && n.id) map.set(n.id, n);
    }
    _nodesById = map;
    return map;
  }

  // 7-bucket routing (HOW-WE-WORK §7) — used when the engine's
  // window.EDGE_BUCKET map isn't installed (non-forge sessions).
  const FALLBACK_BUCKET = {
    'cognate': 'transmission', 'direct-borrowing': 'transmission',
    'iconographic-borrowing': 'transmission', 'substrate-influence': 'transmission',
    'continuous-development': 'transmission', 'influences': 'transmission',
    'influenced-by': 'transmission', 'ancestor-of': 'transmission',
    'descended-from': 'transmission', 'adapted-from': 'transmission',
    'heir-of': 'transmission',
    'scholarly-parallel': 'parallel', 'parallel-motif': 'parallel',
    'functional-equivalent': 'parallel', 'interpretatio-nominal': 'parallel',
    'parallel-form': 'parallel', 'visual-cognate': 'parallel',
    'convergence': 'parallel', 'parallel-development': 'parallel',
    'consort': 'kinship', 'child-of': 'kinship', 'parent-of': 'kinship',
    'sibling-of': 'kinship', 'sibling': 'kinship',
    'attests': 'attestation', 'attested-in': 'attestation',
    'authored': 'attestation', 'attributed-author': 'attestation',
    'polemic-against': 'polemic', 'polemic-inversion': 'polemic',
    'demonization': 'polemic', 'prefiguration-claim': 'polemic',
    'negative-identification': 'polemic', 'appropriated-by': 'polemic',
    'same-as': 'fusion', 'interpretatio-cultic': 'fusion',
    'ancient-identification': 'fusion', 'composite-deity': 'fusion',
    'folk-syncretism': 'fusion', 'identification': 'fusion',
  };
  function bucketOf(type) {
    const EB = window.EDGE_BUCKET || null;
    if (EB && EB[type]) return EB[type];
    if (FALLBACK_BUCKET[type]) return FALLBACK_BUCKET[type];
    if (type && type.indexOf('syncretic-') === 0) {
      const tail = type.slice(10);
      if (FALLBACK_BUCKET[tail]) return FALLBACK_BUCKET[tail];
    }
    return 'association';
  }
  const BUCKET_ORDER = ['transmission', 'parallel', 'association', 'kinship', 'attestation', 'polemic', 'fusion'];
  const BUCKET_HUMAN = {
    transmission: 'Transmission', parallel: 'Parallel', association: 'Association',
    kinship: 'Kinship', attestation: 'Attestation', polemic: 'Polemic', fusion: 'Fusion',
  };
  // Static bucket accents (mirrors the engine PARAM defaults closely
  // enough for the shared look; the forge panel reads live params).
  const BUCKET_COLOR = {
    transmission: '#d4a55a', parallel: '#5aaca8', association: '#8b93a6',
    kinship: '#b07acc', attestation: '#6f9fd8', polemic: '#c44a5a', fusion: '#7ec47a',
  };
  // Mirrors side-panel.js TYPE_HUMAN (see header note).
  const TYPE_HUMAN = {
    'cognate': 'Cognate (shared linguistic root)', 'direct-borrowing': 'Direct borrowing',
    'iconographic-borrowing': 'Iconographic borrowing', 'substrate-influence': 'Substrate influence',
    'continuous-development': 'Continuous development', 'scholarly-parallel': 'Scholarly parallel',
    'parallel-motif': 'Same motif, independent origin', 'functional-equivalent': 'Functional equivalent',
    'interpretatio-nominal': 'Name mapping across traditions', 'same-as': 'Identified as same figure',
    'interpretatio-cultic': 'Cult / ritual mapping across traditions', 'ancient-identification': 'Ancient identification',
    'composite-deity': 'Composite deity (merger)', 'folk-syncretism': 'Folk syncretism',
    'identification': 'Identification', 'manifestation-of': 'Manifestation / aspect of',
    'avatara-of': 'Avatara / incarnation of', 'constituent-of': 'Constituent of',
    'polemic-against': 'Polemic — rejects / refutes', 'polemic-inversion': 'Polemic — inverts opponent',
    'demonization': 'Demonized rival figure', 'prefiguration-claim': 'Claimed as prefiguration',
    'negative-identification': 'Rejected identification', 'parallel-form': 'Parallel form',
    'visual-cognate': 'Visual cognate', 'ancestor-of': 'Ancestor of', 'connects-to': 'Connected to',
    'consort': 'Consort', 'child-of': 'Child of', 'parent-of': 'Parent of', 'attested-in': 'Attested in',
  };
  function humanType(t) {
    if (!t) return '';
    if (TYPE_HUMAN[t]) return TYPE_HUMAN[t];
    if (t.indexOf('syncretic-') === 0) {
      const tail = t.slice(10);
      if (TYPE_HUMAN[tail]) return TYPE_HUMAN[tail];
      return tail.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  const SUBTYPE_HUMAN = {
    deity: 'deity', theme: 'theme', person: 'person', event: 'event', tradition: 'tradition',
    symbol: 'symbol', music: 'music', alphabet: 'alphabet', alchemy: 'alchemy', ritual: 'ritual',
    moral: 'moral', philosophy: 'philosophy', mathematics: 'mathematics', medicine: 'medicine',
    document: 'document', place: 'place', language: 'language', doctrine: 'doctrine',
    practice: 'practice', relic: 'relic', substance: 'substance',
  };

  const fmtYear = (y) => {
    if (typeof y !== 'number' || !isFinite(y)) return '';
    if (y < 0) return Math.abs(y) + ' BCE';
    if (y === 0) return '0';
    return y + ' CE';
  };

  const DATING_BASIS_LABELS = {
    'B1': 'B1 · primary date', 'B2': 'B2 · first textual attestation',
    'B3': 'B3 · oldest archaeology', 'B4': 'B4 · first scripture appearance',
    'B5': 'B5 · scholarly consensus', 'B6': 'B6 · family-median (soft)', 'B7': 'B7 · atemporal',
  };

  // docNode → SCRIPTURE_TEXTS key (for the Open-in-reader button).
  let _docnodeToTextKey = null;
  function textKeyForDoc(docNodeId) {
    if (!docNodeId) return null;
    if (!_docnodeToTextKey) {
      const map = Object.create(null);
      const T = window.SCRIPTURE_TEXTS || {};
      for (const k in T) {
        const t = T[k];
        if (t && t.docNode && typeof t.docNode === 'string' && !map[t.docNode]) map[t.docNode] = k;
      }
      _docnodeToTextKey = map;
    }
    return _docnodeToTextKey[docNodeId] || null;
  }

  function renderBodyMd(raw) {
    if (!raw) return '';
    // 2026-06-10 — consumer-facing language (John: internal jargon
    // "CANT HAPPEN, all this will be consumer facing"). Node bodies
    // carry internal '## MASSIVE WIN — …' research headings; display
    // them as plain findings. The vault text is untouched — the full
    // jargon-tagged corpus feeds the Investigation section.
    raw = raw.replace(/^(#{1,6})\s*MASSIVE[ -]WIN[S]?\b[^\n]*/gim, '$1 Cross-tradition findings');
    const withLinks = raw.replace(
      /\[\[([a-zA-Z0-9\-_]+)(?:\|([^\]]+))?\]\]/g,
      (m, slug, label) => {
        const text = safe(label || slug);
        if (nodesById().has(slug)) {
          return '<a class="forge-side-panel-body-link" data-inspector-jump="' + safe(slug) + '">' + text + '</a>';
        }
        return '<span class="forge-side-panel-body-link is-dead">' + text + '</span>';
      }
    );
    if (window.marked && typeof window.marked.parse === 'function') {
      try { return window.marked.parse(withLinks); } catch (e) { /* fall through */ }
    }
    return withLinks.split(/\n\n+/).map(p => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
  }

  function renderProvenance(node) {
    const prov = node && node.classification_provenance;
    if (!prov || typeof prov !== 'object') return '';
    const FIELD_LABELS = {
      'role-tokens': 'Classified as', 'tradition': 'Tradition',
      'polemical-framing': 'Polemically framed as', 'reclaimed-self-naming': 'Self-reclaimed as',
      'canonical-corpus': 'Canonical corpus',
    };
    let out = '';
    for (const field of Object.keys(prov)) {
      const entries = prov[field];
      if (!Array.isArray(entries) || !entries.length) continue;
      out += '<div class="forge-side-panel-provenance forge-side-panel-provenance--' + safe(field) + '">';
      out += '<div class="forge-side-panel-provenance-label">' + safe(FIELD_LABELS[field] || field) + '</div>';
      for (const e of entries) {
        const value = e.display || e.value || '';
        const tier = e['source-tier'] || '';
        const src = e.source || '';
        out += '<div class="forge-side-panel-provenance-row">'
          + '<span class="forge-side-panel-provenance-chip"' + (tier ? ' data-tier="' + safe(tier) + '"' : '') + '>'
          + '<span class="forge-side-panel-provenance-chip-value">' + safe(value) + '</span>'
          + (tier ? '<span class="forge-side-panel-provenance-chip-tier">' + safe(tier) + '</span>' : '')
          + '</span>'
          + (src ? '<span class="forge-side-panel-provenance-row-source">' + safe(src) + '</span>' : '')
          + '</div>';
      }
      const seenR = new Set();
      for (const e of entries) {
        const r = e.contested_rationale || '';
        if (r && !seenR.has(r)) {
          seenR.add(r);
          out += '<details class="forge-side-panel-provenance-rationale-wrap">'
            + '<summary class="forge-side-panel-provenance-rationale-summary">⚖ Why this classification? <span class="forge-side-panel-provenance-rationale-summary-hint">(scholarly rationale)</span></summary>'
            + '<div class="forge-side-panel-provenance-rationale">' + safe(r) + '</div>'
            + '</details>';
        }
      }
      out += '</div>';
    }
    return out;
  }

  function show(id) {
    const inner = document.getElementById('detail-inner');
    if (!inner) return;
    const node = nodesById().get(id);
    if (!node) { clear(); return; }

    const title = node.title || node.name || id;
    const tradition = node.tradition || node.family || '';
    const aka = Array.isArray(node.aka) ? node.aka.filter(Boolean) : [];
    let desc = node.role || node.description || node.brief || '';
    if (!desc && Array.isArray(node.domains) && node.domains.length) desc = node.domains.join(', ');
    const familyCol = node.family_color || node.tradition_color || '#888';
    const bodyRaw = String(node.body || '').trim();
    const refs = Array.isArray(node.refs) ? node.refs : [];
    const extract = String(node.thumb_extract || '');
    const wikiPage = node.thumb_page || '';
    const place = node.region || node.location || '';
    const domains = Array.isArray(node.domains) ? node.domains.join(', ') : '';

    // ── thumb (first curated depiction, else the Wikipedia thumb) ──
    const dep0 = (Array.isArray(node.depictions) && node.depictions[0]) || null;
    const thumbSrc = (dep0 && (dep0.source || dep0.src)) || node.thumbnail || '';
    const thumbCap = (dep0 && dep0.caption) || '';
    const thumbAttr = (dep0 && dep0.attribution) || (node.thumbnail && !dep0 ? 'Wikipedia' : '');
    const thumbHtml = thumbSrc
      ? '<div class="forge-side-panel-thumb"><img src="' + safe(thumbSrc) + '" alt="' + safe(thumbCap || title) + '" />'
        + ((thumbCap || thumbAttr)
            ? '<div class="forge-side-panel-thumb-meta">'
              + (thumbCap ? '<div class="forge-side-panel-thumb-caption">' + safe(thumbCap) + '</div>' : '')
              + (thumbAttr ? '<div class="forge-side-panel-thumb-attribution">' + safe(thumbAttr) + '</div>' : '')
              + '</div>'
            : '')
        + '</div>'
      : '';

    // ── wire buckets from the FULL vault edge set ──
    const buckets = Object.create(null);
    const vd = window.VAULT_DATA;
    const edges = (vd && vd.edges) || [];
    for (const e of edges) {
      const isSrc = e.source === id, isTgt = e.target === id;
      if (!isSrc && !isTgt) continue;
      const b = bucketOf(e.type);
      if (!buckets[b]) buckets[b] = { count: 0, neighbors: [] };
      buckets[b].count++;
      const otherId = isSrc ? e.target : e.source;
      const other = nodesById().get(otherId) || null;
      buckets[b].neighbors.push({
        id: otherId,
        title: (other && (other.title || other.id)) || otherId,
        color: (other && (other.family_color || other.tradition_color)) || '#888',
        dir: isSrc ? 'out' : 'in',
        exists: !!other,
        subtype: other ? (other.type || '') : '',
        edgeType: e.type || '',
        tier: e.source_tier || 'T1',
        source: e.edge_source || '',
        notes: e.edge_notes || '',
        polRisk: !!e.political_risk_flag,
      });
    }
    const pills = BUCKET_ORDER.map(b => {
      const data = buckets[b];
      if (!data) return '';
      data.neighbors.sort((x, y) => x.title.localeCompare(y.title));
      const items = data.neighbors.map(n => {
        const tier = n.tier || 'T1';
        const blackAlert = !!n.polRisk;
        const risky = tier === 'T5' || blackAlert;
        const warn = blackAlert
          ? '<span class="forge-side-panel-wire-item-warn forge-side-panel-wire-item-warn--alert" aria-hidden="true">⛔</span>'
          : (tier === 'T5' ? '<span class="forge-side-panel-wire-item-warn" aria-hidden="true">⚠</span>' : '');
        const subTag = (n.subtype && SUBTYPE_HUMAN[n.subtype])
          ? '<span class="forge-side-panel-wire-item-subtype">' + SUBTYPE_HUMAN[n.subtype] + '</span>' : '';
        const cls = 'forge-side-panel-wire-item'
          + (risky ? ' is-risky' : '') + (blackAlert ? ' is-black-alert' : '')
          + (!n.exists ? ' is-cross-folder' : '');
        return '<button class="' + cls + '"'
          + ' data-inspector-id="' + safe(n.id) + '"'
          + ' data-exists="' + (n.exists ? '1' : '0') + '"'
          + ' title="' + safe(humanType(n.edgeType)) + (n.source ? ' — ' + n.source : '') + '">'
          + '<span class="forge-side-panel-wire-item-dir">' + (n.dir === 'out' ? '→' : '←') + '</span>'
          + '<span class="forge-side-panel-wire-item-dot" style="background:' + safe(n.color) + '"></span>'
          + warn
          + '<span class="forge-side-panel-wire-item-title">' + safe(n.title) + '</span>'
          + subTag
          + '<span class="forge-side-panel-wire-item-tier vs-tier-pill vs-tier-pill--' + tier.toLowerCase() + '">' + tier + '</span>'
          + '</button>';
      }).join('');
      return '<details class="forge-side-panel-wire" data-bucket="' + b + '" style="--bucket-color:' + (BUCKET_COLOR[b] || '#999') + '">'
        + '<summary class="forge-side-panel-wire-summary">'
        + '<span class="forge-side-panel-wire-dot" style="background:' + (BUCKET_COLOR[b] || '#999') + '"></span>'
        + '<span class="forge-side-panel-wire-count">' + data.count + '</span>'
        + '<em class="forge-side-panel-wire-name">' + (BUCKET_HUMAN[b] || b) + '</em>'
        + '<span class="forge-side-panel-wire-caret">▾</span>'
        + '</summary>'
        + '<div class="forge-side-panel-wire-list">' + items + '</div>'
        + '</details>';
    }).filter(Boolean).join('');

    const de = (typeof node.date_earliest === 'number') ? node.date_earliest : null;
    const dl = (typeof node.date_latest === 'number') ? node.date_latest : null;
    const dateStr = (de == null && dl == null) ? ''
      : (de != null && dl != null && de !== dl) ? (fmtYear(de) + ' – ' + fmtYear(dl))
      : fmtYear(de != null ? de : dl);
    const dbasis = node.dating_basis || '';
    const dbLabel = DATING_BASIS_LABELS[dbasis] || dbasis;

    const refsHtml = refs.length
      ? '<h4 class="forge-side-panel-section-h">References</h4>'
        + '<ol class="forge-side-panel-refs">'
        + refs.map(r => {
            if (typeof r === 'string') return '<li>' + safe(r) + '</li>';
            const author = r.author ? safe(r.author) : '';
            const year = r.year ? ' (' + safe(r.year) + ')' : '';
            const t = r.title ? ' <em>' + safe(r.title) + '</em>' : '';
            const pub = r.publisher ? ', ' + safe(r.publisher) : '';
            const url = r.url ? ' <a href="' + safe(r.url) + '" target="_blank" rel="noopener noreferrer">→</a>' : '';
            const tier = r.tier ? ' <span class="forge-side-panel-ref-tier">T' + safe(r.tier) + '</span>' : '';
            return '<li>' + author + year + '.' + t + pub + '.' + url + tier + '</li>';
          }).join('')
        + '</ol>'
      : '';

    const bodyHtml = renderBodyMd(bodyRaw);
    const readBtn = (node.type === 'document' && textKeyForDoc(id))
      ? '<button class="forge-side-panel-read-btn" data-inspector-read="' + safe(textKeyForDoc(id)) + '" type="button">✠ Open in reader</button>'
      : '';
    const actionRow = '<div class="forge-side-panel-actions" role="toolbar" aria-label="Node actions">'
      + '<button class="forge-side-panel-action" type="button" data-inspector-action="add-to-board" data-node-id="' + safe(id) + '" title="Add this node to the current board as a card">'
      + '<span class="forge-side-panel-action-glyph" aria-hidden="true">＋</span>'
      + '<span class="forge-side-panel-action-label">Add to board</span>'
      + '</button></div>';

    inner.innerHTML = '<div class="forge-side-panel-content inspector-root" style="--family-color:' + safe(familyCol) + '">'
      + thumbHtml
      + '<div class="forge-side-panel-header">'
      + '<div class="forge-side-panel-name">' + safe(title) + '</div>'
      + (aka.length ? '<div class="forge-side-panel-aka">' + aka.map(safe).join(' · ') + '</div>' : '')
      + (tradition ? '<div class="forge-side-panel-tradition">' + safe(tradition) + '</div>' : '')
      + '</div>'
      + (desc ? '<div class="forge-side-panel-desc">' + safe(desc) + '</div>' : '')
      + renderProvenance(node)
      + actionRow
      + (pills ? '<div class="forge-side-panel-wires">' + pills + '</div>' : '')
      + '<dl class="forge-side-panel-meta">'
      + (dateStr ? '<dt>Date</dt><dd>' + safe(dateStr) + '</dd>' : '')
      + (dbLabel ? '<dt>Basis</dt><dd class="forge-side-panel-dating-basis">' + safe(dbLabel) + '</dd>' : '')
      + (place ? '<dt>Place</dt><dd>' + safe(place) + '</dd>' : '')
      + (domains ? '<dt>Domains</dt><dd>' + safe(domains) + '</dd>' : '')
      + '</dl>'
      + (bodyHtml ? '<div class="forge-side-panel-body">' + bodyHtml + '</div>' : '')
      + refsHtml
      + (!bodyHtml && extract ? '<div class="forge-side-panel-extract">' + safe(extract) + '</div>' : '')
      + (wikiPage ? '<a class="forge-side-panel-wikilink" href="' + safe(wikiPage) + '" target="_blank" rel="noopener noreferrer">Open Wikipedia ↗</a>' : '')
      + readBtn
      + '</div>';
    inner.scrollTop = 0;
  }

  function clear() {
    const inner = document.getElementById('detail-inner');
    if (inner) inner.innerHTML = '<div class="empty">Select a node to inspect.</div>';
  }

  // Capture-phase delegation: handle clicks INSIDE .inspector-root and
  // stop them before forge/side-panel.js's bubble listener (attached to
  // the same #detail-inner when Forge has mounted) can double-handle.
  document.addEventListener('click', (e) => {
    const root = e.target.closest && e.target.closest('.inspector-root');
    if (!root) return;
    const jump = e.target.closest('[data-inspector-jump]');
    if (jump) {
      e.preventDefault(); e.stopPropagation();
      show(jump.getAttribute('data-inspector-jump'));
      return;
    }
    const row = e.target.closest('[data-inspector-id]');
    if (row) {
      e.stopPropagation();
      if (row.getAttribute('data-exists') === '1') show(row.getAttribute('data-inspector-id'));
      return;
    }
    const read = e.target.closest('[data-inspector-read]');
    if (read) {
      e.stopPropagation();
      const tk = read.getAttribute('data-inspector-read');
      if (tk && window._forge && typeof window._forge.openReader === 'function') window._forge.openReader(tk);
      return;
    }
    const act = e.target.closest('[data-inspector-action]');
    if (act && act.getAttribute('data-inspector-action') === 'add-to-board') {
      e.stopPropagation();
      const nid = act.getAttribute('data-node-id');
      const view = window._boardsView;
      if (!view || typeof view.addCard !== 'function') {
        try { alert('Open the Board view once, then come back to add nodes.'); } catch (err) { /* ignore */ }
        return;
      }
      const rec = nodesById().get(nid);
      try {
        view.addCard({ id: nid, label: (rec && (rec.title || rec.id)) || nid, x: 240, y: 180 });
        act.classList.add('is-just-added');
        setTimeout(() => act.classList.remove('is-just-added'), 700);
      } catch (err) { /* ignore */ }
      return;
    }
  }, true);

  window._inspector = { show: show, clear: clear };
})();
