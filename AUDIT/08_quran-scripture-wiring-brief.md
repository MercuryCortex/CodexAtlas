# Quran Corpus Wiring for the Scripture View — Agent Brief

_Queued by `lead-session-1` for execution AFTER `opus-islam-1` finishes. Do NOT launch this batch while `opus-islam-1` is still in-flight per `00_meta/ACTIVE-AGENTS.md`._

## Why this is the next batch to run

Per `opus-scripture-1`'s explicit open-gaps recommendation:

> "Quran is the highest-leverage next one because its entity overlap with Bible (Moses, Abraham, Mary, Jesus, etc.) will draw a giant cross-island MASSIVE-win trail-arc from Bible canvas into Quran canvas — exactly the kind of cross-tradition tracing edge John flagged as the prize."

User's "MASSIVE wins" framing is most visible when this lands. The Bible view currently shows 199 entity instances clustered into 27 book-islands. Adding Quran as a second corpus lights up cross-island trail-arcs for Moses (Mūsā), Abraham (Ibrāhīm), Mary (Maryam), Jesus (ʿĪsā), Joseph (Yūsuf), Solomon (Sulaymān), David (Dāwūd), Noah (Nūḥ), Pharaoh (Firʿawn), Gabriel (Jibrīl) — the entity-overlap between the two corpora is dense enough that a single hover on "Moses" should draw a clear sweep from the Pentateuch sources across the canvas into the Quran corpus.

This is potentially the single most visually compelling demo in the project.

## Dependencies — verify before starting

Run this check first and confirm all expected nodes exist:

```bash
cd "~/Desktop/Codex Atlas"

# opus-islam-1 nodes that should exist before Quran wiring is meaningful
for slug in \
  ibn-sina ibn-rushd al-farabi al-kindi ibn-tufayl ibn-ishaq \
  aisha-bint-abi-bakr khadija-bint-khuwaylid umar-ibn-al-khattab \
  muawiya-ibn-abi-sufyan ibn-taymiyya \
  al-uzza manat wadd nasr-pre-islamic ; do
  if [ -f 03_deities/${slug}.md ] || [ -f 04_persons/${slug}.md ]; then
    echo "OK $slug"
  else
    echo "MISSING $slug — wait for opus-islam-1 to finish"
  fi
done

# Documents
for path in \
  02_documents/_phase-5-medieval/phase-5-043-ibn-ishaq-sirat-rasul-allah.md \
  02_documents/_phase-5-medieval/phase-5-042-sahih-muslim.md \
  02_documents/_phase-5-medieval/phase-5-044-ibn-sina-kitab-al-shifa.md \
  02_documents/_phase-5-medieval/phase-5-045-al-ghazali-tahafut-al-falasifa.md \
  02_documents/_phase-5-medieval/phase-5-046-ibn-rushd-tahafut-al-tahafut.md \
  02_documents/_phase-5-medieval/phase-5-047-ibn-tufayl-hayy-ibn-yaqdhan.md \
  02_documents/_phase-5-medieval/phase-5-048-theology-of-aristotle-arabic.md ; do
  if [ -f "$path" ]; then echo "OK $(basename $path)"; else echo "MISSING $(basename $path)"; fi
done
```

If any are missing, `opus-islam-1` is still in flight — do not start this batch.

## Pre-flight (mandatory)

1. `00_meta/HANDOFF.md`
2. `00_meta/methodology.md` — especially the "## Symbol-research discipline" section (analogous discipline applies to any new tradition you touch)
3. `00_meta/canonical-slugs.md` — confirm every Quranic-figure slug you reference
4. `00_meta/ACTIVE-AGENTS.md` — verify `opus-islam-1` is FINISHED before starting
5. Read existing `src/js/app.js` for the `SCRIPTURE_CORPORA` constant and the `VIEWS.scripture` block + `scriptureResolveBookId()` / `scriptureBookAliases()` / `scriptureEntitiesForBook()` helpers (work added by `opus-scripture-1`)
6. Read `02_documents/_phase-4-late-antiquity/phase-4-034-quran.md` — the existing Quran document node (already in the vault; this batch does NOT recreate it)

## Scope — three threads

### Thread A: Wire the Quran corpus structure into `SCRIPTURE_CORPORA`

In `src/js/app.js`, locate the `SCRIPTURE_CORPORA` constant defined by `opus-scripture-1`. Add a `'quran'` entry with the Quran's structural organization. The Quran has multiple plausible structurings — pick **two** and offer them as a sub-toggle inside the Quran view:

