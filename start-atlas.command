#!/usr/bin/env bash
# Double-click this in Finder to launch Codex Atlas locally.
# Starts the dev server (if not already running) and opens your default browser.
#
# DO NOT open index.html directly from Finder — MapLibre + PMTiles need
# an HTTP server with Range support (file:// can't do that).
#
# Author: opus-map-1, 2026-05-15

set -e
cd "$(dirname "$0")"

PORT=8742
URL="http://localhost:$PORT"

# Already running? Then just open the browser.
if lsof -iTCP:$PORT -sTCP:LISTEN > /dev/null 2>&1; then
  echo "Codex Atlas server already running on port $PORT."
else
  echo "Starting Codex Atlas server on port $PORT..."
  # Start in background, detached from this terminal so closing it doesn't kill the server.
  nohup python3 scripts/serve.py $PORT > /tmp/codex-atlas-server.log 2>&1 &
  disown
  # Wait briefly for the server to bind the port.
  for i in 1 2 3 4 5; do
    if lsof -iTCP:$PORT -sTCP:LISTEN > /dev/null 2>&1; then
      break
    fi
    sleep 0.4
  done
  echo "Server up. Log: /tmp/codex-atlas-server.log"
fi

echo "Opening $URL ..."
open "$URL"
echo ""
echo "To stop the server later, run:  lsof -ti tcp:$PORT | xargs kill"
