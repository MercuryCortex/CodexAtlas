# Methodology Proposals — extensions to the existing protocol

These are proposed extensions to [methodology.md](../00_meta/methodology.md), [source-integrity.md](../00_meta/source-integrity.md), and the build pipeline. Each proposal has a rationale, a concrete shape, and (where relevant) a migration path.

---

## 1. Add edge types: `scholarly-revision-of`, `counter-formation`, `precondition-for`

The current connection-rules table covers text-to-text relations well (`parallel-motif`, `direct-quote`, `redaction-of`, `polemic-against`, `shared-milieu`, `syncretic-identification`, `manuscript-transmission`, `commentary-on`). Missing:

### `scholarly-revision-of`
Reception-history edge for scholarship-on-scholarship. Pagels → Williams → King → Brakke (the post-Pagels Gnostic-studies revision arc) is a network the vault already documents in prose but has no edge type for. Adding this lets reception history be queryable graph-side.

Example use:
```yaml
edges:
  - target: "phase-7-013-gnostic-religion"   # Jonas 1958
    type: "scholarly-revision-of"
    direction: "from"  # this node revises that node
    notes: "Williams 1996 dismantles Jonas's unified-Gnostic-Religion category."
```

### `counter-formation`
A tradition or text that defines itself *against* another. Christianity-as-canon is partly a Marcionite shadow; the Mishnah is partly defined against early Christianity; the Qurʾān is partly defined against Christology and rabbinic Judaism. Without this edge, the graph misses how negative-definition produces traditions.

### `precondition-for`
For events that *enable* later knowledge or events. Linear B decipherment is a precondition for understanding the Mycenaean stratum of Greek religion. The Boğazköy archive discovery is a precondition for the Kumarbi-Hesiod transmission to be argued at all. Nag Hammadi discovery is a precondition for the Williams 1996 / King 2003 revision wave.

### `defined-by-discovery`
For traditions whose modern reception is shaped by a discovery event. Gnosticism's modern reception is shaped by Nag Hammadi 1945. Mandaeism's modern reception is shaped by 19th-c. Western contact + Lady Drower's 20th-c. translations. Ugaritic religion's modern reception is *entirely* shaped by Ras Shamra 1928.

---

## 2. Add a `09_material/` folder for inscriptions and physical witnesses

The current data model has documents (composed texts), events (historical happenings), deities, persons, themes, traditions. **Missing layer: material witnesses.**

The Mesha Stele, Kuntillet Ajrud inscriptions, Pyrgi Tablets, Cyrus Cylinder, Behistun Inscription, Rosetta Stone (the object, distinct from the decipherment event), Black Obelisk, Tel Dan stele, Karatepe bilingual, Piacenza Liver, Antikythera mechanism, Derveni papyrus, Dunhuang manuscripts, the codex-discoveries — these are physical objects, not composed texts and not events. Currently the Mesha Stele is mentioned in the prose of [yahweh.md](../03_deities/yahweh.md) but isn't a node.

### Proposed schema
```yaml
---
type: material
id: "mesha-stele"
name: "Mesha Stele (Moabite Stone)"
date-physical-earliest: -845
date-physical-latest: -840
date-discovered: 1868
language: "Moabite"
script: "Phoenician alphabet"
medium: "basalt stele"
region: "Dhiban, modern Jordan"
museum: "Louvre"
inscribes: ["yahweh", "kemosh"]  # deities mentioned
mentions-persons: ["mesha-king-of-moab", "omri", "ahab"]
witnesses-for: ["yahweh", "kemosh", "phase-2-019-deuteronomistic-history"]
discovered-in: "event-mesha-stele-discovery-1868"
status: "metadata"
refs: [...]
tags: [material, inscription, levant, iron-age]
---
```

