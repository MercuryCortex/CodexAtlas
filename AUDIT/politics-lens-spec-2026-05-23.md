# Politics Lens (`30_politics/`) — design spec

**Date:** 2026-05-23
**Handle:** opus-politics-lens-spec-1
**Status:** PROPOSAL — awaiting John's greenlight/veto. READ-ONLY scoping document; no nodes created, no existing nodes touched.
**Audited against:** `00_meta/ONTOLOGY.md` (29-lens spine), `00_meta/ONTOLOGY-RATIONALE-2026-05-18.md` + `ONTOLOGY-RATIONALE-2026-05-19.md` (bars-cleared procedure), `00_meta/CODEX.md` v1.1 (5-tier source system + neutrality discipline), `AUDIT/sacred-geometry-lens-spec-2026-05-23.md` (parallel proposal — both compete for the 27/28/29/30 slot order).

---

## 0. Numbering note (read first)

Current ontology lock has slots 01–29 occupied:
- `27_attire/`, `28_exchange_networks/`, `29_technology/` were locked 2026-05-19.
- `27_geometry/` is a parallel proposal filed today (`AUDIT/sacred-geometry-lens-spec-2026-05-23.md`) — that author suggests bumping `27_attire` → `28_attire` so geometry sits next to calendars in the "encoded cosmos" cluster.

This spec proposes the politics lens at **slot 30** under the simplest assumption: if geometry lands at 27, attire/exchange/tech shift to 28/29/30 and politics becomes 31; if attire/exchange/tech keep their current slots and geometry takes 30, politics becomes 31. **Either way, the politics lens lands at the tail.** John picks the order; the design here is slot-agnostic. For brevity below I use `30_politics/` as a placeholder.

---

## 1. Lens scope

`30_politics/` collects the **religion-as-statecraft layer** — the political-theological *movements*, *concepts*, *state-relation types*, and *thinkers* through which traditions are mobilized for political ends (or through which political projects sacralize themselves).

The animating thesis: **the vault already maps Constantine the person, the Council of Nicaea the event, Imperial Christianity the tradition, and "civic religion" the theme — but the political-theological *movement* that binds them is currently homeless.** Constantinian Christianity-as-political-program, velayat-e faqih as a doctrine of jurist-rule, Hindutva as a 1923-onwards political ideology, Liberation Theology as a Latin-American movement — these are FIRST-CLASS entities with their own genealogies, scholars, primary texts, opponents, and reception histories. They deserve dedicated nodes, not scattered category-tags across five other lenses.

Political theology is a **recognized academic field** with peer-reviewed journals (*Political Theology*, Routledge), endowed chairs (Princeton's Roxanne Euben in comparative political theology; Cambridge's Mark Lilla-tradition), a foundational canonical text (Carl Schmitt, *Politische Theologie*, 1922), and three generations of secondary scholarship (Taylor, Casanova, Asad, Mahmood). The vault should mirror the field.

### Distinction from neighboring lenses

