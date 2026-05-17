# Session handoff — opus-buddhist-1 + opus-gaps-1 (2026-05-14, evening)

_Tight pickup notes for the next agent. Read in 2 minutes. For full onboarding see [AGENTS.md](../AGENTS.md). For deep audit see [11_opus-buddhist-1-audit.md](11_opus-buddhist-1-audit.md)._

---

## What landed this session (mine)

- **`opus-buddhist-1`** — Buddhism wedge: 30 metadata-tier nodes + 1 stub→metadata upgrade + edge-sweep on 4 existing. Greco-Buddhist axis ([[tradition-greco-buddhism]] + [[menander-i-soter]] + [[phase-3-029-milindapanha]] + [[phase-3-030-asokan-edicts]] naming 5 Hellenistic kings); foundational doctrine themes ([[four-noble-truths]] / [[noble-eightfold-path]] / [[anatman-no-self]] / [[pratitya-samutpada]] / [[bodhisattva-vow]]); Theravāda spine ([[tradition-theravada-buddhism]] + [[asoka-maurya]] + [[buddhaghosa]] + [[phase-4-076-visuddhimagga]]); Prajñāpāramitā chain ([[phase-3-031-asthasahasrika-prajnaparamita]] → [[phase-5-002b-diamond-sutra]]); plus [[phase-4-075-mulamadhyamakakarika]] (Nāgārjuna MMK).
- **Scripture tab — Buddhist canon wired live**: `tipitaka` slot in [src/js/app.js](../src/js/app.js) flipped from `available: false` to a fully-wired 8-section × 14-book corpus. **34 entity instances**; cross-corpus trail-arcs on hover (Siddhartha Gautama across 8 books, Avalokiteśvara across 3, etc.).
- **`opus-gaps-1`** — Dead-link closure batch: 17 metadata-tier nodes. Closed the 4 highest-volume dashboard dead-link targets (`tradition-syriac-orthodox` 7 refs / `tradition-armenian-apostolic` 5 / `dioscorus-of-alexandria` 5 / `melchizedek` 5). Oriental Orthodox communion now fully wired ([[severus-of-antioch]] / [[jacob-baradaeus]] / [[shenoute]]). Plus the cross-tradition MASSIVE-WIN [[barlaam-and-josaphat]] (the Buddhist→Christian-saint transmission) + [[pyrrho-of-elis]] (Beckwith-hypothesis figure) + my own opus-buddhist-1 follow-ups ([[santideva]] + [[phase-5-049-bodhicaryavatara]] + [[phase-4-077-abhidharmakosa]] + [[karma-lingpa]]).
- **Audit memo written**: [11_opus-buddhist-1-audit.md](11_opus-buddhist-1-audit.md) — what's broken in the app + content + process, prioritized.

**Build state at session-close:** 1488 → 1694 nodes (combined session including concurrent agents). Dead-link occurrence ratio 4.6% → 3.5%.

---

## What's wired now (don't re-do)

- **Scripture-tab live corpora**: `bible`, `egyptian-scripture`, `greek-scripture`, `quran`, `kebra-nagast`, `ethiopic-tewahedo-canon`, `nag-hammadi`, `hermetica`, **`tipitaka` (Buddhist canon — this session)**.
- **Scripture-tab still placeholder** (`available: false`): `tanakh`, `vedas`, `avesta`, `kojiki-nihongi`, `guru-granth`, `mormon`, `tao-corpus`. Each has enough vault content for ≤1 hour of wiring — same pattern I used for `tipitaka`. See `SCRIPTURE_CORPORA` in [src/js/app.js:2204](../src/js/app.js).
- **YAML-id ↔ file-stem alias shim** lives only in the Scripture view (`scriptureResolveBookId`). Other views still vulnerable to the same drift. Real fix = patch `derive_id()` in [build_data.py](../build_data.py) to canonicalize on file-stem; ~30 min, closes 50+ dead-links across all views.

---

## Top 5 highest-ROI moves for the next agent

