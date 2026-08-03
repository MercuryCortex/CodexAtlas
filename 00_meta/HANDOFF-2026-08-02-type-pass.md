# HANDOFF — 2026-08-02 · THE TYPE PASS, AND JOHN'S TWO OPEN COMPLAINTS

> Written at John's order at session close: *"good job, but the titles
> postion are ver missing the space jumping, and the subtitles fade show
> black ootline on fade and not felling good. commit and log out for
> fresh agnrt to pick."* Ratified overall, TWO defects named. Fix those
> FIRST, from his seat, before any new commission.

---

## STATE — read before anything

- **DEPLOYED. tree == live.** codexatlas.org serves `?v=20260802-fandrop`
  (fonts `-type1`, app.css `-editorial`, bundle `-wires`), through the
  one gated door (`bash scripts/deploy.sh`). Verified by curl after
  upload: all four cache-busters + the vendored italic woff2 live.
- Tree CLEAN at `77b06cea`. All three house gates PASS + linkcheck no
  regression. 12 batches today: fonts unlock (`4adbdf7d`), chrome type
  (`e1df9167`), canvas type 13/12/11.5 + mixToBg solid ink (`7dc6ef6f`),
  layout dials (`c414efd5`), Odyssey +18 (`81c86b4e`), ithaca fix,
  editorial panel (`bf3d7fc3`), wire flow (`b4ad64f1`), images
  (`11270eff`, `97b47300`), fan-drop fix (`77b06cea`).
- Full session log = the seven `2026-08-02 · fable-*` STATUS entries.
  Current type law = memory `project-type-system-2026-08-02` — do NOT
  restore the toy's 11/9.5 sizes; 13/12/11.5 is John-ratified.

## JOHN'S TWO COMPLAINTS (the next agent's first work)

**1 — "the titles position are very missing the space, jumping."**
The settle-only pin (this session) stopped MID-GESTURE re-decisions,
but John still sees jumping and wrong holes. Suspects, in order:
- The re-seat AT settle is itself the jump he sees: the block teleports
  to its new hole the frame the camera rests. It likely needs a short
  EASE (tween the anchor between old and new seat over ~200ms) or a
  larger hysteresis so small camera moves never re-seat at all.
- "Missing the space": the hole chooser may still pick a legal-but-wrong
  hole. His 08-01 screenshots showed the title ON the tree after
  zoom-out-centre — re-test exactly that: enter house → zoom out →
  recentre → where does the block sit? The chooser lives in
  `houseTitleGap` / seat logic in `src/js/views/forge.js` (search
  `titlePin`, `nameEatsAt`, `axisVeto`). The gate replays it
  (check-familytree FAN DIALS + title sections) — green, so the failure
  is a case the replay doesn't model: reproduce from HIS seat first
  (2000×1098, real zoom gestures, `houseSettle()` is NOT a real gesture
  — drive `camera` like a human, multiple zoom in/out cycles).

**2 — "the subtitles fade shows black outline on fade, not feeling good."**
The subtitle LOD fade (0.8–1.1 ramp) fades the FILL while the HALO
stays heavy → a black outline ghost mid-fade. Root shape: this session
moved steady chrome to `mixToBg()` pre-dimmed SOLID ink; fades were left
on alpha — the subtitle fade path mixes both regimes (solid halo under
alpha-ramping fill, or halo alpha ≠ fill alpha). Law for the fix: a
fading string fades AS ONE OBJECT — halo lineWidth and halo alpha must
ramp with the fill (or skip the halo entirely below ~0.6 alpha; at
those sizes the halo does nothing over empty ground anyway — see the
canvas audit: the halo is invisible over bg, only visible crossing
wires). Find the subtitle paint in the title block painter
(`renderLabelsCanvas` → title/subtitle rows, search `subAlpha` /
LOD ramp). Verify the fix by driving zoom SLOWLY through the ramp and
reading frames mid-fade (getImageData — WebDriver PNGs soften canvas).

## QUEUED DECISIONS (John's, untouched)
- ~3,120 REVERSE_DIRECTION edges: static idle gradient paints backwards
  at dial 0. Pack-time flip = one line, visibly changes the idle wheel.
  HIS call, not yours.
- Boards inspector restyle: code-verified, needs one eyeball click.
- Follow-ups parked: theme-heroes-paradise-island Louden CQ ref
  (skeptic: suspect), stribog tier asymmetry, xenia hub idea,
  images for the 18 new Odyssey nodes, ~1,589 genuine no-article
  nodes → depictions/Wikidata route.

## THE RULES THAT HELD TODAY (keep them)
- Safari is the truth; WebDriver PNGs soften canvas ~2× — judge canvas
  by getImageData only. `document.fonts.check()` lies — ink test.
- A gate that mirrors app logic moves IN THE SAME COMMIT as the law.
  Twice today a "failure" was the gate replaying deleted law.
- Agents draft/edit, MAIN THREAD gates and commits. Lane A (content)
  and Lane B (app) commit separately — the hook enforces it.
- `houseSettle()` for house states; synthetic hovers don't work.
- Every claim grep-verified before commit; every batch = STATUS + commit.
