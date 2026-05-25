// ============================================================
// CODEX ATLAS — FORGE · LEGEND PANEL (Phase 23.1b carve)
// ============================================================
//
// Filed: 2026-05-25 by watcher-claude-lead.
// Lift-and-shift of `wireLegend()` from src/js/views/forge.js
// (formerly lines 6057-6338). PURE REFACTOR — no behavior change.
//
// Owns the color-code legend panel: 7 wire-bucket rows + 5
// source-tier toggle rows + political-risk toggle row, hover
// tooltips with viewport-clamped positioning, click-outside-
// to-close, LS persistence of tier-state under
// `forge.viewSettings.v7`, and the body-class toggles
// `fv-hide-tier-t{1..5}` + `fv-show-political-risk`.
//
// Boundary contract:
//   window._forgeLegend.attach({
//     local,            // forge.js mount state (read+write)
//     recomputeFocus,   // scope fn — re-run focus calc
//   })
// ============================================================
(function () {
  'use strict';

  function attach(deps) {
    const local          = deps.local;
    const recomputeFocus = deps.recomputeFocus;

        const btn     = document.getElementById('forge-legend-btn');
        const panel   = document.getElementById('forge-legend-panel');
        const tooltip = document.getElementById('forge-legend-tooltip');
        if (!btn || !panel || !tooltip) return;
        // Per-bucket meta. Order = BUCKET_ORDER (shader bucket_index).
        // `title` is the row label; `body` is the explainer-tooltip
        // text (what it means + our criteria for using it).
        const BUCKETS = [
          { key: 'transmission',  param: 'active_color_transmission', title: 'Transmission',
            body: 'One tradition adopted from another. Documented contact, dated borrowing, or direct lineage. Use when there is evidence A INFLUENCED B (texts cite, archaeology, missionary record, trade-route attestation).' },
          { key: 'parallel',      param: 'active_color_parallel',     title: 'Parallel',
            body: 'Independent same-shape phenomena across traditions with NO documented contact. Use when two cultures separately arrived at structurally identical motif/figure/practice — strongest when geographically isolated.' },
          { key: 'association',   param: 'active_color_association',  title: 'Association',
            body: 'Co-appearance in the same texts, sites, or rituals without one causing the other. Use when items recur together in primary sources but the relationship is contextual, not generative.' },
          { key: 'kinship',       param: 'active_color_kinship',      title: 'Kinship',
            body: 'Family relationships INSIDE a pantheon or tradition: parent-child, sibling, consort. Use only for in-tradition genealogy.' },
          { key: 'attestation',   param: 'active_color_attestation',  title: 'Attestation',
            body: 'Source → claim. One node is a textual or archaeological witness to another. Use when a text/inscription/artifact attests to a deity, practice, or event.' },
          { key: 'polemic',       param: 'active_color_polemic',      title: 'Polemic',
            body: 'Contested or contradicting relationship. One tradition denies, refutes, or polemicizes against another. Use for theological disputes, heresies, refutations.' },
          { key: 'fusion',        param: 'active_color_fusion',       title: 'Fusion',
            body: 'Two figures or practices merged into one new identity over time. Use when historical blending produced a combined entity that absorbs both originals — e.g. Serapis = Osiris + Apis; Hermes Trismegistus = Hermes + Thoth.' },
        ];
        // Build rows ONCE. Colors read from local.params so the
        // legend stays in sync if PARAM_DEFAULTS ever changes.
        const rowsHtml = BUCKETS.map(b => {
          const hex = (local.params && local.params[b.param]) || '#999999';
          return '<div class="forge-legend-row" data-bucket="' + b.key + '">'
            + '<span class="forge-legend-swatch" style="background:' + hex + '"></span>'
            + '<span class="forge-legend-name">' + b.title + '</span>'
            + '</div>';
        }).join('');
        // Phase 21AT (2026-05-23) — Source-tier legend section. The
        // five tiers from CODEX §IV. Each row reuses the same vs-tier-
        // pill styling as the side-panel and view-settings so the
        // vocabulary is visually identical everywhere. Hover-tooltip
        // body explains the criterion + example author / school.
        const TIERS = [
          { key: 't1', label: 'T1',
            title: 'Mainstream',
            body: 'Peer-reviewed mainstream scholarship. Standard academic consensus. The silent default — most edges in the atlas are T1.' },
          { key: 't2', label: 'T2',
            title: 'Academic minority',
            body: 'Contested but legitimate position within the field. Defended in peer-reviewed work by a minority of credentialed scholars. Disagreement is real but inside the academy.' },
          { key: 't3', label: 'T3',
            title: 'Alternative school',
            body: 'Serious, well-researched fringe that mainstream archaeology rejects but engages — Hancock-class. Author cites primary evidence; rejected on interpretation, not on fabrication.' },
          { key: 't4', label: 'T4',
            title: 'Popular claim, rejected',
            body: 'Popular pseudoarchaeology with broad audience reach but no peer-reviewed defense — Sitchin / von Däniken class. Atlas includes for in-graph rebuttal of widely-known claims.' },
          { key: 't5', label: 'T5',
            title: 'High-risk · disclaimer required',
            body: 'Claims with political-risk implications (antisemitic / racist conspiracy adjacency, ethno-nationalist mobilization) — Icke / Evola-political class. OFF by default in view-settings. Opt-in only; tooltip leads with disclaimer.' },
        ];
        // Phase 21AY (2026-05-23) — tier rows are now INTERACTIVE
        // toggles, not just legend swatches. The VIEW panel's tier
        // section has been removed; the tier vocabulary lives where
        // it's documented (the legend) and the filter ops on it
        // directly. Render as <button> with the same .vs-check the
        // VIEW panel toggles use; clicking flips the state in
        // local._tierState + persists to LS + re-runs recomputeFocus.
        const tierRowsHtml = TIERS.map(t => (
          '<button class="forge-legend-row forge-legend-row--tier forge-legend-row--toggle" data-tier-key="' + t.key + '" data-tier-uc="' + t.label + '">'
          + '<span class="vs-check"></span>'
          + '<span class="forge-legend-swatch vs-tier-pill vs-tier-pill--' + t.key + '" style="background:transparent">' + t.label + '</span>'
          + '<span class="forge-legend-name">' + t.title + '</span>'
          + '</button>'
        )).join('');
        // Phase 21AX (2026-05-23) — CODEX v1.2 §IV.5 — political-risk
        // toggle is ORTHOGONAL to tier. Now lives next to the tier
        // section in the legend window. Same visual treatment as the
        // ⛔ BLACK ALERT row had in VIEW. Hover surfaces the orthogonal-
        // axes explainer.
        const politicalRiskBody = 'Political-risk-flag is ORTHOGONAL to tier. It marks content with documented real-world harm-wiring (ethno-nationalist reception, antisemitic networks, racial-hierarchy mobilization) — independently of how mainstream-accepted the claim is. A T1 mainstream-academic claim about a politically-dangerous movement gets the flag if the content is harm-wired. OFF by default; requires explicit opt-in. See CODEX §IV.5.';
        panel.innerHTML = ''
          + '<div class="forge-legend-section">Wire color · type of connection</div>'
          + rowsHtml
          + '<div class="forge-legend-divider"></div>'
          + '<div class="forge-legend-section">Source tier · click to toggle</div>'
          + tierRowsHtml
          + '<div class="forge-legend-divider"></div>'
          + '<div class="forge-legend-section">High-alert · orthogonal to tier</div>'
          + '<button class="forge-legend-row forge-legend-row--toggle forge-legend-row--black-alert" data-political-risk="1">'
          +   '<span class="vs-check"></span>'
          +   '<span class="forge-legend-swatch vs-alert-badge">⛔</span>'
          +   '<span class="forge-legend-name">Show political-risk content</span>'
          + '</button>';
        // Map for fast lookup on hover.
        const bodyByKey = Object.create(null);
        for (const b of BUCKETS) bodyByKey[b.key] = b.body;
        const bodyByTier = Object.create(null);
        for (const t of TIERS) bodyByTier[t.key] = t.body;

        // Phase 21AY (2026-05-23) — interactive toggles in the legend.
        // The legend now OWNS the tier-filter + political-risk toggles
        // (moved from VIEW panel). The legend's tier rows are buttons;
        // clicking flips the corresponding flag in `local._tierState`
        // (and `local._showPoliticalRisk` for the orthogonal row), then
        // triggers recomputeFocus + side-panel re-render. LS persistence
        // shares the v7 schema from the VIEW panel so an upgrade from
        // VIEW-tier-toggles to LEGEND-tier-toggles is seamless.
        const LEGEND_LS_KEY = 'forge.viewSettings.v7';
        function readTierState() {
          let s = {};
          try {
            const raw = localStorage.getItem(LEGEND_LS_KEY);
            if (raw) s = JSON.parse(raw) || {};
          } catch (_) {}
          return {
            T1: typeof s.tierT1 === 'boolean' ? s.tierT1 : true,
            T2: typeof s.tierT2 === 'boolean' ? s.tierT2 : true,
            T3: typeof s.tierT3 === 'boolean' ? s.tierT3 : true,
            T4: typeof s.tierT4 === 'boolean' ? s.tierT4 : true,
            T5: typeof s.tierT5 === 'boolean' ? s.tierT5 : false,
            politicalRisk: typeof s.politicalRisk === 'boolean' ? s.politicalRisk : false,
          };
        }
        function writeTierState(ts) {
          try {
            const raw = localStorage.getItem(LEGEND_LS_KEY);
            const s = raw ? JSON.parse(raw) : {};
            s.tierT1 = !!ts.T1;
            s.tierT2 = !!ts.T2;
            s.tierT3 = !!ts.T3;
            s.tierT4 = !!ts.T4;
            s.tierT5 = !!ts.T5;
            s.politicalRisk = !!ts.politicalRisk;
            localStorage.setItem(LEGEND_LS_KEY, JSON.stringify(s));
          } catch (_) {}
        }
        function syncLegendTierUI() {
          const ts = readTierState();
          panel.querySelectorAll('.forge-legend-row--tier').forEach(row => {
            const uc = row.getAttribute('data-tier-uc') || '';
            row.classList.toggle('is-on', !!ts[uc]);
          });
          const prRow = panel.querySelector('.forge-legend-row[data-political-risk]');
          if (prRow) prRow.classList.toggle('is-on', !!ts.politicalRisk);
          // Push to the engine and refresh filtered state.
          const tiers = new Set();
          if (ts.T1) tiers.add('T1');
          if (ts.T2) tiers.add('T2');
          if (ts.T3) tiers.add('T3');
          if (ts.T4) tiers.add('T4');
          if (ts.T5) tiers.add('T5');
          local._activeTiers       = tiers;
          local._activeTiersSig    = [...tiers].sort().join(',') + '|' + (ts.politicalRisk ? 'PR' : '');
          local._showPoliticalRisk = !!ts.politicalRisk;
          // Body classes for any CSS that keys off them (none yet but
          // future legend/SFW chrome will).
          document.body.classList.toggle('fv-hide-tier-t1', !ts.T1);
          document.body.classList.toggle('fv-hide-tier-t2', !ts.T2);
          document.body.classList.toggle('fv-hide-tier-t3', !ts.T3);
          document.body.classList.toggle('fv-hide-tier-t4', !ts.T4);
          document.body.classList.toggle('fv-hide-tier-t5', !ts.T5);
          document.body.classList.toggle('fv-show-political-risk', !!ts.politicalRisk);
        }
        // Click delegation on the legend panel.
        panel.addEventListener('click', (e) => {
          const tierRow = e.target.closest('.forge-legend-row--tier');
          const prRow   = e.target.closest('.forge-legend-row[data-political-risk]');
          if (!tierRow && !prRow) return;
          e.stopPropagation();
          const ts = readTierState();
          if (tierRow) {
            const uc = tierRow.getAttribute('data-tier-uc');
            if (!uc) return;
            ts[uc] = !ts[uc];
          } else {
            ts.politicalRisk = !ts.politicalRisk;
          }
          writeTierState(ts);
          syncLegendTierUI();
          // Hide the hover tooltip — the row's just been clicked,
          // tooltip is stale until the next dwell.
          hideTooltip();
          // Re-run focus + side panel so filtered wires + side-panel
          // rows refresh immediately.
          if (typeof recomputeFocus === 'function' && local.mode && local.mode.edges) {
            try { recomputeFocus(); } catch (_) {}
          }
          if (typeof local._renderSidePanel === 'function') {
            try { local._renderSidePanel(); } catch (_) {}
          }
        });
        // Hover tooltip body for the political-risk row.
        bodyByTier['__politicalRisk'] = politicalRiskBody;
        // Initial sync — read LS + apply check state + push to engine
        // BEFORE the first recomputeFocus the mount flow runs.
        syncLegendTierUI();

        let isOpen = false;
        function openPanel()  {
          isOpen = true;
          btn.setAttribute('aria-expanded', 'true');
          panel.setAttribute('aria-hidden', 'false');
          panel.style.display = '';
        }
        function closePanel() {
          isOpen = false;
          btn.setAttribute('aria-expanded', 'false');
          panel.setAttribute('aria-hidden', 'true');
          panel.style.display = 'none';
          hideTooltip();
        }
        closePanel();

        btn.addEventListener('click', () => {
          if (isOpen) closePanel(); else openPanel();
        });

        // Row-hover → explainer tooltip.
        // Phase 15 (2026-05-21) — viewport-clamped positioning. Default
        // placement is to the right of the legend panel, top-aligned
        // with the hovered row. But the tooltip can be tall (200+ px),
        // and the legend opens NEAR the bottom of the screen — so the
        // default position often overflowed BELOW the viewport. Fix:
        // measure the tooltip's actual height after rendering content,
        // then clamp into [margin, viewport - tooltipHeight - margin].
        // Same for the horizontal axis: if the right side would
        // overflow, place it to the LEFT of the panel instead.
        function showTooltipFor(row) {
          // Phase 21AT (2026-05-23) — the legend now has two row classes:
          // bucket rows (data-bucket) and tier rows (data-tier-key).
          // Phase 21AY (2026-05-23) — third row class: political-risk
          // toggle (data-political-risk). Same tooltip element + clamp
          // logic; only the body lookup differs.
          const bKey = row.getAttribute('data-bucket');
          const tKey = row.getAttribute('data-tier-key');
          const pr   = row.getAttribute('data-political-risk');
          const body = bKey ? bodyByKey[bKey]
                     : tKey ? bodyByTier[tKey]
                     : pr   ? bodyByTier['__politicalRisk']
                     : null;
          if (!body) return;
          tooltip.textContent = body;
          // Reveal first so we can measure dimensions.
          tooltip.style.display = '';
          tooltip.setAttribute('aria-hidden', 'false');
          const rPanel = panel.getBoundingClientRect();
          const rRow   = row.getBoundingClientRect();
          const rTip   = tooltip.getBoundingClientRect();
          const margin = 8;
          // Horizontal: default to the right of the panel; if that
          // would overflow the right edge, switch to the left of the
          // panel; clamp to viewport in either case.
          let left = rPanel.right + margin;
          if (left + rTip.width + margin > window.innerWidth) {
            left = rPanel.left - rTip.width - margin;
          }
          if (left < margin) left = margin;
          // Vertical: top-align with the hovered row, then clamp so
          // the tooltip fits inside the viewport. If the row sits near
          // the bottom, the tooltip slides up until its bottom touches
          // the viewport bottom (minus margin).
          let top = rRow.top;
          if (top + rTip.height + margin > window.innerHeight) {
            top = window.innerHeight - rTip.height - margin;
          }
          if (top < margin) top = margin;
          tooltip.style.left = left + 'px';
          tooltip.style.top  = top  + 'px';
        }
        function hideTooltip() {
          tooltip.setAttribute('aria-hidden', 'true');
          tooltip.style.display = 'none';
        }
        panel.addEventListener('mouseover', (e) => {
          const row = e.target.closest('.forge-legend-row');
          if (row) showTooltipFor(row);
        });
        panel.addEventListener('mouseleave', hideTooltip);

        // Click outside → close.
        document.addEventListener('click', (e) => {
          if (!isOpen) return;
          if (e.target === btn || btn.contains(e.target)) return;
          if (panel.contains(e.target)) return;
          closePanel();
        });
  }

  window._forgeLegend = { attach };
})();
