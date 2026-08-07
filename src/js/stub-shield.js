/* ══ THE STUB SHIELD — one definition, both renderers (2026-08-07) ══
 *
 * 387 vault nodes ship their own build scaffolding to readers:
 *
 *   "**Stub.** Auto-created 2026-05-20 during the orchestrated
 *    initial-wave goblin batch (`goblin-attire-1` + `goblin-exch…"
 *
 * That is a note from the vault's construction crew to itself, and it
 * was being printed to customers as though it were the entry. John's
 * call (2026-08-06 worklist #2): shield it in the panel now, write the
 * entries later. The writing is happening in Lane A; this is the
 * shield, and it stays correct as those entries land because it tests
 * the CONTENT, not a status flag.
 *
 * WHY A MODULE AND NOT A COPY IN EACH PANEL: `src/js/forge/side-panel.js`
 * and `src/js/inspector.js` are two renderers of the SAME node, and
 * this repo has been bitten by them drifting apart. One definition,
 * consumed by both — the `window.edgeStyleFor()` pattern from
 * `src/js/edge-buckets.js`.
 *
 * WHY NOT `status: stub`: the scaffolding also sits on nodes that have
 * since been part-written (a real paragraph under a stale note), and a
 * few genuine stubs carry no note at all. Shielding by flag would blank
 * real prose and miss real blanks. So we shield paragraph by paragraph
 * and keep every real sentence around it.
 *
 * ⚠️ THE DISCRIMINATOR IS THE BUILD VOCABULARY, NOT THE WORD "STUB".
 * The vault's bibliographies contain "Stubbs, John (trans.)" and
 * "Stubbs, J. (trans.) (1952). *Hafiz of Shiraz*". Matching on "stub"
 * alone would silently blank a reference list. A paragraph must ALSO
 * name the machinery — goblin / TYRANT / auto-created / a sweep —
 * before we are willing to hide it. If you loosen this, check those
 * two bibliography strings still survive.
 */
(function () {
  'use strict';

  // What the crew was DOING (the act), and WHO/WHAT did it (the crew).
  // A paragraph needs both before it is treated as scaffolding.
  var SCAFFOLD_ACT  = /(auto-created|stub created by|stubbed during)/i;
  var SCAFFOLD_CREW = /(goblin|tyrant|watcher-claude-lead|initial-wave|orchestrated|sweep|dead-link reference|batch)/i;
  // The short forms that name no crew. Length-capped, or anchored at
  // the start of the paragraph, so a real sentence that happens to use
  // the words is not swallowed.
  var SCAFFOLD_SOLO = /pending fuller treatment/i;
  // MEASURED 2026-08-07: after the "Auto-created … goblin batch" note is
  // removed, 381 of the 409 shielded nodes were left holding ONLY this,
  // in exactly one form — "Needs full content. Referenced from: `x`, `y`."
  // It is the same crew talking to itself: a worklist entry, not an
  // entry. Anchored at paragraph start so prose *about* needing content
  // cannot match.
  var SCAFFOLD_TODO = /^\s*needs full content\b/i;

  function isScaffoldParagraph(p) {
    var t = String(p || '').replace(/[*_`>#]/g, ' ').trim();
    if (!t) return false;
    if (SCAFFOLD_TODO.test(t)) return true;
    if (SCAFFOLD_SOLO.test(t) && t.length < 120) return true;
    return SCAFFOLD_ACT.test(t) && SCAFFOLD_CREW.test(t);
  }

  // A body whose only survivor is its own `# Title` heading is not an
  // entry either — the panel already prints that title, twice as large,
  // three lines above. So the heading does not count as substance when
  // deciding whether anything was actually written.
  function withoutLeadHeading(t) {
    return String(t || '').replace(/^\s*#{1,3}\s+[^\n]*\n*/, '').trim();
  }

  /**
   * Strip build scaffolding from a node body.
   * @param   {string} body  raw markdown body from data.js
   * @returns {{ text: string, unwritten: boolean, stripped: number }}
   *          text      — the body with scaffolding paragraphs removed
   *          unwritten — nothing of substance survived; show the
   *                      standing "Not written yet" state instead
   *          stripped  — how many paragraphs were shielded (for probes)
   */
  function stripScaffold(body) {
    var raw = String(body || '').trim();
    if (!raw) return { text: '', unwritten: true, stripped: 0 };
    var paras = raw.split(/\n\s*\n+/);
    var kept = [];
    var stripped = 0;
    for (var i = 0; i < paras.length; i++) {
      if (isScaffoldParagraph(paras[i])) stripped++;
      else kept.push(paras[i]);
    }
    var text = kept.join('\n\n').trim();
    // Nothing but a heading left ⇒ nothing was written. Return an EMPTY
    // body, not the bare heading: otherwise the panel would print
    // "# Hyksos" under its own "Hyksos" title and call that the entry.
    if (text && !withoutLeadHeading(text)) text = '';
    return { text: text, unwritten: !text, stripped: stripped };
  }

  window.atlasStubShield = {
    strip: stripScaffold,
    isScaffoldParagraph: isScaffoldParagraph,
  };
})();
