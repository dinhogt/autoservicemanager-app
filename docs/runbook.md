# Runbook operacional — Fase 3

| Campo | Valor |
|-------|-------|
| Todo | `docs-arch` |
| Data | 2026-08-09 |

## Índice de procedimentos

| Tema | Documento |
|------|-----------|
| Deploy EKS (manual) | [runbook-deploy-eks.md](./runbook-deploy-eks.md) |
| Deploy local kind | [runbook-deploy-local-k8s.md](./runbook-deploy-local-k8s.md) |
| Alertas CloudWatch | [observability/alerts.md](./observability/alerts.md) |
| Tracing / logs | [observability/tracing.md](./observability/tracing.md) |
| Infra DB | [infra-db/README.md](../infra-db/README.md) |
| Infra K8s | [infra-k8s/README.md](../infra-k8s/README.md) |

## Ordem de provisionamento

1. Bootstrap state S3+DynamoDB (ADR-008)  
2. `infra-db` apply (`db/<env>/`)  
3. `infra-k8s` apply (`k8s/<env>/`)  
4. Anotar IRSA ARNs nos ServiceAccounts  
5. Bind pods → Target Group  
6. `kubectl apply` X-Ray DaemonSet + app (ou CI)  
7. Assinar SNS `ops_alerts_topic_arn`

Destroy: **k8s → db**.

## Rotação JWT RS256 (R6)

1. Gerar novo par RSA; `kid` novo.  
2. Publicar **ambas** chaves no JWKS.  
3. Atualizar secret da Lambda para a nova private key.  
4. Aguardar expiração máxima dos tokens antigos (`jwt_expires_in`).  
5. Remover `kid` antigo do JWKS.

## Incidente rápido

| Sintoma | Checagem |
|---------|----------|
| 5xx no edge | Dashboard `*-ops`; NLB unhealthy; logs app |
| Auth CPF falha | Logs Lambda; secret DB/JWT; SG MySQL |
| 409 em transição OS | `event=os_transicao_erro` + status atual |
| Sem correlação | Header `X-Amzn-Trace-Id`; DaemonSet X-Ray |

## Saúde

```bash
kubectl get pods,hpa -n autoservice
curl -sS "$API_ENDPOINT/health"   # ou rota health documentada no APIGW
```
