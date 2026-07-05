# Branch-Population Benchmark — the all-lens wiring template (2026-07-05)

**John's ask (2026-07-05):** *"from these [top-transmission] roots find transmission that
would populate all our lenses in a branch … getting into LAW lenses or Philosophy … that's
the exercise benchmark for us to have a guide moving onwards."*

This doc is the **template**: what a *fully-populated branch* looks like — one transmission
root, followed by its wires until **every lens lights up**, especially the dark "civilization"
lenses (Law, Philosophy, Math, Astronomy, Medicine, Divination, Music, Calendars).

Pilot root: **Tiamat** (the flagship "the deep" headwater; anchor text = **Enuma Elish**).

---

## 1. The premise — a branch must reach every lens

The Atlas's value is transmission (wires), not catalogue. A *root* is a high-transmission
node (see the top-10 ranking). A *branch* is that root plus everything its wires reach.
The benchmark: a healthy branch touches **all ~29 lenses** — because a real cosmogonic root
genuinely radiates into law, number, the stars, medicine, and rational philosophy. Where a
lens is dark, the transmission exists but the **wire** is missing.

## 2. The heat-map (Tiamat branch, before this run)

Files mentioning branch tokens (`tiamat|marduk|apsu|tehom|enuma-elish|chaoskampf|primordial…`):

| Rich (spine) | | Dark / thin (the targets) | |
|---|---|---|---|
| deities | 186 | **philosophy** | **1** |
| documents | 87 | **astronomy** | **1** |
| symbols | 78 | divination | 1 |
| themes | 61 | **medicine** | 2 |
| architecture | 26 | **mathematics** | 3 |
| theology | 14 | calendars | 3 |
| events | 13 | **law / morals** | **7 (thin)** |
| | | music | 7 |

## 3. The finding that reframes the whole exercise: **node-rich, WIRE-poor**

The dark lenses are **not** dark for lack of nodes. Grep-verifying every candidate endpoint:

| Lens | Endpoint | Existed already? |
|---|---|---|
| Law | `hammurabi`, `phase-1-007-code-of-hammurabi`, `utu-shamash` (sun-god of justice/law) | **✓ all existed, un-wired** |
| Astronomy | `astronomy-mul-apin`, `phase-1-019-enuma-anu-enlil` | ✓ existed, un-wired |
| Math | `mathematics-sexagesimal-babylonian` | ✓ existed, un-wired |
| Divination | `extispicy-mesopotamian` | ✓ existed |
| Music | `music-hurrian-hymns` | ✓ existed |
| Philosophy | `thales`, `anaximander` (as **persons**) | ✓ — but the **concept** node was missing |

**So the lenses light by WIRING, not creating.** Only one genuine concept-gap in the marquee
lenses — and it was a *live dead-link with inbound demand*: `anaximander → [[apeiron]]` pointed
at a node that didn't exist. Creating it *closes* the gap **and** lays the flagship
Mesopotamia→Ionia philosophy wire. (This is the master-plan thesis in one screenshot.)

## 4. The through-line (the investigation thesis this branch proves)

> **Marduk's defeat of Tiamat — the ordering of the chaos-deep into cosmos — is the source-act
> from which an entire civilization's ordered domains descend, and which transmits west into
> Greek rational philosophy.**

- → the **stars & calendar** (Enuma Elish V fixes the constellations, the year, the month → MUL.APIN)
- → **number** (that celestial order is computed in sexagesimal base-60 — our clock and circle)
- → **law** (Marduk's victory legitimates kingship; Shamash hands the king *kittum u mīšarum*,
  truth-and-justice → the Code of Hammurabi) — the same cosmic-order-as-law as Vedic *ṛta*,
  Egyptian *ma'at*, Stoic natural law (the cross-tradition wires)
- → **omens** (reading the ordered heavens → extispicy / Enuma Anu Enlil)
- → **philosophy** (Miletus rationalizes the water-cosmogony: Thales' water-arche, Anaximander's
  *apeiron* — the boundless deep stripped of personality and made a first principle)

## 5. What this run shipped (the proof slice — Law + Philosophy + Astronomy + Math)

All wires in **registered** edge fields (verified live in `data.js`), T1-sourced, reciprocal:

- **CREATE** `15_philosophy/philosophy-apeiron.md` — Anaximander's Boundless. Closes the
  `anaximander → apeiron` dead link (baseline 339→**338**). Singular home tradition
  (`tradition-ancient-greek`); cross-tradition reach to `primordial-waters`/`tiamat` carried as
  **sourced wires** (West 1971, Burkert 1992) with the transmission-vs-convergence debate kept open (KRS 1983).
