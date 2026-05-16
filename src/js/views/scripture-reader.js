// ============================================================
// CODEX ATLAS — Scripture Reader (clean)
//
// Layout:
//   view-header  → text title + corpus/date line (replaces "SCRIPTURE")
//   view-controls → ← Ring  |  [text ▾]  [language ▾]  [✦ parallels]
//   #scripture-reader-pane → scrollable text (full width by default)
//     entity card SLIDES IN from right only when an entity is clicked
// ============================================================

window.ScriptureReader = (function () {

  let _pane      = null;
  let _textKey   = null;
  let _kdHandler = null;
  let _ctxOpen   = false;

  // ── public ───────────────────────────────────────────────────
  function render(pane, textKey) {
    _pane    = pane;
    _ctxOpen = false;

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

    // ── update view-header ────────────────────────────────────
    const vtEl  = document.getElementById('view-title');
    const vsEl  = document.getElementById('view-subtitle');
    if (vtEl) vtEl.textContent = t.title;
    if (vsEl) vsEl.textContent = t.corpus + '  ·  ' + t.date;

    // ── populate view-controls ────────────────────────────────
    const vc = document.getElementById('view-controls');
    if (vc) {
      const textRows = keys.map(k =>
        `<div class="sr-pop-row${k === textKey ? ' active' : ''}" data-action="text" data-key="${k}">${esc(texts[k].shortTitle)}</div>`
      ).join('');
      const langRows = trList.map(tr =>
        `<div class="sr-pop-row${tr.id === activeTr ? ' active' : ''}" data-action="lang" data-tr="${tr.id}">${esc(tr.label)}</div>`
      ).join('');

      const hasParallels = !!(t.crossTradition && t.crossTradition.length) || !!t.intro;

      vc.innerHTML = `
        <button class="btn btn-mini sr-vc-back" id="sr-vc-back">← Ring</button>
        <div class="sr-pop-wrap" id="sr-text-wrap">
          <button class="btn btn-mini sr-pop-btn" id="sr-text-btn">${esc(t.shortTitle)} <span class="sr-pop-caret">▾</span></button>
          <div class="sr-pop-menu" id="sr-text-menu">${textRows}</div>
        </div>
        <div class="sr-pop-wrap" id="sr-lang-wrap">
          <button class="btn btn-mini sr-pop-btn" id="sr-lang-btn">${esc(activeTrLabel(trList, activeTr))} <span class="sr-pop-caret">▾</span></button>
          <div class="sr-pop-menu" id="sr-lang-menu">${langRows}</div>
        </div>
        ${hasParallels ? `<button class="btn btn-mini sr-vc-ctx" id="sr-ctx-btn" title="Cross-tradition context &amp; intro">✦ parallels</button>` : ''}
      `;

      // back
      document.getElementById('sr-vc-back').onclick = () => {
        _cleanup();
        if (window.STATE) STATE.scriptureReaderMode = null;
        if (window.setView) setView('scripture');
      };

      // text picker
      _wirePopup('sr-text-btn', 'sr-text-menu', vc);
      // lang picker
      _wirePopup('sr-lang-btn', 'sr-lang-menu', vc);

      // picker row clicks
      vc.querySelectorAll('.sr-pop-row').forEach(row => {
        row.onclick = () => {
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
      if (ctxBtn) ctxBtn.onclick = () => _toggleCtx(t, activeTr);
    }

    // ── build pane: context drawer + text + entity drawer ─────
    const sectionsHtml = _buildSections(t, activeTr, trList);

    pane.innerHTML = `
      <div class="sr-layout" id="sr-layout">
        <div class="sr-text-col" id="sr-text-col">
          <div class="sr-ctx-panel" id="sr-ctx-panel" style="display:none"></div>
          <div class="sr-sections" id="sr-sections">${sectionsHtml}</div>
        </div>
        <div class="sr-entity-col" id="sr-entity-col">
          <div class="sr-entity-panel" id="sr-entity-panel"></div>
        </div>
      </div>`;

    // entity mark events
    const textCol = document.getElementById('sr-text-col');
    textCol.addEventListener('mouseover', _onHover, { passive: true });
    textCol.addEventListener('click',     _onClick);

    // outside click clears pinned card
    pane.addEventListener('click', ev => {
      if (!ev.target.closest('.sr-ent') && !ev.target.closest('.sr-entity-col')) _closeEntityCol();
    });

    _kdHandler = ev => {
      if (ev.key === 'Escape') { _closeEntityCol(); _closeAllPopups(); }
    };
    document.addEventListener('keydown', _kdHandler);
  }

  // ── context drawer toggle ─────────────────────────────────────
  function _toggleCtx(t, activeTr) {
    const panel = document.getElementById('sr-ctx-panel');
    const btn   = document.getElementById('sr-ctx-btn');
    if (!panel) return;
    _ctxOpen = !_ctxOpen;
    if (_ctxOpen) {
      panel.style.display = 'block';
      panel.innerHTML = _buildCtx(t);
      if (btn) btn.classList.add('sr-vc-ctx-open');
      // wire cross-tradition links inside ctx
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
            <span class="sr-vtext${isOriginal ? ' sr-vtext-original' : ''}">${_annotate(vtext, isOriginal ? [] : v.entities || [])}</span>
          </div>`;
        }).join('')}
      </div>`).join('');
  }

  // ── entity events ─────────────────────────────────────────────
  function _onHover(ev) {
    const mark = ev.target.closest('.sr-ent');
    if (!mark || document.querySelector('.sr-ent.pinned')) return;
    const ent = _findEnt(mark.dataset.word);
    if (ent) _showCard(ent, mark, false);
  }

  function _onClick(ev) {
    const mark = ev.target.closest('.sr-ent');
    if (!mark) return;
    ev.stopPropagation();
    if (mark.classList.contains('pinned')) { _closeEntityCol(); return; }
    const ent = _findEnt(mark.dataset.word);
    if (ent) _showCard(ent, mark, true);
  }

  // ── entity card ───────────────────────────────────────────────
  function _showCard(ent, markEl, pin) {
    const col   = document.getElementById('sr-entity-col');
    const panel = document.getElementById('sr-entity-panel');
    if (!col || !panel) return;

    document.querySelectorAll('.sr-ent.active, .sr-ent.pinned').forEach(e => e.classList.remove('active', 'pinned'));
    markEl.classList.add('active');
    if (pin) markEl.classList.add('pinned');

    const node      = window.NODES_BY_ID && NODES_BY_ID[ent.node];
    const nodeLabel = node ? (node.label || node.title || ent.node) : ent.node;
    const typeLabel = ent.type ? ent.type[0].toUpperCase() + ent.type.slice(1) : '';

    const parallelsHtml = (ent.parallels || []).length
      ? `<div class="sr-card-parallels">
           <div class="sr-pl-heading">Cross-tradition parallels</div>
           ${ent.parallels.map(p => `
             <div class="sr-parallel${p.textId ? ' linked' : ''}" ${p.textId ? `data-textid="${p.textId}"` : ''}>
               <div class="sr-pl-label">${esc(p.label)}</div>
               ${p.note ? `<div class="sr-pl-note">${esc(p.note)}</div>` : ''}
             </div>`).join('')}
         </div>` : '';

    panel.innerHTML = `
      <div class="sr-card-close-row">
        <button class="sr-card-close-btn" id="sr-card-close">✕</button>
      </div>
      <div class="sr-card-word">${esc(ent.word)}</div>
      ${typeLabel ? `<span class="sr-card-type sr-type-${esc(ent.type || 'other')}">${esc(typeLabel)}</span>` : ''}
      ${node ? `<div class="sr-card-nodeid">${esc(nodeLabel)}</div>` : ''}
      ${ent.note ? `<div class="sr-card-note">${ent.note}</div>` : ''}
      ${parallelsHtml}
      ${ent.node ? `<button class="sr-atlas-btn" data-node="${escAttr(ent.node)}">Open in Atlas →</button>` : ''}`;

    // open drawer
    col.classList.add('open');

    document.getElementById('sr-card-close').onclick = () => _closeEntityCol();

    panel.querySelectorAll('.sr-parallel.linked').forEach(el => {
      el.onclick = () => {
        const key = el.dataset.textid;
        if (key && window.SCRIPTURE_TEXTS && SCRIPTURE_TEXTS[key]) {
          _cleanup(); STATE.scriptureReaderMode = key; render(_pane, key);
        }
      };
    });

    panel.querySelectorAll('.sr-atlas-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.node;
        _cleanup(); STATE.scriptureReaderMode = null;
        if (window.setView) {
          setView('pantheon');
          if (window.selectNode && window.NODES_BY_ID) {
            const n = NODES_BY_ID[id];
            if (n) setTimeout(() => selectNode(n), 320);
          }
        }
      };
    });
  }

  function _closeEntityCol() {
    document.querySelectorAll('.sr-ent.active, .sr-ent.pinned').forEach(e => e.classList.remove('active', 'pinned'));
    const col = document.getElementById('sr-entity-col');
    if (col) col.classList.remove('open');
  }

  // ── popup wiring ──────────────────────────────────────────────
  function _wirePopup(btnId, menuId, container) {
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

  function activeTrLabel(trList, id) {
    const tr = trList.find(x => x.id === id);
    return tr ? tr.label : id;
  }

  function _annotate(text, entities) {
    if (!entities || !entities.length) return esc(text);
    let out = esc(text);
    [...entities].sort((a, b) => b.word.length - a.word.length).forEach(en => {
      const re = new RegExp(`\\b(${escRe(en.word)})\\b`, 'g');
      out = out.replace(re, m =>
        `<mark class="sr-ent" data-node="${escAttr(en.node)}" data-type="${escAttr(en.type||'')}" data-word="${escAttr(en.word)}">${m}</mark>`
      );
    });
    return out;
  }

  function _findEnt(word) {
    const t = window.SCRIPTURE_TEXTS && SCRIPTURE_TEXTS[_textKey];
    if (!t) return null;
    for (const s of t.sections) for (const v of s.verses)
      for (const e of (v.entities || [])) if (e.word === word) return e;
    return null;
  }

  function _cleanup() {
    if (_kdHandler) { document.removeEventListener('keydown', _kdHandler); _kdHandler = null; }
  }

  function esc(s)     { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function escAttr(s) { return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function escRe(s)   { return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

  return { render };
})();
