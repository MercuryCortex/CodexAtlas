// ============================================================
// CODEX ATLAS — Scripture Reader
//
// Layout:
//   sr-topbar  → ← Ring  |  title  |  [text ▾]  [language ▾]  [✦ parallels]
//   sr-body    → optional ctx panel (toggle) + scrollable text
//
// Entity clicks → populate the app's collapsible right detail panel
// Body class view-scripture-reader → hides global view-header
// ============================================================

window.ScriptureReader = (function () {

  let _pane             = null;
  let _textKey          = null;
  let _kdHandler        = null;
  let _paneClickHandler = null;
  let _ctxOpen          = false;

  // ── public ───────────────────────────────────────────────────
  function render(pane, textKey) {
    _pane    = pane;
    _ctxOpen = false;

    // Remove stale listeners from previous render (pane element persists across re-renders)
    if (_kdHandler)        { document.removeEventListener('keydown', _kdHandler); _kdHandler = null; }
    if (_paneClickHandler) { pane.removeEventListener('click', _paneClickHandler); _paneClickHandler = null; }

    const texts = window.SCRIPTURE_TEXTS || {};
    const keys  = Object.keys(texts);
    if (!keys.length) { pane.innerHTML = '<div class="sr-empty-state">No texts loaded.</div>'; return; }
    if (!textKey || !texts[textKey]) textKey = keys[0];
    _textKey = textKey;
    const t  = texts[textKey];

    const trList   = t.translations || [{ id: 'default', label: 'Translation' }];
    if (!window.STATE) window.STATE = {};
    if (!STATE.scriptureTranslation || !trList.find(x => x.id === STATE.scriptureTranslation))
      STATE.scriptureTranslation = trList[0].id;
    const activeTr = STATE.scriptureTranslation;

    // Signal: hide global view-header + zoom meter while reader is active
    document.body.classList.add('view-scripture-reader');
    document.querySelectorAll('.zoom-meter').forEach(zm => { zm.style.display = 'none'; });

    // Clear global view-controls (topbar lives inside the pane)
    const vc = document.getElementById('view-controls');
    if (vc) vc.innerHTML = '';

    // ── dropdown rows ─────────────────────────────────────────
    const textRows = keys.map(k =>
      `<div class="sr-pop-row${k === textKey ? ' active' : ''}" data-action="text" data-key="${k}">${esc(texts[k].shortTitle)}</div>`
    ).join('');
    const langRows = trList.map(tr =>
      `<div class="sr-pop-row${tr.id === activeTr ? ' active' : ''}" data-action="lang" data-tr="${tr.id}">${esc(tr.label)}</div>`
    ).join('');

    const hasParallels = !!(t.crossTradition && t.crossTradition.length) || !!t.intro;

    // ── build pane ────────────────────────────────────────────
    const sectionsHtml = _buildSections(t, activeTr, trList);

    pane.innerHTML = `
      <div class="sr-layout" id="sr-layout">
        <div class="sr-topbar" id="sr-topbar">
          <div class="sr-topbar-left">
            <button class="btn btn-mini sr-vc-back" id="sr-vc-back">← Ring</button>
            <span class="sr-topbar-title">${esc(t.title)}</span>
          </div>
          <div class="sr-topbar-right">
            <div class="sr-pop-wrap" id="sr-text-wrap">
              <button class="btn btn-mini sr-pop-btn" id="sr-text-btn">${esc(t.shortTitle)}<span class="sr-pop-caret">▾</span></button>
              <div class="sr-pop-menu" id="sr-text-menu">${textRows}</div>
            </div>
            <div class="sr-pop-wrap" id="sr-lang-wrap">
              <button class="btn btn-mini sr-pop-btn" id="sr-lang-btn">${esc(_activeTrLabel(trList, activeTr))}<span class="sr-pop-caret">▾</span></button>
              <div class="sr-pop-menu" id="sr-lang-menu">${langRows}</div>
            </div>
            ${hasParallels ? `<button class="btn btn-mini sr-vc-ctx" id="sr-ctx-btn" title="Cross-tradition context &amp; intro">✦ parallels</button>` : ''}
          </div>
        </div>
        <div class="sr-body" id="sr-body">
          <div class="sr-ctx-panel" id="sr-ctx-panel" style="display:none"></div>
          <div class="sr-sections" id="sr-sections">${sectionsHtml}</div>
        </div>
      </div>`;

    // back
    document.getElementById('sr-vc-back').onclick = () => {
      _cleanup();
      if (window.STATE) STATE.scriptureReaderMode = null;
      if (window.setView) setView('scripture');
    };

    // text + lang dropdowns
    _wirePopup('sr-text-btn', 'sr-text-menu');
    _wirePopup('sr-lang-btn', 'sr-lang-menu');

    // dropdown row clicks
    pane.querySelectorAll('.sr-pop-row').forEach(row => {
      row.onclick = ev => {
        ev.stopPropagation();
        _closeAllPopups();
        if (row.dataset.action === 'text') {
          _cleanup();
          STATE.scriptureReaderMode = row.dataset.key;
          render(pane, row.dataset.key);
        } else {
          STATE.scriptureTranslation = row.dataset.tr;
          render(pane, textKey);
        }
      };
    });

    // context toggle
    const ctxBtn = document.getElementById('sr-ctx-btn');
    if (ctxBtn) ctxBtn.onclick = () => _toggleCtx(t);

    // entity mark events on body
    const body = document.getElementById('sr-body');
    body.addEventListener('click', _onClick);

    // click outside entity / topbar → unpin + close popups
    _paneClickHandler = ev => {
      if (!ev.target.closest('.sr-ent') && !ev.target.closest('#sr-topbar')) {
        _closeAllPopups();
        _unpinEntity();
      }
    };
    pane.addEventListener('click', _paneClickHandler);

    _kdHandler = ev => {
      if (ev.key === 'Escape') { _unpinEntity(); _closeAllPopups(); }
    };
    document.addEventListener('keydown', _kdHandler);
  }

  // ── context drawer toggle ─────────────────────────────────────
  function _toggleCtx(t) {
    const panel = document.getElementById('sr-ctx-panel');
    const btn   = document.getElementById('sr-ctx-btn');
    if (!panel) return;
    _ctxOpen = !_ctxOpen;
    if (_ctxOpen) {
      panel.style.display = 'block';
      panel.innerHTML = _buildCtx(t);
      if (btn) btn.classList.add('sr-vc-ctx-open');
      panel.querySelectorAll('.sr-xtrad-item.linked').forEach(el => {
        el.onclick = () => {
          const key = el.dataset.textid;
          if (key && window.SCRIPTURE_TEXTS && SCRIPTURE_TEXTS[key]) {
            _cleanup();
            STATE.scriptureReaderMode = key;
            render(_pane, key);
          }
        };
      });
    } else {
      panel.style.display = 'none';
      if (btn) btn.classList.remove('sr-vc-ctx-open');
    }
  }

  function _buildCtx(t) {
    const introHtml = t.intro
      ? `<p class="sr-intro">${esc(t.intro)}</p>` : '';
    const xtradHtml = (t.crossTradition && t.crossTradition.length)
      ? `<div class="sr-xtrad-list">
           ${t.crossTradition.map(x => `
             <div class="sr-xtrad-item${x.textId ? ' linked' : ''}" ${x.textId ? `data-textid="${x.textId}"` : ''}>
               <span class="sr-xtrad-name">${esc(x.label)}</span>
               ${x.note ? `<span class="sr-xtrad-note">${esc(x.note)}</span>` : ''}
             </div>`).join('')}
         </div>` : '';
    return `<div class="sr-ctx-inner">${introHtml}${xtradHtml}</div>`;
  }

  // ── sections / verse builder ──────────────────────────────────
  function _buildSections(t, activeTr, trList) {
    return t.sections.map(sec => `
      <div class="sr-section">
        ${sec.heading ? `<div class="sr-section-heading">${esc(sec.heading)}</div>` : ''}
        ${sec.verses.map(v => {
          const vtext     = _verseText(v, activeTr);
          const isOriginal = activeTr !== (trList[0] && trList[0].id) && !!(v.textVersions && v.textVersions[activeTr]);
          return `<div class="sr-verse" data-ref="${esc(v.ref)}">
            <span class="sr-ref">${esc(v.ref)}</span>
            <span class="sr-vtext${isOriginal ? ' sr-vtext-original' : ''}" dir="auto">${_annotate(vtext, isOriginal ? [] : v.entities || [])}</span>
          </div>`;
        }).join('')}
      </div>`).join('');
  }

  // ── entity click handler ──────────────────────────────────────
  function _onClick(ev) {
    const mark = ev.target.closest('.sr-ent');
    if (!mark) return;
    ev.stopPropagation();
    if (mark.classList.contains('pinned')) { _unpinEntity(); return; }
    const ent = _findEnt(mark.dataset.word);
    if (ent) _showCard(ent, mark);
  }

  // ── entity card → right detail panel (uses real vault selectNode) ────────
  function _showCard(ent, markEl) {
    document.querySelectorAll('.sr-ent.active, .sr-ent.pinned').forEach(e => e.classList.remove('active', 'pinned'));
    markEl.classList.add('active', 'pinned');

    if (ent.node && window.NODES_BY_ID && NODES_BY_ID[ent.node]) {
      // Render the real vault node in the detail panel (edges, body, connections)
      if (window.STATE) STATE.selected = ent.node;
      document.body.classList.remove('detail-collapsed');
      const dt = document.getElementById('detail-toggle');
      if (dt) dt.textContent = '›';
      if (window.renderDetail) renderDetail();
      return;
    }

    // Fallback: node not in vault — show a minimal inline note
    const el = document.getElementById('detail-inner');
    if (!el) return;
    el.innerHTML = `<div class="sr-detail-card">
      <div class="sr-card-word">${esc(ent.word)}</div>
      ${ent.note ? `<div class="sr-card-note">${ent.note}</div>` : '<p style="color:var(--text-3);font-size:13px;margin-top:10px">No vault node found.</p>'}
    </div>`;
    document.body.classList.remove('detail-collapsed');
    const dt = document.getElementById('detail-toggle');
    if (dt) dt.textContent = '›';
  }

  function _unpinEntity() {
    document.querySelectorAll('.sr-ent.active, .sr-ent.pinned').forEach(e => e.classList.remove('active', 'pinned'));
  }

  // ── popup wiring ──────────────────────────────────────────────
  function _wirePopup(btnId, menuId) {
    const btn  = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    if (!btn || !menu) return;
    btn.onclick = ev => {
      ev.stopPropagation();
      const isOpen = menu.classList.contains('open');
      _closeAllPopups();
      if (!isOpen) { menu.classList.add('open'); btn.classList.add('open'); }
    };
  }

  function _closeAllPopups() {
    document.querySelectorAll('.sr-pop-menu.open').forEach(m => m.classList.remove('open'));
    document.querySelectorAll('.sr-pop-btn.open').forEach(b => b.classList.remove('open'));
  }

  // ── helpers ───────────────────────────────────────────────────
  function _verseText(v, trId) {
    return (v.textVersions && v.textVersions[trId]) ? v.textVersions[trId] : (v.text || '');
  }

  function _activeTrLabel(trList, id) {
    const tr = trList.find(x => x.id === id);
    return tr ? tr.label : id;
  }

  function _annotate(text, entities) {
    if (!entities || !entities.length) return esc(text).replace(/\n/g, '<br>');
    let out = esc(text);
    [...entities].sort((a, b) => b.word.length - a.word.length).forEach(en => {
      const re = new RegExp(`\\b(${escRe(en.word)})\\b`, 'g');
      out = out.replace(re, m =>
        `<mark class="sr-ent" data-node="${escAttr(en.node)}" data-type="${escAttr(en.type||'')}" data-word="${escAttr(en.word)}">${m}</mark>`
      );
    });
    return out.replace(/\n/g, '<br>');
  }

  function _findEnt(word) {
    const t = window.SCRIPTURE_TEXTS && SCRIPTURE_TEXTS[_textKey];
    if (!t) return null;
    for (const s of t.sections) for (const v of s.verses)
      for (const e of (v.entities || [])) if (e.word === word) return e;
    return null;
  }

  function _cleanup() {
    if (_kdHandler)        { document.removeEventListener('keydown', _kdHandler); _kdHandler = null; }
    if (_paneClickHandler && _pane) { _pane.removeEventListener('click', _paneClickHandler); _paneClickHandler = null; }
    document.body.classList.remove('view-scripture-reader');
    document.querySelectorAll('.zoom-meter').forEach(zm => { zm.style.display = ''; });
    // Collapse detail panel and clear entity card
    const el = document.getElementById('detail-inner');
    if (el) el.innerHTML = '<div class="empty">Select a node to inspect.</div>';
    document.body.classList.add('detail-collapsed');
    const dt = document.getElementById('detail-toggle');
    if (dt) dt.textContent = '‹';
  }

  function esc(s)     { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function escAttr(s) { return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function escRe(s)   { return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

  return { render };
})();
