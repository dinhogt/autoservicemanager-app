# Dashboards — AutoServiceManager Fase 3

| Campo | Valor |
|-------|-------|
| Role | `observability` |
| Todo | `observability` |
| Data | 2026-08-09 |
| IaC | [`infra-k8s/observability.tf`](../../infra-k8s/observability.tf) |
| Console | CloudWatch → Dashboards → `{project}-{env}-ops` |

## Sinais (máx. 5 por domínio)

| Domínio | Sinal | Fonte | Uso no painel |
|---------|-------|-------|----------------|
| Edge | Volume de requests | `AWS/ApiGateway` `Count` | Volume diário / RPS |
| Edge | Latência p95/p99 | `AWS/ApiGateway` `Latency` | Tempo médio de borda |
| Edge | Erros HTTP | `4xx` / `5xx` | Erros de integração / cliente |
| Auth | Duração / erros Lambda | `AWS/Lambda` | Auth CPF (R1 cold start) |
| Compute | Healthy hosts NLB | `AWS/NetworkELB` | Disponibilidade do app |
| Negócio | `OsTransicaoErro` | Metric filter nos logs JSON | Falha de transição de OS |

## Painel Terraform

Dashboard `aws_cloudwatch_dashboard.fase3` (`{project}-{env}-ops`):

1. Volume APIGW  
2. Latência p95/p99  
3. 4xx/5xx  
4. Lambda authCpf (p95 + errors)  
5. NLB healthy/unhealthy  
6. Contagem `os_transicao_erro`  
7. Widget Logs Insights (últimos erros com `correlationId` / `xrayTraceId`)

## Tempo médio por status (negócio)

Métrica de produto já exposta na API admin (`GET /admin/ordens-servico/metricas/tempo-medio`). No CloudWatch, usar Logs Insights sobre o log group de aplicação quando o use case emitir eventos JSON, ou consultar MySQL via job de métricas.

Query de apoio (erros / correlação):

```
fields @timestamp, correlationId, xrayTraceId, context, message
| filter level = "error"
| sort @timestamp desc
| limit 40
```

Log group: `/aws/containerinsights/<eks_cluster_name>/application`

## Container Insights

Addon EKS `amazon-cloudwatch-observability` (Fluent Bit + agent). Painéis padrão AWS:

- Container Insights → Performance → cluster `{eks_cluster_name}`
- CPU/memória de pods `autoservice-api`, reinícios, network

## Done criteria

- [x] Dashboard de jornadas críticas (auth, proxy, OS, saúde NLB)
- [x] Correlação logs ↔ trace IDs no widget Insights
