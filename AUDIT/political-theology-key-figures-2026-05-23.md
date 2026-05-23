# Political-Theology Key Figures — canonical thinkers inventory

**Date:** 2026-05-23
**Handle:** opus-politics-lens-spec-1 (companion doc to `AUDIT/politics-lens-spec-2026-05-23.md`)
**Status:** PROPOSAL — awaiting John's greenlight/veto. READ-ONLY scoping document.

This is the inventory of the ~50 canonical political-theology FIGURES the lens needs. Each gets a person-node in `04_persons/` (already the convention) AND a thinker-node in `30_politics/thinkers/<slug>.md` (proposed). The two are cross-linked: the person-node carries biography; the thinker-node carries the political-theological argument with primary-text + tier + risk-flag + claim summary.

Per the parent spec POL-1 (symmetric pairing), the catalog is organized by **position-type**, not chronologically — every left-tradition thinker has a same-tradition right-tradition counterpart, every radical has a moderate, every theorist has a critic. The reader who arrives at this lens via Carl Schmitt should not leave without seeing Talal Asad's critique of Schmitt; the reader arriving via Khomeini should leave seeing Soroush.

**Field key:**
- **Slug** — kebab-case canonical id
- **Work** — main political-theology primary text (most commonly cited)
- **Tier** — per CODEX v1.1 (T1 mainstream / T2 minority / T3 alternative / T4 popular-rejected / T5 disclaimer-required)
- **Risk** — `political-risk-flag: true/false/partial` per peer-reviewed civil-rights or political-history source
- **Source** — peer-reviewed academic anchor citing the figure as a political-theology subject
- **Claim** — 1-line summary of the political-theological position
- **Include** — `first-batch` / `stub` / `later-wave` / `T5-opt-in`

---

## §1. The foundational canon (German + French + Anglophone, 20th c.)

The discipline's own founders. Without these, "political theology" as a field doesn't exist as a named subject.

| Slug | Work | Tier | Risk | Source | Claim | Include |
|---|---|---|---|---|---|---|
| `carl-schmitt-thinker` | *Politische Theologie* 1922; *Der Begriff des Politischen* 1932 | T1 | **partial** — Nazi-party affiliation 1933+; per Bendersky 1983 *Carl Schmitt: Theorist for the Reich* (Princeton) + Mehring 2014 *Carl Schmitt: A Biography* (Polity); engagement requires citing this | Oxford Handbook of Carl Schmitt (2016); MIT Press *Political Theology* (Schwab trans. 1985) | "Sovereign is he who decides on the exception." Modern state-concepts are secularized theological concepts. The field's foundational thesis. | first-batch — anchor node; flag mandatory |
| `walter-benjamin-thinker` | *On the Concept of History* 1940 (theses on the Angel of History + messianic time) | T1 | no | Wolin 1994 *Walter Benjamin: An Aesthetic of Redemption* (California); Jacobson 2003 *Metaphysics of the Profane* (Columbia) | Schmitt's opposite-number — political theology as messianic-revolutionary, not sovereign-decisionist. Direct correspondent with Schmitt; the Schmitt-Benjamin axis IS the field's founding debate. | first-batch — symmetric pair to Schmitt |
| `jacob-taubes-thinker` | *The Political Theology of Paul* 1987 [posthumous] | T1 | no | Stanford UP 2004 translation; Gold 2010 *Aesthetics and Politics* (Stanford) | Pauline theology as the deep grammar of European political theology; Schmitt's interlocutor in the late 1970s. | first-batch |
| `karl-barth-thinker` | *Barmen Declaration* 1934; *Church Dogmatics* II/2 | T1 | no | Busch 2004 *The Great Passion* (Eerdmans); Hunsinger 2000 *Disruptive Grace* (Eerdmans) | Confessing-Church anti-Nazi political theology; the church recognizes no Führer alongside Christ. Schmitt's theological opposite during 1933+. | first-batch |
| `reinhold-niebuhr-thinker` | *The Irony of American History* 1952; *Moral Man and Immoral Society* 1932 | T1 | no | Brown ed. 1986 *The Essential Reinhold Niebuhr* (Yale); Gilkey 2001 *On Niebuhr* (Chicago) | Christian-realist political theology; the irony of American innocence. Anchor of post-WWII liberal political-theology. | first-batch |
| `dietrich-bonhoeffer-thinker` | *Ethics* 1949 [posthumous]; *Letters and Papers from Prison* 1951 | T1 | no | Marsh 2014 *Strange Glory: A Life of Dietrich Bonhoeffer* (Knopf); De Gruchy ed. 1999 *Cambridge Companion to Bonhoeffer* (Cambridge) | "Religionless Christianity"; the confessing-church under tyranny; martyrdom as political-theological act. | first-batch |
| `jacques-maritain-thinker` | *Integral Humanism* 1936; *Man and the State* 1951 | T1 | no | Princeton UP (UN-Declaration-of-Human-Rights drafting context); Doering 1983 *Jacques Maritain and the French Catholic Intellectuals* (Notre Dame) | Catholic-personalist political theology; pluralist Christian democracy. Drafted the philosophical preamble to the 1948 UDHR. | first-batch |

---

## §2. Late-20th c. secularization / post-secular theorists

The figures who reframed the field from "religion-in-politics" to "the secular as itself a political-theological formation."

