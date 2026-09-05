# RFC-001 — Nuvem AWS (Fase 3)

| Campo | Valor |
|-------|-------|
| Status | Aceito |
| Data | 2026-08-09 |
| Role | documentation / architecture |
| Relacionados | ADR-002, ADR-008, ADR-009 |

## Problema

Operar o AutoServiceManager em ambiente corporativo (API gerenciada, compute orquestrado, banco gerenciado, CI sem AKIA) com rastreabilidade acadêmica FIAP.

## Proposta

Usar **AWS** como provedor único da Fase 3:

| Capacidade | Serviço |
|------------|---------|
| Edge / auth | API Gateway HTTP API + Lambda |
| Compute app | EKS |
| Dados | RDS MySQL 8 |
| Segredos | Secrets Manager |
| IaC state | S3 + DynamoDB |
| CI | GitHub Actions OIDC → IAM |
| Obs | CloudWatch + X-Ray |

## Alternativas rejeitadas

| Opção | Motivo |
|-------|--------|
| OCI-first (playbook OPC) | Requisito acadêmico e baseline ADR-002 já em AWS |
| ECS Fargate only | EKS pedido no escopo Fase 3 |
| Multi-cloud | Complexidade OPC sem ganho |

## Decisão

**Aceitar AWS Uso Excepcional** (governance OPC) com destroy pós-demo e single-AZ em homolog para conter custo (R2).

## Critérios de aceite

- [x] Stack Terraform `infra-db` + `infra-k8s`
- [x] Deploy app via OIDC → ECR → EKS
- [x] Sem credenciais estáticas no repositório
