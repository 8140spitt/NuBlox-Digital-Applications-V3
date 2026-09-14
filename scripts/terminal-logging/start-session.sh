#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="${1:-$ROOT_DIR/logs/terminal}"

mkdir -p "$LOG_DIR"

if [[ ! -t 0 || ! -t 1 ]]; then
  echo "start-session.sh requires an interactive terminal"
  exit 1
fi

timestamp="$(date +"%Y%m%d-%H%M%S")"
user_name="${USER:-unknown}"
host_name="$(hostname -s 2>/dev/null || hostname)"
base_name="${timestamp}-${user_name}@${host_name}"
log_file="$LOG_DIR/${base_name}.typescript"
meta_file="$LOG_DIR/${base_name}.meta.txt"

current_branch="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"

cat >"$meta_file" <<EOF
session_started: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
repo_root: $ROOT_DIR
working_directory: $PWD
git_branch: $current_branch
terminal_log: $log_file
EOF

echo "Starting terminal recording"
echo "Log file:  $log_file"
echo "Meta file: $meta_file"
echo "Type 'exit' when done to end the recording."

export NUBLOX_TERMINAL_LOG_ACTIVE=1

case "$(uname -s)" in
  Darwin)
    # BSD script on macOS
    script -q "$log_file"
    ;;
  *)
    # util-linux script on Linux
    script -q -f "$log_file"
    ;;
esac

echo "session_ended: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >>"$meta_file"
echo "Recording finished: $log_file"
