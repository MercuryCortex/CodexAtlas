# Session handoff — 2026-05-16 evening

**Last opus commit:** `2ce4e70` (Pantheon-v2 Phase C + audit fixes)
**Sub-agent in flight:** `sonnet-pantheon-v2-parity-2` — **LANDED CLEAN at commit `c09ea2b`** before session close. Pre-commit hook passed. Hulls + curved edges + label density + thumbnail card all shipped. Verify visually on resume — should be near-parity with production now. See agent's own summary in the git log message for technique notes (SVG overlay for both hulls and edges, used production's exact `Q mx+(0-mx)*0.35` curve formula).

This is the briefing for the next agent who picks up the Codex Atlas work. Read this top-to-bottom, then `STATUS.md`, then dive in.

---

## 🌍 Where things stand

### Production (untouched, working)
- Pantheon (SVG, D3) — beautiful, deity labels, thumbnail tooltip, hull blocks, force-sim, fluid. **Don't touch — this is the parity target.**
- Timeline, Documents, Scripture, Transmission, Atlas, Astrology (5 modes), Alchemy (card pinboard) — all working.
- The hygiene infrastructure (pre-commit hook + canary checks + AGENTS.md content-agent rule) is doing its job. No site-breakage from parallel content sweeps in the last 3 sessions.

### R&D track — Pantheon-v2 (behind `?webgl=1`)
- Open `http://localhost:8742/?webgl=1` → nav grows "Pantheon v2 ◐" slot.
- Sigma.js + graphology renderer.
- Current parity gate: **9 of 11 ✓** (per the comment header at top of `src/js/views/pantheon-v2.js`).
- After `sonnet-pantheon-v2-parity-2` lands, expect **11 of 11 ✓** modulo the fluid-force-sim layout (which is bonus).

### Routing answer (user's question this session)
**Pantheon-v2 reads `window.VAULT_DATA` — the same `data.js` the production Pantheon reads.** No index split. Content agents commit to `01_*/ … 09_*/` → `build_data.py` rebuilds `data.js` → both views see new content on next load. Zero parallel-work re-routing needed.

---

## 📋 Open queue (priority order)

### A. Verify sub-agent's visual-parity work landed clean

When the `sonnet-pantheon-v2-parity-2` background agent finishes (or has finished already), check:
1. `git log --oneline -5` — look for the commit
2. Open `?webgl=1` in browser; eyeball against the production Pantheon's screenshots John shared (saved in this AUDIT folder if he saved them, otherwise compare against `?webgl=` plain Pantheon side-by-side)
3. The four items the agent was asked to deliver:
   - Hulls (rounded-rect translucent colored blocks per family)
   - Label density bumped (50+ deity labels visible, not just top-12)
   - Curved edges (35% toward center — quadratic Bezier)
   - Thumbnail hover card (image + family + connection count + wiki link)

If parity is now visually close: ship the next item ("flip default? or not?" — that's John's call).
If parity still gaps: log specifics, ask John before more iteration.

### B. Build the DEV PANEL John requested

His exact words: *"I'm going to recommend adding a DEV panel that I can expand to tweak color styles etc as I want so I can tweak styles on the go then report to you to implement."*

The dev panel is a SIDE PANEL the user can toggle (keyboard shortcut: `D` key? or a small ⚙ button bottom-right?) that lets him tweak visual style tokens LIVE without rebuilding. He sees the result instantly, decides what he likes, then tells you "make those values permanent in the CSS."

**Recommended scope for v1:**

| Control | Maps to | Why |
|---|---|---|
| Edge opacity slider (0–1) | `edgeReducer` `out.size` baseline | He'll want to dial down edge density |
| Edge curvature slider (0–60%) | curve-program `curvature` setting | The 35% is a guess; he may want 20 or 50 |
| Node-size multiplier (0.5×–2.5×) | `nodeReducer` `out.size *= K` | Pantheon-v2 dots may be too big or small |
| Label-density threshold | `labelRenderedSizeThreshold` | Live tune which dots get labels |
| Hull opacity (0–0.4) | `.ph2-hulls path` fill-opacity | Hull tint strength |
| Family-color override per family | CSS var per `family_color` | He might want Vedic less orange |
| "Apply to production Pantheon too" toggle | sets `body[data-style-override]` | So tweaks affect the SVG view too |

The dev panel writes its current state to `localStorage` under `codex-atlas/dev-panel-v1`. Persists across reloads. Has a "Copy as CSS / Copy as JSON" button so he can paste the values into a chat with you for implementation.

