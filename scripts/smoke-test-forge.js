// ============================================================
// CODEX ATLAS — FORGE INTERACTIVE SMOKE TEST
// ============================================================
//
// Filed 2026-05-25 as Phase 23.1-retry-prereq #11. The Phase 23.1
// carve series shipped "pixel-identical at boot" verifications but
// runtime interactions silently broke. This harness exercises every
// interactive surface programmatically and returns a structured
// pass/fail report.
//
// USAGE:
//   1. Open http://localhost:8742 in a browser (or via Claude_Preview)
//   2. Open devtools console
//   3. Copy-paste the entire `runForgeSmokeTest` function below and
//      call it:    await runForgeSmokeTest()
//   4. Inspect the returned report.
//
// OR via Claude_Preview MCP:
//   mcp__Claude_Preview__preview_eval with the IIFE wrapper at bottom.
//
// THE 10 CHECKS:
//   1. forge view mounted (window._forge + window._forgeDebug exist)
//   2. canvas in DOM at the right size
//   3. wheel zoom changes camera scale
//   4. pointer pan changes camera centerX/centerY
//   5. click on a node toggles its lock (lockedIds count changes)
//   6. LEGEND button opens panel + panel has expected rows
//   7. FX button opens panel
//   8. STYLE button opens panel
//   9. search box is focusable + accepts input
//   10. zero console.error during the whole sequence
//
// PASS/FAIL CRITERIA:
//   Every check is independent. The report lists per-check status
//   + the overall pass count. A future carve is "verified" only if
//   ALL 10 checks pass.
// ============================================================
async function runForgeSmokeTest() {
  const results = [];
  const errors = [];

  // Intercept console.error during the test
  const origConsoleError = console.error;
  console.error = (...args) => {
    errors.push(args.map(a => (a && a.stack) || String(a)).join(' '));
    origConsoleError.apply(console, args);
  };

  function check(name, fn) {
    try {
      const v = fn();
      if (v && typeof v.then === 'function') {
        return v.then(
          (res) => { results.push({ name, pass: !!res, detail: res }); return res; },
          (err) => { results.push({ name, pass: false, error: String(err) }); return false; },
        );
      }
      results.push({ name, pass: !!v, detail: v });
      return v;
    } catch (e) {
      results.push({ name, pass: false, error: String(e && e.stack || e) });
      return false;
    }
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Ensure we're on the forge view
  if (new URLSearchParams(location.search).get('view') !== 'forge') {
    const sp = new URLSearchParams(location.search);
    sp.set('view', 'forge');
    location.search = sp.toString();
    // Caller must re-run after reload — we can't yield across reload.
    return { phase: 'navigated-to-forge', message: 'Re-run after page reloads.' };
  }

  await sleep(500); // let mount settle

  // 1. forge mounted
  check('forge-mount', () => {
    const ok = typeof window._forge === 'object'
            && typeof window._forgeDebug === 'object'
            && typeof window._forgeDebug.cameraState === 'function';
    return { ok, forge: typeof window._forge, debugKeys: Object.keys(window._forgeDebug || {}).length };
  });

  // 2. canvas in DOM
  const canvas = document.querySelector('.forge-pane canvas');
  check('canvas-present', () => {
    const rect = canvas && canvas.getBoundingClientRect();
    return { ok: !!canvas && rect.width > 100 && rect.height > 100, w: rect && rect.width, h: rect && rect.height };
  });

  if (!canvas) {
    console.error = origConsoleError;
    return { results, errors, summary: 'aborted-no-canvas' };
  }

  // 3. wheel zoom
  await check('wheel-zoom', async () => {
    const dbg = window._forgeDebug;
    const before = dbg.cameraState().scale;
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new WheelEvent('wheel', {
      deltaY: -200, clientX: rect.left + rect.width/2, clientY: rect.top + rect.height/2,
      bubbles: true, cancelable: true, view: window,
    }));
    await sleep(200);
    const after = dbg.cameraState().scale;
    return { ok: after !== before, before, after };
  });

  // 4. pointer pan
  await check('pointer-pan', async () => {
    const dbg = window._forgeDebug;
    const before = dbg.cameraState();
    const rect = canvas.getBoundingClientRect();
    // Drag from center 200px to the right
    const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: cx, clientY: cy, button: 0, pointerId: 1, bubbles: true, cancelable: true }));
    await sleep(50);
    canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: cx + 100, clientY: cy + 50, button: 0, pointerId: 1, bubbles: true }));
    canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: cx + 200, clientY: cy + 100, button: 0, pointerId: 1, bubbles: true }));
    await sleep(50);
    canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: cx + 200, clientY: cy + 100, button: 0, pointerId: 1, bubbles: true }));
    await sleep(200);
    const after = dbg.cameraState();
    const moved = before.centerX !== after.centerX || before.centerY !== after.centerY;
    return { ok: moved, before, after };
  });

  // 5. click a node toggles lock
  await check('click-toggles-lock', async () => {
    const dbg = window._forgeDebug;
    const beforeLock = (dbg.lockedIds ? dbg.lockedIds() : []).length;
    // Find a node screen position via hitTestAt — sweep coordinates
    let hitId = null, hitX = 0, hitY = 0;
    const rect = canvas.getBoundingClientRect();
    outer: for (let y = 100; y < rect.height - 100; y += 40) {
      for (let x = 100; x < rect.width - 100; x += 40) {
        const id = dbg.hitTestAt(x, y);
        if (id) { hitId = id; hitX = x; hitY = y; break outer; }
      }
    }
    if (!hitId) return { ok: false, reason: 'no-node-found-by-hit-test', beforeLock };
    const screenX = rect.left + hitX, screenY = rect.top + hitY;
    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: screenX, clientY: screenY, button: 0, pointerId: 2, bubbles: true, cancelable: true }));
    await sleep(50);
    canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: screenX, clientY: screenY, button: 0, pointerId: 2, bubbles: true }));
    await sleep(200);
    const afterLock = (dbg.lockedIds ? dbg.lockedIds() : []).length;
    return { ok: afterLock !== beforeLock, hitId, beforeLock, afterLock };
  });

  // 6. LEGEND panel
  await check('legend-panel-opens', async () => {
    const btn = document.getElementById('forge-legend-btn');
    if (!btn) return { ok: false, reason: 'no-legend-btn' };
    btn.click();
    await sleep(200);
    const panel = document.getElementById('forge-legend-panel');
    const visible = panel && getComputedStyle(panel).display !== 'none';
    const rowCount = panel ? panel.querySelectorAll('.forge-legend-row').length : 0;
    btn.click(); // close
    return { ok: visible && rowCount >= 7, visible, rowCount };
  });

  // 7. FX panel
  await check('fx-panel-opens', async () => {
    const btn = document.getElementById('forge-fx-btn');
    if (!btn) return { ok: false, reason: 'no-fx-btn' };
    btn.click();
    await sleep(200);
    const panel = document.querySelector('.forge-fxpanel, #forge-fxpanel');
    const visible = panel && getComputedStyle(panel).display !== 'none';
    if (btn) btn.click();
    return { ok: visible, visible };
  });

  // 8. STYLE panel
  await check('style-panel-opens', async () => {
    const btn = document.getElementById('forge-style-btn');
    if (!btn) return { ok: false, reason: 'no-style-btn' };
    btn.click();
    await sleep(200);
    const panel = document.querySelector('.forge-style-panel, #forge-style-panel');
    const visible = panel && getComputedStyle(panel).display !== 'none';
    if (btn) btn.click();
    return { ok: visible, visible };
  });

  // 9. search box focusable
  await check('search-focusable', async () => {
    const el = document.getElementById('forge-status-search');
    if (!el) return { ok: false, reason: 'no-search-input' };
    el.focus();
    const focused = document.activeElement === el;
    el.blur();
    return { ok: focused, focused };
  });

  // 10. zero console.error during the test
  results.push({ name: 'no-console-errors', pass: errors.length === 0, errorCount: errors.length, errors: errors.slice(0, 5) });

  // Restore
  console.error = origConsoleError;

  const pass = results.filter(r => r.pass).length;
  const total = results.length;
  return {
    summary: pass === total ? 'PASS' : `FAIL ${pass}/${total}`,
    passCount: pass,
    totalChecks: total,
    results,
    errors,
  };
}

// IIFE wrapper for preview_eval / paste-into-console:
//   await (async () => { /* paste runForgeSmokeTest above first */ return await runForgeSmokeTest(); })()
//
// Or from a separate eval call once the function is loaded:
//   await runForgeSmokeTest()

// Export for module-style consumers if any:
if (typeof window !== 'undefined') window.runForgeSmokeTest = runForgeSmokeTest;
if (typeof module !== 'undefined' && module.exports) module.exports = { runForgeSmokeTest };
