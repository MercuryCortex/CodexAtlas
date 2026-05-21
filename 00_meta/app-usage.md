# Atlas App — Usage & Extension

The vault ships with a self-contained visualization app: `index.html` + `data.js` (auto-generated) + `build_data.py` (Python stdlib, no dependencies). Open the HTML in any browser; no server needed.

## Run it

```bash
cd "~/Desktop/Codex Atlas"
python3 build_data.py        # scans the vault, regenerates data.js
open index.html              # opens in default browser
```

Re-run the build script any time you add or edit a markdown node.

## Views

| Map | What it shows |
|---|---|
| **Pantheon** (default) | Every named deity as a node, clustered by tradition. Edges: syncretic identifications (gold), parent/child (sage), consort (copper). Drag nodes. Zoom and pan. |
| **Timeline** | All datable nodes plotted by `date-composed-earliest`, with Phase bands as backgrounds. Zoom horizontally. |
| **Documents** | Document graph with theme nodes mixed in; edges by influence and shared themes. |
| **Themes** | List of every theme node with attestation counts and category. |
| **Connections** | Every edge in the graph, grouped by edge-type. |
| **Traditions** | Roll-up per tradition: how many documents, deities, persons, themes belong to it. |
| **All nodes** | Flat, searchable, date-sorted index of everything. |
| **About** | Posture, schema notes, source-integrity tiers, edge-type taxonomy. |

## Filters (bottom bar)

- **Tradition** — restrict to nodes from one tradition.
- **Type** — restrict to documents / deities / themes / persons / events.
- **Search** — fuzzy match on title, id, tags, themes.

## Detail panel (right)

Click any node to see:
- YAML pills: type, tradition, date, status, label
- Rendered markdown body (the prose part of the node)
- All references with active URLs and Tier badges (T1–T4)
- Outgoing and incoming edges, grouped by edge-type — click any to jump

## How to add a node

1. Write the markdown file under the right folder, following the appropriate schema in `00_meta/schema-*.md`.
2. Use ``wikilinks`` to reference other nodes — these become edges automatically.
3. Re-run `python3 build_data.py`.
4. Refresh the browser.

## Edge derivation

The build script derives edges from:

- **YAML fields containing wikilinks** — `themes`, `parallels`, `influenced-by`, `influences`, `deities-mentioned`, `events-context`, `attested-in`, `equivalents`, `parent-of`, `child-of`, `consort`, `key-deities`, `key-documents`, `key-persons`, `texts-authored`.
- **Structured `syncretic-edges`** in deity nodes — preserved with the `syncretic-` prefix.
- **`_graph/influences.md`** — every backtick-quoted `[type] source → target` block becomes an edge.

## Data model (what's in `data.js`)

```js
window.VAULT_DATA = {
  generated_at_utc: "2026-05-13T...",
  counts: { document, deity, theme, person, event, tradition, edges },
  nodes: [
    { id, type, title, tradition, tradition_color, label,
      date_earliest, date_latest, region, themes, refs, body, ... }
  ],
  edges: [
    { source, target, type, field|from }
  ],
  traditions: [ { name, color } ]
};
```

## Customization quickstart

- **Tradition colors** — edit the `TRADITION_COLORS` dict near the top of `build_data.py`.
- **CSS palette** — change the `:root` custom properties in `index.html`.
- **Add a view** — add an entry to `VIEWS` in `index.html`, then a matching `<div class="item" data-view="...">` in the nav.

## Roadmap (post-v0.2)

- Geographic-map view (cities of origin plotted on a Mediterranean / Near Eastern map)
- Confidence-weighted edge rendering (consensus solid, contested dashed, fringe ghosted)
- Side-by-side compare (pick two documents → diff their themes / refs / connections)
- Export filtered subgraph as SVG / PNG / GEXF (for Gephi)
- Light-mode theme toggle
- Full-text search across rendered bodies
- Server-side regen on file watch (`build_data.py --watch`)

## Known limitations

- Body markdown uses `marked` for rendering; some Obsidian-specific syntax (callouts, dataview blocks) won't render. ``wikilinks`` are rewritten to in-app clicks.
- Loading from `file://` in some browsers may block CORS for the CDN scripts (D3, marked). If you see a blank canvas, serve locally instead: `python3 -m http.server 8000` then visit `http://localhost:8000`.
