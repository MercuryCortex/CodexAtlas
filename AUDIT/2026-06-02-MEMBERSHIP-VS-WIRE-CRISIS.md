# 🚨 MEMBERSHIP-VS-WIRE CRISIS — ZERO-TOLERANCE DIAGNOSTIC (2026-06-02)

**STATUS: ARCHITECTURAL DEFECT CONFIRMED. STOP ALL CLASSIFICATION WORK. DO NOT PATCH. READ THIS FULLY BEFORE TOUCHING ANYTHING.**

This document exists because John identified a foundational error in the vault's data model. A fresh agent must understand it completely before doing any further work on traditions, families, role-tokens, or any classification. Patching individual nodes (the trap the previous agent fell into) makes the problem worse.

---

## §1 — THE PRINCIPLE JOHN STATED (verbatim, 2026-06-02)

> *"if a character appears in a family, HE IS THAT FAMILY POINT BLANK PERIOD FULL STOP. associations with other families will be WIRED or paths by AUTHORS or WTVER transmits them. I suspect all your methodology is wrong and all work is compromised."*

Decoded into the architectural rule:

1. **Every node has ONE home family — its origin / native tradition. Singular. Full stop.** This determines its wedge placement on the wheel.
2. **A node's appearances, adoptions, venerations, and reinterpretations in OTHER traditions are NOT memberships. They are WIRES (edges).** Those wires are carried by the documents / authors / events that transmit the figure across the boundary.
3. **The wires ARE the entire point of the project.** Per the architectural north-star (`project_scripture_is_the_root_of_truth_2026-05-30`, `feedback_massive_wins`): the cross-tradition transmission is the investigative gold ("MASSIVE WINS"). Collapsing cross-tradition reach into node membership **ERASES the wire** — and the wire is the deliverable.

---

## §2 — THE CONCRETE FAILURE (Seth)

**What the vault currently does:**

```yaml
# 04_persons/seth.md
tradition: "Hebrew Bible; Sethian Gnostic Christianity; Mandaeism (as Šitil); Islam"
role-tokens: ["patriarch-antediluvian", "gnostic-redeemer-figure", "prophet-abrahamic"]
```

`build_data.py tradition_family()` reads that multi-valued string and — because its order-rules check `gnostic`/`sethian` BEFORE `hebrew`/`israelite` — places Seth in the **GNOSTIC** wedge.

**Why this is catastrophically wrong:**

- Seth ORIGINATES in the Hebrew Bible (Genesis 4-5, third son of Adam, antediluvian patriarch). His home family is **Israelite / Hebrew Bible. Full stop.**
- The Sethian-Gnostic Seth, the Mandaean Šītil, the Islamic Shīth are **TRANSMISSIONS** — later traditions that ADOPTED the Hebrew figure. Each adoption is a wire:
  - Hebrew Seth → Sethian Gnostic redeemer-figure (carried by *Apocryphon of John*, *Three Steles of Seth*, *Allogenes*)
  - Hebrew Seth → Mandaean Šītil (carried by Mandaean *Ginza Rba*, *Book of John*)
  - Hebrew Seth → Islamic prophet Shīth (carried by al-Tabari, Ibn Kathir prophet-lists)
- **By cramming all four into the `tradition:` field, the vault: (a) puts Seth in the wrong wedge, (b) makes the four transmission-wires INVISIBLE — there is no edge showing "the Hebrew Seth was adopted into Gnostic theology," because the adoption was collapsed into membership.**

The single most investigatively-valuable thing about Seth — that one Hebrew genealogical figure became a cosmic redeemer in Gnosticism, a light-being in Mandaeism, and a prophet in Islam — is **destroyed** by the current model. That transmission story is exactly what the project exists to surface.

---

## §3 — SCOPE (this is NOT a Seth problem)

Measured 2026-06-02:

| Node type | Multi-valued `tradition:` | Total | % |
|---|---|---|---|
| Deities (`03_deities/`) | **374** | 718 | **52%** |
| Persons (`04_persons/`) | **384** | 1217 | **32%** |

