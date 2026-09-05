#!/usr/bin/env bash
# Security gate — dependency audit + secret pattern scan (no secret values in output).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0

echo "== Secret scan (tracked files) =="
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "FAIL: .env is tracked by git"
  fail=1
fi

tracked_env="$(git ls-files '.env.*' 2>/dev/null | grep -v '.env.example' || true)"
if [ -n "$tracked_env" ]; then
  echo "FAIL: tracked env files (excluding .env.example):"
  echo "$tracked_env"
  fail=1
fi

patterns=(
  'AKIA[0-9A-Z]{16}'
  'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY'
  'sk_live_[0-9a-zA-Z]+'
)

for pattern in "${patterns[@]}"; do
  matches="$(git grep -l -E "$pattern" -- ':!*.lock' ':!docs/security/*' ':!*.md' 2>/dev/null || true)"
  if [ -n "$matches" ]; then
    echo "FAIL: high-confidence secret pattern in tracked files:"
    echo "$matches"
    fail=1
  fi
done

echo "== Yarn audit (dependencies, moderate+) =="
audit_out="$(yarn audit --groups dependencies --level moderate 2>&1)" || true
echo "$audit_out"
if echo "$audit_out" | grep -oE '[0-9]+ (Moderate|High|Critical)' | grep -qvE '^0 '; then
  echo "FAIL: yarn audit reported moderate+ vulnerabilities"
  fail=1
fi


if [ "$fail" -ne 0 ]; then
  echo "Security gate FAILED"
  exit 1
fi

echo "Security gate PASSED"
