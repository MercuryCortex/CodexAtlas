# ACTIVE-CONTENT — Investigation lane claims

> **Lane A — INVESTIGATION.** Many agents may work here in parallel as long as they pick **disjoint documents / disjoint slug ranges**. Append your one-line claim to the table when you start; mark it FINISHED with a timestamp when you commit; the next rotation pass moves finished rows to `agents-archive/`.
>
> Read `00_meta/LANES.md` for the lane definition and `00_meta/PROTOCOL.md` for the absorb-and-dissect SOP. Do **not** stage any path under `src/`, `index.html`, `build_data.py`, `build_dashboard.py`, `_assets/`, or `.claude/`. The pre-commit hook will refuse a cross-lane commit.

## In-flight

| Handle | Document or scope | Owned paths (folder lock) | Started | Status |
|---|---|---|---|---|
| opus-ontology-lock-2026-05-18 | Ontology lock pass 2 — 10 new lens folders (08, 18-26) + ONTOLOGY/LANES updated + permanent rationale doc. Deferred to next Lane B window: themes→motifs rename + build script updates + pre-commit hook regex + Forge mode dropdown. | as listed | 2026-05-18 PM | FINISHED 2026-05-18 evening |
| opus-rarefact-2026-05-18-pm | Rarefaction pass — HOW-WE-WORK.md (slim cast-and-go pre-flight), PROTOCOL+CORE-THEMES synced to 26-lens, pagan-usage audit verdict (existing usage academically appropriate; one slug flagged for John's future decision) | as listed | 2026-05-18 PM late | FINISHED 2026-05-18 late evening |
| opus-new-lens-candidates-2026-05-18 | Read-only audit — scan existing vault for entities already mentioned that need their own node in the 10 new lenses. Output: AUDIT/new-lens-candidates-2026-05-18.md (per-lens backlog, top-5 per lens + 10-node first-wave pick). All 10 lenses validated as demand-driven. | AUDIT/new-lens-candidates-2026-05-18.md, 00_meta/STATUS.md, 00_meta/ACTIVE-CONTENT.md | 2026-05-18 late | FINISHED 2026-05-18 late evening |
| opus-deferred-laneb-spec-2026-05-18 | Concrete spec doc for the deferred Lane B batch — 7 items in execution order with file paths, code diffs, verification steps, risk levels, ~2.5–3 hour total estimate. | AUDIT/deferred-laneb-batch-spec-2026-05-18.md, 00_meta/STATUS.md, 00_meta/ACTIVE-CONTENT.md | 2026-05-18 late | FINISHED 2026-05-18 late evening |

| goblin-sacred-architecture-1 | Sacred architecture batch from `99_ingest/To check Architecture A1.txt` — 20 full-detail sacred-site nodes (Göbekli Tepe + Çatalhöyük + Egyptian pyramids + Karnak + ziggurat-of-Ur + Solomon's Temple 1st/2nd + Parthenon + Pantheon Rome + Hagia Sophia + Kaaba + Holy Sepulchre + Dome of the Rock + Tomar Convent + Temple Church London + Lalibela + Quinta da Regaleira + Borobudur + Sanchi) + 3 motif anchors + 161 stubs across 04_persons / 06_themes / 07_traditions / 05_events / 02_documents / 23_material_culture / 09_symbols / 08_places / 20_sacred_architecture. MASSIVE-WIN: Anastasis Rotunda → Dome of the Rock → Templar Europe + Lalibela transmission. | 20_sacred_architecture/*, 06_themes/theme-{round-church,stupa-as-cosmic-mountain,ziggurat-as-stairway-to-heaven,wellhausen-hypothesis,...}.md, 04_persons/*.md (stubs), 07_traditions/*.md (stubs), 05_events/*.md (stubs), 02_documents/*.md (stubs), 23_material_culture/*.md (stubs), 09_symbols/*.md (stubs), 08_places/mecca-place.md (stub) | 2026-05-19 | FINISHED 2026-05-19 |

| goblin-sacred-architecture-2-A2 | Sacred architecture batch 2 from `99_ingest/To check Architecture A2.txt` — 51 new full-detail sacred-site nodes across Americas (12) + East Asia (12) + Roman Near East + Sumerian + Canaanite (12) + India + SE Asia + Global Christian (15) via 4 parallel sub-agents on disjoint regional scopes. + 647 auto-generated stubs across 04_persons / 05_events / 06_themes / 07_traditions / 02_documents / 03_deities / 08_places / 23_material_culture / 09_symbols. MASSIVE-WIN clusters documented: Mesopotamian 5000-year temple-platform chain, cross-civilization stepped-pyramid convergence, Hindu temple-mountain motif, East Asian Buddhist transmission Tang→Korea→Japan, Anastasis-imitatio Renaissance extension via St Peter's, French High Gothic chain Saint-Denis→Cologne, Ise *shikinen sengū* renewal-as-ritual, Canaanite→Solomon's-Temple architectural lineage, Greco-Buddhist Bamiyan, Justinian's Baalbek column transfer. | 20_sacred_architecture/* (75 total now), 06_themes/* (stubs), 04_persons/* (stubs), 07_traditions/* (stubs), 05_events/* (stubs), 02_documents/_phase-*/* (stubs), 03_deities/* (stubs), 08_places/* (stubs), 23_material_culture/* (stubs), 09_symbols/* (stubs) | 2026-05-19 | FINISHED 2026-05-19 |

| goblin-27-28-29-initial-wave (orchestrated 3 parallel sub-goblins + stub-sweep) | First wave across all three new lenses from the 2026-05-19 ontology lock: 10 full nodes in 27_attire/ (vestments / monastic habits / ritual garments / Five Ks / khirqah / kasaya / pharaonic regalia) + 10 in 28_exchange_networks/ (4 routes + 4 commodities + 2 institutions — Silk Road / Incense Route / Maritime Silk Road / Trans-Saharan + silk / frankincense / lapis lazuli / Tyrian purple + Sogdian network + Carreira da Índia) + 10 in 29_technology/ across all 7 HSST sub-categories (metallurgy / arch / pendentive-dome / distillation / paper / movable-type / compass / qanat / gunpowder / composite-bow). Plus 397 auto-generated stubs across 13 lenses (08_places / 04_persons / 07_traditions / 06_themes / 28_exchange_networks / 05_events / 29_technology / 21_theology / 02_documents / 12_alchemy / 24_pharmacology / 23_material_culture / 14_rituals). | 27_attire/*.md (10), 28_exchange_networks/*.md (10), 29_technology/*.md (10), + 397 stubs across 13 lens folders, 00_meta/ACTIVE-CONTENT.md, 00_meta/STATUS.md | 2026-05-20 | FINISHED 2026-05-20 |

| deity-spine-sentinel | 03_deities/* sweep + sentinel + outward stubs (≤3/deity, lens-correct) — alphabetical batches of 10, 676 total | 03_deities/*.md, 06_themes/*.md (stub only), 04_persons/*.md (stub only), 08_places/*.md (stub only), 02_documents/*.md (stub only), 07_traditions/*.md (stub only), 20_sacred_architecture/*.md (stub only) | 2026-05-21 | started |

_No active claims after this one. Append your row above._

## Stale carry-overs from pre-2026-05-17 (verify before continuing)

These claims existed in the old `ACTIVE-AGENTS.md` without a FINISHED marker. Likely either swept into another agent's commit (the parallel-sweep pattern observed 2026-05-15) or abandoned. Verify against `git log` before reclaiming.

- `sonnet-now-events-1` — app-code / Astrology Now mode — started 2026-05-15 — **now LANE B (UX); reclaim via ACTIVE-UX.md if reviving**
- `sonnet-themes-1` — content / pantheon theme batch — started 2026-05-15 — verify, then close or reclaim
- `goblin-world-wisdom-1` — symbols / ifa-divination + sankofa + quipu + eagle-symbol — started 2026-05-16 — verify, then close or reclaim
- `music-eastasia-1` — East Asian music cosmology strand — 2026-05-16 — verify, then close or reclaim
- `music-raga-singularity-1` — Raga-as-cosmic-clock — 2026-05-16 — verify, then close or reclaim

Full historical claim blocks for all 235 prior batches: [`agents-archive/2026-05-W2-active.md`](agents-archive/2026-05-W2-active.md).

## How to claim (3 lines)

1. Pick a primary document (from `ABSORPTION-QUEUE.md`, `AUDIT/05_priority_queue.md`, or free choice).
2. Append a row to the **In-flight** table: `| your-handle | doc slug or scope | folder-prefix locks | YYYY-MM-DD HH:MM | started |`.
3. When you commit, edit the row's Status to `FINISHED YYYY-MM-DD HH:MM` and add a one-line entry to the top of `00_meta/STATUS.md`.
