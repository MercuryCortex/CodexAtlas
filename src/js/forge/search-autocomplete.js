// ============================================================
// CODEX ATLAS — FORGE SEARCH AUTOCOMPLETE
// ============================================================
//
// Phase 23.1e RETRY (2026-05-25 NIGHT) — fresh carve.
//
// AST-VALIDATED DEPS: { local, toggleLock }
// BOUNDARY CONTRACT:
//   window._forgeSearchAutocomplete.attach({ local, toggleLock })
// ============================================================
(function () {
  function attach({ local, toggleLock }) {
    const inp     = document.getElementById('forge-status-search');
    const suggest = document.getElementById('forge-search-suggest');
    if (!inp || !suggest) return;

    // THE SEARCH CORPUS IS THE WHEEL'S, NOT THE HOUSE'S (2026-07-31
    // wave 2, mode-nodes-mutation-leaks-into-search). Entering a house
    // folds that family's documents and court into local.mode.nodes so
    // the engine can pack them; this list is a different contract — the
    // set the user can search and lock. Left unguarded, searching
    // 'derveni' in Deities mode found nothing on the wheel and then
    // found it inside the Greek house, where picking it locks either a
    // ~4-world-unit rail glyph or a radius-0 node parked on the crown
    // and flies the camera to nothing. Same fix the timeline scrubber
    // already carries (timeline-scrubber.js:72).
    function modeNodes() {
      const snap = local._houseModeSnapshot;
      if (snap && snap.mode === local.mode && snap.nodes) return snap.nodes;
      return (local.mode && local.mode.nodes) || [];
    }
    function escapeHtml(s) {
      return String(s || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function render(matches) {
      if (!matches.length) {
        suggest.innerHTML = '';
        suggest.classList.remove('is-open');
        suggest.setAttribute('aria-hidden', 'true');
        return;
      }
      suggest.innerHTML = matches.slice(0, 8).map(m => {
        return '<button class="forge-search-suggest-item" data-id="' + escapeHtml(m.id) + '">'
          + '<span class="fss-dot" style="background:' + escapeHtml(m.color || '#888') + '"></span>'
          + '<span class="fss-title">' + escapeHtml(m.title || m.id) + '</span>'
          + '<span class="fss-fam">' + escapeHtml(m.family || '') + '</span>'
          + '</button>';
      }).join('');
      suggest.classList.add('is-open');
      suggest.setAttribute('aria-hidden', 'false');
    }
    function search(q) {
      q = (q || '').trim().toLowerCase();
      if (!q) return [];
      const all = modeNodes();
      const out = [];
      for (let i = 0; i < all.length && out.length < 12; i++) {
        const n = all[i];
        const title = (n.title || n.id || '').toLowerCase();
        if (title.indexOf(q) === -1) {
          const aka = Array.isArray(n.aka) ? n.aka.join(' ').toLowerCase() : '';
          if (!aka || aka.indexOf(q) === -1) continue;
        }
        out.push({
          id:     n.id,
          title:  n.title || n.id,
          family: n.family || '',
          color:  n.family_color || n.tradition_color || '#888',
        });
      }
      out.sort((a, b) => {
        const ai = a.title.toLowerCase().startsWith(q) ? 0 : 1;
        const bi = b.title.toLowerCase().startsWith(q) ? 0 : 1;
        return ai - bi || a.title.localeCompare(b.title);
      });
      return out;
    }
    inp.addEventListener('input', () => render(search(inp.value)));
    inp.addEventListener('focus', () => {
      if (inp.value.trim()) render(search(inp.value));
    });
    inp.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        suggest.innerHTML = '';
        suggest.classList.remove('is-open');
        suggest.setAttribute('aria-hidden', 'true');
      } else if (ev.key === 'Enter') {
        const first = suggest.querySelector('.forge-search-suggest-item');
        if (first) {
          ev.preventDefault();
          first.click();
        }
      }
    });
    suggest.addEventListener('mousedown', (ev) => {
      const item = ev.target.closest('.forge-search-suggest-item');
      if (!item) return;
      ev.preventDefault();
      const id = item.dataset.id;
      if (id) {
        try {
          if (local && local.lockedSet) {
            if (local.lockedSet.size) {
              for (const oldId of Array.from(local.lockedSet)) {
                if (typeof toggleLock === 'function') toggleLock(oldId);
              }
            }
            if (typeof toggleLock === 'function') toggleLock(id);
          }
        } catch (e) { /* best-effort */ }
      }
      inp.value = '';
      suggest.innerHTML = '';
      suggest.classList.remove('is-open');
      suggest.setAttribute('aria-hidden', 'true');
      inp.blur();
    });
    document.addEventListener('click', (ev) => {
      if (suggest.contains(ev.target) || inp.contains(ev.target)) return;
      suggest.classList.remove('is-open');
      suggest.setAttribute('aria-hidden', 'true');
    });
  }

  window._forgeSearchAutocomplete = { attach };
})();
