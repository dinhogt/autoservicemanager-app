#!/usr/bin/env bash
# Smoke test das 7 APIs obrigatórias da Fase 2 (requer API + DB com seed).
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:30080}"
ADMIN_EMAIL="${ADMIN_EMAIL:-joao.silva@autoservice.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Senha@1234}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-local-webhook-secret-min-16}"

CLIENTE_ID="${CLIENTE_ID:-550e8400-e29b-41d4-a716-446655440101}"
VEICULO_ID="${VEICULO_ID:-550e8400-e29b-41d4-a716-446655440201}"
SERVICO_ID="${SERVICO_ID:-550e8400-e29b-41d4-a716-446655440301}"
CPF_CNPJ="${CPF_CNPJ:-52998224725}"

pass=0
fail=0

check() {
  local name="$1"
  local code="$2"
  local expected="$3"
  if [[ "${code}" == "${expected}" ]]; then
    echo "  OK   ${name} (HTTP ${code})"
    pass=$((pass + 1))
  else
    echo "  FAIL ${name} (esperado ${expected}, obteve ${code})" >&2
    fail=$((fail + 1))
  fi
}

echo "Smoke test Fase 2 — ${BASE_URL}"
echo ""

echo "[0] Health check"
code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/")
check "GET /" "${code}" "200"

echo "[1] Login admin"
login_resp=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")
code=$(echo "${login_resp}" | tail -1)
body=$(echo "${login_resp}" | sed '$d')
check "POST /auth/login" "${code}" "201"
TOKEN=$(echo "${body}" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || echo "")

if [[ -z "${TOKEN}" ]]; then
  echo "Erro: não foi possível obter JWT. Execute 'yarn db:seed' com DATABASE_URL apontando para o MySQL." >&2
  exit 1
fi

echo "[2] Abertura de OS"
create_resp=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/ordens-servico" \
  -H "Content-Type: application/json" \
  -d "{\"clienteId\":\"${CLIENTE_ID}\",\"veiculoId\":\"${VEICULO_ID}\",\"itensServico\":[{\"servicoCatalogoId\":\"${SERVICO_ID}\",\"quantidade\":1}]}")
code=$(echo "${create_resp}" | tail -1)
body=$(echo "${create_resp}" | sed '$d')
check "POST /ordens-servico" "${code}" "201"
OS_ID=$(echo "${body}" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

echo "[3] Consulta de status"
code=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL}/ordens-servico/${OS_ID}/status?cpfCnpj=${CPF_CNPJ}")
check "GET /ordens-servico/:id/status" "${code}" "200"

echo "[4] Diagnóstico + orçamento (admin)"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "${BASE_URL}/admin/ordens-servico/${OS_ID}/diagnostico" \
  -H "Authorization: Bearer ${TOKEN}")
check "POST /admin/ordens-servico/:id/diagnostico" "${code}" "201"

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "${BASE_URL}/admin/ordens-servico/${OS_ID}/orcamento" \
  -H "Authorization: Bearer ${TOKEN}")
check "POST /admin/ordens-servico/:id/orcamento" "${code}" "201"

echo "[5] Aprovação de orçamento"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "${BASE_URL}/ordens-servico/${OS_ID}/aprovacoes?cpfCnpj=${CPF_CNPJ}" \
  -H "Content-Type: application/json" \
  -d '{"aprovado":true}')
check "POST /ordens-servico/:id/aprovacoes" "${code}" "201"

echo "[6] Listagem admin priorizada"
list_resp=$(curl -s -w "\n%{http_code}" \
  "${BASE_URL}/admin/ordens-servico?page=1&limit=50" \
  -H "Authorization: Bearer ${TOKEN}")
code=$(echo "${list_resp}" | tail -1)
body=$(echo "${list_resp}" | sed '$d')
check "GET /admin/ordens-servico" "${code}" "200"
echo "${body}" | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data.get('data', data.get('items', []))
for os in items:
    if os.get('status') in ('FINALIZADA', 'ENTREGUE'):
        print('  FAIL listagem contém OS finalizada/entregue', file=sys.stderr)
        sys.exit(1)
print(f'  OK   {len(items)} OS ativas na listagem (sem FINALIZADA/ENTREGUE)')
" && pass=$((pass + 1)) || fail=$((fail + 1))

echo "[7] Webhook externo (EM_EXECUCAO -> FINALIZADA)"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "${BASE_URL}/webhooks/os/${OS_ID}/status" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: ${WEBHOOK_SECRET}" \
  -d '{"status":"FINALIZADA"}')
check "POST /webhooks/os/:id/status" "${code}" "201"

echo ""
echo "Resultado: ${pass} checks OK, ${fail} falhas"
if [[ "${fail}" -gt 0 ]]; then
  exit 1
fi
echo "E-mail: configure EMAIL_ENABLED=true + SMTP para validar notificações (side effect automático em transições)."
