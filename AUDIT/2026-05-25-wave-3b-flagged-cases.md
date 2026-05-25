# TYRANT Wave 3b — Flagged Ambiguous Cases

**Date filed:** 2026-05-25 LATE evening
**Filed by:** watcher-claude-lead
**Triggered by:** TYRANT Wave 3b dead-link stub batch. The 12 unambiguous tier-1 documents shipped as stubs; this doc captures the cases that **need John's scholarly call** because the slug itself is ambiguous, malformed, or implies the wrong lens/folder.

---

## The 4 flagged cases

### 1. `phase-3-012-hesychast-controversy` — type mismatch

- **Where referenced:** appears in baseline as dead wikilink target.
- **Issue:** The slug uses the `phase-N-NNN-` prefix that the project reserves for `02_documents/` lens. But **the Hesychast controversy is an event** (14th-century theological dispute, Athonite hesychasts vs. Barlaam-Akindynos faction, settled at the Synods of Constantinople 1341/1347/1351) — it belongs in `05_events/` as `event-hesychast-controversy` or similar.
- **Recommendation:** rewrite the dead wikilink(s) to point at the correct event slug (create event node if missing). DO NOT create a document stub at `phase-3-012-hesychast-controversy.md` since that would mis-categorize.

### 2. `phase-5-x-zohar` — placeholder slug number

- **Issue:** The slug contains literal `x` instead of a number (`phase-5-x-`). This is a template-placeholder that someone wrote into prose, not a real intended slug.
- **Real intended target:** **the Zohar** (Sefer ha-Zohar), composed late-13th century by Moses de León in Castile (or, on his own claim, transmitted from Shimon bar Yochai 2nd c. CE). Already-existing-document check: no `phase-5-NNN-zohar.md` found in `_phase-5-medieval/`. A proper Zohar stub should land at a real `phase-5-NNN-zohar.md` slug (pick the next free number in the medieval-phase sequence).
- **Recommendation:** John picks the canonical slug number. Then I (or next agent) stub it like the 12 documents Wave 3b just shipped.

### 3. `phase-8-001-blake-songs-of-innocence-experience` — wrong phase folder

- **Issue:** Phase 8 in this vault is `_phase-8-non-western-traditional/`. **Blake (1757-1827) is English Romantic/Pre-Romantic, not non-western.** *Songs of Innocence and of Experience* (1789/1794) belongs in `_phase-6-early-modern/` (or `_phase-7-modern/` depending on the cutoff convention).
- **Recommendation:** decide the right phase folder + slug number, then stub. The dead wikilink referencing `phase-8-001-blake-songs-of-innocence-experience` will need to be rewritten to the new slug after the stub lands.

### 4. `phase-2-baruch` — missing slug number

- **Issue:** No NNN number; slug is incomplete. Real intended target: **the Book of Baruch** (deuterocanonical, c. -200 to -100 BCE in its received Greek form, though traditionally attributed to Baruch ben Neriah, Jeremiah's scribe ~ -580 BCE).
- **Where it belongs:** boundary between Phase 2 (axial-age) and Phase 3 (hellenistic-second-temple). The Hellenistic dating points to **Phase 3**. So the canonical slug is likely `phase-3-NNN-baruch` (or `phase-3-NNN-book-of-baruch`).
- **Recommendation:** John picks the canonical phase + number. Then stub.

---

## What does NOT need John's call

The other ~10 Wave 3b ambiguities the previous agent worried about (e.g. *"is `phase-2-job` canonically the SAME node as `phase-2-035-job`?"*) were resolved by **Wave 3a's slug-drift sweep** — when an existing canonical doc with a different number exists, the wikilink gets pointed at the canonical one, and the `phase-N-mismatch-num-*` reference disappears from the dead-link baseline. That was 37 high-confidence fixes in commit `704b114`. The remainder in Wave 3b were the genuinely-missing tier-1 documents, of which 12 are now stubbed and 4 are flagged here.

---

## Action for John

When you have a minute:

- **#1 (hesychast)**: tell me "rewrite to event-NNN-hesychast-controversy" + I'll find the dead wikilink and fix it.
- **#2 (zohar)**: tell me a number ("phase-5-NNN-zohar") and I'll stub.
- **#3 (blake)**: tell me phase + number and I'll stub.
- **#4 (baruch)**: tell me phase + number and I'll stub.

Each of these closes another ~1-4 dead-link occurrences. Total potential drop: −5 to −10 targets after all four are resolved.

---

— Wave 3b flagged-cases doc, filed 2026-05-25 LATE evening. Append-only after John signs.
