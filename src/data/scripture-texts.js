// ============================================================
// CODEX ATLAS — Scripture Reader corpus
// Prototype: Genesis 1 · Enuma Elish Tablet I · Descent of Inanna
//
// Translations used:
//   Genesis 1     : King James Version (1611) — public domain
//   Enuma Elish I : L.W. King (1902) — public domain
//   Descent of    : adapted from ETCSL / Wolkstein-Kramer — academic paraphrase
//     Inanna
//
// Entity annotation format per verse:
//   { word: <string matched in text>, node: <vault-id>, type: <'deity'|'symbol'|'theme'|'tradition'|'event'>, note: <string>, parallels: [{ label, textId?, note }] }
// ============================================================

window.SCRIPTURE_TEXTS = {};

// ── GENESIS 1:1–2:3 ──────────────────────────────────────────────────────────
SCRIPTURE_TEXTS['genesis-1'] = {
  id: 'genesis-1',
  title: 'Genesis 1:1 – 2:3',
  shortTitle: 'Genesis 1',
  corpus: 'Hebrew Bible (Torah)',
  tradId: 'tradition-second-temple-judaism',
  date: 'c. 6th–9th century BCE (Priestly source)',
  docNode: 'phase-2-006-genesis',
  language: 'Hebrew · King James Version (1611)',
  translations: [
    { id: 'kjv',    label: 'KJV (1611)',      note: 'King James Version — the classic literary English rendering' },
    { id: 'hebrew', label: 'Hebrew (MT)',      note: 'Masoretic Text transliteration + word-by-word gloss — closest to the original' },
    { id: 'lxx',    label: 'LXX (Greek)',      note: 'Septuagint c. 285 BCE — Greek translation used by NT authors and early Church Fathers' },
  ],
  intro: 'The Priestly (P) account of creation, composed during or after the Babylonian exile. Genesis 1 is the most cross-tradition–connected text in the vault: the Hebrew word tehom ("the deep") in verse 2 is linguistically cognate with the Akkadian Tiāmat of the Enuma Elish — the most-documented case of Mesopotamian influence on Hebrew cosmology (Gunkel 1895).',
  crossTradition: [
    { label: 'Enuma Elish I (Mesopotamian)', textId: 'enuma-elish-1', note: 'tehom ↔ Tiāmat: the same primordial ocean, 1,000 years apart. Gunkel 1895 established the linguistic cognate; Day 1985 confirmed it.' },
    { label: 'Egyptian Nun theology', note: 'Atum rising from Nun = God separating the waters; same cosmogonic grammar operating independently.' },
    { label: 'Norse Ginnungagap', note: 'Formless void before creation; same structural slot, different cultural dress.' },
  ],
  sections: [
    {
      heading: 'Day One',
      verses: [
        { ref: '1:1', text: 'In the beginning God created the heaven and the earth.',
          textVersions: {
            kjv:    'In the beginning God created the heaven and the earth.',
            hebrew: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ\nbə-rê-šîṯ  bā-rā  ʾĔ-lō-hîm  ʾêṯ  haš-šā-ma-yim  wə-ʾêṯ  hā-ʾā-reṣ\n[in-beginning] [created] [God/Elohim] [obj.mark] [the-heavens] [and-obj.mark] [the-earth]',
            lxx:    'Ἐν ἀρχῇ ἐποίησεν ὁ θεὸς τὸν οὐρανὸν καὶ τὴν γῆν.\nEn archē epoiēsen ho theos ton ouranon kai tēn gēn.\n[In beginning] [made] [the God] [the heaven] [and] [the earth]',
          },
          entities: [
            { word: 'God', node: 'elohim', type: 'deity',
              note: 'Hebrew: ʾĒlōhîm — grammatically plural, used throughout the P source with a singular verb. The generic Semitic word for divinity. The personal name YHWH (Yahweh) does not appear until 2:4.',
              parallels: [
                { label: 'Marduk (Enuma Elish)', textId: 'enuma-elish-1', note: 'Both are the primary divine agent of ordered creation from primordial chaos.' },
                { label: 'Ptah (Memphite Theology)', note: 'Creates by thought and speech; closest Egyptian structural parallel to Elohim in the P account.' },
              ]
            }
          ]
        },
        { ref: '1:2', text: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.',
          textVersions: {
            kjv:    'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.',
            hebrew: 'וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ וְחֹשֶׁךְ עַל־פְּנֵי תְהוֹם וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל־פְּנֵי הַמָּיִם\nwə-hā-ʾā-reṣ  hā-yə-ṯāh  ṯō-hū  wā-ḇō-hū  wə-ḥō-šeḵ  ʿal-pə-nê  tə-hôm  wə-rū-aḥ  ʾĔ-lō-hîm  mə-ra-ḥe-p̄eṯ  ʿal-pə-nê  ham-mā-yim\n[and-the-earth] [was] [waste] [and-void] [and-darkness] [upon-face-of] [THE-DEEP (תְּהוֹם tĕhôm)] [and-spirit/wind-of] [God] [hovering/brooding] [upon-face-of] [the-waters]',
            lxx:    'ἡ δὲ γῆ ἦν ἀόρατος καὶ ἀκατασκεύαστος, καὶ σκότος ἐπάνω τῆς ἀβύσσου, καὶ πνεῦμα θεοῦ ἐπεφέρετο ἐπάνω τοῦ ὕδατος.\nhē de gē ēn aoratos kai akataskeuastos, kai skotos epanō tēs abyssou, kai pneuma theou epephereto epanō tou hydatos.\n[the-earth was invisible and-unformed, and darkness over the-abyss (ἄβυσσος abyssos), and spirit of-God was-borne-over the waters]\nNote: Greek abyssos = direct translation of tĕhôm → enters English as "abyss"',
          },
          entities: [
            { word: 'the deep', node: 'cosmic-ocean', type: 'symbol',
              note: 'Hebrew: tĕhôm (תְּהוֹם). Linguistically cognate with Akkadian Tiāmat — the primordial saltwater ocean of the Enuma Elish. Gunkel (1895) established this as the most-documented case of Mesopotamian influence on Hebrew cosmology; confirmed by Day (1985) and Wyatt (2005). The primordial waters are the pre-creation substrate in Egyptian (Nun), Hindu (Kshira Sagara), Norse (Ginnungagap), and Greek (Okeanos) cosmologies — all independent, but sharing the same deep structure.',
              parallels: [
                { label: 'Tiāmat (Enuma Elish)', textId: 'enuma-elish-1', note: 'Same word, different language: Tiāmat = the primordial saltwater ocean that must be defeated and ordered.' },
                { label: 'Nun (Egyptian)', note: 'The featureless primordial ocean from which Atum emerged; same pre-creation substrate.' },
                { label: 'Ginnungagap (Norse)', note: 'The primordial void before creation; structurally parallel even without the water metaphor.' },
              ]
            },
            { word: 'Spirit of God', node: 'ruach-hakodesh', type: 'theme',
              note: 'Hebrew: rûaḥ ʾĕlōhîm — also translatable as "wind of God" or "mighty wind." The creative breath/wind hovering (like a bird) over the primordial waters before the first act of creation. Re-echoed in the Gospel of John 1:1 (creative Logos) and in Jesus\'s baptism (Spirit descending as dove over the Jordan waters = re-enacting creation).',
              parallels: [
                { label: 'Logos (John 1:1)', note: '"In the beginning was the Word" deliberately echoes Gen 1:1; the creative divine breath becomes the divine Word.' },
              ]
            }
          ]
        },
        { ref: '1:3', text: 'And God said, Let there be light: and there was light.',
          textVersions: {
            kjv:    'And God said, Let there be light: and there was light.',
            hebrew: 'וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר וַיְהִי אוֹר\nway-yō-mer  ʾĔ-lō-hîm  yə-hî  ʾôr  way-yə-hî  ʾôr\n[and-said] [God] [let-there-be] [light] [and-there-was] [light]\nNote: The divine IMPERATIVE yəhî — "let there be" — is the engine of all creation in the P source.',
            lxx:    'καὶ εἶπεν ὁ θεός Γενηθήτω φῶς. καὶ ἐγένετο φῶς.\nkai eipen ho theos: Genēthētō phōs. kai egeneto phōs.\n[and said the God: Let-come-into-being light. and came-into-being light]\nNote: genēthētō → Latin fiat lux (Vulgate) → "Let there be light" — the most translated clause in human history.',
          },
          entities: [
            { word: 'God said', node: 'creation-by-word', type: 'theme',
              note: 'Creation by divine speech (*creatio per verbum*). The spoken command as cosmogonic act appears in: Egyptian Memphite Theology (Ptah creates by heart and tongue, –700 BCE); Vedic *Vāc* (sacred speech as creative principle); and reaches its philosophical apex in John 1:1 ("In the beginning was the Logos"). The divine word is the one cosmogonic mechanism that appears independently across Egyptian, Hebrew, and Greek traditions before their meeting.',
              parallels: [
                { label: 'Memphite Theology (Ptah)', note: '"The heart thought and the tongue commanded" — most structurally precise Egyptian parallel.' },
                { label: 'Logos (John 1:1)', note: 'John opens with Gen 1:1 as deliberate echo; the spoken word becomes the incarnate Word.' },
              ]
            }
          ]
        },
        { ref: '1:4', text: 'And God saw the light, that it was good: and God divided the light from the darkness.', entities: [] },
        { ref: '1:5', text: 'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.', entities: [] },
      ]
    },
    {
      heading: 'Day Two',
      verses: [
        { ref: '1:6', text: 'And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.', entities: [] },
        { ref: '1:7', text: 'And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.', entities: [] },
        { ref: '1:8', text: 'And God called the firmament Heaven. And the evening and the morning were the second day.', entities: [] },
      ]
    },
    {
      heading: 'Day Three',
      verses: [
        { ref: '1:9', text: 'And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.', entities: [] },
        { ref: '1:10', text: 'And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.', entities: [] },
        { ref: '1:11', text: 'And God said, Let the earth bring forth grass, the herb yielding seed, and the fruit tree yielding fruit after his kind, whose seed is in itself, upon the earth: and it was so.', entities: [] },
        { ref: '1:12', text: 'And the earth brought forth grass, and herb yielding seed after his kind, and the tree yielding fruit, whose seed was in itself, after his kind: and God saw that it was good.', entities: [] },
        { ref: '1:13', text: 'And the evening and the morning were the third day.', entities: [] },
      ]
    },
    {
      heading: 'Day Four',
      verses: [
        { ref: '1:14', text: 'And God said, Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years:', entities: [] },
        { ref: '1:15', text: 'And let them be for lights in the firmament of the heaven to give light upon the earth: and it was so.', entities: [] },
        { ref: '1:16', text: 'And God made two great lights; the greater light to rule the day, and the lesser light to rule the night: he made the stars also.', entities: [] },
        { ref: '1:17', text: 'And God set them in the firmament of the heaven to give light upon the earth,', entities: [] },
        { ref: '1:18', text: 'And to rule over the day and over the night, and to divide the light from the darkness: and God saw that it was good.', entities: [] },
        { ref: '1:19', text: 'And the evening and the morning were the fourth day.', entities: [] },
      ]
    },
    {
      heading: 'Day Five',
      verses: [
        { ref: '1:20', text: 'And God said, Let the waters bring forth abundantly the moving creature that hath life, and fowl that may fly above the earth in the open firmament of heaven.', entities: [] },
        { ref: '1:21', text: 'And God created great whales, and every living creature that moveth, which the waters brought forth abundantly, after their kind, and every winged fowl after his kind: and God saw that it was good.', entities: [] },
        { ref: '1:22', text: 'And God blessed them, saying, Be fruitful, and multiply, and fill the waters in the seas, and let fowl multiply in the earth.', entities: [] },
        { ref: '1:23', text: 'And the evening and the morning were the fifth day.', entities: [] },
      ]
    },
    {
      heading: 'Day Six',
      verses: [
        { ref: '1:24', text: 'And God said, Let the earth bring forth the living creature after his kind, cattle, and creeping thing, and beast of the earth after his kind: and it was so.', entities: [] },
        { ref: '1:26', text: 'And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth.',
          entities: [
            { word: 'our image', node: 'imago-dei', type: 'theme',
              note: '*Imago Dei* (Gen 1:26–27): "Let us make man in our image, after our likeness." The divine plural ("let us") has generated 2,500 years of theological controversy: divine council? Rhetorical plural of majesty? Vestigial polytheism? The *imago Dei* concept — humans as divine image-bearers — is the foundation of all Abrahamic human dignity theology.',
              parallels: [
                { label: 'Egyptian royal *ka*', note: 'The pharaoh is the divine image (*t·j.t ntr*) of the gods; the Genesis move democratizes what was royal Egyptian theology.' },
              ]
            }
          ]
        },
        { ref: '1:27', text: 'So God created man in his own image, in the image of God created he him; male and female created he them.', entities: [] },
        { ref: '1:31', text: 'And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.', entities: [] },
      ]
    },
    {
      heading: 'Day Seven — the Sabbath',
      verses: [
        { ref: '2:1', text: 'Thus the heavens and the earth were finished, and all the host of them.', entities: [] },
        { ref: '2:2', text: 'And on the seventh day God ended his work which he had made; and he rested on the seventh day from all his work which he had made.',
          entities: [
            { word: 'rested on the seventh day', node: 'shabbat-theology', type: 'theme',
              note: 'Divine rest on the seventh day is the theological basis for the Sabbath (*Shabbat*). The Kabbalistic tradition reads this as the weekly reunion of the divine masculine and feminine (Shekhinah as Bride; the Holy One as Bridegroom). Every Friday night, ~15 million Jews re-enact this cosmic rest — making Shabbat the most widely practiced living form of the sacred-marriage (*hieros gamos*) pattern. The Sumerian sacred marriage → Hebrew covenant theology → Kabbalistic Shabbat is a 4,000-year transmission.',
              parallels: [
                { label: 'Enuma Elish VII — Marduk\'s rest', textId: 'enuma-elish-1', note: 'After defeating Tiamat and ordering creation, Marduk establishes his temple and rests; parallel to God\'s Sabbath rest after ordering the cosmos.' },
              ]
            }
          ]
        },
        { ref: '2:3', text: 'And God blessed the seventh day, and sanctified it: because that in it he had rested from all his work which God created and made.', entities: [] },
      ]
    },
  ]
};

