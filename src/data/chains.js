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


  {
    id: 'three-hermetic-synthesis-moments',
    title: 'Three Independent Pythagorean-Hermetic Synthesis Moments',
    category: 'CONVERGENCE',
    span: 'c. 200 CE – 1489 CE · three peaks, same source',
    summary: 'The same Greek Pythagorean-Hermetic source material was independently synthesized into a complete music-cosmos-medicine theory three times by three civilizations at their intellectual peaks — 600 years apart each time. Same conclusion: cosmic structure is harmonic; music heals because it re-tunes the body to cosmic ratios. Alexandria built it; Baghdad rebuilt it from Greek translations; Florence rediscovered it from Arabic and Latin manuscripts.',
    links: [
      {
        date: 'c. 200–300 CE',
        label: 'Alexandria — Corpus Hermeticum',
        node: 'music-hermetic-logos-sound',
        note: 'The first synthesis: Greek Pythagorean interval theory + Egyptian Thoth sound-creation theology + Greek Hermetic Logos-descent narrative. The seven planetary spheres as musical scale; soul-ascent as re-tuning. Hermes Trismegistus = Thoth + Hermes = the complete sonic-cosmic figure.'
      },
      {
        date: 'c. 850 CE',
        label: 'Baghdad — Al-Kindi Music Therapy',
        node: 'music-alkindi-music-therapy',
        note: 'Second synthesis, independent: al-Kindi derives the same Pythagorean music-therapy system from Greek sources via the Abbasid translation movement. Four oud strings = four humors = four elements = four musical modes. The House of Wisdom translates Greek music theory and Greek Hermetic philosophy simultaneously — and produces the same synthesis as Alexandria, 600 years later, in Arabic.'
      },
      {
        date: '1463–1489 CE',
        label: 'Florence — Ficino\'s Lyre Therapy',
        node: 'music-ficino-lyre-therapy',
        note: 'Third synthesis: Ficino translates the Corpus Hermeticum (1463) and completes Plato\'s works (1484) — the two chains reconverge through his hands. De Vita (1489): planetary modes as medical technology; the spiritus (subtle body) is most directly reached by sound, bypassing rational mediation. Iamblichean theurgy medicalized. The only human in history who personally translated both sonic chains\' founding texts.'
      },
    ],
  },

  {
    id: 'kabbalistic-sonic-spine',
    title: 'The Kabbalistic Sonic Spine — Letters, Sound, and Cosmic Repair',
    category: 'ESOTERIC',
    span: 'c. 300 BCE – 1600 CE · 1,900 years',
    summary: 'A parallel esoteric sonic spine running entirely within the Jewish tradition: from Sefer Yetzirah\'s letter-sound cosmogony through the Zohar\'s acoustic emanation theology to Abulafia\'s sonic altered-state method to Lurianic kavvanot as theurgic sound practice. At every step, structurally parallel to the Orphic-Pythagorean-Hermetic chain — but developed independently within a different civilization.',
    links: [
      {
        date: 'c. 300 BCE–600 CE',
        label: 'Sefer Yetzirah — Letters as Cosmic Building Blocks',
        node: 'music-sefer-yetzirah-sound',
        note: '22 Hebrew letters + 10 sefirot as the 32 paths of wisdom through which God creates. The letters are not symbols for sounds — they ARE sounds that ARE structures of reality. Speaking them correctly is participation in ongoing creation. Parallel-form to Marcus the Magician\'s 24-Greek-letter cosmology: same architecture, independent development in the same late-antique milieu.'
      },
      {
        date: 'c. 1280 CE',
        label: 'Zohar — Sefirot as Resonant Chambers',
        node: 'music-zohar-sound-mysticism',
        note: 'The ten sefirot described as ten resonant chambers of the divine voice; Torah letters as sound-bodies whose correct vocalization (cantillation) is a cosmological act. Lurianic kavvanot — specific sonic intentions accompanying specific prayer patterns — are theurgic sound practice: precise sonic acts with precise cosmological effects. Parallel to Iamblichus\'s theurgy, 1,200 years later, no documented contact.'
      },
      {
        date: 'c. 1270–1291 CE',
        label: 'Abulafia — Prophetic Letter-Permutation',
        node: 'music-abulafia-prophetic-kabbalah',
        note: 'The most explicit Jewish sonic-altered-state practice: take a divine name, permute its letters according to specific rules, vocalize the permutations rhythmically with coordinated breathing. The sonic pattern — independent of semantic meaning — triggers prophetic consciousness. Structurally identical to Iamblichean vowel-sequence theurgy, Vedic mantra, and Orphic divine-name invocation. Four traditions, no contact, same technology.'
      },
      {
        date: 'c. 1570 CE',
        label: 'Lurianic Kabbalah — Tikkun Through Sonic Practice',
        node: 'music-zohar-sound-mysticism',
        note: 'Isaac Luria\'s kavvanot system: specific sonic intentions must accompany specific vocal patterns in prayer to effect tikkun (cosmic repair). The liturgy becomes a precise sonic-cosmological instrument. Every word of prayer is a theurgic act when performed with correct kavvanah. The Kabbalistic spine\'s most operationally complete expression — the Jewish tradition\'s answer to Iamblichus\'s De Mysteriis.'
      },
    ],
  },

  {
    id: 'music-leads-to-silence',
    title: 'Music Leads to Silence — The Convergent Destination of Every Sonic Mystical Tradition',
    category: 'CONVERGENCE',
    span: 'c. -800 BCE – 1952 CE · 2,750 years',
    summary: 'Every major musical mystical tradition arrives at the same destination: silence. The Pythagorean "unheard music" of the spheres (inaudible precisely because it is continuous). Vedic AUM dissolving into its fourth element, the anāhata (unstruck sound, the sound before sound). Sufi sama ending in fana (annihilation) — the state where the music stops and the listener has dissolved. The Maltese Hypogeum\'s absolute acoustic isolation. And John Cage\'s 4\'33" (1952): four minutes and thirty-three seconds of silence in a concert hall, in which the audience discovers that silence is full of sound — and that the distinction between music and world was always a construction. Every sophisticated sonic system, pursued far enough, concludes that the sound points at something sound cannot contain.',
    links: [
      {
        date: 'c. -800 BCE',
        label: 'Pythagoras — The Inaudible Music of the Spheres',
        node: 'music-pythagorean-harmony',
        note: 'The Pythagorean music-of-spheres has a paradox at its center: the celestial music is inaudible. Aristotle\'s report of the Pythagorean argument: the planets must make sound by their motion, but we do not hear it because we have heard it from birth and cannot distinguish it from silence. The most cosmic music is the one we cannot hear. Silence is not the absence of music — it is music so continuous that we mistake it for nothing.'
      },
      {
        date: 'c. -600 BCE',
        label: 'Vedic AUM — The Fourth Element Is Silence',
        node: 'music-aum-cosmic-sound',
        note: 'The Mandukya Upanishad (c. -600 to -300 BCE) describes AUM as having four elements: A (waking), U (dreaming), M (deep sleep), and a fourth that is soundless — the silence after the M, the transcendent state beyond the three worlds. The complete sound of AUM is A-U-M-silence. The silence is not the ending of the mantra; it IS the mantra\'s destination. Every AUM practice culminates in the wordless state that the sound was preparing.'
      },
      {
        date: 'c. 300 CE',
        label: 'Iamblichus — Beyond the Musical Scale',
        node: 'music-neoplatonic-theurgy-sound',
        note: 'The Corpus Hermeticum\'s Discourse on the Eighth and Ninth: the soul ascending through the seven planetary spheres (seven musical tones) arrives at the Eighth and Ninth — the octave and the realm beyond the octave — which are described as silence and light. The musical system points at something above music. The soul uses the scale to climb to the place where scales are no longer relevant. The sonic ladder is climbed and then abandoned — the same movement as every mystical tradition\'s scaffold.'
      },
      {
        date: 'c. 1200 CE',
        label: 'Rumi and Sufi Sama — Music as the Vehicle for Dissolution',
        node: 'music-sufi-sama',
        note: 'The Masnavi\'s opening: the reed flute "tells of the pain of separation." Sama (sacred listening) leads not to musical ecstasy but to fana — annihilation of the individual self in the divine presence. The music is not the destination; it is the vehicle. The state sama aims at is the state in which listening has dissolved into being, where the boundary between listener and music has vanished. The music stops in fana — not because the ceremony ends but because the self that was listening is no longer there to hear it.'
      },
      {
        date: 'c. 1270-1291 CE',
        label: 'Abulafia — Silence After Letter-Permutation',
        node: 'music-abulafia-prophetic-kabbalah',
        note: 'Abulafia\'s prophetic Kabbalah ends in silence too: the letter-permutation sequence, correctly performed, leads to a state of expanded consciousness in which the permutations are no longer being produced — the practitioner is in the state the permutations were designed to reach. The sonic practice is a bridge to its own dissolution. Abulafia explicitly distinguishes the technique from its goal: the sounds are a ladder, not a dwelling place.'
      },
      {
        date: '1952',
        label: 'John Cage — 4\'33": Silence IS the Concert',
        node: 'music-creation-by-sound',
        note: '4\'33" (premiered at Woodstock, New York, August 29, 1952): pianist David Tudor sits at a piano for four minutes and thirty-three seconds without playing. The audience discovers that the concert hall is full of sound — coughing, rustling, rain on the roof, traffic, their own breathing. Cage\'s Zen-informed claim: there is no silence; there is only sound we have not consented to listen to. The piece does not demonstrate that music can be silent — it demonstrates that the world is always already musical. The boundary between music and world is a construction that can be dissolved by attending to what is already present. 2,750 years after Pythagoras argued the cosmic music is inaudible because it is always playing, Cage demonstrates the same conclusion in a concert hall.'
      },
    ],
  },

  {
    id: 'maqam-raga-parallel-evolution',
    title: 'Maqam vs. Raga — Parallel Modal Systems, 1,200 Years Apart, No Contact at Origin',
    category: 'CONVERGENCE',
    span: 'c. -1200 BCE – 900 CE · independent modal cosmologies',
    summary: 'The Arabic maqam system and the Indian raga system are the world\'s two most developed modal traditions, both assigning specific emotional states, times of day, seasons, and cosmological meanings to specific melodic frameworks. They developed independently: raga emerges from the Vedic Sama Veda tradition (c. -1200 BCE); maqam emerges from the Abbasid Baghdad synthesis of Greek modal theory with Persian and Arab folk music (c. 800-900 CE). The overlap in functional structure — specific mode → specific time → specific mood → specific cosmic effect — was first noted by medieval Islamic scholars who encountered Indian music through trade routes. Neither tradition learned the time-assignment principle from the other.',
    links: [
      {
        date: 'c. -1200 BCE',
        label: 'Sama Veda — The First Melodic Cosmology',
        node: 'music-sama-veda',
        note: 'The Sama Veda is the first document in human history where specific melodies are assigned to specific ritual occasions, times of day, and cosmological purposes. The 1,549 Samans are not free melodies — each is prescribed for a specific rite, a specific moment in that rite, and a specific cosmic intention. This is the foundational document of the raga time-assignment principle: melody is not aesthetic but functional in a cosmological sense.'
      },
      {
        date: 'c. -500 to 200 CE',
        label: 'Natyashastra — Raga Theory Formalized',
        node: 'music-raga-cosmology',
        note: 'Bharata Muni\'s Natyashastra (c. 200 BCE–200 CE) systematizes the raga theory: each raga has a specific time (prahar), season (ritu), deity, and rasa (emotional essence). This is the first surviving text to make the time-of-day assignment explicit as doctrine. The 24-hour cosmic clock is formalized here. From this point, performing the wrong raga at the wrong time is a cosmological error, not merely an aesthetic mistake.'
      },
      {
        date: 'c. 850-900 CE',
        label: 'Baghdad — Al-Farabi Systematizes Arabic Modal Theory',
        node: 'music-alkindi-music-therapy',
        note: 'Al-Farabi\'s *Kitab al-Musiqa al-Kabir* (Great Book of Music, c. 850 CE) is the founding document of Arabic music theory. He systematizes the maqam (melodic framework with specific characteristic notes, ornaments, and emotional character) from Greek modes + Persian folk scales + Arab melodic patterns. Al-Farabi never mentions Indian music. The emotional/cosmological character assignments in maqam develop independently from the same cognitive impulse that produced Indian raga: specific melodic frameworks reliably produce specific states.'
      },
      {
        date: 'c. 1200-1400 CE',
        label: 'The Maqam Time-of-Day Assignments Solidify',
        node: 'music-arabic-maqam',
        note: 'By the Mamluk period, specific maqamat have acquired conventional time-of-day, seasonal, and emotional associations: Rast (dawn, hopefulness), Bayati (morning, longing/sadness), Hijaz (midday, exotic/distant), Rast again at sunset in some traditions. These are not cosmological obligations — performing Bayati at noon does not invoke a cosmic penalty — but they are live conventions that musicians honor. The functional gap between maqam and raga: maqam assigns meaning without obligation; raga assigns obligation as cosmological law.'
      },
      {
        date: 'c. 1200 CE',
        label: 'Persian Dastgah — A Third Independent Modal Cosmology',
        node: 'music-arabic-maqam',
        note: 'The Persian dastgah system (12 primary modes, each with characteristic emotional states, seasons, and occasion-assignments) developed in parallel with Arabic maqam, sharing some modal material but diverging in structure and theory. Dastgah Shur is associated with mourning and autumn; Dastgah Mahur with joy and spring. A third independent tradition assigning specific cosmological meaning to specific modal frameworks — and still not achieving the full raga obligation, for the same structural reasons: no hereditary caste carrier, no court patronage that intensified rather than secularized the tradition.'
      },
    ],
  },

  {
    id: 'post-fludd-esoteric-revival',
    title: 'After Kepler Wins — The Esoteric Sonic Chain Continues Underground',
    category: 'ESOTERIC',
    span: '1875–2007 CE · the living tradition',
    summary: 'When Kepler ended music-of-spheres as a physics claim in 1622, Fludd\'s tradition did not die — it migrated underground and re-emerged three centuries later through Theosophy. The chain runs: Fludd → Blavatsky (1875) → Steiner (1912) → Scriabin (1910) → Messiaen (1941) → Stockhausen (1968–2007). Each link is explicit: each figure knew the previous tradition and identified with it. This is not independent reinvention — it is continuous esoteric transmission.',
    links: [
      {
        date: '1619',
        label: 'Fludd — World-Monochord as Apex and Terminus',
        node: 'music-fludd-world-monochord',
        note: 'Fludd\'s world-monochord is simultaneously the high-water mark and the last defensible claim of music-of-spheres as physics. After Kepler\'s 1622 refutation, the tradition continues — but only outside the scientific mainstream. Fludd becomes the last point where the cosmic-music claim was taken seriously as natural philosophy.'
      },
      {
        date: '1875',
        label: 'Blavatsky — Sound as Cosmic Substance (Theosophy)',
        node: 'music-theosophy-sound-cosmology',
        note: 'H.P. Blavatsky\'s Theosophy revives the Hermetic-Neoplatonic tradition explicitly: "sound creates form" (anticipating cymatics), akasha as the primordial sonic substance of the cosmos, the Nada Brahma doctrine borrowed from Hinduism. Leadbeater\'s *Thought-Forms* (1901) is the first modern attempt to map colors to musical tones systematically. The esoteric sonic tradition re-emerges in institutional form.'
      },
      {
        date: '1912',
        label: 'Steiner — Eurhythmy: Sound Made Visible',
        node: 'music-steiner-eurhythmy',
        note: 'Rudolf Steiner diverges from Theosophy but intensifies the cosmic-music claim: the human body is a crystallized musical form; each phoneme and musical interval has a corresponding physical gesture that makes the cosmic sound visible. Eurhythmy is the first attempt since Iamblichus to give the music-cosmos theory a practical ritual form in the Western tradition.'
      },
      {
        date: '1910',
        label: 'Scriabin — Music as Instrument of Cosmic Dissolution',
        node: 'music-scriabin-mysterium',
        note: 'Scriabin reads Blavatsky; his *Mysterium* plans the definitive cosmic-music performance — 7 days, Himalayan foothills, a synthesis of music, light, scent, and gesture that would dissolve the current cosmic cycle and initiate the next. Prometheus Op. 60 (1910) includes the first color-keyboard in scored Western art music. The esoteric chain\'s most operationally ambitious modern statement.'
      },
      {
        date: '1941',
        label: 'Messiaen — Theological Music as Divine Presence',
        node: 'music-messiaen-modes-color',
        note: 'Olivier Messiaen acknowledges Scriabin as an influence while working from Catholic mysticism rather than Theosophy. His modes of limited transposition are harmonic icons of divine eternity — not metaphors but acoustic realizations of theological states. The *Quartet for the End of Time*, composed and premiered in a Nazi prison camp (Stalag VIII-A, 1941), is the 20th century\'s most rigorous theological-musical statement. Receives the Fludd tradition through a different channel.'
      },
      {
        date: '1968',
        label: 'Stockhausen — Sacred Drone and the Planetary Opera',
        node: 'music-stockhausen-cosmic',
        note: '*Stimmung* (1968): 70 minutes of six vocalists sustaining a B-flat chord, invoking names of gods from multiple traditions — the sacred drone as collective ritual act. *Licht* (1977–2003): a 29-hour, 7-opera planetary cycle where each day of the week is governed by a planetary archetype. Stockhausen explicitly claims extraterrestrial origin (Sirius). He is the furthest point yet reached in the esoteric sonic chain\'s modern expression.'
      },
    ],
  },

  {
    id: 'fludd-kepler-terminus',
    title: 'The Fludd-Kepler Debate — The Exact Death of Music-of-Spheres as Physics',
    category: 'INSTITUTIONAL',
    span: '1619–1622 CE · 3-year terminus event',
    summary: 'In 1619 Robert Fludd published his world-monochord diagram — a single string spanning Earth to God, with planetary distances mapped as musical intervals — the definitive apex of 3,500 years of music-cosmos theory. Johannes Kepler attacked it in the same year. Their published exchange (1619–1622) is the documented moment when music-of-spheres stopped being a physics claim and became an aesthetic metaphor. The entire prior chain ends here.',
    links: [
      {
        date: '1619',
        label: 'Fludd — Utriusque Cosmi Historia: The World-Monochord',
        node: 'music-fludd-world-monochord',
        note: 'Fludd\'s world-monochord diagram: a single string whose length spans from Earth (the fixed end) to the divine realm (the tuning peg). Planetary distances map to musical intervals with mathematical precision. This is the most visually complete statement of the music-of-spheres theory ever produced — simultaneously the apex and the last gasp of the tradition as a scientific claim.'
      },
      {
        date: '1619',
        label: 'Kepler — Harmonices Mundi: Planetary Velocities as Music',
        node: 'music-pythagorean-harmony',
        note: 'Kepler\'s version is more rigorous: planetary angular velocities at perihelion and aphelion produce intervals (Mars sweeps a minor third; Earth a major second). These intervals are real mathematical ratios derived from orbital mechanics. Kepler explicitly attacks Fludd for basing his ratios on mystical proportion rather than observed data. Two men claiming the same tradition — one with data, one with theology — and they are incompatible.'
      },
      {
        date: '1621',
        label: 'Fludd Replies — Veritatis Proscenium: Theology vs. Mathematics',
        node: 'music-fludd-world-monochord',
        note: 'Fludd distinguishes "formal" (mathematical) and "pyramidal" (qualitative-divine) harmonies — arguing that Kepler is measuring the shadow of the real music, not the music itself. This response clarifies the unbridgeable difference: Fludd is doing theology with mathematical notation; Kepler is doing astronomy. The argument cannot be resolved because the two men are answering different questions. This clarity is the terminus.'
      },
      {
        date: '1622',
        label: 'Kepler — Pro suo Opere Harmonices Mundi Apologia: Final Word',
        node: 'music-pythagorean-harmony',
        note: 'Kepler\'s final response makes the epistemological break explicit: Fludd\'s method produces no testable predictions; Kepler\'s method does. After 1622, no serious astronomer entertains planetary music as a physical claim. The concept migrates entirely into aesthetic metaphor, Romantic poetry, and occult revival — exactly where Fludd\'s tradition would continue.'
      },
      {
        date: 'post-1622',
        label: 'Aftermath — The Concept Survives as Metaphor',
        node: 'music-fludd-world-monochord',
        note: 'The music-of-spheres concept does not die — it migrates. Kepler wins the physics debate; Fludd wins the aesthetic legacy. "Music of the spheres" becomes a poetic phrase (Shakespeare uses it in Pericles); it drives Romantic nature-philosophy (Schelling\'s Naturphilosophie); it feeds Theosophical sound-cosmology; it reaches John Cage via the Yi Jing. But after 1622, nobody claims the planets actually produce tones that can be measured. The 3,500-year physics claim is over.'
      },
    ],
  },

  {
    id: 'mantra-convergence-four-traditions',
    title: 'The Mantra Convergence — Four Traditions Independently Develop the Same Sonic Technology',
    category: 'CONVERGENCE',
    span: 'c. -1200 BCE – 1291 CE · 2,400 years, no contact',
    summary: 'Four traditions, across 2,400 years and three continents, independently arrive at the identical conclusion: non-semantic sound sequences (mantras, voces magicae, divine-name permutations, vowel strings) reach the divine or alter consciousness more effectively than semantic language. The technology is: specific sounds, in specific sequences, vocalized with specific breath-rhythm, produce specific effects. This is not metaphor — it is a practical protocol reproduced four times with no documented mutual influence at their origins.',
    links: [
      {
        date: 'c. -1200 to -800 BCE',
        label: 'Vedic Mantra — The Phoneme as Cosmic Address',
        node: 'music-raga-time-cosmology',
        note: 'The Vedic mantra tradition: specific Sanskrit phonemes are eternal cosmic substances (aksharas). The mantra OM is not a word meaning "everything" — it is the sound that IS everything, audible only when all other sound stops. Mantra efficacy is independent of understanding the meaning: you cannot translate a mantra and preserve its function because meaning is irrelevant to the operative mechanism. The phoneme, not the semantic content, does the work.'
      },
      {
        date: 'c. -600 to -300 BCE',
        label: 'Orphic Divine Names — Voces Magicae in Greek Ritual',
        node: 'music-orphic-hymns',
        note: 'The Orphic hymns use divine names in precise metrical patterns. Papyri magicae graecae (Greek magical papyri, c. 1st–4th c. CE) document voces magicae — strings of vowels and divine names used as operative sonic tools. The critical feature: the vowels ΑΕΗΙΟΥΩ (seven Greek vowels = seven planetary spheres = seven scale notes) are used in sequences that have no semantic content. Non-meaning is the point. Same technology as Vedic mantra, 600–900 years later, no contact.'
      },
      {
        date: 'c. 300 CE',
        label: 'Iamblichus — Vowel Sequences as Theurgic Technology',
        node: 'music-neoplatonic-theurgy-sound',
        note: 'De Mysteriis Book 7: Iamblichus explicitly argues that divine names reach the gods independently of their meaning. Phone (sound) vs. logos (meaning): the gods respond to the sonic form, not the semantic content. The Neoplatonist explicitly theorizes what the Vedic tradition had practiced for 1,500 years. Seven-vowel sequences, "barbarous names" (untranslatable sounds), and specific instrumental tones all operate on the same principle. Iamblichus has never read Vedic texts — he is arriving here independently through the Chaldean Oracles and Orphic materials.'
      },
      {
        date: 'c. 1270–1291 CE',
        label: 'Abulafia — Letter-Permutation as Prophetic Technology',
        node: 'music-abulafia-prophetic-kabbalah',
        note: 'Abraham Abulafia\'s prophetic Kabbalah: take a divine name (YHWH), permute its letters according to specific rules, vocalize the permutations rhythmically with coordinated breathing. The sonic sequence — independent of semantic meaning — triggers prophetic consciousness. Abulafia explicitly notes that the technique works for practitioners who do not know Hebrew semantics: the letters operate as sonic tools, not semantic units. Four traditions, no contact, same technology, same theoretical justification: meaning is irrelevant; sonic form is operative.'
      },
    ],
  },

  // ─── CROSS-TRADITION TRANSMISSION CHAINS ──────────────────────────────────

  {
    title    : 'The Word That Creates the World',
    summary  : 'Four traditions across 3,000 years share a single theology: the cosmos is spoken into existence by divine speech. The chain begins on a stone in Memphis and ends in the Quran.',
    category : 'CONVERGENCE',
    span     : 'c. 2350 BCE – 620 CE',
    links    : [
      {
        date  : 'c. 2350 BCE',
        label : 'Ptah\'s Tongue — Memphite Theology (Egypt)',
        note  : 'Ptah creates all things by first conceiving them in his heart and then pronouncing them. The Shabaka Stone: "The heart and the tongue rule over all the limbs… whatever exits from the mouth, he has made." The world\'s earliest documented creation-by-word theology.',
        node  : 'phase-1-027-memphite-theology-shabaka-stone',
      },
      {
        date  : 'c. 6th century BCE',
        label : 'Genesis 1 — "God said, Let there be light" (Hebrew)',
        note  : 'The Priestly source deploys the same structural theology without naming any Egyptian precedent. The Shabaka Stone predates this text by at least 1,700 years.',
        node  : 'creation-by-word',
      },
      {
        date  : 'c. 90 CE',
        label : 'John 1:1 — "In the beginning was the Word" (Greek)',
        note  : '"In the beginning was the Logos, and the Logos was with God, and the Logos was God." The Johannine prologue fuses Hebrew creation-word theology with Stoic cosmic-reason philosophy. Ptah\'s tongue, in a new language.',
        node  : 'logos-johannine',
      },
      {
        date  : 'c. 610 CE',
        label : 'Quran — Kun fa-yakun: "Be — and it is"',
        note  : '"When He decrees a matter, He only says to it: Be — and it is" (2:117). The most compressed formulation of creation-by-word in world scripture. Four traditions, one 3,000-year chain.',
        node  : 'tradition-islam',
      },
    ],
  },

  {
    title    : 'The Succession Myth: From Hurrian Mountains to Gnostic Cosmology',
    summary  : 'Hesiod\'s Theogony is a retelling of a Hurrian myth from Anatolia. The chain continues into Gnostic theology, where the king of the gods becomes an ignorant tyrant — and Israel\'s greatest monotheistic declaration becomes proof of cosmic limitation.',
    category : 'INSTITUTIONAL',
    span     : 'c. 1400 BCE – 250 CE',
    links    : [
      {
        date  : 'c. 1400 BCE',
        label : 'Kumarbi Cycle (Hurrian / Hittite)',
        note  : 'Kumarbi bites off the genitals of sky-god Anu, becomes pregnant with storm-god Teshub, who eventually defeats him. Preserved in the Hittite archives at Hattusa. This is the structural template for the entire Mediterranean succession-myth tradition.',
        node  : 'phase-1-028-kumarbi-cycle',
      },
      {
        date  : 'c. 700 BCE',
        label : 'Hesiod\'s Theogony (Greek)',
        note  : 'Ouranos castrated by Kronos; Kronos overthrown by Zeus — structurally identical to the Kumarbi Cycle. Transmission route: Hittite archive → Late Bronze Age singer networks → Phoenician intermediary → Hesiod. Documented by Bachvarova, From Hittite to Homer (Cambridge UP, 2016).',
        node  : 'phase-2-009-hesiod-theogony-works-and-days',
      },
      {
        date  : 'c. 250–350 CE',
        label : 'Kronos / Saturn as Neoplatonic Nous',
        note  : 'Porphyry and Iamblichus identify Saturn/Kronos with the Platonic Demiurge and cosmic Intellect. The deposed king of the gods becomes a philosophical principle: divine intellect contemplating the Forms.',
        node  : 'demiurge-platonic',
      },
      {
        date  : 'c. 150–250 CE',
        label : 'Yaldabaoth — The Gnostic Inversion',
        note  : 'The Sethian Gnostics invert the chain entirely. The Demiurge is not wise but ignorant and arrogant. The Apocryphon of John places Isaiah 45:5 — "I am the LORD and there is no other" — in Yaldabaoth\'s mouth as evidence of his blindness to the higher God above him. A Hurrian grain god is the traceable ancestor of this move.',
        node  : 'yaldabaoth',
      },
    ],
  },

  {
    title    : 'Confucianism Builds the Modern World\'s Bureaucracy',
    summary  : 'The British civil service examination — model for all modern meritocratic administration — was explicitly designed on China\'s imperial examination system. The chain runs from Confucius through Jesuit missionaries and Voltaire to every government hiring system on Earth.',
    category : 'INSTITUTIONAL',
    span     : 'c. 500 BCE – 1855 CE',
    links    : [
      {
        date  : 'c. 500 BCE',
        label : 'Confucius — Governance by Cultivated Virtue',
        note  : 'Confucius teaches that political authority must be grounded in self-cultivation and demonstrated moral merit, not birth alone. The junzi (exemplary person) earns authority.',
        node  : 'confucius',
      },
      {
        date  : '605 CE',
        label : 'Sui Dynasty — Imperial Examination Institutionalized',
        note  : 'Emperor Yang formally establishes competitive testing on Confucian classics as the method of civil service recruitment. The exam will select China\'s bureaucracy for 1,300 years.',
        node  : 'tradition-confucianism',
      },
      {
        date  : '1687',
        label : 'Confucius Sinarum Philosophus (Jesuits)',
        note  : 'Philippe Couplet publishes the first major Latin translation of Confucius. Leibniz writes enthusiastically about Chinese governance. The Jesuits\' China mission transmits Confucian governance theory to Europe as proof that natural reason produces ethical civilization.',
        node  : 'tradition-neo-confucianism',
      },
      {
        date  : '1762',
        label : 'Voltaire Weaponizes Confucianism Against the Church',
        note  : 'Voltaire holds Confucius up as proof that civilization can be rational and ethical without Christian revelation. The Physiocrat economist Quesnay is called "the European Confucius." The Jesuit China mission inadvertently arms the Enlightenment attack on Church authority.',
        node  : 'voltaire',
      },
      {
        date  : '1855',
        label : 'British Civil Service — Explicit Modeling on China',
        note  : 'The Northcote-Trevelyan Report replaces patronage with competitive examinations, explicitly citing China\'s imperial system as the model. The reform is adopted globally. Modern meritocratic civil service — the institutional skeleton of every contemporary state — is Confucian in origin.',
        node  : 'tradition-neo-confucianism',
      },
    ],
  },

  {
    title    : 'The Mindfulness Industry\'s Erased Origin',
    summary  : 'A $1B+/year secular wellness industry traces directly to two Buddhist schools — Zen and Theravāda. Their contemplative techniques were stripped of religious framing and redeployed clinically. The Buddhist source is systematically obscured in marketing and clinical language.',
    category : 'GEOGRAPHIC',
    span     : 'c. 500 BCE – 1979 CE',
    links    : [
      {
        date  : 'c. 500 BCE',
        label : 'Theravāda Vipassanā — Attention as Practice',
        note  : 'The Pali canon\'s satipaṭṭhāna (four foundations of mindfulness) and vipassanā (insight meditation) are the raw material. Attention to breath, body, and arising/passing phenomena — without grasping — is the core method.',
        node  : 'tradition-theravada-buddhism',
      },
      {
        date  : 'c. 700 CE',
        label : 'Huineng — Zen\'s Sudden Awakening',
        note  : 'Huineng\'s Platform Sutra establishes: Buddha-nature is fully present already; no gradual cultivation needed. Zen becomes the Western-facing tributary of the Buddhist contemplative tradition.',
        node  : 'huineng',
      },
      {
        date  : '1927–1957',
        label : 'D.T. Suzuki — Zen Enters Western Culture',
        note  : 'Suzuki\'s Essays in Zen Buddhism begin the Western transmission. His Columbia seminars (1952–57) directly influence John Cage, Alan Watts, Kerouac, Ginsberg, and Snyder. Zen becomes the contemplative framework of the American counterculture.',
        node  : 'd-t-suzuki',
      },
      {
        date  : '1975',
        label : 'IMS Founded — Theravāda Tributary Joins',
        note  : 'Jack Kornfield, Joseph Goldstein, and Sharon Salzberg found the Insight Meditation Society after training with Mahāsi Sayadaw and Goenka. The Theravāda lineage enters the same cultural stream as Zen.',
        node  : 'tradition-theravada-buddhism',
      },
      {
        date  : '1979',
        label : 'MBSR — Mindfulness Becomes Medicine',
        note  : 'Jon Kabat-Zinn launches Mindfulness-Based Stress Reduction at UMass Medical Center. Buddhist meditation stripped of its religious framing is deployed as clinical intervention. Neither origin is named in the clinical literature or the $1B+/year app and corporate wellness market that follows.',
        node  : 'tradition-zen',
      },
    ],
  },

  {
    title    : 'Solar Theology: From Ra to Christ Pantocrator',
    summary  : 'The nimbus around Christ\'s head is a Roman sun-disk. December 25th is the Roman sun god\'s birthday. Sunday is the day of the Sun. Christianity absorbed solar imagery so thoroughly it became invisible. The chain begins in Egypt c. 2700 BCE.',
    category : 'CONVERGENCE',
    span     : 'c. 2700 BCE – 4th century CE',
    links    : [
      {
        date  : 'c. 2700 BCE',
        label : 'Ra — Egyptian Solar Theology',
        note  : 'Ra\'s daily journey, descent into the underworld at night, and rebirth at dawn as Khepri is the world\'s oldest continuous solar theology. The nimbus — the ring of light around the head — originates as Ra\'s sun-disk.',
        node  : 'ra',
      },
      {
        date  : 'c. 1350 BCE',
        label : 'Aten — The World\'s First Monotheism Is Solar',
        note  : 'Akhenaten suppresses all other gods, declaring the Aten the sole divine source. Jan Assmann traces the "Mosaic distinction" — exclusive monotheism — to this moment. The Great Hymn to the Aten is structurally parallel to Psalm 104.',
        node  : 'akhenaten',
      },
      {
        date  : '274 CE',
        label : 'Sol Invictus — Roman Imperial Sun Cult',
        note  : 'Emperor Aurelian establishes Sol Invictus as the supreme deity of the Roman Empire. The sun god\'s birthday: December 25th. The weekly holy day: dies Solis (Sunday). These will survive the Christianization of the Empire intact.',
        node  : 'sol-invictus',
      },
      {
        date  : '312 CE onward',
        label : 'Constantine — Solar Imagery Migrates to Christ',
        note  : 'Constantine\'s conversion absorbs solar imagery rather than erasing it. Christ Pantocrator inherits the frontal posture, radiating glory, and nimbus from Sol Invictus. December 25th becomes Christmas. Sunday remains the holy day.',
        node  : 'constantine-i',
      },
    ],
  },

  {
    title    : 'Islam Preserves Aristotle — Then Builds Catholic Theology',
    summary  : 'Thomas Aquinas\'s Summa Theologica — the intellectual skeleton of Catholic doctrine — is built on Aristotle. Aristotle was lost to Western Europe for 600 years. His works were preserved in Arabic, refined by Islamic philosophers, and translated back into Latin. The Catholic Church\'s philosophical tradition owes its existence to Islamic scholarship.',
    category : 'INSTITUTIONAL',
    span     : 'c. 350 BCE – 1274 CE',
    links    : [
      {
        date  : 'c. 350 BCE',
        label : 'Aristotle — The Philosophical System',
        note  : 'Aristotle systematizes logic, physics, metaphysics, cosmology, ethics, and politics. His works will be almost entirely lost to the Latin-reading West after the fall of Rome (~500 CE).',
        node  : '',
      },
      {
        date  : 'c. 830 CE',
        label : 'House of Wisdom, Baghdad',
        note  : 'Al-Kindī, Al-Fārābī, and Avicenna (Ibn Sīnā) translate and extend Aristotle in Arabic. Islamic philosophy develops the most sophisticated Aristotelian commentaries in existence.',
        node  : 'tradition-islam',
      },
      {
        date  : 'c. 1180 CE',
        label : 'Averroes (Ibn Rushd) — The Commentator',
        note  : 'Ibn Rushd of Córdoba writes comprehensive commentaries on nearly all of Aristotle. He becomes "The Commentator" to the Latin West. Aquinas will attack Averroism — while depending on Averroes\'s Aristotle for his entire metaphysical framework.',
        node  : 'tradition-sufism',
      },
      {
        date  : 'c. 1150–1200 CE',
        label : 'Toledo Translation School — Arabic → Latin',
        note  : 'Gerard of Cremona and others translate Aristotle and Averroes from Arabic into Latin at Toledo. The Latin West recovers Aristotle — but only through the medium of Islamic scholarship.',
        node  : 'tradition-medieval-christianity',
      },
      {
        date  : '1265–1274 CE',
        label : 'Summa Theologica — Aquinas Synthesizes Aristotle with Christianity',
        note  : 'Aquinas calls Aristotle simply "The Philosopher" — and reads him through Averroes\'s commentaries. The intellectual skeleton of Catholic systematic theology is Islamic in origin. Neither tradition publicly acknowledges this.',
        node  : 'thomas-aquinas',
      },
    ],
  },

  {
    title    : 'Anubis Weighs the Heart — Lady Justice Holds the Scales',
    summary  : 'The idea that a soul\'s moral record is weighed against a divine standard using a balance scale originated in Egypt c. 1550 BCE. The same image — psychopomp, scales, moral criterion — migrates through Byzantine iconography into the secular symbol of Western law.',
    category : 'CONVERGENCE',
    span     : 'c. 1550 BCE – present',
    links    : [
      {
        date  : 'c. 1550 BCE',
        label : 'Anubis Weighs the Heart (Book of the Dead)',
        note  : 'In the Hall of Two Truths, Anubis weighs the heart against the feather of Ma\'at. If heavier, Ammit devours the soul. The balance scale as moral instrument of divine judgment begins here.',
        node  : 'anubis',
      },
      {
        date  : 'c. 500–700 CE',
        label : 'Michael the Archangel Holds the Scales',
        note  : 'Byzantine iconography transfers the psychopomp role to Michael. In Last Judgment scenes, he weighs souls. The Egyptian theological structure — psychopomp, balance scales, moral criterion, devouring monster — is retained wholesale in a new vocabulary.',
        node  : 'tradition-eastern-orthodoxy',
      },
      {
        date  : 'c. 1200 CE',
        label : 'Gothic Cathedral Tympana — The Weighing Over the Door',
        note  : 'Last Judgment reliefs above the doors of Notre Dame, Chartres, and Bourges show souls weighed by the archangel. The Egyptian sacred judgment is now carved in stone at the entrance to every major church in France.',
        node  : 'tradition-medieval-christianity',
      },
      {
        date  : '15th century CE',
        label : 'Lady Justice — Scales Enter Secular Law',
        note  : 'The allegorical Iustitia inherits the balance scales from Archangel Michael. The sacred psychopomp becomes the symbol of secular law. Every courthouse, every legal seal, every law firm logo traces to the Hall of Two Truths.',
        node  : '',
      },
    ],
  },

  {
    title    : 'Buddhist Metaphysics Becomes Confucian Philosophy',
    summary  : 'Zhu Xi\'s Neo-Confucian synthesis — the official curriculum of China\'s imperial examinations for 600 years — is built around a concept (li, pattern/principle) absorbed from Buddhist Huayan metaphysics. Zhu Xi polemicizes against Buddhism while using Buddhist metaphysics as his core framework.',
    category : 'ESOTERIC',
    span     : 'c. 4th century CE – 12th century CE',
    links    : [
      {
        date  : 'c. 4th century CE',
        label : 'Avataṃsaka Sūtra — Indra\'s Net',
        note  : 'At every node of an infinite net hangs a jewel reflecting all other jewels. Its doctrine of mutual interpenetration (li-shi wu\'ai) describes a cosmos where nothing exists independently. This metaphysical framework will survive translation into an entirely different tradition.',
        node  : 'phase-4-102-avatamsaka-sutra',
      },
      {
        date  : 'c. 700 CE',
        label : 'Fazang — Huayan School Systematized',
        note  : 'Fazang systematizes Avataṃsaka\'s metaphysics into the Huayan school. His essay on the Golden Lion uses a single object to demonstrate mutual interpenetration. His five-fold classification provides the conceptual vocabulary for the next stage.',
        node  : 'tradition-mahayana-buddhism',
      },
      {
        date  : 'c. 1175 CE',
        label : 'Zhu Xi — Li-Qi as Neo-Confucian Metaphysics',
        note  : 'Zhu Xi\'s synthesis: li (pattern/principle) pervades all particular qi (material stuff). Structurally parallel to Huayan\'s li-shi wu\'ai. He polemicizes vigorously against Buddhism throughout his writings — while his central metaphysical architecture comes directly from Huayan. His synthesis becomes the exam curriculum for 600 years.',
        node  : 'zhu-xi',
      },
      {
        date  : 'c. 1200 CE',
        label : 'Wang Yangming — The Internal Critique',
        note  : 'Wang Yangming attacks Zhu Xi from within Neo-Confucianism: li is not external but identical with the mind. His concept of liangzhi (innate moral knowing) in every person is the Neo-Confucian equivalent of Buddha-nature — a comparison Wang Yangming would reject.',
        node  : 'wang-yangming',
      },
    ],
  },

  {
    title    : 'The Yi Jing\'s Binary Code Reaches 20th-Century Music',
    summary  : 'Leibniz discovered binary arithmetic in 1679. A Jesuit missionary in Beijing sent him the Yi Jing\'s hexagrams arranged in binary order — and Leibniz immediately recognized that China had discovered the same system 2,700 years earlier. The same oracle would give John Cage the method for a landmark piece of aleatoric music.',
    category : 'ESOTERIC',
    span     : 'c. 1000 BCE – 1951 CE',
    links    : [
      {
        date  : 'c. 1000 BCE',
        label : 'Yi Jing — 64 Hexagrams Formalized',
        note  : 'The 64 hexagrams encode all possible combinations of six broken (yin) or unbroken (yang) lines — a complete binary combinatorial system. The oldest surviving binary structure in human intellectual history.',
        node  : 'phase-2-042-yi-jing-i-ching',
      },
      {
        date  : '1701',
        label : 'Bouvet Sends Leibniz the Hexagram Diagram',
        note  : 'Jesuit Joachim Bouvet, at the Kangxi Emperor\'s court in Beijing, sends Leibniz an arrangement of the 64 hexagrams in binary order. Leibniz, who had invented binary arithmetic in 1679, immediately recognizes that China had discovered the same system 2,700 years earlier. He publishes "Explication de l\'Arithmétique Binaire" (1703) acknowledging the parallel.',
        node  : 'phase-2-042-yi-jing-i-ching',
      },
      {
        date  : '1950',
        label : 'Wilhelm\'s Translation — The Yi Jing Reaches Western Art',
        note  : 'Richard Wilhelm\'s 1924 German translation with Carl Jung\'s preface (developing synchronicity theory) circulates widely. Jung demonstrates hexagram consultation as a tool for accessing the unconscious. Philip K. Dick, Herman Hesse, and a young experimental composer in New York all encounter it.',
        node  : 'tradition-daoism',
      },
      {
        date  : '1951',
        label : 'John Cage — Music of Changes',
        note  : 'Cage uses the Yi Jing\'s coin-toss method to make all compositional decisions in his piano piece Music of Changes. Every pitch, duration, and dynamic is determined by hexagram consultation. A 3,000-year-old divination oracle becomes the generative engine of aleatoric composition.',
        node  : 'd-t-suzuki',
      },
    ],
  },

  {
    title    : 'The Martyr Template: Christian Martyrology → Islamic Shahid → Karbala',
    summary  : 'The word "shahid" (Islamic martyr) is the Greek word martyros transliterated via Syriac. The entire Karbala paradigm — willing death, divine predestination, annual commemoration, post-mortem intercession — is structurally identical to Christian martyrology from 156 CE Smyrna. Neither tradition acknowledges the debt.',
    category : 'INSTITUTIONAL',
    span     : '110 CE – 680 CE',
    links    : [
      {
        date  : 'c. 110 CE',
        label : 'Ignatius of Antioch — Martyrdom as Mystical Consummation',
        note  : 'Ignatius writes en route to execution in Rome: "I am the wheat of God, ground by wild beasts into pure bread of Christ." He theologizes martyrdom as the completion of mystical union — not mere death but the act that makes the martyr fully real.',
        node  : 'phase-4-063-ignatius-letters',
      },
      {
        date  : '156 CE',
        label : 'Martyrdom of Polycarp — The Template Document',
        note  : 'The oldest surviving Christian martyrdom narrative introduces natalis (death as birthday into heaven) and calls for annual commemoration at the tomb. This founds the entire system: feast-days, pilgrimage sites, relic veneration, post-mortem intercession, the calendar of saints.',
        node  : 'phase-4-063-ignatius-letters',
      },
      {
        date  : 'c. 620 CE',
        label : 'Shahid — The Greek Word Becomes Arabic',
        note  : 'The Arabic shahid (شهيد, witness/martyr) is the Greek martyros transliterated via Syriac Christian channels. The semantic content — one who witnesses to truth by dying — travels with the word. Islamic martyrology inherits the Christian structural theology along with the vocabulary.',
        node  : 'tradition-islam',
      },
      {
        date  : '680 CE',
        label : 'Karbala — Husayn ibn Ali and the Shia Martyrology',
        note  : 'Husayn ibn Ali is killed at Karbala. The Shia community memorializes him with: annual ʿĀshūrāʾ commemoration, pilgrimage to the tomb, doctrine of post-mortem intercession, his death framed as foreknown and redemptive. Every structural element is present in the Martyrdom of Polycarp. The Christian martyr template has arrived in Iraq 524 years later.',
        node  : 'tradition-sufism',
      },
    ],
  },

];
