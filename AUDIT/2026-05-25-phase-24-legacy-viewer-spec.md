# Phase 24 — Legacy / Archive Viewer V1 Spec

**Date filed:** 2026-05-25 LATE evening
**Filed by:** watcher-claude-lead (TYRANT remediation Phase 4 Option B execution)
**Greenlit by:** John (2026-05-25, "i will have a new site with all the closed work archived in a legacy button so i can acess and refer")
**Reads-with:** `AUDIT/2026-05-25-foundation-locked-epilogue.md` · `AUDIT/2026-05-25-timeline-v1-spec.md` · `AUDIT/2026-05-25-phase-23-decomposition-spec.md`.

---

## 0. What John asked for (verbatim)

> *"i will have a new site with all the closed work archived in a legacy button so i can acess and refer"*

Phase 24 builds the in-viewer mechanism for that referral.

---

## 1. Scope — V1 only

**V1 is a read-only browser into existing on-disk artifacts.** It surfaces what's already in the vault; it does NOT freeze new snapshots, version data, or change build pipeline.

**Includes (4 categories):**

| Category | Source on disk | V1 surfacing |
|---|---|---|
| **Closed specs** | `AUDIT/forge-rebuild-layered-spec-2026-05-20.md`, `AUDIT/2026-05-25-foundation-locked-epilogue.md`, future `AUDIT/2026-05-25-timeline-v1-spec.md`, `AUDIT/2026-05-25-phase-23-decomposition-spec.md`, `AUDIT/2026-05-25-phase-24-legacy-viewer-spec.md` | List + click-to-open in side panel |
| **Closed audits** | Any `AUDIT/*.md` containing `Status: CLOSED` or `Status: SHIPPED` or marked done | List, filterable by date |
| **Archived STATUS** | `00_meta/status-archive/*.md` (already exists; rolling-window trim) | List by archive file, click to render |
| **Archived HANDOFFs** | `00_meta/HANDOFF-*.md` (historical session handoffs) | List by date |

**Excludes (V1.1+ candidates):**

- **Historical site snapshots** (per `feedback_release_offline_and_snapshots.md` — frozen `data.js` + thumb-bake per release tag). This is its own infrastructure batch; ties to the release-snapshot system that isn't built yet.
- **Per-node history / time-travel.** Would require git-blame indexing or build-pipeline diffing. Not V1.
- **Cross-archive search.** V1 is browse-only; full-text search lives in the main Atlas search.
- **Restoring closed work to active state.** Read-only.

---

## 2. UX

### 2.1 Entry point

A new pill in the existing **side-nav** rail, demoted (similar weight to Pantheon V2 pre-pill). Label: **"Legacy"**. Icon glyph (TBD; candidates: `📚`, `🗄`, or a custom geometric — to be picked with John during implementation).

Click → mounts the Legacy view in the main viewport. Standard view-mount pattern (same as Pantheon V2 / Forge / Astrology). URL hash: `?view=legacy`.

### 2.2 The Legacy view itself

Left column = category list (4 categories above; collapsible). Right column = the rendered doc in markdown.

Three states for the right column:
- **Empty state** (nothing selected): a one-paragraph "Legacy holds the project's closed work. Pick a category on the left and an item from the dropdown." + a date histogram of when closed work landed.
- **Doc selected**: render the file's markdown using existing `marked` (already vendored). Standard typography. Anchors clickable.
- **Click on a wikilink inside the doc**: opens the target node in a side overlay (NOT a navigate-away — preserve legacy context).

### 2.3 Filters

Minimal V1: just a date dropdown ("Last 7 days / Last 30 days / All time"). No tag filter, no text search.

---

## 3. Implementation

### 3.1 Files (Lane B)

- New: `src/js/views/legacy.js` (the view module; should land under ~400 LOC for V1)
- Edit: `src/js/app.js` (add `legacy` to the view registry + nav pill; preserve all existing views)
- Edit: `index.html` (add the side-nav pill DOM if it isn't auto-built; cache-bust)
- Edit: `src/styles/app.css` (Legacy view styles — REUSE existing canonical primitives per SEVERITY DOGMA; do NOT fork)

### 3.2 Data source

V1 reads markdown files via `fetch()` at runtime from their on-disk locations. The list of files is enumerated at build time by a tiny build helper:

- New: `scripts/build_legacy_index.py` — walks `AUDIT/`, `00_meta/status-archive/`, `00_meta/HANDOFF-*.md`, classifies each by category + date, writes `src/data/legacy-index.json`.
- Run as part of the existing build, or manually before each release.

The index is the single source of truth for what's in Legacy. No runtime directory walk.

### 3.3 Constraints

- **Reuse canonical CSS classes.** SEVERITY DOGMA §5.7. No inline styles that mimic existing classes.
- **Lane B serialized.** One ACTIVE-UX slot for this batch.
- **Pre-commit hook gates apply** (linkcheck baseline, lint, dup-id, STATUS-nudge).
- **forge.js NOT touched** by Phase 24. (Phase 23 owns that.)
- **Pantheon V2 / Forge / Timeline V1 NOT regressed.** Preview-verify all three after Phase 24 ships.

---

## 4. Acceptance gates

1. Side-nav has a new "Legacy" pill. Click mounts the view. URL hash round-trips (`?view=legacy`).
2. All 4 categories render their lists with correct items (sample-verified for each: at least 3 specs, 3 archived STATUS files, 3 HANDOFFs, 5 closed audits).
3. Clicking an item renders the markdown in the right column. Wikilinks resolve via overlay (not navigate-away).
4. Date dropdown filters correctly.
5. `preview_screenshot` of `?view=legacy` shows the expected layout with content.
6. Switching back to any other view (Pantheon V2, Forge, Astrology, Scripture Reader) still works — no view-mount regression.
7. Console clean. No new errors.
8. Cache-bust bumped.
9. STATUS entry logged.

---

## 5. Risk

Lowest risk of the four Option-B-package specs. New isolated view; doesn't touch any active engine code; uses existing markdown renderer; data is already on disk.

Only real risk: **the side-nav pill placement is a UX decision** John may want to weigh in on. Recommend showing him a screenshot mid-implementation before final placement is locked.

---

## 6. V1.1 candidates (NOT V1)

- **Release snapshots.** Bake `data.js` + thumb states per release tag; Legacy shows "what the site looked like on 2026-05-20" as a frozen render. Requires release-snapshot infrastructure (`scripts/snapshot.sh` per memory). Higher effort.
- **Per-node history.** Show "this node was first stubbed on date X by handle Y, promoted to metadata on Z." Requires git-history scanning.
- **Annotation overlays.** John or future agents annotate why something was closed.
- **Export legacy as static HTML.** Useful for offline archival / publication.

---

## 7. Estimated budget

| Step | Estimate |
|---|---|
| `scripts/build_legacy_index.py` (Lane B small) | 1 h |
| `src/js/views/legacy.js` core module | 2-3 h |
| `src/js/app.js` integration + nav pill | 30 min |
| `src/styles/app.css` adopt canonical primitives | 30 min |
| Preview-verify + cache-bust + STATUS | 30 min |

**Total Phase 24 V1 budget:** ~5 h focused Lane B in one session.

---

— Phase 24 spec, locked 2026-05-25 LATE evening. Implementation fires when greenlit.
