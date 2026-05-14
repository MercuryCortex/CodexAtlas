# Master Influence Edge List

Every cross-document / cross-tradition / cross-deity edge that scholars have argued for. This is the raw edge list that feeds the visualization layer.

> Each edge has: **source**, **target**, **type**, **claim**, **scholarly ref**, **confidence** (consensus | majority | minority | contested | fringe).

## Format

```
[type] source → target
  claim: one-sentence description of what's being claimed
  ref: scholar (year), publication, [tier]
  confidence: consensus | majority | minority | contested | fringe
```

## Seed edges (to be expanded by agents — these are placeholders for the major famous claims)

### Mesopotamian → Hebrew

```
[parallel-motif] phase-1-006-atrahasis → genesis-flood
  claim: The Atrahasis flood narrative (gods send flood for noise/overpopulation; one human saved with boat and animals) shares motifs with Genesis 6–9.
  ref: George (2003), "The Babylonian Gilgamesh Epic", Oxford UP, tier 1
  confidence: consensus (motif parallel); contested (direct borrowing vs shared milieu)

[parallel-motif] phase-1-004-gilgamesh → genesis-flood
  claim: Gilgamesh Tablet XI flood narrative parallels Genesis flood, including the bird-release motif.
  ref: George (2003); Heidel (1949), "The Gilgamesh Epic and Old Testament Parallels", tier 1-2
  confidence: consensus (parallel); majority (mediation via Mesopotamian sources)

[parallel-motif] phase-1-008-enuma-elish → genesis-1
  claim: Enuma Elish's primordial waters → ordered cosmos shares structural motifs with Genesis 1 chaoskampf reduced to fiat creation.
  ref: Smith (2010), "The Priestly Vision of Genesis 1", Fortress; Heidel (1951), "The Babylonian Genesis", tier 1-2
  confidence: majority (motif parallel); contested (direct dependence)

[parallel-motif] phase-1-007-code-of-hammurabi → hebrew-covenant-code
  claim: The Hebrew Bible's Covenant Code (Exod 21–23) shows striking structural and verbal parallels with CH, including the goring-ox provisions, slave-treatment rules, and the lex talionis.
  ref: Wright (2009), "Inventing God's Law", Oxford UP; Roth (1995), "Law Collections from Mesopotamia and Asia Minor", SBL, tier 1-2
  confidence: majority (shared-milieu / common ANE legal tradition); minority (direct literary dependence per Wright)

[parallel-motif] phase-1-005-instructions-of-shuruppak → hebrew-proverbs
  claim: Sumerian wisdom-proverb genre, with father-to-son framing and prudential ethics, anticipates the Hebrew Proverbs and broader ANE wisdom continuum.
  ref: Lambert (1960), "Babylonian Wisdom Literature", Oxford UP; Alster (2005), "Wisdom of Ancient Sumer", CDL Press, tier 1
  confidence: consensus (shared genre); contested (direct mediation)

[parallel-motif] phase-1-004-gilgamesh-old-babylonian → hebrew-qohelet
  claim: The OB Sippar tablet's alewife-Šiduri advice to Gilgamesh ("Let your stomach be full...") resembles Qohelet's mortality-and-pleasure counsel.
  ref: Jones (2008), "Bound by Bondage: Gilgamesh and Qohelet"; George (2003), "The Babylonian Gilgamesh Epic", tier 1-2
  confidence: minority (direct dependence); majority (shared ANE wisdom topos)
```

### Canaanite → Hebrew

```
[syncretic-identification] el-canaanite → el-elohim-hebrew
  claim: The Canaanite high god El (head of the divine council, called "father of years", consort Asherah) is the same name and substantially the same figure who becomes the chief god of early Israel before being merged with Yahweh.
  ref: Smith (2002), "The Early History of God", Eerdmans; Smith (2001), "The Origins of Biblical Monotheism", Oxford UP, tier 1
  confidence: consensus

[polemic-against] phase-1-013-baal-cycle → hebrew-bible-prophetic
  claim: The Hebrew prophets (especially Hosea, Jeremiah) polemicize against Baal worship, attesting to its presence within Israelite practice.
  ref: Day (2000), "Yahweh and the Gods and Goddesses of Canaan", Sheffield, tier 1
  confidence: consensus

[parallel-motif] phase-1-013-baal-cycle → hebrew-chaoskampf-residues
  claim: Hebrew Bible passages of Yahweh defeating Leviathan / Rahab / Yam (Ps 74:13–14; Job 26:12; Isa 27:1, 51:9–10) reproduce the Canaanite Baal-vs.-Yam chaoskampf pattern with Yahweh in Baal's role.
  ref: Day (1985), "God's Conflict with the Dragon and the Sea", Cambridge UP, tier 2
  confidence: consensus

[shared-tradition] phase-1-014-ugaritic-ritual-texts → hebrew-leviticus
  claim: Ugaritic sacrificial vocabulary (šlmm, dbḥ) shares roots and structure with Hebrew Levitical sacrifice (šelamim, zebaḥ); shared West Semitic sacrificial system.
  ref: Pardee (2002), "Ritual and Cult at Ugarit", SBL; Levine (1974), "In the Presence of the Lord", tier 1-2
  confidence: consensus

[shared-tradition] ugaritic-rapiuma → hebrew-rephaim
  claim: Ugaritic rapiʾūma (divinized ancestral dead) and Hebrew rephaim are cognate; Hebrew Bible's ambivalent treatment reflects suppression of a Canaanite ancestor-cult.
  ref: Lewis (1989), "Cults of the Dead in Ancient Israel and Ugarit", Harvard Semitic Monographs, tier 1
  confidence: consensus
```

### Mesopotamian / Canaanite → Hebrew (flood and primeval history)

```
[parallel-motif] phase-1-006-atrahasis → genesis-flood
  claim: Atrahasis Tablet III's flood narrative (divine decision, warning to chosen man, boat, deluge, sacrifice, divine regret, post-flood reorganization) is the prototype that the SB Gilgamesh XI directly adapts and that the Hebrew Bible Genesis 6-9 echoes; Genesis re-motivates from "noise" to "wickedness."
  ref: Lambert & Millard (1969), "Atra-Ḫasīs", Oxford UP; George (2003), tier 1
  confidence: consensus (parallel); majority (mediation chain Atrahasis → SB Gilgamesh XI → shared Hebrew tradition)

[parallel-motif] phase-1-008-enuma-elish → hebrew-tehom
  claim: Akkadian tiāmat and Hebrew tehôm (Gen 1:2) are cognate (proto-Semitic *tihām-*); Gen 1:2's tehôm may carry personified-chaos residue, demythologized into the priestly creation-by-fiat.
  ref: Heidel (1951); Gunkel (1895); Smith (2010), tier 1-2
  confidence: consensus (cognate); contested (degree of personification residue)
```

### Zoroastrian → Judaism / Christianity

```
[shared-milieu] zoroastrian-gathas → second-temple-judaism
  claim: Cosmic dualism, final judgment, resurrection of the body, hierarchies of angels and demons — these are absent or marginal in pre-exilic Hebrew Bible and prominent in post-exilic and Second Temple texts; chronologically post-dates Persian contact.
  ref: Boyce (1984), "Zoroastrians: Their Religious Beliefs and Practices", Routledge; Barr (1985), "The Question of Religious Influence: The Case of Zoroastrianism, Judaism, and Christianity", JAAR, tier 1-2
  confidence: majority (influence); contested (mechanism and degree)

[parallel-motif] zoroastrian-gathas → christian-eschatology
  claim: Saoshyant (final savior who resurrects the dead and renews the world) parallels the Christian Christ-as-final-judge.
  ref: Boyce (1984); Hultgård (2000) in "Apocalypticism in the Mediterranean World", tier 2
  confidence: majority
```

### Egyptian → Greek / Hellenistic

```
[syncretic-identification] thoth-egyptian → hermes-greek → hermes-trismegistus-hermetic
  claim: The Greek identification of Thoth with Hermes is attested from Herodotus onward; the Hellenistic "thrice-great Hermes" of the Corpus Hermeticum is a syncretic deity born of Egyptian priests writing in Greek.
  ref: Fowden (1986), "The Egyptian Hermes", Cambridge UP, tier 1
  confidence: consensus

[parallel-motif] osiris-egyptian → dying-rising-god
  claim: Osiris's death and revivification by Isis is a foundational dying-rising-god motif; whether and how it influenced later soteriologies is debated.
  ref: Smith (2017), "Following Osiris", Oxford UP; Mettinger (2001), "The Riddle of Resurrection", Almqvist & Wiksell, tier 1-2
  confidence: consensus (Egyptian motif); contested (influence on Christianity)

[parallel-motif] phase-1-011-great-hymn-to-aten → hebrew-psalm-104
  claim: Extensive verbal and structural parallels between the Great Hymn to the Aten and Psalm 104 (esp. vv. 19–30) — both celebrate the daily solar cycle, differentiation of creatures, sole creator's universal beneficence.
  ref: Lichtheim (1976), "Ancient Egyptian Literature II", UC Press; Assmann (1997, 2014), tier 1-2
  confidence: consensus (parallel); minority (direct dependence, per Assmann); majority (shared ANE sun-hymn topos)

[parallel-motif] phase-1-010-book-of-the-dead → christian-last-judgment
  claim: The Egyptian weighing-of-the-heart scene (Book of the Dead Spell 125) is the iconographic and conceptual ancestor of later Mediterranean psychostasia (weighing of souls), including Christian Last Judgment imagery (Michael with scales).
  ref: Smith (2017), "Following Osiris"; Frankfurter (1998), "Religion in Roman Egypt", tier 1-2
  confidence: consensus (Egyptian origins); majority (mediation via Hellenistic Alexandria)

[redaction-of] phase-1-002-pyramid-texts → phase-1-009-coffin-texts → phase-1-010-book-of-the-dead
  claim: Continuous textual descent — Coffin Texts adapt Pyramid Texts spells with personal-name substitutions; Book of the Dead inherits and re-mediates Coffin Texts material for papyrus use. The textbook example of Egyptian "democratization of the afterlife."
  ref: Allen (2005); Hornung (1999), "The Ancient Egyptian Books of the Afterlife", tier 1
  confidence: consensus
```

### Late Bronze diplomatic / religious network

```
[shared-milieu] phase-1-012-amarna-letters → late-bronze-canaanite-religion
  claim: The Amarna vassal letters' Canaanite religious vocabulary (Baal, El, Hadad in West Semitic glosses) corroborates the Ugaritic pantheon and gives independent attestation of Late Bronze Canaanite religion.
  ref: Moran (1992), "The Amarna Letters", JHU Press; Rainey (1996), "Canaanite in the Amarna Tablets", Brill, tier 1
  confidence: consensus

[shared-milieu] amarna-habiru → israelite-origins-debate
  claim: The Amarna letters' references to ḫapiru/habiru bands in Late Bronze Canaan have long figured in the debate over Hebrew/Israelite origins; linguistic cognacy (ḫapiru / ʿibri) is plausible, sociological-ethnic equivalence is contested.
  ref: Na'aman (2005), "Canaan in the Second Millennium B.C.E.", Eisenbrauns; Finkelstein & Silberman (2001), "The Bible Unearthed", tier 1-2
  confidence: contested
```

### Greek philosophy → Gnosticism / Christianity / Hermeticism

```
[direct-influence] plato-timaeus → gnostic-cosmologies
  claim: The demiurge figure of Gnostic systems (especially Sethian/Valentinian) draws on Plato's Timaeus craftsman, but inverts its valuation (Plato's good demiurge becomes Gnostic ignorant/malevolent craftsman).
  ref: Turner (2001), "Sethian Gnosticism and the Platonic Tradition", Brill; Pearson (1990), "Gnosticism, Judaism, and Egyptian Christianity", Fortress, tier 1
  confidence: consensus

[direct-influence] middle-platonism → philo-of-alexandria
  claim: Philo's Logos theology applies Middle Platonist categories to Hebrew scripture; this synthesis feeds the Gospel of John's Logos prologue and Christian theology.
  ref: Runia (1993), "Philo in Early Christian Literature", Fortress, tier 1
  confidence: consensus
```

### Indian → Greek (or vice versa)

```
[shared-milieu] upanishadic-thought → orphic-pythagorean
  claim: Reincarnation appearing in 6th-c BCE Greek thought (Pythagoras, Orphism) shortly after it appears in early Upanishads has suggested mutual contact via Persian trade routes; direct dependence not established.
  ref: West (1971), "Early Greek Philosophy and the Orient", Oxford UP, tier 1-2
  confidence: minority (direct contact); majority (parallel emergence)
```

### Buddhist → Christian Gnosticism

```
[parallel-motif] buddhist-emptiness-doctrine → gnostic-acosmism
  claim: Some scholars argue Buddhist contact via the Silk Road influenced Gnostic world-rejection; others see independent development from Platonic and Jewish apocalyptic sources.
  ref: Conze (1967), "Buddhism and Gnosis", in "Le Origini dello Gnosticismo"; rejected by most subsequent scholarship
  confidence: minority / contested
```

### Phase 4 — Late Antiquity convergence edges

