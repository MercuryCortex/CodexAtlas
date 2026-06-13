# Codex Atlas — DOCUMENT INGESTION PLAN (2026-06-13, handoff for a fresh agent)

**Read this + the cardinal memories before ingesting. Self-contained: a fresh agent can run it cold.**

## The question this answers
"Where should we push document ingestion next?" Answer below, grounded in the corpus state + the project's two north stars.

## Corpus state (measured 2026-06-13)
- **621 document nodes** total. Distribution is **Abrahamic-heavy**: Islam 46 · Early/Latin/Patristic Christianity ~90 · Judaism (Israelite/Second-Temple/Hellenistic) ~50 → ~185 of 621.
- **Headwaters are comparatively thin**: Egyptian 15 · Greek 15 · Mesopotamian 10 (Sumerian 5 + Babylonian 5) · Hindu/Vedic 13 · Buddhist 23 · Chinese 13 · Hermetic 8 · Neoplatonism 9. Norse / Zoroastrian / Mesoamerican / Mandaean / Manichaean / Yoruba / Indigenous are sparse-to-absent as dedicated corpora.
- **READ surface: 209 texts staged** (`src/data/scripture-texts.js`) of 621 docs (~34%) — the annotated-reader layer, the canonical end-deliverable.

## THE RECOMMENDATION — push the cross-tradition PARALLEL CLUSTERS through the headwaters
NOT more Abrahamic scripture (already 185 docs; diminishing investigation return). The investigation VALUE — and both north stars — live in the **headwater cosmogonic/wisdom corpora and the wires between traditions**:
- **North star 1 (`project_scripture_is_the_root`):** scripture is the root; the READ surface (annotated text + cross-tradition parallel panel) is the end-deliverable. The pitched image is **"the deep → Tiamat (Mesopotamian) · Nun (Egyptian) · Ginnungagap (Norse)"**.
- **Cardinal (`feedback_completeness_is_investigation_not_catalogue`):** "egyptian/greek/mesopotamian… without it THERES NO INVESTIGATION"; **headwater pantheons rank TOP**, rank gaps by **dead-wire-endpoint demand**, completeness = every wire-endpoint exists (NOT cataloguing Abrahamic canon for its own sake).

So: **ingest the great comparative CLUSTERS, headwater-first, realized end-to-end.** Each cluster is a set of cosmogonies/floods/wisdom texts across traditions that the cross-tradition panel lights up side by side.

## What "ingest a doc" means here — the 3-part unit (per document)
1. **The document NODE** — Lane A, `02_documents/document-<slug>.md`: full YAML (singular `tradition:` = origin, dates + `dating-basis`, `type: document`), encyclopedic body, `## Cross-tradition findings` where earned, `## Vault Connections` (grep-verified wikilinks), `refs:` T1 (authors+titles+dates).
2. **The cross-tradition WIRES** — Lane A, `syncretic-edges`/`cross-tradition-edges` on the node (+ reciprocals): the parallels that make it an investigation object (e.g. Enuma-Elish `the deep`/Tiamat ↔ Genesis `tehom` ↔ Nun ↔ Ginnungagap). Membership stays SINGULAR (origin); the cross-tradition reach is WIRES (`feedback_membership_vs_wire_crisis`).
3. **The READ text** — Lane B, `src/data/scripture-texts.js`: `SCRIPTURE_TEXTS['<key>'] = { id, title, shortTitle, corpus, tradId, date, verses/sections… }` with the cross-tradition TERMS annotated so the reader can surface the parallel panel. (Format: copy an existing entry like `genesis-1`.) **Lane split: node+wiring = Lane A; READ entry = Lane B → SEPARATE commits.**

