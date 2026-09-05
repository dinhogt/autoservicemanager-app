# Observability — handoff Fase 3

| Campo | Valor |
|-------|-------|
| Role | `observability` |
| Todo | `observability` |
| Data | 2026-08-09 |

## Entrega

| Artefato | Caminho |
|----------|---------|
| Dashboards | [dashboards.md](./dashboards.md) |
| Alertas + runbook | [alerts.md](./alerts.md) |
| Tracing / logs | [tracing.md](./tracing.md) |
| Terraform | [`infra-k8s/observability.tf`](../../infra-k8s/observability.tf) |
| X-Ray DaemonSet | [`k8s/xray-daemonset.yaml`](../../k8s/xray-daemonset.yaml) |
| SA + Deployment | [`k8s/serviceaccount-api.yaml`](../../k8s/serviceaccount-api.yaml), [`k8s/api-deployment.yaml`](../../k8s/api-deployment.yaml) |

## Handoff

- **next_todo:** `delivery-pdf` ([branch-protection](../infrastructure/branch-protection.md) concluído)
- **next_role:** `documentation`
- **goal:** Vídeo ≤15 min + PDF final
- **open_risks:** Thresholds a calibrar; Target Group ainda depende do bind dos pods; assinatura SNS pendente de ops