**Sub-layout 1: 7-Manzil structure (traditional liturgical division)**
- Manzil 1: Surahs 1-9 (al-Fātiḥa through al-Tawba)
- Manzil 2: Surahs 10-18
- Manzil 3: Surahs 19-36
- Manzil 4: Surahs 37-48
- Manzil 5: Surahs 49-66
- Manzil 6: Surahs 67-77
- Manzil 7: Surahs 78-114

**Sub-layout 2: Meccan-Medinan + chronological compositional order (the Nöldeke schema, widely accepted in academic Quran studies)**
- Early Meccan (~610-617)
- Middle Meccan (~617-619)
- Late Meccan (~619-622)
- Medinan (~622-632)

The Meccan-Medinan + Nöldeke chronology is the academically-richer view for cross-tradition trail-arcs (it surfaces when Meccan eschatology, Late-Meccan Biblical-narrative integration, and Medinan community-formation passages get composed). The 7-Manzil view is the view a traditional Muslim reader would recognize.

Defaulting view: Meccan-Medinan-chronological. The 7-Manzil view is a toggle inside the Quran corpus.

### Thread B: Wire per-surah entity hulls

For each surah-cluster, the Scripture view's `scriptureEntitiesForBook()` helper needs to find the entities that "bind to" that book. The binding criteria (per `opus-scripture-1`'s implementation) are existing edges: `attests`, `context`, `key-figure`, `mentioned-in`, `authored`, `attributed-author`.

**You do NOT create new "Surah X" document nodes.** Instead, you make the Scripture view's entity-resolution find the Quranic-figure persons via the existing `phase-4-034-quran` document's edges. For surahs that don't have their own document nodes, the view should resolve by surah-grouping a configured list of entity slugs.

The configuration goes in `SCRIPTURE_CORPORA.quran.sections`. Each section is `{ id, label, surahs: [...], entities-via: ['phase-4-034-quran'], entities-extra: ['ibrahim', 'musa', ...] }` with `entities-via` pointing at the bound document and `entities-extra` an explicit list for the surahs where you want specific entity inclusion in this section.

