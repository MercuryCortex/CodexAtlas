// CODEX ATLAS — Alphabet Glyph Viewer
// Mode: glyphs — 22 Proto-Sinaitic letters, viewable as any script in the chain
// Registers as window._alphaGlyphs = { render(pane) }
// Depends on: glyph-data.js (window.ALPHA_GLYPH_DATA)
// Font: Noto Sans Egyptian Hieroglyphs (loaded in index.html via Google Fonts)

(function () {
  'use strict';

  // Cuneiform comparison block — independent writing system (U+12000 block)
  const CUNEIFORM_SAMPLES = [
    { sign: '\u{12000}', name: 'A', meaning: 'water / canal' },
    { sign: '\u{12019}', name: 'AN', meaning: 'sky / heaven / deity' },
    { sign: '\u{1202D}', name: 'DINGIR', meaning: 'god / star' },
    { sign: '\u{12038}', name: 'EN', meaning: 'lord / master' },
    { sign: '\u{1207F}', name: 'KI', meaning: 'earth / place' },
    { sign: '\u{12115}', name: 'LU', meaning: 'person / man' },
    { sign: '\u{1212D}', name: 'ME', meaning: 'divine powers / being' },
    { sign: '\u{12163}', name: 'NINDA', meaning: 'bread / food' },
    { sign: '\u{121B8}', name: 'UD', meaning: 'sun / day / white' },
    { sign: '\u{1222C}', name: 'ZI', meaning: 'life / breath / soul' },
  ];

  const SCRIPTS = [
    { id: 'hieroglyph', label: 'hieroglyph', font: "'Noto Sans Egyptian Hieroglyphs', serif", dir: 'ltr' },
    { id: 'phoenician', label: 'Phoenician', font: "'Segoe UI', sans-serif", dir: 'rtl' },
    { id: 'hebrew',     label: 'Hebrew',     font: "'Segoe UI', sans-serif", dir: 'rtl' },
    { id: 'arabic',     label: 'Arabic',     font: "'Segoe UI', sans-serif", dir: 'rtl' },
    { id: 'greek',      label: 'Greek',      font: "serif", dir: 'ltr' },
    { id: 'latin',      label: 'Latin',      font: "serif", dir: 'ltr' },
  ];

  let _expandedIdx = null;
  let _script = 'hieroglyph';

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
    const hier  = String.fromCodePoint(g.unicode);
    const parts = [];
    if (scriptId !== 'hieroglyph') parts.push({ ch: hier,                         label: 'hier',   font: "'Noto Sans Egyptian Hieroglyphs', serif" });
    if (scriptId !== 'hebrew')     parts.push({ ch: g.hebrew || '',                label: 'heb',    font: "'Segoe UI', sans-serif" });
    if (scriptId !== 'arabic')     parts.push({ ch: g.arabic || '',                label: 'ar',     font: "'Segoe UI', sans-serif" });
    if (scriptId !== 'greek')      parts.push({ ch: (g.greek || '').split(' ')[0], label: 'gk',     font: 'serif' });
    if (scriptId !== 'latin')      parts.push({ ch: g.letter || '',                label: 'lat',    font: 'serif' });
    return parts;
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

    // Cuneiform comparison strip
    const cuneiStrip = document.createElement('div');
    cuneiStrip.className = 'alpha-cuneiform-strip';
    cuneiStrip.innerHTML = `
      <h3>For comparison: Cuneiform (Sumer, c. 3200 BCE) — an independent writing system</h3>
      <p class="alpha-cunei-intro">Cuneiform and the Egyptian-Phoenician-Latin chain developed independently. Both started as pictograms, both became abstract over time — but they share no common ancestor. The convergence of pictographic writing across unconnected civilizations is one of the most remarkable parallels in human history.</p>
      <div class="alpha-cunei-cells">
        ${CUNEIFORM_SAMPLES.map(c => `
          <div class="alpha-cunei-cell">
            <span class="acc-sign">${c.sign}</span>
            <span class="acc-name">${c.name}</span>
            <span class="acc-meaning">${c.meaning}</span>
          </div>
        `).join('')}
      </div>
    `;
    pane.appendChild(cuneiStrip);

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

    data.forEach((g, idx) => {
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

    const hieroglyphChar = String.fromCodePoint(g.unicode);
    const phoenicianChar = g.phoenician || '';
    const greekChar = g.greek ? g.greek.split(' ')[0] : '';
    const latinChar = g.latin ? g.latin.split(' ')[0] : '';

    expanded.innerHTML = `
      <div class="age-top">
        <div class="age-letter-big">
          <span class="age-hieroglyph-big">${hieroglyphChar}</span>
          <span class="age-letter-name">${g.name} — "${g.meaning}"</span>
          <span class="age-gardiner">Gardiner ${g.gardiner} · U+${g.unicode.toString(16).toUpperCase()}</span>
        </div>
        <div class="age-chain-wrap">
          <div class="age-chain-label-row">Transmission chain:</div>
          <div class="age-chain">
            <div class="age-chain-step">
              <span class="age-chain-glyph age-chain-hier">${hieroglyphChar}</span>
              <span class="age-chain-step-label">Egyptian hieroglyph</span>
              <span class="age-chain-step-sub">c. 2000 BCE</span>
            </div>
            <span class="age-arrow">→</span>
            <div class="age-chain-step">
              <span class="age-chain-glyph age-chain-proto">${hieroglyphChar}</span>
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
              <span class="age-chain-step-label">Latin / Modern</span>
              <span class="age-chain-step-sub">c. 600 BCE → now</span>
            </div>
          </div>
        </div>
      </div>
      <div class="age-descendants">
        <span class="age-desc-item"><span class="age-desc-script">Hebrew</span> ${g.hebrew}</span>
        <span class="age-desc-item"><span class="age-desc-script">Arabic</span> ${g.arabic}</span>
        <span class="age-desc-item"><span class="age-desc-script">Greek</span> ${g.greek}</span>
        <span class="age-desc-item"><span class="age-desc-script">Latin</span> ${g.latin}</span>
        <span class="age-desc-item"><span class="age-desc-script">Sound</span> ${g.phoneme}</span>
      </div>
      <div class="age-note">${g.note}</div>
      ${g.investigationHighlight ? `
      <div class="age-investigation">
        <div class="age-inv-label">what the investigation found</div>
        <div class="age-inv-text">${g.investigationHighlight}</div>
        ${(g.relatedNodes || []).length ? `
        <div class="age-inv-nodes">
          ${(g.relatedNodes || []).map(id => `<span class="age-inv-node" data-id="${id}">${id.replace(/^alphabet-/,'').replace(/-/g,' ')}</span>`).join('')}
        </div>` : ''}
      </div>` : ''}
      <button class="age-close-btn">close ✕</button>
    `;

    expanded.querySelectorAll('.age-inv-node[data-id]').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.selectNode) window.selectNode(chip.dataset.id, true);
      });
    });

    expanded.querySelector('.age-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      _expandedIdx = null;
      detailEl.innerHTML = '';
      detailEl.classList.remove('active');
      const grid = detailEl.previousElementSibling;
      if (grid) grid.querySelectorAll('.alpha-glyph-cell').forEach(c => c.classList.remove('expanded'));
    });

    detailEl.innerHTML = '';
    detailEl.classList.add('active');
    detailEl.appendChild(expanded);
    setTimeout(() => expanded.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  window._alphaGlyphs = { render };

})();
