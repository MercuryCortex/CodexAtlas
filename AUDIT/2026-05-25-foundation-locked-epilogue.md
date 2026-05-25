# Foundation Rebuild — LOCKED EPILOGUE

**Date filed:** 2026-05-25 LATE evening
**Filed by:** watcher-claude-lead (TYRANT remediation Phase 4 Option B execution)
**Greenlit by:** John ("B - whats the worflow?")
**Status of `AUDIT/forge-rebuild-layered-spec-2026-05-20.md`:** **CLOSED — FOUNDATION LOCKED.** Append-only after sign-off, per HOW-WE-WORK §9.

---

## What the rebuild spec promised vs what shipped

| Phase | Spec promise | Shipped | Commit |
|---|---|---|---|
| 0 | Panel-delete + clean slate | ✅ | `ba78863` 2026-05-20 |
| 1 | NODE atom (primitive) | ✅ | (Phase 1A audit + 1B implementation) 2026-05-20 |
| 2 | BEHAVIORS (hover/click/state/fade) | ✅ | Phase 2A + 2B 2026-05-20 |
| 3 | WIRES (edge bucket palette + depth + gradient + fade) | ✅ | Phase 3A + 3B 2026-05-20 |
| 4 | FX (glow + glyphs + labels + atlas) | ✅ | Phase 4A + 4B 2026-05-20 + 4B-fix glow + 4B-cullfix |
| 5 | MANAGEMENT (camera + mode-switch + search + scrubber + persistence + nav) | ✅ | Phase 5A + 5B + 5C `bbff608` 2026-05-20 |
| 6 | TAIL POLISH (autonomous backlog exhaustion) | ❌ never started under this label | — |

**Phases 0–5 are LOCKED.** The 5C commit (`Phase 5C — node + glyph opacity UNIFIED on GPU`) is the canonical Foundation-end marker.

## What happened to Phase 6

The TAIL POLISH phase, as originally scoped (hull jitter, custom cursor, label hierarchy, camera tuning, monolith decomposition), **never started under the rebuild label**. Instead, 41 commits 2026-05-19 → 2026-05-25 labeled Phase 22-M → 22-AH delivered a different scope: timeline mode hardening, calendar registry, dating-basis framework, bottom-toolbar canonical architecture.

The TYRANT audit (2026-05-25) surfaced this as finding #6 — "Forge rebuild Phase 6 never started, replaced by 41-commit Phase 22 timeline sidetrack." John resolved the ambiguity 2026-05-25 with **Option B**: declare the Foundation locked, formalize the Phase 22 work as its own track, carve out a separate decomposition track.

## What the rebuild spec does NOT cover anymore

- **Timeline mode work** is now `AUDIT/2026-05-25-timeline-v1-spec.md` (Timeline V1).
- **`forge.js` monolith decomposition** is now `AUDIT/2026-05-25-phase-23-decomposition-spec.md` (Phase 23 — Forge monolith decomposition).
- **Hull jitter / custom cursor / label hierarchy / camera tuning** — items from the original Phase 6 backlog — are deferred. They may resurface as Timeline V1.N or Phase 23.N sub-items, or as their own future spec, depending on user priorities.

## What stays load-bearing from this spec

The **layered-rebuild discipline** that worked through Phases 0–5 — micro-audit per sub-phase, acceptance gate per phase, one commit per sub-phase, slot-claim per phase, spec-lock header section in the file — is the canonical pattern for Phase 23 and Timeline V1.N work going forward.

## What this epilogue does NOT do

Does not delete or supersede any content in the rebuild spec. The full 7-section spec body is preserved for reference. This epilogue only adds the close-out marker and the forwarding pointers.

---

**Signed-off lock:** the rebuild Foundation is the rebuild Foundation. Future engine-layer changes (Forge's NODE / BEHAVIORS / WIRES / FX / MANAGEMENT primitives) reference this locked spec; they do not modify it.

— Foundation epilogue, locked 2026-05-25 LATE evening.