### Why this matters
- The vault already encodes `date-composed-earliest` and `date-physical-mss-earliest` for documents — there's an unrendered "gap between composition and earliest physical witness" that material nodes would let the timeline visualise as a *physical-attestation lane*.
- For the most contested Phase 1–2 material (e.g., Yahweh's emergence), inscriptions are the actual primary evidence; promoting them to nodes lets the source-integrity story show.
- It opens the way for an Atlas Map view (materials have findspots).

### Migration
Start with the inscriptions the vault already mentions in prose. Pass 1 should yield ~25–40 material nodes from existing-prose references — that's enough to demonstrate the value before deciding whether to systematize.

---

## 3. Geographic layer

The Atlas has Pantheon, Timeline, Documents, Themes, Connections, Traditions, All-nodes, About. **No Map view.**

For a project this much about diffusion (Mediterranean trade routes, Silk Road, Atlantic syncretism), geography is structural, not decorative.

### Minimal implementation
Add `lat` and `lng` to deity, person, document, event, and material YAML where meaningful. Build a simple Leaflet-based or D3-projection map view in `index.html`.

### Already available
Most nodes have `region` and `city-of-origin` in YAML. Geocoding these to lat/lng is mostly mechanical — a Python script consulting a known-place gazetteer (Pleiades for ancient Mediterranean; GeoNames for everything else) would do 80% of it.

The Status doc already notes "hover-map" as a recommended next move — this proposal is to make it a first-class view.

### What it unlocks
- Diffusion-over-time animations (cult of Isis Lactans spreading; Mithraism in Roman legionary garrisons; Manichaeism East-West dual diffusion).
- Geographic *gap* visibility (the vault's Korean / sub-Saharan / North Asian gaps become visually obvious).
- Cross-tradition shared milieu (which traditions co-occupied Antioch in the 2nd c.? Alexandria? Edessa? Merv? — load-bearing for "shared-milieu" edge claims).

---

## 4. Scholar-lineage modelling (separate from `04_persons/`)

The `04_persons/` folder mixes:
- Ancient religious figures (Moses, Buddha, Jesus, Mani)
- Medieval scholars (Aquinas, Ibn Arabi, Shankara)
- Modern scholars who *study* the tradition (Pagels, Williams, King, Boyce, Doniger, Eliade)

These are categorically different. Modern scholars don't belong to the religious traditions they study — they belong to the *academic study of religion*, which is itself a tradition (you have `tradition-comparative-religion-academic`). Currently a Pagels node behaves identically to a Valentinus node, which collapses an important distinction.

### Proposal
Add a `role-class` field to persons:
- `religious-founder`
- `religious-figure`
- `theologian`
- `mystic`
- `redactor`
- `polemicist`
- `scholar` (modern academic; studies the tradition rather than belongs to it)
- `controversialist` (Tier-4 figures: Sitchin, Däniken, Hancock, Murdock)
- `hybrid` (e.g., D.T. Suzuki: both Zen practitioner *and* modern academic)

The Atlas's Pantheon/Connections views could then optionally hide/show `scholar` and `controversialist` to declutter.

### Or alternatively
Keep one folder but use the existing `tradition` field consistently. `Bart Ehrman` has `tradition: comparative-religion-academic`, `Karen King` has the same. This is lower-cost but only partially solves the issue.

---

## 5. Atlas-visibility flag on Tier-4 sources

Source-integrity policy allows Tier-4 sources (Sitchin, Däniken, Hancock, Blavatsky, Hall) labeled `type: controversial`. Good policy. **But:** the Atlas currently renders these the same as Tier-1 nodes. A reader hitting "Atlantis-root-race" gets the same visual weight as Hesiod's Theogony.

### Proposal
Add to YAML: `epistemic-status: ["consensus" | "contested" | "fringe" | "rejected-but-historically-significant"]`. The Atlas viewer renders `fringe` and `rejected-but-historically-significant` nodes with a visual diacritic (dashed border, faded color, a "⚠ Tier 4" badge) so readers can't accidentally read Hancock as a peer of Boyce.

Without this, the project's "we catalog without advocacy" stance is *fragile* — a screenshot of the Hancock node out of context can be misused.

### Bonus
The `epistemic-status` field also gives readers a clean filter: "show me only consensus nodes" should yield ~85% of the vault; "show me contested" yields Jesus-myth, Jesus-Panthera, Atlantis cluster, Sitchin, ancient-astronaut, hyperdiffusionism.

---

## 6. Versioning and dating conventions

The methodology specifies BCE/CE (good) and negative-integer YAML for BCE (good). Two gaps:

### Date ranges should be machine-readable
Currently `date-composed-earliest: -1500` and `date-composed-latest: -600` for Zoroaster. Some nodes use ranges of 1900 years (the Phoenician high god has Bronze Age + Iron Age + Punic + Hellenistic-Carthaginian phases). For nodes spanning >500 years, consider:

```yaml
periods:
  - phase: "Early Bronze Age cult"
    earliest: -2500
    latest: -2000
  - phase: "Iron Age Phoenician"
    earliest: -1200
    latest: -600
  - phase: "Punic Carthaginian"
    earliest: -800
    latest: -146
```

This is heavier YAML but enables more honest timeline rendering and avoids the "1900-year smear" that distorts the timeline view.

### Inscriptional vs. textual dates
For documents that are quoted in inscriptions earlier than their compositional date (e.g., Deuteronomy in 7th-c. Josiah's reform but with Mosaic claims), add a `date-earliest-attestation` distinct from `date-composed-earliest`. The methodology has `date-physical-mss-earliest` (manuscript), but Iron Age inscriptions referring to a text are not "manuscripts."

---

## 7. The `_phase-N-NNN-slug.md` convention is fragile

The current naming `phase-1-001-kesh-temple-hymn.md` puts both phase AND a sequence number in the filename. This causes two problems:

- **Renumbering** is fraught: if you insert a new Phase 3 document at position 005, you'd renumber all subsequent Phase 3 files, breaking every incoming wikilink. The dead-link table already shows symptoms of this: callers reference `phase-3-024-suetonius-twelve-caesars` but Phase 3 stops at 023, and `phase-3-024-natyashastra` exists at that slot. Number collisions are guaranteed at scale.

- **Slug expressiveness** is constrained: `phase-4-046-john-of-damascus-exposition-orthodox-faith` is 50 characters of which only the last 36 carry information.

### Proposal
Drop the sequence number; keep the phase prefix as a coarse sort key.

```
phase-1-kesh-temple-hymn.md
phase-3-suetonius-twelve-caesars.md
phase-4-john-of-damascus-exposition.md
```

For ordering within a phase, use the YAML date field (build_dashboard.py already sorts by it for the priority queue).

### Migration path
- One-shot script rewrites every filename + every incoming wikilink.
- All sequence-number-based dead-links become resolvable (the script knows the mapping).
- Future inserts don't renumber anything.

If breaking this convention is too disruptive, an alternative: keep sequence numbers but never reuse them after deletion (gaps are fine), and document the rule in methodology.

---

## 8. Promote `canonical-slugs.md` to a build-time check

[canonical-slugs.md](../00_meta/canonical-slugs.md) exists but isn't actively enforced. Make `build_dashboard.py` (or a new `lint_slugs.py`) emit an error when:

1. A new node is created without first appearing in canonical-slugs.
2. A wikilink references a slug not in canonical-slugs *and* not an existing file (i.e., genuine dead-link, not just slug drift).
3. A canonical-slugs alias points to a slug that doesn't exist.

This is the single highest-leverage technical change available. Without it, agents will keep drifting slugs because the cost of drifting is zero at the moment of drift.

---

## 9. Per-tradition completeness scorecards

The DASHBOARD shows global inventory (1216 nodes total). It would be more useful to show *completeness* per tradition:

```
Tradition         | Deities | Documents | Persons | Events | Themes | Refs/node avg
mesopotamian      |    18   |    11     |   12    |   3    |   8    |    3.2
egyptian          |    18   |     6     |    5    |   2    |   5    |    3.4
chinese           |     2   |     2     |    3    |   0    |   0    |    1.5   ← OBVIOUS
yoruba            |     7   |     1     |    1    |   0    |   3    |    1.8
korean            |     0   |     0     |    0    |   0    |   0    |    -     ← TOTAL GAP
```

This makes coverage gaps obvious at a glance and aligns the agents' priority queue with the project's stated mission of equal weight across traditions.

---

## 10. Status discipline: enforce the bar in build_dashboard.py

`build_dashboard.py` already detects "status:metadata but only 1 refs" as a quality issue. Extend:

- "status:metadata but no `themes` array" — block on it.
- "status:metadata but no Connections section in body" — block on it.
- "status:metadata but no Disputes section *and* exists conflicting refs" — flag it.
- "status:partial but only 3 refs" — already flagged. Good.

Currently the dashboard *reports* these, but the work queue doesn't *prioritise* fixing them above adding new stubs. Either reverse that — fix quality before adding scope — or leave the choice explicit to the project lead each session.

---

## 11. Add a `30_about/` folder for project-level commentary

The audit recommendations imply the project should *think about itself* more visibly: which traditions it covers well, what its constitutive biases are (Mediterranean / Levantine / Iranian over East Asian / sub-Saharan / Indigenous), what its source-tier distribution looks like, what its political-religious positioning is.

A `30_about/` folder with a `constitutive-biases.md`, `coverage-self-assessment.md`, and `editorial-stance.md` would let the project meet that demand without burying it in `00_meta/`. The current README is excellent at "what we are doing" — it doesn't address "what we are *not* doing" or "what our intellectual lineage is" (the project's own placement within tradition-comparative-religion-academic).
