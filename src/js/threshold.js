// ============================================================
// CODEX ATLAS — ✦ THE THRESHOLD (first-run door)
// ============================================================
// Filed 2026-07-16 (alpha go-online push). The app used to drop a
// newcomer straight into a 5,000-node wheel with zero framing. The
// Threshold is a one-time overlay OVER the live Forge wheel (not a
// static hero): one name, one line, a live stat receipt, and three
// doors that teach the IA (Explore / Read / Yours) in five seconds.
//
// - Shown once (localStorage flag). Never blocks a return visit.
// - Re-openable from the ✦ menu → "Welcome" (user-menu routes to
//   window._threshold.open()).
// - Doors switch the master view via the canonical window.setView.
// - Self-installing IIFE. Exposes window._threshold = { open, close }.
//   Loads AFTER app.js so window.setView + window.VAULT_DATA exist.
// ============================================================

(function () {
  'use strict';

  var LS_KEY = 'codex-atlas/threshold-seen';
  var _el = null;

  function seen() {
    try { return localStorage.getItem(LS_KEY) === '1'; } catch (_) { return false; }
  }
  function markSeen() {
    try { localStorage.setItem(LS_KEY, '1'); } catch (_) {}
  }

  // Live stat receipt — never hardcoded. Falls back gracefully if the
  // data payload isn't shaped as expected.
  function stats() {
    var v = window.VAULT_DATA || {};
    var nodes = (v.nodes && v.nodes.length) || 0;
    var counts = v.counts || {};
    var edges = counts.edges || (v.edges && v.edges.length) || 0;
    var texts = counts.document || 0;
    function fmt(n) { return Number(n).toLocaleString('en-US'); }
    var parts = [];
    if (nodes) parts.push(fmt(nodes) + ' nodes');
    if (edges) parts.push(fmt(edges) + ' edges');
    if (texts) parts.push(fmt(texts) + ' source texts');
    return parts.join(' · ');
  }

  var DOORS = [
    { key: 'explore', view: 'forge',     label: 'Explore the Atlas', copy: 'Start anywhere. Everything is connected.' },
    { key: 'read',    view: 'scripture', label: 'Read the Sources',  copy: 'The texts themselves, not summaries of them.' },
    { key: 'board',   view: 'boards',    label: 'Open a Board',      copy: 'Pin what you find. Make it yours.' },
  ];

  function build() {
    var el = document.createElement('div');
    el.className = 'threshold';
    el.id = 'threshold';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Welcome to Codex Atlas');
    el.setAttribute('aria-hidden', 'true');

    var doorsHtml = DOORS.map(function (d) {
      return '<button type="button" class="threshold-door" data-door="' + d.key + '">'
        +      '<span class="threshold-door-label">' + d.label + '</span>'
        +      '<span class="threshold-door-copy">' + d.copy + '</span>'
        +    '</button>';
    }).join('');

    el.innerHTML =
      '<div class="threshold-scrim" data-threshold-dismiss="1"></div>' +
      '<div class="threshold-card" role="document">' +
        '<div class="threshold-glyph">✦</div>' +
        '<h1 class="threshold-title">Codex Atlas</h1>' +
        '<div class="threshold-rule"></div>' +
        '<p class="threshold-line">Every god, book, symbol and rite that left a documentary trace — ' +
          'one connected map, drawn from the sources themselves.</p>' +
        '<div class="threshold-stats">' + stats() + '</div>' +
        '<div class="threshold-doors">' + doorsHtml + '</div>' +
        '<button type="button" class="threshold-exit" data-threshold-dismiss="1">Press anywhere to enter</button>' +
      '</div>';

    // Door → switch master view, then dismiss.
    el.querySelectorAll('.threshold-door').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var key = btn.getAttribute('data-door');
        var door = DOORS.filter(function (d) { return d.key === key; })[0];
        if (door && typeof window.setView === 'function') {
          try { window.setView(door.view); } catch (e) { console.warn('threshold setView failed', e); }
        }
        close();
      });
    });
    // Scrim / "press anywhere" → dismiss (stay wherever we are = Explore).
    el.querySelectorAll('[data-threshold-dismiss]').forEach(function (n) {
      n.addEventListener('click', function () { close(); });
    });

    document.body.appendChild(el);
    return el;
  }

  function open() {
    if (!_el) _el = build();
    // refresh the stat line each open in case the payload changed
    var s = _el.querySelector('.threshold-stats');
    if (s) s.textContent = stats();
    _el.setAttribute('aria-hidden', 'false');
    // force reflow so the entrance transition runs
    void _el.offsetWidth;
    _el.classList.add('is-open');
    _escOn();
  }

  function close() {
    if (!_el) return;
    markSeen();
    _el.classList.remove('is-open');
    _el.setAttribute('aria-hidden', 'true');
    _escOff();
  }

  function _onKey(ev) { if (ev.key === 'Escape') close(); }
  function _escOn()  { document.addEventListener('keydown', _onKey); }
  function _escOff() { document.removeEventListener('keydown', _onKey); }

  window._threshold = { open: open, close: close };

  // First-run: show once, after a beat so the wheel has painted behind it.
  if (!seen()) {
    if (document.readyState === 'complete') setTimeout(open, 350);
    else window.addEventListener('load', function () { setTimeout(open, 350); });
  }
})();
