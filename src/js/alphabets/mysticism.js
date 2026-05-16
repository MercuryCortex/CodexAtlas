// CODEX ATLAS — Alphabet Mysticism
// Mode: mysticism — Gematria / Isopsephy / Abjad side-by-side comparison
// Registers as window._alphaMysticism = { render(pane) }
// Depends on: glyph-data.js (window.ALPHA_GEMATRIA)

(function () {
  'use strict';

  // Known famous examples with their numeric readings
  const EXAMPLES = [
    {
      tradition: 'Hebrew Gematria',
      equation: 'אחד = 13 = אהבה',
      translit: 'Echad (one) = 13 = Ahavah (love)',
      note: 'Love and Unity are numerically identical in Hebrew. 1+8+4 = 13; 1+5+2+5 = 13. A cornerstone of Kabbalistic theology: the oneness of God (Echad) equals love (Ahavah).'
    },
    {
      tradition: 'Hebrew Gematria',
      equation: 'חי = 18',
      translit: 'Chai (life) = 18',
      note: '"Chai" (ח=8, י=10) means "living." Jewish tradition gives charitable gifts in multiples of $18 — the amount equals "life." The custom persists globally in Jewish philanthropy and bar/bat mitzvah gifts.'
    },
    {
      tradition: 'Hebrew Gematria',
      equation: 'נרון קסר = 666',
      translit: 'Nrwn Qsr (Nero Caesar) = 666',
      note: 'The Number of the Beast (Revelation 13:18) was a political cipher: NRWN QSR is Nero Caesar in Hebrew transliteration. N(50)+R(200)+W(6)+N(50) + Q(100)+S(60)+R(200) = 666. "Wisdom" to decode it required knowing the Hebrew cipher.'
    },
    {
      tradition: 'Hebrew Gematria',
      equation: 'יהוה = 26',
      translit: 'YHWH (the divine name) = 26',
      note: 'The Tetragrammaton: Y(10)+H(5)+W(6)+H(5) = 26. Kabbalists note that 26 = 2 × 13 = twice the value of "one" and "love." The divine name as a numeric assertion of love-unity.'
    },
    {
      tradition: 'Greek Isopsephy',
      equation: 'ΙΧΘΥΣ = 1480 / 888',
      translit: 'Ichthys (fish) = 1480; Iesous (Jesus) = 888',
      note: 'Early Christians used a fish as their symbol partly because ICHTHYS (ΙΧΘ ΥΣ = 10+600+9+400+200 = 1219 — variant calculations give 888 for ΙΗΣΟΥΣ). Jesus = 888 in isopsephy. The fish wasn\'t random: it was a numeric confession of faith.'
    },
    {
      tradition: 'Greek Isopsephy',
      equation: 'ΑΒΡΑΣΑΞ = 365',
      translit: 'Abraxas = 365',
      note: 'The Gnostic deity name ΑΒΡΑΣΑΞ: 1+2+100+1+200+1+60 = 365. The number of days in the solar year. Abraxas was deliberately named to encode solar completeness. The Basilidean Gnostics constructed their entire cosmology around this 365.'
    },
    {
      tradition: 'Greek Isopsephy',
      equation: 'ΝΙΚΗ = 88',
      translit: 'Nike (victory) = 88',
      note: 'N(50)+I(10)+K(20)+H(8) = 88. Athletes and generals sought divine favor from Nike; the number 88 appears in athletic votive inscriptions. The isopsephy of "victory" embedded in offerings.'
    },
    {
      tradition: 'Arabic Abjad',
      equation: 'الله = 66',
      translit: 'Allah (God) = 66',
      note: 'Alif(1)+Lam(30)+Lam(30)+Ha(5) = 66. Islamic numerology (\'ilm al-huruf) treats 66 as the divine number. Sufi practitioners use 66-bead rosaries. The name of God encodes divine completeness.'
    },
    {
      tradition: 'Arabic Abjad',
      equation: 'بسم الله = 786',
      translit: 'Bismillah = 786',
      note: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — "In the name of God, the Most Gracious, the Most Merciful." Abjad value: 786. This number is written at the top of documents in South Asian Islamic practice as an abbreviation for the full Basmala.'
    },
    {
      tradition: 'Cross-tradition',
      equation: 'A = 1 across all three',
      translit: 'Alpha / Aleph / Alif all equal 1',
      note: 'The first letter of the Hebrew, Greek, and Arabic alphabets all have the value 1. This is not coincidence — all three systems descend from the same Phoenician abjad order. The shared numeric structure of three apparently distinct traditions is direct evidence of their common origin.'
    },
  ];

  function render(pane) {
    pane.innerHTML = '';
    const data = window.ALPHA_GEMATRIA || [];

    const container = document.createElement('div');
    container.className = 'alpha-mysticism-container';

    container.innerHTML = `
      <div class="alpha-myst-header">
        <h2>Gematria · Isopsephy · Abjad</h2>
        <p>Hebrew, Greek, and Arabic all assign numeric values to their letters — a direct inheritance from their shared Phoenician origin. The same order, the same values, three apparently separate traditions. The numbers were always there.</p>
      </div>

      <div class="alpha-myst-cols">
        <div class="alpha-myst-col alpha-myst-col-heb">
          <h3>Hebrew Gematria</h3>
          <div class="alpha-myst-col-intro">22 letters · values 1–400 · right to left</div>
          <div class="alpha-myst-rows" id="myst-col-heb">
            ${data.map(r => `
              <div class="alpha-myst-row">
                <span class="amr-glyph amr-heb">${r.heb}</span>
                <span class="amr-name">${r.name}</span>
                <span class="amr-val">${r.val}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="alpha-myst-col alpha-myst-col-greek">
          <h3>Greek Isopsephy</h3>
          <div class="alpha-myst-col-intro">24 letters (+ archaic) · values 1–800 · left to right</div>
          <div class="alpha-myst-rows" id="myst-col-greek">
            ${data.map(r => `
              <div class="alpha-myst-row">
                <span class="amr-glyph amr-greek">${r.greek}</span>
                <span class="amr-name">${r.gName}</span>
                <span class="amr-val">${r.greekVal}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="alpha-myst-col alpha-myst-col-arabic">
          <h3>Arabic Abjad</h3>
          <div class="alpha-myst-col-intro">28 letters (abjad order) · values 1–1000 · right to left</div>
          <div class="alpha-myst-rows" id="myst-col-arabic">
            ${data.map(r => `
              <div class="alpha-myst-row">
                <span class="amr-glyph amr-arabic">${r.arabic}</span>
                <span class="amr-name">${r.aName}</span>
                <span class="amr-val">${r.arabicVal}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="alpha-myst-examples">
        <h3>Known examples — famous numeric readings across traditions</h3>
        <div class="ame-grid">
          ${EXAMPLES.map(ex => `
            <div class="ame-card">
              <div class="ame-tradition">${ex.tradition}</div>
              <div class="ame-equation">${ex.equation}</div>
              <div class="ame-translit">${ex.translit}</div>
              <div class="ame-note">${ex.note}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="alpha-myst-calculator">
        <h3>Calculate</h3>
        <p class="alpha-myst-calc-intro">Type a word to see its value in all three traditions. Uses the shared Phoenician-order mapping.</p>
        <div class="amc-inputs">
          <input type="text" class="amc-input" id="amc-heb" placeholder="Hebrew (e.g. שלום)" dir="rtl" />
          <input type="text" class="amc-input" id="amc-greek" placeholder="Greek (e.g. ΛΟΓΟΣ)" />
          <input type="text" class="amc-input" id="amc-arabic" placeholder="Arabic (e.g. نور)" dir="rtl" />
        </div>
        <div class="amc-result" id="amc-result">Enter text above to calculate</div>
      </div>
    `;

    pane.appendChild(container);

    // Attach calculator logic
    setupCalculator(container, data);
  }

  function setupCalculator(container, data) {
    // Build lookup maps
    const hebMap = {};
    const greekMap = {};
    const arabicMap = {};

    data.forEach(r => {
      hebMap[r.heb] = r.val;
      // Greek — map individual characters
      if (r.greek && r.greek.length > 0) {
        greekMap[r.greek] = r.greekVal;
        // Also try lowercase for Greek
        greekMap[r.greek.toLowerCase()] = r.greekVal;
      }
      if (r.arabic && r.arabic.length > 0) {
        arabicMap[r.arabic] = r.arabicVal;
      }
    });

    function sumChars(str, map) {
      let total = 0;
      let hits = 0;
      for (const ch of str) {
        if (map[ch] !== undefined) {
          total += map[ch];
          hits++;
        }
      }
      return { total, hits };
    }

    function updateResult() {
      const hebInput = document.getElementById('amc-heb').value.trim();
      const greekInput = document.getElementById('amc-greek').value.trim().toUpperCase();
      const arabicInput = document.getElementById('amc-arabic').value.trim();
      const resultEl = document.getElementById('amc-result');

      const parts = [];

      if (hebInput) {
        const { total, hits } = sumChars(hebInput, hebMap);
        if (hits > 0) parts.push(`<span class="amc-result-part"><span class="amc-r-trad">Gematria</span> <span class="amc-r-word">${hebInput}</span> = <strong>${total}</strong></span>`);
      }
      if (greekInput) {
        const { total, hits } = sumChars(greekInput, greekMap);
        if (hits > 0) parts.push(`<span class="amc-result-part"><span class="amc-r-trad">Isopsephy</span> <span class="amc-r-word">${greekInput}</span> = <strong>${total}</strong></span>`);
      }
      if (arabicInput) {
        const { total, hits } = sumChars(arabicInput, arabicMap);
        if (hits > 0) parts.push(`<span class="amc-result-part"><span class="amc-r-trad">Abjad</span> <span class="amc-r-word">${arabicInput}</span> = <strong>${total}</strong></span>`);
      }

      if (parts.length > 0) {
        resultEl.innerHTML = parts.join('<span class="amc-sep"> · </span>');
      } else {
        resultEl.textContent = 'Enter text above to calculate';
      }
    }

    ['amc-heb', 'amc-greek', 'amc-arabic'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateResult);
    });
  }

  window._alphaMysticism = { render };

})();
