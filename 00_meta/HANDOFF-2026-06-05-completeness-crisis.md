# HANDOFF — 2026-06-05 · THE COMPLETENESS CRISIS (read this first, fully)

**State:** everything committed, all gates green, tree clean (only `00_meta/lint-report.md`
auto-churns), site live on :8742. This is a clean, fully-resumable break. But there is a
**conceptual problem that overrides the "product-grade" status below — read §1 before you
trust any "done" claim.**

---

## 1. 🚨🚨 THE CRITICAL PROBLEM — "product-grade" measures QUALITY, not COMPLETENESS

Last session declared **"literature is PRODUCT-GRADE (7/7 scorecard rows green)."** That is
**true for node *quality* and false for corpus *completeness*, and the two were conflated.**

- The document scorecard (`scripts/audit_document_quality.py`, 7 rows: wedge · dates · refs ·
  wires · thin · depth · dupes) grades **every node that EXISTS**. It has **NO way to see a
  MISSING node.** It never asks "is the canon whole?"
- **So the Bible — the project's literal north-star root — is missing ~HALF its books and still
  scores 7/7.** Confirmed gaps (no individual node exists):
  - **ALL 12 Minor Prophets** (Hosea, Joel, Amos, Obadiah, Jonah, Micah, Nahum, Habakkuk,
    Zephaniah, Haggai, Zechariah, Malachi)
  - **Jeremiah** (a *major* prophet)
  - **OT historicals:** Joshua, Judges, Samuel, Esther, Nehemiah
  - **Most NT epistles** individually — 1–2 Corinthians, Galatians, Ephesians, Colossians,
    Thessalonians, Timothy, Titus, Philemon, Hebrews, James, Jude, Johannine letters
    (the Paulines are collapsed into **one** node "Undisputed Pauline Epistles").
  - Present: Pentateuch (as books AND J/E/D/P sources), Isaiah/Ezekiel/Daniel/Lamentations,
    the wisdom books, the 4 Gospels, Acts, Romans, Revelation, the apocrypha (Enoch/Jubilees),
    manuscripts, translations, the Ethiopic canon.
- **The legacy prototype had the IDENTICAL curated Bible** (same node IDs). So this is NOT a V2
  regression — the Bible was **never** complete. It was always a scholarly-curated selection
  (~40 entries), not the 66/73/81-book canon.
- **The deities "9/9 product-grade" has the EXACT same blind spot** — it grades the 61
  Mesopotamian deities that exist, not whether the pantheon is complete (e.g. Sumerian gods are
  *folded into* the "Mesopotamian" family; there is no separate "Sumerian" wedge — Inanna=Ishtar,
  Utu=Shamash, Nanna=Sin, Enki=Ea).

**John's words (2026-06-05):** *"what's the criteria then … when we don't have the Bible here, to
say it's product-grade? this is very critical and fatal."* And: *"FOR ALL RELIGIONS — I'm using
Christianity just as a glaring example."*

**RULE for the fresh agent:** **Do NOT treat "product-grade" / "7/7" / "9/9" as "done."** They
mean "the nodes we have are clean and sourced." They do **NOT** mean the canon/pantheon is
complete. Completeness is an **unmeasured, vault-wide gap.**

---

## 2. THE PLAN (we are in PLANNING MODE — design WITH John, do NOT build blind)

John invoked the membership-vs-wire lesson explicitly: **"we plan first."** Do not restructure
taxonomy or mass-add content without ratifying the design with him.

**The agreed direction:** build a **general "completeness / coverage" audit** — a SECOND bar
next to the quality scorecard:

> For **each tradition** (all 52 religions, not just Christianity): hold the *authoritative*
> canon/pantheon list, and report **exactly which members are missing** as nodes. One row per
> tradition on the DEV → Overview panel. Bible books · Mesopotamian gods · Vedic deities ·
> the Tipiṭaka · the Egyptian funerary corpus · etc.