```
[direct-influence] plato-timaeus → apocryphon-of-john (Yaldabaoth)
  claim: The Sethian demiurge Yaldabaoth is a Platonist craftsman whose moral valuation has been inverted; the entire Pleroma is a Platonist hypostatic scheme.
  ref: Turner (2001), Sethian Gnosticism and the Platonic Tradition, Peeters, tier 1; Pearson (1990), Gnosticism, Judaism, and Egyptian Christianity, Fortress, tier 1
  confidence: consensus

[syncretic-identification] el-elohim-hebrew / yahweh → yaldabaoth (Sethian polemic)
  claim: Sethian Gnostic texts identify the Hebrew Bible's creator-god with the ignorant demiurge Yaldabaoth; the Apocryphon of John places "I am God and there is no other" (Isa 45:5 / Exod 20:3) in Yaldabaoth's mouth as proof of ignorance.
  ref: Pearson (1990); King (2006), The Secret Revelation of John, Harvard UP, tier 1; Williams (1996), Rethinking 'Gnosticism', Princeton UP, tier 1 (cautions against anti-Jewish reading)
  confidence: consensus (the identification); contested (its intent — anti-Jewish vs. anti-imperial-orthodox)

[direct-influence] zoroastrian-cosmic-dualism → manichaean-dualism
  claim: Mani deliberately adapts Zoroastrian theological vocabulary (Ohrmazd, Ahriman, Zurvan) for missionary purposes; the Manichaean two-principles dualism is the most explicit late-antique transmission of Iranian dualism into the Mediterranean and beyond.
  ref: Boyce & Grenet (1991), History of Zoroastrianism vol. 3, Brill, tier 1; Lieu (1992), Mani and Manichaeism, Manchester UP, tier 1
  confidence: consensus

[parallel-motif] corpus-hermeticum-i (Poimandres) → gospel-of-john (prologue)
  claim: The Logos-revelation grammar — Logos descending into a darkness that does not comprehend it, light-coming-into-the-world, gnosis as the goal — is shared between Hermetic Poimandres and the Johannine prologue. Direction of influence contested; shared Alexandrian-Jewish-Hellenistic milieu favored.
  ref: Dodd (1953), The Interpretation of the Fourth Gospel, Cambridge UP, tier 1; Fowden (1986), The Egyptian Hermes, Cambridge UP, tier 1
  confidence: majority (parallel); minority (direct dependence either way)

[direct-influence] plotinus-enneads → pseudo-dionysius (via Proclus)
  claim: Christian apophatic theology — particularly its strongest form in Pseudo-Dionysius — derives substantially from Plotinian and Proclean Neoplatonism. Pseudo-Dionysius incorporates verbatim passages from Proclus.
  ref: Koch & Stiglmayr (1895), foundational philological demonstration; Rorem (1993), Pseudo-Dionysius: A Commentary, Oxford UP, tier 1
  confidence: consensus

[polemic-against] plotinus-enneads II.9 → sethian-gnostics (Allogenes, Zostrianos)
  claim: Plotinus' "Against the Gnostics" (Enneads II.9) attacks Gnostics in his Roman circle who used "apocalypses of Zoroaster, Zostrianos, Nicotheus, Allogenes" — texts whose Sethian Gnostic versions are now preserved at Nag Hammadi (NHC VIII,1; XI,3). A rare case where an ancient philosopher and surviving Gnostic texts are in direct documented dialogue.
  ref: Turner (2001); Tardieu (1996), Porphyry and the Gnostics; Narbonne (2011), Plotinus and the Gnostics, Brill, tier 1
  confidence: consensus

[shared-milieu] elchasaite-jewish-christian-baptists → cologne-mani-codex / mandaeism
  claim: The Elchasaite Jewish-Christian baptist sects of southern Mesopotamia are the documented origin of Mani and likely the proximate milieu of Mandaean origins.
  ref: Henrichs & Koenen on the CMC; Buckley (2002), The Mandaeans, Oxford UP, tier 1; Lupieri (2002), The Mandaeans
  confidence: consensus (Mani); majority (Mandaean)

[direct-influence] plotinus-enneads → augustine-confessions
  claim: Augustine credits "the Platonist books" (Plotinus via Marius Victorinus' Latin translation, plus possibly Porphyry) with helping him overcome Manichaean materialism on the way to Christian conversion (Conf. 7).
  ref: Brown (2000), Augustine of Hippo, UC Press, rev. ed., tier 1; BeDuhn (2010–13), Augustine and the Manichaeans, Penn, tier 1
  confidence: consensus

[autobiographical-and-polemical] manichaean-system → augustine (Confessions, Contra Faustum, De Natura Boni)
  claim: Augustine's nine years as a Manichaean Hearer (~373–382) make him our richest external witness to late-antique Manichaean teaching; his later anti-Manichaean polemic both refutes and partly preserves the system. BeDuhn argues residual Manichaean structural assumptions persist in Augustine's mature theology.
  ref: BeDuhn (2010–13); Brown (2000)
  confidence: consensus (autobiographical evidence); contested (degree of structural residue)

[direct-influence] genesis (LXX) → apocryphon-of-john / hypostasis-of-the-archons / on-the-origin-of-the-world
  claim: Sethian Gnostic texts are rewritings of Genesis 1–7; they invert the moral valuation of the creator while preserving the narrative structure. The Sethian midrashic engagement with Genesis is among the most consequential ancient counter-readings of the Hebrew Bible.
  ref: Pearson (1990); King (2006); Schenke (1974, foundational Sethian-as-category proposal)
  confidence: consensus

[polemic-preserving] hermetic-asclepius ↔ augustine-city-of-god 8 (animated statues)
  claim: The Hermetic doctrine of cult-statues animated by daimones (Asclepius Lament) is preserved both in the Latin Asclepius and in NHC VI,8, and is attacked in detail by Augustine, City of God 8.23–26 — who indirectly preserves the doctrine for later Western transmission.
  ref: Copenhaver (1992), Hermetica; Fowden (1986); McCracken (1957–72), Loeb City of God
  confidence: consensus

[redaction-of] eugnostos-the-blessed → sophia-of-jesus-christ
  claim: The non-Christian philosophical Gnostic treatise Eugnostos (NHC III,3 / V,1) was Christianized by being reframed as a post-resurrection dialogue between Jesus and the disciples — the cleanest documented case of Gnostic Christianizing of a non-Christian source.
  ref: Parrott (1991), Nag Hammadi Studies XXVII, Brill, tier 1
  confidence: consensus

[parallel-motif] trimorphic-protennoia → gospel-of-john (prologue)
  claim: The third movement of Trimorphic Protennoia is so close in phrasing to the Johannine prologue that scholars have argued for direct relationship (in either direction) or for a shared Sethian-Jewish wisdom-hymn tradition.
  ref: Robinson (1981); Turner (2001); Evans (counter-position arguing John's priority)
  confidence: contested

[direct-influence] proclus-elements-of-theology → arabic-liber-de-causis → aquinas
  claim: Proclus' Elements of Theology was reworked as an Arabic Neoplatonist text (Kitab al-Khayr al-Mahd / Liber de Causis), entered Latin via Gerard of Cremona (~1167), and was widely read in scholastic philosophy. Aquinas (~1268) identified the Proclean source.
  ref: Dodds (1963), Proclus: Elements of Theology; D'Ancona, Recherches sur le Liber de Causis
  confidence: consensus

[shared-milieu] babylonian-talmud → sasanian-zoroastrian-context
  claim: The Babylonian Talmud was redacted in Sasanian Babylonia under Zoroastrian state religion; Babylonian Jewish-Iranian cultural contact is documented in shared legal categories, demonological materials, and theological vocabulary.
  ref: Secunda (2014), The Iranian Talmud, Penn; Shaked, Elman, et al., Irano-Judaica series, Ben-Zvi Institute, tier 1
  confidence: majority

[parallel-motif] quran ↔ syriac-christian-homiletic-tradition
  claim: Quranic narrative engagements with biblical figures show extensive parallels with late-antique Syriac Christian homiletic literature (Ephrem, Jacob of Serugh). Shared milieu, not direct literary dependence, is the current consensus.
  ref: Reynolds (2008, 2011), The Qur'an in Its Historical Context, Routledge; Griffith (2013), The Bible in Arabic, Princeton UP
  confidence: majority

[linguistic-continuity] el (Semitic) → el-canaanite → el-elohim-hebrew → elaha (Aramaic) → allah (Quranic)
  claim: The Semitic root *'l (deity) underlies a continuous linguistic chain across West Semitic religions including pre-Islamic Arabic. The chain documents the linguistic continuity; theological continuity is real but variously developed.
  ref: Hawting (1999), The Idea of Idolatry and the Emergence of Islam, Cambridge UP; Donner (2010); Mark Smith (2002), The Early History of God
  confidence: consensus (linguistic); majority (functional-theological)
```

---

## Phase 2 cross-tradition edges (Axial Age)

### Indo-Iranian (Vedic ↔ Zoroastrian) — the deepest cognate pair

```
[shared-milieu] phase-2-001-rig-veda-family-books → phase-2-002-gathas-of-zarathustra
  claim: Vedic Sanskrit and Old Avestan are sister languages; the texts share an entire ritual-cosmic vocabulary — ṛta/aša, yajña/yasna, soma/haoma, hotṛ/zaotar, deva/daēva (inverted), asura/ahura (inverted) — making them the closest extant pair of religious traditions from a recoverable common ancestor.
  ref: Boyce (1975), A History of Zoroastrianism vol. I, Brill, tier 1; Skjærvø (2011), tier 2
  confidence: consensus

[syncretic-identification] soma → haoma-zoroastrian
  claim: Vedic Soma and Avestan Haoma are cognate ritual substances, prepared and consumed in cognate rites within cognate liturgies. Same name, same plant family (Ephedra favored), same ritual role.
  ref: Falk (1989) "Soma and Haoma", BSOAS 52, tier 1
  confidence: consensus (cognate); ongoing (botanical ID)

[scholarly-parallel] mitra-vedic → mithra-zoroastrian
  claim: Both inherit Proto-Indo-Iranian *Mitra (the covenant-god). Vedic Mitra is more abstract sovereign-of-contract; Avestan Mithra is more militarized and solar.
  ref: Thieme (1960) JAOS 80; Boyce (1975), tier 1
  confidence: consensus

[scholarly-parallel] varuna → ahura-mazda
  claim: Both Indo-Iranian sovereign Asura/Ahura figures associated with cosmic-moral order. Whether the direct identification is right is contested; the structural-functional parallel is widely accepted.
  ref: Thieme (1960); Hale (1986) The Asuras in the Rgveda, tier 1-2
  confidence: majority (parallel); contested (direct equation)
```

### Zoroastrian → Second Temple Judaism (the central Phase 2/3 hinge edge)

```
[shared-milieu] phase-2-002-gathas-of-zarathustra → second-temple-judaism
  claim: Persian rule of Judah (539-332 BCE, beginning with Cyrus's 538 BCE edict of return) is the historical contact window in which cosmic dualism, organized angelology (Amesha Spentas → seven archangels), structured demonology (Angra Mainyu → developed Satan), bodily resurrection, and the renovatio mundi appear as Jewish doctrines for the first time. These features are absent or marginal in pre-exilic Hebrew Bible.
  ref: Boyce & Grenet (1991) A History of Zoroastrianism vol. III, Brill, tier 1; Shaked (1984) "Iranian Influence on Judaism", CHJud, tier 1; Barr (1985) JAAR 53, tier 1
  confidence: majority (influence on developing eschatology and angelology); contested (precise mechanism)

[scholarly-parallel] the-amesha-spentas → second-temple-archangels
  claim: The seven Bounteous Immortals around Ahura Mazda parallel the seven archangels of 1 Enoch 20 (Michael, Gabriel, Raphael, Uriel, Raguel, Saraqael, Remiel), Tobit, Qumran sectarian texts. The numerical and structural parallel emerging in the Persian / early Hellenistic period is the strongest single evidence for Zoroastrian influence on Jewish angelology.
  ref: Boyce & Grenet (1991), tier 1
  confidence: majority

[scholarly-parallel] angra-mainyu-ahriman → satan-second-temple-jewish
  claim: The Hebrew Bible's pre-exilic *ha-śāṭān* is a member of YHWH's heavenly court who functions as accuser (Job 1-2; Zech 3). The Second Temple Satan / Belial / Mastema as cosmic adversary, prince of demons, opponent of God, develops in the Persian / Hellenistic period. The structural parallel to Angra Mainyu's role is the standard hypothesis.
  ref: Boyce & Grenet (1991); Russell (1977) The Devil, Cornell UP, tier 1-2
  confidence: majority

[liberator-event] cyrus-the-great → second-temple-judaism
  claim: Cyrus's 538 BCE edict of return enabled the rebuilding of the Jerusalem Temple (~520-515 BCE) and the formation of post-exilic Yehud as the matrix in which Second Temple Judaism crystallized. Second Isaiah explicitly calls Cyrus YHWH's anointed (Isa 45:1) — the only Gentile so titled.
  ref: Briant (2002) From Cyrus to Alexander, Eisenbrauns, tier 1; Isa 44-45, Ezra 1
  confidence: consensus
```

### Hittite / Mesopotamian → Hesiod and Homer (Eastern Mediterranean myth transfer)

```
[parallel-motif] hittite-kumarbi-cycle → phase-2-009-hesiod-theogony-works-and-days
  claim: The Hesiodic succession myth (Uranus castrated by son Kronos; Kronos overthrown by son Zeus; Zeus defeats Typhoeus) follows the same generational-displacement structure as the Hittite Kumarbi cycle: Anu castrated by Kumarbi biting off his genitals; Kumarbi overthrown by storm-god Teshub; Teshub defeats the stone-monster Ullikummi. The structural and motival parallel is the gold-standard demonstration of Bronze Age Eastern Mediterranean myth transfer to Greece.
  ref: West (1997) The East Face of Helicon, Oxford UP, tier 1; Güterbock (1948) AJA 52, tier 1
  confidence: consensus

[parallel-motif] phase-1-008-enuma-elish → phase-2-009-hesiod-theogony-works-and-days
  claim: Marduk vs. Tiamat shares chaoskampf structure with Zeus vs. Typhoeus and (more distantly) with the succession myth. Likely mediated by Hittite/Hurrian intermediaries rather than direct Mesopotamian-Greek transmission.
  ref: West (1997); Burkert (1992) The Orientalizing Revolution, Harvard UP, tier 1
  confidence: majority (mediated parallel)

[parallel-motif] phase-1-004-gilgamesh-old-babylonian → phase-2-008-homeric-epics
  claim: Hero-and-companion (Gilgamesh/Enkidu ↔ Achilles/Patroclus); wandering hero with descent to the dead (Gilgamesh ↔ Odysseus). West argues plausible Bronze Age literary transmission; the specific debt remains debated.
  ref: West (1997); Burkert (1992)
  confidence: majority (broad influence); contested (specific borrowings)
```

### Inanna-Ishtar-Astarte-Aphrodite (the Eastern Mediterranean love-and-war goddess chain)

```
[scholarly-parallel] ishtar-akkadian → aphrodite-greek
  claim: Via Phoenician Astarte → Cypriot Aphrodite (Paphos was a Phoenician colony) → Greek Aphrodite. Iconography (nudity, dove, role), cult, and the geographic chain through Cyprus support the transmission. The Eastern Mediterranean love-and-war goddess complex is one of the most thoroughly documented cases of cross-cultural goddess transmission.
  ref: Burkert (1992) The Orientalizing Revolution; West (1997), tier 1
  confidence: consensus
```

### Mesopotamian / Canaanite → Hebrew Bible J source

```
[parallel-motif] phase-1-006-atrahasis → phase-2-005-hebrew-bible-j-source
  claim: J's flood layer (Gen 7-8 partial) shares motifs with Atrahasis: divine offense, one righteous man warned, ark with animals, post-flood sacrifice. The structural parallels are clearest for J among the Pentateuchal flood materials.
  ref: George (2003); Smith (2010); Heidel (1949), tier 1
  confidence: consensus (parallel); contested (direct dependence vs. shared milieu)

[syncretic-identification] el-canaanite → el-elohim-hebrew → yahweh
  claim: The Canaanite high god El is identified with the Israelite Elohim, then with YHWH. Deut 32:8-9 (LXX/Qumran reading) preserves the older theology where El Elyon assigns nations to subordinate gods including YHWH. The progressive identification YHWH = El = sole Elohim is the textual movement toward Hebrew Bible monotheism.
  ref: Smith (2002) The Early History of God, Eerdmans; Cross (1973), Harvard UP, tier 1
  confidence: consensus
```

### Neo-Assyrian → Hebrew Bible D source

```
[parallel-motif] esarhaddon-succession-treaty → phase-2-011-hebrew-bible-d-source
  claim: The structural form of Deuteronomy (preamble, historical prologue, stipulations, blessings, curses, witnesses) matches Neo-Assyrian vassal-treaty form. Deut 28's curses parallel Esarhaddon's Succession Treaty (672 BCE) curses sentence-by-sentence in places. The polemic move: Israel is YHWH's vassal, not Assyria's.
  ref: Weinfeld (1972) Deuteronomy and the Deuteronomic School, Oxford UP, tier 1; Steymans (1995), tier 1
  confidence: consensus
```

