# RFC-005 — Microsserviços e Saga da OS

| Campo | Valor |
|---|---|
| Status | Aceito para implementação nas Entregas 2–6 |
| ADRs | ADR-013, ADR-014, ADR-018 |

## Proposta

OS orquestra a jornada; Billing e Execution executam capacidades isoladas. A Saga persistida no MySQL usa máquina de estados otimista e troca mensagens versionadas. O cliente continua usando REST pelo API Gateway.

## Fluxo feliz

1. OS cria ordem e comanda diagnóstico.
2. Execution conclui diagnóstico; OS comanda orçamento.
3. Billing gera orçamento; cliente aprova; OS comanda cobrança.
4. Billing confirma pagamento; OS comanda execução.
5. Execution conclui; OS finaliza e entrega.

## Invariantes

- Só o OS muda estado global da ordem.
- Só Billing confirma/cancela/reembolsa pagamento.
- Só Execution muda work item de diagnóstico/reparo.
- Um evento não avança duas vezes o mesmo passo.
- Nenhum rollback apaga histórico; toda compensação é auditável.

## Falhas e recuperação

Timeout/retry são limitados; esgotamento envia à DLQ e pausa a Saga. Compensações seguem ADR-014. Um reconciliador procura Sagas vencidas e pagamentos/refunds inconclusivos. Replay exige autorização, motivo e deduplicação.

## Validação

BDD do ciclo completo, e2e feliz, quatro classes de rollback, duplicidade/out-of-order, restart do orquestrador e regressão F1–F9.
