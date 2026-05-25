// ============================================================
// CODEX ATLAS — FORGE · SEARCH AUTOCOMPLETE (Phase 23.1e carve)
// ============================================================
// Lift-and-shift of `wireSearchAutocomplete()`. PURE REFACTOR.
// Boundary: window._forgeSearchAutocomplete.attach({ local, recomputeFocus, toggleLock })
// ============================================================
(function () {
  'use strict';
  function attach(deps) {
    const local = deps.local;
    const recomputeFocus = deps.recomputeFocus;
    const toggleLock = deps.toggleLock;

        const inp     = document.getElementById('forge-status-search');
        const suggest = document.getElementById('forge-search-suggest');
        if (!inp || !suggest) return;

        function modeNodes() {
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
              // Also try alias hits via n.aka if present.
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
          // Sort: title-startsWith ranks above title-contains.
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
          // mousedown not click — so the input doesn't blur before
          // we read data-id.
          const item = ev.target.closest('.forge-search-suggest-item');
          if (!item) return;
          ev.preventDefault();
          const id = item.dataset.id;
          if (id) {
            // Phase 21L (2026-05-21) — go through the canonical lock
            // pipeline so the side-panel + lock-pill chrome updates,
            // not just lockedSet + recomputeFocus.
            try {
              if (local && local.lockedSet) {
                // Clear any prior locks first so a single click on a
                // suggestion produces a single-locked state (not an
                // additive multi-lock).
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
