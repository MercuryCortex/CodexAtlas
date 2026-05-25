// ============================================================
// CODEX ATLAS — FORGE PUBLIC API installer
// ============================================================
//
// Phase 23.1j RETRY (2026-05-25 NIGHT) — fresh carve. FINAL of a-j.
//
// AST-VALIDATED DEPS: { applyZoomFloor, camera, local, rebuildForMode,
//   saveRuntimeState, syncModeButtonLabel }
// BOUNDARY CONTRACT:
//   window._forgeInstallPublicApi.attach({ ...6 deps... })
//
// Installs window._forge.* — the public API surface that external
// callers (other views, the URL router, devtools, etc.) use to
// drive forge programmatically.
// ============================================================
(function () {
  function attach({ applyZoomFloor, camera, local, rebuildForMode, saveRuntimeState, syncModeButtonLabel }) {
    window._forge = window._forge || {};
    window._forge.setClassFilter = function (modeId) {
      if (local.destroyed) return false;
      if (!modemod.isValidMode || !modemod.isValidMode(modeId)) return false;
      if (modeId === (local.mode && local.mode.id)) return true;
      try {
        rebuildForMode(modeId);
        syncModeButtonLabel(modeId);
        saveRuntimeState();
        return true;
      } catch (e) {
        console.warn('[forge] setClassFilter failed', e);
        return false;
      }
    };
    window._forge.getClassFilter = function () {
      return (local.mode && local.mode.id) || (modemod.defaultMode && modemod.defaultMode()) || 'deities';
    };
    window._forge.supportedClasses = function () {
      return (modemod.MODES || []).slice();
    };
    // Phase TL-2 Step 1 (2026-05-24) — layout selector. The
    // engine supports two layouts today: 'wheel' (radialWedgeLayout
    // — the default; what's shipped since Phase 20D) and 'timeline'
    // (timelineLayout — TL-1 module). Picking a layout triggers a
    // rebuildForMode at the current modeId, with locks preserved.
    // The Forge view stays the same view; only the geometry of
    // node placement changes. Future master views (Map, Star Map)
    // will register their own setLayout in their own _<view>.* API.
    window._forge.setLayout = function (layoutId) {
      if (local.destroyed) return false;
      const valid = (layoutId === 'wheel' || layoutId === 'timeline');
      if (!valid) {
        console.warn('[forge] unknown layoutId:', layoutId);
        return false;
      }
      if (layoutId === local.layoutId) return true;
      try {
        local.layoutId = layoutId;
        rebuildForMode(local.mode.id, { preserveLocks: true });
        // Emit so app-pill can update the LEFT pill label to
        // reflect the new master view (timeline vs wheel).
        document.dispatchEvent(new CustomEvent('codex:layout-changed', {
          detail: { layoutId }
        }));
        return true;
      } catch (e) {
        console.warn('[forge] setLayout failed', e);
        return false;
      }
    };
    window._forge.getLayout = function () {
      return local.layoutId || 'wheel';
    };
    // Phase TL-2 Step 6b (2026-05-24) — force a layout rebuild
    // at the CURRENT layoutId. Needed when a downstream module
    // (e.g. the timeline scale-preset picker) mutates state that
    // is only read at layout time. Same internal call setLayout
    // makes, but without the same-id early return.
    window._forge.relayout = function () {
      if (local.destroyed) return false;
      try {
        // Phase TL-2 Step 7b-fix3 (2026-05-24) — pass preserveZoom
        // so the band-density slider + scale-preset switch don't
        // reset the camera to the 20% default on every tick.
        rebuildForMode(local.mode.id, { preserveLocks: true, preserveZoom: true });
        return true;
      } catch (e) {
        console.warn('[forge] relayout failed', e);
        return false;
      }
    };
    // Phase 22-AD (2026-05-24) — FOCUS-RANGE API.
    // Zooms + pans the camera so that `yearLo` lands at the LEFT
    // edge of the viewport and `yearHi` lands at the RIGHT edge.
    // Used by the FOCUS button in the timeline bottombar. Works
    // for any active scale preset because it routes through the
    // preset's timelineYearToWorldX → world coords are correct
    // regardless of LIN / LOG / CMP.
    window._forge.focusTimelineRange = function (yearLo, yearHi) {
      if (local.destroyed) return false;
      if (local.layoutId !== 'timeline') return false;
      if (!isFinite(yearLo) || !isFinite(yearHi)) return false;
      if (yearLo >= yearHi) return false;
      const ENG = window.AtlasEngineLayout;
      if (!ENG || !ENG.timelineYearToWorldX) return false;
      const vp = local.lastSize;
      if (!vp || !vp.w) return false;
      const xRange = local.mode && local.mode.xRange;
      if (!xRange) return false;
      try {
        const wxLo = ENG.timelineYearToWorldX(yearLo, xRange);
        const wxHi = ENG.timelineYearToWorldX(yearHi, xRange);
        const worldSpan = Math.max(1e-6, wxHi - wxLo);
        // Leave a small horizontal margin so the endpoints don't
        // jam against the viewport edges (8% inset on each side).
        const usableW = vp.w * 0.92;
        const newScale = usableW / worldSpan;
        const midWorldX = (wxLo + wxHi) / 2;
        // Y stays at origin — timeline world is origin-centered.
        // camera.set() emits onChange internally so subscribers
        // (chrome, BG sync, etc.) re-fire automatically.
        camera.set({ centerX: midWorldX, centerY: 0, scale: newScale });
        // Refresh pan bounds + scale-bounds since the new scale
        // may sit above/below the fit-relative dead-lock zone.
        if (typeof applyZoomFloor === 'function') applyZoomFloor();
        return true;
      } catch (e) {
        console.warn('[forge] focusTimelineRange failed', e);
        return false;
      }
    };
  }

  window._forgeInstallPublicApi = { attach };
})();
