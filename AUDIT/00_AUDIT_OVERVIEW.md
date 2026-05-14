# Codex Atlas — External Audit (2026-05-14)

External, freestyle audit of the Codex Atlas vault. Tests the knowledge depth, the cross-tradition connections, the integrity of dating/attribution, and proposes what is conspicuously missing.

Method: sampled methodology + source-integrity policy, the dashboard / quality-issues / orphan-nodes / dead-links / themes-audit reports, a stratified sample of ~15 nodes across deities (Yahweh, Yaldabaoth, Allah, Shangdi, Odin, Oshun), themes (demiurge), traditions (Gnosticism, traditions index), and events (Nag Hammadi discovery), plus directory listings of all eight document phases.

This folder is structured so any of the subfiles can be handed to an agent as a self-contained work unit.

## Index

- [01_integrity_issues.md](01_integrity_issues.md) — concrete bugs and inconsistencies the auditor found (slug drift, tradition-string drift, date-vs-role mismatches, phase-boundary anomalies, zero-ref metadata nodes, Phase 8 conceptual muddle).
- [02_coverage_gaps_by_tradition.md](02_coverage_gaps_by_tradition.md) — missing content organized by tradition. The biggest section. Covers Chinese canon, Indic depth, Islamic canon, Second Temple pseudepigrapha, Apostolic Fathers, Hittite/Hurrian layer, Egyptian remainders, Phoenician, Mesoamerican depth, Indigenous North American, Korean, Modern theory canon, modern Catholic/Orthodox/Pentecostal, etc.
- [03_missing_events.md](03_missing_events.md) — events that should exist but don't (Karbala 680, Linear B decipherment, Boğazköy, Council of Carthage 397, Lateran IV, Valla on the Donation of Constantine, Macaulay's Minute, etc.).
- [04_methodology_proposals.md](04_methodology_proposals.md) — proposed extensions to the methodology: new edge types (scholarly-revision-of, counter-formation), a geographic layer, a `09_material/` folder for inscriptions and physical witnesses, scholar-lineage modelling.
- [05_priority_queue.md](05_priority_queue.md) — the top 10 highest-leverage adds with concrete first steps. If the agent only does one thing, do these.

## Headline verdict

The work is real. Yahweh/El handling, the Yaldabaoth article, the Demiurge theme, the Allah pre-Islamic backdrop, the Shangdi sinology, and the Nag Hammadi reception-history paragraph are all at graduate-seminar level. The "10 cross-tradition tracing edges" in [STATUS.md](../00_meta/STATUS.md) (Stoic logos → Philo → John → Justin; Isis Lactans → Theotokos; Mithra-Vedic → Roman Mithraism) are precisely the load-bearing arcs the project's mission requires.

The blind spots are systematically **East / non-Mediterranean** (Chinese canon, Indic puranic-tantric depth, Hittite-Hurrian, Korean, Indigenous American, Pentecostalism, 20th-c. Islamic modernism beyond Qutb) and **disciplinary** (the social-science / structuralist / cognitive-science / Girardian theory canon — Freud, Lévi-Strauss, Girard, J. Z. Smith, Charles Taylor, Pascal Boyer, William James are absent or stub-only).

The cleanups are mostly **slug-drift and tradition-string normalisation** — entirely scriptable.

If the three biggest gaps (Hittite-Hurrian + Apostolic Fathers + Chinese canon) are filled, the atlas crosses from "very serious Mediterranean-Levantine-Iranian atlas with non-Western footnotes" to a genuinely global cross-tradition atlas.

## How to read this audit

- **Findings are claims, not commands.** Each item is a hypothesis the auditor formed from a finite sample. Agents acting on these should verify against the current vault state before creating or editing nodes — the audit was taken at a moment in time and the vault is moving.
- **Cite when adding.** Every node added in response to this audit must satisfy the existing source-integrity policy (Tier 1+ for any claim that is not Tier-4-flagged). The auditor's tradition recommendations identify *what* should be added; the citations must still be done by the implementing agent.
- **Don't trust the auditor's slugs over [canonical-slugs.md](../00_meta/canonical-slugs.md).** Where a recommended slug conflicts with existing canonical-slug registry, the registry wins.
