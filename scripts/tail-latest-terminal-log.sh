#!/bin/zsh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${NUBLOX_TERMINAL_LOG_DIR:-$REPO_ROOT/logs/terminal}"
LINES="${1:-200}"

if [[ ! -d "$LOG_DIR" ]]; then
  printf 'No terminal logs directory found at: %s\n' "$LOG_DIR" >&2
  exit 1
fi

LATEST_FILE="$(ls -1t "$LOG_DIR"/*.log(N) 2>/dev/null | head -n 1)"
if [[ -z "$LATEST_FILE" ]]; then
  printf 'No terminal log files found in: %s\n' "$LOG_DIR" >&2
  exit 1
fi

printf 'Tailing latest terminal log: %s\n\n' "$LATEST_FILE"
tail -n "$LINES" -f "$LATEST_FILE"
