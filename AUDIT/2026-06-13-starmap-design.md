# STAR MAP — design thoughts (2026-06-13, pre-build)

**Status: DESIGN. Not greenlit for build. John's concept, verbatim:**

> *"the star map i envision a couple things, which is literally a star map and a
> timeline mixed that we can see or scrub"*

This doc turns that sentence into a buildable shape, names the decisions John
will need to ratify, and stakes the tech to the canonical engine BEFORE anyone
is tempted to hand-roll a sky renderer (rule #9: one engine, many spreads —
the genealogy build `ac911420` is the precedent for adding a layout family).

---

## 1. The concept

One surface, two axes of control:

- **The sky** — a real celestial dome: naked-eye stars, the Milky Way band,
  and ASTERISMS (constellation line-figures) drawn above them.
- **The time scrub** — the timeline's existing date control, repurposed: drag
  through the eras and the sky CHANGES with it. Three things move:
  1. **Precession** — the slow wobble of Earth's axis (~25,772-year cycle).
     The pole star is Thuban when Khufu builds the Great Pyramid, Kochab for
     the Greeks, Polaris for us. Scrubbing 3000 BCE → 2026 CE visibly rotates
     the whole dome. This is real astronomy, computable, and *exactly* the
     kind of thing that makes the investigation legible: the pyramid shafts
     point at Thuban BECAUSE of where the scrub sits.
  2. **Attestation** — which star NAMES and constellation FIGURES exist yet.
     At 1800 BCE the sky carries MUL.APIN's Bull of Heaven; the Greek Taurus
     figure fades in centuries later; the Arabic star names (Aldebaran,
     Betelgeuse...) bloom in the Islamic Golden Age. The sky becomes a
     TIMELINE OF NAMING — the vault's transmission story told on the dome.
  3. **Events** — heliacal risings and alignments the traditions ritualized:
     Sirius/Sothis rising → Nile flood + the Sothic calendar; the Pleiades →
     Matariki / Subaru / the Bundle of the Maya; Venus cycles → Quetzalcoatl.
     Event markers sit ON the dome at the right scrub positions.

**Why this is an investigation surface and not a planetarium:** every named
star/asterism is a VAULT NODE wired to deities, scriptures, calendars, and
events (`21_astronomy/` + `syncretic-edges`). Click Sirius → the inspector
opens Sopdet/Sothis with its wires into Isis, the Sothic calendar, the
Ebers papyrus. The dome is one more projection of the same substrate —
same inspector, same wires, same READ tie-ins (Job 38's "canst thou bind
the sweet influences of Pleiades" jumps from the READ surface to the dome).

## 2. The tech (settled by precedent — engine, not bespoke)

- **A third layout family in the Forge engine**: `layoutId: 'skydome'`
  alongside `wheel` and the `timeline/genealogy` family. Nodes = stars +
  asterism anchors positioned by RA/Dec through an azimuthal projection.
  GPU instancing already proves 4,476 nodes + 21k edges at 60fps; ~9,000
  naked-eye stars (Hipparcos bright subset, public domain) is the same
  order of magnitude. Constellation line-figures = edge sets.
- **The scrub = the timeline's existing date chrome** (the +9000 BCE / 2026
  CE scrub boxes + slider already in the bottom bar). Same control, new
  consumer: it drives (a) the precession rotation matrix, (b) the
  attestation active-set, (c) event-marker visibility. No new UI primitive.
- **Sky-culture layers = the swappable groupBy** (rule #9): Babylonian
  (MUL.APIN), Greek (Ptolemy's 48), Egyptian (decans), Chinese (28 lunar
  mansions), Polynesian (navigation stars), Arabic (manāzil). One dome,
  many figure-sets — exactly like one wheel, many spreads. Hulls become
  culture-layer toggles, not geometric wedges.
- **Static star catalog baked to a data file** (`src/data/stars-bright.js`,
  ~9k rows: HIP id, RA, Dec, magnitude, color index). Lane B asset, baked
  once, no runtime fetch. Vault nodes reference stars by HIP id so the
  dome and the graph stay joined.

## 3. Phases (each one shippable)

- **P1 — the dome.** Static sky at J2000: stars by magnitude, Milky Way,
  Greek + Babylonian asterism layers, click-through to the inspector for
  every star/asterism that has a vault node. The engine camera does
  pan/zoom (the dome pans like the wheel; pinch-zoom dives into a
  constellation).
- **P2 — the scrub.** Precession transform + attestation active-set wired
  to the date control. The "watch the pole star change" moment lands here.
- **P3 — events + READ tie-ins.** Heliacal-rising markers, calendar wires,
  scripture jump-ins (Job 38, the Quranic najm verses, Enuma Elish V).
  Possibly a "tonight above you" mode (geolocation-free default lat).

## 4. What John must ratify before build

1. **Lane-A prerequisite:** `21_astronomy/` needs star/asterism nodes
   carrying HIP ids + attestation dates + culture wires. Sizeable content
   batch — the dome is only as alive as these nodes.
2. **Scope of P1 culture layers** (Greek + Babylonian first? or include
   Egyptian decans at launch?).
3. **The precession math is real but the ATTESTATION dates are scholarship**
   — same T1-sourcing discipline as everything else; the dome must not
   invent "the Greeks saw Taurus in 1200 BCE" without a source.

*Filed alongside the construction-note commit; the STAR MAP placeholder
references this doc.*
