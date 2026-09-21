#!/bin/zsh
# Compatibility hook sourced by ~/.zshrc in some local environments.
# Workspace-level VS Code settings already launch the logged terminal profile.
# Keep this file lightweight to avoid startup errors or recursive shell wrapping.

if [[ -n "${NUBLOX_TERMINAL_HOOK_DEBUG:-}" ]]; then
  printf 'NuBlox terminal logging hook loaded\n' >&2
fi
