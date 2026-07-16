// ============================================================
// CODEX ATLAS — ❦ THE FOLIO (personal page)
// ============================================================
// Filed 2026-07-16 (alpha go-online push). "Not 'Profile' — a folio:
// the page of the codex that belongs to you." Reached from the ✦ menu
// → "Your Folio". A full-screen glass overlay (like the Threshold):
//   · identity card — illuminated-initial avatar over a PICKABLE badge
//     background (soft gradient + a faint sacred-geometry motif; the
//     line-only motif is reused at tiny scale), editable display name,
//     "Alpha Seal Nº", the 8-badge picker, and the 4-theme swatch picker
//     (finally lets you switch Codex/Quantum/Human/Mystic in-app).
//   · boards shelf — the tester's saved Boards (reads _boardsView).
//
// ALL STATE IS LOCAL for the alpha (localStorage 'codex-atlas/folio-v1'
// + the existing 'codex-style'). This is the Supabase-ready SEAM: Phase B
// swaps these read/write helpers for auth + a profiles row + storage,
// behind the same function names. Nothing here talks to a network.
//
// Self-installing IIFE. Exposes window._folio = { open, close }.
// Loads after app.js + boards + user-menu so setView/applyStyle/
// _boardsView/the ✦ menu all exist.
// ============================================================

