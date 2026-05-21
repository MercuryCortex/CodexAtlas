# HANDOFF — Bridge-Hub Cross-Lens Wiring (2026-05-21)

> **Read this first if you're a fresh agent picking up Lane A bridge-wiring work.** Status as of commit `6e08871`. Read `STATUS.md` top entries for the per-phase detail; this file is the synthesis.

---

## What just happened (Phases 1–12)

Twelve phases of progressive vault densification:

| Phase | What | Edges added |
|---|---|---|
| 1–5 | 676 deity sentinel-sweep | (baseline cleanup) |
| 6 | 8 duplicate clusters resolved | (consolidation) |
| 7 | Top-5 most-cited themes promoted to RANK A + 8 substantial bridge hubs deity-wired | — |
| 8 | 14 missed-bridge hubs (second-pass survey) deity-wired | (deity-end ~100) |
| 9 | Dead-link follow-ups + Trinity completion (holy-spirit-christian.md created) | — |
| 10 | Person-end audit (04_persons → 06_themes) | ~50 |
| 11 | Document-end audit (02_documents → 06_themes) | ~70 |
| 12 | Tradition-end audit (07_traditions → 06_themes) | ~104 |
| **TOTAL** | **~330 hub-edges across 28 substantial bridge hubs from 4 lens-poles** | |

**Vault baseline dead-link count: 594/823. Unchanged across all 12 phases. WIRING LAW held — 0 dead links shipped across ~140 commits.**

---

## The dogma (READ BEFORE TOUCHING ANYTHING)

John's lens-discipline directive: **every edge must explicitly label its lens-pair in the `notes:` field**, e.g.

```yaml
notes: "Cross-lens: 04_persons → 06_themes. [scholarly context]"
```

Every Phase 10/11/12 edge follows this pattern. **A fresh agent must continue it.** The 26-lens ontology is documented in `00_meta/ONTOLOGY-RATIONALE-2026-05-18.md`.

---

## The 28 substantial bridge hubs (the wiring targets)

These are the cross-tradition hubs you wire FROM other lenses TO. Memorize the slugs:

### Major (4+ lens-poles already wired)
1. `theme-soma-haoma-eucharist` (231L) — PII→Vedic→Avestan→Dionysian→Eucharist 3,500-year ritual chain
2. `soul-exile-longing` (232L) — cross-tradition mystical-exile pattern
3. `theme-manichaeism-synthesis` (193L) — first global religious synthesis
4. `hermetic-transmission-chain` (187L) — Alexandria → modern-esotericism 2,300-year spine
5. `persian-period-injection` (175L) + `theme-zoroastrian-jewish-exchange` (156L) — paired, six-channel exchange
6. `merkabah-miraj-ascent-chain` (199L) — Ezekiel → Hekhalot → Mi'raj → Paradiso
7. `zeus-pantokrator-transmission` (235L) — Phidias → Pantokrator iconographic hypothesis
8. `theme-mesopotamian-gnostic-transmission` (~292L) — 5 chains via Pearson 2007
9. `theme-egyptian-gnostic-transmission` (~317L) — 5 chains via Fowden 1986

### Mid-tier
10. `asura-deva-inversion` (165L), `theme-asha-druj-cosmic-opposition` (170L), `theme-satan-angra-mainyu-transfer` (168L) — Zoroastrian cluster
11. `theme-two-powers-in-heaven` (167L), `theme-holy-spirit-sophia` (166L), `theme-el-yahweh-merger` (131L) — Jewish-Christian cluster
12. `theme-solomonic-transmission-spine` (129L), `templar-gnostic-transmission-hypothesis` (110L), `afro-diasporic-syncretism` (100L)
13. `theme-gandharan-buddhism` (207L), `theme-dying-founder-paradigm` (150L), `executed-divine-claimant` (165L)
14. `occultation-hidden-imam` (157L), `neoplatonic-henosis` (126L), `third-century-collision-zone` (138L)
15. `bmac-proto-zoroastrian` (140L), `theme-akhenaten-moses-monotheism-thesis` (138L), `heliopolis-ennead` (151L), `theme-zoroastrian-cosmogony` (128L)
16. `serpent-dual-nature` (147L), `theme-rebel-against-the-divine` (138L), `messianic-genealogy` (144L), `alchemy-as-spiritual-discipline` (159L)

### Architectural / linguistic (NOT deity-end — properly cross-lens to 20_sacred_architecture + 02_documents)
- `theme-ziggurat-as-stairway-to-heaven`, `theme-stupa-as-cosmic-mountain`, `theme-round-church-as-anastasis-imitatio`, `theme-paradise-etymology`, `theme-axial-age`