### South Asia internal — Upaniṣads / Buddhism / Jainism shared milieu

```
[shared-milieu] phase-2-012-brihadaranyaka-upanishad → phase-2-016-early-buddhist-suttas
  claim: Karma, rebirth, liberation, the renouncer ideal — shared across the Upaniṣads, early Buddhism, and Jainism, all emerging in the eastern Gangetic plain ~-800 to -400 BCE. The Buddha's anātman doctrine specifically responds to Upaniṣadic ātman thinking.
  ref: Gombrich (1996) How Buddhism Began, Oxford UP, tier 1; Bronkhorst (2007) Greater Magadha, Brill, tier 1
  confidence: consensus (shared milieu); contested (direction of priority — Bronkhorst's "Greater Magadha" thesis reverses the standard ordering)

[shared-milieu] phase-2-016-early-buddhist-suttas → jain-agamas
  claim: The Buddhist Pali canon names Mahāvīra (as Nigaṇṭha Nātaputta) as a contemporary rival teacher, mutually attesting the historicity of both founders and the shared ascetic-śramaṇa milieu.
  ref: Dundas (2002) The Jains, Routledge, tier 1
  confidence: consensus
```

### Indo-European deep cognates

```
[scholarly-parallel] zeus → indra
  claim: Indo-European dragon-slaying formula (*g^when- "to slay" + *ogwhi- "serpent") attested in Vedic, Greek, Hittite, Germanic. Zeus's Typhoeus combat and Indra's Vṛtra-slaying are reflexes of the same poetic-mythological formula.
  ref: Watkins (1995) How to Kill a Dragon, Oxford UP, tier 1
  confidence: consensus (poetic formula); majority (mythological inheritance)

[scholarly-parallel] usha → eos-greek
  claim: PIE dawn-goddess *H₂éws-os, reflexes in Vedic Uṣas, Greek Eos, Latin Aurora, Lithuanian Aušrinė, English "Easter". One of the strongest reconstructable PIE deities.
  ref: West (2007) Indo-European Poetry and Myth, Oxford UP, tier 1
  confidence: consensus

[scholarly-parallel] zeus → dyaus-pita-vedic → jupiter-roman
  claim: PIE Sky-Father *Dyēus-pətēr. Greek Zeu pater, Vedic Dyauṣ Pitṛ, Latin Iūpiter / Diespiter — all the same name.
  ref: West (2007), tier 1
  confidence: consensus
```

---

## Phase 3 — Hellenistic & Second Temple added edges

### Plato → Gnostic cosmology (the demiurge axis)

```
[direct-influence] phase-3-002-plato-dialogues → gnostic-demiurge-cosmologies
  claim: Plato's *Timaeus* demiurge (a *good* divine craftsman who gazes at Forms and orders matter) is taken over by Sethian and Valentinian Gnostic systems but with valuation *inverted*: their demiurge (Yaldabaoth / Saklas / the Craftsman) is ignorant, arrogant, or malevolent. The figure descends; the meaning is reversed.
  ref: Turner, J.D. (2001), Sethian Gnosticism and the Platonic Tradition, Brill; Pearson, B.A. (1990), Gnosticism, Judaism, and Egyptian Christianity, Fortress, tier 1
  confidence: consensus
```

### Stoic logos → Philo → John (the three-step Logos transmission)

```
[direct-influence] phase-3-005-stoic-foundational-texts → phase-3-013-philo-of-alexandria
  claim: Philo's Logos is built on Stoic immanent cosmic-reason logos, fused with Platonic transcendent Forms; the Stoic terminology, providence-and-fate framework, and cosmos-as-rational-organism picture are taken over wholesale.
  ref: Runia, D.T. (1993), Philo in Early Christian Literature, Fortress; Frede, M. (1999), "Stoic Logic and Theology", tier 1
  confidence: consensus

[direct-influence] phase-3-013-philo-of-alexandria → phase-3-020-gospel-of-john
  claim: The Johannine Logos prologue (Jn 1:1–18) presupposes Hellenistic-Jewish logos-Sophia theology of the kind Philo represents; the agent-of-creation, divine pre-existence, and cosmic-Word-incarnated structure all parallel Philonic categories.
  ref: Hengel, M. (1989), The Johannine Question; Borgen, P. (1965), Bread from Heaven, Brill; Boyarin, D. (2004), Border Lines (shared Jewish discourse rather than direct literary use), tier 1
  confidence: majority (substantial influence); contested (direct literary dependence vs. shared synagogue discourse)

[direct-influence] phase-3-020-gospel-of-john → patristic-trinitarian-theology
  claim: John 1's Logos prologue becomes the canonical scriptural basis for Nicene Trinitarian theology; Patristic Christology is unimaginable without it.
  ref: Pelikan, J. (1971), The Christian Tradition vol. 1, Chicago UP, tier 1
  confidence: consensus
```

### Zoroastrian → Second Temple → Christian eschatology

```
[shared-milieu] zoroastrian-younger-avesta → phase-3-008-book-of-daniel
  claim: Daniel 7's four-empire schema, cosmic battles of angelic princes (ch. 10), and unambiguous resurrection text (12:2) have their nearest extant antecedents in Iranian apocalyptic; transmission via post-exilic Jewish-Persian contact.
  ref: Hultgård, A. (1991), "Persian Apocalypticism and the Book of Daniel"; Collins, J.J. (2016), The Apocalyptic Imagination, 3rd ed., Eerdmans, tier 1
  confidence: majority (influence); contested (mechanism and degree)

[shared-milieu] zoroastrian-younger-avesta → phase-3-011-dead-sea-scrolls
  claim: The Two Spirits doctrine of 1QS 3:13–4:26 (one Spirit of Truth and one of Perversion, allotted to humans, eschatologically separated) has its closest extant parallel in Yasna 30 (Avestan twin spirits choosing good and evil).
  ref: Kuhn, K.G. (1952), "Die Sektenschrift und die iranische Religion"; Frey, J. (1997), "Different Patterns of Dualistic Thought in the Qumran Library", tier 1-2
  confidence: majority

[parallel-motif] zoroastrian-younger-avesta → phase-3-016-gospel-of-mark
  claim: Christian eschatology's framework — final judgment, resurrection, cosmic battle of God and Satan, world-renewal — is structurally Iranian-apocalyptic with Second-Temple Jewish (esp. Danielic and Enochic) intermediation.
  ref: Boyce, M. (1984), Zoroastrians, Routledge; Hultgård, A. (2000) in Apocalypticism in the Mediterranean World, tier 1-2
  confidence: majority
```

### Hellenistic mystery cults → Christian sacramentalism (parallel-motif, NOT dependence)

```
[parallel-motif] tradition-mystery-cults → phase-3-016-gospel-of-mark
  claim: Mystery-cult initiation language (*mystērion*, dying-with-the-god, baptismal washings, sacred meals) shares vocabulary and form with early Christian sacramental practice and Pauline soteriology. Mainstream specialist position: *parallel-motif* within shared Hellenistic religious discourse, NOT direct dependence in either direction.
  ref: Bremmer, J.N. (2014), Initiation into the Mysteries of the Ancient World, De Gruyter; Bowden, H. (2010), Mystery Cults in the Ancient World, Princeton UP; Smith, J.Z. (1990), Drudgery Divine, Chicago UP, tier 1
  confidence: consensus (parallel-motif); minority (direct dependence)

[parallel-motif] mithras-roman → christian-soteriology
  claim: Popular 19th-c. claims of large-scale Mithraic-to-Christian borrowing (December 25, communion meal, savior figure, baptism) are mostly false or overstated. Genuine parallels (male initiate brotherhoods, soul-ascent through planetary spheres, mystery-secrecy) reflect shared Hellenistic religious vocabulary.
  ref: Clauss, M. (2000), The Roman Cult of Mithras, Routledge; Gordon, R. (1996), Image and Value in the Graeco-Roman World, Variorum, tier 1
  confidence: consensus (popular borrowing claims rejected; shared milieu accepted)
```

### Second-Temple apocalyptic → New Testament

```
[direct-quote] phase-3-008-book-of-daniel → phase-3-016-gospel-of-mark
  claim: Mark 13 ("the desolating sacrilege", "the Son of Man coming on the clouds") explicitly cites Daniel 9:27/11:31 and Daniel 7:13. Daniel is the direct source of the most loaded christological-eschatological vocabulary in Mark.
  ref: Marcus, J. (2000), Mark, Hermeneia; France, R.T. (2002), The Gospel of Mark, NIGTC, tier 1
  confidence: consensus

[direct-quote] phase-3-004-1-enoch → epistle-of-jude
  claim: Jude 14–15 explicitly cites 1 Enoch 1:9 with attribution ("Enoch... prophesied"). The only direct NT citation of 1 Enoch as Scripture.
  ref: Bauckham, R. (1983), Jude, 2 Peter, WBC; Nickelsburg, G.W.E. (2001), 1 Enoch 1, Hermeneia, tier 1
  confidence: consensus

[parallel-motif] phase-3-004-1-enoch → phase-3-016-gospel-of-mark
  claim: The "Son of Man" Christology of the Gospels has its closest extant pre-Christian parallel in 1 Enoch's Book of Parables (chs. 37–71), where the Son of Man / Chosen One is enthroned beside the Head of Days.
  ref: Nickelsburg, G.W.E. & VanderKam, J.C. (2012), 1 Enoch 2, Hermeneia; Collins, J.J. (2016), tier 1
  confidence: majority (parallel); contested (literary knowledge of Parables by NT writers)
```

### Wisdom of Solomon → Paul; Stoic ethics → Paul

```
[direct-influence] phase-3-012-wisdom-of-solomon → phase-3-015-pauline-epistles
  claim: Romans 1:18–32 closely parallels Wisdom of Solomon 13–15 in structure (idolatry → moral collapse → divine wrath) and specific vocabulary; mainstream scholarship treats this as conscious literary dependence.
  ref: Hays, R.B. (1989), Echoes of Scripture in the Letters of Paul, Yale UP; Watson, F. (2004), Paul and the Hermeneutics of Faith, tier 1-2
  confidence: majority

[parallel-motif] phase-3-005-stoic-foundational-texts → phase-3-015-pauline-epistles
  claim: Paul's natural-law argument (Rom 2:14–15) and his vice/virtue lists deploy Stoic ethical vocabulary; Acts 17:28 has Paul quoting Aratus (Stoic poet).
  ref: Engberg-Pedersen, T. (2000), Paul and the Stoics, WJK, tier 1-2
  confidence: majority
```

### Maccabean martyr theology → New Testament atonement

```
[parallel-motif] phase-3-019-4-maccabees → phase-3-015-pauline-epistles
  claim: 4 Maccabees 17:21–22 uses *hilastērion* (atoning sacrifice) and 6:29 uses *antipsychon* (life-substitute) of the Maccabean martyrs' deaths for Israel — the closest pre-Christian Hellenistic-Jewish parallel to Pauline atonement language (Rom 3:25 *hilastērion*; Mk 10:45 *lytron anti pollōn*).
  ref: van Henten, J.W. (1997), The Maccabean Martyrs as Saviours of the Jewish People, Brill; Williams, S.K. (1975), Jesus' Death as Saving Event, Scholars Press, tier 1-2
  confidence: majority (shared discourse); contested (direct literary dependence)
```

### Egyptian temple theology → Hermetism

```
[direct-influence] thoth-egyptian → hermes-trismegistus
  claim: The Hellenistic Hermes Trismegistus is the Hellenized continuation of Egyptian Thoth in the temple-priestly milieu of Roman-period Egypt; the wisdom-revelator content is Egyptian in substance.
  ref: Fowden, G. (1986), The Egyptian Hermes, Cambridge UP; Mahé, J.-P. (1978), Hermès en Haute-Égypte, tier 1
  confidence: consensus

[parallel-motif] phase-3-021-hermetic-corpus-earliest → phase-3-013-philo-of-alexandria
  claim: Hermetic cosmologies (esp. Poimandres) share extensive Middle Platonist + Logos vocabulary with Philo; both belong to the same Hellenistic-Egyptian philosophical-religious milieu, expressed for different religious communities.
  ref: Fowden, G. (1986); Festugière, A.-J. (1944–1954), La Révélation d'Hermès Trismégiste (4 vols), tier 1
  confidence: majority
```

### Qumran → John the Baptist / earliest Christianity (shared milieu)

```
[shared-milieu] phase-3-011-dead-sea-scrolls → phase-3-016-gospel-of-mark
  claim: Mark opens (1:2–3) with Isa 40:3 ("voice in the wilderness"), which is also Qumran's foundational text (1QS 8:13–14). John the Baptist's wilderness location, repentance-baptism, and apocalyptic preaching reflect shared Judean-apocalyptic milieu, not literary dependence.
  ref: Charlesworth, J.H. (ed.) (2006), The Bible and the Dead Sea Scrolls, Baylor UP; Frey, J. (2018), The Glory of the Crucified One, Baylor UP, tier 1
  confidence: consensus (shared milieu)

[parallel-motif] phase-3-011-dead-sea-scrolls → phase-3-020-gospel-of-john
  claim: Johannine cosmic dualism (light/darkness, truth/falsehood, sons of light) shares vocabulary with Qumran's Two Spirits doctrine; both descend from a common Second-Temple Jewish sectarian-apocalyptic substrate.
  ref: Brown, R.E. (1966), John AYB 29; Charlesworth, J.H. (1990), "John and the Dead Sea Scrolls"; Frey, J. (2018), tier 1
  confidence: majority
```

### Plato → Philo → Hermeticism → Neoplatonism (concept-deity transmission)

```
[direct-influence] phase-3-002-plato-dialogues → phase-3-013-philo-of-alexandria
  claim: Philo's De Opificio Mundi reads Genesis 1 through Plato's Timaeus; Philo's Logos-as-blueprint is essentially the Platonic world of Forms operationalized as God's first thought.
  ref: Runia, D.T. (1986), Philo of Alexandria and the Timaeus of Plato, Brill, tier 1
  confidence: consensus
```

---

## Phase 7 — Modern (~1800 – present) edges

### Modern-recovery edges (the Phase-7-recovers-Phase-N pattern)