| Lens | What it holds | How politics differs |
|---|---|---|
| `04_persons/` | individuals (Constantine, Akbar, Khomeini, Gandhi) | A person is a biographical entity; a political-theological *movement* is a multi-actor program with primary texts, opponents, and downstream reception. Constantine-the-person (born ~272, died 337) ≠ Constantinianism-the-movement (ongoing claim about state-Christianity as a model, invoked from Eusebius through Carl Schmitt through Russian Orthodox-imperialism). |
| `05_events/` | discrete time-bounded happenings (Council of Nicaea 325; Wars of Religion 1524–1648; Iranian Revolution 1979) | Events are punctual; movements are durative. The Iranian Revolution is one event; velayat-e faqih is the political theology that animated it AND continues to govern the state today. |
| `06_themes/` | recurring cross-tradition motifs (divine-kingship, civic-religion, messianism, prophet-and-king) | Themes are *patterns* that travel cross-tradition; politics-lens nodes are *specific named movements / doctrines / state-relation types* that instantiate those patterns. Divine-kingship is a theme; **Egyptian Pharaonic divine-kingship** is its Egyptian instantiation that lives in 30_politics. The theme node aggregates; the politics node particularizes. |
| `07_traditions/` | per-tradition overviews (Sunni Islam, Theravada Buddhism, Roman Catholicism) | A tradition is a religious community with cosmology, texts, ritual life. A political-theological movement is a *political program* that *deploys* a tradition. Wahabi Islam-as-tradition (the 18th-century Hanbali revival) is in 07; **Saudi Wahabism-as-state-establishment** (the post-1932 Saudi-state political project) is in 30. They cross-link. |
| `21_theology/` | systematic doctrinal formulations within a tradition (Chalcedonian Christology, Tawhid, Trikaya, Sola Scriptura) | Theology nodes are *worked-out doctrinal positions*. Politics nodes are *political-theological positions* — doctrines about how religion relates to political power. Tawhid-the-doctrine lives in 21; **velayat-e-faqih-the-doctrine-of-jurist-rule** lives in 30. They cross-link. (Some doctrines straddle: Liberation-Theology's "preferential option for the poor" is theological AND political; we wire it in 21 as theological-doctrine and in 30 as political-theology movement, with explicit cross-link.) |

### Why this lens passes the three bars (per `ONTOLOGY-RATIONALE-2026-05-19.md` procedure)

**Bar 1 — existing lens fails it.** Political-theological *movements* have no home. `06_themes/civic-religion.md` exists as the *theme* (the cross-tradition pattern Bellah named), but there is nowhere to put **Hindutva as a 1923-Savarkar-onward political movement** that is neither a tradition (it's a political reading of the Hindu tradition) nor a doctrine (it's an ethno-national ideology) nor a person (it has many actors) nor an event (it's continuous). The vault currently lacks a clean node-type for "named political-theological program."

**Bar 2 — real demand signal.** Vault grep shows 47 themes carrying `category: "political-theological"` today, plus scattered references to Constantine + Akbar + Khomeini + Gandhi + Hindutva + caliphate + theocracy + Wahabism + Vatican-II + civil-religion across the corpus. The category tag itself ("political-theological") signals John was already routing these *somewhere* — they just don't have a coherent home.

**Bar 3 — bounded scope.** The lens has a clear definition: **political-theological movements + concepts + state-relation types + thinkers, where "political-theological" follows the academic-field definition** (Schmitt 1922 → Taylor / Casanova / Asad / Mahmood / Lilla / Connolly tradition). Bounded inputs:
- IN: named political-theological movements (Hindutva, Christian Reconstructionism, Liberation Theology, Khomeinism, etc.)
- IN: political-theological concepts (mandate of heaven, two-swords, velayat-e faqih, divine right of kings)
- IN: state-relation types (theocracy, civic religion, establishment, separation, concordat, national-religion, state-atheism)
- IN: the academic-field's canonical thinkers (Schmitt, Taylor, Casanova, Asad, Mahmood, Lilla, Connolly, Milbank, Hauerwas, Niebuhr, Liberation theologians, Qutb, Khomeini-as-theorist)
- OUT: individual statecraft figures *as biographical persons* (those stay in `04_persons/`, with `political-theology:` cross-field pointing to their movement-node here)
- OUT: discrete events (Council of Nicaea, 1979 Revolution — stay in `05_events/`)
- OUT: traditions qua traditions (Sunni Islam, Catholicism — stay in `07_traditions/`)
- OUT: religious doctrines qua doctrines (Tawhid, Chalcedonian Christology — stay in `21_theology/`)

The lens is bounded by the academic-field's own delimitation: if a peer-reviewed political-theology survey would treat the entity, it belongs in 30_politics.

---

## 2. Ontology — what KIND of node lives here?

Four sub-types within the lens:

### 2.1 `political-theology-movement` (the workhorse type)

Named multi-actor political-theological programs with primary-text genealogies, opponents, and downstream-reception history. **Per CODEX v1.1, every movement node carries `source-tier:` AND, where applicable, `political-risk-flag: true`.**

Examples (full catalog in §3 below):
- `constantinian-christianity` — state-establishment Christianity as a political model (Eusebius → Justinian → Charlemagne → Romanov → modern Russian Orthodox-imperialism)
- `hindutva` — Savarkar 1923 onwards (T1 academic via Jaffrelot 1996; `political-risk-flag: true` per documented violence reception)
- `liberation-theology` — Gutiérrez 1971 onwards (T1 via Cambridge Companion to Liberation Theology)
- `christian-reconstructionism` — Rushdoony 1973 onwards (T1 via Worthen 2008 *Church History*; `political-risk-flag: true` per documented anti-democratic theonomy positions)
- `khomeinism-velayat-e-faqih` — Khomeini 1970 *Islamic Government* onwards (T1 via Arjomand, Mavani, Cambridge *Critical Introduction to Khomeini*)
- `christian-identity` — 1940s–onwards (T1 via Barkun 1994 *Religion and the Racist Right*; `political-risk-flag: true` mandatory — white-supremacist + antisemitic)
- `russian-orthodox-imperialism` — Moscow Patriarchate alignment post-1990s, intensified 2014+ (T1 via Stoeckl, Hovorun, Knox; `political-risk-flag: true` per documented Ukraine-war justification)
- `buddhist-nationalism-sri-lanka` — Bodu Bala Sena + JHU + post-1956 Sinhala-Buddhist state (T1 via Tambiah 1992, Walton 2016; `political-risk-flag: true` per documented anti-Muslim violence)
- `buddhist-nationalism-myanmar` — 969 Movement + MaBaTha (T1 via Walton 2016 *Contemporary Buddhism*; `political-risk-flag: true` per documented Rohingya persecution)

### 2.2 `political-theology-concept` (doctrine + idea-type)

Specific political-theological *concepts* that recur across movements:
- `divine-right-of-kings` (European, ~16th–18th c.)
- `two-swords-doctrine` (Gelasius I, 5th c.)
- `mandate-of-heaven` (Chinese tianming — cross-link to existing theme + add concept node)
- `caesaropapism` (Byzantine + Russian)
- `theonomy` (Reconstructionist political-theology)
- `dominionism` (umbrella for Christian-Right political programs)
- `dīn-i-ilāhī` (Akbar's syncretic-imperial political theology, 1582)
- `preferential-option-for-the-poor` (Liberation Theology; straddles 21 + 30)

### 2.3 `religion-state-relation-type` (typology — the comparative-politics axis)

The structural-typology node — six-to-eight named state-religion relationship *types* drawn from comparative political science:
- `theocracy` (clerical rule — Iran post-1979, Vatican as nation-state, Tibet pre-1959 Lhasa)
- `caesaropapism` (head-of-state-as-religious-head — Byzantine Empire, Henry VIII English Reformation, Romanov Russia)
- `establishment` (official-religion-with-political-pluralism — Anglican England, Lutheran Scandinavia, Greek Orthodox Greece)
- `concordat-system` (negotiated state-church separation — most Catholic-majority European states post-Westphalia)
- `civic-religion` (diffuse-sacralization-of-polity — US, Roman *religio publica*, French Revolutionary cults; cross-link to existing `06_themes/civic-religion.md`)
- `assertive-secularism` (state-actively-excludes-religion — French laïcité, Atatürk-Turkish laiklik, Soviet/Maoist state-atheism; per Kuru 2007 *World Politics*)
- `passive-secularism` (state-neutral-equidistant-from-religions — US Establishment Clause interpretation, Indian *sarva-dharma-sambhāva*; per Bhargava 1998 + Kuru 2007)
- `religious-nationalism` (ethnic-religious-fusion-as-state-ideology — Hindutva-India, Buddhist-nationalist Sri Lanka/Myanmar, Christian-nationalism US, post-2014 Russian Orthodox-Imperialism)
- `national-religion-state-atheism` (state-imposed-irreligion as itself a political-theological position — Soviet, Maoist China, Albanian Hoxhaism, North Korean *juche*-as-civic-religion)

### 2.4 `political-theology-thinker` (the academic-field canon)

The 30–50 canonical theorists of political theology as a discipline — full catalog in **`AUDIT/political-theology-key-figures-2026-05-23.md`**. Each gets a node with main political-theology work + tier + risk-flag + claim summary. Two-way cross-link: the thinker's node sits in 04_persons (biographical) AND 30_politics (political-theology-thinker).

### Sub-folder structure

```
30_politics/
├── README.md
├── movements/
│   ├── constantinian-christianity.md
│   ├── hindutva.md
│   ├── liberation-theology.md
│   ├── christian-reconstructionism.md
│   ├── khomeinism-velayat-e-faqih.md
│   ├── christian-identity.md
│   ├── russian-orthodox-imperialism.md
│   ├── buddhist-nationalism-sri-lanka.md
│   ├── buddhist-nationalism-myanmar.md
│   ├── islamic-modernism.md
│   ├── salafism-political.md
│   ├── muslim-brotherhood.md
│   ├── christian-nationalism-us.md
│   ├── ...
├── concepts/
│   ├── divine-right-of-kings.md
│   ├── two-swords-doctrine.md
│   ├── caesaropapism.md
│   ├── theonomy.md
│   ├── dominionism.md
│   ├── dīn-i-ilāhī.md
│   ├── ...
├── state-relations/
│   ├── theocracy.md
│   ├── establishment.md
│   ├── concordat-system.md
│   ├── civic-religion.md (cross-link to 06_themes)
│   ├── assertive-secularism.md
│   ├── passive-secularism.md
│   ├── religious-nationalism.md
│   ├── state-atheism.md
│   ├── ...
└── thinkers/
    ├── carl-schmitt.md
    ├── charles-taylor.md
    ├── jose-casanova.md
    ├── talal-asad.md
    ├── saba-mahmood.md
    ├── reinhold-niebuhr.md
    ├── gustavo-gutierrez.md
    ├── james-cone.md
    ├── ... (see Deliverable 2 catalog)
```

The sub-folder split is **strongly recommended**. Without it, the 100+ projected nodes form an undifferentiated pile; with it, the lens stays browseable and the four sub-types remain semantically clean. Build-script update is one-time (`build_data.py` already handles sub-folders for `02_documents/_phase-N-*/`).

---

## 3. Cross-tradition catalog — political-theological movements + concepts by region/period

Each row: name (slug), region/period, primary academic source (peer-reviewed where available), tier per CODEX v1.1, political-risk-flag. Triaged by "include in first batch" / "stub now, build later" / "later wave".

### 3.1 Ancient (–~300 CE)

| Slug | Region / period | Primary source | Tier | Risk-flag | Priority |
|---|---|---|---|---|---|
| `egyptian-pharaonic-divine-kingship` | Egypt, OK–LP, ~2700 BCE–30 BCE | Frankfort 1948 *Kingship and the Gods* (Chicago) | T1 | no | first batch |
| `mesopotamian-sacred-kingship` | Sumer / Babylon, ~2500–500 BCE | Hocart 1927; Bottéro 2001 *Religion in Ancient Mesopotamia* (Chicago) | T1 | no | first batch |
| `achaemenid-zoroastrian-patronage` | Persia, 550–330 BCE | Boyce 1982 *History of Zoroastrianism* II (Brill) | T1 | no | first batch |
| `athenian-polis-religion` | Athens, ~600–323 BCE | Parker 2005 *Polytheism and Society at Athens* (Oxford) | T1 | no | first batch |
| `roman-imperial-cult` | Rome, 27 BCE–~380 CE | Price 1984 *Rituals and Power* (Cambridge); Rives 2007 *Religion in the Roman Empire* | T1 | no | first batch |
| `mandate-of-heaven-tianming` | China, Zhou onwards, ~1046 BCE forward | Pines 2023 "The Elusive Mandate of Heaven" *T'oung Pao* 109; Bol 2008 *Neo-Confucianism in History* (Harvard) | T1 | no | first batch — cross-link to existing `divine-kingship` theme |
| `ashokan-buddhist-statecraft` | Maurya India, 268–232 BCE | Thapar 1997 *Aśoka and the Decline of the Mauryas* (Oxford) | T1 | no | first batch |
| `roman-religio-publica` | Rome, Republic | Rives 2007; Beard/North/Price 1998 *Religions of Rome* (Cambridge) | T1 | no | first batch — already-cross-link to `06_themes/civic-religion.md` |

### 3.2 Late antique / medieval (~300–~1500)

| Slug | Region / period | Primary source | Tier | Risk-flag | Priority |
|---|---|---|---|---|---|
| `constantinian-christianity` | Roman Empire, 312+ | Drake 2000 *Constantine and the Bishops* (Johns Hopkins); Van Dam 2007 *The Roman Revolution of Constantine* (Cambridge) | T1 | no | **first batch — anchor node** |
| `byzantine-caesaropapism` | Byzantium, 330–1453 | Dagron 2003 *Emperor and Priest* (Cambridge) | T1 | no | first batch |
| `two-swords-doctrine` | Western Christendom, 494+ (Gelasius) | Ullmann 1955 *Growth of Papal Government in the Middle Ages* (Methuen) | T1 | no | first batch |
| `rashidun-caliphate-political-theology` | Arabia, 632–661 | Madelung 1997 *The Succession to Muhammad* (Cambridge) | T1 | no | first batch |
| `umayyad-caliphal-ideology` | Damascus, 661–750 | Hawting 2000 *The First Dynasty of Islam* (Routledge) | T1 | no | first batch |
| `abbasid-caliphal-ideology` | Baghdad, 750–1258 | Crone & Hinds 1986 *God's Caliph* (Cambridge) | T1 | no | first batch |
| `ottoman-caliphate` | Constantinople / Istanbul, 1517–1924 | Imber 2002 *The Ottoman Empire* (Palgrave); Karpat 2001 *The Politicization of Islam* (Oxford) | T1 | no | first batch |
| `crusades-as-religious-policy` | Europe / Levant, 1095–1291 | Riley-Smith 2005 *The Crusades: A History* (Yale); Tyerman 2006 *God's War* (Harvard) | T1 | no | first batch |
| `dalai-lama-religious-political-rule` | Tibet, 1642–1959 | Goldstein 1997 *The Snow Lion and the Dragon* (California) | T1 | no | first batch |
| `holy-roman-empire-political-theology` | Central Europe, 800–1806 | Whaley 2012 *Germany and the Holy Roman Empire* (Oxford) | T1 | no | first batch |
| `mongol-religious-toleration` | Mongol Empire, 1206–1368 | Atwood 2004 "Validation by Holiness or Sovereignty" *International History Review* | T1 | no | first batch |

### 3.3 Early modern (~1500–~1800)

| Slug | Region / period | Primary source | Tier | Risk-flag | Priority |
|---|---|---|---|---|---|
| `din-i-ilahi` | Mughal India, 1582 | Richards 1995 *The Mughal Empire* (Cambridge); Truschke 2017 *Aurangzeb* (Stanford) | T1 | no | first batch |
| `wars-of-religion-westphalian-settlement` | Europe, 1524–1648 / 1648 | Asch 1997 *The Thirty Years War* (Macmillan); Cavanaugh 2009 *The Myth of Religious Violence* (Oxford) | T1 | no | first batch |
| `henry-viii-anglican-establishment` | England, 1534 onwards | MacCulloch 1996 *Thomas Cranmer* (Yale); Marshall 2017 *Heretics and Believers* (Yale) | T1 | no | first batch |
| `calvinist-geneva` | Geneva, 1541–1564 | Naphy 1994 *Calvin and the Consolidation of the Genevan Reformation* (Manchester) | T1 | no | first batch |
| `counter-reformation-as-policy` | Catholic Europe, 1545+ | O'Malley 2000 *Trent and All That* (Harvard) | T1 | no | first batch |
| `puritan-new-england-theocracy` | Massachusetts Bay, 1630+ | Bremer 2009 *Building a New Jerusalem* (Yale) | T1 | no | first batch |
| `tokugawa-state-shinto-buddhism-regulation` | Japan, 1603–1868 | Hardacre 2017 *Shinto: A History* (Oxford); Bodart-Bailey 2006 *The Dog Shogun* (Hawai'i) | T1 | no | first batch — distinguish from Meiji State Shinto |
| `spanish-inquisition-as-statecraft` | Spain, 1478–1834 | Kamen 2014 *The Spanish Inquisition* (Yale, 4th ed.) | T1 | no | first batch |
| `divine-right-of-kings` | Europe, ~16th–18th c. | Burgess 1996 *Absolute Monarchy and the Stuart Constitution* (Yale) | T1 | no | first batch |

### 3.4 Modern (1800–)

#### Secularism + state-religion-relation types

| Slug | Region / period | Primary source | Tier | Risk-flag | Priority |
|---|---|---|---|---|---|
| `french-laicite` | France, 1905 + 1989+ | Bowen 2007 *Why the French Don't Like Headscarves* (Princeton); Kuru 2009 *Secularism and State Policies* (Cambridge) | T1 | no | first batch |
| `turkish-laiklik-ataturk` | Turkey, 1923+ | Kuru 2009; Berkes 1964 *The Development of Secularism in Turkey* (McGill) | T1 | no | first batch |
| `indian-secularism-bhargava` | India, 1950+ | Bhargava 1998 *Secularism and Its Critics* (Oxford India); Madan 1997 *Modern Myths, Locked Minds* (Oxford India) | T1 | no | first batch |
| `us-establishment-clause-passive-secularism` | US, 1789+ | Witte 2005 *Religion and the American Constitutional Experiment* (Westview); Kuru 2009 | T1 | no | first batch |
| `state-atheism-soviet` | USSR, 1917–1991 | Husband 2000 *Godless Communists* (Northern Illinois) | T1 | no | first batch |
| `state-atheism-maoist-china` | China, 1949–1976 + post-1976 | Goossaert/Palmer 2011 *The Religious Question in Modern China* (Chicago) | T1 | no | first batch |

#### Religious-nationalism / political-Islam / political-Hinduism / political-Buddhism

| Slug | Region / period | Primary source | Tier | Risk-flag | Priority |
|---|---|---|---|---|---|
| `hindutva` | India, 1923+ | Jaffrelot 1996 *The Hindu Nationalist Movement in India* (Columbia); Jaffrelot ed. 2007 *Hindu Nationalism: A Reader* (Princeton); Jaffrelot 2021 *Modi's India* (Princeton) | T1 | **YES** | **first batch — anchor node with extensive risk-flag treatment** |
| `tamil-dravidian-secularism` | Tamil Nadu, 1916+ (Self-Respect / DK / DMK) | Pandian 2007 *Brahmin and Non-Brahmin* (Permanent Black) | T1 | no | first batch — pluralism balance to Hindutva |
| `buddhist-nationalism-sri-lanka` | Sri Lanka, 1956+ | Tambiah 1992 *Buddhism Betrayed?* (Chicago); DeVotta 2018 "Buddhist Majoritarianism" *Contemporary Buddhism* | T1 | **YES** | first batch |
| `buddhist-nationalism-myanmar` | Myanmar, 2010s+ | Walton 2016 *Buddhism, Politics and Political Thought in Myanmar* (Cambridge); Schonthal/Walton 2016 *Contemporary Buddhism* 17.1 | T1 | **YES** | first batch |
| `islamic-modernism-abduh-rida` | Egypt, 1880s+ | Hourani 1962 *Arabic Thought in the Liberal Age* (Cambridge); Kerr 1966 *Islamic Reform* (California) | T1 | no | first batch |
| `salafism` | Egypt / Saudi Arabia, late 19th c.+ | Lauziere 2016 *The Making of Salafism* (Columbia); Meijer ed. 2009 *Global Salafism* (Hurst) | T1 | no | first batch |
| `wahabism-saudi-state` | Najd / Saudi Arabia, 1744+ + 1932+ | Commins 2006 *The Wahhabi Mission and Saudi Arabia* (I.B. Tauris); Bsheer 2020 *Archive Wars* (Stanford) | T1 | partial — flag only the radicalization-export reception per Commins | first batch |
| `muslim-brotherhood` | Egypt, 1928+ | Mitchell 1969 *The Society of the Muslim Brothers* (Oxford); Wickham 2013 *The Muslim Brotherhood* (Princeton) | T1 | no (T1 academic-political-organization; reception varies) | first batch |
| `qutbism-pan-islamism` | Egypt, 1950s+ | Euben 1999 *Enemy in the Mirror* (Princeton); Calvert 2010 *Sayyid Qutb and the Origins of Radical Islamism* (Columbia) | T1 | **YES** — Qutb's *Milestones* is foundational text for jihadist movements per Calvert | first batch |
| `khomeinism-velayat-e-faqih` | Iran, 1970+ → 1979+ | Arjomand 1988 *The Shadow of God and the Hidden Imam* (Chicago); Mavani 2013 *Religious Authority and Political Thought in Twelver Shi'ism* (Routledge); Adib-Moghaddam ed. 2014 *A Critical Introduction to Khomeini* (Cambridge) | T1 | partial — Iran-state reception flag | first batch |
| `iranian-reformist-shia-soroush-shabestari` | Iran, 1990s+ | Sadri/Sadri eds. 2000 *Reason, Freedom, and Democracy in Islam: Essential Writings of Abdolkarim Soroush* (Oxford); Vahdat 2003 *God and Juggernaut* (Syracuse) | T1 | no | first batch — pluralism balance to Khomeinism |
| `russian-orthodox-imperialism` | Russia, 1990s+ / intensified 2014+ | Stoeckl ed. 2017 *Political Theologies in Orthodox Christianity* (Continuum/Bloomsbury); Hovorun 2017 in same volume; Stoeckl 2014 *The Russian Orthodox Church and Human Rights* (Routledge); Knox 2005 *Russian Society and the Orthodox Church* (Routledge) | T1 | **YES** — documented Ukraine-war justification per Hovorun + Stoeckl | first batch |
| `christian-nationalism-us` | US, 20th c.+ / intensified post-2016 | Whitehead/Perry 2020 *Taking America Back for God* (Oxford); Gorski/Perry 2022 *The Flag and the Cross* (Oxford) | T1 | partial — civic-religion-overlap requires nuanced flag | first batch |
| `christian-reconstructionism-rushdoony` | US, 1973+ | Worthen 2008 "The Chalcedon Problem" *Church History*; Ingersoll 2015 *Building God's Kingdom* (Oxford); McVicar 2015 *Christian Reconstruction* (UNC) | T1 | **YES** — documented anti-democratic theonomy per Ingersoll, Worthen | first batch |
| `christian-identity` | US, 1940s+ | Barkun 1994/1997 *Religion and the Racist Right* (UNC) | T1 | **YES** — mandatory — white-supremacist + antisemitic per Barkun | first batch |
| `liberation-theology-latin-american` | Latin America, 1971+ | Gutiérrez 1971 *Teología de la liberación* (Sígueme); Rowland ed. 2007 *Cambridge Companion to Liberation Theology* (Cambridge) | T1 | no | first batch |
| `black-liberation-theology-cone` | US, 1969+ | Cone 1969 *Black Theology and Black Power* (Seabury); Cone 1970 *A Black Theology of Liberation* (Lippincott) | T1 | no | first batch |
| `womanist-theology` | US, 1980s+ | Williams 1993 *Sisters in the Wilderness* (Orbis); Cannon 1988 *Black Womanist Ethics* (Scholars Press) | T1 | no | first batch |
| `radical-orthodoxy-milbank` | UK, 1990s+ | Milbank 1990 *Theology and Social Theory* (Blackwell); Milbank/Pickstock/Ward eds. 1999 *Radical Orthodoxy* (Routledge) | T1 | no | first batch |
| `vatican-ii-political-theology` | Catholic Church, 1962–1965+ | O'Malley 2008 *What Happened at Vatican II* (Harvard) | T1 | no | first batch |
| `falun-gong` | China, 1992+ | Ownby 2008 *Falun Gong and the Future of China* (Oxford); Penny 2012 *The Religion of Falun Gong* (Chicago) | T1 | no | first batch — both PRC-persecution evidence AND in-movement-political-theology in scope |

#### T5 / disclaimer-required movement nodes

These get nodes under the always-collect-never-discard rule but render OFF by default per CODEX v1.1 §IV:

| Slug | Source | Tier | Risk-flag | Notes |
|---|---|---|---|---|
| `islamic-state-isis-political-theology` | Hashim Kamali on Islamic-jurisprudence rebuttals; Gerges 2016 *ISIS: A History* (Princeton); UN/ADL designations | T5 | YES (mandatory) | UN-designated terror organization. Wire ONLY via `polemic-against` / `polemic-inversion` edges. Cite Hashim Kamali + Bunzel 2015 *From Paper State to Caliphate* as Islamic-scholarly rebuttal |
| `julius-evola-traditionalist-political-theology` | Goodrick-Clarke 2002 *Black Sun* (NYU) + Hansen 2002 *Evola and the Conservative Revolution* | T5 | YES | Per CODEX example — formative for European neo-fascism |
| `theosophy-root-race-political-reception` | Goodrick-Clarke 1985 *The Occult Roots of Nazism* (Tauris) | T5 | YES | Specifically the 20th-century white-nationalist invocation of root-race material; core Theosophy stays T4 |

### 3.5 Trans-period concepts (no single date)

These are concept-type nodes — political-theological *ideas* that travel across periods:

| Slug | Source |
|---|---|
| `divine-right-of-kings` | Burgess 1996 (Yale) |
| `two-swords-doctrine` | Ullmann 1955 |
| `caesaropapism` | Dagron 2003 |
| `theocracy-as-typology` | Linz 2000 *Totalitarian and Authoritarian Regimes* (Lynne Rienner) |
| `theonomy` | Worthen 2008 |
| `dominionism` | Ingersoll 2015 |
| `theodemocracy` | Mason 2011 *Apostle of Union* (UNC) — LDS political-theology, useful for typology |
| `dīn-i-ilāhī` | Truschke 2017 |
| `preferential-option-for-the-poor` | Gutiérrez 1971; CELAM 1968 Medellín |

---

## 4. Critical neutrality discipline — the lens protocol

The politics lens is **the highest-risk lens in the vault for orthodoxy capture**. Every framework gets equal treatment OR the lens fails its mission. The protocol mirrors CODEX v1.1's posture, with three additional discipline rules specific to politics:

### Rule POL-1 — Symmetric pairing

Whenever a politically-loaded movement gets a node, the *opposing* political-theological position from within the same tradition ALSO gets a node in the same batch. The reader should never encounter Hindutva without Tamil-Dravidian secularism in the adjacent slot; Khomeinism without Soroush + Shabestari reformist-Shia; Christian Reconstructionism without Black Liberation Theology + Vatican II; Buddhist-nationalism without engaged-Buddhism (Thich Nhat Hanh, Sulak Sivaraksa).

### Rule POL-2 — Tier-discipline, not moral-discipline

Tiers are about **how well-attested the claim is**, not about whether we approve of the movement. ISIS is T5 because (a) it is a designated terror organization per UN/civil-rights documentation, AND (b) the academic treatment is well-established (Gerges, Bunzel) but small in volume relative to Khomeinism. Liberation Theology and Christian Reconstructionism are BOTH T1 — both have peer-reviewed academic-press monograph treatment (Cambridge Companion + Worthen *Church History*). One is a left-political-theology, one is a right-political-theology; the tier is identical. The reader sees which is which from the `notes:` field, not from a hidden weight.

### Rule POL-3 — `political-risk-flag` is a warning, not a judgment

The flag tells the reader: *this movement has documented downstream reception involving hate-speech / antisemitism / political violence / anti-democratic positions per peer-reviewed sources or recognized civil-rights documentation* (Barkun, ADL, Stoeckl, Walton). It does NOT mean the vault endorses any particular political evaluation. It means: when you click into this node, the `notes:` field will lead with the documented-political-risk citation, then state the movement's own self-understanding, then state the academic-evaluative position. The flag is the disclaimer machine extended to the political layer.

**The flag is set per peer-reviewed source — never per the agent's own political judgment.** If Walton 2016 documents that MaBaTha rhetoric correlates with anti-Muslim violence, MaBaTha gets the flag and Walton 2016 is the citation. If Worthen + Ingersoll document Reconstructionism's anti-democratic theonomy, it gets the flag and they are the citation. Without a peer-reviewed source documenting the risk, no flag.

### Examples of how the pluralism plays out

- **Hindutva (`political-risk-flag: true`)** is wired alongside **Tamil-Dravidian secularism (`political-risk-flag: false`)** — both per Jaffrelot + Pandian.
- **Khomeinism (`political-risk-flag: partial — Iran-state reception`)** is wired alongside **Iranian reformist Shia (Soroush, Shabestari) (`political-risk-flag: false`)** — both per Arjomand + Sadri.
- **Christian Reconstructionism (`political-risk-flag: true`)** is wired alongside **Black Liberation Theology (`political-risk-flag: false`)** AND **Radical Orthodoxy / Milbank (`political-risk-flag: false`)** — all three are T1.
- **Buddhist-nationalist Sri Lanka (`political-risk-flag: true`)** is wired alongside **engaged-Buddhism / Sulak Sivaraksa (`political-risk-flag: false`)** — both per Walton + Queen.
- **Russian Orthodox-Imperialism (`political-risk-flag: true`, post-2014 reception)** is wired alongside **Orthodox dissident voices (Hovorun himself, Berdyaev tradition) (`political-risk-flag: false`)** — both per Stoeckl.
- **ISIS (`political-risk-flag: true`, T5)** is wired only via polemic-edges, alongside the **Islamic-jurisprudence rebuttal corpus (Hashim Kamali, Yusuf al-Qaradawi-condemnation, Sufi-establishment rebuttals)** — all T1.

---

## 5. Cross-lens wiring — new fields on existing nodes

The lens REQUIRES four new YAML fields on existing-lens nodes. None overwrite existing data; all are optional-additive.

### 5.1 On `03_deities/` — new field `political-theology[]`

Pointer to political-theology-movements that have invoked the deity. Each entry: `slug` + `relation:` (one of: `invoked-by`, `patron-of`, `royal-legitimator`, `mobilized-in`, `polemic-target`).

Examples:
- `marduk` → `political-theology: [{slug: mesopotamian-sacred-kingship, relation: royal-legitimator}, {slug: babylonian-akitu-state-cult, relation: patron-of}]`
- `ram` → `political-theology: [{slug: hindutva, relation: mobilized-in}]` with `source-tier: T1` per Jaffrelot 1996 chs. 5–6 on the Ram-Janmabhumi mobilization
- `christ-pantokrator` → `political-theology: [{slug: byzantine-caesaropapism, relation: patron-of}, {slug: russian-orthodox-imperialism, relation: invoked-by}]`

### 5.2 On `07_traditions/` — new field `political-shape[]`

Pointer to state-relation-type nodes that the tradition has occupied. Multi-valued because traditions occupy DIFFERENT state-relations in different periods/regions.

Examples:
- `christianity-latin` → `political-shape: [{slug: constantinian-christianity, period: "312–476"}, {slug: two-swords-doctrine, period: "494–1500"}, {slug: concordat-system, period: "1648–present"}]`
- `islam-sunni` → `political-shape: [{slug: rashidun-caliphate-political-theology, period: "632–661"}, {slug: ottoman-caliphate, period: "1517–1924"}, {slug: wahabism-saudi-state, period: "1932–present"}, {slug: turkish-laiklik-ataturk, period: "1923–present"}]`
- `hinduism` → `political-shape: [{slug: ashokan-buddhist-statecraft, period: "268–232 BCE", note: "patron of Buddhism but extended toleration; comparison point"}, {slug: hindutva, period: "1923–present"}, {slug: indian-secularism-bhargava, period: "1950–present"}]`

### 5.3 On `04_persons/` — new field `political-role`

Single-valued tag describing the person's political-theological role-type (if any). Optional. One of:
- `state-establisher` (Constantine, Henry VIII, Atatürk, Khomeini)
- `political-theology-founder` (Schmitt, Gutiérrez, Rushdoony, Savarkar, Qutb)
- `political-theology-theorist` (Taylor, Casanova, Asad, Mahmood, Schmitt)
- `religious-reformer-with-political-impact` (Akbar, Luther, Calvin)
- `political-religious-dissident` (Soroush, Sulak Sivaraksa, Boff, Hovorun)

Cross-link: every person with `political-role:` set ALSO appears in the corresponding `30_politics/movements/` or `30_politics/thinkers/` node's `key-figures[]`.

### 5.4 On `06_themes/` — `category: "political-theological"` rows audit

The 47 existing themes carrying `category: "political-theological"` need a one-pass audit (separate batch, not blocking lens creation). For each: decide whether to (a) keep as cross-tradition motif in 06_themes (the broad pattern), (b) migrate to 30_politics (the specific named movement/concept), or (c) split into both. The four likely-migrations from the sample I read:

| Current location | Action |
|---|---|
| `06_themes/civic-religion.md` | Keep + add cross-link to new `30_politics/state-relations/civic-religion.md` (the typology-node) — the motif and the type are different |
| `06_themes/divine-kingship.md` | Keep as theme + split off per-region instances to `30_politics/movements/` (egyptian-pharaonic-divine-kingship, mesopotamian-sacred-kingship, mandate-of-heaven-tianming) |
| `06_themes/fifth-empire-quinto-imperio.md` | Probably split — the *theme* stays in 06; the *Sebastianist political-theological movement* belongs in 30 |
| `06_themes/prophet-and-king.md` | Keep as theme; political-theology-of-prophet-king instantiations live in 30 |

---

## 6. Forge integration

### 6.1 New wedge

If the lens lands with 50+ nodes (which the §3 catalog projects), it earns a **Politics wedge on the Forge wheel**. Position: tail of the 7-bucket layout, adjacent to Theology + Themes. The wedge color borrows the existing **state-cult / civic-religion bronze** hint visible in current Forge color-themes (cross-check with `src/js/forge/themes.js` before locking).

### 6.2 New color theme: "Political shape"

Per CODEX v1.1's tier-toggle pattern, add a new Forge color-theme that paints each tradition by its **dominant political-shape**. Palette (proposed, John's veto-able):

| Political-shape | Color (hex) | Rationale |
|---|---|---|
| Theocracy / clerical-rule | gold `#D4A55A` | Already the attestation-bucket color in current Forge palette; gold = consecrated authority |
| Caesaropapism | imperial-purple `#6E3D7D` | Byzantine convention |
| Establishment | sage-green `#7A9A6B` | Anglican / Lutheran "settled" color tradition |
| Civic religion | bronze `#A47A4A` | Roman *religio publica* bronze-vessel convention |
| Assertive secularism | French-blue `#3A6FA8` | Laïcité-French convention |
| Passive secularism | sky-blue `#7AA5C9` | US Establishment Clause neutral-blue |
| Religious nationalism | deep-red `#A8443A` | Hindutva-saffron-adjacent; signals the fusion-of-faith-and-nation polemic color |
| Liberation political-theology | leaf-green `#5A9A4A` | Liberation-theology green per CELAM iconography |
| State atheism | slate-grey `#5A5A5A` | Soviet-Maoist symbolic-grey |
| Mixed / multi-shape (default fallback) | warm-grey `#9A8A7A` | For traditions occupying multiple shapes across history |

Same toggle-UX as tier-toggle: user picks "Political shape" from the color-theme dropdown; the Forge re-paints with these colors; legend panel renders the key.

### 6.3 Tier-toggle interaction

The existing 5-tier source-toggle (T1–T5) ALSO applies in the politics lens. T5 movement-nodes (ISIS, Evola-political-theology, root-race-Nazi-reception) stay OFF by default. When user toggles T5 ON, those nodes render with the mandatory political-risk caveat in their tooltip.

---

## 7. Build-script + viewer touchpoints

| File | Change |
|---|---|
| `build_data.py` | Add `political-theology-movement`, `political-theology-concept`, `religion-state-relation-type`, `political-theology-thinker` to `NODE_TYPE_MAP` — each routes to `30_politics/<sub-folder>/` |
| `build_data.py` | Add new field handlers: `political-theology[]` (on deities) + `political-shape[]` (on traditions) + `political-role` (on persons) — edge-bucket routing (probably Association for soft-link rows; Polemic when relation indicates polemic-target) |
| `00_meta/CODEX.md` | No change — CODEX v1.1 already accommodates this lens via the `political-risk-flag: true` + T5 protocols already in §IV |
| `00_meta/ONTOLOGY.md` | Add row 30 (or 31) to the 29-lens table; cite this audit in the lock-rationale |
| `00_meta/PROTOCOL.md` | Add a politics-lens section to the bucket-routing table — most new fields route to Association unless `relation:` specifies otherwise |
| `00_meta/ONTOLOGY-RATIONALE-2026-05-23-politics.md` | New dated rationale doc per the lock procedure (append-only; never edit existing rationale docs per memory) |
| `src/js/forge/themes.js` (if exists) | Add `political-shape` color theme |
| `src/js/views/forge.js` | Add Politics wedge to wheel layout if node count ≥50 |
| `index.html` Legend panel | Add new color-theme to the dropdown |

---

## 8. Risk + scope reckoning

This lens is HARD to design well and EASY to design badly. Three explicit risks:

### R-1 — Lens-creep from "this is political" → "everything is political"
Every religious tradition has political dimensions. The lens is NOT a tag for "religion-with-political-content"; it is for **named political-theological movements / concepts / state-relation types / thinkers** per the academic-field's own delimitation. If a candidate node doesn't fit one of the four sub-types, it doesn't belong here. **Test:** if you can't name a peer-reviewed academic monograph that treats the entity as a political-theological subject, the candidate fails the bar.

### R-2 — Asymmetric coverage
The vault's existing material is Abrahamic-heavy. The politics lens MUST balance — every batch needs proportional coverage of political-Hinduism, political-Buddhism, political-Confucianism, political-Daoism, political-traditional-religions (African religious nationalism — Yoruba ethno-religious politics — under-covered in vault). Symmetric pairing rule (POL-1) helps but doesn't substitute for proportional batches.

### R-3 — Drift into advocacy
The hardest discipline in the lens: every wire is a citation, every flag traces to a published source, every movement gets pluralism-pairing. The agent's job is documenting what scholarship documents — not what the agent thinks about the movement. A useful self-check: *would I write this same wire if my politics were inverted?* If yes, the wire is in the right place. If the wire's `notes:` field expresses an evaluation the agent endorses but no scholarship cites, the wire is in the wrong place.

CODEX v1.1's posture statement ("the vault is an investigation tool, not an advocacy site") is the discipline rule. The politics lens is where that posture earns its keep.

---

## 9. Action checklist — John's greenlight / veto

For each, John picks: **GREEN** (proceed) / **AMBER** (modify per note) / **RED** (don't do this).

| # | Decision | John's call |
|---|---|---|
| 1 | Create the politics lens at slot 30 (or wherever after geometry lens resolves) | ☐ |
| 2 | Four-sub-folder structure (`movements/`, `concepts/`, `state-relations/`, `thinkers/`) | ☐ |
| 3 | Distinct node sub-types per §2 (`political-theology-movement`, `political-theology-concept`, `religion-state-relation-type`, `political-theology-thinker`) | ☐ |
| 4 | First-batch catalog of ~50 nodes per §3 (ancient + medieval + early-modern + modern) | ☐ |
| 5 | Cross-lens new fields per §5: `political-theology[]` on deities, `political-shape[]` on traditions, `political-role` on persons | ☐ |
| 6 | Audit pass on the 47 existing `category: "political-theological"` themes per §5.4 — separate batch | ☐ |
| 7 | `political-risk-flag: true` mandatory on movements listed in §3 (Hindutva, Christian Identity, Reconstructionism, Russian-Orthodox-Imperialism, Buddhist-nationalisms, Qutbism, ISIS, Evola-political) | ☐ |
| 8 | T5 protocol applied to ISIS, Evola-political-theology, root-race political reception (hidden-by-default + polemic-edges-only) | ☐ |
| 9 | Symmetric-pairing rule POL-1 enforced (every flagged movement gets its same-tradition opposing-movement node in the same batch) | ☐ |
| 10 | New Forge color-theme "Political shape" with 10-color palette per §6.2 | ☐ |
| 11 | Politics wedge on Forge wheel once node count ≥50 | ☐ |
| 12 | Build-script + ONTOLOGY.md + PROTOCOL.md + new dated rationale doc per §7 | ☐ |
| 13 | Companion doc `AUDIT/political-theology-key-figures-2026-05-23.md` for the ~30-50 thinkers (filed alongside this spec) | ☐ |

---

## 10. References (peer-reviewed anchor list)

The political-theology canon used to construct this lens. Full per-figure citations live in the companion doc; this is the pruned anchor list.

**Foundational + survey:**
- Schmitt, Carl. 1922 [1985]. *Political Theology: Four Chapters on the Concept of Sovereignty*. Trans. G. Schwab. MIT Press.
- Taylor, Charles. 2007. *A Secular Age*. Harvard / Belknap.
- Casanova, José. 1994. *Public Religions in the Modern World*. Chicago.
- Asad, Talal. 1993. *Genealogies of Religion*. Johns Hopkins. + Asad 2003. *Formations of the Secular*. Stanford.
- Mahmood, Saba. 2005. *Politics of Piety*. Princeton.
- Lilla, Mark. 2007. *The Stillborn God*. Knopf.
- Connolly, William. 1999. *Why I Am Not a Secularist*. Minnesota.
- Flohr, Mikkel. 2025. "Political Theology: Origins, Concepts, and Contradictions." *Theory, Culture & Society* (Sage; advance online).

**Comparative-secularism:**
- Kuru, Ahmet T. 2007. "Passive and Assertive Secularism." *World Politics* 59.4. + Kuru 2009 *Secularism and State Policies* (Cambridge).
- Bhargava, Rajeev (ed.). 1998. *Secularism and Its Critics*. Oxford India.
- Bowen, John. 2007. *Why the French Don't Like Headscarves*. Princeton.

**Region-specific anchors:**
- Frankfort 1948 *Kingship and the Gods* (Chicago) — ancient Near Eastern divine kingship.
- Pines 2023 "The Elusive Mandate of Heaven" *T'oung Pao* 109.
- Drake 2000 *Constantine and the Bishops* (Johns Hopkins); Van Dam 2007 *Roman Revolution of Constantine* (Cambridge).
- Crone & Hinds 1986 *God's Caliph* (Cambridge); Madelung 1997 *The Succession to Muhammad* (Cambridge).
- Jaffrelot 1996 *The Hindu Nationalist Movement in India* (Columbia); Jaffrelot 2021 *Modi's India* (Princeton).
- Tambiah 1992 *Buddhism Betrayed?* (Chicago); Walton 2016 *Buddhism, Politics and Political Thought in Myanmar* (Cambridge).
- Arjomand 1988 *The Shadow of God and the Hidden Imam* (Chicago); Adib-Moghaddam ed. 2014 *A Critical Introduction to Khomeini* (Cambridge).
- Euben 1999 *Enemy in the Mirror* (Princeton); Calvert 2010 *Sayyid Qutb* (Columbia).
- Stoeckl ed. 2017 *Political Theologies in Orthodox Christianity* (Bloomsbury/Continuum).
- Barkun 1994 *Religion and the Racist Right* (UNC).
- Worthen 2008 "The Chalcedon Problem" *Church History*; Ingersoll 2015 *Building God's Kingdom* (Oxford); McVicar 2015 *Christian Reconstruction* (UNC).
- Rowland ed. 2007 *Cambridge Companion to Liberation Theology* (Cambridge); Cone 1970 *A Black Theology of Liberation*.
- Whitehead & Perry 2020 *Taking America Back for God* (Oxford); Gorski & Perry 2022 *The Flag and the Cross* (Oxford).

**Risk-flag civil-rights / political-history sources (mandatory citation per CODEX §IV T5):**
- Barkun 1994 (Christian Identity).
- Goodrick-Clarke 1985 *Occult Roots of Nazism* (Tauris) + Goodrick-Clarke 2002 *Black Sun* (NYU) — Evola, root-race reception.
- ADL (Anti-Defamation League) extremism database — Icke, Christian Identity, white-nationalist political-theologies.
- Hope Not Hate (UK) — political-extremism documentation.
- Hovorun 2017 + Stoeckl 2014/2017 — Russian Orthodox-imperialism.

---

*End of spec. Filed alongside `AUDIT/political-theology-key-figures-2026-05-23.md` (companion thinkers catalog). Both await John's greenlight before any node creation.*