**Structural finding from Phases 8-12: not every theme-hub takes deity/person/document/tradition back-edges.** Some are properly cross-lens to specific other lenses only (architectural hubs → 20_sacred_architecture; linguistic hubs → 02_documents). Don't force back-edges into hubs that don't accept them.

---

## What's queued next (the work to pick up)

### Phase 13 — Event-end audit (`05_events/` → `06_themes/`)
- ~25 priority events, ~50 edges expected
- High-leverage events: `event-cyrus-conquest-of-babylon-539-bce`, `event-ficino-corpus-hermeticum-translation-1463`, `event-mani-execution-274-or-277`, `event-bruno-execution-1600`, `event-council-of-florence-1439`, `event-crucifixion-of-jesus-c30ce`, `event-bab-execution-1850`, `event-karbala-680`, `event-execution-of-al-hallaj-922`, `event-school-of-alexandria-300bce-415ce`, `event-casaubon-redates-hermetica-1614`, `event-trial-of-templars-1307-1314`, `event-albigensian-crusade-1209-1229`, `event-nag-hammadi-discovery`, `event-hagia-sophia-construction-537`, `event-iconoclast-controversy-726-843`, `event-muhammads-miraj-619`, `event-hegira-622`
- Pattern: each event's YAML may have `themes:` or `related-themes:` array → add `hub-edges:` block above `status:` line same as Phase 10-12

### Phase 14 — Symbol-end audit (`09_symbols/` → `06_themes/`)
- ~15 priority symbols, ~30 edges expected
- High-leverage: `vine-grape`, `wheat-grain`, `tauroctony`, `halo-nimbus`, `ouroboros`, `mount-meru`, `axis-mundi`, `sacred-fire-atash`, `haoma-zoroastrian` (cross-lens — also a deity), `peyote`, `amanita-muscaria`, `eleusinian-kykeon`, `ayahuasca`, `faravahar`

### Phase 15 — Place-end audit (`08_places/` → `06_themes/`)
- ~10 priority places, ~20 edges expected
- High-leverage: Alexandria, Babylon, Konya, Damascus, Rome, Mecca, Jerusalem, Hermopolis, Mystras

### Separate non-wiring tasks (lower priority)
- **Vault-wide 594-target dead-link sweep** — the long-standing pre-existing baseline (~80% are auto-generated A2-batch stubs needing content)
- **5 medium-stub theme promotions** in 60–80L range: `theme-baal-set-syncretism`, `bronze-age-substrate-of-greek-religion`, `syncretism-egyptian-greek`, `chain-of-being`, `syncretism-deliberate`

---

## The wiring pattern (copy-paste recipe)

For each non-deity-lens file (event/symbol/place/etc.) that belongs to one of the 28 hubs:

```yaml
hub-edges:
  - target: "hub-slug-here"
    type: "concise-relation-descriptor"
    source: "Author Year Title; Author Year Title — one or two sentences of scholarly context"
    notes: "Cross-lens: <source_lens> → 06_themes. [Optional MASSIVE-WIN flag + additional context]"
```

- **Where to insert**: before the `status:` line in the YAML frontmatter
- **type values**: avoid colons (YAML conflict). Use hyphens. Examples already in the vault: `central-figure-of-ascent-spine`, `source-deity-of-transmission`, `paradigmatic-instance-of-cross-tradition-pattern`, `Phase-N-X-tradition-of-Y`, `Christian-endpoint-of-Z`, etc.
- **Always cite**: at least one Tier-1 scholar per edge. Common load-bearing sources by tradition cluster:
  - Zoroastrian: Boyce 1975-91, Skjærvø EIr articles, West 2007, Collins 1998, Hultgård 1998
  - Gnostic: Pearson 1990 + 2007, King 2006, Jonas 1963, Williams 1996
  - Hermetic: Yates 1964, Fowden 1986, Copenhaver 1992, Hanegraaff 2012
  - Manichaean: Tardieu 2008, Lieu 1992, BeDuhn 2000+
  - Sufi/mystical: Schimmel 1975, Chittick 1983+1989, Corbin 1969, Massignon 1982, Sells 1994
  - Kabbalah: Scholem 1941+1962, Idel 1988, Boyarin 2004+2012
  - Templar/occult-reception: Barber 2006, Nicholson 2001, Goodrick-Clarke 1985, Yates 1972
  - Afro-diasporic: Murphy 1988, Desmangles 1992, Brandon 1993, Brown 1991