| Slug | Work | Tier | Risk | Source | Claim | Include |
|---|---|---|---|---|---|---|
| `charles-taylor-thinker` | *A Secular Age* 2007; *Sources of the Self* 1989 | T1 | no | Belknap/Harvard; Smith 2014 *How (Not) To Be Secular* (Eerdmans) | The "subtraction story" of secularization is wrong; secular modernity is a new positive moral order with its own background-conditions of belief. | first-batch — anchor node |
| `jose-casanova-thinker` | *Public Religions in the Modern World* 1994 | T1 | no | Chicago UP; Calhoun/Juergensmeyer/Van Antwerpen eds. 2011 *Rethinking Secularism* (Oxford) | Religion has not privatized; public religion is a real and durable form. Deprivatization thesis. | first-batch |
| `talal-asad-thinker` | *Genealogies of Religion* 1993; *Formations of the Secular* 2003 | T1 | no | Johns Hopkins; Stanford; *Political Theology Network* | "Religion" itself is a category produced by post-Reformation Christian-state formations; the secular is a configuration of power that *produces* the religious as its other. Foucauldian genealogy turned on secularism. | first-batch — anchor node |
| `saba-mahmood-thinker` | *Politics of Piety* 2005; *Religious Difference in a Secular Age* 2015 | T1 | no | Princeton UP; California UP; her *Politics of Piety* won the Victoria Schuck Award (APSA) | Egyptian women's piety movements undo the secular-liberal opposition of agency vs submission; minority-rights frameworks in secular-majority states. | first-batch |
| `mark-lilla-thinker` | *The Stillborn God* 2007; *The Reckless Mind* 2001 | T1 | no | Knopf; New York Review of Books | "The Great Separation" of theology from politics (Hobbes onwards) is an unstable achievement; political theology returns. | first-batch |
| `william-connolly-thinker` | *Why I Am Not a Secularist* 1999; *Capitalism and Christianity, American Style* 2008 | T1 | no | Minnesota UP; Duke UP | Secularism is itself a religious-political formation; pluralism requires recognizing that. | first-batch |
| `judith-butler-thinker` | *Parting Ways: Jewishness and the Critique of Zionism* 2012 | T1 | no | Columbia UP; Critchley 2012 *The Faith of the Faithless* (Verso, engages Butler) | Diasporic-Jewish political theology against ethno-state nationalism; Levinasian + Arendtian roots. | first-batch |

---

## §3. Christian political theology — the post-WWII spectrum

Six thinkers covering the full Christian political-theological spectrum from radical-left (Cone) through center (Niebuhr — already in §1) through Radical Orthodoxy center-right (Milbank) through Reconstructionist far-right (Rushdoony). All T1 — academic-press treatment for all six.

| Slug | Work | Tier | Risk | Source | Claim | Include |
|---|---|---|---|---|---|---|
| `gustavo-gutierrez-thinker` | *Teología de la liberación* 1971 [English 1973 Orbis] | T1 | no | Rowland ed. 2007 *Cambridge Companion to Liberation Theology* (Cambridge); McGovern 1989 *Liberation Theology and Its Critics* (Orbis) | Preferential option for the poor; theology done from "the underside of history"; Marxist analysis as methodological tool for Christian theology. | first-batch — anchor of Liberation Theology |
| `leonardo-boff-thinker` | *Church: Charism and Power* 1981 [English 1985 Crossroad] | T1 | no | Cambridge Companion 2007; Boff/Boff 1987 *Introducing Liberation Theology* (Orbis) | Ecclesiology-from-below; base ecclesial communities as authentic church; silenced by CDF in 1985. | first-batch |
| `james-cone-thinker` | *Black Theology and Black Power* 1969; *A Black Theology of Liberation* 1970; *The Cross and the Lynching Tree* 2011 | T1 | no | Cone's faculty page Union Theological Seminary; Carter 2008 *Race: A Theological Account* (Oxford) cites as foundational | God is on the side of the oppressed; Black Power as theological category; the lynching tree as American cross. | first-batch — anchor of Black Liberation Theology |
| `delores-williams-thinker` | *Sisters in the Wilderness* 1993 | T1 | no | Orbis Books; Townes ed. 1993 *A Troubling in My Soul* (Orbis) | Womanist theology; Hagar (not Exodus) as paradigmatic biblical narrative; surrogacy + survival hermeneutic; critique of atonement-theology's surrogacy. | first-batch |
| `stanley-hauerwas-thinker` | *The Peaceable Kingdom* 1983; *Resident Aliens* (with Willimon) 1989 | T1 | no | Notre Dame UP; Cambridge Companion to Christian Ethics (2001) | Anabaptist-pacifist political theology; the church as polis distinct from the nation-state; "Constantinianism" as the central error. | first-batch |
| `john-milbank-thinker` | *Theology and Social Theory* 1990; *Beyond Secular Order* 2013 | T1 | no | Blackwell; Wiley-Blackwell; Cunningham/Candler eds. 2007 *Belief and Metaphysics* (SCM, Radical Orthodoxy series) | Radical Orthodoxy — secular reason is itself a heresy from Christian metaphysics; pre-modern Christian metaphysical realism as alternative to nihilism. | first-batch |
| `rousas-john-rushdoony-thinker` | *The Institutes of Biblical Law* 1973 | T1 (academic treatment) | **YES** | Worthen 2008 "The Chalcedon Problem" *Church History*; Ingersoll 2015 *Building God's Kingdom* (Oxford); McVicar 2015 *Christian Reconstruction* (UNC) | Christian Reconstructionism / theonomy — Mosaic law as binding civil law; postmillennial dominionism. Founding text of the Reconstructionist movement. | first-batch — flag mandatory per Ingersoll + Worthen documenting anti-democratic theonomy |
| `gary-north-thinker` | *Political Polytheism* 1989; *The Sinai Strategy* 1986 | T1 (academic treatment) | **YES** | Ingersoll 2015; McVicar 2015 | Rushdoony's son-in-law; Reconstructionism's most prolific publisher; explicit theocracy advocacy. | stub — secondary to Rushdoony in first batch |
| `dorothy-day-thinker` | *The Long Loneliness* 1952 | T1 | no | Forest 1986 *Love Is the Measure* (Paulist); Marquette Day archive | Catholic Worker movement; pacifist + anarcho-distributist political theology; cause for canonization opened 2000. | first-batch |
| `cornel-west-thinker` | *Prophesy Deliverance!* 1982; *Race Matters* 1993 | T1 | no | Westminster Press; Beacon Press; Wood ed. 2013 *Cornel West: A Critical Reader* (Routledge) | Prophetic-Christian + Black-radical political theology; democratic socialism + Christian witness. | first-batch |