- **WIRE — Philosophy:** `primordial-waters ↔ philosophy-apeiron`; `apeiron` key-figures `thales`+`anaximander`.
- **WIRE — Law/Morals:** flipped `wisdom-as-cosmic-order` `stub→developing`; added Mesopotamian
  instance (`utu-shamash`) + appearances (`enuma-elish`, `code-of-hammurabi`) + parallels
  (`moral-rta-cosmic-order`, `moral-natural-law`); `utu-shamash → wisdom-as-cosmic-order`;
  `enuma-elish → wisdom-as-cosmic-order`.
- **WIRE — Astronomy:** `enuma-elish → astronomy-mul-apin` (cosmogony establishes celestial order)
  + reciprocal `astronomy-mul-apin → enuma-elish` (Horowitz 1998; Rochberg 2004).
- **WIRE — Math:** `mathematics-sexagesimal-babylonian → astronomy-mul-apin` (base-60 is the
  computational substrate of the celestial order; Robson 2008).

**15 new live edges. Gate green:** build 0 · linkcheck no-regression (339→338) · lint 0 errors.

## 6. The reusable TEMPLATE (apply to any root)

For a chosen root, walk **every lens** and ask *"what does this branch reach here, and is it wired?"*

1. **List the lenses** (the 29 folders). For each, grep the root's key tokens → is there an endpoint?
2. **Classify each endpoint:** (a) exists + wired ✓; (b) **exists + un-wired** → WIRE (cheap, do first);
   (c) genuinely missing + carries inbound demand → CREATE (headwater-first); (d) missing, no demand → skip.
3. **Wire only through REGISTERED edge fields** (see §8) — never `hub-edges` (inert). Reciprocate. Source at T1.
4. **Keep membership singular** — the endpoint's home tradition stays its origin; cross-reach = the wire.
5. **Gate every batch:** `build_data` 0 · `linkcheck --baseline` no-regression · `lint_yaml --strict` 0.
6. A branch is "populated" when every lens is either wired or explicitly marked *no-endpoint*.

## 7. Continuation worklist (the rest of the Tiamat branch — not yet done)

- **WIRE (cheap):** Divination — `extispicy-mesopotamian`/`enuma-anu-enlil` → cosmic-order/enuma-elish.
  Music — `music-hurrian-hymns` → temple liturgy/enuma-elish. Calendars — the Akitu/lunisolar calendar.
  Architecture — Esagila/ziggurat → enuma-elish (Tablet VI). Symbols — already dense.
- **CREATE (genuine gaps, demand-ranked):** `plimpton-322` (math tablet), `babylonian-medicine` /
  Sakikkū Diagnostic Handbook (medicine — lens near-empty), `babylonian-calendar` (calendars).
- **Cross-tradition law/philosophy wires:** ma'at ↔ rta ↔ asha ↔ natural-law already partly linked
  via `wisdom-as-cosmic-order`; extend to Chinese *tian/dao*, and to the Milesian → Heraclitean *logos*.

## 8. ⚠️ Bug found in passing — `hub-edges` is INERT (flag, don't fix here)

`hub-edges:` is used by **31 nodes** (incl. `enuma-elish` itself — its wires to
`theme-rebel-against-the-divine`, `serpent-dual-nature`, `theme-mesopotamian-gnostic-transmission`)
but is **not registered** in `build_data.py` → it emits **zero graph edges**. Those are richly-sourced
transmission claims sitting *invisible*. This is the "wire-poor" disease in miniature.
- **Registered fields that DO emit** (use these): generic — `themes parallels influenced-by influences
  deities-mentioned attested-in equivalents parent-of child-of consort key-* originator-of mentioned-in
  events-participated participants appearances deity-instances`; structured (sourced) — `syncretic-edges
  cross-tradition-parallels cross-tradition-edges cross-moral-edges cross-symbol-edges cross-alphabet-edges
  cross-music-edges cross-alchemy-edges cross-ritual-edges connects-to connections cross-links`.
- **Fix (Lane B, separate):** register `("hub-edges", "hub-edge", "hub-")` in `STRUCTURED_EDGE_FIELDS`
  (targets are sometimes bare slugs → the bare-slug path handles it), rebuild, re-baseline linkcheck
  (will resolve a batch of currently-inert wires — the count only improves). Swept vault-wide, not per-file.

## 9. Applying to the other roots (next benchmarks)

