---
type: calendar-system
id: "calendar-computus-easter-dating"
title: "Computus (Paschal / Easter-Dating Computation)"
aka: ["computus", "computus paschalis", "computus ecclesiasticus", "the reckoning of time", "Paschalion (Eastern usage)", "Easter computus", "the science of Easter-dating", "Paschal cycle"]
category: "computational-calendar-procedure"
tradition: "[[tradition-christianity-canonical]]"
date-attested-earliest: 200
date-attested-latest: 2026
dating-basis: "From the earliest surviving Christian Easter tables — the 112-year cycle inscribed on the statue traditionally associated with Hippolytus of Rome (early 3rd c.) and the Alexandrian 8- and 19-year cycles of Anatolius of Laodicea (c. 277) — through the [[event-council-of-nicaea-325|Council of Nicaea]]'s fixing of the Paschal conditions (325), the codification of the Alexandrian 19-year cycle for the Latin West by Dionysius Exiguus (525), and its comprehensive medieval synthesis in Bede's *De temporum ratione* (725), down to the procedure's continuing use to set Easter and the whole movable liturgical cycle in 2026. It is a computational tradition, not an institution with a founding date."
epoch: "n/a — the computus is a procedure, not an era-count. It has no epoch of its own; it is keyed to the position of a year within the 19-year lunar cycle (the Golden Number) and applied on top of the underlying solar calendar ([[julian-calendar|Julian]], then for the Western churches [[gregorian-calendar|Gregorian]] after 1582)"
year-length: "n/a — the computus computes a DATE (the Sunday of Pascha) within an existing solar year; it does not define a year-length. The lunisolar machinery it manipulates reconciles the ~354-day lunar year of 12 synodic months with the ~365-day solar year"
cycle-length: "the 19-year Metonic lunar cycle (Golden Number 1–19), giving the schematic date of the Paschal full moon; combined with the 28-year solar cycle of weekdays (the Dominical Letter), the two multiply to the 532-year Great Paschal Cycle (19 × 28), after which the entire Julian sequence of Easter dates repeats exactly"
intercalation-rule: "the EPACT system: the age of the ecclesiastical moon advances 11 days each year — the annual lunisolar gap (365 − 354) — reduced modulo 30, with one *saltus lunae* ('leap of the moon') per 19-year cycle so that the schematic moon closes back onto its starting phase. The Paschal full moon is the 14th day of the ecclesiastical lunar month falling on or after the fixed equinox (March 21)"
month-count: "n/a — a computation, not a month-structured calendar"
month-anchor: "ecclesiastical (schematic) lunation — the computus uses a CALCULATED 'ecclesiastical moon' fixed by table, deliberately NOT the observed moon and NOT the actual Jewish calendar, so that Easter can be determined years in advance and uniformly across Christendom"
year-anchor: "the ecclesiastical vernal equinox, conventionally FIXED at March 21 (the 4th-century Alexandrian date), rather than the true astronomical equinox — the divergence of the two by the 16th century is what motivated the Gregorian reform"
astronomical-basis:
  - "synodic (lunar) month ~29.5306 days"
  - "tropical (solar) year ~365.2422 days"
  - "the 19-year Metonic near-coincidence (235 lunations ≈ 19 solar years) — the same cycle used in the Babylonian and Athenian lunisolar calendars — schematised into the ecclesiastical lunar tables"
  - "the ecclesiastical full moon and the March-21 equinox are SCHEMATIC constructs of the tables, not observations — a defining feature of the system"
ritual-festivals:
  - "Pascha / Easter — the first Sunday after the ecclesiastical (Paschal) full moon on or after March 21; the anchor the whole computus exists to fix"
  - "the entire movable TEMPORALE that hangs off the Easter date: Ash Wednesday and Lent (before), Ascension (+40 days), Pentecost (+50 days), Corpus Christi, and the movable pre-Lenten Sundays"
key-figures:
  - "[[bede]] (*De temporum ratione*, 725 — the comprehensive medieval synthesis of the computus, its arithmetic, and its cosmology; the work that carried the Alexandrian-Dionysiac reckoning through the Latin Middle Ages)"
  - "`Hippolytus of Rome` (early-3rd-c. 112-year Paschal table — among the earliest documented Christian Easter computations)"
  - "`Anatolius of Laodicea` (c. 277 — an early Alexandrian 19-year Paschal cycle)"
  - "`Dionysius Exiguus` (525 — extended the Alexandrian 19-year cycle for the Latin West and, in doing so, introduced the Anno Domini era; NOT to be confused with [[pseudo-dionysius-the-areopagite|Pseudo-Dionysius the Areopagite]])"
  - "`Victorius of Aquitaine` (457 — a 532-year Paschal table commissioned at Rome, the Western rival cycle before the Dionysiac cycle prevailed)"
  - "`Cyril of Alexandria` / `Theophilus of Alexandria` (the Alexandrian Paschal tables Dionysius continued)"
  - "`Aloysius Lilius` and `Christopher Clavius` (the epact-table computus of the 1582 Gregorian reform)"
