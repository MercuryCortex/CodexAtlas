# Session HANDOFF — 2026-05-29 evening (SHELL FOUNDATION IS V1 — needs rebuild)

> **🔴 RED-FLAG SESSION END.** John is correctly furious. This session
> made many *cosmetic* changes to individual views (scripture-radial,
> boards bottombar, Forge side-panel, codex routing, dev-overview panel)
> while leaving the **V1 prototype shell as the live foundation**. The
> V1 chrome keeps "creeping back in" because the live `index.html` IS
> the V1 prototype scaffold with selective per-view CSS hide-rules
> bolted on. Every new view I built inherited that foundation. Per
> John's exact words this session:
>
> > "i see text written on the upper left behind the menu, i see the
> > zoom wheel IS COMPLETELY DIFFERENT system than our atlas???? not
> > canvas ??? i still see the fucking right bar with dev, i see a
> > menu on the upper right — I essentially see EVERYTHING of the
> > foundation proto page — EXCEPT the little colors that you
> > changed.... YOUVE DONE NOTHING !!!!!"
>
> The pattern across the session: I'd ship a "fix", he'd screenshot
> the chart with another piece of V1 chrome still showing, I'd patch
> that ONE piece, repeat. He's right that the band-aid approach is
> the problem.
>
> **The architectural pivot needed:** make every V2 view sit inside
> the SAME canonical V2 shell (the one Forge + Boards uses) with the
> view's render() owning its chrome. The current pattern — global
> shared shell with body.view-X CSS hide-rules — is fundamentally
> wrong and is what's letting V1 creep through.

---

## 60-second TL;DR for the fresh agent

1. **DON'T add to the body.view-X hide-list.** John has explicitly
   forbidden this protocol twice this session: *"NOT ADDING ANYTHING
   TO HIDE LIST — THE OLD SHIT SHOULD BE GONE ERASED, WE SHOULD JUST
   BE ABLE TO LOOOOOK AT IT WHEN NEEDED, AND NEVER EVER EVER BE
   ATTACHED TO OUR SITE THAT IS IN DEVELOPMENT."*

2. **DON'T import V1 code or visual styling.** John repeated this
   three+ times this session: *"NO IM STILL ON THE SAME BACKGROUND AND
   SIDE PANEL AND MAP AND ALL THE SHIT… I TOLD YOU TO LOOOOK, LEARN
   AND BUILD SOMETHING VERY SIMPLE 100000% THE SAME AS THE ATLAS,
   JUST DIFFERENT ORGANIZATION WITH DIFFERENT FAMILIES."*

3. **The foundation needs a rebuild, not another band-aid.** The live
   `index.html` is still the V1 prototype shell. Even after this
   session deleted `.map-thumb` and `#zoom-meter`, the user is still
   seeing legacy chrome leaking. Reason: many MORE V1 elements exist
   in the live shell (the `<div class="view-header">` with `<h2
   id="view-title">` that paints "Scripture" text in the upper-left
   behind the user-menu, the `aside.detail` right-edge panel, the
   `src/js/dev-panel.js` DEV vertical tab, the `aside.detail` collapse
   arrow on the right, miscellaneous absolute-positioned controls).
   The user is essentially seeing the V1 prototype with V2 cosmetics.

4. **What John actually wants:** "100000% the same as the ATLAS" —
   meaning every view should look like the Forge wheel shell. Same
   top app-pill row + canonical bottombar + NOTHING else. The
   chart/data inside the view is what varies. Forge/Boards already
   live in this canonical shell; scripture-radial, V2 maps, V2 starmap
   etc. inherit the V1 shell.

5. **DO NOT TOUCH STYLE.** Multiple times: *"we don't touch a single
   line on style — use canonical."* The V2 canonical styles live in
   `.forge-bottombar`, `.forge-viewset-*`, `.forge-legend-*`,
   `.boards-bottombar`, `.boards-stage`, the `--gold` / `--bg-*` /
   `--text-*` theme vars. Use those. Don't add new visual primitives.

---

## What's actually broken (per John's screenshot at session end)

He posted a screenshot of `?view=scripture` (the radial Bible
sunburst). Visible legacy chrome leaks he flagged:

1. **Text behind the user-menu in upper-left** — that's `<h2
   id="view-title">Scripture</h2>` inside `<div class="view-header">`
   in `index.html` line 103-109. Painted with V1 styling, sitting
   under the `.user-menu-trigger` (`✦`) glyph. Should not exist on
   scripture (or any V2 view that owns its own header chrome).

2. **The zoom controls top-right** — that's `Holy Bible <select>` +
   `<button>✠ Read</button>` from my own VIEWS.scripture render that
   injects them into the legacy `#view-controls` container. These are
   not even legacy — they're MINE but placed in a legacy slot. They
   should live in the canonical bottombar like Forge does (search +
   zoom-gizmo + everything bottom-anchored).

