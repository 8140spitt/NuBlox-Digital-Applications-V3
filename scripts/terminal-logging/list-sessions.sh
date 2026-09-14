#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="${1:-$ROOT_DIR/logs/terminal}"

if [[ ! -d "$LOG_DIR" ]]; then
  echo "No log directory found: $LOG_DIR"
  exit 0
fi

shopt -s nullglob
logs=("$LOG_DIR"/*.typescript)
shopt -u nullglob

if (( ${#logs[@]} == 0 )); then
  echo "No terminal session logs found in $LOG_DIR"
  exit 0
fi

printf "%-23s %-12s %s\n" "DATE" "SIZE" "FILE"
for log in "${logs[@]}"; do
  date_value="$(date -r "$log" +"%Y-%m-%d %H:%M:%S")"
  size_value="$(du -h "$log" | awk '{print $1}')"
  file_name="$(basename "$log")"
  printf "%-23s %-12s %s\n" "$date_value" "$size_value" "$file_name"
done | sort -r
