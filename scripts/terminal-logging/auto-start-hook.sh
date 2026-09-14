#!/usr/bin/env bash
# Source this from your shell rc file to auto-start terminal logging in this repo.

if [[ -z "${BASH_VERSION:-}" && -z "${ZSH_VERSION:-}" ]]; then
  return 0 2>/dev/null || exit 0
fi

# Interactive shells only.
if [[ "$-" != *i* ]]; then
  return 0 2>/dev/null || exit 0
fi

if [[ ! -t 0 || ! -t 1 ]]; then
  return 0 2>/dev/null || exit 0
fi

if [[ -n "${BASH_VERSION:-}" ]]; then
  source_file="${BASH_SOURCE[0]}"
elif [[ -n "${ZSH_VERSION:-}" ]]; then
  source_file="${(%):-%N}"
else
  return 0 2>/dev/null || exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$source_file")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
START_SCRIPT="$SCRIPT_DIR/start-session.sh"

if [[ ! -x "$START_SCRIPT" ]]; then
  return 0 2>/dev/null || exit 0
fi

if ! command -v script >/dev/null 2>&1; then
  return 0 2>/dev/null || exit 0
fi

# Prevent recursion from script-launched child shells.
if [[ "${NUBLOX_TERMINAL_LOG_ACTIVE:-}" == "1" ]]; then
  return 0 2>/dev/null || exit 0
fi

parent_cmd="$(ps -o comm= -p "$PPID" 2>/dev/null | awk '{print $1}')"
if [[ "$parent_cmd" == "script" || "$parent_cmd" == "/usr/bin/script" ]]; then
  return 0 2>/dev/null || exit 0
fi

# Auto-start only when terminal opens inside this repo tree.
case "$PWD/" in
  "$ROOT_DIR"/*|"$ROOT_DIR/")
    ;;
  *)
    return 0 2>/dev/null || exit 0
    ;;
esac

NUBLOX_TERMINAL_LOG_ACTIVE=1 exec "$START_SCRIPT" "$ROOT_DIR/logs/terminal"
