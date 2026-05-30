# DATE AUDIT — PASS 3 FINDINGS (2026-05-30)

**Mandate from John:** *"audit the Rigor"* — Pass-1 and Pass-2 (commits `cd977080` / `7c34c99b` / `2b7e28e7` / `d7e5980c`) closed all field-presence gaps (209 → 0 flagged). Pass-3 audits **value correctness** of nodes that already have populated date pairs.

---

## TL;DR — the rigor problem is bigger than Pass-2 closed

Pass-2 fixed the *shape* of the data (every node has both endpoints). Pass-3 finds the *values* are still wrong in three systematic ways:

1. **44 nodes have `2025` annual values** that should rollover to `2026` (all in clearly-active traditions)
2. **28 Egyptian deities have `LATEST=400`** — pass-2 standardized Egyptian terminus to `500` (Philae 535 CE) but missed these — Pass-2 standardization GAP
3. **~17 deities from active traditions are coded as extinct** — `yahweh=0`, `agni=0`, `indra=500`, `soma=0`, `ahura-mazda=700`, etc. — direct violations of ratified Rule A

Plus a `null` backlog (29 files) and broken-placeholder edge cases (`rishabha-jain: -999999999 / -999999000`).

The vault is self-inconsistent: `yama-vedic=2026` but `indra=500`; `vishnu=2026` but `agni=0`; `allah=2025` but `yahweh=0`. **Same Rule A, opposite results.** Pass-3 closes that inconsistency.

---

## Method

- **Pilot (60 nodes, 4 clusters)**: Greek-Roman, Egyptian, Indic, Abrahamic clusters audited by 4 parallel goblins. 13 HIGH-CONFIDENCE-WRONG findings.
- **Mechanical sweep (entire vault)**: Python search for `LATEST=2025`, Egyptian-tagged `LATEST=400`, active-tradition `LATEST<2000`, and `LATEST=null|empty`.

The pilot validated the audit framing. The mechanical sweep surfaced the systematic patterns.

---

## Tier 1 — Annual rollover `2025 → 2026` (44 files, MECHANICAL)

All 44 nodes carry `period-active-latest: 2025` AND are in unambiguously-active living traditions (Hindu, Vajrayāna Buddhism, Mahāyāna, Sufi, Kabbalah, Mandaean, Chinese folk, Dogon, Khoisan San). No scholarship judgment required — pure annual cosmetic refresh against today's date 2026-05-30.

```
erlang-shen mahakala mara-demon rama ruha nommo sun-wukong the-sefirot
lilith al-haqq padmasambhava hanuman chakrasamvara amma-dogon
avalokitesvara ein-sof cagn murugan ptahil krishna saraswati kali
samantabhadra-buddha vajrasattva allah metatron guan-yu haoma-zoroastrian
manasa-devi kalachakra manda-d-hayyi vajradhara hayyi-rabbi tu-di-gong
durga ganesha nur-muhammadi dizang-ksitigarbha abathur lakshmi guanyin
tara vajrayogini shekhinah
```

**Action:** mechanical sed/Python sweep on `period-active-latest: 2025` → `period-active-latest: 2026` for the explicit file allowlist above. No false-positive risk.

**Future-proofing:** consider `scripts/annual_rollover.py` to run yearly.

---

## Tier 2 — Egyptian terminus standardization gap (28 files, MECHANICAL)

Pass-2 ratified Egyptian cult terminus = **500 CE** (Philae 535 CE bookend; per pass-1 report: *"Egyptian extinct (Ihy, Ma-at, Ammit) | 500 | Philae closure 535 CE bookend — matches Ra=500"*). The Egyptian goblin's Pass-3 finding confirmed the gap: **`thoth`, `horus`, `atum`, `amun` carry `400`** despite being core Egyptian deities, while `ra`, `osiris`, `ma-at` carry `500`. The mechanical sweep found 28 such Egyptian-tagged deities all with `LATEST=400`:

```
nun banebdjedet geb amun-ra nekhbet neith amun bastet kek-egyptian
sekhmet tefnut khnum ptah anput anubis set thoth agathos-daimon atum
khepri shu wadjet serapis hathor nut apis-bull horus nephthys
```

**Action:** mechanical bump `400 → 500` for the explicit file allowlist above. Completes Pass-2's ratified standardization.

