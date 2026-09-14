#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_FILE="$SCRIPT_DIR/auto-start-hook.sh"
ZSHRC="$HOME/.zshrc"

if [[ ! -f "$ZSHRC" ]]; then
  touch "$ZSHRC"
fi

marker_begin="# >>> nublox-terminal-logging >>>"
marker_end="# <<< nublox-terminal-logging <<<"
source_line="source \"$HOOK_FILE\""

if grep -Fq "$marker_begin" "$ZSHRC"; then
  echo "Auto-start hook already configured in $ZSHRC"
  exit 0
fi

{
  echo
  echo "$marker_begin"
  echo "$source_line"
  echo "$marker_end"
} >>"$ZSHRC"

echo "Enabled auto-start terminal logging in $ZSHRC"
echo "Open a new terminal in this repo to start logging automatically."
