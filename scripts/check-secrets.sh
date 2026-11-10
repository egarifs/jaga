#!/usr/bin/env bash
set -euo pipefail

# Scan staged content only. Exit before commit if likely credentials appear.
files=$(git diff --cached --name-only --diff-filter=ACM -- . ':!*.dc.html' ':!LICENSE' || true)
[ -z "$files" ] && exit 0

pattern='(BEGIN [A-Z0-9 ]*PRIVATE KEY|gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|authorization: *bearer +[A-Za-z0-9._-]{20,}|(api[_-]?key|client[_-]?secret|password|passwd|secret[_-]?key|session[_-]?secret|access[_-]?token|refresh[_-]?token)["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"']?[A-Za-z0-9/+_.-]{8,})'

if git diff --cached --unified=0 -- $files ":(exclude)scripts/check-secrets.sh" ":(exclude)LICENSE" | grep -E -i '^[+]([^+]|$)' | grep -E -i "$pattern" | grep -v -F '${'; then
  echo >&2
  echo 'Commit blocked: possible credential or secret found in staged changes.' >&2
  echo 'Remove secret, rotate exposed credential, then stage again.' >&2
  exit 1
fi
