#!/usr/bin/env bash
# fetch-basemap.sh — one-time offline-basemap setup for the Atlas Map view.
#
# Pulls the latest Protomaps daily world build, extracts z0-z7 into
# _assets/basemap/world-z7.pmtiles (~185 MB), and stages the pmtiles CLI
# into _assets/vendor/bin/.
#
# Both targets are gitignored. Re-run any time the basemap needs refreshing
# (Protomaps publishes daily; weekly cadence is plenty for ancient-history use).
#
# Author: opus-map-1, 2026-05-15

set -euo pipefail

cd "$(dirname "$0")/.."

PMTILES_VERSION="1.30.2"
BASEMAP_ZOOM_MAX=7
VENDOR_BIN="_assets/vendor/bin"
BASEMAP_DIR="_assets/basemap"

mkdir -p "$VENDOR_BIN" "$BASEMAP_DIR"

# 1. Resolve arch + OS for pmtiles CLI download.
case "$(uname -s)" in
  Darwin) os="Darwin" ;;
  Linux)  os="Linux"  ;;
  *) echo "fetch-basemap: unsupported OS $(uname -s)" >&2; exit 1 ;;
esac
case "$(uname -m)" in
  arm64|aarch64) arch="arm64" ;;
  x86_64)        arch="x86_64" ;;
  *) echo "fetch-basemap: unsupported arch $(uname -m)" >&2; exit 1 ;;
esac

PMTILES_BIN="$VENDOR_BIN/pmtiles"
if [ ! -x "$PMTILES_BIN" ]; then
  echo "==> Installing pmtiles CLI v${PMTILES_VERSION} (${os} ${arch})"
  if [ "$os" = "Darwin" ]; then
    asset="go-pmtiles-${PMTILES_VERSION}_${os}_${arch}.zip"
  else
    asset="go-pmtiles_${PMTILES_VERSION}_${os}_${arch}.tar.gz"
  fi
  url="https://github.com/protomaps/go-pmtiles/releases/download/v${PMTILES_VERSION}/${asset}"
  tmpdir="$(mktemp -d)"
  curl -sL -o "$tmpdir/$asset" "$url"
  if [[ "$asset" == *.zip ]]; then
    (cd "$tmpdir" && unzip -q "$asset")
  else
    (cd "$tmpdir" && tar -xzf "$asset")
  fi
  mv "$tmpdir/pmtiles" "$PMTILES_BIN"
  chmod +x "$PMTILES_BIN"
  rm -rf "$tmpdir"
fi

# 2. Resolve a recent daily build (today, then walk back up to 14 days).
echo "==> Resolving latest Protomaps daily build"
build_date=""
for offset in $(seq 0 14); do
  d=$(date -v "-${offset}d" +%Y%m%d 2>/dev/null || date -d "${offset} days ago" +%Y%m%d)
  if curl -sI -o /dev/null -w "%{http_code}" --max-time 8 "https://build.protomaps.com/${d}.pmtiles" | grep -q '^200$'; then
    build_date="$d"
    break
  fi
done
if [ -z "$build_date" ]; then
  echo "fetch-basemap: no Protomaps daily build found in the last 14 days." >&2
  echo "fetch-basemap: check https://maps.protomaps.com/builds.html for status." >&2
  exit 1
fi
echo "    Latest build: ${build_date}"

# 3. Extract z0-z${BASEMAP_ZOOM_MAX} world subset (HTTP Range fetch — no full download).
OUT="${BASEMAP_DIR}/world-z${BASEMAP_ZOOM_MAX}.pmtiles"
echo "==> Extracting z0-z${BASEMAP_ZOOM_MAX} world to ${OUT}"
"$PMTILES_BIN" extract \
  "https://build.protomaps.com/${build_date}.pmtiles" \
  "$OUT" \
  --minzoom=0 --maxzoom=${BASEMAP_ZOOM_MAX} \
  --download-threads=8 \
  --overfetch=0.05

# 4. Verify.
echo "==> Verifying"
"$PMTILES_BIN" show "$OUT" | head -10
echo
echo "OK. Basemap ready at $OUT"
echo "    Size: $(du -h "$OUT" | cut -f1)"
echo "    Source build: ${build_date}"
