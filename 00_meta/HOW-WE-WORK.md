# HOW WE WORK — Cast-and-Go Routing for Agents

> **Read this and ONLY this on cast.** Everything else is reference, loaded on demand. This file replaces the ~100 KB pre-flight burden of reading ONTOLOGY + CORE-THEMES + PROTOCOL + LANES + claim file *before doing anything*.
>
> **You still read the heavier docs — just only when you actually need them**, not as a pre-flight tax on every cast. The "When to read" pointers at the bottom tell you which doc to pull when.

---

## 1. Two lanes — what they are

Codex Atlas has two kinds of work that do **not** share a coordination model:

- **Lane A — INVESTIGATION.** Absorbing primary texts and dissecting them into the graph. Adding nodes to the 26 content folders (`01_timeline/` through `26_calendars/`). **Many agents in parallel** as long as scopes don't overlap (different documents, different slug ranges).
- **Lane B — UX.** Evolving the viewer: Pantheon V2, Forge, all views, design system, build pipeline. **One agent at a time.** App code serializes by design (parallel agents on `src/js/` repeatedly collide — the 2026-05-17 "seven-sweep" incident is the proof).

A **pre-commit hook** refuses any commit that mixes Lane A and Lane B paths. It's the safety net under everything below.

---

## 2. Routing table — match what John said to a lane

| When John says… | Lane | First action on cast |
|---|---|---|
| "work on UX" / "the design" / "the look" / "the visuals" / "the map" | **B (UX)** | Claim slot in `00_meta/ACTIVE-UX.md` |
| "Forge" / "Pantheon" / any tab name with "tweak / fix / improve / wire / make it look" | **B (UX)** | Claim slot in `00_meta/ACTIVE-UX.md` |
| "wire it up so I can see it on screen" / "show me X in the viewer" | **B (UX)** | Claim slot in `00_meta/ACTIVE-UX.md` |
| "investigate X" / "research Y" / "absorb [primary text]" | **A (investigation)** | Append row to `00_meta/ACTIVE-CONTENT.md` |
| "contribute to the Music tab" / "add to Astrology" / "fill out Sufi material" | **A (investigation)** | Append row to `00_meta/ACTIVE-CONTENT.md` — this is *content* work for that tab's data, not UX of the tab |
| "hunt the transmission of X" / "find the parallel of Y" | **A (investigation)** | Append row to `00_meta/ACTIVE-CONTENT.md` |
| "audit X" / "review the spec for Y" / "write a doc about Z" | **AUDIT-only** | New file under `AUDIT/`. No slot claim needed. |
| Genuinely ambiguous (e.g. "make Music tab better" — could be UX or content) | **Ask John FIRST.** | One-line clarification before any work |

**The ambiguous-case rule:** if the cast could plausibly be either lane, the agent's first message back to John is a one-line clarification, not a guess. Cost = 5 seconds. Catches misroutes before any work happens.

---

## 3. Confirm-on-cast — every time, no exceptions

Every agent's **first message back to John**, before any work, is:

> *"Reading this as Lane X — about to claim [slot file]. If you meant the other lane, say so now."*

Five seconds. Costs nothing. Catches:
- Misroutes the routing table missed
- Cases where John's wording was ambiguous but the agent guessed
- Cases where two agents both reasonably classified the same brief differently

No agent does silent work. The confirm-on-cast is the floor.

---

## 4. Warning rules — when to tell John instead of working

If any of these is true, **tell John before working**:

1. **Lane B slot is held.** Check `ACTIVE-UX.md` — if there's an occupied row, message John:
   > *"Lane B is held by `<other-handle>` working on `<X>`. Options: (a) wait for them to finish, (b) different lane, (c) cast me on a non-overlapping investigation instead."*
2. **Lane A scope overlaps an in-flight investigation.** Check `ACTIVE-CONTENT.md` for any row whose scope touches your intended slug range. If overlap, message John with the conflict + a proposed non-overlapping alternative.
3. **The cast spans multiple lanes in one batch.** ("Investigate Sufism AND add a Sufi tab to the viewer.") Tell John: *"This is two batches in different lanes. Recommend I cast a separate investigation agent for the Sufi material while I take the UX work, OR I do them sequentially. Which?"*
4. **The cast requires touching master files** (`ONTOLOGY.md`, `PROTOCOL.md`, `LANES.md`, `HOW-WE-WORK.md` itself, `VIEW-CONTRACT.md`). Master files are append-only-with-permission. Tell John: *"This touches master file X. Confirm I should edit, or should this be a new dated rationale doc?"*
5. **The cast requires touching the dated rationale docs** (`ONTOLOGY-RATIONALE-YYYY-MM-DD.md`). Those are append-only after sign-off. Tell John: *"This would mean overriding rationale doc X. The append-only rule says I should write a new dated rationale doc that supersedes the relevant section. Confirm to proceed."*

