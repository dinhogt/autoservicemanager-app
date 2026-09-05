# ADR-010 — Descontinuação do MongoDB de auditoria

| Campo | Valor |
|-------|-------|
| Status | Aceito — Fase 3 (supersede parcial ADR-002 §6) |
| Data | 2026-08-07 |
| Role | architecture |
| Relacionados | ADR-002 (Mongo best-effort), ADR-006 planejado (logs estruturados) |

## Contexto

Na Fase 2, auditoria de OS usava MongoDB opcional (`MONGODB_URI`) via `OsMongoAuditPort`, com fallback `NoopOsMongoAuditRepository` (best-effort). A Fase 3 exige observabilidade corporativa (CloudWatch) e reduz superfície operacional em 4 repos. Manter Atlas/StatefulSet Mongo adiciona custo, secret, backup e falha silenciosa (best-effort) sem atender dashboards exigidos.

## Decisão

1. **Descontinuar MongoDB** como dependência de runtime na Fase 3.
2. Substituir trilha de auditoria por **logs estruturados JSON** no CloudWatch Logs, com campos estáveis:
   - `event` ∈ `os_status_changed` | `os_domain_event` | `os_notification`
   - `ordemServicoId`, `fromStatus`, `toStatus`, `correlationId` / `xrayTraceId`
3. Consultas operacionais via **CloudWatch Logs Insights** (e dashboards); métricas de negócio (volume OS, tempo médio) continuam via API/MySQL (`ObterTempoMedioExecucaoUseCase`).
4. Porta de domínio `OsMongoAuditPort` pode:
   - **Curto prazo:** adaptar implementação para emitir log estruturado (renomear mentalmente para `OsAuditPort`) sem quebrar use cases; ou
   - **Médio prazo:** renomear port e remover pacote `mongodb` do `package.json`.
5. Remover `MONGODB_URI` do contrato de env validado em produção Fase 3; manter noop apenas se necessário para compatibilidade de testes até a refatoração.

### Trade-offs

| Opção | Prós | Contras | Escolha |
|-------|------|---------|---------|
| Manter Mongo Atlas free | Zero mudança de código audit | Ops extra; fora do PDF serverless/obs | Rejeitada |
| CloudWatch Logs Insights | Alinhado à obs obrigatória; 1 stack a menos | Retenção/custo de ingestão; query menos flexível que Mongo | **Aceita** |
| EventBridge + S3 data lake | Analítico forte | Over-engineering OPC | Adiada |

## Consequências

- ADR-002 §6 fica **histórico** para Fase 2; este ADR governa Fase 3+.
- Testes que mockam `OsMongoAuditPort` permanecem válidos (port abstrata).
- Threat model: menos datastore com PII potencial; logs não devem conter CPF completo se evitável (usar hash/`sub` já autenticado) — detalhar em `role-security`.

## Fora de escopo

- Migração retroativa de coleções Mongo existentes.
- OpenSearch dedicado.
