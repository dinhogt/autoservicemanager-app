# Índice de entrega — Tech Challenge Fase 3 (PDF Portal)

| Campo | Valor |
|-------|-------|
| Todo | `docs-delivery-index` |
| Data | 2026-09-06 |
| Uso | Sumário único para o PDF do Portal do Aluno |

## Repositórios GitHub

| # | Propósito | URL |
|---|-----------|-----|
| 1 | Aplicação NestJS + docs canônicos | https://github.com/dinhogt/autoservicemanager-app |
| 2 | Lambda auth CPF | https://github.com/dinhogt/autoservicemanager-auth-lambda |
| 3 | Terraform VPC + RDS | https://github.com/dinhogt/autoservicemanager-infra-db |
| 4 | Terraform EKS / APIGW / obs | https://github.com/dinhogt/autoservicemanager-infra-k8s |

Colaborador FIAP: `soat-architecture` (Read) — confirmar aceite nos 4 remotes.

## Documentação arquitetural (canônica no app)

| Exigência | Artefato |
|-----------|----------|
| Visão / solution design | [solution-design-fase3.md](./solution-design-fase3.md) |
| Diagrama de componentes + sequências (auth, abertura OS, status) | [diagrams-fase3.md](./diagrams-fase3.md) |
| RFC nuvem | [rfc-001-cloud-aws.md](./rfc-001-cloud-aws.md) |
| RFC banco | [rfc-002-mysql-rds.md](./rfc-002-mysql-rds.md) |
| RFC autenticação | [rfc-003-auth-lambda-rs256.md](./rfc-003-auth-lambda-rs256.md) |
| ADR API Gateway / VPC Link | [adr-004-api-gateway-vpc-link.md](./adr-004-api-gateway-vpc-link.md) |
| ADR HPA | [adr-005-hpa.md](./adr-005-hpa.md) |
| ADR logs / correlação | [adr-006-structured-logs-correlation.md](./adr-006-structured-logs-correlation.md) |
| ADR JWT RS256 | [adr-007-jwt-rs256-api-gateway-authorizer.md](./adr-007-jwt-rs256-api-gateway-authorizer.md) |
| ADR Terraform remote state | [adr-008-terraform-remote-state.md](./adr-008-terraform-remote-state.md) |
| ADR GitHub OIDC | [adr-009-github-oidc-aws-iam.md](./adr-009-github-oidc-aws-iam.md) |
| ADR fim Mongo | [adr-010-discontinue-mongodb-audit.md](./adr-010-discontinue-mongodb-audit.md) |
| ADR sync REST via APIGW | [adr-011-sync-rest-api-gateway.md](./adr-011-sync-rest-api-gateway.md) |
| ADR CloudWatch (escolha livre vs Datadog) | [adr-012-cloudwatch-observability.md](./adr-012-cloudwatch-observability.md) |
| RFC notificações SNS/SES | [rfc-004-notifications-sns-ses.md](./rfc-004-notifications-sns-ses.md) |
| ER + justificativa + relacionamentos | [er-diagram.md](./er-diagram.md) |
| Mapa de riscos | [risk-map-fase3.md](./risk-map-fase3.md) |
| Observabilidade | [../observability/](../observability/) |
| Segurança / threat model | [../security/threat-model.md](../security/threat-model.md) |
| Runbooks | [../runbook.md](../runbook.md) · [../runbook-deploy-eks.md](../runbook-deploy-eks.md) |
| Contrato API / Postman | [../backend/api-contract.md](../backend/api-contract.md) · [../postman/](../postman/) |
| QA | [../qa/validation-report.md](../qa/validation-report.md) |

## READMEs por repositório

| Repo | README |
|------|--------|
| app | https://github.com/dinhogt/autoservicemanager-app#readme |
| auth-lambda | https://github.com/dinhogt/autoservicemanager-auth-lambda#readme |
| infra-db | https://github.com/dinhogt/autoservicemanager-infra-db#readme |
| infra-k8s | https://github.com/dinhogt/autoservicemanager-infra-k8s#readme |

## Vídeo e Portal

| Item | Status / link |
|------|----------------|
| Vídeo ≤15 min (YouTube/Vimeo) | Roteiro: [../delivery/video-script.md](../delivery/video-script.md) — URL _após gravação_ |
| PDF Portal | [../delivery/portal-entrega.md](../delivery/portal-entrega.md) (+ Print/PDF) |
| Confirmação `soat-architecture` nos 4 repos | Convites Read **enviados**; aceite **pendente** |
| Bootstrap AWS sem apply | [../infrastructure/aws-bootstrap-no-apply.md](../infrastructure/aws-bootstrap-no-apply.md) |
