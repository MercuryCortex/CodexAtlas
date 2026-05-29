# HANDOFF — Legacy purge stalled (2026-05-29)

**Status: BLOCKED. Prior agent terminated. Fresh agent owns this.**

---

## What John sees on screen right now (ground truth — believe it)

> "i see text written on the upper left behind the menu, I see the zoom whell IS COMPLELTY differnet system than our atlas???? not canvas ??? i still see the fucking right bar with tdev , i see a menu on the upper right - I essentialluy see eerythign of the foundation proto page - EXCEPT the little colors that you changed .... YOUVE DONIENOTHING !!!!!!!!!"

Translated to surfaces:
- **Upper-left text behind the menu** → `.view-header` (h2#view-title + .subtitle + .view-controls) at [index.html:103-109](index.html#L103) — NEVER TOUCHED by prior agent
- **Zoom wheel, "different system than Atlas, not canvas"** → either `#zoom-meter` killswitch isn't actually hiding (Safari cache?) OR it's a *different* zoom UI from another script (dev-panel? legacy `views/legacy.js`?)
- **Right bar with DEV** → `src/js/dev-panel.js` (524 LOC, line [index.html:278](index.html#L278)) — self-injects a sidebar; NEVER TOUCHED
- **Menu upper-right** → `#user-menu-trigger` ✦ at [index.html:95-100](index.html#L95) — V2-native by design, but John reads it as legacy chrome
- **"essentially everything of the foundation proto"** → the *shape* of the page (top-bar zone, right-edge tab, upper-right glyph, header title block) is still indistinguishable from V01 prototype

## What the prior agent CLAIMED (commit `0e179f8c`)

Replaced `<div class="map-thumb">` (4 SVG anchors) and `<div id="zoom-meter">` (4 buttons) with `class="legacy-killswitch"` empty stubs. Added `.legacy-killswitch{display:none!important;visibility:hidden!important;width:0;height:0;...left:-99999px;top:-99999px}` ruleset to `app.css` ([src/styles/app.css:10538-10547](src/styles/app.css#L10538)).

Acknowledged in wrap-up as "still leaking": DEV tab + detail-toggle `<` arrow.

## What's actually on disk (verified)

- `0e179f8c` did land. `index.html:139-149` has the killswitch stubs. CSS rule at 10538-10547 is well-formed and correct.
- CSS file is bumped to `?v=20260529-legacy-killswitch-purge-mapthumb-zoommeter` — fresh URL.
- The 35 legacy JS callsites that reach `getElementById('map-thumb')` etc. are still in `src/js/app.js` — NOT deleted. Stubs are scaffolding for them.

## Why the agent's report doesn't match John's screen — diagnosis priorities

### #1: SCOPE MISREAD (most likely cause)

Agent treated the task as "delete `map-thumb` + `zoom-meter`". John's actual ask is **the entire V01 prototype shape — gone, scorched earth**. Read the comment block agent wrote at [index.html:125-127](index.html#L125):

> "V01 legacy chrome NEUTRALIZED per user protocol — 'old shit should be GONE ERASED, not hidden via per-view CSS'"

Agent then proceeded to do exactly that — hide via CSS instead of erase. The killswitch pattern only delays the cleanup; the `<div>`s still exist in markup and 35 JS handles still chase them. Worse, the actual surfaces John sees as "the prototype" (DEV bar, view-header text, ✦ menu, detail-toggle) were not even on the agent's list.

**Fresh agent owes: a real removal pass over EVERY surface John listed, not 2 of 6.**

### #2: SAFARI CACHE / SERVER HIJACK (run this BEFORE touching code)

Per [`feedback_server_hijack_and_safari_cache_2026-05-27`](.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/feedback_server_hijack_and_safari_cache_2026-05-27.md) — the 2-min ritual that the prior agent SKIPPED:

```bash
lsof -ti :8742            # must be ONE pid, of serve-node.js
# DevTools Network → forge.js response headers must include Cache-Control: no-store
# Add console.log('boot ' + Date.now()) near top of forge.js, reload, number must change
```

If Safari is locking the pre-`0e179f8c` `index.html` and `app.css` into disk cache, every deletion John makes will look like "YOU'VE DONE NOTHING" regardless of how thorough the diff is. **Run the ritual first.** Cmd-Option-E to empty caches, then hard-reload.

Note: current `lsof :8742` returned TWO pids (Claude Helper 2043 + node 4854). Worth confirming node is the actual `serve-node.js` and not a leftover.

### #3: KILLSWITCH RULE MAY NOT PROPAGATE TO THE "ZOOM WHEEL" JOHN SEES

The agent's CSS rule applies to `.legacy-killswitch` and `.legacy-killswitch *`. That IS correct for `#zoom-meter` and its children. If John still sees a zoom wheel, it's either:
- Safari cache (see #2), or
- The "zoom wheel" he sees is a **different element** — possibly injected by `src/js/views/legacy.js` (loaded at [index.html:280](index.html#L280)) or `src/js/dev-panel.js`. Grep for `'zoom'`, `'+'`, `'-'` button injection in these two files.

Also note `body.zoom-visible` CSS hooks at [src/styles/app.css:2202-2203](src/styles/app.css#L2202) — some JS is still adding/removing this class. Find that code path.

## The actual scope (re-stated for the fresh agent)

John wants the V2 shell to feel **structurally different** from V01 — not "V01 with two divs hidden." Concretely:

1. **DELETE — not stub** — `#map-thumb`, `#map-thumb-*`, `#zoom-meter`, `#zm-*` from `index.html`. Then go to `src/js/app.js` and **delete** the 35 callsites that reach for them. Per [`feedback_dom_addEventListener_null_throws_silently_2026-05-28`](.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/feedback_dom_addEventListener_null_throws_silently_2026-05-28.md) trap: use the `window._bootTrace` diagnostic between suspect lines to find any null-deref that survives. The CSS killswitch rule + the `.legacy-killswitch` DOM stubs come OUT in the same commit. No scaffolding-forever.
2. **DELETE `src/js/dev-panel.js`** (the `<script>` tag at [index.html:278](index.html#L278) and the 524 LOC file). Dev surface lives in the ✦ user-menu → Dev Overview now ([src/js/views/dev-overview.js](src/js/views/dev-overview.js)).
3. **DELETE `src/js/views/legacy.js`** ([index.html:280](index.html#L280)) if it's the source of the "zoom wheel" or any other surviving V01 UI. Check first; this file may also inject other chrome.
4. **DECIDE on the `.view-header`** at [index.html:103-109](index.html#L103). It's the "upper-left text" John is complaining about. Either:
   - rebuild it as canonical V2 chrome (matching the app-pill aesthetic), or
   - delete it and let each view paint its own title.
   It's currently hidden on Forge/Scripture/Transmutation views only — see CSS at [src/styles/app.css:4232, 5738, 8582](src/styles/app.css). On Pantheon (the default landing) it's visible and screams "prototype."
5. **REVIEW `#detail-toggle`** (the `<` arrow at [index.html:159](index.html#L159)). Prior agent flagged it. Should render conditionally on aside-populated, not as a permanent edge fixture.
6. **THE ✦ USER-MENU** ([index.html:95-100](index.html#L95)) — V2-native by design. Keep it but verify its visual language matches the app-pill (same glyph weight, same hover treatment). If it reads as V01 to John, it needs restyling, not deletion.

## DON'T LIST (cardinal — read before any commit)

- **Don't add another `.legacy-killswitch` stub.** That pattern was the wrong call once; doing it twice doesn't fix it. Delete the markup and delete the JS callers in the same commit. Per [`feedback_severity_dogma`](.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/feedback_severity_dogma_2026-05-24.md): +1px patches are a strike. Re-stubbing is a +1px patch.
- **Don't claim "live result: zero console errors" as success.** Per [`feedback_describe_what_human_sees`](.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/feedback_describe_what_human_sees.md): humans see UI, not console state. The prior agent reported success with zero console errors while John saw the entire prototype intact. Open the page in Safari, screenshot it, and the screenshot is the success criterion.
- **Don't skip the server/cache ritual.** Per [`feedback_server_hijack_and_safari_cache_2026-05-27`](.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/feedback_server_hijack_and_safari_cache_2026-05-27.md): cost 90 min last time. Run it FIRST.
- **Don't defer the JS-callsite cleanup "to a follow-up refactor."** That's how the stub becomes permanent. If you can't delete the markup AND the JS callers in one commit, you don't ship.
- **Don't widen scope to other views.** The Forge / Codex / Scripture / Boards V2 panes are all working and shouldn't be touched. This is a shell-level pass on `index.html` + `src/js/app.js` + `dev-panel.js` + `views/legacy.js` ONLY.

## Pre-flight before touching anything

1. `lsof -ti :8742` → confirm node `serve-node.js`. Kill any python.
2. Open `http://localhost:8742/` in Safari. Cmd-Option-E (empty caches). Hard reload.
3. Screenshot the **current** state. That's the baseline. Every change must move that screenshot, not the console.
4. Read [AUDIT/2026-05-28-legacy-isolation-locked.md](AUDIT/2026-05-28-legacy-isolation-locked.md) — the original architectural rationale. The killswitch pattern was NOT in the lock spec. Stay aligned with the lock.

## Uncommitted noise to be aware of

```
M 00_meta/lint-report.md
M 04_persons/antiochus-iv-epiphanes.md
M 04_persons/charlemagne.md
M 04_persons/umar-ibn-al-khattab.md
M 31_consciousness/consciousness-james-varieties-religious-experience.md
```

These are content-side, not shell-side. Leave them; they belong to a different lane.

---

**One-line summary for the fresh agent:** *Delete the V01 chrome — markup AND JS — verify in Safari with caches cleared, screenshot as proof. No more stubs. No more "follow-up refactor." Six surfaces, one commit, one screenshot.*