events-context:
  - "[[event-council-of-nicaea-325]]"
related-traditions:
  - "[[tradition-christianity-canonical]]"
  - "[[tradition-latin-christianity]]"
  - "[[tradition-byzantine-christianity]]"
parallels:
  - "[[liturgical-year-christian]]"
  - "[[julian-calendar]]"
  - "[[gregorian-calendar]]"
  - "[[hebrew-calendar]]"
  - "[[babylonian-calendar]]"
  - "[[calendars-comparative]]"
  - "[[coptic-calendar]]"
  - "[[ethiopian-geez-calendar]]"
hub-edges:
  - target: "liturgical-year-christian"
    type: "computational-engine-of-the-movable-liturgical-year"
    source: "Wallis (trans.), *Bede: The Reckoning of Time*, Liverpool UP 1999, introduction; Talley, *The Origins of the Liturgical Year*, 1991 — the computus is the arithmetical procedure that fixes Pascha and therefore the entire movable temporale (Lent, Ascension, Pentecost). The liturgical-year node describes the cycle; the computus IS the machinery that dates it."
    source-tier: T1
    notes: "Cross-node within 26_calendars: the computus is the computation the liturgical year depends on."
  - target: "calendars-comparative"
    type: "Christian-lunisolar-reconciliation-via-the-Metonic-cycle"
    source: "Richards, *Mapping Time*, Oxford UP 1998; Mosshammer, *The Easter Computus and the Origins of the Christian Era*, Oxford UP 2008 — the computus is the Christian instance of the lunisolar-reconciliation problem that organises the whole calendar lens: it embeds the 19-year Metonic cycle (the same cycle in the Babylonian and Hebrew calendars) as a schematic ecclesiastical lunar table laid over the Julian solar year."
    source-tier: T1
    notes: "Wires the Christian Easter-computation into the comparative calendar spine as the lunisolar-computation exemplar."
  - target: "gregorian-calendar"
    type: "computus-drift-as-cause-of-the-1582-reform"
    source: "Coyne, Hoskin & Pedersen (eds.), *Gregorian Reform of the Calendar*, Pontifical Academy of Sciences 1983; Richards 1998 — by the 16th century the computus's schematic March-21 equinox and its Golden-Number moon had drifted ~10 days and ~4 days respectively from astronomy, mis-dating Easter; the Gregorian reform re-anchored the equinox and replaced the Golden Number with a corrected epact table specifically to repair the computus."
    source-tier: T1
    notes: "The Easter-computation error is the documented motive for the Julian→Gregorian reform."
status: "full"
refs:
  - title: "Bede: The Reckoning of Time (De temporum ratione)"
    author: "Wallis, Faith (trans., with commentary)"
    year: 1999
    publisher: "Liverpool University Press (Translated Texts for Historians)"
    type: "critical-translation"
    tier: 1
    notes: "The standard English edition of Bede's computus treatise, with an extended introduction that reconstructs the medieval science of Easter-dating; the backbone source for this node."
  - title: "The Easter Computus and the Origins of the Christian Era"
    author: "Mosshammer, Alden A."
    year: 2008
    publisher: "Oxford University Press"
    type: "monograph"
    tier: 1
    notes: "The authoritative modern monograph on the computus: the Alexandrian 19-year cycle, its transmission, and Dionysius Exiguus's Anno Domini innovation. Source for the transmission-vs-schematic distinctions drawn here."
  - title: "Mapping Time: The Calendar and Its History"
    author: "Richards, E.G."
    year: 1998
    publisher: "Oxford University Press"
    type: "monograph"
    tier: 1
    notes: "Standard single-volume reference; gives the Golden Number, epact, Dominical Letter and 532-year cycle arithmetic and the computus's role in the Gregorian reform."
  - title: "Anno Domini: The Origins of the Christian Era"
    author: "Declercq, Georges"
    year: 2000
    publisher: "Brepols"
    type: "monograph"
    tier: 1
    notes: "The critical study of Dionysius Exiguus's 525 Paschal continuation and the birth of the AD era out of the computus."
  - title: "The Oxford Companion to the Year"
    author: "Blackburn, Bonnie & Holford-Strevens, Leofranc"
    year: 1999
    publisher: "Oxford University Press"
    type: "reference"
    tier: 1
    notes: "Detailed worked treatment of the Golden Number, epacts, ecclesiastical moon and the full Easter algorithm in both Julian and Gregorian forms."
