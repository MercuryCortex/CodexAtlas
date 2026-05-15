# How to Open Codex Atlas

> Plain-English guide — no terminal knowledge required.

---

## Every day / every time you want to use the app

**Step 1 — Start the server**

Double-click **`start-atlas.command`** in this folder.

A black terminal window will open and show something like:
```
Serving Codex Atlas at http://localhost:8742
```
That means it's running. **Leave the terminal window open.** If you close it, the app stops.

---

**Step 2 — Open the app in your browser**

Open any browser — Safari, Chrome, Firefox, anything.

Type this in the address bar and press Enter:

```
http://localhost:8742
```

The Codex Atlas app will load.

---

**Step 3 — When you're done**

Close the black terminal window (or click inside it and press **Control + C**).

---

## Which browser?

Any. The app is a standard web page — it works the same in Safari, Chrome, Firefox, Arc, Brave, Edge. There is no preference. Chrome is not required.

---

## The app shows a blank map (Atlas tab) — what's wrong?

The Atlas tab uses a map file (`world-z7.pmtiles`, ~185 MB) stored in the `_assets/basemap/` folder. If that file is missing:

1. Open Terminal
2. Run: `cd "~/Desktop/Codex Atlas" && bash scripts/fetch-basemap.sh`
3. Wait ~10 minutes for the download
4. Restart the server (Step 1 above)

---

## The data looks out of date — how do I rebuild?

If you've added new content to the vault (Markdown files), refresh the app's data:

1. Open Terminal
2. Run: `cd "~/Desktop/Codex Atlas" && python3 build_data.py`
3. Refresh the browser tab

---

## Versions / checkpoints

Git tracks all changes. Key saved checkpoints (use `git tag` to see them):

| Tag | What it marks |
|---|---|
| `checkpoint-map-v2-working` | Last stable version — MapLibre atlas working, all views OK (2026-05-15) |

To go back to a checkpoint in an emergency, ask Claude Code to restore it — don't do it manually.

---

## Who to ask for help

Claude Code (via the Claude desktop app or CLI) can explain anything in this folder, fix broken features, and add new vault content. Just describe what's wrong or what you want.
