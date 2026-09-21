#!/bin/zsh
# Auto-start terminal logging when this hook is sourced in an interactive shell.
# Safe-guards prevent recursion when the logged shell starts.

# Only run in interactive shells.
if [[ ! -o interactive ]]; then
  return 0
fi

# Allow explicit opt-out from ~/.zshrc or shell env.
if [[ "${NUBLOX_TERMINAL_LOGGING_DISABLE:-0}" == "1" ]]; then
  return 0
fi

# Prevent recursive wrapping once a logged shell is active.
if [[ -n "${NUBLOX_TERMINAL_LOGGING_ACTIVE:-}" ]]; then
  return 0
fi

HOOK_PATH="${(%):-%x}"
if [[ -z "$HOOK_PATH" ]]; then
  return 0
fi

if [[ "$HOOK_PATH" != /* ]]; then
  HOOK_PATH="$PWD/$HOOK_PATH"
fi

REPO_ROOT="$(cd "$(dirname "$HOOK_PATH")/../.." && pwd)"
START_SCRIPT="$REPO_ROOT/scripts/start-logged-terminal.sh"

if [[ ! -x "$START_SCRIPT" ]]; then
  return 0
fi

if [[ -n "${NUBLOX_TERMINAL_HOOK_DEBUG:-}" ]]; then
  printf 'NuBlox terminal logging hook launching: %s\n' "$START_SCRIPT" >&2
fi

exec "$START_SCRIPT"
