# Codex Atlas — INGESTION MASTER PLAN (2026-06-14)

**Mandate (John, 2026-06-14):** *"node-rich, wire-poor, read-thin … I don't want this to be the status. Full force to invert this with rigor. Use mad agents to help."*

This is the standing governance plan for ingestion. It supersedes ad-hoc per-cluster
batching. Read it + the cardinal memories before any ingestion work.

## 1. The diagnosis (everything follows from this)
The Atlas is **node-rich, wire-poor, read-thin**:
- 5,357 nodes; deities (9/9 product-grade) + documents are strong spines — the raw material largely EXISTS.
- The **wires are the project** (membership-vs-wire law) but clusters are UNWIRED — hub after hub mis-flagged `stub`/`metadata` with members discussed in prose, never edged.
- READ is **34% staged** (209/621) — the end-deliverable surface is two-thirds empty.
- Long tail ~40% thin; headwaters "developing" (0.25–0.6 of baseline) while Abrahamic is 149% over-target.

**Therefore: "dominate ingestion" ≠ add nodes. It = WIRE what exists, STAGE the reader, and FILL only the genuine gaps — headwater-first, investigation-value-ranked.**

## 2. The atomic unit (never varies) — the 3-part cluster unit
1. **Hub** — product-grade theme node (the `primordial-waters`/`flood-motif` pattern): encyclopedic body, T1 refs, transmission-vs-convergence boundary stated honestly.
2. **Wires** — hub `parallels`/`deity-instances`/`appearances` → every cross-tradition member (+ reciprocals). Membership singular-origin; cross-reach = edges; every claim grep-verified, every wire T1-or-flagged.
3. **READ** — cluster texts staged in `scripture-texts.js` with shared terms annotated → the type-aware click opens the connection panel (shipped `03039484`).

## 3. The four engines (scaling mechanism — a flywheel)
| Engine | Job | How | Yields |
|---|---|---|---|
| ① Discovery | map + RANK the frontier; produce grep-verified apply-specs | read-only agent fleet (verify-&-spec) | the worklist |
| ② Wiring | flip mis-set status + edge members | main-thread, gated, grep-verified | clusters go live + readable |
| ③ Ingestion | create the GENUINE dead-endpoints, headwater-first | agent fleet in worktrees → main integration | every wire-endpoint exists |
| ④ READ | stage texts + annotate shared terms | per-cluster, Lane B | the interactive reader |

## 4. The quality firewall (non-negotiable — keeps "strong" from becoming "big and wrong")
1. **Membership-vs-wire** — one home tradition; cross-reach = edges. SYMBOLS' plural `families:` is SCHEMA, not a violation (build_data uses families[0]; 86% of symbols do it). Only FIGURE nodes (deity/person) with multi-valued `tradition:` are violations.
2. **Grep-verify EVERY agent claim before acting.** The discovery audits produced **5 false-positive "dead endpoints"** (nun-primordial-waters, Revelation, Enoch, Daniel/1-Enoch, Persephone) — each would have been a duplicate node. Agents DISCOVER + RANK; they never assert facts I act on unchecked. The verify-fleet design fixes this: agents grep-confirm and return only proven slugs.
3. **T1 academic default**, dissent represented (Gunkel AND Tsumura; transmission AND convergence). No uncited superlatives/figures.
4. **Gates every batch, real exit codes:** `build_data` 0 · `linkcheck --baseline` (366 floor, no regression) · `lint_yaml --strict` 0 · `node --check` for READ.
5. **Adversarial wire-verification** for high-stakes claims; the discovery fleet already flags overclaims.
6. **Lane discipline · separate commits per lane · STATUS per batch.**

## 5. Ranking function
`priority = investigation_value × dead_link_demand`. Thumb-rules: **headwaters rank top**; **wiring before creation** (cheaper, surfaces what exists). Run **loop-until-dry** per cluster-class.

## 6. Human-in-the-loop checkpoints (only these are John's)
(a) debatable membership / hub-consolidation (e.g. afterlife-judgment vs psychostasia-soul-weighing); (b) new-corpus scope; (c) lowering the dead-link baseline ratchet.

## 7. Convergence — "hyper-strong" finish line
- Every comparative spine = a product-grade wired hub.
- Zero net dead wire-endpoints carrying inbound demand (floor → real ~120 → 0).
- READ ≥ 80% staged; every staged text's cross-tradition terms clickable.
- Headwater families ≥ 0.8 of baseline.
- Scripture-root drilldown (`family → corpus → book → lens → READ`) complete (north star).

## How we run it
Discovery fleet (read-only, grep-verified specs) → I apply the verified worklist in gated batches (Wiring) → Ingestion fleet fills genuine gaps in worktrees → READ staging → re-measure, floor drops. Each turn cheaper than the last.

**First execution:** verify-fleet `wf_c13cdc72-d18` (28 comparative hubs) → apply its ranked worklist.