tags: [calendar, computus, paschalion, easter, computus-paschalis, christian, lunisolar, metonic-cycle, golden-number, epact, bede, dionysius-exiguus, nicaea-325, quartodeciman, whitby-664, gregorian-reform, medieval-mathematics, transmission-vs-convergence, cross-tradition]
---

# Computus (Paschal / Easter-Dating Computation)

## Identity

The **computus** (Latin *computus paschalis*, "the Paschal reckoning") is the medieval Christian science of calculating the date of **Easter** — canonically, the first Sunday after the first ecclesiastical full moon falling on or after the vernal equinox. It is not a calendar in the ordinary sense: it has no months and no epoch of its own. It is a **procedure**, a body of arithmetic laid over the solar [[julian-calendar|Julian]] (and later [[gregorian-calendar|Gregorian]]) calendar, whose one job is to reconcile a **lunar** festival inherited from the Jewish Passover with the **solar week** of the Christian Sunday. Because Easter is movable and the entire liturgical [[liturgical-year-christian|temporale]] — Lent, Ascension, Pentecost — hangs from it, the computus is the computational engine of the whole movable Christian year.

The problem it solves is the same **lunisolar incommensurability** that organises the entire calendar lens (see [[calendars-comparative]]): twelve lunar months (~354 days) fall about eleven days short of the solar year (~365 days), and no whole number of lunations equals a whole number of years. The computus's answer is the **19-year Metonic cycle** — 235 lunations ≈ 19 solar years — schematised into tables so that Easter can be fixed years ahead and uniformly across Christendom, without anyone having to observe the sky or consult the Jewish calendar.

## How Easter is computed

The classical (Julian) computus assembles the date from three interlocking pieces:

1. **The Golden Number** (*G* = (year mod 19) + 1) places the year within the 19-year lunar cycle and so gives the schematic date of the **Paschal full moon** — the 14th day of the ecclesiastical lunar month on or after March 21.
2. **The epact** tracks the age of the ecclesiastical moon: it advances **11 days each year** (the annual lunisolar gap), reduced modulo 30, with one *saltus lunae* ("leap of the moon") per cycle so the moon closes back on itself after 19 years.
3. **The Dominical Letter**, running on the **28-year solar cycle** of weekdays, finds which day is Sunday, so that Easter can be set to the **first Sunday after** the Paschal full moon.

Multiplying the two cycles gives the **532-year Great Paschal Cycle** (19 × 28), after which the whole Julian sequence of Easter dates repeats identically — the object Victorius of Aquitaine tabulated in 457 and Dionysius Exiguus reworked in 525.

The decisive design choice is that the moon and the equinox of the computus are **schematic, not observed**: the equinox is fixed by convention at **March 21** and the full moon is read off a table (the *ecclesiastical* moon), which can differ from the true astronomical moon by a day or two. This is deliberate — it makes Easter **predictable and universal** at the cost of astronomical exactness, and it is precisely this schematism that would later drift out of true and force the Gregorian reform.

## The medieval science of the computus

The computus was, for roughly a thousand years, **the** driver of calendrical and arithmetical learning in the Latin West. Setting Easter correctly was a matter of orthodoxy, so every monastery needed someone who could reckon it, and the surviving corpus of *computus* manuscripts is enormous. Its summit is the Venerable [[bede|Bede]]'s *De temporum ratione* ("On the Reckoning of Time," 725), which not only lays out the Golden Number, epacts and cycles but embeds them in a cosmology of time, tides and ages of the world; Faith Wallis's 1999 translation treats it as the central medieval scientific text it is. Dionysius Exiguus's earlier continuation of the **Alexandrian 19-year cycle** (525) had two lasting effects: it made the Alexandrian reckoning the Western standard, and — because Dionysius counted his tables from the supposed year of the Incarnation — it introduced the **Anno Domini** era itself (Declercq 2000; Mosshammer 2008).

The computus was also the arena of Christianity's sharpest internal calendar disputes (see **Disputes**): the second-century **Quartodeciman** controversy over whether to follow the Jewish 14 Nisan directly, and the seventh-century **Celtic-versus-Roman** clash of Paschal cycles settled at the **Synod of Whitby (664)**, which Bede narrates in his *Ecclesiastical History* (3.25).