```
[modern-recovery] event-rosetta-stone-decipherment-1822 → phase-1-002-pyramid-texts
  claim: Champollion's 1822 hieroglyphic decipherment opened the entire Egyptian religious literature to systematic philological reading; Pyramid Texts, Coffin Texts, Book of the Dead, the Aten hymn all entered modern legibility through this 1822-onward Egyptological revolution.
  ref: Robinson, A. (2012), Cracking the Egyptian Code, Oxford UP, tier 1
  confidence: consensus

[modern-recovery] event-decipherment-of-cuneiform-1857 → phase-1-008-enuma-elish
  claim: The 1857 "Cuneiform Jury" test at the Royal Asiatic Society validated Akkadian decipherment; the Enuma Elish, Atrahasis, Gilgamesh, and Code of Hammurabi entered modern legibility through Rawlinson-Hincks-Talbot-Oppert's work.
  ref: Van De Mieroop, M. (2015), Babylon Mesopotamia and the Birth of Civilization, OUP, tier 1
  confidence: consensus

[modern-recovery] event-george-smith-flood-tablet-1872 → phase-1-004-gilgamesh-old-babylonian
  claim: George Smith's December 1872 identification of the Babylonian flood narrative on Gilgamesh Tablet XI made the Mesopotamian-Hebrew parallels publicly known; foundational moment for biblical comparativism.
  ref: Damrosch, D. (2007), The Buried Book, Henry Holt, tier 2
  confidence: consensus

[modern-recovery] event-ras-shamra-excavation-1928 → phase-1-013-baal-cycle
  claim: The 1928 discovery and 1929–30 decipherment of Ugaritic gave first direct primary access to Canaanite religion; Baal Cycle, Aqhat, Kirta, divine-council theology recovered.
  ref: Wyatt, N. (2002), Religious Texts from Ugarit, Sheffield, tier 1
  confidence: consensus

[modern-recovery] phase-7-013-gnostic-religion → event-nag-hammadi-discovery
  claim: Jonas's 1958 The Gnostic Religion provided the pre-Nag-Hammadi-publication scholarly framework that made the late-antique Gnostic discoveries intellectually serious for two decades.
  ref: Jonas, H. (1963), The Gnostic Religion (2nd ed.), Beacon, tier 1
  confidence: consensus

[modern-recovery] phase-7-014-gnostic-gospels → event-nag-hammadi-discovery
  claim: Pagels's 1979 trade-press book, building on Robinson's 1977 Nag Hammadi Library in English, made the 1945 find culturally legible to mass Western audiences for the first time — a two-stage delayed-reception edge.
  ref: Pagels, E. (1979), The Gnostic Gospels, Random House; King, K.L. (2003), What Is Gnosticism?, Harvard UP, tier 1-2
  confidence: consensus

[modern-recovery] phase-7-012-major-trends-jewish-mysticism → tradition-kabbalah
  claim: Scholem's 1941 Major Trends in Jewish Mysticism founded the academic study of Kabbalah as a modern discipline; before Scholem, Wissenschaft des Judentums historiography (Graetz) had treated Jewish mysticism as a regrettable irrational lapse.
  ref: Biale, D. (2018), Gershom Scholem: Master of the Kabbalah, Yale UP, tier 1
  confidence: consensus

[modern-recovery] phase-7-023-bruno-and-hermetic-tradition → tradition-hermeticism
  claim: Yates's 1964 Giordano Bruno and the Hermetic Tradition established Renaissance Hermeticism as a serious academic subject; before Yates, the Renaissance "magical" tradition had been substantially misclassified as either occult superstition or proto-science.
  ref: Hanegraaff, W.J. (2012), Esotericism and the Academy, Cambridge UP, tier 1
  confidence: consensus

[modern-recovery] event-cologne-mani-codex-identified-1970 → tradition-manichaeism
  claim: The 1970 identification of the Cologne Mani Codex provided first first-person autobiographical access to Mani; transformed Manichaean studies.
  ref: Koenen, L. & Römer, C. (1988), Der Kölner Mani-Kodex, Westdeutscher Verlag, tier 1
  confidence: consensus
```

### Dying-rising-god comparative category (Phase 7 → Phase 1)

```
[scholarly-category-construction] phase-7-007-golden-bough → theme-dying-rising-god
  claim: Frazer's Golden Bough (1890–1915) assembled the comparative "dying-and-reviving god" category by collecting Egyptian Osiris, Phrygian Attis, Hellenistic Adonis, Mesopotamian Tammuz/Dumuzi, Thracian/Greek Dionysus, and European harvest folklore under a single vegetal-fertility-ritual heading. The category was later (J.Z. Smith 1990) systematically dismantled but partially rehabilitated for some ANE deities (Mettinger 2001).
  ref: Frazer, J.G. (1890–1915), The Golden Bough; Smith, J.Z. (1990), Drudgery Divine, Chicago; Mettinger, T.N.D. (2001), The Riddle of Resurrection, tier 1
  confidence: consensus (Frazer constructed the category); contested (whether the category is real or projected)

[parallel-motif] dumuzi → adonis-hellenistic
[parallel-motif] dumuzi → attis
[parallel-motif] dumuzi → osiris-egyptian
[parallel-motif] dumuzi → zagreus
  claim: All four collected by Frazer under "dying-rising god"; the category's empirical adequacy varies by case (Dumuzi/Tammuz: dying without clear rising in early sources; Adonis: clearer ritual death-revival; Osiris: rejuvenation rather than resurrection in classical Egyptian sense; Zagreus: dismemberment-rebirth in Orphic frame). Mettinger 2001 partially defends the category for Adonis, Melqart, Eshmun; Smith 1990 dismantles the universal version.
  ref: Mettinger, T.N.D. (2001), tier 1
  confidence: case-by-case
```

### Theosophy: the first modern synthesis of Phases 1–4 esoterica

```
[synthesis] phase-7-005-isis-unveiled → tradition-hermeticism
[synthesis] phase-7-005-isis-unveiled → tradition-gnosticism
[synthesis] phase-7-005-isis-unveiled → tradition-vedic-hinduism
[synthesis] phase-7-005-isis-unveiled → tradition-buddhism
[synthesis] phase-7-005-isis-unveiled → tradition-kabbalah
  claim: Blavatsky's 1877 Isis Unveiled and 1888 Secret Doctrine performed the first major modern synthesis of Hermetic, Gnostic, Kabbalistic, Vedic, and Buddhist materials in advance of their academic recovery (Jonas 1958, Yates 1964, Scholem 1941 came later). Theosophy is therefore the cultural channel through which Phases 1–4 esoterica reached late-19th- and 20th-century Western readers, well before philological-academic respectability was established.
  ref: Godwin, J. (1994), The Theosophical Enlightenment, SUNY; Hanegraaff, W.J. (2013), Western Esotericism, Bloomsbury, tier 1
  confidence: consensus (synthesis), contested (philological adequacy of Blavatsky's specific readings)
```

### Jung → alchemy / Gnosticism (Phase 7 reception of Phases 4 and 6)

```
[commentary-on] phase-7-017-psychology-and-alchemy → phase-6-alchemical-corpus
  claim: Jung's Psychology and Alchemy (1944) and Mysterium Coniunctionis (1955) re-read the early-modern alchemical corpus (Dorn, Khunrath, Maier, Mylius, Aurora Consurgens) as projected individuation; substantially established the 20th-century esoteric reception of alchemy. Mainstream history of science (Principe, Newman) has since complicated Jung's reading by restoring alchemy's experimental-chemical dimension.
  ref: Jung, C.G. (1944), Psychology and Alchemy CW 12; Principe, L.M. (2013), The Secrets of Alchemy, Chicago, tier 1
  confidence: majority (Jung's reading dominates esoteric / popular reception); contested by history of science

[commentary-on] phase-7-018-aion → phase-4-002-apocryphon-of-john
  claim: Jung's Aion (1951) extensively engages Sethian Gnostic materials (heresiological reports on Apocryphon-of-John-equivalent texts, and after the 1952 Jung Codex purchase, Codex I directly) as psychological-symbolic systems anticipating his own.
  ref: Jung, C.G. (1951), Aion CW 9.2, tier 1
  confidence: consensus (Jung's engagement); contested (psychological reading's adequacy as history-of-religion)
```

### Eliade → archaic religion (Phase 7 framing of Phases 1–2)

```
[scholarly-category-construction] phase-7-021-patterns-comparative-religion → theme-archaic-religion
  claim: Eliade's Patterns (1949) and Sacred and Profane (1957) established "archaic religious humanity" as the central comparative-religion category for treating Phase 1–2 materials; influential and now contested (Iron Guard biographical issues, J.Z. Smith's and McCutcheon's method-criticism).
  ref: Eliade, M. (1949); Ellwood, R. (1999), The Politics of Myth, SUNY; McCutcheon, R.T. (1997), Manufacturing Religion, Oxford UP, tier 1
  confidence: consensus (influence); contested (validity)
```

### Joseph Smith's restorationism: a Phase-7 thesis about Phases 3–4

```
[claimed-restoration] phase-7-001-book-of-mormon → tradition-christianity-canonical
  claim: The Book of Mormon and the broader LDS restorationist project frame themselves as restoring a pre-apostasy primitive Christianity — a Phase-7 thesis about the Phase-3-and-4 development of Christianity. The historical-comparative position is itself a Phase-7 religious thesis, not a Phase-3-or-4 historical claim.
  ref: Shipps, J. (1985), Mormonism: The Story of a New Religious Tradition, Illinois, tier 1
  confidence: consensus (Mormonism makes this claim); contested (its historical adequacy)
```

### Crowley → Wicca / Satanism (intra-Phase-7 esoteric transmission)

```
[direct-influence] phase-7-008-book-of-the-law → phase-7-024-witchcraft-today
  claim: Gardner met Crowley in 1947; documented liturgical and textual borrowings from Crowleyan sources in early Wiccan rituals (Kelly 1991, Heselton 2000).
  ref: Kelly, A.A. (1991), Crafting the Art of Magic, Llewellyn; Hutton, R. (1999), The Triumph of the Moon, Oxford UP, tier 1-2
  confidence: majority (textual borrowing); contested (extent)

[direct-influence] phase-7-008-book-of-the-law → phase-7-030-satanic-bible
  claim: LaVey acknowledged Crowley as a major influence; the Satanic Bible's Enochian Keys are sourced via Crowley's editions, and the individualist-anti-Christian register is recognizably Crowleyan.
  ref: Dyrendal, A. et al. (2016), The Invention of Satanism, Oxford UP, tier 1
  confidence: consensus
```

### Qutb / Islamism / Iranian Revolution (Phase 7 political-theology cluster)

```
[direct-influence] phase-7-028-milestones → al-qaeda-zawahiri-jihadist-corpus
  claim: Al-Zawahiri's Knights Under the Prophet's Banner (2001) explicitly traces its theological lineage to Qutb; the jihadist *jahiliyyah*-and-offensive-jihad framework is Qutb's contribution generalized.
  ref: Gerges, F.A. (2005), The Far Enemy, Cambridge UP, tier 1
  confidence: consensus

[parallel-development] phase-7-028-milestones → event-iranian-revolution-1979
  claim: Qutb's Sunni-militant project (1964) and Khomeini's Shia vilāyat-i-faqīh political theology (1970 Hukumat-i Islami → 1979 Revolution) are parallel late-20th-century projects of Islamic political theology in their distinct confessional registers; not directly linked but occupying parallel theological-historical positions.
  ref: Keddie, N.R. (2003), Modern Iran, Yale UP; Tibi, B. (2012), Islamism and Islam, Yale UP, tier 1
  confidence: consensus (parallel); not direct-influence
```

### Vivekananda → Western Hindu reception (Phase 7 cross-cultural transmission)

```
[direct-influence] event-parliament-of-world-religions-1893 → tradition-hindu-modernism
[direct-influence] event-parliament-of-world-religions-1893 → tradition-new-age
  claim: Vivekananda's 1893 Chicago Parliament addresses opened the modern Western reception of Hindu philosophy; the Vedanta Society (1894), Yogananda's later mission (1920–1952), the broader yoga-and-Vedanta wave, and the New Age channel for Hindu vocabulary descend from this cultural opening.
  ref: Seager, R.H. (1995), The World's Parliament of Religions, Indiana UP; Halbfass, W. (1988), India and Europe, SUNY, tier 1
  confidence: consensus
```

### Vatican II → Catholic 20th-century reception (Phase 7 intra-Christian)

```
[reform-of] event-second-vatican-council-1962-1965 → tradition-christianity-canonical
  claim: Vatican II (1962–1965) substantially reformed Catholic liturgy, ecclesiology, and inter-religious posture; the most consequential Catholic event of the 20th century.
  ref: O'Malley, J.W. (2008), What Happened at Vatican II, Belknap, tier 1
  confidence: consensus
```

---

## Phase 6 — Early Modern / Renaissance edges (the esoteric revival)

These edges are *retrieval* edges as much as *influence* edges: Phase 6 figures are reading, translating, and reanimating Phase 3–5 material. The retrieval IS the Phase 6 phenomenon.

### Phase 4 → Phase 6: The Hermetica returns to circulation

```
[manuscript-transmission] phase-4-011-corpus-hermeticum-i → phase-6-001-ficino-pimander
  claim: The 1463 Ficino Latin translation of the Greek Corpus Hermeticum (printed Treviso 1471) is a direct manuscript-translation descendant of the Byzantine Greek manuscript that Leonardo da Pistoia brought to Cosimo de' Medici from Macedonia ~1460. The founding act of Renaissance Hermeticism.
  ref: Copenhaver (1992), Hermetica, Cambridge UP, tier 1; Yates (1964), Giordano Bruno and the Hermetic Tradition, Chicago UP, tier 2
  confidence: consensus

[direct-influence] phase-4-012-asclepius → phase-6-001-ficino-pimander
  claim: The Latin Asclepius had continuous medieval Latin transmission; Ficino incorporated it into the Hermetic canon he was constructing alongside the newly translated Corpus Hermeticum.
  ref: Copenhaver (1992); Fowden (1986), The Egyptian Hermes, Cambridge UP, tier 1
  confidence: consensus

[direct-influence] phase-6-001-ficino-pimander → phase-6-003-pico-oration-900-conclusions
  claim: Pico read Ficino's Pimander in his teens and incorporated Hermetic theses (Hermes Trismegistus, the dignity of man, magical-Hermetic claims) directly into his 1486 syncretist program.
  ref: Farmer (1998), Syncretism in the West, MRTS, tier 1; Copenhaver (2019), Magic and the Dignity of Man, Harvard UP, tier 1
  confidence: consensus

[direct-influence] phase-6-001-ficino-pimander → phase-6-014-bruno-de-la-causa-eroici-furori
  claim: Bruno's radical Hermetic pantheism extends and transforms Ficino's more cautious Christian Hermeticism. Bruno is the radicalization of the Ficinian Hermetic project.
  ref: Yates (1964); Rowland (2008), Giordano Bruno: Philosopher / Heretic, FSG, tier 2
  confidence: majority
```

### Phase 3-4 → Phase 6: Plato and Plotinus revived

```
[direct-revival] phase-3-002-plato-dialogues → phase-6-002-ficino-theologia-platonica
  claim: Ficino's complete Latin Plato (1484) and his Christian-Platonic Theologia Platonica (1474, printed 1482) are the founding moment of Renaissance Platonism. The entire Plato corpus reaches Christian Europe in full for the first time.
  ref: Hankins (1990), Plato in the Italian Renaissance, Brill, 2 vols., tier 1; Allen & Rees (eds.) (2002), Marsilio Ficino, Brill, tier 1
  confidence: consensus

[direct-revival] phase-4-019-plotinus-enneads → phase-6-002-ficino-theologia-platonica
  claim: Ficino's Latin Plotinus (1492) is the second great Renaissance retrieval after the Pimander; the Theologia Platonica presupposes Plotinian metaphysics.
  ref: Hankins (1990); Kristeller (1943), The Philosophy of Marsilio Ficino, Columbia UP, tier 1
  confidence: consensus

[direct-influence] phase-4-019-plotinus-enneads → phase-6-014-bruno-de-la-causa-eroici-furori
  claim: Bruno's metaphysics of the One as immanent in all is a radical Plotinian pantheism. Bruno repeatedly invokes Plotinus.
  ref: Gatti (1999), Giordano Bruno and Renaissance Science, Cornell UP, tier 1; Ricci (2000), Bruno e l'ermetismo, Salerno
  confidence: consensus
```