**Edge note:** `agathos-daimon` (Greco-Egyptian Hermetic syncretism) and `serapis` (Ptolemaic state cult) are arguably Hellenistic-not-Egyptian-pure, but both ended in the same Theodosian-to-Justinian arc as the rest of Egyptian religion, so 500 still fits.

---

## Tier 3 — Active-tradition deities coded as extinct (NEEDS YOUR RATIFICATION before apply)

These violate the **Pass-1 ratified Rule A** (`period-active-latest = last year of unbroken continuous cult under this name or its direct syncretic continuation`):

### Indic — Vedic foundational deities continuously invoked in living ritual

| File | Current | Proposed | Rationale |
|---|---|---|---|
| `agni.md` | -1500 / **0** | -1500 / **2026** | Invoked daily in Agnihotra by tens of thousands of Brahmins. Living Vedic ritual. |
| `indra.md` | -1500 / **500** | -1500 / **2026** | Continuous Vedic ritual (Soma yāga, Srauta, Agnihotra); also Sakra in every living Mahāyāna/Vajrayāna lineage. |
| `soma.md` | -1500 / **0** | -1500 / **2026** | Soma yāga by Nambudiri Brahmins still performed (last fully-documented Panjal Atirātra 2011, Staal-documented). |
| `varuna.md` | -1500 / **500** | -1500 / **2026** | Continuous Vedic ritual + tirtha; invoked in śrāddha and water-ritual contexts. |
| `mitra-vedic.md` | -1500 / **500** | -1500 / **2026** | Continuous Vedic ritual. Distinct from `mithra-zoroastrian` and `mithras-roman` — those have their own nodes. |
| `prajapati.md` | -1000 / **200** | -1000 / **2026** | Living Vedic ritual (esp. cosmogonic-Purushasūkta context); Aśvamedha tradition Hindu revivalist context. |
| `rudra-shiva-early.md` | -1500 / **500** | -1500 / **2026** | Direct continuous line to current Shaivism; Rudra-Shiva continuity is a hallmark of Hindu studies. |

### Iranian — Zoroastrianism is ACTIVE (Parsi + Iranian Mazdayasna)

| File | Current | Proposed | Rationale |
|---|---|---|---|
| `ahura-mazda.md` | -1200 / **700** | -1200 / **2026** | Supreme deity of active Zoroastrianism (~200K Parsi + Iranian adherents). |
| `mithra-zoroastrian.md` | -1500 / **700** | -1500 / **2026** | Invoked in living Yasna ritual; Mihragan festival still observed. |
| `anahita.md` | -1000 / **700** | -1000 / **2026** | Living Yazata, invoked in Avesta-recitation contexts (especially Aban Yasht). |
| `tishtrya.md` | -1500 / **700** | -1500 / **2026** | Yazata in living Yasna; Tishtar Yasht recited. |
| `spenta-mainyu.md` | -1200 / **700** | -1200 / **2026** | Core dualistic principle in living Zoroastrian theology. |
| `angra-mainyu-ahriman.md` | -1200 / **700** | -1200 / **2026** | Cosmological figure in living Yasna ritual (negative pole). |
| `apam-napat-zoroastrian.md` | -1500 / **700** | -1500 / **2026** | Inherited Proto-Indo-Iranian yazata; in living Avesta cycle. |
| `the-amesha-spentas.md` | -1200 / **700** | -1200 / **2026** | Living Zoroastrian core — the seven Bounteous Immortals invoked in every Yasna. |

### Abrahamic — yahweh + satan-christian (pilot findings already surfaced)

| File | Current | Proposed | Rationale |
|---|---|---|---|
| `yahweh.md` | -1300 / **0** | -1300 / **2026** | YHWH/Adonai is the continuously-worshipped God of Judaism. Hellenistic-roughline `0` cutoff violates ratified Rule A. The fact that `allah=2025`, `jesus-christ-deity=2026`, `god-the-father-christian=2026` are all coded as active but `yahweh=0` is the most glaring self-inconsistency in the vault. |
| `satan-christian.md` | -300 / **null** | -300 / **2026** | Active in Christian doctrine continuously; YAML `null` is a schema violation. |

**Total Tier-3 confident applications: 17 files.**