## Cross-tradition significance

The computus sits on two genuinely different kinds of cross-tradition connection, and honesty requires keeping them apart.

**A secure genetic inheritance — Easter from Passover.** Christian Pascha *is* the Jewish Passover reinterpreted: Paul already calls Christ "our paschal lamb" (1 Cor 5:7), and the lunar anchoring of Easter — tied to the spring full moon of Nisan — is a **direct historical inheritance** from the [[hebrew-calendar|Jewish lunisolar calendar]], not a coincidence. The whole reason a solar-week-keeping religion computes a *lunar* date at all is this inheritance. What the post-Nicene computus then did was **decouple** the reckoning from the actual Jewish calendar, building its own schematic ecclesiastical moon so that Christians would no longer depend on Jewish authorities to fix Easter — a theological-political severing that is itself historically documented.

**A shared cycle, transmitted then re-derived — the Metonic 19 years.** The 19-year cycle at the computus's core is the **same** cycle used in the [[babylonian-calendar|Babylonian]] and later [[hebrew-calendar|Hebrew]] calendars and published at Athens by Meton (432 BCE). Its arrival in the Christian computus runs through the **Alexandrian** astronomical tradition, where Greek mathematical astronomy and the Egyptian calendar met; the Christian and rabbinic 19-year systems are thus **cousins descended from a common Babylonian–Hellenistic ancestor**, not independent inventions — but they are *separate* schematic implementations that produce different full-moon dates. So the resemblance to the Hebrew calendar is partly **genetic** (the shared cycle and the Passover anchor) and partly **parallel construction** (two distinct ecclesiastical/rabbinic lunar tables), and the recurring years when Easter and Passover fall oddly relative to each other are the visible trace of that divergence.

Within the calendar lens the computus is therefore the **Christian exemplar of lunisolar reconciliation by computation** — the counterpart to the Hebrew calendar's Metonic intercalation and the Chinese *jiéqì*-keyed leap month — and, through its drift, the historical cause of the [[gregorian-calendar|Gregorian reform]].

## Disputes

- **The Quartodeciman controversy (2nd c.).** Christians in Asia Minor kept Pascha on **14 Nisan** itself, whatever the weekday, following the Jewish date directly; Rome insisted on the following **Sunday**. Polycarp and Anicetus agreed to differ (c. 155), but Victor of Rome later threatened excommunication (c. 190; Eusebius, *Hist. eccl.* 5.23–25). Nicaea (325) settled the principle in favour of Sunday and of a computed, non-Jewish reckoning.
- **The Celtic–Roman Easter and Whitby (664).** The Insular (Irish/British) churches used an older **84-year** Paschal cycle and a different equinox; the Roman mission brought the Alexandrian-Dionysiac **19-year** cycle. The clash was resolved at the **Synod of Whitby (664)** in favour of the Roman reckoning (Bede, *HE* 3.25). *(Whitby has no dedicated event node yet — a known wire-endpoint gap.)*
- **How the 19-year cycle reached Alexandria.** Whether the Alexandrian computists took the Metonic cycle from Greek astronomy directly or through Babylonian–Egyptian intermediaries, and how the Alexandrian and Roman cycles related in the 4th–5th centuries, is reconstructed differently by scholars (Mosshammer 2008).
- **Schematic versus astronomical moon.** The computus's *ecclesiastical* full moon can differ from the true full moon; critics from Roger Bacon (1267) onward attacked the resulting errors, and the debate over whether Easter should be astronomically exact or table-fixed continues into modern reunification proposals. The Gregorian reform of 1582 chose to keep a *table-based* (epact) system rather than switch to observation.

## Refs

1. Wallis, Faith (trans.). *Bede: The Reckoning of Time (De temporum ratione)*. Liverpool University Press, 1999. Tier 1 (the backbone edition and commentary).
2. Mosshammer, Alden A. *The Easter Computus and the Origins of the Christian Era*. Oxford University Press, 2008. Tier 1 (the authoritative monograph).
3. Richards, E.G. *Mapping Time: The Calendar and Its History*. Oxford University Press, 1998. Tier 1 (the arithmetic and the Gregorian connection).
4. Declercq, Georges. *Anno Domini: The Origins of the Christian Era*. Brepols, 2000. Tier 1 (Dionysius Exiguus and the AD era).
5. Blackburn, Bonnie & Holford-Strevens, Leofranc. *The Oxford Companion to the Year*. Oxford University Press, 1999. Tier 1 (worked Easter algorithm, Golden Number, epacts).
