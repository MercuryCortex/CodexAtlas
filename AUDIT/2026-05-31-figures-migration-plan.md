# FIGURES MIGRATION — PLAN (2026-05-31)

**Trigger:** rule #10 prospective scan found `FIGURES_IDS` is the same structural-drift loop as `SCRIPTURE_IDS` before the canonical-corpus migration — 319 hand-typed entries parallel to 1,217 vault persons, with the comment in `mode.js` literally acknowledging the planned fix (*"Lane A follow-up: backfill role metadata so coverage grows organically — no need to maintain this list by hand once that lands"*).

**John's directive:** *"plan it how to make it proper academic integrity"* — the migration shape is settled (mirror the canonical-corpus migration). The work that needs ratification BEFORE code is the **scholarly framework**: what counts as a "figure", how each backfill assignment gets a defensible source, what's flagged for review vs auto-applied.

---

## The two-layer problem (this is what makes it not-just-mechanical)

**Layer 1 — Schema (Pattern C):** the current `role:` field is **free-text prose**, not a controlled vocabulary:

| Variant in vault | Count | Issue |
|---|---|---|
| `"prophet"` | 12 | clean |
| `"prophet \| messenger"` | 3 | pipe-separated multi-role |
| `"emperor / persecutor"` | 4 | slash-separated multi-role |
| `"bishop / theologian (Cappadocian Father)"` | 3 | parenthetical scholar-tradition mix |
| `"Ḥanbalī jurist / theologian / polemicist — the keystone medieval intellectual root of modern Salafism..."` | 1 | full-prose description |

No mechanical filter can drive a lens off prose. The schema needs a **controlled vocabulary** alongside the human-readable description.

**Layer 2 — Coverage (Pattern D):** 724 of 1,217 persons have any `role:` value (60%). 493 are unrostered. Even if every existing role-value were clean, the lens-filter would still miss those 493.

**Both layers** must close in the same migration; otherwise we ship a controlled vocabulary that 40% of persons don't carry, and the loop reopens.

---

## Academic-integrity framework

### Source discipline for the role taxonomy

The role-set is itself a scholarly call (who counts as a "religious figure"). Three discipline rules:

1. **Each role category in the taxonomy has a Tier-1 reference** that defines its scope. *Examples (to be ratified):* `prophet` per Heschel 1962 *The Prophets*; `patriarch` per Brown 1981 *Cult of the Saints*; `caliph` per Crone 2004 *God's Rule*; `bodhisattva` per Williams 1989 *Mahāyāna Buddhism*; `tirthankara` per Dundas 2002 *The Jains*; `guru` (Sikh) per McLeod 1989 *Who Is a Sikh?*.

2. **Each per-person role assignment cites a source** — either the person's own YAML `refs:` field, the body text's biographical context, or an external Tier-1 reference. **Silent guessing is forbidden** per `feedback_severity_dogma`.

3. **Edge cases get explicit decisions captured per-file with rationale** — same `SLUG_OVERRIDES` pattern as the canonical-corpus migration. The AUDIT TSV is the audit trail.

### Non-figures: explicit exclusions

The Figures lens is *narrower* than All Persons. The plan must say explicitly who is NOT a figure:

