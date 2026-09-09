# ADR-012 — CloudWatch + X-Ray como stack de observabilidade (escolha livre)

| Campo | Valor |
|-------|-------|
| Status | Aceito — Fase 3 |
| Data | 2026-09-08 |
| Role | architecture / observability |
| Relacionados | RFC-001, ADR-006, `infra-k8s/observability.tf` |

## Contexto

O enunciado FIAP pede integração com ferramentas **como** Datadog ou New Relic (**escolha livre**). Já operamos 100% na AWS (API Gateway, EKS, Lambda, RDS) com IaC Terraform e FinOps acadêmico (single-AZ, destroy pós-demo).

## Decisão

1. Adotar **Amazon CloudWatch** (métricas, logs, dashboards, alarmes) + **AWS X-Ray** (traces) + **Container Insights** (CPU/memória de pods) como stack de observabilidade corporativa da Fase 3.
2. **Não** contratar Datadog/New Relic nesta fase — evita segundo vendor, agent extra no cluster e custo fora do lab.
3. Métricas de negócio (`OsCriada`, `OsFaseDuracao`, `OsTransicaoErro`) via EMF / metric filters no namespace `AutoServiceManager/<env>`.
4. Correlação: `correlationId` + `xrayTraceId` nos logs JSON (ADR-006).

### Trade-offs

| Opção | Prós | Contras | Escolha |
|-------|------|---------|---------|
| Datadog / New Relic | UX rica; APM unificado | Custo; agent; fora do stack AWS já IaC | Rejeitada (Fase 3) |
| CloudWatch + X-Ray + Insights | Nativo; Terraform; FinOps | UX menos “SaaS APM” | **Aceita** |
| Prometheus + Grafana self-managed | Open source | Ops de storage/HA no EKS | Adiada |

## Consequências

- Dashboard `{project}-{env}-ops` cobre latência APIGW, volume diário de OS, tempo por fase, CPU/mem, erros de integração e falhas de transição.
- Demo de monitoramento usa console CloudWatch (equivalente acadêmico ao painel Datadog/New Relic exigido).
- Evolução futura para Datadog permanece possível sem mudar o contrato de logs JSON.
