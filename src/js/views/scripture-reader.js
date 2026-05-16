// ============================================================
// CODEX ATLAS — Scripture Reader
//
// Topbar:  ← Ring  |  title  [canon]  |  [Religion ▾]  [Text ▾]  [lang ▾]  [✦ parallels]
// Two-level selector: religion → text (grouped by canon within religion)
// ============================================================

window.ScriptureReader = (function () {

  let _pane             = null;
  let _textKey          = null;
  let _religion         = 'Christianity';
  let _kdHandler        = null;
  let _paneClickHandler = null;
  let _ctxOpen          = false;

  // ── Catalog: religion / group / canon for every text key ──────────────
  // group   = section header inside the text dropdown
  // canon   = small badge shown on each row + in the topbar
  // sort    = order within group (lower = higher)
  const CATALOG = {
    // ── Christianity — Old Testament ────────────────────────────────
    'genesis-1':          { religion:'Christianity', group:'Old Testament',          canon:'All Canons',          sort:10 },
    'job-38':             { religion:'Christianity', group:'Old Testament',          canon:'All Canons',          sort:20 },
    'proverbs-8':         { religion:'Christianity', group:'Old Testament',          canon:'All Canons',          sort:30 },
    'psalm-22':           { religion:'Christianity', group:'Old Testament',          canon:'All Canons',          sort:40 },
    'psalm-82':           { religion:'Christianity', group:'Old Testament',          canon:'All Canons',          sort:50 },
    'isaiah-6':           { religion:'Christianity', group:'Old Testament',          canon:'All Canons',          sort:60 },
    'isaiah-45':          { religion:'Christianity', group:'Old Testament',          canon:'All Canons',          sort:70 },
    'ezekiel-1':          { religion:'Christianity', group:'Old Testament',          canon:'All Canons',          sort:80 },
    'ecclesiastes-1':     { religion:'Christianity', group:'Old Testament',          canon:'All Canons',          sort:90 },
    'wisdom-of-solomon':  { religion:'Christianity', group:'Deuterocanon',           canon:'Catholic / Orthodox / Ethiopian', sort:10 },
    'song-of-songs':      { religion:'Christianity', group:'Old Testament',          canon:'All Canons',          sort:95 },
    // ── Christianity — New Testament ────────────────────────────────
    'john-1':             { religion:'Christianity', group:'New Testament',          canon:'All Canons',          sort:10 },
    'john-3':             { religion:'Christianity', group:'New Testament',          canon:'All Canons',          sort:20 },
    'romans-8':           { religion:'Christianity', group:'New Testament',          canon:'All Canons',          sort:30 },
    '1-corinthians-15':   { religion:'Christianity', group:'New Testament',          canon:'All Canons',          sort:40 },
    'revelation-12':      { religion:'Christianity', group:'New Testament',          canon:'All Canons',          sort:50 },
    'matthew-sermon-mount': { religion:'Christianity', group:'New Testament',        canon:'All Canons',          sort:25 },
    'philippians-2':      { religion:'Christianity', group:'New Testament',          canon:'All Canons',          sort:45 },
    'colossians-1':       { religion:'Christianity', group:'New Testament',          canon:'All Canons',          sort:46 },
    'acts-17-areopagus':  { religion:'Christianity', group:'New Testament',          canon:'All Canons',          sort:55 },
    'luke-15-prodigal':   { religion:'Christianity', group:'New Testament',          canon:'All Canons',          sort:60 },
    // ── Christianity — Ethiopian Canon ──────────────────────────────
    'book-of-enoch':      { religion:'Christianity', group:'Ethiopian Canon',        canon:'Ethiopian Orthodox',  sort:10 },
    // ── Christianity — Christian Mysticism ──────────────────────────
    'pseudo-dionysius-mystical-theology': { religion:'Christianity', group:'Christian Mysticism', canon:'Neoplatonic Christianity', sort:10 },
    'meister-eckhart-godhead':            { religion:'Christianity', group:'Christian Mysticism', canon:'Rhineland Mysticism',      sort:20 },
    // ── Christianity — Gnostic / Nag Hammadi ────────────────────────
    'gospel-of-thomas':   { religion:'Christianity', group:'Gnostic / Nag Hammadi', canon:'Non-canonical',       sort:10 },
    'apocryphon-of-john': { religion:'Christianity', group:'Gnostic / Nag Hammadi', canon:'Non-canonical',       sort:20 },
    'gospel-of-philip':   { religion:'Christianity', group:'Gnostic / Nag Hammadi', canon:'Non-canonical',       sort:30 },
    // ── Christianity — Medieval Mysticism ───────────────────────────
    'julian-of-norwich':  { religion:'Christianity', group:'Medieval Mysticism',    canon:'Catholic Mysticism',  sort:10 },
    // ── Judaism ─────────────────────────────────────────────────────
    'ezekiel-37-dry-bones': { religion:'Judaism',     group:'Nevi\'im (Prophets)',   canon:'Hebrew Bible',        sort:10 },
    'sefer-yetzirah':     { religion:'Judaism',       group:'Kabbalah',              canon:'Rabbinic / Kabbalistic', sort:10 },
    'zohar-ein-sof':      { religion:'Judaism',       group:'Kabbalah',              canon:'Rabbinic / Kabbalistic', sort:20 },
    // ── Islam ───────────────────────────────────────────────────────
    'quran-fatiha-nur':   { religion:'Islam',         group:'Quran',                 canon:'All Canons',          sort:10 },
    'surah-ya-sin':       { religion:'Islam',         group:'Quran',                 canon:'All Canons',          sort:20 },
    'rumi-masnavi':       { religion:'Islam',         group:'Sufism',                canon:'Sufi Literature',     sort:10 },
    'ibn-arabi-fusus':    { religion:'Islam',         group:'Sufism',                canon:'Sufi Literature',     sort:20 },
    // ── Hinduism ────────────────────────────────────────────────────
    'nasadiya-sukta':     { religion:'Hinduism',      group:'Vedic Hymns',           canon:'Rig Veda',            sort:10 },
    'purusha-sukta':      { religion:'Hinduism',      group:'Vedic Hymns',           canon:'Rig Veda',            sort:20 },
    'chandogya-621':      { religion:'Hinduism',      group:'Upanishads',            canon:'Sama Veda',           sort:10 },
    'katha-upanishad':    { religion:'Hinduism',      group:'Upanishads',            canon:'Upanishads',          sort:20 },
    'mandukya-upanishad': { religion:'Hinduism',      group:'Upanishads',            canon:'Upanishads',          sort:30 },
    'brihadaranyaka-neti-neti': { religion:'Hinduism', group:'Upanishads',           canon:'Upanishads',          sort:40 },
    'isha-upanishad':     { religion:'Hinduism',      group:'Upanishads',            canon:'Upanishads',          sort:50 },
    'bhagavad-gita-4':    { religion:'Hinduism',      group:'Epics',                 canon:'Mahabharata',         sort:10 },
    'bhagavad-gita-11':   { religion:'Hinduism',      group:'Epics',                 canon:'Mahabharata',         sort:20 },
    // ── Buddhism ────────────────────────────────────────────────────
    'dhammapada-1':       { religion:'Buddhism',      group:'Pali Canon',            canon:'Theravada',           sort:10 },
    'heart-sutra':        { religion:'Buddhism',      group:'Mahayana',              canon:'Mahayana',            sort:10 },
    'bardo-thodol':       { religion:'Buddhism',      group:'Vajrayana',             canon:'Tibetan Canon',       sort:10 },
    // ── Taoism ──────────────────────────────────────────────────────
    'tao-te-ching-1':     { religion:'Taoism',        group:'Classical Taoism',      canon:'Classical',           sort:10 },
    'zhuangzi':           { religion:'Taoism',        group:'Classical Taoism',      canon:'Classical',           sort:20 },
    'i-ching-1':          { religion:'Taoism',        group:'Chinese Classics',      canon:'Chinese Canon',       sort:10 },
    // ── Hermeticism ─────────────────────────────────────────────────
    'poimandres':          { religion:'Hermeticism',  group:'Corpus Hermeticum',     canon:'Hermetic',            sort:10 },
    'corpus-hermeticum-3': { religion:'Hermeticism',  group:'Corpus Hermeticum',     canon:'Hermetic',            sort:20 },
    'corpus-hermeticum-4': { religion:'Hermeticism',  group:'Corpus Hermeticum',     canon:'Hermetic',            sort:30 },
    'corpus-hermeticum-7': { religion:'Hermeticism',  group:'Corpus Hermeticum',     canon:'Hermetic',            sort:40 },
    'corpus-hermeticum-11':{ religion:'Hermeticism',  group:'Corpus Hermeticum',     canon:'Hermetic',            sort:50 },
    'corpus-hermeticum-13':{ religion:'Hermeticism',  group:'Corpus Hermeticum',     canon:'Hermetic',            sort:60 },
    // ── Greek Philosophy / Neoplatonism ─────────────────────────────
    'plato-timaeus':      { religion:'Greek Philosophy', group:'Plato',              canon:'Platonic',            sort:10 },
    'plato-cave':         { religion:'Greek Philosophy', group:'Plato',              canon:'Platonic',            sort:20 },
    'plotinus-enneads':   { religion:'Greek Philosophy', group:'Neoplatonism',       canon:'Neoplatonic',         sort:10 },
    'orphic-theogony':    { religion:'Greek Philosophy', group:'Mystery Traditions', canon:'Orphic',              sort:10 },
    // ── Ancient Egyptian ────────────────────────────────────────────
    'memphite-theology':  { religion:'Ancient Egyptian', group:'Temple Texts',       canon:'Old Kingdom',         sort:10 },
    'hymn-to-aten':       { religion:'Ancient Egyptian', group:'Temple Texts',       canon:'Amarna Period',       sort:20 },
    'pyramid-texts':      { religion:'Ancient Egyptian', group:'Funerary Texts',     canon:'Old Kingdom',         sort:10 },
    'coffin-text-1130':   { religion:'Ancient Egyptian', group:'Funerary Texts',     canon:'Middle Kingdom',      sort:20 },
    'book-of-dead-125':   { religion:'Ancient Egyptian', group:'Funerary Texts',     canon:'New Kingdom',         sort:30 },
    // ── Ancient Mesopotamian ────────────────────────────────────────
    'enuma-elish-1':      { religion:'Mesopotamian',  group:'Babylonian',            canon:'Babylonian',          sort:10 },
    'descent-inanna':     { religion:'Mesopotamian',  group:'Sumerian',              canon:'Sumerian',            sort:10 },
    'atrahasis-epic':     { religion:'Mesopotamian',  group:'Babylonian',            canon:'Babylonian',          sort:20 },
    'gilgamesh':          { religion:'Mesopotamian',  group:'Babylonian',            canon:'Babylonian',          sort:30 },
    // ── Other traditions ────────────────────────────────────────────
    'yasna-30':           { religion:'Zoroastrianism',group:'Gathas',                canon:'Avesta',              sort:10 },
    'popol-vuh':          { religion:'Mesoamerican',  group:"K'iche' Maya",          canon:"K'iche' Maya Canon",  sort:10 },
    'voluspa':            { religion:'Norse',         group:'Poetic Edda',           canon:'Eddic Poetry',        sort:10 },
  };

  const RELIGION_ORDER = [
    'Christianity', 'Judaism', 'Islam', 'Hinduism', 'Buddhism', 'Taoism',
    'Hermeticism', 'Greek Philosophy', 'Ancient Egyptian', 'Mesopotamian',
    'Zoroastrianism', 'Mesoamerican', 'Norse',
  ];

  const GROUP_ORDER = {
    'Christianity':    ['Old Testament', 'Deuterocanon', 'New Testament', 'Ethiopian Canon', 'Christian Mysticism', 'Medieval Mysticism', 'Gnostic / Nag Hammadi'],
    'Hinduism':        ['Vedic Hymns', 'Upanishads', 'Epics'],
    'Buddhism':        ['Pali Canon', 'Mahayana', 'Vajrayana'],
    'Taoism':          ['Classical Taoism', 'Chinese Classics'],
    'Ancient Egyptian':['Temple Texts', 'Funerary Texts'],
    'Mesopotamian':    ['Sumerian', 'Babylonian'],
    'Judaism':         ['Nevi\'im (Prophets)', 'Kabbalah'],
    'Islam':           ['Quran', 'Sufism'],
    'Hermeticism':     ['Corpus Hermeticum'],
    'Greek Philosophy':['Plato', 'Neoplatonism', 'Mystery Traditions'],
  };

  // ── helpers ───────────────────────────────────────────────────
  function _availableReligions(texts) {
    const seen = new Set();
    Object.keys(texts).forEach(k => { const c = CATALOG[k]; if (c) seen.add(c.religion); });
    const found = RELIGION_ORDER.filter(r => seen.has(r));
    // uncataloged texts get a catch-all
    const uncataloged = Object.keys(texts).filter(k => !CATALOG[k]);
    if (uncataloged.length) found.push('Other');
    return found;
  }

  function _textsForReligion(texts, religion) {
    const groups = {};
    Object.keys(texts).forEach(k => {
      const c = CATALOG[k];
      const rel = c ? c.religion : 'Other';
      if (rel !== religion) return;
      const grp = c ? c.group : 'Uncategorized';
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push({ key: k, text: texts[k], catalog: c || { canon: '', sort: 99 } });
    });
    Object.values(groups).forEach(arr => arr.sort((a, b) => a.catalog.sort - b.catalog.sort));
    return groups;
  }

  function _orderedGroups(groups, religion) {
    const order = GROUP_ORDER[religion] || [];
    const all   = [...new Set([...order, ...Object.keys(groups)])];
    return all.filter(g => groups[g] && groups[g].length);
  }

  function _firstKeyInReligion(texts, religion) {
    const groups = _textsForReligion(texts, religion);
    const grps   = _orderedGroups(groups, religion);
    return grps.length ? (groups[grps[0]][0] || {}).key : null;
  }

  // ── public render ─────────────────────────────────────────────
  function render(pane, textKey, religionOverride) {
    _pane    = pane;
    _ctxOpen = false;

    if (_kdHandler)        { document.removeEventListener('keydown', _kdHandler); _kdHandler = null; }
    if (_paneClickHandler) { pane.removeEventListener('click', _paneClickHandler); _paneClickHandler = null; }

    const texts = window.SCRIPTURE_TEXTS || {};
    const keys  = Object.keys(texts);
    if (!keys.length) { pane.innerHTML = '<div class="sr-empty-state">No texts loaded.</div>'; return; }

    // Resolve active religion
    if (religionOverride) _religion = religionOverride;
    else if (window.STATE && STATE.scriptureReligion) _religion = STATE.scriptureReligion;
    if (!_religion) _religion = 'Christianity';
    if (window.STATE) STATE.scriptureReligion = _religion;

    const groups      = _textsForReligion(texts, _religion);
    const relKeys     = _orderedGroups(groups, _religion).flatMap(g => groups[g].map(x => x.key));

    // Resolve active text key
    if (!textKey || !texts[textKey]) textKey = _firstKeyInReligion(texts, _religion) || keys[0];
    // If textKey belongs to a different religion, switch religion automatically
    const textCatalog = CATALOG[textKey];
    if (textCatalog && textCatalog.religion !== _religion) {
      _religion = textCatalog.religion;
      if (window.STATE) STATE.scriptureReligion = _religion;
    }
    // Recompute after possible religion switch
    const groups2  = _textsForReligion(texts, _religion);
    const relKeys2 = _orderedGroups(groups2, _religion).flatMap(g => groups2[g].map(x => x.key));
    if (!relKeys2.includes(textKey)) textKey = relKeys2[0] || keys[0];

    _textKey = textKey;
    const t  = texts[textKey];
    if (!t) { pane.innerHTML = '<div class="sr-empty-state">Text not found.</div>'; return; }

    const trList   = t.translations || [{ id: 'default', label: 'Translation' }];
    if (!window.STATE) window.STATE = {};
    if (!STATE.scriptureTranslation || !trList.find(x => x.id === STATE.scriptureTranslation))
      STATE.scriptureTranslation = trList[0].id;
    const activeTr = STATE.scriptureTranslation;

    document.body.classList.add('view-scripture-reader');
    document.querySelectorAll('.zoom-meter').forEach(zm => { zm.style.display = 'none'; });
    const vc = document.getElementById('view-controls');
    if (vc) vc.innerHTML = '';

    const religions    = _availableReligions(texts);
    const hasParallels = !!(t.crossTradition && t.crossTradition.length) || !!t.intro;
    const catalogEntry = CATALOG[textKey];
    const canonLabel   = catalogEntry ? catalogEntry.canon : '';

    const religionRows = religions.map(r =>
      `<div class="sr-pop-row${r === _religion ? ' active' : ''}" data-action="religion" data-rel="${esc(r)}">${esc(r)}</div>`
    ).join('');

    const textMenuHtml = _buildTextMenu(groups2, textKey, _religion);

    const langRows = trList.map(tr =>
      `<div class="sr-pop-row${tr.id === activeTr ? ' active' : ''}" data-action="lang" data-tr="${tr.id}">${esc(tr.label)}</div>`
    ).join('');

    const sectionsHtml = _buildSections(t, activeTr, trList);

    pane.innerHTML = `
      <div class="sr-layout" id="sr-layout">
        <div class="sr-topbar" id="sr-topbar">
          <div class="sr-topbar-left">
            <button class="btn btn-mini sr-vc-back" id="sr-vc-back">← Ring</button>
            <span class="sr-topbar-title">${esc(t.title)}</span>
            ${canonLabel ? `<span class="sr-canon-badge">${esc(canonLabel)}</span>` : ''}
          </div>
          <div class="sr-topbar-right">
            <div class="sr-pop-wrap" id="sr-rel-wrap">
              <button class="btn btn-mini sr-pop-btn" id="sr-rel-btn">${esc(_religion)}<span class="sr-pop-caret">▾</span></button>
              <div class="sr-pop-menu" id="sr-rel-menu">${religionRows}</div>
            </div>
            <div class="sr-pop-wrap" id="sr-text-wrap">
              <button class="btn btn-mini sr-pop-btn" id="sr-text-btn">${esc(t.shortTitle)}<span class="sr-pop-caret">▾</span></button>
              <div class="sr-pop-menu sr-text-menu-grouped" id="sr-text-menu">${textMenuHtml}</div>
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

    // back button
    document.getElementById('sr-vc-back').onclick = () => {
      _cleanup();
      if (window.STATE) { STATE.scriptureReaderMode = null; }
      if (window.setView) setView('scripture');
    };

    // wire dropdowns
    _wirePopup('sr-rel-btn',  'sr-rel-menu');
    _wirePopup('sr-text-btn', 'sr-text-menu');
    _wirePopup('sr-lang-btn', 'sr-lang-menu');

    // row clicks
    pane.querySelectorAll('.sr-pop-row').forEach(row => {
      row.onclick = ev => {
        ev.stopPropagation();
        _closeAllPopups();
        if (row.dataset.action === 'religion') {
          const newRel = row.dataset.rel;
          _religion = newRel;
          if (window.STATE) STATE.scriptureReligion = newRel;
          _cleanup();
          render(pane, null, newRel);
        } else if (row.dataset.action === 'text') {
          _cleanup();
          if (window.STATE) STATE.scriptureReaderMode = row.dataset.key;
          render(pane, row.dataset.key);
        } else if (row.dataset.action === 'lang') {
          if (window.STATE) STATE.scriptureTranslation = row.dataset.tr;
          render(pane, textKey);
        }
      };
    });

    // context toggle
    const ctxBtn = document.getElementById('sr-ctx-btn');
    if (ctxBtn) ctxBtn.onclick = () => _toggleCtx(t);

    // entity clicks on body
    const body = document.getElementById('sr-body');
    body.addEventListener('click', _onClick);

    // click outside → close
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

  // ── text dropdown builder ─────────────────────────────────────
  function _buildTextMenu(groups, activeKey, religion) {
    const orderedGrps = _orderedGroups(groups, religion);
    let html = '';
    orderedGrps.forEach(grp => {
      const items = groups[grp];
      if (!items || !items.length) return;
      html += `<div class="sr-pop-group-header">${esc(grp)}</div>`;
      items.forEach(item => {
        const isActive = item.key === activeKey;
        html += `<div class="sr-pop-row sr-pop-text-row${isActive ? ' active' : ''}" data-action="text" data-key="${esc(item.key)}">
          <span class="sr-pop-text-title">${esc(item.text.shortTitle)}</span>
          <span class="sr-pop-canon-tag">${esc(item.catalog.canon)}</span>
        </div>`;
      });
    });
    return html;
  }

  // ── context drawer ────────────────────────────────────────────
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
            if (window.STATE) STATE.scriptureReaderMode = key;
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
          const vtext      = _verseText(v, activeTr);
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

  function _showCard(ent, markEl) {
    document.querySelectorAll('.sr-ent.active, .sr-ent.pinned').forEach(e => e.classList.remove('active', 'pinned'));
    markEl.classList.add('active', 'pinned');

    if (ent.node && window.NODES_BY_ID && NODES_BY_ID[ent.node]) {
      if (window.STATE) STATE.selected = ent.node;
      document.body.classList.remove('detail-collapsed');
      const dt = document.getElementById('detail-toggle');
      if (dt) dt.textContent = '›';
      if (window.renderDetail) renderDetail();
      return;
    }

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

  // ── text helpers ──────────────────────────────────────────────
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