---

## §4. Islamic political theology — the modern spectrum

Eight figures covering the modernist-reformist to Salafi-political to revolutionary-Shia to liberal-Islamic spectrum. Mandatory symmetric pairing per POL-1.

| Slug | Work | Tier | Risk | Source | Claim | Include |
|---|---|---|---|---|---|---|
| `muhammad-abduh-thinker` | *Risālat al-Tawḥīd* 1897 | T1 | no | Hourani 1962 *Arabic Thought in the Liberal Age* (Cambridge); Adams 1933 *Islam and Modernism in Egypt* (Russell) | Islamic Modernism's founder; reason + revelation compatible; *ijtihad* reopened; against blind *taqlīd*. | first-batch |
| `rashid-rida-thinker` | *al-Khilāfa aw al-Imāma al-ʿUẓmā* 1922–23 | T1 | no | Hourani 1962; Kerr 1966 *Islamic Reform* (California) | Abduh's student; later turn toward Salafism; the bridge from Islamic Modernism to early-Salafi political-theology. | first-batch |
| `sayyid-qutb-thinker` | *Maʿālim fī al-Ṭarīq* (*Milestones*) 1964; *Fī Ẓilāl al-Qurʾān* 1951–66 | T1 | **YES** | Euben 1999 *Enemy in the Mirror* (Princeton); Calvert 2010 *Sayyid Qutb and the Origins of Radical Islamism* (Columbia); APSR article on Qutb's political theory | *Jāhiliyya* (pre-Islamic ignorance) applies to modern Muslim societies; Islamic vanguardism; sovereignty (*ḥākimiyya*) belongs only to God. Foundational text for many jihadist movements per Calvert; engaged critically by Euben as serious political-theory subject. | first-batch — flag mandatory per Calvert + UN designation reception |
| `hasan-al-banna-thinker` | *Risālat al-Taʿālīm* 1938 + collected epistles | T1 | partial | Mitchell 1969 *The Society of the Muslim Brothers* (Oxford); Wickham 2013 *The Muslim Brotherhood* (Princeton) | Muslim Brotherhood founder; gradualist Islamization through education + social services + politics. Brotherhood itself is academically T1 mainstream political-organization; reception varies by country. | first-batch |
| `ali-shariati-thinker` | *Religion vs Religion*; *Marxism and Other Western Fallacies* 1980 [collected] | T1 | no | Rahnema 1998 *An Islamic Utopian: A Political Biography of Ali Shariati* (I.B. Tauris); Mottahedeh 1985 *The Mantle of the Prophet* (Pantheon) | "Red Shiism" — Shia-Islamic liberation theology; pre-1979 Iranian Revolutionary intellectual; Hosayn (Karbala) as revolutionary archetype. Counter-pair to Khomeini's clerical model. | first-batch |
| `ruhollah-khomeini-thinker` | *Velāyat-e Faqīh: Ḥukūmat-e Islāmī* 1970 (Najaf lectures); *Kashf al-Asrār* 1944 | T1 | partial | Arjomand 1988 *The Shadow of God and the Hidden Imam* (Chicago); Mavani 2013 *Religious Authority and Political Thought in Twelver Shiʿism* (Routledge); Adib-Moghaddam ed. 2014 *A Critical Introduction to Khomeini* (Cambridge); Hamid Algar's translation *Islam and Revolution* 1981 | *Velāyat-e faqīh* — guardianship of the Islamic Jurist; clerical rule as the legitimate form of government during the Hidden Imam's occultation. The post-1979 Iranian Constitution's political-theological basis. | first-batch — flag partial per documented Iran-state human-rights reception |
| `abdolkarim-soroush-thinker` | *The Hermeneutic Expansion and Contraction of Religious Knowledge* 1990; collected essays | T1 | no | Sadri/Sadri eds. 2000 *Reason, Freedom, and Democracy in Islam* (Oxford); Vahdat 2003 *God and Juggernaut* (Syracuse) | Religious knowledge is historical + plural; distinction between religion (Dīn) and religious-knowledge (maʿrifa-yi dīnī); democratic-religious-society theory. **Symmetric pair to Khomeinism.** | first-batch |
| `mohammad-mojtahed-shabestari-thinker` | *Hermeneutik, Buch und Tradition* 1996; *Naqdī bar Qirāʾat-i Rasmī az Dīn* 2000 | T1 | no | Vahdat 2003; Amirpur 2015 *New Thinking in Islam* (Gingko) | Hermeneutical-pluralist Shia thought; critique of the "official reading" of religion; symmetric pair to Khomeini. | first-batch |
| `mohammed-arkoun-thinker` | *Lectures du Coran* 1982; *Rethinking Islam* 1994 | T1 | no | Westview; Robinson 1995 review *Bulletin of SOAS*; the Arkoun-school continues at IRCICA + Sorbonne | "Applied Islamology" — critical-historical hermeneutics applied to Islamic political tradition; deconstruction of "the thinkable, the unthinkable, the not-yet-thought." | first-batch |
| `tariq-ramadan-thinker` | *Western Muslims and the Future of Islam* 2004 | T1 (academic-political-theology treatment) | partial | March 2009 *Islam and Liberal Citizenship* (Oxford) | European-Muslim integrationist political theology; "shahāda" (witness) in plural societies. **Note for risk-treatment**: Ramadan's 2017 sexual-assault arrest + 2024 conviction (subsequently appealed) is a biographical fact carried in `04_persons/`; his political-theology work remains academically engaged. Cite both. | first-batch — biographical context required in `notes:` |

