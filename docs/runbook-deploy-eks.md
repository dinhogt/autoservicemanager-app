# Runbook — Deploy EKS / AWS (Fase 3)

## Ordem de provisionamento (segura)

1. Bootstrap state S3+DynamoDB (ADR-008) — bucket policy least-privilege  
2. **infra-db** apply (`db/homolog/` ou `db/prod/`) — RDS + Secrets Manager  
3. **infra-k8s** apply (`k8s/homolog/` ou `k8s/prod/`) — EKS, APIGW, NLB interno, Lambda, JWKS  
4. Criar secret K8s + anotar IRSA ARNs nos ServiceAccounts  
5. **app CD** (GitHub Actions ou manual) — migrate Job → Deployment  
6. **auth-lambda CD** — update function code  
7. Smoke de segurança pós-deploy (abaixo)

Destroy: **k8s → db**.

## Pré-deploy (checklist de segurança)

- [ ] Job `security-gate` verde no CI (audit + scan de secrets)
- [ ] Terraform apply concluído (`infra-db`, depois `infra-k8s`)
- [ ] Secret criado **no cluster** (nunca commitar valores reais):

```bash
kubectl create secret generic autoservice-secrets -n autoservice \
  --from-literal=DATABASE_URL='mysql://...' \
  --from-literal=JWT_SECRET='...' \
  --from-literal=WEBHOOK_SECRET='...' \
  --dry-run=client -o yaml | kubectl apply -f -
```

- [ ] `JWT_SECRET` / `WEBHOOK_SECRET` **≠** valores do docker-compose local
- [ ] `DATABASE_URL` aponta para RDS (Secrets Manager), não `localhost`
- [ ] **Não** executar `yarn db:seed` em RDS de homolog/prod (senha demo `Senha@1234`)
- [ ] Ajustar `CORS_ORIGIN` em `k8s/configmap.yaml` para allowlist real
- [ ] Confirmar `SWAGGER_ENABLED=false` e `REQUIRE_GATEWAY_HEADERS=true` no ConfigMap
- [ ] Imagem publicada no ECR (tag = commit SHA)

## Deploy manual (app)

```bash
aws eks update-kubeconfig --region us-east-1 --name <EKS_CLUSTER_NAME>
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
# X-Ray: usar daemon do addon CloudWatch Observability (hostPort 2000).
# Não aplicar k8s/xray-daemonset.yaml junto do addon — conflito de porta.
kubectl apply -f k8s/serviceaccount-api.yaml
kubectl apply -f k8s/serviceaccount-migrate.yaml
kubectl delete job autoservice-migrate -n autoservice --ignore-not-found
kubectl apply -f k8s/job-migrate.yaml
kubectl wait --for=condition=complete job/autoservice-migrate -n autoservice --timeout=180s
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl rollout status deployment/autoservice-api -n autoservice --timeout=180s
```

## Verificação operacional

```bash
kubectl get pods -n autoservice
kubectl get hpa -n autoservice
kubectl logs -n autoservice deployment/autoservice-api --tail=50
```

## Smoke de segurança pós-deploy

Entry point público: **API Gateway** (não NLB). Use o script:

```bash
chmod +x scripts/security-smoke.sh
./scripts/security-smoke.sh "https://<API_GATEWAY_ID>.execute-api.us-east-1.amazonaws.com"
```

Checklist manual:

| Check | Esperado |
|-------|----------|
| `GET /` via APIGW | 200 |
| `GET /api-docs` via APIGW | **404/403** (Swagger off em production) |
| `POST /auth/cpf` (Lambda) | 200 + JWT ou 400 (CPF inválido) |
| Rota CLIENTE sem Bearer | 401/403 |
| Logs CloudWatch | Sem `Authorization`, CPF completo ou secrets |
| Pods | `Running`, uid 10001, non-root |

Rotas CLIENTE devem ser testadas **via API Gateway** (header `x-gateway-verified: 1` injetado pelo integration). NLB interno não deve ser exposto à internet.

## Migrações

Job `autoservice-migrate` executa `prisma migrate deploy` **antes** do Deployment da API.

## Rollback

```bash
kubectl rollout undo deployment/autoservice-api -n autoservice
```

Secrets **não** revertem com rollback de imagem — rotacionar manualmente se necessário.

## RDS vs Mongo

- **MySQL:** RDS gerenciado (Terraform). Fonte da verdade.
- **Mongo:** omitir `MONGODB_URI` (audit noop — ADR-010).

## CI/CD automático

Push `develop` → environment `homolog`; merge `master` → `production`.  
Todos os workflows exigem `security-gate` antes do CD/plan-apply.  
Ver [branch-protection.md](./infrastructure/branch-protection.md).
