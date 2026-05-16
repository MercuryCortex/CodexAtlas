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

// ── 12. YASNA 30 — THE GATHAS OF ZOROASTER ────────────────────────────────
SCRIPTURE_TEXTS['yasna-30'] = {
  title      : 'Yasna 30 — The Two Spirits',
  shortTitle : 'Yasna 30',
  tradition  : 'Zoroastrianism',
  date       : 'c. 1200–1000 BCE (Gathic Avestan)',
  intro      : 'The most theologically dense of the Gathas — the oldest hymns attributed directly to Zarathustra. Yasna 30 announces the primordial choice between Truth (Asha) and the Lie (Druj), incarnated as twin Spirits whose antagonism structures all reality. This is the historical origin of binary moral-cosmos theology that flows into Qumran\'s Community Rule, the Didache\'s Two Ways, Manichaean Light/Darkness, and Augustine\'s City of God. Zarathustra is the world\'s first historically named prophet.',
  crossTradition : [
    { label: 'Qumran — Two Spirits Treatise (1QS 3)', note: 'The Community Rule\'s Two Spirits (Spirit of Truth / Spirit of Deceit) is Yasna 30 in Hebrew sectarian theology. Transmission route: Persian period (539–333 BCE) Jewish exile in Babylon.' },
    { label: 'John 1:5 — Light and Darkness', textId: 'john-1', note: '"The light shines in the darkness." The Johannine Light/Darkness dualism is the New Testament\'s version of the Two Spirits.' },
    { label: 'Poimandres — Light vs. Darkness', textId: 'poimandres', note: 'The Hermetic cosmos splits at creation into Light and Darkness — the same binary structure as the Two Spirits, now cosmological rather than moral.' },
    { label: 'Manichaean Light / Darkness', note: 'Mani explicitly claimed Zoroastrian descent. The Zoroastrian binary is the direct ancestor of Manichaean cosmological dualism.' },
  ],
  translations : [
    { id: 'insler',  label: 'Insler 1975 (T1)' },
    { id: 'humbach', label: 'Humbach 1991 (T1)' },
    { id: 'avestan', label: 'Avestan (original)' },
  ],
  sections : [
    {
      heading : 'Stanzas 1–2 — The Summons',
      verses  : [
        { ref: 'Y 30.1',
          text: 'Now I shall proclaim to those who will listen the hymns of the Wise One to be pondered by the man of understanding. Praises of the Lord and of Good Thought — and the truth, which uplifts those who see aright, and is joy to them.',
          textVersions: {
            humbach: 'Now I shall proclaim to those who wish to hear the hymns of the Wise One which should be kept in mind by the one having understanding. Praises of the lord and of good thinking, and Truth, which leads aright those who see clearly, and blessings.',
            avestan: 'AT tā vaxšyā aŋhūš mazdā\niyāi drəgvantō drujəm\nyauuat vīspā ā kāmā\nnōit dahmā āiiamā\n[Now I shall speak the words of the Wise Lord\nto those who wish to hear\nfor as long as that wish lasts\nmay the righteous not miss the way]',
          },
          entities: [
            { word: 'Wise One', node: 'ahura-mazda', type: 'deity',
              note: 'Ahura Mazda — "Wise Lord" (ahura = lord, mazdā = wisdom/mind). Zarathustra\'s supreme deity is defined by wisdom, not power. This is the world\'s first theologically explicit ethical monotheism — the divine is not a storm-god or a king-god but a mind-god.',
              parallels: [
                { label: 'Nous (Poimandres)', textId: 'poimandres', note: 'The Hermetic supreme principle is also identified with Mind/Wisdom — Nous rather than power.' },
                { label: 'Brahman (Chandogya)', textId: 'chandogya-621', note: 'The Upanishadic absolute creates by thinking — same identification of the divine with intelligence.' },
              ]
            },
          ]
        },
        { ref: 'Y 30.2',
          text: 'Hear with your ears the best things; look upon them with clear-seeing thought, for decision between the two Beliefs, each man for himself before the Great Consummation, bethinking you that it be accomplished to our pleasure.',
          textVersions: {
            humbach: 'Hear the best with your ears. Consider with clear-thinking mind — man by man for his own self — the two choices, before the great transformation; being aware that it should come to pass to our pleasure.',
            avestan: 'sraotā gēušāiš vahišta sūraiiā\nava xratu mazdā\nyaēšąm aiiārəm paiti\nhačaitē armaiti\n[Hear with the ears the best things\nconsider with clear-thinking mind\nman for himself the teachings\nbefore the great transformation]',
          },
          entities: [
            { word: 'two Beliefs', node: 'spenta-mainyu', type: 'theme',
              note: 'The Two Spirits (Spenta Mainyu / Angra Mainyu). At the beginning, two equal and opposite principles chose their natures. Human moral life mirrors this primordial choice — every individual must choose their alignment before the "Great Consummation" (frashokereti, the final renovation of the world).',
              parallels: [
                { label: 'Qumran Two Spirits (1QS 3:18–4:26)', note: 'The Community Rule\'s "Prince of Light" and "Angel of Darkness" are direct theological descendants of Spenta Mainyu and Angra Mainyu.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading : 'Stanzas 3–4 — The Primordial Choice',
      verses  : [
        { ref: 'Y 30.3',
          text: 'Now the two primal Spirits, who revealed themselves in vision as twins, are the Better and the Bad in thought, word, and deed. And between these two, the Beneficent chose aright, but not so the Maleficent.',
          textVersions: {
            humbach: 'Now those two Spirits at the beginning announced themselves, one the Better and the other the Bad, in thought, word, and action. Between the two, the Beneficent one made the right choice, not the evil one.',
            avestan: 'AT tā mainiiū paouruiiē\nyā yəmā xvafiia sruuātəm\nmanahī vacahī šiiaoθanōi\nhi vahiiō akəmcā\n[At the beginning the two Spirits who are twins\nrevealed themselves in thought, word, and action\nas the Better and the Bad]',
          },
          entities: [
            { word: 'two primal Spirits', node: 'spenta-mainyu', type: 'deity',
              note: 'Spenta Mainyu (Holy Spirit) and Angra Mainyu (Destructive Spirit) — twin principles who chose their natures at the beginning. The theology is radical: evil is not God\'s creation but the result of a free cosmic choice.',
            },
            { word: 'Better and the Bad', node: 'ahriman', type: 'theme',
              note: 'Ahriman (Angra Mainyu) chose evil freely — making Zoroastrianism the world\'s first systematic theodicy by principle rather than by narrative. The daēvas (cognate with Sanskrit deva = gods) become demons in Zoroastrianism — the same word inverted in valence across the Indo-Iranian split.',
              parallels: [
                { label: 'Isaiah 45:5 / Yaldabaoth Inversion', note: 'The Gnostic inversion of the Hebrew God into an ignorant Demiurge is structurally parallel: the "god" of one tradition becomes the "demon" of another.' },
              ]
            },
            { word: 'thought, word, and deed', node: 'tradition-zoroastrianism', type: 'tradition',
              note: 'Humata, Hukhta, Hvarshta — "Good Thought, Good Word, Good Deed." The Zoroastrian ethical triple. This triadic formula predates Christian thought/word/deed moral theology by over 1,000 years.',
            },
          ]
        },
        { ref: 'Y 30.4',
          text: 'And when these two Spirits came together in the beginning, they established Life and Not-Life, and that at the last the Worst Existence shall be for the followers of the Lie, but the Best Thought for those of Truth.',
          entities: [
            { word: 'Life and Not-Life', node: 'primordial-darkness', type: 'theme',
              note: 'The Two Spirits\' first act is the establishment of Life (ahu) and Non-Life — a creation-by-division structure. The cosmos exists because it has been split into two. Parallel to the separation of Light from Darkness in Genesis 1 and to the Poimandres\'s primordial division.',
              parallels: [
                { label: 'Genesis 1 — Light separated from Darkness', textId: 'genesis-1', note: 'God separates light from darkness on Day 1 — the same primordial binary as Yasna 30\'s Life/Non-Life.' },
                { label: 'Poimandres — Light into Darkness', textId: 'poimandres', note: 'The Hermetic light descends into the groaning darkness — same primordial binary structure.' },
              ]
            },
            { word: 'Truth', node: 'druj', type: 'theme',
              note: 'Asha ("Truth/Right Order") — cognate with Sanskrit ṛta (cosmic order). Both describe the same principle: the pattern by which the universe ought to work, which is simultaneously physical law, moral law, and religious truth. Druj (the Lie) is its cosmic opposite.',
            },
          ]
        },
      ]
    },
    {
      heading : 'Stanzas 5–7 — The Consequence',
      verses  : [
        { ref: 'Y 30.5',
          text: 'Of these two Spirits, the Evil one chose to do the worst things. But the Most Holy Spirit, who is clad in the hardest stones, chose right — and so do those who, with true acts, please Ahura Mazda.',
          entities: [
            { word: 'Holy Spirit', node: 'spenta-mainyu', type: 'deity',
              note: 'Spenta Mainyu — "Holy/Bounteous Spirit." The New Testament\'s Pneuma Hagion (Holy Spirit) may be a conceptual descendant via the Jewish apocalyptic tradition shaped by the Persian period. The Iranian word mazdā (wisdom/mind) is cognate with Sanskrit medhā (mental power) — the supreme deity is defined by cognitive excellence.',
            },
            { word: 'sacred fire', node: 'sacred-fire', type: 'theme',
              note: 'Fire (Atar) is the most sacred Zoroastrian symbol — the visible manifestation of Ahura Mazda\'s divine energy and truth. Zoroastrian temples maintain perpetual sacred fires. The fire is not worshipped as a deity but honored as the medium of divine presence — comparable to the Burning Bush (Exodus 3), Elijah\'s altar fire (1 Kings 18), and Pentecost (Acts 2:3).',
              parallels: [
                { label: 'Sacred Fire — Five Traditions', note: 'Zoroastrian Atar / Hebrew divine fire / Hindu Agni / Roman Vestal flame / Mandaean living water-fire — five traditions independently maintain perpetual sacred fire as divine presence.' },
              ]
            },
          ]
        },
        { ref: 'Y 30.6',
          text: 'Between them the daêvas did not choose aright, for as they deliberated, delusion overcame them, so that they chose the most Evil Mind. Then they rushed together to Violence, that they might enfeeble the world of men.',
          entities: [
            { word: 'daêvas', node: 'ahriman', type: 'theme',
              note: 'Daēvas — Zoroastrian demons. Cognate with Sanskrit deva (gods) and Latin deus (god). The most striking cross-traditional inversion in comparative religion: in Vedic religion deva are good divine beings; in Zoroastrianism the same word means demons. The same linguistic family split into opposite valences. The Aēshma Daēva (demon of wrath) survives in Hebrew as Asmodeus (Book of Tobit) — one of the clearest documented Zoroastrian→Jewish transmissions.',
            },
          ]
        },
        { ref: 'Y 30.7',
          text: 'And to this world came Devotion together with Dominion, Good Mind, and Truth: and to the deeds of salvation, Endurance gave body, strength; and Piety, as the first did for the Lie, so now for Truth.',
          entities: [
            { word: 'Good Mind', node: 'ahura-mazda', type: 'theme',
              note: 'Vohu Manah — Good Mind/Good Thought — one of the Amesha Spentas (Holy Immortals), the divine aspects of Ahura Mazda. The divine cognitive principle: right understanding, beneficial intelligence. In later Zoroastrianism Vohu Manah is the angel who leads the soul to paradise.',
            },
          ]
        },
      ]
    },
  ]
};

// ── 13. GOSPEL OF THOMAS — SELECTED LOGIA ─────────────────────────────────
SCRIPTURE_TEXTS['gospel-of-thomas'] = {
  title      : 'Gospel of Thomas — Selected Logia',
  shortTitle : 'Gospel of Thomas',
  tradition  : 'Gnostic / Early Christianity',
  date       : 'c. 50–140 CE (Greek original lost; Coptic Nag Hammadi ms. c. 340 CE)',
  intro      : 'The Gospel of Thomas is 114 sayings attributed to Jesus, discovered at Nag Hammadi in 1945. Unlike the canonical gospels, it has no narrative, no passion story, no resurrection — only sayings. Logion 1 frames everything: "Whoever discovers the meaning of these sayings will not taste death." Salvation is understanding, not faith. Thomas is the key text for the self-knowledge (gnosis) tradition: the divine is not remote but the very ground of the seeker\'s identity. Logion 77 is the vault\'s sharpest single-sentence statement of divine immanence, shared structurally by Advaita Vedanta, Rhineland mysticism, Sufi waḥdat al-wujūd, and Huayan Buddhism.',
  crossTradition : [
    { label: 'John 1 — Logos theology', textId: 'john-1', note: '"I am the light that is above them all" (L.77) is Thomas\'s compressed version of the Logos prologue — same claim, aphoristic form.' },
    { label: 'Chandogya 6.8 — Tat Tvam Asi', textId: 'chandogya-621', note: '"The kingdom is inside you and outside you" (L.3) is the closest New Testament parallel to tat tvam asi.' },
    { label: 'Poimandres — Self-Knowledge as Salvation', textId: 'poimandres', note: '"Know thyself and know the Father" maps precisely onto Thomas\'s gnosis-as-salvation structure.' },
    { label: 'Tao Te Ching — The Unspoken', textId: 'tao-te-ching-1', note: 'L.1 ("secret sayings") shares the Daoist structure: the truth that saves cannot be fully transmitted in language.' },
  ],
  translations : [
    { id: 'patterson', label: 'Patterson-Meyer 1992 (T1)' },
    { id: 'lambdin',   label: 'Lambdin 1988 (T1)' },
    { id: 'coptic',    label: 'Coptic (original)' },
  ],
  sections : [
    {
      heading : 'The Frame and the Kingdom',
      verses  : [
        { ref: 'L. 1',
          text: 'And he said: Whoever discovers the interpretation of these sayings will not taste death.',
          textVersions: {
            lambdin: 'And he said, "Whoever finds the interpretation of these sayings will not experience death."',
            coptic:  'auw peJaF Je petahe ermhneian nneiSaJe naJi Jipe mmou an\n[And he said: Whoever finds the interpretation of these words will not taste death]',
          },
          entities: [
            { word: 'interpretation', node: 'tradition-gnosticism', type: 'theme',
              note: 'Hermēneia — interpretation, discernment, gnosis. The gospel frames itself as a riddle-collection requiring decoding — salvation is understanding, not belief. This is the structural difference between Gnostic and Catholic Christian soteriology. Irenaeus attacked Thomas\'s emphasis on individual interpretation as anarchic; Thomas vindicates the Gnostic position from the first word.',
              parallels: [
                { label: 'Zen kōan tradition', note: 'The kōan — an unresolvable riddle triggering enlightenment — is structurally identical to Thomas\'s "hidden sayings requiring interpretation."' },
              ]
            },
          ]
        },
        { ref: 'L. 3',
          text: 'Jesus said: If your leaders say to you, "Look, the kingdom is in the sky," then the birds of the sky will precede you. If they say to you, "It is in the sea," then the fish will precede you. Rather, the kingdom is inside you and it is outside you.',
          entities: [
            { word: 'kingdom', node: 'logos-johannine', type: 'theme',
              note: 'The kingdom (Coptic: tmntrro) is Thomas\'s term for the state of realized divine self-knowledge — not a future political event or post-mortem reward but a present condition. "Inside you and outside you" = the divine ground is both the seeker\'s own depth AND the structure of all things. This is the precise claim of Chandogya\'s tat tvam asi and Huayan\'s mutual interpenetration.',
              parallels: [
                { label: 'Tat Tvam Asi — Chandogya 6.8', textId: 'chandogya-621', note: '"That art thou" — the Brahman you seek is identical with the self that seeks. Thomas\'s "inside you" is the New Testament\'s nearest statement of this.' },
              ]
            },
          ]
        },
        { ref: 'L. 22',
          text: 'Jesus said to them: When you make the two into one, and when you make the inner like the outer and the outer like the inner, and the upper like the lower, and when you make male and female into a single one, so that the male will not be male nor the female be female — then you will enter the kingdom.',
          entities: [
            { word: 'make the two into one', node: 'anthropos-gnostic', type: 'theme',
              note: 'The restoration of the androgynous Anthropos — the primal Human who existed before the division into male and female. In Gnostic cosmology the Fall is the sundering of primal unity into multiplicity; salvation is the reversal. Paul\'s "neither male nor female" (Gal 3:28) is the same move in a different register.',
              parallels: [
                { label: 'Poimandres — Androgynous Anthropos', textId: 'poimandres', note: 'Poimandres CH I.14–15: the primal Anthropos descends into matter, becomes divided. Gnostic salvation = the undoing of this division.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading : 'Light Sayings',
      verses  : [
        { ref: 'L. 50',
          text: 'Jesus said: If they say to you, "Where did you come from?" say to them, "We came from the light, from the place where the light came into being by itself, established itself, and appeared in their image." If they say to you, "Is it you?" say, "We are its children, and we are the chosen of the living Father."',
          entities: [
            { word: 'light', node: 'primordial-darkness', type: 'theme',
              note: 'Thomas\'s light theology: the divine ground IS light (L.77), the Gnostic soul COMES FROM light (L.50), and the light is self-generating ("came into being by itself"). This is the Coptic equivalent of the Greek autogenes (self-begotten) — the Sethian Gnostic designation for Christ as the third principle of the divine triad.',
              parallels: [
                { label: 'John 1:4–5 — Life was the light', textId: 'john-1', note: '"In him was life, and the life was the light of men." The Johannine Light-Life equation parallels Thomas\'s light theology.' },
                { label: 'Poimandres — Nous as pure light', textId: 'poimandres', note: 'CH I.4: "I beheld a boundless light." The Hermetic Nous is pure undifferentiated light — same as Thomas\'s generative light.' },
              ]
            },
          ]
        },
        { ref: 'L. 77',
          text: 'Jesus said: I am the light that is above them all. I am the All; the All came forth from me, and the All attained to me. Split a piece of wood — I am there. Lift up the stone, and you will find me there.',
          textVersions: {
            coptic: 'JeJ pe pouoein eteHiJn Pthr\nanoJ pe pthr\naf ei ebol nHht auw pthrf aJn eHrai eroJ\nBoq nnoue JeanoJ eimmaau\nTwwbe eHrai mpwne tetnaHe eroJ eHrai mmaau\n[I am the light that is above all things\nI am everything\nfrom me everything came and to me everything returns\nSplit wood: I am there\nlift the stone and you will find me there]',
          },
          entities: [
            { word: 'I am the light', node: 'logos-johannine', type: 'theme',
              note: '"I am the light that is above them all" — the most explicit statement of divine omnipresence in Thomas. "I am the All; the All came forth from me" is simultaneously the Johannine Logos theology, the Hermetic Nous-as-source doctrine, and the Vedantic tat tvam asi.',
              parallels: [
                { label: 'John 8:12 — "I am the light of the world"', textId: 'john-1', note: 'The canonical parallel — same "I am" + light claim, without Thomas\'s immanence extension into wood and stone.' },
                { label: 'Tat Tvam Asi — Chandogya', textId: 'chandogya-621', note: '"I am the All" = "I am Brahman." The divine ground is not merely present in all things but IS all things.' },
              ]
            },
            { word: 'Split a piece of wood', node: 'tradition-gnosticism', type: 'theme',
              note: 'The radical immanence of L.77b: "Split wood — I am there. Lift up the stone — you will find me." The most concrete statement of panentheism in the gospel tradition. Parallels Meister Eckhart: "God is in a stone or a log, though they do not know it" — and Zen\'s "Buddha-nature is in a dried dung-stick" (Yunmen). 1,200 years and 8,000 km separate these three statements; same structure.',
              parallels: [
                { label: 'Eckhart — God in a Stone', note: 'Meister Eckhart: "God is equally in all things: in a stone, in a log of wood." Structurally identical to L.77b.' },
              ]
            },
          ]
        },
        { ref: 'L. 108',
          text: 'Jesus said: Whoever drinks from my mouth will become like me; I myself shall become that person, and the hidden things will be revealed to that person.',
          entities: [
            { word: 'become like me', node: 'anthropos-gnostic', type: 'theme',
              note: 'The Thomas soteriology at its most explicit: the goal is not union into the divine but mutual identification — "I myself shall become that person." This is the theosis doctrine (Athanasius: "God became man so that man might become God") taken to its radical conclusion. Parallels Sufi fanāʾ — complete dissolution into the divine — and Vedantic "I am Brahman."',
              parallels: [
                { label: 'Sufi Fanāʾ — al-Hallaj', note: 'Ana al-Haqq ("I am the Truth") — al-Hallaj\'s claim of complete divine identification. Thomas\'s logion is the same claim from the mouth of Jesus.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 14. SEFER YETZIRAH — CHAPTERS 1–2 ─────────────────────────────────────
SCRIPTURE_TEXTS['sefer-yetzirah'] = {
  title      : 'Sefer Yetzirah — Book of Formation (Chs. 1–2)',
  shortTitle : 'Sefer Yetzirah',
  tradition  : 'Kabbalistic / Jewish',
  date       : 'c. 3rd–6th century CE (attributed to Abraham; oldest surviving Kabbalistic text)',
  intro      : 'The Sefer Yetzirah (Book of Formation) is the oldest surviving Kabbalistic text. In under 2,000 words, it presents the universe as created through 32 paths of wisdom: 10 sefirot (divine dimensions) and 22 letters of the Hebrew alphabet. God does not create from nothing by fiat alone — God creates by manipulating the building-blocks of language itself. The central claim is among the most radical in world literature: letters are not signs pointing to things; letters ARE the things. This is the inverse of Saussure\'s "arbitrary sign" (1916) — in Sefer Yetzirah the relationship between signifier and signified is necessary, cosmological, and operative. Medieval Kabbalists used the letter-permutation methods described here as a full contemplative technology — structurally identical to Vedic mantra science and Iamblichean theurgy.',
  crossTradition : [
    { label: 'Memphite Theology — Ptah Creates by Letters', textId: 'memphite-theology', note: 'The Shabaka Stone\'s "heart thinks, tongue commands" is the Egyptian version of Sefer Yetzirah\'s letter-as-creation-tool doctrine.' },
    { label: 'John 1:1 — In the Beginning was the Word', textId: 'john-1', note: 'The Johannine Logos as divine creative speech — the closest New Testament parallel to creation-by-letter.' },
    { label: 'Tantric Sanskrit — Mātṛkā Doctrine', note: 'The Tantric teaching that Sanskrit phonemes are the building-blocks of reality (mātṛkā = "little mothers" of the cosmos) is structurally identical to Sefer Yetzirah\'s 22 letters as creation-tools. Independent development, same metaphysical structure.' },
    { label: 'Nāsadīya Sūkta — Pre-Creation One', textId: 'nasadiya-sukta', note: 'Sefer Yetzirah\'s pre-formation state (before the letters are deployed) parallels the Vedic pre-creation "One" before differentiation.' },
  ],
  translations : [
    { id: 'kaplan', label: 'Kaplan 1990 (T1)' },
    { id: 'hayman', label: 'Hayman 2004 (critical edition, T1)' },
    { id: 'hebrew', label: 'Hebrew (original)' },
  ],
  sections : [
    {
      heading : 'Chapter 1 — The Ten Sefirot',
      verses  : [
        { ref: '1:1',
          text: 'With thirty-two mystical paths of Wisdom, God engraved and created His universe. These are: ten Sefirot of Nothingness, and twenty-two foundation letters.',
          textVersions: {
            hayman: 'In thirty-two wondrous paths of wisdom, Yah, Lord of hosts, God of Israel, Living God, Almighty God — He engraved and created his world with three sefarim: with text (sefer), with number (sippur), and with communication (sipur).',
            hebrew: 'בְּשְׁלֹשִׁים וּשְׁתַּיִם נְתִיבוֹת פְּלִיאוֹת חָכְמָה\nחָקַק יָהּ יְהוָה צְבָאוֹת\nוּבָרָא אֶת עוֹלָמוֹ בִּשְׁלֹשָׁה סְפָרִים\nבְּסֵפֶר וְסֵפֶר וְסִפּוּר\n[In thirty-two wondrous paths of Wisdom\nGod engraved and created His universe\nwith three books: text, number, communication]',
          },
          entities: [
            { word: 'thirty-two', node: 'alphabet-sefer-yetzirah', type: 'document',
              note: '32 = 10 sefirot + 22 Hebrew letters. The number is not arbitrary: 32 is the numerical value of the Hebrew word לב (lev, "heart") — the universe is created "from the heart of God." Sefer Yetzirah is the foundational document of the entire Kabbalistic tradition: Bahir, Zohar, Lurianic Kabbalah all build on its 32-path framework.',
            },
            { word: 'engraved', node: 'creation-by-word', type: 'theme',
              note: 'Chakak — "engraved." God\'s creative act is not speaking alone (as in Genesis 1) but engraving — making permanent marks in the substance of reality. Three verbs: chakak (engrave), chatzav (hew/cut), tzaraf (combine). Creation is a lapidary art: the universe is a text inscribed in the fabric of being.',
              parallels: [
                { label: 'Ptah as Craftsman-Creator', textId: 'memphite-theology', note: 'Ptah is the divine craftsman who creates by designing (heart) and executing (tongue). Sefer Yetzirah\'s engraving God is the Hebrew craftsman-creator equivalent.' },
              ]
            },
          ]
        },
        { ref: '1:2',
          text: 'Ten Sefirot of Nothingness: ten and not nine, ten and not eleven. Understand with Wisdom; be wise with Understanding. Examine with them, probe from them, know, think, and form. Set the thing clearly, and restore the Creator to His place.',
          textVersions: {
            hebrew: 'עֶשֶׂר סְפִירוֹת בְּלִימָה\nעֶשֶׂר וְלֹא תֵשַׁע\nעֶשֶׂר וְלֹא אַחַד עָשָׂר\nהָבֵן בְּחָכְמָה וַחֲכַם בְּבִינָה\n[Ten sefirot of nothingness\nten and not nine, ten and not eleven\nUnderstand with Wisdom, be wise with Understanding]',
          },
          entities: [
            { word: 'Sefirot of Nothingness', node: 'ein-sof', type: 'theme',
              note: 'Sefirot belimah — "sefirot of the void/nothingness." The sefirot are the ten primordial dimensions through which the Infinite (Ein Sof) limits and channels itself into creation. "Ten and not nine, ten and not eleven" — the number is exact and non-negotiable. "Nothingness" here means they have no independent existence — they are modes of the divine, not separate entities.',
              parallels: [
                { label: 'Plotinus — The One Beyond Being', textId: 'poimandres', note: 'The Neoplatonic One is "beyond being" — the source of all hypostases but not itself a hypostasis. Same structure: the infinite source manifests through numbered principles.' },
              ]
            },
            { word: 'no end', node: 'apophatic-mysticism', type: 'theme',
              note: 'Sefer Yetzirah describes the sefirot as extending infinitely in all six directions — the divine is absolutely unlimited. Same apophatic structure as the Tao ("the Tao that can be named is not the eternal Tao") and Plotinus\'s One.',
              parallels: [
                { label: 'Tao Te Ching — Limitless Tao', textId: 'tao-te-ching-1', note: '"The Tao that can be told is not the eternal Tao" — same apophatic structure: the absolute cannot be bounded.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading : 'Chapter 2 — The Twenty-Two Letters',
      verses  : [
        { ref: '2:1',
          text: 'Twenty-two foundation letters: He engraved them, He carved them, He permuted them, He weighed them, He transformed them, and with them He depicted all that was formed and all that would be formed.',
          textVersions: {
            hayman: 'Twenty-two foundation letters: he engraved them, he hewed them, he weighed them, he combined them, he formed with them the soul of all created and the soul of all that would be created.',
            hebrew: 'עֶשְׂרִים וּשְׁתַּיִם אוֹתִיּוֹת יְסוֹד\nחֲקָקָן חֲצָבָן שְׁקָלָן הֵמִיר בָּהֶן\nצָרַף אוֹתָן יָצַר בָּהֶן נֶפֶשׁ כָּל הַיָּצוּר\n[Twenty-two foundation letters\nengraved, hewed, weighed, combined\nformed the soul of all created]',
          },
          entities: [
            { word: 'Twenty-two foundation letters', node: 'alphabet-sefer-yetzirah', type: 'document',
              note: 'The 22 letters of the Hebrew alphabet as the 22 building-blocks of creation. Not symbols but substances: each letter is a primordial form-principle whose combination generates every created thing. The medieval Kabbalist Abraham Abulafia (c. 1240–1291) developed this into a full contemplative technology: rapid permutation of divine names, synchronized with breathing, produces prophetic consciousness — structurally identical to Vedic mantra science and Iamblichean theurgy with vowel sequences.',
              parallels: [
                { label: 'Sanskrit Phonemes as Mātṛkā', note: 'The 50 Sanskrit letters as the 50 mothers of all creation — each phoneme is a divine feminine power (śakti). No documented contact; identical structural claim.' },
                { label: 'Jorge Luis Borges — Library of Babel', note: 'Borges\'s Library (1941) is a direct literary descendant of Sefer Yetzirah\'s combinatorial creation: the universe as the complete library of all letter-combinations.' },
              ]
            },
            { word: 'permuted', node: 'creation-by-word', type: 'theme',
              note: 'Tziruf — permutation, combination. God creates by taking the 22 letters and permuting them into all possible sequences. Chapter 2 calculates the number of permutations: 22! possibilities. The universe is the complete library of all letter-combinations.',
            },
          ]
        },
        { ref: '2:2',
          text: 'Twenty-two foundation letters: He placed them in a wheel with 231 gates. The wheel rotates forward and backward. And this is the sign: nothing in good is higher than delight (OnG — ענג), nothing in evil is lower than plague (NGO — נגע).',
          entities: [
            { word: '231 gates', node: 'alphabet-sefer-yetzirah', type: 'document',
              note: '231 = the number of two-letter combinations from 22 letters (22×21/2). The "231 gates" are all two-letter root combinations of Hebrew — the lexical building-blocks from which all Hebrew words are formed.',
            },
            { word: 'delight', node: 'tradition-kabbalah', type: 'theme',
              note: 'OnG (ענג, delight) reversed is NeGA (נגע, plague/affliction). Same three letters — aleph, nun, gimel — in opposite order. The difference between delight and plague is letter-order. Creation\'s moral axis is encoded in the alphabet\'s combinatorial structure.',
            },
          ]
        },
      ]
    },
  ]
};

// ── 15. QURAN — AL-FATIHA + AYAT AL-KURSI + NUR VERSE ─────────────────────
SCRIPTURE_TEXTS['quran-fatiha-nur'] = {
  title      : 'Quran — Al-Fatiha · Ayat al-Kursi · Nur Verse',
  shortTitle : 'Quran — Key Verses',
  tradition  : 'Islam',
  date       : 'c. 610–632 CE (recited); compiled c. 650 CE',
  intro      : 'Three passages constituting the theological core of the Quran. Al-Fatiha (The Opening, Sura 1) is recited 17 times daily in Muslim prayer. Ayat al-Kursi (2:255, the Throne Verse) is widely considered the most powerful single verse in the Quran. The Nur Verse (24:35, the Light Verse) is the gateway into Islamic mystical theology — Al-Ghazālī wrote an entire treatise on it, Ibn Arabi\'s waḥdat al-wujūd is grounded in it. Together they form a theological triple: divine character (Fatiha), divine sovereignty (Throne Verse), divine presence (Light Verse).',
  crossTradition : [
    { label: 'John 1 — Logos and Light', textId: 'john-1', note: 'The Nur Verse\'s "light upon light" and John\'s "true light that gives light to everyone" are the same mystical claim — divine light as the medium of divine self-disclosure.' },
    { label: 'Tao Te Ching — The Unnameable', textId: 'tao-te-ching-1', note: 'Al-Fatiha\'s "Lord of the Worlds" and the Tao as source of all worlds share the apophatic structure: the source exceeds any single name.' },
    { label: 'Poimandres — Divine Light', textId: 'poimandres', note: 'CH I.4 "a boundless Light" — the Hermetic Nous as pure light is the closest structural parallel to the Nur Verse.' },
    { label: 'Gospel of Thomas L.77', textId: 'gospel-of-thomas', note: '"I am the light that is above them all" — Thomas\'s compressed statement of the same divine-as-light theology.' },
  ],
  translations : [
    { id: 'abdel-haleem', label: 'Abdel Haleem 2004 (T1)' },
    { id: 'arberry',      label: 'Arberry 1955 (T1)' },
    { id: 'arabic',       label: 'Arabic (original)' },
  ],
  sections : [
    {
      heading : 'Sura 1 — Al-Fatiha (The Opening)',
      verses  : [
        { ref: '1:1–7',
          text: 'In the name of God, the Lord of Mercy, the Giver of Mercy. Praise belongs to God, Lord of the Worlds, the Lord of Mercy, the Giver of Mercy, Master of the Day of Judgement. It is You we worship; it is You we ask for help. Guide us to the straight path: the path of those You have blessed, those who incur no anger and who have not gone astray.',
          textVersions: {
            arberry: 'In the Name of God, the Merciful, the Compassionate. Praise belongs to God, the Lord of all Being, the All-merciful, the All-compassionate, the Master of the Day of Doom. Thee only we serve; to Thee alone we pray for succour. Guide us in the straight path, the path of those whom Thou hast blessed, not of those against whom Thou art wrathful, nor of those who are astray.',
            arabic:  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمَٰنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
          },
          entities: [
            { word: 'Lord of Mercy', node: 'tradition-islam', type: 'tradition',
              note: 'Al-Rahman al-Rahim — "the Compassionate, the Merciful." Both names derive from r-ḥ-m (womb, compassion) — same root as Hebrew raḥum (merciful) and reḥem (womb). The divine mercy is linguistically a womb-quality: enveloping, life-giving. Rahman appears 57 times in the Quran; rahim 95 times. The Bismillah formula begins every action in Muslim life by invoking divine mercy.',
              parallels: [
                { label: 'Hebrew Raḥamim — Divine Womb-Compassion', note: 'The Hebrew divine attribute raḥamim shares the r-ḥ-m root. Both traditions define God primarily by womb-compassion.' },
              ]
            },
            { word: 'Lord of the Worlds', node: 'creation-by-word', type: 'theme',
              note: 'Rabb al-ʿālamīn — "Lord of the Worlds" (plural, ʿālamīn). The Quran uses the plural: God is lord not of this world alone but of all possible realms of existence — the most cosmologically expansive divine title in world scripture.',
            },
            { word: 'straight path', node: 'tradition-islam', type: 'tradition',
              note: 'Al-ṣirāṭ al-mustaqīm. The same moral-path metaphor appears in Zoroastrian Asha (right path of truth), the Buddhist Eightfold Path, and Confucian "right way" (zhengdao) — independently in four major traditions as the dominant spatial metaphor for ethics.',
              parallels: [
                { label: 'Zoroastrian Asha — Path of Truth', textId: 'yasna-30', note: 'The Avestan asha (Truth/Right Order) is the cosmic path — same moral-path metaphor as the Islamic ṣirāṭ.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading : 'Sura 2:255 — Ayat al-Kursi (The Throne Verse)',
      verses  : [
        { ref: '2:255',
          text: 'God: there is no god but Him, the Ever Living, the Ever Watchful. Neither slumber nor sleep overtakes Him. All that is in the heavens and in the earth belongs to Him. Who is there that can intercede with Him except by His leave? He knows what is before them and what is behind them, but they do not comprehend any of His knowledge except what He wills. His throne extends over the heavens and the earth; it does not weary Him to preserve them both. He is the Most High, the Tremendous.',
          textVersions: {
            arberry: 'God, there is no god but He, the Living, the Everlasting. Slumber seizes Him not, neither sleep; to Him belongs all that is in the heavens and the earth. Who is there that shall intercede with Him save by His leave? He knows what lies before them and what is after them, and they comprehend not anything of His knowledge save such as He wills. His Throne comprises the heavens and earth; the preserving of them oppresses Him not; He is the All-high, the All-glorious.',
            arabic:  'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ\nلَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ\nوَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ\nوَهُوَ الْعَلِيُّ الْعَظِيمُ',
          },
          entities: [
            { word: 'no god but Him', node: 'apophatic-mysticism', type: 'theme',
              note: 'Lā ilāha illā Allāh. The shahāda is structurally apophatic: it begins with negation (lā ilāha = no god) before the affirmation. Islamic theologians note the negation is the more important move — denying all divinization of the created before designating what remains.',
              parallels: [
                { label: 'Neti Neti — Advaita Vedanta', note: '"Not this, not this" — the Upanishadic via negativa strips away all predications to arrive at pure Brahman. Same apophatic logic as the shahāda.' },
              ]
            },
            { word: 'throne extends over the heavens and the earth', node: 'tradition-islam', type: 'theme',
              note: 'Al-kursī — the divine throne. The image is shared across Abrahamic traditions: Merkabah (divine chariot/throne) mysticism in Judaism (based on Ezekiel 1), the Christian "throne of grace" (Hebrews 4:16), and Islamic al-kursī. The Merkabah tradition (c. 200–700 CE) almost certainly influenced Quranic imagery through Jewish converts and cultural contact.',
            },
          ]
        },
      ]
    },
    {
      heading : 'Sura 24:35 — Ayat an-Nur (The Light Verse)',
      verses  : [
        { ref: '24:35',
          text: 'God is the Light of the heavens and earth. His Light is like this: there is a niche, and in it a lamp, the lamp inside a glass, a glass like a glittering star, fuelled from a blessed olive tree from neither east nor west, whose oil almost gives light even when no fire touches it — light upon light. God guides whoever He will to His Light.',
          textVersions: {
            arberry: 'God is the Light of the heavens and the earth; the likeness of His Light is as a niche wherein is a lamp (the lamp in a glass, the glass as it were a glittering star) kindled from a Blessed Tree, an olive that is neither of the East nor of the West whose oil wellnigh would shine, even if no fire touched it; Light upon Light; God guides to His Light whom He will.',
            arabic:  'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ\nمَثَلُ نُورِهِ كَمِشْكَاةٍ فِيهَا مِصْبَاحٌ\nالْمِصْبَاحُ فِي زُجَاجَةٍ الزُّجَاجَةُ كَأَنَّهَا كَوْكَبٌ دُرِّيٌّ\nيُوقَدُ مِنْ شَجَرَةٍ مُبَارَكَةٍ زَيْتُونَةٍ\nلَا شَرْقِيَّةٍ وَلَا غَرْبِيَّةٍ\nيَكَادُ زَيْتُهَا يُضِيءُ وَلَوْ لَمْ تَمْسَسْهُ نَارٌ\nنُورٌ عَلَىٰ نُورٍ',
          },
          entities: [
            { word: 'Light of the heavens and earth', node: 'primordial-darkness', type: 'theme',
              note: 'Allāhu nūr al-samāwāti wa\'l-arḍ — "God IS the Light." This verse is the gateway to Islamic mystical theology. Al-Ghazālī wrote a full treatise on it (Mishkāt al-Anwār). The Sufi tradition reads it as the most direct Quranic statement of tawhid-as-mystical-unity: if God is the light, and light is the medium through which all things are seen, then God is the condition of all perception and existence. Ibn Arabi\'s waḥdat al-wujūd (Unity of Being) is grounded in this verse.',
              parallels: [
                { label: 'John 1:9 — The True Light', textId: 'john-1', note: '"The true light that gives light to everyone" — the Johannine claim that the Logos IS the light parallels the Quranic "God IS the light."' },
                { label: 'Poimandres — Boundless Light', textId: 'poimandres', note: 'The Hermetic Nous appears as boundless light — structural parallel to the Nur Verse\'s divine-as-light theology.' },
              ]
            },
            { word: 'light upon light', node: 'logos-johannine', type: 'theme',
              note: 'Nūr ʿalā nūr — the climactic phrase. The oil-lamp metaphor amplifies progressively: niche → lamp → glass → star → blessed oil that "almost gives light without fire." Each layer intensifies and clarifies the previous one. Al-Ghazālī identifies five levels of light in the verse, each corresponding to a stage of mystical illumination. Almost certainly in dialogue with the Nicene Creed\'s "Light from Light, true God from true God" (325 CE) — whether influence or contrast, both use the same amplifying-light formula.',
              parallels: [
                { label: 'Nicene Creed — Light from Light', note: '"Light from Light, true God from true God" (325 CE). The Trinitarian light-upon-light formula precedes the Quranic one by ~285 years.' },
                { label: 'Gospel of Thomas L.77', textId: 'gospel-of-thomas', note: '"I am the light that is above them all" — Thomas\'s compressed version of the same divine-as-light claim.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 16. JOB 38 — GOD FROM THE WHIRLWIND ──────────────────────────────────
SCRIPTURE_TEXTS['job-38'] = {
  title      : 'Job 38–42 — The Voice from the Whirlwind',
  shortTitle : 'Job 38 — Whirlwind',
  tradition  : 'Hebrew Bible / Wisdom Literature',
  date       : 'c. 6th–4th century BCE (text); the story may be pre-Israelite',
  intro      : 'After 37 chapters of complaints and failed theodicies, God answers — not with an explanation, but with a counter-question. "Where were you when I laid the foundation of the earth?" The whirlwind speech is one of the most sustained meditations on cosmic incomprehensibility in world literature. It is simultaneously the Bible\'s most powerful statement of the limits of human knowledge and the most aesthetically overwhelming passage in the Hebrew canon. The Book of Job\'s theodicy is ultimately the refusal of theodicy: the demand for an explanation is itself questioned. The same structural move as the Nāsadīya Sūkta\'s "who knows?" and the Tao Te Ching\'s Tao-that-cannot-be-named.',
  crossTradition : [
    { label: 'Nāsadīya Sūkta — Who Knows?', textId: 'nasadiya-sukta', note: '"Who really knows? Who will here proclaim it?" — the Vedic creation hymn ends with the same unanswerable question as God\'s speech to Job.' },
    { label: 'Tao Te Ching — Beyond Knowledge', textId: 'tao-te-ching-1', note: 'The Tao that exceeds all human comprehension is the Daoist structural parallel to God\'s whirlwind speech.' },
    { label: 'Poimandres — Cosmic Vision', textId: 'poimandres', note: 'The Hermetic vision of the cosmic hierarchy is the Hermetic equivalent of God\'s tour through cosmic order in Job 38–39.' },
  ],
  translations : [
    { id: 'nrsv',   label: 'NRSV 1989 (T1)' },
    { id: 'njps',   label: 'NJPS 1985 (T1)' },
    { id: 'hebrew', label: 'Hebrew (Masoretic)' },
  ],
  sections : [
    {
      heading : 'Job 38:1–7 — The Foundation of the Earth',
      verses  : [
        { ref: '38:1–3',
          text: 'Then the LORD spoke to Job out of the whirlwind. He said: Who is this that obscures my plans with words without knowledge? Brace yourself like a man; I will question you, and you shall answer me.',
          textVersions: {
            njps:   'Then the LORD replied to Job out of the tempest and said: Who is this who darkens counsel, speaking without knowledge? Gird your loins like a man; I will ask and you will inform Me.',
            hebrew: 'וַיַּעַן יְהוָה אֶת-אִיּוֹב מִן הַסְּעָרָה\nמִי זֶה מַחְשִׁיךְ עֵצָה בְמִלִּים בְּלִי-דָעַת\nאֱזָר-נָא כְגֶבֶר חֲלָצֶיךָ\nוְאֶשְׁאָלְךָ וְהוֹדִיעֵנִי\n[Then YHWH answered Job from the whirlwind:\nWho is this darkening counsel with words without knowledge?\nGird your loins like a man — I will question you]',
          },
          entities: [
            { word: 'whirlwind', node: 'tradition-judaism', type: 'tradition',
              note: 'The sĕʿārāh (whirlwind/storm) as vehicle of divine theophany is one of the most persistent images in the Hebrew Bible. Elijah\'s ascent (2 Kings 2:11); Ezekiel\'s vision (1:4, "a great cloud with fire flashing"); and here. The storm is not chaos but the approach of overwhelming order — the divine that exceeds human containment, approaching in the form that most forcibly demonstrates its incomprehensibility.',
            },
          ]
        },
        { ref: '38:4–7',
          text: 'Where were you when I laid the earth\'s foundation? Tell me, if you understand. Who marked off its dimensions? Surely you know! Who stretched a measuring line across it? On what were its footings set, or who laid its cornerstone — while the morning stars sang together and all the angels shouted for joy?',
          textVersions: {
            njps:   'Where were you when I laid the earth\'s foundations? Speak if you have understanding. Do you know who fixed its dimensions, or who measured it with a line? Onto what were its bases sunk? Who set its cornerstone when the morning stars sang together and all the divine beings shouted for joy?',
            hebrew: 'אֵיפֹה הָיִיתָ בְּיָסְדִי-אָרֶץ\nהַגֵּד אִם-יָדַעְתָּ בִינָה\nמִי-שָׂם מְמַדֶּיהָ כִּי תֵדָע\nבְּרָן יַחַד כּוֹכְבֵי בֹקֶר\nוַיָּרִיעוּ כָּל-בְּנֵי אֱלֹהִים',
          },
          entities: [
            { word: 'Where were you', node: 'wisdom-personified', type: 'theme',
              note: 'The theological pivot of the entire book. Job demanded an explanation of his suffering; God responds not with an explanation but with a counter-demand for Job\'s CV of creation. The implication: to understand suffering, you would have to understand the whole — and you were not there for the whole. The theodicy of Job is the refusal of theodicy: the demand for an explanation is itself questioned.',
              parallels: [
                { label: 'Nāsadīya Sūkta — Who Knows?', textId: 'nasadiya-sukta', note: '"Whence this creation — only He knows — or perhaps He does not know." The Vedic poem ends by questioning whether even God knows — a more radical move than Job.' },
              ]
            },
            { word: 'morning stars sang together', node: 'tradition-judaism', type: 'theme',
              note: 'Bĕnê ʾĕlōhîm (divine beings) shouting for joy at creation. The cosmic choir at creation is a Near Eastern topos: the Anunnaki gods shouting acclamation in Enuma Elish; the Psalms\' "sons of God" ascribing glory (Psalm 29). "Morning stars sang" also connects to the Pythagorean Music of the Spheres — the heavenly bodies as sounds in the cosmic harmony.',
              parallels: [
                { label: 'Enuma Elish — Divine Acclamation', textId: 'enuma-elish-1', note: 'The Anunnaki gods shout acclamation when Marduk defeats Tiamat — same motif of the divine assembly celebrating the creative act.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading : 'Job 40–41 — Behemoth and Leviathan',
      verses  : [
        { ref: '40:15–19',
          text: 'Look at Behemoth, which I made along with you and which feeds on grass like an ox. What strength it has in its loins, what power in the muscles of its belly! Its tail sways like a cedar; the sinews of its thighs are close-knit. Its bones are tubes of bronze, its limbs like rods of iron. It ranks first among the works of God.',
          entities: [
            { word: 'Behemoth', node: 'leviathan', type: 'theme',
              note: 'Behemoth and Leviathan appear together as the two great primordial creatures — one land, one sea — made by God at creation. In Enuma Elish, Marduk defeats the sea-chaos (Tiamat); in Ugaritic myth, Baal defeats Yam and Lotan (= Leviathan). But God\'s move here is more radical: these chaos-creatures were not defeated but created, and God is proud of them. Chaos is not opposed to the divine but owned by it.',
              parallels: [
                { label: 'Tiamat — Enuma Elish', textId: 'enuma-elish-1', note: 'Tiamat is the primordial sea-dragon defeated by Marduk — the same cosmic-chaos figure as Leviathan. Job\'s God didn\'t defeat Leviathan; he created it.' },
              ]
            },
          ]
        },
        { ref: '41:1–5',
          text: 'Can you pull in Leviathan with a fishhook or tie down its tongue with a rope? Can you put a cord through its nose or pierce its jaw with a hook? Will it keep begging you for mercy? Will it speak to you with gentle words? Will it make an agreement with you for you to take it as your slave for life?',
          entities: [
            { word: 'Leviathan', node: 'leviathan', type: 'deity',
              note: 'Leviathan (לִוְיָתָן) — the coiling sea-dragon. In Isaiah 27:1, YHWH will slay Leviathan at the end of days. But in Job 41, Leviathan is God\'s creature and the most terrifying demonstration of divine power. The theological move: the most terrifying thing in the cosmos is not chaos opposed to God but God\'s own power in cosmic form. God\'s questions to Job culminate here: if you can\'t understand or control Leviathan, how could you understand the creator of Leviathan?',
            },
          ]
        },
      ]
    },
    {
      heading : 'Job 42:1–6 — Job\'s Response',
      verses  : [
        { ref: '42:5',
          text: 'My ears had heard of you, but now my eyes have seen you.',
          textVersions: {
            njps:   'I had heard You with my ears, but now I see You with my eyes.',
            hebrew: 'לְשֵׁמַע-אֹזֶן שְׁמַעְתִּיךָ\nוְעַתָּה עֵינִי רָאָתְךָ\n[For the hearing of the ear I had heard you\nbut now my eye sees you]',
          },
          entities: [
            { word: 'my eyes have seen you', node: 'wisdom-personified', type: 'theme',
              note: 'The climactic insight of Job — the transition from "heard" to "seen" is the transition from secondhand knowledge to direct experience: from theology to theophany, from pistis (faith) to gnosis, from Wissen (knowledge) to Erfahrung (experience). The same distinction drives the entire mystical tradition: Ibn Arabi\'s "taste" (dhawq) vs. intellectual knowledge; Buddhist direct perception (pratyakṣa) vs. inference; Eckhart\'s lived experience vs. learned doctrine.',
              parallels: [
                { label: 'Gospel of Thomas L.1 — Direct Interpretation', textId: 'gospel-of-thomas', note: '"Whoever discovers the interpretation" — Thomas\'s salvation-through-direct-understanding is the New Testament version of Job\'s transition from hearing to seeing.' },
                { label: 'Poimandres — "I Saw a Vision"', textId: 'poimandres', note: 'CH I.1: the Hermetic revelation begins as a direct vision, not a report.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading : 'Job 3:3–5 — The Curse on the Day of Birth',
      verses  : [
        { ref: '3:3–5',
          text: 'May the day of my birth perish, and the night that said, "A boy is conceived!" That day — may it turn to darkness; may God above not care about it; may no light shine on it. May gloom and utter darkness claim it once more; may a cloud settle over it; may blackness overwhelm it.',
          entities: [
            { word: 'darkness', node: 'primordial-darkness', type: 'theme',
              note: 'Job\'s curse invokes a return to pre-creation darkness — the primordial tohu wa-bohu ("formless and empty") of Genesis 1:2. By wishing the day of his birth to "turn to darkness," Job is wishing his personal existence back into the pre-existence of the void. The Book of Job\'s darkest moment is its closest approach to the cosmic nihilism of Ecclesiastes — and its closest resonance with the Vedic Nāsadīya Sūkta\'s primordial darkness.',
              parallels: [
                { label: 'Nasadiya Sukta — Pre-Creation Darkness', textId: 'nasadiya-sukta', note: '"Darkness was hidden by darkness in the beginning" — the Vedic pre-creation darkness is the same abyss Job wants to return to.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 17. ORPHIC THEOGONY — NIGHT, THE EGG, AND PHANES ──────────────────────
SCRIPTURE_TEXTS['orphic-theogony'] = {
  title      : 'Orphic Theogony — Night, the Cosmic Egg, Phanes',
  shortTitle : 'Orphic Theogony',
  tradition  : 'Orphic / Greek Mystery Religion',
  date       : 'c. 6th–4th century BCE (Derveni Papyrus c. 330 BCE; Orphic Hymns c. 2nd–4th CE for text, doctrine older)',
  intro      : 'The Orphic theogony is the Greek mystery religion\'s creation story, preserved in fragments, in the Derveni Papyrus (the oldest surviving European "book," c. 330 BCE), and in 87 Orphic Hymns. Where Hesiod\'s Theogony begins with Chaos, the Orphic tradition begins with Night — the primordial goddess from whom all things emerge. Night lays the Cosmic Egg, from which Phanes/Eros hatches as the first deity and lights the universe. The Derveni Papyrus preserves the oldest philosophical commentary on a sacred text in the Western tradition, and explicitly identifies Phanes with the Nous of Anaxagoras — making the Orphic→Platonic→Hermetic→Gnostic Nous trajectory visible in a single text. The Orphic tradition is the deepest root of the Western esoteric line: it feeds Pythagoreanism, Platonism, Neoplatonism, Gnosticism, and Renaissance Hermeticism.',
  crossTradition : [
    { label: 'Poimandres — Nous Emerges from Primordial Light', textId: 'poimandres', note: 'The Hermetic Nous emerging from boundless light is the Hermetic re-telling of Phanes hatching from the Cosmic Egg — both are the primordial divine self-disclosure from pre-creation void.' },
    { label: 'Nāsadīya Sūkta — Pre-Creation Void', textId: 'nasadiya-sukta', note: '"One thing breathed by its own power in the darkness" — the Vedic parallel to Night breathing in the void before the Egg.' },
    { label: 'John 1 — "In the beginning"', textId: 'john-1', note: 'The Johannine "In the beginning was the Logos" is the Christianized version of the Orphic "In the beginning was Night/Phanes/the One."' },
    { label: 'Popol Vuh — Void Before Creation', textId: 'popol-vuh', note: '"All was in suspense, all calm, in silence" — the Maya pre-creation void is the Mesoamerican structural parallel to Orphic Night.' },
  ],
  translations : [
    { id: 'west',   label: 'West 1983 (Orphic Fragments, T1)' },
    { id: 'taylor', label: 'Thomas Taylor 1792 (Orphic Hymns)' },
    { id: 'greek',  label: 'Greek (original)' },
  ],
  sections : [
    {
      heading : 'Orphic Hymn 3 — To Night',
      verses  : [
        { ref: 'Hymn 3.1–8',
          text: 'Night, mother of gods and men, hear me, O Night, origin of all; I call upon thee, Night, thou who didst bring forth first the blessed gods and mortal men; all things that be in the great cosmos sprang from thee, O Night, who didst envelop the boundless cosmos in thy dark wings.',
          textVersions: {
            taylor: 'Night, parent goddess, source of sweet repose, from whom at first both Gods and men arose, hear, blessed Venus, deck\'d with starry light, in sleep\'s deep silence dwelling Jet-black Night!',
            greek:  'Νύκτα θεῶν γενέτειραν ἀείσομαι ἠδὲ καὶ ἀνδρῶν\nΝὺξ γένεσις πάντων\nκλῦθι μάκαιρα θεά, κυανόπτερε\nσέ τοι ἀστεροφεγγέα κόσμον ἑλίσσουσαν\n[Night, mother of gods and men, I will sing\nNight, origin of all things\nhear me, blessed goddess, dark-winged\nyou who spin the star-shining cosmos]',
          },
          entities: [
            { word: 'Night', node: 'primordial-darkness', type: 'deity',
              note: 'Nyx (Night) — the primordial goddess in the Orphic tradition, older than Chaos in Hesiod. In the Orphic theogony, Night precedes even Time (Chronos). Zeus himself fears to offend Night (Iliad 14.259). The Orphic Night is not the absence of light but the ground from which both light and darkness emerge — same structural role as Genesis 1:2\'s pre-creation darkness, the Vedic tamas, and the Hermetic primordial groaning void.',
              parallels: [
                { label: 'Genesis 1:2 — Darkness over the Deep', textId: 'genesis-1', note: '"Darkness was over the surface of the deep" — the pre-creation darkness is the Hebrew structural equivalent of Orphic Night.' },
                { label: 'Poimandres — Primordial Darkness', textId: 'poimandres', note: 'CH I.4: "I saw a boundless darkness, deep, groaning" — the Hermetic pre-creation state is Night with voice.' },
              ]
            },
            { word: 'mother of gods and men', node: 'tradition-greek-mystery-religion', type: 'tradition',
              note: 'The Orphic tradition reverses the standard Greek theogony: in Hesiod, Night is born from Chaos. In the Orphic version, Night is the source of everything including Chaos. The Orphics deliberately deepen the Hesiodic system: standard civic religion gives narrative mythology; the Orphic tradition gives cosmogony — the pre-divine origin of the divine.',
            },
          ]
        },
      ]
    },
    {
      heading : 'The Cosmic Egg (Orphic Theogony Fragments)',
      verses  : [
        { ref: 'OF 70 (Kern)',
          text: 'Night, wrapped in the silver wings of Chronos Time, lay a great silver egg in the womb of the boundless darkness. And from this egg Eros sprang forth — radiant Phanes, the double-natured, the golden-winged First-Born, who carried in himself the seed of the gods.',
          textVersions: {
            west: '[Reconstruction from multiple testimonia] Night, wrapped in the darkness of Chronos, bore an egg. From this egg broke forth brilliant Eros/Phanes, the first-born, with golden wings, carrying in himself the seed of the gods, begetter of the blessed ones.',
            greek: 'Νὺξ ὠιὸν ἀργύφεον ἔτεκεν\nτοῦδ᾽ ἐρικυδέα Φάνητα ἐξεγένοντο\nχρυσόπτερον, ὃς κόσμου κράτος ἔσχε πρῶτος\n[Night bore a silver egg\nfrom it shining Phanes was born\ngolden-winged, who held the power of the cosmos first]',
          },
          entities: [
            { word: 'silver egg', node: 'cosmic-egg', type: 'theme',
              note: 'The Cosmic Egg from which Phanes hatches is one of the most widespread creation images in world religion. Orphic (Greek), Hiranyagarbha (Sanskrit, "golden womb/egg," Rig Veda 10.121), Brahmanda ("Brahma\'s egg," Puranas), Panhú (Chinese cosmic egg), Finnish Kalevala (egg laid on the water-mother\'s knee). Strong candidate for independent invention: it is the intuitive image for a finite universe with a definite beginning inside a larger "outside."',
              parallels: [
                { label: 'Hiranyagarbha — Golden Womb (Rig Veda 10.121)', textId: 'nasadiya-sukta', note: '"In the beginning was the Golden Germ / the one seed of all creation" — the Vedic cosmic egg is the Indian structural parallel to the Orphic silver egg.' },
              ]
            },
            { word: 'Phanes', node: 'orpheus', type: 'deity',
              note: 'Phanes (Φάνης, "the Shining One") — also called Protogonos (First-Born), Eros, and Metis. The first deity to emerge from the Cosmic Egg, double-natured (male and female), carrying within himself the seed of all future gods. Phanes is the Orphic Logos-equivalent: the first self-disclosure of the divine ground into determinate being. The Derveni Papyrus Commentary (col. XIII) explicitly identifies Phanes with the "Nous" of Anaxagoras — making the Orphic-to-Platonic-to-Hermetic Nous trajectory visible.',
              parallels: [
                { label: 'Hermetic Nous — First Principle of Light', textId: 'poimandres', note: 'The Hermetic Nous as boundless light is the Hermetic re-writing of Phanes: the first principle of the divine is light and mind simultaneously.' },
                { label: 'Johannine Logos — "In the beginning"', textId: 'john-1', note: 'The Logos as the first self-disclosure of the divine ground — same theological structure as Phanes emerging from Night\'s egg.' },
              ]
            },
          ]
        },
        { ref: 'OF 167 (Kern)',
          text: 'Phanes first appeared carrying a golden sceptre. But when Zeus had taken power, he swallowed Phanes, first king of the gods, so that all things should be within himself. And Zeus reformed all from himself, rejoining all things into one.',
          entities: [
            { word: 'swallowed Phanes', node: 'tradition-greek-mystery-religion', type: 'tradition',
              note: 'Zeus\'s swallowing of Phanes is the Orphic tradition\'s most radical theological move. Zeus internalizes all of creation: "all things should be within himself." After the swallowing, Zeus is the Orphic equivalent of the Chandogya\'s Brahman that "thinks: may I be many" — the single ground from which all differentiation re-emerges. This is the Orphic path to Platonic henology: through the succession Night → Phanes → Zeus, all multiplicity is gathered back into unity.',
              parallels: [
                { label: 'Chandogya 6.2 — One Becomes Many', textId: 'chandogya-621', note: 'Brahman "thinks: may I be many; may I grow forth" — same move: the single divine ground differentiates into multiplicity. Zeus re-differentiating after swallowing Phanes is the Greek narrative version.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading : 'The Orphic Anthropogony — Divine Sparks in Human Clay',
      verses  : [
        { ref: 'OF 209–210 (Bernabé)',
          text: 'The Titans, whitened with chalk, lured Zagreus, the child of Zeus and Persephone, with toys and a mirror. They tore him apart and ate him. But Zeus blasted the Titans with his lightning, and from their ash — which contained the flesh of the divine child — mankind was formed. Thus humans carry within themselves a spark of the divine Dionysus, buried in the Titanic clay.',
          textVersions: {
            west: '[Synthesis from Olympiodorus, In Phaed. 1.3 and other testimonia] The Titans tore apart Dionysus/Zagreus and consumed him. Zeus blasted the Titans. From their smoke humanity was made. We are Titanic in body, but carry the divine Bacchic spark within.',
          },
          entities: [
            { word: 'spark of the divine', node: 'zagreus', type: 'deity',
              note: 'The Orphic anthropogony places a divine spark (the flesh of Zagreus/Dionysus) inside every human being, surrounded by Titanic matter. Humans are ontologically dual: divine in essence, Titanic in body. The Orphic life is the process of liberating the divine spark through ritual purity and initiatory practice. This is the original "divine spark within humanity" theology — it feeds directly into Platonic soul-theory, Gnostic pneuma-in-matter theology, and through Gnosticism into the entire Western esoteric tradition.',
              parallels: [
                { label: 'Gnostic Pneuma in Matter', note: 'The Gnostic pneumatic spark of divine light trapped in material existence is the direct descendant of the Orphic Dionysian spark in Titanic clay.' },
                { label: 'Lurianic Nitzotzot — Divine Sparks', note: 'The Lurianic "sparks" (nitzotzot) scattered into matter by the Breaking of the Vessels (Shevirat ha-kelim) — the Kabbalistic version of the same scattered-divine-fragments theology.' },
              ]
            },
            { word: 'Zagreus', node: 'zagreus', type: 'deity',
              note: 'Zagreus is the Orphic name for the first Dionysus — born of Zeus and Persephone, destined to rule the gods, torn apart by the Titans and reconstituted by Zeus (in some versions his heart is saved by Athena and he is reborn as Dionysus). His dismemberment and reconstitution is the Orphic dying-and-rising-god myth. Compare: Osiris dismembered and reassembled by Isis; Purusha dismembered to form the cosmos (Rig Veda 10.90).',
              parallels: [
                { label: 'Osiris — Dismembered and Reassembled', note: 'Osiris killed and dismembered by Set; Isis reassembles him. The structural parallel to Zagreus\'s dismemberment and reconstitution is exact.' },
                { label: 'Dionysus — Dying and Rising God', node: 'dying-rising-god', note: 'Zagreus is the Orphic form of Dionysus. The dying-rising pattern is shared across Osiris, Zagreus/Dionysus, Adonis, Attis, and ultimately Christ.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 18. CORPUS HERMETICUM III — THE SACRED BOOK ──────────────────────────────
SCRIPTURE_TEXTS['corpus-hermeticum-3'] = {
  title: 'Corpus Hermeticum III — The Sacred Book of Hermes',
  shortTitle: 'CH III — Sacred Book',
  tradition: 'Hermeticism / Egyptian-Greek',
  date: 'c. 1st–3rd CE (Greek; Egyptian antecedents ancient)',
  intro: 'The briefest cosmogonic tractate in the Corpus — a concentrated creation sequence that maps almost point-for-point onto Genesis 1, Enuma Elish, and the Poimandres. Darkness + water + divine breath precede the Word; a holy Light orders the elements; mankind is created last, twofold in nature. Its brevity is its power: the Hermetic creation story stripped to its archetypal skeleton.',
  crossTradition: [
    { label: 'Genesis 1 — Darkness · Waters · Spirit · Light',  textId: 'genesis-1',        note: 'CH III and Genesis 1 share the identical sequence: primordial darkness + water + divine breath → light → elemental order → living things. The verbal parallels are close enough that scholars debate Alexandrian Jewish influence on Hermetic cosmogony.' },
    { label: 'Poimandres (CH I) — the expanded version',        textId: 'poimandres',       note: 'The Poimandres gives the same cosmogony in extended dramatic form: Darkness + waters + Word + Light. CH III is the compressed version, suggesting both draw on a shared Egyptian-Alexandrian template.' },
    { label: 'Enuma Elish — Primordial Darkness and Waters',    textId: 'enuma-elish-1',    note: 'Tiamat (salt-water darkness) + Apsu (fresh water) as the original pair before light or order. CH III\'s "darkness in the deep and water" echoes the Babylonian opening.' },
    { label: 'Memphite Theology — Ptah creates by Word',        textId: 'memphite-theology', note: 'God\'s Word (Logos) descending on formless waters to create order is the Hermetic version of Ptah\'s creative Logos — the Egyptian theology, probably the ancestral form, transmitted through Alexandria.' },
  ],
  translations: [
    { id: 'scott',      label: 'Scott 1924 (T1, public domain)' },
    { id: 'copenhaver', label: 'Copenhaver 1992 (T2)' },
    { id: 'greek',      label: 'Greek (original)' },
  ],
  sections: [
    {
      heading: 'I. Darkness, Water, and the Word',
      verses: [
        {
          ref: 'CH III.1',
          text: 'In the beginning there was darkness in the deep, and water, and a subtle breath intelligent with divine power, existing in chaos by the will of God. Then a holy Light was sent forth, and the elements were set in order from the moist substance.',
          textVersions: {
            scott:      'There was darkness in the deep, and water, and a subtle breath intelligent, which existed in chaos by the power of God. Then there arose out of the moist substance a holy light.',
            copenhaver: 'Darkness was in the deep, and water was in darkness; and fine breath, intelligent, was there, divine power, in chaos. Then from the moist substance holy light arose.',
            greek:      'Σκότος ἦν ἄβυσσος ὕδωρ τε καὶ πνεῦμα λεπτὸν νοερόν, δύναμιν θείαν ἔχον, ἐν χάει ὄντα.',
          },
          entities: [
            { word: 'darkness in the deep', node: 'primordial-darkness', type: 'concept',
              note: 'The Hermetic creation opens with the same three elements as Genesis 1:1-2: darkness, water, and the divine breath/spirit. This is not a borrowing but a shared Alexandrian cosmogonic template — the three primordial conditions of non-creation that all creation myths identify.',
              parallels: [
                { label: 'Genesis 1:2 — "darkness over the face of the deep"', textId: 'genesis-1', note: 'The Hebrew tehom (the deep/abyss) + darkness + ruach (spirit/breath) before the first creative act. CH III and Genesis 1 are almost certainly drawing on a shared near-Eastern cosmogonic template, probably transmitted through Alexandria.' },
                { label: 'Nasadiya Sukta — Non-being before creation', textId: 'nasadiya-sukta', note: 'The Vedic "neither existence nor non-existence" before creation, sustained by tapas (heat/breath). The Hermetic pneuma noeron (intelligent breath) in chaos is the same animating principle before the first creative act.' },
              ]
            },
            { word: 'subtle breath intelligent', node: 'nous-hermetic', type: 'concept',
              note: 'Pneuma noeron — the "intelligent breath" with divine power — is the animating Nous that precedes visible creation. Structurally identical to the Hebrew ruach elohim (Spirit of God) hovering over the waters in Genesis 1:2 and the Vedic breath sustaining the primordial unity in the Nasadiya Sukta.',
              parallels: [
                { label: 'Genesis 1:2 — Spirit/Breath of God over the waters', textId: 'genesis-1', note: 'Ruach Elohim = the divine breath/wind hovering over tehom. The Greek pneuma (breath/spirit) in CH III is the direct translation of the Hebrew ruach.' },
              ]
            },
          ]
        },
        {
          ref: 'CH III.2',
          text: 'And God\'s holy Word (Logos) came upon nature, and nature was joined to that pure work; and the four elements were set in order from the moist substance, held together with fire. And from them living creatures came forth.',
          textVersions: {
            scott:      'God\'s Word came upon the water and made it holy; and from the moist substance the four elements were set in order, glued together by fire.',
            copenhaver: 'God\'s word came upon the nature that was moist, and straightway out of the earth the fire leapt up; out of the water, air; and the earth stood firm.',
            greek:      'Κατῆλθε δὲ ὁ τοῦ θεοῦ ἅγιος λόγος ἐπὶ τὴν φύσιν καὶ φύσις ἡνώθη τῷ λόγῳ· εἶτα τέτταρα στοιχεῖα ἐκ τῆς ὑγρᾶς οὐσίας ἐκοσμήθη.',
          },
          entities: [
            { word: 'God\'s holy Word (Logos)', node: 'logos-johannine', type: 'concept',
              note: 'The Logos descending onto the primordial waters to produce ordered creation is the Hermetic version of the event described in John 1:1-3. In John: "the Logos was with God, and through the Logos all things were made." In CH III: "God\'s Logos came upon nature and nature was joined to the Logos." Early Christian Platonists (Clement, Justin Martyr) explicitly cited the Hermetic Logos as pagan evidence for the Johannine doctrine.',
              parallels: [
                { label: 'John 1:3 — "Through him all things were made"', textId: 'john-1', note: 'The Johannine and Hermetic Logos doctrines are cognate — both produced in the same Alexandrian synthesis of Greek Stoic logos-philosophy with Egyptian creation theology.' },
                { label: 'Memphite Theology — Ptah creates by spoken word', textId: 'memphite-theology', note: 'Ptah\'s creative tongue executing the commands of his heart/Nous — creation by word, not physical labor. The Egyptian theology predates the Hermetic by ~2,000 years and is likely its ancestral source.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. The Twofold Human',
      verses: [
        {
          ref: 'CH III.3–4',
          text: 'Man was made in accordance with the divine image — of all living things the most admirable by reason of his kinship with the gods. Man is of twofold nature: mortal in body, immortal in the essential person.',
          textVersions: {
            scott:      'Man was fashioned after the image of God. Of all living things on earth man alone is of twofold nature — mortal in body, immortal in the essential man.',
            copenhaver: 'Man came into being in the image of the God who contains them all. More than any other living thing on earth, man is twofold: mortal because of the body, immortal because of the essential man.',
            greek:      'Ὁ δὲ ἄνθρωπος ἐγένετο κατ\' εἰκόνα τοῦ θεοῦ· τῶν δὲ ζῴων διττός ἐστιν ὁ ἄνθρωπος, θνητὸς μὲν διὰ τὸ σῶμα, ἀθάνατος δὲ διὰ τὸν οὐσιώδη ἄνθρωπον.',
          },
          entities: [
            { word: 'twofold nature', node: 'anthropos-gnostic', type: 'concept',
              note: 'The twofold human — simultaneously mortal (body/matter) and immortal (Nous/essential being) — is the central Hermetic anthropology, given its full mythological narrative in the Poimandres where the divine Anthropos descends into matter. CH III states the same doctrine in compressed form. The same dualism appears as Plato\'s mortal body + immortal soul, Paul\'s "flesh" vs "spirit," and the Gnostic material husk + pneumatic spark.',
              parallels: [
                { label: 'Poimandres — Anthropos descends into matter', textId: 'poimandres', note: 'CH I gives the full dramatic narrative: the divine Anthropos falls in love with his own reflection in matter and descends, producing the twofold human condition. CH III states the conclusion without the myth.' },
                { label: 'Bhagavad Gita — immortal self within mortal body', textId: 'bhagavad-gita-4', note: 'The kshetrajna (knower of the field = Atman/Nous) within the kshetra (field = body/matter). Same ontological dualism as CH III\'s mortal body + immortal essential person.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 19. CORPUS HERMETICUM IV — THE MIXING BOWL ───────────────────────────────
SCRIPTURE_TEXTS['corpus-hermeticum-4'] = {
  title: 'Corpus Hermeticum IV — The Mixing Bowl (Krater)',
  shortTitle: 'CH IV — The Krater',
  tradition: 'Hermeticism / Egyptian-Greek',
  date: 'c. 1st–3rd CE',
  intro: 'God creates the world through Logos, but since Logos could not be distributed equally, God fills a great mixing bowl (krater) with Nous (Mind) and sends it down with a herald. The krater is the prize of gnosis — those who plunge into it receive divine Mind and become fully human; those who refuse remain irrational despite their human form. A direct precursor of Christian baptismal theology.',
  crossTradition: [
    { label: 'John 1 — Logos as vehicle of creation',             textId: 'john-1',           note: 'CH IV opens: God made the world through Logos — same doctrine as John 1:1-3. The Krater then becomes the mechanism by which individual minds receive what the cosmic Logos made available.' },
    { label: 'Gospel of Thomas — Kingdom available to the seeker', textId: 'gospel-of-thomas', note: 'Thomas L.2: "Let one who seeks not stop seeking." The Hermetic krater sent into the world for all who choose — same structure as the hidden-but-findable Kingdom in Thomas.' },
    { label: 'Sefer Yetzirah — Nous distributing through 32 paths', textId: 'sefer-yetzirah',  note: 'The Kabbalistic 10 sefirot and CH IV\'s krater of Nous are cognate images: divine Mind distributing into creation through structured channels, received by those who actively seek it.' },
    { label: 'Bhagavad Gita — divine teaching as a prize sought',   textId: 'bhagavad-gita-4',  note: 'Gita 4.34: "Seek the wise men, serve them, question them." Hermetic Nous is "placed as a prize in competition" — only those who seek it receive it, same selective availability.' },
  ],
  translations: [
    { id: 'scott',      label: 'Scott 1924 (T1, public domain)' },
    { id: 'copenhaver', label: 'Copenhaver 1992 (T2)' },
    { id: 'greek',      label: 'Greek (original)' },
  ],
  sections: [
    {
      heading: 'I. God Creates through Logos',
      verses: [
        {
          ref: 'CH IV.1',
          text: 'Since the craftsman made the whole world not with hands but with the Logos, think of him as present everywhere and always, the maker of all things, the one and only, who formed all things by his will alone.',
          textVersions: {
            scott:      'God made the universe not with his hands but by his word. So think of God as being everywhere and always; as the maker of all things; as the one, the only one.',
            copenhaver: 'Since the craftsman made the whole world not with hands but through the word, you should think of him as always present, as the one who made everything, as the only.',
            greek:      'Ὁ δημιουργὸς τὸν κόσμον ἐποίησεν οὐ χερσίν, ἀλλὰ λόγῳ.',
          },
          entities: [
            { word: 'not with hands but with the Logos', node: 'logos-johannine', type: 'concept',
              note: 'Creation through Logos without physical hands parallels John 1:3 ("through him all things were made") and Memphite Theology (Ptah creates by the spoken word of his heart-Nous). Early Christian Platonists cited CH IV as independent pagan testimony to John 1.',
              parallels: [
                { label: 'John 1:3 — "Through him all things were made"', textId: 'john-1', note: 'The Johannine and Hermetic Logos doctrines emerge from the same Alexandrian synthesis of Stoic logos-philosophy, Platonic Demiurge theology, and Egyptian Ptah-Logos religion.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. The Bowl of Nous Sent to Earth',
      verses: [
        {
          ref: 'CH IV.3–4',
          text: 'God filled a great mixing bowl with Nous and sent it down to earth, appointing a herald to make this proclamation to human hearts: "Dip yourself in this bowl, you who are able — you who trust you will ascend to the one who sent it, you who know the reason for your creation."',
          textVersions: {
            scott:      'God filled a great bowl with Nous, and sent it down, appointing a crier to proclaim: "Plunge into this bowl, O ye that are able — ye who believe ye shall ascend to him that sent the bowl."',
            copenhaver: 'God filled a great bowl with it and sent it down, appointing a herald to make this proclamation to human hearts: "Baptize yourself in this bowl if your heart has the strength, you who trust that you will go up to the one who sent the bowl."',
            greek:      'Ἐπλήρωσεν κρατῆρα μέγαν τούτου κατέπεμψε, κήρυκα ἐπιστείλας κηρῦξαι τὰς τῶν ἀνθρώπων καρδίας· βάψον σεαυτὴν ἡ δυναμένη εἰς τοῦτον τὸν κρατῆρα.',
          },
          entities: [
            { word: 'great mixing bowl', node: 'nous-hermetic', type: 'symbol',
              note: 'The krater (κρατήρ) — the large Greek vessel used at symposia — becomes the vessel of divine Mind sent to earth. Copenhaver\'s translation of βάψον as "baptize" deliberately flags the connection to Christian baptism: the Hermetic krater is the structural precursor of the baptismal font as vessel of divine reception.',
              parallels: [
                { label: 'Christian Baptism — immersion in the divine', note: 'The herald\'s call to "baptize yourself in this bowl" (CH IV.4) prefigures Christian baptismal theology: immersion in a sacred vessel as the rite of divine reception. The Hermetic tradition predates Christian baptism.' },
                { label: 'Vedic Soma — the sacred cup conferring wisdom', note: 'The soma vessel at the Vedic sacrifice — pressed plant juice conferring illumination on those who receive it — is structurally parallel to the krater of Nous.' },
              ]
            },
            { word: 'Dip yourself', node: 'apophatic-mysticism', type: 'concept',
              note: 'The invitation is open but self-selective: "you who are able," "you who trust," "you who know." Nous cannot be coerced. This voluntary gnosis-reception parallels Thomas L.2 ("let one who seeks not stop seeking"), the Bhagavad Gita\'s "seek the wise men" (4.34), and the Mystery Religion initiations.',
              parallels: [
                { label: 'Gospel of Thomas — seek and you will find', textId: 'gospel-of-thomas', note: 'Thomas L.2: the Hermetic "you who are able" and the Thomasine "one who seeks" are the same selective availability — the divine is there for those who pursue it.' },
              ]
            },
          ]
        },
        {
          ref: 'CH IV.5–6',
          text: 'Those who heeded the herald\'s call and dipped themselves in Nous became partakers in knowledge and received perfection. But those who missed the proclamation remained irrational — having Logos but lacking Nous — not knowing the purpose of their creation or their creator.',
          textVersions: {
            scott:      'Those who received the gift of Nous recognised their kin and became perfect men. But those who did not heed the herald remained irrational animals in human form.',
            copenhaver: 'Those who got a share of his gift, compared to the others, are as immortals to mortals. Those who did not heed the herald\'s call — these are the ones with logos but without Nous.',
            greek:      'Ὅσοι μὲν οὖν συνῆκαν τοῦ κηρύγματος καὶ ἐβαπτίσαντο τοῦ νοός, οὗτοι μετέσχον τῆς γνώσεως καὶ τέλειοι ἄνθρωποι ἐγένοντο.',
          },
          entities: [
            { word: 'perfect human', node: 'anthropos-gnostic', type: 'concept',
              note: 'The teleios anthropos (perfect/complete human) who has received Nous is the fully realized Hermetic figure — one who knows their divine origin. Structurally identical to the Gnostic pneumatikos (the spiritual person who knows their divine pneuma), the Buddhist arhat (the perfected one), and the Sufi insan al-kamil (Ibn Arabi\'s perfect human).',
              parallels: [
                { label: 'Poimandres — the Anthropos ascending back through the spheres', textId: 'poimandres', note: 'CH I gives the full ascent: the perfect human strips off material qualities at each planetary sphere and merges with divine Nous. The teleios anthropos of CH IV is the same figure, mid-ascent.' },
                { label: 'Gospel of Thomas — knowing yourself as child of the Father', textId: 'gospel-of-thomas', note: 'Thomas L.3: "When you know yourselves... then you will understand that you are children of the living Father." Same completion as the Hermetic teleios anthropos.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 20. CORPUS HERMETICUM VII — THE GREATEST EVIL ────────────────────────────
SCRIPTURE_TEXTS['corpus-hermeticum-7'] = {
  title: 'Corpus Hermeticum VII — The Greatest Evil Among Men',
  shortTitle: 'CH VII — Ignorance',
  tradition: 'Hermeticism / Egyptian-Greek',
  date: 'c. 1st–3rd CE',
  intro: 'A diatribe-sermon — the shortest and most urgently polemical tractate in the Corpus. Hermes addresses humanity directly: you are drunk with ignorance, stumbling toward death when immortality is available. The body is the garment of ignorance. A guide waits at the gates of Knowledge where true light shines. The greatest evil in man is ignorance of God. The urgency, the direct address to "you, O men," and the gate-imagery make this the Hermetic equivalent of a prophetic summons — and one of the closest verbal parallels to the Gospel of Thomas in all ancient literature.',
  crossTradition: [
    { label: 'Gospel of Thomas L.28 — "found them all drunk"',    textId: 'gospel-of-thomas', note: 'Thomas L.28: "I stood in the midst of the world and found them all drunk; none among them was thirsty." CH VII\'s "drunk with the wine of ignorance" and Thomas\'s "found them all drunk" are verbally parallel — almost certainly sharing a common Alexandrian source.' },
    { label: 'Job 38 — the Whirlwind rebukes human ignorance',    textId: 'job-38',           note: 'Job 38:4: "Where were you when I laid the earth\'s foundation?" YHWH\'s cosmic questions rebuke Job\'s ignorance. CH VII\'s direct address to "you, O men" who stumble in ignorance carries the same prophetic register.' },
    { label: 'Tao Te Ching — the threshold beyond ordinary mind',  textId: 'tao-te-ching-1',   note: 'CH VII\'s gates of Knowledge point toward a reality that normal consciousness cannot access — the same transcendent threshold as the Tao.' },
    { label: 'Nasadiya Sukta — universal epistemic humility',      textId: 'nasadiya-sukta',   note: 'The Vedic sukta\'s closing "who really knows?" and CH VII\'s diagnosis of universal ignorance are the same insight from opposite directions: one epistemic humility, the other prophetic urgency.' },
  ],
  translations: [
    { id: 'scott',      label: 'Scott 1924 (T1, public domain)' },
    { id: 'copenhaver', label: 'Copenhaver 1992 (T2)' },
    { id: 'greek',      label: 'Greek (original)' },
  ],
  sections: [
    {
      heading: 'I. Drunk with the Wine of Ignorance',
      verses: [
        {
          ref: 'CH VII.1',
          text: 'Whither stumble you, O men, drunk with the strong wine of ignorance? Cannot you bear it? Will you not sober up? Why do you fall face-down following death, when you are able to obtain immortality by choosing life?',
          textVersions: {
            scott:      'Whither are you stumbling, O ye men, drunk with the strong wine of ignorance? Cannot ye bear it? Will ye not return? Why do ye follow death, when ye are able to obtain the life immortal?',
            copenhaver: 'Where are you heading in your drunkenness, you people who have swallowed the doctrine of ignorance? Stop and sober up. Look up with the eyes of the heart — if all of you cannot do so, at least those of you who can.',
            greek:      'Ποῖ φέρεσθε, ὦ ἄνθρωποι, μεθύοντες τὸν τῆς ἀγνωσίας λόγον πιόντες;',
          },
          entities: [
            { word: 'drunk with the strong wine of ignorance', node: 'tradition-gnosticism', type: 'concept',
              note: 'Ignorance (agnosia) as drunkenness appears nearly verbatim in the Gospel of Thomas L.28: "I found them all drunk; none among them was thirsty." The parallel is so precise it suggests CH VII and the Gospel of Thomas share a common sayings-source, probably circulating in Alexandria in the 1st–2nd CE.',
              parallels: [
                { label: 'Gospel of Thomas L.28 — "found them all drunk"', textId: 'gospel-of-thomas', note: 'Thomas L.28: "I stood in the midst of the world and found all of them drunk. None of them was thirsty; my soul ached for the children of humanity." The verbal parallel with CH VII.1 is near-exact — both in Greek, both produced in Alexandria.' },
              ]
            },
          ]
        },
        {
          ref: 'CH VII.2',
          text: 'Seek a guide to lead you by the hand to the gates of Knowledge, where shines the light that is clear, where none is drunk, where all are sober and look with the heart toward the one who wills to be seen.',
          textVersions: {
            scott:      'Turn back, ye erring ones; come back to the light. Seek for a guide who shall lead you by the hand to the portals of truth, where shines the light which is not darkened by shadow, where none is drunk.',
            copenhaver: 'Search for a guide to take you by the hand and lead you to the gates of knowledge, where the bright light is, untouched by darkness, where no one is drunk.',
            greek:      'Ζητήσατε ὁδηγὸν τὸν χειραγωγήσοντα ἐπὶ τὰς τῆς γνώσεως θύρας ὅπου λαμπρόν ἐστι τὸ φῶς.',
          },
          entities: [
            { word: 'gates of Knowledge', node: 'apophatic-mysticism', type: 'concept',
              note: 'The "gates of Knowledge" (thuran gnosis) where clear light shines is one of the most resonant images in the Hermetic corpus — a threshold to a different order of reality, not a doctrine but an experience. It parallels the Tao as a threshold that cannot be approached by normal intellectual effort, the Zen koan that breaks normal mind to allow enlightenment, and the Sufi maqam as a qualitative shift in consciousness.',
              parallels: [
                { label: 'Tao Te Ching — "the gate of all subtleties"', textId: 'tao-te-ching-1', note: 'Tao 1: "The gate of all subtleties." The Hermetic gates of Knowledge and the Taoist gate of all subtleties are the same image — a threshold beyond which ordinary discourse fails.' },
              ]
            },
          ]
        },
        {
          ref: 'CH VII.3',
          text: 'The greatest evil in man is ignorance of God. From this spring all other evils: the love of the body, concupiscence, deceit, envy, treachery, wrath, rashness, and malice — this is the robe of darkness, the garment of ignorance, the bond of corruption.',
          textVersions: {
            scott:      'For the greatest evil among men is ignorance of God. From it proceed all other evils — the desire to obtain the unattainable, all hatreds, all snares.',
            copenhaver: 'The greatest evil in man is ignorance of God. There follows from this love of the body, then concupiscence, then deceit, then envy, then treachery and finally malice — the whole plague of ignorance.',
            greek:      'Κακία γάρ ἐστιν ἡ μεγίστη ἐν ἀνθρώποις ἡ ἀγνωσία τοῦ θεοῦ.',
          },
          entities: [
            { word: 'greatest evil in man is ignorance of God', node: 'tradition-hermeticism', type: 'concept',
              note: 'Ignorance of God as the root of all evil is the Hermetic inversion of the Socratic claim that virtue is knowledge. But where Socrates meant ethical knowledge, Hermes means gnosis — direct experiential knowledge of the divine Nous. This root-cause diagnosis runs across traditions: Avidya (ignorance) in Buddhism as the first link of dependent origination; the Gnostic Demiurge\'s self-ignorance as the source of the material world\'s evil; the Kabbalistic klipot as shells of opacity around the divine light.',
              parallels: [
                { label: 'Buddhist Avidya — ignorance as the first link in dependent origination', note: 'The 12 Buddhist nidanas begin with avidya (ignorance). From ignorance all suffering arises. The structural parallel to CH VII\'s "from ignorance spring all other evils" is exact.' },
              ]
            },
            { word: 'garment of ignorance', node: 'primordial-darkness', type: 'symbol',
              note: 'The body as the "robe of darkness" / "garment of ignorance" is the Hermetic version of the Platonic body-as-tomb (soma-sema), the Gnostic material husk imprisoning the divine spark, and the Orphic body as Titanic clay surrounding the divine Dionysian fragment. The Gospel of Thomas L.37 parallels: "strip off your garments without shame" to see the living one.',
              parallels: [
                { label: 'Gospel of Thomas L.37 — stripping garments', textId: 'gospel-of-thomas', note: 'Thomas L.37: "When will you appear to us? When you strip off your garments without shame and trample them underfoot." The Hermetic garment of ignorance and the Thomasine garment to be stripped are the same image of embodiment as obstacle to divine vision.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 21. CORPUS HERMETICUM XI — THE MIND TO HERMES ────────────────────────────
SCRIPTURE_TEXTS['corpus-hermeticum-11'] = {
  title: 'Corpus Hermeticum XI — The Mind Addresses Hermes',
  shortTitle: 'CH XI — The Mind',
  tradition: 'Hermeticism / Egyptian-Greek',
  date: 'c. 1st–3rd CE',
  intro: 'The most philosophically ambitious tractate in the Corpus. Nous (divine Mind) speaks directly to Hermes and commands him to expand his consciousness to the scale of the cosmos — transcending body, time, and space — in order to understand God. The command to "think yourself immortal and capable of understanding all things" is not a description of mystical experience but an active prescription for achieving it. The pantheistic vision — God as the totality of all things, unnameable because all names are His names — parallels Chandogya 6.2 (tat tvam asi), the Tao Te Ching\'s unnamed ground of being, and Ein Sof in Kabbalah.',
  crossTradition: [
    { label: 'Chandogya 6.2 — Tat tvam asi / "That thou art"',    textId: 'chandogya-621',    note: 'The Chandogya teaching that Brahman = individual Atman. CH XI\'s "make yourself equal to God" and "you are everywhere at once" is the Hermetic version of the non-dual identity of individual Nous with universal Nous.' },
    { label: 'Tao Te Ching — the Tao as all-containing ground',   textId: 'tao-te-ching-1',   note: 'Tao 1: "Named, it is the mother of all things." CH XI\'s Nous containing all space, time, and substance is the Hermetic parallel to the Tao as the unnamed containing ground.' },
    { label: 'Job 38 — God as the totality of the cosmos',         textId: 'job-38',           note: 'YHWH\'s cosmic inventory in Job 38 is a divine assertion of containing all things. CH XI\'s Nous as container of all space, time, life, and death is the mystic\'s attempt to achieve that same totality of vision.' },
    { label: 'Poimandres — seeing with the eyes of Nous',          textId: 'poimandres',       note: 'CH I opens with Hermes\' vision granted by Nous — the cosmos opened to mental sight. CH XI is the reverse: Nous telling Hermes how to perform this expansion himself. CH I is the vision; CH XI is the method.' },
  ],
  translations: [
    { id: 'scott',      label: 'Scott 1924 (T1, public domain)' },
    { id: 'copenhaver', label: 'Copenhaver 1992 (T2)' },
    { id: 'greek',      label: 'Greek (original)' },
  ],
  sections: [
    {
      heading: 'I. The Command to Expand',
      verses: [
        {
          ref: 'CH XI.19',
          text: 'Order your mind to go to any land you choose, and sooner than you can bid it, it will be there. Order it to plunge into the ocean, and again it will be there at once — not as if it has passed from place to place but simply as if it were already there.',
          textVersions: {
            scott:      'Command your soul to travel to any part of the world, and it will be there sooner than you can give the command. Bid it go to the ocean, and it will be there at once — not as if it had passed from place to place, but simply as if it were there.',
            copenhaver: 'Order your mind to go to India, and it will be there before you bid it go. Command it to cross over to the ocean, and again it will quickly be there, not as if it has passed from place to place but simply as if it were already there.',
            greek:      'Κέλευσον τὴν σεαυτοῦ ψυχὴν εἰς ὁποιονοῦν τόπον ἐλθεῖν, καὶ πρὸ τῆς ἐντολῆς ἐκεῖ ἔσται.',
          },
          entities: [
            { word: 'mind to go to any land', node: 'nous-hermetic', type: 'concept',
              note: 'The mind\'s instantaneous travel across space is the Hermetic description of Nous operating outside material constraints. It parallels the Vedantic Atman as "subtler than the subtle, greater than the great" (Katha Upanishad 1.2.20) — a consciousness that is everywhere at once because it is not localized in a body.',
              parallels: [
                { label: 'Chandogya 6.2 — Atman as salt pervading the ocean', textId: 'chandogya-621', note: 'Atman/Brahman pervades all things the way dissolved salt pervades water — everywhere at once, present without being localized. CH XI\'s mind that can be "anywhere at once" is the same non-local consciousness.' },
              ]
            },
          ]
        },
        {
          ref: 'CH XI.20',
          text: 'Leap clear of all that is corporeal, and make yourself grow to a like expanse with that greatness which is beyond all measure. Rise above all time and become eternity; then you will understand God. Suppose that nothing is impossible to you — consider yourself immortal.',
          textVersions: {
            scott:      'Make yourself to grow to immeasurable greatness, leap clear of all that is corporeal, rise above all time, become eternity; then you will understand God. Suppose that nothing is impossible to yourself.',
            copenhaver: 'Leap clear of all that is corporeal and make yourself grow to the same expanse as that greatness beyond all measure. Rise above all time, become eternity; then you will understand God.',
            greek:      'Ἔκθου πᾶν τὸ σωματικόν, καὶ αὔξησόν σεαυτὸν εἰς ἀμέτρητον μέγεθος, ὑπεράνω τοῦ χρόνου γενόμενος αἰών, τότε νοήσεις τὸν θεόν.',
          },
          entities: [
            { word: 'Leap clear of all that is corporeal', node: 'apophatic-mysticism', type: 'concept',
              note: 'This is the most radical prescription in the Hermetic corpus — not to meditate on God but to actively become God\'s scale. The instruction to leap clear of the body, transcend time, become eternity, and think yourself immortal is a guided practice for achieving the non-dual consciousness of the Chandogya\'s tat tvam asi — the recognition that individual Nous IS universal Nous. Also Platonic homoiosis theo (becoming like God) taken to its logical extreme.',
              parallels: [
                { label: 'Chandogya 6.2 — the self IS Brahman', textId: 'chandogya-621', note: '"That which is this subtle essence — in it all that exists has its self. That is the Real. That is Atman. Thou art That." CH XI\'s instruction to "make yourself God\'s scale" is the Hermetic practice for achieving what the Chandogya states as doctrine.' },
              ]
            },
            { word: 'become eternity', node: 'tradition-neoplatonism', type: 'concept',
              note: 'Becoming eternity (aiōn) rather than being in time is the Hermetic version of Neoplatonic henosis (union with the One). Plotinus describes the same experience in Enneads IV.8: "Often I have woken to myself out of the body, entering into myself, beholding a marvellous beauty... I become actually one with the divine." Plotinus almost certainly knew the Hermetic corpus.',
              parallels: [
                { label: 'Plotinus Enneads — the ascent to the One', note: 'Plotinus\' experience of waking out of the body into divine unity (Enneads IV.8.1) is the Neoplatonic parallel to CH XI\'s instruction to "become eternity."' },
              ]
            },
          ]
        },
        {
          ref: 'CH XI.22',
          text: 'God cannot be named — or rather, all names are names of God, since God is both all things and one alone. God is self-father, self-mother, self-made; all is in God, and God is in all.',
          textVersions: {
            scott:      'God cannot be named with a name; or he has all names, since he is the Father of all and of one alone. God is not made, but makes all things. God is all that is, and God is in all.',
            copenhaver: 'So how can one call God by a name, since God is all names, since there is one Father to all? All things are full of God. God is himself all things and in all things.',
            greek:      'Θεὸν οὐδεὶς τῶν θεῶν δύναται ὀνομάσαι· ὅτι πάντα ὀνόματα ὀνόματα ἐστι τοῦ θεοῦ, ἐπεὶ ὁ εἷς καὶ ὁ πᾶς πατήρ ἐστιν.',
          },
          entities: [
            { word: 'God cannot be named', node: 'apophatic-mysticism', type: 'concept',
              note: 'The divine transcends all categories including the category "God." This appears as Ein Sof ("without end/definition") in Kabbalah, the Tao that cannot be spoken in Tao Te Ching 1, "neti neti" (not this, not this) in the Upanishads, and the apophatic theology of Pseudo-Dionysius in Christian mysticism. All are the same apophatic move: the infinite cannot be contained in any finite category.',
              parallels: [
                { label: 'Tao Te Ching — "The Tao that can be told is not the eternal Tao"', textId: 'tao-te-ching-1', note: 'The Tao\'s unnameable nature and CH XI\'s "God cannot be named" are the same apophatic move — the infinite cannot be contained in any finite category, including names.' },
                { label: 'Sefer Yetzirah — Ein Sof beyond all names', textId: 'sefer-yetzirah', note: 'The Kabbalistic Ein Sof (the infinite, without limit, beyond all names) and the Hermetic "God cannot be named" are cognate formulations of the same divine transcendence.' },
                { label: 'Nasadiya Sukta — "Who really knows?"', textId: 'nasadiya-sukta', note: 'The Vedic epistemological question about who knows the origin of creation — the origin/ground transcends all knowers. Same apophatic move.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 22. CORPUS HERMETICUM XIII — REBIRTH ─────────────────────────────────────
SCRIPTURE_TEXTS['corpus-hermeticum-13'] = {
  title: 'Corpus Hermeticum XIII — The Secret Discourse on the Mountain (Rebirth)',
  shortTitle: 'CH XIII — Rebirth',
  tradition: 'Hermeticism / Egyptian-Greek',
  date: 'c. 1st–3rd CE',
  intro: 'The most intimate tractate in the Corpus — a private teaching from Hermes to his son Tat on the secret mountain of silence. The subject is palingenesia: spiritual rebirth. The structure is unique: twelve torments of matter are expelled by ten divine powers, and the reborn Hermes sings a closing hymn. The text makes the Hermetic rebirth doctrine explicit and maps it directly onto John 3 (born again), the Bhagavad Gita\'s fire of knowledge, and the Zoroastrian primordial choice between Truth and the Lie.',
  crossTradition: [
    { label: 'John 3 — "You must be born again/from above"',       textId: 'john-1',           note: 'John 3:3-7: Jesus tells Nicodemus "you must be born again" (anothen). CH XIII is the Hermetic treatise on the identical doctrine — palingenesia achieved not through water baptism but through Nous received from God. Johannine and Hermetic rebirths are cognate doctrines.' },
    { label: 'Bhagavad Gita — fire of knowledge burns karma',      textId: 'bhagavad-gita-4',  note: 'Gita 4.37: "As blazing fire turns firewood to ash, the fire of knowledge burns all karma to ash." The Hermetic Decad of powers displacing the twelve torments is the same liberation through divine knowledge.' },
    { label: 'Gospel of Thomas — the two becoming one',            textId: 'gospel-of-thomas', note: 'Thomas L.22: "When you make the two into one... then you will enter the Kingdom." CH XIII\'s rebirth through the union of ten divine powers overcoming twelve torments is the same transformation.' },
    { label: 'Yasna 30 — choosing Truth over the Lie',             textId: 'yasna-30',         note: 'Yasna 30.3: the two primordial spirits choose Truth vs the Lie. CH XIII\'s drama of choosing the ten divine powers over the twelve torments is the personal enactment of the Zoroastrian primordial choice — cosmic dualism becomes individual decision.' },
  ],
  translations: [
    { id: 'scott',      label: 'Scott 1924 (T1, public domain)' },
    { id: 'copenhaver', label: 'Copenhaver 1992 (T2)' },
    { id: 'greek',      label: 'Greek (original)' },
  ],
  sections: [
    {
      heading: 'I. The Request for Rebirth',
      verses: [
        {
          ref: 'CH XIII.1–2',
          text: 'Tat: "Father, in the General Discourses you spoke of rebirth but did not explain it. On this mountaintop of silence I beseech you — how does one come to be born again through God?"\n\nHermes: "My child, this wisdom is not to be taught. It is called to mind by God\'s mercy when he wills it. Know that all things in the material world are an illusion worked through the senses."',
          textVersions: {
            scott:      'Tat: "Father, in the general discourse you spoke of palingenesia but did not explain it. I pray you to unfold that doctrine; I earnestly desire to know it."\nHermes: "The doctrine of rebirth is not taught, my son, nor can it be taught — it is God\'s mercy when he wills to remember it in you."',
            copenhaver: 'Tat: "Father, you talked about rebirth in the General Discourses but did not teach me."\nHermes: "My child, this wisdom is not taught; when god wills it, it is called to mind."',
            greek:      'Ἑρμῆς: Ὦ τέκνον, οὗτος ὁ λόγος οὐ διδάσκεται, ἀλλὰ ὅταν θελήσῃ ὁ θεός, ὑπομιμνήσκεται.',
          },
          entities: [
            { word: 'not to be taught', node: 'apophatic-mysticism', type: 'concept',
              note: 'The claim that rebirth/gnosis "cannot be taught but is called to mind by God\'s mercy" is the Hermetic version of a universal mystical epistemology: direct knowledge of God cannot be transmitted through conceptual instruction alone — it requires a qualitative shift in consciousness that can only be pointed toward. The Zen tradition encodes this in the master-student transmission "outside the scriptures." The Gita: "the wise men from whom you seek the truth" (4.34) — instruction points, it does not convey the truth itself.',
              parallels: [
                { label: 'Bhagavad Gita 4.34 — seek the wise men who have seen the truth', textId: 'bhagavad-gita-4', note: 'The Gita acknowledges that the fire of knowledge requires a transmission-relationship, not just text-study. Same as Hermetic "not taught but called to mind when God wills."' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. Twelve Torments and Ten Powers',
      verses: [
        {
          ref: 'CH XIII.7–8',
          text: 'Hermes: "The twelve torments of matter are: first ignorance, then grief, incontinence, desire, injustice, avarice, deceit, envy, treachery, wrath, rashness, and malice. These twelve enter a person through the body and hold the soul prisoner so it cannot sail back to God."',
          textVersions: {
            scott:      'The torments of the zone of matter are twelve: ignorance, grief, intemperance, concupiscence, injustice, avarice, deceit, envy, treachery, anger, rashness, malice.',
            copenhaver: 'The torments of darkness are: ignorance, grief, incontinence, concupiscence, injustice, avarice, deceit, envy, treachery, anger, rashness, malice — twelve tormentors that enter into each person through the material body.',
            greek:      'Τοῦ σκότους αἱ τιμωρίαι εἰσὶν αὗται· ἄγνοια, λύπη, ἀκρασία, ἐπιθυμία, ἀδικία, πλεονεξία, ἀπάτη, φθόνος, δόλος, ὀργή, προπέτεια, κακία.',
          },
          entities: [
            { word: 'twelve torments of matter', node: 'tradition-hermeticism', type: 'concept',
              note: 'The twelve torments (timōriai) head with ignorance — the root of all the others. The Buddhist 12 nidanas (links of dependent origination) also begin with avidya (ignorance) and cascade through craving, grasping, and birth into suffering. Both systems: (1) number 12, (2) begin with ignorance, (3) cascade through desire/craving, (4) produce material captivity. Independent parallel from two distant traditions.',
              parallels: [
                { label: 'Buddhist 12 Nidanas — avidya at the head', note: 'The 12 nidanas: ignorance → formations → consciousness → name-form → sense-bases → contact → feeling → craving → grasping → becoming → birth → aging/death. The Hermetic 12 torments and Buddhist 12 nidanas independently derived identical structures.' },
                { label: 'Yasna 30 — the Lie producing its cascade', textId: 'yasna-30', note: 'The Zoroastrian Druj (Lie/chaos) produces the same cascade of evils that Hermetic agnosia does — ignorance of divine truth leads to grief, injustice, treachery. Different taxonomy, same root-cause structure.' },
              ]
            },
          ]
        },
        {
          ref: 'CH XIII.9',
          text: 'Hermes: "The ten powers of God now enter: first Knowledge of God, then Joy, Continence, Steadfastness, Justice, Generosity, Truth, Good, Life, and Light. The Decad has driven out the Twelve. You have been reborn. Sing now, my child."',
          textVersions: {
            scott:      'Knowledge of God is one; Gladness two; Temperance three; Steadfastness four; Justice five; Sharing six; Truth seven; The Good eight; Life nine; Light ten. The Decad has driven the Twelve from us. We have been made what we are by this rebirth.',
            copenhaver: 'These ten powers: knowledge of god, joy, continence, steadfastness, justice, sharing, truth, goodness, life, light — these ten have driven out the twelve. Through this Nous-rebirth, I have been made divine.',
            greek:      'Γνῶσις θεοῦ μία· χαρὰ δευτέρα· ἐγκράτεια τρίτη· καρτερία τετάρτη· δικαιοσύνη πέμπτη· κοινωνία ἕκτη· ἀλήθεια ἑβδόμη· τἀγαθὸν ὄγδοον· ζωὴ ἐνάτη· φῶς δέκατον.',
          },
          entities: [
            { word: 'Knowledge of God is the first', node: 'nous-hermetic', type: 'concept',
              note: 'The Decad of divine powers begins with Gnosis Theou — knowledge of God — as the foundational power displacing ignorance. The Ten divine powers parallel the Ten Sefirot of the Kabbalistic Sefer Yetzirah: both are systematic accounts of the ten primary modes of divine action through which creation (and re-creation of the soul) occurs.',
              parallels: [
                { label: 'Sefer Yetzirah — Ten Sefirot as paths of divine wisdom', textId: 'sefer-yetzirah', note: 'The Kabbalistic 10 Sefirot and the Hermetic 10 divine powers (both explicitly "ten") are cognate structures: ten primary modes of divine presence through which God creates the world and recreates the soul.' },
                { label: 'Bhagavad Gita — the fire of knowledge burns all karma', textId: 'bhagavad-gita-4', note: 'Gita 4.37: the fire of knowledge burning karma to ash is the same liberation mechanism as the Hermetic Decad displacing the twelve torments.' },
              ]
            },
            { word: 'You have been reborn', node: 'dying-rising-god', type: 'concept',
              note: 'The palingenesia achieved through the Decad is the Hermetic initiation — death of the old material-bound self, birth of the Nous-infused divine human. Structurally the same event as Christian baptismal rebirth (John 3:5), the Eleusinian Mysteries\' death-and-renewal initiations, and Buddhist parinirvana.',
              parallels: [
                { label: 'John 3:5 — born of water and spirit', textId: 'john-1', note: 'Jesus: "No one can enter the kingdom of God unless they are born of water and spirit." CH XIII\'s palingenesia through Nous and the Johannine rebirth through the Logos are structurally identical doctrines from the same Alexandrian milieu.' },
                { label: 'Orphic Theogony — divine spark liberated from Titanic clay', textId: 'orphic-theogony', note: 'The Orphic soul\'s liberation from Titanic material nature through initiation — the divine Dionysian spark returning to divine origin — is structurally identical to Hermetic palingenesia.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'III. The Hymn of Rebirth',
      verses: [
        {
          ref: 'CH XIII.16–17',
          text: 'Hermes sings: "Holy is God the Father of all. Holy is God whose will is accomplished by his own powers. Holy is God who wills to be known and is known by his own. Holy are you, who by your Word have made all things to be. Holy are you, of whom all nature is the image."',
          textVersions: {
            scott:      'Holy art thou, O God and Father of all things; holy art thou, whose will is wrought by thy powers alone; holy art thou, who dost will to be known, and art known by thine own; holy art thou, who didst make all things by the word; holy art thou, of whom all nature is an image.',
            copenhaver: 'Holy is god the father of all. Holy is god whose counsel is done by his own powers. Holy is god who wills to be known and is known by those who are his own. Holy art thou who made all things by the word. Holy art thou, of whom all nature is an image.',
            greek:      'Ἅγιος ὁ θεὸς καὶ πατὴρ τῶν ὅλων· ἅγιος ὁ θεὸς οὗ ἡ βουλὴ τελεῖται ὑπὸ τῶν ἰδίων δυνάμεων· ἅγιος ὁ θεὸς ὁ γνωσθῆναι βουλόμενος καὶ γινωσκόμενος τοῖς ἰδίοις.',
          },
          entities: [
            { word: 'Holy is God the Father of all', node: 'tradition-hermeticism', type: 'concept',
              note: 'The closing hymn\'s triple "Holy" structure (trishagion) parallels the Qedushah in Jewish liturgy (Isaiah 6:3: "Holy, holy, holy is YHWH"), the Trisagion in Christian liturgy, and the Gayatri mantra\'s triple invocation. The Hermetic hymn was composed in Alexandria in conscious dialogue with Jewish Alexandrian liturgy — both the structure and the address to the "Father of all" are shared.',
              parallels: [
                { label: 'Quran Al-Fatiha — "Praise be to God, Lord of all worlds"', textId: 'quran-fatiha-nur', note: 'Al-Fatiha\'s opening praise and CH XIII\'s "Holy is God the Father of all" are the same formal act of divine praise acknowledging God as the totality of all reality.' },
              ]
            },
            { word: 'by your Word have made all things', node: 'logos-johannine', type: 'concept',
              note: 'The hymn\'s closing address ties the palingenesia of CH XIII back to the Logos-cosmogony of CH III and CH IV: rebirth through Nous is the individual soul\'s participation in the same creative Logos that made the cosmos. The Johannine parallel is exact — John 1:12-13: those who receive the Logos are "born of God."',
              parallels: [
                { label: 'John 1:12-13 — "born of God" through receiving the Logos', textId: 'john-1', note: 'John 1:12: "To all who received him... he gave the right to become children of God — born not of natural descent... but born of God." The Hermetic palingenesia through Nous and the Johannine rebirth through the Logos are structurally identical doctrines.' },
                { label: 'CH III — God creates by the Word/Logos', textId: 'corpus-hermeticum-3', note: 'CH XIII\'s hymn ("you who by your Word have made all things") closes the arc: rebirth (XIII) through Nous is the soul\'s personal participation in the same creative Logos (III/IV) by which God made the cosmos. Cosmogony and palingenesia are the same act at different scales.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};