// ── ENUMA ELISH TABLET I (opening) ───────────────────────────────────────────
SCRIPTURE_TEXTS['enuma-elish-1'] = {
  id: 'enuma-elish-1',
  title: 'Enuma Elish — Tablet I (opening)',
  shortTitle: 'Enuma Elish I',
  corpus: 'Mesopotamian · Babylonian',
  tradId: 'tradition-mesopotamian',
  date: 'c. 1800–1100 BCE (Old Babylonian to Kassite period)',
  docNode: 'phase-1-002-enuma-elish',
  language: 'Akkadian · L.W. King translation (1902)',
  translations: [
    { id: 'king-1902', label: 'King (1902)',   note: 'L.W. King 1902 public domain — standard literary English rendering' },
    { id: 'akkadian',  label: 'Akkadian',       note: 'Cuneiform transliteration of the Standard Babylonian recension — the original language of the text' },
  ],
  intro: 'The Babylonian Epic of Creation, recited during the Akitu New Year festival. The opening lines describe the state before creation: the primordial commingling of Apsu (fresh water) and Tiamat (salt water). The word Tiāmat is linguistically cognate with the Hebrew tehom ("the deep") of Genesis 1:2 — the most-documented case of cross-tradition textual borrowing in ancient religion.',
  crossTradition: [
    { label: 'Genesis 1 (Hebrew)', textId: 'genesis-1', note: 'tehom (Gen 1:2) is linguistically cognate with Tiāmat — same word, same primordial ocean, 1,000 years later.' },
    { label: 'Egyptian Nun theology', note: 'Apsu + Tiamat (two primordial oceans) = Egyptian Nun (one undifferentiated primordial ocean); same pre-creation logic.' },
    { label: 'Norse Ginnungagap', note: 'The void between ice and fire is the Norse functional equivalent of the Apsu-Tiamat commingling.' },
  ],
  sections: [
    {
      heading: 'Before Creation',
      verses: [
        { ref: 'I.1–2', text: 'When on high the heaven had not been named, firm ground below had not been called by name,',
          textVersions: {
            'king-1902': 'When on high the heaven had not been named, firm ground below had not been called by name,',
            akkadian:    'e-nu-ma e-liš la na-bu-ú šá-ma-mu\nšap-liš am-ma-tum šu-ma la zak-rat\n[When above] [the-heavens] [not] [had-been-named]\n[below] [the-earth] [a-name] [not] [had-been-proclaimed]',
          },
          entities: []
        },
        { ref: 'I.3–4', text: 'Naught but primordial Apsu, their begetter, and Mummu-Tiamat, she who bore them all,',
          textVersions: {
            'king-1902': 'Naught but primordial Apsu, their begetter, and Mummu-Tiamat, she who bore them all,',
            akkadian:    'ZU.AB-ma reš-tu-ú za-ru-šu-un\nmu-um-mu ti-amat mu-al-li-da-at gim-ri-šu-un\n[Apsu] [primordial] [their-begetter]\n[Mummu-Tiamat] [the-one-who-gave-birth-to] [them-all]\nNote: Tiamat (ti-amat) = "sea" in Akkadian; cognate with Hebrew tĕhôm via Proto-Semitic *tihāmat-',
          },
          entities: [
            { word: 'Apsu', node: 'apsu', type: 'deity',
              note: 'The primordial freshwater ocean; the male principle of the pre-creation state. Apsu represents the subterranean sweet water and, with Tiamat, constitutes the undifferentiated substrate before existence. He is killed by Ea (Enki) when the young gods disturb his peace — his body becomes the subterranean freshwater ocean beneath the earth.',
              parallels: [
                { label: 'Nun (Egyptian)', note: 'The undifferentiated primordial waters before creation; same role in the cosmogonic sequence.' },
              ]
            },
            { word: 'Tiamat', node: 'tiamat', type: 'deity',
              note: 'The primordial saltwater ocean; the female principle of the pre-creation state. Her name is linguistically cognate with Hebrew tehom (תְּהוֹם), "the deep" of Genesis 1:2 — established by Hermann Gunkel (1895) as the most-documented case of Mesopotamian influence on Hebrew cosmology. Tiamat becomes the monster defeated by Marduk; her body becomes heaven and earth.',
              parallels: [
                { label: 'tehom (Genesis 1:2)', textId: 'genesis-1', note: 'Linguistically the same word: Akkadian Tiāmat = Hebrew tĕhôm. The primordial ocean traveled from Babylon to Jerusalem.' },
                { label: 'Nun (Egyptian)', note: 'The primordial waters before creation; same cosmogonic function.' },
                { label: 'Ginnungagap (Norse)', note: 'The void before creation; structurally parallel to the Apsu-Tiamat commingling.' },
              ]
            }
          ]
        },
        { ref: 'I.5–6', text: 'Their waters were mingled together, and no field was formed, no marsh was to be seen;',
          entities: [
            { word: 'waters were mingled', node: 'cosmic-ocean', type: 'symbol',
              note: 'The primordial state: no differentiation, no boundary, no form. Creation will be the act of separation — dividing the primordial waters into ordered categories. This "commingling before separation" is the cosmogonic zero-point shared by Genesis 1:2, Egyptian Nun theology, and the Norse Ginnungagap.',
              parallels: [
                { label: 'Genesis 1:2', textId: 'genesis-1', note: '"Without form, and void; and darkness was upon the face of the deep" — same state of undifferentiated pre-creation.' },
              ]
            }
          ]
        },
        { ref: 'I.7–8', text: 'When of the gods none had been called into being, and none bore a name, and no destinies were ordained,', entities: [] },
        { ref: 'I.9', text: 'Then were created the gods in the midst of heaven.', entities: [] },
      ]
    },
    {
      heading: 'The Young Gods and Conflict',
      verses: [
        { ref: 'I.29–30', text: 'The divine brothers banded together, they disturbed Tiamat as they surged back and forth, they troubled the belly of Tiamat with their uproar in the abode of heaven.',
          entities: [
            { word: 'Tiamat', node: 'tiamat', type: 'deity',
              note: 'Tiamat is not simply a passive ocean but an active cosmic force — and the generation of younger gods who disturb her peace set the cosmogonic conflict in motion. Her subsequent decision to destroy the younger gods and the need for a champion (Marduk) to defeat her drives the remainder of the epic.',
              parallels: []
            }
          ]
        },
        { ref: 'I.81–84', text: 'She gave him the Tablets of Destiny, laid them on his breast, and said: "Your command shall not be altered; your word shall be supreme." Now Kingu, thus exalted, having acquired the rank of Anu, decreed the fate for the gods, his sons:',
          entities: [
            { word: 'Tablets of Destiny', node: 'fate-destiny', type: 'symbol',
              note: 'The Tablets of Destiny (*Dup šimāti*) are the cosmic instrument conferring supreme authority: whoever holds them controls the fate of gods and humans. Tiamat gives them to Kingu as her champion. Marduk captures them after defeating Tiamat, confirming his supremacy. The concept of written cosmic destiny is paralleled in the Hebrew "Book of Life" and in the Egyptian *Tat nṯr* (divine decree).',
              parallels: [
                { label: 'Book of Life (Hebrew)', note: 'The celestial book in which names are written for life or death; same "fate recorded in writing" theological grammar.' },
                { label: 'Heavenly tablets (Jubilees)', note: 'The Jubilees tradition of heavenly tablets recording cosmic history and law; same celestial-writing motif.' },
              ]
            }
          ]
        },
      ]
    },
    {
      heading: 'Marduk — The Champion',
      verses: [
        { ref: 'I.100–102', text: 'He who begat him was Ea; his mother was Damkina. Within the deep was he conceived, within the pure abode was he born.',
          entities: [
            { word: 'deep', node: 'cosmic-ocean', type: 'symbol',
              note: 'Marduk is born within the primordial deep — from the chaos-waters themselves. The champion of cosmic order is born from the very substance he will defeat. This is the same paradox as the Egyptian Horus (born of Osiris who was destroyed by chaos) and the Christian Logos (born into the world to redeem it).',
              parallels: []
            },
            { word: 'Marduk', node: 'marduk', type: 'deity',
              note: 'The patron god of Babylon and the hero of the Enuma Elish. Born from Ea (Enki) and Damkina, he is appointed champion of the gods against Tiamat. His defeat of Tiamat and construction of heaven and earth from her body is the cosmogonic act. Marduk\'s rise to supremacy in the Babylonian pantheon is encoded in the story: he receives all fifty names of the gods.',
              parallels: [
                { label: 'Elohim (Genesis 1)', textId: 'genesis-1', note: 'Both are the primary divine agent imposing order on primordial chaos; the combat myth in Enuma Elish is "demythologized" in Genesis to become divine speech commanding separation.' },
                { label: 'Baal (Ugaritic Baal Cycle)', note: 'Baal defeats Yam (Sea) as Marduk defeats Tiamat; the storm-god defeating the chaos-sea is a shared Semitic pattern.' },
              ]
            }
          ]
        },
      ]
    },
  ]
};

// ── DESCENT OF INANNA (opening) ───────────────────────────────────────────────
SCRIPTURE_TEXTS['descent-inanna'] = {
  id: 'descent-inanna',
  title: 'The Descent of Inanna',
  shortTitle: 'Descent of Inanna',
  corpus: 'Sumerian',
  tradId: 'tradition-sumerian-mesopotamian',
  date: 'c. 2100–1700 BCE (Ur III to Old Babylonian period)',
  docNode: 'phase-1-017-descent-of-inanna',
  language: 'Sumerian · adapted from ETCSL / Wolkstein-Kramer',
  translations: [
    { id: 'etcsl',    label: 'ETCSL (English)', note: 'Electronic Text Corpus of Sumerian Literature adaptation — scholarly English' },
    { id: 'sumerian', label: 'Sumerian',         note: 'ETCSL transliteration of the cuneiform original — one of the world\'s oldest written languages' },
  ],
  intro: 'The oldest narrative of a divine descent into the underworld and return. Inanna, Queen of Heaven, abandons her heavenly domains and descends through seven gates to the land of the dead, ruled by her sister Ereshkigal. The myth is the earliest form of the dying-and-rising deity cycle, whose later expressions include Adonis (Phoenician-Greek) and the Osiris myth (Egyptian).',
  crossTradition: [
    { label: 'Adonis (Greek-Phoenician)', note: 'Adonis = Dumuzi/Tammuz, received by Persephone = Ereshkigal. The structure is preserved through Phoenician transmission into the Greek Adonia festival.' },
    { label: 'Persephone (Greek)', note: 'Same six-months above / six-months below structure; Persephone = Inanna; Hades = Ereshkigal\'s underworld.' },
    { label: 'Christ Descensus ad Inferos', note: 'Christ\'s descent to hell and resurrection is the Christian application of the same dying-and-rising grammar.' },
  ],
  sections: [
    {
      heading: 'Inanna Abandons Heaven',
      verses: [
        { ref: 'lines 1–4', text: 'From the great heaven she set her mind toward the great below. From the great heaven the goddess set her mind toward the great below. From the great heaven Inanna set her mind toward the great below.',
          textVersions: {
            etcsl:    'From the great heaven she set her mind toward the great below. From the great heaven the goddess set her mind toward the great below. From the great heaven Inanna set her mind toward the great below.',
            sumerian: 'an-gal-ta kur-gal-še₃\nĝeštug₂-ga-ni na-an-gub\nan-gal-ta nin-e kur-gal-še₃\nĝeštug₂-ga-ni na-an-gub\nan-gal-ta d inanna-ke₄ kur-gal-še₃\nĝeštug₂-ga-ni na-an-gub\n[from-heaven-great toward-underworld-great]\n[ear/attention-her she-fixed]\n[from-heaven-great the-lady toward-underworld-great]\n[ear-her she-fixed]\n[from-heaven-great INANNA toward-underworld-great]\n[ear-her she-fixed]',
          },
          entities: [
            { word: 'Inanna', node: 'inanna-sumerian', type: 'deity',
              note: 'Queen of Heaven and Earth; goddess of love, war, and the morning/evening star (Venus). Her descent to the Kur (the Great Below) is the oldest surviving narrative of divine death and return. The Venus connection is literal: the myth encodes Venus\'s astronomical cycle — disappearing at inferior conjunction (= Inanna\'s descent) and rising as Morning Star (= her return).',
              parallels: [
                { label: 'Aphrodite / Adonis (Greek)', note: 'Aphrodite = Inanna; her mourning for Adonis = Inanna\'s mourning for Dumuzi. The Adonia festival in Athens re-enacted this mourning.' },
                { label: 'Ishtar (Akkadian)', note: 'Inanna\'s Akkadian counterpart; the Akkadian version of the Descent is the second-oldest form of the myth.' },
                { label: 'Quetzalcoatl-Venus (Aztec)', note: 'Venus as deity who dies and rises; independent parallel — the astronomical cycle generates parallel theology on two continents.' },
              ]
            },
            { word: 'great below', node: 'underworld-mythology', type: 'theme',
              note: 'The Kur (Sumerian) = the underworld, land of the dead, realm of no return. Ruled by Inanna\'s sister Ereshkigal. The underworld in ancient Near Eastern cosmology is not primarily a place of punishment but of cessation — the dead eat dust, drink from clay, live without light. Inanna\'s goal in descending is obscure; she prepares by bringing the seven *me* (divine powers). Her descent and return is the template for all subsequent dying-and-rising deity cycles.',
              parallels: [
                { label: 'Hades / Greek underworld', note: 'Persephone\'s six-months below is structurally identical to Inanna\'s descent; direct transmission through Phoenician-Greek cultural contact.' },
              ]
            }
          ]
        },
        { ref: 'lines 5–10', text: 'My lady abandoned heaven, abandoned earth, and descended to the underworld. Inanna abandoned heaven, abandoned earth, and descended to the underworld. She abandoned her offices of en-priestess, abandoned her offices of queen, and descended to the underworld.',
          entities: []
        },
      ]
    },
    {
      heading: 'Ninshubar — "If I do not return"',
      verses: [
        { ref: 'lines 84–90', text: 'Inanna spoke to Ninshubar: "O Ninshubar, my constant support, my sukkal who gives me wise advice — if I do not return from the underworld after three days and three nights, beat the drum for me in the assembly places."',
          entities: [
            { word: 'three days and three nights', node: 'three-days-motif', type: 'theme',
              note: 'Inanna\'s underworld sojourn lasts three days and three nights — the same interval as the Venus inferior conjunction (when Venus disappears from view). The same three-day template appears in: Jonah\'s three days in the fish; Osiris\'s three days dead before Isis reassembles him; Christ\'s three days in the tomb. Whether these are independent astronomical observations or a transmitted motif is debated.',
              parallels: [
                { label: 'Christ — three days in the tomb', note: '"On the third day he rose again" — the New Testament resurrection timeline uses the same three-day interval.' },
                { label: 'Jonah — three days in the fish', note: 'Matthew 12:40 explicitly reads Jonah\'s three days as a type of the resurrection.' },
              ]
            }
          ]
        },
      ]
    },
    {
      heading: 'The Seven Gates',
      verses: [
        { ref: 'lines 120–130', text: 'When Inanna arrived at the outer gate of the underworld, she knocked on the door with great authority. She called out to the gatekeeper: "Open the house, gatekeeper, open the house! I am alone and I would enter."',
          entities: [
            { word: 'seven gates', node: 'descensus-seven-gates', type: 'theme',
              note: 'At each of the seven gates, Inanna is stripped of one of her divine powers (*me*): her crown, her lapis lazuli scepter, her beads, her breastplate, her gold ring, her pectoral, and finally her royal robe. Naked and bowed low, she enters the presence of Ereshkigal. The seven-gate stripping is: (1) an astrological encoding (seven celestial spheres stripped as the soul descends); (2) a rebirth template (to be reborn, the divine must die completely); (3) the origin of all "descent to the underworld" mystical theology.',
              parallels: [
                { label: 'Dante\'s Inferno — nine circles', note: 'The structured descent through levels is the same pattern; Dante\'s Virgil = Ninshubar as the guardian who accompanies.' },
                { label: 'Kabbalistic Sitra Achra', note: 'The qliphoth (shells) that must be stripped away for divine light to penetrate; same stripping-of-veils structure.' },
              ]
            }
          ]
        },
        { ref: 'lines 155–162', text: 'Ereshkigal fastened on Inanna the eye of death. She spoke against her the word of wrath. She uttered against her the cry of guilt. She struck her. Inanna was turned into a corpse, a piece of rotting meat, and was hung from a hook on the wall.',
          entities: [
            { word: 'Ereshkigal', node: 'ereshkigal', type: 'deity',
              note: 'Queen of the Great Below; Inanna\'s sister. The two goddesses represent the poles of the Sumerian divine feminine: Inanna (love, war, heaven, Venus) and Ereshkigal (death, earth, the underworld). The conflict between sisters mirrors the conflict between life and death at the cosmological level.',
              parallels: [
                { label: 'Persephone / Hades (Greek)', note: 'Persephone = Inanna in the underworld role; Hades = the undivided Greek version of the Ereshkigal domain.' },
              ]
            }
          ]
        },
      ]
    },
    {
      heading: 'Resurrection',
      verses: [
        { ref: 'lines 270–280', text: 'The food of life they sprinkled upon her. The water of life they poured upon her. Inanna arose.',
          entities: [
            { word: 'food of life', node: 'amrita-elixir', type: 'symbol',
              note: 'The *food of life* and *water of life* — the resurrective substance. This motif is one of the most widely distributed in world religion: Soma (Vedic), Amrita (Hindu), Ambrosia (Greek), the Elixir of Life (alchemical), the Water of Life (*ūdān el-ḥayāt*, Islamic), the Fountain of Youth. All encode the same theological hope: a substance that undoes death.',
              parallels: [
                { label: 'Amrita (Hindu Samudra Manthan)', note: 'The nectar of immortality churned from the cosmic ocean; same "life-substance from the deep" structure.' },
                { label: 'Eucharist (Christian)', note: 'The body and blood as "food of life" and "water of life" administered to the dead-and-risen body of Christ; same resurrective substance grammar.' },
              ]
            }
          ]
        },
      ]
    },
  ]
};

