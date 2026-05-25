// ============================================================
// CODEX ATLAS — FORGE SCRIPTURE READER (overlay window)
// ============================================================
//
// Filed: 2026-05-28 per AUDIT/2026-05-28-scripture-mode-spec.md
// Step 3 of 8 — SKELETON. Overlay DOM mounts hidden. open/close
// API installed but body is a placeholder until Step 4 ports the
// legacy verse-rendering logic.
//
// AST-VALIDATED DEPS: { local, toggleLock, triggerClickPulse }
// BOUNDARY CONTRACT:
//   window._forgeScriptureReader.attach({ local, toggleLock, triggerClickPulse })
//
// On attach:
//   - injects a <style> block with the minimal overlay CSS
//   - mounts a hidden .forge-reader-pane inside .forge-pane
//   - installs local.scriptureReader = { open, close, isOpen }
//   - hooks ESC to close
//
// The public API (window._forge.openReader / closeReader) is
// added separately by src/js/forge/install-public-api.js — it
// delegates to local.scriptureReader.
//
// Tested by: `window._forge.openReader('genesis-1')` in console
// after the wheel mounts. Should show the overlay with title
// "Genesis 1:1 – 2:3" and a skeleton body.
// ============================================================
(function () {
  'use strict';

  // Minimal CSS — self-contained. Lives at module scope so it only
  // injects once even if attach() somehow runs twice. CSS class names
  // are `.forge-reader-*` to coexist with the legacy `.sr-*` classes
  // until VIEWS.scripture cuts over in step 7.
  const READER_CSS = [
    '.forge-reader-pane {',
    '  position: absolute;',
    '  inset: 0;',
    '  z-index: 40;',
    '  background: #14171a;',
    '  color: #e6e6e6;',
    '  display: none;',
    '  flex-direction: column;',
    '  font: 14px/1.55 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;',
    '}',
    '.forge-reader-pane.is-open { display: flex; }',
    '.forge-reader-topbar {',
    '  flex: 0 0 auto;',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 12px;',
    '  padding: 10px 16px;',
    '  border-bottom: 1px solid #2a2e34;',
    '  background: #1a1e22;',
    '}',
    '.forge-reader-back {',
    '  appearance: none;',
    '  background: transparent;',
    '  border: 1px solid #3a3f47;',
    '  color: #e6e6e6;',
    '  padding: 4px 10px;',
    '  border-radius: 4px;',
    '  font: inherit;',
    '  cursor: pointer;',
    '}',
    '.forge-reader-back:hover { background: #242830; border-color: #5a626d; }',
    '.forge-reader-title {',
    '  font-weight: 600;',
    '  letter-spacing: 0.01em;',
    '  font-size: 15px;',
    '}',
    '.forge-reader-canon {',
    '  font-size: 11px;',
    '  color: #8a929c;',
    '  border: 1px solid #2a2e34;',
    '  padding: 2px 8px;',
    '  border-radius: 10px;',
    '  text-transform: uppercase;',
    '  letter-spacing: 0.05em;',
    '}',
    '.forge-reader-body {',
    '  flex: 1 1 auto;',
    '  overflow: auto;',
    '  padding: 24px 32px;',
    '}',
    '.forge-reader-skeleton {',
    '  max-width: 720px;',
    '  margin: 40px auto;',
    '  padding: 24px;',
    '  border: 1px dashed #3a3f47;',
    '  border-radius: 6px;',
    '  color: #a0a8b4;',
    '  text-align: center;',
    '  line-height: 1.7;',
    '}',
    '.forge-reader-skeleton code {',
    '  font-family: "SF Mono", Menlo, Consolas, monospace;',
    '  font-size: 12px;',
    '  background: #1a1e22;',
    '  padding: 2px 6px;',
    '  border-radius: 3px;',
    '  color: #d4d8de;',
    '}',
  ].join('\n');

  function injectStyleOnce() {
    if (document.getElementById('forge-reader-style')) return;
    const style = document.createElement('style');
    style.id = 'forge-reader-style';
    style.textContent = READER_CSS;
    document.head.appendChild(style);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function attach(deps) {
    const local = deps.local;
    // toggleLock + triggerClickPulse — held for Step 5 (entity clicks
    // → lock wheel node). Not used by skeleton.
    // const toggleLock        = deps.toggleLock;
    // const triggerClickPulse = deps.triggerClickPulse;

    if (!local) return;
    // Re-entry guard: an idempotent attach lets dev reload the bundle
    // without duplicating DOM.
    if (local.scriptureReader && local.scriptureReader._installed) return;

    injectStyleOnce();

    // Find the forge pane the view mounted us into. attach() runs
    // after the pane exists (forge.js calls us after building the
    // shell), so query is safe.
    const pane = document.querySelector('.forge-pane');
    if (!pane) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[forge-reader] .forge-pane not found at attach time — reader inert.');
      }
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'forge-reader-pane';
    overlay.id        = 'forge-reader-pane';
    overlay.innerHTML = [
      '<div class="forge-reader-topbar" id="forge-reader-topbar">',
      '  <button class="forge-reader-back" id="forge-reader-back" title="Return to the wheel (ESC)">← Wheel</button>',
      '  <span class="forge-reader-title" id="forge-reader-title">—</span>',
      '  <span class="forge-reader-canon" id="forge-reader-canon" style="display:none"></span>',
      '</div>',
      '<div class="forge-reader-body" id="forge-reader-body">',
      '  <div class="forge-reader-skeleton">',
      '    <strong>Scripture reader — Step 3 skeleton</strong><br>',
      '    Verse-rendering ports from <code>src/js/views/scripture-reader.js</code> in Step 4.<br>',
      '    Cross-tradition parallels, transmissions index, and entity-click → wheel-lock wiring follow in Steps 5–6.',
      '  </div>',
      '</div>',
    ].join('\n');
    pane.appendChild(overlay);

    // ── State ──────────────────────────────────────────────
    let _open    = false;
    let _textKey = null;

    function _findTextByKey(textKey) {
      // SCRIPTURE_TEXTS is keyed by text-key (e.g. 'genesis-1'), not
      // vault node-id. If the caller passes a vault docNode, no match
      // — caller must pass a textKey. Step 5 will install the
      // docNode→textKey reverse map for the wheel-side entry point.
      return (window.SCRIPTURE_TEXTS && window.SCRIPTURE_TEXTS[textKey]) || null;
    }

    function open(textKey) {
      if (!textKey) {
        if (console && console.warn) console.warn('[forge-reader] open() requires a textKey');
        return false;
      }
      const t = _findTextByKey(textKey);
      const titleEl = document.getElementById('forge-reader-title');
      const canonEl = document.getElementById('forge-reader-canon');
      if (t) {
        if (titleEl) titleEl.textContent = t.title || textKey;
        if (canonEl) {
          const canon = t.corpus || t.language || '';
          if (canon) { canonEl.textContent = canon; canonEl.style.display = ''; }
          else canonEl.style.display = 'none';
        }
      } else {
        if (titleEl) titleEl.textContent = textKey + ' (not in SCRIPTURE_TEXTS)';
        if (canonEl) canonEl.style.display = 'none';
      }
      overlay.classList.add('is-open');
      _open = true;
      _textKey = textKey;
      // Tell forge.js to skip canvas hit-testing while the reader is up.
      // Tagged on local so other modules (frame loop, hover-card) can
      // gate on it in Step 4+. Set even though gating isn't wired yet —
      // it's a no-cost hint that won't break anything.
      local.readerOpen = true;
      return true;
    }

    function close() {
      overlay.classList.remove('is-open');
      _open    = false;
      _textKey = null;
      local.readerOpen = false;
      return true;
    }

    function isOpen() { return _open; }

    // ── Wire UI ────────────────────────────────────────────
    const backBtn = document.getElementById('forge-reader-back');
    if (backBtn) backBtn.addEventListener('click', close);

    // ESC closes. Listener stays mounted for the lifetime of the
    // forge view — cheap, only fires on actual keypress.
    document.addEventListener('keydown', function (ev) {
      if (_open && ev.key === 'Escape') {
        ev.stopPropagation();
        close();
      }
    }, true);

    // Publish on local. install-public-api.js delegates window._forge
    // .openReader/closeReader to these.
    local.scriptureReader = {
      open: open,
      close: close,
      isOpen: isOpen,
      _installed: true,
    };
  }

  window._forgeScriptureReader = { attach: attach };
})();
