#!/usr/bin/env bash
# Demonstra HPA ligado à carga: scale-up (CPU > 70%) e scale-down (CPU < 70% + idle).
# Requer: hey, kubectl
set -euo pipefail

URL="${1:-http://localhost:30080/}"
DURATION="${DURATION:-60s}"
CONCURRENCY="${CONCURRENCY:-40}"
NAMESPACE="${NAMESPACE:-autoservice}"
# metrics-server atrasa ~30–60s; espere CPU cair antes de contar o scale-down
METRIC_LAG_WAIT="${METRIC_LAG_WAIT:-90}"
SCALE_DOWN_WAIT="${SCALE_DOWN_WAIT:-90}"

if ! command -v hey >/dev/null 2>&1; then
  echo "Erro: 'hey' não encontrado. Instale com: go install github.com/rakyll/hey@latest" >&2
  exit 1
fi
if ! command -v kubectl >/dev/null 2>&1; then
  echo "Erro: 'kubectl' não encontrado." >&2
  exit 1
fi

replicas() {
  kubectl get hpa autoservice-api-hpa -n "${NAMESPACE}" -o jsonpath='{.status.currentReplicas}' 2>/dev/null || echo "?"
}

cpu_pct() {
  kubectl get hpa autoservice-api-hpa -n "${NAMESPACE}" -o jsonpath='{.status.currentMetrics[0].resource.current.averageUtilization}' 2>/dev/null || echo "?"
}

echo "==> Estado inicial (sem carga)"
kubectl get hpa,pods -n "${NAMESPACE}"
echo "    réplicas=$(replicas) cpu%=$(cpu_pct)"
echo ""

echo "==> SCALE-UP: carga em ${URL} por ${DURATION} (c=${CONCURRENCY})"
echo "    Critério: CPU > 70% do request → sobe réplicas (máx. 5)"
hey -z "${DURATION}" -c "${CONCURRENCY}" "$URL" >/tmp/autoservice-hey.txt 2>&1 || true
tail -n 12 /tmp/autoservice-hey.txt
echo ""
echo "==> Durante/logo após carga: réplicas=$(replicas) cpu%=$(cpu_pct)"
kubectl get hpa,pods -n "${NAMESPACE}"
echo ""

echo "==> Aguardando métricas refletirem idle (CPU < 70%, até ${METRIC_LAG_WAIT}s)..."
deadline=$((SECONDS + METRIC_LAG_WAIT))
while (( SECONDS < deadline )); do
  c="$(cpu_pct)"
  r="$(replicas)"
  echo "    $(date +%H:%M:%S) réplicas=${r} cpu%=${c}"
  if [[ "${c}" =~ ^[0-9]+$ ]] && (( c < 70 )); then
    break
  fi
  sleep 10
done
echo ""

echo "==> SCALE-DOWN: CPU abaixo do alvo — aguardando minReplicas=1 (até ${SCALE_DOWN_WAIT}s)"
echo "    Critério: CPU < 70% estável → desce réplicas (mín. 1)"
deadline=$((SECONDS + SCALE_DOWN_WAIT))
while (( SECONDS < deadline )); do
  r="$(replicas)"
  c="$(cpu_pct)"
  echo "    $(date +%H:%M:%S) réplicas=${r} cpu%=${c}"
  if [[ "${r}" == "1" ]]; then
    echo ""
    echo "OK: ciclo completo — subiu com carga e voltou a 1 sem carga."
    kubectl get hpa,pods -n "${NAMESPACE}"
    exit 0
  fi
  sleep 10
done

echo ""
echo "Aviso: ainda não voltou a 1 réplica."
echo "  kubectl describe hpa autoservice-api-hpa -n ${NAMESPACE}"
kubectl get hpa,pods -n "${NAMESPACE}"
exit 1
