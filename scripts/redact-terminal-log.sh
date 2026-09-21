#!/bin/zsh
set -euo pipefail

# Redact common secrets from terminal streams before writing logs.
perl -pe '
BEGIN { $| = 1; $in_private_key = 0; }

if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/) {
  $in_private_key = 1;
  $_ = "[REDACTED_PRIVATE_KEY_BLOCK]\n";
} elsif ($in_private_key) {
  if (/-----END [A-Z ]*PRIVATE KEY-----/) {
    $in_private_key = 0;
  }
  $_ = "";
}

s/(Authorization:\s*(?:Bearer|Token)\s+)[^\s"\047]+/${1}[REDACTED]/ig;
s#(\b[a-z][a-z0-9+.-]*://[^/\s:@]+:)[^@\s/]+(@)#${1}[REDACTED]${2}#ig;
s/(\b(?:api[_-]?key|access[_-]?key|token|secret|password|passwd|pwd|client[_-]?secret|private[_-]?key|database[_-]?url)\b\s*[:=]\s*)(\"[^\"]*\"|\047[^\047]*\047|[^\s]+)/${1}[REDACTED]/ig;
s/(AKIA|ASIA)[A-Z0-9]{16}/[REDACTED_AWS_KEY]/g;
s/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/[REDACTED_GITHUB_TOKEN]/g;
s/\bglpat-[A-Za-z0-9_-]{20,}\b/[REDACTED_GITLAB_TOKEN]/g;
s/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/[REDACTED_SLACK_TOKEN]/g;
s/\bAIza[0-9A-Za-z_-]{35}\b/[REDACTED_GOOGLE_API_KEY]/g;
s/\b(?:eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9._-]{8,}\.[A-Za-z0-9._-]{8,})\b/[REDACTED_JWT]/g;
'
