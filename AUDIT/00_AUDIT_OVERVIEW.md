# Codex Atlas — External Audit (2026-05-14)

External, freestyle audit of the Codex Atlas vault. Tests the knowledge depth, the cross-tradition connections, the integrity of dating/attribution, and proposes what is conspicuously missing.

Method: sampled methodology + source-integrity policy, the dashboard / quality-issues / orphan-nodes / dead-links / themes-audit reports, a stratified sample of ~15 nodes across deities (Yahweh, Yaldabaoth, Allah, Shangdi, Odin, Oshun), themes (demiurge), traditions (Gnosticism, traditions index), and events (Nag Hammadi discovery), plus directory listings of all eight document phases.

This folder is structured so any of the subfiles can be handed to an agent as a self-contained work unit.

## Index

**Content / scholarship audits (external, 2026-05-14 first pass):**

- [01_integrity_issues.md](01_integrity_issues.md) — concrete bugs and inconsistencies the auditor found (slug drift, tradition-string drift, date-vs-role mismatches, phase-boundary anomalies, zero-ref metadata nodes, Phase 8 conceptual muddle).
- [02_coverage_gaps_by_tradition.md](02_coverage_gaps_by_tradition.md) — missing content organized by tradition. The biggest section. Covers Chinese canon, Indic depth, Islamic canon, Second Temple pseudepigrapha, Apostolic Fathers, Hittite/Hurrian layer, Egyptian remainders, Phoenician, Mesoamerican depth, Indigenous North American, Korean, Modern theory canon, modern Catholic/Orthodox/Pentecostal, etc.
- [03_missing_events.md](03_missing_events.md) — events that should exist but don't (Karbala 680, Linear B decipherment, Boğazköy, Council of Carthage 397, Lateran IV, Valla on the Donation of Constantine, Macaulay's Minute, etc.).
- [04_methodology_proposals.md](04_methodology_proposals.md) — proposed extensions to the methodology: new edge types (scholarly-revision-of, counter-formation), a geographic layer, a `09_material/` folder for inscriptions and physical witnesses, scholar-lineage modelling. **Status: still unimplemented as of 2026-05-14 — DASHBOARD doesn't surface AUDIT proposals so they don't reach agent work queues.**
- [05_priority_queue.md](05_priority_queue.md) — the top 10 highest-leverage adds with concrete first steps. If the agent only does one thing, do these.

**Scoped feature / methodology proposals:**

- [06_symbology_proposal.md](06_symbology_proposal.md) — symbol-layer methodology, edge-typing for visual cognates, the swastika rule, Indus / Voynich / Phaistos discipline.
- [07_lead-session-log.md](07_lead-session-log.md) — running session log of the lead agent's decisions and rationale.
- [08_quran-scripture-wiring-brief.md](08_quran-scripture-wiring-brief.md) — brief for wiring the Quran corpus in the Scripture view (largely superseded by `opus-scripture-2`'s delivery, retained for historical context).
- [09_timeline-progressive-reveal-plan.md](09_timeline-progressive-reveal-plan.md) — design plan for a progressive-reveal timeline view (unimplemented).

**Engineering / infrastructure / process audits (post-hoc, agents reflecting on what they noticed):**

- [10_app-and-infrastructure-audit.md](10_app-and-infrastructure-audit.md) — engineering / UX / infra audit (no git repo, no CI, no URL routing, no responsive layout, no deployment, top-10 highest-leverage fixes). Complementary to 00–05 (which are content). **The single highest-impact gap flagged: no git repo at vault root.**
- [11_opus-buddhist-1-audit.md](11_opus-buddhist-1-audit.md) — post-hoc audit by `opus-buddhist-1` after delivering the Buddhism wedge: registry-contention pain (proposed split-the-registry pattern at `00_meta/agents/opus-<wedge>-<n>.md`), Scripture-tab placeholder pattern as highest-ROI feature, dead-link copy-paste artefact root cause. *(Renumbered from 10 → 11 by `opus-housekeeper-1` on 2026-05-14 to resolve numbering collision with 10_app-and-infrastructure-audit.md.)*
- [12_meta-audit-housekeeping.md](12_meta-audit-housekeeping.md) — meta-audit by `opus-housekeeper-1` (2026-05-14): coordination-layer hygiene, AUDIT folder cleanup, agent-onboarding doc, Obsidian config, standing recommendations for ongoing tightness.

**Numbering convention going forward:** `NN_short-slug.md` where `NN` is the next free integer. **No collisions** — check `ls AUDIT/` before adding. Agent-authored post-hoc audits (like 11) and content audits (00–05) and feature briefs (06–09) and infra audits (10) all share the same numeric namespace; segregating by category broke down at 10–11 collision and is not worth re-attempting.

## Headline verdict

The work is real. Yahweh/El handling, the Yaldabaoth article, the Demiurge theme, the Allah pre-Islamic backdrop, the Shangdi sinology, and the Nag Hammadi reception-history paragraph are all at graduate-seminar level. The "10 cross-tradition tracing edges" in [STATUS.md](../00_meta/STATUS.md) (Stoic logos → Philo → John → Justin; Isis Lactans → Theotokos; Mithra-Vedic → Roman Mithraism) are precisely the load-bearing arcs the project's mission requires.

The blind spots are systematically **East / non-Mediterranean** (Chinese canon, Indic puranic-tantric depth, Hittite-Hurrian, Korean, Indigenous American, Pentecostalism, 20th-c. Islamic modernism beyond Qutb) and **disciplinary** (the social-science / structuralist / cognitive-science / Girardian theory canon — Freud, Lévi-Strauss, Girard, J. Z. Smith, Charles Taylor, Pascal Boyer, William James are absent or stub-only).

The cleanups are mostly **slug-drift and tradition-string normalisation** — entirely scriptable.

If the three biggest gaps (Hittite-Hurrian + Apostolic Fathers + Chinese canon) are filled, the atlas crosses from "very serious Mediterranean-Levantine-Iranian atlas with non-Western footnotes" to a genuinely global cross-tradition atlas.

## How to read this audit

- **Findings are claims, not commands.** Each item is a hypothesis the auditor formed from a finite sample. Agents acting on these should verify against the current vault state before creating or editing nodes — the audit was taken at a moment in time and the vault is moving.
- **Cite when adding.** Every node added in response to this audit must satisfy the existing source-integrity policy (Tier 1+ for any claim that is not Tier-4-flagged). The auditor's tradition recommendations identify *what* should be added; the citations must still be done by the implementing agent.
- **Don't trust the auditor's slugs over [canonical-slugs.md](../00_meta/canonical-slugs.md).** Where a recommended slug conflicts with existing canonical-slug registry, the registry wins.
