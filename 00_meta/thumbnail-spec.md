# Thumbnail System — Specification

The atlas shows one image per node in the detail panel. Images come from three
sources (in priority order): curated `depictions` YAML, auto-fetched Wikipedia
cache, and class-specific SVG placeholders. This document defines the rules for
every layer of that system.

---

## 1. Source priority

1. **`depictions[0].src`** in node YAML — agent- or human-curated, always wins.
2. **`_assets/thumbs_cache.json`** — auto-fetched by `fetch_thumbnails.py`.
3. **`_assets/placeholders/class-<type>.svg`** — fallback when both above are
   absent or fail to load.

---

## 2. Auto-fetch rules (`fetch_thumbnails.py`)

The script queries the Wikipedia REST summary API. Four conservative gates filter
every candidate hit:

| Gate | Rule |
|---|---|
| **Title similarity** | `difflib.SequenceMatcher` ratio between our query and the Wikipedia returned title must be ≥ 0.55. Bypassed for OVERRIDES entries. |
| **Extract length** | Wikipedia extract must be ≥ 60 characters. Shorter = disambiguation stub. |
| **Relevance keywords** | For `deity` nodes: extract must contain at least one religion/mythology keyword. For `person` nodes: extract must contain at least one philosophy/theology/religion keyword. Prevents ancient names from resolving to living athletes or politicians. |
| **Image size** | Thumbnail width must be ≥ 100 px. Rejects logos and tiny icons. |

**Opensearch fallback (Pass 2)** is permitted only for `document` type nodes.
It is disabled for all other types (deity, person, event, theme, tradition,
symbol) because fuzzy search reliably returns wrong matches.

### Running the fetcher

```bash
python3 fetch_thumbnails.py              # incremental — skips cached entries
python3 fetch_thumbnails.py --refetch    # retry null entries (use after adding OVERRIDES)
python3 fetch_thumbnails.py --force      # re-fetch everything
python3 fetch_thumbnails.py --force-type deity   # wipe + re-fetch one type
```

After fetching, always run `python3 build_data.py` to inline the cache into
`data.js`.

---

## 3. Manual overrides

When Wikipedia's article title differs from our node title, add an entry to the
`OVERRIDES` dict at the top of `fetch_thumbnails.py`:

```python
OVERRIDES = {
    "node-slug": "Wikipedia Article Title",
    ...
}
```

OVERRIDES entries bypass the title-similarity gate — they are trusted. Use them
when:
- The Wikipedia article has a disambiguator we don't use (`"Anu"` → `"An (deity)"`)
- Our title has diacritics or alternate forms Wikipedia doesn't index
- The correct article has a completely different name from our node

---

## 4. Curated images (`depictions` YAML field)

When the best image is not on Wikipedia (museum databases, Wikimedia Commons,
scholarly scans), add a `depictions` block to the node YAML. `depictions[0]`
takes precedence over the Wikipedia cache:

```yaml
depictions:
  - src: "https://upload.wikimedia.org/wikipedia/commons/.../image.jpg"
    caption: "Relief of Enki, Ur III period"
    source: "British Museum"
    license: "CC BY-SA 4.0"
```

Fields:
- `src` — direct image URL (required)
- `caption` — short descriptive label (shown in attribution bar)
- `source` — institution or database (optional)
- `license` — copyright status (optional)

**Agent rule:** never set a `thumbnail` field directly in node YAML. The
`thumbnail` key is injected by `build_data.py` from the cache. Use `depictions`
for curated overrides.

---

## 5. Placeholder SVGs

Located at `_assets/placeholders/`. One file per node class:

| File | Class | Icon motif |
|---|---|---|
| `class-person.svg` | person | Bust silhouette in portrait frame |
| `class-deity.svg` | deity | Solar mandala with 8 rays |
| `class-document.svg` | document | Scroll with rod caps |
| `class-event.svg` | event | Hourglass |
| `class-theme.svg` | theme | Three interlocking circles |
| `class-tradition.svg` | tradition | Portico arch |
| `class-symbol.svg` | symbol | 8-pointed star in circle |

The app renders the placeholder when:
- `thumbSrc` is absent (node has neither `depictions` nor a cached thumbnail)
- `thumbSrc` is present but the image fails to load (`onerror` fallback)

**Tradition-specific placeholders** (future): if a file named
`_assets/placeholders/trad-<tradition-slug>.svg` exists, the app can
preferentially serve it for nodes of that tradition. Not yet wired; placeholder
design defines the naming convention.

**Replacing stubs:** the current SVGs are minimal geometric placeholders. John
can replace any file with a designed version — the naming convention is the
contract, not the contents.

---

## 6. Curation review workflow

Run `python3 review_thumbnails.py` to generate `00_meta/THUMBNAILS-REVIEW.md`.

The file has two sections per node type:

- **Nulls** — nodes with no cached image. Each row has a pre-filled Wikipedia
  search link. Click it, find the right article, add to OVERRIDES.
- **Suspects** — nodes where the cached image came from a Wikipedia article
  whose title has low similarity to ours. Verify the thumbnail URL; if wrong,
  add to OVERRIDES.

Re-run the review file after each OVERRIDES batch to track progress.

---

## 7. Agent rules (non-negotiable)

1. **Never write `thumbnail:` into node YAML.** That field is owned by
   `build_data.py`. Writing it manually causes stale/wrong images that survive
   cache refreshes.
2. **Never edit `_assets/thumbs_cache.json` directly.** It is generated output.
3. **Always use `depictions[]` for curated image overrides**, not inline `thumbnail:`.
4. **After adding OVERRIDES, run `--refetch` then `build_data.py`** before
   committing, so the cache and `data.js` reflect your additions.
5. **Do not expand `fetch_thumbnails.py` opensearch** to non-document types
   without a strong, per-type justification — the wrong-image rate is too high.
