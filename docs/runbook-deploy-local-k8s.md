# Runbook — Deploy local com Kubernetes (kind)

Ambiente de demonstração da Fase 2: **MySQL/MongoDB no Docker Compose** + **API no kind** com HPA.

## Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Docker Desktop / Docker Engine | 24+ |
| [kind](https://kind.sigs.k8s.io/) | 0.20+ |
| kubectl | 1.28+ |
| Node.js + Yarn | 22 / 1.22 (para seed e testes locais) |

Opcional para HPA demo: [hey](https://github.com/rakyll/hey) (`go install github.com/rakyll/hey@latest`).

## Deploy automatizado (recomendado)

```bash
./scripts/kind-setup.sh
```

O script:

1. Sobe `docker-compose.db.yml` (MySQL + MongoDB)
2. Cria cluster kind `autoservice-local` com NodePort **30080**
3. Instala metrics-server (HPA)
4. Build + load da imagem `autoservicemanager:local`
5. Cria secrets, aplica manifests e roda job de migrate

API disponível em:

- http://localhost:30080
- Swagger: http://localhost:30080/api-docs

## Deploy manual (passo a passo)

### 1. Banco de dados

```bash
docker compose -f docker-compose.db.yml up -d
```

Aguarde healthcheck do MySQL (`docker compose -f docker-compose.db.yml ps`).

### 2. Cluster kind

```bash
kind create cluster --name autoservice-local --config k8s/local/kind-config.yaml
```

### 3. Metrics-server (HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

### 4. Build e load da imagem

```bash
docker build -t autoservicemanager:local .
kind load docker-image autoservicemanager:local --name autoservice-local
```

### 5. Secrets e manifests

**macOS / Docker Desktop:**

```bash
export DB_HOST=host.docker.internal
```

**Linux (bridge Docker):**

```bash
export DB_HOST=172.17.0.1
```

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml

kubectl create secret generic autoservice-secrets -n autoservice \
  --from-literal=DATABASE_URL="mysql://app:appsecret@${DB_HOST}:3306/autoservicemanager" \
  --from-literal=JWT_SECRET="local-k8s-jwt-secret-min-16-chars" \
  --from-literal=WEBHOOK_SECRET="local-webhook-secret-min-16" \
  --from-literal=MONGODB_URI="mongodb://${DB_HOST}:27017" \
  --from-literal=SMTP_HOST="" \
  --from-literal=SMTP_PORT="587" \
  --from-literal=SMTP_USER="" \
  --from-literal=SMTP_PASS="" \
  --from-literal=EMAIL_FROM="noreply@autoservice.local"

kubectl apply -f k8s/serviceaccount-migrate.yaml
kubectl delete job autoservice-migrate -n autoservice --ignore-not-found
kubectl apply -f k8s/local/job-migrate.yaml
kubectl wait --for=condition=complete job/autoservice-migrate -n autoservice --timeout=180s
kubectl apply -f k8s/local/api-deployment.yaml
kubectl apply -f k8s/local/api-service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl rollout status deployment/autoservice-api -n autoservice --timeout=180s
```

### 6. Seed (opcional, no host)

```bash
DATABASE_URL="mysql://app:appsecret@127.0.0.1:3306/autoservicemanager" \
JWT_SECRET="local-k8s-jwt-secret-min-16-chars" \
yarn db:seed
```

Senha dos admins: `Senha@1234`.

## Verificação

```bash
kubectl get pods,hpa -n autoservice
curl http://localhost:30080/
./scripts/smoke-test-apis.sh  # BASE_URL=http://localhost:30080 WEBHOOK_SECRET=local-webhook-secret-min-16
```

## Demonstração de HPA (scale-up e scale-down)

O HPA reage **somente à utilização de CPU** (target 70% do request). kind é single-node: vários pods no mesmo nó é esperado.

```bash
# Demonstra sobe com carga e desce ~60–90s após idle
./scripts/load-test.sh

# Ou acompanhe manualmente em outro terminal:
kubectl get hpa,pods -n autoservice -w
```

| Fase | Condição | Efeito |
|------|----------|--------|
| Scale-up | CPU média > 70% do request | Réplicas sobem (até 5), em degraus de até +2 / 30s |
| Scale-down | CPU < 70% por ~30s (stabilization) | Réplicas descem até 1 |

O metrics-server atrasa a CPU por ~30–60s após parar o `hey`; o script espera a métrica cair antes de validar o scale-down.

## E-mail (notificação de status)

Configure no secret ou `.env` local:

```bash
EMAIL_ENABLED=true
SMTP_HOST=sandbox.smtp.mailtrap.io  # exemplo Mailtrap
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

Transições de status disparam e-mail quando o cliente tem `@` no campo `contato`.

## CI/CD vs deploy local

- **GitHub Actions** (`.github/workflows/ci-cd.yml`): lint, testes, build e docker build em todo PR/push.
- **CD para AWS EKS** ocorre apenas em push na `master` (path alternativo cloud).
- **Demo Fase 2**: CI no GitHub + deploy local via este runbook.

## Rollback e destroy

```bash
kubectl rollout undo deployment/autoservice-api -n autoservice
kind delete cluster --name autoservice-local
docker compose -f docker-compose.db.yml down
```

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Pod `CrashLoopBackOff` | `kubectl logs -n autoservice deployment/autoservice-api`; verifique `DATABASE_URL` e se MySQL está no ar |
| HPA `<unknown>` / não escala | Aguarde metrics-server; `kubectl top pods -n autoservice`. Carga em **`:30080`** |
| Réplicas altas sem carga | Aguarde stabilization (~60s) ou `kubectl describe hpa -n autoservice` (`ScaleDownStabilized`) |
| Réplicas sobem ao reaplicar manifests | Remova `spec.replicas` do Deployment; só o HPA deve alterar réplicas |
| `hey` connection refused | API kind = `localhost:30080`; compose = `localhost:3000` |
| `hey` só retorna HTTP 429 | Health `GET /` deve ter `@SkipThrottle`; rebuild da imagem se necessário |
| kind no Linux não alcança MySQL | Use `DB_HOST=172.17.0.1` ou IP da bridge (`ip addr show docker0`) |
| NodePort 30080 ocupada | Altere `hostPort` em `k8s/local/kind-config.yaml` |

## Referências

- [Terraform local (kind)](../infra/terraform/local/README.md)
- [Manifestos AWS/EKS](../k8s/) — path cloud alternativo
- [Runbook EKS](./runbook-deploy-eks.md)
