# ADR-014 — Saga orquestrada no OS Service

| Campo | Valor |
|---|---|
| Status | Aceito — Fase 4 |
| Relacionados | ADR-013, ADR-015, RFC-005 |

## Contexto

Diagnóstico, orçamento, pagamento e execução atravessam bancos e serviços sem transação ACID global. É necessário demonstrar caminho feliz e rollback.

## Decisão

O OS Service é o orquestrador. Cada instância é persistida no MySQL com `sagaId`, OS, passo, estado, versão otimista, tentativas, deadline e erro. O orquestrador publica comandos e reage a eventos; transições inválidas ou repetidas são ignoradas/auditadas.

| Falha | Compensação |
|---|---|
| Diagnóstico | OS rejeitada/cancelada + notificação |
| Geração de orçamento | cancelar item de diagnóstico |
| Orçamento rejeitado | cancelar Execution e não cobrar |
| Pagamento falho/timeout | não iniciar execução; aguardar pagamento ou expirar |
| Execução após pagamento | solicitar reembolso e marcar Saga compensada |

## Política

- Estado só avança após evento de sucesso correspondente.
- Comandos e eventos têm `sagaId`, `messageId`, `correlationId` e versão.
- Inbox/outbox ou mecanismo equivalente deve fechar a janela banco/mensagem na implementação.
- Timeout gera decisão explícita; replay de DLQ é operação auditada.

## Alternativas

Coreografia foi rejeitada por dificultar visualização, governança de rollback e demonstração. Transação distribuída/2PC foi rejeitada por incompatibilidade com SQS/SNS/DynamoDB/Mercado Pago.

## Consequências

O OS concentra lógica de processo, mas os domínios mantêm autonomia. F11 exige testes automatizados das compensações e reconciliação para passos inconclusivos.
