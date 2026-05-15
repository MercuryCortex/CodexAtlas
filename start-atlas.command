#!/usr/bin/env bash
# Double-click this in Finder to launch Codex Atlas locally.
# Rebuilds data.js from the vault, bumps the cache-bust version,
# starts the server if needed, then opens the browser.
#
# DO NOT open index.html directly — MapLibre + PMTiles need an HTTP
# server with Range support (file:// can't do that).

set -e
cd "$(dirname "$0")"

PORT=8742
URL="http://localhost:$PORT"

# 1. Rebuild data.js from the vault markdown files
echo "Rebuilding vault data..."
python3 build_data.py

# 2. Bump the ?v= cache-bust token in index.html so the browser always
#    downloads the new data.js instead of serving a stale cached copy.
V=$(date +%Y%m%d-%H%M%S)
sed -i '' "s|data\.js?v=[^\"]*|data.js?v=${V}|" index.html
echo "Cache token → ${V}"

# 3. Start the server if it isn't already running.
#    (The Python HTTP server is stateless — no restart needed after rebuild.)
if lsof -iTCP:$PORT -sTCP:LISTEN > /dev/null 2>&1; then
  echo "Server already running on port $PORT."
else
  echo "Starting server on port $PORT..."
  nohup python3 scripts/serve.py $PORT > /tmp/codex-atlas-server.log 2>&1 &
  disown
  for i in 1 2 3 4 5; do
    if lsof -iTCP:$PORT -sTCP:LISTEN > /dev/null 2>&1; then break; fi
    sleep 0.4
  done
  echo "Server up. Log: /tmp/codex-atlas-server.log"
fi

echo "Opening $URL ..."
open "$URL"
echo ""
echo "To stop the server later, run:  lsof -ti tcp:$PORT | xargs kill"
