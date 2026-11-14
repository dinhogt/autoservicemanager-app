# ADR-017 — Mercado Pago sandbox no Billing

| Campo | Valor |
|---|---|
| Status | Aceito — Fase 4 |
| Relacionados | ADR-014, RFC-006 |

## Contexto

O pagamento é requisito da Fase 4 e uma boundary externa não transacional. Credenciais, webhook, duplicidade, timeout e reembolso afetam segurança e consistência da Saga.

## Decisão

- Só o Billing integra com Mercado Pago, inicialmente em sandbox.
- Access token e segredo do webhook ficam no Secrets Manager e chegam ao pod via mecanismo aprovado.
- Criação de preferência usa chave de idempotência estável por tentativa de cobrança.
- Webhook valida autenticidade, timestamp/anti-replay e identificador; o estado é confirmado consultando a API do Mercado Pago antes de publicar evento.
- Respostas e logs armazenam apenas IDs, estado, valor/moeda e metadados mínimos; dados de cartão não transitam pela aplicação.
- Falha após pagamento dispara comando idempotente de refund; falha de refund gera alerta e reconciliação manual.

## Alternativas

Mock exclusivo foi rejeitado por não comprovar integração. Integração no OS foi rejeitada por violar o boundary Billing. Produção real foi adiada por risco e custo acadêmico.

## Consequências

O Billing deve ter circuit breaker/timeout, retry apenas seguro, reconciliação periódica e mapeamento explícito entre estados internos e do provedor.