### T5 Islamic political-theology nodes

| Slug | Source | Tier | Risk | Notes |
|---|---|---|---|---|
| `abu-bakr-al-baghdadi-thinker` | Bunzel 2015 *From Paper State to Caliphate* (Brookings); Gerges 2016 *ISIS: A History* (Princeton) | T5 | YES mandatory | ISIS caliphate-political-theology; wired only via polemic-edges; Islamic-jurisprudence rebuttal corpus (Hashim Kamali, al-Qaradawi-condemnation, the 2014 "Letter to Baghdadi" signed by 126 Sunni scholars) cited in `notes:` |

---

## §5. Hindu / Sikh political theology

| Slug | Work | Tier | Risk | Source | Claim | Include |
|---|---|---|---|---|---|---|
| `vinayak-damodar-savarkar-thinker` | *Hindutva: Who Is a Hindu?* 1923 | T1 | **YES** | Jaffrelot 1996 *The Hindu Nationalist Movement in India* (Columbia); Bakhle 2024 *Savarkar and the Making of Hindutva* (Princeton) | Hindutva's founding text; Hindu as ethnonational + religious category; pitr-bhumi + punya-bhumi (fatherland + holyland) test. | first-batch — flag mandatory per Jaffrelot ch.5+ on documented downstream violence |
| `madhav-sadashiv-golwalkar-thinker` | *We, or Our Nationhood Defined* 1939; *Bunch of Thoughts* 1966 | T1 | **YES** | Jaffrelot 1996; Sharma 2007 *Terrifying Vision: M.S. Golwalkar, the RSS and India* (Penguin) | RSS *sarsanghchalak* 1940–73; explicit ethnic-nationalist political theology; documented invocations of European fascism per Jaffrelot. | first-batch — flag mandatory |
| `mahatma-gandhi-thinker` | *Hind Swaraj* 1909; *An Autobiography* 1927; collected *Young India* + *Harijan* writings | T1 | no | Parekh 1989 *Gandhi's Political Philosophy* (Notre Dame); Brown 1989 *Gandhi: Prisoner of Hope* (Yale) | Satyāgraha as political-theological method; ahimsa as politics; Hindu universalism as anti-colonial framework. **Symmetric pair to Savarkar/Golwalkar Hindutva.** | first-batch |
| `b-r-ambedkar-thinker` | *Annihilation of Caste* 1936; *The Buddha and His Dhamma* 1957 | T1 | no | Omvedt 2008 *Ambedkar: Towards an Enlightened India* (Penguin); Jaffrelot 2005 *Dr Ambedkar and Untouchability* (Columbia) | Dalit political theology; Buddhist conversion as political-religious act; Hindu social order as untouchability-producing structure to be exited. Symmetric pair to Hindutva from below. | first-batch |
| `e-v-ramasamy-periyar-thinker` | *True Ramayana* 1944; collected speeches | T1 | no | Pandian 2007 *Brahmin and Non-Brahmin: Genealogies of the Tamil Political Present* (Permanent Black); Geetha/Rajadurai 1998 *Towards a Non-Brahmin Millennium* (Samya) | Tamil Self-Respect Movement; anti-Brahmin political-religious critique; Tamil-Dravidian-secularist symmetric pair to Hindutva. | first-batch |
| `rabindranath-tagore-thinker` | *Nationalism* 1917; *The Religion of Man* 1931 | T1 | no | Hay 1970 *Asian Ideas of East and West: Tagore and His Critics in Japan, China, and India* (Harvard); Sen 1997 *Tagore and His India* (NY Review of Books essay + Penguin) | Anti-nationalist universalist political theology; critique of European-import nationalism. Gandhi-adjacent symmetric pair. | first-batch |
| `bhindranwale-thinker` | speeches collected; primary-text from Damdami Taksal sources | T1 academic treatment | **YES** | Mahmood 1996 *Fighting for Faith and Nation: Dialogues with Sikh Militants* (Pennsylvania); Tatla 1999 *The Sikh Diaspora* (UCL) | Sikh-nationalist political theology; Khalistan movement; 1984 Operation Blue Star context. | stub — niche but the literature exists |

---

## §6. Buddhist political theology

