// CODEX ATLAS — Alphabet Origin Chain
// Mode: origin — Transmission tree from Proto-Sinaitic to all modern descendants
// Registers as window._alphaOrigin = { render(pane) }
// SVG/HTML horizontal timeline tree, left = older, right = modern

(function () {
  'use strict';

  // Tree data: nodes and edges
  // x = approximate BCE/CE date (negative = BCE), y = layout row
  // family: 'root' | 'semitic' | 'greek-latin' | 'brahmic' | 'other'
  const NODES = [
    // Pre-alphabetic roots (shown as source blocks on left)
    { id: 'egyptian',      label: 'Egyptian\nHieroglyphs', date: -3200, y: 2,   family: 'root',       sample: '𓀀', note: 'Pictographic writing; source pictures for Proto-Sinaitic letters' },
    { id: 'cuneiform',     label: 'Cuneiform\n(Sumer)',    date: -3200, y: 5,   family: 'root',       sample: '𒀭', note: 'Independent writing system; no direct ancestor of alphabets' },
    // Proto-alphabetic
    { id: 'proto-sinaitic',label: 'Proto-Sinaitic',       date: -1850, y: 2,   family: 'semitic',    sample: '𐤀', note: 'c. 1850 BCE, Sinai Peninsula. First true alphabet — 22 consonants, all acrophonic pictures' },
    { id: 'ugaritic',      label: 'Ugaritic\nCuneiform',  date: -1400, y: 5,   family: 'semitic',    sample: '𐎀', note: 'c. 1400 BCE, northern Syria. Alphabetic cuneiform — same 22+ consonants, different medium' },
    { id: 'phoenician',    label: 'Phoenician',           date: -1050, y: 2,   family: 'semitic',    sample: '𐤁', note: 'c. 1050 BCE. The great disseminator — Phoenician sailors carried the alphabet across the Mediterranean' },
    // Semitic branch
    { id: 'aramaic',       label: 'Aramaic',              date: -850,  y: 1,   family: 'semitic',    sample: 'ܐ', note: 'c. 850 BCE. Lingua franca of the Near East; ancestor of Hebrew square script, Arabic, and all Brahmic scripts' },
    { id: 'hebrew',        label: 'Hebrew\nScript',       date: -800,  y: 0,   family: 'semitic',    sample: 'א', note: 'c. 800 BCE (paleo-Hebrew); square script from Aramaic c. 500 BCE' },
    { id: 'arabic',        label: 'Arabic\nScript',       date: 400,   y: 1,   family: 'semitic',    sample: 'ا', note: 'c. 400 CE, from Nabataean Aramaic. Now the 2nd most-used script in the world' },
    { id: 'syriac',        label: 'Syriac',               date: 100,   y: 0,   family: 'semitic',    sample: 'ܒ', note: 'c. 1st–2nd century CE. Liturgical script of Eastern Christianity' },
    // Greek-Latin branch
    { id: 'greek',         label: 'Greek',                date: -800,  y: 3,   family: 'greek-latin',sample: 'Α', note: 'c. 800 BCE. First alphabet with vowels — Greeks repurposed unused Semitic consonants for vowel letters' },
    { id: 'latin',         label: 'Latin',                date: -600,  y: 3.5, family: 'greek-latin',sample: 'A', note: 'c. 600 BCE, via Etruscan. Became the most widely used script in history' },
    { id: 'runic',         label: 'Runic\n(Elder Futhark)',date: 150,  y: 4.5, family: 'greek-latin',sample: 'ᚠ', note: 'c. 150 CE, Germanic. Derived from Latin or Etruscan; used for inscriptions and divination' },
    { id: 'cyrillic',      label: 'Cyrillic',             date: 860,   y: 2.5, family: 'greek-latin',sample: 'А', note: 'c. 860 CE, created by Saints Cyril and Methodius from Greek uncial. Now used by ~250M people' },
    { id: 'coptic',        label: 'Coptic',               date: 200,   y: 3,   family: 'greek-latin',sample: 'Ⲁ', note: 'c. 200 CE. Greek alphabet + 6 Demotic signs = Coptic. Liturgical language of Egyptian Christianity' },
    // Brahmic branch (from Aramaic)
    { id: 'brahmi',        label: 'Brahmi',               date: -250,  y: 6,   family: 'brahmic',    sample: '𑀅', note: 'c. 300 BCE, India. Ancestor of all South and Southeast Asian scripts. Possibly from Aramaic traders' },
    { id: 'devanagari',    label: 'Devanagari',           date: 1200,  y: 6.5, family: 'brahmic',    sample: 'अ', note: 'c. 1200 CE, from Brahmi. Used for Sanskrit, Hindi, Nepali — 600M+ speakers' },
    { id: 'tibetan',       label: 'Tibetan',              date: 620,   y: 7,   family: 'brahmic',    sample: 'ཀ', note: 'c. 620 CE, from Gupta Brahmi. Created for translating Buddhist texts' },
    // Independent scripts
    { id: 'ogham',         label: 'Ogham\n(Celtic)',      date: 400,   y: 8,   family: 'other',      sample: 'ᚑ', note: 'c. 4th century CE, Ireland. Possibly inspired by Latin alphabet, used for Irish/Pictish inscriptions' },
    { id: 'avestan',       label: 'Avestan\n(Zoroastrian)',date: 400,  y: 9,   family: 'other',      sample: '𐬀', note: 'c. 400 CE. Created specifically to write the Avesta (Zoroastrian scriptures); from Aramaic via Pahlavi' },
    { id: 'georgian',      label: 'Georgian',             date: 430,   y: 2.5, family: 'other',      sample: 'ა', note: 'c. 430 CE. Origin debated — possibly from Aramaic, possibly from Greek. Unique letterforms.' },
    { id: 'armenian',      label: 'Armenian',             date: 405,   y: 3.5, family: 'other',      sample: 'Ա', note: 'c. 405 CE, created by Mesrop Mashtots for translating Christian scriptures into Armenian' },
  ];

  const EDGES = [
    // Egyptian → Proto-Sinaitic (influence / source)
    { from: 'egyptian',       to: 'proto-sinaitic', type: 'source',     label: 'pictogram source' },
    // Main Semitic chain
    { from: 'proto-sinaitic', to: 'phoenician',     type: 'descent',    label: '' },
    { from: 'proto-sinaitic', to: 'ugaritic',       type: 'sibling',    label: 'parallel branch' },
    { from: 'phoenician',     to: 'aramaic',        type: 'descent',    label: '' },
    { from: 'phoenician',     to: 'greek',          type: 'descent',    label: '' },
    { from: 'phoenician',     to: 'hebrew',         type: 'descent',    label: '' },
    { from: 'aramaic',        to: 'hebrew',         type: 'descent',    label: 'square script' },
    { from: 'aramaic',        to: 'arabic',         type: 'descent',    label: '' },
    { from: 'aramaic',        to: 'syriac',         type: 'descent',    label: '' },
    { from: 'aramaic',        to: 'brahmi',         type: 'descent',    label: '?' },
    // Greek-Latin chain
    { from: 'greek',          to: 'latin',          type: 'descent',    label: 'via Etruscan' },
    { from: 'greek',          to: 'cyrillic',       type: 'descent',    label: '' },
    { from: 'greek',          to: 'coptic',         type: 'descent',    label: '' },
    { from: 'latin',          to: 'runic',          type: 'descent',    label: '?' },
    // Brahmic chain
    { from: 'brahmi',         to: 'devanagari',     type: 'descent',    label: '' },
    { from: 'brahmi',         to: 'tibetan',        type: 'descent',    label: '' },
  ];

  const FAMILY_COLORS = {
    'root':        '#8a7a5a',
    'semitic':     '#d4a55a',
    'greek-latin': '#5a9cd4',
    'brahmic':     '#7ac47a',
    'other':       '#b07ac4',
  };

  const FAMILY_LABELS = {
    'root':        'Pre-alphabetic root',
    'semitic':     'Semitic branch',
    'greek-latin': 'Greek-Latin branch',
    'brahmic':     'Brahmic branch',
    'other':       'Independent / other',
  };

  function render(pane) {
    pane.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'alpha-origin-container';

    // Legend
    const legend = document.createElement('div');
    legend.className = 'alpha-origin-legend';
    legend.innerHTML = Object.entries(FAMILY_LABELS).map(([k, v]) => `
      <span class="aol-item">
        <span class="aol-dot" style="background:${FAMILY_COLORS[k]}"></span>
        <span class="aol-label">${v}</span>
      </span>
    `).join('');
    container.appendChild(legend);

    // Build SVG
    const svgWrap = document.createElement('div');
    svgWrap.className = 'alpha-origin-svg-wrap';
    container.appendChild(svgWrap);
    pane.appendChild(container);

    // Use requestAnimationFrame to get actual dimensions
    requestAnimationFrame(() => {
      const W = svgWrap.clientWidth || 1000;
      buildSVG(svgWrap, W);
    });
  }

  function buildSVG(wrap, containerW) {
    const MARGIN = { top: 40, bottom: 60, left: 60, right: 60 };
    const ROW_H = 70;
    const ROWS = 10;
    const H = ROWS * ROW_H + MARGIN.top + MARGIN.bottom;
    const W = Math.max(containerW, 1100);

    // Date range: -3500 to 1500
    const DATE_MIN = -3400;
    const DATE_MAX = 1400;
    const dateToX = (d) => MARGIN.left + ((d - DATE_MIN) / (DATE_MAX - DATE_MIN)) * (W - MARGIN.left - MARGIN.right);
    const rowToY = (r) => MARGIN.top + r * ROW_H + ROW_H / 2;

    // Calculate positions
    const posMap = {};
    NODES.forEach(n => {
      posMap[n.id] = { x: dateToX(n.date), y: rowToY(n.y) };
    });

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.classList.add('alpha-origin-svg');

    // Background grid lines (century marks)
    const gridG = document.createElementNS(svgNS, 'g');
    gridG.classList.add('ao-grid');
    for (let yr = -3000; yr <= 1400; yr += 500) {
      const x = dateToX(yr);
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x); line.setAttribute('x2', x);
      line.setAttribute('y1', MARGIN.top - 20); line.setAttribute('y2', H - MARGIN.bottom + 10);
      line.classList.add('ao-gridline');
      gridG.appendChild(line);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', x); label.setAttribute('y', H - MARGIN.bottom + 22);
      label.classList.add('ao-gridlabel');
      label.setAttribute('text-anchor', 'middle');
      label.textContent = yr < 0 ? `${Math.abs(yr)} BCE` : (yr === 0 ? '0' : `${yr} CE`);
      gridG.appendChild(label);
    }
    svg.appendChild(gridG);

    // Edges
    const edgeG = document.createElementNS(svgNS, 'g');
    edgeG.classList.add('ao-edges');
    EDGES.forEach(e => {
      const from = posMap[e.from];
      const to = posMap[e.to];
      if (!from || !to) return;

      const path = document.createElementNS(svgNS, 'path');
      // Cubic bezier: exit right from source, enter left at target
      const cx1 = from.x + (to.x - from.x) * 0.4;
      const cy1 = from.y;
      const cx2 = from.x + (to.x - from.x) * 0.6;
      const cy2 = to.y;
      path.setAttribute('d', `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`);
      path.classList.add('ao-edge');
      if (e.type === 'source') path.classList.add('ao-edge-source');
      if (e.type === 'sibling') path.classList.add('ao-edge-sibling');
      edgeG.appendChild(path);
    });
    svg.appendChild(edgeG);

    // Nodes
    const nodeG = document.createElementNS(svgNS, 'g');
    nodeG.classList.add('ao-nodes');
    NODES.forEach(n => {
      const pos = posMap[n.id];
      const color = FAMILY_COLORS[n.family] || '#888';
      const g = document.createElementNS(svgNS, 'g');
      g.classList.add('ao-node');
      g.setAttribute('data-id', n.id);
      g.style.cursor = 'pointer';

      // Circle
      const r = n.family === 'root' ? 22 : 18;
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', pos.x); circle.setAttribute('cy', pos.y);
      circle.setAttribute('r', r);
      circle.setAttribute('fill', color + '22');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', '1.5');
      g.appendChild(circle);

      // Sample glyph
      const sampleText = document.createElementNS(svgNS, 'text');
      sampleText.setAttribute('x', pos.x); sampleText.setAttribute('y', pos.y + 6);
      sampleText.setAttribute('text-anchor', 'middle');
      sampleText.classList.add('ao-node-sample');
      sampleText.textContent = n.sample;
      g.appendChild(sampleText);

      // Label below
      const labelLines = n.label.split('\n');
      labelLines.forEach((line, i) => {
        const labelText = document.createElementNS(svgNS, 'text');
        labelText.setAttribute('x', pos.x);
        labelText.setAttribute('y', pos.y + r + 14 + i * 12);
        labelText.setAttribute('text-anchor', 'middle');
        labelText.classList.add('ao-node-label');
        labelText.textContent = line;
        g.appendChild(labelText);
      });

      // Tooltip on hover
      g.addEventListener('mouseenter', () => showTooltip(wrap, n, pos, W));
      g.addEventListener('mouseleave', () => hideTooltip(wrap));

      nodeG.appendChild(g);
    });
    svg.appendChild(nodeG);

    wrap.appendChild(svg);
  }

  function showTooltip(container, node, pos, svgW) {
    hideTooltip(container);
    const tip = document.createElement('div');
    tip.className = 'ao-tooltip';
    const dateStr = node.date < 0 ? `${Math.abs(node.date)} BCE` : `${node.date} CE`;
    const famLabel = FAMILY_LABELS[node.family] || node.family;
    tip.innerHTML = `
      <div class="aot-sample">${node.sample}</div>
      <div class="aot-name">${node.label.replace('\n', ' ')}</div>
      <div class="aot-date">${dateStr}</div>
      <div class="aot-family" style="color:${FAMILY_COLORS[node.family]}">${famLabel}</div>
      <div class="aot-note">${node.note}</div>
    `;
    container.appendChild(tip);
    // Position tooltip
    const svgEl = container.querySelector('svg');
    const svgRect = svgEl ? svgEl.getBoundingClientRect() : null;
    const contRect = container.getBoundingClientRect();
    if (svgRect) {
      const scaleX = svgRect.width / parseInt(svgEl.getAttribute('width'));
      const scaledX = pos.x * scaleX + (svgRect.left - contRect.left);
      const scaledY = pos.y * (svgRect.height / parseInt(svgEl.getAttribute('height'))) + (svgRect.top - contRect.top);
      tip.style.left = Math.min(scaledX + 20, contRect.width - 280) + 'px';
      tip.style.top = Math.max(scaledY - 80, 0) + 'px';
    }
  }

  function hideTooltip(container) {
    const existing = container.querySelector('.ao-tooltip');
    if (existing) existing.remove();
  }

  window._alphaOrigin = { render };

})();