### Phase 5 → Phase 6: Kabbalah enters Christian Latin discourse

```
[manuscript-transmission] zohar (Phase 5) → phase-6-003-pico-oration-900-conclusions
  claim: Pico's Kabbalistic theses depend on Flavius Mithridates' 1486 Latin translations of Zoharic, Sefer Yetzirah, Bahir, and Recanati materials, prepared specifically for Pico. The founding moment of Christian Kabbalah.
  ref: Wirszubski (1989), Pico della Mirandola's Encounter with Jewish Mysticism, Harvard UP, tier 1; Idel (2007), Kabbalah in Italy 1280–1510, Yale UP, tier 1
  confidence: consensus

[direct-influence] phase-6-003-pico-oration-900-conclusions → phase-6-006-reuchlin-de-arte-cabalistica
  claim: Reuchlin explicitly acknowledges Pico as the founder of Christian Kabbalah; De Arte Cabalistica systematizes Pico's programmatic Kabbalist theses.
  ref: Wirszubski (1989); Burnett (2012), Christian Hebraism in the Reformation Era, Brill, tier 1
  confidence: consensus

[direct-influence] phase-6-006-reuchlin-de-arte-cabalistica → phase-6-009-agrippa-de-occulta-philosophia
  claim: Agrippa's Book III ceremonial magic is essentially Reuchlin's Christian Kabbalah operationalized for magical practice.
  ref: Nauert (1965), Cornelius Agrippa, Illinois UP, tier 1; Yates (1964)
  confidence: consensus
```

### 1492 expulsion → Lurianic Kabbalah (Scholem's central thesis)

```
[historical-context] event-jewish-expulsion-spain-1492 → phase-6-015-luria-vital-etz-chayyim
  claim: Scholem's central thesis: the Sephardic experience of the 1492 expulsion provided the theological-experiential matrix out of which Lurianic Kabbalah (tzimtzum / shevirat ha-kelim / tikkun) emerged at Safed 1570–1572. The cosmos itself in exile; redemption as tikkun. Idel and others have complicated the directness while accepting the broad framing.
  ref: Scholem (1941), Major Trends in Jewish Mysticism, Schocken, Lecture VII, tier 1; Fine (2003), Physician of the Soul, Stanford UP, tier 1; Idel (1988), Kabbalah: New Perspectives, Yale UP, tier 1 (critical refinement)
  confidence: majority

[direct-influence] phase-6-011-cordovero-pardes-rimmonim → phase-6-015-luria-vital-etz-chayyim
  claim: Cordovero's 1548 systematic Kabbalah provides the framework against which Luria's mythological-cosmogonic radicalization (tzimtzum, breaking, restoration, partsufim) develops. Luria briefly studied with Cordovero in 1569–1570.
  ref: Fine (2003); Sack (1995), Studies in the Kabbalah of Moses Cordovero (Hebrew), Ben-Gurion UP, tier 1
  confidence: consensus
```

### Lurianic → Sabbatean → Frankist (the heterodox descendant chain)

```
[direct-influence] phase-6-015-luria-vital-etz-chayyim → phase-6-025-nathan-of-gaza-treatise-on-dragons
  claim: Nathan of Gaza's theological apparatus reading Shabbatai Tzvi's biography as redemptive descent into the kelippot is a Lurianic-Kabbalistic reading taken to a heterodox conclusion. Without Luria, no Nathan.
  ref: Scholem (1973), Sabbatai Sevi, Princeton UP, tier 1; Liebes (1993), Studies in the Zohar, SUNY, tier 1
  confidence: consensus

[direct-influence] phase-6-025-nathan-of-gaza-treatise-on-dragons → jacob-frank (Words of the Lord, ~1750)
  claim: Frankist antinomian theology is the most extreme descendant of Sabbatean theology; Frank explicitly continued Shabbatai's claimed succession. "Redemption through sin" (Scholem) reaches its endpoint in Frank.
  ref: Maciejko (2011), The Mixed Multitude, Penn UP, tier 1; Scholem (1971), "Redemption Through Sin," in The Messianic Idea in Judaism, Schocken, tier 1
  confidence: consensus
```

### Casaubon: the demarcation event

```
[demarcation] event-casaubon-redates-hermetica-1614 → phase-4-011-corpus-hermeticum-i
  claim: Casaubon's 1614 De rebus sacris philological demonstration redated the Corpus Hermeticum from pre-Mosaic primordial revelation to Hellenistic late-antique composition, demolishing the foundation of the Renaissance Hermetic project. The texts continued to be read but as historical-religious documents rather than as primordial revelation.
  ref: Grafton & Weinberg (2011), Isaac Casaubon, Harvard UP, tier 1; Yates (1964), Giordano Bruno and the Hermetic Tradition, Chicago UP, tier 2
  confidence: consensus

[rear-guard-defense] event-casaubon-redates-hermetica-1614 → phase-6-024-kircher-oedipus-aegyptiacus
  claim: Kircher's 1652–1654 Oedipus Aegyptiacus is the principal post-Casaubon attempt to maintain the prisca-theologia and Hermes-Trismegistus-as-ancient-Egyptian-sage framework. Yates' classic framing treats it as the last great Renaissance rear-guard.
  ref: Yates (1964); Stolzenberg (2013), Egyptian Oedipus, Chicago UP, tier 1
  confidence: majority
```

### Renaissance magic → Rosicrucianism → Freemasonry

```
[direct-influence] phase-6-009-agrippa-de-occulta-philosophia → phase-6-012-dee-monas-hieroglyphica
  claim: Dee's library inventoried multiple Agrippa volumes; the three-worlds magical schema and the Hermetic-Kabbalist synthesis underlie the Monas.
  ref: Clulee (1988), John Dee's Natural Philosophy, Routledge, tier 1; French (1972), John Dee, RKP, tier 2
  confidence: consensus

[direct-influence] phase-6-012-dee-monas-hieroglyphica → phase-6-018-rosicrucian-manifestos
  claim: Yates' thesis: Dee's continental tour 1583–1589 (especially in Bohemia) seeded the Tübingen-circle milieu that produced the Rosicrucian manifestos. The thesis is contested by Gilly and current scholarship but remains a major framework.
  ref: Yates (1972), The Rosicrucian Enlightenment, RKP, tier 2; Gilly (1995), Cimelia Rhodostaurotica, In de Pelikaan, tier 1 (critical refinement)
  confidence: minority (direct); majority (broader milieu connection)

[direct-influence] phase-6-008-paracelsus-corpus → phase-6-017-boehme-aurora-mysterium-magnum
  claim: Boehme's three-principles theosophy (Sulphur, Mercury, Salt) and his doctrine of signatures are taken from Paracelsus and reworked theologically.
  ref: Weeks (1991), Boehme, SUNY, tier 1; O'Regan (2002), Gnostic Apocalypse, SUNY, tier 1
  confidence: consensus

[direct-influence] phase-6-008-paracelsus-corpus → phase-6-018-rosicrucian-manifestos
  claim: Paracelsian medicine and natural philosophy are at the doctrinal core of the Rosicrucian manifestos; the universal-reformation program is partly the Paracelsian Theophrastia Sancta institutionalized.
  ref: Gilly (1995); Webster (2008), Paracelsus, Yale UP, tier 1
  confidence: consensus

[indirect-influence] phase-6-018-rosicrucian-manifestos → phase-6-026-anderson-constitutions-free-masons
  claim: 18th-century speculative Freemasonry inherits Rosicrucian initiatory tropes (especially in higher-degree systems — Scottish Rite, Rectified Scottish Rite). Yates argues for substantial influence; Stevenson emphasizes Scottish operative continuity. Both currents contribute.
  ref: Yates (1972); Stevenson (1988), The Origins of Freemasonry, Cambridge UP, tier 1 (counter-position); McIntosh (1992), The Rose Cross and the Age of Reason, Brill, tier 1
  confidence: contested (Yates direct) / majority (broader influence on higher-degree systems)
```

### Reformation theological texts

```
[direct-influence] augustine anti-Pelagian writings (Phase 4) → phase-6-005-luther-95-theses + phase-6-007-luther-bondage-of-will
  claim: Luther's grace-and-bondage theology is explicitly Augustinian-Pauline; De Servo Arbitrio is dense with Augustinian citation.
  ref: Brecht (1985–1993), Martin Luther, 3 vols., Fortress, tier 1; McGrath (2005), Iustitia Dei, Cambridge UP, tier 1
  confidence: consensus

[direct-influence] phase-6-005-luther-95-theses → phase-6-010-calvin-institutes
  claim: Calvin's Reformed system builds on Luther's justification doctrine while diverging on the Eucharist (Calvin's spiritual presence vs. Luther's real presence) and ecclesiology (Reformed presbyterian-synodal vs. Lutheran consistorial).
  ref: Bouwsma (1988), John Calvin, Oxford UP, tier 1; McGrath (2005)
  confidence: consensus

[direct-response] phase-6-005-luther-95-theses → event-council-of-trent-1545-1563
  claim: Trent's Session VI (1547) decree on justification responds directly to Lutheran-Calvinist soteriology. The Council's doctrinal mandate was specifically to define Catholic doctrine against Protestant positions.
  ref: Jedin (1957–1961), History of the Council of Trent, Nelson, tier 1; O'Malley (2013), Trent, Harvard UP, tier 1
  confidence: consensus
```

### Sikh, Bhakti, Sufi consolidation

```
[direct-incorporation] Sant tradition (Kabir, Ravidas, Namdev — Phase 5/6) → phase-6-016-guru-granth-sahib
  claim: Sikh scripture incorporates *bhagat bani* of fifteen pre-Sikh sants and Sufis including Kabir, Ravidas, Namdev, and Sheikh Farid. The Adi Granth is a Sant-tradition anthology with the Sikh Gurus' compositions at its core.
  ref: Mann (2001), The Making of Sikh Scripture, Oxford UP, tier 1; Hawley (2015), A Storm of Songs, Harvard UP, tier 1
  confidence: consensus

[vernacular-retelling] phase-2-017-mahabharata-ramayana-oral-layers (Valmiki Ramayana stratum) → phase-6-019-tulsidas-ramcharitmanas
  claim: Tulsidas's Awadhi Ramcharitmanas is structurally a translation-into-vernacular of Valmiki's Sanskrit, but theologically transformed by bhakti reframing: Tulsi's Rama is unambiguously Vishnu's avatara and the entire epic is constructed as devotional aid.
  ref: Lutgendorf (1991), The Life of a Text, UC Press, tier 1
  confidence: consensus

[direct-influence] Ibn 'Arabi (Phase 5) → phase-6-023-mulla-sadra-asfar
  claim: Mulla Sadra's metaphysics integrates Ibn 'Arabi's wahdat al-wujūd (with modifications via the tashkīk doctrine) into his Transcendent Philosophy.
  ref: Nasr (1978), The Transcendent Theosophy of Sadr al-Din Shirazi, tier 1; Rizvi (2009), Mulla Sadra, Oxford UP, tier 1
  confidence: consensus

[direct-influence] Ahmad Sirhindi (Phase 6 early) → phase-6-028-shah-wali-allah-hujjat-allah
  claim: Shah Wali Allah's Naqshbandi-Mujaddidi tradition descends from Sirhindi's wahdat al-shuhūd; Shah Wali Allah's distinctive contribution is the mediation of Sirhindi's position with Ibn 'Arabi's wahdat al-wujūd.
  ref: Rizvi (1980), Shah Wali Allah and His Times, Ma'rifat, tier 1
  confidence: consensus
```

### Phase 6 → Phase 7 forward edges (flag for Phase 7 agent)

```
[direct-influence] phase-6-017-boehme-aurora-mysterium-magnum → German Idealism (Hegel, Schelling)
  claim: Hegel calls Böhme "the first German philosopher" in his Lectures on the History of Philosophy; the Boehmian dialectic of divine self-othering is a prototype for the Hegelian dialectic. Schelling's late Weltalter and Philosophie der Offenbarung are extended Boehmian engagements.
  ref: Magee (2001), Hegel and the Hermetic Tradition, Cornell UP, tier 1; O'Regan (2002), Gnostic Apocalypse, SUNY, tier 1
  confidence: majority (Magee); cautious (mainstream Hegel scholarship)

[direct-influence] phase-6-027-swedenborg-arcana-heaven-and-hell → William Blake / Emerson / modern Spiritualism
  claim: Swedenborgian materials enter 19th-century English and American literature (Blake's Marriage of Heaven and Hell, Emerson's Representative Men) and culture (the Church of the New Jerusalem 1787+; modern Spiritualism's afterlife cosmography draws on Swedenborg's accounts).
  ref: Bergquist (2005), Emanuel Swedenborg, Swedenborg Foundation, tier 1
  confidence: consensus

[direct-influence] phase-6-008-paracelsus-corpus / phase-6-021-andreae-chymical-wedding → C.G. Jung
  claim: Jung's Paracelsica, Psychology and Alchemy, and Mysterium Coniunctionis draw heavily on Paracelsus and on the Chymical Wedding as paradigm of alchemical individuation.
  ref: Jung CW 12, 13, 14; Magee (2001)
  confidence: consensus

[direct-influence] phase-6-009-agrippa-de-occulta-philosophia → 19th-c. occult revival (Lévi, Mathers, Golden Dawn)
  claim: Agrippa is the textbook source for the 19th-century Western occult revival; the Golden Dawn's magical system in particular descends directly from Agrippa via Eliphas Lévi.
  ref: Yates (1964); Hanegraaff, W.J. (2012), Esotericism and the Academy, Cambridge UP, tier 1
  confidence: consensus
```

---

## Phase 5 — Medieval (~700 – 1500 CE) edges

### Bogomil/Cathar dualism ↔ Manichaeism — the foundational medieval comparative-religion question

```
[direct-influence?] phase-4-014-cologne-mani-codex → phase-5-020-interrogatio-iohannis
[direct-influence?] phase-4-015-kephalaia-of-the-teacher → phase-5-023-liber-de-duobus-principiis
  claim: Bogomil and Cathar dualist cosmology (two principles, demiurge-of-matter, docetic Christology, anti-OT, ascetic-perfecti structure) is sufficiently close to Manichaean cosmology that medieval polemicists labeled the heretics "Manichaeans"; modern scholarship is split between (a) genuine transmission via Paulicians → Bogomils → Cathars (Stoyanov 2000, Hamilton 1979, Obolensky 1948, Loos 1974) and (b) independent emergence from radical readings of the NT plus Marcionite-style OT critique (Moore 2012, Pegg 2008).
  ref: Stoyanov, Y. (2000), The Other God, Yale UP, tier 1; Moore, R.I. (2012), The War on Heresy, Belknap, tier 1; Hamilton, B. (1979), Dissent and Reform in the Early Middle Ages, Variorum, tier 1
  confidence: contested

[parallel-motif] phase-4-002-apocryphon-of-john → phase-5-020-interrogatio-iohannis
  claim: Both are Johannine revelation-dialogues in which Jesus discloses a dualist cosmogony involving a demiurge / fallen-creator and the entrapment of spiritual beings in material reality. Structural parallel; direct transmission unproven and contested as above.
  ref: Stoyanov (2000); Lambert (1998), The Cathars, Blackwell, tier 1
  confidence: structural parallel (consensus); historical transmission (contested)

[direct-influence] phase-5-020-interrogatio-iohannis → phase-5-023-liber-de-duobus-principiis
  claim: The Liber's scholastic systematic theology presupposes and elaborates the cosmological narrative of the Interrogatio; the Albanense absolute-dualist position represents a further development from the mitigated-dualist Bogomil-Concorezzan position.
  ref: Dondaine (1939); Wakefield & Evans (1969), Heresies of the High Middle Ages, Columbia, tier 1
  confidence: consensus
```