The warnings are not friction. They prevent the "I worked for 45 min and then realized I was in the wrong lane" pattern that wastes everyone's time.

---

## 5. The cardinal rules (you cannot violate these)

1. **Lane A may not stage paths under `src/`, `index.html`, `build_*.py`, `lint_yaml.py`, `linkcheck.py`, `fetch_*.py`, `review_thumbnails.py`, `add_depictions.py`, `_assets/`, `scripts/`.** The pre-commit hook will refuse.
2. **Lane B may not stage paths under `01_*` through `26_*` content folders** (no editing content nodes mid-UX-batch). The hook will refuse.
3. **Never `git commit --no-verify`** unless John explicitly said to. The hook is the safety net; bypassing it is logged as a protocol violation.
4. **WIRING LAW (current behaviour):** every `[[wikilink]]` must point to a real node before commit. Stub-sweep at the end of every batch. (`[[ARTHURIAN-CYCLE]]` without a target file = build hard-fails.)
5. **Commit cadence in Lane B:** every 1–2 surgical edits, not at session end. Reduces the parallel-sweep window if a content agent slips through.
6. **Confirm-on-cast every time** (§3 above).

---

## 6. The 26-lens content layout (Lane A reference)

Numbered content folders under the vault root. Each = one lens. Each holds nodes of one `type:`.

| Slot | Folder | Type |
|---|---|---|
| 01 | `01_timeline/` | (index) |
| 02 | `02_documents/` | `document` |
| 03 | `03_deities/` | `deity` |
| 04 | `04_persons/` | `person` |
| 05 | `05_events/` | `event` |
| 06 | `06_themes/` ⚠️ pending rename → `06_motifs/` | `theme` ⚠️ pending → `motif` |
| 07 | `07_traditions/` | `tradition` |
| 08 | `08_places/` | `place` |
| 09 | `09_symbols/` | `symbol` |
| 10 | `10_music/` | `music` |
| 11 | `11_alphabets/` | `alphabet` |
| 12 | `12_alchemy/` | `alchemy` |
| 13 | `13_morals/` | `moral` |
| 14 | `14_rituals/` | `ritual` |
| 15 | `15_philosophy/` | `philosophy` |
| 16 | `16_mathematics/` | `mathematics` |
| 17 | `17_medicine/` | `medicine` |
| 18 | `18_languages/` | `language` |
| 19 | `19_astronomy/` | `astronomy` |
| 20 | `20_sacred_architecture/` | `sacred-site` |
| 21 | `21_theology/` | `doctrine` |
| 22 | `22_practices/` | `practice` |
| 23 | `23_material_culture/` | `relic` |
| 24 | `24_pharmacology/` | `substance` |
| 25 | `25_divination/` | `divination-system` |
| 26 | `26_calendars/` | `calendar-system` |

**Boundary cases between lenses are documented in each folder's `README.md`.** Read the README of the lens you're about to write into.

**Rationale for every lens (academic + bars-cleared):** `00_meta/ONTOLOGY-RATIONALE-2026-05-18.md`. Read before proposing any change.

**⚠️ Build-script awareness gap:** lenses 08 + 18–26 are real on disk but `build_data.py` does not yet recognize them (queued for the next Lane B window). Investigation agents may stage nodes there; they integrate into the graph the moment the build script update lands.

---

## 7. The 7 edge buckets (Lane A reference)

Every edge in the graph belongs to exactly one bucket:

| Bucket | When | Example fields |
|---|---|---|
| **Transmission** | Historical causality, documented chain | `influences`, `influenced-by`, `ancestor-of`, `heir-of` |
| **Parallel** | Structural resemblance with no proven contact | `parallels`, `parallel-motif`, `cross-*-edges` (type: parallel-form) |
| **Association** | Ambient context | `themes`, `tradition-deity`, `tradition-doc`, `has-theme` |
| **Kinship** | Divine genealogy | `parent-of`, `child-of`, `consort`, `sibling-of` |
| **Attestation** | Documentary evidence | `attests`, `attested-in`, `authored`, `attributed-author` |
| **Polemic** | One tradition reframes another's figure as hostile | `polemic-against`, `polemic-inversion`, `appropriated-by` |
| **Fusion** | Two entities collapse into one or are explicitly identified | `equivalents`, `syncretic-edges`, `syncretic-fusion` |