## PRIORITIZED BATCHES (headwater-first, by comparative leverage)
**Batch 1 — COSMOGONY / primordial-waters (the flagship "the deep" cluster).** Highest priority: it realizes the pitched deliverable. Most nodes exist (tiamat, nun, apsu, chaos-primordial, ginnungagap ✓); **gaps: `ogdoad-hermopolis` (Egyptian Ogdoad) MISSING; the parallel WIRING between the primordial-water figures is incomplete; READ staging of the cosmogonies needs completing + cross-linking.** Texts: Enuma Elish I, Memphite Theology, Heliopolitan/Hermopolitan cosmogony, Genesis 1, Rigveda Nāsadīya Sūkta (10.129), Völuspá, Popol Vuh creation, Daoist/Pangu, Kojiki opening. Deliver: Ogdoad node + complete the primordial-waters wire-web + stage/annotate each cosmogony in READ with the shared terms.

**Batch 2 — FLOOD.** Atrahasis, Gilgamesh XI, Genesis 6–9, Deucalion (Greek), Manu/Matsya (Hindu), Chinese Gun-Yu, Mesoamerican. Wire the shared flood-hero / divine-warning / bird-scout motifs.

**Batch 3 — WISDOM / INSTRUCTION.** Ptahhotep, Amenemope ↔ Proverbs (the documented borrowing), Analects, Tao Te Ching, Dhammapada, Bhagavad Gita, Ecclesiastes/Job. Wire the cross-tradition wisdom parallels.

**Batch 4+ — the other documented spines** (each already has theme hubs to wire into): dying-rising-god, sacred-marriage/hieros-gamos, descent-to-underworld, logos/creation-by-word, apocalyptic/eschatology, soul-exile. Fill the headwater texts each spine needs.

Throughout: when a cluster references a figure/place/event node that doesn't exist, that's a dead wire-endpoint — create it (cardinal completeness). Rank within each batch by inbound dead-link demand (`python3 linkcheck.py`).

## Discipline (non-negotiable — these are why prior work held)
- **Membership singular** (origin tradition); cross-tradition = wires. (`feedback_membership_vs_wire_crisis`, `MEMBERSHIP-AND-WIRES.md`.)
- **T1 academic sourcing** by default; mark T3/T4 for alternative/fringe with consensus alongside.
- **Consumer language:** NO "MASSIVE WIN" in new prose (use `## Cross-tradition findings`); NO "the vault" (use "the Atlas"). A full scrub just shipped — don't reintroduce.
- **Lane discipline:** Lane A = `02_documents/` + other content folders; Lane B = `src/data/scripture-texts.js`. SEPARATE commits per lane (pre-commit hook refuses mixed). Never `--no-verify`.
- **Wikilinks grep-verified before writing**; zero new dead links (net).
- **Gates after every batch, real exit codes:** `python3 build_data.py` (0), `python3 linkcheck.py --baseline` (480 baseline holds/improves — report the resolved count), `python3 lint_yaml.py --strict` (0 errors). For READ edits: `node --check src/data/scripture-texts.js` + bump its `?v=` in index.html.
- **STATUS log** one entry per batch; commit it (the pre-commit hook nudges for this).
- ⚠️ **Recurring trap:** never write literal `[[…]]` examples in STATUS/AUDIT prose — linkcheck parses them as live wikilinks and fails (bit us 4× on 2026-06-13). Write the slug in backticks WITHOUT double-brackets. (A permanent linkcheck fix — skip inline-code spans — is a recommended small follow-up.)

## Open ratchets / decisions for John (don't assume)
- Lower the dead-link baseline 480→437 (43 resolved 2026-06-13) — John's signoff per the tyrant-remediation ratchet.
- `script-family` controlled-vocab-registry entry (pending sign-off).
- Boards "MASSIVE WINS" library tab — rename or keep (product call).

## Key files / reading
- `00_meta/HOW-WE-WORK.md` §5; `00_meta/LANES.md`; `00_meta/PROTOCOL.md`; `00_meta/ONTOLOGY.md`.
- `00_meta/MEMBERSHIP-AND-WIRES.md`; memory `feedback_completeness_is_investigation_not_catalogue`, `project_scripture_is_the_root_of_truth`, `feedback_membership_vs_wire_crisis`.
- Quality bar: `02_documents/document-genesis.md`, the `document-quran-*` set, a staged READ entry (`genesis-1` in `src/data/scripture-texts.js`).
- This session's other open plan: `AUDIT/2026-06-13-next-steps-plan.md` (map/UX/STAR-MAP items).
