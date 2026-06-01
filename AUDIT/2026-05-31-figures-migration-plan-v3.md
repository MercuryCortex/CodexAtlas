# FIGURES MIGRATION — PLAN v3 (2026-05-31, TRIO-VALIDATED)

**Supersedes:** v1 (relaxed-standards draft) + v2 (trio-FAIL).

**Trio audit summary (all three FAIL on v2):**
- Auditor A (academic religious-studies): wrong primary anchor (Bowker is a dictionary, not a classification spine); missing whole comparative-religion categories (rishi, shaman, oracle, mahasiddha, acharya-hindu, etc.); contested calls smuggle insider doctrinal claims (Joseph Smith / Bahá'u'lláh as `prophet-abrahamic`); decision tree non-deterministic on 3 of 5 walkthroughs.
- Auditor B (insider-tradition): zero vocabulary for Yoruba / Vodou / Indigenous / most Hindu / Zen / Theravāda-monastic / Chinese-Daoist / Shinto / Zoroastrian / modern-Pagan-clergy. Would erase entire religious worlds from the Figures lens. Violates the architectural north-star (cross-tradition MASSIVE-WINS).
- Auditor C (engineering / loop-prevention): persistence in deprecated `methodology.md` (per `AGENTS.md:37`); existing `tradition-vocabulary.yaml` consumer never wired (same dormancy bug ready to replay); field-name collision (`role:` free-text vs `role:` controlled); decision tree fails on convert-disposition and no-source figures; Stage 8 deletion premature.

**John's ratification on the framework (2026-05-31, exact words):**
> *"academic and integrity, and conservative, WHEN not conservative we got the T3 and T4, and alternative correct?"* → ratified.
> *"yes with your recco. NEVER let me pick if im overlooking"* → ratified the recommendation + standing instruction to execute non-menu-pickably when a clearly-better path exists.

v3 absorbs all three audit's Tier-A corrections + John's framework.

---

## §0 — The framework (the rule everything below conforms to)

**DEFAULT POSTURE: Tier-1 academic source, conservative scholarly consensus.** Mainstream peer-reviewed treatment. Most figures get this.

**T3 / T4 source-tier marks alternative content AS alternative.** The vault already encodes `source-tier:` per node (per `feedback_deviant_bridges_2026-05-16.md`). v3 uses it:

