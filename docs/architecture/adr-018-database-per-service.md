# ADR-018 — Database per service

| Campo | Valor |
|---|---|
| Status | Aceito — Fase 4 |
| Relacionados | ADR-013, ADR-016 |

## Contexto

A cisão só cria autonomia real se esquema, credenciais, migração e disponibilidade de dados tiverem um único owner.

## Decisão

| Serviço | Banco | Ownership |
|---|---|---|
| OS | RDS MySQL | OS, cadastro, catálogo, estoque, histórico e Saga |
| Billing | DynamoDB Billing | orçamento, cobrança, webhook, refund e idempotência |
| Execution | DynamoDB Execution | work items, andamento e cancelamento |

- Cada workload possui role/IRSA e permissões apenas sobre seu banco.
- Nenhum serviço recebe credencial ou acesso de rede ao banco alheio.
- Dados necessários cruzam boundaries em comandos/eventos versionados; consultas síncronas internas são exceção documentada.
- Migração, backup, retenção e recuperação são responsabilidade do serviço owner.

## Alternativas

Banco/esquema compartilhado foi rejeitado por acoplamento de deploy e privilégio excessivo. Réplicas de leitura cruzadas foram rejeitadas por ownership ambíguo.

## Consequências

Há duplicação controlada e consistência eventual. Reconciliação e evolução compatível de schema de eventos tornam-se requisitos; relatórios multi-contexto usam projeções.
