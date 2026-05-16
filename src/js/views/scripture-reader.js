// ============================================================
// CODEX ATLAS — Scripture Reader
// Mounts into #scripture-reader-pane when STATE.scriptureReaderMode is set.
// Navigation (← Ring, text tabs, translation) lives in #view-controls,
// NOT inside the pane, so it never overlaps the sidebar.
// ============================================================

window.ScriptureReader = (function () {

  let _pane = null;
  let _activeTextKey = null;
  let _keydownHandler = null;

  // ── public entry point ────────────────────────────────────────
  function render(pane, textKey) {
    _pane = pane;

    const texts = window.SCRIPTURE_TEXTS || {};
    const keys = Object.keys(texts);
    if (!keys.length) {
      pane.innerHTML = '<div class="sr-panel-empty">No scripture texts loaded.</div>';
      return;
    }
    if (!textKey || !texts[textKey]) textKey = keys[0];
    _activeTextKey = textKey;
    const t = texts[textKey];

    // Current translation (defaults to first available)
    const trList = t.translations || [{ id: 'default', label: 'Translation' }];
    if (!window.STATE) window.STATE = {};
    if (!STATE.scriptureTranslation || !trList.find(x => x.id === STATE.scriptureTranslation)) {
      STATE.scriptureTranslation = trList[0].id;
    }
    const activeTr = STATE.scriptureTranslation;

    // ── populate view-controls (header strip, outside the pane) ──
    const vc = document.getElementById('view-controls');
    if (vc) {
      const tabsHtml = keys.map(k =>
        `<button class="btn btn-mini sr-vc-tab${k === textKey ? ' sr-vc-tab-active' : ''}" data-key="${k}">${esc(texts[k].shortTitle)}</button>`
      ).join('');

      const trHtml = trList.length > 1
        ? trList.map(tr =>
            `<button class="btn btn-mini sr-vc-tr${tr.id === activeTr ? ' sr-vc-tr-active' : ''}" data-tr="${tr.id}" title="${esc(tr.note || '')}">${esc(tr.label)}</button>`
          ).join('')
        : '';

      vc.innerHTML = `
        <button class="btn btn-mini sr-vc-back" id="sr-vc-back" title="Return to ring visualization">← Ring</button>
        <span class="sr-vc-sep">|</span>
        ${tabsHtml}
        ${trHtml ? `<span class="sr-vc-sep">|</span>${trHtml}` : ''}
      `;

      document.getElementById('sr-vc-back').onclick = () => {
        _cleanup();
        if (window.STATE) STATE.scriptureReaderMode = null;
        if (window.setView) setView('scripture');
      };

      vc.querySelectorAll('.sr-vc-tab').forEach(btn => {
        btn.onclick = () => {
          _cleanup();
          if (window.STATE) STATE.scriptureReaderMode = btn.dataset.key;
          render(pane, btn.dataset.key);
        };
      });

      vc.querySelectorAll('.sr-vc-tr').forEach(btn => {
        btn.onclick = () => {
          if (window.STATE) STATE.scriptureTranslation = btn.dataset.tr;
          render(pane, textKey);
        };
      });
    }

    // ── cross-tradition header block ──────────────────────────
    const xtradHtml = (t.crossTradition && t.crossTradition.length)
      ? `<div class="sr-xtrad-block">
           <div class="sr-xtrad-label">Cross-tradition parallels in this text</div>
           <div class="sr-xtrad-list">
             ${t.crossTradition.map(x => `
               <div class="sr-xtrad-item${x.textId ? ' linked' : ''}" ${x.textId ? `data-textid="${x.textId}"` : ''}>
                 <span class="sr-xtrad-name">${esc(x.label)}</span>
                 ${x.note ? `<span class="sr-xtrad-note">${esc(x.note)}</span>` : ''}
               </div>`).join('')}
           </div>
         </div>` : '';

    // ── verse body ────────────────────────────────────────────
    const sectionsHtml = t.sections.map(sec => `
      <div class="sr-section">
        ${sec.heading ? `<div class="sr-section-heading">${esc(sec.heading)}</div>` : ''}
        ${sec.verses.map(v => {
          const vtext = _verseText(v, activeTr);
          // isOriginal = we're showing a non-English transliteration for this verse
          const isOriginal = activeTr !== (trList[0] && trList[0].id) && !!(v.textVersions && v.textVersions[activeTr]);
          return `
          <div class="sr-verse" data-ref="${esc(v.ref)}">
            <span class="sr-ref">${esc(v.ref)}</span>
            <span class="sr-vtext${isOriginal ? ' sr-vtext-original' : ''}">${annotate(vtext, isOriginal ? [] : v.entities || [])}</span>
          </div>`;
        }).join('')}
      </div>`).join('');

    // ── full pane render ──────────────────────────────────────
    pane.innerHTML = `
      <div class="sr-layout">
        <div class="sr-text-col" id="sr-text-col">
          <div class="sr-text-header">
            <div class="sr-text-title">${esc(t.title)}</div>
            <div class="sr-text-meta">
              <span class="sr-corpus">${esc(t.corpus)}</span>
              <span class="sr-msep">·</span>
              <span class="sr-date">${esc(t.date)}</span>
              <span class="sr-msep">·</span>
              <span class="sr-lang">${esc(activeTrLabel(trList, activeTr))}</span>
            </div>
            ${t.intro ? `<p class="sr-intro">${esc(t.intro)}</p>` : ''}
            ${xtradHtml}
          </div>
          <div class="sr-sections" id="sr-sections">${sectionsHtml}</div>
        </div>

        <div class="sr-entity-col" id="sr-entity-col">
          <div class="sr-entity-panel" id="sr-entity-panel">
            ${_emptyPanelHtml()}
          </div>
        </div>
      </div>`;

    // ── wire cross-tradition links ────────────────────────────
    document.querySelectorAll('.sr-xtrad-item.linked').forEach(el => {
      el.onclick = () => {
        const key = el.dataset.textid;
        if (key && window.SCRIPTURE_TEXTS && SCRIPTURE_TEXTS[key]) {
          _cleanup();
          if (window.STATE) STATE.scriptureReaderMode = key;
          render(pane, key);
        }
      };
    });

    // ── entity marks — hover shows, click pins ────────────────
    const textCol = document.getElementById('sr-text-col');
    textCol.addEventListener('mouseover', _onHover, { passive: true });
    textCol.addEventListener('click', _onClick);

    // Esc clears pinned card
    _keydownHandler = (ev) => { if (ev.key === 'Escape') _clearCard(); };
    document.addEventListener('keydown', _keydownHandler);
  }

  // ── helpers ───────────────────────────────────────────────────
  function _verseText(v, trId) {
    if (v.textVersions && v.textVersions[trId]) return v.textVersions[trId];
    return v.text || '';
  }

  function activeTrLabel(trList, activeTr) {
    const tr = trList.find(x => x.id === activeTr);
    return tr ? tr.label : activeTr;
  }

  // ── entity annotation ─────────────────────────────────────────
  function annotate(text, entities) {
    if (!entities || !entities.length) return esc(text);
    let out = esc(text);
    const sorted = [...entities].sort((a, b) => b.word.length - a.word.length);
    sorted.forEach(en => {
      const re = new RegExp(`\\b(${escRe(en.word)})\\b`, 'g');
      out = out.replace(re, (m) =>
        `<mark class="sr-ent" data-node="${escAttr(en.node)}" data-type="${escAttr(en.type || '')}" data-word="${escAttr(en.word)}">${m}</mark>`
      );
    });
    return out;
  }

  // ── event handlers ────────────────────────────────────────────
  function _onHover(ev) {
    const mark = ev.target.closest('.sr-ent');
    if (!mark) return;
    if (document.querySelector('.sr-ent.pinned')) return;
    const ent = _findEntity(mark.dataset.word);
    if (ent) _showCard(ent, mark, false);
  }

  function _onClick(ev) {
    const mark = ev.target.closest('.sr-ent');
    if (!mark) return;
    ev.stopPropagation();
    if (mark.classList.contains('pinned')) { _clearCard(); return; }
    const ent = _findEntity(mark.dataset.word);
    if (ent) _showCard(ent, mark, true);
  }

  // ── card rendering ────────────────────────────────────────────
  function _showCard(ent, markEl, pin) {
    const panel = document.getElementById('sr-entity-panel');
    if (!panel) return;

    document.querySelectorAll('.sr-ent.active, .sr-ent.pinned').forEach(el => el.classList.remove('active', 'pinned'));
    markEl.classList.add('active');
    if (pin) markEl.classList.add('pinned');

    const node = window.NODES_BY_ID && NODES_BY_ID[ent.node];
    const nodeLabel = node ? (node.label || node.title || ent.node) : ent.node;
    const typeLabel = ent.type ? ent.type.charAt(0).toUpperCase() + ent.type.slice(1) : '';

    const parallelsHtml = (ent.parallels || []).length
      ? `<div class="sr-card-parallels">
           <div class="sr-pl-heading">Cross-tradition parallels</div>
           ${(ent.parallels || []).map(p => `
             <div class="sr-parallel${p.textId ? ' linked' : ''}" ${p.textId ? `data-textid="${p.textId}"` : ''}>
               <div class="sr-pl-label">${esc(p.label)}</div>
               ${p.note ? `<div class="sr-pl-note">${esc(p.note)}</div>` : ''}
             </div>`).join('')}
         </div>` : '';

    panel.innerHTML = `
      <div class="sr-entity-card${pin ? ' pinned' : ''}">
        <div class="sr-card-top">
          <div class="sr-card-word">${esc(ent.word)}</div>
          ${typeLabel ? `<span class="sr-card-type sr-type-${esc(ent.type || 'other')}">${esc(typeLabel)}</span>` : ''}
          ${pin ? `<button class="sr-card-close" title="Close (Esc)">✕</button>` : ''}
        </div>
        ${node ? `<div class="sr-card-nodeid">${esc(nodeLabel)}</div>` : ''}
        ${ent.note ? `<div class="sr-card-note">${ent.note}</div>` : ''}
        ${parallelsHtml}
        <div class="sr-card-actions">
          ${ent.node ? `<button class="sr-atlas-btn" data-node="${escAttr(ent.node)}">Open in Atlas →</button>` : ''}
        </div>
      </div>`;

    panel.querySelectorAll('.sr-parallel.linked').forEach(el => {
      el.onclick = () => {
        const key = el.dataset.textid;
        if (key && window.SCRIPTURE_TEXTS && SCRIPTURE_TEXTS[key]) {
          _cleanup();
          if (window.STATE) STATE.scriptureReaderMode = key;
          render(_pane, key);
        }
      };
    });

    const closeBtn = panel.querySelector('.sr-card-close');
    if (closeBtn) closeBtn.onclick = _clearCard;

    panel.querySelectorAll('.sr-atlas-btn').forEach(btn => {
      btn.onclick = () => {
        const nodeId = btn.dataset.node;
        _cleanup();
        if (window.STATE) STATE.scriptureReaderMode = null;
        if (window.setView) {
          setView('pantheon');
          if (window.selectNode && window.NODES_BY_ID) {
            const n = NODES_BY_ID[nodeId];
            if (n) setTimeout(() => selectNode(n), 320);
          }
        }
      };
    });
  }

  function _clearCard() {
    document.querySelectorAll('.sr-ent.active, .sr-ent.pinned').forEach(el => el.classList.remove('active', 'pinned'));
    const panel = document.getElementById('sr-entity-panel');
    if (panel) panel.innerHTML = _emptyPanelHtml();
  }

  function _emptyPanelHtml() {
    return `
      <div class="sr-panel-empty">
        <div class="sr-panel-glyph">✦</div>
        <div class="sr-panel-hint">Hover or click a <mark class="sr-ent-demo">highlighted term</mark> to explore its cross-tradition connections</div>
      </div>`;
  }

  function _findEntity(word) {
    const t = window.SCRIPTURE_TEXTS && SCRIPTURE_TEXTS[_activeTextKey];
    if (!t) return null;
    for (const sec of t.sections) {
      for (const v of sec.verses) {
        for (const e of (v.entities || [])) {
          if (e.word === word) return e;
        }
      }
    }
    return null;
  }

  function _cleanup() {
    if (_keydownHandler) {
      document.removeEventListener('keydown', _keydownHandler);
      _keydownHandler = null;
    }
  }

  // ── escape helpers ────────────────────────────────────────────
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escAttr(s) { return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  return { render };
})();