- **T1** = mainstream peer-reviewed academic (Heschel on prophets, Brown on patriarchs, Witzel on Vedic, Schimmel on Sufism, Klostermaier on Hinduism, etc.).
- **T2** = solid secondary scholarship (textbook syntheses, tradition-internal academic-grade works).
- **T3** = popular-scholarly works with mixed reception (e.g., Yates's *Bruno*; older Eliade with critical caveats).
- **T4** = explicitly fringe / alternative / pseudoscholarship. Documented AS alternative, NOT smuggled as truth. Hancock, Cayce, Donnelly hyperdiffusionism.

**Opponent categories never as primary `role-tokens:`.** Heresiarch / antichrist / false-prophet / etc. go into a separate `polemical-framing:` field with the framer + source.

**Reclaimed-self-naming gets its own field.** "Witch" (Christian polemic AND Wiccan affirmation), "pagan" (same dual life) etc. captured via `reclaimed-self-naming:` field, not forced into `role-tokens:` OR `polemical-framing:` alone.

**Cross-tradition coverage is non-negotiable.** Every major tradition gets vocabulary, not just Abrahamic-Indic. Failure to provide a Yoruba `babalawo` token means the Figures lens erases Yoruba religious leadership — violating the architectural north-star.

**Contested cases never silently inferred.** Every contested case is a named ratification with a proposed call, rationale, and source.

This is the rule. Everything below conforms to it.

---

## §1 — Canonical reference framework

**Primary spine for taxonomy (per Auditor A's correction):**

| Reference | Role |
|---|---|
| **Jones (ed.) 2005 *Encyclopedia of Religion* 2nd ed. (Macmillan, 15 vols)** | The religious-studies discipline's reference of record. Category articles ("Priesthood," "Prophecy," "Sainthood," "Charisma and Charismatic Authority," "Monasticism," "Mysticism," "Founders of Religions") provide the comparative-religion classification spine. PRIMARY. |
| **Smart 1996 *Dimensions of the Sacred*** | Comparative-religion actor-typology (charismatic founder / institutional priest / mystic / prophet / sage / saint / reformer). Co-primary for actor-typology specifically. |
| **Weber 1922/1978 *Economy and Society* Vol. 2 chs. VI + XIV** | Sociology of religion's foundational typology (prophet / priest / magician / sage). Still cited in Bourdieu, Bell, Riesebrodt, Asad. Co-primary. |
| **Asad 1993 *Genealogies of Religion*** | Methodological caveat — all such typologies are Christian-derived universals that imperfectly map onto Islamic / Hindu / Buddhist / Indigenous emic categories. Cited at the top of `methodology.md §Role taxonomy` as the explicit methodological-humility marker. |
| **Riesebrodt 2010 *The Promise of Salvation*** | Current comparative-religion theory. Secondary. |
| Per-tradition specialists | Tertiary (e.g., Heschel 1962 on prophets, Crone 2004 on caliphs, Witzel 1997 on Vedic, Dundas 2002 on Jain, McLeod 1989 on Sikh, Williams 1989 on Mahāyāna, Klostermaier 2007 on Hindu, Schimmel 1975 on Sufism, Daftary 2007 on Ismaili, Brown 1981 on Christian saints, Sedgwick 2004 on Traditionalism, Hammer 2001 + Bogdan-Starr 2012 on NRMs, Sedgwick 2004 + Hanegraaff 2012 on Western esotericism, Davidson 2002 on Indian-Buddhist tantra, Cuevas 2003 on Tibetan, Daftary 2007 on Ismaili) |
| **Bowker 1997 *Oxford Dictionary of World Religions*** | DEMOTED to tertiary look-up. Useful for entry-level cross-checks; not the spine. |

The methodological-humility marker (Asad 1993) is load-bearing: it acknowledges that the role-vocabulary is an etic comparative-religion construction, and tradition-internal emic self-classification may diverge. The `role-tokens:` field is the etic spine; the prose `role-description:` field preserves tradition-internal nuance.

---

## §2 — Schema design

The schema has **four fields**, each with a distinct purpose:

```yaml
# Example: 04_persons/sankara.md
role-tokens: ["acharya-hindu", "philosopher-religious"]   # controlled vocabulary; lens-filterable
role-description: "Adi Sankara — Advaita Vedanta acharya, founder of Smarta sampradaya reform"   # human-readable prose
polemical-framing:                                          # opponent-categorized framings (when applicable)
  - by: "Vaishnava critique (Madhva, Ramanuja)"
    label: "crypto-Buddhist"
    source-tier: T1
    source: "Bartley 2002 The Theology of Ramanuja"
    direction: outsider
reclaimed-self-naming:                                      # terms with dual polemic/affirmative life (when applicable)
  - tradition: "Western occult / Modern Pagan"
    label: "witch"
    source-tier: T1
    source: "Hutton 1999 The Triumph of the Moon"
```

| Field | Purpose | Validator behavior |
|---|---|---|
| `role-tokens:` | Controlled vocabulary, MUST be an array, every entry must resolve to a canonical id in `role-vocabulary.yaml`. Drives `mode.js filterNodesByMode('figures')`. | ERROR on unknown id; ERROR on non-array scalar; ERROR on duplicate within array |
| `role-description:` | Free-text prose (human-readable; preserves tradition-internal nuance and pre-controlled-vocab content). Renamed from the existing free-text `role:` field as part of this migration. | No validation (free text); WARN if missing |
| `polemical-framing:` | Opponent-claimed categories (heresiarch, antichrist, false-prophet, dhimmi, kafir, mleccha, etc.). Each entry has `by:`, `label:`, `source-tier:`, `source:`, `direction:` ("outsider" / "self-claimed-orthodox" / "reciprocal"). | Source-tier must be T1-T4; label must be in `polemical-framing-vocabulary.yaml`; required fields enforced |
| `reclaimed-self-naming:` | Terms that exist as both polemic-from-outside AND affirmative-self-claim. Examples: "witch" (Christian polemic + Wiccan self-claim), "pagan" (Christian polemic + Heathen/Wiccan self-claim), "queer" (religious-studies of LGBT theology). | Source-tier must be T1-T4; tradition required |

**Array ordering rule** (per Auditor B's correction): `role-tokens:` is an ORDERED array. Index 0 = primary insider-frame. Downstream UI (`mode.js`, side-panel renderer) reads index 0 as the displayed-primary role; subsequent entries as secondary chips.

Tie-break for inferred order: decision-tree-step ascending; then alphabetic canonical id.

**Field rename** (per Auditor C): the existing `role:` (free-text prose) field is renamed to `role-description:` during the migration. The new controlled-vocab field is `role-tokens:`. No name collision. The migration script touches every existing person file to perform this rename + add the controlled-vocab tokens.

---

## §3 — Vocabulary (the controlled-vocab spine)

Located at `00_meta/role-vocabulary.yaml`. Mirrors `00_meta/tradition-vocabulary.yaml` schema exactly (re-using the canonical primitive per cardinal rule #7).

### Tier 1 — Founders + revelation-bearers + tradition-defining figures (figure-qualifying)

| id | Tradition-scope | Anchor source |
|---|---|---|
| `founder` | Generic — founded a religion or new branch | Jones 2005 'Founders of Religions' entry |
| `prophet-abrahamic` | Hebrew / Christian / Islamic prophetic-revelation figure (Moses, Isaiah, Muhammad-as-prophet) | Heschel 1962; Crone 2004 |
| `prophet-indigenous` | Indigenous-tradition revelation-bearer (Wovoka, Smohalla, Handsome Lake, Tenskwatawa, Black Hawk). **NOT Abrahamic.** Ghost Dance, Longhouse Religion, Indian Shaker Church derivatives. | Hittman 1990 *Wovoka*; Wallace 1969 *The Death and Rebirth of the Seneca* |
| `prophet-non-abrahamic` | Modern revelation-bearer outside both Abrahamic and Indigenous categories (Crowley as Liber-AL-prophet; Mary Baker Eddy) | Bogdan & Starr 2012; Gottschalk 1973 |
| `messenger-islamic` | Islamic *rasūl* category (Muhammad as messenger-with-scripture, distinct from prophet) | Crone 2004 |
| `avatar-hindu` | Vaishnava incarnation (only when historicized — Krishna debated; Kalki eschatological flagged as such). **Caveat:** the mythic avatars (Vishnu's full ten) are deities not persons; this token applies only when a historical figure is venerated as avatar-claimed (rare; controversial across Vaishnava sampradayas). | Klostermaier 2007 |
| `manifestation-bahai` | Bahá'í *maẓhar-i ilāhī*. Progressive-revelation category that INCLUDES but EXCEEDS Abrahamic prophet. Bahá'u'lláh, the Báb, also includes Krishna/Buddha/Zoroaster/Moses/Jesus/Muhammad as Manifestations. | Smith 2008 *An Introduction to the Baha'i Faith*; Cole 1998 *Modernity and the Millennium* |
| `tirthankara-jain` | The 24 Jain ford-makers (Rishabha through Mahavira). | Dundas 2002 |
| `mahasiddha` | Buddhist tantric perfected-being (the 84 Mahasiddhas; Nath siddhas). Distinct from bodhisattva or guru. | Davidson 2002 *Indian Esoteric Buddhism*; White 1996 *The Alchemical Body* |
| `acharya-hindu` | Sampradaya-founding doctrinal teacher (Sankara, Ramanuja, Madhva, Nimbarka, Vallabha, Chaitanya). Hindu insider category. NOT `theologian`. | Lipner 2010 *Hindus*; Mlecko 1982 |
| `acharya-jain` | Jain doctrinal-teacher lineage (Kundakunda, Umasvati, Hemachandra). Distinct from `acharya-hindu`. | Dundas 2002 |
| `acharya-buddhist` | Mahāyāna scholastic-doctrinal teacher (Asanga, Vasubandhu, Nagarjuna, Atiśa, Tsongkhapa, Shantideva). Distinct from `mahasiddha` and `bodhisattva-mahayana`. | Williams 1989 |
| `bodhisattva-mahayana` | Historical Mahāyāna teacher venerated as bodhisattva (boundary case). Padmasambhava listed here per Williams 1989 but contested per Davidson 2002. | Williams 1989; Davidson 2002 |
| `tertön-tibetan` | Tibetan treasure-revealer / terma discoverer | Cuevas 2003 *The Hidden History of the Tibetan Book of the Dead* |
| `lineage-master-tibetan` | Generic Tibetan Vajrayāna lineage-holder when no specific category applies | Samuel 1993 *Civilized Shamans* |
| `guru-sikh` | The 10 Sikh Gurus only (Nanak through Gobind Singh). Lineage ended with Guru Granth Sahib as the 11th and eternal Guru. | McLeod 1989 *Who Is a Sikh?* |
| `guru-hindu` | Modern-Hindu-guru lineages (Ramakrishna, Vivekananda, Aurobindo, Ramana Maharshi, Yogananda, Sai Baba lineages, Anandamayi Ma, Nityananda, Muktananda, Mata Amritanandamayi). | Copeman & Ikegame 2012 *The Guru in South Asia*; Mlecko 1982 |
| `rishi-vedic` | Vedic mantra-drashtara (Vasishtha, Vishvamitra, Atri, Saptarishi). Distinct from `prophet-abrahamic` AND `acharya-hindu`. | Witzel 1997 *Inside the Texts, Beyond the Texts*; Jamison & Brereton 2014 *The Rigveda* |
| `oracle` | Mantic site-specific oracular figure (Pythia of Delphi, Sibyls, African Ifá babalawos when functioning oracularly). Distinct from prophet (prophet = revelation; oracle = consultation). | Parke & Wormell 1956 *The Delphic Oracle*; Burkert 1985 *Greek Religion* §III.8 |
| `diviner` | Reads-signs religious specialist (Yijing diviners, Mesoamerican daykeepers). Distinct from oracle (oracle speaks for a god; diviner interprets signs). | Tedlock 1992 *Time and the Highland Maya* |

### Tier 2 — Religious authority, multi-tradition disambiguated (figure-qualifying)

#### Christian
| id | Source |
|---|---|
| `pope-roman-catholic` | Duffy 2014 *Saints and Sinners* |
| `pope-coptic` | Watson 2000 *Coptic Egypt* (Pope of Alexandria, Tawadros II = 118th) |
| `patriarch-hebrew` | Sarna 1989 *JPS Torah Commentary: Genesis* (Abraham, Isaac, Jacob) |
| `patriarch-jewish-late-antique` | Goodman 1983 *State and Society in Roman Galilee* (Hillel through Gamaliel VI Patriarchate of Palestine) |
| `patriarch-christian-orthodox` | Brown 1981 (Eastern Orthodox sees: Constantinople, Antioch, Alexandria-Greek, Jerusalem) |
| `patriarch-oriental-orthodox` | Pummer 2016 *The Samaritans*; for Armenian + Syriac patriarchates |
| `catholicos` | Armenian Apostolic + Assyrian Church of the East (autocephalous non-Chalcedonian) |
| `bishop-christian` | Brown 1981 (diocesan + theological authority) |
| `archbishop-christian` | (provincial Christian see) |
| `archbishop-anglican` | Hardy 1992 *Anglicanism* (Canterbury, York; senior Communion role) |
| `pastor-protestant` | Niebuhr 1956 *The Purpose of the Church and Its Ministry* (Protestant ordained ministry — Bonhoeffer, Niebuhr, Tillich-as-pastor, Schleiermacher) |
| `minister-protestant` | (alias of `pastor-protestant` for traditions using "minister") |
| `evangelist-gospel-attributed` | Mark, Matthew, Luke, John specifically |
| `evangelist-revivalist` | Wesley, Whitefield, Billy Graham — Protestant revivalist preachers (DIFFERENT category) |
| `doctor-of-the-church` | Specific Catholic ecclesiastical honor (Aquinas, Augustine, Teresa of Ávila, Thérèse, Hildegard, etc.) | Catholic Encyclopedia 1908; sits ALONGSIDE `theologian`, weighted higher in insider framing |

#### Islamic
| id | Source |
|---|---|
| `caliph-sunni` | Crone 2004 *God's Rule*. NOTE: Shia rejects caliphal-legitimacy; framing acknowledged |
| `imam-twelver` | Momen 1985 *An Introduction to Shīʿī Islam* (the Twelve specifically) |
| `imam-ismaili-nizari` | Daftary 2007 *The Ismāʿīlīs* (Aga Khan lineage) |
| `imam-ismaili-mustali` | Daftary 2007 (Bohra lineage) |
| `imam-zaydi` | (Yemen Zaydi imamate, ruled until 1962) |
| `imam-prayer-leader` | General Islamic prayer-leadership (broader, not figure-qualifying alone) |
| `ayatollah-twelver` | Momen 1985 (modern Twelver mujtahid: Khomeini, Sistani) |
| `mujtahid` | Independent Islamic jurist (Shi'a and Sunni) |
| `sufi-shaykh` | Schimmel 1975 *Mystical Dimensions of Islam* |
| `sufi-pir` | Persianate-Sufi master |
| `uqqal-druze` | Druze religious authority (*ʿuqqāl* / shaykh al-ʿaql); Druze is NOT Islam-internal in insider self-understanding |
| `dede-alevi` | Alevi religious authority. Alevism explicitly rejects classification as Sufism. |

#### Jewish
| id | Source |
|---|---|
| `rabbi-tannaitic` | Neusner 1973 *Rabbinic Judaism* (1st-2nd c. CE Mishnaic sages: Hillel, Shammai, Akiva) |
| `rabbi-amoraic` | Neusner 1973 (3rd-5th c. CE Talmudic sages) |
| `rabbi-medieval` | (Geonic + Rishonim: Saadia, Rashi, Maimonides) |
| `rabbi-modern` | (Modern Orthodox + Conservative + Reform) |
| `zaddik-hasidic` | Idel 1995 *Hasidism: Between Ecstasy and Magic* (Baal Shem Tov, Maggid of Mezeritch) |
| `rebbe-hasidic` | (alias / institutional Hasidic dynastic-head: Lubavitcher, Bobover, Satmar, etc.) |
| `high-priest-israelite` | Goodenough 1953-1968 *Jewish Symbols* (Aaronic line) |
| `gaon` | (Geonic-period yeshiva head, 6th-11th c.) |
| `kabbalist` | Scholem 1941 *Major Trends in Jewish Mysticism* (Cordovero, Luria, etc.) |

#### Buddhist
| id | Source |
|---|---|
| `dalai-lama` | Powers 2007 *Introduction to Tibetan Buddhism* (Gelug incarnation lineage) |
| `panchen-lama` | Powers 2007 (second-highest Gelug; PRC-Beijing-disputed) |
| `karmapa` | Powers 2007 (Karma Kagyu head; 17th-Karmapa lineage disputed) |
| `sakya-trizin` | (Sakya school head) |
| `mindrolling-trichen` | (Nyingma lineage head) |
| `rinpoche` | Generic incarnation-lineage honorific |
| `tulku` | Tibetan recognized-incarnation (general category) |
| `roshi` | Zen master (Japanese form) |
| `zen-master` | Generic Zen / Chan master |
| `chan-patriarch` | The Chinese Chan patriarchal lineage (Bodhidharma + 6th) |
| `sangharaja` | Theravada monastic supreme leader (Thai, Cambodian, Lao) |
| `mahanayaka` | Sri Lankan Theravada monastic authority |
| `bhikkhu-theravada` | Theravada monk (when individually significant — e.g., Buddhaghosa) |
| `bhikshu-mahayana` | Mahayana monk |
| `bhikkhuni-theravada` | Theravada nun |
| `bhikshuni-mahayana` | Mahayana nun |
| `arhat-buddhist` | Theravada enlightened-disciple category (when historical) |
| `lama` | Tibetan religious teacher (generic) |
| `je-khenpo` | Bhutanese Drukpa head |

#### Hindu
| id | Source |
|---|---|
| `alvar` | The 12 Tamil Vaishnava saint-poets (Nammalvar etc.) |
| `nayanar` | The 63 Tamil Shaiva saint-poets |
| `bhakti-saint` | Pan-sampradaya devotional-poet (Mirabai, Tukaram, Surdas, Tulsidas) |
| `sant` | Sant Mat / Nirguna devotional teacher (Kabir, Ravidas, Dadu) |
| `swami` | Sannyasin-rank monastic title |
| `paramahamsa` | Specific Hindu monastic honorific |
| `tantric-acharya` | Abhinavagupta, Trika Shaiva masters |
| `siddha-hindu` | Tamil/Nath siddha tradition |
| `mahatma` | Specific honorific (Gandhi-Mahatma) — narrow usage |

#### Pre-Islamic / Iranian / Zoroastrian
| id | Source |
|---|---|
| `magus-zoroastrian` | Boyce 1979 *Zoroastrians* (Zoroastrian priest; distinct from `magician` polemic) |
| `mobed` | Boyce 1979 (Zoroastrian priestly title) |
| `dastur` | Boyce 1979 (senior mobed) |

#### Chinese / Daoist / Confucian
| id | Source |
|---|---|
| `daoshi` | Daoist priest |
| `zhenren` | Daoist "perfected person" |
| `tianshi` | Celestial Master (Zhang Daoling lineage) |
| `ru-scholar` | Confucian ritual-scholar (Csikszentmihalyi 2004 *Material Virtue*) |
| `junzi-classical` | Classical Confucian "exemplary person" |

#### Shinto
| id | Source |
|---|---|
| `kannushi` | Shinto priest (Picken 1994 *Essentials of Shinto*) |
| `miko` | Shinto shrine maiden / shamaness |

#### Yoruba / Diasporic African
| id | Source |
|---|---|
| `babalawo` | Ifá priest male (Yoruba + diasporic). Bascom 1969 *Ifa Divination* |
| `iyalawo` / `iyanifa` | Female Ifá priest |
| `oluwo` | Senior babalawo |
| `oba-yoruba` | Sacred kingship (Ooni of Ife, Alaafin of Oyo) — religious office not merely political |
| `houngan` | Male Vodou priest (Haitian). Métraux 1959 *Voodoo in Haiti* |
| `mambo` | Female Vodou priest |
| `bokor` | Vodou sorcerer (contested-tradition; T3 source-tier flagged) |
| `babalorixa` | Candomblé male priest |
| `iyalorixa` | Candomblé female priest |
| `santero` / `santera` | Lukumí/Santería priest |
| `nganga` | Kongo / Palo religious specialist |
| `bobo-ashanti-priest` | Rastafari Bobo Ashanti |
| `nyahbinghi-elder` | Rastafari Nyahbinghi elder |

#### Indigenous
| id | Source |
|---|---|
| `wichasha-wakan` | Lakota holy person (Black Elk). Powers 1977 *Oglala Religion* |
| `medicine-person` | Pan-Native-American (acknowledged contact-tradition English term; tradition-specific tokens preferred where available) |
| `tohunga` | Maori expert/priest (lineage-specific) |
| `kahuna` | Hawaiian priest/expert |
| `angakkuq` | Inuit shamanistic specialist (insider language; "shaman" is Evenki and not Inuit-native) |
| `noaidi` | Sámi shaman |
| `songline-keeper` | Australian Aboriginal religious-knowledge custodian |
| `lawman-aboriginal` | Aboriginal religious-law custodian |
| `clan-mother` | Haudenosaunee |
| `faithkeeper` | Haudenosaunee |
| `mudang` | Korean shamaness/shaman (insider Korean term) |
| `shaman-siberian` | Siberian (Evenki/Buryat/Yakut) shamanistic specialist |
| `shaman-mongolian` | Mongolian shamanistic specialist |

#### Modern Pagan / Wicca / Heathen
| id | Source |
|---|---|
| `priest-wiccan` | Wiccan high priest. Hutton 1999 *The Triumph of the Moon* |
| `priestess-wiccan` | Wiccan high priestess |
| `druid-modern` | OBOD / ADF Druid (distinct from `druid-iron-age` legendary) |
| `gothi` / `gythia` | Modern Heathen / Ásatrú clergy |
| `priest-thelema` | Thelemic O.T.O. / Ecclesia Gnostica Catholica clergy |

### Tier 2b — Theological / philosophical / juristic authority (figure-qualifying)

| id | Notes |
|---|---|
| `theologian` | Doctrinal-systematic religious thinker (general category) |
| `philosopher-religious` | Religiously-philosophical (Plotinus, Maimonides — also rabbi-medieval) |
| `jurist-islamic` | Fiqh authority (al-Shafi'i, Abu Hanifa, Malik, Ibn Hanbal) |
| `jurist-jewish` | Halakhic authority (Maimonides, Caro) |
| `mufti` | Islamic legal-opinion issuer |
| `qadi` | Islamic judge |
| `sage-chinese-ru` | Confucian junzi tradition (Confucius, Mencius). NOT pan-tradition "sage" |
| `presocratic-philosopher` | Heraclitus, Pythagoras, Empedocles. Kingsley 1995 *Ancient Philosophy, Mystery, and Magic* |

### Tier 3 — Exemplars (figure-qualifying), multi-tradition disambiguated

| id | Source |
|---|---|
| `apostle-christian` | The 12 + Paul + Barnabas + Mary Magdalene (Eastern recognition — contested) + Junia |
| `disciple-christian` | The 70/72 + named non-12 followers |
| `monastic-christian-western` | Anthony of Egypt, Benedict, Hildegard, Therese of Lisieux. Wittberg 1994 *The Rise and Fall of Catholic Religious Orders* |
| `monastic-christian-eastern` | Sergius of Radonezh, Seraphim of Sarov, Athonite monastics |
| `nun-christian` | Female monastic |
| `saint-roman-catholic` | Catholic canonization (formal, post-1234 papal procedure). Wetzstein 2004 |
| `saint-eastern-orthodox` | Eastern Orthodox glorification |
| `saint-oriental-orthodox` | Coptic, Ethiopian, Syriac, Armenian recognition |
| `saint-anglican` | Anglican commemoration |
| `wali-sufi` | Muslim "friend of God" (Sufi tradition); Schimmel 1975 |
| `sant-bhakti` | Hindu Bhakti-tradition holy person (Kabir, Tukaram, Mirabai when sant-framed) |
| `kevali` | Jain enlightened being |
| `martyr-christian` | Bowersock 1995 *Martyrdom and Rome* |
| `martyr-shia` | Imam Husayn paradigm. Ayoub 1978 *Redemptive Suffering in Islām* |
| `martyr-sunni` | Sunni *shahid* |
| `martyr-sikh-shahid` | Tegh Bahadur, Arjan, Banda Singh Bahadur |
| `martyr-bahai` | The Báb |
| `sahabi` | Companion of Muhammad |
| `tabiun` | Successors to the Sahaba |

### Tier 4 — Political-religious dual (figure-qualifying when religious dimension is documented)

| id | Notes |
|---|---|
| `emperor` | Constantine, Justinian, Charlemagne, Asoka, Akbar (combine with other roles per multi-role) |
| `king` | David, Solomon, Henry VIII (combine with religious-reformer when applicable) |
| `queen` | Helena, Theodora, Elizabeth I |
| `pharaoh` | Akhenaten, Ahmose I |
| `religious-reformer` | Luther, Calvin, Wycliffe, Akhenaten, Akbar, Henry VIII (INTERNAL doctrinal reform; distinct from `religious-patron`) |
| `religious-patron` | Asoka, Kanishka, Harsha, Constantine-as-patron (SUPPORTED a tradition without changing doctrine). Thapar 1997 *Asoka and the Decline of the Mauryas*; Strong 1983 *The Legend of King Aśoka* |
| `state-founder-religious` | When state-founding has religious dimension (Khomeini's Islamic Republic, early Mormon community organization). NOT figure-qualifying alone (David Ben-Gurion is `state-founder-secular`, NOT figure) |
| `state-founder-secular` | Ben-Gurion, Atatürk — explicit non-qualifying when standing alone |

### Tier 5 — NON-qualifying (kept for other lenses; explicitly OUT of Figures)

| id | Why out |
|---|---|
| `scholar-academic-religion` | Modern academic about religion, not within religious leadership (Frazer, Durkheim, Eliade, Jonas, Pagels, Yates, Smith-w-c, Bowker himself, Ehrman, Hick-as-philosopher, Bellah) |
| `scholar-alternative` | T3/T4-tier source-marked "alternative scholarship" (Hancock, Donnelly, Cayce as theorist). Note: source-tier marking is the gate; this role token captures the classification. |
| `author-secular` | Writer not in religious leadership (most `04_persons/` entries who only authored documents) |
| `psychologist-of-religion` | William James, Jung (boundary cases handled in contested-cases below) |
| `witness` | Named in scripture/chronicle but no leadership role |
| `legendary-isolated` | Mythic person not tied to continuous tradition (Romulus, etc.) |
| `legendary-disputed` | Historicity contested (e.g., Lao Tzu); the figure exists in tradition but academic consensus is unsettled |
| `historical-cited` | Ordinary historical figure named but no religious role |

### Polemical-framing vocabulary (separate file: `00_meta/polemical-framing-vocabulary.yaml`)

| label | direction | example |
|---|---|---|
| `heresiarch` | outsider | Christian-orthodox label for Marcion, Valentinus, Arius, Mani, Cathars |
| `antichrist` | outsider | Christian apocalyptic label |
| `false-prophet` | outsider | cross-tradition (used by traditions about other traditions' prophets) |
| `schismatic` | reciprocal | Catholic ↔ Orthodox; Sunni ↔ Shia |
| `infidel` | outsider | Christian ↔ Muslim mutual |
| `kafir` | outsider | Islamic polemic |
| `mushrik` | outsider | Islamic polytheist-accusation |
| `idolater` | outsider | Protestant about Catholic; Muslim about polytheist |
| `apostate` | outsider | multi-tradition about defectors |
| `dhimmi` | outsider | Islamic legal category for non-Muslims (polemical when applied to a figure as primary identity) |
| `mleccha` | outsider | Hindu/Buddhist barbarian-outsider |
| `crypto-jew` / `crypto-muslim` / `crypto-christian` | outsider | early-modern Iberian polemic |
| `demoniac` / `possessed` | outsider | historic Christian polemic |
| `cult-leader` | outsider | modern anti-cult-movement polemic (Singer, AFF, mainline-religion polemic) |
| `magician` | outsider | when polemical; `magus-zoroastrian` is separate insider category |
| `witch` | outsider | Christian polemic — see also `reclaimed-self-naming:` for Wiccan affirmation |
| `pagan` | outsider | Christian polemic — see also `reclaimed-self-naming:` for Heathen/Wiccan/Pagan affirmation |
| `bon-po` | outsider | when applied by Buddhists about pre-Buddhist Tibetan religion polemically |

### Reclaimed-self-naming vocabulary (separate file)

| label | reclaiming-tradition | source |
|---|---|---|
| `witch` | Wicca / Modern Pagan | Hutton 1999 *The Triumph of the Moon* |
| `pagan` | Heathen / Wiccan / Modern Pagan | Hutton 1999; Magliocco 2004 *Witching Culture* |
| `queer` | Queer Theology / LGBT religious-studies | Cheng 2011 *Radical Love: An Introduction to Queer Theology* |
| `heretic` | Cathar / Free-Spirit / occasional self-claim | Brakke 2010 *The Gnostics* (context-aware) |

---

## §4 — Contested cases (expanded; all named for explicit ratification)

Per the no-silent-guessing rule. Each entry has my proposed call + rationale. Counter-propose any.

### Modern religious-studies academics

| Person | Proposal | Rationale |
|---|---|---|
| Frazer | `scholar-academic-religion` (NOT figure) | Anthropologist; no religious leadership |
| Durkheim | `scholar-academic-religion` (NOT figure) | Sociologist of religion |
| Otto | `["scholar-academic-religion", "theologian"]` (figure-qualifying via theologian) | Lutheran-ordained theologian-philosopher |
| James (William) | `psychologist-of-religion` (NOT figure) | Pragmatist philosopher, never religious leader. Hanegraaff 1996 acknowledges Jamesian-influence on Western esotericism but James himself is not figure. |
| **Jung** | `psychologist-of-religion` (NOT figure) + add `polemical-framing: by: Noll 1994, label: cult-founder, source-tier: T2` | Noll 1994 *The Jung Cult* + Hanegraaff 1996 *New Age Religion* acknowledge cult-formation around Jung; Auditor A flagged this contestation. Polemical-framing captures it without elevating to figure. |
| Eliade | `scholar-academic-religion` (NOT figure) + `polemical-framing: by: Wasserstrom 1999, label: religious-advocate-Romanian-Orthodox, source-tier: T1` | Wasserstrom 1999 *Religion after Religion* documents Eliade's religious-Orthodox-nationalist commitments alongside the academic work |
| Jonas | `scholar-academic-religion` (NOT figure) | Existentialist philosopher of Gnosticism |
| Pagels | `scholar-academic-religion` (NOT figure) | NT studies professor |
| Scholem | `scholar-academic-religion` (NOT figure) — DEMOTED from v2 | Auditor A's principle: if engaged-Jewish-thinker promotes Scholem, by consistency Jonas, Bellah, Ehrman get promoted too. Choose Tier-5-only. The figure question for Scholem is about whether his work itself became a tradition (Kabbalah-academic-studies as a sub-tradition?), which is interesting but doesn't reach figure-qualifying. |
| Yates | `scholar-academic-religion` (NOT figure) | Warburg historian |
| Ehrman | `scholar-academic-religion` (NOT figure) | Historical-critical NT scholar; brief ordination doesn't activate `theologian` because he's not currently exercising ministry or producing systematic theology |
| Bellah | `scholar-academic-religion` (NOT figure) | Sociologist of religion |
| Hick | `["scholar-academic-religion", "theologian"]` (figure-qualifying via theologian) | Ordained Presbyterian + philosophical theologian |
| Smith (Huston) | `scholar-academic-religion` (NOT figure) | Comparative-religion textbook author; Quaker but not in religious leadership |
| Bowker (J.) | `scholar-academic-religion` (NOT figure) | Even though his dictionary is our tertiary anchor — Bowker himself is academic-only |

### Esoteric founders (NRM-studies recognizes)

| Person | Proposal | Rationale |
|---|---|---|
| Aleister Crowley | `["founder", "prophet-non-abrahamic", "magus"]` | NRM-studies (Bogdan & Starr 2012) + Crowley's own Liber-AL prophet-self-claim. `magus` is Tier-2b token capturing his magical-order role. Source-tier T1 (NRM-studies academic) but flag `polemical-framing: by: mainline-Christianity, label: occultist, source-tier: T2` to capture the older-academy view as polemical. |
| LaVey | `founder` (Church of Satan 1966) | NRM-studies recognizes; Lewis 2001 *Satanism Today* |
| Blavatsky | `founder` (Theosophy) | Hammer 2001 *Claiming Knowledge* |
| Gurdjieff | `["founder", "mystic-syncretic"]` | NRM-studies + Western-esotericism scholarship |
| Steiner | `founder` (Anthroposophy) | Hammer 2001 |
| Schuon | `["philosopher-religious", "sufi-shaykh"]` — PRIMARY flipped per Auditor A | Sedgwick 2004 *Against the Modern World* skeptical of Maryamiyya silsila legitimacy; Traditionalist-philosophy is primary, Sufi-shaykh secondary |
| Guénon | `["philosopher-religious", "sufi-shaykh"]` | Traditionalism primary; later Sufi-Islam-conversion + shaykh-rank secondary |
| Cayce | `founder` (A.R.E.) + `source-tier: T4` at the node level (per deviant-bridges) | NRM continues; explicit alternative-tier marking |
| Hancock | `scholar-alternative` (NOT figure) + `source-tier: T4` | Per deviant-bridges memory: documented AS alternative, not as scholar-academic-religion |
| Gerald Gardner | `["founder", "priest-wiccan"]` | Wicca founder 1954. Hutton 1999 |
| Doreen Valiente | `["priestess-wiccan", "liturgist-modern-pagan"]` | "Mother of modern Wicca" |
| Anton Mesmer | `psychologist-of-religion` (NOT figure) | Animal-magnetism is pre-religious-studies; Mesmer himself not religious leader |

### Political-religious dual (multi-role)

| Person | Proposal |
|---|---|
| **Akhenaten** | `["pharaoh", "religious-reformer", "founder"]` per Auditor A — Atenism IS a new tradition (failed/suppressed but founded). Assmann 1997/2014 |
| **Asoka** | `["emperor", "religious-patron"]` — NOT `religious-reformer` (Thapar 1997) |
| Constantine | `["emperor", "religious-patron"]` — patron of Christianization, not internal doctrinal reformer |
| Charlemagne | `["emperor", "religious-patron", "religious-reformer"]` — patronized AND restructured liturgy (Carolingian renovatio) |
| Akbar | `["emperor", "religious-reformer"]` — Din-i-Ilahi was internal doctrinal innovation |
| Henry VIII | `["king", "religious-reformer"]` — English Reformation |
| Elizabeth I | `["queen", "religious-reformer"]` — Elizabethan Settlement |
| Khomeini | `["ayatollah-twelver", "state-founder-religious"]` — Islamic Republic founding |
| **Joseph Smith** | `["founder"]` only — DEMOTED from `prophet-abrahamic` per Auditor A | LDS internal claim ≠ academic-neutral classification. Bushman 2005, Brodie 1945, Shipps 1985 treat as founder. The LDS doctrinal frame goes in `tradition-internal-claim:` (deferred field) OR `role-description:` prose. |
| **Bahá'u'lláh** | `["founder", "manifestation-bahai"]` — replacing `prophet-abrahamic` per Auditor A + B | The Báb gets `["founder", "manifestation-bahai", "martyr-bahai"]` |
| Mahavira | `["tirthankara-jain", "founder"]` |
| Buddha | `["founder", "acharya-buddhist"]` |
| Guru Nanak | `["founder", "guru-sikh"]` |
| Muhammad | `["founder", "prophet-abrahamic", "messenger-islamic"]` |
| Jesus | `["founder", "prophet-abrahamic"]` — academic-neutral; tradition-internal claims (Son of God, Messiah) in tradition-internal-claim: field or role-description prose |
| Asanga / Atiśa | `acharya-buddhist` (not `bodhisattva-mahayana` — Auditor A correction) |
| Padmasambhava | `["lineage-master-tibetan", "tertön-tibetan", "mahasiddha"]` with `confidence: medium` flag (Davidson 2002 contests historicity) |

### Modern Christian boundary

| Person | Proposal |
|---|---|
| Bonhoeffer | `["theologian", "pastor-protestant", "martyr-christian", "religious-reformer"]` per Auditor A — adds pastor + reformer roles missing in v2 |
| C.S. Lewis | `["theologian", "author-secular"]` — figure-qualifying via theologian (his apologetic writing is doctrinal-systematic) |
| Thomas Merton | `["monastic-christian-western", "mystic-christian", "theologian"]` |
| Dorothy Day | `["religious-reformer", "saint-roman-catholic"]` (cause for canonization open; saint prospectively per Bowker contemporary-usage allowance) |
| MLK Jr. | `["religious-reformer", "martyr-christian"]` |
| Mother Teresa | `["saint-roman-catholic", "religious-reformer", "monastic-christian-western"]` (canonized 2016) |
| Padre Pio | `["saint-roman-catholic", "mystic-christian"]` (canonized 2002) |
| Niebuhr (Reinhold) | `["theologian", "pastor-protestant"]` |
| Tillich | `["theologian", "philosopher-religious"]` |
| Aquinas | `["doctor-of-the-church", "theologian", "philosopher-religious", "monastic-christian-western"]` — order honors insider weighting (Doctor first) |

### Modern Hindu / Buddhist / Sikh figures (added per Auditor B)

| Person | Proposal |
|---|---|
| Adi Sankara | `["acharya-hindu", "philosopher-religious"]` — NOT `theologian` (Auditor B) |
| Ramanuja | `["acharya-hindu", "philosopher-religious"]` |
| Madhva | `["acharya-hindu", "philosopher-religious"]` |
| Chaitanya | `["acharya-hindu", "bhakti-saint"]` |
| Ramakrishna | `["guru-hindu", "mystic-syncretic"]` |
| Vivekananda | `["guru-hindu", "religious-reformer"]` |
| Aurobindo | `["guru-hindu", "philosopher-religious"]` |
| Ramana Maharshi | `guru-hindu` |
| Yogananda | `guru-hindu` |
| Sai Baba (Shirdi) | `["guru-hindu", "saint-syncretic"]` (Hindu-Muslim syncretic figure) |
| Sai Baba (Sathya) | `guru-hindu` + `polemical-framing: by: mainstream-Hindu-orthodoxy, label: false-guru` (contested figure; capture the polemic) |
| Abhinavagupta | `["tantric-acharya", "acharya-hindu", "philosopher-religious"]` |
| Nammalvar | `alvar` |
| Black Elk | `["wichasha-wakan", "mystic-syncretic", "evangelist-revivalist"]` (Catholic catechist later in life — multi-role respects the complexity per Powers 1977) |
| Wovoka | `prophet-indigenous` — explicitly NOT `prophet-abrahamic` (Auditor B's core correction) |
| Smohalla | `prophet-indigenous` |
| Handsome Lake | `prophet-indigenous` |
| Tenskwatawa | `prophet-indigenous` |
| Confucius | `["sage-chinese-ru", "founder"]` — NOT pan-tradition `sage` |
| Mencius | `sage-chinese-ru` |
| Laozi | `legendary-disputed` + `founder` if historicity-default accepted (CONTESTED — Auditor A flagged) |
| Zoroaster | `["founder", "prophet-abrahamic"]` — note: Zoroaster's relation to "Abrahamic" prophet-category is itself contested; Bahá'í classes him as Manifestation. **My call: `["founder", "manifestation-bahai"]`** to preserve cross-tradition recognition Bahá'í explicitly gives him. Counter-propose if you want different framing. |

### Boundary cases that need John's explicit decision

These are not auto-applied; ratify each:

- **Simon Magus** — known almost entirely through Christian polemic. Proposal: `["legendary-disputed", "heresiarch-self-claimed-or-disputed"]` with `polemical-framing:` capturing the Christian-orthodox label. Counter-propose.
- **Mary Magdalene** — `apostle-christian` per Brock 2003 OR `disciple-christian` per Schaberg 2002 (contested). Proposal: `apostle-christian` (the "apostle to the apostles" tradition is older and Eastern-Orthodox-recognized). Counter-propose.
- **Lao Tzu** — proposal above (`legendary-disputed` + `founder`). Counter-propose if you want full historicity.
- **Sai Baba (Sathya)** — controversial; my proposal includes polemical-framing. Counter-propose if you want to drop polemic and stick with `guru-hindu` only, or vice versa drop guru-hindu and capture only polemic.
- **King Arthur** — if he's added to vault, classification depends on file location (`04_persons/` vs `06_themes/` vs `05_events/`). Not in scope for v3 migration but flagged for completeness.

---

## §5 — Decision tree (rewritten for reproducibility)

```
STEP 0 (gate): Is there at least ONE Tier-1, Tier-2, or Tier-3 source 
   classifying this figure within any tradition?
   → NO: flag for manual-review queue. DO NOT default to Tier-5.
         The migration script's TSV marks this row as 
         "needs-source-or-manual-decision".
   → YES: continue.

STEP 1: Is the person a founder, prophet, revelation-bearer, or tradition-defining figure?
   → YES: assign Tier-1 token (founder / prophet-abrahamic / prophet-indigenous /
          prophet-non-abrahamic / messenger-islamic / avatar-hindu / 
          manifestation-bahai / tirthankara-jain / mahasiddha / 
          acharya-{hindu,jain,buddhist} / bodhisattva-mahayana / 
          tertön-tibetan / lineage-master-tibetan / guru-sikh / guru-hindu / 
          rishi-vedic / oracle / diviner). 
          Multi-role if multi-aspect (Muhammad = founder + prophet-abrahamic + messenger-islamic).
          For non-Abrahamic revelation-bearers: NEVER prophet-abrahamic; use prophet-indigenous OR prophet-non-abrahamic.
   → NO: continue.

STEP 2: Did the person hold institutional religious authority?
   → YES: assign Tier-2 token (the multi-tradition-disambiguated authority role).
          Mandatory disambiguation: never bare "patriarch" / "rabbi" / "imam" / 
          "guru" — always use the tradition-specific token.
   → NO: continue.

STEP 3: Did the person produce theological/philosophical/juristic doctrine within a tradition?
   → YES: assign Tier-2b token (theologian / philosopher-religious / 
          jurist-islamic / jurist-jewish / mufti / qadi / sage-chinese-ru / 
          presocratic-philosopher).
   → NO: continue.

STEP 4: Is the person an exemplar (apostle / disciple / monastic / saint / wali / 
        sant / kevali / martyr / sahabi / arhat)?
   → YES: assign Tier-3 token (multi-tradition-disambiguated where applicable —
          saint-{roman-catholic,eastern-orthodox,oriental-orthodox,anglican} etc.).
   → NO: continue.

STEP 5: Did the person hold political-religious dual office?
   → YES: assign Tier-4 token (emperor / king / queen / pharaoh / 
          religious-reformer / religious-patron / state-founder-religious).
          religious-reformer vs. religious-patron distinction: reformer changed
          doctrine; patron supported a tradition without changing it.
   → NO: continue.

STEP 6: Is the person a modern academic-about-religion?
   → YES: scholar-academic-religion (Tier 5, NOT figure).
          Sub-check: is the person CURRENTLY exercising ordained ministry 
                     OR producing systematic theology within a tradition?
          → YES: ADD theologian (or pastor-protestant) — figure-qualifying via double role.
          → NO: Tier-5 only.
   → NO: continue.

STEP 7: Is the person opponent-categorized only (heresiarch / antichrist / 
        false-prophet by polemic only)?
   → YES: assign the SCHOLARLY-NEUTRAL role for what they actually were
          (founder / theologian / heterodox-founder) + ADD polemical-framing: 
          field with the opponent's framing + source-tier + direction.
          If the ONLY available sources are polemical and no neutral 
          classification is possible: add legendary-disputed.
   → NO: continue.

STEP 8: Default — author-secular or historical-cited (Tier 5, NOT figure).
        This default fires ONLY if step 0's source-gate passed but no other 
        step assigned a role. If no source exists, the figure is in the 
        manual-review queue per Step 0 — never silently defaulted.

ARRAY ORDER RULE: role-tokens: array is ORDERED. Sort by:
  1. Decision-tree-step ascending (Step 1 outputs first, Step 5 outputs later).
  2. Tie-break: insider-frame preference (e.g., Catholic Doctor-of-the-Church 
     before generic theologian; mawlana before sufi-shaykh; specific 
     lineage-master before generic lineage role).
  3. Final tie-break: alphabetic canonical id.

CONVERT-DISPOSITION RULE: role-tokens: reflects CURRENT identity. The tradition
  the figure is primarily wikilinked-from in vault edges is the current 
  identity. Pre-conversion historical roles go in a separate role-history:
  field (DEFERRED — Stage 12+ migration; out of scope for v3 Stage 1-11).
```

---

## §6 — Persistence locations (corrected per Auditor C)

The framework persists in the LIVE master files, not the deprecated methodology.md.

| Location | Content | Why |
|---|---|---|
| `00_meta/role-vocabulary.yaml` | The controlled vocabulary (canonical ids + Tier-1 sources + aliases). | Machine-readable, mirrors `tradition-vocabulary.yaml` |
| `00_meta/polemical-framing-vocabulary.yaml` | Opponent-category vocabulary. | Same shape |
| `00_meta/reclaimed-self-naming-vocabulary.yaml` | Reclaimed-self-naming terms. | Same shape |
| `00_meta/role-contested-cases-ratified-2026-05-31.yaml` | Single source of truth for John's per-person ratifications. Migration script reads from this file (not hardcoded). | Auditor C correction |
| `00_meta/HOW-WE-WORK.md §8` (When-to-read table) | Add row: `role-vocabulary.yaml \| Classifying a person OR shipping a Lane-A person-node OR contesting a Figures-lens assignment.` | This is the file every fresh agent reads on cast |
| `00_meta/HOW-WE-WORK.md §9` (master files list) | Add `role-vocabulary.yaml` so future agents can't silently mutate without ratification | Lock against future drift |
| `00_meta/ONTOLOGY.md §person` | Add the `role-tokens:` field spec + `role-description:` rename + pointers to vocab files | ONTOLOGY is THE schema authority |
| `lint_yaml.py validate_roles()` | Build-time gate: ERROR on unknown role-token id; ERROR on non-array; ERROR on duplicate-within-array; vocab-self-check (no dangling aliases / no duplicate ids) | Pre-commit hook already wires `lint_yaml.py --strict`; this extends it |
| **NOT in `methodology.md`** (deprecated per AGENTS.md:37) | — | Auditor C's hard correction |

---

## §7 — Staged execution (12 stages)

| Stage | Output | Lane | Notes |
|---|---|---|---|
| 0 | This plan v3 + John's ratification on the framework (already given) + on contested-cases list | B | DONE on v3 framework; awaiting contested-cases LGTM |
| 0.5 | **Coverage audit gate** — sample 30 random persons from `04_persons/`, attempt classification via the decision tree, measure inter-rater agreement (kappa). If kappa < 0.7 OR >5% of sample forces Western-academic-residual fit, plan v3 vocabulary is incomplete → expand before Stage 1. | B | Auditor A + B's correction; runs against the vocab file before any YAML mutation |
| 1 | `00_meta/role-vocabulary.yaml` (mirrors tradition-vocabulary.yaml schema) | B | |
| 1.5 | **Wire `tradition-vocabulary.yaml` consumer in `build_data.py` + extend `lint_yaml.py` with `validate_traditions()`** — closes the dormancy bug that v2 left open. Auditor C's hard correction. | B | Same migration batch; prevents the next loop |
| 2 | `00_meta/polemical-framing-vocabulary.yaml` + `00_meta/reclaimed-self-naming-vocabulary.yaml` | B | Separate files for the secondary vocabularies |
| 3 | `00_meta/role-contested-cases-ratified-2026-05-31.yaml` | B | Persists ratified contested-cases as machine-readable; migration script reads from this file |
| 4 | Update `00_meta/HOW-WE-WORK.md §8 + §9` + `00_meta/ONTOLOGY.md §person` + add to `methodology.md` (only as documentation-of-deprecated-doc; not the discoverability anchor) | B | Auditor C's persistence correction |
| 5 | `scripts/migrate_roles.py` — survey + normalize + backfill | B | Reads vocab + contested-cases YAMLs; produces TSV |
| 6 | `AUDIT/2026-05-31-roles-migration-table.tsv` — per-person assignment + source + confidence + decision-tree-step | B | **Ratification gate: John reviews TSV before Stage 7 applies YAML** |
| 7 | Apply YAML field to 1,217 person files: rename `role:` → `role-description:` + add `role-tokens:` array | A | Idempotent; --dry-run + --apply + --revert-from-tsv flags |
| 8 | `lint_yaml.py validate_roles()` extension + pre-commit hook integration verification | B | Build-time gate active |
| 9 | `mode.js filterNodesByMode('figures')` reads `role-tokens` array; `build_data.py` passes through canonical `role_tokens` in node JSON | B | Engine swap |
| 10 | **Mark `FIGURES_IDS` + static `SCRIPTURE_IDS` + `SCRIPTURE_CORPORA`-derived backstop as `// DEPRECATED-BACKSTOP` — DO NOT DELETE YET** | B | Auditor C correction: keep backstops for one session-cycle |
| 11 | Verification: re-run lint, re-load Codex Atlas in Safari, confirm Figures lens expanded coverage, audit_dates still flags 0, cross-tradition wires still render at 100% | B | Per cardinal rule about screenshots-as-success-criterion |
| 12 | `AUDIT/2026-05-31-figures-migration-POST-EXECUTION.md` + STATUS entry + memory file if new pattern surfaces | B | End-of-session checklist |

**Separate follow-up batches (not in v3 scope):**
- After one session-cycle of soaking: delete the deprecated backstops (FIGURES_IDS, static SCRIPTURE_IDS, SCRIPTURE_CORPORA-derived union).
- Sub-tradition canonization (its own contested-cases list, its own v1→v2→v3 cycle).
- `role-history:` field for converts (Heine, Akiva-pre-conversion, Paul-as-Saul, Augustine-pre-conversion).

---

## §8 — Rollback plan (per Auditor C)

If Stage 7 applies YAML and Stage 9 engine-swap surfaces a bug:

1. **Migration script ships with `--revert-from-tsv` flag** that reads the TSV column and undoes per-row.
2. **`git checkout HEAD~ -- 04_persons/*.md`** is the fallback hard-revert; Stage 7 commit is isolated so this works cleanly.
3. **The deprecated backstops (FIGURES_IDS, etc.) remain live in `mode.js`** — even if Stage 7 reverts, the Figures lens still works at v2-state coverage from the backstop, not zero-state.
4. **Per-stage commit boundaries:** Stages 1-6 land separately; Stage 7 is its own commit; Stage 9 is its own commit. Atomic-rollback per stage possible.

---

## §9 — What v3 prevents that v2 didn't (the rule #10 test)

| Loop risk | v2 status | v3 status |
|---|---|---|
| Hand-typed FIGURES_IDS drift | open (the originating loop) | closed (YAML-property + validator) |
| Cross-tradition coverage erasure (Yoruba/Vodou/Indigenous/Hindu-non-Sikh/Zen/Shinto/Zoroastrian/Pagan) | open (would erase) | closed (vocabulary covers all major + minor traditions) |
| Insider-doctrinal-claim smuggling (Joseph Smith / Bahá'u'lláh as prophet-abrahamic) | open | closed (academic-neutral roles; insider claims go to tradition-internal-claim: or role-description:) |
| Colonial-framing (Wovoka as Abrahamic prophet) | open | closed (`prophet-indigenous` token) |
| Methodology persisted in deprecated file | open (would be lost across sessions) | closed (HOW-WE-WORK §8 + §9 + ONTOLOGY persistence) |
| tradition-vocabulary.yaml dormancy replay | open (would re-loop within 2 sessions) | closed (Stage 1.5 wires the consumer in same batch) |
| Field-name collision (free-text role: vs controlled role:) | open | closed (rename: role-description: prose + role-tokens: array) |
| Decision tree non-determinism | open | closed (Step 0 source-gate + array-order rule + convert-disposition rule) |
| Contested-cases ratification has no mechanical inflow | open | closed (role-contested-cases-ratified-YYYY-MM-DD.yaml file) |
| Premature backstop deletion | open (Stage 8 in v2) | closed (Stage 10 keeps backstops; separate session deletes) |
| Validator self-check (vocab integrity) | open | closed (validator self-checks before per-node validation) |
| Multi-value array ordering ambiguity | open (UI drift inevitable) | closed (decision-tree-step ascending + tie-break rules) |
| Reclaimed-self-naming dual-life handling (witch/pagan) | open | closed (separate vocabulary file) |
| Opponent-category as primary role | open (heresiarch in v1) | closed (polemical-framing field) |

All 14 of v2's known failure modes addressed.

**Predicted next-loop risk after v3 ships:** sub-tradition canonization (Pattern C — currently free-text). This is the explicit next-batch follow-up, not a v3 oversight.

---

## §10 — Ratification asks (what blocks Stage 0.5)

Per John's standing instruction: *"NEVER let me pick if im overlooking"* — I am NOT presenting these as menu picks. They are points where the protocol requires your explicit signal because the call is yours, not mine. Items 1-5 are non-overlookable (the framework needs your name on them); item 6 is a sanity check.

1. **Framework ratification** — confirmed in this session: T1 default conservative + T3/T4 for alternative + cross-tradition coverage + opponent-categories-as-polemical-framing. ✅ done.
2. **Contested-cases list (§4)** — review the ~80 proposed calls; counter-propose any. Particular attention requested on the boundary cases I flagged explicitly (Simon Magus, Mary Magdalene, Lao Tzu, Sai Baba, Zoroaster, Schuon-Guénon).
3. **Decision tree** — confirm the 8-step tree + Step 0 source-gate + array-order rule + convert-disposition rule is the rule the migration applies.
4. **Persistence locations** — confirm `HOW-WE-WORK.md §8 + §9` and `ONTOLOGY.md §person` are the right anchors (methodology.md is deprecated; not a discoverability target).
5. **Stage 1.5 (tradition-vocabulary.yaml consumer)** — confirm we ship this in the SAME migration batch as the role migration. Per Auditor C, this is the highest next-loop risk if deferred. My recommendation: ship together.
6. **Stage 0.5 (coverage audit gate)** — confirm the sample-30-persons-test-kappa-≥-0.7 OR <5%-Western-academic-residual gate is the criterion for "vocabulary is complete enough to migrate." If the gate fails, expand vocabulary before Stage 1.

When you confirm, Stage 0.5 runs. If 0.5 passes, Stages 1 onwards execute. If 0.5 fails, I expand the vocabulary and re-run before any code touches a YAML file.