| Slug | Work | Tier | Risk | Source | Claim | Include |
|---|---|---|---|---|---|---|
| `walpola-rahula-thinker` | *Bhikkhu Politics* 1946; *What the Buddha Taught* 1959 (more famous but less political) | T1 | partial | Tambiah 1992 *Buddhism Betrayed?* (Chicago); Seneviratne 1999 *The Work of Kings* (Chicago) | Theravada-political-monkhood thesis — bhikkhus must engage politically. Inspired post-1956 Sinhala-Buddhist political-monkhood; partial-flag for the documented mobilization reception per Tambiah. | first-batch |
| `ashin-wirathu-thinker` | sermon-corpus (2010s+); primary-text via 969 Movement publications | T1 (academic treatment) | **YES** mandatory | Walton 2016 *Buddhism, Politics and Political Thought in Myanmar* (Cambridge); Schonthal/Walton 2016 *Contemporary Buddhism* 17.1 | 969 Movement / MaBaTha leader; anti-Muslim Buddhist-nationalist sermons; documented Rohingya-persecution connection per UN reports + Walton. | T5-opt-in — borderline T1/T5; flag mandatory; treat per Qutb-protocol |
| `thich-nhat-hanh-thinker` | *Engaged Buddhism: Buddha's Path to Inner Peace* 1987; *Being Peace* 1987 | T1 | no | Queen ed. 1999 *Engaged Buddhism in the West* (Wisdom); Hunt-Perry/Fine 2000 chapter in Queen vol | Engaged Buddhism — political action as bodhisattva practice. Symmetric pair to Buddhist-nationalist political-monkhood. | first-batch |
| `sulak-sivaraksa-thinker` | *Seeds of Peace* 1992; *The Wisdom of Sustainability* 2009 | T1 | no | Queen ed. 1999 *Engaged Buddhism in the West* (Wisdom); Swearer 2010 *The Buddhist World of Southeast Asia* (SUNY) | Thai socially-engaged-Buddhist political theology; INEB (International Network of Engaged Buddhists) founder. | first-batch |
| `dalai-lama-tenzin-gyatso-thinker` | *Ethics for the New Millennium* 1999; *Freedom in Exile* 1990 | T1 | no | Powers 2017 *The Buddha Party* (Oxford); Goldstein 1997 *The Snow Lion and the Dragon* (California) | Tibetan-Buddhist secular-ethics political theology in exile; non-violent Tibetan-autonomy political theology. | first-batch |

---

## §7. Eastern Orthodox political theology

| Slug | Work | Tier | Risk | Source | Claim | Include |
|---|---|---|---|---|---|---|
| `vladimir-soloviev-thinker` | *The Justification of the Good* 1897; *Russia and the Universal Church* 1889 | T1 | no | Valliere 2000 *Modern Russian Theology: Bukharev, Soloviev, Bulgakov* (Eerdmans) | Theocracy reconceived as free-spiritual unity (sobornost); the Russian-religious-philosophy founder. Source-figure for both progressive + conservative Russian political theologies. | first-batch |
| `nikolai-berdyaev-thinker` | *The Russian Idea* 1946; *Slavery and Freedom* 1939 | T1 | no | Lowrie 1960 *Rebellious Prophet: A Life of Nicolai Berdyaev* (Harper); Valliere 2000 | Personalist Christian-philosophy political theology; anti-Soviet + anti-fascist; Russian-religious-philosophy in exile. **Symmetric pair to later Russian Orthodox-Imperialism.** | first-batch |
| `john-zizioulas-thinker` | *Being as Communion* 1985 | T1 | no | T&T Clark; Pelikan 1989 review *First Things* | Personhood-in-communion as ecclesial-political principle; ecumenical-Orthodox engagement. Influence on Radical Orthodoxy. | first-batch |
| `cyril-hovorun-thinker` | *Political Orthodoxies* 2018; "Civil Religion in the Orthodox Milieu" in Stoeckl ed. 2017 | T1 | no | Fortress Press; Stoeckl ed. 2017 *Political Theologies in Orthodox Christianity* (Bloomsbury) | Critical Ukrainian-Orthodox political theologian; the "Russian World" (*russkii mir*) ideology as a political-theological deformation. **Symmetric pair to Patriarch Kirill / russian-orthodox-imperialism.** | first-batch |
| `patriarch-kirill-thinker` | sermon-corpus 2009+; "Russian World" speeches | T1 (academic treatment of his political-theology) | **YES** | Stoeckl 2014 *The Russian Orthodox Church and Human Rights* (Routledge); Hovorun 2017 + 2018; Adamsky 2024 *Patriarch and Patriot* *Religion, State & Society* | Moscow Patriarch since 2009; principal articulator of "Russian World" political-theology + 2022 Ukraine-war justification. | first-batch — flag mandatory per Hovorun, Stoeckl, Adamsky |

---

## §8. African + diaspora political theology

Politics-lens coverage of African + African-diaspora political theology is **structurally under-represented in the existing vault** per the §8 risk note in the parent spec. This batch closes part of that gap.

