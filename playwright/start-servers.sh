#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="$SCRIPT_DIR/.container-state.json"

if [ -f "$STATE_FILE" ]; then
  export DATABASE_URL=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$STATE_FILE', 'utf-8')).connectionUri)")
  echo "Using DATABASE_URL from testcontainer: $DATABASE_URL"
fi

cd "$SCRIPT_DIR/.."
exec pnpm dev
