// CODEX ATLAS — Alphabet Glyph Data
// 22 Proto-Sinaitic letters: hieroglyphic source → modern descendants
// Hieroglyph codepoints from Unicode Egyptian Hieroglyphs block (U+13000–U+1342F)
// Phoenician codepoints from U+10900–U+1091F
// Font: Noto Sans Egyptian Hieroglyphs (loaded via Google Fonts in index.html)

window.ALPHA_GLYPH_DATA = [
  {
    letter: 'A', name: 'Aleph', meaning: 'ox', gardiner: 'E1',
    unicode: 0x130F8, phoneme: 'ʾ (glottal stop)', greek: 'Α alpha', latin: 'A',
    hebrew: 'א', arabic: 'ا', phoenician: '\u{10900}',
    note: 'You are reading a rotated ox-skull. The letter A is an upside-down ox-head — tip it forward and you see the snout and two horns. "Aleph" means ox. The very first letter of every Western alphabet is a cow.'
  },
  {
    letter: 'B', name: 'Beth', meaning: 'house', gardiner: 'O1',
    unicode: 0x13250, phoneme: 'b', greek: 'Β beta', latin: 'B',
    hebrew: 'ב', arabic: 'ب', phoenician: '\u{10901}',
    note: 'This letter is a floor plan. The hieroglyph is a bird\'s-eye view of an Egyptian house — the rectangle is the courtyard, the notch is the doorway. Genesis begins with Beth: בְּרֵאשִׁית (Bereishit). The Bible\'s first letter is an architectural diagram.'
  },
  {
    letter: 'G', name: 'Gimel', meaning: 'camel / throw-stick', gardiner: 'T14',
    unicode: 0x13246, phoneme: 'g', greek: 'Γ gamma', latin: 'C / G',
    hebrew: 'ג', arabic: 'ج', phoenician: '\u{10902}',
    note: 'The hump of a camel. The L-shape of Gamma (Γ) traces the neck and single hump. In Egyptian the throw-stick hieroglyph was used for the "g" sound — a common scribal pun (the word for throw-stick sounded like a Semitic word for camel-hump).'
  },
  {
    letter: 'D', name: 'Daleth', meaning: 'door', gardiner: 'O31',
    unicode: 0x13267, phoneme: 'd', greek: 'Δ delta', latin: 'D',
    hebrew: 'ד', arabic: 'د', phoenician: '\u{10903}',
    note: 'A door or tent-flap. The triangular Delta (Δ) is the peaked shape of a leather door-hanging seen from the front. D in Latin rotated the triangle onto a vertical post: the upright post of the doorframe + the leather flap arching out = D.'
  },
  {
    letter: 'E', name: 'He', meaning: 'window / arms raised in jubilation', gardiner: 'A28',
    unicode: 0x1302D, phoneme: 'h', greek: 'Ε epsilon', latin: 'E',
    hebrew: 'ה', arabic: 'ه', phoenician: '\u{10904}',
    note: 'A figure with arms raised — the Egyptian hieroglyph for jubilation or "hail!" Greeks had no H-sound equivalent so they repurposed this as the vowel E (epsilon = "bare E"). The three prongs of E still echo the raised arms and head.'
  },
  {
    letter: 'F', name: 'Waw', meaning: 'hook / peg / mace', gardiner: 'T3',
    unicode: 0x1307B, phoneme: 'w', greek: 'Υ upsilon / Ϝ digamma', latin: 'F / U / V / W / Y',
    hebrew: 'ו', arabic: 'و', phoenician: '\u{10905}',
    note: 'One letter spawned six modern letters: F, U, V, W, Y, and the Greek upsilon (Υ). The hook-peg hieroglyph made the "w" sound. Greeks used it first as the digamma Ϝ (F-sound), then as upsilon (U-sound). Latin split it further into U, V, W, and eventually Y. The most productive letter in history.'
  },
  {
    letter: 'Z', name: 'Zayin', meaning: 'weapon (sword or axe)', gardiner: 'T7',
    unicode: 0x1307E, phoneme: 'z', greek: 'Ζ zeta', latin: 'Z',
    hebrew: 'ז', arabic: 'ز', phoenician: '\u{10906}',
    note: 'A sword or double-headed axe. Zeta (Ζ) retains the blade shape. Latin borrowed it late (from Greek) specifically to transliterate Greek words — Z appears almost nowhere in native Latin vocabulary.'
  },
  {
    letter: 'H', name: 'Heth', meaning: 'fence / courtyard wall', gardiner: 'O4',
    unicode: 0x13253, phoneme: 'ḥ (emphatic h)', greek: 'Η eta', latin: 'H',
    hebrew: 'ח', arabic: 'ح', phoenician: '\u{10907}',
    note: 'A fence or courtyard enclosure seen from above — the double horizontal bars are the fence posts. Greeks had no emphatic-H consonant so they turned it into the long-E vowel eta (Η). Latin kept the consonant as H but thinned the fence to two uprights and a crossbar.'
  },
  {
    letter: 'Θ', name: 'Teth', meaning: 'basket / coiled rope', gardiner: 'V28',
    unicode: 0x130CB, phoneme: 'ṭ (emphatic t)', greek: 'Θ theta', latin: '(none — dropped)',
    hebrew: 'ט', arabic: 'ط', phoenician: '\u{10908}',
    note: 'A wickerwork basket or coiled rope seen from above — the circle with an interior mark. Greek theta (Θ) kept the shape almost exactly. Latin had no emphatic consonant for this, so Teth was dropped entirely — the first letter lost in the Latin transition.'
  },
  {
    letter: 'I', name: 'Yod', meaning: 'hand / arm', gardiner: 'D36',
    unicode: 0x1307C, phoneme: 'y', greek: 'Ι iota', latin: 'I / J',
    hebrew: 'י', arabic: 'ي', phoenician: '\u{10909}',
    note: 'The hand and forearm. Yod is the smallest letter in the Hebrew alphabet — a single bent stroke. Jesus references this in Matthew 5:18: "not one jot (yod) or tittle will pass from the Law." The word "jot" in English is literally the Hebrew letter-name Yod, via Greek iota.'
  },
  {
    letter: 'K', name: 'Kaph', meaning: 'open palm of hand', gardiner: 'D46',
    unicode: 0x1307D, phoneme: 'k', greek: 'Κ kappa', latin: 'K',
    hebrew: 'כ', arabic: 'ك', phoenician: '\u{1090A}',
    note: 'The open palm of the hand, seen from the front — the vertical stroke is the arm, the angled strokes are the fingers. Kappa (Κ) and K both reproduce this shape. Used rarely in Latin (which preferred C for the k-sound) but preserved in words borrowed from Greek.'
  },
  {
    letter: 'L', name: 'Lamedh', meaning: 'oxgoad / shepherd\'s crook', gardiner: 'S38',
    unicode: 0x130B8, phoneme: 'l', greek: 'Λ lambda', latin: 'L',
    hebrew: 'ל', arabic: 'ل', phoenician: '\u{1090B}',
    note: 'The shepherd\'s crook used to goad cattle — the hooked staff. Lambda (Λ) is the inverted crook-hook. The tall reaching shape of ל in Hebrew (the only letter that reaches above the headline) still suggests the upward hook of the goad.'
  },
  {
    letter: 'M', name: 'Mem', meaning: 'water', gardiner: 'N35',
    unicode: 0x130C8, phoneme: 'm', greek: 'Μ mu', latin: 'M',
    hebrew: 'מ', arabic: 'م', phoenician: '\u{1090C}',
    note: 'This wavy line has meant water for 3,800 years. Mem = water. The W-wave pattern of M directly descends from the Egyptian water hieroglyph — a horizontal wavy line. In virtually every script that descends from Phoenician, M sounds like "m" and looks like waves. The most visually obvious pictogram survival in the modern alphabet.'
  },
  {
    letter: 'N', name: 'Nun', meaning: 'snake / fish', gardiner: 'I10',
    unicode: 0x130F0, phoneme: 'n', greek: 'Ν nu', latin: 'N',
    hebrew: 'נ', arabic: 'ن', phoenician: '\u{1090D}',
    note: 'A snake (Egyptian cobra) in profile — the S-curve body. The undulating N letterform descends from a snake\'s silhouette. In some traditions Nun means "fish" — the serpentine profile works for both.'
  },
  {
    letter: 'S', name: 'Samekh', meaning: 'fish / pillar / spine', gardiner: 'K1',
    unicode: 0x130D5, phoneme: 's', greek: 'Ξ xi (archaic) / unclear', latin: 'S (via sigma)',
    hebrew: 'ס', arabic: 'س', phoenician: '\u{1090E}',
    note: 'A fish, tent-peg, or supporting pillar — scholars disagree. Samekh fed into S in Hebrew but its Greek path is debated; sigma (Σ) may derive from a different letter. The letter\'s shape — a closed circle or fish-bone — supports the fish reading.'
  },
  {
    letter: 'O', name: 'Ayin', meaning: 'eye', gardiner: 'D4',
    unicode: 0x130CB, phoneme: 'ʿ (pharyngeal consonant)', greek: 'Ο omicron', latin: 'O',
    hebrew: 'ע', arabic: 'ع', phoenician: '\u{1090F}',
    note: 'This was an eye. Ayin (עַיִן) literally means "eye" in Hebrew, and the hieroglyph is an eye in outline. Greeks had no pharyngeal consonant for "ʿ" — the sound doesn\'t exist in Greek — so they repurposed the eye-sign as the vowel O. This is why O is shaped like an eye: because it IS an eye, 3,000 years old.'
  },
  {
    letter: 'P', name: 'Pe', meaning: 'mouth', gardiner: 'D21',
    unicode: 0x130D7, phoneme: 'p', greek: 'Π pi', latin: 'P',
    hebrew: 'פ', arabic: 'ف', phoenician: '\u{10910}',
    note: 'The mouth. Pe (פֶּה) means "mouth" in Hebrew. Pi (Π) and P both trace to the lips and jaw of an open mouth seen in profile. The "p" sound is a labial — made with the lips. The lips that make the sound are also the picture that became the letter.'
  },
  {
    letter: 'Ṣ', name: 'Tsade', meaning: 'plant / fish-hook / man on side', gardiner: 'M17',
    unicode: 0x130BD, phoneme: 'ṣ (emphatic s)', greek: 'Ϻ san (archaic) / Ϡ sampi', latin: '(none)',
    hebrew: 'צ', arabic: 'ص', phoenician: '\u{10911}',
    note: 'A papyrus plant, fish-hook, or a man lying on his side — the most disputed origin. Became Coptic Ϣ. Dropped from Latin. Survives in Hebrew as Tsade (צ) and in Arabic abjad numerals. A letter that fell through the cracks of the European tradition.'
  },
  {
    letter: 'Q', name: 'Qoph', meaning: 'needle eye / thread / monkey', gardiner: 'Aa28',
    unicode: 0x13032, phoneme: 'q (back-of-throat k)', greek: 'Ϙ qoppa (archaic)', latin: 'Q',
    hebrew: 'ק', arabic: 'ق', phoenician: '\u{10912}',
    note: 'A needle with thread, or possibly a monkey\'s head. Greek qoppa (Ϙ) survived briefly as an archaic letter for the qu-cluster, then was dropped from the standard Greek alphabet but kept in numeric use (= 90). Latin kept Q exclusively for the "qu" combination. In modern English, Q almost never appears without U — a 3,000-year phonological rule persisting as spelling convention.'
  },
  {
    letter: 'R', name: 'Resh', meaning: 'head', gardiner: 'D1',
    unicode: 0x13100, phoneme: 'r', greek: 'Ρ rho', latin: 'R',
    hebrew: 'ר', arabic: 'ر', phoenician: '\u{10913}',
    note: 'A human head in profile. Resh (רֹאשׁ) means "head" in Hebrew. The circle-with-a-descender shape of Rho (Ρ) and R is the skull seen from the side. P and R were once identical in early alphabets — the diagonal leg was added to R to distinguish them, a leg the human profile head did not have.'
  },
  {
    letter: 'Š', name: 'Shin', meaning: 'tooth', gardiner: 'F18',
    unicode: 0x13110, phoneme: 'š (sh-sound)', greek: 'Σ sigma', latin: 'S',
    hebrew: 'ש', arabic: 'ش', phoenician: '\u{10914}',
    note: 'Three teeth. Shin (שִׁן) means "tooth" in Hebrew. The three-pronged W-shape of ש is three teeth in a jaw. Sigma (Σ) flattened the three prongs to a zigzag. The English letter S still traces those three dental ridges — you are looking at a row of teeth every time you read the letter S.'
  },
  {
    letter: 'T', name: 'Taw', meaning: 'mark / cross / sign', gardiner: 'Z9',
    unicode: 0x13390, phoneme: 't', greek: 'Τ tau', latin: 'T',
    hebrew: 'ת', arabic: 'ت', phoenician: '\u{10915}',
    note: 'The last letter was a cross or X mark. In ancient Phoenician and early Hebrew script, Taw was written as an X or a + cross. Ezekiel 9:4 — God tells the angel to place a Taw on the foreheads of the righteous before the judgment of Jerusalem. The original mark of salvation was a cross-shaped letter. Tau was the last letter, the mark, the end. The Greek tau (Τ) and Latin T are this cross, simplified to the upright post with crossbar.'
  },
];

