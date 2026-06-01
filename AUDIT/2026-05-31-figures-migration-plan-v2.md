# FIGURES MIGRATION — PLAN v2 (2026-05-31) [SUPERSEDED]

> ⚠️ **SUPERSEDED BY v3** at `AUDIT/2026-05-31-figures-migration-plan-v3.md`. Trio of independent auditors (academic religious-studies / insider-tradition / engineering-loop-prevention) returned FAIL on v2. v3 absorbs all three audits' Tier-A corrections. v2 preserved for diff visibility.

---

# FIGURES MIGRATION — PLAN v2 (2026-05-31, PROTOCOL-COMPLIANT)

**Supersedes:** `AUDIT/2026-05-31-figures-migration-plan.md` (v1). John's correction on standards: *"same standards ofc whatever as most integrity ! im always repeating this"*. v1 fell short of the project's standing protocol; this v2 applies it consistently.

**Standing rules this plan must satisfy** (already in the project, not new):

| Rule | Source | What it requires of this migration |
|---|---|---|
| Tier-1 academic references dictate placement | `methodology.md` §Source-integrity policy + corpora-campaign STATUS entry (2026-05-30) | Role taxonomy must anchor in a peer-reviewed reference work, not my construction |
| No silent guessing | `feedback_severity_dogma_2026-05-24.md` cardinal rule #7 | Every contested role assignment is surfaced as an explicit decision |
| Document fabrications AS fabrications + Tier-1/Tier-4 sourcing per node | `feedback_deviant_bridges.md` | Opponent-categories (heresiarch / antichrist / false-prophet) get marked as polemical-framing, not vault-authoritative roles |
| WIRING LAW + schema discipline | Cardinal rule #4 | Controlled vocabulary persists in `00_meta/role-vocabulary.yaml`; `lint_yaml.py` validates every role value; build fails on unknown |
| Use canonical primitives, no parallel duplications | Cardinal rule #7 (severity dogma) | Mirror existing `00_meta/tradition-vocabulary.yaml` pattern exactly; don't invent a new schema shape |

The infrastructure for ALL of these already exists in the vault. v1's failure was not applying it.

---

## Canonical reference framework (the anchor v1 lacked)

**Primary anchor:** Bowker, John (ed.). *The Oxford Dictionary of World Religions*. Oxford University Press, 1997 (rev. 2003). The standard peer-reviewed single-volume academic reference for cross-tradition religious studies — each entry written by a specialist, edited under Bowker's coordination at Cambridge. Use Bowker's classification system for the spine.

**Secondary depth (per-tradition specialists when Bowker is thin):**
- Jones, Lindsay (ed.). *Encyclopedia of Religion* (2nd ed). Macmillan Reference, 2005. (Eliade-founded but Jones-revised; 16 vols, ~3,300 specialist articles)
- Smith, Huston. *The World's Religions* (rev. ed). HarperOne, 2009.
- Per-tradition gold-standard works listed in `methodology.md` §References.

**The classification spine.** Bowker organizes religious actors into ~30 categories. The vocabulary below tracks these with project-specific disambiguation (multi-tradition homographs split to distinct tokens).

---

## Schema design — mirror `tradition-vocabulary.yaml` exactly

The migration produces `00_meta/role-vocabulary.yaml` with the same schema as the existing tradition vocab:

```yaml
# 00_meta/role-vocabulary.yaml
# Built 2026-05-31 in response to AUDIT/2026-05-31-figures-migration-plan-v2.md.
# Mirrors 00_meta/tradition-vocabulary.yaml schema exactly.

# Each entry:
#   id:               lowercase slug (the canonical identifier, used in YAML role: arrays)
#   display:          human-readable label for UI
#   tier:             1..5 per the taxonomy below
#   figure_qualifying: bool — does this role qualify a person for the Figures lens
#   source:           Tier-1 reference defining the category
#   notes:            scope boundary / disambiguation
#   aliases:          free-text strings observed in current node YAML that resolve to this id
#                     (normalization input for build_data.py)

roles:
  - id: prophet-abrahamic
    display: Prophet (Abrahamic)
    tier: 1
    figure_qualifying: true
    source: "Heschel, Abraham Joshua. The Prophets. Jewish Publication Society, 1962."
    secondary: ["Bowker 1997 'prophets' entry"]
    notes: Hebrew/Christian/Islamic prophetic-revelation figures. Distinct from prophet-classical-greek (Pythia, Sibyl) which is a separate id.
    aliases: ["prophet", "prophet | messenger"]
  # ... ~40 more
```