Full YAML-field → bucket routing: `00_meta/ONTOLOGY.md` §3. Read when wiring edges.

---

## 8. When to read the heavier docs

You do NOT need to read these on cast. Read each only when the trigger applies.

| Doc | Trigger to read |
|---|---|
| `00_meta/ONTOLOGY.md` | About to create a new node — need the YAML skeleton + lens-by-lens fields. Or wiring edges and need the bucket-routing table. |
| `00_meta/ONTOLOGY-RATIONALE-2026-05-18.md` | Considering any ontology change. Read before opening your mouth. Append-only rule applies. |
| `00_meta/CORE-THEMES.md` | About to wire a cross-tradition pattern (flood, dying-rising god, divine kingship, etc.). Don't coin a new slug if a canonical one exists. |
| `00_meta/PROTOCOL.md` | Running a full absorb-and-dissect batch on a primary text. Has the SOP + the four laws (WIRING / INTEGRITY / GOBLIN-AUDIT / APP-CODE-SERIALIZES). |
| `00_meta/LANES.md` | Need the full path-map or the cross-lane triage procedure. Most agents won't. |
| `00_meta/DASHBOARD.md` | Need the live state (node counts, dead-link counts, priority queue). Auto-regenerated by `build_dashboard.py`. |
| `00_meta/ABSORPTION-QUEUE.md` | Picking what to absorb next. |
| `AUDIT/` | Reading existing audits before a structural batch. Or writing a new audit. |
| `AGENTS.md` | Coordination protocol detail. Read on first cast if you've never worked in this repo. |
| `VIEW-CONTRACT.md` | Lane B only — what a view module must satisfy. |
| `00_meta/HANDOFF.md` | First thing on a fresh session — current state, what's in flight, what's queued. |

---

## 9. The four master files (don't edit without permission)

- `00_meta/ONTOLOGY.md`
- `00_meta/PROTOCOL.md`
- `00_meta/LANES.md`
- `00_meta/HOW-WE-WORK.md` (this file)

Plus `00_meta/VIEW-CONTRACT.md` for Lane B work.

These are append-only-with-John's-permission. If you need to change one, **first ask** (warning rule #4).

**Dated rationale docs** (`ONTOLOGY-RATIONALE-YYYY-MM-DD.md`) are even stricter: append-only after sign-off; future overrides require a NEW dated rationale doc, never edits.

---

## 10. Casting an agent yourself (when you need help)

If you're in flight and need another agent for a parallel investigation, fire-and-forget is fine *within Lane A only* on a non-overlapping scope. Use the project's existing agent-spawning patterns (TaskCreate / `Agent` tool / sub-agent invocation per your harness).

Brief the spawned agent with:
1. This file (`00_meta/HOW-WE-WORK.md`) as their pre-flight.
2. The specific scope (which primary text, which slug range, which folder).
3. A handle (e.g. `goblin-sufi-ibn-arabi-1`) for the claim row.
4. Reminder of the confirm-on-cast rule.

Cast a Lane B agent only if Lane B is currently free, and only with John's explicit greenlight — Lane B serializes on one slot, parallel Lane B agents have been the source of every major regression in this codebase.

---

## 11. End-of-session checklist (every agent, every batch)

Before you say "done":
- [ ] Commit cadence respected (Lane B: every 1–2 surgical edits; Lane A: per logical chunk).
- [ ] Pre-commit hook passed (no `--no-verify`).
- [ ] Wiring law satisfied — no dead `[[wikilink]]` in your staged content.
- [ ] Your claim row in `ACTIVE-CONTENT.md` (Lane A) or `ACTIVE-UX.md` (Lane B) marked FINISHED with timestamp.
- [ ] One-line entry at the top of `00_meta/STATUS.md` summarizing what landed.
- [ ] If a structural finding emerged (recurring bug class, naming gotcha, new agent-pattern), save it as a feedback memory.
- [ ] If you handed off mid-flight, `00_meta/HANDOFF.md` reflects the current state.

That's the protocol. Cast confidently.