The dev panel should ONLY be visible when `?dev=1` URL flag is on, OR by pressing a hotkey. Default state: hidden + dormant — production users never see it.

**Implementation:** create `src/js/dev-panel.js` (new file). Wire into `index.html` at the bottom, gated by `URLSearchParams.get('dev') === '1' || URLSearchParams.get('webgl') === '1'`. Build a fixed-position right-side drawer with a header (drag to resize), one row per knob, with the controls listed above.

### C. Production Pantheon hygiene
- Add scorpion deity to the production Pantheon's Mars wedge (Selket landed in `_assets/data/astrology-planet-deities.json` via sonnet-scorpion-1 commit `0663125`, BUT John's screenshots show the production Pantheon doesn't have Selket in the Egyptian wedge — confirm the deity node exists in `03_deities/selket.md` and check why it's not appearing).

### D. Other queue items still open
From the previous handoff at `AUDIT/next-session-queue-2026-05-16.md`:
- Timeline R&D track (same `?webgl=1` pattern, lower priority)
- Mode dropdown port for Pantheon-v2 (deities/authors/symbols/events/monuments)

---

## 🛠️ How to work on this codebase

### Project hygiene (HARD RULES)
- Read `AGENTS.md` end-to-end. It documents the protocol.
- **CONTENT AGENTS DO NOT TOUCH `src/js/`, `src/styles/`, `index.html`, `build_data.py`, `_assets/`, `.claude/`.** Pre-commit hook + canary checks will refuse the commit.
- Work on `main`. Never make a feature branch unless John explicitly asks.
- Commit in tight cycles (after each surgical edit) so attribution stays clean — parallel agents periodically commit-sweep my uncommitted work.

### Cache-bust convention
`index.html` has `?v=<date>-<slug>` query strings on every script + CSS link. Bump to a new slug on every batch (e.g. `20260517-mybatch-1`). The browser revalidates only when the query changes.

### Verify in browser via MCP
The dev server runs at `http://localhost:8742` (Python http.server via `scripts/serve.py`). Use the `mcp__Claude_Preview__` MCP tools (`preview_eval`, `preview_screenshot`, `preview_console_logs`, `preview_resize`) to verify. The serverId is dynamic — call `preview_list` if needed.

### Subagent settings
The permission dogma at `.claude/settings.json` (committed) propagates to all worktrees. Subagents auto-inherit. If a subagent reports permission denials, that's a bug — check `core.hooksPath` and `additionalDirectories`.

---

## 📂 Critical files

| Path | Purpose |
|---|---|
| `src/js/views/pantheon-v2.js` | WebGL Pantheon R&D — the active work |
| `src/js/app.js` | Production app code (~7600 lines). VIEWS object holds every view. |
| `src/styles/app.css` | All CSS (~2700 lines) |
| `data.js` | Generated by `build_data.py` — DO NOT hand-edit |
| `_assets/vendor/sigma/` | sigma.js + graphology |
| `_assets/vendor/elk/` | ELK.js layout engine |
| `_assets/vendor/astronomy/` | astronomy-engine for the Astrology Wheel/Now modes |
| `_assets/data/astrology-decans.json` | Cross-tradition decan table |
| `_assets/data/astrology-planet-deities.json` | Planet-archetype deity map |
| `00_meta/STATUS.md` | Top-line status |
| `00_meta/ACTIVE-AGENTS.md` | In-flight agent claims |
| `AUDIT/` | Audit notes, queue docs, this handoff |
| `~/.claude/projects/-Users-user-Desktop-Codex-Atlas/memory/` | Opus memory — read MEMORY.md first |

---

## 🎯 Recommendation for the next agent

1. Wait for / verify `sonnet-pantheon-v2-parity-2` lands.
2. Open both Pantheons side-by-side, judge visually whether parity is close.
3. If yes: tell John. Ask about flipping default. (Don't flip without his explicit greenlight — first WebGL attempt failed because we did that.)
4. If no: log specifics, do one more iteration of whatever didn't land.
5. **Then build the DEV PANEL** (Spec B above). It'll unblock John from describing visual tweaks verbally; he'll show you values instead.
6. After dev panel: the next big architectural item is the **Timeline R&D track** (same `?webgl=1` pattern). Lower priority — production Timeline isn't yet laggy at current vault scale.

**Don't take on Mode Dropdown / tier-overlay / fluid-force-sim until the user explicitly asks.** Those are nice-to-haves; the parity gate doesn't strictly need them before Pantheon-v2 can be promoted.

Last thing: John works visually. When you ship something, screenshot it. Show him. Words are slow.

— opus session-close, 2026-05-16 evening
