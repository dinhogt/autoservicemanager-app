# ADR-005 — Horizontal Pod Autoscaler (EKS)

| Campo | Valor |
|-------|-------|
| Status | Aceito — Fase 3 |
| Data | 2026-08-09 |
| Role | architecture |
| Relacionados | RFC-001, `k8s/hpa.yaml` |

## Contexto

Carga de API é variável (picos de consulta de OS / admin). Node group `t3.medium` é pequeno; réplicas fixas desperdiçam ou saturam.

## Decisão

1. **HPA v2** no Deployment `autoservice-api` ([`k8s/hpa.yaml`](../../k8s/hpa.yaml)).
2. Métrica: CPU média vs **request** — target **70%**.
3. `minReplicas: 1`, `maxReplicas: 5`.
4. Scale-up agressivo (janela 15s); scale-down com estabilização 30s.
5. Deployment **não** fixa `replicas` (HPA controla).

### Trade-offs

| Opção | Prós | Contras | Escolha |
|-------|------|---------|---------|
| Réplicas fixas = 2 | Previsível | Sem elasticidade | Rejeitada |
| HPA CPU 70% | Simples; metrics-server | Não captura fila/IO | **Aceita** |
| KEDA / custom metrics | Preciso | Complexidade OPC | Adiada |

## Consequências

- Exige metrics-server no cluster.
- Demo: `scripts/load-test.sh` + `kubectl get hpa`.
- Memória não escala sozinha — monitorar OOM nos alarmes/Container Insights.