The `aliases:` field lets build_data.py mechanically resolve the current free-text `role:` values to canonical ids — same pattern that closed the tradition-string drift in 2026-05-14.

---

## Taxonomy — anchored in Bowker 1997

### Tier 1 — Founders + revelation-bearers (figure-qualifying)

| id | Bowker classification | Tier-1 source | Examples |
|---|---|---|---|
| `prophet-abrahamic` | "Prophets" | Heschel 1962 *The Prophets* | Moses, Isaiah, Jeremiah, Muhammad (also messenger), Joseph Smith (also founder) |
| `messenger-islamic` | "Rasul" entry | Crone 2004 *God's Rule* | Muhammad (the rasūl per the Islamic theological definition; distinct from the broader prophet category) |
| `founder` | "Founders of religions" | Smith 2009 *World's Religions* ch. on tradition-founders | Jesus, Buddha, Laozi, Mani, Bahá'u'lláh, Joseph Smith, Guru Nanak, Mahavira |
| `avatar-hindu` | Klostermaier 2007 *A Survey of Hinduism* §avatāra | (same) | Rama, Krishna, Kalki (eschatological — included with note) |
| `tirthankara-jain` | Dundas 2002 *The Jains* §Tirthankaras | (same) | Rishabha through Mahavira (the 24) |
| `bodhisattva-historicized` | Williams 1989 *Mahāyāna Buddhism* | (same) | Padmasambhava, Asanga, Atiśa — historical figures who got bodhisattva-recognized. Mythic bodhisattvas (Avalokitesvara, Mañjuśrī) stay in `03_deities/` |
| `guru-sikh` | McLeod 1989 *Who Is a Sikh?* | (same) | The 10 Sikh Gurus only |

### Tier 2 — Religious authority (figure-qualifying), multi-tradition homographs split

| id | Notes | Source |
|---|---|---|
| `pope-roman-catholic` | Bishop of Rome only | Duffy 2014 *Saints and Sinners* |
| `patriarch-hebrew` | Genesis patriarchs (Abraham, Isaac, Jacob) | Sarna 1989 *JPS Torah Commentary: Genesis* |
| `patriarch-jewish-late-antique` | Late-antique Jewish Patriarchate of Palestine (Hillel through Gamaliel VI) | Goodman 1983 *State and Society in Roman Galilee* |
| `patriarch-christian-orthodox` | Eastern Orthodox / Oriental Orthodox sees | Brown 1981 *Cult of the Saints* |
| `bishop-christian` | Diocesan + theological authority | (same) |
| `archbishop-christian` | Provincial see | (same) |
| `caliph-sunni` | Sunni framing; marked-as-such because Shia rejects | Crone 2004 *God's Rule* |
| `imam-twelver` | The Twelve Imams specifically | Momen 1985 *An Introduction to Shīʿī Islam* |
| `imam-prayer-leader` | General Islamic prayer-leadership role (broader); not figure-qualifying by itself UNLESS combined with another role | Bowker 1997 'imam' entry |
| `ayatollah-twelver` | Modern Twelver mujtahid | (Momen 1985) |
| `sufi-shaykh` | Sufi master | Schimmel 1975 *Mystical Dimensions of Islam* |
| `rabbi-tannaitic` | 1st-2nd c. CE Mishnaic sages | Neusner 1973 *Rabbinic Judaism* |
| `rabbi-amoraic` | 3rd-5th c. CE Talmudic sages | (same) |
| `rabbi-medieval` | Geonic + Rishonim period | (same) |
| `rabbi-modern` | Modern Orthodox / Conservative / Reform | (same) |
| `dalai-lama` | Tibetan Vajrayana incarnation-lineage (Gelug) | Powers 2007 *Introduction to Tibetan Buddhism* |
| `rinpoche` | Tibetan incarnation-lineage broader | (same) |
| `high-priest-israelite` | Aaronic line | Goodenough 1953-1968 *Jewish Symbols* |
| `high-priest-egyptian` | Egyptian temple priesthood top rank | Wilkinson 2003 *The Complete Gods and Goddesses of Ancient Egypt* |
| `high-priest-roman` | Pontifex Maximus | Beard, North, Price 1998 *Religions of Rome* |