| Slug | Work | Tier | Risk | Source | Claim | Include |
|---|---|---|---|---|---|---|
| `desmond-tutu-thinker` | *No Future Without Forgiveness* 1999; *God Has a Dream* 2004 | T1 | no | Allen 2006 *Rabble-Rouser for Peace: The Authorized Biography of Desmond Tutu* (Free Press); Battle 1997 *Reconciliation: The Ubuntu Theology of Desmond Tutu* (Pilgrim) | South African Black-theology + ubuntu political theology; Truth and Reconciliation Commission as theological-political instrument. | first-batch |
| `john-mbiti-thinker` | *African Religions and Philosophy* 1969 | T1 | no | Heinemann; Westerlund 1985 *African Religion in African Scholarship* (Almqvist & Wiksell) | African-Christian political theology rooted in indigenous-religious frameworks; influential on African-liberation contextual theology. | first-batch |
| `engelbert-mveng-thinker` | *L'Afrique dans l'Église: Paroles d'un croyant* 1985 | T1 | no | Bediako 1995 *Christianity in Africa* (Orbis); Mveng's Jesuit Provincial archive | Cameroonian Jesuit; African-liberation theology; "anthropological poverty" — colonial dispossession as theological category. | first-batch |
| `mercy-amba-oduyoye-thinker` | *Daughters of Anowa* 1995 | T1 | no | Pemberton 2003 *Circle Thinking* (Brill); EATWOT publications | Ghanaian feminist-African political theology; Circle of Concerned African Women Theologians founder. | first-batch |
| `wole-soyinka-thinker` (selected non-fiction political-theological writings) | *Of Africa* 2012; selected essays | T1 | no | Yale UP; Gibbs 1986 *Wole Soyinka* (Macmillan) | Yoruba-Òrìṣà as political-theological resource; against monotheistic-imperial political-theology. Cross-list with 04_persons. | stub — secondary priority |

---

## §9. Jewish political theology

| Slug | Work | Tier | Risk | Source | Claim | Include |
|---|---|---|---|---|---|---|
| `martin-buber-thinker` | *I and Thou* 1923; *Kingship of God* 1932; *Israel and Palestine* 1952 | T1 | no | Friedman 1955–1988 *Martin Buber: His Life and Work* (3 vol., Dutton); Mendes-Flohr 2019 *Martin Buber: A Life of Faith and Dissent* (Yale) | Dialogical political theology; Hebrew theocracy reconceived (*Kingship of God*); bi-national Israeli-Palestinian political theology. | first-batch |
| `gershom-scholem-thinker` | *Major Trends in Jewish Mysticism* 1941; *The Messianic Idea in Judaism* 1971 | T1 | no | Schocken; Biale 1979 *Gershom Scholem: Kabbalah and Counter-History* (Harvard) | Jewish-messianism as political-theological resource + danger; the "messianic idea" as both promise and catastrophic risk. | first-batch |
| `emmanuel-levinas-thinker` | *Totality and Infinity* 1961; *Otherwise than Being* 1974 + Talmudic readings | T1 | no | Duquesne UP; Critchley 2002 *Cambridge Companion to Levinas* (Cambridge) | Ethics as first philosophy; the political grounded in face-to-face responsibility; selective Zionism-engagement that requires careful citation. | first-batch |
| `hannah-arendt-thinker` | *The Origins of Totalitarianism* 1951; *Eichmann in Jerusalem* 1963 | T1 | no | Young-Bruehl 1982 *Hannah Arendt: For Love of the World* (Yale); Benhabib 1996 *The Reluctant Modernism of Hannah Arendt* (Sage) | Critique of totalitarianism as political-theological pathology; the banality of evil. Cross-list 04_persons + 30_politics/thinkers. | first-batch |
| `judith-butler-thinker` | (already in §2 — Diasporic Jewish political theology) | — | — | — | — | (cross-link) |
| `david-novak-thinker` | *The Election of Israel* 1995; *Covenantal Rights* 2000 | T1 | no | Cambridge; Princeton; Novak's Toronto position | Jewish-natural-law political theology; symmetric pair to liberal-Jewish + diasporic-critical voices. | first-batch |

---

## §10. Confucian / East Asian political theology

| Slug | Work | Tier | Risk | Source | Claim | Include |
|---|---|---|---|---|---|---|
| `tu-weiming-thinker` | *Centrality and Commonality* 1989; *Confucian Thought* 1985 | T1 | no | SUNY Press; Harvard Yenching Institute; Bell/Chaibong eds. 2003 *Confucianism for the Modern World* (Cambridge) | Confucian humanism as global political-theological resource; "New Confucianism" 3rd wave. | first-batch |
| `daniel-a-bell-thinker` | *The China Model* 2015; *Just Hierarchy* (with Wang Pei) 2020 | T1 | partial | Princeton UP; Tsinghua faculty page | Political-meritocracy as Confucian alternative to Western liberal-democratic political theology. Engages serious critique re. CCP-instrumentalization risk. | first-batch |
| `kang-youwei-thinker` | *Datong Shu* (Book of Great Unity) 1902 [published posthumously 1935] | T1 | no | Hsiao 1975 *A Modern China and a New World: K'ang Yu-wei, Reformer and Utopian* (Washington); Chen 2007 *Kang Youwei's Reforms and Confucian Political Thought* (Brill) | Late-Qing Confucian-reformist political theology; "Confucianism as state religion" proposal; *datong* utopian-political-theology. | first-batch |
| `kim-il-sung-juche-political-theology` | NOT a thinker-node — concept-node only | T1 academic treatment | YES | Park 2002 *The Politics of Unconventional Warfare in North Korea* (Praeger); Kwon/Chung 2012 *North Korea: Beyond Charismatic Politics* (Rowman & Littlefield) | *Juche* as state-civic-religion. Lives in `30_politics/concepts/juche.md`, not in thinkers folder. | first-batch (concept node only) |

---

## §11. T5 / disclaimer-required figures

These get NODES under always-collect-never-discard, but render OFF by default per CODEX v1.1 §IV. Each REQUIRES the political-risk citation BEFORE the claim in the tooltip.

