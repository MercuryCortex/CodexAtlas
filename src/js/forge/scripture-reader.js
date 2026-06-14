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
    /* 2026-05-28 — right-side panel, NOT full-pane overlay.
       Lives in the right half of .forge-pane so the wheel stays
       visible + interactive on the left. Slide-in animation from
       the right edge. ESC / ← Wheel still close it. */
    '.forge-reader-pane {',
    '  position: absolute;',
    '  top: 0;',
    '  bottom: 0;',
    '  right: 0;',
    '  width: min(560px, 48vw);',
    '  z-index: 40;',
    '  background: rgba(20, 23, 26, 0.97);',
    '  color: #e6e6e6;',
    '  display: none;',
    '  flex-direction: column;',
    '  font: 14px/1.55 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;',
    '  border-left: 1px solid rgba(212,165,90,0.22);',
    '  box-shadow: -12px 0 32px rgba(0,0,0,0.4);',
    '  backdrop-filter: blur(12px);',
    '  -webkit-backdrop-filter: blur(12px);',
    '  transform: translateX(100%);',
    '  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);',
    '}',
    '.forge-reader-pane.is-open { display: flex; transform: translateX(0); }',
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
    '  flex: 1 1 auto;',
    '  font-weight: 600;',
    '  letter-spacing: 0.01em;',
    '  font-size: 13.5px;',
    '  line-height: 1.3;',
    '  color: #e6e6e6;',
    /* Clamp to 2 lines so long titles do not balloon the topbar. */
    '  display: -webkit-box;',
    '  -webkit-line-clamp: 2;',
    '  -webkit-box-orient: vertical;',
    '  overflow: hidden;',
    '}',
    '.forge-reader-canon {',
    '  flex: 0 0 auto;',
    '  max-width: 180px;',
    '  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;',
    '  font-size: 9.5px;',
    '  color: var(--gold, #d4a55a);',
    '  border: 1px solid rgba(212,165,90,0.30);',
    '  padding: 3px 8px;',
    '  border-radius: 3px;',
    '  text-transform: uppercase;',
    '  letter-spacing: 0.08em;',
    '  line-height: 1.3;',
    /* Clamp the canon badge so very long corpus strings do not push the topbar. */
    '  display: -webkit-box;',
    '  -webkit-line-clamp: 2;',
    '  -webkit-box-orient: vertical;',
    '  overflow: hidden;',
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
    /* 2026-05-28 — verse / section / intro / cross-tradition styles
       ported from the legacy scripture-reader.js .sr-* CSS, renamed
       to .forge-reader-* so the two readers can coexist during any
       overlap. */
    /* 2026-05-27 polish — intro moved to a collapsed <details> at the
       BOTTOM of the body (was a big italic-Georgia block at the top —
       cluttered the verses with a 300-600 word disclaimer-style block).
       Now matches the .forge-reader-xtrad summary-driven pattern. */
    '.forge-reader-intro {',
    '  max-width: 640px;',
    '  margin: 24px auto 0;',
    '  padding: 0 18px 24px;',
    '}',
    '.forge-reader-intro > summary {',
    '  cursor: pointer;',
    '  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;',
    '  font-size: 10.5px;',
    '  letter-spacing: 0.12em;',
    '  text-transform: uppercase;',
    '  color: var(--gold, #d4a55a);',
    '  padding: 8px 0;',
    '  border-top: 1px solid rgba(212,165,90,0.20);',
    '  margin-bottom: 8px;',
    '  list-style: none;',
    '}',
    '.forge-reader-intro > summary::-webkit-details-marker { display: none; }',
    '.forge-reader-intro > summary::before { content: "▸  "; color: var(--gold, #d4a55a); display: inline-block; transition: transform 120ms ease; }',
    '.forge-reader-intro[open] > summary::before { content: "▾  "; }',
    '.forge-reader-intro-body {',
    '  padding: 10px 12px;',
    '  background: rgba(20,23,26,0.55);',
    '  border: 1px solid rgba(212,165,90,0.10);',
    '  border-radius: 4px;',
    '  color: #a0a8b4;',
    '  font: 12px/1.55 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;',
    '}',
    '.forge-reader-section {',
    '  max-width: 640px;',
    '  margin: 0 auto 28px;',
    '}',
    '.forge-reader-section-heading {',
    '  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;',
    '  font-size: 10.5px;',
    '  letter-spacing: 0.14em;',
    '  text-transform: uppercase;',
    '  color: var(--gold, #d4a55a);',
    '  margin: 18px 0 10px;',
    '  padding-bottom: 6px;',
    '  border-bottom: 1px solid rgba(212,165,90,0.20);',
    '}',
    '.forge-reader-verse {',
    '  display: grid;',
    '  grid-template-columns: 56px 1fr;',
    '  gap: 10px;',
    '  margin-bottom: 14px;',
    '  align-items: baseline;',
    '}',
    '.forge-reader-ref {',
    '  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;',
    '  font-size: 10px;',
    '  letter-spacing: 0.06em;',
    '  color: var(--text-3, #6b7280);',
    '  text-align: right;',
    '  padding-top: 2px;',
    '}',
    /* 2026-05-27 polish — was 15px EB Garamond serif. Switched to the
       site\'s system sans-serif so the reader matches the rest of the
       forge chrome (per John feedback: "the style of the reader is
       still the same"). */
    '.forge-reader-vtext {',
    '  color: #e2e6ec;',
    '  font: 14px/1.7 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;',
    '}',
    '.forge-reader-vtext-original {',
    '  color: #9aa3af;',
    '  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;',
    '  font-size: 11.5px;',
    '  line-height: 1.55;',
    '  white-space: pre-wrap;',
    '}',
    '.forge-reader-ent {',
    '  background: rgba(212,165,90,0.08);',
    '  border-bottom: 1px dotted rgba(212,165,90,0.50);',
    '  color: var(--gold-1, #e8c889);',
    '  padding: 0 1px;',
    '  cursor: pointer;',
    '  transition: background 120ms ease;',
    '}',
    '.forge-reader-ent:hover {',
    '  background: rgba(212,165,90,0.20);',
    '}',
    '.forge-reader-xtrad {',
    '  max-width: 640px;',
    '  margin: 24px auto 0;',
    '  padding: 0 18px 24px;',
    '}',
    '.forge-reader-xtrad > summary {',
    '  cursor: pointer;',
    '  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;',
    '  font-size: 10.5px;',
    '  letter-spacing: 0.12em;',
    '  text-transform: uppercase;',
    '  color: var(--gold, #d4a55a);',
    '  padding: 8px 0;',
    '  border-top: 1px solid rgba(212,165,90,0.20);',
    '  margin-bottom: 8px;',
    '}',
    '.forge-reader-xtrad-item {',
    '  margin: 10px 0;',
    '  padding: 10px 12px;',
    '  background: rgba(20,23,26,0.55);',
    '  border: 1px solid rgba(212,165,90,0.10);',
    '  border-radius: 4px;',
    '}',
    '.forge-reader-xtrad-item.is-linked { cursor: pointer; border-color: rgba(212,165,90,0.30); }',
    '.forge-reader-xtrad-item.is-linked:hover { background: rgba(212,165,90,0.06); }',
    '.forge-reader-xtrad-label {',
    '  color: var(--gold-1, #e8c889);',
    '  font-size: 12px;',
    '  font-weight: 600;',
    '  letter-spacing: 0.02em;',
    '  margin-bottom: 4px;',
    '}',
    '.forge-reader-xtrad-note {',
    '  font: 12px/1.5 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;',
    '  color: #a0a8b4;',
    '}',
    '.forge-reader-empty {',
    '  text-align: center;',
    '  color: #6b7280;',
    '  margin-top: 40px;',
    '  font-style: italic;',
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
    // toggleLock + triggerClickPulse — Step 5 (entity clicks → lock the
    // wheel node + draw its cross-tradition wires). Wired 2026-06-14.
    const toggleLock        = deps.toggleLock;
    const triggerClickPulse = deps.triggerClickPulse;

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

    // Verse-rendering helpers — ported from legacy
    // src/js/views/scripture-reader.js, 2026-05-28.
    function _esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function _escRe(s) {
      return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    function _verseText(v, trId) {
      return (v.textVersions && v.textVersions[trId]) ? v.textVersions[trId] : (v.text || '');
    }
    function _annotate(text, entities) {
      // 2026-05-27 — architectural fix for overlapping-entity HTML
      // breakage. Previous implementation applied each entity's regex
      // to the running `out` string, which (because the inserted
      // `<mark>` HTML carries the matched word twice — once in the
      // visible text and once in data-word="...") allowed a later
      // shorter entity to match INSIDE an earlier longer entity's
      // mark tag, breaking the HTML. Symptom: john-8 rendered
      // `data-word="before <mark>Abraham</mark> was, I AM"` with a
      // stray `">` leaking into the visible text.
      //
      // Fix: split the running string into ALREADY-MARKED segments
      // (which we leave alone) and PLAIN segments (which we annotate),
      // re-joining after each entity. Apply entities in length-
      // descending order so the longest match wins at any position.
      if (!entities || !entities.length) return _esc(text).replace(/\n/g, '<br>');
      let out = _esc(text);
      [...entities].sort((a, b) => b.word.length - a.word.length).forEach(en => {
        if (!en || !en.word) return;
        const re = new RegExp('\\b(' + _escRe(en.word) + ')\\b', 'g');
        const wrap = function (m) {
          return '<mark class="forge-reader-ent"' +
                 ' data-node="' + _esc(en.node || '') + '"' +
                 ' data-type="' + _esc(en.type || '') + '"' +
                 ' data-word="' + _esc(en.word) + '">' + m + '</mark>';
        };
        // Split `out` into alternating plain + mark segments. The
        // capture group keeps the mark tags as separators.
        const parts = out.split(/(<mark class="forge-reader-ent"[^>]*>[^<]*<\/mark>)/g);
        for (let i = 0; i < parts.length; i++) {
          // Even indices = plain text BETWEEN marks; odd indices =
          // existing mark tags (leave them alone).
          if (i % 2 === 0) {
            parts[i] = parts[i].replace(re, wrap);
          }
        }
        out = parts.join('');
      });
      return out.replace(/\n/g, '<br>');
    }
    function _buildSections(t, activeTrId) {
      const sections = t.sections || [];
      if (!sections.length) return '';
      const trList = t.translations || [{ id: 'default', label: 'Translation' }];
      const isAlt = !!(activeTrId && trList[0] && activeTrId !== trList[0].id);
      return sections.map(function (sec) {
        const verses = (sec.verses || []).map(function (v) {
          const vtext = _verseText(v, activeTrId);
          const showOriginal = isAlt && !!(v.textVersions && v.textVersions[activeTrId]);
          return '<div class="forge-reader-verse" data-ref="' + _esc(v.ref || '') + '">' +
                 '<span class="forge-reader-ref">' + _esc(v.ref || '') + '</span>' +
                 '<span class="forge-reader-vtext' + (showOriginal ? ' forge-reader-vtext-original' : '') + '" dir="auto">' +
                 _annotate(vtext, showOriginal ? [] : v.entities || []) +
                 '</span></div>';
        }).join('');
        return '<div class="forge-reader-section">' +
               (sec.heading ? '<div class="forge-reader-section-heading">' + _esc(sec.heading) + '</div>' : '') +
               verses + '</div>';
      }).join('');
    }
    function _renderBody(t) {
      const bodyEl = document.getElementById('forge-reader-body');
      if (!bodyEl) return;
      if (!t) {
        bodyEl.innerHTML = '<div class="forge-reader-empty">Text not found in SCRIPTURE_TEXTS.</div>';
        return;
      }
      const trList = t.translations || [{ id: 'default', label: 'Translation' }];
      // Active translation — use first by default. (Translation switcher
      // is a V2 feature — for now show the canonical English.)
      const activeTrId = trList[0] && trList[0].id;
      // 2026-05-27 — intro is now a collapsed <details> at the BOTTOM
      // (was a big italic block at the top — cluttered the verses).
      // Order: sections → cross-tradition → about-this-text.
      const introHtml = t.intro
        ? '<details class="forge-reader-intro"><summary>About this text</summary>' +
          '<div class="forge-reader-intro-body">' + _esc(t.intro).replace(/\n/g, '<br>') + '</div>' +
          '</details>'
        : '';
      const xtradHtml = (t.crossTradition && t.crossTradition.length)
        ? '<details class="forge-reader-xtrad"><summary>Cross-tradition parallels (' + t.crossTradition.length + ')</summary>' +
          '<div class="forge-reader-xtrad-list">' +
          t.crossTradition.map(function (x) {
            return '<div class="forge-reader-xtrad-item' + (x.textId ? ' is-linked' : '') + '"' +
                   (x.textId ? ' data-textid="' + _esc(x.textId) + '"' : '') + '>' +
                   '<div class="forge-reader-xtrad-label">' + _esc(x.label || '') + '</div>' +
                   (x.note ? '<div class="forge-reader-xtrad-note">' + _esc(x.note) + '</div>' : '') +
                   '</div>';
          }).join('') + '</div></details>'
        : '';
      const sectionsHtml = _buildSections(t, activeTrId);
      bodyEl.innerHTML = sectionsHtml + xtradHtml + introHtml;
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
      // Render the actual verses + intro + cross-tradition (2026-05-28).
      _renderBody(t);
      overlay.classList.add('is-open');
      _open = true;
      _textKey = textKey;
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

    // Cross-tradition link clicks → swap to the referenced text.
    // Annotated-entity clicks → LOCK the term's node on the wheel and draw
    // its cross-tradition wires (the Step-5 design intent; toggleLock +
    // triggerClickPulse were injected for exactly this). This is the
    // forge-native node surface: in forge view the shared aside#detail
    // inspector is suppressed (forge owns its wheel + side-panel), so we
    // route through the wheel, not selectNode. Reading 'the deep' and
    // clicking it lights up tehom ↔ Tiamat · Nun · Ginnungagap on the wheel.
    // Guard on a resolvable node so dead/blank annotations stay inert.
    overlay.addEventListener('click', function (ev) {
      const linked = ev.target.closest('.forge-reader-xtrad-item.is-linked');
      if (linked) {
        ev.stopPropagation();
        const tid = linked.getAttribute('data-textid');
        if (tid) open(tid);
        return;
      }
      const ent = ev.target.closest('.forge-reader-ent');
      if (ent) {
        const node = ent.getAttribute('data-node');
        if (node && window.NODES_BY_ID && window.NODES_BY_ID[node] &&
            typeof toggleLock === 'function') {
          ev.stopPropagation();
          toggleLock(node);
          if (typeof triggerClickPulse === 'function') triggerClickPulse(node);
        }
      }
    });

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
