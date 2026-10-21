#!/bin/bash
# Mac: watch GitHub, git pull the moment the branch changes, then tell Syncthing to rescan.
# Setup (once):
#   1. Syncthing web page -> Actions -> Settings -> General -> copy "API Key"
#   2. export SYNCTHING_API_KEY="paste-it-here"   (put this line in ~/.zshrc to keep it)
#   3. chmod +x scripts/autopull-mac.sh && ./scripts/autopull-mac.sh
# Leave it running in a terminal tab.

BRANCH="${BRANCH:-claude/serene-heisenberg-zk8o4b}"
FOLDER_ID="${FOLDER_ID:-z4b5t-xuwzr}"          # Syncthing folder ID of stream-dashboard-opencode
ST_URL="${ST_URL:-http://127.0.0.1:8384}"
EVERY="${EVERY:-5}"                              # seconds between checks (one tiny request each)

cd "$(dirname "$0")/.." || exit 1
[ -n "$SYNCTHING_API_KEY" ] || { echo "Set SYNCTHING_API_KEY first (see top of this file)"; exit 1; }
echo "Watching origin/$BRANCH every ${EVERY}s. Ctrl+C to stop."

while true; do
  remote=$(git ls-remote origin "refs/heads/$BRANCH" 2>/dev/null | cut -f1)
  local=$(git rev-parse HEAD)
  if [ -n "$remote" ] && [ "$remote" != "$local" ]; then
    echo "$(date +%H:%M:%S) change on GitHub, pulling..."
    if git pull --ff-only -q origin "$BRANCH"; then
      curl -s -o /dev/null -X POST -H "X-API-Key: $SYNCTHING_API_KEY" "$ST_URL/rest/db/scan?folder=$FOLDER_ID" \
        && echo "$(date +%H:%M:%S) pulled + Syncthing rescan sent"
    else
      echo "$(date +%H:%M:%S) pull failed (local edits in the way?)"
    fi
  fi
  sleep "$EVERY"
done
