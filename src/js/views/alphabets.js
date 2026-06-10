// ============================================================
// CODEX ATLAS — ALPHABETS V2 VIEW
// ============================================================
//
// Filed 2026-06-10 per AUDIT/2026-06-10-alphabets-page-plan.md
// (John ratified N1: ALPHABETS is a first-class master-pill
// Section like ATLAS / TIMELINE, showing ALL alphabets).
//
// TWO CLASSES on one Section (the pill's right side, "the usual"):
//   · GLYPHS (default) — the REAL alphabets (per John: "like the
//     PROTOTYPE one"): the 22-letter grid + per-script lead view +
//     the 5-step transmission-chain card. CONTENT harvested from
//     the legacy ALPHA_GLYPH_DATA (the 412 KB hand-curated table);
//     the legacy AESTHETIC is not copied (V2 tokens throughout).
//     A reader-like surface — legitimately bespoke, like the Codex
//     READ panel.
//   · GENEALOGY — DELEGATES to the CANONICAL Forge engine
//     (timeline layout + the alphabet class from mode.js). The
//     2026-06-10 hand-rolled SVG tree was a parallel mini-engine —
//     rule #9 forbids it ("ONE engine, MANY spreads"); John caught
//     it instantly ("old NON canonical tech"). DELETED same day.
//     Graphs of alphabet nodes are the engine's job:
//     ATLAS|Alphabets (wheel) · TIMELINE|Alphabets (timeline).
//
// Single source of truth: window.ALPHA_GLYPH_DATA (data-only
// module) for the letters; graph rendering = the Forge engine on
// VAULT_DATA. The legacy origin-chain hardcoded graph is NOT read
// (rule #10).
//
// Boundary contract (public API):
//   window._alphabetsView = {
//     render(pane), unmount(),
//     // app-pill class API (same contract as window._forge):
//     supportedClasses(), getClassFilter(), setClassFilter(v),
//   }
// ============================================================
(function () {
  'use strict';

  let _pane = null;
  let _script = 'hieroglyph';         // GLYPHS lead script
  let _expandedName = null;           // GLYPHS expanded letter

  // ════════════════════════════════════════════════════════════════
  // GLYPHS (the REAL alphabets; data = ALPHA_GLYPH_DATA)
  // ════════════════════════════════════════════════════════════════
  const SCRIPTS = [
    { id: 'hieroglyph', label: 'Hieroglyph' },
    { id: 'phoenician', label: 'Phoenician' },
    { id: 'hebrew',     label: 'Hebrew' },
    { id: 'arabic',     label: 'Arabic' },
    { id: 'greek',      label: 'Greek' },
    { id: 'latin',      label: 'Latin' },
    { id: 'ogham',      label: 'Ogham' },
    { id: 'futhark',    label: 'Futhark' },
    { id: 'chinese',    label: 'Chinese' },
    { id: 'japanese',   label: 'Japanese' },
    { id: 'devanagari', label: 'Devanagari' },
    { id: 'hangul',     label: 'Hangul' },
    { id: 'aztec',      label: 'Aztec' },
    { id: 'maya',       label: 'Maya' },
    { id: 'quipu',      label: 'Quipu' },
  ];
  const STANDALONE = { chinese: 1, japanese: 1, devanagari: 1, hangul: 1, aztec: 1, maya: 1, quipu: 1 };
  const HIER_FONT = "'Noto Sans Egyptian Hieroglyphs', serif";

  function glyphChar(g, scriptId) {
    switch (scriptId) {
      case 'hieroglyph': return g.unicode ? String.fromCodePoint(g.unicode) : '';
      case 'phoenician': return g.phoenician || '';
      case 'hebrew':     return g.hebrew || '';
      case 'arabic':     return g.arabic || '';
      case 'greek':      return (g.greek || '').split(' ')[0];
      case 'latin':      return g.letter || '';
      default:           return g.unicode ? String.fromCodePoint(g.unicode) : '';
    }
  }
  function glyphFont(scriptId) {
    return scriptId === 'hieroglyph' ? HIER_FONT : 'inherit';
  }
  function svgGlyph(g, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5">' + g.glyphSVG + '</svg>';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function renderGlyphs(stage) {
    const DATA = window.ALPHA_GLYPH_DATA;
    if (!DATA) {
      stage.innerHTML = '<div class="alphabets-empty">ALPHA_GLYPH_DATA not loaded.</div>';
      return;
    }

    // 2026-06-10 — visible GENEALOGY entry point (John couldn't find it
    // behind the pill's class side). One in-pane chip, same handoff as
    // the pill: the canonical TIMELINE scoped to alphabets with the
    // writing-system lanes.
    const chips = '<div class="alphabets-script-row">'
      + '<button type="button" class="alphabets-script-chip alphabets-genealogy-chip" data-genealogy="1" title="The writing-system genealogy — every script on the canonical timeline">⌁ GENEALOGY TIMELINE</button>'
      + '<span class="alphabets-script-sep" aria-hidden="true"></span>'
      + SCRIPTS.map(s =>
      '<button type="button" class="alphabets-script-chip' + (s.id === _script ? ' is-active' : '') + '" data-script="' + s.id + '">' + s.label + '</button>'
    ).join('') + '</div>';

    const isStandalone = !!STANDALONE[_script];
    let rows = DATA.filter(g => {
      if (isStandalone) return g.scriptOnly && g.scriptOnly.includes(_script);
      if (!g.scriptOnly) return true;
      return g.scriptOnly.includes(_script);
    });
    if (_script === 'latin') {
      rows = rows.filter(g => g.letter && g.letter.trim() !== '')
                 .sort((a, b) => a.letter.localeCompare(b.letter));
    }

    const latinNote = _script === 'latin'
      ? '<div class="alphabets-glyph-note"><b>Latin kept 19 of 22 Phoenician letters.</b> Dropped: Teth, Tsade, Qoph as redundant sounds — added: G (from C), Y + Z (re-borrowed from Greek for loanwords).</div>'
      : '';

    const grid = '<div class="alphabets-glyph-grid">' + rows.map(g => {
      const main = g.glyphSVG ? svgGlyph(g, 'alphabets-glyph-svg') : esc(glyphChar(g, _script));
      return '<button type="button" class="alphabets-glyph-cell' + (g.name === _expandedName ? ' is-open' : '') + '" data-name="' + esc(g.name) + '">'
        + '<span class="alphabets-glyph-char" style="font-family:' + glyphFont(_script) + '">' + main + '</span>'
        + '<span class="alphabets-glyph-name">' + esc(g.name) + '</span>'
        + '<span class="alphabets-glyph-meaning">' + esc(g.meaning) + '</span>'
        + '</button>';
    }).join('') + '</div>';

    stage.innerHTML = chips + latinNote + grid
      + '<div class="alphabets-hint">' + rows.length + ' letters · lead script: ' + esc(_script) + ' · click a letter for its transmission chain</div>';

    stage.querySelectorAll('.alphabets-script-chip[data-script]').forEach(b => {
      b.addEventListener('click', () => { _script = b.dataset.script; _expandedName = null; renderGlyphs(stage); });
    });
    const gen = stage.querySelector('[data-genealogy]');
    if (gen) gen.addEventListener('click', () => {
      if (window._alphabetsView) window._alphabetsView.setClassFilter('genealogy');
    });
    // 2026-06-10 — IN-PLACE expansion (John: "everytime i click it pushes
    // me back to the top of the page losing my path"). The card inserts
    // directly after the clicked cell as a full-width grid row — no grid
    // re-render, no scroll reset.
    function openCard(cell) {
      const old = stage.querySelector('.alphabets-glyph-expanded');
      if (old) old.remove();
      stage.querySelectorAll('.alphabets-glyph-cell.is-open').forEach(c => c.classList.remove('is-open'));
      const name = cell.dataset.name;
      if (_expandedName === name) { _expandedName = null; return; }
      const g = DATA.find(x => x.name === name);
      if (!g) { _expandedName = null; return; }
      _expandedName = name;
      cell.classList.add('is-open');
      const card = buildExpanded(g, () => { _expandedName = null; cell.classList.remove('is-open'); });
      cell.insertAdjacentElement('afterend', card);
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    stage.querySelectorAll('.alphabets-glyph-cell').forEach(b => {
      b.addEventListener('click', () => openCard(b));
    });
    // Restore a previously-open card (e.g. re-entering the view).
    if (_expandedName) {
      const cell = [...stage.querySelectorAll('.alphabets-glyph-cell')].find(c => c.dataset.name === _expandedName);
      if (cell) { _expandedName = null; openCard(cell); }
      else _expandedName = null;
    }
  }

  // Builds + RETURNS the expanded letter-card element. The caller inserts
  // it directly after the clicked cell (full-width grid row) — in-place,
  // no grid re-render, no scroll jump.
  function buildExpanded(g, onClose) {
    const isHier = g.unicode != null && g.unicode >= 0x13000 && g.unicode <= 0x1342F;
    const isScriptOnly = !!(g.scriptOnly && g.scriptOnly.length);
    const safe = v => (!v || v === '(none)') ? '' : v;
    const big = g.glyphSVG ? svgGlyph(g, 'alphabets-glyph-svg alphabets-exp-bigsvg')
      : '<span style="font-family:' + (isHier ? HIER_FONT : 'inherit') + '">'
        + esc(isHier || isScriptOnly ? String.fromCodePoint(g.unicode) : (g.arabic || g.hebrew || g.phoenician || g.letter || '')) + '</span>';
    const gard = g.gardiner ? 'Gardiner ' + esc(g.gardiner) + ' · U+' + (g.unicode || 0).toString(16).toUpperCase()
               : (g.unicode ? 'U+' + g.unicode.toString(16).toUpperCase() : '');

    const chainStep = (ch, label, sub, hier) =>
      '<div class="alphabets-chain-step">'
      + '<span class="alphabets-chain-glyph"' + (hier ? ' style="font-family:' + HIER_FONT + '"' : '') + '>' + esc(ch) + '</span>'
      + '<span class="alphabets-chain-label">' + label + '</span>'
      + '<span class="alphabets-chain-sub">' + sub + '</span></div>';
    const arrow = '<span class="alphabets-chain-arrow">→</span>';
    const hierChar = isHier ? String.fromCodePoint(g.unicode) : '';
    const chain = isScriptOnly
      ? '<div class="alphabets-exp-chainlabel">PICTOGRAPHIC ORIGIN</div>'
      : '<div class="alphabets-exp-chainlabel">TRANSMISSION CHAIN</div>'
        + '<div class="alphabets-chain">'
        + chainStep(hierChar, 'Egyptian', 'c. 2000 BCE', true) + arrow
        + chainStep(hierChar, 'Proto-Sinaitic', 'c. 1850 BCE', true) + arrow
        + chainStep(g.phoenician || '', 'Phoenician', 'c. 1050 BCE') + arrow
        + chainStep((g.greek || '').split(' ')[0], 'Greek', 'c. 800 BCE') + arrow
        + chainStep((g.latin || g.letter || '').split(' ')[0], 'Latin', 'c. 600 BCE+')
        + '</div>';

    const desc = [['Hebrew', g.hebrew], ['Arabic', g.arabic], ['Greek', g.greek], ['Latin', g.latin], ['Sound', g.phoneme]]
      .filter(p => safe(p[1]))
      .map(p => '<span class="alphabets-exp-desc"><b>' + p[0] + '</b> ' + esc(p[1]) + '</span>').join('');

    const related = (g.relatedNodes || []).map(id =>
      '<button type="button" class="alphabets-exp-node" data-id="' + esc(id) + '">' + esc(id.replace(/^alphabet-/, '').replace(/-/g, ' ')) + '</button>'
    ).join('');

    const holder = document.createElement('div');
    holder.innerHTML =
      '<div class="alphabets-glyph-expanded">'
      + '<button type="button" class="alphabets-exp-close" title="Close">✕</button>'
      + '<div class="alphabets-exp-letter">'
      +   '<div class="alphabets-exp-big">' + big + '</div>'
      +   '<div class="alphabets-exp-name">' + esc(g.name) + ' — “' + esc(g.meaning) + '”</div>'
      +   (gard ? '<div class="alphabets-exp-gardiner">' + gard + '</div>' : '')
      +   (desc ? '<div class="alphabets-exp-descs">' + desc + '</div>' : '')
      + '</div>'
      + '<div class="alphabets-exp-chain">' + chain
      +   (g.note ? '<div class="alphabets-exp-note">' + esc(g.note) + '</div>' : '')
      + '</div>'
      + '<div class="alphabets-exp-inv">'
      +   (g.investigationHighlight
          ? '<div class="alphabets-exp-invlabel">WHAT THE INVESTIGATION FOUND</div>'
            + '<div class="alphabets-exp-invtext">' + esc(g.investigationHighlight) + '</div>'
            + (related ? '<div class="alphabets-exp-nodes">' + related + '</div>' : '')
          : '')
      + '</div>'
      + '</div>';

    const card = holder.firstElementChild;
    card.querySelector('.alphabets-exp-close').addEventListener('click', () => {
      card.remove();
      if (onClose) onClose();
    });
    card.querySelectorAll('.alphabets-exp-node[data-id]').forEach(chip => {
      chip.addEventListener('click', e => {
        e.stopPropagation();
        if (window.selectNode) window.selectNode(chip.dataset.id, true);
      });
    });
    return card;
  }

  // ════════════════════════════════════════════════════════════════
  // app-pill class API (same contract as _forge)
  // ════════════════════════════════════════════════════════════════
  function render(pane) {
    if (!pane) return;
    _pane = pane;
    pane.classList.add('alphabets-pane', 'is-glyphs');
    pane.innerHTML = '<div class="alphabets-stage" id="alphabets-stage"></div>';
    renderGlyphs(pane.querySelector('#alphabets-stage'));
  }

  function unmount() { _pane = null; _expandedName = null; }

  window._alphabetsView = {
    render: render,
    unmount: unmount,
    supportedClasses: function () {
      return [
        { value: 'glyphs',    label: 'Glyphs',              glyph: 'ℵ' },
        { value: 'genealogy', label: 'Genealogy', glyph: '⌁' },
      ];
    },
    getClassFilter: function () { return 'glyphs'; },
    setClassFilter: function (v) {
      if (v === 'genealogy') {
        // CANONICAL handoff — the genealogy IS the Forge engine's
        // timeline scoped to the alphabet class (rule #9: one engine,
        // many spreads). No bespoke graph here. Mirror the app-pill's
        // master-click mechanism exactly: setView first, then defer a
        // tick so the freshly-mounted _forge public API exists before
        // setLayout/setClassFilter (the pill does the same).
        try { window.setView('forge'); } catch (e) { /* not fatal */ }
        // The fresh forge instance installs its public API during
        // mount; a single deferred call can hit the OLD destroyed
        // instance (setLayout then no-ops, returns false). Poll on
        // the return value until the live instance acknowledges.
        let tries = 0;
        const apply = function () {
          tries++;
          const f = window._forge;
          let ok = false;
          try {
            ok = !!(f && typeof f.setLayout === 'function' && f.setLayout('timeline') === true);
            if (ok && typeof f.setClassFilter === 'function') f.setClassFilter('alphabet');
          } catch (e) { ok = false; }
          if (!ok && tries < 30) setTimeout(apply, 100);
        };
        setTimeout(apply, 0);
        return;
      }
      // 'glyphs' is the only in-pane class.
      try { document.dispatchEvent(new CustomEvent('codex:class-changed')); } catch (e) { /* ignore */ }
    },
  };
})();
