# Codex Atlas — HANDOFF: headwater dead-endpoint creation (2026-06-15, for a fresh agent)

**Self-contained. A fresh agent can run this cold. Read this + the cardinal memories + `AUDIT/2026-06-14-ingestion-master-plan.md` first.**

## Where the project is (so you don't re-derive it)
A two-day "full-force inversion" just shipped (43 commits, see `00_meta/STATUS.md` top entries):
- **Wire-poverty is inverted** — 31 comparative theme-hubs wired (primordial-waters, flood-motif, chaoskampf, dying-rising-god, divine-kingship, psychostasia, logos, messianism, sacred-marriage, katabasis-and-anabasis, …). ~+250 edges, all gated.
- **READ-thin**: a hygiene pass fixed 18 dead annotation slugs + a duplicate-key bug; `enuma-elish-4` (Tablet IV) authored. The type-aware reader-click (commit `03039484`) makes any cross-type term a clickable gateway to its hub.
- **Integrity**: 32 of ~48 overclaims softened.

The wiring exposed the **genuine** dead-endpoints — nodes referenced/needed by the wired clusters that truly do not exist. **That is this task.**

## THE RIGOR RULE (non-negotiable — this is why prior agent-claims failed)
**GREP-VERIFY EVERY CLAIM IN THIS DOC BEFORE ACTING.** The discovery fleets produced ~8 false-positive "missing" claims this session (nun-primordial-waters, Revelation, Enoch, Daniel, Persephone, cyrus-the-great, "11 anchors not staged"…) — each would have been a duplicate node or a wrong edit. So for EVERY candidate slug below: `find 03_deities 04_persons 05_events 06_themes 09_symbols 02_documents -iname "*<slug>*.md"` (and obvious variants) BEFORE creating. If it exists under any slug, WIRE to it, don't create. Symbols' plural `families:` is schema, NOT a membership violation — don't "fix" it.

## THE RECOMMENDATION — create the 20 genuine headwater dead-endpoints, headwater-first
Each is a real wire-endpoint a wired hub needs. Ranked by leverage (multi-hub headwaters first). **Verify-absent first**, then build the 3-part unit, then wire into the named hub.

**Tier A — multi-hub headwater concepts (highest leverage):**
1. `dao` (Daoist) — the Way as cosmic order/ground. Hubs: `logos-cosmic-reason`, `hidden-god`, `non-duality`, `emptiness-sunyata`, `world-axis` ALL lean on it in prose. (NB: `laozi` person + a daodejing doc exist; the *concept* node does not — verify.)
2. `rta` (Vedic) — cosmic order; the Vedic headwater of the asha/ma'at/logos parallel. Hub: `logos-cosmic-reason`.
3. `memra` (Jewish, Targumic Aramaic) — the divine Word; the bridge between Hebrew dabar and Johannine logos. Hub: `logos-cosmic-reason`.

**Tier B — the chaoskampf chaos-beings (complete the most-wired hub, headwater Near-Eastern/IE):**
4. `rahab` (Hebrew Bible) — chaos-monster of the sea (Ps 89, Isa 51, Job 26). Hub: `chaoskampf`.
5. `tannin` (Hebrew/Ugaritic) — the sea-dragon. Hub: `chaoskampf`.
6. `behemoth` (Hebrew Bible) — Job's land-chaos beast, pairs with leviathan/rahab. Hub: `chaoskampf`.
7. `azi-dahaka` (Zoroastrian) — Avestan three-headed dragon. Hub: `chaoskampf`.
8. `thraetaona` (Zoroastrian) — the dragon-slayer who binds Azi Dahaka. Hub: `chaoskampf`.
9. `python` (Greek) — the Delphic serpent slain by Apollo. Hub: `chaoskampf`.
10. `yamata-no-orochi` (Shinto) — the eight-headed serpent slain by Susanoo. Hub: `chaoskampf`.
11. `ullikummi` (Hurrian-Hittite) — the stone-monster of the Kumarbi cycle. Hub: `chaoskampf`.

