// CODEX ATLAS — TRANSMISSION CHAINS
// Curated, documented chains showing how ideas, institutions, and sonic technologies
// traveled across time and civilizations. Each chain is a sequence of linked nodes
// with dates, annotations, and categories.
//
// category values:
//   'INSTITUTIONAL' — mainstream/court/church transmission (documented, continuous)
//   'ESOTERIC'      — Hermetic/Gnostic/occult spine (documented, often suppressed)
//   'GEOGRAPHIC'    — cross-cultural transmission across trade corridors
//   'CONVERGENCE'   — parallel independent discovery, no contact
//
// links[].node: a real vault node ID (clicking opens its detail panel)
// Agents: extend this file with new chains as the investigation grows.
// The tab auto-updates on next page load.

window.CHAINS_DATA = [

  // ─── I. SONIC TRANSMISSION CHAINS ────────────────────────────────────────

  {
    id: 'babylon-to-bach',
    title: 'The Great Scale Transmission — Babylon to Bach',
    category: 'INSTITUTIONAL',
    span: 'c. 1800 BCE – 1722 CE · 3,500 years',
    summary: 'The most documented long-range music-theory transmission in history. A heptatonic scale organized around consonant intervals, transmitted in continuous documented use across 3,500 years and three civilizations. The chain survives one critical bottleneck (Boethius) and ends with a deliberate theoretical compromise (equal temperament) that broke it — but only after 3,500 years of purity.',
    links: [
      {
        date: 'c. 1800 BCE',
        label: 'Babylonian Tuning Tablets',
        node: 'music-hurrian-hymns',
        note: 'CBS 10996 and UET VII 126: nine-string tuning system using a cycle of fifths — the identical procedure to Pythagorean tuning. Named intervals (nīd qabli, išartu, qablītu) correspond one-to-one with Greek modal names.'
      },
      {
        date: 'c. 550 BCE',
        label: 'Pythagorean Harmony',
        node: 'music-pythagorean-harmony',
        note: 'Iamblichus reports Pythagoras studied in Babylon for 12 years. Whether biographical fact or not, the theoretical overlap between Babylonian tablets and Pythagorean tuning is too precise for independent reinvention.'
      },
      {
        date: 'c. 360 BCE',
        label: 'Plato — Timaeus World-Soul',
        node: 'music-plato-timaeus-worldsoul',
        note: 'The Demiurge constructs the world-soul using the same mathematical ratios as a musical scale. Pythagorean intervals become the architecture of the cosmos — music theory and cosmology permanently fused.'
      },
      {
        date: '510 CE',
        label: 'Boethius — De Institutione Musica',
        node: 'music-boethius-de-musica',
        note: 'The single human most responsible for this chain\'s survival — and its most famous error. He transmitted Greek music theory into Latin but mistranslated the modal names. 900 years of Western music built on this error, which was generative: it produced a coherent new modal system.'
      },
      {
        date: 'c. 590 CE',
        label: 'Gregorian Modes — Church Chant Codification',
        node: 'music-gregorian-modes',
        note: 'Pope Gregory I codifies Western liturgical chant using the Boethian (not Greek) modal framework. The "Gregorian modes" bear Greek names but are not the Greek modes those names described. A 900-year tradition built on a mistranslation.'
      },
      {
        date: '1722 CE',
        label: 'Bach — Well-Tempered Clavier',
        node: 'music-scale-transmission-chain',
        note: 'Equal temperament: a deliberate theoretical compromise distributing the "wolf fifth" dissonance equally across all 12 keys. Bach\'s demonstration piece for this system ends 3,500 years of pure Pythagorean intonation. Every key slightly impure; every key usable. The chain breaks — and produces the richest harmonic tradition in Western music.'
      },
    ],
  },

  {
    id: 'orphic-hermetic-esoteric-spine',
    title: 'The Esoteric Sonic Spine — Orpheus to Ficino',
    category: 'ESOTERIC',
    span: 'c. 600 BCE – 1500 CE · 2,100 years',
    summary: 'The Western esoteric tradition\'s parallel sonic transmission chain. Runs alongside the institutional Babylon-to-Bach chain, shares the Pythagorean node, then diverges — one strand goes through Boethius into church music; this strand goes through the Chaldean Oracles into Neoplatonic theurgy. Both chains reconverge in the Renaissance when Ficino translates Plato and the Corpus Hermeticum in the same decade.',
    links: [
      {
        date: 'c. 600 BCE',
        label: 'Orphic Hymns — Sonic Divine-Name Ritual',
        node: 'music-orphic-hymns',
        note: 'The Western mantra tradition: 87 hymns using precise divine names in specific meter to summon divine presence. Sound is not description — it is invocation. Iamblichus later cites Orphic practice as the foundation for all Hermetic theurgic sound work.'
      },
      {
        date: 'c. 550 BCE',
        label: 'Pythagorean Music of Spheres',
        node: 'music-pythagorean-harmony',
        note: 'SHARED NODE with the Institutional chain. Here the two strands diverge: the institutional chain goes through Boethius to the church; the esoteric chain goes through the Chaldean Oracles to theurgy.'
      },
      {
        date: 'c. 360 BCE',
        label: 'Plato Timaeus — World-Soul as Scale',
        node: 'music-plato-timaeus-worldsoul',
        note: 'Shared with the institutional chain. Demiurge builds the cosmos from musical ratios. In the esoteric reading: the soul must re-harmonize with these ratios to ascend. Music is not aesthetic but soteriological.'
      },
      {
        date: 'c. 160–180 CE',
        label: 'Marcus the Magician — Pleroma as Harmonic Series',
        node: 'music-valentinian-pleroma-harmony',
        note: 'The most explicit ancient statement that cosmic structure IS a harmonic series: 24 Greek letters map onto musical intervals and onto pleroma aeons. The 7 vowels = 7 planetary spheres = 7 scale notes. Not metaphor — a working theory.'
      },
      {
        date: 'c. 170–200 CE',
        label: 'Chaldean Oracles — Iynx and Sound-Ascent',
        node: 'music-chaldean-oracles-sound',
        note: 'The iynx (whirling divine sound-fire) mediates between the transcendent Father and the lower cosmos. Soul-ascent described acoustically. Before the Oracles: music-of-spheres is philosophy. After: specific sonic practices become operative tools for soul-ascent.'
      },
      {
        date: 'c. 300 CE',
        label: 'Iamblichus — Neoplatonic Theurgy',
        node: 'music-neoplatonic-theurgy-sound',
        note: 'De Mysteriis: the divine voice (phone) independent of meaning reaches the divine where rational discourse (logos) cannot. Specific vowel sequences, untranslatable divine names, and instruments as operative technology. The music-of-spheres theory becomes a ritual practice.'
      },
      {
        date: 'c. 100–300 CE',
        label: 'Corpus Hermeticum — Logos-Sound Cosmology',
        node: 'music-hermetic-logos-sound',
        note: 'Creation begins with darkness groaning a wailing sound; the Logos descends into it. Seven-sphere ascent = re-tuning to the cosmic scale. The Discourse on the 8th and 9th: mystical transcendence = going beyond the octave. Hermes Trismegistus = Thoth (creator-by-naming) + Hermes (lyre-inventor + psychopomp).'
      },
      {
        date: 'c. 1460–1600 CE',
        label: 'Renaissance Hermeticism — Reconvergence',
        node: 'tradition-renaissance-hermeticism',
        note: 'Ficino translates the Corpus Hermeticum and Plato in the same decade. Both sonic chains — institutional and esoteric — reconverge in the Renaissance. Lyre therapy, music of the spheres as living practice, and the birth of Western classical music all happen simultaneously.'
      },
    ],
  },

  {
    id: 'priestly-musician-caste',
    title: 'The Priestly Musician Caste — Transmission and Convergence',
    category: 'GEOGRAPHIC',
    span: 'c. 2500 BCE – 70 CE and ongoing',
    summary: 'Three civilizations independently developed — or transmitted — the institution of a hereditary, salaried priestly caste whose primary function is ritual music. Egypt predates the others by 1,000+ years. The Egypt→Israel leg is a documented transmission; the India leg is a genuine independent convergence from entirely different theological premises. The first confirmed vault case of a form that is simultaneously transmissible AND independently reinventable.',
    links: [
      {
        date: 'c. 2500 BCE',
        label: 'Egyptian Temple Musicians — Hathor / Sistrum',
        node: 'music-ancient-egyptian-music',
        note: 'World\'s earliest documented priestly musician institution. Hereditary caste, salaried, ritual function centered on the sistrum (sacred rattle of Hathor). Predates the Levitical singers by 1,550 years.'
      },
      {
        date: 'c. 2100 BCE',
        label: 'Mesopotamian Gala Priests',
        node: 'music-mesopotamian-temple-music',
        note: 'Fertile Crescent shared-origin or parallel development. World\'s first salaried musician payroll (Ur III period). Structurally distinct from Egyptian institution: lamentation function vs. praise/maintenance; required gender-liminality (emesal linguistic register). Direction of influence with Egypt unresolvable from current evidence.'
      },
      {
        date: 'c. 950 BCE',
        label: 'Levitical Temple Singers — Jerusalem',
        node: 'music-levitical-temple-music',
        note: 'DOCUMENTED TRANSMISSION from Egypt: Moses raised in the Egyptian court; kinnor/kinniru instrument cognate; Solomon\'s Temple design shows Egyptian proportional elements; sustained Egypt-Israel trade and cultural corridor (1 Kings). 1,550-year gap = transmission, not independent reinvention.'
      },
      {
        date: 'c. 500 BCE',
        label: 'Indian Temple Musicians — Natya Shastra',
        node: 'music-natya-shastra',
        note: 'GENUINE INDEPENDENT CONVERGENCE. The Sama Veda (-1200) predates the Ophir trade corridor peak. Derives from entirely different theological premises: Nada Brahma (sound IS Brahman) rather than any priestly-function inheritance. The same institutional form arrived from different first principles.'
      },
    ],
  },

  {
    id: 'sacred-drone-convergence',
    title: 'The Sacred Drone — Six Traditions, One Technology',
    category: 'CONVERGENCE',
    span: 'Pre-history – present · all inhabited continents',
    summary: 'Six traditions independently discovered that sustaining a single tone (or narrow frequency band of tones) produces altered states, spirit contact, or sacred presence. The drone is not a musical form — it is a sonic technology that every tradition working with acoustic altered states independently reinvented. The physics explains why: sustained tones with rich overtones trigger brainwave entrainment and vagal stimulation.',
    links: [
      {
        date: 'c. 60,000 BCE',
        label: 'Aboriginal Australian Didgeridoo',
        node: 'music-aboriginal-songlines',
        note: 'Oldest continuously played drone instrument in documented use. The didgeridoo\'s circular-breathing sustained tone is the sonic anchor for Songline performance. Its overtone buzz is deliberately cultivated to create a frequency-rich sustained field.'
      },
      {
        date: 'c. 1200 BCE',
        label: 'Vedic AUM / Tanpura',
        node: 'music-aum-cosmic-sound',
        note: 'AUM as the primordial sound of the cosmos; tanpura as the sustained drone underlying raga performance. The drone is not background — it IS the raga\'s ground of being. Every raga is heard against the tanpura\'s sustained harmonics.'
      },
      {
        date: 'c. 500 CE',
        label: 'Mbira — Shona Spirit Music',
        node: 'music-mbira-spirit-music',
        note: 'Mbira\'s bottle-cap buzz: deliberately engineered overtone halo acoustically identical to the tanpura drone\'s function. Used in all-night bira ceremonies for ancestral spirit contact. African entry in the drone convergence table.'
      },
      {
        date: 'c. 500 CE',
        label: 'Byzantine Orthodox Ison',
        node: 'music-western-sacred-chant',
        note: 'A sustained drone pitch (ison) underlies Byzantine liturgical chant. Eastern Orthodoxy independently maintained the drone function the Western church abandoned. The ison is sung by a designated group while others carry the melody.'
      },
      {
        date: 'c. 900 CE',
        label: 'Sufi Sama — Ecstatic Chant',
        node: 'music-sufi-sama',
        note: 'Sustained instrumental drone underlying qawwali performance. The drone creates the altered-state field into which the devotional melody is placed. Rumi\'s Mevlevi order uses both drone and turning (whirling) simultaneously as dual altered-state technologies.'
      },
      {
        date: 'c. 200 BCE',
        label: 'Tibetan Singing Bowls — Overtone Chanting',
        node: 'music-sacred-drone',
        note: 'Intentional production of overtone harmonics above a fundamental drone. Tibetan Buddhist monks trained to produce two simultaneous pitches (fundamental + harmonic) with the voice. Same acoustic field as all other entries; different ritual context.'
      },
    ],
  },

  {
    id: 'raga-time-gradient',
    title: 'The Raga Time-Structure Gradient — Five Traditions, One Went All the Way',
    category: 'CONVERGENCE',
    span: 'c. 380 BCE – ongoing',
    summary: 'Every major civilization independently developed the intuition that different times of day require different music. Five traditions got partway there. Only India built the full system: specific ragas assigned to specific times as cosmological obligation, with a complete theoretical apparatus connecting scale structure to cosmic state. The gradient shows what each tradition had and lacked.',
    links: [
      {
        date: 'c. 380 BCE',
        label: 'Greek Ethos Theory — Plato and Aristotle',
        node: 'music-greek-musical-ethos',
        note: 'Philosophical prescription: specific modes have moral/emotional effects and should be permitted or banned accordingly. Gets the mode-emotion mapping right; no time-of-day structure; no cosmological theory; never implemented as performance practice.'
      },
      {
        date: 'c. 500 BCE',
        label: 'Confucian Yayue — Music as Political Regulation',
        node: 'music-yayue-ritual-music',
        note: 'Music shapes the soul of the citizen, therefore the state must regulate modes. Same argument as Plato, independent development. Implemented as political regulation (Bureau of Music), not as a cosmological time-clock. Mode-virtue mapping without time structure.'
      },
      {
        date: 'c. 622 CE',
        label: 'Islamic Adhan — Maqam Time Conventions',
        node: 'music-islamic-adhan-maqam',
        note: 'Regional conventions assigning specific maqamat to the five prayer times. Living practice, time-keyed. But tawhid doctrine blocks the Nada Brahma step: God is absolutely transcendent; sound cannot BE God. A preference, not a cosmological obligation.'
      },
      {
        date: 'c. 400 CE',
        label: 'Catholic Liturgy of Hours',
        node: 'music-liturgy-of-hours',
        note: 'Eight canonical hours with specific psalm assignments and chant tones. Time-structured and obligatory. But devotional-practical (mark prayer times) not cosmological (this scale structure corresponds to this cosmic state at this time). Gets the time-structure right, lacks the cosmological theory.'
      },
      {
        date: 'c. 200 BCE',
        label: 'Indian Raga Cosmology — The Complete System',
        node: 'music-raga-cosmology',
        note: 'All four structural conditions combined: Nada Brahma ontology (sound IS Brahman), Natya Shastra rasa taxonomy (scale → emotion → cosmic state), unbroken guru-shishya transmission, dual temple+court patronage. A specific raga performed at dawn is not "appropriate for morning" — it participates in the morning as cosmic event. The only tradition that completed the clock.'
      },
    ],
  },

  {
    id: 'east-asian-preservation-paradox',
    title: 'The East Asian Preservation Paradox — China Lost It, Korea and Japan Kept It',
    category: 'GEOGRAPHIC',
    span: 'c. 1000 BCE – present',
    summary: 'The most complete surviving examples of ancient Chinese ritual court music exist in Korea and Japan — not in China. Political disruption at the center (the Tang dynasty\'s fall, the Northern Song collapse) left the cultural periphery as the archive. The same mechanism that saved Greek music theory through Boethius operated in East Asia through two separate transmission events, centuries apart.',
    links: [
      {
        date: 'c. 1000 BCE',
        label: 'Zhou Dynasty — Yayue Court Music Origins',
        node: 'music-yayue-ritual-music',
        note: 'The Confucian ritual music system begins. Codified over 3,000 years through multiple dynasties. The Bureau of Music (太常寺) maintains it as a state function.'
      },
      {
        date: '618–907 CE',
        label: 'Tang Dynasty — Peak Systematization',
        node: 'music-chinese-court-instruments',
        note: 'Instruments categorized by the eight bāyīn material categories mapped onto the eight trigrams. The complete theoretical and practical system at its most elaborate. Tang court music is the gold standard of East Asian classical music.'
      },
      {
        date: '710–794 CE',
        label: 'Japan Imports Tang Music — Gagaku',
        node: 'music-gagaku-japanese',
        note: 'Japanese imperial court imports Tang dynasty court music during the Nara period. Japan freezes the tradition at this point. When the Tang dynasty collapses (907 CE), Japan is the primary archive for 7th-century Chinese pieces that no longer exist in China.'
      },
      {
        date: '1116 CE',
        label: 'Korea Receives Complete Tang Archive — Aak',
        node: 'music-korean-aak',
        note: 'Emperor Huizong sends Korea the most comprehensive official transmission of Chinese court music ever recorded: notation for 428 pieces, complete instrument sets, tuning standards. Within a decade, the Jurchen Jin dynasty captures Huizong and the Song court collapses. Korea holds the archive.'
      },
      {
        date: 'Present',
        label: 'Jongmyo Jeryeak — Living 1,116 CE Archive',
        node: 'music-korean-aak',
        note: 'UNESCO Intangible Cultural Heritage. A visitor attending the Royal Ancestral Shrine Rite in Seoul witnesses a performance tradition whose theoretical foundations were compiled in Song dynasty China in 1116 CE — a tradition that China itself no longer performs in that form. The most authentic version of ancient Chinese court music exists at its geographic margin.'
      },
    ],
  },

];