3. **The DEV tab on right edge** — from `src/js/dev-panel.js` (524
   LOC, IIFE that installs a vertical tab on every view). Already
   superseded by `✦ user-menu → Dev → Overview` shipped earlier this
   session (commit `7814cb75`). Now redundant — should be deleted.

4. **The `<` arrow on right edge** — `aside.detail`'s collapse
   toggle (`#detail-toggle`). The detail aside is used by Forge for
   the deity side-panel. On non-Forge views it should be unmounted
   entirely, not just visually collapsed.

5. **A small menu indicator upper-right** — likely the user-menu's
   parent area or the master-pill caret. Need to verify.

> User's exact words: *"I essentially see EVERYTHING of the foundation
> proto page — EXCEPT the little colors that you changed."*

---

## The architectural pivot (the real fix)

The current shell in `index.html`:

```html
<body class="nav-hidden detail-collapsed">
  <div class="app-pill-wrap">…</div>          <!-- V2 canonical top pill -->
  <button class="user-menu-trigger">…</button> <!-- V2 ✦ user menu -->
  <main class="canvas" id="canvas">
    <div class="view-header">…</div>          <!-- V1 LEGACY -->
    <div id="svg-wrap"><svg id="svg"></svg></div>  <!-- V1 SHARED MOUNT POINT -->
    <div class="codex-graph-pane">…</div>     <!-- V1 SHARED MOUNT -->
    <div class="atlas-pane">…</div>           <!-- V1 SHARED MOUNT (MapLibre) -->
    <div id="scripture-reader-pane">…</div>   <!-- V1 SHARED MOUNT -->
    <div class="legend">…</div>               <!-- V1 LEGACY -->
    <div class="tier-legend">…</div>          <!-- V1 LEGACY -->
    <div class="legacy-killswitch">…</div>    <!-- zoom-meter + map-thumb stubs (this session) -->
    <div id="tooltip">…</div>
  </main>
  <aside class="detail">…</aside>             <!-- V1 LEGACY for non-Forge -->
  …35+ <script> tags…
</body>
```

The V2 canonical shell that the user actually wants looks like the
Forge / Boards experience: a minimal `<main>` with NOTHING preinstalled
except the app-pill and the user-menu. Each view's `render(pane)`
mounts its own DOM into `<main>` and tears it down on view-swap.

### The pivot in three steps

**STEP A — Build the true V2 canonical shell.** Delete from `index.html`:
- `<div class="view-header">` — let views render their own headers
  via canonical chrome (top app-pill + bottombar). Forge already does
  this; the legacy `<h2 id="view-title">` is dead weight.
- `<div class="legend">` and `<div class="tier-legend">` — these are
  legacy mount points for V1's D3 pantheon legend and the V1 tier
  overlay. The V2 Forge legend lives in `src/js/forge/legend.js` and
  builds its own `#forge-legend-panel` on demand. The old shared
  divs are vestigial.
- `<aside class="detail">` — move ownership into Forge. Forge's
  side-panel module (`src/js/forge/side-panel.js`) already manages
  the content; just have Forge mount the `<aside>` element on its
  own render() and remove it on unmount. Stop carrying it globally.
- `<div id="svg-wrap">` — the legacy shared SVG root. Pantheon and
  scripture-radial use it. Each view should create its own SVG
  inside its own pane, not share.
- `src/js/dev-panel.js` script tag — fully delete the legacy
  dev-panel module. Its functionality (live tweak surface) is now
  superseded by `✦ user-menu → Dev → Overview` from commit `7814cb75`.

**STEP B — Convert every V2 view to the pane-mount pattern.** The
shape that Boards V2 uses (`VIEWS.boards.render(canvasEl)` creates
`<div class="boards-pane">`, appends to canvas, tears down on
`setView()` cleanup) is the template. Each view becomes:

```js
VIEWS.scripture = {
  render() {
    const pane = document.createElement('div');
    pane.className = 'scripture-pane';
    document.getElementById('canvas').appendChild(pane);
    // pane owns: corpus picker, SVG mount, bottombar, legend pop, etc.
  }
};
```

And `setView()` in `src/js/app.js` (around line 568) extends its
existing `.querySelectorAll('.boards-pane, .pantheon-v2-pane,
.forge-pane, …').forEach(el => el.remove())` cleanup to include
`.scripture-pane`, `.atlas-pane`, etc.

This is the proper architecture. The body.view-X CSS hide-list goes
away entirely because there's nothing to hide — each view mounts its
own DOM and unmounts it cleanly.