**Minimum entity wiring (verify each slug exists; create stubs only for the persons opus-islam-1 didn't already create):**

Quranic figures (most should now exist as person nodes after opus-islam-1 lands; CHECK before creating):

| Quranic name | Latin slug | Bible counterpart |
|---|---|---|
| Ādam | adam | adam |
| Nūḥ | noah | noah |
| Ibrāhīm | abraham-patriarch | abraham-patriarch |
| Ismāʿīl | ishmael (new?) | ishmael |
| Isḥāq | isaac (new?) | isaac |
| Yaʿqūb | jacob-patriarch (new?) | jacob-patriarch |
| Yūsuf | joseph-patriarch (new?) | joseph-patriarch |
| Mūsā | moses | moses |
| Hārūn | aaron (new?) | aaron |
| Firʿawn | pharaoh (new?) | (matches the J/E exodus narratives) |
| Dāwūd | david-king (new? — check if exists) | david-king |
| Sulaymān | solomon-king (new? — check) | solomon-king |
| Maryam | mary-theotokos | mary-theotokos |
| ʿĪsā | jesus-christ-deity (already exists) | jesus-christ-deity |
| Yaḥyā | john-the-baptist (new? — check) | john-the-baptist |
| Zakariyyā | zechariah-priest (new? — distinct from prophet) | zechariah-priest |
| Jibrīl | gabriel-archangel | gabriel-archangel |
| Iblīs | iblis-shaytan (NEW deity slug — likely missing) | satan-christian (parallel) |
| Hūd | hud-prophet (new) | (no Bible parallel — purely Quranic) |
| Ṣāliḥ | salih-prophet (new) | (no Bible parallel) |
| Shuʿayb | shuayb-prophet (new) | (no Bible parallel — sometimes equated with Jethro) |
| Luqmān | luqman-sage (new) | (no Bible parallel — wisdom-figure) |
| Dhū al-Qarnayn | dhu-al-qarnayn (new) | (possibly Alexander; contested) |
| al-Khiḍr | al-khidr (new) | (no Bible parallel — Surah 18 mystical guide) |
| ʿUzayr | uzayr (new) | (sometimes equated with Ezra) |

For any Quranic-only figures missing from the vault (Hūd, Ṣāliḥ, Shuʿayb, Luqmān, Dhū al-Qarnayn, al-Khiḍr, ʿUzayr, Iblīs), create metadata-grade person/deity stubs. Sources: Brannon Wheeler *Prophets in the Quran* (Continuum, 2002); Reuven Firestone *Journeys in Holy Lands* (SUNY, 1990); Roberto Tottoli *Biblical Prophets in the Qur'an and Muslim Literature* (Curzon, 2002); Gabriel Said Reynolds *The Qur'an and the Bible* (Yale UP, 2018).

### Thread C: The Bible↔Quran cross-island trail-arc payoff

The point of the whole batch. After Threads A+B land, the Scripture view should render:

1. **Switch to Quran corpus** — see Quranic figures clustered by surah-section
2. **Hover on Moses / Mūsā in any surah** — trail-arc lights up across BOTH canvases simultaneously (J, E, D, P book-islands in the Bible canvas AND every surah-section where Mūsā appears in the Quran canvas)
3. **Hover on Maryam / Mary** — trail-arc connects Luke + Matthew + John (Bible) to Sūrat Maryam + Āl ʿImrān (Quran)
4. **Hover on Pharaoh / Firʿawn** — trail-arc connects J + E + D (Bible exodus) to multiple Meccan surahs (where Firʿawn is the paradigmatic enemy of God's messenger)
5. **Hover on Abraham / Ibrāhīm** — trail-arc connects J + E + Paul (Bible) to Sūrat Ibrāhīm + multiple Meccan surahs (Abraham-Ishmael-Mecca founding narrative)

The trail-arc rendering is already implemented in `opus-scripture-1`'s code (faint stroke-opacity 0.10 default, gold 1.0 on hover). The Quran wiring just plugs into it. **No new rendering logic needed.**

### Thread D: Two corpora simultaneously?

`opus-scripture-1`'s current UI is single-corpus-at-a-time via dropdown. The MASSIVE-win demo is most compelling if you can see **both canvases at once with the cross-corpus trail-arc spanning them visibly**. Two options:

- **Option D1 (single canvas, mode toggle):** Quran fully replaces Bible when selected. Cross-island trail-arcs only appear within the visible canvas. Loses the cross-corpus visualization.
- **Option D2 (split canvas):** Bible on left half, Quran on right half. Trail-arcs span the divider. Implementation cost is higher (the radial-hull layout has to be adapted to two half-canvases) but the payoff is the actual visual that John was asking for ("trail-arcs from Bible canvas into Quran canvas").

**Recommendation:** Ship Option D1 first (faster). After verifying the dropdown-switching works and the wiring is correct, add Option D2 as a "Compare" mode toggle (`Single | Compare`). The split-canvas Compare mode is a second-pass deliverable.

If user signals "ship the MASSIVE-win demo NOW," go straight to Option D2 and skip D1.

## Open questions (decide before launching)

1. **Meccan-Medinan-chronological or 7-Manzil as default?** Recommend Meccan-Medinan because it surfaces compositional order which makes the cross-tradition reception story legible. The 7-Manzil view is for traditional readers and can be a toggle inside the corpus.

2. **Tafsir nodes?** Should tafsir documents (Tabari, Ibn Kathir, Razi — Tabari already exists as `phase-5-009-tabari-tafsir`) be visible in the Quran view as a separate "Commentary" ring? Recommend YES as a separate sub-ring — surfaces the reception layer.

3. **Hadith nodes inside the Quran view?** Sahih al-Bukhari + Sahih Muslim are documents adjacent to the Quran. Recommend they get their own corpus dropdown entries ("Sahih Bukhari", "Sahih Muslim", "Sahih Sittah") so a user can switch between Quran-corpus and Hadith-corpus views. This keeps the Quran view focused.

4. **Should this batch ALSO wire the Tanakh corpus separately from "Holy Bible"?** opus-scripture-1's Bible view groups the Hebrew Bible's J/E/D/P sources + Former Prophets + DtrH alongside the NT and apocrypha — that's a Christian Bible view. A separate Tanakh view (TNK: Torah / Nevi'im / Ketuvim) would surface the Jewish canonical structure (different book order, no NT, different apocryphal canon). Recommend deferring to a separate batch — the Quran wiring alone is plenty of scope for this batch.

## Quality bar

- All Quranic-only figures (Hūd, Ṣāliḥ, Shuʿayb, Luqmān, Dhū al-Qarnayn, al-Khiḍr, ʿUzayr, Iblīs) get full metadata-grade person/deity nodes per `schema-person.md` / `schema-deity.md` (≥2 Tier-1 refs each).
- Tier-1 source for any Bible-Quran comparative claim: Reynolds *The Qur'an and the Bible* 2018 (load-bearing — explicit verse-by-verse parallels).
- Tier-1 source for Quran chronology and Meccan-Medinan: Theodor Nöldeke *Geschichte des Qorāns* (1860; revised by Schwally 1909 — the academic standard for chronological ordering); or for an English-language modern alternative, Behnam Sadeghi "The Chronology of the Qurʾān" (*Arabica* 58, 2011).
- **DO NOT use** as primary source: Sayyid Qutb's *Fī Ẓilāl al-Qurʾān*, Mawdūdī's *Tafhīm al-Qurʾān* — these are Tier 2-3 for *reception* of the Quran in modern Islamism, not for scholarly Quran studies. Cite Reynolds, Nöldeke, Sinai (*The Qurʾan: A Historical-Critical Introduction*, Edinburgh UP, 2017), Donner (*Muhammad and the Believers*, Harvard UP, 2010) as primary.

## Methodology discipline

- The Quran is BOTH a primary religious text and a participant in the late-antique Christian-Jewish-Arabian milieu. Cross-tradition claims like "the Quranic ʿĪsā ≈ the Synoptic Jesus" need careful tiering: `parallel-form` for narrative-element overlap; `polemic-against` where the Quran explicitly counters Christological claims (Quran 5:75-76 "The Messiah, son of Mary, was nothing more than a messenger"; Quran 4:171 against the Trinity).
- Pre-Islamic-Arabian → Quran continuity (Ibrāhīm at Mecca; al-Kaʿba) is `appropriated-by` where the Quran re-reads pre-Islamic narratives. `syncretic-fusion` is wrong here; the Quran is explicitly polemical against pre-Islamic polytheism while preserving the Abrahamic-monotheistic framework.
- Iblīs ≠ Satan-Christian as a direct ancestor edge. The two share Jewish-pseudepigraphic substrate (Adam's-fall + angelic-rebellion via 1 Enoch / Vita Adae) but have independent development paths. `parallel-form` with a `shared-milieu` annotation pointing at Second Temple pseudepigrapha. Reynolds 2018 chapter 1 is the load-bearing source.

## Closing checklist

1. `python3 build_data.py && python3 build_dashboard.py` clean
2. Open `index.html` → click "Scripture" in nav → corpus dropdown → "Quran"
3. Verify: ≥80 entity-instances across the Quran's surah-sections
4. Verify: hover-test on Moses / Mūsā renders trail-arcs across BOTH Bible and Quran canvases (or — if Option D1 — at least within the Quran canvas)
5. Verify: Iblīs renders distinct from Satan-Christian; al-Khiḍr renders distinct from any Christian saint
6. Report ≤300 words: (a) nodes created / nodes confirmed-pre-existing; (b) corpus structure landed (Meccan-Medinan default + 7-Manzil sub-toggle?); (c) cross-corpus trail-arc behavior — did Option D1 or D2 ship?; (d) which Bible↔Quran trail-arcs render most clearly; (e) post-batch totals.

## Coordination notes

- This batch is OUT OF SCOPE for any Bible-canonical work (don't add new Bible-book document nodes; that's an opus-scripture-2 follow-up).
- This batch is OUT OF SCOPE for non-Bible / non-Quran corpora (don't wire Vedas, Tipitaka, Avesta, etc. — those are separate batches).
- This batch IS in-scope for: the Quran corpus structure in `SCRIPTURE_CORPORA`, missing Quranic-figure person/deity stubs, the Bible↔Quran cross-corpus trail-arc rendering.
- After this batch, the obvious next Scripture-view batches are (in priority order): **Sahih Bukhari + Sahih Muslim** as hadith corpora (the falsafa-doc adjacency); **Tanakh** as a separate Jewish-canonical corpus distinct from Christian Bible; **Vedic corpus** (Rig Veda + Atharva Veda + Upanishads as a 3-section ring); **Tipitaka** (Sutta + Vinaya + Abhidhamma); **Avesta** (Yasna + Gathas + Vendidad); **Nag Hammadi** (4 codex-clusters); **Hermetica** (Corpus Hermeticum + Asclepius + Stobaean fragments).

## Post-batch follow-ups (do NOT do as part of this batch)

- **Yi Jing as a document node** — last remaining Chinese-canon gap. Single-document agent. Defer until after this batch.
- Audit Priority #7 (Karbala 680) was queued; check if opus-islam-1 created it (their event list includes death-of-Muhammad-632 + first-fitna-656-661 but NOT Karbala 680 explicitly — confirm and stub if missing).
- The Heracles → bull symbol edge-sweep (`opus-hellenic-2` will land Heracles; once Heracles exists, edge-sweep `09_symbols/bull.md` to add Heracles as a `deity-instances` entry per bull-cult parallel-form).
