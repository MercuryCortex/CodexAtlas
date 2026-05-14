# Codex Atlas — A Cross-Tradition Investigation of Gods, Texts, and Influence

> **Mission.** Build a dynamic timeline + graph of every primary religious document and every named deity, mapping the connections between them across time, geography, and political context — with academic-grade source integrity and zero hierarchy between traditions.

---

## Posture

This vault is an **investigation**, not a devotional library.

- **Every document is treated equally as a primary historical source.** A Gnostic text from Nag Hammadi has the same evidentiary weight as a canonical Gospel. They are simply *labeled differently* (see [[00_meta/label-taxonomy]]). Naturally, canonical texts will accumulate vastly more cross-links because they were preserved, copied, and commented on for centuries — that is itself a data point about *power and preservation*, not about *truth*.
- **No truth claims.** We catalog what was written, by whom (where known), when, where, under what political/religious conditions, and what motifs it shares with neighboring traditions.
- **Connect the dots.** Every node should answer: *who was behind this, what was the context, and what does it echo or reject from its neighbors?*
- **Gnosticism is a keystone node** — it sits at the intersection of Hellenistic philosophy, Egyptian mysticism, Second-Temple Judaism, early Christianity, Hermeticism, and Persian dualism. Many edges in our graph will run through it.
- **Reference everything.** Every claim cites a source — primary translation, peer-reviewed scholar, university repository, book, or named (even controversial) author. Direct URLs where possible. See [[00_meta/source-integrity]].

## Scope (unbounded, but ordered)

We map:

1. **Documents** — sacred texts, apocrypha, pseudepigrapha, sectarian writings, philosophical works, archaeological inscriptions, mythological corpora.
2. **Deities** — every named god, goddess, daemon, angelic/demonic figure, demiurge, or divine principle.
3. **Persons** — prophets, scribes, kings, philosophers, redactors, Church Fathers, heresiarchs, translators.
4. **Events** — conquests, exiles, councils, discoveries (Nag Hammadi, Dead Sea Scrolls, Ras Shamra), persecutions.
5. **Themes** — flood, dualism, demiurge, messianism, afterlife, divine council, creation-by-word, dying-and-rising god, sacred marriage, etc.
6. **Traditions** — overview nodes that gather their documents/deities/people.

Each is its own folder; every node is a markdown file with structured YAML frontmatter so it can be queried (Dataview) and exported to a timeline/graph visualization later.

## Atlas app

The vault ships with a self-contained visualization. From the vault root:

```bash
python3 build_data.py   # scans markdown, regenerates data.js
open index.html         # opens the atlas in your browser
```

Views: **Pantheon** (deity graph, clustered by tradition), **Timeline**, **Documents**, **Themes**, **Connections** (every edge by type), **Traditions**, **All nodes**, **About**. Full usage in [[00_meta/app-usage]].

## Folder map

```
Codex Atlas/
├── README.md                 — this file
├── index.html · data.js · build_data.py    — atlas app
├── 00_meta/                  — methodology, schemas, label taxonomy, source-integrity policy, app-usage
├── 01_timeline/              — master chronological index (all nodes by date)
├── 02_documents/             — primary texts, organized by phase
│   ├── _phase-1-ancient-near-east/        (~2600–1500 BCE)
│   ├── _phase-2-axial-age/                (~1500–500 BCE)
│   ├── _phase-3-hellenistic-second-temple/ (~500 BCE–100 CE)
│   └── _phase-4-late-antiquity/           (1st–7th cent. CE)
├── 03_deities/               — one note per named god/divine figure
├── 04_persons/               — prophets, scribes, kings, philosophers, redactors
├── 05_events/                — historical events and discoveries
├── 06_themes/                — recurring motifs (flood, dualism, etc.)
├── 07_traditions/            — overview per tradition
├── 08_refs/                  — catalog of sources (scholars, repositories, editions)
├── _graph/                   — cross-influence edge lists, visual exports
└── 99_ingest/                — raw drops (images, screenshots, unprocessed PDFs)
```

## Status legend (per document)

- `stub` — title + date placeholder only
- `metadata` — full YAML + context paragraph + refs, no body text
- `partial` — selected excerpts/sections of the source text
- `full-text` — complete public-domain or licensed text ingested

## How this vault grows

See [[00_meta/methodology]] for the standing operating procedure. In short: agents do parallel research passes by phase; outputs land here as `metadata`-status nodes; we promote to `partial` / `full-text` in scheduled waves; each new node forces a sweep for new edges in adjacent nodes.

## Current phase

**v0.1 — Skeleton + Phase 1–4 metadata seeding.** Four parallel agents populate `02_documents/_phase-*/` with one stub-to-metadata file per core text plus its scholarly refs and provisional cross-links.
