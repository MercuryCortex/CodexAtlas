// ============================================================
// CODEX ATLAS — FORGE · TIMELINE SCRUBBER (Phase 23.1a carve)
// ============================================================
//
// Filed: 2026-05-25 by watcher-claude-lead per
// AUDIT/2026-05-25-phase-23-decomposition-spec.md +
// AUDIT/2026-05-25-phase-23-1-carve-recon.md (Phase 23.1a carve).
//
// Lift-and-shift of `wireTimelineScrubber()` from
// src/js/views/forge.js:7589-7941 (353 LOC) into this module.
// PURE REFACTOR — no behavior change.
//
// Carve discovery (see carve-recon doc): the original spec named
// this "RENDERER" but the GPU plumbing was already in
// engine/renderer/webgpu.js. The largest realistic first carve is
// view-controller UI helpers. This is the FIRST such carve — the
// timeline scrubber's DOM + event wiring.
//
// Boundary contract:
//   window._forgeTimelineScrubber.attach({
//     local,              // forge.js mount state (read+write)
//     recomputeFocus,     // forge.js scope fn — re-run focus calc
//     saveRuntimeState,   // forge.js scope fn — persist to LS
//   })
//
// The attach() call sets up the slider DOM bindings, exposes
// `local.scrubber = { refreshBounds, refreshUI, applySavedTimeline }`
// (the existing public surface from inside forge.js — unchanged
// for rebuildForMode + LS-hydrate callers), and triggers a first
// refreshBounds() render.
//
// Why a window-global instead of an ES module: matches the
// existing forge.js / pantheon-v2.js convention (load via
// <script> tag, expose via window._foo). Avoids module-loader
// changes during the first carve.
// ============================================================
(function () {
  'use strict';

  function attach(deps) {
    const local             = deps.local;
    const recomputeFocus    = deps.recomputeFocus;
    const saveRuntimeState  = deps.saveRuntimeState;

    const slider  = document.getElementById('forge-scrub-slider');
    if (!slider) return;
    const track   = slider.querySelector('.forge-scrub-track');
    const rangeEl = slider.querySelector('#forge-scrub-range');
    const inEl    = slider.querySelector('#forge-scrub-in-thumb');
    const ctrEl   = slider.querySelector('#forge-scrub-center-thumb');
    const outEl   = slider.querySelector('#forge-scrub-out-thumb');
    const yearZeroEl = slider.querySelector('#forge-scrub-year-zero');
    const inBox      = document.getElementById('forge-scrub-in');
    const outBox     = document.getElementById('forge-scrub-out');
    const presentBox = document.getElementById('forge-scrub-present');

    // Derive [minYear, maxYear] from the current mode's nodes.
    // Negative = BCE per the vault convention.
    // Field naming: the YAML uses kebab-case (date-start,
    // date-attested-earliest, etc.) but build_data.py normalizes
    // to underscored snake_case (date_earliest, date_latest) in
    // data.js. Read the normalized form first, fall back to raw
    // for safety.
    function deriveBounds() {
      const nodes = local.mode && local.mode.nodes;
      if (!nodes || !nodes.length) return null;
      let lo = Infinity, hi = -Infinity;
      for (const n of nodes) {
        const candidates = [
          n.date_earliest, n.date_latest,                // normalized
          n['date-start'],  n['date-end'],               // raw fallback
          n['date-attested-earliest'], n['date-attested-latest'],
          n['originating-date'], n['date-composed-earliest'],
          n['date-composed-latest'], n['date-formulated'],
          n['date-founded'], n['date-built-earliest'],
          n['date-built-latest'], n['date-birth'], n['date-death'],
        ];
        for (const v of candidates) {
          if (v == null) continue;
          const num = typeof v === 'number' ? v : parseInt(v, 10);
          if (!isFinite(num)) continue;
          if (num < lo) lo = num;
          if (num > hi) hi = num;
        }
      }
      if (!isFinite(lo) || !isFinite(hi) || lo >= hi) return null;
      // Sanity clamp. Some nodes carry cosmological / pre-history
      // dates (e.g., date_earliest = -1e9 for Big Bang / Earth
      // formation references in cosmogonic-motif nodes). Those
      // skew the timeline so far that the human-history span is
      // a hairline.
      //
      // Phase 11 (2026-05-20):
      //   - HIST_LO is the OLDEST entry's clamped lower bound
      //     (no fixed floor; -15000 was just a safety net and we
      //     still keep it for cosmogonic outliers).
      //   - HIST_HI is TODAY'S year — the future ceiling is now
      //     pinned to "now", not an arbitrary 3000. Past-only
      //     timeline; nothing in the chart is in the future of
      //     the user.
      const HIST_LO = -15000;                    // 15,000 BCE safety floor
      const HIST_HI = new Date().getFullYear();  // today (Phase 11)
      if (lo < HIST_LO) lo = HIST_LO;
      if (hi > HIST_HI) hi = HIST_HI;
      // Round outward to nice century-edges so the readout looks
      // tidy. -3142 → -3200. Phase 11: do NOT round PAST today.
      // If the century-ceiling would exceed HIST_HI (e.g. 2024 →
      // 2100), clamp back to HIST_HI. The upper bound is "now",
      // not "next century."
      const lopad = Math.floor(lo / 100) * 100;
      let   hipad = Math.ceil(hi / 100) * 100;
      if (hipad > HIST_HI) hipad = HIST_HI;
      return [lopad, hipad];
    }

    // Phase 5B M-F3 (2026-05-20) — refreshBounds is the per-mode
    // entry point. wireTimelineScrubber runs ONCE at boot to set
    // up DOM + handlers + a first refresh; rebuildForMode calls
    // local.scrubber.refreshBounds() at the end to re-derive
    // lo/hi for the new mode + preserve-or-clamp the user's
    // in/out/center. Preserves user state when it fits the new
    // mode's date span; clamps to nearest valid bound otherwise.
    // Phase 21B (2026-05-21) — cosmetic floor on the timeline's
    // left bracket. The vault has a handful of outlier deities
    // older than 9000 BCE (Aboriginal Dreamtime, San Bushmen)
    // plus one YAML bug (rishabha-jain at -999,999,999). They
    // distort the slider's effective range. John's directive:
    // cap the visible LEFT bracket at -9000 BCE and display
    // "+9000 BCE" when the IN handle is fully left, meaning
    // "includes every deity dated before that too". Wiring is
    // untouched — the filter still passes every deity whose
    // date is <= outDate when inDate is at the cosmetic floor.
    const TIMELINE_FLOOR_BCE = -9000;
    function refreshBounds() {
      const b = deriveBounds();
      if (!b) {
        slider.style.display = 'none';
        if (inBox)      inBox.style.display = 'none';
        if (outBox)     outBox.style.display = 'none';
        if (presentBox) presentBox.style.display = 'none';
        local.timeline = null;
        return;
      }
      let [lo, hi] = b;
      // Cosmetic floor: never let the slider's left edge go
      // below TIMELINE_FLOOR_BCE. The "real" minimum is kept
      // around in case any future code needs it.
      if (lo < TIMELINE_FLOOR_BCE) lo = TIMELINE_FLOOR_BCE;
      const prev = local.timeline;
      const inDate     = prev && typeof prev.inDate     === 'number'
        ? Math.max(lo, Math.min(hi, prev.inDate))   : lo;
      const outDate    = prev && typeof prev.outDate    === 'number'
        ? Math.max(inDate, Math.min(hi, prev.outDate)) : hi;
      const centerDate = prev && typeof prev.centerDate === 'number'
        ? Math.max(inDate, Math.min(outDate, prev.centerDate))
        : Math.floor((inDate + outDate) / 2);
      local.timeline = { lo, hi, inDate, outDate, centerDate };
      // Re-show in case a previous mode had no dated nodes.
      slider.style.display = '';
      if (inBox)      inBox.style.display = '';
      if (outBox)     outBox.style.display = '';
      if (presentBox) presentBox.style.display = '';
      refreshUI();
    }

    // Date -> fraction along track (0..1). Reads from
    // local.timeline (NOT closure-local lo/hi) so it picks up
    // the current mode's bounds after refreshBounds().
    function dateToFrac(d) {
      const tl = local.timeline;
      if (!tl) return 0;
      return (d - tl.lo) / (tl.hi - tl.lo);
    }
    function fracToDate(f) {
      const tl = local.timeline;
      if (!tl) return 0;
      f = Math.max(0, Math.min(1, f));
      return Math.round(tl.lo + f * (tl.hi - tl.lo));
    }
    function formatYear(y) {
      if (y < 0) return Math.abs(y) + ' BCE';
      if (y === 0) return '0';
      return y + ' CE';
    }
    function refreshUI() {
      const t = local.timeline;
      if (!t) return;
      const inF  = dateToFrac(t.inDate)     * 100;
      const outF = dateToFrac(t.outDate)    * 100;
      const ctrF = dateToFrac(t.centerDate) * 100;
      inEl.style.left   = inF  + '%';
      outEl.style.left  = outF + '%';
      ctrEl.style.left  = ctrF + '%';
      rangeEl.style.left  = inF + '%';
      rangeEl.style.width = (outF - inF) + '%';
      // Phase 11 — Year-0 marker. Visible only when the bounds
      // straddle year 0 (almost always, but defensive). Positioned
      // by the same dateToFrac map the thumbs use; CSS makes it
      // a faint grey tick that doesn't compete with the thumbs.
      if (yearZeroEl) {
        if (t.lo < 0 && t.hi > 0) {
          const zeroF = dateToFrac(0) * 100;
          yearZeroEl.style.left    = zeroF + '%';
          yearZeroEl.style.display = '';
        } else {
          yearZeroEl.style.display = 'none';
        }
      }
      // 4-box readouts. Each box gets just the year (no
      // separator) so it stays compact at fixed height.
      // Phase 21B (2026-05-21) — IN box shows "+9000 BCE" when
      // the handle is at the cosmetic floor: the "+" signals
      // that everything earlier is also included.
      // Phase 21R (2026-05-22) — IN / OUT are now <input>s. Use
      // .value for them; skip the write while the user is
      // actively typing (document.activeElement check) so we
      // don't clobber a partial entry. PRESENT stays a <div>
      // (read-only playhead readout) — uses .textContent.
      if (inBox && document.activeElement !== inBox) {
        const atFloor = (t.inDate <= t.lo + 0.5);
        inBox.value = atFloor
          ? ('+' + Math.abs(t.lo) + ' BCE')
          : formatYear(t.inDate);
      }
      if (outBox && document.activeElement !== outBox) {
        outBox.value = formatYear(t.outDate);
      }
      if (presentBox) presentBox.textContent = formatYear(t.centerDate);
    }

    // Phase 5B M-F3 (2026-05-20) — apply LS-saved timeline state
    // (clamped to current mode's lo/hi) + refreshUI. Called once
    // at boot AFTER wireTimelineScrubber + after initial
    // rebuildForMode populates local.timeline.lo/hi. Safe when
    // saved is null or saved.timeline missing.
    function applySavedTimeline(saved) {
      if (!saved || !local.timeline) return;
      const tl = local.timeline;
      const lo = tl.lo, hi = tl.hi;
      if (typeof saved.in === 'number')     tl.inDate     = Math.max(lo, Math.min(hi, saved.in));
      if (typeof saved.out === 'number')    tl.outDate    = Math.max(tl.inDate, Math.min(hi, saved.out));
      if (typeof saved.center === 'number') tl.centerDate = Math.max(tl.inDate, Math.min(tl.outDate, saved.center));
      refreshUI();
    }

    // Drag state. Pointer events on track + thumbs; track captures
    // so dragging outside the track still updates.
    let dragHandle = null;
    function onPointerDown(ev) {
      const handle = ev.target && ev.target.dataset && ev.target.dataset.handle;
      if (!handle) return;
      dragHandle = handle;
      track.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    }
    function onPointerMove(ev) {
      if (!dragHandle) return;
      const rect = track.getBoundingClientRect();
      const frac = (ev.clientX - rect.left) / rect.width;
      const date = fracToDate(frac);
      const t = local.timeline;
      let rangeChanged = false;
      if (dragHandle === 'in') {
        const newIn = Math.min(date, t.outDate - 1);
        if (newIn !== t.inDate) { t.inDate = newIn; rangeChanged = true; }
        if (t.centerDate < t.inDate) t.centerDate = t.inDate;
      } else if (dragHandle === 'out') {
        const newOut = Math.max(date, t.inDate + 1);
        if (newOut !== t.outDate) { t.outDate = newOut; rangeChanged = true; }
        if (t.centerDate > t.outDate) t.centerDate = t.outDate;
      } else if (dragHandle === 'center') {
        t.centerDate = Math.max(t.inDate, Math.min(t.outDate, date));
        // Center scrub doesn't re-filter (no IN/OUT change), just
        // updates the playhead readout.
      }
      refreshUI();
      // Filter wiring: when IN or OUT change, re-run focus so
      // the date-range-dim is applied to nodes outside the
      // range. Center moves don't change the filter.
      //
      // Phase 2B B4 (2026-05-20) — rAF-coalesce the recompute.
      // Scrubber drag fires pointermove at up to 120Hz; without
      // this gate `recomputeFocus` runs synchronously per move,
      // burning the JS thread on full-buffer fade-target writes.
      // Mirrors the setHoverId pattern from commit 98bc609.
      // refreshUI (cheap DOM text updates) stays synchronous so
      // drag feedback feels immediate.
      if (rangeChanged) {
        local.scrubPendingChange = true;
        if (!local.scrubRafId) {
          local.scrubRafId = requestAnimationFrame(() => {
            local.scrubRafId = 0;
            local.scrubPendingChange = false;
            if (local.destroyed) return;
            recomputeFocus();
          });
        }
      }
    }
    function onPointerUp(ev) {
      if (!dragHandle) return;
      dragHandle = null;
      try { track.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      // Phase 5B M-F2 (2026-05-20) — persist timeline state on
      // drag release. Saves all three (mode + timeline + lockedSet).
      saveRuntimeState();
    }
    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup',   onPointerUp);
    track.addEventListener('pointercancel', onPointerUp);

    // ─── Phase 21R (2026-05-22) — typable date boxes ──────────
    // Accept several formats and clamp to the current mode's
    // [lo, hi]. After commit: write back canonical formatted
    // text, push to local.timeline, re-position the thumb, and
    // re-run the filter (recomputeFocus). Cancel on Escape.
    //
    // Parse rules — case-insensitive, whitespace-tolerant:
    //   "1500 BCE" / "1500 BC" / "-1500"   ->  -1500
    //   "200 CE"   / "200 AD"  / "+200" / "200"  ->   200
    //   "0"  ->  0
    //   empty / unparseable -> reject, restore prior text
    function parseYearText(raw) {
      if (raw == null) return null;
      const s = String(raw).trim().toLowerCase();
      if (!s) return null;
      // "+9000 bce" (timeline floor cosmetic) — strip leading +
      // so the BCE branch below handles it as a magnitude.
      const stripped = s.replace(/^\+\s*/, '');
      const bceMatch = stripped.match(/^(\d+)\s*(?:bce|bc)$/);
      if (bceMatch) return -parseInt(bceMatch[1], 10);
      const ceMatch  = stripped.match(/^(\d+)\s*(?:ce|ad)$/);
      if (ceMatch)   return  parseInt(ceMatch[1], 10);
      // Bare integer (signed or unsigned). Negative = BCE.
      const num = parseInt(stripped, 10);
      if (Number.isFinite(num) && /^-?\d+$/.test(stripped)) return num;
      return null;
    }
    function commitDateBox(boxEl, kind) {
      const t = local.timeline;
      if (!t || !boxEl) return;
      const raw = boxEl.value;
      const parsed = parseYearText(raw);
      if (parsed == null) {
        // Reject — restore current displayed value.
        refreshUI();
        return;
      }
      // Clamp to bounds + maintain in < out ordering.
      let y = parsed;
      if (y < t.lo) y = t.lo;
      if (y > t.hi) y = t.hi;
      if (kind === 'in') {
        if (y >= t.outDate) y = t.outDate - 1;
        t.inDate = y;
        if (t.centerDate < t.inDate) t.centerDate = t.inDate;
      } else { // 'out'
        if (y <= t.inDate) y = t.inDate + 1;
        t.outDate = y;
        if (t.centerDate > t.outDate) t.centerDate = t.outDate;
      }
      refreshUI();
      if (!local.destroyed) {
        recomputeFocus();
        saveRuntimeState();
      }
    }
    function wireDateBox(boxEl, kind) {
      if (!boxEl) return;
      // Select-all on focus so a click is "ready to retype".
      boxEl.addEventListener('focus', () => { boxEl.select(); });
      boxEl.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter')  { ev.preventDefault(); boxEl.blur(); }
        if (ev.key === 'Escape') { ev.preventDefault(); refreshUI(); boxEl.blur(); }
      });
      boxEl.addEventListener('blur', () => commitDateBox(boxEl, kind));
    }
    wireDateBox(inBox,  'in');
    wireDateBox(outBox, 'out');

    // Phase 5B M-F3 (2026-05-20) — expose the per-mode refresh
    // entry on `local.scrubber` so rebuildForMode + LS-hydrate
    // can drive it. Each call re-derives lo/hi for the current
    // mode + clamps any preserved in/out/center to the new
    // bounds + refreshes UI.
    local.scrubber = {
      refreshBounds,
      refreshUI,
      applySavedTimeline,
    };

    // First render — populates local.timeline from the current
    // mode's bounds + paints the UI.
    refreshBounds();
  }

  window._forgeTimelineScrubber = { attach };
})();
