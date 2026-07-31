#!/usr/bin/env bash
# ============================================================
# deploy.sh — THE one deploy door for codexatlas.org
# (2026-07-31, great-cleanup Phase 0)
#
# Never call `wrangler pages deploy` directly: pushes to the private
# repo are gated by pre-push, but a deploy publishes to the OPEN WEB
# and had no gate at all. This script closes that hole:
#
#   1. build dist/ fresh (build_dist.py — includes the SFW gate)
#   2. run the founder-kit leak audit (incl. its dist/ scan) — hard stop
#   3. only then hand dist/ to Cloudflare Pages
#
# Usage:  bash scripts/deploy.sh
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

echo "── 1/3 building dist/ ──"
python3 scripts/build_dist.py

echo "── 2/3 leak gate (founder kit) ──"
KIT="$HOME/Desktop/PRODUCT DEVELOPMENT/_FOUNDER-PROTOCOL/audit.sh"
if [ ! -f "$KIT" ]; then
  echo "❌ founder kit audit.sh not found — refusing to deploy unscanned." >&2
  exit 1
fi
bash "$KIT" "$(pwd)" || { echo "❌ leak gate failed — DEPLOY ABORTED." >&2; exit 1; }

echo "── 3/3 deploying to Cloudflare Pages ──"
npx wrangler pages deploy dist --project-name codex-atlas