### Tier 2b — Theological / philosophical authority (figure-qualifying)

| id | Notes |
|---|---|
| `theologian` | Doctrinal-systematic religious thinker (Aquinas, al-Ghazali, Sankara, Origen) |
| `philosopher-religious` | When religiously-philosophical (Plato, Plotinus, Maimonides — also rabbi-medieval) |
| `jurist-islamic` | Fiqh authority (al-Shafi'i, Abu Hanifa, Malik, Ibn Hanbal) |
| `jurist-jewish` | Halakhic authority (Maimonides — also rabbi-medieval, Caro, Karo) |
| `sage` | Pre-systematic wisdom-figure (Hillel, Shammai, Confucius, Mencius, Laozi — also founder) |
| `mystic` | Mystical-experience-defining figure (Teresa of Ávila, Eckhart, Rūmī — also sufi-shaykh, Tukaram) |

### Tier 3 — Exemplars (figure-qualifying)

| id | Notes |
|---|---|
| `apostle-christian` | The 12 + Paul + Barnabas + Mary Magdalene (per Eastern recognition) + Junia |
| `disciple-christian` | The 70/72 + named non-12 followers |
| `evangelist-christian` | The four Gospel-attributed authors specifically |
| `saint-christian` | Recognized in any cult of saints (Catholic + Orthodox + Anglican + Coptic + etc.) |
| `martyr` | Documented martyrdom across traditions (Christian, Bahá'í Báb, Sikh Gurus Tegh Bahadur + Arjan, etc.) |
| `sahabi` | Companion of Muhammad (specifically Islamic category) |
| `tabiun` | Successors to the Sahaba |
| `arhat-buddhist` | Theravāda enlightened-disciple category (when historical) |

### Tier 4 — Political-religious dual (figure-qualifying when religious-dimension is documented)

| id | Notes |
|---|---|
| `emperor` | Constantine, Justinian, Charlemagne, Asoka (also patron-of-buddhism), Akbar (also religious-reformer) |
| `king` | David, Solomon, Asoka (also emperor), Henry VIII (also religious-reformer), Suleiman (also caliph-sunni) |
| `queen` | Helena, Theodora, Elizabeth I (also religious-reformer) |
| `pharaoh` | Akhenaten (also religious-reformer), Ahmose I |
| `religious-reformer` | Luther, Calvin, Wycliffe, Akhenaten (also pharaoh), Akbar (also emperor) |
| `state-founder` | Khomeini (also ayatollah-twelver), Joseph Smith (also founder), David Ben-Gurion (state of Israel, NOT a religious figure — explicit non-qualifying when standing alone) |

### Tier 5 — NON-qualifying (kept for other lenses; explicitly OUT of Figures)

| id | Why out | Examples |
|---|---|---|
| `scholar-academic-religion` | Modern academic about religion, not within a religious leadership role | Frazer, Durkheim, Otto, Eliade, Jonas, Scholem (boundary case — see contested-cases), Pagels, Yates, Smith-w-c, Bowker himself |
| `author-secular` | Writer not in religious leadership | Most `04_persons/` entries who only authored documents |
| `psychologist-of-religion` | William James, Jung (boundary — see contested-cases) |
| `witness` | Named in scripture/chronicle but no leadership role | Samaritan woman (Sychar), Roman centurion at cross |
| `legendary-isolated` | Mythic person not tied to continuous tradition | Romulus (Roman religion ends; tradition-of-Romulus does not continue) |
| `historical-cited` | Ordinary historical figure named but not religious | Marco Polo, ordinary kings named for events |

### Opponent-category — NOT a primary role

Per `feedback_deviant_bridges.md`: opponent-claimed categories are NOT vault-authoritative roles. They get captured in a separate `polemical-framing:` field:

```yaml
role: ["founder", "theologian"]   # what the person was, per scholarship
polemical-framing:
  - by: "Christian-orthodox (4th-c.)"
    label: "heresiarch"
    source: "Brakke 2010 The Gnostics"
```

This applies to: heresiarch, false-prophet, antichrist, schismatic, infidel, apostate (when applied by opponents), idolater, magician (when polemical).

The Figures lens reads `role:` only. `polemical-framing:` is metadata for the side-panel + theological-history views; it never qualifies for Figures.

---

## Contested cases — explicit ratification list

These cases are **named decisions** per the no-silent-guessing rule. My proposed call is below; counter-propose any per-case. Don't bury any of these in inference.

### Modern religious-studies academics

| Person | My proposal | Rationale |
|---|---|---|
| James Frazer | `scholar-academic-religion` (Tier 5, NOT figure) | Anthropologist + classicist, no religious leadership |
| Émile Durkheim | `scholar-academic-religion` (NOT figure) | Sociologist of religion |
| Rudolf Otto | `scholar-academic-religion` + `theologian` (figure-qualifying via theologian — he was a Lutheran theologian secondarily) | Both — primary academic, secondary theologian |
| William James | `psychologist-of-religion` (NOT figure) | Philosopher-psychologist; never in religious leadership |
| **Carl Jung** | **`psychologist-of-religion` (NOT figure)** | His own self-understanding included mystical dimensions but the academic religious-studies consensus treats him as scholar-of-religion. Boundary case. |
| Mircea Eliade | `scholar-academic-religion` (NOT figure) | Historian of religion |
| Hans Jonas | `scholar-academic-religion` (NOT figure) | Philosopher of Gnosticism |
| Elaine Pagels | `scholar-academic-religion` (NOT figure) | NT studies professor |
| **Gershom Scholem** | **`scholar-academic-religion` + `philosopher-religious` (figure-qualifying)** | Boundary case. Founder of academic Kabbalah studies AND a religiously-engaged Jewish thinker who shaped 20th-c. Jewish theology. I lean qualifying. |
| Frances Yates | `scholar-academic-religion` (NOT figure) | Warburg historian |
| Bart Ehrman | `scholar-academic-religion` (NOT figure) | NT historical-critical scholar |
| Robert Bellah | `scholar-academic-religion` (NOT figure) | Sociologist of religion |
| John Hick | `scholar-academic-religion` + `theologian` (figure-qualifying via theologian — he was an ordained Presbyterian minister + philosophical theologian) | Both |

### Esoteric founders (NRM-studies recognizes; older-academy disputes)

| Person | My proposal | Rationale |
|---|---|---|
| Aleister Crowley | `founder` (Thelema) + `mystic` (figure-qualifying) | NRM scholarship (Bogdan & Starr 2012, Pasi 2014) treats Thelema as a religion he founded |
| Anton LaVey | `founder` (Church of Satan, 1966) | NRM scholarship recognizes |
| Helena Blavatsky | `founder` (Theosophy) | Same |
| G.I. Gurdjieff | `founder` (Fourth Way) + `mystic` | NRM/Western esotericism scholarship |
| Rudolf Steiner | `founder` (Anthroposophy) | Same |
| Frithjof Schuon | `sufi-shaykh` (Maryamiyya order — actually founded a Sufi tariqa) + `philosopher-religious` (Traditionalist) | Both — primary Sufi-shaykh per his own claim and his order's continuity |
| René Guénon | `philosopher-religious` (Traditionalist) + `sufi-shaykh` (converted to Sufi Islam, took shaykh-rank in Egypt) | Both |
| Edgar Cayce | `founder` (Association for Research and Enlightenment) — figure-qualifying | His tradition continues with active membership |
| Graham Hancock | `scholar-academic-religion` Tier-4-sourced + explicit polemical-framing as "pseudo-scholar" per academic consensus (NOT figure) | Per deviant-bridges memory: document the Tier-4 sourcing AS Tier-4 |

### Political-religious dual roles (multi-role assignment)

| Person | My proposal |
|---|---|
| Akhenaten | `["pharaoh", "religious-reformer"]` |
| Asoka | `["emperor", "religious-reformer"]` (patron-of-Buddhism is `religious-reformer` in role terms) |
| Constantine | `["emperor", "religious-reformer"]` |
| Charlemagne | `["emperor", "religious-reformer"]` |
| Akbar | `["emperor", "religious-reformer"]` |
| Henry VIII | `["king", "religious-reformer"]` |
| Elizabeth I | `["queen", "religious-reformer"]` |
| Khomeini | `["ayatollah-twelver", "state-founder"]` |
| Joseph Smith | `["founder", "prophet-abrahamic"]` (Mormonism frames him as prophet) |
| Bahá'u'lláh | `["founder", "prophet-abrahamic"]` (Bahá'í frames him as Manifestation, mapped to prophet category) |

### Modern Christian boundary

| Person | My proposal |
|---|---|
| Dietrich Bonhoeffer | `["theologian", "martyr"]` (figure-qualifying) |
| C.S. Lewis | `["theologian", "author-secular"]` (figure-qualifying via theologian; his Christian apologetics is doctrinal-systematic) |
| Thomas Merton | `["mystic", "theologian"]` |
| Dorothy Day | `["religious-reformer", "saint-christian"]` (cause for canonization is open; saint applied prospectively per Bowker 1997 'saints' entry's contemporary-usage allowance) |
| Martin Luther King Jr. | `["religious-reformer", "martyr"]` |
| Mother Teresa | `["saint-christian", "religious-reformer"]` (canonized 2016) |
| Padre Pio | `["saint-christian", "mystic"]` (canonized 2002) |

---

## Decision tree — for reproducibility

Any reviewer (human or future agent) classifies a person by walking this tree:

```
1. Is the person primarily a religious founder, prophet, or revelation-bearer of a tradition?
   → YES: assign Tier 1 role(s). Multi-role if multi-aspect (Joseph Smith = founder + prophet-abrahamic).
   → NO: continue.

2. Did the person hold institutional religious authority?
   → YES: pope-roman-catholic / patriarch-{hebrew|jewish-late-antique|christian-orthodox} / 
          bishop-christian / caliph-sunni / imam-twelver / sufi-shaykh / 
          rabbi-{tannaitic|amoraic|medieval|modern} / dalai-lama / etc.
          (multi-tradition disambiguation MANDATORY per the homograph rule)
   → NO: continue.

3. Did the person produce theological / philosophical / juristic doctrine within a tradition?
   → YES: theologian / philosopher-religious / jurist-{islamic|jewish} / sage / mystic.
   → NO: continue.

4. Is the person an exemplar in their tradition (apostle / disciple / saint / martyr / sahabi)?
   → YES: assign exemplar role.
   → NO: continue.

5. Did the person hold political-religious dual office?
   → YES: emperor / king / queen / pharaoh + religious-reformer if reform-act documented.
   → NO: continue.

6. Is the person an academic-about-religion (modern religious-studies scholar)?
   → YES: scholar-academic-religion (Tier 5, NOT figure). 
          → Sub-check: did they also hold theological role / ordained ministry?
            → YES: add `theologian` (figure-qualifying); double-role.
            → NO: Tier-5 only.
   → NO: continue.

7. Is the person an opponent-categorized figure (heresiarch / antichrist by polemic)?
   → YES: assign the SCHOLARLY role for what they actually were (founder / theologian / 
          heterodox-founder if applicable) + add `polemical-framing:` field with the 
          opponent's framing + source.
   → NO: continue.

8. Default: `author-secular` or `historical-cited` (Tier 5, NOT figure).
```

---

## Persistence — the framework must outlive this session

v1 left the taxonomy in an AUDIT doc (not loaded as agent memory). v2 persists it in three places where future agents WILL find it:

1. **`00_meta/role-vocabulary.yaml`** — machine-readable, mirrors `tradition-vocabulary.yaml` shape. Source of truth.
2. **`00_meta/methodology.md` §"Role taxonomy"** — narrative explanation + the decision tree above + the canonical-reference anchor (Bowker 1997). Loaded at session start per the pre-flight protocol.
3. **`lint_yaml.py`** — extended with a `validate_roles()` function that:
   - Loads `role-vocabulary.yaml`
   - For every node with `role:`, checks each entry is a known id
   - **ERROR** on unknown role values (build-time gate, fails CI per `--strict`)
   - Same pattern as the existing tradition-vocab consumer once that ships (which the existing vocab file flagged as the natural follow-up)

This closes the loop-prevention requirement at the build layer — schema drift catches at lint-time, not at next-audit-time.

---

## Sub-tradition canonization — explicit scope boundary

v1's failure included "scope is too narrow — `tradition:` and `sub-tradition:` are the next Pattern-C candidates". v2 acknowledges this but **does NOT extend scope** unilaterally. Sub-tradition canonization is the natural follow-up migration, ratified separately. This v2 plan is role-only.

The reason: doing both in one ratification would overload the contested-cases list (sub-tradition has its own ~50-100 contested calls — Bhakti-Shaiva vs. Bhakti-Vaishnava placement; Mahayana-Vajrayana boundary; Reformed vs. Calvinist; etc.). Better to land role with full integrity, then run the same protocol on sub-tradition.

This is itself a top-tier discipline call: don't bundle scope you can't ratify rigorously.

---

## Staged execution (same shape as canonical-corpus migration, with v2 integrity)

| Stage | Output | Standing-protocol compliance |
|---|---|---|
| 0 | This plan + John ratification on the contested-cases list | Tier-1 anchor (Bowker), no silent guessing, scope-bounded |
| 1 | `00_meta/role-vocabulary.yaml` (the vocabulary file, mirroring tradition-vocabulary.yaml) | Canonical primitive reuse |
| 2 | `00_meta/methodology.md` §Role taxonomy added | Framework persistence in canonical location |
| 3 | `scripts/migrate_roles.py` survey + normalize + backfill script with explicit-decisions list of ratified contested cases baked in (no inference for those) | No silent guessing |
| 4 | `AUDIT/2026-05-31-roles-migration-table.tsv` — per-person assignment + source + confidence + decision-tree-step | Audit trail per source-integrity policy |
| 5 | Apply YAML field to 1,217 person files (Lane-A; controlled-vocab `role:` array + preserved `role_description:` prose) | Schema discipline |
| 6 | `lint_yaml.py` extended with `validate_roles()` + role-vocab schema enforcement | Build-time gate per wiring-law spirit |
| 7 | `mode.js` filterNodesByMode('figures') reads `role:` array, intersects with figure-qualifying set; `build_data.py` passes through canonical role array | Engine swap |
| 8 | Delete `FIGURES_IDS` + `SCRIPTURE_IDS` static set + SCRIPTURE_CORPORA-derived backstop (all dead post-migration) | Dead-code purge per anti-patterns rule |
| 9 | Verify: re-run lint, re-load Codex Atlas, confirm Figures lens expanded coverage, audit_dates still flags 0 | Verification ritual |
| 10 | `AUDIT/2026-05-31-figures-migration-POST-EXECUTION.md` + STATUS entry + memory file if new pattern surfaces | End-of-session checklist (cardinal rule #11 / §11) |

---

## What v2 prevents that v1 didn't

| Loop risk | v1 status | v2 status |
|---|---|---|
| Taxonomy drift (new role value silently added without vocab update) | unmitigated | caught by `lint_yaml.py validate_roles()` at build time |
| Framework lost across sessions | unmitigated (AUDIT doc not loaded as memory) | persists in `methodology.md` (loaded session-start per pre-flight) + `role-vocabulary.yaml` (machine-readable) |
| Contested cases silently decided | guaranteed | enumerated in this doc, John ratifies each |
| Opponent-category-as-vault-truth | guaranteed (heresiarch as primary role) | separated into `polemical-framing:` field, role: stays scholarly-neutral |
| Multi-tradition homograph conflation | guaranteed | tokens split (`patriarch-{hebrew,christian-orthodox,jewish-late-antique}`) |
| Reproducibility-of-classification | failed (vibes-based taxonomy) | decision tree above |
| Scope-overreach without ratification | risked (sub-tradition unilaterally extended) | scope explicitly bounded to role |

---

## Ratification asks (the only thing blocking Stage 1)

1. **Canonical anchor:** Bowker 1997 *Oxford Dictionary of World Religions* as primary spine; Eliade/Jones 2005 *Encyclopedia of Religion* + per-tradition specialists as secondary. **`go` to confirm or name a different anchor.**
2. **Contested-cases list above:** review my proposed call per case. **Counter-propose any.** Particular attention to Jung, Scholem, Schuon, Guénon, Cayce (the boundary judgements).
3. **Opponent-category handling:** `polemical-framing:` as a separate field (not a `role:`). **`go` or counter.**
4. **Scope boundary:** role-only this migration; sub-tradition canonization deferred to a separate ratification. **`go` or extend scope.**
5. **Persistence locations:** `role-vocabulary.yaml` + `methodology.md` §Role taxonomy + `lint_yaml.py validate_roles()` + (the existing) `tradition-vocabulary.yaml` consumer that's flagged as natural-follow-up gets shipped alongside. **`go` or different placement.**

Reply with `go` (apply as proposed) / per-case override list / different anchor. No Stage 1 code ships until ratification is on the record.

This is what same-standards looks like for this migration.