---

## Cardinal rules (DO NOT VIOLATE)

1. **Lane A only.** Never touch `src/`, `index.html`, `build_*.py`, `lint_yaml.py`, `linkcheck.py`, `_assets/`, `scripts/`. Pre-commit hook will reject cross-lane commits. If hook catches you, `git reset HEAD -- <wrong-lane-path>` and re-commit Lane A only.
2. **Never `--no-verify`.** Don't bypass hooks unless John explicitly says so.
3. **WIRING LAW: every `[[wikilink]]` must resolve.** Run `python3 linkcheck.py` after each batch and confirm zero of your new edge-target slugs appear in the dead-list. Baseline = 594 (pre-existing). Don't add to it.
4. **Read before Edit.** The Edit tool requires the file to have been Read first in this session.
5. **Commit per batch.** Use the per-batch commit message format the prior phases used (see `git log --oneline | head -30`). End every commit message with: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` (heredoc-wrapped to preserve formatting).
6. **Status log per phase.** End each phase with a STATUS.md entry at the top of the file (above the most-recent prior entry). Update the format established in Phases 10-12.
7. **Don't auto-resolve duplicates.** If you find a duplicate node cluster, flag it for John and wait. Phase 7 resolved 7 clusters AFTER John approved the consolidation approach.

---

## What's currently in the working tree

Clean as of commit `6e08871`. `git status` should show no uncommitted Lane A changes. If you see uncommitted Lane B work (src/js/* / index.html / forge.js), that belongs to the parallel Lane B agent — DO NOT TOUCH IT, don't include it in your commits.

---

## How to verify integrity before/after each batch

```bash
cd "~/Desktop/Codex Atlas"
python3 linkcheck.py 2>&1 | tail -3
# Expected: "TOTAL DEAD: 594 targets / 823 occurrences" (unchanged)
```

If the number rises after your batch, you introduced a dead link — find the new `[[slug]]` you added that doesn't resolve and either rewrite to the canonical slug OR stub the target.

---

## What to tell the new agent (one-paragraph brief)

> Continue Phase 13 of the bridge-hub cross-lens wiring project at `~/Desktop/Codex Atlas`. Read `00_meta/HANDOFF-2026-05-21-bridge-wiring.md` first — it has the 28 hub slugs, the lens-aware edge pattern, the 7 cardinal rules, and the queue (events → symbols → places). Work in batches of 5–10 entities per commit. Every edge gets a `Cross-lens: 05_events → 06_themes` (etc.) tag in its `notes:` field per John's dogma directive. End each phase with a STATUS.md entry following the Phase 10–12 format. Run `python3 linkcheck.py` after each batch — baseline is 594/823 dead, do not add to it. Never touch Lane B paths (src/, index.html, build_*.py). Lane A slot is OPEN.

---

## Phase 1–12 commit roll (for context)

```
6e08871 STATUS log: opus-phase12-tradition-end-audit (FOUR-LENS NAVIGABLE)
5c7c1b1 Phase 12 Batch 5/5 wired: Christian + Greek/Roman + Afro-Atlantic
c887f05 Phase 12 Batch 4/5 wired: Indic + Islamic streams
6cc8c10 Phase 12 Batch 3/5 wired: Mystical streams
0c95d3a Phase 12 Batch 2/5 wired: Gnostic + Manichaean + Templar stream
b13f70b Phase 12 Batch 1/5 wired: Iranian + Hellenistic anchor traditions
2f4a7cf STATUS log: opus-phase11-document-end-audit (DOC LENS COMPLETE)
30ea2ae Phase 11 Batch 3/3 wired: Phase-5 medieval close-out
b58677a Phase 11 Batch 2/3 wired: 14 mid-leverage documents
4f08aa4 Phase 11 Batch 1/3 wired: highest-leverage documents
f852ab8 STATUS log: opus-phase10-person-end-audit
f3c558b Phase 10 Batch 5/5 wired: final closing-out persons
50cc40b Phase 10 Batch 4/5 wired: Renaissance Hermeticism anchor persons
8567f17 Phase 10 Batch 3/5 wired: mystical-ascent anchor persons
841feed Phase 10 Batch 2/5 wired: Manichaeism + Zoroastrian anchor persons
6ccf9dd Phase 10 Batch 1/5 wired: Neoplatonic anchor persons
[... Phase 7-9 above ...]
```

Good luck.