That turns "is it complete?" from spot-checks into a measurable map. **John's open question to
answer next:** *"want me to build that general coverage audit?"* — he was leaning yes, as the
first concrete step, BEFORE adding any content. Confirm scope with him, then build the read-only
audit first (it's safe — it only reports gaps).

**Design axes John surfaced (all unresolved, all need his ratification):**
- **Fold vs. distinguish** — the Bible folds the Pauline letters into one node; the pantheon
  folds Sumerian into "Mesopotamian." Sometimes the *sub-layer is the prize* (Sumerian = the
  headwater of the whole Near-East→Bible chain; the Ethiopic broader canon = the
  investigation-goldmine inside Christianity). When to split a curated group into its members?
- **Complete vs. curated** — do we fill every canon to completeness (~30 Bible books + more
  across all traditions = a large content effort), or stay curated-scholarly and only guarantee
  the *differentiator* members (deuterocanon, Enoch, Jubilees, Meqabyan) are present?
- **Canon-comparison idea** — one "Bible" wheel where you pick a canon (Protestant 66 · Catholic
  73 · Orthodox ~78 · Ethiopian 81) and included-vs-excluded books light up, so the *differences
  between canons* become the visible investigation. (Requires the complete book list first.)
- **Gnostic placement** — currently `christian-gnosticism` is a SEPARATE religion (Nag Hammadi
  corpus), not under Christianity's 11 corpora. Historically clean, but could be folded under the
  Christianity umbrella for discoverability. John's call.

---

## 3. HOW THE CODEX IS ACTUALLY STRUCTURED (so you can navigate + reason)

- **`window.SCRIPTURE_RELIGIONS`** = 52 religions (christianity, christian-gnosticism,
  esoteric-christianity, judaism, islam, hinduism, buddhism, … mesopotamian, egyptian, norse, …).
- **`window.SCRIPTURE_CORPORA`** = 102 corpora. Structure: **religion → corpora → sections → books.**
- **"All corpora"** view = the full pool of a religion's books; **each tradition/corpus draws its
  subset** (John's own words: *"we keep all the books in All corpora, and then the traditions
  receive the books"*).
- **Christianity has 11 corpora:** `bible` · **`ethiopic-tewahedo-canon`** (13 books — the
  Ethiopian distinctive canon) · `kebra-nagast` · `reformation` · `spanish-mystical` ·
  `patristic-corpus` · `byzantine-orthodox` · `latin-catholic-medieval` · `apostolic-fathers` ·
  `syriac-christianity` · `hesychast-philokalia-corpus`.
  - **To find the Ethiopian canon:** Christianity religion → click the **"Bible" corpus pill** →
    pick **"Ethiopic Tewahedo Broader Canon."** (Also its crossover texts — 1 Enoch, Jubilees,
    Garima Gospels, Mashafa Henok, the 81-book canon — appear inside the default Bible wheel's
    *Apocrypha* + *Canonical Translations & Recensions* wedges.)
- The "Bible" wheel's wedges = **source-critical strata** (Pentateuch J/E/D/P · Former/Latter
  Prophets · Wisdom · Apocrypha · Translations/Recensions · Pre-Gospel Q · Gospels · Pauline),
  NOT denominations. This is the scholarly model and is consistent with the legacy prototype.
- **Deities** view = **families** (the Mesopotamian family folds Sumerian/Akkadian/Babylonian/
  Assyrian — 61 deities).

---

## 4. UX BUGS John reported 2026-06-04/05 — status

1. **#3 CODEX class-pill all-caps — ✅ DONE & verified** (`02feecec`). `.app-pill-class
   .app-pill-label { text-transform:uppercase }`; the codex breadcrumb (Christianity/Bible/Books,
   `#app-pill-codex-*-label`) intentionally left Title Case.
2. **#4 Boards "Add node" did nothing — ✅ DONE & verified** (`5252d348`). Root cause: a
   2026-05-29 module-level `window._boardsControls` export pre-empted `init()`'s
   `if (window._boardsControls) return` guard → `installPill()` never ran → the Add-node
   pill/menu never mounted → right-click `openAddNode()` threw on a null menu. Fix: guard on the
   pill DOM (`#app-pill-boards`) + make init's API export include `openAddNode`. Verified live:
   pill mounts, picker opens with 60 results, clicking a result adds a card.
3. **#1 + #2 — the side panel — ⏳ GREENLIT, NOT YET DONE.** John's spec: **ONE canonical panel
   for EVERY node — thumbnail + description + wires/connections (transmissions). That's it.**
   (option "a".) Confirmed root cause: **`#detail-inner` / `aside.detail` is co-owned by a LEGACY
   `app.js renderDetail()`/`selectNode()` (its empty state literally renders "Select a node to
   inspect.") AND the canonical `src/js/forge/side-panel.js` (the deity inspector, empty state
   "Select a *deity* to inspect.").** That dual-ownership is the "dead prototype panel" John
   smelled. The forge codex click path (`src/js/views/forge.js` ~6532, scriptures mode) DOES set
   `openTabId` + open + render on single click; the empty-panel symptom is the legacy renderer
   leaking in / the entity not resolving. **Fix = decouple the legacy `app.js renderDetail` from
   `#detail-inner` so the canonical `side-panel.js` is the SOLE owner, and confirm it renders any
   node type (it already reads generic fields: title/tradition/body/refs/wires).** Careful —
   `app.js selectNode/renderDetail` is still called from boards/lists, so don't break those.
   - **READ button:** leave the top breadcrumb "Read" alone for now; the real read becomes a
     button *inside* the side panel later (John: *"we will fix the workflow later when we work the
     layout of the scripture"*). Do NOT build READ now.

---

## 5. WHAT THIS SESSION SHIPPED (context — quality work is real, just not "complete")

- **D5 citation-integrity sweep COMPLETE** over the 80 un-audited `full` docs: **33
  fabricated/conflated refs fixed across 25 nodes** (read-only pre-filter + 10-agent grader
  fleet). Method/table: `AUDIT/2026-06-04-citation-sweep.md`.
- **Dev-panel "Citations verified" gauge** (a `citation-audited:` YAML stamp counted by the
  scorecard) — now **112**. Single source of truth, surfaced on DEV → Overview.
- **All 32 literature stubs promoted** in 7 graded batches + Wave-A non-stub fixes → the
  document scorecard reads **7/7 quality rows green** (`productGrade: true`). **~120 new citations
  across the run web-verified real, zero fabrications.** ← *quality only; see §1.*
- **2 UX bugs fixed** (#3, #4 above).
- ~60 commits, all local (NO git remote — John backs up to a hard drive).

---

## 6. TOOLING / GATES / SERVER

- Quality scorecard: `python3 scripts/audit_document_quality.py` (writes
  `src/data/document-product-grade.json`).
- Gates: `python3 build_data.py` → `python3 linkcheck.py --baseline` (**capture the REAL exit
  code — do NOT pipe to `tail`, that masks it**) → `python3 lint_yaml.py`.
- **A double-bracket wikilink token in backtick prose still trips linkcheck** (the documented
  footgun) — write the bare slug in backticks, never the double-bracket form, in handoff/STATUS prose.
- Server: ONE `scripts/serve.py 8742` is canonical. NOTE: the preview tool (`preview_start
  "atlas"`) launches `scripts/serve-node.js` per `.claude/launch.json`; both can bind :8742 (the
  documented split-server footgun). If edits don't appear, reconcile to one server.
- Lanes: content `0N_*` = Lane A; `scripts/`/`src/`/`index.html` = Lane B; **never mix** (the
  pre-commit hook blocks cross-lane). `data.js` is gitignored.

---

## 7. THE ONE-LINE SITUATION

Literature passed a **quality** bar but there is **no completeness bar**, so foundational canons
(the Bible above all, then every other tradition) are **silently half-missing** while the UI says
"product-grade." The next move — **after planning with John** — is a general per-tradition
**coverage audit** that makes the true gap visible, plus the side-panel decoupling (#1/#2,
greenlit). Plan first. Don't trust "done."
