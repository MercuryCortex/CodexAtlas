// ============================================================
// CODEX ATLAS — FORGE · VIEW-SETTINGS (Phase 23.1 carve)
// ============================================================
// Lift-and-shift of `wireViewSettings()`. PURE REFACTOR.
// Boundary: window._forgeViewSettings.attach({ drawFrame, local, rebuildForMode, recomputeFocus, renderer })
// ============================================================
(function () {
  'use strict';
  function attach(deps) {
    const drawFrame = deps.drawFrame;
    const local = deps.local;
    const rebuildForMode = deps.rebuildForMode;
    const recomputeFocus = deps.recomputeFocus;
    const renderer = deps.renderer;

        const btn   = document.getElementById('forge-viewset-btn');
        const panel = document.getElementById('forge-viewset-panel');
        if (!btn || !panel) return;
        // Phase 21AY (2026-05-23) — schema v7 (kept; legend reads tier
        // keys directly from same LS key). VIEW panel owns: layer
        // toggles, color theme, family order, node distribution.
        // LEGEND panel owns: tier filters + political-risk-flag toggle.
        const LS_KEY = 'forge.viewSettings.v7';
        const state = (() => {
          try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) return JSON.parse(raw);
          } catch (_) {}
          return {
            hulls: true, familyTitles: true,
            dividers: true, dividersConverging: false,
            guideRings: false,
            wires: true, sfx: true, map: false,
            reverseAge: false,
            // Phase 22-I (2026-05-24) — timeline layer toggles.
            tlBands: true, tlBandLabels: true,
            // Phase 22-M (2026-05-24) — dense-ticks toggle.
            tlDenseTicks: false,
          };
        })();
        // Defensive defaults — additive.
        if (typeof state.familyTitles       !== 'boolean') state.familyTitles       = true;
        if (typeof state.dividers           !== 'boolean') state.dividers           = true;
        if (typeof state.dividersConverging !== 'boolean') state.dividersConverging = false;
        if (typeof state.guideRings         !== 'boolean') state.guideRings         = false;
        if (typeof state.sfx                !== 'boolean') state.sfx                = true;
        if (typeof state.reverseAge         !== 'boolean') state.reverseAge         = false;
        if (typeof state.tlBands            !== 'boolean') state.tlBands            = true;
        if (typeof state.tlBandLabels       !== 'boolean') state.tlBandLabels       = true;
        if (typeof state.tlDenseTicks       !== 'boolean') state.tlDenseTicks       = false;
        function applyState() {
          document.body.classList.toggle('fv-hide-hulls',         !state.hulls);
          document.body.classList.toggle('fv-hide-family-titles', !state.familyTitles);
          const noDividers = !state.dividers && !state.dividersConverging;
          document.body.classList.toggle('fv-hide-dividers',      noDividers);
          document.body.classList.toggle('fv-hide-wires',         !state.wires);
          document.body.classList.toggle('fv-hide-map',           !state.map);
          document.body.classList.toggle('fv-hide-guide-rings',   !state.guideRings);
          // Phase 22-I — timeline-only layer toggles via body classes.
          // CSS in app.css hides .forge-timeline-bands and
          // .forge-timeline-band-labels under these classes.
          document.body.classList.toggle('fv-hide-tl-bands',       !state.tlBands);
          document.body.classList.toggle('fv-hide-tl-band-labels', !state.tlBandLabels);
          // Phase 22-M (2026-05-24) — dense-ticks toggle dispatched
          // to chrome via setBandStyle (it's a boolean key but the
          // setter coerces via in-key check; we set it directly).
          if (window.AtlasTimelineChrome
              && typeof window.AtlasTimelineChrome.setBandStyle === 'function') {
            try {
              // setBandStyle accepts only numeric values. For the
              // boolean denseTicks, use getBandStyle/mutate/refresh
              // via the resetBandStyle pattern — quickest: write
              // directly through a thin helper exposed below.
              const tlcs = window.AtlasTimelineChrome.getBandStyle();
              if (tlcs && tlcs.denseTicks !== state.tlDenseTicks) {
                window.AtlasTimelineChrome.setBandStyleBoolean &&
                  window.AtlasTimelineChrome.setBandStyleBoolean('denseTicks', !!state.tlDenseTicks);
              }
            } catch (_) {}
          }
          // Phase 21AS (2026-05-23) — source-tier filter. Update body
          // classes for CSS hooks AND build the active-tier set the
          // renderer will read in recomputeFocus. The wire-filter
          // is the real teeth: any edge whose source_tier is NOT in
          // the active set gets HIDDEN (state=2.0 → alpha 0). The
          // body classes are mostly for future legend chrome / side-
          // panel disclaimer styling.
          // Phase 21AY (2026-05-23) — tier + political-risk toggles
          // MOVED to the LEGEND panel (see wireLegend(): syncLegendTierUI).
          // The VIEW panel no longer touches `local._activeTiers` or
          // `local._showPoliticalRisk` — those flags are owned by the
          // legend now. VIEW's applyState only handles layer / theme /
          // distribution settings. tiersChanged below stays false from
          // this code path because none of the VIEW toggles affect
          // tier state.
          const tiersChanged         = false;
          // Phase 21AL (2026-05-23) — SFX toggle: when OFF, body
          // class signals the audio sync loop to force volume 0.
          document.body.classList.toggle('fv-hide-sfx',           !state.sfx);
          local._sfxEnabled = !!state.sfx;
          // Phase 21AM (2026-05-23) — reverseAge toggle: when ON, the
          // layout inverts the chronological mapping (rim = oldest
          // instead of center = oldest). The class is read by
          // rebuildForMode → radialWedgeLayout via the opts.reverseAge
          // flag. Toggling requires a full re-layout to take effect.
          const ageDirChanged = document.body.classList.contains('fv-reverse-age') !== !!state.reverseAge;
          document.body.classList.toggle('fv-reverse-age',         !!state.reverseAge);
          if (ageDirChanged && typeof rebuildForMode === 'function') {
            // Phase 22-J — preserveZoom for the reverse-age toggle
            // (wheel-only but harmless to pass; same rationale as
            // applyUxMode above — geometry shifts, dataset doesn't).
            try { rebuildForMode(local.mode.id, { preserveLocks: true, preserveZoom: true }); } catch (_) {}
          }
          // Push the divider mode into the layout layer.
          const newMode = state.dividersConverging ? 'long-centered'
                        : state.dividers           ? 'short'
                        : 'off';
          const modeChanged = (local._dividerMode !== newMode);
          local._dividerMode = newMode;
          if (modeChanged) {
            // Rebuild the gradient stops (they depend on mode) and
            // re-layout the geometry.
            if (typeof rebuildHullElements === 'function') {
              try { rebuildHullElements(); syncHulls(); } catch (_) {}
            }
          }
          // Mark each toggle row's checkbox state for CSS.
          panel.querySelectorAll('.forge-viewset-row[data-toggle]').forEach(row => {
            const key = row.dataset.toggle;
            row.classList.toggle('is-on', !!state[key]);
          });
          // Phase 21S (2026-05-22) — radio-style highlight for the
          // active color theme + family order rows.
          const ux = local.uxMode || DEFAULT_UX_MODE;
          panel.querySelectorAll('.forge-viewset-row[data-color]').forEach(row => {
            row.classList.toggle('is-on', row.dataset.color === ux.colorMode);
          });
          panel.querySelectorAll('.forge-viewset-row[data-order]').forEach(row => {
            row.classList.toggle('is-on', row.dataset.order === ux.orderMode);
          });
          panel.querySelectorAll('.forge-viewset-row[data-distribution]').forEach(row => {
            row.classList.toggle('is-on', row.dataset.distribution === (ux.distributionMode || 'organic'));
          });
          // Phase 21AS (2026-05-23) — when the source-tier set changes,
          // re-run recomputeFocus so edgeTargets pick up the tier-filter
          // (edges whose source_tier ∉ activeTiers get HIDDEN). Skip if
          // the renderer isn't mounted yet (first applyState fires before
          // mount completes).
          if (tiersChanged && typeof recomputeFocus === 'function' && local.mode && local.mode.edges) {
            try { recomputeFocus(); } catch (_) {}
            // Phase 21AX (2026-05-23) — also re-render the side panel
            // so its filtered connection list stays consistent with the
            // wheel. Without this, toggling politicalRisk would update
            // the wires but leave the side panel showing stale rows.
            if (typeof local._renderSidePanel === 'function') {
              try { local._renderSidePanel(); } catch (_) {}
            }
          }
          try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (_) {}
        }
        function open() {
          panel.classList.add('is-open');
          panel.setAttribute('aria-hidden', 'false');
          btn.setAttribute('aria-expanded', 'true');
        }
        function close() {
          panel.classList.remove('is-open');
          panel.setAttribute('aria-hidden', 'true');
          btn.setAttribute('aria-expanded', 'false');
        }
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          if (panel.classList.contains('is-open')) close(); else open();
        });
        panel.addEventListener('click', (ev) => {
          const row = ev.target.closest('.forge-viewset-row');
          if (!row || row.disabled) return;
          // Layer toggle (boolean).
          if (row.dataset.toggle) {
            const key = row.dataset.toggle;
            if (!(key in state)) return;
            state[key] = !state[key];
            // Phase 21AL (2026-05-23) — force a redraw on layer-toggle
            // change. The wires toggle in particular reads body.fv-hide-
            // wires inside drawFrame to zero idle alpha; without a draw
            // tick triggered here the canvas keeps showing the previous
            // frame until something else (hover, zoom, …) calls drawFrame.
            // Safe one-line: drawFrame is in the same closure scope.
            try { if (typeof drawFrame === 'function') setTimeout(drawFrame, 0); } catch (_) {}
            // Phase 21AK — separator modes are mutually exclusive
            // (short ↔ converging). Turning one ON forces the other OFF.
            if (key === 'dividers' && state.dividers) {
              state.dividersConverging = false;
            }
            if (key === 'dividersConverging' && state.dividersConverging) {
              state.dividers = false;
            }
            applyState();
            return;
          }
          // Phase 21S (2026-05-22) — color-theme radio.
          if (row.dataset.color) {
            const v = row.dataset.color;
            if (!COLOR_THEMES.hasOwnProperty(v)) return;
            if (local.uxMode.colorMode === v) return;   // no-op if already
            local.uxMode.colorMode = v;
            applyState();
            applyUxMode();
            return;
          }
          // Phase 21S (2026-05-22) — order radio.
          if (row.dataset.order) {
            const v = row.dataset.order;
            if (!ORDER_THEMES.hasOwnProperty(v)) return;
            if (local.uxMode.orderMode === v) return;
            local.uxMode.orderMode = v;
            applyState();
            applyUxMode();
            return;
          }
          // Phase 21AL (2026-05-23) — node distribution radio.
          if (row.dataset.distribution) {
            const v = row.dataset.distribution;
            if (!DISTRIBUTION_THEMES.hasOwnProperty(v)) return;
            if ((local.uxMode.distributionMode || 'organic') === v) return;
            local.uxMode.distributionMode = v;
            applyState();
            applyUxMode();
            return;
          }
        });
        document.addEventListener('click', (ev) => {
          if (!panel.classList.contains('is-open')) return;
          if (panel.contains(ev.target) || btn.contains(ev.target)) return;
          close();
        });
        document.addEventListener('keydown', (ev) => {
          if (ev.key === 'Escape' && panel.classList.contains('is-open')) close();
        });

        // ─── Phase 21T (2026-05-22) — criterion tooltips ──────────
        // Dwell ~1 s on a color/order radio → tooltip appears with
        // the criterion text. Reuses the legend-tooltip element so
        // we don't grow a second floating-box CSS surface.
        let tipEl = document.getElementById('forge-legend-tooltip');
        if (!tipEl) {
          // Defensive: if wireLegend hasn't created it (load-order),
          // make our own with the same class.
          tipEl = document.createElement('div');
          tipEl.className = 'forge-legend-tooltip';
          tipEl.id = 'forge-legend-tooltip';
          tipEl.setAttribute('aria-hidden', 'true');
          document.body.appendChild(tipEl);
        }
        let dwellTimer = 0;
        let dwellRow   = null;
        function getCriterion(row) {
          if (!row) return null;
          if (row.dataset.color && VIEWSET_CRITERIA.color[row.dataset.color])
            return VIEWSET_CRITERIA.color[row.dataset.color];
          if (row.dataset.order && VIEWSET_CRITERIA.order[row.dataset.order])
            return VIEWSET_CRITERIA.order[row.dataset.order];
          if (row.dataset.distribution && VIEWSET_CRITERIA.distribution[row.dataset.distribution])
            return VIEWSET_CRITERIA.distribution[row.dataset.distribution];
          return null;
        }
        function positionTooltip(row) {
          const rPanel = panel.getBoundingClientRect();
          const rRow   = row.getBoundingClientRect();
          const rTip   = tipEl.getBoundingClientRect();
          const margin = 8;
          // Default: place to the RIGHT of the panel, top-aligned with
          // the hovered row. Same mirror-clamp rules as the legend.
          let left = rPanel.right + margin;
          if (left + rTip.width + margin > window.innerWidth) {
            left = rPanel.left - rTip.width - margin;
          }
          if (left < margin) left = margin;
          let top = rRow.top;
          if (top + rTip.height + margin > window.innerHeight) {
            top = window.innerHeight - rTip.height - margin;
          }
          if (top < margin) top = margin;
          tipEl.style.left = left + 'px';
          tipEl.style.top  = top  + 'px';
        }
        function showTip(row) {
          const text = getCriterion(row);
          if (!text) return;
          // Phase 21U (2026-05-22) — innerHTML so color-name spans
          // render with their inline color. The criterion strings are
          // assembled from controlled constants in VIEWSET_CRITERIA;
          // no user input, so this is safe.
          tipEl.innerHTML = text;
          tipEl.style.display = '';
          tipEl.setAttribute('aria-hidden', 'false');
          positionTooltip(row);
        }
        function hideTip() {
          tipEl.setAttribute('aria-hidden', 'true');
          tipEl.style.display = 'none';
        }
        function clearDwell() {
          if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = 0; }
          dwellRow = null;
        }
        panel.addEventListener('mousemove', (ev) => {
          const row = ev.target.closest('.forge-viewset-row');
          if (!row || (!row.dataset.color && !row.dataset.order && !row.dataset.distribution)) {
            clearDwell();
            hideTip();
            return;
          }
          if (row === dwellRow) return;       // already counting this row
          clearDwell();
          hideTip();
          dwellRow = row;
          dwellTimer = setTimeout(() => {
            if (dwellRow === row) showTip(row);
          }, 1000);
        });
        panel.addEventListener('mouseleave', () => {
          clearDwell();
          hideTip();
        });

        applyState();
  }
  window._forgeViewSettings = { attach };
})();
