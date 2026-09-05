# RFC-002 — Banco MySQL RDS

| Campo | Valor |
|-------|-------|
| Status | Aceito |
| Data | 2026-08-09 |
| Role | documentation / architecture |
| Relacionados | ADR-010, ADR-008, `prisma/schema.prisma` |

## Problema

Persistência transacional única para OS, estoque, clientes e admin — com isolamento de rede e credenciais gerenciadas.

## Proposta

- **RDS MySQL 8** em subnets privadas (`infra-db`)
- Acesso **somente SG→SG** (nós EKS + Lambda auth)
- Credenciais em **Secrets Manager**; app/Lambda via IRSA / role
- Schema e migrações: **Prisma** (fonte da verdade)

## Alternativas rejeitadas

| Opção | Motivo |
|-------|--------|
| MySQL em EC2 self-managed | Operação manual; backup/HA |
| Aurora | Custo acima do MVP acadêmico |
| Manter Mongo para audit | ADR-010 — CloudWatch Logs |

## Decisão

**RDS MySQL 8 + Prisma**; auditoria/eventos via logs estruturados (não Mongo).

## Critérios de aceite

- [x] Terraform `infra-db` com outputs consumidos por `infra-k8s`
- [x] Migrações via Job K8s (`prisma migrate deploy`)
- [x] Diagrama ER em [er-diagram.md](./er-diagram.md)
