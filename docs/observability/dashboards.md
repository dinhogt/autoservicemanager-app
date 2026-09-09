# Dashboards — AutoServiceManager Fase 3

| Campo | Valor |
|-------|-------|
| Role | `observability` |
| Todo | `observability` |
| Data | 2026-09-08 |
| IaC | [`infra-k8s/observability.tf`](../../infra-k8s/observability.tf) (repo sibling) |
| Console | CloudWatch → Dashboards → `{project}-{env}-ops` |
| ADR | [ADR-012](../architecture/adr-012-cloudwatch-observability.md) |

## Sinais

| Domínio | Sinal | Fonte | Uso no painel |
|---------|-------|-------|----------------|
| Edge | Volume de requests | `AWS/ApiGateway` `Count` | RPS de borda |
| Edge | Latência p95/p99 | `AWS/ApiGateway` `Latency` | Tempo médio de borda |
| Edge | Erros HTTP | `4xx` / `5xx` | Erros de integração |
| Auth | Duração / erros Lambda | `AWS/Lambda` | Auth CPF |
| Compute | Healthy hosts NLB | `AWS/NetworkELB` | Disponibilidade do app |
| Compute | CPU / memória pods | `ContainerInsights` | Capacidade K8s |
| Negócio | `OsCriada` | EMF app | **Volume diário de OS** |
| Negócio | `OsFaseDuracao` (Fase) | EMF app | Diagnóstico / Execução / Finalização |
| Negócio | `OsTransicaoErro` | Metric filter | Falha de transição de OS |

## Painel Terraform

Dashboard `aws_cloudwatch_dashboard.fase3` (`{project}-{env}-ops`):

1. Volume APIGW  
2. Latência p95/p99  
3. 4xx/5xx  
4. Lambda authCpf (p95 + errors)  
5. NLB healthy/unhealthy  
6. Contagem `os_transicao_erro`  
7. **Volume diário `OsCriada`**  
8. **Tempo médio por fase (`OsFaseDuracao`)**  
9. **CPU / memória Container Insights**  
10. Widget Logs Insights (erros + `correlationId` / `xrayTraceId`)

## API de produto

`GET /admin/ordens-servico/metricas/tempo-medio` — agregado global, por serviço e **`porFase`** (MySQL `OrdemServicoStatusHistorico`).

## Container Insights

Addon EKS `amazon-cloudwatch-observability`. Painéis padrão AWS + widgets no dashboard Terraform.

## Done criteria

- [x] Dashboard de jornadas críticas (auth, proxy, OS, saúde NLB)
- [x] Volume diário de OS e tempo por fase
- [x] CPU/memória no mesmo dashboard
- [x] Correlação logs ↔ trace IDs no widget Insights