| Slug | Source | Tier | Risk | Notes / Wire-protocol |
|---|---|---|---|---|
| `julius-evola-thinker` | Goodrick-Clarke 2002 *Black Sun* (NYU); Hansen 2002 *Evola and the Conservative Revolution* | T5 | YES mandatory | Per CODEX v1.1 example; Evola's *Rivolta contro il mondo moderno* + *Cavalcare la Tigre* are read in neo-fascist circles. Wire only via polemic-edges; political-risk caveat leads tooltip. |
| `david-icke-thinker` | ADL extremism database; Hope Not Hate; Berlet 2009 "Reptilians from a Hollow Earth" | T5 | YES mandatory | Reptilian-elite mythology; documented antisemitic-dog-whistle reception per ADL. Wire only via polemic-edges. Investigation-as-prompt: the underlying chaoskampf serpent-iconography IS real per Mesopotamian scholarship (Smith 1994; Lambert 2013); wire the legitimate-scholarship layer separately. |
| `aleksandr-dugin-thinker` | Laruelle 2008 *Russian Eurasianism* (Johns Hopkins / Woodrow Wilson Center); Sedgwick 2004 *Against the Modern World* (Oxford); Snyder 2018 *The Road to Unfreedom* (Crown) | T5 | YES mandatory | Eurasianist + Traditionalist + post-2014 Russian-imperial political-theology; documented influence on Russian state ideology + Western far-right per Laruelle + Snyder. Wire only via polemic-edges; cite political-risk source first. |
| `theosophy-root-race-political-reception` | Goodrick-Clarke 1985 *Occult Roots of Nazism* (Tauris) | T5 (specific reception only) | YES mandatory | Per CODEX v1.1 — core Theosophy is T4; the 20th c. Aryan / white-nationalist invocation of root-race material is T5. Concept-node, not thinker. |

---

## §12. Position-type cross-reference table

The symmetric-pairing rule POL-1 in action. Every position in this table has its same-tradition counterpart-position listed alongside, so the reader of one is one click away from the other.

| Position | Tradition | Anchor | Counter-position | Counter-anchor |
|---|---|---|---|---|
| Constantinian / state-establishment Christianity | Christianity | constantinian-christianity movement | Anabaptist-pacifist + Hauerwas | stanley-hauerwas-thinker |
| Christian Reconstructionism / dominionism | Christianity (US right) | rousas-john-rushdoony-thinker | Black Liberation Theology | james-cone-thinker |
| Russian Orthodox-Imperialism / "Russian World" | Eastern Orthodoxy | patriarch-kirill-thinker | Ukrainian-Orthodox + Berdyaev tradition | cyril-hovorun-thinker + nikolai-berdyaev-thinker |
| Hindutva / ethno-nationalist Hinduism | Hindu / Indian | vinayak-damodar-savarkar-thinker | Gandhian universalism + Ambedkar + Tamil-Dravidian secularism | mahatma-gandhi-thinker + b-r-ambedkar-thinker + e-v-ramasamy-periyar-thinker |
| Khomeinist Velayat-e Faqih | Twelver Shia | ruhollah-khomeini-thinker | Ali Shariati red-Shiism + Soroush + Shabestari reformist hermeneutics | ali-shariati-thinker + abdolkarim-soroush-thinker + mohammad-mojtahed-shabestari-thinker |
| Qutbist / radical-Salafi political Islam | Sunni Islam | sayyid-qutb-thinker | Islamic Modernism + Mohammed Arkoun's applied Islamology + Tariq Ramadan integrationism | muhammad-abduh-thinker + mohammed-arkoun-thinker + tariq-ramadan-thinker |
| Buddhist nationalism (Sri Lanka + Myanmar) | Theravada Buddhism | walpola-rahula-thinker (Sri Lanka) + ashin-wirathu-thinker (Myanmar T5-borderline) | Engaged Buddhism | thich-nhat-hanh-thinker + sulak-sivaraksa-thinker |
| Schmittian sovereign-decisionism | Western political theology | carl-schmitt-thinker | Benjamin's messianic time + Barthian church-confessing + Niebuhrian Christian-realism + Hauerwas's church-as-polis | walter-benjamin-thinker + karl-barth-thinker + reinhold-niebuhr-thinker + stanley-hauerwas-thinker |
| Traditionalist / Evolian far-right political-theology | "Traditionalism" school | julius-evola-thinker (T5) | Critical scholarship of Traditionalism + Berdyaev + serious-Guénon-readings | Goodrick-Clarke ref + nikolai-berdyaev-thinker (curate carefully; Guénon-himself is T3-alternative-school per CODEX, not T5) |

---

## §13. Implementation summary