### Vedanta debate triangle — Shankara vs. Ramanuja vs. Madhva

```
[polemic-against] phase-5-016-ramanuja-sribhasya → phase-5-005-shankara-brahma-sutra-bhasya
  claim: Ramanuja's Śrībhāṣya (~1100) is composed explicitly to refute Śaṅkara's Advaita reading of the same Brahmasūtra. The polemic is sustained throughout; the two commentaries can be read in parallel as the foundational Vedānta dispute.
  ref: Lipner (1986), Rāmānuja in Hindu Tradition, Macmillan, tier 1; Carman (1974), Rāmānuja's Theology of the Living Self, Yale UP, tier 1
  confidence: consensus

[polemic-against] phase-5-022-madhva-brahma-sutra-bhasya → phase-5-005-shankara-brahma-sutra-bhasya
  claim: Madhva's commentary (~1240) refutes Śaṅkara as crypto-Buddhist nihilism dressed in Vedāntic vocabulary. The "pracchanna-bauddha" charge crystallizes here.
  ref: Sharma, B.N.K. (1986), Madhva's Interpretation of the Brahma Sutras, Motilal, tier 1
  confidence: consensus

[polemic-against] phase-5-022-madhva-brahma-sutra-bhasya → phase-5-016-ramanuja-sribhasya
  claim: Madhva refutes Ramanuja's Viśiṣṭādvaita for being a half-measure that fails to acknowledge the irreducible reality of difference. The five-eternal-differences doctrine is positioned against both monist and qualified-monist Vedānta.
  ref: Sharma (1986); Sharma (2000), History of the Dvaita School, Motilal, tier 1
  confidence: consensus
```

### Sufi ↔ Neoplatonism — the Arabic Plotinus channel

```
[direct-influence] phase-4-019-plotinus-enneads → phase-5-011-rasail-ikhwan-al-safa
  claim: Via the 9th-c. Arabic Theology of Aristotle (an Arabic paraphrase of Plotinus Enneads IV–VI attributed to Aristotle), Plotinian metaphysics enters Islamic intellectual culture; the Rasāʾil Ikhwān al-Ṣafāʾ is a Plotinian-Procline emanationist encyclopedia in Islamic clothing.
  ref: D'Ancona (2017), "The Origins of Islamic Philosophy" in Cambridge History of Philosophy in Late Antiquity, CUP; Adamson, P. (2002), The Arabic Plotinus, Duckworth, tier 1
  confidence: consensus

[direct-influence] phase-4-021-proclus-elements-of-theology → phase-5-011-rasail-ikhwan-al-safa
  claim: Via the Arabic Liber de Causis / Kalām fī Maḥḍ al-Khayr (an Arabic Procline epitome attributed to Aristotle), Procline emanationist axiomatic theology enters Islamic and (later) Latin Christian discourse.
  ref: D'Ancona, C. (1995), Recherches sur le Liber de Causis, Vrin, tier 1
  confidence: consensus

[direct-influence] phase-4-019-plotinus-enneads → phase-5-018-suhrawardi-hikmat-al-ishraq
  claim: Suhrawardī's Illuminationism is structurally Plotinian — graded chain of lights descending from the Light of Lights, with Avicennan modifications. The Plotinian One becomes the Nūr al-Anwār.
  ref: Walbridge, J. (2000), The Leaven of the Ancients, SUNY, tier 1
  confidence: consensus

[direct-influence] phase-4-019-plotinus-enneads → phase-5-021-ibn-arabi-fusus-al-hikam
  claim: Ibn ʿArabī's waḥdat al-wujūd is structurally a Plotinian emanationist-self-disclosure metaphysics in radically Islamic-mystical vocabulary; the One's self-knowing externalized as cosmos is recognizably Plotinian.
  ref: Knysh (1999), Ibn ʿArabī in the Later Islamic Tradition, SUNY, tier 1; Chittick (1989), Ibn al-ʿArabī's Metaphysics of Imagination, SUNY, tier 1
  confidence: majority
```

### Zoroastrian revival inside Islamic philosophy — Suhrawardi's invocation

```
[direct-influence] phase-2-002-gathas-of-zarathustra → phase-5-018-suhrawardi-hikmat-al-ishraq
  claim: Suhrawardī explicitly identifies his Light of Lights with Zoroastrian Ohrmazd, the supernal light-orders with Amesha Spentas, and uses Pahlavi-Iranian sage-prophet names (Kayūmarth, Jāmāsp) as authorities. The most explicit medieval-Islamic revival of Zoroastrian metaphysical vocabulary.
  ref: Corbin, H. (1971), En Islam Iranien, vol. 2, Gallimard, tier 1; Walbridge (2000)
  confidence: consensus
```

### Kabbalah ↔ Gnostic emanationism — Scholem's contested thesis

```
[scholarly-parallel] phase-4-002-apocryphon-of-john → phase-5-027-sefer-ha-zohar
  claim: Scholem (1941, 1962) argued the Zohar's sefirotic emanationism — and especially the Tiferet-Shekhinah sacred-marriage drama — shows structural parallels with Sethian Gnostic Sophia myths sufficient to suggest historical transmission across centuries via unrecovered channels. Idel (1988) substantially complicates this, arguing the Bahir's and Zohar's features can be derived from older Hekhalot and rabbinic-aggadic materials.
  ref: Scholem, G. (1941), Major Trends in Jewish Mysticism, Schocken, Lectures 5–6; Scholem (1962/1987), Origins of the Kabbalah, JPS / Princeton, tier 1; Idel, M. (1988), Kabbalah: New Perspectives, Yale UP, tier 1
  confidence: contested (Scholem affirmative, Idel skeptical; both serious scholars)

[scholarly-parallel] sophia-gnostic → shekhinah
  claim: The hypostatic-feminine-in-tragic-separation pattern (Sophia's fall, Shekhinah's exile) is the single strongest comparative data point in the Scholem-Idel debate.
  ref: Scholem (1941); Wolfson, E.R. (1994), Through a Speculum that Shines, Princeton UP, tier 1
  confidence: structural parallel (consensus); historical transmission (contested)

[direct-influence] phase-5-012-sefer-yetzirah → phase-5-026-sefer-ha-bahir → phase-5-027-sefer-ha-zohar
  claim: The principal medieval-Kabbalistic textual chain. Sefer Yetzirah's sefirot (originally primordial dimensions) are reinterpreted in the Bahir as divine emanations; the Zohar systematizes the configuration as the ten-sefirot tree.
  ref: Scholem (1962/1987); Idel (1988); Matt, D.C. (2003–2017), The Zohar: Pritzker Edition, Stanford UP, tier 1
  confidence: consensus
```

### Christian Neoplatonic chain: Dionysius → Maximus → Eriugena → Eckhart → Cusa

```
[direct-influence] phase-4-030-pseudo-dionysius → phase-5-003-maximus-confessor-ambigua
  claim: Maximus's Ambigua are explicitly commentaries on difficult passages of Pseudo-Dionysius; Maximus is the Chalcedonian "normalizer" of Dionysian apophaticism for orthodox reception.
  ref: Louth (1996), Maximus the Confessor, Routledge, tier 1; Constas (2014), On Difficulties in the Church Fathers, Harvard UP / DOML, tier 1
  confidence: consensus

[manuscript-transmission] phase-4-030-pseudo-dionysius → phase-5-008-eriugena-periphyseon
[manuscript-transmission] phase-5-003-maximus-confessor-ambigua → phase-5-008-eriugena-periphyseon
  claim: Eriugena's Latin translations of Pseudo-Dionysius (~860–862) and Maximus (~862–864) are the decisive transmission events bringing Greek apophatic theology into the Latin West; the Periphyseon is the systematic Latin theology those translations make possible.
  ref: Moran (1989), Eriugena, CUP, tier 1; McGinn & Otten (1994), Eriugena: East and West, Notre Dame, tier 1
  confidence: consensus

[direct-influence] phase-5-008-eriugena-periphyseon → phase-5-028-meister-eckhart-sermons
  claim: Eckhart inherits Eriugena's hyper-apophatic vocabulary; both face ecclesiastical condemnation along the same metaphysical fault line (apparent pantheist tendency in radical apophaticism). The Eriugena → Eckhart line is the principal Latin Christian Neoplatonic transmission.
  ref: McGinn (2001), The Mystical Thought of Meister Eckhart, Crossroad, tier 1; Moran (1989)
  confidence: consensus

[direct-influence] phase-5-003-maximus-confessor-ambigua → phase-5-030-palamas-triads
  claim: Maximus's distinction between God's essence and the divine logoi / energeiai is the conceptual ancestor of the Palamite essence/energies distinction. The Maximian-Palamite line is the Eastern Orthodox theological backbone.
  ref: Meyendorff (1959/1998), A Study of Gregory Palamas, SVS Press, tier 1
  confidence: consensus
```

### Maimonides → Aquinas — Jewish-Christian scholastic transmission

```
[direct-influence] phase-5-019-maimonides-guide-for-the-perplexed → phase-5-024-aquinas-summa-theologiae
  claim: Aquinas cites Maimonides ("Rabbi Moyses") repeatedly in the Summa, especially on divine attributes (negative theology) and on creation in time. The Maimonidean negative-theology pages of the Prima Pars are unintelligible without the Guide.
  ref: Burrell (1986), Knowing the Unknowable God: Ibn Sina, Maimonides, Aquinas, Notre Dame UP, tier 1
  confidence: consensus

[direct-influence] phase-5-015-al-ghazali-ihya / Avicenna → phase-5-019-maimonides-guide-for-the-perplexed
  claim: Maimonides operates within the Avicennan-Ghazālian Islamic philosophical horizon; the Guide's faculty psychology and metaphysics presuppose Avicennan apparatus, and Ghazālī's relationship to philosophy is part of the methodological backdrop.
  ref: Pines, S. (1979), "The Philosophic Sources of the Guide of the Perplexed," in Pines & Yovel, Maimonides and Philosophy, tier 1
  confidence: consensus
```

### Arabic-Latin translation movement — Cordoba and Toledo

```
[manuscript-transmission] phase-3-003-aristotle-metaphysics → phase-5-024-aquinas-summa-theologiae
  claim: The Aristotelian corpus reached Latin Europe through two channels: (1) Arabic-Latin translations via Cordoba and especially the 12th-c. Toledo school of translators (Gerard of Cremona and others); (2) Direct Greek-Latin translations by William of Moerbeke OP (~1260–1270), commissioned in part by Aquinas. The double channel is reflected in Aquinas's commentary work.
  ref: Burnett, C. (2001), "The Coherence of the Arabic-Latin Translation Programme in Toledo," Science in Context 14, tier 1
  confidence: consensus

[manuscript-transmission] Avicenna's Shifāʾ / Najāt → Latin scholasticism
  claim: Avicennan philosophy entered Latin scholasticism via 12th-c. Toledo translations (Gundisalvi, Dominicus Gundissalinus). The essence-existence distinction crucial to Aquinas is Avicennan in origin.
  ref: Hasse, D.N. (2014), Avicenna's De Anima in the Latin West, Warburg, tier 1
  confidence: consensus
```

### Heart Sutra → Chan/Zen pedagogy

```
[direct-influence] phase-5-002-heart-sutra → phase-5-004-platform-sutra-huineng
  claim: The Heart Sutra's negation-chain pedagogy is structurally the same operation as Huineng's "no tree, no mirror, no dust" verse — the abandonment of conceptual purchase as the awakening event. Chan / Zen liturgy chants the Heart Sutra daily.
  ref: Nattier (1992), "The Heart Sūtra: A Chinese Apocryphal Text?", JIABS 15.2; Yampolsky (1967), The Platform Sutra of the Sixth Patriarch, Columbia, tier 1
  confidence: consensus
```

### Tantric Buddhism ↔ Kashmir Shaivism — the "Śaiva Age" controversy

```
[direct-influence?] phase-5-014-abhinavagupta-tantraloka → Vajrayāna Tantric corpus
  claim: Sanderson's controversial thesis ("The Śaiva Age", 2009): Buddhist Vajrayāna systematically appropriated Śaiva Tantric ritual technology, with Buddhist tantric maṇḍalas, deity yoga, and ritual frameworks being downstream of Śaiva originals. Davidson 2002 contests this, arguing for more substantial Buddhist autonomous development.
  ref: Sanderson, A. (2009), "The Śaiva Age" in Einoo (ed.), Genesis and Development of Tantrism, Tokyo, tier 1; Davidson, R.M. (2002), Indian Esoteric Buddhism, Columbia UP, tier 1
  confidence: contested
```

### Vedanta and Buddhist crypto-influence — the pracchanna-bauddha charge

```
[scholarly-parallel] Nāgārjuna's Madhyamaka → phase-5-005-shankara-brahma-sutra-bhasya
  claim: Bhattacharya (1925), Ingalls, Hacker, and Halbfass have all argued — in varying degrees — that Śaṅkara's Advaita Vedānta apparatus (māyā doctrine, two-truths method, negative-dialectical method) shows substantial methodological debt to Buddhist Madhyamaka. Madhva polemicizes against Śaṅkara as "pracchanna-bauddha" (crypto-Buddhist).
  ref: Bhattacharya, V. (1925), The Āgamaśāstra of Gauḍapāda, Calcutta UP; Halbfass, W. (1991), Tradition and Reflection, SUNY, tier 1
  confidence: majority (substantial methodological borrowing); contested (degree)
```

---

## How to add an edge

1. Identify two existing nodes (create stubs if needed).
2. Add an entry above with all five fields.
3. Update both endpoint nodes' YAML (`influenced-by` / `influences` / `parallels`).
4. Add a Connections bullet to each endpoint node's body.

The edges marked **fringe** are kept for completeness (per source-integrity policy Tier 4) — labeled, not deleted.

---

## Phase 8 — Non-Western Traditional & Indigenous edges

### Trans-Atlantic Afro-diasporic chain

