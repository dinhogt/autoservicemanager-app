# RFC-006 — Integração Mercado Pago

| Campo | Valor |
|---|---|
| Status | Aceito para Billing sandbox |
| ADR | ADR-017 |

## API interna

Billing recebe comandos `GenerateQuote`, `ChargePayment` e `RefundPayment`. Publica `QuoteGenerated|Failed`, `PaymentConfirmed|Failed` e `RefundCompleted|Failed`. O payload carrega IDs internos; token do provedor nunca entra na mensagem.

## Criação e confirmação

1. `ChargePayment` valida valor/moeda e cria preferência com idempotency key.
2. Billing persiste provider ID e retorna URL/estado necessário ao cliente via contrato público.
3. Webhook valida assinatura/timestamp e deduplica o evento.
4. Billing consulta Mercado Pago pelo ID recebido.
5. Somente estado confirmado e valor/moeda esperados publicam `PaymentConfirmed`.

## Segurança

- Credenciais e segredo em Secrets Manager; rotação sem rebuild.
- HTTPS, timeout curto, backoff com jitter e circuit breaker.
- Não armazenar PAN/CVV; logs redigem headers, token e PII.
- Webhook público tem rate limit e resposta rápida; processamento segue assíncrono.

## Refund e reconciliação

Refund usa chave idempotente e referência do pagamento. Falha transitória retenta; falha definitiva pausa compensação e alerta. Job de reconciliação compara cobranças pendentes com o provedor.

## Testes

Contract tests com mock, sandbox happy path, assinatura inválida, replay, valor divergente, timeout, confirmação duplicada e refund duplicado.
