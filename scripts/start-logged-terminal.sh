#!/bin/zsh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${NUBLOX_TERMINAL_LOG_DIR:-$REPO_ROOT/logs/terminal}"
REDACTOR_BIN="$REPO_ROOT/scripts/redact-terminal-log.sh"

umask 077

SCRIPT_BIN="$(command -v script || true)"
SHELL_BIN="${SHELL:-/bin/zsh}"

if [[ -n "${NUBLOX_WORK_DIR:-}" ]]; then
  if [[ "$NUBLOX_WORK_DIR" = /* ]]; then
    WORK_DIR="$NUBLOX_WORK_DIR"
  else
    WORK_DIR="$REPO_ROOT/$NUBLOX_WORK_DIR"
  fi
else
  WORK_DIR="$REPO_ROOT"
fi

if [[ ! -d "$WORK_DIR" ]]; then
  printf 'Working directory not found: %s\n' "$WORK_DIR" >&2
  exit 1
fi

if [[ -z "$SCRIPT_BIN" || ! -x "$SCRIPT_BIN" ]]; then
  printf 'Required binary not found or not executable: %s\n' "script" >&2
  exit 1
fi

if [[ ! -x "$REDACTOR_BIN" ]]; then
  printf 'Required redaction script not found or not executable: %s\n' "$REDACTOR_BIN" >&2
  exit 1
fi

if [[ ! -x "$SHELL_BIN" ]]; then
  printf 'Required shell not found or not executable: %s\n' "$SHELL_BIN" >&2
  exit 1
fi

mkdir -p "$LOG_DIR"

TIMESTAMP="$(date '+%Y-%m-%d_%H-%M-%S')"
COMMIT="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || printf 'no-git')"
BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || printf 'detached')"
SESSION_PID="$$"
TTY_PATH="$(tty 2>/dev/null || true)"
if [[ "$TTY_PATH" == /dev/* ]]; then
  TTY_NAME="${TTY_PATH##*/}"
else
  TTY_NAME="no-tty"
fi

# mktemp guarantees a unique log file per terminal launch, even if metadata repeats.
# On macOS, the template must end with XXXXXX.
LOG_FILE="$(mktemp "$LOG_DIR/terminal-${TIMESTAMP}-${BRANCH}-${COMMIT}-${TTY_NAME}-${SESSION_PID}-XXXXXX.log")"

printf 'NuBlox terminal logging to: %s\n' "$LOG_FILE"
printf 'Terminal session: %s | PID %s | Git %s (%s)\n' "$TTY_NAME" "$SESSION_PID" "$BRANCH" "$COMMIT"
printf 'Working directory: %s\n' "$WORK_DIR"
if (( $# == 0 )); then
  printf 'Type exit when you want to close this logged terminal session.\n\n'
else
  printf 'Running command in logged shell: %s\n\n' "$*"
fi

cd "$WORK_DIR"
if (( $# == 0 )); then
  "$SCRIPT_BIN" -q /dev/null "$SHELL_BIN" -il | tee >("$REDACTOR_BIN" > "$LOG_FILE")
  exit $?
fi

"$SCRIPT_BIN" -q /dev/null "$SHELL_BIN" -lc "$*" | tee >("$REDACTOR_BIN" > "$LOG_FILE")
