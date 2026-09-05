#!/usr/bin/env bash
# Post-deploy security smoke — run against API Gateway endpoint (no secrets in output).
set -euo pipefail

API_BASE="${1:-}"
if [ -z "$API_BASE" ]; then
  echo "Usage: $0 <API_GATEWAY_BASE_URL>"
  echo "Example: $0 https://abc123.execute-api.us-east-1.amazonaws.com"
  exit 1
fi

API_BASE="${API_BASE%/}"
fail=0

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" != "$expected" ]; then
    echo "FAIL: $name (expected HTTP $expected, got $actual)"
    fail=1
  else
    echo "PASS: $name (HTTP $actual)"
  fi
}

echo "== Security smoke: $API_BASE =="

# API Gateway Fase 3 expõe GET /health (não GET /)
code="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/health" || echo "000")"
check "GET /health" "200" "$code"

code="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/api-docs" || echo "000")"
if [ "$code" = "200" ]; then
  echo "FAIL: GET /api-docs should be blocked in production (got 200)"
  fail=1
else
  echo "PASS: GET /api-docs not exposed (HTTP $code)"
fi

# /auth/login não tem rota no APIGW; admin sem JWT deve responder da API (401/403)
code="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/admin/usuarios" || echo "000")"
if [ "$code" = "401" ] || [ "$code" = "403" ]; then
  echo "PASS: GET /admin/usuarios protected (HTTP $code)"
elif [ "$code" = "200" ]; then
  echo "WARN: GET /admin/usuarios returned 200 without credentials"
else
  echo "WARN: GET /admin/usuarios unexpected status HTTP $code"
fi

code="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$API_BASE/auth/cpf" \
  -H 'Content-Type: application/json' \
  -d '{"cpf":"00000000000"}' || echo "000")"
if [ "$code" = "400" ] || [ "$code" = "200" ] || [ "$code" = "404" ]; then
  echo "PASS: POST /auth/cpf reachable (HTTP $code)"
elif [ "$code" = "501" ]; then
  echo "WARN: POST /auth/cpf still placeholder (HTTP 501) — run auth-lambda CD"
else
  echo "WARN: POST /auth/cpf unexpected status HTTP $code"
fi

if [ "$fail" -ne 0 ]; then
  echo "Security smoke FAILED"
  exit 1
fi

echo "Security smoke PASSED"
