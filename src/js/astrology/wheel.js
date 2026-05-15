// ============================================================
// CODEX ATLAS — Astrology · Wheel mode
// Natal/event chart renderer. Tropical zodiac wheel with 7 classical
// planets (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn) plotted at
// their geocentric ecliptic longitudes for the chosen date+time.
//
// Uses astronomy-engine (window.Astronomy, vendored at _assets/vendor/astronomy/).
// MIT licensed; accurate to arcminutes over ±2000 years.
//
// Drop in any vault event's date to investigate "what did the sky look like
// when X happened?" — e.g. fall of Constantinople 1453-05-29.
// ============================================================
(function () {
  if (!window.Astronomy) {
    console.warn('[astro/wheel] Astronomy library not loaded yet.');
  }

  const BODIES = [
    { key: 'Sun',     glyph: '☉', color: '#e0a850', deity: 'sun-disk' },
    { key: 'Moon',    glyph: '☽', color: '#aabac5', deity: 'soma' },
    { key: 'Mercury', glyph: '☿', color: '#5a9a8f', deity: 'mercury-roman' },
    { key: 'Venus',   glyph: '♀', color: '#6e8c6b', deity: 'venus-roman' },
    { key: 'Mars',    glyph: '♂', color: '#c25450', deity: 'mars-roman' },
    { key: 'Jupiter', glyph: '♃', color: '#a87bb5', deity: 'jupiter' },
    { key: 'Saturn',  glyph: '♄', color: '#5a6cc4', deity: 'saturn-roman' }
  ];
  const SIGNS = [
    { name: 'Aries',       glyph: '♈', element: 'fire',  modality: 'cardinal' },
    { name: 'Taurus',      glyph: '♉', element: 'earth', modality: 'fixed' },
    { name: 'Gemini',      glyph: '♊', element: 'air',   modality: 'mutable' },
    { name: 'Cancer',      glyph: '♋', element: 'water', modality: 'cardinal' },
    { name: 'Leo',         glyph: '♌', element: 'fire',  modality: 'fixed' },
    { name: 'Virgo',       glyph: '♍', element: 'earth', modality: 'mutable' },
    { name: 'Libra',       glyph: '♎', element: 'air',   modality: 'cardinal' },
    { name: 'Scorpio',     glyph: '♏', element: 'water', modality: 'fixed' },
    { name: 'Sagittarius', glyph: '♐', element: 'fire',  modality: 'mutable' },
    { name: 'Capricorn',   glyph: '♑', element: 'earth', modality: 'cardinal' },
    { name: 'Aquarius',    glyph: '♒', element: 'air',   modality: 'fixed' },
    { name: 'Pisces',      glyph: '♓', element: 'water', modality: 'mutable' }
  ];
  const ELEMENT_TINT = { fire: 'rgba(194,84,80,0.10)', earth: 'rgba(154,165,90,0.10)', air: 'rgba(168,123,181,0.10)', water: 'rgba(90,108,196,0.10)' };

  // Compute geocentric ecliptic longitude (tropical, 0-360°) for a body at date.
  function eclipticLongitude(bodyKey, date) {
    const A = window.Astronomy; if (!A) return 0;
    const body = A.Body[bodyKey];
    const time = A.MakeTime(date);
    const vec = A.GeoVector(body, time, true);
    const ecl = A.Ecliptic(vec);
    return ((ecl.elon % 360) + 360) % 360;
  }

  function isRetrograde(bodyKey, date) {
    if (bodyKey === 'Sun' || bodyKey === 'Moon') return false;
    const l1 = eclipticLongitude(bodyKey, date);
    const next = new Date(date.getTime() + 86400000);
    const l2 = eclipticLongitude(bodyKey, next);
    let diff = l2 - l1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff < 0;
  }

  function signFor(longitude) {
    const idx = Math.floor(longitude / 30);
    const within = longitude - idx * 30;
    return { idx, sign: SIGNS[idx], deg: within };
  }

  function fmtDeg(d) {
    const deg = Math.floor(d);
    const min = Math.floor((d - deg) * 60);
    return `${deg}°${min.toString().padStart(2, '0')}′`;
  }

  // STATE
  const state = {
    date: new Date()
  };

  function render(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = '';
    rootEl.classList.add('astrology-pane-live');

    const layout = document.createElement('div');
    layout.className = 'astro-wheel-layout';
    rootEl.appendChild(layout);

    const wheelWrap = document.createElement('div');
    wheelWrap.className = 'astro-wheel-svg-wrap';
    layout.appendChild(wheelWrap);

    const side = document.createElement('div');
    side.className = 'astro-wheel-side';
    side.innerHTML = `
      <h3 class="aws-title">Sky chart</h3>
      <div class="aws-controls">
        <label class="aws-label">Date<br><input type="date" id="aws-date" value="${state.date.toISOString().slice(0,10)}"></label>
        <label class="aws-label">Time UTC<br><input type="time" id="aws-time" value="${state.date.toISOString().slice(11,16)}"></label>
        <div class="aws-presets">
          <button class="btn btn-mini aws-preset" data-date="today">today</button>
          <button class="btn btn-mini aws-preset" data-date="0000-01-01">0 CE</button>
          <button class="btn btn-mini aws-preset" data-date="-0747-02-26">−747 (Nabonassar)</button>
          <button class="btn btn-mini aws-preset" data-date="1453-05-29">1453 Constantinople</button>
          <button class="btn btn-mini aws-preset" data-date="1582-10-15">1582 Gregorian</button>
        </div>
      </div>
      <div class="aws-positions" id="aws-positions"></div>
      <div class="aws-footer">Tropical zodiac · geocentric ecliptic longitudes · astronomy-engine</div>
    `;
    layout.appendChild(side);

    side.querySelectorAll('.aws-preset').forEach(b => {
      b.onclick = () => {
        const v = b.dataset.date;
        if (v === 'today') state.date = new Date();
        else {
          // Parse year-month-day with potential negative year
          const m = v.match(/^(-?\d+)-(\d+)-(\d+)$/);
          if (m) {
            const d = new Date(Date.UTC(2000, 0, 1));
            d.setUTCFullYear(parseInt(m[1], 10));
            d.setUTCMonth(parseInt(m[2], 10) - 1);
            d.setUTCDate(parseInt(m[3], 10));
            state.date = d;
          }
        }
        render(rootEl);
      };
    });
    side.querySelector('#aws-date').onchange = (ev) => {
      const m = ev.target.value.match(/^(-?\d+)-(\d+)-(\d+)$/);
      if (m) {
        const t = state.date;
        const d = new Date(Date.UTC(2000, 0, 1, t.getUTCHours(), t.getUTCMinutes()));
        d.setUTCFullYear(parseInt(m[1], 10));
        d.setUTCMonth(parseInt(m[2], 10) - 1);
        d.setUTCDate(parseInt(m[3], 10));
        state.date = d; render(rootEl);
      }
    };
    side.querySelector('#aws-time').onchange = (ev) => {
      const m = ev.target.value.match(/^(\d+):(\d+)$/);
      if (m) {
        const d = new Date(state.date.getTime());
        d.setUTCHours(parseInt(m[1], 10));
        d.setUTCMinutes(parseInt(m[2], 10));
        state.date = d; render(rootEl);
      }
    };

    drawWheel(wheelWrap, state.date, side);
  }

  function drawWheel(wrapEl, date, sideEl) {
    wrapEl.innerHTML = '';
    if (!window.Astronomy) {
      wrapEl.innerHTML = '<div class="astro-wheel-error">astronomy-engine library not loaded</div>';
      return;
    }
    const W = wrapEl.clientWidth, H = wrapEl.clientHeight;
    if (!W || !H) return;
    const cx = W / 2, cy = H / 2;
    const Router = Math.min(W, H) * 0.42;
    const Rinner = Router * 0.62;
    const Rplanet = (Router + Rinner) / 2;
    const Rsign = Router * 1.05;

    const svg = d3.select(wrapEl).append('svg')
      .attr('class', 'astro-wheel-svg')
      .attr('width', '100%').attr('height', '100%').style('display', 'block');

    // 12 sign sectors — Aries 0° at 9 o'clock (left), going counter-clockwise per
    // standard astrological convention (zodiac increases counter-clockwise).
    const arc = d3.arc().innerRadius(Rinner).outerRadius(Router).padAngle(0.004);
    function sectorAng(signIdx) {
      // Aries (idx 0) starts at 180° (left horizon) and grows CCW. In SVG y-down,
      // CCW means negative angle. Each sign = 30°.
      const start = (180 + signIdx * 30) * Math.PI / 180;
      const end   = (180 + (signIdx + 1) * 30) * Math.PI / 180;
      return { startAngle: start, endAngle: end };
    }
    function longitudeToSvg(lon, r) {
      // Convert ecliptic longitude (0-360, Aries 0° = 9 o'clock, CCW) into SVG x,y.
      const ang = (180 + lon) * Math.PI / 180;
      // SVG y-down: rotate by ang from center
      const x = cx + r * Math.cos(ang);
      const y = cy - r * Math.sin(ang);
      return [x, y];
    }

    const sectorG = svg.append('g').attr('class', 'astro-wheel-signs');
    SIGNS.forEach((s, i) => {
      const a = sectorAng(i);
      // Convert d3.arc-style svg path (which assumes y-down 12 o'clock = 0° CCW),
      // we build it manually for the y-down convention. Use longitudeToSvg.
      const lon0 = i * 30, lon1 = (i + 1) * 30;
      const [x0o, y0o] = longitudeToSvg(lon0, Router);
      const [x1o, y1o] = longitudeToSvg(lon1, Router);
      const [x0i, y0i] = longitudeToSvg(lon0, Rinner);
      const [x1i, y1i] = longitudeToSvg(lon1, Rinner);
      const path = `M ${x0o},${y0o} A ${Router},${Router} 0 0 0 ${x1o},${y1o} L ${x1i},${y1i} A ${Rinner},${Rinner} 0 0 1 ${x0i},${y0i} Z`;
      sectorG.append('path')
        .attr('d', path)
        .attr('fill', ELEMENT_TINT[s.element])
        .attr('stroke', 'var(--border-soft)').attr('stroke-width', 1);
      const [lx, ly] = longitudeToSvg(lon0 + 15, Rsign);
      sectorG.append('text')
        .attr('x', lx).attr('y', ly).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', 'var(--gold-soft)').attr('font-family', 'var(--serif)').attr('font-size', '20px')
        .text(s.glyph);
    });

    // Degree ticks (every 5°) around the inner ring
    for (let d = 0; d < 360; d += 5) {
      const [x1, y1] = longitudeToSvg(d, Rinner);
      const [x2, y2] = longitudeToSvg(d, Rinner - (d % 30 === 0 ? 12 : d % 10 === 0 ? 8 : 4));
      svg.append('line').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
        .attr('stroke', 'var(--text-3)').attr('stroke-opacity', d % 30 === 0 ? 0.8 : 0.35).attr('stroke-width', 1);
    }

    // PLANETS — compute longitude + place
    const positions = BODIES.map(b => {
      const lon = eclipticLongitude(b.key, date);
      const sf = signFor(lon);
      const retro = isRetrograde(b.key, date);
      return { ...b, lon, sign: sf.sign.name, signGlyph: sf.sign.glyph, deg: sf.deg, retro };
    });

    // Cluster-aware radial placement: if two planets are within 4° of each other,
    // offset them along the radial direction so the glyphs don't overlap.
    const sorted = [...positions].sort((a, b) => a.lon - b.lon);
    const placed = [];
    sorted.forEach(p => {
      let r = Rplanet;
      while (placed.some(q => Math.abs(((q.lon - p.lon + 540) % 360) - 180) < 4 && Math.abs(q.r - r) < 14)) {
        r -= 14;
        if (r < Rinner + 14) r = Rplanet + 14;
      }
      p.r = r;
      placed.push(p);
    });

    const planetG = svg.append('g').attr('class', 'astro-wheel-planets');
    positions.forEach(p => {
      const [px, py] = longitudeToSvg(p.lon, p.r);
      const g = planetG.append('g').attr('class', 'astro-wheel-planet')
        .attr('transform', `translate(${px},${py})`).style('cursor', 'pointer')
        .on('click', () => { if (window.selectNode && p.deity) window.selectNode(p.deity, true); });
      g.append('circle').attr('r', 11).attr('fill', p.color).attr('fill-opacity', 0.12)
        .attr('stroke', p.color).attr('stroke-width', 1.5);
      g.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', p.color).attr('font-family', 'var(--serif)').attr('font-size', '15px')
        .text(p.glyph);
      if (p.retro) {
        g.append('text').attr('x', 12).attr('y', -8).attr('text-anchor', 'start')
          .attr('fill', '#d4a55a').attr('font-family', 'var(--mono)').attr('font-size', '9px')
          .text('℞');
      }
      // tick mark on the rim showing exact longitude
      const [tx1, ty1] = longitudeToSvg(p.lon, Rinner);
      const [tx2, ty2] = longitudeToSvg(p.lon, Rinner - 18);
      svg.append('line').attr('x1', tx1).attr('y1', ty1).attr('x2', tx2).attr('y2', ty2)
        .attr('stroke', p.color).attr('stroke-width', 1.5).attr('stroke-opacity', 0.7);
    });

    // CENTER text
    svg.append('text').attr('x', cx).attr('y', cy - 8).attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-1)').attr('font-family', 'var(--serif)').attr('font-size', '14px')
      .text(fmtDateLabel(date));
    svg.append('text').attr('x', cx).attr('y', cy + 12).attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-3)').attr('font-family', 'var(--mono)').attr('font-size', '10px')
      .text('tropical · geocentric');

    // SIDE PANEL — position table
    const slot = sideEl.querySelector('#aws-positions');
    if (slot) {
      slot.innerHTML = positions.map(p => {
        const decanN = Math.floor(p.lon / 10) + 1; // 1-36
        return `
        <div class="aws-row" data-deity="${p.deity}" data-decan-n="${decanN}">
          <span class="aws-glyph" style="color:${p.color}">${p.glyph}</span>
          <span class="aws-name">${p.key}</span>
          <span class="aws-sign">${p.signGlyph} ${p.sign}</span>
          <span class="aws-deg">${fmtDeg(p.deg)}</span>
          ${p.retro ? '<span class="aws-retro" title="retrograde">℞</span>' : '<span class="aws-retro"></span>'}
          <a href="#" class="aws-decanic-link" data-decan-n="${decanN}" title="See this position in the Decanic cross-tradition view">→ D${decanN}</a>
        </div>`;
      }).join('');
      slot.querySelectorAll('.aws-row').forEach(row => {
        row.onclick = (ev) => {
          if (ev.target.classList && ev.target.classList.contains('aws-decanic-link')) {
            ev.preventDefault();
            ev.stopPropagation();
            const n = parseInt(ev.target.dataset.decanN, 10);
            if (window._astroJumpToDecanic) window._astroJumpToDecanic(n);
            return;
          }
          if (window.selectNode && row.dataset.deity) window.selectNode(row.dataset.deity, true);
        };
      });
    }
  }

  function fmtDateLabel(d) {
    const y = d.getUTCFullYear();
    const yStr = y < 0 ? Math.abs(y) + ' BCE' : y + ' CE';
    const mo = d.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
    return `${mo} ${d.getUTCDate()} · ${yStr}`;
  }

  window._astroWheel = { render: render };
})();