**STEP C — Delete the 35 legacy JS callsites** that still reach for
`getElementById('zoom-meter')`, `'map-thumb'`, `'zm-in'`,
`'zm-readout'`, `'map-thumb-svg'`, etc. (in `src/js/app.js` lines 452,
463-465, 487, 631-639 et al). Once those are gone, the
`.legacy-killswitch` stubs added this session can be deleted too. The
stubs are scaffolding — they exist only to prevent silent boot crashes
per the documented `feedback_dom_addEventListener_null_throws_silently_
2026-05-28` trap. Surgical deletion of the callsites is the real fix.

---

## What DID land successfully this session (don't redo these)

Despite the shell mess, several substantive commits shipped clean and
should be preserved. Audit `git log --oneline 7814cb75..HEAD` for the
full list. Highlights:

### Lane B — infrastructure
- **`7814cb75`** Dev Overview panel (`✦ user-menu → Dev → Overview`) —
  per-lens + per-family coverage vs Encyclopedia of Religion baseline,
  health bands (anemic / developing / rich / over-baseline), data
  pipeline `scripts/build_health_index.py` → `src/data/health-index
  .json`. Live and working.
- **`a58e4698`** Classifier RIGOR pass — drove accidental-unclassified
  count `196 → 0` via regex fix (YAML scalar parser respects quote
  style), 80+ new family matchers tagged `# +RIGOR/2/3/4`, family-order
  swap (Abrahamic before Greco-Roman so "Greek Orthodox" routes
  correctly), 23-case `SANITY_CASES` panel aborts the build on
  regression, `INTENTIONAL_CROSS_TRADITION` allow-list. Net family
  rebalance: Abrahamic 763→862, Greco-Roman 335→314, Modern-syncretic
  69→118.
- **`fdda298c`** Forge side-panel restoration — V1's `node.body`
  markdown render restored (V2 was dropping it, showing only the
  truncated `thumb_extract`); `node.refs` section restored; `+ Add to
  Board` action row between desc and edge buckets.
- **`4246aac5`** Boards canonical bottombar v3 — `VIEW + LEGEND`
  drop-up panels reusing `.forge-viewset-*` classes; right-click empty
  → "Add node…" via `window._boardsControls.openAddNode`; Delete/
  Backspace handler. THE BOARDS BOTTOMBAR IS THE GOOD CANONICAL
  REFERENCE — use this pattern.
- **`54d5c756`** `build_data.py` body-table edge extractor — markdown
  tables of the form `| [[slug]] | edge-type | notes |` in node
  bodies now bake into `vault.edges`. +150 new edges including the
  user-flagged Nāgārjuna ↔ Wittgenstein wiring. Affects every
  MASSIVE-WIN preset on Boards. Unblocks the Transmission library.
- **`3c879763`** Codex pill cascade routes Religion → Codex (Bible) +
  no-book → `setView('scripture')` (and inverse on book pick). The
  routing works; the destination view is still the V1-shell mess.
- **`ca2be858`** Scripture-radial colour stripped — V1 rainbow palette
  (greens/reds/browns/purples per section) and italic-serif labels
  replaced with V2-canonical gold + mono via CSS overrides scoped to
  `body.view-scripture`.
- **`0e179f8c`** `.map-thumb` + `#zoom-meter` deleted from live shell;
  empty `.legacy-killswitch` stubs left in their place. CSS pins them
  permanently invisible.

### Lane A — content (across the session)
Vault grew 4,676 → 4,936 then continued to ~5,100+ via several goblin
rounds. Lenses that came out of red this session:
- Languages 15% → 26% (Hieroglyphic, Demotic, Old/Middle Persian,
  Younger Avestan, Pāli, BHS, Classical Tibetan, Classical Chinese,
  Mishnaic Hebrew, Babylonian/Galilean Aramaic, Ardhamāgadhī)
- Astronomy 13% → 28% (Babylonian zodiac, Egyptian decans, Indian
  Nakshatras, Chinese 28 mansions, Mayan Long Count, Stonehenge,
  Newgrange, Nabta Playa, Cheomseongdae, Antikythera)
- Iranian/Zoroastrian family 19% → 30% (Amesha Spentas, Yazatas,
  doctrine-frashokereti, doctrine-saoshyant, Chinvat bridge, Pasargadae,
  Yazd Atash Behram, tradition-zurvanism, tradition-parsi-diaspora,
  Mazdak)
- Consciousness 1% → 27% (the entire lens — James / Otto / Stace /
  Katz / Forman / Dzogchen rigpa / Mahamudra / turiya / sahaja /
  Merton / Wilber / NDE / Pahnke / Sufi fanāʾ-baqāʾ / Hesychast)
- Calendars 24% → 31% (Hijri, Hebrew luni-solar, Mayan Tzolkin/Haab,
  Zoroastrian fasli-shenshai, Aztec Tonalpohualli-xiuhpohualli,
  Coptic, Julian, liturgical-year-Christian)
