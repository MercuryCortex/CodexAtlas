// CODEX ATLAS — Alphabet Glyph Viewer
// Mode: glyphs — 22 Proto-Sinaitic letters as Egyptian hieroglyphs → modern descendants
// Registers as window._alphaGlyphs = { render(pane) }
// Depends on: glyph-data.js (window.ALPHA_GLYPH_DATA)
// Font: Noto Sans Egyptian Hieroglyphs (loaded in index.html via Google Fonts)

(function () {
  'use strict';

  // Cuneiform comparison block — independent writing system (U+12000 block)
  // These are Sumerian cuneiform signs with known meanings
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

  let _expandedIdx = null;

  function render(pane) {
    const data = window.ALPHA_GLYPH_DATA || [];

    pane.innerHTML = '';

    // Header banner
    const header = document.createElement('div');
    header.className = 'alpha-glyph-header';
    header.innerHTML = `
      <h2>Every letter you read is a 3,900-year-old picture of a thing</h2>
      <p>The 22 letters of the Phoenician alphabet descend from Egyptian hieroglyphs via Proto-Sinaitic script (c. 1850 BCE). Click any letter to see its full transmission chain and the story hidden in its shape.</p>
    `;
    pane.appendChild(header);

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
        // Re-trigger paint by forcing a tiny DOM update
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
    // Detail panel lives BELOW the grid, not inside it — avoids mid-row grid disruption
    const detail = document.createElement('div');
    detail.className = 'alpha-glyph-detail';
    wrap.appendChild(grid);
    wrap.appendChild(detail);

    data.forEach((g, idx) => {
      const cell = document.createElement('div');
      cell.className = 'alpha-glyph-cell';
      cell.dataset.idx = idx;
      if (_expandedIdx === idx) cell.classList.add('expanded');

      const hieroglyphChar = String.fromCodePoint(g.unicode);
      cell.innerHTML = `
        <span class="agc-hieroglyph" title="Egyptian hieroglyph: ${g.gardiner}">${hieroglyphChar}</span>
        <span class="agc-letter">${g.letter}</span>
        <span class="agc-name">${g.name}</span>
        <span class="agc-meaning">${g.meaning}</span>
        <span class="agc-modern">${g.hebrew} ${g.arabic}</span>
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
          // Insert expanded card after this cell's row
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

    // Phoenician character for the chain
    const phoenicianChar = g.phoenician || '';

    // Determine Greek display: pull just the first letter character
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
      <button class="age-close-btn">close ✕</button>
    `;

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
    // Scroll into view
    setTimeout(() => expanded.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  window._alphaGlyphs = { render };

})();