**Tier C — Greek underworld judges + katabasis heroes:**
12. `minos` (Greek) — judge of the dead. Hubs: `psychostasia-soul-weighing`, `afterlife-judgment`.
13. `rhadamanthus` (Greek) — judge of the dead. Hub: same.
14. `aeacus` (Greek) — judge of the dead. Hub: same.
15. `odysseus` (Greek) — the Nekyia (Od. 11). Hub: `katabasis-and-anabasis`.
16. `aeneas` (Roman) — Aeneid VI descent. Hub: `katabasis-and-anabasis`.
17. `theseus` (Greek) — failed descent for Persephone. Hub: `katabasis-and-anabasis`.

**Tier D — optional:**
18. `meru` (Vedic) — Mount Meru, the world-mountain. Hub: `world-axis`. (Check it isn't covered by an existing axis-mundi/world-mountain symbol.)
19. `vitruvian-man` (Renaissance) — human-cosmos correspondence icon. Hub: `microcosm-macrocosm`.
20. `saurva` (Zoroastrian) — a daeva (Videvdad 10.9). Hub: `asura-deva-inversion`.

## THE 3-PART UNIT (per node — the model is `03_deities/tehom.md` / `03_deities/apas.md`, built this session)
1. **NODE** — full YAML: `type` (deity for the chaos-beings/judges/heroes; theme for dao/rta/memra concepts — judge by what it IS), **singular `tradition:`** (origin only — membership-vs-wire), dates + `dating-basis`, domains/role, `refs:` with **T1 tier**, encyclopedic body with sections + a `## Cross-tradition significance` that states transmission-vs-convergence honestly (Gunkel AND Tsumura; do not over-claim).
2. **WIRES** — wire the node into its hub via an **edge field** (`parallels` / `deity-instances` / `appearances` — NOT `related-themes`, which is INERT/not an edge field) + reciprocally add the new node to the hub's `parallels`. Cross-tradition reach = edges, never crammed into `tradition:`.
3. **READ** (optional, Lane B, separate commit) — if a staged text annotates the term, repoint it to the new node.

## GATES (every batch, real exit codes — never `--no-verify`)
`python3 build_data.py` (0) · `python3 linkcheck.py --baseline` (floor **365**, no regression — report resolved count) · `python3 lint_yaml.py --strict` (0 errors). For READ edits: `node --check src/data/scripture-texts.js` + bump its `?v=` in index.html.

## DISCIPLINE
- **Lane split**: nodes/wiring = Lane A (content folders); READ = Lane B (`src/data/scripture-texts.js`). SEPARATE commits (pre-commit hook refuses mixed).
- **T1 academic default**; represent dissent; no uncited superlatives.
- **STATUS** one entry per batch; commit it.
- Trap: never write literal `[[…]]` in STATUS/AUDIT prose unless in backticks (linkcheck now skips inline-code, but stay clean).

## How to run it (recommended: a worktree creation-fleet)
A read-only verify pass first (confirm which of the 20 are truly absent + gather each one's hub + a T1 source). Then a worktree-isolated creation fleet (each agent owns ONE new node file → no conflicts), OR main-thread for the Tier-A headwaters (higher-stakes, want care). Integrate + gate + wire reciprocals main-thread.

## ALSO QUEUED (smaller, do after or in parallel)
- **~16 leftover overclaim softens** + 4 paraphrase-mismatched notes the fleet flagged but I couldn't locate verbatim: `katabasis-and-anabasis` "same grammar" lineage (lines ~60/86), `psychostasia-soul-weighing` Egyptian→Quranic transmission chain, `chaoskampf` PIE-cognate certainty + Vedic/Christian cosmic-maintenance analogy, `09_symbols/ma-at.md` "Philo explicitly equates Ma'at with the Logos". Method: grep the body for the phrase, soften the wording (hedge transmission, attribute superlatives), gate. Full before→after list is in workflow `wf_c13cdc72-d18` output (`overclaimFixes` array).

## Key reads
`00_meta/HOW-WE-WORK.md` §5; `00_meta/MEMBERSHIP-AND-WIRES.md`; `AUDIT/2026-06-14-ingestion-master-plan.md`. Memories: `project_ingestion_master_plan_2026-06-14`, `feedback_membership_vs_wire_crisis_2026-06-02`, `feedback_completeness_is_investigation_not_catalogue_2026-06-05`. Model node: `03_deities/tehom.md`.