// Gematria / Isopsephy / Abjad comparative data
// 22 Hebrew letters with their numeric values across three traditions
window.ALPHA_GEMATRIA = [
  { heb: 'א', name: 'Aleph',  val: 1,   greek: 'Α', gName: 'Alpha',  greekVal: 1,   arabic: 'ا', aName: 'Alif',   arabicVal: 1   },
  { heb: 'ב', name: 'Beth',   val: 2,   greek: 'Β', gName: 'Beta',   greekVal: 2,   arabic: 'ب', aName: 'Ba',     arabicVal: 2   },
  { heb: 'ג', name: 'Gimel',  val: 3,   greek: 'Γ', gName: 'Gamma',  greekVal: 3,   arabic: 'ج', aName: 'Jim',    arabicVal: 3   },
  { heb: 'ד', name: 'Daleth', val: 4,   greek: 'Δ', gName: 'Delta',  greekVal: 4,   arabic: 'د', aName: 'Dal',    arabicVal: 4   },
  { heb: 'ה', name: 'He',     val: 5,   greek: 'Ε', gName: 'Epsilon',greekVal: 5,   arabic: 'ه', aName: 'Ha',     arabicVal: 5   },
  { heb: 'ו', name: 'Vav',    val: 6,   greek: 'Ϝ', gName: 'Digamma',greekVal: 6,   arabic: 'و', aName: 'Waw',    arabicVal: 6   },
  { heb: 'ז', name: 'Zayin',  val: 7,   greek: 'Ζ', gName: 'Zeta',   greekVal: 7,   arabic: 'ز', aName: 'Zayn',   arabicVal: 7   },
  { heb: 'ח', name: 'Heth',   val: 8,   greek: 'Η', gName: 'Eta',    greekVal: 8,   arabic: 'ح', aName: 'Ha',     arabicVal: 8   },
  { heb: 'ט', name: 'Teth',   val: 9,   greek: 'Θ', gName: 'Theta',  greekVal: 9,   arabic: 'ط', aName: 'Ta',     arabicVal: 9   },
  { heb: 'י', name: 'Yod',    val: 10,  greek: 'Ι', gName: 'Iota',   greekVal: 10,  arabic: 'ي', aName: 'Ya',     arabicVal: 10  },
  { heb: 'כ', name: 'Kaph',   val: 20,  greek: 'Κ', gName: 'Kappa',  greekVal: 20,  arabic: 'ك', aName: 'Kaf',    arabicVal: 20  },
  { heb: 'ל', name: 'Lamed',  val: 30,  greek: 'Λ', gName: 'Lambda', greekVal: 30,  arabic: 'ل', aName: 'Lam',    arabicVal: 30  },
  { heb: 'מ', name: 'Mem',    val: 40,  greek: 'Μ', gName: 'Mu',     greekVal: 40,  arabic: 'م', aName: 'Mim',    arabicVal: 40  },
  { heb: 'נ', name: 'Nun',    val: 50,  greek: 'Ν', gName: 'Nu',     greekVal: 50,  arabic: 'ن', aName: 'Nun',    arabicVal: 50  },
  { heb: 'ס', name: 'Samekh', val: 60,  greek: 'Ξ', gName: 'Xi',     greekVal: 60,  arabic: 'س', aName: 'Sin',    arabicVal: 60  },
  { heb: 'ע', name: 'Ayin',   val: 70,  greek: 'Ο', gName: 'Omicron',greekVal: 70,  arabic: 'ع', aName: 'Ayn',    arabicVal: 70  },
  { heb: 'פ', name: 'Pe',     val: 80,  greek: 'Π', gName: 'Pi',     greekVal: 80,  arabic: 'ف', aName: 'Fa',     arabicVal: 80  },
  { heb: 'צ', name: 'Tsade',  val: 90,  greek: 'Ϙ', gName: 'Qoppa',  greekVal: 90,  arabic: 'ص', aName: 'Sad',    arabicVal: 90  },
  { heb: 'ק', name: 'Qoph',   val: 100, greek: 'Ρ', gName: 'Rho',    greekVal: 100, arabic: 'ق', aName: 'Qaf',    arabicVal: 100 },
  { heb: 'ר', name: 'Resh',   val: 200, greek: 'Σ', gName: 'Sigma',  greekVal: 200, arabic: 'ر', aName: 'Ra',     arabicVal: 200 },
  { heb: 'ש', name: 'Shin',   val: 300, greek: 'Τ', gName: 'Tau',    greekVal: 300, arabic: 'ش', aName: 'Shin',   arabicVal: 300 },
  { heb: 'ת', name: 'Tav',    val: 400, greek: 'Υ', gName: 'Upsilon',greekVal: 400, arabic: 'ت', aName: 'Ta',     arabicVal: 400 },
];
