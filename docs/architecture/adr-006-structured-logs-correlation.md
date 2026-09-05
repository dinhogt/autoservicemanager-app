# ADR-006 — Logs estruturados JSON + correlação de trace

| Campo | Valor |
|-------|-------|
| Status | Aceito — Fase 3 |
| Data | 2026-08-09 |
| Role | architecture |
| Relacionados | ADR-010, observability (`tracing.md`, `alerts.md`) |

## Contexto

Com Mongo descontinuado (ADR-010), auditoria e diagnóstico dependem de **logs + métricas + traces**. Correlação ponta a ponta (APIGW → Lambda → EKS) é requisito (R4, F9).

## Decisão

1. **`JsonLogger`** em production / `LOG_FORMAT=json`: campos `level`, `message`, `context`, `correlationId`, `xrayTraceId`, `event?`, `timestamp`.
2. **`TraceMiddleware`**: propaga `X-Amzn-Trace-Id` e gera/propaga `X-Correlation-Id` (ALS).
3. **X-Ray SDK** (`AWS_XRAY_ENABLED`) + DaemonSet UDP `:2000`.
4. Fluent Bit (addon Container Insights) → `/aws/containerinsights/<cluster>/application`.
5. Evento de negócio `event=os_transicao_erro` para metric filter / alarme.
6. **Não** logar Bearer, CPF completo nem corpo de `/auth/cpf`.

### Trade-offs

| Opção | Prós | Contras | Escolha |
|-------|------|---------|---------|
| Mongo audit | Query ad-hoc | Ops + ADR-010 | Rejeitada |
| JSON + X-Ray + CW | Stack AWS nativa | Retenção/custo logs | **Aceita** |
| OpenTelemetry collector | Vendor-neutral | Extra DaemonSet | Adiada |

## Consequências

- Runbook de alerta usa Logs Insights por `correlationId` / `xrayTraceId`.
- Dashboards/alarmes em `infra-k8s/observability.tf`.