- **Indra / Vedic** — the tradition is natively lens-complete (dharma=law, Sulba Sutras=math,
  Jyotisha=astronomy, Ayurveda=medicine, Vedanta=philosophy, Samaveda=music) → best test of *direct*
  lens hits + the *Perkwunos* + chaoskampf(Vritra) transmission wires.
- **Zeus / Greek** — the widest interpretatio hub; richest **philosophy** lens (Plato→Stoics) + math
  (Euclid) + astronomy (Ptolemy, itself inheriting Babylon — a wire back to this branch).

One engine, many roots; each run wires more of the same lens-grid and the dead-endpoint floor drops.

---

## 10. Final coverage tally — the Tiamat branch across all 29 lenses (after runs 1 + 2)

Run 2 added: **esagila** → Enuma Elish + Marduk (architecture), Enuma Elish → **akitu** (rituals),
**cuneiform** → Enuma Elish (writing), and **CREATE `babylonian-calendar`** → Enuma Elish + MUL.APIN
+ sexagesimal + the Chinese Metonic parallel (calendars). Gate green; 9 more live edges.

**This is what a populated branch looks like — honest, not padded:**

| Status | Lenses | Note |
|---|---|---|
| **✅ LIT — wired to the branch** (≈17) | deities · documents · themes · symbols · traditions · theology · events · **philosophy**🆕 · **law/morals**🆕 · **astronomy**🆕 · **mathematics**🆕 · **architecture**🆕 · **rituals**🆕 · **alphabets/writing**🆕 · **calendars**🆕 · divination (2-hop via extispicy→MUL.APIN→Enuma Elish) | 🆕 = lit by this exercise |
| **🔌 ENDPOINT EXISTS — one wire away** (≈6) | medicine (`medicine-mesopotamian-temple`) · music (`music-hurrian-hymns`, adjacent — to Nikkal not Marduk) · technology (`architectural-corbel-arch-mesopotamian`) · languages (Akkadian/Sumerian) · pharmacology (materia medica) · exchange (`lapis-lazuli-trade`) | node exists, wire deferred — cheap continuation |
| **🕳 GENUINE GAP — node missing** (≈2) | **places (Babylon has no node — only Sumerian Ur)** · math tablet `plimpton-322` | create, demand-ranked |
| **⬜ NO-ENDPOINT — honestly off-branch** (≈4) | consciousness · attire · material-culture (no cylinder-seal node) · alchemy (Hellenistic-later) | a cosmogony root legitimately doesn't reach these; marking it is the point |

## 11. REACH-TO-TODAY is a required axis (John, 2026-07-05 — "till today's / as modern as possible")

A branch is **not populated until it lands in the present.** The original exercise mandate had
TWO axes — *all lenses* AND *till today's* — and lens-breadth in antiquity is only half. A
transmission that stops at Aquinas is not a transmission to **us**. So every branch must be
carried forward to its most-contemporary terminus (a living practice, a still-used institution,
or the modern discipline that re-synthesized it). Same node-rich/wire-poor rule: the modern
bridge nodes almost always already exist (150 persons ≥1700, 108 ≥1900) but dangle un-wired.

**The four branches' modern termini (wired 2026-07-05):**
- **Tiamat** → living astrology (`divination-astrology-comparative`, 2026) · Jung + Campbell (chaoskampf → the monomyth) · base-60 still in every clock/circle.
- **Indra** → `swami-vivekananda` (neo-Vedanta to the modern West, 1893) · `yoga-asana-postural` (global modern yoga) · living Ayurveda.
- **Hermes** → `helena-blavatsky` / Theosophy · `aleister-crowley` / Thelema · `tradition-new-age` (the living occult revival) · Jung (alchemy → depth psychology).
- **Jesus** → `john-locke` → **`moral-human-rights`** (natural law → natural rights → UDHR 1948, the modern moral lingua franca) · neo-Thomism (living).

**Checklist addition:** a branch's coverage grid (§10) now has a fifth bucket — **⏩ REACH-TO-TODAY**: does the chain terminate in a living/contemporary node? If it dead-ends before ~1700, the branch is unfinished.

---

**The benchmark result:** from ONE transmission root, following real wires, **~17 of 29 lenses light up**,
another ~6 are a single wire away, only ~2 are true node-gaps, and ~4 are honestly out of branch.
And the dominant cost was **wiring existing nodes**, not creating new ones — the thesis, proven end-to-end.
This coverage grid is the template: run any root against it and fill the same four buckets.