1. **Africa-Yoruba-Vodun wedge** (~30 nodes) — biggest mission-vs-reality content gap. 1-ref deities Damballa / Erzulie / Oshun / Ogun / Baron-Samedi / Yemoja need their `tradition-yoruba` + `tradition-vodun` + `tradition-santeria-lucumi` anchors and the `afro-diasporic-syncretism` + `orisha-pantheon` + `possession-ritual` themes (each currently dead-link 4 refs). See dashboard.
2. **`liturgical-calendar` theme** (#1 dashboard dead-link, 6 refs) — Ethiopian-Marian-feast-cycle theme; trivial single-node stub.
3. **Wire `vedas` Scripture-tab corpus** — Ṛg-Veda + 4 Upaniṣads + Gītā + Vishnu-sahasranama + Yoga-Sūtras + Devi-Mahatmya + Shiva-Sūtras + 4 Vedānta-bhāṣyas already exist as nodes. ~30 min editing [src/js/app.js:2327](../src/js/app.js).
4. **Wire `tanakh` Scripture-tab corpus** — all J/E/D/P + Former Prophets + DtrH + Latter Prophets nodes already exist (same nodes the Bible corpus uses); needs different sectioning (Torah / Nevi'im / Ketuvim). ~30 min.
5. **Patch `build_dashboard.py` to respect backticks in wikilink-scanning** — the remaining `document` 6 dead-link refs are all inside backticks in meta-discussion (ACTIVE-AGENTS + AUDIT/11 + AUDIT/12). Closing this scanner-bug would also let agents discuss `[[foo-slug]]` patterns inside backticks without polluting the dead-link count. ~15-30 min Python edit.

Further priorities in [11_opus-buddhist-1-audit.md §8](11_opus-buddhist-1-audit.md).

---

## Gotchas / known issues

- **Concurrent-agent file contention is real.** ACTIVE-AGENTS.md and STATUS.md are hot-edited by 3-5 agents per session. Expect the Edit tool to fail with "file modified since read" repeatedly. Fall back to `cat >> file <<EOF` (append) or a Python heredoc that does atomic read-mutate-write. `opus-housekeeper-1` proposed a registry-per-agent split as the real fix — not yet implemented.
- **Schema-template wikilinks bleed into dead-link counts.** The dashboard scanner doesn't respect backticks. **Don't** put `[[example-slug]]` style placeholders in schema-*.md templates — use parenthetical instructions like "(link to a `02_documents/` node here)" instead.
- **Screenshot tool returns a narrow strip** on the running atlas preview (port 8742) even after `preview_resize`. DOM inspection works; pixel screenshots don't. If you need to verify a visual change, use `preview_eval` + `preview_inspect`, not `preview_screenshot`. Cause unknown (SVG viewport sizing or preview-tool capture path).
- **YAML-id vs file-stem mismatch** — files have `id: "P5-002-heart-sutra"` but wikilinks use `[[phase-5-002-heart-sutra]]`. The Scripture view papers over this; nothing else does. See item 5 above for the real fix.

---

## Pointers (don't reread cold; just know they're there)

- [AGENTS.md](../AGENTS.md) — 60-second onboarding (pre-flight protocol + canonical-slugs check + DO-NOT list + folder map).
- [00_meta/DASHBOARD.md](../00_meta/DASHBOARD.md) — live work queue. **Always read first.**
- [00_meta/canonical-slugs.md](../00_meta/canonical-slugs.md) — slug registry. **Check before naming a new file.**
- [00_meta/ACTIVE-AGENTS.md](../00_meta/ACTIVE-AGENTS.md) — in-flight + finished claim blocks. Top of file has a "🚦 in-flight" table (added by `opus-housekeeper-1`).
- [00_meta/STATUS.md](../00_meta/STATUS.md) — chronological narrative of completed batches.
- [00_meta/methodology.md](../00_meta/methodology.md) — node-creation workflow + edge-typing rules + symbol-research discipline.
- [00_meta/source-integrity.md](../00_meta/source-integrity.md) — Tier 1/2/3/4 source policy.
- [AUDIT/00_AUDIT_OVERVIEW.md](00_AUDIT_OVERVIEW.md) — index of all 13 standing audit files.

---

## One-line user-framing reminder

> "If we any moment can establish a connection between Christianity and an older religion... THAT for us is a MASSIVE victory."

Tag your edges accordingly. Christianity → older-tradition tracing edges are the prize.

— `opus-gaps-1`, signing off 2026-05-14 ~21:10 local.
