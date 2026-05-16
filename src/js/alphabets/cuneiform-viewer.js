// CODEX ATLAS — Cuneiform Viewer
// Mode: cuneiform — Independent writing system (Sumer, c. 3200 BCE)
// Registers as window._alphaCuneiform = { render(pane) }
// The parallel evolution argument: same problem (record-keeping), same solution (pictures),
// no shared ancestry. Convergent invention of writing, ~500 years apart.

(function () {
  'use strict';

  const SIGNS = [
    // Elements & Cosmos
    { sign: '\u{12000}', code: 'A',      name: 'A',       meaning: 'water / canal',          category: 'Elements',
      note: 'Water and canal were the same word — in Mesopotamia, human water-control was so foundational it collapsed into a single concept.',
      inv: 'Proto-Sinaitic Mem also derives from a water pictogram (wavy lines). Two independent traditions chose water as a root sign. The universal semantic anchor.' },
    { sign: '\u{12019}', code: 'AN',     name: 'AN',       meaning: 'sky / heaven / deity',   category: 'Sacred Realm',
      note: 'AN was the determinative placed before every divine name to mark it as divine. Sky and god were grammatically inseparable.',
      inv: 'Sumerian AN (sky/god) → Sanskrit deva (sky/shining) → Latin deus: the same collapse of "sky" into "divine" across unconnected languages. Sky = divine was not a metaphor — it was the original theological fact.' },
    { sign: '\u{121B8}', code: 'UD',     name: 'UD',       meaning: 'sun / day / white',      category: 'Elements',
      note: 'The sun sign tripled as the word for day and the colour white — light, duration, and purity were a single conceptual cluster.',
      inv: 'Egyptian Ra (sun) as both the physical disc and the divine principle. Aten hymn and Psalms 104 both describe the sun withdrawing and returning. Cuneiform UD encodes the same triple meaning independently.' },
    { sign: '\u{1207F}', code: 'KI',     name: 'KI',       meaning: 'earth / place',          category: 'Elements',
      note: 'KI was the complementary opposite of AN — sky above, earth below. All Sumerian cosmology was organized between these two poles.',
      inv: 'AN+KI (heaven+earth) = the totality of existence in Sumerian. Mirrors Hebrew shamayim ve-aretz (Gen 1:1), Vedic dyaus prithvi. The dual-axis cosmology recurs across writing systems as a near-universal.' },
    { sign: '\u{12309}', code: 'ID₂',   name: 'ID',       meaning: 'river',                  category: 'Elements',
      note: 'Rivers were the arteries of Mesopotamian civilization — the Tigris and Euphrates defined where life was possible.',
      inv: 'Enuma Elish opens with the mingling of Apsu (fresh water) and Tiamat (salt water). Genesis 2:10 opens with rivers from Eden. Rivers as the origin-point of creation is a convergent pattern.' },
    // Sacred Realm
    { sign: '\u{1202D}', code: 'DINGIR', name: 'DINGIR',   meaning: 'god / star',             category: 'Sacred Realm',
      note: 'A star-shaped sign used for all gods, written before divine names as a classifier. The star = god equation predates astronomy as a science.',
      inv: 'The same star-shaped determinative for divinity appears in Egyptian hieroglyphs (the Duat star N14). Writing systems independently encode: divinity is celestial.' },
    { sign: '\u{12038}', code: 'EN',     name: 'EN',       meaning: 'lord / master',          category: 'Sacred Realm',
      note: 'EN was both a human title (the city-lord) and the divine epithet for major gods. Power and divinity used the same word.',
      inv: 'Baal means "lord" in Ugaritic/Phoenician. Adonai means "my lord" in Hebrew (used to avoid saying YHWH). Ba\'al, EN, Adonai: three scripts, three traditions, all encoding divine power as "lord".' },
    { sign: '\u{1212D}', code: 'ME',     name: 'ME',       meaning: 'divine powers / being',  category: 'Sacred Realm',
      note: 'ME were the fundamental attributes of civilized existence — kingship, priesthood, writing, music, craftsmanship, wisdom — held by Enki and distributed to humanity.',
      inv: 'The ME are structurally identical to the Egyptian concept of Maat (cosmic order/divine law) and the Vedic Rita (cosmic order). All three traditions have a name for the organizing principle of reality that gods both embody and distribute.' },
    { sign: '\u{12048}', code: 'ERIN₂', name: 'ERIN',     meaning: 'cedar / army',           category: 'Sacred Realm',
      note: 'Cedar was sacred wood — used for temple construction, divine statues, and the doors of heaven. The Gilgamesh epic centers on the Cedar Forest as the domain of the divine.',
      inv: 'Cedar of Lebanon as sacred wood in Solomon\'s Temple (1 Kings 5). The same tree species — Cedrus libani — is sacred across Mesopotamian and Hebrew traditions. Not metaphor: the physical resin smell of cedar in the Ancient Near East carried real theological weight.' },
    // Society & Power
    { sign: '\u{12115}', code: 'LU',     name: 'LU',       meaning: 'person / man',           category: 'Society',
      note: 'The generic human sign — the semantic root from which hundreds of compound words for occupations and social roles were built.',
      inv: 'The LU determinative before human roles (LU.GAL = great man = king) mirrors the AN determinative before divine names. Both systems used the same compositional logic: modifier + base sign = compound meaning.' },
    { sign: '\u{12074}', code: 'LUGAL',  name: 'LUGAL',    meaning: 'king (great man)',       category: 'Society',
      note: 'LU (person) + GAL (great) = LUGAL (king). Kingship was literally encoded as "big person" — the most transparent etymology in any writing system.',
      inv: 'Compare Egyptian "pharaoh" (per-aa = great house), Hebrew "melek" (root: to be king/reign), Akkadian "sharru" (king). Only Sumerian made the etymology explicit in the sign itself.' },
    { sign: '\u{1208D}', code: 'GAL',    name: 'GAL',      meaning: 'great / large',          category: 'Society',
      note: 'The great/large modifier that, combined with other signs, formed the vocabulary of power: great lord, great king, great temple.',
      inv: 'The semantic logic of "greatness" as power qualifier appears across scripts: Hebrew gadol (great), Arabic kabir (great), all used as divine epithets. Sumerian GAL encodes this directly in the sign composition.' },
    { sign: '\u{12208}', code: 'NAM',    name: 'NAM',      meaning: 'fate / destiny',         category: 'Sacred Realm',
      note: 'NAM was the divine determination of a person\'s or city\'s fate — written at birth, carried through life. The Tablet of Destinies (DUB.NAM) was the cosmic record of all fates.',
      inv: 'The Tablet of Destinies stolen from Enlil in Anzu myth. The Book of Life in Revelation (20:12). The Akashic records in Theosophy. All encode: existence is recorded, fate is written. Writing systems may have originated partly in this theological intuition.' },
    // Nature & Production
    { sign: '\u{12163}', code: 'NINDA',  name: 'NINDA',    meaning: 'bread / food',           category: 'Production',
      note: 'Cuneiform originated partly in grain accounting — temple administrators needed to record rations. Bread was one of the first things writing had to name.',
      inv: 'The first cuneiform tablets (~3200 BCE) are administrative records of grain rations. Writing emerged not for literature or religion but for accountancy. The Uruk temple bureaucracy invented writing to count bread.' },
    { sign: '\u{1215E}', code: 'NIG₂',  name: 'NIG',      meaning: 'thing / property',       category: 'Production',
      note: 'NIG₂ was the generic "thing" — the semantic container for property, goods, and possessions. Its frequency in early tablets reflects the inventory origin of writing.',
      inv: 'The earliest writing is not myth or prayer — it is accountancy. Cuneiform began as a filing system. The Phoenician alphabet (c. 1050 BCE) was adopted by merchants. Script and commerce co-evolved, not script and religion.' },
    { sign: '\u{12236}', code: 'GI',     name: 'GI',       meaning: 'reed',                   category: 'Production',
      note: 'Reed is the tool and the material: cuneiform was pressed into clay with a reed stylus. The medium literally shaped the form — wedge impressions instead of curves.',
      inv: 'The Egyptian calamus reed was used for hieratic script on papyrus. Ogham was carved on wood and stone. Each medium created its own constraints: cuneiform wedges, Egyptian ink curves, Ogham straight cuts. Medium → form is a universal.' },
    { sign: '\u{12229}', code: 'GUD',    name: 'GUD',      meaning: 'bull / ox',              category: 'Production',
      note: 'The bull sign — and the bull was among the most economically and symbolically loaded animals in the Ancient Near East.',
      inv: 'Aleph (the first letter) is the proto-Sinaitic picture of an ox head. The bull at the start of the alphabet (Phoenician aleph → Greek alpha → Latin A) mirrors the bull\'s importance in Sumerian accounting. Both traditions begin with bovine wealth.' },
    // Numbers
    { sign: '𒐕',        code: '1',     name: 'ONE',      meaning: '1 (vertical stroke)',    category: 'Numbers',
      note: 'Cuneiform counted in a sexagesimal (base-60) system — the same system still governs minutes, seconds, and degrees today.',
      inv: 'We still use base-60 for time and angles because the Babylonians used it for astronomy. 60 minutes, 360 degrees, 24 hours — all are Babylonian cuneiform legacy embedded in the modern world.' },
    { sign: '𒐙',        code: '10',    name: 'TEN',      meaning: '10 (corner stroke)',     category: 'Numbers',
      note: 'The 10-group stroke — combining with the 1-stroke to reach 59 before resetting at 60.',
      inv: 'The sexagesimal system survives precisely where the Babylonians applied it most rigorously: astronomical observation. Time itself runs on a cuneiform clock.' },
    // Wisdom
    { sign: '\u{12246}', code: 'GEŠTU', name: 'GEŠTU',    meaning: 'ear / wisdom',           category: 'Sacred Realm',
      note: 'The ear was the seat of wisdom in Sumerian physiology — to be wise was literally to have big ears (to hear and understand). GEŠTU means both ear and wisdom.',
      inv: 'Enki is called "wide of ear" as a divine epithet meaning supremely wise. In Hebrew, shema (hear) is also the command for the greatest prayer (Shema Yisrael). Egyptian Thoth holds a reed pen to record what he hears. Ear = wisdom = recording: the chain of writing\'s self-understanding.' },
    { sign: '\u{1222C}', code: 'ZI',    name: 'ZI',       meaning: 'life / breath / soul',   category: 'Sacred Realm',
      note: 'ZI collapses life, breath, and soul into a single sign — in Sumerian there was no distinction between the animating breath and the life-principle it sustained.',
      inv: 'Hebrew nefesh (soul/breath/life) — the same triple meaning. Greek pneuma (breath/spirit/soul). Latin spiritus (breath/spirit). Across six writing systems: the soul is breath, and breath is life. The sign ZI encodes what every tradition independently discovered.' },
  ];

  const CATEGORIES = ['Elements', 'Sacred Realm', 'Society', 'Production', 'Numbers'];

  let _expandedSign = null;

  function render(pane) {
    pane.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'alpha-glyph-header';
    header.innerHTML = `
      <h2>Cuneiform — Sumer, c. 3200 BCE — Independent Origin</h2>
      <p>Cuneiform and the Egyptian-Phoenician chain solved the same problem independently. Both started as pictograms; both became abstract over millennia; they share no common ancestor. The convergence is the investigation: writing was invented twice, from scratch, within 500 years. What does that say about the relationship between language, record-keeping, and civilization?</p>
    `;
    pane.appendChild(header);

    // Comparison banner
    const banner = document.createElement('div');
    banner.className = 'acv-compare-banner';
    banner.innerHTML = `
      <div class="acv-chain">
        <span class="acv-chain-item acv-chain-cuneiform">𒀭<br><small>Cuneiform AN<br>c. 3200 BCE</small></span>
        <span class="acv-arrow">≠</span>
        <span class="acv-chain-item acv-chain-hier">𓆄<br><small>Egyptian hieroglyph<br>c. 3200 BCE</small></span>
        <span class="acv-arrow">→</span>
        <span class="acv-chain-item">𐤀<br><small>Phoenician<br>c. 1050 BCE</small></span>
        <span class="acv-arrow">→</span>
        <span class="acv-chain-item">Α<br><small>Greek<br>c. 800 BCE</small></span>
        <span class="acv-arrow">→</span>
        <span class="acv-chain-item">A<br><small>Latin<br>c. 600 BCE</small></span>
      </div>
      <p class="acv-compare-note">Cuneiform never merged with the Phoenician chain. It was replaced by Aramaic script (~500 BCE) and died with the last Babylonian scribes (~100 CE). What you see here has no living descendants.</p>
    `;
    pane.appendChild(banner);

    CATEGORIES.forEach(cat => {
      const catSigns = SIGNS.filter(s => s.category === cat);
      if (!catSigns.length) return;

      const section = document.createElement('div');
      section.innerHTML = `<div class="agv-section-divider">${cat}</div>`;
      const grid = document.createElement('div');
      grid.className = 'alpha-glyph-grid acv-grid';

      catSigns.forEach(s => {
        const cell = document.createElement('div');
        cell.className = 'alpha-glyph-cell' + (_expandedSign === s.code ? ' expanded' : '');
        cell.innerHTML = `
          <span class="agc-main-char acv-sign">${s.sign}</span>
          <span class="agc-name">${s.name}</span>
          <span class="agc-meaning">${s.meaning}</span>
          ${s.inv ? `<div class="agc-preview">${s.inv.split('.')[0]}.</div>` : ''}
        `;
        cell.addEventListener('click', () => {
          _expandedSign = (_expandedSign === s.code) ? null : s.code;
          render(pane);
        });
        grid.appendChild(cell);
      });

      section.appendChild(grid);

      // Inline expanded detail for clicked sign
      const expanded = SIGNS.find(s => s.category === cat && s.code === _expandedSign);
      if (expanded) {
        const detail = document.createElement('div');
        detail.className = 'acv-detail';
        detail.innerHTML = `
          <span class="acv-detail-sign">${expanded.sign}</span>
          <div class="acv-detail-body">
            <div class="acv-detail-name">${expanded.name} — <em>${expanded.meaning}</em></div>
            <div class="acv-detail-note">${expanded.note}</div>
            ${expanded.inv ? `
            <div class="age-investigation" style="margin-top:0.65rem">
              <div class="age-inv-label">what the investigation found</div>
              <div class="age-inv-text">${expanded.inv}</div>
            </div>` : ''}
          </div>
          <button class="age-close-btn" title="Close">✕</button>
        `;
        detail.querySelector('.age-close-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          _expandedSign = null;
          render(pane);
        });
        section.appendChild(detail);
      }

      pane.appendChild(section);
    });
  }

  window._alphaCuneiform = { render };

})();