```
[manuscript-transmission (oral)] phase-8-007-ifa-divination-corpus → phase-8-016-haitian-vodou-liturgical-tradition
  claim: Haitian Vodou's Rada nasyon preserves Dahomean-Fon-Yoruba liturgical material transmitted via the Middle Passage; many of the Rada lwa are recognizably the West African orishas and Fon vodun reconfigured in Saint-Domingue context.
  ref: Métraux (1959), Le Vaudou haïtien; Thompson (1983), Flash of the Spirit; Desmangles (1992), tier 1
  confidence: established

[manuscript-transmission (oral)] phase-8-007-ifa-divination-corpus → phase-8-017-santeria-lucumi
  claim: Cuban Lukumí/Santería is the closest Caribbean diaspora preservation of Yoruba liturgy; the Dilogún (sixteen-cowries) oracle is a Santería-modified version of Yoruba divinatory practice; ongoing 1980s+ trans-Atlantic priesthood exchange.
  ref: Brandon (1993), The Dead Sell Memories; Mason (1996); Bascom (1980), tier 1
  confidence: established

[parallel-motif] phase-8-016-haitian-vodou-liturgical-tradition ↔ phase-8-017-santeria-lucumi
  claim: sister Caribbean African-diasporic syncretic religions; different substrate proportions (Vodou: Fon-Yoruba-Kongo; Santería: predominantly Yoruba); structurally analogous Catholic-saint syncretic systems.
  ref: Brandon (1993); Palmié (2002), tier 1
  confidence: established
```

### Catholic-saint syncretism in Afro-diasporic religions

```
[folk-syncretism] obatala → Our Lady of Mercy (Las Mercedes)
[folk-syncretism] oshun → Our Lady of Charity of El Cobre (Cuba's patroness)
[folk-syncretism] shango → Saint Barbara
[folk-syncretism] yemoja → Our Lady of Regla
[folk-syncretism] ogun → Saint Peter / Saint James (Santiago)
[folk-syncretism] eshu → Holy Child of Atocha / Saint Anthony
[folk-syncretism] oya → Our Lady of Candelaria
[folk-syncretism] papa-legba → Saint Peter / Saint Lazarus
[folk-syncretism] damballa → Saint Patrick
[folk-syncretism] erzulie-dantor → Our Lady of Czestochowa (Black Madonna)
[folk-syncretism] erzulie-freda → Mater Dolorosa
[folk-syncretism] baron-samedi → Saint Martin de Porres / Saint Gerard / Saint Expedite
  claim: each African-diasporic spirit-deity is paired with a Catholic saint in operational syncretism; the pairings are theologically internalized (not mere camouflage of suppressed African religion); regional variation in specific pairings.
  ref: Brandon (1993); Murphy (1988); McAlister (2002); Desmangles (1992), tier 1
  confidence: established
```

### Quetzalcoatl ↔ Christ syncretism

```
[folk-syncretism] quetzalcoatl → Christ (colonial Mexican)
  claim: 16th-c. Spanish missionaries (Sahagún, Durán) and Indigenous-Christian writers (Ixtlilxóchitl) identified Quetzalcoatl with St. Thomas the Apostle or with Christ — beard, eastward-departure-and-return promise, teaching of civilization. The identification served colonial purposes (proving Christianity always present in Mexico) but was theologically genuine for some colonial Mexican Christians.
  ref: Lafaye (1976), Quetzalcoatl and Guadalupe; Carrasco (1982), tier 1
  confidence: established

[folk-syncretism] coatlicue → Tonantzin → Our Lady of Guadalupe
  claim: the 1531 Tepeyac apparition (Juan Diego, Virgin of Guadalupe) is reported at the site of a Tonantzin (or Coatlicue) temple; the Guadalupe-Tonantzin identification is the deepest Mexican Catholic-Mesoamerican syncretism.
  ref: Lafaye (1976); Brading (2001), Mexican Phoenix, tier 1
  confidence: established (with some scholarly debate on Tonantzin = Coatlicue specifically)
```

### Cortés-as-Quetzalcoatl (deconstructed)

```
[claim: deconstructed] phase-8-004-florentine-codex-sahagun → "Cortés-as-returning-Quetzalcoatl"
  claim: the post-conquest narrative that Moctezuma II identified Cortés with the returning Quetzalcoatl, taken as historical fact since the 16th c., has been substantially deconstructed by current scholarship (Lockhart 1993; Restall 2003; Townsend 2003) as a post-conquest construction imposed by both Spanish and Indigenous chroniclers to make sense of the conquest. The actual pre-conquest Quetzalcoatl-return prophecy is much less prominent in genuinely pre-conquest sources.
  ref: Lockhart (1993), We People Here; Restall (2003), Seven Myths of the Spanish Conquest; Townsend (2003), "Burying the White Gods" AHR 108, tier 1
  confidence: established (the deconstruction)
```

### Kebra Nagast → Rastafari

```
[manuscript-transmission (theological)] phase-8-008-kebra-nagast → tradition-rastafari
  claim: the Rastafarian identification of Haile Selassie I as messianic Black King draws directly on his Solomonic-dynasty claim, theologically grounded in the Kebra Nagast's Solomon-Sheba-Menelik genealogy. Marcus Garvey's prophecy ("Look to Africa for the crowning of a Black King") combined with Selassie's 1930 coronation produced the founding moment of Rastafari.
  ref: Chevannes (1994), Rastafari: Roots and Ideology; Edmonds (2003), tier 1
  confidence: established
```

### Phase-7 → Phase-8 misappropriation flags

```
[polemic-against / phase-7-misappropriation] tradition-mormonism → tradition-mesoamerican / tradition-inca-andean
  claim: the Book of Mormon (1830) claims pre-Columbian American peoples descend from a lost Israelite tribe ("Lamanites"); this Phase-7 NRM thesis is substantially disconfirmed by archaeological and genetic evidence and is treated by Indigenous scholars as religious appropriation of Indigenous American identity.
  ref: Givens (2002), By the Hand of Mormon (defensive); Murphy (2003), DNA-and-Book-of-Mormon critique, tier 2
  confidence: majority (DNA disconfirmation); contested within Mormon scholarship
```

```
[phase-7-misappropriation] tradition-theosophy → tradition-australian-aboriginal / tradition-mesoamerican / tradition-inca-andean
  claim: Blavatsky's *Secret Doctrine* (1888) constructs a pseudo-scientific racial-religion synthesis appropriating Indigenous religious materials worldwide (Atlanteans, Lemurians, "root races"); modern New Age and Hancock-style pseudoarchaeology continues this pattern with Aboriginal religion ("songlines as memory of lost civilizations") and Indigenous American religion ("Mayan 2012 prophecy" misreading).
  ref: Mulcock (1997), "Searching for Our Indigenous Self"; Sutton (2003); Hutton (1999), tier 2
  confidence: established (the misappropriation pattern)
```

### Black Elk → Jung / Campbell

```
[manuscript-transmission (depth-psychological)] black-elk → carl-gustav-jung
  claim: Carl Jung explicitly read *Black Elk Speaks* (1932, Neihardt) and incorporated material from Black Elk's great vision into his discussions of archetypal vision; Jung's correspondence and CW 9-2 reference Lakota material substantially derived from Neihardt.
  ref: DeMallie (1984), The Sixth Grandfather; Holler (1995), Black Elk's Religion, tier 1
  confidence: established
```

```
[manuscript-transmission (mythopoetic)] black-elk → joseph-campbell
  claim: Joseph Campbell drew on Black Elk for *The Hero with a Thousand Faces* (1949) and especially for *The Power of Myth* (1988, where Campbell discusses Black Elk extensively).
  ref: Campbell (1949 / 1988); Holler (1995), tier 2
  confidence: established
```

### Norse / Kalevala → Wagner / Tolkien / Sibelius

```
[manuscript-transmission (literary)] phase-8-015-prose-edda-snorri → Wagner's Ring of the Nibelung (1869-76)
  claim: Snorri Sturluson's Prose Edda is the principal channel through which post-medieval Europe knew Norse mythology; Wagner's Ring cycle draws on Snorri (Wagner read German translations) and the Nibelungenlied.
  ref: Lindow (2001); Magee (2008), Aspects of Wagner; tier 2
  confidence: established
```

```
[manuscript-transmission (literary)] phase-8-015-prose-edda-snorri + phase-8-014-poetic-edda → Tolkien's mythopoetic project
  claim: Tolkien's Silmarillion and Lord of the Rings draw extensively on both Eddas; the names of the dwarves in The Hobbit are taken from the Vǫluspá dwarf-list quoted by Snorri; Gandalf is from the same list; Middle-earth = Old Norse Miðgarðr.
  ref: Shippey (2003), The Road to Middle-earth, tier 2
  confidence: established
```

```
[manuscript-transmission (literary)] phase-8-018-kalevala → Tolkien (Kullervo / Túrin Turambar)
  claim: Tolkien read the Kalevala in W.F. Kirby's 1907 English translation at Oxford ca. 1911; his Kullervo material (the tragic incest-and-suicide narrative he reworked into Túrin Turambar in the Silmarillion) descends directly from the Kalevala. Tolkien wrote: "I was immensely attracted by something in the air of the Kalevala."
  ref: Shippey (2003); Flieger (ed.) (2010), The Story of Kullervo (Tolkien), tier 2
  confidence: established
```

```
[manuscript-transmission (musical)] phase-8-018-kalevala → Sibelius
  claim: Sibelius's Kullervo (1892), Lemminkäinen Suite (1893-95, including Swan of Tuonela), Pohjola's Daughter (1906), Tapiola (1926), and many other works set Kalevala material directly.
  ref: Pentikäinen (1989); standard Sibelius scholarship, tier 2
  confidence: established
```

### Independent cosmogonic convergence (typological)

```
[parallel-motif (no contact)] phase-1-008-enuma-elish ↔ phase-8-010-kumulipo ↔ phase-8-011-maori-cosmogonic-chants
  claim: cosmogonic primordial-state-to-light-and-cosmos pattern (Akkadian Apsu-Tiamat primordial waters; Hawaiian *Pō*; Maori *Te Kore / Te Pō*); structural-typological convergence with no contact hypothesis. Compare also Genesis 1:2's *tehom* and *darkness*.
  ref: Beckwith (1951); Best (1924); Lambert (2013), tier 1-2
  confidence: typological-only

[parallel-motif (no contact)] phase-1-013-baal-cycle ↔ phase-8-001-popol-vuh
  claim: combat-cosmogony / chaoskampf in Baal-Yam and in Hero-Twins-vs-Xibalba; structurally analogous but independent.
  ref: Day (1985); Christenson (2003), tier 1
  confidence: typological-only

[parallel-motif (no contact)] Egyptian Geb-Nut separation ↔ phase-8-011-maori-cosmogonic-chants (Ranginui-Papatūānuku separation)
  claim: sky-earth-separation cosmogonic type; independent convergence.
  ref: Best (1924); standard Egyptological treatments, tier 1-2
  confidence: typological-only
```

### Diasporic Catholic-Mary syncretism with Indigenous Earth-Mother

```
[folk-syncretism] pachamama → Virgen del Cerro (Our Lady of the Mountain, Potosí)
  claim: the famous 18th-c. Virgen del Cerro painting depicts the Virgin Mary's body as the mountain of Potosí — a direct Pachamama-Mary fusion. Andean Catholic Marian devotion remains structurally Pachamama-inflected; Virgen of Copacabana similarly.
  ref: MacCormack (1991), Religion in the Andes; Sallnow (1987), tier 1
  confidence: established
```

### Walam Olum case (forgery established)

```
[established-forgery] phase-8-012-walam-olum
  claim: David Oestreicher's 1994 Rutgers dissertation and 1995-96 publications definitively demonstrated through reverse linguistic analysis that Rafinesque's 1836 "Walam Olum" is a 19th-c. fabrication; the Delaware Tribe of Indians formally repudiated it in 1997.
  ref: Oestreicher (1995, 1996), tier 1
  confidence: settled
```

### Èṣù-as-Satan translation propagation

```
[mistranslation-propagation] samuel-ajayi-crowther's Yoruba Bible (1862+) → tradition-yoruba-ifa
  claim: Crowther's 1862 onward Yoruba Bible translated Greek Satan / diabolos as Yoruba Èṣù; this single translation choice, propagated by the Bible's enormous reach, has shaped Christian-Yoruba religious vocabulary for 140 years and is a principal cause of the persistent (and theologically incorrect) identification of the orisha Èṣù with Satan. Subsequent Yoruba scholarship (Idowu, Abimbola, Pemberton) rejects the identification.
  ref: Walls (2002); Pemberton (1975), tier 1
  confidence: established (the mistranslation case)
```

### Lono-Cook identification (the Sahlins-Obeyesekere debate)

```
[contested folk-syncretism] lono → Captain James Cook (1779)
  claim: Cook arrived at Kealakekua Bay in January 1779 *during* the Makahiki festival; his great ship resembled a floating *heiau*. Hawaiian sources and some readings (Sahlins 1985) hold that Cook was identified with the returning Lono and accorded divine honors; Obeyesekere (1992) contested this reading. Current consensus (Borofsky 1997 review) accepts some Lono-Cook identification occurred but is cautious about specific character.
  ref: Sahlins (1985), Islands of History; Obeyesekere (1992), The Apotheosis of Captain Cook; Borofsky (1997), tier 1
  confidence: contested (the *fact* of identification — some occurred; the *character* of identification — disputed)
```

---

## 0–300 CE Tracing Edges — Christianity to Older Traditions

This block is the deliverable of the **Early Christianity Investigation Agent** (added 2026-05-14). Edges trace early Christian figures, texts, and doctrines *back* to older Egyptian / Mesopotamian / Mystery / Platonic / Iranian / Jewish-Hellenistic sources. These are the "MASSIVE wins" of the tracing-back framing: every connection here is a documented Christianity-to-older-tradition transmission edge.

### Logos transmission chain (the philosophical genealogy)

```
[direct-influence-chain] Stoic logos → philo-of-alexandria → phase-3-020-gospel-of-john prologue → justin-martyr (logos-spermatikos)
  claim: The Stoic *logos* (cosmic rational principle) is taken up by Philo (~+20) as the demiurgic-revelatory Word of God; the Fourth Gospel's prologue (Jn 1:1–18, ~+95) identifies this Logos with the pre-incarnate Christ; Justin Martyr (~+150) develops the *logos spermatikos* doctrine (the seed-Logos distributed throughout humanity, with full presence in Christ). Four-step transmission chain; each step documentable.
  ref: Boyarin (2001), "The Gospel of the Memra: Jewish Binitarianism and the Prologue to John", HTR 94; Tobin (1990), "The Prologue of John and Hellenistic Jewish Speculation", CBQ 52; Andresen (1952), "Justin und der mittlere Platonismus"; tier 1
  confidence: consensus (Philonic-Johannine-Justinian transmission); majority (Stoic origin of Philo's Logos)
```

### Platonism to Christian Platonism

```
[direct-influence-chain] plato (Timaeus, Republic) → middle-platonism (Numenius, Albinus) → justin-martyr → clement-of-alexandria → origen
  claim: The Platonic theology of the transcendent One/Good, the demiurgic intermediary, and the soul's ascent through philosophical purification is taken up sequentially by Justin (who explicitly narrates his pre-conversion Platonism, *Dial.* 2), Clement (*Stromata* 1.5: "Greek philosophy was given by God as a covenant to the Greeks"), and Origen (whose entire theological method is Christian Platonism). The *Alexandrian school* is the institutional vehicle for this transmission.
  ref: Andresen (1952), "Logos und Nomos"; Edwards (2002), "Origen Against Plato", Ashgate; Karamanolis (2013), "The Philosophy of Early Christianity", Routledge; tier 1
  confidence: consensus
```

