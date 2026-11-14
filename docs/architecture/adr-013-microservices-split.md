# ADR-013 — Cisão em três microsserviços

| Campo | Valor |
|---|---|
| Status | Aceito — Fase 4 |
| Decisão | OS, Billing e Execution; auth Lambda permanece |
| Relacionados | ADR-003, ADR-010, ADR-011, RFC-005 |

## Contexto

O monólito modular da Fase 3 atende F1–F9, porém a Fase 4 exige três microsserviços, SQL + NoSQL, pagamento externo e rollback distribuído.

## Decisão

- **OS Service**: OS, cadastro, catálogo, estoque, histórico, notificações e orquestrador; MySQL.
- **Billing Service**: orçamento, preferência, pagamento, webhook e reembolso; DynamoDB.
- **Execution Service**: diagnóstico, reparo, andamento e cancelamento; DynamoDB.
- **auth-lambda** permanece responsável por CPF/JWT RS256.
- Cada serviço é NestJS hexagonal, implantável e testável de forma independente.

## Alternativas

| Opção | Decisão |
|---|---|
| Manter monólito | Rejeitada: não atende a rubrica da Fase 4. |
| Separar também cadastro/estoque | Rejeitada: custo e consistência sem requisito. |
| Três serviços por capacidade de negócio | Aceita: menor cisão que atende o objetivo. |

## Consequências

Há consistência eventual, contratos versionados e maior custo operacional. F1–F9 são baseline de regressão; nenhum serviço acessa banco alheio.