Examples of the multi-valued pollution (persons):
- `"Hebrew Bible; Christian Bible; Quran; Sethian and Valentinian Gnosticism; Hermetism; Kabbalah; Mandaeism"` (7 traditions in one field — this is Adam / Anthropos)
- `"Marcionite → Apellean"`
- `"Latin Christian (Anglo-Saxon → Frankish)"`
- `"Islam — Sunnī (...); Shīʿī (...)"`

**Over half the deity corpus and a third of the person corpus carry this defect.** The `tradition_family()` function in `build_data.py` is a ~150-line pile of order-dependent special-case heuristics (`if "gnostic" in s or "sethian" in s ... return "Gnostic"`) whose entire job is to guess the "origin" family out of a polluted multi-valued string. It guesses wrong constantly (Seth → Gnostic is one example; there are likely hundreds).

---

## §4 — WHAT THE PREVIOUS AGENT (me) DID WRONG

Brutal honesty, because the fresh agent must not repeat it:

1. **I built an entire `role-tokens:` migration (commits `6e03acb5` through `1a75c39c`) without ever questioning whether the underlying membership model was sound.** I treated "what family is this figure in" as a solved problem and layered a multi-role classification on top of a broken multi-membership foundation.

2. **I made `role-tokens:` ITSELF multi-family**, which amplifies the error. Giving Seth `[patriarch-antediluvian, gnostic-redeemer-figure, prophet-abrahamic]` encodes the same membership-confusion in a second field. A role that belongs to a DIFFERENT family than the node's home (Seth is Hebrew; `gnostic-redeemer-figure` is a Gnostic role) should have been a WIRE, not a node-property.

3. **I patched Seth repeatedly** — first adding `gnostic-redeemer-figure`, then re-leading with `patriarch-antediluvian` — when the real problem was structural. **This is exactly the rule #10 LOOP-DETECTION PROTOCOL violation I was supposed to catch in others.** I was applying band-aids to symptoms of an architectural defect. The third patch is what made John call the whole methodology into question — correctly.

4. **I never asked "should this be a membership or a wire?"** That question is the entire crux, and I never posed it.

---

## §5 — WHAT IS AND ISN'T COMPROMISED (precise, so the fresh agent knows where to look)

John said *"all work is compromised."* That is an overstatement in literal scope but CORRECT in spirit — the most important data (cross-tradition figures, which are the MASSIVE-WINS) is compromised. Precise breakdown:

**COMPROMISED (must be re-examined):**
- ❌ `tradition:` field on ~52% of deities + ~32% of persons (multi-valued → wrong family).
- ❌ `family:` / wedge placement derived from those fields (the whole wheel layout for affected nodes).
- ❌ `role-tokens:` migration where roles span families (the cross-tradition figures — Seth, Adam, Zoroaster, the Enochic figures, syncretic deities, etc.). The SINGLE-family figures (most of the 384 migrated) are probably fine.
- ❌ `tradition_family()` in `build_data.py` — the order-dependent heuristic pile is a symptom, not a fix. It exists ONLY because the data is polluted.

**NOT compromised (safe):**
- ✅ The date audit (Pass-3, commits `2441e4d8`/`745e0200`/`66feb967`) — dates are dates.
- ✅ The EDGE data itself (`syncretic-edges`, `equivalents`, `parallels`, `attested-in`, `appropriated-by`, `influenced-by`). **These are the CORRECT model and already exist.** The fix direction is to MOVE cross-tradition info OUT of membership fields and INTO these edges (many wires may already exist; the membership pollution is redundant AND wrong).
- ✅ The controlled-vocab INFRASTRUCTURE (registry / validator / provenance-display pattern, commits `6e03acb5`/`4fa98ba0`). The machinery is sound; it's the role-tokens DATA and the tradition DATA that's wrong. The provenance display works — it just currently displays wrong classifications.