### Tier-3 edge cases (NOT auto-apply, want your call)

| File | Current | Question |
|---|---|---|
| `dyaus-pita.md` | -4000 / -800 | Vedic but archaic and almost never invoked in modern ritual. Probably stays. |
| `vritra.md` | -1500 / -500 | Vedic ANTI-god (slain-by-Indra figure). Demonological-mythological reference, not actively worshipped. Stays? |
| `ushas.md` | -1500 / -500 | Vedic dawn goddess. Invoked in Gāyatrī-mantra-adjacent dawn-prayers. Possibly 2026. |
| `aditi.md` | -1500 / -500 | Vedic mother goddess. Less ritually present in modern Hinduism. |
| `hokmah-hebrew.md` | -800 / 200 | Wisdom-figure. Continues into Christian Sophia (separate node) + Kabbalistic Hokmah (separate node) + Rabbinic. Should the Hebrew-specific node end at -200/200 or run to 2026? |
| `azazel.md` | -700 / 200 | Listed in Jewish Yom Kippur scapegoat liturgy (current). Active? |
| `nanghaithya-daeva.md` | -1500 / 700 | Zoroastrian demoted-demon (daēva-class). Analog to vritra. Stays? |
| `kama-vedic.md` | -1500 / 1700 | Kāmadeva. Continuously invoked (Holī/Vasanta contexts). Probably 2026, but 1700 is odd. |
| `dhanvantari.md` | -1500 / 1900 | Hindu Ayurveda god. Ayurveda actively practiced. Probably 2026. |
| `mahavira-jain.md` | -599 / -527 | These are his *life* dates (24th Tīrthaṅkara died ~-527). Jainism is ACTIVE → his cult-active range is to 2026. But values may have been intended as life-period, not cult-active. Schema-tension. |
| `rishabha-jain.md` | -999999999 / -999999000 | Placeholder error (1st Tīrthaṅkara in Jain cosmology, "billions of years ago"). Should map to a real conventional date. |
| `verethraghna-zoroastrian.md` | -1200 / null | Zoroastrian Yazata, active. → 2026. (Currently `null`, should be in T3 not edge.) |
| `kalki.md` | 400 / null | Vaishnava 10th avatar (future eschatological). Range is awkward — he hasn't yet manifested. Schema-tension. |

---

## Tier 4 — `null` / empty `period-active-latest` backlog (29 files)

A regression from Pass-1/2 — these should not have shipped with `null` or empty values. Each needs per-file scholarship:

```
laima babalu-aye yan-wang adamastor boann velinas ame-no-uzume
kagutsuchi chitragupta sarutahiko hwanin ogma muhammad-al-mahdi tangun
shennong aengus-og verethraghna-zoroastrian olokun kalki meness zemyna
hwanung bhaisajyaguru aganju ame-no-hohi macha oduduwa satan-christian
baphomet
```

Quick triage by tradition:

| Tradition (active) | Files | Proposed latest |
|---|---|---|
| Yoruba | babalu-aye, olokun, aganju, oduduwa | 2026 |
| Shinto | ame-no-uzume, kagutsuchi, sarutahiko, ame-no-hohi | 2026 |
| Mahayana Buddhism | bhaisajyaguru | 2026 |
| Korean Muism | tangun, hwanin, hwanung (mythological-progenitors with active modern cult) | 2026 |
| Chinese folk | yan-wang, shennong | 2026 |
| Zoroastrian | verethraghna-zoroastrian | 2026 |
| Hindu | chitragupta, kalki (eschatological — separate question) | 2026 / N/A |
| Twelver Shia | muhammad-al-mahdi (occulted but doctrinally active) | 2026 |
| Christian active demonology | satan-christian, baphomet (Western occult/Satanism active) | 2026 / 2026 |

| Tradition (extinct) | Files | Proposed latest |
|---|---|---|
| Baltic pre-Christian | laima, velinas, meness, zemyna | 1387 (Lithuania) / 1525 (Latvia) |
| Irish Celtic pre-Christian | boann, ogma, aengus-og, macha | 600 (Christianization of Ireland) |
| Portuguese literary | adamastor (1572 Camões invention) | literary-only, separate schema question |

