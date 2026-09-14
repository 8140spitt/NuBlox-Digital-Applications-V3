#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$ROOT_DIR/logs/terminal"

session_input="${1:-latest}"

if [[ "$session_input" == "latest" ]]; then
  latest_file="$(ls -t "$LOG_DIR"/*.typescript 2>/dev/null | head -n 1 || true)"
  if [[ -z "$latest_file" ]]; then
    echo "No terminal logs found in $LOG_DIR"
    exit 1
  fi
  session_file="$latest_file"
else
  if [[ -f "$session_input" ]]; then
    session_file="$session_input"
  elif [[ -f "$LOG_DIR/$session_input" ]]; then
    session_file="$LOG_DIR/$session_input"
  else
    echo "Session log not found: $session_input"
    exit 1
  fi
fi

if [[ ! -f "$session_file" ]]; then
  echo "Session file not found: $session_file"
  exit 1
fi

meta_file="${session_file%.typescript}.meta.txt"
rendered_file="${session_file%.typescript}.review.txt"

if [[ -f "$meta_file" ]]; then
  echo "=== Session metadata ==="
  cat "$meta_file"
  echo
fi

# Remove carriage returns and backspace sequences to produce a readable transcript.
col -b < "$session_file" | sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g' > "$rendered_file"

echo "Rendered review file: $rendered_file"
echo "--- Preview (first 120 lines) ---"
sed -n '1,120p' "$rendered_file"
