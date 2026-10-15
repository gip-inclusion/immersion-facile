#!/usr/bin/env bash
set -euo pipefail

print_still_running_regularly() {
  while true; do
    sleep 300 </dev/null >/dev/null 2>&1
    echo "> $(date) - Still running: $*"
  done
}

print_still_running_regularly "$@" &
keep_alive_pid=$!
trap 'kill "$keep_alive_pid" 2>/dev/null || true' EXIT

"$@"
