#!/bin/zsh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${NUBLOX_TERMINAL_LOG_DIR:-$REPO_ROOT/logs/terminal}"
MAX_COUNT="${1:-20}"

if [[ ! -d "$LOG_DIR" ]]; then
  printf 'No terminal logs directory found at: %s\n' "$LOG_DIR"
  exit 0
fi

printf 'Latest terminal log files in %s\n\n' "$LOG_DIR"
ls -1t "$LOG_DIR" | head -n "$MAX_COUNT"