### Plato (Timaeus) to Valentinian Gnostic Pleroma

```
[direct-influence] plato (Timaeus) → valentinus / valentinian-pleroma
  claim: The Valentinian Pleroma — a hierarchy of paired (syzygos) aeons emanating from an ineffable Source through intermediate Mind/Truth/Word/Life pairings to the Demiurge of the lower cosmos — is *structurally* a Platonist intelligible-world cosmology. Valentinus is the first Christian thinker to incorporate the full *Timaeus*-demiurge structure into Christian theology, distinguishing the Demiurge from the true God; this is the philosophical machinery that Irenaeus and Tertullian polemicize against.
  ref: Turner (2001), "Sethian Gnosticism and the Platonic Tradition", Presses de l'Université Laval; Thomassen (2006), "The Spiritual Seed: The Church of the Valentinians", Brill; tier 1
  confidence: consensus
```

### Pythagoreanism to Valentinian numerology

```
[direct-influence] pythagoreanism → valentinian-pleroma-structure
  claim: The Valentinian dyadic-tetradic-ogdoadic-decadic-dodekadic structure of Aeon pairings (the "Ogdoad of Aeons", the "Decad", the "Dodekad" totaling 30) is mathematically Pythagorean; Hippolytus (*Ref.* 6.21–29) explicitly traces this back to Pythagoras. Independently corroborated by [[marcus-the-magician]]'s alphabetic-numerological mysticism (*letters of the alphabet as ontological building blocks of the Pleroma*).
  ref: Thomassen (2006); Markschies (2003), "Gnosis: An Introduction"; tier 1
  confidence: consensus
```

### Aristotelianism to Basilidean theology

```
[direct-influence] aristotle (Categories) → basilides
  claim: Hippolytus (*Ref.* 7.20–27) traces Basilidean theology to Aristotle's *Categories*: the Basilidean *ouk on theos* (non-existent God beyond being) and the emergence-from-non-being structure are Aristotelian moves applied to negative theology. Löhr's 1996 reconstruction takes Hippolytus's testimony seriously and reads Basilides as engaging in sophisticated Aristotelian-Middle-Platonist negative theology rather than Irenaean-style mythological emanationism.
  ref: Löhr (1996), "Basilides und seine Schule", Mohr Siebeck; tier 1
  confidence: majority (Aristotelian engagement); contested (whether Hippolytus or Irenaeus is more faithful to Basilides)
```

### Egyptian magical-numerological tradition to Basilidean 365-heavens

```
[parallel-motif] egyptian-solar-numerology → basilidean-365-heavens (abrasax)
  claim: Basilides taught a system of 365 successive heavens, each ruled by an archon; the *Abrasax* gemstones (Greek letter-values summing to 365) are material witnesses to the tradition. The 365 corresponds to the Egyptian solar year and to Egyptian magical practice with calendrical numerology. The transmission is via Alexandrian Egyptian-Jewish-Christian milieu.
  ref: Pearson (1990), "Gnosticism, Judaism, and Egyptian Christianity", Fortress; Bonner (1950), "Studies in Magical Amulets, Chiefly Graeco-Egyptian", U. of Michigan Press; tier 1
  confidence: majority (Egyptian numerological origin); consensus (the Basilidean 365-system)
```

### Simon Magus to Egyptian-Hermetic-magical tradition

```
[parallel-motif] simon-magus → egyptian-hermetic-magical-tradition
  claim: Simon Magus's self-claim as the *megalē dynamis* ("Great Power") and the Helen-as-fallen-Ennoia-rescued-by-Simon mythology parallel: (a) Egyptian/Hermetic divine-power claims (Hermes Trismegistus as the divine power who emanates and saves); (b) the Isis-Osiris reconstruction structure where the divine consort gathers and restores the scattered/lost partner. Pearson 1990 argues for direct Egyptian-Alexandrian transmission.
  ref: Pearson (1990); Tuzlak (2002), "Simon Magus in Patristic, Medieval and Early Modern Traditions"; Beyschlag (1974), "Simon Magus: An Essay on the Founder of Simonianism", Mohr Siebeck; tier 1-2
  confidence: majority (Hellenistic-magical milieu); contested (specific Egyptian-Hermetic mediation)
```

### Apollonius of Tyana to Pythagorean / Orphic / Egyptian mysteries

```
[direct-influence-chain] pythagoreanism → orphism → egyptian-priestly-mystery-tradition → apollonius-of-tyana
  claim: Apollonius's biography (per Philostratus, though hagiographically elaborated) traces explicit pilgrimages: to Egypt (the priestly establishment), India (the Brahmins), and the Pythagorean schools of Asia Minor. The historical Apollonius was a self-identified Pythagorean ascetic. Whether Philostratus's specific itineraries are historical or literary, the *figure-type* (theios anēr / divine-man) is a real Hellenistic synthesis drawing on Pythagorean, Orphic, and Egyptian sources.
  ref: Dzielska (1986), "Apollonius of Tyana"; Anderson (1994), "Sage, Saint and Sophist"; tier 1
  confidence: majority (Pythagorean self-identification); contested (specific Egyptian-Indian pilgrimages)
```

### Mithraism to Mithra-Zoroastrian to Mitra-Vedic

```
[direct-influence-chain] mitra-vedic → mithra-zoroastrian → mithras-roman (mithraic-mysteries)
  claim: The Vedic *Mitra* (god of the contract, paired with Varuna in Rig Veda) is the deepest ancestor of the Iranian *Mithra* (the Zoroastrian yazata of the covenant, prominent in late Achaemenid and Parthian piety), who in the Roman Empire (1st–4th c. CE) is transformed into *Mithras* of the Mithraic Mysteries (the underground tauroctony cult of the Roman army). Beck's astronomical-symbolic reading of the Mithraic *tauroctony* as a star-map combining Iranian theological elements with Greco-Roman astrology is the principal modern reconstruction. The Mithraic mysteries paralleled and competed with Christian Eucharist (sacred meal, baptism, hierarchical grades of initiation) through the 2nd–4th c.
  ref: Beck (2006), "The Religion of the Mithras Cult in the Roman Empire", Oxford UP; Ulansey (1989), "The Origins of the Mithraic Mysteries", Oxford UP; Cumont (1903, classic but superseded); tier 1
  confidence: consensus (Vedic-Iranian connection); majority (Iranian-Roman Mithraism connection — though the *nature* of mediation is contested); consensus (Christian-Mithraic competition)
```

### Isis-Hellenistic cult to Mary-Theotokos iconography

```
[parallel-motif / contested-influence] isis-hellenistic → mary-theotokos
  claim: The Hellenistic Isis cult (Isis Lactans nursing Horus on her lap; Isis as universal mother, queen of heaven, intercessor) provides the iconographic and partly the theological template for the developing Mary-Theotokos cult, particularly in Egypt and Asia Minor where both cults coexisted in the 1st–4th c. The continuity of *nursing-mother-with-divine-child* iconography between late Egyptian Isis-with-Horus and early Coptic-Byzantine Mary-with-Jesus is materially documented.
  ref: Witt (1971), "Isis in the Graeco-Roman World", Cornell UP; Higgins (2012), "Anubis the Helper: Egyptian Funerary Practice and Early Christian Eschatology"; Frankfurter (1998), "Religion in Roman Egypt"; tier 1-2
  confidence: consensus (iconographic continuity); contested (direct theological dependence vs. parallel development)
```

### Hermetic Corpus (earliest stratum) to Christian Alexandria

```
[direct-attestation] phase-3-021-hermetic-corpus-earliest → clement-of-alexandria + origen
  claim: Clement of Alexandria (*Strom.* 6.4) explicitly quotes Hermes; Origen (*Contra Celsum* 6.32) knows the Hermetica. This is *direct documentary attestation* of Christian-Hermetic engagement *in the 0–300 CE target period*. The Hermetic and Christian Alexandrian schools were in conversation, not isolated.
  ref: Fowden (1986), "The Egyptian Hermes", Cambridge UP; Mahé (1978–1982), "Hermès en Haute-Égypte"; tier 1
  confidence: consensus
```

### Philo's allegorical method to Origen's allegorical exegesis

```
[direct-influence] philo-of-alexandria → origen (allegorical exegesis)
  claim: Origen's allegorical-spiritual exegesis of the Hebrew Bible (with its threefold sense — literal/moral/spiritual; his commentaries methodically follow Philo's exegetical procedures) is *the* direct development of Philo's allegorical method. Origen explicitly cites Philo as authority. The Alexandrian Christian Platonist exegetical tradition descends through Clement → Origen, with Philo as immediate ancestor.
  ref: Runia (1993), "Philo in Early Christian Literature", Van Gorcum; Heine (2010), "Origen: Scholarship in the Service of the Church"; tier 1
  confidence: consensus
```

### Zoroastrian eschatology to Christian apocalyptic

```
[shared-milieu / influence] zoroastrian-eschatology (gathas + younger avesta) → second-temple-jewish-apocalyptic → christian-eschatology
  claim: Cosmic dualism, final judgment, bodily resurrection, hierarchies of angels and demons, eschatological Savior (Saoshyant) — Iranian features absent or marginal in pre-exilic Hebrew Bible, prominent in Second Temple Jewish apocalyptic, fully developed in Christianity. The transmission chain runs through Persian-period Jewish contact with Zoroastrianism (538 BCE onward), Second Temple apocalyptic (Daniel, Enoch, Qumran), and into Christian apocalyptic (Revelation, the synoptic apocalypses).
  ref: Boyce (1984), "Zoroastrians"; Hultgård (2000), "Persian Apocalypticism"; Collins (1998), "The Apocalyptic Imagination", Eerdmans; tier 1-2
  confidence: majority (Iranian-Jewish apocalyptic transmission); contested (specific mechanisms)
```

### 1 Enoch (Watchers tradition) to early Christian Christology

```
[direct-textual-influence] phase-3-004-1-enoch → jude (NT) → early-christian-watchers-tradition
  claim: 1 Enoch was foundational scripture for many early Jewish-Christian communities; **Jude 14–15 quotes 1 Enoch 1:9 as authoritative prophecy** — direct canonical-textual attestation of Enochic-Christian transmission. The Watchers tradition (1 Enoch 6–11, the descent of fallen angels who corrupt humanity) is reflected in 2 Pet 2:4, 1 Pet 3:19–20, and various 2nd-c. Christian texts.
  ref: Reed (2005), "Fallen Angels and the History of Judaism and Christianity", Cambridge UP; VanderKam (2004), "Enoch: A Man for All Generations"; tier 1
  confidence: consensus
```

### Marcion to Cerdo to Syrian dualist current

```
[direct-influence-chain] cerdo (Syrian) → marcion-of-sinope → marcionite-churches
  claim: Per Irenaeus *AH* 1.27, Marcion's teacher Cerdo (active at Rome ~+135, originally from Syria) taught a two-gods theology — a just OT creator vs. a good NT Father — that Marcion radicalized. The Syrian dualist current may itself reflect older Iranian dualism (Drijvers 1980 on Edessan dualisms) but the line is contested.
  ref: Lieu (2015), "Marcion and the Making of a Heretic", Cambridge UP; Harnack (1924), "Marcion: The Gospel of the Alien God"; Drijvers (1980), "Cults and Beliefs at Edessa", Brill; tier 1
  confidence: consensus (Cerdo→Marcion); contested (Iranian dualist origins)
```

### Greek Mystery cults to Christian sacramental theology

```
[parallel-motif / shared-milieu] tradition-mystery-cults (Eleusinian, Dionysian, Isiac, Mithraic) → christian-sacramental-development
  claim: Christian baptism, eucharist, and the *mystagogical* explanation of sacraments parallel structural features of the Hellenistic mystery cults: ritual initiation, sacred meal, esoteric instruction restricted to initiates, transformation of the initiate's status. Whether direct borrowing (older comparative-religion view) or parallel development in shared Hellenistic religious koine (current mainstream view) is debated.
  ref: Burkert (1987), "Ancient Mystery Cults", Harvard UP; Klauck (2003), "The Religious Context of Early Christianity"; tier 1
  confidence: consensus (parallels); contested (direct borrowing vs. shared milieu)
```

### Tannaitic / Yavnean rabbinic Judaism to Christian-Jewish separation

```
[institutional-formation] yavneh-rabbinic-consolidation → christian-jewish-separation
  claim: The institutional consolidation of rabbinic Judaism at Yavneh (~+70/+130) — the academy, the patriarchate under [[gamaliel-ii]], the *Birkat ha-Minim* — is one stage in the gradual Christian-Jewish institutional separation. The older "Council of Jamnia" historiography (canon-closing council + Christian expulsion) has been substantially revised: the separation was gradual, geographically uneven, and not formally completed in this period. The *Birkat ha-Minim's notzrim* clause is probably 2nd-3rd c.
  ref: Boyarin (2004), "Border Lines: The Partition of Judaeo-Christianity", U. Penn Press; Becker & Reed (eds.) (2003), "The Ways That Never Parted", Mohr Siebeck; tier 1
  confidence: majority (gradual separation); rejected (Jamnia council historiography)
```

### Babylonian Talmud Yeshu/Panthera tradition (anti-Christian Jewish counter-narrative)

```
[parallel-anti-narrative] jewish-anti-christian-oral-tradition → celsus-true-word + babylonian-talmud
  claim: A late-2nd-c. Jewish oral anti-Christian counter-narrative (Jesus as illegitimate son of a Roman soldier Panthera, learned magic in Egypt) is preserved independently in: (a) [[celsus]]'s *True Word* (~+178), in the imaginary-Jew section; (b) the Yeshu-Pandera passages in the Babylonian Talmud (B. Shabbat 104b, Sanhedrin 67a, 107b, etc.); (c) Tertullian *De spect.* 30 (citing it as a Jewish slander). Schäfer 2007 traces the tradition's development.
  ref: Schäfer (2007), "Jesus in the Talmud", Princeton UP; tier 1
  confidence: consensus (existence of the tradition); contested (specifics of transmission)
```

### Egyptian-Alexandrian Jewish wisdom to Apollonian/Hellenistic-Jewish Christianity

```
[direct-influence] alexandrian-jewish-wisdom (philo, wisdom-of-solomon) → apollos → hellenistic-pauline-christianity
  claim: [[apollos]] — explicitly Alexandrian per Acts 18:24 — represents the entry of Alexandrian-Jewish allegorical and wisdom-theological methods into Pauline-Christian discourse. Luther's hypothesis that Apollos wrote *Hebrews* — based on Hebrews's polished Greek, Philonic-allegorical method, and Alexandrian profile — captures the *type* even if the specific authorship is unprovable.
  ref: Attridge (1989), "Hebrews" (Hermeneia), Fortress; Runia (1993), "Philo in Early Christian Literature"; tier 1
  confidence: majority (Apollos as Alexandrian-Jewish bridge); contested (Hebrews authorship specifically)
```

