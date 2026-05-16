// CODEX ATLAS — OBSERVATIONS DATA
// Interpretive layer: hypotheses, conclusions, anomalies, and meta-patterns
// derived from the vault's cross-tradition data.
//
// This is NOT the facts layer (see patterns.js). This is the thinking layer —
// what the data seems to be saying when read without confessional loyalty.
// Useful for agents, investigators, and anyone trying to understand what
// this investigation is actually finding.
//
// To add a new observation: append an entry to window.OBSERVATIONS_DATA.
// category values:
//   'CONCLUSION'  — evidence strongly supports this; multiple independent confirmations
//   'HYPOTHESIS'  — testable claim; data points in this direction but not conclusive
//   'ANOMALY'     — something that breaks the expected pattern; needs investigation
//   'META'        — an observation about the investigation itself, not the content
//
// evidence: array of vault node slugs that substantiate this observation
// Agents: grow this file as the vault grows. These observations should be
// challenged, revised, and superseded — that's the point.

window.OBSERVATIONS_DATA = [

  {
    id: 'scaffold-paradox',
    title: 'The Scaffold Paradox',
    category: 'CONCLUSION',
    summary: 'Every serious symbolic system, pursued far enough, concludes that symbols are inadequate. The endpoint of 5,000 years of religious architecture is silence.',
    body: 'Nagarjuna: all phenomena are empty of inherent existence — including the doctrine of emptiness. Luria: God had to contract into void for creation to exist. Eckhart: the highest mystical state is the divine void beyond God. Laozi: the Tao that can be named is not the eternal Tao. Pseudo-Dionysius: God is best described by what God is not. These are not peripheral figures — they are the most technically sophisticated theologians each tradition produced. The unanimous verdict of maximum symbolic elaboration is: the symbol system points at something the symbol system cannot contain. Humans built the most elaborate cognitive scaffolding in history specifically to reach a place where the scaffolding had to be abandoned. This is either the most productive failure in intellectual history or the most honest conclusion available.',
    evidence: ['sacred-void', 'sacred-number-zero', 'metatrons-cube'],
  },

  {
    id: 'inversion-economy',
    title: 'The Inversion Economy',
    category: 'CONCLUSION',
    summary: 'Dominant traditions rarely destroy conquered symbols. They invert them. Inversion preserves the power while reversing the sign — more efficient than erasure.',
    body: 'The serpent was the wisdom-healing symbol of pre-Yahwist Near Eastern religion for millennia. Biblical monotheism did not delete it — it made it Satan. The same text that assigns the Eden serpent to the Devil also deploys Moses\'s bronze serpent as a type of Christ (John 3:14). Spanish missionaries did not erase Quetzalcoatl — they mapped him onto the Devil. The sacred cauldron (inexhaustible, life-restoring) became the witch\'s cauldron (poisoning, death). The swastika (universal solar good-luck symbol across five continents) became the emblem of genocide in 15 years. The pattern is consistent: you cannot destroy a powerful symbol. Its cognitive grip is too strong. The only viable move is inversion — keep the form, flip the valence. This means every inverted symbol in a dominant tradition is evidence of something powerful that tradition needed to suppress.',
    evidence: ['serpent-cosmic-enemy', 'naga-serpent', 'swastika', 'sacred-cauldron', 'sol-niger'],
  },

  {
    id: 'execution-generativity',
    title: 'Executed Founders Outperform Surviving Ones',
    category: 'HYPOTHESIS',
    summary: 'Traditions built around a witnessed, unjust execution consistently generate more theological elaboration and historical reach than traditions whose founders died in peace.',
    body: 'Christianity (Jesus, crucified ~30 CE) became the largest religion in history. Sufism\'s paradigmatic martyr-theologian is al-Hallaj, crucified 922 CE for "Ana\'l-Haqq." Shia Islam organizes around Hussein\'s massacre at Karbala (680 CE). The Sikh Khalsa was forged by the execution of Guru Tegh Bahadur (1675) — uniquely, for defending another tradition\'s religious freedom. The Bab\'s execution (1850) is the founding event of the Bahá\'í Faith. René Girard\'s scapegoat mechanism offers one mechanism: the community\'s collective violence onto an innocent victim, followed by divinization, releases internal tension while generating a founding narrative of extraordinary power. But the simpler observation is empirical: something about a witnessed, unjust, public death at the hands of an institution creates generative force that peaceful deaths do not. The martyred figure consistently outcompetes the surviving one in long-term tradition-formation. This is worth testing systematically against the vault\'s full person-node set.',
    evidence: ['dying-rising-god', 'sacred-heart'],
  },

  {
    id: 'transmission-amnesia',
    title: 'Transmission Amnesia: Symbols Travel; Origins Die',
    category: 'CONCLUSION',
    summary: 'Symbols cross cultural boundaries far more successfully than their attribution. Every tradition that inherited a symbol forgot — or chose to forget — where it came from.',
    body: 'The Catholic rosary is a Hindu japa mālā. The cherubim guarding the Ark of the Covenant are Babylonian lamassu. The Madonna and Child is Isis Lactans. The Masonic Blazing Star is Sirius/Sopdet/Isis. None of these receiving traditions acknowledges the source. This is not necessarily dishonesty — the transmission chains operate over centuries, through intermediaries, with no single moment of visible transfer. But the result is a systematic pattern: the most powerful symbols in living traditions are almost always imports whose origins have been domesticated or forgotten. The corollary is methodologically important for this investigation: wherever a tradition claims a symbol as original, the vault should look for antecedents. Originality in sacred symbols is extremely rare. Successful adoption with forgotten attribution is the norm.',
    evidence: ['prayer-beads', 'lamassu', 'divine-child', 'blazing-star', 'winged-disk'],
  },

  {
    id: 'monster-at-the-edge',
    title: 'Every Civilization Independently Invented the Cosmic Monster',
    category: 'CONCLUSION',
    summary: 'Every independent cosmology generated a devouring chaos-monster at the boundary of the ordered world. This is not transmission — it is convergent cognitive production.',
    body: 'Egyptian Apep (the serpent that threatens Ra\'s solar barque nightly). Mesopotamian Tiamat (the salt-water chaos from which Marduk carves the cosmos). Hebrew Leviathan (the chaos-sea monster that God defeated before creation). Hindu Vritra (the drought-dragon Indra slays). Norse Jörmungandr (the World Serpent encircling Midgard, enemy of Thor). Maya sky-serpents swallowing the sun during eclipses. Chinese celestial dragon consuming the sun. Hindu Rahu (the severed asura-head that causes eclipses). These traditions have no documented literary contact at their origin points. The cosmic-boundary monster is not transmitted — it is independently generated. The most likely explanation is that human cognition reliably produces a "chaos agent" archetype at the limit of the ordered world because the structured cosmos always exists against a background of what-would-happen-if-order-failed. The monster is the cognitive placeholder for that background threat. Every civilization looks at the edge of the map and draws the same thing.',
    evidence: ['serpent-cosmic-enemy', 'sacred-eclipse', 'ouroboros'],
  },

  {
    id: 'axial-age-simultaneity',
    title: 'The Axial Age Simultaneity Problem',
    category: 'ANOMALY',
    summary: 'Between ~800 and ~200 BCE, on four continents with no documented contact, the major traditions simultaneously reformulated inherited religion into ethical-philosophical frameworks. Coincidence is not an explanation.',
    body: 'Karl Jaspers named this the Axial Age (1949). In the same 600-year window: Confucius and Laozi in China reformulate ancestor religion into ethical philosophy and cosmological principle. The Hebrew prophets (Amos, Isaiah, Jeremiah) reformulate sacrificial religion into ethical monotheism. The Buddha in India reformulates Vedic ritual religion into a psychology of liberation. Socrates and Plato in Greece reformulate Olympian polytheism into philosophical inquiry. Zoroaster (if the dating holds) reformulates Iranian polytheism into ethical dualism. None of these figures were in documented contact. All of them made structurally similar moves: internalize the external ritual, universalize the local god, ground ethics in cosmic principle rather than tribal loyalty. The proposed explanations (iron technology → new economic class → leisure for abstract thought; trade routes → idea diffusion; climate stress → existential urgency) are all partial. The simultaneity remains the most striking underdetermined fact in the vault\'s data.',
    evidence: ['sacred-number-zero', 'the-pleroma'],
  },

  {
    id: 'christianity-is-a-museum',
    title: 'Western Christianity Is Materially a Museum of Near-Eastern Imports',
    category: 'CONCLUSION',
    summary: 'At the level of symbols, rituals, and iconography — not theology — Western Christianity is almost entirely composed of pre-Christian Near-Eastern and Egyptian forms given new theological labeling.',
    body: 'The Madonna and Child is Isis Lactans (Grabar 1968, documented). The cherubim are lamassu (Babylonian composite guardians, same posture, same function). The Grail is a Christianized Celtic cauldron (Loomis 1963, documented). The rosary is a Hindu/Buddhist mālā traversing the Silk Road. December 25 winter solstice birth-of-the-sun narrative precedes Christianity in Mithraic and Roman Sol Invictus cults. The dying-and-rising structure (death → descent → resurrection → cosmic renewal) is attested in Osiris (~2400 BCE), Dumuzi (~1900 BCE), Dionysus-Zagreus (~500 BCE), Adonis, Attis, Baldr — all before the Christian timeline. The fish symbol (Ichthys) is a pre-Christian goddess-of-the-sea symbol in some readings. The Easter date is governed by the same lunar calculation that governed Passover, which is built on an agricultural spring-renewal festival. This is not a theological claim — it is a material observation. The doctrinal content of Christianity is original. The symbolic furniture it sits in was assembled from the cultures it displaced. The investigation should expect this pattern everywhere: doctrine innovates, symbols recycle.',
    evidence: ['divine-child', 'lamassu', 'cauldron-of-rebirth', 'prayer-beads', 'dying-rising-god'],
  },

  {
    id: 'sacred-geometry-was-right',
    title: 'Sacred Geometry Was Doing Science Before Science Had the Language',
    category: 'HYPOTHESIS',
    summary: 'The traditions dismissed as mystical numerology were frequently making correct structural observations about physical reality that Western science formalized centuries later.',
    body: 'Islamic girih tile craftsmen (Isfahan, 1453 CE) were generating Penrose quasi-periodic tiling — a mathematical structure Western mathematics formalized in 1974. Johannes Kepler proposed in 1596 that planetary orbits were separated by the five Platonic solids nested within each other — identical to the claim in Metatron\'s Cube. The C60 Buckminsterfullerene molecule (Nobel 1996) is a truncated icosahedron — the Platonic solid that sacred geometry assigned to the element of water since Plato\'s Timaeus. The Sanskrit śūnya (void/zero) and Buddhist śūnyatā developed in the same intellectual environment; mathematical zero may be a formalization of the same cognitive discovery made in a philosophical register first. The quarantine (40 days of isolation) is a Bronze Age sacred number that turned out to encode a correct epidemiological heuristic. The pattern is consistent: sacred geometry was observing real structural features of the physical world (atomic geometry, quasi-crystalline tiling, mathematical zero) and encoding them in theological language because theological language was the available notation. When modern science developed different notation, it found the same structures. The mystics were bad at prediction but good at structure.',
    evidence: ['arabesque-girih', 'metatrons-cube', 'sacred-number-zero', 'sacred-number-forty'],
  },

  {
    id: 'crisis-grammar-universal',
    title: 'Universal Crisis Grammar: Every Culture Runs the Same Three-Step Subroutine',
    category: 'CONCLUSION',
    summary: 'When something catastrophic and unexplained happens, every independent culture generates the same three-step response: (1) narrative agent, (2) ritual counter-action, (3) cosmic significance. Only the variables change.',
    body: 'The eclipse is the clearest test case. Hindu tradition: Rahu (narrative agent) swallows the sun → grāhaṇa dāna offerings and river-bathing (ritual) → eclipse as moment of cosmic vulnerability (significance). Mesopotamian: royal death-omen (agent) → šar pūhi substitute-king sacrifice (ritual) → political-cosmic crisis requiring management (significance). Maya: sky-serpents (agent) → bloodletting and calendar observation (ritual) → the Dresden Codex\'s 405-lunar-month eclipse prediction system (significance). Chinese: celestial dragon (agent) → drums and firecrackers (ritual) → the emperor\'s cosmic mandate under scrutiny (significance). Norse: Fenrir/Sköll wolves (agent) → alarm response (ritual) → Ragnarök precursor (significance). Christian: supernatural darkness at Crucifixion (agent) → liturgical response (ritual) → cosmic redemption event (significance). The grammar is invariant across traditions with zero contact. The variables (which monster, which ritual, what cosmic frame) are culturally specific. This suggests the three-step crisis grammar is a cognitive universal — not a cultural invention but a feature of how human minds process sudden, catastrophic, unexplained events. The investigation corollary: wherever the vault finds a tradition\'s ritual response to crisis, all three components should be present and traceable.',
    evidence: ['sacred-eclipse', 'serpent-cosmic-enemy', 'sacrifice-substitution'],
  },

  {
    id: 'the-real-thesis',
    title: 'The Meta-Observation: What This Investigation Is Actually Finding',
    category: 'META',
    summary: 'The vault is not finding that all religions are the same. It is finding that human minds, when confronted with the same problems — death, cosmos, power, transformation — generate structurally similar solutions independent of culture. The religions are different. The cognitive problems they solve are identical.',
    body: 'The risk of a comparative religion project is the "all paths lead to the same mountain" conclusion — a comforting homogenization that flattens real differences. That is not what the vault\'s data supports. The differences between traditions are real: the Calvinist God and the Buddhist Dhamma are not the same thing dressed differently. What the vault IS finding is a level below theology: the cognitive problems that religious systems are built to solve are cross-cultural constants. Death requires narrative. Cosmic threat requires a responsible agent and a ritual response. Social order requires sacred legitimation. The self requires a larger frame. Power requires genealogy with the divine. Every tradition is a locally-specific solution to a universal set of cognitive and social requirements. The convergences the vault documents — the dying-rising god, the sacred mountain, the void-at-the-summit, the cosmic monster, the executed founder — are not coincidences and not transmissions. They are the same cognitive software running on different cultural hardware, producing recognizably similar outputs. The investigation\'s real contribution is not "look how similar they all are" but "here is the shape of the problems human minds cannot stop trying to solve."',
    evidence: ['dying-rising-god', 'world-mountain', 'sacred-void', 'serpent-cosmic-enemy'],
  },

];