**Total figures for first batch:** ~50 (with the §11 T5 set hidden-by-default per CODEX UX protocol)
**Sub-folder:** `30_politics/thinkers/<slug>.md`
**Cross-link to `04_persons/<same-slug-but-biographical>.md`:** REQUIRED — biography lives in 04, political-theology argument lives in 30
**Wiring per CODEX:** every claim cites a peer-reviewed source; every risk-flag cites Barkun / ADL / Hovorun / Stoeckl / Walton / Calvert / Ingersoll / equivalent
**Symmetric pairing:** see §12 — no left-position node ships without its same-tradition right-position node; no nationalist node ships without its anti-nationalist counterpart
**T5 protocol:** see §11 — Evola, Icke, Dugin, Theosophy-root-race-reception, Wirathu (borderline), al-Baghdadi all hidden-by-default + polemic-edges only + political-risk caveat leading tooltip
**Estimated batch sequencing:**
1. Foundational canon §1 (~7 figures) — Schmitt, Benjamin, Taubes, Barth, Niebuhr, Bonhoeffer, Maritain
2. Post-secular theorists §2 (~7 figures) — Taylor, Casanova, Asad, Mahmood, Lilla, Connolly, Butler
3. Christian spectrum §3 (~10 figures) — Gutiérrez, Boff, Cone, Williams, Hauerwas, Milbank, Rushdoony [+flag], North [+flag stub], Day, West
4. Islamic spectrum §4 (~10 figures + 1 T5) — Abduh, Rida, Qutb [+flag], al-Banna, Shariati, Khomeini [+flag-partial], Soroush, Shabestari, Arkoun, Ramadan [+biographical-note]; +al-Baghdadi T5
5. Hindu/Sikh §5 (~6 figures) — Savarkar [+flag], Golwalkar [+flag], Gandhi, Ambedkar, Periyar, Tagore
6. Buddhist §6 (~5 figures) — Rahula [+flag-partial], Wirathu (T5-borderline), Thich Nhat Hanh, Sulak, Dalai Lama
7. Orthodox §7 (~5 figures) — Soloviev, Berdyaev, Zizioulas, Hovorun, Kirill [+flag]
8. African §8 (~5 figures) — Tutu, Mbiti, Mveng, Oduyoye, Soyinka-stub
9. Jewish §9 (~5 figures) — Buber, Scholem, Levinas, Arendt, Novak
10. Confucian §10 (~3 figures + 1 concept) — Tu Wei-ming, Bell, Kang Youwei + juche concept-node
11. T5 set §11 (~4 figures + 1 concept) — Evola, Icke, Dugin, Wirathu, Theosophy-root-race-reception

**Total estimate:** 51 thinker-nodes + ~5 T5 + ~15 concept-nodes from §5 of parent spec = **~71 first-batch nodes** if all sub-folders ship simultaneously. More realistically: **3 batches of ~20 nodes each** spanning a week of agent work, with each batch enforcing the symmetric-pairing rule internally.

---

## §14. Action checklist — John's greenlight / veto

| # | Decision | John's call |
|---|---|---|
| 1 | The 51-figure first-batch catalog (§§1-10) as scoped | ☐ |
| 2 | Symmetric-pairing rule POL-1 enforced per §12 cross-reference table | ☐ |
| 3 | T5-protocol figures (§11) created as nodes + rendered OFF by default in legend toggle | ☐ |
| 4 | Cross-link convention: thinker-node in `30_politics/thinkers/` + biographical node in `04_persons/` | ☐ |
| 5 | Risk-flag mandatory citations per peer-reviewed civil-rights / political-history source (Barkun, ADL, Hovorun, Stoeckl, Walton, Calvert, Ingersoll, Jaffrelot, Bakhle) | ☐ |
| 6 | Batch sequencing per §13 (3 batches × ~20 nodes) | ☐ |
| 7 | African-political-theology §8 prioritized to close existing under-representation | ☐ |
| 8 | Concept-node creations from §10 (juche) + parent spec §3.5 (divine-right, two-swords, caesaropapism, theonomy, dominionism, dīn-i-ilāhī, preferential-option-for-the-poor) ship alongside thinker-batch | ☐ |
| 9 | Ramadan biographical-context-note (2017–2024 legal proceedings) required in `notes:` field per §4 | ☐ |
| 10 | Position-type cross-reference table §12 lives as a `30_politics/README.md` rendered section so the reader sees the pluralism-pairing structure on landing | ☐ |

---

## §15. Final notes for the maintainer

This document and its companion spec take CODEX v1.1's posture statement at its word: investigation, not advocacy; pluralism, not orthodoxy; disclosure, not concealment. The politics lens is the hardest place in the vault to hold that posture, because political-theology IS the discipline where evaluative claims feel most pressing.

The discipline rule the spec relies on: **every flag, every tier, every wire traces to a peer-reviewed source.** If an agent's politics make them want to flag a movement that no peer-reviewed source flags, they don't get to add the flag. If an agent's politics make them want to omit a movement that academic-press-published authors take seriously, they don't get to omit. The lens's neutrality is grounded in the literature, not in the agent's editorial choices.

The lens treats Hindutva and Tamil-Dravidian-secularism the same way it treats Khomeinism and Soroushian reformism. The lens treats Christian Reconstructionism and Black Liberation Theology the same way it treats Russian Orthodox-Imperialism and Ukrainian-Orthodox dissident voices. The lens treats Schmitt and Benjamin the same way it treats Buber and Levinas. In each case, the wire's `type:`, `source:`, `source-tier:`, `political-risk-flag:`, and `notes:` fields tell the reader exactly what kind of claim is being made and how strongly it's supported. The reader decides.

The Codex Atlas project's prize, per the ONTOLOGY mission statement, is the cross-tradition transmission. Political theology adds a layer: cross-tradition *political-theological pattern* — divine kingship from Egypt to Marduk to Christ Pantokrator to Christian Reconstructionism's postmillennialism, with the structural pattern intact and the tier + flag varying. That is the lens's animating thesis. When the lens ships, the vault becomes the only public investigation tool I am aware of that maps this layer at this depth with this tier-discipline.

---

*Filed alongside `AUDIT/politics-lens-spec-2026-05-23.md`. Both await John's greenlight before any node creation. Per CODEX §VIII, an explicit ontology-rationale-2026-05-23-politics.md dated rationale doc must be filed when the lens is approved, to anchor the lock-rationale chain.*
