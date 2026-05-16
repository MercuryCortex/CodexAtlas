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

// ── 23. HYMN TO THE ATEN ─────────────────────────────────────────────────────
SCRIPTURE_TEXTS['hymn-to-aten'] = {
  title: 'The Great Hymn to the Aten',
  shortTitle: 'Hymn to the Aten',
  tradition: 'Ancient Egyptian / Amarna Period',
  date: 'c. 1345 BCE (reign of Akhenaten / Amenhotep IV)',
  intro: 'Inscribed in the tomb of Ay at Amarna and attributed to Akhenaten himself — the world\'s first surviving monotheistic hymn. The Aten (sun disk) is the sole god, creator of all peoples and all lands. The structural and verbal parallels with Psalm 104 are so close that Breasted (1912) called the Psalm "an echo of the Aten hymn" — representing either direct transmission or a shared near-Eastern solar hymn tradition. The text also anticipates Stoic universal humanism: the same god made Egyptians, Syrians, Nubians, and all peoples equally.',
  crossTradition: [
    { label: 'Psalm 104 — probable direct parallel or shared source',       note: 'The verbal parallels between the Hymn to the Aten and Psalm 104 are among the most documented inter-textual connections in ancient literature: Aten sets → darkness like death (Ps 104:20); creatures emerge at dawn (Ps 104:22); ships sail (Ps 104:26); all receive life from God\'s breath (Ps 104:29-30). Either direct transmission via the Hebrews\' Egyptian sojourn tradition, or both derive from a common near-Eastern solar hymn genre.' },
    { label: 'Nasadiya Sukta — solar creative energy as the cosmic origin',  textId: 'nasadiya-sukta',   note: 'The Vedic sukta\'s "That One breathed without breath by its own power" parallels Aten\'s self-subsisting creative radiance. Both describe a single divine creative principle that generates all diversity without itself being exhausted.' },
    { label: 'Genesis 1 — light before all other creation',                 textId: 'genesis-1',        note: 'Both Genesis 1 and the Hymn to the Aten begin with primordial light as the first creative act. The hypothesis that Genesis 1\'s "let there be light" preserves memory of the Aten solar theology through the Hebrew sojourn in Egypt is a contested but live scholarly position.' },
    { label: 'Poimandres — Nous as primordial light',                        textId: 'poimandres',       note: 'The Hermetic Nous appearing as Light that pierces the darkness in CH I — transmitted through Alexandria — carries the Egyptian solar-Nous theology of Aten forward into the Hellenistic synthesis.' },
  ],
  translations: [
    { id: 'lichtheim', label: 'Lichtheim 1976 (T1, Ancient Egyptian Literature)' },
    { id: 'allen',     label: 'Allen 2005 (T2, The Art of the Pharaoh)' },
    { id: 'egyptian',  label: 'Egyptian (hieratic original)' },
  ],
  sections: [
    {
      heading: 'I. The Rising of the Aten',
      verses: [
        {
          ref: 'Lines 1–10',
          text: 'You rise in beauty on the horizon of heaven, O living Aten, origin of life! When you dawn from the eastern horizon you fill every land with your beauty. You are bright, great, and dazzling, high above every land; your rays encompass all the lands to the limit of all that you have made.',
          textVersions: {
            lichtheim: 'You rise in beauty on the horizon of heaven, O living Aten, origin of life! When you dawn in the eastern light-land, you fill every land with your beauty.',
            allen:     'You appear beautifully on the horizon of heaven, you living Aten, the beginning of life! When you rise on the eastern horizon you have filled every land with your beauty.',
            egyptian:  'nfr n.k wbn.k r 3ḫt nt pt ʾitn ʿnḫ tp ḏt sp tpy· ʿḥʿ.k m 3ḫt iȝbt mḥ.k tȝ nb m nfrw.k',
          },
          entities: [
            { word: 'living Aten', node: 'aten', type: 'deity',
              note: 'The Aten (ʾitn) — the sun disk as a divine entity — is Akhenaten\'s revolutionary theological move: stripping away all the mythological narrative of Egyptian religion (Osiris, Horus, Set, etc.) to identify the divine solely with the physical light of the sun. The Aten is not Ra with a human head and solar disk — it is the disk itself, the energy of light as the sole creative force.',
              parallels: [
                { label: 'Ra — the earlier solar theology', node: 'ra', note: 'The Aten theology radicalizes the earlier Ra-Atum solar theology: where Ra was one powerful god among many, the Aten is the only god — a strict monotheism with no pantheon, no myths, no death-and-resurrection narrative.' },
                { label: 'Sol Invictus — Roman solar monotheism', node: 'sol-invictus', note: 'Constantine\'s Sol Invictus (Unconquered Sun) before his conversion to Christianity is the late Roman form of the same solar monotheism that Akhenaten pioneered 1,600 years earlier. The Aten → Sol Invictus → Christ-as-Light-of-the-World progression is one of the clearest religious transmission chains in history.' },
              ]
            },
            { word: 'your rays encompass all the lands', node: 'tradition-egyptian-religion', type: 'concept',
              note: 'The universalism of the Aten hymn is striking for 1345 BCE — the same single sun illuminates Egypt, Syria, Nubia, and all other lands equally. This anticipates Stoic cosmopolitanism (all humans share the same divine logos/reason) and the Quranic "Lord of all worlds" (Rabb al-ʿālamīn) in Al-Fatiha.',
              parallels: [
                { label: 'Quran Al-Fatiha — "Lord of all worlds"', textId: 'quran-fatiha-nur', note: 'The Aten\'s rays encompassing all lands equally and the Quran\'s "Rabb al-ʿālamīn" (Lord of all worlds) both articulate a universal divine sovereignty that transcends ethnic or national particularity.' },
              ]
            },
          ]
        },
        {
          ref: 'Lines 11–22',
          text: 'When you set in the western horizon, the land is in darkness, in the manner of death. Men sleep in their rooms, their heads covered, no eye can see its fellow. Every lion goes out from its den; all serpents, they sting. Darkness envelops all. The earth is silent — for he who made them rests in his horizon.',
          textVersions: {
            lichtheim: 'When you set in the western lightland, earth is in darkness as if in death. Men sleep in chambers, heads covered, one eye not seeing another. Should one take all their things from under their heads, they would not know it.',
            allen:     'When you have gone to rest in the western horizon, the land is in darkness, in the condition of death. People sleep in their rooms, their heads wrapped up, one eye not seeing another.',
            egyptian:  'ḥtp.k m 3ḫt imnt nt pt tȝ m kk.t mi(t)t mwt· ndr n.sn tp.sn n m33 irty.sn ḫft-ḥr.sn',
          },
          entities: [
            { word: 'in darkness, in the manner of death', node: 'primordial-darkness', type: 'concept',
              note: 'The equation of the Aten\'s setting with death-like darkness is the Egyptian theology that underlies the Osirian death-and-resurrection narrative: the sun\'s daily death (setting) and resurrection (rising) is the cosmic model for all death and rebirth. When Akhenaten strips away Osiris, the same theology remains embedded in the Aten\'s daily cycle.',
              parallels: [
                { label: 'Psalm 104:20 — "You bring darkness, it becomes night"', note: 'Psalm 104:20-21: "You bring darkness, it becomes night, and all the beasts of the forest prowl. The lions roar for their prey." The verbal correspondence with this passage of the Aten Hymn (lions going out in darkness, serpents stirring) is the strongest direct parallel between the two texts.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. The Creator of All Peoples',
      verses: [
        {
          ref: 'Lines 54–72',
          text: 'How manifold are your works! They are mysterious, hidden from the face of man. O sole god, there is none like you! You made the earth according to your wish, you alone — all peoples, all herds and flocks, everything on earth that walks on legs, everything in the air that flies with its wings.',
          textVersions: {
            lichtheim: 'How manifold are all your works! They are hidden from the face of man. O sole god, like whom there is no other! You made the earth as you wished, you alone, all peoples, herds, and flocks.',
            allen:     'How many are your deeds, though hidden from sight. O sole god, there is none beside you! You made the earth as you wished, you alone — all peoples, cattle, and flocks.',
            egyptian:  'iry.k n ȝḫt wr.sn ḥȝp.tw r-ḥr n rmṯ· nṯr wʿ n ky sn.f ḫpr.n.k tȝ m ẖt.k ḏt.k wʿ.k n rmṯ nb',
          },
          entities: [
            { word: 'How manifold are your works', node: 'akhenaten', type: 'person',
              note: 'The phrase "how manifold are your works" (iry.k n ȝḫt wr.sn) is virtually identical to Psalm 104:24: "How many are your works, O LORD! In wisdom you made them all." Egyptologist Jan Assmann has argued this is one of the clearest cases of direct text transmission in ancient religious history, passing from Egypt to Israel through the Levantine cultural corridor.',
              parallels: [
                { label: 'Psalm 104:24 — "How many are your works, O LORD!"', note: 'Psalm 104:24: "How many are your works, LORD! In wisdom you made them all; the earth is full of your creatures." The verbal parallel with the Aten Hymn is precise enough that most scholars now accept either direct literary dependence or derivation from a shared Egyptian-Levantine hymn tradition.' },
              ]
            },
            { word: 'sole god, there is none like you', node: 'tradition-egyptian-religion', type: 'concept',
              note: 'The formula "sole god, there is none like you" (nṯr wʿ n ky sn.f) is the Egyptian formulation of monotheism. It precedes and structurally parallels the Hebrew Shema: "Hear O Israel, YHWH is our God, YHWH is One" (Deuteronomy 6:4) and the Islamic Shahada: "There is no god but Allah." All three are the same theological claim made in successive cultural contexts.',
              parallels: [
                { label: 'Shema — "YHWH is One"', note: 'Deuteronomy 6:4: "Hear, O Israel: The LORD our God, the LORD is one." The Aten Hymn\'s "sole god, there is none like you" and the Hebrew Shema are structurally identical monotheistic declarations, separated by ~600 years.' },
                { label: 'Shahada — "There is no god but Allah"', textId: 'quran-fatiha-nur', note: 'The Islamic Shahada ("Lā ilāha illā llāh") is the Islamic form of the same monotheistic declaration. The progression Aten Hymn → Shema → Shahada traces the 2,000-year transmission of the "sole god" formula.' },
              ]
            },
          ]
        },
        {
          ref: 'Lines 76–91',
          text: 'The foreign lands of Syria and Kush, and the land of Egypt — you place every man in his place, you supply their needs. Everyone has his food, and his lifetime is counted. Their tongues are separate in speech, their natures likewise; the colors of their skins are different, for you have distinguished the peoples.',
          textVersions: {
            lichtheim: 'The foreign lands, Syria and Kush, the land of Egypt, you set every person in his place, you supply their needs; everyone has his food, his lifetime is counted. Their tongues are separate in speech, their natures as well, their skins are different, for you have differentiated the peoples.',
            allen:     'The foreign countries of Khor and Kush, the land of Egypt — you set every man in his place, you make their provisions; each one has his ration, his lifetime is reckoned. Their languages are different in speech, their characters likewise; their colors are different, for you have distinguished nation from nation.',
            egyptian:  'ḫȝswt ẖnt.w Kš tȝ n Kmt· šȝʿ.k nty nb m bw.f dı́.k n.f ˓nḫ.f',
          },
          entities: [
            { word: 'Syria and Kush, and the land of Egypt', node: 'aten', type: 'concept',
              note: 'The Aten Hymn is remarkable for its explicit universalism: the same god created Syrians, Nubians, and Egyptians equally, and made each people different — different languages, skin colors, characters — as a positive act of divine creativity, not a hierarchy. This is 1345 BCE. It is the earliest surviving text that explicitly affirms human diversity as a divine creation.',
              parallels: [
                { label: 'Acts 17:26 — "From one man he made all nations"', note: 'Paul in Athens: "From one man he made all nations of the earth... he determined the times set for them and the exact places where they should live." The Aten Hymn\'s theology of one god creating all peoples in their different places and times is structurally identical to Paul\'s Areopagus speech.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 24. BOOK OF THE DEAD CHAPTER 125 ─────────────────────────────────────────
SCRIPTURE_TEXTS['book-of-dead-125'] = {
  title: 'Book of the Dead — Chapter 125: The Weighing of the Heart',
  shortTitle: 'Book of the Dead 125',
  tradition: 'Ancient Egyptian',
  date: 'c. 1550–50 BCE (New Kingdom through Late Period)',
  intro: 'Chapter 125 of the Book of the Dead (Egyptian: Pert em Hru, "Coming Forth by Day") contains the Negative Confession and the psychostasia — the weighing of the heart against the feather of Ma\'at before the tribunal of Osiris. It is the foundational text for the Last Judgment theology that passes through Judaism into Christianity and Islam. The 42 declarations of innocence, one for each of 42 assessor gods, constitute the oldest systematic ethics document in human history.',
  crossTradition: [
    { label: 'Matthew 25 — the Last Judgment / "I was hungry, you fed me"', note: 'Matthew 25:31-46: the final judgment separating sheep from goats based on acts of care for the poor, sick, and imprisoned — "whatever you did for one of the least of these brothers and sisters of mine, you did for me." The structural parallel to BD 125\'s declaration-based judgment is the strongest documented Egypt→Christian transmission chain.' },
    { label: 'Yasna 30 — Truth vs Lie as the cosmic moral axis',            textId: 'yasna-30',        note: 'The Zoroastrian Asha (Truth/Right Order) vs Druj (Lie/Chaos) as the two poles of moral reality maps directly onto Ma\'at vs Isfet in Egyptian theology. Both systems make truth/order the criterion of divine judgment.' },
    { label: 'Quran — the Day of Judgment / Yawm al-Din',                  textId: 'quran-fatiha-nur', note: 'Al-Fatiha 1:4: "Owner of the Day of Judgment" (Mālik yawm al-dīn). The Islamic Day of Judgment with its divine scales weighing deeds inherits the Egyptian psychostasia (heart-weighing) tradition through Jewish and Christian intermediaries.' },
    { label: 'Gospel of Thomas — the Kingdom is now / judgment is here',    textId: 'gospel-of-thomas', note: 'Thomas L.51: "What you look forward to has already come, but you do not recognize it." The Thomasine internalization of judgment (the Kingdom is already present) is the Gnostic inversion of the BD 125 external tribunal — same theology, reversed locus.' },
  ],
  translations: [
    { id: 'budge',    label: 'Budge 1895 (T1, public domain)' },
    { id: 'faulkner', label: 'Faulkner 1972 (T2)' },
    { id: 'egyptian', label: 'Egyptian (hieroglyphic)' },
  ],
  sections: [
    {
      heading: 'I. Entering the Hall of Two Truths',
      verses: [
        {
          ref: 'BD 125 — Opening Address',
          text: 'What is said on reaching the Hall of the Two Truths so as to cleanse the deceased of all the sins which he has committed, and to see the faces of all the gods: "Hail to you, O great god, Lord of the Two Truths! I have come before you, my Lord, and I have been brought so that I might see your beauty."',
          textVersions: {
            budge:    '"Hail, thou great god, lord of the Two Truths! I have come to thee, O my Lord, that thou mayest bring me so that I may see thy beauteousness."',
            faulkner: '"Hail to you, great god, lord of the Two Truths! I have come to you, my lord, that you may bring me so that I may see your beauty."',
            egyptian: 'ḫft ı̓ṱ.ṱ m ı̓ȝt-mȝʿt nfrt ı̓m n ı̓sft nb.s sı̓.tw s m ı̓rr.f ı̓rr.f mȝʿ.f m-ḫft nṯrw',
          },
          entities: [
            { word: 'Hall of the Two Truths', node: 'maat', type: 'concept',
              note: 'The "Hall of Two Truths" (ı̓ȝt-mȝʿt nfrt ı̓m n ı̓sft) — the hall of Ma\'at-in-truth and Ma\'at-free-from-evil — is the Egyptian court of divine judgment presided over by Osiris. Ma\'at (ّmȝʿt) is simultaneously the goddess of truth/justice and the cosmic principle of right order that holds the universe together. The heart is weighed against her feather: if the heart is lighter than Ma\'at\'s feather, the person passes into the afterlife; if heavier with sin, it is devoured by Ammit (the "devourer").',
              parallels: [
                { label: 'Zoroastrian Chinvat Bridge — judgment passage', textId: 'yasna-30', note: 'The Chinvat Bridge (Bridge of the Separator) in Zoroastrianism, which the soul must cross after death — wide for the righteous, narrow as a razor-edge for the wicked — is the Iranian version of the Egyptian Hall of Two Truths as the post-death judgment passage.' },
                { label: 'Islamic Mizan — the scales of divine judgment', textId: 'quran-fatiha-nur', note: 'The Islamic Mizan (scales/balance) on the Day of Judgment (Quran 21:47: "We shall set up the scales of justice for the Day of Resurrection") directly inherits the Egyptian psychostasia through Jewish and Christian transmission.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. The Negative Confession (Declaration of Innocence)',
      verses: [
        {
          ref: 'BD 125 — Negative Confession (selected)',
          text: '"I have not done falsehood against men. I have not impoverished my associates. I have not done anything wicked in the place of truth. I have not known any evil. I have not made anyone weep. I have not killed. I have not commanded to kill. I have not made anyone suffer. I have not stolen the offerings in the temples. I have not falsified the balance. I have not taken away the milk from the mouths of children."',
          textVersions: {
            budge:    '"I have not done iniquity. I have not robbed with violence. I have not done violence to any man. I have not committed theft. I have not slain man or woman. I have not defrauded the offerings. I have not acted deceitfully. I have not uttered falsehood."',
            faulkner: '"I have not done falsehood. I have not robbed. I have not been rapacious. I have not stolen. I have not killed men. I have not damaged offerings. I have not been deceitful. I have not made anyone weep."',
            egyptian: 'n ı̓r.n.ı̓ ı̓sft n rmṯ· n ı̓r.n.ı̓ sfx ḥr-tp.sn· n ı̓r.n.ı̓ bı̓n m bw nfr· n rx.n.ı̓ ı̓sft',
          },
          entities: [
            { word: 'I have not done falsehood', node: 'maat', type: 'concept',
              note: 'The Negative Confession is structured as 42 declarations (one for each of 42 assessor-gods / nomes of Egypt), each denying a specific moral transgression. The structure — comprehensive ethical inventory organized around denials — is the world\'s oldest systematic moral code, predating the Ten Commandments by several centuries. The specific content (no killing, no stealing, no falsehood, no exploitation of the poor) maps directly onto the Decalogue and the Sermon on the Mount.',
              parallels: [
                { label: 'Ten Commandments — the same prohibitions in imperative form', note: 'The Ten Commandments (Exodus 20) state in imperative form what the Negative Confession states in declarative form: "You shall not kill" = "I have not killed." The content overlap is extensive and the Egyptian origin is the dominant scholarly hypothesis for the structure.' },
                { label: 'Matthew 25 — "I was hungry and you fed me"', note: 'Matthew 25:35-36 lists the acts of mercy that constitute righteousness at the Last Judgment — feeding the hungry, clothing the naked, visiting the sick. BD 125\'s "I have not taken away the milk from the mouths of children / I have not made anyone weep" is the same ethics in negative declaration form.' },
              ]
            },
            { word: 'I have not falsified the balance', node: 'anubis', type: 'concept',
              note: 'The balance/scales of justice (Mḫȝt — the scales of Ma\'at, held by Anubis) is the instrument of divine judgment in the Hall of Two Truths. The moral prohibition against falsifying physical scales on earth mirrors the divine scales of the afterlife — the same principle of truth/measure governs both commerce and cosmic judgment. The Roman figure of Justitia holding scales inherits this directly from Egyptian Ma\'at iconography.',
              parallels: [
                { label: 'Lady Justice — Themis/Justitia holds the scales', note: 'The Greco-Roman Themis/Justitia holding scales of justice is the direct iconographic and conceptual descendant of Ma\'at and her feather-scale. The transmission runs: Egyptian Ma\'at → Greek Themis → Roman Justitia → Western Lady Justice.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'III. The Weighing of the Heart',
      verses: [
        {
          ref: 'BD 125 — The Psychostasia',
          text: 'Then Anubis shall lead the deceased to the scales. He places the heart on one side; the feather of Ma\'at is placed on the other. Thoth stands ready to record the verdict. The heart that is true and light shall pass; Osiris shall say to those who have passed: "Come, you have been vindicated. You are among us."',
          textVersions: {
            budge:    'Then Anubis shall lead the deceased before the Great Balance, wherein is weighed the heart against the feather of Ma\'at. Thoth, who is lord of the divine words, shall say "The heart of Osiris N has truly been weighed, and his soul has stood as a witness for him."',
            faulkner: 'Anubis lays the heart upon the scales. Thoth reads the balance and reports to the Ennead. Those who have been found upright of heart: "Be you perfect, you whose heart is right, for Osiris knows you."',
            egyptian: 'ı̓n Ḥrw-ımȝḫ.f ı̓b n Wsır N m wḏȝt-ı̓b.f m nfrw.f sdm.n.f mdt.f ı̓n Ḏḥwty',
          },
          entities: [
            { word: 'Anubis', node: 'anubis', type: 'deity',
              note: 'Anubis (ı̓npw), the jackal-headed god of embalming and the dead, performs the psychostasia — the weighing of the heart. He is the guide of souls through the underworld (psychopomp), equivalent to Hermes Psychopomp in Greek religion, the angel of death in Judaism/Islam, and the Valkyries in Norse tradition. Anubis\'s role as the measurer of moral worth makes him the ancestor of the scales of justice iconography across Western civilization.',
              parallels: [
                { label: 'Hermes Psychopomp — guide of souls to the underworld', note: 'The Greek Hermes Psychopomp (guide of souls) who leads the dead to Hades is the direct Greek equivalent of Anubis, transmitted through the Egyptian-Greek cultural synthesis of the Ptolemaic period. The Hermetic tradition keeps this connection explicitly: Hermes = Thoth = the divine messenger and soul-guide.' },
              ]
            },
            { word: 'feather of Ma\'at', node: 'maat', type: 'symbol',
              note: 'The single ostrich feather of Ma\'at (truth/justice/cosmic order) as the counterweight against the human heart is one of the most arresting images in religious history. The heart (ib) — the seat of consciousness, memory, and moral will — is weighed against truth itself. A heart "lighter than a feather" is one that has been emptied of ego, attachment, and wrongdoing; a "heavy heart" is burdened with sin. This is the origin of the Western metaphor of the heavy conscience.',
              parallels: [
                { label: 'The heavy heart — burden of guilt as literal weight', note: 'The metaphor of a "heavy heart" (conscience burdened by guilt) in English and all European languages ultimately derives from the Egyptian psychostasia: a heart made heavy by sin literally sinks the scales of Ma\'at\'s judgment.' },
                { label: 'Yasna 30 — Truth as the cosmic counterweight to the Lie', textId: 'yasna-30', note: 'The Zoroastrian Asha (Truth/Right Order, feather of Ma\'at equivalent) as the moral axis of the universe against the Druj (the Lie) is the Iranian theological parallel to the Egyptian Ma\'at system.' },
              ]
            },
            { word: 'Thoth stands ready to record', node: 'thoth', type: 'deity',
              note: 'Thoth (Ḏḥwty), the ibis-headed god of writing, wisdom, and the moon, records the verdict of the psychostasia on his scribal palette. As the divine scribe he is the keeper of the Book of Life — the Egyptian precursor of the biblical and quranic metaphor of divine records in which all human deeds are written. In the Hermetic tradition, Thoth becomes Hermes Trismegistus, the author of the Hermetic corpus: the same divine recording and transmitting intelligence.',
              parallels: [
                { label: 'Hermes Trismegistus — Thoth as divine scribe becomes Hermetic author', node: 'hermes-trismegistus', note: 'The Greek Hermes = Egyptian Thoth in the Ptolemaic synthesis. "Hermes Trismegistus" (Thrice-Greatest Hermes) is Thoth elevated to cosmic authority as the author of all divine wisdom. The Hermetic corpus is, in its Egyptian deep structure, the teachings of Thoth.' },
                { label: 'Book of Life — divine record-keeping in Jewish/Christian/Islamic tradition', note: 'The "Book of Life" in which deeds are recorded (Daniel 12:1, Revelation 20:12, Quran 83:7-9 "the Book of the Wicked / the Book of the Righteous") directly inherits the Egyptian Thoth-scribal tradition via the Alexandrian synthesis.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 25. PYRAMID TEXTS — UTTERANCES 217 & 222 ─────────────────────────────────
SCRIPTURE_TEXTS['pyramid-texts'] = {
  title: 'Pyramid Texts — Utterances 217 & 222 (Resurrection)',
  shortTitle: 'Pyramid Texts',
  tradition: 'Ancient Egyptian / Old Kingdom',
  date: 'c. 2375–2181 BCE (pyramid of Unas at Saqqara; oldest surviving religious texts)',
  intro: 'The Pyramid Texts are the oldest surviving religious corpus in human history — carved in the burial chambers of Old Kingdom pharaohs at Saqqara beginning c. 2375 BCE. Utterances 217 and 222 are the core resurrection proclamations: the dead king is assured "you have not gone dead, you have gone alive" and is identified with both Osiris and Ra. The theology of bodily resurrection, divine judgment, and the soul\'s ascent to join the gods originates here — 2,400 years before Christianity.',
  crossTradition: [
    { label: 'John 11 — "I am the resurrection and the life"',      textId: 'john-1',           note: 'John 11:25: "I am the resurrection and the life. The one who believes in me will live, even though they die." The Pyramid Texts\' proclamation "you have not gone dead, you have gone alive" is the Egyptian theological antecedent of the Johannine resurrection doctrine by ~2,500 years.' },
    { label: 'Poimandres — ascent through the planetary spheres',   textId: 'poimandres',       note: 'The Hermetic Nous-soul ascending through the planetary spheres to return to God in CH I directly develops the Pyramid Texts\' theology of the dead king ascending through the sky to join the imperishable stars.' },
    { label: 'Descent of Inanna — the underworld journey as reversal', textId: 'descent-inanna', note: 'The Pyramid Texts\' resurrection — the dead king\'s journey through the underworld reversed into an ascent — is structurally parallel to Inanna\'s descent into the Great Below and her return. Both encode the same pattern: divine being descends into death and returns. The Egyptian theology makes the return assured (through ritual); the Sumerian leaves it ambiguous.' },
    { label: 'Gospel of Thomas — the deathless self',               textId: 'gospel-of-thomas', note: 'Thomas L.111: "Whoever finds the meaning of these words will not taste death." The Pyramid Texts\' assurance to the king "you have not gone dead" is the original declaration of the same deathless essential self — the divine element within the human that death cannot touch.' },
  ],
  translations: [
    { id: 'faulkner', label: 'Faulkner 1969 (T1, The Ancient Egyptian Pyramid Texts)' },
    { id: 'allen',    label: 'Allen 2005 (T2)' },
    { id: 'egyptian', label: 'Egyptian (hieroglyphic/pyramid walls)' },
  ],
  sections: [
    {
      heading: 'I. Utterance 217 — You Have Not Gone Dead',
      verses: [
        {
          ref: 'PT §§ 152–154 (Utterance 217)',
          text: '"O King, you have not gone dead; you have gone alive. Sit upon the throne of Osiris, your sceptre in your hand, that you may give commands to the living. Your hand is grasped by Ra; your head is raised by Atum. The sky speaks to you; the earth trembles before you."',
          textVersions: {
            faulkner: '"O King, you have not gone dead; you have gone alive. Sit upon the throne of Osiris, your staff of authority in your fist, so that you may give orders to the living; and your sceptre of power is in your hand, so that you may give orders to those whose places are hidden."',
            allen:    '"O King, you have not died — you have become alive. Ascend to the sky, for you have not died. Sit on the throne of Osiris, your crook in your fist, that you may command the living."',
            egyptian: 'n mwt.k N n ʿnḫ.k N ḥms m nst Wsır ı̓m.k n ḥtı̓ n nbt ı̓r.k',
          },
          entities: [
            { word: 'you have not gone dead; you have gone alive', node: 'osiris', type: 'concept',
              note: 'The proclamation "n mwt.k N, n ʿnḫ.k N" — "you have not gone dead, you have gone alive" — is the theological core of the Pyramid Texts. In the Egyptian religious system death is not the end but a transformation: the dead king becomes Osiris (the god who died and was resurrected). This theology — that death is not extinction but a passage to divine life — is the ancestor of the resurrection doctrines in Judaism, Christianity, Islam, and Gnosticism.',
              parallels: [
                { label: 'John 11:25-26 — "I am the resurrection and the life"', textId: 'john-1', note: 'Jesus: "I am the resurrection and the life. The one who believes in me will live, even though they die; and whoever lives by believing in me will never die." The Pyramid Texts\' "you have not gone dead, you have gone alive" is the structural and theological antecedent by ~2,500 years.' },
                { label: 'Osirian resurrection theology', node: 'dying-rising-god', note: 'The dead king\'s identification with Osiris — who was killed by Set, dismembered, and resurrected by Isis — is the foundational dying-and-rising-god theology. Osiris\'s resurrection prefigures the resurrection narratives across ancient Mediterranean religion.' },
              ]
            },
            { word: 'throne of Osiris', node: 'osiris', type: 'deity',
              note: 'The dead king is identified with Osiris — the first god to die and be resurrected. By sitting on Osiris\'s throne, the king participates in the divine resurrection template. This is the Egyptian prototype of the "seated at the right hand of God" theology in Christianity (Psalm 110:1, Acts 7:55-56) — the vindicated dead occupying the divine throne.',
              parallels: [
                { label: 'Psalm 110:1 — "Sit at my right hand"', note: 'YHWH to the king: "Sit at my right hand until I make your enemies a footstool for your feet." The Pyramid Texts\' dead king sitting on the throne of Osiris and the Psalm\'s royal enthronement after death are cognate motifs.' },
              ]
            },
          ]
        },
        {
          ref: 'PT §§ 199–200 (Utterance 222)',
          text: '"Recitation by Nut, sky-goddess: O King, I have given you the sky and it belongs to you. You shall not die; you shall be alive. You are the eldest of the gods who are with me. I have given you these your eternal stars; you shall not perish, you shall not be destroyed forever."',
          textVersions: {
            faulkner: '"Recitation by Nut: O king N., I have given you the sky, that you may traverse it; I have given you the stars, that you may be acquainted with them; you shall not perish, for ever and ever."',
            allen:    '"Words spoken by Nut: I place the sky before you, king, that you may cross it; I give you the imperishable stars for you to become familiar with them. You shall not perish, you shall not be destroyed forever and ever."',
            egyptian: 'ḏd-mdw ı̓n Nwt ı̓n.ı̓ n.k pt ı̓ȝḫ.k ı̓n.n.ı̓ n.k sbȝw ı̓mn.w n ḥ.k n sk.k n ḥtm.k r nḥḥ ḏt',
          },
          entities: [
            { word: 'Nut, sky-goddess', node: 'nut', type: 'deity',
              note: 'Nut (Nwt) the sky-goddess — depicted as a woman arching over the earth, her body covered in stars — is the Egyptian mother of the celestial realm and of the dead king\'s afterlife. She swallows the sun each evening and gives birth to it each morning. The dead king ascending to become one of the "imperishable stars" (ikhemu-sek — the circumpolar stars that never set) is the Egyptian form of the stellar immortality theology.',
              parallels: [
                { label: 'Isaiah 14:12 — "morning star, son of the dawn"', note: 'Isaiah\'s address to the fallen king of Babylon: "How you have fallen from heaven, morning star, son of the dawn!" — and the reversal image of the Pyramid Texts\' king ascending to the imperishable stars — are the same stellar-immortality theology used in opposite directions: ascent vs fall.' },
              ]
            },
            { word: 'you shall not perish, you shall not be destroyed forever', node: 'dying-rising-god', type: 'concept',
              note: 'The double negation — not perish, not be destroyed — and the eternal time-formula (nḥḥ ḏt = cyclical eternity + absolute eternity) is the Pyramid Texts\' fullest theological statement of immortality. It operates on two registers: the king becomes imperishable like the circumpolar stars (cosmological immortality) AND is identified with Osiris who overcame death (mythological immortality). Both registers pass into later resurrection theology.',
              parallels: [
                { label: 'Gospel of Thomas L.111 — "will not taste death"', textId: 'gospel-of-thomas', note: 'Thomas L.111: "The heavens and the earth will roll up in your presence, and whoever is living from the living one will not see death." The Pyramid Texts\' royal declaration of never perishing and the Thomasine deathless self are the same theological claim across 2,500 years.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 26. COFFIN TEXT SPELL 1130 ────────────────────────────────────────────────
SCRIPTURE_TEXTS['coffin-text-1130'] = {
  title: 'Coffin Text Spell 1130 — The Creator Addresses All Humanity',
  shortTitle: 'Coffin Text 1130',
  tradition: 'Ancient Egyptian / Middle Kingdom',
  date: 'c. 2100–1650 BCE (Middle Kingdom; coffin inscriptions at Asyut and Bersheh)',
  intro: 'One of the most remarkable texts in all Egyptian religion — and possibly in world literature. The Creator God (Atum/Shu) speaks directly to all humanity, explaining why he made the world and what gifts he gave them. The text is explicitly egalitarian: "I made every man like his fellow." Most strikingly: "Men are the tears of my eye" — the Egyptian word for men (rmtw) is a pun on tears (rmt). Humanity is born from the Creator\'s grief, or compassion. This text is the Egyptian source for the Hermetic and Gnostic cosmogonies where human existence arises from divine self-contemplation and emotional overflow.',
  crossTradition: [
    { label: 'Poimandres — humanity born from divine self-contemplation',    textId: 'poimandres',       note: 'In the Poimandres (CH I), the divine Anthropos falls in love with his own reflection in matter and descends. CT 1130\'s Creator weeping humanity into existence is the Egyptian antecedent: divine emotional overflow (tears/love) as the generative principle of human existence.' },
    { label: 'Genesis 2 — God breathes life into the human',               textId: 'genesis-1',        note: 'Genesis 2:7: God forms the human from dust and breathes life into the nostrils. CT 1130\'s four divine gifts including "the four winds that every man might breathe" is the Egyptian version: divine breath as the generative principle shared equally among all humans.' },
    { label: 'Tao Te Ching — the Tao giving without preference',            textId: 'tao-te-ching-1',   note: 'CT 1130\'s Creator giving four universal gifts (wind, water, equality, memory of death) to all people equally — "I did not command that they do evil; it is their hearts that have transgressed" — parallels the Tao\'s giving without preference or judgment. Both articulate a universal creative principle that bestows without discrimination.' },
    { label: 'Nasadiya Sukta — creation from the Creator\'s own desire',    textId: 'nasadiya-sukta',   note: 'The Vedic sukta\'s "kama tad agre sam avartatādhi" (from desire came the first seed of mind) and CT 1130\'s Creator weeping humanity into existence are both creation-from-divine-interiority narratives: the cosmos arising from within the divine, not constructed externally.' },
  ],
  translations: [
    { id: 'faulkner', label: 'Faulkner 1973–78 (T1, The Ancient Egyptian Coffin Texts)' },
    { id: 'lichtheim', label: 'Lichtheim 1973 (T2, Ancient Egyptian Literature vol. 1)' },
    { id: 'egyptian',  label: 'Egyptian (hieroglyphic coffin inscriptions)' },
  ],
  sections: [
    {
      heading: 'I. The Four Good Deeds',
      verses: [
        {
          ref: 'CT 1130 §§ 461–464',
          text: '"Words spoken by Him-Whose-Names-Are-Hidden, the Lord of All: I have done four good deeds within the mouth of the horizon. I made the four winds, that every man might breathe thereof, like his fellow — that is one deed. I made the great flood waters, that the poor man might have rights therein like the great man — that is one deed."',
          textVersions: {
            faulkner: '"I speak of the four good deeds which my own heart did for me within the coils of the serpent, in order to still evil... I created the four winds, that every man might breathe thereof in his time — this is one of the deeds. I created the inundation, that the humble man might benefit by it like the great — this is one of the deeds."',
            lichtheim: '"I have done four good deeds within the mouth of the horizon: I created the four winds so that every man might breathe — that is one deed. I created the great inundation so that the poor man could have rights like the great man — that is one deed."',
            egyptian:  'ı̓r.n.ı̓ nfrw fdw m rȝ-3ḫt· ı̓r.n.ı̓ ṯȝw fdw n rnpt ı̓.šs n rmṯ nb ı̓m.sn mı̓ sn.f',
          },
          entities: [
            { word: 'Him-Whose-Names-Are-Hidden', node: 'atum', type: 'deity',
              note: 'The Creator God speaking here identifies himself as the hidden, unnamed source — paralleling the Hermetic CH XI\'s "God cannot be named" and the Taoist "the Tao that can be named is not the eternal Tao." The Egyptian formula "Him-Whose-Names-Are-Hidden" (ı̓mn rn.f) is the same apophatic theology in Egyptian form, predating the Greek and Chinese formulations by over a millennium.',
              parallels: [
                { label: 'CH XI — "God cannot be named"', textId: 'corpus-hermeticum-11', note: 'CH XI\'s "God cannot be named — or all names are names of God" and CT 1130\'s "Him-Whose-Names-Are-Hidden" are the same apophatic theology 2,000 years apart, connected through the Egyptian-Hermetic transmission.' },
                { label: 'Tao Te Ching — the unnamed ground', textId: 'tao-te-ching-1', note: 'Tao 1: "Nameless, it is the origin of heaven and earth." The hidden-name Creator of CT 1130 and the unnamed Tao are independent formulations of the same apophatic move: the ultimate creative principle transcends all names.' },
              ]
            },
            { word: 'the poor man might have rights like the great man', node: 'tradition-egyptian-religion', type: 'concept',
              note: 'This is one of the most striking statements in all ancient religious literature: the Creator God explicitly states that divine justice — equal access to resources — is built into the structure of creation itself. The Nile flood (ḥʿpı̓) that fertilizes all Egypt was the gift of God to all Egyptians equally: a poor farmer and the pharaoh had the same claim on the flood water. This proto-egalitarianism in a divine mandate is the ancestor of the prophetic tradition (Amos, Isaiah) and the Matthew 25 teaching.',
              parallels: [
                { label: 'Amos 5:24 — "Let justice roll like a river"', note: 'The Hebrew prophetic tradition of divine justice for the poor — "let justice roll down like waters, and righteousness like an ever-flowing stream" — draws on the same Nile-flood-as-equalizer theology that CT 1130 encodes. The Nile becomes a metaphor for divine justice.' },
              ]
            },
          ]
        },
        {
          ref: 'CT 1130 §§ 465–468',
          text: '"I made every man like his fellow — I did not command that they do evil; it is their hearts that have transgressed what I have said. That is one deed. I made their hearts not to forget the West, so that divine offerings might be made to the gods of the provinces. That is one deed."',
          textVersions: {
            faulkner: '"I created every man like his fellow, and I did not command that they should do evil — it is their own hearts which have violated my commandment. This is one of the deeds. I created their hearts so that they should not forget the West, in order that the gods of the nomes might receive their divine offerings."',
            lichtheim: '"I made every man like his fellow; I did not ordain that they do wrong — it is their hearts that have disobeyed my commands. That is one deed. I set their hearts to not forget the west, in order that offerings be made to the gods of the provinces."',
            egyptian:  'ı̓r.n.ı̓ rmṯ nb mı̓ sn.f n wḏ.n.ı̓ ı̓r.sn ı̓sft ı̓b.sn pw ı̓wty mdwt.ı̓',
          },
          entities: [
            { word: 'I did not command that they do evil', node: 'tradition-egyptian-religion', type: 'concept',
              note: 'The Creator\'s exculpation — "I did not command evil; their hearts transgressed" — is the Egyptian version of the theodicy problem (why does evil exist if God is good?) and its solution: human free will is the source of evil, not divine command. This theodicy appears in identical form in Zoroastrianism (Angra Mainyu\'s choice), Genesis (the Fall), and Gnostic cosmogony (the Demiurge\'s ignorance). CT 1130 is the oldest surviving instance.',
              parallels: [
                { label: 'Genesis 3 — "They took and ate" — human transgression, not divine command', textId: 'genesis-1', note: 'The Garden of Eden narrative: God commanded what was good; the human heart transgressed. CT 1130\'s "I did not command evil; it is their hearts that transgressed" is structurally identical to the Fall narrative — 1,500 years earlier.' },
                { label: 'Yasna 30 — Angra Mainyu chose evil by free will', textId: 'yasna-30', note: 'Yasna 30.3: the two spirits chose at the primordial beginning — one chose truth, one chose the lie. Neither was commanded to choose. The Zoroastrian and Egyptian theologies both locate the origin of evil in a free choice, not in divine creation.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. Men Are the Tears of My Eye',
      verses: [
        {
          ref: 'CT 1130 §§ 469–471',
          text: '"I created the gods from my sweat; and men are the tears of my eye." In this way was the world made: the lesser divine beings from the Creator\'s bodily labor; humanity from his grief, or his compassion — for the words for "men" and "tears" share one sound in the language of Egypt.',
          textVersions: {
            faulkner: '"I created the gods from my sweat, and mankind from the tears of my eye." This is a sacred pun: the word for men (rmṯ) sounds like the word for tears (rmt) in Egyptian.',
            lichtheim: '"I created gods from my sweat; people came from the tears of my eye." The identity of sound between rmṯ (people) and rmt (tears) is not accidental — it encodes the theological claim that human existence arises from divine grief/compassion.',
            egyptian:  'ı̓r.n.ı̓ nṯrw m ı̓dt.ı̓ rmṯ m rmyt ı̓rt.ı̓',
          },
          entities: [
            { word: 'men are the tears of my eye', node: 'atum', type: 'concept',
              note: 'This line is perhaps the most theologically resonant in all Egyptian literature. The pun — rmṯ (men/humanity) = rmt (tears) — encodes the claim that human beings originate in the divine Creator\'s emotional life: his grief, his love, his compassion. The parallel with the Bodhisattva\'s compassionate tears in Buddhism (Kuan Yin weeping for all suffering beings), the Zoroastrian Ahura Mazda\'s grief at Angra Mainyu\'s choice, and the Christian God\'s grief over a lost sheep (Luke 15:4) is the same deep structure: the divine is moved by love/sorrow, and humanity is the product of that movement.',
              parallels: [
                { label: 'Poimandres — Anthropos falls through love of his reflection', textId: 'poimandres', note: 'In CH I, the divine Anthropos sees his own beautiful reflection in matter and descends through desire/love. Both CT 1130 and the Poimandres encode the same deep structure: divine emotional overflow (tears/love) produces human existence. The Hermetic myth is the philosophical elaboration of the Egyptian pun.' },
                { label: 'Nasadiya Sukta — creation from desire (kama)', textId: 'nasadiya-sukta', note: 'Rig Veda 10.129.4: "Desire (kama) came upon That One at the beginning — that was the primal seed of mind." The Vedic kama as the first creative impulse and the Egyptian Creator\'s tears as the origin of humanity are the same insight: the cosmos originates in divine interiority, not in mechanical production.' },
              ]
            },
            { word: 'gods from my sweat', node: 'tradition-egyptian-religion', type: 'concept',
              note: 'The hierarchy of divine creation — gods from sweat (ı̓dt, less intimate, labor-product), humans from tears (rmyt, most intimate, grief-product) — inverts what might be expected. Humans are not lesser beings made from leftover material; they are made from the Creator\'s most intimate emotional expression. This is the Egyptian theological foundation for the universal human dignity that the Hymn to the Aten also articulates: all peoples are equally the Creator\'s tears.',
              parallels: [
                { label: 'Genesis 1:26-27 — humans made "in the image of God"', textId: 'genesis-1', note: 'Genesis 1:26: "Let us make mankind in our image, in our likeness." The Egyptian "men are the tears of my eye" and the Hebrew "made in the image of God" both claim an intimacy between Creator and humanity that distinguishes humans from other creatures. The Egyptian formulation is more emotionally intense.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 27. PROVERBS 8 — LADY WISDOM ─────────────────────────────────────────────
SCRIPTURE_TEXTS['proverbs-8'] = {
  title: 'Proverbs 8 — Lady Wisdom at the Beginning of Creation',
  shortTitle: 'Proverbs 8 — Lady Wisdom',
  tradition: 'Hebrew Bible / Wisdom Literature',
  date: 'c. 6th–5th BCE (compiled; Wisdom poem may be older)',
  intro: 'The great self-disclosure of Wisdom (Hokmah in Hebrew, Sophia in Greek): a divine feminine figure who was present with God at the very first moment of creation, "rejoicing before him always, playing in his inhabited world." Proverbs 8 is the theological source-text for the Logos doctrine in John 1 — the Gospel\'s "In the beginning was the Logos" directly models itself on "YHWH created me at the beginning of his work." It is also the key text for understanding how the goddess Asherah — YHWH\'s ancient consort — was absorbed into the biblical tradition as the personified Wisdom who plays at God\'s side.',
  crossTradition: [
    { label: 'John 1 — Logos as Wisdom\'s philosophical successor',           textId: 'john-1',           note: 'John 1:1-3 models itself directly on Proverbs 8:22-31. Where Proverbs says "Wisdom was with God at the beginning," John says "the Logos was with God in the beginning, and through the Logos all things were made." The Logos is Wisdom translated into Greek philosophical vocabulary.' },
    { label: 'Poimandres — Nous as the divine companion at creation',         textId: 'poimandres',       note: 'The Hermetic Nous (Mind) as the first emanation of God, present at creation and the vehicle of all making — this is the Hermetic equivalent of Proverbs\' Wisdom beside God "like a master workman." The same divine-feminine-as-creative-intelligence tradition runs through Egyptian Isis, Hebrew Hokmah, and Hermetic Nous.' },
    { label: 'Sefer Yetzirah — Wisdom as the first of the 32 paths',         textId: 'sefer-yetzirah',   note: 'The Kabbalistic Sefirot begin with Chokmah (Wisdom) — the second sefirah, the first emanation of Keter into intelligibility. The Kabbalistic Chokmah and the Proverbs Hokmah are the same figure: divine Wisdom as the first active principle in creation, the mode through which God\'s thought becomes world.' },
    { label: 'Coffin Text 1130 — the Creator\'s intimate companion',          textId: 'coffin-text-1130', note: 'The Egyptian Creator in CT 1130 making the world with four gifts — and CT 1130\'s image of the Creator accompanied by divine intelligence — parallels Wisdom playing beside God at creation. Egyptian Maat (truth/order) as the divine principle that holds creation together is the Egyptian equivalent of Proverbs\' Wisdom.' },
  ],
  translations: [
    { id: 'nrsv',   label: 'NRSV 1989 (T1)' },
    { id: 'njps',   label: 'NJPS 1985 (T2)' },
    { id: 'hebrew', label: 'Hebrew (Masoretic)' },
  ],
  sections: [
    {
      heading: 'I. Wisdom\'s Call from the Heights',
      verses: [
        {
          ref: 'Proverbs 8:1–4',
          text: 'Does not Wisdom call out? Does not Understanding raise her voice? On the heights beside the way, at the crossroads she takes her stand; beside the gates in front of the town, at the entrance of the portals she cries aloud: "To you, O people, I call; my cry is to all that live."',
          textVersions: {
            nrsv:   'Does not wisdom call out? Does not understanding raise her voice? On the heights beside the way, at the crossroads she takes her stand; beside the gates in front of the town, at the entrance of the portals she cries aloud: "To you, O people, I call out; my cry is to all that live."',
            njps:   'It is Wisdom calling, Understanding raising her voice. She takes her stand at the topmost heights, by the road, at the crossroads, near the gate at the city entrance.',
            hebrew: 'הֲלֹא חָכְמָה תִקְרָא וּתְבוּנָה תִּתֵּן קוֹלָהּ· בְּרֹאשׁ-מְרֹמִים עֲלֵי-דֶרֶךְ',
          },
          entities: [
            { word: 'Wisdom call out', node: 'wisdom-personified', type: 'deity',
              note: 'The figure of Wisdom (Hokmah, חָכְמָה) calling in the streets and at the crossroads is the Hebrew Bible\'s most explicit divine-feminine image — a goddess-figure standing at the threshold between the human world and the divine. She calls universally: "to all that live," not just Israel. Her position at the city gate parallels the ancient function of gates as sacred thresholds presided over by divine guardians. The Aramaic Targum of Proverbs explicitly identifies this figure with the Torah; the Wisdom of Solomon identifies her with the Shekinah (divine presence). She is at the origin of all later Sophia/divine-feminine traditions in Judaism, Christianity, and Gnosticism.',
              parallels: [
                { label: 'Isis — the divine feminine crying out through the cosmos', node: 'isis', note: 'Isis crying out for the dismembered Osiris across all lands, and Lady Wisdom crying out at the crossroads to all who live, are structurally parallel: the divine feminine as the cosmic voice that calls all souls toward divine knowledge. The Ptolemaic Isis-aretalogies ("I am Isis... I gave laws to men... I am she who is called goddess by women") parallel the Proverbs Wisdom speech in form and scope.' },
                { label: 'Asherah — YHWH\'s ancient consort absorbed into Wisdom', node: 'asherah', note: 'Archaeological evidence (Kuntillet Ajrud inscriptions, c. 800 BCE: "YHWH of Samaria and his Asherah") shows that the Israelite God was worshipped alongside his consort Asherah. The Wisdom figure of Proverbs 8 — divine feminine beside YHWH at creation — preserves the memory of Asherah while sublimating her into an abstraction. The "playing beside God" of Proverbs 8:30-31 retains the erotic/intimate register of a divine consort.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. Before the Beginning — Wisdom at Creation',
      verses: [
        {
          ref: 'Proverbs 8:22–26',
          text: '"YHWH created me at the beginning of his work, the first of his acts of long ago. Ages ago I was set up, at the first, before the beginning of the earth. When there were no depths I was brought forth, when there were no springs abounding with water. Before the mountains had been shaped, before the hills, I was brought forth."',
          textVersions: {
            nrsv:   '"The LORD created me at the beginning of his work, the first of his acts of long ago. Ages ago I was set up, at the first, before the beginning of the earth. When there were no depths I was brought forth, when there were no springs abounding with water."',
            njps:   '"The LORD created me at the beginning of His course as the first of His works of old. In the distant past I was fashioned, at the beginning, at the origin of earth."',
            hebrew: 'יְהוָה קָנָנִי רֵאשִׁית דַּרְכּוֹ קֶדֶם מִפְעָלָיו מֵאָז· מֵעוֹלָם נִסַּכְתִּי מֵרֹאשׁ מִקַּדְמֵי-אָרֶץ',
          },
          entities: [
            { word: 'YHWH created me at the beginning', node: 'wisdom-personified', type: 'concept',
              note: 'The verse "YHWH qanani reshit darko" — "YHWH created/acquired me as the beginning of his way" — is the most contested verse in all Jewish-Christian theological history. The word qanah can mean "create" (Aquila, most modern translations), "acquire/possess" (LXX, NIV), or "beget" (Tertullian\'s reading). The Arian controversy (4th CE) hinged on this verse: Arius cited it to argue Christ/Logos was the first creation, not eternal. Athanasius countered that Wisdom here refers to Christ\'s human nature, not his divine nature. The entire Nicene Creed is a response to Proverbs 8:22.',
              parallels: [
                { label: 'John 1:1 — "In the beginning was the Logos" (eternal, not created)', textId: 'john-1', note: 'John 1 deliberately counters Proverbs 8\'s "created me at the beginning" by stating "in the beginning WAS the Logos" — not "was created." The Johannine Logos is eternal co-existent with God; the Proverbs Wisdom was the first creature. John 1 is a theological upgrade of Proverbs 8.' },
                { label: 'Sefer Yetzirah — Chokmah as the first emanation', textId: 'sefer-yetzirah', note: 'The Kabbalistic Chokmah (Wisdom) as the second sefirah — the first emanation from Keter, the mode through which God\'s potential becomes active — is the Kabbalistic reading of Proverbs 8:22: Wisdom is the first principle through which God acts.' },
              ]
            },
            { word: 'When there were no depths I was brought forth', node: 'primordial-darkness', type: 'concept',
              note: 'Wisdom\'s pre-existence "when there were no depths" (tehomot, the primordial waters) places her before the creation described in Genesis 1:2 ("darkness over the face of the deep / tehom"). Wisdom exists before water, before mountains, before the earth — in the same pre-creation void as the Hermetic primordial darkness. She is the first articulation of divine intelligence before matter.',
              parallels: [
                { label: 'Genesis 1:2 — "darkness over the face of the deep"', textId: 'genesis-1', note: 'Genesis 1:2\'s tehom (the deep) is what Wisdom predates. She is more primordial than the waters of chaos that Genesis begins with — she exists before the conditions for creation existed.' },
              ]
            },
          ]
        },
        {
          ref: 'Proverbs 8:27–31',
          text: '"When he established the heavens, I was there; when he drew a circle on the face of the deep, when he made firm the skies above, when he established the fountains of the deep, when he assigned to the sea its limit — I was beside him, like a master workman; and I was daily his delight, rejoicing before him always, rejoicing in his inhabited world and delighting in the human race."',
          textVersions: {
            nrsv:   '"When he established the heavens, I was there; when he drew a circle on the face of the deep... I was beside him, like a master workman; and I was daily his delight, rejoicing before him always."',
            njps:   '"I was with Him as a confidant, a source of delight every day, rejoicing before Him at all times, rejoicing in His inhabited world, finding delight with mankind."',
            hebrew: 'בַּהֲכִינוֹ שָׁמַיִם שָׁם אָנִי בְּחוּקוֹ חוּג עַל-פְּנֵי תְהוֹם· וָאֶהְיֶה אֶצְלוֹ אָמוֹן וָאֶהְיֶה שַׁעֲשֻׁעִים',
          },
          entities: [
            { word: 'like a master workman', node: 'logos-johannine', type: 'concept',
              note: 'The Hebrew word amon — translated "master workman" (NRSV), "confidant/trusted child" (NJPS), "craftsman" — is the crux of the entire passage. If amon means "craftsman/architect," Wisdom is the co-creator of the universe beside God — the template for the Johannine Logos ("through him all things were made"). If amon means "nursling/child," Wisdom is the beloved child playing at the Father\'s feet — the template for the Gnostic Sophia as the divine child. Both readings are theologically significant.',
              parallels: [
                { label: 'John 1:3 — "through the Logos all things were made"', textId: 'john-1', note: 'The Logos as God\'s "master workman" through whom all things were made is the Johannine translation of Proverbs 8\'s Wisdom-as-amon. The "through him all things were made" of John 1:3 is the Greek philosophical restatement of Wisdom\'s "I was there when he made everything."' },
                { label: 'Gnostic Sophia — the divine child who plays then falls', note: 'The Gnostic Sophia texts (Apocryphon of John, Pistis Sophia) derive from this same Proverbs 8 Wisdom-as-child image: the divine feminine who plays at the Father\'s side, then acts independently and falls — her fall producing the material world through the Demiurge.' },
              ]
            },
            { word: 'rejoicing before him always', node: 'sacred-marriage', type: 'concept',
              note: 'The intimate register of Wisdom "rejoicing/playing" (meshaheket, שַׁעֲשֻׁעִים) before God and "delighting in the human race" carries the erotic-playful tone of the sacred marriage (hieros gamos) — the divine masculine and divine feminine in joyful creative partnership. This is the Asherah theology sublimated: the goddess who was YHWH\'s consort has become the abstraction Wisdom, but the intimacy and play of the divine couple remains encoded in the verb.',
              parallels: [
                { label: 'Asherah as YHWH\'s consort — the historical background', node: 'asherah', note: 'The Kuntillet Ajrud inscriptions (c. 800 BCE) refer to "YHWH and his Asherah" as a divine couple. Proverbs 8\'s Wisdom who plays before God preserves this conjugal theology in abstracted form after the Deuteronomistic reform suppressed direct Asherah worship.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 28. PSALM 82 — THE DIVINE COUNCIL ────────────────────────────────────────
SCRIPTURE_TEXTS['psalm-82'] = {
  title: 'Psalm 82 — God Judges the Divine Council',
  shortTitle: 'Psalm 82 — Divine Council',
  tradition: 'Hebrew Bible / Psalms',
  date: 'c. 9th–7th BCE (possibly reflecting older Canaanite source)',
  intro: 'The most theologically radical psalm in the Hebrew Bible: YHWH stands up in the divine assembly (ʿadat El) and pronounces judgment on the other gods (elohim), condemning them for unjust rule. The psalm preserves the clearest window in the entire Hebrew Bible onto the polytheistic substrate from which Israelite monotheism emerged: there is a divine council of multiple gods presided over by El, each assigned a nation. YHWH is one member who rises to displace the others. The verse "I said, you are gods; children of the Most High, all of you" was cited by Jesus in John 10:34 to defend his own claim to divinity.',
  crossTradition: [
    { label: 'Ugaritic Baal Cycle — the council of El / sons of El',         note: 'The Ugaritic texts from Ras Shamra (c. 1400–1200 BCE) describe El presiding over a divine assembly of the "sons of El" (bene ilim) — each a god assigned a domain. Psalm 82\'s ʿadat El (assembly of El) and bene elyon (sons of the Most High) are direct Hebrew equivalents of the Ugaritic divine council. The psalm preserves the older polytheistic structure while narrating YHWH\'s rise to supremacy within it.' },
    { label: 'Enuma Elish — the divine assembly judges / Marduk rises',      textId: 'enuma-elish-1',    note: 'The Babylonian divine assembly that promotes Marduk to kingship after his victory over Tiamat is structurally identical to Psalm 82\'s assembly. In both: a council of gods; a crisis of justice/chaos; one god rises to take supreme authority. The Israelite and Babylonian traditions both encode the same narrative of divine-council politics.' },
    { label: 'John 10:34 — Jesus cites Psalm 82 to defend his own divinity',  textId: 'john-1',           note: 'John 10:34-36: when the Judeans accuse Jesus of blasphemy for calling himself God\'s Son, Jesus responds: "Is it not written in your Law, \'I have said you are gods\'? If he called them \'gods,\' to whom the word of God came... do you say of him whom the Father consecrated, \'You are blaspheming\'?" Jesus uses Psalm 82\'s "you are gods" to legitimize the category of divine human beings.' },
    { label: 'Orphic Theogony — divine succession and the gods who die',      textId: 'orphic-theogony',  note: 'Psalm 82\'s "you shall die like humans; you shall fall like any prince" — gods condemned to mortality — parallels the Orphic mythology of divine beings dying (Zagreus torn apart, Titans cast down). In both, the lesser divine beings are subject to death as punishment or consequence.' },
  ],
  translations: [
    { id: 'nrsv',   label: 'NRSV 1989 (T1)' },
    { id: 'njps',   label: 'NJPS 1985 (T2)' },
    { id: 'hebrew', label: 'Hebrew (Masoretic)' },
  ],
  sections: [
    {
      heading: 'I. God Rises in the Divine Assembly',
      verses: [
        {
          ref: 'Psalm 82:1–2',
          text: 'God (Elohim) stands in the divine assembly (ʿadat El); among the gods (elohim) he pronounces judgment: "How long will you judge unjustly and show partiality to the wicked? Give justice to the weak and the orphan; maintain the right of the lowly and the destitute."',
          textVersions: {
            nrsv:   'God has taken his place in the divine council; in the midst of the gods he holds judgment: "How long will you judge unjustly and show partiality to the wicked? Give justice to the weak and the orphan; maintain the right of the lowly and the destitute."',
            njps:   'God stands in the divine assembly; among the divine beings He pronounces judgment. "How long will you judge perversely, showing favor to the wicked? Give justice to the wretched and the orphan."',
            hebrew: 'אֱלֹהִים נִצָּב בַּעֲדַת-אֵל בְּקֶרֶב אֱלֹהִים יִשְׁפֹּט· עַד-מָתַי תִּשְׁפְּטוּ-עָוֶל',
          },
          entities: [
            { word: 'divine assembly (ʿadat El)', node: 'divine-council', type: 'concept',
              note: 'The ʿadat El — "assembly/congregation of El" — is the Hebrew Bible\'s clearest reference to the Canaanite divine council: a pantheon of divine beings presided over by El (the chief Canaanite deity), each assigned governance of a nation. YHWH participates in this council as one member who then rises to supremacy. This is not monotheism; it is henotheism (one supreme god among many) on the way to becoming monotheism.',
              parallels: [
                { label: 'El Elyon — the Most High God above the council', node: 'el-canaanite', note: 'El (the Canaanite high god, father of the divine assembly) and El Elyon ("God Most High") of Genesis 14:18 are almost certainly the same deity. YHWH gradually merges with El in Israelite theology, absorbing El\'s title ("Most High") and his council role into a single deity.' },
                { label: 'Enuma Elish — the assembly of gods and divine politics', textId: 'enuma-elish-1', note: 'The Babylonian divine assembly (the Igigi and Anunnaki) that promotes Marduk after his victory over Tiamat is the Mesopotamian equivalent of the Israelite ʿadat El. Both encode the same political structure: a divine assembly where divine authority is contested and reassigned.' },
              ]
            },
          ]
        },
        {
          ref: 'Psalm 82:5–8',
          text: '"They have neither knowledge nor understanding; they walk about in darkness; all the foundations of the earth are shaken. I said, \'You are gods, children of the Most High, all of you; nevertheless, you shall die like mortals, and fall like any prince.\'" Rise up, O God, judge the earth; for all the nations belong to you!',
          textVersions: {
            nrsv:   '"They have neither knowledge nor understanding; they walk around in darkness; all the foundations of the earth are shaken. I say, \'You are gods, children of the Most High, all of you; nevertheless, you shall die like mortals, and fall like any prince.\'" Rise up, O God, judge the earth; for all the nations belong to you!',
            njps:   '"They neither know nor understand, they go about in darkness; all the foundations of the earth totter. I had taken you for divine beings, sons of the Most High, all of you; but you shall die as men do, fall like any prince." Arise, O God, judge the earth, for all the nations are Your possession.',
            hebrew: 'אֲנִי-אָמַרְתִּי אֱלֹהִים אַתֶּם וּבְנֵי עֶלְיוֹן כֻּלְּכֶם· אָכֵן כְּאָדָם תְּמוּתוּן',
          },
          entities: [
            { word: 'You are gods, children of the Most High', node: 'divine-council', type: 'concept',
              note: 'The declaration "You are gods (elohim), children of the Most High (bene Elyon)" is the Hebrew Bible\'s explicit acknowledgment of a divine pantheon — lesser divine beings who are genuine gods, children of the highest God. This verse has had enormous theological impact: Jesus cites it in John 10:34 to legitimize the category of divine-human beings; Origen and later theologians use it to argue for the deification (theosis) of humans; Latter-day Saints use it to argue for the eternal progression of humans toward divine status.',
              parallels: [
                { label: 'John 10:34-36 — Jesus cites "you are gods" to defend himself', textId: 'john-1', note: 'John 10:34: Jesus says "Is it not written in your Law, \'I have said you are gods\'?" — citing Psalm 82:6 to argue that the Hebrew tradition itself allows for human beings receiving divine designation. If the judges of Israel could be called "gods," how much more the one "whom the Father consecrated and sent into the world"?' },
                { label: 'Orphic Theogony — divine beings that die', textId: 'orphic-theogony', note: 'The Orphic myth of Zagreus/Dionysus dying at the hands of the Titans, and the Psalm\'s gods condemned to "die like mortals," both acknowledge the possibility of divine mortality — a profound theological statement that the divine is not immune to death.' },
              ]
            },
            { word: 'all the nations belong to you', node: 'tradition-judaism', type: 'concept',
              note: 'The psalm\'s closing call "Rise up, O God, judge the earth; for all the nations belong to you!" is the triumphant assertion of YHWH\'s universal sovereignty over the entire divine council: having condemned the other gods to mortality, YHWH inherits all the nations they had been assigned. This is the theological mechanism by which Israelite henotheism (YHWH supreme among gods) becomes genuine monotheism (YHWH the only god, all nations his).',
              parallels: [
                { label: 'Deuteronomy 32:8-9 — nations assigned to the sons of God', note: 'Deuteronomy 32:8 (Dead Sea Scrolls and Septuagint text): "When the Most High assigned the nations, when he divided humankind, he fixed the boundaries of the peoples according to the number of the sons of God [bene elim]; but YHWH\'s own portion is his people, Jacob his allotted share." This is the older theology that Psalm 82 is overturning: YHWH was originally assigned Israel while other gods got other nations.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 29. ISAIAH 45 — CYRUS THE ANOINTED ───────────────────────────────────────
SCRIPTURE_TEXTS['isaiah-45'] = {
  title: 'Isaiah 45 — Cyrus, YHWH\'s Anointed; the Creator of Light and Darkness',
  shortTitle: 'Isaiah 45 — Cyrus',
  tradition: 'Hebrew Bible / Deutero-Isaiah',
  date: 'c. 550–540 BCE (Deutero-Isaiah, exilic period)',
  intro: 'The most theologically explosive chapter in the Hebrew prophetic canon. Cyrus the Great — Persian king, Zoroastrian, conqueror of Babylon — is called YHWH\'s "anointed" (mashiah, the same word used for the expected king-savior). YHWH calls him by name before Cyrus was born, though "you do not know me." The chapter also contains the most radical theological statement in the Hebrew Bible: "I form light and create darkness; I make well-being and create calamity — I am YHWH, who does all these things." This directly challenges Zoroastrian dualism (good God creates light; evil principle creates darkness) by insisting that YHWH creates both.',
  crossTradition: [
    { label: 'Yasna 30 — Zoroastrian dualism that Isaiah directly refutes',   textId: 'yasna-30',         note: 'Yasna 30\'s two primordial spirits — one who chose truth/light, one who chose lie/darkness — is the Zoroastrian theology that Isaiah 45:7 explicitly counters: "I form light and create darkness; I make well-being and create calamity." Isaiah insists YHWH creates both good and evil, refusing the Persian dualism that Cyrus embodies. The Zoroastrian-Jewish theological dialogue is most intense in this chapter.' },
    { label: 'Cyrus Cylinder — Cyrus as servant of Marduk',                   note: 'The Cyrus Cylinder (539 BCE) records Cyrus claiming Marduk (Babylonian god) commanded him to conquer Babylon and restore its temples. Isaiah 45 records the same king claiming YHWH commanded him. Cyrus himself was almost certainly a Zoroastrian who presented himself as the servant of whatever god was theologically useful in each territory he conquered — making him the first documented case of religious political instrumentalization.' },
    { label: 'Quran — non-believers as instruments of divine will',            textId: 'quran-fatiha-nur', note: 'The Quranic concept of divine hiddenness acting through apparent non-believers (Quran 3:26: "You give power to whom you will") parallels Isaiah\'s "I call you by your name though you do not know me" — divine agency operating through those unaware of its source.' },
    { label: 'Tao Te Ching — the unnamed creative principle acting through all', textId: 'tao-te-ching-1', note: 'Isaiah 45\'s insistence that YHWH acts through Cyrus who doesn\'t know him parallels the Tao\'s action through wu-wei: the Tao accomplishes through those who don\'t consciously serve it. "Though you do not know me, I call you" = the Tao acts through all things without their awareness.' },
  ],
  translations: [
    { id: 'nrsv',   label: 'NRSV 1989 (T1)' },
    { id: 'njps',   label: 'NJPS 1985 (T2)' },
    { id: 'hebrew', label: 'Hebrew (Masoretic)' },
  ],
  sections: [
    {
      heading: 'I. Cyrus Called Before He Knew',
      verses: [
        {
          ref: 'Isaiah 45:1–4',
          text: 'Thus says YHWH to his anointed (mashiah), to Cyrus, whose right hand I have grasped to subdue nations before him: "I will go before you and level the mountains; I will break in pieces the doors of bronze and cut through the bars of iron. For the sake of my servant Jacob, and Israel my chosen, I call you by your name — I name you, though you do not know me."',
          textVersions: {
            nrsv:   'Thus says the LORD to his anointed, to Cyrus, whose right hand I have grasped to subdue nations before him: "I will go before you and level the mountains... I call you by your name, I surname you, though you do not know me."',
            njps:   'Thus said the LORD to Cyrus, His anointed one — whose right hand He has grasped, treading down nations before him: "I will go before you and level the hills... I call you by name, I hail you by title, though you have not known Me."',
            hebrew: 'כֹּה-אָמַר יְהוָה לִמְשִׁיחוֹ לְכוֹרֶשׁ אֲשֶׁר-הֶחֱזַקְתִּי בִימִינוֹ· אֶקְרָא לְךָ בְּשִׁמְךָ אֲכַנְּךָ וְלֹא יְדַעְתָּנִי',
          },
          entities: [
            { word: 'his anointed (mashiah), to Cyrus', node: 'cyrus-the-great', type: 'person',
              note: 'The word mashiah (מְשִׁיחוֹ) — "anointed one" — applied to Cyrus the Persian king is the same word that gives us "Messiah" (Hebrew) and "Christ" (Greek: christos = anointed). This is the only time in the Hebrew Bible that a non-Israelite is given the title mashiah. Cyrus is the "Messiah" of Isaiah 45 — the anointed savior who liberates God\'s people. This is a theological earthquake: the expected divine savior is not from the line of David but is a Persian Zoroastrian emperor.',
              parallels: [
                { label: 'Zoroastrian theology — Cyrus as Ahura Mazda\'s instrument', node: 'ahura-mazda', note: 'The Achaemenid royal inscriptions consistently attribute Persian victories to Ahura Mazda\'s blessing. Cyrus serving YHWH\'s purposes while himself serving Ahura Mazda\'s is not contradictory to him — it is the same divine will operating through different names. Isaiah 45 preserves the memory of this Zoroastrian-Jewish theological convergence.' },
                { label: 'Cyrus Cylinder — "Marduk called Cyrus by name"', note: 'The Cyrus Cylinder (539 BCE): "Marduk... called the name of Cyrus, king of Anshan, and proclaimed him ruler of the whole world." Isaiah 45\'s "I call you by your name" and the Cyrus Cylinder\'s "Marduk called the name of Cyrus" are the same formula — two different gods claiming the same historical event.' },
              ]
            },
            { word: 'though you do not know me', node: 'apophatic-mysticism', type: 'concept',
              note: 'YHWH acting through Cyrus who does not know YHWH is one of the boldest theological claims in the Hebrew Bible: the divine does not require acknowledgment or worship to act through a person or an event. This is the prophetic form of the same universalism that the Hymn to the Aten encodes ("you made all peoples") and that the Tao Te Ching encodes through wu-wei: the ultimate principle operates through everything, including those unaware of it.',
              parallels: [
                { label: 'Tao Te Ching — the Tao acts through all without being known', textId: 'tao-te-ching-1', note: 'Tao 1: the Tao that cannot be named acts through all things. Isaiah\'s "I call you though you do not know me" and the Tao\'s action through wu-wei are the same theological claim: the ultimate divine principle operates through all things regardless of whether they acknowledge it.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. The Creator of Light AND Darkness',
      verses: [
        {
          ref: 'Isaiah 45:5–7',
          text: '"I am YHWH, and there is no other; besides me there is no god. I will arm you, though you do not know me, so that they may know, from the rising of the sun and from the west, that there is no one besides me. I form light and create darkness; I make well-being and create calamity — I am YHWH, who does all these things."',
          textVersions: {
            nrsv:   '"I am the LORD, and there is no other; besides me there is no god... I form light and create darkness; I make well-being and create woe; I am the LORD, who do all these things."',
            njps:   '"I am the LORD and there is none else; beside Me, there is no god... I form light and create darkness, I make peace and create evil — I the LORD do all these things."',
            hebrew: 'אֲנִי יְהוָה וְאֵין עוֹד זוּלָתִי אֵין אֱלֹהִים· יוֹצֵר אוֹר וּבוֹרֵא חֹשֶׁךְ עֹשֶׂה שָׁלוֹם וּבוֹרֵא רָע אֲנִי יְהוָה עֹשֶׂה כָל-אֵלֶּה',
          },
          entities: [
            { word: 'I form light and create darkness', node: 'primordial-darkness', type: 'concept',
              note: 'This is the most anti-dualistic statement in the entire Hebrew Bible — and it is almost certainly a direct theological polemic against Zoroastrian dualism. In Zoroastrianism (Yasna 30), Spenta Mainyu (Holy Spirit) created light/good and Angra Mainyu (Destructive Spirit) created darkness/evil as separate divine principles. Isaiah 45:7 insists YHWH creates BOTH: light AND darkness, well-being AND calamity. The Hebrew word for "calamity/evil" here is raʿ — the same word used in Genesis 3 for the tree of knowledge of good and evil.',
              parallels: [
                { label: 'Yasna 30 — Spenta Mainyu vs Angra Mainyu as separate creators of light and darkness', textId: 'yasna-30', note: 'Yasna 30.3-4: the two spirits created light and darkness separately, and life and death separately. Isaiah 45:7 is a direct theological counter: YHWH creates both. The Zoroastrian dualism and the Isaianic monotheism are in direct dialogue, almost certainly conscious of each other given the Babylonian exile context.' },
                { label: 'Job 38 — YHWH as the source of all cosmic phenomena', textId: 'job-38', note: 'Job 38\'s YHWH claiming to have made light, darkness, snow, rain, lightning, and all cosmic forces is the same theology as Isaiah 45:7: the single God creates everything, including what seems destructive or evil from a human perspective.' },
              ]
            },
            { word: 'I am YHWH, and there is no other', node: 'tradition-judaism', type: 'concept',
              note: 'The formula "Ani YHWH ve-ein od" ("I am YHWH and there is no other") appears seven times in Isaiah 40-48 (Deutero-Isaiah). It is the fullest monotheistic formula in the Hebrew Bible — not just "YHWH is greatest" (henotheism) but "there is no other god." The theological precision is aimed at both Babylonian polytheism (YHWH is not one god among many) and Zoroastrian dualism (YHWH is not one good principle alongside an evil principle). It is the Hebrew Bible\'s ultimate theological statement.',
              parallels: [
                { label: 'Shahada — "There is no god but Allah"', textId: 'quran-fatiha-nur', note: 'The Islamic Shahada ("Lā ilāha illā llāh") is the direct descendant of Deutero-Isaiah\'s "Ani YHWH ve-ein od." The Islamic formula is the Arabic translation of the Hebrew formula, transmitted through Jewish-Christian theological tradition.' },
                { label: 'Shema — "YHWH is One"', note: 'Deuteronomy 6:4\'s Shema ("Hear O Israel, YHWH is our God, YHWH is One") and Isaiah 45:5-6\'s "I am YHWH and there is no other" are the two poles of Hebrew monotheism — Deuteronomy stating divine unity, Isaiah stating divine exclusivity.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 30. REVELATION 12 — WOMAN CLOTHED WITH THE SUN ───────────────────────────
SCRIPTURE_TEXTS['revelation-12'] = {
  title: 'Revelation 12 — The Woman Clothed with the Sun',
  shortTitle: 'Revelation 12 — The Woman',
  tradition: 'Christian / Jewish Apocalyptic',
  date: 'c. 90–100 CE (reign of Domitian)',
  intro: 'The most mythologically dense passage in the New Testament — a cosmic drama of a Woman, a Dragon, and a Child that is virtually identical in structure to multiple pre-Christian myths: Isis giving birth to Horus while pursued by Set (Egyptian); Leto giving birth to Apollo while pursued by the Python (Greek); the pregnant goddess in the Canaanite Baal Cycle pursued by the sea-dragon Yam. The Woman is simultaneously the Virgin Mary, Israel, the Church, and the Gnostic Sophia. The Dragon with seven heads is simultaneously Satan, Leviathan, Tiamat, Set, and Python. The Child is Christ, Apollo, and Horus. The text is a palimpsest of four thousand years of divine-birth mythology.',
  crossTradition: [
    { label: 'Isis and Horus — the nearest structural parallel',               note: 'The Egyptian Isis (depicted winged, wearing a solar crown) gives birth to Horus while hunted by Set (the red chaos force). Horus will rule the gods. This is the nearest structural parallel to Revelation 12: cosmic woman + pursuing chaos-dragon + divine child who will rule all nations. The Isis-Horus myth was the dominant religious narrative of the Roman Empire at the time Revelation was written.' },
    { label: 'Leto, Apollo, and the Python — the Greek parallel',             textId: 'orphic-theogony',  note: 'Leto gives birth to Apollo on the floating island of Delos, pursued by the Python sent by Hera. Apollo immediately slays the Python at Delphi. Revelation 12\'s Woman fleeing from the Dragon = Leto fleeing from the Python; the Child who will "rule with an iron scepter" = Apollo who slays the dragon. The Greek myth is one of Revelation 12\'s direct literary sources.' },
    { label: 'Poimandres — Sophia\'s fall producing the material world',        textId: 'poimandres',       note: 'The Gnostic Sophia who falls from the Pleroma (divine fullness) and produces the material world through her fall — and whose child (the Demiurge/Yaldabaoth) pursues and imprisons her — is the Gnostic reading of the same cosmic drama. The Woman = Sophia; the Dragon = Yaldabaoth; the Child = the divine spark/Christ.' },
    { label: 'Yasna 30 — cosmic dualism: divine light pursued by evil force',  textId: 'yasna-30',         note: 'The Zoroastrian cosmic dualism of Spenta Mainyu (divine light/good) vs Angra Mainyu (darkness/evil) pursuing and attacking is the Persian theological version of the same cosmic drama. Revelation 12 is saturated with Zoroastrian dualism: the Woman of light vs the red Dragon of darkness.' },
  ],
  translations: [
    { id: 'nrsv',  label: 'NRSV 1989 (T1)' },
    { id: 'niv',   label: 'NIV 2011 (T2)' },
    { id: 'greek', label: 'Greek (Nestle-Aland 28th ed.)' },
  ],
  sections: [
    {
      heading: 'I. The Woman Clothed with the Sun',
      verses: [
        {
          ref: 'Revelation 12:1–2',
          text: 'A great sign appeared in heaven: a woman clothed with the sun, with the moon under her feet and a crown of twelve stars on her head. She was pregnant and cried out in pain as she was about to give birth.',
          textVersions: {
            nrsv:  'A great portent appeared in heaven: a woman clothed with the sun, with the moon under her feet, and on her head a crown of twelve stars. She was pregnant and was crying out in birth pangs, in the agony of giving birth.',
            niv:   'A great and wondrous sign appeared in heaven: a woman clothed with the sun, with the moon under her feet and a crown of twelve stars on her head. She was pregnant and cried out in pain as she was about to give birth.',
            greek: 'Καὶ σημεῖον μέγα ὤφθη ἐν τῷ οὐρανῷ, γυνὴ περιβεβλημένη τὸν ἥλιον, καὶ ἡ σελήνη ὑποκάτω τῶν ποδῶν αὐτῆς.',
          },
          entities: [
            { word: 'woman clothed with the sun', node: 'isis', type: 'deity',
              note: 'The Woman clothed with the sun, moon under her feet, crown of twelve stars — this is one of the most multi-layered divine feminine images in religious history. She is simultaneously: (1) the Virgin Mary (Catholic tradition); (2) Israel as the mother of the Messiah; (3) the Church; (4) the Gnostic Sophia; (5) the Egyptian Isis (depicted with solar disk and cow horns, nursing Horus); (6) the Greco-Roman goddess Virgo/Demeter/Cybele; (7) the Canaanite Asherah. The twelve stars correspond to the twelve zodiac signs, the twelve tribes of Israel, and the twelve apostles — all at once.',
              parallels: [
                { label: 'Isis — sun-crowned mother of Horus, pursued by Set', note: 'Isis crowned with the solar disk, nursing the infant Horus, while pursued by Set the red chaos force — this is the nearest parallel to Revelation 12\'s Woman. The Isis-Horus iconography was ubiquitous in the Roman Empire at the time Revelation was written, and early Christian images of Mary nursing the infant Jesus are iconographically identical to Isis-Horus nursing images.' },
                { label: 'Asherah — the astral goddess with the crown of stars', node: 'asherah', note: 'The Asherah / Queen of Heaven (Jer 7:18, 44:17-19) worshipped in Jerusalem with star and moon iconography — "the host of heaven" — is the Canaanite background for the Woman\'s stellar crown and lunar base. The Deuteronomistic suppression of Asherah worship and the apocalyptic rehabilitation of the Woman clothed with stars are two poles of the same theological tension.' },
              ]
            },
            { word: 'crown of twelve stars', node: 'tradition-early-christianity', type: 'symbol',
              note: 'The twelve stars simultaneously signify: (1) the twelve zodiac constellations — the Woman as the cosmic sky-goddess whose crown is the zodiac; (2) the twelve tribes of Israel — the Woman as Mother Israel giving birth to the Messiah; (3) the twelve apostles — the Church crowned with its founders. The triple valence is deliberate: Revelation 12 consciously synthesizes Jewish, Greco-Roman astrological, and Christian symbolism into a single image.',
              parallels: [
                { label: 'Zodiac — the Woman as sky-goddess crowned by the stars of heaven', note: 'The twelve zodiac signs as a crown on the cosmic Woman draws on the ancient Near Eastern iconography of sky-goddesses (Nut in Egypt, Inanna/Ishtar in Mesopotamia, Astarte in Canaan) as wearers of stellar crowns. The Woman of Revelation 12 stands at the intersection of Jewish apocalyptic and Greco-Roman astral religion.' },
              ]
            },
          ]
        },
        {
          ref: 'Revelation 12:3–5',
          text: 'Then another sign appeared in heaven: an enormous red dragon with seven heads and ten horns and seven crowns on its heads. Its tail swept a third of the stars out of the sky and flung them to the earth. The dragon stood in front of the woman who was about to give birth, so that it might devour her child the moment he was born. She gave birth to a son, a male child, who will rule all the nations with an iron scepter. And her child was snatched up to God and to his throne.',
          textVersions: {
            nrsv:  'Then another portent appeared in heaven: a great red dragon, with seven heads and ten horns, and seven diadems on his heads. His tail swept down a third of the stars of heaven and threw them to the earth. Then the dragon stood before the woman who was about to bear a child, so that he might devour her child as soon as it was born. And she gave birth to a son, a male child, who is to rule all the nations with a rod of iron. But her child was snatched away and taken to God and to his throne.',
            niv:   'Then another sign appeared in heaven: an enormous red dragon with seven heads and ten horns and seven crowns on its heads. Its tail swept a third of the stars out of the sky and flung them to the earth. The dragon stood in front of the woman who was about to give birth, so that it might devour her child the moment he was born.',
            greek: 'καὶ ἰδοὺ δράκων μέγας πυρρός, ἔχων κεφαλὰς ἑπτὰ καὶ κέρατα δέκα καὶ ἐπὶ τὰς κεφαλὰς αὐτοῦ ἑπτὰ διαδήματα.',
          },
          entities: [
            { word: 'enormous red dragon', node: 'leviathan', type: 'deity',
              note: 'The red dragon with seven heads is simultaneously: (1) Satan/the Devil (v.9 identifies him explicitly); (2) the Hebrew Leviathan (the seven-headed sea-dragon of Canaanite mythology, seen in Job 41, Psalm 74:14, Isaiah 27:1); (3) the Babylonian Tiamat (the sea-chaos monster with multiple heads, slain by Marduk in the Enuma Elish); (4) the Egyptian Set (the red chaos force, enemy of Osiris and Horus); (5) the Greek Typhon/Python (the dragon-serpent defeated by Zeus/Apollo). Seven-headed sea-dragons are one of the most ancient and universal mythological images in the ancient Near East.',
              parallels: [
                { label: 'Leviathan — seven-headed sea-dragon of Canaanite/Hebrew mythology', node: 'leviathan', note: 'The Ugaritic texts describe Lotan (= Hebrew Leviathan) as a seven-headed dragon defeated by Baal. Isaiah 27:1 calls Leviathan "the twisting serpent" and "the dragon in the sea." Revelation 12\'s seven-headed dragon is the Christianized form of this ancient near-Eastern chaos-monster.' },
                { label: 'Tiamat — the chaos-sea defeated at creation', textId: 'enuma-elish-1', note: 'The Enuma Elish\'s Tiamat (the primordial salt-water chaos-dragon defeated by Marduk) is the Babylonian equivalent of Revelation 12\'s Dragon. Both represent the primordial chaos force that divine order must continuously defeat.' },
                { label: 'Set — the red chaos force pursuing Osiris/Horus', note: 'Set is explicitly the red animal in Egyptian iconography (the "red beast"), associated with desert, chaos, and violence — the pursuer of Osiris and Horus. Revelation 12\'s "great red dragon" pursuing the Woman and her Child is structurally Set pursuing Isis and Horus.' },
              ]
            },
            { word: 'rule all the nations with an iron scepter', node: 'tradition-early-christianity', type: 'concept',
              note: 'The Child who "will rule all the nations with an iron scepter" echoes Psalm 2:9 ("you shall break them with a rod of iron"), a royal enthronement psalm that early Christianity applied to Jesus. But it also echoes the Apollonian parallel: Apollo, born of Leto while pursued by the Python, becomes the god of divine order, prophecy, and civilization — ruling through the Oracle at Delphi. The Child-who-rules in Revelation 12 synthesizes the Messianic king (Psalm 2), the cosmic Christ (Colossians 1:16), and the victorious Apollo.',
              parallels: [
                { label: 'Horus — born of Isis while pursued by Set, destined to rule', note: 'Horus born of Isis while Set pursued her, and destined to rule as king of Egypt after defeating Set — the structural parallel to Revelation 12\'s Child born of the Woman while the Dragon pursued, and destined to "rule all nations," is nearly exact.' },
                { label: 'Apollo — born of Leto while Python pursued, defeats chaos and rules', textId: 'orphic-theogony', note: 'Apollo born on Delos while the Python pursued his mother Leto, immediately defeats the Python at Delphi and establishes his oracle of divine order. Revelation 12\'s Child snatched to God\'s throne and the Dragon cast down = Apollo defeating the Python.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. War in Heaven',
      verses: [
        {
          ref: 'Revelation 12:7–9',
          text: 'Then war broke out in heaven. Michael and his angels fought against the dragon, and the dragon and his angels fought back. But he was not strong enough, and they lost their place in heaven. The great dragon was hurled down — that ancient serpent called the Devil and Satan, who leads the whole world astray. He was hurled to the earth, and his angels with him.',
          textVersions: {
            nrsv:  'And war broke out in heaven; Michael and his angels fought against the dragon. The dragon and his angels fought back, but they were defeated, and there was no longer any place for them in heaven. The great dragon was thrown down, that ancient serpent, who is called the Devil and Satan, the deceiver of the whole world.',
            niv:   'Then war broke out in heaven. Michael and his angels fought against the dragon, and the dragon and his angels fought back. But he was not strong enough, and they lost their place in heaven. The great dragon was hurled down — that ancient serpent called the devil, or Satan, who leads the whole world astray.',
            greek: 'Καὶ ἐγένετο πόλεμος ἐν τῷ οὐρανῷ· ὁ Μιχαὴλ καὶ οἱ ἄγγελοι αὐτοῦ τοῦ πολεμῆσαι μετὰ τοῦ δράκοντος.',
          },
          entities: [
            { word: 'war broke out in heaven', node: 'divine-council', type: 'concept',
              note: 'Celestial war as a structural feature of cosmic history appears across traditions: the War in Heaven (Revelation 12) where Michael defeats the Dragon; the Enuma Elish where Marduk defeats Tiamat; the Titanomarchy (Olympians vs Titans) in Hesiod; Indra defeating Vritra in the Rig Veda; the Norse Ragnarok. All encode the same cosmological claim: the present order was established through a primordial combat between divine forces, and that combat continues or will recur.',
              parallels: [
                { label: 'Enuma Elish — Marduk defeats Tiamat to create the cosmos', textId: 'enuma-elish-1', note: 'The Babylonian combat myth (Marduk vs Tiamat) is the same structural event as Revelation 12\'s War in Heaven (Michael vs Dragon). Both establish divine order through the defeat of chaos. The Dragon being "hurled down" to earth = Tiamat\'s body becoming the cosmos.' },
                { label: 'Psalm 82 — the divine council and its warfare', textId: 'psalm-82', note: 'Psalm 82\'s divine assembly where YHWH judges and condemns the other gods to mortality is the juridical version of the same cosmic power-struggle that Revelation 12 narrates as combat. Both texts describe the demotion of lesser divine beings from heavenly status.' },
              ]
            },
            { word: 'that ancient serpent called the Devil and Satan', node: 'leviathan', type: 'concept',
              note: 'The identification of the Dragon with "that ancient serpent" (ho ophis ho archaios) ties Revelation 12 explicitly to Genesis 3\'s serpent in the Garden. The interpretive move — the Garden serpent = the Devil = Satan = the Dragon = Leviathan — is the full Christian cosmological synthesis: the primordial chaos-dragon, the Garden tempter, the cosmic adversary, and the apocalyptic Dragon are all one entity. This identification does not exist in Genesis itself; it is a 2nd-temple Jewish interpretive tradition (Wisdom of Solomon 2:24) that Revelation crystallizes.',
              parallels: [
                { label: 'Genesis 3 — the ancient serpent in the Garden', textId: 'genesis-1', note: 'Genesis 3\'s serpent (nahash) is not identified as Satan in the original text. The identification serpent = Satan = Dragon is a Hellenistic-Jewish interpretive development (Wisdom 2:24: "through the devil\'s envy death entered the world") that Revelation 12 definitively establishes.' },
                { label: 'Yasna 30 — Angra Mainyu as the original adversarial principle', textId: 'yasna-30', note: 'The Zoroastrian Angra Mainyu (the Destructive Spirit who chose the Lie at the beginning) is the direct theological ancestor of Revelation 12\'s Satan — the cosmic adversarial force that opposes divine light. The Zoroastrian dualism, filtered through Second Temple Judaism, produces the New Testament Satan.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 31. HEART SUTRA ──────────────────────────────────────────────────────────
SCRIPTURE_TEXTS['heart-sutra'] = {
  title: 'The Heart Sutra (Prajñāpāramitā Hṛdaya)',
  shortTitle: 'Heart Sutra',
  tradition: 'Mahayana Buddhism',
  date: 'c. 1st–2nd CE (Sanskrit; Chinese translation by Xuanzang 649 CE)',
  intro: 'The most recited text in East Asian Buddhism — 260 Chinese characters that contain the entire Prajnaparamita (Perfection of Wisdom) teaching compressed to its heart. The central equation "form is emptiness; emptiness is form" (rūpaṃ śūnyatā, śūnyatā rūpaṃ) is the most radical non-dual statement in all religious literature: the apparent world (form) and the void (emptiness) are identical. This is not nihilism but the recognition that phenomena have no fixed, independent existence — they arise dependently, and their "emptiness" of inherent existence IS their ability to appear. The parallel to the Tao Te Ching\'s "being and non-being produce each other" and the Hermetic apophatic tradition is structurally exact.',
  crossTradition: [
    { label: 'Tao Te Ching — being and non-being produce each other',      textId: 'tao-te-ching-1',   note: 'Tao 1: "Being and non-being produce each other." The Heart Sutra\'s form=emptiness equation and the Tao Te Ching\'s being/non-being interdependence are the same non-dual insight in different philosophical vocabularies. Both deny that existence and absence are separate categories.' },
    { label: 'CH XI — God as the container of all things and their negation', textId: 'corpus-hermeticum-11', note: 'CH XI\'s "God cannot be named — or all names are names of God" is the Hermetic apophatic parallel to the Heart Sutra\'s śūnyatā: the Hermetic divine transcends all categories just as śūnyatā transcends the category of "emptiness" itself ("emptiness is also empty").' },
    { label: 'Chandogya 6.2 — the subtle essence pervading all',            textId: 'chandogya-621',    note: 'Chandogya\'s tat tvam asi ("that thou art") and the Heart Sutra\'s form=emptiness are cognate non-dual statements: the individual = the universal. In Advaita, Atman = Brahman; in Madhyamaka, form = emptiness. Both dissolve the apparent boundary between the particular and the infinite.' },
    { label: 'Nasadiya Sukta — neither existence nor non-existence',        textId: 'nasadiya-sukta',   note: 'The Vedic "nāsad āsīn no sad āsīt" (neither non-existence existed nor existence) is the cosmogonic form of the same insight: the Heart Sutra\'s śūnyatā is what the Nasadiya Sukta points to when it refuses to affirm either existence or non-existence at the origin.' },
  ],
  translations: [
    { id: 'conze',    label: 'Conze 1958 (T1, classic scholarly)' },
    { id: 'red-pine', label: 'Red Pine 2004 (T2)' },
    { id: 'sanskrit', label: 'Sanskrit (original)' },
  ],
  sections: [
    {
      heading: 'I. The Bodhisattva\'s Insight',
      verses: [
        {
          ref: 'Heart Sutra §1–3',
          text: 'The Bodhisattva Avalokiteśvara, while practicing the deep Perfection of Wisdom, clearly perceived that all five skandhas are empty — and thus crossed beyond all suffering and affliction.\n\nHere, Śāriputra, form is emptiness; emptiness is form. Emptiness is not different from form; form is not different from emptiness. Whatever is form, that is emptiness; whatever is emptiness, that is form.',
          textVersions: {
            conze:    'The holy Lord and Bodhisattva Avalokita, while moving in the deep course of the Wisdom which has gone beyond, looked down from on high: he beheld but five heaps, and he saw that in their own-being they were empty... form is emptiness and the very emptiness is form.',
            'red-pine': 'When the Bodhisattva of Compassion practiced the deep Prajnaparamita, he saw that the five skandhas are empty of self-existence and thus liberated himself from all suffering... form is emptiness, emptiness is form.',
            sanskrit: 'iha Śāriputra rūpaṃ śūnyatā śūnyataiva rūpaṃ· rūpān na pṛthak śūnyatā śūnyatāyā na pṛthag rūpaṃ· yad rūpaṃ sā śūnyatā yā śūnyatā tad rūpam',
          },
          entities: [
            { word: 'form is emptiness; emptiness is form', node: 'tradition-mahayana-buddhism', type: 'concept',
              note: 'The equation rūpaṃ śūnyatā / śūnyataiva rūpaṃ is the most compressed non-dual statement in the Buddhist canon. "Form" (rūpa) = the five skandhas, the apparent material world, all phenomena. "Emptiness" (śūnyatā) = the absence of inherent, independent, fixed existence. They are not two things — form IS empty of fixed self, and that very emptiness IS the mode in which form appears. This is not nihilism (form doesn\'t exist) but the Madhyamaka middle way: form arises dependently, and dependent arising IS emptiness.',
              parallels: [
                { label: 'Tao Te Ching — being and non-being produce each other', textId: 'tao-te-ching-1', note: 'Tao 2: "Being and non-being produce each other; difficult and easy complement each other." The Tao\'s mutual production of being and non-being is the Chinese cosmological form of the same insight as form=emptiness: existence and absence are not opposites but aspects of one process.' },
                { label: 'Chandogya 6.2 — the subtle essence underlying all forms', textId: 'chandogya-621', note: 'The Chandogya salt-in-water: the subtle essence (Atman/Brahman) pervades all forms as their ground. The Heart Sutra\'s emptiness is the Mahayana equivalent: forms are empty of inherent existence because they are fully dependent on conditions — their "emptiness" is their openness to being what they are.' },
              ]
            },
            { word: 'five skandhas are empty', node: 'apophatic-mysticism', type: 'concept',
              note: 'The five skandhas (aggregates) — form, feeling, perception, mental formations, and consciousness — are the Buddhist analysis of what a "person" is. The Heart Sutra\'s declaration that all five are empty (śūnya) dissolves the concept of a fixed self: the "person" is a process, not an entity. This is the Buddhist form of the apophatic move that the Hermetic tradition makes about God: just as God transcends all names and categories, the self transcends the skandhas that compose it.',
              parallels: [
                { label: 'Sefer Yetzirah — the letters before the self', textId: 'sefer-yetzirah', note: 'The Kabbalistic analysis of the self as constituted by the 22 letters and 10 sefirot — constituent elements through which consciousness is organized — parallels the Buddhist five-skandha analysis. Both traditions dissolve the naive concept of a fixed self into its generative components.' },
              ]
            },
          ]
        },
        {
          ref: 'Heart Sutra §4–5',
          text: 'Likewise, Śāriputra, all dharmas are marked with emptiness — they do not appear nor disappear, are not tainted nor pure, do not increase nor decrease. Therefore in emptiness there is no form, no feeling, no perception, no mental formations, no consciousness; no eye, no ear, no nose, no tongue, no body, no mind; no color, no sound, no smell, no taste, no touch, no object of mind.',
          textVersions: {
            conze:    'Here in this emptiness there is no form, nor feeling, nor perception, nor impulse, nor consciousness; no eye, ear, nose, tongue, body, mind; no forms, sounds, smells, tastes, touchables or objects of mind.',
            'red-pine': 'Therefore in emptiness there is no form, sensation, perception, memory, or consciousness; no eye, ear, nose, tongue, body, or mind; no shape, sound, smell, taste, feeling, or thought.',
            sanskrit: 'tasmāc Chāriputra śūnyatāyāṃ na rūpaṃ na vedanā na saṃjñā na saṃskārā na vijñānam· na cakṣur na śrotraṃ na ghrāṇaṃ na jihvā na kāyo na manaḥ',
          },
          entities: [
            { word: 'no eye, no ear, no nose', node: 'apophatic-mysticism', type: 'concept',
              note: 'The systematic negation — "no eye, no ear, no nose, no tongue, no body, no mind" — is the Buddhist apophatic method applied to sense experience. Just as the Hermetic tradition says "God cannot be named" and the Tao says "the Tao that can be told is not the eternal Tao," the Heart Sutra negates every sensory and cognitive category to point toward the emptiness that underlies them. The via negativa (negative way) runs identically through Christian mysticism (Pseudo-Dionysius, Meister Eckhart), Kabbalistic Ein Sof, and Buddhist śūnyatā.',
              parallels: [
                { label: 'CH XI — God cannot be named; all names are names of God', textId: 'corpus-hermeticum-11', note: 'The Hermetic "God cannot be named" and the Heart Sutra\'s "no eye, no ear... no form, no feeling" are parallel apophatic moves: both systematically negate every positive category to point toward a reality that transcends categorization.' },
                { label: 'Job 38 — YHWH negating Job\'s knowledge with cosmic questions', textId: 'job-38', note: 'YHWH\'s "Where were you when I laid the foundations of the earth?" — the systematic negation of Job\'s understanding through impossible questions — is the prophetic-dramatic form of the same apophatic move: stripping away the certainties of ordinary consciousness.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. The Mantra Beyond Understanding',
      verses: [
        {
          ref: 'Heart Sutra §8–9',
          text: 'Therefore know that the Prajnaparamita is the great mantra, the mantra of great knowledge, the unsurpassed mantra, the unequalled mantra, the allayer of all suffering — true, not false. The Prajnaparamita mantra is proclaimed: Gate gate pāragate pārasaṃgate bodhi svāhā. Gone, gone, gone beyond, gone completely beyond — awakening! So be it.',
          textVersions: {
            conze:    '"Gone, Gone, Gone beyond, Gone completely beyond — Enlightenment, Svaha!" This is the Prajnaparamita mantra, the mantra of great knowledge, the supreme mantra, the unequalled mantra, the allayer of all suffering, in truth.',
            'red-pine': 'Gate gate pāragate pārasaṃgate bodhi svāhā. Gone, gone, gone beyond, gone completely beyond — awakened, so be it.',
            sanskrit: 'gate gate pāragate pārasaṃgate bodhi svāhā',
          },
          entities: [
            { word: 'Gate gate pāragate', node: 'tradition-mahayana-buddhism', type: 'symbol',
              note: 'The closing mantra — "gate gate pāragate pārasaṃgate bodhi svāhā" — operates on multiple levels simultaneously: (1) as a description of the bodhisattva\'s path (gone = ordinary being; gone beyond = stream-entrant; gone completely beyond = fully awakened); (2) as a direct invocation of the Perfection of Wisdom; (3) as a sound-form of the śūnyatā teaching itself — the mantra "works" not by conveying meaning but by being beyond meaning, just as emptiness is beyond the category "emptiness." The Sanskrit gate (gone) puns on the Greek agathon (the Good) — a pun Neoplatonists occasionally exploited.',
              parallels: [
                { label: 'CH XIII — "You have been reborn. Sing now"', textId: 'corpus-hermeticum-13', note: 'The Hermetic closing hymn (CH XIII.16-17) and the Heart Sutra\'s closing mantra are both performances of the transformation they describe: CH XIII\'s hymn IS the rebirth; the Heart Sutra\'s mantra IS the going-beyond. Both texts culminate in a utterance that enacts rather than describes.' },
                { label: 'Sefer Yetzirah — the letters as operative reality, not description', textId: 'sefer-yetzirah', note: 'The Kabbalistic letters of the Sefer Yetzirah are not signs pointing to a separate reality — they are the operative structure of reality. The Heart Sutra\'s mantra and the Kabbalistic letter-theory both claim that certain linguistic forms are not about reality but are reality.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 32. DHAMMAPADA — CHAPTER 1 ────────────────────────────────────────────────
SCRIPTURE_TEXTS['dhammapada-1'] = {
  title: 'Dhammapada — Chapter 1: The Twin Verses (Yamakavagga)',
  shortTitle: 'Dhammapada 1',
  tradition: 'Theravada Buddhism / Pali Canon',
  date: 'c. 3rd BCE (Pali; attributed to the Buddha, c. 5th BCE)',
  intro: 'The opening chapter of the Dhammapada — the most widely read text in Theravada Buddhism. The Twin Verses state the foundational Buddhist insight: mind (mano) is the forerunner of all actions. An impure mind creates suffering as the wheel follows the ox; a pure mind creates happiness as a shadow that never leaves. This is not idealism (mind creates matter) but something more precise: the quality of consciousness with which we act determines the quality of experience that follows. The parallel to the Hermetic Nous as creative principle, and to the Yogic citta (mind-stuff) as the medium of karma, is direct.',
  crossTradition: [
    { label: 'Poimandres — Nous as the creative principle preceding all',   textId: 'poimandres',       note: 'The Hermetic Nous (divine Mind) as the first principle, preceding and generating all reality, is the cosmological version of what the Dhammapada states personally: mind is the forerunner of all actions. Hermetic macrocosm (Nous creates the universe) = Buddhist microcosm (mano creates personal experience).' },
    { label: 'Bhagavad Gita — the quality of action determines the fruit',  textId: 'bhagavad-gita-4',  note: 'The Gita\'s karma-yoga teaching — act without attachment to fruit, and the quality of consciousness in action determines its karmic result — parallels the Dhammapada\'s teaching exactly. Both: purity of mind/intention is the determining factor in whether action creates suffering or liberation.' },
    { label: 'Tao Te Ching — wu-wei as the pure mind that creates cleanly',  textId: 'tao-te-ching-1',   note: 'Lao-zi\'s wu-wei (non-action/effortless action) is the Taoist equivalent of the Dhammapada\'s "pure mind" — action that arises from the uncontaminated source without ego-driven motivation, and therefore creates without accumulating karma/reactivity.' },
    { label: 'Gospel of Thomas — the quality of what is within',            textId: 'gospel-of-thomas', note: 'Thomas L.45: "A good person brings forth good from the storehouse; a bad person brings forth evil from the evil storehouse in the heart." The Thomasine storehouse-metaphor for the mind is structurally identical to the Dhammapada\'s ox-wheel image: the quality of the mind IS the quality of what it produces.' },
  ],
  translations: [
    { id: 'buddharakkhita', label: 'Buddharakkhita 1985 (T1)' },
    { id: 'thanissaro',     label: 'Thanissaro Bhikkhu 1997 (T2)' },
    { id: 'pali',           label: 'Pali (original)' },
  ],
  sections: [
    {
      heading: 'I. Mind as the Forerunner',
      verses: [
        {
          ref: 'Dhp 1:1–2',
          text: 'Mind is the forerunner of all actions. All deeds are led by mind, created by mind. If one speaks or acts with a corrupt mind, suffering follows as the wheel follows the hoof of an ox.\n\nMind is the forerunner of all actions. All deeds are led by mind, created by mind. If one speaks or acts with a serene mind, happiness follows like a shadow that never departs.',
          textVersions: {
            buddharakkhita: 'Mind is the forerunner of all actions. All deeds are led by mind, created by mind. If one speaks or acts with a corrupt mind, suffering follows, as the wheel follows the hoof of an ox... If one speaks or acts with a serene mind, happiness follows, as a shadow that never departs.',
            thanissaro:     'Phenomena are preceded by the heart, ruled by the heart, made of the heart. If you speak or act with a corrupted heart, then suffering follows you — as the wheel of the cart, the track of the ox that pulls it... If you speak or act with a calm, bright heart, then happiness follows you, like a shadow that never leaves.',
            pali:           'Manopubbañgamā dhammā manoseṭṭhā manomayā· manasā ce paduṭṭhena bhāsati vā karoti vā tato naṃ dukkhaṃ anveti cakkaṃ va vahato padaṃ',
          },
          entities: [
            { word: 'Mind is the forerunner', node: 'nous-hermetic', type: 'concept',
              note: 'The Pali word mano (mind/heart/intention) as the "forerunner" (pubbaṅgama) of all actions is the Buddhist psychological claim that corresponds to the Hermetic cosmological claim about Nous. In the Hermetic system, Nous precedes and generates the cosmos; in the Dhammapada, mano precedes and generates all personal experience. The Hermetic macrocosm-microcosm principle (as above, so below) connects both claims: the same Mind that creates the universe creates personal reality when it operates through individual consciousness.',
              parallels: [
                { label: 'Poimandres — Nous as the first creative principle', textId: 'poimandres', note: 'CH I opens with Nous appearing to Hermes and declaring itself the first principle of all things. The Dhammapada\'s "mano is the forerunner of all actions" and Poimandres\' "I am Nous, the first God" are the same claim at different scales: the Mind that generates the cosmos also generates personal experience.' },
                { label: 'Bhagavad Gita — consciousness before action', textId: 'bhagavad-gita-4', note: 'The Gita\'s teaching on the quality of consciousness in action (nishkama karma — desireless action) and the Dhammapada\'s teaching on the quality of mind (pure/corrupt) as determining the quality of consequence are the same teaching from adjacent Indian traditions.' },
              ]
            },
            { word: 'shadow that never departs', node: 'tradition-theravada-buddhism', type: 'concept',
              note: 'The shadow-image for happiness following a pure mind is one of the most precise similes in the Pali canon: a shadow cannot be separated from what casts it; it goes where you go; it is always the same shape as you. Happiness arising from a pure mind is not a reward that follows later — it is the immediate, inseparable quality of that very mind. This parallels the Hermetic teaching that gnosis IS the good, not a path TO the good.',
              parallels: [
                { label: 'Gospel of Thomas — the Kingdom is already here', textId: 'gospel-of-thomas', note: 'Thomas L.3: "The Kingdom is inside you and outside you." The Heart Sutra\'s śūnyatā, the Dhammapada\'s happiness-as-shadow, and the Thomasine Kingdom-already-present are all the same claim: the goal is not reached by going somewhere but by being what you already are.' },
              ]
            },
          ]
        },
        {
          ref: 'Dhp 1:21 (Appamāda — heedfulness)',
          text: 'Heedfulness is the path to the deathless. Heedlessness is the path to death. The heedful do not die; the heedless are as if already dead.',
          textVersions: {
            buddharakkhita: 'Heedfulness is the path to the Deathless. Heedlessness is the path to death. The heedful do not die; the heedless are as if already dead.',
            thanissaro:     'Heedfulness: the path to the deathless. Heedlessness: the path to death. The heedful do not die. The heedless are as if already dead.',
            pali:           'Appamādo amatapadaṃ pamādo maccuno padaṃ· appamattā na māyanti ye pamattā yathā matā',
          },
          entities: [
            { word: 'path to the deathless', node: 'apophatic-mysticism', type: 'concept',
              note: 'The "deathless" (amata, from a-mṛta = not-dead, the same root as Sanskrit amṛta and Greek ambrosía/ambrosia — the food of immortality) is the Buddhist name for nirvāṇa: the unconditioned state beyond birth and death. The parallel to the Hermetic "you have not gone dead, you have gone alive" (Pyramid Texts) and the Johannine "whoever believes in me will never die" (John 11:26) is the same claim made in Buddhist philosophical vocabulary: there exists a mode of being untouched by death.',
              parallels: [
                { label: 'Pyramid Texts — "you have not gone dead, you have gone alive"', textId: 'pyramid-texts', note: 'The Pyramid Texts\' royal resurrection proclamation "n mwt.k N, n ʿnḫ.k N" (you have not gone dead, you have gone alive) and the Dhammapada\'s "the heedful do not die" are the same theological claim at different scales: the deathless is available to those who properly orient their consciousness.' },
                { label: 'Gospel of Thomas — whoever finds the meaning will not taste death', textId: 'gospel-of-thomas', note: 'Thomas L.1: "Whoever finds the interpretation of these sayings will not experience death." The Thomasine and Buddhist deathless are the same claim: there is a mode of understanding/heedfulness that is beyond death, available in this life.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 33. PLATO'S TIMAEUS — THE DEMIURGE ───────────────────────────────────────
SCRIPTURE_TEXTS['plato-timaeus'] = {
  title: 'Plato\'s Timaeus — The Demiurge and the World-Soul',
  shortTitle: 'Plato — Timaeus',
  tradition: 'Ancient Greek Philosophy / Platonic',
  date: 'c. 360 BCE',
  intro: 'The most theologically influential philosophical text in Western history — more cited by early Christian theologians than any other pagan text except perhaps Plato\'s Republic. The Timaeus describes the Demiurge (craftsman-god) creating the world by imposing the eternal Forms onto disordered matter, creating the World-Soul, and making time as "a moving image of eternity." The Demiurge then addresses the lesser gods — "Gods of gods, of whom I am the creator..." — in a divine-council scene that directly parallels Psalm 82. The Hermetic Demiurge, the Gnostic Demiurge, and the Kabbalistic Demiurge are all children of this text.',
  crossTradition: [
    { label: 'Poimandres — the Hermetic Demiurge creating through Nous',     textId: 'poimandres',       note: 'The Hermetic Demiurge (CH I: the Craftsman who forms the seven planetary spheres) is a direct elaboration of Plato\'s Timaeus Demiurge. The Hermetic Nous-as-Demiurge, the Gnostic Demiurge-as-fallen-being, and the Neoplatonic Demiurge-as-Nous are all variants of the Platonic original.' },
    { label: 'Genesis 1 — God as craftsman/architect of the cosmos',         textId: 'genesis-1',        note: 'The Platonic Demiurge who "desired all things to be good and nothing to be evil" and imposed order on chaos directly parallels Genesis 1\'s creation-by-decree. Early Christian theologians (Justin Martyr, Origen, Clement) read the Timaeus and Genesis as describing the same event from different perspectives — the Logos of John 1 as the Platonic Logos by which the Demiurge creates.' },
    { label: 'Sefer Yetzirah — 32 paths as the blueprint of creation',       textId: 'sefer-yetzirah',   note: 'The Kabbalistic "32 paths of wisdom" through which God creates the world parallel the Platonic Forms: both are the intelligible blueprint (paradigm) that precedes and determines the structure of the material world.' },
    { label: 'Psalm 82 — the Creator addressing the divine council',        textId: 'psalm-82',         note: 'The Demiurge\'s address to the lesser gods — "Gods of gods, of whom I am the creator and father, those works are indissoluble by my will alone" — is structurally identical to Psalm 82\'s YHWH addressing the divine council. Both scenes: supreme deity + assembly of lesser divine beings + declaration of supreme authority.' },
  ],
  translations: [
    { id: 'jowett',  label: 'Jowett 1892 (T1, public domain)' },
    { id: 'bury',    label: 'Bury 1929 (Loeb, T2)' },
    { id: 'greek',   label: 'Greek (original)' },
  ],
  sections: [
    {
      heading: 'I. Being and Becoming — The Eternal Pattern',
      verses: [
        {
          ref: 'Timaeus 27d–28b',
          text: '"What is that which always is and has no becoming? And what is that which is always becoming and never is? The former is grasped by understanding, which involves a reasoned account. The latter is grasped by opinion, which involves unreasoning sensation. Everything that becomes must of necessity become owing to some cause; for without a cause nothing can come to be."',
          textVersions: {
            jowett:  '"What is that which always is and has no becoming? and what is that which is always becoming and never is? That which is apprehended by intelligence and reason is always in the same state; but that which is conceived by opinion with the help of sensation and without reason, is always in a process of becoming and perishing and never really is."',
            bury:    '"What is that which always IS, having no becoming? And what is that which is always BECOMING but never is? The one is apprehensible by thought with the aid of reasoning, since it is ever uniformly existent; the other is the object of opinion aided by unreasoning sensation."',
            greek:   'τί τὸ ὂν ἀεί, γένεσιν δὲ οὐκ ἔχον, καὶ τί τὸ γιγνόμενον μὲν ἀεί, ὂν δὲ οὐδέποτε;',
          },
          entities: [
            { word: 'always is and has no becoming', node: 'tradition-neoplatonism', type: 'concept',
              note: 'The Platonic distinction between Being (to on aei — that which always is) and Becoming (to gignomenon — that which is always becoming) is the foundational ontological distinction of Greek philosophy and its descendants. Being = the eternal Forms, apprehended by reason; Becoming = the material world, apprehended by sense-opinion. This distinction structures all of Western theology: the Hermetic Nous vs matter, the Augustinian eternal City of God vs temporal City of Man, the Buddhist nirvāṇa (unconditioned) vs saṃsāra (conditioned becoming). All are variants of Timaeus 27d.',
              parallels: [
                { label: 'Heart Sutra — emptiness does not arise or cease', textId: 'heart-sutra', note: 'The Heart Sutra: "In emptiness there is no appearance or disappearance, no increase or decrease." The Platonic eternal Forms that "always are and never become" and the Buddhist śūnyatā that "does not appear nor disappear" are analogous: both designate an unconditioned reality beyond the cycles of arising and ceasing.' },
                { label: 'Tao Te Ching — the eternal Tao vs its changing manifestations', textId: 'tao-te-ching-1', note: 'Tao 1: "The Tao that can be told is not the eternal Tao." The eternal Tao (the unnameable ground) vs its named manifestations (mother of all things) is the Chinese form of the Platonic Being/Becoming distinction.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. The Demiurge and the Good',
      verses: [
        {
          ref: 'Timaeus 29d–30a',
          text: '"Let me tell you then why the Creator made this world of generation. He was good, and the good can never have any jealousy of anything. And being free from jealousy, he desired that all things should be as like himself as they could be. This is the true beginning of creation and of the world, as we shall do well to believe on the testimony of wise men: God desired that all things should be good and nothing bad, so far as this was attainable."',
          textVersions: {
            jowett:  '"Let me tell you then why the creator made this world of generation. He was good, and the good can never have any jealousy of anything. And being free from jealousy, he desired that all things should be as like himself as they could be."',
            bury:    '"He was good, and in one that is good no envy arises ever concerning anything; and being devoid of envy He desired that all should be, so far as possible, like unto Himself."',
            greek:   'ἀγαθὸς ἦν, ἀγαθῷ δὲ οὐδεὶς περὶ οὐδενὸς οὐδέποτε ἐγγίγνεται φθόνος· τούτου δ\' ἐκτὸς ὢν πάντα ὅτι μάλιστα ἐβουλήθη γενέσθαι παραπλήσια ἑαυτῷ.',
          },
          entities: [
            { word: 'God desired that all things should be good', node: 'demiurge-platonic', type: 'deity',
              note: 'The Platonic Demiurge\'s motivation — he is good, and the good cannot be jealous, therefore he desired all things to be good — is one of the most influential theological ideas in history. It solves the problem of evil before it\'s asked: evil exists not because the Creator willed it but because matter resisted the imposition of Form. The Gnostic tradition inverts this exactly: the Demiurge IS the source of evil because he created the imperfect material world in ignorance. Both the Platonic positive Demiurge and the Gnostic negative Demiurge derive from this passage.',
              parallels: [
                { label: 'Isaiah 45 — "I create well-being AND calamity"', textId: 'isaiah-45', note: 'Isaiah 45:7\'s claim that YHWH creates BOTH good and evil is a direct counter to the Platonic Demiurge\'s motivation (he only wanted good). The Isaianic monotheism refuses the Platonic escape clause: there is no uncreated matter to blame for evil; YHWH created everything including calamity.' },
                { label: 'Coffin Text 1130 — "I did not command evil; their hearts transgressed"', textId: 'coffin-text-1130', note: 'The Egyptian Creator\'s exculpation ("I did not command evil") and the Platonic Demiurge\'s good nature both protect the Creator from responsibility for evil by pointing to created free agents (matter / human hearts) as the source. Both are the same theodicy from different cosmological frameworks.' },
              ]
            },
          ]
        },
        {
          ref: 'Timaeus 37c–d',
          text: '"When the father and creator saw the creature which he had made moving and living, the created image of the eternal gods, he rejoiced, and in his joy determined to make the copy still more like the original; and as this was eternal, he sought to make the universe eternal, so far as might be. Now the nature of the ideal being was everlasting, but to bestow this attribute in its fullness upon a creature was impossible. Wherefore he resolved to have a moving image of eternity, and when he set in order the heaven, he made this image eternal but moving according to number, while eternity itself rests in unity; and this image we call time."',
          textVersions: {
            jowett:  '"When the father creator saw the creature which he had made moving and living, the created image of the eternal gods, he rejoiced... he sought to make the universe eternal, so far as might be... he resolved to have a moving image of eternity, and when he set in order the heaven, he made this image eternal but moving according to number, while eternity itself rests in unity; and this image we call Time."',
            bury:    '"When the Father that engendered it perceived it in motion and alive, a thing of joy to the eternal gods, He too rejoiced; and being well-pleased He designed to make it resemble its Model still more closely. Accordingly, seeing that the Model is an eternal Living Creature, He set about making this All likewise eternal, so far as was possible."',
            greek:   'εἰκὼ δ\' ἐπενόει κινητόν τινα αἰῶνος ποιῆσαι, καὶ διακοσμῶν ἅμα οὐρανὸν ποιεῖ μένοντος αἰῶνος ἐν ἑνὶ κατ\' ἀριθμὸν ἰοῦσαν αἰώνιον εἰκόνα, τοῦτον ὃν δὴ χρόνον ὠνομάκαμεν.',
          },
          entities: [
            { word: 'moving image of eternity', node: 'tradition-neoplatonism', type: 'concept',
              note: '"Time is the moving image of eternity" (χρόνος εἰκὼν αἰῶνος) is perhaps the single most influential phrase in the Timaeus — cited by Plotinus, Augustine, Aquinas, Kant, and countless others. Time is not the opposite of eternity but its image: the temporal world is what eternity looks like when projected through the mirror of material existence. The Neoplatonic doctrine of emanation develops this: reality cascades from the eternal One through Nous, through Soul, into Time and Matter — each level a dimmer image of the level above.',
              parallels: [
                { label: 'CH XI — "become eternity; then you will understand God"', textId: 'corpus-hermeticum-11', note: 'CH XI\'s instruction to "rise above all time, become eternity" is the Hermetic practice for reversing the Timaeus\'s movement: if time is eternity\'s image, to transcend time is to recover direct access to eternity. CH XI\'s mystical practice IS the reversal of Timaeus\'s cosmological process.' },
                { label: 'Pyramid Texts — the king joining the imperishable stars', textId: 'pyramid-texts', note: 'The Pyramid Texts\' king ascending to the "imperishable stars" (the circumpolar stars that never set = eternal, not subject to time) is the Egyptian theological form of the same aspiration: to escape the moving image (time/temporal stars) and join the eternal (the imperishable).' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'III. The Address to the Lesser Gods',
      verses: [
        {
          ref: 'Timaeus 41a–b',
          text: '"Gods of gods, of whom I am the creator and father, those works are indissoluble which I have made, though they might be dissolved by my will. But it is not my will that what is well-joined should be dissolved. Hear then my word: since you are creatures of time, you are not altogether immortal and indissoluble, but you shall certainly not be dissolved, nor shall any fate of death destroy you or prevail over you, since you have in my will a greater and mightier bond than those with which you were bound at your birth."',
          textVersions: {
            jowett:  '"Gods of gods, whose creator and father I am, whatever has been created by me is indissoluble, for my will is greater than the bond of union. Yet, although you are not immortal and indissoluble, you shall certainly not be dissolved, nor shall any fate of death prevail over you."',
            bury:    '"O Gods, of Gods whereof I am the Craftsman and Father, those works that are created by me are indissoluble save with my consent. For though all that is bound may be loosed, yet to will to loose that which is fairly joined and in good case were the deed of a wicked one."',
            greek:   'Θεοὶ θεῶν, ὧν ἐγὼ δημιουργὸς πατήρ τε ἔργων, ἃ δι\' ἐμοῦ γενόμενα ἄλυτα ἐμοῦ γε ἐθέλοντος.',
          },
          entities: [
            { word: 'Gods of gods, of whom I am the creator and father', node: 'demiurge-platonic', type: 'concept',
              note: 'The Demiurge\'s address "Theoi theon" (Gods of gods) opening a divine-council speech to the lesser created gods is structurally identical to Psalm 82\'s "God stands in the divine assembly; among the gods he pronounces judgment." Both scenes: supreme deity addresses a council of lesser divine beings, asserting supreme creative authority over them. The Platonic and Hebrew divine-council scenes are cognate mythological structures, almost certainly sharing a common Canaanite-Mesopotamian template.',
              parallels: [
                { label: 'Psalm 82 — "God stands in the divine assembly"', textId: 'psalm-82', note: 'Psalm 82:1-2: "God stands in the divine assembly; among the gods he pronounces judgment." The Timaeus\'s Demiurge addressing the council of created gods ("Gods of gods, of whom I am the creator") and Psalm 82\'s YHWH addressing the divine council are structurally identical scenes — the supreme deity asserting authority over lesser divine beings.' },
                { label: 'Enuma Elish — Marduk addresses the assembly of gods', textId: 'enuma-elish-1', note: 'The Babylonian divine assembly that grants Marduk kingship, and the Demiurge\'s assertion "those works which I have made are indissoluble by my will," are the same divine-council authority structure from Greek philosophical and Babylonian mythological perspectives.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 34. EPIC OF GILGAMESH ─────────────────────────────────────────────────────
SCRIPTURE_TEXTS['gilgamesh'] = {
  title: 'Epic of Gilgamesh — The Flood and the Search for Immortality',
  shortTitle: 'Gilgamesh',
  tradition: 'Ancient Mesopotamian',
  date: 'c. 2100 BCE (Sumerian sources); Standard Version c. 1300–1000 BCE (Old Babylonian)',
  intro: 'The oldest surviving epic in human literature — and the oldest sustained investigation of the questions that define all later religious thought: What does it mean to be mortal? Can immortality be achieved? What is the right response to death? The Standard Babylonian version on twelve clay tablets contains: the civilizing of the wild man Enkidu; Gilgamesh\'s terror at death after Enkidu dies; the flood narrative (Tablet XI) that is the direct source for Genesis 6-9; Siduri the tavern-keeper\'s Epicurean advice; and Utnapishtim\'s story of surviving the flood and receiving immortality. The flood narrative is the most documented cross-tradition parallel in all of comparative religion.',
  crossTradition: [
    { label: 'Genesis 6–9 — Noah\'s Flood as the direct literary parallel',  textId: 'genesis-1',        note: 'The structural parallels between Gilgamesh Tablet XI and Genesis 6-9 are so close (divine decision to flood; one man warned by a god; boat with dimensions specified; sending birds to test receding waters; sacrifice after landing; divine promise) that literary dependence is certain. The Gilgamesh flood narrative predates Genesis by at least 600 years. The Atrahasis Epic (c. 1700 BCE) is the probable common source for both.' },
    { label: 'Descent of Inanna — the underworld and what lies beyond death', textId: 'descent-inanna',   note: 'Inanna\'s descent into the Great Below and Gilgamesh\'s quest to escape death are the two poles of the same Mesopotamian death-theology: one enters death willingly and returns transformed; the other flees death and eventually accepts it. Both texts emerge from the same Sumerian theological context.' },
    { label: 'Poimandres — the quest to escape mortality through divine knowledge', textId: 'poimandres', note: 'Gilgamesh\'s quest for the plant of immortality at the bottom of the ocean parallels the Hermetic quest to escape mortality through Nous. Both fail at the literal level (Gilgamesh loses the plant; the soul must re-enter the cycle without Nous) and succeed at the symbolic level: the real immortality is the gnosis/understanding, not the object.' },
    { label: 'Tao Te Ching — acceptance of mortality as the gate to the eternal', textId: 'tao-te-ching-1', note: 'Siduri the tavern-keeper\'s advice — "when the gods created mankind, they allotted death to mankind; enjoy your life, cherish your wife, hold your child" — is the Epicurean-Taoist position: acceptance of natural limits as the condition for a fully human life. The Tao Te Ching\'s return to the root (returning to the uncarved block, accepting the way of things) is the Chinese philosophical version of Siduri\'s wisdom.' },
  ],
  translations: [
    { id: 'george',    label: 'George 2003 (T1, Penguin Classics)' },
    { id: 'sandars',   label: 'Sandars 1960 (T2, Penguin Classics)' },
    { id: 'akkadian',  label: 'Akkadian (cuneiform original)' },
  ],
  sections: [
    {
      heading: 'I. Siduri\'s Advice — Accept Mortality',
      verses: [
        {
          ref: 'Tablet X, Col. iii (Old Babylonian Meissner fragment)',
          text: '"When the gods created mankind, they allotted death to mankind, but life they retained in their own keeping. As for you, Gilgamesh, let your belly be full, make merry day and night; of each day make a feast of rejoicing. Day and night dance and play. Let your garments be sparkling fresh, your head be washed, bathe in water. Pay heed to the little one who holds your hand; let your spouse delight in your embrace — these alone are the concern of mankind."',
          textVersions: {
            george:  '"When the gods created mankind, they allotted death to mankind, but life they retained in their keeping. As for you, Gilgamesh, let your belly be full, make merry day and night! Of each day make a feast of rejoicing, dance and play day and night! Let your garments be sparkling fresh, your head be washed, bathe in water, pay heed to the child who holds your hand, let your wife delight in your embrace — these things alone are the concern of mankind!"',
            sandars: '"When the gods created man they allotted death to man, but life they retained in their keeping. As for you, Gilgamesh, fill your belly with good things; day and night, night and day, dance and be merry, feast and rejoice. Let your clothes be fresh, bathe yourself in water, cherish the little child that holds your hand, let your wife delight in your embrace; for this too is the lot of man."',
            akkadian: 'inūma ilū ibnū awīlam / nīšam īpušū ana awīlim / balāṭam ina qātīšunu iṣṣabtū',
          },
          entities: [
            { word: 'gods created mankind, they allotted death', node: 'dying-rising-god', type: 'concept',
              note: 'Siduri\'s speech is the oldest surviving statement of the Epicurean position — and remarkably, it is addressed to a king fleeing death in terror. The tavern-keeper at the edge of the waters of death tells the greatest king in the world: "the gods kept life for themselves; accept mortality and live fully." This is the most honest confrontation with human mortality in ancient literature, written at least 1,200 years before Epicurus. The parallel to Qohelet (Ecclesiastes) is exact: "Go, eat your food with gladness, and drink your wine with a joyful heart... Enjoy life with your wife, whom you love" (Eccl 9:7-9) — almost certainly influenced by this passage through the Wisdom tradition.',
              parallels: [
                { label: 'Ecclesiastes 9:7-9 — eat, drink, enjoy your wife', note: 'The structural and verbal parallel between Siduri\'s speech and Ecclesiastes 9:7-9 ("Go, eat your food with gladness... enjoy life with your wife") is one of the most documented examples of Mesopotamian Wisdom tradition influencing the Hebrew Bible. Qohelet is Siduri\'s philosophy reframed in Hebrew theological vocabulary.' },
                { label: 'Tao Te Ching — accepting the way of things', textId: 'tao-te-ching-1', note: 'Siduri\'s acceptance of mortality as the proper human condition and the Tao Te Ching\'s return-to-the-root (accepting natural process) are the same philosophical position: resistance to the Way (death, change, limitation) produces suffering; acceptance produces peace.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. The Flood — Tablet XI',
      verses: [
        {
          ref: 'Tablet XI, ll. 11–31 (Utnapishtim\'s Flood Story)',
          text: '"Utnapishtim spoke to me, saying: I will reveal to you, Gilgamesh, a secret matter, and a mystery of the gods I will tell you. The city of Shuruppak, a city which you yourself know, situated on the banks of the Euphrates — that city was old, and the gods within it decided to send the Flood. Their father Anu, valiant Enlil, their chamberlain Ninurta, and their canal-officer Ennugi — Ea swore with them to secrecy. But Ea repeated their words to a reed fence: \'Reed fence, reed fence! Brick wall, brick wall! Hear, O reed fence! Understand, O brick wall! The man of Shuruppak, son of Ubar-Tutu — tear down your house, build a boat!\'",',
          textVersions: {
            george:  '"Utnapishtim spoke to Gilgamesh, saying: I will disclose to you a thing that is hidden, Gilgamesh, a secret of the gods I will tell you. Shuruppak, a city which you surely know, situated on the banks of the Euphrates — that city was old and its gods within it... Enlil their hero decided the Flood should be sent. Ea their prince swore to silence. But Ea repeated their words to a reed hut: \'Reed hut, reed hut! Brick wall, brick wall! Reed hut, listen! Brick wall, pay attention!...\'"',
            sandars: '"Utnapishtim said, \'Gilgamesh, I will reveal a mystery, I will tell you a secret of the gods. Shuruppak... the gods decided to send the Flood... through the wall of a reed hut I heard Ea say: \'Man of Shuruppak, son of Ubara-Tutu; tear down your house and build a boat.\'"',
            akkadian: 'attī Gilgāmeš niṣirta lūpuš / pirišti ilī lūqbika / Šuruppak ālu ša tīdū / ša ina aḫ Puratti šakin',
          },
          entities: [
            { word: 'decided to send the Flood', node: 'utnapishtim', type: 'person',
              note: 'The divine council\'s decision to send the Flood — and Ea\'s whispered warning through a reed wall — is the Mesopotamian original of Genesis 6-9\'s flood narrative. The structural parallels are exact: (1) divine decision to destroy humanity; (2) one man warned by a sympathetic deity (Ea/Enki = YHWH as mediated by the angel, or YHWH directly); (3) boat with specific dimensions; (4) all creatures brought aboard; (5) flood lasts specific days; (6) birds sent to test the waters (dove and raven both in both versions); (7) landing on a mountain; (8) sacrifice offered; (9) divine covenant / divine promise not to flood again. The Gilgamesh flood narrative predates Genesis by 600+ years.',
              parallels: [
                { label: 'Genesis 6-9 — Noah\'s Flood as the Hebrew version', textId: 'genesis-1', note: 'Every structural element of the Genesis flood narrative (divine decision, righteous man warned, boat, animals, birds sent out, mountain landing, sacrifice, covenant) appears first in the Gilgamesh flood narrative. The Atrahasis Epic (c. 1700 BCE) is the probable common ancestor of both. The Biblical flood is the Mesopotamian flood retold in a monotheistic theological frame.' },
                { label: 'Descent of Inanna — the divine sending death/chaos into the world', textId: 'descent-inanna', note: 'Both the Gilgamesh Flood and the Descent of Inanna feature the divine assembly making a cosmic decision that sends death into the world. In both texts, the divine decision is not fully explained — the gods act with partial wisdom, creating suffering. This is the Mesopotamian theology of divine-human tragedy.' },
              ]
            },
            { word: 'reed fence, reed fence', node: 'inanna', type: 'concept',
              note: 'Ea\'s whispered warning through a reed wall — not directly to Utnapishtim but to the wall he can overhear — is one of the oldest documented examples of divine revelation operating through indirection: the god cannot violate his oath of silence to his fellow gods, so he speaks "to the wall." This is the Mesopotamian version of the same indirection that appears in oracular religion, dreams, prophecy, and the Hermetic tradition\'s claim that gnosis is "not taught but called to mind" — the divine communicates obliquely, maintaining the structure of secrecy while making the message available.',
              parallels: [
                { label: 'CH XIII — the secret doctrine whispered to Tat on the mountain', textId: 'corpus-hermeticum-13', note: 'The Hermetic "secret sermon on the mountain of silence" (CH XIII) — a private teaching that cannot be taught publicly — and Ea\'s whispered warning through a reed wall are both the same structure: divine knowledge transmitted secretly, maintaining the form of secrecy while making the content available to the one who can hear.' },
              ]
            },
          ]
        },
        {
          ref: 'Tablet XI, ll. 140–158 (The Birds)',
          text: '"When the seventh day arrived, I sent out a dove and released it. The dove went off, but came back to me; no perch was visible to it, and it turned around. Then I sent out a swallow and released it. The swallow went off, but came back to me; no perch was visible to it, and it turned around. Then I sent out a raven and released it. The raven went off, and saw the waters receding, and ate, and preened, and did not turn around. Then I let out all to the four winds; I offered a sacrifice, I poured out a libation on the peak of the mountain."',
          textVersions: {
            george:  '"When the seventh day arrived, I sent out a dove to reconnoitre. The dove went, then came back, no landing-place was visible to it, and it turned back. I sent out a swallow to reconnoitre. The swallow went, then came back, no landing-place was visible to it, and it turned back. I sent out a raven to reconnoitre. The raven went, and saw the receding of the waters; it ate, it preened, it did not turn back."',
            sandars: '"On the seventh day I sent out a dove, it flew away but finding no resting-place it returned. Then I sent a swallow, it flew away but finding no resting-place it returned. I sent a raven, it saw that the waters had retreated, it ate, it flew about, it cawed and it did not come back."',
            akkadian: 'ina ûm šebî ašpuram summatam / summu illik ittallak / lā iṣṣa / itūr / ašpuram sisinnam',
          },
          entities: [
            { word: 'dove went off, but came back', node: 'noah', type: 'symbol',
              note: 'The sequence dove → swallow → raven, with the raven finally not returning, appears in both Gilgamesh Tablet XI and Genesis 8. In Genesis, the order is raven first (8:7), then dove twice (8:8-12), with the olive branch in the second dove mission. The variation in order between the two accounts suggests both are drawing on a common Mesopotamian flood-narrative tradition rather than one directly copying the other. The dove with olive branch that does not appear in Gilgamesh but does in Genesis may be a Hebrew theological addition (olive = peace, covenant with God).',
              parallels: [
                { label: 'Genesis 8:7-12 — the raven and the dove after Noah\'s flood', textId: 'genesis-1', note: 'Genesis 8:7: "Then he sent out a raven; it kept flying back and forth until the water dried up." Genesis 8:8: "Then he sent out a dove... the dove could find no place to set its feet... and returned." The bird-sending sequence in both Gilgamesh and Genesis is the most structurally specific parallel — it identifies a single ancestral flood narrative from which both derive.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 35. RIG VEDA 10.90 — PURUSHA SUKTA ───────────────────────────────────────
SCRIPTURE_TEXTS['purusha-sukta'] = {
  title: 'Rig Veda 10.90 — The Purusha Sukta (Hymn of the Cosmic Person)',
  shortTitle: 'Purusha Sukta',
  tradition: 'Vedic / Hindu',
  date: 'c. 1200–900 BCE (late Rig Veda)',
  intro: 'The hymn of the Cosmic Person (Purusha) whose voluntary sacrifice by the gods creates the entire universe. His mind becomes the moon, his eye the sun, his mouth Indra and fire, his breath the wind, his navel the atmosphere, his head the sky, his feet the earth. The four social orders emerge from his body. Three-quarters of Purusha is immortal in heaven; one-quarter became this entire world. The Purusha Sukta is the theological origin of the sacrifice-as-cosmic-maintenance doctrine that structures all later Vedic and Hindu religion — and it shares its deep structure with the Egyptian Osiris dismemberment, the Norse Ymir, the Orphic Zagreus, and the Kabbalistic Adam Kadmon: the cosmos is made from the body of a primordial divine being.',
  crossTradition: [
    { label: 'Völuspá — Ymir\'s body becomes the world',               textId: 'voluspa',          note: 'The Norse Ymir whose flesh becomes earth, blood becomes sea, bones become mountains, skull becomes the dome of heaven is structurally identical to the Purusha Sukta\'s Purusha whose body becomes all elements of the cosmos. Independent parallel from Norse and Vedic traditions — probably both preserving an even older Proto-Indo-European cosmogonic myth of the divine body as world-material.' },
    { label: 'Orphic Theogony — Zagreus dismembered, body scattered',  textId: 'orphic-theogony',  note: 'The Orphic Zagreus torn apart by the Titans, his divine substance scattered through matter — and the Purusha Sukta\'s cosmic Person dismembered by the gods to create the world — are the same deep myth: the cosmos is made from the body of a sacrificed divine being. The Orphic and Vedic traditions are both descended from Proto-Indo-European mythology.' },
    { label: 'Poimandres — the Anthropos descending and dispersing',   textId: 'poimandres',       note: 'The Hermetic divine Anthropos descending into matter and becoming dispersed through the seven planetary spheres echoes the Purusha Sukta\'s Purusha: in both, the cosmic divine Person\'s "body" is distributed through the structure of the world. The Hermetic myth may preserve Vedic influence through the Persian-Mesopotamian-Alexandrian transmission chain.' },
    { label: 'Sefer Yetzirah — Adam Kadmon, the cosmic primordial human', textId: 'sefer-yetzirah', note: 'The Kabbalistic Adam Kadmon (Primordial Adam) — the cosmic divine human whose body is the template for the created world, whose eyes are the sun and moon — is the Jewish mystical equivalent of the Purusha Sukta\'s Purusha. Both describe a primordial divine human figure whose body IS the cosmos.' },
  ],
  translations: [
    { id: 'doniger',  label: 'Doniger 1981 (T1, The Rig Veda, Penguin)' },
    { id: 'griffith', label: 'Griffith 1896 (T2, public domain)' },
    { id: 'sanskrit', label: 'Sanskrit (original)' },
  ],
  sections: [
    {
      heading: 'I. The Cosmic Person',
      verses: [
        {
          ref: 'RV 10.90.1–4',
          text: 'The Purusha has a thousand heads, a thousand eyes, a thousand feet. He pervades the earth on all sides and extends beyond it by ten fingers. The Purusha alone is all this — whatever has been and whatever is to be. He is the lord of immortality, and also of whatever grows by food. Such is his greatness, and the Purusha is beyond this. All creatures are one-quarter of him; three-quarters are what is immortal in heaven.',
          textVersions: {
            doniger:  'The Man has a thousand heads, a thousand eyes, a thousand feet. He pervaded the earth on all sides and extended beyond it as far as ten fingers... The Man is this all, what has been and what is to be, the lord of the immortal sphere that grows beyond food.',
            griffith: 'A thousand heads hath Purusha, a thousand eyes, a thousand feet. On every side pervading earth he fills a space ten fingers wide. This Purusha is all that yet hath been and all that is to be; the Lord of Immortality which waxes greater still by food.',
            sanskrit: 'sahasraśīrṣā puruṣaḥ sahasrākṣaḥ sahasrapāt· sa bhūmiṃ viśvato vṛtvā atyatiṣṭhad daśāṅgulam',
          },
          entities: [
            { word: 'thousand heads, a thousand eyes, a thousand feet', node: 'purusha', type: 'deity',
              note: 'The Purusha\'s thousand-fold multiplicity — "a thousand heads, a thousand eyes, a thousand feet" — describes not a literal being but the cosmic scope of the divine Person: he is simultaneously present at every point of perception, every place of standing. This is the Vedic form of the Hermetic "Nous containing all space" (CH XI) and the Buddhist "mind is the forerunner of all" (Dhammapada) — the same claim that the cosmic principle of consciousness pervades all reality.',
              parallels: [
                { label: 'CH XI — "expand to immeasurable size... you are everywhere at once"', textId: 'corpus-hermeticum-11', note: 'CH XI\'s instruction to expand consciousness to the scale of the cosmos until "you are everywhere at once" is a practice for achieving what the Purusha Sukta describes as the cosmic condition of the Purusha: omnipresence, awareness at every point of the universe simultaneously.' },
                { label: 'Coffin Text 1130 — the Creator pervading all creation', textId: 'coffin-text-1130', note: 'The Egyptian Creator of CT 1130 who made the four winds, the flood, and every man — present through all creation — is the Egyptian equivalent of the Purusha who "pervades the earth on all sides." Both are descriptions of divine omnipresence as the ground of creation.' },
              ]
            },
            { word: 'three-quarters are what is immortal in heaven', node: 'tradition-hinduism', type: 'concept',
              note: 'The three-quarters/one-quarter division — "all creatures are one-quarter of him; three-quarters are immortal in heaven" — establishes the fundamental Vedic ontology: the material world is not the whole of reality but only a fraction (one-quarter) of the divine. Three-quarters of Being is transcendent, invisible, and immortal. This is the Vedic form of Plato\'s Being/Becoming distinction (Timaeus 27d): the eternal (three-quarters) vs the temporal material world (one-quarter).',
              parallels: [
                { label: 'Plato Timaeus — Being vs Becoming', textId: 'plato-timaeus', note: 'Timaeus 27d\'s eternal Being vs temporal Becoming and the Purusha Sukta\'s three-quarters immortal vs one-quarter material are the same ontological claim: what truly exists (the eternal divine) vastly exceeds what appears in the material world.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. The Cosmic Sacrifice',
      verses: [
        {
          ref: 'RV 10.90.6–8',
          text: 'When the gods spread the sacrifice with the Purusha as the offering, spring was the clarified butter, summer the fuel, and autumn the oblation. They anointed the Purusha, the sacrifice born at the beginning, on the sacred grass. With him the gods sacrificed, and the Sādhyas and the sages. From that sacrifice in which everything was offered, the melted fat was collected, and he made it into those beasts who live in the air, in the forest, and in villages.',
          textVersions: {
            doniger:  'When the gods spread the sacrifice with the Man as the offering, spring was the melted butter, summer the fuel, autumn the oblation... When they divided the Man, into how many parts did they apportion him? What do they call his mouth, his two arms and thighs and feet?',
            griffith: 'When Gods prepared the sacrifice with Purusha as their offering, its oil was spring, the holy gift was autumn; summer was the wood. From that great general sacrifice the dripping fat was gathered up. He formed the creatures of the air, and animals both wild and tame.',
            sanskrit: 'tam yajñaṃ barhiṣi praukṣan puruṣaṃ jātam agratah· tena devā ayajanta sādhyā ṛṣayaś ca ye',
          },
          entities: [
            { word: 'the gods spread the sacrifice with the Purusha as the offering', node: 'dying-rising-god', type: 'concept',
              note: 'The sacrifice of the Cosmic Person as the first and paradigmatic sacrifice is the Vedic theological origin of the sacrifice-as-world-maintenance doctrine. By sacrificing Purusha, the gods created the world; by repeating the sacrifice in the yajna (fire sacrifice), humans maintain and renew the world. The sacrificed divine body that becomes the world is the deepest structural parallel between: the Purusha Sukta (Vedic), the Osiris dismemberment (Egyptian), the Zagreus-Titans myth (Orphic), the Norse Ymir, and ultimately the Christian Eucharist (the body of Christ as the sacrificial food that sustains the community). All are the same myth.',
              parallels: [
                { label: 'Orphic Theogony — Zagreus torn apart by Titans, body in matter', textId: 'orphic-theogony', note: 'The Orphic Zagreus torn apart by the Titans and his divine substance scattered through Titanic clay — and the Purusha Sukta\'s Purusha sacrificed by the gods to create all beings — are structurally identical. Both: divine cosmic being + sacrificial dismemberment + body becoming the material of the world. Proto-Indo-European shared origin.' },
                { label: 'Christian Eucharist — "this is my body, given for you"', note: 'The Christian Eucharist theology — Christ\'s body broken and blood poured out as the sacrifice that creates/sustains the community of believers — preserves the same mythological structure as the Purusha Sukta: a divine cosmic Person voluntarily sacrificed, whose body becomes the nourishing substance of creation. The Purusha Sukta may be the oldest surviving version of this myth.' },
              ]
            },
          ]
        },
        {
          ref: 'RV 10.90.13–16',
          text: 'His mouth became the Brahmin; his two arms were made into the Warrior-Noble; his two thighs were the People; from his two feet the Servant was born. The moon was born from his mind; from his eye the sun was born. Indra and Agni came from his mouth; from his vital breath the Wind was born. From his navel the middle atmosphere sprang; the sky sprouted from his head; the earth from his feet, the four quarters from his ear. Thus they fashioned the worlds.',
          textVersions: {
            doniger:  'His mouth became the Brahmin; his arms were made into the Warrior-Prince, his thighs the People, and from his feet the Servants were born. The moon was born from his mind; from his eye the sun was born; Indra and Agni came from his mouth, and from his vital breath the Wind was born.',
            griffith: 'The Brahmin was his mouth, of both his arms was the Rajanya made. His thighs became the Vaishya, from his feet the Sudra was produced. The Moon was gendered from his mind, and from his eye the Sun had birth; Indra and Agni from his mouth were born, and Vayu from his breath.',
            sanskrit: 'brāhmaṇo\'sya mukham āsīd bāhū rājanyaḥ kṛtaḥ· ūrū tad asya yad vaiśyaḥ padbhyāṃ śūdro ajāyata',
          },
          entities: [
            { word: 'moon was born from his mind; from his eye the sun was born', node: 'purusha', type: 'concept',
              note: 'The correspondence between body parts of the cosmic Person and elements of the cosmos — mind/moon, eye/sun, mouth/fire, breath/wind, navel/atmosphere, head/sky, feet/earth — is the Vedic form of the macrocosm-microcosm principle that runs through all Western esoteric tradition. As above, so below: the human body is a microcosm of the cosmic body. This doctrine appears explicitly in: the Stoics (the human body mirrors the cosmic body), the Hermetic "as above, so below" (Tabula Smaragdina), the Kabbalistic Adam Kadmon, and the Chinese five-element correspondence system.',
              parallels: [
                { label: 'Coffin Text 1130 — the Creator\'s tears as humanity', textId: 'coffin-text-1130', note: 'The CT 1130 Creator\'s tears becoming men and sweat becoming gods, and the Purusha\'s body-parts becoming cosmic elements — both articulate the same insight: the elements of creation are extensions of the divine body/self, not separate creations.' },
                { label: 'Sefer Yetzirah — Adam Kadmon\'s body as cosmic map', textId: 'sefer-yetzirah', note: 'The Kabbalistic Adam Kadmon (Primordial Adam) whose body maps onto the sefirot — crown/head, wisdom/right arm, understanding/left arm, and so on — is the Jewish mystical equivalent of the Purusha Sukta\'s body-cosmos correspondence. Both describe the cosmos as a divine body in which each part corresponds to a cosmic element or principle.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 36. VÖLUSPÁ — THE SEERESS'S PROPHECY ─────────────────────────────────────
SCRIPTURE_TEXTS['voluspa'] = {
  title: 'Völuspá — The Seeress\'s Prophecy',
  shortTitle: 'Völuspá',
  tradition: 'Norse / Old Norse Eddic Poetry',
  date: 'c. 900–1000 CE (written down c. 1270 CE; oral tradition much older)',
  intro: 'The opening poem of the Poetic Edda — a völva (female seeress) summoned by Odin recounts the entire history of the cosmos from creation through Ragnarök to renewal. The poem opens with the primordial void (Ginnungagap), traces the formation of the worlds through Ymir\'s body, the creation of humanity from trees, the corruption of the golden age, the prophecy of Ragnarök, and the final renewal of the world after the destruction. The Völuspá is the most comprehensive mythological creation-to-apocalypse narrative in Norse religion and one of the most structurally complete cosmological texts in any tradition — directly comparable to the Enuma Elish, Popol Vuh, and the Book of Revelation as full-arc cosmic history.',
  crossTradition: [
    { label: 'Purusha Sukta — Ymir\'s body creating the world',             textId: 'purusha-sukta',    note: 'The Norse Ymir (whose flesh = earth, blood = sea, bones = mountains, skull = sky-dome) and the Vedic Purusha (whose body parts become all cosmic elements) are structurally identical. Both almost certainly preserve a Proto-Indo-European cosmogonic myth: the cosmos is created from the sacrificed/dismembered body of a primordial giant-being.' },
    { label: 'Revelation 12–22 — the apocalypse and renewal',               textId: 'revelation-12',    note: 'Ragnarök (the destruction of the gods) followed by the rising of a new earth and the survivor\'s renewal in Gimlé parallels Revelation\'s destruction of the old world followed by the New Jerusalem. Both texts describe an eschatological arc: corruption → catastrophic destruction → divine renewal. Both show possible cross-influence through the Viking Age contact with Christian culture.' },
    { label: 'Enuma Elish — chaos overcome to create order',                textId: 'enuma-elish-1',    note: 'The Babylonian Marduk defeating Tiamat to create the world from her body parallels Odin and the Aesir killing Ymir and creating the world from his body. Both: divine beings defeat/kill a primordial giant, create the cosmos from the body. The Norse and Babylonian versions both reflect the widespread ancient near-Eastern and Indo-European combat-cosmogony pattern.' },
    { label: 'Nasadiya Sukta — void before creation',                       textId: 'nasadiya-sukta',   note: 'The Völuspá\'s Ginnungagap ("the yawning void," "no sand, no sea, no cool waves, no earth, no heaven") and the Nasadiya Sukta\'s "neither non-being nor being existed" are the same cosmogonic starting point: the absolute absence of existence before the first creative act.' },
  ],
  translations: [
    { id: 'larrington', label: 'Larrington 1996 (T1, Oxford World\'s Classics)' },
    { id: 'bellows',    label: 'Bellows 1923 (T2, public domain)' },
    { id: 'norse',      label: 'Old Norse (original)' },
  ],
  sections: [
    {
      heading: 'I. The Beginning — Before the World Was',
      verses: [
        {
          ref: 'Völuspá 1–3',
          text: 'Hearing I ask from the holy races, from Heimdall\'s children, both high and low; thou wilt, Valfather, that I well set forth the fates of the world which I farthest remember — the earliest I recall was when Ymir lived; there was no sand nor sea nor cool waves, no earth below, no heaven above, a yawning void, but grass there was nowhere.',
          textVersions: {
            larrington: 'I ask for a hearing from all the holy races, greater and lesser, children of Heimdall... I recall those first worlds: I remember the giants, born at the beginning of time, those who brought me up long ago. Nine worlds I know, the nine abodes of the glorious world-tree, the tree of fate down below the earth.',
            bellows:    'Of Heimdall\'s sons both high and low, thou wilt, Valfather! that I well recount... Then was the age when nothing was: nor sand nor sea, nor cool waves; earth did not exist, nor heaven above, a yawning void, and grass was nowhere.',
            norse:      'Hlýðask vil ek· hljóðs biðk allar helgar kindir· meiri ok minni mǫgr Heimdallar· viltu at ek Valfǫðr vel fram telja forn spjǫll fíra þau er fremst um man',
          },
          entities: [
            { word: 'no sand nor sea nor cool waves, no earth below, no heaven above', node: 'primordial-darkness', type: 'concept',
              note: 'The Völuspá\'s pre-creation void — Ginnungagap ("yawning void/gap") — names an absolute emptiness before all existence: no earth, no sky, no sea, no grass. This is the Norse form of the same universal cosmogonic starting point found in Genesis 1:2 (darkness over the deep), Nasadiya Sukta ("neither being nor non-being existed"), the Hermetic primordial darkness and water (CH III), and the Popol Vuh ("all was in suspense, all calm, in silence... the sky alone, and the vast sea"). All creation narratives begin by naming what was absent before the first creative act.',
              parallels: [
                { label: 'Nasadiya Sukta — "neither non-being nor being existed"', textId: 'nasadiya-sukta', note: 'The Vedic "nāsad āsīn no sad āsīt" (neither non-existence nor existence) and the Völuspá\'s list of absences (no sand, no sea, no earth, no sky) are both naming the absolute pre-creation void by negation. The cosmogonic strategy of defining the origin by what was not yet there appears across all traditions.' },
                { label: 'Genesis 1:2 — "darkness over the face of the deep"', textId: 'genesis-1', note: 'Genesis 1:2: "Now the earth was formless and empty, darkness was over the surface of the deep." The Völuspá\'s Ginnungagap and Genesis\'s formless void are the same primordial emptiness — both describing the condition before God\'s/the gods\' creative intervention.' },
              ]
            },
          ]
        },
        {
          ref: 'Völuspá 4–6 (Ymir and the First Giants)',
          text: 'Then was the age of Bur\'s sons, when they raised the vault of heaven; they created Miðgarðr, the magnificent earth; the sun shone from the south on the stones of the hall; then the ground grew over with green plants. The sun, the moon\'s companion, threw her right arm around the rim of heaven; the sun knew not what hall she had, the stars knew not what stations they had, the moon knew not what power she had.',
          textVersions: {
            larrington: 'Then Bur\'s sons raised the land, they who made the magnificent Midgard; the sun shone from the south on the hall\'s stones, the ground was grown over with green leeks. The sun, the moon\'s companion, lifted her right hand around heaven\'s rim; the sun knew not where her halls were, the stars knew not where their places were, the moon knew not its power.',
            bellows:    'Then Burr\'s sons lifted the levels of earth, Midgard the mighty there they made; the sun from the south warmed the stones of earth, and green was the ground with growing leeks.',
            norse:      'Unz Burs synir bǫlverk of gerðu þeir er miðgarð mæran skópu· sól skein sunnan á salar steina þá var grund gróin grœnum lauki',
          },
          entities: [
            { word: 'raised the vault of heaven', node: 'odin', type: 'deity',
              note: 'In the Norse cosmogony, Odin and his brothers Vili and Vé kill Ymir, the primordial frost-giant, and use his body to make the world: flesh → earth, blood → sea and rivers, bones → mountains, skull → the dome of the sky, brains → clouds. The Völuspá alludes to this act without describing it directly (the full account is in the Prose Edda\'s Gylfaginning). This is the Norse version of the Purusha Sukta: the cosmos created from the body of a primordial being.',
              parallels: [
                { label: 'Purusha Sukta — Purusha\'s body becomes all cosmic elements', textId: 'purusha-sukta', note: 'Ymir\'s flesh/blood/bones/skull becoming earth/sea/mountains/sky, and Purusha\'s body parts becoming cosmic elements (navel/atmosphere, head/sky, feet/earth), are structurally identical. Both Norse and Vedic traditions preserve the same Proto-Indo-European body-cosmos homology.' },
                { label: 'Enuma Elish — Tiamat\'s body split to make earth and sky', textId: 'enuma-elish-1', note: 'Marduk splitting Tiamat\'s body to form earth (below) and sky (above) is the Babylonian combat-cosmogony version of the same pattern: a primordial being\'s body becomes the cosmos. Norse + Vedic + Babylonian = three independent branches of the same ancient cosmogonic myth-type.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. The World-Tree and the Norns',
      verses: [
        {
          ref: 'Völuspá 19–20',
          text: 'An ash I know that stands, Yggdrasil is its name, a tall tree, drenched with shining loam; from there come the dews that fall in the valleys, it stands always green above the well of Urðr. From there come three maidens, knowing much, from the lake that stands beneath the tree; Urðr is one called, Verðandi another — they carved on tablets — Skuld the third. They laid down laws, they chose lives for the children of men, they set out the fates.',
          textVersions: {
            larrington: 'I know an ash-tree, called Yggdrasil, a tall tree, soaked with shining loam; from there come the dews which fall in the dales, it stands always green over the well of Urd. From there come three girls, knowing a great deal, from the lake which stands under the tree; one is called Urd, another Verdandi — they carved on a wooden slip — Skuld the third; they laid down laws, they chose lives, for the children of men they set out fates.',
            bellows:    'An ash I know, Yggdrasil its name, with water white is the great tree wet; thence come the dews that fall in the dales, green by Urth\'s well does it ever grow.',
            norse:      'Ask veit ek standa heitir Yggdrasill hár baðmr ausinn hvíta auri· þaðan koma dǫggvar þærs í dala falla stendr æ yfir grœnn Urðarbrunni',
          },
          entities: [
            { word: 'Yggdrasil', node: 'yggdrasil', type: 'symbol',
              note: 'Yggdrasil (the World-Tree, "Yggr\'s horse" — Odin\'s steed, referencing Odin\'s self-hanging on the tree to gain the runes) connects all nine worlds of Norse cosmology: its roots reach Ásgarðr (gods), Jötunheimr (giants), and Niflheimr (the realm of death); its branches touch heaven; at its base are three wells (Urðr\'s well of fate, Mímisbrunnr of wisdom, Hvergelmir of primal waters). The World-Tree as the axis mundi (world-axis) connecting all levels of reality appears across traditions: the Kabbalistic Tree of Life (sefirot as tree), the shamanic world-tree of Siberia, the Buddhist Mount Meru, the Hindu Mount Meru as axis.',
              parallels: [
                { label: 'Sefer Yetzirah — Tree of Life as the structural map of reality', textId: 'sefer-yetzirah', note: 'The Kabbalistic Tree of Life (the sefirot arranged as a tree with roots above and branches below, or roots below and branches above in different traditions) is the Jewish mystical equivalent of Yggdrasil: a cosmic tree connecting all levels of reality whose structure IS the structure of creation.' },
                { label: 'Plato Timaeus — the World-Soul as the structural axis of the cosmos', textId: 'plato-timaeus', note: 'The Platonic World-Soul as the animating principle connecting the divine Forms (above) to material creation (below) and extending through all levels parallels Yggdrasil connecting all nine worlds. Both are the central structural principle of a multi-level cosmos.' },
              ]
            },
            { word: 'Urðr, Verðandi, Skuld', node: 'odin', type: 'deity',
              note: 'The three Norns (Urðr = "what has become/was," Verðandi = "what is becoming/present," Skuld = "what should be/future") carving the fates of all beings on wooden slips under Yggdrasil are the Norse equivalent of the Greek Moirai (Clotho who spins the thread of life, Lachesis who measures it, Atropos who cuts it). The triplication of fate-goddesses — three women controlling time: past/present/future — appears across Indo-European traditions: Norse Norns, Greek Moirai, Roman Parcae, Celtic Morrigan (sometimes tripled). In the Platonic Timaeus (37c-d), time itself is structured as the moving image of eternity through numerical periodicity — the three temporal modes (past/present/future) as a single moving reality.',
              parallels: [
                { label: 'Greek Moirai — the three Fates spinning, measuring, cutting', note: 'The Greek Moirai (Clotho, Lachesis, Atropos) and the Norse Norns (Urðr, Verðandi, Skuld) are cognate Indo-European fate-goddess triads, structurally identical: three women who control the span of human life through a textile/writing metaphor. The Norns carve on wood; the Moirai spin and cut thread.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'III. Ragnarök and the Renewal',
      verses: [
        {
          ref: 'Völuspá 44–46 (The Age of Swords)',
          text: 'Brothers will fight and kill each other, sisters\' children will defile kinship. It is harsh in the world, whoredom rife — an axe age, a sword age — shields are riven — a wind age, a wolf age, before the world goes headlong. No man will have mercy on another.',
          textVersions: {
            larrington: 'Brothers will fight and kill each other, cousins will break the peace with each other; it will be hard in the world, great whoredom, axe-age, sword-age, shields will be cloven, wind-age, wolf-age, before the world-falls-ruin; no man will spare another.',
            bellows:    'Brothers shall fight and fell each other, and sisters\' sons shall kinship stain; hard is it on earth, with mighty whoredom; axe-time, sword-time, shields are sundered, wind-time, wolf-time, ere the world falls; nor ever shall men each other spare.',
            norse:      'Bræðr munu berjask ok at bǫnum verðask munu systrungar sifjum spilla· hart er í heimi hórdómr mikill skeggjǫld skalmǫld skildir ro klofnir vindǫld vargǫld áðr verǫld steypisk',
          },
          entities: [
            { word: 'axe age, sword age, shields are riven', node: 'loki', type: 'concept',
              note: 'The "axe age, sword age, shield-riven, wind age, wolf age" is the Norse description of the moral and cosmic collapse before Ragnarök — a sequence of intensifying violence and social disintegration. The parallel to the Hindu doctrine of the Kali Yuga (the final age of darkness, violence, and moral decay before the cosmic renewal and return of the golden age) is structural: both traditions describe a cyclical pattern of creation → golden age → degradation → catastrophic destruction → renewal. The Zoroastrian Frashegird (renovation of the world after the final battle) is the same eschatological arc.',
              parallels: [
                { label: 'Revelation 12 — the Dragon\'s war and the tribulation', textId: 'revelation-12', note: 'Revelation\'s tribulation period (the Dragon\'s seven-year persecution before the final judgment) and the Völuspá\'s "axe age, sword age" before Ragnarök are structurally identical: a period of maximal violence and moral collapse immediately preceding the final cosmic battle and renewal.' },
                { label: 'Yasna 30 — the final battle between Truth and the Lie', textId: 'yasna-30', note: 'The Zoroastrian final battle between Ahura Mazda\'s forces and Angra Mainyu ending in the Frashegird (renovation) is the probable influence on both the Völuspá\'s Ragnarök and the Book of Revelation\'s Armageddon. All three: cosmic dualism → final battle → divine victory → world renewal.' },
              ]
            },
          ]
        },
        {
          ref: 'Völuspá 59–66 (The Renewal)',
          text: 'She sees a hall standing more beautiful than the sun, thatched with gold, at Gimlé; there the trustworthy people shall live and for all ages enjoy happiness. Then the powerful one comes from above — he who rules all — to the judgment-place of the gods. From above there comes the mighty one to the judgment of powers, and he who rules from above.',
          textVersions: {
            larrington: 'She sees, coming up a second time, earth from the ocean, eternally green; the waterfalls plunge, the eagle soars above them, catching fish from the mountains. The gods meet on the Idavoll plain... She sees halls standing, more beautiful than the sun, thatched with gold, at Gimlé; there trustworthy peoples shall live and for ever and a day enjoy happiness.',
            bellows:    'More fair than the sun, a hall I see, roofed with gold, on Gimle it stands; there shall the righteous rulers dwell, and happiness ever there shall they have.',
            norse:      'Sal sér hon standa sólu fegra golli þaktan á Gimléi· þar skulu dyggvar dróttir byggja ok um aldr daga yndis njóta',
          },
          entities: [
            { word: 'hall standing more beautiful than the sun, thatched with gold', node: 'odin', type: 'concept',
              note: 'The golden hall of Gimlé where the righteous will live in eternal happiness after Ragnarök is the Norse eschatological paradise — structurally equivalent to the New Jerusalem in Revelation 21 ("the city of pure gold, like pure glass... the city does not need the sun"), the Zoroastrian Frashegird where the renovated world is perfected, and the Buddhist Pure Land. All describe a post-eschatological state of perfected reality as the outcome of the cosmic drama.',
              parallels: [
                { label: 'Revelation 21 — New Jerusalem, the city of gold', textId: 'revelation-12', note: 'Revelation 21\'s New Jerusalem — the holy city descending from heaven, made of pure gold, the dwelling of God with humanity — is structurally identical to the Völuspá\'s Gimlé: the renewed world after the apocalyptic destruction, where the righteous dwell in perfect happiness. Both texts are full-arc cosmic narratives ending in the same image.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 37. RUMI — MASNAVI BOOK I PROLOGUE ───────────────────────────────────────
SCRIPTURE_TEXTS['rumi-masnavi'] = {
  title: 'Rumi — Masnavi Book I: The Reed\'s Lament',
  shortTitle: 'Rumi — The Reed',
  tradition: 'Sufism / Islamic Mysticism',
  date: 'c. 1258–1273 CE (Konya; Jalāl al-Dīn Muḥammad Rūmī)',
  intro: 'The opening 18 verses of the Masnavi — the greatest work of Persian mystical poetry, described by Jami as "the Quran in the Persian tongue." A reed flute (nay) cut from the reed bed cries with longing for its origin. Every person who has been separated from their source grieves and seeks reunion. The fire of love, not mere breath, is what cries through the reed. This is the concentrated statement of the Sufi doctrine of divine longing (shawq): the soul was cut from the divine, and its entire life is a cry of love and longing for return. The parallel to the Poimandres Anthropos descending from the divine, the Orphic divine spark in Titanic matter, and the Gnostic pneuma imprisoned in the material world is direct — same diagnosis, different prescription.',
  crossTradition: [
    { label: 'Poimandres — the soul descended from its divine origin',      textId: 'poimandres',       note: 'The Hermetic Anthropos who descended into matter through love of his own reflection and now lives in exile from his divine origin — and Rumi\'s reed cut from the reed bed crying for return — are the same metaphysical situation: a divine essence separated from its source and longing to return. The Hermetic solution is gnosis (recognize your origin); the Sufi solution is love (mahabbah) and longing (shawq).' },
    { label: 'Orphic Theogony — the divine spark crying in Titanic clay',  textId: 'orphic-theogony',  note: 'The Orphic divine fragment of Dionysus/Zagreus trapped in Titanic matter and the Sufi soul cut from the divine reed bed are the same image: a particle of the divine imprisoned in matter, crying for its origin. The Orphic and Sufi traditions approach the same existential diagnosis from different theological frameworks.' },
    { label: 'Gospel of Thomas — the pearl lost in the world',              textId: 'gospel-of-thomas', note: 'Thomas L.8 (the great fish parable) and the apocryphal Hymn of the Pearl (Acts of Thomas) describe the soul as a precious thing lost in the world, forgotten, but crying out. Rumi\'s reed crying for the reed bed and the Gnostic pearl at the bottom of the sea are the same image: the separated divine longing for return.' },
    { label: 'Quran 2:156 — "We belong to God and to God we return"',       textId: 'quran-fatiha-nur', note: 'The Quranic inna lillāhi wa innā ilayhi rājiʿūn ("We belong to God and indeed to God we return," 2:156) is the Quranic statement of the same theology Rumi\'s reed embodies: the soul\'s origin in God and its return to God. Rumi deepens this from a statement about death into a universal description of the soul\'s longing throughout life.' },
  ],
  translations: [
    { id: 'nicholson', label: 'Nicholson 1926 (T1, classic scholarly)' },
    { id: 'davis',     label: 'Davis 2008 (T2, Penguin Classics)' },
    { id: 'persian',   label: 'Persian (original)' },
  ],
  sections: [
    {
      heading: 'I. The Reed\'s Cry',
      verses: [
        {
          ref: 'Masnavi I:1–6',
          text: 'Listen to the reed, how it tells a tale, complaining of separations: "Since I was cut from the reed bed, men and women have mourned with me. I want a breast torn open by separation, so I can describe the pain of longing. Everyone who stayed far from their origin seeks again the time of their union. In every company I uttered my lament; I associated with those in bad and good condition."',
          textVersions: {
            nicholson: 'Hearken to this reed how it tells a tale, complaining of separations. Since I was cut from the reed-bed, my lament hath caused man and woman to moan. I want a bosom torn by severance, that I may give expression to the pain of love-longing. Whoever is parted from his origin seeks again the time of his union.',
            davis:     'Listen to the reed flute, how it tells its tale, lamenting separations. It says: "Since I was cut from the reed bed, men and women have mourned with me. I need a heart that is torn open with longing so I can explain what longing is."',
            persian:   'بشنو این نی چون شکایت می‌کند / از جدایی‌ها حکایت می‌کند / کز نیستان تا مرا ببریده‌اند / در نفیرم مرد و زن نالیده‌اند',
          },
          entities: [
            { word: 'Since I was cut from the reed bed', node: 'tradition-sufism', type: 'concept',
              note: 'The reed (nay) cut from the reed bed (neystan) is Rumi\'s central image for the soul\'s separation from God. The ney is the physical Persian flute made from reed; its music is literally the sound of a hollow reed crying — and Rumi says: that cry IS the soul\'s cry for its origin. The reed cannot make music without being cut (separated, wounded by loss); its music IS its wound. This is one of the most profound insights in mystical literature: the beauty of the soul\'s longing (shawq) is made possible only by the separation that causes it. Without the cut, no music; without exile, no longing; without longing, no love; without love, no return.',
              parallels: [
                { label: 'Poimandres — Anthropos exiled in matter, longing for return', textId: 'poimandres', note: 'The Hermetic Anthropos fallen into matter through love of his reflection — and now trapped in the body, longing for the divine — and Rumi\'s reed cut from the reed bed and crying — are the same metaphysical situation. The Hermetic solution is gnostic knowledge (CH IV\'s krater of Nous); the Sufi solution is love itself as the vehicle of return.' },
                { label: 'Orphic Theogony — the divine spark longing for its origin', textId: 'orphic-theogony', note: 'The Orphic divine fragment (the Dionysian spark in Titanic clay) and the Sufi reed cut from the divine reed bed both describe the human soul as a piece of the divine in exile, whose entire life is a longing for reunion. Both are Pre-Plotinian forms of the emanation-and-return cosmological structure.' },
              ]
            },
            { word: 'Everyone who stayed far from their origin', node: 'anthropos-gnostic', type: 'concept',
              note: 'The universality of the reed\'s situation — "everyone who stayed far from their origin seeks the time of their union" — makes the personal longing of the reed into a universal theological claim: every soul is in exile from its divine origin and every soul seeks return. This is the Sufi statement of the cosmological doctrine that appears as: the Gnostic pneuma imprisoned in matter; the Hermetic Anthropos fallen into the body; the Buddhist samsara as the cycle of exile from nirvana; the Platonic soul\'s descent into the body and its aspiration to return.',
              parallels: [
                { label: 'Gospel of Thomas L.3 — the Kingdom is within and without', textId: 'gospel-of-thomas', note: 'Thomas L.3: "The Kingdom is inside you and outside you." The reed\'s origin (the reed bed) is both where it came from and where it longs to return. The Thomasine Kingdom-as-origin and the Sufi reed bed-as-origin are the same theological image: the divine from which the soul came and to which it returns.' },
              ]
            },
          ]
        },
        {
          ref: 'Masnavi I:7–12',
          text: '"My secret is not far from my lament, but eye and ear lack that light. Body is not veiled from soul, nor soul from body; yet to no one is the soul permitted to be seen. This music of the reed is fire — it is not breath. May he who has not this fire be nothing! The fire of Love has fallen into the reed; the ferment of Love has fallen into the wine. The reed is the companion of every lonely one; its veil has been torn away from our secrets."',
          textVersions: {
            nicholson: 'The secret of my lamentation is not far from my plaint, but eye and ear want that light... This music of the reed is fire, not breath: let him who lacketh fire be naught! \'Tis the fire of Love that fell into the reed, \'tis the ferment of Love that fell into the wine.',
            davis:     '"My secret is not far from my lament but eye and ear have no light for it. Body is not separate from soul, nor is soul separate from body, and yet nobody is given sight of the soul. This music of the reed is fire — it is not wind — let him who has no fire become nothing! It is fire of love that has fallen into the reed."',
            persian:   'سر من از نالهٔ من دور نیست / لیک چشم و گوش را آن نور نیست / آتش عشق است کاندر نی فتاد / جوشش عشق است کاندر می فتاد',
          },
          entities: [
            { word: 'fire of Love that fell into the reed', node: 'al-hallaj', type: 'concept',
              note: 'The fire (ātash) of Love (ʿishq) that fell into the reed is Rumi\'s central Sufi-theological claim: the source of the soul\'s longing is not merely emotion but divine fire — the same fire that is in God, placed into the created being by the act of creation. Al-Hallaj (martyred 922 CE) made the same claim in "Ana\'l-Haqq" ("I am the Truth/I am God"): the divine fire has so thoroughly entered the mystic that the two cannot be distinguished. Rumi encodes this without the scandal: the fire in the reed is divine fire, and the reed\'s music is that fire crying.',
              parallels: [
                { label: 'Al-Hallaj — "Ana\'l-Haqq" (I am the Truth/God)', node: 'al-hallaj', note: 'Al-Hallaj\'s declaration "Ana\'l-Haqq" (I am the Real/God) and Rumi\'s image of divine fire in the reed are the same theological claim at different temperatures: al-Hallaj states identity; Rumi states intimate presence. Both are the Sufi form of the non-dual identity found in Chandogya\'s tat tvam asi and CH XI\'s "become eternity."' },
                { label: 'Yasna 30 — the sacred fire as divine presence', textId: 'yasna-30', node: 'sacred-fire', note: 'The Zoroastrian sacred fire (ātash) as the visible manifestation of Ahura Mazda\'s divine presence and Rumi\'s "fire of Love" in the reed are cognate images: fire as the mode of divine immanence in matter. The Persian mystical tradition (Zoroastrianism → Sufism) preserves fire as the image of the divine throughout.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── 38. APOCRYPHON OF JOHN ────────────────────────────────────────────────────
SCRIPTURE_TEXTS['apocryphon-of-john'] = {
  title: 'Apocryphon of John — The Monad, Sophia\'s Fall, and the Demiurge',
  shortTitle: 'Apocryphon of John',
  tradition: 'Sethian Gnosticism / Early Christianity',
  date: 'c. 2nd–3rd CE (Coptic; extant in Nag Hammadi Codices II, III, IV)',
  intro: 'The most important Gnostic cosmogonic text — a secret revelation given by the risen Christ to John, describing the structure of divine reality and the origin of the material world. It contains: the apophatic description of the Monad (the unknowable highest God); the emergence of Barbelo (the divine feminine, First Thought); the fall of Sophia (divine Wisdom) who acts without her consort and produces Yaldabaoth the Demiurge; and the Demiurge\'s creation of the material world and the human being. Most strikingly: Yaldabaoth declares "I am God and there is no other God beside me" — directly quoting Isaiah 45:5-6 — revealing that the Gnostic reading of Isaiah is that this declaration proves the Demiurge\'s ignorance: he says this precisely because he does not know his divine mother, Sophia, above him.',
  crossTradition: [
    { label: 'Isaiah 45 — "I am God and there is no other" = the Demiurge\'s ignorance', textId: 'isaiah-45', note: 'The Apocryphon\'s Yaldabaoth declaring "I am a jealous God and there is no God beside me" (citing Isaiah 45:5 and Exodus 20:5) is the Gnostic inversion of Isaiah\'s monotheism: the Gnostics read this declaration as the Demiurge\'s self-revelation of ignorance — he says there is no other God because he doesn\'t know his divine mother Sophia above him. This is one of the most audacious theological moves in the history of religion.' },
    { label: 'Poimandres — the Anthropos fallen into matter through the powers', textId: 'poimandres', note: 'The Hermetic Anthropos descending through the planetary spheres into matter, and the Apocryphon\'s pneumatic Adam trapped in the material body created by Yaldabaoth, are cognate: in both, a divine human essence is imprisoned in material creation. The Hermetic solution is gnosis (CH IV\'s krater); the Gnostic solution is anamnesis (remembering divine origin through the secret teaching).' },
    { label: 'Sefer Yetzirah — the Monad and Ein Sof above all names',          textId: 'sefer-yetzirah', note: 'The Apocryphon\'s opening apophatic description of the Monad — "He is not a being among beings... He is immeasurable... He is inexpressible... He does not exist in time" — is the Gnostic equivalent of the Kabbalistic Ein Sof (the infinite without limit or definition above all the sefirot). Both articulate the same apophatic theology: the highest divine reality transcends all categories.' },
    { label: 'Proverbs 8 — Sophia beside the Father at creation, then falling', textId: 'proverbs-8', note: 'Proverbs 8\'s Wisdom (Sophia) who was with God at creation "rejoicing before him always" is the positive image; the Apocryphon of John\'s Sophia who acts without her consort and falls is the negative theological development: what happens when Wisdom acts without the Father\'s will. The Apocryphon is Proverbs 8 gone wrong — the full account of what happens when Sophia forgets her place beside the Father.' },
  ],
  translations: [
    { id: 'waldstein',  label: 'Waldstein-Wisse 1995 (T1, Nag Hammadi)' },
    { id: 'robinson',   label: 'Robinson 1988 (T2, Nag Hammadi Library)' },
    { id: 'coptic',     label: 'Coptic (Nag Hammadi original)' },
  ],
  sections: [
    {
      heading: 'I. The Monad — The Unknowable Father',
      verses: [
        {
          ref: 'ApJohn II.2.26–3.17',
          text: '"The Monad is a monarchy with nothing above it. It is he who exists as God and Father of everything, the invisible One who is above everything, who exists as incorruption, which is in the pure light into which no eye can look. He is the invisible Spirit. It is not right to think of him as a god or something similar... He is not a being among beings. Rather, he is superior to all. He does not exist in something inferior to him... Silence is what surrounds him."',
          textVersions: {
            waldstein: '"The Monad is a monarchy with nothing above it. It is the God and Father of everything... the invisible One who is above everything... He is ineffable. No principle knew him, no authority, no subjection, nor any creature from the foundation of the world, except he alone... And I do not say that he is perfect, but rather that he is greater than perfect."',
            robinson:  '"The Invisible One exists as pure light, being immeasurable... He is not a god, nor is he similar to anything. He does not exist among things that exist... He is not a being among being... He is immeasurable light, which is pure, holy, and immaculate. He is inexpressible."',
            coptic:    'ⲡⲙⲟⲛⲁⲥ ⲟⲩⲙⲛⲧⲣ̄ⲣⲟ ⲧⲉ ⲙⲛ ⲗⲁⲁⲩ ϩⲓϫⲱⲥ ⲛⲧⲟϥ ⲡⲉⲧϣⲟⲟⲡ ⲛ̄ⲛⲟⲩⲧⲉ ⲁⲩⲱ ⲉⲓⲱⲧ ⲛ̄ⲧⲉ ⲡⲧⲏⲣϥ̄',
          },
          entities: [
            { word: 'the invisible One who is above everything', node: 'barbelo', type: 'deity',
              note: 'The Apocryphon\'s opening apophatic description of the Monad — the unknowable Father above all — is the Gnostic apex of the apophatic tradition that runs through the Hermetic "God cannot be named" (CH XI), the Kabbalistic Ein Sof, the Taoist unnamed ground (Tao 1), and the Buddhist śūnyatā. The Gnostic version is unusual in its explicit negation of divine ontology itself: "He is not a being among beings" — God does not exist in the way that things exist. This is apophatic theology at its most radical.',
              parallels: [
                { label: 'CH XI — "God cannot be named; all names are names of God"', textId: 'corpus-hermeticum-11', note: 'The Hermetic "God cannot be named" (CH XI.22) and the Apocryphon\'s "He does not exist in something inferior to him / He is not a being among beings" are the same apophatic claim: the highest divine reality transcends all categories, including the category of "existence" or "being."' },
                { label: 'Sefer Yetzirah — Ein Sof above the sefirot, beyond all definition', textId: 'sefer-yetzirah', note: 'The Kabbalistic Ein Sof (literally "without end/without definition") above all the sefirot, before the first emanation, is the Jewish mystical equivalent of the Apocryphon\'s Monad. Both: the highest divine reality is infinite, undefined, beyond all positive description, and only approached by negation.' },
              ]
            },
            { word: 'Silence is what surrounds him', node: 'apophatic-mysticism', type: 'concept',
              note: 'The Monad surrounded by Silence (sige) is the Gnostic theological expression of apophatic silence as the proper response to the divine: since the Monad transcends all speech, Silence is simultaneously his dwelling place and the correct human posture before him. This parallels the Quran\'s "Allah is beyond all description" (Quran 42:11), the Zen "original face before your parents were born" (beyond concepts), and the Sufi fana (annihilation of the self in the divine silence). In the Valentinian Gnostic system, Sige (Silence) is actually named as the Monad\'s consort — the divine pair: Depth and Silence.',
              parallels: [
                { label: 'Tao Te Ching — "Those who know do not speak; those who speak do not know"', textId: 'tao-te-ching-1', note: 'Tao 56: "Those who know do not speak; those who speak do not know." The Taoist teaching on the silence of the sage before the Tao and the Gnostic Silence surrounding the Monad are the same apophatic insight: the ultimate reality is best approached through silence.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'II. Sophia\'s Fall and Yaldabaoth\'s Ignorance',
      verses: [
        {
          ref: 'ApJohn II.9.25–10.19 (Sophia\'s Fall)',
          text: '"Now our fellow sister Sophia, who is a divine essence, thought a thought from herself, and in the reflection of the invisible Spirit and foreknowledge she wished to reveal an image from herself without the consent of the Spirit — she had not found her consort — and without the foreknowledge of her partner, and without the will of the Spirit. She brought forth from herself what was ignorant and confused. And because of the invincible power which is in her, her thought did not remain idle, and something came out of her which was imperfect."',
          textVersions: {
            waldstein: '"Sophia, who is the last of the Aeons, the partner of the unknown Father, wished to reveal an image from herself, the power which is in her. And the thought of her became a work which was like the mist of ignorance. She had not found her consort, and she brought forth something out of herself which was imperfect."',
            robinson:  '"Now our sister Sophia — she who is an aeon — perceived a reflection in the invisible Spirit. She wished to bring forth a likeness out of herself without the consent of the Spirit... without her consort. And though the person of her maleness had not approved, she brought it forth... imperfect."',
            coptic:    'ⲙⲡⲉⲥϩⲟⲩⲛⲉ ⲇⲉ ⲛⲧⲉ ⲧⲁϥⲧⲉ ⲧⲛⲁⲧϩⲩⲡⲟⲥⲧⲁⲥⲓⲥ ⲛ̄ϩⲣⲁϥⲛⲧⲉ ⲧⲁⲩⲧⲏⲥ',
          },
          entities: [
            { word: 'Sophia wished to reveal an image from herself without the consent of the Spirit', node: 'sophia-gnostic', type: 'deity',
              note: 'Sophia\'s fall — she acts from her own desire without her consort\'s will, producing an imperfect emanation — is the Gnostic explanation for the existence of the imperfect material world. The cosmos is not the direct creation of the highest God but the accidental product of Sophia\'s autonomous act. This is the Gnostic inversion of Proverbs 8\'s Wisdom "rejoicing beside the Father always" — Sophia stops rejoicing and acts alone, and the result is Yaldabaoth and the material world. The pattern: wisdom/divine-feminine acts without the divine-masculine consent → imperfect creation — also appears in Hindu mythology (Shakti acting without Shiva produces chaos) and in the Kabbalistic Shevirat ha-Kelim (the Breaking of the Vessels).',
              parallels: [
                { label: 'Proverbs 8 — Wisdom beside the Father, "rejoicing always"', textId: 'proverbs-8', note: 'Proverbs 8:30: "I was beside him, like a master workman; and I was daily his delight, rejoicing before him always." The Apocryphon\'s Sophia who stops rejoicing and acts without the Father\'s consent is exactly what Proverbs 8 warns against by showing the positive: Wisdom\'s right relationship is to remain beside the Father, not to act independently.' },
                { label: 'Poimandres — the Anthropos falling through desire for his own reflection', textId: 'poimandres', note: 'The Poimandres Anthropos falls through desire for matter (love of his own reflection). The Apocryphon\'s Sophia falls through desire for autonomous creation (love of her own reflection of the Father). Both: a divine being acts from isolated desire rather than proper divine relationship, and the result is the entrapped material world.' },
              ]
            },
            { word: 'brought forth something which was imperfect', node: 'yaldabaoth', type: 'deity',
              note: 'Sophia\'s imperfect emanation becomes Yaldabaoth (also called Saklas "the fool" and Samael "the blind god") — a lion-faced serpent, the ignorant creator-god who believes himself to be the only God. His primary characteristic is ignorance (agnoia) — he does not know his divine mother Sophia above him, does not know the higher divine realm, and therefore creates the material world as a prison rather than a temple. The Gnostic Yaldabaoth is Plato\'s Demiurge gone wrong: where Plato\'s Demiurge is good and wants all things to be good, the Gnostic Demiurge is ignorant and creates suffering through his blindness.',
              parallels: [
                { label: 'Plato Timaeus — the good Demiurge vs the Gnostic ignorant Demiurge', textId: 'plato-timaeus', note: 'Plato\'s Timaeus Demiurge who "desired all things to be good" and created as well as possible, and the Apocryphon\'s Yaldabaoth who creates in ignorance — these are two readings of the same Platonic Demiurge figure, one optimistic and one pessimistic. The Gnostics read Plato\'s myth through Egyptian and Jewish apocalyptic lenses and found the Demiurge\'s goodness inadequate to explain the world\'s suffering.' },
              ]
            },
          ]
        },
        {
          ref: 'ApJohn II.11.15–22 (The Demiurge\'s Declaration)',
          text: '"Yaldabaoth said to the authorities who attended him: \'I am a jealous God, and there is no other God beside me.\' But by announcing this he indicated to the angels who attended him that another God does exist; for if there were no other one, of whom would he be jealous? Then the mother began to move to and fro — she recognized that he lacked something when the light of her brightness diminished."',
          textVersions: {
            waldstein: '"And Yaldabaoth said to the angels which were with him: \'Come, let us create a man according to the image of God and according to our likeness, that his image may become a light for us.\' ... I am a jealous God and there is no God beside me — but by saying this, he indicated that another God does exist."',
            robinson:  '"And he said to the authorities which attend him: \'I am a jealous God, and there is no other God beside me.\' Already, by saying this, he indicated that another God exists; for if there were no other, of whom would he be jealous?"',
            coptic:    'ⲁⲛⲟⲕ ⲟⲩⲛⲟⲩⲧⲉ ⲛ̄ϣⲁⲣⲉϩ ⲛ̄ⲧⲉⲟⲩⲛ ⲕⲉⲛⲟⲩⲧⲉ ⲙ̄ⲙⲟⲥ ⲛⲁⲁⲩ ϩⲓⲧⲟⲟⲧ',
          },
          entities: [
            { word: '"I am a jealous God, and there is no other God beside me"', node: 'yaldabaoth', type: 'concept',
              note: 'Yaldabaoth\'s self-declaration — "I am a jealous God, and there is no God beside me" — is a direct quotation combining Isaiah 45:5-6 ("I am YHWH and there is no other") and Exodus 20:5 ("I am a jealous God"). The Apocryphon\'s brilliant interpretive move: the Gnostic writer uses the Hebrew Bible\'s strongest monotheistic declarations as evidence for Yaldabaoth\'s ignorance. If there were truly no other God, why would he say "I am jealous"? Jealousy implies a rival. He says "no other God" because he doesn\'t know his mother Sophia above him. This is the most radical theological inversion in Gnostic literature — and perhaps in all of religious history.',
              parallels: [
                { label: 'Isaiah 45:5-6 — "I am YHWH and there is no other"', textId: 'isaiah-45', note: 'Isaiah 45:5-6: "I am the LORD and there is no other; besides me there is no god." The Apocryphon of John takes Isaiah\'s strongest monotheistic declaration and reads it as the Demiurge\'s confession of ignorance. The text that Isaiah wrote to assert YHWH\'s absolute sovereignty becomes, in the Gnostic reading, evidence that the biblical God is not the highest divine reality but an ignorant creator.' },
                { label: 'Psalm 82 — the divine council and the gods above YHWH', textId: 'psalm-82', note: 'Psalm 82\'s divine council where YHWH is one among many gods (before rising to supremacy) and the Apocryphon\'s Yaldabaoth who doesn\'t know the divine realm above him are convergent: both texts imply a divine realm above the biblical God. The Gnostics read Psalm 82 and Isaiah 45 together as a theological map — the divine council above Yaldabaoth is Sophia, Barbelo, and the Monad.' },
              ]
            },
            { word: 'the mother began to move to and fro', node: 'sophia-gnostic', type: 'concept',
              note: 'After Yaldabaoth\'s self-declaration, Sophia recognizes her error — "she recognized that he lacked something when the light of her brightness diminished." The Gnostic Sophia\'s grief and repentance after the fall is one of the most moving elements of Gnostic cosmology: the divine feminine mourning the consequences of her autonomous act. This parallels the Coffin Text 1130\'s Creator weeping humanity into existence (tears as grief/compassion) and the Rumi reed\'s cry of separation — all encode divine grief as the origin of the world\'s imperfection.',
              parallels: [
                { label: 'Coffin Text 1130 — "men are the tears of my eye"', textId: 'coffin-text-1130', note: 'The Egyptian Creator\'s tears becoming humanity and the Gnostic Sophia\'s grief at seeing Yaldabaoth\'s ignorance — both locate the origin of human existence in divine grief or compassion. Humanity is born from divine sorrow.' },
                { label: 'Rumi Masnavi — the divine origin crying through the reed', textId: 'rumi-masnavi', note: 'Rumi\'s reed crying for the reed bed and Sophia moving to and fro in grief — both are images of the divine in a state of longing and mourning over the separation that creation has caused. In Rumi, the longing is beautiful; in the Apocryphon, it is the recognition of tragedy. Same emotion, different theological evaluation.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── BATCH 6 ─────────────────────────────────────────────────────────────────

SCRIPTURE_TEXTS['ezekiel-1'] = {
  title: 'Ezekiel 1 — The Chariot Vision (Merkabah)',
  shortTitle: 'Ezekiel 1',
  tradition: 'Hebrew Bible',
  date: 'c. 593 BCE',
  intro: 'Ezekiel\'s inaugural vision beside the Chebar canal in Babylon is the fountainhead of Jewish mysticism. The prophet sees four living creatures (hayot) with four faces — human, lion, ox, eagle — bearing a wheeled chariot-throne (merkabah). Wheels within wheels full of eyes. Above the creatures, a firmament; above that, a sapphire throne; above that, a figure "like the appearance of a man" — the kavod, the divine Glory. This vision became the seed of the entire Merkabah and Hekhalot mystical tradition, the template for Revelation 4\'s throne-room, and the rabbinic "Work of the Chariot" (Ma\'aseh Merkabah) considered too dangerous for casual study. The four faces of the hayot were later mapped to the four evangelists (human = Matthew, lion = Mark, ox = Luke, eagle = John) — the Tetramorph that appears on medieval church facades and illuminated Gospel codices.',
  crossTradition: [
    { label: 'Revelation 4 — four living creatures around the throne', textId: 'revelation-12', note: 'John\'s vision of the throne room in Revelation 4 reproduces Ezekiel\'s four living creatures nearly verbatim — lion, ox, man, eagle — before the throne, with the seraphic "holy, holy, holy" of Isaiah 6 added. Ezekiel → Revelation is the clearest case of canonical Jewish apocalyptic literature directly generating Christian visionary literature.' },
    { label: 'Bhagavad Gita 11 — Arjuna sees Krishna\'s cosmic form', textId: 'bhagavad-gita-11', note: 'Ezekiel\'s vision of the kavod — a figure radiating incomprehensible light — and Arjuna\'s Vishvarupa — thousands of faces, consuming fire, the totality of time — are structurally parallel prophetic experiences: a human granted temporary divine vision, overwhelmed by what they see, falling prostrate.' },
    { label: 'Poimandres (CH I) — the divine light-form', textId: 'corpus-hermeticum-1', note: 'Hermes\' encounter with Poimandres as boundless light and Ezekiel\'s kavod as radiant fire and glowing metal (hashmal) are both attempts to describe a direct encounter with divine totality. The Merkabah tradition likely drew on Jewish throne-vision imagery circulating in Alexandria.' },
    { label: 'Sefer Yetzirah — the ten sefirot as nested spheres', textId: 'sefer-yetzirah', note: 'Ezekiel\'s nested wheels-within-wheels and the Sefer Yetzirah\'s ten sefirot share a geometric intuition: divine reality is structured as nested spheres of emanation. The Merkabah vision is the prophetic prototype; Sefer Yetzirah is the first systematic theorization of that structure.' },
  ],
  translations: [
    { id: 'nrsv', label: 'NRSV (T1)' },
    { id: 'hebrew', label: 'Hebrew (original)' },
  ],
  sections: [
    {
      heading: 'The Vision Opens (1:1–4)',
      verses: [
        {
          ref: '1:1',
          text: 'In the thirtieth year, in the fourth month, on the fifth day of the month, as I was among the exiles by the river Chebar, the heavens were opened and I saw visions of God.',
          textVersions: {
            nrsv: 'In the thirtieth year, in the fourth month, on the fifth day of the month, as I was among the exiles by the river Chebar, the heavens were opened and I saw visions of God.',
            hebrew: 'וַיְהִי בִּשְׁלֹשִׁים שָׁנָה בָּרְבִיעִי בַּחֲמִשָּׁה לַחֹדֶשׁ וַאֲנִי בְתוֹךְ-הַגּוֹלָה עַל-נְהַר-כְּבָר נִפְתְּחוּ הַשָּׁמַיִם וָאֶרְאֶה מַרְאוֹת אֱלֹהִים',
          },
          entities: [
            { word: 'visions of God', node: 'merkabah-mysticism', type: 'concept',
              note: 'Mar\'ot Elohim — visions of God — inaugurates the most influential prophetic vision in Judaism. The rabbis called this chapter Ma\'aseh Merkabah, the "Work of the Chariot," and considered it esoteric material restricted to mature scholars. Ben Sira warned: "seek not out the things that are too hard for you" (3:21). Yet this vision became the foundation of Merkabah and Hekhalot mysticism, ascending-throne journeys, and the entire trajectory of Jewish apocalypticism.',
              parallels: [
                { label: 'Corpus Hermeticum I — Poimandres as boundless light', textId: 'corpus-hermeticum-1', note: 'Poimandres appears to Hermes as a being of boundless light and fire in a vision state. The Merkabah tradition of ecstatic throne-vision and the Hermetic tradition of visionary ascent share a common template: the individual granted direct encounter with the highest divine reality through an altered state of consciousness.' },
                { label: 'Bhagavad Gita 11 — divine sight granted to Arjuna', textId: 'bhagavad-gita-11', note: 'Krishna grants Arjuna "divine eyes" (divya-chakshu) to see the Vishvarupa — just as Ezekiel receives heavenly vision beside the canal. Both texts establish that normal human sight is insufficient; the divine must grant a special faculty to perceive its own totality.' },
              ]
            },
          ]
        },
        {
          ref: '1:4',
          text: 'As I looked, a stormy wind came out of the north: a great cloud with brightness around it and fire flashing forth continually, and in the middle of the fire, something like gleaming amber.',
          textVersions: {
            nrsv: 'As I looked, a stormy wind came out of the north: a great cloud with brightness around it and fire flashing forth continually, and in the middle of the fire, something like gleaming amber.',
            hebrew: 'וָאֵרֶא וְהִנֵּה רוּחַ סְעָרָה בָּאָה מִן-הַצָּפוֹן עָנָן גָּדוֹל וְאֵשׁ מִתְלַקַּחַת וְנֹגַהּ לוֹ סָבִיב וּמִתּוֹכָהּ כְּעֵין הַחַשְׁמַל',
          },
          entities: [
            { word: 'gleaming amber', node: 'tradition-jewish-mysticism', type: 'symbol',
              note: 'The Hebrew "hashmal" — amber, electrum, or gleaming metal — became a central term in Jewish mystical speculation. The Talmud (Hagigah 13a) notes that a child began expounding hashmal\'s meaning and was consumed by fire. The word became untouchable — a marker of the deepest divine mystery. Kabbalists linked hashmal to the divine sparks (nitzotzot) scattered through creation; it is the visible edge of what cannot be looked at directly.',
              parallels: [
                { label: 'Rumi Masnavi — fire of love, not breath of air', textId: 'rumi-masnavi', note: 'Ezekiel\'s divine fire as the core of the vision and Rumi\'s "fire of Love" in the reed\'s cry — both use fire to indicate the non-ordinary, non-material nature of the divine encounter. For both Ezekiel and Rumi, fire is not destructive but revelatory.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Four Living Creatures (1:5–14)',
      verses: [
        {
          ref: '1:5–6',
          text: 'In the middle of it was something like four living creatures. This was their appearance: they were of human form. Each had four faces, and each of them had four wings.',
          textVersions: {
            nrsv: 'In the middle of it was something like four living creatures. This was their appearance: they were of human form. Each had four faces, and each of them had four wings.',
            hebrew: 'וּמִתּוֹכָהּ דְּמוּת אַרְבַּע חַיּוֹת וְזֶה מַרְאֵיהֶן דְּמוּת אָדָם לָהֵנָּה',
          },
          entities: [
            { word: 'four living creatures', node: 'merkabah-mysticism', type: 'symbol',
              note: 'The hayot — with faces of human, lion, ox, and eagle — became one of the most reproduced symbols in Western religious art. Early Christian interpreters mapped them to the four evangelists: Matthew (human, genealogy opening), Mark (lion, wilderness roar), Luke (ox, Temple sacrifice opening), John (eagle, soaring Logos). This "Tetramorph" appears on Romanesque church facades, Byzantine icons, and illuminated manuscripts. The fourfold structure mirrors the four directions, four elements, and Babylonian astronomical guardians (lamassu, shedu).',
              parallels: [
                { label: 'Revelation 4 — four living creatures before the throne', textId: 'revelation-12', note: 'Revelation 4:6-8 reproduces Ezekiel\'s hayot almost verbatim: lion, ox, human face, eagle. John adds the seraphic "holy, holy, holy" from Isaiah 6. The Ezekiel → Revelation transmission is one of the clearest cases of direct literary inheritance in the biblical canon.' },
                { label: 'Bhagavad Gita 11 — thousands of divine forms and faces', textId: 'bhagavad-gita-11', note: 'Ezekiel\'s four-faced hayot and Krishna\'s Vishvarupa with "many mouths and eyes, many wonderful sights" both use multiplication of faces to express divine totality. Four faces or ten thousand — the theological point is the same: divinity cannot be contained in a single form.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'Wheels Within Wheels (1:15–21)',
      verses: [
        {
          ref: '1:16',
          text: 'The wheels and their construction: their appearance was like the gleaming of beryl; and the four had the same form, their construction being something like a wheel within a wheel.',
          textVersions: {
            nrsv: 'The wheels and their construction: their appearance was like the gleaming of beryl; and the four had the same form, their construction being something like a wheel within a wheel.',
            hebrew: 'מַרְאֵה הָאוֹפַנִּים וּמַעֲשֵׂיהֶם כְּעֵין תַּרְשִׁישׁ וּדְמוּת אֶחָד לְאַרְבַּעְתָּם וּמַרְאֵיהֶם וּמַעֲשֵׂיהֶם כַּאֲשֶׁר יִהְיֶה הָאוֹפַן בְּתוֹךְ הָאוֹפָן',
          },
          entities: [
            { word: 'wheel within a wheel', node: 'merkabah-mysticism', type: 'symbol',
              note: 'Ophan be-tokh ha-ophan — a wheel within a wheel. The ophanim (wheel-beings) are a separate class of divine beings. Their interlocking wheels full of eyes suggest omniscient perception in all directions simultaneously. Merkabah mystics used this geometry as the template for ascending journeys through the divine halls (hekhalot). The geometric image of nested wheels is structurally related to the Kabbalistic Sefirot map — nested spheres of emanation, each containing and reflecting the others.',
              parallels: [
                { label: 'Sefer Yetzirah — the Sefirot as nested spheres of emanation', textId: 'sefer-yetzirah', note: 'The Sefer Yetzirah\'s ten sefirot and Ezekiel\'s nested wheels-within-wheels share a geometric intuition: divine reality is structured as nested spheres, each containing the others. The Merkabah vision is the prophetic prototype; Sefer Yetzirah is its first systematic theorization.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Glory of the LORD (1:26–28)',
      verses: [
        {
          ref: '1:26–28',
          text: 'And above the dome over their heads there was something like a throne, in appearance like sapphire; and seated above the likeness of a throne was something that seemed like a human form... This was the appearance of the likeness of the glory of the LORD. When I saw it, I fell on my face.',
          textVersions: {
            nrsv: 'And above the dome over their heads there was something like a throne, in appearance like sapphire; and seated above the likeness of a throne was something that seemed like a human form... This was the appearance of the likeness of the glory of the LORD. When I saw it, I fell on my face.',
            hebrew: 'וּמִמַּעַל לָרָקִיעַ אֲשֶׁר עַל-רֹאשָׁם כְּמַרְאֵה אֶבֶן-סַפִּיר דְּמוּת כִּסֵּא וְעַל דְּמוּת הַכִּסֵּא דְּמוּת כְּמַרְאֵה אָדָם עָלָיו מִלְמָעְלָה',
          },
          entities: [
            { word: 'the glory of the LORD', node: 'tradition-jewish-mysticism', type: 'concept',
              note: 'Kavod YHWH — the Glory of the LORD. Ezekiel piles up qualifiers: "appearance of the likeness of the glory" — not God directly, but a manifestation. This deliberate hedging is one of the most careful pieces of religious epistemology in ancient literature: I saw something I cannot describe directly. Later Kabbalists identified this with the Shekhinah (divine indwelling presence), and the Shi\'ur Komah literature attempted to describe the divine body-form Ezekiel saw, giving cosmic dimensions to each limb.',
              parallels: [
                { label: 'Apocryphon of John — the Monad described only in negations', textId: 'apocryphon-of-john', note: 'Ezekiel\'s triple-qualifier hedging ("appearance of the likeness of the glory") and the Apocryphon\'s apophatic Monad ("He is not a being among beings") are both attempts to describe what cannot be described. Ezekiel uses nested approximations; the Gnostic text uses systematic negation. Both acknowledge that ordinary language fails before the divine.' },
                { label: 'Poimandres — Hermes falls before the divine light', textId: 'corpus-hermeticum-1', note: 'Ezekiel falls on his face when he sees the kavod; Hermes is overwhelmed by Poimandres\' light. Both texts stage the same pattern: a human recipient is physically overcome by divine vision. The body registers what the mind cannot process.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

SCRIPTURE_TEXTS['john-3'] = {
  title: 'John 3 — Born Again / Born from Above',
  shortTitle: 'John 3',
  tradition: 'New Testament',
  date: 'c. 90–100 CE',
  intro: 'John chapter 3 contains one of the most famous and most misunderstood conversations in the Gospels: Nicodemus, a Pharisee and "teacher of Israel," comes to Jesus at night and is told he must be "born again" — or more precisely, "born from above," since the Greek anothen means both. Nicodemus takes it literally; Jesus means it spiritually. The conversation crystallizes the Fourth Gospel\'s central theological move: the descent of the Logos (John 1) must be replicated in the believer through spiritual rebirth (John 3). This rebirth through water and spirit (3:5) wires directly to the Corpus Hermeticum XIII\'s rebirth through the replacement of the "twelve tormentors" by "powers of God" — both texts describe an interior pneumatic transformation using the language of second birth. The ambiguity in anothen is not an accident: Gnostic readers took the spatial reading ("from above") as the key to the entire Fourth Gospel\'s vertical ontology, while proto-orthodox readers took the temporal reading ("again") as the key to baptismal theology.',
  crossTradition: [
    { label: 'Corpus Hermeticum XIII — rebirth through pneumatic regeneration', textId: 'corpus-hermeticum-13', note: 'CH XIII is the closest parallel in ancient literature to John 3. Tat asks Hermes about rebirth; Hermes explains it cannot be taught, only received. Jesus tells Nicodemus "the wind blows where it wishes — so it is with everyone born of the Spirit": pneumatic rebirth cannot be controlled or observed from outside. Both texts frustrate the questioner\'s demand for intellectual explanation and insist on experiential transformation.' },
    { label: 'Tao Te Ching 1 — the mystery that cannot be named or controlled', textId: 'tao-te-ching-1', note: 'Jesus\' "the wind/spirit blows where it wishes and you do not know where it comes or goes" is structurally similar to Laozi\'s Tao that cannot be grasped or named. Both describe an invisible ordering principle that operates freely, cannot be controlled, yet is the source of all life. Pneuma (wind/spirit in Greek) and Tao (way/flow in Chinese) are parallel concepts for the ungovernable ground.' },
    { label: 'Apocryphon of John — divine light imprisoned in matter', textId: 'apocryphon-of-john', note: 'The Gnostic reading of John 3: "born from above" means recognizing that one\'s true origin is the divine realm above, not the material world below. The Apocryphon\'s cosmology — divine sparks trapped in Yaldabaoth\'s world, needing gnosis to remember their origin — is a systematic theologization of John 3\'s vertical ontology. For Gnostics, anothen (from above) was the operative word.' },
    { label: 'Purusha Sukta — three-quarters immortal in heaven, one-quarter in the world', textId: 'purusha-sukta', note: 'John 3:13: "No one has ascended into heaven except the one who descended from heaven, the Son of Man." The Purusha Sukta\'s cosmic Person — three-quarters immortal in heaven, one-quarter manifesting below — establishes the same vertical structure. Rebirth in John is re-entry into the divine pattern that was always the origin.' },
  ],
  translations: [
    { id: 'nrsv', label: 'NRSV (T1)' },
    { id: 'greek', label: 'Greek (original)' },
  ],
  sections: [
    {
      heading: 'Nicodemus Comes by Night (3:1–3)',
      verses: [
        {
          ref: '3:1–2',
          text: 'Now there was a Pharisee named Nicodemus, a leader of the Jews. He came to Jesus by night and said to him, "Rabbi, we know that you are a teacher who has come from God; for no one can do these signs that you do apart from the presence of God."',
          textVersions: {
            nrsv: 'Now there was a Pharisee named Nicodemus, a leader of the Jews. He came to Jesus by night and said to him, "Rabbi, we know that you are a teacher who has come from God; for no one can do these signs that you do apart from the presence of God."',
            greek: 'Ἦν δὲ ἄνθρωπος ἐκ τῶν Φαρισαίων, Νικόδημος ὄνομα αὐτῷ, ἄρχων τῶν Ἰουδαίων· οὗτος ἦλθεν πρὸς αὐτὸν νυκτός',
          },
          entities: [
            { word: 'by night', node: 'logos', type: 'symbol',
              note: 'Nicodemus comes nuktos — by night — a loaded detail in the Fourth Gospel, where light and darkness are consistently theological categories. Night = the realm of ignorance. That Nicodemus comes in darkness signals his initial status: a man of learning who is still operating without illumination. By the Gospel\'s end (19:39), Nicodemus helps bury Jesus — having moved through darkness toward something else. The night framing echoes John 1\'s "the light shines in the darkness, and the darkness did not overcome it."',
              parallels: [
                { label: 'Apocryphon of John — John also comes in grief and darkness', textId: 'apocryphon-of-john', note: 'The Apocryphon opens with John (the apostle) leaving the Temple after the crucifixion in grief — also a movement through darkness toward revelation. Both seekers (Nicodemus and John) approach their revelation from a state of incomplete understanding, and both receive illuminating teaching in that state.' },
              ]
            },
          ]
        },
        {
          ref: '3:3',
          text: 'Jesus answered him, "Very truly, I tell you, no one can see the kingdom of God without being born from above."',
          textVersions: {
            nrsv: 'Jesus answered him, "Very truly, I tell you, no one can see the kingdom of God without being born from above."',
            greek: 'ἀπεκρίθη Ἰησοῦς καὶ εἶπεν αὐτῷ· ἀμὴν ἀμὴν λέγω σοι, ἐὰν μή τις γεννηθῇ ἄνωθεν, οὐ δύναται ἰδεῖν τὴν βασιλείαν τοῦ θεοῦ.',
          },
          entities: [
            { word: 'born from above', node: 'tradition-gnosticism', type: 'concept',
              note: 'Anothen — the crux. This Greek word means both "again" (temporal: a second time) and "from above" (spatial: from the divine realm). Nicodemus immediately takes the temporal reading: "How can anyone be born after having grown old?" Jesus means the spatial reading: descent from the divine realm as origin. The Fourth Gospel consistently uses misunderstanding as a pedagogical device — the reader is elevated above the character who misunderstands.',
              parallels: [
                { label: 'Corpus Hermeticum XIII — the true regeneration', textId: 'corpus-hermeticum-13', note: 'CH XIII opens: "You spoke in riddles about Divinity and did not teach clearly when you said that no one can be saved before Rebirth." Tat asks the same question Nicodemus asks. Hermes\' answer parallels Jesus\': it\'s not physical but pneumatic; it can\'t be explained, only received; the experience involves a dissolution of the old self.' },
                { label: 'Rumi Masnavi — exile from origin and the longing for return', textId: 'rumi-masnavi', note: 'Rumi\'s reed was cut from the reed bed — its origin above. The entire Masnavi is about longing to return to that origin. John 3\'s "born from above" is structurally the same: the human being has an origin in the divine realm, and spiritual birth is a recovery of that origin. Directionality: we are from above; we descended; we return.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'Spirit Like the Wind (3:5–8)',
      verses: [
        {
          ref: '3:5–6',
          text: 'Jesus answered, "Very truly, I tell you, no one can enter the kingdom of God without being born of water and Spirit. What is born of the flesh is flesh, and what is born of the Spirit is spirit."',
          textVersions: {
            nrsv: 'Jesus answered, "Very truly, I tell you, no one can enter the kingdom of God without being born of water and Spirit. What is born of the flesh is flesh, and what is born of the Spirit is spirit."',
            greek: 'ἀπεκρίθη Ἰησοῦς· ἀμὴν ἀμὴν λέγω σοι, ἐὰν μή τις γεννηθῇ ἐξ ὕδατος καὶ πνεύματος, οὐ δύναται εἰσελθεῖν εἰς τὴν βασιλείαν τοῦ θεοῦ.',
          },
          entities: [
            { word: 'born of water and Spirit', node: '', type: 'concept',
              note: 'Water and pneuma — the two birth media. Early Christian interpreters divided on what "water" means: baptism? Amniotic waters? The Torah? Most settled on baptism, making this verse the proof-text for baptismal theology. But Gnostics read "water" as the realm of the Demiurge (material) and "spirit" as the pneumatic principle — "born of water and spirit" meant moving from material birth to spiritual re-birth. The same two-word phrase carries radically different weight depending on which interpretive tradition receives it.',
              parallels: [
                { label: 'Bhagavad Gita 4 — the eternal self versus the mortal body', textId: 'bhagavad-gita-4', note: 'BG 2:20\'s atman that cannot be cut or burned and John 3\'s "what is born of the flesh is flesh, what is born of the spirit is spirit" establish the same ontological dualism: there is a mortal embodied level of existence and an immortal spiritual level. The spiritual birth (John) or the recognition of atman (BG) shifts identity from the first level to the second.' },
              ]
            },
          ]
        },
        {
          ref: '3:8',
          text: 'The wind blows where it chooses, and you hear the sound of it, but you do not know where it comes from or where it goes. So it is with everyone who is born of the Spirit.',
          textVersions: {
            nrsv: 'The wind blows where it chooses, and you hear the sound of it, but you do not know where it comes from or where it goes. So it is with everyone who is born of the Spirit.',
            greek: 'τὸ πνεῦμα ὅπου θέλει πνεῖ, καὶ τὴν φωνὴν αὐτοῦ ἀκούεις, ἀλλ᾽ οὐκ οἶδας πόθεν ἔρχεται καὶ ποῦ ὑπάγει· οὕτως ἐστὶν πᾶς ὁ γεγεννημένος ἐκ τοῦ πνεύματος.',
          },
          entities: [
            { word: 'wind blows where it chooses', node: 'pneuma', type: 'concept',
              note: 'Pneuma in Greek means both wind and spirit — the same pun operates in Hebrew (ruach), Arabic (ruh), and Sanskrit (prana). Jesus\' wind/spirit saying exploits this: you can hear the wind but not see where it comes from or goes — pneumatic rebirth has the same quality of invisible causality. This is Jesus\' most Taoist moment: the unpredictable, ungovernable movement of wind is the operative principle.',
              parallels: [
                { label: 'Tao Te Ching 1 — the Tao that cannot be named or grasped', textId: 'tao-te-ching-1', note: 'Laozi\'s Tao that cannot be named, flows everywhere without being seen, and generates all things without claiming credit — and Jesus\' pneuma that blows where it chooses and generates new birth in those it touches — are functionally equivalent concepts. Tao and pneuma are both invisible ordering principles that operate by spontaneous, ungovernable flow.' },
                { label: 'Corpus Hermeticum XIII — rebirth cannot be taught, only received', textId: 'corpus-hermeticum-13', note: 'Hermes tells Tat that regeneration happens through divine mercy when the moment is right — it cannot be explained in advance. Jesus tells Nicodemus that pneumatic birth is as uncontrollable as wind. Both texts refuse to give a technique or schedule: it is received, not manufactured.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'God So Loved the World (3:14–17)',
      verses: [
        {
          ref: '3:14–15',
          text: 'And just as Moses lifted up the serpent in the wilderness, so must the Son of Man be lifted up, that whoever believes in him may have eternal life.',
          textVersions: {
            nrsv: 'And just as Moses lifted up the serpent in the wilderness, so must the Son of Man be lifted up, that whoever believes in him may have eternal life.',
            greek: 'καὶ καθὼς Μωϋσῆς ὕψωσεν τὸν ὄφιν ἐν τῇ ἐρήμῳ, οὕτως ὑψωθῆναι δεῖ τὸν υἱὸν τοῦ ἀνθρώπου',
          },
          entities: [
            { word: 'Son of Man lifted up', node: 'logos', type: 'concept',
              note: 'Hypsothenai — "lifted up" — is a double meaning in John: physical crucifixion and theological exaltation. The Mosaic bronze serpent on a pole (Numbers 21:8-9) that healed snake-bitten Israelites becomes a type of the crucifixion: the instrument of death elevated to become an instrument of healing. This hypsosis theology runs through John 8:28 and 12:32-34, culminating in the cross as simultaneous death and glorification — the same paradoxical structure as the Purusha Sukta\'s sacrifice that creates the world.',
              parallels: [
                { label: 'Purusha Sukta — cosmic sacrifice as creative act', textId: 'purusha-sukta', note: 'The Purusha Sukta\'s cosmic sacrifice — the Purusha is dismembered to create the world — and John 3\'s Son of Man lifted up — the crucifixion as cosmic event generating eternal life — share the template: destruction of the divine body produces life for all creation. This is the structural core of the "dying god" pattern.' },
              ]
            },
          ]
        },
        {
          ref: '3:16–17',
          text: 'For God so loved the world that he gave his only Son, so that everyone who believes in him may not perish but may have eternal life. Indeed, God did not send the Son into the world to condemn the world, but in order that the world might be saved through him.',
          textVersions: {
            nrsv: 'For God so loved the world that he gave his only Son, so that everyone who believes in him may not perish but may have eternal life. Indeed, God did not send the Son into the world to condemn the world, but in order that the world might be saved through him.',
            greek: 'οὕτως γὰρ ἠγάπησεν ὁ θεὸς τὸν κόσμον, ὥστε τὸν υἱὸν τὸν μονογενῆ ἔδωκεν, ἵνα πᾶς ὁ πιστεύων εἰς αὐτὸν μὴ ἀπόληται ἀλλ᾽ ἔχῃ ζωὴν αἰώνιον.',
          },
          entities: [
            { word: 'God so loved the world', node: '', type: 'concept',
              note: 'Houtoos gar egapesen — "for God so loved." This is agape: the love that gives without requiring return. The giving of the Son is framed not as transaction but as divine generosity toward a world that did not earn it. John 3:16 without 3:17 ("not to condemn") shifts the theological weight from liberation to threat — the most popular verse in Christianity is frequently amputated from the sentence that defines it.',
              parallels: [
                { label: 'Coffin Text 1130 — Creator loves creation without distinction', textId: 'coffin-text-1130', note: 'The Egyptian Creator\'s declaration: "I made every man like his fellow; I did not command that they do wrong; it is their hearts that disobeyed what I said." Both the Coffin Text and John 3:16-17 locate in the Creator an unconditional love toward the created — and both note that creation\'s suffering originates not in the Creator\'s intent but in creation\'s own choices.' },
                { label: 'Rumi Masnavi — fire of Love that drives the reed\'s cry', textId: 'rumi-masnavi', note: 'Rumi\'s "fire of Love... has set the reed ablaze" and John 3:16\'s love that gives the Son into the world are the same orientation: divine love as self-giving movement toward the created. For both Rumi and John, love is the cosmological engine — the reason the divine descends.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

SCRIPTURE_TEXTS['bhagavad-gita-11'] = {
  title: 'Bhagavad Gita 11 — The Cosmic Vision (Vishvarupa)',
  shortTitle: 'BG 11',
  tradition: 'Hindu',
  date: 'c. 200 BCE–200 CE',
  intro: 'Chapter 11 of the Bhagavad Gita is the pivot of the entire Mahabharata: Arjuna has listened to Krishna\'s teaching through ten chapters and now asks to see the divine form (deva-rupa) that underlies the teaching. Krishna grants divine eyes (divya-chakshu) because human sight cannot bear what follows: the Vishvarupa, the Universal Form — thousands of faces, eyes, mouths, and forms simultaneously; blazing suns; consuming fire; the totality of past, present, and future compressed into one terrifying vision. Arjuna is overwhelmed and begs Krishna to return to his "gentle human form." The chapter ends with Krishna\'s declaration: this form has never been seen through Vedic study, austerity, gifts, or sacrifice — only through undivided devotion (bhakti). BG 11 is structurally parallel to the great prophetic throne visions — Ezekiel 1, Isaiah 6, Revelation 4 — but its theological point is inverted: the cosmic form is revealed precisely so that Arjuna will understand why to love the personal form.',
  crossTradition: [
    { label: 'Ezekiel 1 — the Merkabah throne vision', textId: 'ezekiel-1', note: 'Ezekiel\'s vision of the kavod — a radiant divine figure above the chariot-throne, too brilliant to look at directly — and Arjuna\'s Vishvarupa — "blazing like fires, like the sun, dazzling, immeasurable" — are both the experience of divine totality by a single human recipient. Both Ezekiel and Arjuna fall prostrate. Both receive the vision as commissioned servants.' },
    { label: 'Revelation 4 — Christ in cosmic form', textId: 'revelation-12', note: 'John\'s vision of Christ in Revelation 1 — "face like the sun shining with full force," "voice like the sound of many waters" — reproduces the BG 11 template: the familiar teacher transfigured into an overwhelming cosmic form. In BG 11, Arjuna recognizes Krishna but cannot sustain the vision; in Revelation 1, John recognizes Christ but falls "as though dead."' },
    { label: 'Corpus Hermeticum XI — the all-is-one meditation', textId: 'corpus-hermeticum-11', note: 'CH XI\'s instruction to "expand your soul to immeasurable size, encompass all time and space, become the universe" is the meditative technique for approaching what BG 11 shows by divine gift. Hermes demands Nous expand to infinity; Krishna simply shows it. Both texts aim at the same cognitive event: the dissolution of the bounded self-perception before the totality.' },
    { label: 'Apocryphon of John — the Monad with no beginning or end', textId: 'apocryphon-of-john', note: 'Arjuna sees in Krishna "no end, no middle, no beginning" (11:16). The Apocryphon\'s Monad: "He does not exist in eternity but eternity exists in him." Both texts use apophatic temporal negation — no beginning, no end — to point toward divine being that contains time rather than being contained by it.' },
  ],
  translations: [
    { id: 'easwaran', label: 'Easwaran 2007 (T2)' },
    { id: 'sanskrit', label: 'Sanskrit (original)' },
  ],
  sections: [
    {
      heading: 'Arjuna\'s Request (11:3–4)',
      verses: [
        {
          ref: '11:3–4',
          text: 'O Supreme Lord, you are exactly as you have described yourself to be. Now I want to see your divine form. If you think I am strong enough to behold it, show me your unchanging self, O Lord of Yoga.',
          textVersions: {
            easwaran: 'O Supreme Lord, you are exactly as you have described yourself to be. Now I want to see your divine form. If you think I am strong enough to behold it, show me your unchanging self, O Lord of Yoga.',
            sanskrit: 'manyase yadi tac chakkyaṃ mayā draṣṭum iti prabho | yogeśvara tato me tvaṃ darśayātmānam avyayam',
          },
          entities: [
            { word: 'strong enough to behold it', node: 'krishna', type: 'concept',
              note: 'Arjuna asks whether he has the capacity (shakti) to endure the divine vision. This condition — that the recipient must be prepared — appears across mystical traditions. In Merkabah Judaism, the Chariot vision was restricted to mature scholars; in the Platonic tradition, only the philosopher who has ascended through mathematics can see the Good; in the Hermetic tradition, only the purified soul encounters Poimandres. The divine vision tests its recipient\'s readiness.',
              parallels: [
                { label: 'Ezekiel 1 — Ezekiel prepared by exile at the Chebar canal', textId: 'ezekiel-1', note: 'Ezekiel receives his vision "among the exiles" — in the extreme displacement of the Babylonian exile. Both Arjuna (in the crisis of imminent battle) and Ezekiel (in the trauma of exile) receive the vision in extremis. The divine vision appears at the limit of ordinary human experience.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Vision Granted (11:10–12)',
      verses: [
        {
          ref: '11:10–11',
          text: 'Arjuna saw in that universal form unlimited mouths, unlimited eyes, unlimited wonderful visions. The form was decorated with many celestial ornaments and bore many divine upraised weapons. All was wondrous, brilliant, unlimited, all-expanding.',
          textVersions: {
            easwaran: 'Arjuna saw in that universal form unlimited mouths, unlimited eyes, unlimited wonderful visions. The form was decorated with many celestial ornaments and bore many divine upraised weapons. All was wondrous, brilliant, unlimited, all-expanding.',
            sanskrit: 'aneka-vaktra-nayanam anekādbhuta-darśanam | aneka-divyābharaṇaṃ divyānekodyatāyudham',
          },
          entities: [
            { word: 'unlimited mouths, unlimited eyes', node: 'brahman', type: 'symbol',
              note: 'Aneka — countless, innumerable. This Sanskrit term refuses to specify a number because totality cannot be counted. The multiplication of faces and eyes expresses omnipresence and omniscience: a being that faces all directions simultaneously knows everything simultaneously. This is visually related to Ezekiel\'s hayot (four faces) and ophanim (wheels full of eyes) — the same theological intuition expressed differently. The Vishvarupa takes Ezekiel\'s four-fold structure and multiplies it to infinity.',
              parallels: [
                { label: 'Ezekiel 1 — four living creatures with four faces, wheels full of eyes', textId: 'ezekiel-1', note: 'Ezekiel\'s hayot have four faces and the wheels have eyes all around them. BG 11\'s Vishvarupa has unlimited faces and eyes. Both use multiplication to express divine omniscience and omnipresence: the step from four to infinity is a step from Hebrew specificity to Hindu mathematical expansion.' },
              ]
            },
          ]
        },
        {
          ref: '11:12',
          text: 'If hundreds of thousands of suns were to rise at once into the sky, their radiance might resemble the effulgence of the Supreme Person in that universal form.',
          textVersions: {
            easwaran: 'If hundreds of thousands of suns were to rise at once into the sky, their radiance might resemble the effulgence of the Supreme Person in that universal form.',
            sanskrit: 'divi sūrya-sahasrasya bhaved yugapad utthitā | yadi bhāḥ sadṛśī sā syād bhāsas tasya mahātmanaḥ',
          },
          entities: [
            { word: 'hundreds of thousands of suns', node: 'surya', type: 'symbol',
              note: 'Sahasra sūrya — a thousand suns. J. Robert Oppenheimer quoted BG 11:32 at the Trinity nuclear test (1945): "Now I am become Death, the destroyer of worlds." The thousand-suns image captures what nuclear light actually looked like — a flash brighter than any natural phenomenon. The ancient author reached for the most extreme natural radiance; modern physics finally produced something that matched it.',
              parallels: [
                { label: 'Hymn to Aten — the sun as the face of the single divine reality', textId: 'hymn-to-aten', note: 'Akhenaten\'s hymn describes the Aten (solar disk) as the source of all life, beauty, and sustenance. BG 11\'s thousand suns and the Hymn to Aten\'s singular sun both locate divine presence in solar radiance. Monotheism and henotheism both reach toward the sun as the closest natural analogy for the divine that pervades all things.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'Arjuna is Overwhelmed (11:15–17)',
      verses: [
        {
          ref: '11:15–17',
          text: 'Arjuna said: My dear Lord, I see assembled in your body all the demigods and various other beings. I see Brahma sitting on the lotus flower as well as Lord Shiva. I see in your body many, many arms, bellies, mouths, and eyes, expanded everywhere, without limit. I see in you no end, no middle, and no beginning.',
          textVersions: {
            easwaran: 'Arjuna said: My dear Lord, I see assembled in your body all the demigods and various other beings. I see Brahma sitting on the lotus flower as well as Lord Shiva. I see in your body many, many arms, bellies, mouths, and eyes, expanded everywhere, without limit. I see in you no end, no middle, and no beginning.',
            sanskrit: 'paśyāmi devāṃs tava deva dehe sarvāṃs tathā bhūta-viśeṣa-saṃghān | brahmāṇam īśaṃ kamalāsana-stham ṛṣīṃś ca sarvān uragāṃś ca divyān',
          },
          entities: [
            { word: 'no end, no middle, and no beginning', node: 'brahman', type: 'concept',
              note: 'Anādi — beginningless. Ananta — endless. Arjuna describes what he sees in mathematical-theological terms that directly parallel the Apocryphon\'s apophatic Monad ("he has no beginning, he has no end") and the Hermetic Corpus\'s description of God as the sphere whose center is everywhere. All three traditions reach the same logical structure: absolute divine totality transcends the temporal and spatial categories that bound all created things.',
              parallels: [
                { label: 'Apocryphon of John — "He is eternal, he has no beginning, no end"', textId: 'apocryphon-of-john', note: 'The Apocryphon\'s Monad: "He does not exist in eternity but eternity exists in him." Arjuna\'s vision: "no beginning, no middle, no end." Both use apophatic temporal negation to point toward divine being that contains time rather than being contained by it.' },
                { label: 'Corpus Hermeticum XI — God contains all things as thoughts', textId: 'corpus-hermeticum-11', note: 'CH XI: "God contains all things — worlds, gods, all the rest of creation — as thoughts within himself." Arjuna sees all demigods within Krishna\'s body. Both texts stage the same revelation: the particular divine form (Krishna / the Nous) contains all other divine and created beings within itself.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'I Am Time (11:32)',
      verses: [
        {
          ref: '11:32',
          text: 'The Blessed Lord said: Time I am, the great destroyer of the worlds, and I have come here to destroy all people. With the exception of you, all the soldiers here on both sides will be slain.',
          textVersions: {
            easwaran: 'The Blessed Lord said: Time I am, the great destroyer of the worlds, and I have come here to destroy all people. With the exception of you, all the soldiers here on both sides will be slain.',
            sanskrit: 'kālo\'smi loka-kṣaya-kṛt pravṛddho lokān samāhartum iha pravṛttaḥ | ṛte\'pi tvāṃ na bhaviṣyanti sarve ye\'vasthitāḥ pratyanīkeṣu yodhāḥ',
          },
          entities: [
            { word: 'Time I am, the great destroyer', node: 'kali', type: 'concept',
              note: 'Kālo\'smi — "I am Time/Death." The Cosmic Form speaks: all the warriors are already slain — time has already consumed them; the battle has already happened from the divine perspective. What humans experience as the future is, from the divine view, already accomplished. Oppenheimer quoted this verse at the Trinity nuclear test. The "destroyer" is not malevolent — it is the natural end-point of all temporal forms within the divine totality.',
              parallels: [
                { label: 'Völuspá — Ragnarök already foreknown by the Seeress', textId: 'voluspa', note: 'The Norse Seeress sees the destruction of the world from outside time. Krishna shows Arjuna that the warriors\' deaths are already accomplished; the Völva narrates cosmic destruction as vision, not prediction. Both encode the same insight: divine or prophetic vision is time-transcending — what appears as future to humans is already present to the seer.' },
                { label: 'Revelation 12 — cosmic warfare seen from the divine vantage', textId: 'revelation-12', note: 'Revelation\'s cosmic warfare — the Dragon, the Woman, the battle in heaven — and BG 11\'s cosmic destruction of the armies share the structure of terrestrial conflict seen from a cosmic perspective. In both, the spiritual dimension of the battle is revealed as prior to and determining the earthly dimension.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

SCRIPTURE_TEXTS['zhuangzi'] = {
  title: 'Zhuangzi — Butterfly Dream & Cook Ding',
  shortTitle: 'Zhuangzi',
  tradition: 'Taoist',
  date: 'c. 369–286 BCE',
  intro: 'Zhuangzi (Chuang Tzu) is the second great Taoist classic, radically different from the Tao Te Ching in form: instead of 81 brief aphorisms, Zhuangzi deploys parables, dialogues, and paradoxes designed to dislodge habitual categories. The most famous passage is the Butterfly Dream (Chapter 2): "I do not know whether I was then a man dreaming I was a butterfly, or whether I am now a butterfly dreaming I am a man." This is not skepticism about reality but an investigation into identity: what is the "definite barrier" (huà) between forms? The Cook Ding parable (Chapter 3) shows a butcher whose knife has never dulled in nineteen years because he cuts along the natural joints — following Tao rather than forcing. Together, these passages establish Zhuangzi\'s central claim: the sage does not impose categories on reality but flows with its natural articulations. The death passage (Chapter 6) extends this to mortality itself: Zhuangzi sings at his wife\'s death because he can trace her being backward to the undifferentiated original flux. These are not abstract positions — they are lived demonstrations of what it means to embody the Tao.',
  crossTradition: [
    { label: 'Tao Te Ching 1 — the Tao that cannot be named', textId: 'tao-te-ching-1', note: 'The Tao Te Ching states the Tao and names the problem; Zhuangzi enacts the solution through story and paradox. Where Laozi says "the Tao that can be spoken is not the eternal Tao," Zhuangzi shows what it means to live without fixed names: the butterfly dream dissolves "man" and "butterfly" into a fluid identity, demonstrating through narrative what Laozi stated theoretically.' },
    { label: 'Corpus Hermeticum XI — become all things, expand to infinity', textId: 'corpus-hermeticum-11', note: 'CH XI instructs: "Think of yourself as everywhere at once... become the universe." The butterfly dream\'s dissolution of the man/butterfly boundary is a narrative enactment of the Hermetic expansion of self. For Hermes, the expansion is an ascent to the all; for Zhuangzi, it is a dissolution of boundaries. Different directional metaphors, same cognitive event.' },
    { label: 'Apocryphon of John — real identity concealed by Yaldabaoth\'s categories', textId: 'apocryphon-of-john', note: 'The Apocryphon teaches that Yaldabaoth has imprisoned divine sparks in a world of false names and categories — making humans believe they are material beings rather than pneumatic ones. Zhuangzi\'s butterfly dream challenges the same assumption: the "man" identity is a category imposed on a more fluid reality. Both texts use "what am I really?" as a liberation technique.' },
    { label: 'Nasadiya Sukta — before categories, the undifferentiated', textId: 'nasadiya-sukta', note: 'The Nasadiya\'s pre-creation state — "neither being nor non-being" — and Zhuangzi\'s pre-wife state — "no life, no form, no energy, original flux" — are the same metaphysical territory: the undifferentiated ground from which particular forms emerge and to which they return. Both texts locate liberation in recognizing this ground as primary.' },
  ],
  translations: [
    { id: 'watson', label: 'Watson 1968 (T1)' },
    { id: 'chinese', label: 'Classical Chinese (original)' },
  ],
  sections: [
    {
      heading: 'The Butterfly Dream (Chapter 2)',
      verses: [
        {
          ref: 'Ch.2',
          text: 'Once upon a time, I, Chuang Tzu, dreamt I was a butterfly, fluttering hither and thither, to all intents and purposes a butterfly. I was conscious only of my happiness as a butterfly, unaware that I was Chuang Tzu. Soon I awaked, and there lay Chuang Tzu on his bed. But I know not whether I was then a man dreaming I was a butterfly, or whether I am now a butterfly dreaming I am a man.',
          textVersions: {
            watson: 'Once upon a time, I, Chuang Tzu, dreamt I was a butterfly, fluttering hither and thither, to all intents and purposes a butterfly. I was conscious only of my happiness as a butterfly, unaware that I was Chuang Tzu. Soon I awaked, and there lay Chuang Tzu on his bed. But I know not whether I was then a man dreaming I was a butterfly, or whether I am now a butterfly dreaming I am a man.',
            chinese: '昔者莊周夢為蝴蝶，栩栩然蝴蝶也，自喻適志與！不知周也。俄然覺，則蘧蘧然周也。不知周之夢為蝴蝶與？蝴蝶之夢為周與？',
          },
          entities: [
            { word: 'dreaming I was a butterfly', node: 'maya', type: 'concept',
              note: 'The most economical formulation of the consciousness-reality problem in world literature. Zhuangzi doesn\'t answer the question because the question itself reveals the problem: we assume there is a definite, stable identity that is "really me." The dream dissolves this assumption. The same device appears in Hindu māyā doctrine (what we take as real is a kind of waking dream), in the Apocryphon\'s divine sparks "dreaming" they are material humans, and in the Hermetic teaching that the soul has "fallen asleep" in matter.',
              parallels: [
                { label: 'Apocryphon of John — souls dreaming they are material beings', textId: 'apocryphon-of-john', note: 'Yaldabaoth creates souls who forget their divine origin and believe they are material beings — a cosmic dream of false identity. Zhuangzi\'s dreaming-butterfly plays the same epistemological trick: is my current identity the "real" one, or am I something else temporarily identified with this form?' },
                { label: 'Chandogya Upanishad — tat tvam asi', textId: 'chandogya-6-2', note: 'Uddalaka teaches that Shvetaketu\'s "self" (atman) is not the bounded individual but Brahman, the universal ground. "That art thou." Zhuangzi\'s question "which was the real me?" and Chandogya\'s answer "neither — you are the ground of both" are the same investigation from different directions.' },
              ]
            },
            { word: 'definite barrier', node: 'tao', type: 'concept',
              note: 'The key philosophical term that follows: "zhī jiān" — a "definite barrier" or "necessary transition." Zhuangzi continues: "There must be a definite barrier between man and butterfly. The transition is called the Transformation of Material Things (wù huà)." Every apparent identity is just a phase in the continuous transformation of Tao. There are no fixed categories, only ongoing flux — and therefore no grounds for suffering over losing what we are.',
              parallels: [
                { label: 'Tao Te Ching 1 — the named is the mother of ten thousand things', textId: 'tao-te-ching-1', note: 'Laozi: "The named is the mother of ten thousand things" — naming creates the categories. Zhuangzi: the barrier between butterfly and man is constructed by naming. Both texts identify naming/categorizing as the act that generates apparent multiplicity from the underlying unity of Tao. Dissolving the names dissolves the barriers.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'Cook Ding and the Ox (Chapter 3)',
      verses: [
        {
          ref: 'Ch.3a',
          text: 'Prince Hui\'s cook was cutting up a bull. Every blow of his hand, every heave of his shoulders, every tread of his foot, every thrust of his knee — zip! zowie! — all was in perfect rhythmic tune, like the Mulberry Grove dance. "Excellent!" cried the Prince. "Your skill is perfect!" "What I follow is Tao," said the cook, "beyond skill."',
          textVersions: {
            watson: 'Prince Hui\'s cook was cutting up a bull. Every blow of his hand, every heave of his shoulders, every tread of his foot, every thrust of his knee — zip! zowie! — all was in perfect rhythmic tune, like the Mulberry Grove dance. "Excellent!" cried the Prince. "Your skill is perfect!" "What I follow is Tao," said the cook, "beyond skill."',
            chinese: '庖丁為文惠君解牛，手之所觸，肩之所倚，足之所履，膝之所踦，砉然嚮然，奏刀騞然，莫不中音。合於桑林之舞，乃中經首之會。',
          },
          entities: [
            { word: 'What I follow is Tao, beyond skill', node: 'tao', type: 'concept',
              note: 'Pao Ding\'s response distinguishes technique (shu) from Tao. He has moved past technique into the direct perception of the natural structure of the ox — its joints, cavities, and textures — and moves through that structure without forcing. This is wu-wei (non-action/non-forcing) as embodied practice: the knife glides through natural spaces rather than cutting through material resistance. The knife has never dulled in nineteen years because it never meets resistance.',
              parallels: [
                { label: 'Tao Te Ching 1 — the Tao that does nothing and leaves nothing undone', textId: 'tao-te-ching-1', note: 'Laozi\'s Tao that "does nothing and leaves nothing undone" and Cook Ding\'s Tao "beyond skill" are the same principle at different scales. Laozi describes it cosmologically; Zhuangzi shows it in a butcher\'s kitchen. The sage\'s craft is enacted Tao — spontaneous, effective, leaving no waste.' },
                { label: 'Bhagavad Gita 4 — action without attachment to results', textId: 'bhagavad-gita-4', note: 'BG 4\'s "action in inaction" (naishkarmya) and Cook Ding\'s knife that never dulls describe the same phenomenon: when action aligns perfectly with the underlying order (Tao / dharma / divine will), it requires no effort and produces no depletion.' },
              ]
            },
          ]
        },
        {
          ref: 'Ch.3b',
          text: '"I work with my mind and not with my eye. My mind works along without the control of the senses. Falling back upon eternal principles, I glide through such great joints or cavities as there may be, according to the natural constitution of the animal."',
          textVersions: {
            watson: '"I work with my mind and not with my eye. My mind works along without the control of the senses. Falling back upon eternal principles, I glide through such great joints or cavities as there may be, according to the natural constitution of the animal."',
            chinese: '以神遇而不以目視，官知止而神欲行。依乎天理，批大郤，導大窾，因其固然。',
          },
          entities: [
            { word: 'eternal principles', node: 'tao', type: 'concept',
              note: 'Tiān lǐ — "heavenly principles" or "natural order." The cook follows the inherent natural structure of the animal as it expresses the universal Tao. This is precisely Plato\'s formulation in Phaedrus 265e — the art of "carving nature at its joints." Both Zhuangzi and Plato use the butcher/carving metaphor for wisdom: the wise person finds and follows the natural structure rather than imposing an arbitrary one.',
              parallels: [
                { label: 'Plato Timaeus — the Demiurge following eternal patterns', textId: 'plato-timaeus', note: 'Plato\'s Timaeus shows the Demiurge creating the cosmos by looking toward the eternal pattern (paradeigma). Cook Ding follows the heavenly principle (tiān lǐ) inherent in the ox. Both texts establish that the highest craft consists of discovering and following a pre-existing order — the Demiurge carves the cosmos at its natural joints.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'Zhuangzi Sings at his Wife\'s Death (Chapter 6)',
      verses: [
        {
          ref: 'Ch.6',
          text: 'When Zhuangzi\'s wife died, Huizi found him singing and drumming on a bowl. "You lived with her and raised children," said Huizi, "and now she\'s dead — is it not enough that you do not weep? You sing!" Zhuangzi said: "When she first died, do you think I did not grieve?... But I looked back at her beginning and there was originally no life, no form, no energy. In the midst of the original flux, there was a change — and there was energy, then form, then life. Now there is another change and she is dead. This is like the progression of the four seasons. I do not weep for her return to her origin."',
          textVersions: {
            watson: 'When Zhuangzi\'s wife died, Huizi found him singing and drumming on a bowl. "You lived with her and raised children," said Huizi, "and now she\'s dead — is it not enough that you do not weep? You sing!" Zhuangzi said: "When she first died, do you think I did not grieve?... But I looked back at her beginning and there was originally no life, no form, no energy. In the midst of the original flux, there was a change — and there was energy, then form, then life. Now there is another change and she is dead. This is like the progression of the four seasons. I do not weep for her return to her origin."',
            chinese: '莊子妻死，惠子弔之，莊子則方箕踞鼓盆而歌。惠子曰：「與人居，長子老身，死不哭亦足矣，又鼓盆而歌，不亦甚乎！」',
          },
          entities: [
            { word: 'return to her origin', node: 'apophatic-mysticism', type: 'concept',
              note: 'Zhuangzi traces his wife\'s being backward: from death → back to no form → back to no energy → back to the undifferentiated original flux (hun-tun). She has returned to what she was before her particular form emerged. Grief is the mistake of thinking her particular form was the real thing; liberation is recognizing that the form was a temporary crystallization of the eternal flux. Zhuangzi says he did grieve at first — this is not emotional suppression but genuine philosophical transformation.',
              parallels: [
                { label: 'Nasadiya Sukta — before creation, undifferentiated "that"', textId: 'nasadiya-sukta', note: 'The Nasadiya\'s pre-creation state — "neither being nor non-being," neither death nor immortality — and Zhuangzi\'s pre-wife state — "no life, no form, no energy, original flux" — are the same metaphysical territory. Both texts locate liberation in recognizing this undifferentiated ground as primary and individual forms as secondary.' },
                { label: 'Rumi Masnavi — the reed\'s return to the reed bed', textId: 'rumi-masnavi', note: 'Rumi\'s reed cries because it was cut from its origin. Zhuangzi\'s wife has returned to hers. Both frame existence as a temporary separation from the origin and death as a return. Rumi mourns the separation; Zhuangzi sings at the return. Different emotional valences of the same metaphysical structure.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── BATCH 7 ─────────────────────────────────────────────────────────────────

SCRIPTURE_TEXTS['isaiah-6'] = {
  title: 'Isaiah 6 — The Throne Vision & the Trishagion',
  shortTitle: 'Isaiah 6',
  tradition: 'Hebrew Bible',
  date: 'c. 740 BCE',
  intro: 'Isaiah 6 is the prophet\'s inaugural vision — his commissioning scene — and one of the most influential throne visions in all of religious literature. The year is 740 BCE, the year King Uzziah died. Isaiah sees the divine throne room: the LORD seated on a high and exalted throne, the hem of his robe filling the Temple. Above the throne stand seraphim with six wings — two covering their faces, two covering their feet, two for flying — crying "Holy, holy, holy is the LORD of hosts; the whole earth is full of his glory" (the Trishagion). Isaiah is undone: "Woe is me! I am lost, for I am a man of unclean lips." A seraph touches his lips with a burning coal from the altar — purification — and the voice asks "Whom shall I send?" Isaiah answers "Here I am; send me." The Trishagion became the central liturgical acclamation of Jewish and Christian worship; the structure of vision → undoing → purification → commissioning became the template for prophetic literature from Ezekiel to Revelation. The seraphim\'s "the whole earth is full of his glory" is the prophetic answer to Ezekiel\'s "the appearance of the likeness of the glory of the LORD" — not a hidden, qualified radiance, but a presence that fills all things.',
  crossTradition: [
    { label: 'Ezekiel 1 — the throne vision template', textId: 'ezekiel-1', note: 'Isaiah 6 and Ezekiel 1 are the two great throne visions of the Hebrew prophets. Isaiah sees the throne directly and is undone; Ezekiel sees it through four degrees of qualification ("appearance of the likeness of the glory"). Both involve the prophet falling before the divine presence. Revelation 4 synthesizes them: the four living creatures come from Ezekiel, the "holy, holy, holy" comes from Isaiah.' },
    { label: 'Bhagavad Gita 11 — the terrifying divine form that overwhelms the recipient', textId: 'bhagavad-gita-11', note: 'Isaiah\'s "Woe is me! I am undone" before the divine throne and Arjuna\'s terror before the Vishvarupa — "my mind is bewildered... I am unable to stand" — are the same human response to divine totality. Both receive a commissioning after the overwhelming vision; both are sent back into the world with a mission.' },
    { label: 'Corpus Hermeticum XIII — the final hymn to the All', textId: 'corpus-hermeticum-13', note: 'CH XIII closes with the secret hymn of rebirth: "Silence! for I am about to hymn the Lord of creation." The Trishagion ("Holy, holy, holy") and the Hermetic silent hymn are both acts of worship before divine totality that exceed ordinary language. Both texts locate the divine acclamation at the culmination of a transformation process.' },
    { label: 'Apocryphon of John — Barbelo as the divine throne room', textId: 'apocryphon-of-john', note: 'Isaiah\'s seraphim crying "holy, holy, holy" before the enthroned LORD and the Apocryphon\'s Barbelo as the First Thought before the Monad — both texts stage a divine inner court where the highest divine realities exist in perpetual worship of the unmanifest. The Gnostic texts took Isaiah\'s throne room as a map of the Pleroma.' },
  ],
  translations: [
    { id: 'nrsv', label: 'NRSV (T1)' },
    { id: 'hebrew', label: 'Hebrew (original)' },
  ],
  sections: [
    {
      heading: 'The Throne Room (6:1–4)',
      verses: [
        {
          ref: '6:1–2',
          text: 'In the year that King Uzziah died, I saw the Lord sitting on a throne, high and lofty; and the hem of his robe filled the temple. Seraphs were in attendance above him; each had six wings: with two they covered their faces, and with two they covered their feet, and with two they flew.',
          textVersions: {
            nrsv: 'In the year that King Uzziah died, I saw the Lord sitting on a throne, high and lofty; and the hem of his robe filled the temple. Seraphs were in attendance above him; each had six wings: with two they covered their faces, and with two they covered their feet, and with two they flew.',
            hebrew: 'בִּשְׁנַת-מוֹת הַמֶּלֶךְ עֻזִּיָּהוּ וָאֶרְאֶה אֶת-אֲדֹנָי יֹשֵׁב עַל-כִּסֵּא רָם וְנִשָּׂא וְשׁוּלָיו מְלֵאִים אֶת-הַהֵיכָל',
          },
          entities: [
            { word: 'seraphs', node: 'tradition-jewish-mysticism', type: 'symbol',
              note: 'Seraphim — the burning ones (from saraph, to burn). They appear only here in the Hebrew Bible, in sharp contrast to the hayot of Ezekiel and the cherubim of Genesis and the Ark. Their six wings and their perpetual acclamation made them the model for the highest angelic order in later Jewish and Christian angelology. The covering of faces and feet with wings expresses the paradox of divine service: even those closest to the divine cannot look at it or move through their own will; they are sustained in perpetual adoration.',
              parallels: [
                { label: 'Ezekiel 1 — the hayot with four wings and four faces', textId: 'ezekiel-1', note: 'Ezekiel\'s four-faced hayot (later six wings in Ezekiel 1:6, four in 10:21 — the text is inconsistent) and Isaiah\'s six-winged seraphim are both attempts to describe the divine throne court. Revelation 4 fuses them: "the four living creatures... each of them with six wings, full of eyes all around and inside." The seraphim\'s six wings and the hayot\'s four faces become a single composite being in John\'s synthesis.' },
              ]
            },
          ]
        },
        {
          ref: '6:3',
          text: 'And one called to another and said: "Holy, holy, holy is the LORD of hosts; the whole earth is full of his glory."',
          textVersions: {
            nrsv: 'And one called to another and said: "Holy, holy, holy is the LORD of hosts; the whole earth is full of his glory."',
            hebrew: 'וְקָרָא זֶה אֶל-זֶה וְאָמַר קָדוֹשׁ קָדוֹשׁ קָדוֹשׁ יְהוָה צְבָאוֹת מְלֹא כָל-הָאָרֶץ כְּבוֹדוֹ',
          },
          entities: [
            { word: 'Holy, holy, holy', node: 'tradition-jewish-mysticism', type: 'concept',
              note: 'Qadosh qadosh qadosh — the Trishagion, the triple holiness. Hebrew uses repetition for emphasis; triple repetition indicates the superlative. This acclamation became the Kedushah in Jewish liturgy, the Sanctus in Christian Mass, and the Qaddus in Islamic theology. It is the only moment in the Hebrew Bible where a divine attribute is repeated three times — making holiness the supreme divine quality, surpassing power, wisdom, or love as the primary descriptor. The Trishagion crossed every boundary: Jewish, Christian, Islamic, and Eastern Christian liturgies all use it.',
              parallels: [
                { label: 'Corpus Hermeticum XIII — the silent hymn of the reborn', textId: 'corpus-hermeticum-13', note: 'The CH XIII\'s secret hymn: "Holy is God and Father of all... Holy art thou, by whose will nature was perfected... Holy art thou, O Silence." The Trishagion and the Hermetic triple "holy" both use threefold repetition to approach the divine — and both locate holiness at the center of what the divine is. The Hermetic hymn is the personal replication of what the seraphim perform cosmically.' },
                { label: 'Bhagavad Gita 11 — all worlds crying out before the Vishvarupa', textId: 'bhagavad-gita-11', note: 'The seraphim crying "holy, holy, holy" before the throne and Arjuna\'s description of the cosmos bowing and flowing into the Vishvarupa (11:36: "The world rejoices and is delighted by your glory") are both scenes of cosmic worship — the entire creation in a posture of adoration before the divine totality.' },
              ]
            },
            { word: 'the whole earth is full of his glory', node: '', type: 'concept',
              note: 'M\'lo kol ha-aretz k\'vodo — "the fullness of all the earth is his glory." This is a radical claim: the divine kavod is not hidden in a throne room above the Temple but fills the entire creation. This verse is the prophetic bridge between the hidden, esoteric kavod of Ezekiel 1 and the Psalms\' "the heavens declare the glory of God" (19:1). For the Kabbalists, this verse proved that the divine presence (Shekhinah) permeates all of physical reality — the foundation of immanence theology in Judaism.',
              parallels: [
                { label: 'Corpus Hermeticum XI — everything is full of God', textId: 'corpus-hermeticum-11', note: 'CH XI: "Everything is full of God" (panta plere tou theou). Isaiah\'s "the whole earth is full of his glory" and Hermes\' "everything is full of God" are the same theological claim from different traditions: divine presence is not confined to a holy place but pervades all of creation. This is the strongest cross-tradition parallel for immanence theology.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'Undoing and Purification (6:5–7)',
      verses: [
        {
          ref: '6:5–7',
          text: 'And I said: "Woe is me! I am lost, for I am a man of unclean lips, and I live among a people of unclean lips; yet my eyes have seen the King, the LORD of hosts!" Then one of the seraphs flew to me, holding a live coal that had been taken from the altar with a pair of tongs. The seraph touched my mouth with it and said: "Now that this has touched your lips, your guilt has departed and your sin is blotted out."',
          textVersions: {
            nrsv: 'And I said: "Woe is me! I am lost, for I am a man of unclean lips, and I live among a people of unclean lips; yet my eyes have seen the King, the LORD of hosts!" Then one of the seraphs flew to me, holding a live coal that had been taken from the altar with a pair of tongs. The seraph touched my mouth with it and said: "Now that this has touched your lips, your guilt has departed and your sin is blotted out."',
            hebrew: 'וָאֹמַר אוֹי-לִי כִי-נִדְמֵיתִי כִּי אִישׁ טְמֵא-שְׂפָתַיִם אָנֹכִי וּבְתוֹךְ עַם-טְמֵא שְׂפָתַיִם אָנֹכִי יוֹשֵׁב כִּי אֶת-הַמֶּלֶךְ יְהוָה צְבָאוֹת רָאוּ עֵינָי',
          },
          entities: [
            { word: 'live coal that had been taken from the altar', node: 'tradition-jewish-mysticism', type: 'symbol',
              note: 'The burning coal (ritzpah) from the altar is one of the most powerful purification symbols in prophetic literature. Fire purifies; the altar is the locus of atonement; the seraph uses it to touch Isaiah\'s lips — the organ of speech, the instrument of prophecy. The prophet\'s commission is speech; his disqualification is "unclean lips"; the purification is therefore precisely suited to the task. This targeted purification — the specific impediment removed by the specific instrument — is structurally related to alchemical purification: the raw material is made fit for its function by the fire that transforms it.',
              parallels: [
                { label: 'Rumi Masnavi — fire of love that makes the reed fit to speak', textId: 'rumi-masnavi', note: 'The seraph\'s coal purifying Isaiah\'s lips so he can speak divine words and Rumi\'s fire of Love that fills the reed with longing-cry — both use fire as the agent that transforms the speaker from the merely human to the divinely commissioned. The fire does not destroy the reed or Isaiah; it qualifies them for their specific function.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Commission (6:8)',
      verses: [
        {
          ref: '6:8',
          text: 'Then I heard the voice of the Lord saying, "Whom shall I send, and who will go for us?" And I said, "Here I am; send me!"',
          textVersions: {
            nrsv: 'Then I heard the voice of the Lord saying, "Whom shall I send, and who will go for us?" And I said, "Here I am; send me!"',
            hebrew: 'וָאֶשְׁמַע אֶת-קוֹל אֲדֹנָי אֹמֵר אֶת-מִי אֶשְׁלַח וּמִי יֵלֶךְ-לָנוּ וָאֹמַר הִנְנִי שְׁלָחֵנִי',
          },
          entities: [
            { word: 'Here I am; send me', node: '', type: 'concept',
              note: 'Hinneni — "here I am." This is the great biblical word of presence and availability: Abraham says hinneni when called to sacrifice Isaac (Gen 22:1); Moses says it at the burning bush (Ex 3:4); Samuel says it three times before recognizing God\'s voice (1 Sam 3). Isaiah\'s hinneni completes a pattern: the divine call → human availability → divine commissioning. This is the structural core of the prophetic vocation, and it directly parallels the Hermetic pattern of Hermes receiving the vision and then being sent to teach humanity.',
              parallels: [
                { label: 'Corpus Hermeticum I — Hermes commissioned to teach humanity', textId: 'corpus-hermeticum-1', note: 'After his vision of Poimandres, Hermes is commissioned: "What you have learned, transmit... You are the guide of those who are worthy." Isaiah\'s "here I am, send me" and Hermes\' acceptance of the teaching mission are both scenes of visionary-commissioning: the one who has seen the divine is sent back into the world as a messenger. The sequence vision → undoing → purification → commissioning is a cross-traditional initiatory template.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

SCRIPTURE_TEXTS['1-corinthians-15'] = {
  title: '1 Corinthians 15 — The Resurrection Body',
  shortTitle: '1 Cor 15',
  tradition: 'New Testament',
  date: 'c. 54 CE',
  intro: 'First Corinthians 15 is Paul\'s most sustained argument for bodily resurrection and his most philosophical passage. Writing around 54 CE, Paul addresses Corinthian Christians who doubted resurrection, deploying a sequence of arguments culminating in an extraordinary meditation on the nature of the resurrection body (soma pneumatikon — spiritual body) versus the natural body (soma psychikon). The key move: Paul insists resurrection is not resuscitation of the same physical body but transformation — "it is sown a physical body, it is raised a spiritual body." He uses agricultural and cosmic analogies: seeds, flesh of different degrees (human, animal, bird, fish), and celestial bodies of different glory (sun, moon, stars). The passage closes with the Adam typology: "The first man, Adam, became a living being; the last Adam became a life-giving spirit... The first man was from the earth, a man of dust; the second man is from heaven." This heavenly/earthly, spiritual/physical, first-Adam/second-Adam structure wires directly to John 3\'s born-from-above ontology, to the Purusha Sukta\'s cosmic/earthly person, and to the Hermetic Corpus\'s descent of the Anthropos.',
  crossTradition: [
    { label: 'John 3 — born from above, spiritual not physical', textId: 'john-3', note: 'John 3\'s "what is born of the flesh is flesh, what is born of the spirit is spirit" and 1 Cor 15\'s "sown a natural body, raised a spiritual body" are Paul and John independently articulating the same theological claim: there is a higher, spiritual mode of existence that is not a continuation of the natural mode but a transformation of it. Both passages use the binary flesh/spirit, natural/spiritual to map the same ontological territory.' },
    { label: 'Purusha Sukta — cosmic body as the template for individual transformation', textId: 'purusha-sukta', note: 'Paul\'s "first Adam from earth, second Adam from heaven" and the Purusha Sukta\'s cosmic Person — three-quarters immortal in heaven, one-quarter manifest below — are parallel structural intuitions: there is a heavenly/cosmic template (the second Adam / the Purusha) and an earthly instantiation (the first Adam / the quarter that became creation). Transformation is ascent from the earthly to the heavenly template.' },
    { label: 'Corpus Hermeticum XIII — the spiritual body of the reborn', textId: 'corpus-hermeticum-13', note: 'CH XIII describes the rebirth into a "body of light" — the ten powers of God replacing the twelve tormentors. Paul\'s soma pneumatikon (spiritual body) and the Hermetic body of light are the same concept: a mode of existence that is bodily (not simply disembodied) but made of a different, higher substance. Both texts insist that this is not the destruction of the person but its transformation.' },
    { label: 'Bhagavad Gita 2 — the indestructible atman that changes bodies', textId: 'bhagavad-gita-4', note: 'BG 2:22: "Just as a person puts on new garments, giving up old ones, similarly, the soul accepts new material bodies, giving up the old and useless ones." Paul\'s resurrection body and the BG\'s atman changing bodies are different answers to the same question about continuity through transformation. Paul insists on a single transformation (resurrection); the BG allows multiple iterations (reincarnation) — but both preserve the identity of the self through the change of form.' },
  ],
  translations: [
    { id: 'nrsv', label: 'NRSV (T1)' },
    { id: 'greek', label: 'Greek (original)' },
  ],
  sections: [
    {
      heading: 'The Seed and the Body (15:35–44)',
      verses: [
        {
          ref: '15:36–38',
          text: 'Fool! What you sow does not come to life unless it dies. And as for what you sow, you do not sow the body that is to be, but a bare seed, perhaps of wheat or of some other grain. But God gives it a body as he has chosen, and to each kind of seed its own body.',
          textVersions: {
            nrsv: 'Fool! What you sow does not come to life unless it dies. And as for what you sow, you do not sow the body that is to be, but a bare seed, perhaps of wheat or of some other grain. But God gives it a body as he has chosen, and to each kind of seed its own body.',
            greek: 'ἄφρων, σὺ ὃ σπείρεις οὐ ζῳοποιεῖται ἐὰν μὴ ἀποθάνῃ· καὶ ὃ σπείρεις, οὐ τὸ σῶμα τὸ γενησόμενον σπείρεις ἀλλὰ γυμνὸν κόκκον',
          },
          entities: [
            { word: 'does not come to life unless it dies', node: 'osiris', type: 'concept',
              note: 'This is the seed-death paradox, the theological core of dying-and-rising religion. Paul is using agricultural reality as a theological argument: the seed must die (dissolve its seed-form) to produce the plant. The death is not the end but the condition for the higher form. This precise metaphor appears in John 12:24 ("unless a grain of wheat falls into the earth and dies, it remains just a single grain; but if it dies, it bears much fruit") and throughout mystery religion. Osiris is the dying grain; Persephone descends and returns; Adonis bleeds and flowers. Paul is working within a well-established template.',
              parallels: [
                { label: 'Apocryphon of John — the divine spark buried in matter must be awakened', textId: 'apocryphon-of-john', note: 'The Gnostic divine spark buried in material existence and Paul\'s seed buried in the earth are parallel images for the same theological claim: the highest is hidden in the lowest; transformation requires a process of going through death/burial. For Paul, this is resurrection; for the Gnostics, it is gnosis — both are "comebacks" from a buried state.' },
              ]
            },
          ]
        },
        {
          ref: '15:42–44',
          text: 'So it is with the resurrection of the dead. What is sown is perishable, what is raised is imperishable. It is sown in dishonor, it is raised in glory. It is sown in weakness, it is raised in power. It is sown a physical body, it is raised a spiritual body.',
          textVersions: {
            nrsv: 'So it is with the resurrection of the dead. What is sown is perishable, what is raised is imperishable. It is sown in dishonor, it is raised in glory. It is sown in weakness, it is raised in power. It is sown a physical body, it is raised a spiritual body.',
            greek: 'οὕτως καὶ ἡ ἀνάστασις τῶν νεκρῶν. σπείρεται ἐν φθορᾷ, ἐγείρεται ἐν ἀφθαρσίᾳ· σπείρεται ἐν ἀτιμίᾳ, ἐγείρεται ἐν δόξῃ· σπείρεται ἐν ἀσθενείᾳ, ἐγείρεται ἐν δυνάμει· σπείρεται σῶμα ψυχικόν, ἐγείρεται σῶμα πνευματικόν.',
          },
          entities: [
            { word: 'spiritual body', node: 'pneuma', type: 'concept',
              note: 'Soma pneumatikon — spiritual body. This is Paul\'s most paradoxical coinage: soma (body) is the material, particular, individual form; pneumatikon (spiritual) is the non-material, universal principle. A "spiritual body" should be a contradiction in terms — yet Paul insists on both words. He is not describing a ghost (pure spirit) or a resuscitated corpse (pure body) but a third thing: a mode of embodied existence whose substance is pneuma rather than matter. This is the closest Paul comes to the Hermetic concept of a body of light.',
              parallels: [
                { label: 'Corpus Hermeticum XIII — the body of light of the reborn', textId: 'corpus-hermeticum-13', note: 'CH XIII\'s rebirth produces a transformed body: the tormentors (vices) are replaced by the powers of God, and the reborn soul is described as clothed in divine light. Paul\'s soma pneumatikon and the Hermetic body of light are the same intuition from different traditions: transformation produces not the destruction of individual existence but its elevation to a higher, luminous mode.' },
                { label: 'Purusha Sukta — three-quarters immortal, one-quarter earthly', textId: 'purusha-sukta', note: 'Paul\'s contrast between the earthly body (from Adam/dust) and the heavenly body (from Christ/spirit) and the Purusha Sukta\'s earthly quarter versus three-quarters immortal in heaven are parallel structural maps of the same territory. What is raised corresponds to what was always immortal in the cosmic template; what is sown corresponds to the quarter that became material creation.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'First Adam and Last Adam (15:45–49)',
      verses: [
        {
          ref: '15:45–49',
          text: 'Thus it is written, "The first man, Adam, became a living being"; the last Adam became a life-giving spirit. But it is not the spiritual that is first, but the physical, and then the spiritual. The first man was from the earth, a man of dust; the second man is from heaven. As was the man of dust, so are those who are of the dust; and as is the man of heaven, so are those who are of heaven. Just as we have borne the image of the man of dust, we will also bear the image of the man of heaven.',
          textVersions: {
            nrsv: 'Thus it is written, "The first man, Adam, became a living being"; the last Adam became a life-giving spirit. But it is not the spiritual that is first, but the physical, and then the spiritual. The first man was from the earth, a man of dust; the second man is from heaven. As was the man of dust, so are those who are of the dust; and as is the man of heaven, so are those who are of heaven.',
            greek: 'οὕτως καὶ γέγραπται· ἐγένετο ὁ πρῶτος ἄνθρωπος Ἀδὰμ εἰς ψυχὴν ζῶσαν· ὁ ἔσχατος Ἀδὰμ εἰς πνεῦμα ζῳοποιοῦν.',
          },
          entities: [
            { word: 'the last Adam became a life-giving spirit', node: 'logos', type: 'concept',
              note: 'Eschatos Adam — last Adam. Paul is doing something audacious: identifying Christ with a cosmic Anthropos figure who is the heavenly template for which the earthly Adam was only a copy. This is a direct engagement with the Philonic concept of the "heavenly Man" (ho kat\' eikona anthropos) — the divine image in Genesis 1:27 versus the earthly man formed from dust in Genesis 2:7. Paul reads these as two different beings: the first Adam (earthly, from Genesis 2) and the last Adam (heavenly, identified with Christ). This is almost identical to the Hermetic Anthropos who descends through the spheres and falls in love with Nature.',
              parallels: [
                { label: 'Poimandres (CH I) — the Anthropos descending from heaven', textId: 'corpus-hermeticum-1', note: 'CH I\'s Anthropos — the divine Man who descends through the planetary spheres, falls in love with Nature, and becomes entrapped in matter — is the Hermetic version of Paul\'s Adam typology. For Paul, the first Adam fell into earthly existence; the last Adam (Christ) came from heaven to redeem. For Poimandres, the Anthropos descended and is trapped; the return journey is gnosis. Both texts use a two-Adam or two-Anthropos structure to map the fall and the redemption.' },
                { label: 'Purusha Sukta — the cosmic Man as template for all creation', textId: 'purusha-sukta', note: 'Paul\'s "man of heaven" as the template for the redeemed and the Purusha Sukta\'s cosmic Person as the template from which all creation was formed — both texts use a macro-anthropos (cosmic Man) as the explanatory principle for human existence and its possible transformation. The direction is opposite (Purusha descends to become creation; Christ\'s image ascends as resurrection) but the structural logic is the same.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'Death is Swallowed Up (15:51–55)',
      verses: [
        {
          ref: '15:51–55',
          text: 'Listen, I will tell you a mystery! We will not all die, but we will all be changed, in a moment, in the twinkling of an eye, at the last trumpet. For the trumpet will sound, and the dead will be raised imperishable, and we will be changed. For this perishable body must put on imperishability, and this mortal body must put on immortality. When this perishable body puts on imperishability, and this mortal body puts on immortality, then the saying that is written will be fulfilled: "Death has been swallowed up in victory. Where, O death, is your victory? Where, O death, is your sting?"',
          textVersions: {
            nrsv: 'Listen, I will tell you a mystery! We will not all die, but we will all be changed, in a moment, in the twinkling of an eye, at the last trumpet. For the trumpet will sound, and the dead will be raised imperishable, and we will be changed.',
            greek: 'ἰδοὺ μυστήριον ὑμῖν λέγω· πάντες οὐ κοιμηθησόμεθα, πάντες δὲ ἀλλαγησόμεθα, ἐν ἀτόμῳ, ἐν ῥιπῇ ὀφθαλμοῦ, ἐν τῇ ἐσχάτῃ σάλπιγγι',
          },
          entities: [
            { word: 'Death has been swallowed up in victory', node: '', type: 'concept',
              note: 'Paul quotes Isaiah 25:8 ("he will swallow up death forever") and Hosea 13:14 ("O Death, where are your plagues?"). The "swallowing" metaphor is striking: death is eaten by what overcomes it. This reverses the standard image of death as the devourer. Paul\'s entire argument has been building to this reversal: the perishable puts on imperishability, the mortal puts on immortality, and then the last enemy (death, introduced in 15:26) is negated by what it tried to negate. This is the theological structure of Zhuangzi\'s singing at his wife\'s death: death is not the final word, only a transition.',
              parallels: [
                { label: 'Zhuangzi — singing at his wife\'s death, the return to origin', textId: 'zhuangzi', note: 'Paul\'s "death is swallowed up in victory" and Zhuangzi\'s singing at his wife\'s death — both texts arrive at a posture of non-defeat before mortality. The paths are different: Paul uses eschatological transformation (resurrection reverses death), Zhuangzi uses metaphysical continuity (death returns to origin). But the conclusion is the same: death is not the final word.' },
                { label: 'Völuspá — renewal after Ragnarök', textId: 'voluspa', note: 'The Norse Seeress sees not just destruction but renewal: after Ragnarök, the earth rises from the sea, the eagle hunts fish, fields bear unsown crops, Baldr returns. Paul\'s "death swallowed up in victory" and the Völuspá\'s post-apocalyptic renewal are both theologies of transformation beyond destruction — the cosmos or the individual emerges in a higher form after the worst has happened.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

SCRIPTURE_TEXTS['plotinus-enneads'] = {
  title: 'Plotinus — Enneads VI.9: The Flight of the Alone to the Alone',
  shortTitle: 'Enneads VI.9',
  tradition: 'Neoplatonist',
  date: 'c. 253–270 CE',
  intro: 'Plotinus (204–270 CE) is the philosopher who synthesized Plato, Pythagorean number-mysticism, Aristotelian logic, and Stoic physics into a single metaphysical system — Neoplatonism — that became the philosophical backbone of late antique religious thought across Judaism (Philo), Christianity (Augustine, Pseudo-Dionysius), Islam (al-Farabi, Ibn Sina), and the Hermetic tradition. The Enneads are nine treatises in six groups edited by his student Porphyry. The final treatise, VI.9, "On the Good or the One," is Plotinus\' most mystical text and his most personal: he describes the soul\'s ascent to union with the One — the highest principle, beyond Being, beyond Intellect, beyond all description — in language that is simultaneously rigorous philosophy and ecstatic testimony. The closing phrase, "the flight of the alone to the Alone" (phygê monou pros monon), is the most famous formulation of mystical union in Western philosophy. Plotinus stands at the exact center of the cross-traditional map: he was influenced by Plato\'s Timaeus and the Pythagoreans, contemporaneous with the Gnostic texts at Nag Hammadi, the Hermetic Corpus, and Origen\'s Christian Neoplatonism, and he in turn became the foundation for all subsequent apophatic mysticism in the Abrahamic traditions.',
  crossTradition: [
    { label: 'Apocryphon of John — the apophatic Monad beyond all description', textId: 'apocryphon-of-john', note: 'Plotinus\' One — "it is not this... not that... not Being... not Intellect... not any form... not even the Good as predicated of other things" — and the Apocryphon\'s Monad — "He is not knowable to any of them... He has no existence among existences" — are the closest philosophical parallels in late antiquity. Plotinus and the Nag Hammadi authors are working the same apophatic tradition, almost certainly drawing on shared Alexandrian Platonic sources.' },
    { label: 'Tao Te Ching 1 — the Tao beyond all naming', textId: 'tao-te-ching-1', note: 'Plotinus\' One that cannot be named, predicated, or even called "the One" without falsifying it, and Laozi\'s Tao that cannot be named — the name is not the thing — are the most precise cross-traditional parallel for the apophatic starting point. Both traditions reached the same conclusion independently: the ultimate principle surpasses all categories, including the categories we use to point toward it.' },
    { label: 'Chandogya Upanishad — tat tvam asi and the return to Brahman', textId: 'chandogya-6-2', note: 'Plotinus\' "the alone to the Alone" and the Chandogya\'s tat tvam asi ("that art thou") — the atman returning to Brahman — are the most precise Sanskrit/Greek parallels for mystical union. Both describe a return to a source that was never actually absent; the union is recognition, not acquisition. Plotinus says the soul "does not go out to the One but finds the One within itself when it has turned away from everything else."' },
    { label: 'Corpus Hermeticum XI — God contains all things', textId: 'corpus-hermeticum-11', note: 'CH XI\'s instruction to expand the soul until it becomes the universe and Plotinus\' description of the soul ascending to the One by releasing all particular content — both texts describe the same movement in opposite directions (CH XI: expand to contain all; Plotinus: contract to become none). Both arrive at the same place: union with the source.' },
  ],
  translations: [
    { id: 'mackenna', label: 'MacKenna 1917 (T1)' },
    { id: 'greek', label: 'Greek (original)' },
  ],
  sections: [
    {
      heading: 'The One Beyond All Predication (VI.9.3)',
      verses: [
        {
          ref: 'VI.9.3',
          text: 'The One is perfect because it seeks nothing, has nothing, needs nothing; and overflowing, so to speak, it produces something other than itself. This product turns towards it and is filled, and looking towards it becomes Intellect. Its halt near the One and its turning towards it constitutes being; its gaze upon the One, Intellect. Since it halts near the One so as to see it, it becomes at once Intellect and being.',
          textVersions: {
            mackenna: 'The One is perfect because it seeks nothing, has nothing, needs nothing; and overflowing, so to speak, it produces something other than itself. This product turns towards it and is filled, and looking towards it becomes Intellect. Its halt near the One and its turning towards it constitutes being; its gaze upon the One, Intellect.',
            greek: 'τέλειον δὲ ὅτι οὐδὲν ζητεῖ οὐδὲ ἔχει οὐδὲ δεῖται, ὑπερπλῆρες δὲ ὂν καὶ ὑπερρέον πεποίηκεν ἄλλο',
          },
          entities: [
            { word: 'overflowing, so to speak, it produces something other', node: 'emanation', type: 'concept',
              note: 'This is Plotinian emanation (prohodos — procession): the One does not create by will or act but by overflow, the way a light source radiates light without diminishing. This is not creation ex nihilo (the Christian doctrine) but emanation by excess: the One is so full that existence pours out from it necessarily. This emanation logic runs through Neoplatonism, the Hermetic Corpus, Kabbalah\'s tzimtzum-and-overflow, and Sufism\'s fayḍ (overflow of divine being). All four traditions are working with a model of creative abundance rather than creative decision.',
              parallels: [
                { label: 'Apocryphon of John — the Monad\'s perfection overflows into Barbelo', textId: 'apocryphon-of-john', note: 'The Apocryphon\'s Monad contemplates itself and Barbelo (First Thought) arises as the first emanation — not by decision but by the Monad\'s self-contemplation producing a reflection. Plotinus\' emanation (the One overflows into Intellect) and the Apocryphon\'s emanation (the Monad\'s self-contemplation produces Barbelo) are structurally identical accounts of the first step out of absolute unity into the first distinction.' },
                { label: 'Sefer Yetzirah — the thirty-two paths emanating from Ein Sof', textId: 'sefer-yetzirah', note: 'The Kabbalistic Ein Sof (without end) overflows through tzimtzum (contraction) and emanation into the ten sefirot — a Jewish version of the Neoplatonic emanation chain. Plotinus\' One → Intellect → Soul → Matter and Kabbalah\'s Ein Sof → ten sefirot are the same emanation model applied to different theological vocabularies.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Soul\'s Ascent (VI.9.7)',
      verses: [
        {
          ref: 'VI.9.7',
          text: 'Filled with love, putting aside the form it had in its descent, the soul that has the strength, stripped of all added in the descent, enters the realm of intellect with all its being, gathering all its parts about it — not scattered and not partial — and becomes pure being, pure intellect, pure act. Then it sees within itself — as if the divine lighted up — all things: all beautiful, all good.',
          textVersions: {
            mackenna: 'Filled with love, putting aside the form it had in its descent, the soul that has the strength, stripped of all added in the descent, enters the realm of intellect with all its being, gathering all its parts about it — not scattered and not partial — and becomes pure being, pure intellect, pure act.',
            greek: 'ἀγάπης δὲ πλησθεῖσα ἀποθεμένη τὸ σχῆμα ὃ εἶχεν κατιοῦσα εἰς τὸν νοῦν ἀναπαύεται τῷ ὄντι ξυλλεγομένη πᾶσα',
          },
          entities: [
            { word: 'stripped of all added in the descent', node: 'tradition-neoplatonism', type: 'concept',
              note: 'Plotinus describes the return journey as a stripping: the soul shed accretions as it descended through the planetary spheres (Neoplatonic cosmology following the Poimandres model: the soul picks up the qualities of each sphere on the way down). The return strips them away in reverse order. This is the most precise structural parallel between Plotinus and the Hermetic Corpus Hermeticum I: both describe a descent that adds layers and an ascent that removes them. The soul returns to its original condition by subtraction, not addition.',
              parallels: [
                { label: 'Poimandres — the soul ascending through the planetary spheres', textId: 'corpus-hermeticum-1', note: 'CH I describes the soul ascending through seven planetary spheres, leaving behind at each sphere the quality it picked up on the way down: at the first, growth and decrease; at the second, evil deceit; at the third, covetous deceit; and so on until the soul is stripped bare and enters the eighth sphere. Plotinus\' "stripped of all added in the descent" is the philosophical description of what Poimandres describes cosmologically.' },
                { label: 'Rumi Masnavi — the reed stripped back to origin', textId: 'rumi-masnavi', note: 'Rumi\'s reed longs to return to the reed bed — to have the accretion of separation stripped away. Plotinus\' stripped soul returning to the One and Rumi\'s reed crying for reunion are parallel images of the same metaphysical longing: to have what was added by existence removed until the original state is recovered.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Flight of the Alone to the Alone (VI.9.11)',
      verses: [
        {
          ref: 'VI.9.11',
          text: 'This is the life of gods and of the godlike and blessed among men, liberation from the alien that besets us here, a life taking no pleasure in the things of earth, the passing of solitary to solitary. [phygê monou pros monon]',
          textVersions: {
            mackenna: 'This is the life of gods and of the godlike and blessed among men, liberation from the alien that besets us here, a life taking no pleasure in the things of earth, the passing of solitary to solitary.',
            greek: 'αὕτη ἡ ζωὴ θεῶν καὶ θείων καὶ εὐδαιμόνων ἀνθρώπων, ἀπαλλαγὴ τῶν ἄλλων, βίος ἀνήδονος τῶν τῇδε, φυγὴ μόνου πρὸς μόνον.',
          },
          entities: [
            { word: 'the passing of solitary to solitary', node: 'tradition-neoplatonism', type: 'concept',
              note: 'Phygê monou pros monon — "the flight of the alone to the Alone." The most famous phrase in Western mysticism. The soul (monos — alone, singular, without attributes) returns to the One (Monon — the absolutely singular). The union is between two kinds of singularity: the soul stripped of all its additions (alone), and the One that is alone by nature (beyond all multiplicity). This phrase became the touchstone of Western mystical theology from Pseudo-Dionysius through Meister Eckhart, The Cloud of Unknowing, and John of the Cross.',
              parallels: [
                { label: 'Chandogya Upanishad — tat tvam asi: the alone returns to the Alone', textId: 'chandogya-6-2', note: '"That art thou" — the atman is already Brahman; the return is recognition. Plotinus\' "flight of the alone to the Alone" is the Greek-philosophical formulation of the same insight: the individual soul (atman) is already identical with the source (Brahman / the One); the mystical path is the removal of what obscures this identity, not the acquisition of something new.' },
                { label: 'Apocryphon of John — divine sparks returning to the Pleroma', textId: 'apocryphon-of-john', note: 'The Apocryphon\'s divine sparks, trapped in Yaldabaoth\'s world, awakened by gnosis and returning to the Pleroma — and Plotinus\' soul, trapped in matter, ascending through contemplation to union with the One — are the same cosmological story told with different emphasis. Both describe a return to the source; the Gnostic version adds the dramatic element of the Demiurge who tries to prevent the return.' },
                { label: 'Rumi Masnavi — the reed returning to the reed bed', textId: 'rumi-masnavi', note: 'Plotinus\' "flight of the alone to the Alone" and Rumi\'s reed longing for reunion with the reed bed are the same movement expressed in philosophical Greek and Sufi Persian. Both describe the soul\'s return journey toward its source. Rumi would read Plotinus as the philosopher who saw what the reed feels.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

SCRIPTURE_TEXTS['bardo-thodol'] = {
  title: 'Bardo Thodol — The Tibetan Book of the Dead',
  shortTitle: 'Bardo Thodol',
  tradition: 'Tibetan Buddhist',
  date: 'c. 8th–14th CE (compiled)',
  intro: 'The Bardo Thodol (Liberation in the Intermediate State Through Hearing) is traditionally attributed to Padmasambhava (8th century CE) and discovered as a terma (hidden treasure text) by Karma Lingpa in the 14th century. It is the most detailed and systematic map of consciousness through the dying process in any religious tradition. The text is read aloud to the dying and the recently dead, guiding consciousness through three bardos: the bardo of dying (the Clear Light), the bardo of dharmata (the arising of peaceful and wrathful deities), and the bardo of becoming (the approach to rebirth). The central teaching: at the moment of death, the Clear Light of the Dharmakaya arises — the naked, luminous nature of consciousness itself. If the dying person recognizes it as their own nature and does not flee in fear, liberation occurs. Most people flee, and the journey through the deity-visions and eventual rebirth follows. This is the most detailed Buddhist elaboration of the theme that appears across traditions: at the core of death is a light that is the divine nature; the question is whether consciousness can recognize itself in that light. The parallels with John 3 (born from above), Plotinus (the soul returning to the One), and the Gnostic divine spark are structurally precise.',
  crossTradition: [
    { label: 'John 3 — born from above, recognizing one\'s divine origin', textId: 'john-3', note: 'John 3\'s "born from above" and the Bardo\'s liberation through recognizing the Clear Light as one\'s own nature are both about recognizing divine origin. For John, this recognition (spiritual rebirth) happens during life; for the Bardo, the most decisive opportunity is at death. Both texts insist that the recognition is the soteriological act — not a doctrine believed but an identity recognized.' },
    { label: 'Plotinus — the soul recognizing itself in the One', textId: 'plotinus-enneads', note: 'Plotinus\' mystical union occurs when the soul recognizes its identity with the One — "the alone to the Alone." The Bardo\'s liberation occurs when consciousness recognizes the Clear Light as its own nature. Both are recognition events, not acquisitions: the soul/consciousness is not receiving something new but recognizing what was always already its nature. This is the most precise structural parallel between Neoplatonism and Tibetan Buddhist soteriology.' },
    { label: 'Apocryphon of John — divine sparks trapped in matter, needing to be awakened', textId: 'apocryphon-of-john', note: 'The Apocryphon\'s divine sparks in Yaldabaoth\'s material world needing gnosis to remember their divine origin, and the Bardo\'s consciousness at death encountering the Clear Light but potentially fleeing into rebirth — both map the same basic situation: a divine nature is present but not recognized, and the failure to recognize it has ontological consequences (re-embodiment, continued imprisonment).' },
    { label: 'Zhuangzi — death as transformation, not dissolution', textId: 'zhuangzi', note: 'Zhuangzi traces his wife\'s being backward to the undifferentiated flux — death returns to the origin, not to nothing. The Bardo\'s Clear Light is the most basic nature of consciousness, always present — death dissolves the accretions and reveals it. Both texts locate in the process of dying a return to something fundamental that was always there, temporarily obscured by the forms of life.' },
  ],
  translations: [
    { id: 'fremantle', label: 'Fremantle/Trungpa 1975 (T2)' },
    { id: 'tibetan', label: 'Tibetan (original)' },
  ],
  sections: [
    {
      heading: 'The Clear Light at Death',
      verses: [
        {
          ref: 'Part I',
          text: 'O nobly born, now the clear light of reality itself dawns upon you. Recognize it. O nobly born, your present awareness — vacant, naked, empty — is itself the very Reality, the All-Good, the naked dharmakaya. Your own awareness, having no birth nor death, is indeed the Immutable Light — Buddha Amitabha.',
          textVersions: {
            fremantle: 'O nobly born, now the clear light of reality itself dawns upon you. Recognize it. O nobly born, your present awareness — vacant, naked, empty — is itself the very Reality, the All-Good, the naked dharmakaya. Your own awareness, having no birth nor death, is indeed the Immutable Light — Buddha Amitabha.',
            tibetan: 'ཀྱེ་རྒྱལ་བའི་སྲས་ཆེན་ལགས་ཀུན་བཟང་བླ་མ་ཡི་ངོ་སྤྲོད་ཅི་ཞིག་ཡིན་ཞེ་ན།',
          },
          entities: [
            { word: 'your present awareness — vacant, naked, empty — is itself the very Reality', node: 'tradition-tibetan-buddhism', type: 'concept',
              note: 'This is the central teaching of Dzogchen and the Bardo Thodol: rigpa (pure awareness) is not something the dying person needs to acquire or travel toward — it is what the dying person already is, underneath all the mental formations. "Vacant, naked, empty" describes awareness stripped of content: the sky, not the clouds. The instruction to "recognize it" (Tibetan: ngo shes pa) is the entire practice — a cognitive act, not a spiritual effort. This is the most precise parallel to Plotinus\' "the alone to the Alone": both are recognition events.',
              parallels: [
                { label: 'Plotinus — the soul recognizing the One as its own nature', textId: 'plotinus-enneads', note: 'Plotinus\' mystical union: "the soul does not go out to the One but finds the One within itself when it has turned away from everything else." The Bardo\'s "your present awareness is itself the Reality" and Plotinus\' discovery of the One within are the same: the divine is not external to be sought but internal to be recognized.' },
                { label: 'Apocryphon of John — the Monad\'s silence surrounding all things', textId: 'apocryphon-of-john', note: 'The Apocryphon\'s Monad: "Silence is what surrounds him... He is the invisible Spirit of whom one ought not think of him as a god or as like God... He is more than a god, since there is nothing above him." The Bardo\'s Clear Light: "vacant, naked, empty" — both use emptiness and silence as the positive characterization of the ultimate. Neither is describing an absence but a presence too full for ordinary predication.' },
              ]
            },
          ]
        },
        {
          ref: 'Part I (cont.)',
          text: 'Do not be afraid of it, do not be bewildered. Recognize it as the natural radiance of your own mind. Since it is your own radiant dharmakaya, recognize it. If you do not recognize it, if you turn away from it in fear, then suffering will continue.',
          textVersions: {
            fremantle: 'Do not be afraid of it, do not be bewildered. Recognize it as the natural radiance of your own mind. Since it is your own radiant dharmakaya, recognize it. If you do not recognize it, if you turn away from it in fear, then suffering will continue.',
            tibetan: 'འདི་ལ་མི་སྐྲག་ཅིག མི་མི་ཤིགས་ཤིག རང་གི་རིག་པའི་གསལ་སྣང་ངོ་ཤེས་ཤིག',
          },
          entities: [
            { word: 'Do not be afraid of it', node: 'tradition-tibetan-buddhism', type: 'concept',
              note: 'The instruction "do not be afraid" is the pastoral core of the Bardo Thodol. The reason most people fail to recognize the Clear Light is not ignorance but fear: the vast, undifferentiated luminosity of the dharmakaya is so unlike anything in ordinary experience that the unprepared mind flees from it. The fear is the mechanism of continued embodiment. This precise structure — a divine reality encountered in a state of radical exposure, the recipient tempted to flee — appears in Ezekiel falling on his face, in Arjuna begging Krishna to restore his gentle form, in Isaiah crying "Woe is me!" The difference: in those texts, the divine reassures the prophet; in the Bardo, the teaching is given in advance so that the moment of terror can be met with recognition.',
              parallels: [
                { label: 'Ezekiel 1 — "I fell on my face" before the glory of the LORD', textId: 'ezekiel-1', note: 'Ezekiel\'s prostration before the kavod and the Bardo\'s warning not to flee the Clear Light — both stage the same moment: a human consciousness encountering the overwhelming radiance of the divine totality. Ezekiel falls; the Bardo instructs not to fall but to recognize. The instruction "do not be afraid" is the Bardo Thodol\'s version of the divine reassurance that follows every great prophetic vision.' },
                { label: 'Bhagavad Gita 11 — Arjuna terrified, begging for the gentle form', textId: 'bhagavad-gita-11', note: 'Arjuna begs Krishna to withdraw the Vishvarupa and return to the gentle human form (11:45-46) — he cannot sustain the vision of the divine totality. The Bardo Thodol specifically instructs the dying: do not flee to the dim lights (the lower realms, which feel more familiar and comfortable); stay with the blazing Clear Light. Arjuna\'s failure and the Bardo\'s instruction describe the same psychological event from opposite sides.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Peaceful Deities Arise',
      verses: [
        {
          ref: 'Part II',
          text: 'O nobly born, listen without distraction. On the second day, the white light of Vajrasattva will come to meet you, together with the smoky light of hell. At that moment, do not be attracted to the smoky light of hell through the force of anger. The white light of Vajrasattva is your own buddha nature. Recognize it.',
          textVersions: {
            fremantle: 'O nobly born, listen without distraction. On the second day, the white light of Vajrasattva will come to meet you, together with the smoky light of hell. At that moment, do not be attracted to the smoky light of hell through the force of anger. The white light of Vajrasattva is your own buddha nature. Recognize it.',
            tibetan: 'ཀྱེ་རྒྱལ་བའི་སྲས་ཆེན། ད་ལྟ་རྡོ་རྗེ་སེམས་དཔའི་འོད་དཀར་པོ་གསལ་ལ་ཡི་མཐོང་ངམ།',
          },
          entities: [
            { word: 'the smoky light of hell', node: 'tradition-tibetan-buddhism', type: 'concept',
              note: 'The Bardo Thodol\'s most striking teaching: alongside each blazing divine light, a dim smoky light of the corresponding hell-realm also appears. The dim light is comfortable, familiar, not overwhelming — and therefore deeply attractive to a consciousness that has just fled the terrifying divine radiance. The text is saying: your vices (here, anger) generate their own light — a comfortable, dim alternative to the divine brilliance. The choice between the bright and dim lights is the soteriological choice at every stage of the bardo journey.',
              parallels: [
                { label: 'John 3 — the darkness that does not overcome the light', textId: 'john-3', note: 'John 3:19-20: "People loved darkness rather than light because their deeds were evil." The Bardo\'s smoky light of hell alongside the divine white light, and John\'s darkness preferred by those who flee the light — both texts map the same soteriological structure: the divine light is present; the question is whether consciousness turns toward it or away. The dim/dark is not the absence of the divine but an alternative that consciousness chooses.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

// ── BATCH 8 ─────────────────────────────────────────────────────────────────

SCRIPTURE_TEXTS['atrahasis-epic'] = {
  title: 'The Atrahasis Epic — Flood and Human Creation',
  shortTitle: 'Atrahasis',
  tradition: 'Babylonian',
  date: 'c. 1700 BCE (Old Babylonian)',
  intro: 'The Atrahasis Epic is the oldest complete flood + creation narrative in the world, predating the Gilgamesh flood by several centuries. Written in Akkadian during the Old Babylonian period (c. 1700 BCE), it answers two questions that neither Genesis nor Gilgamesh addresses fully: why were humans created, and why did the gods decide to destroy them? The answers: humans were created to do the labor the lesser gods (Igigi) had been performing (digging irrigation canals) when the Igigi went on strike. The god Enki engineered this creation by mixing divine blood and flesh (killed from one god, Geshtu-e, "the god who has intelligence") with clay. Then, when humans multiplied and made too much noise, the god Enlil tried three times to reduce their numbers — plague, famine, drought — before resorting to the flood. Enki warned his devotee Atrahasis (whose name means "exceedingly wise") and instructed him to build a boat. Atrahasis is the direct ancestor of Noah and Utnapishtim — the same story, with more theological scaffolding. The divine-blood creation (humans containing divine substance) is the Babylonian anticipation of the Gnostic divine spark, the Hermetic Anthropos, and the Purusha Sukta\'s cosmic body becoming creation.',
  crossTradition: [
    { label: 'Gilgamesh flood — the Utnapishtim version one generation later', textId: 'gilgamesh', note: 'The Gilgamesh flood (Tablet XI) reproduces the Atrahasis flood narrative almost verbatim — the same storm, the same bird sequence (dove, swallow, raven), the same landing on a mountain, the same sacrifice, the same divine regret. Utnapishtim IS Atrahasis under a different name. The Atrahasis Epic is the source text; Gilgamesh Tablet XI is the borrowing. Both are the source for Genesis 6-9.' },
    { label: 'Apocryphon of John — divine substance trapped in material creation', textId: 'apocryphon-of-john', note: 'The Atrahasis creation: Enki mixes killed-god blood and flesh with clay to create humans who carry divine substance. The Apocryphon\'s creation: Yaldabaoth breathes divine power (stolen from Sophia) into Adam, trapping divine light in matter. Both texts encode divine substance in material humanity — and both explain human restlessness as the divine element straining against its material container.' },
    { label: 'Purusha Sukta — cosmic body dismembered to create world and humans', textId: 'purusha-sukta', note: 'The Atrahasis creation uses one killed god\'s blood and flesh mixed with clay. The Purusha Sukta\'s cosmic person is dismembered and all creation emerges from the body parts. Both use the template of divine sacrifice/death generating creation — the world made from divine substance, carrying that substance within it.' },
    { label: 'Genesis 1-2 — the downstream Hebrew parallel', textId: 'gilgamesh', note: 'Genesis 1-9 contains two creation accounts (documentary hypothesis: Priestly and Yahwist) and a flood narrative. The Atrahasis Epic has all three in sequence: creation from divine material → human multiplication → divine decision to flood → flood → survival → new covenant. The structural parallel is too close to be coincidental. The scholarly consensus: the Genesis author(s) knew the Mesopotamian flood tradition and reworked it with monotheistic theology.' },
  ],
  translations: [
    { id: 'dalley', label: 'Dalley 1989 (T1)' },
    { id: 'akkadian', label: 'Akkadian (original)' },
  ],
  sections: [
    {
      heading: 'Why Humans Were Created (Tablet I)',
      verses: [
        {
          ref: 'I.i.1–8',
          text: 'When the gods were man, they did forced labor, they bore drudgery. Great indeed was the drudgery of the gods, the forced labor was heavy, the misery too much: the seven great Anunnaki were making the Igigi suffer forced labor.',
          textVersions: {
            dalley: 'When the gods were man, they did forced labor, they bore drudgery. Great indeed was the drudgery of the gods, the forced labor was heavy, the misery too much: the seven great Anunnaki were making the Igigi suffer forced labor.',
            akkadian: 'i-nu-ma i-lu a-wi-lum ub-lu du-ul-la iz-bi-lu šup-ši-ik-ka ka-ab-ta ka-ab-ta du-ul-lu ša i-li ma-ad šup-ši-ik-ka ka-bi-it',
          },
          entities: [
            { word: 'When the gods were man', node: 'enki', type: 'concept',
              note: 'The opening line — "when the gods were man" — establishes the Atrahasis premise: the boundary between gods and humans is not primordial but historical. There was a time when gods did human labor. This blurring of the divine/human boundary is the theological ground for the creation solution: if gods can do human labor, humans can be made from divine material. The Babylonian creation tradition routinely creates humans as labor-saving devices — fundamentally different from Genesis, where humans are created in the divine image for relationship and dominion.',
              parallels: [
                { label: 'Purusha Sukta — cosmic Person becomes creation through sacrifice', textId: 'purusha-sukta', note: 'Both the Atrahasis creation and the Purusha Sukta begin with a problem of labor or cosmic incompleteness that requires a divine sacrifice to solve. In Atrahasis, the gods\' labor is the problem; in the Purusha Sukta, the cosmic incompleteness before the sacrifice is the problem. Both resolve through a sacrificial act involving divine substance that becomes the human world.' },
              ]
            },
          ]
        },
        {
          ref: 'I.iv.206–230',
          text: 'Enki made his voice heard and spoke to the great gods: "On the first, seventh and fifteenth day of the month I shall make a purifying bath. Let one god be slaughtered. Then let the gods be cleansed in the immersion. With his flesh and his blood let Nintu mix clay. God and man will be mixed together in clay."',
          textVersions: {
            dalley: 'Enki made his voice heard and spoke to the great gods: "On the first, seventh and fifteenth day of the month I shall make a purifying bath. Let one god be slaughtered. Then let the gods be cleansed in the immersion. With his flesh and his blood let Nintu mix clay. God and man will be mixed together in clay."',
            akkadian: 'ilu i-na li-ʾ-i-šu liš-ša-ki-in te-em-šu da-a-a-mi-šu i-na ṭi-ṭi li-iṭ-ṭu-ur',
          },
          entities: [
            { word: 'With his flesh and his blood let Nintu mix clay', node: 'enki', type: 'concept',
              note: 'The divine blood mixed with clay is the Babylonian theological solution to why humans are simultaneously divine and mortal: we contain the blood and intelligence (Akkadian: ṭe\'um, "reason/intelligence") of the slaughtered god, mixed with the clay of earth. This is one of the most important verses in ancient theology for the cross-tradition investigation: it establishes that humans carry divine substance as a design feature, not an accident — the Babylonian origin of the Gnostic divine spark, the Hermetic divine Nous in matter, the Purusha Sukta\'s cosmic body becoming humanity.',
              parallels: [
                { label: 'Apocryphon of John — Yaldabaoth breathes divine power into Adam', textId: 'apocryphon-of-john', note: 'Atrahasis: divine blood mixed into clay creates humans who carry divine substance. Apocryphon of John: Yaldabaoth breathes the divine power he stole from Sophia into Adam — accidentally giving Adam more divine substance than Yaldabaoth himself possesses. Both texts explain the paradox of human existence: we are made of the lowest material (clay/matter) yet contain the highest substance (divine blood/divine light).' },
                { label: 'Poimandres — the Anthropos descending into matter, mixing divine with material', textId: 'corpus-hermeticum-1', note: 'CH I\'s Anthropos descends through the spheres and falls in love with Nature — the divine mixing with the material to produce humanity. Atrahasis\'s god-blood-in-clay, the Apocryphon\'s divine breath in Adam, and CH I\'s Anthropos in matter are three versions of the same mythological claim: humanity is a hybrid of the divine and the material, and that hybridity is the condition for both our suffering and our possibility.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Flood (Tablet III)',
      verses: [
        {
          ref: 'III.ii.20–40',
          text: 'Enki made his voice heard and spoke to Atrahasis: "I have to tell you: wall, listen to me! Reed hut, make sure you attend to all my words! Dismantle the house, build a boat, reject possessions, and save living things."',
          textVersions: {
            dalley: 'Enki made his voice heard and spoke to Atrahasis: "I have to tell you: wall, listen to me! Reed hut, make sure you attend to all my words! Dismantle the house, build a boat, reject possessions, and save living things."',
            akkadian: 'i-ga-ra-am ša-am-ri ṭi-ṭam la-li-iš šu-up-ši-iq-ma a-wa-ti-ia',
          },
          entities: [
            { word: '"wall, listen to me! Reed hut"', node: 'enki', type: 'concept',
              note: 'Enki speaks through a wall and a reed hut — an indirect communication, because Enki had sworn an oath with Enlil not to warn humans. By speaking to the wall and reed hut rather than directly to Atrahasis, Enki technically keeps his oath while breaking its spirit. This theological detail is preserved in Gilgamesh Tablet XI and is a precise ancestor of the Gnostic Sophia\'s indirect communication in the Apocryphon of John — divine knowledge transmitted indirectly, through a medium, when direct communication is prohibited. The technology of indirect divine communication is very ancient.',
              parallels: [
                { label: 'Gilgamesh Tablet XI — Utnapishtim receives the same instruction', textId: 'gilgamesh', note: 'Gilgamesh Tablet XI: Ea (= Enki) "calls to the reed fence" and warns Utnapishtim (= Atrahasis) in almost identical words: "reed hut, reed hut, wall, wall, listen reed hut, attend wall." The verbal parallel is close enough to prove direct literary borrowing. The Atrahasis wall-speech is the source; Gilgamesh preserves it; Genesis strips it (Noah receives direct divine communication, no wall-speech needed).' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

SCRIPTURE_TEXTS['gospel-of-thomas'] = {
  title: 'Gospel of Thomas — The Sayings of the Living Jesus',
  shortTitle: 'Gospel of Thomas',
  tradition: 'Gnostic / Early Christian',
  date: 'c. 50–140 CE (sayings core possibly 1st century)',
  intro: 'The Gospel of Thomas is a collection of 114 sayings attributed to Jesus, discovered at Nag Hammadi in 1945. It has no narrative, no crucifixion, no resurrection story — only sayings, each introduced by "Jesus said." Half the sayings have parallels in the canonical gospels; the other half are unknown. The opening line establishes the hermeneutic: "Whoever finds the interpretation of these sayings will not experience death." This is a wisdom gospel — the sayings are deliberately paradoxical, designed to provoke interpretation that itself constitutes salvation. Thomas may preserve an independent sayings tradition older than the canonical gospels; or it may be a 2nd-century Gnostic reworking; most likely both are partially true. The theological center: the divine kingdom is already here, within and outside; the human problem is not sin but non-recognition; the disciples are to find the living Jesus within themselves. Logion 77 ("I am the light that is above them all... cleave wood, I am there; lift up a stone, and you will find me there") is the closest any early Christian text comes to the Vedantic Brahman that pervades all things. Logion 28 ("I took my place in the midst of the world... I found them all drunk... I was grieved for them") is verbatim parallel to Corpus Hermeticum VII.',
  crossTradition: [
    { label: 'Corpus Hermeticum VII — "drunk with wine of ignorance"', textId: 'corpus-hermeticum-7', note: 'CH VII: "Men have become drunk from the ignorance poured over them." Thomas L.28: "I found them all drunk; I found none of them thirsty; and my soul grieved over the sons of men, because they are blind in their hearts." Both use drunkenness as a metaphor for unconsciousness of the divine. Both are voiced by a divine figure surveying humanity\'s ignorance with grief. The texts are almost certainly from the same Alexandrian milieu (both use Greek; both may reflect a common oral tradition).' },
    { label: 'John 1 — the Logos as the light in every person', textId: 'corpus-hermeticum-1', note: 'Thomas L.77: "I am the light that is above them all... Split a piece of wood, I am there. Lift up a stone, and you will find me there." John 1:4: "In him was life, and the life was the light of all people." Both texts locate the divine Logos/light as immanent in all material things — not just in Jesus or in the Temple but in wood and stone. Thomas is more radical: the divine is in the most mundane materials if you know how to cleave or lift.' },
    { label: 'Corpus Hermeticum XI — everything is full of God', textId: 'corpus-hermeticum-11', note: 'Thomas L.77\'s divine presence in wood and stone and CH XI\'s "everything is full of God" are the same theological claim: divine immanence is not selective. The light/God is in the wood and stone not as a special miracle but as the ordinary condition of all material existence — material reality is always already saturated with divine presence.' },
    { label: 'Tao Te Ching 1 — the Tao that is present in all things without being visible', textId: 'tao-te-ching-1', note: 'Thomas L.77\'s immanent divine presence (in wood, stone, all matter) and Laozi\'s Tao that pervades all things without being visible ("ten thousand things arise from it... it does not claim credit") are parallel immanence theologies. Both insist the divine is present in the most ordinary materials; both imply that recognizing this presence is the salvific act.' },
  ],
  translations: [
    { id: 'lambdin', label: 'Lambdin (T1)' },
    { id: 'greek', label: 'Greek (original fragments)' },
  ],
  sections: [
    {
      heading: 'The Prologue and the Kingdom Within (L.1–3)',
      verses: [
        {
          ref: 'L.1–2',
          text: 'These are the secret sayings which the living Jesus spoke and which Didymos Judas Thomas wrote down. And he said, "Whoever finds the interpretation of these sayings will not experience death." Jesus said, "Let him who seeks continue seeking until he finds. When he finds, he will become troubled. When he becomes troubled, he will be astonished, and he will rule over the All."',
          textVersions: {
            lambdin: 'These are the secret sayings which the living Jesus spoke and which Didymos Judas Thomas wrote down. And he said, "Whoever finds the interpretation of these sayings will not experience death." Jesus said, "Let him who seeks continue seeking until he finds. When he finds, he will become troubled. When he becomes troubled, he will be astonished, and he will rule over the All."',
            greek: 'Οὗτοί εἰσιν οἱ λόγοι οἱ ἀπόκρυφοι οὓς ἐλάλησεν Ἰησοῦς ὁ ζῶν καὶ ἐγράψατο Διδύμος Ἰούδας Θωμᾶς',
          },
          entities: [
            { word: 'Whoever finds the interpretation will not experience death', node: 'tradition-gnosticism', type: 'concept',
              note: 'The Gospel of Thomas opens by embedding its own hermeneutic: finding the interpretation IS the salvific act. This is gnosis — not belief in propositions but the interpretive act that dissolves ignorance. The phrase "will not experience death" (Coptic: mef-jtpe thanatos) parallels John 8:51 ("whoever keeps my word will never see death") and the Bardo Thodol\'s liberation through recognition. In all three traditions, the cognitive act of correct recognition/interpretation/understanding is what overcomes death.',
              parallels: [
                { label: 'Bardo Thodol — recognition of the Clear Light = liberation', textId: 'bardo-thodol', note: 'The Bardo\'s liberation occurs through recognizing the Clear Light as one\'s own nature — a cognitive act, not a ritual one. Thomas L.1\'s "whoever finds the interpretation" = liberation and the Bardo\'s "recognize it" = liberation are structurally identical: both locate the soteriological act in a recognition event.' },
                { label: 'Chandogya Upanishad — tat tvam asi as the liberating recognition', textId: 'chandogya-6-2', note: '"That art thou" — the liberating insight is a recognition of identity. Thomas L.1\'s finding the interpretation, Bardo\'s recognizing the Clear Light, and Chandogya\'s tat tvam asi are the same: liberation is a shift in the cognitive/experiential frame, not an action performed.' },
              ]
            },
          ]
        },
        {
          ref: 'L.3',
          text: 'Jesus said, "If those who lead you say to you, \'See, the Kingdom is in the sky,\' then the birds of the sky will precede you. If they say to you, \'It is in the sea,\' then the fish will precede you. Rather, the Kingdom is inside of you, and it is outside of you. When you come to know yourselves, then you will become known, and you will realize that it is you who are the sons of the living Father."',
          textVersions: {
            lambdin: 'Jesus said, "If those who lead you say to you, \'See, the Kingdom is in the sky,\' then the birds of the sky will precede you. If they say to you, \'It is in the sea,\' then the fish will precede you. Rather, the Kingdom is inside of you, and it is outside of you. When you come to know yourselves, then you will become known, and you will realize that it is you who are the sons of the living Father."',
            greek: '',
          },
          entities: [
            { word: 'the Kingdom is inside of you, and it is outside of you', node: 'logos', type: 'concept',
              note: 'Thomas L.3 gives the fullest version of the kingdom saying — it is both within and without. This is more radical than Luke 17:21 ("the kingdom of God is among you"), which can be read as external (Jesus\'s presence). Thomas specifies: inside AND outside — not in a spatial location (sky or sea) but as the encompassing reality that the self participates in. "When you come to know yourselves" — self-knowledge is the path to recognition. This is the Thomas gospel\'s Delphic "know thyself" moment.',
              parallels: [
                { label: 'Corpus Hermeticum XI — God contains all things and all things contain God', textId: 'corpus-hermeticum-11', note: 'CH XI\'s "God contains all things" and Thomas L.3\'s "the Kingdom is inside of you, and it is outside of you" map the same topology: the divine is simultaneously the container of all existence and the content of each individual. Inside and outside collapse into each other when the divine is both the innermost and the outermost.' },
                { label: 'Chandogya Upanishad — Brahman is the inner and outer ground', textId: 'chandogya-6-2', note: '"Tat tvam asi" — that (Brahman, the ground of all being) art thou (atman, the innermost self). The identification of the personal innermost with the cosmic outermost is the Chandogya\'s core teaching. Thomas L.3\'s "inside and outside" and Chandogya\'s atman=Brahman are the same non-dual topology.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Drunk and the Light (L.28, L.77)',
      verses: [
        {
          ref: 'L.28',
          text: 'Jesus said, "I took my place in the midst of the world, and I appeared to them in flesh. I found them all drunk; I found none of them thirsty. And my soul became afflicted for the sons of men, because they are blind in their hearts and do not have sight; for empty they came into the world, and empty too they seek to leave the world."',
          textVersions: {
            lambdin: 'Jesus said, "I took my place in the midst of the world, and I appeared to them in flesh. I found them all drunk; I found none of them thirsty. And my soul became afflicted for the sons of men, because they are blind in their hearts and do not have sight; for empty they came into the world, and empty too they seek to leave the world."',
            greek: '',
          },
          entities: [
            { word: 'I found them all drunk', node: 'tradition-gnosticism', type: 'concept',
              note: 'The "drunk" metaphor in Thomas L.28 and Corpus Hermeticum VII is one of the most precise cross-tradition verbal parallels in the entire scripture corpus. CH VII: "Men have become drunk from the ignorance poured over them." Thomas: "I found them all drunk; I found none of them thirsty." Both texts — both apparently from Alexandrian Greek milieu — use drunkenness (methy, drunk) as the metaphor for unconsciousness of the divine. Both voice this observation through a divine figure surveying humanity with grief. The texts are almost certainly related, possibly both drawing on a common oral or written source.',
              parallels: [
                { label: 'Corpus Hermeticum VII — drunk with wine of ignorance', textId: 'corpus-hermeticum-7', note: 'CH VII is the direct verbal parallel. Both texts use the drunk/thirsty binary: the problem is not lack of divine reality (there is plenty) but lack of thirst — the desire to seek. "None of them thirsty" in Thomas and "they have no thirst" in CH VII are almost identical formulations of the Gnostic diagnosis: humanity does not seek the divine because ignorance has made it satisfied with substitutes.' },
              ]
            },
          ]
        },
        {
          ref: 'L.77',
          text: 'Jesus said, "It is I who am the light which is above them all. It is I who am the All. From me did the All come forth, and unto me did the All extend. Split a piece of wood, and I am there. Lift up the stone, and you will find me there."',
          textVersions: {
            lambdin: 'Jesus said, "It is I who am the light which is above them all. It is I who am the All. From me did the All come forth, and unto me did the All extend. Split a piece of wood, and I am there. Lift up the stone, and you will find me there."',
            greek: '',
          },
          entities: [
            { word: 'Split a piece of wood, and I am there', node: 'logos', type: 'concept',
              note: 'Thomas L.77 is the most radical immanence statement in early Christian literature. The divine Logos is in wood and stone — not figuratively (in the sense that God created them) but literally present in the material. "Split wood, lift stone" — the most ordinary manual labor — reveals the divine. This is the complete opposite of the Gnostic tendency toward world-rejection. Thomas L.77 uses Gnostic language ("I am the All") to arrive at a profoundly immanent conclusion. The wood and stone are not prisons for the divine spark (the Gnostic view); they are vessels in which the divine is present for those who know how to find it.',
              parallels: [
                { label: 'Corpus Hermeticum XI — God contains all things, everything is full of God', textId: 'corpus-hermeticum-11', note: 'CH XI: "God is everything, and everything is God." Thomas L.77: "I am the All. From me did the All come forth, and unto me did the All extend." Both texts state divine immanence as an identity claim — not "God is like all things" but "the All is the divine" — and both locate that divine All in every material thing.' },
                { label: 'Isaiah 6 — the whole earth is full of his glory', textId: 'isaiah-6', note: 'The seraphim\'s "the whole earth is full of his glory" and Thomas\'s "split wood, I am there; lift stone, find me there" both claim radical divine immanence in the material world. Isaiah\'s formulation is liturgical and declarative; Thomas\'s is practical and provocative. Both challenge any theology that restricts the divine to a holy place (Temple, throne room) rather than the ordinary material world.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Light Within (L.24, L.50)',
      verses: [
        {
          ref: 'L.24',
          text: 'His disciples said to him, "Show us the place where you are, since it is necessary for us to seek it." He said to them, "Whoever has ears, let him hear. There is light within a man of light, and he lights up the whole world. If he does not shine, he is darkness."',
          textVersions: {
            lambdin: 'His disciples said to him, "Show us the place where you are, since it is necessary for us to seek it." He said to them, "Whoever has ears, let him hear. There is light within a man of light, and he lights up the whole world. If he does not shine, he is darkness."',
            greek: '',
          },
          entities: [
            { word: 'There is light within a man of light', node: 'logos', type: 'concept',
              note: 'Thomas L.24 gives the inner-light teaching: the "man of light" (anthropos tou phōtos) contains light as an inherent possession. This is not a metaphor for moral virtue but a cosmological claim: certain humans carry divine light as their nature (the pneumatics, in Gnostic terminology). The warning "if he does not shine, he is darkness" is Thomas\'s most pressing soteriological statement: possessing the light is not enough; it must be activated. This is the Thomas gospel\'s version of the Bardo instruction "recognize it, do not flee."',
              parallels: [
                { label: 'Poimandres — the divine Nous in the human soul', textId: 'corpus-hermeticum-1', note: 'CH I: the Nous (divine mind) descends and becomes trapped in human form, yet remains divine in its nature. Thomas L.24\'s "man of light" who carries light within is the Hermetic pneumatic: the person in whom the divine Nous is actively operative, radiating the light that was always present.' },
                { label: 'Bardo Thodol — your awareness is itself the Clear Light', textId: 'bardo-thodol', note: '"Your own awareness, having no birth nor death, is indeed the Immutable Light." Thomas\'s "light within a man of light" and the Bardo\'s "your awareness is the Clear Light" are the same claim: the divine luminosity is not external to be sought but internal to be recognized. The "man of light" has recognized what the Bardo calls the dharmakaya.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

SCRIPTURE_TEXTS['ibn-arabi-fusus'] = {
  title: 'Ibn Arabi — Fusus al-Hikam (Bezels of Wisdom)',
  shortTitle: 'Fusus al-Hikam',
  tradition: 'Islamic / Sufi',
  date: 'c. 1229 CE',
  intro: 'Ibn Arabi (1165–1240 CE) is the supreme philosopher-mystic of Islam — the "Greatest Sheikh" (al-Shaykh al-Akbar) — whose Fusus al-Hikam (Bezels of Wisdom) is among the most complex and controversial works in Islamic thought. Written in 1229 CE, the Fusus presents 27 chapters, each devoted to a prophet (Adam, Noah, Abraham, Moses, Jesus, Muhammad...) who embodies a particular divine name or attribute. The title image: each prophet is a bezel (the carved setting that holds a gemstone in a ring) — a particular form that holds the divine light in a specific way. The central concept is the Haqiqa Muhammadiyya (Muhammadan Reality) — the divine Logos that existed before Muhammad\'s historical birth, the pre-eternal template of all prophecy, identified with the Logos of John 1 and the Hermetic Nous. Ibn Arabi\'s wahdat al-wujud (unity of being) — the doctrine that there is only one Being and all apparent multiplicity is the self-disclosure (tajalli) of the One — is the Islamic formulation of Plotinus\' emanation, the Hermetic "everything is God," the Vedantic Brahman, and the Tao. The Fusus was condemned by some Islamic authorities as heresy; celebrated by others as the summit of Islamic mystical theology.',
  crossTradition: [
    { label: 'Poimandres (CH I) — the Logos / Nous as the divine template', textId: 'corpus-hermeticum-1', note: 'Ibn Arabi\'s Haqiqa Muhammadiyya — the pre-eternal Logos that is the template for all creation and all prophecy — and Poimandres\' Nous (divine mind) that is the first emanation from the divine and the template for the human soul are structurally identical: a mediating divine principle between the absolute One and created multiplicity. Both texts place this mediating principle at the beginning of all things, before any particular creation.' },
    { label: 'Plotinus Enneads — wahdat al-wujud as Islamic Neoplatonism', textId: 'plotinus-enneads', note: 'Ibn Arabi\'s wahdat al-wujud (unity of being: there is only one Being, and all things are its self-disclosure) is the Islamic formulation of Plotinus\' emanation metaphysics. Both systems: a single infinite source → emanation/self-disclosure into multiplicity → multiplicity that is really the source manifesting in different modes. Islamic philosophy transmitted Plotinus to Ibn Arabi through al-Farabi and Ibn Sina. The Fusus is the culmination of that transmission.' },
    { label: 'Rumi Masnavi — the Sufi love-mysticism that Ibn Arabi systematizes', textId: 'rumi-masnavi', note: 'Ibn Arabi and Rumi are contemporaries (both 13th century), both in the Persian-Arabic Sufi world, both influenced by the Andalusian and Eastern Sufi traditions. Rumi expresses in poetry what Ibn Arabi systematizes in philosophy: the soul\'s longing for and union with the divine One. The reed\'s cry for the reed bed (Rumi) and Ibn Arabi\'s tajalli (divine self-disclosure through love) are the same mystical insight in different genres.' },
    { label: 'John 1 — the Logos as the mediating principle', textId: 'corpus-hermeticum-1', note: 'John 1:1: "In the beginning was the Logos, and the Logos was with God, and the Logos was God." Ibn Arabi\'s Haqiqa Muhammadiyya: the pre-eternal Muhammadan Light that existed "when Adam was between water and clay." Both identify a pre-eternal Logos principle that mediates between the absolute divine and created existence. Islamic tradition formally identifies the pre-eternal Muhammadan Light with the Logos — making Ibn Arabi\'s system a direct engagement with the Johannine prologue.' },
  ],
  translations: [
    { id: 'austin', label: 'Austin 1980 (T1)' },
    { id: 'arabic', label: 'Arabic (original)' },
  ],
  sections: [
    {
      heading: 'The Adam Bezel — The Divine Image (Ch.1)',
      verses: [
        {
          ref: 'Ch.1 (Adam)',
          text: 'God willed, in relation to His Beautiful Names whose number is immeasurable, to see their essences — or, if you wish, to see His Own Essence — in a comprehensive being who, having received all of the divine reality, would enable God\'s mystery to be disclosed to God Himself.',
          textVersions: {
            austin: 'God willed, in relation to His Beautiful Names whose number is immeasurable, to see their essences — or, if you wish, to see His Own Essence — in a comprehensive being who, having received all of the divine reality, would enable God\'s mystery to be disclosed to God Himself.',
            arabic: 'أراد الحق سبحانه أن يرى أعيان أسمائه الحسنى أو قل أن يرى عينه في كون جامع يحصر الأمر كله',
          },
          entities: [
            { word: 'to see His Own Essence in a comprehensive being', node: 'adam-primal', type: 'concept',
              note: 'This is Ibn Arabi\'s most audacious claim: God created humanity (Adam as the comprehensive being, al-insān al-kāmil, the Perfect Human) in order to see His own essence. Creation is divine self-knowledge through a mirror. This directly parallels the Neoplatonic chain: the One overflows into Intellect because Intellect is the One reflecting itself. Ibn Arabi\'s Islamic reading of Genesis ("God created man in His image") becomes: the image is the mirror through which the divine knows itself. The creation is for the sake of the Creator\'s self-disclosure.',
              parallels: [
                { label: 'Plotinus Enneads — the One overflows into Intellect as self-contemplation', textId: 'plotinus-enneads', note: 'Plotinus: "This product turns towards it [the One] and is filled, and looking towards it becomes Intellect." Ibn Arabi: God wills to see His own essence in the comprehensive being (humanity). Both describe creation as proceeding from divine self-contemplation and serving as a mirror for divine self-knowledge. The direction is the same: the absolute self-discloses through a mediating principle that reflects the absolute back to itself.' },
                { label: 'Apocryphon of John — Barbelo as the first reflection of the Monad', textId: 'apocryphon-of-john', note: 'The Apocryphon\'s Monad contemplates itself and Barbelo (First Thought) arises as the first reflection — "She became the first thought, his image." Ibn Arabi\'s Adam as the mirror through which God sees His own essence, and the Apocryphon\'s Barbelo as the Monad\'s self-reflection — are the same divine self-knowledge structure, expressed in Islamic and Gnostic vocabularies respectively.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'Tajalli — Divine Self-Disclosure',
      verses: [
        {
          ref: 'Ch.1 (cont.)',
          text: 'Know that God speaks of His self-disclosure (tajalli) to His servants, and He never discloses Himself twice in the same form, nor does He veil Himself twice in the same form. For self-disclosure changes in form according to the preparedness of each recipient.',
          textVersions: {
            austin: 'Know that God speaks of His self-disclosure (tajalli) to His servants, and He never discloses Himself twice in the same form, nor does He veil Himself twice in the same form. For self-disclosure changes in form according to the preparedness of each recipient.',
            arabic: 'اعلم أن الله تعالى يذكر تجلّيه لعباده وهو لا يتجلى في صورة واحدة مرتين ولا يتحجب في صورة واحدة مرتين',
          },
          entities: [
            { word: 'He never discloses Himself twice in the same form', node: 'tradition-sufism', type: 'concept',
              note: 'Tajalli — divine self-disclosure — is Ibn Arabi\'s central technical term. The infinite divine Being discloses itself in every moment and in every thing, but never in exactly the same form twice: each disclosure is unique because the recipient (each creature) is unique in its preparedness to receive. This is simultaneously: (1) an explanation of religious diversity (each prophet receives a unique tajalli), (2) an explanation of why no description of the divine is exhaustive (each divine self-disclosure is one facet of the infinite), and (3) a theology of immanence (the divine is present in everything because everything is a tajalli).',
              parallels: [
                { label: 'Tao Te Ching 1 — the Tao that changes form without end', textId: 'tao-te-ching-1', note: 'Laozi\'s Tao generates all things, is in all things, yet cannot be fixed in any one form — "the Tao that can be named is not the eternal Tao." Ibn Arabi\'s tajalli that never repeats the same form and Laozi\'s Tao that cannot be named or fixed are both theologies of infinite divine inexhaustibility: the divine is always disclosing itself in new forms, always more than any particular disclosure.' },
                { label: 'Plotinus — the One that overflows without being diminished', textId: 'plotinus-enneads', note: 'Plotinus\' One that emanates without diminishing and Ibn Arabi\'s divine self-disclosure that never repeats are both models of divine generosity/overflow: the infinite can give itself endlessly without being depleted, because giving is the mode of its being.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'The Jesus Bezel — The Breath of Divine Mercy (Ch.15)',
      verses: [
        {
          ref: 'Ch.15 (Jesus)',
          text: 'The reality of Jesus, as far as his elemental composition is concerned, is the reality of Adam. God breathed into him of His Spirit, just as He breathed it into Adam. Jesus spoke with people from the cradle in order that the proof might be established... The Spirit of God is Jesus because the divine breath that brought him into existence named him "Spirit of God" and "His Word."',
          textVersions: {
            austin: 'The reality of Jesus, as far as his elemental composition is concerned, is the reality of Adam. God breathed into him of His Spirit, just as He breathed it into Adam. Jesus spoke with people from the cradle in order that the proof might be established... The Spirit of God is Jesus because the divine breath that brought him into existence named him "Spirit of God" and "His Word."',
            arabic: 'حقيقة عيسى من حيث تركيبه العنصري حقيقة آدم نفخ الله فيه من روحه كما نفخ في آدم',
          },
          entities: [
            { word: 'The Spirit of God is Jesus because the divine breath', node: 'logos', type: 'concept',
              note: 'Ibn Arabi synthesizes the Quranic titles for Jesus (Ruh Allah — Spirit of God; Kalima — His Word) with the Hermetic and Johannine Logos. Jesus = Word of God = the pre-eternal Logos made temporal — the same move John 1:14 makes ("the Word became flesh"). Ibn Arabi is doing Islamic Logos theology: the Haqiqa Muhammadiyya is the ultimate Logos; Jesus is one of its supreme temporal manifestations. This chapter is where Ibn Arabi comes closest to the Johannine Prologue while remaining firmly within Islamic theology.',
              parallels: [
                { label: 'John 1 — "In the beginning was the Logos... and the Logos became flesh"', textId: 'corpus-hermeticum-1', note: 'John 1:14\'s Logos made flesh and Ibn Arabi\'s "Spirit of God is Jesus because the divine breath that brought him into existence named him His Word" are the same theological claim in Christian and Islamic registers: Jesus is the incarnation of the pre-eternal divine Word/Logos. Ibn Arabi reads the Quranic titles for Jesus (Ruh Allah, Kalima) through a Logos theology that is explicitly parallel to John 1.' },
                { label: 'Poimandres — the divine Nous descending through the spheres to become human', textId: 'corpus-hermeticum-1', note: 'CH I\'s Anthropos descending through the spheres, taking on the qualities of each sphere, and becoming the divine in human form — and Ibn Arabi\'s Jesus as the divine breath made flesh — are both mythological accounts of the descent of the highest divine principle into temporal, material existence. Both traditions use this descent to explain the divine potential in humanity.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};

SCRIPTURE_TEXTS['psalm-22'] = {
  title: 'Psalm 22 — My God, Why Have You Forsaken Me',
  shortTitle: 'Psalm 22',
  tradition: 'Hebrew Bible',
  date: 'c. 1000–500 BCE',
  intro: 'Psalm 22 is the most theologically complex of the lament psalms — a text that moves from the abyss of abandonment to the summit of praise, without resolving the tension between them. It opens with "My God, my God, why have you forsaken me?" and closes with a vision of all nations worshipping and all generations declaring God\'s deliverance. Jesus quotes the opening verse from the cross (Matthew 27:46, Mark 15:34), making Psalm 22 the interpretive lens through which his crucifixion is understood. But the psalm\'s own logic is richer than typology: the forsaken one has not been forsaken — "He has not despised or scorned the suffering of the afflicted one; he has not hidden his face from him but has listened to his cry for help" (v.24). The Psalm is a dramatic movement through the experience of divine abandonment into the recognition that the abandonment was never real. This structure — apparent abandonment → actual presence revealed — is the deep logic of the Bardo Thodol (the Clear Light appears to be overwhelming and alien, but it is your own nature), the Rumi reed (the cry of separation is itself the expression of the love that connects), and the Apocryphon\'s Sophia (grief over separation from the divine, but the divine light is still within).',
  crossTradition: [
    { label: 'Rumi Masnavi — the reed\'s cry of separation contains the love that connects', textId: 'rumi-masnavi', note: 'Psalm 22\'s movement from "why have you forsaken me" to "he has not hidden his face" — the apparent abandonment revealing the actual presence — is structurally identical to Rumi\'s reed-cry: the reed cries because it is separated from the reed bed, but the cry itself is the expression of the love that was never broken. The cry IS the connection. Both texts move from apparent absence to revealed presence through the act of crying out.' },
    { label: 'Apocryphon of John — Sophia\'s grief and the divine light still within', textId: 'apocryphon-of-john', note: 'The Gnostic Sophia, grieving after the fall, still has the light within her (Yaldabaoth stole the power but the light remains). Psalm 22\'s psalmist, apparently forsaken, is actually held (v.24). Both texts stage the same move: the experience of divine abandonment, followed by the recognition that the abandonment was not real — the divine presence never actually withdrew.' },
    { label: 'Bardo Thodol — the terrifying divine light that is actually your own nature', textId: 'bardo-thodol', note: 'The dying person in the Bardo encounters the overwhelming Clear Light and may experience it as threatening — fleeing from what is actually their own nature. Psalm 22\'s psalmist experiences the divine as having withdrawn — and discovers that what felt like abandonment was actually presence. Both texts move from apparent divine hostility or absence to recognition of actual divine nearness.' },
    { label: 'Isaiah 6 — the prophet undone before the divine throne', textId: 'isaiah-6', note: 'Isaiah\'s "Woe is me! I am lost" before the divine throne and Psalm 22\'s "My God, my God, why have you forsaken me?" are both moments of the self\'s dissolution before the divine. The prophetic and the lament traditions both reach the same moment of radical nakedness before God — and both are met by divine commissioning or divine presence revealed.' },
  ],
  translations: [
    { id: 'nrsv', label: 'NRSV (T1)' },
    { id: 'hebrew', label: 'Hebrew (original)' },
  ],
  sections: [
    {
      heading: 'The Cry of Abandonment (22:1–5)',
      verses: [
        {
          ref: '22:1–2',
          text: 'My God, my God, why have you forsaken me? Why are you so far from saving me, so far from my cries of anguish? My God, I cry out by day, but you do not answer, by night, but I find no rest.',
          textVersions: {
            nrsv: 'My God, my God, why have you forsaken me? Why are you so far from saving me, so far from my cries of anguish? My God, I cry out by day, but you do not answer, by night, but I find no rest.',
            hebrew: 'אֵלִי אֵלִי לָמָה עֲזַבְתָּנִי רָחוֹק מִישׁוּעָתִי דִּבְרֵי שַׁאֲגָתִי',
          },
          entities: [
            { word: 'My God, my God, why have you forsaken me', node: '', type: 'concept',
              note: 'Eli eli lama azavtani — "My God, my God, why have you forsaken me?" Quoted by Jesus from the cross in both Matthew 27:46 and Mark 15:34 (in Aramaic: Eloi eloi lema sabachthani). This is the only time in the Gospels that Jesus quotes a psalm from the cross, and it is significant that he quotes the opening of a text that moves through abandonment to praise. Early Christian exegetes read the entire Psalm 22 as a prophetic script of the crucifixion (v.18: "they divide my garments among them"; v.16: "they have pierced my hands and my feet"). But the psalm itself is not about resignation — it is a lament that becomes praise. The abandonment is the doorway, not the conclusion.',
              parallels: [
                { label: 'Rumi Masnavi — the reed\'s cry of separation', textId: 'rumi-masnavi', note: 'Rumi\'s opening: "Listen to the reed, how it tells a tale, complaining of separations." Psalm 22\'s opening: "My God, why have you forsaken me?" Both are cries of apparent abandonment from a position of real love. In Rumi, the cry itself is the evidence of the connection; in Psalm 22, the cry is addressed to the God who has apparently withdrawn — which itself implies a relationship that cannot be abandoned.' },
                { label: 'Bardo Thodol — consciousness experiencing the divine as overwhelming and absent', textId: 'bardo-thodol', note: 'The Bardo consciousness that flees the Clear Light and experiences it as threatening is parallel to Psalm 22\'s experience of divine absence. In both cases, what is experienced as abandonment or threat is actually the overwhelming presence of the divine. The Bardo instructs: recognize it, don\'t flee. The Psalm enacts the recognition from within the experience of abandonment.' },
              ]
            },
          ]
        },
        {
          ref: '22:3–5',
          text: 'Yet you are enthroned as the Holy One; you are the one Israel praises. In you our ancestors put their trust; they trusted and you delivered them. To you they cried out and were saved; in you they trusted and were not put to shame.',
          textVersions: {
            nrsv: 'Yet you are enthroned as the Holy One; you are the one Israel praises. In you our ancestors put their trust; they trusted and you delivered them. To you they cried out and were saved; in you they trusted and were not put to shame.',
            hebrew: 'וְאַתָּה קָדוֹשׁ יוֹשֵׁב תְּהִלּוֹת יִשְׂרָאֵל',
          },
          entities: [
            { word: 'Yet you are enthroned as the Holy One', node: 'tradition-jewish-mysticism', type: 'concept',
              note: 'The "yet" (v\'attah — "and you") is the psalm\'s crucial pivot. The psalmist moves without resolution from "you have forsaken me" to "you are the Holy One." The tension is not resolved; it is held. This is the theological sophistication of the lament psalm: the abandonment is real as experience; the faithfulness is real as theology. Both are asserted simultaneously. This is not cognitive dissonance but theological honesty — the mature faith that can hold apparent divine absence and divine faithfulness in the same breath.',
              parallels: [
                { label: 'Isaiah 6 — "yet I saw the Lord seated on a throne high and exalted"', textId: 'isaiah-6', note: 'Isaiah\'s vision opens with the LORD enthroned in majesty even as the kingdom collapses around him (King Uzziah has just died). Psalm 22\'s "yet you are enthroned" in the midst of abandonment and Isaiah\'s throne vision in the year of political crisis — both locate the divine enthronement as the stable reality behind apparent disaster.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'He Has Not Hidden His Face (22:22–24)',
      verses: [
        {
          ref: '22:22–24',
          text: 'I will declare your name to my people; in the assembly I will praise you. You who fear the LORD, praise him! All you descendants of Jacob, honor him! Revere him, all you descendants of Israel! For he has not despised or scorned the suffering of the afflicted one; he has not hidden his face from him but has listened to his cry for help.',
          textVersions: {
            nrsv: 'I will declare your name to my people; in the assembly I will praise you. You who fear the LORD, praise him! All you descendants of Jacob, honor him! Revere him, all you descendants of Israel! For he has not despised or scorned the suffering of the afflicted one; he has not hidden his face from him but has listened to his cry for help.',
            hebrew: 'כִּי לֹא-בָזָה וְלֹא שִׁקַּץ עֱנוּת עָנִי וְלֹא-הִסְתִּיר פָּנָיו מִמֶּנּוּ וּבְשַׁוְּעוֹ אֵלָיו שָׁמֵעַ',
          },
          entities: [
            { word: 'he has not hidden his face from him but has listened', node: '', type: 'concept',
              note: 'The theological resolution of Psalm 22: the "hiding of the face" (hester panim — a key phrase in Jewish theology for divine absence or eclipse) is revealed to have been an experience, not a reality. God did not hide; God listened. The entire journey from "why have you forsaken me" to "he has listened" is a movement from the experience of abandonment to the recognition of presence that was always there. This is the psalms\' deepest theological contribution: the language of abandonment is not a failure of faith but a form of faith — crying out to God in the midst of apparent absence is itself the proof of the relationship.',
              parallels: [
                { label: 'Apocryphon of John — Sophia\'s grief but the light still within', textId: 'apocryphon-of-john', note: 'Sophia grieves her separation and error — "she recognized that he lacked something when the light of her brightness diminished." But the light she imparted to Yaldabaoth is never entirely lost; it returns through the salvific process. Psalm 22\'s journey from apparent abandonment to "he has listened" and Sophia\'s journey from grief to eventual restoration both enact the same theological claim: apparent separation does not constitute real abandonment.' },
              ]
            },
          ]
        },
      ]
    },
    {
      heading: 'All the Ends of the Earth (22:27–31)',
      verses: [
        {
          ref: '22:27–28',
          text: 'All the ends of the earth will remember and turn to the LORD, and all the families of the nations will bow down before him, for dominion belongs to the LORD and he rules over the nations.',
          textVersions: {
            nrsv: 'All the ends of the earth will remember and turn to the LORD, and all the families of the nations will bow down before him, for dominion belongs to the LORD and he rules over the nations.',
            hebrew: 'יִזְכְּרוּ וְיָשֻׁבוּ אֶל-יְהוָה כָּל-אַפְסֵי-אָרֶץ וְיִשְׁתַּחֲווּ לְפָנֶיךָ כָּל-מִשְׁפְּחוֹת גּוֹיִם',
          },
          entities: [
            { word: 'All the ends of the earth will remember', node: '', type: 'concept',
              note: 'The Psalm\'s conclusion is universalist and eschatological: not just Israel but all the families of the nations will turn to the LORD. The movement from the individual\'s cry of abandonment (v.1) to the universal recognition of divine sovereignty (v.27) spans the full range of theological scale — from the most intimate personal lament to the most cosmic communal praise. This universalist conclusion is the psalm\'s most cross-traditional moment: not the God of Israel only but the divine reality recognized by all peoples. The Psalm\'s structure enacts the movement from particular crisis to universal recognition that is the deep pattern of the great mystical traditions.',
              parallels: [
                { label: 'Bhagavad Gita 11 — all beings flowing into the Vishvarupa', textId: 'bhagavad-gita-11', note: 'BG 11\'s vision of all beings flowing into Krishna\'s cosmic form — "all the troops of gods... all the sages and divine serpents" — and Psalm 22\'s "all the ends of the earth will remember and turn to the LORD" — both move from the particular (the psalmist\'s crisis, Arjuna\'s battle) to the universal (all nations bowing, all beings in the divine form). The particular crisis is the doorway to the universal recognition.' },
              ]
            },
          ]
        },
      ]
    },
  ]
};
