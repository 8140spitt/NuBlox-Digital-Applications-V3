#!/usr/bin/env bash
set -euo pipefail

ZSHRC="$HOME/.zshrc"

if [[ ! -f "$ZSHRC" ]]; then
  echo "No $ZSHRC found. Nothing to disable."
  exit 0
fi

marker_begin="# >>> nublox-terminal-logging >>>"
marker_end="# <<< nublox-terminal-logging <<<"

if ! grep -Fq "$marker_begin" "$ZSHRC"; then
  echo "Auto-start hook not found in $ZSHRC"
  exit 0
fi

awk -v start="$marker_begin" -v end="$marker_end" '
  $0 == start { skip=1; next }
  $0 == end { skip=0; next }
  skip != 1 { print }
' "$ZSHRC" > "$ZSHRC.tmp"

mv "$ZSHRC.tmp" "$ZSHRC"

echo "Disabled auto-start terminal logging in $ZSHRC"
