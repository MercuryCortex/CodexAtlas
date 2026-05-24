# Session HANDOFF — 2026-05-24 evening

**Read this FIRST on resume.** Reason: an agent (me) burned three iterations on a basic bottom-bar height mismatch by patching inline styles instead of using the canonical CSS class. John invoked the SEVERITY DOGMA (see `HOW-WE-WORK.md` §5 cardinal rule #7). Three strikes ⇒ termination. This handoff exists so the next agent can pick up cold without repeating my mistake.

---

## 1. The active problem (when you resume)

**Bottom-right toolbar in Timeline view is visually wrong.**

The four LIN / LOG / LOG-R / CMP segment buttons and the DENSITY 0.9× ▾ button render **~2–3 px taller** than the canonical buttons on the bottom-left row (LEGEND, VIEW, FX, STYLE, #, 22 % zoom, +9000 BCE, 2000 CE).

John has a screenshot proving it. He's asked five times. Three attempts shipped — all inline-style tweaks — none worked.

**Root cause:** my toolbar was created in JS with `Object.assign(el.style, {...})` blocks that *duplicate* `.forge-fxpanel-btn`'s declarations. That can never be pixel-identical because:
- `box-sizing: content-box` (default) adds the 1 px border on top of any explicit `height`.
- `line-height` defaults differ between browsers and the explicit-height path skips line-height entirely.
- The first time someone edits `.forge-fxpanel-btn`'s CSS, the toolbar will drift.

**The correct fix (NOT YET SHIPPED — your job):**

Use the actual CSS class. Do not duplicate it in JS. Concretely:

1. Each of `LIN`, `LOG`, `LOG-R`, `CMP`, `DENSITY` becomes a `<button class="forge-fxpanel-btn">…</button>`.
2. The container becomes a class-less `display: inline-flex` wrapper at `right: 14 bottom: 14`.
3. Active-segment styling is a CSS modifier — e.g. `.forge-fxpanel-btn[aria-pressed="true"] { border-color: var(--gold); color: var(--gold-1); background: rgba(212,165,90,0.18); font-weight: 600; }` — added once in `src/styles/app.css`.
4. No inline `Object.assign(el.style, {...})` for sizing. Inline styles allowed ONLY for the active-state toggle if you choose not to add the CSS modifier.

Files to touch:
- `src/js/views/timeline-chrome.js` — `buildBottomToolbar()` starting around line 374.
- `src/styles/app.css` — add the active modifier near `.forge-fxpanel-btn` (~line 8292).

Bonus structural move (John mentioned "fixed menus that lock and unlock hiding according to the page"): build the toolbar declaratively in `index.html` under `.forge-stage`, hide it via `body:not(.fv-layout-timeline) .forge-timeline-toolbar { display: none; }`. JS only attaches event listeners. This is the long-term right shape — same pattern as `.forge-bottombar` for the left side.

---

## 2. The SEVERITY DOGMA (now in `HOW-WE-WORK.md` §5.7)

John locked this in 2026-05-24 after the toolbar incident. UX work is **severity-strict** on three axes:

1. **Hit the actual problem.** "The right box is taller than the left" → fix that, not adjacent polish.
2. **Reuse canonical primitives.** This codebase has *one* class per primitive (`.forge-fxpanel-btn`, `.forge-zoom-gizmo`, `.forge-bottom-search`, `.forge-scrub-box`, `.forge-legend-btn`). New UI **shares** the class; it does not duplicate the declarations inline.
3. **No gimmicks, no +1px patches.** Fix the rule, not the symptom.

**Three strikes ⇒ agent terminated.** A fresh agent is spawned with a full handoff (this doc). The terminated agent does not get to retry in the same session.

Read `HOW-WE-WORK.md` §5 in full before any UX work.

---

## 3. Timeline state (what's been built)

The Timeline tab is mounted via `_forge.setLayout('timeline')`. Architecture:

- `src/js/engine/layout/timeline.js` — pure-function layout module. Origin-centered world (Phase TL-2 Step 6). 4 scale presets registered: `linear-default`, `log-centered` (Phase 22-AC: fixed asymmetric normalization), `log-recent`, `compressed-civilization`. Band heights drive a vertical-density scalar via `setTimelineBandHeightScale()`. B7 nodes are skipped (atemporal lane removed).
- `src/js/views/timeline-chrome.js` — SVG overlay + family bands + axis + ticks + the **broken** bottom-right toolbar. The toolbar lifecycle mounts on entry, unmounts on exit via `mount()`/`unmount()`.
- `src/js/views/forge.js` — the host. Calls `AtlasTimelineChrome.mount(opts)` when `local.layoutId === 'timeline'`.
- Side panel surfaces `dating_basis` (B1–B7 tier + source + notes). Built in Phase B-DATING-2.

Tick cadence (Phase 22-AB-fix): `TICK_CADENCES` is now sorted ASCENDING so `pickTickStep()` returns the SMALLEST applicable step. Old code returned 5000 always due to a top-down loop on a descending table — bug fixed. Dates now appear continuously while zooming. `denseTicks` defaults to `true` and `LS_BAND_STYLE` was bumped to `_v2` to override stale localStorage.

BG sizing rule (locked, do not touch without explicit permission): timeline `widthPx = coverWidthPx × max(1, gizmo / FLOOR_PCT)`, wheel branch untouched. Wheel BG corruption history: see `feedback_pack_scale_invariant.md` + the BG-rules block in `forge.js` ~line 3912.

---

## 4. What's queued (not blocking the toolbar fix)

- 552 person stubs need content-batch frontmatter (Lane A work)
- Calendar presets (Hebrew/Islamic/Chinese/Mayan) for the scale-picker
- Linter for dating fields (warn on missing `dating_basis`, error on B2–B5 without source)
- Three-vector dating model (entity / artifact / discovery date + concept-temporality flag) — discussed but not implemented

---

## 5. Cache-bust string

Currently `?v=20260524-p22ab-fix2` across 18 refs in `index.html`. Bump it when you ship the next change.

---

## 6. Don't repeat these mistakes

| Mistake | Cost | Lesson |
|---|---|---|
| Defended my "23 px everywhere" claim against John's screenshot | strike 1 | When the user says "I see X" — that's ground truth. Re-derive, don't argue. |
| Patched with `height: 23px` inline (still wrong because of border-add) | strike 2 | Don't mimic a CSS class with inline styles. Use the class. |
| Patched again with `padding: 5px 10px` inline + `line-height: 1` | strike 3 | Same root cause. Should have escalated to "use the class" on attempt 1. |

The dogma now in `HOW-WE-WORK.md` §5.7 exists so the next agent doesn't burn the same iterations.

— end —