**NEEDS A JOHN DECISION (genuinely debatable):**
- ⚠️ `canonical-corpus:` on documents (commit `458da380`). A scripture book can be canonical in multiple living canons (e.g., Genesis is in the Jewish Tanakh AND the Christian Bible). Is that multi-membership legitimate, or should it also be "originates in one tradition, adopted by others via wires"? This is a real question for scripture that does NOT have the same obvious answer as it does for figures. **Do not assume; ask John.**

---

## §6 — THE FIX DIRECTION (for the fresh agent to DESIGN WITH JOHN — do NOT rush-build)

This is a re-architecture, not a patch. The previous agent's failure was rushing. The fresh agent's job is to **design the correct model with John's ratification BEFORE writing migration code.**

The shape of the correct model (to be ratified, not assumed):

1. **`tradition:` (and the derived `family:`) becomes SINGULAR — the home/origin tradition.** One value. This determines wedge placement.
2. **Cross-tradition reach moves to EDGES.** For each tradition currently crammed into a node's `tradition:` field that is NOT its origin, there should be a wire — carried by the transmitting document/author — expressing the adoption/transmission/reinterpretation. Use the existing edge vocabulary (`attested-in`, `appropriated-by`, `syncretic-*`, `parallel-*`, `influenced-by`). Many of these wires may already exist (the membership pollution is often redundant with existing edges).
3. **`role-tokens:` decouples from family.** A role is a role; family is separate. A node can have multiple roles WITHIN its home family (Aquinas: theologian + Doctor-of-the-Church + monastic — all Catholic). But a role belonging to a DIFFERENT family (Seth's `gnostic-redeemer-figure`) is the figure's role IN THAT OTHER TRADITION'S TEXTS — which is edge-metadata on the transmission wire, not a node-property.
4. **`tradition_family()`'s heuristic pile mostly DELETES** once `tradition:` is singular — there's no multi-valued string left to disambiguate.

**Hard questions the fresh agent must resolve WITH John before building:**
- How is "origin tradition" determined for genuinely contested cases? (Adam — Israelite, presumably. But figures with murky origins need a rule.)
- What edge-type expresses "tradition X later adopted this figure"? Is there an existing one, or is a new edge-type needed?
- For role-tokens that currently span families: which roles move to edges, which stay? (Probably: the role in the home tradition stays as a node role-token; roles in adopting traditions become wire-metadata.)
- The `canonical-corpus` multi-membership question (§5) — decide separately for scripture.
- Migration order + verification: how to migrate 374 deities + 384 persons without silently losing the cross-tradition information (it must move to edges, not vanish).

---

## §7 — ZERO-TOLERANCE RULES FOR THE FRESH AGENT

1. **DO NOT patch individual nodes.** Seth, Adam, Zoroaster — leave them. Patching is the trap.
2. **DO NOT build a migration before John ratifies the model.** The previous agent built first, asked never. That caused this.
3. **DO NOT assume the `canonical-corpus` scripture case has the same answer as the figures case.** Ask.
4. **DO apply rule #10 (LOOP-DETECTION):** if you find yourself patching a second cross-tradition figure the same way, STOP — you're in the loop.
5. **DO treat the existing edge data as the source of truth for cross-tradition reach.** The fix moves data INTO edges, it does not invent new memberships.
6. **DO verify with John using the screenshot/visual criterion** (`feedback_describe_what_human_sees`): after any fix, Seth must appear in the ISRAELITE/HEBREW wedge, with his Gnostic/Mandaean/Islamic significance visible as WIRES.
7. **The MASSIVE-WINS architecture is the acceptance test.** If a fix makes a cross-tradition transmission MORE visible as a wire, it's right. If it collapses a transmission into membership, it's wrong.

---

## §8 — WHAT TO TELL JOHN FIRST

Before any work: confirm you understand §1 (the principle) and §2 (the Seth failure), then ask him the §6 hard questions ONE AT A TIME, getting ratification before building. Do not present a finished migration. Present the model, get sign-off, then build.

The previous agent's epitaph: *built a 170-token classification system on a foundation that puts 52% of deities in the wrong family and erases the transmission wires that are the entire point of the project.*

Do not extend that work. Re-found it.
