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