- **Modern secular religious-studies authors** (Frazer, Durkheim, Jung, Eliade, Otto, Smith, Pagels) — these are *Authors*, not Figures. Their work is scripture (now in the `comparative-religion-academic` corpus from yesterday's migration); the persons themselves are scholars about religion, not religious leaders within a living tradition.
- **Ordinary historical witnesses / participants** (named in scripture or chronicle but without a leadership/founding/exemplar role).
- **Purely legendary persons not tied to a documented tradition** (mythic figures that don't have a continuous cult — different from legendary founders who do, e.g. Romulus stays out but Tirthankara Rishabha stays in because Jain cult is continuous and recognizes him).

This boundary is itself a scholarly call. John ratifies it before code ships.

---

## Proposed role taxonomy (controlled vocabulary)

**Multi-value supported.** A person can have ≥1 role (e.g., Akbar = `["emperor", "religious-reformer"]`). The Figures lens includes any person whose role-set intersects the qualifying set.

### Tier 1 — Founders + prophets (always qualifying)

| Role | Defines | Examples | Source |
|---|---|---|---|
| `founder` | Founded a tradition or major branch | Jesus, Buddha, Laozi, Mani, Bahá'u'lláh, Joseph Smith, Guru Nanak, Aleister Crowley (Thelema) | Smith 2009 *Religions of the World* |
| `prophet` | Hebrew/Christian/Islamic prophetic-revelation figure | Moses, Elijah, Isaiah, Jeremiah, Muhammad | Heschel 1962 *The Prophets* |
| `messenger` | Islamic rasūl (subset; Muhammad is both prophet+messenger) | Muhammad | Crone 2004 *God's Rule* |
| `avatar` | Hindu incarnation (when historicized) | Rama, Krishna, Kalki (eschatological) | Klostermaier 2007 *A Survey of Hinduism* |
| `tirthankara` | Jain ford-maker | Rishabha through Mahavira (24 total) | Dundas 2002 *The Jains* |
| `bodhisattva` | Buddhist (when historicized — Padmasambhava et al.; not for purely mythic Bodhisattvas which stay in `03_deities/`) | Padmasambhava, Asanga, Atiśa | Williams 1989 *Mahāyāna Buddhism* |
| `guru-sikh` | Sikh Guru (10) | Guru Nanak through Guru Gobind Singh | McLeod 1989 *Who Is a Sikh?* |

### Tier 2 — Religious authority + scholarship (qualifying)

| Role | Defines | Examples | Source |
|---|---|---|---|
| `pope` | Bishop of Rome | Gregory I, Leo I, John Paul II | Duffy 2014 *Saints and Sinners* |
| `patriarch` | Eastern Orthodox / Oriental Orthodox sees | Athanasius, Cyril of Alexandria | Brown 1981 *Cult of the Saints* |
| `bishop` | Diocesan + theological authority | Augustine, Ambrose, Basil | (as above) |
| `archbishop` | Provincial Christian see | Anselm of Canterbury | (as above) |
| `caliph` | Islamic political-religious leadership | Abu Bakr, Umar, Ali, Uthman | Crone 2004 *God's Rule* |
| `imam` | Shia + general Islamic prayer-leader | The Twelve Imams | Momen 1985 *An Introduction to Shīʿī Islam* |
| `ayatollah` | Twelver mujtahid | Khomeini, Sistani | (as above) |
| `sufi-shaykh` | Sufi master | Rumi, Ibn ʿArabī, al-Ghazālī (also theologian) | Schimmel 1975 *Mystical Dimensions of Islam* |
| `rabbi` | Tannaitic + Amoraic + medieval + modern | Akiva, Maimonides (also philosopher), Baal Shem Tov | Neusner 1973 *History of the Jews* |
| `dalai-lama` | Tibetan Vajrayana incarnation-lineage | The 14 Dalai Lamas | Powers 2007 *Introduction to Tibetan Buddhism* |
| `rinpoche` | Tibetan Buddhist incarnation-lineage (broader) | Padmasambhava (also bodhisattva), Karmapa | (as above) |
| `high-priest` | Israelite, Egyptian, Roman | Aaron, Imhotep, Pontifex Maximus | Goodenough 1953-1968 |

### Tier 2b — Theological/philosophical authorities (qualifying)

| Role | Examples |
|---|---|
| `theologian` | Aquinas, al-Ghazali, Sankara, Origen |
| `philosopher-religious` | Plato, Plotinus (when religiously-philosophical), Maimonides (also rabbi) |
| `jurist-islamic` | al-Shafi'i, Abu Hanifa |
| `jurist-jewish` | Maimonides (also rabbi + philosopher), Caro |
| `sage` | Hillel, Shammai, Confucius, Mencius |
| `mystic` | Teresa of Ávila, Eckhart, Rūmī, Tukaram |
| `heresiarch` | Marcion, Valentinus, Mani (also founder), Arius |

### Tier 3 — Exemplars (qualifying)

| Role | Examples |
|---|---|
| `apostle` | The 12 + Paul + Barnabas |
| `disciple` | The 70/72 + named non-12 followers |
| `saint` | Recognized in cult of saints |
| `martyr` | Documented martyrdom |
| `evangelist` | Author of a Gospel (Mark, Matthew, Luke, John) |

### Tier 4 — Political-religious dual roles (qualifying)

| Role | Examples |
|---|---|
| `emperor` | Constantine, Justinian, Charlemagne, Asoka, Akbar |
| `king` | David, Solomon, Asoka (also emperor), Henry VIII (religious-reformer) |
| `queen` | Helena, Theodora, Elizabeth I (religious-reformer) |
| `pharaoh` | Akhenaten, Ahmose I |
| `religious-reformer` | Luther, Calvin, Wycliffe, Akhenaten (also pharaoh) |

### Tier 5 — NON-qualifying (explicit exclusion)

These persons exist in the vault but DO NOT qualify for the Figures lens:

| Role | Defines | Examples |
|---|---|---|
| `scholar-academic` | Modern religious-studies scholar | Frazer, Durkheim, Jung, Eliade, Otto, Scholem, Pagels |
| `author-secular` | Writer not in religious leadership | Most `04_persons/` entries who only authored documents |
| `witness` | Named in scripture but no leadership role | The Samaritan woman, Joseph of Arimathea (could argue saint), centurion-at-cross (could argue) |
| `legendary-isolated` | Mythic person not tied to a continuous tradition | Romulus, King Arthur (if treated as historical-only-via-Geoffrey) |

These persons KEEP their role assignment for other lenses (Authors, etc.) but **are filtered out of Figures**.

---

## Staged execution plan (mirrors canonical-corpus migration)

### Stage 0 — Plan ratification (THIS DOCUMENT)
- John ratifies: role taxonomy (Tiers 1-5)
- John ratifies: each role's Tier-1 source citation (defensible vs. needs-better-source-and-defer)
- John ratifies: non-figure exclusions (modern academics out, Jung out, etc.)

### Stage 1 — Survey + extract current state
- Parse all 1,217 `04_persons/*.md` files
- For each person: extract current `role:` value (where present) + tradition + body-section hints
- Identify the 319 current FIGURES_IDS members — which of them have a role: field, which don't
- Output: `AUDIT/2026-05-31-figures-survey.tsv` (auditable)

### Stage 2 — Normalize existing `role:` values
- Free-text prose → controlled vocabulary
- `"emperor / persecutor"` → `["emperor", "persecutor"]` (persecutor is Tier-5 NON-qualifying — explicit)
- `"prophet | messenger"` → `["prophet", "messenger"]`
- `"Ḥanbalī jurist / theologian / polemicist — the keystone..."` → `["jurist-islamic", "theologian", "heresiarch-polemicist"]` (and preserve the prose in `role_description:` for human readability)
- Long prose preserved in a separate human-readable field; controlled vocab drives the lens
- Output: TSV showing every normalization with diff

### Stage 3 — Backfill missing `role:` for 493 unrostered persons
- Inference rules: filename pattern (e.g. `gregory-i-pope.md` → `pope`), body section heading scan, YAML `refs:` field source-mining
- Each backfill assignment cites a source (the person's own `refs:` first; fall back to a Tier-1 external citation per the taxonomy table above)
- Uncertain cases (no defensible source) → flagged `confidence: low`, surfaced for John per-file
- **NO silent guessing.** Per `feedback_severity_dogma`.

### Stage 4 — Apply to YAML
- Write `role: ["controlled-vocab-1", "controlled-vocab-2"]` field idempotently
- Preserve the original prose as `role_description:` (human-readable; drives no machinery)
- Single Lane-A commit: ~1,217 persons touched

### Stage 5 — Engine swap (Lane-B)
- Modify `filterNodesByMode('figures')` to read `n.role` (array) and check intersection with the FIGURE_QUALIFYING_ROLES set (Tiers 1-4 above)
- **Delete** `FIGURES_IDS` (now dead)
- **Delete** `SCRIPTURE_IDS` static set + the SCRIPTURE_CORPORA-derived backstop in the scripture filter (both made dead by yesterday's canonical-corpus migration — confirmed by 100% wire coverage)
- `build_data.py` already passes through `role` in `frontmatter` block; needs explicit pass-through at node-dict level for direct access

### Stage 6 — Verify
- Re-run figures-lens filter — coverage should jump from 319 → ~600-800 qualifying persons (depending on Tier-5 exclusion size)
- Re-load Codex/Atlas in Safari, confirm Figures lens renders the expanded set
- Re-check: `audit_dates_2026-05-30.py` still reports 0 flagged
- AUDIT/2026-05-31-figures-migration-post-execution.md captures the result

---

## Cost estimate

| Stage | Type | Cost |
|---|---|---|
| 0 | Plan ratification | this doc + your `go` |
| 1 | Survey script + TSV | ~10 min, mechanical |
| 2 | Normalization script + TSV | ~30 min (regex + multi-value parsing) |
| 3 | Backfill inference script + uncertain-flag review | ~60 min if mechanical-heuristic-only; longer if John reviews 50+ low-confidence cases |
| 4 | Apply YAML field (script) | ~10 min |
| 5 | Engine swap + dead-code delete | ~15 min |
| 6 | Verification | ~10 min |

**Total expected:** ~2-3 hours of mechanical work + ratification time. **Critical path:** Stage 3 review depth. If Stage 1's survey shows the 493 unrostered persons cluster heavily into mechanically-inferrable categories (popes, caliphs, sahaba, gurus, all named-in-canonical-corpus), the inference covers most; if they're scattered with weak metadata, John's review takes longer.

---

## What this prevents (rule #10 prospective benefit)

Without this migration:
- Figures lens stays at 26% coverage
- Every new person added to `04_persons/` is invisible until someone hand-edits `FIGURES_IDS`
- Same drift pattern, same eventual catch-up audit
- Free-text `role:` field stays prose; no other lens-filter can drive off it either

After this migration:
- Figures lens auto-includes any qualifying-role person — no JS edit needed
- Controlled-vocab `role:` field unlocks other lens-filters (could power a Mystics view, Heresiarchs view, Founders timeline, etc.)
- Both `SCRIPTURE_IDS` (static) and `FIGURES_IDS` (static) are deleted — two structural-drift sources gone

---

## Awaiting ratification on

1. **Taxonomy approval** — Tiers 1-5 above. Counter-propose any role categories that miss the right framing, or any role assignments you want to reconsider (e.g., is Crowley a founder? is Akhenaten a founder/religious-reformer/pharaoh ensemble?).
2. **Source citations** — each Tier-1 reference is defensible per the project's methodology; counter-propose any that you want stronger.
3. **Non-figure exclusion list** — particularly: Jung as `scholar-academic` (NOT figure) vs. Jung as `mystic-modern` (IS figure). His own self-understanding was the latter; the religious-studies academy treats him as the former. **You decide which framing the vault adopts.** Same question applies to Eliade, Otto, James.
4. **Multi-value field design** — should the controlled-vocab `role:` field replace the existing free-text, or live alongside it as `role-controlled:` while the prose stays in `role:`? My proposal is to replace + preserve prose in `role_description:` for human-readability. Counter-propose if you prefer a different shape.

**Reply with `go` (apply as proposed) / per-Tier overrides / different framing.** No code ships until ratification is on the record.
