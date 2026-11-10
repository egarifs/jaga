#!/usr/bin/env bash
set -euo pipefail

# Scan staged content only. Exit before commit if likely credentials appear.
files=$(git diff --cached --name-only --diff-filter=ACM -- . ':!*.dc.html' ':!LICENSE' || true)
[ -z "$files" ] && exit 0

pattern='(BEGIN [A-Z0-9 ]*PRIVATE KEY|api[_-]?key|client[_-]?secret|password|passwd|secret[_-]?key|access[_-]?token|refresh[_-]?token|authorization: *bearer|gh[pousr]_[A-Za-z0-9_]+|sk-[A-Za-z0-9]{20,})'

if git diff --cached --unified=0 -- $files ":(exclude)scripts/check-secrets.sh" ":(exclude)LICENSE" | grep -E -i '^[+]([^+]|$)' | grep -E -i "$pattern"; then
  echo >&2
  echo 'Commit blocked: possible credential or secret found in staged changes.' >&2
  echo 'Remove secret, rotate exposed credential, then stage again.' >&2
  exit 1
fi