// ── MEMPHITE THEOLOGY (SHABAKA STONE) ────────────────────────────────────────
SCRIPTURE_TEXTS['memphite-theology'] = {
  id: 'memphite-theology',
  title: 'The Memphite Theology',
  shortTitle: 'Memphite Theology',
  corpus: 'Ancient Egyptian scripture',
  tradId: 'tradition-ancient-egypt',
  date: 'c. 700 BCE copy (Shabaka Stone); composition possibly Old Kingdom c. 2700–2200 BCE',
  language: 'Late Egyptian hieroglyphic · paraphrase after Lichtheim (1973)',
  translations: [
    { id: 'lichtheim', label: 'English',  note: 'Paraphrase after Lichtheim (1973) — standard scholarly rendering' },
    { id: 'egyptian',  label: 'Egyptian', note: 'Transliteration of the Late Egyptian hieroglyphic text (Shabaka Stone)' },
  ],
  intro: 'The earliest documented logos theology — predating John 1:1 by at least 700 years. King Shabaka of the 25th Dynasty inscribed it on black granite (c. 700 BCE), claiming to copy a crumbling papyrus. The text recasts all Egyptian creation gods as aspects of Ptah, whose heart (thought) and tongue (spoken word) are the twin principles of creation — the same structure as the Greek logos and the Hebrew dabar.',
  crossTradition: [
    { label: 'Genesis 1:3 — "And God said"', textId: 'genesis-1', note: 'The same grammar: divine word as the engine of creation. The Memphite Theology is the oldest known explicit statement of this theology.' },
    { label: 'John 1:1 — "In the beginning was the Logos"', note: 'Heart (thought) + tongue (word) = logos. Scholars trace the Johannine logos tradition through Philo of Alexandria, steeped in Egyptian Hellenistic thought.' },
    { label: 'Enuma Elish — Marduk creates by word', textId: 'enuma-elish-1', note: 'Three independent traditions — Egyptian, Mesopotamian, Hebrew — each arrive at the spoken divine word as the cosmogonic principle.' },
  ],
  sections: [
    {
      heading: 'Heart and Tongue: The Creative Principles',
      verses: [
        { ref: 'col. 48', text: 'There came into being as the heart and there came into being as the tongue something in the form of Atum. The mighty great one is Ptah, who transmitted life to all gods through this heart — by which Horus became Ptah — and through this tongue — by which Thoth became Ptah.',
          textVersions: {
            lichtheim: 'There came into being as the heart and there came into being as the tongue something in the form of Atum. The mighty great one is Ptah, who transmitted life to all gods through this heart — by which Horus became Ptah — and through this tongue — by which Thoth became Ptah.',
            egyptian:  'jw ḫpr.w m jb  jw ḫpr.w m ns.t  m jrw n Jtm\nwr.w wr Ptḥ  dj-ꜥnḫ nṯr.w nb.w\nm jb pn  jw Ḥr.w ḫpr m Ptḥ\nm ns.t tn  jw Ḏḥwtj ḫpr m Ptḥ\n[came-to-be as heart]  [came-to-be as tongue]  [in-likeness of Atum]\n[greatest great Ptah]  [gave-life gods all]\n[through heart this: Horus became Ptah]\n[through tongue this: Thoth became Ptah]',
          },
          entities: [
            { word: 'Ptah', node: 'ptah', type: 'deity',
              note: 'The craftsman god of Memphis and the deepest creative ground in this text. Ptah creates through heart (thought) and tongue (word). This logos theology predates John 1:1 by at least 700 years.',
              parallels: [
                { label: 'Logos (John 1:1)', note: '"In the beginning was the Word" — the same theological structure: the divine word as the creator of all things.' },
                { label: '"God said" (Genesis 1:3)', textId: 'genesis-1', note: 'Creation by divine speech — the structural parallel that makes this the oldest known antecedent to biblical creation theology.' },
              ]
            },
            { word: 'Atum', node: 'atum', type: 'deity',
              note: 'The self-created god of Heliopolis, the first being to emerge from Nun (the primordial waters). In this text Ptah and Atum are synthesized: two competing Egyptian creation traditions unified, with Ptah as the deeper ground.',
              parallels: [
                { label: 'God (Genesis 1:1)', textId: 'genesis-1', note: 'Both Atum and Elohim are the primary divine agent who orders the primordial waters into creation.' },
              ]
            },
            { word: 'Horus', node: 'horus-egyptian', type: 'deity',
              note: 'The sky god, divine prototype of the Pharaoh. "Horus becomes Ptah through the heart" — all Egyptian gods are reinterpreted as manifestations of Ptah\'s thought.',
              parallels: []
            },
            { word: 'Thoth', node: 'thoth-egyptian', type: 'deity',
              note: 'God of wisdom and writing — the deity most associated with language. "Thoth becomes Ptah through the tongue." Thoth is the Egyptian deity Greek settlers identified with Hermes, producing Hermes Trismegistus and the Hermetic tradition.',
              parallels: [
                { label: 'Hermes Trismegistus (Hermetica)', note: 'Hermes + Thoth = the fusion that generated the Hermetic corpus. Thoth\'s role as divine tongue here is the Egyptian root.' },
              ]
            },
          ]
        },
        { ref: 'col. 50–51', text: 'Thus heart and tongue gained power over all other members of the body — teaching that Ptah is in every body and in every mouth of all gods, all people, all cattle, all creeping things, and everything that lives. By thinking and commanding all that he wishes.',
          textVersions: {
            lichtheim: 'Thus heart and tongue gained power over all other members of the body — teaching that Ptah is in every body and in every mouth of all gods, all people, all cattle, all creeping things, and everything that lives. By thinking and commanding all that he wishes.',
            egyptian:  'ꜥḥꜥ.n jb ns.t sḫm.n.sn r ḥꜥ.w nb.w\nsḏm.n.sn  jw Ptḥ m ḥꜥ nb m r nb\nn nṯr.w nb.w  rm.ṯ nb.w  nḥs.yw nb.w\nꜥ.wt nb.t  ḫpr.w nb.w\nm jrj jb  jrj ns.t\n[thus heart tongue gained-power over members all]\n[teaching: Ptah is in body all in mouth all]\n[of gods all  people all  animals all  living-things all]\n[by-doing of-heart  by-doing of-tongue]',
          },
          entities: [
            { word: 'heart', node: 'creation-by-word', type: 'theme',
              note: 'The Egyptian heart (jb) = the seat of thought and intelligence. The pairing heart (thought) + tongue (speech) as twin creative principles is the most explicit pre-Greek logos theology. Greek logos = both "reason" and "word" — the same duality as the Memphite heart-and-tongue.',
              parallels: [
                { label: 'Logos (John 1:1)', note: 'Greek logos = "word" (tongue) + "reason" (heart). The Memphite heart-and-tongue is the Egyptian root of this dual meaning.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'Creation by Command',
      verses: [
        { ref: 'col. 53', text: 'Thus were made all work and all crafts — the action of the arms, the movement of the legs, and the activity of every member — in conformance with this command which the heart conceived and which came forth through the tongue.',
          textVersions: {
            lichtheim: 'Thus were made all work and all crafts — the action of the arms, the movement of the legs, and the activity of every member — in conformance with this command which the heart conceived and which came forth through the tongue.',
            egyptian:  'ꜥḥꜥ.n ḫpr kꜣ.t nb.t  bꜣk.t nb.t\nqd n ꜥ.wy  nm.t n rd.wy\nḥr.t nb.t n ꜥ.w nb.w\nm md.t nt jb  jmj.t ṯs.t ns.t\n[thus came-to-be work all  craft all]\n[building of arms  walking of legs]\n[activity all of members all]\n[by word-of heart  which-is-in utterance-of tongue]',
          },
          entities: [
            { word: 'command', node: 'creation-by-word', type: 'theme',
              note: 'The divine command (md.t = word) conceived by the heart and spoken through the tongue. The same structure as the Hebrew dabar and the Greek logos — the word that does not merely describe but enacts.',
              parallels: [
                { label: '"And God said" (Genesis 1:3)', textId: 'genesis-1', note: 'Hebrew yəhî ("let there be") = the divine imperative that the Memphite Theology calls "command of the heart through the tongue."' },
                { label: 'Logos (John 1:1)', note: '"The Word was God" — the Memphite Theology is the oldest known explicit theological statement of this structure.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Rest of Ptah',
      verses: [
        { ref: 'col. 58', text: 'Thus Ptah was satisfied after he had made everything, as well as all the divine order. He had formed the gods, he had made their sanctuaries, he had established their offerings. His strength is greater than that of all the gods.',
          textVersions: {
            lichtheim: 'Thus Ptah was satisfied after he had made everything, as well as all the divine order. He had formed the gods, he had made their sanctuaries, he had established their offerings. His strength is greater than that of all the gods.',
            egyptian:  'jw Ptḥ ḥtp.f  m-ḫt jr.n.f ḫt nb.t\nḥnꜥ nṯr.w nb.w\nsnḏm.n.f nṯr.w\nqd.n.f ḥw.wt-nṯr\njw.f jr.n.f ḥtp.w-nṯr\njw gm.n.f  wḏ.n.f  sḫm.n.f r nṯr.w nb.w\n[Ptah was-satisfied  after-he-made things all]\n[together with gods all]\n[he-settled gods  he-built temples]\n[he-established offerings]\n[thus found  greater than gods all]',
          },
          entities: [
            { word: 'satisfied', node: 'shabbat-theology', type: 'theme',
              note: 'Ptah "rests" (is satisfied) after completing creation — a structural parallel to Genesis 2:2 where God "rested on the seventh day." Divine satisfaction/rest after completing creation appears in Egyptian (Ptah), Hebrew (YHWH/Sabbath), and Mesopotamian (the gods rest after humanity is created) traditions independently.',
              parallels: [
                { label: 'Sabbath / Genesis 2:2', textId: 'genesis-1', note: '"He rested on the seventh day from all his work" — divine satisfaction after completion, centuries later.' },
                { label: 'Marduk (Enuma Elish VII)', textId: 'enuma-elish-1', note: 'After creating humanity to serve the gods, the gods rest in Marduk\'s temple — the same divine-rest-after-creation structure.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── GOSPEL OF JOHN 1:1–18 ────────────────────────────────────────────────────
SCRIPTURE_TEXTS['john-1'] = {
  id:         'john-1',
  title:      'Gospel of John 1:1–18',
  shortTitle: 'John 1',
  corpus:     'New Testament · Greek-Christian',
  tradId:     'tradition-early-christianity',
  date:       'c. 90–110 CE',
  docNode:    'phase-3-020-gospel-of-john',
  language:   'Greek Koine · King James Version (1611)',
  translations: [
    { id: 'kjv',   label: 'KJV (1611)',  note: 'King James Version — standard English rendering' },
    { id: 'greek', label: 'Greek (NT)',  note: 'Koine Greek New Testament (Byzantine base) with transliteration + gloss — original language of composition' },
  ],
  intro: 'The most philosophically loaded 18 verses in the New Testament. The opening ἐν ἀρχῇ ἦν ὁ λόγος ("In the beginning was the Logos") deliberately echoes the LXX Genesis 1:1, recasting the creator-God as the personified Logos — divine Reason-Word. The Logos arrives in Christian theology via three converging streams: (1) Stoic cosmology (Logos as divine rational fire pervading all reality); (2) Philo of Alexandria, who identified the Logos with the divine "image" in Gen 1:26; (3) the Hebrew Wisdom tradition, where personified Wisdom was present at creation (Proverbs 8:22–31). The Prologue ends (1:14) with the single most radical claim in religious history: "the Logos became flesh" — pure divine Reason incarnating in a body, something no Stoic or Platonist could accept.',
  crossTradition: [
    { label: 'Genesis 1:1 (Hebrew Bible)',        textId: 'genesis-1',       note: '"In the beginning" deliberately echoes Gen 1:1; the Logos replaces divine speech as the agent of creation.' },
    { label: 'Memphite Theology (Egyptian)',       textId: 'memphite-theology', note: 'Ptah\'s heart (thought) + tongue (word) = the Logos structure, at least 700 years earlier.' },
    { label: 'Poimandres (Hermetic)',              textId: 'poimandres',      note: 'Same cosmogonic grammar: pre-creation light/darkness, divine Word ordering chaos, divine Man descending into creation.' },
    { label: 'Nasadiya Sukta (Rig Veda 10.129)',  textId: 'nasadiya-sukta',  note: '"That One breathed by its own nature" — the pre-verbal logos equivalent in the Vedic tradition.' },
    { label: 'Tao Te Ching Ch. 1 (Daoist)',       textId: 'tao-te-ching-1',  note: 'The nameless Tao as the origin of heaven and earth parallels the pre-existent Logos before naming/creation.' },
  ],
  sections: [
    {
      heading: 'The Pre-existent Logos',
      verses: [
        { ref: '1:1',
          text: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
          textVersions: {
            kjv:   'In the beginning was the Word, and the Word was with God, and the Word was God.',
            greek: 'Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος.\nEn archē ēn ho logos, kai ho logos ēn pros ton theon, kai theos ēn ho logos.\n[In beginning] [was] [the Logos/Word] [and] [the Logos] [was] [with/toward] [the God] [and] [God] [was] [the Logos]\n\nNote: logos (λόγος) = "word" (spoken utterance) AND "reason" (rational principle). The KJV chose "Word"; a Stoic would have said "Reason." The deliberate ambiguity holds both. En archē echoes the LXX Genesis 1:1 exactly — this is a re-reading of the creation account. "The Word was God" AND "the Word was with God" in the same sentence generates 300 years of Christological controversy culminating at Nicaea 325 CE.',
          },
          entities: [
            { word: 'Word', node: 'logos-johannine', type: 'theme',
              note: 'Greek: λόγος (logos) = "word" + "reason." In Stoic philosophy the Logos is the divine rational principle pervading all reality, identical to Zeus/God, present as seed-reason (logos spermatikos) in every human soul. In Philo of Alexandria (c. 20 BCE), the Logos becomes the "image of God," the divine intermediary between the infinite and the finite, the agent of all creation. John identifies this cosmic Logos with Jesus Christ — the rational principle of the philosophers becomes a specific historical person. The "Word was God" AND "with God" is the Johannine seed of Trinitarian theology.',
              parallels: [
                { label: 'Ptah\'s tongue (Memphite Theology)', textId: 'memphite-theology', note: 'The divine tongue as creative instrument — oldest explicit logos theology, 700 years before John.' },
                { label: 'Logos Spermatikos (Stoic)', note: 'Zeno, Cleanthes, Chrysippus: the divine rational fire as the unifying principle of all existence, seed of reason in every human soul.' },
                { label: 'Logos of Philo (Jewish-Alexandrian)', note: 'Philo\'s Logos as "eldest Son of God" and agent of creation — the direct philosophical bridge to the Johannine Prologue.' },
                { label: 'Nous Poimandres (Hermetic)',          textId: 'poimandres', note: 'Poimandres = "the Mind of the Sovereignty" — same transcendent rational ground as the Johannine Logos.' },
                { label: 'Vāc — Sacred Speech (Rig Veda)',     textId: 'nasadiya-sukta', note: 'RV 10.125: the goddess Vāc ("sacred speech") declares "I was in the beginning" — pre-existent divine Speech as creative principle.' },
              ]
            },
          ]
        },
        { ref: '1:3',
          text: 'All things were made by him; and without him was not any thing made that was made.',
          textVersions: {
            kjv:   'All things were made by him; and without him was not any thing made that was made.',
            greek: 'πάντα δι᾿ αὐτοῦ ἐγένετο, καὶ χωρὶς αὐτοῦ ἐγένετο οὐδὲ ἕν.\npanta di autou egeneto, kai chōris autou egeneto oude hen.\n[All things] [through him] [came-to-be], [and] [without him] [came-to-be] [not one thing]\n\nNote: di autou = "through him" — the Logos is the INSTRUMENT, not the origin. Reflects Philo\'s model: God is transcendent; the Logos is the active creative agent. This distinction becomes the Arian controversy: is the Logos co-eternal with God or a created intermediary?',
          },
          entities: [
            { word: 'made', node: 'creation-by-word', type: 'theme',
              note: 'All creation "through" the Logos. Three independent traditions arrive at the same point: Egyptian (Ptah\'s tongue commands → existence), Hebrew ("God said" → existence), Greek (Logos as rational seed-principle → ordered world). John synthesises all three: the Logos IS the divine speech of Genesis AND the rational principle of the Stoics AND the intermediary of Philo.',
              parallels: [
                { label: '"God said" — Genesis 1:3',          textId: 'genesis-1',        note: 'Divine speech brings things into being. John: all such speech IS the Logos.' },
                { label: 'Ptah\'s tongue — Memphite Theology', textId: 'memphite-theology', note: 'The tongue commands, all things come into being. Same causal grammar: word → existence.' },
                { label: 'Logos separates elements (Poimandres)', textId: 'poimandres',   note: 'CH I: the holy Logos stands upon the waters and separates the elements — same role as John\'s Logos.' },
              ]
            },
          ]
        },
        { ref: '1:4–5',
          text: 'In him was life; and the life was the light of men. And the light shineth in darkness; and the darkness comprehended it not.',
          textVersions: {
            kjv:   'In him was life; and the life was the light of men. And the light shineth in darkness; and the darkness comprehended it not.',
            greek: 'ἐν αὐτῷ ζωὴ ἦν, καὶ ἡ ζωὴ ἦν τὸ φῶς τῶν ἀνθρώπων· καὶ τὸ φῶς ἐν τῇ σκοτίᾳ φαίνει, καὶ ἡ σκοτία αὐτὸ οὐ κατέλαβεν.\nNote: katelaben (κατέλαβεν) = BOTH "comprehend" (intellectual) AND "overcome/seize" (physical) — deliberate double meaning. The darkness neither understood the light nor could conquer it. This verse generates the light-vs-darkness dualisms of Gnosticism, Manichaeanism, and Western esoteric thought.',
          },
          entities: [
            { word: 'darkness', node: 'primordial-darkness', type: 'symbol',
              note: 'The same pre-creation darkness as Genesis 1:2 — but now characterised as active opposition to the Logos-light. The theological move that generates Gnostic dualism: darkness is not merely the pre-creation state but a force that fails to seize/comprehend the light. Poimandres opens with the same image: a downward-tending, snake-like darkness opposing the divine light. In Manichaean theology this becomes radical dualism — Light vs. Darkness as eternal co-equal first principles.',
              parallels: [
                { label: 'Genesis 1:2 — darkness on the deep', textId: 'genesis-1',      note: 'Same pre-logos darkness; John adds the combat dimension.' },
                { label: 'Poimandres — the downward darkness', textId: 'poimandres',     note: 'CH I: dreadful, snake-like darkness descending upon the primordial light — same light-darkness confrontation.' },
                { label: 'Nasadiya Sukta — tamas in tamas',    textId: 'nasadiya-sukta', note: '"Darkness concealed in darkness" — same pre-creation darkness, Vedic tradition, no combat narrative.' },
                { label: 'Manichaean dualism',                 note: 'Mani read John 1:5 as the charter for cosmic dualism: eternal war of the Realm of Light vs. the Realm of Darkness.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Witness',
      verses: [
        { ref: '1:6–8',
          text: 'There was a man sent from God, whose name was John. The same came for a witness, to bear witness of the Light, that all men through him might believe. He was not that Light, but was sent to bear witness of that Light.',
          entities: [
            { word: 'John', node: 'john-the-baptist', type: 'person',
              note: 'The Prologue explicitly distinguishes: John was NOT the Logos-light, only its witness. This distinction is politically loaded — the community behind the Gospel of John had direct contact with Baptist sectarians (Mandaeans) who revered John as the supreme prophet and considered Jesus a false claimant. The Mandaean Book of John preserves a hostile portrayal of Jesus. The Gospel responds by demoting John to "the voice crying in the wilderness" — he prepares, he is not the thing itself.',
              parallels: [
                { label: 'Elijah — the returning prophet', note: 'John is cast in Elijah\'s role (Mal. 4:5); the herald-before-the-event is a pattern also in Zoroastrian (Saoshyant\'s precursor) and Buddhist (Maitreya\'s herald) eschatology.' },
                { label: 'Mandaean Book of John', note: 'The Mandaean tradition preserves John as the supreme prophet; the Gospel of John is partly a theological counter to this.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Universal Light',
      verses: [
        { ref: '1:9–11',
          text: 'That was the true Light, which lighteth every man that cometh into the world. He was in the world, and the world was made by him, and the world knew him not. He came unto his own, and his own received him not.',
          entities: [
            { word: 'Light', node: 'logos-stoic', type: 'theme',
              note: '"Lighteth EVERY man" — the most explicitly Stoic claim in the New Testament. Stoic philosophy held that every human soul contains a fragment of the divine Logos (logos spermatikos, "seed-reason"), which is why all humans have reason and can know moral truth. This verse is the foundation for: (1) natural law theory; (2) universal human dignity; (3) the Church Fathers\' claim that pagan philosophers had access to divine truth via the pre-incarnate Logos. Justin Martyr (c. 150 CE) used this verse to argue that Socrates was a "Christian before Christ."',
              parallels: [
                { label: 'Stoic logos spermatikos', note: 'The "seed-reason" in every human soul (Zeno, Marcus Aurelius) — the divine rational principle accessible to all humans.' },
                { label: 'Ātman = Brahman (Upanishads)', note: 'The inner self (ātman) identical with the universal ground (brahman) — same structure: universal divine light within every person.' },
                { label: 'Philo — Logos as divine image', note: 'Philo\'s Logos is the pattern in which all humans are made (Gen 1:26) — the universal template that "lightens every man."' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Incarnation',
      verses: [
        { ref: '1:14',
          text: 'And the Word was made flesh, and dwelt among us, and we beheld his glory, the glory as of the only begotten of the Father, full of grace and truth.',
          textVersions: {
            kjv:   'And the Word was made flesh, and dwelt among us, and we beheld his glory, the glory as of the only begotten of the Father, full of grace and truth.',
            greek: 'Καὶ ὁ λόγος σὰρξ ἐγένετο καὶ ἐσκήνωσεν ἐν ἡμῖν...\nKai ho logos sarx egeneto kai eskēnōsen en hēmin...\n[And the Logos flesh became, and tabernacled among us]\n\nNote: eskēnōsen = "tabernacled / pitched his tent among us" — deliberate echo of the Shekinah dwelling in the Wilderness Tabernacle (Exod 25:8). Greek skēnē (tent) = Hebrew mishkan (tabernacle). The Logos becomes the new Tabernacle: the divine presence that was once architecturally housed now walks in a body.',
          },
          entities: [
            { word: 'flesh', node: 'dying-rising-god', type: 'theme',
              note: '"The Logos became flesh" — the single most radical claim in religious history. Pure divine Reason fully incarnates in a mortal body. The Docetists and Gnostics rejected this entirely — their Jesus only *seemed* to have a body (Greek dokeō = "to seem"). John insists on sarx (flesh = mortal matter). The closest structural parallels are the Vedic avatar doctrine (Vishnu descends fully into human form as Krishna, Rama) and the Hermetic Anthropos myth (the divine Man descends into matter and becomes entangled with it). All three encode the same paradox: the divine fully within the mortal.',
              parallels: [
                { label: 'Avatar doctrine (Bhagavad Gita 4.7)', textId: 'bhagavad-gita-4', note: 'Krishna: "I send myself forth" — divine descent into flesh, from age to age.' },
                { label: 'Anthropos (Poimandres CH I)',          textId: 'poimandres',      note: 'The Hermetic Primordial Man descends into matter — same divine-in-mortal paradox, opposite direction.' },
                { label: 'Inanna\'s Descent (Sumerian)',         textId: 'descent-inanna',  note: 'The divine descending into death — same grammar of divinity entering the realm below.' },
              ]
            },
          ]
        },
        { ref: '1:17–18',
          text: 'For the law was given by Moses, but grace and truth came by Jesus Christ. No man hath seen God at any time; the only begotten Son, which is in the bosom of the Father, he hath declared him.',
          entities: [
            { word: 'truth', node: 'wisdom-personified', type: 'theme',
              note: '"Grace and truth" (charis kai alētheia) echoes the Hebrew chesed ve-emet (lovingkindness and faithfulness) — YHWH\'s covenant character pair (Exod 34:6). Connects to the Hebrew Wisdom tradition (Proverbs 8:22–31; Sirach 24) where personified Wisdom (Hokmah/Sophia) offers herself as the true Torah. Philo had already identified the Logos with Torah as the divine blueprint of creation. John completes the move: Christ-Logos supersedes Torah. The Wisdom who was "beside him as a master workman" at creation is now identical with the incarnate Word.',
              parallels: [
                { label: 'Sophia — Wisdom (Proverbs 8)', note: '"Wisdom was beside him as a master workman" (Prov 8:30) — the pre-existent divine Wisdom at creation is the Hebrew antecedent of the Johannine Logos.' },
                { label: 'Torah as Logos (Philo)', note: 'Philo identified the Logos with the Torah as the divine blueprint of creation; John replaces Torah with Christ-Logos.' },
              ]
            },
            { word: 'God', node: 'the-trinity', type: 'theme',
              note: '"No man hath seen God at any time" — radical divine apophasis shared with: Kabbalistic Ein Sof (the Infinite beyond all direct perception, known only through the Sefirot); Plotinus\'s The One (beyond being and thought, known only through its first emanation, the Nous); Islamic tanzīh (radical transcendence). The "only begotten Son" who alone knows the Father — monogenes (μονογενής) — is the Johannine seed of Trinitarian theology: two persons within one God, the Father beyond all sight, the Son his sole declarer.',
              parallels: [
                { label: 'Ein Sof (Kabbalistic)', note: 'The Infinite that no eye can see, knowable only through the Sefirot — the divine ground beyond access, known through a mediating emanation.' },
                { label: 'The One (Plotinus)', note: 'The One is beyond being, beyond thought — known only through its first emanation, the Nous. Same structure as Father/Son.' },
                { label: '"The Tao that can be named" — Tao Te Ching 1', textId: 'tao-te-ching-1', note: 'The Tao that cannot be directly perceived, only intimated through its expressions — same apophatic ground.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── RIG VEDA 10.129 — NĀSADĪYA SŪKTA ────────────────────────────────────────
SCRIPTURE_TEXTS['nasadiya-sukta'] = {
  id:         'nasadiya-sukta',
  title:      'Rig Veda 10.129 — Nāsadīya Sūkta',
  shortTitle: 'Nāsadīya Sūkta',
  corpus:     'Vedic · Rig Veda',
  tradId:     'tradition-vedic-hinduism',
  date:       'c. 1500–1200 BCE (composition); canonical c. 1200 BCE',
  docNode:    'phase-1-031-rigveda',
  language:   'Sanskrit · R.T.H. Griffith translation (1896)',
  translations: [
    { id: 'griffith', label: 'Griffith (1896)', note: 'R.T.H. Griffith, Hymns of the Rigveda (1896) — public domain scholarly English' },
    { id: 'sanskrit', label: 'Sanskrit (IAST)', note: 'IAST transliteration of the Devanāgarī text with word-by-word gloss' },
  ],
  intro: 'The "Hymn of Creation" — perhaps the most philosophically sophisticated cosmogonic poem in the ancient world. Written in a spirit of radical uncertainty about the origin of existence, the Nāsadīya Sūkta (named from its first word: "neither was non-being") dares to ask whether even the gods know how creation began. Its seven verses move from the pre-creation void (before being and non-being, life and death, day and night), through the first stirring of Desire (kāma), to a final sceptical question: "He, the first origin of this creation — whether he formed it all or did not form it... he verily knows it, or perhaps he knows not." No other ancient cosmogony ends in agnosticism.',
  crossTradition: [
    { label: 'Genesis 1:2 (Hebrew)',         textId: 'genesis-1',      note: '"Darkness was upon the face of the deep" — same pre-creation darkness; Genesis credits Elohim; Nasadiya asks who knows.' },
    { label: 'Tao Te Ching Ch. 1 (Daoist)', textId: 'tao-te-ching-1', note: 'The nameless Tao as the origin of heaven and earth parallels the pre-verbal "That One" of verse 2.' },
    { label: 'John 1:4–5 (Christian)',       textId: 'john-1',         note: '"Darkness comprehended it not" is the Logos-response to exactly the uncertainty the Nasadiya expresses.' },
    { label: 'Poimandres (Hermetic)',         textId: 'poimandres',     note: 'The CH I vision opens in the same pre-creation void before the divine light breaks through.' },
    { label: 'Popol Vuh (Maya)',              textId: 'popol-vuh',      note: 'The Maya creation account opens in the same primordial darkness and calm silence before the first word is spoken.' },
  ],
  sections: [
    {
      heading: 'Before Being and Non-Being',
      verses: [
        { ref: '10.129.1',
          text: 'Then was not non-existent nor existent: there was no realm of air, no sky beyond it. What covered in, and where? and what gave shelter? Was water there, unfathomed depth of water?',
          textVersions: {
            griffith: 'Then was not non-existent nor existent: there was no realm of air, no sky beyond it. What covered in, and where? and what gave shelter? Was water there, unfathomed depth of water?',
            sanskrit:  'nā́sad āsīn nó sád āsīt tadā́nīṃ nā́sīd rájo nó víomā paró yat\nkím āvarīvaḥ kúha kásya śármann ámbhaḥ kím āsīd gáhanaṃ gabhīrám\n[not-non-being was nor being was-then]\n[not was realm-of-air nor sky beyond-it]\n[what covered where of-what shelter]\n[water — what was — fathomless deep?]\n\nNote: The opening nā́sad... nó sád = "neither non-being (asat) nor being (sat)" — the text begins before the being/non-being distinction itself. This is more radical than Genesis 1:1 (which assumes being: "In the beginning GOD CREATED") or even the Tao Te Ching (which names the Tao as the primordial ground). The Nasadiya refuses to grant the pre-creation state any predicate at all.',
          },
          entities: [
            { word: 'water', node: 'cosmic-ocean', type: 'symbol',
              note: 'The primordial question: "Was water there, unfathomed depth of water?" — the Vedic cosmic ocean as pre-creation substrate. The same deep waters appear in Genesis 1:2 (tehom/"the deep"), Enuma Elish (Apsu + Tiamat), the Memphite Theology (Nun), and the Popol Vuh ("only the sea alone pooled under all the sky"). Across five independent ancient traditions on three continents, the primordial state is waters — possibly because all early civilisations arose near water, possibly encoding a genuine cosmological intuition about formless potential.',
              parallels: [
                { label: 'tehom / the deep — Genesis 1:2',   textId: 'genesis-1',        note: '"Darkness was upon the face of the deep" — same pre-creation waters.' },
                { label: 'Apsu + Tiamat — Enuma Elish',      textId: 'enuma-elish-1',     note: 'The primordial commingling of fresh and salt water before the first gods are born.' },
                { label: 'The sea alone — Popol Vuh',         textId: 'popol-vuh',         note: '"Only the sea alone is pooled under all the sky" — same pre-creation waters, Maya tradition.' },
                { label: 'Nun (Egyptian primordial ocean)',   textId: 'memphite-theology', note: 'The undifferentiated primordial ocean from which Atum self-created.' },
              ]
            },
          ]
        },
        { ref: '10.129.2',
          text: 'Death was not then, nor was there aught immortal: no sign was there, the day\'s and night\'s divider. That One Thing, breathless, breathed by its own nature: apart from it was nothing whatsoever.',
          textVersions: {
            griffith: 'Death was not then, nor was there aught immortal: no sign was there, the day\'s and night\'s divider. That One Thing, breathless, breathed by its own nature: apart from it was nothing whatsoever.',
            sanskrit:  'ná mṛtyúr āsīd amŕ̥taṃ ná tárhi ná rā́tryā áhna āsīt praketáḥ\nānīd avātáṃ svadháyā tád ékaṃ tásmād dhānéna páram ányad ā́ na\n[not death was, not immortal then]\n[not night\'s nor day\'s was dividing-sign]\n[breathed (ānīd) windless (avātam) by-own-power (svadhayā) THAT ONE (tad ekam)]\n[from it by power — nothing else beyond]\n\nNote: ānīd avātam = "breathed, being windless" — the paradox of breathing without wind. tad ekam = "That One Thing" — neuter singular, the Absolute before it has a name. The Upanishads later identify this as brahman. "Breathing by its own nature" parallels the Hebrew ruaḥ ʾĕlōhîm hovering over the waters in Genesis 1:2.',
          },
          entities: [
            { word: 'One Thing', node: 'brahman-impersonal', type: 'theme',
              note: 'tad ekam — "That One Thing." The neuter singular absolute before any differentiation, before any name can be applied. The Upanishadic tradition identifies this as brahman (the impersonal Absolute, the ground of being). The Chandogya Upanishad (6.2.1) names it sat (pure Being): "In the beginning there was Being alone, one only, without a second." The Taoist "nameless origin," the Jewish Ein Sof (the Infinite before any name), and Plotinus\'s The One are all structural parallels: the absolute ground before any predicate.',
              parallels: [
                { label: 'Brahman — Chandogya 6.2.1',           textId: 'chandogya-621',   note: '"In the beginning there was Being alone, one only, without a second" — the same tad ekam, now named.' },
                { label: 'Tao — "nameless origin" (TTCh 1)',     textId: 'tao-te-ching-1',  note: '"Having no name, it is the Originator of heaven and earth" — the same pre-naming absolute.' },
                { label: 'Ein Sof (Kabbalistic)',                 note: 'The Infinite before any emanation, before any name or predicate — same apophatic absolute.' },
                { label: '"Spirit of God" — Genesis 1:2',         textId: 'genesis-1',       note: 'The Hebrew ruaḥ (breath/spirit) hovering over the primordial waters is functionally parallel to "That One breathed."' },
              ]
            },
          ]
        },
        { ref: '10.129.3',
          text: 'Darkness there was: at first concealed in darkness this All was indiscriminate chaos. All that existed then was void and formless: by the great power of Warmth was born that Unit.',
          textVersions: {
            griffith: 'Darkness there was: at first concealed in darkness this All was indiscriminate chaos. All that existed then was void and formless: by the great power of Warmth was born that Unit.',
            sanskrit:  'táma āsīt támasā gūḷhám ágre \'praketaṃ saliláṃ sárvam ā idám\ntuchyénābhv ápihitaṃ yád ā́sīt tápasas tán mahinā́jāyatáikam\n[Darkness was, by darkness concealed, in-the-beginning]\n[undiscriminated, all this was water-formless]\n[by void all-covered that which was]\n[by power-of-heat (tapas) it, by greatness, was-born — that-one]\n\nNote: tamas = darkness (also the Sanskrit term for the lowest guna — the principle of inertia/ignorance in Sāṃkhya philosophy). tapas = "heat, austerity, creative energy" — the first creative force, simultaneously cosmic heat AND ascetic energy: the cosmos was created by the same force as yogic self-transformation.',
          },
          entities: [
            { word: 'Darkness', node: 'primordial-darkness', type: 'symbol',
              note: 'tamas = "darkness concealed in darkness" — the darkness before the darkness-light distinction itself. This is the deepest pre-creation state across traditions: Gen 1:2 ("darkness upon the face of the deep"), John 1:5 ("the darkness comprehended it not"), Poimandres (the downward-tending snake-like darkness), Popol Vuh ("in the dark, in the night"), Tao Te Ching ("darkness within darkness"). Each processes the same pre-creation absence, but with different conclusions: Genesis has God over it, John has the Logos piercing through it, the Nasadiya simply describes it without resolution.',
              parallels: [
                { label: 'John 1:5 — "darkness comprehended it not"', textId: 'john-1',      note: 'John\'s darkness that cannot seize the light is this same pre-logos darkness, now given a theological function.' },
                { label: 'Poimandres — snake-like darkness',           textId: 'poimandres',  note: 'CH I: "a Darkness, dreadful and hateful, tortuous and snake-like" — same primordial darkness, Hermetic tradition.' },
                { label: '"Darkness within darkness" — Tao Te Ching',  textId: 'tao-te-ching-1', note: 'xuán zhī yòu xuán = "darkness within darkness, the gate of all wonders" — same ineffable pre-light ground.' },
              ]
            },
            { word: 'Warmth', node: 'cosmic-egg', type: 'symbol',
              note: 'tapas = "heat / creative austerity" — the impersonal cosmic energy that generates the primordial unit. The "Unit born from Warmth" is closely related to the Hiranyagarbha myth (the golden womb/egg from which Brahma was born, RV 10.121). This is the Vedic cosmic egg — the primordial form concentrating before the first burst of creation. Parallel cosmic-egg cosmogonies appear in: Orphic Greek religion (Phanes hatches from the Orphic egg), Finnish Kalevala (the world-egg), Chinese Pangu mythology (Pangu inside the cosmic egg). The idea that an initial concentration of energy precedes differentiated creation is possibly the oldest human cosmological intuition.',
              parallels: [
                { label: 'Hiranyagarbha — the golden egg (RV 10.121)', note: 'The "golden womb" from which creation hatches — the Vedic cosmic egg that concentrates primordial potential.' },
                { label: 'Orphic egg (Greek)',                          note: 'Phanes hatches from the primordial egg — same pre-creation concentration before the first divine being emerges.' },
              ]
            },
          ]
        },
        { ref: '10.129.4',
          text: 'Thereafter rose Desire in the beginning, Desire, the primal seed and germ of Spirit. Sages who searched with their heart\'s thought discovered the existent\'s kinship in the non-existent.',
          entities: [
            { word: 'Desire', node: 'creation-by-word', type: 'theme',
              note: 'kāma — the primal Desire or "will to be" as the first creative principle: creation by an impersonal drive rather than by personal divine command. The contrast with Genesis\'s "God said" is sharp — in the Nasadiya no one speaks, desire simply arises. Yet both locate the motor of creation in a principle that precedes the material world: Genesis in divine speech, the Nasadiya in cosmic desire. Hesiod\'s Theogony places Eros (Desire) as the second thing born after Chaos — the binding force that makes creation cohere. Dante\'s "Love that moves the sun and the other stars" (Paradiso XXXIII) echoes the same primordial-desire cosmogony.',
              parallels: [
                { label: '"God said" — Genesis 1:3',         textId: 'genesis-1', note: 'The Hebrew divine speech as creative principle — the Semitic parallel to kāma: a pre-material principle generating existence.' },
                { label: 'Eros (Hesiod Theogony)',           note: 'After Chaos, the second thing born was Eros (Desire) — the binding force making creation cohere. Same: desire as the cosmogonic second principle.' },
              ]
            },
          ]
        },
        { ref: '10.129.6–7',
          text: 'Who verily knows and who can here declare it, whence it was born and whence comes this creation? The Gods are later than this world\'s production. Who knows then whence it first came into being? He, the first origin of this creation, whether he formed it all or did not form it, Whose eye controls this world in highest heaven, he verily knows it, or perhaps he knows not.',
          textVersions: {
            griffith: 'Who verily knows and who can here declare it, whence it was born and whence comes this creation? The Gods are later than this world\'s production. Who knows then whence it first came into being? He, the first origin of this creation, whether he formed it all or did not form it, Whose eye controls this world in highest heaven, he verily knows it, or perhaps he knows not.',
            sanskrit:  'kó addhā́ veda ká ihá prá vocat kúta ā́jātā kúta iyáṃ vísṛṣṭiḥ\narvāg devā́ asyá visárjanenā́thā kó veda yáta ābabhū́va\niyáṃ vísṛṣṭir yáta ābabhū́va yádi vā dadhé yádi vā ná\nyó asyā́dhyakṣaḥ paramé víoman só aṅgá veda yádi vā ná véda\n[Who truly knows? Who here can declare it?]\n[Whence was it born? Whence this creation?]\n[The gods are later than this world\'s production —]\n[who then knows whence it came into being?]\n[he who surveys this in the highest heaven —]\n[he truly knows it, or perhaps he knows not]\n\nNote: "The Gods are later than this world\'s production" — the gods emerged from creation and so cannot know its origin. One of the oldest documented statements of the unknowability of the First Cause. Parallels: Kabbalistic Ein Sof (before the Sefirot, before all divine names — unknowable even to the divine); Plotinus\'s The One (even the gods cannot directly know it); Tao Te Ching ("The Tao that can be named is not the eternal Tao"); John 1:18 ("No man hath seen God at any time").',
          },
          entities: [
            { word: 'perhaps he knows not', node: 'apophatic-mysticism', type: 'theme',
              note: 'The final line — "he verily knows it, or perhaps he knows not" — is the oldest known statement of theological agnosticism. Even the supreme overseer of creation may not know its origin. This radical epistemic humility appears in: the Kabbalistic tradition (Ein Sof is beyond all divine knowledge even the Sefirot do not encompass it); Plotinus (The One is beyond self-knowledge in the ordinary sense); the Tao Te Ching ("The Tao that can be told is not the eternal Tao"); and Meister Eckhart ("I pray to God to free me from God"). The Nasadiya arrives at this position in 1500 BCE.',
              parallels: [
                { label: 'Ein Sof — the Infinite (Kabbalah)',         note: 'Not even divine self-knowledge reaches it in the usual sense.' },
                { label: 'The One — Plotinus',                         note: 'The One is "beyond being and beyond thought" — Plotinus\'s version of "perhaps he knows not."' },
                { label: '"The Tao that can be named" — TTC 1',        textId: 'tao-te-ching-1', note: 'The true ground is beyond any knowledge-claim.' },
                { label: '"No man hath seen God" — John 1:18',         textId: 'john-1',          note: 'God is invisible, knowable only through the Son — the theological answer to the question the Nasadiya leaves open.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── TAO TE CHING — CHAPTER 1 ─────────────────────────────────────────────────
SCRIPTURE_TEXTS['tao-te-ching-1'] = {
  id:         'tao-te-ching-1',
  title:      'Tao Te Ching — Chapter 1',
  shortTitle: 'Tao Te Ching 1',
  corpus:     'Daoist · Classical Chinese',
  tradId:     'tradition-daoism',
  date:       'c. 4th–3rd century BCE (attributed to Laozi)',
  docNode:    'laozi',
  language:   'Classical Chinese · James Legge translation (1891)',
  translations: [
    { id: 'legge',   label: 'Legge (1891)', note: 'James Legge, The Texts of Taoism (1891) — public domain scholarly English' },
    { id: 'chinese', label: 'Chinese',      note: 'Wang Bi recension of the received text (c. 226–249 CE) — standard Classical Chinese with pinyin romanisation' },
  ],
  intro: 'The opening chapter of the Tao Te Ching (c. 4th c. BCE, attributed to Laozi) is perhaps the most economical cosmological statement in world literature: 81 Chinese characters that define the ultimate ground of reality as something beyond all definition. The central claim — "The Tao that can be named is not the eternal Tao" — is the purest formulation of apophatic theology: the ground of existence is intrinsically beyond language and conception. This parallels the Kabbalistic Ein Sof (the Infinite before any divine name), Plotinus\'s The One (beyond being and thought), the Nasadiya Sukta\'s "perhaps he knows not," and Meister Eckhart\'s "Godhead behind God." The Tao is both the creative Mother of all things AND the nameless source preceding all naming — the same paradox as the Johannine Logos, which IS the divine Word but was present before any word.',
  crossTradition: [
    { label: 'Nasadiya Sukta (Vedic)',     textId: 'nasadiya-sukta', note: '"That One Thing" before all naming parallels the nameless Tao as the origin of heaven and earth.' },
    { label: 'John 1:1 (Christian)',       textId: 'john-1',         note: 'The pre-existent Logos before the Word was spoken parallels the Tao before the naming.' },
    { label: 'Chandogya 6.2.1 (Hindu)',    textId: 'chandogya-621',  note: '"Being alone, one only, without a second" — same pre-differentiation absolute as the nameless Tao.' },
    { label: 'Genesis 1:1–2 (Hebrew)',     textId: 'genesis-1',      note: 'The pre-creation void (tohu va-vohu) before God names light and darkness is the Hebrew functional equivalent of the nameless Tao.' },
    { label: 'Poimandres (Hermetic)',       textId: 'poimandres',     note: 'The pre-creation void before the first light — same primordial state the Tao describes as its nameless ground.' },
  ],
  sections: [
    {
      heading: 'The Nameless Origin',
      verses: [
        { ref: 'Ch. 1 (lines 1–4)',
          text: 'The Tao that can be trodden is not the enduring and unchanging Tao. The name that can be named is not the enduring and unchanging name. Conceived of as having no name, it is the Originator of heaven and earth; conceived of as having a name, it is the Mother of all things.',
          textVersions: {
            legge:   'The Tao that can be trodden is not the enduring and unchanging Tao. The name that can be named is not the enduring and unchanging name. (Conceived of as) having no name, it is the Originator of heaven and earth; (conceived of as) having a name, it is the Mother of all things.',
            chinese: '道可道，非常道。名可名，非常名。\n無名天地之始；有名萬物之母。\n\ndào kě dào, fēi cháng dào. míng kě míng, fēi cháng míng.\nwú míng tiān dì zhī shǐ; yǒu míng wàn wù zhī mǔ.\n\n[道 (Tao/Way) that-can be-spoken — not eternal Tao]\n[Name that-can be-named — not eternal name]\n[Without-name (wú míng): heaven-earth\'s beginning (shǐ)]\n[With-name (yǒu míng): ten-thousand-things\' mother (mǔ)]\n\nNote: 道 (dào) = "way, path, speech, reason" — the same ambiguity as Greek logos (word + reason). The character combines 首 (head/chief) + 辶 (walking/moving): "the chief way of moving through existence." The Tao is simultaneously the cosmic ordering principle, the way things naturally go, and — in many Western comparative readings — the Word/Reason that John calls Logos.',
          },
          entities: [
            { word: 'Tao', node: 'ein-sof', type: 'theme',
              note: 'The Tao (道) as the nameless Originator of heaven and earth — the closest Chinese parallel to: the Kabbalistic Ein Sof (the Infinite before any divine name or attribute); Plotinus\'s The One (beyond being and thought, source of all yet itself nothing); and the Nasadiya Sukta\'s tad ekam (That One Thing before all differentiation). The key structural feature shared by all: the ultimate ground cannot be named because naming implies definition, and definition implies limitation. For the Kabbalists: the Sefirot are how the Ein Sof becomes knowable. For Plotinus: the Nous is how the One becomes knowable. For the Tao: the "Mother" (the named Tao) is how the Nameless becomes accessible. For John: the Logos/Son is how the invisible Father is "declared."',
              parallels: [
                { label: 'Ein Sof (Kabbalistic)',         note: 'The Infinite before any name or predicate — known only through its emanations (the Sefirot).' },
                { label: 'The One (Plotinus)',             note: 'Beyond being, beyond knowledge, beyond naming — identical structure to the unnameable Tao.' },
                { label: 'Brahman / tad ekam (Nasadiya)', textId: 'nasadiya-sukta',  note: 'tad ekam = "That One Thing" — the pre-naming absolute of the Vedic tradition.' },
                { label: 'Pre-existent Logos (John 1:1)', textId: 'john-1',          note: 'The Logos was "in the beginning" before all naming — the divine ground precedes all its expressions.' },
              ]
            },
            { word: 'Mother', node: 'wisdom-personified', type: 'theme',
              note: 'The named Tao as "Mother of all things" (萬物之母) — the creative feminine principle, the Tao in its active, generative aspect. The parallel Hebrew figure is Hokmah (Wisdom, Proverbs 8): "I was there when he set the foundations of the earth" — also a feminine creative presence at the birth of the cosmos. The Gnostic Sophia plays the same role: the divine Mother whose creative act generates the material world. The Daoist "Mother" is unique in being the NAMED aspect of the UNNAMED absolute — whereas in Hebrew and Gnostic traditions, Wisdom/Sophia tends to be a secondary emanation.',
              parallels: [
                { label: 'Sophia / Wisdom (Proverbs 8)', note: 'Hebrew Hokmah = creative divine feminine present at the birth of the cosmos — same role as the named Tao as Mother.' },
                { label: 'Sophia (Gnostic)', note: 'The Gnostic Sophia as the generative divine feminine whose emanation produces the material world.' },
                { label: 'Shakti (Hindu)', note: 'The divine feminine creative power (Shakti) as the active principle of the impersonal Shiva — the feminine as the named, active, generative face of the unnamed absolute.' },
              ]
            },
          ]
        },
        { ref: 'Ch. 1 (lines 5–8)',
          text: 'Always without desire we must be found, if its deep mystery we would sound; but if desire always within us be, its outer fringe is all that we shall see. Under these two aspects, it is really the same; but as development takes place, it receives the different names. Together we call them the Mystery. Where the Mystery is the deepest is the gate of all that is subtle and wonderful.',
          textVersions: {
            legge:   'Always without desire we must be found, if its deep mystery we would sound; but if desire always within us be, its outer fringe is all that we shall see. Under these two aspects, it is really the same; but as development takes place, it receives the different names. Together we call them the Mystery. Where the Mystery is the deepest is the gate of all that is subtle and wonderful.',
            chinese: '故常無，欲以觀其妙；常有，欲以觀其徼。\n此兩者，同出而異名，同謂之玄，玄之又玄，衆妙之門。\n\ngù cháng wú, yù yǐ guān qí miào; cháng yǒu, yù yǐ guān qí jiào.\ncǐ liǎng zhě, tóng chū ér yì míng, tóng wèi zhī xuán, xuán zhī yòu xuán, zhòng miào zhī mén.\n\n[Therefore always non-being (wú): desire to observe its wonder (miào)]\n[Always being (yǒu): desire to observe its boundary (jiào)]\n[These two, same-origin yet different-name]\n[Together called dark/mystery (xuán): darkness yet again darkness]\n[the-many wonders\' gate (mén)]\n\nNote: xuán (玄) = "dark, mysterious, profound" — the technical term in Chinese alchemy, Daoism, and Buddhism for the ineffable depth of reality. xuán zhī yòu xuán = "darkness within darkness" — structurally identical to the Nasadiya Sukta\'s "darkness concealed in darkness." The Gate (門 mén) through which all subtle things emerge is the Tao itself — the Nothing from which all Something proceeds.',
          },
          entities: [
            { word: 'Mystery', node: 'apophatic-mysticism', type: 'theme',
              note: 'xuán (玄) = "the Dark Mystery." 玄之又玄 (xuán zhī yòu xuán) = "dark within dark, darkness deeper than darkness" — the Chinese equivalent of the via negativa in Christian mysticism: God is best approached by removing all predicates, going deeper into the divine darkness beyond all concepts. Pseudo-Dionysius the Areopagite (5th c. CE, "Mystical Theology"): God is the "super-essential darkness" beyond all light and knowledge. Meister Eckhart (14th c.): the "desert of the Godhead" beyond the Trinity. John of the Cross (16th c.): the "dark night of the soul." All are reaching for the same xuán: the darkness more primordial than any light.',
              parallels: [
                { label: 'Via Negativa / Apophatic theology', note: 'The systematic removal of all predicates from God — Pseudo-Dionysius, Meister Eckhart, John of the Cross — arriving at the same xuán.' },
                { label: 'Nasadiya Sukta — tamas in tamas', textId: 'nasadiya-sukta', note: '"Darkness concealed in darkness" — same structure: the pre-creation darkness as the deepest approach to the ultimate.' },
                { label: 'Ein Sof (Kabbalistic)', note: 'The Infinite before all emanation — the Zohar calls it "the concealed of all concealed" (Attika de-Atikin).' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── CORPUS HERMETICUM I — THE POIMANDRES ─────────────────────────────────────
SCRIPTURE_TEXTS['poimandres'] = {
  id:         'poimandres',
  title:      'Corpus Hermeticum I — The Poimandres',
  shortTitle: 'Poimandres',
  corpus:     'Hermetic · Greco-Egyptian',
  tradId:     'tradition-hermeticism',
  date:       'c. 1st–3rd century CE (written); claims Egyptian antiquity',
  docNode:    'hermes-trismegistus-pseudepigraphic-author',
  language:   'Greek Koine · G.R.S. Mead translation (1906)',
  translations: [
    { id: 'mead',  label: 'Mead (1906)', note: 'G.R.S. Mead, Thrice Greatest Hermes (1906) — public domain scholarly English' },
    { id: 'greek', label: 'Greek (CH)',  note: 'Koine Greek text of the Corpus Hermeticum (Nock-Festugière edition) with transliteration' },
  ],
  intro: 'The first and most important tractate of the Corpus Hermeticum — the foundational text of the Hermetic tradition. A divine being called Poimandres ("Man-Shepherd" or "Shepherd of Men") — who identifies himself as the Nous (Mind, divine Intellect) — appears to the narrator in a visionary state and reveals the nature of creation. The text is a unique synthesis of: (1) Platonic cosmology (the Demiurge creating the world from the Ideas); (2) Stoic Logos theology (the creative Word separating the elements); (3) Gnostic anthropology (the divine Anthropos descending into matter); and (4) Egyptian creation theology (the Memphite Theology\'s heart-and-tongue structure). Composed in Alexandria c. 1st–3rd century CE, in the same cultural milieu as the Gospel of John — both are products of the extraordinary collision of Greek, Jewish, and Egyptian cosmological thinking that made Alexandria the intellectual capital of the ancient world.',
  crossTradition: [
    { label: 'Genesis 1 (Hebrew)',          textId: 'genesis-1',        note: 'Same grammar: pre-creation waters/darkness, divine light appearing, separation of elements, creative Word.' },
    { label: 'John 1:1–5 (Christian)',      textId: 'john-1',           note: 'Both share the Logos-creating-from-darkness structure; likely drew on common Alexandrian Platonic tradition.' },
    { label: 'Memphite Theology (Egyptian)',textId: 'memphite-theology', note: 'Ptah\'s Nous (heart) + Logos (tongue) = Poimandres\'s Nous + Logos. The Hermetic tradition is partly Egyptian theology in Greek dress.' },
    { label: 'Nasadiya Sukta (Vedic)',       textId: 'nasadiya-sukta',   note: 'Both describe the pre-creation state as formless waters + darkness before the first light.' },
    { label: 'Timaeus (Plato)',              note: 'The Demiurge creates the world by looking at the eternal Forms — same role as the Hermetic Nous ordering creation.' },
  ],
  sections: [
    {
      heading: 'The Vision of Poimandres',
      verses: [
        { ref: 'CH I.1–2',
          text: 'It came to pass, once on a time, when I had begun to think about the things that are, and my thoughts had soared high aloft, while my bodily senses had been put under restraint by sleep — methought there came to me a Being of vast and boundless magnitude, who called me by my name, and said to me: What dost thou wish to hear and see? And I said: Who art thou? He said: I am Poemandres, the Mind of the Sovereignty. I know what thou desirest, and I am with thee everywhere.',
          textVersions: {
            mead:  'It came to pass, once on a time, when I had begun to think about the things that are, and my thoughts had soared high aloft, while my bodily senses had been put under restraint by sleep — yet not such sleep as that of men weighed down with food or bodily fatigue — methought there came to me a Being of vast and boundless magnitude, who called me by my name, and said to me: What dost thou wish to hear and see, and what dost thou wish to learn and come to know through thought? And I said: Who art thou? He said: I am Poemandres, the Mind of the Sovereignty. I know what thou desirest, and I am with thee everywhere.',
            greek: 'Ποιμάνδρης ὁ τῆς αὐθεντίας νοῦς\nPoimandrēs ho tēs authentias nous\n[Poimandres — the-of-sovereignty Mind/Intellect]\n\nNote: Poimandrēs likely derives from Egyptian p-eime-nte-rē = "the knowledge of Ra" — the text\'s implicit claim to Egyptian priestly origin. authentias = "sovereignty, self-authority" — the Nous is not dependent on anything higher for its existence. The Hermetic answer to the Nasadiya Sukta\'s "perhaps he knows not": the Nous is the source that does know.',
          },
          entities: [
            { word: 'Mind', node: 'nous-hermetic', type: 'deity',
              note: 'The Nous (Νοῦς, Mind/Intellect) — the highest divine principle in Hermetic theology, the source of all creation and the ground of human consciousness. Poimandres identifies himself AS the Nous. This places the Hermetic Nous at the same level as: the Johannine Logos (the creative divine Word); Memphite Ptah (whose heart = the divine Nous); Plotinus\'s second hypostasis (Nous = the divine Intellect contemplating the One and generating the Soul); and the Stoic Logos (the divine rational fire). The Hermetic synthesis is deliberate: Nous and Logos are in this text almost interchangeable — the first section uses Nous, the creation section uses Logos, anticipating the Trinitarian identification of Word and Mind in the second person of the Trinity.',
              parallels: [
                { label: 'Logos (John 1:1)',                   textId: 'john-1',           note: 'The Johannine Logos as the first divine principle — same role as Hermetic Nous as the sovereign creative Mind.' },
                { label: 'Ptah\'s Heart (Memphite Theology)',   textId: 'memphite-theology', note: 'The Egyptian heart (jb) as the divine Nous — "there came into being as the heart... Ptah." Direct predecessor.' },
                { label: 'Nous (Plotinus Enneads)',             note: 'Plotinus\'s Nous is the second hypostasis, the divine Intellect contemplating the One — same position and function as Hermetic Poimandres.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Cosmogonic Vision',
      verses: [
        { ref: 'CH I.4',
          text: 'And straightway all things changed before mine eyes, and were opened out in a moment. And I beheld a boundless view; all was changed into Light — a mild and joyous Light. But in a little while there had come down upon it, in part, a Darkness, dreadful and hateful, tortuous and snake-like, coiled about, so that methought it like unto a snake.',
          textVersions: {
            mead:  'And straightway all things changed before mine eyes, and were opened out in a moment. And I beheld a boundless view; all was changed into Light — a mild and joyous Light. And I became enamoured of the sight. But in a little while there had come down upon it, in part, a Darkness, dreadful and hateful, tortuous and snake-like, coiled about, so that methought it like unto a snake.',
            greek: 'εἶδον ἄπειρον θεαμα... πᾶν δὲ φῶς ἦν, ἥμερον καὶ ἱλαρόν\nkatēei de katōthen skotia phobera, elelígmenē, ataktos\n[boundless vision... all was light, gentle and joyful]\n[descended from-below darkness frightful, coiled, disordered]\n\nNote: katōthen = "from below, downward" — the darkness descends while the light ascends. The "snake-like" quality echoes both the Serpent of Eden (Genesis 3) and the Egyptian Apophis (the serpent-chaos threatening Ra\'s solar bark every night). The Zoroastrian Angra Mainyu, the Manichaean Realm of Darkness, and John 1:5\'s darkness all share this downward-vs-upward opposition.',
          },
          entities: [
            { word: 'Light', node: 'logos-johannine', type: 'theme',
              note: 'The divine Light of the Poimandres vision is functionally equivalent to the Johannine Logos: it is the first principle appearing before creation, opposed by the downward-tending darkness, and it is the source of the creative Word that will separate the elements. In both John and the Poimandres the same sequence occurs: (1) pre-creation void; (2) divine light appears; (3) darkness opposes or fails to comprehend the light; (4) the creative Word acts on the waters/darkness; (5) ordered creation results. Scholars (Dodd, Bultmann) have argued the Johannine Prologue and the Poimandres share a common Alexandrian source — possibly the same Hellenistic-Jewish-Egyptian cosmogonic hymn.',
              parallels: [
                { label: 'John 1:4–5 — "light shines in darkness"', textId: 'john-1',   note: 'Same: divine light appears, darkness opposes it. Possible common source in Alexandrian tradition.' },
                { label: 'Genesis 1:3 — "Let there be light"',       textId: 'genesis-1', note: 'The first divine act in Genesis is also the appearance of light into the pre-creation darkness.' },
                { label: 'Ra vs. Apophis (Egyptian)',                  note: 'Every night the solar bark of Ra must defeat Apophis (chaos-darkness) to rise again — same light-conquering-darkness structure.' },
              ]
            },
            { word: 'Darkness', node: 'primordial-darkness', type: 'symbol',
              note: 'The Hermetic primordial darkness — "dreadful and hateful, tortuous and snake-like" — is an active, malevolent force opposing the divine light (unlike the neutral pre-creation darkness of Genesis 1:2). This is the same move John makes at 1:5. The snake-like quality directly echoes the Serpent (Genesis 3), connecting cosmogonic darkness to moral evil. In Gnostic systems that grew from the same Alexandrian matrix, this darkness becomes the Realm of the Demiurge — the material world as a trap for the divine light-sparks (pneuma) imprisoned in matter.',
              parallels: [
                { label: 'John 1:5 — darkness vs. light',             textId: 'john-1',         note: 'Same opposition structure, possibly from common Alexandrian source.' },
                { label: 'Nasadiya Sukta — tamas in tamas',           textId: 'nasadiya-sukta', note: 'Vedic primordial darkness — same substrate, different tradition, no combat narrative.' },
              ]
            },
          ]
        },
        { ref: 'CH I.5–6',
          text: 'And from the Light there came forth a holy Word, which took its stand upon the watery Darkness; and methought this Word was the voice of the Light. And Poemandres said: That Light am I, even Mind, the first God — prior to the Moist Nature which appeared out of the Darkness.',
          textVersions: {
            mead:  'And from the Light there came forth a holy Word (Logos), which took its stand upon the watery Darkness; and methought this Word was the voice of the Light. And Poemandres spoke to me: Dost thou understand what that vision means? That Light, he said, am I, even Mind, the first God — prior to the Moist Nature which appeared out of the Darkness.',
            greek: 'ἐκ δὲ τοῦ φωτὸς λόγος ἅγιος ἐπέβη ἐπὶ τῇ φύσει\napo de tou phōtos logos hagios epebē epi tē phusei\n[from the light a holy Logos came-to-stand upon the Nature/watery-darkness]\n\nἐγώ εἰμι ὁ Νοῦς ὁ πρῶτος Θεός\negō eimi ho Nous ho prōtos Theos\n[I am the Nous (Mind), the first God]\n\nNote: egō eimi (ἐγώ εἰμι) = "I am" — the same Greek rendering of the Hebrew YHWH\'s self-declaration at Exodus 3:14 ("I AM THAT I AM"). Deliberate resonance for Jewish-Greek readers in Alexandria.',
          },
          entities: [
            { word: 'Word', node: 'logos-stoic', type: 'theme',
              note: 'The holy Logos (λόγος ἅγιος) standing "upon the watery Darkness" — the creative Word acting on the pre-creation waters. Structurally identical to: Genesis 1:2–3 (ruaḥ/breath of God hovering over the waters before God speaks); John 1:1–3 (the Logos through whom all things were made); the Memphite Theology (Ptah\'s tongue commands over the primordial Nun). In the Stoic tradition, the Logos is the divine rational fire pervading the world. Here the Logos is simultaneously Stoic (ordering rational principle), Platonic (divine word creating by naming/forming), and Egyptian (the tongue commanding). The Hermetic synthesis is complete.',
              parallels: [
                { label: 'John 1:3 — all things made through the Logos', textId: 'john-1',           note: 'The divine Word is the creative instrument acting on/through the pre-creation state.' },
                { label: 'Ptah\'s tongue — Memphite Theology',           textId: 'memphite-theology', note: 'The Egyptian logos: the divine tongue commanding what the heart (Nous) conceives.' },
                { label: '"God said" — Genesis 1:3',                      textId: 'genesis-1',        note: 'The Hebrew yəhî ("let there be") = the creative command of the divine Logos over primordial waters.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Divine Man — Descent into Matter',
      verses: [
        { ref: 'CH I.12–13',
          text: 'Mind, the Father of all, being Life and Light, gave birth to Man, a Being like to Himself. And He took delight in Man as being His own offspring; for Man was very goodly to look on, bearing the image of his Father. With good reason therefore did God take delight in Man; for it was God\'s own form that God took delight in.',
          entities: [
            { word: 'Man', node: 'anthropos-gnostic', type: 'theme',
              note: 'The Hermetic Primordial Man (Anthropos) — created in the image of the Nous, bearing the divine form. This is a direct commentary on Genesis 1:26 ("Let us make man in our image") mediated through Platonic intermediary theory. The Hermetic Anthropos is the same figure as: the Gnostic Adamas (the Perfect Man in the Apocryphon of John); the Kabbalistic Adam Kadmon (the Primordial Man whose body IS the Sefirot); the Mandaean Hibil Ziwa (the Light-Man); and, theologically, the Johannine Logos-become-flesh (John 1:14 — the Logos that is itself the divine image becoming a human body).',
              parallels: [
                { label: 'Adam Kadmon (Kabbalistic)', note: 'The Primordial Man whose body IS the Sefirot — the divine template for human existence, cosmic in scale.' },
                { label: '"Image of God" — Genesis 1:26', textId: 'genesis-1', note: '"Let us make man in our image" — the Hebrew Imago Dei is the direct antecedent the Poimandres is interpreting through a Platonic lens.' },
                { label: 'Word made flesh — John 1:14',   textId: 'john-1',    note: 'The Logos becoming flesh is the Christian version of the Hermetic Anthropos entering matter.' },
              ]
            },
          ]
        },
        { ref: 'CH I.14–15',
          text: 'Now Man fell in love with Nature\'s form reflected in the water, and desired to dwell with her; and at once with the desire, it became reality, and he came to dwell in the form devoid of reason. And Nature took her beloved and hugged him all about and embraced him fully, and they were mingled; for they were in love with one another.',
          entities: [
            { word: 'Nature', node: 'sacred-marriage', type: 'theme',
              note: 'The union of the divine Anthropos (masculine, from above) with Nature/Matter (feminine, the watery world below) — the Hermetic sacred marriage (hieros gamos). The divine Man falls in love with his own reflection in the material waters and descends to unite with Nature. This simultaneously is: (1) a cosmogonic myth (how the divine becomes entangled with matter); (2) an anthropological myth (why human souls are trapped in bodies); (3) the origin of sexual union as a cosmic archetype. Echoes: the Sumerian sacred marriage of Inanna and Dumuzi; the Kabbalistic union of the Shekhinah with the Holy One on the Sabbath; the Alchemical coniunctio oppositorum.',
              parallels: [
                { label: 'Sacred Marriage — Inanna/Dumuzi', textId: 'descent-inanna', note: 'The divine feminine united with the mortal — same hieros gamos pattern, Sumerian tradition.' },
                { label: 'Shekhinah union — Kabbalistic Sabbath', note: 'The Friday night union of the Holy One (masculine) with the Shekhinah (feminine) as re-enactment of the divine marriage.' },
                { label: 'Alchemical coniunctio', note: 'The alchemical "royal wedding" of the solar king and lunar queen — same divine-union cosmogony in chemical dress.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── POPOL VUH — CREATION OPENING ─────────────────────────────────────────────
SCRIPTURE_TEXTS['popol-vuh'] = {
  id:         'popol-vuh',
  title:      'Popol Vuh — The Creation (Opening)',
  shortTitle: 'Popol Vuh',
  corpus:     'K\'iche\' Maya · Mesoamerican',
  tradId:     'tradition-mesoamerican',
  date:       'c. 1000–1500 CE (K\'iche\' written text); oral tradition much older',
  docNode:    'phase-8-001-popol-vuh',
  language:   'K\'iche\' Maya · scholarly paraphrase after Christenson 2007 / Tedlock 1996',
  translations: [
    { id: 'christenson', label: 'English',     note: 'Scholarly paraphrase based on Christenson (2007) and Tedlock (1996) — the most authoritative modern translations of the K\'iche\' text' },
    { id: 'kiche',       label: 'K\'iche\' Maya', note: 'K\'iche\' Maya text from the Newberry Library manuscript (c. 1701 transcription of the earlier K\'iche\' original)' },
  ],
  intro: 'The Popol Vuh (K\'iche\' Maya "Council Book") is the most complete surviving Mesoamerican creation account. Its opening is one of the most beautiful cosmogonic passages in world literature: all is silence, stillness, and dark water before the first word is spoken. The parallel with Genesis 1:1–2 is structural: (1) pre-creation silence and darkness; (2) only the sea; (3) the divine creators are in the water; (4) creation happens by speech/word. What is unique in the Popol Vuh is the explicit role of the Feathered Serpent (Gucumatz/Kukulkan) as a co-creator alongside the Heart of Sky — linking this text directly to the widespread Mesoamerican Quetzalcoatl tradition. The Feathered Serpent as creator-through-word is an exact Mesoamerican parallel to the Logos doctrine.',
  crossTradition: [
    { label: 'Genesis 1:1–3 (Hebrew)',     textId: 'genesis-1',      note: 'Parallel structure: pre-creation void → only water → divine speech → ordered creation. Independent traditions, same cosmogonic grammar.' },
    { label: 'Enuma Elish (Mesopotamian)', textId: 'enuma-elish-1',  note: 'Pre-creation commingling of waters before the gods emerge — same primordial ocean motif.' },
    { label: 'Nasadiya Sukta (Vedic)',     textId: 'nasadiya-sukta', note: '"Only murmurs, ripples" before creation parallels "unfathomed depth of water" in the Nasadiya.' },
    { label: 'Tao Te Ching Ch. 1',        textId: 'tao-te-ching-1', note: 'The unmanifest before the first naming — same structural pre-creation state.' },
    { label: 'John 1:1–3 (Christian)',    textId: 'john-1',         note: '"In the beginning was the Word" — creation by the divine spoken word is the Mesoamerican parallel.' },
  ],
  sections: [
    {
      heading: 'Before Creation — Silence and Dark Water',
      verses: [
        { ref: 'Opening',
          text: 'This is the account of how all was in suspense, all calm, in silence; all motionless, still, and the expanse of the sky was empty. There is not yet one person, one animal, bird, fish, crab, tree, rock, hollow, canyon, meadow, or forest. Only the sky alone is there; the face of the earth is not clear. Only the sea alone is pooled under all the sky; there is nothing whatever gathered together.',
          textVersions: {
            christenson: 'This is the account of how all was in suspense, all calm, in silence; all motionless, still, and the expanse of the sky was empty. There is not yet one person, one animal, bird, fish, crab, tree, rock, hollow, canyon, meadow, or forest. Only the sky alone is there; the face of the earth is not clear. Only the sea alone is pooled under all the sky; there is nothing whatever gathered together.',
            kiche:       'Are\' u xe\' ojer tzij waral k\'o wi k\'u puch ri loq\'olaj tinamit.\nCha\' man k\'o wi naqi k\'amowab\'ej, k\'o wi jun winaq, jun b\'ixonik, jun mexa, jun k\'eyem, jun wach ulew.\nXa xaxi kaj k\'o wi. U wach ulew man k\'o taj chik.\nXa u tz\'aqat puwi\' ja\' ronojel kaj; man k\'o wi naqi cholaj ch\'aqa chi kaq\'iq\'.\n\n[Are\' u xe\' ojer tzij = "This is the root of the former/ancient word"]\n[man k\'o wi naqi = "not is-there anything"]\n[xa xaxi kaj = "only alone the sky"]\n[xa u tz\'aqat puwi\' ja\' = "only the pooling of the sea"]\n\nNote: ojer tzij = "former word / ancient word" — the Maya text describes itself as a speaking of what was before speech. The K\'iche\' word for "account" and "word" are the same: tzij (speech/word). So the Popol Vuh opens: "This is the root of the former Word." The creation that will follow is also an act of tzij — speech creating existence. This is the Mesoamerican parallel to the Johannine Logos and the Memphite Theology\'s tongue.',
          },
          entities: [
            { word: 'sea', node: 'cosmic-ocean', type: 'symbol',
              note: 'The primordial sea (K\'iche\': ja\' = water) — the only thing existing before creation. Five independent ancient traditions begin creation with the same image: only water, undifferentiated, before any form. Genesis 1:2 (tehom/"the deep"); Enuma Elish (Apsu and Tiamat mingled); the Nasadiya Sukta ("was water there, unfathomed depth?"); Memphite Theology (Nun, the primordial ocean); and the Popol Vuh ("only the sea alone is pooled"). The universality of the primordial ocean as pre-creation substrate is one of the strongest pan-cultural motifs in comparative religion.',
              parallels: [
                { label: 'tehom — Genesis 1:2',              textId: 'genesis-1',        note: '"Darkness was upon the face of the deep" — the same primordial ocean as pre-creation substrate.' },
                { label: 'Apsu + Tiamat — Enuma Elish',      textId: 'enuma-elish-1',     note: 'The primordial commingling of waters before the first gods are born.' },
                { label: 'Nasadiya Sukta — "depth of water"', textId: 'nasadiya-sukta',   note: '"Was water there, unfathomed depth of water?" — same pre-creation question, Vedic tradition.' },
                { label: 'Nun (Egyptian)',                    textId: 'memphite-theology', note: 'The undifferentiated primordial ocean from which Atum self-created.' },
              ]
            },
            { word: 'sky', node: 'primordial-darkness', type: 'symbol',
              note: '"Only the sky alone is there; the face of the earth is not clear" — the Maya pre-creation sky is empty, featureless, the same nullity as the Hebrew tohu va-vohu ("without form and void") and the Nasadiya\'s "neither realm of air nor sky beyond it." The Popol Vuh\'s pre-creation state is one of utter calm and stillness: "all was in suspense, all calm, in silence; all motionless." This stillness is the Mesoamerican equivalent of the contemplative silence before creation — the same state the Tao Te Ching tries to access through non-desire.',
              parallels: [
                { label: 'tohu va-vohu — Genesis 1:2',       textId: 'genesis-1',      note: '"Without form and void" — same pre-creation emptiness before the divine speech-act.' },
                { label: '"Nameless origin" — Tao Te Ching', textId: 'tao-te-ching-1', note: 'The unmanifest before the first naming — nothing has taken form, all is potential.' },
              ]
            },
          ]
        },
        { ref: 'Creators in the water',
          text: 'Whatever there is that might be is simply not there: only the pooled water, only the calm sea, only it alone is pooled. Whatever might be is simply not there: only murmurs, ripples, in the dark, in the night. Only the Maker, Modeler alone, Sovereign Plumed Serpent, the Bearers, Begetters are in the water, a glittering light.',
          entities: [
            { word: 'Plumed Serpent', node: 'feathered-serpent', type: 'deity',
              note: 'Gucumatz (K\'iche\') = Kukulkan (Yucatec Maya) = Quetzalcoatl (Nahuatl/Aztec) — the Feathered Serpent co-creator who exists in the primordial waters before creation. The Feathered Serpent as creator-through-word is the closest Mesoamerican parallel to the Logos doctrine: a divine being present in the primordial waters who creates by speaking. The Feathered Serpent appears across all major Mesoamerican civilisations (Olmec, Teotihuacan, Maya, Toltec, Aztec) spanning 2,000+ years — the single most durable theological concept in the Western hemisphere.',
              parallels: [
                { label: 'Kukulkan (Yucatec Maya)',          note: 'The same Feathered Serpent under the Yucatec name — theological continuity across Maya linguistic groups.' },
                { label: 'Quetzalcoatl (Aztec)',             note: 'The Nahuatl form — creator, culture-hero, and dying-rising figure who promises to return.' },
                { label: 'Logos in the waters — John 1:1',  textId: 'john-1', note: 'The divine Word in the primordial waters before creation is the Johannine parallel to the Feathered Serpent in the sea.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'Creation by the Spoken Word',
      verses: [
        { ref: 'The first word',
          text: 'And then the earth arose because of them, it was simply their word that brought it forth. For the forming of the earth they said "Earth." It arose suddenly, just like a cloud, like a mist, now forming, unfolding. Then the mountains were separated from the water, all at once the great mountains came forth.',
          entities: [
            { word: 'word', node: 'creation-by-word', type: 'theme',
              note: 'Creation by divine speech — the earth arises because the gods say "Earth." This is the K\'iche\' Maya version of the cosmogonic speech-act that appears in: Genesis 1:3 ("And God said, Let there be light"); the Memphite Theology (Ptah\'s tongue commands what his heart conceives); Enuma Elish (Marduk\'s word as power test); and John 1:3 (all things made through the Logos). Five independent ancient traditions — Mesopotamian, Egyptian, Hebrew, Greek-Christian, and Mesoamerican — all arrive independently at the spoken word as the fundamental creative act. This convergence is one of the most striking examples of parallel theological evolution in world religion.',
              parallels: [
                { label: '"And God said" — Genesis 1:3',      textId: 'genesis-1',        note: 'The Hebrew creation-by-speech: "Let there be light." Same: word → existence.' },
                { label: 'Ptah\'s tongue — Memphite Theology', textId: 'memphite-theology', note: 'The tongue commands what the heart conceives.' },
                { label: 'Logos — John 1:3',                  textId: 'john-1',           note: '"All things were made by him" — the Johannine creative Word.' },
                { label: 'Marduk\'s word — Enuma Elish',      textId: 'enuma-elish-1',     note: 'Marduk\'s word-power test: he speaks and things appear, speaks again and they dissolve.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── BHAGAVAD GITA 4:7–8 — THE AVATAR DOCTRINE ───────────────────────────────
SCRIPTURE_TEXTS['bhagavad-gita-4'] = {
  id:         'bhagavad-gita-4',
  title:      'Bhagavad Gita 4.7–8 — The Avatar Doctrine',
  shortTitle: 'Bhagavad Gita 4',
  corpus:     'Hindu · Sanskrit epic',
  tradId:     'tradition-hinduism',
  date:       'c. 200 BCE–200 CE (present form)',
  docNode:    'phase-2-027-bhagavad-gita',
  language:   'Sanskrit · R.C. Zaehner translation (1969)',
  translations: [
    { id: 'zaehner',  label: 'Zaehner (1969)', note: 'R.C. Zaehner, The Bhagavad Gita (1969) — scholarly English' },
    { id: 'sanskrit', label: 'Sanskrit',       note: 'IAST transliteration of the Sanskrit text with word-by-word gloss' },
  ],
  intro: 'Bhagavad Gita Chapter 4, verses 7–8 contain the locus classicus of Hindu avatar (avatāra) theology. Krishna — revealed as the Supreme Being Vishnu in human form — declares that whenever righteousness declines and evil rises, he "sends himself forth" (ātmānaṃ sṛjāmy aham) into the world, from age to age. This periodic divine self-incarnation is the Hindu structural parallel to the Christian Incarnation (the Logos made flesh, John 1:14), with a crucial difference: for Hinduism the avatar is one of an infinite series of divine descents across cosmic cycles; for Christianity the Incarnation is a unique and unrepeatable event. The comparative theology of avatar vs. Incarnation is one of the most productive cross-tradition conversations in contemporary theology.',
  crossTradition: [
    { label: 'John 1:14 (Christian)',       textId: 'john-1',          note: '"The Word was made flesh" — the Christian Incarnation: divine nature fully inhabiting a human body.' },
    { label: 'Descent of Inanna (Sumerian)', textId: 'descent-inanna', note: 'The divine descending to the realm of matter — same grammar of divinity entering the mortal world.' },
    { label: 'Poimandres (Hermetic)',        textId: 'poimandres',      note: 'The Hermetic Anthropos descending into matter — the Hellenistic parallel to the avatar.' },
    { label: 'Enuma Elish (Mesopotamian)',   textId: 'enuma-elish-1',   note: 'Marduk born from within the deep, the champion of order within chaos — structural parallel to the avatar born within adharma.' },
  ],
  sections: [
    {
      heading: 'The Avatar Declaration',
      verses: [
        { ref: '4:7',
          text: 'Whenever righteousness wanes and unrighteousness increases I send myself forth, O Bharata.',
          textVersions: {
            zaehner:  'Whenever righteousness wanes and unrighteousness increases I send myself forth, O Bharata.',
            sanskrit: 'yadā yadā hi dharmasya glānir bhavati bhārata\nabhyutthānam adharmasya tadātmānaṃ sṛjāmy aham\n[Whenever whenever indeed of-righteousness (dharma) decline there-is O-Bharata]\n[uprising of-unrighteousness (adharma) — then myself (ātmānam) I-send-forth (sṛjāmi)]\n\nNote: tadātmānaṃ sṛjāmy aham = "then myself I send forth" — the Absolute (Brahman-as-Krishna) sends itself into manifestation. sṛjāmi = "I create/emit" — the same root as sṛṣṭi ("creation, emanation"). The avatar is not merely a visitation but a self-emanation: the Absolute pours itself into a particular human form.',
          },
          entities: [
            { word: 'righteousness', node: 'avatar-doctrine', type: 'theme',
              note: 'dharma (धर्म) — the cosmic/moral order. When dharma declines and adharma rises, the Absolute personally intervenes by becoming incarnate. The avatar doctrine (avatāra = "descent, crossing-down") holds that Vishnu has descended in ten primary forms across the four cosmic ages. This is the Hindu version of the theological problem solved differently by: Christianity (unique Incarnation correcting the single fall); Islam (the series of prophets culminating in Muhammad); Zoroastrianism (the Saoshyant coming at the end of history). All four are responses to the same question: how does the divine ground correct cosmic decline?',
              parallels: [
                { label: 'Incarnation — John 1:14',           textId: 'john-1',        note: '"The Word was made flesh" — the unique Christian Incarnation vs. the Hindu repeated avatar; same divine-descent logic.' },
                { label: 'Marduk — champion against chaos',   textId: 'enuma-elish-1', note: 'Marduk is born to champion the gods against Tiamat (chaos) — same: a divine champion born to restore order.' },
              ]
            },
          ]
        },
        { ref: '4:8',
          text: 'For the protection of the good, for the destruction of evil-doers, for the setting up of righteousness, I come into being from age to age.',
          textVersions: {
            zaehner:  'For the protection of the good, for the destruction of evil-doers, for the setting up of righteousness, I come into being from age to age.',
            sanskrit: 'paritrāṇāya sādhūnāṃ vināśāya ca duṣkṛtām\ndharmasaṃsthāpanārthāya sambhavāmi yuge yuge\n[For-protection of-the-good]\n[and for-destruction of-evil-doers]\n[for the-establishment-of-righteousness]\n[I-come-into-being (sambhavāmi) age-after-age (yuge yuge)]\n\nNote: sambhavāmi yuge yuge = "I come into being, age after age" — the cyclical avatar in contrast to the unique Christian Incarnation. yuge yuge refers to the Hindu cosmic time-cycles (yugas). The same divine descent happens at the turn of each cosmic age. This doctrine generates the "Christ as avatar" theological bridge that 19th-century Hindu reformers (Ramakrishna, Vivekananda) used to interpret Christianity within Vedantic universalism.',
          },
          entities: [
            { word: 'come into being', node: 'dying-rising-god', type: 'theme',
              note: 'sambhavāmi = "I manifest, I come into being" — the divine descent (avatāra) from the transcendent into the immanent. Krishna\'s departure at the end of the Mahabharata parallels the Ascension in Christian theology: the divine returns to the transcendent after completing its earthly mission. The avatar cycle and the Resurrection-Ascension cycle are structural parallels even though theologically very different (cyclical vs. once-for-all).',
              parallels: [
                { label: 'Incarnation → Resurrection (Christian)', textId: 'john-1',         note: 'The Logos descends (1:14), completes its mission, returns to the Father — same descent-mission-return structure.' },
                { label: 'Inanna\'s Descent and Return',            textId: 'descent-inanna', note: 'The divine descends, is killed, then rises — same grammar of divine descent into mortal conditions and return.' },
              ]
            },
            { word: 'age to age', node: 'krishna', type: 'deity',
              note: 'Krishna (Kṛṣṇa) — the eighth and most complete avatar of Vishnu; the divine figure who reveals the Bhagavad Gita. In the Gita, Krishna simultaneously IS the avatar (a human charioteer) AND the Absolute ("abandon all dharmas, take refuge in Me alone" — BG 18:66). This dual nature — fully human and fully divine — is the Hindu parallel to the Chalcedonian formula (451 CE: Christ is fully human and fully divine, "without confusion, without change, without division, without separation"). Both traditions independently arrive at the same paradox: the divine-in-flesh must be BOTH completely divine AND completely human.',
              parallels: [
                { label: 'Christ — fully human and fully divine', note: 'The Chalcedonian formula (451 CE) — same paradox as Krishna\'s avatar nature: two natures without confusion or separation.' },
                { label: 'Vishnu (the source)',                    note: 'Krishna is the avatar of Vishnu — the Preserver-God who maintains cosmic order through periodic self-manifestation.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── CHANDOGYA UPANISHAD 6.2.1–3 ─────────────────────────────────────────────
SCRIPTURE_TEXTS['chandogya-621'] = {
  id:         'chandogya-621',
  title:      'Chandogya Upanishad 6.2.1–3',
  shortTitle: 'Chandogya 6.2',
  corpus:     'Hindu · Sanskrit Upanishad',
  tradId:     'tradition-vedic-hinduism',
  date:       'c. 700–500 BCE',
  docNode:    'phase-2-013-chandogya-upanishad',
  language:   'Sanskrit · R.E. Hume translation (1931)',
  translations: [
    { id: 'hume',     label: 'Hume (1931)', note: 'R.E. Hume, The Thirteen Principal Upanishads (1931) — public domain scholarly English' },
    { id: 'sanskrit', label: 'Sanskrit',   note: 'IAST transliteration of the Sanskrit text with word-by-word gloss' },
  ],
  intro: 'The Uddalaka Aruni instruction to his son Shvetaketu — one of the most important passages in the Upanishads. Uddalaka refutes the non-being (asat) cosmogony with the Being (sat) cosmogony: "In the beginning this world was just Being (sat), one only, without a second." This sat (Being) is identified with Brahman — the impersonal Absolute — and culminates in the most famous formula of Advaita Vedanta: Tat tvam asi, "That thou art" (6.8.7). The Chandogya\'s Sat (pure Being) is the precise philosophical counterpart to the Nasadiya Sukta\'s tad ekam (That One Thing) and to the divine self-identification at Exodus 3:14 (Hebrew: ʾehyeh ʾăšer ʾehyeh = "I AM THAT I AM").',
  crossTradition: [
    { label: 'Nasadiya Sukta (Vedic)',    textId: 'nasadiya-sukta', note: '"That One Thing" (tad ekam) of the Nasadiya = the sat (Being) of the Chandogya — same Absolute, now given a philosophical name.' },
    { label: 'Tao Te Ching 1 (Daoist)', textId: 'tao-te-ching-1', note: '"Being" (yǒu) as the origin of the ten thousand things parallels sat as the source of all differentiation.' },
    { label: 'John 1:1 (Christian)',     textId: 'john-1',         note: 'The pre-existent Logos as the divine "I AM" — echoing the Exodus self-identification of Being.' },
    { label: 'Poimandres (Hermetic)',    textId: 'poimandres',     note: '"I AM the Nous, the first God" — same: the first principle identifies itself as absolute self-subsisting being.' },
  ],
  sections: [
    {
      heading: 'Being Alone, Without a Second',
      verses: [
        { ref: '6.2.1',
          text: 'In the beginning, my dear, this world was just Being (Sat), one only, without a second. Some people say: In the beginning this world was just Non-being (Asat), one only, without a second; and from that Non-being, Being was born.',
          textVersions: {
            hume:     'In the beginning, my dear, this world was just Being (Sat), one only, without a second. Some people say: In the beginning this world was just Non-being (Asat), one only, without a second; and from that Non-being, Being was born.',
            sanskrit: 'sad eva, saumya, idam agra āsīt, ekam evādvitīyam.\ntad dhaika āhuḥ: asal lidam agra āsīd, ekam evādvitīyam; tasmād asataḥ saj jāyata\n[Being (sat) indeed this in-beginning was, one only without-a-second (ekam evādvitīyam)]\n[That — some say — Non-being (asat) this in-beginning was; from that Non-being, Being was born]\n\nNote: ekam evādvitīyam = "one only, without a second" — the most precise formulation of absolute non-duality (advaita) in the Upanishads. The Being that is the source of all things has NO second thing alongside it — not even a creation distinct from itself. Compare with: the Plotinian The One (no counterpart, no other beside it); and the Nasadiya\'s tad ekam (That One Thing). The contrast with Genesis is sharp: Genesis has God creating something OTHER than himself; the Chandogya\'s sat has no otherness at all.',
          },
          entities: [
            { word: 'Being', node: 'brahman-impersonal', type: 'theme',
              note: 'sat (सत्) = pure Being — the Absolute as the ground of all reality. The argument: Being cannot come from Non-being (ex nihilo nihil fit); therefore the source must itself be Being, which = Brahman (the impersonal Absolute). The philosophical move is identical to: Plotinus\'s The One (the ultimate ground that IS, absolutely, without qualification); the Kabbalistic Ein Sof (the Infinite that IS, before any differentiation); and the divine self-identification at Exodus 3:14 (ʾehyeh = "I AM" = pure Being naming itself). Meister Eckhart\'s Gott ist ein reines Sein ("God is pure Being") arrives at the same conclusion 2,000 years later.',
              parallels: [
                { label: 'That One — Nasadiya Sukta',        textId: 'nasadiya-sukta', note: 'tad ekam = "That One Thing" — the Vedic pre-name for what the Chandogya now calls sat/Brahman.' },
                { label: 'The One — Plotinus',               note: 'Plotinus\'s first principle is pure Being/Goodness without any qualification — same: the absolute ground prior to all differentiation.' },
                { label: '"I AM" — Exodus 3:14',             note: 'The Hebrew divine name ʾehyeh = "Being" or "I AM" — God names himself as pure self-subsisting Being, the same as sat.' },
                { label: 'Ein Sof (Kabbalistic)',            note: 'The Infinite Being before all names and predicates — same apophatic absolute as the Chandogya\'s sat.' },
              ]
            },
          ]
        },
        { ref: '6.2.2–3',
          text: 'But how, my dear, could Being come from Non-being? On the contrary, in the beginning this world was just Being, one only, without a second. It thought: "May I be many; may I grow forth." It emitted heat.',
          textVersions: {
            hume:     'But how, my dear, could it be thus? How could Being come from Non-being? On the contrary, my dear, in the beginning this world was just Being, one only, without a second. It thought: "May I be many; may I grow forth." It emitted heat.',
            sanskrit: 'sad eva, saumya, idam agra āsīt, ekam evādvitīyam.\ntad aikṣata: bahu syāṃ prajāyeyeti, tat tejo \'sṛjata\n[Being indeed this in-beginning was, one only without-a-second]\n[It looked/willed (aikṣata): I-would-be-many, I-would-proliferate]\n[It emitted (sṛjata) heat/fire (tejas)]\n\nNote: aikṣata = "it looked/willed/thought" — creation as the act of divine self-contemplation and intention. The sat creates by an internal act of seeing/willing: "May I be many." This is the Upanishadic version of the Hermetic Nous whose self-contemplation generates the Logos; and of Plotinus\'s One whose self-contemplation generates the Nous as its first emanation. The divine ground creates by "thinking toward" multiplicity.',
          },
          entities: [
            { word: 'thought', node: 'creation-by-word', type: 'theme',
              note: '"It thought: May I be many" — creation as an act of divine self-contemplation, will, and speech. sat\'s internal monologue ("May I be many; may I grow forth") is the Sanskrit equivalent of "And God said" (Genesis 1:3). Three-step creation: THINKS (aikṣata = "it looked/willed/thought") → WILLS (bahu syāṃ = "may I be many") → EMITS (sṛjata = "it sent forth"). This parallels: Egyptian Ptah (heart thinks → tongue commands → world exists); Johannine Logos (divine reason → divine word → all things made); and Hermetic Nous (divine Mind thinks → holy Logos speaks → elements separate).',
              parallels: [
                { label: '"God said" — Genesis 1:3',          textId: 'genesis-1',        note: 'Divine speech as creation — the Hebrew version of sat\'s internal creative monologue.' },
                { label: 'Ptah\'s heart/tongue — Memphite',   textId: 'memphite-theology', note: 'Heart thinks (= sat\'s aikṣata), tongue commands — same three-step creation by inner speech.' },
                { label: 'Nous → Logos (Poimandres)',         textId: 'poimandres',        note: 'The Hermetic Nous\'s self-contemplation generating the creative Logos — divine thought → divine word → creation.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};
