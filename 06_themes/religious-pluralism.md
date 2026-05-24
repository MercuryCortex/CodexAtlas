---
type: theme
id: "religious-pluralism"
name: "Religious Pluralism (Modern Category)"
aka: ["the pluralist hypothesis", "John Hick's pluralism", "interreligious dialogue", "the *theology of religions*"]
category: "theological"
traditions-where-attested: ["19th-c. liberal Protestantism (Schleiermacher, Troeltsch)", "Indian-influenced Western pluralism (Vivekananda, Radhakrishnan)", "Hickian pluralism (1973 onward)", "Catholic post-Vatican-II *Nostra Aetate* (1965)", "Bahá'í (foundational pluralism)", "Smithian pluralist hypothesis (W. C. Smith)"]
appearances: ["[[phase-7-022-hick-interpretation-of-religion]]", "[[event-parliament-of-world-religions-1893]]"]
deity-instances: []
status: "stub"
refs:
  - title: "An Interpretation of Religion: Human Responses to the Transcendent"
    author: "Hick, John"
    year: 1989
    publisher: "Yale University Press"
    type: "monograph"
    tier: 1
  - title: "No Other Name? A Critical Survey of Christian Attitudes Toward the World Religions"
    author: "Knitter, Paul"
    year: 1985
    publisher: "Orbis"
    type: "monograph"
    tier: 1
tags: [theme, pluralism, hick, interreligious, post-vatican-ii, bahai, smith]
date-earliest: 1973
dating-basis: B1
dating-basis-source: "\"Hick, J. *God and the Universe of Faiths* (1973)\""
dating-basis-notes: "Hick's modern pluralism 1973; Vatican II *Nostra Aetate* 1965."
---

# Religious Pluralism (Modern Category)

The modern theological position that the world religions are *equally* (or comparably) legitimate responses to the same ultimate divine reality, such that no one tradition is *uniquely* salvific. Distinguished from religious *exclusivism* (only one tradition saves), *inclusivism* (others can be saved through implicit connection to the one true tradition — Karl Rahner's *anonymous Christians*), and *particularism* (each tradition has its own internal validity but they don't converge on the same reality — Heim, *Salvations*). The pluralist hypothesis was given its sharpest 20th-c. form by John Hick (*God Has Many Names* 1980; *An Interpretation of Religion* 1989) — drawing a Kantian noumenon-phenomenon distinction to argue all religions are phenomenal responses to the same noumenal *Real*.

## Manifestations

- **19th-c. liberal Protestant antecedents.** Schleiermacher's *On Religion* (1799) reads religion as universal human capacity, of which traditions are particular expressions. Troeltsch, *The Absoluteness of Christianity* (1901) and *Christian Thought: Its History and Application* (1923) — late Troeltsch shifts from Christian-absolutism to historicist pluralism.
- **Indian-influenced Western pluralism.** [[event-parliament-of-world-religions-1893]] — Vivekananda's Chicago address articulates Hindu universalist pluralism; *all paths lead to the same goal*; deeply influences subsequent Western theology of religions. Radhakrishnan's *Eastern Religions and Western Thought* (1939). The Indian-modernist pluralism (Aurobindo, Tagore, Gandhi) precedes Hick's Western articulation.
- **W. C. Smith.** Wilfred Cantwell Smith, *The Meaning and End of Religion* (1962) — argues "religion" as a reified category obscures the underlying personal *faith*; cumulative-tradition / personal-faith distinction underwrites a pluralist hypothesis.
- **John Hick.** [[phase-7-022-hick-interpretation-of-religion]] — Hick's mature pluralism: a Kantian noumenon-phenomenon argument. The *Real-an-sich* is one; the world religions are culturally-shaped responses to it. Critique (Plantinga, D'Costa, Heim): the Hickian *Real* is so attribute-stripped that it cannot ground genuine religious life; pluralism collapses into agnosticism.
- **Catholic post-Vatican-II.** *Nostra Aetate* (1965) — the Council's declaration that non-Christian religions contain genuine spiritual truth. Karl Rahner's *anonymous Christianity* (1961) — inclusivism short of pluralism. Hans Küng, *On Being a Christian* (1974), and later *Global Responsibility* — more pluralist drift. Paul Knitter's *No Other Name?* (1985) and *One Earth Many Religions* (1995) — Catholic theologian moving toward full pluralism.
- **Bahá'í as built-in pluralism.** [[tradition-baha-i]] — the Bahá'í Faith's foundational doctrine of *progressive revelation*: Krishna, Buddha, Zoroaster, Moses, Jesus, Muhammad, the Báb, and Bahá'u'lláh are successive manifestations of the same Reality. Pluralism not as 20th-c. liberal afterthought but as constitutive theology. (See [[progressive-revelation]].)
- **Modern interreligious dialogue.** From the 1893 Parliament onward — the 1970s Buddhist-Christian dialogue (Cobb, Abe), the post-Vatican-II Jewish-Christian dialogue (Vatican Commission for Religious Relations with the Jews, 1974 *Guidelines*), the post-1965 Hindu-Christian dialogue (Panikkar's *The Unknown Christ of Hinduism* 1964, revised 1981).

## Disputes

- **Hick's Real-an-sich and the loss of religious content.** Plantinga (*Pluralism: A Defense of Religious Exclusivism* 1995), D'Costa (*The Meeting of Religions and the Trinity* 2000) — pluralism evacuates traditions of their particular truth-claims.
- **Heim's particularist alternative.** S. Mark Heim, *Salvations: Truth and Difference in Religion* (1995), *The Depth of the Riches* (2001) — argues each tradition pursues its own salvific telos and the traditions converge less than pluralism claims. Each tradition's *salvation* is real but distinct.
- **Whether pluralism is a *Western post-Christian* invention or a genuinely cross-cultural development.** The Indian and Bahá'í cases suggest the latter; the post-Christian institutional context of Hick, Smith, Knitter suggests the former.
- **The colonial legacy of "world religions."** Masuzawa (2005) and Asad (1993) argue the "world religions" framework itself is a colonial-Western construction; pluralism inherits the framework uncritically. (Cf. [[comparative-religion-method]].)

## Refs

1. Hick, *An Interpretation of Religion*, 1989.
2. Knitter, *No Other Name?*, 1985.
3. Heim, *Salvations*, 1995.

---

# Implementation note for the human / follow-up agent

To split each draft above into its own file at `06_themes/<slug>.md`:

1. Create `06_themes/<slug>.md` for each numbered entry (1 = `temple-economy`, 2 = `divinatory-omen-reading`, etc.).
2. Use the YAML frontmatter block exactly as drafted; the body is everything below the closing `---` of the YAML block.
3. Drop entries 26 and any later ones that flagged "duplicate" notes.
4. Re-run `python3 build_data.py` and `python3 build_dashboard.py` from the vault root.
5. The `dead-links.md` priority queue should drop by several entries after these are split out (especially the Phase 8 dead-link entries that reference some of these themes' linked documents).
6. Delete this staging file once split-out is complete.

**Total new themes ready to split:** 28 (entry 26 dropped as duplicate of existing `pseudonymity-as-strategy`; entry numbering remains 1–30 with 26 noted-dropped).
