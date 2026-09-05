#!/usr/bin/env bash
# Bootstrap: docker-compose (DB) + kind cluster + deploy API + HPA + migrate.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLUSTER_NAME="${CLUSTER_NAME:-autoservice-local}"
IMAGE="${IMAGE:-autoservicemanager:local}"
NAMESPACE="${NAMESPACE:-autoservice}"
JWT_SECRET="${JWT_SECRET:-local-k8s-jwt-secret-min-16-chars}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-local-webhook-secret-min-16}"
MYSQL_USER="${MYSQL_USER:-app}"
MYSQL_PASS="${MYSQL_PASS:-appsecret}"
MYSQL_DB="${MYSQL_DB:-autoservicemanager}"

if [[ "$(uname -s)" == "Linux" ]]; then
  DB_HOST="${DB_HOST:-172.17.0.1}"
else
  DB_HOST="${DB_HOST:-host.docker.internal}"
fi

DATABASE_URL="mysql://${MYSQL_USER}:${MYSQL_PASS}@${DB_HOST}:3306/${MYSQL_DB}"
MONGODB_URI="${MONGODB_URI:-mongodb://${DB_HOST}:27017}"

log() { echo "==> $*"; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Erro: '$1' não encontrado. Instale antes de continuar." >&2
    exit 1
  fi
}

require_cmd docker
require_cmd kind
require_cmd kubectl

log "Subindo MySQL e MongoDB (docker-compose.db.yml)..."
docker compose -f "${ROOT}/docker-compose.db.yml" up -d

log "Aguardando MySQL ficar saudável..."
until docker compose -f "${ROOT}/docker-compose.db.yml" exec -T mysql \
  mysqladmin ping -h 127.0.0.1 -uroot -prootsecret --silent 2>/dev/null; do
  sleep 2
done

if ! kind get clusters 2>/dev/null | grep -qx "${CLUSTER_NAME}"; then
  log "Criando cluster kind '${CLUSTER_NAME}'..."
  kind create cluster --name "${CLUSTER_NAME}" --config "${ROOT}/k8s/local/kind-config.yaml"
else
  log "Cluster kind '${CLUSTER_NAME}' já existe."
fi

log "Instalando metrics-server (necessário para HPA)..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]' \
  2>/dev/null || true

log "Build da imagem Docker..."
docker build -t "${IMAGE}" "${ROOT}"

log "Carregando imagem no cluster kind..."
kind load docker-image "${IMAGE}" --name "${CLUSTER_NAME}"

log "Aplicando manifestos Kubernetes..."
kubectl apply -f "${ROOT}/k8s/namespace.yaml"
kubectl apply -f "${ROOT}/k8s/configmap.yaml"

kubectl create secret generic autoservice-secrets -n "${NAMESPACE}" \
  --from-literal=DATABASE_URL="${DATABASE_URL}" \
  --from-literal=JWT_SECRET="${JWT_SECRET}" \
  --from-literal=WEBHOOK_SECRET="${WEBHOOK_SECRET}" \
  --from-literal=MONGODB_URI="${MONGODB_URI}" \
  --from-literal=SMTP_HOST="" \
  --from-literal=SMTP_PORT="587" \
  --from-literal=SMTP_USER="" \
  --from-literal=SMTP_PASS="" \
  --from-literal=EMAIL_FROM="noreply@example.com" \
  --dry-run=client -o yaml | kubectl apply -f -

log "Executando migrações Prisma..."
kubectl apply -f "${ROOT}/k8s/serviceaccount-migrate.yaml"
kubectl delete job autoservice-migrate -n "${NAMESPACE}" --ignore-not-found
kubectl apply -f "${ROOT}/k8s/local/job-migrate.yaml"
kubectl wait --for=condition=complete job/autoservice-migrate -n "${NAMESPACE}" --timeout=180s

log "Aplicando Deployment da API..."
kubectl apply -f "${ROOT}/k8s/local/api-deployment.yaml"
kubectl apply -f "${ROOT}/k8s/local/api-service.yaml"
kubectl apply -f "${ROOT}/k8s/hpa.yaml"

log "Aguardando pods da API..."
kubectl rollout status deployment/autoservice-api -n "${NAMESPACE}" --timeout=180s

echo ""
echo "Deploy concluído."
echo "  API:     http://localhost:30080"
echo "  Swagger: http://localhost:30080/api-docs"
echo ""
echo "Comandos úteis:"
echo "  kubectl get pods,hpa -n ${NAMESPACE}"
echo "  ${ROOT}/scripts/load-test.sh   # scale-up + scale-down"
echo "  kind delete cluster --name ${CLUSTER_NAME}"