- Egyptian family 41% → 46% (Min, Nekhbet, Taweret + Saqqara, Abydos,
  Heliopolis, Memphis, Amarna, Dendera-Hathor, Philae-Isis + 2 themes
  + 2 terminal events)

Vault final state per the last health-index regen: **4,936 nodes /
30 lenses / 14 families / bands 9 anemic / 11 developing / 8 rich /
1 over / 0 accidental classifier gaps / 30 intentional cross-tradition.**

---

## Cardinal rules collected this session (memorize before touching code)

1. **Build for the V2 canonical shell, not the V1 shell.** Forge +
   Boards are the references.
2. **No body.view-X CSS hide-list additions.** Delete legacy from
   live, don't selectively hide it per view.
3. **No V1 code imports.** Look, learn the chart type, build from
   scratch in V2 chrome.
4. **No new style primitives.** Theme vars + `.forge-*` + `.boards-*`
   classes already cover every legitimate visual need.
5. **No legacy chrome attached to the dev site.** Reference copies
   live ONLY in `_legacy/`.
6. **EXECUTE, don't menu-pick.** From `feedback_execute_dont_menu_
   2026-05-26.md`. In fix mode, the plan exists; agent executes;
   John reviews outputs.
7. **Severity dogma.** Three strikes (missing the actual problem,
   duplicating canonical primitives, +1px patches) = agent terminated.
8. **Always tell John what to check** at end of every batch — specific
   URLs + click targets. (Standing instruction from this session.)
9. **The Google Maps bar.** Atlas must feel like Google Maps at
   millions of nodes per `feedback_google_maps_bar_2026-05-25.md`.
10. **Safari is the truth.** Build for Safari (Mac users) per
    `feedback_safari_is_the_truth_2026-05-26.md`.

---

## Recommended first move for the fresh agent

Don't ship more "fixes". Step back and do the architectural pivot
above (STEP A → STEP B → STEP C). Likely a 4-6 hour Lane B batch.
Slot file: `00_meta/ACTIVE-UX.md`. Reference batches by date
(`watcher-claude-shell-rebuild-2026-05-30` or similar).

**Confirm-on-cast** before any code edits per `00_meta/HOW-WE-WORK.md`
§3: tell John you're reading this as Lane B SHELL REBUILD and propose
the scope in 3 bullets. Wait for his explicit greenlight.

If he says "go" without modifications, the order I'd execute:

1. Delete `src/js/dev-panel.js` script tag from `index.html` + delete
   the file. Already superseded by Dev Overview (`7814cb75`). Verify
   nothing still imports its `window.CODEX_DEV` namespace.
2. Move `aside.detail` ownership into the Forge view module. Pantheon
   V2 already does this for its own pane; Forge should too. Stop
   carrying `<aside class="detail">` in the global shell.
3. Delete `<div class="view-header">` from `index.html`. Audit which
   views still use `#view-title` / `#view-subtitle` / `#view-controls`
   and have them render their own headers inline with canonical chrome.
4. Move VIEWS.scripture to the pane-mount pattern (mirror VIEWS.boards).
   Build the bottombar canonical — search + corpus picker + zoom +
   VIEW + LEGEND — inside the pane. No injection into legacy
   `#view-controls`.
5. Delete the 35 legacy JS callsites for `zoom-meter` / `map-thumb`
   et al. Then delete the `.legacy-killswitch` stubs from
   `index.html`. They're fully unreachable.
6. Same pattern for the other V1-shell-bound views: V2 maps, V2
   starmap, Pantheon V2 audit.

After STEP A-C, the V2 architecture is uniform: every view mounts
its own pane inside `<main>`, lives in canonical chrome, tears down
cleanly. The body.view-X hide-list ruleset can be deleted entirely.

---

## Where I left things

- Branch: `main`
- HEAD: `0e179f8c`
- Working tree: should be clean of my work; pre-existing dirty files
  from sibling-goblin batches earlier in the session may still be
  there per the concurrent-fleet memory.
- Preview server: running on port 8742 via
  `~/Desktop/Codex Atlas/scripts/serve-node.js`. May or
  may not still be alive when you start.
- Bundle: rebuilt at `src/js/forge/_bundle.js` 4815 lines / 12 modules.

---

## What John actually sees right now at `?view=scripture` (per his
screenshot just before this handoff was written)

The chart IS clean V2 (gold + black + mono, 9 sections, 33 books,
trails). But the **shell around it** is still 100% V1 prototype.
That's the foundational problem.

Don't ship another cosmetic patch. Do the rebuild.

— closed by watcher 2026-05-29 evening, mid-session, escalated to
fresh-agent handoff per user direction
