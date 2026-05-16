// CODEX ATLAS — Alphabet Glyph Viewer
// Mode: glyphs — 22 Proto-Sinaitic letters, viewable as any script in the chain
// Registers as window._alphaGlyphs = { render(pane) }
// Depends on: glyph-data.js (window.ALPHA_GLYPH_DATA)
// Font: Noto Sans Egyptian Hieroglyphs (loaded in index.html via Google Fonts)

(function () {
  'use strict';

  const SCRIPTS = [
    { id: 'hieroglyph', label: 'hieroglyph', font: "'Noto Sans Egyptian Hieroglyphs', serif", dir: 'ltr' },
    { id: 'phoenician', label: 'Phoenician', font: "'Segoe UI', sans-serif", dir: 'rtl' },
    { id: 'hebrew',     label: 'Hebrew',     font: "'Segoe UI', sans-serif", dir: 'rtl' },
    { id: 'arabic',     label: 'Arabic',     font: "'Segoe UI', sans-serif", dir: 'rtl' },
    { id: 'greek',      label: 'Greek',      font: "serif", dir: 'ltr' },
    { id: 'latin',      label: 'Latin',      font: "serif", dir: 'ltr' },
    { id: 'ogham',      label: 'Ogham',      font: "'Segoe UI', sans-serif", dir: 'ltr' },
    { id: 'futhark',    label: 'Futhark',    font: "'Segoe UI', sans-serif", dir: 'ltr' },
  ];

  let _expandedIdx = null;
  let _script = 'hieroglyph';
  let _docCloseHandler = null;

  function getMainChar(g, scriptId) {
    switch (scriptId) {
      case 'hieroglyph': return String.fromCodePoint(g.unicode);
      case 'phoenician': return g.phoenician || '';
      case 'hebrew':     return g.hebrew || '';
      case 'arabic':     return g.arabic || '';
      case 'greek':      return (g.greek || '').split(' ')[0];
      case 'latin':      return g.letter || '';
      default:           return String.fromCodePoint(g.unicode);
    }
  }

  function getSecondaryChars(g, scriptId) {
    // Show the scripts NOT currently leading, condensed
    // Only show hieroglyph secondary if unicode is actually in the Egyptian Hieroglyphs block
    const hierChar = (g.unicode >= 0x13000 && g.unicode <= 0x1342F) ? String.fromCodePoint(g.unicode) : '';
    const parts = [];
    if (scriptId !== 'hieroglyph') parts.push({ ch: hierChar,                      label: 'hier',   font: "'Noto Sans Egyptian Hieroglyphs', serif" });
    if (scriptId !== 'hebrew')     parts.push({ ch: g.hebrew || '',                label: 'heb',    font: "'Segoe UI', sans-serif" });
    if (scriptId !== 'arabic')     parts.push({ ch: g.arabic || '',                label: 'ar',     font: "'Segoe UI', sans-serif" });
    if (scriptId !== 'greek')      parts.push({ ch: (g.greek || '').split(' ')[0], label: 'gk',     font: 'serif' });
    if (scriptId !== 'latin')      parts.push({ ch: g.letter || '',                label: 'lat',    font: 'serif' });
    return parts.filter(p => p.ch && p.ch !== '(none)' && p.ch.trim() !== '');
  }

  function render(pane) {
    const data = window.ALPHA_GLYPH_DATA || [];

    pane.innerHTML = '';

    // Header banner
    const header = document.createElement('div');
    header.className = 'alpha-glyph-header';
    header.innerHTML = `
      <h2>Every letter you read is a 3,900-year-old picture of a thing</h2>
      <p>The 22 letters of the Phoenician alphabet descend from Egyptian hieroglyphs via Proto-Sinaitic script (c. 1850 BCE). Choose a writing system to view. Click any letter to see its full transmission chain.</p>
    `;
    pane.appendChild(header);

    // Script selector
    const selector = document.createElement('div');
    selector.className = 'agv-script-selector';
    SCRIPTS.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'agv-script-btn' + (s.id === _script ? ' active' : '');
      btn.textContent = s.label;
      btn.dataset.script = s.id;
      btn.addEventListener('click', () => {
        _script = s.id;
        selector.querySelectorAll('.agv-script-btn').forEach(b => b.classList.toggle('active', b.dataset.script === _script));
        buildGrid(gridWrap, data);
      });
      selector.appendChild(btn);
    });
    pane.appendChild(selector);

    // Grid wrapper
    const gridWrap = document.createElement('div');
    gridWrap.className = 'alpha-glyph-grid-wrap';
    pane.appendChild(gridWrap);

    buildGrid(gridWrap, data);

    // Wait for fonts and re-render glyphs if needed
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        pane.querySelectorAll('.agc-hieroglyph').forEach(el => {
          el.style.fontFamily = "'Noto Sans Egyptian Hieroglyphs', serif";
        });
      });
    }
  }

  function buildGrid(wrap, data) {
    wrap.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'alpha-glyph-grid';
    const detail = document.createElement('div');
    detail.className = 'alpha-glyph-detail';
    wrap.appendChild(grid);
    wrap.appendChild(detail);


    const scriptMeta = SCRIPTS.find(s => s.id === _script) || SCRIPTS[0];

    // Filter by scriptOnly: include if no restriction, or if restriction includes current script
    // Exclude entries whose scriptOnly list exists but does NOT include the current script
    let displayData = data.map((g, idx) => ({ ...g, _origIdx: idx })).filter(g => {
      if (!g.scriptOnly) return true;           // no restriction — show in all scripts
      return g.scriptOnly.includes(_script);    // only show in listed scripts
    });

    if (_script === 'latin') {
      displayData = displayData
        .filter(g => g.letter && g.letter.trim() !== '')
        .sort((a, b) => a.letter.localeCompare(b.letter));

      // Dropped-letters notice
      const dropped = document.createElement('div');
      dropped.className = 'agv-latin-notice';
      dropped.innerHTML = `
        <span class="agv-ln-label">Latin kept 19 of 22 Phoenician letters.</span>
        <span class="agv-ln-dropped">Dropped: Teth (no emphatic T), Tsade (no emphatic S) — shown in other script views.</span>
        <span class="agv-ln-added">Added later: C · J · U · V · W · X · Y (derived from existing letters, not new Phoenician imports).</span>
      `;
      wrap.insertBefore(dropped, grid);
    }

    // Hieroglyph mode: group by section, insert dividers
    let _lastSection = null;
    if (_script === 'hieroglyph') {
      const lead = document.createElement('div');
      lead.className = 'agv-section-divider';
      lead.textContent = 'The Alphabetic Chain — 22 Proto-Sinaitic Letters';
      lead.style.paddingTop = '0.25rem';
      grid.appendChild(lead);
    }

    displayData.forEach((g) => {
      // Section divider (hieroglyph mode only)
      if (_script === 'hieroglyph' && g.section && g.section !== _lastSection) {
        _lastSection = g.section;
        // Close any open grid row visually with a full-width label
        const divider = document.createElement('div');
        divider.className = 'agv-section-divider';
        divider.textContent = g.section;
        grid.appendChild(divider);
      }

      const idx = g._origIdx;
      const cell = document.createElement('div');
      cell.className = 'alpha-glyph-cell';
      cell.dataset.idx = idx;
      if (_expandedIdx === idx) cell.classList.add('expanded');

      const mainChar = getMainChar(g, _script);
      const secondaries = getSecondaryChars(g, _script);

      const secHtml = secondaries.slice(0, 3).map(s =>
        `<span class="agc-sec-char" style="font-family:${s.font}" title="${s.label}">${s.ch}</span>`
      ).join('');

      // Pull first sentence of investigation highlight as card preview
      const previewText = g.investigationHighlight
        ? g.investigationHighlight.split('.')[0] + '.'
        : '';

      cell.innerHTML = `
        <span class="agc-main-char" style="font-family:${scriptMeta.font};direction:${scriptMeta.dir}">${mainChar}</span>
        <span class="agc-name">${g.name}</span>
        <span class="agc-meaning">${g.meaning}</span>
        <div class="agc-secondary">${secHtml}</div>
        ${previewText ? `<div class="agc-preview">${previewText}</div>` : ''}
      `;

      cell.addEventListener('click', () => {
        if (_expandedIdx === idx) {
          _expandedIdx = null;
          detail.innerHTML = '';
          detail.classList.remove('active');
          cell.classList.remove('expanded');
        } else {
          _expandedIdx = idx;
          grid.querySelectorAll('.alpha-glyph-cell').forEach(c => c.classList.remove('expanded'));
          const existing = detail.querySelector('.alpha-glyph-expanded');
          if (existing) existing.remove();
          cell.classList.add('expanded');
          insertExpanded(detail, g);
        }
      });

      grid.appendChild(cell);
    });

    // Restore expanded state if already set
    if (_expandedIdx !== null && data[_expandedIdx]) {
      insertExpanded(detail, data[_expandedIdx]);
    }

  }

  function insertExpanded(detailEl, g) {
    const expanded = document.createElement('div');
    expanded.className = 'alpha-glyph-expanded';

    const isHier = g.unicode >= 0x13000 && g.unicode <= 0x1342F;
    const bigChar   = isHier ? String.fromCodePoint(g.unicode) : (g.arabic || g.hebrew || g.phoenician || g.letter || (g.unicode ? String.fromCodePoint(g.unicode) : ''));
    const bigFont   = isHier ? "'Noto Sans Egyptian Hieroglyphs', serif" : "'Segoe UI', sans-serif";
    const hierChar  = isHier ? String.fromCodePoint(g.unicode) : '';
    const phoenicianChar = g.phoenician || '';
    const greekChar = g.greek ? g.greek.split(' ')[0] : '';
    const latinChar = g.latin ? g.latin.split(' ')[0] : '';
    const safe = v => (!v || v === '(none)') ? '' : v;
    const gardinerLine = g.gardiner
      ? `Gardiner ${g.gardiner} · U+${g.unicode.toString(16).toUpperCase()}`
      : `U+${g.unicode.toString(16).toUpperCase()}`;

    const descItems = [
      g.hebrew, g.arabic, g.greek, g.latin, g.phoneme
    ].map((v, i) => {
      const label = ['Hebrew','Arabic','Greek','Latin','Sound'][i];
      return safe(v) ? `<span class="age-desc-item"><span class="age-desc-script">${label}</span> ${safe(v)}</span>` : '';
    }).filter(Boolean).join('');

    expanded.innerHTML = `
      <div class="age-col-letter">
        <span class="age-hieroglyph-big" style="font-family:${bigFont}">${bigChar}</span>
        <span class="age-letter-name">${g.name} — "${g.meaning}"</span>
        <span class="age-gardiner">${gardinerLine}</span>
        ${descItems ? `<div class="age-descendants">${descItems}</div>` : ''}
      </div>
      <div class="age-col-chain">
        <div class="age-chain-label-row">Transmission chain</div>
        <div class="age-chain">
          <div class="age-chain-step">
            <span class="age-chain-glyph age-chain-hier">${hierChar}</span>
            <span class="age-chain-step-label">Egyptian</span>
            <span class="age-chain-step-sub">c. 2000 BCE</span>
          </div>
          <span class="age-arrow">→</span>
          <div class="age-chain-step">
            <span class="age-chain-glyph age-chain-proto">${hierChar}</span>
            <span class="age-chain-step-label">Proto-Sinaitic</span>
            <span class="age-chain-step-sub">c. 1850 BCE</span>
          </div>
          <span class="age-arrow">→</span>
          <div class="age-chain-step">
            <span class="age-chain-glyph age-chain-phoen">${phoenicianChar}</span>
            <span class="age-chain-step-label">Phoenician</span>
            <span class="age-chain-step-sub">c. 1050 BCE</span>
          </div>
          <span class="age-arrow">→</span>
          <div class="age-chain-step">
            <span class="age-chain-glyph age-chain-greek">${greekChar}</span>
            <span class="age-chain-step-label">Greek</span>
            <span class="age-chain-step-sub">c. 800 BCE</span>
          </div>
          <span class="age-arrow">→</span>
          <div class="age-chain-step">
            <span class="age-chain-glyph age-chain-latin">${latinChar}</span>
            <span class="age-chain-step-label">Latin</span>
            <span class="age-chain-step-sub">c. 600 BCE+</span>
          </div>
        </div>
        <div class="age-note">${g.note || ''}</div>
      </div>
      <div class="age-col-inv">
        ${g.investigationHighlight ? `
        <div class="age-investigation">
          <div class="age-inv-label">what the investigation found</div>
          <div class="age-inv-text">${g.investigationHighlight}</div>
          ${(g.relatedNodes || []).length ? `
          <div class="age-inv-nodes">
            ${(g.relatedNodes || []).map(id => `<span class="age-inv-node" data-id="${id}">${id.replace(/^alphabet-/,'').replace(/-/g,' ')}</span>`).join('')}
          </div>` : ''}
        </div>` : '<div class="age-no-inv"></div>'}
      </div>
      <button class="age-close-btn" title="Close">✕</button>
    `;

    expanded.querySelectorAll('.age-inv-node[data-id]').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.selectNode) window.selectNode(chip.dataset.id, true);
      });
    });

    function closePanel() {
      _expandedIdx = null;
      detailEl.innerHTML = '';
      detailEl.classList.remove('active');
      const g = detailEl.previousElementSibling;
      if (g) g.querySelectorAll('.alpha-glyph-cell').forEach(c => c.classList.remove('expanded'));
      if (_docCloseHandler) {
        document.removeEventListener('click', _docCloseHandler);
        _docCloseHandler = null;
      }
    }

    expanded.querySelector('.age-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      closePanel();
    });

    detailEl.innerHTML = '';
    detailEl.classList.add('active');
    detailEl.appendChild(expanded);

    // Click outside the panel (not on a card) dismisses it
    if (_docCloseHandler) document.removeEventListener('click', _docCloseHandler);
    _docCloseHandler = (e) => {
      if (!detailEl.contains(e.target) && !e.target.closest('.alpha-glyph-cell')) {
        closePanel();
      }
    };
    setTimeout(() => document.addEventListener('click', _docCloseHandler), 0);
  }

  window._alphaGlyphs = { render };

})();