**Action plan:** apply tradition-clean-cases mechanically (Yoruba + Shinto + Mahayana + Korean + Chinese folk + Zoroastrian + clear-Hindu + Mahdi + Satan / Baphomet active-occult = 2026; Baltic = 1387/1525; Celtic = 600). Adamastor + Kalki = surface schema-tension to John.

---

## FALSE POSITIVES from the active-tradition regex (DO NOT FIX)

The active-tradition match regex flagged some genuinely-extinct cults whose tradition strings happen to contain "Christian" or "Islam" or similar:

- **Pre-Islamic Arabian** (`allat`, `hubal`, `manat`, `suwa`, `wadd`, `yauq`, `yaghuth`, `nasr-pre-islamic`, `al-uzza`): cult ended ~630 with Islam — **CORRECT, do not touch**
- **Pre-Christian Aksumite** (`astar-aksumite`, `meder`, `beher`, `mahrem`, `almaqah`): cult ended ~330 with Ezana's conversion — **CORRECT**
- **Armenian pre-Christian** (`aramazd`, `anahit-armenian`, `nane-armenian`, `vahagn`, `tir-armenian`, `astghik`): cult ended 301 with Tiridates III's Christianization — **CORRECT**
- **Slavic pre-Christian** (`perun`, `veles`, `svarog`, `mokosh`, `dazhbog`, `marzanna`, `svantovit`, `jarilo`, `rod-slavic`): Pass-2 standardized — **CORRECT**
- **Cathar/Bogomil** (`the-good-god-cathar`, `satanael`): medieval Christian dualism, fully extinct — **CORRECT**
- **Second-Temple Enochic apocalyptic** (`mastema`, `gilgamesh-nephilim`, `the-elect-one-enochic`, `asbeel`, `penemue`, `kokabiel`, `gadreel`, `semyaza`, `armaros`, `baraqel`, `kasdeja`, `hermoni`, `ohyah-nephilim`, `mahaway-nephilim`, `hahyah-nephilim`): listed in Ethiopian Orthodox canon (1 Enoch, Jubilees, Book of Giants) but NOT liturgically invoked as deities — these are demonological figures preserved as scripture, not active cult — **CORRECT** at -300/100 or similar. Note: the regex flagged "Ethiopian" via `tradition-ethiopian-orthodox`; the demons themselves are extinct as cultic figures.
- **Polynesian Oro** (`oro-polynesian`): cult ended 1820 with Hawaiian-style conversion of Society Islands — **CORRECT**
- **Druze melek-hamza** (996/1021): these are al-Hakim's life-related dates; the Druze concealment-of-Hamza tradition continues. Edge case — life-dates field-confusion, similar to mahavira-jain. **Surface for John.**

---

## Recommended apply sequence

1. **Apply Tier 1** (44-file 2025→2026 rollover) — mechanical, no ratification needed. Single commit `Pass-3 T1 — annual rollover 2025→2026`.
2. **Apply Tier 2** (28-file Egyptian 400→500) — completes Pass-2 ratified rule. Single commit `Pass-3 T2 — Egyptian terminus standardization`.
3. **Surface Tier 3 (confident 17) to John for batch ratification.** Apply on `LGTM`. Single commit `Pass-3 T3 — active-tradition Rule-A application (Vedic/Zoroastrian/yahweh/satan)`.
4. **Tier 3 edge cases (10):** request per-file calls from John.
5. **Apply Tier 4 active-tradition cleanup** (Yoruba/Shinto/Mahayana/Korean/Chinese folk = 2026; Baltic = 1387/1525; Celtic = 600) after John's call on Adamastor + Kalki schema-tension.

After all three are applied, re-run `scripts/audit_dates_2026-05-30.py` (should remain `Total flagged: 0`) and load `http://localhost:8742/?view=scripture` to visually confirm the Timeline pile-up around the Vedic / Zoroastrian / YHWH date-anchor points has dispersed via the B-DATING-5 slide.

---

## POST-EXECUTION — TBD (apply as ratified)

| Commit | Tier | Description |
|---|---|---|
| TBD | T1 | 44 files 2025 → 2026 |
| TBD | T2 | 28 files Egyptian 400 → 500 |
| TBD | T3 | 17 files Vedic/Zoroastrian/yahweh/satan to ratified-Rule-A |
| TBD | T4 | Null-backlog tradition-clean-cases |
