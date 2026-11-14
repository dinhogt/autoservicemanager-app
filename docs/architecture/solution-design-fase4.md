# Solution Design — Fase 4

| Campo | Valor |
|---|---|
| Baseline | [Fase 3](./solution-design-fase3.md), preservada |
| Estilo | Microsserviços NestJS hexagonais, event-driven |
| Cloud | AWS por continuidade da plataforma Fase 3 |
| Qualidade | 90% por serviço + BDD/e2e + Sonar |

## Arquitetura

O API Gateway mantém REST público. O OS Service conserva OS/cadastro/catálogo/estoque e passa a orquestrar a Saga no MySQL. Billing e Execution são serviços independentes com DynamoDB. Comandos usam SQS; eventos usam SNS→SQS. Billing é o único boundary do Mercado Pago sandbox.

## Boundaries

| Boundary | Responsabilidade | Persistência | Contrato |
|---|---|---|---|
| auth-lambda | CPF e JWT RS256 | leitura MySQL | REST via APIGW |
| OS Service | agregado OS, Saga e capacidades preservadas | RDS MySQL | REST + SQS/SNS |
| Billing Service | orçamento/pagamento/refund | DynamoDB Billing | SQS/SNS + MP HTTPS/webhook |
| Execution Service | diagnóstico/reparo/cancelamento | DynamoDB Execution | SQS/SNS |

## Regras de integração

- Sem acesso a banco alheio; database-per-service e IRSA mínimo.
- REST interno apenas para consulta fresca excepcional e documentada.
- Mensagens versionadas, idempotentes, at-least-once, DLQ e correlação.
- Outbox/inbox ou mecanismo equivalente para consistência de publicação/consumo.
- Saga persiste passo e compensação; OS é o único owner do estado global.

## NFR e operação

| Tema | Decisão |
|---|---|
| Resiliência | timeout, retry com jitter, DLQ, reconciliação, compensações |
| Segurança | Secrets Manager, webhook verificado, PII redigida, IRSA por workload |
| Observabilidade | logs JSON, CloudWatch EMF, X-Ray e `correlationId`/`sagaId` |
| Deploy | pipeline/imagem/rollback independente por serviço no EKS |
| Custo | single-AZ demo, DynamoDB on-demand, destroy pós-demo |
| Teste | 90% em quatro métricas, Sonar, contract, BDD e e2e LocalStack |

## Rastreabilidade

F1–F7 são regressão funcional; F8 autenticação; F9 trace distribuído; F10 pagamento; F11 compensação; F12 independência/qualidade. Matriz completa em [requirements.md](../requirements/requirements.md).

## Decisões

[ADR-013](./adr-013-microservices-split.md) · [ADR-014](./adr-014-orchestrated-saga.md) · [ADR-015](./adr-015-sqs-commands-sns-events.md) · [ADR-016](./adr-016-dynamodb-billing-execution.md) · [ADR-017](./adr-017-mercado-pago-sandbox.md) · [ADR-018](./adr-018-database-per-service.md)

## Riscos

Duplicidade/out-of-order, Saga parada, webhook forjado, refund inconclusivo e custo EKS/NAT. As mitigações e owners estão no threat model e nos RFCs.

## Handoff e gates

Arquitetura/cloud/security/FinOps estão documentados. Implementação só inicia após aprovação do `gate-security-review`, budget/apply AWS e contratos versionados da Entrega 2. Frontend é skip justificado por produto API-only.
