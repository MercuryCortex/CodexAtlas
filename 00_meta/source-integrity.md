# Source Integrity Policy

Every claim in this vault must trace to a referenceable source. No claim hangs in the air.

## Tier system

### Tier 1 — Primary
Direct access to the source text itself, in original language or a critical scholarly translation. The actual evidence.

Examples:
- ETCSL (Electronic Text Corpus of Sumerian Literature, Oxford) — Sumerian texts in transliteration + translation
- CDLI (Cuneiform Digital Library Initiative) — tablet photos, transliterations
- Sefaria (sefaria.org) — Hebrew Bible / Mishnah / Talmud with parallel translations
- Perseus Digital Library (Tufts) — Greek and Latin classical texts
- The Nag Hammadi Library in English (Robinson, ed., Brill / HarperOne)
- Pritchard, *Ancient Near Eastern Texts Relating to the Old Testament* (ANET) — gold-standard translation anthology
- Loeb Classical Library — Greek/Latin facing-page editions
- The Dead Sea Scrolls Digital Library (Israel Antiquities Authority)
- Quran with critical apparatus (e.g., Nasr et al., *The Study Quran*)

### Tier 2 — Scholarly
Peer-reviewed academic work; university-press monographs; named experts citing primary sources.

Examples:
- Mark S. Smith, *The Origins of Biblical Monotheism* (Oxford UP)
- Karen Armstrong, *A History of God* (popular but heavily sourced; treat as Tier 2-3 border)
- Bart D. Ehrman — academic works on early Christianity (Oxford UP, HarperOne academic line)
- Elaine Pagels — *The Gnostic Gospels*, *Beyond Belief* (Princeton)
- Marvin Meyer (ed.) — Nag Hammadi scholarship
- Mary Boyce — Zoroastrian studies (Routledge)
- Wendy Doniger — Hindu mythology and comparative religion (Penguin/Oxford)
- April D. DeConick — Gnostic studies (Rice University)
- Journal articles: *Journal of Biblical Literature*, *Vigiliae Christianae*, *Journal of Near Eastern Studies*, *Numen*, *History of Religions*

### Tier 3 — Reputable secondary
Encyclopedias, vetted summaries, trade books by credentialed authors.

Examples:
- Stanford Encyclopedia of Philosophy (plato.stanford.edu)
- Encyclopaedia Britannica
- Encyclopaedia Iranica
- World History Encyclopedia (worldhistory.org)
- Catholic Encyclopedia (for canonical/historical Christian doctrine, with awareness of confessional bias)
- Jewish Encyclopedia (1906, public domain — historically important even where superseded)
- Internet Sacred Text Archive (sacred-texts.com) — invaluable for older public-domain translations; flag age of translation

### Tier 4 — Controversial / heterodox / fringe
Useful for completeness, the history of ideas, alternative hypotheses, or because they shape popular discourse. **Always tagged `type: controversial`.** A Tier 4 source may not stand alone for a factual claim — it must be balanced by a Tier 1–2 source on the same claim, or the claim must be marked `[contested]`.

Examples:
- Erich von Däniken — ancient astronaut theory
- Zecharia Sitchin — Sumerian-extraterrestrial readings
- Robert Eisenman — James the Just / Qumran reconstructions (heterodox but academically credentialed; some claims contested)
- D.M. Murdock / Acharya S — Jesus-myth / astrotheology
- Manly P. Hall — *The Secret Teachings of All Ages* (occultist synthesis; valuable as a primary source for early-20th-century esoteric thought, not as a scholarly survey)
- Helena Blavatsky / Theosophy texts — same caveat as Hall
- Graham Hancock — alternative prehistory
- Mauro Biglino — Italian "Bible without God" / Elohim-as-aliens readings

We catalog these because they *exist* and influence public discourse. We label them honestly.

## What every ref entry must contain

```yaml
refs:
  - title: "Full citation or article title"
    author: "Last, First (if known)"
    year: 2008
    publisher: "Oxford University Press"      # or journal name
    url: "https://..."                         # direct URL where possible
    type: "primary-translation"                # see types below
    tier: 1                                    # 1 | 2 | 3 | 4
    notes: "optional — translation date, edition, controversy flag"
```

### Allowed `type` values
- `primary-translation` — direct translation of the source text
- `critical-edition` — scholarly edition with apparatus
- `monograph` — book-length scholarly work
- `journal-article` — peer-reviewed
- `encyclopedia` — Tier 3 reference
- `university-repository` — institutional digital library
- `documentary` — film/video
- `lecture` — university lecture series (e.g., Yale Open Courses)
- `controversial` — Tier 4
- `popular` — trade book without strong scholarly apparatus

## URL durability
Prefer URLs that are unlikely to rot:
- DOI links (`https://doi.org/...`) for journal articles
- Stable university repositories (Oxford ETCSL, Perseus, Sefaria, archive.org)
- Wayback Machine snapshots for fragile pages

Avoid bare links to news sites, blogs, or Medium posts as sole evidence.

## Controversy handling

When two reputable sources disagree (common for ancient dates, authorship, contested events):

```markdown
## Disputes
- **Date of composition.**
  - Mary Boyce dates Zoroaster ~1200 BCE on linguistic grounds [ref-1].
  - Traditional Iranian chronology + some scholars place him ~600 BCE [ref-2].
  - We carry the range `-1500` to `-600` in YAML and note both positions here.
```

Always show both sides. The graph carries the *range*; the prose carries the *debate*.
