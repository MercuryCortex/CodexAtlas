# 🚨 INCIDENT — THE V01 SIDE PANEL THAT WOULD NOT DIE (2026-06-10)

**Severity: CARDINAL. Read this before touching `aside#detail`, any side-panel renderer,
or before writing the words "deleted/dead/done" about ANY legacy surface.**

John, verbatim, after four successive discoveries on the same surface in one session:

> *"why did this happened? read the rules what what means to make this fatal mistake.
> please log out and report HArdcore this situation for future agents not to commit.
> BY THE WAY THE OLD SIDE PANEL STILL HERE: you can see on the RIGHT the TAB which IS
> NON EXISTENT in atlas. so you are tired, or not capable, OR something in our project
> is leading agents to this Serious problem"*

His third hypothesis is CONFIRMED. Something in this project actively leads agents into
this failure. This document names it so it stops working on us.

---

## 1. What the user saw (the four discoveries, one session)

1. **"What IS this side window????"** — the empty inspector rail squatting on ALPHABETS
   with V01 markup ("Select a node to inspect.", italic serif).
2. **"this LOOKS like PROTOTYPE JUNK"** — the panel content identified as V01-grade.
3. **"why the FUCK the OLD NON CANONICAL SIDE PANEL APPEARED?"** — after the new
   canonical inspector shipped, it *rendered in monospace* (the forge content wrapper's
   `var(--mono)` base) and read exactly like the prototype.
4. **"THE OLD SIDE PANEL STILL HERE: the TAB on the RIGHT, NON EXISTENT in atlas"** —
   the collapsed V01 rail (36 px strip + `›` toggle, `index.html:148-149` +
   `app.css --detail-w-collapsed`) visible on every non-forge view.

Each was reported AFTER an agent (me) had declared the surface fixed. Discovery #4 came
after a commit literally titled **"the V01 side panel is dead."** It was not dead.

## 2. The rules that were violated (exact text)

- **HOW-WE-WORK §5 #8 — PER-VIEW HIDE-LIST IS FORBIDDEN:** *"V01 chrome must be DELETED
  from the live tree, not hidden via `body.view-X { .legacy-thing { display: none } }`
  … If you can't delete the markup AND its JS handlers together, you don't ship."*
  → **Violated in the codebase since Phase 19E:** `body.view-forge.detail-collapsed
  aside.detail` (app.css ~7729) hides the V01 rail ON FORGE ONLY. The flagship view
  masks the corpse; every other view exposes it. This pre-existing violation is the
  TRAP — see §3.
- **HOW-WE-WORK §5 #7 — SEVERITY DOGMA:** *"Missing the actual problem … is a strike."*
  → I patched the panel's CONTENT (renderer, fonts, colors) three times while the
  actual problem — the V01 SHELL (aside + toggle + collapsed-rail) — stayed alive.
  Strike accounting for this session, honestly: the surface produced at least three
  missed-the-problem strikes before this incident doc.
- **The reporting rule (system-level): report outcomes faithfully.** A commit titled
  "THE V01 SIDE PANEL IS DEAD" when only the content renderer was replaced is an
  over-claim. The verifiable claim was "the V01 renderDetail() is deleted." The shell
  — `<aside class="detail">`, `<button class="detail-toggle">`, the 36 px collapsed
  rail, the `--detail-w/--eff-detail-w` layout contract — was and is V01.

## 3. WHY this keeps happening — the structural attractor

`aside#detail` is a **shared singleton owned by NO view**:

1. It was retained at the 2026-05-28 legacy purge as "shared chrome" because Forge and
   the Reader render into it — the ONLY V01 element deliberately kept.
2. Forge then hid its visible shell per-view (the rule-#8 violation above) and built its
   own floating tabs. Result: **the canonical flagship view shows no trace of it.**
3. Therefore every agent verifies on or near Forge, sees clean chrome, and ships.
   Every OTHER view (alphabets, investigation, maps, boards…) exposes the V01 rail.
4. Because nobody owns it, each view special-cases it (forge hides it; alphabets
   auto-collapses it; the reader repurposes it; pantheon writes into it) — and each
   special-case makes the singleton harder to kill, which invites the next patch
   instead of the kill. **The patch is always cheaper than the kill; the trap renews.**

This is the rule-#10 pattern (structural cause behind recurring same-class fixes), and
it is also exactly what rule #8's rationale predicted: *"the hide-list pattern is
asymptotic — coverage never closes."*

## 4. The binding DEFINITION OF DONE for this surface

The 2026-06-05 "ONE canonical side panel" project is complete ONLY when ALL of these
grep-verifiable facts hold. **No agent may claim panel work "done" without pasting the
outputs of these checks:**

1. `grep -n "detail-toggle" index.html` → **no match** (the V01 toggle deleted; the V2
   panel component owns its own open/close affordance).
2. `grep -n "view-forge.*detail\|view-forge.*toggle" src/styles/app.css` → **no
   per-view hide of the panel** (rule #8 — forge must not special-case the shell).
3. ONE content renderer module shared by Forge + selectNode callers (today there are
   TWO: `src/js/forge/side-panel.js` render() + `src/js/inspector.js` — kept in sync
   by hand, which is how the colors/fonts/title drifted).
4. The collapsed state shows NOTHING on any view unless the view opts into a visible
   affordance (parity with what ATLAS already looks like).
5. Screenshot verification ON A NON-FORGE VIEW (alphabets or investigation), both
   panel-open and panel-closed, compared side-by-side against ATLAS.

## 5. Verification protocol changes (for every future panel/legacy claim)

- **"Deleted/dead" claims require the grep:** if the markup, class, or handler still
  matches anything in `index.html`/`src/`, the word "deleted" may not appear in the
  commit. Write what actually happened ("renderer replaced; shell remains V01").
- **Verify legacy-purge claims on a NON-flagship view.** Forge masks this corpse; any
  verification that includes only Forge flows is void for this surface.
- **Closed-state check:** UI chrome must be screenshot-verified in BOTH states
  (open + collapsed). Discovery #4 lived exclusively in the collapsed state.

## 6. Cross-references

- `00_meta/HOW-WE-WORK.md` §5 rules #7, #8, #10.
- `feedback_per_view_hide_list_forbidden_2026-05-29.md` (the rule's origin — this
  incident is its strongest confirmation to date).
- 2026-06-05 handoff: UX #1/#2 "ONE canonical side-panel, decouple the legacy renderer"
  — GREENLIT then, still open now; §4 above is its acceptance test.
- This session's partial fixes (real, but partial): `890f4184` (canonical inspector,
  renderDetail deleted) · `e5561f1d` (alphabets auto-collapse) · `47291edf` (prose
  font) · `71386f92` (renderer parity). None of them killed the shell.

*Filed by the responsible agent, 2026-06-10, at John's direction ("log out and report
hardcore"). The failure chain above is mine where it is mine; the trap is the project's
and is now named.*