(function () {
  'use strict';

  var LS_KEY = 'codex-atlas/folio-v1';
  var _el = null;

  // ── STATE (local seam; Phase B → Supabase profiles row) ──────
  function readProfile() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {};
  }
  function writeProfile(p) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch (_) {}
  }
  function profile() {
    var p = readProfile();
    if (!p.name) p.name = 'Seeker';
    if (typeof p.badge !== 'number') p.badge = 0;
    if (!p.sealNo) { p.sealNo = 1 + Math.floor(Math.random() * 998); writeProfile(p); }
    return p;
  }
  function setProfile(patch) {
    var p = profile();
    for (var k in patch) p[k] = patch[k];
    writeProfile(p);
    return p;
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ── BADGE BACKGROUNDS (gradient + faint geometry) ────────────
  // 8 abstract, faith-inspired palettes — inspired, never depicting.
  // Each: a soft 3-stop gradient + a generated sacred-geometry motif.
  var BADGES = [
    { key: 'night',    label: 'Night',    g: ['#141232', '#2a1a52', '#171340'], line: 'rgba(212,180,120,0.55)', motif: 'flower'  },
    { key: 'desert',   label: 'Desert',   g: ['#3a2410', '#734c1c', '#472c12'], line: 'rgba(240,200,120,0.60)', motif: 'rays'    },
    { key: 'jade',     label: 'Jade',     g: ['#0c2620', '#154c3c', '#0e3228'], line: 'rgba(180,224,196,0.50)', motif: 'knot'    },
    { key: 'rose',     label: 'Rose',     g: ['#2e1420', '#54243c', '#3a1a2a'], line: 'rgba(236,184,204,0.55)', motif: 'rosette' },
    { key: 'obsidian', label: 'Obsidian', g: ['#0a0a0c', '#1c1c22', '#101014'], line: 'rgba(206,206,216,0.42)', motif: 'orbits'  },
    { key: 'ochre',    label: 'Ochre',    g: ['#2e1a0e', '#5e3618', '#3e2410'], line: 'rgba(232,172,112,0.55)', motif: 'mandala' },
    { key: 'azure',    label: 'Azure',    g: ['#0a1a30', '#164060', '#0e2844'], line: 'rgba(154,204,240,0.55)', motif: 'star'    },
    { key: 'bone',     label: 'Bone',     g: ['#d6d0be', '#ece7d8', '#c6c0ae'], line: 'rgba(96,84,62,0.50)',    motif: 'lattice' },
  ];

  var _uid = 0;

  // Motif generators — return SVG inner markup on a 0 0 100 100 canvas,
  // centred at (50,50). Built from primitives (design-skill: prefer
  // generated geometry over hand-authored path data).
  function motif(kind, stroke) {
    var sw = 'stroke="' + stroke + '" stroke-width="1.1" fill="none" stroke-linecap="round"';
    var swThin = 'stroke="' + stroke + '" stroke-width="0.7" fill="none"';
    var out = [];
    var i, a, x, y, x2, y2, r;
    if (kind === 'flower') {
      r = 17;
      out.push('<circle cx="50" cy="50" r="' + r + '" ' + sw + '/>');
      for (i = 0; i < 6; i++) {
        a = i * Math.PI / 3;
        out.push('<circle cx="' + (50 + Math.cos(a) * r).toFixed(1) + '" cy="' + (50 + Math.sin(a) * r).toFixed(1) + '" r="' + r + '" ' + sw + '/>');
      }
      out.push('<circle cx="50" cy="50" r="' + (r * 2) + '" ' + swThin + '/>');
    } else if (kind === 'rays') {
      for (i = 0; i < 24; i++) {
        a = i * Math.PI / 12;
        out.push('<line x1="' + (50 + Math.cos(a) * 12).toFixed(1) + '" y1="' + (50 + Math.sin(a) * 12).toFixed(1) +
                 '" x2="' + (50 + Math.cos(a) * 42).toFixed(1) + '" y2="' + (50 + Math.sin(a) * 42).toFixed(1) + '" ' + sw + '/>');
      }
      out.push('<circle cx="50" cy="50" r="10" ' + sw + '/>');
    } else if (kind === 'knot') {
      for (i = 0; i < 3; i++) {
        out.push('<ellipse cx="50" cy="50" rx="34" ry="13" ' + sw +
                 ' transform="rotate(' + (i * 60) + ' 50 50)"/>');
      }
      out.push('<circle cx="50" cy="50" r="4" ' + sw + '/>');
    } else if (kind === 'rosette') {
      for (i = 0; i < 6; i++) {
        out.push('<ellipse cx="50" cy="34" rx="9" ry="18" ' + sw +
                 ' transform="rotate(' + (i * 60) + ' 50 50)"/>');
      }
      out.push('<circle cx="50" cy="50" r="30" ' + swThin + '/>');
    } else if (kind === 'orbits') {
      [12, 22, 33].forEach(function (rr, k) {
        out.push('<circle cx="50" cy="50" r="' + rr + '" ' + swThin + '/>');
        a = k * 1.1;
        out.push('<circle cx="' + (50 + Math.cos(a) * rr).toFixed(1) + '" cy="' + (50 + Math.sin(a) * rr).toFixed(1) + '" r="2.2" fill="' + stroke + '" stroke="none"/>');
      });
      out.push('<circle cx="50" cy="50" r="2.4" fill="' + stroke + '" stroke="none"/>');
    } else if (kind === 'mandala') {
      for (i = 0; i < 4; i++) {
        out.push('<rect x="26" y="26" width="48" height="48" ' + sw +
                 ' transform="rotate(' + (i * 22.5) + ' 50 50)"/>');
      }
      out.push('<circle cx="50" cy="50" r="8" ' + sw + '/>');
    } else if (kind === 'star') {
      // {9/4} star polygon
      var pts = [];
      for (i = 0; i < 9; i++) {
        a = (i * 4) * (2 * Math.PI / 9) - Math.PI / 2;
        pts.push((50 + Math.cos(a) * 36).toFixed(1) + ',' + (50 + Math.sin(a) * 36).toFixed(1));
      }
      out.push('<polygon points="' + pts.join(' ') + '" ' + sw + '/>');
      out.push('<circle cx="50" cy="50" r="36" ' + swThin + '/>');
    } else if (kind === 'lattice') {
      for (i = -2; i <= 6; i++) {
        out.push('<line x1="' + (i * 16) + '" y1="8" x2="' + (i * 16 + 42) + '" y2="92" ' + swThin + '/>');
        out.push('<line x1="' + (i * 16 + 42) + '" y1="8" x2="' + (i * 16) + '" y2="92" ' + swThin + '/>');
      }
      for (i = 1; i <= 4; i++) out.push('<line x1="8" y1="' + (i * 20) + '" x2="92" y2="' + (i * 20) + '" ' + swThin + '/>');
    }
    return out.join('');
  }

  // Full badge = gradient + motif. tiny=true → motif line-only (John's
  // "keep the line elements for tiny scales") over a flat wash.
  function badgeSvg(idx, tiny) {
    var b = BADGES[idx] || BADGES[0];
    var id = 'fbg' + (_uid++);
    var bg;
    if (tiny) {
      bg = '<rect width="100" height="100" fill="' + b.g[1] + '"/>';
    } else {
      bg = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
             '<stop offset="0" stop-color="' + b.g[0] + '"/>' +
             '<stop offset="0.55" stop-color="' + b.g[1] + '"/>' +
             '<stop offset="1" stop-color="' + b.g[2] + '"/>' +
           '</linearGradient>' +
           '<radialGradient id="' + id + 'v" cx="0.5" cy="0.42" r="0.75">' +
             '<stop offset="0.55" stop-color="#000" stop-opacity="0"/>' +
             '<stop offset="1" stop-color="#000" stop-opacity="0.35"/>' +
           '</radialGradient></defs>' +
           '<rect width="100" height="100" fill="url(#' + id + ')"/>';
    }
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
      bg +
      '<g opacity="' + (tiny ? '0.9' : '0.85') + '">' + motif(b.motif, b.line) + '</g>' +
      (tiny ? '' : '<rect width="100" height="100" fill="url(#' + id + 'v)"/>') +
      '</svg>';
  }

  // ── BOARDS SHELF (reads the local boards store) ──────────────
  function relTime(ms) {
    if (!ms) return '';
    var d = Math.max(0, (window.__folioNow || nowMs()) - ms);
    var day = 86400000;
    if (d < day) return 'today';
    var days = Math.floor(d / day);
    if (days < 7) return days + 'd ago';
    if (days < 30) return Math.floor(days / 7) + 'w ago';
    return Math.floor(days / 30) + 'mo ago';
  }
  function nowMs() { try { return Date.now(); } catch (_) { return 0; } }
  function boardsHtml() {
    var boards = [];
    try { if (window._boardsView && window._boardsView.listBoards) boards = window._boardsView.listBoards() || []; } catch (_) {}
    if (!boards.length) {
      return '<div class="folio-boards-empty">' +
        '<p>No boards yet. Open a Board, pin a few nodes, and <em>Seal</em> it — it will live here.</p>' +
        '<button type="button" class="btn btn-mini" data-folio-newboard>Open a Board ▾</button>' +
        '</div>';
    }
    return '<div class="folio-board-grid">' + boards.map(function (b) {
      var n = (b.cards && b.cards.length) || 0;
      return '<button type="button" class="folio-board-card" data-folio-board="' + escapeHtml(b.id) + '">' +
        '<span class="folio-board-name">' + escapeHtml(b.name || 'Untitled board') + '</span>' +
        '<span class="folio-board-meta">' + n + ' node' + (n === 1 ? '' : 's') + ' · ' + relTime(b.updatedAt || b.createdAt) + '</span>' +
        '</button>';
    }).join('') + '</div>';
  }

  // ── THEME SWATCHES ───────────────────────────────────────────
  // The four curated styles. Colours are indicative dots (accent over bg).
  var THEMES = [
    { key: 'codex',   label: 'Codex',   bg: '#0d1119', dot: '#d4a55a' },
    { key: 'quantum', label: 'Quantum', bg: '#0e0e10', dot: '#f0f0f2' },
    { key: 'human',   label: 'Human',   bg: '#161619', dot: '#c2b4a2' },
    { key: 'mystic',  label: 'Mystic',  bg: '#171338', dot: '#e8c878' },
  ];
  function currentStyle() {
    try { return localStorage.getItem('codex-style') || 'codex'; } catch (_) { return 'codex'; }
  }

  // ── RENDER ───────────────────────────────────────────────────
  function initialOf(name) {
    var s = String(name || 'S').trim();
    return (s.charAt(0) || 'S').toUpperCase();
  }
  function render() {
    var p = profile();
    var badgeIdx = p.badge || 0;
    var seal = ('00' + p.sealNo).slice(-3);

    var badgePicker = BADGES.map(function (b, i) {
      return '<button type="button" class="folio-badge-swatch' + (i === badgeIdx ? ' is-active' : '') +
        '" data-folio-badge="' + i + '" title="' + b.label + '" aria-label="' + b.label + '">' +
        badgeSvg(i) + '</button>';
    }).join('');

    var themePicker = THEMES.map(function (t) {
      return '<button type="button" class="folio-theme-swatch' + (t.key === currentStyle() ? ' is-active' : '') +
        '" data-folio-theme="' + t.key + '" title="' + t.label + '" aria-label="' + t.label + '">' +
        '<span class="folio-theme-chip" style="background:' + t.bg + '"><span class="folio-theme-dot" style="background:' + t.dot + '"></span></span>' +
        '<span class="folio-theme-name">' + t.label + '</span>' +
        '</button>';
    }).join('');

    _el.querySelector('.folio-grid').innerHTML = [
      '<div class="folio-identity">',
      '  <div class="folio-avatar" title="' + escapeHtml(p.name) + '">',
      '    <div class="folio-avatar-bg">' + badgeSvg(badgeIdx) + '</div>',
      '    <span class="folio-avatar-initial">' + escapeHtml(initialOf(p.name)) + '</span>',
      '  </div>',
      '  <div class="folio-name-row">',
      '    <span class="folio-name">' + escapeHtml(p.name) + '</span>',
      '    <button type="button" class="folio-name-edit" data-folio-editname aria-label="Edit name">✎</button>',
      '  </div>',
      '  <div class="folio-id-rows">',
      '    <div class="folio-id-row"><span class="rk">Alpha seal</span><span class="rv gold">Nº ' + seal + '</span></div>',
      '    <div class="folio-id-row"><span class="rk">Status</span><span class="rv">Alpha · local</span></div>',
      '  </div>',
      '  <div class="folio-sect">',
      '    <div class="folio-sect-label">Badge</div>',
      '    <div class="folio-badge-grid">' + badgePicker + '</div>',
      '  </div>',
      '  <div class="folio-sect">',
      '    <div class="folio-sect-label">Theme</div>',
      '    <div class="folio-theme-grid">' + themePicker + '</div>',
      '  </div>',
      '</div>',
      '<div class="folio-shelf">',
      '  <div class="folio-shelf-head">',
      '    <span class="folio-shelf-label">Your boards</span>',
      '    <span class="folio-shelf-count">' + boardsCount() + '</span>',
      '  </div>',
      boardsHtml(),
      '  <div class="folio-ghost">',
      '    <span class="folio-ghost-k">Reading marks — soon</span>',
      '    <span class="folio-ghost-c">Your place in every text, held for your return.</span>',
      '  </div>',
      '</div>',
    ].join('\n');
    wireBody();
  }
  function boardsCount() {
    try { return (window._boardsView && window._boardsView.listBoards) ? (window._boardsView.listBoards() || []).length : 0; }
    catch (_) { return 0; }
  }

  function wireBody() {
    // Badge pick
    _el.querySelectorAll('[data-folio-badge]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-folio-badge'), 10) || 0;
        setProfile({ badge: i });
        render();
      });
    });
    // Theme pick — applies immediately (window.applyStyle persists to codex-style)
    _el.querySelectorAll('[data-folio-theme]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-folio-theme');
        if (typeof window.applyStyle === 'function') window.applyStyle(key);
        render();
      });
    });
    // Edit name (inline prompt for the alpha; a proper modal is Phase B)
    var editBtn = _el.querySelector('[data-folio-editname]');
    if (editBtn) editBtn.addEventListener('click', function () {
      var cur = profile().name;
      var next = window.prompt('Your display name', cur);
      if (next != null) {
        next = String(next).trim().slice(0, 40) || 'Seeker';
        setProfile({ name: next });
        render();
      }
    });
    // Board card → open that board on the Board view
    _el.querySelectorAll('[data-folio-board]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-folio-board');
        close();
        if (typeof window.setView === 'function') window.setView('boards');
        try { if (window._boardsView && window._boardsView.loadBoardById) window._boardsView.loadBoardById(id); } catch (_) {}
      });
    });
    var nb = _el.querySelector('[data-folio-newboard]');
    if (nb) nb.addEventListener('click', function () {
      close();
      if (typeof window.setView === 'function') window.setView('boards');
    });
  }

  function build() {
    var el = document.createElement('div');
    el.className = 'folio';
    el.id = 'folio';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Your Folio');
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="folio-scrim" data-folio-dismiss="1"></div>' +
      '<div class="folio-card" role="document">' +
        '<div class="folio-topbar">' +
          '<span class="folio-brand"><span class="folio-brand-glyph">❦</span> The Folio</span>' +
          '<button type="button" class="folio-close" data-folio-dismiss="1" aria-label="Close">×</button>' +
        '</div>' +
        '<div class="folio-grid"></div>' +
      '</div>';
    el.querySelectorAll('[data-folio-dismiss]').forEach(function (n) {
      n.addEventListener('click', function () { close(); });
    });
    document.body.appendChild(el);
    return el;
  }

  function open() {
    if (!_el) _el = build();
    try { window.__folioNow = nowMs(); } catch (_) {}
    render();
    _el.setAttribute('aria-hidden', 'false');
    void _el.offsetWidth;
    _el.classList.add('is-open');
    document.addEventListener('keydown', _onKey);
  }
  function close() {
    if (!_el) return;
    _el.classList.remove('is-open');
    _el.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', _onKey);
  }
  function _onKey(ev) { if (ev.key === 'Escape') close(); }

  window._folio = { open: open, close: close };
})();
